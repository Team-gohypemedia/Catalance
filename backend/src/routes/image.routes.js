import { Router } from "express";
import { getImage, getChatFile } from "../controllers/image.controller.js";

const router = Router();

// Chat files - stored in chat/ folder (must be before generic /:key route)
// Chat files - stored in chat/ folder (must be before generic /:key route)
router.get("/chat/:key", getChatFile);

// Resume files - stored in resumes/ folder
router.get("/resumes/:key", getChatFile); // Reusing getChatFile as generic file server logic is fine, or we check image controller

// Avatar files - stored in avatars/ folder
router.get("/:key", getImage);

export const imageRouter = router;
