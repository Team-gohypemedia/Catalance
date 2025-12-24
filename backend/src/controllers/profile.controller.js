import { asyncHandler } from "../utils/async-handler.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";

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

export const getProfile = asyncHandler(async (req, res) => {
  const email = req.query.email;
  if (!email) {
    throw new AppError("Email is required to fetch profile", 400);
  }
  const user = await prisma.user.findUnique({
    where: { email }
  });
  if (!user) {
    throw new AppError("User not found", 404);
  }
  const extras = parseExtras(user.bio);
  res.json({
    data: {
      personal: {
        name: user.fullName ?? "",
        email: user.email,
        phone: extras.phone ?? "",
        location: extras.location ?? "",
        headline: extras.headline ?? "",
        avatar: user.avatar ?? "",
        available: extras.available ?? true // Default to true
      },
      skills: user.skills ?? [],
      workExperience: extras.workExperience ?? [],
      services: extras.services ?? [],
      portfolio: extras.portfolio ?? {} // New: Return portfolio
    }
  });
});

export const saveProfile = asyncHandler(async (req, res) => {
  // Support both flat structure (new) and nested structure (legacy)
  const payload = req.body;
  const email = payload.email || payload.personal?.email;

  if (!email) {
    throw new AppError("Email is required to update profile", 400);
  }

  // Prepare update data
  const updateData = {};

  // Handle Full Name
  if (payload.fullName) updateData.fullName = payload.fullName;
  else if (payload.personal?.name) updateData.fullName = payload.personal.name;

  // Handle Bio
  // If sent from new frontend, payload.bio is already a JSON string containing text+extras
  if (payload.bio !== undefined) {
    updateData.bio = payload.bio;
  } else if (payload.personal) {
    // Legacy mapping logic
    const { personal, skills, workExperience, services } = payload;
    const extras = {
        location: personal.location,
        headline: personal.headline, // NEW: Support headline
        available: personal.available, // NEW: Support availability
        workExperience: workExperience ?? [],
        services: services ?? [],
        portfolio: payload.portfolio ?? {} // New: Save portfolio
    };
    updateData.skills = skills ?? [];
    updateData.bio = JSON.stringify(extras);
  }

  await prisma.user.update({
    where: { email },
    data: updateData
  });

  res.json({ data: { success: true } });
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

