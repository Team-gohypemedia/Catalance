import { memo, useState, useEffect, useRef } from "react";


import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Layers3 from "lucide-react/dist/esm/icons/layers-3";
import Search from "lucide-react/dist/esm/icons/search";
import Send from "lucide-react/dist/esm/icons/send";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Star from "lucide-react/dist/esm/icons/star";
import X from "lucide-react/dist/esm/icons/x";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Input,
} from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveFreelancerMatchPercent } from "@/shared/lib/proposal-match";


const getDisplayInitials = (name = "") => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "FR";
  if (parts.length === 1) {
    const first = parts[0].charAt(0).toUpperCase();
    const second = parts[0].charAt(1).toUpperCase();
    return `${first}${second}`.trim() || first || "F";
  }

  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
};

const resolveImageUrl = (value) => {
  if (!value) return "";
  if (typeof value === "string") {
    const url = value.trim();
    if (!url || url.startsWith("blob:")) return "";
    return url;
  }
  if (typeof value === "object") {
    return resolveImageUrl(
      value.uploadedUrl || value.url || value.src || value.value || "",
    );
  }
  return "";
};

const resolveFreelancerCoverImage = (freelancer = {}) => {
  const profileDetails =
    freelancer?.profileDetails && typeof freelancer.profileDetails === "object"
      ? freelancer.profileDetails
      : freelancer?.freelancerProfile?.profileDetails &&
          typeof freelancer.freelancerProfile.profileDetails === "object"
        ? freelancer.freelancerProfile.profileDetails
        : {};

  const identity =
    profileDetails?.identity && typeof profileDetails.identity === "object"
      ? profileDetails.identity
      : {};

  const serviceDetails =
    profileDetails?.serviceDetails &&
    typeof profileDetails.serviceDetails === "object"
      ? profileDetails.serviceDetails
      : {};

  const serviceCoverImage = Object.values(serviceDetails)
    .filter((detail) => detail && typeof detail === "object")
    .map((detail) => resolveImageUrl(detail?.coverImage || detail?.image))
    .find(Boolean);

  return (
    resolveImageUrl(freelancer?.coverImage) ||
    resolveImageUrl(freelancer?.personal?.coverImage) ||
    resolveImageUrl(identity?.coverImage) ||
    serviceCoverImage ||
    ""
  );
};
const getDeliveredProjectCount = (freelancer = {}) => {
  if (Number.isFinite(Number(freelancer?.projectsDelivered))) {
    return Math.max(0, Math.round(Number(freelancer.projectsDelivered)));
  }

  if (
    Array.isArray(freelancer?.freelancerProjects) &&
    freelancer.freelancerProjects.length > 0
  ) {
    return freelancer.freelancerProjects.length;
  }

  if (
    Array.isArray(freelancer?.portfolioProjects) &&
    freelancer.portfolioProjects.length > 0
  ) {
    return freelancer.portfolioProjects.length;
  }

  if (Array.isArray(freelancer?.portfolio) && freelancer.portfolio.length > 0) {
    return freelancer.portfolio.length;
  }

  if (
    typeof freelancer?.portfolio === "string" &&
    freelancer.portfolio.trim().startsWith("[")
  ) {
    try {
      const parsedPortfolio = JSON.parse(freelancer.portfolio);
      if (Array.isArray(parsedPortfolio)) return parsedPortfolio.length;
    } catch {
      return 0;
    }
  }

  return 0;
};

const formatDisplayLabel = (value = "") =>
  String(value || "")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b([a-z])/g, (match, char) => char.toUpperCase())
    .trim();

const MATCH_SOURCE_LABELS = Object.freeze({
  completed_project: "Completed Project Match",
  case_study: "Case Study Match",
  global_skills: "Global Skills Match",
  profile_skills: "Profile Skills Match",
});

const getMatchedSkillBadges = (freelancer = {}) => {
  const values = Array.isArray(freelancer?.matchedSkills) && freelancer.matchedSkills.length > 0
    ? freelancer.matchedSkills
    : Array.isArray(freelancer?.caseStudyMatch?.matchedSkills) &&
        freelancer.caseStudyMatch.matchedSkills.length > 0
      ? freelancer.caseStudyMatch.matchedSkills
      : Array.isArray(freelancer?.matchedTechnologies)
        ? freelancer.matchedTechnologies
        : Array.isArray(freelancer?.matchHighlights)
          ? freelancer.matchHighlights
        : [];

  return Array.from(new Set(values.map((entry) => String(entry || "").trim()).filter(Boolean))).slice(0, 3);
};

const getMatchedServiceLabel = (freelancer = {}) =>
  formatDisplayLabel(
    freelancer?.matchedService?.serviceName ||
      freelancer?.matchedService?.serviceKey ||
      freelancer?.serviceName ||
      freelancer?.serviceKey ||
      "",
  );

const getCoveredServiceLabels = (freelancer = {}) => {
  const directValues = Array.isArray(freelancer?.coveredServices)
    ? freelancer.coveredServices
    : [];
  if (directValues.length > 0) {
    return Array.from(
      new Set(directValues.map((entry) => formatDisplayLabel(entry)).filter(Boolean)),
    );
  }

  const serviceMatches = Array.isArray(freelancer?.serviceMatches)
    ? freelancer.serviceMatches
    : [];
  return Array.from(
    new Set(
      serviceMatches
        .map((entry) => formatDisplayLabel(entry?.serviceName || entry?.serviceKey || ""))
        .filter(Boolean),
    ),
  );
};

const isAgencyMatch = (freelancer = {}) =>
  freelancer?.isAgencyProfile === true || String(freelancer?.profileRole || "").toLowerCase() === "agency";

const isMultiServiceMatch = (freelancer = {}) => getCoveredServiceLabels(freelancer).length > 1;

const groupFreelancersForDisplay = (freelancers = []) => {
  const normalized = Array.isArray(freelancers) ? freelancers : [];
  const multiServiceMatches = [];
  const standardMatches = [];

  normalized.forEach((freelancer) => {
    if (isMultiServiceMatch(freelancer)) {
      multiServiceMatches.push(freelancer);
      return;
    }

    standardMatches.push(freelancer);
  });

  return [
    multiServiceMatches.length > 0
      ? {
          key: "multi-service",
          title: "Multi-Service Matches",
          description: "Matches covering all required services.",
          freelancers: multiServiceMatches,
        }
      : null,
    standardMatches.length > 0
      ? {
          key: "standard",
          title: "Other Matches",
          description: "Service-aligned matches ranked by standard proposal matcher.",
          freelancers: standardMatches,
        }
      : null,
  ].filter(Boolean);
};

const getBudgetFitLabel = (freelancer = {}) => {
  const budget = freelancer?.budgetCompatibility || {};
  const percentage = Number.isFinite(Number(freelancer?.budgetFitPercent))
    ? Math.max(0, Math.min(100, Math.round(Number(freelancer.budgetFitPercent))))
    : Number.isFinite(Number(freelancer?.budgetMatchPercentage))
      ? Math.max(0, Math.min(100, Math.round(Number(freelancer.budgetMatchPercentage))))
      : Number.isFinite(Number(budget?.budgetMatchPercentage))
        ? Math.max(0, Math.min(100, Math.round(Number(budget.budgetMatchPercentage))))
        : null;

  if (percentage !== null) {
    return `${percentage}%`;
  }

  if (typeof budget?.displayLabel === "string" && budget.displayLabel.trim()) {
    return budget.displayLabel.trim();
  }

  if (budget?.withinRange === false && budget?.hardRejected) {
    return "0%";
  }

  return "Flexible";
};

const getMatchSourceLabel = (freelancer = {}) =>
  MATCH_SOURCE_LABELS[freelancer?.matchSource] ||
  MATCH_SOURCE_LABELS[freelancer?.sourceLabel] ||
  formatDisplayLabel(freelancer?.matchSource || freelancer?.sourceLabel || "");

const getAiMatchConfidenceLabel = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "high") return "High confidence";
  if (normalized === "low") return "Low confidence";
  return "Medium confidence";
};

const FreelancerSelectionDialog = ({
  open,
  onOpenChange,
  savedProposal,
  isLoadingFreelancers,
  isFreelancerAiLoading = false,
  freelancerFetchStatus = "idle",
  freelancerFetchError = "",
  isSendingProposal = false,
  sendingFreelancerId = null,
  freelancerSearch,
  onFreelancerSearchChange,
  filteredFreelancers,
  freelancerSelectionData,
  bestMatchFreelancerIds,
  _projectRequiredSkills,
  onViewFreelancer,
  onSendProposal,
  _collectFreelancerSkillTokens,
  _freelancerMatchesRequiredSkill,
  generateGradient,
  formatRating,
  onPostToMarketplace,
}) => {
  const [activeIndices, setActiveIndices] = useState({});
  const [activeAiFreelancerId, setActiveAiFreelancerId] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const dialogContentRef = useRef(null);


  useEffect(() => {
    if (open) return;
    setActiveAiFreelancerId(null);
  }, [open]);

  useEffect(() => {
    const isProjectOpen = String(savedProposal?.projectStatus).toUpperCase() === "OPEN";
    const isProposalOpen = String(savedProposal?.status).toUpperCase() === "OPEN";

    if (isProjectOpen || isProposalOpen) {
      setIsLive(true);
    } else {
      setIsLive(false);
    }
  }, [savedProposal?.status, savedProposal?.projectStatus]);

  // Prevent background dialog/panel containers from scrolling when this nested dialog is open
  useEffect(() => {
    if (!open) return;

    const scrollElements = document.querySelectorAll(".overflow-y-auto, [data-slot='dialog-content']");
    const originalStyles = [];

    scrollElements.forEach((el) => {
      // Skip our own dialog content and its children
      if (
        dialogContentRef.current &&
        (el === dialogContentRef.current || dialogContentRef.current.contains(el))
      ) {
        return;
      }

      originalStyles.push({
        el,
        overflow: el.style.overflow,
      });
      el.style.overflow = "hidden";
    });

    return () => {
      originalStyles.forEach(({ el, overflow }) => {
        el.style.overflow = overflow;
      });
    };
  }, [open]);


  const activeAiFreelancer = Array.isArray(filteredFreelancers)
    ? filteredFreelancers.find(
        (freelancer) => String(freelancer?.id || "") === String(activeAiFreelancerId || ""),
      )
    : null;
  const activeAiMatch =
    activeAiFreelancer?.aiMatch && typeof activeAiFreelancer.aiMatch === "object"
      ? activeAiFreelancer.aiMatch
      : null;
  const activeAiDisplayName = activeAiFreelancer?.fullName || activeAiFreelancer?.name || "Freelancer";
  const activeAiSummary = String(activeAiMatch?.summary || "").trim();
  const activeAiHighlights = Array.isArray(activeAiMatch?.highlights)
    ? activeAiMatch.highlights.map((entry) => String(entry || "").trim()).filter(Boolean).slice(0, 4)
    : [];
  const activeAiConcerns = Array.isArray(activeAiMatch?.concerns)
    ? activeAiMatch.concerns.map((entry) => String(entry || "").trim()).filter(Boolean).slice(0, 3)
    : [];
  const activeAiSemanticFitScore = Number.isFinite(Number(activeAiMatch?.semanticFitScore))
    ? Math.max(0, Math.min(100, Math.round(Number(activeAiMatch.semanticFitScore))))
    : null;
  const activeAiShortlistRank = Number.isFinite(Number(activeAiMatch?.shortlistRank))
    ? Math.max(1, Math.round(Number(activeAiMatch.shortlistRank)))
    : null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent 
      ref={dialogContentRef}
      onOpenAutoFocus={(event) => {
        // Prevent autofocus on mobile to avoid keyboard popup
        if (window.innerWidth < 640) {
          event.preventDefault();
        }
      }}
      className="fixed left-1/2 top-1/2 flex h-[82dvh] w-[96vw] max-w-[34rem] -translate-x-1/2 -translate-y-1/2 flex-col overscroll-contain p-3 sm:h-[84dvh] sm:max-w-5xl sm:p-4"
    >
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-lg">
          <Send className="w-5 h-5 text-primary" />
          Choose a Freelancer
        </DialogTitle>
        <DialogDescription className="truncate whitespace-nowrap overflow-hidden">
          Send proposal for:{" "}
          <span className="font-medium text-foreground">
            {savedProposal?.projectTitle}
          </span>
        </DialogDescription>
      </DialogHeader>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden py-2 px-1">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={freelancerSearch}
              onChange={(event) => onFreelancerSearchChange(event.target.value)}
              placeholder="Search name, skills, niche..."
              className="h-9 pl-9 pr-4 text-xs sm:text-sm"
            />
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {isFreelancerAiLoading && filteredFreelancers.length > 0 && (
              <Badge
                variant="outline"
                title="Cata AI analyzing"
                aria-label="Cata AI analyzing"
                className="flex h-9 w-9 items-center justify-center rounded-lg border-primary/20 bg-primary/5 p-0 text-xs font-medium text-primary sm:w-auto sm:px-2.5"
              >
                <Loader2 className="h-3.5 w-3.5 animate-spin sm:mr-1.5 sm:h-3 sm:w-3" />
                <span className="hidden whitespace-nowrap sm:inline">Cata AI analyzing</span>
              </Badge>
            )}
            <Badge className="h-9 px-2.5 border-primary/20 bg-primary/10 text-primary font-medium text-xs rounded-lg flex items-center justify-center whitespace-nowrap">
              {filteredFreelancers.length} available
            </Badge>
            {freelancerSelectionData.invitedCount > 0 && (
              <Badge variant="outline" className="h-9 px-2.5 text-muted-foreground font-medium text-xs rounded-lg flex items-center justify-center whitespace-nowrap">
                Invited {freelancerSelectionData.invitedCount}
              </Badge>
            )}
          </div>
        </div>
        <div className="min-h-0 w-full flex-1 overflow-y-auto overscroll-contain pr-2 pb-4 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
          <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(() => {
              const hasSearchQuery = String(freelancerSearch || "").trim().length > 0;
              if (isLoadingFreelancers) {
                return (
                  <div className="col-span-full space-y-4 py-4">
                    <div className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      Fetching matched freelancers...
                    </div>
                    <div className="flex flex-row gap-3 overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:overflow-x-visible sm:pb-0 sm:snap-none lg:grid-cols-3">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <Card
                          key={`freelancer-loading-${index}`}
                          className="min-h-[25rem] w-[min(23rem,calc(96vw-3.25rem))] shrink-0 snap-start rounded-[20px] border border-border/60 bg-card/90 p-2.5 sm:w-auto sm:shrink sm:snap-align-none"
                        >

                          <Skeleton className="h-28 w-full rounded-xl" />
                          <div className="mt-10 space-y-2">
                            <Skeleton className="h-5 w-2/3" />
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-5/6" />
                          </div>
                          <div className="mt-3 space-y-2">
                            <Skeleton className="h-16 w-full rounded-lg" />
                            <Skeleton className="h-16 w-full rounded-lg" />
                            <Skeleton className="h-10 w-full rounded-lg" />
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              }

              if (freelancerFetchStatus === "error") {
                return (
                  <Card className="col-span-full border-dashed">
                    <CardContent className="p-8 text-center text-muted-foreground">
                      {freelancerFetchError ||
                        "We could not load matched freelancers for this proposal right now."}
                    </CardContent>
                  </Card>
                );
              }

              if (filteredFreelancers.length === 0) {
                if (freelancerSelectionData.totalRanked === 0) {
                  return (
                    <Card className="col-span-full border-dashed">
                      <CardContent className="p-8 text-center text-muted-foreground">
                        We could not find freelancers who match this proposal yet.
                      </CardContent>
                    </Card>
                  );
                }
                if (hasSearchQuery) {
                  return (
                    <Card className="col-span-full border-dashed">
                      <CardContent className="p-8 text-center text-muted-foreground">
                        No freelancers matched your search query.
                      </CardContent>
                    </Card>
                  );
                }
                if (
                  freelancerSelectionData.totalRanked > 0 &&
                  freelancerSelectionData.invitedCount > 0
                ) {
                  return (
                    <Card className="col-span-full border-dashed">
                      <CardContent className="p-8 text-center text-muted-foreground">
                        All matched freelancers are already invited for this proposal.
                      </CardContent>
                    </Card>
                  );
                }
                return (
                  <Card className="col-span-full border-dashed">
                    <CardContent className="p-8 text-center text-muted-foreground">
                      No freelancers available right now.
                    </CardContent>
                  </Card>
                );
              }

              const freelancerGroups = groupFreelancersForDisplay(filteredFreelancers);
              const showGroupCount = freelancerGroups.length > 1;

              return freelancerGroups.map((group) => (
                <div key={group.key} className="col-span-full">
                  <div className="mb-2 flex flex-col gap-0.5 px-1 pb-1 pt-1.5 border-b border-border/40">
                    <div className="flex items-center gap-1.5">
                      {group.key === "multi-service" ? (
                        <Layers3 className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : null}
                      <p className="text-xs font-semibold text-foreground">{group.title}</p>
                      {showGroupCount && (
                        <Badge variant="secondary" className="h-4 px-1.5 text-[9px] font-medium bg-muted text-muted-foreground border-none">
                          {group.freelancers.length}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{group.description}</p>
                  </div>
                  <div
                    onScroll={(e) => {
                      const container = e.currentTarget;
                      const firstCard = container.firstElementChild;
                      const cardWidth = firstCard
                        ? firstCard.getBoundingClientRect().width + 12
                        : 302;
                      const newIndex = Math.round(container.scrollLeft / cardWidth);
                      setActiveIndices((prev) => {
                        if (prev[group.key] === newIndex) return prev;
                        return { ...prev, [group.key]: newIndex };
                      });
                    }}
                    className="flex flex-row gap-3 overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:overflow-x-visible sm:pb-0 sm:snap-none lg:grid-cols-3"
                  >
                    {group.freelancers.map((freelancer) => {
                const displayName =
                  freelancer.fullName || freelancer.name || "Freelancer";
                const displayInitials = getDisplayInitials(displayName);
                const coverImage = resolveFreelancerCoverImage(freelancer);
                const bannerGradient = generateGradient(
                  freelancer.id || freelancer.name,
                );
                const bannerStyle = {
                  backgroundImage: `linear-gradient(140deg, rgba(9,11,16,0.14) 0%, rgba(9,11,16,0.38) 100%), radial-gradient(100% 130% at 0% 0%, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0) 52%), radial-gradient(75% 100% at 100% 0%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 55%), ${bannerGradient}`,
                  backgroundBlendMode: "normal,screen,screen,normal",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                };
                const matchScore = resolveFreelancerMatchPercent(freelancer, null);
                const isBestMatch = bestMatchFreelancerIds.has(freelancer.id);
                const matchedServiceLabel = getMatchedServiceLabel(freelancer);
                const matchedSkillBadges = getMatchedSkillBadges(freelancer);
                const budgetFitLabel = getBudgetFitLabel(freelancer);
                const matchSourceLabel = getMatchSourceLabel(freelancer);
                const showAgencyBadge = isAgencyMatch(freelancer);
                const isVerified = freelancer?.isVerified === true;
                const deliveredProjectCount = getDeliveredProjectCount(freelancer);
                const cardBio = String(
                  freelancer?.cleanBio || freelancer?.bio || freelancer?.about || "",
                ).trim();
                const aiMatch =
                  freelancer?.aiMatch && typeof freelancer.aiMatch === "object"
                    ? freelancer.aiMatch
                    : null;
                const aiSummary = String(aiMatch?.summary || "").trim();
                const aiHighlights = Array.isArray(aiMatch?.highlights)
                  ? aiMatch.highlights
                      .map((entry) => String(entry || "").trim())
                      .filter(Boolean)
                      .slice(0, 4)
                  : [];
                const aiConcerns = Array.isArray(aiMatch?.concerns)
                  ? aiMatch.concerns
                      .map((entry) => String(entry || "").trim())
                      .filter(Boolean)
                      .slice(0, 3)
                  : [];
                const aiSemanticFitScore = Number.isFinite(Number(aiMatch?.semanticFitScore))
                  ? Math.max(0, Math.min(100, Math.round(Number(aiMatch.semanticFitScore))))
                  : null;
                const aiShortlistRank = Number.isFinite(Number(aiMatch?.shortlistRank))
                  ? Math.max(1, Math.round(Number(aiMatch.shortlistRank)))
                  : null;
                const isAiTopPick = aiShortlistRank === 1;
                const isSendingSelectedFreelancer =
                  isSendingProposal &&
                  String(sendingFreelancerId ?? "") === String(freelancer.id ?? "");
                const performanceStats = [
                  {
                    key: "rating",
                    label: "Rating",
                    value: formatRating(freelancer.rating),
                    showStar: true,
                  },
                  {
                    key: "budget-fit",
                    label: "Budget Fit",
                    value: budgetFitLabel,
                  },
                  {
                    key: "projects-delivered",
                    label: "Projects Delivered",
                    value: deliveredProjectCount,
                  },
                ];

                return (
                  <Card
                    key={freelancer.id}
                    className="group relative flex min-h-[22.5rem] w-[min(23rem,calc(96vw-3.25rem))] shrink-0 snap-start flex-col overflow-hidden rounded-[20px] border border-border/70 bg-background/40 p-2.5 shadow-none transition-colors duration-200 hover:border-border hover:bg-background/55 sm:w-auto sm:shrink sm:snap-align-none"
                  >
                    <div
                      className="relative isolate h-24 min-h-24 shrink-0 overflow-visible rounded-xl border border-border/70 shadow-none"
                      style={coverImage ? undefined : bannerStyle}
                    >
                      {coverImage ? (
                        <div className="absolute inset-0 overflow-hidden rounded-xl">
                          <img
                            src={coverImage}
                            alt={`${displayName} cover image`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-linear-to-b from-black/5 via-black/24 to-black/52" />
                          <div className="absolute inset-0 bg-[radial-gradient(120%_96%_at_0%_0%,rgba(255,255,255,0.28),transparent_48%),radial-gradient(100%_90%_at_100%_0%,rgba(255,255,255,0.18),transparent_50%)]" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 overflow-hidden rounded-xl">
                          <div className="absolute inset-0 bg-[radial-gradient(90%_120%_at_100%_0%,rgba(255,255,255,0.2),transparent_55%)]" />
                          <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-black/38 via-black/12 to-transparent" />
                        </div>
                      )}
                      {isBestMatch && (
                        <div className="absolute right-3 top-3 z-20 inline-flex items-center gap-1 rounded-full border border-border/80 bg-background/80 px-2.5 py-0.5 text-[10px] font-semibold text-foreground backdrop-blur-sm">
                          <Star className="h-2.5 w-2.5 fill-current text-muted-foreground" />
                          Best Match
                        </div>
                      )}
                      {isAiTopPick && (
                        <div className="absolute left-3 top-3 z-20 inline-flex items-center gap-1 rounded-full border border-primary/20 bg-background/85 px-2.5 py-0.5 text-[10px] font-semibold text-primary backdrop-blur-sm">
                          <Sparkles className="h-2.5 w-2.5" />
                          Cata AI Top Pick
                        </div>
                      )}
                      <Avatar className="absolute -bottom-6 left-3 z-10 h-16 w-16 border-4 border-card shadow-md">
                        <AvatarImage
                          src={freelancer.avatar}
                          alt={displayName}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold tracking-wide">
                          {displayInitials}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    <div className="mt-6 flex min-h-0 flex-1 flex-col px-0.5">
                      <div className="flex items-start justify-between gap-2 border-b border-border dark:border-white/10 pb-1.5">
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-1">
                            <h3 className="min-w-0 truncate text-base leading-tight font-semibold tracking-tight text-foreground">
                              {displayName}
                            </h3>
                            {showAgencyBadge ? (
                              <Badge
                                variant="outline"
                                className="h-5 shrink-0 border-border/80 bg-transparent px-2 text-[9px] whitespace-nowrap text-foreground"
                              >
                                Agency Match
                              </Badge>
                            ) : null}
                            {matchScore !== null && (
                              <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
                                {matchScore}% Match
                              </span>
                            )}
                          </div>
                          <p
                            className="mt-0.5 pr-1 text-[11px] leading-4 text-muted-foreground line-clamp-1"
                            title={cardBio || "No bio available."}
                          >
                            {cardBio || "No bio available."}
                          </p>
                          <div className="mt-0.5 flex flex-wrap gap-1">
                            {matchedServiceLabel ? (
                              <Badge
                                variant="outline"
                                className="h-5 border-border/80 bg-transparent px-2 text-[9px] whitespace-nowrap text-foreground"
                              >
                                {matchedServiceLabel}
                              </Badge>
                            ) : null}
                            {isVerified ? (
                              <Badge
                                variant="outline"
                                className="h-5 border-border/80 bg-transparent px-2 text-[9px] whitespace-nowrap text-foreground"
                              >
                                Verified
                              </Badge>
                            ) : null}
                            {matchSourceLabel ? (
                              <Badge
                                variant="outline"
                                className="h-5 border-border/80 bg-transparent px-2 text-[9px] whitespace-nowrap text-foreground"
                              >
                                {matchSourceLabel}
                              </Badge>
                            ) : null}
                          </div>
                        </div>

                      </div>

                      <div className="mt-1">
                        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/90">
                          Project Skills Match
                        </p>
                        <div className="flex min-h-5 flex-wrap gap-1">
                          {matchedSkillBadges.length > 0 ? (
                            matchedSkillBadges.map((skill, index) => (
                                <Badge
                                  key={`${freelancer.id}-matched-${index}`}
                                  variant="outline"
                                  className="h-4 border-border/80 bg-transparent px-1 text-[9px] whitespace-nowrap text-foreground"
                                >
                                  {skill}
                                </Badge>
                            ))
                          ) : (
                            <span className="text-[11px] text-muted-foreground">
                              No direct skill match
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-1 flex min-h-0 items-center px-1 py-0.5">
                        <div className="grid w-full grid-cols-3">
                          {performanceStats.map((stat, index) => (
                            <div
                              key={`${freelancer.id}-${stat.key}`}
                              className={`flex min-w-0 flex-col items-center justify-center px-1 py-1 text-center ${
                                index < performanceStats.length - 1
                                  ? "border-r border-border dark:border-white/10"
                                  : ""
                              }`}
                            >
                                <div className="flex items-center gap-1 text-[13px] font-semibold tracking-tight text-foreground">
                                {stat.showStar && (
                                  <Star className="h-3.5 w-3.5 shrink-0 fill-primary text-primary" />
                                )}
                                <span className="truncate">{stat.value}</span>
                              </div>
                                <p className="mt-0.5 max-w-[84px] text-[9px] leading-3 font-medium text-muted-foreground/85">
                                {stat.label}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {aiMatch ? (
                        <div className="mt-2 rounded-[16px] border border-primary/15 bg-primary/[0.04] px-2.5 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/90">
                                <Sparkles className="h-3 w-3 shrink-0" />
                                Cata AI Predicted Fit
                              </p>
                              <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted-foreground sm:line-clamp-none">
                                {aiShortlistRank === 1
                                  ? "Cata AI ranked this freelancer first for your proposal."
                                  : aiShortlistRank
                                    ? `Cata AI ranked this freelancer #${aiShortlistRank} in the shortlist.`
                                    : "Cata AI reviewed why this freelancer matches your brief."}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              className="h-7 shrink-0 rounded-full border-primary/20 bg-background/80 px-3 text-[10px] font-semibold text-primary shadow-none hover:bg-primary/10"
                              onClick={(event) => {
                                event.stopPropagation();
                                setActiveAiFreelancerId(freelancer.id);
                              }}
                            >
                              <Sparkles className="mr-1.5 h-3 w-3" />
                              Cata AI
                            </Button>
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-auto pt-2 shrink-0 grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          className="h-8 rounded-[12px] border border-border bg-background/35 text-xs font-semibold text-foreground shadow-none hover:bg-background"
                          onClick={(event) => {
                            event.stopPropagation();
                            onViewFreelancer(freelancer);
                          }}
                        >
                          View Profile
                        </Button>
                        <Button
                          className="h-8 rounded-[12px] bg-primary text-xs font-semibold text-primary-foreground shadow-none hover:bg-primary/90"
                          onClick={(event) => {
                            event.stopPropagation();
                            onSendProposal(freelancer);
                          }}
                          disabled={isSendingProposal}
                        >
                          {isSendingSelectedFreelancer ? (
                            <>
                              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            "Send Proposal"
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
                    })}
                  </div>
                  {group.freelancers.length > 1 && (
                    <div className="flex items-center justify-center gap-1.5 mt-1 pb-2.5 sm:hidden">
                      {group.freelancers.map((_, idx) => {
                        const isActive = (activeIndices[group.key] || 0) === idx;
                        return (
                          <div
                            key={idx}
                            className={`h-1 rounded-full transition-all duration-300 ${
                              isActive ? "w-3 bg-primary" : "w-1.5 bg-border"
                            }`}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              ));
            })()}
          </div>
        </div>
      </div>
      {activeAiMatch ? (
        <div
          className="absolute inset-0 z-[120] flex items-center justify-center bg-background/30 px-4 py-6 backdrop-blur-[1px]"
          onClick={(event) => {
            event.stopPropagation();
            setActiveAiFreelancerId(null);
          }}
        >
          <div
            className="max-h-[min(28rem,calc(100%-2rem))] w-[min(21rem,calc(100%-1.5rem))] overflow-y-auto rounded-[16px] border border-border/70 bg-background/98 p-3 shadow-[0_28px_70px_-30px_rgba(15,23,42,0.55)] sm:w-[min(24rem,calc(100%-2rem))] sm:p-4"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/90">
                  <Sparkles className="h-3 w-3 shrink-0" />
                  Cata AI Match Reason
                </p>
                <h4 className="mt-1 text-sm font-semibold text-foreground">
                  {activeAiDisplayName}
                </h4>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {activeAiSemanticFitScore !== null ? (
                  <Badge
                    variant="outline"
                    className="h-6 border-primary/20 bg-primary/[0.05] px-2 text-[10px] font-semibold text-primary"
                  >
                    {activeAiSemanticFitScore}% fit
                  </Badge>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Close Cata AI match reason"
                  className="h-6 w-6 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  onClick={(event) => {
                    event.stopPropagation();
                    setActiveAiFreelancerId(null);
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <p className="mt-3 text-xs leading-5 text-foreground">
              {activeAiSummary ||
                "Cata AI found this freelancer relevant based on service fit, proposal context, and matching proof from the shortlist."}
            </p>

            {activeAiHighlights.length > 0 ? (
              <div className="mt-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Why Cata AI likes this match
                </p>
                <div className="mt-2 flex flex-col gap-1.5">
                  {activeAiHighlights.map((highlight, index) => (
                    <p
                      key={`active-ai-highlight-${index}`}
                      className="text-xs leading-5 text-foreground/90"
                    >
                      {`- ${highlight}`}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            {activeAiConcerns.length > 0 ? (
              <div className="mt-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Watch-outs
                </p>
                <div className="mt-2 flex flex-col gap-1.5">
                  {activeAiConcerns.map((concern, index) => (
                    <p
                      key={`active-ai-concern-${index}`}
                      className="text-xs leading-5 text-muted-foreground"
                    >
                      {`- ${concern}`}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="h-6 border-border/70 bg-transparent px-2 text-[10px] font-medium text-foreground"
              >
                {getAiMatchConfidenceLabel(activeAiMatch?.confidence)}
              </Badge>
              {activeAiShortlistRank ? (
                <Badge
                  variant="outline"
                  className="h-6 border-primary/20 bg-primary/[0.05] px-2 text-[10px] font-medium text-primary"
                >
                  {`Cata AI shortlist #${activeAiShortlistRank}`}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      <DialogFooter className="sm:justify-between items-center w-full mt-2 border-t pt-4">
        <div className="flex w-full items-center justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>

        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  );
};

export default memo(FreelancerSelectionDialog);




