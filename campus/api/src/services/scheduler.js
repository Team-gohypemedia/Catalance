import { prisma } from "../lib/prisma.js";
import { notify } from "../lib/notify.js";
import { sweepOffers } from "./projects.js";
import { sendReassessReminders } from "./assessment.js";

/**
 * The scheduler tick (spec §12 reminders; offers expire). Called by POST/GET /api/cron/tick (routes/cron.js, Vercel Cron
 * hourly) and by `npm run cron:tick` (scripts/cron-tick.mjs). Idempotent: every reminder has a once-only marker and every
 * write is conditional, so running it every 15 minutes, hourly, or twice at once sends each notice at most once.
 *
 *  1. OFFERED offers past expiresAt → EXPIRED + history entry + PM notified once ("offer.expired").
 *  2. Milestones due within 24h / overdue on active offers → student and PM, once each (dueNotifiedAt / overdueNotifiedAt in milestones json).
 *  3. Reassessment window ending within 48h → student once (REMINDED entry in the attempt's history).
 *  4. Assessment deadline (Assessment.dueDays after enrolment) within 48h and not yet submitted → student once
 *     (marker: the "Assessment due soon" notification itself, one per user + course).
 *
 * The same expiry / milestone rules also run lazily whenever offers are read (services/projects.js sweepOffers).
 */

const HOUR = 3600000;
const DAY = 24 * HOUR;
export const REASSESS_REMINDER_HOURS = 48;
export const DEADLINE_REMINDER_HOURS = 48;
const ACTIVE_OFFER = ["ACCEPTED", "IN_PROGRESS", "REVISION_REQUESTED"];
const BATCH = 500;
const DEADLINE_TITLE = "Assessment due soon";

async function offerSweep(at) {
  const stats = { expired: 0, milestoneNotices: 0 };
  const expiring = await prisma.projectOffer.findMany({ where: { status: "OFFERED", expiresAt: { lt: at } }, orderBy: { expiresAt: "asc" }, take: BATCH });
  // milestones live in json: load active offers and let sweepOffers decide (it only writes when a notice is due)
  const active = await prisma.projectOffer.findMany({ where: { status: { in: ACTIVE_OFFER } }, orderBy: { updatedAt: "asc" }, take: BATCH * 4 });
  const needsNotice = (m) => {
    if (!m?.dueAt || m.status === "APPROVED") return false;
    const due = new Date(m.dueAt);
    return due < at ? !m.overdueNotifiedAt : due - at <= DAY && !m.dueNotifiedAt;
  };
  const withDue = active.filter((o) => (Array.isArray(o.milestones) ? o.milestones : []).some(needsNotice));
  await sweepOffers([...expiring, ...withDue], stats);
  return stats;
}

async function deadlineReminders(at) {
  let sent = 0;
  const assessments = await prisma.assessment.findMany({ where: { dueDays: { not: null } }, select: { id: true, courseId: true, dueDays: true, course: { select: { title: true } } } });
  for (const a of assessments) {
    // due = startedAt + dueDays; remind when now < due ≤ now + 48h
    const from = new Date(at.getTime() - a.dueDays * DAY);
    const to = new Date(at.getTime() + DEADLINE_REMINDER_HOURS * HOUR - a.dueDays * DAY);
    const enrollments = await prisma.enrollment.findMany({ where: { courseId: a.courseId, startedAt: { gt: from, lte: to } }, select: { userId: true, startedAt: true }, take: BATCH });
    if (!enrollments.length) continue;
    const link = `/app/assessments/${a.courseId}`;
    const userIds = enrollments.map((e) => e.userId);
    const [submitted, reminded, users] = await Promise.all([
      prisma.assessmentAttempt.findMany({ where: { assessmentId: a.id, userId: { in: userIds }, status: { not: "IN_PROGRESS" } }, select: { userId: true } }),
      prisma.notification.findMany({ where: { userId: { in: userIds }, link, title: DEADLINE_TITLE }, select: { userId: true } }),
      prisma.user.findMany({ where: { id: { in: userIds }, status: { not: "SUSPENDED" } }, select: { id: true } }),
    ]);
    const skip = new Set([...submitted.map((r) => r.userId), ...reminded.map((r) => r.userId)]);
    const live = new Set(users.map((u) => u.id));
    for (const e of enrollments) {
      if (skip.has(e.userId) || !live.has(e.userId)) continue;
      skip.add(e.userId);
      const due = new Date(new Date(e.startedAt).getTime() + a.dueDays * DAY);
      const hours = Math.max(1, Math.round((due - at) / HOUR));
      await notify(e.userId, {
        type: "COURSE",
        title: DEADLINE_TITLE,
        body: `Submit your ${a.course?.title || "course"} assessment within ${hours < 24 ? `${hours} hour${hours === 1 ? "" : "s"}` : `${Math.round(hours / 24)} day${Math.round(hours / 24) === 1 ? "" : "s"}`} (by ${due.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })}).`,
        link,
        event: "assignment.due",
      });
      sent++;
    }
  }
  return sent;
}

/** One tick. Returns counts of what it did; each step is isolated so one failure doesn't stop the others. */
export async function runTick({ now = new Date() } = {}) {
  const startedAt = Date.now();
  const counts = { offersExpired: 0, milestoneReminders: 0, reassessReminders: 0, deadlineReminders: 0 };
  const errors = [];
  const step = async (name, fn) => {
    try {
      await fn();
    } catch (err) {
      errors.push({ step: name, message: err?.message || String(err) });
      console.error(`[campus-api] cron step ${name} failed`, err?.message);
    }
  };
  await step("offers", async () => {
    const s = await offerSweep(now);
    counts.offersExpired = s.expired;
    counts.milestoneReminders = s.milestoneNotices;
  });
  await step("reassessment", async () => {
    counts.reassessReminders = await sendReassessReminders({ withinHours: REASSESS_REMINDER_HOURS });
  });
  await step("deadlines", async () => {
    counts.deadlineReminders = await deadlineReminders(now);
  });
  return { ok: errors.length === 0, at: now.toISOString(), tookMs: Date.now() - startedAt, counts, errors };
}
