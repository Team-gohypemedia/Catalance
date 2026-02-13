import { Router } from "express";
import { getDashboardStats, getUsers, updateUserRole, updateUserStatus, getUserDetails, getProjects, getProjectDetails, getServices, upsertService, getServiceQuestions, upsertQuestion, reorderQuestions, deleteQuestion } from "../controllers/admin.controller.js";
import { requireAuth } from "../middlewares/require-auth.js";
import { requireAdmin } from "../middleware/admin.middleware.js";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/stats", getDashboardStats);
router.get("/users", getUsers);
router.get("/users/:userId", getUserDetails);
router.get("/projects", getProjects);
router.get("/projects/:projectId", getProjectDetails);
router.patch("/users/:userId/role", updateUserRole);
router.patch("/users/:userId/status", updateUserStatus);

// Service Management Routes
router.get("/services", getServices);
router.post("/services", upsertService);
router.get("/services/:serviceId/questions", getServiceQuestions);
router.post("/services/:serviceId/questions", upsertQuestion);
router.post("/services/:serviceId/questions/reorder", reorderQuestions);
router.delete("/services/:serviceId/questions/:id", deleteQuestion);

export default router;

