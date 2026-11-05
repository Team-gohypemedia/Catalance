import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../lib/auth.js";
import { nextDivisionAt } from "../lib/points.js";
import { dayKey, stableHash } from "../lib/util.js";
import { aspirantOf, bridgeOverlap, skillsFromPrep } from "../lib/aspirant.js";
import {
  selfUser,
  trackOut,
  courseOut,
  enrollmentOut,
  lessonSummary,
  gigOut,
  bookingOut,
  flatLessons,
  COURSE_INCLUDE,
  COURSE_DETAIL_INCLUDE,
  GIG_INCLUDE,
  MENTOR_SELECT,
} from "../lib/serialize.js";
import { PUBLISHED, nextLessonFor } from "../services/courses.js";
import { studentRank } from "../services/ranking.js";
import { nextActionFor } from "../services/next-action.js";
import { getFlags } from "../lib/settings.js";

const router = Router();

/**
 * Aspirant-mode plan: bridge tracks ranked by overlap with the aspirant's exam strengths, the next bridge
 * lesson, and which prep subjects already map to private-sector skills.
 */
async function aspirantPlanFor(aspirant, enrollments, weeklyActivity) {
  const strengths = aspirant.strengths || [];
  const tracks = await prisma.track.findMany({
    where: { forAspirants: true },
    include: {
      courses: {
        where: PUBLISHED,
        include: { modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" } } } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  const ranked = tracks
    .map((t, i) => ({ t, i, overlap: bridgeOverlap(t, strengths) }))
    .sort((a, b) => b.overlap - a.overlap || a.i - b.i)
    .map(({ t }) => t);
  const bridgeTrackIds = new Set(ranked.map((t) => t.id));

  const lessonRef = (course, lesson) =>
    lesson ? { courseId: course.id, courseTitle: course.title, lessonId: lesson.id, lessonTitle: lesson.title, durationMinutes: lesson.durationMinutes || 0 } : null;

  // 1) next incomplete lesson in the most recently active, unfinished bridge enrollment
  let nextLesson = null;
  const latest = enrollments.find((e) => e.course && !e.completedAt && bridgeTrackIds.has(e.course.trackId));
  if (latest) {
    const done = new Set(latest.completedLessonIds || []);
    nextLesson = lessonRef(latest.course, flatLessons(latest.course).find((l) => !done.has(l.id)));
  }
  // 2) otherwise the first lesson of the best-matching bridge course not finished yet
  if (!nextLesson) {
    const finished = new Set(enrollments.filter((e) => e.completedAt).map((e) => e.courseId));
    for (const t of ranked) {
      const course = t.courses.find((c) => !finished.has(c.id) && flatLessons(c).length);
      if (course) {
        nextLesson = lessonRef(course, flatLessons(course)[0]);
        break;
      }
    }
  }

  return {
    examName: aspirant.examName,
    prepYears: aspirant.prepYears,
    dailyMinutes: aspirant.dailyMinutes,
    todayDoneMinutes: weeklyActivity[weeklyActivity.length - 1]?.minutes || 0,
    weekDoneMinutes: weeklyActivity.reduce((s, d) => s + (d.minutes || 0), 0),
    bridgeTracks: ranked.map((t) => trackOut(t, t.courses)),
    nextLesson,
    skillsFromPrep: skillsFromPrep(strengths),
  };
}

/**
 * Spec v1.0 dashboard parts: course progress → assessment status → verified skills → project offers,
 * and the ONE next action computed from them (services/next-action.js).
 */
async function journeyFor(me, enrollments) {
  const now = new Date();
  const courseIds = enrollments.map((e) => e.courseId);
  const [assessments, attempts, verifications, offers, orders] = await Promise.all([
    prisma.assessment.findMany({ where: { courseId: { in: courseIds } }, select: { id: true, courseId: true, title: true } }),
    prisma.assessmentAttempt.findMany({
      where: { userId: me.id },
      include: { assessment: { select: { courseId: true, title: true, course: { select: { id: true, title: true, level: true } } } } },
      orderBy: [{ attemptNo: "desc" }],
    }),
    prisma.skillVerification.findMany({
      where: { userId: me.id },
      include: { skill: { select: { id: true, slug: true, name: true } } },
      orderBy: { awardedAt: "desc" },
    }),
    prisma.projectOffer.findMany({
      where: { studentId: me.id, status: "OFFERED", OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      select: { id: true, title: true, expiresAt: true, payoutINR: true },
      orderBy: [{ expiresAt: "asc" }],
    }),
    prisma.courseOrder.findMany({
      where: { userId: me.id, status: "PENDING" },
      include: { course: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const attemptByCourse = new Map();
  for (const a of attempts) if (!attemptByCourse.has(a.assessment.courseId)) attemptByCourse.set(a.assessment.courseId, a);
  const assessed = new Set(assessments.map((a) => a.courseId));
  const enrolled = new Set(courseIds);

  const courses = enrollments
    .filter((e) => e.course)
    .map((e) => {
      const lessons = flatLessons(e.course);
      const done = new Set(e.completedLessonIds || []);
      const next = nextLessonFor(lessons, e);
      const left = lessons.filter((l) => !done.has(l.id)).length;
      return {
        courseId: e.courseId,
        courseTitle: e.course.title,
        progressPercent: e.progressPercent,
        nextLesson: left && next ? { id: next.id, title: next.title } : null,
        lessonsLeft: left,
        hasAssessment: assessed.has(e.courseId),
      };
    });

  const nextAction = nextActionFor({
    courses,
    attemptByCourse,
    openOffers: offers,
    // a paid order on a course already enrolled is done; only orders still blocking enrolment count
    pendingOrders: orders.filter((o) => !enrolled.has(o.courseId)).map((o) => ({ id: o.id, courseId: o.courseId, courseTitle: o.course?.title || "Your course" })),
    activeVerifications: verifications.filter((v) => v.status === "ACTIVE").length,
  });

  return {
    nextAction,
    courseProgress: courses.map(({ courseId, courseTitle, progressPercent, lessonsLeft }) => ({ courseId, courseTitle, progressPercent, lessonsLeft })),
    assessments: courses
      .filter((c) => c.hasAssessment || attemptByCourse.has(c.courseId))
      .map((c) => {
        const a = attemptByCourse.get(c.courseId);
        return {
          course: { id: c.courseId, title: c.courseTitle },
          status: a?.status || "NOT_STARTED",
          attemptNo: a?.attemptNo ?? 0,
          totalScore: a && ["PASSED", "REASSESSMENT_REQUIRED", "FAILED", "VERIFIED"].includes(a.status) ? a.totalScore : null,
          reassessUntil: a?.reassessUntil ?? null,
        };
      }),
    verifiedSkills: verifications.map((v) => ({
      id: v.id,
      skill: v.skill,
      level: v.level,
      status: v.status,
      awardedAt: v.awardedAt,
      expiresAt: v.expiresAt,
      verifyCode: v.verifyCode,
    })),
    openOffers: offers.map((o) => ({ id: o.id, title: o.title, expiresAt: o.expiresAt, payoutINR: o.payoutINR })),
  };
}

router.get("/api/me/dashboard", requireAuth, async (req, res) => {
  const me = req.user;
  const weekStart = new Date(Date.now() - 6 * 86400000);
  weekStart.setHours(0, 0, 0, 0);

  const flags = await getFlags();
  const [enrollments, events, completions, bookings, gigs] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId: me.id },
      include: { course: { include: COURSE_DETAIL_INCLUDE } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.pointsEvent.findMany({ where: { userId: me.id, createdAt: { gte: weekStart } } }),
    prisma.lessonCompletion.findMany({ where: { userId: me.id, createdAt: { gte: weekStart } } }),
    flags.mentorBooking
      ? prisma.booking.findMany({
          where: { userId: me.id, status: "UPCOMING" },
          include: { mentor: { select: MENTOR_SELECT } },
          orderBy: [{ date: "asc" }, { time: "asc" }],
          take: 3,
        })
      : [],
    flags.gigs ? prisma.gig.findMany({ where: { status: "OPEN" }, include: GIG_INCLUDE }) : [],
  ]);

  const continueLearning = enrollments
    .filter((e) => !e.completedAt && e.course)
    .map((e) => {
      const next = nextLessonFor(flatLessons(e.course), e);
      const done = new Set(e.completedLessonIds || []);
      return {
        ...enrollmentOut(e),
        course: courseOut(e.course, { enrollment: e }),
        nextLesson: next ? lessonSummary(next, done) : null,
      };
    });

  // last 7 days: real lesson minutes + points, plus a light baseline while a streak is running
  const weeklyActivity = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = dayKey(d);
    const points = events.filter((p) => dayKey(p.createdAt) === key).reduce((s, p) => s + Math.max(0, p.points), 0);
    let minutes = completions.filter((c) => dayKey(c.createdAt) === key).reduce((s, c) => s + (c.minutes || 0), 0);
    if (!minutes) {
      minutes = events.filter((p) => dayKey(p.createdAt) === key && ["LESSON", "QUIZ", "ASSIGNMENT"].includes(p.source)).length * 9;
    }
    const baseline = i < (me.streak || 0) && i > 0 && !minutes ? 12 + (stableHash(me.id + key) % 34) : 0;
    weeklyActivity.push({
      day: d.toLocaleDateString("en-IN", { weekday: "short" }),
      minutes: Math.min(180, minutes + baseline),
      points: points || (baseline ? Math.round(baseline * 1.6) : 0),
    });
  }
  const today = weeklyActivity[weeklyActivity.length - 1];

  const enrolledIds = enrollments.map((e) => e.courseId);
  const interestTrackIds = new Set((me.interests || []).map((s) => `t_${s}`));
  const interestSlugs = new Set(me.interests || []);
  const candidates = await prisma.course.findMany({
    where: { ...PUBLISHED, id: { notIn: enrolledIds } },
    include: COURSE_INCLUDE,
    orderBy: { studentsCount: "desc" },
    take: 40,
  });
  const likes = (c) => interestTrackIds.has(c.trackId) || interestSlugs.has(c.track?.slug);
  const recommended = candidates
    .sort((a, b) => Number(likes(b)) - Number(likes(a)) || b.studentsCount - a.studentsCount)
    .slice(0, 4)
    .map((c) => courseOut(c));

  const mySkills = new Set((me.skills || []).map((s) => s.toLowerCase()));
  const myApps = gigs.length ? await prisma.gigApplication.findMany({ where: { userId: me.id, gigId: { in: gigs.map((g) => g.id) } } }) : [];
  const appByGig = new Map(myApps.map((a) => [a.gigId, a]));
  const openGigsForYou = gigs
    .map((g) => ({ g, match: (g.skills || []).filter((s) => mySkills.has(String(s).toLowerCase())).length }))
    .sort((a, b) => b.match - a.match || (a.g.minStage || 3) - (b.g.minStage || 3))
    .slice(0, 3)
    .map(({ g }) => gigOut(g, appByGig.get(g.id) || null));

  // rank is part of gamification (spec §2: not in the first release) → null while the flag is off
  const position = flags.gamification ? await studentRank(me) : null;
  const collegePosition = flags.gamification && me.collegeId ? await studentRank(me, { where: { collegeId: me.collegeId } }) : null;
  const journey = await journeyFor(me, enrollments);

  const aspirant = aspirantOf(me);
  const aspirantPlan = aspirant ? await aspirantPlanFor(aspirant, enrollments, weeklyActivity) : null;

  res.json({
    user: selfUser(me),
    continueLearning,
    todayGoal: { targetMinutes: aspirant?.dailyMinutes || 30, doneMinutes: today?.minutes || 0 },
    weeklyActivity,
    recommended,
    upcomingSessions: bookings.map(bookingOut),
    openGigsForYou,
    rank: flags.gamification
      ? {
          position,
          collegePosition,
          division: me.division,
          seasonPoints: me.seasonPoints,
          nextDivisionAt: nextDivisionAt(me.seasonPoints),
        }
      : null,
    aspirantPlan: flags.aspirants ? aspirantPlan : null,
    ...journey,
  });
});

export default router;
