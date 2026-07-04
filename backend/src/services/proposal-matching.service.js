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
import { generateProposalMatchInsights } from "./ai.service.js";

const DEFAULT_MATCH_LIMIT = 20;
const DEFAULT_MIN_RESULTS = 5;
const DEFAULT_AI_INSIGHT_LIMIT = 5;
const SKILLS_MATCH_MAX_SCORE = 42;

const SOURCE_PRIORITY_SCORES = Object.freeze({
  level_1_completed_project: 45,
  level_2_case_study: 30,
  level_3_profile_skills: 15,
});

const MATCH_SCORE_MAX_RAW =
  Math.max(...Object.values(SOURCE_PRIORITY_SCORES)) +
  28 + // service
  SKILLS_MATCH_MAX_SCORE +
  10 + // niches
  15 + // budget
  8 + // project type
  8 + // timeline
  8 + // text relevance
  10 + // availability
  8 + // rating
  10; // recency

const SERVICE_EQUIVALENCE_GROUPS = Object.freeze([
  ["web_development", "website_development", "web_dev", "web_design_development"],
  [
    "app_development",
    "app_dev",
    "mobile_app_development",
    "android_app_development",
    "ios_app_development",
  ],
  ["seo", "search_engine_optimization"],
  ["social_media_marketing", "smm"],
  ["ui_ux_design", "ux_ui_design", "product_design"],
  ["graphic_design", "branding", "brand_design"],
  ["video_editing", "video_production"],
]);

const SERVICE_ALIAS_MAP = SERVICE_EQUIVALENCE_GROUPS.reduce((accumulator, group) => {
  const canonical = group[0];
  group.forEach((value) => {
    accumulator[value] = canonical;
  });
  return accumulator;
}, {});

const SERVICE_HIERARCHY = Object.freeze({
  creative_design: [
    "ui_ux_design",
    "graphic_design",
    "publishing",
    "motion_design",
    "prototyping",
    "presentation_design",
    "video_editing",
    "branding",
    "brand_design",
    "product_design",
    "ux_ui_design",
    "video_production",
  ],
  digital_marketing: [
    "seo",
    "social_media_marketing",
    "search_engine_optimization",
    "smm",
    "performance_marketing",
    "email_marketing",
    "content_marketing",
    "marketing",
  ],
  web_development: [
    "website_development",
    "web_dev",
    "frontend_development",
    "backend_development",
    "full_stack_development",
    "ecommerce_development",
    "wordpress_development",
  ],
  app_development: [
    "mobile_app_development",
    "android_app_development",
    "ios_app_development",
    "cross_platform_app_development",
  ],
});

const SERVICE_PARENT_MAP = Object.freeze(
  Object.entries(SERVICE_HIERARCHY).reduce((acc, [parent, children]) => {
    children.forEach((child) => {
      const canonicalChild = SERVICE_ALIAS_MAP[child] || child;
      if (!acc[canonicalChild]) acc[canonicalChild] = [];
      if (!acc[canonicalChild].includes(parent)) {
        acc[canonicalChild].push(parent);
      }
    });
    return acc;
  }, {})
);

const expandServiceSignal = (signal) => {
  if (!signal) return [];
  const expanded = new Set([signal]);

  if (SERVICE_HIERARCHY[signal]) {
    SERVICE_HIERARCHY[signal].forEach((child) => {
      expanded.add(SERVICE_ALIAS_MAP[child] || child);
    });
  }

  if (SERVICE_PARENT_MAP[signal]) {
    SERVICE_PARENT_MAP[signal].forEach((parent) => expanded.add(parent));
  }

  return Array.from(expanded);
};

const isServiceCompatible = (signalA, signalB) => {
  if (!signalA || !signalB) return false;
  if (signalA === signalB) return true;

  const expandedA = expandServiceSignal(signalA);
  const expandedB = expandServiceSignal(signalB);

  return expandedA.some((a) => expandedB.includes(a));
};

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

const TECHNOLOGY_KEYWORD_PATTERNS = Object.freeze([
  { label: "React.js", pattern: /\breact(?:\.js)?\b/i },
  { label: "Next.js", pattern: /\bnext(?:\.js)?\b/i },
  { label: "Node.js", pattern: /\bnode(?:\.js)?\b/i },
  { label: "Express.js", pattern: /\bexpress(?:\.js)?\b/i },
  { label: "TypeScript", pattern: /\btypescript\b|\bts\b/i },
  { label: "JavaScript", pattern: /\bjavascript\b|\bjs\b/i },
  { label: "PostgreSQL", pattern: /\bpostgres(?:ql)?\b/i },
  { label: "MySQL", pattern: /\bmysql\b/i },
  { label: "MongoDB", pattern: /\bmongo(?:db)?\b/i },
  { label: "Tailwind CSS", pattern: /\btailwind\b/i },
  { label: "Shopify", pattern: /\bshopify\b/i },
  { label: "WordPress", pattern: /\bwordpress\b/i },
  { label: "Flutter", pattern: /\bflutter\b/i },
  { label: "React Native", pattern: /\breact native\b/i },
  { label: "Firebase", pattern: /\bfirebase\b/i },
  { label: "Supabase", pattern: /\bsupabase\b/i },
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

const splitCombinedServiceLookupValue = (value = "") =>
  String(value || "")
    .split(/[,|]/)
    .map((item) => cleanText(item))
    .filter(Boolean);

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

const normalizeServiceSignal = (value = "") => {
  const normalized = normalizeServiceKey(value);
  if (!normalized) return "";

  return SERVICE_ALIAS_MAP[normalized] || normalized;
};

const humanizeServiceLabel = (value = "") =>
  normalizeServiceSignal(value)
    .split("_")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

const collectServiceSignals = (...values) => {
  const listItems = values.flatMap((value) => {
    if (typeof value === "string") {
      return [value, ...normalizeList(value)];
    }
    return normalizeList(value);
  });
  return uniqueItems(listItems)
    .map((value) => normalizeServiceSignal(value))
    .filter(Boolean)
    .filter((value, index, collection) => collection.indexOf(value) === index);
};

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

const collectAgencyServiceCandidates = (source = {}) => {
  const proposalContext =
    source?.proposalContext && isPlainObject(source.proposalContext)
      ? source.proposalContext
      : source?.proposalJson && isPlainObject(source.proposalJson?.contextSnapshot)
        ? source.proposalJson.contextSnapshot
        : {};
  const candidates = [];
  const pushCandidate = (value) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => pushCandidate(entry));
      return;
    }

    if (isPlainObject(value)) {
      pushCandidate(value.id);
      pushCandidate(value.slug);
      pushCandidate(value.name);
      pushCandidate(value.serviceId);
      pushCandidate(value.serviceName);
      return;
    }

    splitCombinedServiceLookupValue(value).forEach((entry) => {
      candidates.push(entry);
    });
  };

  [
    source?.serviceKey,
    source?.serviceType,
    source?.service,
    source?.serviceName,
    source?.category,
    source?.services,
    proposalContext?.selectedServiceIds,
    proposalContext?.selectedServiceNames,
    proposalContext?.serviceIds,
    proposalContext?.serviceNames,
  ].forEach((value) => pushCandidate(value));

  if (Array.isArray(proposalContext?.selectedServices)) {
    proposalContext.selectedServices.forEach((service) => pushCandidate(service));
  }

  return collectServiceSignals(candidates);
};

const resolveAgencyProposalFlag = (source = {}) => {
  if (typeof source?.isAgencyProposal === "boolean") {
    return source.isAgencyProposal;
  }

  const proposalContext =
    source?.proposalContext && isPlainObject(source.proposalContext)
      ? source.proposalContext
      : source?.proposalJson && isPlainObject(source.proposalJson?.contextSnapshot)
        ? source.proposalJson.contextSnapshot
        : {};
  const flowMode = cleanText(proposalContext?.flowMode).toLowerCase();
  if (flowMode === "agency") return true;
  if (flowMode === "freelancer" || flowMode === "individual") return false;
  return collectAgencyServiceCandidates(source).length > 1;
};

const inferTechnologySkills = (...values) => {
  const sourceText = values
    .flatMap((value) => collectTextValues(value))
    .join(" ");

  if (!sourceText.trim()) {
    return [];
  }

  const inferred = [];
  TECHNOLOGY_KEYWORD_PATTERNS.forEach(({ label, pattern }) => {
    if (pattern.test(sourceText)) {
      inferred.push(label);
    }
  });

  return uniqueItems(inferred);
};

const clampPercentage = (value, fallback = 0) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.max(0, Math.min(100, Math.round(numericValue)));
};

const normalizeMatchPercentage = (
  rawScore,
  maxRawScore = MATCH_SCORE_MAX_RAW,
) => {
  const numericRawScore = Number(rawScore);
  const numericMaxRawScore = Number(maxRawScore);

  if (!Number.isFinite(numericRawScore) || !Number.isFinite(numericMaxRawScore)) {
    return 0;
  }

  if (numericMaxRawScore <= 0) {
    return 0;
  }

  const normalized = (numericRawScore / numericMaxRawScore) * 100;
  return clampPercentage(normalized, 0);
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

export const buildMatchingProfile = (source = {}) => {
  const matchingSeed = buildProjectMatchingSeed(source) || {};
  const project = isPlainObject(matchingSeed.project) ? matchingSeed.project : {};
  const matchingQuery = isPlainObject(matchingSeed.matchingQuery)
    ? matchingSeed.matchingQuery
    : {};
  const fitProfile = isPlainObject(matchingSeed.fitProfile)
    ? matchingSeed.fitProfile
    : {};

  const serviceKeys = collectServiceSignals(
    source?.serviceKey,
    source?.serviceType,
    source?.service,
    source?.serviceName,
    source?.category,
    project?.serviceKey,
    project?.serviceType,
    matchingQuery?.category,
  );
  const agencyServiceKeys = uniqueItems([
    ...collectAgencyServiceCandidates(source),
    ...serviceKeys,
  ]);
  const isAgencyProposal = resolveAgencyProposalFlag({
    ...source,
    proposalJson: source?.proposalJson,
    proposalContext:
      source?.proposalContext && isPlainObject(source.proposalContext)
        ? source.proposalContext
        : source?.proposalJson && isPlainObject(source.proposalJson?.contextSnapshot)
          ? source.proposalJson.contextSnapshot
          : undefined,
  });

  return {
    id: source?.id || null,
    title:
      cleanText(source?.title) ||
      cleanText(source?.projectTitle) ||
      cleanText(project?.title) ||
      "Proposal",
    serviceKey: serviceKeys[0] || "",
    serviceKeys,
    agencyServiceKeys,
    isAgencyProposal,
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
      ...normalizeList(source?.techStack),
      ...normalizeList(source?.projectStack),
      ...normalizeList(source?.frontendFramework),
      ...normalizeList(source?.backendTechnology),
      ...normalizeList(source?.databaseType),
      ...inferTechnologySkills(
        source?.title,
        source?.summary,
        source?.content,
        source?.proposalContent,
      ),
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

  const serviceKeys = collectServiceSignals(
    completedProject?.serviceKey,
    completedProject?.serviceType,
    matchingQuery?.category,
  );

  return {
    recordId: completedProject?.id || null,
    recordTitle: cleanText(completedProject?.title) || "Completed project",
    serviceKey: serviceKeys[0] || "",
    serviceKeys,
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

const hasMeaningfulCaseStudyContent = (caseStudy = {}) =>
  collectTextValues(caseStudy).some((entry) => String(entry || "").trim().length > 0);

const buildCaseStudyProfile = (source = {}, index = 0) => {
  const resolvedSource = isPlainObject(source) ? source : {};
  const detail = isPlainObject(resolvedSource?.detail) ? resolvedSource.detail : {};
  const caseStudy = isPlainObject(resolvedSource?.caseStudy)
    ? resolvedSource.caseStudy
    : resolvedSource;

  if (!hasMeaningfulCaseStudyContent(caseStudy)) {
    return null;
  }

  const detailTitle = cleanText(detail?.title || detail?.serviceTitle || "");
  const primaryServiceKey = normalizeServiceSignal(
    resolvedSource?.serviceKey ||
      detail?.serviceKey ||
      caseStudy?.serviceKey ||
      caseStudy?.service ||
      caseStudy?.serviceName ||
      caseStudy?.serviceType,
  );
  const serviceLabel = cleanText(
    caseStudy?.service ||
      caseStudy?.serviceName ||
      caseStudy?.category ||
      caseStudy?.serviceType ||
      humanizeServiceLabel(primaryServiceKey),
  );
  const title = cleanText(
    caseStudy?.title || caseStudy?.projectTitle || caseStudy?.name || detailTitle,
  );
  const description = cleanText(
    caseStudy?.description ||
      caseStudy?.summary ||
      caseStudy?.overview ||
      caseStudy?.content ||
      "",
  );
  const serviceKeys = collectServiceSignals(
    primaryServiceKey,
    caseStudy?.serviceKeys,
    caseStudy?.services,
    caseStudy?.serviceTags,
    caseStudy?.serviceKey,
    caseStudy?.serviceName,
    caseStudy?.serviceType,
    serviceLabel,
  );
  const tags = uniqueItems([
    ...normalizeList(detail?.keywords),
    ...normalizeList(caseStudy?.tags),
    ...normalizeList(caseStudy?.deliverables),
    ...normalizeList(caseStudy?.serviceSpecializations),
    cleanText(caseStudy?.role),
  ]);
  const parentServiceSkills = uniqueItems([
    ...normalizeList(detail?.skillsAndTechnologies),
    ...normalizeList(detail?.activeTechnologies),
    ...normalizeList(detail?.techStack),
  ]);
  const techStack = uniqueItems([
    ...parentServiceSkills,
    ...normalizeList(caseStudy?.techStack),
    ...normalizeList(caseStudy?.technologies),
    ...normalizeList(caseStudy?.activeTechnologies),
    ...normalizeList(caseStudy?.stack),
    ...normalizeList(caseStudy?.skills),
    ...inferTechnologySkills(
      detailTitle,
      caseStudy?.title,
      caseStudy?.description,
      caseStudy?.summary,
      caseStudy?.overview,
      caseStudy?.content,
    ),
  ]);
  const niches = uniqueItems([
    cleanText(caseStudy?.niche),
    ...normalizeList(caseStudy?.industriesOrNiches),
    ...normalizeList(detail?.niches),
  ]);
  const projectTypes = uniqueItems([
    ...normalizeList(caseStudy?.serviceSpecializations),
    ...normalizeList(caseStudy?.projectTypes),
    ...normalizeList(detail?.keywords),
    ...niches,
  ]);
  const skills = uniqueItems([...tags, ...techStack]);
  const timeline = cleanText(
    caseStudy?.timeline || caseStudy?.duration || caseStudy?.projectTimeline || "",
  );
  const budget = parseBudgetPoint(
    caseStudy?.budget ?? caseStudy?.projectBudget ?? caseStudy?.amount ?? null,
  );
  const searchableText = normalizeSearchableValues([
    title,
    detailTitle,
    serviceLabel,
    timeline,
    description,
    cleanText(caseStudy?.role),
    cleanText(caseStudy?.niche),
    cleanText(caseStudy?.projectLink || caseStudy?.link || caseStudy?.url),
    ...serviceKeys,
    ...skills,
    ...projectTypes,
    ...niches,
  ]);

  if (!title && searchableText.length === 0) {
    return null;
  }

  return {
    recordId:
      cleanText(caseStudy?.id || caseStudy?.projectId || "") ||
      `${primaryServiceKey || "service"}:${index}`,
    recordTitle: title || detailTitle || `Case study ${index + 1}`,
    summary: description,
    description,
    service: serviceLabel,
    serviceTitle: detailTitle || null,
    serviceType: serviceLabel || "",
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
    role: cleanText(caseStudy?.role) || null,
    projectLink:
      cleanText(caseStudy?.projectLink || caseStudy?.link || caseStudy?.url) || null,
    projectFile: isPlainObject(caseStudy?.projectFile) ? caseStudy.projectFile : null,
    recordDate: caseStudy?.updatedAt || caseStudy?.createdAt || null,
  };
};

const extractCanonicalServiceCaseStudies = (freelancer = {}) => {
  const serviceDetails =
    freelancer?.profileDetails && isPlainObject(freelancer.profileDetails.serviceDetails)
      ? freelancer.profileDetails.serviceDetails
      : {};

  return Object.entries(serviceDetails)
    .map(([serviceKey, detail], index) =>
      buildCaseStudyProfile(
        {
          serviceKey,
          detail,
          caseStudy: detail?.caseStudy,
        },
        index,
      ),
    )
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
      normalizedKey: normalizeServiceSignal(key),
      detail,
    }));

  if (!targetServiceKey) {
    return entries;
  }

  const normalizedTargetServiceKey = normalizeServiceSignal(targetServiceKey);
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
  const serviceCandidates = collectServiceSignals(
    ...detailEntries.map(({ key }) => cleanText(key)),
    freelancer?.services,
    freelancer?.serviceKey,
    freelancer?.service,
  );

  if (serviceCandidates.length === 0) {
    return "";
  }

  const normalizedTargetServiceKey = normalizeServiceSignal(targetServiceKey);
  if (normalizedTargetServiceKey) {
    const exactMatch = serviceCandidates.find(
      (candidate) => candidate === normalizedTargetServiceKey,
    );
    if (exactMatch) {
      return exactMatch;
    }
  }

  return serviceCandidates[0];
};

const buildProfileSkillsSource = (freelancer = {}, targetServiceKey = "") => {
  const detailEntries = pickServiceDetails(freelancer, targetServiceKey);
  const resolvedServiceKey = resolveProfileServiceKey({
    freelancer,
    detailEntries,
    targetServiceKey,
  });
  const resolvedServiceLabel =
    cleanText(detailEntries?.[0]?.key) ||
    cleanText(freelancer?.service) ||
    cleanText(freelancer?.services?.[0]) ||
    "";

  return {
    recordId: freelancer?.id || null,
    recordTitle: cleanText(freelancer?.fullName) || "Freelancer profile",
    serviceKey: resolvedServiceKey,
    serviceKeys: collectServiceSignals(
      detailEntries.map(({ key }) => key),
      freelancer?.services,
      freelancer?.serviceKey,
      freelancer?.service,
    ),
    serviceType: resolvedServiceLabel,
    service: resolvedServiceLabel,
    skills: uniqueItems([
      ...normalizeList(freelancer?.skills),
      ...collectDetailValues(detailEntries, PROFILE_SKILL_DETAIL_KEYS),
    ]),
    niches: uniqueItems([
      ...normalizeList(freelancer?.profileDetails?.globalIndustryFocus),
      ...normalizeList(freelancer?.profileDetails?.globalIndustryOther),
      ...collectDetailValues(detailEntries, PROFILE_NICHE_DETAIL_KEYS),
    ]),
    projectTypes: uniqueItems([
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
  const compactLeft = normalizedLeft.replace(/\s+/g, "");
  const compactRight = normalizedRight.replace(/\s+/g, "");

  if (!normalizedLeft || !normalizedRight) return false;
  if (normalizedLeft === normalizedRight) return true;
  if (compactLeft && compactRight && compactLeft === compactRight) return true;
  if (normalizedLeft.length >= 4 && normalizedRight.includes(normalizedLeft)) return true;
  if (normalizedRight.length >= 4 && normalizedLeft.includes(normalizedRight)) return true;
  if (compactLeft.length >= 4 && compactRight.includes(compactLeft)) return true;
  if (compactRight.length >= 4 && compactLeft.includes(compactRight)) return true;
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

  const freelancerMinimumBudget = sourceRange?.min ?? null;
  const freelancerMaximumBudget = sourceRange?.max ?? null;
  const projectBudgetFloor = targetRange?.min ?? null;
  const projectBudgetCeiling = targetRange?.max ?? null;

  // Matching rule: the freelancer budget is the minimum acceptable project value.
  // Reject only when the full project budget sits below that minimum.
  if (
    freelancerMinimumBudget !== null &&
    freelancerMinimumBudget !== undefined &&
    projectBudgetCeiling !== null &&
    projectBudgetCeiling !== undefined &&
    projectBudgetCeiling < freelancerMinimumBudget
  ) {
    return {
      score: 0,
      withinRange: false,
      hardRejected: true,
      budgetMatchPercentage: 0,
      startingPrice: sourceRange?.min ?? null,
      range: sourceRange,
    };
  }

  const projectReferenceBudget =
    getRangeCenter(targetRange) ??
    projectBudgetCeiling ??
    projectBudgetFloor ??
    0;
  const budgetSurplus =
    freelancerMinimumBudget !== null && freelancerMinimumBudget !== undefined
      ? Math.max(0, projectReferenceBudget - freelancerMinimumBudget)
      : 0;
  const normalizationBase = Math.max(
    freelancerMinimumBudget || 0,
    freelancerMaximumBudget || 0,
    1,
  );
  const surplusRatio = Math.min(1, budgetSurplus / normalizationBase);
  const percentage = Math.round(70 + surplusRatio * 30);

  return {
    score: Math.max(10, Math.min(15, Math.round(10 + surplusRatio * 5))),
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

const scoreAvailability = ({ activeProjectCount = 0, openToWork = true, customProjectLimit = null } = {}) => {
  if (!openToWork) {
    return {
      score: 0,
      eligible: false,
      reason: "Freelancer is not open to work.",
    };
  }

  const limit = customProjectLimit ?? OPEN_TO_WORK_MIN_ACTIVE_PROJECT_COUNT;
  if (activeProjectCount >= limit) {
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

const scoreRatingSignal = (rating = null) => {
  const normalized = Number(rating);
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return 0;
  }

  const clamped = Math.max(0, Math.min(5, normalized));
  return Math.round((clamped / 5) * 8);
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

const buildLevelDebugSummary = ({
  levelKey = "",
  passed = false,
  failReason = null,
  freelancer = {},
  sourceEvidence = null,
  targetProfile = {},
  sourceProfile = {},
  activeProjectCount = 0,
  availability = null,
  budgetCompatibility = null,
  serviceMatch = null,
  skills = null,
  niches = null,
  projectTypes = null,
  textRelevance = null,
} = {}) => ({
  levelKey,
  passed,
  failReason,
  freelancerId: freelancer?.id || null,
  freelancerName: freelancer?.fullName || freelancer?.name || null,
  sourceType: sourceEvidence?.type || null,
  sourceTitle: sourceEvidence?.title || sourceProfile?.recordTitle || null,
  checks: {
    targetServiceKey: targetProfile?.serviceKey || null,
    targetServiceType: targetProfile?.serviceType || null,
    targetBudget: targetProfile?.budgetRange || null,
    activeProjectCount,
    availabilityEligible: availability?.eligible ?? null,
    availabilityScore: availability?.score ?? null,
    budgetHardRejected: budgetCompatibility?.hardRejected ?? null,
    budgetWithinRange: budgetCompatibility?.withinRange ?? null,
    budgetScore: budgetCompatibility?.score ?? null,
    serviceMatch,
    matchedSkills: Array.isArray(skills?.matchedValues) ? skills.matchedValues : [],
    matchedNiches: Array.isArray(niches?.matchedValues) ? niches.matchedValues : [],
    matchedProjectTypes: Array.isArray(projectTypes?.matchedValues)
      ? projectTypes.matchedValues
      : [],
    textScore: textRelevance?.score ?? null,
    matchedKeywords: Array.isArray(textRelevance?.matchedKeywords)
      ? textRelevance.matchedKeywords
      : [],
  },
});

const logLevelDiagnostics = (label, entries = []) => {
  if (process.env.NODE_ENV === "production" || !Array.isArray(entries)) return;

  console.info(label, {
    totalChecked: entries.length,
    passed: entries.filter((entry) => entry?.passed).length,
    failed: entries.filter((entry) => !entry?.passed).length,
    details: entries,
  });
};

const evaluateCandidateMatch = ({
  targetProfile = {},
  sourceProfile = {},
  freelancer = {},
  levelKey = "level_3_profile_skills",
  activeProjectCount = 0,
  sourceEvidence = null,
  now = new Date(),
  includeDebug = false,
} = {}) => {
  const availability = scoreAvailability({
    activeProjectCount,
    openToWork: freelancer?.openToWork !== false,
    customProjectLimit: freelancer?.customProjectLimit,
  });

  if (!availability.eligible) {
    const debug = buildLevelDebugSummary({
      levelKey,
      passed: false,
      failReason: "availability_not_eligible",
      freelancer,
      sourceEvidence,
      targetProfile,
      sourceProfile,
      activeProjectCount,
      availability,
    });
    return includeDebug ? { candidate: null, debug } : null;
  }

  const skills = scoreListOverlap({
    targetValues: targetProfile.skills,
    sourceValues: sourceProfile.skills,
    maxScore: SKILLS_MATCH_MAX_SCORE,
  });
  const niches = scoreListOverlap({
    targetValues: targetProfile.niches,
    sourceValues: sourceProfile.niches,
    maxScore: 10,
  });
  const projectTypes = scoreListOverlap({
    targetValues: [...(targetProfile.projectTypes || []), ...(targetProfile.tags || [])],
    sourceValues: [...(sourceProfile.projectTypes || []), ...(sourceProfile.tags || [])],
    maxScore: 8,
  });
  const budgetCompatibility = scoreBudgetCompatibility(
    targetProfile.budgetRange,
    sourceProfile.budgetRange,
  );

  if (budgetCompatibility.hardRejected) {
    const debug = buildLevelDebugSummary({
      levelKey,
      passed: false,
      failReason: "budget_hard_rejected",
      freelancer,
      sourceEvidence,
      targetProfile,
      sourceProfile,
      activeProjectCount,
      availability,
      budgetCompatibility,
    });
    return includeDebug ? { candidate: null, debug } : null;
  }

  const targetServiceSignals = collectServiceSignals(
    targetProfile.serviceKey,
    targetProfile.serviceType,
    targetProfile.serviceKeys,
  );
  const sourceServiceSignals = collectServiceSignals(
    sourceProfile.serviceKey,
    sourceProfile.serviceType,
    sourceProfile.service,
    sourceProfile.serviceKeys,
    sourceEvidence?.serviceKey,
    sourceEvidence?.serviceType,
    freelancer?.services,
    freelancer?.service,
    freelancer?.serviceKey,
  );
  const hasTargetServiceSignal = targetServiceSignals.length > 0;
  const hasSourceServiceSignal = sourceServiceSignals.length > 0;
  const targetPrimaryServiceSignal = normalizeServiceSignal(
    targetProfile.serviceKey || targetProfile.serviceType || "",
  );
  const sourcePrimaryServiceSignal = normalizeServiceSignal(
    sourceProfile.serviceKey || sourceEvidence?.serviceKey || freelancer?.serviceKey || "",
  );
  const hasExplicitServiceKeyMismatch =
    Boolean(targetPrimaryServiceSignal) &&
    Boolean(sourcePrimaryServiceSignal) &&
    !isServiceCompatible(targetPrimaryServiceSignal, sourcePrimaryServiceSignal);
  const sourceServiceSignalSet = new Set(sourceServiceSignals);
  const serviceMatch = hasExplicitServiceKeyMismatch
    ? false
    : hasTargetServiceSignal
      ? targetServiceSignals.some((signal) =>
          Array.from(sourceServiceSignalSet).some((srcSignal) =>
            isServiceCompatible(signal, srcSignal)
          )
        )
      : hasSourceServiceSignal;

  const serviceScore = hasTargetServiceSignal
    ? serviceMatch
      ? 28
      : -18
    : hasSourceServiceSignal
      ? 8
      : 0;
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
          const ignoredSummaries = new Set([
    "proposal",
    (targetProfile.serviceKey || "").toLowerCase().trim(),
    (targetProfile.serviceType || "").toLowerCase().trim()
  ]);

  const normalizedSummary = targetProfile.summary ? normalizeServiceSignal(targetProfile.summary) : "";
  const serviceKeySet = new Set([
    ...(targetProfile.serviceKeys || []),
    ...(targetProfile.agencyServiceKeys || [])
  ]);
  const isSummaryJustAServiceKey = serviceKeySet.has(normalizedSummary);

  const concreteProjectTypes = (targetProfile.projectTypes || []).filter(
    (pt) => !serviceKeySet.has(normalizeServiceSignal(pt))
  );

  const targetHasConcreteSignals =
    (targetProfile.skills || []).length > 0 ||
    (targetProfile.niches || []).length > 0 ||
    concreteProjectTypes.length > 0 ||
    Boolean(
      targetProfile.summary &&
      targetProfile.summary.trim() !== "" &&
      !ignoredSummaries.has(targetProfile.summary.toLowerCase().trim()) &&
      !isSummaryJustAServiceKey
    );

  const hasConcreteOverlap =
    !targetHasConcreteSignals ||
    skills.matchedValues.length > 0 ||
    niches.matchedValues.length > 0 ||
    projectTypes.matchedValues.length > 0 ||
    textRelevance.score > 0;
    
  if (freelancer?.fullName === 'Shoaib Malik') {
    console.log('Shoaib Match Debug:', {
      targetHasConcreteSignals,
      targetProfileSkills: targetProfile.skills,
      targetProfileSummary: targetProfile.summary,
      hasConcreteOverlap,
      skillsMatched: skills.matchedValues.length,
      textScore: textRelevance.score
    });
  }

  if (!hasSignalMatch) {
    const debug = buildLevelDebugSummary({
      levelKey,
      passed: false,
      failReason: "no_signal_match",
      freelancer,
      sourceEvidence,
      targetProfile,
      sourceProfile,
      activeProjectCount,
      availability,
      budgetCompatibility,
      serviceMatch,
      skills,
      niches,
      projectTypes,
      textRelevance,
    });
    return includeDebug ? { candidate: null, debug } : null;
  }

  if (hasTargetServiceSignal && !serviceMatch) {
    const debug = buildLevelDebugSummary({
      levelKey,
      passed: false,
      failReason: "service_category_mismatch",
      freelancer,
      sourceEvidence,
      targetProfile,
      sourceProfile,
      activeProjectCount,
      availability,
      budgetCompatibility,
      serviceMatch,
      skills,
      niches,
      projectTypes,
      textRelevance,
    });
    return includeDebug ? { candidate: null, debug } : null;
  }

  const sourcePriorityScore =
    SOURCE_PRIORITY_SCORES[levelKey] || SOURCE_PRIORITY_SCORES.level_3_profile_skills;
  const ratingScore = scoreRatingSignal(freelancer?.rating);
  const recencyBonus = scoreRecencyBonus(sourceProfile.recordDate, now);
  let weakMatchPenalty = 0;

  if (hasTargetServiceSignal && !serviceMatch) {
    weakMatchPenalty += 24;
  }

  if (skills.matchedValues.length === 0) {
    weakMatchPenalty += levelKey === "level_1_completed_project" ? 10 : 16;
  }

  if (!serviceMatch && skills.matchedValues.length === 0 && textRelevance.score === 0) {
    weakMatchPenalty += 8;
  }

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
    ratingScore +
    recencyBonus -
    weakMatchPenalty;
  const matchPercent = normalizeMatchPercentage(finalScore);
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
    ratingScore,
    recencyBonus,
    weakMatchPenalty,
    finalScore,
    matchPercent,
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

  const candidate = {
    freelancerId: freelancer?.id || null,
    sourceLevel: levelMeta.level,
    sourceLabel: levelMeta.label,
    sourcePriorityScore,
    score: finalScore,
    finalScore,
    matchPercent,
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
        sourceServiceSignals[0] || sourceProfile.serviceKey || null,
      serviceName: hasExplicitServiceKeyMismatch
        ? sourceProfile.serviceKey || sourcePrimaryServiceSignal || null
        : sourceProfile.service || sourceProfile.serviceType || null,
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

  if (!includeDebug) {
    return candidate;
  }

  return {
    candidate,
    debug: buildLevelDebugSummary({
      levelKey,
      passed: true,
      freelancer,
      sourceEvidence,
      targetProfile,
      sourceProfile,
      activeProjectCount,
      availability,
      budgetCompatibility,
      serviceMatch,
      skills,
      niches,
      projectTypes,
      textRelevance,
    }),
  };
};

const buildServiceSpecificTargetProfile = (targetProfile = {}, serviceKey = "") => {
  const normalizedServiceKey = normalizeServiceSignal(serviceKey);
  if (!normalizedServiceKey) return targetProfile;

  const matchingServiceLabel = Array.isArray(targetProfile?.serviceKeys)
    ? targetProfile.serviceKeys.find((entry) => normalizeServiceSignal(entry) === normalizedServiceKey)
    : "";

  return {
    ...targetProfile,
    serviceKey: normalizedServiceKey,
    serviceKeys: [normalizedServiceKey],
    serviceType: matchingServiceLabel || humanizeServiceLabel(normalizedServiceKey),
  };
};

const preferCandidate = (currentCandidate = null, nextCandidate = null) => {
  if (!currentCandidate) return nextCandidate;
  if (!nextCandidate) return currentCandidate;

  if (nextCandidate.serviceMatch !== currentCandidate.serviceMatch) {
    return nextCandidate.serviceMatch ? nextCandidate : currentCandidate;
  }

  if (nextCandidate.finalScore !== currentCandidate.finalScore) {
    return nextCandidate.finalScore > currentCandidate.finalScore
      ? nextCandidate
      : currentCandidate;
  }

  const nextMatchedSkillsCount = Array.isArray(nextCandidate.matchedSkills)
    ? nextCandidate.matchedSkills.length
    : 0;
  const currentMatchedSkillsCount = Array.isArray(currentCandidate.matchedSkills)
    ? currentCandidate.matchedSkills.length
    : 0;

  if (nextMatchedSkillsCount !== currentMatchedSkillsCount) {
    return nextMatchedSkillsCount > currentMatchedSkillsCount
      ? nextCandidate
      : currentCandidate;
  }

  if (nextCandidate.sourcePriorityScore !== currentCandidate.sourcePriorityScore) {
    return nextCandidate.sourcePriorityScore > currentCandidate.sourcePriorityScore
      ? nextCandidate
      : currentCandidate;
  }

  return currentCandidate;
};

const mapFreelancerToMatchResult = (freelancer = {}, candidate = {}) => ({
  ...freelancer,
  freelancerId: freelancer?.id || null,
  name: freelancer?.fullName || freelancer?.name || null,
  profileRole:
    cleanText(
      freelancer?.profileRole ||
        freelancer?.profileDetails?.profileRole ||
        freelancer?.profileDetails?.role ||
        "",
    ).toLowerCase() || null,
  title:
    freelancer?.jobTitle ||
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
  score: candidate.matchPercent,
  matchPercent: candidate.matchPercent,
  matchScore: candidate.matchPercent,
  projectRelevanceScore: candidate.matchPercent,
  rawMatchScore: candidate.finalScore,
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
      ? Math.max(
        0,
        Math.min(
          100,
          Math.round((Number(candidate.scoreBreakdown.skillsScore) / SKILLS_MATCH_MAX_SCORE) * 100),
        ),
      )
      : null,
  matchedCaseStudyTitles: Array.isArray(candidate.matchedCaseStudyTitles)
    ? candidate.matchedCaseStudyTitles
    : [],
  matchedService: candidate.matchedService,
  caseStudyMatch: candidate.caseStudyMatch,
  scoreMetadata: {
    rawMatchScore: candidate.finalScore,
    matchPercent: candidate.matchPercent,
    sourcePriorityScore: candidate.sourcePriorityScore,
    sourceLevel: candidate.sourceLevel,
    sourceLabel: candidate.sourceLabel,
  },
  sourceEvidence: candidate.sourceEvidence,
});

const sortMatches = (left = {}, right = {}) => {
  if (right.serviceMatch !== left.serviceMatch) {
    return right.serviceMatch ? 1 : -1;
  }

  const rightRawMatchScore = Number(right?.rawMatchScore);
  const leftRawMatchScore = Number(left?.rawMatchScore);
  const normalizedRightRawMatchScore = Number.isFinite(rightRawMatchScore)
    ? rightRawMatchScore
    : Number(right?.matchScore || 0);
  const normalizedLeftRawMatchScore = Number.isFinite(leftRawMatchScore)
    ? leftRawMatchScore
    : Number(left?.matchScore || 0);

  if (normalizedRightRawMatchScore !== normalizedLeftRawMatchScore) {
    return normalizedRightRawMatchScore - normalizedLeftRawMatchScore;
  }

  if (right.matchScore !== left.matchScore) {
    return right.matchScore - left.matchScore;
  }

  const rightMatchedSkillsCount = Array.isArray(right?.matchedSkills)
    ? right.matchedSkills.length
    : 0;
  const leftMatchedSkillsCount = Array.isArray(left?.matchedSkills)
    ? left.matchedSkills.length
    : 0;

  if (rightMatchedSkillsCount !== leftMatchedSkillsCount) {
    return rightMatchedSkillsCount - leftMatchedSkillsCount;
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

const buildAiProposalSnapshot = (targetProfile = {}) => ({
  title: cleanText(targetProfile?.title) || "Proposal",
  serviceKey: cleanText(targetProfile?.serviceKey) || null,
  serviceType: cleanText(targetProfile?.serviceType) || null,
  summary: cleanText(targetProfile?.summary) || null,
  timeline: cleanText(targetProfile?.timeline) || null,
  budgetRange: isPlainObject(targetProfile?.budgetRange)
    ? {
        min:
          Number.isFinite(Number(targetProfile.budgetRange.min))
            ? Number(targetProfile.budgetRange.min)
            : null,
        max:
          Number.isFinite(Number(targetProfile.budgetRange.max))
            ? Number(targetProfile.budgetRange.max)
            : null,
      }
    : { min: null, max: null },
  skills: uniqueItems(targetProfile?.skills || []),
  niches: uniqueItems(targetProfile?.niches || []),
  projectTypes: uniqueItems(targetProfile?.projectTypes || []),
  tags: uniqueItems(targetProfile?.tags || []),
});

const buildAiCandidateSnapshot = (candidate = {}) => ({
  freelancerId: candidate?.id || candidate?.freelancerId || null,
  freelancerName: cleanText(candidate?.fullName || candidate?.name) || "Freelancer",
  profileRole: cleanText(candidate?.profileRole) || null,
  title: cleanText(candidate?.title) || null,
  sourceLevel: Number.isFinite(Number(candidate?.sourceLevel))
    ? Number(candidate.sourceLevel)
    : null,
  matchPercent: Number.isFinite(Number(candidate?.matchPercent))
    ? Math.round(Number(candidate.matchPercent))
    : null,
  rawMatchScore: Number.isFinite(Number(candidate?.rawMatchScore))
    ? Math.round(Number(candidate.rawMatchScore))
    : null,
  serviceMatch: Boolean(candidate?.serviceMatch),
  matchedService:
    candidate?.matchedService && typeof candidate.matchedService === "object"
      ? {
          serviceKey: cleanText(candidate.matchedService.serviceKey) || null,
          serviceName: cleanText(candidate.matchedService.serviceName) || null,
        }
      : null,
  matchedSkills: uniqueItems(candidate?.matchedSkills || []),
  matchedNiches: uniqueItems(candidate?.matchedNiches || []),
  matchedProjectTypes: uniqueItems(candidate?.matchedProjectTypes || []),
  matchedCaseStudyTitles: uniqueItems(candidate?.matchedCaseStudyTitles || []),
  matchReasons: uniqueItems(candidate?.matchReasons || []),
  budgetFitPercent: Number.isFinite(Number(candidate?.budgetFitPercent))
    ? Math.round(Number(candidate.budgetFitPercent))
    : Number.isFinite(Number(candidate?.budgetCompatibility?.budgetMatchPercentage))
      ? Math.round(Number(candidate.budgetCompatibility.budgetMatchPercentage))
      : null,
  skillsMatchPercent: Number.isFinite(Number(candidate?.skillsMatchPercent))
    ? Math.round(Number(candidate.skillsMatchPercent))
    : null,
  activeProjectCount: Number.isFinite(Number(candidate?.activeProjectCount))
    ? Number(candidate.activeProjectCount)
    : null,
  bio: cleanText(candidate?.bio) || null,
});

const clampAiInsightLimit = (value = DEFAULT_AI_INSIGHT_LIMIT) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return DEFAULT_AI_INSIGHT_LIMIT;
  }
  return Math.max(1, Math.min(10, Math.round(numericValue)));
};

const applyAiInsightsToResults = (results = [], insights = []) => {
  const insightByFreelancerId = new Map(
    (Array.isArray(insights) ? insights : [])
      .filter((entry) => cleanText(entry?.freelancerId))
      .map((entry) => [cleanText(entry.freelancerId), entry]),
  );

  return (Array.isArray(results) ? results : []).map((result) => {
    const freelancerId = cleanText(result?.id || result?.freelancerId);
    if (!freelancerId || !insightByFreelancerId.has(freelancerId)) {
      return result;
    }

    return {
      ...result,
      aiMatch: insightByFreelancerId.get(freelancerId),
    };
  });
};

const getAiSemanticFitScore = (aiMatch = null) => {
  const numericValue = Number(aiMatch?.semanticFitScore);
  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(numericValue)));
};

const rerankResultsWithAiShortlist = (
  results = [],
  {
    aiInsightLimit = DEFAULT_AI_INSIGHT_LIMIT,
  } = {},
) => {
  const normalizedResults = Array.isArray(results) ? results : [];
  const shortlistWindowSize = Math.max(
    0,
    Math.min(normalizedResults.length, clampAiInsightLimit(aiInsightLimit)),
  );

  if (shortlistWindowSize <= 0) {
    return normalizedResults;
  }

  const shortlistWindow = normalizedResults.slice(0, shortlistWindowSize);
  const trailingResults = normalizedResults.slice(shortlistWindowSize);
  const sortedWindow = shortlistWindow
    .map((result, index) => ({
      result,
      index,
      semanticFitScore: getAiSemanticFitScore(result?.aiMatch),
    }))
    .sort((left, right) => {
      const leftHasScore = Number.isFinite(left.semanticFitScore);
      const rightHasScore = Number.isFinite(right.semanticFitScore);

      if (leftHasScore && rightHasScore && right.semanticFitScore !== left.semanticFitScore) {
        return right.semanticFitScore - left.semanticFitScore;
      }

      if (leftHasScore !== rightHasScore) {
        return leftHasScore ? -1 : 1;
      }

      return left.index - right.index;
    });

  let shortlistRank = 0;
  const rankedWindow = sortedWindow.map(({ result, semanticFitScore }) => {
    if (!result?.aiMatch || !Number.isFinite(semanticFitScore)) {
      return result;
    }

    shortlistRank += 1;
    return {
      ...result,
      aiMatch: {
        ...result.aiMatch,
        semanticFitScore,
        shortlistRank,
      },
    };
  });

  return rankedWindow.concat(trailingResults);
};

const enrichRankingWithAiInsights = async ({
  ranking = {},
  targetProfile = {},
  includeAiInsights = false,
  useAiShortlist = false,
  aiInsightLimit = DEFAULT_AI_INSIGHT_LIMIT,
  logAiInTerminal = false,
} = {}) => {
  const shouldRunAi = includeAiInsights || useAiShortlist;
  if (!shouldRunAi) {
    return ranking;
  }

  const results = Array.isArray(ranking?.results) ? ranking.results : [];
  const normalizedAiInsightLimit = clampAiInsightLimit(aiInsightLimit);
  if (results.length === 0) {
    return {
      ...ranking,
      meta: {
        ...(ranking.meta || {}),
        aiInsightsEnabled: true,
        aiInsightsStatus: "skipped_no_candidates",
        aiInsightsEvaluatedCount: 0,
        aiInsightLimit: normalizedAiInsightLimit,
        aiShortlistEnabled: useAiShortlist,
        aiShortlistApplied: false,
        aiShortlistWindowSize: 0,
        aiShortlistRankedCount: 0,
        aiShortlistTopFreelancerId: null,
      },
    };
  }

  try {
    const aiInsightResult = await generateProposalMatchInsights({
      proposal: buildAiProposalSnapshot(targetProfile),
      candidates: results.slice(0, normalizedAiInsightLimit).map((result) =>
        buildAiCandidateSnapshot(result),
      ),
      logTerminal: logAiInTerminal,
    });
    const resultsWithAiInsights = applyAiInsightsToResults(
      results,
      aiInsightResult.insights,
    );
    const finalResults = useAiShortlist
      ? rerankResultsWithAiShortlist(resultsWithAiInsights, {
          aiInsightLimit: normalizedAiInsightLimit,
        })
      : resultsWithAiInsights;
    const aiShortlistRankedCount = finalResults.filter((result) =>
      Number.isFinite(Number(result?.aiMatch?.shortlistRank)),
    ).length;
    const aiShortlistTopFreelancerId =
      aiShortlistRankedCount > 0
        ? cleanText(finalResults[0]?.id || finalResults[0]?.freelancerId) || null
        : null;

    return {
      ...ranking,
      results: finalResults,
      meta: {
        ...(ranking.meta || {}),
        aiInsightsEnabled: true,
        aiInsightsStatus: aiInsightResult.status,
        aiInsightsEvaluatedCount: aiInsightResult.evaluatedCount,
        aiInsightsCount: Array.isArray(aiInsightResult.insights)
          ? aiInsightResult.insights.length
          : 0,
        aiInsightLimit: normalizedAiInsightLimit,
        aiInsightSummary: aiInsightResult.overallSummary || null,
        aiProvider: aiInsightResult?.meta?.provider || null,
        aiModel: aiInsightResult?.meta?.model || null,
        aiDurationMs: aiInsightResult?.meta?.durationMs ?? null,
        aiAttemptCount: aiInsightResult?.meta?.attemptCount ?? null,
        aiShortlistEnabled: useAiShortlist,
        aiShortlistApplied: useAiShortlist && aiShortlistRankedCount > 0,
        aiShortlistWindowSize: Math.min(results.length, normalizedAiInsightLimit),
        aiShortlistRankedCount,
        aiShortlistTopFreelancerId,
      },
    };
  } catch (error) {
    console.warn("[Proposal Match][Cata AI] Insight enrichment failed:", error?.message || error);

    return {
      ...ranking,
      meta: {
        ...(ranking.meta || {}),
        aiInsightsEnabled: true,
        aiInsightsStatus: "failed",
        aiInsightsEvaluatedCount: Math.min(results.length, normalizedAiInsightLimit),
        aiInsightsCount: 0,
        aiInsightLimit: normalizedAiInsightLimit,
        aiInsightsError: error?.message || "Cata AI insight enrichment failed",
        aiShortlistEnabled: useAiShortlist,
        aiShortlistApplied: false,
        aiShortlistWindowSize: Math.min(results.length, normalizedAiInsightLimit),
        aiShortlistRankedCount: 0,
        aiShortlistTopFreelancerId: null,
      },
    };
  }
};

export const enrichMatchedFreelancersWithAi = async (
  proposal = {},
  candidates = [],
  {
    useAiShortlist = true,
    aiInsightLimit = DEFAULT_AI_INSIGHT_LIMIT,
  } = {},
) => {
  const normalizedCandidates = Array.isArray(candidates)
    ? candidates.filter((candidate) => Boolean(candidate?.id || candidate?.freelancerId))
    : [];

  if (normalizedCandidates.length === 0) {
    return {
      results: [],
      meta: {
        sourceType: "candidate_enrichment",
        aiInsightsEnabled: true,
        aiInsightsStatus: "skipped_no_candidates",
        aiInsightsEvaluatedCount: 0,
        aiInsightLimit: clampAiInsightLimit(aiInsightLimit),
        aiShortlistEnabled: useAiShortlist,
        aiShortlistApplied: false,
        aiShortlistWindowSize: 0,
        aiShortlistRankedCount: 0,
        aiShortlistTopFreelancerId: null,
      },
    };
  }

  const ranking = await enrichRankingWithAiInsights({
    ranking: {
      results: normalizedCandidates,
      meta: {
        sourceType: "candidate_enrichment",
      },
    },
    targetProfile: buildTargetProfileFromPayload(proposal),
    includeAiInsights: true,
    useAiShortlist,
    aiInsightLimit,
    logAiInTerminal: true,
  });

  return {
    ...ranking,
    meta: {
      ...(ranking.meta || {}),
      sourceType: "candidate_enrichment",
    },
  };
};

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

const loadFreelancerPoolForServiceKeys = async ({ serviceKeys = [] } = {}) => {
  const normalizedServiceKeys = uniqueItems(
    (Array.isArray(serviceKeys) ? serviceKeys : [])
      .map((serviceKey) => normalizeServiceSignal(serviceKey))
      .filter(Boolean),
  );
  const [activeFreelancers, pendingFreelancers] = await Promise.all([
    listUsers({
      role: "FREELANCER",
      status: "ACTIVE",
      onboardingComplete: "true",
      serviceKeys: normalizedServiceKeys,
    }),
    listUsers({
      role: "FREELANCER",
      status: "PENDING_APPROVAL",
      onboardingComplete: "true",
      serviceKeys: normalizedServiceKeys,
    }),
  ]);

  return mergeFreelancerCollections([
    Array.isArray(activeFreelancers) ? activeFreelancers : [],
    Array.isArray(pendingFreelancers) ? pendingFreelancers : [],
  ]);
};

const buildFreelancerPoolLoadStages = ({ serviceKeys = [] } = {}) => {
  const normalizedServiceKeys = uniqueItems(
    (Array.isArray(serviceKeys) ? serviceKeys : [])
      .map((serviceKey) => normalizeServiceSignal(serviceKey))
      .filter(Boolean),
  );

  if (normalizedServiceKeys.length === 0) {
    return [
      {
        label: "global_fallback",
        serviceKeys: [],
      },
    ];
  }

  const expandedServiceKeys = uniqueItems(
    normalizedServiceKeys
      .flatMap((serviceKey) => expandServiceSignal(serviceKey))
      .map((serviceKey) => normalizeServiceSignal(serviceKey))
      .filter(Boolean),
  );
  const stages = [
    {
      label: "exact_service",
      serviceKeys: normalizedServiceKeys,
    },
  ];

  if (
    expandedServiceKeys.some((serviceKey) => !normalizedServiceKeys.includes(serviceKey))
  ) {
    stages.push({
      label: "service_family_fallback",
      serviceKeys: expandedServiceKeys,
    });
  }

  stages.push({
    label: "global_fallback",
    serviceKeys: [],
  });

  return stages;
};

const loadFreelancerPool = async ({
  serviceKeys = [],
  minResults = DEFAULT_MIN_RESULTS,
} = {}) => {
  const stages = buildFreelancerPoolLoadStages({ serviceKeys });
  const normalizedMinResults =
    Number.isFinite(Number(minResults)) && Number(minResults) > 0
      ? Math.max(1, Math.round(Number(minResults)))
      : DEFAULT_MIN_RESULTS;
  let freelancers = [];
  let selectedStage = stages[stages.length - 1] || {
    label: "global_fallback",
    serviceKeys: [],
  };

  for (const stage of stages) {
    freelancers = await loadFreelancerPoolForServiceKeys({
      serviceKeys: stage.serviceKeys,
    });
    selectedStage = stage;

    if (stage.label === "global_fallback" || freelancers.length >= normalizedMinResults) {
      break;
    }
  }

  return {
    items: freelancers,
    meta: {
      retrievalStrategy: selectedStage.label,
      requestedServiceKeys: stages[0]?.serviceKeys || [],
      retrievalServiceKeys: selectedStage.serviceKeys,
      usedServiceFallback:
        selectedStage.label !== "global_fallback" && selectedStage.label !== "exact_service",
      fellBackToGlobalPool: selectedStage.label === "global_fallback",
    },
  };
};

const buildLevel1Candidates = ({
  targetProfile = {},
  completedProjects = [],
  freelancerById = new Map(),
  activeProjectCounts = new Map(),
  now = new Date(),
  debugEntries = null,
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
      const evaluation = evaluateCandidateMatch({
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
        includeDebug: Array.isArray(debugEntries),
      });

      const candidate = Array.isArray(debugEntries) ? evaluation?.candidate : evaluation;
      if (Array.isArray(debugEntries) && evaluation?.debug) {
        debugEntries.push(evaluation.debug);
      }
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
  debugEntries = null,
} = {}) => {
  const candidateMap = new Map();

  freelancers.forEach((freelancer) => {
    const activeProjectCount = activeProjectCounts.get(freelancer.id) || 0;
    const caseStudies = extractCanonicalServiceCaseStudies(freelancer);

    caseStudies.forEach((caseStudy) => {
      const evaluation = evaluateCandidateMatch({
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
        includeDebug: Array.isArray(debugEntries),
      });

      const candidate = Array.isArray(debugEntries) ? evaluation?.candidate : evaluation;
      if (Array.isArray(debugEntries) && evaluation?.debug) {
        debugEntries.push(evaluation.debug);
      }
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
  debugEntries = null,
} = {}) => {
  const candidateMap = new Map();

  freelancers.forEach((freelancer) => {
    const activeProjectCount = activeProjectCounts.get(freelancer.id) || 0;
    const sourceProfile = buildProfileSkillsSource(
      freelancer,
      targetProfile.serviceKey,
    );
    const evaluation = evaluateCandidateMatch({
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
      includeDebug: Array.isArray(debugEntries),
    });

    const candidate = Array.isArray(debugEntries) ? evaluation?.candidate : evaluation;
    if (Array.isArray(debugEntries) && evaluation?.debug) {
      debugEntries.push(evaluation.debug);
    }
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
  const levelDebugEntries = {
    level1: [],
    level2: [],
    level3: [],
  };
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
    debugEntries: levelDebugEntries.level1,
  });
  levelCounts.level1 = level1Candidates.size;
  registerCandidates(level1Candidates);

  if (selectedCandidates.size < normalizedMinResults) {
    const level2Candidates = buildLevel2Candidates({
      targetProfile,
      freelancers,
      activeProjectCounts,
      now,
      debugEntries: levelDebugEntries.level2,
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
      debugEntries: levelDebugEntries.level3,
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

  if (process.env.NODE_ENV !== "production") {
    console.info("[Proposal Match][Level 1] Completed project matching checks service, skills, niches, project type, budget, timeline, text relevance, and availability.");
    logLevelDiagnostics("[Proposal Match][Level 1][Diagnostics]", levelDebugEntries.level1);
    console.info("[Proposal Match][Level 2] Case study matching checks case-study service alignment, skills overlap, budget fit, text relevance, and availability.");
    logLevelDiagnostics("[Proposal Match][Level 2][Diagnostics]", levelDebugEntries.level2);
    console.info("[Proposal Match][Level 3] Profile matching checks freelancer profile service, skills, niches, project type, budget fit, text relevance, and availability.");
    logLevelDiagnostics("[Proposal Match][Level 3][Diagnostics]", levelDebugEntries.level3);
  }

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

const aggregateAgencyLevelCounts = (serviceRankings = []) =>
  serviceRankings.reduce(
    (accumulator, ranking) => {
      const levelCounts = ranking?.levelCounts || {};
      accumulator.level1 += Number(levelCounts.level1 || 0);
      accumulator.level2 += Number(levelCounts.level2 || 0);
      accumulator.level3 += Number(levelCounts.level3 || 0);
      return accumulator;
    },
    { level1: 0, level2: 0, level3: 0 },
  );

const mergeAgencyCandidateResults = ({
  baseResult = {},
  serviceResults = [],
} = {}) => {
  const candidateMap = new Map();

  serviceResults.forEach((serviceResult) => {
    if (!serviceResult?.id) return;
    const existing = candidateMap.get(serviceResult.id);
    if (!existing) {
      candidateMap.set(serviceResult.id, {
        ...serviceResult,
        serviceMatches: [
          {
            serviceKey: serviceResult?.matchedService?.serviceKey || serviceResult?.serviceKey || null,
            serviceName:
              serviceResult?.matchedService?.serviceName || serviceResult?.serviceType || null,
            sourceLevel: serviceResult?.sourceLevel || null,
            matchSource: serviceResult?.matchSource || null,
            matchPercent: serviceResult?.matchPercent ?? null,
            matchedSkills: Array.isArray(serviceResult?.matchedSkills)
              ? serviceResult.matchedSkills
              : [],
            matchedCaseStudyTitles: Array.isArray(serviceResult?.matchedCaseStudyTitles)
              ? serviceResult.matchedCaseStudyTitles
              : [],
          },
        ],
      });
      return;
    }

    existing.serviceMatches = [
      ...(Array.isArray(existing.serviceMatches) ? existing.serviceMatches : []),
      {
        serviceKey: serviceResult?.matchedService?.serviceKey || serviceResult?.serviceKey || null,
        serviceName:
          serviceResult?.matchedService?.serviceName || serviceResult?.serviceType || null,
        sourceLevel: serviceResult?.sourceLevel || null,
        matchSource: serviceResult?.matchSource || null,
        matchPercent: serviceResult?.matchPercent ?? null,
        matchedSkills: Array.isArray(serviceResult?.matchedSkills)
          ? serviceResult.matchedSkills
          : [],
        matchedCaseStudyTitles: Array.isArray(serviceResult?.matchedCaseStudyTitles)
          ? serviceResult.matchedCaseStudyTitles
          : [],
      },
    ];

    const nextScore = Number(serviceResult?.scoreMetadata?.rawMatchScore ?? serviceResult?.rawMatchScore);
    const currentScore = Number(existing?.scoreMetadata?.rawMatchScore ?? existing?.rawMatchScore);
    if (Number.isFinite(nextScore) && (!Number.isFinite(currentScore) || nextScore > currentScore)) {
      Object.assign(existing, {
        ...existing,
        ...serviceResult,
        serviceMatches: existing.serviceMatches,
      });
    }
  });

  return {
    ...baseResult,
    results: Array.from(candidateMap.values())
      .map((result) => {
        const serviceMatches = Array.isArray(result.serviceMatches) ? result.serviceMatches : [];
        const averageMatchPercent =
          serviceMatches.length > 0
            ? Math.round(
                serviceMatches.reduce(
                  (sum, entry) => sum + (Number.isFinite(Number(entry.matchPercent)) ? Number(entry.matchPercent) : 0),
                  0,
                ) / serviceMatches.length,
              )
            : result.matchPercent;
        return {
          ...result,
          serviceMatches,
          coveredServiceKeys: uniqueItems(serviceMatches.map((entry) => entry?.serviceKey).filter(Boolean)),
          coveredServices: uniqueItems(serviceMatches.map((entry) => entry?.serviceName).filter(Boolean)),
          matchPercent: averageMatchPercent,
          matchScore: averageMatchPercent,
          projectRelevanceScore: averageMatchPercent,
          score: averageMatchPercent,
        };
      })
      .sort(sortMatches)
      .slice(0, Number(baseResult?.meta?.limit || DEFAULT_MATCH_LIMIT)),
  };
};

const rankAgencyFreelancersFromData = ({
  targetProfile = {},
  freelancers = [],
  activeProjectCounts = new Map(),
  limit = DEFAULT_MATCH_LIMIT,
  minResults = DEFAULT_MIN_RESULTS,
  completedProjectsByService = new Map(),
  now = new Date(),
} = {}) => {
  const serviceKeys = uniqueItems(
    (Array.isArray(targetProfile?.agencyServiceKeys) ? targetProfile.agencyServiceKeys : [])
      .map((serviceKey) => normalizeServiceSignal(serviceKey))
      .filter(Boolean),
  );

  if (serviceKeys.length <= 1) {
    return rankFreelancersFromData({
      targetProfile,
      freelancers,
      completedProjects: Array.isArray(completedProjectsByService)
        ? completedProjectsByService
        : completedProjectsByService instanceof Map
          ? completedProjectsByService.get(serviceKeys[0] || "") || []
          : [],
      activeProjectCounts,
      limit,
      minResults,
      now,
    });
  }

  const perServiceRankings = serviceKeys.map((serviceKey) => {
    const serviceTargetProfile = buildServiceSpecificTargetProfile(targetProfile, serviceKey);
    return {
      serviceKey,
      ranking: rankFreelancersFromData({
        targetProfile: serviceTargetProfile,
        freelancers,
        completedProjects:
          completedProjectsByService instanceof Map
            ? completedProjectsByService.get(serviceKey) || []
            : [],
        activeProjectCounts,
        limit,
        minResults,
        now,
      }),
    };
  });

  const intersectionIds = perServiceRankings.reduce((accumulator, entry, index) => {
    const ids = new Set(
      (Array.isArray(entry?.ranking?.results) ? entry.ranking.results : [])
        .map((result) => result?.id || result?.freelancerId)
        .filter(Boolean),
    );
    if (index === 0) {
      return ids;
    }

    return new Set(Array.from(accumulator).filter((id) => ids.has(id)));
  }, new Set());

  const mergedResults = mergeAgencyCandidateResults({
    baseResult: {
      levelCounts: aggregateAgencyLevelCounts(perServiceRankings.map((entry) => entry.ranking)),
      meta: {
        limit,
        minResults,
      },
    },
    serviceResults: perServiceRankings.flatMap((entry) =>
      (Array.isArray(entry?.ranking?.results) ? entry.ranking.results : []).filter((result) =>
        intersectionIds.has(result?.id || result?.freelancerId),
      ),
    ),
  });

  return {
    results: mergedResults.results,
    levelCounts: mergedResults.levelCounts || aggregateAgencyLevelCounts(
      perServiceRankings.map((entry) => entry.ranking),
    ),
    meta: {
      limit,
      minResults,
      totalCandidates: Array.isArray(mergedResults.results) ? mergedResults.results.length : 0,
      agencyServiceKeys: serviceKeys,
      agencyServiceCount: serviceKeys.length,
      perServiceMatchCounts: perServiceRankings.map((entry) => ({
        serviceKey: entry.serviceKey,
        matched: Array.isArray(entry?.ranking?.results) ? entry.ranking.results.length : 0,
      })),
      intersectionCount: intersectionIds.size,
      intersectionStrategy: "all_services",
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
  {
    limit = DEFAULT_MATCH_LIMIT,
    minResults = DEFAULT_MIN_RESULTS,
    includeAiInsights = false,
    useAiShortlist = false,
    aiInsightLimit = DEFAULT_AI_INSIGHT_LIMIT,
  } = {},
) => {
  const targetProfile = buildTargetProfileFromPayload(proposal);
  const agencyServiceKeys = uniqueItems(
    (Array.isArray(targetProfile?.agencyServiceKeys) ? targetProfile.agencyServiceKeys : [])
      .map((serviceKey) => normalizeServiceSignal(serviceKey))
      .filter(Boolean),
  );
  const shouldUseAgencyMatching =
    Boolean(targetProfile?.isAgencyProposal) && agencyServiceKeys.length > 1;
  const requestedServiceKeys = shouldUseAgencyMatching
    ? agencyServiceKeys
    : [targetProfile.serviceKey];
  const [freelancerPool, activeProjectCounts, completedProjectEntries] = await Promise.all([
    loadFreelancerPool({
      serviceKeys: requestedServiceKeys,
      minResults,
    }),
    collectActiveProjectCounts(),
    shouldUseAgencyMatching
      ? Promise.all(
          agencyServiceKeys.map(async (serviceKey) => ([
            serviceKey,
            await loadCompletedProjectPool({
              serviceKey,
              projectTypes: targetProfile.projectTypes,
              niches: targetProfile.niches,
              limit: 150,
            }),
          ])),
        )
      : loadCompletedProjectPool({
          serviceKey: targetProfile.serviceKey,
          projectTypes: targetProfile.projectTypes,
          niches: targetProfile.niches,
          limit: 150,
        }),
  ]);
  const freelancers = Array.isArray(freelancerPool?.items) ? freelancerPool.items : [];

  const completedProjectsByService = shouldUseAgencyMatching
    ? new Map(Array.isArray(completedProjectEntries) ? completedProjectEntries : [])
    : new Map([[targetProfile.serviceKey, Array.isArray(completedProjectEntries) ? completedProjectEntries : []]]);

  const baseRanking = shouldUseAgencyMatching
    ? rankAgencyFreelancersFromData({
        targetProfile,
        freelancers,
        completedProjectsByService,
        activeProjectCounts,
        limit,
        minResults,
      })
    : rankFreelancersFromData({
        targetProfile,
        freelancers,
        completedProjects: completedProjectsByService.get(targetProfile.serviceKey) || [],
        activeProjectCounts,
        limit,
        minResults,
      });
  const ranking = await enrichRankingWithAiInsights({
    ranking: baseRanking,
    targetProfile,
    includeAiInsights,
    useAiShortlist,
    aiInsightLimit,
    logAiInTerminal: includeAiInsights || useAiShortlist,
  });
  const completedProjectPoolCount = shouldUseAgencyMatching
    ? Array.from(completedProjectsByService.values()).reduce(
        (sum, rows) => sum + (Array.isArray(rows) ? rows.length : 0),
        0,
      )
    : (completedProjectsByService.get(targetProfile.serviceKey) || []).length;

  return {
    ...ranking,
    meta: {
      ...(ranking.meta || {}),
      sourceType: "payload",
      freelancerPoolCount: Array.isArray(freelancers) ? freelancers.length : 0,
      completedProjectPoolCount,
      activeProjectCountEntries:
        activeProjectCounts instanceof Map ? activeProjectCounts.size : 0,
      openToWorkCount: Array.isArray(freelancers)
        ? freelancers.filter((freelancer) => freelancer?.openToWork !== false).length
        : 0,
      closedToWorkCount: Array.isArray(freelancers)
        ? freelancers.filter((freelancer) => freelancer?.openToWork === false).length
        : 0,
      matchingMode: shouldUseAgencyMatching ? "agency_multi_service" : "single_service",
      freelancerPoolStrategy: freelancerPool?.meta?.retrievalStrategy || "global_fallback",
      freelancerPoolRequestedServiceKeys:
        freelancerPool?.meta?.requestedServiceKeys || [],
      freelancerPoolRetrievedServiceKeys:
        freelancerPool?.meta?.retrievalServiceKeys || [],
      freelancerPoolUsedServiceFallback:
        freelancerPool?.meta?.usedServiceFallback || false,
      freelancerPoolUsedGlobalFallback:
        freelancerPool?.meta?.fellBackToGlobalPool || false,
    },
  };
};

export const matchFreelancersForProposal = async (
  proposalId,
  {
    limit = DEFAULT_MATCH_LIMIT,
    minResults = DEFAULT_MIN_RESULTS,
    overrides = {},
    includeAiInsights = false,
    useAiShortlist = false,
    aiInsightLimit = DEFAULT_AI_INSIGHT_LIMIT,
  } = {},
) => {
  const resolvedSource = await resolveProposalMatchingSource(proposalId);
  const targetProfile = buildMatchingProfile({
    ...resolvedSource.source,
    ...overrides,
  });
  const agencyServiceKeys = uniqueItems(
    (Array.isArray(targetProfile?.agencyServiceKeys) ? targetProfile.agencyServiceKeys : [])
      .map((serviceKey) => normalizeServiceSignal(serviceKey))
      .filter(Boolean),
  );
  const shouldUseAgencyMatching =
    Boolean(targetProfile?.isAgencyProposal) && agencyServiceKeys.length > 1;
  const requestedServiceKeys = shouldUseAgencyMatching
    ? agencyServiceKeys
    : [targetProfile.serviceKey];
  const [freelancerPool, activeProjectCounts, completedProjectEntries] = await Promise.all([
    loadFreelancerPool({
      serviceKeys: requestedServiceKeys,
      minResults,
    }),
    collectActiveProjectCounts(),
    shouldUseAgencyMatching
      ? Promise.all(
          agencyServiceKeys.map(async (serviceKey) => ([
            serviceKey,
            await loadCompletedProjectPool({
              serviceKey,
              projectTypes: targetProfile.projectTypes,
              niches: targetProfile.niches,
              limit: 150,
            }),
          ])),
        )
      : loadCompletedProjectPool({
          serviceKey: targetProfile.serviceKey,
          projectTypes: targetProfile.projectTypes,
          niches: targetProfile.niches,
          limit: 150,
        }),
  ]);
  const freelancers = Array.isArray(freelancerPool?.items) ? freelancerPool.items : [];

  const completedProjectsByService = shouldUseAgencyMatching
    ? new Map(Array.isArray(completedProjectEntries) ? completedProjectEntries : [])
    : new Map([[targetProfile.serviceKey, Array.isArray(completedProjectEntries) ? completedProjectEntries : []]]);

  const baseRanking = shouldUseAgencyMatching
    ? rankAgencyFreelancersFromData({
        targetProfile,
        freelancers,
        completedProjectsByService,
        activeProjectCounts,
        limit,
        minResults,
      })
    : rankFreelancersFromData({
        targetProfile,
        freelancers,
        completedProjects: completedProjectsByService.get(targetProfile.serviceKey) || [],
        activeProjectCounts,
        limit,
        minResults,
      });
  const ranking = await enrichRankingWithAiInsights({
    ranking: baseRanking,
    targetProfile,
    includeAiInsights,
    useAiShortlist,
    aiInsightLimit,
    logAiInTerminal: includeAiInsights || useAiShortlist,
  });
  const completedProjectPoolCount = shouldUseAgencyMatching
    ? Array.from(completedProjectsByService.values()).reduce(
        (sum, rows) => sum + (Array.isArray(rows) ? rows.length : 0),
        0,
      )
    : (completedProjectsByService.get(targetProfile.serviceKey) || []).length;

  return {
    ...resolvedSource,
    ...ranking,
    meta: {
      ...(ranking.meta || {}),
      sourceType: resolvedSource?.sourceType || "project",
      freelancerPoolCount: Array.isArray(freelancers) ? freelancers.length : 0,
      completedProjectPoolCount,
      activeProjectCountEntries:
        activeProjectCounts instanceof Map ? activeProjectCounts.size : 0,
      openToWorkCount: Array.isArray(freelancers)
        ? freelancers.filter((freelancer) => freelancer?.openToWork !== false).length
        : 0,
      closedToWorkCount: Array.isArray(freelancers)
        ? freelancers.filter((freelancer) => freelancer?.openToWork === false).length
        : 0,
      matchingMode: shouldUseAgencyMatching ? "agency_multi_service" : "single_service",
      freelancerPoolStrategy: freelancerPool?.meta?.retrievalStrategy || "global_fallback",
      freelancerPoolRequestedServiceKeys:
        freelancerPool?.meta?.requestedServiceKeys || [],
      freelancerPoolRetrievedServiceKeys:
        freelancerPool?.meta?.retrievalServiceKeys || [],
      freelancerPoolUsedServiceFallback:
        freelancerPool?.meta?.usedServiceFallback || false,
      freelancerPoolUsedGlobalFallback:
        freelancerPool?.meta?.fellBackToGlobalPool || false,
    },
  };
};

export const __testables = {
  applyAiInsightsToResults,
  buildFreelancerPoolLoadStages,
  buildCaseStudyProfile,
  clampPercentage,
  buildCompletedProjectProfile,
  buildMatchingProfile,
  buildServiceSpecificTargetProfile,
  buildProfileSkillsSource,
  buildTargetProfileFromPayload,
  collectAgencyServiceCandidates,
  evaluateCandidateMatch,
  normalizeMatchPercentage,
  parseBudgetPoint,
  parseBudgetRange,
  preferCandidate,
  rankAgencyFreelancersFromData,
  rankFreelancersFromData,
  rerankResultsWithAiShortlist,
  rangesOverlap,
  scoreAvailability,
  scoreBudgetCompatibility,
  scoreListOverlap,
  scoreRecencyBonus,
};
