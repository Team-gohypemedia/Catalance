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
import { FreelancerTopBar } from "@/components/features/freelancer/FreelancerTopBar";
import { toast } from "sonner";
import { useAuth } from "@/shared/context/AuthContext";
import { useNotifications } from "@/shared/context/NotificationContext";
import {
  formatINR,
  getFreelancerVisibleBudgetValue,
} from "@/shared/lib/currency";
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

const ProposalRowCard = ({ proposal, onOpen, onDelete }) => {
  const config = statusConfig[proposal.status] || statusConfig.pending;
  const { budget, timeline } = extractProposalDetails(
    proposal.content,
    proposal.budget
  );

  return (
    <div className="group relative flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-xl border border-border/50 bg-card/40 hover:bg-card hover:border-primary/20 transition-all duration-300 shadow-sm">
      {/* Left Content Section */}
      <div className="flex-1 space-y-4 w-full">
        {/* Top Row: Badge & Date */}
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={`uppercase text-[10px] font-bold tracking-wider px-2 py-1 rounded-md ${config.className.replace(
              "bg-",
              "bg-opacity-10 "
            )}`}
          >
            {config.label}
          </Badge>
          <span className="text-xs text-muted-foreground font-medium">
            {proposal.submittedDate}
          </span>
        </div>

        {/* Title & Client */}
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-foreground tracking-tight">
            {proposal.title}
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Client:</span>
            <div className="flex items-center gap-1.5 text-foreground font-medium">
              <Avatar className="h-5 w-5">
                <AvatarImage src={proposal.clientAvatar} />
                <AvatarFallback className="text-[10px]">
                  {proposal.clientName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {proposal.clientName}
            </div>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="flex flex-wrap items-center gap-x-12 gap-y-4 pt-2">
          {/* Agreed Amount */}
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              Agreed Amount
            </p>
            <p className="text-base font-bold text-foreground">{budget}</p>
          </div>

          {/* Project Status (Mapped from proposal status) */}
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              Project Status
            </p>
            <p
              className={`text-base font-medium ${
                proposal.status === "accepted"
                  ? "text-blue-400"
                  : "text-foreground"
              }`}
            >
              {proposal.status === "accepted" ? "In Progress" : config.label}
            </p>
          </div>

          {/* Delivery */}
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              Delivery
            </p>
            <p className="text-base font-bold text-foreground">{timeline}</p>
          </div>
        </div>

        {proposal.status === "rejected" && proposal.rejectionReason ? (
          <div className="rounded-md border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            Reason: {proposal.rejectionReason}
          </div>
        ) : null}
      </div>

      {/* Right Action Section */}
      <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
        <Button
          className="w-full md:w-auto bg-amber-400 hover:bg-amber-500 text-black font-semibold rounded-lg px-6"
          onClick={() => onOpen(proposal)}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          View Details
        </Button>
        {onDelete && proposal.status !== "accepted" && (
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive transition-colors hidden md:flex"
            onClick={() => onDelete(proposal.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
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
                  <TabsList className="inline-flex h-auto flex-wrap gap-2 rounded-full border border-white/[0.08] bg-accent p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    {[
                      { value: "pending", label: "Pending Approval" },
                      { value: "rejected", label: "Rejected" },
                    ].map((item) => (
                      <TabsTrigger
                        key={item.value}
                        value={item.value}
                        className="h-11 rounded-full border border-transparent px-5 text-[0.95rem] font-semibold text-muted-foreground shadow-none transition hover:text-foreground data-[state=active]:!border-primary/70 data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:!shadow-none"
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

