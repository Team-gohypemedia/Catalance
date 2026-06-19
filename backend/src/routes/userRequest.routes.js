import { Router } from "express";
import { createUserRequest } from "../controllers/userRequest.controller.js";
import { requireAuth } from "../middlewares/require-auth.js";

export const userRequestRouter = Router();

// Freelancer route: Submit a request
userRequestRouter.post("/", requireAuth, createUserRequest);
