import { AppError } from "../../utils/app-error.js";
import {
  getAcceptedProposal,
  getProjectPhaseCompletionSummary,
  normalizeProjectAmount,
  resolveProjectAmount,
} from "./project-payment-plan.js";

const ACTIVE_PAYOUT_STATUSES = new Set(["PENDING", "PROCESSING", "COMPLETED"]);
const SETTLED_PAYOUT_STATUS = "COMPLETED";

export const PROJECT_PAYOUT_DEFINITIONS = Object.freeze([
  {
    sequence: 1,
    key: "phase_1_payout",
    label: "Phase 1 Completed Payout",
    percentage: 0,
    phaseNumber: 1,
    releaseAfterCompletedPhases: 1,
    dueLabel: "No payout released after Phase 1.",
  },
  {
    sequence: 2,
    key: "phase_2_payout",
    label: "Phase 2 Completed Payout",
    percentage: 20,
    phaseNumber: 2,
    releaseAfterCompletedPhases: 2,
    dueLabel: "Release 20% of freelancer share after Phase 2 is fully verified.",
  },
  {
    sequence: 3,
    key: "phase_3_payout",
    label: "Phase 3 Completed Payout",
    percentage: 30,
    phaseNumber: 3,
    releaseAfterCompletedPhases: 3,
    dueLabel: "Release 30% of freelancer share after Phase 3 is fully verified.",
  },
  {
    sequence: 4,
    key: "final_payout",
    label: "Phase 4 Final Payout",
    percentage: 50,
    phaseNumber: 4,
    releaseAfterCompletedPhases: 4,
    dueLabel: "Release 50% of freelancer share after Phase 4 is fully verified.",
  },
]);

const toUpper = (value = "") => String(value || "").trim().toUpperCase();

const toPaymentArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

const compareDatesDescending = (left, right) =>
  new Date(right?.paidAt || right?.updatedAt || right?.createdAt || 0).getTime() -
  new Date(left?.paidAt || left?.updatedAt || left?.createdAt || 0).getTime();

const buildPayoutAmounts = (freelancerTotalShare) => {
  const safeTotal = normalizeProjectAmount(freelancerTotalShare);
  const phase1Amount = 0;
  const phase2Amount = Math.round(safeTotal * 0.20);
  const phase3Amount = Math.round(safeTotal * 0.30);
  const phase4Amount = Math.max(0, safeTotal - phase1Amount - phase2Amount - phase3Amount);

  return [phase1Amount, phase2Amount, phase3Amount, phase4Amount];
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

  const projectBaseValue = resolveProjectAmount(project, acceptedProposal);
  if (projectBaseValue <= 0) {
    if (requireAcceptedProposal) {
      throw new AppError("Invalid project amount for payout", 400);
    }
    return null;
  }

  const platformShare = Math.round(projectBaseValue * 0.5);
  const freelancerTotalShare = Math.round(projectBaseValue * 0.5);
  const clientPaidAmount = Math.min(normalizeProjectAmount(project?.spent || 0), projectBaseValue);
  const payoutAmounts = buildPayoutAmounts(freelancerTotalShare);
  const phaseSummary = getProjectPhaseCompletionSummary(project);
  const payments = toPaymentArray(project?.payments);
  const activePayments = payments.filter((payment) =>
    ACTIVE_PAYOUT_STATUSES.has(toUpper(payment?.status))
  );
  const settledPayments = activePayments.filter(
    (payment) => toUpper(payment?.status) === SETTLED_PAYOUT_STATUS
  );
  const committedAmount = Math.min(
    freelancerTotalShare,
    activePayments.reduce(
      (sum, payment) => sum + normalizeProjectAmount(payment?.freelancerAmount || payment?.amount || 0),
      0
    )
  );
  const settledAmount = Math.min(
    freelancerTotalShare,
    settledPayments.reduce(
      (sum, payment) => sum + normalizeProjectAmount(payment?.freelancerAmount || payment?.amount || 0),
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

    const isCommitted = amount === 0 ? true : Boolean(stagePayment) || committedAmount >= cumulativeAmount;
    const isPaid = amount === 0 ? true : stagePaymentStatus === SETTLED_PAYOUT_STATUS || settledAmount >= cumulativeAmount;
    const phaseGateReached =
      phaseSummary.completedPhaseCount >= definition.releaseAfterCompletedPhases;
    const escrowAvailableBeforePayout = Math.max(
      0,
      clientPaidAmount - previousCommittedAmount
    );
    const escrowCoverageReached = escrowAvailableBeforePayout >= amount;
    const isDue =
      amount > 0 && !isCommitted && allPreviousCommitted && phaseGateReached && escrowCoverageReached;

    let status = amount === 0 ? "PAID" : "UPCOMING";
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
      remainingAfterPayout: Math.max(0, freelancerTotalShare - cumulativeAmount),
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
  const nextUnpaidPayout = payouts.find((payout) => payout.amount > 0 && !payout.isCommitted) || null;

  return {
    projectBaseValue,
    platformShare,
    freelancerTotalShare,
    totalAmount: freelancerTotalShare, // Total freelancer share
    clientPaidAmount,
    clientPendingAmount: Math.max(0, projectBaseValue - clientPaidAmount),
    committedAmount,
    settledAmount,
    freelancerAmountReleased: settledAmount,
    freelancerPendingBalance: Math.max(0, freelancerTotalShare - settledAmount),
    remainingAmount: Math.max(0, freelancerTotalShare - committedAmount),
    currentProjectPhase: phaseSummary.completedPhaseCount,
    completedPhaseCount: phaseSummary.completedPhaseCount,
    completedPhaseIds: phaseSummary.completedPhaseIds,
    phases: phaseSummary.phases,
    payouts,
    nextDuePayout,
    nextUnpaidPayout,
    availableEscrowAmount: Math.max(0, clientPaidAmount - committedAmount),
    isFullyPaidOut: settledAmount >= freelancerTotalShare,
    acceptedProposalId: acceptedProposal.id,
    acceptedProposalAmount: projectBaseValue,
  };
};

export const attachProjectPayoutPlan = (project) => ({
  ...project,
  payoutPlan: resolveProjectPayoutPlan(project),
});


