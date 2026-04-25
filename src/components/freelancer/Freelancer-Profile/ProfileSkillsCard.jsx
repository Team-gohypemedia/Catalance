import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Code2 from "lucide-react/dist/esm/icons/code-2";
import Layers from "lucide-react/dist/esm/icons/layers";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Megaphone from "lucide-react/dist/esm/icons/megaphone";
import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal";
import Palette from "lucide-react/dist/esm/icons/palette";
import Pencil from "lucide-react/dist/esm/icons/pencil";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import Video from "lucide-react/dist/esm/icons/video";
import X from "lucide-react/dist/esm/icons/x";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Slider } from "@/components/ui/slider";
import { API_BASE_URL } from "@/shared/lib/api-client";
import {
  DEFAULT_SKILL_LEVEL,
  SKILL_LEVEL_OPTIONS,
  formatSkillLevelLabel,
  normalizeSkillLevel,
} from "@/components/freelancer/Freelancer-Profile/freelancerProfileUtils";

const normalizeSkill = (entry, index) => {
  if (typeof entry === "string") {
    return {
      id: `skill-${index}-${entry}`,
      name: entry,
      level: DEFAULT_SKILL_LEVEL,
    };
  }

  if (!entry || typeof entry !== "object") {
    return {
      id: `skill-${index}`,
      name: "Skill",
      level: DEFAULT_SKILL_LEVEL,
    };
  }

  return {
    id: `skill-${index}-${entry.name || "item"}`,
    name: String(entry.name || "Skill").trim(),
    level: normalizeSkillLevel(
      entry.level || entry.proficiency || entry.experienceLevel || DEFAULT_SKILL_LEVEL
    ),
  };
};

const toDisplayTags = (values = []) => {
  const seen = new Set();

  return (Array.isArray(values) ? values : []).reduce((acc, value) => {
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

const resolveSubcategoryLabel = (entry = {}) => {
  const label = String(entry?.label || entry?.subCategoryLabel || entry?.name || "").trim();
  if (label) return label;

  const key = String(entry?.subCategoryKey || entry?.key || "").trim();
  return /^catalog:\d+$/i.test(key) ? "" : key;
};

const toPositiveInteger = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const resolveSubcategoryId = (entry = {}) => {
  const directId = toPositiveInteger(
    entry?.subCategoryId || entry?.subcategoryId || entry?.id
  );
  if (directId) return directId;

  const key = String(entry?.subCategoryKey || entry?.key || "").trim();
  return toPositiveInteger(key.match(/^catalog:(\d+)$/i)?.[1]);
};

const getTagKey = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const getServiceKey = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const WEB_DEVELOPMENT_SKILL_KEYS_BY_SUBCATEGORY = {
  nextjs: ["nextjs", "react", "javascript", "typescript", "tailwind", "css", "html"],
  nodejs: [
    "nodejs",
    "expressjs",
    "restapi",
    "postman",
    "swagger",
    "graphql",
    "auth0",
    "jwt",
    "oauth",
    "firebase",
    "mongodb",
    "mysql",
    "postgresql",
    "supabase",
  ],
  frontend: [
    "bootstrap",
    "css",
    "html",
    "javascript",
    "nextjs",
    "react",
    "sass",
    "tailwind",
    "typescript",
  ],
  backend: [
    "nodejs",
    "expressjs",
    "restapi",
    "postman",
    "swagger",
    "graphql",
    "auth0",
    "jwt",
    "oauth",
    "firebase",
    "mongodb",
    "mysql",
    "postgresql",
    "supabase",
  ],
};

const SERVICE_KEY_ALIASES = {
  website_uiux: "web_development",
  website_ui_ux: "web_development",
  website_ui_ux_design_2d_3d: "web_development",
  website_ui_ux_design: "web_development",
  web_development: "web_development",
};

const resolveServiceCardIcon = (serviceTitle = "") => {
  const title = String(serviceTitle || "").toLowerCase();

  if (title.includes("web") || title.includes("software") || title.includes("code")) {
    return Code2;
  }
  if (title.includes("design") || title.includes("creative") || title.includes("ui")) {
    return Palette;
  }
  if (title.includes("video") || title.includes("animation")) {
    return Video;
  }
  if (title.includes("seo") || title.includes("growth") || title.includes("analytics")) {
    return TrendingUp;
  }
  if (title.includes("marketing") || title.includes("social") || title.includes("ads")) {
    return Megaphone;
  }
  if (title.includes("business") || title.includes("consult") || title.includes("sales")) {
    return Briefcase;
  }

  return Layers;
};

const inferSubcategorySkills = (label = "", availableTags = []) => {
  const labelKey = getTagKey(label);
  if (!labelKey) return availableTags;

  if (labelKey === "fullstack") return availableTags;

  const allowedKeys = WEB_DEVELOPMENT_SKILL_KEYS_BY_SUBCATEGORY[labelKey];
  if (Array.isArray(allowedKeys)) {
    const allowed = new Set(allowedKeys);
    return availableTags.filter((tag) => allowed.has(getTagKey(tag)));
  }

  const matchedTags = availableTags.filter((tag) => getTagKey(tag) === labelKey);
  return matchedTags.length ? matchedTags : availableTags;
};

const ProfileSkillsCard = ({
  skills,
  deleteSkill,
  setSkillLevel,
  savingChanges,
  onboardingServiceEntries = [],
  getServiceLabel,
  collectServiceSpecializations,
  toUniqueLabels,
}) => {
  const skillCards = (Array.isArray(skills) ? skills : []).map(normalizeSkill);
  const [openMenu, setOpenMenu] = useState(null);
  const [openMenuView, setOpenMenuView] = useState("actions");
  const [pendingSkillLevel, setPendingSkillLevel] = useState(DEFAULT_SKILL_LEVEL);
  const [activeServiceKey, setActiveServiceKey] = useState("");
  const [activeSubcategoryKey, setActiveSubcategoryKey] = useState("");
  const [serviceCarouselApi, setServiceCarouselApi] = useState(null);
  const [canScrollPrevService, setCanScrollPrevService] = useState(false);
  const [canScrollNextService, setCanScrollNextService] = useState(false);
  const [subcategoryCarouselApi, setSubcategoryCarouselApi] = useState(null);
  const [canScrollPrevSubcategory, setCanScrollPrevSubcategory] = useState(false);
  const [canScrollNextSubcategory, setCanScrollNextSubcategory] = useState(false);
  const [technologyCarouselApi, setTechnologyCarouselApi] = useState(null);
  const [canScrollPrevTechnology, setCanScrollPrevTechnology] = useState(false);
  const [canScrollNextTechnology, setCanScrollNextTechnology] = useState(false);
  const [marketplaceServices, setMarketplaceServices] = useState([]);
  const [subcategoryOptionsByServiceKey, setSubcategoryOptionsByServiceKey] = useState({});
  const [toolOptionsBySubcategoryId, setToolOptionsBySubcategoryId] = useState({});

  const marketplaceServiceByKey = useMemo(() => {
    const serviceMap = new Map();

    marketplaceServices.forEach((service) => {
      [
        service?.key,
        service?.value,
        service?.name,
        service?.label,
      ].forEach((value) => {
        const key = SERVICE_KEY_ALIASES[getServiceKey(value)] || getServiceKey(value);
        if (key && !serviceMap.has(key)) {
          serviceMap.set(key, service);
        }
      });
    });

    return serviceMap;
  }, [marketplaceServices]);

  useEffect(() => {
    if (!API_BASE_URL) return undefined;

    let cancelled = false;

    const fetchMarketplaceServices = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/marketplace/filters/services`);
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
  }, []);

  useEffect(() => {
    if (!API_BASE_URL || !marketplaceServiceByKey.size) return undefined;

    const requestedServices = (Array.isArray(onboardingServiceEntries)
      ? onboardingServiceEntries
      : [])
      .map(({ serviceKey, detail }) => {
        const normalizedServiceKey =
          SERVICE_KEY_ALIASES[getServiceKey(serviceKey)] || getServiceKey(serviceKey);
        const service =
          marketplaceServiceByKey.get(normalizedServiceKey) ||
          marketplaceServiceByKey.get(getServiceKey(detail?.serviceKey));
        const serviceId = toPositiveInteger(
          detail?.serviceId || detail?.id || service?.id
        );

        return {
          serviceKey,
          serviceId,
        };
      })
      .filter((entry) => entry.serviceKey && entry.serviceId);

    if (!requestedServices.length) return undefined;

    let cancelled = false;

    const fetchSubcategories = async () => {
      try {
        const entries = await Promise.all(
          requestedServices.map(async ({ serviceKey, serviceId }) => {
            const response = await fetch(
              `${API_BASE_URL}/marketplace/filters/sub-categories?serviceId=${serviceId}`
            );
            if (!response.ok) return [serviceKey, []];

            const payload = await response.json();
            const options = (Array.isArray(payload?.data) ? payload.data : [])
              .map((entry) => ({
                id: toPositiveInteger(entry?.id),
                label: String(entry?.name || entry?.label || "").trim(),
              }))
              .filter((entry) => entry.id && entry.label);

            return [serviceKey, options];
          })
        );

        if (!cancelled) {
          setSubcategoryOptionsByServiceKey(Object.fromEntries(entries));
        }
      } catch {
        if (!cancelled) setSubcategoryOptionsByServiceKey({});
      }
    };

    void fetchSubcategories();
    return () => {
      cancelled = true;
    };
  }, [marketplaceServiceByKey, onboardingServiceEntries]);

  useEffect(() => {
    if (!API_BASE_URL) return undefined;

    const subcategoryIds = Array.from(
      new Set(
        (Array.isArray(onboardingServiceEntries) ? onboardingServiceEntries : [])
          .flatMap(({ detail }) =>
            Array.isArray(detail?.subcategories) ? detail.subcategories : []
          )
          .map(resolveSubcategoryId)
          .filter(Boolean)
      )
    );

    if (!subcategoryIds.length) return undefined;

    let cancelled = false;

    const fetchTools = async () => {
      try {
        const entries = await Promise.all(
          subcategoryIds.map(async (subcategoryId) => {
            const response = await fetch(
              `${API_BASE_URL}/marketplace/filters/tools?subCategoryId=${subcategoryId}`
            );
            if (!response.ok) return [String(subcategoryId), []];

            const payload = await response.json();
            const options = (Array.isArray(payload?.data) ? payload.data : [])
              .map((entry) => ({
                id: toPositiveInteger(entry?.id),
                label: String(entry?.name || entry?.label || "").trim(),
              }))
              .filter((entry) => entry.id && entry.label);

            return [String(subcategoryId), options];
          })
        );

        if (!cancelled) {
          setToolOptionsBySubcategoryId(Object.fromEntries(entries));
        }
      } catch {
        if (!cancelled) setToolOptionsBySubcategoryId({});
      }
    };

    void fetchTools();
    return () => {
      cancelled = true;
    };
  }, [onboardingServiceEntries]);

  const serviceExpertiseGroups = useMemo(() => {
    const normalizeTags = (values = []) =>
      typeof toUniqueLabels === "function" ? toUniqueLabels(values) : toDisplayTags(values);

    return (Array.isArray(onboardingServiceEntries) ? onboardingServiceEntries : [])
      .map(({ serviceKey, detail }) => {
        const serviceDetail = detail && typeof detail === "object" ? detail : {};
        const subcategories = Array.isArray(serviceDetail.subcategories)
          ? serviceDetail.subcategories
          : [];
        const normalizedServiceKey =
          SERVICE_KEY_ALIASES[getServiceKey(serviceKey)] || getServiceKey(serviceKey);
        const subcategoryOptions =
          subcategoryOptionsByServiceKey?.[serviceKey] ||
          subcategoryOptionsByServiceKey?.[normalizedServiceKey] ||
          [];
        const subcategoryLabelById = new Map(
          subcategoryOptions.map((entry) => [entry.id, entry.label])
        );
        const serviceTitle =
          (typeof getServiceLabel === "function" && getServiceLabel(serviceKey)) ||
          String(serviceKey || "").trim();
        const directTags = normalizeTags([
          ...(Array.isArray(serviceDetail.skillsAndTechnologies)
            ? serviceDetail.skillsAndTechnologies
            : []),
          ...(Array.isArray(serviceDetail?.caseStudy?.techStack)
            ? serviceDetail.caseStudy.techStack
            : []),
        ]);
        const frameworkTags = normalizeTags([
          ...collectObjectTags(serviceDetail.groups),
          ...collectObjectTags(serviceDetail.groupOther),
          ...subcategories.flatMap((entry) =>
            Array.isArray(entry?.customSkillNames) ? entry.customSkillNames : []
          ),
        ]);
        const selectedSubcategoryItems = subcategories
          .map((subcategory, index) => {
            const subcategoryId = resolveSubcategoryId(subcategory);
            const label =
              resolveSubcategoryLabel(subcategory) ||
              subcategoryLabelById.get(subcategoryId) ||
              "";

            return {
              subcategory,
              subcategoryId,
              key: `${serviceKey}-${subcategoryId || getTagKey(label) || index}`,
              label,
            };
          })
          .filter((entry) => entry.label);
        const resolvedSubcategoryTags = normalizeTags([
          ...selectedSubcategoryItems.map((entry) => entry.label),
          ...(Array.isArray(serviceDetail.pendingCategoryLabels)
            ? serviceDetail.pendingCategoryLabels
            : []),
          ...(Array.isArray(serviceDetail.legacyCategoryLabels)
            ? serviceDetail.legacyCategoryLabels
            : []),
          ...(Array.isArray(serviceDetail.selectedSubcategories)
            ? serviceDetail.selectedSubcategories
            : []),
          ...(Array.isArray(serviceDetail.selectedSubCategories)
            ? serviceDetail.selectedSubCategories
            : []),
          ...(Array.isArray(serviceDetail.subCategoryLabels)
            ? serviceDetail.subCategoryLabels
            : []),
          ...(Array.isArray(serviceDetail.subcategoryLabels)
            ? serviceDetail.subcategoryLabels
            : []),
        ]);
        const focusTags = normalizeTags([
          ...(Array.isArray(serviceDetail.niches) ? serviceDetail.niches : []),
          serviceDetail.otherNiche,
          ...(Array.isArray(serviceDetail.keywords) ? serviceDetail.keywords : []),
        ]);
        const subcategoryTags = resolvedSubcategoryTags.length
          ? resolvedSubcategoryTags
          : focusTags;
        const serviceFocusTags = resolvedSubcategoryTags.length ? focusTags : [];
        const serviceSkillTags = normalizeTags([
          ...directTags,
          ...frameworkTags,
          ...(typeof collectServiceSpecializations === "function"
            ? collectServiceSpecializations(serviceDetail)
            : []),
        ]);
        const subcategoryItems = subcategoryTags.map((label, index) => {
          const selectedItem = selectedSubcategoryItems[index];
          const subcategory = selectedItem?.subcategory || {};
          const subcategoryId =
            selectedItem?.subcategoryId || resolveSubcategoryId(subcategory);
          const toolLabelById = new Map(
            (toolOptionsBySubcategoryId[String(subcategoryId)] || []).map(
              (tool) => [tool.id, tool.label]
            )
          );
          const selectedToolTags = normalizeTags(
            (Array.isArray(subcategory?.selectedToolIds)
              ? subcategory.selectedToolIds
              : [])
              .map((toolId) => toolLabelById.get(toPositiveInteger(toolId)))
              .filter(Boolean)
          );
          const savedSkillTags = normalizeTags(
            [
              ...selectedToolTags,
              ...(Array.isArray(subcategory?.selectedSkills)
                ? subcategory.selectedSkills
                : []),
              ...(Array.isArray(subcategory?.skills)
                ? subcategory.skills
                : []),
              ...(Array.isArray(subcategory?.customSkillNames)
                ? subcategory.customSkillNames
                : []),
            ]
          );
          const activeSkillTags = savedSkillTags.length
            ? savedSkillTags
            : inferSubcategorySkills(label, serviceSkillTags);

          return {
            key:
              selectedItem?.key ||
              `${serviceKey}-${subcategoryId || getTagKey(label) || index}`,
            label,
            skillTags: activeSkillTags,
          };
        });
        const expertiseTags = serviceSkillTags;

        return {
          serviceKey,
          serviceTitle,
          directTags,
          frameworkTags,
          subcategoryTags,
          subcategoryItems,
          focusTags: serviceFocusTags,
          expertiseTags,
        };
      })
      .filter(
        (entry) =>
          entry.serviceKey &&
          (entry.directTags.length ||
            entry.frameworkTags.length ||
            entry.subcategoryTags.length ||
            entry.focusTags.length ||
            entry.expertiseTags.length)
      );
  }, [
    collectServiceSpecializations,
    getServiceLabel,
    onboardingServiceEntries,
    subcategoryOptionsByServiceKey,
    toolOptionsBySubcategoryId,
    toUniqueLabels,
  ]);

  const activeService =
    serviceExpertiseGroups.find((entry) => entry.serviceKey === activeServiceKey) ||
    serviceExpertiseGroups[0] ||
    null;
  const activeSubcategory =
    activeService?.subcategoryItems.find(
      (entry) => entry.key === activeSubcategoryKey
    ) ||
    activeService?.subcategoryItems[0] ||
    null;
  const activeTechnologyTags = activeSubcategory?.skillTags || [];

  useEffect(() => {
    if (!serviceCarouselApi) {
      setCanScrollPrevService(false);
      setCanScrollNextService(false);
      return undefined;
    }

    const syncCarouselState = () => {
      setCanScrollPrevService(serviceCarouselApi.canScrollPrev());
      setCanScrollNextService(serviceCarouselApi.canScrollNext());
    };

    syncCarouselState();
    serviceCarouselApi.on("select", syncCarouselState);
    serviceCarouselApi.on("reInit", syncCarouselState);

    return () => {
      serviceCarouselApi.off("select", syncCarouselState);
      serviceCarouselApi.off("reInit", syncCarouselState);
    };
  }, [serviceCarouselApi, serviceExpertiseGroups.length]);

  useEffect(() => {
    if (!subcategoryCarouselApi) {
      setCanScrollPrevSubcategory(false);
      setCanScrollNextSubcategory(false);
      return undefined;
    }

    const syncSubcategoryCarouselState = () => {
      setCanScrollPrevSubcategory(subcategoryCarouselApi.canScrollPrev());
      setCanScrollNextSubcategory(subcategoryCarouselApi.canScrollNext());
    };

    syncSubcategoryCarouselState();
    subcategoryCarouselApi.on("select", syncSubcategoryCarouselState);
    subcategoryCarouselApi.on("reInit", syncSubcategoryCarouselState);

    return () => {
      subcategoryCarouselApi.off("select", syncSubcategoryCarouselState);
      subcategoryCarouselApi.off("reInit", syncSubcategoryCarouselState);
    };
  }, [subcategoryCarouselApi, activeService?.subcategoryItems.length]);

  useEffect(() => {
    if (!technologyCarouselApi) {
      setCanScrollPrevTechnology(false);
      setCanScrollNextTechnology(false);
      return undefined;
    }

    const syncTechnologyCarouselState = () => {
      setCanScrollPrevTechnology(technologyCarouselApi.canScrollPrev());
      setCanScrollNextTechnology(technologyCarouselApi.canScrollNext());
    };

    syncTechnologyCarouselState();
    technologyCarouselApi.on("select", syncTechnologyCarouselState);
    technologyCarouselApi.on("reInit", syncTechnologyCarouselState);

    return () => {
      technologyCarouselApi.off("select", syncTechnologyCarouselState);
      technologyCarouselApi.off("reInit", syncTechnologyCarouselState);
    };
  }, [technologyCarouselApi, activeTechnologyTags.length]);

  const closeMenu = () => {
    setOpenMenu(null);
    setOpenMenuView("actions");
    setPendingSkillLevel(DEFAULT_SKILL_LEVEL);
  };

  return (
    <>
      <Card className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm md:p-6">
        {savingChanges ? (
          <div className="flex items-center justify-end gap-3">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving...
            </span>
          </div>
        ) : null}

      {serviceExpertiseGroups.length > 0 ? (
        <div className="mt-0 space-y-4">
          <section>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-2xl font-semibold tracking-tight text-foreground">
                Services & Skills
              </p>
              <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={!canScrollPrevService}
                onClick={() => serviceCarouselApi?.scrollPrev()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-muted-foreground transition-colors hover:bg-white/15 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous specialization"
              >
                <ChevronLeft className="h-5 w-5 text-foreground" aria-hidden="true" />
              </button>
              <button
                type="button"
                disabled={!canScrollNextService}
                onClick={() => serviceCarouselApi?.scrollNext()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-muted-foreground transition-colors hover:bg-white/15 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next specialization"
              >
                <ChevronRight className="h-5 w-5 text-foreground" aria-hidden="true" />
              </button>
              </div>
            </div>

            <Carousel
              setApi={setServiceCarouselApi}
              opts={{
                align: "start",
                loop: serviceExpertiseGroups.length > 1,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-3 sm:-ml-4">
                {serviceExpertiseGroups.map((service) => {
                  const isActive = activeService?.serviceKey === service.serviceKey;
                  const ServiceIcon = resolveServiceCardIcon(service.serviceTitle);

                  return (
                    <CarouselItem
                      key={service.serviceKey}
                      className="basis-[170px] pl-3 sm:basis-[180px] sm:pl-4"
                    >
                      <button
                        type="button"
                        onClick={() => setActiveServiceKey(service.serviceKey)}
                        className={`group flex h-[96px] w-full flex-col items-center justify-center gap-2 rounded-2xl border px-3 text-center transition-all duration-200 ${
                          isActive
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] text-muted-foreground hover:border-white/20 hover:text-foreground"
                        }`}
                      >
                        <ServiceIcon
                          className={`h-7 w-7 ${
                            isActive
                              ? "text-primary-foreground"
                              : "text-muted-foreground group-hover:text-foreground"
                          }`}
                          aria-hidden="true"
                        />
                        <span className="text-base font-bold leading-tight">
                          {service.serviceTitle}
                        </span>
                      </button>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
            </Carousel>
          </section>

          {activeService ? (
            <div className="space-y-4">
                <section>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Sub Categories
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={!canScrollPrevSubcategory}
                        onClick={() => subcategoryCarouselApi?.scrollPrev()}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/10 text-muted-foreground transition-colors hover:bg-white/15 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Previous sub category"
                      >
                        <ChevronLeft className="h-4 w-4 text-foreground" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        disabled={!canScrollNextSubcategory}
                        onClick={() => subcategoryCarouselApi?.scrollNext()}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/10 text-muted-foreground transition-colors hover:bg-white/15 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Next sub category"
                      >
                        <ChevronRight className="h-4 w-4 text-foreground" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3">
                    {activeService.subcategoryItems.length > 0 ? (
                      <Carousel
                        setApi={setSubcategoryCarouselApi}
                        opts={{
                          align: "start",
                          loop: activeService.subcategoryItems.length > 1,
                        }}
                        className="w-full overflow-hidden"
                      >
                        <CarouselContent className="-ml-2">
                          {activeService.subcategoryItems.map((subcategory) => {
                            const isActive =
                              activeSubcategory?.key === subcategory.key;

                            return (
                              <CarouselItem key={subcategory.key} className="basis-auto pl-2">
                                <button
                                  type="button"
                                  onClick={() => setActiveSubcategoryKey(subcategory.key)}
                                  className={`whitespace-nowrap rounded-md border px-3 py-1.5 text-sm font-semibold transition-colors ${
                                    isActive
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "bg-card text-accent-foreground hover:bg-accent/90"
                                  }`}
                                >
                                  {subcategory.label}
                                </button>
                              </CarouselItem>
                            );
                          })}
                        </CarouselContent>
                      </Carousel>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set yet</span>
                    )}
                  </div>
                </section>
                <section>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Skills
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={!canScrollPrevTechnology}
                        onClick={() => technologyCarouselApi?.scrollPrev()}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/10 text-muted-foreground transition-colors hover:bg-white/15 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Previous core technology"
                      >
                        <ChevronLeft className="h-4 w-4 text-foreground" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        disabled={!canScrollNextTechnology}
                        onClick={() => technologyCarouselApi?.scrollNext()}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/10 text-muted-foreground transition-colors hover:bg-white/15 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Next core technology"
                      >
                        <ChevronRight className="h-4 w-4 text-foreground" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3">
                    {activeTechnologyTags.length > 0 ? (
                      <Carousel
                        setApi={setTechnologyCarouselApi}
                        opts={{
                          align: "start",
                          loop: activeTechnologyTags.length > 1,
                        }}
                        className="w-full overflow-hidden"
                      >
                        <CarouselContent className="-ml-2">
                          {activeTechnologyTags.map((tag) => (
                            <CarouselItem key={`core-tech-${tag}`} className="basis-auto pl-2">
                              <span className="inline-block whitespace-nowrap rounded-md border border-primary bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">
                                {tag}
                              </span>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                      </Carousel>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set yet</span>
                    )}
                  </div>
                </section>
            </div>
          ) : null}
        </div>
      ) : null}

      {serviceExpertiseGroups.length === 0 && skillCards.length > 0 ? (
        <div
          className={
            serviceExpertiseGroups.length > 0
              ? "mt-5 border-t border-border/60 pt-5"
              : "mt-4"
          }
        >
          {serviceExpertiseGroups.length > 0 ? (
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Profile Skill Levels
            </p>
          ) : null}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {skillCards.map((skill, index) => (
              <div
                key={skill.id}
                className="relative flex items-start justify-between rounded-xl border border-border/50 bg-background/50 p-4 transition-all duration-200 hover:border-border/80 hover:bg-muted/30"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{skill.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Level {formatSkillLevelLabel(skill.level)}
                  </p>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    disabled={savingChanges}
                    onClick={() => {
                      if (openMenu === index) {
                        closeMenu();
                      } else {
                        setOpenMenu(index);
                        setOpenMenuView("actions");
                        setPendingSkillLevel(skill.level);
                      }
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    title="Options"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>

                  {openMenu === index ? (
                    <>
                      <div className="fixed inset-0 z-10" onClick={closeMenu} />
                      <div className="absolute right-0 top-8 z-20 w-[240px] rounded-lg border border-border/60 bg-card p-1 shadow-lg">
                        {openMenuView === "actions" ? (
                          <>
                            <button
                              type="button"
                              disabled={savingChanges}
                              onClick={() => {
                                setPendingSkillLevel(skill.level);
                                setOpenMenuView("levels");
                              }}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium text-foreground transition-colors duration-150 hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Pencil className="h-3 w-3" />
                              Edit level
                            </button>
                            <button
                              type="button"
                              disabled={savingChanges}
                              onClick={() => {
                                deleteSkill(skill);
                                closeMenu();
                              }}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium text-destructive transition-colors duration-150 hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Trash2 className="h-3 w-3" />
                              Remove
                            </button>
                          </>
                        ) : (
                          <div className="px-3 pb-3 pt-2">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                  Skill level (1-10)
                                </p>
                                <p className="mt-1 text-xs text-foreground/80">
                                  Current: {formatSkillLevelLabel(pendingSkillLevel)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={closeMenu}
                                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                                title="Close"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <div className="mt-4 space-y-3">
                              <Slider
                                min={1}
                                max={10}
                                step={1}
                                value={[pendingSkillLevel]}
                                disabled={savingChanges}
                                onValueChange={(values) => {
                                  setPendingSkillLevel(normalizeSkillLevel(values?.[0]));
                                }}
                                onValueCommit={(values) => {
                                  const nextLevel = normalizeSkillLevel(values?.[0]);
                                  setPendingSkillLevel(nextLevel);
                                  if (
                                    typeof setSkillLevel === "function" &&
                                    nextLevel !== skill.level
                                  ) {
                                    void setSkillLevel(index, nextLevel);
                                  }
                                }}
                              />
                              <div className="flex items-center justify-between gap-1 text-[11px] font-medium text-muted-foreground">
                                {SKILL_LEVEL_OPTIONS.map((levelOption) => (
                                  <span
                                    key={`${skill.id}-scale-${levelOption}`}
                                    className={
                                      pendingSkillLevel === levelOption
                                        ? "text-primary"
                                        : undefined
                                    }
                                  >
                                    {levelOption}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : serviceExpertiseGroups.length > 0 ? null : (
        <div className="mt-4 rounded-xl border border-dashed border-border/50 bg-muted/10 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Add your skills so clients can quickly understand what you do best.
          </p>
        </div>
      )}
      </Card>
    </>
  );
};

export default ProfileSkillsCard;
