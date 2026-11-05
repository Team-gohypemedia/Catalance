import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { validate, zQ } from "../lib/validate.js";
import { httpError } from "../lib/errors.js";
import { stableHash } from "../lib/util.js";
import { collegeOut, peerUser, USER_INCLUDE } from "../lib/serialize.js";
import { collegeWithRank } from "../services/ranking.js";
import { getFlags } from "../lib/settings.js";

const router = Router();

// must be registered before /api/colleges/:id
router.get("/api/colleges/search", validate({ query: z.object({ q: zQ }).passthrough() }), async (req, res) => {
  const q = req.q.q;
  const colleges = await prisma.college.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { shortName: { contains: q, mode: "insensitive" } },
            { city: { contains: q, mode: "insensitive" } },
          ],
        }
      : {},
    orderBy: [{ verified: "desc" }, { rank: "asc" }, { name: "asc" }],
    take: 10,
  });
  res.json(colleges.map(collegeOut));
});

router.get("/api/colleges/:id", async (req, res) => {
  const college = await prisma.college.findUnique({ where: { id: req.params.id } });
  if (!college) throw httpError(404, "College not found.");
  // College rankings are gamification (spec §2: off for the MVP); without it only the plain college profile is public.
  if (!(await getFlags()).gamification) {
    return res.json({ ...collegeOut(college), totalPoints: null, avgPoints: null, rank: null, rankChange: null, topStudents: [], skillsBreakdown: [], monthlyPoints: [] });
  }
  const ranked = await collegeWithRank(college);
  const members = await prisma.user.findMany({
    where: { role: "STUDENT", collegeId: college.id },
    include: USER_INCLUDE,
    orderBy: { seasonPoints: "desc" },
  });

  const counts = new Map();
  const bump = (s) => counts.set(s, (counts.get(s) || 0) + 1);
  members.forEach((m) => (m.skills || []).forEach(bump));
  const verified = await prisma.portfolioItem.findMany({
    where: { verified: true, userId: { in: members.map((m) => m.id) } },
    select: { skills: true },
  });
  verified.forEach((p) => (p.skills || []).forEach(bump));
  const skillsBreakdown = [...counts.entries()]
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // 6-month trend ending at the live season total (same shape as the demo engine)
  const total = ranked.totalPoints || 0;
  const monthlyPoints = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    const noise = 0.88 + (stableHash(`${college.id}:${i}`) % 25) / 100;
    const points = i === 5 ? total : Math.round(total * (0.42 + i * 0.11) * noise);
    return { month: d.toLocaleDateString("en-IN", { month: "short" }), points };
  });

  res.json({
    ...collegeOut(ranked),
    topStudents: members.slice(0, 8).map(peerUser),
    skillsBreakdown,
    monthlyPoints,
  });
});

export default router;
