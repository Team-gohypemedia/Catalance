import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { validate, zQ, zQEnum } from "../lib/validate.js";
import { httpError } from "../lib/errors.js";
import { requireAuth, optionalAuth } from "../lib/auth.js";
import { notify } from "../lib/notify.js";
import { courseOut, enrollmentOut, COURSE_INCLUDE } from "../lib/serialize.js";
import { getCourse, findEnrollment, enrollmentMap } from "../services/courses.js";
import { COURSE_LEVELS, LISTED_COURSE_STATUSES, LISTED_COURSE_WHERE, enrolmentOpen, levelDefaultsFor } from "../lib/catalog.js";
import { getSetting } from "../lib/settings.js";
import { assertCanEnrol, ensureEnrollment, findPaidOrder } from "../services/payments.js";

const router = Router();

const zQNum = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && Number.isFinite(Number(v)) ? Number(v) : undefined));

const listQuery = z
  .object({
    track: zQ,
    // catalogue filters (spec §13.1)
    category: zQ,
    skill: zQ,
    level: zQEnum(COURSE_LEVELS),
    maxDays: zQNum,
    minPrice: zQNum,
    maxPrice: zQNum,
    open: zQ,
    q: zQ,
    language: zQ,
    sort: zQEnum(["popular", "rating", "new", "price"]),
  })
  .passthrough();

const ORDER = {
  popular: [{ studentsCount: "desc" }],
  rating: [{ rating: "desc" }, { ratingsCount: "desc" }],
  new: [{ createdAt: "desc" }],
  price: [{ priceINR: "asc" }],
};

// Public lists hide DRAFT and ARCHIVED courses (spec §6.2). Detail pages of hidden courses are staff-only.
router.get("/api/courses", optionalAuth, validate({ query: listQuery }), async (req, res) => {
  const { track, category, skill, level, maxDays, minPrice, maxPrice, open, q, language, sort = "popular" } = req.q;
  const where = { ...LISTED_COURSE_WHERE };
  if (track) {
    const t = await prisma.track.findFirst({ where: { OR: [{ slug: track }, { id: track }] }, select: { id: true } });
    if (!t) return res.json([]);
    where.trackId = t.id;
  }
  if (skill) where.skill = { OR: [{ slug: skill }, { id: skill }] };
  else if (category) where.skill = { category: { OR: [{ slug: category }, { id: category }] } };
  if (level) where.level = level;
  if (language) where.languages = { has: language };
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.priceINR = { ...(minPrice !== undefined ? { gte: minPrice } : {}), ...(maxPrice !== undefined ? { lte: maxPrice } : {}) };
  }

  let courses = await prisma.course.findMany({ where, include: COURSE_INCLUDE, orderBy: ORDER[sort] });
  // durationDays falls back to the level default, so filter after loading
  const gstPercent = await getSetting("pricing.gstPercent");
  if (maxDays !== undefined) courses = courses.filter((c) => (c.durationDays ?? levelDefaultsFor(c.level).durationDays) <= maxDays);
  if (open === "1" || open === "true") courses = courses.filter((c) => enrolmentOpen(c));
  else if (open === "0" || open === "false") courses = courses.filter((c) => !enrolmentOpen(c));
  if (q) {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    courses = courses.filter((c) => {
      const hay = [c.title, c.subtitle, c.description, c.outcome, c.track?.title, c.skill?.name, c.skill?.category?.name, c.mentor?.name, ...(c.skills || [])]
        .join(" ")
        .toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }
  const enr = await enrollmentMap(req.user?.id, courses.map((c) => c.id));
  res.json(courses.map((c) => courseOut(c, { enrollment: enr.get(c.id) || null, gstPercent })));
});

router.get("/api/courses/:id", optionalAuth, async (req, res) => {
  const course = await getCourse(req.params.id);
  const isStaff = req.user && (req.user.role === "ADMIN" || req.user.id === course.mentorId);
  const enrollment = await findEnrollment(req.user?.id, course.id);
  // hidden courses: staff only; enrolled students keep access to an archived course they already joined
  if (!LISTED_COURSE_STATUSES.includes(course.status) && !isStaff && !(enrollment && course.status === "ARCHIVED")) {
    throw httpError(404, "Course not found.");
  }
  const gstPercent = await getSetting("pricing.gstPercent");
  res.json(courseOut(course, { enrollment, modules: true, gstPercent }));
});

// B (payments) owns this handler: free → enrol; paid → only with a PAID order (100% advance, spec §6.2) → else 402.
router.post("/api/courses/:id/enroll", requireAuth, async (req, res) => {
  const course = await getCourse(req.params.id);
  if (course.status === "DRAFT" || course.status === "ARCHIVED") throw httpError(404, "Course not found.");
  const existing = await findEnrollment(req.user.id, course.id);
  if (existing) return res.json(enrollmentOut(existing));

  // someone who already paid gets in even if the course filled up or closed since
  const paid = course.priceINR ? await findPaidOrder(req.user.id, course.id) : null;
  if (!paid) await assertCanEnrol(course);
  if (course.priceINR && !paid) throw httpError(402, "This course needs payment before you can start. Choose Enrol to see the price and pay.");

  const enrollment = await prisma.$transaction(async (tx) => {
    const { enrollment: e, created } = await ensureEnrollment(tx, course.id, req.user.id);
    if (created) {
      await notify(
        req.user.id,
        {
          type: "COURSE",
          title: `You're enrolled in ${course.title}`,
          body: paid ? "Your course is unlocked. Start with the first lesson." : "This course is free. Start with the first lesson.",
          link: `/app/courses/${course.id}`,
        },
        tx,
      );
    }
    return e;
  });
  res.status(201).json(enrollmentOut(enrollment));
});

router.get("/api/me/enrollments", requireAuth, async (req, res) => {
  const rows = await prisma.enrollment.findMany({
    where: { userId: req.user.id },
    include: { course: { include: COURSE_INCLUDE } },
    orderBy: { updatedAt: "desc" },
  });
  res.json(rows.map((e) => ({ ...enrollmentOut(e), course: courseOut(e.course, { enrollment: e }) })));
});

export default router;
