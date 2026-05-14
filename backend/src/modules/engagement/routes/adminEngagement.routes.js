import { Router } from "express";
import { validateResource } from "../../../middlewares/validate-resource.js";
import {
  approveQuestion,
  createQuestion,
  getFreelancerProgress,
  getOverview,
  getQuestions,
  rejectQuestion,
  seedFallbackQuestions,
  updateQuestion
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
