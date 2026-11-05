import { prisma } from "../lib/prisma.js";

export const PAY_LATER_PERCENT = 20;
export const MIN_WITHDRAWAL_INR = 100;

/**
 * Study now, pay later: fees of enrolled pay-later (non-free) courses
 * minus what has already been deducted from gig earnings.
 */
export async function payLaterSummary(userId, tx = prisma) {
  const enrollments = await tx.enrollment.findMany({
    where: { userId },
    select: { course: { select: { priceINR: true, payLater: true } } },
  });
  const totalFeesINR = enrollments
    .map((e) => e.course)
    .filter((c) => c && c.payLater && (c.priceINR || 0) > 0)
    .reduce((s, c) => s + c.priceINR, 0);
  const agg = await tx.walletTxn.aggregate({ where: { userId, type: "COURSE_FEE_DEDUCTION" }, _sum: { amountINR: true } });
  const deductedINR = Math.abs(agg._sum.amountINR || 0);
  return {
    totalFeesINR,
    deductedINR,
    remainingINR: Math.max(0, totalFeesINR - deductedINR),
    deductionPercent: PAY_LATER_PERCENT,
  };
}
