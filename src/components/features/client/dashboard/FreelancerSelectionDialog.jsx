import { memo } from "react";
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right";
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

const FreelancerSelectionDialog = ({
  open,
  onOpenChange,
  savedProposal,
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
                      className="relative h-28 min-h-28 shrink-0 overflow-visible rounded-xl border border-white/15"
                      style={{
                        background: generateGradient(freelancer.id || freelancer.name),
                      }}
                    >
                      <div className="absolute inset-0 overflow-hidden rounded-xl">
                        <div className="absolute -right-7 -top-7 h-16 w-16 rounded-full bg-white/15 blur-sm" />
                        <div className="absolute left-3 top-3 h-6 w-6 rounded-full border border-white/35 bg-white/15" />
                        <div className="absolute bottom-3 right-8 h-10 w-10 rotate-12 rounded-[12px] border border-white/35 bg-black/10 backdrop-blur-sm" />
                        <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/20 to-transparent" />
                      </div>
                      {isBestMatch && (
                        <div className="absolute right-3 top-3 z-20 inline-flex items-center gap-1 rounded-full border border-white/30 bg-black/45 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                          <Star className="h-2.5 w-2.5 fill-current text-amber-300" />
                          Best Match
                        </div>
                      )}
                      <Avatar className="absolute -bottom-10 left-3 z-10 h-[82px] w-[82px] border-2 border-card shadow-md">
                        <AvatarImage
                          src={freelancer.avatar}
                          alt={displayName}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-primary/20 text-primary text-base font-bold">
                          {displayName.charAt(0)}
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
                            className="mt-1 pr-1 text-[11px] leading-4 text-muted-foreground line-clamp-2"
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
                                className="h-4 px-1.5 text-[9px] whitespace-nowrap border-primary/45 bg-primary/14 text-primary"
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
                          <div className="inline-flex w-fit items-center gap-1.5 rounded-md border border-border/60 bg-muted/35 px-2 py-1 text-[11px] font-medium text-foreground/85">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            Budget fit {budgetFit}%
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
                                    className="inline-flex h-5 w-full min-w-0 items-center gap-1 rounded-full border border-primary/45 bg-primary/12 px-2 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/20"
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
                          className="h-9 rounded-full bg-white text-xs font-semibold text-black hover:bg-white/90"
                          onClick={(event) => {
                            event.stopPropagation();
                            onSendProposal(freelancer);
                          }}
                        >
                          Send
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
