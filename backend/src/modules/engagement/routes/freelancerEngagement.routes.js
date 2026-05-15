import { Router } from "express";
import { requireAuth } from "../../../middlewares/require-auth.js";
import { validateResource } from "../../../middlewares/validate-resource.js";
import {
  createContestSubmissionHandler,
  getContestDetails,
  getContestSubmissions,
  getBadgesHandler,
  getDashboard,
  getProcessReportHandler,
  startDaily,
  submitDaily
} from "../controllers/freelancerEngagement.controller.js";
import {
  createContestSubmissionSchema,
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
freelancerEngagementRouter.get(
  "/contests/:id/submissions",
  validateResource(contestIdParamsSchema),
  getContestSubmissions
);
freelancerEngagementRouter.post(
  "/contests/:id/submissions",
  validateResource(createContestSubmissionSchema),
  createContestSubmissionHandler
);
freelancerEngagementRouter.post("/daily/start", startDaily);
freelancerEngagementRouter.post(
  "/daily/submit",
  validateResource(submitDailyChallengeSchema),
  submitDaily
);
freelancerEngagementRouter.get("/process-report", getProcessReportHandler);
freelancerEngagementRouter.get("/badges", getBadgesHandler);
