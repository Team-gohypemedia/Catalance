import { useEffect, useMemo, useState } from "react";
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import CalendarClock from "lucide-react/dist/esm/icons/calendar-clock";
import Cpu from "lucide-react/dist/esm/icons/cpu";
import Edit2 from "lucide-react/dist/esm/icons/edit-2";
import IndianRupee from "lucide-react/dist/esm/icons/indian-rupee";
import Layers3 from "lucide-react/dist/esm/icons/layers-3";
import Plus from "lucide-react/dist/esm/icons/plus";
import Wrench from "lucide-react/dist/esm/icons/wrench";
import { Card } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { API_BASE_URL } from "@/shared/lib/api-client";
import { cn } from "@/shared/lib/utils";

const DEFAULT_UI_LABELS = {
  sectionTitle: "Services From Onboarding",
  serviceSingular: "service",
  servicePlural: "services",
  categoriesTitle: "Categories",
  skillsTitle: "Skills",
  caseStudiesTitle: "Service Case Studies",
  emptyValue: "Not selected",
  noCategories: "No categories selected yet.",
  noSkills: "No skills added yet.",
  noCaseStudies: "No case studies added yet.",
  noServices: "No service data from onboarding yet.",
  addFirstService: "Add your first service",
  untitledCaseStudy: "Untitled case study",
  editDetails: "Edit Details",
  addDetails: "Add Details",
  skillsCountLabel: "Skills",
  serviceExperienceLabel: "Service Experience",
  deliveryTimelineLabel: "Delivery Timeline",
  startingPriceLabel: "Starting Price",
};

const DEFAULT_FIELD_PATHS = {
  serviceKey: ["serviceKey", "key", "value"],
  serviceName: ["serviceName", "name", "label"],
  serviceTitle: ["title", "serviceTitle"],
  serviceDescription: ["serviceDescription", "description"],
  serviceId: ["serviceId", "id"],
  serviceCoverImage: ["coverImage"],
  serviceMedia: ["mediaFiles", "media", "serviceMedia"],

  experience: ["experienceYears", "experience"],
  deliveryTimeline: ["deliveryTime", "deliveryTimeline", "deliveryDays"],
  startingPrice: ["averageProjectPrice", "averagePrice", "priceRange"],

  subcategories: ["subcategories"],
  fallbackSubcategories: [
    "pendingCategoryLabels",
    "legacyCategoryLabels",
    "selectedSubcategories",
    "selectedSubCategories",
    "subCategoryLabels",
    "subcategoryLabels",
  ],
  subcategoryId: ["subCategoryId", "subcategoryId", "id"],
  subcategoryKey: ["subCategoryKey", "key"],
  subcategoryLabel: ["label", "subCategoryLabel", "name"],
  subcategorySelectedToolIds: ["selectedToolIds"],
  subcategorySelectedSkills: ["selectedSkills", "skills", "customSkillNames"],

  serviceSkillTags: ["skillsAndTechnologies", "caseStudy.techStack"],
  serviceSkillGroups: ["groups", "groupOther"],

  caseStudies: ["caseStudies"],
  caseStudy: ["caseStudy"],
  caseStudyTitle: ["title", "projectTitle"],
  caseStudyDescription: ["description", "results", "goal"],
  caseStudyProjectLink: ["projectLink", "link", "url", "projectUrl", "website"],
  caseStudyRole: ["role"],
  caseStudyTimeline: ["timeline"],
  caseStudyBudget: ["budget", "budgetRange"],
  caseStudyNiche: ["niche", "industry"],
  caseStudyProjectFile: ["projectFile"],
};

const DEFAULT_MARKETPLACE_ENDPOINTS = {
  services: ({ baseUrl }) => `${baseUrl}/marketplace/filters/services`,
  subcategories: ({ baseUrl, serviceId }) =>
    `${baseUrl}/marketplace/filters/sub-categories?serviceId=${serviceId}`,
  tools: ({ baseUrl, subcategoryId }) =>
    `${baseUrl}/marketplace/filters/tools?subCategoryId=${subcategoryId}`,
};

const mergeConfig = (defaults, overrides) => ({
  ...defaults,
  ...(overrides && typeof overrides === "object" ? overrides : {}),
});

const hasValue = (value) => {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return String(value ?? "").trim().length > 0;
};

const ensureArray = (value) => {
  if (!hasValue(value)) return [];
  return Array.isArray(value) ? value : [value];
};

const getPathValue = (source, path) => {
  if (!source || !path) return undefined;

  return String(path)
    .split(".")
    .reduce((acc, key) => {
      if (!acc || typeof acc !== "object") return undefined;
      return acc[key];
    }, source);
};

const getFirstValue = (source, paths = []) => {
  for (const path of ensureArray(paths)) {
    const value = getPathValue(source, path);
    if (hasValue(value)) return value;
  }

  return undefined;
};

const getArrayValuesFromPaths = (source, paths = []) =>
  ensureArray(paths).flatMap((path) => {
    const value = getPathValue(source, path);

    if (Array.isArray(value)) return value;

    if (typeof value === "string") {
      return value
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return hasValue(value) ? [value] : [];
  });

const normalizeLookupKey = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const normalizeCompactKey = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const formatDisplayLabel = (value = "") =>
  String(value || "")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const normalizeStringArray = (values = []) => {
  const seen = new Set();

  return ensureArray(values).reduce((acc, value) => {
    const label = String(value || "").trim();
    if (!label) return acc;

    const key = label.toLowerCase();
    if (seen.has(key)) return acc;

    seen.add(key);
    acc.push(label);
    return acc;
  }, []);
};

const collectObjectTags = (value = {}) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];

  return Object.values(value).flatMap((entry) => {
    if (Array.isArray(entry)) return entry;

    return String(entry || "")
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  });
};

const getMappedLabel = (value, labelMap = {}) => {
  const raw = String(value || "").trim();
  if (!raw || !labelMap || typeof labelMap !== "object") return "";

  return (
    labelMap[raw] ||
    labelMap[normalizeLookupKey(raw)] ||
    labelMap[raw.toLowerCase()] ||
    ""
  );
};

const normalizeServiceIdentity = (value = "", serviceKeyAliases = {}) => {
  const key = normalizeLookupKey(value);
  return serviceKeyAliases?.[key] || key;
};

const toPositiveInteger = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const resolveEndpoint = (endpoint, params) => {
  if (typeof endpoint === "function") return endpoint(params);
  if (typeof endpoint === "string") return endpoint;
  return "";
};

const getCaseStudyFileName = (file) =>
  String(file?.name || file?.fileName || file?.filename || "").trim();

const normalizeProjectHref = (project, fieldPaths) => {
  const rawValue = String(
    getFirstValue(project, fieldPaths.caseStudyProjectLink) || ""
  ).trim();

  if (!rawValue) return "";
  if (/^https?:\/\//i.test(rawValue)) return rawValue;

  return `https://${rawValue}`;
};

const isVideoMedia = (value = {}) => {
  const kind = String(value?.kind || "").trim().toLowerCase();

  const mimeType = String(
    value?.mimeType || value?.type || value?.contentType || ""
  )
    .trim()
    .toLowerCase();

  return kind === "video" || mimeType.startsWith("video/");
};

const resolveMediaImageUrl = (value, resolveAvatarUrl) => {
  if (!value) return "";
  if (isVideoMedia(value)) return "";

  if (typeof resolveAvatarUrl === "function") {
    return resolveAvatarUrl(value, { allowBlob: true });
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (value && typeof value === "object") {
    return String(
      value.uploadedUrl || value.url || value.src || value.value || ""
    ).trim();
  }

  return "";
};

const resolveServiceImageFromDetail = (detail, resolveAvatarUrl, fieldPaths) => {
  const coverImage = getFirstValue(detail, fieldPaths.serviceCoverImage);
  const directCoverImage = resolveMediaImageUrl(coverImage, resolveAvatarUrl);

  if (directCoverImage) return directCoverImage;

  const mediaEntries = getArrayValuesFromPaths(detail, fieldPaths.serviceMedia);

  for (const entry of mediaEntries) {
    const mediaImageUrl = resolveMediaImageUrl(entry, resolveAvatarUrl);
    if (mediaImageUrl) return mediaImageUrl;
  }

  return "";
};

const hasMeaningfulCaseStudyContent = (caseStudy = {}) => {
  if (!caseStudy || typeof caseStudy !== "object") return false;

  return [
    caseStudy.title,
    caseStudy.description,
    caseStudy.projectLink,
    caseStudy.projectFile,
    caseStudy.role,
    caseStudy.timeline,
    caseStudy.budget,
    caseStudy.niche,
    caseStudy.projectFileName,
  ].some(hasValue);
};

const normalizeCaseStudiesFromDetail = (detail = {}, fieldPaths, labels) => {
  const multiCaseStudies = getFirstValue(detail, fieldPaths.caseStudies);
  const singleCaseStudy = getFirstValue(detail, fieldPaths.caseStudy);

  const rawCaseStudies = Array.isArray(multiCaseStudies)
    ? multiCaseStudies
    : hasValue(singleCaseStudy)
      ? [singleCaseStudy]
      : [];

  return rawCaseStudies
    .map((caseStudy, index) => {
      const projectFile = getFirstValue(caseStudy, fieldPaths.caseStudyProjectFile);

      return {
        id:
          String(caseStudy?.id || caseStudy?.key || "").trim() ||
          `case-study-${index + 1}`,
        title: String(
          getFirstValue(caseStudy, fieldPaths.caseStudyTitle) ||
            labels.untitledCaseStudy
        ).trim(),
        description: String(
          getFirstValue(caseStudy, fieldPaths.caseStudyDescription) || ""
        ).trim(),
        projectLink: normalizeProjectHref(caseStudy, fieldPaths),
        role: String(getFirstValue(caseStudy, fieldPaths.caseStudyRole) || "").trim(),
        timeline: String(
          getFirstValue(caseStudy, fieldPaths.caseStudyTimeline) || ""
        ).trim(),
        budget: String(getFirstValue(caseStudy, fieldPaths.caseStudyBudget) || "").trim(),
        niche: String(getFirstValue(caseStudy, fieldPaths.caseStudyNiche) || "").trim(),
        projectFileName: getCaseStudyFileName(projectFile),
      };
    })
    .filter(hasMeaningfulCaseStudyContent);
};

const resolveSubcategoryId = (entry = {}, fieldPaths) => {
  const directId = toPositiveInteger(getFirstValue(entry, fieldPaths.subcategoryId));
  if (directId) return directId;

  const key = String(getFirstValue(entry, fieldPaths.subcategoryKey) || "").trim();
  return toPositiveInteger(key.match(/^catalog:(\d+)$/i)?.[1]);
};

const resolveSubcategoryLabel = (entry = {}, catalogLabel = "", fieldPaths) => {
  const directLabel = String(
    getFirstValue(entry, fieldPaths.subcategoryLabel) || catalogLabel || ""
  ).trim();

  if (directLabel) return directLabel;

  const key = String(getFirstValue(entry, fieldPaths.subcategoryKey) || "").trim();

  if (!key || /^catalog:\d+$/i.test(key)) return "";

  return formatDisplayLabel(key);
};

const resolveTimelineLabel = ({
  value,
  timelineLabels,
  normalizeValueLabel,
  emptyLabel,
}) => {
  const raw = String(value || "").trim();
  if (!raw) return emptyLabel;

  return (
    getMappedLabel(raw, timelineLabels) ||
    (typeof normalizeValueLabel === "function" ? normalizeValueLabel(raw) : "") ||
    formatDisplayLabel(raw) ||
    raw
  );
};

const resolveStartingPriceLabel = ({ value, normalizeValueLabel, emptyLabel }) => {
  const raw = String(value || "").trim();
  if (!raw) return emptyLabel;

  const plainNumericPrice = /^[₹,\s\d]+$/.test(raw);

  if (plainNumericPrice) {
    const parsed = Number(raw.replace(/[^\d]/g, ""));

    if (Number.isInteger(parsed) && parsed > 0) {
      return `₹${parsed.toLocaleString("en-IN")}`;
    }
  }

  return (
    (typeof normalizeValueLabel === "function" ? normalizeValueLabel(raw) : "") ||
    formatDisplayLabel(raw) ||
    raw
  );
};

const resolveExperienceLabel = ({ value, normalizeValueLabel, emptyLabel }) => {
  const raw = String(value || "").trim();
  if (!raw) return emptyLabel;

  const normalized =
    (typeof normalizeValueLabel === "function" ? normalizeValueLabel(raw) : "") ||
    formatDisplayLabel(raw) ||
    raw;

  const yearRangeMatch = normalized.match(
    /\b\d+\s*(?:[-–—]\s*\d+)?\+?\s*(?:years?|yrs?)\b/i
  );

  if (yearRangeMatch?.[0]) {
    return formatDisplayLabel(yearRangeMatch[0]);
  }

  return normalized;
};

const createDefaultMetricDefinitions = (labels) => [
  {
    key: "experience",
    label: labels.serviceExperienceLabel,
    icon: Briefcase,
    getValue: ({ detail, fieldPaths, helpers }) =>
      helpers.resolveExperienceLabel(getFirstValue(detail, fieldPaths.experience)),
  },
  {
    key: "deliveryTimeline",
    label: labels.deliveryTimelineLabel,
    icon: CalendarClock,
    getValue: ({ detail, fieldPaths, helpers }) =>
      helpers.resolveTimelineLabel(getFirstValue(detail, fieldPaths.deliveryTimeline)),
  },
  {
    key: "startingPrice",
    label: labels.startingPriceLabel,
    icon: IndianRupee,
    getValue: ({ detail, fieldPaths, helpers }) =>
      helpers.resolveStartingPriceLabel(getFirstValue(detail, fieldPaths.startingPrice)),
  },
];

const MetricCard = ({ icon: Icon = Briefcase, label, value }) => (
  <div className="h-[65px] rounded-xl border border-border bg-gradient-to-br from-card to-muted/20 px-2.5 py-2 transition-all duration-200 hover:border-primary/25 hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
    <div className="flex min-w-0 items-center gap-1.5 text-muted-foreground/90">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      </span>
      <p className="truncate whitespace-nowrap text-[9px] font-bold uppercase tracking-wider">
        {label}
      </p>
    </div>

    <p className="mt-1.5 truncate whitespace-nowrap text-[13px] font-bold leading-tight text-foreground sm:text-[14px]">
      {value}
    </p>
  </div>
);

const SectionHeading = ({ icon: Icon, title, action }) => (
  <div className="flex items-center justify-between gap-3">
    <div className="flex min-w-0 items-center gap-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-primary/10 bg-primary/5">
        <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
      </span>

      <h5 className="truncate whitespace-nowrap text-[11px] font-bold uppercase tracking-widest text-foreground">
        {title}
      </h5>
    </div>

    {action}
  </div>
);

const ServiceDetailArticle = ({
  cardData,
  labels,
  openEditServiceProfileModal,
}) => {
  const {
    serviceKey,
    serviceTitle,
    serviceName,
    serviceImage,
    serviceDescription,
    metadataItems,
    selectedSubcategories,
    subcategorySkillGroups,
    fallbackSkillTags,
    caseStudies,
    hasServiceProfileContent,
  } = cardData;

  const [activeSubcategoryKey, setActiveSubcategoryKey] = useState(
    subcategorySkillGroups[0]?.key || ""
  );

  const subcategorySignature = useMemo(
    () => subcategorySkillGroups.map((entry) => entry.key).join("|"),
    [subcategorySkillGroups]
  );

  useEffect(() => {
    if (!subcategorySkillGroups.length) {
      setActiveSubcategoryKey("");
      return;
    }

    const activeStillExists = subcategorySkillGroups.some(
      (entry) => entry.key === activeSubcategoryKey
    );

    if (!activeStillExists) {
      setActiveSubcategoryKey(subcategorySkillGroups[0].key);
    }
  }, [activeSubcategoryKey, subcategorySignature, subcategorySkillGroups]);

  const activeSubcategory =
    subcategorySkillGroups.find((entry) => entry.key === activeSubcategoryKey) ||
    subcategorySkillGroups[0] ||
    null;

  const activeSkillTags = activeSubcategory?.skillTags?.length
    ? activeSubcategory.skillTags
    : fallbackSkillTags;

  const subcategoryCarouselOptions = useMemo(
    () => ({ align: "start", loop: false, duration: 12 }),
    []
  );

  const skillCarouselOptions = useMemo(
    () => ({ align: "start", loop: false, duration: 12 }),
    []
  );

  return (
    <article className="group relative flex min-h-full flex-col overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-card to-card/65 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:z-10 hover:border-primary/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)] dark:hover:shadow-[0_8px_30px_rgba(249,115,22,0.01)] sm:p-5">
      <div className="relative mb-4 h-44 overflow-hidden rounded-xl border border-border bg-card sm:h-52 lg:h-56">
        <button
          type="button"
          onClick={() => openEditServiceProfileModal?.(serviceKey)}
          aria-label={hasServiceProfileContent ? labels.editDetails : labels.addDetails}
          title={hasServiceProfileContent ? labels.editDetails : labels.addDetails}
          className={cn(
            "absolute right-3 top-3 z-20 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border backdrop-blur-md transition-all duration-200 hover:scale-105",
            hasServiceProfileContent
              ? "border-border bg-card/85 text-foreground hover:bg-card hover:border-primary/30"
              : "border-primary/30 bg-primary/15 text-primary hover:bg-primary/25"
          )}
        >
          <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
        </button>

        {serviceImage ? (
          <img
            src={serviceImage}
            alt={serviceTitle}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full items-end bg-card p-4">
            <span className="max-w-[80%] text-sm font-semibold text-muted-foreground">
              {serviceName}
            </span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.01),rgba(0,0,0,0.12))]" />
      </div>

      {serviceName ? (
        <div className="mb-3 inline-flex max-w-max items-center rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-primary">
          <span className="max-w-[220px] truncate whitespace-nowrap">
            {serviceName}
          </span>
        </div>
      ) : null}

      <div className="min-w-0">
        <h4 className="line-clamp-2 text-lg font-bold tracking-tight text-foreground sm:text-xl md:text-2xl">
          {serviceTitle}
        </h4>
      </div>

      {serviceDescription ? (
        <p className="mt-2.5 line-clamp-3 max-w-4xl text-sm leading-6 text-muted-foreground/90">
          {serviceDescription}
        </p>
      ) : null}

      {metadataItems.length > 0 ? (
        <div className="mt-3.5 grid grid-cols-3 gap-1.5 sm:gap-2.5">
          {metadataItems.map((item) => (
            <MetricCard
              key={`${serviceKey}-${item.key || item.label}`}
              icon={item.icon}
              label={item.label}
              value={item.value}
            />
          ))}
        </div>
      ) : null}

      <div className="mt-3.5 border-t border-border pt-3.5">
        {selectedSubcategories.length > 0 ? (
          <Carousel opts={subcategoryCarouselOptions} className="w-full">
            <SectionHeading
              icon={Layers3}
              title={labels.categoriesTitle}
              action={
                selectedSubcategories.length > 1 ? (
                  <div className="flex items-center gap-2">
                    <CarouselPrevious className="relative inset-auto size-8 translate-x-0 translate-y-0 border-primary/35 bg-card text-primary hover:bg-card hover:text-primary disabled:border-border disabled:bg-card disabled:text-muted-foreground" />
                    <CarouselNext className="relative inset-auto size-8 translate-x-0 translate-y-0 border-primary/35 bg-card text-primary hover:bg-card hover:text-primary disabled:border-border disabled:bg-card disabled:text-muted-foreground" />
                  </div>
                ) : null
              }
            />

            <CarouselContent className="mt-2.5 -mx-2.5">
              {selectedSubcategories.map((subcategory) => {
                const isActive = activeSubcategoryKey === subcategory.key;

                return (
                  <CarouselItem
                    key={subcategory.key}
                    className="basis-[56%] px-2.5 sm:basis-[42%] lg:basis-[36%]"
                  >
                    <button
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setActiveSubcategoryKey(subcategory.key)}
                      className={cn(
                        "flex h-[60px] w-full flex-col justify-between rounded-xl border px-3 py-2 text-left transition-all duration-200",
                        isActive
                          ? "border-primary bg-primary/5 text-foreground shadow-[0_0_12px_rgba(249,115,22,0.06)]"
                          : "border-border bg-card text-foreground hover:border-primary/25 hover:bg-muted/10"
                      )}
                    >
                      <span className="line-clamp-2 block text-xs font-bold leading-tight">
                        {subcategory.label}
                      </span>

                      <span className="mt-1.5 truncate whitespace-nowrap text-[9px] font-semibold tracking-wider uppercase text-muted-foreground/80">
                        {subcategory.skillCount} {labels.skillsCountLabel}
                      </span>
                    </button>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
          </Carousel>
        ) : (
          <>
            <SectionHeading icon={Layers3} title={labels.categoriesTitle} />

            <div className="mt-2.5 rounded-xl border border-dashed border-border bg-card px-3 py-3 text-sm text-muted-foreground">
              {labels.noCategories}
            </div>
          </>
        )}
      </div>

      <div className="mt-3.5 border-t border-border pt-3.5">
        {activeSkillTags.length > 0 ? (
          <Carousel opts={skillCarouselOptions} className="w-full">
            <SectionHeading
              icon={Wrench}
              title={
                activeSubcategory
                  ? `${activeSubcategory.label} ${labels.skillsTitle}`
                  : labels.skillsTitle
              }
              action={
                activeSkillTags.length > 3 ? (
                  <div className="flex items-center gap-2">
                    <CarouselPrevious className="relative inset-auto size-8 translate-x-0 translate-y-0 border-primary/35 bg-card text-primary hover:bg-card hover:text-primary disabled:border-border disabled:bg-card disabled:text-muted-foreground" />
                    <CarouselNext className="relative inset-auto size-8 translate-x-0 translate-y-0 border-primary/35 bg-card text-primary hover:bg-card hover:text-primary disabled:border-border disabled:bg-card disabled:text-muted-foreground" />
                  </div>
                ) : null
              }
            />

            <CarouselContent className="mt-2.5 -mx-2.5">
              {activeSkillTags.map((tag) => (
                <CarouselItem
                  key={`${serviceKey}-skill-${tag}`}
                  className="basis-auto px-2.5"
                >
                  <span className="inline-flex h-7 max-w-[180px] items-center rounded-lg border border-border bg-gradient-to-br from-card to-muted/20 px-2.5 text-[11px] font-semibold text-foreground hover:bg-primary/5 hover:border-primary/20 hover:scale-[1.02] transition-all duration-150 cursor-default">
                    <span className="truncate whitespace-nowrap">{tag}</span>
                  </span>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        ) : (
          <>
            <SectionHeading
              icon={Wrench}
              title={
                activeSubcategory
                  ? `${activeSubcategory.label} ${labels.skillsTitle}`
                  : labels.skillsTitle
              }
            />

            <div className="mt-2.5 rounded-xl border border-dashed border-border bg-card px-3 py-3 text-sm text-muted-foreground">
              {labels.noSkills}
            </div>
          </>
        )}
      </div>

      <div className="mt-3.5 border-t border-border pt-3.5">
        <SectionHeading
          icon={Briefcase}
          title={`${labels.caseStudiesTitle} (${caseStudies.length})`}
        />

        {caseStudies.length > 0 ? (
          <div className="mt-3.5 flex max-h-32 flex-wrap gap-2.5 overflow-y-auto subtle-scrollbar pr-1 pb-2.5">
            {caseStudies.map((caseStudy) =>
              caseStudy.projectLink ? (
                <a
                  key={`${serviceKey}-case-study-${caseStudy.id}`}
                  href={caseStudy.projectLink}
                  target="_blank"
                  rel="noreferrer"
                  className="group/item inline-flex max-w-full items-center gap-1.5 rounded-lg border border-border/80 bg-gradient-to-br from-card to-muted/20 px-3 py-1.5 text-xs font-bold text-foreground hover:bg-primary/5 hover:border-primary/25 hover:text-primary transition-all duration-200"
                  aria-label={caseStudy.title}
                >
                  <span className="truncate">{caseStudy.title}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover/item:text-primary group-hover/item:translate-x-0.5 group-hover/item:-translate-y-0.5 transition-all duration-200" aria-hidden="true" />
                </a>
              ) : (
                <span
                  key={`${serviceKey}-case-study-${caseStudy.id}`}
                  className="inline-flex max-w-full items-center rounded-lg border border-border/40 bg-muted/10 px-3 py-1.5 text-xs font-bold text-muted-foreground"
                >
                  <span className="truncate">{caseStudy.title}</span>
                </span>
              )
            )}
          </div>
        ) : (
          <p className="mt-2.5 text-sm text-muted-foreground">
            {labels.noCaseStudies}
          </p>
        )}
      </div>
    </article>
  );
};

const ServicesFromOnboardingCard = ({
  onboardingServiceEntries,
  resolveAvatarUrl,
  getServiceLabel,
  collectServiceSpecializations,
  toUniqueLabels,
  normalizeValueLabel,
  openEditServiceProfileModal,
  openAddServiceModal,

  uiLabels,
  fieldPaths,
  serviceKeyAliases,
  timelineLabels,
  metricDefinitions,
  marketplaceEndpoints,

  resolveServiceName,
  resolveServiceTitle,
  resolveServiceDescription,
  resolveServiceImage,
  resolveServiceSubcategories,
  resolveServiceSkills,
  resolveCaseStudies,
  resolveMetrics,
}) => {
  const labels = useMemo(
    () => mergeConfig(DEFAULT_UI_LABELS, uiLabels),
    [uiLabels]
  );

  const paths = useMemo(
    () => mergeConfig(DEFAULT_FIELD_PATHS, fieldPaths),
    [fieldPaths]
  );

  const endpoints = useMemo(
    () => mergeConfig(DEFAULT_MARKETPLACE_ENDPOINTS, marketplaceEndpoints),
    [marketplaceEndpoints]
  );

  const metrics = useMemo(
    () =>
      Array.isArray(metricDefinitions) && metricDefinitions.length > 0
        ? metricDefinitions
        : createDefaultMetricDefinitions(labels),
    [labels, metricDefinitions]
  );

  const [marketplaceServices, setMarketplaceServices] = useState([]);
  const [subcategoryOptionsByServiceKey, setSubcategoryOptionsByServiceKey] =
    useState({});
  const [toolOptionsBySubcategoryId, setToolOptionsBySubcategoryId] = useState({});

  const helpers = useMemo(
    () => ({
      labels,
      fieldPaths: paths,
      getFirstValue,
      getArrayValuesFromPaths,
      formatDisplayLabel,
      normalizeLookupKey,
      normalizeCompactKey,
      resolveTimelineLabel: (value) =>
        resolveTimelineLabel({
          value,
          timelineLabels,
          normalizeValueLabel,
          emptyLabel: labels.emptyValue,
        }),
      resolveStartingPriceLabel: (value) =>
        resolveStartingPriceLabel({
          value,
          normalizeValueLabel,
          emptyLabel: labels.emptyValue,
        }),
      resolveExperienceLabel: (value) =>
        resolveExperienceLabel({
          value,
          normalizeValueLabel,
          emptyLabel: labels.emptyValue,
        }),
    }),
    [labels, normalizeValueLabel, paths, timelineLabels]
  );

  const marketplaceServiceByKey = useMemo(() => {
    const serviceMap = new Map();

    marketplaceServices.forEach((service) => {
      const values = [
        getFirstValue(service, paths.serviceKey),
        getFirstValue(service, paths.serviceName),
        service?.key,
        service?.value,
        service?.name,
        service?.label,
      ];

      values.forEach((value) => {
        const key = normalizeServiceIdentity(value, serviceKeyAliases);
        if (key && !serviceMap.has(key)) {
          serviceMap.set(key, service);
        }
      });
    });

    return serviceMap;
  }, [marketplaceServices, paths, serviceKeyAliases]);

  useEffect(() => {
    const endpoint = resolveEndpoint(endpoints.services, {
      baseUrl: API_BASE_URL,
    });

    if (!endpoint) return undefined;

    let cancelled = false;

    const fetchMarketplaceServices = async () => {
      try {
        const response = await fetch(endpoint);
        if (!response.ok) return;

        const payload = await response.json();

        if (!cancelled) {
          setMarketplaceServices(Array.isArray(payload?.data) ? payload.data : []);
        }
      } catch {
        if (!cancelled) setMarketplaceServices([]);
      }
    };

    void fetchMarketplaceServices();

    return () => {
      cancelled = true;
    };
  }, [endpoints]);

  useEffect(() => {
    const entries = Array.isArray(onboardingServiceEntries)
      ? onboardingServiceEntries
      : [];

    if (!entries.length) return undefined;

    const requestedServices = entries
      .map((entry, index) => {
        const detail = entry?.detail && typeof entry.detail === "object" ? entry.detail : {};
        const entryServiceKey =
          entry?.serviceKey ||
          getFirstValue(entry, paths.serviceKey) ||
          getFirstValue(detail, paths.serviceKey) ||
          `service-${index + 1}`;

        const normalizedServiceKey = normalizeServiceIdentity(
          entryServiceKey,
          serviceKeyAliases
        );

        const service =
          marketplaceServiceByKey.get(normalizedServiceKey) ||
          marketplaceServiceByKey.get(
            normalizeServiceIdentity(getFirstValue(detail, paths.serviceKey), serviceKeyAliases)
          );

        const serviceId = toPositiveInteger(
          getFirstValue(detail, paths.serviceId) ||
            getFirstValue(service, paths.serviceId) ||
            service?.id
        );

        return {
          serviceKey: entryServiceKey,
          normalizedServiceKey,
          serviceId,
        };
      })
      .filter((entry) => entry.serviceKey && entry.serviceId);

    if (!requestedServices.length) return undefined;

    let cancelled = false;

    const fetchSubcategories = async () => {
      try {
        const fetchedEntries = await Promise.all(
          requestedServices.map(async ({ serviceKey, normalizedServiceKey, serviceId }) => {
            const endpoint = resolveEndpoint(endpoints.subcategories, {
              baseUrl: API_BASE_URL,
              serviceId,
            });

            if (!endpoint) return [serviceKey, normalizedServiceKey, []];

            const response = await fetch(endpoint);
            if (!response.ok) return [serviceKey, normalizedServiceKey, []];

            const payload = await response.json();

            const options = (Array.isArray(payload?.data) ? payload.data : [])
              .map((item) => ({
                id: toPositiveInteger(item?.id),
                label: String(item?.name || item?.label || "").trim(),
              }))
              .filter((item) => item.id && item.label);

            return [serviceKey, normalizedServiceKey, options];
          })
        );

        if (!cancelled) {
          setSubcategoryOptionsByServiceKey(
            fetchedEntries.reduce((acc, [serviceKey, normalizedServiceKey, options]) => {
              acc[serviceKey] = options;
              acc[normalizedServiceKey] = options;
              return acc;
            }, {})
          );
        }
      } catch {
        if (!cancelled) setSubcategoryOptionsByServiceKey({});
      }
    };

    void fetchSubcategories();

    return () => {
      cancelled = true;
    };
  }, [
    endpoints,
    marketplaceServiceByKey,
    onboardingServiceEntries,
    paths,
    serviceKeyAliases,
  ]);

  useEffect(() => {
    const entries = Array.isArray(onboardingServiceEntries)
      ? onboardingServiceEntries
      : [];

    const subcategoryIds = Array.from(
      new Set(
        entries
          .flatMap(({ detail }) => {
            const serviceDetail = detail && typeof detail === "object" ? detail : {};
            const subcategories =
              typeof resolveServiceSubcategories === "function"
                ? resolveServiceSubcategories(serviceDetail, helpers)
                : getFirstValue(serviceDetail, paths.subcategories);

            return ensureArray(subcategories);
          })
          .map((subcategory) => resolveSubcategoryId(subcategory, paths))
          .filter(Boolean)
      )
    );

    if (!subcategoryIds.length) return undefined;

    let cancelled = false;

    const fetchTools = async () => {
      try {
        const fetchedEntries = await Promise.all(
          subcategoryIds.map(async (subcategoryId) => {
            const endpoint = resolveEndpoint(endpoints.tools, {
              baseUrl: API_BASE_URL,
              subcategoryId,
            });

            if (!endpoint) return [String(subcategoryId), []];

            const response = await fetch(endpoint);
            if (!response.ok) return [String(subcategoryId), []];

            const payload = await response.json();

            const options = (Array.isArray(payload?.data) ? payload.data : [])
              .map((item) => ({
                id: toPositiveInteger(item?.id),
                label: String(item?.name || item?.label || "").trim(),
              }))
              .filter((item) => item.id && item.label);

            return [String(subcategoryId), options];
          })
        );

        if (!cancelled) {
          setToolOptionsBySubcategoryId(Object.fromEntries(fetchedEntries));
        }
      } catch {
        if (!cancelled) setToolOptionsBySubcategoryId({});
      }
    };

    void fetchTools();

    return () => {
      cancelled = true;
    };
  }, [
    endpoints,
    helpers,
    onboardingServiceEntries,
    paths,
    resolveServiceSubcategories,
  ]);

  const processedServices = useMemo(() => {
    const normalizeTags = (values = []) =>
      typeof toUniqueLabels === "function"
        ? toUniqueLabels(values)
        : normalizeStringArray(values);

    return (Array.isArray(onboardingServiceEntries) ? onboardingServiceEntries : []).map(
      (entry, index) => {
        const serviceDetail = entry?.detail && typeof entry.detail === "object"
          ? entry.detail
          : {};

        const serviceKey =
          entry?.serviceKey ||
          getFirstValue(entry, paths.serviceKey) ||
          getFirstValue(serviceDetail, paths.serviceKey) ||
          `service-${index + 1}`;

        const serviceName = String(
          (typeof resolveServiceName === "function"
            ? resolveServiceName(serviceDetail, entry, helpers)
            : "") ||
            (typeof getServiceLabel === "function"
              ? getServiceLabel(serviceKey, serviceDetail, entry)
              : "") ||
            getFirstValue(serviceDetail, paths.serviceName) ||
            formatDisplayLabel(serviceKey)
        ).trim();

        const serviceTitle = String(
          (typeof resolveServiceTitle === "function"
            ? resolveServiceTitle(serviceDetail, entry, helpers)
            : "") ||
            getFirstValue(serviceDetail, paths.serviceTitle) ||
            serviceName
        ).trim();

        const serviceDescription = String(
          (typeof resolveServiceDescription === "function"
            ? resolveServiceDescription(serviceDetail, entry, helpers)
            : "") ||
            getFirstValue(serviceDetail, paths.serviceDescription) ||
            ""
        ).trim();

        const serviceImage =
          (typeof resolveServiceImage === "function"
            ? resolveServiceImage(serviceDetail, resolveAvatarUrl, entry, helpers)
            : "") ||
          resolveServiceImageFromDetail(serviceDetail, resolveAvatarUrl, paths);

        const subcategories =
          typeof resolveServiceSubcategories === "function"
            ? resolveServiceSubcategories(serviceDetail, helpers, entry)
            : getFirstValue(serviceDetail, paths.subcategories);

        const normalizedServiceKey = normalizeServiceIdentity(
          serviceKey,
          serviceKeyAliases
        );

        const subcategoryOptions =
          subcategoryOptionsByServiceKey?.[serviceKey] ||
          subcategoryOptionsByServiceKey?.[normalizedServiceKey] ||
          [];

        const subcategoryLabelById = new Map(
          subcategoryOptions.map((option) => [option.id, option.label])
        );

        const serviceSkillTags =
          typeof resolveServiceSkills === "function"
            ? normalizeTags(resolveServiceSkills(serviceDetail, entry, helpers))
            : normalizeTags([
                ...getArrayValuesFromPaths(serviceDetail, paths.serviceSkillTags),
                ...ensureArray(paths.serviceSkillGroups).flatMap((path) =>
                  collectObjectTags(getPathValue(serviceDetail, path))
                ),
                ...(typeof collectServiceSpecializations === "function"
                  ? collectServiceSpecializations(serviceDetail, entry)
                  : []),
              ]);

        const selectedSubcategoryItems = ensureArray(subcategories)
          .map((subcategory, subcategoryIndex) => {
            const subcategoryId = resolveSubcategoryId(subcategory, paths);

            const label = resolveSubcategoryLabel(
              subcategory,
              subcategoryLabelById.get(subcategoryId),
              paths
            );

            if (!label) return null;

            const key = `${serviceKey}-${
              subcategoryId || normalizeCompactKey(label) || subcategoryIndex
            }`;

            const toolLabelById = new Map(
              (toolOptionsBySubcategoryId[String(subcategoryId)] || []).map((tool) => [
                tool.id,
                tool.label,
              ])
            );

            const selectedToolTags = normalizeTags(
              getArrayValuesFromPaths(subcategory, paths.subcategorySelectedToolIds)
                .map((toolId) => toolLabelById.get(toPositiveInteger(toolId)))
                .filter(Boolean)
            );

            const savedSkillTags = normalizeTags([
              ...selectedToolTags,
              ...getArrayValuesFromPaths(subcategory, paths.subcategorySelectedSkills),
            ]);

            const skillTags = savedSkillTags.length ? savedSkillTags : serviceSkillTags;

            return {
              key,
              label,
              subcategoryId,
              skillTags,
              skillCount: skillTags.length,
            };
          })
          .filter(Boolean);

        const fallbackSubcategoryItems = selectedSubcategoryItems.length
          ? []
          : normalizeTags(getArrayValuesFromPaths(serviceDetail, paths.fallbackSubcategories))
              .map((label, fallbackIndex) => ({
                key: `${serviceKey}-fallback-${
                  normalizeCompactKey(label) || fallbackIndex
                }`,
                label,
                subcategoryId: null,
                skillTags: serviceSkillTags,
                skillCount: serviceSkillTags.length,
              }));

        const subcategorySkillGroups = [
          ...selectedSubcategoryItems,
          ...fallbackSubcategoryItems,
        ];

        const selectedSubcategories = subcategorySkillGroups.map((subcategory) => ({
          key: subcategory.key,
          label: subcategory.label,
          skillCount: subcategory.skillCount,
        }));

        const caseStudies =
          typeof resolveCaseStudies === "function"
            ? normalizeCaseStudiesFromDetail(
                { caseStudies: resolveCaseStudies(serviceDetail, entry, helpers) },
                {
                  ...paths,
                  caseStudies: ["caseStudies"],
                },
                labels
              )
            : normalizeCaseStudiesFromDetail(serviceDetail, paths, labels);

        const metadataItems =
          typeof resolveMetrics === "function"
            ? resolveMetrics(serviceDetail, entry, helpers)
            : metrics
                .map((metric) => {
                  const value =
                    typeof metric.getValue === "function"
                      ? metric.getValue({
                          detail: serviceDetail,
                          entry,
                          fieldPaths: paths,
                          helpers,
                        })
                      : getFirstValue(serviceDetail, metric.fieldPaths || []);

                  return {
                    key: metric.key || metric.label,
                    label: metric.label || formatDisplayLabel(metric.key),
                    value: hasValue(value) ? value : labels.emptyValue,
                    icon: metric.icon,
                  };
                })
                .filter((metric) => hasValue(metric.label));

        const hasServiceProfileContent = Boolean(
          serviceTitle ||
            serviceDescription ||
            serviceImage ||
            selectedSubcategories.length ||
            serviceSkillTags.length ||
            caseStudies.length
        );

        return {
          serviceKey,
          serviceTitle,
          serviceName,
          serviceImage,
          serviceDescription,
          metadataItems,
          selectedSubcategories,
          subcategorySkillGroups,
          fallbackSkillTags: serviceSkillTags,
          caseStudies,
          hasServiceProfileContent,
        };
      }
    );
  }, [
    collectServiceSpecializations,
    getServiceLabel,
    helpers,
    labels,
    metrics,
    onboardingServiceEntries,
    paths,
    resolveAvatarUrl,
    resolveCaseStudies,
    resolveMetrics,
    resolveServiceDescription,
    resolveServiceImage,
    resolveServiceName,
    resolveServiceSkills,
    resolveServiceSubcategories,
    resolveServiceTitle,
    serviceKeyAliases,
    subcategoryOptionsByServiceKey,
    toUniqueLabels,
    toolOptionsBySubcategoryId,
  ]);

  const carouselOptions = useMemo(
    () => ({
      align: "start",
      loop: false,
      duration: 12,
    }),
    []
  );

  return (
    <Carousel opts={carouselOptions} className="w-full">
      <Card className="relative overflow-visible rounded-2xl border border-border/60 bg-card p-3 pb-4 shadow-none sm:p-4">
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, hsl(var(--primary)), rgba(56,189,248,0.9), transparent)",
          }}
          aria-hidden="true"
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
              <Cpu className="h-4 w-4 text-primary" aria-hidden="true" />
            </span>

            <div>
              <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                {labels.sectionTitle}
              </h3>

              <p className="text-xs text-muted-foreground">
                {processedServices.length}{" "}
                {processedServices.length === 1
                  ? labels.serviceSingular
                  : labels.servicePlural}
              </p>
            </div>
          </div>

          {processedServices.length > 0 ? (
            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              {typeof openAddServiceModal === "function" && (
                <button
                  type="button"
                  onClick={openAddServiceModal}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-primary/35 bg-primary/10 px-3 text-xs font-semibold text-primary transition-all duration-200 hover:bg-primary/20 hover:scale-[1.02]"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  Add Service
                </button>
              )}

              {processedServices.length > 1 ? (
                <div className="flex items-center gap-2">
                  <CarouselPrevious className="relative inset-auto flex size-8 translate-x-0 translate-y-0 border-primary/40 bg-card text-primary hover:scale-105 hover:bg-card hover:text-primary disabled:border-border disabled:bg-card disabled:text-muted-foreground" />

                  <CarouselNext className="relative inset-auto flex size-8 translate-x-0 translate-y-0 border-primary/40 bg-card text-primary hover:scale-105 hover:bg-card hover:text-primary disabled:border-border disabled:bg-card disabled:text-muted-foreground" />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {processedServices.length > 0 ? (
          <div className="relative mt-3">
            <div className="overflow-hidden rounded-2xl px-1 pt-3 pb-3 -mx-1 -mt-3 -mb-3">
              <CarouselContent className="-mx-3 [will-change:transform]">
                {processedServices.map((cardData) => (
                  <CarouselItem
                    key={`service-card-${cardData.serviceKey}`}
                    className="basis-full px-3 lg:basis-1/2"
                  >
                    <ServiceDetailArticle
                      cardData={cardData}
                      labels={labels}
                      openEditServiceProfileModal={openEditServiceProfileModal}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-5">
            <p className="text-xs text-muted-foreground">{labels.noServices}</p>

            <button
              type="button"
              onClick={openAddServiceModal}
              className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md border border-primary/35 bg-primary/10 px-4 text-xs font-semibold text-primary transition-colors duration-200 hover:bg-primary/20"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {labels.addFirstService}
            </button>
          </div>
        )}
      </Card>
    </Carousel>
  );
};

export default ServicesFromOnboardingCard;
