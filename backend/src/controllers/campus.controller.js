import { asyncHandler } from "../utils/async-handler.js";
import {
  getCampusSummaryForCatalanceUser,
  getVerifiedSkillsForCatalanceUser,
  listCampusTalent,
  listVerifiedCampusSkills,
} from "../services/campus-link.service.js";

// GET /api/campus/users/:userId/skills (public)
export const getUserCampusSkills = asyncHandler(async (req, res) => {
  const skills = await getVerifiedSkillsForCatalanceUser(req.params.userId);
  res.set("Cache-Control", "public, max-age=60");
  res.json({ data: skills });
});

// GET /api/campus/me/summary (signed in)
export const getMyCampusSummary = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?.sub;
  const summary = await getCampusSummaryForCatalanceUser(userId);
  res.set("Cache-Control", "private, no-store");
  res.json({ data: summary });
});

// GET /api/campus/talent?skill=&level= (project manager / admin)
export const getCampusTalent = asyncHandler(async (req, res) => {
  const [result, skills] = await Promise.all([
    listCampusTalent({ skill: req.query.skill, level: req.query.level }),
    listVerifiedCampusSkills(),
  ]);
  res.set("Cache-Control", "private, no-store");
  res.json({
    data: result.talent,
    meta: { available: result.available, skills },
  });
});
