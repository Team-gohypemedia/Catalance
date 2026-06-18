import { Router } from "express";
import { getImage, getChatFile, getResumeFile } from "../controllers/image.controller.js";

const router = Router();

// Chat files - stored in chat/ folder (must be before generic /:key route)
// Chat files - stored in chat/ folder (must be before generic /:key route)
router.get("/chat/:key", getChatFile);

// Resume files - stored in resumes/ folder
router.get("/resumes/:key", getResumeFile);

// Generic R2 file proxy (nested keys, e.g. freelancers/...)
router.get("/*", getImage);

export const imageRouter = router;
