import { AppError } from "../../utils/app-error.js";
import {
  getAcceptedProposal,
  getProjectPhaseCompletionSummary,
  normalizeProjectAmount,
} from "./project-payment-plan.js";

const ACTIVE_PAYOUT_STATUSES = new Set(["PENDING", "PROCESSING", "COMPLETED"]);
const SETTLED_PAYOUT_STATUS = "COMPLETED";

export const PROJECT_PAYOUT_DEFINITIONS = Object.freeze([
  {
    sequence: 1,
    key: "phase_2_payout",
    label: "2nd Phase payout",
    percentage: 25,
    phaseNumber: 2,
    releaseAfterCompletedPhases: 2,
    dueLabel: "Release after phase 2 is fully verified.",
  },
  {
    sequence: 2,
    key: "phase_3_payout",
    label: "3rd Phase payout",
    percentage: 25,
    phaseNumber: 3,
    releaseAfterCompletedPhases: 3,
    dueLabel: "Release after phase 3 is fully verified.",
  },
  {
    sequence: 3,
    key: "final_payout",
    label: "Final Phase payout",
    percentage: 50,
    phaseNumber: 4,
    releaseAfterCompletedPhases: 4,
    dueLabel: "Release after the final phase is fully verified.",
  },
]);

const toUpper = (value = "") => String(value || "").trim().toUpperCase();

const toPaymentArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

const compareDatesDescending = (left, right) =>
  new Date(right?.paidAt || right?.updatedAt || right?.createdAt || 0).getTime() -
  new Date(left?.paidAt || left?.updatedAt || left?.createdAt || 0).getTime();

const buildPayoutAmounts = (totalAmount) => {
  const safeTotal = normalizeProjectAmount(totalAmount);
  const firstAmount = Math.round(safeTotal * 0.25);
  const secondAmount = Math.round(safeTotal * 0.25);
  const finalAmount = Math.max(0, safeTotal - firstAmount - secondAmount);

  return [firstAmount, secondAmount, finalAmount];
};

export const resolveProjectPayoutPlan = (project, options = {}) => {
  const { requireAcceptedProposal = false } = options || {};
  const acceptedProposal = getAcceptedProposal(project);

  if (!acceptedProposal) {
    if (requireAcceptedProposal) {
      throw new AppError("No accepted proposal found for this project", 400);
    }
    return null;
  }

  const totalAmount = normalizeProjectAmount(acceptedProposal.amount || project?.budget || 0);
  if (totalAmount <= 0) {
    if (requireAcceptedProposal) {
      throw new AppError("Invalid project amount for payout", 400);
    }
    return null;
  }

  const clientPaidAmount = Math.min(normalizeProjectAmount(project?.spent || 0), totalAmount);
  const payoutAmounts = buildPayoutAmounts(totalAmount);
  const phaseSummary = getProjectPhaseCompletionSummary(project);
  const payments = toPaymentArray(project?.payments);
  const activePayments = payments.filter((payment) =>
    ACTIVE_PAYOUT_STATUSES.has(toUpper(payment?.status))
  );
  const settledPayments = activePayments.filter(
    (payment) => toUpper(payment?.status) === SETTLED_PAYOUT_STATUS
  );
  const committedAmount = Math.min(
    totalAmount,
    activePayments.reduce(
      (sum, payment) => sum + normalizeProjectAmount(payment?.amount || 0),
      0
    )
  );
  const settledAmount = Math.min(
    totalAmount,
    settledPayments.reduce(
      (sum, payment) => sum + normalizeProjectAmount(payment?.amount || 0),
      0
    )
  );

  let cumulativeAmount = 0;
  let previousCommittedAmount = 0;
  let allPreviousCommitted = true;

  const payouts = PROJECT_PAYOUT_DEFINITIONS.map((definition, index) => {
    const amount = payoutAmounts[index] || 0;
    cumulativeAmount += amount;

    const stagePayments = activePayments
      .filter(
        (payment) =>
          Number(payment?.payoutSequence || 0) === definition.sequence &&
          String(payment?.freelancerId || "") === String(acceptedProposal.freelancerId || "")
      )
      .sort(compareDatesDescending);
    const stagePayment = stagePayments[0] || null;
    const stagePaymentStatus = toUpper(stagePayment?.status);

    const isCommitted = Boolean(stagePayment) || committedAmount >= cumulativeAmount;
    const isPaid =
      stagePaymentStatus === SETTLED_PAYOUT_STATUS || settledAmount >= cumulativeAmount;
    const phaseGateReached =
      phaseSummary.completedPhaseCount >= definition.releaseAfterCompletedPhases;
    const escrowAvailableBeforePayout = Math.max(
      0,
      clientPaidAmount - previousCommittedAmount
    );
    const escrowCoverageReached = escrowAvailableBeforePayout >= amount;
    const isDue =
      !isCommitted && allPreviousCommitted && phaseGateReached && escrowCoverageReached;

    let status = "UPCOMING";
    if (isPaid) {
      status = "PAID";
    } else if (["PENDING", "PROCESSING"].includes(stagePaymentStatus)) {
      status = stagePaymentStatus;
    } else if (isDue) {
      status = "DUE";
    } else if (phaseGateReached && !escrowCoverageReached) {
      status = "AWAITING_CLIENT_FUNDS";
    }

    allPreviousCommitted = allPreviousCommitted && isCommitted;
    if (isCommitted) {
      previousCommittedAmount += amount;
    }

    return {
      ...definition,
      amount,
      cumulativeAmount,
      remainingAfterPayout: Math.max(0, totalAmount - cumulativeAmount),
      phaseGateReached,
      escrowAvailableBeforePayout,
      escrowCoverageReached,
      isCommitted,
      isPaid,
      isDue,
      status,
      payment: stagePayment,
    };
  });

  const nextDuePayout = payouts.find((payout) => payout.isDue) || null;
  const nextUnpaidPayout = payouts.find((payout) => !payout.isCommitted) || null;

  return {
    totalAmount,
    clientPaidAmount,
    committedAmount,
    settledAmount,
    remainingAmount: Math.max(0, totalAmount - committedAmount),
    completedPhaseCount: phaseSummary.completedPhaseCount,
    completedPhaseIds: phaseSummary.completedPhaseIds,
    phases: phaseSummary.phases,
    payouts,
    nextDuePayout,
    nextUnpaidPayout,
    availableEscrowAmount: Math.max(0, clientPaidAmount - committedAmount),
    isFullyPaidOut: committedAmount >= totalAmount,
    acceptedProposalId: acceptedProposal.id,
    acceptedProposalAmount: totalAmount,
  };
};

export const attachProjectPayoutPlan = (project) => ({
  ...project,
  payoutPlan: resolveProjectPayoutPlan(project),
});
