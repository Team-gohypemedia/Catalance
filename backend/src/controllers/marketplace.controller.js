import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";
import { prisma } from "../lib/prisma.js";
import { sendNotificationToUser } from "../lib/notification-util.js";
import { FREELANCER_PROFILE_SAFE_SELECT } from "../modules/users/freelancer-profile.select.js";
import { getServicePositiveKeywordsByName } from "../data/service-positive-keywords.js";

const DEFAULT_PAGE_LIMIT = 20;
const DEFAULT_MAX_CANDIDATES = 80;
const LIVE_PROJECT_DEFAULT_LIMIT = 12;
const LIVE_PROJECT_MAX_CANDIDATES = 220;

const CATEGORY_ALIAS_MAP = new Map([
  ["web_dev", "web_development"],
  ["web-development", "web_development"],
  ["webdevelopment", "web_development"],
  ["app_dev", "app_development"],
  ["app-development", "app_development"],
  ["appdevelopment", "app_development"],
  ["ai", "ai_automation"],
  ["ai-automation", "ai_automation"],
  ["aiautomation", "ai_automation"],
  ["video-editing", "video_editing"],
  ["videoediting", "video_editing"],
  ["lead-generation", "lead_generation"],
  ["leadgeneration", "lead_generation"],
  ["performance-marketing", "performance_marketing"],
  ["performancemarketing", "performance_marketing"],
  ["email-marketing", "email_marketing"],
  ["emailmarketing", "email_marketing"],
  ["ugc-marketing", "ugc_marketing"],
  ["ugcmarketing", "ugc_marketing"],
  ["crm-erp", "crm_erp"],
  ["crmerp", "crm_erp"],
  ["voice-agent", "voice_agent"],
  ["voiceagent", "voice_agent"],
  ["customer-support", "customer_support"],
  ["customersupport", "customer_support"],
  ["public-relations", "public_relations"],
  ["publicrelations", "public_relations"],
]);

const FILTER_SERVICE_KEY_BY_NAME = new Map([
  ["Branding", "branding"],
  ["Web Development", "web_development"],
  ["SEO", "seo"],
  ["Social Media Management", "social_media_marketing"],
  ["Performance Marketing", "paid_advertising"],
  ["App Development", "app_development"],
  ["Software Development", "software_development"],
  ["Lead Generation", "lead_generation"],
  ["Video Services", "video_services"],
  ["Writing & Content", "writing_content"],
  ["Customer Support", "customer_support"],
  ["Influencer Marketing", "influencer_marketing"],
  ["UGC Marketing", "ugc_marketing"],
  ["AI Automation", "ai_automation"],
  ["WhatsApp Chatbot", "whatsapp_chatbot"],
  ["Creative & Design", "creative_design"],
  ["3D Modeling", "3d_modeling"],
  ["CGI / VFX", "cgi_videos"],
  ["CRM & ERP", "crm_erp"],
  ["Voice AI / AI Calling", "voice_agent"],
]);

const TECH_ALIAS_MAP = new Map([
  ["react", "reactjs"],
  ["reactjs", "reactjs"],
  ["reactjsx", "reactjs"],
  ["reactjslibrary", "reactjs"],
  ["node", "nodejs"],
  ["nodejs", "nodejs"],
  ["nodejsruntime", "nodejs"],
  ["next", "nextjs"],
  ["nextjs", "nextjs"],
  ["vue", "vuejs"],
  ["vuejs", "vuejs"],
  ["angular", "angular"],
  ["typescript", "typescript"],
  ["ts", "typescript"],
  ["javascript", "javascript"],
  ["js", "javascript"],
  ["postgres", "postgresql"],
  ["postgresql", "postgresql"],
  ["mongo", "mongodb"],
  ["mongodb", "mongodb"],
  ["express", "expressjs"],
  ["expressjs", "expressjs"],
  ["tailwind", "tailwindcss"],
  ["tailwindcss", "tailwindcss"],
  ["reactnative", "reactnative"],
  ["rn", "reactnative"],
  ["python", "python"],
  ["fastapi", "fastapi"],
  ["django", "django"],
  ["langchain", "langchain"],
  ["openai", "openai"],
]);

const TECH_CANONICAL_VARIANTS = {
  reactjs: ["reactjs", "react", "react.js", "React", "React.js"],
  nodejs: ["nodejs", "node", "node.js", "Node", "Node.js"],
  nextjs: ["nextjs", "next", "next.js", "Next.js", "Next"],
  vuejs: ["vuejs", "vue", "Vue", "Vue.js"],
  expressjs: ["expressjs", "express", "Express", "Express.js"],
  tailwindcss: ["tailwindcss", "tailwind", "Tailwind", "Tailwind CSS"],
  reactnative: ["reactnative", "react native", "React Native"],
  postgresql: ["postgresql", "postgres", "PostgreSQL", "Postgres"],
  mongodb: ["mongodb", "mongo", "MongoDB", "Mongo"],
  typescript: ["typescript", "ts", "TypeScript"],
  javascript: ["javascript", "js", "JavaScript"],
  python: ["python", "Python"],
  django: ["django", "Django"],
  fastapi: ["fastapi", "FastAPI"],
  langchain: ["langchain", "LangChain"],
  openai: ["openai", "OpenAI"],
};

const BUILD_MODE_ALIAS_MAP = new Map([
  ["code", "code"],
  ["coded", "code"],
  ["custom_code", "code"],
  ["no_code", "no_code"],
  ["no-code", "no_code"],
  ["nocode", "no_code"],
  ["platform_based", "no_code"],
]);

const WEB_NO_CODE_MATCH_TOKENS = [
  "wordpress",
  "shopify",
  "woocommerce",
  "webflow",
  "wix",
  "squarespace",
  "framer",
  "bubble",
  "elementor",
];

const WEB_CODE_MATCH_TOKENS = [
  "react",
  "nextjs",
  "next js",
  "vue",
  "angular",
  "nodejs",
  "node js",
  "typescript",
  "javascript",
  "laravel",
  "django",
  "fastapi",
  "postgresql",
  "mongodb",
  "supabase",
  "custom cms",
  "api",
  "custom backend",
];

const normalizeSlug = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const normalizeCompact = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const normalizeSearchText = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeDisplayLabel = (value = "") =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

const uniqueValues = (values = []) => [...new Set(values.filter(Boolean))];
const asObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};
const asArray = (value) => (Array.isArray(value) ? value : []);
const uniqueObjectsBy = (values = [], getKey = (value) => value) => {
  const seen = new Set();
  const result = [];

  for (const value of values) {
    if (!value) continue;
    const key = getKey(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }

  return result;
};

const parseOptionalInteger = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const clampInteger = (value, min, max) => Math.min(max, Math.max(min, value));

const MARKETPLACE_REVIEW_ELIGIBLE_PROJECT_STATUSES = [
  "IN_PROGRESS",
  "AWAITING_PAYMENT",
  "COMPLETED",
  "PAUSED",
];

const userHasClientRole = (user = {}) => {
  const primaryRole = String(user?.role || "").trim().toUpperCase();
  if (primaryRole === "CLIENT") return true;

  if (!Array.isArray(user?.roles)) return false;
  return user.roles.some((role) => String(role || "").trim().toUpperCase() === "CLIENT");
};

const userHasFreelancerRole = (user = {}) => {
  const primaryRole = String(user?.role || "").trim().toUpperCase();
  if (primaryRole === "FREELANCER") return true;

  if (!Array.isArray(user?.roles)) return false;
  return user.roles.some((role) => String(role || "").trim().toUpperCase() === "FREELANCER");
};

const normalizeBuildModes = (value) =>
  uniqueValues(
    String(value || "")
      .split(",")
      .map((entry) => String(entry || "").trim())
      .filter(Boolean)
      .map((entry) => BUILD_MODE_ALIAS_MAP.get(entry) || BUILD_MODE_ALIAS_MAP.get(normalizeSlug(entry)) || null)
      .filter(Boolean)
  );

const normalizeCategory = (value) => {
  const slug = normalizeSlug(value);
  if (!slug || slug === "all") return null;
  const compact = normalizeCompact(value);
  return CATEGORY_ALIAS_MAP.get(slug) || CATEGORY_ALIAS_MAP.get(compact) || slug;
};

const normalizeTechToken = (value) => {
  const compact = normalizeCompact(value);
  if (!compact) return null;
  return TECH_ALIAS_MAP.get(compact) || compact;
};

const normalizeFacetToken = (value) => {
  const normalized = normalizeSearchText(value);
  return normalized ? normalized.replace(/\s+/g, " ") : null;
};

const normalizeFacetTokens = (value) =>
  uniqueValues(
    String(value || "")
      .split(",")
      .map((entry) => normalizeFacetToken(entry))
      .filter(Boolean)
  );

const expandTechFilterTokens = (canonicalTokens = []) =>
  uniqueValues(
    canonicalTokens.flatMap((token) => TECH_CANONICAL_VARIANTS[token] || [token])
  );

const tokenize = (value = "") =>
  String(value || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toFixedScore = (value) =>
  Number(clampInteger(Math.round(toNumber(value, 0) * 10000), 0, 10000) / 10000);

const clampScore = (value) => Math.min(1, Math.max(0, toNumber(value, 0)));

const parseYearsOfExperience = (value) => {
  if (value === undefined || value === null) return 0;
  const matches = String(value).match(/\d+/g);
  if (!matches?.length) return 0;
  const numeric = matches.map((entry) => Number.parseInt(entry, 10)).filter(Number.isFinite);
  if (!numeric.length) return 0;
  return Math.max(...numeric);
};

const getConfiguredCandidateCap = () => {
  const configured = parseOptionalInteger(process.env.MAX_CANDIDATES);
  if (configured === null) return DEFAULT_MAX_CANDIDATES;
  return clampInteger(configured, 50, 80);
};

const toTitleCaseLabel = (value = "") =>
  String(value || "")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b[a-z]/gi, (char) => char.toUpperCase());

const flattenTextValues = (value) => {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => flattenTextValues(entry));
  }

  if (value === undefined || value === null) return [];

  if (typeof value === "string" || typeof value === "number") {
    const normalized = normalizeDisplayLabel(String(value || ""));
    return normalized ? [normalized] : [];
  }

  return [];
};

const firstTextValue = (...values) => {
  for (const value of values) {
    const resolved = flattenTextValues(value)[0];
    if (resolved) return resolved;
  }
  return "";
};

const parseBudgetValue = (value) => {
  if (value === undefined || value === null) return null;

  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric >= 0) {
    return Math.round(numeric);
  }

  const match = String(value)
    .replace(/,/g, "")
    .match(/\d+(?:\.\d+)?/);
  if (!match) return null;

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
};

const resolveLiveProjectServiceKey = (project = {}) =>
  normalizeCategory(
    firstTextValue(
      project?.serviceKey,
      asObject(project?.proposalJson)?.serviceKey,
      asObject(asObject(project?.proposalJson)?.contextSnapshot)?.serviceKey,
      project?.serviceType
    )
  ) || null;

const resolveLiveProjectServiceName = (project = {}, serviceKey = "") => {
  const label = firstTextValue(
    project?.serviceType,
    asObject(project?.proposalJson)?.serviceType,
    asObject(asObject(project?.proposalJson)?.contextSnapshot)?.serviceType
  );

  if (label) return label;
  if (serviceKey) return toTitleCaseLabel(serviceKey);
  return "General Service";
};

const resolveLiveProjectSubCategory = (project = {}) => {
  const proposalJson = asObject(project?.proposalJson);
  const contextSnapshot = asObject(proposalJson?.contextSnapshot);

  return firstTextValue(
    proposalJson?.subCategory,
    proposalJson?.subcategory,
    proposalJson?.sub_category,
    proposalJson?.serviceSubCategory,
    proposalJson?.service_sub_category,
    contextSnapshot?.subCategory,
    contextSnapshot?.subcategory,
    contextSnapshot?.sub_category,
    project?.projectType,
    project?.websiteType,
    project?.creativeType,
    project?.appType,
    project?.businessCategory
  );
};

const resolveLiveProjectTimeline = (project = {}) => {
  const proposalJson = asObject(project?.proposalJson);
  const contextSnapshot = asObject(proposalJson?.contextSnapshot);

  return firstTextValue(
    project?.timeline,
    project?.duration,
    proposalJson?.timeline,
    proposalJson?.duration,
    contextSnapshot?.timeline,
    contextSnapshot?.duration
  );
};

const resolveLiveProjectSummary = (project = {}) => {
  const proposalJson = asObject(project?.proposalJson);
  const summary = firstTextValue(
    project?.projectOverview,
    proposalJson?.projectOverview,
    project?.description
  );
  if (!summary) return "";
  return summary.length > 260 ? `${summary.slice(0, 257)}...` : summary;
};

const mapLiveProjectCardPayload = (project = {}) => {
  const serviceKey = resolveLiveProjectServiceKey(project);
  const serviceName = resolveLiveProjectServiceName(project, serviceKey || "");
  const subCategory = resolveLiveProjectSubCategory(project);
  const timeline = resolveLiveProjectTimeline(project);
  const budget = parseBudgetValue(project?.budget) ?? parseBudgetValue(project?.budgetSummary);
  const proposal = Array.isArray(project?.proposals) ? project.proposals[0] : null;

  return {
    id: project.id,
    title: firstTextValue(project?.title) || "Untitled Project",
    serviceKey: serviceKey || "",
    serviceName,
    subCategory: subCategory || null,
    budget,
    budgetSummary: firstTextValue(project?.budgetSummary) || null,
    timeline: timeline || null,
    duration: firstTextValue(project?.duration) || null,
    summary: resolveLiveProjectSummary(project),
    description: firstTextValue(project?.description) || "",
    clientName: firstTextValue(project?.clientName) || null,
    companyName: firstTextValue(project?.businessName) || null,
    createdAt: project.createdAt,
    postedAt: project.createdAt,
    status: String(project?.status || "").toUpperCase(),
    hasSubmittedProposal: Boolean(proposal?.id),
    proposalStatus: proposal?.status || null,
    proposalId: proposal?.id || null,
  };
};

const MARKETPLACE_LIVE_TRUE_VALUES = new Set([
  "true",
  "1",
  "yes",
  "y",
  "on",
  "live",
  "public",
  "marketplace",
  "marketplace_live",
  "open",
]);

const MARKETPLACE_LIVE_FALSE_VALUES = new Set([
  "false",
  "0",
  "no",
  "n",
  "off",
  "hidden",
  "private",
  "internal",
  "draft",
  "closed",
]);

const parseMarketplaceLiveBoolean = (value) => {
  if (typeof value === "boolean") return value;

  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return value > 0;
  }

  if (typeof value !== "string") return null;

  const normalized = normalizeSlug(value);
  if (!normalized) return null;
  if (MARKETPLACE_LIVE_TRUE_VALUES.has(normalized)) return true;
  if (MARKETPLACE_LIVE_FALSE_VALUES.has(normalized)) return false;
  return null;
};

const resolveProjectMarketplaceLiveState = (project = {}) => {
  const proposalJson = asObject(project?.proposalJson);
  const contextSnapshot = asObject(proposalJson?.contextSnapshot);
  const structuredFields = asObject(proposalJson?.structuredFields);
  const visibilitySection = Array.isArray(proposalJson?.sections)
    ? proposalJson.sections.find((section) => {
        const sectionKey = normalizeSlug(
          section?.fieldKey || section?.key || section?.label
        );
        return [
          "visibility",
          "marketplace_visibility",
          "live_to_marketplace",
          "marketplace_live",
        ].includes(sectionKey);
      })
    : null;

  const candidates = [
    contextSnapshot?.liveToMarketplace,
    contextSnapshot?.live_to_marketplace,
    contextSnapshot?.marketplaceLive,
    contextSnapshot?.marketplace_live,
    contextSnapshot?.isMarketplaceLive,
    contextSnapshot?.isLiveToMarketplace,
    contextSnapshot?.marketplaceVisibility,
    contextSnapshot?.visibility,
    proposalJson?.liveToMarketplace,
    proposalJson?.marketplaceLive,
    proposalJson?.marketplaceVisibility,
    proposalJson?.visibility,
    proposalJson?.fields?.liveToMarketplace,
    proposalJson?.fields?.marketplaceLive,
    proposalJson?.fields?.marketplaceVisibility,
    proposalJson?.fields?.visibility,
    structuredFields?.live_to_marketplace?.value,
    structuredFields?.marketplace_live?.value,
    structuredFields?.marketplace_visibility?.value,
    structuredFields?.visibility?.value,
    visibilitySection?.value,
    ...(Array.isArray(visibilitySection?.items) ? visibilitySection.items : []),
  ];

  for (const candidate of candidates) {
    const parsed = parseMarketplaceLiveBoolean(candidate);
    if (parsed !== null) return parsed;
  }

  return false;
};

const resolveServiceKeyFromFilterServiceName = (value = "") => {
  const label = normalizeDisplayLabel(value);
  if (!label) return null;
  const mapped = FILTER_SERVICE_KEY_BY_NAME.get(label) || label;
  return normalizeCategory(mapped) || null;
};

const flattenShallowStructuredValues = (value) => {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return flattenTextValues(value);
  if (typeof value === "object") {
    return Object.values(value).flatMap((entry) => flattenTextValues(entry));
  }
  return flattenTextValues(value);
};

const buildLiveProjectSearchBlob = (project = {}, mappedProject = {}) => {
  const proposalJson = asObject(project?.proposalJson);
  const contextSnapshot = asObject(proposalJson?.contextSnapshot);
  const rawTokens = [
    mappedProject?.title,
    mappedProject?.serviceName,
    mappedProject?.subCategory,
    mappedProject?.summary,
    mappedProject?.description,
    mappedProject?.timeline,
    mappedProject?.duration,
    mappedProject?.clientName,
    mappedProject?.companyName,
    project?.serviceType,
    project?.proposalContent,
    project?.projectOverview,
    project?.businessCategory,
    project?.websiteType,
    project?.creativeType,
    project?.appType,
    project?.frontendFramework,
    project?.backendTechnology,
    project?.databaseType,
    project?.hosting,
    project?.targetAudience,
    project?.appFeatures,
    project?.featuresDeliverables,
    project?.brandDeliverables,
    project?.primaryObjectives,
    project?.platformRequirements,
    project?.targetLocations,
    project?.seoGoals,
    proposalJson?.subCategory,
    proposalJson?.subcategory,
    proposalJson?.serviceSubCategory,
    proposalJson?.serviceType,
    contextSnapshot?.subCategory,
    contextSnapshot?.subcategory,
    contextSnapshot?.serviceSubCategory,
    contextSnapshot?.serviceType,
    ...flattenShallowStructuredValues(proposalJson?.projectStack),
    ...flattenShallowStructuredValues(proposalJson?.techStack),
    ...flattenShallowStructuredValues(contextSnapshot?.projectStack),
    ...flattenShallowStructuredValues(contextSnapshot?.techStack),
    ...flattenShallowStructuredValues(proposalJson?.services),
    ...flattenShallowStructuredValues(contextSnapshot?.services),
    ...flattenShallowStructuredValues(proposalJson?.deliverables),
    ...flattenShallowStructuredValues(contextSnapshot?.deliverables),
  ];

  return normalizeSearchText(flattenTextValues(rawTokens).join(" "));
};

const buildFreelancerSkillProfile = ({ skillRows = [], profile = {} } = {}) => {
  const allowedServiceKeys = new Set();
  const subCategoryTokens = new Set();
  const toolTokens = new Set();
  const keywordTokens = new Set();

  skillRows.forEach((entry) => {
    const serviceKey = resolveServiceKeyFromFilterServiceName(entry?.service?.name);
    if (serviceKey) allowedServiceKeys.add(serviceKey);

    const subCategoryToken = normalizeFacetToken(entry?.subCategory?.name);
    if (subCategoryToken) {
      subCategoryTokens.add(subCategoryToken);
      keywordTokens.add(subCategoryToken);
    }

    const toolToken = normalizeFacetToken(entry?.tool?.name);
    if (toolToken) {
      toolTokens.add(toolToken);
      keywordTokens.add(toolToken);
    }
  });

  const profileSkills = Array.isArray(profile?.skills) ? profile.skills : [];
  profileSkills.forEach((skill) => {
    const token = normalizeFacetToken(skill);
    if (token) keywordTokens.add(token);
  });

  const profileServices = Array.isArray(profile?.services) ? profile.services : [];
  profileServices.forEach((service) => {
    const serviceKey =
      normalizeCategory(service) || resolveServiceKeyFromFilterServiceName(service);
    if (serviceKey) allowedServiceKeys.add(serviceKey);
  });

  const profileServiceDetails = asObject(profile?.serviceDetails);
  [
    profileServiceDetails?.skillsAndTechnologies,
    profileServiceDetails?.serviceSpecializations,
    profileServiceDetails?.techStack,
  ]
    .flatMap((entry) => flattenTextValues(entry))
    .forEach((token) => {
      const normalized = normalizeFacetToken(token);
      if (normalized) keywordTokens.add(normalized);
    });

  return {
    allowedServiceKeys,
    subCategoryTokens,
    toolTokens,
    keywordTokens,
    hasAdvancedFilters:
      subCategoryTokens.size > 0 || toolTokens.size > 0 || keywordTokens.size > 0,
    subCategoryTokenList: Array.from(subCategoryTokens),
    toolTokenList: Array.from(toolTokens),
    keywordTokenList: Array.from(keywordTokens),
  };
};

const matchesFreelancerSkillProfile = (project = {}, skillProfile = {}) => {
  const allowedServiceKeys = skillProfile?.allowedServiceKeys || new Set();
  const subCategoryTokenList = Array.isArray(skillProfile?.subCategoryTokenList)
    ? skillProfile.subCategoryTokenList
    : [];
  const toolTokenList = Array.isArray(skillProfile?.toolTokenList)
    ? skillProfile.toolTokenList
    : [];
  const keywordTokenList = Array.isArray(skillProfile?.keywordTokenList)
    ? skillProfile.keywordTokenList
    : [];

  if (allowedServiceKeys.size && !allowedServiceKeys.has(project?.serviceKey)) {
    return false;
  }

  const hasAdvancedSkillFilters = Boolean(skillProfile?.hasAdvancedFilters);

  if (!hasAdvancedSkillFilters) return true;

  const blob = normalizeSearchText(project?.searchBlob || "");
  if (!blob) return false;

  const hasToolMatch = toolTokenList.some((token) => blob.includes(token));
  if (hasToolMatch) return true;

  const hasSubCategoryMatch = subCategoryTokenList.some((token) =>
    blob.includes(token)
  );
  if (hasSubCategoryMatch) return true;

  return keywordTokenList.some((token) => blob.includes(token));
};

const normalizeQuery = (rawQuery = {}) => {
  const category = normalizeCategory(rawQuery.category);
  const serviceId = parseOptionalInteger(rawQuery.serviceId);
  const subCategoryId = parseOptionalInteger(rawQuery.subCategoryId);
  const toolId = parseOptionalInteger(rawQuery.toolId);

  const minBudgetRaw = parseOptionalInteger(rawQuery.minBudget);
  const maxBudgetRaw = parseOptionalInteger(rawQuery.maxBudget);

  let minBudget = minBudgetRaw;
  let maxBudget = maxBudgetRaw;
  if (minBudget !== null && maxBudget !== null && minBudget > maxBudget) {
    minBudget = maxBudgetRaw;
    maxBudget = minBudgetRaw;
  }

  const rawTechParts = [rawQuery.tech, rawQuery.techStack]
    .filter((part) => part !== undefined && part !== null && part !== "")
    .flatMap((part) => String(part).split(","));

  const techStack = uniqueValues(rawTechParts.map(normalizeTechToken));
  const techFilterTokens = expandTechFilterTokens(techStack);
  const subcategories = normalizeFacetTokens(rawQuery.subcategory);
  const buildModes = normalizeBuildModes(rawQuery.buildMode);

  const page = clampInteger(
    parseOptionalInteger(rawQuery.page) ?? 1,
    1,
    100000
  );
  const limit = clampInteger(
    parseOptionalInteger(rawQuery.limit) ?? DEFAULT_PAGE_LIMIT,
    1,
    100
  );

  const searchTerm = String(rawQuery.q || "").trim();
  const strictTech = techStack.length > 0;
  const strictBudget = minBudget !== null || maxBudget !== null;

  return {
    category,
    serviceId,
    subCategoryId,
    toolId,
    subcategories,
    techStack,
    techFilterTokens,
    buildModes,
    minBudget,
    maxBudget,
    strictTech,
    strictBudget,
    page,
    limit,
    searchTerm,
  };
};

const hasHierarchyFilters = (query = {}) =>
  query.serviceId !== null || query.subCategoryId !== null || query.toolId !== null;

const hasHierarchyNarrowingFilters = (query = {}) =>
  query.subCategoryId !== null || query.toolId !== null;

const buildFreelancerSkillWhere = (query = {}) => {
  const where = {};

  if (query.serviceId !== null) where.serviceId = query.serviceId;
  if (query.subCategoryId !== null) where.subCategoryId = query.subCategoryId;
  if (query.toolId !== null) where.toolId = query.toolId;

  return where;
};

const resolveHierarchyFreelancerIds = async (query = {}) => {
  if (!hasHierarchyNarrowingFilters(query)) return null;

  const rows = await prisma.freelancerSkill.findMany({
    where: buildFreelancerSkillWhere(query),
    select: { userId: true },
    distinct: ["userId"],
  });

  return new Set(rows.map((row) => row.userId).filter(Boolean));
};

const enrichQueryWithHierarchyLabels = async (query = {}) => {
  if (!hasHierarchyFilters(query)) return query;

  const [serviceRow, subCategoryRow, toolRow] = await Promise.all([
    query.serviceId !== null
      ? prisma.marketplaceFilterService.findUnique({
          where: { id: query.serviceId },
          select: { id: true, name: true },
        })
      : Promise.resolve(null),
    query.subCategoryId !== null
      ? prisma.marketplaceFilterSubCategory.findUnique({
          where: { id: query.subCategoryId },
          select: { id: true, serviceId: true, name: true },
        })
      : Promise.resolve(null),
    query.toolId !== null
      ? prisma.marketplaceFilterTool.findUnique({
          where: { id: query.toolId },
          select: { id: true, subCategoryId: true, name: true },
        })
      : Promise.resolve(null),
  ]);

  const next = {
    ...query,
    subcategories: [...(query.subcategories || [])],
    techStack: [...(query.techStack || [])],
  };

  if (!next.category && serviceRow?.name) {
    next.category =
      FILTER_SERVICE_KEY_BY_NAME.get(serviceRow.name) ||
      normalizeCategory(serviceRow.name) ||
      normalizeSlug(serviceRow.name);
  }

  if (subCategoryRow?.name) {
    const facet = normalizeFacetToken(subCategoryRow.name);
    if (facet && !next.subcategories.includes(facet)) {
      next.subcategories.push(facet);
    }
  }

  if (toolRow?.name) {
    const toolToken = normalizeTechToken(toolRow.name);
    if (toolToken && !next.techStack.includes(toolToken)) {
      next.techStack.push(toolToken);
    }
  }

  next.techFilterTokens = expandTechFilterTokens(next.techStack);
  next.strictTech = next.techStack.length > 0;

  return next;
};

const buildCandidateSearchBlob = (candidate = {}) =>
  normalizeSearchText(
    uniqueValues([
      candidate?.title,
      candidate?.description,
      candidate?.serviceName,
      candidate?.serviceKey,
      ...(candidate?.techStack || []),
      ...(candidate?.activeTechnologies || []),
      ...(candidate?.serviceSpecializations || []),
      ...(candidate?.deliverables || []),
    ]).join(" ")
  );

const detectCandidateBuildMode = (candidate = {}) => {
  if (candidate?.serviceKey !== "web_development") return null;

  const blob = buildCandidateSearchBlob(candidate);
  if (!blob) return null;

  const hasNoCode = WEB_NO_CODE_MATCH_TOKENS.some((token) => blob.includes(token));
  const hasCode = WEB_CODE_MATCH_TOKENS.some((token) => blob.includes(token));

  if (hasCode) return "code";
  if (hasNoCode) return "no_code";
  return null;
};

const buildTier1Where = (
  query,
  profileAvailabilityConditions = [
    { freelancerProfile: { is: null } },
    { freelancerProfile: { is: { available: true } } },
  ],
  hierarchyFreelancerIds = null
) => {
  const andConditions = [
    {
      freelancer: {
        role: "FREELANCER",
        status: "ACTIVE",
        OR: profileAvailabilityConditions,
      },
    },
  ];

  if (query.category) {
    andConditions.push({ serviceKey: query.category });
  }

  if (query.searchTerm) {
    andConditions.push({
      OR: [
        { service: { contains: query.searchTerm, mode: "insensitive" } },
        { serviceKey: { contains: query.searchTerm, mode: "insensitive" } },
        {
          freelancer: {
            fullName: { contains: query.searchTerm, mode: "insensitive" },
          },
        },
      ],
    });
  }

  if (hierarchyFreelancerIds instanceof Set) {
    const ids = Array.from(hierarchyFreelancerIds).filter(Boolean);
    if (!ids.length) {
      andConditions.push({ freelancerId: "__none__" });
    } else {
      andConditions.push({ freelancerId: { in: ids } });
    }
  }

  return { AND: andConditions };
};

const buildTier1DiscoveryWhere = (query, hierarchyFreelancerIds = null) =>
  buildTier1Where(query, [
    { freelancerProfile: { is: null } },
    { freelancerProfile: { is: { available: true } } },
  ], hierarchyFreelancerIds);

const buildTier1BrowseWhere = (query, hierarchyFreelancerIds = null) =>
  buildTier1Where(query, [
    { freelancerProfile: { is: null } },
    { freelancerProfile: { is: { available: true } } },
  ], hierarchyFreelancerIds);

const getScoreWeights = (query) => {
  if (query.strictTech) {
    return {
      relevance: 0.3,
      specialization: 0.2,
      industry: 0.1,
      technology: 0.05,
      budgetFlex: 0.1,
      experience: 0.15,
      reliability: 0.1,
    };
  }

  return {
    relevance: 0.2,
    specialization: 0.15,
    industry: 0.1,
    technology: 0.2,
    budgetFlex: 0.1,
    experience: 0.1,
    reliability: 0.15,
  };
};

const calcRelevanceScore = (candidate, query) => {
  const queryTokens = uniqueValues([
    ...tokenize(query.searchTerm),
    ...(query.category ? tokenize(query.category) : []),
    ...query.techStack,
  ]);

  if (!queryTokens.length) return 0.5;

  const candidateTokens = new Set(
    uniqueValues([
      ...tokenize(candidate.title),
      ...tokenize(candidate.description),
      ...tokenize(candidate.serviceName),
      ...tokenize(candidate.serviceKey),
      ...(candidate.serviceSpecializations || []).flatMap((entry) => tokenize(entry)),
      ...(candidate.industriesOrNiches || []).flatMap((entry) => tokenize(entry)),
      ...(candidate.techStack || []).map(normalizeTechToken),
      ...(candidate.activeTechnologies || []).map(normalizeTechToken),
    ])
  );

  const hitCount = queryTokens.reduce(
    (hits, token) => hits + (candidateTokens.has(token) ? 1 : 0),
    0
  );
  return clampScore(hitCount / queryTokens.length);
};

const calcSpecializationScore = (candidate, query) => {
  let score = candidate.serviceKey && query.category && candidate.serviceKey === query.category
    ? 0.65
    : 0.35;

  if (query.category) {
    const categoryTokens = new Set(tokenize(query.category));
    const specializationTokens = new Set(
      (candidate.serviceSpecializations || []).flatMap((entry) => tokenize(entry))
    );
    const overlap = [...categoryTokens].filter((token) =>
      specializationTokens.has(token)
    ).length;
    if (categoryTokens.size > 0) {
      score += 0.35 * (overlap / categoryTokens.size);
    }
  }

  return clampScore(score);
};

const calcIndustryScore = (candidate, query) => {
  const queryIndustryTokens = tokenize(query.searchTerm);
  if (!queryIndustryTokens.length) return 0.5;

  const candidateIndustryTokens = new Set(
    (candidate.industriesOrNiches || []).flatMap((entry) => tokenize(entry))
  );
  if (!candidateIndustryTokens.size) return 0.2;

  const overlap = queryIndustryTokens.filter((token) =>
    candidateIndustryTokens.has(token)
  ).length;
  return clampScore(overlap / queryIndustryTokens.length);
};

const calcTechnologyScore = (candidate, query) => {
  if (!query.techStack.length) return 0.5;

  const candidateTech = new Set(
    uniqueValues([
      ...(candidate.techStack || []).map(normalizeTechToken),
      ...(candidate.activeTechnologies || []).map(normalizeTechToken),
      ...((candidate.freelancer?.freelancerProfile?.skills || []).map(
        normalizeTechToken
      )),
    ])
  );

  if (!candidateTech.size) return 0;

  const overlap = query.techStack.filter((tech) => candidateTech.has(tech)).length;
  return clampScore(overlap / query.techStack.length);
};

const calcBudgetFlexScore = (candidate, query) => {
  if (!query.strictBudget) return 0.5;
  if (candidate.budget === null || candidate.budget === undefined) return 0.4;

  const budget = toNumber(candidate.budget, 0);

  if (query.minBudget !== null && query.maxBudget !== null) {
    const center = (query.minBudget + query.maxBudget) / 2;
    const halfRange = Math.max((query.maxBudget - query.minBudget) / 2, 1);
    const distance = Math.abs(budget - center);
    return clampScore(1 - distance / halfRange);
  }

  if (query.minBudget !== null) {
    if (budget >= query.minBudget) return 1;
    return clampScore(1 - (query.minBudget - budget) / Math.max(query.minBudget, 1));
  }

  if (query.maxBudget !== null) {
    if (budget <= query.maxBudget) return 1;
    return clampScore(1 - (budget - query.maxBudget) / Math.max(query.maxBudget, 1));
  }

  return 0.5;
};

const calcExperienceScore = (candidate) => {
  const profileYears = toNumber(
    candidate.freelancer?.freelancerProfile?.experienceYears,
    0
  );
  const serviceYears = parseYearsOfExperience(candidate.yearsOfExperienceInService);
  const years = Math.max(profileYears, serviceYears);
  const yearsSignal = clampScore(years / 10);
  const reviewSignal = clampScore(
    toNumber(candidate.freelancer?.freelancerProfile?.reviewCount, 0) / 100
  );
  return clampScore(yearsSignal * 0.7 + reviewSignal * 0.3);
};

const calcReliabilityScore = (candidate) => {
  const rating = toNumber(candidate.freelancer?.freelancerProfile?.rating, 0);
  const reviewCount = toNumber(
    candidate.freelancer?.freelancerProfile?.reviewCount,
    0
  );
  const ratingSignal = clampScore(rating / 5);
  const reviewSignal = clampScore(reviewCount / 100);
  const activeSignal = candidate.freelancer?.status === "ACTIVE" ? 1 : 0;
  return clampScore(ratingSignal * 0.6 + reviewSignal * 0.3 + activeSignal * 0.1);
};

const matchesCandidateQuery = (candidate, query) => {
  if (query.category && candidate.serviceKey !== query.category) {
    return false;
  }

  if (query.subcategories.length) {
    const candidateSubcategories = new Set(
      uniqueValues([
        ...(candidate.serviceSpecializations || []),
        ...(candidate.deliverables || []),
      ])
        .map((entry) => normalizeFacetToken(entry))
        .filter(Boolean)
    );

    if (!query.subcategories.some((subcategory) => candidateSubcategories.has(subcategory))) {
      return false;
    }
  }

  if (query.buildModes.length) {
    const buildMode = detectCandidateBuildMode(candidate);
    if (!buildMode || !query.buildModes.includes(buildMode)) {
      return false;
    }
  }

  if (query.strictTech) {
    const candidateTech = new Set(
      uniqueValues([
        ...(candidate.techStack || []).map(normalizeTechToken),
        ...(candidate.activeTechnologies || []).map(normalizeTechToken),
        ...((candidate.freelancer?.freelancerProfile?.skills || []).map(
          normalizeTechToken
        )),
      ])
    );

    if (!query.techStack.some((tech) => candidateTech.has(tech))) {
      return false;
    }
  }

  if (query.strictBudget) {
    const budget = candidate.budget;
    if (budget !== null && budget !== undefined) {
      if (query.minBudget !== null && budget < query.minBudget) {
        return false;
      }

      if (query.maxBudget !== null && budget > query.maxBudget) {
        return false;
      }
    }
  }

  if (query.searchTerm) {
    const term = query.searchTerm.toLowerCase();
    const searchableText = uniqueValues([
      candidate.title,
      candidate.serviceName,
      candidate.description,
      candidate.serviceKey,
      candidate.freelancer?.fullName,
      ...(candidate.serviceSpecializations || []),
      ...(candidate.industriesOrNiches || []),
      ...(candidate.techStack || []),
      ...(candidate.deliverables || []),
    ])
      .join(" ")
      .toLowerCase();

    if (!searchableText.includes(term)) {
      return false;
    }
  }

  return true;
};

const scoreCandidate = (candidate, query, weights) => {
  const scoreBreakdown = {
    relevance: toFixedScore(calcRelevanceScore(candidate, query)),
    specialization: toFixedScore(calcSpecializationScore(candidate, query)),
    industry: toFixedScore(calcIndustryScore(candidate, query)),
    technology: toFixedScore(calcTechnologyScore(candidate, query)),
    budgetFlex: toFixedScore(calcBudgetFlexScore(candidate, query)),
    experience: toFixedScore(calcExperienceScore(candidate)),
    reliability: toFixedScore(calcReliabilityScore(candidate)),
  };

  const matchScore = toFixedScore(
    scoreBreakdown.relevance * weights.relevance +
    scoreBreakdown.specialization * weights.specialization +
    scoreBreakdown.industry * weights.industry +
    scoreBreakdown.technology * weights.technology +
    scoreBreakdown.budgetFlex * weights.budgetFlex +
    scoreBreakdown.experience * weights.experience +
    scoreBreakdown.reliability * weights.reliability
  );

  const rating = toNumber(candidate.freelancer?.freelancerProfile?.rating, 0);
  const reviewCount = toNumber(candidate.freelancer?.freelancerProfile?.reviewCount, 0);

  return {
    ...candidate,
    freelancerId: candidate.freelancerId,
    projectId: candidate.id,
    rating,
    reviewCount,
    matchScore,
    scoreBreakdown,
  };
};

const extractStructuredServiceDetail = (freelancer = {}, serviceKey = "") => {
  const detailsMap = asObject(freelancer?.freelancerProfile?.serviceDetails);

  return asObject(detailsMap[serviceKey]);
};

const extractStructuredTools = (detail = {}) =>
  uniqueValues([
    ...flattenShallowStructuredValues(detail.skillsAndTechnologies),
    ...Object.entries(asObject(detail.groups)).flatMap(([groupKey, values]) =>
      /tech|tool|stack|platform/i.test(groupKey)
        ? flattenShallowStructuredValues(values)
        : []
    ),
    ...Object.entries(asObject(detail.groupOther)).flatMap(([groupKey, values]) =>
      /tech|tool|stack|platform/i.test(groupKey)
        ? flattenShallowStructuredValues(values)
        : []
    ),
    ...flattenShallowStructuredValues(asObject(detail.caseStudy).techStack),
  ]);

const extractStructuredDeliverables = (detail = {}) =>
  uniqueValues([
    ...Object.entries(asObject(detail.groups)).flatMap(([groupKey, values]) =>
      /tech|tool|stack|platform/i.test(groupKey)
        ? []
        : flattenShallowStructuredValues(values)
    ),
    ...Object.entries(asObject(detail.groupOther)).flatMap(([groupKey, values]) =>
      /tech|tool|stack|platform/i.test(groupKey)
        ? []
        : flattenShallowStructuredValues(values)
    ),
    ...flattenShallowStructuredValues(detail.niches),
    ...flattenShallowStructuredValues(detail.otherNiche),
    ...flattenShallowStructuredValues(detail.deliverables),
    ...flattenShallowStructuredValues(detail.whatsIncluded),
    ...flattenShallowStructuredValues(detail.includes),
    ...flattenShallowStructuredValues(detail.features),
    ...flattenShallowStructuredValues(detail.scopeOfWork),
    ...flattenShallowStructuredValues(detail.scope),
    ...flattenShallowStructuredValues(detail.keywords),
  ]);

const buildMergedServiceDetails = ({
  marketplaceDetails = {},
  structuredDetails = {},
} = {}) => {
  const mktSd = asObject(marketplaceDetails);
  const profileSd = asObject(structuredDetails);

  const tools = uniqueValues([
    ...flattenShallowStructuredValues(mktSd.tools),
    ...flattenShallowStructuredValues(mktSd.techStack),
    ...flattenShallowStructuredValues(mktSd.technologies),
    ...flattenShallowStructuredValues(mktSd.stack),
    ...flattenShallowStructuredValues(mktSd.skillsAndTechnologies),
    ...extractStructuredTools(profileSd),
  ]);

  const deliverables = uniqueValues([
    ...flattenShallowStructuredValues(mktSd.deliverables),
    ...flattenShallowStructuredValues(mktSd.whatsIncluded),
    ...flattenShallowStructuredValues(mktSd.includes),
    ...flattenShallowStructuredValues(mktSd.features),
    ...flattenShallowStructuredValues(mktSd.scopeOfWork),
    ...flattenShallowStructuredValues(mktSd.scope),
    ...flattenShallowStructuredValues(mktSd.serviceSpecializations),
    ...flattenShallowStructuredValues(mktSd.niches),
    ...flattenShallowStructuredValues(mktSd.keywords),
    ...extractStructuredDeliverables(profileSd),
  ]);

  const portfolio = uniqueObjectsBy(
    [
      ...asArray(mktSd.portfolio),
      ...asArray(mktSd.projects),
      ...asArray(profileSd.projects),
    ],
    (entry) => {
      if (typeof entry === "string") return entry.trim();
      const project = asObject(entry);
      return [
        project.link,
        project.title,
        project.readme,
        project.description,
        project.timeline,
        project.role,
      ]
        .filter(Boolean)
        .join("|");
    }
  );

  const averageProjectPriceRange =
    mktSd.averageProjectPriceRange ||
    mktSd.priceRange ||
    profileSd.averageProjectPrice ||
    profileSd.averagePrice ||
    "";

  const mergedForImage = {
    ...profileSd,
    ...mktSd,
  };
  const image = extractCoverImage(mergedForImage);
  const startingPrice = extractPrice({
    ...profileSd,
    ...mktSd,
  });
  const deliveryTime =
    mktSd.deliveryTime ||
    mktSd.deliveryDays ||
    profileSd.deliveryTime ||
    profileSd.deliveryDays ||
    asObject(profileSd.caseStudy).timeline ||
    null;
  const description =
    String(
      profileSd.serviceDescription ||
      profileSd.description ||
      mktSd.description ||
      mktSd.bio ||
      ""
    ).trim();

  return {
    ...profileSd,
    ...mktSd,
    coverImage: image,
    image,
    startingPrice,
    minBudget: startingPrice,
    averageProjectPriceRange,
    priceRange: averageProjectPriceRange,
    deliveryTime: deliveryTime || "Not specified",
    bio: description,
    description,
    tools,
    techStack: tools,
    deliverables,
    portfolio,
    projects: portfolio,
    platformLinks: {
      ...asObject(mktSd.platformLinks),
      ...asObject(profileSd.platformLinks),
    },
    caseStudy: asObject(profileSd.caseStudy),
    groups: asObject(profileSd.groups),
    groupOther: asObject(profileSd.groupOther),
    niches: asArray(profileSd.niches),
    skillsAndTechnologies: uniqueValues([
      ...flattenShallowStructuredValues(profileSd.skillsAndTechnologies),
      ...tools,
    ]),
    industriesOrNiches: uniqueValues([
      ...(Array.isArray(mktSd.industriesOrNiches) ? mktSd.industriesOrNiches : []),
      ...asArray(profileSd.niches),
      ...String(profileSd.industryFocus || "")
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean),
    ]),
    serviceSpecializations: uniqueValues([
      ...flattenShallowStructuredValues(mktSd.serviceSpecializations),
      ...Object.entries(asObject(profileSd.groups)).flatMap(([groupKey, values]) =>
        /specialization|capability|type|scope|approach/i.test(groupKey)
          ? flattenShallowStructuredValues(values)
          : []
      ),
      ...Object.entries(asObject(profileSd.groupOther)).flatMap(([groupKey, values]) =>
        /specialization|capability|type|scope|approach/i.test(groupKey)
          ? flattenShallowStructuredValues(values)
          : []
      ),
    ]),
  };
};

const BROWSE_TECH_LABEL_MAP = new Map([
  ["react", "React.js"],
  ["reactjs", "React.js"],
  ["reactjsx", "React.js"],
  ["next", "Next.js"],
  ["nextjs", "Next.js"],
  ["node", "Node.js"],
  ["nodejs", "Node.js"],
  ["javascript", "JavaScript"],
  ["js", "JavaScript"],
  ["typescript", "TypeScript"],
  ["ts", "TypeScript"],
  ["postgres", "PostgreSQL"],
  ["postgresql", "PostgreSQL"],
  ["mongo", "MongoDB"],
  ["mongodb", "MongoDB"],
  ["vue", "Vue.js"],
  ["vuejs", "Vue.js"],
  ["express", "Express.js"],
  ["expressjs", "Express.js"],
  ["tailwind", "Tailwind CSS"],
  ["tailwindcss", "Tailwind CSS"],
  ["reactnative", "React Native"],
  ["rn", "React Native"],
  ["fastapi", "FastAPI"],
  ["django", "Django"],
  ["openai", "OpenAI"],
  ["html", "HTML"],
  ["css", "CSS"],
]);

const INVALID_BROWSE_VALUE_TOKENS = new Set([
  "",
  "other",
  "yes",
  "no",
  "na",
  "n_a",
  "none",
  "notsure",
  "not sure",
]);

const TECH_GROUP_KEY_REGEX = /(tech_stack|tools|platforms|technology|tech)/i;

const toTextList = (value) => {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => toTextList(entry));
  }

  if (typeof value === "string") {
    return value
      .split(/[,\n]/)
      .map((entry) => normalizeDisplayLabel(entry))
      .filter(Boolean);
  }

  return [];
};

const removeOtherEntries = (values = []) =>
  values.filter((entry) => normalizeCompact(entry) !== "other");

const isMeaningfulBrowseValue = (value = "") => {
  const label = normalizeDisplayLabel(value);
  const token = normalizeFacetToken(label);
  if (!label || !token || INVALID_BROWSE_VALUE_TOKENS.has(token)) {
    return false;
  }

  return label.length <= 96;
};

const normalizeBrowseTechnologyLabel = (value = "") => {
  const label = normalizeDisplayLabel(value);
  if (!label) return "";
  return BROWSE_TECH_LABEL_MAP.get(normalizeCompact(label)) || label;
};

const createBrowseEntry = (value, { isCustom = false, type = "subcategory" } = {}) => {
  const rawLabel = normalizeDisplayLabel(value);
  if (!isMeaningfulBrowseValue(rawLabel)) return null;

  const label =
    type === "technology"
      ? normalizeBrowseTechnologyLabel(rawLabel)
      : rawLabel;
  const key = normalizeFacetToken(label || rawLabel);

  if (!key) return null;

  return {
    key,
    label: label || rawLabel,
    rawLabel,
    isCustom: Boolean(isCustom),
  };
};

const dedupeBrowseEntries = (entries = []) => {
  const bucketByKey = new Map();

  entries.forEach((entry) => {
    if (!entry?.key) return;

    const existing = bucketByKey.get(entry.key);
    if (existing) {
      existing.isCustom = existing.isCustom || entry.isCustom;
      existing.variants.add(entry.rawLabel || entry.label);
      return;
    }

    bucketByKey.set(entry.key, {
      ...entry,
      variants: new Set([entry.rawLabel || entry.label]),
    });
  });

  return Array.from(bucketByKey.values()).map((entry) => ({
    key: entry.key,
    label: entry.label,
    rawLabel: entry.rawLabel,
    isCustom: entry.isCustom,
    variants: Array.from(entry.variants).sort((a, b) => a.localeCompare(b)),
  }));
};

const extractBrowseSubcategoryEntries = ({
  structuredDetail = {},
  mergedDetail = {},
} = {}) => {
  const groups = Object.entries(asObject(structuredDetail.groups)).flatMap(
    ([groupKey, values]) => (TECH_GROUP_KEY_REGEX.test(groupKey) ? [] : toTextList(values))
  );
  const groupOther = Object.entries(asObject(structuredDetail.groupOther)).flatMap(
    ([groupKey, values]) => (TECH_GROUP_KEY_REGEX.test(groupKey) ? [] : toTextList(values))
  );
  const niches = asArray(structuredDetail.niches).flatMap((value) => toTextList(value));
  const otherNiche = toTextList(structuredDetail.otherNiche);

  const primaryEntries = dedupeBrowseEntries([
    ...removeOtherEntries(groups).map((value) =>
      createBrowseEntry(value, { type: "subcategory" })
    ),
    ...groupOther.map((value) =>
      createBrowseEntry(value, { isCustom: true, type: "subcategory" })
    ),
    ...removeOtherEntries(niches).map((value) =>
      createBrowseEntry(value, { type: "subcategory" })
    ),
    ...otherNiche.map((value) =>
      createBrowseEntry(value, { isCustom: true, type: "subcategory" })
    ),
  ].filter(Boolean));

  if (primaryEntries.length) {
    return primaryEntries;
  }

  return dedupeBrowseEntries(
    uniqueValues([
      ...(Array.isArray(mergedDetail.deliverables) ? mergedDetail.deliverables : []),
      ...(Array.isArray(mergedDetail.serviceSpecializations)
        ? mergedDetail.serviceSpecializations
        : []),
    ])
      .map((value) => createBrowseEntry(value, { type: "subcategory" }))
      .filter(Boolean)
  );
};

const extractBrowseTechnologyEntries = ({
  structuredDetail = {},
  mergedDetail = {},
} = {}) => {
  const caseStudy = asObject(structuredDetail.caseStudy);
  const projects = asArray(structuredDetail.projects);

  const primaryEntries = dedupeBrowseEntries([
    ...asArray(structuredDetail.skillsAndTechnologies).map((value) =>
      createBrowseEntry(value, { type: "technology" })
    ),
    ...Object.entries(asObject(structuredDetail.groups)).flatMap(([groupKey, values]) =>
      TECH_GROUP_KEY_REGEX.test(groupKey)
        ? toTextList(values).map((value) =>
            createBrowseEntry(value, { type: "technology" })
          )
        : []
    ),
    ...Object.entries(asObject(structuredDetail.groupOther)).flatMap(([groupKey, values]) =>
      TECH_GROUP_KEY_REGEX.test(groupKey)
        ? toTextList(values).map((value) =>
            createBrowseEntry(value, { isCustom: true, type: "technology" })
          )
        : []
    ),
    ...removeOtherEntries(asArray(caseStudy.techStack)).map((value) =>
      createBrowseEntry(value, { type: "technology" })
    ),
    ...toTextList(caseStudy.techStackOther).map((value) =>
      createBrowseEntry(value, { isCustom: true, type: "technology" })
    ),
    ...projects.flatMap((project) =>
      removeOtherEntries(asArray(asObject(project).techStack)).map((value) =>
        createBrowseEntry(value, { type: "technology" })
      )
    ),
  ].filter(Boolean));

  if (primaryEntries.length) {
    return primaryEntries;
  }

  return dedupeBrowseEntries(
    uniqueValues([
      ...(Array.isArray(mergedDetail.techStack) ? mergedDetail.techStack : []),
      ...(Array.isArray(mergedDetail.skillsAndTechnologies)
        ? mergedDetail.skillsAndTechnologies
        : []),
    ])
      .map((value) => createBrowseEntry(value, { type: "technology" }))
      .filter(Boolean)
  );
};

const getServiceDisplayLabel = ({
  serviceKey = "",
  catalogService = null,
  marketplaceRow = null,
  mergedDetail = {},
} = {}) =>
  normalizeDisplayLabel(
    catalogService?.name ||
      mergedDetail?.title ||
      marketplaceRow?.service ||
      serviceKey
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
  ) || "Service";

const createBrowseAggregateBucket = (entry) => ({
  key: entry.key,
  label: entry.label,
  count: 0,
  isCustom: Boolean(entry.isCustom),
  variants: new Set(entry.variants || [entry.rawLabel || entry.label]),
  freelancerIds: new Set(),
  relatedLabels: new Map(),
});

const registerBrowseAggregateEntries = (
  targetMap,
  entries,
  freelancerId,
  relatedEntries = []
) => {
  const seenKeys = new Set();

  entries.forEach((entry) => {
    if (!entry?.key || seenKeys.has(entry.key)) return;
    seenKeys.add(entry.key);

    const current =
      targetMap.get(entry.key) || createBrowseAggregateBucket(entry);
    current.freelancerIds.add(freelancerId);
    current.isCustom = current.isCustom || entry.isCustom;
    (entry.variants || [entry.rawLabel || entry.label]).forEach((variant) => {
      if (variant) current.variants.add(variant);
    });
    relatedEntries.forEach((related) => {
      if (related?.key && related?.label) {
        current.relatedLabels.set(related.key, related.label);
      }
    });
    current.count = current.freelancerIds.size;
    targetMap.set(entry.key, current);
  });
};

const serializeBrowseAggregateMap = (targetMap, { previewLimit = 0 } = {}) =>
  Array.from(targetMap.values())
    .map((entry) => ({
      key: entry.key,
      label: entry.label,
      count: entry.freelancerIds.size,
      isCustom: entry.isCustom,
      variants: Array.from(entry.variants).sort((a, b) => a.localeCompare(b)),
      relatedTechnologies:
        previewLimit > 0
          ? Array.from(entry.relatedLabels.values())
              .sort((a, b) => a.localeCompare(b))
              .slice(0, previewLimit)
          : undefined,
    }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.label.localeCompare(b.label);
    });

const buildMarketplaceBrowsePayload = ({
  marketplaceRows = [],
  catalogServices = [],
  selectedServiceKey = null,
} = {}) => {
  const catalogByKey = new Map(
    catalogServices
      .map((service) => {
        const key = normalizeCategory(service?.slug || service?.name || service?.key);
        return key ? [key, service] : null;
      })
      .filter(Boolean)
  );

  const serviceBuckets = new Map();

  const ensureServiceBucket = (serviceKey, marketplaceRow = null, mergedDetail = {}) => {
    if (!serviceKey) return null;

    const existing = serviceBuckets.get(serviceKey);
    if (existing) {
      if (!existing.coverImage) {
        existing.coverImage = extractCoverImage(mergedDetail);
      }
      return existing;
    }

    const catalogService = catalogByKey.get(serviceKey);
    const bucket = {
      key: serviceKey,
      label: getServiceDisplayLabel({
        serviceKey,
        catalogService,
        marketplaceRow,
        mergedDetail,
      }),
      description: normalizeDisplayLabel(
        catalogService?.description ||
          marketplaceRow?.serviceDetails?.description ||
          marketplaceRow?.serviceDetails?.serviceDescription
      ),
      coverImage: extractCoverImage(mergedDetail),
      freelancerIds: new Set(),
      subcategories: new Map(),
      technologies: new Map(),
      featuredCount: 0,
    };
    serviceBuckets.set(serviceKey, bucket);
    return bucket;
  };

  catalogByKey.forEach((_service, serviceKey) => {
    ensureServiceBucket(serviceKey);
  });

  marketplaceRows.forEach((row) => {
    const serviceKey = normalizeCategory(row?.serviceKey || row?.service);
    if (!serviceKey) return;

    const structuredDetail = extractStructuredServiceDetail(row.freelancer, serviceKey);
    const mergedDetail = buildMergedServiceDetails({
      marketplaceDetails: row.serviceDetails,
      structuredDetails: structuredDetail,
    });
    const bucket = ensureServiceBucket(serviceKey, row, mergedDetail);
    if (!bucket) return;

    bucket.freelancerIds.add(row.freelancerId);
    if (row.isFeatured) {
      bucket.featuredCount += 1;
    }

    const subcategoryEntries = extractBrowseSubcategoryEntries({
      structuredDetail,
      mergedDetail,
    });
    const technologyEntries = extractBrowseTechnologyEntries({
      structuredDetail,
      mergedDetail,
    });

    registerBrowseAggregateEntries(
      bucket.subcategories,
      subcategoryEntries,
      row.freelancerId,
      technologyEntries
    );
    registerBrowseAggregateEntries(
      bucket.technologies,
      technologyEntries,
      row.freelancerId
    );
  });

  const services = Array.from(serviceBuckets.values())
    .map((bucket) => {
      const subcategories = serializeBrowseAggregateMap(bucket.subcategories);
      const technologies = serializeBrowseAggregateMap(bucket.technologies);

      return {
        key: bucket.key,
        label: bucket.label,
        description:
          bucket.description ||
          "Browse the specialist lanes, sub-categories, and tools active in this service.",
        coverImage: bucket.coverImage,
        freelancerCount: bucket.freelancerIds.size,
        featuredCount: bucket.featuredCount,
        subcategoryCount: subcategories.length,
        technologyCount: technologies.length,
        subcategoryPreview: subcategories.slice(0, 3).map((entry) => entry.label),
        technologyPreview: technologies.slice(0, 4).map((entry) => entry.label),
      };
    })
    .sort((a, b) => {
      if (b.freelancerCount !== a.freelancerCount) {
        return b.freelancerCount - a.freelancerCount;
      }
      return a.label.localeCompare(b.label);
    });

  const resolvedSelectedServiceKey = normalizeCategory(selectedServiceKey);
  const selectedBucket = resolvedSelectedServiceKey
    ? serviceBuckets.get(resolvedSelectedServiceKey) || null
    : null;

  const selectedService = selectedBucket
    ? {
        key: selectedBucket.key,
        label: selectedBucket.label,
        description:
          selectedBucket.description ||
          "Freelancer onboarding data grouped by sub-category and technology.",
        coverImage: selectedBucket.coverImage,
        freelancerCount: selectedBucket.freelancerIds.size,
        subcategories: serializeBrowseAggregateMap(selectedBucket.subcategories, {
          previewLimit: 5,
        }),
        technologies: serializeBrowseAggregateMap(selectedBucket.technologies),
      }
    : null;

  return {
    services,
    selectedService,
  };
};

/** Extract cover image strictly from a serviceDetails object (Marketplace table rows) */
const extractCoverImage = (sd = {}) => {
  return sd.coverImage || (Array.isArray(sd.images) && sd.images[0]) || sd.image || sd.thumbnail || null;
};

/** Extract price strictly from a serviceDetails object */
const extractPrice = (sd = {}) => {
  const raw = sd.startingPrice ?? sd.minBudget ?? sd.price ?? null;
  if (raw === null || raw === undefined) return null;
  const n = toNumber(raw, null);
  return Number.isFinite(n) ? n : null;
};

const mapToMarketplaceRow = (candidate) => {
  // Canonical serviceDetails comes from Marketplace table row (_mktRow)
  const mktSd = candidate._mktRow?.serviceDetails || {};
  const mktId = candidate._mktRow?.id || null;
  const profileSd = extractStructuredServiceDetail(
    candidate.freelancer,
    candidate.serviceKey
  );
  const mergedServiceDetails = buildMergedServiceDetails({
    marketplaceDetails: mktSd,
    structuredDetails: profileSd,
  });

  return {
    id: mktId || candidate.projectId,   // Prefer Marketplace id
    freelancerId: candidate.freelancerId,
    serviceKey: candidate.serviceKey || "",
    serviceMode: detectCandidateBuildMode(candidate),
    service:
      mergedServiceDetails.title ||
      candidate.serviceName ||
      candidate.title ||
      "Freelancer Service",
    isFeatured: candidate._mktRow?.isFeatured || false,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
    freelancer: {
      id: candidate.freelancer?.id || candidate.freelancerId,
      fullName: candidate.freelancer?.fullName || "Freelancer",
      avatar: candidate.freelancer?.avatar || null,
      isVerified: Boolean(candidate.freelancer?.isVerified),
    },
    bio: mergedServiceDetails.bio,
    techStack: mergedServiceDetails.techStack,
    deliverables: mergedServiceDetails.deliverables,
    deliveryTime: mergedServiceDetails.deliveryTime,
    serviceDetails: mergedServiceDetails,
    rating: candidate.rating,
    reviewCount: candidate.reviewCount,
    matchScore: candidate.matchScore,
    scoreBreakdown: candidate.scoreBreakdown,
  };
};

const createMarketplaceCandidate = (row) => {
  const profileSd = extractStructuredServiceDetail(row.freelancer, row.serviceKey);
  const mergedServiceDetails = buildMergedServiceDetails({
    marketplaceDetails: row.serviceDetails,
    structuredDetails: profileSd,
  });

  return {
    id: row.id,
    projectId: row.id,
    freelancerId: row.freelancerId,
    serviceKey: row.serviceKey || "",
    serviceName: row.service || mergedServiceDetails.title || "Freelancer Service",
    title: mergedServiceDetails.title || row.service || "Freelancer Service",
    description: mergedServiceDetails.description || mergedServiceDetails.bio || "",
    techStack: mergedServiceDetails.techStack || [],
    activeTechnologies: mergedServiceDetails.techStack || [],
    serviceSpecializations: mergedServiceDetails.serviceSpecializations || [],
    industriesOrNiches: mergedServiceDetails.industriesOrNiches || [],
    deliverables: mergedServiceDetails.deliverables || [],
    yearsOfExperienceInService:
      mergedServiceDetails.experienceYears ||
      row.freelancer?.freelancerProfile?.experienceYears ||
      0,
    budget: extractPrice(mergedServiceDetails),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    freelancer: row.freelancer,
    _mktRow: row,
  };
};

export const getMarketplace = asyncHandler(async (req, res) => {
  const rawQuery = normalizeQuery(req.query || {});
  const query = await enrichQueryWithHierarchyLabels(rawQuery);
  const configuredCap = getConfiguredCandidateCap();
  const candidateLimit = configuredCap;
  const hierarchyFreelancerIds = await resolveHierarchyFreelancerIds(query);
  const strictHierarchyFreelancerIds =
    hierarchyFreelancerIds instanceof Set && hierarchyFreelancerIds.size > 0
      ? hierarchyFreelancerIds
      : null;
  const useHierarchyMapping =
    hasHierarchyNarrowingFilters(query) && strictHierarchyFreelancerIds instanceof Set;

  const queryForCandidateFiltering = useHierarchyMapping
    ? {
        ...query,
        subcategories: [],
        techStack: [],
        techFilterTokens: [],
        strictTech: false,
      }
    : query;

  const where = buildTier1DiscoveryWhere(
    query,
    undefined,
    useHierarchyMapping ? strictHierarchyFreelancerIds : null
  );

  const marketplaceRows = await prisma.marketplace.findMany({
    where,
    take: candidateLimit,
    include: {
      freelancer: {
        select: {
          id: true,
          fullName: true,
          avatar: true,
          isVerified: true,
          status: true,
          freelancerProfile: {
            select: {
              available: true,
              openToWork: true,
              rating: true,
              reviewCount: true,
              skills: true,
              bio: true,
              experienceYears: true,
              serviceDetails: true,
            },
          },
        },
      },
    },
    orderBy: [
      { isFeatured: "desc" },
      { freelancer: { freelancerProfile: { rating: "desc" } } },
      { freelancer: { freelancerProfile: { reviewCount: "desc" } } },
      { updatedAt: "desc" },
    ],
  });

  const tier1Candidates = marketplaceRows
    .map(createMarketplaceCandidate)
    .filter((candidate) => matchesCandidateQuery(candidate, queryForCandidateFiltering));

  if (!tier1Candidates.length) {
    return res.json({
      data: [],
      total: 0,
      page: queryForCandidateFiltering.page,
      limit: queryForCandidateFiltering.limit,
      totalPages: 0,
      reason: "no_match",
    });
  }

  const weights = getScoreWeights(queryForCandidateFiltering);
  const scored = tier1Candidates.map((candidate) =>
    scoreCandidate(candidate, queryForCandidateFiltering, weights)
  );

  scored.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    if (b.rating !== a.rating) return b.rating - a.rating;
    if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
    if (a.freelancerId !== b.freelancerId) {
      return String(a.freelancerId).localeCompare(String(b.freelancerId));
    }
    return String(a.projectId).localeCompare(String(b.projectId));
  });

  const total = scored.length;
  const totalPages = Math.ceil(total / queryForCandidateFiltering.limit);
  const safePage = clampInteger(queryForCandidateFiltering.page, 1, Math.max(totalPages, 1));
  const startIndex = (safePage - 1) * queryForCandidateFiltering.limit;
  const paginated = scored.slice(startIndex, startIndex + queryForCandidateFiltering.limit);
  const mappedData = paginated.map(mapToMarketplaceRow);

  return res.json({
    data: mappedData,
    total,
    page: safePage,
    limit: queryForCandidateFiltering.limit,
    totalPages,
    meta: {
      strictTech: queryForCandidateFiltering.strictTech,
      strictBudget: queryForCandidateFiltering.strictBudget,
      weights,
      maxCandidates: candidateLimit,
      normalizedQuery: {
        category: query.category,
        serviceId: query.serviceId,
        subCategoryId: query.subCategoryId,
        toolId: query.toolId,
        subcategories: query.subcategories,
        buildModes: query.buildModes,
        techStack: query.techStack,
        minBudget: query.minBudget,
        maxBudget: query.maxBudget,
      },
      hierarchyFiltering: useHierarchyMapping ? "mapping_table" : "content_fallback",
    },
  });
});

export const getMarketplaceLiveProjects = asyncHandler(async (req, res) => {
  const userId = req.user?.sub || req.user?.id;
  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      roles: true,
      status: true,
      freelancerProfile: {
        select: {
          skills: true,
          services: true,
          serviceDetails: true,
        },
      },
    },
  });

  const tokenRole = String(req.user?.role || "").toUpperCase();
  const primaryRole = String(dbUser?.role || "").toUpperCase();
  const additionalRoles = Array.isArray(dbUser?.roles)
    ? dbUser.roles.map((entry) => String(entry || "").toUpperCase()).filter(Boolean)
    : [];
  const effectiveRoles = new Set([tokenRole, primaryRole, ...additionalRoles]);

  if (!dbUser || dbUser.status !== "ACTIVE" || !effectiveRoles.has("FREELANCER")) {
    throw new AppError("Access denied. Freelancer permissions required.", 403);
  }

  const page = clampInteger(parseOptionalInteger(req.query?.page) ?? 1, 1, 100000);
  const limit = clampInteger(
    parseOptionalInteger(req.query?.limit) ?? LIVE_PROJECT_DEFAULT_LIMIT,
    1,
    50
  );
  const category = normalizeCategory(req.query?.category);
  const selectedServiceId = parseOptionalInteger(req.query?.serviceId);
  const selectedSubCategoryId = parseOptionalInteger(req.query?.subCategoryId);
  const selectedToolId = parseOptionalInteger(req.query?.toolId);

  const searchTerm = normalizeSearchText(req.query?.q || req.query?.search || "");

  let minBudget = parseOptionalInteger(req.query?.minBudget);
  let maxBudget = parseOptionalInteger(req.query?.maxBudget);
  if (minBudget !== null && maxBudget !== null && minBudget > maxBudget) {
    const swapMin = minBudget;
    minBudget = maxBudget;
    maxBudget = swapMin;
  }

  const [selectedServiceRow, selectedSubCategoryRow, selectedToolRow, freelancerSkillRows] =
    await Promise.all([
      selectedServiceId
        ? prisma.marketplaceFilterService.findUnique({
            where: { id: selectedServiceId },
            select: { id: true, name: true },
          })
        : Promise.resolve(null),
      selectedSubCategoryId
        ? prisma.marketplaceFilterSubCategory.findUnique({
            where: { id: selectedSubCategoryId },
            select: { id: true, name: true },
          })
        : Promise.resolve(null),
      selectedToolId
        ? prisma.marketplaceFilterTool.findUnique({
            where: { id: selectedToolId },
            select: { id: true, name: true },
          })
        : Promise.resolve(null),
      prisma.freelancerSkill.findMany({
        where: { userId },
        include: {
          service: {
            select: { id: true, name: true },
          },
          subCategory: {
            select: { id: true, name: true },
          },
          tool: {
            select: { id: true, name: true },
          },
        },
      }),
    ]);

  const selectedServiceKey =
    resolveServiceKeyFromFilterServiceName(selectedServiceRow?.name) ||
    category ||
    null;
  const selectedSubCategory = normalizeFacetToken(
    selectedSubCategoryRow?.name || req.query?.subcategory
  );
  const selectedTool = normalizeFacetToken(
    selectedToolRow?.name || req.query?.tool || req.query?.toolName
  );

  const freelancerSkillProfile = buildFreelancerSkillProfile({
    skillRows: freelancerSkillRows,
    profile: dbUser?.freelancerProfile || {},
  });
  const hasAdvancedSkillFilters = Boolean(freelancerSkillProfile.hasAdvancedFilters);
  const shouldBuildSearchBlob =
    hasAdvancedSkillFilters ||
    Boolean(searchTerm) ||
    Boolean(selectedSubCategory) ||
    Boolean(selectedTool);

  const rows = await prisma.project.findMany({
    where: {
      status: "OPEN",
      proposals: {
        none: { status: "ACCEPTED" },
      },
      owner: {
        role: "CLIENT",
        status: "ACTIVE",
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
      budget: true,
      proposalContent: true,
      proposalJson: true,
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
      frontendFramework: true,
      backendTechnology: true,
      databaseType: true,
      hosting: true,
      creativeType: true,
      brandDeliverables: true,
      targetAudience: true,
      businessCategory: true,
      targetLocations: true,
      seoGoals: true,
      duration: true,
      appType: true,
      appFeatures: true,
      platformRequirements: true,
      status: true,
      createdAt: true,
      proposals: {
        where: {
          freelancerId: userId,
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
    take: LIVE_PROJECT_MAX_CANDIDATES,
  });

  const mappedRows = rows
    .filter((project) => resolveProjectMarketplaceLiveState(project))
    .map((project) => {
      const mappedProject = mapLiveProjectCardPayload(project);
      return {
        ...mappedProject,
        searchBlob: shouldBuildSearchBlob
          ? buildLiveProjectSearchBlob(project, mappedProject)
          : "",
      };
    })
    .filter((project) => Boolean(project?.id));

  const baseFiltered = mappedRows.filter((project) => {
    if (selectedServiceKey && project.serviceKey !== selectedServiceKey) return false;
    if (!matchesFreelancerSkillProfile(project, freelancerSkillProfile)) return false;

    if (minBudget !== null) {
      if (!Number.isFinite(project?.budget) || Number(project.budget) < minBudget) return false;
    }

    if (maxBudget !== null) {
      if (!Number.isFinite(project?.budget) || Number(project.budget) > maxBudget) return false;
    }

    if (searchTerm) {
      const haystack = normalizeSearchText(project.searchBlob || "");

      if (!haystack.includes(searchTerm)) return false;
    }

    if (selectedSubCategory) {
      const haystack = normalizeSearchText(
        [project.subCategory, project.searchBlob].filter(Boolean).join(" ")
      );
      if (!haystack.includes(selectedSubCategory)) return false;
    }

    if (selectedTool) {
      const haystack = normalizeSearchText(project.searchBlob || "");
      if (!haystack.includes(selectedTool)) return false;
    }

    return true;
  });

  const subCategoryMap = new Map();
  baseFiltered.forEach((project) => {
    const token = normalizeFacetToken(project?.subCategory);
    if (!token) return;
    const existing = subCategoryMap.get(token);
    if (existing) {
      existing.count += 1;
      return;
    }
    subCategoryMap.set(token, {
      value: token,
      label: project.subCategory,
      count: 1,
    });
  });

  const subCategories = Array.from(subCategoryMap.values()).sort((left, right) => {
    if (right.count !== left.count) return right.count - left.count;
    return String(left.label || "").localeCompare(String(right.label || ""));
  });

  const filteredRows = selectedSubCategory
    ? baseFiltered.filter(
        (project) => normalizeFacetToken(project?.subCategory) === selectedSubCategory
      )
    : baseFiltered;

  const total = filteredRows.length;
  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
  const safePage = clampInteger(page, 1, Math.max(totalPages, 1));
  const startIndex = (safePage - 1) * limit;
  const data = filteredRows.slice(startIndex, startIndex + limit).map((project) => {
    const { searchBlob, ...safeProject } = project;
    return safeProject;
  });

  return res.json({
    data,
    total,
    page: safePage,
    limit,
    totalPages,
    meta: {
      category: selectedServiceKey || null,
      subcategory: selectedSubCategory || null,
      tool: selectedTool || null,
      subcategories: subCategories,
      skillMatchedOnly: true,
      liveOnly: true,
      source: "project_table_open_status_live_flagged",
    },
  });
});

export const getMarketplaceBrowse = asyncHandler(async (req, res) => {
  const selectedServiceKey = normalizeCategory(req.query?.service);

  const [catalogServices, marketplaceRows] = await Promise.all([
    prisma.service.findMany({
      where: { active: true },
      select: {
        slug: true,
        name: true,
        description: true,
        icon: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.marketplace.findMany({
      where: buildTier1BrowseWhere({
        category: selectedServiceKey,
        searchTerm: "",
      }),
      include: {
        freelancer: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            isVerified: true,
            status: true,
            freelancerProfile: {
              select: {
                available: true,
                openToWork: true,
                skills: true,
                serviceDetails: true,
              },
            },
          },
        },
      },
      orderBy: [
        { isFeatured: "desc" },
        { updatedAt: "desc" },
      ],
    }),
  ]);

  const payload = buildMarketplaceBrowsePayload({
    marketplaceRows,
    catalogServices,
    selectedServiceKey,
  });

  return res.json({
    data: payload,
    meta: {
      service: selectedServiceKey,
    },
  });
});

export const getMarketplaceFilterServices = asyncHandler(async (_req, res) => {
  const services = await prisma.marketplaceFilterService.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });

  res.json({
    data: services.map((service) => ({
      id: service.id,
      key:
        FILTER_SERVICE_KEY_BY_NAME.get(service.name) ||
        normalizeCategory(service.name) ||
        normalizeSlug(service.name),
      name: service.name,
      label: service.name,
    })),
  });
});

export const getMarketplaceFilterNiches = asyncHandler(async (_req, res) => {
  const niches = await prisma.$queryRaw`
    SELECT id, name
    FROM "Niches"
    ORDER BY name ASC
  `;

  res.json({
    data: niches.map((niche) => ({
      id: Number(niche.id),
      name: niche.name,
      label: niche.name,
    })),
  });
});

export const getServicePositiveKeywords = asyncHandler(async (req, res) => {
  const serviceId = parseOptionalInteger(req.query?.serviceId);

  if (serviceId === null) {
    return res.json({ data: [] });
  }

  let keywords = await prisma.servicePositiveKeyword.findMany({
    where: { serviceId },
    select: {
      id: true,
      serviceId: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });

  if (!keywords.length) {
    const service = await prisma.marketplaceFilterService.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        name: true,
      },
    });

    const fallbackKeywords = getServicePositiveKeywordsByName(service?.name).map(
      (name, index) => ({
        id: `fallback-${serviceId}-${index + 1}`,
        serviceId,
        name,
      }),
    );

    keywords = fallbackKeywords;
  }

  res.json({
    data: keywords.map((keyword) => ({
      id: keyword.id,
      serviceId: keyword.serviceId,
      name: keyword.name,
      label: keyword.name,
    })),
  });
});

export const getOgMeta = asyncHandler(async (req, res) => {
  const targetUrl = req.query?.url;
  if (!targetUrl) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const fetchRes = await fetch(targetUrl);
    if (!fetchRes.ok) {
      return res.status(fetchRes.status).json({ error: "Failed to fetch URL" });
    }
    const html = await fetchRes.text();
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) || 
                         html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
                         
    let ogImage = null;
    if (ogImageMatch && ogImageMatch[1]) {
      ogImage = ogImageMatch[1];
    } else {
      const fallbackMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
                            html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
      if (fallbackMatch && fallbackMatch[1]) {
        ogImage = fallbackMatch[1];
      }
    }
    
    // Resolve relative URLs if needed, but simple URLs are usually absolute
    res.json({ data: { ogImage } });
  } catch (error) {
    res.status(500).json({ error: "Failed to parse OG meta" });
  }
});

export const getMarketplaceFilterSubCategories = asyncHandler(async (req, res) => {
  const serviceId = parseOptionalInteger(req.query?.serviceId);

  if (serviceId === null) {
    return res.json({ data: [] });
  }

  const subCategories = await prisma.marketplaceFilterSubCategory.findMany({
    where: { serviceId },
    select: {
      id: true,
      serviceId: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });

  res.json({
    data: subCategories.map((subCategory) => ({
      id: subCategory.id,
      serviceId: subCategory.serviceId,
      name: subCategory.name,
      label: subCategory.name,
    })),
  });
});

export const getMarketplaceFilterTools = asyncHandler(async (req, res) => {
  const subCategoryId = parseOptionalInteger(req.query?.subCategoryId);

  if (subCategoryId === null) {
    return res.json({ data: [] });
  }

  const tools = await prisma.marketplaceFilterTool.findMany({
    where: { subCategoryId },
    select: {
      id: true,
      subCategoryId: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });

  res.json({
    data: tools.map((tool) => ({
      id: tool.id,
      subCategoryId: tool.subCategoryId,
      name: tool.name,
      label: tool.name,
    })),
  });
});

export const getServiceById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let service = await prisma.marketplace.findUnique({
    where: { id },
    include: {
      freelancer: {
        select: {
          id: true,
          fullName: true,
          avatar: true,
          isVerified: true,
          freelancerProfile: {
            select: {
              ...FREELANCER_PROFILE_SAFE_SELECT,
              serviceDetails: true,
            }
          },
        }
      }
    }
  });

  // For Marketplace rows: enrich image from serviceDetails JSON only (no profileDetails)
  if (service) {
    const mSd = service.serviceDetails || {};
    const profileSd = extractStructuredServiceDetail(
      service.freelancer,
      service.serviceKey
    );
    const mergedServiceDetails = buildMergedServiceDetails({
      marketplaceDetails: mSd,
      structuredDetails: profileSd,
    });

    service = {
      ...service,
      bio: mergedServiceDetails.bio,
      techStack: mergedServiceDetails.techStack,
      deliverables: mergedServiceDetails.deliverables,
      deliveryTime: mergedServiceDetails.deliveryTime,
      serviceDetails: mergedServiceDetails,
    };
  }

  if (!service) {
    const fp = await prisma.freelancerProject.findUnique({
      where: { id },
      include: {
        freelancer: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            isVerified: true,
            freelancerProfile: {
              select: {
                bio: true,
                skills: true,
                rating: true,
                reviewCount: true,
                serviceDetails: true,
              }
            }
          }
        }
      }
    });

    if (fp) {
      // Look up the canonical Marketplace row for this freelancer+serviceKey
      const mktRow = fp.serviceKey ? await prisma.marketplace.findFirst({
        where: { freelancerId: fp.freelancerId, serviceKey: fp.serviceKey },
        select: { id: true, serviceDetails: true, isFeatured: true }
      }) : null;

      // Build merged serviceDetails: Marketplace row is canonical, fp fields are fallback
      const mktSd = mktRow?.serviceDetails || {};

      const profileSd = extractStructuredServiceDetail(fp.freelancer, fp.serviceKey);
      const mergedServiceDetails = buildMergedServiceDetails({
        marketplaceDetails: mktSd,
        structuredDetails: profileSd,
      });

      service = {
        id: mktRow?.id || fp.id,   // prefer Marketplace id
        freelancerId: fp.freelancerId,
        serviceKey: fp.serviceKey || "",
        service:
          mergedServiceDetails.title ||
          fp.serviceName ||
          fp.title ||
          "Freelancer Service",
        serviceDetails: {
          ...mergedServiceDetails,
        },
        bio: mergedServiceDetails.bio,
        techStack: mergedServiceDetails.techStack,
        deliverables: mergedServiceDetails.deliverables,
        deliveryTime: mergedServiceDetails.deliveryTime,
        isFeatured: mktRow?.isFeatured || false,
        createdAt: fp.createdAt,
        updatedAt: fp.updatedAt,
        freelancer: fp.freelancer
      };
    }
  }


  if (!service) {
    throw new AppError("Service not found", 404);
  }

  const reviewStats = await prisma.review.aggregate({
    where: { serviceId: id },
    _avg: { rating: true },
    _count: { id: true }
  });

  const averageRating = reviewStats._avg.rating ? Number(reviewStats._avg.rating.toFixed(1)) : 0;
  const reviewCount = reviewStats._count.id;

  // Fetch real portfolio from FreelancerProject model for this freelancer
  const portfolioProjects = await prisma.freelancerProject.findMany({
    where: { freelancerId: service.freelancerId },
    select: {
      id: true,
      title: true,
      description: true,
      link: true,
      fileUrl: true,
      role: true,
      budget: true,
      techStack: true,
      tags: true,
    },
    orderBy: { sortOrder: 'desc' },
    take: 10
  });

  const formattedPortfolio = portfolioProjects.map(p => ({
    id: p.id,
    title: p.title,
    description: p.description,
    link: p.link,
    imageUrl: p.fileUrl,
    role: p.role,
    budget: p.budget,
    techStack: p.techStack,
    tags: p.tags,
  }));

  // Force overwrite portfolio inside serviceDetails to avoid mock data
  if (service.serviceDetails) {
    service.serviceDetails.portfolio = formattedPortfolio;
  }

  const portfolioCount = formattedPortfolio.length;

  res.json({
    data: {
      ...service,
      portfolioCount,
      averageRating,
      reviewCount
    }
  });
});

export const getServiceReviews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const limitNumber = clampInteger(parseInt(req.query.limit, 10) || 10, 1, 50);
  const pageNumber = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const skip = (pageNumber - 1) * limitNumber;

  const serviceReviewContext = await resolveServiceReviewContext(id);
  if (!serviceReviewContext) {
    throw new AppError("Service not found", 404);
  }

  const where = { serviceId: { in: serviceReviewContext.lookupServiceIds } };
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limitNumber,
      skip,
    }),
    prisma.review.count({ where }),
  ]);

  res.json({
    data: reviews,
    total,
    page: pageNumber,
    limit: limitNumber,
    totalPages: Math.ceil(total / limitNumber),
  });
});

const resolveServiceReviewContext = async (serviceId) => {
  const normalizedServiceId = String(serviceId || "").trim();
  if (!normalizedServiceId) return null;

  const marketplaceService = await prisma.marketplace.findUnique({
    where: { id: normalizedServiceId },
    select: {
      id: true,
      freelancerId: true,
      service: true,
      serviceKey: true,
    },
  });

  if (marketplaceService) {
    const linkedProjects = marketplaceService.serviceKey
      ? await prisma.freelancerProject.findMany({
          where: {
            freelancerId: marketplaceService.freelancerId,
            serviceKey: marketplaceService.serviceKey,
          },
          select: { id: true },
          take: 100,
        })
      : [];

    return {
      canonicalServiceId: marketplaceService.id,
      lookupServiceIds: uniqueValues([
        marketplaceService.id,
        ...linkedProjects.map((project) => project.id),
      ]),
      freelancerId: marketplaceService.freelancerId,
      serviceLabel: marketplaceService.service || "Freelancer Service",
    };
  }

  const freelancerProject = await prisma.freelancerProject.findUnique({
    where: { id: normalizedServiceId },
    select: {
      id: true,
      freelancerId: true,
      serviceKey: true,
      serviceName: true,
      title: true,
    },
  });

  if (!freelancerProject) return null;

  let canonicalServiceId = freelancerProject.id;
  const lookupServiceIds = [freelancerProject.id];

  if (freelancerProject.serviceKey) {
    const linkedMarketplaceService = await prisma.marketplace.findFirst({
      where: {
        freelancerId: freelancerProject.freelancerId,
        serviceKey: freelancerProject.serviceKey,
      },
      select: { id: true },
    });

    if (linkedMarketplaceService?.id) {
      canonicalServiceId = linkedMarketplaceService.id;
      lookupServiceIds.push(linkedMarketplaceService.id);
    }
  }

  return {
    canonicalServiceId,
    lookupServiceIds: uniqueValues(lookupServiceIds),
    freelancerId: freelancerProject.freelancerId,
    serviceLabel: freelancerProject.serviceName || freelancerProject.title || "Freelancer Service",
  };
};

const canClientReviewFreelancer = async ({ clientId, freelancerId }) => {
  if (!clientId || !freelancerId) return false;

  const eligibleAssignment = await prisma.proposal.findFirst({
    where: {
      freelancerId,
      status: "ACCEPTED",
      project: {
        ownerId: clientId,
        status: { in: MARKETPLACE_REVIEW_ELIGIBLE_PROJECT_STATUSES },
      },
    },
    select: { id: true },
  });

  return Boolean(eligibleAssignment?.id);
};

const resolveReviewEligibility = async ({ user, serviceReviewContext }) => {
  const clientId = user?.id || user?.sub || null;
  const existingReview = clientId
    ? await prisma.review.findFirst({
        where: {
          clientId,
          serviceId: { in: serviceReviewContext.lookupServiceIds },
        },
        orderBy: { createdAt: "desc" },
      })
    : null;

  if (!clientId) {
    return {
      canReview: false,
      reason: "Authentication required",
      hasExistingReview: false,
      existingReview,
    };
  }

  if (!userHasClientRole(user)) {
    return {
      canReview: false,
      reason: "Only clients can post reviews.",
      hasExistingReview: Boolean(existingReview),
      existingReview,
    };
  }

  if (clientId === serviceReviewContext.freelancerId) {
    return {
      canReview: false,
      reason: "You cannot review your own service.",
      hasExistingReview: Boolean(existingReview),
      existingReview,
    };
  }

  if (existingReview) {
    return {
      canReview: true,
      reason: null,
      hasExistingReview: true,
      existingReview,
    };
  }

  const hasWorkedWithFreelancer = await canClientReviewFreelancer({
    clientId,
    freelancerId: serviceReviewContext.freelancerId,
  });

  return {
    canReview: hasWorkedWithFreelancer,
    reason: hasWorkedWithFreelancer
      ? null
      : "You can review this freelancer only after working with them on a project.",
    hasExistingReview: false,
    existingReview: null,
  };
};

export const getServiceReviewEligibility = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const serviceReviewContext = await resolveServiceReviewContext(id);
  if (!serviceReviewContext) {
    throw new AppError("Service not found", 404);
  }

  const eligibility = await resolveReviewEligibility({
    user: req.user || {},
    serviceReviewContext,
  });

  res.json({
    data: {
      canReview: Boolean(eligibility.canReview),
      hasExistingReview: Boolean(eligibility.hasExistingReview),
      reason: eligibility.reason || null,
    },
  });
});

export const createServiceReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ratingValue = Number(req.body?.rating);
  const comment = String(req.body?.comment || "").trim();
  const clientId = req.user?.id || req.user?.sub || null;
  const clientName = String(req.user?.fullName || "Member").trim() || "Member";

  if (!clientId) {
    throw new AppError("Authentication required", 401);
  }

  if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
    throw new AppError("Rating must be an integer between 1 and 5", 400);
  }
  if (comment.length < 5) {
    throw new AppError("Comment must be at least 5 characters long", 400);
  }

  const serviceReviewContext = await resolveServiceReviewContext(id);
  if (!serviceReviewContext) {
    throw new AppError("Service not found", 404);
  }

  const eligibility = await resolveReviewEligibility({
    user: req.user || {},
    serviceReviewContext,
  });

  if (!eligibility.canReview) {
    throw new AppError(
      eligibility.reason || "You are not eligible to review this freelancer yet.",
      403,
    );
  }

  const existingReview = eligibility.existingReview
    ? eligibility.existingReview
    : await prisma.review.findFirst({
        where: {
          clientId,
          serviceId: { in: serviceReviewContext.lookupServiceIds },
        },
        orderBy: { createdAt: "desc" },
      });

  let savedReview;
  if (existingReview?.id) {
    savedReview = await prisma.review.update({
      where: { id: existingReview.id },
      data: {
        serviceId: serviceReviewContext.canonicalServiceId,
        rating: ratingValue,
        comment,
      },
    });
  } else {
    savedReview = await prisma.review.create({
      data: {
        serviceId: serviceReviewContext.canonicalServiceId,
        clientName,
        clientId,
        rating: ratingValue,
        comment,
      },
    });
  }

  if (serviceReviewContext.freelancerId) {
    try {
      await sendNotificationToUser(serviceReviewContext.freelancerId, {
        audience: "freelancer",
        type: "freelancer_review",
        title: "New Client Review",
        message: `${clientName} left a review on your ${serviceReviewContext.serviceLabel}.`,
        data: {
          serviceId: serviceReviewContext.canonicalServiceId,
          rating: savedReview.rating,
        },
      });
    } catch (notificationError) {
      console.error("Failed to notify freelancer about marketplace review:", notificationError);
    }
  }

  const updatedStats = await prisma.review.aggregate({
    where: {
      serviceId: { in: serviceReviewContext.lookupServiceIds },
    },
    _avg: { rating: true },
    _count: { id: true },
  });

  res.status(existingReview ? 200 : 201).json({
    data: savedReview,
    meta: {
      reviewCount: updatedStats._count.id || 0,
      averageRating: updatedStats._avg.rating
        ? Number(updatedStats._avg.rating.toFixed(1))
        : 0,
    },
    message: existingReview ? "Review updated successfully." : "Review posted successfully.",
  });
});

export const getFreelancerReceivedReviews = asyncHandler(async (req, res) => {
  const freelancerId = req.user?.id || req.user?.sub || null;
  if (!freelancerId) {
    throw new AppError("Authentication required", 401);
  }

  if (!userHasFreelancerRole(req.user || {})) {
    throw new AppError("Only freelancers can access received reviews.", 403);
  }

  const limitNumber = clampInteger(parseInt(req.query.limit, 10) || 8, 1, 30);

  const [marketplaceServices, freelancerProjects] = await Promise.all([
    prisma.marketplace.findMany({
      where: { freelancerId },
      select: {
        id: true,
        service: true,
      },
    }),
    prisma.freelancerProject.findMany({
      where: { freelancerId },
      select: {
        id: true,
        serviceName: true,
        title: true,
      },
      take: 120,
    }),
  ]);

  const serviceLabelById = new Map();
  for (const marketplaceService of marketplaceServices) {
    serviceLabelById.set(
      marketplaceService.id,
      marketplaceService.service || "Freelancer Service",
    );
  }
  for (const freelancerProject of freelancerProjects) {
    if (!serviceLabelById.has(freelancerProject.id)) {
      serviceLabelById.set(
        freelancerProject.id,
        freelancerProject.serviceName || freelancerProject.title || "Freelancer Service",
      );
    }
  }

  const reviewServiceIds = Array.from(serviceLabelById.keys());
  if (!reviewServiceIds.length) {
    return res.json({
      data: [],
      meta: {
        reviewCount: 0,
        averageRating: 0,
      },
    });
  }

  const where = { serviceId: { in: reviewServiceIds } };
  const [reviews, stats] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limitNumber,
    }),
    prisma.review.aggregate({
      where,
      _avg: { rating: true },
      _count: { id: true },
    }),
  ]);

  const enrichedReviews = reviews.map((review) => ({
    ...review,
    serviceLabel: serviceLabelById.get(review.serviceId) || "Freelancer Service",
  }));

  res.json({
    data: enrichedReviews,
    meta: {
      reviewCount: stats._count.id || 0,
      averageRating: stats._avg.rating ? Number(stats._avg.rating.toFixed(1)) : 0,
    },
  });
});
