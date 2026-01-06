"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Trash2, ExternalLink, MessageSquare } from "lucide-react";
import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientTopBar } from "@/components/client/ClientTopBar";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";

// Helper to format currency
const formatBudget = (val) => {
  if (!val) return "Not set";
  const num = parseInt(val.toString().replace(/[^0-9]/g, ""), 10);
  if (isNaN(num)) return val;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
};

// Helper to render markdown-like content
const ProposalContentRenderer = ({ content }) => {
  if (!content)
    return <p className="text-muted-foreground">No content available.</p>;

  return (
    <div className="space-y-1 text-sm leading-6 text-foreground">
      {content.split("\n").map((line, i) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("##")) {
          return (
            <h3 key={i} className="text-base font-bold mt-4 mb-2 text-primary">
              {trimmed.replace(/^#+\s*/, "")}
            </h3>
          );
        }
        if (trimmed.startsWith("-")) {
          return (
            <div key={i} className="flex gap-2 ml-1">
              <span className="text-muted-foreground">•</span>
              <span>{trimmed.replace(/^-\s*/, "")}</span>
            </div>
          );
        }
        if (!trimmed) return <div key={i} className="h-2" />;
        return <p key={i}>{trimmed}</p>;
      })}
    </div>
  );
};

// Helper to extract details from proposal
const extractProposalDetails = (proposal) => {
  // Budget
  let budget = proposal.budget || proposal.project?.budget || "Not set";

  // Timeline/Delivery
  let delivery = proposal.timeline || proposal.project?.timeline || "Not set";
  if (delivery === "Not set" && proposal.content) {
    // Try to extract from content if simple regex matches
    const timelineMatch = proposal.content.match(
      /Timeline[:\s\-]*(.+?)(?:\n|$)/i
    );
    if (timelineMatch) delivery = timelineMatch[1].trim();
  }

  return {
    budget: formatBudget(budget),
    delivery: delivery,
    statusDisplay:
      proposal.status === "accepted" ? "In Progress" : "Pending Review",
  };
};

const ProposalRowCard = ({ proposal, onDelete, onOpen, onChat }) => {
  const details = extractProposalDetails(proposal);

  const statusColors = {
    accepted: "bg-emerald-500/10 text-emerald-500 border-emerald-200/40",
    sent: "bg-blue-500/10 text-blue-500 border-blue-200/40",
    pending: "bg-amber-500/10 text-amber-500 border-amber-200/40",
    rejected: "bg-red-500/10 text-red-500 border-red-200/40",
  };

  const statusLabels = {
    accepted: "ACCEPTED",
    sent: "SENT",
    pending: "PENDING",
    rejected: "REJECTED",
  };

  return (
    <Card className="group border-border/50 bg-card/60 backdrop-blur hover:border-border transition-all duration-200 mb-4">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
          {/* Main Info */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={`border font-semibold tracking-wider text-[10px] px-2 py-0.5 h-6 rounded uppercase ${
                  statusColors[proposal.status] || statusColors.pending
                }`}
              >
                {statusLabels[proposal.status] || "PENDING"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {proposal.submittedDate}
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-foreground mb-1">
                {proposal.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Freelancer:</span>
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary font-bold">
                    {proposal.recipientName.charAt(0)}
                  </div>
                  {proposal.recipientName}
                </span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="flex flex-wrap gap-4 md:gap-12 pt-2">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                  AGREED AMOUNT
                </p>
                <p className="font-bold text-foreground font-mono">
                  {details.budget}
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                  PROJECT STATUS
                </p>
                <p
                  className={`font-medium ${
                    proposal.status === "accepted"
                      ? "text-blue-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {details.statusDisplay}
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                  DELIVERY
                </p>
                <p className="font-medium text-foreground">
                  {details.delivery}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 min-w-[170px]">
            <Button
              className="w-full bg-amber-400 hover:bg-amber-500 text-black font-semibold border-none rounded-lg"
              onClick={() => onOpen?.(proposal)}
            >
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                View Details
              </div>
            </Button>

            {onDelete && (
              <Button
                className="w-full bg-card hover:bg-card/80 border border-border/40 text-foreground hover:text-destructive rounded-lg"
                onClick={() => onDelete(proposal.id)}
              >
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </div>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const mapApiProposal = (proposal = {}) => {
  const freelancerName =
    proposal.freelancer?.fullName ||
    proposal.freelancer?.name ||
    proposal.freelancer?.email ||
    proposal.freelancerName ||
    "Freelancer";
  const freelancerAvatar = proposal.freelancer?.avatar || proposal.avatar || "";

  return {
    id: proposal.id,
    title: proposal.project?.title || proposal.title || "Proposal",
    category: proposal.project?.description
      ? "Project"
      : proposal.category || "General",
    status: normalizeProposalStatus(proposal.status || "PENDING"),
    recipientName: freelancerName,
    recipientId: proposal.freelancer?.id || "FREELANCER",
    projectId: proposal.projectId || proposal.project?.id || null,
    freelancerId: proposal.freelancer?.id || proposal.freelancerId || null,
    submittedDate: proposal.createdAt
      ? new Date(proposal.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "No Date",
    avatar: freelancerAvatar,
    content:
      proposal.content ||
      proposal.description ||
      proposal.summary ||
      proposal.project?.description ||
      "",
    budget: proposal.budget || proposal.project?.budget,
    timeline: proposal.timeline || proposal.project?.timeline,
  };
};

const normalizeProposalStatus = (status = "") => {
  switch (status.toUpperCase()) {
    case "ACCEPTED":
      return "accepted";
    case "REJECTED":
    case "DECLINED":
      return "rejected";
    case "PENDING":
      return "pending";
    default:
      return "sent";
  }
};

const ClientProposalContent = () => {
  const { isAuthenticated, authFetch, user } = useAuth();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [activeProposal, setActiveProposal] = useState(null);
  const [isViewing, setIsViewing] = useState(false);
  const [isLoadingProposal, setIsLoadingProposal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");

  const fetchProposals = useCallback(async () => {
    try {
      const response = await authFetch("/proposals?as=owner");
      const payload = await response.json().catch(() => null);
      const remote = Array.isArray(payload?.data) ? payload.data : [];
      const remoteNormalized = remote.map(mapApiProposal);

      // Remove duplicates
      const uniqueById = remoteNormalized.reduce(
        (acc, proposal) => {
          const key =
            proposal.id || `${proposal.projectId}-${proposal.freelancerId}`;
          if (!key || acc.seen.has(key)) return acc;
          acc.seen.add(key);
          acc.list.push(proposal);
          return acc;
        },
        { seen: new Set(), list: [] }
      ).list;

      setProposals(uniqueById);
    } catch (error) {
      console.error("Failed to load proposals from API:", error);
    } finally {
      setIsLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    const safeFetch = async () => {
      if (!isMounted) return;
      await fetchProposals();
    };

    safeFetch();
    const intervalId = window.setInterval(safeFetch, 6000);

    return () => {
      isMounted = false;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [fetchProposals, isAuthenticated]);

  const handleDelete = useCallback(
    async (id) => {
      try {
        const response = await authFetch(`/proposals/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Unable to delete proposal.");
        setProposals((prev) => prev.filter((p) => p.id !== id));
        toast.success("Proposal deleted.");
      } catch (error) {
        toast.error("Unable to delete proposal right now.");
      }
    },
    [authFetch]
  );

  const handleChat = useCallback(
    (proposal) => {
      if (!proposal.projectId || !proposal.freelancerId) return;
      // Navigate to messages
      navigate(
        `/client/messages?projectId=${proposal.projectId}&freelancerId=${proposal.freelancerId}`
      );
    },
    [navigate]
  );

  const grouped = useMemo(() => {
    return proposals.reduce(
      (acc, proposal) => {
        if (proposal.status === "accepted") {
          acc.active.push(proposal);
        } else if (proposal.status === "rejected") {
          acc.rejected.push(proposal);
        } else {
          acc.pending.push(proposal);
        }
        return acc;
      },
      { active: [], pending: [], rejected: [] }
    );
  }, [proposals]);

  const handleOpenProposal = useCallback(
    async (proposal) => {
      setIsViewing(true);
      setActiveProposal(proposal);

      if (proposal?.content && proposal?.budget) return; // Already have details
      if (!proposal?.id) return;

      try {
        setIsLoadingProposal(true);
        const response = await authFetch(`/proposals/${proposal.id}`);
        const payload = await response.json().catch(() => null);
        const mapped = payload?.data ? mapApiProposal(payload.data) : null;
        if (mapped) {
          setActiveProposal(mapped);
          setProposals((prev) =>
            prev.map((item) => (item.id === mapped.id ? mapped : item))
          );
        }
      } catch (error) {
        console.error("Failed to load details", error);
      } finally {
        setIsLoadingProposal(false);
      }
    },
    [authFetch]
  );

  return (
    <div className="space-y-8 p-6 w-full max-w-7xl mx-auto">
      <ClientTopBar />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Accepted Proposals
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your active contracts and communicate with clients.
            </p>
          </div>
          {/* Filter/Sort removed */}
        </div>

        {/* Tabs */}
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

          <div className="mt-6">
            <TabsContent value="active" className="m-0 space-y-4">
              {isLoading ? (
                [1, 2].map((i) => (
                  <Skeleton key={i} className="h-40 w-full rounded-xl" />
                ))
              ) : grouped.active.length ? (
                grouped.active.map((p) => (
                  <ProposalRowCard
                    key={p.id}
                    proposal={p}
                    onOpen={handleOpenProposal}
                    onChat={handleChat}
                  />
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border/60 bg-card/40 px-4 py-12 text-center text-muted-foreground">
                  No active contracts found.
                </div>
              )}
            </TabsContent>

            <TabsContent value="pending" className="m-0 space-y-4">
              {isLoading ? (
                [1, 2].map((i) => (
                  <Skeleton key={i} className="h-40 w-full rounded-xl" />
                ))
              ) : grouped.pending.length ? (
                grouped.pending.map((p) => (
                  <ProposalRowCard
                    key={p.id}
                    proposal={p}
                    onOpen={handleOpenProposal}
                    onDelete={handleDelete}
                  />
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border/60 bg-card/40 px-4 py-12 text-center text-muted-foreground">
                  No pending proposals.
                </div>
              )}
            </TabsContent>

            <TabsContent value="rejected" className="m-0 space-y-4">
              {isLoading ? (
                [1, 2].map((i) => (
                  <Skeleton key={i} className="h-40 w-full rounded-xl" />
                ))
              ) : grouped.rejected.length ? (
                grouped.rejected.map((p) => (
                  <ProposalRowCard
                    key={p.id}
                    proposal={p}
                    onOpen={handleOpenProposal}
                    onDelete={handleDelete}
                  />
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border/60 bg-card/40 px-4 py-12 text-center text-muted-foreground">
                  No rejected proposals.
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <Dialog
        open={isViewing}
        onOpenChange={(open) => {
          setIsViewing(open);
          if (!open) setActiveProposal(null);
        }}
      >
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] p-0 overflow-hidden">
          <div className="p-5 border-b border-border/60">
            <DialogTitle className="text-xl font-semibold">
              {activeProposal?.title || "Proposal"}
              {activeProposal?.status && (
                <Badge variant="outline" className="ml-3 uppercase text-[10px]">
                  {activeProposal.status}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Submitted by{" "}
              <span className="font-medium text-foreground">
                {activeProposal?.recipientName}
              </span>{" "}
              on {activeProposal?.submittedDate}
            </DialogDescription>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-muted/30 rounded-lg border border-border/40">
              <div>
                <p className="text-xs uppercase text-muted-foreground font-semibold">
                  Budget
                </p>
                <p className="font-mono font-medium text-lg">
                  {activeProposal
                    ? extractProposalDetails(activeProposal).budget
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground font-semibold">
                  Timeline
                </p>
                <p className="font-medium text-lg">
                  {activeProposal
                    ? extractProposalDetails(activeProposal).delivery
                    : "Not set"}
                </p>
              </div>
            </div>

            <h4 className="font-semibold mb-2">Proposal Details</h4>
            <div className="max-h-[50vh] overflow-y-auto pr-2 bg-muted/50 p-4 rounded-lg [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
              {isLoadingProposal ? (
                <p className="text-sm text-muted-foreground">
                  Loading details...
                </p>
              ) : (
                <ProposalContentRenderer content={activeProposal?.content} />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ClientProposal = () => {
  return (
    <RoleAwareSidebar>
      <ClientProposalContent />
    </RoleAwareSidebar>
  );
};

export default ClientProposal;
