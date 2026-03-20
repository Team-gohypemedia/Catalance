"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right";
import BriefcaseBusiness from "lucide-react/dist/esm/icons/briefcase-business";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import CircleDollarSign from "lucide-react/dist/esm/icons/circle-dollar-sign";
import Clock3 from "lucide-react/dist/esm/icons/clock-3";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import FolderOpen from "lucide-react/dist/esm/icons/folder-open";
import Landmark from "lucide-react/dist/esm/icons/landmark";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Plus from "lucide-react/dist/esm/icons/plus";
import Wallet from "lucide-react/dist/esm/icons/wallet";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FreelancerTopBar } from "@/components/features/freelancer/FreelancerTopBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/shared/context/AuthContext";
import { FREELANCER_BUDGET_SHARE, formatINR } from "@/shared/lib/currency";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";

const surfaceClass =
  "rounded-[28px] border border-white/[0.05] bg-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]";

const metricCardClass = `${surfaceClass} px-6 py-6`;

const PAYMENT_METHODS = [
  {
    id: "bank-transfer",
    label: "Bank Transfer",
    subtitle: "Primary payout route for domestic withdrawals.",
    icon: Landmark,
  },
  {
    id: "payoneer",
    label: "Payoneer",
    subtitle: "Useful for international payout handling.",
    icon: CreditCard,
  },
  {
    id: "paypal",
    label: "PayPal",
    subtitle: "Fast online payouts for supported regions.",
    icon: Wallet,
  },
];

const EMPTY_SUMMARY = Object.freeze({
  totalShare: 0,
  receivedShare: 0,
  pendingShare: 0,
  escrowShare: 0,
  awaitingDepositShare: 0,
  availableToWithdraw: 0,
  activeContracts: 0,
});

const PROJECT_FILTER_ALL_VALUE = "ALL";

const toUpper = (value = "") => String(value).trim().toUpperCase();
const isAwaitingDeposit = (status = "") => toUpper(status) === "AWAITING_PAYMENT";
const formatDateLabel = (value) => {
  if (!value) return "-";

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "-";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

const formatMonthLabel = (value) => {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "";

  return parsedDate.toLocaleDateString("en-IN", { month: "short" });
};

const formatCompactINR = (value = 0) => {
  const amount = Number(value) || 0;

  if (amount >= 1000) {
    return `Rs.${Math.round(amount / 1000)}k`;
  }

  return `Rs.${amount}`;
};

const toShareAmount = (gross = 0) =>
  Math.max(0, Math.round((Number(gross) || 0) * FREELANCER_BUDGET_SHARE));

const getClientName = (proposal = {}) =>
  proposal?.project?.owner?.fullName ||
  proposal?.project?.owner?.name ||
  proposal?.client?.fullName ||
  proposal?.client?.name ||
  "Client";

const getProjectTitle = (proposal = {}) =>
  proposal?.project?.title || proposal?.title || "Untitled Project";

const getActivityDate = (...values) => {
  for (const value of values) {
    const parsedDate = new Date(value);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString();
    }
  }

  return null;
};

const getProjectPaymentRow = (proposal = {}) => {
  const grossAmount = Number(proposal?.amount) || 0;
  const freelancerShare = toShareAmount(grossAmount);
  const projectStatus = toUpper(proposal?.project?.status);
  const awaitingDeposit = isAwaitingDeposit(projectStatus);
  const isCompleted = projectStatus === "COMPLETED";
  const inEscrow = !isCompleted && !awaitingDeposit;

  return {
    id: proposal?.id || `${proposal?.project?.id || getProjectTitle(proposal)}-payment`,
    projectId: proposal?.project?.id || proposal?.projectId || null,
    projectTitle: getProjectTitle(proposal),
    clientName: getClientName(proposal),
    grossAmount,
    freelancerShare,
    receivedAmount: isCompleted ? freelancerShare : 0,
    pendingAmount: isCompleted ? 0 : freelancerShare,
    escrowAmount: inEscrow ? freelancerShare : 0,
    awaitingDepositAmount: awaitingDeposit ? freelancerShare : 0,
    statusType: isCompleted
      ? "received"
      : awaitingDeposit
        ? "awaiting_deposit"
        : "escrow",
    updatedAt: getActivityDate(
      proposal?.project?.updatedAt,
      proposal?.updatedAt,
      proposal?.createdAt,
    ),
  };
};

const getFallbackInstallment = (proposal = {}, { isCompleted, awaitingDeposit }) => ({
  sequence: 1,
  label: "Project payout",
  amount: Number(proposal?.amount) || 0,
  isPaid: isCompleted,
  isDue: !isCompleted && !awaitingDeposit,
  amountPaid: isCompleted ? Number(proposal?.amount) || 0 : 0,
  updatedAt: getActivityDate(
    proposal?.project?.updatedAt,
    proposal?.updatedAt,
    proposal?.createdAt,
  ),
});

const getMilestoneRows = (proposal = {}) => {
  const projectStatus = toUpper(proposal?.project?.status);
  const awaitingDeposit = isAwaitingDeposit(projectStatus);
  const isCompleted = projectStatus === "COMPLETED";
  const installments =
    (Array.isArray(proposal?.project?.paymentPlan?.installments) &&
      proposal.project.paymentPlan.installments.length > 0 &&
      proposal.project.paymentPlan.installments) ||
    (Array.isArray(proposal?.paymentPlan?.installments) &&
      proposal.paymentPlan.installments.length > 0 &&
      proposal.paymentPlan.installments) ||
    [getFallbackInstallment(proposal, { isCompleted, awaitingDeposit })];

  return installments.map((installment, index) => {
    const grossAmount = Number(installment?.amount) || Number(proposal?.amount) || 0;
    const shareAmount = toShareAmount(grossAmount);
    const amountPaid = Number(
      installment?.amountPaid ?? (installment?.isPaid ? grossAmount : 0),
    );
    const paidShare = Math.min(shareAmount, toShareAmount(amountPaid));
    const isPaid =
      Boolean(installment?.isPaid) || (grossAmount > 0 && amountPaid >= grossAmount);
    const isPending = Boolean(installment?.isDue) || (!isPaid && !awaitingDeposit);
    const statusTone = isPaid
      ? "paid"
      : awaitingDeposit
        ? "awaiting"
        : isPending
          ? "pending"
          : "escrow";

    return {
      id: `${proposal?.id || proposal?.project?.id || "proposal"}-${
        installment?.sequence || index + 1
      }`,
      projectId: proposal?.project?.id || proposal?.projectId || null,
      projectTitle: getProjectTitle(proposal),
      clientName: getClientName(proposal),
      label: installment?.label || `Milestone ${installment?.sequence || index + 1}`,
      sequence: installment?.sequence || index + 1,
      grossAmount,
      shareAmount,
      paidShare,
      statusTone,
      statusLabel:
        statusTone === "paid"
          ? "Paid"
          : statusTone === "awaiting"
            ? "Awaiting Deposit"
            : statusTone === "pending"
              ? "Pending"
              : "In Escrow",
      date: getActivityDate(
        installment?.paidAt,
        installment?.updatedAt,
        installment?.createdAt,
        proposal?.project?.updatedAt,
        proposal?.updatedAt,
        proposal?.createdAt,
      ),
    };
  });
};

const getSummaryFromRows = (rows = []) =>
  rows.reduce(
    (accumulator, row) => {
      accumulator.totalShare += row.freelancerShare;
      accumulator.receivedShare += row.receivedAmount;
      accumulator.pendingShare += row.pendingAmount;
      accumulator.escrowShare += row.escrowAmount;
      accumulator.awaitingDepositShare += row.awaitingDepositAmount;
      accumulator.availableToWithdraw += row.receivedAmount;
      if (row.pendingAmount > 0) {
        accumulator.activeContracts += 1;
      }
      return accumulator;
    },
    { ...EMPTY_SUMMARY },
  );

const buildMonthlyTrend = (rows = []) => {
  const now = new Date();
  const months = Array.from({ length: 3 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (2 - index), 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      month: formatMonthLabel(date),
      earnings: 0,
    };
  });

  const monthIndex = new Map(months.map((item, index) => [item.key, index]));

  rows.forEach((row) => {
    if (row.statusTone !== "paid" || !row.date) return;

    const date = new Date(row.date);
    if (Number.isNaN(date.getTime())) return;

    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const index = monthIndex.get(key);
    if (index === undefined) return;

    months[index].earnings += row.paidShare || row.shareAmount || 0;
  });

  return months;
};

const getStatusClasses = (statusTone) => {
  if (statusTone === "paid") {
    return {
      dot: "bg-[#22c55e]",
      text: "text-[#4ade80]",
    };
  }

  if (statusTone === "pending") {
    return {
      dot: "bg-[#facc15]",
      text: "text-[#facc15]",
    };
  }

  if (statusTone === "awaiting") {
    return {
      dot: "bg-[#94a3b8]",
      text: "text-[#cbd5e1]",
    };
  }

  return {
    dot: "bg-[#60a5fa]",
    text: "text-[#93c5fd]",
  };
};

const PaymentMetricCard = ({
  label,
  value,
  helper,
  icon: Icon,
  loading,
  tone = "default",
}) => (
  <div className={metricCardClass}>
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8f96a3]">
          {label}
        </p>
        {loading ? (
          <Skeleton className="mt-5 h-10 w-36 rounded-xl bg-white/[0.06]" />
        ) : (
          <p
            className={cn(
              "mt-5 text-[2.2rem] font-semibold leading-none tracking-[-0.04em]",
              tone === "success"
                ? "text-[#22c55e]"
                : tone === "warning"
                  ? "text-[#facc15]"
                  : "text-white",
            )}
          >
            {formatINR(value)}
          </p>
        )}
      </div>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-[#242424] text-[#facc15]">
        <Icon className="size-4" />
      </div>
    </div>
    <p className="mt-5 text-sm text-[#8f96a3]">{helper}</p>
  </div>
);

const ProjectFilterMenu = ({ projects, value, onValueChange }) => {
  const selectedProject =
    value === PROJECT_FILTER_ALL_VALUE
      ? null
      : projects.find((project) => String(project.id) === String(value)) || null;

  const selectedLabel = selectedProject?.title || "All projects";

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-11 items-center gap-2 rounded-[12px] bg-[#facc15] px-4 text-sm font-semibold text-[#141414] transition hover:bg-[#ffd84d]"
        >
          <FolderOpen className="size-4 shrink-0" />
          <span>Project Filter</span>
          <span className="max-w-[10rem] truncate rounded-full border border-white/[0.08] bg-background px-2.5 py-0.5 text-[11px] font-semibold text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            {selectedLabel}
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-80" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[min(22rem,calc(100vw-2rem))] rounded-[18px] border border-white/[0.08] bg-[#1f1f1f] p-2 text-white shadow-[0_18px_45px_rgba(0,0,0,0.35)]"
      >
        <DropdownMenuLabel className="px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8f96a3]">
          Filter projects
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1 bg-white/[0.06]" />

        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          <DropdownMenuRadioItem
            value={PROJECT_FILTER_ALL_VALUE}
            className="items-start rounded-[14px] px-3 py-2.5 pl-3 transition-colors hover:bg-white/[0.04] data-[state=checked]:bg-white/[0.06] [&>span:first-child]:hidden"
          >
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold text-white">All Projects</span>
              <span className="text-xs text-[#8f96a3]">
                Show the combined freelancer payments dashboard
              </span>
            </div>
          </DropdownMenuRadioItem>

          {projects.map((project) => (
            <DropdownMenuRadioItem
              key={project.id}
              value={String(project.id)}
              className="items-start rounded-[14px] px-3 py-2.5 pl-3 transition-colors hover:bg-white/[0.04] data-[state=checked]:bg-white/[0.06] [&>span:first-child]:hidden"
            >
              <div className="flex min-w-0 flex-col items-start">
                <span className="truncate text-sm font-semibold text-white">
                  {project.title}
                </span>
                <span className="truncate text-xs text-[#8f96a3]">
                  {project.clientName}
                </span>
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const PaymentMethodRow = ({ method, onClick }) => (
  <button
    type="button"
    onClick={() => onClick(method)}
    className="group flex w-full items-center gap-4 rounded-[18px] border border-white/[0.05] bg-white/[0.015] px-4 py-4 text-left transition hover:border-white/[0.08] hover:bg-white/[0.03]"
  >
    <div className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-[#141414] text-white">
      <method.icon className="size-[18px]" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <p className="truncate text-base font-medium text-white">{method.label}</p>
        {method.badge ? (
          <Badge className="border-0 bg-[#283118] px-2.5 py-0.5 text-[10px] font-medium text-[#facc15]">
            {method.badge}
          </Badge>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-[#9096a1]">{method.subtitle}</p>
    </div>
    <ChevronRight className="size-4 text-[#8f96a3] transition group-hover:text-white" />
  </button>
);

const EarningsTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) {
    return null;
  }

  const amount = Number(payload[0]?.value) || 0;

  return (
    <div className="rounded-[16px] border border-white/[0.06] bg-[#121212] px-3 py-2 shadow-2xl">
      <p className="text-[11px] text-[#8f96a3]">{label}</p>
      <p className="mt-1 text-base font-semibold text-white">{formatINR(amount)}</p>
    </div>
  );
};

const FreelancerPayments = () => {
  const { authFetch, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [projectRows, setProjectRows] = useState([]);
  const [milestoneRows, setMilestoneRows] = useState([]);
  const [projectFilter, setProjectFilter] = useState(PROJECT_FILTER_ALL_VALUE);
  const [isPayoutConnected, setIsPayoutConnected] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [lastWithdrawalAt, setLastWithdrawalAt] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    const loadPayments = async () => {
      setIsLoading(true);

      try {
        const response = await authFetch("/proposals?as=freelancer");
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.message || "Failed to load freelancer payments");
        }

        const proposals = Array.isArray(payload?.data) ? payload.data : [];
        const acceptedProposals = proposals.filter(
          (proposal) => toUpper(proposal?.status) === "ACCEPTED",
        );

        const nextProjectRows = acceptedProposals
          .map(getProjectPaymentRow)
          .sort(
            (left, right) =>
              new Date(right.updatedAt || 0).getTime() -
              new Date(left.updatedAt || 0).getTime(),
          );

        const nextMilestoneRows = acceptedProposals
          .flatMap(getMilestoneRows)
          .sort(
            (left, right) =>
              new Date(right.date || 0).getTime() - new Date(left.date || 0).getTime(),
          );

        if (!isMounted) return;

        setProjectRows(nextProjectRows);
        setMilestoneRows(nextMilestoneRows);
      } catch (error) {
        console.error("Failed to load freelancer payments", error);
        if (!isMounted) return;
        setProjectRows([]);
        setMilestoneRows([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPayments();

    return () => {
      isMounted = false;
    };
  }, [authFetch, isAuthenticated]);

  const paymentProjects = useMemo(
    () =>
      projectRows.map((row) => ({
        id: row.projectId || row.id,
        title: row.projectTitle,
        clientName: row.clientName,
      })),
    [projectRows],
  );

  useEffect(() => {
    if (projectFilter === PROJECT_FILTER_ALL_VALUE) return;

    const projectStillExists = paymentProjects.some(
      (project) => String(project.id) === String(projectFilter),
    );

    if (!projectStillExists) {
      setProjectFilter(PROJECT_FILTER_ALL_VALUE);
    }
  }, [paymentProjects, projectFilter]);

  const filteredProjectRows = useMemo(() => {
    if (projectFilter === PROJECT_FILTER_ALL_VALUE) {
      return projectRows;
    }

    return projectRows.filter(
      (row) => String(row.projectId || row.id) === String(projectFilter),
    );
  }, [projectFilter, projectRows]);

  const filteredMilestoneRows = useMemo(() => {
    if (projectFilter === PROJECT_FILTER_ALL_VALUE) {
      return milestoneRows;
    }

    return milestoneRows.filter(
      (row) => String(row.projectId || row.id) === String(projectFilter),
    );
  }, [milestoneRows, projectFilter]);

  const summary = useMemo(
    () => getSummaryFromRows(filteredProjectRows),
    [filteredProjectRows],
  );
  const monthlyTrend = useMemo(
    () => buildMonthlyTrend(filteredMilestoneRows),
    [filteredMilestoneRows],
  );
  const thisMonthEarnings = monthlyTrend[monthlyTrend.length - 1]?.earnings || 0;
  const pendingMilestones = useMemo(
    () => filteredMilestoneRows.slice(0, 5),
    [filteredMilestoneRows],
  );

  const paymentMethods = useMemo(
    () =>
      PAYMENT_METHODS.map((method) =>
        method.id === "bank-transfer" && isPayoutConnected
          ? {
              ...method,
              subtitle: "Connected and ready for withdrawals.",
              badge: "Primary",
            }
          : method,
      ),
    [isPayoutConnected],
  );

  const handleConnectPayoutAccount = useCallback(() => {
    setIsPayoutConnected(true);
    toast.success(
      "Bank transfer is now marked as connected. Wire this to your real payout onboarding next.",
    );
  }, []);

  const handleManagePaymentMethod = useCallback(
    (method) => {
      if (method.id === "bank-transfer") {
        handleConnectPayoutAccount();
        return;
      }

      toast.success(`${method.label} setup flow can be connected here next.`);
    },
    [handleConnectPayoutAccount],
  );

  const handleWithdraw = useCallback(async () => {
    if (!isPayoutConnected) {
      toast.error("Connect a payout method before withdrawing funds.");
      return;
    }

    if (summary.availableToWithdraw <= 0) {
      toast.error("There is no available balance to withdraw yet.");
      return;
    }

    setIsWithdrawing(true);

    try {
      await new Promise((resolve) => {
        setTimeout(resolve, 900);
      });

      setLastWithdrawalAt(new Date());
      toast.success("Withdrawal request submitted. Connect this to your payout provider next.");
    } finally {
      setIsWithdrawing(false);
    }
  }, [isPayoutConnected, summary.availableToWithdraw]);

  return (
    <div className="flex-1 flex flex-col relative h-full overflow-hidden bg-background">
      <FreelancerTopBar />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 z-10 relative scroll-smooth">
        <div className="mx-auto max-w-[1600px] space-y-6">
          <section className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl space-y-3">
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-[3.4rem]">
                Payments
              </h1>
              <p className="max-w-xl text-lg leading-8 text-[#9096a1]">
                Track your earnings, pending milestone payouts, and payout balance in one
                freelancer workspace.
              </p>
            </div>

            <ProjectFilterMenu
              projects={paymentProjects}
              value={projectFilter}
              onValueChange={setProjectFilter}
            />
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <PaymentMetricCard
              label="Total Earnings"
              value={summary.totalShare}
              helper="Your full Catalance earnings across accepted projects."
              icon={Wallet}
              loading={isLoading}
            />
            <PaymentMetricCard
              label="Available Balance"
              value={summary.availableToWithdraw}
              helper="Ready to withdraw once your payout method is connected."
              icon={CircleDollarSign}
              loading={isLoading}
              tone="success"
            />
            <PaymentMetricCard
              label="Pending Payments"
              value={summary.pendingShare}
              helper="Still in escrow or waiting for client funding."
              icon={Clock3}
              loading={isLoading}
              tone="warning"
            />
            <PaymentMetricCard
              label="This Month's Earnings"
              value={thisMonthEarnings}
              helper={`${summary.activeContracts} active project${summary.activeContracts === 1 ? "" : "s"} in motion.`}
              icon={BriefcaseBusiness}
              loading={isLoading}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.75fr)_minmax(320px,0.85fr)]">
            <div className="space-y-6">
              <div className={cn(surfaceClass, "px-8 py-8")}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-[2rem] font-semibold tracking-[-0.03em] text-white">
                      Wallet Balance
                    </h2>
                    <p className="mt-2 text-base text-[#9096a1]">
                      See what is ready for payout, what is still protected in escrow, and
                      what is waiting on client action.
                    </p>
                  </div>
                  <Badge className="h-8 rounded-full border-0 bg-white/[0.05] px-3 text-xs font-medium text-[#d2d6dc]">
                    {summary.activeContracts} active
                  </Badge>
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-3">
                  <div className="border-b border-white/[0.06] pb-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
                    <p className="text-base text-[#a0a6b1]">Available to Withdraw</p>
                    {isLoading ? (
                      <Skeleton className="mt-4 h-10 w-36 rounded-xl bg-white/[0.06]" />
                    ) : (
                      <p className="mt-4 text-[2.4rem] font-semibold tracking-[-0.05em] text-[#22c55e]">
                        {formatINR(summary.availableToWithdraw)}
                      </p>
                    )}
                    <p className="mt-3 text-sm text-[#8f96a3]">Ready for payout</p>
                  </div>

                  <div className="border-b border-white/[0.06] pb-4 lg:border-b-0 lg:border-r lg:pb-0 lg:px-6">
                    <p className="text-base text-[#a0a6b1]">Pending in Escrow</p>
                    {isLoading ? (
                      <Skeleton className="mt-4 h-10 w-36 rounded-xl bg-white/[0.06]" />
                    ) : (
                      <p className="mt-4 text-[2.4rem] font-semibold tracking-[-0.05em] text-white">
                        {formatINR(summary.escrowShare)}
                      </p>
                    )}
                    <p className="mt-3 text-sm text-[#8f96a3]">Awaiting pending milestone release</p>
                  </div>

                  <div className="lg:pl-6">
                    <p className="text-base text-[#a0a6b1]">Awaiting Client Deposit</p>
                    {isLoading ? (
                      <Skeleton className="mt-4 h-10 w-36 rounded-xl bg-white/[0.06]" />
                    ) : (
                      <p className="mt-4 text-[2.4rem] font-semibold tracking-[-0.05em] text-white">
                        {formatINR(summary.awaitingDepositShare)}
                      </p>
                    )}
                    <p className="mt-3 text-sm text-[#8f96a3]">Action required by the client</p>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Button
                    type="button"
                    onClick={handleWithdraw}
                    disabled={
                      isLoading ||
                      isWithdrawing ||
                      !isPayoutConnected ||
                      summary.availableToWithdraw <= 0
                    }
                    className="h-12 rounded-[14px] bg-[#facc15] px-5 text-sm font-semibold text-black hover:bg-[#f6d64e]"
                  >
                    {isWithdrawing ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <ArrowUpRight className="mr-2 size-4" />
                    )}
                    Withdraw Funds
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleConnectPayoutAccount}
                    className="h-12 rounded-[14px] border-white/[0.05] bg-[#232323] px-5 text-sm font-semibold text-white hover:bg-[#2b2b2b] hover:text-white"
                  >
                    <Plus className="mr-2 size-4" />
                    Add Payment Method
                  </Button>
                </div>

                {lastWithdrawalAt ? (
                  <p className="mt-4 text-sm text-[#8f96a3]">
                    Last withdrawal request:{" "}
                    {new Intl.DateTimeFormat("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(lastWithdrawalAt)}
                  </p>
                ) : null}
              </div>

              <div className={cn(surfaceClass, "px-8 py-7")}>
                <div className="mb-6">
                  <h2 className="text-[2rem] font-semibold tracking-[-0.03em] text-white">
                    Pending Milestones
                  </h2>
                  <p className="mt-2 text-base text-[#9096a1]">
                    Follow every milestone payout as it moves from pending funding into paid
                    status.
                  </p>
                </div>

                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-14 w-full rounded-2xl bg-white/[0.06]" />
                    <Skeleton className="h-14 w-full rounded-2xl bg-white/[0.06]" />
                    <Skeleton className="h-14 w-full rounded-2xl bg-white/[0.06]" />
                  </div>
                ) : pendingMilestones.length === 0 ? (
                  <div className="rounded-[22px] border border-dashed border-white/[0.06] bg-white/[0.015] px-5 py-12 text-center">
                    <p className="text-xl font-semibold text-white">No payout milestones yet</p>
                    <p className="mt-2 text-sm text-[#8f96a3]">
                      Accepted projects with milestone schedules will start appearing here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left">
                      <thead>
                        <tr className="border-b border-white/[0.06] text-xs uppercase tracking-[0.18em] text-[#8f96a3]">
                          <th className="pb-5 pr-6 font-medium">Date</th>
                          <th className="pb-5 pr-6 font-medium">Project</th>
                          <th className="pb-5 pr-6 font-medium">Client</th>
                          <th className="pb-5 pr-6 font-medium">Amount</th>
                          <th className="pb-5 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingMilestones.map((row) => {
                          const statusClasses = getStatusClasses(row.statusTone);

                          return (
                            <tr
                              key={row.id}
                              className="border-b border-white/[0.05] last:border-b-0"
                            >
                              <td className="py-5 pr-6 text-base text-[#a0a6b1]">
                                {formatDateLabel(row.date)}
                              </td>
                              <td className="py-5 pr-6">
                                <p className="text-base font-medium text-white">{row.projectTitle}</p>
                                <p className="mt-1 text-sm text-[#8f96a3]">{row.label}</p>
                              </td>
                              <td className="py-5 pr-6 text-base font-medium text-white">
                                {row.clientName}
                              </td>
                              <td className="py-5 pr-6 text-base font-semibold text-white">
                                {formatINR(row.shareAmount)}
                              </td>
                              <td className="py-5">
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-2 text-base font-medium",
                                    statusClasses.text,
                                  )}
                                >
                                  <span className={cn("size-2.5 rounded-full", statusClasses.dot)} />
                                  {row.statusLabel}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className={cn(surfaceClass, "px-6 py-6")}>
                <h2 className="text-[2rem] font-semibold tracking-[-0.03em] text-white">
                  Payment Methods
                </h2>
                <div className="mt-6 space-y-4">
                  {paymentMethods.map((method) => (
                    <PaymentMethodRow
                      key={method.id}
                      method={method}
                      onClick={handleManagePaymentMethod}
                    />
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleConnectPayoutAccount}
                  className="mt-6 h-12 w-full rounded-[16px] border-white/[0.05] bg-transparent text-sm font-medium text-[#a0a6b1] hover:bg-white/[0.02] hover:text-white"
                >
                  <Plus className="mr-2 size-4 text-[#facc15]" />
                  Add Payment Method
                </Button>
              </div>

              <div className={cn(surfaceClass, "px-6 py-6")}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-[2rem] font-semibold tracking-[-0.03em] text-white">
                      Monthly Earnings
                    </h2>
                    <p className="mt-2 text-sm text-[#9096a1]">
                      Paid milestone trend for the last three months.
                    </p>
                  </div>
                  {!isLoading ? (
                    <div className="rounded-[16px] border border-white/[0.06] bg-[#141414] px-3 py-2">
                      <p className="text-[11px] text-[#8f96a3]">
                        {monthlyTrend[monthlyTrend.length - 1]?.month || ""}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-white">
                        {formatINR(thisMonthEarnings)}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="mt-6 h-[260px]">
                  {isLoading ? (
                    <Skeleton className="h-full w-full rounded-[22px] bg-white/[0.06]" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={monthlyTrend}
                        margin={{ top: 16, right: 8, left: -18, bottom: 0 }}
                      >
                        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
                        <XAxis
                          dataKey="month"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#8f96a3", fontSize: 12 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#8f96a3", fontSize: 12 }}
                          tickFormatter={formatCompactINR}
                          width={54}
                        />
                        <Tooltip
                          cursor={{ stroke: "rgba(255,255,255,0.08)" }}
                          content={<EarningsTooltip />}
                        />
                        <Line
                          type="monotone"
                          dataKey="earnings"
                          stroke="#facc15"
                          strokeWidth={3}
                          dot={{ r: 4, fill: "#facc15", strokeWidth: 0 }}
                          activeDot={{ r: 6, fill: "#facc15", stroke: "#1f1f1f", strokeWidth: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default FreelancerPayments;
