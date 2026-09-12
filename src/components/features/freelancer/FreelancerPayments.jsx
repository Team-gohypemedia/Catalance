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
import ListFilter from "lucide-react/dist/esm/icons/list-filter";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Plus from "lucide-react/dist/esm/icons/plus";
import Wallet from "lucide-react/dist/esm/icons/wallet";
import QrCode from "lucide-react/dist/esm/icons/qr-code";
import Upload from "lucide-react/dist/esm/icons/upload";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import XCircle from "lucide-react/dist/esm/icons/x-circle";
import Send from "lucide-react/dist/esm/icons/send";
import Eye from "lucide-react/dist/esm/icons/eye";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import Building from "lucide-react/dist/esm/icons/building";
import Check from "lucide-react/dist/esm/icons/check";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ClientPageHeader from "@/components/features/client/ClientPageHeader";
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

import { useSearchParams } from "react-router-dom";

const surfaceClass =
  "rounded-[24px] border border-border bg-card sm:rounded-[28px]";

const metricCardClass = `${surfaceClass} px-5 py-5 sm:px-6 sm:py-6`;

const PAYMENT_METHODS = [
  {
    id: "upi",
    label: "UPI & QR Code",
    subtitle: "Instant domestic payouts via UPI ID and QR code scan.",
    icon: QrCode,
  },
  {
    id: "bank-transfer",
    label: "Bank Transfer (NEFT/IMPS)",
    subtitle: "Direct payout into your domestic bank account.",
    icon: Landmark,
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
    year: "numeric",
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

const getGrossAmount = (proposal = {}) =>
  Number(
    proposal?.amount ||
      proposal?.budget ||
      proposal?.project?.budget ||
      proposal?.project?.proposalJson?.structuredFields?.budget?.value ||
      proposal?.project?.proposalJson?.amount ||
      0
  );

const getProjectPaymentRow = (proposal = {}) => {
  const grossAmount = getGrossAmount(proposal);
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

const getFallbackInstallment = (proposal = {}, { isCompleted, awaitingDeposit }) => {
  const gross = getGrossAmount(proposal);
  return {
    sequence: 1,
    label: "Project payout",
    amount: gross,
    isPaid: isCompleted,
    isDue: !isCompleted && !awaitingDeposit,
    amountPaid: isCompleted ? gross : 0,
    updatedAt: getActivityDate(
      proposal?.project?.updatedAt,
      proposal?.updatedAt,
      proposal?.createdAt,
    ),
  };
};

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
    const grossAmount = Number(installment?.amount) || getGrossAmount(proposal);
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
      dot: "bg-emerald-500",
      text: "text-emerald-600 dark:text-emerald-400",
    };
  }

  if (statusTone === "pending") {
    return {
      dot: "bg-primary",
      text: "text-primary",
    };
  }

  if (statusTone === "awaiting") {
    return {
      dot: "bg-muted-foreground",
      text: "text-muted-foreground",
    };
  }

  return {
    dot: "bg-blue-400",
    text: "text-blue-500 dark:text-blue-400",
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
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {label}
        </p>
        {loading ? (
          <Skeleton className="mt-5 h-10 w-36 rounded-xl" />
        ) : (
          <p
            className={cn(
              "mt-4 text-[1.7rem] font-semibold leading-none tracking-[-0.04em] sm:mt-5 sm:text-[2rem]",
              tone === "success"
                ? "text-emerald-600 dark:text-emerald-400"
                : tone === "warning"
                  ? "text-primary"
                  : "text-foreground",
            )}
          >
            {formatINR(value)}
          </p>
        )}
      </div>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-muted text-primary">
        <Icon className="size-4" />
      </div>
    </div>
    <p className="mt-4 text-[11px] text-muted-foreground sm:mt-5 sm:text-xs">{helper}</p>
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
          className="inline-flex h-11 w-full min-w-0 items-center justify-between gap-3 rounded-[12px] bg-[var(--primary)] px-4 text-sm font-semibold text-white transition hover:bg-primary/85 dark:text-[#141414] sm:w-auto shadow-sm"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <ListFilter className="size-4.5 shrink-0 opacity-95" />
            <span className="max-w-[10rem] truncate sm:max-w-[12rem]">{selectedLabel}</span>
          </div>
          <ChevronDown className="size-4 shrink-0 opacity-90" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[min(22rem,calc(100vw-2rem))] rounded-[18px] border border-border bg-card p-2 shadow-lg"
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
                Show the combined freelancer payments dashboard
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
                  {project.title}
                </span>
                <span className="truncate text-xs text-muted-foreground">
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

const MilestoneStatusBadge = ({ statusTone, statusLabel }) => {
  const statusClasses = getStatusClasses(statusTone);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-sm font-medium",
        statusClasses.text,
      )}
    >
      <span className={cn("size-2.5 rounded-full", statusClasses.dot)} />
      {statusLabel}
    </span>
  );
};

const PayoutStatusBadge = ({ status }) => {
  const upperStatus = (status || "").toUpperCase();
  if (upperStatus === "PAID") {
    return (
      <Badge className="border-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold px-2.5 py-1">
        <CheckCircle2 className="mr-1 size-3.5" /> Paid
      </Badge>
    );
  }
  if (upperStatus === "APPROVED") {
    return (
      <Badge className="border-0 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold px-2.5 py-1">
        <Check className="mr-1 size-3.5" /> Approved
      </Badge>
    );
  }
  if (upperStatus === "REJECTED") {
    return (
      <Badge className="border-0 bg-red-500/10 text-red-600 dark:text-red-400 font-semibold px-2.5 py-1">
        <XCircle className="mr-1 size-3.5" /> Rejected
      </Badge>
    );
  }
  return (
    <Badge className="border-0 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold px-2.5 py-1">
      <Clock3 className="mr-1 size-3.5 animate-pulse" /> Pending Review
    </Badge>
  );
};

const EarningsTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) {
    return null;
  }

  const amount = Number(payload[0]?.value) || 0;

  return (
    <div className="rounded-[16px] border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold text-foreground">{formatINR(amount)}</p>
    </div>
  );
};

const FreelancerPayments = () => {
  const { authFetch, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [projectRows, setProjectRows] = useState([]);
  const [milestoneRows, setMilestoneRows] = useState([]);
  const [projectFilter, setProjectFilter] = useState(PROJECT_FILTER_ALL_VALUE);

  // Payment details state
  const [paymentDetails, setPaymentDetails] = useState({
    upiId: "",
    upiQrCode: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    accountHolderName: "",
    bankBranch: ""
  });
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isUploadingQr, setIsUploadingQr] = useState(false);

  // Money / Payout Request state
  const [payoutRequests, setPayoutRequests] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({
    projectId: "",
    amount: "",
    notes: ""
  });
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Fetch payment details & proposals
  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);

    try {
      const [proposalsRes, detailsRes, requestsRes] = await Promise.all([
        authFetch("/proposals?as=freelancer"),
        authFetch("/payout-requests/details"),
        authFetch("/payout-requests/request/my")
      ]);

      const proposalsData = await proposalsRes.json().catch(() => null);
      const detailsData = await detailsRes.json().catch(() => null);
      const requestsData = await requestsRes.json().catch(() => null);

      if (proposalsRes.ok && Array.isArray(proposalsData?.data)) {
        const acceptedProposals = proposalsData.data.filter(
          (p) => toUpper(p?.status) === "ACCEPTED"
        );

        const nextProjectRows = acceptedProposals
          .map(getProjectPaymentRow)
          .sort(
            (l, r) => new Date(r.updatedAt || 0).getTime() - new Date(l.updatedAt || 0).getTime()
          );

        const nextMilestoneRows = acceptedProposals
          .flatMap(getMilestoneRows)
          .sort(
            (l, r) => new Date(r.date || 0).getTime() - new Date(l.date || 0).getTime()
          );

        setProjectRows(nextProjectRows);
        setMilestoneRows(nextMilestoneRows);
      }

      if (detailsRes.ok && detailsData?.data) {
        setPaymentDetails({
          upiId: detailsData.data.upiId || "",
          upiQrCode: detailsData.data.upiQrCode || "",
          bankName: detailsData.data.bankName || "",
          accountNumber: detailsData.data.accountNumber || "",
          ifscCode: detailsData.data.ifscCode || "",
          accountHolderName: detailsData.data.accountHolderName || "",
          bankBranch: detailsData.data.bankBranch || ""
        });
      }

      if (requestsRes.ok && Array.isArray(requestsData?.data)) {
        setPayoutRequests(requestsData.data);
      }
    } catch (error) {
      console.error("Failed to load freelancer payment data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [authFetch, isAuthenticated]);

  const [searchParams] = useSearchParams();

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const paramProjectId = searchParams.get("projectId");
    const paramAmount = searchParams.get("amount");
    if (paramProjectId || paramAmount) {
      setRequestForm((prev) => ({
        ...prev,
        projectId: paramProjectId || prev.projectId,
        amount: paramAmount || prev.amount,
      }));
      setIsRequestModalOpen(true);
    }
  }, [searchParams]);

  // QR Code Image Upload Handler
  const handleQrUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WEBP)");
      return;
    }

    // 20MB size check
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image file size is too large. Please choose an image under 20MB.");
      return;
    }

    setIsUploadingQr(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await authFetch("/upload", {
        method: "POST",
        body: formData
      });
      const data = await response.json();

      if (response.ok && data?.data?.url) {
        setPaymentDetails((prev) => ({ ...prev, upiQrCode: data.data.url }));
        toast.success("UPI QR Code uploaded successfully!");
      } else {
        toast.error(data?.message || "Failed to upload QR code image");
      }
    } catch (err) {
      console.error("QR Code upload error:", err);
      toast.error("An error occurred while uploading QR Code");
    } finally {
      setIsUploadingQr(false);
    }
  };

  // Save Payment Info Form Handler
  const handleSavePaymentDetails = async (e) => {
    e.preventDefault();
    setIsSavingDetails(true);

    try {
      const response = await authFetch("/payout-requests/details", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentDetails)
      });
      const data = await response.json();

      if (response.ok) {
        toast.success("Payment & Bank details saved successfully!");
      } else {
        toast.error(data?.message || "Failed to save payment details");
      }
    } catch (err) {
      console.error("Save payment details error:", err);
      toast.error("An error occurred while saving payment details");
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Submit Payout Money Request
  const handleSubmitPayoutRequest = async (e) => {
    e.preventDefault();

    if (!paymentDetails.upiId && !paymentDetails.accountNumber) {
      toast.error("Please configure your UPI ID or Bank Details below first.");
      return;
    }

    const amount = Number(requestForm.amount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount greater than Rs.0");
      return;
    }

    setIsSubmittingRequest(true);

    try {
      const response = await authFetch("/payout-requests/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: requestForm.projectId || null,
          amount,
          notes: requestForm.notes
        })
      });
      const data = await response.json();

      if (response.ok) {
        toast.success(data?.message || "Money request submitted successfully!");
        setIsRequestModalOpen(false);
        setRequestForm({ projectId: "", amount: "", notes: "" });
        loadData();
      } else {
        toast.error(data?.message || "Failed to submit request");
      }
    } catch (err) {
      console.error("Submit payout request error:", err);
      toast.error("An error occurred while submitting request");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const paymentProjects = useMemo(
    () =>
      projectRows.map((row) => ({
        id: row.projectId || row.id,
        title: row.projectTitle,
        clientName: row.clientName,
        availableAmount: row.freelancerShare
      })),
    [projectRows],
  );

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

  return (
    <div className="flex-1 flex flex-col relative min-h-screen overflow-hidden bg-background">
      <FreelancerTopBar />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 z-10 relative scroll-smooth">
        <div className="mx-auto max-w-[1600px] space-y-6">
          <ClientPageHeader
            title="Payments & Payouts"
            className="mt-0"
            mobileDateFirst
            actions={
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => setIsRequestModalOpen(true)}
                  className="h-11 rounded-[12px] bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700 shadow-sm"
                >
                  <Send className="mr-2 size-4" />
                  Request Money / Payout
                </Button>
                <ProjectFilterMenu
                  projects={paymentProjects}
                  value={projectFilter}
                  onValueChange={setProjectFilter}
                />
              </div>
            }
          />

          {/* Metric Cards */}
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <PaymentMetricCard
              label="Total Earnings"
              value={summary.totalShare}
              helper="Your total share across accepted projects."
              icon={Wallet}
              loading={isLoading}
            />
            <PaymentMetricCard
              label="Available Balance"
              value={summary.availableToWithdraw}
              helper="Total collected share ready for withdrawal request."
              icon={CircleDollarSign}
              loading={isLoading}
              tone="success"
            />
            <PaymentMetricCard
              label="Pending Escrow"
              value={summary.pendingShare}
              helper="In escrow or pending client funding."
              icon={Clock3}
              loading={isLoading}
              tone="warning"
            />
            <PaymentMetricCard
              label="This Month's Earnings"
              value={thisMonthEarnings}
              helper={`${summary.activeContracts} active project${summary.activeContracts === 1 ? "" : "s"} ongoing.`}
              icon={BriefcaseBusiness}
              loading={isLoading}
            />
          </section>

          {/* Money Request Modal */}
          {isRequestModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="w-full max-w-lg rounded-[24px] border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Request Money / Payout</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Submit a payout request to admin for your completed project earnings.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsRequestModalOpen(false)}
                    className="rounded-full p-2 text-muted-foreground hover:bg-muted"
                  >
                    <XCircle className="size-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmitPayoutRequest} className="mt-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Select Project (Optional)
                    </label>
                    <select
                      value={requestForm.projectId}
                      onChange={(e) => {
                        const projId = e.target.value;
                        const proj = paymentProjects.find((p) => String(p.id) === String(projId));
                        setRequestForm((prev) => ({
                          ...prev,
                          projectId: projId,
                          amount: proj?.availableAmount ? String(proj.availableAmount) : prev.amount
                        }));
                      }}
                      className="w-full h-11 rounded-[12px] border border-border bg-background px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">-- General / Custom Payout --</option>
                      {paymentProjects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} (Earned/Share: Rs.{(p.availableAmount || 0).toLocaleString("en-IN")})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Requested Amount (INR) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-muted-foreground">Rs.</span>
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="e.g. 15000"
                        value={requestForm.amount}
                        onChange={(e) => setRequestForm((prev) => ({ ...prev, amount: e.target.value }))}
                        className="w-full h-11 rounded-[12px] border border-border bg-background pl-11 pr-4 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Payout Destination Details
                    </label>
                    <div className="rounded-[14px] border border-border bg-muted/40 p-3 text-xs space-y-1">
                      {paymentDetails.upiId ? (
                        <p className="font-semibold text-foreground">
                          UPI ID: <span className="text-primary">{paymentDetails.upiId}</span>
                        </p>
                      ) : null}
                      {paymentDetails.accountNumber ? (
                        <p className="font-semibold text-foreground">
                          Bank Account: <span className="text-foreground">{paymentDetails.accountNumber}</span> ({paymentDetails.bankName || "Bank"})
                        </p>
                      ) : null}
                      {!paymentDetails.upiId && !paymentDetails.accountNumber ? (
                        <p className="text-red-500 font-medium flex items-center gap-1">
                          <AlertCircle className="size-3.5" /> No payout details configured below. Please save UPI or Bank details first.
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Notes for Admin (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Milestone 2 completed, request payout to my UPI"
                      value={requestForm.notes}
                      onChange={(e) => setRequestForm((prev) => ({ ...prev, notes: e.target.value }))}
                      className="w-full rounded-[12px] border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsRequestModalOpen(false)}
                      className="h-11 rounded-[12px]"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmittingRequest || (!paymentDetails.upiId && !paymentDetails.accountNumber)}
                      className="h-11 rounded-[12px] bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
                    >
                      {isSubmittingRequest ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 size-4" />
                      )}
                      Submit Request
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Project Payment Status Table */}
          <section className={cn(surfaceClass, "px-5 py-6 sm:px-6 lg:px-8")}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">Project Payment Statuses</h2>
                <p className="text-xs text-muted-foreground">
                  Track individual project budgets, freelancer revenue shares, and status.
                </p>
              </div>
              <Badge className="self-start rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                {filteredProjectRows.length} project{filteredProjectRows.length === 1 ? "" : "s"}
              </Badge>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-14 w-full rounded-2xl" />
                <Skeleton className="h-14 w-full rounded-2xl" />
              </div>
            ) : filteredProjectRows.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-border bg-muted/20 py-10 text-center text-sm text-muted-foreground">
                No active or accepted projects found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="pb-3 pr-4">Project</th>
                      <th className="pb-3 pr-4">Client</th>
                      <th className="pb-3 pr-4">Gross Budget</th>
                      <th className="pb-3 pr-4">Freelancer Share (70%)</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-sm">
                    {filteredProjectRows.map((row) => (
                      <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-4 pr-4 font-semibold text-foreground">
                          {row.projectTitle}
                        </td>
                        <td className="py-4 pr-4 text-muted-foreground">{row.clientName}</td>
                        <td className="py-4 pr-4 font-medium">{formatINR(row.grossAmount)}</td>
                        <td className="py-4 pr-4 font-bold text-emerald-600 dark:text-emerald-400">
                          {formatINR(row.freelancerShare)}
                        </td>
                        <td className="py-4 pr-4">
                          <MilestoneStatusBadge
                            statusTone={
                              row.statusType === "received"
                                ? "paid"
                                : row.statusType === "awaiting_deposit"
                                ? "awaiting"
                                : "escrow"
                            }
                            statusLabel={
                              row.statusType === "received"
                                ? "Completed & Paid"
                                : row.statusType === "awaiting_deposit"
                                ? "Awaiting Deposit"
                                : "In Escrow"
                            }
                          />
                        </td>
                        <td className="py-4 text-right">
                          <Button
                            size="sm"
                            onClick={() => {
                              setRequestForm({
                                projectId: row.projectId || row.id,
                                amount: String(row.freelancerShare),
                                notes: `Request payout for ${row.projectTitle}`
                              });
                              setIsRequestModalOpen(true);
                            }}
                            className="h-8 rounded-lg bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white font-medium text-xs transition-colors"
                          >
                            <Send className="mr-1.5 size-3.5" /> Request Money
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Main Grid: Payment Details & Payout History */}
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)]">
            
            {/* Freelancer Payment Details Setup Form */}
            <div className={cn(surfaceClass, "px-5 py-6 sm:px-6 lg:px-8 space-y-6")}>
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <QrCode className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Payment Details</h2>
                    <p className="text-xs text-muted-foreground">
                      Configure your UPI ID, QR Code image, and Bank info to receive payouts.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSavePaymentDetails} className="space-y-4">
                {/* UPI Section */}
                <div className="space-y-3 rounded-[18px] border border-border bg-muted/20 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <QrCode className="size-4" /> UPI & QR Code Information
                  </p>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      UPI ID (VPA)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210@paytm or name@upi"
                      value={paymentDetails.upiId}
                      onChange={(e) => setPaymentDetails((prev) => ({ ...prev, upiId: e.target.value }))}
                      className="w-full h-10 rounded-[10px] border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      UPI QR Code Image
                    </label>
                    <div className="flex items-center gap-4">
                      {paymentDetails.upiQrCode ? (
                        <div className="relative group size-20 shrink-0 rounded-xl border border-border overflow-hidden bg-white p-1">
                          <img
                            src={paymentDetails.upiQrCode}
                            alt="UPI QR Code"
                            className="size-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="size-20 shrink-0 rounded-xl border border-dashed border-border bg-background flex flex-col items-center justify-center text-muted-foreground">
                          <QrCode className="size-7 opacity-40" />
                          <span className="text-[10px] mt-1">No QR</span>
                        </div>
                      )}

                      <div className="flex-1 space-y-2">
                        <label className="inline-flex h-9 cursor-pointer items-center justify-center rounded-[10px] bg-muted px-4 text-xs font-semibold text-foreground hover:bg-muted/80 transition-colors">
                          {isUploadingQr ? (
                            <Loader2 className="mr-2 size-3.5 animate-spin" />
                          ) : (
                            <Upload className="mr-2 size-3.5" />
                          )}
                          {paymentDetails.upiQrCode ? "Change QR Image" : "Upload QR Image"}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleQrUpload}
                            disabled={isUploadingQr}
                            className="hidden"
                          />
                        </label>
                        <p className="text-[11px] text-muted-foreground">
                          Upload PNG, JPG, or WEBP of your Paytm/GPay/PhonePe QR code.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bank Details Section */}
                <div className="space-y-3 rounded-[18px] border border-border bg-muted/20 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Landmark className="size-4" /> Bank Account Details
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. HDFC Bank"
                        value={paymentDetails.bankName}
                        onChange={(e) => setPaymentDetails((prev) => ({ ...prev, bankName: e.target.value }))}
                        className="w-full h-10 rounded-[10px] border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Account Holder Name
                      </label>
                      <input
                        type="text"
                        placeholder="Name as per Bank Passbook"
                        value={paymentDetails.accountHolderName}
                        onChange={(e) => setPaymentDetails((prev) => ({ ...prev, accountHolderName: e.target.value }))}
                        className="w-full h-10 rounded-[10px] border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Account Number
                      </label>
                      <input
                        type="text"
                        placeholder="Bank Account Number"
                        value={paymentDetails.accountNumber}
                        onChange={(e) => setPaymentDetails((prev) => ({ ...prev, accountNumber: e.target.value }))}
                        className="w-full h-10 rounded-[10px] border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. HDFC0001234"
                        value={paymentDetails.ifscCode}
                        onChange={(e) => setPaymentDetails((prev) => ({ ...prev, ifscCode: e.target.value.toUpperCase() }))}
                        className="w-full h-10 rounded-[10px] border border-border bg-background px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Bank Branch (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Connaught Place Branch"
                      value={paymentDetails.bankBranch}
                      onChange={(e) => setPaymentDetails((prev) => ({ ...prev, bankBranch: e.target.value }))}
                      className="w-full h-10 rounded-[10px] border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSavingDetails}
                  className="w-full h-11 rounded-[12px] bg-primary font-semibold text-white hover:bg-primary/90"
                >
                  {isSavingDetails ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 size-4" />
                  )}
                  Save Payment Information
                </Button>
              </form>
            </div>

            {/* Payout Request History */}
            <div className={cn(surfaceClass, "px-5 py-6 sm:px-6 lg:px-8 flex flex-col justify-between space-y-6")}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Payout Request History</h2>
                    <p className="text-xs text-muted-foreground">
                      Track all money withdrawal requests submitted to admin.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {payoutRequests.length} Requests
                  </Badge>
                </div>

                {payoutRequests.length === 0 ? (
                  <div className="rounded-[20px] border border-dashed border-border bg-muted/20 py-12 text-center text-sm text-muted-foreground">
                    <Send className="size-8 mx-auto mb-2 opacity-40" />
                    No money requests submitted yet.
                    <br />
                    Use the <strong>"Request Money"</strong> button to request payout when your projects are completed.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                    {payoutRequests.map((req) => (
                      <div
                        key={req.id}
                        className="rounded-[18px] border border-border bg-card p-4 space-y-2 hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {req.project?.title || "General Payout Request"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Requested on {formatDateLabel(req.createdAt)}
                            </p>
                          </div>
                          <PayoutStatusBadge status={req.status} />
                        </div>

                        <div className="flex items-center justify-between border-t border-border/60 pt-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Amount: </span>
                            <span className="font-bold text-foreground">{formatINR(req.amount)}</span>
                          </div>
                          <div className="text-muted-foreground">
                            {req.upiId ? (
                              <span>UPI: {req.upiId}</span>
                            ) : req.accountNumber ? (
                              <span>A/C: {req.accountNumber}</span>
                            ) : null}
                          </div>
                        </div>

                        {req.adminNote && (
                          <div className="rounded-lg bg-muted/60 p-2.5 text-xs text-muted-foreground border border-border/40">
                            <span className="font-semibold text-foreground">Admin Note: </span>
                            {req.adminNote}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Monthly Trend Chart */}
              <div className="border-t border-border pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Earnings Trend (Last 3 Months)
                </p>
                <div className="h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrend} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#8f96a3", fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8f96a3", fontSize: 11 }} tickFormatter={formatCompactINR} width={46} />
                      <Tooltip cursor={{ stroke: "rgba(255,255,255,0.08)" }} content={<EarningsTooltip />} />
                      <Line type="monotone" dataKey="earnings" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: "var(--primary)", strokeWidth: 0 }} />
                    </LineChart>
                  </ResponsiveContainer>
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
