"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import Download from "lucide-react/dist/esm/icons/download";
import Eye from "lucide-react/dist/esm/icons/eye";
import EyeOff from "lucide-react/dist/esm/icons/eye-off";
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
  kind = "currency",
  tone = "default",
}) => (
  <div className="rounded-[28px] border border-white/[0.05] bg-accent px-6 py-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8f96a3]">{label}</p>
    <p
      className={cn(
        "mt-4 text-[clamp(2rem,3vw,3rem)] font-bold tracking-[-0.9px]",
        tone === "success"
          ? "text-[#22c55e]"
          : tone === "warning"
            ? "text-[#ffc107]"
            : "text-[#f8fafc]",
      )}
    >
      {kind === "currency" ? maskCurrency(value, visible) : value}
    </p>
    {helper ? <p className="mt-3 text-xs text-[#7c828d]">{helper}</p> : null}
  </div>
);

const BillingInsight = ({
  label,
  value,
  hint,
  visible,
  tone = "default",
  kind = "currency",
}) => (
  <div className="space-y-3 lg:border-r lg:border-white/[0.05] lg:pr-8 last:lg:border-r-0 last:lg:pr-0">
    <p className="text-sm text-[#a1a1aa]">{label}</p>
    <p
      className={cn(
        "text-[clamp(1.8rem,3vw,2.6rem)] font-bold tracking-[-0.8px]",
        tone === "success"
          ? "text-[#22c55e]"
          : tone === "warning"
            ? "text-[#ffc107]"
            : "text-[#f8fafc]",
      )}
    >
      {kind === "currency" ? maskCurrency(value, visible) : value}
    </p>
    <p className="text-xs text-[#7c828d]">{hint}</p>
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
    className="group flex w-full items-center gap-4 rounded-[20px] border border-white/[0.05] bg-white/[0.01] px-4 py-4 text-left transition hover:border-white/[0.08] hover:bg-white/[0.02] disabled:cursor-not-allowed disabled:opacity-60"
  >
    <div className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-[#171717] text-[#e5e7eb]">
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4.5" />}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[1rem] font-medium text-[#f8fafc]">{label}</p>
      <p className="mt-0.5 text-sm text-[#8f96a3]">{subtitle}</p>
    </div>
    <ArrowRight className="size-4.5 text-[#8f96a3] transition group-hover:text-white" />
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

const InstallmentChip = ({ installment }) => {
  const classes = installment?.isPaid
    ? "border-[#22c55e]/15 bg-[#22c55e]/10 text-[#86efac]"
    : installment?.isDue
      ? "border-[#ffc107]/15 bg-[#ffc107]/10 text-[#ffd54f]"
      : "border-white/[0.08] bg-white/[0.03] text-[#a1a1aa]";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium",
        classes,
      )}
    >
      <span className="max-w-[11rem] truncate">{installment?.label || "Milestone"}</span>
      <span className="text-[11px] opacity-80">
        {installment?.isPaid ? "Paid" : installment?.isDue ? "Due" : "Upcoming"}
      </span>
    </div>
  );
};

const ReceiptRow = ({ receipt, visible, onDownloadReceipt, onOpenProject }) => (
  <div className="rounded-[22px] border border-white/[0.05] bg-[#171717] px-4 py-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">{receipt.installmentLabel}</p>
        <p className="mt-1 truncate text-xs text-[#8f96a3]">
          {receipt.projectTitle} • {receipt.freelancerName}
        </p>
      </div>
      <p className="shrink-0 text-sm font-semibold text-white">
        {maskCurrency(receipt.amountPaid, visible)}
      </p>
    </div>

    <div className="mt-4 flex items-center justify-between gap-3 text-xs text-[#8f96a3]">
      <span>{formatShortDate(receipt.issuedAt)}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onDownloadReceipt(receipt)}
          className="inline-flex items-center gap-1 text-[#cbd5e1] transition hover:text-white"
        >
          <Download className="size-3.5" />
          Receipt
        </button>
        <button
          type="button"
          onClick={() => onOpenProject(receipt.projectId)}
          className="inline-flex items-center gap-1 text-primary transition hover:text-[#ffd54f]"
        >
          <FolderOpen className="size-3.5" />
          Project
        </button>
      </div>
    </div>
  </div>
);

const ProjectBillingCard = ({
  project,
  showAmounts,
  processingInvoiceId,
  onPay,
  onDownloadReceipt,
  onOpenProject,
}) => {
  const billingState = getProjectBillingState(project);
  const nextDuePaymentId = project?.nextDueInstallment
    ? `${project.id}-${project.nextDueInstallment.sequence}`
    : null;

  return (
    <article className="flex h-full flex-col rounded-[28px] border border-white/[0.06] bg-[#171717] p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8f96a3]">
            Client billing
          </p>
          <h3 className="mt-3 truncate text-[1.85rem] font-semibold tracking-[-0.6px] text-white">
            {project.title}
          </h3>
          <p className="mt-2 truncate text-sm text-[#94a3b8]">{project.freelancerName}</p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold",
            billingState.className,
          )}
        >
          {billingState.label}
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[18px] border border-white/[0.05] bg-white/[0.02] px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#8f96a3]">Total budget</p>
          <p className="mt-3 text-xl font-semibold text-white">
            {maskCurrency(project.totalAmount, showAmounts)}
          </p>
        </div>
        <div className="rounded-[18px] border border-white/[0.05] bg-white/[0.02] px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#8f96a3]">Paid so far</p>
          <p className="mt-3 text-xl font-semibold text-white">
            {maskCurrency(project.paidAmount, showAmounts)}
          </p>
        </div>
        <div className="rounded-[18px] border border-white/[0.05] bg-white/[0.02] px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#8f96a3]">Remaining</p>
          <p className="mt-3 text-xl font-semibold text-white">
            {maskCurrency(project.remainingAmount, showAmounts)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 text-sm text-[#a1a1aa]">
        <span>{project.paidPercentage}% funded</span>
        <span>
          {project.paidInstallmentCount}/{project.totalInstallments} installments cleared
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-[#ffc107] transition-[width]"
          style={{ width: `${Math.max(0, Math.min(project.paidPercentage, 100))}%` }}
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {project.installments.map((installment) => (
          <InstallmentChip
            key={`${project.id}-${installment.sequence}`}
            installment={installment}
          />
        ))}
      </div>

      <div className="mt-5 rounded-[20px] border border-white/[0.05] bg-white/[0.02] px-4 py-4">
        <p className="text-sm font-medium text-white">
          {project.nextDueInstallment
            ? `${project.nextDueInstallment.label} is ready to be paid.`
            : project.isFullyPaid
              ? "All scheduled client payments are complete."
              : "No payment is due right now. The next installment will unlock after the required phase is verified."}
        </p>
        <p className="mt-1 text-xs leading-5 text-[#8f96a3]">
          {project.nextDueInstallment
            ? project.nextDueInstallment.dueLabel
            : `Last billing activity on ${formatShortDate(project.updatedAt)}.`}
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        {project.nextDueInstallment ? (
          <button
            type="button"
            onClick={() =>
              onPay({
                id: nextDuePaymentId,
                projectId: project.id,
                projectTitle: project.title,
                installmentLabel: project.nextDueInstallment.label,
              })
            }
            disabled={processingInvoiceId === nextDuePaymentId}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[16px] bg-[#ffc107] px-5 text-sm font-bold text-[#141414] transition hover:bg-[#ffd54f] disabled:cursor-not-allowed disabled:bg-[#ffc107]/60"
          >
            {processingInvoiceId === nextDuePaymentId ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CreditCard className="size-4" />
            )}
            Pay now
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onOpenProject(project.id)}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[16px] bg-[#ffc107] px-5 text-sm font-bold text-[#141414] transition hover:bg-[#ffd54f]"
          >
            <FolderOpen className="size-4" />
            View project
          </button>
        )}

        {project.latestPaidReceipt ? (
          <button
            type="button"
            onClick={() => onDownloadReceipt(project.latestPaidReceipt)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[16px] border border-white/[0.06] px-5 text-sm font-semibold text-white transition hover:border-white/[0.1] hover:bg-white/[0.02]"
          >
            <Download className="size-4" />
            Latest receipt
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onOpenProject(project.id)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[16px] border border-white/[0.06] px-5 text-sm font-semibold text-white transition hover:border-white/[0.1] hover:bg-white/[0.02]"
          >
            <ArrowRight className="size-4" />
            Open details
          </button>
        )}
      </div>
    </article>
  );
};

const MonthlyPaymentsChart = ({ points, visible }) => {
  const width = 320;
  const height = 190;
  const topPadding = 18;
  const rightPadding = 18;
  const bottomPadding = 30;
  const leftPadding = 18;
  const maxValue = Math.max(...points.map((point) => point.value), 0);
  const chartMax = maxValue > 0 ? Math.ceil(maxValue / 20000) * 20000 : 60000;
  const gridLevels = [chartMax, Math.round(chartMax * 0.66), Math.round(chartMax * 0.33)];
  const usableWidth = width - leftPadding - rightPadding;
  const usableHeight = height - topPadding - bottomPadding;
  const pointCount = Math.max(points.length - 1, 1);
  const coordinates = points.map((point, index) => {
    const x = leftPadding + (usableWidth / pointCount) * index;
    const ratio = chartMax === 0 ? 0 : point.value / chartMax;
    const y = topPadding + usableHeight - usableHeight * ratio;
    return { ...point, x, y };
  });
  const pathData = coordinates.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const lastPoint = coordinates[coordinates.length - 1];

  return (
    <div className="relative mt-7">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[220px] w-full overflow-visible">
        {gridLevels.map((level) => {
          const y = topPadding + usableHeight - usableHeight * (chartMax === 0 ? 0 : level / chartMax);

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
              <text x={leftPadding - 2} y={y - 6} fill="#7c828d" fontSize="10" textAnchor="start">
                {visible ? formatCompactCurrency(level) : "Rs.--"}
              </text>
            </g>
          );
        })}
        <path
          d={pathData}
          fill="none"
          stroke="#d4af16"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {coordinates.map((point, index) => (
          <g key={point.key}>
            <circle cx={point.x} cy={point.y} r={index === coordinates.length - 1 ? 7 : 4.5} fill="#d4af16" />
            <text x={point.x} y={height - 8} fill="#8f96a3" fontSize="11" textAnchor="middle">
              {point.shortLabel}
            </text>
          </g>
        ))}
      </svg>

      {lastPoint ? (
        <div
          className="pointer-events-none absolute rounded-[14px] bg-[#0f0f10] px-3 py-2 shadow-[0_18px_35px_-28px_rgba(0,0,0,0.8)]"
          style={{
            left: `${(lastPoint.x / width) * 100}%`,
            top: `${(lastPoint.y / height) * 100}%`,
            transform: "translate(-78%, -110%)",
          }}
        >
          <p className="text-[10px] text-[#8f96a3]">{lastPoint.fullLabel}</p>
          <p className="text-lg font-bold text-white">
            {visible ? formatCurrency(lastPoint.value) : "Rs. --,--"}
          </p>
        </div>
      ) : null}
    </div>
  );
};

const PaymentsLoadingState = () => (
  <>
    <section className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {[1, 2, 3, 4].map((item) => (
        <Skeleton key={item} className="h-[118px] rounded-[28px] bg-white/[0.04]" />
      ))}
    </section>

    <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,0.8fr)]">
      <Skeleton className="h-[308px] rounded-[32px] bg-white/[0.04]" />
      <Skeleton className="h-[308px] rounded-[32px] bg-white/[0.04]" />
    </section>

    <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,0.8fr)]">
      <Skeleton className="h-[360px] rounded-[32px] bg-white/[0.04]" />
      <Skeleton className="h-[360px] rounded-[32px] bg-white/[0.04]" />
    </section>
  </>
);

const EmptyPaymentsState = () => (
  <div className="mt-12 rounded-[32px] border border-dashed border-white/[0.08] bg-accent px-6 py-16 text-center">
    <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-white/[0.04] text-primary">
      <Wallet className="size-7" />
    </div>
    <h2 className="mt-6 text-2xl font-semibold text-white">No client billing activity yet</h2>
    <p className="mx-auto mt-3 max-w-[32rem] text-sm text-[#8f96a3]">
      Once you accept a proposal and a payment plan is available, your project funding, due installments,
      and receipts will appear here.
    </p>
  </div>
);

const ClientPaymentsContent = () => {
  const navigate = useNavigate();
  const { user, authFetch, isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();
  const [isLoading, setIsLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [processingInvoiceId, setProcessingInvoiceId] = useState(null);
  const [showAmounts, setShowAmounts] = useState(true);

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
  const paidCoverage =
    summary.totalBudgeted > 0
      ? Math.round((summary.paidSoFar / summary.totalBudgeted) * 100)
      : 0;

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
          <section className="mt-14">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-[-0.75px] text-[#f8fafc]">
                  Payments
                </h1>
                <p className="mt-2 max-w-[38rem] text-sm text-[#94a3b8]">
                  Review project funding, pay due installments, and keep receipts and escrow visibility in one place.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAmounts((previous) => !previous)}
                className="inline-flex h-11 items-center gap-2 self-start rounded-[14px] border border-white/[0.06] bg-transparent px-4 text-sm font-medium text-white transition hover:border-white/[0.1] hover:bg-white/[0.02] lg:self-auto"
              >
                {showAmounts ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                {showAmounts ? "Hide" : "Show"}
              </button>
            </div>
          </section>

          {isLoading ? (
            <PaymentsLoadingState />
          ) : billingProjects.length === 0 ? (
            <EmptyPaymentsState />
          ) : (
            <>
              <section className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <PaymentSummaryCard
                  label="Total Budgeted"
                  value={summary.totalBudgeted}
                  visible={showAmounts}
                  helper={`${billingProjects.length} project${billingProjects.length === 1 ? "" : "s"} under billing`}
                />
                <PaymentSummaryCard
                  label="Paid So Far"
                  value={summary.paidSoFar}
                  visible={showAmounts}
                  helper={`${paidCoverage}% of committed project budget funded`}
                />
                <PaymentSummaryCard
                  label="Due Now"
                  value={summary.dueNow}
                  visible={showAmounts}
                  tone="warning"
                  helper={
                    summary.projectsAwaitingAction > 0
                      ? `${summary.projectsAwaitingAction} project${summary.projectsAwaitingAction === 1 ? "" : "s"} waiting on payment`
                      : "No immediate payment action needed"
                  }
                />
                <PaymentSummaryCard
                  label="Protected in Escrow"
                  value={summary.escrowProtected}
                  visible={showAmounts}
                  helper="Held securely until delivery checkpoints are verified"
                />
              </section>

              <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.82fr)]">
                <div className="rounded-[32px] border border-white/[0.05] bg-accent px-8 py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-[40rem]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8f96a3]">
                        Billing focus
                      </p>
                      <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.65px] text-[#f8fafc]">
                        {nextDueInvoice ? "Next payment ready to fund" : "You are caught up on current payments"}
                      </h2>
                      <p className="mt-2 text-sm text-[#8f96a3]">
                        {nextDueInvoice
                          ? "Stay ahead of milestone gates by clearing the next due installment directly from this section."
                          : "All unlocked installments are settled right now. Keep an eye on project progress and upcoming receipts here."}
                      </p>
                    </div>

                    <div className="rounded-[24px] border border-white/[0.05] bg-[#171717] px-5 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8f96a3]">
                        Immediate action
                      </p>
                      <p className="mt-3 text-[1.9rem] font-semibold tracking-[-0.55px] text-white">
                        {maskCurrency(summary.dueNow, showAmounts)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-10 grid gap-8 lg:grid-cols-3">
                    <BillingInsight
                      label="Remaining budget"
                      value={summary.remainingBudget}
                      visible={showAmounts}
                      hint="The part of your accepted project budgets that has not been funded yet."
                    />
                    <BillingInsight
                      label="Projects awaiting payment"
                      value={String(summary.projectsAwaitingAction)}
                      visible
                      kind="text"
                      tone={summary.projectsAwaitingAction > 0 ? "warning" : "default"}
                      hint="Projects with an unlocked installment waiting on your approval."
                    />
                    <BillingInsight
                      label="This month funded"
                      value={summary.thisMonthSpent}
                      visible={showAmounts}
                      tone="success"
                      hint="Billing activity recorded during the current calendar month."
                    />
                  </div>

                  <div className="mt-10 rounded-[28px] border border-white/[0.05] bg-[#171717] p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8f96a3]">
                          {nextDueProject?.nextDueInstallment ? "Project awaiting payment" : "Billing status"}
                        </p>
                        <h3 className="mt-3 truncate text-[1.8rem] font-semibold tracking-[-0.55px] text-white">
                          {nextDueProject?.title || "No active project selected"}
                        </h3>
                        <p className="mt-2 truncate text-sm text-[#94a3b8]">
                          {nextDueProject?.freelancerName || "Assigned freelancer"}
                        </p>
                      </div>

                      {nextDueProject?.nextDueInstallment ? (
                        <div className="rounded-[20px] border border-[#ffc107]/15 bg-[#ffc107]/10 px-4 py-3 text-right">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ffd54f]">
                            Due installment
                          </p>
                          <p className="mt-2 text-xl font-semibold text-white">
                            {maskCurrency(nextDueProject.nextDueInstallment.amount, showAmounts)}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <p className="mt-5 text-sm leading-6 text-[#8f96a3]">
                      {nextDueProject?.nextDueInstallment
                        ? nextDueProject.nextDueInstallment.dueLabel
                        : nextDueProject
                          ? "No installment is due right now. The next payment will unlock automatically when the matching project phase is verified."
                          : "Accepted projects with payment plans will surface here once billing becomes active."}
                    </p>

                    {nextDueProject ? (
                      <>
                        <div className="mt-6 flex items-center justify-between gap-3 text-sm text-[#a1a1aa]">
                          <span>{nextDueProject.paidPercentage}% funded</span>
                          <span>
                            {nextDueProject.paidInstallmentCount}/{nextDueProject.totalInstallments} installments cleared
                          </span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                          <div
                            className="h-full rounded-full bg-[#ffc107] transition-[width]"
                            style={{
                              width: `${Math.max(0, Math.min(nextDueProject.paidPercentage, 100))}%`,
                            }}
                          />
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          {nextDueProject.installments.map((installment) => (
                            <InstallmentChip
                              key={`${nextDueProject.id}-${installment.sequence}`}
                              installment={installment}
                            />
                          ))}
                        </div>
                      </>
                    ) : null}

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
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
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-[16px] bg-[#ffc107] px-6 text-sm font-bold text-[#141414] transition hover:bg-[#ffd54f] disabled:cursor-not-allowed disabled:bg-[#ffc107]/60"
                      >
                        {nextDueInvoice && processingInvoiceId === nextDueInvoice.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : nextDueInvoice ? (
                          <CreditCard className="size-4" />
                        ) : (
                          <FolderOpen className="size-4" />
                        )}
                        {nextDueInvoice
                          ? "Pay due installment"
                          : nextDueProject
                            ? "Open project billing"
                            : "Open billing portal"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (latestPaidInvoice) {
                            downloadReceipt(latestPaidInvoice);
                            return;
                          }

                          void handleOpenCustomerPortal();
                        }}
                        disabled={portalLoading}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-[16px] border border-white/[0.05] bg-white/[0.02] px-6 text-sm font-semibold text-white transition hover:border-white/[0.08] hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {portalLoading ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : latestPaidInvoice ? (
                          <Download className="size-4" />
                        ) : (
                          <Plus className="size-4" />
                        )}
                        {latestPaidInvoice ? "Download latest receipt" : "Manage billing methods"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-[32px] border border-white/[0.05] bg-accent px-6 py-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                  <div>
                    <h2 className="text-[2rem] font-semibold tracking-[-0.65px] text-[#f8fafc]">
                      Billing tools
                    </h2>
                    <p className="mt-2 text-sm text-[#8f96a3]">
                      Quick access to payment methods, receipts, and escrow visibility.
                    </p>
                  </div>

                  <div className="mt-7 space-y-4">
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
                    className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-[16px] border border-white/[0.05] bg-transparent text-sm font-medium text-[#a1a1aa] transition hover:border-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Plus className="size-4 text-primary" />
                    Open billing portal
                  </button>
                </div>
              </section>

              <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.82fr)]">
                <div className="rounded-[32px] border border-white/[0.05] bg-accent px-8 py-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <h2 className="text-[2rem] font-semibold tracking-[-0.65px] text-[#f8fafc]">
                        Project billing
                      </h2>
                      <p className="text-sm text-[#8f96a3]">
                        Each accepted project keeps its own payment schedule, receipts, and funding progress.
                      </p>
                    </div>
                    <p className="text-sm text-[#7c828d]">
                      {billingProjects.length} project{billingProjects.length === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div className="mt-8 grid gap-4 xl:grid-cols-2">
                    {billingProjects.map((project) => (
                      <ProjectBillingCard
                        key={project.id}
                        project={project}
                        showAmounts={showAmounts}
                        processingInvoiceId={processingInvoiceId}
                        onPay={handlePayInstallment}
                        onDownloadReceipt={downloadReceipt}
                        onOpenProject={handleOpenProject}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-[32px] border border-white/[0.05] bg-accent px-6 py-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                    <h2 className="text-[2rem] font-semibold tracking-[-0.65px] text-[#f8fafc]">
                      Recent receipts
                    </h2>
                    <p className="mt-2 text-sm text-[#8f96a3]">
                      Download the latest proof of payment without leaving your workspace.
                    </p>

                    <div className="mt-7 space-y-4">
                      {recentReceipts.length > 0 ? (
                        recentReceipts.map((receipt) => (
                          <ReceiptRow
                            key={receipt.id}
                            receipt={receipt}
                            visible={showAmounts}
                            onDownloadReceipt={downloadReceipt}
                            onOpenProject={handleOpenProject}
                          />
                        ))
                      ) : (
                        <div className="rounded-[22px] border border-white/[0.05] bg-[#171717] px-5 py-6 text-sm text-[#8f96a3]">
                          Your first receipt will appear here once an installment payment is completed.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[32px] border border-white/[0.05] bg-accent px-6 py-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                    <h2 className="text-[2rem] font-semibold tracking-[-0.65px] text-[#f8fafc]">
                      Monthly spend
                    </h2>
                    <p className="mt-2 text-sm text-[#8f96a3]">
                      A simple view of how your funded project budget has moved over the last few months.
                    </p>

                    <MonthlyPaymentsChart points={monthlySeries} visible={showAmounts} />
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
