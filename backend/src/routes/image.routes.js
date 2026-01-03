import { Router } from "express";
import { getImage, getChatFile } from "../controllers/image.controller.js";

const router = Router();

// Chat files - stored in chat/ folder (must be before generic /:key route)
router.get("/chat/:key", getChatFile);

// Avatar files - stored in avatars/ folder
router.get("/:key", getImage);

export const imageRouter = router;
