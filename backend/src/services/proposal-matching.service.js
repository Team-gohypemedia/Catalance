import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";
import {
  collectActiveProjectCounts,
  OPEN_TO_WORK_MIN_ACTIVE_PROJECT_COUNT,
} from "../lib/freelancer-open-to-work.js";
import { listUsers } from "../modules/users/user.service.js";
import {
  buildProjectMatchingSeed,
  listCompletedProjectsForMatching,
} from "./completed-projects.service.js";

const DEFAULT_MATCH_LIMIT = 20;
const DEFAULT_MIN_RESULTS = 5;

const SOURCE_PRIORITY_SCORES = Object.freeze({
  level_1_completed_project: 100,
  level_2_case_study: 60,
  level_3_profile_skills: 30,
});

const LEVEL_METADATA = Object.freeze({
  level_1_completed_project: {
    level: 1,
    label: "completed_project",
    sourceLabel: "Completed project",
  },
  level_2_case_study: {
    level: 2,
    label: "case_study",
    sourceLabel: "Case study",
  },
  level_3_profile_skills: {
    level: 3,
    label: "global_skills",
    sourceLabel: "Global skills",
  },
});

const PROJECT_MATCH_SOURCE_SELECT = Object.freeze({
  id: true,
  title: true,
  description: true,
  budget: true,
  proposalContent: true,
  proposalJson: true,
  freelancerMatchingJson: true,
  serviceKey: true,
  clientName: true,
  businessName: true,
  serviceType: true,
  projectOverview: true,
  primaryObjectives: true,
  featuresDeliverables: true,
  timeline: true,
  budgetSummary: true,
  websiteType: true,
  designStyle: true,
  websiteBuildType: true,
  frontendFramework: true,
  backendTechnology: true,
  databaseType: true,
  hosting: true,
  pageCount: true,
  creativeType: true,
  volume: true,
  engagementModel: true,
  brandStage: true,
  brandDeliverables: true,
  targetAudience: true,
  businessCategory: true,
  targetLocations: true,
  seoGoals: true,
  duration: true,
  appType: true,
  appFeatures: true,
  platformRequirements: true,
  ownerId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

const PROFILE_SKILL_DETAIL_KEYS = Object.freeze([
  "skillsAndTechnologies",
  "technologies",
  "technology",
  "techStack",
  "stack",
  "tools",
  "platforms",
]);

const PROFILE_NICHE_DETAIL_KEYS = Object.freeze([
  "industriesOrNiches",
  "industries",
  "industryFocus",
  "niches",
  "idealFor",
]);

const PROFILE_TAG_DETAIL_KEYS = Object.freeze([
  "deliverables",
  "projectTypes",
  "serviceSpecializations",
  "specializations",
  "tags",
  "outcomes",
]);

const PROFILE_BUDGET_DETAIL_KEYS = Object.freeze([
  "startingPrice",
  "minBudget",
  "price",
  "priceRange",
  "averageProjectPriceRange",
  "averageProjectPrice",
  "budget",
]);

const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const cleanText = (value = "") =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

const uniqueItems = (items = []) => {
  const seen = new Set();
  const result = [];

  items.forEach((item) => {
    const normalized = cleanText(item);
    if (!normalized) return;

    const key = normalized.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(normalized);
  });

  return result;
};

const normalizeToken = (value = "") =>
  cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const normalizeServiceKey = (value = "") =>
  cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .trim();

const splitListValue = (value = "") =>
  String(value || "")
    .split(/\r?\n|;|,(?=\s*[A-Za-z0-9])|\/(?=\s*[A-Za-z0-9])|\band\b|&/i)
    .map((item) => cleanText(item))
    .filter(Boolean);

const collectTextValues = (value) => {
  if (value === null || value === undefined) return [];

  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectTextValues(entry));
  }

  if (isPlainObject(value)) {
    return Object.values(value).flatMap((entry) => collectTextValues(entry));
  }

  if (typeof value === "string") {
    return splitListValue(value);
  }

  if (typeof value === "number") {
    return [String(value)];
  }

  return [];
};

const normalizeList = (value) => {
  return uniqueItems(collectTextValues(value));
};

const parseBudgetPoint = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }

  const text = String(value).toLowerCase().replace(/,/g, "");
  const match = text.match(
    /(\d+(?:\.\d+)?)\s*(k|thousand|lakh|lac|lakhs|lacs|crore|cr|million|m)?/i,
  );
  if (!match) return null;

  const amount = Number.parseFloat(match[1]);
  if (!Number.isFinite(amount)) return null;

  const unit = String(match[2] || "").toLowerCase();
  let multiplier = 1;

  if (unit === "k" || unit === "thousand") multiplier = 1000;
  if (unit.startsWith("lakh") || unit === "lac" || unit === "lacs") multiplier = 100000;
  if (unit === "crore" || unit === "cr") multiplier = 10000000;
  if (unit === "million" || unit === "m") multiplier = 1000000;

  return Math.max(0, Math.round(amount * multiplier));
};

const parseBudgetRange = ({
  minBudget = null,
  maxBudget = null,
  budget = null,
  budgetSummary = "",
} = {}) => {
  const directMin = parseBudgetPoint(minBudget);
  const directMax = parseBudgetPoint(maxBudget);
  if (directMin !== null || directMax !== null) {
    const normalizedMin = directMin ?? directMax;
    const normalizedMax = directMax ?? directMin;
    return {
      min: normalizedMin,
      max: normalizedMax,
    };
  }

  const budgetPoint = parseBudgetPoint(budget);
  if (budgetPoint !== null) {
    return {
      min: budgetPoint,
      max: budgetPoint,
    };
  }

  const summary = cleanText(budgetSummary);
  if (!summary) {
    return { min: null, max: null };
  }

  const numericMatches = summary.match(/\d[\d,]*/g) || [];
  const numericValues = numericMatches
    .map((entry) => Number(String(entry).replace(/,/g, "")))
    .filter((entry) => Number.isFinite(entry));

  if (numericValues.length >= 2) {
    const sorted = numericValues.sort((left, right) => left - right);
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
    };
  }

  if (numericValues.length === 1) {
    return {
      min: numericValues[0],
      max: numericValues[0],
    };
  }

  return { min: null, max: null };
};

const rangesOverlap = (leftRange = {}, rightRange = {}) => {
  const leftMin = leftRange?.min;
  const leftMax = leftRange?.max;
  const rightMin = rightRange?.min;
  const rightMax = rightRange?.max;

  if (
    leftMin === null ||
    leftMin === undefined ||
    leftMax === null ||
    leftMax === undefined ||
    rightMin === null ||
    rightMin === undefined ||
    rightMax === null ||
    rightMax === undefined
  ) {
    return true;
  }

  return leftMin <= rightMax && rightMin <= leftMax;
};

const getRangeCenter = (range = {}) => {
  if (range?.min === null || range?.min === undefined) return null;
  if (range?.max === null || range?.max === undefined) return null;
  return (range.min + range.max) / 2;
};

const buildMatchingProfile = (source = {}) => {
  const matchingSeed = buildProjectMatchingSeed(source) || {};
  const project = isPlainObject(matchingSeed.project) ? matchingSeed.project : {};
  const matchingQuery = isPlainObject(matchingSeed.matchingQuery)
    ? matchingSeed.matchingQuery
    : {};
  const fitProfile = isPlainObject(matchingSeed.fitProfile)
    ? matchingSeed.fitProfile
    : {};

  return {
    id: source?.id || null,
    title:
      cleanText(source?.title) ||
      cleanText(source?.projectTitle) ||
      cleanText(project?.title) ||
      "Proposal",
    serviceKey:
      normalizeServiceKey(source?.serviceKey) ||
      normalizeServiceKey(project?.serviceKey) ||
      normalizeServiceKey(matchingQuery?.category) ||
      "",
    serviceType:
      cleanText(source?.serviceType) ||
      cleanText(source?.service) ||
      cleanText(source?.serviceName) ||
      cleanText(project?.serviceType) ||
      "",
    summary:
      cleanText(source?.description) ||
      cleanText(source?.summary) ||
      cleanText(source?.content) ||
      cleanText(project?.summary) ||
      cleanText(matchingQuery?.searchTerm) ||
      "",
    skills: uniqueItems([
      ...normalizeList(fitProfile?.requiredSkills),
      ...normalizeList(matchingQuery?.techStack),
      ...normalizeList(fitProfile?.preferredSkills),
    ]),
    niches: uniqueItems([
      ...normalizeList(matchingQuery?.industriesOrNiches),
      ...normalizeList(fitProfile?.targetAudience),
      ...normalizeList(fitProfile?.targetLocations),
      cleanText(source?.businessCategory),
      cleanText(source?.targetAudience),
    ]),
    projectTypes: uniqueItems([
      ...normalizeList(matchingQuery?.serviceSpecializations),
      cleanText(source?.websiteType),
      cleanText(source?.websiteBuildType),
      cleanText(source?.creativeType),
      cleanText(source?.appType),
      cleanText(project?.serviceType),
      cleanText(source?.serviceType),
      cleanText(source?.serviceKey),
    ]),
    tags: uniqueItems([
      ...normalizeList(fitProfile?.deliverables),
      ...normalizeList(fitProfile?.primaryObjectives),
      ...normalizeList(fitProfile?.platformRequirements),
      ...normalizeList(fitProfile?.seoGoals),
      ...normalizeList(source?.featuresDeliverables),
      ...normalizeList(source?.brandDeliverables),
      ...normalizeList(source?.appFeatures),
      ...normalizeList(source?.platformRequirements),
    ]),
    budgetRange: parseBudgetRange({
      minBudget: matchingQuery?.minBudget,
      maxBudget: matchingQuery?.maxBudget,
      budget: source?.amount ?? source?.budget ?? null,
      budgetSummary: source?.budgetSummary || project?.budgetSummary || "",
    }),
    timeline:
      cleanText(source?.timeline) ||
      cleanText(source?.duration) ||
      cleanText(project?.timeline) ||
      "",
  };
};

const buildCompletedProjectProfile = (completedProject = {}) => {
  const matchingSeed = isPlainObject(completedProject?.matchingSeed)
    ? completedProject.matchingSeed
    : {};
  const matchingQuery = isPlainObject(matchingSeed.matchingQuery)
    ? matchingSeed.matchingQuery
    : {};
  const fitProfile = isPlainObject(matchingSeed.fitProfile)
    ? matchingSeed.fitProfile
    : {};

  return {
    recordId: completedProject?.id || null,
    recordTitle: cleanText(completedProject?.title) || "Completed project",
    serviceKey:
      normalizeServiceKey(completedProject?.serviceKey) ||
      normalizeServiceKey(matchingQuery?.category) ||
      "",
    serviceType:
      cleanText(completedProject?.serviceType) ||
      cleanText(matchingSeed?.project?.serviceType) ||
      "",
    skills: uniqueItems([
      ...normalizeList(completedProject?.skills),
      ...normalizeList(fitProfile?.requiredSkills),
      ...normalizeList(matchingQuery?.techStack),
    ]),
    niches: uniqueItems([
      cleanText(completedProject?.niche),
      ...normalizeList(matchingQuery?.industriesOrNiches),
      ...normalizeList(fitProfile?.targetAudience),
    ]),
    projectTypes: uniqueItems([
      cleanText(completedProject?.projectType),
      cleanText(completedProject?.serviceType),
      ...normalizeList(matchingQuery?.serviceSpecializations),
    ]),
    tags: uniqueItems([
      ...normalizeList(completedProject?.tags),
      ...normalizeList(fitProfile?.deliverables),
      ...normalizeList(fitProfile?.primaryObjectives),
    ]),
    budgetRange: parseBudgetRange({
      minBudget: completedProject?.budgetMin,
      maxBudget: completedProject?.budgetMax,
      budget: completedProject?.budget,
      budgetSummary: matchingSeed?.project?.budgetSummary || "",
    }),
    recordDate: completedProject?.completedAt || completedProject?.updatedAt || null,
  };
};

const normalizeSearchableValues = (values = []) =>
  uniqueItems(values)
    .map((value) => normalizeToken(value))
    .filter(Boolean);

const buildCaseStudyProfile = (portfolioProject = {}, index = 0) => {
  const caseStudy = isPlainObject(portfolioProject)
    ? portfolioProject
    : { title: cleanText(portfolioProject) || `Case study ${index + 1}` };

  const title = cleanText(
    caseStudy?.title || caseStudy?.projectTitle || caseStudy?.name || "",
  );
  const service = cleanText(
    caseStudy?.service ||
      caseStudy?.serviceName ||
      caseStudy?.category ||
      caseStudy?.serviceType ||
      "",
  );
  const primaryServiceKey = normalizeServiceKey(caseStudy?.serviceKey || service);
  const serviceKeys = uniqueItems([
    ...normalizeList(caseStudy?.serviceKeys),
    ...normalizeList(caseStudy?.services),
    ...normalizeList(caseStudy?.serviceTags),
    primaryServiceKey,
  ])
    .map((value) => normalizeServiceKey(value))
    .filter(Boolean);
  const tags = uniqueItems([
    ...normalizeList(caseStudy?.tags),
    ...normalizeList(caseStudy?.deliverables),
    ...normalizeList(caseStudy?.serviceSpecializations),
  ]);
  const techStack = uniqueItems([
    ...normalizeList(caseStudy?.techStack),
    ...normalizeList(caseStudy?.technologies),
    ...normalizeList(caseStudy?.activeTechnologies),
    ...normalizeList(caseStudy?.stack),
  ]);
  const skills = uniqueItems([...tags, ...techStack]);
  const budget = parseBudgetPoint(
    caseStudy?.budget ?? caseStudy?.projectBudget ?? caseStudy?.amount ?? null,
  );
  const timeline = cleanText(
    caseStudy?.timeline || caseStudy?.duration || caseStudy?.projectTimeline || "",
  );
  const description = cleanText(
    caseStudy?.description || caseStudy?.summary || caseStudy?.overview || caseStudy?.content || "",
  );
  const niches = uniqueItems(normalizeList(caseStudy?.industriesOrNiches));
  const projectTypes = uniqueItems([
    service,
    ...normalizeList(caseStudy?.serviceSpecializations),
    ...normalizeList(caseStudy?.projectTypes),
    ...niches,
  ]);
  const searchableText = normalizeSearchableValues([
    title,
    service,
    timeline,
    description,
    ...serviceKeys,
    ...skills,
    ...projectTypes,
  ]);

  if (!title && searchableText.length === 0) {
    return null;
  }

  return {
    recordId: cleanText(caseStudy?.id || caseStudy?.projectId || "") || null,
    recordTitle: title || "Case study",
    summary: description,
    description,
    service,
    serviceType: service || "",
    serviceKey: serviceKeys[0] || primaryServiceKey || "",
    serviceKeys,
    tags,
    techStack,
    skills,
    searchableSkills: normalizeSearchableValues(skills),
    searchableServiceKeys: normalizeSearchableValues(serviceKeys),
    searchableText,
    niches,
    projectTypes,
    budget,
    budgetRange: parseBudgetRange({ budget }),
    timeline,
    recordDate: caseStudy?.updatedAt || caseStudy?.createdAt || null,
  };
};

const extractPortfolioCaseStudies = (freelancer = {}) => {
  const rawPortfolioProjects = Array.isArray(freelancer?.portfolioProjects)
    ? freelancer.portfolioProjects
    : Array.isArray(freelancer?.freelancerProfile?.portfolioProjects)
      ? freelancer.freelancerProfile.portfolioProjects
      : Array.isArray(freelancer?.profileDetails?.portfolioProjects)
        ? freelancer.profileDetails.portfolioProjects
        : [];

  return rawPortfolioProjects
    .map((entry, index) => buildCaseStudyProfile(entry, index))
    .filter(Boolean);
};

const pickServiceDetails = (freelancer = {}, targetServiceKey = "") => {
  const serviceDetails =
    freelancer?.profileDetails && isPlainObject(freelancer.profileDetails.serviceDetails)
      ? freelancer.profileDetails.serviceDetails
      : {};
  const entries = Object.entries(serviceDetails)
    .filter(([, detail]) => isPlainObject(detail))
    .map(([key, detail]) => ({
      key,
      normalizedKey: normalizeServiceKey(key),
      detail,
    }));

  if (!targetServiceKey) {
    return entries;
  }

  const normalizedTargetServiceKey = normalizeServiceKey(targetServiceKey);
  const matchingEntries = entries.filter(
    (entry) => entry.normalizedKey === normalizedTargetServiceKey,
  );

  return matchingEntries.length > 0 ? matchingEntries : entries;
};

const collectDetailValues = (detailEntries = [], keys = []) =>
  uniqueItems(
    detailEntries.flatMap(({ detail }) =>
      keys.flatMap((key) => normalizeList(detail?.[key])),
    ),
  );

const resolveDetailBudgetRange = (detailEntries = []) => {
  for (const { detail } of detailEntries) {
    for (const key of PROFILE_BUDGET_DETAIL_KEYS) {
      const parsedRange = parseBudgetRange({
        budget: detail?.[key],
        budgetSummary: detail?.[key],
      });

      if (parsedRange.min !== null || parsedRange.max !== null) {
        return parsedRange;
      }
    }
  }

  return { min: null, max: null };
};

const resolveProfileServiceKey = ({
  freelancer = {},
  detailEntries = [],
  targetServiceKey = "",
} = {}) => {
  const serviceCandidates = uniqueItems([
    ...detailEntries.map(({ key }) => cleanText(key)),
    ...normalizeList(freelancer?.services),
    cleanText(freelancer?.serviceKey),
    cleanText(freelancer?.service),
  ]);

  if (serviceCandidates.length === 0) {
    return "";
  }

  const normalizedTargetServiceKey = normalizeServiceKey(targetServiceKey);
  if (normalizedTargetServiceKey) {
    const exactMatch = serviceCandidates.find(
      (candidate) => normalizeServiceKey(candidate) === normalizedTargetServiceKey,
    );
    if (exactMatch) {
      return normalizeServiceKey(exactMatch);
    }
  }

  return normalizeServiceKey(serviceCandidates[0]);
};

const buildProfileSkillsSource = (freelancer = {}, targetServiceKey = "") => {
  const detailEntries = pickServiceDetails(freelancer, targetServiceKey);

  return {
    recordId: freelancer?.id || null,
    recordTitle: cleanText(freelancer?.fullName) || "Freelancer profile",
    serviceKey: resolveProfileServiceKey({
      freelancer,
      detailEntries,
      targetServiceKey,
    }),
    serviceType:
      cleanText(freelancer?.jobTitle) || cleanText(freelancer?.services?.[0]) || "",
    skills: uniqueItems([
      ...normalizeList(freelancer?.skills),
      ...normalizeList(freelancer?.services),
      ...collectDetailValues(detailEntries, PROFILE_SKILL_DETAIL_KEYS),
    ]),
    niches: uniqueItems([
      ...normalizeList(freelancer?.profileDetails?.globalIndustryFocus),
      ...normalizeList(freelancer?.profileDetails?.globalIndustryOther),
      ...collectDetailValues(detailEntries, PROFILE_NICHE_DETAIL_KEYS),
    ]),
    projectTypes: uniqueItems([
      ...normalizeList(freelancer?.services),
      ...collectDetailValues(detailEntries, PROFILE_TAG_DETAIL_KEYS),
    ]),
    tags: uniqueItems([
      ...collectDetailValues(detailEntries, PROFILE_TAG_DETAIL_KEYS),
    ]),
    budgetRange: resolveDetailBudgetRange(detailEntries),
    recordDate: freelancer?.updatedAt || freelancer?.createdAt || null,
  };
};

const valuesLooselyMatch = (left = "", right = "") => {
  const normalizedLeft = normalizeToken(left);
  const normalizedRight = normalizeToken(right);

  if (!normalizedLeft || !normalizedRight) return false;
  if (normalizedLeft === normalizedRight) return true;
  if (normalizedLeft.length >= 4 && normalizedRight.includes(normalizedLeft)) return true;
  if (normalizedRight.length >= 4 && normalizedLeft.includes(normalizedRight)) return true;
  return false;
};

const scoreListOverlap = ({
  targetValues = [],
  sourceValues = [],
  maxScore = 0,
  neutralScore = 0,
} = {}) => {
  const normalizedTarget = uniqueItems(targetValues);
  const normalizedSource = uniqueItems(sourceValues);

  if (normalizedTarget.length === 0) {
    return {
      score: neutralScore,
      matchedValues: [],
    };
  }

  if (normalizedSource.length === 0) {
    return {
      score: 0,
      matchedValues: [],
    };
  }

  const matchedValues = normalizedTarget.filter((targetValue) =>
    normalizedSource.some((sourceValue) => valuesLooselyMatch(targetValue, sourceValue)),
  );
  const overlapRatio = matchedValues.length / normalizedTarget.length;

  return {
    score: Math.round(maxScore * overlapRatio),
    matchedValues,
  };
};

const scoreBudgetCompatibility = (targetRange = {}, sourceRange = {}) => {
  const hasTargetBudget =
    targetRange?.min !== null &&
    targetRange?.min !== undefined &&
    targetRange?.max !== null &&
    targetRange?.max !== undefined;
  const hasSourceBudget =
    sourceRange?.min !== null &&
    sourceRange?.min !== undefined &&
    sourceRange?.max !== null &&
    sourceRange?.max !== undefined;

  if (!hasTargetBudget || !hasSourceBudget) {
    return {
      score: 6,
      withinRange: false,
      hardRejected: false,
      budgetMatchPercentage: null,
      startingPrice: sourceRange?.min ?? null,
      range: hasSourceBudget ? sourceRange : null,
    };
  }

  if (!rangesOverlap(targetRange, sourceRange)) {
    return {
      score: 0,
      withinRange: false,
      hardRejected: true,
      budgetMatchPercentage: 0,
      startingPrice: sourceRange?.min ?? null,
      range: sourceRange,
    };
  }

  const targetCenter = getRangeCenter(targetRange);
  const sourceCenter = getRangeCenter(sourceRange);
  const spread = Math.max((targetRange.max - targetRange.min) / 2, 1);
  const distance = Math.abs((targetCenter ?? 0) - (sourceCenter ?? 0));
  const proximity = Math.max(0, 1 - distance / spread);
  const percentage = Math.max(50, Math.round(50 + proximity * 50));

  return {
    score: Math.max(9, Math.min(15, Math.round(9 + proximity * 6))),
    withinRange: true,
    hardRejected: false,
    budgetMatchPercentage: percentage,
    startingPrice: sourceRange?.min ?? null,
    range: sourceRange,
  };
};

const scoreTimelineCompatibility = (targetTimeline = "", sourceTimeline = "") => {
  const normalizedTargetTimeline = normalizeToken(targetTimeline);
  const normalizedSourceTimeline = normalizeToken(sourceTimeline);

  if (!normalizedTargetTimeline || !normalizedSourceTimeline) {
    return {
      score: 2,
      timelineMatch: false,
    };
  }

  if (valuesLooselyMatch(normalizedTargetTimeline, normalizedSourceTimeline)) {
    return {
      score: 8,
      timelineMatch: true,
    };
  }

  const targetTokens = normalizedTargetTimeline.split(/\s+/).filter(Boolean);
  const sourceTokens = new Set(normalizedSourceTimeline.split(/\s+/).filter(Boolean));
  const overlapCount = targetTokens.filter((token) => sourceTokens.has(token)).length;

  if (overlapCount > 0) {
    return {
      score: 4,
      timelineMatch: true,
    };
  }

  return {
    score: 0,
    timelineMatch: false,
  };
};

const extractKeywordTokens = (value = "") =>
  normalizeToken(value)
    .split(/\s+/)
    .filter((token) => token.length >= 3);

const scoreTextRelevance = ({
  targetTitle = "",
  targetSummary = "",
  sourceTitle = "",
  sourceSummary = "",
} = {}) => {
  const targetTokens = uniqueItems([
    ...extractKeywordTokens(targetTitle),
    ...extractKeywordTokens(targetSummary),
  ]);
  const sourceTokens = new Set([
    ...extractKeywordTokens(sourceTitle),
    ...extractKeywordTokens(sourceSummary),
  ]);

  if (targetTokens.length === 0 || sourceTokens.size === 0) {
    return {
      score: 0,
      matchedKeywords: [],
    };
  }

  const matchedKeywords = targetTokens.filter((token) => sourceTokens.has(token));
  const ratio = matchedKeywords.length / targetTokens.length;

  return {
    score: Math.max(0, Math.min(8, Math.round(ratio * 8))),
    matchedKeywords,
  };
};

const scoreAvailability = ({ activeProjectCount = 0, openToWork = true } = {}) => {
  if (!openToWork) {
    return {
      score: 0,
      eligible: false,
      reason: "Freelancer is not open to work.",
    };
  }

  if (activeProjectCount >= OPEN_TO_WORK_MIN_ACTIVE_PROJECT_COUNT) {
    return {
      score: 0,
      eligible: false,
      reason: "Freelancer has reached the active project limit.",
    };
  }

  return {
    score: Math.max(2, 10 - activeProjectCount * 2),
    eligible: true,
    reason: null,
  };
};

const scoreRecencyBonus = (value = null, now = new Date()) => {
  if (!value) return 0;

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return 0;

  const ageInDays = Math.max(
    0,
    Math.floor((now.getTime() - parsedDate.getTime()) / (24 * 60 * 60 * 1000)),
  );

  if (ageInDays <= 90) return 10;
  if (ageInDays <= 180) return 8;
  if (ageInDays <= 365) return 6;
  if (ageInDays <= 730) return 3;
  return 1;
};

const buildMatchReasons = ({
  levelKey = "",
  recordTitle = "",
  matchedSkills = [],
  matchedNiches = [],
  matchedProjectTypes = [],
  budgetCompatibility = null,
  activeProjectCount = 0,
} = {}) => {
  const reasons = [];
  const levelMeta = LEVEL_METADATA[levelKey] || LEVEL_METADATA.level_3_profile_skills;

  if (recordTitle) {
    reasons.push(`${levelMeta.sourceLabel} evidence: ${recordTitle}`);
  }

  if (matchedSkills.length > 0) {
    reasons.push(`Skills overlap: ${matchedSkills.slice(0, 3).join(", ")}`);
  }

  if (matchedNiches.length > 0) {
    reasons.push(`Relevant niche: ${matchedNiches.slice(0, 2).join(", ")}`);
  }

  if (matchedProjectTypes.length > 0) {
    reasons.push(`Project type fit: ${matchedProjectTypes.slice(0, 2).join(", ")}`);
  }

  if (budgetCompatibility?.withinRange) {
    reasons.push("Budget range is compatible.");
  }

  reasons.push(
    `Current workload: ${activeProjectCount} active project${activeProjectCount === 1 ? "" : "s"}.`,
  );

  return reasons.slice(0, 4);
};

const evaluateCandidateMatch = ({
  targetProfile = {},
  sourceProfile = {},
  freelancer = {},
  levelKey = "level_3_profile_skills",
  activeProjectCount = 0,
  sourceEvidence = null,
  now = new Date(),
} = {}) => {
  const availability = scoreAvailability({
    activeProjectCount,
    openToWork: freelancer?.openToWork !== false,
  });

  if (!availability.eligible) {
    return null;
  }

  const skills = scoreListOverlap({
    targetValues: targetProfile.skills,
    sourceValues: sourceProfile.skills,
    maxScore: 30,
  });
  const niches = scoreListOverlap({
    targetValues: targetProfile.niches,
    sourceValues: sourceProfile.niches,
    maxScore: 15,
  });
  const projectTypes = scoreListOverlap({
    targetValues: [...(targetProfile.projectTypes || []), ...(targetProfile.tags || [])],
    sourceValues: [...(sourceProfile.projectTypes || []), ...(sourceProfile.tags || [])],
    maxScore: 10,
  });
  const budgetCompatibility = scoreBudgetCompatibility(
    targetProfile.budgetRange,
    sourceProfile.budgetRange,
  );

  if (budgetCompatibility.hardRejected) {
    return null;
  }

  const normalizedTargetServiceKey = normalizeServiceKey(targetProfile.serviceKey);
  const normalizedSourceServiceKeys = uniqueItems([
    sourceProfile.serviceKey,
    ...(Array.isArray(sourceProfile.serviceKeys) ? sourceProfile.serviceKeys : []),
  ])
    .map((value) => normalizeServiceKey(value))
    .filter(Boolean);
  const hasSourceServiceSignal = normalizedSourceServiceKeys.length > 0;
  const serviceMatch = normalizedTargetServiceKey
    ? normalizedSourceServiceKeys.includes(normalizedTargetServiceKey)
    : hasSourceServiceSignal;
  const timelineCompatibility = scoreTimelineCompatibility(
    targetProfile.timeline,
    sourceProfile.timeline,
  );
  const textRelevance = scoreTextRelevance({
    targetTitle: targetProfile.title,
    targetSummary: targetProfile.summary,
    sourceTitle: sourceProfile.recordTitle || sourceEvidence?.title || "",
    sourceSummary: sourceProfile.summary || sourceProfile.description || "",
  });
  const hasSignalMatch =
    serviceMatch ||
    skills.matchedValues.length > 0 ||
    niches.matchedValues.length > 0 ||
    projectTypes.matchedValues.length > 0 ||
    textRelevance.score > 0;

  if (!hasSignalMatch) {
    return null;
  }

  if (
    ["level_2_case_study", "level_3_profile_skills"].includes(levelKey) &&
    normalizedTargetServiceKey &&
    !serviceMatch &&
    skills.matchedValues.length === 0
  ) {
    return null;
  }

  const sourcePriorityScore =
    SOURCE_PRIORITY_SCORES[levelKey] || SOURCE_PRIORITY_SCORES.level_3_profile_skills;
  const serviceScore = serviceMatch ? 16 : 0;
  const recencyBonus = scoreRecencyBonus(sourceProfile.recordDate, now);
  const finalScore =
    sourcePriorityScore +
    serviceScore +
    skills.score +
    niches.score +
    budgetCompatibility.score +
    projectTypes.score +
    timelineCompatibility.score +
    textRelevance.score +
    availability.score +
    recencyBonus;
  const levelMeta = LEVEL_METADATA[levelKey] || LEVEL_METADATA.level_3_profile_skills;
  const budgetMatchPercentage = budgetCompatibility.budgetMatchPercentage;
  const scoreBreakdown = {
    sourcePriorityScore,
    serviceScore,
    skillsScore: skills.score,
    nicheScore: niches.score,
    budgetScore: budgetCompatibility.score,
    projectTypeScore: projectTypes.score,
    timelineScore: timelineCompatibility.score,
    relevanceScore: textRelevance.score,
    matchedKeywordCount: textRelevance.matchedKeywords.length,
    availabilityScore: availability.score,
    recencyBonus,
    finalScore,
  };
  const matchedSkills = uniqueItems(skills.matchedValues);
  const matchedNiches = uniqueItems(niches.matchedValues);
  const matchedProjectTypes = uniqueItems(projectTypes.matchedValues);
  const matchedKeywords = uniqueItems(textRelevance.matchedKeywords);
  const matchHighlights = uniqueItems([
    ...matchedSkills,
    ...matchedNiches,
    ...matchedProjectTypes,
    ...matchedKeywords,
  ]).slice(0, 6);
  const matchedCaseStudyTitles =
    levelKey === "level_2_case_study"
      ? uniqueItems([sourceProfile.recordTitle || sourceEvidence?.title || ""]).filter(Boolean)
      : [];

  return {
    freelancerId: freelancer?.id || null,
    sourceLevel: levelMeta.level,
    sourceLabel: levelMeta.label,
    sourcePriorityScore,
    score: finalScore,
    finalScore,
    scoreBreakdown,
    matchBreakdown: scoreBreakdown,
    matchedSkills,
    matchedTechnologies: matchedSkills,
    matchedNiches,
    matchedProjectTypes,
    matchHighlights,
    matchReasons: buildMatchReasons({
      levelKey,
      recordTitle: sourceProfile.recordTitle || sourceEvidence?.title || "",
      matchedSkills,
      matchedNiches,
      matchedProjectTypes,
      budgetCompatibility,
      activeProjectCount,
    }),
    matchSource: levelMeta.label,
    serviceMatch,
    matchedCaseStudyTitles,
    activeProjectCount,
    budgetCompatibility: {
      score: budgetCompatibility.score,
      withinRange: budgetCompatibility.withinRange,
      hardRejected: budgetCompatibility.hardRejected,
      range: budgetCompatibility.range,
      startingPrice: budgetCompatibility.startingPrice,
      budgetMatchPercentage,
      displayLabel:
        budgetMatchPercentage === null ? null : `${budgetMatchPercentage}%`,
    },
    matchedService: {
      serviceKey:
        normalizedSourceServiceKeys[0] || sourceProfile.serviceKey || targetProfile.serviceKey || null,
      serviceName: sourceProfile.serviceType || targetProfile.serviceType || null,
      averageProjectPriceRange:
        budgetCompatibility.range?.min !== null &&
        budgetCompatibility.range?.min !== undefined
          ? budgetCompatibility.range?.max !== null &&
            budgetCompatibility.range?.max !== undefined &&
            budgetCompatibility.range.max !== budgetCompatibility.range.min
            ? `${budgetCompatibility.range.min}-${budgetCompatibility.range.max}`
            : String(budgetCompatibility.range.min)
          : null,
    },
    caseStudyMatch: {
      hasCaseStudy: levelKey === "level_2_case_study",
      serviceKey: sourceProfile.serviceKey || null,
      serviceName: sourceProfile.serviceType || null,
      matchedSkills,
      matchedCaseStudyTitles,
      timeline: sourceProfile.timeline || sourceEvidence?.timeline || null,
    },
    sourceEvidence,
  };
};

const preferCandidate = (currentCandidate = null, nextCandidate = null) => {
  if (!currentCandidate) return nextCandidate;
  if (!nextCandidate) return currentCandidate;

  if (nextCandidate.sourcePriorityScore !== currentCandidate.sourcePriorityScore) {
    return nextCandidate.sourcePriorityScore > currentCandidate.sourcePriorityScore
      ? nextCandidate
      : currentCandidate;
  }

  if (nextCandidate.finalScore !== currentCandidate.finalScore) {
    return nextCandidate.finalScore > currentCandidate.finalScore
      ? nextCandidate
      : currentCandidate;
  }

  return currentCandidate;
};

const mapFreelancerToMatchResult = (freelancer = {}, candidate = {}) => ({
  ...freelancer,
  freelancerId: freelancer?.id || null,
  name: freelancer?.fullName || freelancer?.name || null,
  title:
    freelancer?.jobTitle ||
    freelancer?.freelancerProfile?.jobTitle ||
    freelancer?.professionalTitle ||
    null,
  bio:
    freelancer?.cleanBio ||
    freelancer?.bio ||
    freelancer?.about ||
    null,
  avatarUrl: freelancer?.avatar || null,
  sourceLevel: candidate.sourceLevel,
  sourceLabel: candidate.sourceLabel,
  matchSource: candidate.matchSource,
  serviceMatch: candidate.serviceMatch,
  score: candidate.finalScore,
  matchScore: candidate.finalScore,
  projectRelevanceScore: candidate.finalScore,
  scoreBreakdown: candidate.scoreBreakdown,
  matchBreakdown: candidate.matchBreakdown,
  matchedSkills: candidate.matchedSkills,
  matchedTechnologies: candidate.matchedTechnologies,
  matchedNiches: candidate.matchedNiches,
  matchedProjectTypes: candidate.matchedProjectTypes,
  matchReasons: candidate.matchReasons,
  matchHighlights: candidate.matchHighlights,
  activeProjectCount: candidate.activeProjectCount,
  budgetCompatibility: candidate.budgetCompatibility,
  budgetFitPercent:
    candidate.budgetCompatibility?.budgetMatchPercentage ?? null,
  budgetMatchPercentage:
    candidate.budgetCompatibility?.budgetMatchPercentage ?? null,
  skillsMatchPercent:
    Number.isFinite(Number(candidate?.scoreBreakdown?.skillsScore))
      ? Math.max(0, Math.min(100, Math.round((Number(candidate.scoreBreakdown.skillsScore) / 30) * 100)))
      : null,
  matchedCaseStudyTitles: Array.isArray(candidate.matchedCaseStudyTitles)
    ? candidate.matchedCaseStudyTitles
    : [],
  matchedService: candidate.matchedService,
  caseStudyMatch: candidate.caseStudyMatch,
  scoreMetadata: {
    sourcePriorityScore: candidate.sourcePriorityScore,
    sourceLevel: candidate.sourceLevel,
    sourceLabel: candidate.sourceLabel,
  },
  sourceEvidence: candidate.sourceEvidence,
});

const sortMatches = (left = {}, right = {}) => {
  if (right.matchScore !== left.matchScore) {
    return right.matchScore - left.matchScore;
  }

  if ((right.sourceLevel || 0) !== (left.sourceLevel || 0)) {
    return (right.sourceLevel || 0) - (left.sourceLevel || 0);
  }

  if ((right.activeProjectCount || 0) !== (left.activeProjectCount || 0)) {
    return (left.activeProjectCount || 0) - (right.activeProjectCount || 0);
  }

  return cleanText(left?.fullName).localeCompare(cleanText(right?.fullName));
};

const mergeFreelancerCollections = (collections = []) =>
  collections.flat().reduce(
    (accumulator, freelancer) => {
      if (!freelancer?.id) return accumulator;
      if (accumulator.seen.has(freelancer.id)) return accumulator;

      accumulator.seen.add(freelancer.id);
      accumulator.items.push(freelancer);
      return accumulator;
    },
    { seen: new Set(), items: [] },
  ).items;

const loadCompletedProjectPool = async ({
  serviceKey = "",
  projectTypes = [],
  niches = [],
  limit = 150,
} = {}) => {
  try {
    const rows = await listCompletedProjectsForMatching({
      serviceKey,
      projectTypes,
      niches,
      limit,
    });

    return Array.isArray(rows) ? rows : [];
  } catch (error) {
    console.warn(
      "[Proposal Matching] Level 1 completed-project matching unavailable; continuing with Level 2/3:",
      error?.message || error,
    );

    return [];
  }
};

const loadFreelancerPool = async () => {
  const [activeFreelancers, pendingFreelancers] = await Promise.all([
    listUsers({
      role: "FREELANCER",
      status: "ACTIVE",
      onboardingComplete: "true",
    }),
    listUsers({
      role: "FREELANCER",
      status: "PENDING_APPROVAL",
      onboardingComplete: "true",
    }),
  ]);

  return mergeFreelancerCollections([
    Array.isArray(activeFreelancers) ? activeFreelancers : [],
    Array.isArray(pendingFreelancers) ? pendingFreelancers : [],
  ]);
};

const buildLevel1Candidates = ({
  targetProfile = {},
  completedProjects = [],
  freelancerById = new Map(),
  activeProjectCounts = new Map(),
  now = new Date(),
} = {}) => {
  const candidateMap = new Map();

  completedProjects.forEach((completedProject) => {
    const sourceProfile = buildCompletedProjectProfile(completedProject);
    const freelancerIds = Array.isArray(completedProject?.freelancerIds)
      ? completedProject.freelancerIds
      : [];

    freelancerIds.forEach((freelancerId) => {
      const freelancer = freelancerById.get(freelancerId);
      if (!freelancer) return;

      const activeProjectCount = activeProjectCounts.get(freelancerId) || 0;
      const candidate = evaluateCandidateMatch({
        targetProfile,
        sourceProfile,
        freelancer,
        levelKey: "level_1_completed_project",
        activeProjectCount,
        sourceEvidence: {
          id: completedProject?.id || null,
          type: "completed_project",
          title: cleanText(completedProject?.title) || "Completed project",
          completedAt: completedProject?.completedAt || null,
        },
        now,
      });

      if (!candidate) return;

      candidateMap.set(
        freelancerId,
        preferCandidate(candidateMap.get(freelancerId), candidate),
      );
    });
  });

  return candidateMap;
};

const buildLevel2Candidates = ({
  targetProfile = {},
  freelancers = [],
  activeProjectCounts = new Map(),
  now = new Date(),
} = {}) => {
  const candidateMap = new Map();

  freelancers.forEach((freelancer) => {
    const activeProjectCount = activeProjectCounts.get(freelancer.id) || 0;
    const caseStudies = extractPortfolioCaseStudies(freelancer);

    caseStudies.forEach((caseStudy) => {
      const candidate = evaluateCandidateMatch({
        targetProfile,
        sourceProfile: caseStudy,
        freelancer,
        levelKey: "level_2_case_study",
        activeProjectCount,
        sourceEvidence: {
          id: caseStudy?.recordId || null,
          type: "case_study",
          title: caseStudy?.recordTitle || "Case study",
          timeline: cleanText(caseStudy?.timeline) || null,
        },
        now,
      });

      if (!candidate) return;

      candidateMap.set(
        freelancer.id,
        preferCandidate(candidateMap.get(freelancer.id), candidate),
      );
    });
  });

  return candidateMap;
};

const buildLevel3Candidates = ({
  targetProfile = {},
  freelancers = [],
  activeProjectCounts = new Map(),
  now = new Date(),
} = {}) => {
  const candidateMap = new Map();

  freelancers.forEach((freelancer) => {
    const activeProjectCount = activeProjectCounts.get(freelancer.id) || 0;
    const sourceProfile = buildProfileSkillsSource(
      freelancer,
      targetProfile.serviceKey,
    );
    const candidate = evaluateCandidateMatch({
      targetProfile,
      sourceProfile,
      freelancer,
      levelKey: "level_3_profile_skills",
      activeProjectCount,
      sourceEvidence: {
        id: freelancer?.id || null,
        type: "profile",
        title: cleanText(freelancer?.fullName) || "Freelancer profile",
      },
      now,
    });

    if (!candidate) return;

    candidateMap.set(
      freelancer.id,
      preferCandidate(candidateMap.get(freelancer.id), candidate),
    );
  });

  return candidateMap;
};

export const rankFreelancersFromData = ({
  targetProfile = {},
  freelancers = [],
  completedProjects = [],
  activeProjectCounts = new Map(),
  limit = DEFAULT_MATCH_LIMIT,
  minResults = DEFAULT_MIN_RESULTS,
  now = new Date(),
} = {}) => {
  const normalizedLimit =
    Number.isFinite(Number(limit)) && Number(limit) > 0
      ? Math.min(Math.round(Number(limit)), 50)
      : DEFAULT_MATCH_LIMIT;
  const normalizedMinResults =
    Number.isFinite(Number(minResults)) && Number(minResults) > 0
      ? Math.min(Math.round(Number(minResults)), normalizedLimit)
      : DEFAULT_MIN_RESULTS;
  const freelancerById = new Map(
    (Array.isArray(freelancers) ? freelancers : [])
      .filter((freelancer) => Boolean(freelancer?.id))
      .map((freelancer) => [freelancer.id, freelancer]),
  );
  const selectedCandidates = new Map();
  const levelCounts = {
    level1: 0,
    level2: 0,
    level3: 0,
  };

  const registerCandidates = (candidateMap = new Map()) => {
    candidateMap.forEach((candidate, freelancerId) => {
      selectedCandidates.set(
        freelancerId,
        preferCandidate(selectedCandidates.get(freelancerId), candidate),
      );
    });
  };

  const level1Candidates = buildLevel1Candidates({
    targetProfile,
    completedProjects,
    freelancerById,
    activeProjectCounts,
    now,
  });
  levelCounts.level1 = level1Candidates.size;
  registerCandidates(level1Candidates);

  if (selectedCandidates.size < normalizedMinResults) {
    const level2Candidates = buildLevel2Candidates({
      targetProfile,
      freelancers,
      activeProjectCounts,
      now,
    });
    levelCounts.level2 = level2Candidates.size;
    registerCandidates(level2Candidates);
  }

  if (selectedCandidates.size < normalizedMinResults) {
    const level3Candidates = buildLevel3Candidates({
      targetProfile,
      freelancers,
      activeProjectCounts,
      now,
    });
    levelCounts.level3 = level3Candidates.size;
    registerCandidates(level3Candidates);
  }

  const results = Array.from(selectedCandidates.entries())
    .map(([freelancerId, candidate]) => {
      const freelancer = freelancerById.get(freelancerId);
      if (!freelancer) return null;
      return mapFreelancerToMatchResult(freelancer, candidate);
    })
    .filter(Boolean)
    .sort(sortMatches)
    .slice(0, normalizedLimit);

  return {
    results,
    levelCounts,
    meta: {
      limit: normalizedLimit,
      minResults: normalizedMinResults,
      totalCandidates: results.length,
    },
  };
};

export const resolveProposalMatchingSource = async (proposalId) => {
  const normalizedProposalId = String(proposalId || "").trim();
  if (!normalizedProposalId) {
    throw new AppError("Proposal ID is required.", 400);
  }

  const project = await prisma.project.findUnique({
    where: {
      id: normalizedProposalId,
    },
    select: PROJECT_MATCH_SOURCE_SELECT,
  });

  if (project) {
    return {
      proposalId: normalizedProposalId,
      sourceProjectId: project.id,
      sourceType: "project",
      source: project,
    };
  }

  const proposal = await prisma.proposal.findUnique({
    where: {
      id: normalizedProposalId,
    },
    include: {
      project: {
        select: PROJECT_MATCH_SOURCE_SELECT,
      },
    },
  });

  if (proposal?.project) {
    return {
      proposalId: normalizedProposalId,
      sourceProjectId: proposal.project.id,
      sourceType: "proposal",
      source: proposal.project,
    };
  }

  throw new AppError("Proposal or project not found for matching.", 404);
};

const buildTargetProfileFromPayload = (proposal = {}) => {
  const normalizedProposal =
    proposal && typeof proposal === "object" ? proposal : {};

  return buildMatchingProfile({
    ...normalizedProposal,
    title:
      normalizedProposal?.title ||
      normalizedProposal?.projectTitle ||
      normalizedProposal?.project?.title ||
      "",
    description:
      normalizedProposal?.description ||
      normalizedProposal?.summary ||
      normalizedProposal?.content ||
      normalizedProposal?.project?.description ||
      "",
    budget:
      normalizedProposal?.amount ??
      normalizedProposal?.budget ??
      normalizedProposal?.project?.budget ??
      null,
    serviceKey:
      normalizedProposal?.serviceKey ||
      normalizedProposal?.project?.serviceKey ||
      normalizedProposal?.service ||
      normalizedProposal?.serviceName ||
      normalizedProposal?.category ||
      "",
    serviceType:
      normalizedProposal?.serviceType ||
      normalizedProposal?.service ||
      normalizedProposal?.serviceName ||
      normalizedProposal?.project?.serviceType ||
      "",
    proposalJson:
      normalizedProposal?.proposalJson ||
      normalizedProposal?.project?.proposalJson ||
      null,
    proposalContent:
      normalizedProposal?.proposalContent ||
      normalizedProposal?.content ||
      normalizedProposal?.summary ||
      normalizedProposal?.project?.proposalContent ||
      "",
    proposalContext:
      normalizedProposal?.proposalContext ||
      normalizedProposal?.project?.proposalJson?.contextSnapshot ||
      null,
  });
};

export const matchFreelancersForProposalPayload = async (
  proposal = {},
  { limit = DEFAULT_MATCH_LIMIT, minResults = DEFAULT_MIN_RESULTS } = {},
) => {
  const targetProfile = buildTargetProfileFromPayload(proposal);
  const [freelancers, completedProjects, activeProjectCounts] = await Promise.all([
    loadFreelancerPool(),
    loadCompletedProjectPool({
      serviceKey: targetProfile.serviceKey,
      projectTypes: targetProfile.projectTypes,
      niches: targetProfile.niches,
      limit: 150,
    }),
    collectActiveProjectCounts(),
  ]);

  return rankFreelancersFromData({
    targetProfile,
    freelancers,
    completedProjects,
    activeProjectCounts,
    limit,
    minResults,
  });
};

export const matchFreelancersForProposal = async (
  proposalId,
  { limit = DEFAULT_MATCH_LIMIT, minResults = DEFAULT_MIN_RESULTS } = {},
) => {
  const resolvedSource = await resolveProposalMatchingSource(proposalId);
  const targetProfile = buildMatchingProfile(resolvedSource.source);
  const [freelancers, completedProjects, activeProjectCounts] = await Promise.all([
    loadFreelancerPool(),
    loadCompletedProjectPool({
      serviceKey: targetProfile.serviceKey,
      projectTypes: targetProfile.projectTypes,
      niches: targetProfile.niches,
      limit: 150,
    }),
    collectActiveProjectCounts(),
  ]);

  const ranking = rankFreelancersFromData({
    targetProfile,
    freelancers,
    completedProjects,
    activeProjectCounts,
    limit,
    minResults,
  });

  return {
    ...resolvedSource,
    ...ranking,
  };
};

export const __testables = {
  buildCaseStudyProfile,
  buildCompletedProjectProfile,
  buildMatchingProfile,
  buildProfileSkillsSource,
  buildTargetProfileFromPayload,
  evaluateCandidateMatch,
  parseBudgetPoint,
  parseBudgetRange,
  preferCandidate,
  rankFreelancersFromData,
  rangesOverlap,
  scoreAvailability,
  scoreBudgetCompatibility,
  scoreListOverlap,
  scoreRecencyBonus,
};
