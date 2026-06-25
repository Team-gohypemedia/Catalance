"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
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
import ClientPageHeader from "@/components/features/client/ClientPageHeader";
import ClientWorkspaceHeader from "@/components/features/client/ClientWorkspaceHeader";
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
import { useNotifications } from "@/shared/context/NotificationContext";
import { downloadInvoicePdf } from "@/shared/lib/invoice-pdf";
import { extractLabeledLineValue } from "@/shared/lib/labeled-fields";
import { processProjectInstallmentPayment } from "@/shared/lib/project-payment";
import {
  resolveUserDisplayName,
  resolveUserSecondaryLabel,
} from "@/shared/lib/user-display";
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

const PROJECT_FILTER_ALL_VALUE = "ALL";
const ALL_PROJECT_BILLING_PREVIEW_COUNT = 4;

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

const getDisplayName = (user) => resolveUserDisplayName(user, "Client");

const getInitials = (value = "") => {
  const parts = String(value).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "C";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const getFirstNonEmptyText = (...values) => {
  for (const value of values.flat()) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }

  return "";
};

const extractLabeledValue = (value = "", labels = []) =>
  extractLabeledLineValue(value, labels);

const toDisplayTitleCase = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/(^|[\s/-])([a-z])/g, (match, prefix, char) => `${prefix}${char.toUpperCase()}`);

const resolveProjectBusinessName = (project = {}, acceptedProposal = null) =>
  getFirstNonEmptyText(
    project?.businessName,
    project?.companyName,
    acceptedProposal?.businessName,
    acceptedProposal?.companyName,
    extractLabeledValue(project?.description || "", [
      "Business Name",
      "Company Name",
      "Brand Name",
    ]),
    extractLabeledValue(
      acceptedProposal?.coverLetter || acceptedProposal?.description || "",
      ["Business Name", "Company Name", "Brand Name"],
    ),
  );

const resolveProjectServiceType = (project = {}, acceptedProposal = null) =>
  getFirstNonEmptyText(
    project?.service,
    project?.serviceName,
    project?.serviceKey,
    project?.category,
    acceptedProposal?.service,
    acceptedProposal?.serviceName,
    acceptedProposal?.serviceKey,
    acceptedProposal?.category,
    extractLabeledValue(project?.description || "", [
      "Service Type",
      "Service",
      "Category",
    ]),
    extractLabeledValue(
      acceptedProposal?.coverLetter || acceptedProposal?.description || "",
      ["Service Type", "Service", "Category"],
    ),
    project?.title,
  );

const getAcceptedProposal = (project) => {
  const proposals = Array.isArray(project?.proposals) ? project.proposals : [];
  return proposals.find(
    (proposal) => String(proposal?.status || "").toUpperCase() === "ACCEPTED",
  );
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
  <div className="rounded-[20px] border border-border bg-card px-4 py-4 sm:px-5 sm:py-5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
        <p
          className={cn(
            "mt-2 truncate text-[1.7rem] font-semibold leading-none tracking-[-0.04em] sm:text-[2rem]",
            tone === "success"
              ? "text-emerald-500 dark:text-[#34d399]"
              : tone === "warning"
                ? "text-primary"
                : "text-foreground",
          )}
        >
          {kind === "currency" ? maskCurrency(value, visible) : value}
        </p>
      </div>
      {Icon ? (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-muted text-primary">
          <Icon className="size-4" />
        </div>
      ) : null}
    </div>
    {helper ? <p className="mt-3 text-[11px] text-muted-foreground sm:mt-4 sm:text-xs">{helper}</p> : null}
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
    className="group flex w-full items-start gap-3 rounded-[16px] border border-border bg-muted/30 px-4 py-3 text-left transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60 sm:items-center"
  >
    <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-muted text-muted-foreground">
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
    </div>
    
  </button>
);

const ProjectFilterMenu = ({ projects, value, onValueChange }) => {
  const selectedProject =
    value === PROJECT_FILTER_ALL_VALUE
      ? null
      : projects.find((project) => String(project.id) === String(value)) || null;
  const selectedProjectLabel =
    (selectedProject?.businessName ? toDisplayTitleCase(selectedProject.businessName) : "") ||
    selectedProject?.title ||
    "All projects";

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-[10px] bg-[var(--primary)] px-4 text-sm font-semibold text-white transition hover:bg-primary/80 sm:w-auto"
        >
          <div className="flex min-w-0 items-center gap-2">
            <FolderOpen className="size-4 shrink-0" />
            <span>Filter</span>
            <span className="max-w-[8.5rem] truncate rounded-full bg-black/10 dark:bg-black/20 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm sm:max-w-[10rem]">
              {selectedProjectLabel}
            </span>
          </div>
          <ChevronDown className="size-4 shrink-0 opacity-80" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[min(22rem,calc(100vw-2rem))] rounded-[18px] border border-border bg-card p-2 text-foreground shadow-lg"
      >
        <DropdownMenuLabel className="px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Filter projects
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1" />

        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          <DropdownMenuRadioItem
            value={PROJECT_FILTER_ALL_VALUE}
            className="items-start rounded-[14px] px-3 py-2.5 pl-3 transition-colors hover:bg-muted data-[state=checked]:bg-muted [&>span:first-child]:hidden"
          >
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold text-foreground">All Projects</span>
              <span className="text-xs text-muted-foreground">
                Show the combined payment dashboard
              </span>
            </div>
          </DropdownMenuRadioItem>

          {projects.map((project) => (
            <DropdownMenuRadioItem
              key={project.id}
              value={String(project.id)}
              className="items-start rounded-[14px] px-3 py-2.5 pl-3 transition-colors hover:bg-muted data-[state=checked]:bg-muted [&>span:first-child]:hidden"
            >
              <div className="flex min-w-0 flex-col items-start">
                <span className="truncate text-sm font-semibold text-foreground">
                  {project.businessName ? toDisplayTitleCase(project.businessName) : project.title}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {project.businessName ? project.title : project.freelancerName}
                </span>
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const ProjectMetaStack = ({ serviceType, freelancerName, compact = false }) => {
  const hasServiceType = Boolean(serviceType);
  const hasFreelancerName = Boolean(freelancerName);

  if (!hasServiceType && !hasFreelancerName) {
    return null;
  }

  return (
    <div className={cn("min-w-0", compact ? "mt-1" : "mt-1.5")}>
      <div
        className={cn(
          "flex min-w-0 max-w-full flex-wrap items-center gap-x-2 gap-y-1 leading-tight",
          compact ? "text-[11px]" : "text-[0.82rem]",
        )}
      >
        {hasServiceType ? (
          <div className="min-w-0 truncate font-medium text-muted-foreground">{serviceType}</div>
        ) : null}

        {hasServiceType && hasFreelancerName ? (
          <span className="h-3 w-px shrink-0 bg-border" aria-hidden="true" />
        ) : null}

        {hasFreelancerName ? <div className="min-w-0 truncate text-muted-foreground">{freelancerName}</div> : null}
      </div>
    </div>
  );
};

const TransactionRow = ({ transaction, visible, onOpenProject }) => {
  const amount = transaction?.isPaid ? transaction.amountPaid : transaction.amountDue;

  return (
    <button
      type="button"
      onClick={() => onOpenProject(transaction?.projectId)}
      className="flex w-full flex-col gap-2 border-b border-border py-3 text-left last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{transaction.installmentLabel}</p>
        <p className="truncate text-xs text-muted-foreground">
          {transaction.projectLabel}
          <span className="px-1 text-muted-foreground">/</span>
          {transaction.freelancerName}
        </p>
      </div>
      <div className="flex w-full items-center justify-between gap-4 sm:block sm:w-auto sm:text-right">
        <p
          className={cn(
            "text-sm font-semibold",
            transaction.isDue ? "text-primary" : "text-foreground",
          )}
        >
          {maskCurrency(amount, visible)}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{formatShortDate(transaction.issuedAt)}</p>
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
      <div className="rounded-[24px] border border-border bg-card p-5 sm:p-6">
        <h2 className="text-[22px] sm:text-[1.8rem] font-semibold tracking-[-0.03em] text-foreground">Active Project Payments</h2>
        <div className="mt-5 rounded-[18px] border border-dashed border-border bg-muted/50 p-5 text-center sm:p-6">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-muted text-primary">
            <CreditCard className="size-6" />
          </div>
          <p className="mt-4 text-lg font-semibold text-foreground">No active payment timeline yet</p>
          <p className="mx-auto mt-2 max-w-[30rem] text-sm text-muted-foreground">
            Accepted projects will appear here with milestone-based payment schedule, due amounts, and release actions.
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onOpenProposals}
              className="inline-flex h-10 w-full items-center justify-center rounded-[10px] bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/80 sm:w-auto"
            >
              Open Proposals
            </button>
            <button
              type="button"
              onClick={onOpenProjects}
              className="inline-flex h-10 w-full items-center justify-center rounded-[10px] border border-border px-5 text-sm font-semibold text-foreground transition hover:bg-muted sm:w-auto"
            >
              View Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  const dueInstallment = project.nextDueInstallment;
  const hasDueInstallment = Boolean(dueInstallment);
  const duePaymentId = dueInstallment ? `${project.id}-${dueInstallment.sequence}` : null;
  const isProcessingDuePayment = Boolean(duePaymentId && processingInvoiceId === duePaymentId);
  const scheduleItems = Array.isArray(project.installments)
    ? project.installments.slice(0, 4)
    : [];
  const projectHeadline =
    (project?.businessName ? toDisplayTitleCase(project.businessName) : "") ||
    project?.serviceType ||
    project?.title ||
    "Untitled Project";

  return (
    <div className="rounded-[24px] border border-border bg-card p-5 sm:p-6">
      <h2 className="text-[22px] sm:text-[1.8rem] font-semibold tracking-[-0.03em] text-foreground">Active Project Payments</h2>

      <div className="mt-5 rounded-[18px] border border-white/[0.05] bg-card p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-[1.2rem] font-semibold tracking-[-0.02em] text-foreground sm:text-[1.45rem]">
              {projectHeadline}
            </h3>
            <ProjectMetaStack
              serviceType={project.serviceType}
              freelancerName={project.freelancerName}
              compact
            />
          </div>
          <p
            className={cn(
              "text-[1.35rem] font-semibold sm:shrink-0 sm:text-[1.6rem]",
              hasDueInstallment ? "text-[#34d399]" : "text-[var(--primary)]",
            )}
          >
            {maskCurrency(dueInstallment?.amount || project.remainingAmount, showAmounts)}
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div>
            <p className="text-[1.7rem] font-semibold leading-none tracking-[-0.03em] text-foreground sm:text-[2rem]">
              {maskCurrency(project.paidAmount, showAmounts)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {maskCurrency(project.totalAmount, showAmounts)} total budget
            </p>
          </div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground sm:text-right">
            {project.paidPercentage}% funded • {project.paidInstallmentCount}/{project.totalInstallments} milestones completed
          </p>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-[var(--primary)] transition-[width]"
            style={{ width: `${Math.max(0, Math.min(project.paidPercentage, 100))}%` }}
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => onOpenProject(project.id)}
            className="inline-flex h-10 w-full items-center justify-center rounded-[10px] bg-[var(--primary)] px-5 text-sm font-semibold text-white transition hover:bg-primary/80 sm:w-auto"
          >
            View details
          </button>
          <button
            type="button"
            onClick={() =>
              dueInstallment &&
              onPay({
                id: duePaymentId,
                projectId: project.id,
                projectTitle: project.title,
                installmentLabel: dueInstallment.label,
              })
            }
            disabled={!dueInstallment || isProcessingDuePayment}
            className={cn(
              "inline-flex h-10 w-full items-center justify-center gap-2 rounded-[10px] px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto",
              hasDueInstallment
                ? "bg-emerald-500/20 text-emerald-700 dark:bg-[#34d399]/10 dark:text-[#34d399] hover:bg-emerald-500/30"
                : "border border-border text-foreground hover:bg-muted",
            )}
          >
            {isProcessingDuePayment ? <Loader2 className="size-4 animate-spin" /> : null}
            {dueInstallment ? "Pay Due Milestone" : "No Milestone Due"}
          </button>
        </div>

        <p
          className={cn(
            "mt-3 text-xs",
            hasDueInstallment ? "text-emerald-600 dark:text-[#8ee7bc]" : "text-muted-foreground",
          )}
        >
          {dueInstallment
            ? `This will pay the currently due installment: ${dueInstallment.label}.`
            : "All current milestones are settled. The next payment will unlock when the project reaches the next billing checkpoint."}
        </p>

        <div className="mt-6 border-t border-border pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Payment Schedule</p>
          <div className="mt-3 space-y-2">
            {scheduleItems.map((installment, index) => {
              const statusDotClass = installment?.isPaid
                ? "bg-emerald-500"
                : installment?.isDue
                  ? "bg-emerald-400"
                  : "bg-muted-foreground/50";
              const scheduleRowClass = installment?.isDue
                ? "border-emerald-500/20 bg-emerald-500/5"
                : "border-border bg-muted/30";
              const scheduleStatusClass = installment?.isPaid
                ? "text-muted-foreground"
                : installment?.isDue
                  ? "font-medium text-emerald-600 dark:text-[#8ee7bc]"
                  : "text-muted-foreground";

              return (
                <div
                  key={`${project.id}-${installment?.sequence || index + 1}`}
                  className={cn(
                    "flex flex-col gap-2 rounded-[10px] border px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3",
                    scheduleRowClass,
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={cn("size-2.5 rounded-full", statusDotClass)} />
                    <p className="truncate text-sm text-foreground">
                      {installment?.label || `Milestone ${installment?.sequence || index + 1}`}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:block sm:text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {maskCurrency(Number(installment?.amount) || 0, showAmounts)}
                    </p>
                    <p className={cn("text-[10px]", scheduleStatusClass)}>
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

const getBillingStatusMeta = (invoice) => {
  if (invoice?.isPaid) {
    return {
      label: "Paid",
      badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-[#4ade80]",
    };
  }

  if (invoice?.amountPaid > 0) {
    return {
      label: "Part paid",
      badgeClass: "bg-blue-500/10 text-blue-600 dark:text-[#93c5fd]",
    };
  }

  if (invoice?.isDue) {
    return {
      label: "Pending",
      badgeClass: "bg-[var(--primary)]/12 text-[var(--primary)]",
    };
  }

  return {
    label: "Scheduled",
    badgeClass: "bg-muted text-muted-foreground",
  };
};

const BillingAmountCell = ({ label, value, visible, tone = "default", className = "" }) => {
  const valueClass =
    tone === "success"
      ? "text-emerald-500 dark:text-[#34d399]"
      : tone === "warning"
        ? "text-[var(--primary)]"
        : tone === "muted"
          ? "text-muted-foreground"
          : "text-foreground";

  return (
    <div className="min-w-0 px-1 py-1">
      <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1.5 text-[0.95rem] font-semibold tracking-[-0.03em] sm:text-[1.05rem]",
          valueClass,
        )}
      >
        {maskCurrency(value, visible)}
      </p>
    </div>
  );
};

const ProjectBillingList = ({
  invoices,
  showAmounts,
  onDownloadInvoice,
  onOpenProject,
  compact = false,
  previewCount = ALL_PROJECT_BILLING_PREVIEW_COUNT,
}) => {
  const [showAllInvoices, setShowAllInvoices] = useState(false);

  const hasCollapsedInvoices = compact && invoices.length > previewCount;
  const displayedInvoices =
    hasCollapsedInvoices && !showAllInvoices ? invoices.slice(0, previewCount) : invoices;

  useEffect(() => {
    setShowAllInvoices(false);
  }, [compact, previewCount, invoices.length]);

  if (!invoices.length) {
    return (
      <div className="mt-5 rounded-[18px] border border-dashed border-border bg-muted/30 px-4 py-7 text-sm text-muted-foreground sm:px-5 sm:py-8">
        Billing entries will appear here once your project invoices are created.
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-4 [content-visibility:auto]">
      {displayedInvoices.map((invoice) => {
        const statusMeta = getBillingStatusMeta(invoice);
        const balanceTone = invoice.balanceDue > 0 ? "warning" : "muted";

        return (
          <article
            key={invoice.id}
            className="rounded-[18px] border border-border bg-card px-4 py-4 sm:px-5 sm:py-5 overflow-hidden"
          >
            <div className="flex flex-col gap-2 lg:flex-row lg:flex-nowrap lg:items-center lg:gap-3">
              <div className="min-w-[130px] flex-1 rounded-[16px] p-0 sm:px-2 sm:py-2 overflow-hidden">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-[0.95rem] font-semibold tracking-[-0.03em] text-foreground sm:text-[1.05rem]">
                    {invoice.projectLabel}
                  </h3>
                  <span
                    className={cn(
                      "inline-flex rounded-lg px-2 py-0.5 text-[10px] font-semibold",
                      statusMeta.badgeClass,
                    )}
                  >
                    {statusMeta.label}
                  </span>
                </div>

                <p className="mt-2 truncate text-[13px] font-semibold text-muted-foreground sm:text-[0.95rem]">
                  {invoice.installmentLabel}
                </p>

                <div className="mt-2 flex items-center gap-x-1.5 text-[11px]">
                  <span className="inline-flex whitespace-nowrap rounded-lg bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                    {invoice.serviceType || "Project service"}
                  </span>
                  <span className="text-muted-foreground">•</span>
                </div>
                
                <p className="mt-1.5 truncate text-[11px] text-muted-foreground">
                  {invoice.freelancerName}
                </p>

                <p className="mt-3 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Issued {formatShortDate(invoice.issuedAt)}
                </p>
              </div>

              <div className="grid w-full shrink-0 gap-1 rounded-[16px] border border-border px-2 py-2 sm:w-auto sm:grid-cols-3 sm:gap-2">
                <BillingAmountCell
                  label="Scheduled"
                  value={invoice.amountDue}
                  visible={showAmounts}
                />
                <BillingAmountCell
                  label="Paid"
                  value={invoice.amountPaid}
                  visible={showAmounts}
                  tone={invoice.amountPaid > 0 ? "success" : "muted"}
                />
                <BillingAmountCell
                  label="Balance"
                  value={invoice.balanceDue}
                  visible={showAmounts}
                  tone={balanceTone}
                />
              </div>

              <div className="flex w-full shrink-0 flex-col gap-1.5 rounded-[16px] p-0 sm:ml-auto sm:w-[115px] sm:p-2">
                <button
                  type="button"
                  onClick={() => onDownloadInvoice(invoice)}
                  className="inline-flex h-8 w-full items-center justify-center gap-2 rounded-[12px] border border-border px-2 text-[11px] font-semibold text-foreground transition hover:bg-muted sm:w-auto xl:w-full"
                >
                  <Download className="size-3.5" />
                  Download invoice
                </button>
                <button
                  type="button"
                  onClick={() => onOpenProject(invoice.projectId)}
                  className="inline-flex h-8 w-full items-center justify-center rounded-[12px] bg-primary px-2 text-[11px] font-semibold text-primary-foreground transition hover:bg-primary/80 sm:w-auto xl:w-full"
                >
                  View details
                </button>
              </div>
            </div>
          </article>
        );
      })}

      {hasCollapsedInvoices ? (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => {
              setShowAllInvoices((currentValue) => !currentValue);
            }}
            className="inline-flex h-11 w-full items-center justify-center rounded-[12px] border border-border bg-muted/30 px-5 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground sm:w-auto"
          >
            {showAllInvoices ? "Show fewer invoices" : `Show all ${invoices.length} invoices`}
          </button>
        </div>
      ) : null}
    </div>
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
    <div className={cn("relative", compact ? "mt-10" : "mt-12")}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={cn(
          compact ? "h-[135px] sm:h-[150px]" : "h-[180px] sm:h-[220px]",
          "w-full overflow-visible",
        )}
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
                <text x={leftPadding - 2} y={y - 6} fill="hsl(var(--muted-foreground))" fontSize="10" textAnchor="start">
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
              fill="hsl(var(--muted-foreground))"
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
          className="pointer-events-none absolute rounded-[10px] border border-border bg-card px-3 py-2 shadow-md"
          style={{
            left: `${(lastPoint.x / width) * 100}%`,
            top: `${(lastPoint.y / height) * 100}%`,
            transform: "translate(-85%, -125%)",
          }}
        >
          <p className="text-[10px] text-muted-foreground">{lastPoint.fullLabel}</p>
          <p className={cn(compact ? "text-sm" : "text-lg", "font-semibold text-foreground") }>
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
        <Skeleton key={item} className="h-[110px] rounded-[20px] bg-white/[0.04] sm:h-[120px]" />
      ))}
    </section>

    <section className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.78fr)]">
      <Skeleton className="h-[380px] rounded-[24px] bg-white/[0.04] sm:h-[440px]" />
      <Skeleton className="h-[320px] rounded-[24px] bg-white/[0.04] sm:h-[440px]" />
    </section>

    <section className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.78fr)]">
      <Skeleton className="h-[360px] rounded-[24px] bg-white/[0.04] sm:h-[430px]" />
      <Skeleton className="h-[240px] rounded-[24px] bg-white/[0.04] sm:h-[270px]" />
    </section>
  </>
);

const EmptyPaymentsState = () => (
  <div className="mt-8 rounded-[24px] border border-dashed border-white/[0.08] bg-card px-5 py-12 text-center sm:px-6 sm:py-16">
    <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-white/[0.04] text-primary">
      <Wallet className="size-7" />
    </div>
    <h2 className="mt-6 text-[1.55rem] font-semibold text-foreground sm:text-2xl">No billing activity yet</h2>
    <p className="mx-auto mt-3 max-w-[32rem] text-sm text-muted-foreground">
      Once a project proposal is accepted and billing milestones are created, this dashboard will populate automatically.
    </p>
  </div>
);

const ClientPaymentsContent = () => {
  const navigate = useNavigate();
  const { user, authFetch, isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();
  const headerDisplayName = useMemo(() => getDisplayName(user), [user]);
  const [isLoading, setIsLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [processingInvoiceId, setProcessingInvoiceId] = useState(null);
  const [projectFilter, setProjectFilter] = useState(PROJECT_FILTER_ALL_VALUE);
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
        const businessName = resolveProjectBusinessName(project, acceptedProposal);
        const serviceType = resolveProjectServiceType(project, acceptedProposal);
        const projectLabel =
          (businessName ? toDisplayTitleCase(businessName) : "") ||
          project?.title ||
          "Untitled Project";
        const paidInstallmentCount = installments.filter((installment) =>
          Boolean(installment?.isPaid),
        ).length;
        const latestPaidInstallment =
          [...installments].reverse().find((installment) => installment?.isPaid) || null;

        return {
          id: project.id,
          title: project?.title || "Untitled Project",
          businessName,
          projectLabel,
          serviceType,
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
                projectLabel,
                serviceType,
                freelancerName,
                installmentLabel:
                  latestPaidInstallment.label ||
                  `Milestone ${latestPaidInstallment.sequence || paidInstallmentCount}`,
                issuedAt: project?.updatedAt || project?.createdAt,
                amountDue: Number(latestPaidInstallment.amount) || 0,
                amountPaid: Number(latestPaidInstallment.amount) || 0,
                balanceDue: 0,
                escrowHeld:
                  projectStatus === "COMPLETED"
                    ? 0
                    : Number(latestPaidInstallment.amount) || 0,
                projectPaidSoFar: Number(paymentPlan.paidAmount) || 0,
                projectRemainingAmount: Number(paymentPlan.remainingAmount) || 0,
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

  useEffect(() => {
    if (projectFilter === PROJECT_FILTER_ALL_VALUE) return;

    const isFilterStillAvailable = billingProjects.some(
      (project) => String(project.id) === projectFilter,
    );

    if (!isFilterStillAvailable) {
      setProjectFilter(PROJECT_FILTER_ALL_VALUE);
    }
  }, [billingProjects, projectFilter]);

  const selectedProject = useMemo(() => {
    if (projectFilter === PROJECT_FILTER_ALL_VALUE) return null;

    return billingProjects.find((project) => String(project.id) === projectFilter) || null;
  }, [billingProjects, projectFilter]);

  const visibleProjects = useMemo(
    () => (selectedProject ? [selectedProject] : billingProjects),
    [billingProjects, selectedProject],
  );

  const paymentRows = useMemo(() => {
    return billingProjects
      .flatMap((project) =>
        project.installments.map((installment, index) => {
          const amountValue = Number(installment?.amount) || 0;
          const amountPaid = Math.max(
            0,
            Math.min(
              amountValue,
              Number(installment?.amountPaid ?? (installment?.isPaid ? amountValue : 0)) || 0,
            ),
          );
          const balanceDue = Math.max(amountValue - amountPaid, 0);
          const isPaid = Boolean(installment?.isPaid) || (amountValue > 0 && balanceDue === 0);
          const isDue = Boolean(installment?.isDue);
          const hasPartialPayment = !isPaid && amountPaid > 0;

          return {
            id: `${project.id}-${installment?.sequence || index + 1}`,
            projectId: project.id,
            projectTitle: project.title,
            projectLabel: project.projectLabel,
            serviceType: project.serviceType,
            freelancerName: project.freelancerName,
            installmentLabel:
              installment?.label || `Milestone ${installment?.sequence || index + 1}`,
            issuedAt: project.updatedAt || project.createdAt,
            amountDue: amountValue,
            amountPaid,
            balanceDue,
            escrowHeld: amountPaid > 0 ? Math.min(project.escrowProtected, amountPaid) : 0,
            projectPaidSoFar: project.paidAmount,
            projectRemainingAmount: project.remainingAmount,
            statusLabel: isPaid ? "Paid" : hasPartialPayment ? "Part paid" : isDue ? "Pending" : "Scheduled",
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

  const visiblePaymentRows = useMemo(
    () =>
      selectedProject
        ? paymentRows.filter((row) => String(row.projectId) === String(selectedProject.id))
        : paymentRows,
    [paymentRows, selectedProject],
  );

  const activeProject = useMemo(
    () =>
      selectedProject ||
      billingProjects.find((project) => project.nextDueInstallment) ||
      billingProjects.find((project) => !project.isFullyPaid) ||
      billingProjects[0] ||
      null,
    [billingProjects, selectedProject],
  );

  const summary = useMemo(() => {
    const now = new Date();

    return visibleProjects.reduce(
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
  }, [visibleProjects]);

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

    visiblePaymentRows.forEach((row) => {
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
  }, [visiblePaymentRows]);

  const recentReceipts = useMemo(
    () => visiblePaymentRows.filter((row) => row.isPaid).slice(0, 4),
    [visiblePaymentRows],
  );

  const recentTransactions = useMemo(() => recentReceipts.slice(0, 4), [recentReceipts]);

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
        label: "Invoices",
        subtitle: latestPaidInvoice
          ? "Download your most recent billing invoice instantly."
          : "Invoices will appear here after your first completed installment.",
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

  const handleDownloadInvoice = useCallback(
    async (invoice) => {
      if (!invoice) return;

      try {
        await downloadInvoicePdf(invoice, {
          clientName: headerDisplayName,
        });
      } catch (error) {
        console.error("Failed to download invoice PDF", error);
        toast.error("Failed to download invoice PDF.");
      }
    },
    [headerDisplayName],
  );

  const handleMethodAction = async (action) => {
    if (action === "portal") {
      await handleOpenCustomerPortal();
      return;
    }

    if (action === "latest-receipt") {
      if (latestPaidInvoice) {
        await handleDownloadInvoice(latestPaidInvoice);
        return;
      }

      toast.info("Your latest invoice will appear here after the first completed payment.");
      return;
    }

    toast.info(
      "Client funds stay protected in escrow until verified milestones are cleared.",
    );
  };

  return (
    <div className="min-h-screen bg-background text-muted-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[1536px] flex-col px-4 sm:px-6 lg:px-[40px] xl:w-[94%] xl:max-w-none">
        <ClientWorkspaceHeader
          profile={{
            avatar: user?.avatar,
            name: headerDisplayName,
            email: resolveUserSecondaryLabel(user),
            initial: getInitials(headerDisplayName),
          }}
          activeWorkspaceKey="payments"
          unreadCount={unreadCount}
        />

        <main className="flex-1 pb-12">
          <ClientPageHeader
            title="Financial Overview"
            dateLabel={false}
            mobileDateFirst
            actions={
              <ProjectFilterMenu
                projects={billingProjects}
                value={projectFilter}
                onValueChange={setProjectFilter}
              />
            }
          />

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
                  helper={`Across ${visibleProjects.length} active project${visibleProjects.length === 1 ? "" : "s"}`}
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

              <section className="mt-7 grid items-stretch gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,0.78fr)]">
                <div className="flex h-full flex-col gap-6">
                  <ActiveProjectPaymentsPanel
                    project={activeProject}
                    showAmounts={showAmounts}
                    processingInvoiceId={processingInvoiceId}
                    onPay={handlePayInstallment}
                    onOpenProject={handleOpenProject}
                    onOpenProjects={() => navigate("/client/project")}
                    onOpenProposals={() => navigate("/client/proposal")}
                  />

                  <div className="flex-1 rounded-[24px] border border-white/[0.05] bg-card p-5 sm:p-6">
                    <div className="flex flex-col gap-3">
                      <div className="space-y-2">
                        <h2 className="text-[22px] sm:text-[2rem] font-semibold tracking-[-0.03em] text-foreground">Project billing</h2>
                        <p className="text-sm text-muted-foreground">
                          {selectedProject
                            ? `Showing every invoice, paid amount, and outstanding balance for ${selectedProject.projectLabel}.`
                            : "Showing a shorter billing preview across all projects. Expand the list or pick a project to focus on one billing schedule."}
                        </p>
                      </div>
                    </div>

                    <ProjectBillingList
                      invoices={visiblePaymentRows}
                      showAmounts={showAmounts}
                      onDownloadInvoice={handleDownloadInvoice}
                      onOpenProject={handleOpenProject}
                      compact={!selectedProject}
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-[24px] border border-white/[0.05] bg-card p-5 sm:p-6">
                    <h2 className="text-[22px] sm:text-[1.8rem] font-semibold tracking-[-0.03em] text-foreground">
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
                        <p className="rounded-[12px] border border-white/[0.05] bg-[#262626] px-3 py-4 text-sm text-muted-foreground">
                          Transactions will appear here after your first payment
                          {selectedProject ? " for this project." : "."}
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
                      className="mt-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
                    >
                      View all
                      
                    </button>
                  </div>

                  <div className="rounded-[24px] border border-white/[0.05] bg-card p-5 sm:p-6">
                    <h2 className="text-[22px] sm:text-[1.8rem] font-semibold tracking-[-0.03em] text-foreground">Billing tools</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Quick access to payment methods, invoices, and escrow visibility.
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
                      className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-[12px] border border-white/[0.05] text-sm text-muted-foreground transition hover:border-white/[0.1] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Plus className="size-4 text-primary" />
                      Open billing portal
                    </button>
                  </div>

                  <div className="rounded-[24px] border border-white/[0.05] bg-card p-5 sm:p-6">
                    <h2 className="text-[22px] sm:text-[1.8rem] font-semibold tracking-[-0.03em] text-foreground">Monthly spend</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {selectedProject
                        ? `Showing spend only for ${selectedProject.title}.`
                        : "A simple view of your funded project budget movement."}
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
