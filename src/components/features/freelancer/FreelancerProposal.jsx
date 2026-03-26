"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Clock from "lucide-react/dist/esm/icons/clock";
import FileText from "lucide-react/dist/esm/icons/file-text";
import XCircle from "lucide-react/dist/esm/icons/x-circle";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
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
  "rounded-[24px] border border-[#1e293b] bg-[#303030]/40 backdrop-blur-[6px]";
const freelancerProposalStatusClasses = {
  pending: "border-[#856715] bg-[#241c0b] text-[#f4c128]",
  received: "border-[#856715] bg-[#241c0b] text-[#f4c128]",
  accepted: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  rejected: "border-[#5b2a2a] bg-[#261617] text-[#f49e9e]",
  awarded: "border-white/10 bg-[#2f3135] text-[#d4d7dd]",
};

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
      "bg-yellow-500/15 text-yellow-700 border-yellow-200 dark:text-yellow-400 dark:border-yellow-500/30",
    dotColor: "bg-yellow-500",
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
    category: proposal.project?.description
      ? "Project"
      : proposal.category || "General",
    status: normalizeProposalStatus(proposal.status || "PENDING"),
    clientName: clientName,
    clientAvatar: clientAvatar,
    recipientId: proposal.ownerId || "CLIENT", // Owner is client
    projectId: proposal.project?.id || null,
    submittedDate: proposal.createdAt
      ? new Date(proposal.createdAt).toLocaleDateString()
      : "", // No static fallback
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
  onDelete,
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
  const canDeleteProposal = typeof onDelete === "function" && proposal.status !== "accepted";
  const rejectionReasonText = String(proposal.rejectionReason || "").trim();
  const showRejectionReason = proposal.status === "rejected" && Boolean(rejectionReasonText);
  const serviceLabel = useMemo(() => {
    const normalizedCategory = String(proposal.category || "").trim();
    if (!normalizedCategory) return "";
    if (GENERIC_PROPOSAL_CATEGORIES.has(normalizedCategory.toLowerCase())) return "";
    return normalizedCategory;
  }, [proposal.category]);
  const clientInitials = String(proposal.clientName || "Client")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <Card className={cn("shadow-none", freelancerProposalPanelClassName)}>
      <CardContent className="p-0">
        <div className="space-y-6 px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-5">
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium uppercase tracking-[0.16em] text-[#94a3b8]">
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
                    freelancerProposalStatusClasses[proposal.status] ||
                      freelancerProposalStatusClasses.pending,
                  )}
                >
                  {config.label}
                </Badge>
                <span>{proposal.submittedDate}</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-[2rem] font-semibold tracking-[-0.04em] text-white sm:text-[2.2rem]">
                  {proposal.title}
                </h3>
                {serviceLabel ? (
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#8d96a7]">
                    {serviceLabel}
                  </p>
                ) : null}
                {showRejectionReason ? (
                  <div className="pt-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-300/80">
                      Reason
                    </p>
                    <p
                      className="mt-1 max-w-[20rem] text-sm font-medium leading-6 text-rose-100"
                      title={rejectionReasonText}
                    >
                      {rejectionReasonText}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            {canDeleteProposal ? (
              <div className="flex shrink-0 flex-col items-end gap-3 self-start">
                {canDeleteProposal ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full text-[#8d96a7] hover:bg-white/5 hover:text-white"
                    onClick={() => onDelete(proposal.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-6 border-t border-white/6 pt-6 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-start">
            <div className="col-span-2 space-y-2 lg:col-span-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                Client
              </p>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border border-white/10">
                  <AvatarImage src={proposal.clientAvatar} alt={proposal.clientName} />
                  <AvatarFallback className="bg-[#111214] text-sm font-bold text-primary">
                    {clientInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-white">
                    {proposal.clientName}
                  </p>
                  <p className="text-base text-[#a5acc0]">Client</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                Agreed Amount
              </p>
              <div className="text-[1.9rem] font-semibold tracking-[-0.03em] text-primary">
                {budget}
              </div>
            </div>

            <div className="space-y-2 text-right lg:text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                Delivery
              </p>
              <div className="inline-flex items-center justify-end gap-2 text-[1.9rem] font-semibold tracking-[-0.03em] text-white lg:justify-start">
                <Clock className="h-4.5 w-4.5 text-[#97a1b2]" />
                <span className="capitalize">{timeline}</span>
              </div>
            </div>

            <div className="col-span-2 flex w-full flex-col gap-3 lg:col-span-1 lg:w-[12rem] lg:items-end">
              <Button
                className="h-11 rounded-full bg-primary px-6 font-semibold text-[#141414] hover:bg-primary/90 lg:w-full"
                onClick={() => onOpen(proposal)}
              >
                <ExternalLink className="mr-2 h-3.5 w-3.5" />
                View Details
              </Button>

              {isPendingProposal ? (
                <div className="flex w-full flex-col gap-2">
                  <Button
                    className="h-11 w-full rounded-full bg-emerald-500 px-6 font-semibold text-black hover:bg-emerald-400"
                    onClick={() => onAccept(proposal.id)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Accepting..." : "Accept Proposal"}
                  </Button>
                  <Button
                    className="h-11 w-full rounded-full border border-rose-600 bg-rose-600 px-6 font-semibold text-white hover:border-rose-500 hover:bg-rose-500"
                    onClick={() => onReject(proposal)}
                    disabled={isProcessing}
                  >
                    Reject Proposal
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
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

  const handleDelete = useCallback(
    async (id) => {
      try {
        await authFetch(`/proposals/${id}`, { method: "DELETE" });
        setProposals((prev) => prev.filter((p) => p.id !== id));
        toast.success("Proposal deleted");
        if (selectedProposal?.id === id) setSelectedProposal(null);
      } catch (error) {
        console.error("Delete failed:", error);
        toast.error("Could not delete proposal");
      }
    },
    [authFetch, selectedProposal]
  );

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
    <div className="flex-1 flex flex-col relative h-full overflow-hidden bg-background transition-colors duration-300">
      <FreelancerTopBar />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 z-10 relative scroll-smooth">
        <div className="max-w-[1600px] mx-auto space-y-6">
          <Tabs
            defaultValue="pending"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full space-y-8"
          >
            <section className="space-y-4">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-[-0.75px] text-foreground">
                    My Proposals
                  </h2>
                  <p className="mt-2 max-w-[34rem] text-sm text-muted-foreground">
                    Track proposals waiting for your approval and keep a record of
                    the ones you rejected.
                  </p>
                </div>

                <div className="flex justify-start lg:justify-end">
                  <TabsList className="inline-flex h-auto w-full max-w-[22rem] flex-nowrap items-stretch gap-1 rounded-[32px] border border-white/[0.08] bg-accent p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:w-auto sm:max-w-none sm:gap-2 sm:p-1.5">
                    {[
                      { value: "pending", label: "Pending Approval" },
                      { value: "rejected", label: "Rejected" },
                    ].map((item) => (
                      <TabsTrigger
                        key={item.value}
                        value={item.value}
                        className={cn(
                          "h-10 min-w-0 basis-0 flex-1 whitespace-nowrap rounded-full border border-transparent px-4 text-center text-[0.72rem] font-semibold tracking-[-0.01em] text-[#a3a6ad] shadow-none transition hover:text-white sm:h-11 sm:basis-auto sm:flex-none sm:px-5 sm:text-[0.95rem] sm:tracking-normal data-[state=active]:!border-primary/70 data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:!shadow-none",
                          item.value === "pending" ? "sm:min-w-[11rem]" : "sm:min-w-[8.5rem]",
                        )}
                      >
                        {item.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              </div>

              <div className="flex min-h-7 flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {activeTab === "pending" && grouped.pending.length > 0 ? (
                  <span>
                    {grouped.pending.length} proposal
                    {grouped.pending.length === 1 ? "" : "s"} awaiting your decision.
                  </span>
                ) : null}
                {activeTab === "rejected" && grouped.rejected.length > 0 ? (
                  <span>
                    {grouped.rejected.length} rejected proposal
                    {grouped.rejected.length === 1 ? "" : "s"} kept for reference.
                  </span>
                ) : null}
              </div>
            </section>

            {["pending", "rejected"].map((tabValue) => (
              <TabsContent key={tabValue} value={tabValue} className="m-0">
                {(() => {
                  const tabItems = grouped[tabValue] || [];
                  const tabMeta = tabCopy[tabValue] || tabCopy.pending;

                  return isLoading ? (
                    <Skeleton className="h-32 w-full rounded-xl" />
                  ) : tabItems.length > 0 ? (
                    <div className="space-y-6">
                      {tabItems.map((proposal) => (
                        <ProposalRowCard
                          key={proposal.id}
                          proposal={proposal}
                          onOpen={setSelectedProposal}
                          onDelete={handleDelete}
                          onAccept={(id) => handleStatusChange(id, "accepted")}
                          onReject={handleOpenRejectFlow}
                          processingId={processingId}
                        />
                      ))}
                    </div>
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
            <div className="bg-muted/50 p-4 rounded-lg border border-border/50">
              <h4 className="text-base font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Proposal Details
              </h4>
              <ProposalContentRenderer content={selectedProposal?.content} />
            </div>

            {selectedProposal?.status === "rejected" &&
            selectedProposal?.rejectionReason ? (
              <div className="rounded-lg border border-red-500/25 bg-red-500/10 p-4">
                <h4 className="text-sm font-semibold text-red-200">
                  Rejection reason
                </h4>
                <p className="mt-1 text-sm text-red-100">
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
                      variant="destructive"
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
                      variant="destructive"
                      onClick={() => setIsRejectReasonStep(true)}
                      disabled={processingId === selectedProposal.id}
                    >
                      Reject
                    </Button>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
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

