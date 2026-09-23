import { memo, useMemo, useState, useEffect } from "react";
import { useAuth } from "@/shared/context/AuthContext";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up";
import Clock from "lucide-react/dist/esm/icons/clock";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import FileText from "lucide-react/dist/esm/icons/file-text";
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

const TIMELINE_LABELS = {
  less_than_1_month: "Less than 1 month",
  "1_3_months": "1–3 months",
  "3_6_months": "3–6 months",
  more_than_6_months: "6+ months",
  "1_2_weeks": "1–2 weeks",
  "2_4_weeks": "2–4 weeks",
  "4_6_weeks": "4–6 weeks",
  "6_8_weeks": "6–8 weeks",
  "8_12_weeks": "8–12 weeks",
};

const formatProjectTimeline = (value) => {
  if (!value) return "";
  const raw = normalizePlainText(value);
  if (!raw) return "";
  const lower = raw.toLowerCase();
  if (TIMELINE_LABELS[lower]) return TIMELINE_LABELS[lower];
  const cleaned = raw.replace(/_/g, " ");
  return cleaned.replace(/\b(\d+)\s+(\d+)\s+weeks?\b/i, "$1–$2 weeks");
};

const ROLE_LABELS = {
  full_execution: "Full Execution",
  lead_developer: "Lead Developer",
  consultant: "Consultant",
  designer: "Designer",
  contributor: "Contributor",
};

const formatProjectRole = (value) => {
  if (!value) return "";
  const raw = normalizePlainText(value);
  if (!raw) return "";
  const lower = raw.toLowerCase();
  if (ROLE_LABELS[lower]) return ROLE_LABELS[lower];
  const cleaned = raw.replace(/_/g, " ");
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

const formatProjectBudget = (value) => {
  if (value === undefined || value === null || value === "") return "";
  const raw = normalizePlainText(value);
  if (!raw) return "";
  const numeric = Number(raw.replace(/[^0-9.]/g, ""));
  if (Number.isFinite(numeric) && numeric > 0) {
    return `₹${Math.round(numeric).toLocaleString("en-IN")}`;
  }
  return raw;
};

const resolvePortfolioProjects = (freelancer = {}) => {
  const profileDetails = asObject(
    freelancer?.profileDetails || freelancer?.freelancerProfile,
  );
  const collectedProjects = [];

  const candidatePortfolios = [
    freelancer?.portfolioProjects,
    freelancer?.freelancerProjects,
    profileDetails?.portfolioProjects,
    profileDetails?.freelancerProjects,
    freelancer?.portfolio,
    profileDetails?.portfolio,
  ];

  for (const portfolioValue of candidatePortfolios) {
    if (Array.isArray(portfolioValue) && portfolioValue.length > 0) {
      collectedProjects.push(...portfolioValue);
    } else if (typeof portfolioValue === "string" && portfolioValue.startsWith("[")) {
      try {
        const parsed = JSON.parse(portfolioValue);
        if (Array.isArray(parsed) && parsed.length > 0) {
          collectedProjects.push(...parsed);
        }
      } catch {
        // ignore invalid json
      }
    }
  }

  // Also collect case studies and projects from serviceDetails
  if (profileDetails?.serviceDetails && typeof profileDetails.serviceDetails === "object") {
    Object.entries(profileDetails.serviceDetails).forEach(([serviceKey, detail]) => {
      if (!detail || typeof detail !== "object" || serviceKey.startsWith("__")) return;
      const serviceName = detail?.title || detail?.name || serviceKey;
      if (Array.isArray(detail.caseStudies)) {
        detail.caseStudies.forEach((cs) => {
          if (cs && typeof cs === "object") {
            collectedProjects.push({ ...cs, serviceKey, serviceName: cs.serviceName || serviceName });
          }
        });
      } else if (detail.caseStudy && typeof detail.caseStudy === "object") {
        collectedProjects.push({ ...detail.caseStudy, serviceKey, serviceName: detail.caseStudy.serviceName || serviceName });
      } else if (Array.isArray(detail.projects)) {
        detail.projects.forEach((proj) => {
          if (proj && typeof proj === "object") {
            collectedProjects.push({ ...proj, serviceKey, serviceName: proj.serviceName || serviceName });
          }
        });
      }
    });
  }

  const seenKeys = new Set();

  return collectedProjects
    .map((project, index) => {
      if (typeof project === "string") {
        const trimmed = normalizePlainText(project);
        const link = normalizeProjectUrl(project);
        return {
          title: trimmed && !link ? trimmed : `Project ${index + 1}`,
          link,
          subtitle: "",
          image: "",
          serviceName: "",
          rawTitle: trimmed,
          timeline: "",
          role: "",
          budget: "",
          techStack: [],
          documentUrl: "",
        };
      }

      const rawTitle = normalizePlainText(
        project?.title ||
          project?.projectTitle ||
          project?.name ||
          project?.projectName ||
          project?.caseStudyTitle ||
          project?.caseStudy?.title ||
          "",
      );
      const link = normalizeProjectUrl(
        project?.link ||
          project?.projectLink ||
          project?.url ||
          project?.projectUrl ||
          project?.website ||
          project?.liveUrl ||
          project?.demoUrl ||
          project?.externalLink ||
          project?.readme ||
          project?.readmeUrl ||
          project?.fileUrl,
      );
      const subtitle = normalizePlainText(
        project?.subtitle ||
          project?.description ||
          project?.summary ||
          project?.overview ||
          project?.goal ||
          project?.caseStudy?.description ||
          project?.category,
      );
      const image = normalizePlainText(
        project?.image ||
          project?.imageUrl ||
          project?.thumbnail ||
          project?.coverImage ||
          project?.previewImage ||
          project?.fileUrl ||
          project?.projectFile,
      );
      const serviceName = normalizePlainText(
        project?.serviceName ||
          project?.serviceTitle ||
          project?.serviceKey ||
          "",
      );
      const rawTimeline = normalizePlainText(project?.timeline || project?.deliveryTime || "");
      const timeline = formatProjectTimeline(rawTimeline);
      const rawRole = normalizePlainText(project?.role || "");
      const role = formatProjectRole(rawRole);
      const rawBudget = project?.budget ?? project?.averageProjectPriceRange ?? null;
      const budget = formatProjectBudget(rawBudget);
      const techStack = Array.isArray(project?.techStack) && project.techStack.length > 0
        ? project.techStack
        : Array.isArray(project?.tags) && project.tags.length > 0
          ? project.tags
          : Array.isArray(project?.activeTechnologies) && project.activeTechnologies.length > 0
            ? project.activeTechnologies
            : Array.isArray(project?.skills) && project.skills.length > 0
              ? project.skills
              : [];
      const documentUrl = normalizeProjectUrl(
        project?.fileUrl || project?.projectFile || project?.readme || project?.readmeUrl,
      );

      const isGenericTitle = !rawTitle || /^project$/i.test(rawTitle);
      const title = !isGenericTitle
        ? rawTitle
        : serviceName
          ? `${serviceName} Project`
          : subtitle
            ? subtitle.length > 50
              ? `${subtitle.slice(0, 47)}...`
              : subtitle
            : `Project ${index + 1}`;

      return {
        title,
        link,
        subtitle,
        image,
        serviceName,
        rawTitle,
        timeline,
        role,
        budget,
        techStack,
        documentUrl,
      };
    })
    .filter((project) => {
      const hasContent = Boolean(project.subtitle || project.link || project.image);
      const hasRealTitle = Boolean(project.rawTitle && !/^project$/i.test(project.rawTitle));
      if (!hasContent && !hasRealTitle) return false;

      const key = project.title.toLowerCase() + "|" + project.link.toLowerCase();
      if (seenKeys.has(key)) return false;
      seenKeys.add(key);
      return true;
    })
    .slice(0, 12);
};

const PortfolioProjectCard = ({ project, index }) => {
  const [failedImage, setFailedImage] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const title = project.title || `Project ${index + 1}`;
  const showImage = Boolean(project.image) && failedImage !== project.image;
  const description = project.subtitle || "";
  const isLongDescription = description.length > 150 || description.includes("\n");

  return (
    <div className="group flex flex-col min-w-0 overflow-hidden rounded-xl border border-border/60 bg-card transition-colors hover:border-primary/30">
      {showImage && (
        <div className="aspect-[2/1] overflow-hidden bg-muted sm:aspect-video shrink-0">
          <img
            src={project.image}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={() => setFailedImage(project.image)}
          />
        </div>
      )}
      <div className="flex flex-col flex-1 space-y-2.5 p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <h4 className="min-w-0 flex-1 break-words text-[13px] font-semibold leading-snug text-foreground [overflow-wrap:anywhere] sm:text-sm">
            {title}
          </h4>
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 -mr-1 -mt-0.5 rounded-md text-primary hover:bg-primary/10 transition-colors shrink-0"
              title="Open project in new tab"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Open project in new tab</span>
            </a>
          )}
        </div>

        {/* Metadata Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          {project.serviceName && (
            <Badge variant="secondary" className="text-[10px] font-medium h-5 px-1.5 bg-muted text-muted-foreground border-none">
              {project.serviceName}
            </Badge>
          )}
          {project.role && (
            <Badge variant="outline" className="text-[10px] font-medium h-5 px-1.5 border-border/70 text-foreground/80">
              {project.role}
            </Badge>
          )}
          {project.timeline && (
            <Badge variant="outline" className="text-[10px] font-medium h-5 px-1.5 border-border/70 text-foreground/80 flex items-center gap-1">
              <Clock className="h-2.5 w-2.5 text-muted-foreground" />
              {project.timeline}
            </Badge>
          )}
          {project.budget && (
            <Badge variant="outline" className="text-[10px] font-semibold h-5 px-1.5 border-primary/20 bg-primary/[0.04] text-primary">
              {project.budget}
            </Badge>
          )}
        </div>

        {/* Project Description with Full Details toggle */}
        {description && (
          <div className="space-y-1.5">
            <p
              className={`break-words text-xs leading-relaxed text-muted-foreground [overflow-wrap:anywhere] whitespace-pre-line ${
                !isExpanded && isLongDescription ? "line-clamp-3" : ""
              }`}
            >
              {description}
            </p>
            {isLongDescription && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsExpanded((prev) => !prev);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded py-0.5 cursor-pointer"
              >
                {isExpanded ? (
                  <>
                    <span>Show less</span>
                    <ChevronUp className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    <span>Read full details</span>
                    <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Tech Stack tags */}
        {Array.isArray(project.techStack) && project.techStack.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 pt-0.5">
            {project.techStack.slice(0, 8).map((tech, idx) => (
              <span
                key={`${tech}-${idx}`}
                className="inline-flex items-center text-[9px] font-medium px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/40"
              >
                {tech}
              </span>
            ))}
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-auto pt-2.5 flex items-center justify-between gap-2 border-t border-border/40">
          {project.link ? (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <span>View project</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground/80">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Verified Project Experience
            </span>
          )}

          {project.documentUrl && (
            <a
              href={project.documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <FileText className="h-3 w-3" />
              <span>Docs</span>
            </a>
          )}
        </div>
      </div>
    </div>
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
      freelancerProfile:
        fetchedData.freelancerProfile || viewingFreelancer?.freelancerProfile,
      profileDetails:
        fetchedData.profileDetails ||
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
    activeFreelancer?.responseTime,
    activeFreelancer?.avgResponseTime,
    profileDetails?.responseTime,
    profileDetails?.avgResponseTime,
  );
  const currentServiceKey = normalizeServiceIdentifier(
    firstNonEmptyText(
      activeFreelancer?.matchedService?.serviceKey,
      activeFreelancer?.serviceKey,
      activeFreelancer?.matchedService?.serviceName,
      activeFreelancer?.serviceName,
      activeFreelancer?.service,
    ),
  );
  const currentServiceLabel = firstNonEmptyText(
    activeFreelancer?.matchedService?.serviceName,
    activeFreelancer?.matchedService?.serviceKey,
    activeFreelancer?.serviceName,
    activeFreelancer?.serviceKey,
    activeFreelancer?.service,
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
      activeFreelancer?.services,
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
      activeFreelancer?.skills,
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
      activeFreelancer?.languages,
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
    () => resolvePortfolioProjects(activeFreelancer),
    [activeFreelancer],
  );

  const primaryPortfolioUrl = useMemo(
    () =>
      normalizeProjectUrl(
        firstNonEmptyText(
          activeFreelancer?.portfolio,
          profileDetails?.portfolio,
          profileDetails?.portfolioUrl,
        ),
      ),
    [activeFreelancer?.portfolio, profileDetails?.portfolio, profileDetails?.portfolioUrl],
  );

  const startingPrice = useMemo(
    () => getStartingPrice(activeFreelancer),
    [activeFreelancer],
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
        {activeFreelancer ? (
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



