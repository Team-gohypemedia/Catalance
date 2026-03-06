import { AppError } from "../../utils/app-error.js";
import { getSopFromTitle } from "../../../../src/shared/data/sopTemplates.js";

const INSTALLMENT_DEFINITIONS = Object.freeze([
  {
    sequence: 1,
    key: "initial_deposit",
    label: "Initial 20% payment",
    percentage: 20,
    dueAfterCompletedPhases: 0,
    dueLabel: "Required before the project can start.",
  },
  {
    sequence: 2,
    key: "phase_2_payment",
    label: "Phase 2 completion payment",
    percentage: 40,
    dueAfterCompletedPhases: 2,
    dueLabel: "Due after phases 1 and 2 are fully verified.",
  },
  {
    sequence: 3,
    key: "final_payment",
    label: "Final project payment",
    percentage: 40,
    dueAfterCompletedPhases: 4,
    dueLabel: "Due after phase 4 is fully verified.",
  },
]);

const normalizeAmount = (value) => {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed));
};

const toTaskIdArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item || "").trim()).filter(Boolean);
      }
    } catch {
      return [];
    }
  }

  return [];
};

const buildInstallmentAmounts = (totalAmount) => {
  const safeTotal = normalizeAmount(totalAmount);
  const initialAmount = Math.round(safeTotal * 0.2);
  const secondAmount = Math.round(safeTotal * 0.4);
  const finalAmount = Math.max(0, safeTotal - initialAmount - secondAmount);

  return [initialAmount, secondAmount, finalAmount];
};

const getPhaseCompletionSummary = (project) => {
  const sop = getSopFromTitle(project?.title || "");
  const verifiedTaskIds = new Set(toTaskIdArray(project?.verifiedTasks));

  const phases = sop.phases.map((phase) => {
    const phaseId = String(phase.id);
    const phaseTasks = sop.tasks.filter((task) => String(task.phase) === phaseId);
    const verifiedCount = phaseTasks.filter((task) =>
      verifiedTaskIds.has(`${task.phase}-${task.id}`)
    ).length;
    const totalTasks = phaseTasks.length;
    const isComplete = totalTasks > 0 && verifiedCount === totalTasks;

    return {
      id: phaseId,
      name: String(phase.name || "Phase").replace(/\s*\(\s*Phase-\d+\s*\)/i, "").trim(),
      totalTasks,
      verifiedTasks: verifiedCount,
      isComplete,
    };
  });

  const completedPhaseIds = phases.filter((phase) => phase.isComplete).map((phase) => phase.id);

  return {
    phases,
    completedPhaseIds,
    completedPhaseCount: completedPhaseIds.length,
  };
};

export const getAcceptedProposal = (project) => {
  if (!Array.isArray(project?.proposals)) return null;
  return (
    project.proposals.find((proposal) => String(proposal?.status || "").toUpperCase() === "ACCEPTED") ||
    null
  );
};

export const resolveProjectPaymentPlan = (project, options = {}) => {
  const { requireAcceptedProposal = false } = options || {};
  const acceptedProposal = getAcceptedProposal(project);

  if (!acceptedProposal) {
    if (requireAcceptedProposal) {
      throw new AppError("No accepted proposal found for this project", 400);
    }
    return null;
  }

  const totalAmount = normalizeAmount(acceptedProposal.amount || project?.budget || 0);
  if (totalAmount <= 0) {
    if (requireAcceptedProposal) {
      throw new AppError("Invalid project amount for payment", 400);
    }
    return null;
  }

  const paidAmount = Math.min(normalizeAmount(project?.spent || 0), totalAmount);
  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  const phaseSummary = getPhaseCompletionSummary(project);
  const installmentAmounts = buildInstallmentAmounts(totalAmount);

  let cumulativeAmount = 0;
  let allPreviousPaid = true;

  const installments = INSTALLMENT_DEFINITIONS.map((definition, index) => {
    const amount = installmentAmounts[index] || 0;
    cumulativeAmount += amount;

    const isPaid = paidAmount >= cumulativeAmount;
    const phaseGateReached =
      phaseSummary.completedPhaseCount >= definition.dueAfterCompletedPhases;
    const isDue = !isPaid && allPreviousPaid && phaseGateReached;

    const status = isPaid ? "PAID" : isDue ? "DUE" : "UPCOMING";

    allPreviousPaid = allPreviousPaid && isPaid;

    return {
      ...definition,
      amount,
      cumulativeAmount,
      remainingAfterPayment: Math.max(0, totalAmount - cumulativeAmount),
      phaseGateReached,
      status,
      isPaid,
      isDue,
    };
  });

  const nextDueInstallment = installments.find((installment) => installment.isDue) || null;
  const nextUnpaidInstallment =
    installments.find((installment) => !installment.isPaid) || null;

  return {
    totalAmount,
    paidAmount,
    remainingAmount,
    paidPercentage: Math.round((paidAmount / totalAmount) * 100),
    completedPhaseCount: phaseSummary.completedPhaseCount,
    completedPhaseIds: phaseSummary.completedPhaseIds,
    phases: phaseSummary.phases,
    installments,
    nextDueInstallment,
    nextUnpaidInstallment,
    isInitialPaymentPending: nextDueInstallment?.sequence === 1,
    isFullyPaid: paidAmount >= totalAmount,
    acceptedProposalId: acceptedProposal.id,
    acceptedProposalAmount: totalAmount,
  };
};

export const attachProjectPaymentPlan = (project) => ({
  ...project,
  paymentPlan: resolveProjectPaymentPlan(project),
});
