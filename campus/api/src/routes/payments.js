import crypto from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma.js";
import { env } from "../lib/env.js";
import { validate, zQ, zQEnum } from "../lib/validate.js";
import { httpError } from "../lib/errors.js";
import { requireAuth, requireRole } from "../lib/auth.js";
import { notify } from "../lib/notify.js";
import { getSettings } from "../lib/settings.js";
import { getCourse, findEnrollment } from "../services/courses.js";
import { enrollmentOut } from "../lib/serialize.js";
import { ORDER_INCLUDE, orderOut, consentOut, receiptOut } from "../lib/serialize-payments.js";
import {
  assertCanEnrol,
  priceFor,
  recordConsents,
  razorpayEnabled,
  razorpayCreateOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  handleRazorpayEvent,
  markOrderPaid,
  markOrderFailed,
  refundOrder,
} from "../services/payments.js";

// B workstream: course payments, receipts, refunds and consent. See campus/API_CONTRACT.md "Spec v1.0" → Payments & consent.
const router = Router();

const CHECKOUT_CONSENTS = ["TERMS", "PRIVACY", "REFUND"];
const CONSENT_PURPOSES = ["TERMS", "PRIVACY", "REFUND", "ASSESSMENT_POLICY", "PROJECT_POLICY", "MARKETING"];
const ORDER_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED", "CANCELLED"];
const PROVIDERS = ["RAZORPAY", "OFFLINE", "DEMO", "FREE"];
const finance = [requireAuth, requireRole("FINANCE")]; // 💰 ADMIN | FINANCE (requireRole lets ADMIN through)

const limiter = (limit, message) =>
  rateLimit({
    windowMs: 60 * 1000,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id || req.ip,
    message: { error: { message } },
  });
const checkoutLimiter = limiter(10, "Too many payment attempts. Please wait a minute and try again.");
const consentLimiter = limiter(20, "Too many requests. Please wait a minute and try again.");

/** The caller's own order, or 404 (never reveal other users' orders). */
async function ownOrder(req, id) {
  const order = await prisma.courseOrder.findUnique({ where: { id }, include: ORDER_INCLUDE });
  if (!order || order.userId !== req.user.id) throw httpError(404, "Order not found.");
  return order;
}

const withCourse = (id) => prisma.courseOrder.findUnique({ where: { id }, include: ORDER_INCLUDE });

/* ───────────────────────── checkout ───────────────────────── */

const checkoutSchema = z.object({
  provider: z.enum(["RAZORPAY", "OFFLINE"]),
  consents: z.array(z.enum(CONSENT_PURPOSES)).default([]),
});

router.post("/api/courses/:id/checkout", requireAuth, checkoutLimiter, validate({ body: checkoutSchema }), async (req, res) => {
  const { provider, consents } = req.body;
  const missing = CHECKOUT_CONSENTS.filter((p) => !consents.includes(p));
  if (missing.length) throw httpError(400, "Please accept the terms, privacy policy and refund policy to continue.");

  const course = await getCourse(req.params.id, { detail: false });
  if (!course.priceINR) throw httpError(400, "This course is free. Enrol directly.");
  if (await findEnrollment(req.user.id, course.id)) throw httpError(409, "You're already enrolled in this course.");
  const paid = await prisma.courseOrder.findFirst({ where: { userId: req.user.id, courseId: course.id, status: "PAID" } });
  if (paid) throw httpError(409, "You've already paid for this course. Open it from My learning.");
  await assertCanEnrol(course);

  const settings = await getSettings();
  if (provider === "OFFLINE" && !settings["payments.offlineEnabled"]) throw httpError(400, "Offline payment is not available. Pay online instead.");
  if (provider === "RAZORPAY" && !razorpayEnabled()) throw httpError(400, "Online payment is not available right now. Choose offline payment.");

  const { advancePercent: _advance, ...price } = priceFor(course, settings);
  const termsVersion = String(settings["policies.versions"]?.TERMS || "");
  await recordConsents(req, CHECKOUT_CONSENTS, `enrol:${course.id}`);

  // Reuse an open PENDING order. Switching method cancels an unused one; a submitted offline reference must be checked first.
  let order = null;
  const open = await prisma.courseOrder.findMany({ where: { userId: req.user.id, courseId: course.id, status: "PENDING" }, orderBy: { createdAt: "desc" } });
  for (const o of open) {
    const samePrice = o.totalINR === price.totalINR && o.amountINR === price.amountINR;
    if (!order && o.provider === provider && samePrice) {
      order = o;
      continue;
    }
    if (o.provider === "OFFLINE" && o.offlineReference) {
      throw httpError(409, "Your offline payment is being checked. We'll confirm it within one working day.");
    }
    await prisma.courseOrder.updateMany({ where: { id: o.id, status: "PENDING" }, data: { status: "CANCELLED", failureReason: "Replaced by a new checkout." } });
  }

  if (!order) {
    order = await prisma.courseOrder.create({
      data: { userId: req.user.id, courseId: course.id, provider, currency: "INR", termsVersion, ...price },
    });
  }

  let razorpay;
  if (provider === "RAZORPAY") {
    if (!order.providerOrderId) {
      const rp = await razorpayCreateOrder(order);
      order = await prisma.courseOrder.update({ where: { id: order.id }, data: { providerOrderId: rp.id } });
    }
    razorpay = { keyId: env.razorpayKeyId, orderId: order.providerOrderId, amount: order.totalINR * 100, currency: order.currency };
  }

  const full = await withCourse(order.id);
  res.status(201).json({ order: orderOut(full), ...(razorpay ? { razorpay } : {}) });
});

/* ───────────────────────── Razorpay callback + webhook ───────────────────────── */

const verifySchema = z.object({
  razorpay_order_id: z.string().trim().min(1),
  razorpay_payment_id: z.string().trim().min(1),
  razorpay_signature: z.string().trim().min(1),
});

router.post("/api/orders/:id/razorpay/verify", requireAuth, checkoutLimiter, validate({ body: verifySchema }), async (req, res) => {
  const order = await ownOrder(req, req.params.id);
  const { razorpay_order_id: rpOrder, razorpay_payment_id: rpPayment, razorpay_signature: signature } = req.body;
  if (order.provider !== "RAZORPAY" || !order.providerOrderId || order.providerOrderId !== rpOrder) throw httpError(400, "This payment doesn't match your order.");
  if (!verifyPaymentSignature(rpOrder, rpPayment, signature)) throw httpError(400, "We couldn't verify this payment. If money left your account, contact support.");
  const result = await markOrderPaid(order.id, { providerPaymentId: rpPayment, req });
  const full = await withCourse(order.id);
  res.json({ order: orderOut(full), enrollment: enrollmentOut(result.enrollment) });
});

router.post("/api/webhooks/razorpay", async (req, res) => {
  if (!env.razorpayWebhookSecret) throw httpError(503, "Webhook is not configured.");
  const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {}));
  const signature = req.headers["x-razorpay-signature"];
  if (!signature || !verifyWebhookSignature(raw, signature)) throw httpError(400, "Invalid signature.");
  let event;
  try {
    event = JSON.parse(raw.toString("utf8"));
  } catch {
    throw httpError(400, "Invalid payload.");
  }
  const eventId = String(req.headers["x-razorpay-event-id"] || "") || crypto.createHash("sha256").update(raw).digest("hex");
  const result = await handleRazorpayEvent(event, eventId);
  res.json({ ok: true, ...(result.duplicate ? { duplicate: true } : {}) });
});

/* ───────────────────────── offline payment ───────────────────────── */

router.post(
  "/api/orders/:id/offline-reference",
  requireAuth,
  checkoutLimiter,
  validate({ body: z.object({ reference: z.string().trim().min(4, "Enter the UTR or reference number.").max(80) }) }),
  async (req, res) => {
    const order = await ownOrder(req, req.params.id);
    if (order.provider !== "OFFLINE") throw httpError(400, "This order is not an offline payment.");
    if (order.status !== "PENDING") throw httpError(409, `This order is ${order.status.toLowerCase()}.`);
    const first = !order.offlineReference;
    await prisma.courseOrder.update({ where: { id: order.id }, data: { offlineReference: req.body.reference } });
    if (first) {
      const staff = await prisma.user.findMany({ where: { role: "FINANCE" }, select: { id: true } });
      for (const s of staff) {
        await notify(s.id, { type: "SYSTEM", title: "Offline payment to verify", body: `${order.course?.title} · ref ${req.body.reference}`, link: "/admin/payments?status=PENDING" });
      }
    }
    res.json(orderOut(await withCourse(order.id)));
  },
);

/* ───────────────────────── student views ───────────────────────── */

router.get("/api/me/orders", requireAuth, async (req, res) => {
  const rows = await prisma.courseOrder.findMany({
    where: { userId: req.user.id, status: { not: "CANCELLED" } },
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  res.json(rows.map((o) => orderOut(o)));
});

router.get("/api/orders/:id/receipt", requireAuth, async (req, res) => {
  const order = await withCourse(req.params.id);
  const staff = ["ADMIN", "FINANCE"].includes(req.user.role);
  if (!order || (order.userId !== req.user.id && !staff)) throw httpError(404, "Receipt not found.");
  if (!order.receiptNo) throw httpError(404, "There's no receipt for this order yet.");
  const settings = await getSettings();
  res.json(receiptOut(order, { supportEmail: settings["support.email"] }));
});

/* ───────────────────────── consents ───────────────────────── */

router.get("/api/me/consents", requireAuth, async (req, res) => {
  const rows = await prisma.consentRecord.findMany({ where: { userId: req.user.id }, orderBy: { acceptedAt: "desc" } });
  res.json(rows.map(consentOut));
});

router.post(
  "/api/me/consents",
  requireAuth,
  consentLimiter,
  validate({ body: z.object({ purposes: z.array(z.enum(CONSENT_PURPOSES)).min(1), context: z.string().trim().max(120).default("") }) }),
  async (req, res) => {
    const rows = await recordConsents(req, req.body.purposes, req.body.context);
    res.status(201).json(rows.map(consentOut));
  },
);

router.post("/api/me/consents/:purpose/withdraw", requireAuth, consentLimiter, async (req, res) => {
  const purpose = String(req.params.purpose || "").toUpperCase();
  if (purpose !== "MARKETING") {
    throw httpError(400, "Terms, privacy and refund consents can't be withdrawn while you use Campus. Contact support to close your account.");
  }
  const active = await prisma.consentRecord.findMany({ where: { userId: req.user.id, purpose, withdrawnAt: null }, orderBy: { acceptedAt: "desc" } });
  if (!active.length) throw httpError(404, "You haven't given marketing consent.");
  await prisma.consentRecord.updateMany({ where: { id: { in: active.map((c) => c.id) } }, data: { withdrawnAt: new Date() } });
  res.json(consentOut(await prisma.consentRecord.findUnique({ where: { id: active[0].id } })));
});

/* ───────────────────────── finance console ───────────────────────── */

const adminListQuery = z.object({ status: zQEnum(ORDER_STATUSES), provider: zQEnum(PROVIDERS), q: zQ }).passthrough();

router.get("/api/admin/orders", ...finance, validate({ query: adminListQuery }), async (req, res) => {
  const { status, provider, q } = req.q;
  const where = {};
  if (status) where.status = status;
  if (provider) where.provider = provider;
  if (q) {
    where.OR = [
      { receiptNo: { contains: q, mode: "insensitive" } },
      { offlineReference: { contains: q, mode: "insensitive" } },
      { providerOrderId: { contains: q, mode: "insensitive" } },
      { id: q },
      { user: { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } },
      { course: { title: { contains: q, mode: "insensitive" } } },
    ];
  }
  const rows = await prisma.courseOrder.findMany({ where, include: ORDER_INCLUDE, orderBy: { createdAt: "desc" }, take: 500 });
  res.json(rows.map((o) => orderOut(o, { withUser: true })));
});

router.post("/api/admin/orders/:id/verify-offline", ...finance, validate({ body: z.object({ note: z.string().trim().max(500).optional() }) }), async (req, res) => {
  const order = await prisma.courseOrder.findUnique({ where: { id: req.params.id } });
  if (!order) throw httpError(404, "Order not found.");
  if (order.provider !== "OFFLINE") throw httpError(400, "Only offline payments are verified here.");
  if (order.status !== "PENDING" && order.status !== "PAID") throw httpError(409, `This order is ${order.status.toLowerCase()}.`);
  const result = await markOrderPaid(order.id, { verifiedById: req.user.id, req, via: "offline" });
  res.json({ order: orderOut(await withCourse(order.id), { withUser: true }), enrollment: enrollmentOut(result.enrollment) });
});

router.post("/api/admin/orders/:id/fail", ...finance, validate({ body: z.object({ reason: z.string().trim().min(3, "Add a reason.").max(300) }) }), async (req, res) => {
  await markOrderFailed(req.params.id, req.body.reason, { req, staff: true });
  res.json(orderOut(await withCourse(req.params.id), { withUser: true }));
});

router.post(
  "/api/admin/orders/:id/refund",
  ...finance,
  validate({ body: z.object({ amountINR: z.coerce.number().int().positive(), reason: z.string().trim().min(3, "Add a reason.").max(500) }) }),
  async (req, res) => {
    await refundOrder(req.params.id, { amountINR: req.body.amountINR, reason: req.body.reason, req });
    res.json(orderOut(await withCourse(req.params.id), { withUser: true }));
  },
);

export default router;
