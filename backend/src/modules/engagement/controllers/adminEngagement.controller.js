import { asyncHandler } from "../../../utils/async-handler.js";
import { AppError } from "../../../utils/app-error.js";
import {
  approveAdminQuestion,
  listAdminContests,
  createAdminContest,
  updateAdminContest,
  deleteAdminContest,
  createAdminQuestion,
  getAdminEngagementOverview,
  listAdminFreelancerProgress,
  listAdminQuestions,
  rejectAdminQuestion,
  seedAdminFallbackQuestions,
  updateAdminQuestion,
  getAdminDailySet,
  assignAdminDailySet,
  deleteAdminQuestion
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

export const getContests = asyncHandler(async (req, res) => {
  const data = await listAdminContests();
  res.json({ data });
});

export const createContest = asyncHandler(async (req, res) => {
  const data = await createAdminContest(req.body);
  res.status(201).json({ data });
});

export const updateContest = asyncHandler(async (req, res) => {
  const data = await updateAdminContest(req.params.id, req.body);
  res.json({ data });
});

export const deleteContest = asyncHandler(async (req, res) => {
  await deleteAdminContest(req.params.id);
  res.status(204).send();
});

export const getDailySet = asyncHandler(async (req, res) => {
  const data = await getAdminDailySet(req.params.dayKey);
  res.json({ data });
});

export const assignDailySet = asyncHandler(async (req, res) => {
  const adminId = requireAdminId(req);
  const data = await assignAdminDailySet({
    adminId,
    dayKey: req.params.dayKey,
    questionIds: req.body.questionIds
  });
  res.json({ data });
});

export const deleteQuestion = asyncHandler(async (req, res) => {
  const data = await deleteAdminQuestion({
    adminId: requireAdminId(req),
    questionId: req.params.id
  });
  res.json({ data });
});
