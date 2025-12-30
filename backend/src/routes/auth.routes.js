import { Router } from "express";
import {
  signupHandler,
  loginHandler,
  profileHandler,
  updateProfileHandler,
  forgotPasswordHandler,
  verifyResetTokenHandler,
  resetPasswordHandler,
  verifyOtpHandler
} from "../controllers/auth.controller.js";
import { validateResource } from "../middlewares/validate-resource.js";
import {
  createUserSchema,
  loginSchema
} from "../modules/users/user.schema.js";
import {
  forgotPasswordSchema,
  resetPasswordSchema
} from "../modules/users/password-reset.schema.js";
import { requireAuth } from "../middlewares/require-auth.js";

export const authRouter = Router();

authRouter.post("/signup", validateResource(createUserSchema), signupHandler);
authRouter.post("/verify-otp", verifyOtpHandler);
authRouter.post("/login", validateResource(loginSchema), loginHandler);
authRouter.get("/profile", requireAuth, profileHandler);
authRouter.put("/profile", requireAuth, updateProfileHandler);

// Password reset routes
authRouter.post("/forgot-password", validateResource(forgotPasswordSchema), forgotPasswordHandler);
authRouter.get("/verify-reset-token/:token", verifyResetTokenHandler);
authRouter.post("/reset-password", validateResource(resetPasswordSchema), resetPasswordHandler);
