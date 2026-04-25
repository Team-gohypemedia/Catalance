import { Router } from "express";
import { getDashboardStats, getUsers, updateUserRole, updateUserStatus, updateUserVerification, getUserDetails, getProjects, getProjectDetails, getServices, upsertService, getServiceQuestions, upsertQuestion, reorderQuestions, deleteQuestion } from "../controllers/admin.controller.js";
import { deleteAdminBlog, getAdminBlogById, getAdminBlogs, upsertAdminBlog } from "../controllers/blog.controller.js";
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

export default router;

