import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { validate } from "../lib/validate.js";
import { httpError } from "../lib/errors.js";
import { requireAuth } from "../lib/auth.js";
import { notify } from "../lib/notify.js";
import { walletTxnOut } from "../lib/serialize.js";
import { payLaterSummary, MIN_WITHDRAWAL_INR } from "../services/wallet.js";
import { requireFlag } from "../lib/settings.js";

const router = Router();
// spec §2 feature flag (F1): the whole area 404s while the flag is off (mounted at root, so scope by path)
router.use("/api/wallet", requireFlag("wallet"));
const formatINR = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

router.get("/api/wallet", requireAuth, async (req, res) => {
  const user = req.user;
  const [transactions, approved, payLater] = await Promise.all([
    prisma.walletTxn.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    prisma.gigApplication.findMany({ where: { userId: user.id, status: "APPROVED" }, select: { gig: { select: { payoutINR: true } } } }),
    payLaterSummary(user.id),
  ]);
  const pendingWithdrawals = -transactions.filter((t) => t.status === "PENDING" && t.amountINR < 0).reduce((n, t) => n + t.amountINR, 0);
  const awaitingPayout = approved.reduce((n, a) => n + (a.gig?.payoutINR || 0), 0);
  res.json({
    balanceINR: user.walletBalanceINR || 0,
    lifetimeEarnedINR: user.lifetimeEarnedINR || 0,
    pendingINR: pendingWithdrawals + awaitingPayout,
    payLater,
    transactions: transactions.map(walletTxnOut),
  });
});

const withdrawSchema = z.object({
  amountINR: z.coerce.number({ invalid_type_error: "The minimum withdrawal is ₹100." }).transform(Math.floor),
  upiId: z
    .string({ required_error: "Enter a valid UPI ID, like name@okaxis." })
    .trim()
    .regex(/^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,63}$/, "Enter a valid UPI ID, like name@okaxis."),
});

router.post("/api/wallet/withdraw", requireAuth, validate({ body: withdrawSchema }), async (req, res) => {
  const { amountINR: amount, upiId } = req.body;
  if (!Number.isFinite(amount) || amount < MIN_WITHDRAWAL_INR) throw httpError(400, "The minimum withdrawal is ₹100.");
  const txn = await prisma.$transaction(async (tx) => {
    // conditional decrement guards against concurrent double-withdrawals
    const { count } = await tx.user.updateMany({
      where: { id: req.user.id, walletBalanceINR: { gte: amount } },
      data: { walletBalanceINR: { decrement: amount } },
    });
    if (!count) {
      const fresh = await tx.user.findUnique({ where: { id: req.user.id }, select: { walletBalanceINR: true } });
      throw httpError(400, `You can withdraw up to ${formatINR(fresh?.walletBalanceINR || 0)}.`);
    }
    const t = await tx.walletTxn.create({
      data: { userId: req.user.id, type: "WITHDRAWAL", amountINR: -amount, note: `To UPI ${upiId}`, status: "PENDING", upiId },
    });
    await notify(req.user.id, { type: "SYSTEM", title: `Withdrawal of ${formatINR(amount)} started`, body: `It usually reaches ${upiId} within 24 hours.`, link: "/app/wallet" }, tx);
    return t;
  });
  res.status(201).json(walletTxnOut(txn));
});

export default router;
