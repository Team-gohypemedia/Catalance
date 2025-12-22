import { Router } from "express";
import { getProfile, saveProfile, saveFcmToken } from "../controllers/profile.controller.js";
import { requireAuth } from "../middlewares/require-auth.js";

export const profileRouter = Router();

profileRouter.get("/", getProfile);
profileRouter.post("/", saveProfile);
profileRouter.post("/fcm-token", requireAuth, saveFcmToken);

