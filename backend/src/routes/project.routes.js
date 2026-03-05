import { Router } from "express";
import {
  createProject,
  listProjects,
  getProject,
  updateProject,
  payUpfront,
  createUpfrontPaymentOrder,
  verifyUpfrontPayment,
} from "../controllers/project.controller.js";
import { requireAuth } from "../middlewares/require-auth.js";
import { validateResource } from "../middlewares/validate-resource.js";
import { createProjectSchema } from "../modules/projects/project.schema.js";

export const projectRouter = Router();

projectRouter.get("/", requireAuth, listProjects);
projectRouter.post("/", requireAuth, validateResource(createProjectSchema), createProject);
projectRouter.get("/:id", requireAuth, getProject);
projectRouter.patch("/:id", requireAuth, updateProject);
projectRouter.post("/:id/pay-upfront/order", requireAuth, createUpfrontPaymentOrder);
projectRouter.post("/:id/pay-upfront/verify", requireAuth, verifyUpfrontPayment);
projectRouter.post("/:id/pay-upfront", requireAuth, payUpfront);

// Project Manager Upgrade Routes
import {
    getKanbanTasks,
    createKanbanTask,
    updateKanbanTask,
    generateMicroTasks,
    releaseEscrow,
    pauseProject,
    removeFreelancer,
    reassignFreelancer
} from "../controllers/project.controller.js";

projectRouter.get("/:id/tasks", requireAuth, getKanbanTasks);
projectRouter.post("/:id/tasks", requireAuth, createKanbanTask);
projectRouter.patch("/:id/tasks/:taskId", requireAuth, updateKanbanTask);
projectRouter.post("/:id/tasks/generate", requireAuth, generateMicroTasks);

projectRouter.post("/:id/escrow/release", requireAuth, releaseEscrow);

projectRouter.post("/:id/pause", requireAuth, pauseProject);
projectRouter.post("/:id/remove-freelancer", requireAuth, removeFreelancer);
projectRouter.post("/:id/reassign-freelancer", requireAuth, reassignFreelancer);
