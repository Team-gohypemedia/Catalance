/**
 * Demo-engine handlers for assessment, rubrics and skill verification (spec §8). Mirrors campus/api/src/routes/assessments.js
 * and services/assessment.js; shapes per API_CONTRACT.md "Spec v1.0 → Assessment & verification".
 * Paying for or finishing a course never creates a skill verification here either: only an admin approval of a PASSED attempt.
 */
import { httpError, requireUser, requireRole, uid, now, miniUser } from "../utils";
import { notify } from "../points";
import { demoAudit, demoSetting, skillRef } from "./catalog";
import { skillIdForCourse } from "../data/assessment";

const DAY = 86400000;
const CRITICAL_RATIO = 0.5;
const REMINDER_DAYS = 3;
const STAFF = ["EVALUATOR", "MENTOR"]; // + ADMIN
const DEFAULT_RUBRIC_KEY = "practical-default";
const DEFAULT_CRITERIA = [
  { id: "brief", label: "Meets the brief", weight: 30, maxScore: 10, critical: true, guide: "Every required deliverable is present and answers the brief. 10 = all, 5 = most, 0 = missing core parts." },
  { id: "quality", label: "Quality of work", weight: 30, maxScore: 10, critical: false, guide: "Accurate, clean and consistent. Would a paying client accept it with small edits?" },
  { id: "process", label: "Decisions explained", weight: 20, maxScore: 10, critical: false, guide: "A short note explains the approach, choices and trade-offs." },
  { id: "delivery", label: "Client-ready delivery", weight: 20, maxScore: 10, critical: true, guide: "Files and links open, are named clearly and can be handed over as they are." },
];
/* uploads: same allow-list and limits as api/src/lib/uploads.js. The demo has no storage: a fake private key is issued and
   the browser keeps the bytes in memory (components/assessment/files.js), so the demo works offline. */
const UPLOAD_TYPES = {
  pdf: { type: "application/pdf" },
  png: { type: "image/png" },
  jpg: { type: "image/jpeg" },
  jpeg: { type: "image/jpeg" },
  webp: { type: "image/webp" },
  zip: { type: "application/zip", aliases: ["application/x-zip-compressed", "application/x-zip", "multipart/x-zip"] },
  fig: { type: "application/x-figma", aliases: ["application/figma"] },
  mp4: { type: "video/mp4" },
  docx: { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  pptx: { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
  xlsx: { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  txt: { type: "text/plain" },
};
const UPLOAD_EXTENSIONS = Object.keys(UPLOAD_TYPES);
const GENERIC_TYPES = ["", "application/octet-stream", "binary/octet-stream"];
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_FILES = 10;
const URL_TTL_MS = 10 * 60 * 1000;
const extOf = (name) => (/\.([a-z0-9]{1,8})$/i.exec(String(name || "").trim())?.[1] || "").toLowerCase();
const attemptIdOfKey = (key) => /^campus\/attempts\/([A-Za-z0-9_-]{1,64})\/[A-Za-z0-9_-]{6,32}-[\w.-]{1,90}$/.exec(String(key || ""))?.[1] || null;
const safeName = (name) => {
  const ext = extOf(name);
  const base = String(name || "file").replace(/\.[^.]*$/, "").normalize("NFKD").replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").replace(/^[-.]+|[-.]+$/g, "").slice(0, 80) || "file";
  return ext ? `${base}.${ext}` : base;
};
const uploadRules = () => ({ enabled: true, maxBytes: MAX_FILE_BYTES, maxFiles: MAX_FILES, extensions: UPLOAD_EXTENSIONS });

function checkUpload({ name, type, size }) {
  const clean = String(name || "").trim();
  if (!clean) throw httpError(400, "The file needs a name.");
  const rule = UPLOAD_TYPES[extOf(clean)];
  if (!rule) throw httpError(400, `That file type isn't allowed. Use ${UPLOAD_EXTENSIONS.map((e) => e.toUpperCase()).join(", ")}.`);
  const reported = String(type || "").toLowerCase().split(";")[0].trim();
  if (!GENERIC_TYPES.includes(reported) && reported !== rule.type && !(rule.aliases || []).includes(reported)) throw httpError(400, "The file's type doesn't match its extension.");
  const bytes = Number(size);
  if (!Number.isFinite(bytes) || bytes <= 0) throw httpError(400, "The file is empty.");
  if (bytes > MAX_FILE_BYTES) throw httpError(400, "Files must be 25 MB or smaller.");
  return { name: clean.slice(0, 200), size: Math.floor(bytes), type: rule.type };
}
const URL_RE = /^https?:\/\/\S+\.\S+/;

/* ───────────────────────── rules (same as services/assessment.js) ───────────────────────── */

const settingsRules = (db) => ({
  passScore: Number(demoSetting(db, "assessment.passScore") ?? 70),
  maxAttempts: Number(demoSetting(db, "assessment.maxAttempts") ?? 2),
  reassessWindowDays: Number(demoSetting(db, "assessment.reassessWindowDays") ?? 14),
});
const rulesFor = (db, a) => {
  const d = settingsRules(db);
  return { passScore: a?.passScore ?? d.passScore, maxAttempts: a?.maxAttempts ?? d.maxAttempts, reassessWindowDays: a?.reassessWindowDays ?? d.reassessWindowDays };
};

const windowOpen = (a, at = Date.now()) => a?.status === "REASSESSMENT_REQUIRED" && a.reassessUntil && new Date(a.reassessUntil).getTime() > at;
const readStatus = (a, at = Date.now()) => (!a ? "NOT_STARTED" : a.status === "REASSESSMENT_REQUIRED" && !windowOpen(a, at) ? "FAILED" : a.status);
const dueAtFor = (a, enr) => (a?.dueDays && enr?.startedAt ? new Date(new Date(enr.startedAt).getTime() + a.dueDays * DAY).toISOString() : null);
const historyEntry = (status, by, note = null) => ({ status, at: now(), by: by ?? null, note: note || null });
const withHistory = (a, status, by, note) => [...(a.history || []), historyEntry(status, by, note)];

function slugify(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

function normaliseCriteria(criteria) {
  if (!Array.isArray(criteria) || !criteria.length) throw httpError(400, "Add at least one criterion.");
  const seen = new Set();
  return criteria.map((c, i) => {
    const label = String(c.label || "").trim();
    if (!label) throw httpError(400, `Criterion ${i + 1} needs a name.`);
    let id = slugify(c.id || label) || `c${i + 1}`;
    while (seen.has(id)) id = `${id}-${i + 1}`;
    seen.add(id);
    const weight = Number(c.weight);
    const maxScore = Number(c.maxScore ?? 10);
    if (!(weight > 0)) throw httpError(400, `“${label}” needs a weight above 0.`);
    if (!(maxScore > 0) || !Number.isInteger(maxScore)) throw httpError(400, `“${label}” needs a whole-number max score above 0.`);
    return { id, label, weight, maxScore, critical: Boolean(c.critical), guide: String(c.guide || "").trim() };
  });
}

function scoreAgainst(criteria, scores) {
  const byId = new Map((scores || []).map((s) => [s.criterionId, s]));
  const totalWeight = criteria.reduce((s, c) => s + c.weight, 0) || 1;
  let weighted = 0;
  const criticalFailed = [];
  const rows = criteria.map((c) => {
    const s = byId.get(c.id);
    if (!s || s.score == null || s.score === "" || !Number.isFinite(Number(s.score))) throw httpError(400, `Score “${c.label}”.`);
    const score = Number(s.score);
    if (score < 0 || score > c.maxScore) throw httpError(400, `“${c.label}” must be between 0 and ${c.maxScore}.`);
    weighted += c.weight * (score / c.maxScore);
    if (c.critical && score < c.maxScore * CRITICAL_RATIO) criticalFailed.push(c.id);
    return { criterionId: c.id, score, note: String(s.note || "").trim().slice(0, 2000) };
  });
  return { rows, total: Math.round((weighted / totalWeight) * 100), criticalFailed };
}

function decideResult({ total, criticalFailed, attemptNo, rules }) {
  if (total >= rules.passScore && !criticalFailed.length) return { status: "PASSED", passed: true, reassessUntil: null };
  if (attemptNo < rules.maxAttempts) return { status: "REASSESSMENT_REQUIRED", passed: false, reassessUntil: new Date(Date.now() + rules.reassessWindowDays * DAY).toISOString() };
  return { status: "FAILED", passed: false, reassessUntil: null };
}

function stateFor(db, { assessment, attempts, enrollment }) {
  const at = Date.now();
  const rules = rulesFor(db, assessment);
  const latest = attempts[0] || null;
  const dueAt = dueAtFor(assessment, enrollment);
  const overdue = !latest && dueAt && new Date(dueAt).getTime() < at;
  const canReassess = Boolean(latest && windowOpen(latest, at) && latest.attemptNo < rules.maxAttempts);
  return {
    status: readStatus(latest, at),
    rules,
    dueAt,
    canStart: Boolean(enrollment) && (!latest ? !overdue : canReassess),
    canSubmit: latest?.status === "IN_PROGRESS",
    canReassess,
    canAppeal: Boolean(latest && ["FAILED", "REASSESSMENT_REQUIRED"].includes(latest.status) && !latest.appealReason),
    canOnboard: latest?.status === "PASSED" && !latest.onboarding?.submittedAt,
    reassessUntil: latest?.status === "REASSESSMENT_REQUIRED" ? latest.reassessUntil : null,
    attemptsLeft: Math.max(0, rules.maxAttempts - (latest?.attemptNo || 0)),
  };
}

/* ───────────────────────── lookups ───────────────────────── */

const findCourse = (db, idOrSlug) => db.findById("courses", idOrSlug) || db.find("courses", (c) => c.slug === idOrSlug);
const getCourse = (db, idOrSlug) => {
  const c = findCourse(db, idOrSlug);
  if (!c) throw httpError(404, "Course not found.");
  return c;
};
const findEnrollment = (db, userId, courseId) => db.find("enrollments", (e) => e.userId === userId && e.courseId === courseId);
const courseOfAssessment = (db, a) => db.findById("courses", a.courseId);

function defaultRubric(db) {
  const found = db.filter("rubrics", (r) => r.key === DEFAULT_RUBRIC_KEY).sort((a, b) => b.version - a.version)[0];
  return found || db.insert("rubrics", { id: uid("rb"), key: DEFAULT_RUBRIC_KEY, version: 1, name: "Practical project (default)", criteria: DEFAULT_CRITERIA, status: "ACTIVE", createdById: null });
}

/** A course's assessment, created from settings defaults + the default rubric when missing (same as the API). */
function ensureAssessment(db, course) {
  const found = db.find("assessments", (a) => a.courseId === course.id);
  if (found) return found;
  const rules = settingsRules(db);
  return db.insert("assessments", {
    id: uid("as"),
    courseId: course.id,
    title: `${course.title}: final project`,
    brief: `Complete a practical project that shows you can do the work taught in **${course.title}** for a real client.`,
    instructions: "Work on your own. Submit a link to your work and a short note that explains your choices. You can save a draft and submit when ready. Once submitted, your work is locked for review.",
    allowedFormats: ["link", "text"],
    rubricId: defaultRubric(db).id,
    ...rules,
    dueDays: null,
    updatedAt: now(),
  });
}

const myAttempts = (db, userId, assessmentId) => db.filter("assessmentAttempts", (a) => a.userId === userId && a.assessmentId === assessmentId).sort((a, b) => b.attemptNo - a.attemptNo);

function ownAttempt(db, user, id) {
  const a = db.findById("assessmentAttempts", id);
  if (!a || a.userId !== user.id) throw httpError(404, "Attempt not found.");
  return a;
}

function assertCanEvaluate(db, user, attempt) {
  if (attempt.userId === user.id) throw httpError(403, "You can't evaluate your own work.");
  if (user.role === "ADMIN" || user.role === "EVALUATOR") return;
  const course = db.findById("courses", attempt.courseId);
  if (user.role === "MENTOR" && course?.mentorId === user.id) return;
  throw httpError(404, "Attempt not found.");
}

function staffAttempt(db, user, id) {
  const a = db.findById("assessmentAttempts", id);
  if (!a) throw httpError(404, "Attempt not found.");
  assertCanEvaluate(db, user, a);
  return a;
}

/** Skill block for a course: catalogue skill, or the track-derived fallback (see data/assessment.js). */
function skillOf(db, course) {
  const id = skillIdForCourse(course);
  const ref = skillRef(db, id);
  if (ref) return { id: ref.id, slug: ref.slug, name: ref.name };
  const track = db.findById("tracks", course?.trackId);
  return id ? { id, slug: id.replace(/^sk_(track_)?/, ""), name: track?.title || course?.track?.title || "Skill" } : null;
}

const notifyAdmins = (db, payload) => db.filter("users", (u) => u.role === "ADMIN").forEach((u) => notify(db, u.id, payload));

/* ───────────────────────── serializers (same as lib/serialize-assessment.js) ───────────────────────── */

const rubricOut = (r) =>
  r
    ? {
        id: r.id,
        key: r.key,
        version: r.version,
        name: r.name,
        criteria: (r.criteria || []).map((c) => ({ id: c.id, label: c.label, weight: c.weight, maxScore: c.maxScore, critical: Boolean(c.critical), guide: c.guide || "" })),
        status: r.status,
        createdAt: r.createdAt,
      }
    : null;

function assessmentPublic(db, a, enrollment = null) {
  if (!a) return null;
  return {
    id: a.id,
    courseId: a.courseId,
    title: a.title,
    brief: a.brief,
    instructions: a.instructions,
    allowedFormats: a.allowedFormats || [],
    passScore: a.passScore,
    maxAttempts: a.maxAttempts,
    reassessWindowDays: a.reassessWindowDays,
    dueDays: a.dueDays ?? null,
    dueAt: dueAtFor(a, enrollment),
    rubric: rubricOut(db.findById("rubrics", a.rubricId)),
  };
}
const assessmentAdmin = (db, a) => (a ? { ...assessmentPublic(db, a), rubricId: a.rubricId, createdAt: a.createdAt, updatedAt: a.updatedAt ?? a.createdAt } : null);

function attemptOut(db, a, { staff = false } = {}) {
  if (!a) return null;
  const rubric = db.findById("rubrics", a.rubricId);
  const course = db.findById("courses", a.courseId);
  const byId = new Map((rubric?.criteria || []).map((c) => [c.id, c]));
  const verification = db.find("skillVerifications", (v) => v.attemptId === a.id);
  const history = (a.history || []).filter((h) => staff || h.status !== "REMINDED");
  const out = {
    id: a.id,
    assessmentId: a.assessmentId,
    courseId: a.courseId,
    userId: a.userId,
    attemptNo: a.attemptNo,
    status: readStatus(a),
    storedStatus: a.status,
    submission: {
      text: a.submission?.text || "",
      links: a.submission?.links || [],
      files: (a.submission?.files || []).map((f) => ({ key: f.key ?? null, name: f.name || "file", size: Number(f.size) || 0, type: f.type || "" })),
    },
    version: a.version,
    submittedAt: a.submittedAt ?? null,
    rubricId: a.rubricId,
    rubricVersion: rubric?.version ?? null,
    scores: (a.scores || []).map((s) => {
      const c = byId.get(s.criterionId);
      return { criterionId: s.criterionId, label: c?.label || s.criterionId, maxScore: c?.maxScore ?? null, weight: c?.weight ?? null, critical: Boolean(c?.critical), score: s.score, note: s.note || "" };
    }),
    totalScore: a.totalScore ?? null,
    passed: a.passed ?? null,
    feedback: a.feedback ?? null,
    reviewedAt: a.reviewedAt ?? null,
    reassessUntil: a.reassessUntil ?? null,
    onboarding: a.onboarding || null,
    appealReason: a.appealReason ?? null,
    appealDecision: a.appealDecision ?? null,
    history: history.map((h) => (staff ? h : { status: h.status, at: h.at, note: ["APPEAL_PENDING", "UNDER_REVIEW"].includes(h.status) ? null : h.note })), // review notes can name the evaluator
    verificationId: verification?.id ?? null,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt ?? a.createdAt,
    course: course ? { id: course.id, title: course.title, level: course.level, skill: skillOf(db, course) } : null,
  };
  if (staff) {
    const ev = a.evaluatorId ? db.findById("users", a.evaluatorId) : null;
    out.evaluatorId = a.evaluatorId ?? null;
    out.evaluator = ev ? { id: ev.id, name: ev.name, avatarUrl: ev.avatarUrl ?? null } : null;
    out.evaluatorNotes = a.evaluatorNotes ?? null;
    out.appealReviewerId = a.appealReviewerId ?? null;
    out.user = miniUser(db.findById("users", a.userId));
    out.rubric = rubricOut(rubric);
  }
  return out;
}

const verificationStatus = (v, at = Date.now()) => (v.status === "ACTIVE" && v.expiresAt && new Date(v.expiresAt).getTime() < at ? "EXPIRED" : v.status);

function verificationOut(db, v, { staff = false } = {}) {
  const course = v.courseId ? db.findById("courses", v.courseId) : null;
  const ref = skillRef(db, v.skillId);
  const fallback = course ? skillOf(db, course) : null;
  const approver = v.approvedById ? db.findById("users", v.approvedById) : null;
  const out = {
    id: v.id,
    userId: v.userId,
    skill: ref ? { id: ref.id, slug: ref.slug, name: ref.name } : v.skill?.name ? { id: v.skill.id || v.skillId, slug: v.skill.slug || null, name: v.skill.name } : fallback || { id: v.skillId, slug: null, name: "Skill" },
    courseId: v.courseId,
    course: course ? { id: course.id, title: course.title } : null,
    level: v.level,
    status: verificationStatus(v),
    awardedAt: v.awardedAt,
    expiresAt: v.expiresAt ?? null,
    rubricId: v.rubricId,
    rubricVersion: v.rubricVersion,
    evidence: v.evidence || [],
    verifyCode: v.verifyCode,
    revokedReason: v.revokedReason ?? null,
    history: (v.history || []).map((h) => (staff ? h : { status: h.status, at: h.at, reason: h.reason ?? null })),
    approvedById: v.approvedById ?? null,
    approvedBy: approver ? { id: approver.id, name: approver.name } : undefined,
    attemptId: v.attemptId ?? null,
  };
  if (staff) out.user = miniUser(db.findById("users", v.userId));
  return out;
}

function expiryFrom(db, at = new Date()) {
  const months = Number(demoSetting(db, "verification.expiryMonths"));
  if (!months || months <= 0) return null;
  const d = new Date(at);
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

function uniqueSkillCode(db) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  let code;
  do code = `VS-${part()}-${part()}`;
  while (db.find("skillVerifications", (v) => v.verifyCode === code));
  return code;
}

/** "Reassessment window ending" reminders (spec §12), sent lazily once per attempt. */
function sendReassessReminders(db, userId) {
  const soon = Date.now() + REMINDER_DAYS * DAY;
  for (const a of db.filter("assessmentAttempts", (x) => x.userId === userId && x.status === "REASSESSMENT_REQUIRED")) {
    const until = new Date(a.reassessUntil || 0).getTime();
    if (until <= Date.now() || until > soon) continue;
    if ((a.history || []).some((h) => h.status === "REMINDED")) continue;
    if (db.find("assessmentAttempts", (x) => x.assessmentId === a.assessmentId && x.userId === userId && x.attemptNo > a.attemptNo)) continue;
    db.update("assessmentAttempts", a.id, { history: withHistory(a, "REMINDED", null, "Reassessment window ending") });
    const course = db.findById("courses", a.courseId);
    const days = Math.max(1, Math.ceil((until - Date.now()) / DAY));
    notify(db, userId, { type: "COURSE", title: `Reassessment closes in ${days} day${days === 1 ? "" : "s"}`, body: `Start your reassessment for ${course?.title || "your course"} before the window ends.`, link: `/app/assessments/${a.courseId}` });
  }
}

function checkFormats(assessment, sub) {
  const allowed = new Set(assessment.allowedFormats || []);
  if (sub.links?.length && !allowed.has("link")) throw httpError(400, "Links aren't accepted for this assessment.");
  if (sub.files?.length && !allowed.has("file")) throw httpError(400, "Files aren't accepted for this assessment.");
}

function validateDraft(body, { db, attempt } = {}) {
  const out = {};
  if (body.text !== undefined) {
    if (typeof body.text !== "string" || body.text.length > 20000) throw httpError(400, "text: too long.");
    out.text = body.text;
  }
  if (body.links !== undefined) {
    const links = (body.links || []).map((l) => String(l).trim()).filter(Boolean);
    if (links.length > 10) throw httpError(400, "Add up to 10 links.");
    for (const l of links) if (!URL_RE.test(l)) throw httpError(400, "Links must start with https://");
    out.links = links;
  }
  if (body.files !== undefined) {
    const files = body.files || [];
    if (files.length > 10) throw httpError(400, "Add up to 10 files.");
    // private keys from POST /api/attempts/:id/uploads only (never a public URL); keys of this student's attempts on this assessment
    const mine = new Set(db.filter("assessmentAttempts", (x) => x.userId === attempt.userId && x.assessmentId === attempt.assessmentId).map((x) => x.id));
    const seen = new Set();
    out.files = [];
    for (const f of files) {
      if (!f?.name || !f?.key) throw httpError(400, "Upload the file again: it has no storage key.");
      if (seen.has(f.key)) continue;
      seen.add(f.key);
      if (!mine.has(attemptIdOfKey(f.key))) throw httpError(400, "Upload the file again: it doesn't belong to this assessment.");
      if (!(Number(f.size) > 0) || Number(f.size) > MAX_FILE_BYTES) throw httpError(400, "Files must be 25 MB or smaller.");
      if (UPLOAD_TYPES[extOf(f.name)]?.type !== f.type) throw httpError(400, `“${f.name}”: that file type isn't allowed.`);
      out.files.push({ key: f.key, name: String(f.name).trim().slice(0, 200), size: Math.floor(Number(f.size)), type: f.type });
    }
  }
  return out;
}

const snapshot = (a) => ({ status: a.status, totalScore: a.totalScore ?? null, passed: a.passed ?? null, evaluatorId: a.evaluatorId ?? null, rubricId: a.rubricId });

/* ───────────────────────── handlers ───────────────────────── */

export default {
  /* student */
  "GET /api/me/assessments": ({ db, user }) => {
    requireUser(user);
    sendReassessReminders(db, user.id);
    return db
      .filter("enrollments", (e) => e.userId === user.id)
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
      .map((e) => {
        const course = db.findById("courses", e.courseId);
        if (!course) return null;
        const assessment = ensureAssessment(db, course);
        const attempts = myAttempts(db, user.id, assessment.id);
        const state = stateFor(db, { assessment, attempts, enrollment: e });
        return {
          course: { id: course.id, title: course.title, level: course.level },
          assessment: assessmentPublic(db, assessment, e),
          attempt: attempts[0] ? attemptOut(db, attempts[0]) : null,
          status: state.status,
          progressPercent: e.progressPercent,
          reassessUntil: state.reassessUntil,
        };
      })
      .filter(Boolean);
  },

  "GET /api/courses/:id/assessment": ({ params, db, user }) => {
    requireUser(user);
    const course = getCourse(db, params.id);
    const enrollment = findEnrollment(db, user.id, course.id);
    if (!enrollment && user.role === "STUDENT") throw httpError(403, "Enrol in this course to see its assessment.");
    sendReassessReminders(db, user.id);
    const assessment = ensureAssessment(db, course);
    const attempts = myAttempts(db, user.id, assessment.id);
    const state = stateFor(db, { assessment, attempts, enrollment });
    return {
      course: { id: course.id, title: course.title, level: course.level, progressPercent: enrollment?.progressPercent ?? 0 },
      assessment: assessmentPublic(db, assessment, enrollment),
      attempts: attempts.map((a) => attemptOut(db, a)),
      status: state.status,
      canStart: state.canStart,
      canSubmit: state.canSubmit,
      canReassess: state.canReassess,
      canAppeal: state.canAppeal,
      canOnboard: state.canOnboard,
      attemptsLeft: state.attemptsLeft,
      reassessUntil: state.reassessUntil,
      dueAt: state.dueAt,
      uploads: uploadRules(),
    };
  },

  "POST /api/courses/:id/assessment/start": ({ params, db, user }) => {
    requireUser(user);
    const course = getCourse(db, params.id);
    const enrollment = findEnrollment(db, user.id, course.id);
    if (!enrollment) throw httpError(403, "Enrol in this course to start its assessment.");
    const assessment = ensureAssessment(db, course);
    const attempts = myAttempts(db, user.id, assessment.id);
    const latest = attempts[0];
    if (latest?.status === "IN_PROGRESS") return attemptOut(db, latest);
    const state = stateFor(db, { assessment, attempts, enrollment });
    if (!state.canStart) {
      if (!latest && state.dueAt) throw httpError(403, "The deadline for this assessment has passed. Contact support if you need help.");
      if (latest?.status === "REASSESSMENT_REQUIRED" && !windowOpen(latest)) throw httpError(403, "Your reassessment window has closed. You can still appeal the result.");
      throw httpError(409, "You can't start a new attempt right now.");
    }
    const attemptNo = (latest?.attemptNo || 0) + 1;
    const created = db.insert("assessmentAttempts", {
      id: uid("at"),
      assessmentId: assessment.id,
      courseId: course.id,
      userId: user.id,
      attemptNo,
      status: "IN_PROGRESS",
      submission: latest ? { text: latest.submission?.text || "", links: latest.submission?.links || [], files: latest.submission?.files || [] } : { text: "", links: [], files: [] },
      version: 0,
      submittedAt: null,
      evaluatorId: null,
      rubricId: assessment.rubricId,
      scores: [],
      totalScore: null,
      passed: null,
      feedback: null,
      evaluatorNotes: null,
      reviewedAt: null,
      reassessUntil: null,
      onboarding: null,
      appealReason: null,
      appealDecision: null,
      appealReviewerId: null,
      history: [historyEntry("IN_PROGRESS", user.id, attemptNo > 1 ? "Reassessment started" : null)],
      updatedAt: now(),
    });
    return attemptOut(db, created);
  },

  "PUT /api/attempts/:id/submission": ({ params, body, db, user }) => {
    requireUser(user);
    const a = ownAttempt(db, user, params.id);
    if (a.status !== "IN_PROGRESS") throw httpError(409, "This attempt is submitted and locked.");
    const next = { ...a.submission, ...validateDraft(body, { db, attempt: a }) };
    checkFormats(db.findById("assessments", a.assessmentId), next);
    return attemptOut(db, db.update("assessmentAttempts", a.id, { submission: next, updatedAt: now() }));
  },

  "POST /api/attempts/:id/uploads": ({ params, body, db, user }) => {
    requireUser(user);
    const a = ownAttempt(db, user, params.id);
    if (a.status !== "IN_PROGRESS") throw httpError(409, "This attempt is submitted and locked.");
    const assessment = db.findById("assessments", a.assessmentId);
    if (!(assessment?.allowedFormats || []).includes("file")) throw httpError(400, "Files aren't accepted for this assessment.");
    if ((a.submission?.files || []).length >= MAX_FILES) throw httpError(409, `You can add up to ${MAX_FILES} files.`);
    const file = checkUpload(body || {});
    const key = `campus/attempts/${a.id}/${uid("up").replace(/[^A-Za-z0-9_-]/g, "").slice(-16)}-${safeName(file.name)}`;
    // demo: no storage; the page keeps the bytes in memory under this key
    return { uploadUrl: `demo-upload:${key}`, method: "PUT", headers: { "Content-Type": file.type }, expiresAt: new Date(Date.now() + URL_TTL_MS).toISOString(), file: { key, ...file } };
  },

  "GET /api/attempts/:id/files/:index": ({ params, db, user }) => {
    requireUser(user);
    const a = db.findById("assessmentAttempts", params.id);
    const course = a ? db.findById("courses", a.courseId) : null;
    const allowed = a && (a.userId === user.id || user.role === "ADMIN" || (a.evaluatorId && a.evaluatorId === user.id) || (user.role === "MENTOR" && course?.mentorId === user.id));
    if (!allowed) throw httpError(404, "File not found.");
    const index = Number(params.index);
    const f = Number.isInteger(index) && index >= 0 ? (a.submission?.files || [])[index] : null;
    if (!f?.key) throw httpError(404, "File not found.");
    return { url: `demo-file:${f.key}`, expiresAt: new Date(Date.now() + URL_TTL_MS).toISOString(), name: f.name, size: f.size, type: f.type };
  },

  "POST /api/attempts/:id/submit": ({ params, db, user }) => {
    requireUser(user);
    const a = ownAttempt(db, user, params.id);
    if (a.status !== "IN_PROGRESS") throw httpError(409, "This attempt is already submitted.");
    const sub = a.submission || {};
    if (!sub.text?.trim() && !sub.links?.length && !sub.files?.length) throw httpError(400, "Add your work before you submit.");
    const assessment = db.findById("assessments", a.assessmentId);
    checkFormats(assessment, sub);
    if (a.attemptNo === 1) {
      const due = dueAtFor(assessment, findEnrollment(db, user.id, a.courseId));
      if (due && new Date(due).getTime() < Date.now()) throw httpError(403, "The deadline for this assessment has passed. Contact support if you need help.");
    } else {
      const prev = db.find("assessmentAttempts", (x) => x.assessmentId === a.assessmentId && x.userId === user.id && x.attemptNo === a.attemptNo - 1);
      if (prev?.reassessUntil && new Date(prev.reassessUntil).getTime() < Date.now()) throw httpError(403, "Your reassessment window has closed.");
    }
    const updated = db.update("assessmentAttempts", a.id, { status: "SUBMITTED", submittedAt: now(), version: (a.version || 0) + 1, history: withHistory(a, "SUBMITTED", user.id, `Version ${(a.version || 0) + 1}`), updatedAt: now() });
    const course = courseOfAssessment(db, assessment);
    notify(db, user.id, { type: "COURSE", title: "Assessment submitted", body: `Your work for ${course?.title} is locked and waiting for review.`, link: `/app/assessments/${a.courseId}` });
    return attemptOut(db, updated);
  },

  "POST /api/attempts/:id/appeal": ({ params, body, db, user }) => {
    requireUser(user);
    const a = ownAttempt(db, user, params.id);
    const reason = String(body.reason || "").trim();
    if (reason.length < 20) throw httpError(400, "Explain your appeal in at least 20 characters.");
    if (!["FAILED", "REASSESSMENT_REQUIRED"].includes(a.status)) throw httpError(409, "You can appeal only after a result that isn't a pass.");
    if (a.appealReason) throw httpError(409, "You have already appealed this result.");
    if (db.find("assessmentAttempts", (x) => x.assessmentId === a.assessmentId && x.userId === a.userId && x.attemptNo > a.attemptNo)) {
      throw httpError(409, "You've started a newer attempt, so this result can't be appealed now.");
    }
    const updated = db.update("assessmentAttempts", a.id, { status: "APPEAL_PENDING", appealReason: reason.slice(0, 3000), history: withHistory(a, "APPEAL_PENDING", user.id, `from ${a.status}`), updatedAt: now() });
    const course = db.findById("courses", a.courseId);
    notifyAdmins(db, { type: "SYSTEM", title: "New assessment appeal", body: `${user.name} appealed a result in ${course?.title}.`, link: `/admin/evaluations/${a.id}` });
    return attemptOut(db, updated);
  },

  "POST /api/attempts/:id/onboarding": ({ params, body, db, user }) => {
    requireUser(user);
    const a = ownAttempt(db, user, params.id);
    if (a.status !== "PASSED") throw httpError(409, "Verification onboarding opens after you pass.");
    if (!URL_RE.test(String(body.portfolioUrl || "").trim())) throw httpError(400, "portfolioUrl: Links must start with https://");
    if (body.identityConfirmed !== true) throw httpError(400, "Confirm your identity details.");
    if (body.availabilityConfirmed !== true) throw httpError(400, "Confirm your availability.");
    // editable until approval; admins are notified once (the first submission)
    const first = !a.onboarding?.submittedAt;
    const onboarding = {
      portfolioUrl: String(body.portfolioUrl).trim(),
      identityConfirmed: true,
      payoutReady: Boolean(body.payoutReady),
      availabilityConfirmed: true,
      availabilityNote: body.availabilityNote ? String(body.availabilityNote).slice(0, 300) : undefined,
      submittedAt: first ? now() : a.onboarding.submittedAt,
      ...(first ? {} : { updatedAt: now() }),
    };
    const updated = db.update("assessmentAttempts", a.id, { onboarding, history: withHistory(a, "PASSED", user.id, first ? "Verification onboarding completed" : "Verification onboarding updated"), updatedAt: now() });
    const course = db.findById("courses", a.courseId);
    if (first) notifyAdmins(db, { type: "SYSTEM", title: "Verification ready to approve", body: `${user.name} passed ${course?.title} and completed onboarding.`, link: "/admin/verifications" });
    return attemptOut(db, updated);
  },

  "GET /api/me/skills": ({ db, user }) => {
    requireUser(user);
    return db
      .filter("skillVerifications", (v) => v.userId === user.id)
      .sort((a, b) => new Date(b.awardedAt) - new Date(a.awardedAt))
      .map((v) => verificationOut(db, v));
  },

  "GET /api/verify/skill/:code": ({ params, db }) => {
    const code = String(params.code || "").trim().toUpperCase();
    const v = db.find("skillVerifications", (x) => x.verifyCode.toUpperCase() === code);
    if (!v) throw httpError(404, "No skill badge matches this code. Check it and try again.");
    const out = verificationOut(db, v);
    return { code: v.verifyCode, name: db.findById("users", v.userId)?.name || "Campus learner", skill: { slug: out.skill.slug, name: out.skill.name }, level: v.level, status: out.status, awardedAt: v.awardedAt, expiresAt: v.expiresAt ?? null, rubricVersion: v.rubricVersion ?? null };
  },

  /* evaluators */
  "GET /api/evaluations": ({ query, db, user }) => {
    requireRole(user, ...STAFF);
    const isAdmin = user.role === "ADMIN";
    const status = query.status;
    const statuses =
      status === "REVIEWED"
        ? ["PASSED", "REASSESSMENT_REQUIRED", "FAILED", "VERIFIED"]
        : status === "ALL"
          ? ["SUBMITTED", "UNDER_REVIEW", "APPEAL_PENDING", "PASSED", "REASSESSMENT_REQUIRED", "FAILED", "VERIFIED"]
          : ["SUBMITTED", "UNDER_REVIEW", "APPEAL_PENDING"].includes(status)
            ? [status]
            : ["SUBMITTED", "UNDER_REVIEW", ...(isAdmin ? ["APPEAL_PENDING"] : [])];
    const mine = query.mine === "1" || query.mine === "true";
    return db
      .filter("assessmentAttempts", (a) => {
        if (a.userId === user.id || !statuses.includes(a.status)) return false;
        if (mine && a.evaluatorId !== user.id) return false;
        if (query.courseId && a.courseId !== query.courseId) return false;
        if (user.role === "MENTOR" && db.findById("courses", a.courseId)?.mentorId !== user.id) return false;
        return true;
      })
      .sort((a, b) => new Date(a.submittedAt || a.createdAt) - new Date(b.submittedAt || b.createdAt))
      .map((a) => attemptOut(db, a, { staff: true }));
  },

  "GET /api/evaluations/:id": ({ params, db, user }) => {
    requireRole(user, ...STAFF);
    const a = staffAttempt(db, user, params.id);
    const assessment = db.findById("assessments", a.assessmentId);
    const previous = db
      .filter("assessmentAttempts", (x) => x.assessmentId === a.assessmentId && x.userId === a.userId && x.attemptNo < a.attemptNo)
      .sort((x, y) => y.attemptNo - x.attemptNo)
      .map((x) => attemptOut(db, x, { staff: true }));
    return { ...attemptOut(db, a, { staff: true }), assessment: assessmentAdmin(db, assessment), rules: rulesFor(db, assessment), previous };
  },

  "POST /api/evaluations/:id/claim": ({ params, db, user }) => {
    requireRole(user, ...STAFF);
    const a = staffAttempt(db, user, params.id);
    if (a.status === "UNDER_REVIEW" && a.evaluatorId === user.id) return attemptOut(db, a, { staff: true });
    if (a.status !== "SUBMITTED") throw httpError(409, a.status === "UNDER_REVIEW" ? "Someone else is already reviewing this." : "This attempt isn't waiting for review.");
    const updated = db.update("assessmentAttempts", a.id, { status: "UNDER_REVIEW", evaluatorId: user.id, history: withHistory(a, "UNDER_REVIEW", user.id, "Claimed"), updatedAt: now() });
    return attemptOut(db, updated, { staff: true });
  },

  "GET /api/admin/evaluators": ({ query, db, user }) => {
    requireRole(user, "ADMIN");
    const mentorId = query.courseId ? db.findById("courses", query.courseId)?.mentorId : null;
    return db
      .filter("users", (u) => u.status !== "SUSPENDED" && (["EVALUATOR", "ADMIN"].includes(u.role) || u.id === mentorId))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((u) => ({ id: u.id, name: u.name, avatarUrl: u.avatarUrl ?? null, role: u.role, openReviews: db.filter("assessmentAttempts", (a) => a.status === "UNDER_REVIEW" && a.evaluatorId === u.id).length }));
  },

  "POST /api/evaluations/:id/assign": ({ params, body, db, user }) => {
    requireRole(user, "ADMIN");
    const a = staffAttempt(db, user, params.id);
    if (!["SUBMITTED", "UNDER_REVIEW"].includes(a.status)) throw httpError(409, "Only attempts waiting for review can be assigned.");
    const evaluator = db.findById("users", body.evaluatorId);
    if (!evaluator || !["ADMIN", "EVALUATOR", "MENTOR"].includes(evaluator.role)) throw httpError(400, "Pick an evaluator, mentor or admin.");
    if (evaluator.role === "MENTOR" && db.findById("courses", a.courseId)?.mentorId !== evaluator.id) throw httpError(400, "Mentors can only evaluate courses they teach.");
    if (evaluator.id === a.userId) throw httpError(400, "A student can't evaluate their own work.");
    const updated = db.update("assessmentAttempts", a.id, { status: "UNDER_REVIEW", evaluatorId: evaluator.id, history: withHistory(a, "UNDER_REVIEW", user.id, `Assigned to ${evaluator.name}`), updatedAt: now() });
    demoAudit(db, user, { action: "assessment.assign", entity: "AssessmentAttempt", entityId: a.id, before: snapshot(a), after: snapshot(updated) });
    if (evaluator.id !== user.id) {
      const student = db.findById("users", a.userId);
      notify(db, evaluator.id, { type: "SYSTEM", title: "Assessment assigned to you", body: `${student?.name} · ${db.findById("courses", a.courseId)?.title}`, link: `/admin/evaluations/${a.id}` });
    }
    return attemptOut(db, updated, { staff: true });
  },

  "POST /api/evaluations/:id/result": ({ params, body, db, user }) => {
    requireRole(user, ...STAFF);
    const a = staffAttempt(db, user, params.id);
    if (a.status !== "SUBMITTED" && a.status !== "UNDER_REVIEW") throw httpError(409, "This attempt isn't waiting for a result.");
    if (a.status === "UNDER_REVIEW" && a.evaluatorId !== user.id && user.role !== "ADMIN") throw httpError(403, "This attempt is assigned to another evaluator.");
    const feedback = String(body.feedback || "").trim();
    if (feedback.length < 20) throw httpError(400, "Write feedback of at least 20 characters so the student knows what to do next.");
    const rubric = db.findById("rubrics", a.rubricId) || db.findById("rubrics", db.findById("assessments", a.assessmentId)?.rubricId);
    const { rows, total, criticalFailed } = scoreAgainst(rubric.criteria || [], body.scores);
    const assessment = db.findById("assessments", a.assessmentId);
    const decision = decideResult({ total, criticalFailed, attemptNo: a.attemptNo, rules: rulesFor(db, assessment) });
    const updated = db.update("assessmentAttempts", a.id, {
      status: decision.status,
      evaluatorId: user.id,
      rubricId: rubric.id,
      scores: rows,
      totalScore: total,
      passed: decision.passed,
      feedback,
      evaluatorNotes: body.evaluatorNotes ? String(body.evaluatorNotes).trim() : null,
      reviewedAt: now(),
      reassessUntil: decision.reassessUntil,
      history: withHistory(a, decision.status, user.id, `${total}/100${criticalFailed.length ? ` · critical not met: ${criticalFailed.join(", ")}` : ""}`),
      updatedAt: now(),
    });
    demoAudit(db, user, { action: "assessment.result", entity: "AssessmentAttempt", entityId: a.id, before: snapshot(a), after: { ...snapshot(updated), rubricVersion: rubric.version } });
    if (decision.passed) {
      const cert = db.find("certificates", (c) => c.userId === a.userId && c.courseId === a.courseId && c.score == null);
      if (cert) db.update("certificates", cert.id, { score: total });
    }
    const course = db.findById("courses", a.courseId);
    const msg =
      decision.status === "PASSED"
        ? { title: `You passed: ${course?.title}`, body: `Score ${total}/100. Next: complete verification onboarding to get your skill badge.` }
        : decision.status === "REASSESSMENT_REQUIRED"
          ? { title: `Reassessment needed: ${course?.title}`, body: `Score ${total}/100. Read the feedback and resubmit by ${new Date(decision.reassessUntil).toDateString()}.` }
          : { title: `Result: ${course?.title}`, body: `Score ${total}/100. This assessment is closed. Read the feedback. You can appeal if you think the result is wrong.` };
    notify(db, a.userId, { type: "COURSE", ...msg, link: `/app/assessments/${a.courseId}` });
    return attemptOut(db, updated, { staff: true });
  },

  "POST /api/evaluations/:id/appeal-decision": ({ params, body, db, user }) => {
    requireRole(user, "ADMIN");
    const a = staffAttempt(db, user, params.id);
    if (!["UPHOLD", "OVERTURN"].includes(body.decision)) throw httpError(400, "decision: pick UPHOLD or OVERTURN.");
    const note = String(body.note || "").trim();
    if (note.length < 10) throw httpError(400, "Explain the decision in at least 10 characters.");
    if (a.status !== "APPEAL_PENDING") throw httpError(409, "This attempt has no pending appeal.");
    if (a.evaluatorId === user.id) throw httpError(403, "An appeal must be decided by someone other than the original evaluator.");
    const appealedAt = [...(a.history || [])].reverse().find((h) => h.status === "APPEAL_PENDING");
    const from = appealedAt?.note?.replace(/^from /, "") || (a.reassessUntil ? "REASSESSMENT_REQUIRED" : "FAILED");
    let patch;
    if (body.decision === "OVERTURN") patch = { status: "PASSED", passed: true, reassessUntil: null };
    else {
      const spent = appealedAt ? Date.now() - new Date(appealedAt.at).getTime() : 0;
      patch = { status: from, reassessUntil: from === "REASSESSMENT_REQUIRED" && a.reassessUntil ? new Date(new Date(a.reassessUntil).getTime() + spent).toISOString() : a.reassessUntil };
    }
    const updated = db.update("assessmentAttempts", a.id, { ...patch, appealDecision: `${body.decision}: ${note}`, appealReviewerId: user.id, history: withHistory(a, patch.status, user.id, `Appeal ${body.decision.toLowerCase()}`), updatedAt: now() });
    demoAudit(db, user, { action: "assessment.appeal_decision", entity: "AssessmentAttempt", entityId: a.id, before: snapshot(a), after: snapshot(updated), reason: note });
    if (patch.status === "PASSED") {
      const cert = db.find("certificates", (c) => c.userId === a.userId && c.courseId === a.courseId && c.score == null);
      if (cert) db.update("certificates", cert.id, { score: a.totalScore });
    }
    const course = db.findById("courses", a.courseId);
    notify(db, a.userId, {
      type: "COURSE",
      title: body.decision === "OVERTURN" ? `Appeal accepted: ${course?.title}` : `Appeal reviewed: ${course?.title}`,
      body: body.decision === "OVERTURN" ? "Your result is now a pass. Next: complete verification onboarding." : "The original result stands. Read the reviewer's note for details.",
      link: `/app/assessments/${a.courseId}`,
    });
    return attemptOut(db, updated, { staff: true });
  },

  /* admin: rubrics + config */
  "GET /api/admin/rubrics": ({ db, user }) => {
    requireRole(user, "ADMIN");
    defaultRubric(db);
    return db
      .all("rubrics")
      .slice()
      .sort((a, b) => a.key.localeCompare(b.key) || b.version - a.version)
      .map((r) => ({
        ...rubricOut(r),
        assessmentsCount: db.filter("assessments", (x) => x.rubricId === r.id).length,
        attemptsCount: db.filter("assessmentAttempts", (x) => x.rubricId === r.id).length,
      }));
  },

  "POST /api/admin/rubrics": ({ body, db, user }) => {
    requireRole(user, "ADMIN");
    const name = String(body.name || "").trim();
    if (name.length < 2) throw httpError(400, "name: add a rubric name.");
    const criteria = normaliseCriteria(body.criteria);
    const key = body.key ? String(body.key).toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 60) : `${slugify(name)}-${Date.now().toString(36)}`;
    const versions = db.filter("rubrics", (r) => r.key === key).sort((a, b) => b.version - a.version);
    const latest = versions[0];
    const created = db.insert("rubrics", { id: uid("rb"), key, version: (latest?.version || 0) + 1, name, criteria, status: "ACTIVE", createdById: user.id });
    if (latest) {
      const olderIds = new Set(versions.map((r) => r.id));
      versions.forEach((r) => db.update("rubrics", r.id, { status: "ARCHIVED" }));
      db.filter("assessments", (x) => olderIds.has(x.rubricId)).forEach((x) => db.update("assessments", x.id, { rubricId: created.id, updatedAt: now() }));
    }
    demoAudit(db, user, { action: latest ? "rubric.version" : "rubric.create", entity: "Rubric", entityId: created.id, before: latest ? rubricOut(latest) : null, after: rubricOut(created) });
    return rubricOut(created);
  },

  "GET /api/admin/assessments": ({ db, user }) => {
    requireRole(user, "ADMIN");
    return db
      .all("courses")
      .slice()
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((c) => {
        const a = db.find("assessments", (x) => x.courseId === c.id);
        return {
          course: { id: c.id, title: c.title, level: c.level, status: c.status || "PUBLISHED", skill: skillOf(db, c) },
          assessment: a ? { ...assessmentAdmin(db, a), attemptsCount: db.filter("assessmentAttempts", (x) => x.assessmentId === a.id).length } : null,
        };
      });
  },

  "GET /api/admin/courses/:id/assessment": ({ params, db, user }) => {
    requireRole(user, "ADMIN");
    const course = getCourse(db, params.id);
    const a = db.find("assessments", (x) => x.courseId === course.id);
    if (a) return assessmentAdmin(db, a);
    const rubric = defaultRubric(db);
    return { id: null, courseId: course.id, title: `${course.title}: final project`, brief: "", instructions: "", allowedFormats: ["link", "text"], rubricId: rubric.id, rubric: rubricOut(rubric), ...settingsRules(db), dueDays: null };
  },

  "PUT /api/admin/courses/:id/assessment": ({ params, body, db, user }) => {
    requireRole(user, "ADMIN");
    const course = getCourse(db, params.id);
    const title = String(body.title || "").trim();
    if (title.length < 3) throw httpError(400, "title: add a title.");
    const formats = (body.allowedFormats || []).filter((f) => ["link", "text", "file"].includes(f));
    if (!formats.length) throw httpError(400, "Allow at least one format.");
    if (!db.findById("rubrics", body.rubricId)) throw httpError(400, "Pick a rubric.");
    const int = (v, min, max, name) => {
      if (v == null || v === "") return undefined;
      const x = Number(v);
      if (!Number.isInteger(x) || x < min || x > max) throw httpError(400, `${name}: must be a whole number from ${min} to ${max}.`);
      return x;
    };
    const d = settingsRules(db);
    const data = {
      title,
      brief: String(body.brief || ""),
      instructions: String(body.instructions || ""),
      allowedFormats: formats,
      rubricId: body.rubricId,
      passScore: int(body.passScore, 1, 100, "passScore") ?? d.passScore,
      maxAttempts: int(body.maxAttempts, 1, 5, "maxAttempts") ?? d.maxAttempts,
      reassessWindowDays: int(body.reassessWindowDays, 1, 90, "reassessWindowDays") ?? d.reassessWindowDays,
      dueDays: int(body.dueDays, 1, 365, "dueDays") ?? null,
      updatedAt: now(),
    };
    const before = db.find("assessments", (x) => x.courseId === course.id);
    const saved = before ? db.update("assessments", before.id, data) : db.insert("assessments", { id: uid("as"), courseId: course.id, ...data });
    demoAudit(db, user, { action: before ? "assessment.update" : "assessment.create", entity: "Assessment", entityId: saved.id, before: before || null, after: data });
    return assessmentAdmin(db, saved);
  },

  /* admin: verifications */
  "GET /api/admin/verifications": ({ query, db, user }) => {
    requireRole(user, "ADMIN");
    const q = String(query.q || "").trim().toLowerCase();
    const matchUser = (userId) => {
      if (!q) return true;
      const u = db.findById("users", userId);
      return `${u?.name || ""} ${u?.email || ""}`.toLowerCase().includes(q);
    };
    if (query.pending === "1" || query.pending === "true") {
      return db
        .filter("assessmentAttempts", (a) => a.status === "PASSED" && a.onboarding?.submittedAt && matchUser(a.userId) && (!query.skill || skillOf(db, db.findById("courses", a.courseId))?.slug === query.skill))
        .sort((a, b) => new Date(a.updatedAt || a.createdAt) - new Date(b.updatedAt || b.createdAt))
        .map((a) => attemptOut(db, a, { staff: true }));
    }
    return db
      .all("skillVerifications")
      .map((v) => verificationOut(db, v, { staff: true }))
      .filter((v) => (!query.status || v.status === query.status) && (!query.skill || v.skill.slug === query.skill) && matchUser(v.userId))
      .sort((a, b) => new Date(b.awardedAt) - new Date(a.awardedAt));
  },

  "POST /api/admin/attempts/:id/verify": ({ params, body, db, user }) => {
    requireRole(user, "ADMIN");
    const a = db.findById("assessmentAttempts", params.id);
    if (!a) throw httpError(404, "Attempt not found.");
    if (a.userId === user.id) throw httpError(403, "You can't approve your own verification.");
    if (a.status !== "PASSED") throw httpError(409, "Only a passed assessment can be verified.");
    if (!a.onboarding?.submittedAt) throw httpError(409, "The student hasn't finished verification onboarding yet.");
    const course = db.findById("courses", a.courseId);
    const skillId = skillIdForCourse(course);
    if (!skillId) throw httpError(409, "Link this course to a skill in the catalogue before verifying.");
    const rubric = db.findById("rubrics", a.rubricId);
    const awardedAt = now();
    const note = body.note ? String(body.note).trim().slice(0, 1000) : null;
    const evidence = [...(a.submission?.links || []).slice(0, 3).map((url, i) => ({ label: i ? `Submission link ${i + 1}` : "Assessment submission", url })), { label: "Portfolio", url: a.onboarding.portfolioUrl }];
    const existing = db.find("skillVerifications", (v) => v.userId === a.userId && v.skillId === skillId && v.level === course.level);
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
      expiresAt: expiryFrom(db),
      approvedById: user.id,
      revokedReason: null,
      history: [...(existing?.history || []), { status: "ACTIVE", at: awardedAt, by: user.id, reason: note || (renewed ? "Renewed after a new pass" : "Approved") }],
      updatedAt: awardedAt,
    };
    const v = existing ? db.update("skillVerifications", existing.id, data) : db.insert("skillVerifications", { id: uid("sv"), userId: a.userId, skillId, level: course.level, verifyCode: uniqueSkillCode(db), ...data });
    db.update("assessmentAttempts", a.id, { status: "VERIFIED", history: withHistory(a, "VERIFIED", user.id, note), updatedAt: now() });
    demoAudit(db, user, { action: "verification.approve", entity: "SkillVerification", entityId: v.id, before: existing || null, after: { status: "ACTIVE", attemptId: a.id, skillId, level: course.level }, reason: note });
    const skill = skillOf(db, course);
    notify(db, a.userId, { type: "COURSE", title: `Verified: ${skill?.name || course.title}`, body: `Your ${course.level.toLowerCase()} skill badge is live. Next: set your availability so project managers can consider you.`, link: "/app/skills" });
    return verificationOut(db, v, { staff: true });
  },

  "POST /api/admin/verifications/:id/revoke": ({ params, body, db, user }) => changeVerification(db, user, params.id, body, { from: ["ACTIVE", "EXPIRED"], to: "REVOKED", action: "verification.revoke" }),
  "POST /api/admin/verifications/:id/reinstate": ({ params, body, db, user }) => changeVerification(db, user, params.id, body, { from: ["REVOKED", "EXPIRED"], to: "ACTIVE", action: "verification.reinstate" }),
};

function changeVerification(db, user, id, body, { from, to, action }) {
  requireRole(user, "ADMIN");
  const reason = String(body.reason || "").trim();
  if (reason.length < 5) throw httpError(400, "Add a reason (at least 5 characters).");
  const v = db.findById("skillVerifications", id);
  if (!v) throw httpError(404, "Verification not found.");
  const current = verificationStatus(v);
  if (!from.includes(current)) throw httpError(409, `This badge is ${current.toLowerCase()}.`);
  const renew = to === "ACTIVE" && v.expiresAt && new Date(v.expiresAt) < new Date();
  const expiresAt = renew ? expiryFrom(db) : v.expiresAt ?? null;
  const updated = db.update("skillVerifications", v.id, {
    status: to,
    expiresAt,
    revokedReason: to === "REVOKED" ? reason : null,
    history: [...(v.history || []), { status: to, at: now(), by: user.id, reason }],
    updatedAt: now(),
  });
  demoAudit(db, user, { action, entity: "SkillVerification", entityId: v.id, before: { status: current }, after: { status: to, expiresAt }, reason });
  const skill = verificationOut(db, updated).skill;
  notify(db, v.userId, {
    type: "SYSTEM",
    title: to === "REVOKED" ? `Skill badge revoked: ${skill.name}` : `Skill badge reinstated: ${skill.name}`,
    body: to === "REVOKED" ? `Reason: ${reason}. Contact support if you have questions.` : "Your skill badge is active again.",
    link: "/app/skills",
  });
  return verificationOut(db, updated, { staff: true });
}
