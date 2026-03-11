"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import { RoleAwareSidebar } from "@/components/layout/RoleAwareSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientTopBar } from "@/components/features/client/ClientTopBar";
import { useAuth } from "@/shared/context/AuthContext";
import { openRazorpayCheckout } from "@/shared/lib/razorpay-checkout";
import {
  getProposalSignature,
  getProposalStorageKeys,
  loadSavedProposalsFromStorage,
  persistSavedProposalsToStorage,
  resolveActiveProposalId,
} from "@/shared/lib/client-proposal-storage";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "react-router-dom";

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
      /Timeline[:\s-]*(.+?)(?:\n|$)/i
    );
    if (timelineMatch) delivery = timelineMatch[1].trim();
  }

  return {
    budget: formatBudget(budget),
    delivery: delivery,
    requiresPayment: Boolean(proposal.requiresPayment),
    statusDisplay:
      proposal.requiresPayment
        ? "Awaiting Payment"
        : proposal.status === "draft"
        ? "Draft"
        : proposal.status === "rejected"
          ? "Rejected"
          : "Pending Review",
  };
};

const ProposalRowCard = ({ proposal, onDelete, onOpen, onPay, isPaying }) => {
  const details = extractProposalDetails(proposal);

  const statusColors = {
    draft: "bg-slate-500/10 text-slate-400 border-slate-300/30",
    accepted: "bg-emerald-500/10 text-emerald-500 border-emerald-200/40",
    sent: "bg-blue-500/10 text-blue-500 border-blue-200/40",
    pending: "bg-amber-500/10 text-amber-500 border-amber-200/40",
    rejected: "bg-red-500/10 text-red-500 border-red-200/40",
  };

  const statusLabels = {
    draft: "DRAFT",
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

            {proposal.requiresPayment && onPay ? (
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold border-none rounded-lg"
                onClick={() => onPay(proposal)}
                disabled={isPaying}
              >
                <div className="flex items-center gap-2">
                  {isPaying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  {isPaying ? "Processing..." : "Approve & Pay"}
                </div>
              </Button>
            ) : null}

            {onDelete && !proposal.requiresPayment ? (
              <Button
                className="w-full bg-card hover:bg-card/80 border border-border/40 text-foreground hover:text-destructive rounded-lg"
                onClick={() => onDelete(proposal)}
              >
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </div>
              </Button>
            ) : null}
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
  const projectStatus = String(proposal.project?.status || "").toUpperCase();
  const spentAmount = Number(proposal.project?.spent || 0);
  const requiresPayment =
    projectStatus === "AWAITING_PAYMENT" &&
    String(proposal.status || "").toUpperCase() === "ACCEPTED" &&
    spentAmount <= 0;

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
    projectStatus,
    requiresPayment,
  };
};

const normalizeProposalStatus = (status = "") => {
  switch (status.toUpperCase()) {
    case "DRAFT":
      return "draft";
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

const formatProposalDate = (value) => {
  if (!value) return "No Date";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "No Date";

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const mapLocalDraftProposal = (proposal = {}) => ({
  id: proposal.id,
  title:
    proposal.projectTitle ||
    proposal.title ||
    proposal.service ||
    proposal.serviceKey ||
    "Proposal Draft",
  category: proposal.service || proposal.serviceKey || "General",
  status: "draft",
  recipientName: proposal.recipientName || proposal.preparedFor || "Not assigned",
  recipientId: proposal.recipientId || "LOCAL_DRAFT",
  projectId: proposal.syncedProjectId || proposal.projectId || null,
  freelancerId: proposal.freelancerId || null,
  submittedDate: formatProposalDate(
    proposal.updatedAt || proposal.createdAt || new Date().toISOString()
  ),
  avatar: proposal.avatar || "",
  content: proposal.summary || proposal.content || "",
  budget: proposal.budget || "",
  timeline: proposal.timeline || "",
  projectStatus: proposal.syncedProjectId ? "DRAFT" : "LOCAL_DRAFT",
  requiresPayment: false,
  isLocalDraft: true,
  draftSignature: getProposalSignature(proposal),
});

const getProposalMergeKey = (proposal = {}) => {
  if (proposal.isLocalDraft) {
    if (proposal.projectId) {
      return `draft-project:${proposal.projectId}`;
    }

    return `draft:${proposal.draftSignature || proposal.id}`;
  }

  if (proposal.status === "draft" && proposal.projectId && !proposal.freelancerId) {
    return `draft-project:${proposal.projectId}`;
  }

  if (proposal.id) {
    return `proposal:${proposal.id}`;
  }

  if (proposal.projectId && proposal.freelancerId) {
    return `proposal:${proposal.projectId}:${proposal.freelancerId}`;
  }

  return `proposal:${proposal.projectId || proposal.title || proposal.submittedDate}`;
};

const mergeProposalCollections = (remote = [], localDrafts = []) => {
  const merged = [];
  const seen = new Set();

  const pushUnique = (proposal) => {
    const key = getProposalMergeKey(proposal);
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(proposal);
  };

  remote.forEach(pushUnique);
  localDrafts.forEach(pushUnique);

  return merged;
};

const deleteLocalDraftProposal = (proposalId, userId) => {
  const storageKeys = getProposalStorageKeys(userId);
  const { proposals, activeId } = loadSavedProposalsFromStorage(userId);
  const remaining = proposals.filter((proposal) => proposal.id !== proposalId);
  const preferredActiveId = activeId === proposalId ? null : activeId;
  const nextActiveId = resolveActiveProposalId(
    remaining,
    preferredActiveId,
    null
  );

  persistSavedProposalsToStorage(remaining, nextActiveId, storageKeys);
};

const ClientProposalContent = () => {
  const { isAuthenticated, authFetch, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [proposals, setProposals] = useState([]);
  const [activeProposal, setActiveProposal] = useState(null);
  const [isViewing, setIsViewing] = useState(false);
  const [isLoadingProposal, setIsLoadingProposal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("draft");
  const [processingPaymentProposalId, setProcessingPaymentProposalId] =
    useState(null);
  const [hasHandledDeepLink, setHasHandledDeepLink] = useState(false);

  const deepLinkProjectId = searchParams.get("projectId");
  const deepLinkTab = (searchParams.get("tab") || "").toLowerCase();
  const deepLinkAction = (searchParams.get("action") || "").toLowerCase();

  const fetchProposals = useCallback(async () => {
    const { proposals: localSavedProposals } = loadSavedProposalsFromStorage(
      user?.id
    );
    const localDrafts = localSavedProposals.map(mapLocalDraftProposal);

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

      setProposals(mergeProposalCollections(uniqueById, localDrafts));
    } catch (error) {
      console.error("Failed to load proposals from API:", error);
      setProposals(localDrafts);
    } finally {
      setIsLoading(false);
    }
  }, [authFetch, user?.id]);

  useEffect(() => {
    setHasHandledDeepLink(false);
  }, [deepLinkProjectId, deepLinkTab, deepLinkAction]);

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
    async (proposal) => {
      if (proposal?.isLocalDraft) {
        deleteLocalDraftProposal(proposal.id, user?.id);
        setProposals((prev) => prev.filter((item) => item.id !== proposal.id));
        toast.success("Draft deleted.");
        return;
      }

      try {
        const response = await authFetch(`/proposals/${proposal.id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Unable to delete proposal.");
        setProposals((prev) => prev.filter((item) => item.id !== proposal.id));
        toast.success("Proposal deleted.");
      } catch {
        toast.error("Unable to delete proposal right now.");
      }
    },
    [authFetch, user?.id]
  );

  const handleApproveAndPay = useCallback(
    async (proposal) => {
      if (!proposal?.projectId) {
        toast.error("Project reference missing for this proposal.");
        return;
      }

      setProcessingPaymentProposalId(proposal.id);

      try {
        const orderRes = await authFetch(
          `/projects/${proposal.projectId}/pay-upfront/order`,
          { method: "POST" }
        );
        const orderPayload = await orderRes.json().catch(() => null);

        if (!orderRes.ok) {
          if (orderRes.status === 503) {
            const fallbackRes = await authFetch(
              `/projects/${proposal.projectId}/pay-upfront`,
              { method: "POST" }
            );
            const fallbackPayload = await fallbackRes.json().catch(() => null);
            if (!fallbackRes.ok) {
              throw new Error(fallbackPayload?.message || "Payment failed.");
            }
            toast.success(
              fallbackPayload?.data?.message ||
                "Payment completed. Project is now active."
            );
            await fetchProposals();
            return;
          }
          throw new Error(orderPayload?.message || "Unable to start payment.");
        }

        const orderData = orderPayload?.data || {};
        const paymentProof = await openRazorpayCheckout({
          key: orderData.key,
          amountPaise: orderData.amountPaise,
          currency: orderData.currency || "INR",
          orderId: orderData.orderId,
          description: `Upfront payment for ${orderData.projectTitle || "project"}`,
          prefill: {
            email: user?.email || "",
            name: user?.fullName || "",
            contact: user?.phone || user?.phoneNumber || "",
          },
          notes: {
            projectId: orderData.projectId,
          },
        });

        const verifyRes = await authFetch(
          `/projects/${proposal.projectId}/pay-upfront/verify`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(paymentProof),
          }
        );
        const verifyPayload = await verifyRes.json().catch(() => null);

        if (!verifyRes.ok) {
          throw new Error(verifyPayload?.message || "Payment verification failed.");
        }

        toast.success(
          verifyPayload?.data?.message || "Payment completed. Project is now active."
        );
        await fetchProposals();
      } catch (error) {
        console.error("Failed to approve and pay:", error);
        toast.error(error?.message || "Payment failed. Please try again.");
      } finally {
        setProcessingPaymentProposalId(null);
      }
    },
    [authFetch, fetchProposals, user]
  );

  const scopedProposals = useMemo(() => {
    if (!deepLinkProjectId) return proposals;
    return proposals.filter(
      (proposal) => String(proposal.projectId) === String(deepLinkProjectId)
    );
  }, [deepLinkProjectId, proposals]);

  const grouped = useMemo(() => {
    return scopedProposals.reduce(
      (acc, proposal) => {
        if (proposal.status === "accepted" && !proposal.requiresPayment) {
          return acc;
        }
        if (proposal.status === "accepted" && proposal.requiresPayment) {
          acc.pending.push(proposal);
          return acc;
        }
        if (proposal.status === "draft") {
          acc.draft.push(proposal);
        } else if (proposal.status === "rejected") {
          acc.rejected.push(proposal);
        } else {
          acc.pending.push(proposal);
        }
        return acc;
      },
      { draft: [], pending: [], rejected: [] }
    );
  }, [scopedProposals]);

  const handleOpenProposal = useCallback(
    async (proposal) => {
      setIsViewing(true);
      setActiveProposal(proposal);

      if (proposal?.isLocalDraft) return;
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

  useEffect(() => {
    if (!deepLinkProjectId || isLoading || hasHandledDeepLink) {
      return;
    }

    const relatedProposals = proposals.filter(
      (proposal) => String(proposal.projectId) === String(deepLinkProjectId)
    );

    if (!relatedProposals.length) {
      setHasHandledDeepLink(true);
      return;
    }

    const tabByStatus = (status) => {
      if (status === "draft") return "draft";
      if (status === "rejected") return "rejected";
      return "pending";
    };

    const validTabs = new Set(["draft", "pending", "rejected"]);
    const inferredTab = tabByStatus(relatedProposals[0]?.status);
    const targetTab = validTabs.has(deepLinkTab) ? deepLinkTab : inferredTab;
    setActiveTab(targetTab);

    if (deepLinkAction === "view") {
      const proposalForTab =
        relatedProposals.find((proposal) => tabByStatus(proposal.status) === targetTab) ||
        relatedProposals[0];

      if (proposalForTab) {
        handleOpenProposal(proposalForTab);
      }

      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("action");
      setSearchParams(nextParams, { replace: true });
    }

    setHasHandledDeepLink(true);
  }, [
    deepLinkAction,
    deepLinkProjectId,
    deepLinkTab,
    handleOpenProposal,
    hasHandledDeepLink,
    isLoading,
    proposals,
    searchParams,
    setSearchParams,
  ]);

  return (
    <div className="flex-1 flex flex-col relative h-full overflow-hidden bg-background transition-colors duration-300">
      <ClientTopBar />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 z-10 relative scroll-smooth">
        <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Project Proposals
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your draft, pending, and rejected proposals.
            </p>
          </div>
          {/* Filter/Sort removed */}
        </div>

        {/* Tabs */}
        <Tabs
          defaultValue="draft"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="bg-transparent p-0 h-auto w-full justify-start gap-4 mb-6">
            <TabsTrigger
              value="draft"
              className="rounded-md border border-transparent px-4 py-2 font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-700 data-[state=active]:to-slate-600 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              Draft
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
            <TabsContent value="draft" className="m-0 space-y-4">
              {isLoading ? (
                [1, 2].map((i) => (
                  <Skeleton key={i} className="h-40 w-full rounded-xl" />
                ))
              ) : grouped.draft.length ? (
                grouped.draft.map((p) => (
                  <ProposalRowCard
                    key={p.id}
                    proposal={p}
                    onOpen={handleOpenProposal}
                    onDelete={handleDelete}
                  />
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border/60 bg-card/40 px-4 py-12 text-center text-muted-foreground">
                  No drafts found.
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
                    onPay={handleApproveAndPay}
                    isPaying={processingPaymentProposalId === p.id}
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
      </main>

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

