import React, {
  memo,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ClipboardList from "lucide-react/dist/esm/icons/clipboard-list";
import FileText from "lucide-react/dist/esm/icons/file-text";
import User from "lucide-react/dist/esm/icons/user";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Folder from "lucide-react/dist/esm/icons/folder";
import Send from "lucide-react/dist/esm/icons/send";
import Eye from "lucide-react/dist/esm/icons/eye";
import MoreVertical from "lucide-react/dist/esm/icons/more-vertical";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import Plus from "lucide-react/dist/esm/icons/plus";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import ProjectRedirectCard from "./ProjectRedirectCard.jsx";
import FreelancerProfileDialog from "@/components/features/client/dashboard/FreelancerProfileDialog";
import FreelancerSelectionDialog from "@/components/features/client/dashboard/FreelancerSelectionDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DashboardPanel,
  ProjectCarouselControls,
  ProjectCarouselDots,
} from "./shared.jsx";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { cn } from "@/shared/lib/utils";
import { extractLabeledLineValue, extractStructuredFieldValue } from "@/shared/lib/labeled-fields";
import {
  getProposalSignature,
  getProposalStorageKeys,
  persistSavedProposalsToStorage,
  resolveActiveProposalId,
} from "@/shared/lib/client-proposal-storage";
import { formatINR } from "@/shared/lib/currency";
import {
  fetchMatchedFreelancerCataAi,
  fetchMatchedFreelancersForProposal,
} from "@/shared/lib/api-client";
import { isFreelancerOpenToWork } from "@/shared/lib/freelancer-availability";
import {
  extractAgencyProposalServiceEntries,
  extractMatchedFreelancersFromPayload,
  normalizeFreelancerCardData,
  resolveBestMatchFreelancerIds,
  resolveProposalAgencyFlag,
  mapApiDraftProject,
} from "@/components/client/client-proposal/proposal-utils.js";
import { toast } from "sonner";
import {
  CLIENT_DASHBOARD_PROPOSAL_ACTION_PARAM,
  CLIENT_DASHBOARD_PROPOSAL_ACTION_SEND,
} from "@/shared/lib/proposal-dashboard-intent";
import { useOptionalClientDashboardData } from "./useClientDashboardData.js";

const draftProposalSurfaceToneClassName =
  "border border-border bg-background shadow-[0_18px_42px_-30px_rgba(16,24,40,0.22)] dark:border-white/[0.06] dark:bg-card dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]";

const draftProposalDetailBlockClassName =
  `flex min-w-0 flex-col justify-between overflow-hidden rounded-[18px] border border-border bg-[#fbfbfc] px-4 py-4 shadow-[0_1px_0_rgba(15,23,42,0.03)] dark:border-white/[0.06] dark:bg-card dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]`;

const draftProposalActionButtonClassName =
  "inline-flex h-12 min-w-0 w-full items-center justify-center whitespace-nowrap rounded-[16px] px-6 text-[0.95rem] font-semibold tracking-[-0.02em] transition-colors lg:h-13 lg:px-7 lg:text-[0.98rem]";

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

const formatDraftDate = (value) => {
  if (!value) {
    return new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);

  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const buildDraftServiceEntries = (proposal = {}) => {
  return extractAgencyProposalServiceEntries(proposal).map((entry) => ({
    name: entry.name,
    budget: formatDraftBudget(entry.budget),
    timeline: formatDraftTimeline(entry.timeline),
  }));
};

const resolveDraftRowServiceEntries = (item = {}) => {
  if (Array.isArray(item.serviceEntries) && item.serviceEntries.length > 0) {
    return item.serviceEntries.map((entry) => ({
      name: String(entry?.name || ""),
      budget: formatDraftBudget(entry?.budget),
      timeline: formatDraftTimeline(entry?.timeline),
    }));
  }

  return [];
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

const resolveProjectServiceKey = (proposal = {}) => {
  const proposalContext =
    proposal?.proposalContext && typeof proposal.proposalContext === "object"
      ? proposal.proposalContext
      : {};
  const selectedServiceIds = Array.isArray(proposalContext?.selectedServiceIds)
    ? proposalContext.selectedServiceIds
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    : [];

  if (selectedServiceIds.length > 1) {
    return selectedServiceIds.join(", ");
  }

  if (selectedServiceIds.length === 1) {
    return selectedServiceIds[0];
  }

  return proposal.serviceKey || resolveDraftService(proposal);
};

const buildProjectUpsertPayload = (proposal, normalizedBudget) => {
  const proposalContext =
    proposal?.proposalContext && typeof proposal.proposalContext === "object"
      ? proposal.proposalContext
      : {};
  const isAgencyProposal =
    String(proposalContext?.flowMode || "").trim().toLowerCase() === "agency"
    || (Array.isArray(proposalContext?.selectedServiceIds)
      && proposalContext.selectedServiceIds.filter(Boolean).length > 1);
  const payload = {
    title: resolveDraftTitle(proposal),
    description: proposal.summary || proposal.content || "",
    proposalContent:
      proposal.proposalContent || proposal.content || proposal.summary || "",
    budget: normalizedBudget,
    timeline: proposal.timeline || "1 month",
    serviceKey: resolveProjectServiceKey(proposal),
    serviceType: proposal.service || resolveDraftService(proposal),
    isAgencyProposal,
    status: "OPEN",
  };

  if (proposalContext && typeof proposalContext === "object") {
    payload.proposalContext = proposalContext;
  }

  return payload;
};

const parseProposalString = (text) => {
  if (!text) return null;

  const result = {
    clientName: "",
    businessName: "",
    serviceType: "",
    projectOverview: "",
    objectives: [],
    deliverables: [],
    techStack: {
      frontend: "",
      backend: "",
      database: "",
      hosting: "",
    }
  };

  const extractMatch = (regex) => {
    const match = text.match(regex);
    return match ? match[1].trim() : "";
  };

  result.clientName = extractMatch(/Client Name:\s*(.*?)(?=\s*Business Name:|\s*$)/i);
  result.businessName = extractMatch(/Business Name:\s*(.*?)(?=\s*Service Type:|\s*$)/i);
  result.serviceType = extractMatch(/Service Type:\s*(.*?)(?=\s*Project Overview:|\s*$)/i);
  
  result.projectOverview = extractMatch(/Project Overview:\s*(.*?)(?=\s*Primary Objectives:|\s*Features\/Deliverables Included:|\s*$)/is);
  
  const objectivesText = extractMatch(/Primary Objectives:\s*(.*?)(?=\s*Features\/Deliverables Included:|\s*$)/is);
  if (objectivesText) {
    result.objectives = objectivesText.split(/[-*•\n]+/).map(s => s.trim()).filter(s => s.length > 0);
  }

  const deliverablesText = extractMatch(/Features\/Deliverables Included:\s*(.*?)(?=\s*Website Type:|\s*Design Style:|\s*Website Build Type:|\s*$)/is);
  if (deliverablesText) {
    result.deliverables = deliverablesText.split(/[-*•\n]+/).map(s => s.trim()).filter(s => s.length > 0);
  }

  result.techStack.frontend = extractMatch(/Frontend Framework:\s*(.*?)(?=\s*Backend Technology:|\s*$)/i) || extractMatch(/Frontend:\s*(.*?)(?=\s*Backend:|\s*$)/i);
  result.techStack.backend = extractMatch(/Backend Technology:\s*(.*?)(?=\s*Database:|\s*$)/i) || extractMatch(/Backend:\s*(.*?)(?=\s*Database:|\s*$)/i);
  result.techStack.database = extractMatch(/Database:\s*(.*?)(?=\s*Hosting:|\s*$)/i);
  result.techStack.hosting = extractMatch(/Hosting:\s*(.*?)(?=\s*Page Count:|\s*Launch Timeline:|\s*$)/i);

  if (!result.projectOverview && result.objectives.length === 0 && result.deliverables.length === 0) {
    return null;
  }

  return result;
};const DraftProposalRow = memo(function DraftProposalRow({ item }) {
  const [overviewExpanded, setOverviewExpanded] = useState(false);
  const [objectivesExpanded, setObjectivesExpanded] = useState(false);

  const parsedData = parseProposalString(item.summary);
  const projectOverview = parsedData?.projectOverview || item.summary || "";
  const objectives = parsedData?.objectives || [];
  
  const dateStr = item.dateLabel || (item.updatedAt || item.createdAt
    ? new Date(item.updatedAt || item.createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }));

  return (
    <div className="w-full min-w-0">
      {/* Top Header Section */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center justify-center rounded bg-[#FFF0EA] dark:bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#FF6A39] dark:text-primary">
          DRAFT
        </div>
        
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
            {dateStr}
          </span>
          
          {/* Three-dot dropdown menu */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                aria-label="Draft options"
              >
                <MoreVertical className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl border border-border bg-card p-1 shadow-md">
              <DropdownMenuItem
                onClick={item.onDelete}
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive cursor-pointer"
              >
                <Trash2 className="size-3.5" />
                <span>Delete Draft</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Title */}
      <h3 
        title={item.title}
        className="mt-4 truncate text-xl font-bold tracking-tight text-foreground"
      >
        {item.title}
      </h3>

      {/* Service Type Line */}
      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Briefcase className="size-3.5 text-muted-foreground/70 shrink-0" />
        <span className="truncate">Service: {item.tag || "General"}</span>
      </div>

      {/* Collapsible Sections Container */}
      <div className="mt-4 flex flex-col gap-2.5">
        {/* Project Overview Collapsible Box */}
        {projectOverview && (
          <div className="border border-border/60 bg-background rounded-xl overflow-hidden">
            <div
              onClick={() => setOverviewExpanded(!overviewExpanded)}
              className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-muted/30 transition-colors"
            >
              <span className="text-xs font-semibold text-foreground">Project Overview</span>
              {overviewExpanded ? (
                <ChevronUp className="size-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-4 text-muted-foreground" />
              )}
            </div>
            {overviewExpanded && (
              <div className="border-t border-border/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground bg-muted/10">
                {projectOverview}
              </div>
            )}
          </div>
        )}

        {/* Key Objectives Collapsible Box */}
        {objectives.length > 0 && (
          <div className="border border-border/60 bg-background rounded-xl overflow-hidden">
            <div
              onClick={() => setObjectivesExpanded(!objectivesExpanded)}
              className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-muted/30 transition-colors"
            >
              <span className="text-xs font-semibold text-foreground">Key Objectives</span>
              {objectivesExpanded ? (
                <ChevronUp className="size-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-4 text-muted-foreground" />
              )}
            </div>
            {objectivesExpanded && (
              <div className="border-t border-border/40 px-4 py-3 bg-muted/10">
                <ul className="flex flex-col gap-2">
                  {objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                      <CheckCircle2 className="size-3.5 shrink-0 text-primary mt-[1px]" />
                      <span className="leading-relaxed">{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Budget and Timeline Boxes */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="flex flex-col items-center justify-center gap-1 rounded-xl bg-[#F8F9FA] dark:bg-muted/10 py-3.5 text-center">
          <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground/85 leading-none">Budget</span>
          <span className="text-[17px] font-extrabold text-foreground truncate max-w-full px-2 mt-1.5">{item.budget}</span>
        </div>
        <div className="flex flex-col items-center justify-center gap-1 rounded-xl bg-[#F8F9FA] dark:bg-muted/10 py-3.5 text-center">
          <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground/85 leading-none">Timeline</span>
          <span className="text-[17px] font-extrabold text-foreground truncate max-w-full px-2 mt-1.5">{item.timeline || "Not set"}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 flex items-center gap-3 w-full">
        <button
          type="button"
          onClick={item.onView}
          className="flex-1 flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F8F9FA] dark:bg-white/[0.06] hover:bg-muted/80 dark:hover:bg-white/[0.1] text-xs font-bold text-foreground transition-colors cursor-pointer border border-transparent"
        >
          <Eye className="size-4 text-muted-foreground" />
          <span>View Details</span>
        </button>

        <button
          type="button"
          onClick={item.onSend}
          className="flex-1 flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] hover:bg-primary/80 text-xs font-bold text-white dark:text-[#141414] transition-colors cursor-pointer"
        >
          <Send className="size-3.5" />
          <span>Send Proposal</span>
        </button>
      </div>
    </div>
  );
});

const DraftProposalCard = memo(function DraftProposalCard({ item }) {
  return (
    <article className="flex w-full min-w-0 flex-col overflow-x-clip overflow-y-hidden rounded-[20px] border border-border bg-card p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] transition-transform duration-200 hover:-translate-y-1">
      <DraftProposalRow item={item} />
    </article>
  );
});

const Proposals = memo(function Proposals({
  draftProposalRows,
  onOpenQuickProject,
  className = "",
}) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [confirmState, setConfirmState] = useState(null);

  const showConfirm = useCallback((message) => {
    return new Promise((resolve) => {
      setConfirmState({
        message,
        resolve: (value) => {
          setConfirmState(null);
          resolve(value);
        },
      });
    });
  }, []);
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
  const [isFreelancerAiLoading, setIsFreelancerAiLoading] = useState(false);
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
  const [draftCardHeight, setDraftCardHeight] = useState(0);
  const draftCardRefs = useRef({});
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

    const backendDrafts = (dashboardData?.projects || [])
      .filter((project) => project?.status === "DRAFT")
      .map(mapApiDraftProject);

    const deduplicatedDrafts = [];
    const seenSignatures = new Set();
    
    for (const draft of backendDrafts) {
      const sig = getProposalSignature(draft);
      if (!seenSignatures.has(sig)) {
        seenSignatures.add(sig);
        deduplicatedDrafts.push(draft);
      }
    }

    const sortedProposals = deduplicatedDrafts.sort((left, right) => {
      const leftTime = new Date(left.updatedAt || left.createdAt || 0).getTime();
      const rightTime = new Date(right.updatedAt || right.createdAt || 0).getTime();
      return rightTime - leftTime;
    });

    setSavedDrafts(sortedProposals);
    
    const draftIdFromUrl = searchParams.get("draftId");
    if (draftIdFromUrl) {
      setActiveDraftId(draftIdFromUrl);
    } else if (sortedProposals.length > 0 && !activeDraftId) {
      setActiveDraftId(sortedProposals[0].id);
    }
  }, [isControlled, dashboardData?.projects, searchParams, activeDraftId]);

  useEffect(() => {
    if (isControlled) return undefined;
    loadDrafts();
  }, [loadDrafts]);

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
    nextSearchParams.delete("draftId");
    setSearchParams(nextSearchParams, { replace: true });
  }, [activeSavedDraft, isControlled, searchParams, setSearchParams]);

  useEffect(() => {
    if (isControlled || !showFreelancerSelect || !user?.id) return;

    let cancelled = false;

    const loadFreelancers = async () => {
      setIsFreelancersLoading(true);
      setIsFreelancerAiLoading(false);
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

        const matchedFreelancers = extractMatchedFreelancersFromPayload(
          matchedFreelancerPayload,
        );

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
        setIsFreelancersLoading(false);

        if (normalizedFreelancers.length === 0) {
          setIsFreelancerAiLoading(false);
          return;
        }

        setIsFreelancerAiLoading(true);

        try {
          const cataAiPayload = await fetchMatchedFreelancerCataAi(
            proposalForFreelancerSelection,
            normalizedFreelancers,
          );

          if (cancelled) return;

          const cataAiFreelancers = extractMatchedFreelancersFromPayload(cataAiPayload)
            .filter(
              (freelancer, index, collection) =>
                freelancer?.id &&
                collection.findIndex((item) => item?.id === freelancer.id) === index,
            )
            .filter(
              (freelancer) =>
                freelancer?.id !== user.id && hasFreelancerRole(freelancer),
            )
            .map((freelancer) => normalizeFreelancerCardData(freelancer));

          if (cataAiFreelancers.length > 0) {
            startTransition(() => {
              setSuggestedFreelancers(cataAiFreelancers);
            });
          }
        } catch (error) {
          if (!cancelled) {
            console.warn("[Proposal Match][Cata AI] Background enrichment failed:", error);
          }
        } finally {
          if (!cancelled) {
            setIsFreelancerAiLoading(false);
          }
        }
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load suggested freelancers:", error);
        setSuggestedFreelancers([]);
        setFreelancerFetchStatus("error");
        setFreelancerFetchError(
          error?.message || "Unable to load matched freelancers right now.",
        );
        setIsFreelancerAiLoading(false);
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
      setIsFreelancerAiLoading(false);
      setFreelancerFetchStatus("idle");
      setFreelancerFetchError("");
      setSelectedDraftForSend(null);
    }
  }, [showFreelancerSelect]);

  const handleDeleteDraft = useCallback(
    async (draftId, silent = false) => {
      if (isControlled || !draftId) return;
      
      if (!silent) {
        const confirmed = await showConfirm("Are you sure you want to delete this proposal draft?");
        if (!confirmed) return;
      }

      if (dashboardData?.authFetch) {
        try {
          // Extract the real project ID from "draft-project:ID"
          const realProjectId = String(draftId || "").replace(/^draft-project:/, "");
          
          await dashboardData.authFetch(`/projects/${realProjectId}`, { method: "DELETE" });
          if (dashboardData.refreshDashboardData) {
            dashboardData.refreshDashboardData();
          }
        } catch (error) {
          console.error("Failed to delete draft", error);
        }
      }

      if (activeDraftId === draftId) {
        setActiveDraftId(null);
      }

      if (selectedDraftForSend?.id === draftId) {
        setSelectedDraftForSend(null);
      }
    },
    [isControlled, selectedDraftForSend?.id, activeDraftId, dashboardData, showConfirm],
  );

  const internalDraftProposalRows = useMemo(
    () =>
      visibleSavedDrafts.map((proposal) => ({
        id: proposal.id,
        title: resolveDraftTitle(proposal),
        tag: resolveDraftService(proposal),
        summary: proposal.summary || proposal.content || proposal.proposalContent || "",
        budget: formatDraftBudget(proposal.budget),
        timeline: formatDraftTimeline(
          proposal.timeline || proposal.launchTimeline || proposal.duration,
        ),
        dateLabel: formatDraftDate(proposal.updatedAt || proposal.createdAt),
        isAgencyProposal: resolveProposalAgencyFlag(proposal),
        serviceEntries: buildDraftServiceEntries(proposal),
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

  const draftRedirectCards = useMemo(() => {
    return [
      {
        id: "create-proposal-redirect",
        title: "Create New Proposal",
        onClick: handleOpenQuickProject,
      },
    ];
  }, [handleOpenQuickProject]);

  const totalVisibleDraftCards = items.length + draftRedirectCards.length;
  const shouldUseDraftProposalCarousel = isMobile
    ? totalVisibleDraftCards > 1
    : totalVisibleDraftCards > 2;

  const carouselItemClassName =
    "basis-full pl-[2px] pr-[2px] pt-1 md:basis-[calc((100%-1.25rem)/2)] lg:basis-[calc((100%-1.25rem)/2)] xl:basis-[calc((100%-1.25rem)/2)] 2xl:basis-[calc((100%-1.25rem)/2)]";

  const gridClassName =
    "grid items-start gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2 lg:gap-6 xl:gap-7";

  const measureDraftCardHeights = useCallback(() => {
    const heights = Object.values(draftCardRefs.current)
      .map((card) => card?.getBoundingClientRect().height || 0)
      .filter((height) => height > 0);

    if (heights.length === 0) {
      setDraftCardHeight(0);
      return;
    }

    const maxHeight = Math.ceil(Math.max(...heights));
    setDraftCardHeight((currentHeight) =>
      currentHeight === maxHeight ? currentHeight : maxHeight,
    );
  }, []);

  useEffect(() => {
    if (items.length === 0) {
      setDraftCardHeight(0);
      return undefined;
    }

    let frameId = 0;
    const scheduleMeasure = () => {
      if (typeof window === "undefined") {
        return;
      }
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(measureDraftCardHeights);
    };

    scheduleMeasure();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            scheduleMeasure();
          })
        : null;

    Object.values(draftCardRefs.current).forEach((card) => {
      if (card && resizeObserver) {
        resizeObserver.observe(card);
      }
    });

    window.addEventListener("resize", scheduleMeasure);

    return () => {
      window.removeEventListener("resize", scheduleMeasure);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.cancelAnimationFrame(frameId);
    };
  }, [measureDraftCardHeights, items.length]);

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

        const normalizedProjectStatus = String(
          project.status || "OPEN",
        ).toUpperCase();
        const syncedAt = new Date().toISOString();

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

        setSelectedDraftForSend((current) =>
          current?.id === proposal.id
            ? {
                ...current,
                projectId: project.id,
                syncedProjectId: project.id,
                projectStatus: normalizedProjectStatus,
                syncedAt,
                project: {
                  ...(current.project && typeof current.project === "object"
                    ? current.project
                    : {}),
                  id: project.id,
                  status: normalizedProjectStatus,
                },
              }
            : current,
        );
        setSavedDrafts((current) =>
          current.filter((entry) => entry?.id !== proposal.id),
        );
        setActiveDraftId((current) => (current === proposal.id ? null : current));
        await refreshDashboardData?.({ silent: true });

        toast.success(`Proposal sent to ${freelancer.fullName || "freelancer"}!`);
        return true;
      } catch (error) {
        console.error("Failed to send proposal:", error);
        toast.error(error?.message || "Failed to send proposal. Please try again.");
        return false;
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

  return (
    <>
      <section className={cn("w-full min-w-0", className)}>
        <div className="mb-4 flex flex-col gap-3.5 sm:mb-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex items-center justify-between w-full sm:w-auto min-w-0">
            <div className="flex items-center gap-3">
              <h2 className="text-[22px] sm:text-[1.75rem] font-semibold tracking-[-0.02em] text-foreground">
                Proposals
              </h2>
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary/10 px-2 text-[11px] font-bold text-primary">
                {items.length}
              </span>
            </div>
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
              <div className="flex size-14 items-center justify-center rounded-full bg-white/[0.06] text-muted-foreground sm:size-16">
                <ClipboardList className="size-6 sm:size-7" />
              </div>
              <p className="mt-6 text-base font-medium text-foreground">
                No draft proposals yet
              </p>
              <p className="mt-2 max-w-[320px] text-sm text-muted-foreground">
                Start a new proposal to build your project brief and invite
                freelancers.
              </p>
              <button
                type="button"
                onClick={handleOpenQuickProject}
                className="mt-6 inline-flex items-center justify-center rounded-[14px] bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/80 dark:text-[#141414]"
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
                    className={carouselItemClassName}
                  >
                    <div
                      ref={(node) => {
                        draftCardRefs.current[item.id] = node;
                      }}
                    >
                      <DraftProposalCard item={item} />
                    </div>
                  </CarouselItem>
                ))}
                {draftRedirectCards.map((item) => (
                  <CarouselItem
                    key={item.id}
                    className={carouselItemClassName}
                  >
                    <div
                      className="h-full"
                      style={
                        draftCardHeight > 0
                          ? { height: `${draftCardHeight}px` }
                          : undefined
                      }
                    >
                      <ProjectRedirectCard
                        item={{
                          id: item.id,
                          Icon: Plus,
                          title: item.title,
                          onClick: item.onClick,
                        }}
                        className="w-full h-full"
                      />
                    </div>
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
        ) : (
          <div className={gridClassName}>
            {items.map((item) => (
              <div
                key={item.id}
                ref={(node) => {
                  draftCardRefs.current[item.id] = node;
                }}
                className="w-full"
              >
                <DraftProposalCard item={item} />
              </div>
            ))}
            {draftRedirectCards.map((item) => (
              <div
                key={item.id}
                style={
                  draftCardHeight > 0
                    ? { height: `${draftCardHeight}px` }
                    : undefined
                }
                className="w-full"
              >
                <ProjectRedirectCard
                  item={{
                    id: item.id,
                    Icon: Plus,
                    title: item.title,
                    onClick: item.onClick,
                  }}
                  className="w-full h-full"
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {!isControlled ? (
        <>
          <FreelancerSelectionDialog
            open={showFreelancerSelect}
            onOpenChange={setShowFreelancerSelect}
            savedProposal={proposalForFreelancerSelection}
            isLoadingFreelancers={isFreelancersLoading}
            isFreelancerAiLoading={isFreelancerAiLoading}
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
          <AlertDialog open={Boolean(confirmState)} onOpenChange={(open) => !open && confirmState?.resolve(false)}>
            <AlertDialogContent className="border border-border bg-background text-foreground shadow-[0_28px_84px_-48px_rgba(0,0,0,0.4)] dark:shadow-[0_28px_84px_-48px_rgba(0,0,0,1)] sm:max-w-md rounded-[24px]">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-lg font-semibold text-foreground">
                  Delete Proposal Draft
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm leading-6 text-muted-foreground">
                  {confirmState?.message || "Are you sure you want to delete this proposal draft? This action cannot be undone."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2 sm:gap-0 mt-4">
                <AlertDialogCancel className="border border-border bg-background text-foreground hover:bg-muted hover:text-foreground dark:border-white/12 dark:bg-white/[0.03] dark:text-white dark:hover:bg-white/[0.06] dark:hover:text-white rounded-full">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => confirmState?.resolve(true)}
                  className="bg-rose-500 text-white hover:bg-rose-600 rounded-full dark:bg-rose-600 dark:text-white dark:hover:bg-rose-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : null}
    </>
  );
});

export default Proposals;


