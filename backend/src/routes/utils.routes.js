import { Router } from "express";
import { getMetadataHandler } from "../controllers/utils.controller.js";

const router = Router();

router.get("/metadata", getMetadataHandler);

export default router;
