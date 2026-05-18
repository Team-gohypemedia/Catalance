import crypto from "crypto";
import { Prisma, prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/app-error.js";
import {
  engagementRules,
  isAdminQuestionApprovalEnabled,
  isEngagementMvpEnabled
} from "../config/engagement-rules.config.js";
import {
  buildQuestionContentHash,
  ensureFallbackQuestionBank
} from "./question-bank.service.js";
import {
  generateCommonAiQuestionSet,
  generatePersonalizedAiQuestion
} from "./engagement-ai.service.js";
import {
  getDayKeyAgeInDays,
  getNextUtcResetAt,
  getPreviousUtcDayKey,
  getUtcDayKey
} from "../utils/day-key.js";

const CATEGORY_LABELS = Object.freeze({
  CLIENT_COMMUNICATION: "Client communication",
  SCOPE_MANAGEMENT: "Scope management",
  DELIVERY: "Delivery",
  QUALITY_CONTROL: "Quality control",
  PLATFORM_RULES: "Platform rules",
  BUSINESS_BASICS: "Business basics"
});

const ENGAGEMENT_CONTESTS_CATALOG_KEY = "engagement_contests";
const ENGAGEMENT_CONTEST_SUBMISSIONS_CATALOG_KEY = "engagement_contest_submissions";
const PERSONALIZED_QUESTION_TABLE = `"EngagementPersonalizedQuestion"`;

const LEVEL_LABELS = Object.freeze(
  Object.fromEntries(engagementRules.levels.map((level) => [level.key, level.label]))
);

const normalizeText = (value) => String(value || "").trim();

const DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const normalizeDayKey = (value, fallback = null) => {
  const normalized = normalizeText(value);
  if (!normalized) return fallback;
  if (!DAY_KEY_PATTERN.test(normalized)) {
    throw new AppError("Invalid date. Expected YYYY-MM-DD.", 400);
  }

  const date = new Date(`${normalized}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || getUtcDayKey(date) !== normalized) {
    throw new AppError("Invalid calendar date.", 400);
  }

  return normalized;
};

const getMaxAttemptsPerDay = () =>
  Math.max(1, Number(engagementRules.dailyChallenge.maxAttemptsPerDay) || 1);

const ensureEnabled = () => {
  if (!isEngagementMvpEnabled()) {
    throw new AppError("Daily Growth Quest is not enabled yet.", 404);
  }
};

const normalizeQuestionType = (value = "MCQ") => {
  const normalized = String(value || "MCQ").trim().toUpperCase();
  if (["MCQ", "TRUE_FALSE", "SCENARIO_MCQ"].includes(normalized)) {
    return normalized;
  }
  return "MCQ";
};

const normalizeCategory = (value = "") => {
  const normalized = String(value || "").trim().toUpperCase();
  if (engagementRules.categories.includes(normalized)) return normalized;
  return "CLIENT_COMMUNICATION";
};

const normalizeDifficulty = (value = "BEGINNER") => {
  const normalized = String(value || "BEGINNER").trim().toUpperCase();
  if (engagementRules.difficulties.includes(normalized)) return normalized;
  return "BEGINNER";
};

const categoryLabel = (category) =>
  CATEGORY_LABELS[category] || normalizeText(category).replace(/_/g, " ");

const normalizeCatalogPayloadArray = (value) =>
  Array.isArray(value) ? value : [];

const slugifyKey = (value = "") =>
  normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);

const normalizeNonNegativeInt = (value, fallback = 0) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return Math.max(0, Number(fallback) || 0);
  return Math.max(0, Math.round(numeric));
};

const normalizeJsonValue = (value, fallback = null) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
};

const ensurePersonalizedQuestionStore = async (client = prisma) => {
  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS ${PERSONALIZED_QUESTION_TABLE} (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "dayKey" TEXT NOT NULL,
      "questionId" TEXT,
      "questionText" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "difficulty" TEXT NOT NULL,
      "skillTag" TEXT,
      "focusReason" TEXT,
      "generationSource" TEXT NOT NULL DEFAULT 'fallback',
      "sourceReportSnapshot" JSONB NOT NULL DEFAULT '{}'::jsonb,
      "aiMetadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await client.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "EngagementPersonalizedQuestion_userId_dayKey_key"
    ON ${PERSONALIZED_QUESTION_TABLE} ("userId", "dayKey");
  `);
  await client.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "EngagementPersonalizedQuestion_dayKey_idx"
    ON ${PERSONALIZED_QUESTION_TABLE} ("dayKey");
  `);
};

const serializePersonalizedQuestionRecord = (row) => ({
  id: row.id,
  userId: row.userId,
  userName: row.userName || null,
  userEmail: row.userEmail || null,
  dayKey: row.dayKey,
  questionId: row.questionId || null,
  questionText: row.questionText,
  category: row.category,
  categoryLabel: categoryLabel(row.category),
  difficulty: row.difficulty,
  skillTag: row.skillTag || "",
  focusReason: row.focusReason || "",
  generationSource: row.generationSource || "fallback",
  sourceReportSnapshot: normalizeJsonValue(row.sourceReportSnapshot, {}) || {},
  aiMetadata: normalizeJsonValue(row.aiMetadata, {}) || {},
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
});

const buildContestBadgeConfig = (payload = {}, existing = null) => {
  const badgeTitle = normalizeText(payload.badgeTitle ?? existing?.badgeTitle);
  const badgeDescription = normalizeText(
    payload.badgeDescription ?? existing?.badgeDescription
  );
  const badgeIcon = normalizeText(payload.badgeIcon ?? existing?.badgeIcon) || "award";
  const badgeKeyInput = normalizeText(payload.badgeKey ?? existing?.badgeKey);
  const badgeKey =
    badgeTitle || badgeKeyInput
      ? slugifyKey(badgeKeyInput || `contest_${badgeTitle}`)
      : "";

  if (!badgeTitle) {
    return {
      badgeKey: "",
      badgeTitle: "",
      badgeDescription: "",
      badgeIcon: "award"
    };
  }

  return {
    badgeKey: badgeKey || `contest_badge_${crypto.randomUUID().slice(0, 8)}`,
    badgeTitle,
    badgeDescription:
      badgeDescription || `Awarded for standout work in ${badgeTitle}.`,
    badgeIcon
  };
};

const stableHashNumber = (value = "") => {
  const digest = crypto.createHash("sha256").update(String(value)).digest("hex");
  return parseInt(digest.slice(0, 8), 16);
};

const rotateByDay = (items, dayKey) => {
  if (!items.length) return [];
  const offset = stableHashNumber(dayKey) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
};

const sortOptionsForDay = (options = [], dayKey, questionId) =>
  [...options].sort((a, b) => {
    const aScore = stableHashNumber(`${dayKey}:${questionId}:${a?.id || ""}`);
    const bScore = stableHashNumber(`${dayKey}:${questionId}:${b?.id || ""}`);
    return aScore - bScore;
  });

const sortQuestionsForSeed = (questions = [], seed) =>
  [...questions].sort((left, right) => {
    const leftScore = stableHashNumber(`${seed}:${left.id}`);
    const rightScore = stableHashNumber(`${seed}:${right.id}`);
    if (leftScore !== rightScore) return leftScore - rightScore;
    return String(left.id).localeCompare(String(right.id));
  });

const derivePersonalizedDifficulty = ({ profile, report }) => {
  const levelKey = normalizeText(profile?.engagementLevel).toUpperCase();
  const rollingAccuracy = Number(report?.rollingAccuracy || 0);

  if (["LEVEL_4", "GOLD"].includes(levelKey) || rollingAccuracy >= 85) {
    return "ADVANCED";
  }
  if (levelKey === "LEVEL_3" || rollingAccuracy >= 65) {
    return "INTERMEDIATE";
  }
  return "BEGINNER";
};

const derivePersonalizedCategories = ({ userId, dayKey, report }) => {
  const weakTopics = Array.isArray(report?.weakTopics)
    ? report.weakTopics.filter((topic) => engagementRules.categories.includes(topic))
    : [];
  const recommendedTopic = engagementRules.categories.includes(report?.recommendedNextTopic)
    ? [report.recommendedNextTopic]
    : [];
  const fallbackTopics = rotateByDay(engagementRules.categories, `${userId}:${dayKey}`);

  return [...new Set([...weakTopics, ...recommendedTopic, ...fallbackTopics])];
};

const sanitizeQuestionForClient = (question, dayKey) => ({
  id: question.id,
  questionText: question.questionText,
  type: question.type,
  category: question.category,
  categoryLabel: categoryLabel(question.category),
  skillTag: question.skillTag,
  difficulty: question.difficulty,
  questionVariant: question.questionVariant || "common",
  focusReason: question.focusReason || "",
  options: sortOptionsForDay(question.options || [], dayKey, question.id)
});

const toSafeQuestionRecord = (question) => ({
  id: question.id,
  questionText: question.questionText,
  type: question.type,
  category: question.category,
  categoryLabel: categoryLabel(question.category),
  skillTag: question.skillTag,
  difficulty: question.difficulty,
  options: question.options || [],
  correctOptionId: question.correctOptionId,
  explanation: question.explanation,
  source: question.source,
  status: question.status,
  usageCount: question.usageCount,
  successRate: question.successRate,
  rejectedReason: question.rejectedReason,
  approvedAt: question.approvedAt,
  approvedBy: question.approvedBy
    ? {
        id: question.approvedBy.id,
        fullName: question.approvedBy.fullName,
        email: question.approvedBy.email
      }
    : null,
  createdAt: question.createdAt,
  updatedAt: question.updatedAt
});

const serializeDailySet = (dailySet, questionBank = new Map()) => ({
  id: dailySet.id,
  dayKey: dailySet.dayKey,
  status: dailySet.status,
  generatedBy: dailySet.generatedBy,
  publishedAt: dailySet.publishedAt,
  createdAt: dailySet.createdAt,
  updatedAt: dailySet.updatedAt,
  questionIds: Array.isArray(dailySet.questionIds) ? dailySet.questionIds : [],
  questionCount: Array.isArray(dailySet.questionIds) ? dailySet.questionIds.length : 0,
  approvedBy: dailySet.approvedBy
    ? {
        id: dailySet.approvedBy.id,
        fullName: dailySet.approvedBy.fullName,
        email: dailySet.approvedBy.email
      }
    : null,
  questions: Array.isArray(dailySet.questionIds)
    ? dailySet.questionIds
        .map((questionId) => questionBank.get(questionId))
        .filter(Boolean)
        .map((question) => ({
          id: question.id,
          questionText: question.questionText,
          category: question.category,
          categoryLabel: categoryLabel(question.category),
          difficulty: question.difficulty
        }))
    : []
});

const normalizeContestStatus = (value = "DRAFT") => {
  const normalized = normalizeText(value).toUpperCase();
  if (["DRAFT", "PUBLISHED", "ARCHIVED"].includes(normalized)) {
    return normalized;
  }
  return "DRAFT";
};

const serializeContest = (contest) => ({
  id: contest.id,
  title: contest.title,
  description: contest.description,
  detailsContent: contest.detailsContent || contest.description,
  imageUrl: contest.imageUrl || "",
  category: contest.category,
  ctaLabel: contest.ctaLabel || "View Contest",
  goalSummary: contest.goalSummary || "",
  submissionInstructions: contest.submissionInstructions || "",
  rewardSummary: contest.rewardSummary || "",
  deliverables: normalizeStringList(contest.deliverables),
  reviewCriteria: normalizeStringList(contest.reviewCriteria),
  resourceLinks: normalizeLinkList(contest.resourceLinks),
  acceptedAssetTypes: normalizeStringList(contest.acceptedAssetTypes),
  maxAttachments: Number(contest.maxAttachments || 0) || 0,
  rewardCoins: normalizeNonNegativeInt(contest.rewardCoins),
  rewardXp: normalizeNonNegativeInt(contest.rewardXp),
  badgeKey: normalizeText(contest.badgeKey),
  badgeTitle: normalizeText(contest.badgeTitle),
  badgeDescription: normalizeText(contest.badgeDescription),
  badgeIcon: normalizeText(contest.badgeIcon) || "award",
  startDayKey: contest.startDayKey,
  endDayKey: contest.endDayKey || null,
  status: normalizeContestStatus(contest.status),
  createdAt: contest.createdAt || null,
  updatedAt: contest.updatedAt || null
});

const normalizeSubmissionStatus = (value = "PENDING") => {
  const normalized = normalizeText(value).toUpperCase();
  if (["PENDING", "APPROVED", "NEEDS_CHANGES", "REJECTED"].includes(normalized)) {
    return normalized;
  }
  return "PENDING";
};

const normalizeSubmissionLinks = (value = []) =>
  (Array.isArray(value) ? value : [])
    .map((link) => ({
      label: normalizeText(link?.label) || "Link",
      url: normalizeText(link?.url)
    }))
    .filter((link) => link.url);

const normalizeSubmissionAttachments = (value = []) =>
  (Array.isArray(value) ? value : [])
    .map((attachment) => ({
      url: normalizeText(attachment?.url),
      name: normalizeText(attachment?.name) || "Attachment",
      type: normalizeText(attachment?.type),
      size: Number(attachment?.size || 0)
    }))
    .filter((attachment) => attachment.url);

const normalizeStringList = (value = []) =>
  (Array.isArray(value) ? value : [])
    .map((item) => normalizeText(item))
    .filter(Boolean);

const normalizeLinkList = (value = []) =>
  (Array.isArray(value) ? value : [])
    .map((link) => ({
      label: normalizeText(link?.label) || "Reference",
      url: normalizeText(link?.url)
    }))
    .filter((link) => link.url);

const serializeContestSubmission = (submission, contestById = new Map()) => ({
  id: submission.id,
  contestId: submission.contestId,
  contestTitle: submission.contestTitle || contestById.get(submission.contestId)?.title || "Contest",
  userId: submission.userId,
  userName: submission.userName,
  userEmail: submission.userEmail,
  title: submission.title,
  githubUrl: submission.githubUrl || "",
  portfolioUrl: submission.portfolioUrl || "",
  otherLinks: normalizeSubmissionLinks(submission.otherLinks),
  notes: submission.notes || "",
  attachments: normalizeSubmissionAttachments(submission.attachments),
  status: normalizeSubmissionStatus(submission.status),
  reviewNote: submission.reviewNote || "",
  rewardCoins: normalizeNonNegativeInt(submission.rewardCoins),
  rewardXp: normalizeNonNegativeInt(submission.rewardXp),
  badgeKey: normalizeText(submission.badgeKey),
  badgeTitle: normalizeText(submission.badgeTitle),
  badgeDescription: normalizeText(submission.badgeDescription),
  badgeIcon: normalizeText(submission.badgeIcon) || "award",
  rewardTransferredAt: submission.rewardTransferredAt || null,
  rewardTransferredBy: submission.rewardTransferredBy || null,
  reviewedBy: submission.reviewedBy || null,
  reviewedAt: submission.reviewedAt || null,
  createdAt: submission.createdAt || null,
  updatedAt: submission.updatedAt || null
});

const ensureFreelancerUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, roles: true, status: true }
  });

  const roles = new Set([
    String(user?.role || "").toUpperCase(),
    ...(Array.isArray(user?.roles)
      ? user.roles.map((role) => String(role || "").toUpperCase())
      : [])
  ]);

  if (!user || !roles.has("FREELANCER")) {
    throw new AppError("Freelancer access required.", 403);
  }

  if (user.status === "SUSPENDED") {
    throw new AppError("Suspended accounts cannot complete Growth Quests.", 403);
  }

  return user;
};

const getFreelancerPersonalizationContext = async ({
  userId,
  profile,
  report,
  client = prisma
}) => {
  const user = await client.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      freelancerProfile: {
        select: {
          services: true,
          serviceCategory: true,
          serviceTitle: true,
          serviceKeywords: true,
          experienceYears: true
        }
      }
    }
  });

  const recommendedTopic = normalizeText(report?.recommendedNextTopic).toUpperCase();
  const weakTopics = Array.isArray(report?.weakTopics) ? report.weakTopics : [];
  const strongTopics = Array.isArray(report?.strongTopics) ? report.strongTopics : [];
  const services = Array.isArray(user?.freelancerProfile?.services)
    ? user.freelancerProfile.services.slice(0, 8)
    : [];
  const serviceKeywords = Array.isArray(user?.freelancerProfile?.serviceKeywords)
    ? user.freelancerProfile.serviceKeywords.slice(0, 10)
    : [];

  return {
    userId,
    fullName: user?.fullName || "Freelancer",
    email: user?.email || "",
    engagementLevel: profile?.engagementLevel || "LEVEL_1",
    engagementLevelLabel: LEVEL_LABELS[profile?.engagementLevel] || "Starter",
    difficulty: derivePersonalizedDifficulty({ profile, report }),
    recommendedTopic:
      engagementRules.categories.includes(recommendedTopic) ? recommendedTopic : "CLIENT_COMMUNICATION",
    weakTopics: weakTopics.filter((topic) => engagementRules.categories.includes(topic)).slice(0, 3),
    strongTopics: strongTopics.filter((topic) => engagementRules.categories.includes(topic)).slice(0, 3),
    rollingAccuracy: Math.round(Number(report?.rollingAccuracy || 0)),
    rolling7DayAccuracy: Math.round(Number(report?.rolling7DayAccuracy || 0)),
    currentStreak: Number(profile?.currentStreak || 0),
    longestStreak: Number(profile?.longestStreak || 0),
    experienceYears: Number(user?.freelancerProfile?.experienceYears || 0),
    services,
    serviceCategory: normalizeText(user?.freelancerProfile?.serviceCategory),
    serviceTitle: normalizeText(user?.freelancerProfile?.serviceTitle),
    serviceKeywords
  };
};

const listRecentPersonalizedQuestionTexts = async (userId, client = prisma) => {
  await ensurePersonalizedQuestionStore(client);
  const rows = await client.$queryRaw`
    SELECT "questionText"
    FROM "EngagementPersonalizedQuestion"
    WHERE "userId" = ${userId}
    ORDER BY "createdAt" DESC
    LIMIT 12
  `;
  return rows.map((row) => normalizeText(row.questionText)).filter(Boolean);
};

const getStoredPersonalizedQuestionRecord = async ({ userId, dayKey, client = prisma }) => {
  await ensurePersonalizedQuestionStore(client);
  const rows = await client.$queryRaw`
    SELECT *
    FROM "EngagementPersonalizedQuestion"
    WHERE "userId" = ${userId} AND "dayKey" = ${dayKey}
    ORDER BY "createdAt" DESC
    LIMIT 1
  `;
  return rows[0] ? serializePersonalizedQuestionRecord(rows[0]) : null;
};

const savePersonalizedQuestionRecord = async ({
  userId,
  dayKey,
  question,
  generationSource,
  sourceReportSnapshot,
  aiMetadata = {},
  client = prisma
}) => {
  await ensurePersonalizedQuestionStore(client);
  const id = `epq_${crypto.randomUUID()}`;
  const snapshotJson = JSON.stringify(sourceReportSnapshot || {});
  const metadataJson = JSON.stringify(aiMetadata || {});

  await client.$executeRaw`
    INSERT INTO "EngagementPersonalizedQuestion" (
      "id",
      "userId",
      "dayKey",
      "questionId",
      "questionText",
      "category",
      "difficulty",
      "skillTag",
      "focusReason",
      "generationSource",
      "sourceReportSnapshot",
      "aiMetadata",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${id},
      ${userId},
      ${dayKey},
      ${question?.id || null},
      ${question.questionText},
      ${question.category},
      ${question.difficulty},
      ${question.skillTag || ""},
      ${question.focusReason || ""},
      ${generationSource},
      ${snapshotJson}::jsonb,
      ${metadataJson}::jsonb,
      NOW(),
      NOW()
    )
    ON CONFLICT ("userId", "dayKey")
    DO UPDATE SET
      "questionId" = EXCLUDED."questionId",
      "questionText" = EXCLUDED."questionText",
      "category" = EXCLUDED."category",
      "difficulty" = EXCLUDED."difficulty",
      "skillTag" = EXCLUDED."skillTag",
      "focusReason" = EXCLUDED."focusReason",
      "generationSource" = EXCLUDED."generationSource",
      "sourceReportSnapshot" = EXCLUDED."sourceReportSnapshot",
      "aiMetadata" = EXCLUDED."aiMetadata",
      "updatedAt" = NOW()
  `;

  return getStoredPersonalizedQuestionRecord({ userId, dayKey, client });
};

export const ensureCoreBadges = async (client = prisma) => {
  await client.engagementBadge.createMany({
    data: engagementRules.badges.map((badge) => ({
      key: badge.key,
      title: badge.title,
      description: badge.description,
      milestoneDays: badge.days,
      icon: badge.icon
    })),
    skipDuplicates: true
  });
};

const ensureBadgeDefinition = async (badge, client = prisma) => {
  const badgeKey = normalizeText(badge?.badgeKey || badge?.key);
  const badgeTitle = normalizeText(badge?.badgeTitle || badge?.title);

  if (!badgeKey || !badgeTitle) return null;

  return client.engagementBadge.upsert({
    where: { key: badgeKey },
    create: {
      key: badgeKey,
      title: badgeTitle,
      description:
        normalizeText(badge?.badgeDescription || badge?.description) ||
        `Awarded for completing ${badgeTitle}.`,
      icon: normalizeText(badge?.badgeIcon || badge?.icon) || "award"
    },
    update: {
      title: badgeTitle,
      description:
        normalizeText(badge?.badgeDescription || badge?.description) ||
        `Awarded for completing ${badgeTitle}.`,
      icon: normalizeText(badge?.badgeIcon || badge?.icon) || "award"
    }
  });
};

const ensureProfile = (userId, client = prisma) =>
  client.engagementProfile.upsert({
    where: { userId },
    create: { userId },
    update: {}
  });

const calculateEngagementLevel = ({
  lifetimeXp,
  completedDays,
  rollingAccuracy,
  currentStreak,
  adminSafeProfile = false
}) => {
  const eligible = engagementRules.levels
    .filter((level) => {
      if (level.requiresAdminSafeProfile && !adminSafeProfile) return false;
      if (Number(lifetimeXp || 0) < level.minXp) return false;
      if (Number(completedDays || 0) < level.completedDays) return false;
      if (Number(rollingAccuracy || 0) < level.rollingAccuracy) return false;
      if (Number(currentStreak || 0) < level.streak) return false;
      return true;
    })
    .at(-1);

  return eligible?.key || "LEVEL_1";
};

const buildLevelProgress = (profile, report) => {
  const currentIndex = Math.max(
    0,
    engagementRules.levels.findIndex((level) => level.key === profile.engagementLevel)
  );
  const current = engagementRules.levels[currentIndex] || engagementRules.levels[0];
  const next = engagementRules.levels[currentIndex + 1] || null;

  if (!next) {
    return {
      current: { key: current.key, label: current.label },
      next: null,
      xpToNext: 0,
      percent: 100
    };
  }

  const previousXp = current.minXp;
  const nextXp = next.minXp;
  const span = Math.max(1, nextXp - previousXp);
  const percent = Math.max(
    0,
    Math.min(100, Math.round(((profile.lifetimeXp - previousXp) / span) * 100))
  );

  return {
    current: { key: current.key, label: current.label },
    next: {
      key: next.key,
      label: next.label,
      minXp: next.minXp,
      completedDays: next.completedDays,
      rollingAccuracy: next.rollingAccuracy,
      streak: next.streak
    },
    xpToNext: Math.max(0, next.minXp - Number(profile.lifetimeXp || 0)),
    percent,
    rollingAccuracy: Math.round(Number(report?.rollingAccuracy || 0))
  };
};

const buildNextMilestone = (currentStreak = 0) => {
  const nextBadge = engagementRules.badges.find(
    (badge) => Number(currentStreak || 0) < badge.days
  );

  if (!nextBadge) {
    return {
      label: "Monthly consistency unlocked",
      daysRemaining: 0,
      targetDays: 30
    };
  }

  const daysRemaining = Math.max(0, nextBadge.days - Number(currentStreak || 0));
  return {
    key: nextBadge.key,
    label: `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} to ${nextBadge.title}`,
    daysRemaining,
    targetDays: nextBadge.days
  };
};

const updateProcessReport = async ({
  client,
  userId,
  answerDetails,
  profileTotals
}) => {
  const existing = await client.engagementProcessReport.findUnique({
    where: { userId }
  });
  const topicStats = { ...(existing?.topicStats || {}) };

  answerDetails.forEach((answer) => {
    const key = answer.category;
    const current = topicStats[key] || {
      attempted: 0,
      correct: 0,
      accuracy: 0
    };
    const attempted = Number(current.attempted || 0) + 1;
    const correct = Number(current.correct || 0) + (answer.isCorrect ? 1 : 0);
    topicStats[key] = {
      attempted,
      correct,
      accuracy: attempted > 0 ? Math.round((correct / attempted) * 100) : 0
    };
  });

  const sortedTopics = Object.entries(topicStats)
    .filter(([, stat]) => Number(stat.attempted || 0) >= 2)
    .sort((a, b) => Number(a[1].accuracy || 0) - Number(b[1].accuracy || 0));
  const weakTopics = sortedTopics
    .filter(([, stat]) => Number(stat.accuracy || 0) < 75)
    .slice(0, 3)
    .map(([topic]) => topic);
  const strongTopics = sortedTopics
    .filter(([, stat]) => Number(stat.accuracy || 0) >= 80)
    .slice(-3)
    .map(([topic]) => topic)
    .reverse();
  const rollingAccuracy =
    profileTotals.totalQuestionsAnswered > 0
      ? Math.round(
          (profileTotals.totalCorrectAnswers /
            profileTotals.totalQuestionsAnswered) *
            100
        )
      : 0;
  const recentSessions = await client.engagementAnswerSession.findMany({
    where: { userId },
    orderBy: { dayKey: "desc" },
    take: 6,
    select: { correctCount: true, questionCount: true }
  });
  const recentTotals = recentSessions.reduce(
    (acc, session) => ({
      correct: acc.correct + Number(session.correctCount || 0),
      total: acc.total + Number(session.questionCount || 0)
    }),
    {
      correct: answerDetails.filter((answer) => answer.isCorrect).length,
      total: answerDetails.length
    }
  );
  const rolling7DayAccuracy =
    recentTotals.total > 0
      ? Math.round((recentTotals.correct / recentTotals.total) * 100)
      : rollingAccuracy;

  return client.engagementProcessReport.upsert({
    where: { userId },
    create: {
      userId,
      rollingAccuracy,
      rolling7DayAccuracy,
      topicStats,
      weakTopics,
      strongTopics,
      recommendedNextTopic:
        weakTopics[0] || strongTopics[0] || null
    },
    update: {
      rollingAccuracy,
      rolling7DayAccuracy,
      topicStats,
      weakTopics,
      strongTopics,
      recommendedNextTopic:
        weakTopics[0] || strongTopics[0] || null
    }
  });
};

const buildProcessSummary = (report) => {
  const topicStats = report?.topicStats || {};
  const strong = report?.strongTopics?.[0] || null;
  const weak = report?.weakTopics?.[0] || report?.recommendedNextTopic || null;

  return {
    rollingAccuracy: Math.round(Number(report?.rollingAccuracy || 0)),
    rolling7DayAccuracy: Math.round(Number(report?.rolling7DayAccuracy || 0)),
    strongArea: strong
      ? {
          key: strong,
          label: categoryLabel(strong),
          accuracy: Number(topicStats?.[strong]?.accuracy || 0)
        }
      : null,
    weakArea: weak
      ? {
          key: weak,
          label: categoryLabel(weak),
          accuracy: Number(topicStats?.[weak]?.accuracy || 0)
        }
      : null,
    recommendedNextTopic: report?.recommendedNextTopic
      ? {
          key: report.recommendedNextTopic,
          label: categoryLabel(report.recommendedNextTopic)
        }
      : null
  };
};

const buildTopicPerformance = (report) => {
  const topicStats = report?.topicStats || {};

  return Object.entries(topicStats)
    .map(([key, stat]) => {
      const attempted = Number(stat?.attempted || 0);
      const correct = Number(stat?.correct || 0);
      const accuracy =
        attempted > 0
          ? Math.round((correct / attempted) * 100)
          : Math.round(Number(stat?.accuracy || 0));

      return {
        key,
        label: categoryLabel(key),
        attempted,
        correct,
        accuracy
      };
    })
    .filter((entry) => entry.attempted > 0)
    .sort((a, b) => {
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      return b.attempted - a.attempted;
    });
};

const serializeRecentSession = (session) => ({
  id: session.id,
  dayKey: session.dayKey,
  createdAt: session.createdAt,
  accuracy: Math.round(Number(session.accuracy || 0)),
  correctCount: Number(session.correctCount || 0),
  questionCount: Number(session.questionCount || 0),
  xpAwarded: Number(session.xpAwarded || 0),
  coinsAwarded: Number(session.coinsAwarded || 0),
  streakApplied: Boolean(session.streakApplied)
});

const buildBadgePayload = async (userId) => {
  await ensureCoreBadges();
  const [badges, earned] = await Promise.all([
    prisma.engagementBadge.findMany({
      orderBy: [{ milestoneDays: "asc" }, { createdAt: "asc" }]
    }),
    prisma.engagementUserBadge.findMany({
      where: { userId },
      select: { key: true, earnedAt: true }
    })
  ]);
  const earnedMap = new Map(earned.map((badge) => [badge.key, badge.earnedAt]));

  return badges.map((badge) => ({
    key: badge.key,
    title: badge.title,
    description: badge.description,
    milestoneDays: badge.milestoneDays,
    icon: badge.icon,
    earned: earnedMap.has(badge.key),
    earnedAt: earnedMap.get(badge.key) || null
  }));
};

const buildWeeklyLeaderboardPayload = async (currentUserId) => {
  const rangeStart = new Date();
  rangeStart.setUTCDate(rangeStart.getUTCDate() - 6);
  rangeStart.setUTCHours(0, 0, 0, 0);

  const [sessions, profiles, users, earnedBadges] = await Promise.all([
    prisma.engagementAnswerSession.findMany({
      where: { createdAt: { gte: rangeStart } },
      select: {
        userId: true,
        xpAwarded: true,
        coinsAwarded: true
      }
    }),
    prisma.engagementProfile.findMany({
      select: {
        userId: true,
        lifetimeXp: true,
        loyaltyCoins: true,
        currentStreak: true,
        engagementLevel: true
      }
    }),
    prisma.user.findMany({
      where: { role: "FREELANCER" },
      select: { id: true, fullName: true, email: true }
    }),
    prisma.engagementUserBadge.findMany({
      where: { earnedAt: { gte: rangeStart } },
      select: { userId: true, key: true }
    })
  ]);

  const weeklyMap = new Map();
  const upsertWeeklyEntry = (userId) => {
    if (!weeklyMap.has(userId)) {
      weeklyMap.set(userId, {
        userId,
        weeklyXp: 0,
        weeklyCoins: 0,
        contestWins: 0,
        badgesEarned: 0
      });
    }
    return weeklyMap.get(userId);
  };

  sessions.forEach((session) => {
    const entry = upsertWeeklyEntry(session.userId);
    entry.weeklyXp += normalizeNonNegativeInt(session.xpAwarded);
    entry.weeklyCoins += normalizeNonNegativeInt(session.coinsAwarded);
  });

  const { submissions } = await getEngagementContestSubmissionCatalog();
  submissions.forEach((submission) => {
    const rewardedAt = submission.rewardTransferredAt
      ? new Date(submission.rewardTransferredAt)
      : null;
    if (!rewardedAt || Number.isNaN(rewardedAt.getTime()) || rewardedAt < rangeStart) {
      return;
    }

    const entry = upsertWeeklyEntry(submission.userId);
    entry.weeklyXp += normalizeNonNegativeInt(submission.rewardXp);
    entry.weeklyCoins += normalizeNonNegativeInt(submission.rewardCoins);
    if (normalizeSubmissionStatus(submission.status) === "APPROVED") {
      entry.contestWins += 1;
    }
  });

  earnedBadges.forEach((badge) => {
    const entry = upsertWeeklyEntry(badge.userId);
    entry.badgesEarned += 1;
  });

  upsertWeeklyEntry(currentUserId);

  const profileByUserId = new Map(profiles.map((profile) => [profile.userId, profile]));
  const userById = new Map(users.map((user) => [user.id, user]));

  const ranked = [...weeklyMap.values()]
    .map((entry) => {
      const profile = profileByUserId.get(entry.userId);
      const user = userById.get(entry.userId);
      return {
        ...entry,
        fullName: user?.fullName || "Unknown freelancer",
        email: user?.email || "",
        lifetimeXp: normalizeNonNegativeInt(profile?.lifetimeXp),
        loyaltyCoins: normalizeNonNegativeInt(profile?.loyaltyCoins),
        currentStreak: normalizeNonNegativeInt(profile?.currentStreak),
        engagementLevel: profile?.engagementLevel || "LEVEL_1",
        engagementLevelLabel:
          LEVEL_LABELS[profile?.engagementLevel] || "Starter"
      };
    })
    .sort((left, right) => {
      if (right.weeklyXp !== left.weeklyXp) return right.weeklyXp - left.weeklyXp;
      if (right.weeklyCoins !== left.weeklyCoins) {
        return right.weeklyCoins - left.weeklyCoins;
      }
      return right.lifetimeXp - left.lifetimeXp;
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

  return {
    weekStartDayKey: getUtcDayKey(rangeStart),
    entries: ranked.slice(0, 10),
    currentUser:
      ranked.find((entry) => entry.userId === currentUserId) || null
  };
};

const buildDashboardPayload = async ({ userId, dayKey = getUtcDayKey() }) => {
  const [profile, report, todaySessions, recentSessions, badges, contests, leaderboard] =
    await Promise.all([
      ensureProfile(userId),
      prisma.engagementProcessReport.findUnique({ where: { userId } }),
      prisma.engagementAnswerSession.findMany({
      where: { userId, dayKey },
      orderBy: { createdAt: "desc" }
    }),
    prisma.engagementAnswerSession.findMany({
      where: { userId },
      orderBy: [{ createdAt: "desc" }],
      take: 8
      }),
      buildBadgePayload(userId),
      listVisibleContestsForDay(dayKey),
      buildWeeklyLeaderboardPayload(userId)
    ]);

  const levelProgress = buildLevelProgress(profile, report);
  const latestSession = todaySessions[0] || null;
  const maxAttempts = getMaxAttemptsPerDay();
  const isCompleted =
    todaySessions.length >= maxAttempts || latestSession?.accuracy === 100;
  const processSummary = buildProcessSummary(report);
  const topicPerformance = buildTopicPerformance(report);
  const totalQuestionsAnswered = Number(profile.totalQuestionsAnswered || 0);
  const totalCorrectAnswers = Number(profile.totalCorrectAnswers || 0);
  const lifetimeAccuracy =
    totalQuestionsAnswered > 0
      ? Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100)
      : 0;

  return {
    profile: {
      engagementLevel: profile.engagementLevel,
      engagementLevelLabel: LEVEL_LABELS[profile.engagementLevel] || "Starter",
      xp: profile.xp,
      lifetimeXp: profile.lifetimeXp,
      loyaltyCoins: profile.loyaltyCoins,
      currentStreak: profile.currentStreak,
      longestStreak: profile.longestStreak,
      dailyCompletionCount: profile.dailyCompletionCount,
      totalQuestionsAnswered: profile.totalQuestionsAnswered,
      totalCorrectAnswers: profile.totalCorrectAnswers,
      badges,
      currentWeeklyRank: leaderboard?.currentUser?.rank || null,
      weeklyXp: leaderboard?.currentUser?.weeklyXp || 0,
      weeklyCoins: leaderboard?.currentUser?.weeklyCoins || 0
    },
    today: {
      dayKey,
      status: isCompleted ? "completed" : "not_started",
      completedAt: latestSession?.createdAt || null,
      resultSummary: latestSession?.resultSummary || null,
      nextResetAt: getNextUtcResetAt(dayKey),
      attemptsUsed: todaySessions.length,
      maxAttempts
    },
    levelProgress,
    nextMilestone: buildNextMilestone(profile.currentStreak),
    badges,
    processSummary,
    topicPerformance,
    contests,
    leaderboard,
    recentSessions: recentSessions.map(serializeRecentSession),
    activity: {
      completedDays: Number(profile.dailyCompletionCount || 0),
      totalQuestionsAnswered,
      totalCorrectAnswers,
      lifetimeAccuracy
    }
  };
};

const selectQuestionsForDay = async (dayKey) => {
  await ensureFallbackQuestionBank();
  const approved = await prisma.engagementQuestion.findMany({
    where: { status: "APPROVED" },
    orderBy: [{ usageCount: "asc" }, { createdAt: "asc" }],
    take: 240
  });

  if (approved.length < engagementRules.dailyChallenge.questionCount) {
    throw new AppError("Not enough approved Growth Quest questions.", 503);
  }

  const rotated = rotateByDay(approved, dayKey);
  const selected = [];
  const selectedIds = new Set();

  engagementRules.categories.forEach((category) => {
    const match = rotated.find(
      (question) => question.category === category && !selectedIds.has(question.id)
    );
    if (match && selected.length < engagementRules.dailyChallenge.questionCount) {
      selected.push(match);
      selectedIds.add(match.id);
    }
  });

  rotated.forEach((question) => {
    if (selected.length >= engagementRules.dailyChallenge.questionCount) return;
    if (selectedIds.has(question.id)) return;
    selected.push(question);
    selectedIds.add(question.id);
  });

  return selected.slice(0, engagementRules.dailyChallenge.questionCount);
};

export const generateAndPublishDailyQuestionSet = async (
  dayKey = getUtcDayKey(),
  { forceRegenerate = false } = {}
) => {
  ensureEnabled();
  await ensureFallbackQuestionBank();
  const existing = await prisma.dailyQuestionSet.findUnique({
    where: { dayKey }
  });

  if (
    !forceRegenerate &&
    existing?.questionIds?.length >= engagementRules.dailyChallenge.questionCount
  ) {
    if (existing.status === "PUBLISHED") {
      return existing;
    }

    return prisma.dailyQuestionSet.update({
      where: { id: existing.id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date()
      }
    });
  }

  try {
    const recentQuestionTexts = await listRecentCommonQuestionTexts();
    const aiQuestions = await generateCommonAiQuestionSet({
      dayKey,
      recentQuestionTexts
    });
    const dedupedAiQuestions = [
      ...new Map(
        aiQuestions
          .map((question) => [
            buildQuestionContentHash({
              questionText: question.questionText,
              category: question.category,
              difficulty: question.difficulty,
              correctOptionId: question.correctOptionId
            }),
            question
          ])
          .filter(([hash]) => hash)
      ).values()
    ].slice(0, engagementRules.dailyChallenge.questionCount);

    if (dedupedAiQuestions.length !== engagementRules.dailyChallenge.questionCount) {
      throw new AppError("AI did not return enough valid daily questions.", 502);
    }

    const savedQuestions = [];
    for (const question of dedupedAiQuestions) {
      const saved = await upsertGeneratedQuestion({
        payload: question,
        source: "ai_common",
        status: "APPROVED"
      });
      savedQuestions.push(saved);
    }

    const questionIds = savedQuestions.map((question) => question.id);
    const dailySet = await prisma.dailyQuestionSet.upsert({
      where: { dayKey },
      create: {
        dayKey,
        questionIds,
        status: "PUBLISHED",
        generatedBy: "ai",
        publishedAt: new Date()
      },
      update: {
        questionIds,
        status: "PUBLISHED",
        generatedBy: "ai",
        publishedAt: new Date()
      }
    });
    await prisma.engagementQuestion.updateMany({
      where: { id: { in: questionIds } },
      data: { usageCount: { increment: 1 } }
    });
    return dailySet;
  } catch (error) {
    console.error(`[Engagement] AI daily generation failed for ${dayKey}:`, error?.message || error);
    const questions = await selectQuestionsForDay(dayKey);
    const questionIds = questions.map((question) => question.id);
    const dailySet = await prisma.dailyQuestionSet.upsert({
      where: { dayKey },
      create: {
        dayKey,
        questionIds,
        status: "PUBLISHED",
        generatedBy: "fallback",
        publishedAt: new Date()
      },
      update: {
        questionIds,
        status: "PUBLISHED",
        generatedBy: "fallback",
        publishedAt: new Date()
      }
    });

    await prisma.engagementQuestion.updateMany({
      where: { id: { in: questionIds } },
      data: { usageCount: { increment: 1 } }
    });

    return dailySet;
  }
};

export const ensurePublishedDailySet = async (dayKey = getUtcDayKey()) =>
  generateAndPublishDailyQuestionSet(dayKey);

const loadDailyQuestions = async (dailySet) => {
  const questions = await prisma.engagementQuestion.findMany({
    where: {
      id: { in: dailySet.questionIds },
      status: "APPROVED"
    }
  });
  const byId = new Map(questions.map((question) => [question.id, question]));
  return dailySet.questionIds.map((id) => byId.get(id)).filter(Boolean);
};

const selectPersonalizedQuestion = async ({
  userId,
  dayKey,
  profile,
  report,
  excludedQuestionIds = []
}) => {
  const excludedIds = [...new Set(excludedQuestionIds.filter(Boolean))];
  const approved = await prisma.engagementQuestion.findMany({
    where: {
      status: "APPROVED",
      ...(excludedIds.length ? { id: { notIn: excludedIds } } : {})
    },
    orderBy: [{ usageCount: "asc" }, { createdAt: "asc" }],
    take: 240
  });

  if (!approved.length) {
    throw new AppError("No approved personalized Growth Quest questions available.", 503);
  }

  const preferredDifficulty = derivePersonalizedDifficulty({ profile, report });
  const preferredCategories = derivePersonalizedCategories({ userId, dayKey, report });
  const deterministicSeed = `${userId}:${dayKey}:personalized`;

  const prioritizedCandidates = preferredCategories.flatMap((category) => {
    const exactDifficulty = approved.filter(
      (question) =>
        question.category === category && question.difficulty === preferredDifficulty
    );
    if (exactDifficulty.length) {
      return [sortQuestionsForSeed(exactDifficulty, deterministicSeed)[0]];
    }

    const categoryMatches = approved.filter((question) => question.category === category);
    if (categoryMatches.length) {
      return [sortQuestionsForSeed(categoryMatches, deterministicSeed)[0]];
    }

    return [];
  });

  const fallbackByDifficulty = approved.filter(
    (question) => question.difficulty === preferredDifficulty
  );
  const selected = sortQuestionsForSeed(
    prioritizedCandidates.length
      ? prioritizedCandidates
      : fallbackByDifficulty.length
        ? fallbackByDifficulty
        : approved,
    deterministicSeed
  )[0];

  if (!selected) {
    throw new AppError("Unable to build today's personalized Growth Quest question.", 503);
  }

  const focusCategory = preferredCategories[0];

  return {
    ...selected,
    questionVariant: "personalized",
    focusReason: focusCategory
      ? `Focused on ${categoryLabel(focusCategory)} based on your recent progress.`
      : "Tailored to your current Growth Quest level."
  };
};

const getOrCreatePersonalizedQuestion = async ({
  userId,
  dayKey,
  profile,
  report,
  commonQuestions = []
}) => {
  const existingRecord = await getStoredPersonalizedQuestionRecord({ userId, dayKey });
  if (existingRecord?.questionId) {
    const existingQuestion = await prisma.engagementQuestion.findUnique({
      where: { id: existingRecord.questionId }
    });
    if (existingQuestion) {
      return {
        ...existingQuestion,
        questionVariant: "personalized",
        focusReason:
          existingRecord.focusReason ||
          "Tailored to your current Growth Quest level."
      };
    }
  }

  const sourceReportSnapshot = {
    engagementLevel: profile?.engagementLevel || "LEVEL_1",
    rollingAccuracy: Math.round(Number(report?.rollingAccuracy || 0)),
    rolling7DayAccuracy: Math.round(Number(report?.rolling7DayAccuracy || 0)),
    weakTopics: Array.isArray(report?.weakTopics) ? report.weakTopics : [],
    strongTopics: Array.isArray(report?.strongTopics) ? report.strongTopics : [],
    recommendedNextTopic: report?.recommendedNextTopic || null
  };

  try {
    const freelancerContext = await getFreelancerPersonalizationContext({
      userId,
      profile,
      report
    });
    const aiQuestionPayload = await generatePersonalizedAiQuestion({
      dayKey,
      freelancerContext,
      recentQuestionTexts: await listRecentPersonalizedQuestionTexts(userId)
    });
    const savedQuestion = await upsertGeneratedQuestion({
      payload: aiQuestionPayload,
      source: "ai_personalized",
      status: "APPROVED"
    });

    await savePersonalizedQuestionRecord({
      userId,
      dayKey,
      question: {
        ...savedQuestion,
        focusReason:
          aiQuestionPayload.focusReason ||
          `Focused on ${categoryLabel(savedQuestion.category)} based on recent progress.`
      },
      generationSource: "ai",
      sourceReportSnapshot,
      aiMetadata: {
        recommendedTopic: freelancerContext.recommendedTopic,
        weakTopics: freelancerContext.weakTopics,
        strongTopics: freelancerContext.strongTopics
      }
    });

    return {
      ...savedQuestion,
      questionVariant: "personalized",
      focusReason:
        aiQuestionPayload.focusReason ||
        `Focused on ${categoryLabel(savedQuestion.category)} based on recent progress.`
    };
  } catch (error) {
    console.error(
      `[Engagement] Personalized AI generation failed for ${userId} on ${dayKey}:`,
      error?.message || error
    );
    const fallbackQuestion = await selectPersonalizedQuestion({
      userId,
      dayKey,
      profile,
      report,
      excludedQuestionIds: commonQuestions.map((question) => question.id)
    });
    await savePersonalizedQuestionRecord({
      userId,
      dayKey,
      question: fallbackQuestion,
      generationSource: "fallback",
      sourceReportSnapshot,
      aiMetadata: {
        fallbackReason: normalizeText(error?.message || "AI generation failed")
      }
    });
    return fallbackQuestion;
  }
};

const loadChallengeQuestions = async ({ userId, dayKey, profile = null, report = null }) => {
  const dailySet = await ensurePublishedDailySet(dayKey);
  const commonQuestions = await loadDailyQuestions(dailySet);
  const resolvedProfile = profile || (await ensureProfile(userId));
  const resolvedReport =
    report || (await prisma.engagementProcessReport.findUnique({ where: { userId } }));
  const personalizedQuestion = await getOrCreatePersonalizedQuestion({
    userId,
    dayKey,
    profile: resolvedProfile,
    report: resolvedReport,
    commonQuestions
  });

  return {
    dailySet,
    questions: [...commonQuestions, personalizedQuestion]
  };
};

const getEngagementContestCatalog = async (client = prisma) => {
  const record = await client.serviceCatalog.findUnique({
    where: { key: ENGAGEMENT_CONTESTS_CATALOG_KEY }
  });

  return {
    record,
    contests: normalizeCatalogPayloadArray(record?.payload).map(serializeContest)
  };
};

const getEngagementContestSubmissionCatalog = async (client = prisma) => {
  const record = await client.serviceCatalog.findUnique({
    where: { key: ENGAGEMENT_CONTEST_SUBMISSIONS_CATALOG_KEY }
  });

  return {
    record,
    submissions: normalizeCatalogPayloadArray(record?.payload).map((submission) => ({
      ...submission,
      otherLinks: normalizeSubmissionLinks(submission?.otherLinks),
      attachments: normalizeSubmissionAttachments(submission?.attachments)
    }))
  };
};

const saveEngagementContestSubmissionCatalog = async (submissions, client = prisma) =>
  client.serviceCatalog.upsert({
    where: { key: ENGAGEMENT_CONTEST_SUBMISSIONS_CATALOG_KEY },
    create: {
      key: ENGAGEMENT_CONTEST_SUBMISSIONS_CATALOG_KEY,
      schemaVersion: "1",
      payload: submissions,
      sourceFile: "engagement"
    },
    update: {
      schemaVersion: "1",
      payload: submissions,
      sourceFile: "engagement"
    }
  });

const saveEngagementContestCatalog = async (contests, client = prisma) =>
  client.serviceCatalog.upsert({
    where: { key: ENGAGEMENT_CONTESTS_CATALOG_KEY },
    create: {
      key: ENGAGEMENT_CONTESTS_CATALOG_KEY,
      schemaVersion: "1",
      payload: contests,
      sourceFile: "engagement"
    },
    update: {
      schemaVersion: "1",
      payload: contests,
      sourceFile: "engagement"
    }
  });

const validateContestPayload = (payload = {}, existing = null) => {
  const title = normalizeText(payload.title ?? existing?.title);
  const description = normalizeText(payload.description ?? existing?.description);
  const detailsContent = normalizeText(payload.detailsContent ?? existing?.detailsContent) || description;
  const imageUrl = normalizeText(payload.imageUrl ?? existing?.imageUrl);
  const category = normalizeText(payload.category ?? existing?.category);
  const ctaLabel = normalizeText(payload.ctaLabel ?? existing?.ctaLabel) || "View Contest";
  const goalSummary = normalizeText(payload.goalSummary ?? existing?.goalSummary);
  const submissionInstructions = normalizeText(
    payload.submissionInstructions ?? existing?.submissionInstructions
  );
  const rewardSummary = normalizeText(payload.rewardSummary ?? existing?.rewardSummary);
  const deliverables = normalizeStringList(payload.deliverables ?? existing?.deliverables);
  const reviewCriteria = normalizeStringList(payload.reviewCriteria ?? existing?.reviewCriteria);
  const resourceLinks = normalizeLinkList(payload.resourceLinks ?? existing?.resourceLinks);
  const acceptedAssetTypes = normalizeStringList(
    payload.acceptedAssetTypes ?? existing?.acceptedAssetTypes
  );
  const maxAttachments = Math.max(
    0,
    Number(payload.maxAttachments ?? existing?.maxAttachments ?? 0) || 0
  );
  const rewardCoins = normalizeNonNegativeInt(
    payload.rewardCoins ?? existing?.rewardCoins,
    0
  );
  const rewardXp = normalizeNonNegativeInt(payload.rewardXp ?? existing?.rewardXp, 0);
  const badgeConfig = buildContestBadgeConfig(payload, existing);
  const startDayKey = normalizeDayKey(payload.startDayKey ?? existing?.startDayKey);
  const endDayKey = normalizeDayKey(payload.endDayKey ?? existing?.endDayKey, null);
  const status = normalizeContestStatus(payload.status ?? existing?.status);

  if (title.length < 3) {
    throw new AppError("Contest title is required.", 400);
  }
  if (description.length < 10) {
    throw new AppError("Contest description is required.", 400);
  }
  if (detailsContent.length < 10) {
    throw new AppError("Contest full details are required.", 400);
  }
  if (category.length < 2) {
    throw new AppError("Contest category is required.", 400);
  }
  if (goalSummary && goalSummary.length < 10) {
    throw new AppError("Contest goal summary must be at least 10 characters.", 400);
  }
  if (submissionInstructions && submissionInstructions.length < 10) {
    throw new AppError("Contest submission instructions must be at least 10 characters.", 400);
  }
  if (rewardSummary && rewardSummary.length < 5) {
    throw new AppError("Contest reward summary is too short.", 400);
  }
  if (endDayKey && endDayKey < startDayKey) {
    throw new AppError("Contest end date cannot be before the start date.", 400);
  }

  return {
    id: existing?.id || crypto.randomUUID(),
    title,
    description,
    detailsContent,
    imageUrl,
    category,
    ctaLabel,
    goalSummary,
    submissionInstructions,
    rewardSummary,
    deliverables,
    reviewCriteria,
    resourceLinks,
    acceptedAssetTypes,
    maxAttachments,
    rewardCoins,
    rewardXp,
    badgeKey: badgeConfig.badgeKey,
    badgeTitle: badgeConfig.badgeTitle,
    badgeDescription: badgeConfig.badgeDescription,
    badgeIcon: badgeConfig.badgeIcon,
    startDayKey,
    endDayKey,
    status,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

const listVisibleContestsForDay = async (dayKey = getUtcDayKey()) => {
  const { contests } = await getEngagementContestCatalog();
  return contests.filter((contest) => {
    if (contest.status !== "PUBLISHED") return false;
    if (contest.startDayKey > dayKey) return false;
    if (contest.endDayKey && contest.endDayKey < dayKey) return false;
    return true;
  });
};

export const getContestById = async (contestId) => {
  ensureEnabled();
  const normalizedContestId = normalizeText(contestId);
  const { contests } = await getEngagementContestCatalog();
  const contest = contests.find((entry) => entry.id === normalizedContestId);
  if (!contest || contest.status !== "PUBLISHED") {
    throw new AppError("Contest not found.", 404);
  }
  return contest;
};

const getContestSubmissionContestMap = async () => {
  const { contests } = await getEngagementContestCatalog();
  return new Map(contests.map((contest) => [contest.id, contest]));
};

export const listContestSubmissions = async ({ contestId, userId, status } = {}) => {
  ensureEnabled();
  const normalizedContestId = normalizeText(contestId);
  const normalizedUserId = normalizeText(userId);
  const normalizedStatus = normalizeText(status).toUpperCase();
  const { submissions } = await getEngagementContestSubmissionCatalog();
  const contestMap = await getContestSubmissionContestMap();

  return submissions
    .filter((submission) =>
      normalizedContestId ? submission.contestId === normalizedContestId : true
    )
    .filter((submission) => (normalizedUserId ? submission.userId === normalizedUserId : true))
    .filter((submission) =>
      normalizedStatus && normalizedStatus !== "ALL"
        ? normalizeSubmissionStatus(submission.status) === normalizedStatus
        : true
    )
    .sort((left, right) => String(right.createdAt || "").localeCompare(String(left.createdAt || "")))
    .map((submission) => serializeContestSubmission(submission, contestMap));
};

export const createContestSubmission = async ({ userId, contestId, payload }) => {
  ensureEnabled();
  const normalizedContestId = normalizeText(contestId);
  const contest = await getContestById(normalizedContestId);
  const title = normalizeText(payload?.title);
  const githubUrl = normalizeText(payload?.githubUrl);
  const portfolioUrl = normalizeText(payload?.portfolioUrl);
  const notes = normalizeText(payload?.notes);
  const otherLinks = normalizeSubmissionLinks(payload?.otherLinks);
  const attachments = normalizeSubmissionAttachments(payload?.attachments);

  if (title.length < 3) {
    throw new AppError("Submission title is required.", 400);
  }
  if (!githubUrl && !portfolioUrl && otherLinks.length === 0 && attachments.length === 0) {
    throw new AppError("Add at least one link or file to submit a contest entry.", 400);
  }
  if (notes && notes.length < 10) {
    throw new AppError("Submission notes must be at least 10 characters when provided.", 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, fullName: true, email: true }
  });

  if (!user) {
    throw new AppError("Freelancer account not found.", 404);
  }

  const submission = {
    id: crypto.randomUUID(),
    contestId: contest.id,
    contestTitle: contest.title,
    userId: user.id,
    userName: user.fullName,
    userEmail: user.email,
    title,
    githubUrl,
    portfolioUrl,
    otherLinks,
    notes,
    attachments,
    status: "PENDING",
    reviewNote: "",
    rewardCoins: normalizeNonNegativeInt(contest.rewardCoins),
    rewardXp: normalizeNonNegativeInt(contest.rewardXp),
    badgeKey: normalizeText(contest.badgeKey),
    badgeTitle: normalizeText(contest.badgeTitle),
    badgeDescription: normalizeText(contest.badgeDescription),
    badgeIcon: normalizeText(contest.badgeIcon) || "award",
    rewardTransferredAt: null,
    rewardTransferredBy: null,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const { submissions } = await getEngagementContestSubmissionCatalog();
  const nextSubmissions = [submission, ...submissions];
  await saveEngagementContestSubmissionCatalog(nextSubmissions);

  return serializeContestSubmission(submission, new Map([[contest.id, contest]]));
};

const awardContestRewards = async ({ adminId, submission, client }) => {
  if (submission.rewardTransferredAt) {
    return submission;
  }

  const rewardXp = normalizeNonNegativeInt(submission.rewardXp);
  const rewardCoins = normalizeNonNegativeInt(submission.rewardCoins);
  const badgeKey = normalizeText(submission.badgeKey);
  const badgeTitle = normalizeText(submission.badgeTitle);
  const badgeDescription = normalizeText(submission.badgeDescription);
  const badgeIcon = normalizeText(submission.badgeIcon) || "award";

  const profile = await ensureProfile(submission.userId, client);
  const report = await client.engagementProcessReport.findUnique({
    where: { userId: submission.userId }
  });

  const nextLifetimeXp = Number(profile.lifetimeXp || 0) + rewardXp;
  const nextCurrentXp = Number(profile.xp || 0) + rewardXp;
  const nextCoinBalance = Number(profile.loyaltyCoins || 0) + rewardCoins;
  const nextLifetimeCoinsEarned =
    Number(profile.lifetimeCoinsEarned || 0) + rewardCoins;
  const nextEngagementLevel = calculateEngagementLevel({
    lifetimeXp: nextLifetimeXp,
    completedDays: Number(profile.dailyCompletionCount || 0),
    rollingAccuracy: Math.round(Number(report?.rollingAccuracy || 0)),
    currentStreak: Number(profile.currentStreak || 0)
  });

  await client.engagementProfile.update({
    where: { userId: submission.userId },
    data: {
      xp: nextCurrentXp,
      lifetimeXp: nextLifetimeXp,
      loyaltyCoins: nextCoinBalance,
      lifetimeCoinsEarned: nextLifetimeCoinsEarned,
      engagementLevel: nextEngagementLevel
    }
  });

  if (rewardCoins > 0) {
    await client.pointsLedger.create({
      data: {
        userId: submission.userId,
        amount: rewardCoins,
        type: "EARN",
        reason: "contest_reward",
        referenceType: "EngagementContestSubmission",
        referenceId: submission.id,
        balanceAfter: nextCoinBalance,
        idempotencyKey: `contest-reward:${submission.id}:coins`,
        metadata: {
          contestId: submission.contestId,
          contestTitle: submission.contestTitle,
          rewardXp,
          rewardCoins
        }
      }
    });
  }

  if (badgeKey && badgeTitle) {
    const badge = await ensureBadgeDefinition(
      {
        badgeKey,
        badgeTitle,
        badgeDescription,
        badgeIcon
      },
      client
    );
    if (badge) {
      await client.engagementUserBadge.upsert({
        where: {
          userId_key: {
            userId: submission.userId,
            key: badgeKey
          }
        },
        create: {
          userId: submission.userId,
          badgeId: badge.id,
          key: badgeKey
        },
        update: {}
      });
    }
  }

  return {
    ...submission,
    rewardTransferredAt: new Date().toISOString(),
    rewardTransferredBy: adminId
  };
};

export const reviewContestSubmission = async ({ adminId, submissionId, payload }) => {
  ensureEnabled();
  const normalizedSubmissionId = normalizeText(submissionId);
  const status = normalizeSubmissionStatus(payload?.status);
  const reviewNote = normalizeText(payload?.reviewNote);
  const { submissions } = await getEngagementContestSubmissionCatalog();
  const existing = submissions.find((submission) => submission.id === normalizedSubmissionId);

  if (!existing) {
    throw new AppError("Contest submission not found.", 404);
  }

  const transferredAlready = Boolean(existing.rewardTransferredAt);
  const rewardCoins = transferredAlready
    ? normalizeNonNegativeInt(existing.rewardCoins)
    : normalizeNonNegativeInt(payload?.rewardCoins, existing.rewardCoins);
  const rewardXp = transferredAlready
    ? normalizeNonNegativeInt(existing.rewardXp)
    : normalizeNonNegativeInt(payload?.rewardXp, existing.rewardXp);
  const badgeConfig = transferredAlready
    ? buildContestBadgeConfig(existing, existing)
    : buildContestBadgeConfig(payload, existing);

  let updated = {
    ...existing,
    status,
    reviewNote,
    rewardCoins,
    rewardXp,
    badgeKey: badgeConfig.badgeKey,
    badgeTitle: badgeConfig.badgeTitle,
    badgeDescription: badgeConfig.badgeDescription,
    badgeIcon: badgeConfig.badgeIcon,
    reviewedBy: adminId,
    reviewedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (status === "APPROVED") {
    await prisma.$transaction(async (tx) => {
      updated = await awardContestRewards({
        adminId,
        submission: updated,
        client: tx
      });
    });
  }

  const nextSubmissions = submissions.map((submission) =>
    submission.id === normalizedSubmissionId ? updated : submission
  );

  await saveEngagementContestSubmissionCatalog(nextSubmissions);
  await recordAdminAudit({
    adminId,
    targetUserId: existing.userId,
    action: "review_contest_submission",
    entityType: "EngagementContestSubmission",
    entityId: existing.id,
    oldValue: existing,
    newValue: updated
  });

  return serializeContestSubmission(updated, await getContestSubmissionContestMap());
};

const calculateStreak = ({ profile, dayKey }) => {
  if (!profile.lastCompletedDayKey) {
    return {
      currentStreak: 1,
      longestStreak: Math.max(1, profile.longestStreak || 0),
      freezeTokens: profile.freezeTokens || 0
    };
  }

  if (profile.lastCompletedDayKey === dayKey) {
    return {
      currentStreak: profile.currentStreak || 1,
      longestStreak: Math.max(profile.longestStreak || 0, profile.currentStreak || 1),
      freezeTokens: profile.freezeTokens || 0
    };
  }

  const previousDayKey = getPreviousUtcDayKey(dayKey);
  const nextStreak =
    profile.lastCompletedDayKey === previousDayKey
      ? Number(profile.currentStreak || 0) + 1
      : 1;

  return {
    currentStreak: nextStreak,
    longestStreak: Math.max(nextStreak, profile.longestStreak || 0),
    freezeTokens: profile.freezeTokens || 0
  };
};

const calculateRewards = ({ correctCount, questionCount, currentStreak }) => {
  const perfect = correctCount === questionCount;
  let xpAwarded =
    engagementRules.xp.completion +
    correctCount * engagementRules.xp.correctAnswer +
    (perfect ? engagementRules.xp.perfectBonus : 0);
  let coinsAwarded =
    engagementRules.coins.completion +
    correctCount * engagementRules.coins.correctAnswer;
  const bonuses = [];

  if (currentStreak === 7) {
    xpAwarded += engagementRules.xp.streak7Bonus;
    coinsAwarded += engagementRules.coins.streak7Bonus;
    bonuses.push({ type: "streak", days: 7, xp: 30, coins: 25 });
  }

  if (currentStreak === 15) {
    xpAwarded += engagementRules.xp.streak15Bonus;
    bonuses.push({ type: "streak", days: 15, xp: 75, coins: 0 });
  }

  if (currentStreak === 30) {
    xpAwarded += engagementRules.xp.streak30Bonus;
    coinsAwarded += engagementRules.coins.streak30Bonus;
    bonuses.push({ type: "streak", days: 30, xp: 150, coins: 100 });
  }

  return { xpAwarded, coinsAwarded, bonuses, perfect };
};

const buildAnswerDetails = ({ questions, answers, dayKey }) => {
  const answersByQuestionId = new Map();

  answers.forEach((answer) => {
    const questionId = normalizeText(answer?.questionId);
    const selectedOptionId = normalizeText(answer?.selectedOptionId);
    if (questionId && selectedOptionId) {
      answersByQuestionId.set(questionId, selectedOptionId);
    }
  });

  if (answersByQuestionId.size !== questions.length) {
    throw new AppError("Please answer every question before submitting.", 400);
  }

  return questions.map((question) => {
    const selectedOptionId = answersByQuestionId.get(question.id);
    if (!selectedOptionId) {
      throw new AppError("Submitted answers do not match today's quest.", 400);
    }

    const optionIds = new Set((question.options || []).map((option) => option.id));
    if (!optionIds.has(selectedOptionId)) {
      throw new AppError("Submitted answer option is invalid.", 400);
    }

    const isCorrect = selectedOptionId === question.correctOptionId;
    return {
      questionId: question.id,
      questionText: question.questionText,
      type: question.type,
      category: question.category,
      categoryLabel: categoryLabel(question.category),
      skillTag: question.skillTag,
      difficulty: question.difficulty,
      questionVariant: question.questionVariant || "common",
      focusReason: question.focusReason || "",
      options: sortOptionsForDay(question.options || [], dayKey, question.id),
      selectedOptionId,
      correctOptionId: question.correctOptionId,
      isCorrect,
      explanation: question.explanation
    };
  });
};

const unlockBadges = async ({ client, userId, currentStreak }) => {
  await ensureCoreBadges(client);
  const badgeKeys = engagementRules.badges
    .filter((badge) => currentStreak >= badge.days)
    .map((badge) => badge.key);

  if (!badgeKeys.length) return [];

  const badges = await client.engagementBadge.findMany({
    where: { key: { in: badgeKeys } }
  });

  const existing = await client.engagementUserBadge.findMany({
    where: { userId, key: { in: badgeKeys } },
    select: { key: true }
  });
  const existingKeys = new Set(existing.map((badge) => badge.key));
  const newBadges = badges.filter((badge) => !existingKeys.has(badge.key));

  if (newBadges.length) {
    await client.engagementUserBadge.createMany({
      data: newBadges.map((badge) => ({
        userId,
        badgeId: badge.id,
        key: badge.key
      })),
      skipDuplicates: true
    });
  }

  return newBadges.map((badge) => ({
    key: badge.key,
    title: badge.title,
    description: badge.description,
    milestoneDays: badge.milestoneDays,
    icon: badge.icon
  }));
};

const buildResultSummary = ({
  dayKey,
  answerDetails,
  rewards,
  streak,
  profile,
  report,
  unlockedBadges
}) => ({
  dayKey,
  score: {
    correctCount: answerDetails.filter((answer) => answer.isCorrect).length,
    questionCount: answerDetails.length,
    accuracy:
      answerDetails.length > 0
        ? Math.round(
            (answerDetails.filter((answer) => answer.isCorrect).length /
              answerDetails.length) *
              100
          )
        : 0
  },
  rewards: {
    xpAwarded: rewards.xpAwarded,
    coinsAwarded: rewards.coinsAwarded,
    bonuses: rewards.bonuses,
    perfect: rewards.perfect
  },
  streak: {
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak
  },
  profile: {
    engagementLevel: profile.engagementLevel,
    engagementLevelLabel: LEVEL_LABELS[profile.engagementLevel] || "Starter",
    xp: profile.xp,
    lifetimeXp: profile.lifetimeXp,
    loyaltyCoins: profile.loyaltyCoins
  },
  unlockedBadges,
  nextFocus: buildProcessSummary(report).recommendedNextTopic,
  answers: answerDetails
});

export const getEngagementDashboard = async (userId) => {
  ensureEnabled();
  await ensureFreelancerUser(userId);
  await ensureFallbackQuestionBank();
  await ensureCoreBadges();
  return buildDashboardPayload({ userId });
};

export const startDailyChallenge = async (userId) => {
  ensureEnabled();
  await ensureFreelancerUser(userId);
  const dayKey = getUtcDayKey();
  const profile = await ensureProfile(userId);
  const report = await prisma.engagementProcessReport.findUnique({ where: { userId } });
  const todaySessions = await prisma.engagementAnswerSession.findMany({
    where: { userId, dayKey },
    orderBy: { createdAt: "desc" }
  });

  const latestSession = todaySessions[0] || null;
  const isCompleted =
    todaySessions.length >= getMaxAttemptsPerDay() || latestSession?.accuracy === 100;

  if (isCompleted) {
    const dashboard = await buildDashboardPayload({ userId, dayKey });
    return {
      status: "completed",
      dayKey,
      nextResetAt: getNextUtcResetAt(dayKey),
      resultSummary: latestSession.resultSummary,
      dashboard
    };
  }

  const { questions } = await loadChallengeQuestions({
    userId,
    dayKey,
    profile,
    report
  });

  return {
    status: "in_progress",
    dayKey,
    nextResetAt: getNextUtcResetAt(dayKey),
    questionCount: questions.length,
    questions: questions.map((question) => sanitizeQuestionForClient(question, dayKey))
  };
};

export const submitDailyChallenge = async ({
  userId,
  answers,
  idempotencyKey
}) => {
  ensureEnabled();
  await ensureFreelancerUser(userId);

  const dayKey = getUtcDayKey();
  const resolvedIdempotencyKey =
    normalizeText(idempotencyKey) || `${userId}:${dayKey}:daily-submit`;
  const profile = await ensureProfile(userId);
  const report = await prisma.engagementProcessReport.findUnique({ where: { userId } });
  const { dailySet, questions } = await loadChallengeQuestions({
    userId,
    dayKey,
    profile,
    report
  });

  if (questions.length !== engagementRules.dailyChallenge.questionCount + 1) {
    throw new AppError("Today's Growth Quest is not ready yet.", 503);
  }

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const existingByIdempotency = await tx.engagementAnswerSession.findUnique({
          where: { idempotencyKey: resolvedIdempotencyKey }
        });
        if (existingByIdempotency) {
          return existingByIdempotency.resultSummary;
        }

        const todaySessions = await tx.engagementAnswerSession.findMany({
          where: { userId, dayKey },
          orderBy: { createdAt: "desc" }
        });
        const latestSession = todaySessions[0] || null;
        if (
          todaySessions.length >= getMaxAttemptsPerDay() ||
          latestSession?.accuracy === 100
        ) {
          return latestSession.resultSummary;
        }

        const profile = await ensureProfile(userId, tx);
        const answerDetails = buildAnswerDetails({ questions, answers, dayKey });
        const correctCount = answerDetails.filter((answer) => answer.isCorrect).length;
        const questionCount = answerDetails.length;
        const accuracy =
          questionCount > 0 ? Math.round((correctCount / questionCount) * 100) : 0;
        const streak = calculateStreak({ profile, dayKey });
        const rewards = calculateRewards({
          correctCount,
          questionCount,
          currentStreak: streak.currentStreak
        });
        const profileTotals = {
          totalQuestionsAnswered:
            Number(profile.totalQuestionsAnswered || 0) + questionCount,
          totalCorrectAnswers:
            Number(profile.totalCorrectAnswers || 0) + correctCount
        };
        const report = await updateProcessReport({
          client: tx,
          userId,
          answerDetails,
          profileTotals
        });
        const nextLifetimeXp = Number(profile.lifetimeXp || 0) + rewards.xpAwarded;
        const nextDailyCompletionCount =
          Number(profile.dailyCompletionCount || 0) + 1;
        const engagementLevel = calculateEngagementLevel({
          lifetimeXp: nextLifetimeXp,
          completedDays: nextDailyCompletionCount,
          rollingAccuracy: report.rollingAccuracy,
          currentStreak: streak.currentStreak
        });
        const nextCoinBalance =
          Number(profile.loyaltyCoins || 0) + rewards.coinsAwarded;

        const updatedProfile = await tx.engagementProfile.update({
          where: { userId },
          data: {
            engagementLevel,
            xp: { increment: rewards.xpAwarded },
            lifetimeXp: { increment: rewards.xpAwarded },
            loyaltyCoins: { increment: rewards.coinsAwarded },
            lifetimeCoinsEarned: { increment: rewards.coinsAwarded },
            currentStreak: streak.currentStreak,
            longestStreak: streak.longestStreak,
            lastCompletedDayKey: dayKey,
            freezeTokens: streak.freezeTokens,
            dailyCompletionCount: { increment: 1 },
            totalQuestionsAnswered: { increment: questionCount },
            totalCorrectAnswers: { increment: correctCount }
          }
        });

        const unlockedBadges = await unlockBadges({
          client: tx,
          userId,
          currentStreak: streak.currentStreak
        });
        const resultSummary = buildResultSummary({
          dayKey,
          answerDetails,
          rewards,
          streak,
          profile: updatedProfile,
          report,
          unlockedBadges
        });

        const session = await tx.engagementAnswerSession.create({
          data: {
            userId,
            dayKey,
            dailyQuestionSetId: dailySet.id,
            answers: answerDetails.map((answer) => ({
              questionId: answer.questionId,
              selectedOptionId: answer.selectedOptionId,
              isCorrect: answer.isCorrect
            })),
            questionSnapshots: answerDetails,
            totalScore: correctCount,
            correctCount,
            questionCount,
            accuracy,
            xpAwarded: rewards.xpAwarded,
            coinsAwarded: rewards.coinsAwarded,
            resultSummary,
            idempotencyKey: resolvedIdempotencyKey,
            streakApplied: true
          }
        });

        await tx.pointsLedger.create({
          data: {
            userId,
            amount: rewards.coinsAwarded,
            type: "EARN",
            reason: "daily_growth_quest",
            referenceType: "EngagementAnswerSession",
            referenceId: session.id,
            balanceAfter: nextCoinBalance,
            idempotencyKey: `${resolvedIdempotencyKey}:coins`,
            metadata: {
              dayKey,
              correctCount,
              questionCount,
              bonuses: rewards.bonuses
            }
          }
        });

        return resultSummary;
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel?.Serializable || undefined
      }
    );

    const dashboard = await buildDashboardPayload({ userId, dayKey });
    return {
      status: "completed",
      dayKey,
      nextResetAt: getNextUtcResetAt(dayKey),
      resultSummary: result,
      dashboard
    };
  } catch (error) {
    if (error?.code === "P2002") {
      const todaySessions = await prisma.engagementAnswerSession.findMany({
        where: { userId, dayKey },
        orderBy: { createdAt: "desc" }
      });
      const latestSession = todaySessions[0] || null;
      if (latestSession) {
        const dashboard = await buildDashboardPayload({ userId, dayKey });
        return {
          status: "completed",
          dayKey,
          nextResetAt: getNextUtcResetAt(dayKey),
          resultSummary: latestSession.resultSummary,
          dashboard
        };
      }
    }
    throw error;
  }
};

export const getProcessReport = async (userId) => {
  ensureEnabled();
  await ensureFreelancerUser(userId);
  const report = await prisma.engagementProcessReport.findUnique({
    where: { userId }
  });

  return {
    report,
    summary: buildProcessSummary(report)
  };
};

export const getBadges = async (userId) => {
  ensureEnabled();
  await ensureFreelancerUser(userId);
  return buildBadgePayload(userId);
};

const validateQuestionPayload = (payload = {}) => {
  const questionText = normalizeText(payload.questionText);
  const explanation = normalizeText(payload.explanation);
  const correctOptionId = normalizeText(payload.correctOptionId || "A");
  const options = Array.isArray(payload.options) ? payload.options : [];

  if (questionText.length < 10) {
    throw new AppError("Question text is required.", 400);
  }

  if (explanation.length < 10) {
    throw new AppError("A practical explanation is required.", 400);
  }

  if (options.length < 2) {
    throw new AppError("At least two answer options are required.", 400);
  }

  const normalizedOptions = options.map((option, index) => ({
    id: normalizeText(option?.id) || String.fromCharCode(65 + index),
    text: normalizeText(option?.text)
  }));

  if (normalizedOptions.some((option) => !option.text)) {
    throw new AppError("Every answer option needs text.", 400);
  }

  if (!normalizedOptions.some((option) => option.id === correctOptionId)) {
    throw new AppError("Correct option must match one available option.", 400);
  }

  const type = normalizeQuestionType(payload.type);
  if (type === "TRUE_FALSE" && normalizedOptions.length !== 2) {
    throw new AppError("True/false questions must have exactly two options.", 400);
  }

  if (type !== "TRUE_FALSE" && normalizedOptions.length !== 4) {
    throw new AppError("MCQ questions must have exactly four options.", 400);
  }

  const category = normalizeCategory(payload.category);
  const difficulty = normalizeDifficulty(payload.difficulty);

  return {
    questionText,
    type,
    category,
    skillTag: normalizeText(payload.skillTag) || category.toLowerCase(),
    difficulty,
    options: normalizedOptions,
    correctOptionId,
    explanation,
    source: normalizeText(payload.source) || "admin_created",
    contentHash: buildQuestionContentHash({
      questionText,
      category,
      difficulty,
      correctOptionId
    })
  };
};

const upsertGeneratedQuestion = async ({
  payload,
  source = "ai_generated",
  status = "APPROVED",
  client = prisma
}) => {
  const data = validateQuestionPayload({
    ...payload,
    source
  });
  const existing = await client.engagementQuestion.findUnique({
    where: { contentHash: data.contentHash }
  });

  if (existing) {
    if (existing.status !== status || existing.source !== source) {
      return client.engagementQuestion.update({
        where: { id: existing.id },
        data: {
          status,
          source,
          rejectedReason: null
        }
      });
    }
    return existing;
  }

  return client.engagementQuestion.create({
    data: {
      ...data,
      status,
      approvedAt: status === "APPROVED" ? new Date() : null
    }
  });
};

const listRecentCommonQuestionTexts = async ({ take = 18 } = {}) => {
  const dailySets = await prisma.dailyQuestionSet.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ dayKey: "desc" }],
    take: 10,
    select: { questionIds: true }
  });

  const questionIds = [...new Set(dailySets.flatMap((set) => set.questionIds || []))].slice(0, 80);
  if (!questionIds.length) return [];

  const questions = await prisma.engagementQuestion.findMany({
    where: { id: { in: questionIds } },
    select: { questionText: true },
    take
  });

  return questions.map((question) => normalizeText(question.questionText)).filter(Boolean);
};

const recordAdminAudit = (data, client = prisma) =>
  client.engagementAdminAuditLog.create({ data }).catch((error) => {
    console.error("[Engagement] Failed to write admin audit log:", error);
  });

export const getAdminEngagementOverview = async () => {
  ensureEnabled();
  const dayKey = getUtcDayKey();
  const sevenDaysAgoDate = new Date();
  sevenDaysAgoDate.setUTCDate(sevenDaysAgoDate.getUTCDate() - 6);
  const sevenDaysAgo = getUtcDayKey(sevenDaysAgoDate);

  const [
    totalProfiles,
    completedToday,
    activeSevenDays,
    avgStreak,
    pendingQuestions,
    approvedQuestions,
    topProfiles,
    recentSessions
  ] = await Promise.all([
    prisma.engagementProfile.count(),
    prisma.engagementAnswerSession.count({ where: { dayKey } }),
    prisma.engagementAnswerSession.groupBy({
      by: ["userId"],
      where: { dayKey: { gte: sevenDaysAgo } }
    }),
    prisma.engagementProfile.aggregate({ _avg: { currentStreak: true } }),
    prisma.engagementQuestion.count({
      where: { status: { in: ["DRAFT", "PENDING_APPROVAL"] } }
    }),
    prisma.engagementQuestion.count({ where: { status: "APPROVED" } }),
    prisma.engagementProfile.findMany({
      orderBy: [{ currentStreak: "desc" }, { lifetimeXp: "desc" }],
      take: 5,
      include: {
        user: {
          select: { id: true, fullName: true, email: true }
        }
      }
    }),
    prisma.engagementAnswerSession.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 8,
      include: {
        user: {
          select: { id: true, fullName: true, email: true }
        }
      }
    })
  ]);

  return {
    dayKey,
    totalProfiles,
    completedToday,
    activeSevenDays: activeSevenDays.length,
    averageStreak: Math.round(Number(avgStreak._avg.currentStreak || 0)),
    pendingQuestions,
    approvedQuestions,
    topProfiles: topProfiles.map((profile) => ({
      userId: profile.userId,
      fullName: profile.user.fullName,
      email: profile.user.email,
      currentStreak: profile.currentStreak,
      lifetimeXp: profile.lifetimeXp,
      loyaltyCoins: profile.loyaltyCoins,
      engagementLevel: profile.engagementLevel,
      engagementLevelLabel: LEVEL_LABELS[profile.engagementLevel] || "Starter"
    })),
    recentSessions: recentSessions.map((session) => ({
      ...serializeRecentSession(session),
      userId: session.userId,
      fullName: session.user?.fullName || "Unknown freelancer",
      email: session.user?.email || ""
    }))
  };
};

export const listAdminPersonalizedQuestionHistory = async ({
  search,
  dayKey,
  userId,
  take = 50
} = {}) => {
  ensureEnabled();
  await ensurePersonalizedQuestionStore();

  const normalizedSearch = normalizeText(search);
  const normalizedUserId = normalizeText(userId);
  const normalizedDayKey = normalizeDayKey(dayKey, null);
  const limit = Math.min(100, Math.max(1, Number(take) || 50));
  const searchPattern = normalizedSearch ? `%${normalizedSearch}%` : null;

  const rows = await prisma.$queryRaw`
    SELECT
      epq."id",
      epq."userId",
      u."fullName" AS "userName",
      u."email" AS "userEmail",
      epq."dayKey",
      epq."questionId",
      epq."questionText",
      epq."category",
      epq."difficulty",
      epq."skillTag",
      epq."focusReason",
      epq."generationSource",
      epq."sourceReportSnapshot",
      epq."aiMetadata",
      epq."createdAt",
      epq."updatedAt"
    FROM "EngagementPersonalizedQuestion" epq
    INNER JOIN "User" u ON u."id" = epq."userId"
    WHERE (${normalizedUserId || null}::text IS NULL OR epq."userId" = ${normalizedUserId || null})
      AND (${normalizedDayKey || null}::text IS NULL OR epq."dayKey" = ${normalizedDayKey || null})
      AND (
        ${searchPattern || null}::text IS NULL
        OR u."fullName" ILIKE ${searchPattern || null}
        OR u."email" ILIKE ${searchPattern || null}
        OR epq."questionText" ILIKE ${searchPattern || null}
        OR epq."skillTag" ILIKE ${searchPattern || null}
      )
    ORDER BY epq."createdAt" DESC
    LIMIT ${limit}
  `;

  return rows.map(serializePersonalizedQuestionRecord);
};

export const listAdminQuestions = async ({ status, search, take = 100 } = {}) => {
  ensureEnabled();
  const normalizedStatus = normalizeText(status).toUpperCase();
  const normalizedSearch = normalizeText(search);

  const questions = await prisma.engagementQuestion.findMany({
    where: {
      ...(normalizedStatus && normalizedStatus !== "ALL"
        ? { status: normalizedStatus }
        : {}),
      ...(normalizedSearch
        ? {
            OR: [
              { questionText: { contains: normalizedSearch, mode: "insensitive" } },
              { skillTag: { contains: normalizedSearch, mode: "insensitive" } }
            ]
          }
        : {})
    },
    orderBy: [{ updatedAt: "desc" }],
    take: Math.min(200, Math.max(1, Number(take) || 100)),
    include: {
      approvedBy: {
        select: { id: true, fullName: true, email: true }
      }
    }
  });

  return questions.map(toSafeQuestionRecord);
};

export const listAdminDailySets = async ({ from, to, take = 45 } = {}) => {
  ensureEnabled();
  const todayKey = getUtcDayKey();
  const fromDayKey = normalizeDayKey(from, todayKey);
  const toDayKey = normalizeDayKey(to, null);

  const dailySets = await prisma.dailyQuestionSet.findMany({
    where: {
      dayKey: {
        gte: fromDayKey,
        ...(toDayKey ? { lte: toDayKey } : {})
      }
    },
    orderBy: [{ dayKey: "asc" }],
    take: Math.min(120, Math.max(1, Number(take) || 45)),
    include: {
      approvedBy: {
        select: { id: true, fullName: true, email: true }
      }
    }
  });

  const questionIds = [...new Set(dailySets.flatMap((set) => set.questionIds || []))];
  const questions = questionIds.length
    ? await prisma.engagementQuestion.findMany({
        where: { id: { in: questionIds } },
        select: {
          id: true,
          questionText: true,
          category: true,
          difficulty: true
        }
      })
    : [];
  const questionBank = new Map(questions.map((question) => [question.id, question]));

  return dailySets.map((dailySet) => serializeDailySet(dailySet, questionBank));
};

export const listAdminContests = async ({ status } = {}) => {
  ensureEnabled();
  const normalizedStatus = normalizeText(status).toUpperCase();
  const { contests } = await getEngagementContestCatalog();

  return contests.filter((contest) =>
    normalizedStatus && normalizedStatus !== "ALL"
      ? contest.status === normalizedStatus
      : true
  );
};

export const createAdminContest = async ({ adminId, payload }) => {
  ensureEnabled();
  const { contests } = await getEngagementContestCatalog();
  const contest = validateContestPayload(payload);
  const nextContests = [contest, ...contests];

  if (contest.badgeKey && contest.badgeTitle) {
    await ensureBadgeDefinition(contest);
  }
  await saveEngagementContestCatalog(nextContests);
  await recordAdminAudit({
    adminId,
    action: "create_contest",
    entityType: "EngagementContest",
    entityId: contest.id,
    newValue: contest
  });

  return contest;
};

export const updateAdminContest = async ({ adminId, contestId, payload }) => {
  ensureEnabled();
  const { contests } = await getEngagementContestCatalog();
  const existing = contests.find((contest) => contest.id === contestId);
  if (!existing) {
    throw new AppError("Contest not found.", 404);
  }

  const updatedContest = validateContestPayload(payload, existing);
  const nextContests = contests.map((contest) =>
    contest.id === contestId ? updatedContest : contest
  );

  if (updatedContest.badgeKey && updatedContest.badgeTitle) {
    await ensureBadgeDefinition(updatedContest);
  }
  await saveEngagementContestCatalog(nextContests);
  await recordAdminAudit({
    adminId,
    action: "update_contest",
    entityType: "EngagementContest",
    entityId: updatedContest.id,
    oldValue: existing,
    newValue: updatedContest
  });

  return updatedContest;
};

export const upsertAdminDailySet = async ({ adminId, dayKey, payload }) => {
  ensureEnabled();
  const normalizedDayKey = normalizeDayKey(dayKey);
  const status = payload?.status === "DRAFT" ? "DRAFT" : "PUBLISHED";
  const normalizedQuestionIds = [
    ...new Set(
      Array.isArray(payload?.questionIds)
        ? payload.questionIds.map((questionId) => normalizeText(questionId)).filter(Boolean)
        : []
    )
  ];

  if (normalizedQuestionIds.length !== engagementRules.dailyChallenge.questionCount) {
    throw new AppError(
      `A daily set must contain exactly ${engagementRules.dailyChallenge.questionCount} questions.`,
      400
    );
  }

  const approvedQuestions = await prisma.engagementQuestion.findMany({
    where: {
      id: { in: normalizedQuestionIds },
      status: "APPROVED"
    },
    select: {
      id: true,
      questionText: true,
      category: true,
      difficulty: true
    }
  });

  if (approvedQuestions.length !== normalizedQuestionIds.length) {
    throw new AppError("Only approved questions can be scheduled to a calendar date.", 400);
  }

  const existing = await prisma.dailyQuestionSet.findUnique({
    where: { dayKey: normalizedDayKey },
    include: {
      approvedBy: {
        select: { id: true, fullName: true, email: true }
      }
    }
  });

  const dailySet = await prisma.dailyQuestionSet.upsert({
    where: { dayKey: normalizedDayKey },
    create: {
      dayKey: normalizedDayKey,
      questionIds: normalizedQuestionIds,
      status,
      generatedBy: "admin",
      approvedById: status === "PUBLISHED" ? adminId : null,
      publishedAt: status === "PUBLISHED" ? new Date() : null
    },
    update: {
      questionIds: normalizedQuestionIds,
      status,
      generatedBy: "admin",
      approvedById: status === "PUBLISHED" ? adminId : null,
      publishedAt: status === "PUBLISHED" ? new Date() : null
    },
    include: {
      approvedBy: {
        select: { id: true, fullName: true, email: true }
      }
    }
  });

  const questionBank = new Map(approvedQuestions.map((question) => [question.id, question]));
  const serialized = serializeDailySet(dailySet, questionBank);

  await recordAdminAudit({
    adminId,
    action: "upsert_daily_set",
    entityType: "DailyQuestionSet",
    entityId: dailySet.id,
    oldValue: existing ? serializeDailySet(existing, questionBank) : null,
    newValue: serialized
  });

  return serialized;
};

export const createAdminQuestion = async ({ adminId, payload }) => {
  ensureEnabled();
  if (!isAdminQuestionApprovalEnabled()) {
    throw new AppError("Admin question approval is disabled.", 404);
  }

  const data = validateQuestionPayload(payload);
  const question = await prisma.engagementQuestion.create({
    data: {
      ...data,
      status: payload.status === "APPROVED" ? "APPROVED" : "PENDING_APPROVAL",
      approvedById: payload.status === "APPROVED" ? adminId : null,
      approvedAt: payload.status === "APPROVED" ? new Date() : null
    },
    include: {
      approvedBy: { select: { id: true, fullName: true, email: true } }
    }
  });

  await recordAdminAudit({
    adminId,
    action: "create_question",
    entityType: "EngagementQuestion",
    entityId: question.id,
    newValue: toSafeQuestionRecord(question)
  });

  return toSafeQuestionRecord(question);
};

export const updateAdminQuestion = async ({ adminId, questionId, payload }) => {
  ensureEnabled();
  if (!isAdminQuestionApprovalEnabled()) {
    throw new AppError("Admin question approval is disabled.", 404);
  }

  const existing = await prisma.engagementQuestion.findUnique({
    where: { id: questionId }
  });
  if (!existing) throw new AppError("Question not found.", 404);

  const merged = validateQuestionPayload({ ...existing, ...payload });
  const question = await prisma.engagementQuestion.update({
    where: { id: questionId },
    data: {
      ...merged,
      status:
        payload.status && ["DRAFT", "PENDING_APPROVAL", "APPROVED"].includes(payload.status)
          ? payload.status
          : existing.status === "APPROVED"
            ? "APPROVED"
            : "PENDING_APPROVAL",
      rejectedReason: null
    },
    include: {
      approvedBy: { select: { id: true, fullName: true, email: true } }
    }
  });

  await recordAdminAudit({
    adminId,
    action: "update_question",
    entityType: "EngagementQuestion",
    entityId: question.id,
    oldValue: existing,
    newValue: toSafeQuestionRecord(question)
  });

  return toSafeQuestionRecord(question);
};

export const approveAdminQuestion = async ({ adminId, questionId }) => {
  ensureEnabled();
  const existing = await prisma.engagementQuestion.findUnique({
    where: { id: questionId }
  });
  if (!existing) throw new AppError("Question not found.", 404);

  const question = await prisma.engagementQuestion.update({
    where: { id: questionId },
    data: {
      status: "APPROVED",
      rejectedReason: null,
      approvedById: adminId,
      approvedAt: new Date()
    },
    include: {
      approvedBy: { select: { id: true, fullName: true, email: true } }
    }
  });

  await recordAdminAudit({
    adminId,
    action: "approve_question",
    entityType: "EngagementQuestion",
    entityId: question.id,
    oldValue: existing,
    newValue: toSafeQuestionRecord(question)
  });

  return toSafeQuestionRecord(question);
};

export const rejectAdminQuestion = async ({ adminId, questionId, reason }) => {
  ensureEnabled();
  const normalizedReason = normalizeText(reason);
  if (!normalizedReason) {
    throw new AppError("Rejecting a question requires a reason.", 400);
  }

  const existing = await prisma.engagementQuestion.findUnique({
    where: { id: questionId }
  });
  if (!existing) throw new AppError("Question not found.", 404);

  const question = await prisma.engagementQuestion.update({
    where: { id: questionId },
    data: {
      status: "REJECTED",
      rejectedReason: normalizedReason
    },
    include: {
      approvedBy: { select: { id: true, fullName: true, email: true } }
    }
  });

  await recordAdminAudit({
    adminId,
    action: "reject_question",
    entityType: "EngagementQuestion",
    entityId: question.id,
    oldValue: existing,
    newValue: toSafeQuestionRecord(question),
    reason: normalizedReason
  });

  return toSafeQuestionRecord(question);
};

export const seedAdminFallbackQuestions = async ({ adminId }) => {
  ensureEnabled();
  const result = await ensureFallbackQuestionBank();
  await ensureCoreBadges();
  await recordAdminAudit({
    adminId,
    action: "seed_fallback_questions",
    entityType: "EngagementQuestion",
    newValue: result
  });
  return result;
};

export const listAdminFreelancerProgress = async ({ search, take = 50 } = {}) => {
  ensureEnabled();
  const normalizedSearch = normalizeText(search);
  let userIds = null;

  if (normalizedSearch) {
    const users = await prisma.user.findMany({
      where: {
        role: "FREELANCER",
        OR: [
          { fullName: { contains: normalizedSearch, mode: "insensitive" } },
          { email: { contains: normalizedSearch, mode: "insensitive" } }
        ]
      },
      select: { id: true },
      take: 100
    });
    userIds = users.map((user) => user.id);
  }

  const profiles = await prisma.engagementProfile.findMany({
    where: userIds ? { userId: { in: userIds } } : {},
    orderBy: [{ currentStreak: "desc" }, { lifetimeXp: "desc" }],
    take: Math.min(100, Math.max(1, Number(take) || 50)),
    include: {
      user: {
        select: { id: true, fullName: true, email: true, status: true }
      }
    }
  });

  const reports = await prisma.engagementProcessReport.findMany({
    where: { userId: { in: profiles.map((profile) => profile.userId) } }
  });
  const reportByUserId = new Map(reports.map((report) => [report.userId, report]));

  return profiles.map((profile) => {
    const report = reportByUserId.get(profile.userId);
    return {
      userId: profile.userId,
      fullName: profile.user.fullName,
      email: profile.user.email,
      status: profile.user.status,
      engagementLevel: profile.engagementLevel,
      engagementLevelLabel: LEVEL_LABELS[profile.engagementLevel] || "Starter",
      currentStreak: profile.currentStreak,
      longestStreak: profile.longestStreak,
      lifetimeXp: profile.lifetimeXp,
      loyaltyCoins: profile.loyaltyCoins,
      rollingAccuracy: Math.round(Number(report?.rollingAccuracy || 0)),
      weakTopic: report?.weakTopics?.[0]
        ? categoryLabel(report.weakTopics[0])
        : "Not enough data",
      strongTopic: report?.strongTopics?.[0]
        ? categoryLabel(report.strongTopics[0])
        : "Not enough data",
      completedDays: Number(profile.dailyCompletionCount || 0),
      totalQuestionsAnswered: Number(profile.totalQuestionsAnswered || 0),
      lastCompletedDayKey: profile.lastCompletedDayKey,
      inactiveDays: getDayKeyAgeInDays(profile.lastCompletedDayKey)
    };
  });
};
