import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";
import { matchFreelancersForProposal } from "../services/proposal-matching.service.js";

const parseOptionalLimit = (value) => {
  if (value === undefined || value === null || value === "") return undefined;

  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new AppError("Limit must be a positive integer.", 400);
  }

  return Math.min(parsed, 50);
};

const buildMatchingResponse = (result = {}) => ({
  proposalId: result?.proposalId || null,
  sourceProjectId: result?.sourceProjectId || null,
  sourceType: result?.sourceType || "project",
  generated: true,
  generatedAt: new Date().toISOString(),
  levelCounts: result?.levelCounts || {
    level1: 0,
    level2: 0,
    level3: 0,
  },
  meta: result?.meta || {},
  results: Array.isArray(result?.results) ? result.results : [],
});

export const runProposalMatching = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const limit = parseOptionalLimit(req.body?.limit ?? req.query?.limit);
  const result = await matchFreelancersForProposal(req.params.proposalId, {
    ...(limit ? { limit } : {}),
  });

  res.json({
    data: buildMatchingResponse(result),
  });
});

export const getProposalMatchingResults = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const limit = parseOptionalLimit(req.query?.limit);
  const result = await matchFreelancersForProposal(req.params.proposalId, {
    ...(limit ? { limit } : {}),
  });

  res.json({
    data: buildMatchingResponse(result),
  });
});
