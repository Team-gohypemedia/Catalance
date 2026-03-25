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

const toArray = (value) => {
  if (value instanceof Set) {
    return Array.from(value);
  }

  return Array.isArray(value) ? value : [];
};

const getTaskPhaseId = (taskId) => String(taskId ?? "").split("-")[0];

export const getStartedPhaseOrders = ({
  completedTaskIds,
  verifiedTaskIds,
  phaseOrderMap,
}) => {
  const phaseOrders = new Set();

  [...toArray(completedTaskIds), ...toArray(verifiedTaskIds)].forEach((taskId) => {
    const phaseOrder = getPhaseOrder(getTaskPhaseId(taskId), phaseOrderMap);
    if (Number.isFinite(phaseOrder) && phaseOrder > 0) {
      phaseOrders.add(phaseOrder);
    }
  });

  return Array.from(phaseOrders).sort((left, right) => left - right);
};

export const hasLaterPhaseStarted = ({
  phaseId,
  phaseOrderMap,
  completedTaskIds,
  verifiedTaskIds,
}) => {
  const phaseOrder = getPhaseOrder(phaseId, phaseOrderMap);
  if (!Number.isFinite(phaseOrder) || phaseOrder <= 0) {
    return false;
  }

  return getStartedPhaseOrders({
    completedTaskIds,
    verifiedTaskIds,
    phaseOrderMap,
  }).some((startedPhaseOrder) => startedPhaseOrder > phaseOrder);
};

export const isCompletedPhaseLockedAfterAdvance = ({
  phaseId,
  completedPhaseIds,
  phaseOrderMap,
  completedTaskIds,
  verifiedTaskIds,
}) => {
  const phaseKey = String(phaseId ?? "");
  const isCompletedPhase = toArray(completedPhaseIds).some(
    (completedPhaseId) => String(completedPhaseId ?? "") === phaseKey
  );

  if (!isCompletedPhase) {
    return false;
  }

  return hasLaterPhaseStarted({
    phaseId,
    phaseOrderMap,
    completedTaskIds,
    verifiedTaskIds,
  });
};

export const isTaskPhaseLockedByPayment = ({
  phaseId,
  phaseOrderMap,
  paymentPlan,
}) => {
  const phaseOrder = getPhaseOrder(phaseId, phaseOrderMap);
  return isPhaseOrderLockedByPayment({ phaseOrder, paymentPlan });
};
