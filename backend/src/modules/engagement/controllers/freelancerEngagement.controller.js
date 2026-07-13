import { asyncHandler } from "../../../utils/async-handler.js";
import { AppError } from "../../../utils/app-error.js";
import { v4 as uuidv4 } from "uuid";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, BUCKET_NAME, PUBLIC_URL_PREFIX } from "../../../lib/r2.js";
import {
  getContestById,
  getBadges,
  getEngagementDashboard,
  getProcessReport,
  createContestSubmission,
  listContestSubmissions,
  saveGrowthQuestServicePreference,
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
  const userId = requireUserId(req);
  const { questionId, idempotencyKey } = req.body;
  const files = req.files || [];

  const fileUrls = [];
  for (const file of files) {
    const fileId = uuidv4();
    const ext = file.originalname.split('.').pop() || "bin";
    const key = `freelancers/${userId}/daily-quests/${fileId}.${ext}`;
    
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );
    const prefix = (PUBLIC_URL_PREFIX || "").replace(/\/+$/, "");
    fileUrls.push({
      url: prefix ? `${prefix}/${key}` : key,
      name: file.originalname,
      size: file.size,
      type: file.mimetype
    });
  }

  const data = await submitDailyChallenge({
    userId,
    questionId,
    fileUrls,
    idempotencyKey
  });
  res.json({ data });
});

export const saveGrowthQuestService = asyncHandler(async (req, res) => {
  const data = await saveGrowthQuestServicePreference({
    userId: requireUserId(req),
    service: req.body.service
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

export const getContestDetails = asyncHandler(async (req, res) => {
  const data = await getContestById(req.params.id);
  res.json({ data });
});

export const getContestSubmissions = asyncHandler(async (req, res) => {
  const data = await listContestSubmissions({
    contestId: req.params.id,
    userId: requireUserId(req)
  });
  res.json({ data });
});

export const createContestSubmissionHandler = asyncHandler(async (req, res) => {
  const data = await createContestSubmission({
    userId: requireUserId(req),
    contestId: req.params.id,
    payload: req.body
  });
  res.status(201).json({ data });
});
