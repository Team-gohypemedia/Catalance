import { asyncHandler } from "../../../utils/async-handler.js";
import { AppError } from "../../../utils/app-error.js";
import {
  getBadges,
  getEngagementDashboard,
  getProcessReport,
  startDailyChallenge,
  submitDailyChallenge
} from "../services/engagement.service.js";

const requireUserId = (req) => {
  const userId = req.user?.sub || req.user?.id;
  if (!userId) {
    throw new AppError("Authentication required", 401);
  }
  return userId;
};

export const getDashboard = asyncHandler(async (req, res) => {
  const data = await getEngagementDashboard(requireUserId(req));
  res.json({ data });
});

export const startDaily = asyncHandler(async (req, res) => {
  const data = await startDailyChallenge(requireUserId(req));
  res.json({ data });
});

export const submitDaily = asyncHandler(async (req, res) => {
  const data = await submitDailyChallenge({
    userId: requireUserId(req),
    answers: req.body.answers,
    idempotencyKey: req.body.idempotencyKey
  });
  res.json({ data });
});

export const getProcessReportHandler = asyncHandler(async (req, res) => {
  const data = await getProcessReport(requireUserId(req));
  res.json({ data });
});

export const getBadgesHandler = asyncHandler(async (req, res) => {
  const data = await getBadges(requireUserId(req));
  res.json({ data });
});
