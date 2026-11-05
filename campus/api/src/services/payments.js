import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { env } from "../lib/env.js";
import { httpError } from "../lib/errors.js";
import { notify } from "../lib/notify.js";
import { audit } from "../lib/audit.js";
import { getSettings } from "../lib/settings.js";
import { getCourse } from "./courses.js";

/**
 * Course payments (spec §5.1 steps 3–6, §6.2, §17): 100% advance by default, Razorpay hosted checkout or an
 * admin-verified offline transfer. Card details never touch Campus. Every state change is idempotent, so a payment
 * confirmed by both the browser callback and the webhook (or a duplicate webhook) enrols the student exactly once.
 */

export const RAZORPAY_API = "https://api.razorpay.com/v1";
export const razorpayEnabled = () => Boolean(env.razorpayKeyId && env.razorpayKeySecret);

const ENROLLABLE = ["PUBLISHED", "ENROLMENT_OPEN"];
const REFUND_CLAIM_MS = 10 * 60 * 1000;
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const rupees = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

/* ───────────────────────── can this user enrol? ───────────────────────── */

/**
 * Why a user can't enrol in (or pay for) this course right now, or null when they can.
 * Shared by POST /api/courses/:id/enroll and checkout. Returns { status, message }.
 */
export async function enrolmentBlock(course, tx = prisma) {
  const status = course.status || "PUBLISHED";
  if (status === "DRAFT" || status === "ARCHIVED") return { status: 404, message: "Course not found." };
  if (status === "FULL") return { status: 409, message: "This course is full. Check back for the next batch." };
  if (status === "PAUSED") return { status: 409, message: "Enrolment for this course is paused right now." };
  if (!ENROLLABLE.includes(status)) return { status: 409, message: "This course is not open for enrolment." };
  const now = Date.now();
  if (course.enrolmentOpensAt && new Date(course.enrolmentOpensAt).getTime() > now) {
    return { status: 409, message: `Enrolment opens on ${fmtDate(course.enrolmentOpensAt)}.` };
  }
  if (course.enrolmentClosesAt && new Date(course.enrolmentClosesAt).getTime() < now) {
    return { status: 409, message: "Enrolment for this course has closed." };
  }
  if (course.capacity) {
    const taken = await tx.enrollment.count({ where: { courseId: course.id } });
    if (taken >= course.capacity) return { status: 409, message: "This course is full. Check back for the next batch." };
  }
  return null;
}

export async function assertCanEnrol(course, tx = prisma) {
  const block = await enrolmentBlock(course, tx);
  if (block) throw httpError(block.status, block.message);
}

/** The PAID order that grants access to a paid course (refunded orders don't count). */
export const findPaidOrder = (userId, courseId, tx = prisma) =>
  tx.courseOrder.findFirst({ where: { userId, courseId, status: "PAID" }, orderBy: { paidAt: "desc" } });

/* ───────────────────────── pricing ───────────────────────── */

/** Fee (ex GST) × advance % + GST, computed server-side (spec §6.2: fees exclude GST). */
export function priceFor(course, settings) {
  const gstPercent = Number(settings["pricing.gstPercent"] ?? 18);
  const advance = Math.min(100, Math.max(1, Number(settings["payments.advancePercent"] ?? 100)));
  const amountINR = Math.round(((course.priceINR || 0) * advance) / 100);
  const gstINR = Math.round((amountINR * gstPercent) / 100);
  return { amountINR, gstPercent, gstINR, totalINR: amountINR + gstINR, advancePercent: advance };
}

/* ───────────────────────── consent ───────────────────────── */

/** Record timestamped consents with the current policy versions (spec §5.1 step 4, §15). */
export async function recordConsents(req, purposes, context, tx = prisma) {
  const versions = (await getSettings())["policies.versions"] || {};
  const rows = [];
  for (const purpose of [...new Set(purposes)]) {
    rows.push(
      await tx.consentRecord.create({
        data: {
          userId: req.user.id,
          purpose,
          policyVersion: String(versions[purpose] || versions.PRIVACY || "1"),
          context: String(context || "").slice(0, 120),
          ip: req.ip ?? null,
          userAgent: req.headers?.["user-agent"]?.slice(0, 300) ?? null,
        },
      }),
    );
  }
  return rows;
}

/* ───────────────────────── notifications ───────────────────────── */

async function notifyFinance(payload, tx = prisma) {
  const staff = await tx.user.findMany({ where: { role: "FINANCE", status: { not: "SUSPENDED" } }, select: { id: true } });
  for (const s of staff) await notify(s.id, { type: "SYSTEM", link: "/admin/payments", ...payload }, tx);
}

/* ───────────────────────── receipts ───────────────────────── */

/** Next receipt number for this year: CC-2026-000123. Unique index on receiptNo guards the race; callers retry. */
async function nextReceiptNo(tx) {
  const prefix = `CC-${new Date().getFullYear()}-`;
  const last = await tx.courseOrder.findFirst({
    where: { receiptNo: { startsWith: prefix } },
    orderBy: { receiptNo: "desc" },
    select: { receiptNo: true },
  });
  const n = last ? Number(last.receiptNo.slice(prefix.length)) || 0 : 0;
  return `${prefix}${String(n + 1).padStart(6, "0")}`;
}

const isReceiptClash = (err) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002" && String(err.meta?.target || "").includes("receiptNo");

/* ───────────────────────── enrolment ───────────────────────── */

/** Create the enrolment if missing (+ studentsCount). Returns the enrollment row. */
export async function ensureEnrollment(tx, courseId, userId) {
  const existing = await tx.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } });
  if (existing) return { enrollment: existing, created: false };
  const course = await getCourse(courseId, { tx });
  const first = course.modules.flatMap((m) => m.lessons)[0];
  const enrollment = await tx.enrollment.create({ data: { userId, courseId, lastLessonId: first?.id ?? null } });
  await tx.course.update({ where: { id: courseId }, data: { studentsCount: { increment: 1 } } });
  return { enrollment, created: true, course };
}

/* ───────────────────────── state changes ───────────────────────── */

/**
 * PENDING/FAILED → PAID, issue receipt, enrol, notify (student: receipt + orientation; finance: payment received).
 * Idempotent: an order that is already PAID is returned as is. Returns { order, enrollment, changed }.
 */
export async function markOrderPaid(orderId, { providerPaymentId = null, verifiedById = null, req = null, via = "provider" } = {}) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const order = await tx.courseOrder.findUnique({ where: { id: orderId }, include: { course: { select: { id: true, title: true } } } });
        if (!order) throw httpError(404, "Order not found.");
        if (order.status === "PAID") {
          const enrollment = await tx.enrollment.findUnique({ where: { userId_courseId: { userId: order.userId, courseId: order.courseId } } });
          return { order, enrollment, changed: false };
        }
        // A provider-confirmed capture (signed callback / webhook) on an order replaced by a newer checkout still took
        // money, so the record must say PAID (finance refunds a duplicate). Staff can only mark PENDING/FAILED paid.
        const payable = providerPaymentId ? ["PENDING", "FAILED", "CANCELLED"] : ["PENDING", "FAILED"];
        if (!payable.includes(order.status)) throw httpError(409, `This order is ${order.status.toLowerCase()} and can't be marked paid.`);
        const duplicate =
          order.status === "CANCELLED" ? await tx.courseOrder.findFirst({ where: { userId: order.userId, courseId: order.courseId, status: "PAID", id: { not: order.id } } }) : null;

        const receiptNo = order.receiptNo || (await nextReceiptNo(tx));
        // claim the transition atomically: a concurrent callback/webhook updates 0 rows and falls through to "already paid"
        const claimed = await tx.courseOrder.updateMany({
          where: { id: order.id, status: { in: payable } },
          data: {
            status: "PAID",
            paidAt: new Date(),
            receiptNo,
            failureReason: null,
            ...(providerPaymentId ? { providerPaymentId } : {}),
            ...(verifiedById ? { verifiedById } : {}),
          },
        });
        const updated = await tx.courseOrder.findUnique({ where: { id: order.id }, include: { course: { select: { id: true, title: true } } } });
        if (!claimed.count) {
          const enrollment = await tx.enrollment.findUnique({ where: { userId_courseId: { userId: order.userId, courseId: order.courseId } } });
          return { order: updated, enrollment, changed: false };
        }

        const { enrollment } = await ensureEnrollment(tx, order.courseId, order.userId);
        const title = order.course?.title || "your course";
        await notify(
          order.userId,
          {
            type: "COURSE",
            title: "Payment received",
            body: `${rupees(order.totalINR)} paid for ${title}. Receipt ${receiptNo}.`,
            link: `/app/payments?receipt=${order.id}`,
          },
          tx,
        );
        await notify(
          order.userId,
          {
            type: "COURSE",
            title: `Start here: ${title}`,
            body: "Your course is unlocked. Open the first lesson and read the assessment brief so you know what to submit.",
            link: `/app/courses/${order.courseId}`,
          },
          tx,
        );
        await notifyFinance({ title: "Course payment received", body: `${rupees(order.totalINR)} · ${title} · ${receiptNo}` }, tx);
        if (duplicate) {
          await notifyFinance({ title: "Possible double payment", body: `${title}: ${receiptNo} and ${duplicate.receiptNo || duplicate.id} are both paid. Refund one.` }, tx);
        }
        await audit(
          req,
          {
            action: via === "offline" ? "order.verify_offline" : "order.paid",
            entity: "CourseOrder",
            entityId: order.id,
            before: { status: order.status },
            after: { status: "PAID", receiptNo, providerPaymentId: providerPaymentId || undefined },
          },
          tx,
        );
        return { order: updated, enrollment, changed: true };
      });
    } catch (err) {
      if (isReceiptClash(err) && attempt < 4) continue;
      throw err;
    }
  }
  throw httpError(503, "Couldn't issue a receipt. Please try again.");
}

/** PENDING → FAILED with a reason; notifies the student with retry/help steps and finance. Returns the order. */
export async function markOrderFailed(orderId, reason, { req = null, staff = false } = {}) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.courseOrder.findUnique({ where: { id: orderId }, include: { course: { select: { id: true, title: true } } } });
    if (!order) throw httpError(404, "Order not found.");
    if (order.status === "FAILED") return order;
    if (order.status !== "PENDING") {
      if (staff) throw httpError(409, `This order is ${order.status.toLowerCase()} and can't be marked failed.`);
      return order; // a late failure event for a paid/refunded order changes nothing
    }
    const failureReason = String(reason || "Payment failed.").slice(0, 300);
    await tx.courseOrder.updateMany({ where: { id: order.id, status: "PENDING" }, data: { status: "FAILED", failureReason } });
    const title = order.course?.title || "your course";
    await notify(
      order.userId,
      {
        type: "COURSE",
        title: "Payment didn't go through",
        body: `${title}: ${failureReason} No money was taken for this attempt. Try again from the course page, or contact support if money left your account.`,
        link: `/app/courses/${order.courseId}`,
      },
      tx,
    );
    await notifyFinance({ title: "Course payment failed", body: `${rupees(order.totalINR)} · ${title} · ${failureReason}` }, tx);
    if (staff) {
      await audit(req, { action: "order.fail", entity: "CourseOrder", entityId: order.id, before: { status: order.status }, after: { status: "FAILED" }, reason: failureReason }, tx);
    }
    return tx.courseOrder.findUnique({ where: { id: order.id } });
  });
}

/**
 * Refund all or part of a PAID order. Partial refunds add up in refundINR (history in `refunds`); the order stays PAID,
 * keeping course access, until the whole total is refunded, then it becomes REFUNDED and access ends.
 * Razorpay orders are refunded through the Razorpay API first, unless `providerRefundId` is given (the refund came from
 * Razorpay itself via webhook); a provider refund id is only ever recorded once, so webhook retries can't double count.
 */
export async function refundOrder(orderId, { amountINR, reason, req = null, providerRefundId = null }) {
  const order = await prisma.courseOrder.findUnique({ where: { id: orderId }, include: { course: { select: { id: true, title: true } } } });
  if (!order) throw httpError(404, "Order not found.");
  const history = Array.isArray(order.refunds) ? order.refunds : [];
  if (providerRefundId && history.some((r) => r.providerRefundId === providerRefundId)) return order;
  if (order.status === "REFUNDED") return order;
  if (order.status !== "PAID") throw httpError(409, "Only paid orders can be refunded.");
  const alreadyINR = order.refundINR || 0;
  const remaining = order.totalINR - alreadyINR;
  const amount = Math.round(Number(amountINR));
  if (!Number.isFinite(amount) || amount < 1 || amount > remaining) throw httpError(400, `Refund must be between ₹1 and ${rupees(remaining)}.`);
  let refundId = providerRefundId;

  if (order.provider === "RAZORPAY" && !providerRefundId) {
    if (!order.providerPaymentId) throw httpError(409, "This order has no Razorpay payment id to refund.");
    // Claim the refund before calling Razorpay so two finance users (or a double click) can't refund twice.
    // The marker lives in refundedById until the refund is recorded; a claim older than 10 minutes counts as abandoned.
    const marker = `refunding:${req?.user?.id || "system"}`;
    const claim = await prisma.courseOrder.updateMany({
      where: {
        id: order.id,
        status: "PAID",
        refundINR: order.refundINR,
        OR: [
          { refundedById: null },
          { NOT: { refundedById: { startsWith: "refunding:" } } }, // set by an earlier partial refund
          { refundedById: { startsWith: "refunding:" }, updatedAt: { lt: new Date(Date.now() - REFUND_CLAIM_MS) } },
        ],
      },
      data: { refundedById: marker },
    });
    if (!claim.count) throw httpError(409, "A refund for this order is already in progress. Refresh in a minute.");
    try {
      const refund = await razorpayRefund(order.providerPaymentId, amount, { campusOrderId: order.id, reason: String(reason).slice(0, 200) });
      refundId = refund?.id || null;
    } catch (err) {
      await prisma.courseOrder.updateMany({ where: { id: order.id, status: "PAID", refundedById: marker }, data: { refundedById: null } }).catch(() => {});
      throw err;
    }
  }

  return prisma.$transaction(async (tx) => {
    const totalRefunded = alreadyINR + amount;
    const full = totalRefunded >= order.totalINR;
    const entry = { amountINR: amount, reason: String(reason || "").slice(0, 500), at: new Date().toISOString(), byId: req?.user?.id ?? null, providerRefundId: refundId };
    // Optimistic: only applies if nobody recorded another refund since we read the order.
    const claimed = await tx.courseOrder.updateMany({
      where: { id: order.id, status: "PAID", refundINR: order.refundINR },
      data: {
        status: full ? "REFUNDED" : "PAID",
        refundINR: totalRefunded,
        refunds: [...history, entry],
        refundReason: entry.reason,
        refundedAt: new Date(),
        refundedById: req?.user?.id ?? null,
      },
    });
    const updated = await tx.courseOrder.findUnique({ where: { id: order.id } });
    if (!claimed.count) return updated;
    if (full) {
      const removed = await tx.enrollment.deleteMany({ where: { userId: order.userId, courseId: order.courseId } });
      if (removed.count) await tx.course.update({ where: { id: order.courseId }, data: { studentsCount: { decrement: 1 } } });
    }
    const title = order.course?.title || "your course";
    await notify(
      order.userId,
      {
        type: "COURSE",
        title: "Refund processed",
        body: `${rupees(amount)} refunded for ${title}${full ? "" : ` (${rupees(totalRefunded)} of ${rupees(order.totalINR)} so far)`}. It can take 5–7 working days to reach your account.${full ? " Your access to this course has ended." : ""}`,
        link: `/app/payments?receipt=${order.id}`,
      },
      tx,
    );
    await audit(
      req,
      { action: "order.refund", entity: "CourseOrder", entityId: order.id, before: { status: "PAID" }, after: { status: full ? "REFUNDED" : "PAID", refundINR: totalRefunded, refundedNowINR: amount, full }, reason: reason || null },
      tx,
    );
    return updated;
  });
}

/* ───────────────────────── Razorpay (plain fetch, basic auth) ───────────────────────── */

async function razorpayFetch(path, body) {
  const auth = Buffer.from(`${env.razorpayKeyId}:${env.razorpayKeySecret}`).toString("base64");
  let res;
  try {
    res = await fetch(`${RAZORPAY_API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
      body: JSON.stringify(body),
    });
  } catch {
    throw httpError(502, "Couldn't reach the payment provider. Please try again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("[campus-api] razorpay", path, res.status, data?.error?.description);
    throw httpError(502, data?.error?.description ? `Payment provider: ${data.error.description}` : "The payment provider rejected the request.");
  }
  return data;
}

/** Create a Razorpay order for the total (in paise). */
export function razorpayCreateOrder(order) {
  if (!razorpayEnabled()) throw httpError(400, "Online payment is not available. Choose offline payment.");
  return razorpayFetch("/orders", {
    amount: order.totalINR * 100,
    currency: order.currency || "INR",
    receipt: order.id.slice(0, 40),
    notes: { campusOrderId: order.id, courseId: order.courseId, userId: order.userId },
  });
}

export function razorpayRefund(paymentId, amountINR, notes) {
  if (!razorpayEnabled()) throw httpError(400, "Razorpay is not configured, so this order can't be refunded online.");
  return razorpayFetch(`/payments/${encodeURIComponent(paymentId)}/refund`, { amount: amountINR * 100, notes });
}

const safeEqualHex = (a, b) => {
  const x = Buffer.from(String(a || ""), "utf8");
  const y = Buffer.from(String(b || ""), "utf8");
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

/** Checkout callback signature: HMAC_SHA256(order_id|payment_id, KEY_SECRET). */
export function verifyPaymentSignature(orderId, paymentId, signature, secret = env.razorpayKeySecret) {
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

/** Webhook signature: HMAC_SHA256(rawBody, WEBHOOK_SECRET). */
export function verifyWebhookSignature(rawBody, signature, secret = env.razorpayWebhookSecret) {
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}

/**
 * Handle one verified Razorpay webhook. Duplicates (same provider + event id) are no-ops via WebhookEvent.
 * If processing throws, the event row is removed so Razorpay's retry is processed. Returns { ok, duplicate?, ignored? }.
 */
export async function handleRazorpayEvent(event, eventId) {
  const type = String(event?.event || "");
  try {
    await prisma.webhookEvent.create({ data: { provider: "razorpay", eventId, type } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return { ok: true, duplicate: true };
    throw err;
  }
  try {
    return await processRazorpayEvent(type, event?.payload || {});
  } catch (err) {
    await prisma.webhookEvent.deleteMany({ where: { provider: "razorpay", eventId } }).catch(() => {});
    throw err;
  }
}

async function orderForPayment(payment) {
  const campusOrderId = payment?.notes?.campusOrderId;
  return (
    (payment?.order_id && (await prisma.courseOrder.findUnique({ where: { providerOrderId: payment.order_id } }))) ||
    (campusOrderId && (await prisma.courseOrder.findUnique({ where: { id: String(campusOrderId) } }))) ||
    null
  );
}

async function processRazorpayEvent(type, payload) {
  if (type === "payment.captured") {
    const payment = payload.payment?.entity;
    const order = await orderForPayment(payment);
    if (!order) return { ok: true, ignored: "unknown order" };
    if (Number(payment.amount) !== order.totalINR * 100) {
      console.error("[campus-api] razorpay amount mismatch", order.id, payment.amount, order.totalINR);
      await audit(null, { action: "order.amount_mismatch", entity: "CourseOrder", entityId: order.id, after: { paidPaise: payment.amount, expectedPaise: order.totalINR * 100 } });
      return { ok: true, ignored: "amount mismatch" };
    }
    await markOrderPaid(order.id, { providerPaymentId: payment.id });
    return { ok: true };
  }
  if (type === "payment.failed") {
    const payment = payload.payment?.entity;
    const order = await orderForPayment(payment);
    if (!order) return { ok: true, ignored: "unknown order" };
    await markOrderFailed(order.id, payment?.error_description || "The bank declined the payment.");
    return { ok: true };
  }
  if (type === "refund.processed") {
    const refund = payload.refund?.entity;
    const order = refund?.payment_id ? await prisma.courseOrder.findUnique({ where: { providerPaymentId: refund.payment_id } }) : null;
    if (!order) return { ok: true, ignored: "unknown payment" };
    if (order.status !== "PAID") return { ok: true };
    // Refunds we started were recorded with their Razorpay id, so this is a no-op for them; dashboard refunds get recorded here.
    await refundOrder(order.id, { amountINR: Math.round(Number(refund.amount || 0) / 100), reason: "Refunded in Razorpay", providerRefundId: refund.id || `rfnd:${refund.payment_id}:${refund.amount}` });
    return { ok: true };
  }
  return { ok: true, ignored: type };
}
