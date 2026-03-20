export const getMaxUnlockedVerificationPhaseOrder = (paymentPlan) => {
  const dueAfterCompletedPhases = Number(
    paymentPlan?.nextDueInstallment?.dueAfterCompletedPhases
  );

  if (!Number.isFinite(dueAfterCompletedPhases)) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.max(0, dueAfterCompletedPhases);
};

export const buildPhaseOrderMap = (phases = []) =>
  Object.fromEntries(
    phases.map((phase, index) => [String(phase?.id ?? index + 1), index + 1])
  );

export const getPhaseOrder = (phaseId, phaseOrderMap = {}) => {
  const phaseKey = String(phaseId ?? "");
  const mappedPhaseOrder = Number(phaseOrderMap?.[phaseKey]);

  if (Number.isFinite(mappedPhaseOrder) && mappedPhaseOrder > 0) {
    return mappedPhaseOrder;
  }

  const fallbackPhaseOrder = Number(phaseKey);
  return Number.isFinite(fallbackPhaseOrder) && fallbackPhaseOrder > 0
    ? fallbackPhaseOrder
    : null;
};

export const isPhaseOrderLockedByPayment = ({ phaseOrder, paymentPlan }) => {
  if (!Number.isFinite(phaseOrder) || phaseOrder <= 0) {
    return false;
  }

  return phaseOrder > getMaxUnlockedVerificationPhaseOrder(paymentPlan);
};

export const isTaskPhaseLockedByPayment = ({
  phaseId,
  phaseOrderMap,
  paymentPlan,
}) => {
  const phaseOrder = getPhaseOrder(phaseId, phaseOrderMap);
  return isPhaseOrderLockedByPayment({ phaseOrder, paymentPlan });
};
