import { memo, useMemo } from "react";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import Globe from "lucide-react/dist/esm/icons/globe";
import Languages from "lucide-react/dist/esm/icons/languages";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Star from "lucide-react/dist/esm/icons/star";
import User from "lucide-react/dist/esm/icons/user";
import Wallet from "lucide-react/dist/esm/icons/wallet";
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
import { getFreelancerAvailabilityMeta } from "@/shared/lib/freelancer-availability";

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

const parseStructuredList = (value) => {
  if (Array.isArray(value)) return value;

  const raw = normalizePlainText(value);
  if (!raw) return [];

  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Fall back to delimited text parsing.
    }
  }

  return raw
    .split(/[\n,]+/)
    .map((entry) => normalizePlainText(entry))
    .filter(Boolean);
};

const resolveListEntryLabel = (value) => {
  if (typeof value === "string" || typeof value === "number") {
    return normalizePlainText(value);
  }

  if (!value || typeof value !== "object") return "";

  return firstNonEmptyText(
    value?.name,
    value?.label,
    value?.title,
    value?.value,
    value?.skill,
    value?.service,
    value?.serviceName,
    value?.serviceKey,
    value?.language,
  );
};

const collectListEntries = (sources = []) => {
  const entries = [];

  sources.forEach((source) => {
    if (Array.isArray(source)) {
      entries.push(...source);
      return;
    }

    entries.push(...parseStructuredList(source));
  });

  return entries;
};

const buildDisplayLabels = (
  sources = [],
  { max = 999, formatter = toDisplayLabel, shouldInclude } = {},
) => {
  const labels = new Map();

  collectListEntries(sources).forEach((entry) => {
    const rawLabel = resolveListEntryLabel(entry);
    const normalizedKey = normalizePlainText(rawLabel).toLowerCase();

    if (!normalizedKey) return;
    if (shouldInclude && !shouldInclude(rawLabel, entry)) return;

    if (!labels.has(normalizedKey)) {
      labels.set(normalizedKey, formatter(rawLabel));
    }
  });

  return Array.from(labels.values()).filter(Boolean).slice(0, max);
};

const buildServiceBadges = (
  sources = [],
  { currentServiceKey = "", currentServiceLabel = "", max = 32 } = {},
) => {
  const services = new Map();

  collectListEntries(sources).forEach((entry) => {
    const rawLabel = resolveListEntryLabel(entry);
    const serviceKey = normalizeServiceIdentifier(rawLabel);
    if (!serviceKey) return;

    if (!services.has(serviceKey)) {
      services.set(serviceKey, {
        key: serviceKey,
        label: toDisplayLabel(
          serviceKey === currentServiceKey && currentServiceLabel
            ? currentServiceLabel
            : rawLabel,
        ),
      });
    }
  });

  return Array.from(services.values())
    .sort(
      (left, right) =>
        Number(right.key === currentServiceKey) -
          Number(left.key === currentServiceKey) ||
        left.label.localeCompare(right.label),
    )
    .slice(0, max);
};

const formatRating = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "N/A";
  return numeric.toFixed(1);
};

const SERVICE_EXPERIENCE_LABELS = {
  less_than_1: "Less than 1 year",
  "1_3": "1-3 years",
  "3_5": "3-5 years",
  "5_10": "5-10 years",
  "5_plus": "5+ years",
  "10_plus": "10+ years",
};

const normalizeServiceIdentifier = (value = "") =>
  normalizePlainText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const formatExperienceValue = (value) => {
  const raw = normalizePlainText(value);
  if (!raw) return "";

  const normalizedKey = raw.toLowerCase();
  if (SERVICE_EXPERIENCE_LABELS[normalizedKey]) {
    return SERVICE_EXPERIENCE_LABELS[normalizedKey];
  }

  const numeric = Number(raw);
  if (Number.isFinite(numeric) && numeric > 0) {
    return `${Math.round(numeric)} yrs`;
  }

  return raw;
};

const resolveServiceSpecificExperience = (freelancer = {}) => {
  const profileDetails = asObject(
    freelancer?.profileDetails || freelancer?.freelancerProfile,
  );
  const serviceDetails =
    profileDetails?.serviceDetails && typeof profileDetails.serviceDetails === "object"
      ? profileDetails.serviceDetails
      : {};
  const freelancerProjects = Array.isArray(freelancer?.freelancerProjects)
    ? freelancer.freelancerProjects
    : [];
  const targetServiceKey = normalizeServiceIdentifier(
    freelancer?.matchedService?.serviceKey ||
      freelancer?.serviceKey ||
      freelancer?.matchedService?.serviceName ||
      freelancer?.serviceName ||
      freelancer?.service,
  );

  if (targetServiceKey) {
    const matchedProject = freelancerProjects.find((project) =>
      normalizeServiceIdentifier(project?.serviceKey || project?.serviceName) ===
      targetServiceKey,
    );
    const projectExperience = formatExperienceValue(
      matchedProject?.yearsOfExperienceInService || matchedProject?.experienceYears,
    );
    if (projectExperience) return projectExperience;

    if (serviceDetails[targetServiceKey]) {
      const detailExperience = formatExperienceValue(
        serviceDetails[targetServiceKey]?.experienceYears ||
          serviceDetails[targetServiceKey]?.yearsOfExperienceInService,
      );
      if (detailExperience) return detailExperience;
    }

    for (const [rawKey, detail] of Object.entries(serviceDetails)) {
      if (normalizeServiceIdentifier(rawKey || detail?.key) !== targetServiceKey) continue;
      const detailExperience = formatExperienceValue(
        detail?.experienceYears || detail?.yearsOfExperienceInService,
      );
      if (detailExperience) return detailExperience;
    }
  }

  return "";
};

const formatExperience = (freelancer) => {
  const normalizedFreelancer = freelancer ?? {};
  const serviceSpecificExperience = resolveServiceSpecificExperience(
    normalizedFreelancer,
  );
  if (serviceSpecificExperience) return serviceSpecificExperience;

  const yearsValue = Number(
    normalizedFreelancer.experienceYears ??
      normalizedFreelancer.experience ??
      NaN,
  );
  if (Number.isFinite(yearsValue) && yearsValue > 0) {
    return `${Math.round(yearsValue)} yrs`;
  }

  const textValue = formatExperienceValue(normalizedFreelancer.experience);
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

const TagListCard = ({
  title,
  icon: Icon,
  items = [],
  emptyLabel,
  highlightKey = "",
}) => (
  <Card className="border-border/60 bg-muted/15 p-4">
    <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
      <Icon className="h-4 w-4 text-primary" />
      {title}
    </h3>

    {items.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => {
          const label = typeof item === "string" ? item : item.label;
          const key =
            typeof item === "string"
              ? normalizePlainText(item).toLowerCase() || `${title}-${index}`
              : item.key || `${title}-${index}`;
          const isHighlighted =
            typeof item === "object" && highlightKey && item.key === highlightKey;

          return (
            <Badge
              key={`${title}-${key}-${index}`}
              variant="outline"
              className={
                isHighlighted
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-border/70 bg-background/35 text-foreground/90"
              }
            >
              {label}
            </Badge>
          );
        })}
      </div>
    ) : (
      <p className="text-sm text-muted-foreground">{emptyLabel}</p>
    )}
  </Card>
);

const extractStartingPrice = (priceRange) => {
  if (!priceRange || typeof priceRange !== 'string') return null;
  
  // Handle "Under INR 5,000" -> "Under INR 5,000"
  if (priceRange.includes('Under')) return priceRange;
  
  // Handle "Over INR 10 Lakhs" -> "Over INR 10 Lakhs" 
  if (priceRange.includes('Over')) return priceRange;
  
  // Handle "INR 5,000 - 10,000" -> "INR 5,000"
  const match = priceRange.match(/^INR\s+[\d,]+/);
  return match ? match[0] : null;
};

const getStartingPrice = (freelancer) => {
  // Try to get price from matched service/project first
  const matchedPrice = freelancer?.matchedService?.averageProjectPriceRange || 
                      freelancer?.matchedFreelancerProject?.averageProjectPriceRange;
  
  if (matchedPrice) {
    return extractStartingPrice(matchedPrice);
  }
  
  // Try to get from service details
  const serviceDetails = freelancer?.profileDetails?.serviceDetails || {};
  const currentServiceKey = normalizeServiceIdentifier(
    freelancer?.matchedService?.serviceKey ||
    freelancer?.serviceKey ||
    freelancer?.matchedService?.serviceName ||
    freelancer?.serviceName ||
    freelancer?.service
  );
  
  if (currentServiceKey && serviceDetails[currentServiceKey]) {
    const servicePrice = serviceDetails[currentServiceKey]?.averageProjectPriceRange;
    if (servicePrice) {
      return extractStartingPrice(servicePrice);
    }
  }
  
  // Try to get from any service detail as fallback
  for (const detail of Object.values(serviceDetails)) {
    if (detail?.averageProjectPriceRange) {
      return extractStartingPrice(detail.averageProjectPriceRange);
    }
  }
  
  return null;
};

const FreelancerProfileDialog = ({ open, onOpenChange, viewingFreelancer }) => {
  const profileDetails = asObject(
    viewingFreelancer?.profileDetails || viewingFreelancer?.freelancerProfile,
  );
  const userDetails = asObject(viewingFreelancer?.user);
  const identityDetails = asObject(profileDetails?.identity);
  const serviceDetails = asObject(profileDetails?.serviceDetails);
  const freelancerProjects = Array.isArray(viewingFreelancer?.freelancerProjects)
    ? viewingFreelancer.freelancerProjects
    : [];

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
  const availability = getFreelancerAvailabilityMeta(viewingFreelancer);
  const experienceLabel = formatExperience({
    ...viewingFreelancer,
    profileDetails,
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
  const currentServiceKey = normalizeServiceIdentifier(
    firstNonEmptyText(
      viewingFreelancer?.matchedService?.serviceKey,
      viewingFreelancer?.serviceKey,
      viewingFreelancer?.matchedService?.serviceName,
      viewingFreelancer?.serviceName,
      viewingFreelancer?.service,
    ),
  );
  const currentServiceLabel = firstNonEmptyText(
    viewingFreelancer?.matchedService?.serviceName,
    viewingFreelancer?.matchedService?.serviceKey,
    viewingFreelancer?.serviceName,
    viewingFreelancer?.serviceKey,
    viewingFreelancer?.service,
  );
  const matchedFreelancerProject = currentServiceKey
    ? freelancerProjects.find(
        (project) =>
          normalizeServiceIdentifier(project?.serviceKey || project?.serviceName) ===
          currentServiceKey,
      )
    : null;
  const matchedServiceDetail = currentServiceKey
    ? Object.entries(serviceDetails).find(
        ([rawKey, detail]) =>
          normalizeServiceIdentifier(rawKey || detail?.key) === currentServiceKey,
      )?.[1]
    : null;

  const services = buildServiceBadges(
    [
      currentServiceLabel || currentServiceKey,
      viewingFreelancer?.services,
      profileDetails?.services,
      freelancerProjects.map(
        (project) => project?.serviceKey || project?.serviceName,
      ),
      Object.keys(serviceDetails),
    ],
    {
      currentServiceKey,
      currentServiceLabel,
      max: 24,
    },
  );

  const skills = buildDisplayLabels(
    [
      viewingFreelancer?.skills,
      profileDetails?.skills,
      matchedServiceDetail?.skillsAndTechnologies,
      matchedFreelancerProject?.serviceSpecializations,
      matchedFreelancerProject?.activeTechnologies,
    ],
    { max: 30 },
  );

  const languages = buildDisplayLabels(
    [
      identityDetails?.languages,
      identityDetails?.otherLanguage,
      viewingFreelancer?.languages,
      profileDetails?.languages,
      freelancerProjects.flatMap((project) =>
        Array.isArray(project?.languages) ? project.languages : [],
      ),
    ],
    {
      max: 20,
      shouldInclude: (rawLabel) =>
        normalizePlainText(rawLabel).toLowerCase() !== "other",
    },
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

  const startingPrice = useMemo(
    () => getStartingPrice(viewingFreelancer),
    [viewingFreelancer],
  );

  const stats = [
    { label: "Experience", value: experienceLabel },
  ];

  if (startingPrice) {
    stats.push({ label: "Starting from", value: startingPrice });
  }

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
                  Profile overview with services, skills, languages, and projects.
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
                      <Badge variant="outline" className={availability.badgeClass}>
                        <span
                          className={`mr-1.5 h-2 w-2 rounded-full ${availability.dotClass}`}
                          aria-hidden="true"
                        />
                        {availability.label}
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
                    </div>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-4 p-6">
                <div className="space-y-4">
                  <Card className="border-border/60 bg-muted/15 p-4">
                    <h3 className="mb-2 flex items-center gap-2 text-base font-semibold text-foreground">
                      <User className="h-4 w-4 text-primary" />
                      About
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {profileBio || "No bio available for this freelancer yet."}
                    </p>
                  </Card>

                  <div className="grid grid-cols-2 gap-2">
                    {stats.map((item) => (
                      <div
                        key={`freelancer-stat-${item.label}`}
                        className="rounded-lg border border-border/60 bg-muted/15 p-3"
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

                  <TagListCard
                    title="Services"
                    icon={Briefcase}
                    items={services}
                    emptyLabel="No services selected yet."
                    highlightKey={currentServiceKey}
                  />

                  <TagListCard
                    title="Skills"
                    icon={Sparkles}
                    items={skills}
                    emptyLabel="No skills added yet."
                  />

                  <TagListCard
                    title="Languages"
                    icon={Languages}
                    items={languages}
                    emptyLabel="No languages listed yet."
                  />
                </div>

                <Card className="border-border/60 bg-muted/15 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                      <Briefcase className="h-4 w-4 text-primary" />
                      Projects
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
                        Projects are not added yet.
                      </p>
                    </div>
                  )}
                </Card>
              </div>
            </ScrollArea>

            <DialogFooter className="shrink-0 border-t border-border/60 px-6 py-4 sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Review services, skills, languages, pricing, and projects before sending a proposal.
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



