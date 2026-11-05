import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { httpError } from "../lib/errors.js";
import { publicUser, portfolioOut, certificateOut, badgeOut, collegeOut, USER_INCLUDE } from "../lib/serialize.js";
import { aspirantOf, prepTraits } from "../lib/aspirant.js";
import { collegeWithRank, studentRank } from "../services/ranking.js";
import { getFlags } from "../lib/settings.js";

const router = Router();

/** Public user for the passport: no contact details, money, availability, account settings or private aspirant profile. */
function passportUser(u) {
  // eslint-disable-next-line no-unused-vars
  const { email, phone, notificationPrefs, status, aspirant, walletBalanceINR, lifetimeEarnedINR, availability, coins, ...rest } = publicUser(u);
  return rest;
}

/** Public Preparation record (Aspirant mode). Never includes birthYear or attemptsUsed. */
async function preparationRecord(u) {
  const a = aspirantOf(u);
  if (!a || !a.showOnPassport) return null;
  const bridgeCourses = await prisma.enrollment.count({ where: { userId: u.id, course: { track: { forAspirants: true } } } });
  return {
    examName: a.examName,
    prepYears: a.prepYears,
    studyHoursTotal: a.studyHoursTotal,
    mockTestsTaken: a.mockTestsTaken,
    bestMockPercentile: a.bestMockPercentile,
    strengths: a.strengths,
    traits: prepTraits(a),
    bridgeCourses,
  };
}

/**
 * Skills listed on the passport. "verified" means an ACTIVE skill verification (passed assessment + admin approval,
 * spec §8); course certificates and reviewed portfolio work only raise the level, they never verify a skill.
 */
function deriveSkills(u, portfolio, certCourses, verifiedNames = new Set()) {
  const map = new Map();
  const add = (name, score, verified) => {
    if (!name) return;
    const k = String(name).trim();
    const e = map.get(k.toLowerCase()) || { name: k, score: 0, verified: false };
    e.score += score;
    e.verified = e.verified || verified;
    map.set(k.toLowerCase(), e);
  };
  (u.skills || []).forEach((s) => add(s, 1, false));
  portfolio.forEach((p) => (p.skills || []).forEach((s) => add(s, p.verified ? 1.5 : 0.5, false)));
  certCourses.forEach((c) => (c?.skills || []).forEach((s) => add(s, 1.5, false)));
  verifiedNames.forEach((name) => add(name, 2, true));
  return [...map.values()]
    .map((e) => ({ name: e.name, level: Math.max(1, Math.min(5, Math.round(1 + e.score))), verified: e.verified }))
    .sort((a, b) => Number(b.verified) - Number(a.verified) || b.level - a.level || a.name.localeCompare(b.name))
    .slice(0, 12);
}

router.get("/api/u/:username", async (req, res) => {
  const handle = String(req.params.username || "").trim();
  const u = await prisma.user.findFirst({
    where: { username: { equals: handle, mode: "insensitive" }, status: { not: "SUSPENDED" } },
    include: USER_INCLUDE,
  });
  if (!u) throw httpError(404, "We couldn't find a Skill Passport with that username.");

  const now = new Date();
  const [portfolio, certificates, badges, enrollments, gigsCompleted, accepted, helpEvents, prepRecord, verifications, flags] = await Promise.all([
    prisma.portfolioItem.findMany({ where: { userId: u.id }, orderBy: [{ verified: "desc" }, { createdAt: "desc" }] }),
    prisma.certificate.findMany({ where: { userId: u.id }, orderBy: { issuedAt: "desc" }, include: { course: { select: { skills: true } } } }),
    prisma.userBadge.findMany({ where: { userId: u.id }, orderBy: { earnedAt: "desc" } }),
    prisma.enrollment.count({ where: { userId: u.id, completedAt: { not: null } } }),
    prisma.gigApplication.count({ where: { userId: u.id, status: { in: ["APPROVED", "PAID"] } } }),
    prisma.reply.count({ where: { authorId: u.id, isAccepted: true } }),
    prisma.pointsEvent.count({ where: { userId: u.id, source: "HELP", points: { gt: 0 } } }),
    preparationRecord(u),
    prisma.skillVerification.findMany({
      where: { userId: u.id, status: "ACTIVE", OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      include: { skill: { select: { slug: true, name: true } } },
      orderBy: { awardedAt: "desc" },
    }),
    getFlags(),
  ]);
  const verifiedNames = new Set(verifications.map((v) => v.skill?.name?.trim()).filter(Boolean));

  res.json({
    user: passportUser(u),
    college: u.college ? collegeOut(await collegeWithRank(u.college)) : null,
    stats: {
      coursesCompleted: Math.max(enrollments, certificates.length),
      // legacy gig / wallet / rank numbers only while those features are switched on (spec §2, §9.4)
      gigsCompleted: flags.gigs ? gigsCompleted : null,
      earnedINR: flags.wallet ? u.lifetimeEarnedINR || 0 : null,
      seasonRank: flags.gamification && u.role === "STUDENT" ? await studentRank(u) : null,
      helpfulAnswers: Math.max(accepted, helpEvents),
    },
    portfolio: portfolio.map(portfolioOut),
    certificates: certificates.map(certificateOut),
    badges: flags.gamification ? badges.map(badgeOut) : [],
    // public skill badges (same fields as GET /api/verify/skill/:code): never evidence, history or ids
    verifications: verifications.map((v) => ({
      skill: v.skill ? { slug: v.skill.slug, name: v.skill.name } : null,
      level: v.level,
      awardedAt: v.awardedAt,
      expiresAt: v.expiresAt,
      verifyCode: v.verifyCode,
    })),
    skills: deriveSkills(u, portfolio, certificates.map((c) => c.course), verifiedNames),
    preparationRecord: prepRecord,
  });
});

export default router;
