/**
 * Payments & consent serializers (API_CONTRACT.md "Spec v1.0" → Payments & consent).
 * Never exposes provider secrets, signatures or the raw payment id to the client beyond what a receipt needs.
 */

export const ORDER_INCLUDE = {
  course: { select: { id: true, slug: true, title: true, level: true } },
  user: { select: { id: true, name: true, email: true, username: true } },
};

const courseRef = (c) => (c ? { id: c.id, slug: c.slug ?? null, title: c.title, level: c.level ?? null } : null);
const userRef = (u) => (u ? { id: u.id, name: u.name, email: u.email, username: u.username ?? null } : null);

/** CourseOrder. `withUser` adds { id, name, email } (staff views only). */
export function orderOut(o, { withUser = false } = {}) {
  if (!o) return null;
  const out = {
    id: o.id,
    userId: o.userId,
    courseId: o.courseId,
    course: courseRef(o.course),
    amountINR: o.amountINR,
    gstPercent: o.gstPercent,
    gstINR: o.gstINR,
    totalINR: o.totalINR,
    currency: o.currency,
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
  if (withUser) out.user = userRef(o.user);
  return out;
}

export const consentOut = (c) => ({
  id: c.id,
  userId: c.userId,
  purpose: c.purpose,
  policyVersion: c.policyVersion,
  context: c.context,
  acceptedAt: c.acceptedAt,
  withdrawnAt: c.withdrawnAt ?? null,
});

/** Printable receipt. `issuer` comes from settings (support email). */
export function receiptOut(o, { supportEmail } = {}) {
  return {
    receiptNo: o.receiptNo,
    order: orderOut(o),
    course: courseRef(o.course),
    user: o.user ? { name: o.user.name, email: o.user.email } : null,
    issuedAt: o.paidAt || o.createdAt,
    issuer: { name: "Catalance Campus", email: supportEmail || null },
    paymentMethod: { RAZORPAY: "Online (Razorpay)", OFFLINE: "Bank transfer / UPI", DEMO: "Demo payment", FREE: "Free" }[o.provider] || o.provider,
    paymentRef: o.provider === "OFFLINE" ? o.offlineReference ?? null : o.providerPaymentId ?? null,
  };
}
