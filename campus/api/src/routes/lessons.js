import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { validate } from "../lib/validate.js";
import { httpError } from "../lib/errors.js";
import { requireAuth } from "../lib/auth.js";
import { awardPoints, touchStreak, POINTS } from "../lib/points.js";
import { notify } from "../lib/notify.js";
import { randomCode } from "../lib/util.js";
import { lessonFull, enrollmentOut, submissionOut, certificateOut, flatLessons, mentorRef } from "../lib/serialize.js";
import { getLessonWithCourse, findEnrollment } from "../services/courses.js";

const router = Router();

/* ───────────── lesson player ───────────── */

router.get("/api/lessons/:id", requireAuth, async (req, res) => {
  const { lesson, course } = await getLessonWithCourse(req.params.id);
  const enrollment = await findEnrollment(req.user.id, course.id);
  const isStaff = req.user.role === "ADMIN" || req.user.id === course.mentorId;
  // unpublished courses stay hidden from students (preview lessons included), as on GET /api/courses/:id
  if (course.status === "DRAFT" && !isStaff) throw httpError(404, "Lesson not found.");
  if (!enrollment && !lesson.isPreview && !isStaff) {
    throw httpError(403, "Enrol in this course to unlock this lesson.");
  }
  const all = flatLessons(course);
  const i = all.findIndex((l) => l.id === lesson.id);
  if (enrollment && enrollment.lastLessonId !== lesson.id) {
    await prisma.enrollment.update({ where: { id: enrollment.id }, data: { lastLessonId: lesson.id } });
  }
  res.json({
    ...lessonFull(lesson),
    completed: enrollment ? (enrollment.completedLessonIds || []).includes(lesson.id) : false,
    prevLessonId: all[i - 1]?.id ?? null,
    nextLessonId: all[i + 1]?.id ?? null,
  });
});

async function uniqueVerifyCode(tx) {
  for (;;) {
    const code = `CMP-${randomCode(4)}-${randomCode(4)}`;
    if (!(await tx.certificate.findUnique({ where: { verifyCode: code } }))) return code;
  }
}

router.post("/api/lessons/:id/complete", requireAuth, async (req, res) => {
  const { lesson, course } = await getLessonWithCourse(req.params.id);
  const userId = req.user.id;

  const result = await prisma.$transaction(async (tx) => {
    const enr = await findEnrollment(userId, course.id, tx);
    if (!enr) throw httpError(403, "Enroll in this course first.");
    const existingCert = () => tx.certificate.findUnique({ where: { userId_courseId: { userId, courseId: course.id } } });

    if ((enr.completedLessonIds || []).includes(lesson.id)) {
      const cert = await existingCert();
      return { enrollment: enrollmentOut(enr), pointsAwarded: 0, certificate: cert ? certificateOut(cert) : null };
    }

    const all = flatLessons(course);
    const ids = new Set([...(enr.completedLessonIds || []), lesson.id]);
    const completedLessonIds = all.filter((l) => ids.has(l.id)).map((l) => l.id);
    const progressPercent = Math.round((completedLessonIds.length / Math.max(1, all.length)) * 100);
    const finished = completedLessonIds.length >= all.length;
    const justFinished = finished && !enr.completedAt;

    let updated = await tx.enrollment.update({
      where: { id: enr.id },
      data: {
        completedLessonIds,
        progressPercent,
        lastLessonId: lesson.id,
        completedAt: justFinished ? new Date() : enr.completedAt,
      },
    });
    await tx.lessonCompletion.upsert({
      where: { userId_lessonId: { userId, lessonId: lesson.id } },
      create: { userId, lessonId: lesson.id, courseId: course.id, minutes: lesson.durationMinutes || 0 },
      update: {},
    });

    let pointsAwarded = POINTS.LESSON;
    await awardPoints(userId, POINTS.LESSON, "LESSON", `Completed “${lesson.title}”`, tx);
    await touchStreak(userId, tx);

    let certificate = null;
    if (justFinished) {
      pointsAwarded += POINTS.COURSE_COMPLETE;
      await awardPoints(userId, POINTS.COURSE_COMPLETE, "BONUS", `Finished ${course.title}`, tx);
      certificate = await existingCert();
      if (!certificate) {
        // Completion certificate only (spec §8): its score is the passed assessment total, or null until there is one.
        // It never creates a skill verification; that needs a passed, admin-approved assessment.
        const passedAttempt = await tx.assessmentAttempt.findFirst({
          where: { userId, assessment: { courseId: course.id }, status: { in: ["PASSED", "VERIFIED"] }, totalScore: { not: null } },
          orderBy: { reviewedAt: "desc" },
          select: { totalScore: true },
        });
        const score = passedAttempt?.totalScore ?? null;
        certificate = await tx.certificate.create({
          data: {
            userId,
            courseId: course.id,
            courseTitle: course.title,
            trackTitle: course.track?.title || "",
            mentorName: mentorRef(course.mentor)?.name || "",
            score,
            verifyCode: await uniqueVerifyCode(tx),
          },
        });
      }
      await notify(
        userId,
        {
          type: "COURSE",
          title: `Course complete: ${course.title}`,
          body: `Your course certificate (${certificate.verifyCode}) is ready. Next: take the final assessment to get your skill verified.`,
          link: `/app/assessments/${course.id}`,
        },
        tx,
      );
      updated = await tx.enrollment.findUnique({ where: { id: enr.id } });
    }
    return { enrollment: enrollmentOut(updated), pointsAwarded, certificate: certificate ? certificateOut(certificate) : null };
  });

  res.json(result);
});

const quizSchema = z.object({ answers: z.record(z.string(), z.string().nullable().optional()).default({}) });

router.post("/api/lessons/:id/quiz", requireAuth, validate({ body: quizSchema }), async (req, res) => {
  const { lesson, course } = await getLessonWithCourse(req.params.id);
  const questions = lesson.quiz?.questions;
  if (lesson.type !== "QUIZ" || !Array.isArray(questions)) throw httpError(400, "This lesson is not a quiz.");
  const enrollment = await findEnrollment(req.user.id, course.id);
  if (!enrollment && !lesson.isPreview) throw httpError(403, "Enroll in this course first.");

  const answers = req.body.answers || {};
  const results = questions.map((q) => ({
    questionId: q.id,
    correct: answers[q.id] != null && answers[q.id] === q.correctOptionId,
    correctOptionId: q.correctOptionId,
  }));
  const score = results.filter((r) => r.correct).length;
  const total = results.length;
  const passed = total > 0 && score / total >= 0.6;

  const pointsAwarded = await prisma.$transaction(async (tx) => {
    let pts = 0;
    if (passed && enrollment) {
      const passedBefore = await tx.quizAttempt.findFirst({ where: { userId: req.user.id, lessonId: lesson.id, passed: true } });
      if (!passedBefore) {
        pts = POINTS.QUIZ_PASS + (score === total ? POINTS.QUIZ_PERFECT_BONUS : 0);
        await awardPoints(req.user.id, pts, "QUIZ", `${score}/${total} on “${lesson.title}”`, tx);
      }
    }
    await tx.quizAttempt.create({ data: { userId: req.user.id, lessonId: lesson.id, score, total, passed, answers } });
    return pts;
  });

  res.json({ score, total, passed, results, pointsAwarded });
});

const submitSchema = z.object({
  text: z.string().trim().max(10000).optional().nullable(),
  link: z.string().trim().max(1000).optional().nullable(),
});

router.post("/api/lessons/:id/submit", requireAuth, validate({ body: submitSchema }), async (req, res) => {
  const { lesson, course } = await getLessonWithCourse(req.params.id);
  if (lesson.type !== "ASSIGNMENT") throw httpError(400, "This lesson is not an assignment.");
  const enrollment = await findEnrollment(req.user.id, course.id);
  if (!enrollment) throw httpError(403, "Enroll in this course first.");
  const text = req.body.text || null;
  const link = req.body.link || null;
  if (!text && !link) throw httpError(400, "Add a link or a short note to submit.");
  if (link && !/^https?:\/\/\S+\.\S+/.test(link)) throw httpError(400, "That link doesn't look right. It should start with https://");

  const rubric = Array.isArray(lesson.assignment?.rubric) ? lesson.assignment.rubric : [];
  const maxScore = rubric.reduce((s, r) => s + (Number(r.points) || 0), 0) || 100;

  const submission = await prisma.$transaction(async (tx) => {
    const first = !(await tx.submission.findFirst({ where: { userId: req.user.id, lessonId: lesson.id } }));
    const sub = await tx.submission.create({
      data: { userId: req.user.id, courseId: course.id, lessonId: lesson.id, lessonTitle: lesson.title, text, link, maxScore },
    });
    if (first) await awardPoints(req.user.id, POINTS.ASSIGNMENT_SUBMIT, "ASSIGNMENT", `Submitted “${lesson.title}”`, tx);
    await touchStreak(req.user.id, tx);
    if (course.mentorId) {
      await notify(
        course.mentorId,
        { type: "MENTOR", title: `New submission: ${lesson.title}`, body: `${req.user.name} submitted work in ${course.title}.`, link: "/app/mentor" },
        tx,
      );
    }
    return sub;
  });
  res.status(201).json(submissionOut(submission, req.user));
});

/* ───────────── my work ───────────── */

router.get("/api/me/submissions", requireAuth, async (req, res) => {
  const rows = await prisma.submission.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: "desc" } });
  res.json(rows.map((s) => submissionOut(s, req.user)));
});

router.get("/api/me/certificates", requireAuth, async (req, res) => {
  const rows = await prisma.certificate.findMany({ where: { userId: req.user.id }, orderBy: { issuedAt: "desc" } });
  res.json(rows.map(certificateOut));
});

router.get("/api/certificates/verify/:code", async (req, res) => {
  const code = req.params.code.trim().toUpperCase();
  const cert = await prisma.certificate.findFirst({
    where: { verifyCode: { equals: code, mode: "insensitive" } },
    include: { user: { select: { name: true } } },
  });
  if (!cert) throw httpError(404, "No certificate matches this code. Check it and try again.");
  res.json({ ...certificateOut(cert), userName: cert.user?.name || "Campus learner" });
});

export default router;
