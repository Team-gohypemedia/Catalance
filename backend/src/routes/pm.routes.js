import { Router } from "express";
import { requireAuth } from "../middlewares/require-auth.js";
import { requirePm } from "../middleware/pm.middleware.js";
import {
    getDashboard,
    getAssignedProjects,
    updateProfileRequest,
    createMilestoneApproval,
    getEscalations,
    submitEscalation,
    getInternalReviews,
    submitInternalReview,
    verifyProjectClosure
} from "../controllers/pm.controller.js";

const pmRouter = Router();

pmRouter.use(requireAuth, requirePm);

pmRouter.get("/dashboard", getDashboard);
pmRouter.get("/projects", getAssignedProjects);
pmRouter.post("/profile-request", updateProfileRequest);

pmRouter.post("/projects/:id/milestone-approval", createMilestoneApproval);
pmRouter.post("/projects/:id/closure-verify", verifyProjectClosure);

pmRouter.get("/escalations", getEscalations);
pmRouter.post("/projects/:id/escalate", submitEscalation);

pmRouter.get("/reviews/:freelancerId", getInternalReviews);
pmRouter.post("/reviews", submitInternalReview);

export default pmRouter;
