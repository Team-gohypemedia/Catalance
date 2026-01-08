import { asyncHandler } from "../utils/async-handler.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";
import { extractBioText } from "../utils/bio-utils.js";

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
  const email = req.query.email;
  console.log("[getProfile] Called with email:", email);
  
  if (!email) {
    throw new AppError("Email is required to fetch profile", 400);
  }
  
  // Prevent caching
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  
  const user = await prisma.user.findUnique({
    where: { email }
  });
  if (!user) {
    throw new AppError("User not found", 404);
  }
  
  console.log("[getProfile] Raw user.bio from DB:", user.bio);
  
  // Initialize with native column values
  // We strictly treat bio as a string now. No more JSON parsing support.
  let bioText = user.bio || "";
  let expYears = user.experienceYears || 0;
  let jobTitle = user.jobTitle || "";
  let userLocation = user.location || "";
  let userPhone = user.phone || "";
  let userServices = user.services || [];
  let userWorkExperience = user.workExperience || [];

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
        avatar: user.avatar ?? "",
        available: user.status === "ACTIVE"
      },
      skills: user.skills ?? [],
      workExperience: userWorkExperience,
      services: userServices,
      portfolio: {
        portfolioUrl: user.portfolio ?? "",
        linkedinUrl: user.linkedin ?? "",
        githubUrl: user.github ?? "",
        resume: user.resume ?? "",
      },
      portfolioProjects: user.portfolioProjects ?? []
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
    updateData.skills = cleanSkills;
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
  if (personal.phone !== undefined) updateData.phone = personal.phone;
  if (personal.location !== undefined) updateData.location = personal.location;
  if (personal.headline !== undefined) updateData.jobTitle = personal.headline;
  
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
