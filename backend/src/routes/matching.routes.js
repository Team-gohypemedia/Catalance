import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middlewares/require-auth.js";
import { validateResource } from "../middlewares/validate-resource.js";
import {
  getProposalMatchingResults,
  runProposalMatching,
} from "../controllers/matching.controller.js";

export const matchingRouter = Router();

const proposalMatchingParamsSchema = z.object({
  params: z.object({
    proposalId: z.string().min(1),
  }),
});

const runProposalMatchingSchema = z.object({
  params: proposalMatchingParamsSchema.shape.params,
  body: z
    .object({
      limit: z.coerce.number().int().positive().max(50).optional(),
    })
    .passthrough(),
});

const getProposalMatchingResultsSchema = z.object({
  params: proposalMatchingParamsSchema.shape.params,
  query: z.object({
    limit: z.coerce.number().int().positive().max(50).optional(),
  }),
});

matchingRouter.post(
  "/proposals/:proposalId/run",
  requireAuth,
  validateResource(runProposalMatchingSchema),
  runProposalMatching,
);

matchingRouter.get(
  "/proposals/:proposalId/results",
  requireAuth,
  validateResource(getProposalMatchingResultsSchema),
  getProposalMatchingResults,
);
