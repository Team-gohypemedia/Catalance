import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ClipboardList from "lucide-react/dist/esm/icons/clipboard-list";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import FreelancerProfileDialog from "@/components/features/client/dashboard/FreelancerProfileDialog";
import FreelancerSelectionDialog from "@/components/features/client/dashboard/FreelancerSelectionDialog";
import {
  DashboardPanel,
  ProjectCarouselControls,
  ProjectCarouselDots,
} from "./shared.jsx";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { cn } from "@/shared/lib/utils";
import { extractLabeledLineValue } from "@/shared/lib/labeled-fields";
import {
  getProposalStorageKeys,
  loadSavedProposalsFromStorage,
  persistSavedProposalsToStorage,
  resolveActiveProposalId,
} from "@/shared/lib/client-proposal-storage";
import { formatINR } from "@/shared/lib/currency";
import { fetchMatchedFreelancersForProposal } from "@/shared/lib/api-client";
import { isFreelancerOpenToWork } from "@/shared/lib/freelancer-availability";
import {
  CLIENT_DASHBOARD_PROPOSAL_ACTION_PARAM,
  CLIENT_DASHBOARD_PROPOSAL_ACTION_SEND,
} from "@/shared/lib/proposal-dashboard-intent";
import { useOptionalClientDashboardData } from "./useClientDashboardData.js";
import { toast } from "sonner";

const draftProposalSurfaceToneClassName =
  "border border-white/[0.06] bg-card shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]";

const draftProposalDetailBlockClassName =
  `flex min-w-0 flex-col justify-between rounded-[14px] ${draftProposalSurfaceToneClassName} px-4 pt-4 pb-5 min-h-[90px]`;

const draftProposalActionButtonClassName =
  "inline-flex h-11 w-full items-center justify-center whitespace-nowrap rounded-[10px] px-4 text-sm font-semibold transition-colors";

const PROPOSAL_BLOCKED_STATUSES = new Set(["pending", "accepted", "sent"]);
const CLOSED_PROJECT_STATUSES = new Set(["completed", "paused"]);
const DRAFT_PROJECT_STATUSES = new Set(["draft", "local_draft"]);
const emptyDraftProposalList = [];

const resolveDraftTitle = (proposal = {}) =>
  proposal.businessName ||
  proposal.companyName ||
  proposal.proposalContext?.businessName ||
  proposal.proposalContext?.companyName ||
  extractLabeledLineValue(proposal.content || proposal.summary || proposal.proposalContent || "", [
    "Business Name",
    "Company Name",
    "Brand Name",
  ]) ||
  proposal.projectTitle ||
  proposal.title ||
  proposal.service ||
  "Proposal Draft";

const resolveDraftService = (proposal = {}) =>
  proposal.serviceKey ||
  proposal.service ||
  proposal.serviceName ||
  proposal.category ||
  "General";

const formatDraftBudget = (value) => {
  const rawValue = String(value || "").trim();
  if (!rawValue) return "Not set";

  const numericValue = Number.parseInt(rawValue.replace(/[^0-9]/g, ""), 10);
  if (!Number.isFinite(numericValue) || numericValue <= 0) return rawValue;

  return formatINR(numericValue);
};

const formatDraftTimeline = (value) => {
  const rawValue = String(value || "").trim();
  return rawValue || "Not set";
};

const buildDraftProposalPath = (draftId, action = "view") => {
  const params = new URLSearchParams({ tab: "draft", action });
  if (draftId) params.set("draftId", draftId);
  return `/client/proposal?${params.toString()}`;
};

const isBlockingProposalStatus = (proposal = {}) =>
  PROPOSAL_BLOCKED_STATUSES.has(String(proposal?.status || "").toLowerCase());

const resolveProposalProjectKey = (proposal = {}) =>
  String(proposal?.syncedProjectId || proposal?.projectId || "").trim();

const shouldHideDraftProposal = (draft = {}, remoteProposals = []) => {
  const projectKey = resolveProposalProjectKey(draft);
  if (!projectKey) return false;

  return remoteProposals.some(
    (proposal) =>
      resolveProposalProjectKey(proposal) === projectKey &&
      isBlockingProposalStatus(proposal),
  );
};

const hasFreelancerRole = (user = {}) => {
  const primaryRole = String(user?.role || "").toUpperCase();
  const roles = Array.isArray(user?.roles)
    ? user.roles.map((entry) => String(entry || "").toUpperCase())
    : [];

  return primaryRole === "FREELANCER" || roles.includes("FREELANCER");
};

const normalizeFreelancerCardData = (candidate = {}) => {
  const freelancer = { ...candidate };
  const rawBio = freelancer.bio || freelancer.about;

  if (typeof rawBio === "string" && rawBio.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(rawBio);
      freelancer.cleanBio =
        parsed.bio ||
        parsed.about ||
        parsed.description ||
        parsed.summary ||
        "No bio available.";

      if ((!freelancer.skills || freelancer.skills.length === 0) && parsed.skills) {
        freelancer.skills = parsed.skills;
      }

      if (!freelancer.rating && parsed.rating) {
        freelancer.rating = parsed.rating;
      }
    } catch {
      freelancer.cleanBio = "Overview available in profile.";
    }
  } else {
    freelancer.cleanBio = rawBio || "No bio available for this freelancer.";
  }

  return freelancer;
};

const formatRating = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "N/A";
  return numeric.toFixed(1);
};

const collectStringValues = (value) => {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value.flatMap((entry) => collectStringValues(entry));
  if (typeof value === "object") {
    return Object.values(value).flatMap((entry) => collectStringValues(entry));
  }
  if (typeof value === "string" || typeof value === "number") return [String(value)];
  return [];
};

const normalizeSkillToken = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9#+.]/g, "");

const splitSkillValues = (value = "") =>
  String(value || "")
    .split(/,|\/|\||\+|;|&|\band\b/gi)
    .map((entry) => entry.trim())
    .filter(Boolean);

const collectFreelancerSkillTokens = (freelancer = {}) => {
  const tokenSet = new Set();
  const candidates = collectStringValues([
    freelancer?.matchedTechnologies,
    freelancer?.matchHighlights,
    freelancer?.skills,
    freelancer?.services,
    freelancer?.profileDetails?.services,
    freelancer?.profileDetails?.serviceDetails,
    freelancer?.freelancerProjects,
  ]);

  candidates.forEach((entry) => {
    splitSkillValues(entry).forEach((part) => {
      const normalized = normalizeSkillToken(part);
      if (normalized) tokenSet.add(normalized);
    });
  });

  return tokenSet;
};

const freelancerMatchesRequiredSkill = (requiredSkill, freelancerSkillTokens) => {
  const required = normalizeSkillToken(requiredSkill);
  if (!required) return false;
  if (freelancerSkillTokens.has(required)) return true;

  for (const token of freelancerSkillTokens) {
    if (!token || token.length < 3 || required.length < 3) continue;
    if (token.includes(required) || required.includes(token)) return true;
  }

  return false;
};

const generateGradient = (id) => {
  if (!id) return "linear-gradient(135deg, #0f172a, #1d4ed8)";

  let hash = 0;
  for (let index = 0; index < String(id).length; index += 1) {
    hash = String(id).charCodeAt(index) + ((hash << 5) - hash);
  }

  const firstHue = Math.abs(hash % 360);
  const secondHue = (firstHue + 44) % 360;
  return `linear-gradient(135deg, hsl(${firstHue}, 78%, 58%), hsl(${secondHue}, 78%, 48%))`;
};

const buildProjectUpsertPayload = (proposal, normalizedBudget) => {
  const payload = {
    title: resolveDraftTitle(proposal),
    description: proposal.summary || proposal.content || "",
    proposalContent:
      proposal.proposalContent || proposal.content || proposal.summary || "",
    budget: normalizedBudget,
    timeline: proposal.timeline || "1 month",
    serviceKey: proposal.serviceKey || resolveDraftService(proposal),
    status: "OPEN",
  };

  if (proposal?.proposalContext && typeof proposal.proposalContext === "object") {
    payload.proposalContext = proposal.proposalContext;
  }

  return payload;
};

const DraftProposalRow = memo(function DraftProposalRow({ item }) {
  return (
    <div className="grid w-full min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end">
      <div className="min-w-0 w-full">
        <p className="min-w-0 truncate text-[1.4rem] font-semibold tracking-[-0.04em] text-white sm:text-[1.55rem]">
          {item.title}
        </p>

        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-3">
          <div className={draftProposalDetailBlockClassName}>
            <p className="text-[0.76rem] uppercase tracking-[0.16em] text-muted-foreground">
              Service
            </p>
            <p className="break-words text-[1.1rem] font-semibold tracking-[-0.02em] text-white">
              {item.tag}
            </p>
          </div>

          <div className={draftProposalDetailBlockClassName}>
            <p className="text-[0.76rem] uppercase tracking-[0.16em] text-muted-foreground">
              Budget
            </p>
            <p className="text-[1.1rem] font-semibold tracking-[-0.02em] text-white">
              {item.budget}
            </p>
          </div>

          <div className={draftProposalDetailBlockClassName}>
            <p className="text-[0.76rem] uppercase tracking-[0.16em] text-muted-foreground">
              Timeline
            </p>
            <p className="text-[1.1rem] font-semibold tracking-[-0.02em] text-white">
              {item.timeline || "Not set"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col gap-2.5 lg:h-[76px] lg:items-stretch lg:gap-2">
        <button
          type="button"
          onClick={item.onSend}
          className={cn(
            draftProposalActionButtonClassName,
            "bg-[#ffc107] text-black hover:bg-[#ffd54f] lg:h-auto lg:flex-1",
          )}
        >
          Send Proposal
        </button>

        <div className="grid grid-cols-[minmax(0,1fr)_44px] gap-2.5 lg:h-auto lg:flex-1 lg:gap-2">
          <button
            type="button"
            onClick={item.onView}
            className={cn(
              draftProposalActionButtonClassName,
              `${draftProposalSurfaceToneClassName} text-white hover:bg-white/[0.05] lg:h-full`,
            )}
          >
            View Details
          </button>

          <button
            type="button"
            onClick={item.onDelete}
            className={cn(
              draftProposalActionButtonClassName,
              `${draftProposalSurfaceToneClassName} px-0 text-muted-foreground hover:bg-white/[0.05] hover:text-white lg:h-full`,
            )}
            aria-label={`Delete ${item.title}`}
          >
            <Trash2 className="size-4 text-current" />
          </button>
        </div>
      </div>
    </div>
  );
});

const DraftProposalCard = memo(function DraftProposalCard({ item }) {
  return (
    <article className="flex h-auto w-full max-w-full min-w-0 flex-col overflow-x-clip overflow-y-hidden rounded-[28px] border border-white/[0.06] bg-card p-4 transition-transform duration-200 hover:-translate-y-1 sm:p-5 xl:p-6">
      <DraftProposalRow item={item} />
    </article>
  );
});

const DraftProposalListPanel = memo(function DraftProposalListPanel({
  draftProposalRows,
}) {
  return (
    <DashboardPanel className="overflow-hidden bg-card">
      <div className="divide-y divide-white/[0.06]">
        {draftProposalRows.map((item) => (
          <div key={item.id} className="px-4 py-5 sm:px-6 sm:py-6">
            <DraftProposalRow item={item} />
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
});

const DraftedProposals = memo(function DraftedProposals({
  draftProposalRows,
  onOpenQuickProject,
  className = "",
}) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const dashboardData = useOptionalClientDashboardData();
  const isControlled = Array.isArray(draftProposalRows);
  const sessionUser = dashboardData?.sessionUser ?? null;
  const authFetch = dashboardData?.authFetch;
  const user = dashboardData?.user;
  const proposals = dashboardData?.proposals ?? emptyDraftProposalList;
  const refreshDashboardData = dashboardData?.refreshDashboardData;
  const [savedDrafts, setSavedDrafts] = useState([]);
  const [activeDraftId, setActiveDraftId] = useState(null);
  const [showFreelancerSelect, setShowFreelancerSelect] = useState(false);
  const [selectedDraftForSend, setSelectedDraftForSend] = useState(null);
  const [suggestedFreelancers, setSuggestedFreelancers] = useState([]);
  const [isFreelancersLoading, setIsFreelancersLoading] = useState(false);
  const [freelancerFetchStatus, setFreelancerFetchStatus] = useState("idle");
  const [freelancerFetchError, setFreelancerFetchError] = useState("");
  const [sendingProposalId, setSendingProposalId] = useState(null);
  const [sendingFreelancerId, setSendingFreelancerId] = useState(null);
  const [freelancerSearch, setFreelancerSearch] = useState("");
  const [showFreelancerProfile, setShowFreelancerProfile] = useState(false);
  const [viewingFreelancer, setViewingFreelancer] = useState(null);
  const [draftProposalCarouselApi, setDraftProposalCarouselApi] = useState(null);
  const [canGoToPreviousDraftProposal, setCanGoToPreviousDraftProposal] = useState(false);
  const [canGoToNextDraftProposal, setCanGoToNextDraftProposal] = useState(false);
  const [draftProposalSnapCount, setDraftProposalSnapCount] = useState(0);
  const [activeDraftProposalSnap, setActiveDraftProposalSnap] = useState(0);
  const hasAutoOpenedProposalIntentRef = useRef(false);

  const handleOpenQuickProject = useCallback(() => {
    if (typeof onOpenQuickProject === "function") {
      onOpenQuickProject();
      return;
    }

    navigate("/service");
  }, [navigate, onOpenQuickProject]);

  const loadDrafts = useCallback(() => {
    if (isControlled) return;

    const { proposals: storedProposals, activeId } = loadSavedProposalsFromStorage(
      sessionUser?.id,
    );
    const sortedProposals = [...storedProposals].sort((left, right) => {
      const leftTime = new Date(left.updatedAt || left.createdAt || 0).getTime();
      const rightTime = new Date(right.updatedAt || right.createdAt || 0).getTime();
      return rightTime - leftTime;
    });

    setSavedDrafts(sortedProposals);
    setActiveDraftId(activeId);
  }, [isControlled, sessionUser?.id]);

  useEffect(() => {
    if (isControlled) return undefined;

    loadDrafts();

    const handleStorageChange = (event) => {
      if (event?.key && !event.key.includes("savedProposal")) return;
      loadDrafts();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [isControlled, loadDrafts]);

  const visibleSavedDrafts = useMemo(
    () =>
      savedDrafts.filter((proposal) => !shouldHideDraftProposal(proposal, proposals)),
    [proposals, savedDrafts],
  );

  const activeSavedDraft = useMemo(() => {
    if (!visibleSavedDrafts.length) return null;

    return (
      visibleSavedDrafts.find((proposal) => proposal.id === activeDraftId) ||
      visibleSavedDrafts[0]
    );
  }, [activeDraftId, visibleSavedDrafts]);

  const proposalForFreelancerSelection = useMemo(() => {
    if (!selectedDraftForSend) return null;

    return {
      ...selectedDraftForSend,
      projectTitle: resolveDraftTitle(selectedDraftForSend),
      title: resolveDraftTitle(selectedDraftForSend),
      summary:
        selectedDraftForSend.summary || selectedDraftForSend.content || "",
      content:
        selectedDraftForSend.content || selectedDraftForSend.summary || "",
      service: resolveDraftService(selectedDraftForSend),
      serviceKey:
        selectedDraftForSend.serviceKey ||
        resolveDraftService(selectedDraftForSend),
      syncedProjectId:
        selectedDraftForSend.syncedProjectId ||
        selectedDraftForSend.projectId ||
        null,
      projectId:
        selectedDraftForSend.projectId ||
        selectedDraftForSend.syncedProjectId ||
        null,
    };
  }, [selectedDraftForSend]);

  useEffect(() => {
    if (isControlled) return;

    const proposalDashboardAction = (
      searchParams.get(CLIENT_DASHBOARD_PROPOSAL_ACTION_PARAM) || ""
    ).toLowerCase();

    if (proposalDashboardAction !== CLIENT_DASHBOARD_PROPOSAL_ACTION_SEND) {
      hasAutoOpenedProposalIntentRef.current = false;
      return;
    }

    if (!activeSavedDraft) return;
    if (hasAutoOpenedProposalIntentRef.current) return;

    hasAutoOpenedProposalIntentRef.current = true;
    setSelectedDraftForSend(activeSavedDraft);
    setShowFreelancerSelect(true);

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete(CLIENT_DASHBOARD_PROPOSAL_ACTION_PARAM);
    setSearchParams(nextSearchParams, { replace: true });
  }, [activeSavedDraft, isControlled, searchParams, setSearchParams]);

  useEffect(() => {
    if (isControlled || !showFreelancerSelect || !user?.id) return;

    let cancelled = false;

    const loadFreelancers = async () => {
      setIsFreelancersLoading(true);
      setFreelancerFetchStatus("loading");
      setFreelancerFetchError("");

      try {
        if (!proposalForFreelancerSelection) {
          throw new Error("Proposal details are missing. Close the dialog and try again.");
        }

        const matchedFreelancerPayload = await fetchMatchedFreelancersForProposal(
          proposalForFreelancerSelection,
        );

        if (cancelled) return;

        const matchedFreelancers = Array.isArray(matchedFreelancerPayload?.freelancers)
          ? matchedFreelancerPayload.freelancers
          : Array.isArray(matchedFreelancerPayload?.data)
            ? matchedFreelancerPayload.data
            : Array.isArray(matchedFreelancerPayload)
              ? matchedFreelancerPayload
              : [];

        const uniqueById = matchedFreelancers.filter(
          (freelancer, index, collection) =>
            freelancer?.id &&
            collection.findIndex((item) => item?.id === freelancer.id) === index,
        );

        const normalizedFreelancers = uniqueById
          .filter(
            (freelancer) =>
              freelancer?.id !== user.id && hasFreelancerRole(freelancer),
          )
          .map((freelancer) => normalizeFreelancerCardData(freelancer));

        setSuggestedFreelancers(normalizedFreelancers);
        setFreelancerFetchStatus(
          normalizedFreelancers.length > 0 ? "success" : "empty",
        );
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load suggested freelancers:", error);
        setSuggestedFreelancers([]);
        setFreelancerFetchStatus("error");
        setFreelancerFetchError(
          error?.message || "Unable to load matched freelancers right now.",
        );
      } finally {
        if (!cancelled) setIsFreelancersLoading(false);
      }
    };

    void loadFreelancers();

    return () => {
      cancelled = true;
    };
  }, [
    isControlled,
    proposalForFreelancerSelection,
    showFreelancerSelect,
    user?.id,
  ]);

  useEffect(() => {
    if (!showFreelancerSelect) {
      setFreelancerSearch("");
      setSuggestedFreelancers([]);
      setIsFreelancersLoading(false);
      setFreelancerFetchStatus("idle");
      setFreelancerFetchError("");
      setSelectedDraftForSend(null);
    }
  }, [showFreelancerSelect]);

  const handleDeleteDraft = useCallback(
    (draftId) => {
      if (isControlled || !draftId) return;

      const storageKeys = getProposalStorageKeys(sessionUser?.id);
      const { proposals: storedProposals, activeId } = loadSavedProposalsFromStorage(
        sessionUser?.id,
      );
      const remaining = storedProposals.filter((proposal) => proposal.id !== draftId);
      const preferredActiveId = activeId === draftId ? null : activeId;
      const nextActiveId = resolveActiveProposalId(
        remaining,
        preferredActiveId,
        null,
      );

      persistSavedProposalsToStorage(remaining, nextActiveId, storageKeys);
      setSavedDrafts(remaining);
      setActiveDraftId(nextActiveId);

      if (selectedDraftForSend?.id === draftId) {
        setSelectedDraftForSend(null);
      }
    },
    [isControlled, selectedDraftForSend?.id, sessionUser?.id],
  );

  const internalDraftProposalRows = useMemo(
    () =>
      visibleSavedDrafts.map((proposal) => ({
        id: proposal.id,
        title: resolveDraftTitle(proposal),
        tag: resolveDraftService(proposal),
        budget: formatDraftBudget(proposal.budget),
        timeline: formatDraftTimeline(
          proposal.timeline || proposal.launchTimeline || proposal.duration,
        ),
        onSend: () => {
          setActiveDraftId(proposal.id);
          setSelectedDraftForSend(proposal);
          setShowFreelancerSelect(true);
        },
        onView: () => navigate(buildDraftProposalPath(proposal.id, "view")),
        onDelete: () => handleDeleteDraft(proposal.id),
      })),
    [handleDeleteDraft, navigate, visibleSavedDrafts],
  );

  const items = useMemo(
    () => (isControlled ? draftProposalRows : internalDraftProposalRows),
    [draftProposalRows, internalDraftProposalRows, isControlled],
  );

  const shouldUseDraftProposalCarousel = isMobile && items.length > 1;

  useEffect(() => {
    if (!draftProposalCarouselApi || !shouldUseDraftProposalCarousel) {
      setCanGoToPreviousDraftProposal(false);
      setCanGoToNextDraftProposal(false);
      setDraftProposalSnapCount(0);
      setActiveDraftProposalSnap(0);
      return undefined;
    }

    const syncDraftProposalCarouselState = () => {
      setCanGoToPreviousDraftProposal(draftProposalCarouselApi.canScrollPrev());
      setCanGoToNextDraftProposal(draftProposalCarouselApi.canScrollNext());
      setDraftProposalSnapCount(draftProposalCarouselApi.scrollSnapList().length);
      setActiveDraftProposalSnap(draftProposalCarouselApi.selectedScrollSnap());
    };

    syncDraftProposalCarouselState();
    draftProposalCarouselApi.on("select", syncDraftProposalCarouselState);
    draftProposalCarouselApi.on("reInit", syncDraftProposalCarouselState);

    return () => {
      draftProposalCarouselApi.off("select", syncDraftProposalCarouselState);
      draftProposalCarouselApi.off("reInit", syncDraftProposalCarouselState);
    };
  }, [draftProposalCarouselApi, shouldUseDraftProposalCarousel]);

  const sendProposalToFreelancer = useCallback(
    async (freelancer) => {
      const proposal = selectedDraftForSend;
      if (isControlled || !authFetch || !proposal || !freelancer) return;

      setSendingProposalId(proposal.id);
      setSendingFreelancerId(freelancer.id);

      try {
        const normalizedBudget =
          Number.parseInt(String(proposal.budget || "").replace(/[^0-9]/g, ""), 10) ||
          0;
        const sourceProjectId =
          proposal?.syncedProjectId || proposal?.projectId || null;
        const currentProjectStatus = String(
          proposal?.projectStatus || "",
        ).toLowerCase();

        const hasExistingProposalForFreelancer = proposals.some((entry) => {
          if (!entry?.freelancerId || !entry?.projectId) return false;
          if (String(entry.projectId) !== String(sourceProjectId)) return false;
          if (String(entry.freelancerId) !== String(freelancer.id)) return false;
          return PROPOSAL_BLOCKED_STATUSES.has(
            String(entry.status || "").toLowerCase(),
          );
        });

        if (hasExistingProposalForFreelancer) {
          throw new Error("You already sent this proposal to this freelancer.");
        }

        if (CLOSED_PROJECT_STATUSES.has(currentProjectStatus)) {
          throw new Error("This project is already completed or paused.");
        }

        let project = sourceProjectId
          ? { id: sourceProjectId, status: proposal.projectStatus || "OPEN" }
          : null;

        if (sourceProjectId && DRAFT_PROJECT_STATUSES.has(currentProjectStatus)) {
          const projectPayload = buildProjectUpsertPayload(proposal, normalizedBudget);
          const publishRes = await authFetch(`/projects/${sourceProjectId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(projectPayload),
          });
          const publishPayload = await publishRes.json().catch(() => null);
          if (!publishRes.ok) {
            throw new Error("Failed to publish project before sending proposal.");
          }
          project = publishPayload?.data?.project || publishPayload?.data || project;
        }

        if (!project?.id) {
          const createProjectPayload = buildProjectUpsertPayload(
            proposal,
            normalizedBudget,
          );
          const projectRes = await authFetch("/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(createProjectPayload),
          });
          const projectResponsePayload = await projectRes.json().catch(() => null);
          if (!projectRes.ok) {
            throw new Error(
              projectResponsePayload?.message || "Failed to create project.",
            );
          }
          project =
            projectResponsePayload?.data?.project ||
            projectResponsePayload?.data ||
            project;
        }

        if (!project?.id) {
          throw new Error("Could not resolve project for this proposal.");
        }

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

        handleDeleteDraft(proposal.id);
        await refreshDashboardData?.({ silent: true });

        toast.success(`Proposal sent to ${freelancer.fullName || "freelancer"}!`);
        setShowFreelancerSelect(false);
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
      handleDeleteDraft,
      isControlled,
      proposals,
      refreshDashboardData,
      selectedDraftForSend,
    ],
  );

  const freelancerSelectionData = useMemo(() => {
    const sourceProjectId =
      proposalForFreelancerSelection?.syncedProjectId ||
      proposalForFreelancerSelection?.projectId ||
      null;
    const alreadyInvitedIds = new Set();

    if (sourceProjectId) {
      proposals.forEach((proposal) => {
        if (String(proposal?.projectId) !== String(sourceProjectId)) return;
        const status = String(proposal?.status || "").toLowerCase();
        if (proposal?.freelancerId && PROPOSAL_BLOCKED_STATUSES.has(status)) {
          alreadyInvitedIds.add(proposal.freelancerId);
        }
      });
    }

    const available = suggestedFreelancers.filter((freelancer) => {
      if (alreadyInvitedIds.has(freelancer.id)) return false;
      if (!isFreelancerOpenToWork(freelancer)) return false;
      return true;
    });

    return {
      totalRanked: suggestedFreelancers.length,
      invitedCount: alreadyInvitedIds.size,
      available,
    };
  }, [proposalForFreelancerSelection, proposals, suggestedFreelancers]);

  const filteredFreelancers = useMemo(() => {
    const query = String(freelancerSearch || "").trim().toLowerCase();
    if (!query) return freelancerSelectionData.available;

    return freelancerSelectionData.available.filter((freelancer) => {
      const searchable = [
        freelancer.fullName,
        freelancer.name,
        freelancer.role,
        freelancer.cleanBio,
        ...(Array.isArray(freelancer.skills) ? freelancer.skills : []),
        ...(Array.isArray(freelancer.matchHighlights)
          ? freelancer.matchHighlights
          : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [freelancerSearch, freelancerSelectionData.available]);

  const bestMatchFreelancerIds = useMemo(() => {
    const scoredFreelancers = freelancerSelectionData.available
      .map((freelancer) => {
        const score = Number.isFinite(Number(freelancer?.matchScore))
          ? Math.round(Number(freelancer.matchScore))
          : null;
        if (!freelancer?.id || score === null) return null;
        return { id: freelancer.id, score };
      })
      .filter(Boolean);

    if (scoredFreelancers.length === 0) return new Set();

    const topScore = scoredFreelancers.reduce(
      (maxScore, freelancer) => Math.max(maxScore, freelancer.score),
      Number.NEGATIVE_INFINITY,
    );

    if (!Number.isFinite(topScore) || topScore <= 0) return new Set();

    return new Set(
      scoredFreelancers
        .filter((freelancer) => freelancer.score === topScore)
        .map((freelancer) => freelancer.id),
    );
  }, [freelancerSelectionData.available]);

  return (
    <>
      <section className={cn("w-full min-w-0", className)}>
        <div className="mb-4 flex items-center justify-between gap-4 sm:mb-5">
          <div className="min-w-0">
            <h2 className="text-[1.75rem] font-semibold tracking-[-0.02em] text-white">
              Drafted Proposals
            </h2>
          </div>

          {shouldUseDraftProposalCarousel ? (
            <ProjectCarouselControls
              onPrevious={() => draftProposalCarouselApi?.scrollPrev()}
              onNext={() => draftProposalCarouselApi?.scrollNext()}
              canGoPrevious={canGoToPreviousDraftProposal}
              canGoNext={canGoToNextDraftProposal}
              previousLabel="Show previous draft proposal"
              nextLabel="Show next draft proposal"
            />
          ) : null}
        </div>

        {items.length === 0 ? (
          <DashboardPanel className="overflow-hidden bg-card">
            <div className="flex min-h-[240px] flex-col items-center justify-center px-5 py-10 text-center sm:min-h-[320px] sm:px-6 sm:py-12">
              <div className="flex size-14 items-center justify-center rounded-full bg-white/[0.06] text-[#94a3b8] sm:size-16">
                <ClipboardList className="size-6 sm:size-7" />
              </div>
              <p className="mt-6 text-base font-medium text-white">
                No draft proposals yet
              </p>
              <p className="mt-2 max-w-[320px] text-sm text-muted-foreground">
                Start a new proposal to build your project brief and invite
                freelancers.
              </p>
              <button
                type="button"
                onClick={handleOpenQuickProject}
                className="mt-6 inline-flex min-w-[200px] items-center justify-center rounded-full bg-[#ffc107] px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#ffd54f] sm:min-w-0"
              >
                Create New Proposal
              </button>
            </div>
          </DashboardPanel>
        ) : shouldUseDraftProposalCarousel ? (
          <div className="w-full min-w-0">
            <Carousel
              setApi={setDraftProposalCarouselApi}
              opts={{
                align: "start",
                containScroll: "trimSnaps",
                slidesToScroll: 1,
                duration: 34,
              }}
              className="w-full"
            >
              <CarouselContent className="ml-0 items-start gap-5 [backface-visibility:hidden] [will-change:transform] sm:gap-6 xl:gap-7">
                {items.map((item) => (
                  <CarouselItem
                    key={item.id}
                    className="basis-full pl-[2px] pr-[2px] pt-1"
                  >
                    <DraftProposalCard item={item} />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
            <ProjectCarouselDots
              count={draftProposalSnapCount}
              activeIndex={activeDraftProposalSnap}
              onSelect={(index) => draftProposalCarouselApi?.scrollTo(index)}
              ariaLabel="Draft proposals carousel pagination"
              getDotLabel={(index) => `Go to draft proposal ${index + 1}`}
            />
          </div>
        ) : isMobile ? (
          <DraftProposalCard item={items[0]} />
        ) : (
          <DraftProposalListPanel draftProposalRows={items} />
        )}
      </section>

      {!isControlled ? (
        <>
          <FreelancerSelectionDialog
            open={showFreelancerSelect}
            onOpenChange={setShowFreelancerSelect}
            savedProposal={proposalForFreelancerSelection}
            isLoadingFreelancers={isFreelancersLoading}
            freelancerFetchStatus={freelancerFetchStatus}
            freelancerFetchError={freelancerFetchError}
            isSendingProposal={
              sendingProposalId === (proposalForFreelancerSelection?.id ?? null)
            }
            sendingFreelancerId={sendingFreelancerId}
            freelancerSearch={freelancerSearch}
            onFreelancerSearchChange={setFreelancerSearch}
            filteredFreelancers={filteredFreelancers}
            freelancerSelectionData={freelancerSelectionData}
            bestMatchFreelancerIds={bestMatchFreelancerIds}
            projectRequiredSkills={[]}
            onViewFreelancer={(freelancer) => {
              setViewingFreelancer(freelancer);
              setShowFreelancerProfile(true);
            }}
            onSendProposal={sendProposalToFreelancer}
            collectFreelancerSkillTokens={collectFreelancerSkillTokens}
            freelancerMatchesRequiredSkill={freelancerMatchesRequiredSkill}
            generateGradient={generateGradient}
            formatRating={formatRating}
          />

          <FreelancerProfileDialog
            open={showFreelancerProfile}
            onOpenChange={(open) => {
              setShowFreelancerProfile(open);
              if (!open) {
                setViewingFreelancer(null);
              }
            }}
            viewingFreelancer={viewingFreelancer}
          />
        </>
      ) : null}
    </>
  );
});

export default DraftedProposals;
