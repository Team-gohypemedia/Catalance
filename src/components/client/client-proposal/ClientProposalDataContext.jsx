import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/shared/context/AuthContext";
import { useNotifications } from "@/shared/context/NotificationContext";
import { fetchMatchedFreelancersForProposal } from "@/shared/lib/api-client";
import {
  getProposalStorageKeys,
  loadSavedProposalsFromStorage,
  persistSavedProposalsToStorage,
  resolveActiveProposalId,
} from "@/shared/lib/client-proposal-storage";
import { isFreelancerOpenToWork } from "@/shared/lib/freelancer-availability";
import { openRazorpayCheckout } from "@/shared/lib/razorpay-checkout";
import { toast } from "sonner";
import { ClientProposalDataContext } from "./client-proposal-data-context.js";
import {
  isProposalEligibleForBudgetIncrease,
} from "./proposal-budget-utils.js";
import {
  CLOSED_PROJECT_STATUSES,
  DRAFT_PROJECT_STATUSES,
  PROPOSAL_BLOCKED_STATUSES,
  buildEditableProposalDraft,
  buildProposalContentFromDraft,
  buildUpdatedProposalContext,
  canUnsendProposalInvitee,
  deleteLocalDraftProposal,
  extractProjectRequiredSkills,
  getDisplayName,
  getProposalDraftGroupKey,
  getProposalFreelancerRecipients,
  getProposalInvitee,
  hasFreelancerRole,
  mapApiProposal,
  mapLocalDraftProposal,
  mergeInviteeCollections,
  mergeProposalCollections,
  normalizeFreelancerCardData,
  parseProposalBudgetValue,
  parseProposalEditableList,
  resolveBestMatchFreelancerIds,
  resolveProposalServiceLabel,
  resolveProposalTitle,
  shouldHideRejectedProposal,
} from "./proposal-utils.js";
import { useProposalBudgetIncrease } from "./useProposalBudgetIncrease.js";

export const ClientProposalDataProvider = ({ children }) => {
  const { isAuthenticated, authFetch, user } = useAuth();
  const { unreadCount, notifications, markAsRead } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const [proposals, setProposals] = useState([]);
  const [activeProposal, setActiveProposal] = useState(null);
  const [isViewing, setIsViewing] = useState(false);
  const [isLoadingProposal, setIsLoadingProposal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("draft");
  const [isEditingProposal, setIsEditingProposal] = useState(false);
  const [isSavingProposal, setIsSavingProposal] = useState(false);
  const [editableProposalDraft, setEditableProposalDraft] = useState(() =>
    buildEditableProposalDraft(null),
  );
  const [processingPaymentProposalId, setProcessingPaymentProposalId] =
    useState(null);
  const [sendingProposalId, setSendingProposalId] = useState(null);
  const [sendingFreelancerId, setSendingFreelancerId] = useState(null);
  const [unsendingProposalId, setUnsendingProposalId] = useState(null);
  const [hasHandledDeepLink, setHasHandledDeepLink] = useState(false);
  const [showFreelancerSelect, setShowFreelancerSelect] = useState(false);
  const [showFreelancerProfile, setShowFreelancerProfile] = useState(false);
  const [viewingFreelancer, setViewingFreelancer] = useState(null);
  const [freelancerDetailsProposal, setFreelancerDetailsProposal] = useState(null);
  const [freelancerSearch, setFreelancerSearch] = useState("");
  const [suggestedFreelancers, setSuggestedFreelancers] = useState([]);
  const [isFreelancersLoading, setIsFreelancersLoading] = useState(false);
  const [freelancerFetchStatus, setFreelancerFetchStatus] = useState("idle");
  const [freelancerFetchError, setFreelancerFetchError] = useState("");
  const [selectedProposalForSend, setSelectedProposalForSend] = useState(null);
  const freelancerPoolCacheRef = useRef({
    userId: null,
    queryKey: null,
    loaded: false,
    data: [],
  });
  const freelancerPoolPromiseRef = useRef(null);

  const deepLinkProjectId = searchParams.get("projectId");
  const deepLinkDraftId = searchParams.get("draftId");
  const deepLinkTab = (searchParams.get("tab") || "").toLowerCase();
  const deepLinkAction = (searchParams.get("action") || "").toLowerCase();

  const buildProposalMatchCacheKey = useCallback((proposal = null) => {
    if (!proposal || typeof proposal !== "object") return "";

    const proposalId = String(proposal.id || proposal.projectId || proposal.syncedProjectId || "").trim();
    const serviceKey = String(
      proposal.serviceKey ||
        proposal.serviceType ||
        proposal.service ||
        proposal.serviceName ||
        proposal.category ||
        proposal.proposalContext?.serviceType ||
        "",
    ).trim().toLowerCase();
    const budget = String(
      proposal.amount ||
        proposal.budget ||
        proposal.proposalContext?.budget ||
        proposal.project?.budget ||
        "",
    ).trim();
    const stackSignature = String(
      proposal.projectStack ||
        proposal.techStack ||
        proposal.project?.projectStack ||
        proposal.project?.techStack ||
        proposal.proposalContext?.projectStack ||
        proposal.proposalContext?.techStack ||
        proposal.proposalContext?.requiredTechStack ||
        "",
    )
      .trim()
      .toLowerCase();
    const title = String(proposal.projectTitle || proposal.title || proposal.project?.title || "").trim().toLowerCase();
    const contentHash = String(proposal.content || proposal.summary || proposal.coverLetter || proposal.description || "")
      .trim()
      .slice(0, 120)
      .toLowerCase();

    return [proposalId, serviceKey, budget, stackSignature, title, contentHash].join("::");
  }, []);

  const fetchProposals = useCallback(async () => {
    const { proposals: localSavedProposals } = loadSavedProposalsFromStorage(user?.id);
    const localDrafts = localSavedProposals.map(mapLocalDraftProposal);

    try {
      const response = await authFetch("/proposals?as=owner");
      const payload = await response.json().catch(() => null);
      const remote = Array.isArray(payload?.data) ? payload.data : [];
      const remoteNormalized = remote.map(mapApiProposal);

      const uniqueById = remoteNormalized.reduce(
        (acc, proposal) => {
          const key = proposal.id || `${proposal.projectId}-${proposal.freelancerId}`;
          if (!key || acc.seen.has(key)) return acc;
          acc.seen.add(key);
          acc.list.push(proposal);
          return acc;
        },
        { seen: new Set(), list: [] },
      ).list;

      setProposals(mergeProposalCollections(uniqueById, localDrafts));
    } catch (error) {
      console.error("Failed to load proposals from API:", error);
      setProposals((current) => (current.length > 0 ? current : localDrafts));
    } finally {
      setIsLoading(false);
    }
  }, [authFetch, user?.id]);

  const handleProposalBudgetUpdated = useCallback(
    async ({ projectId, budgetValue, updatedProposalIds = [] } = {}) => {
      const normalizedBudget = String(Math.round(Number(budgetValue) || 0));
      const updatedIds = new Set(updatedProposalIds);
      const nextUpdatedAt = new Date().toISOString();

      await fetchProposals();

      const applyBudgetUpdate = (proposal) => {
        const matchesProject =
          projectId &&
          String(proposal?.projectId || proposal?.syncedProjectId || "") ===
            String(projectId);
        const matchesProposal = proposal?.id && updatedIds.has(proposal.id);

        if (!matchesProject && !matchesProposal) {
          return proposal;
        }

        return {
          ...proposal,
          budget: normalizedBudget,
          updatedAt: nextUpdatedAt,
        };
      };

      setProposals((current) => current.map(applyBudgetUpdate));
      setSelectedProposalForSend((current) => {
        if (
          !current ||
          String(current?.projectId || current?.syncedProjectId || "") !== String(projectId)
        ) {
          return current;
        }

        return {
          ...current,
          budget: normalizedBudget,
          updatedAt: nextUpdatedAt,
        };
      });
      setActiveProposal((current) => {
        if (
          !current ||
          String(current?.projectId || current?.syncedProjectId || "") !== String(projectId)
        ) {
          return current;
        }

        return {
          ...current,
          budget: normalizedBudget,
          updatedAt: nextUpdatedAt,
        };
      });

      void fetchProposals().then(() => {
        setProposals((current) => current.map(applyBudgetUpdate));
        setSelectedProposalForSend((current) => {
          if (
            !current ||
            String(current?.projectId || current?.syncedProjectId || "") !== String(projectId)
          ) {
            return current;
          }

          return {
            ...current,
            budget: normalizedBudget,
            updatedAt: nextUpdatedAt,
          };
        });
        setActiveProposal((current) => {
          if (
            !current ||
            String(current?.projectId || current?.syncedProjectId || "") !== String(projectId)
          ) {
            return current;
          }

          return {
            ...current,
            budget: normalizedBudget,
            updatedAt: nextUpdatedAt,
          };
        });
      });
    },
    [fetchProposals],
  );

  const { budgetDialogState, budgetDialogActions } = useProposalBudgetIncrease({
    authFetch,
    userId: user?.id,
    proposals,
    notifications,
    markNotificationAsRead: markAsRead,
    onBudgetUpdated: handleProposalBudgetUpdated,
  });

  const fetchFreelancerPool = useCallback(async (proposal = null) => {
    if (!user?.id) return [];

    const queryKey = buildProposalMatchCacheKey(proposal);

    const currentCache = freelancerPoolCacheRef.current;
    if (
      currentCache.userId === user.id &&
      currentCache.queryKey === queryKey &&
      currentCache.loaded
    ) {
      return currentCache.data;
    }

    if (
      freelancerPoolPromiseRef.current &&
      freelancerPoolPromiseRef.current.queryKey === queryKey
    ) {
      return freelancerPoolPromiseRef.current.promise;
    }

    const promise = (async () => {
      if (!proposal) {
        return [];
      }

      const matchedFreelancerPayload = await fetchMatchedFreelancersForProposal(proposal);
      const matchedFreelancers = Array.isArray(matchedFreelancerPayload)
        ? matchedFreelancerPayload
        : Array.isArray(matchedFreelancerPayload?.freelancers)
          ? matchedFreelancerPayload.freelancers
          : Array.isArray(matchedFreelancerPayload?.results)
            ? matchedFreelancerPayload.results
            : Array.isArray(matchedFreelancerPayload?.data)
              ? matchedFreelancerPayload.data
              : [];
      const uniqueById = Array.isArray(matchedFreelancers)
        ? matchedFreelancers.filter(
            (freelancer, index, collection) =>
              freelancer?.id &&
              collection.findIndex((item) => item?.id === freelancer.id) === index,
          )
        : [];
      const normalized = uniqueById.filter(
        (freelancer) => freelancer?.id !== user.id && hasFreelancerRole(freelancer),
      );

      if (import.meta.env?.DEV) {
        console.debug("[Proposal Match] Client proposal pool", {
          proposalService: proposal?.serviceKey || proposal?.service || null,
          proposalBudget: proposal?.amount || proposal?.budget || null,
          candidateCount: normalized.length,
          sample: normalized[0]
            ? {
                id: normalized[0].id,
                service: normalized[0].matchedService || null,
                budget: normalized[0].budgetCompatibility || null,
                skills: normalized[0].matchedTechnologies || normalized[0].matchHighlights || [],
              }
            : null,
        });
      }

      freelancerPoolCacheRef.current = {
        userId: user.id,
        queryKey,
        loaded: true,
        data: normalized,
      };

      return normalized;
    })();

    freelancerPoolPromiseRef.current = { queryKey, promise };

    try {
      return await promise;
    } finally {
      if (freelancerPoolPromiseRef.current?.queryKey === queryKey) {
        freelancerPoolPromiseRef.current = null;
      }
    }
  }, [buildProposalMatchCacheKey, user?.id]);

  const openFreelancerSelection = useCallback(
    (proposal) => {
      if (!proposal) return;
      setSelectedProposalForSend(proposal);
      const cache = freelancerPoolCacheRef.current;
      const queryKey = buildProposalMatchCacheKey(proposal);
      const hasCachedPool =
        cache.userId === user?.id && cache.queryKey === queryKey && cache.loaded;
      const cachedFreelancers = hasCachedPool && Array.isArray(cache.data) ? cache.data : [];
      setSuggestedFreelancers(cachedFreelancers);
      setFreelancerFetchError("");
      setFreelancerFetchStatus(
        hasCachedPool
          ? cachedFreelancers.length > 0
            ? "success"
            : "empty"
          : "loading",
      );
      setIsFreelancersLoading(!hasCachedPool);
      setShowFreelancerSelect(true);
    },
    [buildProposalMatchCacheKey, user?.id],
  );

  const updateProposalProjectReference = useCallback(
    (proposal, projectId, projectStatus = "OPEN") => {
      const now = new Date().toISOString();
      const normalizedProjectId = String(projectId || "").trim();
      const normalizedProjectStatus = String(projectStatus || "OPEN").toUpperCase();

      if (!proposal?.id || !normalizedProjectId) {
        return;
      }

      if (proposal?.isLocalDraft) {
        const storageKeys = getProposalStorageKeys(user?.id);
        const { proposals: savedProposals } = loadSavedProposalsFromStorage(user?.id);
        const updatedSavedProposals = savedProposals.map((savedProposal) => {
          if (savedProposal.id !== proposal.id) {
            return savedProposal;
          }

          return {
            ...savedProposal,
            ownerId: user?.id || savedProposal.ownerId || null,
            projectId: normalizedProjectId,
            syncedProjectId: normalizedProjectId,
            projectStatus: normalizedProjectStatus,
            syncedAt: savedProposal.syncedAt || now,
            project: {
              ...(savedProposal.project && typeof savedProposal.project === "object"
                ? savedProposal.project
                : {}),
              id: normalizedProjectId,
              status: normalizedProjectStatus,
            },
          };
        });

        persistSavedProposalsToStorage(updatedSavedProposals, proposal.id, storageKeys);
      }

      const patch = {
        projectId: normalizedProjectId,
        syncedProjectId: normalizedProjectId,
        projectStatus: normalizedProjectStatus,
        syncedAt: now,
      };

      setProposals((current) =>
        current.map((entry) =>
          entry.id === proposal.id
            ? {
                ...entry,
                ...patch,
                project: {
                  ...(entry.project && typeof entry.project === "object"
                    ? entry.project
                    : {}),
                  id: normalizedProjectId,
                  status: normalizedProjectStatus,
                },
              }
            : entry,
        ),
      );
      setSelectedProposalForSend((current) =>
        current?.id === proposal.id
          ? {
              ...current,
              ...patch,
              project: {
                ...(current.project && typeof current.project === "object"
                  ? current.project
                  : {}),
                id: normalizedProjectId,
                status: normalizedProjectStatus,
              },
            }
          : current,
      );
      setActiveProposal((current) =>
        current?.id === proposal.id
          ? {
              ...current,
              ...patch,
              project: {
                ...(current.project && typeof current.project === "object"
                  ? current.project
                  : {}),
                id: normalizedProjectId,
                status: normalizedProjectStatus,
              },
            }
          : current,
      );
    },
    [user?.id],
  );

  useEffect(() => {
    if (deepLinkProjectId) return;
    const validTabs = new Set(["draft", "pending", "rejected"]);
    if (validTabs.has(deepLinkTab)) {
      setActiveTab(deepLinkTab);
    }
  }, [deepLinkTab, deepLinkProjectId]);

  useEffect(() => {
    setEditableProposalDraft(buildEditableProposalDraft(activeProposal, getDisplayName(user)));
    setIsEditingProposal(false);
  }, [activeProposal, user]);

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
      window.clearInterval(intervalId);
    };
  }, [fetchProposals, isAuthenticated]);

  useEffect(() => {
    freelancerPoolPromiseRef.current = null;

    if (!user?.id) {
      freelancerPoolCacheRef.current = {
        userId: null,
        loaded: false,
        data: [],
      };
      setSuggestedFreelancers([]);
      setFreelancerFetchStatus("idle");
      setFreelancerFetchError("");
      return;
    }

    if (freelancerPoolCacheRef.current.userId !== user.id) {
      freelancerPoolCacheRef.current = {
        userId: user.id,
        loaded: false,
        data: [],
      };
      setSuggestedFreelancers([]);
      setFreelancerFetchStatus("idle");
      setFreelancerFetchError("");
    }
  }, [user?.id]);

  useEffect(() => {
    if (!showFreelancerSelect) {
      setFreelancerSearch("");
      setSuggestedFreelancers([]);
      setIsFreelancersLoading(false);
      setFreelancerFetchStatus("idle");
      setFreelancerFetchError("");
      setSelectedProposalForSend(null);
    }
  }, [showFreelancerSelect]);

  useEffect(() => {
    if (!showFreelancerSelect) return;

    if (!selectedProposalForSend) {
      setSuggestedFreelancers([]);
      setIsFreelancersLoading(false);
      setFreelancerFetchStatus("error");
      setFreelancerFetchError("Proposal details are missing. Close the dialog and try again.");
      return;
    }

    const queryKey = buildProposalMatchCacheKey(selectedProposalForSend);
    const cache = freelancerPoolCacheRef.current;
    const hasCachedPool =
      cache.userId === user?.id && cache.queryKey === queryKey && cache.loaded;

    if (hasCachedPool) {
      const cachedFreelancers = Array.isArray(cache.data) ? cache.data : [];
      setSuggestedFreelancers(cachedFreelancers);
      setIsFreelancersLoading(false);
      setFreelancerFetchError("");
      setFreelancerFetchStatus(cachedFreelancers.length > 0 ? "success" : "empty");
      return;
    }

    let isActive = true;

    setSuggestedFreelancers([]);
    setIsFreelancersLoading(true);
    setFreelancerFetchError("");
    setFreelancerFetchStatus("loading");

    (async () => {
      try {
        const matchedFreelancers = await fetchFreelancerPool(selectedProposalForSend);
        if (!isActive) return;

        const normalizedFreelancers = Array.isArray(matchedFreelancers)
          ? matchedFreelancers
          : [];

        setSuggestedFreelancers(normalizedFreelancers);
        setFreelancerFetchStatus(
          normalizedFreelancers.length > 0 ? "success" : "empty",
        );
      } catch (error) {
        console.error("Failed to load matched freelancers:", error);
        if (!isActive) return;

        setSuggestedFreelancers([]);
        setFreelancerFetchStatus("error");
        setFreelancerFetchError(
          error?.message || "Unable to load matched freelancers right now.",
        );
      } finally {
        if (isActive) {
          setIsFreelancersLoading(false);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [
    buildProposalMatchCacheKey,
    fetchFreelancerPool,
    selectedProposalForSend,
    showFreelancerSelect,
    user?.id,
  ]);

  const handleDelete = useCallback(
    async (proposal) => {
      if (proposal?.isLocalDraft) {
        deleteLocalDraftProposal(proposal.id, user?.id);
        setProposals((prev) => prev.filter((item) => item.id !== proposal.id));
        setActiveProposal((current) => (current?.id === proposal.id ? null : current));
        setSelectedProposalForSend((current) =>
          current?.id === proposal.id ? null : current,
        );
        if (activeProposal?.id === proposal.id) setIsViewing(false);
        toast.success("Draft deleted.");
        return;
      }

      try {
        if (proposal?.isGroupedPending) {
          const inviteeProposalIds = [
            ...new Set(
              getProposalFreelancerRecipients(proposal)
                .filter((invitee) => canUnsendProposalInvitee(invitee))
                .map((invitee) => invitee?.proposalId)
                .filter(Boolean),
            ),
          ];

          if (!inviteeProposalIds.length) {
            throw new Error("Unable to delete this grouped proposal.");
          }

          const deleteResults = await Promise.allSettled(
            inviteeProposalIds.map(async (proposalId) => {
              const response = await authFetch(`/proposals/${proposalId}`, {
                method: "DELETE",
              });
              const payload = await response.json().catch(() => null);
              if (!response.ok) {
                throw new Error(payload?.message || "Unable to delete proposal.");
              }
              return proposalId;
            }),
          );

          const deletedProposalIds = deleteResults
            .filter((result) => result.status === "fulfilled")
            .map((result) => result.value);

          if (!deletedProposalIds.length) {
            throw new Error("Unable to delete proposal right now.");
          }

          setProposals((prev) =>
            prev.filter((item) => !deletedProposalIds.includes(item.id)),
          );
          setActiveProposal((current) =>
            deletedProposalIds.includes(current?.id) ? null : current,
          );
          setSelectedProposalForSend((current) =>
            deletedProposalIds.includes(current?.id) ? null : current,
          );
          if (activeProposal?.id && deletedProposalIds.includes(activeProposal.id)) {
            setIsViewing(false);
          }

          const allDeleted = deletedProposalIds.length === inviteeProposalIds.length;
          toast.success(
            allDeleted
              ? "Proposal deleted."
              : `${deletedProposalIds.length} proposals deleted.`,
          );
          await fetchProposals();
          return;
        }

        const response = await authFetch(`/proposals/${proposal.id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Unable to delete proposal.");
        setProposals((prev) => prev.filter((item) => item.id !== proposal.id));
        setActiveProposal((current) => (current?.id === proposal.id ? null : current));
        setSelectedProposalForSend((current) =>
          current?.id === proposal.id ? null : current,
        );
        if (activeProposal?.id === proposal.id) setIsViewing(false);
        toast.success("Proposal deleted.");
      } catch (error) {
        toast.error(error?.message || "Unable to delete proposal right now.");
      }
    },
    [activeProposal?.id, authFetch, fetchProposals, user?.id],
  );

  const handleOpenFreelancerDetails = useCallback((proposal) => {
    if (!proposal) return;
    setFreelancerDetailsProposal(proposal);
  }, []);

  const handleUnsendProposalFromFreelancer = useCallback(
    async (invitee) => {
      if (!invitee?.proposalId) {
        toast.error("This proposal cannot be unsent right now.");
        return;
      }

      setUnsendingProposalId(invitee.proposalId);

      try {
        const response = await authFetch(`/proposals/${invitee.proposalId}`, {
          method: "DELETE",
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.message || "Unable to unsend proposal.");
        }

        if (activeProposal?.id === invitee.proposalId) {
          setActiveProposal(null);
          setIsViewing(false);
        }

        setFreelancerDetailsProposal(null);
        toast.success(`Proposal unsent from ${invitee.name || "freelancer"}.`);
        await fetchProposals();
      } catch (error) {
        console.error("Failed to unsend proposal:", error);
        toast.error(error?.message || "Unable to unsend proposal right now.");
      } finally {
        setUnsendingProposalId(null);
      }
    },
    [activeProposal?.id, authFetch, fetchProposals],
  );

  const handleApproveAndPay = useCallback(
    async (proposal) => {
      if (!proposal?.projectId) {
        toast.error("Project reference missing for this proposal.");
        return;
      }

      setProcessingPaymentProposalId(proposal.id);

      try {
        const orderRes = await authFetch(`/projects/${proposal.projectId}/pay-upfront/order`, {
          method: "POST",
        });
        const orderPayload = await orderRes.json().catch(() => null);

        if (!orderRes.ok) {
          if (orderRes.status === 503) {
            const fallbackRes = await authFetch(`/projects/${proposal.projectId}/pay-upfront`, {
              method: "POST",
            });
            const fallbackPayload = await fallbackRes.json().catch(() => null);
            if (!fallbackRes.ok) {
              throw new Error(fallbackPayload?.message || "Payment failed.");
            }
            toast.success(
              fallbackPayload?.data?.message ||
                "Payment completed. Project is now active.",
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

        const verifyRes = await authFetch(`/projects/${proposal.projectId}/pay-upfront/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paymentProof),
        });
        const verifyPayload = await verifyRes.json().catch(() => null);

        if (!verifyRes.ok) {
          throw new Error(verifyPayload?.message || "Payment verification failed.");
        }

        toast.success(
          verifyPayload?.data?.message || "Payment completed. Project is now active.",
        );
        await fetchProposals();
      } catch (error) {
        console.error("Failed to approve and pay:", error);
        toast.error(error?.message || "Payment failed. Please try again.");
      } finally {
        setProcessingPaymentProposalId(null);
      }
    },
    [authFetch, fetchProposals, user],
  );

  const handleOpenProposal = useCallback(
    async (proposal) => {
      setIsViewing(true);
      setActiveProposal(proposal);

      if (proposal?.isLocalDraft || !proposal?.id) {
        setIsLoadingProposal(false);
        return;
      }

      try {
        setIsLoadingProposal(true);
        const response = await authFetch(`/proposals/${proposal.id}`);
        const payload = await response.json().catch(() => null);
        const mapped = payload?.data ? mapApiProposal(payload.data) : null;
        if (mapped) {
          setActiveProposal(mapped);
          setProposals((prev) =>
            prev.map((item) => (item.id === mapped.id ? mapped : item)),
          );
        }
      } catch (error) {
        console.error("Failed to load details", error);
      } finally {
        setIsLoadingProposal(false);
      }
    },
    [authFetch],
  );

  const handleEditableProposalDraftChange = useCallback((field, value) => {
    setEditableProposalDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }, []);

  const handleSaveProposalChanges = useCallback(async () => {
    if (!activeProposal || isSavingProposal) return;

    const clientNameFallback = getDisplayName(user);
    const nextTitle = String(editableProposalDraft.title || "").trim();
    const nextBusinessName = String(editableProposalDraft.businessName || "").trim();
    const nextClientName =
      String(editableProposalDraft.clientName || "").trim() || clientNameFallback;
    const nextService = String(editableProposalDraft.service || "").trim();
    const nextBudget = String(editableProposalDraft.budget || "").trim();
    const nextTimeline = String(editableProposalDraft.timeline || "").trim();
    const nextProjectOverview = String(editableProposalDraft.projectOverview || "").trim();
    const nextObjectives = parseProposalEditableList(editableProposalDraft.objectivesText);
    const nextDeliverables = parseProposalEditableList(editableProposalDraft.deliverablesText);
    const nextTechStack = parseProposalEditableList(editableProposalDraft.techStackText, {
      splitCommas: true,
    });
    const nextNotes = String(editableProposalDraft.notes || "").trim();
    const nextContent = buildProposalContentFromDraft({
      ...editableProposalDraft,
      clientName: nextClientName,
    });

    if (!nextTitle) {
      toast.error("Proposal title cannot be empty.");
      return;
    }

    if (!nextProjectOverview && !nextObjectives.length && !nextDeliverables.length) {
      toast.error("Add an overview, objectives, or deliverables before saving.");
      return;
    }

    setIsSavingProposal(true);

    try {
      const now = new Date().toISOString();
      const storageKeys = getProposalStorageKeys(user?.id);
      const { proposals: savedProposals, activeId } = loadSavedProposalsFromStorage(user?.id);
      const draftGroupKey = getProposalDraftGroupKey(activeProposal);
      const nextProposalContext = buildUpdatedProposalContext(
        activeProposal.proposalContext,
        {
          ...editableProposalDraft,
          clientName: nextClientName,
        },
        clientNameFallback,
      );
      const localDraftPayload = {
        id:
          activeProposal.isLocalDraft
            ? activeProposal.id
            : `saved-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        ownerId: user?.id || null,
        projectTitle: nextTitle,
        title: nextTitle,
        businessName: nextBusinessName,
        clientName: nextClientName,
        service: nextService || resolveProposalServiceLabel(activeProposal),
        serviceKey:
          nextService || activeProposal.serviceKey || resolveProposalServiceLabel(activeProposal),
        summary: nextContent,
        content: nextContent,
        proposalContent: nextContent,
        projectOverview: nextProjectOverview,
        objectives: nextObjectives,
        deliverables: nextDeliverables,
        techStack: nextTechStack,
        notes: nextNotes,
        budget: nextBudget,
        timeline: nextTimeline,
        recipientName: activeProposal.recipientName || "Not assigned",
        recipientId: activeProposal.recipientId || "LOCAL_DRAFT",
        freelancerId: activeProposal.freelancerId || null,
        avatar: activeProposal.avatar || "",
        projectId: activeProposal.projectId || activeProposal.syncedProjectId || null,
        syncedProjectId: activeProposal.syncedProjectId || activeProposal.projectId || null,
        syncedAt: activeProposal.syncedAt || null,
        proposalContext: nextProposalContext,
        createdAt: activeProposal.createdAt || now,
        updatedAt: now,
      };

      let nextActiveId = localDraftPayload.id;
      let hasMatchedSavedDraft = false;

      const updatedSavedProposals = savedProposals.map((savedProposal) => {
        const isSameDraft =
          savedProposal.id === activeProposal.id ||
          getProposalDraftGroupKey(savedProposal) === draftGroupKey;

        if (!isSameDraft) return savedProposal;

        hasMatchedSavedDraft = true;
        nextActiveId = savedProposal.id || localDraftPayload.id;

        return {
          ...savedProposal,
          ...localDraftPayload,
          id: savedProposal.id || localDraftPayload.id,
          createdAt: savedProposal.createdAt || localDraftPayload.createdAt,
        };
      });

      const nextSavedProposals = hasMatchedSavedDraft
        ? updatedSavedProposals
        : [...updatedSavedProposals, localDraftPayload];

      const resolvedActiveId = resolveActiveProposalId(
        nextSavedProposals,
        nextActiveId,
        activeId,
      );

      persistSavedProposalsToStorage(nextSavedProposals, resolvedActiveId, storageKeys);

      const savedDraftRecord =
        nextSavedProposals.find((proposal) => proposal.id === resolvedActiveId) ||
        nextSavedProposals.find(
          (proposal) => getProposalDraftGroupKey(proposal) === draftGroupKey,
        ) ||
        localDraftPayload;

      const mappedLocalDraft = mapLocalDraftProposal(savedDraftRecord);

      setProposals((current) => {
        let didReplaceDraft = false;

        const next = current.map((entry) => {
          const isSameDraft =
            getProposalDraftGroupKey(entry) === draftGroupKey &&
            (entry.isLocalDraft || entry.status === "draft");

          if (!isSameDraft) return entry;

          didReplaceDraft = true;
          return {
            ...entry,
            ...mappedLocalDraft,
          };
        });

        if (!didReplaceDraft) {
          next.push(mappedLocalDraft);
        }

        return next;
      });

      setSelectedProposalForSend((current) =>
        current && getProposalDraftGroupKey(current) === draftGroupKey
          ? {
              ...current,
              ...mappedLocalDraft,
              sentFreelancers: current.sentFreelancers,
            }
          : current,
      );

      setActiveProposal((current) =>
        current
          ? {
              ...current,
              ...mappedLocalDraft,
              sentFreelancers: current.sentFreelancers,
            }
          : current,
      );

      const linkedProjectId =
        activeProposal?.syncedProjectId || activeProposal?.projectId || null;
      const nextBudgetValue = parseProposalBudgetValue(nextBudget);
      const syncTasks = [];

      if (linkedProjectId) {
        syncTasks.push(
          (async () => {
            const response = await authFetch(`/projects/${linkedProjectId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: nextTitle,
                description: nextContent,
                proposalContent: nextContent,
                proposalContext: nextProposalContext,
                ...(nextBudget ? { budget: nextBudgetValue } : {}),
                serviceKey:
                  activeProposal.serviceKey || resolveProposalServiceLabel(activeProposal),
              }),
            });
            const payload = await response.json().catch(() => null);
            if (!response.ok) {
              throw new Error(payload?.message || "Failed to sync project details.");
            }
            return payload?.data || null;
          })(),
        );
      }

      if (!activeProposal?.isLocalDraft && activeProposal?.id) {
        syncTasks.push(
          (async () => {
            const response = await authFetch(`/proposals/${activeProposal.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                coverLetter: nextContent,
                ...(nextBudget ? { amount: nextBudgetValue } : {}),
              }),
            });
            const payload = await response.json().catch(() => null);
            if (!response.ok) {
              throw new Error(payload?.message || "Failed to sync proposal details.");
            }
            return payload?.data ? mapApiProposal(payload.data) : null;
          })(),
        );
      }

      let hasSyncFailure = false;
      if (syncTasks.length > 0) {
        const syncResults = await Promise.allSettled(syncTasks);
        hasSyncFailure = syncResults.some((result) => result.status === "rejected");
      }

      setIsEditingProposal(false);
      await fetchProposals();

      if (hasSyncFailure) {
        toast.error("Proposal saved locally, but some database updates failed.");
        return;
      }

      toast.success("Proposal updated.");
    } catch (error) {
      console.error("Failed to save proposal changes:", error);
      toast.error(error?.message || "Failed to save proposal changes.");
    } finally {
      setIsSavingProposal(false);
    }
  }, [activeProposal, authFetch, editableProposalDraft, fetchProposals, isSavingProposal, user]);

  const sendProposalToFreelancer = useCallback(
    async (freelancer) => {
      const proposal = selectedProposalForSend;
      if (!proposal || !freelancer) return;

      setSendingProposalId(proposal.id);
      setSendingFreelancerId(freelancer.id);

      try {
        const normalizedBudget = parseProposalBudgetValue(proposal.budget);
        const sourceProjectId = proposal?.syncedProjectId || proposal?.projectId || null;
        const currentProjectStatus = String(proposal?.projectStatus || "").toLowerCase();
        const projectProposalContext =
          proposal.proposalContext &&
          typeof proposal.proposalContext === "object" &&
          !Array.isArray(proposal.proposalContext)
            ? proposal.proposalContext
            : undefined;

        const buildProjectPayload = () => ({
          title: resolveProposalTitle(proposal),
          description: proposal.summary || proposal.content || "",
          proposalContent:
            proposal.proposalContent ||
            proposal.content ||
            proposal.summary ||
            "",
          budget: normalizedBudget,
          timeline: proposal.timeline || "1 month",
          serviceKey: proposal.serviceKey || resolveProposalServiceLabel(proposal),
          status: "OPEN",
          ...(projectProposalContext ? { proposalContext: projectProposalContext } : {}),
        });

        const hasExistingProposalForFreelancer = proposals.some((entry) => {
          if (!entry?.freelancerId || !entry?.projectId) return false;
          if (String(entry.projectId) !== String(sourceProjectId)) return false;
          if (String(entry.freelancerId) !== String(freelancer.id)) return false;
          return PROPOSAL_BLOCKED_STATUSES.has(String(entry.status || "").toLowerCase());
        });

        if (hasExistingProposalForFreelancer) {
          throw new Error("You already sent this proposal to this freelancer.");
        }

        if (CLOSED_PROJECT_STATUSES.has(currentProjectStatus)) {
          throw new Error("This project is already completed or paused.");
        }

        let project = sourceProjectId
          ? {
              id: sourceProjectId,
              status: proposal.projectStatus || "OPEN",
            }
          : null;

        if (sourceProjectId && DRAFT_PROJECT_STATUSES.has(currentProjectStatus)) {
          const publishRes = await authFetch(`/projects/${sourceProjectId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(buildProjectPayload()),
          });

          const publishPayload = await publishRes.json().catch(() => null);
          if (!publishRes.ok) {
            throw new Error("Failed to publish project before sending proposal.");
          }

          project =
            publishPayload?.data?.project ||
            publishPayload?.data || {
              id: sourceProjectId,
              status: "OPEN",
            };
        }

        if (!project?.id) {
          const projectRes = await authFetch("/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(buildProjectPayload()),
          });

          const projectPayload = await projectRes.json().catch(() => null);
          if (!projectRes.ok) {
            throw new Error(projectPayload?.message || "Failed to create project.");
          }

          project =
            projectPayload?.data?.project ||
            projectPayload?.data || {
              id: null,
              status: "OPEN",
            };
        }

        if (!project?.id) {
          throw new Error("Could not resolve project for this proposal.");
        }

        updateProposalProjectReference(
          proposal,
          project.id,
          String(project.status || "OPEN").toUpperCase(),
        );

        const proposalRes = await authFetch("/proposals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: project.id,
            freelancerId: freelancer.id,
            amount: normalizedBudget,
            coverLetter: proposal.summary || proposal.content || "",
          }),
        });

        const proposalPayload = await proposalRes.json().catch(() => null);
        if (!proposalRes.ok) {
          throw new Error(proposalPayload?.message || "Failed to send proposal.");
        }

        deleteLocalDraftProposal(proposal.id, user?.id);
        setProposals((current) =>
          current.filter((entry) => entry.id !== proposal.id),
        );

        toast.success(
          proposalRes.status === 200
            ? `Proposal resent to ${freelancer.fullName || "freelancer"}!`
            : `Proposal sent to ${freelancer.fullName || "freelancer"}!`,
        );

        await fetchProposals();
      } catch (error) {
        console.error("Failed to send proposal:", error);
        toast.error(error?.message || "Failed to send proposal. Please try again.");
      } finally {
        setSendingProposalId(null);
        setSendingFreelancerId(null);
      }
    },
    [
      authFetch,
      fetchProposals,
      proposals,
      selectedProposalForSend,
      user?.id,
      updateProposalProjectReference,
    ],
  );

  const scopedProposals = useMemo(() => {
    if (!deepLinkProjectId) return proposals;
    return proposals.filter(
      (proposal) => String(proposal.projectId) === String(deepLinkProjectId),
    );
  }, [deepLinkProjectId, proposals]);

  const groupedBuckets = useMemo(() => {
    const acceptedProjectKeys = new Set(
      scopedProposals
        .filter((proposal) => proposal.status === "accepted" && proposal.projectId)
        .map((proposal) => String(proposal.projectId)),
    );
    const sentFreelancersByDraftKey = scopedProposals.reduce((acc, proposal) => {
      const proposalStatus = String(proposal?.status || "").toLowerCase();
      if (!PROPOSAL_BLOCKED_STATUSES.has(proposalStatus)) return acc;

      const draftKey = getProposalDraftGroupKey(proposal);
      const invitee = getProposalInvitee(proposal);
      if (!draftKey || !invitee) return acc;

      const current = acc.get(draftKey) || [];
      if (current.some((entry) => entry.id === invitee.id)) return acc;

      acc.set(draftKey, [...current, invitee]);
      return acc;
    }, new Map());

    const draftIndexes = new Map();
    const pendingIndexes = new Map();
    const groupedBuckets = { draft: [], pending: [], rejected: [] };

    const pushDraftOnce = (proposal, options = {}) => {
      const draftKey = getProposalDraftGroupKey(proposal);
      const sentFreelancers = sentFreelancersByDraftKey.get(draftKey) || [];
      const nextDraft =
        sentFreelancers.length > 0
          ? { ...proposal, sentFreelancers }
          : proposal;

      if (draftIndexes.has(draftKey)) {
        if (options.preferSavedDraft) {
          groupedBuckets.draft[draftIndexes.get(draftKey)] = nextDraft;
        }
        return;
      }

      draftIndexes.set(draftKey, groupedBuckets.draft.length);
      groupedBuckets.draft.push(nextDraft);
    };

    const pushPendingOnce = (proposal) => {
      const draftKey = getProposalDraftGroupKey(proposal);
      const sentFreelancers = sentFreelancersByDraftKey.get(draftKey) || [];
      const hasPendingInvite = sentFreelancers.some(
        (invitee) => String(invitee?.status || "").toLowerCase() === "pending",
      );
      const nextPending =
        sentFreelancers.length > 0
          ? {
              ...proposal,
              sentFreelancers,
              status: hasPendingInvite ? "pending" : proposal.status,
              isGroupedPending: sentFreelancers.length > 1,
            }
          : proposal;

      if (pendingIndexes.has(draftKey)) {
        const currentIndex = pendingIndexes.get(draftKey);
        const currentProposal = groupedBuckets.pending[currentIndex];
        const mergedInvitees = mergeInviteeCollections(
          currentProposal?.sentFreelancers,
          nextPending.sentFreelancers,
        );
        const status =
          currentProposal?.status === "pending" || nextPending.status === "pending"
            ? "pending"
            : currentProposal?.status || nextPending.status;

        groupedBuckets.pending[currentIndex] = {
          ...(currentProposal?.status === "pending" ? currentProposal : nextPending),
          sentFreelancers: mergedInvitees,
          status,
          isGroupedPending: mergedInvitees.length > 1,
        };
        return;
      }

      pendingIndexes.set(draftKey, groupedBuckets.pending.length);
      groupedBuckets.pending.push(nextPending);
    };

    scopedProposals.forEach((proposal) => {
      const projectKey = proposal.projectId ? String(proposal.projectId) : null;
      const hasAcceptedProposal = projectKey
        ? acceptedProjectKeys.has(projectKey)
        : false;
      const draftKey = getProposalDraftGroupKey(proposal);
      const hasSentFreelancersForDraft =
        draftKey && (sentFreelancersByDraftKey.get(draftKey) || []).length > 0;

      if (proposal.status === "accepted") {
        return;
      }

      if (proposal.status === "draft") {
        if (!hasAcceptedProposal && !hasSentFreelancersForDraft) {
          pushDraftOnce(proposal, { preferSavedDraft: true });
        }
        return;
      }

      if (proposal.status === "rejected") {
        if (!shouldHideRejectedProposal(proposal)) {
          groupedBuckets.rejected.push(proposal);
        }
        return;
      }

      pushPendingOnce(proposal);
    });

    return groupedBuckets;
  }, [scopedProposals]);

  const grouped = useMemo(
    () => ({
      draft: (groupedBuckets.draft || []).map((proposal) => ({
        ...proposal,
        canIncreaseBudget: isProposalEligibleForBudgetIncrease(proposal, proposals),
      })),
      pending: (groupedBuckets.pending || []).map((proposal) => ({
        ...proposal,
        canIncreaseBudget: isProposalEligibleForBudgetIncrease(proposal, proposals),
      })),
      rejected: (groupedBuckets.rejected || []).map((proposal) => ({
        ...proposal,
        canIncreaseBudget: isProposalEligibleForBudgetIncrease(proposal, proposals),
      })),
    }),
    [groupedBuckets, proposals],
  );

  const proposalForFreelancerSelection = useMemo(() => {
    if (!selectedProposalForSend) return null;

    return {
      ...selectedProposalForSend,
      projectTitle: resolveProposalTitle(selectedProposalForSend),
      title: resolveProposalTitle(selectedProposalForSend),
      summary:
        selectedProposalForSend.summary || selectedProposalForSend.content || "",
      content:
        selectedProposalForSend.content || selectedProposalForSend.summary || "",
      service: resolveProposalServiceLabel(selectedProposalForSend),
      serviceKey:
        selectedProposalForSend.serviceKey ||
        resolveProposalServiceLabel(selectedProposalForSend),
      syncedProjectId:
        selectedProposalForSend.syncedProjectId ||
        selectedProposalForSend.projectId ||
        null,
      projectId:
        selectedProposalForSend.projectId ||
        selectedProposalForSend.syncedProjectId ||
        null,
    };
  }, [selectedProposalForSend]);

  const projectRequiredSkills = useMemo(() => {
    if (!showFreelancerSelect) return [];
    return extractProjectRequiredSkills(proposalForFreelancerSelection || {});
  }, [proposalForFreelancerSelection, showFreelancerSelect]);

  const rankedSuggestedFreelancers = useMemo(() => {
    if (!showFreelancerSelect) return [];
    return Array.isArray(suggestedFreelancers) ? suggestedFreelancers : [];
  }, [showFreelancerSelect, suggestedFreelancers]);

  const freelancerSelectionData = useMemo(() => {
    if (!showFreelancerSelect) {
      return {
        totalRanked: 0,
        invitedCount: 0,
        available: [],
      };
    }

    const sourceProjectId =
      proposalForFreelancerSelection?.syncedProjectId ||
      proposalForFreelancerSelection?.projectId ||
      null;
    const alreadyInvitedIds = new Set();

    if (sourceProjectId) {
      proposals.forEach((proposal) => {
        if (String(proposal.projectId) !== String(sourceProjectId)) return;
        const status = String(proposal.status || "").toLowerCase();
        if (proposal.freelancerId && PROPOSAL_BLOCKED_STATUSES.has(status)) {
          alreadyInvitedIds.add(proposal.freelancerId);
        }
      });
    }

    const normalized = rankedSuggestedFreelancers.map((entry) =>
      normalizeFreelancerCardData(entry),
    );

    const available = normalized.filter((freelancer) => {
      if (alreadyInvitedIds.has(freelancer.id)) return false;
      if (!isFreelancerOpenToWork(freelancer)) return false;
      return true;
    });

    return {
      totalRanked: normalized.length,
      invitedCount: alreadyInvitedIds.size,
      available,
    };
  }, [
    proposalForFreelancerSelection?.projectId,
    proposalForFreelancerSelection?.syncedProjectId,
    proposals,
    rankedSuggestedFreelancers,
    showFreelancerSelect,
  ]);

  const filteredFreelancers = useMemo(() => {
    if (!showFreelancerSelect) return [];

    const query = String(freelancerSearch || "").trim().toLowerCase();
    if (!query) return freelancerSelectionData.available;

    return freelancerSelectionData.available.filter((freelancer) => {
      const searchable = [
        freelancer.fullName,
        freelancer.name,
        freelancer.role,
        freelancer.cleanBio,
        ...(Array.isArray(freelancer.skills) ? freelancer.skills : []),
        ...(Array.isArray(freelancer.matchedSkills) ? freelancer.matchedSkills : []),
        ...(Array.isArray(freelancer.matchHighlights) ? freelancer.matchHighlights : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [
    freelancerSearch,
    freelancerSelectionData.available,
    showFreelancerSelect,
  ]);

  const bestMatchFreelancerIds = useMemo(() => {
    const proposalService =
      proposalForFreelancerSelection?.serviceKey ||
      proposalForFreelancerSelection?.serviceType ||
      proposalForFreelancerSelection?.service ||
      "";

    return resolveBestMatchFreelancerIds(
      freelancerSelectionData.available,
      proposalService,
    );
  }, [
    freelancerSelectionData.available,
    proposalForFreelancerSelection?.service,
    proposalForFreelancerSelection?.serviceKey,
    proposalForFreelancerSelection?.serviceType,
  ]);

  useEffect(() => {
    if (isLoading || hasHandledDeepLink) return;

    const tabByStatus = (status) => {
      if (status === "draft") return "draft";
      if (status === "rejected") return "rejected";
      return "pending";
    };

    const validTabs = new Set(["draft", "pending", "rejected"]);

    if (deepLinkDraftId || (!deepLinkProjectId && deepLinkAction === "send")) {
      const targetDraft =
        (deepLinkDraftId
          ? proposals.find(
              (proposal) => String(proposal.id) === String(deepLinkDraftId),
            )
          : null) || proposals.find((proposal) => proposal.status === "draft");

      setActiveTab(
        validTabs.has(deepLinkTab)
          ? deepLinkTab
          : tabByStatus(targetDraft?.status || "draft"),
      );

      if (targetDraft) {
        if (deepLinkAction === "send") {
          openFreelancerSelection(targetDraft);
        } else {
          handleOpenProposal(targetDraft);
        }
      }

      if (deepLinkDraftId || deepLinkAction) {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete("action");
        nextParams.delete("draftId");
        setSearchParams(nextParams, { replace: true });
      }

      setHasHandledDeepLink(true);
      return;
    }

    if (!deepLinkProjectId) {
      setHasHandledDeepLink(true);
      return;
    }

    const relatedProposals = proposals.filter(
      (proposal) => String(proposal.projectId) === String(deepLinkProjectId),
    );

    if (!relatedProposals.length) {
      setHasHandledDeepLink(true);
      return;
    }

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
    deepLinkDraftId,
    deepLinkProjectId,
    deepLinkTab,
    handleOpenProposal,
    hasHandledDeepLink,
    isLoading,
    openFreelancerSelection,
    proposals,
    searchParams,
    setSearchParams,
  ]);

  const handleCancelProposalEditing = useCallback(() => {
    if (!activeProposal) {
      setIsEditingProposal(false);
      return;
    }

    setEditableProposalDraft(buildEditableProposalDraft(activeProposal, getDisplayName(user)));
    setIsEditingProposal(false);
  }, [activeProposal, user]);

  const handleProposalDialogOpenChange = useCallback((open) => {
    setIsViewing(open);
    if (!open) {
      setIsEditingProposal(false);
      setActiveProposal(null);
    }
  }, []);

  const handleFreelancerDetailsDialogOpenChange = useCallback((open) => {
    if (!open) setFreelancerDetailsProposal(null);
  }, []);

  const handleViewFreelancerProfile = useCallback((freelancer) => {
    setViewingFreelancer(freelancer);
    setShowFreelancerProfile(true);
  }, []);

  const handleFreelancerProfileOpenChange = useCallback((open) => {
    setShowFreelancerProfile(open);
  }, []);

  const startEditingProposal = useCallback(() => {
    setIsEditingProposal(true);
  }, []);

  const canIncreaseBudgetForActiveProposal = useMemo(
    () => isProposalEligibleForBudgetIncrease(activeProposal, proposals),
    [activeProposal, proposals],
  );

  const canOpenFreelancerSelectionForActiveProposal = useMemo(() => {
    if (!activeProposal || activeProposal?.requiresPayment) {
      return false;
    }

    const status = String(activeProposal?.status || "").toLowerCase();
    return status === "draft" || status === "pending" || status === "sent";
  }, [activeProposal]);

  const userState = useMemo(
    () => ({
      user,
      unreadCount,
    }),
    [unreadCount, user],
  );

  const proposalState = useMemo(
    () => ({
      proposals,
      activeProposal,
      activeTab,
      grouped,
      isLoading,
      isLoadingProposal,
      isEditingProposal,
      isSavingProposal,
      editableProposalDraft,
      canIncreaseBudgetForActiveProposal,
      canOpenFreelancerSelectionForActiveProposal,
      processingPaymentProposalId,
      sendingProposalId,
    }),
    [
      activeProposal,
      activeTab,
      canIncreaseBudgetForActiveProposal,
      canOpenFreelancerSelectionForActiveProposal,
      editableProposalDraft,
      grouped,
      isEditingProposal,
      isLoading,
      isLoadingProposal,
      isSavingProposal,
      processingPaymentProposalId,
      proposals,
      sendingProposalId,
    ],
  );

  const dialogState = useMemo(
    () => ({
      isViewing,
      ...budgetDialogState,
      freelancerDetailsProposal,
      showFreelancerSelect,
      showFreelancerProfile,
      viewingFreelancer,
      unsendingProposalId,
    }),
    [
      budgetDialogState,
      freelancerDetailsProposal,
      isViewing,
      showFreelancerProfile,
      showFreelancerSelect,
      unsendingProposalId,
      viewingFreelancer,
    ],
  );

  const freelancerState = useMemo(
    () => ({
      freelancerSearch,
      isFreelancersLoading,
      freelancerFetchStatus,
      freelancerFetchError,
      proposalForFreelancerSelection,
      filteredFreelancers,
      freelancerSelectionData,
      bestMatchFreelancerIds,
      projectRequiredSkills,
      sendingFreelancerId,
    }),
    [
      bestMatchFreelancerIds,
      filteredFreelancers,
      freelancerFetchError,
      freelancerFetchStatus,
      freelancerSearch,
      freelancerSelectionData,
      isFreelancersLoading,
      projectRequiredSkills,
      proposalForFreelancerSelection,
      sendingFreelancerId,
    ],
  );

  const actions = useMemo(
    () => ({
      setActiveTab,
      setShowFreelancerSelect,
      setFreelancerSearch,
      ...budgetDialogActions,
      openFreelancerSelection,
      handleDelete,
      handleOpenFreelancerDetails,
      handleUnsendProposalFromFreelancer,
      handleApproveAndPay,
      handleOpenProposal,
      handleEditableProposalDraftChange,
      handleSaveProposalChanges,
      handleCancelProposalEditing,
      sendProposalToFreelancer,
      handleProposalDialogOpenChange,
      handleFreelancerDetailsDialogOpenChange,
      handleViewFreelancerProfile,
      handleFreelancerProfileOpenChange,
      startEditingProposal,
    }),
    [
      budgetDialogActions,
      handleApproveAndPay,
      handleCancelProposalEditing,
      handleDelete,
      handleEditableProposalDraftChange,
      handleFreelancerDetailsDialogOpenChange,
      handleFreelancerProfileOpenChange,
      handleOpenFreelancerDetails,
      handleOpenProposal,
      handleProposalDialogOpenChange,
      handleSaveProposalChanges,
      handleUnsendProposalFromFreelancer,
      handleViewFreelancerProfile,
      openFreelancerSelection,
      sendProposalToFreelancer,
      setActiveTab,
      setFreelancerSearch,
      setShowFreelancerSelect,
      startEditingProposal,
    ],
  );

  const value = useMemo(
    () => ({
      userState,
      proposalState,
      dialogState,
      freelancerState,
      actions,
    }),
    [actions, dialogState, freelancerState, proposalState, userState],
  );

  return (
    <ClientProposalDataContext.Provider value={value}>
      {children}
    </ClientProposalDataContext.Provider>
  );
};
