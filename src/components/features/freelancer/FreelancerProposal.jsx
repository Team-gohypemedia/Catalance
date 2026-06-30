"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Clock from "lucide-react/dist/esm/icons/clock";
import FileText from "lucide-react/dist/esm/icons/file-text";
import XCircle from "lucide-react/dist/esm/icons/x-circle";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FreelancerTopBar } from "@/components/features/freelancer/FreelancerTopBar";
import { toast } from "sonner";
import { useAuth } from "@/shared/context/AuthContext";
import { useNotifications } from "@/shared/context/NotificationContext";
import {
  formatINR,
  getFreelancerVisibleBudgetValue,
} from "@/shared/lib/currency";
import { cn } from "@/shared/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// --- Helper Components & Functions ---
const REJECTION_REASON_OPTIONS = [
  { value: "budget_not_fit", label: "Budget does not fit the project scope" },
  { value: "timeline_unrealistic", label: "Timeline is not realistic" },
  { value: "scope_unclear", label: "Project requirements are unclear" },
  { value: "skill_mismatch", label: "Project is outside my current expertise" },
  { value: "workload_capacity", label: "I do not have capacity right now" },
  { value: "custom", label: "Other (write a custom reason)" },
];

const CUSTOM_REJECTION_REASON_KEY = "custom";
const GENERIC_PROPOSAL_CATEGORIES = new Set(["project", "general"]);
const freelancerProposalPanelClassName =
  "rounded-[28px] border border-white/[0.06] bg-card";
const freelancerProposalMetricBlockClassName =
  "min-w-0 rounded-[14px] border border-white/[0.06] bg-card p-3 sm:p-3.5";
const freelancerProposalStatusClasses = {
  pending: "border-primary/35 bg-transparent text-primary",
  received: "border-primary/35 bg-transparent text-primary",
  accepted: "border-emerald-500/30 bg-transparent text-emerald-300",
  rejected: "border-destructive/30 bg-transparent text-destructive",
  awarded: "border-border bg-transparent text-muted-foreground",
};
const proposalDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const getFirstNonEmptyText = (...values) => {
  for (const value of values.flat()) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }

  return "";
};

const toDisplayTitleCase = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/(^|[\s/-])([a-z])/g, (match, prefix, char) => `${prefix}${char.toUpperCase()}`);

const resolveProposalBusinessName = (proposal = {}) =>
  getFirstNonEmptyText(
    proposal?.project?.businessName,
    proposal?.project?.companyName,
    proposal?.project?.brandName,
    proposal?.project?.owner?.companyName,
    proposal?.project?.owner?.businessName,
    proposal?.project?.owner?.brandName,
    proposal?.businessName,
    proposal?.companyName,
    proposal?.brandName,
  );

const resolveProposalServiceType = (proposal = {}) =>
  getFirstNonEmptyText(
    proposal?.project?.serviceType,
    proposal?.project?.service,
    proposal?.project?.serviceName,
    proposal?.project?.serviceKey,
    proposal?.project?.category,
    proposal?.serviceType,
    proposal?.service,
    proposal?.serviceName,
    proposal?.serviceKey,
    proposal?.category,
    proposal?.project?.sourceTitle,
    proposal?.project?.templateTitle,
  );

/**
 * Extracts key details (Budget, Timeline) from the proposal text content.
 * This ensures consistency between the card view and the details dialog.
 */
const extractProposalDetails = (content = "", budgetNum = null) => {
  let budget = "Not specified";
  let timeline = "Not specified";

  // 1. Try to find Budget
  // If we have a numeric budget from the API, use that formatted
  if (budgetNum) {
    budget = `₹${parseInt(budgetNum).toLocaleString()}`;
  } else {
    // Otherwise look in text
    const budgetMatch = content.match(
      /(?:Budget|Price|Cost)[\s:_\-\n]*((?:₹|INR|Rs\.?)?\s*[\d,]+(?:k)?)/i
    );
    if (budgetMatch) {
      budget = budgetMatch[1];
    }
  }

  const visibleBudget = getFreelancerVisibleBudgetValue(budget);
  if (visibleBudget !== null) {
    budget = formatINR(visibleBudget);
  }

  // 2. Try to find Timeline
  const timelineMatch = content.match(
    /(?:Timeline|Duration|Time)[\s:_\-\n]*([^\n.,]+)/i
  );
  if (timelineMatch) {
    timeline = timelineMatch[1].trim();
  }

  return { budget, timeline };
};

/**
 * Renders proposal content with basic markdown-like formatting.
 * - Lines starting with '## ' become bold headers.
 * - Lines starting with '- ' become bullet points.
 */
const ProposalContentRenderer = ({ content }) => {
  if (!content)
    return <p className="text-muted-foreground">No content provided.</p>;

  // Split content by newline to process each line
  const lines = content.split("\n");

  return (
    <div className="space-y-1 text-sm text-foreground leading-relaxed">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("## ")) {
          return (
            <h4 key={index} className="font-bold text-base mt-4 mb-2">
              {trimmed.replace(/^##\s+/, "")}
            </h4>
          );
        }
        if (trimmed.startsWith("- ")) {
          return (
            <div key={index} className="flex gap-2 ml-2">
              <span className="text-primary mt-1.5">•</span>
              <span>{trimmed.replace(/^- \s*/, "")}</span>
            </div>
          );
        }
        // Empty lines
        if (!trimmed) {
          return <br key={index} />;
        }
        // Regular paragraph text
        return <p key={index}>{line}</p>;
      })}
    </div>
  );
};

// Start of Main Component Helpers

const statusConfig = {
  pending: {
    label: "Pending",
    icon: Clock,
    className:
      "bg-primary/10/15 text-primary border-primary/20 dark:text-primary dark:border-primary/20/30",
    dotColor: "bg-primary/10",
  },
  received: {
    label: "Received",
    icon: FileText,
    className:
      "bg-blue-500/15 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-500/30",
    dotColor: "bg-blue-500",
  },
  accepted: {
    label: "Active",
    icon: CheckCircle2,
    className:
      "bg-emerald-500/15 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-500/30",
    dotColor: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    className:
      "bg-red-500/15 text-red-700 border-red-200 dark:text-red-400 dark:border-red-500/30",
    dotColor: "bg-red-500",
  },
  awarded: {
    label: "Awarded to Another",
    icon: XCircle,
    className:
      "bg-gray-500/15 text-gray-700 border-gray-200 dark:text-gray-400 dark:border-gray-500/30",
    dotColor: "bg-gray-500",
  },
};

const normalizeProposalStatus = (status = "") => {
  switch (status.toUpperCase()) {
    case "ACCEPTED":
      return "accepted";
    case "REJECTED":
      return "rejected";
    case "AWARDED":
      return "awarded";
    case "RECEIVED":
    case "PENDING":
      return "pending"; // Group received/pending together
    default:
      return "pending";
  }
};

const formatProposalSubmittedDate = (value) => {
  if (!value) return "";

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "";

  return proposalDateFormatter.format(parsedDate);
};

const mapApiProposal = (proposal = {}) => {
  const clientName =
    proposal.project?.owner?.fullName ||
    proposal.client?.fullName ||
    proposal.clientName ||
    proposal.senderName ||
    "Client";

  const clientAvatar =
    proposal.project?.owner?.avatar ||
    proposal.client?.avatar ||
    proposal.senderAvatar ||
    null;

  return {
    id: proposal.id,
    title: proposal.project?.title || proposal.title || "Proposal",
    businessName: resolveProposalBusinessName(proposal),
    serviceType: resolveProposalServiceType(proposal),
    category: proposal.project?.description
      ? "Project"
      : proposal.category || "General",
    status: normalizeProposalStatus(proposal.status || "PENDING"),
    clientName: clientName,
    clientAvatar: clientAvatar,
    recipientId: proposal.ownerId || "CLIENT", // Owner is client
    projectId: proposal.project?.id || null,
    submittedDate: formatProposalSubmittedDate(proposal.createdAt),
    proposalId: proposal.id
      ? `PRP-${proposal.id.slice(0, 6).toUpperCase()}`
      : `PRP-${Math.floor(Math.random() * 9000 + 1000)}`,
    budget: proposal.amount ?? proposal.budget ?? null,
    rejectionReason: String(proposal.rejectionReason || "").trim(),
    content:
      proposal.content ||
      proposal.description ||
      proposal.summary ||
      proposal.project?.description ||
      "",
  };
};

const ProposalRowCard = ({
  proposal,
  onOpen,
  onAccept,
  onReject,
  processingId,
}) => {
  const config = statusConfig[proposal.status] || statusConfig.pending;
  const { budget, timeline } = extractProposalDetails(
    proposal.content,
    proposal.budget
  );
  const isPendingProposal = proposal.status === "pending";
  const isProcessing = processingId === proposal.id;
  const rejectionReasonText = String(proposal.rejectionReason || "").trim();
  const showRejectionReason = proposal.status === "rejected" && Boolean(rejectionReasonText);
  
  const proposalServiceType = useMemo(() => {
    const normalizedServiceType = String(
      proposal.serviceType || proposal.category || "",
    ).trim();

    if (!normalizedServiceType) return "";
    if (GENERIC_PROPOSAL_CATEGORIES.has(normalizedServiceType.toLowerCase())) return "";

    return toDisplayTitleCase(normalizedServiceType);
  }, [proposal.serviceType, proposal.category]);

  const displayTitle = String(
    (proposal.businessName ? toDisplayTitleCase(proposal.businessName) : "") ||
      proposal.title ||
      proposalServiceType ||
      "Proposal",
  ).trim();

  const clientInitials = String(proposal.clientName || "Client")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <Card
      className={cn(
        "h-full w-full max-w-[360px] mx-auto shadow-none border border-border/55 dark:border-white/[0.06] rounded-[28px] bg-card p-6 transition-all duration-200 hover:-translate-y-1",
      )}
    >
      <CardContent className="p-0 flex flex-col h-full">
        {/* Header row: Status badge, Date, and Delete/Reject icon */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={cn(
              "inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
              proposal.status === "pending" || proposal.status === "received"
                ? "bg-[#FAF1EB] text-[#D9692A] border-transparent dark:bg-[#F9D949]/5 dark:text-[#F9D949] dark:border-[#F9D949]/30"
                : proposal.status === "accepted"
                ? "bg-emerald-500/10 text-emerald-600 border-transparent dark:bg-emerald-500/5 dark:text-emerald-400 dark:border-emerald-500/20"
                : "bg-red-500/10 text-red-600 border-transparent dark:bg-red-500/5 dark:text-red-400 dark:border-red-500/20"
            )}>
              {config.label}
            </span>
            {proposal.submittedDate && (
              <span className="text-sm font-medium text-muted-foreground">
                {proposal.submittedDate}
              </span>
            )}
          </div>
          {isPendingProposal && (
            <button
              type="button"
              onClick={() => onReject(proposal)}
              disabled={isProcessing}
              className="text-muted-foreground hover:text-rose-500 transition-colors p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50"
              title="Reject Proposal"
            >
              <Trash2 className="size-5 text-[#D9692A] dark:text-[#F9D949]" />
            </button>
          )}
        </div>

        {/* Project Title Section */}
        <div className="mt-3">
          <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground/80 block">
            Project Name
          </span>
          <h3 className="mt-1 text-[18px] font-semibold tracking-[-0.03em] text-foreground truncate">
            {displayTitle}
          </h3>
        </div>

        {/* Client & Service Row */}
        <div className="mt-4 flex items-center justify-between gap-3">
          {/* Left side: Client Info */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <Avatar className="size-9 shrink-0 border border-border">
              <AvatarImage src={proposal.clientAvatar} alt={proposal.clientName} />
              <AvatarFallback className="bg-[#FAF1EB] text-[#D9692A] dark:bg-white/[0.06] dark:text-[#F9D949] text-xs font-bold">
                {clientInitials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground leading-tight">
                {proposal.clientName}
              </p>
              <p className="truncate text-xs text-muted-foreground leading-tight mt-0.5">
                Client
              </p>
            </div>
          </div>

          {/* Right side: Service Info */}
          <div className="flex flex-col items-end min-w-0 max-w-[45%]">
            <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground/80 leading-none mb-1.5">
              Service
            </span>
            <span 
              className="text-right text-xs font-semibold text-[#D9692A] dark:text-[#F9D949] truncate w-full"
              title={proposalServiceType || "General"}
            >
              {proposalServiceType || "General"}
            </span>
          </div>
        </div>

        {/* Details Grid: Agreed Amount and Delivery */}
        <div className="grid grid-cols-2 gap-4 mt-6 py-5 border-t border-b border-border/55 dark:border-white/[0.06]">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground block">
              Agreed Amount
            </span>
            <div className="h-7 flex items-center mt-2">
              <span className="text-[18px] font-extrabold tracking-tight text-[#D9692A] dark:text-[#F9D949] leading-none">
                {budget}
              </span>
            </div>
          </div>
          <div className="border-l border-border/55 dark:border-white/[0.06] pl-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground block">
              Delivery
            </span>
            <div className="h-7 flex items-center gap-2 mt-2">
              <Clock className="size-4.5 text-[#D9692A] dark:text-[#F9D949] shrink-0" />
              <span className="text-base font-bold text-foreground leading-none truncate">
                {timeline || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {showRejectionReason && (
          <div className="mt-4 p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-500/80 block">
              Reason for Rejection
            </span>
            <p className="text-xs sm:text-sm font-medium text-red-600 dark:text-red-400 mt-1 line-clamp-2" title={rejectionReasonText}>
              {rejectionReasonText}
            </p>
          </div>
        )}

        {/* Actions Section */}
        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() => onOpen(proposal)}
            disabled={isProcessing}
            className="w-full h-12 rounded-full font-bold text-sm bg-[#D9692A] text-white hover:bg-[#C25820] dark:bg-[#F9D949] dark:text-[#1C1B1F] dark:hover:bg-[#E2C23B] transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            View Details
          </button>
          {isPendingProposal && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onAccept(proposal.id)}
                disabled={isProcessing}
                className="flex-1 h-11 rounded-full font-semibold text-sm transition-colors flex items-center justify-center border border-[#A3E2C9] bg-[#E8F8F2] text-[#0F8A5F] hover:bg-[#D4F2E5] dark:border-[#20684C] dark:bg-[#102A20] dark:text-[#52D49C] dark:hover:bg-[#163B2D] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? "Accepting..." : "Accept"}
              </button>
              <button
                type="button"
                onClick={() => onReject(proposal)}
                disabled={isProcessing}
                className="flex-1 h-11 rounded-full font-semibold text-sm transition-colors flex items-center justify-center border border-[#F5C7BC] bg-[#FCECE8] text-[#D9381E] hover:bg-[#F9DCD5] dark:border-[#682424] dark:bg-[#2C1616] dark:text-[#E26666] dark:hover:bg-[#3D1F1F] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const ProposalCardsCarousel = ({
  proposals,
  onOpen,
  onAccept,
  onReject,
  processingId,
}) => {
  const [proposalCarouselApi, setProposalCarouselApi] = useState(null);
  const [canGoToPreviousProposal, setCanGoToPreviousProposal] = useState(false);
  const [canGoToNextProposal, setCanGoToNextProposal] = useState(false);
  const [proposalCarouselSnapCount, setProposalCarouselSnapCount] = useState(0);
  const [activeProposalSnap, setActiveProposalSnap] = useState(0);

  useEffect(() => {
    if (!proposalCarouselApi) {
      setCanGoToPreviousProposal(false);
      setCanGoToNextProposal(false);
      setProposalCarouselSnapCount(0);
      setActiveProposalSnap(0);
      return undefined;
    }

    const syncProposalCarouselState = () => {
      setCanGoToPreviousProposal(proposalCarouselApi.canScrollPrev());
      setCanGoToNextProposal(proposalCarouselApi.canScrollNext());
      setProposalCarouselSnapCount(proposalCarouselApi.scrollSnapList().length);
      setActiveProposalSnap(proposalCarouselApi.selectedScrollSnap());
    };

    syncProposalCarouselState();
    proposalCarouselApi.on("select", syncProposalCarouselState);
    proposalCarouselApi.on("reInit", syncProposalCarouselState);

    return () => {
      proposalCarouselApi.off("select", syncProposalCarouselState);
      proposalCarouselApi.off("reInit", syncProposalCarouselState);
    };
  }, [proposalCarouselApi]);

  if (!proposals.length) return null;

  const shouldShowProposalCarouselControls = proposals.length > 4;
  const proposalCarouselDesktopControlClassName =
    "size-11 rounded-full border border-border bg-background text-foreground shadow-none hover:bg-background hover:text-foreground disabled:opacity-100 disabled:text-muted-foreground";
  const proposalCarouselMobileControlClassName =
    "size-8 rounded-full border border-border bg-background/95 text-foreground shadow-none hover:bg-background hover:text-foreground disabled:opacity-100 disabled:text-muted-foreground";

  return (
    <div className="w-full">
      <Carousel
        className="w-full"
        setApi={setProposalCarouselApi}
        opts={{
          align: "start",
          containScroll: "trimSnaps",
        }}
      >
        {shouldShowProposalCarouselControls ? (
          <>
            <div className="mb-5 hidden justify-end gap-2 md:flex">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={proposalCarouselDesktopControlClassName}
                onClick={() => proposalCarouselApi?.scrollPrev()}
                disabled={!canGoToPreviousProposal}
                aria-label="Show previous proposal"
              >
                <ChevronLeft className="size-5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={proposalCarouselDesktopControlClassName}
                onClick={() => proposalCarouselApi?.scrollNext()}
                disabled={!canGoToNextProposal}
                aria-label="Show next proposal"
              >
                <ChevronRight className="size-5" />
              </Button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className={`absolute left-0 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 md:hidden ${proposalCarouselMobileControlClassName}`}
              onClick={() => proposalCarouselApi?.scrollPrev()}
              disabled={!canGoToPreviousProposal}
              aria-label="Show previous proposal"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={`absolute right-0 top-1/2 z-10 translate-x-1/2 -translate-y-1/2 md:hidden ${proposalCarouselMobileControlClassName}`}
              onClick={() => proposalCarouselApi?.scrollNext()}
              disabled={!canGoToNextProposal}
              aria-label="Show next proposal"
            >
              <ChevronRight className="size-4" />
            </Button>
          </>
        ) : null}

        <CarouselContent className="ml-0 items-stretch gap-5 [backface-visibility:hidden] [will-change:transform]">
          {proposals.map((proposal) => (
            <CarouselItem
              key={proposal.id}
              className="pl-0 basis-full md:basis-[calc((100%-1.25rem)/2)] lg:basis-[calc((100%-2.5rem)/3)] xl:basis-[calc((100%-3.75rem)/4)]"
            >
              <ProposalRowCard
                proposal={proposal}
                onOpen={onOpen}
                onAccept={onAccept}
                onReject={onReject}
                processingId={processingId}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <FreelancerProposalCarouselDots
        count={proposalCarouselSnapCount}
        activeIndex={activeProposalSnap}
        onSelect={(index) => proposalCarouselApi?.scrollTo(index)}
      />
    </div>
  );
};

const FreelancerProposalCarouselDots = ({ count, activeIndex, onSelect }) => {
  if (count <= 1) return null;

  return (
    <div
      className="mt-2.5 flex items-center justify-center gap-2"
      aria-label="Proposals carousel pagination"
    >
      {Array.from({ length: count }, (_, index) => {
        const isActive = index === activeIndex;

        return (
          <button
            key={`freelancer-proposal-carousel-dot-${index}`}
            type="button"
            onClick={() => onSelect(index)}
            aria-label={`Go to proposal ${index + 1}`}
            aria-pressed={isActive}
            className={cn(
              "h-2.5 rounded-full transition-all duration-200",
              isActive
                ? "w-7 bg-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.32)]"
                : "w-2.5 bg-white/[0.14] hover:bg-white/[0.28]",
            )}
          />
        );
      })}
    </div>
  );
};

// Main Component

const FreelancerProposalContent = ({ filter = "all" }) => {
  const { authFetch, isAuthenticated } = useAuth();
  const { notifications } = useNotifications();
  const [proposals, setProposals] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [isRejectReasonStep, setIsRejectReasonStep] = useState(false);
  const [rejectReasonKey, setRejectReasonKey] = useState("");
  const [rejectCustomReason, setRejectCustomReason] = useState("");

  // Tab State
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    if (filter === "rejected") setActiveTab("rejected");
    else setActiveTab("pending");
  }, [filter]);

  const fetchProposals = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const response = await authFetch("/proposals");
      const payload = await response.json().catch(() => null);
      const remote = Array.isArray(payload?.data) ? payload.data : [];
      setProposals(remote.map(mapApiProposal));
    } catch (error) {
      console.error("Failed to load freelancer proposals:", error);
      toast.error("Failed to load proposals.");
    } finally {
      setIsLoading(false);
    }
  }, [authFetch, isAuthenticated]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  // Real-time updates logic (Optional, kept simpler)
  useEffect(() => {
    if (notifications.length) {
      // Could trigger refetch or optimistic update
      // For now, simple re-fetch on relevant notification
      const hasProposalUpdate = notifications.some(
        (n) => n.type === "proposal"
      );
      if (hasProposalUpdate) fetchProposals();
    }
  }, [notifications, fetchProposals]);

  const resetRejectReasonState = useCallback(() => {
    setIsRejectReasonStep(false);
    setRejectReasonKey("");
    setRejectCustomReason("");
  }, []);

  const handleOpenRejectFlow = useCallback(
    (proposal) => {
      setSelectedProposal(proposal);
      setIsRejectReasonStep(true);
      setRejectReasonKey("");
      setRejectCustomReason("");
    },
    []
  );

  const handleStatusChange = useCallback(
    async (id, nextStatus, rejectionReason = "", rejectionReasonKeyValue = "") => {
      setProcessingId(id);
      const apiStatus = nextStatus.toUpperCase();

      try {
        const bodyPayload = { status: apiStatus };
        if (apiStatus === "REJECTED") {
          bodyPayload.rejectionReason = String(rejectionReason || "").trim();
          bodyPayload.rejectionReasonKey = String(
            rejectionReasonKeyValue || ""
          ).trim();
        }

        const response = await authFetch(`/proposals/${id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyPayload),
        });

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => null);
          throw new Error(
            errorPayload?.message ||
              `Status update failed (${response.status})`
          );
        }

        // Update local state
        setProposals((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: normalizeProposalStatus(nextStatus),
                  rejectionReason:
                    apiStatus === "REJECTED"
                      ? String(rejectionReason || "").trim()
                      : p.rejectionReason,
                }
              : p
          )
        );

        // Update selected proposal if open
        setSelectedProposal((prev) =>
          prev?.id === id
            ? {
                ...prev,
                status: normalizeProposalStatus(nextStatus),
                rejectionReason:
                  apiStatus === "REJECTED"
                    ? String(rejectionReason || "").trim()
                    : prev?.rejectionReason || "",
              }
            : prev
        );

        toast.success(`Proposal marked as ${nextStatus}`);
      } catch (error) {
        console.error("Status update error:", error);
        toast.error(error?.message || "Could not update status");
      } finally {
        setProcessingId(null);
      }
    },
    [authFetch]
  );

  const handleConfirmReject = useCallback(async () => {
    if (!selectedProposal?.id) return;
    const selectedReason = REJECTION_REASON_OPTIONS.find(
      (option) => option.value === rejectReasonKey
    );
    if (!selectedReason) {
      toast.error("Please select a reason for rejection.");
      return;
    }

    const finalReason =
      rejectReasonKey === CUSTOM_REJECTION_REASON_KEY
        ? String(rejectCustomReason || "").trim()
        : selectedReason.label;

    if (!finalReason) {
      toast.error("Please add your custom rejection reason.");
      return;
    }

    await handleStatusChange(
      selectedProposal.id,
      "rejected",
      finalReason,
      rejectReasonKey
    );
    setSelectedProposal(null);
    resetRejectReasonState();
  }, [
    handleStatusChange,
    rejectCustomReason,
    rejectReasonKey,
    resetRejectReasonState,
    selectedProposal,
  ]);

  // Grouping
  const grouped = useMemo(() => {
    const groups = {
      pending: [],
      rejected: [],
    };

    proposals.forEach((p) => {
      if (p.status === "rejected" || p.status === "awarded") {
        groups.rejected.push(p);
        return;
      }

      if (p.status === "pending" || p.status === "received") {
        groups.pending.push(p);
      }
    });

    return groups;
  }, [proposals]);

  const tabCopy = {
    pending: {
      title: "Pending approvals",
      description:
        "Review client proposals waiting for your response and keep new opportunities moving.",
      emptyTitle: "No pending proposals",
      emptyDescription:
        "Client proposals awaiting your approval will show up here.",
    },
    rejected: {
      title: "Rejected proposals",
      description:
        "Keep a record of proposals you turned down so you can revisit them later if needed.",
      emptyTitle: "No rejected proposals",
      emptyDescription:
        "Rejected proposals will appear here once you decline a client offer.",
    },
  };

  return (
    <div className="flex-1 flex flex-col relative min-h-screen overflow-hidden bg-background transition-colors duration-300">
      <FreelancerTopBar />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 z-10 relative scroll-smooth">
        <div className="max-w-[1600px] mx-auto space-y-6">
          <Tabs
            defaultValue="pending"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full space-y-8"
          >
            <section>
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-[22px] sm:text-[clamp(2rem,4vw,3rem)] font-bold tracking-[-0.75px] text-foreground">
                    My Proposals
                  </h2>
                </div>

                <div className="flex justify-start lg:justify-end">
                  <TabsList className="inline-flex h-auto w-full max-w-[22rem] flex-nowrap items-stretch gap-1 rounded-[32px] border border-border bg-background p-1 shadow-none sm:w-auto sm:max-w-none sm:gap-2 sm:p-1.5">
                    {[
                      { value: "pending", label: "Received Proposals" },
                      { value: "rejected", label: "Rejected" },
                    ].map((item) => (
                      <TabsTrigger
                        key={item.value}
                        value={item.value}
                        className={cn(
                          "h-10 min-w-0 basis-0 flex-1 whitespace-nowrap rounded-full border border-transparent px-4 text-center text-[0.72rem] font-semibold tracking-[-0.01em] text-muted-foreground shadow-none transition hover:text-foreground sm:h-11 sm:basis-auto sm:flex-none sm:px-5 sm:text-[0.95rem] sm:tracking-normal data-[state=active]:!border-primary/70 data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:!shadow-none",
                          item.value === "pending" ? "sm:min-w-[11rem]" : "sm:min-w-[8.5rem]",
                        )}
                      >
                        {item.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              </div>
            </section>

            {["pending", "rejected"].map((tabValue) => (
              <TabsContent key={tabValue} value={tabValue} className="m-0">
                {(() => {
                  const tabItems = grouped[tabValue] || [];
                  const tabMeta = tabCopy[tabValue] || tabCopy.pending;

                  return isLoading ? (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton
                          key={index}
                          className="h-[30rem] w-full rounded-[32px]"
                        />
                      ))}
                    </div>
                  ) : tabItems.length > 0 ? (
                    tabItems.length > 4 ? (
                      <ProposalCardsCarousel
                        proposals={tabItems}
                        onOpen={setSelectedProposal}
                        onAccept={(id) => handleStatusChange(id, "accepted")}
                        onReject={handleOpenRejectFlow}
                        processingId={processingId}
                      />
                    ) : (
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {tabItems.map((proposal) => (
                          <ProposalRowCard
                            key={proposal.id}
                            proposal={proposal}
                            onOpen={setSelectedProposal}
                            onAccept={(id) => handleStatusChange(id, "accepted")}
                            onReject={handleOpenRejectFlow}
                            processingId={processingId}
                          />
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="rounded-3xl border border-dashed border-border/70 bg-card/40 px-6 py-14 text-center">
                      <h3 className="text-lg font-semibold text-foreground">
                        {tabMeta.emptyTitle}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {tabMeta.emptyDescription}
                      </p>
                    </div>
                  );
                })()}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>

      {/* Dialog */}
      <Dialog
        open={!!selectedProposal}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedProposal(null);
            resetRejectReasonState();
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              {selectedProposal?.title}
              <Badge
                variant="outline"
                className={`text-xs px-2 py-0.5 border ${
                  statusConfig[selectedProposal?.status]?.className
                }`}
              >
                {statusConfig[selectedProposal?.status]?.label}
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground mt-1">
              Proposal from {selectedProposal?.clientName}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            {/* Header Metrics */}
            <div className="flex flex-wrap gap-4">
              <Badge variant="secondary" className="px-3 py-1.5 text-sm gap-2">
                Budget:{" "}
                <span className="font-bold">
                  {
                    extractProposalDetails(
                      selectedProposal?.content,
                      selectedProposal?.budget
                    ).budget
                  }
                </span>
              </Badge>
              <Badge variant="secondary" className="px-3 py-1.5 text-sm gap-2">
                Timeline:{" "}
                <span className="font-bold">
                  {extractProposalDetails(selectedProposal?.content).timeline}
                </span>
              </Badge>
              <Badge variant="outline" className="px-3 py-1.5 text-sm gap-2">
                Date: {selectedProposal?.submittedDate}
              </Badge>
            </div>

            {/* Content */}
            {!isRejectReasonStep && (
              <div className="bg-muted/50 p-4 rounded-lg border border-border/50">
                <h4 className="text-base font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Proposal Details
                </h4>
                <ProposalContentRenderer content={selectedProposal?.content} />
              </div>
            )}

            {selectedProposal?.status === "rejected" &&
            selectedProposal?.rejectionReason ? (
              <div className="rounded-lg border border-red-500/25 bg-red-500/10 p-4">
                <h4 className="text-sm font-semibold text-red-800 dark:text-red-200">
                  Rejection reason
                </h4>
                <p className="mt-1 text-sm text-red-700 dark:text-red-100">
                  {selectedProposal.rejectionReason}
                </p>
              </div>
            ) : null}

            {selectedProposal?.status === "pending" && isRejectReasonStep ? (
              <div className="rounded-lg border border-border/60 bg-card/60 p-4 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Why are you rejecting this proposal?
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Choose one reason or select custom and write your own.
                  </p>
                </div>

                <RadioGroup
                  value={rejectReasonKey}
                  onValueChange={setRejectReasonKey}
                  className="space-y-2"
                >
                  {REJECTION_REASON_OPTIONS.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-start gap-2 rounded-md border border-border/50 px-3 py-2"
                    >
                      <RadioGroupItem
                        id={`reject-reason-${option.value}`}
                        value={option.value}
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor={`reject-reason-${option.value}`}
                        className="cursor-pointer text-sm text-foreground"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {rejectReasonKey === CUSTOM_REJECTION_REASON_KEY ? (
                  <div className="space-y-2">
                    <Label htmlFor="reject-custom-reason" className="text-xs">
                      Custom message
                    </Label>
                    <Textarea
                      id="reject-custom-reason"
                      rows={3}
                      maxLength={300}
                      value={rejectCustomReason}
                      onChange={(event) =>
                        setRejectCustomReason(event.target.value)
                      }
                      placeholder="Write your reason..."
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <DialogFooter className="p-6 pt-2 border-t bg-card/50">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedProposal(null);
                resetRejectReasonState();
              }}
            >
              Close
            </Button>
            {selectedProposal?.status === "pending" && (
              <>
                {isRejectReasonStep ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={resetRejectReasonState}
                      disabled={processingId === selectedProposal.id}
                    >
                      Back
                    </Button>
                    <Button
                      className="border border-red-700 bg-transparent text-red-400 shadow-none hover:bg-red-500/10 hover:text-red-300"
                      onClick={handleConfirmReject}
                      disabled={processingId === selectedProposal.id}
                    >
                      {processingId === selectedProposal.id
                        ? "Rejecting..."
                        : "Confirm Reject"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      className="border border-red-700 bg-transparent text-red-400 shadow-none hover:bg-red-500/10 hover:text-red-300"
                      onClick={() => setIsRejectReasonStep(true)}
                      disabled={processingId === selectedProposal.id}
                    >
                      Reject
                    </Button>
                    <Button
                      className="border border-emerald-600 bg-transparent text-emerald-400 shadow-none hover:bg-emerald-500/10 hover:text-emerald-300"
                      onClick={() => {
                        handleStatusChange(selectedProposal.id, "accepted");
                        setSelectedProposal(null);
                        resetRejectReasonState();
                      }}
                      disabled={processingId === selectedProposal.id}
                    >
                      {processingId === selectedProposal.id
                        ? "Accepting..."
                        : "Accept Proposal"}
                    </Button>
                  </>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const FreelancerProposal = ({ filter = "all" }) => (
  <FreelancerProposalContent filter={filter} />
);

export default FreelancerProposal;
