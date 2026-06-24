import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { useNavigate, useSearchParams } from "react-router-dom";
import ClipboardList from "lucide-react/dist/esm/icons/clipboard-list";
import FileText from "lucide-react/dist/esm/icons/file-text";
import User from "lucide-react/dist/esm/icons/user";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Folder from "lucide-react/dist/esm/icons/folder";
import Send from "lucide-react/dist/esm/icons/send";
import Eye from "lucide-react/dist/esm/icons/eye";
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
import { extractLabeledLineValue, extractStructuredFieldValue } from "@/shared/lib/labeled-fields";
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
  extractAgencyProposalServiceEntries,
  resolveBestMatchFreelancerIds,
  resolveProposalAgencyFlag,
} from "@/components/client/client-proposal/proposal-utils.js";
import { resolveFreelancerMatchPercent } from "@/shared/lib/proposal-match";
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

  const matchPercent = resolveFreelancerMatchPercent(freelancer, null);
  if (Number.isFinite(Number(matchPercent))) {
    freelancer.matchPercent = Number(matchPercent);
    freelancer.matchScore = Number(matchPercent);
    freelancer.projectRelevanceScore = Number(matchPercent);
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
};

const DraftProposalRow = memo(function DraftProposalRow({ item }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const serviceEntries = resolveDraftRowServiceEntries(item);
  const shouldShowAgencyServiceCards =
    (Boolean(item.isAgencyProposal) || serviceEntries.length > 1)
    && serviceEntries.length > 0;

  const parsedData = parseProposalString(item.summary);

  const actionButtons = (
    <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end border-t border-border pt-6">
      <button
        type="button"
        onClick={item.onView}
        className={cn(
          draftProposalActionButtonClassName,
          "h-12 w-full justify-center gap-2 border border-border bg-background text-[0.92rem] text-foreground hover:bg-muted/80 sm:w-[160px] rounded-lg",
        )}
      >
        <Eye className="size-4 shrink-0" />
        View Details
      </button>

      <button
        type="button"
        onClick={item.onSend}
        className={cn(
          draftProposalActionButtonClassName,
          "h-12 w-full justify-center gap-2 bg-primary px-7 text-[0.92rem] text-primary-foreground hover:bg-primary/90 sm:w-[180px] rounded-lg",
        )}
      >
        <Send className="size-4 shrink-0" />
        Send Proposal
      </button>
    </div>
  );

  let contentPanels;

  if (shouldShowAgencyServiceCards) {
    contentPanels = (
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-3 xl:auto-rows-fr">
        {serviceEntries.map((entry, index) => (
          <div
            key={`${entry.name}-${index}`}
            className={cn(draftProposalDetailBlockClassName, "h-full")}
          >
            <p className="min-h-[2.5rem] break-words text-[0.82rem] font-medium leading-5 text-foreground">
              {entry.name}
            </p>

            <div className="mt-2.5 flex items-center gap-3 text-[0.9rem] leading-none">
              <p className="truncate font-semibold tracking-[-0.02em] text-muted-foreground">
                {entry.budget}
              </p>
              <span className="h-4 w-px shrink-0 bg-border dark:bg-white/[0.12]" aria-hidden="true" />
              <p className="truncate font-medium text-muted-foreground">
                {entry.timeline}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  } else if (parsedData) {
    contentPanels = (
      <div className="flex flex-col gap-8 w-full mt-2">
        
        {/* Top Header Section */}
        <div className="flex flex-col gap-2">
          <h2 className="text-[22px] sm:text-3xl font-bold tracking-tight text-foreground">{item.title || parsedData.businessName || "Proposal"}</h2>
          <div className="flex flex-wrap items-center gap-4 text-[0.85rem] font-medium text-muted-foreground">
            {parsedData.clientName && (
              <div className="flex items-center gap-1.5">
                <User className="size-4" />
                <span>Client: {parsedData.clientName}</span>
              </div>
            )}
            {parsedData.serviceType && (
              <div className="flex items-center gap-1.5">
                <Folder className="size-4" />
                <span>Service: {parsedData.serviceType}</span>
              </div>
            )}
          </div>
        </div>

        {/* Middle Collapsible Section */}
        <div className={cn(
          "relative flex flex-col gap-8 w-full overflow-hidden transition-[max-height] duration-500 ease-in-out",
          !isExpanded ? "max-h-[280px]" : "max-h-[2500px]"
        )}>
          {/* Project Overview */}
          {parsedData.projectOverview && (
            <div className="space-y-3">
              <h3 className="text-[1.1rem] font-semibold text-foreground tracking-tight">Project Overview</h3>
              <div className="rounded-[10px] border border-primary/20 bg-primary/5 p-4 text-[0.95rem] leading-relaxed text-foreground">
                {parsedData.projectOverview}
              </div>
            </div>
          )}

          {/* Main Content Split */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            
            {/* Key Objectives */}
            {parsedData.objectives.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-[0.75rem] font-bold uppercase tracking-wider text-muted-foreground">Key Objectives</h3>
                <ul className="flex flex-col gap-3">
                  {parsedData.objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[0.9rem] text-foreground">
                      <CheckCircle2 className="size-5 shrink-0 text-primary mt-[1px]" />
                      <span className="leading-relaxed">{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Technical Stack */}
            {(parsedData.techStack.frontend || parsedData.techStack.backend || parsedData.techStack.database || parsedData.techStack.hosting) && (
              <div className="space-y-4">
                <div className="rounded-[12px] bg-muted/40 dark:bg-muted/20 border border-border/50 p-6">
                  <h3 className="text-[0.75rem] font-bold uppercase tracking-wider text-primary mb-5">Technical Stack</h3>
                  <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                    {parsedData.techStack.frontend && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[0.7rem] uppercase font-semibold text-muted-foreground">Frontend</span>
                        <span className="text-[0.95rem] font-bold text-foreground">{parsedData.techStack.frontend}</span>
                      </div>
                    )}
                    {parsedData.techStack.backend && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[0.7rem] uppercase font-semibold text-muted-foreground">Backend</span>
                        <span className="text-[0.95rem] font-bold text-foreground">{parsedData.techStack.backend}</span>
                      </div>
                    )}
                    {parsedData.techStack.database && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[0.7rem] uppercase font-semibold text-muted-foreground">Database</span>
                        <span className="text-[0.95rem] font-bold text-foreground">{parsedData.techStack.database}</span>
                      </div>
                    )}
                    {parsedData.techStack.hosting && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[0.7rem] uppercase font-semibold text-muted-foreground">Hosting</span>
                        <span className="text-[0.95rem] font-bold text-foreground">{parsedData.techStack.hosting}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Included Deliverables */}
          {parsedData.deliverables.length > 0 && (
            <div className="space-y-4 border-t border-border/60 pt-6">
              <h3 className="text-[0.75rem] font-bold uppercase tracking-wider text-muted-foreground">Included Deliverables</h3>
              <div className="flex flex-wrap gap-2.5">
                {parsedData.deliverables.map((del, i) => (
                  <div key={i} className="rounded-full bg-secondary border border-border/40 px-4 py-2 text-[0.8rem] font-semibold text-secondary-foreground">
                    {del}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Fading Overlay */}
          {!isExpanded && (
            <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-background dark:from-card to-transparent pointer-events-none" />
          )}
        </div>

        {/* Read More Toggle */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[0.85rem] font-bold text-primary hover:underline self-start"
        >
          {isExpanded ? "Show less" : "Read more"}
        </button>

        {/* Budget and Timeline */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4">
          <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-muted/30 dark:bg-muted/10 py-4 sm:py-6 text-center">
            <span className="text-[0.65rem] sm:text-[0.75rem] font-bold uppercase tracking-wider text-muted-foreground">Budget</span>
            <span className="text-[1.15rem] sm:text-[1.5rem] font-bold text-foreground truncate max-w-full px-2">{item.budget}</span>
          </div>
          <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-muted/30 dark:bg-muted/10 py-4 sm:py-6 text-center">
            <span className="text-[0.65rem] sm:text-[0.75rem] font-bold uppercase tracking-wider text-muted-foreground">Timeline</span>
            <span className="text-[1.15rem] sm:text-[1.5rem] font-bold text-foreground truncate max-w-full px-2">{item.timeline || "Not set"}</span>
          </div>
        </div>

      </div>
    );
  } else {
    // Fallback original view
    contentPanels = (
      <div className="space-y-4">
        <div className="flex flex-col items-start gap-1">
          <p className={cn("max-w-[42rem] text-[1.05rem] leading-7 text-muted-foreground", !isExpanded && "line-clamp-3")}>
            {item.summary || "Draft proposal ready to review and send."}
          </p>
          {item.summary?.length > 150 && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[0.88rem] font-semibold text-primary hover:underline"
            >
              {isExpanded ? "Read less" : "Read more"}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
          <div className={cn(draftProposalDetailBlockClassName, "px-3 py-3 sm:px-4 sm:py-4")}>
            <p className="text-[0.65rem] sm:text-[0.78rem] uppercase tracking-[0.18em] text-muted-foreground">
              Budget
            </p>
            <p className="mt-2 text-[1rem] sm:text-[1.15rem] font-semibold tracking-[-0.02em] text-foreground truncate max-w-full">
              {item.budget}
            </p>
          </div>

          <div className={cn(draftProposalDetailBlockClassName, "px-3 py-3 sm:px-4 sm:py-4")}>
            <p className="text-[0.65rem] sm:text-[0.78rem] uppercase tracking-[0.18em] text-muted-foreground">
              Timeline
            </p>
            <p className="mt-2 text-[1rem] sm:text-[1.15rem] font-semibold tracking-[-0.02em] text-foreground truncate max-w-full">
              {item.timeline || "Not set"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 pb-2">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-primary">
            DRAFT
          </div>
          <p className="text-[0.8rem] font-medium tracking-[0.02em] text-muted-foreground sm:text-[0.85rem]">
            {item.dateLabel || new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <button
          type="button"
          onClick={item.onDelete}
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
          aria-label={`Delete ${item.title}`}
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {!parsedData && (
        <p className="min-w-0 truncate text-[1.15rem] font-bold tracking-tight text-foreground sm:text-[1.25rem] lg:text-[1.35rem] mb-4">
          {item.title}
        </p>
      )}

      <div className="w-full min-w-0">
        {contentPanels}
      </div>
      {actionButtons}
    </div>
  );
});

const DraftProposalCard = memo(function DraftProposalCard({ item }) {
  return (
    <article className="flex h-auto w-full min-w-0 flex-col overflow-x-clip overflow-y-hidden rounded-[28px] border border-border bg-background p-4 shadow-[0_20px_50px_-35px_rgba(16,24,40,0.22)] transition-transform duration-200 hover:-translate-y-1 sm:max-w-[400px] sm:p-4 lg:max-w-[440px] xl:max-w-[460px] dark:border-white/[0.06] dark:bg-card dark:shadow-[0_20px_50px_-35px_rgba(0,0,0,0.65)]">
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

const Proposals = memo(function Proposals({
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
  const [draftToDeleteId, setDraftToDeleteId] = useState(null);
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
        summary: proposal.summary || proposal.content || proposal.proposalContent || "",
        budget: formatDraftBudget(proposal.budget),
        timeline: formatDraftTimeline(
          proposal.timeline || proposal.launchTimeline || proposal.duration,
        ),
        dateLabel: getSavedProposalDisplayDate(proposal),
        isAgencyProposal: resolveProposalAgencyFlag(proposal),
        serviceEntries: buildDraftServiceEntries(proposal),
        onSend: () => {
          setActiveDraftId(proposal.id);
          setSelectedDraftForSend(proposal);
          setShowFreelancerSelect(true);
        },
        onView: () => navigate(buildDraftProposalPath(proposal.id, "view")),
        onDelete: () => setDraftToDeleteId(proposal.id),
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
        <div className="mb-4 flex items-center justify-between gap-4 sm:mb-5">
          <div className="min-w-0">
            <h2 className="text-[22px] sm:text-[1.75rem] font-semibold tracking-[-0.02em] text-foreground">
              Proposals
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
                    className="basis-full pl-[2px] pr-[2px] pt-1 sm:basis-auto sm:max-w-[400px] lg:max-w-[440px]"
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

      <AlertDialog open={Boolean(draftToDeleteId)} onOpenChange={(open) => !open && setDraftToDeleteId(null)}>
        <AlertDialogContent className="border border-border bg-background text-foreground shadow-[0_28px_84px_-48px_rgba(0,0,0,0.4)] dark:shadow-[0_28px_84px_-48px_rgba(0,0,0,1)] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Proposal Draft?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this proposal draft? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border border-border bg-transparent hover:bg-muted text-foreground">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (draftToDeleteId) {
                  const targetId = draftToDeleteId;
                  setDraftToDeleteId(null);
                  handleDeleteDraft(targetId);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

export default Proposals;
