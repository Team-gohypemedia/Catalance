import { formatINR } from "@/shared/lib/currency";

const defaultDateFormatOptions = {
  weekday: "long",
  month: "short",
  day: "numeric",
};

export const formatDashboardDate = (
  value,
  options = defaultDateFormatOptions,
) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "Today";
  return new Intl.DateTimeFormat("en-US", options).format(date);
};

export const getDashboardGreeting = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Hello";

  const hour = date.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
};

export const isProjectCompleted = (project = {}) => {
  const normalizedStatus = String(project?.status || "").toUpperCase();
  if (normalizedStatus === "COMPLETED") return true;
  return project?.paymentPlan?.isFullyPaid === true;
};

export const getProjectPaymentSummary = (projects = []) =>
  projects.reduce(
    (summary, project) => {
      const paymentPlan =
        project?.paymentPlan && typeof project.paymentPlan === "object"
          ? project.paymentPlan
          : null;

      if (!paymentPlan) return summary;

      summary.totalPaid += Number(paymentPlan.paidAmount) || 0;
      summary.totalPending += Number(paymentPlan.nextDueInstallment?.amount) || 0;

      return summary;
    },
    { totalPaid: 0, totalPending: 0 },
  );

export const getPendingProposalCount = (proposals = []) =>
  proposals.filter((proposal) => {
    const status = String(proposal?.status || "").toLowerCase();
    return status === "pending" || status === "sent";
  }).length;

export const formatDashboardMetricAmount = (value) => formatINR(value);
