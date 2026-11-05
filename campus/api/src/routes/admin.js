import { Router } from "express";
import crypto from "node:crypto";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { validate, zQ } from "../lib/validate.js";
import { httpError } from "../lib/errors.js";
import { requireAuth, requireRole } from "../lib/auth.js";
import { awardPoints, POINTS } from "../lib/points.js";
import { notify } from "../lib/notify.js";
import { audit } from "../lib/audit.js";
import { getSettings } from "../lib/settings.js";
import { COURSE_LEVELS, COURSE_STATUSES, levelDefaultsFor } from "../lib/catalog.js";
import { slugify } from "../lib/util.js";
import {
  publicUser,
  collegeOut,
  courseOut,
  trackOut,
  gigOut,
  applicationOut,
  submissionOut,
  USER_INCLUDE,
  COURSE_INCLUDE,
  COURSE_DETAIL_INCLUDE,
  GIG_INCLUDE,
} from "../lib/serialize.js";
import { payLaterSummary, PAY_LATER_PERCENT } from "../services/wallet.js";

const router = Router();
// Admin-only for everything here. /api/admin/{orders,support,reports} belong to other route files that also let
// FINANCE / PROJECT_MANAGER in (API_CONTRACT.md "Spec v1.0") and do their own requireAuth + requireRole, so they skip this guard.
const STAFF_SHARED = /^\/(orders|support|reports)(\/|\.|$)/;
const adminOnly = Router();
adminOnly.use(requireAuth, requireRole("ADMIN"));
router.use("/api/admin", (req, res, next) => (STAFF_SHARED.test(req.path) ? next() : adminOnly(req, res, next)));

const newId = (prefix) => `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
const ts = (v) => (v ? new Date(v).getTime() : 0);
const num = (v, fallback = 0) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : fallback);
const arr = (v) => (Array.isArray(v) ? v.filter((x) => x !== null && x !== undefined && x !== "") : []);

const COVER_PALETTE = [
  ["#FF5A1F", "#6B4EFF"],
  ["#1F9BFF", "#12A150"],
  ["#6B4EFF", "#E5484D"],
  ["#D98E00", "#FF5A1F"],
  ["#3CC6C0", "#1F9BFF"],
  ["#E5484D", "#C2793F"],
  ["#12A150", "#C8F542"],
  ["#14121F", "#6B4EFF"],
];
const PATTERNS = ["dots", "grid", "waves", "rings"];
const LESSON_TYPES = ["VIDEO", "ARTICLE", "QUIZ", "ASSIGNMENT"];
const APP_STATUSES = ["APPLIED", "ACCEPTED", "SUBMITTED", "APPROVED", "REJECTED", "PAID"];
const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];

/* ───────────── overview ───────────── */

router.get("/api/admin/overview", async (_req, res) => {
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const monthStart = new Date();
  monthStart.setHours(0, 0, 0, 0);
  monthStart.setDate(monthStart.getDate() - 29);

  const [students, enrollmentsCount, completedCount, paid, openGigs, pendingSubmissions, pendingColleges, activeSets, signups, enrollByCourse] =
    await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.enrollment.count(),
      prisma.enrollment.count({ where: { completedAt: { not: null } } }),
      prisma.user.aggregate({ _sum: { lifetimeEarnedINR: true } }),
      prisma.gig.count({ where: { status: "OPEN" } }),
      prisma.submission.count({ where: { status: "SUBMITTED" } }),
      prisma.college.count({ where: { verified: false } }),
      Promise.all([
        prisma.pointsEvent.findMany({ where: { createdAt: { gte: weekAgo } }, select: { userId: true }, distinct: ["userId"] }),
        prisma.submission.findMany({ where: { createdAt: { gte: weekAgo } }, select: { userId: true }, distinct: ["userId"] }),
        prisma.gigApplication.findMany({ where: { updatedAt: { gte: weekAgo } }, select: { userId: true }, distinct: ["userId"] }),
        prisma.enrollment.findMany({ where: { startedAt: { gte: weekAgo } }, select: { userId: true }, distinct: ["userId"] }),
        prisma.user.findMany({ where: { role: "STUDENT", OR: [{ streak: { gt: 0 } }, { lastActiveAt: { gte: weekAgo } }] }, select: { id: true } }),
      ]),
      prisma.user.findMany({ where: { role: "STUDENT", createdAt: { gte: monthStart } }, select: { createdAt: true } }),
      prisma.enrollment.groupBy({ by: ["courseId"], _count: { _all: true } }),
    ]);

  const studentIds = new Set((await prisma.user.findMany({ where: { role: "STUDENT" }, select: { id: true } })).map((u) => u.id));
  const active = new Set();
  activeSets.slice(0, 4).forEach((rows) => rows.forEach((r) => active.add(r.userId)));
  activeSets[4].forEach((r) => active.add(r.id));
  const activeThisWeek = [...active].filter((id) => studentIds.has(id)).length;

  const signupsByDay = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const start = d.getTime();
    const end = start + 86400000;
    signupsByDay.push({ date: d.toISOString().slice(0, 10), count: signups.filter((u) => ts(u.createdAt) >= start && ts(u.createdAt) < end).length });
  }

  const tracks = await prisma.track.findMany({ include: { courses: { select: { id: true, studentsCount: true } } } });
  const courseTrack = new Map(tracks.flatMap((t) => t.courses.map((c) => [c.id, t.id])));
  const byTrack = new Map();
  for (const g of enrollByCourse) {
    const tid = courseTrack.get(g.courseId);
    if (tid) byTrack.set(tid, (byTrack.get(tid) || 0) + g._count._all);
  }
  let topTracks = [...byTrack.entries()].map(([id, n]) => ({ title: tracks.find((t) => t.id === id)?.title || id, students: n }));
  if (!topTracks.length) topTracks = tracks.map((t) => ({ title: t.title, students: trackOut(t, t.courses).studentsCount }));
  topTracks = topTracks.sort((a, b) => b.students - a.students).slice(0, 6);

  const [recentEnrollments, recentSubs, recentApps, recentSignups] = await Promise.all([
    prisma.enrollment.findMany({ orderBy: { startedAt: "desc" }, take: 15, include: { user: { select: { name: true } }, course: { select: { title: true } } } }),
    prisma.submission.findMany({ orderBy: { createdAt: "desc" }, take: 15, include: { user: { select: { name: true } } } }),
    prisma.gigApplication.findMany({ orderBy: { updatedAt: "desc" }, take: 15, include: { user: { select: { name: true } }, gig: { select: { title: true } } } }),
    prisma.user.findMany({ where: { role: "STUDENT" }, orderBy: { createdAt: "desc" }, take: 15, include: { college: true } }),
  ]);
  const verb = (s) => (s === "PAID" ? "got paid for" : s === "APPROVED" ? "had work approved on" : s === "SUBMITTED" ? "submitted work for" : "applied to");
  const recentActivity = [
    ...recentEnrollments.map((e) => ({ id: `act_${e.id}`, type: "ENROLLMENT", text: `${e.user?.name || "A student"} enrolled in ${e.course?.title || "a course"}`, createdAt: e.startedAt })),
    ...recentSubs.map((s) => ({
      id: `act_${s.id}`,
      type: "SUBMISSION",
      text: `${s.user?.name || "A student"} submitted "${s.lessonTitle || "an assignment"}"${s.status === "REVIEWED" ? ` · scored ${s.score}/${s.maxScore}` : ""}`,
      createdAt: s.createdAt,
    })),
    ...recentApps.map((a) => ({ id: `act_${a.id}`, type: "GIG_APPLICATION", text: `${a.user?.name || "A student"} ${verb(a.status)} ${a.gig?.title || "a gig"}`, createdAt: a.updatedAt })),
    ...recentSignups.map((u) => ({ id: `act_${u.id}`, type: "SIGNUP", text: `${u.name} joined${u.college ? ` from ${u.college.shortName || u.college.name}` : ""}`, createdAt: u.createdAt })),
  ]
    .sort((a, b) => ts(b.createdAt) - ts(a.createdAt))
    .slice(0, 15);

  res.json({
    kpis: {
      students,
      activeThisWeek,
      enrollments: enrollmentsCount,
      completionRate: enrollmentsCount ? Math.round((completedCount / enrollmentsCount) * 100) : 0,
      paidOutINR: paid._sum.lifetimeEarnedINR || 0,
      openGigs,
      pendingSubmissions,
      pendingColleges,
    },
    signupsByDay,
    topTracks,
    recentActivity,
  });
});

/* ───────────── courses ───────────── */

const courseFieldsSchema = z
  .object({
    title: z.string().trim().max(200),
    subtitle: z.string().max(500),
    description: z.string().max(20000),
    trackId: z.string().trim(),
    mentorId: z.string().trim().nullable(),
    level: z.string().transform((v) => (COURSE_LEVELS.includes(v) ? v : "BEGINNER")),
    languages: z.array(z.any()).transform((v) => arr(v).map(String)),
    cover: z
      .object({ from: z.string().optional(), to: z.string().optional(), pattern: z.string().optional() })
      .passthrough()
      .transform((c) => ({ from: c.from || COVER_PALETTE[0][0], to: c.to || COVER_PALETTE[0][1], pattern: PATTERNS.includes(c.pattern) ? c.pattern : "dots" })),
    skills: z.array(z.any()).transform((v) => arr(v).map(String)),
    whatYouBuild: z.array(z.any()).transform((v) => arr(v).map(String)),
    requirements: z.array(z.any()).transform((v) => arr(v).map(String)),
    priceINR: z.coerce.number().transform((v) => Math.max(0, num(v))),
    payLater: z.coerce.boolean(),
    slug: z.string().trim().max(80),
    status: z.enum(COURSE_STATUSES),
    rating: z.coerce.number().min(0).max(5),
    modules: z.array(z.any()),
    // catalogue fields (spec §6, §6.2, §7.3, §7.4)
    skillId: z.string().trim().nullable().transform((v) => v || null),
    durationDays: z.coerce.number().int().min(1).max(365).nullable(),
    outcome: z.string().trim().max(240),
    whoFor: z.string().trim().max(1000),
    capacity: z
      .union([z.coerce.number().int().min(0).max(100000), z.null()])
      .transform((v) => (v ? v : null)),
    enrolmentOpensAt: z.union([z.null(), z.literal(""), z.coerce.date()]).transform((v) => (v ? v : null)),
    enrolmentClosesAt: z.union([z.null(), z.literal(""), z.coerce.date()]).transform((v) => (v ? v : null)),
  })
  .partial()
  .passthrough();

async function uniqueSlug(base, exceptId) {
  const root = slugify(base) || "course";
  let slug = root;
  for (let n = 2; await prisma.course.findFirst({ where: { slug, ...(exceptId ? { id: { not: exceptId } } : {}) }, select: { id: true } }); n++) {
    slug = `${root}-${n}`;
  }
  return slug;
}

function normalizeLesson(l, i, courseId, moduleId) {
  const type = LESSON_TYPES.includes(l?.type) ? l.type : "ARTICLE";
  const quiz =
    type === "QUIZ"
      ? {
          questions: arr(l?.quiz?.questions).map((q) => {
            const options = arr(q.options).map((o) => ({ id: o.id || newId("opt"), text: String(o.text ?? "") }));
            return {
              id: q.id || newId("q"),
              prompt: String(q.prompt ?? ""),
              options,
              correctOptionId: options.some((o) => o.id === q.correctOptionId) ? q.correctOptionId : options[0]?.id ?? null,
              explanation: String(q.explanation ?? ""),
            };
          }),
        }
      : null;
  const assignment =
    type === "ASSIGNMENT"
      ? {
          brief: String(l?.assignment?.brief ?? ""),
          rubric: arr(l?.assignment?.rubric).map((r) => ({ criterion: String(r.criterion ?? ""), points: num(r.points) })),
          submissionType: l?.assignment?.submissionType === "TEXT" ? "TEXT" : "LINK",
        }
      : null;
  return {
    id: l?.id || newId("les"),
    courseId,
    moduleId,
    title: String(l?.title || "Untitled lesson").slice(0, 200),
    type,
    durationMinutes: Math.max(0, num(l?.durationMinutes, 5)),
    order: i + 1,
    isPreview: !!l?.isPreview,
    content: String(l?.content ?? ""),
    videoUrl: l?.videoUrl || null,
    quiz,
    assignment,
  };
}

/** Replace a course's modules + lessons with the given tree (ids preserved where provided). */
async function writeModules(tx, courseId, modules) {
  const mods = arr(modules).map((m, i) => {
    const moduleId = m.id || newId("mod");
    return {
      module: { id: moduleId, courseId, title: String(m.title || `Module ${i + 1}`).slice(0, 200), order: i + 1 },
      lessons: arr(m.lessons).map((l, j) => normalizeLesson(l, j, courseId, moduleId)),
    };
  });
  const moduleIds = mods.map((m) => m.module.id);
  const lessonIds = mods.flatMap((m) => m.lessons.map((l) => l.id));
  // ids that belong to another course can't be reused
  const foreign = await tx.lesson.findMany({ where: { id: { in: lessonIds }, courseId: { not: courseId } }, select: { id: true } });
  const foreignMods = await tx.courseModule.findMany({ where: { id: { in: moduleIds }, courseId: { not: courseId } }, select: { id: true } });
  if (foreign.length || foreignMods.length) throw httpError(400, "Some modules or lessons belong to another course. Remove their ids to copy them.");

  await tx.lesson.deleteMany({ where: { courseId, id: { notIn: lessonIds } } });
  await tx.courseModule.deleteMany({ where: { courseId, id: { notIn: moduleIds } } });
  for (const { module, lessons } of mods) {
    await tx.courseModule.upsert({ where: { id: module.id }, create: module, update: { title: module.title, order: module.order } });
    for (const l of lessons) {
      // Json columns need Prisma.DbNull (not null) to be cleared
      const data = { ...l, quiz: l.quiz ?? Prisma.DbNull, assignment: l.assignment ?? Prisma.DbNull };
      const { id, ...rest } = data;
      await tx.lesson.upsert({ where: { id }, create: data, update: rest });
    }
  }
  const lessons = mods.flatMap((m) => m.lessons);
  await tx.course.update({
    where: { id: courseId },
    data: { lessonsCount: lessons.length, durationMinutes: lessons.reduce((s, l) => s + (l.durationMinutes || 0), 0) },
  });
}

const loadCourse = (id) => prisma.course.findUnique({ where: { id }, include: COURSE_DETAIL_INCLUDE });
const adminListCourse = (c, gstPercent) => ({ ...courseOut(c, { gstPercent }), modulesCount: c._count?.modules ?? 0, enrollment: null });
const adminCourseOut = (c, gstPercent) => ({ ...courseOut(c, { modules: true, fullLessons: true, gstPercent }), enrollment: null });

// audit snapshot: catalogue + commercial fields only (curriculum edits are summarised as counts)
const AUDIT_COURSE_KEYS = ["title", "slug", "trackId", "skillId", "mentorId", "level", "status", "priceINR", "durationDays", "capacity", "enrolmentOpensAt", "enrolmentClosesAt"];
const courseAuditView = (c) => ({ ...Object.fromEntries(AUDIT_COURSE_KEYS.map((k) => [k, c?.[k] ?? null])), lessonsCount: c?.lessonsCount ?? 0 });

async function checkCourseRefs(fields) {
  if (fields.skillId && !(await prisma.skill.findUnique({ where: { id: fields.skillId }, select: { id: true } }))) throw httpError(400, "Choose a skill from the catalogue.");
  const opens = fields.enrolmentOpensAt;
  const closes = fields.enrolmentClosesAt;
  if (opens && closes && new Date(opens) > new Date(closes)) throw httpError(400, "Enrolment must open before it closes.");
}

router.get("/api/admin/courses", async (_req, res) => {
  const courses = await prisma.course.findMany({
    include: { ...COURSE_INCLUDE, _count: { select: { modules: true, enrollments: true } } },
    orderBy: { createdAt: "desc" },
  });
  const settings = await getSettings();
  res.json(courses.map((c) => adminListCourse(c, settings["pricing.gstPercent"])));
});

router.post("/api/admin/courses", validate({ body: courseFieldsSchema }), async (req, res) => {
  const { modules, ...fields } = req.body;
  if (!fields.title?.trim()) throw httpError(400, "Give the course a title.");
  await checkCourseRefs(fields);
  const trackId = fields.trackId || (await prisma.track.findFirst({ orderBy: { order: "asc" }, select: { id: true } }))?.id;
  if (!trackId) throw httpError(400, "Create a track first.");
  const mentorId =
    fields.mentorId !== undefined ? fields.mentorId : (await prisma.user.findFirst({ where: { role: "MENTOR" }, select: { id: true } }))?.id ?? null;
  const [from, to] = pickRandom(COVER_PALETTE);
  const id = newId("crs");
  const slug = await uniqueSlug(fields.slug || fields.title);
  // spec §6.2: price and duration prefill from the level defaults (settings pricing.levelDefaults); new courses start as drafts
  const settings = await getSettings();
  const defaults = levelDefaultsFor(fields.level || "BEGINNER", settings);
  await prisma.$transaction(async (tx) => {
    const created = await tx.course.create({
      data: {
        id,
        subtitle: "",
        description: "",
        level: "BEGINNER",
        languages: ["en", "hinglish"],
        cover: { from, to, pattern: pickRandom(PATTERNS) },
        priceINR: defaults.priceINR,
        durationDays: defaults.durationDays,
        payLater: false,
        status: "DRAFT",
        ...pickCourseData(fields),
        trackId,
        mentorId,
        title: fields.title.trim(),
        slug,
      },
    });
    await writeModules(tx, id, modules);
    await audit(req, { action: "course.create", entity: "Course", entityId: id, after: courseAuditView(created) }, tx);
  });
  const course = await loadCourse(id);
  res.status(201).json(adminCourseOut(course, settings["pricing.gstPercent"]));
});

const COURSE_COLUMNS = [
  "title", "subtitle", "description", "trackId", "mentorId", "level", "languages", "cover", "skills", "whatYouBuild", "requirements",
  "priceINR", "payLater", "status", "rating",
  "skillId", "durationDays", "outcome", "whoFor", "capacity", "enrolmentOpensAt", "enrolmentClosesAt",
];
const pickCourseData = (fields) => Object.fromEntries(COURSE_COLUMNS.filter((k) => fields[k] !== undefined).map((k) => [k, fields[k]]));

router.get("/api/admin/courses/:id", async (req, res) => {
  const course = (await loadCourse(req.params.id)) || (await prisma.course.findUnique({ where: { slug: req.params.id }, include: COURSE_DETAIL_INCLUDE }));
  if (!course) throw httpError(404, "Course not found.");
  const settings = await getSettings();
  res.json(adminCourseOut(course, settings["pricing.gstPercent"]));
});

router.put("/api/admin/courses/:id", validate({ body: courseFieldsSchema }), async (req, res) => {
  const existing = await prisma.course.findUnique({ where: { id: req.params.id } });
  if (!existing) throw httpError(404, "Course not found.");
  const { modules, ...fields } = req.body;
  if (fields.title !== undefined && !String(fields.title).trim()) throw httpError(400, "Title can't be empty.");
  await checkCourseRefs({
    skillId: fields.skillId,
    enrolmentOpensAt: fields.enrolmentOpensAt !== undefined ? fields.enrolmentOpensAt : existing.enrolmentOpensAt,
    enrolmentClosesAt: fields.enrolmentClosesAt !== undefined ? fields.enrolmentClosesAt : existing.enrolmentClosesAt,
  });
  const slug = fields.slug ? await uniqueSlug(fields.slug, existing.id) : undefined;
  const before = courseAuditView(existing);
  await prisma.$transaction(async (tx) => {
    const updated = await tx.course.update({
      where: { id: existing.id },
      data: {
        ...pickCourseData(fields),
        ...(fields.title ? { title: fields.title.trim() } : {}),
        ...(slug ? { slug } : {}),
      },
    });
    if (modules !== undefined) await writeModules(tx, existing.id, modules);
    const after = courseAuditView(updated);
    const statusChanged = before.status !== after.status;
    await audit(
      req,
      { action: statusChanged ? "course.status" : "course.update", entity: "Course", entityId: existing.id, before, after },
      tx,
    );
  });
  const course = await loadCourse(existing.id);
  const settings = await getSettings();
  res.json(adminCourseOut(course, settings["pricing.gstPercent"]));
});

router.delete("/api/admin/courses/:id", async (req, res) => {
  const c = await prisma.course.findUnique({ where: { id: req.params.id } });
  if (!c) throw httpError(404, "Course not found.");
  // Orders, enrolments and assessment attempts cascade with the course: never destroy payment or result records.
  const [orders, enrollments, attempts] = await Promise.all([
    prisma.courseOrder.count({ where: { courseId: c.id, status: { not: "CANCELLED" } } }),
    prisma.enrollment.count({ where: { courseId: c.id } }),
    prisma.assessmentAttempt.count({ where: { assessment: { courseId: c.id } } }),
  ]);
  if (orders || enrollments || attempts) throw httpError(409, "This course has students, payments or assessment results. Archive it instead.");
  await prisma.$transaction(async (tx) => {
    await tx.course.delete({ where: { id: c.id } });
    await audit(req, { action: "course.delete", entity: "Course", entityId: c.id, before: courseAuditView(c) }, tx);
  });
  res.json({ ok: true });
});

router.get("/api/admin/tracks", async (_req, res) => {
  const tracks = await prisma.track.findMany({
    include: { courses: { select: { id: true, studentsCount: true }, orderBy: { createdAt: "asc" } } },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  res.json(tracks.map((t) => trackOut(t, t.courses)));
});

/* ───────────── gigs ───────────── */

const gigSchema = z
  .object({
    title: z.string().trim().max(200),
    company: z
      .object({ name: z.string().optional(), logoColor: z.string().optional() })
      .passthrough()
      .nullable()
      .transform((c) => ({ name: c?.name || "Campus partner", logoColor: c?.logoColor || "#6B4EFF" })),
    category: z.string().trim().max(60),
    skills: z.array(z.any()).transform((v) => arr(v).map(String)),
    payoutINR: z.coerce.number().transform((v) => Math.max(0, num(v))),
    durationDays: z.coerce.number().transform((v) => Math.max(1, num(v, 3))),
    difficulty: z.string().transform((v) => (["EASY", "MEDIUM", "HARD"].includes(v) ? v : "EASY")),
    minStage: z.coerce.number().transform((v) => (Number(v) === 4 ? 4 : 3)),
    status: z.string().transform((v) => (["OPEN", "CLOSED"].includes(v) ? v : "OPEN")),
    spots: z.coerce.number().transform((v) => Math.max(1, num(v, 1))),
    deadline: z.coerce.date().nullable(),
    description: z.string().max(20000),
    deliverables: z.array(z.any()).transform((v) => arr(v).map(String)),
    mentorId: z
      .string()
      .trim()
      .nullable()
      .transform((v) => v || null),
  })
  .partial()
  .strip();

router.get("/api/admin/gigs", async (_req, res) => {
  const gigs = await prisma.gig.findMany({ include: GIG_INCLUDE, orderBy: { createdAt: "desc" } });
  res.json(gigs.map((g) => gigOut(g)));
});

router.post("/api/admin/gigs", validate({ body: gigSchema }), async (req, res) => {
  if (!req.body.title?.trim()) throw httpError(400, "Give the gig a title.");
  const gig = await prisma.gig.create({
    data: {
      company: { name: "Campus partner", logoColor: "#6B4EFF" },
      category: "web-development",
      payoutINR: 500,
      durationDays: 5,
      spots: 3,
      deadline: new Date(Date.now() + 14 * 86400000),
      ...req.body,
      applicantsCount: 0,
    },
    include: GIG_INCLUDE,
  });
  await audit(req, { action: "gig.create", entity: "Gig", entityId: gig.id, after: { title: gig.title, payoutINR: gig.payoutINR, status: gig.status, spots: gig.spots } });
  res.status(201).json(gigOut(gig));
});

router.put("/api/admin/gigs/:id", validate({ body: gigSchema }), async (req, res) => {
  const prev = await prisma.gig.findUnique({ where: { id: req.params.id } });
  if (!prev) throw httpError(404, "Gig not found.");
  if (req.body.title !== undefined && !req.body.title.trim()) throw httpError(400, "Title can't be empty.");
  const gig = await prisma.gig.update({ where: { id: req.params.id }, data: req.body, include: GIG_INCLUDE });
  const keys = Object.keys(req.body);
  await audit(req, {
    action: "gig.update",
    entity: "Gig",
    entityId: gig.id,
    before: Object.fromEntries(keys.map((k) => [k, prev[k] ?? null])),
    after: Object.fromEntries(keys.map((k) => [k, gig[k] ?? null])),
  });
  res.json(gigOut(gig));
});

/* ───────────── gig applications ───────────── */

const APP_INCLUDE = { gig: { include: GIG_INCLUDE }, user: { include: USER_INCLUDE } };

router.get("/api/admin/gig-applications", validate({ query: z.object({ status: zQ }).passthrough() }), async (req, res) => {
  const status = req.q.status && APP_STATUSES.includes(req.q.status) ? req.q.status : undefined;
  const apps = await prisma.gigApplication.findMany({ where: status ? { status } : {}, include: APP_INCLUDE, orderBy: { updatedAt: "desc" } });
  res.json(apps.map((a) => applicationOut(a)));
});

const statusSchema = z.object({
  status: z.enum(APP_STATUSES, { errorMap: () => ({ message: "Unknown status." }) }),
  feedback: z.string().optional().nullable(),
});

const STATUS_COPY = {
  APPLIED: (t) => ["Application moved back to review", `Your application for "${t}" is back in review.`],
  ACCEPTED: (t) => ["You're in! Gig accepted 🎉", `You've been accepted for "${t}". Time to get to work.`],
  SUBMITTED: (t) => ["Submission received", `Your work for "${t}" is with the mentor.`],
  APPROVED: (t) => ["Work approved ✅", `Your work on "${t}" was approved. +${POINTS.GIG_APPROVED} points and a verified portfolio item.`],
  REJECTED: (t) => ["Application update", `Your application for "${t}" wasn't selected this time. Keep going.`],
  PAID: (t, note) => ["Payment sent 💸", `You got paid for "${t}".${note}`],
};

router.post("/api/admin/gig-applications/:id/status", validate({ body: statusSchema }), async (req, res) => {
  const app = await prisma.gigApplication.findUnique({ where: { id: req.params.id }, include: { gig: true } });
  if (!app) throw httpError(404, "Application not found.");
  const { status } = req.body;
  if (status === app.status) throw httpError(400, `This application is already ${status.toLowerCase()}.`);
  if (app.status === "PAID") throw httpError(400, "This application has already been paid out.");
  if (status === "PAID" && app.status !== "APPROVED") throw httpError(400, "Approve the work before marking it paid.");

  const gig = app.gig;
  const gigTitle = gig?.title || "your gig";
  const feedback = typeof req.body.feedback === "string" && req.body.feedback.trim() ? req.body.feedback.trim() : app.feedback ?? null;

  await prisma.$transaction(async (tx) => {
    await tx.gigApplication.update({
      where: { id: app.id },
      data: {
        status,
        feedback,
        ...(status === "APPROVED" && !app.approvedAt ? { approvedAt: new Date() } : {}),
        ...(status === "PAID" ? { paidAt: new Date() } : {}),
      },
    });
    const student = await tx.user.findUnique({ where: { id: app.userId } });
    if (!student) return;

    if (status === "APPROVED") {
      if (!app.approvedAt) await awardPoints(student.id, POINTS.GIG_APPROVED, "GIG", `Gig approved: ${gigTitle}`, tx);
      if (!(await tx.portfolioItem.findUnique({ where: { gigApplicationId: app.id } }))) {
        const [from, to] = COVER_PALETTE[(gigTitle.length + (gig?.skills?.length || 0)) % COVER_PALETTE.length];
        await tx.portfolioItem.create({
          data: {
            userId: student.id,
            title: gigTitle,
            description: `Paid micro-gig${gig?.company?.name ? ` for ${gig.company.name}` : ""}, reviewed and approved by a Campus mentor.${app.submissionNote ? ` ${app.submissionNote}` : ""}`,
            link: app.submissionLink || null,
            cover: { from, to },
            skills: arr(gig?.skills),
            verified: true,
            source: "GIG",
            gigApplicationId: app.id,
          },
        });
      }
      if ((student.ladderStage || 1) < 3) await tx.user.update({ where: { id: student.id }, data: { ladderStage: 3 } });
    }

    let paidNote = "";
    if (status === "PAID") {
      const payout = Math.max(0, Number(gig?.payoutINR) || 0);
      const { remainingINR: owed } = await payLaterSummary(student.id, tx);
      const deduction = owed > 0 ? Math.min(owed, Math.round((payout * PAY_LATER_PERCENT) / 100)) : 0;
      await tx.walletTxn.create({ data: { userId: student.id, type: "GIG_EARNING", amountINR: payout, note: `Gig payout: ${gigTitle}`, status: "COMPLETED" } });
      if (deduction > 0) {
        await tx.walletTxn.create({
          data: {
            userId: student.id,
            type: "COURSE_FEE_DEDUCTION",
            amountINR: -deduction,
            note: `Course fees: ${PAY_LATER_PERCENT}% of ${gigTitle} payout`,
            status: "COMPLETED",
          },
        });
      }
      await tx.user.update({
        where: { id: student.id },
        data: { walletBalanceINR: { increment: payout - deduction }, lifetimeEarnedINR: { increment: payout } },
      });
      paidNote = deduction > 0 ? ` ₹${payout - deduction} added to your wallet (₹${deduction} went to course fees).` : ` ₹${payout} added to your wallet.`;
    }

    await audit(
      req,
      {
        action: status === "PAID" ? "gig_application.payout" : "gig_application.status",
        entity: "GigApplication",
        entityId: app.id,
        before: { status: app.status },
        after: { status, ...(status === "PAID" ? { payoutINR: Math.max(0, Number(gig?.payoutINR) || 0) } : {}), ...(feedback ? { feedback } : {}) },
      },
      tx,
    );

    const [title, body] = STATUS_COPY[status](gigTitle, paidNote);
    await notify(
      student.id,
      {
        type: "GIG",
        title,
        body: feedback && status !== "PAID" ? `${body} Feedback: ${feedback}` : body,
        link: status === "PAID" ? "/app/wallet" : `/app/gigs/${app.gigId}`,
      },
      tx,
    );
  });

  const updated = await prisma.gigApplication.findUnique({ where: { id: app.id }, include: APP_INCLUDE });
  res.json(applicationOut(updated));
});

/* ───────────── people ───────────── */

const studentsQuery = z.object({ q: zQ, collegeId: zQ, stage: zQ }).passthrough();

router.get("/api/admin/students", validate({ query: studentsQuery }), async (req, res) => {
  const { q, collegeId, stage } = req.q;
  const contains = (v) => ({ contains: v, mode: "insensitive" });
  const users = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      ...(collegeId ? { collegeId } : {}),
      ...(stage && Number.isFinite(Number(stage)) ? { ladderStage: Number(stage) } : {}),
      ...(q
        ? {
            OR: [
              { name: contains(q) },
              { email: contains(q) },
              { username: contains(q) },
              { city: contains(q) },
              { college: { name: contains(q) } },
              { college: { shortName: contains(q) } },
            ],
          }
        : {}),
    },
    include: USER_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  res.json(users.map(publicUser));
});

const userPatchSchema = z.object({
  role: z.enum(["STUDENT", "MENTOR", "EVALUATOR", "PROJECT_MANAGER", "FINANCE", "ADMIN"], { errorMap: () => ({ message: "Unknown role." }) }).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"], { errorMap: () => ({ message: "Status must be ACTIVE or SUSPENDED." }) }).optional(),
});

router.patch("/api/admin/users/:id", validate({ body: userPatchSchema }), async (req, res) => {
  const me = req.user;
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) throw httpError(404, "User not found.");
  const patch = {};
  const { role, status } = req.body;
  if (role !== undefined) {
    if (target.id === me.id && role !== "ADMIN") throw httpError(400, "You can't remove your own admin access.");
    patch.role = role;
    if (role === "MENTOR" && !target.mentorProfile) {
      patch.mentorProfile = {
        headline: target.headline || `${target.skills?.[0] || "Campus"} mentor`,
        expertise: arr(target.skills).slice(0, 4),
        company: "Campus mentor",
        rating: 5,
        reviewsCount: 0,
        sessionsCount: 0,
        priceINR: 0,
        languages: [target.language || "en"],
        yearsExperience: 1,
        availability: [{ day: "SAT", slots: ["11:00", "17:00"] }],
      };
    }
  }
  if (status !== undefined) {
    if (target.id === me.id && status === "SUSPENDED") throw httpError(400, "You can't suspend yourself.");
    patch.status = status;
  }
  const updated = await prisma.user.update({ where: { id: target.id }, data: patch, include: USER_INCLUDE });
  // spec §15: access changes are audited (role → "user.role", suspend/reactivate → "user.status")
  if (patch.role && patch.role !== target.role) {
    await audit(req, { action: "user.role", entity: "User", entityId: target.id, before: { role: target.role }, after: { role: patch.role } });
  }
  if (patch.status && patch.status !== target.status) {
    await audit(req, { action: "user.status", entity: "User", entityId: target.id, before: { status: target.status }, after: { status: patch.status } });
  }
  if (patch.role && patch.role !== target.role) {
    await notify(target.id, {
      type: "SYSTEM",
      title: `Your role is now ${patch.role.toLowerCase()}`,
      body: "The Campus team updated your account.",
      link: patch.role === "MENTOR" ? "/app/mentor" : null,
    });
  }
  if (patch.status === "ACTIVE" && target.status === "SUSPENDED") {
    await notify(target.id, { type: "SYSTEM", title: "Your account is active again", body: "Welcome back. Chalo, let's continue.", link: "/app" });
  }
  res.json(publicUser(updated));
});

router.get("/api/admin/colleges", validate({ query: z.object({ verified: zQ }).passthrough() }), async (req, res) => {
  const v = req.q.verified;
  const colleges = await prisma.college.findMany({
    where: v === "true" ? { verified: true } : v === "false" ? { verified: false } : {},
  });
  colleges.sort((a, b) => (a.rank || 9999) - (b.rank || 9999));
  res.json(colleges.map(collegeOut));
});

const collegePatchSchema = z.object({
  verified: z.coerce.boolean().optional(),
  name: z.string().trim().max(160).optional(),
  city: z.string().trim().max(80).optional(),
});

router.patch("/api/admin/colleges/:id", validate({ body: collegePatchSchema }), async (req, res) => {
  const c = await prisma.college.findUnique({ where: { id: req.params.id } });
  if (!c) throw httpError(404, "College not found.");
  const patch = {};
  if (req.body.verified !== undefined) patch.verified = req.body.verified;
  if (req.body.name) patch.name = req.body.name;
  if (req.body.city) patch.city = req.body.city;
  const updated = await prisma.college.update({ where: { id: c.id }, data: patch });
  if (Object.keys(patch).length) {
    await audit(req, {
      action: patch.verified !== undefined && patch.verified !== c.verified ? (patch.verified ? "college.verify" : "college.unverify") : "college.update",
      entity: "College",
      entityId: c.id,
      before: Object.fromEntries(Object.keys(patch).map((k) => [k, c[k] ?? null])),
      after: patch,
    });
  }
  res.json(collegeOut(updated));
});

router.get("/api/admin/submissions", validate({ query: z.object({ status: zQ }).passthrough() }), async (req, res) => {
  const status = ["SUBMITTED", "REVIEWED"].includes(req.q.status) ? req.q.status : undefined;
  const subs = await prisma.submission.findMany({ where: status ? { status } : {}, include: { user: { include: USER_INCLUDE } }, orderBy: { createdAt: "desc" } });
  res.json(subs.map((s) => submissionOut(s)));
});

router.get("/api/admin/mentors", async (_req, res) => {
  const mentors = await prisma.user.findMany({ where: { role: "MENTOR" }, include: USER_INCLUDE });
  mentors.sort((a, b) => (b.mentorProfile?.rating || 0) - (a.mentorProfile?.rating || 0));
  res.json(mentors.map(publicUser));
});

export default router;
