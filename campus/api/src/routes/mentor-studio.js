import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { validate } from "../lib/validate.js";
import { httpError } from "../lib/errors.js";
import { requireAuth, requireRole } from "../lib/auth.js";
import { awardPoints, POINTS } from "../lib/points.js";
import { notify } from "../lib/notify.js";
import { audit } from "../lib/audit.js";
import { localDate } from "../lib/util.js";
import { bookingOut, submissionOut, peerUser, BOOKING_INCLUDE, USER_INCLUDE } from "../lib/serialize.js";
import { sortBookings, bookingTs } from "../services/bookings.js";

const router = Router();
const mentorOnly = [requireAuth, requireRole("MENTOR")];

const SUBMISSION_INCLUDE = {
  user: { include: USER_INCLUDE },
  course: { select: { title: true } },
  lesson: { select: { title: true, assignment: true } },
};

/** Submission + additive helpers for the mentor review UI (same as the demo engine). */
const studioSubmission = (s) => ({
  ...submissionOut(s, s.user),
  // mentors get a peer view of the student, not their contact details or money
  user: peerUser(s.user),
  lessonTitle: s.lessonTitle || s.lesson?.title || "Assignment",
  courseTitle: s.course?.title ?? null,
  brief: s.lesson?.assignment?.brief ?? null,
  rubric: Array.isArray(s.lesson?.assignment?.rubric) ? s.lesson.assignment.rubric : [],
});

router.get("/api/mentor/overview", ...mentorOnly, async (req, res) => {
  const user = req.user;
  const isAdmin = user.role === "ADMIN";
  const mine = await prisma.booking.findMany({ where: isAdmin ? {} : { mentorId: user.id }, include: BOOKING_INCLUDE });
  const upcomingSessions = sortBookings(mine.filter((b) => b.status === "UPCOMING" && bookingTs(b) > Date.now() - 3600000)).map(bookingOut);

  const pending = await prisma.submission.findMany({
    where: { status: "SUBMITTED", ...(isAdmin ? {} : { course: { mentorId: user.id } }) },
    include: SUBMISSION_INCLUDE,
    orderBy: { createdAt: "asc" },
  });

  const completed = mine.filter((b) => b.status === "COMPLETED");
  const profile = user.mentorProfile || {};
  const rate = Math.max(profile.priceINR || 0, 250); // free sessions earn a ₹250 Campus honorarium
  const reviewedByMe = await prisma.submission.findMany({ where: { reviewedById: user.id }, select: { userId: true } });
  const earningsINR = ((profile.sessionsCount || 0) + completed.length) * rate + reviewedByMe.length * 40;

  const myReplies = await prisma.reply.findMany({ where: { authorId: user.id }, select: { thread: { select: { authorId: true } } } });
  const helped = new Set([
    ...mine.filter((b) => b.status !== "CANCELLED").map((b) => b.userId),
    ...reviewedByMe.map((s) => s.userId),
    ...myReplies.map((r) => r.thread?.authorId).filter(Boolean),
  ]);
  helped.delete(user.id);

  const weekly = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const key = localDate(d);
    weekly.push({
      day: d.toLocaleDateString("en-IN", { weekday: "short" }),
      sessions: mine.filter((b) => b.status !== "CANCELLED" && b.date === key).length,
    });
  }

  res.json({
    upcomingSessions,
    pendingSubmissions: pending.map(studioSubmission),
    earningsINR,
    rating: profile.rating ?? null,
    studentsHelped: helped.size,
    weekly,
  });
});

const reviewSchema = z.object({
  score: z.coerce.number({ invalid_type_error: "Score must be a number." }).transform(Math.round),
  feedback: z
    .string({ required_error: "Write a little feedback — students learn the most from it." })
    .trim()
    .min(10, "Write a little feedback — students learn the most from it.")
    .max(5000),
});

router.post("/api/mentor/submissions/:id/review", ...mentorOnly, validate({ body: reviewSchema }), async (req, res) => {
  const user = req.user;
  const s = await prisma.submission.findUnique({
    where: { id: req.params.id },
    include: { course: { select: { id: true, title: true, mentorId: true, cover: true, skills: true } }, lesson: { select: { title: true } } },
  });
  if (!s) throw httpError(404, "Submission not found.");
  if (user.role !== "ADMIN" && s.course?.mentorId !== user.id) throw httpError(403, "You can only review submissions for your own courses.");
  if (s.status === "REVIEWED") throw httpError(400, "This submission is already reviewed.");
  const maxScore = s.maxScore || 100;
  const { score, feedback } = req.body;
  if (!Number.isFinite(score) || score < 0 || score > maxScore) throw httpError(400, `Score must be between 0 and ${maxScore}.`);
  const lessonTitle = s.lessonTitle || s.lesson?.title || "Assignment";
  const pts = Math.round((POINTS.ASSIGNMENT_REVIEWED_PER_SCORE * score * 100) / maxScore);

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.submission.update({
      where: { id: s.id },
      data: { status: "REVIEWED", score, feedback, reviewedById: user.id, reviewedAt: new Date() },
      include: SUBMISSION_INCLUDE,
    });
    await awardPoints(s.userId, pts, "ASSIGNMENT", `Mentor review: ${lessonTitle}`, tx);
    await tx.portfolioItem.upsert({
      where: { submissionId: s.id },
      update: {},
      create: {
        userId: s.userId,
        title: lessonTitle,
        description: `${s.course?.title ? `${s.course.title} · ` : ""}Reviewed by ${user.name}: scored ${score}/${maxScore}. ${feedback.slice(0, 160)}`,
        link: s.link ?? null,
        cover: { from: s.course?.cover?.from || "#FF5A1F", to: s.course?.cover?.to || "#6B4EFF" },
        skills: (s.course?.skills || []).slice(0, 4),
        verified: true,
        source: "ASSIGNMENT",
        submissionId: s.id,
      },
    });
    await notify(
      s.userId,
      {
        type: "COURSE",
        title: "Assignment reviewed ✅",
        body: `${user.name} scored "${lessonTitle}" ${score}/${maxScore}. It's now a verified piece in your Proof Portfolio. +${pts} pts`,
        link: "/app/portfolio",
      },
      tx,
    );
    await audit(
      req,
      { action: "submission.review", entity: "Submission", entityId: s.id, before: { status: s.status }, after: { status: "REVIEWED", score, maxScore } },
      tx,
    );
    return u;
  });
  res.json(studioSubmission(updated));
});

export default router;
