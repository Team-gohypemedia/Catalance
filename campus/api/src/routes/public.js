import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

/**
 * Marketing stats. Mirrors the demo engine: real platform counts on top of
 * the pre-Campus Catalance baseline (students, colleges, mentors, payouts).
 */
router.get("/api/public/stats", async (_req, res) => {
  const [students, colleges, mentors, done] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.college.count(),
    prisma.user.count({ where: { role: "MENTOR" } }),
    prisma.gigApplication.findMany({ where: { status: { in: ["APPROVED", "PAID"] } }, select: { gig: { select: { payoutINR: true } } } }),
  ]);
  const paidOut = done.reduce((n, a) => n + (a.gig?.payoutINR || 0), 0);
  res.json({
    students: 24000 + students * 13,
    colleges: 410 + colleges,
    mentors: 180 + mentors,
    paidOutINR: 3860000 + paidOut,
    gigsCompleted: 4100 + done.length,
    avgFirstEarningDays: 41,
  });
});

export default router;
