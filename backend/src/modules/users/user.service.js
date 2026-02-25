import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/app-error.js";
import { extractBioText } from "../../utils/bio-utils.js";
import {
  normalizeSkills,
  extractSkillsFromProfileDetails
} from "../../utils/skill-utils.js";
import { env } from "../../config/env.js";
import { ensureResendClient } from "../../lib/resend.js";
import { hashPassword, verifyPassword, verifyLegacyPassword } from "./password.utils.js";
import {
  generatePasswordResetEmail,
  generatePasswordResetTextEmail
} from "../../lib/email-templates/password-reset.template.js";

const OTP_TTL_MINUTES = 15;
const OTP_EMAIL_RETRY_ATTEMPTS = 2;
const marketplaceSupportsServiceDetails = (() => {
  try {
    const models = Prisma?.dmmf?.datamodel?.models || [];
    const marketplaceModel = models.find((model) => model.name === "Marketplace");
    return Boolean(
      marketplaceModel?.fields?.some((field) => field?.name === "serviceDetails")
    );
  } catch {
    return false;
  }
})();
const marketplaceSupportsServiceKey = (() => {
  try {
    const models = Prisma?.dmmf?.datamodel?.models || [];
    const marketplaceModel = models.find((model) => model.name === "Marketplace");
    return Boolean(
      marketplaceModel?.fields?.some((field) => field?.name === "serviceKey")
    );
  } catch {
    return false;
  }
})();
const supportsFreelancerProfileModel = (() => {
  try {
    const models = Prisma?.dmmf?.datamodel?.models || [];
    return models.some((model) => model?.name === "FreelancerProfile");
  } catch {
    return false;
  }
})();
const USER_SAFE_SCALAR_SELECT = Object.freeze({
  id: true,
  email: true,
  fullName: true,
  phoneNumber: true,
  passwordHash: true,
  role: true,
  roles: true,
  status: true,
  resetPasswordToken: true,
  resetPasswordExpires: true,
  fcmToken: true,
  otpCode: true,
  otpExpires: true,
  onboardingComplete: true,
  isVerified: true,
  suspendedAt: true,
  phone: true,
  avatar: true,
  createdAt: true,
  updatedAt: true
});

const withFreelancerProfileInclude = (query = {}) => {
  if (!supportsFreelancerProfileModel) return query;
  if (query?.select) {
    if (Object.prototype.hasOwnProperty.call(query.select, "freelancerProfile")) {
      return query;
    }

    return {
      ...query,
      select: {
        ...query.select,
        freelancerProfile: true
      }
    };
  }

  const include = query?.include && typeof query.include === "object" ? query.include : {};
  const { include: _include, ...rest } = query;

  return {
    ...rest,
    select: {
      ...USER_SAFE_SCALAR_SELECT,
      ...include,
      freelancerProfile:
        include.freelancerProfile === undefined ? true : include.freelancerProfile
    }
  };
};

const FREELANCER_PROFILE_FIELD_KEYS = new Set([
  "bio",
  "skills",
  "jobTitle",
  "companyName",
  "location",
  "rating",
  "reviewCount",
  "experienceYears",
  "workExperience",
  "services",
  "portfolio",
  "linkedin",
  "github",
  "portfolioProjects",
  "resume",
  "profileDetails"
]);

const pickFreelancerProfileUpdates = (updates = {}) =>
  Object.entries(updates).reduce((acc, [key, value]) => {
    if (FREELANCER_PROFILE_FIELD_KEYS.has(key)) {
      acc[key] = value;
    }
    return acc;
  }, {});

const resolveFreelancerProfileDetails = (user = null) => {
  if (!user || typeof user !== "object") return {};

  const relatedProfileDetails = user?.freelancerProfile?.profileDetails;
  if (
    relatedProfileDetails &&
    typeof relatedProfileDetails === "object" &&
    !Array.isArray(relatedProfileDetails)
  ) {
    return relatedProfileDetails;
  }

  const legacyProfileDetails = user?.profileDetails;
  if (
    legacyProfileDetails &&
    typeof legacyProfileDetails === "object" &&
    !Array.isArray(legacyProfileDetails)
  ) {
    return legacyProfileDetails;
  }

  return {};
};

const resolveFreelancerProfileRecord = (user = null) => {
  if (!user || typeof user !== "object") {
    return {
      skills: [],
      services: [],
      portfolioProjects: [],
      workExperience: [],
      reviewCount: 0,
      rating: 0,
      experienceYears: 0,
      profileDetails: {}
    };
  }

  const relation =
    user.freelancerProfile && typeof user.freelancerProfile === "object"
      ? user.freelancerProfile
      : {};
  const read = (key) =>
    relation[key] !== undefined ? relation[key] : user[key];

  const skills = Array.isArray(read("skills")) ? read("skills") : [];
  const services = Array.isArray(read("services")) ? read("services") : [];
  const portfolioProjects = Array.isArray(read("portfolioProjects"))
    ? read("portfolioProjects")
    : [];
  const workExperienceRaw = read("workExperience");
  const workExperience = Array.isArray(workExperienceRaw) ? workExperienceRaw : [];
  const reviewCountRaw = read("reviewCount");
  const experienceYearsRaw = read("experienceYears");

  return {
    bio: read("bio") ?? null,
    skills,
    jobTitle: read("jobTitle") ?? null,
    companyName: read("companyName") ?? null,
    location: read("location") ?? null,
    rating: read("rating") ?? 0,
    reviewCount: Number.isFinite(Number(reviewCountRaw)) ? Number(reviewCountRaw) : 0,
    experienceYears: Number.isFinite(Number(experienceYearsRaw))
      ? Number(experienceYearsRaw)
      : 0,
    workExperience,
    services,
    portfolio: read("portfolio") ?? null,
    linkedin: read("linkedin") ?? null,
    github: read("github") ?? null,
    portfolioProjects,
    resume: read("resume") ?? null,
    profileDetails: resolveFreelancerProfileDetails(user)
  };
};

const upsertFreelancerProfile = async ({ userId, updates = {} }) => {
  if (!supportsFreelancerProfileModel || !userId) return;

  const profileUpdates = pickFreelancerProfileUpdates(updates);
  if (!Object.keys(profileUpdates).length) return;

  if (Object.prototype.hasOwnProperty.call(profileUpdates, "profileDetails")) {
    const normalizedProfileDetails =
      profileUpdates.profileDetails &&
      typeof profileUpdates.profileDetails === "object" &&
      !Array.isArray(profileUpdates.profileDetails)
        ? profileUpdates.profileDetails
        : {};
    profileUpdates.profileDetails = normalizedProfileDetails;
  }

  try {
    await prisma.freelancerProfile.upsert({
      where: { userId },
      update: profileUpdates,
      create: { userId, ...profileUpdates }
    });
  } catch (error) {
    console.warn(
      `[FreelancerProfile] Unable to upsert profile for user ${userId}:`,
      error?.message || error
    );
  }
};

const syncFreelancerProfileDetails = async ({ userId, profileDetails }) =>
  upsertFreelancerProfile({
    userId,
    updates: { profileDetails }
  });

const normalizeRoleValue = (value) =>
  typeof value === "string" ? value.toUpperCase() : null;

const hasRole = (user, role) => {
  const targetRole = normalizeRoleValue(role);
  if (!targetRole) return false;

  const primaryRole = normalizeRoleValue(user?.role);
  if (primaryRole === targetRole) return true;

  const roles = Array.isArray(user?.roles)
    ? user.roles.map((entry) => normalizeRoleValue(entry)).filter(Boolean)
    : [];

  return roles.includes(targetRole);
};

const normalizeGoogleAuthMode = (value) => {
  const normalized = typeof value === "string" ? value.toLowerCase().trim() : "";
  return normalized === "signup" ? "signup" : "login";
};

const parseBooleanFilter = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return undefined;

  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) return true;
  if (["false", "0", "no"].includes(normalized)) return false;

  return undefined;
};

const normalizeProjectLink = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
};

const normalizePortfolioProjects = (projects) => {
  if (!Array.isArray(projects)) return [];

  const projectMap = new Map();

  projects.forEach((entry, index) => {
    const project =
      entry && typeof entry === "object" ? entry : { title: String(entry || "") };
    const title = String(project.title || "").trim();
    const link = normalizeProjectLink(project.link || project.url || "");
    const readme = normalizeProjectLink(
      project.readme || project.readmeUrl || project.readmeLink || ""
    );
    const image = String(project.image || "").trim() || null;

    if (!title && !link && !readme) return;

    const dedupKey = link
      ? link.toLowerCase()
      : readme
        ? readme.toLowerCase()
      : `${title.toLowerCase()}:${index}`;
    if (projectMap.has(dedupKey)) return;

    projectMap.set(dedupKey, {
      ...project,
      title: title || "Project",
      link,
      readme,
      image
    });
  });

  return Array.from(projectMap.values()).slice(0, 24);
};

const buildLocationFromIdentity = (identity = {}) => {
  if (!identity || typeof identity !== "object") return "";

  const city = String(identity.city || "").trim();
  const country = String(identity.country || "").trim();
  return [city, country].filter(Boolean).join(", ");
};

const buildJobTitleFromIdentity = (identity = {}) => {
  if (!identity || typeof identity !== "object") return "";
  return String(identity.professionalTitle || "").trim();
};

const extractAvatarUrl = (value) => {
  if (!value) return null;

  if (typeof value === "string") {
    const url = value.trim();
    if (!url || url.startsWith("blob:")) return null;
    return url;
  }

  if (typeof value === "object") {
    return extractAvatarUrl(
      value.uploadedUrl || value.url || value.src || value.value || null
    );
  }

  return null;
};

const USERNAME_REGEX = /^[a-z0-9]{3,20}$/;

const LEGACY_FREELANCER_SERVICE_KEY_MAP = {
  website_uiux: "web_development",
  website_ui_ux: "web_development",
  website_ui_ux_design_2d_3d: "web_development",
  website_ui_ux_design: "web_development",
  "web-development": "web_development"
};

const normalizeLegacyFreelancerServiceKey = (value = "") => {
  const canonical = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!canonical) return "";
  return LEGACY_FREELANCER_SERVICE_KEY_MAP[canonical] || canonical;
};

const normalizeUsername = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase();

const normalizeFreelancerProfileDetails = (profileDetails) => {
  if (!profileDetails || typeof profileDetails !== "object") return {};

  const nextProfileDetails = { ...profileDetails };
  if (!nextProfileDetails.identity || typeof nextProfileDetails.identity !== "object") {
    return nextProfileDetails;
  }

  const nextIdentity = { ...nextProfileDetails.identity };
  if (Object.prototype.hasOwnProperty.call(nextIdentity, "username")) {
    const normalizedUsername = normalizeUsername(nextIdentity.username);
    if (normalizedUsername && !USERNAME_REGEX.test(normalizedUsername)) {
      throw new AppError(
        "Username must be 3-20 characters and contain only lowercase letters and numbers.",
        400
      );
    }
    nextIdentity.username = normalizedUsername;
  }

  nextProfileDetails.identity = nextIdentity;

  if (Array.isArray(nextProfileDetails.services)) {
    nextProfileDetails.services = normalizeStringList(
      nextProfileDetails.services.map((serviceKey) =>
        normalizeLegacyFreelancerServiceKey(serviceKey)
      ),
      { max: 64 }
    );
  }

  if (
    nextProfileDetails.serviceDetails &&
    typeof nextProfileDetails.serviceDetails === "object"
  ) {
    const nextServiceDetails = {};
    Object.entries(nextProfileDetails.serviceDetails).forEach(([serviceKey, detail]) => {
      const normalizedKey = normalizeLegacyFreelancerServiceKey(serviceKey);
      if (!normalizedKey) return;

      if (!Object.prototype.hasOwnProperty.call(nextServiceDetails, normalizedKey)) {
        nextServiceDetails[normalizedKey] = detail;
        return;
      }

      if (
        detail &&
        typeof detail === "object" &&
        Object.keys(detail).length &&
        (!nextServiceDetails[normalizedKey] ||
          !Object.keys(nextServiceDetails[normalizedKey]).length)
      ) {
        nextServiceDetails[normalizedKey] = detail;
      }
    });
    nextProfileDetails.serviceDetails = nextServiceDetails;
  }

  return nextProfileDetails;
};

const normalizeLabel = (value = "") =>
  String(value || "")
    .replace(/[_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const toTitleCaseLabel = (value = "") =>
  normalizeLabel(value)
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const EXPERIENCE_VALUE_LABELS = {
  less_than_1: "Less than 1 year",
  "1_3": "1-3 years",
  "3_5": "3-5 years",
  "5_plus": "5+ years"
};

const normalizeOnboardingValueLabel = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const canonical = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (EXPERIENCE_VALUE_LABELS[canonical]) {
    return EXPERIENCE_VALUE_LABELS[canonical];
  }

  return normalizeLabel(raw);
};

const normalizeOnboardingWorkExperienceTitle = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const onboardingMatch = raw.match(/^(.*?)[^a-z0-9]+onboarding$/i);
  if (!onboardingMatch) return raw;

  const baseRaw = String(onboardingMatch[1] || "").trim();
  const canonical = baseRaw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const normalizedTitle = getMarketplaceServiceTitle(canonical || baseRaw);

  return `${normalizedTitle} - Onboarding`;
};

const normalizeStringList = (value, { max = 32 } = {}) => {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .map((entry) => String(entry || "").trim())
        .filter(Boolean)
    )
  ).slice(0, max);
};

const normalizeOptionalProjectUrl = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw || raw.startsWith("blob:")) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^[a-z]+:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return raw;
  return `https://${raw}`;
};

const normalizeBudgetValue = (value) => {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }

  const raw = String(value).trim().toLowerCase();
  if (!raw) return null;

  let multiplier = 1;
  let numericPart = raw;
  if (raw.endsWith("k")) {
    multiplier = 1000;
    numericPart = raw.slice(0, -1);
  } else if (raw.endsWith("m")) {
    multiplier = 1000000;
    numericPart = raw.slice(0, -1);
  }

  const normalized = numericPart.replace(/[^0-9.]+/g, "");
  if (!normalized) return null;

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * multiplier);
};

const TECH_GROUP_KEY_REGEX = /(tech_stack|tools|platforms|technology|tech)/i;

const normalizeOptionalText = (value) => {
  const normalized = String(value ?? "").trim();
  return normalized || null;
};

const parseCommaSeparatedValues = (value = "") =>
  String(value || "")
    .split(/[,\n]/)
    .map((entry) => String(entry || "").trim())
    .filter(Boolean);

const removeOtherOption = (values = []) =>
  values.filter((entry) => String(entry || "").trim().toLowerCase() !== "other");

const collectGroupValues = (groupMap = {}, keyPattern = null) => {
  if (!groupMap || typeof groupMap !== "object") return [];

  const values = [];
  Object.entries(groupMap).forEach(([groupKey, rawValue]) => {
    if (keyPattern && !keyPattern.test(groupKey)) return;

    if (Array.isArray(rawValue)) {
      values.push(...rawValue);
      return;
    }

    if (typeof rawValue === "string") {
      values.push(...parseCommaSeparatedValues(rawValue));
    }
  });

  return values;
};

const extractLanguagesFromIdentity = (identity = {}) => {
  const selected = Array.isArray(identity?.languages) ? identity.languages : [];
  const withoutOther = removeOtherOption(selected);
  const otherLanguage = normalizeOptionalText(identity?.otherLanguage);

  return normalizeStringList(
    otherLanguage ? [...withoutOther, otherLanguage] : withoutOther,
    { max: 24 }
  );
};

const extractIndustriesOrNiches = (profileDetails = {}) => {
  const selected = Array.isArray(profileDetails?.globalIndustryFocus)
    ? profileDetails.globalIndustryFocus
    : [];
  const withoutOther = removeOtherOption(selected);
  const otherIndustry = normalizeOptionalText(profileDetails?.globalIndustryOther);

  return normalizeStringList(
    otherIndustry ? [...withoutOther, otherIndustry] : withoutOther,
    { max: 80 }
  );
};

const extractServiceSpecializations = (detail = {}) => {
  const groupSelections = collectGroupValues(detail?.groups);
  const groupOtherSelections = collectGroupValues(detail?.groupOther);
  const nicheSelections = Array.isArray(detail?.niches) ? detail.niches : [];
  const otherNiche = normalizeOptionalText(detail?.otherNiche);

  return normalizeStringList(
    [
      ...removeOtherOption(groupSelections),
      ...groupOtherSelections,
      ...removeOtherOption(nicheSelections),
      ...(otherNiche ? [otherNiche] : [])
    ],
    { max: 120 }
  );
};

const extractServiceTechnologies = (detail = {}) => {
  const techFromGroups = collectGroupValues(detail?.groups, TECH_GROUP_KEY_REGEX);
  const techFromGroupOther = collectGroupValues(
    detail?.groupOther,
    TECH_GROUP_KEY_REGEX
  );
  const techFromCaseStudy = Array.isArray(detail?.caseStudy?.techStack)
    ? detail.caseStudy.techStack
    : [];
  const techFromCaseStudyOther = parseCommaSeparatedValues(
    detail?.caseStudy?.techStackOther
  );
  const techFromProjects = Array.isArray(detail?.projects)
    ? detail.projects.flatMap((project) =>
        Array.isArray(project?.techStack) ? project.techStack : []
      )
    : [];

  return normalizeStringList(
    [
      ...removeOtherOption(techFromGroups),
      ...techFromGroupOther,
      ...removeOtherOption(techFromCaseStudy),
      ...techFromCaseStudyOther,
      ...removeOtherOption(techFromProjects)
    ],
    { max: 120 }
  );
};

const buildFreelancerProjectOnboardingSnapshot = ({
  profileDetails = {},
  detail = {}
} = {}) => {
  const identity =
    profileDetails?.identity && typeof profileDetails.identity === "object"
      ? profileDetails.identity
      : {};

  return {
    professionalTitle: normalizeOptionalText(identity?.professionalTitle),
    languages: extractLanguagesFromIdentity(identity),
    industriesOrNiches: extractIndustriesOrNiches(profileDetails),
    yearsOfExperienceInService: normalizeOptionalText(detail?.experienceYears),
    serviceSpecializations: extractServiceSpecializations(detail),
    activeTechnologies: extractServiceTechnologies(detail),
    averageProjectPriceRange: normalizeOptionalText(
      detail?.averageProjectPrice || detail?.averagePrice
    ),
    projectComplexityLevel: normalizeOptionalText(detail?.projectComplexity),
    acceptInProgressProjects: normalizeOptionalText(
      profileDetails?.acceptInProgressProjects
    )
  };
};

const normalizeFreelancerProjectEntries = ({
  entries,
  serviceKey = null,
  serviceName = null,
  sharedFields = {},
  startSortOrder = 0
}) => {
  const projectMap = new Map();
  let sortOrder = startSortOrder;

  (Array.isArray(entries) ? entries : []).forEach((entry, index) => {
    const project =
      entry && typeof entry === "object" ? entry : { title: String(entry || "") };
    const title = String(project.title || "").trim();
    const description = String(project.description || "").trim() || null;
    const link = normalizeOptionalProjectUrl(project.link || project.url || "");
    const readme = normalizeOptionalProjectUrl(
      project.readme || project.readmeUrl || project.readmeLink || ""
    );
    const fileName = String(project?.file?.name || project.fileName || "").trim() || null;
    const fileUrl = normalizeOptionalProjectUrl(project?.file?.url || project.fileUrl || "");
    const role = String(project.role || "").trim() || null;
    const timeline = String(project.timeline || "").trim() || null;
    const budget = normalizeBudgetValue(project.budget);
    const tags = normalizeStringList(project.tags, { max: 24 });
    const techStack = normalizeStringList(project.techStack, { max: 40 });

    if (!title && !description && !link && !readme && !tags.length && !techStack.length) {
      return;
    }

    const resolvedTitle =
      title || `${serviceName || "Portfolio"} Project ${index + 1}`;
    const dedupKey = link
      ? `link:${link.toLowerCase()}`
      : readme
        ? `readme:${readme.toLowerCase()}`
      : `${String(serviceKey || "general").toLowerCase()}:${resolvedTitle.toLowerCase()}:${index}`;

    if (projectMap.has(dedupKey)) {
      return;
    }

    projectMap.set(dedupKey, {
      serviceKey: serviceKey || null,
      serviceName: serviceName || null,
      ...sharedFields,
      title: resolvedTitle,
      description,
      link,
      readme,
      fileName,
      fileUrl,
      role,
      timeline,
      budget,
      tags,
      techStack,
      sortOrder
    });

    sortOrder += 1;
  });

  return {
    projects: Array.from(projectMap.values()),
    nextSortOrder: sortOrder
  };
};

const extractFreelancerProjectsFromProfileDetails = (profileDetails = {}) => {
  const serviceDetails =
    profileDetails && typeof profileDetails === "object"
      ? profileDetails.serviceDetails
      : null;

  if (!serviceDetails || typeof serviceDetails !== "object") {
    return [];
  }

  const projects = [];
  let sortOrder = 0;

  Object.entries(serviceDetails).forEach(([serviceKey, detail]) => {
    const entries = Array.isArray(detail?.projects) ? detail.projects : [];
    if (!entries.length) return;

    const normalizedServiceKey = String(serviceKey || "").trim() || null;
    const serviceName = getMarketplaceServiceTitle(normalizedServiceKey || "") || null;
    const sharedFields = buildFreelancerProjectOnboardingSnapshot({
      profileDetails,
      detail
    });
    const normalized = normalizeFreelancerProjectEntries({
      entries,
      serviceKey: normalizedServiceKey,
      serviceName,
      sharedFields,
      startSortOrder: sortOrder
    });

    projects.push(...normalized.projects);
    sortOrder = normalized.nextSortOrder;
  });

  return projects.slice(0, 80);
};

const extractFreelancerProjectsFromPortfolio = (portfolioProjects = []) => {
  const normalized = normalizeFreelancerProjectEntries({
    entries: portfolioProjects,
    startSortOrder: 0
  });
  return normalized.projects.slice(0, 80);
};

const deriveFreelancerProjects = ({
  profileDetails,
  portfolioProjects
}) => {
  const fromProfile = extractFreelancerProjectsFromProfileDetails(profileDetails);
  if (fromProfile.length) return fromProfile;
  return extractFreelancerProjectsFromPortfolio(portfolioProjects);
};

const normalizeMarketplaceServiceIdentifier = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const MARKETPLACE_SERVICE_KEY_ALIASES = {
  website_uiux: "web_development",
  website_ui_ux: "web_development",
  website_ui_ux_design_2d_3d: "web_development",
  website_ui_ux_design: "web_development",
  web_development: "web_development",
  web_development_design_2d_3d: "web_development",
  web_development_design: "web_development",
  web_development_ui_ux: "web_development",
  web_development_uiux: "web_development",
  web_development_ui_ux_design: "web_development",
  web_development_ui_ux_design_2d_3d: "web_development",
  web_development_uiux_design_2d_3d: "web_development",
  web_development_uiux_design: "web_development",
  "web-development": "web_development"
};

const toMarketplaceStorageServiceKey = (serviceKey = "") =>
  resolveMarketplaceServiceKey(serviceKey);

const resolveMarketplaceServiceKey = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const canonical = normalizeMarketplaceServiceIdentifier(raw);
  if (!canonical) return "";

  const aliased = MARKETPLACE_SERVICE_KEY_ALIASES[canonical] || canonical;

  if (Object.prototype.hasOwnProperty.call(MARKETPLACE_SERVICE_META_BY_KEY, aliased)) {
    return aliased;
  }

  for (const [serviceKey, meta] of Object.entries(MARKETPLACE_SERVICE_META_BY_KEY)) {
    const titleCanonical = normalizeMarketplaceServiceIdentifier(meta?.title || "");
    if (titleCanonical && titleCanonical === aliased) {
      return serviceKey;
    }
  }

  return aliased;
};

const normalizeMarketplaceServiceKeys = (value, { max = 64 } = {}) =>
  normalizeStringList(
    Array.isArray(value) ? value.map((entry) => resolveMarketplaceServiceKey(entry)) : [],
    { max }
  );

const hasMeaningfulServiceDetailValue = (value) => {
  if (value === null || value === undefined) return false;

  if (typeof value === "string") {
    return String(value).trim().length > 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.some((entry) => hasMeaningfulServiceDetailValue(entry));
  }

  if (typeof value === "object") {
    return Object.values(value).some((entry) =>
      hasMeaningfulServiceDetailValue(entry)
    );
  }

  return false;
};

const deriveMarketplaceServices = ({
  profileDetails,
  services
} = {}) => {
  const explicitServices = Array.isArray(services) ? services : [];
  const profileServices = Array.isArray(profileDetails?.services)
    ? profileDetails.services
    : [];
  const serviceDetailsEntries =
    profileDetails?.serviceDetails &&
    typeof profileDetails.serviceDetails === "object"
      ? Object.entries(profileDetails.serviceDetails)
      : [];
  const serviceDetailsKeys = serviceDetailsEntries
    .filter(([, detail]) => hasMeaningfulServiceDetailValue(detail))
    .map(([serviceKey]) => serviceKey);
  const preferredSources = [...explicitServices, ...profileServices];

  return normalizeMarketplaceServiceKeys(
    preferredSources.length ? preferredSources : serviceDetailsKeys,
    { max: 64 }
  );
};

const MARKETPLACE_SERVICE_META_BY_KEY = {
  branding: {
    title: "Branding",
    description: "Build logo, brand identity, and strategic messaging for consistent brand growth.",
    coverImage: "/assets/services/branding-cover.jpg"
  },
  web_development: {
    title: "Web Development",
    description: "Design and develop responsive, high-converting websites and landing pages.",
    coverImage: "/assets/services/web-development-cover.jpg"
  },
  seo: {
    title: "SEO",
    description: "Improve visibility with technical SEO, content optimization, and keyword strategy.",
    coverImage: "/assets/services/seo-cover.jpg"
  },
  social_media_marketing: {
    title: "Social Media Management",
    description: "Plan and execute social content, engagement, and platform growth campaigns.",
    coverImage: "/assets/services/social-media-cover.jpg"
  },
  paid_advertising: {
    title: "Performance Marketing / Paid Ads",
    description: "Run ROI-focused ad campaigns across major paid media platforms.",
    coverImage: "/assets/services/paid-ads-cover.jpg"
  },
  app_development: {
    title: "App Development",
    description: "Build scalable mobile apps with strong UX and reliable backend integrations.",
    coverImage: "/assets/services/app-development-cover.jpg"
  },
  software_development: {
    title: "Software Development",
    description: "Develop custom software, APIs, and systems tailored to business workflows.",
    coverImage: "/assets/services/software-development-cover.jpg"
  },
  lead_generation: {
    title: "Lead Generation",
    description: "Generate and qualify leads through outbound, funnels, and CRM workflows.",
    coverImage: "/assets/services/lead-generation-cover.jpg"
  },
  video_services: {
    title: "Video Services",
    description: "Produce and edit marketing, social, and branded video content.",
    coverImage: "/assets/services/video-services-cover.jpg"
  },
  writing_content: {
    title: "Writing & Content",
    description: "Create clear, conversion-driven content for web, blogs, and campaigns.",
    coverImage: "/assets/services/writing-content-cover.jpg"
  },
  customer_support: {
    title: "Customer Support Services",
    description: "Deliver multi-channel customer support with quality assurance and SLAs.",
    coverImage: "/assets/services/customer-support-cover.jpg"
  },
  influencer_marketing: {
    title: "Influencer Marketing",
    description: "Plan creator partnerships and campaigns to grow awareness and conversions.",
    coverImage: "/assets/services/influencer-marketing-cover.jpg"
  },
  ugc_marketing: {
    title: "UGC Marketing",
    description: "Create and scale authentic UGC assets for paid and organic channels.",
    coverImage: "/assets/services/ugc-marketing-cover.jpg"
  },
  ai_automation: {
    title: "AI Automation",
    description: "Automate business workflows using AI tools, agents, and integrations.",
    coverImage: "/assets/services/ai-automation-cover.jpg"
  },
  whatsapp_chatbot: {
    title: "WhatsApp Chatbot",
    description: "Build automated WhatsApp conversations for support, sales, and engagement.",
    coverImage: "/assets/services/whatsapp-chatbot-cover.jpg"
  },
  creative_design: {
    title: "Creative & Design",
    description: "Design social, brand, and marketing creatives aligned to business goals.",
    coverImage: "/assets/services/creative-design-cover.jpg"
  },
  "3d_modeling": {
    title: "3D Modeling",
    description: "Create high-quality 3D assets for products, environments, and visualization.",
    coverImage: "/assets/services/3d-modeling-cover.jpg"
  },
  cgi_videos: {
    title: "CGI Video Services",
    description: "Produce CGI animations and visual effects for product and brand storytelling.",
    coverImage: "/assets/services/cgi-videos-cover.jpg"
  },
  crm_erp: {
    title: "CRM & ERP Solutions",
    description: "Implement CRM/ERP systems with automation, reporting, and integrations.",
    coverImage: "/assets/services/crm-erp-cover.jpg"
  },
  voice_agent: {
    title: "Voice Agent / AI Calling",
    description: "Deploy AI voice agents for calls, support, and appointment workflows.",
    coverImage: "/assets/services/voice-agent-cover.jpg"
  }
};

const deriveMarketplaceServiceDetails = ({
  services = [],
  profileDetails = {}
} = {}) => {
  const onboardingServiceDetails =
    profileDetails?.serviceDetails && typeof profileDetails.serviceDetails === "object"
      ? profileDetails.serviceDetails
      : {};

  return normalizeMarketplaceServiceKeys(services, { max: 64 }).map((serviceKey) => {
    const meta = MARKETPLACE_SERVICE_META_BY_KEY[serviceKey];
    const detail =
      onboardingServiceDetails?.[serviceKey] &&
      typeof onboardingServiceDetails[serviceKey] === "object"
        ? onboardingServiceDetails[serviceKey]
        : {};
    const customDescription = String(
      detail?.serviceDescription || detail?.description || ""
    ).trim();
    const customCoverImage = extractAvatarUrl(detail?.coverImage);

    return {
      key: serviceKey,
      title: meta?.title || toTitleCaseLabel(serviceKey),
      description:
        customDescription ||
        meta?.description ||
        "Service information provided during onboarding.",
      coverImage:
        customCoverImage || meta?.coverImage || `/assets/services/${serviceKey}-cover.jpg`
    };
  });
};

const getMarketplaceServiceTitle = (serviceKey = "") => {
  const key = String(serviceKey || "").trim();
  if (!key) return "Service";
  return MARKETPLACE_SERVICE_META_BY_KEY[key]?.title || toTitleCaseLabel(key);
};

const upsertMarketplaceEntry = async ({
  freelancerId,
  services = [],
  profileDetails = {}
} = {}) => {
  if (!freelancerId) return;
  const normalizedServiceKeys = normalizeMarketplaceServiceKeys(services, { max: 64 });
  const marketplaceServices = [];
  const seenStorageKeys = new Set();

  normalizedServiceKeys.forEach((canonicalKey) => {
    const serviceKey = toMarketplaceStorageServiceKey(canonicalKey);
    if (!serviceKey || seenStorageKeys.has(serviceKey)) return;
    seenStorageKeys.add(serviceKey);
    marketplaceServices.push({
      canonicalKey,
      serviceKey,
      serviceTitle: getMarketplaceServiceTitle(canonicalKey)
    });
  });
  const serviceDetails = deriveMarketplaceServiceDetails({
    services: normalizedServiceKeys,
    profileDetails
  });
  const serviceDetailsByKey = new Map(
    serviceDetails
      .filter((detail) => detail && typeof detail === "object")
      .map((detail) => [String(detail.key || "").trim(), detail])
      .filter(([key]) => Boolean(key))
  );

  const runUpsert = async ({ includeServiceDetails, includeServiceKey }) =>
    prisma.$transaction(async (tx) => {
      if (!marketplaceServices.length) {
        await tx.marketplace.deleteMany({
          where: { freelancerId }
        });
        return;
      }

      if (includeServiceKey) {
        await tx.marketplace.deleteMany({
          where: {
            freelancerId,
            serviceKey: {
              notIn: marketplaceServices.map((entry) => entry.serviceKey)
            }
          }
        });
      } else {
        const legacyTitles = normalizeStringList(
          marketplaceServices.map((entry) => entry.serviceTitle),
          { max: 64 }
        );
        await tx.marketplace.deleteMany({
          where: {
            freelancerId,
            service: {
              notIn: legacyTitles
            }
          }
        });
      }

      for (const marketplaceService of marketplaceServices) {
        const { canonicalKey, serviceKey, serviceTitle } = marketplaceService;
        const detail = serviceDetailsByKey.get(canonicalKey) || {
          key: serviceKey,
          title: serviceTitle
        };
        const detailWithStorageKey = {
          ...detail,
          key: serviceKey
        };
        const createData = {
          freelancerId,
          service: serviceTitle,
          isFeatured: false
        };
        const updateData = {
          service: serviceTitle
        };

        if (includeServiceKey) {
          createData.serviceKey = serviceKey;
          updateData.serviceKey = serviceKey;
        }

        if (includeServiceDetails) {
          createData.serviceDetails = detailWithStorageKey;
          updateData.serviceDetails = detailWithStorageKey;
        }

        if (includeServiceKey) {
          await tx.marketplace.upsert({
            where: {
              freelancerId_serviceKey: {
                freelancerId,
                serviceKey
              }
            },
            create: createData,
            update: updateData
          });
        } else {
          await tx.marketplace.upsert({
            where: {
              freelancerId_service: {
                freelancerId,
                service: serviceTitle
              }
            },
            create: createData,
            update: updateData
          });
        }
      }
    });

  if (marketplaceSupportsServiceDetails && marketplaceSupportsServiceKey) {
    try {
      await runUpsert({ includeServiceDetails: true, includeServiceKey: true });
      return;
    } catch (error) {
      const message = String(error?.message || "");
      const shouldRetryWithoutServiceDetails =
        (error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2022") ||
        message.includes("Unknown argument `serviceDetails`") ||
        message.includes("serviceDetails");

      if (!shouldRetryWithoutServiceDetails) {
        throw error;
      }
    }
  }

  if (marketplaceSupportsServiceKey) {
    await runUpsert({ includeServiceDetails: false, includeServiceKey: true });
    return;
  }

  if (marketplaceSupportsServiceDetails) {
    try {
      await runUpsert({ includeServiceDetails: true, includeServiceKey: false });
      return;
    } catch (error) {
      const message = String(error?.message || "");
      const shouldRetryWithoutServiceDetails =
        (error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2022") ||
        message.includes("Unknown argument `serviceDetails`") ||
        message.includes("serviceDetails");

      if (!shouldRetryWithoutServiceDetails) {
        throw error;
      }
    }
  }

  await runUpsert({ includeServiceDetails: false, includeServiceKey: false });
};

const replaceFreelancerProjects = async (freelancerId, projects = []) => {
  if (!freelancerId) return;

  const rows = Array.isArray(projects) ? projects : [];
  await prisma.$transaction(async (tx) => {
    await tx.freelancerProject.deleteMany({
      where: { freelancerId }
    });

    if (!rows.length) {
      return;
    }

    await tx.freelancerProject.createMany({
      data: rows.map((project) => ({
        freelancerId,
        ...project
      }))
    });
  });
};

const normalizeWorkExperienceEntries = (value) => {
  const entries = Array.isArray(value) ? value : [];

  return entries
    .map((entry) => {
      if (typeof entry === "string") {
        const title = entry.trim();
        return title ? { title, period: "", description: "" } : null;
      }

      if (!entry || typeof entry !== "object") return null;
      const title = normalizeOnboardingWorkExperienceTitle(entry.title);
      const period = normalizeOnboardingValueLabel(entry.period);
      const description = String(entry.description || "").trim();

      if (!title && !period && !description) return null;
      return { title, period, description };
    })
    .filter(Boolean);
};

const buildWorkExperienceFromProfileDetails = (profileDetails = {}) => {
  const explicit = normalizeWorkExperienceEntries(profileDetails?.workExperience);
  if (explicit.length) return explicit;

  const serviceDetails =
    profileDetails && typeof profileDetails === "object"
      ? profileDetails.serviceDetails
      : null;
  if (!serviceDetails || typeof serviceDetails !== "object") return [];

  return Object.entries(serviceDetails)
    .map(([serviceKey, detail]) => {
      if (!detail || typeof detail !== "object") return null;

      const experience = normalizeOnboardingValueLabel(detail.experienceYears);
      const level = normalizeLabel(detail.workingLevel);
      const complexity = normalizeLabel(detail.projectComplexity);
      const projectCount = Array.isArray(detail.projects) ? detail.projects.length : 0;

      if (!experience && !level && !complexity && !projectCount) return null;

      const meta = [];
      if (level) meta.push(`Level: ${level}`);
      if (complexity) meta.push(`Complexity: ${complexity}`);
      if (projectCount) {
        meta.push(`${projectCount} onboarding project${projectCount > 1 ? "s" : ""}`);
      }

      return {
        title: `${getMarketplaceServiceTitle(serviceKey)} - Onboarding`,
        period: experience || "Experience shared in onboarding",
        description: meta.join(" | ")
      };
    })
    .filter(Boolean);
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildOtpEmailContent = ({ otpCode, isResend = false }) => ({
  subject: isResend
    ? "Your New Verification Code - Catalance"
    : "Verify Your Email - Catalance",
  html: `<p>Your ${isResend ? "new " : ""}verification code is: <strong>${otpCode}</strong></p><p>This code expires in ${OTP_TTL_MINUTES} minutes.</p>`
});

const sendOtpEmail = async ({ email, otpCode, isResend = false }) => {
  const hasResendConfig = Boolean(env.RESEND_API_KEY && env.RESEND_FROM_EMAIL);

  if (!hasResendConfig) {
    const message =
      "Email service is not configured (missing RESEND_API_KEY or RESEND_FROM_EMAIL).";
    if (env.NODE_ENV === "production") {
      throw new AppError(message, 500, {
        provider: "resend",
        reason: "missing_config"
      });
    }

    console.warn(`[OTP Email] ${message}`);
    console.log(`[DEV] OTP for ${email}: ${otpCode}`);
    return { delivered: false, reason: "missing_config" };
  }

  const resend = ensureResendClient();
  const { subject, html } = buildOtpEmailContent({ otpCode, isResend });
  let lastError = null;

  for (let attempt = 1; attempt <= OTP_EMAIL_RETRY_ATTEMPTS; attempt += 1) {
    try {
      const result = await resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: email,
        subject,
        html
      });

      if (result?.error) {
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : result.error?.message || JSON.stringify(result.error)
        );
      }

      console.log(
        `[OTP Email] Sent to ${email}. Subject: ${subject}. ID: ${result?.data?.id || "n/a"}`
      );
      return { delivered: true, id: result?.data?.id || null };
    } catch (error) {
      lastError = error;
      console.error(
        `[OTP Email] Attempt ${attempt}/${OTP_EMAIL_RETRY_ATTEMPTS} failed:`,
        error?.message || error
      );
      if (attempt < OTP_EMAIL_RETRY_ATTEMPTS) {
        await wait(400);
      }
    }
  }

  throw new AppError(
    "We could not deliver the verification code email. Please try again in a moment.",
    502,
    {
      provider: "resend",
      reason: "delivery_failed",
      cause: lastError?.message || "unknown_error"
    }
  );
};

const ensureUserRoles = async (user, requestedRole) => {
  if (!user) return user;

  const baseRole = normalizeRoleValue(user.role) || "FREELANCER";
  const requested = normalizeRoleValue(requestedRole);
  const existingRoles = Array.isArray(user.roles)
    ? user.roles.map((role) => normalizeRoleValue(role)).filter(Boolean)
    : [];
  const roles = existingRoles.length ? existingRoles : [baseRole];
  const updates = {};

  if (!roles.includes(baseRole)) {
    roles.push(baseRole);
  }

  if (requested && !roles.includes(requested)) {
    roles.push(requested);
    if (requested === "FREELANCER") {
      updates.status = "PENDING_APPROVAL";
      updates.onboardingComplete = false;
    }
  }

  const uniqueRoles = Array.from(new Set(roles));
  const needsRoleUpdate =
    !existingRoles.length ||
    uniqueRoles.length !== existingRoles.length ||
    uniqueRoles.some((entry) => !existingRoles.includes(entry));
  if (needsRoleUpdate) {
    updates.roles = uniqueRoles;
  }

  if (Object.keys(updates).length === 0) {
    return user;
  }

  return prisma.user.update(
    withFreelancerProfileInclude({
      where: { id: user.id },
      data: updates
    })
  );
};

export const listUsers = async (filters = {}) => {
  const onboardingComplete = parseBooleanFilter(filters.onboardingComplete);
  const normalizedRoleFilter = normalizeRoleValue(filters.role);
  const where = {
    status: filters.status || "ACTIVE"
  };

  if (normalizedRoleFilter) {
    where.OR = [
      { role: normalizedRoleFilter },
      { roles: { has: normalizedRoleFilter } }
    ];
  }

  if (onboardingComplete !== undefined) {
    where.onboardingComplete = onboardingComplete;
  }

  const includeFreelancerProjects =
    !normalizedRoleFilter || normalizedRoleFilter === "FREELANCER";

  const include = includeFreelancerProjects
    ? {
        freelancerProjects: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
        }
      }
    : undefined;

  const users = await prisma.user.findMany(
    withFreelancerProfileInclude({
      where,
      include,
      orderBy: {
        createdAt: "desc"
      }
    })
  );

  return users.map(sanitizeUser);
};

export const updateUserProfile = async (userId, updates) => {
  const allowedUpdates = [
    "fullName",
    "phoneNumber",
    "bio",
    "portfolio",
    "linkedin",
    "github",
    "avatar",
    "profileDetails",
    "onboardingComplete",
    "services",
    "skills",
    "portfolioProjects",
    "location"
  ];
  const cleanUpdates = {};

  Object.keys(updates).forEach(key => {
    if (allowedUpdates.includes(key)) {
      // Sanitize bio to plain text even if JSON/object slips in.
      if (key === "bio") {
        cleanUpdates[key] = extractBioText(updates[key]);
      } else if (key === "skills") {
        cleanUpdates[key] = normalizeSkills(updates[key], {
          strictTech: true,
          max: 120
        });
      } else if (key === "avatar") {
        cleanUpdates[key] = extractAvatarUrl(updates[key]);
      } else if (key === "portfolioProjects") {
        cleanUpdates[key] = normalizePortfolioProjects(updates[key]);
      } else if (key === "location") {
        cleanUpdates[key] = String(updates[key] || "").trim() || null;
      } else if (key === "profileDetails") {
        cleanUpdates[key] = normalizeFreelancerProfileDetails(updates[key]);
      } else if (key === "services") {
        cleanUpdates[key] = normalizeMarketplaceServiceKeys(updates[key], {
          max: 64
        });
      } else {
        cleanUpdates[key] = updates[key];
      }
    }
  });

  if (cleanUpdates.profileDetails) {
    const profileDerivedSkills = extractSkillsFromProfileDetails(
      cleanUpdates.profileDetails,
      { strictTech: true, max: 120 }
    );

    if (profileDerivedSkills.length) {
      const mergedSkillCandidates = [
        ...(Array.isArray(cleanUpdates.skills) ? cleanUpdates.skills : []),
        ...profileDerivedSkills
      ];
      cleanUpdates.skills = normalizeSkills(mergedSkillCandidates, {
        strictTech: true,
        max: 120
      });
    }

    if (!Object.prototype.hasOwnProperty.call(cleanUpdates, "services")) {
      cleanUpdates.services = deriveMarketplaceServices({
        profileDetails: cleanUpdates.profileDetails
      });
    }
  }

  if (
    !Object.prototype.hasOwnProperty.call(cleanUpdates, "avatar") &&
    cleanUpdates.profileDetails?.identity
  ) {
    const derivedAvatar = extractAvatarUrl(
      cleanUpdates.profileDetails.identity.profilePhoto
    );
    if (derivedAvatar) {
      cleanUpdates.avatar = derivedAvatar;
    }
  }

  if (
    !Object.prototype.hasOwnProperty.call(cleanUpdates, "location") &&
    cleanUpdates.profileDetails?.identity
  ) {
    const derivedLocation = buildLocationFromIdentity(
      cleanUpdates.profileDetails.identity
    );
    if (derivedLocation) {
      cleanUpdates.location = derivedLocation;
    }
  }

  if (
    !Object.prototype.hasOwnProperty.call(cleanUpdates, "jobTitle") &&
    cleanUpdates.profileDetails?.identity
  ) {
    const derivedJobTitle = buildJobTitleFromIdentity(
      cleanUpdates.profileDetails.identity
    );
    if (derivedJobTitle) {
      cleanUpdates.jobTitle = derivedJobTitle;
    }
  }

  const userUpdateKeys = new Set([
    "fullName",
    "phoneNumber",
    "avatar",
    "onboardingComplete"
  ]);

  const userUpdates = {};
  const freelancerProfileUpdates = {};
  Object.entries(cleanUpdates).forEach(([key, value]) => {
    if (userUpdateKeys.has(key)) {
      userUpdates[key] = value;
      return;
    }
    freelancerProfileUpdates[key] = value;
  });

  const hasProfileDetailsUpdate = Object.prototype.hasOwnProperty.call(
    freelancerProfileUpdates,
    "profileDetails"
  );

  let user = null;
  if (Object.keys(userUpdates).length) {
    user = await prisma.user.update(
      withFreelancerProfileInclude({
        where: { id: userId },
        data: userUpdates
      })
    );
  } else {
    user = await prisma.user.findUnique(
      withFreelancerProfileInclude({
        where: { id: userId }
      })
    );
  }

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (Object.keys(freelancerProfileUpdates).length) {
    await upsertFreelancerProfile({
      userId: user.id,
      updates: freelancerProfileUpdates
    });

    user = await prisma.user.findUnique(
      withFreelancerProfileInclude({
        where: { id: user.id }
      })
    );
  }

  const resolvedFreelancerProfile = resolveFreelancerProfileRecord(user);
  const resolvedProfileDetails = hasProfileDetailsUpdate
    ? freelancerProfileUpdates.profileDetails
    : resolvedFreelancerProfile.profileDetails;
  const resolvedServices = Object.prototype.hasOwnProperty.call(
    freelancerProfileUpdates,
    "services"
  )
    ? freelancerProfileUpdates.services
    : resolvedFreelancerProfile.services;
  const resolvedPortfolioProjects = Object.prototype.hasOwnProperty.call(
    freelancerProfileUpdates,
    "portfolioProjects"
  )
    ? freelancerProfileUpdates.portfolioProjects
    : resolvedFreelancerProfile.portfolioProjects;

  const profileServiceDetails =
    resolvedProfileDetails?.serviceDetails &&
    typeof resolvedProfileDetails.serviceDetails === "object"
      ? resolvedProfileDetails.serviceDetails
      : null;
  const profileServiceCount = profileServiceDetails
    ? Object.keys(profileServiceDetails).length
    : 0;
  const profileRoleSignal = String(resolvedProfileDetails?.role || "")
    .trim()
    .toLowerCase();
  const hasFreelancerIntent =
    profileServiceCount > 0 ||
    (Array.isArray(resolvedServices) && resolvedServices.length > 0) ||
    ["freelancer", "individual", "agency", "part_time", "part-time"].includes(
      profileRoleSignal
    );

  if (hasFreelancerIntent && !hasRole(user, "FREELANCER")) {
    const currentRoles = Array.isArray(user.roles)
      ? user.roles.map((entry) => normalizeRoleValue(entry)).filter(Boolean)
      : [];
    const nextRoles = Array.from(new Set([...currentRoles, "FREELANCER"]));

    user = await prisma.user.update(
      withFreelancerProfileInclude({
        where: { id: user.id },
        data: {
          roles: nextRoles,
          status: "PENDING_APPROVAL"
        }
      })
    );
  }

  const isFreelancerUser = hasRole(user, "FREELANCER");

  const shouldSyncFreelancerProjects =
    isFreelancerUser &&
    (hasProfileDetailsUpdate ||
      Object.prototype.hasOwnProperty.call(freelancerProfileUpdates, "portfolioProjects"));

  if (shouldSyncFreelancerProjects) {
    const normalizedProjects = deriveFreelancerProjects({
      profileDetails: resolvedProfileDetails,
      portfolioProjects: resolvedPortfolioProjects
    });

    await replaceFreelancerProjects(user.id, normalizedProjects);
  }

  const shouldSyncMarketplace =
    isFreelancerUser &&
    (hasProfileDetailsUpdate ||
      Object.prototype.hasOwnProperty.call(freelancerProfileUpdates, "services") ||
      Object.prototype.hasOwnProperty.call(userUpdates, "onboardingComplete"));

  if (shouldSyncMarketplace) {
    const marketplaceServices = deriveMarketplaceServices({
      profileDetails: resolvedProfileDetails,
      services: resolvedServices
    });
    await upsertMarketplaceEntry({
      freelancerId: user.id,
      services: marketplaceServices,
      profileDetails: resolvedProfileDetails
    });
  }

  return sanitizeUser(user);
};

export const createUser = async (payload) => {
  const user = await createUserRecord(payload);
  return sanitizeUser(user);
};

export const registerUser = async (payload) => {
  const otpCode = crypto.randomInt(100000, 999999).toString();
  const otpExpires = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  const user = await createUserRecord({ ...payload, otpCode, otpExpires });
  let otpEmail;
  try {
    otpEmail = await sendOtpEmail({ email: user.email, otpCode });
  } catch (error) {
    await prisma.user.delete({ where: { id: user.id } }).catch((cleanupError) => {
      console.warn(
        `[OTP Email] Failed to cleanup unsent signup user ${user.id}:`,
        cleanupError?.message || cleanupError
      );
    });
    throw error;
  }

  return {
    message: otpEmail?.delivered
      ? "Verification code sent to your email"
      : "Account created. In development mode, use the OTP printed in backend logs.",
    email: user.email,
    userId: user.id,
    emailDelivery: otpEmail?.delivered ? "sent" : "not_sent"
  };
};

export const verifyUserOtp = async ({ email, otp }) => {
  const normalizedEmail = String(email || "").toLowerCase().trim();
  const user = await prisma.user.findUnique(
    withFreelancerProfileInclude({
      where: { email: normalizedEmail }
    })
  );

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.isVerified) {
    // Already verified, just log them in
    return {
      user: sanitizeUser(user),
      accessToken: issueAccessToken(user)
    };
  }

  if (!user.otpCode || !user.otpExpires) {
    throw new AppError("Invalid verification request", 400);
  }

  if (String(user.otpCode) !== String(otp)) {
    throw new AppError("Invalid verification code", 400);
  }

  if (new Date() > new Date(user.otpExpires)) {
    throw new AppError("Verification code expired", 400);
  }

  // Verify user
  const updatedUser = await prisma.user.update(
    withFreelancerProfileInclude({
      where: { id: user.id },
      data: {
        isVerified: true,
        otpCode: null,
        otpExpires: null
      }
    })
  );

  // Send welcome email now that they are verified
  await maybeSendWelcomeEmail(updatedUser);

  return {
    user: sanitizeUser(updatedUser),
    accessToken: issueAccessToken(updatedUser)
  };
};

export const resendOtp = async (email) => {
  const normalizedEmail = String(email || "").toLowerCase().trim();
  const user = await prisma.user.findUnique(
    withFreelancerProfileInclude({
      where: { email: normalizedEmail }
    })
  );

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.isVerified) {
    throw new AppError("Email is already verified", 400);
  }

  // Generate new OTP
  const otpCode = crypto.randomInt(100000, 999999).toString();
  const otpExpires = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  // Update user with new OTP
  await prisma.user.update({
    where: { id: user.id },
    data: {
      otpCode,
      otpExpires
    }
  });

  const otpEmail = await sendOtpEmail({
    email: user.email,
    otpCode,
    isResend: true
  });

  return {
    message: otpEmail?.delivered
      ? "New verification code sent to your email"
      : "In development mode, use the OTP printed in backend logs.",
    emailDelivery: otpEmail?.delivered ? "sent" : "not_sent"
  };
};

export const authenticateUser = async ({ email, password, role }) => {
  const normalizedEmail = String(email || "").toLowerCase().trim();
  const user = await prisma.user.findUnique(
    withFreelancerProfileInclude({
      where: { email: normalizedEmail }
    })
  );

  let isValid =
    user?.passwordHash && password
      ? await verifyPassword(password, user.passwordHash)
      : false;

  if (!isValid && user?.passwordHash && password) {
    const legacyValid = await verifyLegacyPassword(password, user.passwordHash);
    if (legacyValid) {
      isValid = true;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: await hashPassword(password)
        }
      });
    }
  }

  if (!isValid) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isVerified) {
    // Resend OTP for unverified users
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode,
        otpExpires
      }
    });

    const otpEmail = await sendOtpEmail({ email: user.email, otpCode });

    // Return special response indicating verification is needed
    return {
      requiresVerification: true,
      email: user.email,
      message: otpEmail?.delivered
        ? "Please verify your email. A new verification code has been sent."
        : "Please verify your email. In development mode, use the OTP printed in backend logs.",
      emailDelivery: otpEmail?.delivered ? "sent" : "not_sent"
    };
  }

  const updatedUser = await ensureUserRoles(user, role);
  const requestedRole = normalizeRoleValue(role);
  const roles = Array.isArray(updatedUser?.roles)
    ? updatedUser.roles.map((entry) => normalizeRoleValue(entry)).filter(Boolean)
    : [];
  const activeRole = requestedRole && roles.includes(requestedRole)
    ? requestedRole
    : normalizeRoleValue(updatedUser?.role) || "FREELANCER";
  const sessionUser = sanitizeUser({ ...updatedUser, role: activeRole });

  return {
    user: sessionUser,
    accessToken: issueAccessToken(updatedUser, activeRole)
  };
};

export const authenticateWithGoogle = async ({ token, role, mode }) => {
  const { verifyFirebaseToken } = await import("../../lib/firebase-admin.js");
  const normalizedRole = typeof role === "string" ? role.toUpperCase() : null;
  const requestedRole = ["CLIENT", "FREELANCER"].includes(normalizedRole)
    ? normalizedRole
    : null;
  const authMode = normalizeGoogleAuthMode(mode);

  // Verify token with Firebase
  const decodedToken = await verifyFirebaseToken(token);
  const { email, name, picture } = decodedToken;
  const googleAvatar = extractAvatarUrl(picture);

  if (!email) {
    throw new AppError("Google account does not have an email address", 400);
  }
  const normalizedEmail = String(email).toLowerCase().trim();

  // Check if user exists
  let user = await prisma.user.findUnique(
    withFreelancerProfileInclude({
      where: { email: normalizedEmail }
    })
  );

  if (!user) {
    if (authMode !== "signup") {
      throw new AppError(
        "No account found for this Google email. Please sign up first.",
        404
      );
    }

    // Create new user
    // Generate a random password since they use Google auth
    const randomPassword = crypto.randomBytes(16).toString("hex");
    const initialRole = requestedRole || "CLIENT";

    user = await prisma.user.create(
      withFreelancerProfileInclude({
        data: {
          email: normalizedEmail,
          fullName: name || email.split("@")[0],
          passwordHash: await hashUserPassword(randomPassword), // We still set a password to avoid null constraints if any
          role: initialRole, // Default to CLIENT if not specified in request
          roles: [initialRole],
          isVerified: true, // Google users are verified by definition
          avatar: googleAvatar,
          otpCode: null,
          otpExpires: null,
          status: initialRole === "FREELANCER" ? "PENDING_APPROVAL" : "ACTIVE"
        }
      })
    );

    await maybeSendWelcomeEmail(user);
  } else {
    // If user exists but is not verified, verify them since they used Google
    if (!user.isVerified) {
      user = await prisma.user.update(
        withFreelancerProfileInclude({
          where: { id: user.id },
          data: { isVerified: true }
        })
      );
    }

    const currentPrimaryRole = normalizeRoleValue(user.role);
    const allowRequestedRole =
      requestedRole &&
      !["ADMIN", "PROJECT_MANAGER"].includes(currentPrimaryRole || "");
    user = await ensureUserRoles(user, allowRequestedRole ? requestedRole : null);

    const currentProfileDetails = resolveFreelancerProfileDetails(user);
    const existingAvatar =
      extractAvatarUrl(user?.avatar) ||
      extractAvatarUrl(currentProfileDetails?.identity?.profilePhoto);
    if (googleAvatar && !existingAvatar) {
      user = await prisma.user.update(
        withFreelancerProfileInclude({
          where: { id: user.id },
          data: { avatar: googleAvatar }
        })
      );
    }
  }

  const roles = Array.isArray(user?.roles)
    ? user.roles.map((entry) => normalizeRoleValue(entry)).filter(Boolean)
    : [];
  const activeRole = requestedRole && roles.includes(requestedRole)
    ? requestedRole
    : normalizeRoleValue(user?.role) || "FREELANCER";
  const sessionUser = sanitizeUser({ ...user, role: activeRole });

  return {
    user: sessionUser,
    accessToken: issueAccessToken(user, activeRole)
  };
};

export const getUserById = async (id) => {
  const user = await prisma.user.findUnique(
    withFreelancerProfileInclude({
      where: { id }
    })
  );

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return sanitizeUser(user);
};

const createUserRecord = async (payload) => {
  try {
    const normalizedEmail = String(payload.email || "").toLowerCase().trim();
    const normalizedRole = (payload.role || "FREELANCER").toUpperCase();
    const normalizedFreelancerProfile = normalizeFreelancerProfileDetails(
      payload.freelancerProfile
    );
    const explicitLocation = String(payload.location || "").trim();
    const identityLocation = buildLocationFromIdentity(
      normalizedFreelancerProfile?.identity
    );
    const identityJobTitle = buildJobTitleFromIdentity(
      normalizedFreelancerProfile?.identity
    );
    const explicitAvatar = extractAvatarUrl(payload.avatar);
    const identityAvatar = extractAvatarUrl(
      normalizedFreelancerProfile?.identity?.profilePhoto
    );
    const resolvedAvatar = explicitAvatar || identityAvatar || null;
    const resolvedLocation = explicitLocation || identityLocation || null;
    const explicitSkills = normalizeSkills(payload.skills, {
      strictTech: true,
      max: 120
    });
    const profileDerivedSkills = extractSkillsFromProfileDetails(
      normalizedFreelancerProfile,
      { strictTech: true, max: 120 }
    );
    const mergedSkills = normalizeSkills(
      [...explicitSkills, ...profileDerivedSkills],
      { strictTech: true, max: 120 }
    );
    const normalizedPortfolioProjects = normalizePortfolioProjects(
      payload.portfolioProjects
    );
    const normalizedServices = deriveMarketplaceServices({
      profileDetails: normalizedFreelancerProfile,
      services: payload.services
    });
    const normalizedWorkExperience = normalizeWorkExperienceEntries(
      payload.workExperience
    );
    const parsedExperienceYears = Number(payload.experienceYears);
    const normalizedExperienceYears =
      Number.isFinite(parsedExperienceYears) && parsedExperienceYears >= 0
        ? Math.round(parsedExperienceYears)
        : 0;
    const freelancerProfileData = {
      bio: extractBioText(payload.bio),
      skills: mergedSkills,
      jobTitle: identityJobTitle || payload.jobTitle || null,
      companyName: String(payload.companyName || "").trim() || null,
      location: resolvedLocation,
      experienceYears: normalizedExperienceYears,
      workExperience: normalizedWorkExperience,
      services: normalizedServices,
      portfolio: payload.portfolio || null,
      linkedin: payload.linkedin || null,
      github: payload.github || null,
      portfolioProjects: normalizedPortfolioProjects,
      resume: payload.resume || null,
      profileDetails: normalizedFreelancerProfile
    };
    const hasFreelancerProfileData =
      normalizedRole === "FREELANCER" ||
      Object.keys(normalizedFreelancerProfile || {}).length > 0 ||
      Boolean(freelancerProfileData.bio) ||
      freelancerProfileData.skills.length > 0 ||
      freelancerProfileData.services.length > 0 ||
      freelancerProfileData.portfolioProjects.length > 0 ||
      freelancerProfileData.workExperience.length > 0;
    const roles = Array.isArray(payload.roles) && payload.roles.length
      ? Array.from(new Set(payload.roles.map((role) => String(role).toUpperCase())))
      : [normalizedRole];
    const user = await prisma.user.create(
      withFreelancerProfileInclude({
        data: {
          email: normalizedEmail,
          fullName: payload.fullName,
          passwordHash: await hashUserPassword(payload.password),
          role: normalizedRole,
          roles,
          otpCode: payload.otpCode,
          otpExpires: payload.otpExpires,
          isVerified: false,
          status: normalizedRole === "FREELANCER" ? "PENDING_APPROVAL" : "ACTIVE",
          onboardingComplete: payload.onboardingComplete === true,
          avatar: resolvedAvatar,
          freelancerProfile: hasFreelancerProfileData
            ? {
                create: freelancerProfileData
              }
            : undefined
        }
      })
    );

    if (normalizedRole === "FREELANCER") {
      const normalizedProjects = deriveFreelancerProjects({
        profileDetails: normalizedFreelancerProfile,
        portfolioProjects: normalizedPortfolioProjects
      });
      await replaceFreelancerProjects(user.id, normalizedProjects);

      const marketplaceServices = deriveMarketplaceServices({
        profileDetails: normalizedFreelancerProfile,
        services: normalizedServices
      });
      await upsertMarketplaceEntry({
        freelancerId: user.id,
        services: marketplaceServices,
        profileDetails: normalizedFreelancerProfile
      });
    }

    // Don't send welcome email yet, wait for verification
    // await maybeSendWelcomeEmail(user);

    return user;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError("A user with that email already exists", 409);
    }

    throw error;
  }
};

const hashUserPassword = async (password) => {
  if (!password) {
    throw new AppError("Password is required", 400);
  }

  return hashPassword(password);
};

const maybeSendWelcomeEmail = async (user) => {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
    return;
  }

  try {
    const resend = ensureResendClient();
    await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: user.email,
      subject: "Welcome to the Freelancer platform",
      html: `<p>Hi ${user.fullName},</p><p>Thanks for joining the platform as a ${user.role.toLowerCase()}!</p>`
    });
  } catch (emailError) {
    console.warn("Unable to send welcome email via Resend:", emailError);
  }
};

export const sanitizeUser = (user) => {
  if (!user) {
    return user;
  }

  // eslint-disable-next-line no-unused-vars
  const { passwordHash, freelancerProfile, ...safeUser } = user;
  const resolvedFreelancerProfile = resolveFreelancerProfileRecord({
    ...safeUser,
    freelancerProfile
  });
  const resolvedProfileDetails = resolvedFreelancerProfile.profileDetails;
  const identityAvatar = extractAvatarUrl(
    resolvedProfileDetails?.identity?.profilePhoto
  );
  const identityLocation = buildLocationFromIdentity(resolvedProfileDetails?.identity);
  const identityJobTitle = buildJobTitleFromIdentity(resolvedProfileDetails?.identity);
  const normalizedRole = normalizeRoleValue(safeUser.role) || "FREELANCER";
  const roles = Array.isArray(safeUser.roles)
    ? safeUser.roles.map((role) => normalizeRoleValue(role)).filter(Boolean)
    : [];
  const mergedRoles = roles.includes(normalizedRole)
    ? roles
    : [...roles, normalizedRole];
  const normalizedSkills = normalizeSkills(resolvedFreelancerProfile.skills, {
    strictTech: true,
    max: 120
  });
  const profileDerivedSkills = extractSkillsFromProfileDetails(
    resolvedProfileDetails,
    { strictTech: true, max: 120 }
  );
  const mergedSkills = normalizeSkills(
    [...normalizedSkills, ...profileDerivedSkills],
    { strictTech: true, max: 120 }
  );
  const profileSkillFallback = Array.isArray(resolvedProfileDetails?.skills)
    ? resolvedProfileDetails.skills
    : [];
  const fallbackSkills = normalizeSkills(
    [...normalizedSkills, ...profileSkillFallback],
    { strictTech: false, max: 120 }
  );
  const normalizedWorkExperience = normalizeWorkExperienceEntries(
    resolvedFreelancerProfile.workExperience
  );
  const profileDerivedWorkExperience = buildWorkExperienceFromProfileDetails(
    resolvedProfileDetails
  );
  const mergedWorkExperience = normalizedWorkExperience.length
    ? normalizedWorkExperience
    : profileDerivedWorkExperience;
  const resolvedServices = deriveMarketplaceServices({
    profileDetails: resolvedProfileDetails,
    services: resolvedFreelancerProfile.services
  });
  const normalizedPortfolioProjects = normalizePortfolioProjects(
    resolvedFreelancerProfile.portfolioProjects
  );

  return {
    ...safeUser,
    bio: resolvedFreelancerProfile.bio || null,
    profileDetails: resolvedProfileDetails,
    skills: mergedSkills.length ? mergedSkills : fallbackSkills,
    avatar: safeUser.avatar || identityAvatar || null,
    location: identityLocation || resolvedFreelancerProfile.location || null,
    jobTitle: identityJobTitle || resolvedFreelancerProfile.jobTitle || null,
    companyName: resolvedFreelancerProfile.companyName || null,
    rating: resolvedFreelancerProfile.rating ?? 0,
    reviewCount: resolvedFreelancerProfile.reviewCount ?? 0,
    experienceYears: resolvedFreelancerProfile.experienceYears ?? 0,
    services: resolvedServices,
    portfolio: resolvedFreelancerProfile.portfolio || null,
    linkedin: resolvedFreelancerProfile.linkedin || null,
    github: resolvedFreelancerProfile.github || null,
    portfolioProjects: normalizedPortfolioProjects,
    resume: resolvedFreelancerProfile.resume || null,
    headline:
      identityJobTitle ||
      resolvedFreelancerProfile.jobTitle ||
      safeUser.headline ||
      null,
    workExperience: mergedWorkExperience,
    roles: mergedRoles.length ? mergedRoles : [normalizedRole]
  };
};

const issueAccessToken = (user, activeRole) => {
  const tokenRole = normalizeRoleValue(activeRole) || normalizeRoleValue(user.role);
  return jwt.sign(
    {
      sub: user.id,
      role: tokenRole,
      email: user.email
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN
    }
  );
};

/**
 * Request a password reset - generates token and sends email
 * @param {string} email - User's email address
 * @returns {Promise<{message: string}>}
 */
// Request a password reset
export const requestPasswordReset = async (email) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, email: true }
  });

  if (!user) {
    return { message: "If an account exists with that email, a password reset link has been sent." };
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Use raw query to bypass stale Prisma Client definitions
  await prisma.$executeRaw`
    UPDATE "User" 
    SET "resetPasswordToken" = ${resetToken}, 
        "resetPasswordExpires" = ${resetTokenExpiry},
        "updatedAt" = NOW()
    WHERE "id" = ${user.id}
  `;

  if (env.RESEND_API_KEY && env.RESEND_FROM_EMAIL) {
    try {
      const resend = ensureResendClient();
      const resetUrl = `${env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;

      await resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: user.email,
        subject: "Reset Your Password - Catalance",
        html: generatePasswordResetEmail(resetUrl, user.email),
        text: generatePasswordResetTextEmail(resetUrl, user.email)
      });
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      throw new AppError("Failed to send reset email. Please try again later.", 500);
    }
  }

  return { message: "If an account exists with that email, a password reset link has been sent." };
};

export const verifyResetToken = async (token) => {
  if (!token) throw new AppError("Reset token is required", 400);

  // Raw query to find user by token
  const users = await prisma.$queryRaw`
    SELECT * FROM "User" 
    WHERE "resetPasswordToken" = ${token} 
    LIMIT 1
  `;
  const user = users[0];

  if (!user || !user.resetPasswordExpires) {
    return { valid: false };
  }

  const now = new Date();
  // Ensure expiry is a Date object (pg driver returns Date usually)
  const expiry = new Date(user.resetPasswordExpires);

  if (now > expiry) {
    return { valid: false };
  }

  return { valid: true, email: user.email };
};

export const resetPassword = async (token, newPassword) => {
  if (!token) throw new AppError("Reset token is required", 400);
  if (!newPassword || newPassword.length < 8) {
    throw new AppError("Password must be at least 8 characters long", 400);
  }

  const users = await prisma.$queryRaw`
    SELECT * FROM "User" 
    WHERE "resetPasswordToken" = ${token} 
    LIMIT 1
  `;
  const user = users[0];

  if (!user || !user.resetPasswordExpires) {
    throw new AppError("Invalid or expired reset token", 400);
  }

  const now = new Date();
  const expiry = new Date(user.resetPasswordExpires);

  if (now > expiry) {
    throw new AppError("Reset token has expired", 400);
  }

  const newPasswordHash = await hashPassword(newPassword);

  // Raw update to clear token and set password
  await prisma.$executeRaw`
    UPDATE "User"
    SET "passwordHash" = ${newPasswordHash},
        "resetPasswordToken" = NULL,
        "resetPasswordExpires" = NULL,
        "updatedAt" = NOW()
    WHERE "id" = ${user.id}
  `;

  return { message: "Password has been reset successfully" };
};
