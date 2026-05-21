import { Router } from "express";
import { seedAdminHandler } from "../controllers/dev.controller.js";

const devRouter = Router();

devRouter.post("/seed/admin", seedAdminHandler);

export default devRouter;
