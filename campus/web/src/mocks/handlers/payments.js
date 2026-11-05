/**
 * Demo-engine handlers, B workstream: course payments, receipts, refunds and consent.
 * Mirrors campus/api/src/routes/payments.js + services/payments.js (API_CONTRACT.md "Spec v1.0" → Payments & consent).
 * Provider DEMO pays instantly (pass `simulate: "fail"` to see the failure path); OFFLINE works as in the API
 * (student adds a reference, finance verifies). RAZORPAY is unavailable in the demo (no keys).
 */
import { httpError, requireUser, requireRole, uid, now } from "../utils";
import { notify } from "../points";
import { DEFAULT_SETTINGS } from "../data/platform";

const ORDERS = "courseOrders";
const CONSENTS = "consentRecords";
const CHECKOUT_CONSENTS = ["TERMS", "PRIVACY", "REFUND"];
const CONSENT_PURPOSES = ["TERMS", "PRIVACY", "REFUND", "ASSESSMENT_POLICY", "PROJECT_POLICY", "MARKETING"];
const ENROLLABLE = ["PUBLISHED", "ENROLMENT_OPEN"];
const rupees = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/* ───────────────────────── shared helpers (learning.js enroll uses these) ───────────────────────── */

/** Settings with defaults (same source as the platform handlers; read directly to avoid an import cycle). */
function settings(db) {
  const stored = Object.fromEntries(db.all("platformSettings").map((r) => [r.key, r.value]));
  return { ...DEFAULT_SETTINGS, ...stored };
}

function audit(db, user, { action, entity = "CourseOrder", entityId = null, before = null, after = null, reason = null }) {
  db.insert("auditLogs", { id: uid("aud"), actorId: user?.id ?? null, actorRole: user?.role ?? null, action, entity, entityId, before, after, reason, ip: null, userAgent: "demo", createdAt: now() });
}

const findEnrollment = (db, userId, courseId) => db.find("enrollments", (e) => e.userId === userId && e.courseId === courseId);
const findCourse = (db, idOrSlug) => db.findById("courses", idOrSlug) || db.find("courses", (c) => c.slug === idOrSlug);

const ENROLLMENT_FIELDS = ["id", "userId", "courseId", "progressPercent", "completedLessonIds", "lastLessonId", "startedAt", "completedAt"];
const toEnrollment = (e) => (e ? Object.fromEntries(ENROLLMENT_FIELDS.map((k) => [k, e[k] ?? null])) : null);

/** Why this course can't take a new enrolment right now ({ status, message }), or null. Same rules as the API. */
export function enrolmentBlock(db, course) {
  const status = course.status || "PUBLISHED";
  if (status === "DRAFT" || status === "ARCHIVED") return { status: 404, message: "Course not found." };
  if (status === "FULL") return { status: 409, message: "This course is full. Check back for the next batch." };
  if (status === "PAUSED") return { status: 409, message: "Enrolment for this course is paused right now." };
  if (!ENROLLABLE.includes(status)) return { status: 409, message: "This course is not open for enrolment." };
  const t = Date.now();
  if (course.enrolmentOpensAt && new Date(course.enrolmentOpensAt).getTime() > t) return { status: 409, message: `Enrolment opens on ${fmtDate(course.enrolmentOpensAt)}.` };
  if (course.enrolmentClosesAt && new Date(course.enrolmentClosesAt).getTime() < t) return { status: 409, message: "Enrolment for this course has closed." };
  if (course.capacity) {
    const taken = db.filter("enrollments", (e) => e.courseId === course.id).length;
    if (taken >= course.capacity) return { status: 409, message: "This course is full. Check back for the next batch." };
  }
  return null;
}

export function assertCanEnrol(db, course) {
  const block = enrolmentBlock(db, course);
  if (block) throw httpError(block.status, block.message);
}

export const findPaidOrder = (db, userId, courseId) => db.find(ORDERS, (o) => o.userId === userId && o.courseId === courseId && o.status === "PAID");

/** Create the enrolment if missing. Returns { enrollment, created }. */
export function ensureEnrollment(db, course, userId) {
  const existing = findEnrollment(db, userId, course.id);
  if (existing) return { enrollment: existing, created: false };
  const first = (course.modules || []).flatMap((m) => m.lessons || [])[0];
  const enrollment = db.insert("enrollments", {
    id: uid("en"),
    userId,
    courseId: course.id,
    progressPercent: 0,
    completedLessonIds: [],
    lastLessonId: first?.id ?? null,
    startedAt: now(),
    completedAt: null,
    passedQuizIds: [],
    updatedAt: now(),
  });
  db.update("courses", course.id, (c) => ({ studentsCount: (c.studentsCount || 0) + 1 }));
  return { enrollment, created: true };
}

/* ───────────────────────── serializers ───────────────────────── */

function orderOut(db, o, { withUser = false } = {}) {
  const c = db.findById("courses", o.courseId);
  const out = {
    id: o.id,
    userId: o.userId,
    courseId: o.courseId,
    course: c ? { id: c.id, slug: c.slug, title: c.title, level: c.level } : null,
    amountINR: o.amountINR,
    gstPercent: o.gstPercent,
    gstINR: o.gstINR,
    totalINR: o.totalINR,
    currency: o.currency || "INR",
    status: o.status,
    provider: o.provider,
    offlineReference: o.offlineReference ?? null,
    receiptNo: o.receiptNo ?? null,
    paidAt: o.paidAt ?? null,
    refundINR: o.refundINR ?? null,
    refunds: Array.isArray(o.refunds) ? o.refunds.map(({ amountINR, reason, at }) => ({ amountINR, reason, at })) : [],
    refundReason: o.refundReason ?? null,
    refundedAt: o.refundedAt ?? null,
    failureReason: o.failureReason ?? null,
    createdAt: o.createdAt,
  };
  if (withUser) {
    const u = db.findById("users", o.userId);
    out.user = u ? { id: u.id, name: u.name, email: u.email, username: u.username } : null;
  }
  return out;
}

const consentOut = (c) => ({ id: c.id, userId: c.userId, purpose: c.purpose, policyVersion: c.policyVersion, context: c.context, acceptedAt: c.acceptedAt, withdrawnAt: c.withdrawnAt ?? null });

/* ───────────────────────── internals ───────────────────────── */

function priceFor(db, course) {
  const s = settings(db);
  const gstPercent = Number(s["pricing.gstPercent"] ?? 18);
  const advance = Math.min(100, Math.max(1, Number(s["payments.advancePercent"] ?? 100)));
  const amountINR = Math.round(((course.priceINR || 0) * advance) / 100);
  const gstINR = Math.round((amountINR * gstPercent) / 100);
  return { amountINR, gstPercent, gstINR, totalINR: amountINR + gstINR };
}

function recordConsents(db, user, purposes, context) {
  const versions = settings(db)["policies.versions"] || {};
  return [...new Set(purposes)].map((purpose) =>
    db.insert(CONSENTS, {
      id: uid("cr"),
      userId: user.id,
      purpose,
      policyVersion: String(versions[purpose] || versions.PRIVACY || "1"),
      context: String(context || "").slice(0, 120),
      ip: null,
      userAgent: "demo",
      acceptedAt: now(),
      withdrawnAt: null,
    }),
  );
}

function notifyFinance(db, payload) {
  for (const s of db.filter("users", (u) => u.role === "FINANCE")) notify(db, s.id, { type: "SYSTEM", link: "/admin/payments", ...payload });
}

function nextReceiptNo(db) {
  const prefix = `CC-${new Date().getFullYear()}-`;
  const n = db
    .filter(ORDERS, (o) => o.receiptNo?.startsWith(prefix))
    .reduce((max, o) => Math.max(max, Number(o.receiptNo.slice(prefix.length)) || 0), 0);
  return `${prefix}${String(n + 1).padStart(6, "0")}`;
}

/** PENDING/FAILED → PAID: receipt, enrolment, notifications. Idempotent. */
function markPaid(db, order, { actor = null, via = "provider", paymentId = null } = {}) {
  const course = db.findById("courses", order.courseId);
  if (order.status === "PAID") return { order, enrollment: findEnrollment(db, order.userId, order.courseId) };
  if (!["PENDING", "FAILED"].includes(order.status)) throw httpError(409, `This order is ${order.status.toLowerCase()} and can't be marked paid.`);
  const receiptNo = order.receiptNo || nextReceiptNo(db);
  const updated = db.update(ORDERS, order.id, {
    status: "PAID",
    paidAt: now(),
    receiptNo,
    failureReason: null,
    ...(paymentId ? { providerPaymentId: paymentId } : {}),
    ...(via === "offline" ? { verifiedById: actor?.id ?? null } : {}),
  });
  const { enrollment } = ensureEnrollment(db, course, order.userId);
  const title = course?.title || "your course";
  notify(db, order.userId, { type: "COURSE", title: "Payment received", body: `${rupees(order.totalINR)} paid for ${title}. Receipt ${receiptNo}.`, link: `/app/payments?receipt=${order.id}` });
  notify(db, order.userId, {
    type: "COURSE",
    title: `Start here: ${title}`,
    body: "Your course is unlocked. Open the first lesson and read the assessment brief so you know what to submit.",
    link: `/app/courses/${order.courseId}`,
  });
  notifyFinance(db, { title: "Course payment received", body: `${rupees(order.totalINR)} · ${title} · ${receiptNo}` });
  audit(db, actor, { action: via === "offline" ? "order.verify_offline" : "order.paid", entityId: order.id, before: { status: order.status }, after: { status: "PAID", receiptNo } });
  return { order: updated, enrollment };
}

function markFailed(db, order, reason, { actor = null, staff = false } = {}) {
  if (order.status === "FAILED") return order;
  if (order.status !== "PENDING") {
    if (staff) throw httpError(409, `This order is ${order.status.toLowerCase()} and can't be marked failed.`);
    return order;
  }
  const failureReason = String(reason || "Payment failed.").slice(0, 300);
  const updated = db.update(ORDERS, order.id, { status: "FAILED", failureReason });
  const title = db.findById("courses", order.courseId)?.title || "your course";
  notify(db, order.userId, {
    type: "COURSE",
    title: "Payment didn't go through",
    body: `${title}: ${failureReason} No money was taken for this attempt. Try again from the course page, or contact support if money left your account.`,
    link: `/app/courses/${order.courseId}`,
  });
  notifyFinance(db, { title: "Course payment failed", body: `${rupees(order.totalINR)} · ${title} · ${failureReason}` });
  if (staff) audit(db, actor, { action: "order.fail", entityId: order.id, before: { status: order.status }, after: { status: "FAILED" }, reason: failureReason });
  return updated;
}

function ownOrder(db, user, id) {
  const o = db.findById(ORDERS, id);
  if (!o || o.userId !== user.id) throw httpError(404, "Order not found.");
  return o;
}

function staffOrder(db, id) {
  const o = db.findById(ORDERS, id);
  if (!o) throw httpError(404, "Order not found.");
  return o;
}

/* ───────────────────────── handlers ───────────────────────── */

export default {
  "POST /api/courses/:id/checkout": ({ params, body, db, user }) => {
    requireUser(user);
    const provider = body?.provider;
    if (!["RAZORPAY", "OFFLINE", "DEMO"].includes(provider)) throw httpError(400, "provider: Choose a payment method.");
    const consents = Array.isArray(body?.consents) ? body.consents : [];
    if (CHECKOUT_CONSENTS.some((p) => !consents.includes(p))) throw httpError(400, "Please accept the terms, privacy policy and refund policy to continue.");

    const course = findCourse(db, params.id);
    if (!course) throw httpError(404, "Course not found.");
    if (!course.priceINR) throw httpError(400, "This course is free. Enrol directly.");
    if (findEnrollment(db, user.id, course.id)) throw httpError(409, "You're already enrolled in this course.");
    if (findPaidOrder(db, user.id, course.id)) throw httpError(409, "You've already paid for this course. Open it from My learning.");
    assertCanEnrol(db, course);

    const s = settings(db);
    if (provider === "RAZORPAY") throw httpError(400, "Online payment is not available in the demo. Use demo payment or offline payment.");
    if (provider === "OFFLINE" && !s["payments.offlineEnabled"]) throw httpError(400, "Offline payment is not available. Pay online instead.");

    const price = priceFor(db, course);
    recordConsents(db, user, CHECKOUT_CONSENTS, `enrol:${course.id}`);

    let order = null;
    const open = db.filter(ORDERS, (o) => o.userId === user.id && o.courseId === course.id && o.status === "PENDING").sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    for (const o of open) {
      if (!order && o.provider === provider && o.totalINR === price.totalINR) {
        order = o;
        continue;
      }
      if (o.provider === "OFFLINE" && o.offlineReference) throw httpError(409, "Your offline payment is being checked. We'll confirm it within one working day.");
      db.update(ORDERS, o.id, { status: "CANCELLED", failureReason: "Replaced by a new checkout." });
    }
    if (!order) {
      order = db.insert(ORDERS, {
        id: uid("ord"),
        userId: user.id,
        courseId: course.id,
        ...price,
        currency: "INR",
        status: "PENDING",
        provider,
        offlineReference: null,
        providerOrderId: null,
        providerPaymentId: null,
        receiptNo: null,
        termsVersion: String(s["policies.versions"]?.TERMS || ""),
        failureReason: null,
        refundINR: null,
        refundReason: null,
        refundedAt: null,
        paidAt: null,
        createdAt: now(),
      });
    }

    if (provider === "DEMO") {
      if (body?.simulate === "fail") {
        const failed = markFailed(db, order, "The bank declined the payment.");
        return { order: orderOut(db, failed) };
      }
      const { order: paid, enrollment } = markPaid(db, order, { paymentId: `pay_demo_${order.id}` });
      return { order: orderOut(db, paid), enrollment: toEnrollment(enrollment) };
    }
    return { order: orderOut(db, order) };
  },

  "POST /api/orders/:id/razorpay/verify": ({ params, db, user }) => {
    requireUser(user);
    ownOrder(db, user, params.id);
    throw httpError(400, "Online payment is not available in the demo.");
  },

  "POST /api/webhooks/razorpay": () => ({ ok: true, ignored: "demo" }),

  "POST /api/orders/:id/offline-reference": ({ params, body, db, user }) => {
    requireUser(user);
    const order = ownOrder(db, user, params.id);
    const reference = String(body?.reference || "").trim();
    if (reference.length < 4) throw httpError(400, "reference: Enter the UTR or reference number.");
    if (order.provider !== "OFFLINE") throw httpError(400, "This order is not an offline payment.");
    if (order.status !== "PENDING") throw httpError(409, `This order is ${order.status.toLowerCase()}.`);
    const first = !order.offlineReference;
    const updated = db.update(ORDERS, order.id, { offlineReference: reference.slice(0, 80) });
    if (first) {
      const title = db.findById("courses", order.courseId)?.title;
      for (const s of db.filter("users", (u) => u.role === "FINANCE")) {
        notify(db, s.id, { type: "SYSTEM", title: "Offline payment to verify", body: `${title} · ref ${reference}`, link: "/admin/payments?status=PENDING" });
      }
    }
    return orderOut(db, updated);
  },

  "GET /api/me/orders": ({ db, user }) => {
    requireUser(user);
    return db
      .filter(ORDERS, (o) => o.userId === user.id && o.status !== "CANCELLED")
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((o) => orderOut(db, o));
  },

  "GET /api/orders/:id/receipt": ({ params, db, user }) => {
    requireUser(user);
    const o = db.findById(ORDERS, params.id);
    const staff = ["ADMIN", "FINANCE"].includes(user.role);
    if (!o || (o.userId !== user.id && !staff)) throw httpError(404, "Receipt not found.");
    if (!o.receiptNo) throw httpError(404, "There's no receipt for this order yet.");
    const u = db.findById("users", o.userId);
    const order = orderOut(db, o);
    return {
      receiptNo: o.receiptNo,
      order,
      course: order.course,
      user: u ? { name: u.name, email: u.email } : null,
      issuedAt: o.paidAt || o.createdAt,
      issuer: { name: "Catalance Campus", email: settings(db)["support.email"] || null },
      paymentMethod: { RAZORPAY: "Online (Razorpay)", OFFLINE: "Bank transfer / UPI", DEMO: "Demo payment", FREE: "Free" }[o.provider] || o.provider,
      paymentRef: o.provider === "OFFLINE" ? o.offlineReference ?? null : o.providerPaymentId ?? null,
    };
  },

  /* ── consents ── */

  "GET /api/me/consents": ({ db, user }) => {
    requireUser(user);
    return db
      .filter(CONSENTS, (c) => c.userId === user.id)
      .sort((a, b) => new Date(b.acceptedAt) - new Date(a.acceptedAt))
      .map(consentOut);
  },

  "POST /api/me/consents": ({ body, db, user }) => {
    requireUser(user);
    const purposes = Array.isArray(body?.purposes) ? body.purposes : [];
    if (!purposes.length) throw httpError(400, "purposes: Choose at least one.");
    const bad = purposes.find((p) => !CONSENT_PURPOSES.includes(p));
    if (bad) throw httpError(400, `purposes: Unknown consent ${bad}.`);
    return recordConsents(db, user, purposes, body?.context).map(consentOut);
  },

  "POST /api/me/consents/:purpose/withdraw": ({ params, db, user }) => {
    requireUser(user);
    const purpose = String(params.purpose || "").toUpperCase();
    if (purpose !== "MARKETING") throw httpError(400, "Terms, privacy and refund consents can't be withdrawn while you use Campus. Contact support to close your account.");
    const active = db.filter(CONSENTS, (c) => c.userId === user.id && c.purpose === purpose && !c.withdrawnAt).sort((a, b) => new Date(b.acceptedAt) - new Date(a.acceptedAt));
    if (!active.length) throw httpError(404, "You haven't given marketing consent.");
    const at = now();
    for (const c of active) db.update(CONSENTS, c.id, { withdrawnAt: at });
    return consentOut(db.findById(CONSENTS, active[0].id));
  },

  /* ── finance console (ADMIN | FINANCE) ── */

  "GET /api/admin/orders": ({ query, db, user }) => {
    requireRole(user, "FINANCE");
    const status = query.status && query.status !== "all" ? query.status : null;
    const provider = query.provider && query.provider !== "all" ? query.provider : null;
    const q = String(query.q || "").trim().toLowerCase();
    return db
      .filter(ORDERS, (o) => (!status || o.status === status) && (!provider || o.provider === provider))
      .map((o) => orderOut(db, o, { withUser: true }))
      .filter((o) => !q || [o.id, o.receiptNo, o.offlineReference, o.user?.name, o.user?.email, o.course?.title].some((v) => String(v || "").toLowerCase().includes(q)))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  "POST /api/admin/orders/:id/verify-offline": ({ params, db, user }) => {
    requireRole(user, "FINANCE");
    const order = staffOrder(db, params.id);
    if (order.provider !== "OFFLINE") throw httpError(400, "Only offline payments are verified here.");
    if (order.status !== "PENDING" && order.status !== "PAID") throw httpError(409, `This order is ${order.status.toLowerCase()}.`);
    const { order: paid, enrollment } = markPaid(db, order, { actor: user, via: "offline" });
    return { order: orderOut(db, paid, { withUser: true }), enrollment: toEnrollment(enrollment) };
  },

  "POST /api/admin/orders/:id/fail": ({ params, body, db, user }) => {
    requireRole(user, "FINANCE");
    const reason = String(body?.reason || "").trim();
    if (reason.length < 3) throw httpError(400, "reason: Add a reason.");
    const order = staffOrder(db, params.id);
    return orderOut(db, markFailed(db, order, reason, { actor: user, staff: true }), { withUser: true });
  },

  "POST /api/admin/orders/:id/refund": ({ params, body, db, user }) => {
    requireRole(user, "FINANCE");
    const order = staffOrder(db, params.id);
    const reason = String(body?.reason || "").trim();
    const amount = Math.round(Number(body?.amountINR));
    if (reason.length < 3) throw httpError(400, "reason: Add a reason.");
    if (order.status === "REFUNDED") return orderOut(db, order, { withUser: true });
    if (order.status !== "PAID") throw httpError(409, "Only paid orders can be refunded.");
    // Partial refunds add up; the order stays PAID (access kept) until the whole total is refunded (same as the API).
    const already = order.refundINR || 0;
    const remaining = order.totalINR - already;
    if (!Number.isFinite(amount) || amount < 1 || amount > remaining) throw httpError(400, `Refund must be between ₹1 and ${rupees(remaining)}.`);
    const totalRefunded = already + amount;
    const full = totalRefunded >= order.totalINR;
    const updated = db.update(ORDERS, order.id, {
      status: full ? "REFUNDED" : "PAID",
      refundINR: totalRefunded,
      refunds: [...(order.refunds || []), { amountINR: amount, reason: reason.slice(0, 500), at: now(), byId: user.id }],
      refundReason: reason.slice(0, 500),
      refundedAt: now(),
      refundedById: user.id,
    });
    if (full) {
      const e = findEnrollment(db, order.userId, order.courseId);
      if (e) {
        db.remove("enrollments", e.id);
        db.update("courses", order.courseId, (c) => ({ studentsCount: Math.max(0, (c.studentsCount || 1) - 1) }));
      }
    }
    const title = db.findById("courses", order.courseId)?.title || "your course";
    notify(db, order.userId, {
      type: "COURSE",
      title: "Refund processed",
      body: `${rupees(amount)} refunded for ${title}${full ? "" : ` (${rupees(totalRefunded)} of ${rupees(order.totalINR)} so far)`}. It can take 5–7 working days to reach your account.${full ? " Your access to this course has ended." : ""}`,
      link: `/app/payments?receipt=${order.id}`,
    });
    audit(db, user, { action: "order.refund", entityId: order.id, before: { status: "PAID" }, after: { status: full ? "REFUNDED" : "PAID", refundINR: totalRefunded, refundedNowINR: amount, full }, reason });
    return orderOut(db, updated, { withUser: true });
  },
};
