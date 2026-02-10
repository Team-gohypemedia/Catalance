import { Router } from "express";
import { getMetadataHandler, getStatesHandler } from "../controllers/utils.controller.js";

const router = Router();

router.get("/metadata", getMetadataHandler);
router.get("/states", getStatesHandler);

export default router;
