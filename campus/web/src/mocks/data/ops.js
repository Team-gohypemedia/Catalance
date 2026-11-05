/**
 * Demo seed for the ops domain (F2 workstream): the audit log (spec §3 Admin, §10 AuditLog, §15).
 * Entries are derived from the other domains' seeds, so every entityId points at a real demo record:
 * access changes, settings, colleges, gig payouts, offline payments and refunds, assessment results,
 * verifications (incl. a revocation), project offers, finance splits and payouts, support tickets, report exports.
 */
import { daysAgo, hoursAgo } from "../utils";
import core from "./core";
import earn from "./earn";
import learning from "./learning";
import assessment from "./assessment";
import payments from "./payments";
import projects from "./projects";
import platform from "./platform";

const ROLE = Object.fromEntries(core.users.map((u) => [u.id, u.role]));
const list = (v) => (Array.isArray(v) ? v : []);
const ms = (v) => (v ? new Date(v).getTime() : 0);
const later = (iso, minutes) => new Date(Math.min(Date.now(), ms(iso) + minutes * 60000)).toISOString();

const auditLogs = [];
const add = (actorId, action, entity, entityId, { before = null, after = null, reason = null, at }) =>
  auditLogs.push({
    id: `aud_${String(auditLogs.length + 1).padStart(3, "0")}`,
    actorId,
    actorRole: ROLE[actorId] || null,
    action,
    entity,
    entityId,
    before,
    after,
    reason,
    ip: "103.21.58.14",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130",
    createdAt: at,
  });

/* access changes: staff roles granted when the team was set up */
add("u_admin", "user.role", "User", "u_evaluator", { before: { role: "STUDENT" }, after: { role: "EVALUATOR" }, at: daysAgo(60) });
add("u_admin", "user.role", "User", "u_pm", { before: { role: "STUDENT" }, after: { role: "PROJECT_MANAGER" }, at: daysAgo(60) });
add("u_admin", "user.role", "User", "u_finance", { before: { role: "STUDENT" }, after: { role: "FINANCE" }, at: daysAgo(59) });
const suspended = core.users.find((u) => u.id === "s_31") || core.users.find((u) => u.role === "STUDENT" && u.id.startsWith("s_"));
if (suspended) {
  add("u_admin", "user.status", "User", suspended.id, { before: { status: "ACTIVE" }, after: { status: "SUSPENDED" }, reason: "Shared a paid course login in a public group.", at: daysAgo(21) });
  add("u_admin", "user.status", "User", suspended.id, { before: { status: "SUSPENDED" }, after: { status: "ACTIVE" }, reason: "Appeal accepted after a call.", at: daysAgo(14) });
}

/* settings (spec §11: editable from admin) */
add("u_admin", "settings.update", "PlatformSetting", "projects.offerExpiryHours", { before: { "projects.offerExpiryHours": 72 }, after: { "projects.offerExpiryHours": 48 }, reason: "Spec default: offers expire in 48 hours.", at: daysAgo(45) });
add("u_admin", "settings.update", "PlatformSetting", "flags.gigs,flags.wallet", { before: { "flags.gigs": true, "flags.wallet": true }, after: { "flags.gigs": false, "flags.wallet": false }, reason: "Gigs and wallet off for the first release.", at: daysAgo(44) });

/* colleges */
const college = core.colleges.find((c) => c.verified) || core.colleges[0];
if (college) add("u_admin", "college.verify", "College", college.id, { before: { verified: false }, after: { verified: true }, at: daysAgo(52) });

/* legacy gig payouts */
for (const a of list(earn.gigApplications).filter((x) => x.userId === "u_student" && x.status === "PAID").slice(0, 2)) {
  const gig = list(earn.gigs).find((g) => g.id === a.gigId);
  add("u_admin", "gig_application.payout", "GigApplication", a.id, { before: { status: "APPROVED" }, after: { status: "PAID", payoutINR: gig?.payoutINR ?? null }, at: a.updatedAt });
}

/* course catalogue */
const firstCourse = list(learning.courses)[0];
if (firstCourse) add("u_admin", "course.status", "Course", firstCourse.id, { before: { status: "DRAFT" }, after: { status: firstCourse.status || "PUBLISHED" }, at: daysAgo(70) });

/* payments: offline verifications and refunds */
for (const o of list(payments.courseOrders)) {
  if (o.status === "PAID" && o.provider === "OFFLINE" && o.paidAt) {
    add(o.verifiedById || "u_finance", "order.verify_offline", "CourseOrder", o.id, { before: { status: "PENDING" }, after: { status: "PAID", offlineReference: o.offlineReference, totalINR: o.totalINR }, at: o.paidAt });
  }
  if (o.refundedAt) {
    add(o.refundedById || "u_admin", "order.refund", "CourseOrder", o.id, { before: { status: "PAID" }, after: { status: "REFUNDED", refundINR: o.refundINR }, reason: o.refundReason, at: o.refundedAt });
  }
}

/* assessment results and verification decisions */
for (const at of list(assessment.assessmentAttempts).filter((x) => x.reviewedAt && x.evaluatorId)) {
  const status = at.passed ? "PASSED" : list(at.history).find((h) => ["REASSESSMENT_REQUIRED", "FAILED"].includes(h.status))?.status || (at.passed === false ? "REASSESSMENT_REQUIRED" : at.status);
  add(at.evaluatorId, "assessment.result", "AssessmentAttempt", at.id, { before: { status: "UNDER_REVIEW" }, after: { status, totalScore: at.totalScore, rubricId: at.rubricId }, at: at.reviewedAt });
}
for (const v of list(assessment.skillVerifications)) {
  add(v.approvedById || "u_admin", "verification.approve", "SkillVerification", v.id, { after: { status: "ACTIVE", level: v.level, verifyCode: v.verifyCode }, at: v.awardedAt });
  const revoked = list(v.history).find((h) => h.status === "REVOKED");
  if (revoked) add(revoked.by || "u_admin", "verification.revoke", "SkillVerification", v.id, { before: { status: "ACTIVE" }, after: { status: "REVOKED" }, reason: revoked.reason || v.revokedReason, at: revoked.at });
}

/* project offers: created by the PM, split set and payouts made by finance */
for (const o of list(projects.projectOffers)) {
  add(o.pmId || "u_pm", "offer.create", "ProjectOffer", o.id, { after: { title: o.title, studentId: o.studentId, payoutINR: o.payoutINR, status: "OFFERED" }, reason: o.shortlistReason || null, at: later(o.createdAt, 1) });
  if (o.clientPriceINR) {
    add("u_finance", "finance.split", "ProjectOffer", o.id, {
      before: { clientPriceINR: null },
      after: { clientPriceINR: o.clientPriceINR, freelancerSharePercent: o.freelancerSharePercent ?? 50, platformShareINR: o.platformShareINR ?? null },
      at: later(o.createdAt, 90),
    });
  }
  if (o.payoutStatus === "PAID" && o.paidAt) {
    add("u_finance", "payout.paid", "ProjectOffer", o.id, { before: { payoutStatus: "ELIGIBLE" }, after: { payoutStatus: "PAID", payoutINR: o.payoutINR, payoutRef: o.payoutRef }, at: o.paidAt });
  }
}

/* support */
for (const t of list(platform.supportTickets).filter((x) => x.ownerId).slice(0, 3)) {
  add(t.ownerId, "support.update", "SupportTicket", t.id, { before: { status: "OPEN" }, after: { status: t.status, priority: t.priority }, at: later(t.createdAt, 120) });
}

/* report exports (exports are audited too) */
add("u_finance", "report.export", "Report", "finance", { after: { rows: 30 }, at: daysAgo(3) });
add("u_admin", "report.export", "Report", "growth", { after: { rows: 30 }, at: hoursAgo(26) });

auditLogs.sort((a, b) => ms(b.createdAt) - ms(a.createdAt));

export default { auditLogs };
