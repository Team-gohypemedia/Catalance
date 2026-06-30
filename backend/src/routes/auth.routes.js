import { Router } from "express";
import {
  signupHandler,
  loginHandler,
  googleLoginHandler,
  profileHandler,
  updateProfileHandler,
  forgotPasswordHandler,
  verifyResetTokenHandler,
  resetPasswordHandler,
  requestEmailSigninOtpHandler,
  verifyEmailSigninOtpHandler,
  verifyOtpHandler,
  resendOtpHandler,
  requestWhatsappOtpHandler,
  verifyWhatsappOtpHandler
} from "../controllers/auth.controller.js";
import { validateResource } from "../middlewares/validate-resource.js";
import {
  createUserSchema,
  emailOtpRequestSchema,
  emailOtpVerifySchema,
  loginSchema,
  googleLoginSchema,
  whatsappOtpRequestSchema,
  whatsappOtpVerifySchema
} from "../modules/users/user.schema.js";
import {
  forgotPasswordSchema,
  resetPasswordSchema
} from "../modules/users/password-reset.schema.js";
import { requireAuth } from "../middlewares/require-auth.js";
import { optionalAuth } from "../middlewares/optional-auth.js";

export const authRouter = Router();

authRouter.post("/signup", validateResource(createUserSchema), signupHandler);
authRouter.post("/verify-otp", verifyOtpHandler);
authRouter.post("/resend-otp", resendOtpHandler);
authRouter.post(
  "/email/request-otp",
  validateResource(emailOtpRequestSchema),
  requestEmailSigninOtpHandler
);
authRouter.post(
  "/email/verify-otp",
  validateResource(emailOtpVerifySchema),
  verifyEmailSigninOtpHandler
);
authRouter.post(
  "/whatsapp/request-otp",
  optionalAuth,
  validateResource(whatsappOtpRequestSchema),
  requestWhatsappOtpHandler
);
authRouter.post(
  "/whatsapp/verify-otp",
  optionalAuth,
  validateResource(whatsappOtpVerifySchema),
  verifyWhatsappOtpHandler
);
authRouter.post("/login", validateResource(loginSchema), loginHandler);
authRouter.post("/google-login", validateResource(googleLoginSchema), googleLoginHandler);
authRouter.get("/profile", requireAuth, profileHandler);
authRouter.put("/profile", requireAuth, updateProfileHandler);

// Password reset routes
authRouter.post("/forgot-password", validateResource(forgotPasswordSchema), forgotPasswordHandler);
authRouter.get("/verify-reset-token/:token", verifyResetTokenHandler);
authRouter.post("/reset-password", validateResource(resetPasswordSchema), resetPasswordHandler);
