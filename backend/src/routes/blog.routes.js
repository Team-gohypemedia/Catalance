import { Router } from "express";
import {
  deleteAdminBlog,
  getAdminBlogById,
  getAdminBlogs,
  getPublishedBlogBySlug,
  getPublishedBlogs,
  upsertAdminBlog
} from "../controllers/blog.controller.js";
import { requireAuth } from "../middlewares/require-auth.js";

const router = Router();

// Public read endpoints
router.get("/", getPublishedBlogs);
router.get("/:slug", getPublishedBlogBySlug);

// Authenticated author/creator endpoints (accessible from separate upload page)
router.get("/manage/all", requireAuth, getAdminBlogs);
router.get("/manage/:blogId", requireAuth, getAdminBlogById);
router.post("/manage", requireAuth, upsertAdminBlog);
router.delete("/manage/:blogId", requireAuth, deleteAdminBlog);

export default router;
