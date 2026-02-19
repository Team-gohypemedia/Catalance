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

const normalizeRoleValue = (value) =>
  typeof value === "string" ? value.toUpperCase() : null;

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
    const serviceName = toTitleCaseLabel(normalizedServiceKey || "") || null;
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
      const title = String(entry.title || "").trim();
      const period = String(entry.period || "").trim();
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

      const experience = normalizeLabel(detail.experienceYears);
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
        title: `${toTitleCaseLabel(serviceKey) || "Service"} - Onboarding`,
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

  return prisma.user.update({
    where: { id: user.id },
    data: updates
  });
};

export const listUsers = async (filters = {}) => {
  const onboardingComplete = parseBooleanFilter(filters.onboardingComplete);
  const normalizedRoleFilter = normalizeRoleValue(filters.role);
  const where = {
    role: filters.role,
    status: filters.status || "ACTIVE"
  };

  if (onboardingComplete !== undefined) {
    where.onboardingComplete = onboardingComplete;
  }

  const includeFreelancerProjects =
    !normalizedRoleFilter || normalizedRoleFilter === "FREELANCER";

  const users = await prisma.user.findMany({
    where,
    include: includeFreelancerProjects
      ? {
          freelancerProjects: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
          }
        }
      : undefined,
    orderBy: {
      createdAt: "desc"
    }
  });

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

  const user = await prisma.user.update({
    where: { id: userId },
    data: cleanUpdates
  });

  const shouldSyncFreelancerProjects =
    normalizeRoleValue(user.role) === "FREELANCER" &&
    (Object.prototype.hasOwnProperty.call(cleanUpdates, "profileDetails") ||
      Object.prototype.hasOwnProperty.call(cleanUpdates, "portfolioProjects"));

  if (shouldSyncFreelancerProjects) {
    const normalizedProjects = deriveFreelancerProjects({
      profileDetails: Object.prototype.hasOwnProperty.call(cleanUpdates, "profileDetails")
        ? cleanUpdates.profileDetails
        : user.profileDetails,
      portfolioProjects: Object.prototype.hasOwnProperty.call(
        cleanUpdates,
        "portfolioProjects"
      )
        ? cleanUpdates.portfolioProjects
        : user.portfolioProjects
    });

    await replaceFreelancerProjects(user.id, normalizedProjects);
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
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

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
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      otpCode: null,
      otpExpires: null
    }
  });

  // Send welcome email now that they are verified
  await maybeSendWelcomeEmail(updatedUser);

  return {
    user: sanitizeUser(updatedUser),
    accessToken: issueAccessToken(updatedUser)
  };
};

export const resendOtp = async (email) => {
  const normalizedEmail = String(email || "").toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

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
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

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
  const { email, name } = decodedToken;

  if (!email) {
    throw new AppError("Google account does not have an email address", 400);
  }
  const normalizedEmail = String(email).toLowerCase().trim();

  // Check if user exists
  let user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

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

    user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        fullName: name || email.split("@")[0],
        passwordHash: await hashUserPassword(randomPassword), // We still set a password to avoid null constraints if any
        role: initialRole, // Default to CLIENT if not specified in request
        roles: [initialRole],
        isVerified: true, // Google users are verified by definition
        // We can store the profile picture if we had a field for it, maybe update later
        otpCode: null,
        otpExpires: null,
        status: initialRole === "FREELANCER" ? "PENDING_APPROVAL" : "ACTIVE"
      }
    });

    await maybeSendWelcomeEmail(user);
  } else {
    // If user exists but is not verified, verify them since they used Google
    if (!user.isVerified) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true }
      });
    }

    const currentPrimaryRole = normalizeRoleValue(user.role);
    const allowRequestedRole =
      requestedRole &&
      !["ADMIN", "PROJECT_MANAGER"].includes(currentPrimaryRole || "");
    user = await ensureUserRoles(user, allowRequestedRole ? requestedRole : null);
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
  const user = await prisma.user.findUnique({
    where: { id }
  });

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
    const roles = Array.isArray(payload.roles) && payload.roles.length
      ? Array.from(new Set(payload.roles.map((role) => String(role).toUpperCase())))
      : [normalizedRole];
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        fullName: payload.fullName,
        passwordHash: await hashUserPassword(payload.password),
        role: normalizedRole,
        roles,
        bio: extractBioText(payload.bio),
        skills: mergedSkills,
        hourlyRate: payload.hourlyRate ?? null,
        otpCode: payload.otpCode,
        otpExpires: payload.otpExpires,
        isVerified: false,
        status: normalizedRole === "FREELANCER" ? "PENDING_APPROVAL" : "ACTIVE",
        onboardingComplete: payload.onboardingComplete === true,
        portfolio: payload.portfolio,
        linkedin: payload.linkedin,
        github: payload.github,
        avatar: resolvedAvatar,
        location: resolvedLocation,
        jobTitle: identityJobTitle || payload.jobTitle || null,
        portfolioProjects: normalizedPortfolioProjects,
        profileDetails: normalizedFreelancerProfile
      }
    });

    if (normalizedRole === "FREELANCER") {
      const normalizedProjects = deriveFreelancerProjects({
        profileDetails: normalizedFreelancerProfile,
        portfolioProjects: normalizedPortfolioProjects
      });
      await replaceFreelancerProjects(user.id, normalizedProjects);
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
  const { passwordHash, ...safeUser } = user;
  const identityAvatar = extractAvatarUrl(
    safeUser?.profileDetails?.identity?.profilePhoto
  );
  const identityLocation = buildLocationFromIdentity(safeUser?.profileDetails?.identity);
  const identityJobTitle = buildJobTitleFromIdentity(safeUser?.profileDetails?.identity);
  const normalizedRole = normalizeRoleValue(safeUser.role) || "FREELANCER";
  const roles = Array.isArray(safeUser.roles)
    ? safeUser.roles.map((role) => normalizeRoleValue(role)).filter(Boolean)
    : [];
  const mergedRoles = roles.includes(normalizedRole)
    ? roles
    : [...roles, normalizedRole];
  const normalizedSkills = normalizeSkills(safeUser.skills, {
    strictTech: true,
    max: 120
  });
  const profileDerivedSkills = extractSkillsFromProfileDetails(
    safeUser?.profileDetails,
    { strictTech: true, max: 120 }
  );
  const mergedSkills = normalizeSkills(
    [...normalizedSkills, ...profileDerivedSkills],
    { strictTech: true, max: 120 }
  );
  const profileSkillFallback = Array.isArray(safeUser?.profileDetails?.skills)
    ? safeUser.profileDetails.skills
    : [];
  const fallbackSkills = normalizeSkills(
    [...normalizedSkills, ...profileSkillFallback],
    { strictTech: false, max: 120 }
  );
  const normalizedWorkExperience = normalizeWorkExperienceEntries(
    safeUser.workExperience
  );
  const profileDerivedWorkExperience = buildWorkExperienceFromProfileDetails(
    safeUser?.profileDetails
  );
  const mergedWorkExperience = normalizedWorkExperience.length
    ? normalizedWorkExperience
    : profileDerivedWorkExperience;

  return {
    ...safeUser,
    skills: mergedSkills.length ? mergedSkills : fallbackSkills,
    avatar: safeUser.avatar || identityAvatar || null,
    location: identityLocation || safeUser.location || null,
    jobTitle: identityJobTitle || safeUser.jobTitle || null,
    headline: identityJobTitle || safeUser.headline || safeUser.jobTitle || null,
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
    where: { email: email.toLowerCase().trim() }
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
