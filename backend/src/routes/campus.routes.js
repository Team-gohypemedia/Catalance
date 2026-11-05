import { Router } from "express";
import { requireAuth } from "../middlewares/require-auth.js";
import { requirePm } from "../middleware/pm.middleware.js";
import {
  getCampusTalent,
  getMyCampusSummary,
  getUserCampusSkills,
} from "../controllers/campus.controller.js";

// Catalance Campus link (read-only). Campus data lives in the "campus" schema of the same database.
export const campusRouter = Router();

campusRouter.get("/users/:userId/skills", getUserCampusSkills);
campusRouter.get("/me/summary", requireAuth, getMyCampusSummary);
campusRouter.get("/talent", requireAuth, requirePm, getCampusTalent);
