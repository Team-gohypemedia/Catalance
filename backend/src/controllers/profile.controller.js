import { asyncHandler } from "../utils/async-handler.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";
import { extractBioText } from "../utils/bio-utils.js";
import {
  normalizeSkills,
  extractSkillsFromProfileDetails
} from "../utils/skill-utils.js";

const parseExtras = (value) => {
  try {
    if (!value) {
      return {};
    }
    return JSON.parse(value);
  } catch {
    return {};
  }
};

// Helper to try parsing JSON, returns null if not JSON
const tryParseJSON = (str) => {
  if (typeof str !== 'string') return null;
  try {
    const obj = JSON.parse(str);
    if (obj && typeof obj === 'object') return obj;
  } catch (e) {
    return null;
  }
  return null;
};

const normalizeProjectLink = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
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
  if (!value) return "";

  if (typeof value === "string") {
    const url = value.trim();
    if (!url || url.startsWith("blob:")) return "";
    return url;
  }

  if (typeof value === "object") {
    return extractAvatarUrl(
      value.uploadedUrl || value.url || value.src || value.value || ""
    );
  }

  return "";
};

const extractPortfolioProjectsFromProfileDetails = (profileDetails = {}) => {
  const serviceDetails =
    profileDetails && typeof profileDetails === "object"
      ? profileDetails.serviceDetails
      : null;

  if (!serviceDetails || typeof serviceDetails !== "object") {
    return [];
  }

  const projectMap = new Map();

  Object.values(serviceDetails).forEach((detail) => {
    const projects = Array.isArray(detail?.projects) ? detail.projects : [];
    projects.forEach((project, index) => {
      const title = String(project?.title || "").trim();
      const link = normalizeProjectLink(project?.link || project?.url || "");
      const description = String(project?.description || "").trim();

      if (!title && !link && !description) return;

      const key = link ? link.toLowerCase() : `${title.toLowerCase()}:${index}`;
      if (projectMap.has(key)) return;

      projectMap.set(key, {
        title: title || "Project",
        link,
        image: null,
        description
      });
    });
  });

  return Array.from(projectMap.values()).slice(0, 24);
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

const MARKETPLACE_SERVICE_TITLE_BY_KEY = {
  branding: "Branding",
  website_ui_ux: "Web Development",
  seo: "SEO",
  social_media_marketing: "Social Media Management",
  paid_advertising: "Performance Marketing / Paid Ads",
  app_development: "App Development",
  software_development: "Software Development",
  lead_generation: "Lead Generation",
  video_services: "Video Services",
  writing_content: "Writing & Content",
  customer_support: "Customer Support Services",
  influencer_marketing: "Influencer Marketing",
  ugc_marketing: "UGC Marketing",
  ai_automation: "AI Automation",
  whatsapp_chatbot: "WhatsApp Chatbot",
  creative_design: "Creative & Design",
  "3d_modeling": "3D Modeling",
  cgi_videos: "CGI Video Services",
  crm_erp: "CRM & ERP Solutions",
  voice_agent: "Voice Agent / AI Calling"
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

const getMarketplaceServiceTitle = (serviceKey = "") => {
  const key = String(serviceKey || "").trim();
  if (!key) return "Service";
  return MARKETPLACE_SERVICE_TITLE_BY_KEY[key] || toTitleCaseLabel(key);
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

const normalizeWorkExperienceEntries = (entries = []) =>
  (Array.isArray(entries) ? entries : [])
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

const extractWorkExperienceFromProfileDetails = (profileDetails = {}) => {
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

// Migration: FORCE WIPE corrupted bio data
export const migrateBioData = asyncHandler(async (req, res) => {
  console.log("[migrateBioData] Starting FORCE WIPE migration...");

  // Find all users
  const users = await prisma.user.findMany();
  let wipedCount = 0;

  for (const user of users) {
    // specific check for the user reporting issues, or any user with JSON-like bio
    if ((user.bio && user.bio.trim().startsWith('{')) || user.email.includes('wetivi')) {
      console.log(`[migrateBioData] Wiping bio for user: ${user.email}`);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          bio: "" // WIPE IT CLEAN
        }
      });

      wipedCount++;
    }
  }

  console.log(`[migrateBioData] Migration complete. Wiped bio for ${wipedCount} users.`);

  res.json({
    data: {
      success: true,
      wipedCount,
      message: `Complete. Wiped bio for ${wipedCount} users.`
    }
  });
});


export const getProfile = asyncHandler(async (req, res) => {
  const tokenUserId = req.user?.sub;
  const tokenEmail =
    typeof req.user?.email === "string"
      ? req.user.email.toLowerCase().trim()
      : "";
  const requestedEmail =
    typeof req.query?.email === "string"
      ? req.query.email.toLowerCase().trim()
      : "";
  console.log("[getProfile] Called for user:", tokenUserId || tokenEmail);

  if (!tokenUserId && !tokenEmail) {
    throw new AppError("Authentication required to fetch profile", 401);
  }

  if (requestedEmail && tokenEmail && requestedEmail !== tokenEmail) {
    throw new AppError("Forbidden profile access", 403);
  }

  // Prevent caching
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');

  const user = await prisma.user.findUnique({
    where: tokenUserId ? { id: tokenUserId } : { email: tokenEmail }
  });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  console.log("[getProfile] Raw user.bio from DB:", user.bio);

  // Initialize with native column values
  // We strictly treat bio as a string now. No more JSON parsing support.
  let bioText = user.bio || "";
  let expYears = user.experienceYears || 0;
  const profileDetails =
    user.profileDetails && typeof user.profileDetails === "object"
      ? user.profileDetails
      : {};
  const identityJobTitle = buildJobTitleFromIdentity(profileDetails?.identity);
  let jobTitle = identityJobTitle || user.jobTitle || user.headline || "";
  const identityAvatar = extractAvatarUrl(profileDetails?.identity?.profilePhoto);
  const identityLocation = buildLocationFromIdentity(profileDetails?.identity);

  // Fix Location " 0" issue and fallback
  let userLocation = identityLocation || user.location || "";
  if (userLocation && userLocation.endsWith(" 0")) {
    userLocation = userLocation.slice(0, -2);
  }

  let userPhone = user.phone || user.phoneNumber || "";
  // Ensure userServices is an array
  let userServices = Array.isArray(user.services) ? user.services : [];

  // Ensure workExperience is an array of objects
  let userWorkExperience = [];
  try {
    if (Array.isArray(user.workExperience)) {
      userWorkExperience = user.workExperience;
    } else if (typeof user.workExperience === 'string') {
      // Try parsing if it's a JSON string
      const parsed = JSON.parse(user.workExperience);
      if (Array.isArray(parsed)) userWorkExperience = parsed;
    }
  } catch (e) {
    userWorkExperience = [];
  }
  const profileWorkExperience = extractWorkExperienceFromProfileDetails(
    profileDetails
  );
  if (!userWorkExperience.length && profileWorkExperience.length) {
    userWorkExperience = profileWorkExperience;
  }
  const profileProjects = extractPortfolioProjectsFromProfileDetails(profileDetails);
  const nativePortfolioProjects = Array.isArray(user.portfolioProjects)
    ? user.portfolioProjects
    : [];
  const mergedPortfolioProjects = nativePortfolioProjects.length
    ? nativePortfolioProjects
    : profileProjects;
  const profileSkills = Array.isArray(profileDetails?.skills)
    ? profileDetails.skills
    : [];
  const nativeSkills = Array.isArray(user.skills) ? user.skills : [];
  const strictProfileSkills = extractSkillsFromProfileDetails(profileDetails, {
    strictTech: true,
    max: 120
  });
  const strictNativeSkills = normalizeSkills(nativeSkills, {
    strictTech: true,
    max: 120
  });
  const mergedSkills = normalizeSkills(
    [...strictNativeSkills, ...strictProfileSkills],
    {
      strictTech: true,
      max: 120
    }
  );
  const fallbackSkills = normalizeSkills([...nativeSkills, ...profileSkills], {
    strictTech: false,
    max: 120
  });

  console.log("[getProfile] Bio (plain text):", bioText);

  console.log("[getProfile] Final bioText:", bioText);
  console.log("[getProfile] Final headline:", jobTitle);

  res.json({
    data: {
      personal: {
        name: user.fullName ?? "",
        email: user.email,
        phone: userPhone,
        location: userLocation,
        headline: jobTitle,
        bio: bioText,
        experienceYears: expYears,
        avatar: user.avatar || identityAvatar || "",
        available: user.status === "ACTIVE"
      },
      skills: mergedSkills.length ? mergedSkills : fallbackSkills,
      workExperience: userWorkExperience,
      services: userServices,
      portfolio: {
        portfolioUrl: user.portfolio ?? "",
        linkedinUrl: user.linkedin ?? "",
        githubUrl: user.github ?? "",
        resume: user.resume ?? "",
      },
      portfolioProjects: mergedPortfolioProjects,
      profileDetails
    }
  });
});

export const saveProfile = asyncHandler(async (req, res) => {
  const payload = req.body;
  console.log("[saveProfile] Called with payload:", JSON.stringify(payload, null, 2));
  console.log("[saveProfile] *** EXECUTING NATIVE COLUMN UPDATE V2 ***");

  const userId = req.user?.sub;
  const email = payload.email || payload.personal?.email || req.user?.email;
  console.log("[saveProfile] Email:", email);
  console.log("[saveProfile] UserId:", userId);

  if (!userId && !email) {
    throw new AppError("Email is required to update profile", 400);
  }

  const existingUser = await prisma.user.findUnique({
    where: userId ? { id: userId } : { email }
  });
  if (!existingUser) {
    throw new AppError("User not found", 404);
  }

  // Extract from payload
  const personal = payload.personal || {};
  const skills = payload.skills || [];
  const services = payload.services || [];
  const workExperience = payload.workExperience || [];
  const portfolioProjects = payload.portfolioProjects || [];
  const portfolio = payload.portfolio || {};

  // 1. Prepare Native Update - store each field in its own column
  const updateData = {};
  const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

  // Sanitize SKILLS to ensure string[] and not [{name: "..."}] or JSON strings
  if (hasOwn(payload, "skills")) {
    let cleanSkills = [];
    if (Array.isArray(skills)) {
      cleanSkills = skills
        .map((s) => {
          if (typeof s === "object" && s !== null && s.name) return s.name; // Flatten object
          if (typeof s === "string") {
            if (s.trim().startsWith("{") && s.includes('"name"')) {
              try {
                return JSON.parse(s).name;
              } catch (e) {
                return s;
              }
            }
            return s;
          }
          return String(s);
        })
        .filter(Boolean);
    }
    updateData.skills = normalizeSkills(cleanSkills, {
      strictTech: true,
      max: 120
    });
  }

  if (hasOwn(payload, "services")) {
    updateData.services = services;
  }
  if (hasOwn(payload, "portfolioProjects")) {
    updateData.portfolioProjects = portfolioProjects;
  }
  if (hasOwn(payload, "workExperience")) {
    updateData.workExperience = workExperience;
  }

  const hasPortfolio = hasOwn(payload, "portfolio");
  if (hasPortfolio) {
    updateData.portfolio = portfolio.portfolioUrl || null;
    updateData.linkedin = portfolio.linkedinUrl || null;
    updateData.github = portfolio.githubUrl || null;
  }

  const resumeValue = payload.resume || portfolio.resume || null;
  if (resumeValue) {
    updateData.resume = resumeValue;
  }

  // DEBUG: Log resume specifically
  console.log("[saveProfile] Resume from portfolio:", portfolio.resume);
  console.log("[saveProfile] Resume from payload:", payload.resume);
  console.log("[saveProfile] Final resume value:", updateData.resume);

  // Personal details - store in dedicated columns
  if (personal.name) updateData.fullName = personal.name;
  if (personal.avatar !== undefined) updateData.avatar = personal.avatar;
  if (personal.phone !== undefined) {
    updateData.phone = personal.phone;
    updateData.phoneNumber = personal.phone;
  }
  if (personal.location !== undefined) updateData.location = personal.location;
  if (personal.headline !== undefined) updateData.jobTitle = personal.headline;
  if (payload.companyName !== undefined) updateData.companyName = payload.companyName;
  if (payload.website !== undefined) updateData.portfolio = payload.website;

  // Bio should be plain text, NOT JSON
  const bioInput = personal.bio !== undefined ? personal.bio : payload.bio;
  if (bioInput !== undefined) {
    updateData.bio = extractBioText(bioInput);
  } else if (typeof existingUser.bio === "string") {
    const trimmed = existingUser.bio.trim();
    const looksJson =
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"));
    if (looksJson) {
      updateData.bio = extractBioText(existingUser.bio);
    }
  }
  if (typeof updateData.bio === "string") {
    const trimmedBio = updateData.bio.trim();
    const looksJson =
      (trimmedBio.startsWith("{") && trimmedBio.endsWith("}")) ||
      (trimmedBio.startsWith("[") && trimmedBio.endsWith("]"));
    if (looksJson) {
      updateData.bio = extractBioText(trimmedBio);
    }
  }

  // Experience years as number
  if (personal.experienceYears !== undefined) {
    updateData.experienceYears = Number(personal.experienceYears) || 0;
  }

  // Handle Onboarding Completion & Verification Flow
  if (payload.onboardingComplete === true) {
    updateData.onboardingComplete = true;
    // Set status to PENDING_APPROVAL when onboarding is finished
    // This locks the dashboard until admin approves
    updateData.status = "PENDING_APPROVAL";
  }

  await prisma.user.update({
    where: userId ? { id: userId } : { email },
    data: updateData
  });

  res.json({ data: { success: true } });
});

export const saveResume = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const { resume } = req.body || {};

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  if (!resume || typeof resume !== "string") {
    throw new AppError("Resume URL is required", 400);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { resume }
  });

  res.json({ data: { success: true, resume } });
});

// Save FCM token for push notifications
export const saveFcmToken = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const { fcmToken } = req.body;

  if (!userId) {
    throw new AppError("User not authenticated", 401);
  }

  if (!fcmToken) {
    throw new AppError("FCM token is required", 400);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { fcmToken }
  });

  console.log(`[Profile] Saved FCM token for user ${userId}`);
  res.json({ data: { success: true } });
});
