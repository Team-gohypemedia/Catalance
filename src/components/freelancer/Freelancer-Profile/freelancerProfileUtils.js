export const getBioTextFromObject = (obj) => {
  if (!obj || typeof obj !== "object") return "";
  const textKeys = ["bio", "about", "description", "summary", "text"];
  for (const key of textKeys) {
    if (typeof obj[key] === "string" && obj[key].trim()) {
      return obj[key];
    }
  }
  const fallback = Object.values(obj).find(
    (value) => typeof value === "string" && value.trim()
  );
  return fallback || "";
};

export const normalizeBioValue = (value) => {
  if (!value) return "";
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (
      trimmed.startsWith("{") &&
      trimmed.endsWith("}") &&
      trimmed.length > 2
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed === "string") {
          return parsed;
        }
        if (typeof parsed === "object" && parsed !== null) {
          return getBioTextFromObject(parsed);
        }
      } catch {
        // fall through and return the raw string
      }
    }
    if (
      trimmed.startsWith("[") &&
      trimmed.endsWith("]") &&
      trimmed.length > 2
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.join(" ").trim();
        }
      } catch {
        //
      }
    }
    return value;
  }
  if (typeof value === "object") {
    return getBioTextFromObject(value);
  }
  return String(value);
};

export const TECH_TAG_ACRONYMS = new Set([
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
  "ux",
]);

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
      if (TECH_TAG_ACRONYMS.has(normalized)) {
        return normalized.toUpperCase();
      }
      if (/^[a-z0-9]+$/i.test(token)) {
        return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
      }
      return token;
    })
    .join(" ");
};

export const getSkillDedupKey = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

export const SKILL_NOISE_VALUES = new Set([
  "yes",
  "no",
  "open",
  "other",
  "not set",
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
  "english",
  "hindi",
  "spanish",
  "french",
  "german",
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
  "italian",
  "hype",
  "media",
  "student",
  "build",
  "commerce",
  "sites",
  "portfolio",
  "apps",
  "powered",
]);

export const SKILL_NOISE_PATTERNS = [
  /\b(inr|usd|eur|lakh|lakhs|crore)\b/i,
  /\b(under|over|within|less than|more than)\b/i,
  /\b(hours?|weeks?|months?|years?)\b/i,
  /\b(price|pricing|budget|timeline|cost)\b/i,
  /^\d+(\s*-\s*\d+)?$/,
  /^\d+\s+\d+$/,
];

export const isNoisySkillTag = (value) => {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return true;
  if (SKILL_NOISE_VALUES.has(normalized)) return true;
  return SKILL_NOISE_PATTERNS.some((pattern) => pattern.test(normalized));
};

export const MIN_SKILL_LEVEL = 1;
export const MAX_SKILL_LEVEL = 10;
export const DEFAULT_SKILL_LEVEL = 6;
export const SKILL_LEVEL_OPTIONS = Object.freeze(
  Array.from({ length: MAX_SKILL_LEVEL }, (_, index) => index + MIN_SKILL_LEVEL)
);

const LEGACY_SKILL_LEVEL_MAP = Object.freeze({
  beginner: 3,
  intermediate: DEFAULT_SKILL_LEVEL,
  expert: 9,
  advanced: 9,
});

export const normalizeSkillLevel = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(MAX_SKILL_LEVEL, Math.max(MIN_SKILL_LEVEL, Math.round(value)));
  }

  const raw = String(value || "")
    .trim()
    .toLowerCase();

  if (Object.prototype.hasOwnProperty.call(LEGACY_SKILL_LEVEL_MAP, raw)) {
    return LEGACY_SKILL_LEVEL_MAP[raw];
  }

  const parsed = raw.match(/\b(10|[1-9])\b/);
  if (parsed) {
    return Math.min(MAX_SKILL_LEVEL, Math.max(MIN_SKILL_LEVEL, Number(parsed[1])));
  }

  return DEFAULT_SKILL_LEVEL;
};

export const formatSkillLevelLabel = (value) => `${normalizeSkillLevel(value)}/10`;

export const normalizeSkillLevelMap = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce((acc, [key, level]) => {
    const normalizedKey = getSkillDedupKey(key);
    if (!normalizedKey) return acc;
    acc[normalizedKey] = normalizeSkillLevel(level);
    return acc;
  }, {});
};

export const toUniqueSkillNames = (rawSkills = []) => {
  const deduped = new Map();

  (Array.isArray(rawSkills) ? rawSkills : []).forEach((entry) => {
    const source =
      typeof entry === "string"
        ? entry
        : typeof entry?.name === "string"
          ? entry.name
          : String(entry ?? "");
    const label = formatSkillLabel(source);
    if (!label) return;

    const key = getSkillDedupKey(label);
    if (!key || deduped.has(key)) return;
    deduped.set(key, label);
  });

  return Array.from(deduped.values());
};

export const toUniqueSkillObjects = (rawSkills = [], fallbackLevelMap = {}) => {
  const rawLevelMap = (Array.isArray(rawSkills) ? rawSkills : []).reduce(
    (acc, entry) => {
      if (!entry || typeof entry !== "object") return acc;

      const normalizedName = formatSkillLabel(entry.name);
      const key = getSkillDedupKey(normalizedName);
      if (!key) return acc;

      acc[key] = normalizeSkillLevel(
        entry.level || entry.proficiency || entry.experienceLevel
      );
      return acc;
    },
    {}
  );
  const normalizedFallbackLevelMap = normalizeSkillLevelMap(fallbackLevelMap);

  return toUniqueSkillNames(rawSkills)
    .filter((name) => !isNoisySkillTag(name))
    .map((name) => {
      const key = getSkillDedupKey(name);
      const level =
        rawLevelMap[key] ||
        normalizedFallbackLevelMap[key] ||
        DEFAULT_SKILL_LEVEL;
      return { name, level };
    });
};

export const buildSkillLevelsByKey = (rawSkills = []) =>
  toUniqueSkillObjects(rawSkills).reduce((acc, skill) => {
    const key = getSkillDedupKey(skill.name);
    if (!key) return acc;
    acc[key] = normalizeSkillLevel(skill.level);
    return acc;
  }, {});

export const buildLocationFromIdentity = (identity = {}) => {
  if (!identity || typeof identity !== "object") return "";

  const city = String(identity.city || "").trim();
  const country = String(identity.country || "").trim();
  return [city, country].filter(Boolean).join(", ");
};

export const resolveAvatarUrl = (value, { allowBlob = false } = {}) => {
  if (!value) return "";
  if (typeof value === "string") {
    const url = value.trim();
    if (!url) return "";
    if (!allowBlob && url.startsWith("blob:")) return "";
    return url;
  }
  if (typeof value === "object") {
    return resolveAvatarUrl(
      value.uploadedUrl || value.url || value.src || value.value || "",
      { allowBlob }
    );
  }
  return "";
};

export const EXPERIENCE_VALUE_LABELS = {
  less_than_1: "Less than 1 year",
  "1_3": "1-3 years",
  "3_5": "3-5 years",
  "5_plus": "5+ years",
};

export const ONBOARDING_ROLE_LABELS = {
  individual: "Individual Freelancer",
  agency: "Agency / Studio",
  part_time: "Part-Time Freelancer",
};

export const HOURS_PER_WEEK_LABELS = {
  less_than_10: "Less than 10 hours/week",
  "10_20": "10-20 hours/week",
  "20_30": "20-30 hours/week",
  "30_plus": "30+ hours/week",
};

export const normalizeValueLabel = (value) => {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const normalized = raw.toLowerCase();
  const canonical = normalized
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (EXPERIENCE_VALUE_LABELS[canonical]) {
    return EXPERIENCE_VALUE_LABELS[canonical];
  }
  if (normalized === "yes") return "Yes";
  if (normalized === "no") return "No";
  if (normalized === "true") return "Yes";
  if (normalized === "false") return "No";
  if (normalized === "open") return "Open to all";

  return formatSkillLabel(raw);
};

export const formatHoursPerWeekLabel = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const canonical = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (HOURS_PER_WEEK_LABELS[canonical]) {
    return HOURS_PER_WEEK_LABELS[canonical];
  }

  const normalized = normalizeValueLabel(raw);
  if (!normalized) return "";

  if (/^(\d+)\s+plus$/i.test(normalized)) {
    const [, hours] = normalized.match(/^(\d+)\s+plus$/i) || [];
    return hours ? `${hours}+ hours/week` : normalized;
  }

  if (/^\d+\s*-\s*\d+$/.test(normalized)) {
    return `${normalized} hours/week`;
  }

  if (/\bhours?\b/i.test(normalized)) {
    return normalized;
  }

  return normalized;
};

export const normalizePresenceLink = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^[a-z]+:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return "";
  return `https://${raw}`;
};

export const normalizeProjectLinkValue = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    return new URL(withProtocol).toString();
  } catch {
    return withProtocol;
  }
};

export const hasTextValue = (value) => {
  if (typeof value === "boolean") {
    return true;
  }

  return String(value || "").trim().length > 0;
};

export const collectOnboardingPlatformLinks = (serviceDetailMap = {}) =>
  Object.values(serviceDetailMap)
    .flatMap((detail) => {
      if (!detail || typeof detail !== "object") return [];
      const links =
        detail.platformLinks && typeof detail.platformLinks === "object"
          ? detail.platformLinks
          : {};
      return Object.entries(links).map(([key, url]) => ({
        key: String(key || "").toLowerCase().trim(),
        url: normalizePresenceLink(url),
      }));
    })
    .filter((entry) => entry.url);

export const isPortfolioLikeKey = (key = "") =>
  key.includes("portfolio") ||
  key.includes("website") ||
  key.includes("liveproject") ||
  key.includes("projectlink") ||
  key === "github";

export const parseDelimitedValues = (value = "") =>
  String(value || "")
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean);

export const toUniqueLabels = (values = []) =>
  toUniqueSkillNames(values.map((entry) => normalizeValueLabel(entry)));

export const collectServiceSpecializations = (detail = {}) => {
  const collected = [];
  const directSkills = Array.isArray(detail?.skillsAndTechnologies)
    ? detail.skillsAndTechnologies
    : [];
  const caseStudyTechStack = Array.isArray(detail?.caseStudy?.techStack)
    ? detail.caseStudy.techStack
    : [];

  collected.push(...directSkills);
  collected.push(...caseStudyTechStack);

  const groups =
    detail?.groups && typeof detail.groups === "object" ? detail.groups : {};
  Object.values(groups).forEach((entry) => {
    if (Array.isArray(entry)) {
      collected.push(...entry);
    }
  });

  const groupOther =
    detail?.groupOther && typeof detail.groupOther === "object"
      ? detail.groupOther
      : {};
  Object.values(groupOther).forEach((entry) => {
    if (Array.isArray(entry)) {
      collected.push(...entry);
      return;
    }
    if (typeof entry === "string") {
      collected.push(...parseDelimitedValues(entry));
    }
  });

  return toUniqueLabels(collected);
};

export const splitExperienceTitle = (title = "") => {
  const raw = String(title || "").trim();
  if (!raw) return ["", ""];

  const parts = raw.split(/\s(?:-|\u00B7|\u2022)\s/);
  if (parts.length >= 2) {
    return [parts[0].trim(), parts.slice(1).join(" - ").trim()];
  }

  return [raw, ""];
};

export const splitExperiencePeriod = (period = "") => {
  const raw = String(period || "").trim();
  if (!raw) return ["", ""];

  const parts = raw.split(/\s(?:-|\u2013)\s/);
  if (parts.length >= 2) {
    return [parts[0].trim(), parts.slice(1).join(" - ").trim()];
  }

  return [raw, ""];
};

export const normalizeWorkExperienceEntries = (entries = []) =>
  (Array.isArray(entries) ? entries : [])
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const title = String(entry.title || "").trim();
      const period = String(entry.period || "").trim();
      const description = String(entry.description || "").trim();
      const location = String(entry.location || "").trim();
      const locationType = String(entry.locationType || "").trim();
      const employmentType = String(entry.employmentType || "").trim();
      const companyWebsite = normalizePresenceLink(
        entry.companyWebsite || entry.website || ""
      );
      const linkedinUrl = normalizePresenceLink(
        entry.linkedinUrl || entry.linkedin || ""
      );
      if (
        !title &&
        !period &&
        !description &&
        !location &&
        !locationType &&
        !employmentType &&
        !companyWebsite &&
        !linkedinUrl
      ) {
        return null;
      }
      return {
        title,
        period,
        description,
        location,
        locationType,
        employmentType,
        companyWebsite,
        linkedinUrl,
      };
    })
    .filter(Boolean);

export const initialWorkForm = {
  company: "",
  position: "",
  from: "",
  to: "",
  startMonth: "",
  startYear: "",
  endMonth: "",
  endYear: "",
  isCurrentRole: true,
  location: "",
  locationType: "",
  employmentType: "",
  companyWebsite: "",
  linkedinUrl: "",
  description: "",
};

export const MONTH_OPTIONS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const EMPLOYMENT_TYPE_OPTIONS = [
  "Full-time",
  "Part-time",
  "Contract",
  "Freelance",
  "Internship",
  "Temporary",
];

export const LOCATION_TYPE_OPTIONS = ["On-site", "Remote", "Hybrid"];

export const YEAR_OPTIONS = Array.from({ length: 71 }, (_, index) =>
  String(new Date().getFullYear() + 2 - index)
).filter((year) => Number(year) >= 1960);

export const parseMonthYearParts = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return { month: "", year: "" };

  const tokens = raw.split(/\s+/);
  const candidateYear = tokens.at(-1);
  const year = /^\d{4}$/.test(candidateYear || "") ? candidateYear : "";
  const monthToken = (year ? tokens.slice(0, -1) : tokens).join(" ").trim();

  if (!monthToken) {
    return { month: "", year };
  }

  const normalizedMonthToken = monthToken.toLowerCase().slice(0, 3);
  const matchedMonth =
    MONTH_OPTIONS.find((month) =>
      month.toLowerCase().startsWith(normalizedMonthToken)
    ) || "";

  return {
    month: matchedMonth || monthToken,
    year,
  };
};

export const buildMonthYearLabel = (month, year) => {
  const normalizedMonth = String(month || "").trim();
  const normalizedYear = String(year || "").trim();

  if (!normalizedMonth || !normalizedYear) return "";
  return `${normalizedMonth} ${normalizedYear}`;
};

export const createEmptyEducationEntry = () => ({
  school: "",
  degree: "",
  field: "",
  country: "",
  startMonth: "",
  startYear: "",
  endMonth: "",
  endYear: "",
  graduationYear: "",
  grade: "",
  activities: "",
});

export const collectEducationEntriesFromProfileDetails = (details = {}) => {
  const profile = details && typeof details === "object" ? details : {};
  const identity =
    profile.identity && typeof profile.identity === "object"
      ? profile.identity
      : {};

  const candidateLists = [
    profile.education,
    profile.educationHistory,
    identity.education,
    identity.educationHistory,
  ].filter(Array.isArray);

  const normalized = candidateLists
    .flatMap((entries) => entries)
    .map((entry) => {
      if (!entry) return null;
      if (typeof entry === "string") {
        const school = String(entry).trim();
        if (!school) return null;
        return {
          school,
          degree: "",
          field: "",
          country: "",
          startMonth: "",
          startYear: "",
          endMonth: "",
          endYear: "",
          graduationYear: "",
          grade: "",
          activities: "",
        };
      }

      if (typeof entry !== "object") return null;

      const school = String(
        entry.school ||
        entry.institution ||
        entry.university ||
        entry.college ||
        entry.name ||
        ""
      ).trim();
      const degree = String(
        entry.degree || entry.qualification || entry.program || ""
      ).trim();
      const field = String(
        entry.field ||
        entry.specialization ||
        entry.stream ||
        entry.focus ||
        entry.subject ||
        ""
      ).trim();
      const country = String(entry.country || entry.location || "").trim();
      const startDateParts = parseMonthYearParts(
        entry.startDate || entry.from || entry.start || ""
      );
      const endDateParts = parseMonthYearParts(
        entry.endDate || entry.to || entry.end || entry.graduationDate || ""
      );
      const endYearFromLegacy = String(
        entry.graduationYear || entry.endYear || entry.year || ""
      ).trim();
      const endYear = String(endDateParts.year || endYearFromLegacy).trim();
      const graduationYear = String(
        entry.graduationYear || endYear || ""
      ).trim();
      const grade = String(entry.grade || entry.score || entry.gpa || "").trim();
      const activities = String(
        entry.activities || entry.activitiesAndSocieties || entry.description || ""
      ).trim();

      if (
        !school &&
        !degree &&
        !field &&
        !country &&
        !startDateParts.month &&
        !startDateParts.year &&
        !endDateParts.month &&
        !endYear &&
        !grade &&
        !activities
      ) {
        return null;
      }

      return {
        school,
        degree,
        field,
        country,
        startMonth: String(startDateParts.month || "").trim(),
        startYear: String(startDateParts.year || "").trim(),
        endMonth: String(endDateParts.month || "").trim(),
        endYear,
        graduationYear,
        grade,
        activities,
      };
    })
    .filter(Boolean);

  return normalized.length > 0 ? normalized : [createEmptyEducationEntry()];
};

export const normalizeEducationEntriesForSave = (entries = []) =>
  (Array.isArray(entries) ? entries : [])
    .map((entry) => {
      const school = String(entry?.school || "").trim();
      const degree = String(entry?.degree || "").trim();
      const field = String(entry?.field || "").trim();
      const country = String(entry?.country || "").trim();
      const startMonth = String(entry?.startMonth || "").trim();
      const startYear = String(entry?.startYear || "").trim();
      const endMonth = String(entry?.endMonth || "").trim();
      const endYear = String(entry?.endYear || entry?.graduationYear || "").trim();
      const grade = String(entry?.grade || "").trim();
      const activities = String(entry?.activities || "").trim();
      const startDate = buildMonthYearLabel(startMonth, startYear);
      const endDate = buildMonthYearLabel(endMonth, endYear);

      return {
        school,
        degree,
        field,
        country,
        startMonth,
        startYear,
        endMonth,
        endYear,
        graduationYear: endYear,
        startDate,
        endDate,
        from: startDate,
        to: endDate,
        grade,
        activities,
      };
    })
    .filter(
      (entry) =>
        entry.school ||
        entry.degree ||
        entry.field ||
        entry.country ||
        entry.startMonth ||
        entry.startYear ||
        entry.endMonth ||
        entry.endYear ||
        entry.grade ||
        entry.activities
    );

export const createInitialFullProfileForm = () => ({
  professionalTitle: "",
  username: "",
  country: "",
  city: "",
  languages: "",
  otherLanguage: "",
  role: "",
  globalIndustryFocus: "",
  globalIndustryOther: "",
  hoursPerWeek: "",
  workingSchedule: "",
  startTimeline: "",
  missedDeadlines: "",
  delayHandling: "",
  deliveryPolicyAccepted: false,
  communicationPolicyAccepted: false,
  acceptInProgressProjects: "",
  termsAccepted: false,
  professionalBio: "",
  education: [createEmptyEducationEntry()],
});

export const PERSONAL_EDITOR_SECTIONS = Object.freeze({
  ALL: "all",
  ABOUT: "about",
});

export const FULL_PROFILE_EDITOR_SECTIONS = Object.freeze({
  ALL: "all",
  WORK_PREFERENCES: "workPreferences",
  INDUSTRY_FOCUS: "industryFocus",
  EDUCATION: "education",
});

