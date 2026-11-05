import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { validate, zQ } from "../lib/validate.js";
import { httpError } from "../lib/errors.js";
import { requireAuth, requireRole } from "../lib/auth.js";
import { audit } from "../lib/audit.js";
import { track } from "../lib/analytics.js";
import { REPORT_NAMES, buildFunnel, buildReport, parseRange, toCsv } from "../services/reports-core.js";

/**
 * Compliance & ops (API_CONTRACT.md "Spec v1.0" → F2): audit log browser, spec §16 reports + CSV export, funnel.
 * Reports are derived from the domain tables, never from analytics events (see docs/ANALYTICS.md).
 */
const router = Router();
const adminOnly = [requireAuth, requireRole("ADMIN")];
const financeOrAdmin = [requireAuth, requireRole("FINANCE")]; // requireRole lets ADMIN through

/* ───────────── audit log ───────────── */

const PAGE = 50;
const auditQuery = z
  .object({ entity: zQ, entityId: zQ, actorId: zQ, action: zQ, from: zQ, to: zQ, cursor: zQ, format: zQ, limit: zQ })
  .passthrough();

const auditOut = (a) => ({
  id: a.id,
  actorId: a.actorId,
  actorRole: a.actorRole,
  actor: a.actor ? { id: a.actor.id, name: a.actor.name, role: a.actor.role } : null,
  action: a.action,
  entity: a.entity,
  entityId: a.entityId,
  before: a.before ?? null,
  after: a.after ?? null,
  reason: a.reason ?? null,
  ip: a.ip ?? null,
  createdAt: a.createdAt,
});

function auditWhere(q) {
  const range = q.from || q.to ? parseRange({ from: q.from, to: q.to }, { allTimeByDefault: true }) : null;
  if ((q.from || q.to) && !range) throw httpError(400, "Use dates like 2026-11-01 for from and to.");
  return {
    ...(q.entity ? { entity: q.entity } : {}),
    ...(q.entityId ? { entityId: q.entityId } : {}),
    ...(q.actorId ? { actorId: q.actorId } : {}),
    // "order." matches every order action; a full name matches exactly
    ...(q.action ? (q.action.endsWith(".") ? { action: { startsWith: q.action } } : { action: q.action }) : {}),
    ...(range ? { createdAt: { gte: range.from, lte: range.to } } : {}),
  };
}

router.get("/api/admin/audit", ...adminOnly, validate({ query: auditQuery }), async (req, res) => {
  const where = auditWhere(req.q);
  const orderBy = [{ createdAt: "desc" }, { id: "desc" }];
  const include = { actor: { select: { id: true, name: true, role: true } } };

  if (req.q.format === "csv") {
    const rows = await prisma.auditLog.findMany({ where, orderBy, include, take: 5000 });
    await audit(req, { action: "audit.export", entity: "AuditLog", after: { filters: req.q, rows: rows.length } });
    track("report.exported", { report: "audit", format: "csv" }, req.user.id);
    const csv = toCsv(
      rows.map((a) => ({
        at: a.createdAt.toISOString(),
        actor: a.actor?.name || "",
        actorRole: a.actorRole || "",
        action: a.action,
        entity: a.entity,
        entityId: a.entityId || "",
        reason: a.reason || "",
        before: a.before ?? "",
        after: a.after ?? "",
      })),
    );
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="campus-audit-${new Date().toISOString().slice(0, 10)}.csv"`);
    return res.send(csv);
  }

  const take = Math.min(Math.max(Number(req.q.limit) || PAGE, 1), 200);
  const rows = await prisma.auditLog.findMany({
    where,
    orderBy,
    include,
    take: take + 1,
    ...(req.q.cursor ? { cursor: { id: req.q.cursor }, skip: 1 } : {}),
  });
  const items = rows.slice(0, take).map(auditOut);
  res.json({ items, nextCursor: rows.length > take ? items[items.length - 1].id : null });
});

/* ───────────── reports ───────────── */

/** Everything the report builders need, as plain rows. Fine for MVP volumes; move hot reports to SQL aggregates at scale. */
async function loadReportData(name) {
  const need = {
    users: true,
    courses: ["course", "capacity"].includes(name),
    enrollments: ["course", "capacity"].includes(name),
    orders: ["growth", "course", "finance", "funnel"].includes(name),
    assessments: ["course", "capacity"].includes(name),
    attempts: ["course", "talent", "capacity", "funnel"].includes(name),
    verifications: ["talent", "marketplace", "funnel"].includes(name),
    offers: ["talent", "marketplace", "quality", "finance", "capacity", "funnel"].includes(name),
    tickets: ["quality", "capacity"].includes(name),
    skills: ["talent", "marketplace"].includes(name),
    submissions: name === "capacity",
  };
  const none = Promise.resolve([]);
  const [users, courses, enrollments, orders, assessments, attempts, verifications, offers, tickets, skills, submissions] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, role: true, status: true, createdAt: true, avatarUrl: true, headline: true, bio: true, city: true, collegeId: true, skills: true, links: true, availability: true },
    }),
    need.courses ? prisma.course.findMany({ select: { id: true, title: true, status: true, level: true, mentorId: true } }) : none,
    need.enrollments ? prisma.enrollment.findMany({ select: { userId: true, courseId: true, progressPercent: true, startedAt: true, completedAt: true } }) : none,
    need.orders
      ? prisma.courseOrder.findMany({
          select: { id: true, userId: true, courseId: true, amountINR: true, gstINR: true, totalINR: true, status: true, provider: true, paidAt: true, refundINR: true, refundedAt: true, createdAt: true },
        })
      : none,
    need.assessments ? prisma.assessment.findMany({ select: { id: true, courseId: true, dueDays: true } }) : none,
    need.attempts
      ? prisma.assessmentAttempt.findMany({
          select: { id: true, assessmentId: true, userId: true, attemptNo: true, status: true, submittedAt: true, evaluatorId: true, passed: true, reviewedAt: true, appealDecision: true, createdAt: true, updatedAt: true },
        })
      : none,
    need.verifications ? prisma.skillVerification.findMany({ select: { id: true, userId: true, skillId: true, level: true, status: true, awardedAt: true } }) : none,
    need.offers
      ? prisma.projectOffer.findMany({
          select: {
            id: true, title: true, skillId: true, studentId: true, pmId: true, status: true, expiresAt: true, respondedAt: true, deadline: true, deliveries: true,
            revisionsUsed: true, payoutINR: true, clientPriceINR: true, platformShareINR: true, taxesINR: true, adjustments: true, payoutStatus: true,
            paidAt: true, clientAcceptedAt: true, rating: true, history: true, createdAt: true, updatedAt: true,
          },
        })
      : none,
    need.tickets ? prisma.supportTicket.findMany({ select: { id: true, category: true, status: true, priority: true, ownerId: true, createdAt: true } }) : none,
    need.skills ? prisma.skill.findMany({ select: { id: true, name: true } }) : none,
    need.submissions ? prisma.submission.findMany({ where: { status: "SUBMITTED" }, select: { id: true, courseId: true, status: true, createdAt: true } }) : none,
  ]);
  return { users, courses, enrollments, orders, assessments, attempts, verifications, offers, tickets, skills, submissions };
}

const rangeQuery = z.object({ from: zQ, to: zQ }).passthrough();

router.get("/api/admin/reports/:name", ...financeOrAdmin, validate({ query: rangeQuery }), async (req, res) => {
  const csv = req.params.name.endsWith(".csv");
  const name = csv ? req.params.name.slice(0, -4) : req.params.name;
  if (!REPORT_NAMES.includes(name)) throw httpError(404, `Unknown report. Use one of: ${REPORT_NAMES.join(", ")}.`);
  const range = parseRange(req.q);
  if (!range) throw httpError(400, "Use dates like 2026-11-01 for from and to.");
  const report = buildReport(name, await loadReportData(name), range);
  if (!csv) return res.json(report);

  await audit(req, { action: "report.export", entity: "Report", entityId: name, after: { from: report.from, to: report.to, rows: report.rows.length } });
  track("report.exported", { report: name, format: "csv" }, req.user.id);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="campus-${name}-${report.from.slice(0, 10)}-to-${report.to.slice(0, 10)}.csv"`);
  res.send(toCsv(report.rows));
});

router.get("/api/admin/funnel", ...adminOnly, validate({ query: rangeQuery }), async (req, res) => {
  const range = parseRange(req.q, { allTimeByDefault: true });
  if (!range) throw httpError(400, "Use dates like 2026-11-01 for from and to.");
  res.json(buildFunnel(await loadReportData("funnel"), range));
});

export default router;
