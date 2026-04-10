import { memo } from "react";

import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Search from "lucide-react/dist/esm/icons/search";
import Send from "lucide-react/dist/esm/icons/send";
import Star from "lucide-react/dist/esm/icons/star";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";


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

const FreelancerSelectionDialog = ({
  open,
  onOpenChange,
  savedProposal,
  isLoadingFreelancers,
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
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="h-[78vh] w-[94vw] max-w-300 p-3 sm:p-4 flex flex-col">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-lg">
          <Send className="w-5 h-5 text-primary" />
          Choose a Freelancer
        </DialogTitle>
        <DialogDescription>
          Select a freelancer to send your proposal:{" "}
          <span className="font-medium text-foreground">
            {savedProposal?.projectTitle}
          </span>
        </DialogDescription>
      </DialogHeader>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden py-2 px-1">
        <div className="mb-2.5 flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/20 p-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={freelancerSearch}
              onChange={(event) => onFreelancerSearchChange(event.target.value)}
              placeholder="Search by name, skills, niche, or stack"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-primary/20 bg-primary/10 text-primary">
              {filteredFreelancers.length} available
            </Badge>
            {freelancerSelectionData.invitedCount > 0 && (
              <Badge variant="outline" className="text-muted-foreground">
                Invited {freelancerSelectionData.invitedCount}
              </Badge>
            )}
          </div>
        </div>
        <div className="min-h-0 w-full flex-1 overflow-y-auto pr-2 pb-4 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
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
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <Card
                          key={`freelancer-loading-${index}`}
                          className="h-113 rounded-[20px] border border-border/60 bg-card/90 p-2.5"
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

              return filteredFreelancers.map((freelancer) => {
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
                const matchScore = Number.isFinite(Number(freelancer.matchScore))
                  ? Math.round(Number(freelancer.matchScore))
                  : null;
                const isBestMatch = bestMatchFreelancerIds.has(freelancer.id);
                const matchedServiceLabel = getMatchedServiceLabel(freelancer);
                const matchedSkillBadges = getMatchedSkillBadges(freelancer);
                const budgetFitLabel = getBudgetFitLabel(freelancer);
                const matchSourceLabel = getMatchSourceLabel(freelancer);
                const isVerified = freelancer?.isVerified === true;
                const deliveredProjectCount = getDeliveredProjectCount(freelancer);
                const cardBio = String(
                  freelancer?.cleanBio || freelancer?.bio || freelancer?.about || "",
                ).trim();
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
                    className="group relative flex h-113 cursor-pointer flex-col overflow-hidden rounded-[20px] border border-border/65 bg-card/95 p-2.5 shadow-[0_10px_24px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(0,0,0,0.2)]"
                    onClick={() => onViewFreelancer(freelancer)}
                  >
                    <div
                      className="relative isolate h-28 min-h-28 shrink-0 overflow-visible rounded-xl border border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.36),0_16px_34px_rgba(0,0,0,0.34)]"
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
                        <div className="absolute right-3 top-3 z-20 inline-flex items-center gap-1 rounded-full border border-amber-200/70 bg-[linear-gradient(120deg,rgba(17,24,39,0.82),rgba(88,28,135,0.56))] px-2.5 py-0.5 text-[10px] font-semibold text-amber-100 shadow-[0_0_0_1px_rgba(251,191,36,0.34),0_0_22px_rgba(251,191,36,0.38)] backdrop-blur-sm">
                          <Star className="h-2.5 w-2.5 fill-current text-amber-300" />
                          Best Match
                        </div>
                      )}
                      <Avatar className="absolute -bottom-10 left-3 z-10 h-20.5 w-20.5 border-4 border-card shadow-md">
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

                    <div className="mt-10 flex min-h-0 flex-1 flex-col px-0.5">
                      <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2">
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-end gap-1.5">
                            <h3 className="min-w-0 truncate text-base leading-tight font-semibold tracking-tight text-foreground">
                              {displayName}
                            </h3>
                            {matchScore !== null && (
                              <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
                                {matchScore}% Match
                              </span>
                            )}
                          </div>
                          <p
                            className="mt-1 min-h-8 pr-1 text-[11px] leading-4 text-muted-foreground line-clamp-2"
                            title={cardBio || "No bio available."}
                          >
                            {cardBio || "No bio available."}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {matchedServiceLabel ? (
                              <Badge
                                variant="outline"
                                className="h-5 border-primary/30 bg-primary/5 px-2 text-[9px] whitespace-nowrap text-primary"
                              >
                                {matchedServiceLabel}
                              </Badge>
                            ) : null}
                            {isVerified ? (
                              <Badge
                                variant="outline"
                                className="h-5 border-sky-400/25 bg-sky-500/10 px-2 text-[9px] whitespace-nowrap text-sky-300"
                              >
                                Verified
                              </Badge>
                            ) : null}
                            {matchSourceLabel ? (
                              <Badge
                                variant="outline"
                                className="h-5 border-emerald-500/25 bg-emerald-500/10 px-2 text-[9px] whitespace-nowrap text-emerald-300"
                              >
                                {matchSourceLabel}
                              </Badge>
                            ) : null}
                          </div>
                        </div>

                      </div>

                      <div className="mt-2">
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/90">
                          Project Skills Match
                        </p>
                        <div className="flex min-h-5 flex-wrap gap-1.5">
                          {matchedSkillBadges.length > 0 ? (
                            matchedSkillBadges.map((skill, index) => (
                              <Badge
                                key={`${freelancer.id}-matched-${index}`}
                                variant="outline"
                                className="h-4 px-1.5 text-[9px] whitespace-nowrap border-primary/45 bg-transparent text-primary"
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

                      <div className="mt-2 flex min-h-0 flex-1 items-center px-2 py-2">
                        <div className="grid w-full grid-cols-3">
                          {performanceStats.map((stat, index) => (
                            <div
                              key={`${freelancer.id}-${stat.key}`}
                              className={`flex min-w-0 flex-col items-center justify-center px-2 py-3 text-center ${
                                index < performanceStats.length - 1
                                  ? "border-r border-white/10"
                                  : ""
                              }`}
                            >
                              <div className="flex items-center gap-1 text-[15px] font-semibold tracking-tight text-foreground">
                                {stat.showStar && (
                                  <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                                )}
                                <span className="truncate">{stat.value}</span>
                              </div>
                              <p className="mt-1 max-w-[84px] text-[10px] leading-3 font-medium text-muted-foreground/85">
                                {stat.label}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-2 shrink-0 grid grid-cols-2 gap-2.5">
                        <Button
                          variant="outline"
                          className="h-9 rounded-full border-white/15 bg-white/5 text-xs font-semibold text-white/90 hover:bg-white/10"
                          onClick={(event) => {
                            event.stopPropagation();
                            onViewFreelancer(freelancer);
                          }}
                        >
                          View Profile
                        </Button>
                        <Button
                          className="h-9 rounded-full bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
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
              });
            })()}
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default memo(FreelancerSelectionDialog);




