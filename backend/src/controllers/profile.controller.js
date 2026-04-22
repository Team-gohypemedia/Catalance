import { asyncHandler } from "../utils/async-handler.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";
import {
  normalizeSkills,
  extractSkillsFromProfileDetails
} from "../utils/skill-utils.js";
import {
  buildFreelancerProfileDetailsObject,
  mergeFreelancerProfileDetailsWithMarketplace
} from "../modules/users/freelancer-profile-details.mapper.js";
import {
  FREELANCER_PROFILE_WITH_PROFILE_DETAILS_SELECT
} from "../modules/users/freelancer-profile.select.js";
import { updateUserProfile } from "../modules/users/user.service.js";

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

const FREELANCER_UNSPLASH_PROFILE_QUERIES = Object.freeze([
  "indian,professional,portrait,headshot",
  "indian,developer,portrait,studio",
  "indian,designer,portrait,office",
  "indian,marketer,portrait,creative",
  "indian,freelancer,portrait,workspace",
  "india,entrepreneur,portrait,natural-light"
]);

const hashStringToPositiveInt = (value = "") => {
  const input = String(value || "");
  if (!input) return 1;
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash) || 1;
};

export const buildFreelancerUnsplashAvatarUrl = (user = {}) => {
  const seedSource =
    user?.id || user?.email || user?.fullName || user?.phoneNumber || "freelancer";
  const seed = hashStringToPositiveInt(seedSource);
  const query =
    FREELANCER_UNSPLASH_PROFILE_QUERIES[
      seed % FREELANCER_UNSPLASH_PROFILE_QUERIES.length
    ];
  const sig = (seed % 9000) + 1;
  return `https://source.unsplash.com/640x640/?${encodeURIComponent(query)}&sig=${sig}`;
};

const toProfileDetailsObject = (value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }
  return {};
};

const isPlainObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value);

const normalizeStringList = (value, { max = 64 } = {}) =>
  Array.from(
    new Set(
      (Array.isArray(value) ? value : [])
        .map((entry) => String(entry || "").trim())
        .filter(Boolean)
    )
  ).slice(0, max);

const hasMeaningfulValue = (value) => {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.some((entry) => hasMeaningfulValue(entry));
  }

  if (isPlainObject(value)) {
    return Object.values(value).some((entry) => hasMeaningfulValue(entry));
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (typeof value === "boolean") {
    return true;
  }

  return value !== null && value !== undefined;
};

const cloneJsonValue = (value) => {
  if (Array.isArray(value)) {
    return value.map((entry) => cloneJsonValue(entry));
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, cloneJsonValue(entry)])
    );
  }

  return value;
};

const mergeWithFallback = (primaryValue, fallbackValue) => {
  if (Array.isArray(primaryValue)) {
    return primaryValue.length
      ? cloneJsonValue(primaryValue)
      : Array.isArray(fallbackValue)
        ? cloneJsonValue(fallbackValue)
        : [];
  }

  if (isPlainObject(primaryValue)) {
    const merged = { ...cloneJsonValue(primaryValue) };
    if (!isPlainObject(fallbackValue)) {
      return merged;
    }

    Object.entries(fallbackValue).forEach(([key, value]) => {
      merged[key] = mergeWithFallback(merged[key], value);
    });
    return merged;
  }

  return hasMeaningfulValue(primaryValue)
    ? primaryValue
    : cloneJsonValue(fallbackValue);
};

export const resolveUserProfileDetails = async (user = null) => {
  const relationProfileDetails = buildFreelancerProfileDetailsObject(
    user?.freelancerProfile
  );
  if (Object.keys(relationProfileDetails).length) {
    return mergeFreelancerProfileDetailsWithMarketplace(
      relationProfileDetails,
      user?.marketplace
    );
  }

  const legacyProfileDetails = toProfileDetailsObject(user?.profileDetails);
  if (Object.keys(legacyProfileDetails).length) {
    return mergeFreelancerProfileDetailsWithMarketplace(
      legacyProfileDetails,
      user?.marketplace
    );
  }

  if (!user?.id || !prisma?.freelancerProfile?.findUnique) {
    return mergeFreelancerProfileDetailsWithMarketplace({}, user?.marketplace);
  }

  try {
    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId: user.id },
      select: FREELANCER_PROFILE_WITH_PROFILE_DETAILS_SELECT
    });

    if (!profile) {
      return legacyProfileDetails;
    }

    return mergeFreelancerProfileDetailsWithMarketplace(
      buildFreelancerProfileDetailsObject(profile),
      user?.marketplace
    );
  } catch (error) {
    console.warn(
      `[FreelancerProfile] Unable to load profile details for user ${user.id}:`,
      error?.message || error
    );
    return legacyProfileDetails;
  }
};

export const extractPortfolioProjectsFromProfileDetails = (profileDetails = {}) => {
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
  web_development: "Web Development",
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

const MARKETPLACE_SERVICE_KEY_ALIASES = {
  website_uiux: "web_development",
  website_ui_ux: "web_development",
  website_ui_ux_design_2d_3d: "web_development",
  website_ui_ux_design: "web_development",
  "web-development": "web_development"
};

const normalizeMarketplaceServiceIdentifier = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const resolveMarketplaceServiceKey = (value = "") => {
  const canonical = normalizeMarketplaceServiceIdentifier(value);
  if (!canonical) return "";

  const aliased = MARKETPLACE_SERVICE_KEY_ALIASES[canonical] || canonical;
  if (Object.prototype.hasOwnProperty.call(MARKETPLACE_SERVICE_TITLE_BY_KEY, aliased)) {
    return aliased;
  }

  return aliased;
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
  const key = resolveMarketplaceServiceKey(serviceKey);
  if (!key) return "Service";
  return MARKETPLACE_SERVICE_TITLE_BY_KEY[key] || toTitleCaseLabel(key);
};

const normalizeOnboardingWorkExperienceTitle = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const onboardingMatch = raw.match(/^(.*?)[^a-z0-9]+onboarding$/i);
  if (!onboardingMatch) return raw;

  const baseRaw = String(onboardingMatch[1] || "").trim();
  const canonical = resolveMarketplaceServiceKey(baseRaw);
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

export const extractWorkExperienceFromProfileDetails = (profileDetails = {}) => {
  const explicit = normalizeWorkExperienceEntries(profileDetails?.workExperience);
  return explicit;
};

// Migration: FORCE WIPE corrupted bio data
export const migrateBioData = asyncHandler(async (req, res) => {
  console.log("[migrateBioData] Starting FORCE WIPE migration...");

  const profiles = await prisma.freelancerProfile.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true
        }
      }
    }
  });
  let wipedCount = 0;

  for (const profile of profiles) {
    const userEmail = String(profile?.user?.email || "").toLowerCase();
    const bioValue = String(profile?.bio || "");
    // specific check for the user reporting issues, or any user with JSON-like bio
    if ((bioValue && bioValue.trim().startsWith('{')) || userEmail.includes('wetivi')) {
      console.log(`[migrateBioData] Wiping bio for user: ${profile?.user?.email || profile.userId}`);

      await prisma.freelancerProfile.update({
        where: { userId: profile.userId },
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
    where: tokenUserId ? { id: tokenUserId } : { email: tokenEmail },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      phoneNumber: true,
      role: true,
      roles: true,
      status: true,
      avatar: true,
      marketplace: {
        select: {
          serviceKey: true,
          service: true,
          serviceDetails: true,
        },
      },
      freelancerProfile: {
        select: FREELANCER_PROFILE_WITH_PROFILE_DETAILS_SELECT
      }
    }
  });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const freelancerProfile =
    user.freelancerProfile && typeof user.freelancerProfile === "object"
      ? user.freelancerProfile
      : {};

  console.log("[getProfile] Raw freelancerProfile.bio from DB:", freelancerProfile.bio);

  // Initialize with native column values
  // We strictly treat bio as a string now. No more JSON parsing support.
  let bioText = String(freelancerProfile.bio || "");
  let expYears = Number(freelancerProfile.experienceYears) || 0;
  const profileDetails = await resolveUserProfileDetails(user);
  const identityJobTitle = buildJobTitleFromIdentity(profileDetails?.identity);
  let jobTitle = identityJobTitle || freelancerProfile.jobTitle || user.headline || "";
  const identityAvatar = extractAvatarUrl(profileDetails?.identity?.profilePhoto);
  const identityLocation = buildLocationFromIdentity(profileDetails?.identity);
  const isFreelancerProfile =
    String(user.role || "").toUpperCase() === "FREELANCER" ||
    (Array.isArray(user.roles) &&
      user.roles.some((role) => String(role || "").toUpperCase() === "FREELANCER"));
  const profileAvatar = user.avatar || identityAvatar || "";
  const resolvedAvatar =
    isFreelancerProfile && !profileAvatar
      ? buildFreelancerUnsplashAvatarUrl(user)
      : profileAvatar;

  // Fix Location " 0" issue and fallback
  let userLocation = identityLocation || freelancerProfile.location || "";
  if (userLocation && userLocation.endsWith(" 0")) {
    userLocation = userLocation.slice(0, -2);
  }

  let userPhone = user.phone || user.phoneNumber || "";
  // Ensure userServices is an array
  let userServices = Array.isArray(freelancerProfile.services)
    ? freelancerProfile.services
    : [];

  // Ensure workExperience is an array of objects
  let userWorkExperience = [];
  try {
    if (Array.isArray(freelancerProfile.workExperience)) {
      userWorkExperience = freelancerProfile.workExperience;
    } else if (typeof freelancerProfile.workExperience === 'string') {
      // Try parsing if it's a JSON string
      const parsed = JSON.parse(freelancerProfile.workExperience);
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
  const nativePortfolioProjects = Array.isArray(freelancerProfile.portfolioProjects)
    ? freelancerProfile.portfolioProjects
    : [];
  const mergedPortfolioProjects = nativePortfolioProjects.length
    ? nativePortfolioProjects
    : profileProjects;
  const profileSkills = Array.isArray(profileDetails?.skills)
    ? profileDetails.skills
    : [];
  const nativeSkills = Array.isArray(freelancerProfile.skills)
    ? freelancerProfile.skills
    : [];
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
        avatar: resolvedAvatar,
        available:
          typeof freelancerProfile?.available === "boolean"
            ? freelancerProfile.available
            : user.status === "ACTIVE",
          openToWork:
            typeof freelancerProfile?.openToWork === "boolean"
              ? freelancerProfile.openToWork
              : true,
        isVerified: Boolean(freelancerProfile?.isVerified)
      },
      skills: mergedSkills.length ? mergedSkills : fallbackSkills,
      workExperience: userWorkExperience,
      services: userServices,
      portfolio: {
        portfolioUrl: freelancerProfile.portfolio ?? "",
        linkedinUrl: freelancerProfile.linkedin ?? "",
        githubUrl: freelancerProfile.github ?? "",
        resume: freelancerProfile.resume ?? "",
      },
      portfolioProjects: mergedPortfolioProjects,
      profileDetails
    }
  });
});

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);

const buildSaveProfileUpdates = (payload = {}) => {
  const personal = isPlainObject(payload?.personal) ? payload.personal : {};
  const portfolio =
    payload?.portfolio && typeof payload.portfolio === "object" && !Array.isArray(payload.portfolio)
      ? payload.portfolio
      : {};
  const normalizedProfileDetails = hasOwn(payload, "profileDetails")
    ? toProfileDetailsObject(payload.profileDetails)
    : undefined;
  const identity =
    normalizedProfileDetails?.identity && typeof normalizedProfileDetails.identity === "object"
      ? normalizedProfileDetails.identity
      : {};
  const updates = {};

  if (hasOwn(personal, "name")) {
    updates.fullName = personal.name;
  }

  if (hasOwn(personal, "phone")) {
    updates.phoneNumber = personal.phone;
  }

  if (hasOwn(personal, "avatar")) {
    updates.avatar = personal.avatar;
  }

  const resolvedLocation = hasOwn(personal, "location")
    ? personal.location
    : hasOwn(payload, "location")
      ? payload.location
      : buildLocationFromIdentity(identity);
  if (resolvedLocation !== undefined) {
    updates.location = resolvedLocation;
  }

  const resolvedJobTitle = hasOwn(personal, "headline")
    ? personal.headline
    : hasOwn(payload, "jobTitle")
      ? payload.jobTitle
      : buildJobTitleFromIdentity(identity);
  if (resolvedJobTitle !== undefined) {
    updates.jobTitle = resolvedJobTitle;
  }

  if (hasOwn(personal, "available")) {
    updates.available = personal.available;
  }

  if (hasOwn(personal, "experienceYears")) {
    updates.experienceYears = personal.experienceYears;
  }

  const resolvedBio = hasOwn(personal, "bio")
    ? personal.bio
    : hasOwn(payload, "bio")
      ? payload.bio
      : undefined;
  if (resolvedBio !== undefined) {
    updates.bio = resolvedBio;
  }

  if (hasOwn(payload, "companyName")) {
    updates.companyName = payload.companyName;
  }

  if (hasOwn(payload, "skills")) {
    updates.skills = payload.skills;
  }

  if (hasOwn(payload, "services")) {
    updates.services = payload.services;
  }

  if (hasOwn(payload, "portfolioProjects")) {
    updates.portfolioProjects = payload.portfolioProjects;
  }

  if (hasOwn(payload, "workExperience")) {
    updates.workExperience = payload.workExperience;
  }

  if (hasOwn(payload, "serviceTitle")) {
    updates.serviceTitle = payload.serviceTitle;
  }

  if (hasOwn(payload, "serviceCategory")) {
    updates.serviceCategory = payload.serviceCategory;
  }

  if (hasOwn(payload, "serviceExperience")) {
    updates.serviceExperience = payload.serviceExperience;
  }



  if (hasOwn(payload, "serviceDescription")) {
    updates.serviceDescription = payload.serviceDescription;
  }

  if (hasOwn(payload, "deliveryTimeline")) {
    updates.deliveryTimeline = payload.deliveryTimeline;
  }

  if (hasOwn(payload, "startingPrice")) {
    updates.startingPrice = payload.startingPrice;
  }

  if (hasOwn(payload, "serviceKeywords")) {
    updates.serviceKeywords = payload.serviceKeywords;
  }

  if (hasOwn(payload, "serviceMedia")) {
    updates.serviceMedia = payload.serviceMedia;
  }

  const resolvedPortfolio = hasOwn(portfolio, "portfolioUrl")
    ? portfolio.portfolioUrl
    : hasOwn(payload, "website")
      ? payload.website
      : typeof payload?.portfolio === "string"
        ? payload.portfolio
        : undefined;
  if (resolvedPortfolio !== undefined) {
    updates.portfolio = resolvedPortfolio;
  }

  const resolvedLinkedin = hasOwn(portfolio, "linkedinUrl")
    ? portfolio.linkedinUrl
    : hasOwn(payload, "linkedin")
      ? payload.linkedin
      : undefined;
  if (resolvedLinkedin !== undefined) {
    updates.linkedin = resolvedLinkedin;
  }

  const resolvedGithub = hasOwn(portfolio, "githubUrl")
    ? portfolio.githubUrl
    : hasOwn(payload, "github")
      ? payload.github
      : undefined;
  if (resolvedGithub !== undefined) {
    updates.github = resolvedGithub;
  }

  const resolvedResume = hasOwn(payload, "resume")
    ? payload.resume
    : hasOwn(portfolio, "resume")
      ? portfolio.resume
      : undefined;
  if (resolvedResume !== undefined) {
    updates.resume = resolvedResume;
  }

  if (normalizedProfileDetails !== undefined) {
    updates.profileDetails = normalizedProfileDetails;
  }

  if (hasOwn(payload, "onboardingComplete")) {
    updates.onboardingComplete = Boolean(payload.onboardingComplete);
  }

  return updates;
};

export const saveProfile = asyncHandler(async (req, res) => {
  const payload = req.body;
  console.log("[saveProfile] Called with payload:", JSON.stringify(payload, null, 2));
  const userId = req.user?.sub;
  console.log("[saveProfile] UserId:", userId);

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const updates = buildSaveProfileUpdates(payload);
  const updatedUser = await updateUserProfile(userId, updates);
  res.json({ data: updatedUser });
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

  await prisma.freelancerProfile.upsert({
    where: { userId },
    update: { resume },
    create: { userId, resume }
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
