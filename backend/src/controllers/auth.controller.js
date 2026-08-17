
import { asyncHandler } from "../utils/async-handler.js";
import {
  authenticateUser,
  authenticateWithGoogle,
  getUserById,
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

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const user = await getUserById(userId);
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
      if (bpf.city) profileDetailsUpdates.city = bpf.city;
      if (bpf.country) profileDetailsUpdates.country = bpf.country;
      if (bpf.hourlyRate) profileDetailsUpdates.hourlyRate = bpf.hourlyRate;
      if (bpf.experience) profileDetailsUpdates.experienceLevel = bpf.experience;
      if (Array.isArray(bpf.skills)) profileDetailsUpdates.skills = bpf.skills;
    }
    if (draftSnapshot.selectedWorkPreference) {
      profileDetailsUpdates.workPreference = draftSnapshot.selectedWorkPreference;
    }
    if (Array.isArray(draftSnapshot.selectedServices)) {
      profileDetailsUpdates.services = draftSnapshot.selectedServices;
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
