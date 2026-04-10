import {
  getProposalSignature,
  getProposalStorageKeys,
  loadSavedProposalsFromStorage,
  persistSavedProposalsToStorage,
  resolveActiveProposalId,
} from "@/shared/lib/client-proposal-storage";
import { extractLabeledLineValue } from "@/shared/lib/labeled-fields";
import {
  isFreelancerServiceAligned,
  resolveFreelancerMatchPercent,
} from "@/shared/lib/proposal-match";

export const MIN_FREELANCER_MATCH_SCORE = 50;
export const PROPOSAL_BLOCKED_STATUSES = new Set(["pending", "accepted", "sent"]);
export const CLOSED_PROJECT_STATUSES = new Set(["completed", "paused"]);
export const DRAFT_PROJECT_STATUSES = new Set(["draft", "local_draft"]);
export const HIDDEN_REJECTION_REASON_KEYS = new Set(["system_awarded_to_another"]);
export const GENERIC_PROPOSAL_CATEGORIES = new Set(["project", "general"]);

export const statusColors = {
  draft: "border-sky-400/30 bg-sky-500/10 text-sky-200",
  accepted: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  sent: "border-blue-400/30 bg-blue-500/10 text-blue-200",
  pending: "border-amber-400/30 bg-amber-500/10 text-amber-200",
  rejected: "border-rose-400/30 bg-rose-500/10 text-rose-200",
};

export const statusLabels = {
  draft: "Draft",
  accepted: "Accepted",
  sent: "Sent",
  pending: "Pending",
  rejected: "Rejected",
};

export const proposalPanelClassName =
  "rounded-[28px] border border-white/[0.06] bg-card";
export const clientProposalMetricBlockClassName =
  "rounded-[14px] border border-white/[0.06] bg-card p-3 sm:p-3.5";

export const proposalCardStatusClasses = {
  draft: "border-border bg-transparent text-muted-foreground",
  accepted: "border-emerald-500/30 bg-transparent text-emerald-300",
  sent: "border-primary/35 bg-transparent text-primary",
  pending: "border-primary/35 bg-transparent text-primary",
  rejected: "border-destructive/30 bg-transparent text-destructive",
};

export const proposalTabCopy = {
  draft: {
    title: "Draft proposals",
    description:
      "Refine scope, review details, and send polished drafts to matched freelancers.",
    emptyTitle: "No draft proposals",
    emptyDescription:
      "Accepted proposal drafts will appear here until you send them to freelancers.",
  },
  pending: {
    title: "Pending approvals",
    description:
      "Track sent proposals, payment-required approvals, and live invites in one place.",
    emptyTitle: "No pending proposals",
    emptyDescription:
      "When a freelancer receives your proposal or a payment step is waiting, it will show here.",
  },
  rejected: {
    title: "Rejected proposals",
    description:
      "Keep visibility on declined proposals so you can revise the scope and resend later.",
    emptyTitle: "No rejected proposals",
    emptyDescription:
      "Rejected proposals will appear here if a freelancer turns down the current scope.",
  },
};

const PROPOSAL_STACK_KEYS = [
  "projectStack",
  "project_stack",
  "projectTechStack",
  "project_tech_stack",
  "requiredTechStack",
  "required_tech_stack",
  "techStack",
  "tech_stack",
  "frontendFramework",
  "frontend_framework",
  "backendTechnology",
  "backend_technology",
  "database",
];

const PROPOSAL_STACK_TEXT_KEYS = [
  "projectTitle",
  "title",
  "projectNote",
  "project_note",
  "projectNotes",
  "project_notes",
  "projectRequirement",
  "project_requirement",
  "projectRequirements",
  "project_requirements",
  "requirements",
  "description",
  "summary",
  "content",
];

const STACK_DETECTION_PATTERNS = [
  { label: "Technical SEO", pattern: /\btechnical seo\b/i },
  { label: "Content SEO", pattern: /\bcontent seo\b/i },
  { label: "On-Page SEO", pattern: /\bon[\s-]?page seo\b/i },
  { label: "Off-Page SEO", pattern: /\boff[\s-]?page seo\b/i },
  { label: "Local SEO", pattern: /\blocal seo\b/i },
  { label: "Keyword Research", pattern: /\bkeyword research\b/i },
  { label: "Link Building", pattern: /\blink building\b/i },
  { label: "Google Search Console", pattern: /\bgoogle search console\b|\bgsc\b/i },
  { label: "Ahrefs", pattern: /\bahrefs\b/i },
  { label: "React.js", pattern: /\breact(?:\.js)?\b/i },
  { label: "Next.js", pattern: /\bnext(?:\.js)?\b/i },
  { label: "Node.js", pattern: /\bnode(?:\.js)?\b/i },
  { label: "TypeScript", pattern: /\btypescript\b|\bts\b/i },
  { label: "JavaScript", pattern: /\bjavascript\b|\bjs\b/i },
  { label: "PostgreSQL", pattern: /\bpostgres(?:ql)?\b/i },
  { label: "MySQL", pattern: /\bmysql\b/i },
  { label: "MongoDB", pattern: /\bmongo(?:db)?\b/i },
  { label: "Express.js", pattern: /\bexpress(?:\.js)?\b/i },
  { label: "Tailwind CSS", pattern: /\btailwind\b/i },
  { label: "Flutter", pattern: /\bflutter\b/i },
  { label: "React Native", pattern: /\breact native\b/i },
  { label: "Python", pattern: /\bpython\b|\bdjango\b|\bflask\b|\bfastapi\b/i },
  { label: "PHP", pattern: /\bphp\b|\blaravel\b/i },
  { label: "WordPress", pattern: /\bwordpress\b/i },
  { label: "Shopify", pattern: /\bshopify\b/i },
  { label: "Firebase", pattern: /\bfirebase\b/i },
  { label: "Supabase", pattern: /\bsupabase\b/i },
  { label: "AWS", pattern: /\baws\b|amazon web services/i },
  { label: "Vercel", pattern: /\bvercel\b/i },
  { label: "SEO", pattern: /\bseo\b|search engine optimization/i },
  {
    label: "Content Marketing",
    pattern: /\bcontent marketing\b|\bcontent strategy\b/i,
  },
  { label: "Social Media", pattern: /\bsocial media\b|\bsmm\b/i },
  { label: "Google Ads", pattern: /\bgoogle ads\b|\bppc\b/i },
  {
    label: "Meta Ads",
    pattern: /\bmeta ads\b|\bfacebook ads\b|\binstagram ads\b/i,
  },
  { label: "Branding", pattern: /\bbranding\b|brand identity/i },
];

const PROPOSAL_NARRATIVE_SECTION_ALIASES = Object.freeze({
  overview: [
    "project overview",
    "overview",
    "project summary",
    "solution overview",
  ],
  objectives: [
    "primary objectives",
    "objectives",
    "project objectives",
    "goals",
  ],
  deliverables: [
    "deliverables",
    "deliverables included",
    "features/deliverables included",
    "features included",
    "scope",
    "scope of work",
  ],
  techStack: [
    "tech stack",
    "technical stack",
    "technology stack",
    "stack",
  ],
  notes: [
    "delivery notes",
    "notes",
    "additional notes",
    "implementation notes",
    "handover notes",
  ],
});

const PROPOSAL_METADATA_LABELS = new Set([
  "client name",
  "business name",
  "company name",
  "brand name",
  "service type",
  "service",
  "category",
  "timeline",
  "budget",
  "project name",
  "project title",
  "project",
]);

export const formatBudget = (value) => {
  if (!value) return "Not set";

  const numeric = Number.parseInt(String(value).replace(/[^0-9]/g, ""), 10);
  if (!Number.isFinite(numeric) || numeric <= 0) return String(value);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(numeric);
};

export const parseProposalBudgetValue = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return 0;

  const numeric = Number.parseInt(raw.replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(numeric) ? numeric : 0;
};

export const formatProposalDate = (value) => {
  if (!value) return "No date";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "No date";

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const getDisplayName = (user) =>
  user?.fullName || user?.name || user?.email?.split("@")[0] || "Client";

export const getInitials = (value = "") => {
  const parts = String(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "C";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const normalizeSkillToken = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9#+.]/g, "");

const collectStringValues = (value) => {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value.flatMap((entry) => collectStringValues(entry));
  if (typeof value === "object") {
    return Object.values(value).flatMap((entry) => collectStringValues(entry));
  }
  if (typeof value === "string" || typeof value === "number") return [String(value)];
  return [];
};

const splitSkillValues = (value = "") =>
  String(value || "")
    .split(/,|\/|\||\+|;|&|\band\b/gi)
    .map((entry) => entry.trim())
    .filter(Boolean);

export const collectFreelancerSkillTokens = (freelancer = {}) => {
  const tokenSet = new Set();
  const candidates = collectStringValues([
    freelancer?.matchedTechnologies,
    freelancer?.matchHighlights,
    freelancer?.skills,
    freelancer?.services,
    freelancer?.profileDetails?.services,
    freelancer?.profileDetails?.serviceDetails,
    freelancer?.freelancerProjects,
  ]);

  candidates.forEach((entry) => {
    splitSkillValues(entry).forEach((part) => {
      const normalized = normalizeSkillToken(part);
      if (normalized) tokenSet.add(normalized);
    });
  });

  return tokenSet;
};

export const freelancerMatchesRequiredSkill = (requiredSkill, freelancerSkillTokens) => {
  const required = normalizeSkillToken(requiredSkill);
  if (!required) return false;
  if (freelancerSkillTokens.has(required)) return true;

  for (const token of freelancerSkillTokens) {
    if (!token || token.length < 3 || required.length < 3) continue;
    if (token.includes(required) || required.includes(token)) return true;
  }

  return false;
};

export const extractProjectRequiredSkills = (proposal = {}) => {
  const skills = [];
  const seen = new Set();

  const pushSkill = (rawValue) => {
    const value = String(rawValue || "").trim();
    if (!value || value.length < 2) return;
    const key = normalizeSkillToken(value);
    if (!key || seen.has(key)) return;
    seen.add(key);
    skills.push(value);
  };

  PROPOSAL_STACK_KEYS.forEach((key) => {
    collectStringValues(proposal?.[key]).forEach((entry) => {
      splitSkillValues(entry).forEach(pushSkill);
    });
  });

  if (skills.length > 0) return skills.slice(0, 8);

  const searchText = PROPOSAL_STACK_TEXT_KEYS.map((key) => proposal?.[key])
    .filter(Boolean)
    .join(" ");

  STACK_DETECTION_PATTERNS.forEach(({ label, pattern }) => {
    if (pattern.test(searchText)) pushSkill(label);
  });

  return skills.slice(0, 8);
};

export const hasFreelancerRole = (user = {}) => {
  const primaryRole = String(user?.role || "").toUpperCase();
  const roles = Array.isArray(user?.roles)
    ? user.roles.map((entry) => String(entry || "").toUpperCase())
    : [];
  return primaryRole === "FREELANCER" || roles.includes("FREELANCER");
};

export const normalizeFreelancerCardData = (candidate = {}) => {
  const freelancer = { ...candidate };
  const rawBio = freelancer.bio || freelancer.about;

  if (typeof rawBio === "string" && rawBio.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(rawBio);
      if (!freelancer.location && parsed.location) freelancer.location = parsed.location;
      if (!freelancer.role && parsed.role) freelancer.role = parsed.role;
      if (!freelancer.title && parsed.title) freelancer.title = parsed.title;
      if (!freelancer.rating && parsed.rating) freelancer.rating = parsed.rating;
      if ((!freelancer.skills || freelancer.skills.length === 0) && parsed.skills) {
        freelancer.skills = parsed.skills;
      }
      if (!freelancer.hourlyRate && parsed.hourlyRate) {
        freelancer.hourlyRate = parsed.hourlyRate;
      }

      freelancer.cleanBio =
        parsed.bio ||
        parsed.about ||
        parsed.description ||
        parsed.summary ||
        parsed.overview ||
        parsed.introduction ||
        parsed.profileSummary ||
        parsed.shortDescription ||
        (Array.isArray(parsed.services) && parsed.services.length > 0
          ? `Experienced in ${parsed.services.join(", ")}`
          : null) ||
        "No bio available.";
    } catch {
      freelancer.cleanBio = "Overview available in profile.";
    }
  } else {
    freelancer.cleanBio = rawBio || "No bio available for this freelancer.";
  }

  const matchPercent = resolveFreelancerMatchPercent(freelancer, null);
  if (Number.isFinite(Number(matchPercent))) {
    freelancer.matchPercent = Number(matchPercent);
    freelancer.matchScore = Number(matchPercent);
    freelancer.projectRelevanceScore = Number(matchPercent);
  }

  return freelancer;
};

export const formatRating = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "N/A";
  return numeric.toFixed(1);
};

const getFreelancerMatchScore = (freelancer = {}) => {
  const score = resolveFreelancerMatchPercent(freelancer, null);
  return Number.isFinite(Number(score)) ? Number(score) : null;
};

const getFreelancerMatchedSkills = (freelancer = {}) => {
  const values = [
    ...(Array.isArray(freelancer?.matchedSkills) ? freelancer.matchedSkills : []),
    ...(Array.isArray(freelancer?.caseStudyMatch?.matchedSkills)
      ? freelancer.caseStudyMatch.matchedSkills
      : []),
    ...(Array.isArray(freelancer?.matchedTechnologies) ? freelancer.matchedTechnologies : []),
  ];

  return Array.from(
    new Set(values.map((value) => String(value || "").trim()).filter(Boolean)),
  );
};

const isFreelancerBestMatchEligible = (
  freelancer = {},
  proposalService = "",
) => {
  const score = getFreelancerMatchScore(freelancer);
  if (score === null || score < MIN_FREELANCER_MATCH_SCORE) {
    return false;
  }

  const hasServiceMatch = isFreelancerServiceAligned(freelancer, proposalService);
  if (!hasServiceMatch) {
    return false;
  }

  const matchedSkills = getFreelancerMatchedSkills(freelancer);
  const hasStrongCompletedProjectEvidence =
    freelancer?.matchSource === "completed_project" &&
    score >= MIN_FREELANCER_MATCH_SCORE + 18;

  return matchedSkills.length > 0 || hasStrongCompletedProjectEvidence;
};

export const resolveBestMatchFreelancerIds = (
  freelancers = [],
  proposalService = "",
) => {
  const normalized = Array.isArray(freelancers) ? freelancers : [];
  if (!normalized.length) return new Set();

  const eligible = normalized
    .filter((freelancer) => Boolean(freelancer?.id))
    .filter((freelancer) => isFreelancerBestMatchEligible(freelancer, proposalService))
    .sort((left, right) => {
      const scoreDiff = (getFreelancerMatchScore(right) || 0) - (getFreelancerMatchScore(left) || 0);
      if (scoreDiff !== 0) return scoreDiff;

      const skillDiff =
        getFreelancerMatchedSkills(right).length - getFreelancerMatchedSkills(left).length;
      if (skillDiff !== 0) return skillDiff;

      const rightRating = Number(right?.rating);
      const leftRating = Number(left?.rating);
      const normalizedRightRating = Number.isFinite(rightRating) && rightRating > 0 ? rightRating : 0;
      const normalizedLeftRating = Number.isFinite(leftRating) && leftRating > 0 ? leftRating : 0;
      if (normalizedRightRating !== normalizedLeftRating) {
        return normalizedRightRating - normalizedLeftRating;
      }

      return String(left?.id || "").localeCompare(String(right?.id || ""));
    });

  if (!eligible.length) {
    return new Set();
  }

  return new Set([eligible[0].id]);
};

export const normalizeProposalRecord = (proposal) => proposal ?? {};

export const getFirstNonEmptyText = (...values) => {
  for (const value of values.flat()) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }

  return "";
};

export const extractProposalLabeledValue = (value = "", labels = []) =>
  extractLabeledLineValue(value, labels);

const extractProposalQuestionAnswer = (answers = {}, patterns = []) => {
  if (!answers || typeof answers !== "object") return "";

  for (const [question, answer] of Object.entries(answers)) {
    const normalizedQuestion = String(question || "").trim();
    if (!normalizedQuestion) continue;

    const isMatch = patterns.some((pattern) => pattern.test(normalizedQuestion));
    if (!isMatch) continue;

    const extracted = collectStringValues(answer)
      .map((value) => String(value || "").trim())
      .find(Boolean);

    if (extracted) return extracted;
  }

  return "";
};

const normalizeComparableText = (value = "") =>
  String(value || "").trim().toLowerCase();

export const toDisplayTitleCase = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/(^|[\s/-])([a-z])/g, (match, prefix, char) => `${prefix}${char.toUpperCase()}`);

const stripServiceNameFromProjectTitle = (projectTitle = "", serviceLabel = "") => {
  const normalizedProjectTitle = String(projectTitle || "").trim();
  const normalizedServiceLabel = String(serviceLabel || "").trim();

  if (!normalizedProjectTitle) return "";
  if (!normalizedServiceLabel) return normalizedProjectTitle;

  const titleParts = normalizedProjectTitle
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);

  if (titleParts.length === 2) {
    if (normalizeComparableText(titleParts[0]) === normalizeComparableText(normalizedServiceLabel)) {
      return titleParts[1];
    }

    if (normalizeComparableText(titleParts[1]) === normalizeComparableText(normalizedServiceLabel)) {
      return titleParts[0];
    }
  }

  return normalizedProjectTitle;
};

export const isAssignedFreelancerName = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase();
  return Boolean(normalized) && normalized !== "not assigned";
};

export const getProposalDraftGroupKey = (proposal = {}) => {
  const normalizedProposal = normalizeProposalRecord(proposal);

  if (normalizedProposal.projectId) {
    return `draft-project:${normalizedProposal.projectId}`;
  }

  if (normalizedProposal.draftSignature) {
    return `draft-signature:${normalizedProposal.draftSignature}`;
  }

  return `draft:${normalizedProposal.id ||
    normalizedProposal.title ||
    normalizedProposal.submittedDate ||
    "proposal"}`;
};

export const normalizeProposalStatus = (status = "") => {
  switch (String(status).toUpperCase()) {
    case "DRAFT":
      return "draft";
    case "ACCEPTED":
      return "accepted";
    case "REJECTED":
    case "DECLINED":
      return "rejected";
    case "PENDING":
      return "pending";
    default:
      return "sent";
  }
};

export const getProposalInvitee = (proposal = {}) => {
  const normalizedProposal = normalizeProposalRecord(proposal);
  const name =
    normalizedProposal.recipientName ||
    normalizedProposal.freelancerName ||
    normalizedProposal.freelancer?.fullName ||
    normalizedProposal.freelancer?.name ||
    "";

  if (!isAssignedFreelancerName(name)) return null;

  const inviteeId =
    normalizedProposal.freelancerId ||
    normalizedProposal.recipientId ||
    normalizedProposal.freelancer?.id ||
    name.toLowerCase();

  return {
    id: String(inviteeId),
    name: String(name).trim(),
    proposalId: normalizedProposal.id || null,
    status: normalizeProposalStatus(normalizedProposal.status || "PENDING"),
    submittedDate: formatProposalDate(
      normalizedProposal.updatedAt || normalizedProposal.createdAt,
    ),
    avatar: normalizedProposal.avatar || normalizedProposal.freelancer?.avatar || "",
    rejectionReason: normalizedProposal.rejectionReason || null,
    rejectionReasonKey: normalizedProposal.rejectionReasonKey || null,
  };
};

export const getProposalFreelancerRecipients = (proposal = {}) => {
  const sentFreelancers = Array.isArray(proposal?.sentFreelancers)
    ? proposal.sentFreelancers.filter(Boolean)
    : [];

  if (sentFreelancers.length > 0) {
    return sentFreelancers;
  }

  const invitee = getProposalInvitee(proposal);
  return invitee ? [invitee] : [];
};

export const canUnsendProposalInvitee = (invitee = {}) => {
  const status = String(invitee?.status || "").toLowerCase();
  return Boolean(invitee?.proposalId) && status !== "accepted" && status !== "rejected";
};

export const shouldHideRejectedProposal = (proposal = {}) =>
  HIDDEN_REJECTION_REASON_KEYS.has(
    String(proposal?.rejectionReasonKey || "").trim().toLowerCase(),
  );

export const mergeInviteeCollections = (current = [], incoming = []) => {
  const merged = Array.isArray(current) ? [...current] : [];

  (Array.isArray(incoming) ? incoming : []).forEach((invitee) => {
    if (!invitee) return;
    if (merged.some((entry) => entry?.id === invitee.id)) return;
    merged.push(invitee);
  });

  return merged;
};

export const resolveProposalServiceLabel = (proposal) => {
  const normalizedProposal = normalizeProposalRecord(proposal);
  const proposalContext =
    normalizedProposal.proposalContext &&
      typeof normalizedProposal.proposalContext === "object"
      ? normalizedProposal.proposalContext
      : {};
  const questionnaireAnswersBySlug =
    proposalContext.questionnaireAnswersBySlug &&
      typeof proposalContext.questionnaireAnswersBySlug === "object"
      ? proposalContext.questionnaireAnswersBySlug
      : {};
  const questionnaireAnswers =
    proposalContext.questionnaireAnswers &&
      typeof proposalContext.questionnaireAnswers === "object"
      ? proposalContext.questionnaireAnswers
      : {};
  const contentServiceType = extractProposalLabeledValue(
    normalizedProposal.content || normalizedProposal.summary || "",
    ["Service Type", "Service", "Category"],
  );
  const questionnaireServiceType = getFirstNonEmptyText(
    proposalContext.serviceName,
    proposalContext.serviceType,
    extractProposalQuestionAnswer(questionnaireAnswersBySlug, [
      /service[-_\s]?type/i,
      /service[-_\s]?name/i,
      /^service$/i,
      /^category$/i,
    ]),
    extractProposalQuestionAnswer(questionnaireAnswers, [
      /service type/i,
      /service name/i,
      /category/i,
    ]),
  );

  return (
    contentServiceType ||
    questionnaireServiceType ||
    normalizedProposal.service ||
    normalizedProposal.serviceName ||
    normalizedProposal.serviceKey ||
    normalizedProposal.category ||
    normalizedProposal.project?.service ||
    normalizedProposal.project?.serviceName ||
    "General"
  );
};

export const resolveProposalBusinessName = (proposal) => {
  const normalizedProposal = normalizeProposalRecord(proposal);
  const proposalContext =
    normalizedProposal.proposalContext &&
      typeof normalizedProposal.proposalContext === "object"
      ? normalizedProposal.proposalContext
      : {};
  const questionnaireAnswersBySlug =
    proposalContext.questionnaireAnswersBySlug &&
      typeof proposalContext.questionnaireAnswersBySlug === "object"
      ? proposalContext.questionnaireAnswersBySlug
      : {};
  const questionnaireAnswers =
    proposalContext.questionnaireAnswers &&
      typeof proposalContext.questionnaireAnswers === "object"
      ? proposalContext.questionnaireAnswers
      : {};

  return getFirstNonEmptyText(
    proposalContext.businessName,
    proposalContext.companyName,
    normalizedProposal.businessName,
    normalizedProposal.companyName,
    extractProposalQuestionAnswer(questionnaireAnswersBySlug, [
      /business[-_\s]?name/i,
      /company[-_\s]?name/i,
      /brand[-_\s]?name/i,
    ]),
    extractProposalQuestionAnswer(questionnaireAnswers, [
      /business name/i,
      /company name/i,
      /brand name/i,
    ]),
    extractProposalLabeledValue(normalizedProposal.content || normalizedProposal.summary || "", [
      "Business Name",
      "Company Name",
      "Brand Name",
    ]),
  );
};

export const resolveProposalProjectName = (proposal) => {
  const normalizedProposal = normalizeProposalRecord(proposal);
  const proposalContext =
    normalizedProposal.proposalContext &&
      typeof normalizedProposal.proposalContext === "object"
      ? normalizedProposal.proposalContext
      : {};
  const questionnaireAnswersBySlug =
    proposalContext.questionnaireAnswersBySlug &&
      typeof proposalContext.questionnaireAnswersBySlug === "object"
      ? proposalContext.questionnaireAnswersBySlug
      : {};
  const questionnaireAnswers =
    proposalContext.questionnaireAnswers &&
      typeof proposalContext.questionnaireAnswers === "object"
      ? proposalContext.questionnaireAnswers
      : {};
  const serviceLabel = resolveProposalServiceLabel(normalizedProposal);
  const businessNameFallback = resolveProposalBusinessName(normalizedProposal);
  const contentProjectName = extractProposalLabeledValue(
    normalizedProposal.content || normalizedProposal.summary || "",
    ["Project Name", "Project Title", "Project"],
  );
  const questionnaireProjectName = getFirstNonEmptyText(
    proposalContext.projectTitle,
    proposalContext.projectName,
    extractProposalQuestionAnswer(questionnaireAnswersBySlug, [
      /project[-_\s]?name/i,
      /project[-_\s]?title/i,
      /^title$/i,
    ]),
    extractProposalQuestionAnswer(questionnaireAnswers, [
      /project name/i,
      /project title/i,
    ]),
  );
  const projectTitle = getFirstNonEmptyText(
    normalizedProposal.project?.title,
    normalizedProposal.project?.name,
    normalizedProposal.projectTitle,
    normalizedProposal.projectName,
    questionnaireProjectName,
    contentProjectName,
    businessNameFallback,
    normalizedProposal.title,
  );
  const cleanedProjectTitle = stripServiceNameFromProjectTitle(projectTitle, serviceLabel);

  if (
    cleanedProjectTitle &&
    normalizeComparableText(cleanedProjectTitle) !== normalizeComparableText(serviceLabel)
  ) {
    return cleanedProjectTitle;
  }

  if (
    businessNameFallback &&
    normalizeComparableText(businessNameFallback) !== normalizeComparableText(serviceLabel)
  ) {
    return businessNameFallback;
  }

  return cleanedProjectTitle || serviceLabel || "Proposal";
};

export const resolveProposalTitle = (proposal) => resolveProposalProjectName(proposal);

const normalizeProposalSectionLabel = (value = "") =>
  normalizeComparableText(String(value || "").replace(/^#+\s*/, "").replace(/[:：]\s*$/, ""));

const normalizeProposalListItem = (value = "") =>
  String(value || "")
    .replace(/^(?:[-*•]+|\d+[.)])\s*/, "")
    .replace(/\s+/g, " ")
    .trim();

const dedupeProposalTextItems = (values = []) => {
  const seen = new Set();
  const items = [];

  values.forEach((value) => {
    const normalized = normalizeProposalListItem(value);
    const key = normalizeComparableText(normalized);
    if (!normalized || !key || seen.has(key)) return;
    seen.add(key);
    items.push(normalized);
  });

  return items;
};

export const parseProposalEditableList = (value = "", options = {}) => {
  const { splitCommas = false } = options;
  const source = String(value || "");
  if (!source.trim()) return [];

  const normalizedSource = splitCommas ? source.replace(/,\s*/g, "\n") : source;
  return dedupeProposalTextItems(
    normalizedSource
      .split(/\r?\n|[•]/)
      .map((entry) => normalizeProposalListItem(entry))
      .filter(Boolean),
  );
};

const serializeProposalEditableList = (values = []) =>
  dedupeProposalTextItems(values).join("\n");

const resolveProposalNarrativeSectionKey = (label = "") => {
  const normalizedLabel = normalizeProposalSectionLabel(label);

  return (
    Object.entries(PROPOSAL_NARRATIVE_SECTION_ALIASES).find(([, aliases]) =>
      aliases.some((alias) => normalizeComparableText(alias) === normalizedLabel),
    )?.[0] || null
  );
};

const compactProposalSectionText = (lines = []) =>
  String(
    (Array.isArray(lines) ? lines : [])
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  );

const parseProposalNarrativeSections = (content = "") => {
  const sections = {
    intro: [],
    overview: [],
    objectives: [],
    deliverables: [],
    techStack: [],
    notes: [],
  };
  let activeSectionKey = null;

  String(content || "")
    .split(/\r?\n/)
    .forEach((rawLine) => {
      const trimmedLine = rawLine.trim();

      if (!trimmedLine) {
        if (activeSectionKey) {
          const targetSection = sections[activeSectionKey];
          if (targetSection[targetSection.length - 1] !== "") {
            targetSection.push("");
          }
        }
        return;
      }

      const markdownHeadingMatch = trimmedLine.match(/^#{1,6}\s*(.+)$/);
      const labeledLineMatch = trimmedLine.match(/^([A-Za-z][A-Za-z\s/&()'-]{2,60})\s*:\s*(.*)$/);
      const detectedLabel = markdownHeadingMatch?.[1] || labeledLineMatch?.[1] || "";
      const sectionKey = resolveProposalNarrativeSectionKey(detectedLabel);

      if (sectionKey) {
        activeSectionKey = sectionKey;
        const inlineValue = labeledLineMatch?.[2]?.trim();
        if (inlineValue) {
          sections[sectionKey].push(inlineValue);
        }
        return;
      }

      if (
        labeledLineMatch &&
        PROPOSAL_METADATA_LABELS.has(normalizeProposalSectionLabel(labeledLineMatch[1]))
      ) {
        activeSectionKey = null;
        return;
      }

      if (activeSectionKey) {
        sections[activeSectionKey].push(trimmedLine);
        return;
      }

      sections.intro.push(trimmedLine);
    });

  return sections;
};

export const buildProposalStructuredData = (proposal, clientNameFallback = "Client") => {
  const normalizedProposal = normalizeProposalRecord(proposal);
  const proposalContext =
    normalizedProposal.proposalContext &&
      typeof normalizedProposal.proposalContext === "object"
      ? normalizedProposal.proposalContext
      : {};
  const questionnaireAnswersBySlug =
    proposalContext.questionnaireAnswersBySlug &&
      typeof proposalContext.questionnaireAnswersBySlug === "object"
      ? proposalContext.questionnaireAnswersBySlug
      : {};
  const questionnaireAnswers =
    proposalContext.questionnaireAnswers &&
      typeof proposalContext.questionnaireAnswers === "object"
      ? proposalContext.questionnaireAnswers
      : {};
  const content = normalizedProposal.content || normalizedProposal.summary || "";
  const narrativeSections = parseProposalNarrativeSections(content);
  const extractedBudget =
    normalizedProposal.budget !== undefined && normalizedProposal.budget !== null
      ? String(normalizedProposal.budget)
      : "";
  const extractedTimelineFromContent = extractProposalLabeledValue(content, [
    "Timeline",
    "Launch Timeline",
    "Delivery",
    "Deadline",
  ]);
  const extractedTimeline = getFirstNonEmptyText(
    extractedTimelineFromContent,
    proposalContext.timeline,
    proposalContext.launchTimeline,
    normalizedProposal.timeline,
    extractProposalQuestionAnswer(questionnaireAnswersBySlug, [
      /launch[-_\s]?timeline/i,
      /timeline/i,
      /delivery/i,
      /deadline/i,
    ]),
    extractProposalQuestionAnswer(questionnaireAnswers, [
      /launch timeline/i,
      /timeline/i,
      /delivery/i,
      /deadline/i,
    ]),
  );

  const objectives = dedupeProposalTextItems([
    ...parseProposalEditableList(compactProposalSectionText(narrativeSections.objectives)),
    ...parseProposalEditableList(
      extractProposalQuestionAnswer(questionnaireAnswersBySlug, [/objective/i, /goal/i]),
    ),
    ...parseProposalEditableList(
      extractProposalQuestionAnswer(questionnaireAnswers, [/objective/i, /goal/i]),
    ),
  ]);

  const deliverables = dedupeProposalTextItems([
    ...parseProposalEditableList(compactProposalSectionText(narrativeSections.deliverables)),
    ...parseProposalEditableList(
      extractProposalQuestionAnswer(questionnaireAnswersBySlug, [
        /deliverables?/i,
        /features?/i,
        /scope/i,
      ]),
    ),
    ...parseProposalEditableList(
      extractProposalQuestionAnswer(questionnaireAnswers, [
        /deliverables?/i,
        /features?/i,
        /scope/i,
      ]),
    ),
  ]);

  const techStack = dedupeProposalTextItems([
    ...parseProposalEditableList(compactProposalSectionText(narrativeSections.techStack), {
      splitCommas: true,
    }),
    ...extractProjectRequiredSkills(normalizedProposal),
  ]);

  const overview = getFirstNonEmptyText(
    compactProposalSectionText(narrativeSections.overview),
    compactProposalSectionText(narrativeSections.intro),
    extractProposalQuestionAnswer(questionnaireAnswersBySlug, [
      /project[-_\s]?(overview|summary|description)/i,
      /overview/i,
      /project brief/i,
    ]),
    extractProposalQuestionAnswer(questionnaireAnswers, [
      /project overview/i,
      /project summary/i,
      /project description/i,
      /overview/i,
    ]),
    content,
  );

  const notes = getFirstNonEmptyText(
    compactProposalSectionText(narrativeSections.notes),
    extractProposalQuestionAnswer(questionnaireAnswersBySlug, [
      /delivery[-_\s]?notes?/i,
      /notes?/i,
      /special instructions/i,
    ]),
    extractProposalQuestionAnswer(questionnaireAnswers, [
      /delivery notes/i,
      /notes?/i,
      /special instructions/i,
    ]),
  );

  return {
    title: resolveProposalTitle(normalizedProposal),
    businessName: resolveProposalBusinessName(normalizedProposal),
    clientName: getFirstNonEmptyText(
      normalizedProposal.clientName,
      proposalContext.clientName,
      extractProposalQuestionAnswer(questionnaireAnswersBySlug, [
        /client[-_\s]?name/i,
        /owner[-_\s]?name/i,
      ]),
      extractProposalQuestionAnswer(questionnaireAnswers, [
        /client name/i,
        /owner name/i,
      ]),
      clientNameFallback,
    ),
    service: resolveProposalServiceLabel(normalizedProposal),
    budget: extractedBudget,
    timeline: extractedTimeline,
    projectOverview: overview,
    objectives,
    objectivesText: serializeProposalEditableList(objectives),
    deliverables,
    deliverablesText: serializeProposalEditableList(deliverables),
    techStack,
    techStackText: serializeProposalEditableList(techStack),
    notes,
    content,
  };
};

export const buildProposalContentFromDraft = (draft = {}) => {
  const objectives = parseProposalEditableList(draft.objectivesText);
  const deliverables = parseProposalEditableList(draft.deliverablesText);
  const techStack = parseProposalEditableList(draft.techStackText, { splitCommas: true });
  const sections = [];

  const pushSection = (label, value) => {
    const cleanedValue = String(value || "").trim();
    if (!cleanedValue) return;
    sections.push(`${label}: ${cleanedValue}`);
  };

  pushSection("Client Name", draft.clientName);
  pushSection("Business Name", draft.businessName);
  pushSection("Service Type", draft.service);
  pushSection("Timeline", draft.timeline);
  pushSection("Budget", draft.budget);

  const overview = String(draft.projectOverview || "").trim();
  if (overview) {
    sections.push("");
    sections.push("Project Overview:");
    sections.push(overview);
  }

  if (objectives.length > 0) {
    sections.push("");
    sections.push("Primary Objectives:");
    objectives.forEach((item) => sections.push(`- ${item}`));
  }

  if (deliverables.length > 0) {
    sections.push("");
    sections.push("Deliverables Included:");
    deliverables.forEach((item) => sections.push(`- ${item}`));
  }

  if (techStack.length > 0) {
    sections.push("");
    sections.push(`Tech Stack: ${techStack.join(", ")}`);
  }

  const notes = String(draft.notes || "").trim();
  if (notes) {
    sections.push("");
    sections.push("Delivery Notes:");
    sections.push(notes);
  }

  return sections.join("\n").trim();
};

export const buildUpdatedProposalContext = (
  currentContext = null,
  draft = {},
  clientNameFallback = "Client",
) => {
  const nextContext =
    currentContext && typeof currentContext === "object" ? { ...currentContext } : {};

  nextContext.projectTitle = String(draft.title || "").trim();
  nextContext.projectName = String(draft.title || "").trim();
  nextContext.businessName = String(draft.businessName || "").trim();
  nextContext.companyName = String(draft.businessName || "").trim();
  nextContext.clientName = String(draft.clientName || "").trim() || clientNameFallback;
  nextContext.serviceName = String(draft.service || "").trim();
  nextContext.serviceType = String(draft.serviceType || draft.service || currentContext?.serviceType || "").trim();
  nextContext.timeline = String(draft.timeline || "").trim();

  return nextContext;
};

export const extractProposalDetails = (proposal) => {
  const normalizedProposal = normalizeProposalRecord(proposal);
  let budget =
    normalizedProposal.budget || normalizedProposal.project?.budget || "Not set";
  let delivery =
    normalizedProposal.timeline ||
    normalizedProposal.project?.timeline ||
    "Not set";

  if (delivery === "Not set" && normalizedProposal.content) {
    const extractedTimeline = extractProposalLabeledValue(
      normalizedProposal.content,
      ["Timeline", "Launch Timeline"],
    );
    if (extractedTimeline) delivery = extractedTimeline;
  }

  return {
    budget: formatBudget(budget),
    delivery,
    requiresPayment: Boolean(normalizedProposal.requiresPayment),
    statusDisplay:
      normalizedProposal.requiresPayment
        ? "Awaiting Payment"
        : normalizedProposal.status === "draft"
          ? "Draft"
          : normalizedProposal.status === "rejected"
            ? "Rejected"
            : "Pending Review",
  };
};

export const mapApiProposal = (proposal) => {
  const normalizedProposal = normalizeProposalRecord(proposal);
  const projectTitle = resolveProposalProjectName(normalizedProposal);
  const serviceLabel = resolveProposalServiceLabel(normalizedProposal);
  const freelancerName =
    normalizedProposal.freelancer?.fullName ||
    normalizedProposal.freelancer?.name ||
    normalizedProposal.freelancer?.email ||
    normalizedProposal.freelancerName ||
    "Freelancer";
  const freelancerAvatar =
    normalizedProposal.freelancer?.avatar || normalizedProposal.avatar || "";
  const projectStatus = String(normalizedProposal.project?.status || "").toUpperCase();
  const spentAmount = Number(normalizedProposal.project?.spent || 0);
  const requiresPayment =
    projectStatus === "AWAITING_PAYMENT" &&
    String(normalizedProposal.status || "").toUpperCase() === "ACCEPTED" &&
    spentAmount <= 0;

  return {
    id: normalizedProposal.id,
    projectTitle,
    title: projectTitle || "Proposal",
    category: serviceLabel,
    service: serviceLabel,
    serviceType:
      normalizedProposal.serviceType ||
      normalizedProposal.proposalContext?.serviceType ||
      normalizedProposal.project?.serviceType ||
      normalizedProposal.service ||
      serviceLabel,
    serviceKey:
      normalizedProposal.serviceKey ||
      normalizedProposal.project?.serviceKey ||
      normalizedProposal.project?.category ||
      normalizedProposal.category ||
      "",
    projectStack:
      normalizedProposal.projectStack ||
      normalizedProposal.project?.projectStack ||
      normalizedProposal.project?.proposalJson?.projectStack ||
      null,
    techStack:
      normalizedProposal.techStack ||
      normalizedProposal.project?.techStack ||
      normalizedProposal.project?.proposalJson?.techStack ||
      null,
    status: normalizeProposalStatus(normalizedProposal.status || "PENDING"),
    recipientName: freelancerName,
    recipientId: normalizedProposal.freelancer?.id || "FREELANCER",
    projectId: normalizedProposal.projectId || normalizedProposal.project?.id || null,
    freelancerId:
      normalizedProposal.freelancer?.id || normalizedProposal.freelancerId || null,
    submittedDate: formatProposalDate(
      normalizedProposal.updatedAt || normalizedProposal.createdAt,
    ),
    avatar: freelancerAvatar,
    summary:
      normalizedProposal.summary ||
      normalizedProposal.content ||
      normalizedProposal.description ||
      normalizedProposal.project?.description ||
      "",
    content:
      normalizedProposal.content ||
      normalizedProposal.description ||
      normalizedProposal.summary ||
      normalizedProposal.project?.description ||
      "",
    budget:
      normalizedProposal.budget ||
      normalizedProposal.amount ||
      normalizedProposal.project?.budget,
    timeline:
      normalizedProposal.timeline || normalizedProposal.project?.timeline,
    projectStatus,
    requiresPayment,
    createdAt: normalizedProposal.createdAt || null,
    updatedAt: normalizedProposal.updatedAt || normalizedProposal.createdAt || null,
    syncedProjectId:
      normalizedProposal.projectId || normalizedProposal.project?.id || null,
    proposalContext:
      normalizedProposal.proposalContext ||
      normalizedProposal.project?.proposalJson?.contextSnapshot ||
      null,
    rejectionReason: normalizedProposal.rejectionReason || null,
    rejectionReasonKey: normalizedProposal.rejectionReasonKey || null,
  };
};

export const mapLocalDraftProposal = (proposal) => {
  const normalizedProposal = normalizeProposalRecord(proposal);
  const projectTitle = resolveProposalProjectName(normalizedProposal);
  const serviceLabel = resolveProposalServiceLabel(normalizedProposal);

  return {
    id: normalizedProposal.id,
    projectTitle,
    title: projectTitle || "Proposal Draft",
    category: serviceLabel,
    service: serviceLabel,
    serviceType:
      normalizedProposal.serviceType ||
      normalizedProposal.proposalContext?.serviceType ||
      normalizedProposal.project?.serviceType ||
      normalizedProposal.service ||
      serviceLabel,
    serviceKey: normalizedProposal.serviceKey || normalizedProposal.service || "",
    projectStack:
      normalizedProposal.projectStack ||
      normalizedProposal.project?.projectStack ||
      normalizedProposal.project?.proposalJson?.projectStack ||
      null,
    techStack:
      normalizedProposal.techStack ||
      normalizedProposal.project?.techStack ||
      normalizedProposal.project?.proposalJson?.techStack ||
      null,
    status: "draft",
    recipientName:
      normalizedProposal.recipientName ||
      normalizedProposal.preparedFor ||
      "Not assigned",
    recipientId: normalizedProposal.recipientId || "LOCAL_DRAFT",
    projectId:
      normalizedProposal.syncedProjectId || normalizedProposal.projectId || null,
    syncedProjectId:
      normalizedProposal.syncedProjectId || normalizedProposal.projectId || null,
    freelancerId: normalizedProposal.freelancerId || null,
    submittedDate: formatProposalDate(
      normalizedProposal.updatedAt ||
      normalizedProposal.createdAt ||
      new Date().toISOString(),
    ),
    avatar: normalizedProposal.avatar || "",
    summary: normalizedProposal.summary || normalizedProposal.content || "",
    content: normalizedProposal.summary || normalizedProposal.content || "",
    budget: normalizedProposal.budget || "",
    timeline: normalizedProposal.timeline || "",
    projectStatus: normalizedProposal.syncedProjectId ? "DRAFT" : "LOCAL_DRAFT",
    requiresPayment: false,
    isLocalDraft: true,
    draftSignature: getProposalSignature(normalizedProposal),
    createdAt: normalizedProposal.createdAt || null,
    updatedAt: normalizedProposal.updatedAt || normalizedProposal.createdAt || null,
    proposalContext: normalizedProposal.proposalContext || null,
    projectStack:
      normalizedProposal.projectStack ||
      normalizedProposal.project_stack ||
      normalizedProposal.requiredTechStack ||
      normalizedProposal.required_tech_stack ||
      null,
    techStack:
      normalizedProposal.techStack || normalizedProposal.tech_stack || null,
    requirements: normalizedProposal.requirements || null,
  };
};

export const buildEditableProposalDraft = (proposal, clientNameFallback = "Client") => {
  if (!proposal) {
    return {
      title: "",
      businessName: "",
      clientName: clientNameFallback,
      service: "",
      budget: "",
      timeline: "",
      projectOverview: "",
      objectivesText: "",
      deliverablesText: "",
      techStackText: "",
      notes: "",
      content: "",
    };
  }

  const details = extractProposalDetails(proposal);
  const structuredDraft = buildProposalStructuredData(proposal, clientNameFallback);

  return {
    title: structuredDraft.title,
    businessName: structuredDraft.businessName,
    clientName: structuredDraft.clientName,
    service: structuredDraft.service,
    budget:
      proposal?.budget !== undefined && proposal?.budget !== null
        ? String(proposal.budget)
        : details.budget === "Not set"
          ? ""
          : String(details.budget),
    timeline:
      structuredDraft.timeline ||
      (details.delivery === "Not set" ? "" : details.delivery),
    projectOverview: structuredDraft.projectOverview,
    objectivesText: structuredDraft.objectivesText,
    deliverablesText: structuredDraft.deliverablesText,
    techStackText: structuredDraft.techStackText,
    notes: structuredDraft.notes,
    content: proposal?.content || structuredDraft.content || "",
  };
};

const getProposalMergeKey = (proposal) => {
  const normalizedProposal = normalizeProposalRecord(proposal);

  if (normalizedProposal.isLocalDraft) {
    if (normalizedProposal.projectId) {
      return `draft-project:${normalizedProposal.projectId}`;
    }
    return `draft:${normalizedProposal.draftSignature || normalizedProposal.id}`;
  }

  if (
    normalizedProposal.status === "draft" &&
    normalizedProposal.projectId &&
    !normalizedProposal.freelancerId
  ) {
    return `draft-project:${normalizedProposal.projectId}`;
  }

  if (normalizedProposal.id) return `proposal:${normalizedProposal.id}`;
  if (normalizedProposal.projectId && normalizedProposal.freelancerId) {
    return `proposal:${normalizedProposal.projectId}:${normalizedProposal.freelancerId}`;
  }

  return `proposal:${normalizedProposal.projectId ||
    normalizedProposal.title ||
    normalizedProposal.submittedDate}`;
};

export const mergeProposalCollections = (remote = [], localDrafts = []) => {
  const merged = [];
  const seen = new Set();

  const pushUnique = (proposal) => {
    const key = getProposalMergeKey(proposal);
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(proposal);
  };

  remote.forEach(pushUnique);
  localDrafts.forEach(pushUnique);

  return merged;
};

export const deleteLocalDraftProposal = (proposalId, userId) => {
  const storageKeys = getProposalStorageKeys(userId);
  const { proposals, activeId } = loadSavedProposalsFromStorage(userId);
  const remaining = proposals.filter((proposal) => proposal.id !== proposalId);
  const preferredActiveId = activeId === proposalId ? null : activeId;
  const nextActiveId = resolveActiveProposalId(remaining, preferredActiveId, null);

  persistSavedProposalsToStorage(remaining, nextActiveId, storageKeys);
};

export const generateFreelancerGradient = (id) => {
  if (!id) return "linear-gradient(135deg, #0f172a, #1d4ed8)";

  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = id.charCodeAt(index) + ((hash << 5) - hash);
  }

  const firstHue = Math.abs(hash % 360);
  const secondHue = (firstHue + 44) % 360;
  return `linear-gradient(135deg, hsl(${firstHue}, 78%, 58%), hsl(${secondHue}, 78%, 48%))`;
};
