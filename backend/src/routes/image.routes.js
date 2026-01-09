import { Router } from "express";
import { getImage, getChatFile, getResumeFile } from "../controllers/image.controller.js";

const router = Router();

// Chat files - stored in chat/ folder (must be before generic /:key route)
// Chat files - stored in chat/ folder (must be before generic /:key route)
router.get("/chat/:key", getChatFile);

// Resume files - stored in resumes/ folder
router.get("/resumes/:key", getResumeFile);

// Avatar files - stored in avatars/ folder
router.get("/:key", getImage);

export const imageRouter = router;
