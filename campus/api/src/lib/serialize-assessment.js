import { miniUser } from "./serialize.js";
import { readStatus, dueAtFor } from "../services/assessment.js";

/**
 * Assessment / verification shapes (API_CONTRACT.md "Spec v1.0 → Assessment & verification").
 * Students never see evaluator identity, internal evaluator notes, or who acted in the status history.
 */

const criteriaOf = (rubric) => (Array.isArray(rubric?.criteria) ? rubric.criteria : []);

export const rubricOut = (r) =>
  r
    ? {
        id: r.id,
        key: r.key,
        version: r.version,
        name: r.name,
        criteria: criteriaOf(r).map((c) => ({ id: c.id, label: c.label, weight: c.weight, maxScore: c.maxScore, critical: Boolean(c.critical), guide: c.guide || "" })),
        status: r.status,
        createdAt: r.createdAt,
      }
    : null;

/** AssessmentPublic: what a student sees before and during an attempt. */
export function assessmentPublic(a, { enrollment = null } = {}) {
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
    rubric: rubricOut(a.rubric),
  };
}

/** Admin config shape (adds timestamps). */
export const assessmentAdmin = (a) => (a ? { ...assessmentPublic(a), rubricId: a.rubricId, createdAt: a.createdAt, updatedAt: a.updatedAt } : null);

/** Files are private storage keys (open them through GET /api/attempts/:id/files/:index); a public URL is never returned. */
const fileOf = (f) => ({ key: f?.key ?? null, name: f?.name || "file", size: Number(f?.size) || 0, type: f?.type || "" });
const submissionOf = (s) => ({ text: s?.text || "", links: Array.isArray(s?.links) ? s.links : [], files: Array.isArray(s?.files) ? s.files.map(fileOf) : [] });

/** Per-criterion scores with labels from the exact rubric version used. */
function scoresWithLabels(attempt, rubric) {
  const byId = new Map(criteriaOf(rubric).map((c) => [c.id, c]));
  return (Array.isArray(attempt.scores) ? attempt.scores : []).map((s) => {
    const c = byId.get(s.criterionId);
    return { criterionId: s.criterionId, label: c?.label || s.criterionId, maxScore: c?.maxScore ?? null, weight: c?.weight ?? null, critical: Boolean(c?.critical), score: s.score, note: s.note || "" };
  });
}

/**
 * Attempt. staff=true adds evaluator, internal notes, the student (min) and full history.
 * Pass rubric (the attempt's version) for labelled scores, course for the course block.
 */
export function attemptOut(a, { staff = false, course } = {}) {
  if (!a) return null;
  const rubric = a.rubric || a.assessment?.rubric || null;
  const c = course || a.assessment?.course || null;
  const history = (Array.isArray(a.history) ? a.history : []).filter((h) => staff || h.status !== "REMINDED");
  const out = {
    id: a.id,
    assessmentId: a.assessmentId,
    courseId: c?.id ?? a.assessment?.courseId ?? null,
    userId: a.userId,
    attemptNo: a.attemptNo,
    status: readStatus(a),
    storedStatus: a.status,
    submission: submissionOf(a.submission),
    version: a.version,
    submittedAt: a.submittedAt,
    rubricId: a.rubricId,
    rubricVersion: rubric?.version ?? null,
    scores: scoresWithLabels(a, rubric),
    totalScore: a.totalScore,
    passed: a.passed,
    feedback: a.feedback,
    reviewedAt: a.reviewedAt,
    reassessUntil: a.reassessUntil,
    onboarding: a.onboarding || null,
    appealReason: a.appealReason,
    appealDecision: a.appealDecision,
    history: history.map((h) => (staff ? h : { status: h.status, at: h.at, note: ["APPEAL_PENDING", "UNDER_REVIEW"].includes(h.status) ? null : h.note })), // review notes can name the evaluator
    verificationId: a.verification?.id ?? null,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
  if (c) out.course = { id: c.id, title: c.title, level: c.level, skill: c.skill ? { id: c.skill.id, slug: c.skill.slug, name: c.skill.name } : null };
  if (staff) {
    out.evaluatorId = a.evaluatorId;
    out.evaluator = a.evaluator ? { id: a.evaluator.id, name: a.evaluator.name, avatarUrl: a.evaluator.avatarUrl ?? null } : null;
    out.evaluatorNotes = a.evaluatorNotes;
    out.appealReviewerId = a.appealReviewerId;
    if (a.user) out.user = miniUser(a.user);
    if (rubric) out.rubric = rubricOut(rubric);
  }
  return out;
}

/** ACTIVE past its expiry reads as EXPIRED. */
export const verificationStatus = (v, at = Date.now()) =>
  v.status === "ACTIVE" && v.expiresAt && new Date(v.expiresAt).getTime() < at ? "EXPIRED" : v.status;

/** SkillVerification (owner / admin view). */
export function verificationOut(v, { staff = false } = {}) {
  if (!v) return null;
  const out = {
    id: v.id,
    userId: v.userId,
    skill: v.skill ? { id: v.skill.id, slug: v.skill.slug, name: v.skill.name } : { id: v.skillId, slug: null, name: "Skill" },
    courseId: v.courseId,
    course: v.course ? { id: v.course.id, title: v.course.title } : null,
    level: v.level,
    status: verificationStatus(v),
    awardedAt: v.awardedAt,
    expiresAt: v.expiresAt,
    rubricId: v.rubricId,
    rubricVersion: v.rubricVersion,
    evidence: Array.isArray(v.evidence) ? v.evidence : [],
    verifyCode: v.verifyCode,
    revokedReason: v.revokedReason,
    history: (Array.isArray(v.history) ? v.history : []).map((h) => (staff ? h : { status: h.status, at: h.at, reason: h.reason ?? null })),
    approvedById: v.approvedById,
    attemptId: v.attemptId,
  };
  if (v.approvedBy) out.approvedBy = { id: v.approvedBy.id, name: v.approvedBy.name };
  if (staff && v.user) out.user = miniUser(v.user);
  return out;
}

/** Public badge check (like the certificate check): the holder's name, never ids, contact, evidence or history. */
export function verificationPublic(v) {
  return {
    code: v.verifyCode,
    name: v.user?.name || "Campus learner",
    skill: v.skill ? { slug: v.skill.slug, name: v.skill.name } : null,
    level: v.level,
    status: verificationStatus(v),
    awardedAt: v.awardedAt,
    expiresAt: v.expiresAt,
    rubricVersion: v.rubricVersion,
  };
}
