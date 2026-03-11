import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";
import { prisma } from "../lib/prisma.js";
import { FREELANCER_PROFILE_SAFE_SELECT } from "../modules/users/freelancer-profile.select.js";

const DEFAULT_PAGE_LIMIT = 20;
const DEFAULT_MAX_CANDIDATES = 80;

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

const normalizeQuery = (rawQuery = {}) => {
  const category = normalizeCategory(rawQuery.category);

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
    techStack,
    techFilterTokens,
    minBudget,
    maxBudget,
    strictTech,
    strictBudget,
    page,
    limit,
    searchTerm,
  };
};

const buildTier1Where = (query) => {
  const andConditions = [
    {
      freelancer: {
        role: "FREELANCER",
        status: "ACTIVE",
        OR: [
          { freelancerProfile: { is: null } },
          { freelancerProfile: { is: { available: true } } },
        ],
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

  return { AND: andConditions };
};

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
  const detailsMap = asObject(
    freelancer?.freelancerProfile?.freelancerProfileDetails?.serviceDetails
  );

  return asObject(detailsMap[serviceKey]);
};

const extractStructuredTools = (detail = {}) =>
  uniqueValues([
    ...asArray(detail.skillsAndTechnologies),
    ...Object.entries(asObject(detail.groups)).flatMap(([groupKey, values]) =>
      /tech|tool|stack|platform/i.test(groupKey) ? asArray(values) : []
    ),
    ...asArray(asObject(detail.caseStudy).techStack),
  ]);

const extractStructuredDeliverables = (detail = {}) =>
  uniqueValues([
    ...Object.entries(asObject(detail.groups)).flatMap(([groupKey, values]) =>
      /tech|tool|stack|platform/i.test(groupKey) ? [] : asArray(values)
    ),
    ...asArray(detail.niches),
  ]);

const buildMergedServiceDetails = ({
  marketplaceDetails = {},
  structuredDetails = {},
} = {}) => {
  const mktSd = asObject(marketplaceDetails);
  const profileSd = asObject(structuredDetails);

  const tools = uniqueValues([
    ...(Array.isArray(mktSd.tools) ? mktSd.tools : []),
    ...(Array.isArray(mktSd.techStack) ? mktSd.techStack : []),
    ...(Array.isArray(mktSd.technologies) ? mktSd.technologies : []),
    ...(Array.isArray(mktSd.stack) ? mktSd.stack : []),
    ...extractStructuredTools(profileSd),
  ]);

  const deliverables = uniqueValues([
    ...(Array.isArray(mktSd.deliverables) ? mktSd.deliverables : []),
    ...(Array.isArray(mktSd.whatsIncluded) ? mktSd.whatsIncluded : []),
    ...(Array.isArray(mktSd.includes) ? mktSd.includes : []),
    ...(Array.isArray(mktSd.features) ? mktSd.features : []),
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
      ...asArray(profileSd.skillsAndTechnologies),
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
      ...(Array.isArray(mktSd.serviceSpecializations) ? mktSd.serviceSpecializations : []),
      ...Object.entries(asObject(profileSd.groups)).flatMap(([groupKey, values]) =>
        /specialization|capability|type|scope|approach/i.test(groupKey)
          ? asArray(values)
          : []
      ),
    ]),
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
  const query = normalizeQuery(req.query || {});
  const configuredCap = getConfiguredCandidateCap();
  const candidateLimit = configuredCap;

  const where = buildTier1Where(query);

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
              rating: true,
              reviewCount: true,
              skills: true,
              bio: true,
              experienceYears: true,
              freelancerProfileDetails: {
                select: {
                  serviceDetails: true,
                },
              },
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
    .filter((candidate) => matchesCandidateQuery(candidate, query));

  if (!tier1Candidates.length) {
    return res.json({
      data: [],
      total: 0,
      page: query.page,
      limit: query.limit,
      totalPages: 0,
      reason: "no_match",
    });
  }

  const weights = getScoreWeights(query);
  const scored = tier1Candidates.map((candidate) =>
    scoreCandidate(candidate, query, weights)
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
  const totalPages = Math.ceil(total / query.limit);
  const safePage = clampInteger(query.page, 1, Math.max(totalPages, 1));
  const startIndex = (safePage - 1) * query.limit;
  const paginated = scored.slice(startIndex, startIndex + query.limit);
  const mappedData = paginated.map(mapToMarketplaceRow);

  return res.json({
    data: mappedData,
    total,
    page: safePage,
    limit: query.limit,
    totalPages,
    meta: {
      strictTech: query.strictTech,
      strictBudget: query.strictBudget,
      weights,
      maxCandidates: candidateLimit,
      normalizedQuery: {
        category: query.category,
        techStack: query.techStack,
        minBudget: query.minBudget,
        maxBudget: query.maxBudget,
      },
    },
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
              freelancerProfileDetails: {
                select: {
                  serviceDetails: true,
                },
              },
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
                freelancerProfileDetails: {
                  select: {
                    serviceDetails: true,
                  },
                },
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
  const limitNumber = parseInt(req.query.limit, 10) || 10;
  const pageNumber = parseInt(req.query.page, 10) || 1;
  const skip = (pageNumber - 1) * limitNumber;

  const reviews = await prisma.review.findMany({
    where: { serviceId: id },
    orderBy: { createdAt: "desc" },
    take: limitNumber,
    skip
  });

  const total = await prisma.review.count({ where: { serviceId: id } });

  res.json({
    data: reviews,
    total,
    page: pageNumber,
    limit: limitNumber,
    totalPages: Math.ceil(total / limitNumber)
  });
});

export const createServiceReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let { rating, comment } = req.body;

  comment = comment?.trim();

  // Extract from protected req.user
  const clientName = req.user.fullName || "Member";
  const clientId = req.user.id;

  if (!rating || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new AppError("Rating must be an integer between 1 and 5", 400);
  }
  if (!comment || comment.length < 5) {
    throw new AppError("Comment must be at least 5 characters long", 400);
  }

  let service = await prisma.marketplace.findUnique({ where: { id } });
  if (!service) {
    service = await prisma.freelancerProject.findUnique({ where: { id } });
  }
  if (!service) throw new AppError("Service not found", 404);

  const newReview = await prisma.review.create({
    data: {
      serviceId: id,
      clientName,
      clientId,
      rating,
      comment
    }
  });

  res.status(201).json({ data: newReview });
});
