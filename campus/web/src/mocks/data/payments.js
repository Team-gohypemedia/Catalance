/**
 * Demo seed for the payments domain (B workstream): course orders and consent records.
 * Orders follow the spec's 100% advance model (fee ex GST + 18% GST = total). Receipt numbers look like CC-2026-000123.
 */
import { daysAgo, hoursAgo } from "../utils";

const YEAR = new Date().getFullYear();
const GST = 18;
const money = (amountINR) => {
  const gstINR = Math.round((amountINR * GST) / 100);
  return { amountINR, gstPercent: GST, gstINR, totalINR: amountINR + gstINR, currency: "INR" };
};
const receipt = (n) => `CC-${YEAR}-${String(n).padStart(6, "0")}`;

const base = {
  offlineReference: null,
  providerOrderId: null,
  providerPaymentId: null,
  receiptNo: null,
  paidAt: null,
  verifiedById: null,
  refundINR: null,
  refundReason: null,
  refundedAt: null,
  refundedById: null,
  failureReason: null,
};

const courseOrders = [
  // u_student paid for the React course they're enrolled in (react-for-freelancers, started 18 days ago)
  {
    ...base,
    id: "ord_react_aarav",
    userId: "u_student",
    courseId: "co_react-for-freelancers",
    ...money(2499),
    status: "PAID",
    provider: "RAZORPAY",
    providerOrderId: "order_DEMO8sK2aQ1",
    providerPaymentId: "pay_DEMO8sK2aQ1",
    receiptNo: receipt(112),
    termsVersion: "2026-11-01",
    paidAt: daysAgo(18),
    createdAt: daysAgo(18),
  },
  // u_student paid offline for UX case studies; finance hasn't verified it yet
  {
    ...base,
    id: "ord_ux_aarav",
    userId: "u_student",
    courseId: "co_ux-case-studies",
    ...money(1799),
    status: "PENDING",
    provider: "OFFLINE",
    offlineReference: "UTR 412598730021",
    termsVersion: "2026-11-01",
    createdAt: hoursAgo(20),
  },
  // u_student's earlier card attempt for video editing failed
  {
    ...base,
    id: "ord_video_aarav",
    userId: "u_student",
    courseId: "co_video-editing-reels",
    ...money(1299),
    status: "FAILED",
    provider: "RAZORPAY",
    providerOrderId: "order_DEMO3Lm9Vx4",
    failureReason: "The bank declined the payment.",
    termsVersion: "2026-11-01",
    createdAt: daysAgo(3),
  },
  // a refunded order (another student changed their mind inside the refund window)
  {
    ...base,
    id: "ord_meta_s3",
    userId: "s_3",
    courseId: "co_meta-ads-d2c",
    ...money(2499),
    status: "REFUNDED",
    provider: "RAZORPAY",
    providerOrderId: "order_DEMO1Qe7Rt2",
    providerPaymentId: "pay_DEMO1Qe7Rt2",
    receiptNo: receipt(87),
    termsVersion: "2026-11-01",
    paidAt: daysAgo(30),
    refundINR: 2949,
    refundReason: "Requested within 7 days. Exam schedule clash.",
    refundedAt: daysAgo(27),
    refundedById: "u_admin",
    createdAt: daysAgo(30),
  },
  // more history for the finance console
  {
    ...base,
    id: "ord_brand_s27",
    userId: "s_27",
    courseId: "co_brand-identity-design",
    ...money(3499),
    status: "PAID",
    provider: "RAZORPAY",
    providerOrderId: "order_DEMO5Hn3Wc8",
    providerPaymentId: "pay_DEMO5Hn3Wc8",
    receiptNo: receipt(98),
    termsVersion: "2026-11-01",
    paidAt: daysAgo(12),
    createdAt: daysAgo(12),
  },
  {
    ...base,
    id: "ord_powerbi_s5",
    userId: "s_5",
    courseId: "co_power-bi-dashboards",
    ...money(1999),
    status: "PAID",
    provider: "OFFLINE",
    offlineReference: "UPI 3318-0921-4410",
    verifiedById: "u_finance",
    receiptNo: receipt(105),
    termsVersion: "2026-11-01",
    paidAt: daysAgo(6),
    createdAt: daysAgo(7),
  },
  {
    ...base,
    id: "ord_tally_asp",
    userId: "u_aspirant",
    courseId: "co_tally-prime-gst-essentials",
    ...money(1499),
    status: "PENDING",
    provider: "OFFLINE",
    termsVersion: "2026-11-01",
    createdAt: hoursAgo(5),
  },
];

const consent = (id, userId, purpose, context, at, withdrawnAt = null) => ({
  id,
  userId,
  purpose,
  policyVersion: "2026-11-01",
  context,
  ip: null,
  userAgent: "demo",
  acceptedAt: at,
  withdrawnAt,
});

const consentRecords = [
  consent("cr_1", "u_student", "TERMS", "onboarding", daysAgo(75)),
  consent("cr_2", "u_student", "PRIVACY", "onboarding", daysAgo(75)),
  consent("cr_3", "u_student", "MARKETING", "onboarding", daysAgo(75)),
  ...["TERMS", "PRIVACY", "REFUND"].map((p, i) => consent(`cr_r${i}`, "u_student", p, "enrol:co_react-for-freelancers", daysAgo(18))),
  ...["TERMS", "PRIVACY", "REFUND"].map((p, i) => consent(`cr_u${i}`, "u_student", p, "enrol:co_ux-case-studies", hoursAgo(20))),
  consent("cr_a1", "u_aspirant", "TERMS", "onboarding", daysAgo(40)),
  consent("cr_a2", "u_aspirant", "PRIVACY", "onboarding", daysAgo(40)),
];

export default { courseOrders, consentRecords };
