import { Router } from "express";
import {
  getPublishedBlogBySlug,
  getPublishedBlogs
} from "../controllers/blog.controller.js";

const router = Router();

router.get("/", getPublishedBlogs);
router.get("/:slug", getPublishedBlogBySlug);

export default router;
