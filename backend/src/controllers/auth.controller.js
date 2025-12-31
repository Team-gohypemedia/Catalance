import { asyncHandler } from "../utils/async-handler.js";
import {
  authenticateUser,
  getUserById,
  registerUser,
  requestPasswordReset,
  verifyResetToken,
  resetPassword,
  verifyUserOtp,
  resendOtp,
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

export const loginHandler = asyncHandler(async (req, res) => {
  const authPayload = await authenticateUser(req.body);
  res.json({ data: authPayload });
});

export const profileHandler = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;

  if (!userId) {
    throw new AppError("User not found", 404);
  }

  const user = await getUserById(userId);
  res.json({ data: user });
});

export const updateProfileHandler = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) throw new AppError("Authentication required", 401);

  const updatedUser = await updateUserProfile(userId, req.body);
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
