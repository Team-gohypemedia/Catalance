import { Router } from "express";
import {
  createProposal,
  getProposal,
  matchProposalFreelancers,
  listProposals,
  updateProposal,
  updateProposalStatus
} from "../controllers/proposal.controller.js";
import { requireAuth } from "../middlewares/require-auth.js";
import { validateResource } from "../middlewares/validate-resource.js";
import {
  createProposalSchema,
  listProposalsSchema,
  updateProposalSchema,
} from "../modules/proposals/proposal.schema.js";
import { z } from "zod";
import { deleteProposal } from "../controllers/proposal.controller.js";

export const proposalRouter = Router();

proposalRouter.get("/", requireAuth, validateResource(listProposalsSchema), listProposals);

const getProposalSchema = z.object({
  params: z.object({ id: z.string().min(1) })
});

proposalRouter.get("/:id", requireAuth, validateResource(getProposalSchema), getProposal);

proposalRouter.post(
  "/",
  requireAuth,
  validateResource(createProposalSchema),
  createProposal
);

const matchProposalFreelancersSchema = z.object({
  body: z.object({
    proposal: z.any().optional(),
    proposalId: z.string().min(1).optional(),
  }).passthrough(),
});

proposalRouter.post(
  "/match-freelancers",
  requireAuth,
  validateResource(matchProposalFreelancersSchema),
  matchProposalFreelancers
);

proposalRouter.patch(
  "/:id",
  requireAuth,
  validateResource(updateProposalSchema),
  updateProposal
);

const updateProposalStatusSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    status: z.string().min(1),
    rejectionReason: z.string().max(300).optional(),
    rejectionReasonKey: z.string().max(64).optional(),
  })
});

proposalRouter.patch(
  "/:id/status",
  requireAuth,
  validateResource(updateProposalStatusSchema),
  updateProposalStatus
);

const deleteProposalSchema = z.object({
  params: z.object({ id: z.string().min(1) })
});

proposalRouter.delete(
  "/:id",
  requireAuth,
  validateResource(deleteProposalSchema),
  deleteProposal
);
