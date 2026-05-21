import { Router } from "express";

import {
  getDashboardStats,
  getUsers,
  updateUserRole,
  updateUserStatus,
  updateUserVerification,
  getUserDetails,
  getProjects,
  getProjectDetails,
  getServices,
  upsertService,
  getServiceQuestions,
  upsertQuestion,
  reorderQuestions,
  deleteQuestion,
  createProjectManager,
  updateProjectManager,
  updateProjectManagerProfile,
  updateProjectManagerNotification,
  markAllProjectManagerNotificationsRead,
  updateProjectManagerReport,
  createProjectManagerMeeting,
  updateProjectManagerMeeting,
  approveProjectManagerMilestone,
  finalizeProjectManagerHandover,
  getProjectManagerProjectDetails,
  getProjectManagerProjectMessages,
  sendProjectManagerProjectMessage,
} from "../controllers/admin.controller.js";

import {
  archiveFreelancerOnboardingSubmission,
  createFreelancerOnboardingSubmission,
  getFreelancerOnboardingSubmission,
  listFreelancerOnboardingSubmissions,
  updateFreelancerOnboardingStatus,
  updateFreelancerOnboardingSubmission,
} from "../controllers/adminFreelancerOnboarding.controller.js";

import {
  deleteAdminBlog,
  getAdminBlogById,
  getAdminBlogs,
  upsertAdminBlog,
} from "../controllers/blog.controller.js";

import { requireAuth } from "../middlewares/require-auth.js";
import { requireAdmin } from "../middleware/admin.middleware.js";
import { adminEngagementRouter } from "../modules/engagement/routes/adminEngagement.routes.js";
import { validateResource } from "../middlewares/validate-resource.js";

import {
  listFreelancerOnboardingSchema,
  onboardingStatusActionSchema,
  onboardingSubmissionIdParamsSchema,
  onboardingSubmissionWriteSchema,
} from "../modules/users/admin-freelancer-onboarding.schema.js";
const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/stats", getDashboardStats);
router.get(
  "/freelancer-onboarding",
  validateResource(listFreelancerOnboardingSchema),
  listFreelancerOnboardingSubmissions
);
router.post(
  "/freelancer-onboarding",
  validateResource(onboardingSubmissionWriteSchema),
  createFreelancerOnboardingSubmission
);
router.get(
  "/freelancer-onboarding/:submissionId",
  validateResource(onboardingSubmissionIdParamsSchema),
  getFreelancerOnboardingSubmission
);
router.put(
  "/freelancer-onboarding/:submissionId",
  validateResource(onboardingSubmissionWriteSchema),
  updateFreelancerOnboardingSubmission
);
router.patch(
  "/freelancer-onboarding/:submissionId/status",
  validateResource(onboardingStatusActionSchema),
  updateFreelancerOnboardingStatus
);
router.delete(
  "/freelancer-onboarding/:submissionId",
  validateResource(onboardingSubmissionIdParamsSchema),
  archiveFreelancerOnboardingSubmission
);
router.get("/users", getUsers);
router.get("/users/:userId", getUserDetails);
router.post("/project-managers", createProjectManager);
router.patch("/project-managers/:userId", updateProjectManager);
router.patch("/project-managers/:userId/profile", updateProjectManagerProfile);
router.patch("/project-managers/:userId/notifications/:notificationId", updateProjectManagerNotification);
router.post("/project-managers/:userId/notifications/mark-all-read", markAllProjectManagerNotificationsRead);
router.patch("/project-managers/:userId/reports/:reportId", updateProjectManagerReport);
router.post("/project-managers/:userId/meetings", createProjectManagerMeeting);
router.patch("/project-managers/:userId/meetings/:meetingId", updateProjectManagerMeeting);
router.post("/project-managers/:userId/projects/:projectId/milestone-approval", approveProjectManagerMilestone);
router.post("/project-managers/:userId/projects/:projectId/finalize-handover", finalizeProjectManagerHandover);
router.get("/project-managers/:userId/projects/:projectId/details", getProjectManagerProjectDetails);
router.get("/project-managers/:userId/projects/:projectId/messages", getProjectManagerProjectMessages);
router.post("/project-managers/:userId/projects/:projectId/messages", sendProjectManagerProjectMessage);
router.get("/projects", getProjects);
router.get("/projects/:projectId", getProjectDetails);
router.patch("/users/:userId/role", updateUserRole);
router.patch("/users/:userId/status", updateUserStatus);
router.patch("/users/:userId/verification", updateUserVerification);

// Service Management Routes
router.get("/services", getServices);
router.post("/services", upsertService);
router.get("/services/:serviceId/questions", getServiceQuestions);
router.post("/services/:serviceId/questions", upsertQuestion);
router.post("/services/:serviceId/questions/reorder", reorderQuestions);
router.delete("/services/:serviceId/questions/:id", deleteQuestion);

router.get("/blogs", getAdminBlogs);
router.get("/blogs/:blogId", getAdminBlogById);
router.post("/blogs", upsertAdminBlog);
router.delete("/blogs/:blogId", deleteAdminBlog);

router.use("/engagement", adminEngagementRouter);

export default router;

