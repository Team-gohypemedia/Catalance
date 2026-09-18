import { memo, useMemo, useState, useEffect } from "react";
import { useAuth } from "@/shared/context/AuthContext";
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
import {
  normalizeServiceIdentity,
  resolveFreelancerMatchPercent,
} from "@/shared/lib/proposal-match";

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
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
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

const normalizeServiceIdentifier = normalizeServiceIdentity;

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

const PortfolioProjectCard = ({ project, index }) => {
  const [failedImage, setFailedImage] = useState("");
  const title = project.title || `Project ${index + 1}`;
  const showImage = Boolean(project.image) && failedImage !== project.image;
  const Wrapper = project.link ? "a" : "div";

  return (
    <Wrapper
      className="group block min-w-0 overflow-hidden rounded-xl border border-border/60 bg-card transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      {...(project.link ? { href: project.link, target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {showImage && (
        <div className="aspect-[2/1] overflow-hidden bg-muted sm:aspect-video">
          <img
            src={project.image}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={() => setFailedImage(project.image)}
          />
        </div>
      )}
      <div className="space-y-2 p-3.5 sm:p-4">
        <div className="flex items-start gap-2">
          <h4 className="min-w-0 flex-1 break-words text-[13px] font-semibold leading-snug text-foreground [overflow-wrap:anywhere] sm:text-sm">
            {title}
          </h4>
          {project.link && <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />}
        </div>
        {project.subtitle && (
          <p className="break-words text-xs leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
            {project.subtitle}
          </p>
        )}
        {project.link && (
          <span className="inline-flex min-h-8 items-center text-xs font-semibold text-primary">
            View project <span className="sr-only">(opens in a new tab)</span>
          </span>
        )}
      </div>
    </Wrapper>
  );
};

const TagListCard = ({
  title,
  icon: Icon,
  items = [],
  emptyLabel,
  highlightKey = "",
}) => (
  <Card className="border-border/60 bg-muted/15 p-3.5 shadow-none sm:p-4">
    <h3 className="mb-3 flex items-center gap-2 text-sm sm:text-base font-semibold text-foreground">
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
  const { authFetch } = useAuth();
  const [fetchedData, setFetchedData] = useState(null);

  const targetId =
    viewingFreelancer?.freelancerId ||
    viewingFreelancer?.id ||
    viewingFreelancer?.freelancer?.id ||
    viewingFreelancer?.userId;

  useEffect(() => {
    if (!open || !targetId || !authFetch) {
      setFetchedData(null);
      return;
    }

    let isMounted = true;

    authFetch(`/users/${targetId}`)
      .then((res) => (res && res.ok ? res.json() : null))
      .then((payload) => {
        if (isMounted && payload) {
          const data = payload?.data || payload;
          setFetchedData(data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch freelancer details in profile dialog:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [open, targetId, authFetch]);

  const activeFreelancer = useMemo(() => {
    if (!fetchedData) return viewingFreelancer;
    return {
      ...viewingFreelancer,
      ...fetchedData,
      freelancerProfile: fetchedData.freelancerProfile || viewingFreelancer?.freelancerProfile,
      profileDetails:
        fetchedData.freelancerProfile?.profileDetails ||
        viewingFreelancer?.profileDetails ||
        viewingFreelancer?.freelancerProfile,
    };
  }, [viewingFreelancer, fetchedData]);

  const profileDetails = asObject(
    activeFreelancer?.profileDetails || activeFreelancer?.freelancerProfile,
  );
  const userDetails = asObject(activeFreelancer?.user);
  const identityDetails = asObject(profileDetails?.identity);
  const serviceDetails = asObject(profileDetails?.serviceDetails);
  const freelancerProjects = Array.isArray(activeFreelancer?.freelancerProjects)
    ? activeFreelancer.freelancerProjects
    : Array.isArray(fetchedData?.freelancerProjects)
      ? fetchedData.freelancerProjects
      : [];

  const displayName = firstNonEmptyText(
    activeFreelancer?.fullName,
    activeFreelancer?.name,
    profileDetails?.fullName,
    profileDetails?.name,
    userDetails?.fullName,
    userDetails?.name,
    "Freelancer",
  );
  const displayInitials = getDisplayInitials(displayName);
  const avatarSrc = resolveAvatarSrc(activeFreelancer);
  const ratingLabel = formatRating(activeFreelancer?.rating ?? profileDetails?.rating);
  const normalizedMatchPercent = resolveFreelancerMatchPercent(
    activeFreelancer,
    null,
  );
  const matchScore = typeof normalizedMatchPercent === "number" && Number.isFinite(normalizedMatchPercent)
    ? `${normalizedMatchPercent}%`
    : null;
  const roleValue = firstNonEmptyText(
    activeFreelancer?.role,
    profileDetails?.role,
    profileDetails?.title,
    "Freelancer",
  );
  const roleLabel = toDisplayLabel(roleValue).toUpperCase();
  const availability = getFreelancerAvailabilityMeta(activeFreelancer);
  const experienceLabel = formatExperience({
    ...activeFreelancer,
    profileDetails,
    experienceYears:
      activeFreelancer?.experienceYears ?? profileDetails?.experienceYears,
    experience: activeFreelancer?.experience ?? profileDetails?.experience,
  });
  const hourlyRateLabel = formatHourlyRate(
    activeFreelancer?.hourlyRate ??
      profileDetails?.hourlyRate ??
      profileDetails?.rate,
  );
  const identityLocation = [
    profileDetails?.identity?.city || profileDetails?.identity?.state || profileDetails?.city || profileDetails?.state || activeFreelancer?.city,
    profileDetails?.identity?.country || profileDetails?.country || activeFreelancer?.country
  ].filter(Boolean).join(", ");
  const locationLabel = firstNonEmptyText(
    activeFreelancer?.location,
    profileDetails?.location,
    userDetails?.location,
    identityLocation,
  );
  const profileHeadline = firstNonEmptyText(
    activeFreelancer?.headline,
    activeFreelancer?.title,
    activeFreelancer?.niche,
    profileDetails?.headline,
    profileDetails?.title,
    profileDetails?.niche,
    profileDetails?.role,
  );
  const profileBio = firstNonEmptyText(
    activeFreelancer?.cleanBio,
    activeFreelancer?.bio,
    activeFreelancer?.about,
    profileDetails?.cleanBio,
    profileDetails?.bio,
    profileDetails?.about,
    profileDetails?.description,
    profileDetails?.summary,
    profileDetails?.profileSummary,
  );
  const profileSubline = /^(individual|freelancer)$/i.test(profileHeadline)
    ? ""
    : profileHeadline;
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
      matchedServiceDetail?.serviceTools,
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
      <DialogContent className="flex h-[90dvh] w-full max-w-6xl rounded-2xl flex-col gap-0 overflow-hidden border border-border/70 bg-card p-0">
        {viewingFreelancer ? (
          <>
            <div className="relative shrink-0 overflow-hidden border-b border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_130%_at_0%_0%,rgba(var(--brand-rgb),0.14)_0%,rgba(var(--brand-rgb),0)_56%),radial-gradient(120%_120%_at_100%_0%,rgba(59,130,246,0.14)_0%,rgba(59,130,246,0)_54%)]" />

              <DialogHeader className="relative p-4 sm:px-6 sm:pt-6 sm:pb-5 text-left">
                <DialogTitle className="sr-only">
                  {displayName} Freelancer Profile
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Profile overview with services, skills, languages, and projects.
                </DialogDescription>

                <div className="grid grid-cols-[3rem_minmax(0,1fr)] items-start gap-x-3 gap-y-2.5 sm:flex sm:gap-4">
                  <Avatar className="h-12 w-12 sm:h-24 sm:w-24 border-2 sm:border-4 border-card shadow-sm shrink-0">
                    <AvatarImage src={avatarSrc} alt={displayName} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg sm:text-2xl font-bold tracking-wide">
                      {displayInitials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="contents sm:block sm:min-w-0 sm:flex-1 sm:space-y-2">
                    <div className="contents sm:flex sm:flex-wrap sm:items-center sm:gap-2.5">
                      <h2 className="min-w-0 self-center break-words pr-7 text-[15px] font-bold leading-snug tracking-tight text-foreground sm:w-full sm:text-3xl">
                        {displayName}
                      </h2>
                      <div className="col-span-2 flex flex-wrap items-center gap-1.5 sm:contents">
                      <Badge className="border-primary/20 bg-primary/15 text-primary text-[10px] sm:text-xs px-1.5 py-0 sm:px-2.5 sm:py-0.5">
                        {roleLabel}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] sm:text-xs px-1.5 py-0 sm:px-2.5 sm:py-0.5 ${availability.badgeClass}`}>
                        <span
                          className={`mr-1.5 h-2 w-2 rounded-full ${availability.dotClass}`}
                          aria-hidden="true"
                        />
                        {availability.label}
                      </Badge>
                      {matchScore && (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 text-[10px] sm:text-xs px-1.5 py-0 sm:px-2.5 sm:py-0.5"
                        >
                          <Sparkles className="mr-1 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          {matchScore} Match
                        </Badge>
                      )}
                      </div>
                    </div>

                    {profileSubline && (
                      <p className="col-span-2 break-words text-xs sm:text-sm text-muted-foreground leading-relaxed text-left">
                        {profileSubline}
                      </p>
                    )}

                    <div className="col-span-2 flex flex-wrap items-center justify-start gap-1.5 sm:gap-2">
                      {ratingLabel && <Badge
                        variant="outline"
                        className="border-primary/20 bg-primary/5 text-primary text-[10px] sm:text-xs px-1.5 py-0 sm:px-2.5 sm:py-0.5"
                      >
                        <Star className="mr-1 h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current" />
                        {ratingLabel}
                      </Badge>}

                      {locationLabel && (
                        <Badge
                          variant="outline"
                          className="border-border/70 bg-background/40 text-muted-foreground text-[10px] sm:text-xs px-1.5 py-0 sm:px-2.5 sm:py-0.5"
                        >
                          <MapPin className="mr-1 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          {locationLabel}
                        </Badge>
                      )}

                      {hourlyRateLabel && (
                        <Badge
                          variant="outline"
                          className="border-border/70 bg-background/40 text-muted-foreground text-[10px] sm:text-xs px-1.5 py-0 sm:px-2.5 sm:py-0.5"
                        >
                          <Wallet className="mr-1 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          {hourlyRateLabel}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-3 p-3 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <Card className="border-border/60 bg-muted/15 p-3.5 shadow-none sm:p-4">
                    <h3 className="mb-2 flex items-center gap-2 text-sm sm:text-base font-semibold text-foreground">
                      <User className="h-4 w-4 text-primary" />
                      About
                    </h3>
                    <p className="whitespace-pre-line break-words text-[13px] leading-relaxed text-muted-foreground [overflow-wrap:anywhere] sm:text-sm">
                      {profileBio || "No bio available for this freelancer yet."}
                    </p>
                  </Card>

                  <div className={`grid grid-cols-1 gap-2 ${stats.length > 1 ? "sm:grid-cols-2" : ""}`}>
                    {stats.map((item) => (
                      <div
                        key={`freelancer-stat-${item.label}`}
                        className="flex min-w-0 items-baseline justify-between gap-4 rounded-xl border border-border/60 bg-muted/15 px-3.5 py-3 sm:block sm:p-3"
                      >
                        <p className="shrink-0 text-[11px] text-muted-foreground sm:uppercase sm:tracking-wide">
                          {item.label}
                        </p>
                        <p className="min-w-0 break-words text-right text-xs font-semibold leading-relaxed text-foreground [overflow-wrap:anywhere] sm:mt-1 sm:text-left sm:text-sm">
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

                <Card className="border-border/60 bg-muted/15 p-3.5 shadow-none sm:p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="flex items-center gap-2 text-sm sm:text-base font-semibold text-foreground">
                      <Briefcase className="h-4 w-4 text-primary" />
                      Projects
                    </h3>
                    <Badge variant="outline" className="border-border/70 text-xs">
                      {portfolioProjects.length} {portfolioProjects.length === 1 ? "project" : "projects"}
                    </Badge>
                  </div>

                  {portfolioProjects.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {portfolioProjects.map((project, index) => (
                        <PortfolioProjectCard
                          key={`${project.title}-${project.link}-${index}`}
                          project={project}
                          index={index}
                        />
                      ))}
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

            {primaryPortfolioUrl && (
            <DialogFooter className="shrink-0 border-t border-border/60 p-3 sm:px-6 sm:py-4 sm:justify-between flex-row items-center justify-end gap-2">
              <p className="hidden sm:block text-xs text-muted-foreground">
                Review services, skills, languages, pricing, and projects before sending a proposal.
              </p>
              <div className="flex w-full gap-2 sm:w-auto">
                  <Button variant="outline" className="min-h-10 flex-1 sm:flex-none" asChild>
                    <a
                      href={primaryPortfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Globe className="mr-2 h-4 w-4" />
                      Visit Portfolio
                    </a>
                  </Button>
              </div>
            </DialogFooter>
            )}
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



