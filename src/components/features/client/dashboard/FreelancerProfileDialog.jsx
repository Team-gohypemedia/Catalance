import { memo, useMemo } from "react";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import Clock3 from "lucide-react/dist/esm/icons/clock-3";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import Globe from "lucide-react/dist/esm/icons/globe";
import Languages from "lucide-react/dist/esm/icons/languages";
import Layers3 from "lucide-react/dist/esm/icons/layers-3";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Star from "lucide-react/dist/esm/icons/star";
import User from "lucide-react/dist/esm/icons/user";
import Wallet from "lucide-react/dist/esm/icons/wallet";
import Zap from "lucide-react/dist/esm/icons/zap";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const PROJECT_IMAGE_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" fill="none">
    <defs>
      <linearGradient id="grad" x1="0" y1="0" x2="960" y2="540" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#1f2937"/>
        <stop offset="1" stop-color="#111827"/>
      </linearGradient>
    </defs>
    <rect width="960" height="540" fill="url(#grad)"/>
    <circle cx="144" cy="122" r="88" fill="white" fill-opacity="0.06"/>
    <circle cx="844" cy="412" r="120" fill="white" fill-opacity="0.04"/>
    <text x="480" y="286" fill="white" fill-opacity="0.8" font-family="Arial" font-size="34" text-anchor="middle">Catalance Portfolio</text>
  </svg>`,
)}`;

const normalizePlainText = (value) => String(value || "").trim();
const asObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

const firstNonEmptyText = (...values) => {
  for (const value of values) {
    const normalized = normalizePlainText(value);
    if (normalized) return normalized;
  }
  return "";
};

const firstNonEmptyArray = (...values) => {
  for (const value of values) {
    if (Array.isArray(value) && value.length > 0) return value;
  }
  return [];
};

const normalizeProjectUrl = (value) => {
  const raw = normalizePlainText(value);
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^[\w-]+(\.[\w-]+)+/i.test(raw)) return `https://${raw}`;
  return "";
};

const toDisplayLabel = (value) => {
  const raw = normalizePlainText(value);
  if (!raw) return "";

  return raw
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getDisplayInitials = (name = "") => {
  const parts = normalizePlainText(name)
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "FR";
  if (parts.length === 1) {
    const first = parts[0].charAt(0).toUpperCase();
    const second = parts[0].charAt(1).toUpperCase();
    return `${first}${second}`.trim() || first || "FR";
  }

  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
};

const normalizeList = (items = [], max = 999) =>
  Array.from(
    new Set(
      (Array.isArray(items) ? items : [])
        .map((entry) => normalizePlainText(entry))
        .filter(Boolean),
    ),
  ).slice(0, max);

const formatRating = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "N/A";
  return numeric.toFixed(1);
};

const formatExperience = (freelancer) => {
  const normalizedFreelancer = freelancer ?? {};
  const yearsValue = Number(
    normalizedFreelancer.experienceYears ??
      normalizedFreelancer.experience ??
      NaN,
  );
  if (Number.isFinite(yearsValue) && yearsValue > 0) {
    return `${Math.round(yearsValue)} yrs`;
  }

  const textValue = normalizePlainText(normalizedFreelancer.experience);
  return textValue || "N/A";
};

const formatHourlyRate = (value) => {
  if (value === undefined || value === null || value === "") return null;

  const raw = normalizePlainText(value);
  if (!raw) return null;
  if (/\/\s*hr|per\s*hour|inr|usd|eur|gbp/i.test(raw)) return raw;

  const numeric = Number(raw.replace(/[^0-9.]/g, ""));
  if (Number.isFinite(numeric) && numeric > 0) {
    return `INR ${Math.round(numeric).toLocaleString("en-IN")}/hr`;
  }

  return raw;
};

const resolveAvatarSrc = (freelancer = {}) => {
  const profileDetails = asObject(
    freelancer?.profileDetails || freelancer?.freelancerProfile,
  );
  const userDetails = asObject(freelancer?.user);

  return firstNonEmptyText(
    freelancer?.avatar,
    freelancer?.profilePhoto,
    freelancer?.profileImage,
    freelancer?.image,
    profileDetails?.avatar,
    profileDetails?.profilePhoto,
    profileDetails?.profileImage,
    profileDetails?.image,
    userDetails?.avatar,
    userDetails?.profilePhoto,
    userDetails?.profileImage,
    userDetails?.image,
  );
};

const resolvePortfolioProjects = (freelancer = {}) => {
  const profileDetails = asObject(
    freelancer?.profileDetails || freelancer?.freelancerProfile,
  );
  let projects = [];

  const candidatePortfolios = [
    freelancer?.portfolioProjects,
    profileDetails?.portfolioProjects,
    freelancer?.portfolio,
    profileDetails?.portfolio,
  ];

  for (const portfolioValue of candidatePortfolios) {
    if (Array.isArray(portfolioValue) && portfolioValue.length > 0) {
      projects = portfolioValue;
      break;
    }
    if (typeof portfolioValue === "string" && portfolioValue.startsWith("[")) {
      try {
        projects = JSON.parse(portfolioValue);
        if (Array.isArray(projects) && projects.length > 0) break;
      } catch {
        projects = [];
      }
    }
  }

  return projects
    .map((project) => {
      if (typeof project === "string") {
        const title = normalizePlainText(project);
        return {
          title,
          link: normalizeProjectUrl(project),
          subtitle: "",
          image: "",
        };
      }

      return {
        title: normalizePlainText(project?.title || project?.name || "Project"),
        link: normalizeProjectUrl(
          project?.link || project?.url || project?.projectUrl || project?.website,
        ),
        subtitle: normalizePlainText(
          project?.subtitle || project?.description || project?.category,
        ),
        image: normalizePlainText(
          project?.image || project?.imageUrl || project?.thumbnail,
        ),
      };
    })
    .filter((project) => project.title || project.link)
    .slice(0, 12);
};

const FreelancerProfileDialog = ({ open, onOpenChange, viewingFreelancer }) => {
  const profileDetails = asObject(
    viewingFreelancer?.profileDetails || viewingFreelancer?.freelancerProfile,
  );
  const userDetails = asObject(viewingFreelancer?.user);

  const displayName = firstNonEmptyText(
    viewingFreelancer?.fullName,
    viewingFreelancer?.name,
    profileDetails?.fullName,
    profileDetails?.name,
    userDetails?.fullName,
    userDetails?.name,
    "Freelancer",
  );
  const displayInitials = getDisplayInitials(displayName);
  const avatarSrc = resolveAvatarSrc(viewingFreelancer);
  const ratingLabel = formatRating(viewingFreelancer?.rating);
  const matchScore = Number.isFinite(Number(viewingFreelancer?.matchScore))
    ? `${Math.round(Number(viewingFreelancer.matchScore))}%`
    : null;
  const roleValue = firstNonEmptyText(
    viewingFreelancer?.role,
    profileDetails?.role,
    profileDetails?.title,
    "Freelancer",
  );
  const roleLabel = toDisplayLabel(roleValue).toUpperCase();
  const experienceLabel = formatExperience({
    experienceYears:
      viewingFreelancer?.experienceYears ?? profileDetails?.experienceYears,
    experience: viewingFreelancer?.experience ?? profileDetails?.experience,
  });
  const hourlyRateLabel = formatHourlyRate(
    viewingFreelancer?.hourlyRate ??
      profileDetails?.hourlyRate ??
      profileDetails?.rate,
  );
  const locationLabel = firstNonEmptyText(
    viewingFreelancer?.location,
    profileDetails?.location,
    userDetails?.location,
  );
  const profileHeadline = firstNonEmptyText(
    viewingFreelancer?.headline,
    viewingFreelancer?.title,
    viewingFreelancer?.niche,
    profileDetails?.headline,
    profileDetails?.title,
    profileDetails?.niche,
    profileDetails?.role,
  );
  const profileBio = firstNonEmptyText(
    viewingFreelancer?.cleanBio,
    viewingFreelancer?.bio,
    viewingFreelancer?.about,
    profileDetails?.cleanBio,
    profileDetails?.bio,
    profileDetails?.about,
    profileDetails?.description,
    profileDetails?.summary,
    profileDetails?.profileSummary,
  );
  const profileSubline = profileHeadline || profileBio;
  const responseTimeLabel = firstNonEmptyText(
    viewingFreelancer?.responseTime,
    viewingFreelancer?.avgResponseTime,
    profileDetails?.responseTime,
    profileDetails?.avgResponseTime,
  );

  const resolvedSkills = firstNonEmptyArray(
    viewingFreelancer?.skills,
    profileDetails?.skills,
  );
  const resolvedServices = firstNonEmptyArray(
    viewingFreelancer?.services,
    profileDetails?.services,
  );
  const resolvedLanguages = firstNonEmptyArray(
    viewingFreelancer?.languages,
    profileDetails?.languages,
  );

  const skills = useMemo(
    () => normalizeList(resolvedSkills, 100),
    [resolvedSkills],
  );

  const services = useMemo(
    () => normalizeList(resolvedServices, 40).map(toDisplayLabel),
    [resolvedServices],
  );

  const languages = useMemo(
    () => normalizeList(resolvedLanguages, 20).map(toDisplayLabel),
    [resolvedLanguages],
  );

  const portfolioProjects = useMemo(
    () => resolvePortfolioProjects(viewingFreelancer),
    [viewingFreelancer],
  );

  const primaryPortfolioUrl = useMemo(
    () =>
      normalizeProjectUrl(
        firstNonEmptyText(
          viewingFreelancer?.portfolio,
          profileDetails?.portfolio,
          profileDetails?.portfolioUrl,
        ),
      ),
    [viewingFreelancer?.portfolio, profileDetails?.portfolio, profileDetails?.portfolioUrl],
  );

  const visibleSkills = skills.slice(0, 24);
  const extraSkillCount = Math.max(0, skills.length - visibleSkills.length);

  const stats = [
    { label: "Experience", value: experienceLabel },
    { label: "Skills", value: `${skills.length}` },
    { label: "Services", value: `${services.length}` },
    { label: "Projects", value: `${portfolioProjects.length}` },
  ];

  if (responseTimeLabel) {
    stats.push({ label: "Response", value: responseTimeLabel });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] w-[96vw] max-w-6xl flex-col gap-0 overflow-hidden border border-border/70 bg-card p-0">
        {viewingFreelancer ? (
          <>
            <div className="relative shrink-0 overflow-hidden border-b border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_130%_at_0%_0%,rgba(250,204,21,0.14)_0%,rgba(250,204,21,0)_56%),radial-gradient(120%_120%_at_100%_0%,rgba(59,130,246,0.14)_0%,rgba(59,130,246,0)_54%)]" />

              <DialogHeader className="relative px-6 pt-6 pb-5 pr-14">
                <DialogTitle className="sr-only">
                  {displayName} Freelancer Profile
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Profile overview with skills, services, and projects.
                </DialogDescription>

                <div className="flex items-start gap-4">
                  <Avatar className="h-24 w-24 border-4 border-card shadow-[0_14px_30px_rgba(0,0,0,0.28)]">
                    <AvatarImage src={avatarSrc} alt={displayName} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold tracking-wide">
                      {displayInitials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="truncate text-3xl font-bold leading-tight tracking-tight text-foreground">
                        {displayName}
                      </h2>
                      <Badge className="border-primary/20 bg-primary/15 text-primary">
                        {roleLabel}
                      </Badge>
                      {matchScore && (
                        <Badge
                          variant="outline"
                          className="border-emerald-400/35 bg-emerald-500/10 text-emerald-300"
                        >
                          <Sparkles className="mr-1 h-3.5 w-3.5" />
                          {matchScore} Match
                        </Badge>
                      )}
                    </div>

                    {profileSubline && (
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {profileSubline}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="border-amber-400/40 bg-amber-500/10 text-amber-300"
                      >
                        <Star className="mr-1 h-3.5 w-3.5 fill-current" />
                        {ratingLabel}
                      </Badge>

                      {locationLabel && (
                        <Badge
                          variant="outline"
                          className="border-border/70 bg-background/40 text-muted-foreground"
                        >
                          <MapPin className="mr-1 h-3.5 w-3.5" />
                          {locationLabel}
                        </Badge>
                      )}

                      {hourlyRateLabel && (
                        <Badge
                          variant="outline"
                          className="border-border/70 bg-background/40 text-muted-foreground"
                        >
                          <Wallet className="mr-1 h-3.5 w-3.5" />
                          {hourlyRateLabel}
                        </Badge>
                      )}

                      {experienceLabel && (
                        <Badge
                          variant="outline"
                          className="border-border/70 bg-background/40 text-muted-foreground"
                        >
                          <Clock3 className="mr-1 h-3.5 w-3.5" />
                          {experienceLabel}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-4 p-6">
                <div className="grid gap-4 lg:grid-cols-[300px,1fr]">
                  <Card className="h-fit border-border/60 bg-muted/15 p-4">
                    <h3 className="mb-2 flex items-center gap-2 text-base font-semibold text-foreground">
                      <User className="h-4 w-4 text-primary" />
                      About
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {profileBio || "No bio available for this freelancer yet."}
                    </p>

                    <Separator className="my-4 bg-border/50" />

                    <div className="grid grid-cols-2 gap-2">
                      {stats.map((item) => (
                        <div
                          key={`freelancer-stat-${item.label}`}
                          className="rounded-lg border border-border/60 bg-background/40 p-2"
                        >
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                            {item.label}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <div className="space-y-4">
                    <Card className="border-border/60 bg-muted/15 p-4">
                      <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
                        <Zap className="h-4 w-4 text-primary" />
                        Core Skills
                      </h3>

                      {visibleSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {visibleSkills.map((skill) => (
                            <Badge
                              key={`skill-${skill}`}
                              variant="outline"
                              className="border-primary/30 bg-primary/10 text-primary"
                            >
                              {skill}
                            </Badge>
                          ))}
                          {extraSkillCount > 0 && (
                            <Badge
                              variant="outline"
                              className="border-border/70 text-muted-foreground"
                            >
                              +{extraSkillCount} more
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No skills listed yet.
                        </p>
                      )}
                    </Card>

                    <div className="grid gap-4 md:grid-cols-2">
                      <Card className="border-border/60 bg-muted/15 p-4">
                        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
                          <Layers3 className="h-4 w-4 text-primary" />
                          Service Expertise
                        </h3>

                        {services.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {services.slice(0, 16).map((service) => (
                              <Badge
                                key={`service-${service}`}
                                variant="secondary"
                                className="bg-background/70"
                              >
                                {service}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No service expertise listed.
                          </p>
                        )}
                      </Card>

                      <Card className="border-border/60 bg-muted/15 p-4">
                        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
                          <Languages className="h-4 w-4 text-primary" />
                          Languages
                        </h3>

                        {languages.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {languages.map((language) => (
                              <Badge
                                key={`language-${language}`}
                                variant="outline"
                                className="border-border/70"
                              >
                                {language}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No languages listed.
                          </p>
                        )}
                      </Card>
                    </div>
                  </div>
                </div>

                <Card className="border-border/60 bg-muted/15 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                      <Briefcase className="h-4 w-4 text-primary" />
                      Portfolio Projects
                    </h3>
                    <Badge variant="outline" className="border-border/70 text-xs">
                      {portfolioProjects.length} items
                    </Badge>
                  </div>

                  {portfolioProjects.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {portfolioProjects.map((project, index) => {
                        const title = project.title || `Project ${index + 1}`;
                        const imageSrc = project.image || PROJECT_IMAGE_PLACEHOLDER;
                        const projectLink = project.link;
                        const projectSubtitle =
                          project.subtitle ||
                          (projectLink
                            ? projectLink.replace(/^https?:\/\//i, "")
                            : "Project details available in profile");
                        const Wrapper = projectLink ? "a" : "div";
                        const wrapperProps = projectLink
                          ? {
                              href: projectLink,
                              target: "_blank",
                              rel: "noopener noreferrer",
                            }
                          : {};

                        return (
                          <Wrapper
                            key={`portfolio-project-${index}`}
                            className="group block overflow-hidden rounded-xl border border-border/60 bg-card/80 transition-all hover:border-primary/30 hover:shadow-[0_12px_30px_rgba(0,0,0,0.2)]"
                            {...wrapperProps}
                          >
                            <div className="relative aspect-video overflow-hidden bg-muted">
                              <img
                                src={imageSrc}
                                alt={title}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                onError={(event) => {
                                  event.currentTarget.onerror = null;
                                  event.currentTarget.src = PROJECT_IMAGE_PLACEHOLDER;
                                }}
                              />
                              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
                              {projectLink && (
                                <span className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white backdrop-blur-sm">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </span>
                              )}
                            </div>

                            <div className="p-3">
                              <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                                {title}
                              </p>
                              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                {projectSubtitle}
                              </p>
                            </div>
                          </Wrapper>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border/70 bg-background/30 p-10 text-center">
                      <p className="text-sm text-muted-foreground">
                        Portfolio projects are not added yet.
                      </p>
                    </div>
                  )}
                </Card>
              </div>
            </ScrollArea>

            <DialogFooter className="shrink-0 border-t border-border/60 px-6 py-4 sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Review skills and portfolio before sending a proposal.
              </p>
              <div className="flex gap-2">
                {primaryPortfolioUrl && (
                  <Button variant="outline" asChild>
                    <a
                      href={primaryPortfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Globe className="mr-2 h-4 w-4" />
                      Visit Portfolio
                    </a>
                  </Button>
                )}
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </div>
            </DialogFooter>
          </>
        ) : (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Freelancer details are unavailable.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default memo(FreelancerProfileDialog);
