import { Router } from "express";
import { requireAuth } from "../../../middlewares/require-auth.js";
import { validateResource } from "../../../middlewares/validate-resource.js";
import {
  getBadgesHandler,
  getDashboard,
  getProcessReportHandler,
  startDaily,
  submitDaily
} from "../controllers/freelancerEngagement.controller.js";
import { submitDailyChallengeSchema } from "../validators/engagement.validators.js";

export const freelancerEngagementRouter = Router();

freelancerEngagementRouter.use(requireAuth);

freelancerEngagementRouter.get("/dashboard", getDashboard);
freelancerEngagementRouter.post("/daily/start", startDaily);
freelancerEngagementRouter.post(
  "/daily/submit",
  validateResource(submitDailyChallengeSchema),
  submitDaily
);
freelancerEngagementRouter.get("/process-report", getProcessReportHandler);
freelancerEngagementRouter.get("/badges", getBadgesHandler);
