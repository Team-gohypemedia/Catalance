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
  ["app_development", "mobile_app_development", "android_app_development", "ios_app_development"],
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

const collectServiceSignals = (...values) =>
  uniqueItems(values.flatMap((value) => normalizeList(value)))
    .map((value) => normalizeServiceSignal(value))
    .filter(Boolean);

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

const buildMatchingProfile = (source = {}) => {
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

  return {
    id: source?.id || null,
    title:
      cleanText(source?.title) ||
      cleanText(source?.projectTitle) ||
      cleanText(project?.title) ||
      "Proposal",
    serviceKey: serviceKeys[0] || "",
    serviceKeys,
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
    return null;
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
    targetPrimaryServiceSignal !== sourcePrimaryServiceSignal;
  const sourceServiceSignalSet = new Set(sourceServiceSignals);
  const serviceMatch = hasExplicitServiceKeyMismatch
    ? false
    : hasTargetServiceSignal
      ? targetServiceSignals.some((signal) => sourceServiceSignalSet.has(signal))
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
  const hasConcreteOverlap =
    skills.matchedValues.length > 0 ||
    niches.matchedValues.length > 0 ||
    projectTypes.matchedValues.length > 0 ||
    textRelevance.score > 0;

  if (!hasSignalMatch) {
    return null;
  }

  if (
    ["level_2_case_study", "level_3_profile_skills"].includes(levelKey) &&
    hasTargetServiceSignal &&
    serviceMatch &&
    !hasConcreteOverlap
  ) {
    return null;
  }

  if (
    ["level_2_case_study", "level_3_profile_skills"].includes(levelKey) &&
    hasTargetServiceSignal &&
    !serviceMatch &&
    skills.matchedValues.length === 0
  ) {
    return null;
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

  return {
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
    const caseStudies = extractCanonicalServiceCaseStudies(freelancer);

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
  clampPercentage,
  buildCompletedProjectProfile,
  buildMatchingProfile,
  buildProfileSkillsSource,
  buildTargetProfileFromPayload,
  evaluateCandidateMatch,
  normalizeMatchPercentage,
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
