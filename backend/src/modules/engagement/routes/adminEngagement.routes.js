import { Router } from "express";
import { validateResource } from "../../../middlewares/validate-resource.js";
import {
  approveQuestion,
  getContests,
  createContest,
  updateContest,
  deleteContest,
  createQuestion,
  getFreelancerProgress,
  getOverview,
  getQuestions,
  rejectQuestion,
  seedFallbackQuestions,
  updateQuestion,
  getDailySet,
  assignDailySet,
  deleteQuestion
} from "../controllers/adminEngagement.controller.js";
import {
  adminQuestionSchema,
  listAdminFreelancerProgressSchema,
  listAdminQuestionsSchema,
  questionIdParamsSchema,
  rejectQuestionSchema,
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
adminEngagementRouter.delete("/questions/:id", deleteQuestion);
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
  "/users",
  validateResource(listAdminFreelancerProgressSchema),
  getFreelancerProgress
);

adminEngagementRouter.get("/contests", getContests);
adminEngagementRouter.post("/contests", createContest);
adminEngagementRouter.patch("/contests/:id", updateContest);
adminEngagementRouter.delete("/contests/:id", deleteContest);

// Daily question sets
adminEngagementRouter.get("/daily-sets/:dayKey", getDailySet);
adminEngagementRouter.post("/daily-sets/:dayKey/assign", assignDailySet);
