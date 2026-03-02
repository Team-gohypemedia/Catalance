const SCORE_WEIGHTS = {
  technology: 30,
  specialization: 22,
  industry: 13,
  relevance: 12,
  budget: 13,
  experience: 5,
  complexity: 2,
  rating: 2,
  portfolio: 1,
};

const EXPERIENCE_RANK = {
  less_than_1: 1,
  "1_3": 2,
  "3_5": 3,
  "5_plus": 4,
};

const COMPLEXITY_RANK = {
  small: 1,
  medium: 2,
  large: 3,
};

const SERVICE_KEY_ALIASES = {
  web_development: [
    "web development",
    "website development",
    "website design",
    "web dev",
    "web_development",
    "website ui ux",
  ],
  app_development: [
    "app development",
    "mobile app development",
    "mobile development",
    "app_development",
    "android app",
    "ios app",
  ],
  software_development: [
    "software development",
    "software_development",
    "custom software",
    "saas development",
  ],
  creative_design: [
    "creative design",
    "creative_design",
    "ui ux design",
    "graphic design",
    "design",
  ],
  branding: ["branding", "brand identity", "brand strategy", "branding design"],
  social_media_marketing: [
    "social media marketing",
    "social media management",
    "social_media_marketing",
    "smm",
  ],
  seo: ["seo", "seo optimization", "search engine optimization"],
  lead_generation: ["lead generation", "lead_generation", "b2b leads"],
  ai_automation: ["ai automation", "ai_automation", "automation", "agentic automation"],
  voice_agent: ["voice agent", "ai calling", "voice automation", "voice_agent"],
  paid_advertising: ["paid ads", "paid advertising", "meta ads", "google ads"],
  customer_support: ["customer support", "support", "helpdesk"],
  video_services: ["video services", "video editing", "video production"],
  ugc_marketing: ["ugc marketing", "ugc"],
  influencer_marketing: ["influencer marketing", "influencer campaigns"],
  whatsapp_chatbot: ["whatsapp chatbot", "whatsapp automation", "chatbot"],
  crm_erp: ["crm", "erp", "crm erp"],
  writing_content: ["content writing", "writing content", "copywriting"],
  "3d_modeling": ["3d modeling", "3d design"],
  cgi_videos: ["cgi videos", "cgi"],
};

const TECH_ALIASES = {
  nextjs: ["next.js", "next js", "nextjs", "react next.js", "react / next.js"],
  reactjs: ["react.js", "react js", "reactjs", "react"],
  nodejs: ["node.js", "node js", "nodejs", "node"],
  tailwind: ["tailwind css", "tailwindcss", "tailwind"],
  typescript: ["typescript", "ts"],
  javascript: ["javascript", "js", "ecmascript"],
  flutter: ["flutter"],
  react_native: ["react native", "react-native"],
  kotlin: ["kotlin"],
  swift: ["swift", "swiftui"],
  python: ["python", "django", "flask", "fastapi"],
  php: ["php", "laravel"],
  wordpress: ["wordpress", "wp"],
  shopify: ["shopify"],
  mongodb: ["mongodb", "mongo"],
  postgresql: ["postgresql", "postgres", "pgsql", "neondb", "neon db"],
  mysql: ["mysql"],
  prisma: ["prisma", "prismaorm", "prisma orm"],
  express: ["express.js", "express", "expressjs"],
  html_css: ["html css javascript", "html / css / javascript", "html css js"],
  bootstrap: ["bootstrap"],
  vercel: ["vercel"],
  cloudflare: ["cloudflare"],
  firebase: ["firebase", "firestore"],
  supabase: ["supabase"],
  aws: ["aws", "amazon web services"],
  gcp: ["gcp", "google cloud"],
  figma: ["figma"],
  adobe_xd: ["adobe xd"],
};

const TECH_DISPLAY_LABELS = {
  nextjs: "Next.js",
  reactjs: "React",
  nodejs: "Node.js",
  tailwind: "Tailwind CSS",
  typescript: "TypeScript",
  javascript: "JavaScript",
  flutter: "Flutter",
  react_native: "React Native",
  kotlin: "Kotlin",
  swift: "Swift",
  python: "Python",
  php: "PHP",
  wordpress: "WordPress",
  shopify: "Shopify",
  mongodb: "MongoDB",
  postgresql: "PostgreSQL",
  mysql: "MySQL",
  prisma: "Prisma",
  express: "Express.js",
  html_css: "HTML/CSS/JavaScript",
  bootstrap: "Bootstrap",
  vercel: "Vercel",
  cloudflare: "Cloudflare",
  firebase: "Firebase",
  supabase: "Supabase",
  aws: "AWS",
  gcp: "GCP",
  figma: "Figma",
  adobe_xd: "Adobe XD",
};

const SPECIALIZATION_KEYWORDS = {
  "E-commerce": /e-?commerce|online store|shop|sell products|woocommerce/i,
  "SaaS Platforms": /saas|software as a service|subscription platform/i,
  "Landing Pages": /landing page|single page|one page/i,
  "Corporate / Business": /corporate|business website|company website/i,
  "Marketplace Websites": /marketplace|multi-vendor|buyer.*seller/i,
  Portfolio: /portfolio|personal site/i,
  WordPress: /wordpress|wp/i,
  Shopify: /shopify/i,
  "Mobile App": /mobile app|android app|ios app/i,
  "Web Application": /web app|dashboard|admin panel/i,
};

const INDUSTRY_KEYWORDS = {
  Technology: /tech|software|app|saas|developer/i,
  "E-commerce": /e-?commerce|online store|retail/i,
  Education: /education|learning|course|school|edtech/i,
  Healthcare: /health|medical|clinic|doctor|hospital/i,
  "Food & Beverage": /food|restaurant|cafe|beverage/i,
  "Real Estate": /real estate|property|housing/i,
  "Fashion & Apparel": /fashion|clothing|apparel/i,
  Finance: /finance|banking|fintech|insurance/i,
  Startups: /startup|mvp|early stage|founder/i,
  Entertainment: /entertainment|media|music|streaming/i,
};

const REQUIRED_TECH_FIELD_KEYS = [
  "tech_stack",
  "project_stack",
  "project_tech_stack",
  "required_tech_stack",
  "frontend_framework",
  "backend_technology",
  "database",
  "hosting",
  "dev_framework",
  "mobile_framework",
  "cms_platform",
  "ecommerce_platform",
  "technology",
  "platform_requirements",
];

const PRIORITY_TECH_FIELD_KEYS = [
  "project_stack",
  "project_tech_stack",
  "required_tech_stack",
  "project_note",
  "project_notes",
  "tech_stack",
  "frontend_framework",
  "backend_technology",
  "database",
];

const TECH_NOTE_FIELD_KEYS = [
  "project_note",
  "project_notes",
  "project_requirement",
  "project_requirements",
  "description",
  "requirements",
];

const REQUIRED_SPECIALIZATION_FIELD_KEYS = [
  "website_type",
  "project_type",
  "app_type",
  "creative_type",
  "platform_type",
];

const REQUIRED_INDUSTRY_FIELD_KEYS = [
  "industry",
  "business_industry",
  "target_industry",
  "niche",
];

const REQUIRED_BUDGET_FIELD_KEYS = ["budget", "project_budget", "user_budget"];
const REQUIRED_TIMELINE_FIELD_KEYS = ["timeline", "launch_timeline", "duration"];
const REQUIRED_COMPLEXITY_FIELD_KEYS = ["project_complexity", "complexity"];
const REQUIRED_RELEVANCE_TEXT_FIELD_KEYS = [
  "project_note",
  "project_notes",
  "project_requirement",
  "project_requirements",
  "requirement",
  "requirements",
  "description",
  "scope",
  "deliverables",
  "features",
  "goals",
  "business_goal",
];

const MAX_REQUIREMENT_KEYWORDS = 80;
const BUDGET_HARD_FILTER_MULTIPLIER = 1.35;
const KEYWORD_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "but",
  "by",
  "for",
  "from",
  "has",
  "have",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "of",
  "on",
  "or",
  "our",
  "that",
  "the",
  "their",
  "them",
  "there",
  "these",
  "this",
  "to",
  "we",
  "with",
  "you",
  "your",
  "need",
  "needs",
  "want",
  "wants",
  "looking",
  "build",
  "project",
  "service",
  "required",
  "requirement",
  "requirements",
  "client",
  "work",
  "budget",
  "timeline",
  "stack",
  "note",
  "inr",
  "usd",
  "eur",
  "aud",
  "cad",
  "gbp",
]);

const SERVICE_ALIAS_LOOKUP = buildAliasLookup(SERVICE_KEY_ALIASES);
const TECH_ALIAS_LOOKUP = buildAliasLookup(TECH_ALIASES, true);
const TECH_ALIAS_TEXT_LOOKUP = buildTextAliasLookup(TECH_ALIASES);
const ALLOWED_STATUSES = new Set(["ACTIVE", "PENDING_APPROVAL"]);

function buildAliasLookup(aliasMap, stripUnderscore = false) {
  const lookup = {};
  Object.entries(aliasMap).forEach(([canonical, aliases]) => {
    const normalizedCanonical = normalizeKey(canonical);
    lookup[normalizedCanonical] = canonical;

    aliases.forEach((alias) => {
      const normalizedAlias = normalizeKey(alias);
      lookup[normalizedAlias] = canonical;
      if (stripUnderscore) {
        lookup[normalizedAlias.replace(/_/g, "")] = canonical;
      }
    });
  });
  return lookup;
}

function buildTextAliasLookup(aliasMap) {
  const items = [];
  Object.entries(aliasMap).forEach(([canonical, aliases]) => {
    aliases.forEach((alias) => {
      const normalizedAlias = normalizeText(alias);
      if (!normalizedAlias) return;
      items.push({ canonical, alias: normalizedAlias });
    });
  });
  items.sort((a, b) => b.alias.length - a.alias.length);
  return items;
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s/.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function flattenValues(value) {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value.flatMap((item) => flattenValues(item));
  if (typeof value === "object") {
    return Object.values(value).flatMap((item) => flattenValues(item));
  }
  if (typeof value === "number" || typeof value === "string") {
    return [String(value)];
  }
  return [];
}

function uniqueList(values = []) {
  const seen = new Set();
  const result = [];
  values.forEach((entry) => {
    const trimmed = String(entry || "").trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(trimmed);
  });
  return result;
}

function splitMultiValue(value) {
  return String(value || "")
    .split(/,|\/|;|\||\+|&|\band\b/gi)
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizeServiceKey(value) {
  const normalized = normalizeKey(value);
  if (!normalized) return "";
  if (SERVICE_ALIAS_LOOKUP[normalized]) {
    return SERVICE_ALIAS_LOOKUP[normalized];
  }

  if (normalized.includes("web") && normalized.includes("development")) {
    return "web_development";
  }
  if (normalized.includes("app") && normalized.includes("development")) {
    return "app_development";
  }
  if (normalized.includes("ai") && normalized.includes("automation")) {
    return "ai_automation";
  }
  if (normalized.includes("voice") && normalized.includes("agent")) {
    return "voice_agent";
  }
  if (normalized.includes("lead") && normalized.includes("generation")) {
    return "lead_generation";
  }
  if (normalized.includes("social") && normalized.includes("marketing")) {
    return "social_media_marketing";
  }

  return normalized;
}

function normalizeTech(value) {
  const normalized = normalizeText(value);
  if (!normalized) return "";
  const compact = normalizeKey(normalized).replace(/_/g, "");
  if (TECH_ALIAS_LOOKUP[compact]) {
    return TECH_ALIAS_LOOKUP[compact];
  }

  const normalizedKey = normalizeKey(normalized);
  if (TECH_ALIAS_LOOKUP[normalizedKey]) {
    return TECH_ALIAS_LOOKUP[normalizedKey];
  }

  for (const item of TECH_ALIAS_TEXT_LOOKUP) {
    if (normalized.includes(item.alias) || item.alias.includes(normalized)) {
      return item.canonical;
    }
  }
  return normalizedKey;
}

function fuzzyTechMatch(requiredTech, freelancerTech) {
  if (!requiredTech || !freelancerTech) return false;
  if (requiredTech === freelancerTech) return true;
  if (
    requiredTech.includes(freelancerTech) ||
    freelancerTech.includes(requiredTech)
  ) {
    return true;
  }

  const requiredTokens = requiredTech.split("_").filter(Boolean);
  const freelancerTokens = freelancerTech.split("_").filter(Boolean);
  if (!requiredTokens.length || !freelancerTokens.length) return false;

  const overlap = requiredTokens.filter((token) =>
    freelancerTokens.includes(token),
  ).length;
  return overlap >= Math.min(requiredTokens.length, freelancerTokens.length);
}

function getTechLabel(canonical) {
  if (!canonical) return "";
  return TECH_DISPLAY_LABELS[canonical] || canonical.replace(/_/g, " ");
}

function parseLabeledFields(text = "") {
  const fields = {};
  const lines = String(text || "").split(/\r?\n/);
  let activeKey = "";

  lines.forEach((line) => {
    const cleaned = line
      .replace(/^\s*[-*#>\d.()]+\s*/, "")
      .replace(/\*+/g, "")
      .trim();
    if (!cleaned) return;

    const match = cleaned.match(/^([^:]{2,70}):\s*(.+)$/);
    if (match) {
      activeKey = normalizeKey(match[1]);
      if (!fields[activeKey]) fields[activeKey] = [];
      fields[activeKey].push(match[2].trim());
      return;
    }

    if (activeKey && cleaned.length < 160) {
      fields[activeKey].push(cleaned);
    }
  });

  return fields;
}

function getFieldValuesByKey(fields, keys = []) {
  const values = [];
  keys.forEach((key) => {
    const normalized = normalizeKey(key);
    Object.entries(fields).forEach(([fieldKey, fieldValues]) => {
      if (
        fieldKey === normalized ||
        fieldKey.includes(normalized) ||
        normalized.includes(fieldKey)
      ) {
        values.push(...fieldValues);
      }
    });
  });
  return values;
}

function parseBudgetAmount(raw) {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;

  const text = String(raw).toLowerCase().replace(/,/g, "");
  const regex =
    /(\d+(?:\.\d+)?)\s*(k|thousand|lakh|lac|lakhs|lacs|crore|cr|million|m)?/gi;
  const values = [];
  let match = regex.exec(text);
  while (match) {
    const amount = Number.parseFloat(match[1]);
    if (Number.isFinite(amount)) {
      const unit = String(match[2] || "").toLowerCase();
      let multiplier = 1;
      if (unit === "k" || unit === "thousand") multiplier = 1000;
      if (unit.startsWith("lakh") || unit === "lac" || unit === "lacs") {
        multiplier = 100000;
      }
      if (unit === "crore" || unit === "cr") multiplier = 10000000;
      if (unit === "million" || unit === "m") multiplier = 1000000;
      values.push(amount * multiplier);
    }
    match = regex.exec(text);
  }

  if (!values.length) return null;
  if (values.length === 1) return Math.round(values[0]);

  if (/to|between|-/i.test(text)) {
    return Math.round(Math.max(...values));
  }

  return Math.round(values[0]);
}

function parseBudgetRange(rangeText) {
  const raw = String(rangeText || "").trim();
  if (!raw) return null;

  const text = raw.toLowerCase().replace(/,/g, "");
  const regex =
    /(\d+(?:\.\d+)?)\s*(k|thousand|lakh|lac|lakhs|lacs|crore|cr|million|m)?/gi;
  const amounts = [];
  let match = regex.exec(text);

  while (match) {
    const parsed = parseBudgetAmount(`${match[1]} ${match[2] || ""}`);
    if (parsed !== null) amounts.push(parsed);
    match = regex.exec(text);
  }

  if (!amounts.length) return null;

  if (/under|below|upto|up to|less than/i.test(text)) {
    return { min: 0, max: amounts[0] };
  }
  if (/over|above|more than|\+$/.test(text)) {
    return { min: amounts[0], max: Number.POSITIVE_INFINITY };
  }

  if (amounts.length >= 2) {
    const sorted = amounts.sort((a, b) => a - b);
    return { min: sorted[0], max: sorted[1] };
  }

  const amount = amounts[0];
  return {
    min: Math.max(0, Math.floor(amount * 0.7)),
    max: Math.ceil(amount * 1.3),
  };
}

function parseTimelineMonths(value) {
  const text = String(value || "").toLowerCase();
  if (!text) return null;

  const regex = /(\d+(?:\.\d+)?)\s*(day|days|week|weeks|month|months)/gi;
  const values = [];
  let match = regex.exec(text);
  while (match) {
    const amount = Number.parseFloat(match[1]);
    if (!Number.isFinite(amount)) {
      match = regex.exec(text);
      continue;
    }
    const unit = match[2].toLowerCase();
    if (unit.startsWith("day")) values.push(amount / 30);
    if (unit.startsWith("week")) values.push(amount / 4);
    if (unit.startsWith("month")) values.push(amount);
    match = regex.exec(text);
  }
  if (!values.length) return null;
  return Math.max(...values);
}

function normalizeComplexity(value) {
  const normalized = normalizeKey(value);
  if (!normalized) return "";

  if (normalized === "small" || normalized === "beginner") return "small";
  if (normalized === "medium" || normalized === "intermediate") return "medium";
  if (
    normalized === "large" ||
    normalized === "expert" ||
    normalized === "advanced"
  ) {
    return "large";
  }
  return "";
}

function inferProjectComplexity({ budget, timelineMonths, featureCount, hint }) {
  const normalizedHint = normalizeComplexity(hint);
  if (normalizedHint) return normalizedHint;

  let score = 0;
  if (budget >= 300000) score += 2;
  else if (budget >= 100000) score += 1;

  if (timelineMonths >= 6) score += 2;
  else if (timelineMonths >= 3) score += 1;

  if (featureCount >= 10) score += 2;
  else if (featureCount >= 6) score += 1;

  if (score >= 4) return "large";
  if (score >= 2) return "medium";
  return "small";
}

function extractFeatureCount(proposalText = "", proposal = {}) {
  let count = 0;
  const lines = String(proposalText || "").split(/\r?\n/);
  lines.forEach((line) => {
    if (/^\s*[-*]\s+/.test(line)) count += 1;
  });

  if (Array.isArray(proposal.features)) {
    count += proposal.features.length;
  }
  return count;
}

function collectValuesFromAnswers(answerObj = {}, keys = []) {
  const values = [];
  if (!answerObj || typeof answerObj !== "object") return values;
  keys.forEach((key) => {
    const normalizedKey = normalizeKey(key);
    Object.entries(answerObj).forEach(([sourceKey, sourceValue]) => {
      const normalizedSourceKey = normalizeKey(sourceKey);
      if (
        normalizedSourceKey === normalizedKey ||
        normalizedSourceKey.includes(normalizedKey) ||
        normalizedKey.includes(normalizedSourceKey)
      ) {
        values.push(...flattenValues(sourceValue));
      }
    });
  });
  return values;
}

function collectCapturedFieldValues(capturedFields = [], keys = []) {
  const values = [];
  if (!Array.isArray(capturedFields)) return values;

  capturedFields.forEach((entry) => {
    const question = normalizeKey(entry?.question || entry?.label || "");
    const answer = flattenValues(entry?.answer);
    keys.forEach((key) => {
      const normalizedKey = normalizeKey(key);
      if (
        question === normalizedKey ||
        question.includes(normalizedKey) ||
        normalizedKey.includes(question)
      ) {
        values.push(...answer);
      }
    });
  });
  return values;
}

function collectRequirementValues({ fields, bySlug, byQuestion, capturedFields }, keys) {
  return [
    ...getFieldValuesByKey(fields, keys),
    ...collectValuesFromAnswers(bySlug, keys),
    ...collectValuesFromAnswers(byQuestion, keys),
    ...collectCapturedFieldValues(capturedFields, keys),
  ];
}

function isLikelyStructuredTechnology(rawValue, canonical) {
  const normalizedRaw = normalizeText(rawValue);
  if (!normalizedRaw || !canonical) return false;

  if (Object.prototype.hasOwnProperty.call(TECH_ALIASES, canonical)) {
    return true;
  }

  const tokens = normalizedRaw.split(/\s+/).filter(Boolean);
  if (!tokens.length) return false;
  if (tokens.length !== 1) return false;
  return normalizedRaw.length <= 24;
}

function collectCanonicalTechnologies(candidates = []) {
  const canonicalSet = new Set();

  candidates.forEach((candidate) => {
    splitMultiValue(candidate).forEach((part) => {
      const canonical = normalizeTech(part);
      if (!canonical) return;
      if (!isLikelyStructuredTechnology(part, canonical)) return;
      canonicalSet.add(canonical);
    });
  });

  return canonicalSet;
}

function extractTechnologies({
  proposal,
  proposalText,
  fields,
  bySlug,
  byQuestion,
  capturedFields,
  appHints,
}) {
  const priorityCandidates = collectRequirementValues(
    { fields, bySlug, byQuestion, capturedFields },
    PRIORITY_TECH_FIELD_KEYS,
  );
  const structuredCandidates = collectRequirementValues(
    { fields, bySlug, byQuestion, capturedFields },
    REQUIRED_TECH_FIELD_KEYS,
  );
  const noteCandidates = collectRequirementValues(
    { fields, bySlug, byQuestion, capturedFields },
    TECH_NOTE_FIELD_KEYS,
  );
  const explicitCandidates = [
    ...flattenValues(proposal?.technologies),
    ...flattenValues(proposal?.techstack),
  ];
  const appHintCandidates =
    appHints && typeof appHints === "object"
      ? [
          ...flattenValues(appHints.mobileTechnology),
          ...flattenValues(appHints.backendTechnology),
          ...flattenValues(appHints.dashboardTechnology),
          ...flattenValues(appHints.techStack),
        ]
      : [];

  const priorityCanonicals = collectCanonicalTechnologies(priorityCandidates);
  const canonicalSet = new Set();

  if (priorityCanonicals.size > 0) {
    priorityCanonicals.forEach((entry) => canonicalSet.add(entry));
    collectCanonicalTechnologies(appHintCandidates).forEach((entry) =>
      canonicalSet.add(entry),
    );
  } else {
    collectCanonicalTechnologies([
      ...structuredCandidates,
      ...explicitCandidates,
      ...appHintCandidates,
    ]).forEach((entry) => canonicalSet.add(entry));

    const searchableText = normalizeText(
      [
        proposalText,
        ...structuredCandidates,
        ...noteCandidates,
        ...explicitCandidates,
        ...appHintCandidates,
      ]
        .filter(Boolean)
        .join(" "),
    );
    TECH_ALIAS_TEXT_LOOKUP.forEach((item) => {
      if (searchableText.includes(item.alias)) {
        canonicalSet.add(item.canonical);
      }
    });
  }

  const canonicals = Array.from(canonicalSet);
  return {
    canonicals,
    labels: canonicals.map((canonical) => getTechLabel(canonical)),
  };
}

function extractSpecializations({ proposalText, fields, bySlug, byQuestion, capturedFields }) {
  const specs = [];
  specs.push(
    ...collectRequirementValues(
      { fields, bySlug, byQuestion, capturedFields },
      REQUIRED_SPECIALIZATION_FIELD_KEYS,
    ),
  );

  Object.entries(SPECIALIZATION_KEYWORDS).forEach(([label, regex]) => {
    if (regex.test(proposalText)) specs.push(label);
  });
  return uniqueList(specs);
}

function extractIndustries({ proposalText, fields, bySlug, byQuestion, capturedFields }) {
  const industries = [];
  industries.push(
    ...collectRequirementValues(
      { fields, bySlug, byQuestion, capturedFields },
      REQUIRED_INDUSTRY_FIELD_KEYS,
    ),
  );

  Object.entries(INDUSTRY_KEYWORDS).forEach(([label, regex]) => {
    if (regex.test(proposalText)) industries.push(label);
  });
  return uniqueList(industries);
}

function extractServiceKey({ proposal, context, fields, bySlug, byQuestion, capturedFields }) {
  const candidates = [
    proposal?.serviceKey,
    proposal?.service,
    proposal?.serviceName,
    context?.serviceId,
    context?.serviceKey,
    context?.serviceName,
    ...collectRequirementValues(
      { fields, bySlug, byQuestion, capturedFields },
      ["service", "service_type", "service_name"],
    ),
  ];

  for (const candidate of candidates) {
    const normalized = normalizeServiceKey(candidate);
    if (normalized) return normalized;
  }
  return "";
}

function extractBudget({ proposal, fields, bySlug, byQuestion, capturedFields }) {
  const direct = parseBudgetAmount(proposal?.budget);
  if (direct !== null) return direct;

  const candidates = collectRequirementValues(
    { fields, bySlug, byQuestion, capturedFields },
    REQUIRED_BUDGET_FIELD_KEYS,
  );
  for (const candidate of candidates) {
    const parsed = parseBudgetAmount(candidate);
    if (parsed !== null) return parsed;
  }
  return null;
}

function extractTimeline({ proposal, fields, bySlug, byQuestion, capturedFields }) {
  const direct = parseTimelineMonths(proposal?.timeline);
  if (direct !== null) return direct;

  const candidates = collectRequirementValues(
    { fields, bySlug, byQuestion, capturedFields },
    REQUIRED_TIMELINE_FIELD_KEYS,
  );
  for (const candidate of candidates) {
    const parsed = parseTimelineMonths(candidate);
    if (parsed !== null) return parsed;
  }
  return null;
}

function extractComplexityHint({ proposal, fields, bySlug, byQuestion, capturedFields }) {
  const direct = normalizeComplexity(proposal?.complexity || proposal?.projectComplexity);
  if (direct) return direct;

  const candidates = collectRequirementValues(
    { fields, bySlug, byQuestion, capturedFields },
    REQUIRED_COMPLEXITY_FIELD_KEYS,
  );
  for (const candidate of candidates) {
    const normalized = normalizeComplexity(candidate);
    if (normalized) return normalized;
  }
  return "";
}

function isOngoingProject({ fields, bySlug, byQuestion, capturedFields }) {
  const candidates = collectRequirementValues(
    { fields, bySlug, byQuestion, capturedFields },
    ["ongoing", "project_status", "accept_in_progress"],
  );
  return candidates.some((entry) => /ongoing|in progress|existing/i.test(String(entry)));
}

function tokenizeKeywords(value, { max = 120 } = {}) {
  const tokens = normalizeText(value)
    .replace(/[./]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3)
    .filter((token) => !/^\d+$/.test(token))
    .filter((token) => !KEYWORD_STOP_WORDS.has(token));

  return tokens.slice(0, max);
}

function extractRequirementKeywords({
  proposal,
  proposalText,
  fields,
  bySlug,
  byQuestion,
  capturedFields,
}) {
  const textCandidates = [
    proposal?.projectTitle,
    proposal?.title,
    proposal?.summary,
    proposal?.content,
    ...collectRequirementValues(
      { fields, bySlug, byQuestion, capturedFields },
      REQUIRED_RELEVANCE_TEXT_FIELD_KEYS,
    ),
  ];

  const keywords = uniqueList(
    textCandidates.flatMap((candidate) =>
      tokenizeKeywords(candidate, { max: MAX_REQUIREMENT_KEYWORDS }),
    ),
  );

  return keywords.slice(0, MAX_REQUIREMENT_KEYWORDS);
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function rounded(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function normalizeLabel(value) {
  return normalizeText(value).replace(/\s+/g, " ").trim();
}

function scoreSpecializationMatch(requiredSpecs, freelancerSpecs) {
  if (!requiredSpecs.length) return 0.5;
  const normalizedFreelancer = new Set(
    freelancerSpecs.map((item) => normalizeLabel(item)).filter(Boolean),
  );
  if (!normalizedFreelancer.size) return 0;

  let matched = 0;
  requiredSpecs.forEach((required) => {
    const normalizedRequired = normalizeLabel(required);
    if (!normalizedRequired) return;

    if (normalizedFreelancer.has(normalizedRequired)) {
      matched += 1;
      return;
    }

    for (const spec of normalizedFreelancer) {
      if (
        spec.includes(normalizedRequired) ||
        normalizedRequired.includes(spec)
      ) {
        matched += 0.7;
        return;
      }
    }
  });

  return Math.min(1, matched / requiredSpecs.length);
}

function scoreIndustryMatch(requiredIndustries, freelancerIndustries) {
  if (!requiredIndustries.length) return 0.5;
  const normalizedFreelancer = new Set(
    freelancerIndustries.map((item) => normalizeLabel(item)).filter(Boolean),
  );
  if (!normalizedFreelancer.size) return 0;

  const matched = requiredIndustries.filter((industry) =>
    normalizedFreelancer.has(normalizeLabel(industry)),
  ).length;

  return Math.min(1, matched / requiredIndustries.length);
}

function extractServicePriceFromDetail(detail) {
  if (!detail || typeof detail !== "object") return "";
  const candidates = [
    detail?.averageProjectPriceRange,
    detail?.averageProjectPrice,
    detail?.averagePrice,
    detail?.priceRange,
    detail?.pricing
  ];
  for (const candidate of candidates) {
    const normalized = String(candidate || "").trim();
    if (normalized) return normalized;
  }
  return "";
}

function resolveServicePriceRange(freelancer, serviceProject, requirements) {
  const directRange = String(serviceProject?.averageProjectPriceRange || "").trim();
  if (directRange) return directRange;

  const serviceDetails = freelancer?.profileDetails?.serviceDetails;
  if (!serviceDetails || typeof serviceDetails !== "object") return "";

  const candidateKeys = uniqueList([
    normalizeServiceKey(serviceProject?.serviceKey || serviceProject?.serviceName),
    normalizeServiceKey(requirements?.serviceKey),
  ]).filter(Boolean);

  for (const candidateKey of candidateKeys) {
    if (serviceDetails[candidateKey]) {
      const range = extractServicePriceFromDetail(serviceDetails[candidateKey]);
      if (range) return range;
    }
  }

  for (const [rawKey, detail] of Object.entries(serviceDetails)) {
    const normalizedKey = normalizeServiceKey(rawKey);
    if (candidateKeys.length && !candidateKeys.includes(normalizedKey)) continue;
    const range = extractServicePriceFromDetail(detail);
    if (range) return range;
  }

  return "";
}

function evaluateBudgetMatch(clientBudget, freelancerPriceRange) {
  const budgetAmount = safeNumber(clientBudget, 0);
  const normalizedPriceRange = String(freelancerPriceRange || "").trim();

  if (!budgetAmount) {
    return {
      raw: 0.5,
      hardRejected: false,
      withinRange: false,
      range: null,
      priceRange: normalizedPriceRange || null,
    };
  }

  if (!normalizedPriceRange) {
    return {
      raw: 0.35,
      hardRejected: false,
      withinRange: false,
      range: null,
      priceRange: null,
    };
  }

  const range = parseBudgetRange(normalizedPriceRange);
  if (!range) {
    return {
      raw: 0.35,
      hardRejected: false,
      withinRange: false,
      range: null,
      priceRange: normalizedPriceRange,
    };
  }

  const min = safeNumber(range.min, 0);
  const max = Number.isFinite(range.max) ? range.max : Number.POSITIVE_INFINITY;
  const isFarAboveBudget = budgetAmount < min && min > budgetAmount * BUDGET_HARD_FILTER_MULTIPLIER;

  if (isFarAboveBudget) {
    return {
      raw: 0.1,
      hardRejected: true,
      withinRange: false,
      range: { min, max },
      priceRange: normalizedPriceRange,
    };
  }

  if (budgetAmount >= min && budgetAmount <= max) {
    return {
      raw: 1,
      hardRejected: false,
      withinRange: true,
      range: { min, max },
      priceRange: normalizedPriceRange,
    };
  }

  if (budgetAmount < min) {
    const gapRatio = (min - budgetAmount) / Math.max(min, 1);
    let raw = 0.25;
    if (gapRatio <= 0.1) raw = 0.85;
    else if (gapRatio <= 0.25) raw = 0.65;
    else if (gapRatio <= 0.4) raw = 0.45;

    return {
      raw,
      hardRejected: false,
      withinRange: false,
      range: { min, max },
      priceRange: normalizedPriceRange,
    };
  }

  if (!Number.isFinite(max)) {
    return {
      raw: 0.95,
      hardRejected: false,
      withinRange: true,
      range: { min, max },
      priceRange: normalizedPriceRange,
    };
  }

  const overshootRatio = (budgetAmount - max) / Math.max(max, 1);
  let raw = 0.55;
  if (overshootRatio <= 0.2) raw = 0.85;
  else if (overshootRatio <= 0.5) raw = 0.7;

  return {
    raw,
    hardRejected: false,
    withinRange: false,
    range: { min, max },
    priceRange: normalizedPriceRange,
  };
}

function mapExperienceToRank(value, fallbackYears = 0) {
  const normalized = normalizeKey(value);
  if (EXPERIENCE_RANK[normalized]) return EXPERIENCE_RANK[normalized];

  const years = safeNumber(value, Number.NaN);
  const finalYears = Number.isFinite(years) ? years : safeNumber(fallbackYears, 0);
  if (finalYears >= 5) return EXPERIENCE_RANK["5_plus"];
  if (finalYears >= 3) return EXPERIENCE_RANK["3_5"];
  if (finalYears >= 1) return EXPERIENCE_RANK["1_3"];
  return EXPERIENCE_RANK.less_than_1;
}

function scoreExperience(freelancerExperience, projectComplexity, fallbackYears) {
  const expRank = mapExperienceToRank(freelancerExperience, fallbackYears);
  const requiredRank = COMPLEXITY_RANK[projectComplexity] || COMPLEXITY_RANK.medium;
  if (expRank >= requiredRank) return 1;
  if (expRank === requiredRank - 1) return 0.6;
  return 0.3;
}

function scoreComplexityFit(freelancerComplexity, projectComplexity) {
  if (!projectComplexity) return 0.5;
  const freelancerRank = COMPLEXITY_RANK[normalizeComplexity(freelancerComplexity)] || 2;
  const projectRank = COMPLEXITY_RANK[projectComplexity] || 2;
  if (freelancerRank >= projectRank) return 1;
  if (freelancerRank === projectRank - 1) return 0.5;
  return 0.2;
}

function scoreRating(rating, reviewCount) {
  const normalizedRating = safeNumber(rating, 0);
  const normalizedReviewCount = safeNumber(reviewCount, 0);
  if (normalizedReviewCount === 0) return 0.3;

  const priorReviews = 5;
  const priorMean = 3.5;
  const bayesian =
    (normalizedReviewCount * normalizedRating + priorReviews * priorMean) /
    (normalizedReviewCount + priorReviews);

  return Math.min(1, bayesian / 5);
}

function collectFreelancerTechs(freelancer, serviceProject) {
  const entries = [
    ...flattenValues(freelancer?.skills),
    ...flattenValues(serviceProject?.activeTechnologies),
    ...flattenValues(serviceProject?.tags),
    ...flattenValues(serviceProject?.techStack),
    ...flattenValues(freelancer?.freelancerProjects),
    ...flattenValues(freelancer?.profileDetails?.serviceDetails),
  ];

  const techs = new Set();
  entries.forEach((entry) => {
    splitMultiValue(entry).forEach((part) => {
      const normalized = normalizeTech(part);
      if (normalized) techs.add(normalized);
    });
  });
  return techs;
}

function scoreTechnologyMatch(requirements, freelancer, serviceProject) {
  if (!requirements.technologyCanonicals.length) {
    return {
      raw: 1,
      matchedTechnologies: [],
      matchedCanonicals: [],
      matchedCount: 0,
      requiredCount: 0,
      isFullMatch: true,
    };
  }

  const freelancerTechs = collectFreelancerTechs(freelancer, serviceProject);
  if (!freelancerTechs.size) {
    return {
      raw: 0,
      matchedTechnologies: [],
      matchedCanonicals: [],
      matchedCount: 0,
      requiredCount: requirements.technologyCanonicals.length,
      isFullMatch: false,
    };
  }

  const matched = [];
  requirements.technologyCanonicals.forEach((requiredCanonical) => {
    if (freelancerTechs.has(requiredCanonical)) {
      matched.push(requiredCanonical);
      return;
    }
    for (const freelancerTech of freelancerTechs) {
      if (fuzzyTechMatch(requiredCanonical, freelancerTech)) {
        matched.push(requiredCanonical);
        return;
      }
    }
  });

  const uniqueMatched = Array.from(new Set(matched));
  const requiredCount = requirements.technologyCanonicals.length;
  const matchedCount = uniqueMatched.length;
  return {
    raw: matchedCount / requiredCount,
    matchedTechnologies: uniqueMatched.map((item) => getTechLabel(item)),
    matchedCanonicals: uniqueMatched,
    matchedCount,
    requiredCount,
    isFullMatch: matchedCount >= requiredCount,
  };
}

function extractFreelancerKeywordTokens(freelancer = {}, serviceProject = {}, requirements = {}) {
  const tokens = new Set();
  const projectEntries = Array.isArray(freelancer?.freelancerProjects)
    ? freelancer.freelancerProjects
    : [];
  const portfolioEntries = Array.isArray(freelancer?.portfolioProjects)
    ? freelancer.portfolioProjects
    : [];

  const serviceDetails =
    freelancer?.profileDetails?.serviceDetails &&
    typeof freelancer.profileDetails.serviceDetails === "object"
      ? freelancer.profileDetails.serviceDetails
      : {};
  const relevantServiceKey = normalizeServiceKey(
    serviceProject?.serviceKey || serviceProject?.serviceName || requirements?.serviceKey,
  );
  const relevantServiceDetails = Object.entries(serviceDetails)
    .filter(([rawKey]) => {
      if (!relevantServiceKey) return true;
      return normalizeServiceKey(rawKey) === relevantServiceKey;
    })
    .map(([, detail]) => detail);

  const textCandidates = [
    ...flattenValues(freelancer?.skills),
    ...flattenValues(freelancer?.services),
    ...flattenValues(serviceProject?.serviceName),
    ...flattenValues(serviceProject?.serviceSpecializations),
    ...flattenValues(serviceProject?.industriesOrNiches),
    ...flattenValues(serviceProject?.activeTechnologies),
    ...flattenValues(serviceProject?.tags),
    ...flattenValues(serviceProject?.techStack),
    ...flattenValues(serviceProject?.title),
    ...flattenValues(serviceProject?.description),
    ...flattenValues(freelancer?.profileDetails?.globalIndustryFocus),
    ...flattenValues(freelancer?.profileDetails?.globalIndustryOther),
    ...flattenValues(relevantServiceDetails),
    ...projectEntries.flatMap((project) => [
      project?.title,
      project?.description,
      ...(Array.isArray(project?.tags) ? project.tags : []),
      ...(Array.isArray(project?.techStack) ? project.techStack : []),
      ...(Array.isArray(project?.serviceSpecializations)
        ? project.serviceSpecializations
        : []),
      ...(Array.isArray(project?.industriesOrNiches) ? project.industriesOrNiches : []),
    ]),
    ...portfolioEntries.flatMap((project) => [
      project?.title,
      project?.description,
      ...(Array.isArray(project?.tags) ? project.tags : []),
      ...(Array.isArray(project?.techStack) ? project.techStack : []),
    ]),
  ];

  textCandidates.forEach((candidate) => {
    tokenizeKeywords(candidate, { max: 80 }).forEach((token) => tokens.add(token));
  });

  return tokens;
}

function scoreRequirementRelevance(requirements, freelancer, serviceProject) {
  const requiredKeywords = Array.isArray(requirements?.requirementKeywords)
    ? requirements.requirementKeywords
    : [];
  if (!requiredKeywords.length) return 0.5;

  const freelancerKeywords = extractFreelancerKeywordTokens(
    freelancer,
    serviceProject,
    requirements,
  );
  if (!freelancerKeywords.size) return 0;

  let matched = 0;

  requiredKeywords.forEach((keyword) => {
    if (freelancerKeywords.has(keyword)) {
      matched += 1;
      return;
    }

    if (keyword.length < 5) return;
    for (const freelancerKeyword of freelancerKeywords) {
      if (
        freelancerKeyword === keyword ||
        freelancerKeyword.includes(keyword) ||
        keyword.includes(freelancerKeyword)
      ) {
        matched += 0.65;
        return;
      }
    }
  });

  return Math.min(1, matched / requiredKeywords.length);
}

function scorePortfolioRelevance(freelancerProjects, requirements) {
  if (!Array.isArray(freelancerProjects) || freelancerProjects.length === 0) {
    return 0.2;
  }

  let bestScore = 0;
  const normalizedRequiredSpecs = requirements.specializations.map((entry) =>
    normalizeLabel(entry),
  );

  freelancerProjects.forEach((project) => {
    const projectTechs = new Set();
    [
      ...flattenValues(project?.tags),
      ...flattenValues(project?.techStack),
      ...flattenValues(project?.activeTechnologies),
    ].forEach((entry) => {
      splitMultiValue(entry).forEach((part) => {
        const normalized = normalizeTech(part);
        if (normalized) projectTechs.add(normalized);
      });
    });

    let projectScore = 0;

    if (requirements.technologyCanonicals.length > 0) {
      const overlap = requirements.technologyCanonicals.filter((requiredTech) => {
        if (projectTechs.has(requiredTech)) return true;
        for (const projectTech of projectTechs) {
          if (fuzzyTechMatch(requiredTech, projectTech)) return true;
        }
        return false;
      }).length;
      projectScore += (overlap / requirements.technologyCanonicals.length) * 0.6;
    } else {
      projectScore += 0.3;
    }

    const projectSpecs = flattenValues(project?.serviceSpecializations).map((entry) =>
      normalizeLabel(entry),
    );
    if (normalizedRequiredSpecs.length > 0 && projectSpecs.length > 0) {
      const specOverlap = normalizedRequiredSpecs.filter((requiredSpec) =>
        projectSpecs.some(
          (projectSpec) =>
            projectSpec === requiredSpec ||
            projectSpec.includes(requiredSpec) ||
            requiredSpec.includes(projectSpec),
        ),
      ).length;
      projectScore += (specOverlap / normalizedRequiredSpecs.length) * 0.2;
    } else if (!normalizedRequiredSpecs.length) {
      projectScore += 0.1;
    }

    if (project?.budget) {
      projectScore += 0.1;
    }
    if (project?.link || project?.url) {
      projectScore += 0.1;
    }

    bestScore = Math.max(bestScore, projectScore);
  });

  return Math.min(1, bestScore);
}

function resolveWeights(requirements) {
  const weights = { ...SCORE_WEIGHTS };
  if (!requirements.technologyCanonicals.length) {
    const redistributed = weights.technology;
    weights.technology = 0;
    weights.specialization += redistributed * 0.4;
    weights.industry += redistributed * 0.3;
    weights.relevance += redistributed * 0.3;
  }
  return weights;
}

function extractFreelancerServiceSpecializations(serviceProject = {}) {
  const resolved =
    serviceProject && typeof serviceProject === "object" ? serviceProject : {};
  return uniqueList(flattenValues(resolved.serviceSpecializations));
}

function extractFreelancerIndustries(serviceProject = {}, freelancer = {}) {
  const resolved =
    serviceProject && typeof serviceProject === "object" ? serviceProject : {};
  const industries = [
    ...flattenValues(resolved.industriesOrNiches),
    ...flattenValues(freelancer?.profileDetails?.globalIndustryFocus),
    ...flattenValues(freelancer?.profileDetails?.globalIndustryOther),
  ];
  return uniqueList(industries);
}

function buildMatchReasons({ scores, matchedTechnologies, requirements, budgetMeta }) {
  const reasons = [];

  if (scores.technology >= 0.6 && matchedTechnologies.length) {
    reasons.push(
      `Strong technology fit: ${matchedTechnologies.slice(0, 3).join(", ")}`,
    );
  }

  if (scores.specialization >= 0.6 && requirements.specializations.length) {
    reasons.push(
      `Specialization aligned with ${requirements.specializations
        .slice(0, 2)
        .join(" and ")}`,
    );
  }

  if (scores.relevance >= 0.6) {
    reasons.push("Requirements align with skills, services, and portfolio keywords");
  }

  if (scores.budget >= 0.8 && requirements.budget) {
    if (budgetMeta?.priceRange) {
      reasons.push(`Service pricing (${budgetMeta.priceRange}) aligns with your budget`);
    } else {
      reasons.push("Budget range aligns with your project scope");
    }
  }

  if (scores.industry >= 0.6 && requirements.industries.length) {
    reasons.push(
      `Relevant industry experience in ${requirements.industries
        .slice(0, 2)
        .join(" / ")}`,
    );
  }

  if (scores.portfolio >= 0.6) {
    reasons.push("Portfolio includes similar project signals");
  }

  if (scores.rating >= 0.7) {
    reasons.push("Strong rating and review profile");
  }

  if (!reasons.length) {
    reasons.push("General profile fit based on available project details");
  }

  return reasons.slice(0, 3);
}

function computeScoreForProject(freelancer, serviceProject, requirements) {
  const resolvedServiceProject =
    serviceProject && typeof serviceProject === "object" ? serviceProject : {};
  const technology = scoreTechnologyMatch(
    requirements,
    freelancer,
    resolvedServiceProject,
  );
  const specialization = scoreSpecializationMatch(
    requirements.specializations,
    extractFreelancerServiceSpecializations(resolvedServiceProject),
  );
  const industry = scoreIndustryMatch(
    requirements.industries,
    extractFreelancerIndustries(resolvedServiceProject, freelancer),
  );
  const relevance = scoreRequirementRelevance(
    requirements,
    freelancer,
    resolvedServiceProject,
  );
  const resolvedPriceRange = resolveServicePriceRange(
    freelancer,
    resolvedServiceProject,
    requirements,
  );
  const budget = evaluateBudgetMatch(requirements.budget, resolvedPriceRange);
  const experience = scoreExperience(
    resolvedServiceProject?.yearsOfExperienceInService,
    requirements.complexity,
    freelancer?.experienceYears,
  );
  const complexity = scoreComplexityFit(
    resolvedServiceProject?.projectComplexityLevel,
    requirements.complexity,
  );
  const rating = scoreRating(freelancer?.rating, freelancer?.reviewCount);
  const portfolio = scorePortfolioRelevance(
    freelancer?.freelancerProjects,
    requirements,
  );

  const scores = {
    technology: technology.raw,
    specialization,
    industry,
    relevance,
    budget: budget.raw,
    experience,
    complexity,
    rating,
    portfolio,
  };

  const weights = resolveWeights(requirements);
  const breakdown = {};
  let totalScore = 0;

  Object.entries(weights).forEach(([dimension, weight]) => {
    const raw = scores[dimension] ?? 0;
    const weighted = raw * weight;
    totalScore += weighted;
    breakdown[dimension] = {
      raw: rounded(raw, 4),
      weighted: rounded(weighted, 2),
      weight: rounded(weight, 2),
    };
  });

  const matchReasons = buildMatchReasons({
    scores,
    matchedTechnologies: technology.matchedTechnologies,
    requirements,
    budgetMeta: budget,
  });

  const matchHighlights = uniqueList([
    ...technology.matchedTechnologies.slice(0, 3),
    ...requirements.specializations.slice(0, 2),
    ...requirements.industries.slice(0, 1),
  ]).slice(0, 5);

  const matchedServiceKey = normalizeServiceKey(
    resolvedServiceProject?.serviceKey ||
      resolvedServiceProject?.serviceName ||
      requirements.serviceKey,
  );
  const techHardFilterPassed =
    !requirements.technologyCanonicals.length || technology.matchedCount > 0;
  const budgetHardFilterPassed = !budget.hardRejected;

  return {
    totalScore: Math.round(totalScore),
    breakdown,
    matchedTechnologies: technology.matchedTechnologies,
    matchReasons,
    matchHighlights,
    techMatch: {
      requiredCount: technology.requiredCount,
      matchedCount: technology.matchedCount,
      coverage: rounded(technology.raw, 4),
      fullMatch: technology.isFullMatch,
    },
    budgetCompatibility: {
      score: rounded(budget.raw, 4),
      withinRange: budget.withinRange,
      hardRejected: budget.hardRejected,
      priceRange: budget.priceRange,
      range: budget.range,
    },
    matchedService: {
      serviceKey: matchedServiceKey || null,
      serviceName: resolvedServiceProject?.serviceName || null,
      averageProjectPriceRange: budget.priceRange || null,
    },
    hardFilters: {
      technology: techHardFilterPassed,
      budget: budgetHardFilterPassed,
      passed: techHardFilterPassed && budgetHardFilterPassed,
    },
  };
}

function getServiceProjectsForRequirement(freelancer, serviceKey) {
  const projects = Array.isArray(freelancer?.freelancerProjects)
    ? freelancer.freelancerProjects
    : [];
  if (!serviceKey) return projects;
  return projects.filter((project) => {
    const key = normalizeServiceKey(project?.serviceKey || project?.serviceName);
    return key === serviceKey;
  });
}

function freelancerMatchesService(freelancer, serviceKey) {
  if (!serviceKey) return true;

  const services = [
    ...flattenValues(freelancer?.services),
    ...flattenValues(freelancer?.profileDetails?.services),
    ...flattenValues(
      freelancer?.freelancerProjects?.map((project) => project?.serviceKey),
    ),
  ]
    .map((entry) => normalizeServiceKey(entry))
    .filter(Boolean);

  return services.some((entry) => entry === serviceKey);
}

function isEligibleByAvailability(freelancer, requirements) {
  if (!requirements.isOngoingProject) return true;
  const serviceProjects = getServiceProjectsForRequirement(
    freelancer,
    requirements.serviceKey,
  );
  if (!serviceProjects.length) return true;
  return serviceProjects.some(
    (project) =>
      String(project?.acceptInProgressProjects || "").toLowerCase() === "yes",
  );
}

function buildCandidatePool(freelancers, requirements) {
  const normalized = Array.isArray(freelancers) ? freelancers.filter(Boolean) : [];
  if (!normalized.length) return [];

  const strict = normalized.filter((freelancer) => {
    const status = String(freelancer?.status || "").toUpperCase();
    const onboardingReady = freelancer?.onboardingComplete === true;
    const verified = freelancer?.isVerified === true;
    return (
      ALLOWED_STATUSES.has(status) &&
      onboardingReady &&
      verified &&
      freelancerMatchesService(freelancer, requirements.serviceKey) &&
      isEligibleByAvailability(freelancer, requirements)
    );
  });

  if (strict.length >= 3) return strict;

  const serviceMatched = normalized.filter((freelancer) =>
    freelancerMatchesService(freelancer, requirements.serviceKey),
  );
  if (serviceMatched.length >= 3) return serviceMatched;

  const verifiedCandidates = normalized.filter(
    (freelancer) => freelancer?.isVerified === true,
  );
  if (verifiedCandidates.length) return verifiedCandidates;

  return normalized;
}

export function extractMatchingRequirements(proposal = {}) {
  const proposalText = [proposal?.summary, proposal?.content]
    .filter(Boolean)
    .join("\n");
  const fields = parseLabeledFields(proposalText);
  const context =
    proposal?.proposalContext && typeof proposal.proposalContext === "object"
      ? proposal.proposalContext
      : {};
  const bySlug =
    context?.questionnaireAnswersBySlug &&
    typeof context.questionnaireAnswersBySlug === "object"
      ? context.questionnaireAnswersBySlug
      : {};
  const byQuestion =
    context?.questionnaireAnswers && typeof context.questionnaireAnswers === "object"
      ? context.questionnaireAnswers
      : {};
  const capturedFields = Array.isArray(context?.capturedFields)
    ? context.capturedFields
    : [];
  const appHints =
    context?.appHints && typeof context.appHints === "object"
      ? context.appHints
      : null;

  const technologies = extractTechnologies({
    proposal,
    proposalText,
    fields,
    bySlug,
    byQuestion,
    capturedFields,
    appHints,
  });
  const specializations = extractSpecializations({
    proposalText,
    fields,
    bySlug,
    byQuestion,
    capturedFields,
  });
  const industries = extractIndustries({
    proposalText,
    fields,
    bySlug,
    byQuestion,
    capturedFields,
  });
  const requirementKeywords = extractRequirementKeywords({
    proposal,
    proposalText,
    fields,
    bySlug,
    byQuestion,
    capturedFields,
  });

  const budget = extractBudget({ proposal, fields, bySlug, byQuestion, capturedFields });
  const timelineMonths = extractTimeline({
    proposal,
    fields,
    bySlug,
    byQuestion,
    capturedFields,
  });
  const complexityHint = extractComplexityHint({
    proposal,
    fields,
    bySlug,
    byQuestion,
    capturedFields,
  });
  const featureCount = extractFeatureCount(proposalText, proposal);
  const complexity = inferProjectComplexity({
    budget,
    timelineMonths,
    featureCount,
    hint: complexityHint,
  });

  return {
    serviceKey: extractServiceKey({
      proposal,
      context,
      fields,
      bySlug,
      byQuestion,
      capturedFields,
    }),
    technologies: technologies.labels,
    technologyCanonicals: technologies.canonicals,
    specializations,
    industries,
    requirementKeywords,
    budget,
    timelineMonths,
    complexity,
    isOngoingProject: isOngoingProject({
      fields,
      bySlug,
      byQuestion,
      capturedFields,
    }),
  };
}

function compareScoredVariants(a, b) {
  if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;

  const techMatchCountDiff =
    safeNumber(b?.techMatch?.matchedCount, 0) -
    safeNumber(a?.techMatch?.matchedCount, 0);
  if (techMatchCountDiff !== 0) return techMatchCountDiff;

  const techCoverageDiff =
    safeNumber(b?.techMatch?.coverage, 0) - safeNumber(a?.techMatch?.coverage, 0);
  if (techCoverageDiff !== 0) return techCoverageDiff;

  const budgetScoreDiff =
    safeNumber(b?.budgetCompatibility?.score, 0) -
    safeNumber(a?.budgetCompatibility?.score, 0);
  if (budgetScoreDiff !== 0) return budgetScoreDiff;

  return 0;
}

function prioritizeByTechCoverage(scoredFreelancers, requirements) {
  if (!requirements?.technologyCanonicals?.length) {
    return scoredFreelancers;
  }

  const techMatched = scoredFreelancers.filter(
    (freelancer) => safeNumber(freelancer?.techMatch?.matchedCount, 0) > 0,
  );
  if (!techMatched.length) return [];

  const fullMatches = techMatched.filter(
    (freelancer) => freelancer?.techMatch?.fullMatch === true,
  );

  if (fullMatches.length > 0) {
    return fullMatches;
  }

  return techMatched;
}

export function rankFreelancersForProposal(freelancers = [], proposal = null) {
  if (!Array.isArray(freelancers) || freelancers.length === 0) return [];
  const requirements = extractMatchingRequirements(proposal || {});
  const candidates = buildCandidatePool(freelancers, requirements);
  const scoringPool = candidates.length ? candidates : freelancers;

  const scoredFreelancers = scoringPool
    .map((freelancer) => {
      const serviceProjects = getServiceProjectsForRequirement(
        freelancer,
        requirements.serviceKey,
      );
      const projectVariants = serviceProjects.length ? serviceProjects : [null];

      const scoredVariants = projectVariants
        .map((serviceProject) =>
          computeScoreForProject(
            freelancer,
            serviceProject,
            requirements,
          ),
        )
        .filter((variant) => variant?.hardFilters?.passed);

      if (!scoredVariants.length) return null;
      scoredVariants.sort(compareScoredVariants);
      const bestResult = scoredVariants[0];

      return {
        ...freelancer,
        matchScore: bestResult?.totalScore || 0,
        matchBreakdown: bestResult?.breakdown || {},
        matchedTechnologies: bestResult?.matchedTechnologies || [],
        matchReasons: bestResult?.matchReasons || [],
        matchHighlights: bestResult?.matchHighlights || [],
        techMatch: bestResult?.techMatch || {
          requiredCount: 0,
          matchedCount: 0,
          coverage: 0,
          fullMatch: false,
        },
        budgetCompatibility: bestResult?.budgetCompatibility || {
          score: 0,
          withinRange: false,
          hardRejected: false,
          priceRange: null,
          range: null,
        },
        matchedService: bestResult?.matchedService || {
          serviceKey: requirements.serviceKey || null,
          serviceName: null,
          averageProjectPriceRange: null,
        },
        matchHardFilters: bestResult?.hardFilters || {
          technology: false,
          budget: false,
          passed: false,
        },
      };
    })
    .filter(Boolean);

  const filteredByTechCoverage = prioritizeByTechCoverage(
    scoredFreelancers,
    requirements,
  );

  return filteredByTechCoverage
    .sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;

      const techCoverageDiff =
        safeNumber(b?.techMatch?.coverage, 0) - safeNumber(a?.techMatch?.coverage, 0);
      if (techCoverageDiff !== 0) return techCoverageDiff;

      const budgetScoreDiff =
        safeNumber(b?.budgetCompatibility?.score, 0) -
        safeNumber(a?.budgetCompatibility?.score, 0);
      if (budgetScoreDiff !== 0) return budgetScoreDiff;

      const ratingDiff = safeNumber(b.rating, 0) - safeNumber(a.rating, 0);
      if (ratingDiff !== 0) return ratingDiff;

      return safeNumber(b.reviewCount, 0) - safeNumber(a.reviewCount, 0);
    })
    .map((freelancer) => ({
      ...freelancer,
      matchScore: Math.round(safeNumber(freelancer.matchScore, 0)),
    }));
}
