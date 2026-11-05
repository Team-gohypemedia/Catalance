import { prisma } from "../lib/prisma.js";
import { httpError } from "../lib/errors.js";
import { getSettings } from "../lib/settings.js";
import { notify } from "../lib/notify.js";
import { randomCode, slugify } from "../lib/util.js";

/**
 * Assessment, rubric and skill-verification rules (spec §8, §5.1 steps 9–13, §17).
 * Routes in routes/assessments.js; shapes in lib/serialize-assessment.js.
 * The demo engine mirrors these rules in web/src/mocks/handlers/assessment.js — keep both in step.
 */

export const OPEN_STATUSES = ["IN_PROGRESS", "SUBMITTED", "UNDER_REVIEW", "APPEAL_PENDING"];
export const RESULT_STATUSES = ["PASSED", "REASSESSMENT_REQUIRED", "FAILED", "VERIFIED"];
/** A critical criterion passes at ≥ half its max score (contract "Scoring"). */
export const CRITICAL_RATIO = 0.5;
/** Remind the student this many days before the reassessment window closes. */
export const REMINDER_DAYS = 3;
export const DEFAULT_RUBRIC_KEY = "practical-default";

const DAY = 86400000;

/** The default practical rubric (used when a course has no assessment yet). */
export const DEFAULT_CRITERIA = [
  { id: "brief", label: "Meets the brief", weight: 30, maxScore: 10, critical: true, guide: "Every required deliverable is present and answers the brief. 10 = all, 5 = most, 0 = missing core parts." },
  { id: "quality", label: "Quality of work", weight: 30, maxScore: 10, critical: false, guide: "Accurate, clean and consistent. Would a paying client accept it with small edits?" },
  { id: "process", label: "Decisions explained", weight: 20, maxScore: 10, critical: false, guide: "A short note explains the approach, choices and trade-offs." },
  { id: "delivery", label: "Client-ready delivery", weight: 20, maxScore: 10, critical: true, guide: "Files and links open, are named clearly and can be handed over as they are." },
];

/** Normalise criteria from an admin edit: ids, positive weights and max scores, booleans. */
export function normaliseCriteria(criteria) {
  if (!Array.isArray(criteria) || !criteria.length) throw httpError(400, "Add at least one criterion.");
  const seen = new Set();
  return criteria.map((c, i) => {
    const label = String(c.label || "").trim();
    if (!label) throw httpError(400, `Criterion ${i + 1} needs a name.`);
    let id = slugify(c.id || label).slice(0, 40) || `c${i + 1}`;
    while (seen.has(id)) id = `${id}-${i + 1}`;
    seen.add(id);
    const weight = Number(c.weight);
    const maxScore = Number(c.maxScore ?? 10);
    if (!(weight > 0)) throw httpError(400, `“${label}” needs a weight above 0.`);
    if (!(maxScore > 0) || !Number.isInteger(maxScore)) throw httpError(400, `“${label}” needs a whole-number max score above 0.`);
    return { id, label, weight, maxScore, critical: Boolean(c.critical), guide: String(c.guide || "").trim() };
  });
}

/**
 * Score against a rubric version. scores: [{ criterionId, score, note }].
 * total = Σ(weight × score/maxScore) / Σweight × 100 (rounded). Every criterion must be scored.
 */
export function scoreAgainst(criteria, scores) {
  const byId = new Map((scores || []).map((s) => [s.criterionId, s]));
  const totalWeight = criteria.reduce((s, c) => s + c.weight, 0) || 1;
  let weighted = 0;
  const criticalFailed = [];
  const rows = criteria.map((c) => {
    const s = byId.get(c.id);
    if (!s || s.score == null || !Number.isFinite(Number(s.score))) throw httpError(400, `Score “${c.label}”.`);
    const score = Number(s.score);
    if (score < 0 || score > c.maxScore) throw httpError(400, `“${c.label}” must be between 0 and ${c.maxScore}.`);
    weighted += c.weight * (score / c.maxScore);
    if (c.critical && score < c.maxScore * CRITICAL_RATIO) criticalFailed.push(c.id);
    return { criterionId: c.id, score, note: String(s.note || "").trim().slice(0, 2000) };
  });
  return { rows, total: Math.round((weighted / totalWeight) * 100), criticalFailed };
}

/** Effective rules for one assessment (row values; settings only fill gaps). */
export function rulesFor(assessment, settings = {}) {
  return {
    passScore: assessment?.passScore ?? settings["assessment.passScore"] ?? 70,
    maxAttempts: assessment?.maxAttempts ?? settings["assessment.maxAttempts"] ?? 2,
    reassessWindowDays: assessment?.reassessWindowDays ?? settings["assessment.reassessWindowDays"] ?? 14,
  };
}

/** PASSED | REASSESSMENT_REQUIRED | FAILED from a score (spec §8.1). */
export function decideResult({ total, criticalFailed, attemptNo, rules, at = new Date() }) {
  if (total >= rules.passScore && !criticalFailed.length) return { status: "PASSED", passed: true, reassessUntil: null };
  if (attemptNo < rules.maxAttempts) {
    return { status: "REASSESSMENT_REQUIRED", passed: false, reassessUntil: new Date(at.getTime() + rules.reassessWindowDays * DAY) };
  }
  return { status: "FAILED", passed: false, reassessUntil: null };
}

export const historyEntry = (status, by, note = null) => ({ status, at: new Date().toISOString(), by: by ?? null, note: note || null });
export const withHistory = (attempt, status, by, note) => [...(Array.isArray(attempt.history) ? attempt.history : []), historyEntry(status, by, note)];

export const windowOpen = (attempt, at = Date.now()) =>
  attempt?.status === "REASSESSMENT_REQUIRED" && attempt.reassessUntil && new Date(attempt.reassessUntil).getTime() > at;

/** Deadline for the first attempt: enrolment start + dueDays (null = no deadline). */
export const dueAtFor = (assessment, enrollment) =>
  assessment?.dueDays && enrollment?.startedAt ? new Date(new Date(enrollment.startedAt).getTime() + assessment.dueDays * DAY) : null;

/** Status as the student reads it: a lapsed reassessment window reads as FAILED (closed; appeal stays open). */
export function readStatus(attempt, at = Date.now()) {
  if (!attempt) return "NOT_STARTED";
  if (attempt.status === "REASSESSMENT_REQUIRED" && !windowOpen(attempt, at)) return "FAILED";
  return attempt.status;
}

/** What the student can do next on one course assessment. attempts: newest first. */
export function stateFor({ assessment, attempts, enrollment, settings, at = Date.now() }) {
  const rules = rulesFor(assessment, settings);
  const latest = attempts[0] || null;
  const status = readStatus(latest, at);
  const dueAt = dueAtFor(assessment, enrollment);
  const overdue = !latest && dueAt && dueAt.getTime() < at;
  const canReassess = Boolean(latest && windowOpen(latest, at) && latest.attemptNo < rules.maxAttempts);
  return {
    status,
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

/** The shared default rubric (latest ACTIVE version), created on first use. */
export async function defaultRubric(tx = prisma) {
  const found = await tx.rubric.findFirst({ where: { key: DEFAULT_RUBRIC_KEY }, orderBy: { version: "desc" } });
  if (found) return found;
  try {
    return await tx.rubric.create({ data: { key: DEFAULT_RUBRIC_KEY, version: 1, name: "Practical project (default)", criteria: DEFAULT_CRITERIA } });
  } catch {
    return tx.rubric.findFirst({ where: { key: DEFAULT_RUBRIC_KEY }, orderBy: { version: "desc" } });
  }
}

export const ASSESSMENT_INCLUDE = { rubric: true };

/** A course's assessment, created from settings defaults + the default rubric when missing. */
export async function ensureAssessment(course, tx = prisma) {
  const existing = await tx.assessment.findUnique({ where: { courseId: course.id }, include: ASSESSMENT_INCLUDE });
  if (existing) return existing;
  const settings = await getSettings();
  const rubric = await defaultRubric(tx);
  try {
    return await tx.assessment.create({
      data: {
        courseId: course.id,
        title: `${course.title}: final project`,
        brief: `Complete a practical project that shows you can do the work taught in **${course.title}** for a real client.`,
        instructions: "Work on your own. Submit a link to your work and a short note that explains your choices. You can save a draft and submit when ready. Once submitted, your work is locked for review.",
        allowedFormats: ["link", "text"],
        rubricId: rubric.id,
        passScore: settings["assessment.passScore"] ?? 70,
        maxAttempts: settings["assessment.maxAttempts"] ?? 2,
        reassessWindowDays: settings["assessment.reassessWindowDays"] ?? 14,
      },
      include: ASSESSMENT_INCLUDE,
    });
  } catch {
    // parallel first visits: another request created it
    return tx.assessment.findUnique({ where: { courseId: course.id }, include: ASSESSMENT_INCLUDE });
  }
}

/** Unique public verify code for a skill badge (VS-XXXX-XXXX). */
export async function uniqueSkillCode(tx = prisma) {
  for (;;) {
    const code = `VS-${randomCode(4)}-${randomCode(4)}`;
    if (!(await tx.skillVerification.findUnique({ where: { verifyCode: code } }))) return code;
  }
}

/** Expiry date for a new badge from settings verification.expiryMonths (null = none). */
export function expiryFrom(settings, at = new Date()) {
  const months = Number(settings["verification.expiryMonths"]);
  if (!months || months <= 0) return null;
  const d = new Date(at);
  d.setMonth(d.getMonth() + months);
  return d;
}

/** Attempt with everything staff views need. */
export const STAFF_ATTEMPT_INCLUDE = {
  user: { include: { college: true } },
  evaluator: { select: { id: true, name: true, avatarUrl: true, role: true } },
  rubric: true,
  assessment: { include: { rubric: true, course: { select: { id: true, title: true, level: true, mentorId: true, skillId: true, skill: { select: { id: true, slug: true, name: true } } } } } },
  verification: true,
};

/** Staff access to one attempt: ADMIN / EVALUATOR any, MENTOR only courses they teach. Never your own attempt. */
export function assertCanEvaluate(user, attempt) {
  if (attempt.userId === user.id) throw httpError(403, "You can't evaluate your own work.");
  if (user.role === "ADMIN" || user.role === "EVALUATOR") return;
  if (user.role === "MENTOR" && attempt.assessment?.course?.mentorId === user.id) return;
  throw httpError(404, "Attempt not found.");
}

/** Where-clause limiting the queue to what this staff member may see. */
export function queueScope(user) {
  if (user.role === "MENTOR") return { assessment: { course: { mentorId: user.id } }, userId: { not: user.id } };
  return { userId: { not: user.id } };
}

/**
 * "Reassessment window ending" reminders (spec §12). Runs lazily when a student opens their assessments (window
 * ≤ REMINDER_DAYS), and from the scheduler (services/scheduler.js, `withinHours: 48`). Sends once per attempt: a REMINDED
 * entry in history is the marker, written with a conditional update so a racing read and tick can't both send.
 */
export async function sendReassessReminders({ userId, withinHours } = {}, tx = prisma) {
  const soon = new Date(Date.now() + (withinHours ? withinHours * 3600000 : REMINDER_DAYS * DAY));
  const due = await tx.assessmentAttempt.findMany({
    where: { status: "REASSESSMENT_REQUIRED", reassessUntil: { gt: new Date(), lte: soon }, ...(userId ? { userId } : {}) },
    include: { assessment: { select: { courseId: true, course: { select: { title: true } } } } },
  });
  let sent = 0;
  for (const a of due) {
    if ((a.history || []).some((h) => h.status === "REMINDED")) continue;
    // a newer attempt already started → nothing to remind
    const newer = await tx.assessmentAttempt.findFirst({ where: { assessmentId: a.assessmentId, userId: a.userId, attemptNo: { gt: a.attemptNo } } });
    if (newer) continue;
    const marked = await tx.assessmentAttempt.updateMany({ where: { id: a.id, updatedAt: a.updatedAt }, data: { history: withHistory(a, "REMINDED", null, "Reassessment window ending") } });
    if (!marked.count) continue;
    const days = Math.max(1, Math.ceil((new Date(a.reassessUntil).getTime() - Date.now()) / DAY));
    await notify(
      a.userId,
      {
        type: "COURSE",
        title: `Reassessment closes in ${days} day${days === 1 ? "" : "s"}`,
        body: `Start your reassessment for ${a.assessment.course.title} before the window ends.`,
        link: `/app/assessments/${a.assessment.courseId}`,
        event: "reassessment.window_ending",
      },
      tx,
    );
    sent++;
  }
  return sent;
}
