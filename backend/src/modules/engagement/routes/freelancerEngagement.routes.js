import { Router } from "express";
import { requireAuth } from "../../../middlewares/require-auth.js";
import { validateResource } from "../../../middlewares/validate-resource.js";
import {
  getContestDetails,
  getBadgesHandler,
  getDashboard,
  getProcessReportHandler,
  startDaily,
  submitDaily
} from "../controllers/freelancerEngagement.controller.js";
import {
  contestIdParamsSchema,
  submitDailyChallengeSchema
} from "../validators/engagement.validators.js";

export const freelancerEngagementRouter = Router();

freelancerEngagementRouter.use(requireAuth);

freelancerEngagementRouter.get("/dashboard", getDashboard);
freelancerEngagementRouter.get(
  "/contests/:id",
  validateResource(contestIdParamsSchema),
  getContestDetails
);
freelancerEngagementRouter.post("/daily/start", startDaily);
freelancerEngagementRouter.post(
  "/daily/submit",
  validateResource(submitDailyChallengeSchema),
  submitDaily
);
freelancerEngagementRouter.get("/process-report", getProcessReportHandler);
freelancerEngagementRouter.get("/badges", getBadgesHandler);
