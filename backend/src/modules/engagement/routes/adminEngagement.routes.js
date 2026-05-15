import { Router } from "express";
import { validateResource } from "../../../middlewares/validate-resource.js";
import {
  approveQuestion,
  createContest,
  createQuestion,
  getContests,
  getDailySets,
  getFreelancerProgress,
  getOverview,
  getQuestions,
  rejectQuestion,
  saveDailySet,
  seedFallbackQuestions,
  updateContest,
  updateQuestion
} from "../controllers/adminEngagement.controller.js";
import {
  adminContestSchema,
  adminQuestionSchema,
  listAdminFreelancerProgressSchema,
  listAdminContestsSchema,
  listAdminDailySetsSchema,
  listAdminQuestionsSchema,
  questionIdParamsSchema,
  rejectQuestionSchema,
  upsertAdminDailySetSchema,
  updateAdminContestSchema,
  updateAdminQuestionSchema
} from "../validators/engagement.validators.js";

export const adminEngagementRouter = Router();

adminEngagementRouter.get("/overview", getOverview);
adminEngagementRouter.get(
  "/questions",
  validateResource(listAdminQuestionsSchema),
  getQuestions
);
adminEngagementRouter.post(
  "/questions",
  validateResource(adminQuestionSchema),
  createQuestion
);
adminEngagementRouter.post("/questions/seed", seedFallbackQuestions);
adminEngagementRouter.patch(
  "/questions/:id",
  validateResource(updateAdminQuestionSchema),
  updateQuestion
);
adminEngagementRouter.patch(
  "/questions/:id/approve",
  validateResource(questionIdParamsSchema),
  approveQuestion
);
adminEngagementRouter.patch(
  "/questions/:id/reject",
  validateResource(rejectQuestionSchema),
  rejectQuestion
);
adminEngagementRouter.get(
  "/daily-sets",
  validateResource(listAdminDailySetsSchema),
  getDailySets
);
adminEngagementRouter.put(
  "/daily-sets/:dayKey",
  validateResource(upsertAdminDailySetSchema),
  saveDailySet
);
adminEngagementRouter.get(
  "/contests",
  validateResource(listAdminContestsSchema),
  getContests
);
adminEngagementRouter.post(
  "/contests",
  validateResource(adminContestSchema),
  createContest
);
adminEngagementRouter.patch(
  "/contests/:id",
  validateResource(updateAdminContestSchema),
  updateContest
);
adminEngagementRouter.get(
  "/users",
  validateResource(listAdminFreelancerProgressSchema),
  getFreelancerProgress
);
