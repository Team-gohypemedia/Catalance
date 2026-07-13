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
  saveGrowthQuestService,
  startDaily,
  submitDaily
} from "../controllers/freelancerEngagement.controller.js";
import {
  createContestSubmissionSchema,
  contestIdParamsSchema,
  saveGrowthQuestServiceSchema,
  submitDailyChallengeSchema
} from "../validators/engagement.validators.js";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

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
  "/service-selection",
  validateResource(saveGrowthQuestServiceSchema),
  saveGrowthQuestService
);
freelancerEngagementRouter.post(
  "/daily/submit",
  upload.array("files", 10),
  validateResource(submitDailyChallengeSchema),
  submitDaily
);
freelancerEngagementRouter.get("/process-report", getProcessReportHandler);
freelancerEngagementRouter.get("/badges", getBadgesHandler);
