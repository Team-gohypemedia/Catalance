const SKILL_ACRONYMS = new Set([
  "ai",
  "api",
  "cms",
  "crm",
  "css",
  "db",
  "erp",
  "gsc",
  "ml",
  "orm",
  "seo",
  "sql",
  "ui",
  "ux"
]);

const SKILL_NOISE_EXACT = new Set([
  "yes",
  "no",
  "open",
  "other",
  "individual",
  "agency",
  "part time",
  "part_time",
  "beginner",
  "intermediate",
  "advanced",
  "small",
  "medium",
  "large",
  "full execution",
  "partial contribution",
  "team project",
  "not set",
  "english",
  "hindi",
  "spanish",
  "french",
  "german",
  "mandarin chinese",
  "chinese",
  "arabic",
  "bengali",
  "portuguese",
  "russian",
  "japanese",
  "punjabi",
  "telugu",
  "marathi",
  "tamil",
  "urdu",
  "gujarati",
  "kannada",
  "malayalam",
  "italian"
]);

const SKILL_NOISE_WORDS = new Set([
  "hype",
  "media",
  "student",
  "build",
  "commerce",
  "sites",
  "portfolio",
  "apps",
  "powered"
]);

const SKILL_NOISE_PATTERNS = [
  /\b(inr|usd|eur|lakh|lakhs|crore)\b/i,
  /\b(under|over|within|less than|more than)\b/i,
  /\b(hours?|weeks?|months?|years?)\b/i,
  /\b(price|pricing|budget|timeline|cost)\b/i,
  /^\d+(\s*[-–]\s*\d+)?$/,
  /^\d+\s+\d+$/
];

const TECH_HINT_TOKENS = [
  "react",
  "next",
  "node",
  "express",
  "nest",
  "typescript",
  "javascript",
  "python",
  "django",
  "flask",
  "fastapi",
  "java",
  "spring",
  "php",
  "laravel",
  "ruby",
  "rails",
  "go",
  "rust",
  "swift",
  "kotlin",
  "mongodb",
  "postgres",
  "mysql",
  "sqlite",
  "redis",
  "sql",
  "prisma",
  "graphql",
  "rest",
  "api",
  "tailwind",
  "shadcn",
  "figma",
  "adobe",
  "photoshop",
  "illustrator",
  "shopify",
  "wordpress",
  "webflow",
  "framer",
  "vercel",
  "cloudflare",
  "aws",
  "gcp",
  "azure",
  "docker",
  "kubernetes",
  "seo",
  "ahrefs",
  "semrush",
  "gsc",
  "analytics",
  "ga4",
  "crm",
  "erp",
  "salesforce",
  "hubspot",
  "zapier",
  "n8n",
  "make",
  "resend",
  "stack"
];

const TECH_GROUP_KEY_PATTERN =
  /(tech|tool|stack|platform|framework|library|integration|crm|tracking|database)/i;

const parseCustomValues = (value = "") =>
  String(value || "")
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean);

export const formatSkillLabel = (value) => {
  const raw = String(value ?? "")
    .replace(/[_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!raw) return "";

  return raw
    .split(" ")
    .map((token) => {
      const normalized = token.toLowerCase();
      if (SKILL_ACRONYMS.has(normalized)) {
        return normalized.toUpperCase();
      }
      if (/^[a-z0-9]+$/i.test(token)) {
        return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
      }
      return token;
    })
    .join(" ");
};

const getSkillDedupKey = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const normalizeSkillKey = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const hasTechHint = (label = "") => {
  const normalized = normalizeSkillKey(label);
  if (!normalized) return false;
  return TECH_HINT_TOKENS.some((token) => normalized.includes(token));
};

const isNoiseSkillLabel = (label = "") => {
  const normalized = normalizeSkillKey(label);
  if (!normalized) return true;
  if (SKILL_NOISE_EXACT.has(normalized)) return true;
  if (SKILL_NOISE_PATTERNS.some((pattern) => pattern.test(normalized))) return true;

  const words = normalized.split(" ");
  if (words.length === 1 && SKILL_NOISE_WORDS.has(words[0])) {
    return true;
  }

  return false;
};

const shouldKeepSkillLabel = (label, { strictTech = false } = {}) => {
  if (isNoiseSkillLabel(label)) return false;
  if (strictTech && !hasTechHint(label)) return false;
  return true;
};

const extractSkillCandidate = (entry) => {
  if (typeof entry === "string") return entry;
  if (typeof entry === "number") return String(entry);
  if (!entry || typeof entry !== "object") return "";

  if (typeof entry.name === "string") return entry.name;
  if (typeof entry.label === "string") return entry.label;
  if (typeof entry.value === "string") return entry.value;

  return "";
};

const appendSkillValues = (targetMap, value, options) => {
  const candidate = extractSkillCandidate(value);
  if (!candidate) return;

  parseCustomValues(candidate).forEach((token) => {
    const label = formatSkillLabel(token);
    if (!shouldKeepSkillLabel(label, options)) return;

    const key = getSkillDedupKey(label);
    if (!key || targetMap.has(key)) return;
    targetMap.set(key, label);
  });
};

export const normalizeSkills = (
  skills,
  { strictTech = false, max = 80 } = {}
) => {
  if (!Array.isArray(skills)) return [];

  const uniqueSkills = new Map();
  skills.forEach((entry) => appendSkillValues(uniqueSkills, entry, { strictTech }));

  return Array.from(uniqueSkills.values()).slice(0, max);
};

const collectTechGroupValues = (groups = {}) => {
  if (!groups || typeof groups !== "object") return [];

  const values = [];
  Object.entries(groups).forEach(([groupKey, groupValue]) => {
    if (!TECH_GROUP_KEY_PATTERN.test(String(groupKey || ""))) return;

    if (Array.isArray(groupValue)) {
      values.push(...groupValue);
      return;
    }

    if (typeof groupValue === "string") {
      values.push(...parseCustomValues(groupValue));
    }
  });

  return values;
};

export const extractSkillsFromProfileDetails = (
  profileDetails = {},
  { strictTech = true, max = 80 } = {}
) => {
  if (!profileDetails || typeof profileDetails !== "object") return [];

  const serviceDetails =
    profileDetails.serviceDetails && typeof profileDetails.serviceDetails === "object"
      ? profileDetails.serviceDetails
      : {};

  const collected = [];
  if (profileDetails.identity?.professionalTitle) {
    collected.push(profileDetails.identity.professionalTitle);
  }

  Object.values(serviceDetails).forEach((detail) => {
    if (!detail || typeof detail !== "object") return;

    collected.push(...collectTechGroupValues(detail.groups));
    collected.push(...collectTechGroupValues(detail.groupOther));

    const caseStudy = detail.caseStudy || {};
    if (Array.isArray(caseStudy.techStack)) {
      collected.push(...caseStudy.techStack);
    }
    if (typeof caseStudy.techStackOther === "string") {
      collected.push(...parseCustomValues(caseStudy.techStackOther));
    }

    const projects = Array.isArray(detail.projects) ? detail.projects : [];
    projects.forEach((project) => {
      if (!project || typeof project !== "object") return;
      if (Array.isArray(project.techStack)) {
        collected.push(...project.techStack);
      }
    });
  });

  return normalizeSkills(collected, { strictTech, max });
};
