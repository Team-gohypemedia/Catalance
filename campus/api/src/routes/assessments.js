import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma.js";
import { validate, zQ } from "../lib/validate.js";
import { httpError } from "../lib/errors.js";
import { requireAuth, requireRole } from "../lib/auth.js";
import { notify } from "../lib/notify.js";
import { audit } from "../lib/audit.js";
import { getSettings } from "../lib/settings.js";
import { getCourse, findEnrollment } from "../services/courses.js";
import {
  ASSESSMENT_INCLUDE,
  STAFF_ATTEMPT_INCLUDE,
  assertCanEvaluate,
  decideResult,
  defaultRubric,
  ensureAssessment,
  expiryFrom,
  normaliseCriteria,
  queueScope,
  rulesFor,
  scoreAgainst,
  sendReassessReminders,
  stateFor,
  uniqueSkillCode,
  windowOpen,
  withHistory,
} from "../services/assessment.js";
import { storage, storageConfigured, assertStorage } from "../lib/storage.js";
import { MAX_FILES, MAX_UPLOAD_BYTES, STORED_TYPES, UPLOAD_TYPES, attemptIdOfKey, attemptKey, checkUpload, extOf, uploadRules } from "../lib/uploads.js";
import { assessmentAdmin, assessmentPublic, attemptOut, rubricOut, verificationOut, verificationPublic, verificationStatus } from "../lib/serialize-assessment.js";

/**
 * Assessment, rubrics and skill verification (spec §8, §5.1 steps 9–13). Contract: API_CONTRACT.md "Spec v1.0".
 * Paying for or finishing a course never creates a SkillVerification: only an admin approval of a PASSED attempt does.
 */
const router = Router();

const limiter = (limit, message) =>
  rateLimit({ windowMs: 10 * 60 * 1000, limit, standardHeaders: "draft-7", legacyHeaders: false, keyGenerator: (req) => req.user?.id || req.ip, message: { error: { message } } });
const submitLimit = limiter(20, "Too many submissions. Please wait a few minutes.");
const appealLimit = limiter(5, "Too many requests. Please wait a few minutes.");
const uploadLimit = limiter(40, "Too many uploads. Please wait a few minutes.");
const fileLimit = limiter(120, "Too many requests. Please wait a few minutes.");

const STAFF = ["EVALUATOR", "MENTOR"]; // + ADMIN (requireRole lets admins through)
const DAY = 86400000;

/* ───────────── helpers ───────────── */

const STUDENT_ATTEMPT_INCLUDE = {
  rubric: true,
  verification: { select: { id: true } },
  assessment: { include: { rubric: true, course: { select: { id: true, title: true, level: true, skill: { select: { id: true, slug: true, name: true } } } } } },
};

const myAttempts = (userId, assessmentId, tx = prisma) =>
  tx.assessmentAttempt.findMany({ where: { userId, assessmentId }, orderBy: { attemptNo: "desc" }, include: STUDENT_ATTEMPT_INCLUDE });

/** The student's own attempt — 404 for anyone else's (never reveal it exists). */
async function ownAttempt(req, tx = prisma) {
  const a = await tx.assessmentAttempt.findUnique({ where: { id: req.params.id }, include: STUDENT_ATTEMPT_INCLUDE });
  if (!a || a.userId !== req.user.id) throw httpError(404, "Attempt not found.");
  return a;
}

async function staffAttempt(req, tx = prisma) {
  const a = await tx.assessmentAttempt.findUnique({ where: { id: req.params.id }, include: STAFF_ATTEMPT_INCLUDE });
  if (!a) throw httpError(404, "Attempt not found.");
  assertCanEvaluate(req.user, a);
  return a;
}

const staffOut = (a) => attemptOut(a, { staff: true });
const studentOut = (a) => attemptOut(a);
const snapshot = (a) => ({ status: a.status, totalScore: a.totalScore, passed: a.passed, evaluatorId: a.evaluatorId, rubricId: a.rubricId });

async function notifyAdmins(payload, tx = prisma) {
  const admins = await tx.user.findMany({ where: { role: "ADMIN", status: { not: "SUSPENDED" } }, select: { id: true }, take: 20 });
  for (const a of admins) await notify(a.id, payload, tx);
}

/* ───────────── student: assessments ───────────── */

router.get("/api/me/assessments", requireAuth, async (req, res) => {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: req.user.id },
    include: { course: { select: { id: true, title: true, level: true, slug: true } } },
    orderBy: { startedAt: "desc" },
  });
  await sendReassessReminders({ userId: req.user.id }).catch(() => 0);
  const settings = await getSettings();
  const rows = [];
  for (const e of enrollments) {
    const assessment = await ensureAssessment(e.course);
    const attempts = await myAttempts(req.user.id, assessment.id);
    const state = stateFor({ assessment, attempts, enrollment: e, settings });
    rows.push({
      course: { id: e.course.id, title: e.course.title, level: e.course.level },
      assessment: assessmentPublic(assessment, { enrollment: e }),
      attempt: attempts[0] ? studentOut(attempts[0]) : null,
      status: state.status,
      progressPercent: e.progressPercent,
      reassessUntil: state.reassessUntil,
    });
  }
  res.json(rows);
});

router.get("/api/courses/:id/assessment", requireAuth, async (req, res) => {
  const course = await getCourse(req.params.id, { detail: false });
  const enrollment = await findEnrollment(req.user.id, course.id);
  if (!enrollment && req.user.role === "STUDENT") throw httpError(403, "Enrol in this course to see its assessment.");
  await sendReassessReminders({ userId: req.user.id }).catch(() => 0);
  const assessment = await ensureAssessment(course);
  const attempts = await myAttempts(req.user.id, assessment.id);
  const settings = await getSettings();
  const state = stateFor({ assessment, attempts, enrollment, settings });
  res.json({
    course: { id: course.id, title: course.title, level: course.level, progressPercent: enrollment?.progressPercent ?? 0 },
    assessment: assessmentPublic(assessment, { enrollment }),
    attempts: attempts.map(studentOut),
    status: state.status,
    canStart: state.canStart,
    canSubmit: state.canSubmit,
    canReassess: state.canReassess,
    canAppeal: state.canAppeal,
    canOnboard: state.canOnboard,
    attemptsLeft: state.attemptsLeft,
    reassessUntil: state.reassessUntil,
    dueAt: state.dueAt,
    uploads: uploadRules(storageConfigured()),
  });
});

router.post("/api/courses/:id/assessment/start", requireAuth, async (req, res) => {
  const course = await getCourse(req.params.id, { detail: false });
  const attempt = await prisma.$transaction(async (tx) => {
    const enrollment = await findEnrollment(req.user.id, course.id, tx);
    if (!enrollment) throw httpError(403, "Enrol in this course to start its assessment.");
    const assessment = await ensureAssessment(course, tx);
    const attempts = await myAttempts(req.user.id, assessment.id, tx);
    const latest = attempts[0];
    if (latest?.status === "IN_PROGRESS") return latest; // idempotent
    const state = stateFor({ assessment, attempts, enrollment, settings: await getSettings() });
    if (!state.canStart) {
      if (!latest && state.dueAt) throw httpError(403, "The deadline for this assessment has passed. Contact support if you need help.");
      if (latest?.status === "REASSESSMENT_REQUIRED" && !windowOpen(latest)) throw httpError(403, "Your reassessment window has closed. You can still appeal the result.");
      throw httpError(409, "You can't start a new attempt right now.");
    }
    const attemptNo = (latest?.attemptNo || 0) + 1;
    // carry the last submission forward as a starting draft for a reassessment
    const submission = latest ? { text: latest.submission?.text || "", links: latest.submission?.links || [], files: latest.submission?.files || [] } : { text: "", links: [], files: [] };
    return tx.assessmentAttempt.create({
      data: {
        assessmentId: assessment.id,
        userId: req.user.id,
        attemptNo,
        status: "IN_PROGRESS",
        submission,
        rubricId: assessment.rubricId, // the version the student was briefed with is the version they are scored with
        history: [{ status: "IN_PROGRESS", at: new Date().toISOString(), by: req.user.id, note: attemptNo > 1 ? "Reassessment started" : null }],
      },
      include: STUDENT_ATTEMPT_INCLUDE,
    });
  });
  res.status(201).json(studentOut(attempt));
});

const zUrl = z.string().trim().max(1000).regex(/^https?:\/\/\S+\.\S+/, "Links must start with https://");

/** A file in a submission: a private storage key from POST /api/attempts/:id/uploads (never a public URL). */
const zFile = z.object({
  key: z.string().trim().min(1).max(300),
  name: z.string().trim().min(1).max(200),
  size: z.number().int().min(1).max(MAX_UPLOAD_BYTES, `Files must be ${MAX_UPLOAD_BYTES / 1024 / 1024} MB or smaller.`),
  type: z.enum(STORED_TYPES, { message: "That file type isn't allowed." }),
});

const draftSchema = z.object({
  text: z.string().max(20000).optional(),
  links: z.array(zUrl).max(10).optional(),
  files: z.array(zFile).max(MAX_FILES, `Add up to ${MAX_FILES} files.`).optional(),
});

/**
 * Check submission files against the storage rules. Keys must be submission keys of this student's attempts on this
 * assessment (a reassessment carries the last attempt's files forward). Files new to this draft must exist in storage;
 * their size is taken from storage, not from the client.
 */
async function checkFiles(a, files) {
  const known = new Map((a.submission?.files || []).filter((f) => f?.key).map((f) => [f.key, f]));
  const seen = new Set();
  let siblings = null;
  const out = [];
  for (const f of files) {
    if (seen.has(f.key)) continue; // the same file twice → once
    seen.add(f.key);
    const owner = attemptIdOfKey(f.key);
    if (!owner) throw httpError(400, "Upload the file again: its storage key isn't valid.");
    const rule = UPLOAD_TYPES[extOf(f.name)];
    if (!rule || rule.type !== f.type) throw httpError(400, `“${f.name}”: that file type isn't allowed.`);
    if (known.has(f.key)) {
      out.push({ ...known.get(f.key), name: f.name }); // renaming is fine; size and type stay as verified
      continue;
    }
    if (owner !== a.id) {
      siblings ??= new Set((await prisma.assessmentAttempt.findMany({ where: { userId: a.userId, assessmentId: a.assessmentId }, select: { id: true } })).map((x) => x.id));
      if (!siblings.has(owner)) throw httpError(400, "Upload the file again: it doesn't belong to this assessment.");
    }
    out.push({ ...f, fresh: true });
  }
  if (out.some((f) => f.fresh)) {
    assertStorage();
    for (const f of out.filter((x) => x.fresh)) {
      const head = await storage.head(f.key);
      if (!head) throw httpError(400, `“${f.name}” hasn't finished uploading. Upload it again.`);
      if (head.size > MAX_UPLOAD_BYTES) {
        await storage.remove(f.key);
        throw httpError(400, `“${f.name}” is larger than ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`);
      }
      if (head.size) f.size = head.size;
    }
  }
  return out.map((f) => ({ key: f.key, name: f.name, size: f.size, type: f.type }));
}

function checkFormats(assessment, sub) {
  const allowed = new Set(assessment.allowedFormats || []);
  if (sub.links?.length && !allowed.has("link")) throw httpError(400, "Links aren't accepted for this assessment.");
  if (sub.files?.length && !allowed.has("file")) throw httpError(400, "Files aren't accepted for this assessment.");
  if (sub.text?.trim() && !allowed.has("text") && !allowed.has("link") && !allowed.has("file")) throw httpError(400, "Text isn't accepted for this assessment.");
}

router.put("/api/attempts/:id/submission", requireAuth, validate({ body: draftSchema }), async (req, res) => {
  const a = await ownAttempt(req);
  if (a.status !== "IN_PROGRESS") throw httpError(409, "This attempt is submitted and locked.");
  const next = { ...a.submission, ...Object.fromEntries(Object.entries(req.body).filter(([, v]) => v !== undefined)) };
  checkFormats(a.assessment, next);
  if (req.body.files) next.files = await checkFiles(a, req.body.files);
  const updated = await prisma.assessmentAttempt.update({ where: { id: a.id }, data: { submission: next }, include: STUDENT_ATTEMPT_INCLUDE });
  res.json(studentOut(updated));
});

/**
 * Start a private upload (spec §15). Validates against the allow-list and size limit, then returns a presigned PUT
 * (10 min). The client PUTs the bytes with the returned headers, then saves { key, name, size, type } in submission.files.
 */
router.post(
  "/api/attempts/:id/uploads",
  requireAuth,
  uploadLimit,
  validate({ body: z.object({ name: z.string().max(300), type: z.string().max(200).optional().default(""), size: z.number() }) }),
  async (req, res) => {
    const a = await ownAttempt(req);
    if (a.status !== "IN_PROGRESS") throw httpError(409, "This attempt is submitted and locked.");
    if (!(a.assessment.allowedFormats || []).includes("file")) throw httpError(400, "Files aren't accepted for this assessment.");
    if ((a.submission?.files || []).length >= MAX_FILES) throw httpError(409, `You can add up to ${MAX_FILES} files.`);
    const file = checkUpload(req.body);
    assertStorage();
    const key = attemptKey(a.id, file.name);
    const { url, expiresAt } = await storage.presignPut({ key, type: file.type, size: file.size });
    res.status(201).json({ uploadUrl: url, method: "PUT", headers: { "Content-Type": file.type }, expiresAt, file: { key, ...file } });
  },
);

/**
 * Open one submitted file: a presigned GET valid 10 minutes ({ url, expiresAt }, or a 302 with ?redirect=1).
 * Only the student, the evaluator assigned to (or claiming) the attempt, the course's mentor, or an admin. 404 otherwise.
 */
router.get("/api/attempts/:id/files/:index", requireAuth, fileLimit, async (req, res) => {
  const a = await prisma.assessmentAttempt.findUnique({ where: { id: req.params.id }, include: { assessment: { select: { course: { select: { mentorId: true } } } } } });
  const u = req.user;
  const allowed = a && (a.userId === u.id || u.role === "ADMIN" || (a.evaluatorId && a.evaluatorId === u.id) || (u.role === "MENTOR" && a.assessment?.course?.mentorId === u.id));
  if (!allowed) throw httpError(404, "File not found.");
  const index = Number(req.params.index);
  const f = Number.isInteger(index) && index >= 0 ? (a.submission?.files || [])[index] : null;
  if (!f?.key) throw httpError(404, "File not found.");
  assertStorage();
  const { url, expiresAt } = await storage.presignGet({ key: f.key, name: f.name, type: f.type });
  res.set("Cache-Control", "private, no-store");
  if (req.query.redirect === "1") return res.redirect(302, url);
  res.json({ url, expiresAt, name: f.name, size: f.size, type: f.type });
});

router.post("/api/attempts/:id/submit", requireAuth, submitLimit, async (req, res) => {
  const a = await ownAttempt(req);
  if (a.status !== "IN_PROGRESS") throw httpError(409, "This attempt is already submitted.");
  const sub = a.submission || {};
  if (!sub.text?.trim() && !sub.links?.length && !sub.files?.length) throw httpError(400, "Add your work before you submit.");
  checkFormats(a.assessment, sub);
  if (a.attemptNo === 1) {
    const enrollment = await findEnrollment(a.userId, a.assessment.courseId);
    const due = a.assessment.dueDays && enrollment ? new Date(enrollment.startedAt).getTime() + a.assessment.dueDays * DAY : null;
    if (due && due < Date.now()) throw httpError(403, "The deadline for this assessment has passed. Contact support if you need help.");
  } else {
    const prev = await prisma.assessmentAttempt.findFirst({ where: { assessmentId: a.assessmentId, userId: a.userId, attemptNo: a.attemptNo - 1 } });
    if (prev?.reassessUntil && new Date(prev.reassessUntil).getTime() < Date.now()) throw httpError(403, "Your reassessment window has closed.");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.assessmentAttempt.update({
      where: { id: a.id },
      data: { status: "SUBMITTED", submittedAt: new Date(), version: a.version + 1, history: withHistory(a, "SUBMITTED", req.user.id, `Version ${a.version + 1}`) },
      include: STUDENT_ATTEMPT_INCLUDE,
    });
    await notify(
      req.user.id,
      { type: "COURSE", title: "Assessment submitted", body: `Your work for ${a.assessment.course.title} is locked and waiting for review.`, link: `/app/assessments/${a.assessment.courseId}` },
      tx,
    );
    return row;
  });
  res.json(studentOut(updated));
});

router.post("/api/attempts/:id/appeal", requireAuth, appealLimit, validate({ body: z.object({ reason: z.string().trim().min(20, "Explain your appeal in at least 20 characters.").max(3000) }) }), async (req, res) => {
  const a = await ownAttempt(req);
  if (!["FAILED", "REASSESSMENT_REQUIRED"].includes(a.status)) throw httpError(409, "You can appeal only after a result that isn't a pass.");
  if (a.appealReason) throw httpError(409, "You have already appealed this result.");
  const newer = await prisma.assessmentAttempt.findFirst({ where: { assessmentId: a.assessmentId, userId: a.userId, attemptNo: { gt: a.attemptNo } }, select: { id: true } });
  if (newer) throw httpError(409, "You've started a newer attempt, so this result can't be appealed now.");
  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.assessmentAttempt.update({
      where: { id: a.id },
      data: { status: "APPEAL_PENDING", appealReason: req.body.reason, history: withHistory(a, "APPEAL_PENDING", req.user.id, `from ${a.status}`) },
      include: STUDENT_ATTEMPT_INCLUDE,
    });
    await notifyAdmins({ type: "SYSTEM", title: "New assessment appeal", body: `${req.user.name} appealed a result in ${a.assessment.course.title}.`, link: `/admin/evaluations/${a.id}` }, tx);
    return row;
  });
  res.json(studentOut(updated));
});

const onboardingSchema = z.object({
  portfolioUrl: zUrl,
  identityConfirmed: z.literal(true, { message: "Confirm your identity details." }),
  payoutReady: z.boolean(),
  availabilityConfirmed: z.literal(true, { message: "Confirm your availability." }),
  availabilityNote: z.string().trim().max(300).optional(),
});

router.post("/api/attempts/:id/onboarding", requireAuth, validate({ body: onboardingSchema }), async (req, res) => {
  const a = await ownAttempt(req);
  if (a.status !== "PASSED") throw httpError(409, "Verification onboarding opens after you pass.");
  // editable until approval; admins hear about it once (the first submission), later edits only update the details
  const first = !a.onboarding?.submittedAt;
  const at = new Date().toISOString();
  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.assessmentAttempt.update({
      where: { id: a.id },
      data: {
        onboarding: { ...req.body, submittedAt: first ? at : a.onboarding.submittedAt, ...(first ? {} : { updatedAt: at }) },
        history: withHistory(a, "PASSED", req.user.id, first ? "Verification onboarding completed" : "Verification onboarding updated"),
      },
      include: STUDENT_ATTEMPT_INCLUDE,
    });
    if (first) {
      await notifyAdmins({ type: "SYSTEM", title: "Verification ready to approve", body: `${req.user.name} passed ${a.assessment.course.title} and completed onboarding.`, link: "/admin/verifications" }, tx);
    }
    return row;
  });
  res.json(studentOut(updated));
});

/* ───────────── student: skills + public check ───────────── */

const VERIFICATION_INCLUDE = { skill: { select: { id: true, slug: true, name: true } }, course: { select: { id: true, title: true } }, approvedBy: { select: { id: true, name: true } } };

router.get("/api/me/skills", requireAuth, async (req, res) => {
  const rows = await prisma.skillVerification.findMany({ where: { userId: req.user.id }, include: VERIFICATION_INCLUDE, orderBy: { awardedAt: "desc" } });
  res.json(rows.map((v) => verificationOut(v)));
});

router.get("/api/verify/skill/:code", async (req, res) => {
  const v = await prisma.skillVerification.findFirst({
    where: { verifyCode: { equals: req.params.code.trim(), mode: "insensitive" } },
    include: { skill: { select: { slug: true, name: true } }, user: { select: { name: true } } },
  });
  if (!v) throw httpError(404, "No skill badge matches this code. Check it and try again.");
  res.json(verificationPublic(v));
});

/* ───────────── evaluators ───────────── */

const queueQuery = z.object({
  status: z.enum(["SUBMITTED", "UNDER_REVIEW", "APPEAL_PENDING", "REVIEWED", "ALL"]).optional().catch(undefined),
  mine: zQ,
  courseId: zQ,
});

router.get("/api/evaluations", requireAuth, requireRole(...STAFF), validate({ query: queueQuery }), async (req, res) => {
  const { status, mine, courseId } = req.q;
  const isAdmin = req.user.role === "ADMIN";
  const statuses =
    status === "REVIEWED"
      ? ["PASSED", "REASSESSMENT_REQUIRED", "FAILED", "VERIFIED"]
      : status === "ALL"
        ? ["SUBMITTED", "UNDER_REVIEW", "APPEAL_PENDING", "PASSED", "REASSESSMENT_REQUIRED", "FAILED", "VERIFIED"]
        : status
          ? [status]
          : ["SUBMITTED", "UNDER_REVIEW", ...(isAdmin ? ["APPEAL_PENDING"] : [])];
  const where = {
    ...queueScope(req.user),
    status: { in: statuses },
    ...(mine === "1" || mine === "true" ? { evaluatorId: req.user.id } : {}),
    ...(courseId ? { assessment: { ...(queueScope(req.user).assessment || {}), courseId } } : {}),
  };
  const rows = await prisma.assessmentAttempt.findMany({ where, include: STAFF_ATTEMPT_INCLUDE, orderBy: [{ submittedAt: "asc" }, { createdAt: "asc" }], take: 300 });
  res.json(rows.map(staffOut));
});

/** Contract addition: one attempt for the scoring screen (rubric version, previous attempts, verification). */
router.get("/api/evaluations/:id", requireAuth, requireRole(...STAFF), async (req, res) => {
  const a = await staffAttempt(req);
  const previous = await prisma.assessmentAttempt.findMany({
    where: { assessmentId: a.assessmentId, userId: a.userId, attemptNo: { lt: a.attemptNo } },
    include: STAFF_ATTEMPT_INCLUDE,
    orderBy: { attemptNo: "desc" },
  });
  const settings = await getSettings();
  res.json({ ...staffOut(a), assessment: assessmentAdmin(a.assessment), rules: rulesFor(a.assessment, settings), previous: previous.map(staffOut) });
});

router.post("/api/evaluations/:id/claim", requireAuth, requireRole(...STAFF), async (req, res) => {
  const a = await staffAttempt(req);
  if (a.status === "UNDER_REVIEW" && a.evaluatorId === req.user.id) return res.json(staffOut(a));
  if (a.status !== "SUBMITTED") throw httpError(409, a.status === "UNDER_REVIEW" ? "Someone else is already reviewing this." : "This attempt isn't waiting for review.");
  // conditional update: two evaluators claiming at once → only one wins
  const { count } = await prisma.assessmentAttempt.updateMany({
    where: { id: a.id, status: "SUBMITTED" },
    data: { status: "UNDER_REVIEW", evaluatorId: req.user.id, history: withHistory(a, "UNDER_REVIEW", req.user.id, "Claimed") },
  });
  if (!count) throw httpError(409, "Someone else just claimed this.");
  res.json(staffOut(await staffAttempt(req)));
});

/** Contract addition: who an attempt can be assigned to (evaluators, admins, and the course's mentor), with open workload. */
router.get("/api/admin/evaluators", requireAuth, requireRole("ADMIN"), validate({ query: z.object({ courseId: zQ }) }), async (req, res) => {
  const course = req.q.courseId ? await prisma.course.findUnique({ where: { id: req.q.courseId }, select: { mentorId: true } }) : null;
  const users = await prisma.user.findMany({
    where: { status: { not: "SUSPENDED" }, OR: [{ role: { in: ["EVALUATOR", "ADMIN"] } }, ...(course?.mentorId ? [{ id: course.mentorId }] : [])] },
    select: { id: true, name: true, avatarUrl: true, role: true },
    orderBy: { name: "asc" },
    take: 100,
  });
  const open = await prisma.assessmentAttempt.groupBy({ by: ["evaluatorId"], where: { status: "UNDER_REVIEW", evaluatorId: { in: users.map((u) => u.id) } }, _count: { _all: true } });
  const counts = new Map(open.map((o) => [o.evaluatorId, o._count._all]));
  res.json(users.map((u) => ({ ...u, openReviews: counts.get(u.id) || 0 })));
});

router.post("/api/evaluations/:id/assign", requireAuth, requireRole("ADMIN"), validate({ body: z.object({ evaluatorId: z.string().min(1) }) }), async (req, res) => {
  const a = await staffAttempt(req);
  if (!["SUBMITTED", "UNDER_REVIEW"].includes(a.status)) throw httpError(409, "Only attempts waiting for review can be assigned.");
  const evaluator = await prisma.user.findUnique({ where: { id: req.body.evaluatorId } });
  if (!evaluator || !["ADMIN", "EVALUATOR", "MENTOR"].includes(evaluator.role)) throw httpError(400, "Pick an evaluator, mentor or admin.");
  if (evaluator.role === "MENTOR" && a.assessment.course.mentorId !== evaluator.id) throw httpError(400, "Mentors can only evaluate courses they teach.");
  if (evaluator.id === a.userId) throw httpError(400, "A student can't evaluate their own work.");
  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.assessmentAttempt.update({
      where: { id: a.id },
      data: { status: "UNDER_REVIEW", evaluatorId: evaluator.id, history: withHistory(a, "UNDER_REVIEW", req.user.id, `Assigned to ${evaluator.name}`) },
      include: STAFF_ATTEMPT_INCLUDE,
    });
    await audit(req, { action: "assessment.assign", entity: "AssessmentAttempt", entityId: a.id, before: snapshot(a), after: snapshot(row) }, tx);
    if (evaluator.id !== req.user.id) {
      await notify(evaluator.id, { type: "SYSTEM", title: "Assessment assigned to you", body: `${a.user.name} · ${a.assessment.course.title}`, link: `/admin/evaluations/${a.id}` }, tx);
    }
    return row;
  });
  res.json(staffOut(updated));
});

const resultSchema = z.object({
  scores: z.array(z.object({ criterionId: z.string().min(1), score: z.number(), note: z.string().max(2000).optional().default("") })).min(1),
  feedback: z.string().trim().min(20, "Write feedback of at least 20 characters so the student knows what to do next.").max(5000),
  evaluatorNotes: z.string().trim().max(5000).optional(),
});

router.post("/api/evaluations/:id/result", requireAuth, requireRole(...STAFF), validate({ body: resultSchema }), async (req, res) => {
  const a = await staffAttempt(req);
  if (a.status === "SUBMITTED") {
    // scoring an unclaimed attempt claims it
  } else if (a.status !== "UNDER_REVIEW") {
    throw httpError(409, "This attempt isn't waiting for a result.");
  } else if (a.evaluatorId !== req.user.id && req.user.role !== "ADMIN") {
    throw httpError(403, "This attempt is assigned to another evaluator.");
  }
  const rubric = a.rubric || a.assessment.rubric;
  const { rows, total, criticalFailed } = scoreAgainst(rubric.criteria || [], req.body.scores);
  const rules = rulesFor(a.assessment, await getSettings());
  const decision = decideResult({ total, criticalFailed, attemptNo: a.attemptNo, rules });

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.assessmentAttempt.update({
      where: { id: a.id },
      data: {
        status: decision.status,
        evaluatorId: req.user.id,
        rubricId: rubric.id,
        scores: rows,
        totalScore: total,
        passed: decision.passed,
        feedback: req.body.feedback,
        evaluatorNotes: req.body.evaluatorNotes || null,
        reviewedAt: new Date(),
        reassessUntil: decision.reassessUntil,
        history: withHistory(a, decision.status, req.user.id, `${total}/100${criticalFailed.length ? ` · critical not met: ${criticalFailed.join(", ")}` : ""}`),
      },
      include: STAFF_ATTEMPT_INCLUDE,
    });
    await audit(req, { action: "assessment.result", entity: "AssessmentAttempt", entityId: a.id, before: snapshot(a), after: { ...snapshot(row), rubricVersion: rubric.version } }, tx);
    if (decision.passed) {
      // the course certificate shows the passed assessment score (never a default)
      await tx.certificate.updateMany({ where: { userId: a.userId, courseId: a.assessment.courseId, score: null }, data: { score: total } });
    }
    const course = a.assessment.course;
    const link = `/app/assessments/${course.id}`;
    const message =
      decision.status === "PASSED"
        ? { title: `You passed: ${course.title}`, body: `Score ${total}/100. Next: complete verification onboarding to get your skill badge.` }
        : decision.status === "REASSESSMENT_REQUIRED"
          ? { title: `Reassessment needed: ${course.title}`, body: `Score ${total}/100. Read the feedback and resubmit by ${decision.reassessUntil.toDateString()}.` }
          : { title: `Result: ${course.title}`, body: `Score ${total}/100. This assessment is closed. Read the feedback. You can appeal if you think the result is wrong.` };
    await notify(a.userId, { type: "COURSE", ...message, link }, tx);
    return row;
  });
  res.json(staffOut(updated));
});

router.post(
  "/api/evaluations/:id/appeal-decision",
  requireAuth,
  requireRole("ADMIN"),
  validate({ body: z.object({ decision: z.enum(["UPHOLD", "OVERTURN"]), note: z.string().trim().min(10, "Explain the decision in at least 10 characters.").max(3000) }) }),
  async (req, res) => {
    const a = await staffAttempt(req);
    if (a.status !== "APPEAL_PENDING") throw httpError(409, "This attempt has no pending appeal.");
    if (a.evaluatorId === req.user.id) throw httpError(403, "An appeal must be decided by someone other than the original evaluator.");
    const appealedAt = [...(a.history || [])].reverse().find((h) => h.status === "APPEAL_PENDING");
    const from = appealedAt?.note?.replace(/^from /, "") || (a.reassessUntil ? "REASSESSMENT_REQUIRED" : "FAILED");
    let data;
    if (req.body.decision === "OVERTURN") {
      data = { status: "PASSED", passed: true, reassessUntil: null };
    } else {
      // original result stands; a reassessment window is extended by the time the appeal took
      const spent = appealedAt ? Date.now() - new Date(appealedAt.at).getTime() : 0;
      data = { status: from, reassessUntil: from === "REASSESSMENT_REQUIRED" && a.reassessUntil ? new Date(new Date(a.reassessUntil).getTime() + spent) : a.reassessUntil };
    }
    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.assessmentAttempt.update({
        where: { id: a.id },
        data: { ...data, appealDecision: `${req.body.decision}: ${req.body.note}`, appealReviewerId: req.user.id, history: withHistory(a, data.status, req.user.id, `Appeal ${req.body.decision.toLowerCase()}`) },
        include: STAFF_ATTEMPT_INCLUDE,
      });
      await audit(req, { action: "assessment.appeal_decision", entity: "AssessmentAttempt", entityId: a.id, before: snapshot(a), after: snapshot(row), reason: req.body.note }, tx);
      if (data.status === "PASSED") {
        await tx.certificate.updateMany({ where: { userId: a.userId, courseId: a.assessment.courseId, score: null }, data: { score: a.totalScore } });
      }
      await notify(
        a.userId,
        {
          type: "COURSE",
          title: req.body.decision === "OVERTURN" ? `Appeal accepted: ${a.assessment.course.title}` : `Appeal reviewed: ${a.assessment.course.title}`,
          body: req.body.decision === "OVERTURN" ? "Your result is now a pass. Next: complete verification onboarding." : "The original result stands. Read the reviewer's note for details.",
          link: `/app/assessments/${a.assessment.courseId}`,
        },
        tx,
      );
      return row;
    });
    res.json(staffOut(updated));
  },
);

/* ───────────── admin: rubrics + assessment config ───────────── */

router.get("/api/admin/rubrics", requireAuth, requireRole("ADMIN"), async (_req, res) => {
  await defaultRubric();
  const rows = await prisma.rubric.findMany({ orderBy: [{ key: "asc" }, { version: "desc" }], include: { _count: { select: { assessments: true, attempts: true } } } });
  res.json(rows.map((r) => ({ ...rubricOut(r), assessmentsCount: r._count.assessments, attemptsCount: r._count.attempts })));
});

const rubricSchema = z.object({
  key: z.string().trim().max(60).optional(),
  name: z.string().trim().min(2).max(120),
  criteria: z.array(z.object({ id: z.string().optional(), label: z.string(), weight: z.number(), maxScore: z.number().optional(), critical: z.boolean().optional(), guide: z.string().max(2000).optional() })).min(1).max(20),
});

router.post("/api/admin/rubrics", requireAuth, requireRole("ADMIN"), validate({ body: rubricSchema }), async (req, res) => {
  const criteria = normaliseCriteria(req.body.criteria);
  const key = req.body.key ? req.body.key.toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 60) : `${req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}-${Date.now().toString(36)}`;
  const rubric = await prisma.$transaction(async (tx) => {
    const latest = await tx.rubric.findFirst({ where: { key }, orderBy: { version: "desc" } });
    const created = await tx.rubric.create({ data: { key, version: (latest?.version || 0) + 1, name: req.body.name, criteria, createdById: req.user.id } });
    if (latest) {
      // older versions are superseded; assessments on this rubric move to the new version. Started attempts keep theirs.
      await tx.rubric.updateMany({ where: { key, id: { not: created.id } }, data: { status: "ARCHIVED" } });
      const olderIds = (await tx.rubric.findMany({ where: { key, id: { not: created.id } }, select: { id: true } })).map((r) => r.id);
      await tx.assessment.updateMany({ where: { rubricId: { in: olderIds } }, data: { rubricId: created.id } });
    }
    await audit(req, { action: latest ? "rubric.version" : "rubric.create", entity: "Rubric", entityId: created.id, before: latest ? rubricOut(latest) : null, after: rubricOut(created) }, tx);
    return created;
  });
  res.status(201).json(rubricOut(rubric));
});

/** Contract addition: every course with its assessment config (or null) for the admin list. */
router.get("/api/admin/assessments", requireAuth, requireRole("ADMIN"), async (_req, res) => {
  const courses = await prisma.course.findMany({
    orderBy: { title: "asc" },
    select: { id: true, title: true, level: true, status: true, skill: { select: { id: true, slug: true, name: true } }, assessment: { include: { rubric: true, _count: { select: { attempts: true } } } } },
  });
  res.json(
    courses.map((c) => ({
      course: { id: c.id, title: c.title, level: c.level, status: c.status, skill: c.skill },
      assessment: c.assessment ? { ...assessmentAdmin(c.assessment), attemptsCount: c.assessment._count.attempts } : null,
    })),
  );
});

router.get("/api/admin/courses/:id/assessment", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const course = await getCourse(req.params.id, { detail: false });
  const existing = await prisma.assessment.findUnique({ where: { courseId: course.id }, include: ASSESSMENT_INCLUDE });
  if (existing) return res.json(assessmentAdmin(existing));
  const settings = await getSettings();
  const rubric = await defaultRubric();
  // not saved yet: the defaults a first save would use
  res.json({
    id: null,
    courseId: course.id,
    title: `${course.title}: final project`,
    brief: "",
    instructions: "",
    allowedFormats: ["link", "text"],
    rubricId: rubric.id,
    rubric: rubricOut(rubric),
    ...rulesFor(null, settings),
    dueDays: null,
  });
});

const configSchema = z.object({
  title: z.string().trim().min(3).max(160),
  brief: z.string().max(20000).default(""),
  instructions: z.string().max(10000).default(""),
  allowedFormats: z.array(z.enum(["link", "text", "file"])).min(1, "Allow at least one format."),
  rubricId: z.string().min(1),
  passScore: z.number().int().min(1).max(100).optional(),
  maxAttempts: z.number().int().min(1).max(5).optional(),
  reassessWindowDays: z.number().int().min(1).max(90).optional(),
  dueDays: z.number().int().min(1).max(365).nullable().optional(),
});

router.put("/api/admin/courses/:id/assessment", requireAuth, requireRole("ADMIN"), validate({ body: configSchema }), async (req, res) => {
  const course = await getCourse(req.params.id, { detail: false });
  const rubric = await prisma.rubric.findUnique({ where: { id: req.body.rubricId } });
  if (!rubric) throw httpError(400, "Pick a rubric.");
  const settings = await getSettings();
  const defaults = rulesFor(null, settings);
  const data = {
    title: req.body.title,
    brief: req.body.brief,
    instructions: req.body.instructions,
    allowedFormats: req.body.allowedFormats,
    rubricId: rubric.id,
    passScore: req.body.passScore ?? defaults.passScore,
    maxAttempts: req.body.maxAttempts ?? defaults.maxAttempts,
    reassessWindowDays: req.body.reassessWindowDays ?? defaults.reassessWindowDays,
    dueDays: req.body.dueDays ?? null,
  };
  const saved = await prisma.$transaction(async (tx) => {
    const before = await tx.assessment.findUnique({ where: { courseId: course.id } });
    const row = await tx.assessment.upsert({ where: { courseId: course.id }, create: { courseId: course.id, ...data }, update: data, include: ASSESSMENT_INCLUDE });
    await audit(req, { action: before ? "assessment.update" : "assessment.create", entity: "Assessment", entityId: row.id, before, after: data }, tx);
    return row;
  });
  res.json(assessmentAdmin(saved));
});

/* ───────────── admin: verifications ───────────── */

const verQuery = z.object({ status: zQ, skill: zQ, pending: zQ, q: zQ });

router.get("/api/admin/verifications", requireAuth, requireRole("ADMIN"), validate({ query: verQuery }), async (req, res) => {
  const { status, skill, pending, q } = req.q;
  const userWhere = q ? { user: { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } } : {};
  if (pending === "1" || pending === "true") {
    // PASSED attempts whose student finished onboarding: awaiting approval
    const rows = await prisma.assessmentAttempt.findMany({
      where: { status: "PASSED", ...userWhere, ...(skill ? { assessment: { course: { skill: { slug: skill } } } } : {}) },
      include: STAFF_ATTEMPT_INCLUDE,
      orderBy: { updatedAt: "asc" },
    });
    return res.json(rows.filter((a) => a.onboarding?.submittedAt).map(staffOut));
  }
  const now = new Date();
  const statusWhere =
    status === "EXPIRED"
      ? { OR: [{ status: "EXPIRED" }, { status: "ACTIVE", expiresAt: { lt: now } }] }
      : status === "ACTIVE"
        ? { status: "ACTIVE", OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] }
        : status
          ? { status }
          : {};
  const rows = await prisma.skillVerification.findMany({
    where: { ...statusWhere, ...userWhere, ...(skill ? { skill: { slug: skill } } : {}) },
    include: { ...VERIFICATION_INCLUDE, user: { include: { college: true } } },
    orderBy: { awardedAt: "desc" },
    take: 500,
  });
  res.json(rows.map((v) => verificationOut(v, { staff: true })));
});

router.post("/api/admin/attempts/:id/verify", requireAuth, requireRole("ADMIN"), validate({ body: z.object({ note: z.string().trim().max(1000).optional() }) }), async (req, res) => {
  const a = await prisma.assessmentAttempt.findUnique({ where: { id: req.params.id }, include: STAFF_ATTEMPT_INCLUDE });
  if (!a) throw httpError(404, "Attempt not found.");
  if (a.userId === req.user.id) throw httpError(403, "You can't approve your own verification.");
  if (a.status !== "PASSED") throw httpError(409, "Only a passed assessment can be verified.");
  if (!a.onboarding?.submittedAt) throw httpError(409, "The student hasn't finished verification onboarding yet.");
  const course = a.assessment.course;
  if (!course.skillId) throw httpError(409, "Link this course to a skill in the catalogue before verifying.");
  const settings = await getSettings();
  const rubric = a.rubric || a.assessment.rubric;
  const links = (a.submission?.links || []).slice(0, 3).map((url, i) => ({ label: i ? `Submission link ${i + 1}` : "Assessment submission", url }));
  const evidence = [...links, { label: "Portfolio", url: a.onboarding.portfolioUrl }];
  const awardedAt = new Date();

  const verification = await prisma.$transaction(async (tx) => {
    const existing = await tx.skillVerification.findUnique({ where: { userId_skillId_level: { userId: a.userId, skillId: course.skillId, level: course.level } } });
    // one badge per skill + level: passing again renews it (new evidence, date and rubric version; history kept)
    const renewed = existing && verificationStatus(existing) === "ACTIVE";
    const data = {
      courseId: course.id,
      status: "ACTIVE",
      awardedAt,
      attemptId: a.id,
      rubricId: rubric?.id ?? null,
      rubricVersion: rubric?.version ?? null,
      evidence,
      expiresAt: expiryFrom(settings, awardedAt),
      approvedById: req.user.id,
      revokedReason: null,
      history: [...(existing?.history || []), { status: "ACTIVE", at: awardedAt.toISOString(), by: req.user.id, reason: req.body.note || (renewed ? "Renewed after a new pass" : "Approved") }],
    };
    const v = existing
      ? await tx.skillVerification.update({ where: { id: existing.id }, data, include: VERIFICATION_INCLUDE })
      : await tx.skillVerification.create({
          data: { userId: a.userId, skillId: course.skillId, level: course.level, verifyCode: await uniqueSkillCode(tx), ...data },
          include: VERIFICATION_INCLUDE,
        });
    await tx.assessmentAttempt.update({ where: { id: a.id }, data: { status: "VERIFIED", history: withHistory(a, "VERIFIED", req.user.id, req.body.note || null) } });
    await audit(req, { action: "verification.approve", entity: "SkillVerification", entityId: v.id, before: existing ? verificationOut(existing) : null, after: { status: "ACTIVE", attemptId: a.id, skillId: course.skillId, level: course.level }, reason: req.body.note || null }, tx);
    await notify(
      a.userId,
      { type: "COURSE", title: `Verified: ${course.skill?.name || course.title}`, body: `Your ${course.level.toLowerCase()} skill badge is live. Next: set your availability so project managers can consider you.`, link: "/app/skills" },
      tx,
    );
    return v;
  });
  res.status(201).json(verificationOut(verification, { staff: true }));
});

async function changeVerification(req, res, { from, to, action, title, body }) {
  const v = await prisma.skillVerification.findUnique({ where: { id: req.params.id }, include: VERIFICATION_INCLUDE });
  if (!v) throw httpError(404, "Verification not found.");
  const current = verificationStatus(v);
  if (!from.includes(current)) throw httpError(409, `This badge is ${current.toLowerCase()}.`);
  // reinstating a lapsed badge starts a fresh expiry period (when expiry is configured)
  const renew = to === "ACTIVE" && v.expiresAt && new Date(v.expiresAt) < new Date();
  const expiresAt = renew ? expiryFrom(await getSettings()) : v.expiresAt;
  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.skillVerification.update({
      where: { id: v.id },
      data: {
        status: to,
        expiresAt,
        revokedReason: to === "REVOKED" ? req.body.reason : null,
        history: [...(v.history || []), { status: to, at: new Date().toISOString(), by: req.user.id, reason: req.body.reason }],
      },
      include: { ...VERIFICATION_INCLUDE, user: { include: { college: true } } },
    });
    await audit(req, { action, entity: "SkillVerification", entityId: v.id, before: { status: current }, after: { status: to, expiresAt }, reason: req.body.reason }, tx);
    await notify(row.userId, { type: "SYSTEM", title: title(row), body: body(req.body.reason), link: "/app/skills" }, tx);
    return row;
  });
  res.json(verificationOut(updated, { staff: true }));
}

const reasonSchema = z.object({ reason: z.string().trim().min(5, "Add a reason (at least 5 characters).").max(1000) });

router.post("/api/admin/verifications/:id/revoke", requireAuth, requireRole("ADMIN"), validate({ body: reasonSchema }), (req, res) =>
  changeVerification(req, res, {
    from: ["ACTIVE", "EXPIRED"],
    to: "REVOKED",
    action: "verification.revoke",
    title: (v) => `Skill badge revoked: ${v.skill?.name || "skill"}`,
    body: (reason) => `Reason: ${reason}. Contact support if you have questions.`,
  }),
);

router.post("/api/admin/verifications/:id/reinstate", requireAuth, requireRole("ADMIN"), validate({ body: reasonSchema }), (req, res) =>
  changeVerification(req, res, {
    from: ["REVOKED", "EXPIRED"],
    to: "ACTIVE",
    action: "verification.reinstate",
    title: (v) => `Skill badge reinstated: ${v.skill?.name || "skill"}`,
    body: () => "Your skill badge is active again.",
  }),
);

export default router;
