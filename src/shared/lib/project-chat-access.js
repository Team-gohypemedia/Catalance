export const getFirstProjectInstallment = (project = {}) =>
  Array.isArray(project?.paymentPlan?.installments)
    ? project.paymentPlan.installments[0] || null
    : null;

export const hasUnlockedProjectChat = (project = {}) => {
  const normalizedStatus = String(project?.status || "").toUpperCase();
  const paymentStatus = String(project?.paymentStatus || "").toUpperCase();
  const isSubAdminAssignment = Boolean(project?.isSubAdminAssignment);
  const isSubadminBypassed = Boolean(project?.paymentPlan?.isSubadminBypassed);

  if (
    normalizedStatus === "COMPLETED" ||
    normalizedStatus === "IN_PROGRESS" ||
    paymentStatus === "BYPASSED_SUBADMIN" ||
    paymentStatus === "BYPASSED" ||
    isSubAdminAssignment ||
    isSubadminBypassed
  ) {
    return true;
  }

  const paymentPlan =
    project?.paymentPlan && typeof project.paymentPlan === "object"
      ? project.paymentPlan
      : null;

  const installments = Array.isArray(paymentPlan?.installments)
    ? paymentPlan.installments
    : [];
  const firstInstallment = installments[0] || null;
  const nextDueInstallment = paymentPlan?.nextDueInstallment || null;
  const isFullyPaid = Boolean(paymentPlan?.isFullyPaid);
  const hasPaidInstallment = installments.some(
    (installment) => installment?.isPaid
  );
  const firstInstallmentPaid = Boolean(firstInstallment?.isPaid);
  const hasFirstPhaseMovedForward = Number(nextDueInstallment?.sequence) > 1;
  const kickoffPaymentStillDue =
    Number(nextDueInstallment?.sequence) === 1 ||
    normalizedStatus === "AWAITING_PAYMENT" ||
    normalizedStatus === "PENDING_PAYMENT";

  if (kickoffPaymentStillDue) {
    return false;
  }

  if (isFullyPaid || firstInstallmentPaid || hasPaidInstallment || hasFirstPhaseMovedForward) {
    return true;
  }

  return false;
};
