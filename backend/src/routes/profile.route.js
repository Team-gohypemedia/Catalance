import { Router } from "express";
import { getProfile, saveProfile, saveFcmToken, migrateBioData } from "../controllers/profile.controller.js";
import { requireAuth } from "../middlewares/require-auth.js";

export const profileRouter = Router();

// Logging middleware for profile routes
profileRouter.use((req, res, next) => {
  console.log(`[ProfileRoute] ${req.method} /profile${req.path} hit`);
  next();
});

profileRouter.get("/", getProfile);
profileRouter.post("/", saveProfile);
profileRouter.post("/migrate-bio", migrateBioData); // One-time migration
profileRouter.post("/fcm-token", requireAuth, saveFcmToken);

