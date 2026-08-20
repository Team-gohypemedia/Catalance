import { asyncHandler } from "../utils/async-handler.js";
import {
  authenticateUser,
  authenticateWithGoogle,
  getUserById,
  getUserByEmail,
  registerUser,
  requestPasswordReset,
  verifyResetToken,
  resetPassword,
  requestEmailSigninOtp,
  verifyEmailSigninOtp,
  verifyUserOtp,
  resendOtp,
  requestWhatsappOtp,
  verifyWhatsappOtp,
  updateUserProfile
} from "../modules/users/user.service.js";
import { AppError } from "../utils/app-error.js";

export const signupHandler = asyncHandler(async (req, res) => {
  const result = await registerUser(req.body);
  res.status(201).json({ data: result });
});

export const verifyOtpHandler = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const authPayload = await verifyUserOtp({ email, otp });
  res.json({ data: authPayload });
});

export const resendOtpHandler = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await resendOtp(email);
  res.json({ data: result });
});

export const requestEmailSigninOtpHandler = asyncHandler(async (req, res) => {
  const result = await requestEmailSigninOtp(req.body);
  res.json({ data: result });
});

export const verifyEmailSigninOtpHandler = asyncHandler(async (req, res) => {
  const authPayload = await verifyEmailSigninOtp(req.body);
  res.json({ data: authPayload });
});

export const requestWhatsappOtpHandler = asyncHandler(async (req, res) => {
  const result = await requestWhatsappOtp({
    ...req.body,
    requestIp: req.ip,
    currentUserId: req.user?.sub || req.user?.id || null
  });
  res.json({ data: result });
});

export const verifyWhatsappOtpHandler = asyncHandler(async (req, res) => {
  const authPayload = await verifyWhatsappOtp({
    ...req.body,
    requestIp: req.ip,
    currentUserId: req.user?.sub || req.user?.id || null
  });
  res.json({ data: authPayload });
});

export const loginHandler = asyncHandler(async (req, res) => {
  const authPayload = await authenticateUser(req.body);
  res.json({ data: authPayload });
});

export const googleLoginHandler = asyncHandler(async (req, res) => {
  const authPayload = await authenticateWithGoogle(req.body);
  res.json({ data: authPayload });
});

export const profileHandler = asyncHandler(async (req, res) => {
  const userId = req.user?.sub || req.user?.id;
  const userEmail = req.user?.email;

  if (!userId && !userEmail) {
    throw new AppError("Authentication required", 401);
  }

  let user = null;
  if (userId) {
    user = await getUserById(userId).catch(() => null);
  }
  if (!user && userEmail) {
    user = await getUserByEmail(userEmail).catch(() => null);
  }

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const tokenRole = req.user?.role;
  const payload = tokenRole ? { ...user, role: tokenRole } : user;
  res.json({ data: payload });
});

export const updateProfileHandler = asyncHandler(async (req, res) => {
  const userId = req.user?.sub || req.user?.id;
  if (!userId) throw new AppError("Authentication required", 401);

  const updatedUser = await updateUserProfile(userId, req.body);
  res.json({ data: updatedUser });
});

export const updateOnboardingProgressHandler = asyncHandler(async (req, res) => {
  const userId = req.user?.sub || req.user?.id;
  if (!userId) throw new AppError("Authentication required", 401);

  const {
    currentStep,
    currentStepTitle,
    progressPercentage,
    totalSteps,
    currentServiceIndex,
    isCompleted,
    usedAiResume,
    aiResumeDetails,
    stageStats,
    draftSnapshot,
  } = req.body || {};

  const onboardingProgress = {
    currentStep: String(currentStep || "welcome"),
    currentStepTitle: String(currentStepTitle || "Welcome"),
    progressPercentage: Math.min(Math.max(Number(progressPercentage) || 0, 0), 100),
    totalSteps: Number(totalSteps) || 1,
    currentServiceIndex: Number(currentServiceIndex) || 0,
    isCompleted: Boolean(isCompleted),
    usedAiResume: Boolean(usedAiResume || draftSnapshot?.usedAiResume),
    aiResumeDetails: aiResumeDetails || draftSnapshot?.aiResumeDetails || null,
    stageStats: stageStats || {},
    lastActiveAt: new Date().toISOString(),
  };

  const profileDetailsUpdates = {
    onboardingProgress,
  };

  if (draftSnapshot && typeof draftSnapshot === "object") {
    profileDetailsUpdates.onboardingDraft = draftSnapshot;

    if (draftSnapshot.basicProfileForm) {
      const bpf = draftSnapshot.basicProfileForm;
      if (bpf.fullName) profileDetailsUpdates.fullName = bpf.fullName;
      if (bpf.professionalBio) profileDetailsUpdates.professionalBio = bpf.professionalBio;
      const bpfCity = bpf.city || bpf.state;
      if (bpfCity) profileDetailsUpdates.city = bpfCity;
      if (bpf.state) profileDetailsUpdates.state = bpf.state;
      if (bpf.country) profileDetailsUpdates.country = bpf.country;
      if (bpf.hourlyRate) profileDetailsUpdates.hourlyRate = bpf.hourlyRate;
      if (bpf.experience) profileDetailsUpdates.experienceLevel = bpf.experience;
      if (Array.isArray(bpf.skills)) profileDetailsUpdates.skills = bpf.skills;
      if (Array.isArray(bpf.languages)) profileDetailsUpdates.languages = bpf.languages;

      const bpfResume =
        typeof bpf.resume === "string"
          ? bpf.resume
          : bpf.resume?.url || bpf.resumeUrl || "";
      if (bpfResume) {
        profileDetailsUpdates.resume = bpfResume;
      }

      profileDetailsUpdates.identity = {
        ...(profileDetailsUpdates.identity || {}),
        ...(bpf.fullName ? { fullName: bpf.fullName } : {}),
        ...(bpf.username ? { username: bpf.username } : {}),
        ...(bpfCity ? { city: bpfCity } : {}),
        ...(bpf.country ? { country: bpf.country } : {}),
        ...(Array.isArray(bpf.languages) ? { languages: bpf.languages } : {}),
        ...(bpfResume ? { resume: bpfResume } : {}),
      };
    }
    if (draftSnapshot.selectedWorkPreference) {
      profileDetailsUpdates.workPreference = draftSnapshot.selectedWorkPreference;
    }
    if (Array.isArray(draftSnapshot.selectedServices)) {
      profileDetailsUpdates.services = draftSnapshot.selectedServices;
    }
    if (draftSnapshot.serviceDraftsByKey && typeof draftSnapshot.serviceDraftsByKey === "object") {
      profileDetailsUpdates.serviceDetails = draftSnapshot.serviceDraftsByKey;
    }
  }

  const userUpdates = {
    profileDetails: profileDetailsUpdates,
  };

  if (draftSnapshot?.selectedServices && Array.isArray(draftSnapshot.selectedServices)) {
    userUpdates.services = draftSnapshot.selectedServices;
  }
  if (draftSnapshot?.basicProfileForm?.fullName) {
    userUpdates.fullName = draftSnapshot.basicProfileForm.fullName;
  }
  if (draftSnapshot?.basicProfileForm?.professionalBio) {
    userUpdates.professionalBio = draftSnapshot.basicProfileForm.professionalBio;
    userUpdates.bio = draftSnapshot.basicProfileForm.professionalBio;
  }
  if (draftSnapshot?.basicProfileForm) {
    const bpf = draftSnapshot.basicProfileForm;
    if (bpf.city || bpf.state) userUpdates.city = bpf.city || bpf.state;
    if (bpf.country) userUpdates.country = bpf.country;
    if (bpf.username) userUpdates.username = bpf.username;
    if (Array.isArray(bpf.languages)) userUpdates.languages = bpf.languages;
    const bpfResume =
      typeof bpf.resume === "string"
        ? bpf.resume
        : bpf.resume?.url || bpf.resumeUrl || "";
    if (bpfResume) userUpdates.resume = bpfResume;
  }

  const updatedUser = await updateUserProfile(userId, userUpdates);
  res.json({ data: updatedUser });
});

export const forgotPasswordHandler = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await requestPasswordReset(email);
  res.json({ data: result });
});

export const verifyResetTokenHandler = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const result = await verifyResetToken(token);
  res.json({ data: result });
});

export const resetPasswordHandler = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const result = await resetPassword(token, password);
  res.json({ data: result });
});
