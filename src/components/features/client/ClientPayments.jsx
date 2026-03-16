"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import Download from "lucide-react/dist/esm/icons/download";
import FileText from "lucide-react/dist/esm/icons/file-text";
import FolderOpen from "lucide-react/dist/esm/icons/folder-open";
import Landmark from "lucide-react/dist/esm/icons/landmark";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Plus from "lucide-react/dist/esm/icons/plus";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import Wallet from "lucide-react/dist/esm/icons/wallet";
import { useNavigate } from "react-router-dom";
import ClientDashboardFooter from "@/components/features/client/ClientDashboardFooter";
import ClientWorkspaceHeader from "@/components/features/client/ClientWorkspaceHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/shared/context/AuthContext";
import { useNotifications } from "@/shared/context/NotificationContext";
import { processProjectInstallmentPayment } from "@/shared/lib/project-payment";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatCompactCurrency = (value = 0) => {
  const numericValue = Number(value) || 0;
  if (numericValue >= 10000000) {
    return `Rs.${(numericValue / 10000000).toFixed(numericValue >= 100000000 ? 0 : 1)}Cr`;
  }
  if (numericValue >= 100000) {
    return `Rs.${(numericValue / 100000).toFixed(numericValue >= 1000000 ? 0 : 1)}L`;
  }
  if (numericValue >= 1000) {
    return `Rs.${Math.round(numericValue / 1000)}k`;
  }
  return `Rs.${numericValue}`;
};

const maskCurrency = (value, visible) => (visible ? formatCurrency(value) : "Rs. --,--");

const formatShortDate = (value) => {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

const formatMonthLabel = (value, variant = "short") => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { month: variant });
};

const getDisplayName = (user) =>
  user?.fullName || user?.name || user?.email?.split("@")[0] || "Client";

const getInitials = (value = "") => {
  const parts = String(value).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "C";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const getAcceptedProposal = (project) => {
  const proposals = Array.isArray(project?.proposals) ? project.proposals : [];
  return proposals.find(
    (proposal) => String(proposal?.status || "").toUpperCase() === "ACCEPTED",
  );
};

const createReceiptFileName = (projectTitle = "", invoiceId = "") => {
  const safeTitle = String(projectTitle || "project")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `catalance-receipt-${safeTitle || "project"}-${invoiceId || "invoice"}.txt`;
};

const downloadReceipt = (invoice) => {
  const issuedAt = invoice?.issuedAt
    ? new Date(invoice.issuedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })
    : "-";
  const receiptContent = [
    "Catalance Receipt",
    "-----------------",
    `Invoice ID: ${invoice.id}`,
    `Project: ${invoice.projectTitle}`,
    `Installment: ${invoice.installmentLabel}`,
    `Issued On: ${issuedAt}`,
    `Status: ${invoice.statusLabel}`,
    `Scheduled Amount: ${formatCurrency(invoice.amountDue)}`,
    `Amount Paid: ${formatCurrency(invoice.amountPaid)}`,
    `Held in Escrow: ${formatCurrency(invoice.escrowHeld)}`,
  ].join("\n");
  const blob = new Blob([receiptContent], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = createReceiptFileName(invoice.projectTitle, invoice.id);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

const PaymentSummaryCard = ({
  label,
  value,
  helper,
  visible,
  icon: Icon,
  kind = "currency",
  tone = "default",
}) => (
  <div className="rounded-[20px] border border-white/[0.05] bg-accent px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8f96a3]">{label}</p>
        <p
          className={cn(
            "mt-2 truncate text-[2rem] font-semibold leading-none tracking-[-0.04em]",
            tone === "success"
              ? "text-[#34d399]"
              : tone === "warning"
                ? "text-[#facc15]"
                : "text-white",
          )}
        >
          {kind === "currency" ? maskCurrency(value, visible) : value}
        </p>
      </div>
      {Icon ? (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[#2b2b2b] text-[#facc15]">
          <Icon className="size-4" />
        </div>
      ) : null}
    </div>
    {helper ? <p className="mt-4 text-xs text-[#7c828d]">{helper}</p> : null}
  </div>
);

const BillingToolRow = ({
  label,
  subtitle,
  icon: Icon,
  onClick,
  disabled = false,
  loading = false,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="group flex w-full items-center gap-3 rounded-[16px] border border-white/[0.05] bg-white/[0.01] px-4 py-3 text-left transition hover:border-white/[0.08] hover:bg-white/[0.02] disabled:cursor-not-allowed disabled:opacity-60"
  >
    <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[#141414] text-[#e5e7eb]">
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="mt-0.5 text-xs text-[#8f96a3]">{subtitle}</p>
    </div>
    <ArrowRight className="size-4 text-[#8f96a3] transition group-hover:text-white" />
  </button>
);

const getProjectBillingState = (project) => {
  if (project?.nextDueInstallment) {
    return {
      label: "Payment due",
      className: "border-[#ffc107]/20 bg-[#ffc107]/10 text-[#ffc107]",
    };
  }

  if (project?.isFullyPaid) {
    return {
      label: "Fully funded",
      className: "border-[#22c55e]/20 bg-[#22c55e]/10 text-[#22c55e]",
    };
  }

  return {
    label: "On track",
    className: "border-white/[0.08] bg-white/[0.03] text-[#d4d4d8]",
  };
};

const TransactionRow = ({ transaction, visible, onOpenProject }) => {
  const amount = transaction?.isPaid ? transaction.amountPaid : transaction.amountDue;

  return (
    <button
      type="button"
      onClick={() => onOpenProject(transaction?.projectId)}
      className="flex w-full items-center justify-between gap-3 border-b border-white/[0.05] py-3 text-left last:border-b-0"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">{transaction.installmentLabel}</p>
        <p className="truncate text-xs text-[#8f96a3]">{transaction.freelancerName}</p>
      </div>
      <div className="text-right">
        <p
          className={cn(
            "text-sm font-semibold",
            transaction.isDue ? "text-[#facc15]" : "text-white",
          )}
        >
          {maskCurrency(amount, visible)}
        </p>
        <p className="mt-0.5 text-[11px] text-[#7c828d]">{formatShortDate(transaction.issuedAt)}</p>
      </div>
    </button>
  );
};

const ActiveProjectPaymentsPanel = ({
  project,
  showAmounts,
  processingInvoiceId,
  onPay,
  onOpenProject,
  onOpenProjects,
  onOpenProposals,
}) => {
  if (!project) {
    return (
      <div className="rounded-[24px] border border-white/[0.05] bg-accent p-6">
        <h2 className="text-[1.8rem] font-semibold tracking-[-0.03em] text-white">Active Project Payments</h2>
        <div className="mt-5 rounded-[18px] border border-dashed border-white/[0.1] bg-[#2a2a2a] p-6 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-white/[0.04] text-[#facc15]">
            <CreditCard className="size-6" />
          </div>
          <p className="mt-4 text-lg font-semibold text-white">No active payment timeline yet</p>
          <p className="mx-auto mt-2 max-w-[30rem] text-sm text-[#8f96a3]">
            Accepted projects will appear here with milestone-based payment schedule, due amounts, and release actions.
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onOpenProposals}
              className="inline-flex h-10 items-center justify-center rounded-[10px] bg-[#facc15] px-5 text-sm font-semibold text-[#141414] transition hover:bg-[#ffd84d]"
            >
              Open Proposals
            </button>
            <button
              type="button"
              onClick={onOpenProjects}
              className="inline-flex h-10 items-center justify-center rounded-[10px] border border-white/[0.08] px-5 text-sm font-semibold text-white transition hover:border-white/[0.14] hover:bg-white/[0.03]"
            >
              View Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  const dueInstallment = project.nextDueInstallment;
  const releasePaymentId = dueInstallment ? `${project.id}-${dueInstallment.sequence}` : null;
  const isProcessingRelease = Boolean(releasePaymentId && processingInvoiceId === releasePaymentId);
  const scheduleItems = Array.isArray(project.installments)
    ? project.installments.slice(0, 4)
    : [];

  return (
    <div className="rounded-[24px] border border-white/[0.05] bg-accent p-6">
      <h2 className="text-[1.8rem] font-semibold tracking-[-0.03em] text-white">Active Project Payments</h2>

      <div className="mt-5 rounded-[18px] border border-white/[0.05] bg-[#2a2a2a] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-[1.45rem] font-semibold tracking-[-0.02em] text-white">
              {project.title}
            </h3>
            <p className="mt-1 truncate text-xs text-[#8f96a3]">Freelancer: {project.freelancerName}</p>
          </div>
          <p className="shrink-0 text-[1.6rem] font-semibold text-[#facc15]">
            {maskCurrency(dueInstallment?.amount || project.remainingAmount, showAmounts)}
          </p>
        </div>

        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-[2rem] font-semibold leading-none tracking-[-0.03em] text-white">
              {maskCurrency(project.paidAmount, showAmounts)}
            </p>
            <p className="mt-2 text-xs text-[#8f96a3]">
              {maskCurrency(project.totalAmount, showAmounts)} total budget
            </p>
          </div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#8f96a3]">
            {project.paidPercentage}% funded • {project.paidInstallmentCount}/{project.totalInstallments} milestones completed
          </p>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-[#facc15] transition-[width]"
            style={{ width: `${Math.max(0, Math.min(project.paidPercentage, 100))}%` }}
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => onOpenProject(project.id)}
            className="inline-flex h-10 items-center justify-center rounded-[10px] bg-[#facc15] px-5 text-sm font-semibold text-[#141414] transition hover:bg-[#ffd84d]"
          >
            View Project
          </button>
          <button
            type="button"
            onClick={() =>
              dueInstallment &&
              onPay({
                id: releasePaymentId,
                projectId: project.id,
                projectTitle: project.title,
                installmentLabel: dueInstallment.label,
              })
            }
            disabled={!dueInstallment || isProcessingRelease}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-white/[0.08] px-5 text-sm font-semibold text-white transition hover:border-white/[0.14] hover:bg-white/[0.03] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isProcessingRelease ? <Loader2 className="size-4 animate-spin" /> : null}
            {dueInstallment ? "Release Milestone" : "No Milestone Due"}
          </button>
        </div>

        <div className="mt-6 border-t border-white/[0.06] pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8f96a3]">Payment Schedule</p>
          <div className="mt-3 space-y-2">
            {scheduleItems.map((installment, index) => {
              const statusDotClass = installment?.isPaid
                ? "bg-[#22c55e]"
                : installment?.isDue
                  ? "bg-[#facc15]"
                  : "bg-[#6b7280]";

              return (
                <div
                  key={`${project.id}-${installment?.sequence || index + 1}`}
                  className="flex items-center justify-between gap-3 rounded-[10px] border border-white/[0.05] bg-[#262626] px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={cn("size-2.5 rounded-full", statusDotClass)} />
                    <p className="truncate text-sm text-white">
                      {installment?.label || `Milestone ${installment?.sequence || index + 1}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">
                      {maskCurrency(Number(installment?.amount) || 0, showAmounts)}
                    </p>
                    <p className="text-[10px] text-[#8f96a3]">
                      {installment?.isPaid ? "Paid" : installment?.isDue ? "Due now" : "Upcoming"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProjectBillingCard = ({ project, showAmounts, onDownloadReceipt, onOpenProject }) => {
  const billingState = getProjectBillingState(project);
  const installments = Array.isArray(project.installments) ? project.installments.slice(0, 3) : [];
  const statusChipClass = project?.isFullyPaid
    ? "bg-[#0f3220] text-[#34d399]"
    : project?.nextDueInstallment
      ? "bg-[#3f2e0b] text-[#facc15]"
      : "bg-[#3a3328] text-[#f59e0b]";
  const activityDate = formatShortDate(project.updatedAt);

  return (
    <article className="h-full min-h-[700px] rounded-[22px] border border-white/[0.06] bg-[#2f2f30] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-[clamp(1.55rem,1.9vw,2rem)] font-semibold leading-none tracking-[-0.03em] text-white">
            {project.title}
          </h3>
          <p className="mt-1.5 truncate text-[0.9rem] text-[#9ca3af]">{project.freelancerName}</p>
        </div>
        <span
          className={cn("inline-flex shrink-0 rounded-[10px] px-3 py-1 text-xs font-semibold", statusChipClass)}
        >
          {billingState.label}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 text-[10px] uppercase tracking-[0.12em] text-[#8f96a3]">
        <div className="min-w-0 pr-3">
          <p>Total budget</p>
          <p className="mt-1 text-[1.35rem] font-semibold tracking-[-0.02em] normal-case text-white">
            {maskCurrency(project.totalAmount, showAmounts)}
          </p>
        </div>
        <div className="min-w-0 border-l border-white/[0.08] px-3">
          <p>Paid so far</p>
          <p className="mt-1 text-[1.35rem] font-semibold tracking-[-0.02em] normal-case text-white">
            {maskCurrency(project.paidAmount, showAmounts)}
          </p>
        </div>
        <div className="min-w-0 border-l border-white/[0.08] pl-3">
          <p>Remaining</p>
          <p className="mt-1 text-[1.35rem] font-semibold tracking-[-0.02em] normal-case text-white">
            {maskCurrency(project.remainingAmount, showAmounts)}
          </p>
        </div>
      </div>

      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#334155]">
        <div
          className="h-full rounded-full bg-[#facc15] transition-[width]"
          style={{ width: `${Math.max(0, Math.min(project.paidPercentage, 100))}%` }}
        />
      </div>
      <p className="mt-2 text-[0.9rem] text-[#9ca3af]">{project.paidPercentage}% funded</p>

      <div className="mt-5 space-y-2.5">
        {installments.map((installment, index) => (
          <div
            key={`${project.id}-${installment?.sequence || index + 1}`}
            className="flex items-center justify-between gap-3 text-[0.9rem]"
          >
            <div className="flex min-w-0 items-center gap-2.5 text-[#d4d4d8]">
              <span
                className={cn(
                  "size-2 rounded-full",
                  installment?.isPaid
                    ? "bg-[#22c55e]"
                    : installment?.isDue
                      ? "bg-[#facc15]"
                      : "bg-[#6b7280]",
                )}
              />
              <span className="truncate text-[0.9rem] text-[#d4d4d8]">
                {installment?.label || `Milestone ${installment?.sequence || index + 1}`}
              </span>
            </div>
            <span
              className={cn(
                "shrink-0 text-[0.9rem]",
                installment?.isPaid
                  ? "text-[#34d399]"
                  : installment?.isDue
                    ? "text-[#facc15]"
                    : "text-[#9ca3af]",
              )}
            >
              {installment?.isPaid ? "Paid" : installment?.isDue ? "Due" : "Upcoming"}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-6 text-[0.95rem] leading-7 text-[#e5e7eb]">
        {project.nextDueInstallment
          ? project.nextDueInstallment.dueLabel
          : "No payment is due right now. The next installment will unlock after the required phase is verified."}
      </p>
      <p className="mt-1 text-xs text-[#8f96a3]">Last billing activity on {activityDate}.</p>

      <div className="mt-6 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => onOpenProject(project.id)}
          className="inline-flex h-10 items-center justify-center rounded-full bg-[#facc15] px-7 text-[0.95rem] font-semibold text-[#141414] transition hover:bg-[#ffd84d]"
        >
          View project
        </button>
        <button
          type="button"
          onClick={() =>
            project.latestPaidReceipt
              ? onDownloadReceipt(project.latestPaidReceipt)
              : onOpenProject(project.id)
          }
          className="inline-flex items-center gap-1.5 text-[0.9rem] text-[#a1a1aa] transition hover:text-white"
        >
          <Download className="size-3.5" />
          {project.latestPaidReceipt ? "Latest receipt" : "Open details"}
        </button>
      </div>
    </article>
  );
};

const MonthlyPaymentsChart = ({ points, visible, compact = false }) => {
  const width = 320;
  const height = compact ? 145 : 190;
  const topPadding = compact ? 16 : 18;
  const rightPadding = 18;
  const bottomPadding = compact ? 22 : 30;
  const leftPadding = 18;
  const maxValue = Math.max(...points.map((point) => point.value), 0);
  const chartMax = maxValue > 0 ? Math.ceil(maxValue / 20000) * 20000 : 60000;
  const gridLevels = compact
    ? [chartMax, Math.round(chartMax * 0.5)]
    : [chartMax, Math.round(chartMax * 0.66), Math.round(chartMax * 0.33)];
  const usableWidth = width - leftPadding - rightPadding;
  const usableHeight = height - topPadding - bottomPadding;
  const pointCount = Math.max(points.length - 1, 1);
  const coordinates = points.map((point, index) => {
    const x = leftPadding + (usableWidth / pointCount) * index;
    const ratio = chartMax === 0 ? 0 : point.value / chartMax;
    const y = topPadding + usableHeight - usableHeight * ratio;
    return { ...point, x, y };
  });
  const pathData = coordinates
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const lastPoint = coordinates[coordinates.length - 1];

  return (
    <div className={cn("relative", compact ? "mt-4" : "mt-7")}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={cn(compact ? "h-[150px]" : "h-[220px]", "w-full overflow-visible")}
      >
        {gridLevels.map((level) => {
          const y =
            topPadding + usableHeight - usableHeight * (chartMax === 0 ? 0 : level / chartMax);

          return (
            <g key={level}>
              <line
                x1={leftPadding}
                x2={width - rightPadding}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
              />
              {!compact ? (
                <text x={leftPadding - 2} y={y - 6} fill="#7c828d" fontSize="10" textAnchor="start">
                  {visible ? formatCompactCurrency(level) : "Rs.--"}
                </text>
              ) : null}
            </g>
          );
        })}

        <path
          d={pathData}
          fill="none"
          stroke="#d4af16"
          strokeWidth={compact ? 3 : 4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {coordinates.map((point, index) => (
          <g key={point.key}>
            <circle cx={point.x} cy={point.y} r={index === coordinates.length - 1 ? 6 : 4} fill="#d4af16" />
            <text
              x={point.x}
              y={height - 6}
              fill="#8f96a3"
              fontSize={compact ? "10" : "11"}
              textAnchor="middle"
            >
              {point.shortLabel}
            </text>
          </g>
        ))}
      </svg>

      {lastPoint ? (
        <div
          className="pointer-events-none absolute rounded-[12px] bg-[#111214] px-3 py-2 shadow-[0_18px_35px_-28px_rgba(0,0,0,0.8)]"
          style={{
            left: `${(lastPoint.x / width) * 100}%`,
            top: `${(lastPoint.y / height) * 100}%`,
            transform: "translate(-76%, -115%)",
          }}
        >
          <p className="text-[10px] text-[#8f96a3]">{lastPoint.fullLabel}</p>
          <p className={cn(compact ? "text-sm" : "text-lg", "font-semibold text-white") }>
            {visible ? formatCurrency(lastPoint.value) : "Rs. --,--"}
          </p>
        </div>
      ) : null}
    </div>
  );
};

const PaymentsLoadingState = () => (
  <>
    <section className="mt-8 grid gap-4 md:grid-cols-3">
      {[1, 2, 3].map((item) => (
        <Skeleton key={item} className="h-[120px] rounded-[20px] bg-white/[0.04]" />
      ))}
    </section>

    <section className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.78fr)]">
      <Skeleton className="h-[440px] rounded-[24px] bg-white/[0.04]" />
      <Skeleton className="h-[440px] rounded-[24px] bg-white/[0.04]" />
    </section>

    <section className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.78fr)]">
      <Skeleton className="h-[430px] rounded-[24px] bg-white/[0.04]" />
      <Skeleton className="h-[270px] rounded-[24px] bg-white/[0.04]" />
    </section>
  </>
);

const EmptyPaymentsState = () => (
  <div className="mt-8 rounded-[24px] border border-dashed border-white/[0.08] bg-accent px-6 py-16 text-center">
    <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-white/[0.04] text-primary">
      <Wallet className="size-7" />
    </div>
    <h2 className="mt-6 text-2xl font-semibold text-white">No billing activity yet</h2>
    <p className="mx-auto mt-3 max-w-[32rem] text-sm text-[#8f96a3]">
      Once a project proposal is accepted and billing milestones are created, this dashboard will populate automatically.
    </p>
  </div>
);

const ClientPaymentsContent = () => {
  const navigate = useNavigate();
  const { user, authFetch, isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();
  const projectBillingCarouselRef = React.useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [processingInvoiceId, setProcessingInvoiceId] = useState(null);
  const [showAmounts] = useState(true);

  const loadProjects = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const response = await authFetch("/projects");
      const payload = await response.json().catch(() => null);
      setProjects(Array.isArray(payload?.data) ? payload.data : []);
    } catch (error) {
      console.error("Failed to load client billing projects", error);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [authFetch, isAuthenticated]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const billingProjects = useMemo(() => {
    return projects
      .map((project) => {
        const acceptedProposal = getAcceptedProposal(project);
        const paymentPlan =
          project?.paymentPlan && typeof project.paymentPlan === "object"
            ? project.paymentPlan
            : null;

        if (!acceptedProposal || !paymentPlan) return null;

        const installments = Array.isArray(paymentPlan.installments)
          ? paymentPlan.installments
          : [];
        const projectStatus = String(project?.status || "").toUpperCase();
        const freelancerName =
          acceptedProposal?.freelancer?.fullName ||
          acceptedProposal?.freelancer?.name ||
          acceptedProposal?.freelancerName ||
          "Assigned Freelancer";
        const paidInstallmentCount = installments.filter((installment) =>
          Boolean(installment?.isPaid),
        ).length;
        const latestPaidInstallment =
          [...installments].reverse().find((installment) => installment?.isPaid) || null;

        return {
          id: project.id,
          title: project?.title || "Untitled Project",
          updatedAt: project?.updatedAt || project?.createdAt,
          createdAt: project?.createdAt,
          freelancerName,
          totalAmount: Number(paymentPlan.totalAmount) || 0,
          paidAmount: Number(paymentPlan.paidAmount) || 0,
          remainingAmount: Number(paymentPlan.remainingAmount) || 0,
          paidPercentage: Number(paymentPlan.paidPercentage) || 0,
          escrowProtected:
            projectStatus === "COMPLETED" ? 0 : Number(paymentPlan.paidAmount) || 0,
          installments,
          nextDueInstallment: paymentPlan.nextDueInstallment || null,
          paidInstallmentCount,
          totalInstallments: installments.length,
          isFullyPaid: Boolean(paymentPlan.isFullyPaid),
          latestPaidReceipt: latestPaidInstallment
            ? {
                id: `${project.id}-${latestPaidInstallment.sequence}`,
                projectId: project.id,
                projectTitle: project?.title || "Untitled Project",
                freelancerName,
                installmentLabel:
                  latestPaidInstallment.label ||
                  `Milestone ${latestPaidInstallment.sequence || paidInstallmentCount}`,
                issuedAt: project?.updatedAt || project?.createdAt,
                amountDue: Number(latestPaidInstallment.amount) || 0,
                amountPaid: Number(latestPaidInstallment.amount) || 0,
                escrowHeld:
                  projectStatus === "COMPLETED"
                    ? 0
                    : Number(latestPaidInstallment.amount) || 0,
                statusLabel: "Paid",
                isPaid: true,
                isDue: false,
              }
            : null,
        };
      })
      .filter(Boolean)
      .sort((left, right) => {
        const dueDelta =
          Number(Boolean(right?.nextDueInstallment)) - Number(Boolean(left?.nextDueInstallment));
        if (dueDelta !== 0) return dueDelta;

        const fullyPaidDelta = Number(left?.isFullyPaid) - Number(right?.isFullyPaid);
        if (fullyPaidDelta !== 0) return fullyPaidDelta;

        return (
          new Date(right?.updatedAt || 0).getTime() -
          new Date(left?.updatedAt || 0).getTime()
        );
      });
  }, [projects]);

  const paymentRows = useMemo(() => {
    return billingProjects
      .flatMap((project) =>
        project.installments.map((installment, index) => {
          const amountValue = Number(installment?.amount) || 0;
          const isPaid = Boolean(installment?.isPaid);
          const isDue = Boolean(installment?.isDue);

          return {
            id: `${project.id}-${installment?.sequence || index + 1}`,
            projectId: project.id,
            projectTitle: project.title,
            freelancerName: project.freelancerName,
            installmentLabel:
              installment?.label || `Milestone ${installment?.sequence || index + 1}`,
            issuedAt: project.updatedAt || project.createdAt,
            amountDue: amountValue,
            amountPaid: isPaid ? amountValue : 0,
            escrowHeld: isPaid ? Math.min(project.escrowProtected, amountValue) : 0,
            statusLabel: isPaid ? "Paid" : isDue ? "Pending" : "Scheduled",
            isPaid,
            isDue,
          };
        }),
      )
      .sort((left, right) => {
        const dueDelta = Number(right.isDue) - Number(left.isDue);
        if (dueDelta !== 0) return dueDelta;

        const paidDelta = Number(right.isPaid) - Number(left.isPaid);
        if (paidDelta !== 0) return paidDelta;

        return (
          new Date(right.issuedAt || 0).getTime() - new Date(left.issuedAt || 0).getTime()
        );
      });
  }, [billingProjects]);

  const summary = useMemo(() => {
    const now = new Date();

    return billingProjects.reduce(
      (accumulator, project) => {
        accumulator.totalBudgeted += project.totalAmount;
        accumulator.paidSoFar += project.paidAmount;
        accumulator.dueNow += Number(project.nextDueInstallment?.amount) || 0;
        accumulator.escrowProtected += project.escrowProtected;
        accumulator.remainingBudget += project.remainingAmount;
        accumulator.projectsAwaitingAction += project.nextDueInstallment ? 1 : 0;

        const updatedAt = project.updatedAt ? new Date(project.updatedAt) : null;
        if (
          updatedAt &&
          !Number.isNaN(updatedAt.getTime()) &&
          updatedAt.getMonth() === now.getMonth() &&
          updatedAt.getFullYear() === now.getFullYear()
        ) {
          accumulator.thisMonthSpent += project.paidAmount;
        }

        return accumulator;
      },
      {
        totalBudgeted: 0,
        paidSoFar: 0,
        dueNow: 0,
        escrowProtected: 0,
        remainingBudget: 0,
        projectsAwaitingAction: 0,
        thisMonthSpent: 0,
      },
    );
  }, [billingProjects]);

  const monthlySeries = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 3 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (2 - index), 1);

      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        shortLabel: formatMonthLabel(date, "short"),
        fullLabel: formatMonthLabel(date, "long"),
        value: 0,
      };
    });

    const monthMap = new Map(months.map((month) => [month.key, month]));

    paymentRows.forEach((row) => {
      if (!row.isPaid) return;

      const issuedAt = row.issuedAt ? new Date(row.issuedAt) : null;
      if (!issuedAt || Number.isNaN(issuedAt.getTime())) return;

      const key = `${issuedAt.getFullYear()}-${issuedAt.getMonth()}`;
      const bucket = monthMap.get(key);
      if (bucket) {
        bucket.value += row.amountPaid;
      }
    });

    return months;
  }, [paymentRows]);

  const nextDueInvoice = useMemo(
    () => paymentRows.find((row) => row.isDue) || null,
    [paymentRows],
  );

  const nextDueProject = useMemo(
    () =>
      billingProjects.find((project) => project.nextDueInstallment) ||
      billingProjects.find((project) => !project.isFullyPaid) ||
      null,
    [billingProjects],
  );

  const recentTransactions = useMemo(() => paymentRows.slice(0, 4), [paymentRows]);

  const recentReceipts = useMemo(
    () => paymentRows.filter((row) => row.isPaid).slice(0, 4),
    [paymentRows],
  );

  const latestPaidInvoice = recentReceipts[0] || null;

  const billingTools = useMemo(
    () => [
      {
        id: "portal",
        label: "Saved payment methods",
        subtitle: "Manage cards and billing preferences from the secure customer portal.",
        icon: CreditCard,
        onClick: "portal",
        disabled: false,
      },
      {
        id: "receipts",
        label: "Receipts & invoices",
        subtitle: latestPaidInvoice
          ? "Download your most recent billing receipt instantly."
          : "Receipts will appear here after your first completed installment.",
        icon: FileText,
        onClick: "latest-receipt",
        disabled: !latestPaidInvoice,
      },
      {
        id: "escrow",
        label: "Escrow protection",
        subtitle: "Catalance keeps paid project funds protected until verified delivery milestones are cleared.",
        icon: Landmark,
        onClick: "info",
        disabled: false,
      },
      {
        id: "support",
        label: "Billing support",
        subtitle: "Open the billing hub to update methods or review payment help when it is connected.",
        icon: ShieldCheck,
        onClick: "portal",
        disabled: false,
      },
    ],
    [latestPaidInvoice],
  );

  const handleOpenCustomerPortal = async () => {
    setPortalLoading(true);
    try {
      const response = await authFetch("/payments/customer-portal", { method: "POST" });
      const payload = await response.json().catch(() => null);
      const portalUrl = payload?.data?.url || payload?.url;

      if (response.ok && portalUrl) {
        window.open(portalUrl, "_blank", "noopener,noreferrer");
        return;
      }

      toast.info(
        "Customer portal endpoint is not wired yet. Integrate Stripe portal URL to enable it.",
      );
    } catch (error) {
      console.error("Failed to open billing portal", error);
      toast.info(
        "Customer portal endpoint is not wired yet. Integrate Stripe portal URL to enable it.",
      );
    } finally {
      setPortalLoading(false);
    }
  };

  const handlePayInstallment = async (invoice) => {
    if (!invoice?.projectId) return;

    setProcessingInvoiceId(invoice.id);
    try {
      const paymentResult = await processProjectInstallmentPayment({
        authFetch,
        projectId: invoice.projectId,
        description: `${invoice.installmentLabel} for ${invoice.projectTitle}`,
      });

      toast.success(paymentResult?.message || "Payment completed successfully.");
      await loadProjects();
    } catch (error) {
      console.error("Failed to process installment payment", error);
      toast.error(error?.message || "Failed to process payment");
    } finally {
      setProcessingInvoiceId(null);
    }
  };

  const handleOpenProject = useCallback(
    (projectId) => {
      if (!projectId) return;
      navigate(`/client/project/${projectId}`);
    },
    [navigate],
  );

  const handleProjectBillingCarouselScroll = useCallback((direction) => {
    const container = projectBillingCarouselRef.current;
    if (!container) return;

    const firstCard = container.querySelector("[data-project-billing-card='true']");
    const cardWidth = firstCard?.getBoundingClientRect().width || container.clientWidth * 0.9;
    const gap = 16;

    container.scrollBy({
      left: (cardWidth + gap) * direction,
      behavior: "smooth",
    });
  }, []);

  const handleMethodAction = async (action) => {
    if (action === "portal") {
      await handleOpenCustomerPortal();
      return;
    }

    if (action === "latest-receipt") {
      if (latestPaidInvoice) {
        downloadReceipt(latestPaidInvoice);
        return;
      }

      toast.info("Your latest receipt will appear here after the first completed payment.");
      return;
    }

    toast.info(
      "Client funds stay protected in escrow until verified milestones are cleared.",
    );
  };

  const headerDisplayName = useMemo(() => getDisplayName(user), [user]);

  return (
    <div className="min-h-screen bg-[#212121] text-[#f1f5f9]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1536px] flex-col px-4 pt-5 sm:px-6 lg:px-[40px] xl:w-[90%] xl:max-w-none">
        <ClientWorkspaceHeader
          profile={{
            avatar: user?.avatar,
            name: headerDisplayName,
            initial: getInitials(headerDisplayName),
          }}
          activeWorkspaceKey="payments"
          unreadCount={unreadCount}
        />

        <main className="flex-1 pb-12">
          <section className="mt-14 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.05em] text-white">
                Financial Overview
              </h1>
              <p className="mt-2 text-sm text-[#94a3b8]">
                Manage your freelance earnings and project milestones.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (nextDueInvoice) {
                  void handlePayInstallment(nextDueInvoice);
                  return;
                }

                if (nextDueProject) {
                  handleOpenProject(nextDueProject.id);
                  return;
                }

                void handleOpenCustomerPortal();
              }}
              disabled={Boolean(nextDueInvoice && processingInvoiceId === nextDueInvoice.id)}
              className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-[10px] bg-[#facc15] px-5 text-sm font-semibold text-[#141414] transition hover:bg-[#ffd84d] disabled:cursor-not-allowed disabled:opacity-60 lg:self-auto"
            >
              {nextDueInvoice && processingInvoiceId === nextDueInvoice.id ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Approve Payment
            </button>
          </section>

          {isLoading ? (
            <PaymentsLoadingState />
          ) : billingProjects.length === 0 ? (
            <EmptyPaymentsState />
          ) : (
            <>
              <section className="mt-6 grid gap-4 md:grid-cols-3">
                <PaymentSummaryCard
                  label="Total Budget"
                  value={summary.totalBudgeted}
                  visible={showAmounts}
                  icon={Wallet}
                  helper={`Across ${billingProjects.length} active project${billingProjects.length === 1 ? "" : "s"}`}
                />
                <PaymentSummaryCard
                  label="Paid So Far"
                  value={summary.paidSoFar}
                  visible={showAmounts}
                  icon={ShieldCheck}
                  helper={`${maskCurrency(summary.escrowProtected, showAmounts)} in escrow`}
                />
                <PaymentSummaryCard
                  label="Remaining Budget"
                  value={summary.remainingBudget}
                  visible={showAmounts}
                  icon={Landmark}
                  helper={
                    summary.dueNow > 0
                      ? `${maskCurrency(summary.dueNow, showAmounts)} pending milestone approval`
                      : "No pending milestone approval"
                  }
                />
              </section>

              <section className="mt-7 grid items-stretch gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.78fr)]">
                <div className="flex h-full flex-col gap-6">
                  <ActiveProjectPaymentsPanel
                    project={nextDueProject}
                    showAmounts={showAmounts}
                    processingInvoiceId={processingInvoiceId}
                    onPay={handlePayInstallment}
                    onOpenProject={handleOpenProject}
                    onOpenProjects={() => navigate("/client/project")}
                    onOpenProposals={() => navigate("/client/proposal")}
                  />

                  <div className="flex-1 rounded-[24px] border border-white/[0.05] bg-accent p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h2 className="text-[2rem] font-semibold tracking-[-0.03em] text-white">Project billing</h2>
                        <p className="mt-2 text-sm text-[#8f96a3]">
                          Each accepted project keeps its own payment schedule, receipts, and funding progress.
                        </p>
                      </div>

                      {billingProjects.length > 1 ? (
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleProjectBillingCarouselScroll(-1)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-transparent text-[#cbd5e1] transition hover:border-white/[0.14] hover:bg-white/[0.03] hover:text-white"
                            aria-label="Previous project billing cards"
                          >
                            <ChevronLeft className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleProjectBillingCarouselScroll(1)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-transparent text-[#cbd5e1] transition hover:border-white/[0.14] hover:bg-white/[0.03] hover:text-white"
                            aria-label="Next project billing cards"
                          >
                            <ChevronRight className="size-4" />
                          </button>
                        </div>
                      ) : null}
                    </div>

                    <div
                      ref={projectBillingCarouselRef}
                      className="mt-5 flex items-start snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden pb-0 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                      {billingProjects.map((project) => (
                        <div
                          key={project.id}
                          data-project-billing-card="true"
                          className="h-full w-[92%] shrink-0 snap-start sm:w-[78%] md:w-[calc((100%-1rem)/2)]"
                        >
                          <ProjectBillingCard
                            project={project}
                            showAmounts={showAmounts}
                            onDownloadReceipt={downloadReceipt}
                            onOpenProject={handleOpenProject}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-[24px] border border-white/[0.05] bg-accent p-5">
                    <h2 className="text-[1.8rem] font-semibold tracking-[-0.03em] text-white">
                      Recent Transactions
                    </h2>

                    <div className="mt-4">
                      {recentTransactions.length > 0 ? (
                        recentTransactions.map((transaction) => (
                          <TransactionRow
                            key={transaction.id}
                            transaction={transaction}
                            visible={showAmounts}
                            onOpenProject={handleOpenProject}
                          />
                        ))
                      ) : (
                        <p className="rounded-[12px] border border-white/[0.05] bg-[#262626] px-3 py-4 text-sm text-[#8f96a3]">
                          Transactions will appear here after your first payment.
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (recentTransactions[0]?.projectId) {
                          handleOpenProject(recentTransactions[0].projectId);
                        }
                      }}
                      className="mt-3 inline-flex items-center gap-1 text-sm text-[#8f96a3] transition hover:text-white"
                    >
                      View all
                      <ArrowRight className="size-3.5" />
                    </button>
                  </div>

                  <div className="rounded-[24px] border border-white/[0.05] bg-accent p-5">
                    <h2 className="text-[1.8rem] font-semibold tracking-[-0.03em] text-white">Billing tools</h2>
                    <p className="mt-1 text-sm text-[#8f96a3]">
                      Quick access to payment methods, receipts, and escrow visibility.
                    </p>

                    <div className="mt-5 space-y-3">
                      {billingTools.map((method) => (
                        <BillingToolRow
                          key={method.id}
                          label={method.label}
                          subtitle={method.subtitle}
                          icon={method.icon}
                          loading={portalLoading && method.onClick === "portal"}
                          disabled={portalLoading || method.disabled}
                          onClick={() => {
                            void handleMethodAction(method.onClick);
                          }}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleOpenCustomerPortal()}
                      disabled={portalLoading}
                      className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-[12px] border border-white/[0.05] text-sm text-[#a1a1aa] transition hover:border-white/[0.1] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Plus className="size-4 text-primary" />
                      Open billing portal
                    </button>
                  </div>

                  <div className="rounded-[24px] border border-white/[0.05] bg-accent p-5">
                    <h2 className="text-[1.8rem] font-semibold tracking-[-0.03em] text-white">Monthly spend</h2>
                    <p className="mt-1 text-xs text-[#8f96a3]">
                      A simple view of your funded project budget movement.
                    </p>

                    <MonthlyPaymentsChart points={monthlySeries} visible={showAmounts} compact />
                  </div>
                </div>
              </section>
            </>
          )}
        </main>

        <ClientDashboardFooter variant="workspace" />
      </div>
    </div>
  );
};

const ClientPayments = () => <ClientPaymentsContent />;

export default ClientPayments;
