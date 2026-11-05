import { prisma } from "../lib/prisma.js";
import { httpError } from "../lib/errors.js";
import { COURSE_DETAIL_INCLUDE, COURSE_INCLUDE } from "../lib/serialize.js";
import { LISTED_COURSE_WHERE } from "../lib/catalog.js";

/** Courses shown in lists (tracks, mentor pages, dashboard suggestions): hides DRAFT and ARCHIVED (spec §6.2). */
export const PUBLISHED = LISTED_COURSE_WHERE;

/** Course by id or slug (with modules + lessons by default). 404 if missing. */
export async function getCourse(idOrSlug, { detail = true, tx = prisma } = {}) {
  const include = detail ? COURSE_DETAIL_INCLUDE : COURSE_INCLUDE;
  const course =
    (await tx.course.findUnique({ where: { id: idOrSlug }, include })) ||
    (await tx.course.findUnique({ where: { slug: idOrSlug }, include }));
  if (!course) throw httpError(404, "Course not found.");
  return course;
}

/** Lesson plus its course (with all modules + lessons, ordered). 404 if missing. */
export async function getLessonWithCourse(lessonId, tx = prisma) {
  const lesson = await tx.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) throw httpError(404, "Lesson not found.");
  const course = await tx.course.findUnique({ where: { id: lesson.courseId }, include: COURSE_DETAIL_INCLUDE });
  const module = course.modules.find((m) => m.id === lesson.moduleId) || null;
  return { lesson, course, module };
}

export const findEnrollment = (userId, courseId, tx = prisma) =>
  userId ? tx.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } }) : null;

/** Map courseId → enrollment for a user (for list endpoints). */
export async function enrollmentMap(userId, courseIds) {
  if (!userId || !courseIds.length) return new Map();
  const rows = await prisma.enrollment.findMany({ where: { userId, courseId: { in: courseIds } } });
  return new Map(rows.map((e) => [e.courseId, e]));
}

/** Recompute lessonsCount and durationMinutes from the course's lessons. */
export async function recomputeCourseStats(courseId, tx = prisma) {
  const agg = await tx.lesson.aggregate({ where: { courseId }, _count: { _all: true }, _sum: { durationMinutes: true } });
  return tx.course.update({
    where: { id: courseId },
    data: { lessonsCount: agg._count._all, durationMinutes: agg._sum.durationMinutes || 0 },
  });
}

/** First not-completed lesson (or last opened / first) as a LessonSummary-ready row. */
export function nextLessonFor(lessons, enrollment) {
  const done = new Set(enrollment?.completedLessonIds || []);
  return (
    lessons.find((l) => !done.has(l.id)) ||
    lessons.find((l) => l.id === enrollment?.lastLessonId) ||
    lessons[0] ||
    null
  );
}
