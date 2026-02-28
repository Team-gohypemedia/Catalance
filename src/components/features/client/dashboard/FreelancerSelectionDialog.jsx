import { memo } from "react";
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right";
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

const normalizeProjectUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^[\w-]+(\.[\w-]+)+/i.test(raw)) return `https://${raw}`;
  return "";
};

const resolvePortfolioProjects = (freelancer = {}) => {
  let projects = [];

  if (
    Array.isArray(freelancer?.portfolioProjects) &&
    freelancer.portfolioProjects.length > 0
  ) {
    projects = freelancer.portfolioProjects;
  } else if (
    typeof freelancer?.portfolio === "string" &&
    freelancer.portfolio.startsWith("[")
  ) {
    try {
      projects = JSON.parse(freelancer.portfolio);
    } catch {
      projects = [];
    }
  } else if (Array.isArray(freelancer?.portfolio)) {
    projects = freelancer.portfolio;
  }

  return projects
    .map((project) => {
      if (typeof project === "string") {
        const title = project.trim();
        const url = normalizeProjectUrl(project);
        if (!title && !url) return null;
        return {
          title: title || url.replace(/^https?:\/\//i, ""),
          url,
        };
      }

      const title = String(
        project?.title || project?.name || project?.projectTitle || "",
      ).trim();
      const url = normalizeProjectUrl(
        project?.link ||
          project?.url ||
          project?.projectUrl ||
          project?.href ||
          project?.website,
      );

      if (!title && !url) return null;
      return {
        title: title || url.replace(/^https?:\/\//i, ""),
        url,
      };
    })
    .filter(Boolean);
};

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

const FreelancerSelectionDialog = ({
  open,
  onOpenChange,
  savedProposal,
  isLoadingFreelancers,
  freelancerSearch,
  onFreelancerSearchChange,
  filteredFreelancers,
  freelancerSelectionData,
  bestMatchFreelancerIds,
  projectRequiredSkills,
  onViewFreelancer,
  onSendProposal,
  collectFreelancerSkillTokens,
  freelancerMatchesRequiredSkill,
  generateGradient,
  formatRating,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="h-[78vh] w-[94vw] max-w-[1200px] p-3 sm:p-4 flex flex-col">
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
            <Badge variant="outline">
              Ranked {freelancerSelectionData.totalRanked}
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
                          className="h-[452px] rounded-[20px] border border-border/60 bg-card/90 p-2.5"
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

              if (filteredFreelancers.length === 0) {
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
                const bannerGradient = generateGradient(
                  freelancer.id || freelancer.name,
                );
                const bannerStyle = {
                  backgroundImage: `radial-gradient(125% 120% at 0% 0%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 45%), radial-gradient(95% 110% at 100% 0%, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0) 50%), conic-gradient(from 220deg at 22% 120%, rgba(255,255,255,0.28) 0deg, rgba(255,255,255,0) 95deg, rgba(255,255,255,0.14) 180deg, rgba(255,255,255,0) 260deg, rgba(255,255,255,0.24) 360deg), linear-gradient(160deg, rgba(255,255,255,0.18), rgba(255,255,255,0.02) 38%, rgba(0,0,0,0.12) 92%), linear-gradient(125deg, rgba(255,255,255,0.12), rgba(255,255,255,0) 42%), ${bannerGradient}`,
                  backgroundBlendMode: "screen,screen,overlay,soft-light,normal,normal",
                };
                const matchScore = Number.isFinite(Number(freelancer.matchScore))
                  ? Math.round(Number(freelancer.matchScore))
                  : null;
                const isBestMatch = bestMatchFreelancerIds.has(freelancer.id);
                const budgetFit = Number.isFinite(
                  Number(freelancer?.budgetCompatibility?.score),
                )
                  ? Math.round(Number(freelancer?.budgetCompatibility?.score) * 100)
                  : null;
                const cardBio = String(
                  freelancer?.cleanBio || freelancer?.bio || freelancer?.about || "",
                ).trim();
                const portfolioProjects = resolvePortfolioProjects(freelancer);
                const freelancerSkillTokens =
                  collectFreelancerSkillTokens(freelancer);
                const requiredSkillsForCard =
                  projectRequiredSkills.length > 0
                    ? projectRequiredSkills.filter((skill) =>
                        freelancerMatchesRequiredSkill(skill, freelancerSkillTokens),
                      )
                    : Array.isArray(freelancer.matchedTechnologies)
                      ? freelancer.matchedTechnologies
                      : [];

                return (
                  <Card
                    key={freelancer.id}
                    className="group relative flex h-[452px] cursor-pointer flex-col overflow-hidden rounded-[20px] border border-border/65 bg-card/95 p-2.5 shadow-[0_10px_24px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(0,0,0,0.2)]"
                    onClick={() => onViewFreelancer(freelancer)}
                  >
                    <div
                      className="relative isolate h-28 min-h-28 shrink-0 overflow-visible rounded-xl border border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.36),0_16px_34px_rgba(0,0,0,0.34)]"
                      style={bannerStyle}
                    >
                      <div className="absolute inset-0 overflow-hidden rounded-xl">
                        <svg
                          className="absolute inset-0 h-full w-full opacity-55"
                          viewBox="0 0 100 36"
                          preserveAspectRatio="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M0 25 C14 13, 26 34, 41 22 C55 12, 68 30, 82 20 C90 15, 96 18, 100 12"
                            fill="none"
                            stroke="rgba(255,255,255,0.3)"
                            strokeWidth="0.6"
                            strokeLinecap="round"
                          />
                          <path
                            d="M0 31 C17 22, 30 37, 46 27 C63 17, 78 35, 100 26"
                            fill="none"
                            stroke="rgba(255,255,255,0.22)"
                            strokeWidth="0.5"
                            strokeLinecap="round"
                          />
                          <path
                            d="M8 6 L36 6"
                            fill="none"
                            stroke="rgba(255,255,255,0.34)"
                            strokeWidth="0.4"
                            strokeLinecap="round"
                          />
                          <path
                            d="M46 8 L74 8"
                            fill="none"
                            stroke="rgba(255,255,255,0.28)"
                            strokeWidth="0.35"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-white/30 blur-2xl transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6" />
                        <div className="absolute -left-16 -bottom-6 h-24 w-44 rotate-[-14deg] rounded-full bg-black/25 blur-xl transition-transform duration-700 group-hover:-translate-y-1" />
                        <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-fuchsia-200/20 blur-2xl mix-blend-screen" />
                        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[conic-gradient(from_90deg,rgba(255,255,255,0.56),rgba(255,255,255,0.04),rgba(255,255,255,0.52))] opacity-35 blur-xl animate-[spin_16s_linear_infinite]" />
                        <div className="absolute -left-20 top-4 h-28 w-28 rounded-full border border-white/15 bg-white/[0.03] blur-[1px]" />
                        <div className="absolute left-[44%] top-[-34px] h-28 w-28 rounded-full border border-white/20 bg-white/[0.06]" />
                        <div className="absolute left-[63%] top-0 h-full w-px bg-gradient-to-b from-white/55 via-white/15 to-transparent opacity-80" />
                        <div className="absolute left-[36%] top-0 h-full w-px bg-gradient-to-b from-white/35 via-white/10 to-transparent opacity-70" />

                        <div className="absolute left-3 top-2 h-9 w-9 rounded-full border border-white/25" />
                        <div className="absolute left-4 top-3 h-7 w-7 rounded-full border border-white/55 bg-white/10 shadow-[0_0_22px_rgba(255,255,255,0.34)]" />
                        <div className="absolute left-[21px] top-[20px] h-1.5 w-1.5 rounded-full bg-white/90 shadow-[0_0_12px_rgba(255,255,255,0.8)]" />

                        <div className="absolute right-8 top-7 h-11 w-11 rotate-12 rounded-[14px] border border-white/40 bg-white/10 backdrop-blur-sm transition-transform duration-700 group-hover:translate-y-[-2px] group-hover:rotate-[18deg]" />
                        <div className="absolute right-20 top-4 h-6 w-6 rotate-[18deg] rounded-[8px] border border-white/35 bg-white/[0.08] backdrop-blur-sm transition-transform duration-700 group-hover:translate-y-[2px] group-hover:rotate-[28deg]" />
                        <div className="absolute right-20 top-4 h-1.5 w-1.5 rounded-full bg-white/90 shadow-[0_0_14px_rgba(255,255,255,0.8)] animate-pulse" />
                        <div className="absolute left-[38%] top-3 h-9 w-9 rotate-[22deg] border border-white/30 bg-white/[0.09] [clip-path:polygon(25%_5%,75%_5%,100%_50%,75%_95%,25%_95%,0_50%)] transition-transform duration-700 group-hover:rotate-[32deg]" />
                        <div className="absolute left-[46%] top-[18px] h-6 w-6 rotate-45 border border-white/30 bg-white/[0.05] transition-transform duration-700 group-hover:-translate-y-0.5" />
                        <div className="absolute left-[52%] top-[10px] h-[2px] w-7 rounded-full bg-gradient-to-r from-transparent via-white/75 to-transparent" />
                        <div className="absolute left-[56%] top-[11px] h-7 w-[2px] rounded-full bg-gradient-to-b from-white/70 via-white/25 to-transparent" />

                        <div className="absolute right-28 bottom-3 h-8 w-8 rotate-[22deg] border border-white/28 bg-white/[0.08] [clip-path:polygon(50%_0,100%_100%,0_100%)] backdrop-blur-sm transition-transform duration-700 group-hover:translate-y-[-2px]" />
                        <div className="absolute right-[34%] bottom-2 h-8 w-8 rotate-[14deg] border border-white/25 bg-white/[0.06] [clip-path:polygon(50%_0,100%_50%,50%_100%,0_50%)] transition-transform duration-700 group-hover:translate-y-[-1px] group-hover:rotate-[24deg]" />
                        <div className="absolute right-[41%] bottom-[18px] h-5 w-5 rounded-full border border-white/30 bg-white/[0.07]" />
                        <div className="absolute left-16 bottom-3 h-[2px] w-24 rounded-full bg-gradient-to-r from-white/75 via-white/25 to-transparent" />
                        <div className="absolute left-16 bottom-5 h-[2px] w-16 rounded-full bg-gradient-to-r from-white/55 via-white/20 to-transparent" />
                        <div className="absolute left-[42%] top-4 h-px w-14 -rotate-12 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                        <div className="absolute left-[34%] top-[58%] h-[2px] w-20 -rotate-3 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                        <div className="absolute left-[35%] top-[62%] h-[2px] w-12 bg-gradient-to-r from-white/45 via-white/18 to-transparent" />
                        <div className="absolute right-5 top-2 h-[2px] w-8 bg-gradient-to-r from-white/0 via-white/65 to-white/0" />
                        <div className="absolute right-2 top-3 h-[2px] w-5 bg-gradient-to-r from-transparent via-white/55 to-transparent" />

                        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(255,255,255,0.52)_1px,transparent_1px)] [background-size:13px_13px] [mask-image:linear-gradient(to_bottom,white_20%,transparent_84%)]" />
                        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.9)_0.7px,transparent_0.7px)] [background-size:20px_20px] [mask-image:linear-gradient(to_right,transparent_0%,white_24%,white_74%,transparent_100%)]" />
                        <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(120deg,rgba(255,255,255,0.22)_0,rgba(255,255,255,0)_26%),linear-gradient(-120deg,rgba(255,255,255,0.16)_0,rgba(255,255,255,0)_30%)]" />
                        <div className="absolute inset-0 bg-[linear-gradient(112deg,transparent_10%,rgba(255,255,255,0.2)_44%,transparent_70%)] opacity-80 mix-blend-screen animate-[pulse_3.8s_ease-in-out_infinite]" />
                        <div className="absolute -left-4 top-1 h-7 w-24 rounded-full border border-white/30 bg-white/[0.07] blur-[0.6px]" />
                        <div className="absolute right-10 top-2 h-9 w-20 rounded-full border border-white/24 bg-white/[0.05] blur-[0.8px]" />
                        <div className="absolute -left-1/4 top-0 h-full w-[52%] -skew-x-12 bg-gradient-to-r from-transparent via-white/18 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:animate-[pulse_1.6s_ease-in-out_infinite]" />
                        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 via-black/16 to-transparent" />
                      </div>
                      {isBestMatch && (
                        <div className="absolute right-3 top-3 z-20 inline-flex items-center gap-1 rounded-full border border-amber-200/70 bg-[linear-gradient(120deg,rgba(17,24,39,0.82),rgba(88,28,135,0.56))] px-2.5 py-0.5 text-[10px] font-semibold text-amber-100 shadow-[0_0_0_1px_rgba(251,191,36,0.34),0_0_22px_rgba(251,191,36,0.38)] backdrop-blur-sm">
                          <Star className="h-2.5 w-2.5 fill-current text-amber-300" />
                          Best Match
                        </div>
                      )}
                      <Avatar className="absolute -bottom-10 left-3 z-10 h-[82px] w-[82px] border-4 border-card shadow-md">
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
                        </div>
                        <div className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-white">
                          <Star className="h-3.5 w-3.5 fill-current text-amber-400" />
                          {formatRating(freelancer.rating)}
                        </div>
                      </div>

                      <div className="mt-2 rounded-lg bg-white/[0.03] p-2">
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/90">
                          Project Skills Match
                        </p>
                        <div className="flex min-h-5 flex-wrap gap-1.5">
                          {requiredSkillsForCard.length > 0 ? (
                            requiredSkillsForCard.slice(0, 3).map((skill, index) => (
                              <Badge
                                key={`${freelancer.id}-required-${index}`}
                                variant="outline"
                                className="h-4 px-1.5 text-[9px] whitespace-nowrap border-primary/45 bg-transparent text-primary"
                              >
                                {skill}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-[11px] text-muted-foreground">
                              No direct required skill match
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 min-h-0 flex-1 overflow-hidden rounded-lg bg-white/[0.02] p-2">
                        {budgetFit !== null && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-foreground/90">
                              <span>Budget fit</span>
                              <span>{budgetFit}%</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/35">
                              <div
                                className="h-full rounded-full bg-primary transition-[width] duration-300"
                                style={{ width: `${Math.max(0, Math.min(100, budgetFit))}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {portfolioProjects.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/90">
                              Highlighted Projects
                            </p>
                            <div className="grid grid-cols-2 gap-1.5">
                              {portfolioProjects
                                .slice(0, 2)
                                .map((project, index) => (
                                  <a
                                    key={`${freelancer.id}-portfolio-${index}`}
                                    href={project.url || undefined}
                                    target={project.url ? "_blank" : undefined}
                                    rel={project.url ? "noopener noreferrer" : undefined}
                                    title={project.title}
                                    onClick={(event) => event.stopPropagation()}
                                    className="inline-flex h-5 w-full min-w-0 items-center gap-1 rounded-full bg-transparent px-2 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/10"
                                  >
                                    <span className="truncate">{project.title}</span>
                                    <ArrowUpRight className="h-3 w-3 shrink-0" />
                                  </a>
                                ))}
                            </div>
                          </div>
                        )}
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
                        >
                          Send Proposal
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
