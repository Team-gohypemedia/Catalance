"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  CheckCircle2,
  Clock,
  FileText,
  XCircle,
  Search,
  ExternalLink,
  Trash2,
  Edit2,
  MessageSquare,
} from "lucide-react";
import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FreelancerTopBar } from "@/components/freelancer/FreelancerTopBar";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  // 2. Try to find Timeline
  const timelineMatch = content.match(
    /(?:Timeline|Duration|Time)[\s:_\-\n]*([^\n\.,]+)/i
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
    // Display budget as 30% less (Platform Fee deduction) for freelancer view?
    // User logic: proposal.amount ? Math.floor(Number(proposal.amount) * 0.7) : null
    budget: proposal.amount ? Math.floor(Number(proposal.amount) * 0.7) : null,
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

  // Status Badge Style (Outline to match screenshot)
  // Screenshot shows "ACCEPTED" in green outline/text on dark bg
  const badgeStyle = "bg-transparent border bg-opacity-10 dark:bg-opacity-10";

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

  // Tab State
  const [activeTab, setActiveTab] = useState("active");

  useEffect(() => {
    if (filter === "accepted") setActiveTab("active");
    else if (filter === "pending" || filter === "received")
      setActiveTab("pending");
    else if (filter === "rejected") setActiveTab("rejected");
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

  const handleStatusChange = async (id, nextStatus) => {
    setProcessingId(id);
    const apiStatus = nextStatus.toUpperCase();

    try {
      const response = await authFetch(`/proposals/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: apiStatus }),
      });

      if (!response.ok) throw new Error("Status update failed");

      // Update local state
      setProposals((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, status: normalizeProposalStatus(nextStatus) }
            : p
        )
      );

      // Update selected proposal if open
      if (selectedProposal?.id === id) {
        setSelectedProposal((prev) => ({
          ...prev,
          status: normalizeProposalStatus(nextStatus),
        }));
      }

      toast.success(`Proposal marked as ${nextStatus}`);
    } catch (error) {
      console.error("Status update error:", error);
      toast.error("Could not update status");
    } finally {
      setProcessingId(null);
    }
  };

  // Grouping
  const grouped = useMemo(() => {
    const groups = {
      active: [],
      pending: [],
      rejected: [],
    };

    proposals.forEach((p) => {
      if (p.status === "accepted") groups.active.push(p);
      else if (p.status === "rejected" || p.status === "awarded")
        groups.rejected.push(p);
      else groups.pending.push(p); // pending or received
    });

    return groups;
  }, [proposals]);

  return (
    <div className="space-y-6 p-6">
      <FreelancerTopBar />

      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">
            My Proposals
          </h2>
          <p className="text-muted-foreground">
            Manage your received offers and active contracts.
          </p>
        </div>

        <Tabs
          defaultValue="active"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="bg-transparent p-0 h-auto w-full justify-start gap-4 mb-6">
            <TabsTrigger
              value="active"
              className="rounded-md border border-transparent px-4 py-2 font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              Active Proposals
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              className="rounded-md border border-transparent px-4 py-2 font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-500 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              Pending Approval
            </TabsTrigger>
            <TabsTrigger
              value="rejected"
              className="rounded-md border border-transparent px-4 py-2 font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-rose-500 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              Rejected
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4 m-0">
            {isLoading ? (
              <Skeleton className="h-32 w-full rounded-xl" />
            ) : grouped.active.length > 0 ? (
              grouped.active.map((p) => (
                <ProposalRowCard
                  key={p.id}
                  proposal={p}
                  onOpen={setSelectedProposal}
                  onDelete={handleDelete}
                />
              ))
            ) : (
              <div className="text-center py-12 border border-dashed rounded-xl text-muted-foreground bg-card/40">
                No active contracts yet.
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4 m-0">
            {isLoading ? (
              <Skeleton className="h-32 w-full rounded-xl" />
            ) : grouped.pending.length > 0 ? (
              grouped.pending.map((p) => (
                <ProposalRowCard
                  key={p.id}
                  proposal={p}
                  onOpen={setSelectedProposal}
                  onDelete={handleDelete}
                />
              ))
            ) : (
              <div className="text-center py-12 border border-dashed rounded-xl text-muted-foreground bg-card/40">
                No pending proposals.
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4 m-0">
            {isLoading ? (
              <Skeleton className="h-32 w-full rounded-xl" />
            ) : grouped.rejected.length > 0 ? (
              grouped.rejected.map((p) => (
                <ProposalRowCard
                  key={p.id}
                  proposal={p}
                  onOpen={setSelectedProposal}
                  onDelete={handleDelete}
                />
              ))
            ) : (
              <div className="text-center py-12 border border-dashed rounded-xl text-muted-foreground bg-card/40">
                No rejected proposals.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog */}
      <Dialog
        open={!!selectedProposal}
        onOpenChange={(open) => !open && setSelectedProposal(null)}
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
          </div>

          <DialogFooter className="p-6 pt-2 border-t bg-card/50">
            <Button variant="outline" onClick={() => setSelectedProposal(null)}>
              Close
            </Button>
            {selectedProposal?.status === "pending" && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleStatusChange(selectedProposal.id, "rejected");
                    setSelectedProposal(null);
                  }}
                  disabled={processingId === selectedProposal.id}
                >
                  Reject
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => {
                    handleStatusChange(selectedProposal.id, "accepted");
                    setSelectedProposal(null);
                  }}
                  disabled={processingId === selectedProposal.id}
                >
                  {processingId === selectedProposal.id
                    ? "Accepting..."
                    : "Accept Proposal"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const FreelancerProposal = ({ filter = "all" }) => {
  return (
    <RoleAwareSidebar>
      <FreelancerProposalContent filter={filter} />
    </RoleAwareSidebar>
  );
};

export default FreelancerProposal;
