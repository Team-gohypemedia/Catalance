import { asyncHandler } from "../../../utils/async-handler.js";
import { AppError } from "../../../utils/app-error.js";
import {
  approveAdminQuestion,
  createAdminQuestion,
  getAdminEngagementOverview,
  listAdminFreelancerProgress,
  listAdminQuestions,
  rejectAdminQuestion,
  seedAdminFallbackQuestions,
  updateAdminQuestion
} from "../services/engagement.service.js";

const requireAdminId = (req) => {
  const adminId = req.user?.sub || req.user?.id;
  if (!adminId) {
    throw new AppError("Admin authentication required", 401);
  }
  return adminId;
};

export const getOverview = asyncHandler(async (_req, res) => {
  const data = await getAdminEngagementOverview();
  res.json({ data });
});

export const getQuestions = asyncHandler(async (req, res) => {
  const data = await listAdminQuestions(req.query);
  res.json({ data });
});

export const createQuestion = asyncHandler(async (req, res) => {
  const data = await createAdminQuestion({
    adminId: requireAdminId(req),
    payload: req.body
  });
  res.status(201).json({ data });
});

export const updateQuestion = asyncHandler(async (req, res) => {
  const data = await updateAdminQuestion({
    adminId: requireAdminId(req),
    questionId: req.params.id,
    payload: req.body
  });
  res.json({ data });
});

export const approveQuestion = asyncHandler(async (req, res) => {
  const data = await approveAdminQuestion({
    adminId: requireAdminId(req),
    questionId: req.params.id
  });
  res.json({ data });
});

export const rejectQuestion = asyncHandler(async (req, res) => {
  const data = await rejectAdminQuestion({
    adminId: requireAdminId(req),
    questionId: req.params.id,
    reason: req.body.reason
  });
  res.json({ data });
});

export const seedFallbackQuestions = asyncHandler(async (req, res) => {
  const data = await seedAdminFallbackQuestions({
    adminId: requireAdminId(req)
  });
  res.json({ data });
});

export const getFreelancerProgress = asyncHandler(async (req, res) => {
  const data = await listAdminFreelancerProgress(req.query);
  res.json({ data });
});
