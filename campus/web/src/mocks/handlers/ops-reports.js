/**
 * Admin reports (spec §16) as pure functions over plain rows, so the API (Prisma rows) and the in-browser demo engine
 * (demo collections) compute exactly the same numbers. This is the WEB copy of api/src/services/reports-core.js —
 * keep the two files identical. Definitions of every metric: campus/docs/ANALYTICS.md.
 *
 * data = { users, courses, enrollments, orders, assessments, attempts, verifications, offers, tickets, skills, submissions }
 * range = { from: Date, to: Date }
 * Every report returns { name, from, to, metrics, rows, series, notes }. Money is whole rupees; rates are percentages (0–100, 1 dp) or null.
 */

export const REPORT_NAMES = ["growth", "course", "talent", "marketplace", "quality", "finance", "capacity"];

const DAY = 86400000;
const ms = (v) => (v ? new Date(v).getTime() : 0);
const arr = (v) => (Array.isArray(v) ? v : []);
const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
const sum = (list, f) => list.reduce((s, x) => s + (Number(f(x)) || 0), 0);
export const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : null);
const avg = (list) => (list.length ? Math.round((list.reduce((s, x) => s + x, 0) / list.length) * 10) / 10 : null);
const median = (list) => {
  if (!list.length) return null;
  const s = [...list].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return Math.round((s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) * 10) / 10;
};
const by = (list, key) => new Map(list.map((x) => [x[key], x]));
const group = (list, f) => {
  const m = new Map();
  for (const x of list) {
    const k = f(x);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(x);
  }
  return m;
};

/** Default range: the last 30 days up to now. Accepts ISO strings or yyyy-mm-dd; `to` dates include the whole day. */
export function parseRange(query = {}, { allTimeByDefault = false } = {}) {
  const to = query.to ? new Date(query.to) : new Date();
  if (query.to && /^\d{4}-\d{2}-\d{2}$/.test(query.to)) to.setHours(23, 59, 59, 999);
  const from = query.from ? new Date(query.from) : allTimeByDefault ? new Date(0) : new Date(to.getTime() - 29 * DAY);
  if (!query.from && !allTimeByDefault) from.setHours(0, 0, 0, 0);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;
  return from > to ? { from: to, to: from } : { from, to };
}

const inRange = (v, r) => {
  const t = ms(v);
  return t >= r.from.getTime() && t <= r.to.getTime();
};

/** Day buckets for ranges up to ~3 months, month buckets beyond. */
function buckets(r) {
  const span = (r.to - r.from) / DAY;
  const out = [];
  if (span <= 92) {
    const d = new Date(r.from);
    d.setHours(0, 0, 0, 0);
    while (d <= r.to) {
      out.push({ key: d.toISOString().slice(0, 10), start: d.getTime(), end: d.getTime() + DAY });
      d.setDate(d.getDate() + 1);
    }
  } else {
    const d = new Date(r.from.getFullYear(), r.from.getMonth(), 1);
    while (d <= r.to) {
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      out.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, start: d.getTime(), end: next.getTime() });
      d.setTime(next.getTime());
    }
  }
  return out;
}
const countIn = (list, f, b) => list.filter((x) => ms(f(x)) >= b.start && ms(f(x)) < b.end).length;
const sumIn = (list, f, v, b) => sum(list.filter((x) => ms(f(x)) >= b.start && ms(f(x)) < b.end), v);

/* ───────────── shared derivations ───────────── */

const PASSED = new Set(["PASSED", "VERIFIED"]);
const DECIDED = new Set(["PASSED", "VERIFIED", "FAILED", "REASSESSMENT_REQUIRED"]);
const ACCEPTED_LIKE = new Set(["ACCEPTED", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED", "COMPLETED", "ON_HOLD", "DISPUTED"]);
const ACTIVE_WORK = new Set(["ACCEPTED", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED", "ON_HOLD"]);

const isStudent = (u) => (u.role || "STUDENT") === "STUDENT";
const attemptPassed = (a) => a.passed === true || PASSED.has(a.status);
/** Offers still OFFERED after expiresAt read as EXPIRED (API_CONTRACT.md Projects & PM). */
export const offerStatus = (o, now = Date.now()) => (o.status === "OFFERED" && o.expiresAt && ms(o.expiresAt) < now ? "EXPIRED" : o.status);
const wasAccepted = (o) => ACCEPTED_LIKE.has(offerStatus(o)) || arr(o.history).some((h) => h?.status === "ACCEPTED");
const acceptedPaid = (o) => Boolean(o.clientAcceptedAt) && o.payoutStatus === "PAID";
const lastDeliveryAt = (o) => Math.max(0, ...arr(o.deliveries).map((d) => ms(d?.submittedAt)));
const onTime = (o) => {
  if (!o.deadline) return null;
  const delivered = lastDeliveryAt(o) || ms(o.clientAcceptedAt);
  return delivered ? delivered <= ms(o.deadline) : null;
};
const skillLabel = (skills, id) => skills.get(id)?.name || (id ? id : "No skill");
const attemptCourseId = (a, assessments) => a.courseId || assessments.get(a.assessmentId)?.courseId || null;

/** 0–100: how much of the profile a PM/client would see is filled in (spec §16 Talent: profile completeness). */
export function profileCompleteness(u) {
  const av = obj(u.availability);
  const checks = [
    Boolean(u.avatarUrl),
    Boolean(u.headline),
    Boolean(u.bio),
    Boolean(u.city),
    Boolean(u.collegeId),
    arr(u.skills).length > 0,
    Object.values(obj(u.links)).some(Boolean),
    av.openToProjects !== undefined || Boolean(av.hoursPerWeek),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

/* ───────────── reports ───────────── */

function growth(d, r) {
  const students = d.users.filter(isStudent);
  const signups = students.filter((u) => inRange(u.createdAt, r));
  const checkouts = d.orders.filter((o) => o.provider !== "FREE" && inRange(o.createdAt, r));
  const paid = d.orders.filter((o) => o.paidAt && o.provider !== "FREE" && inRange(o.paidAt, r));
  const paidStudents = new Set(paid.map((o) => o.userId));
  const series = buckets(r).map((b) => ({
    date: b.key,
    signups: countIn(signups, (u) => u.createdAt, b),
    checkoutStarts: countIn(checkouts, (o) => o.createdAt, b),
    paidEnrolments: countIn(paid, (o) => o.paidAt, b),
  }));
  return {
    metrics: {
      visits: null,
      courseViews: null,
      leadSources: null,
      signups: signups.length,
      checkoutStarts: checkouts.length,
      paidEnrolments: paid.length,
      paidStudents: paidStudents.size,
      signupToPaidRate: pct(signups.filter((u) => d.orders.some((o) => o.userId === u.id && o.paidAt)).length, signups.length),
      checkoutToPaidRate: pct(checkouts.filter((o) => o.paidAt).length, checkouts.length),
      cacINR: null,
    },
    rows: series,
    series,
    notes: ["Visits, course views and lead source come from web analytics, not the database (docs/ANALYTICS.md).", "CAC needs marketing spend, which Campus doesn't store yet."],
  };
}

function course(d, r) {
  const assessments = by(d.assessments, "id");
  const assessmentByCourse = by(d.assessments, "courseId");
  const enrolByKey = new Map(d.enrollments.map((e) => [`${e.userId}:${e.courseId}`, e]));
  const rows = d.courses
    .filter((c) => c.status !== "ARCHIVED" || d.enrollments.some((e) => e.courseId === c.id && inRange(e.startedAt, r)))
    .map((c) => {
      const enr = d.enrollments.filter((e) => e.courseId === c.id && inRange(e.startedAt, r));
      const completed = enr.filter((e) => e.completedAt);
      const attempts = d.attempts.filter((a) => attemptCourseId(a, assessments) === c.id);
      const submitted = attempts.filter((a) => a.submittedAt && inRange(a.submittedAt, r));
      const dueDays = assessmentByCourse.get(c.id)?.dueDays;
      const late = dueDays
        ? submitted.filter((a) => {
            const e = enrolByKey.get(`${a.userId}:${c.id}`);
            return e && ms(a.submittedAt) > ms(e.startedAt) + dueDays * DAY;
          }).length
        : 0;
      const decided = attempts.filter((a) => (DECIDED.has(a.status) || a.passed != null) && inRange(a.reviewedAt || a.updatedAt, r));
      const passed = decided.filter(attemptPassed);
      const refunds = d.orders.filter((o) => o.courseId === c.id && o.refundedAt && inRange(o.refundedAt, r));
      return {
        courseId: c.id,
        course: c.title,
        status: c.status,
        level: c.level,
        enrolments: enr.length,
        avgProgress: avg(enr.map((e) => e.progressPercent || 0)),
        completed: completed.length,
        completionRate: pct(completed.length, enr.length),
        submitted: submitted.length,
        late,
        latenessRate: pct(late, submitted.length),
        decided: decided.length,
        passed: passed.length,
        passRate: pct(passed.length, decided.length),
        reassessments: attempts.filter((a) => (a.attemptNo || 1) > 1 && inRange(a.createdAt, r)).length,
        refunds: refunds.length,
        refundINR: sum(refunds, (o) => o.refundINR),
      };
    })
    .sort((a, b) => b.enrolments - a.enrolments);
  const t = (k) => sum(rows, (x) => x[k]);
  return {
    metrics: {
      enrolments: t("enrolments"),
      avgProgress: avg(d.enrollments.filter((e) => inRange(e.startedAt, r)).map((e) => e.progressPercent || 0)),
      completionRate: pct(t("completed"), t("enrolments")),
      submitted: t("submitted"),
      latenessRate: pct(t("late"), t("submitted")),
      passRate: pct(t("passed"), t("decided")),
      reassessments: t("reassessments"),
      refunds: t("refunds"),
      refundINR: t("refundINR"),
    },
    rows,
    series: rows.slice(0, 8).map((x) => ({ label: x.course, enrolments: x.enrolments, completed: x.completed, passed: x.passed })),
    notes: ["Enrolment, progress and completion are for students who enrolled in the range. Pass rate counts results given in the range."],
  };
}

function talent(d, r) {
  const skills = by(d.skills, "id");
  const users = by(d.users, "id");
  const active = d.verifications.filter((v) => v.status === "ACTIVE");
  const verifiedIds = new Set(active.map((v) => v.userId));
  const open = (id) => obj(users.get(id)?.availability).openToProjects === true;
  const rows = [...group(d.verifications, (v) => `${v.skillId}|${v.level}`).entries()]
    .map(([key, list]) => {
      const [skillId, level] = key.split("|");
      const act = list.filter((v) => v.status === "ACTIVE");
      return {
        skill: skillLabel(skills, skillId),
        level,
        verified: act.length,
        newInRange: list.filter((v) => inRange(v.awardedAt, r)).length,
        openToProjects: act.filter((v) => open(v.userId)).length,
        revoked: list.filter((v) => v.status === "REVOKED").length,
        avgProfileCompleteness: avg(act.map((v) => users.get(v.userId)).filter(Boolean).map(profileCompleteness)),
      };
    })
    .sort((a, b) => b.verified - a.verified);
  const done = d.offers.filter((o) => verifiedIds.has(o.studentId) && o.clientAcceptedAt);
  const timing = done.map(onTime).filter((x) => x !== null);
  const students = d.users.filter(isStudent);
  return {
    metrics: {
      verifiedStudents: verifiedIds.size,
      newVerifications: d.verifications.filter((v) => inRange(v.awardedAt, r)).length,
      openToProjects: [...verifiedIds].filter(open).length,
      avgProfileCompleteness: avg([...verifiedIds].map((id) => users.get(id)).filter(Boolean).map(profileCompleteness)),
      avgRating: avg(done.map((o) => o.rating).filter((x) => Number.isFinite(x))),
      onTimeRate: pct(timing.filter(Boolean).length, timing.length),
      suspended: students.filter((u) => u.status === "SUSPENDED").length,
      revoked: d.verifications.filter((v) => v.status === "REVOKED").length,
      appealsOpen: d.attempts.filter((a) => a.status === "APPEAL_PENDING").length,
      appealsDecided: d.attempts.filter((a) => a.appealDecision && inRange(a.updatedAt, r)).length,
    },
    rows,
    series: rows.slice(0, 10).map((x) => ({ label: `${x.skill} · ${x.level}`, verified: x.verified, openToProjects: x.openToProjects })),
    notes: ["Verified = ACTIVE skill verifications. Performance counts client-accepted projects of verified students (all time)."],
  };
}

function marketplace(d, r) {
  const skills = by(d.skills, "id");
  const offers = d.offers.filter((o) => inRange(o.createdAt, r));
  const status = (o) => offerStatus(o);
  const accepted = offers.filter(wasAccepted);
  const declined = offers.filter((o) => status(o) === "DECLINED");
  const expired = offers.filter((o) => status(o) === "EXPIRED");
  const paidDone = d.offers.filter((o) => acceptedPaid(o) && inRange(o.paidAt || o.clientAcceptedAt, r));
  // time from a student's first verification to their first offer
  const firstVerified = new Map();
  for (const v of d.verifications) if (!firstVerified.has(v.userId) || ms(v.awardedAt) < firstVerified.get(v.userId)) firstVerified.set(v.userId, ms(v.awardedAt));
  const firstOffer = new Map();
  for (const o of d.offers) if (!firstOffer.has(o.studentId) || ms(o.createdAt) < firstOffer.get(o.studentId)) firstOffer.set(o.studentId, ms(o.createdAt));
  const waits = [...firstOffer.entries()]
    .filter(([id, t]) => firstVerified.has(id) && t >= firstVerified.get(id) && inRange(t, r))
    .map(([id, t]) => (t - firstVerified.get(id)) / DAY);
  const completedBy = group(d.offers.filter((o) => o.clientAcceptedAt), (o) => o.studentId);
  const repeaters = [...completedBy.values()].filter((l) => l.length >= 2).length;
  const rows = [...group(offers, (o) => o.skillId || "").entries()]
    .map(([skillId, list]) => ({
      skill: skillLabel(skills, skillId || null),
      offers: list.length,
      accepted: list.filter(wasAccepted).length,
      declined: list.filter((o) => status(o) === "DECLINED").length,
      expired: list.filter((o) => status(o) === "EXPIRED").length,
      open: list.filter((o) => status(o) === "OFFERED").length,
      completed: list.filter((o) => o.clientAcceptedAt).length,
      paid: list.filter(acceptedPaid).length,
      acceptanceRate: pct(list.filter(wasAccepted).length, list.filter((o) => status(o) !== "OFFERED" && status(o) !== "WITHDRAWN").length),
    }))
    .sort((a, b) => b.offers - a.offers);
  const series = buckets(r).map((b) => ({ date: b.key, offers: countIn(offers, (o) => o.createdAt, b), accepted: countIn(accepted, (o) => o.respondedAt || o.createdAt, b) }));
  return {
    metrics: {
      offers: offers.length,
      accepted: accepted.length,
      declined: declined.length,
      expired: expired.length,
      acceptanceRate: pct(accepted.length, accepted.length + declined.length + expired.length),
      medianDaysToFirstOpportunity: median(waits),
      paidProjectsCompleted: paidDone.length,
      repeatWorkRate: pct(repeaters, completedBy.size),
    },
    rows,
    series,
    notes: ["Responses = accepted + declined + expired offers. Paid projects = client accepted and payout PAID."],
  };
}

function quality(d, r) {
  const users = by(d.users, "id");
  const done = d.offers.filter((o) => o.clientAcceptedAt && inRange(o.clientAcceptedAt, r));
  const ended = d.offers.filter((o) => arr(o.deliveries).length && ["COMPLETED", "DISPUTED", "CANCELLED"].includes(o.status) && inRange(o.clientAcceptedAt || o.updatedAt, r));
  const timing = done.map(onTime).filter((x) => x !== null);
  const started = d.offers.filter((o) => wasAccepted(o) && inRange(o.respondedAt || o.createdAt, r));
  const tickets = d.tickets.filter((t) => inRange(t.createdAt, r));
  const disputedOffers = d.offers.filter((o) => o.status === "DISPUTED" && inRange(o.updatedAt, r));
  return {
    metrics: {
      completed: done.length,
      clientAcceptanceRate: pct(done.length, ended.length || done.length),
      onTimeRate: pct(timing.filter(Boolean).length, timing.length),
      avgRevisions: avg(done.map((o) => o.revisionsUsed || 0)),
      avgRating: avg(done.map((o) => o.rating).filter((x) => Number.isFinite(x))),
      complaints: tickets.filter((t) => t.category === "COMPLAINT").length,
      disputes: tickets.filter((t) => t.category === "DISPUTE").length + disputedOffers.length,
      disputeRate: pct(disputedOffers.length, started.length),
    },
    rows: done.map((o) => ({
      offerId: o.id,
      project: o.title,
      student: users.get(o.studentId)?.name || "",
      pm: users.get(o.pmId)?.name || "",
      deadline: o.deadline ? new Date(o.deadline).toISOString().slice(0, 10) : "",
      acceptedAt: new Date(o.clientAcceptedAt).toISOString().slice(0, 10),
      onTime: onTime(o) === null ? "" : onTime(o) ? "yes" : "no",
      revisions: o.revisionsUsed || 0,
      rating: o.rating ?? "",
    })),
    series: [],
    notes: ["Client acceptance = accepted / (accepted + disputed + cancelled after delivery). On time = last delivery by the deadline."],
  };
}

/** Estimated payment-gateway fee on online (Razorpay) payments; replace with settlement data when available. */
export const GATEWAY_FEE_PERCENT = 2;

function finance(d, r) {
  const paid = d.orders.filter((o) => o.paidAt && o.provider !== "FREE" && inRange(o.paidAt, r));
  const refunds = d.orders.filter((o) => o.refundedAt && inRange(o.refundedAt, r));
  const accepted = d.offers.filter((o) => o.clientAcceptedAt && inRange(o.clientAcceptedAt, r));
  const payouts = d.offers.filter((o) => o.payoutStatus === "PAID" && inRange(o.paidAt || o.updatedAt, r));
  const pendingPayouts = d.offers.filter((o) => ["ELIGIBLE", "PENDING"].includes(o.payoutStatus));
  const share = (o) => (Number.isFinite(o.platformShareINR) ? o.platformShareINR : Number.isFinite(o.clientPriceINR) ? o.clientPriceINR - (o.taxesINR || 0) - (o.payoutINR || 0) : 0);
  const adjustments = accepted.flatMap((o) => arr(o.adjustments));
  const revenueExTax = sum(paid, (o) => o.amountINR);
  const refundINR = sum(refunds, (o) => o.refundINR);
  const platformShare = sum(accepted, share);
  const fees = Math.round((sum(paid.filter((o) => o.provider === "RAZORPAY"), (o) => o.totalINR) * GATEWAY_FEE_PERCENT) / 100);
  const adjustmentsINR = sum(adjustments, (a) => a?.amountINR);
  const series = buckets(r).map((b) => ({
    date: b.key,
    courseRevenueExTaxINR: sumIn(paid, (o) => o.paidAt, (o) => o.amountINR, b),
    refundsINR: sumIn(refunds, (o) => o.refundedAt, (o) => o.refundINR, b),
    platformShareINR: sumIn(accepted, (o) => o.clientAcceptedAt, share, b),
    payoutsINR: sumIn(payouts, (o) => o.paidAt || o.updatedAt, (o) => o.payoutINR, b),
  }));
  return {
    metrics: {
      courseRevenueExTaxINR: revenueExTax,
      gstCollectedINR: sum(paid, (o) => o.gstINR),
      refundsINR: refundINR,
      netCourseRevenueINR: revenueExTax - refundINR,
      paidOrders: paid.length,
      projectClientPriceINR: sum(accepted, (o) => o.clientPriceINR),
      freelancerPayoutsINR: sum(payouts, (o) => o.payoutINR),
      payoutsPendingINR: sum(pendingPayouts, (o) => o.payoutINR),
      platformShareINR: platformShare,
      adjustmentsINR,
      paymentFeesEstINR: fees,
      contributionMarginINR: revenueExTax - refundINR + platformShare - fees - adjustmentsINR,
    },
    rows: series,
    series,
    notes: [
      "Course revenue excludes GST. Refunds are counted when issued.",
      `Payment fees are estimated at ${GATEWAY_FEE_PERCENT}% of online payments until settlement reports are imported.`,
      "Contribution margin = net course revenue + platform share - fees - adjustments (before instructor and staff costs).",
    ],
  };
}

function capacity(d) {
  const users = by(d.users, "id");
  const assessments = by(d.assessments, "id");
  const courseById = by(d.courses, "id");
  const now = Date.now();
  const hours = (t) => (t ? Math.round((now - ms(t)) / 3600000) : null);
  const oldest = (list, f) => (list.length ? Math.max(...list.map((x) => hours(f(x)) || 0)) : null);
  const rows = [];

  for (const [mentorId, courses] of group(d.courses.filter((c) => c.mentorId), (c) => c.mentorId)) {
    const ids = new Set(courses.map((c) => c.id));
    const waiting = d.submissions.filter((s) => s.status === "SUBMITTED" && ids.has(s.courseId));
    rows.push({
      role: "Instructor",
      name: users.get(mentorId)?.name || mentorId,
      assigned: d.enrollments.filter((e) => ids.has(e.courseId) && !e.completedAt).length,
      waiting: waiting.length,
      oldestWaitingHours: oldest(waiting, (s) => s.createdAt),
    });
  }
  const queue = d.attempts.filter((a) => ["SUBMITTED", "UNDER_REVIEW", "APPEAL_PENDING"].includes(a.status));
  const unassigned = queue.filter((a) => !a.evaluatorId);
  rows.push({ role: "Evaluator", name: "Unassigned queue", assigned: 0, waiting: unassigned.length, oldestWaitingHours: oldest(unassigned, (a) => a.submittedAt || a.updatedAt) });
  for (const [evaluatorId, list] of group(queue.filter((a) => a.evaluatorId), (a) => a.evaluatorId)) {
    rows.push({
      role: "Evaluator",
      name: users.get(evaluatorId)?.name || evaluatorId,
      assigned: list.length,
      waiting: list.filter((a) => a.status !== "UNDER_REVIEW").length,
      oldestWaitingHours: oldest(list, (a) => a.submittedAt || a.updatedAt),
    });
  }
  for (const [pmId, list] of group(d.offers.filter((o) => o.pmId), (o) => o.pmId)) {
    const activeList = list.filter((o) => ACTIVE_WORK.has(offerStatus(o)));
    const review = list.filter((o) => o.status === "SUBMITTED");
    rows.push({
      role: "Project manager",
      name: users.get(pmId)?.name || pmId,
      assigned: activeList.length,
      waiting: review.length + list.filter((o) => offerStatus(o) === "OFFERED").length,
      oldestWaitingHours: oldest(review, (o) => lastDeliveryAt(o) || o.updatedAt),
    });
  }
  const openTickets = d.tickets.filter((t) => ["OPEN", "IN_PROGRESS"].includes(t.status));
  for (const [ownerId, list] of group(openTickets, (t) => t.ownerId || "")) {
    rows.push({
      role: "Support",
      name: ownerId ? users.get(ownerId)?.name || ownerId : "Unassigned tickets",
      assigned: list.filter((t) => t.status === "IN_PROGRESS").length,
      waiting: list.filter((t) => t.status === "OPEN").length,
      oldestWaitingHours: oldest(list, (t) => t.createdAt),
    });
  }
  const mentorCourses = d.courses.filter((c) => c.mentorId);
  return {
    metrics: {
      instructors: new Set(mentorCourses.map((c) => c.mentorId)).size,
      pendingAssignmentReviews: d.submissions.filter((s) => s.status === "SUBMITTED").length,
      evaluatorQueue: queue.length,
      unassignedEvaluations: unassigned.length,
      oldestEvaluationHours: oldest(queue, (a) => a.submittedAt || a.updatedAt),
      activeProjects: d.offers.filter((o) => ACTIVE_WORK.has(offerStatus(o))).length,
      openTickets: openTickets.length,
      urgentTickets: openTickets.filter((t) => t.priority === "URGENT" || t.priority === "HIGH").length,
    },
    rows,
    series: rows.map((x) => ({ label: `${x.role}: ${x.name}`, assigned: x.assigned, waiting: x.waiting })),
    notes: [
      "A snapshot of today, not the date range.",
      `Evaluations waiting on courses: ${[...new Set(queue.map((a) => courseById.get(attemptCourseId(a, assessments))?.title).filter(Boolean))].slice(0, 5).join(", ") || "none"}.`,
    ],
  };
}

const BUILDERS = { growth, course, talent, marketplace, quality, finance, capacity };

/** Normalise missing collections to [] so a fresh database (or demo) never crashes a report. */
export function normalizeData(d = {}) {
  const keys = ["users", "courses", "enrollments", "orders", "assessments", "attempts", "verifications", "offers", "tickets", "skills", "submissions"];
  return Object.fromEntries(keys.map((k) => [k, arr(d[k])]));
}

export function buildReport(name, data, range) {
  const d = normalizeData(data);
  const out = BUILDERS[name](d, range);
  return { name, from: range.from.toISOString(), to: range.to.toISOString(), ...out };
}

/**
 * The spec §16 funnel for students who signed up in the range (all time by default):
 * visitor → sign-up → paid → submitted → passed → verified → first accepted paid project.
 * North star: students who passed an assessment AND completed at least one client-accepted, paid project.
 */
export function buildFunnel(data, range) {
  const d = normalizeData(data);
  const cohort = d.users.filter((u) => isStudent(u) && inRange(u.createdAt, range));
  const ids = new Set(cohort.map((u) => u.id));
  const has = (list, key, f = () => true) => new Set(list.filter((x) => ids.has(x[key]) && f(x)).map((x) => x[key]));
  // each step counts students who reached it or a later one (a verified skill implies a passed, submitted assessment)
  const paid = has(d.orders, "userId", (o) => Boolean(o.paidAt));
  const project = has(d.offers, "studentId", acceptedPaid);
  const verified = has(d.verifications, "userId");
  const passed = new Set([...has(d.attempts, "userId", attemptPassed), ...verified]);
  const submitted = new Set([...has(d.attempts, "userId", (a) => Boolean(a.submittedAt)), ...passed]);
  const northStar = [...passed].filter((id) => project.has(id)).length;
  const allPassed = new Set(d.attempts.filter(attemptPassed).map((a) => a.userId));
  const allTime = new Set(d.offers.filter((o) => acceptedPaid(o) && allPassed.has(o.studentId)).map((o) => o.studentId)).size;
  const steps = [
    { key: "visitor", label: "Visitors", count: null },
    { key: "signup", label: "Signed up", count: cohort.length },
    { key: "paid", label: "Paid for a course", count: paid.size },
    { key: "submitted", label: "Submitted an assessment", count: submitted.size },
    { key: "passed", label: "Passed an assessment", count: passed.size },
    { key: "verified", label: "Verified skill", count: verified.size },
    { key: "firstProject", label: "First accepted paid project", count: project.size },
  ].map((s, i, list) => {
    const prev = list.slice(1, i).reverse().find((p) => p.count !== null);
    return { ...s, ofPrevious: s.count === null || !prev ? null : pct(s.count, prev.count), ofSignups: s.count === null || i < 1 ? null : pct(s.count, cohort.length) };
  });
  return {
    from: range.from.toISOString(),
    to: range.to.toISOString(),
    steps,
    northStar: { count: northStar, rate: pct(northStar, cohort.length), allTime, label: "Passed an assessment and completed an accepted, paid project" },
  };
}

/* ───────────── CSV ───────────── */

const csvCell = (v) => {
  if (v === null || v === undefined) return "";
  let s = typeof v === "object" ? JSON.stringify(v) : String(v);
  // spreadsheet formula injection: =, +, -, @ at the start run as formulas in Excel/Sheets
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** rows → CSV text (header from the union of keys, in first-seen order). */
export function toCsv(rows) {
  const list = arr(rows);
  const cols = [];
  for (const r of list) for (const k of Object.keys(r || {})) if (!cols.includes(k)) cols.push(k);
  if (!cols.length) return "";
  return [cols.join(","), ...list.map((r) => cols.map((c) => csvCell(r?.[c])).join(","))].join("\r\n") + "\r\n";
}
