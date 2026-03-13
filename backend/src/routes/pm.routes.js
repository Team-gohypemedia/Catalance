import { Router } from "express";
import { requireAuth } from "../middlewares/require-auth.js";
import { requirePm } from "../middleware/pm.middleware.js";
import {
  getDashboard,
  getAssignedProjects,
  updateProfileRequest,
  getActiveProfileUpdateRequest,
  createMilestoneApproval,
  getEscalations,
  submitEscalation,
  getInternalReviews,
  submitInternalReview,
  verifyProjectClosure,
} from "../controllers/pm.controller.js";
import {
  getPmDashboardSummary,
  getPmUpcomingMeetings,
  getPmProjectDetails,
  getPmProjectMessages,
  sendPmProjectMessage,
  getPmProjectMilestones,
  listPmMeetings,
  detectPmMeetingConflicts,
  createPmMeeting,
  reschedulePmMeeting,
  searchPmFreelancers,
  getPmFreelancerDetails,
  invitePmFreelancer,
  replacePmProjectFreelancer,
  getPmProfileSummary,
  createPmReport,
  listPmReports,
  getPmReportDetails,
  createPmProjectSetup,
  getPmNotificationSnapshot,
} from "../controllers/pm.module.controller.js";

const pmRouter = Router();

pmRouter.use(requireAuth, requirePm);

pmRouter.get("/dashboard", getDashboard);
pmRouter.get("/dashboard/summary", getPmDashboardSummary);
pmRouter.get("/dashboard/upcoming-meetings", getPmUpcomingMeetings);
pmRouter.get("/projects", getAssignedProjects);
pmRouter.get("/projects/:id/details", getPmProjectDetails);
pmRouter.get("/projects/:id/messages", getPmProjectMessages);
pmRouter.post("/projects/:id/messages", sendPmProjectMessage);
pmRouter.get("/projects/:id/milestones", getPmProjectMilestones);

pmRouter.get("/meetings", listPmMeetings);
pmRouter.post("/meetings/conflicts", detectPmMeetingConflicts);
pmRouter.post("/meetings", createPmMeeting);
pmRouter.patch("/meetings/:id/reschedule", reschedulePmMeeting);

pmRouter.get("/freelancers", searchPmFreelancers);
pmRouter.get("/freelancers/:id", getPmFreelancerDetails);
pmRouter.post("/freelancers/:freelancerId/invite", invitePmFreelancer);
pmRouter.post("/projects/:id/replace-freelancer", replacePmProjectFreelancer);

pmRouter.get("/profile", getPmProfileSummary);
pmRouter.post("/profile-request", updateProfileRequest);
pmRouter.post("/profile-update-request", updateProfileRequest);
pmRouter.get("/profile-update-request/active", getActiveProfileUpdateRequest);

pmRouter.post("/projects/:id/milestone-approval", createMilestoneApproval);
pmRouter.post("/projects/:id/closure-verify", verifyProjectClosure);
pmRouter.post("/projects/:id/finalize-handover", verifyProjectClosure);
pmRouter.post("/projects/setup", createPmProjectSetup);

pmRouter.get("/escalations", getEscalations);
pmRouter.post("/projects/:id/escalate", submitEscalation);
pmRouter.post("/escalate", submitEscalation);

pmRouter.get("/reports", listPmReports);
pmRouter.post("/reports", createPmReport);
pmRouter.get("/reports/:id", getPmReportDetails);

pmRouter.get("/reviews/:freelancerId", getInternalReviews);
pmRouter.post("/reviews", submitInternalReview);
pmRouter.post("/freelancers/:freelancerId/internal-review", submitInternalReview);

pmRouter.get("/notifications", getPmNotificationSnapshot);

export default pmRouter;
