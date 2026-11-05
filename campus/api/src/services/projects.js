import { prisma } from "../lib/prisma.js";
import { httpError } from "../lib/errors.js";
import { notify } from "../lib/notify.js";

/**
 * Project offers: PM-led matching of verified students (spec §5.3, §9, §13).
 * Pure rules live here so routes stay thin; the web demo engine (web/src/mocks/handlers/projects.js) mirrors them.
 */

/* ───────────── statuses (spec §9.3) ───────────── */

/** Work is under way: counts as "current workload" in talent search. */
export const ACTIVE_STATUSES = ["ACCEPTED", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED", "ON_HOLD", "DISPUTED"];
/** Finance only sees offers the student accepted. */
export const FINANCE_STATUSES = ["ACCEPTED", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED", "ON_HOLD", "DISPUTED", "COMPLETED", "CANCELLED"];
/** Offers that never became work. */
export const CLOSED_UNSTARTED = ["DECLINED", "EXPIRED", "WITHDRAWN"];

/** POST /api/pm/offers/:id/status — allowed `from` statuses for each target. Notes are required where listed. */
export const STATUS_MOVES = {
  IN_PROGRESS: { from: ["ACCEPTED", "ON_HOLD", "DISPUTED"], note: false },
  ON_HOLD: { from: ["ACCEPTED", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED"], note: true },
  DISPUTED: { from: ["IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED", "ON_HOLD"], note: true },
  CANCELLED: { from: ["ACCEPTED", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED", "ON_HOLD", "DISPUTED"], note: true },
  WITHDRAWN: { from: ["OFFERED"], note: true },
  COMPLETED: { from: ["DISPUTED"], note: true }, // dispute resolved in the student's favour; the normal path is client-acceptance
};

/** Verification levels: an ADVANCED badge also qualifies for INTERMEDIATE/BEGINNER work. STANDARD sits with BEGINNER. */
const LEVEL_RANK = { BEGINNER: 1, STANDARD: 1, INTERMEDIATE: 2, ADVANCED: 3 };
export const levelCovers = (held, wanted) => !wanted || (LEVEL_RANK[held] || 0) >= (LEVEL_RANK[wanted] || 0);

export const isExpired = (o, at = new Date()) => o.status === "OFFERED" && o.expiresAt && new Date(o.expiresAt) < at;
/** Status as the user should see it (an unanswered offer past its expiry reads EXPIRED even before the sweep runs). */
export const effectiveStatus = (o, at = new Date()) => (isExpired(o, at) ? "EXPIRED" : o.status);

const arr = (v) => (Array.isArray(v) ? v : []);
export const lastDelivery = (o) => arr(o.deliveries).at(-1) || null;

/** Derived stage for the UI: "CLIENT_REVIEW" when the PM approved the latest delivery and the client has not answered yet. */
export function stageOf(o) {
  const s = effectiveStatus(o);
  if (s === "SUBMITTED") return lastDelivery(o)?.review?.decision === "APPROVE" ? "CLIENT_REVIEW" : "PM_REVIEW";
  return s;
}

export const historyEntry = (status, by, note = null) => ({ status, at: new Date().toISOString(), by: by ? { id: by.id, name: by.name } : null, note: note || null });

/* ───────────── finance (spec §9.2) ───────────── */

export const SPLIT_BASES = ["CLIENT_PRICE_EX_TAX", "CLIENT_PRICE_INC_TAX"];

/**
 * The internal split. Base = client price (ex tax by default). The rule share is freelancerSharePercent of the base; the
 * platform keeps the rest. payoutINR is the exact amount the student agreed to; any gap to the rule is shown as variance.
 * Never shown to students or publicly.
 */
export function computeSplit({ clientPriceINR, splitBasis, freelancerSharePercent, taxesINR, payoutINR }) {
  if (clientPriceINR == null) return { baseINR: null, ruleFreelancerINR: null, platformShareINR: null, varianceINR: null };
  const baseINR = splitBasis === "CLIENT_PRICE_INC_TAX" ? clientPriceINR + (taxesINR || 0) : clientPriceINR;
  const pct = freelancerSharePercent ?? 50;
  const ruleFreelancerINR = Math.round((baseINR * pct) / 100);
  return { baseINR, ruleFreelancerINR, platformShareINR: baseINR - ruleFreelancerINR, varianceINR: (payoutINR ?? 0) - ruleFreelancerINR };
}

export const adjustmentsTotal = (o) => arr(o.adjustments).reduce((s, a) => s + (Number(a.amountINR) || 0), 0);

/** Snapshot of the split with the current rule (or the offer's own basis/percent when finance already set them). */
export function snapshotFinance(o, settings) {
  const splitBasis = o.splitBasis || settings["finance.splitBasis"] || "CLIENT_PRICE_EX_TAX";
  const freelancerSharePercent = o.freelancerSharePercent ?? settings["finance.freelancerSharePercent"] ?? 50;
  const { platformShareINR } = computeSplit({ ...o, splitBasis, freelancerSharePercent });
  return { splitBasis, freelancerSharePercent, platformShareINR };
}

/* ───────────── reliability (spec §13.2) ───────────── */

/** Per-student delivery record from their offers. Declines are never counted against anyone (spec §13.4). */
export function reliabilityOf(offers, at = new Date()) {
  const monthAgo = new Date(at.getTime() - 30 * 86400000);
  const active = offers.filter((o) => ACTIVE_STATUSES.includes(o.status)).length;
  const completed = offers.filter((o) => o.status === "COMPLETED");
  const timed = completed.filter((o) => o.deadline && arr(o.deliveries).length);
  const onTime = timed.filter((o) => {
    const approved = arr(o.deliveries).find((d) => d.review?.decision === "APPROVE") || arr(o.deliveries).at(-1);
    return new Date(approved.submittedAt) <= new Date(o.deadline);
  }).length;
  const rated = completed.filter((o) => o.rating);
  const recent = offers.filter((o) => new Date(o.createdAt) >= monthAgo);
  const lastOfferAt = offers.reduce((m, o) => (!m || new Date(o.createdAt) > new Date(m) ? o.createdAt : m), null);
  return {
    activeProjects: active,
    completedProjects: completed.length,
    onTimeRate: timed.length ? Math.round((onTime / timed.length) * 100) : null,
    avgRating: rated.length ? Math.round((rated.reduce((s, o) => s + o.rating, 0) / rated.length) * 10) / 10 : null,
    openDisputes: offers.filter((o) => o.status === "DISPUTED").length,
    offersLast30d: recent.length,
    lastOfferAt,
  };
}

/* ───────────── sweeps (run when offers are read, and by the scheduler: services/scheduler.js) ───────────── */

/**
 * Persist EXPIRED for unanswered offers past expiresAt and tell the PM (spec §12 "offer expired").
 * Also sends one "milestone due" (within 24h) and one "milestone overdue" notice per milestone.
 * Returns the offers with fresh values. Safe to call on every read; it only writes when something changed.
 * Writes are conditional (status / updatedAt unchanged), so a read and a scheduler tick racing never notify twice.
 * `stats` (optional) counts what this call did: { expired, milestoneNotices }.
 */
export async function sweepOffers(offers, stats = {}) {
  stats.expired ??= 0;
  stats.milestoneNotices ??= 0;
  const at = new Date();
  const out = [];
  const queue = [];
  for (const o of offers) {
    let next = o;
    if (isExpired(o, at)) {
      next = await prisma.$transaction(async (tx) => {
        const r = await tx.projectOffer.updateMany({ where: { id: o.id, status: "OFFERED" }, data: { status: "EXPIRED", history: [...arr(o.history), historyEntry("EXPIRED", null, "No reply before the offer expired.")] } });
        if (r.count) stats.expired++;
        if (r.count && o.pmId) {
          await notify(o.pmId, { type: "GIG", title: `Offer expired: ${o.title}`, body: "The student did not reply in time. You can offer it to another student.", link: `/admin/offers/${o.id}`, event: "offer.expired" }, tx);
        }
        return { ...o, status: "EXPIRED" };
      });
    }
    if (["ACCEPTED", "IN_PROGRESS", "REVISION_REQUESTED"].includes(next.status)) {
      let changed = false;
      const notices = [];
      const milestones = arr(next.milestones).map((m) => {
        if (m.status === "APPROVED" || !m.dueAt) return m;
        const due = new Date(m.dueAt);
        const hours = (due - at) / 3600000;
        if (hours < 0 && !m.overdueNotifiedAt) {
          changed = true;
          m = { ...m, overdueNotifiedAt: at.toISOString(), dueNotifiedAt: m.dueNotifiedAt || at.toISOString() };
          notices.push([next.studentId, { title: `Milestone overdue: ${m.title}`, body: `${next.title}. Tell your PM if you need help.`, link: `/app/projects/${next.id}`, event: "milestone.due" }]);
          if (next.pmId) notices.push([next.pmId, { title: `Milestone overdue: ${m.title}`, body: next.title, link: `/admin/offers/${next.id}`, event: "milestone.due" }]);
        } else if (hours >= 0 && hours <= 24 && !m.dueNotifiedAt) {
          changed = true;
          m = { ...m, dueNotifiedAt: at.toISOString() };
          const when = due.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
          notices.push([next.studentId, { title: `Milestone due soon: ${m.title}`, body: `${next.title}. Due ${when}.`, link: `/app/projects/${next.id}`, event: "milestone.due" }]);
          if (next.pmId) notices.push([next.pmId, { title: `Milestone due soon: ${m.title}`, body: `${next.title}. Due ${when}.`, link: `/admin/offers/${next.id}`, event: "milestone.due" }]);
        }
        return m;
      });
      if (changed) {
        // only the writer that wins sends the notices (a concurrent read or tick sees updatedAt changed)
        const where = { id: next.id, ...(next.updatedAt ? { updatedAt: next.updatedAt } : {}) };
        const r = await prisma.projectOffer.updateMany({ where, data: { milestones } });
        if (r.count) {
          queue.push(...notices);
          stats.milestoneNotices += notices.length;
          next = { ...next, milestones };
        }
      }
    }
    out.push(next);
  }
  while (queue.length) {
    const [userId, n] = queue.shift();
    await notify(userId, { type: "GIG", ...n }).catch(() => {});
  }
  return out;
}

/** Load an offer the caller may manage: PM sees their own, ADMIN sees all. 404 otherwise (spec §15: no id probing). */
export async function loadManagedOffer(id, user, include) {
  const o = await prisma.projectOffer.findUnique({ where: { id }, include });
  if (!o || (user.role !== "ADMIN" && o.pmId !== user.id)) throw httpError(404, "Offer not found.");
  return o;
}
