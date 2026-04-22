import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Cloud from "lucide-react/dist/esm/icons/cloud";
import Code2 from "lucide-react/dist/esm/icons/code-2";
import Database from "lucide-react/dist/esm/icons/database";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Globe from "lucide-react/dist/esm/icons/globe";
import Layers3 from "lucide-react/dist/esm/icons/layers-3";
import MapPinned from "lucide-react/dist/esm/icons/map-pinned";
import Smartphone from "lucide-react/dist/esm/icons/smartphone";
import Wallet from "lucide-react/dist/esm/icons/wallet";
import Wrench from "lucide-react/dist/esm/icons/wrench";

import {
  normalizeProjectLinkValue,
  resolveAvatarUrl,
} from "@/components/features/freelancer/profile/freelancerProfileUtils";
import { useAuth } from "@/shared/context/AuthContext";
import { getSubcategorySelectionKey } from "../service-details";
import { ServiceInfoStepper } from "./shared/ServiceInfoComponents";
import { API_BASE_URL } from "@/shared/lib/api-client";

const EXPERIENCE_LABELS = {
  entry: "0-1 Years",
  intermediate: "1-3 Years",
  experienced: "3-5 Years",
  expert: "5-10 Years",
  veteran: "10+ Years",
};

const DELIVERY_TIMELINE_LABELS = {
  "1_week": "1 Week",
  "2_weeks": "2 Weeks",
  "3_weeks": "3 Weeks",
  "4_weeks": "4 Weeks",
  "6_weeks": "6 Weeks",
  "8_weeks": "8 Weeks",
  "12_weeks": "12 Weeks",
  ongoing: "Ongoing / Retainer",
};



const SECTION_TITLE_CLASS =
  "text-2xl font-semibold tracking-[-0.03em] text-white";
const SECTION_SUBTITLE_CLASS = "text-sm text-white/48";
const SECTION_BODY_CLASS =
  "max-w-3xl text-sm leading-7 text-white/72 sm:text-base sm:leading-8";
const CARD_LABEL_CLASS = "text-[11px] uppercase tracking-[0.22em] text-white/38";
const CARD_VALUE_CLASS = "mt-3 text-xl font-semibold tracking-[-0.03em] text-white";
const CASE_STUDY_META_PILL_CLASS =
  "inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/78";
const CASE_STUDY_PREVIEW_CACHE = new Map();

const normalizeStringArray = (values) => {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  );
};

const hasMeaningfulValue = (value) => {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.some((entry) => hasMeaningfulValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.values(value).some((entry) => hasMeaningfulValue(entry));
  }

  return value !== null && value !== undefined;
};

const toPositiveInteger = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const toDisplayName = (value = "") => {
  const normalized = String(value || "")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return "";
  }

  return normalized
    .split(" ")
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
};

const buildObjectPreview = (entry, fileSelector) => {
  if (typeof File === "undefined") return null;
  const file = fileSelector(entry);

  if (!(file instanceof File) || !String(file.type || "").startsWith("image/")) {
    return null;
  }

  const objectUrl = URL.createObjectURL(file);
  return {
    url: objectUrl,
    revoke: () => URL.revokeObjectURL(objectUrl),
  };
};

const resolveServiceImagePreviews = (mediaFiles = []) => {
  const entries = Array.isArray(mediaFiles) ? mediaFiles : [];
  const previews = [];

  for (const entry of entries) {
    const kind = String(entry?.kind || "").trim().toLowerCase();
    const mimeType = String(
      entry?.mimeType || entry?.type || entry?.contentType || "",
    )
      .trim()
      .toLowerCase();

    if (kind === "video" || mimeType.startsWith("video/")) {
      continue;
    }

    const objectPreview = buildObjectPreview(
      entry,
      (value) =>
        (typeof File !== "undefined" && value instanceof File ? value : null) ||
        value?.file,
    );
    if (objectPreview) {
      previews.push(objectPreview);
      continue;
    }

    const url = String(entry?.uploadedUrl || entry?.url || "").trim();
    if (url) {
      previews.push({ url, revoke: null });
    }
  }

  return previews;
};

const resolveProfilePhotoPreview = (profilePhoto) => {
  const remoteUrl = String(
    profilePhoto?.uploadedUrl || profilePhoto?.url || profilePhoto || "",
  ).trim();

  if (remoteUrl) {
    return { url: remoteUrl, revoke: null };
  }

  return buildObjectPreview(profilePhoto, (value) => value?.file);
};

const resolveStartingPriceDisplay = (value = "") => {
  const normalizedValue = String(value || "").trim();
  const numericValue = normalizedValue.replace(/[^\d]/g, "");
  const parsedValue = Number(numericValue);

  if (Number.isInteger(parsedValue) && parsedValue > 0) {
    return {
      hasValue: true,
      label: `₹${parsedValue.toLocaleString("en-IN")}`,
    };
  }

  return {
    hasValue: false,
    label: "Not selected",
  };
};

const formatCaseStudyBudget = (value = "") => {
  const normalizedValue = String(value || "").trim();
  if (!normalizedValue) {
    return "";
  }

  const parsed = Number(normalizedValue.replace(/[^\d]/g, ""));
  if (Number.isInteger(parsed) && parsed > 0) {
    return `₹${parsed.toLocaleString("en-IN")}`;
  }

  return normalizedValue;
};

const toCaseStudyPreviewKey = (projectLink = "") =>
  String(projectLink || "").trim().toLowerCase();

const getProjectHostLabel = (projectUrl = "") => {
  const normalizedUrl = normalizeProjectLinkValue(projectUrl);
  if (!normalizedUrl) {
    return "";
  }

  try {
    return new URL(normalizedUrl).hostname.replace(/^www\./i, "");
  } catch {
    return normalizedUrl.replace(/^https?:\/\//i, "").split("/")[0].trim();
  }
};

const getInitials = (value = "", fallback = "P") => {
  const tokens = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!tokens.length) {
    return String(fallback || "P")
      .slice(0, 2)
      .toUpperCase();
  }

  if (tokens.length === 1) {
    return tokens[0].slice(0, 2).toUpperCase();
  }

  return `${tokens[0].charAt(0)}${tokens[1].charAt(0)}`.toUpperCase();
};

const resolveTagIcon = (label = "") => {
  const normalized = String(label || "").trim().toLowerCase();

  if (!normalized) {
    return Wrench;
  }

  if (
    normalized.includes("flutter") ||
    normalized.includes("react native") ||
    normalized.includes("android") ||
    normalized.includes("ios") ||
    normalized.includes("mobile")
  ) {
    return Smartphone;
  }

  if (
    normalized.includes("firebase") ||
    normalized.includes("supabase") ||
    normalized.includes("aws") ||
    normalized.includes("cloud")
  ) {
    return Cloud;
  }

  if (
    normalized.includes("postgres") ||
    normalized.includes("mysql") ||
    normalized.includes("mongo") ||
    normalized.includes("database")
  ) {
    return Database;
  }

  if (
    normalized.includes("ui") ||
    normalized.includes("ux") ||
    normalized.includes("material") ||
    normalized.includes("design")
  ) {
    return Layers3;
  }

  if (
    normalized.includes("map") ||
    normalized.includes("location") ||
    normalized.includes("geo")
  ) {
    return MapPinned;
  }

  if (
    normalized.includes("payment") ||
    normalized.includes("razorpay") ||
    normalized.includes("upi") ||
    normalized.includes("billing")
  ) {
    return Wallet;
  }

  if (
    normalized.includes("web") ||
    normalized.includes("frontend") ||
    normalized.includes("backend") ||
    normalized.includes("full stack") ||
    normalized.includes("mern") ||
    normalized.includes("mean") ||
    normalized.includes("lamp") ||
    normalized.includes("react") ||
    normalized.includes("next") ||
    normalized.includes("node") ||
    normalized.includes("vite")
  ) {
    return Code2;
  }

  if (normalized.includes("seo") || normalized.includes("site") || normalized.includes("google")) {
    return Globe;
  }

  return Wrench;
};

const PreviewTag = ({ label, variant = "pill" }) => {
  const Icon = resolveTagIcon(label);
  const isCategoryCard = variant === "category";

  return (
    <div
      className={
        isCategoryCard
          ? "flex min-h-[54px] items-center gap-3 rounded-2xl border border-white/8 bg-[#191919] px-4 py-3 text-sm font-medium text-white/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
          : "flex items-center gap-2 rounded-full border border-white/8 bg-[#191919] px-4 py-3 text-sm font-medium text-white/86 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
      }
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/12 text-primary">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="truncate">{label}</span>
    </div>
  );
};

const FreelancerServiceReviewSlide = ({
  currentService,
  currentServiceName,
  serviceDraft,
  basicProfileForm,
  serviceInfoForm,
  servicePricingForm,
  serviceVisualsForm,
  user,
  onServiceStepChange,
}) => {
  const { authFetch } = useAuth();
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [toolOptionsByCategory, setToolOptionsByCategory] = useState({});
  const [activeMediaPreviewIndex, setActiveMediaPreviewIndex] = useState(0);
  const [caseStudyPreviewMap, setCaseStudyPreviewMap] = useState({});
  const caseStudyPreviewRequestsRef = useRef(new Set());
  const serviceName = currentServiceName || "Service";
  const reviewTitle =
    String(serviceInfoForm?.title || "").trim() || serviceName;
  const description =
    String(servicePricingForm?.description || "").trim() ||
    "Add a short service description in the pricing tab to show it here.";
  const resolvedServiceId = toPositiveInteger(currentService?.id);

  const selectedSubcategoryEntries = useMemo(
    () =>
      Array.isArray(serviceDraft?.subcategories)
        ? serviceDraft.subcategories
            .map((entry) => ({
              subCategoryId: toPositiveInteger(entry?.subCategoryId),
              subCategoryKey: getSubcategorySelectionKey(entry),
              label: String(
                entry?.label || entry?.subCategoryLabel || entry?.name || "",
              ).trim(),
              isCustom:
                Boolean(entry?.isCustom) || !toPositiveInteger(entry?.subCategoryId),
              selectedToolIds: Array.isArray(entry?.selectedToolIds)
                ? entry.selectedToolIds
                    .map((value) => toPositiveInteger(value))
                    .filter(Boolean)
                : [],
              customSkillNames: normalizeStringArray(entry?.customSkillNames),
            }))
            .filter((entry) => entry.subCategoryKey)
        : [],
    [serviceDraft?.subcategories],
  );

  const selectedSubcategoryIds = useMemo(
    () => selectedSubcategoryEntries.map((entry) => entry.subCategoryId),
    [selectedSubcategoryEntries],
  );

  const selectedSubcategoryIdsSignature = useMemo(
    () => selectedSubcategoryIds.join("|"),
    [selectedSubcategoryIds],
  );

  const freelancerName = useMemo(() => {
    const nameCandidates = [
      user?.profileDetails?.identity?.fullName,
      user?.profileDetails?.fullName,
      user?.displayName,
      user?.fullName,
      user?.name,
      basicProfileForm?.username,
    ];

    for (const candidate of nameCandidates) {
      const displayName = toDisplayName(candidate);
      if (displayName) {
        return displayName;
      }
    }

    return "Freelancer";
  }, [basicProfileForm?.username, user]);

  const avatarFallbackInitial = freelancerName.charAt(0).toUpperCase() || "F";

  useEffect(() => {
    if (!resolvedServiceId) {
      setCategoryOptions([]);
      return undefined;
    }

    let cancelled = false;

    const fetchSubCategories = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/marketplace/filters/sub-categories?serviceId=${resolvedServiceId}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch sub-categories");
        }

        const payload = await response.json();
        const nextCategoryOptions = (Array.isArray(payload?.data) ? payload.data : [])
          .map((entry) => ({
            value: toPositiveInteger(entry?.id),
            label: String(entry?.name || "").trim(),
          }))
          .filter((entry) => entry.value && entry.label);

        if (!cancelled) {
          setCategoryOptions(nextCategoryOptions);
        }
      } catch {
        if (!cancelled) {
          setCategoryOptions([]);
        }
      }
    };

    void fetchSubCategories();

    return () => {
      cancelled = true;
    };
  }, [resolvedServiceId]);

  useEffect(() => {
    const subCategoryIds = selectedSubcategoryIdsSignature
      .split("|")
      .map((value) => toPositiveInteger(value))
      .filter(Boolean);

    if (!subCategoryIds.length) {
      setToolOptionsByCategory({});
      return undefined;
    }

    let cancelled = false;

    const fetchToolsBySubCategory = async () => {
      try {
        const toolEntries = await Promise.all(
          subCategoryIds.map(async (subCategoryId) => {
            const response = await fetch(
              `${API_BASE_URL}/marketplace/filters/tools?subCategoryId=${subCategoryId}`,
            );

            if (!response.ok) {
              throw new Error("Failed to fetch tools");
            }

            const payload = await response.json();
            const options = (Array.isArray(payload?.data) ? payload.data : [])
              .map((entry) => ({
                id: toPositiveInteger(entry?.id),
                label: String(entry?.name || "").trim(),
              }))
              .filter((entry) => entry.id && entry.label);

            return [String(subCategoryId), options];
          }),
        );

        if (!cancelled) {
          setToolOptionsByCategory(Object.fromEntries(toolEntries));
        }
      } catch {
        if (!cancelled) {
          setToolOptionsByCategory({});
        }
      }
    };

    void fetchToolsBySubCategory();

    return () => {
      cancelled = true;
    };
  }, [selectedSubcategoryIdsSignature]);

  const profilePhotoPreview = useMemo(
    () => resolveProfilePhotoPreview(basicProfileForm?.profilePhoto),
    [basicProfileForm?.profilePhoto],
  );

  useEffect(
    () => () => {
      profilePhotoPreview?.revoke?.();
    },
    [profilePhotoPreview],
  );

  const mediaPreviews = useMemo(
    () => resolveServiceImagePreviews(serviceVisualsForm?.mediaFiles),
    [serviceVisualsForm?.mediaFiles],
  );
  const mediaPreview = mediaPreviews[activeMediaPreviewIndex] || null;
  const hasMultipleMediaPreviews = mediaPreviews.length > 1;

  useEffect(() => {
    setActiveMediaPreviewIndex((currentIndex) => {
      if (mediaPreviews.length === 0) {
        return 0;
      }

      return Math.min(currentIndex, mediaPreviews.length - 1);
    });
  }, [mediaPreviews.length]);

  useEffect(
    () => () => {
      mediaPreviews.forEach((preview) => {
        preview?.revoke?.();
      });
    },
    [mediaPreviews],
  );

  const handlePreviousMediaPreview = () => {
    setActiveMediaPreviewIndex((currentIndex) => {
      if (mediaPreviews.length <= 1) {
        return currentIndex;
      }

      return currentIndex === 0 ? mediaPreviews.length - 1 : currentIndex - 1;
    });
  };

  const handleNextMediaPreview = () => {
    setActiveMediaPreviewIndex((currentIndex) => {
      if (mediaPreviews.length <= 1) {
        return currentIndex;
      }

      return currentIndex === mediaPreviews.length - 1 ? 0 : currentIndex + 1;
    });
  };

  const technologyTags = useMemo(
    () =>
      normalizeStringArray(
        Array.isArray(serviceDraft?.skillsAndTechnologies)
          ? serviceDraft.skillsAndTechnologies
          : [],
      ),
    [serviceDraft?.skillsAndTechnologies],
  );

  const keywordTags = useMemo(
    () => normalizeStringArray(serviceVisualsForm?.keywords),
    [serviceVisualsForm?.keywords],
  );

  const selectedCategoryLabels = useMemo(() => {
    const categoryLabelById = new Map(
      categoryOptions.map((entry) => [entry.value, entry.label]),
    );
    const resolvedLabels = selectedSubcategoryIds
      .map((subCategoryId) => categoryLabelById.get(subCategoryId))
      .filter(Boolean);
    const customLabels = selectedSubcategoryEntries
      .map((entry) => entry.label)
      .filter(Boolean);
    const pendingLabels = Array.isArray(serviceDraft?.pendingCategoryLabels)
      ? serviceDraft.pendingCategoryLabels
      : [];

    return normalizeStringArray(
      [...resolvedLabels, ...customLabels].length > 0
        ? [...resolvedLabels, ...customLabels]
        : pendingLabels,
    );
  }, [
    categoryOptions,
    selectedSubcategoryEntries,
    selectedSubcategoryIds,
    serviceDraft?.pendingCategoryLabels,
  ]);

  const skillsBySubCategory = useMemo(() => {
    const categoryLabelById = new Map(
      categoryOptions.map((entry) => [entry.value, entry.label]),
    );

    return selectedSubcategoryEntries
      .map((subcategoryEntry) => {
        const tools = Array.isArray(
          toolOptionsByCategory[String(subcategoryEntry.subCategoryId)],
        )
          ? toolOptionsByCategory[String(subcategoryEntry.subCategoryId)]
          : [];

        const toolLabelById = new Map(
          tools
            .map((tool) => [toPositiveInteger(tool?.id), String(tool?.label || "").trim()])
            .filter(([id, label]) => id && label),
        );

        const resolvedToolNames = subcategoryEntry.selectedToolIds
          .map((toolId) => toolLabelById.get(toolId))
          .filter(Boolean);

        return {
          id: subcategoryEntry.subCategoryKey,
          label:
            subcategoryEntry.label ||
            categoryLabelById.get(subcategoryEntry.subCategoryId) ||
            (subcategoryEntry.subCategoryId
              ? `Sub-category ${subcategoryEntry.subCategoryId}`
              : "Custom sub-category"),
          skills: normalizeStringArray([
            ...resolvedToolNames,
            ...subcategoryEntry.customSkillNames,
          ]),
        };
      })
      .filter((entry) => entry.skills.length > 0);
  }, [categoryOptions, selectedSubcategoryEntries, toolOptionsByCategory]);

  const skillTags = useMemo(
    () => normalizeStringArray([...technologyTags, ...keywordTags]),
    [keywordTags, technologyTags],
  );

  const fetchCaseStudyPreview = useCallback(
    async (projectUrl) => {
      const normalizedUrl = normalizeProjectLinkValue(projectUrl);
      if (!normalizedUrl || typeof authFetch !== "function") {
        return null;
      }

      try {
        const previewResponse = await authFetch("/upload/project-preview", {
          method: "POST",
          body: JSON.stringify({ url: normalizedUrl }),
          suppressToast: true,
        });

        if (!previewResponse.ok) {
          return null;
        }

        const payload = await previewResponse.json().catch(() => null);
        if (!payload?.success || !payload?.data) {
          return null;
        }

        return {
          url: normalizeProjectLinkValue(payload.data.url || normalizedUrl),
          title: String(payload.data.title || "").trim(),
          description: String(payload.data.description || "").trim(),
          image: resolveAvatarUrl(payload.data.image, { allowBlob: true }) || "",
          sourceImage:
            resolveAvatarUrl(payload.data.sourceImage, { allowBlob: true }) || "",
        };
      } catch (error) {
        console.warn("Case study preview fetch failed:", error);
        return null;
      }
    },
    [authFetch],
  );

  const caseStudyCards = useMemo(() => {
    const rawCaseStudies =
      Array.isArray(serviceDraft?.caseStudies) && serviceDraft.caseStudies.length > 0
        ? serviceDraft.caseStudies
        : serviceDraft?.caseStudy && typeof serviceDraft.caseStudy === "object"
          ? [serviceDraft.caseStudy]
          : [];

    return rawCaseStudies
      .map((caseStudy, index) => ({
        id: String(caseStudy?.id || "").trim() || `case-study-${index + 1}`,
        order: index + 1,
        title: String(caseStudy?.title || "").trim(),
        description: String(caseStudy?.description || "").trim(),
        niche: String(caseStudy?.niche || "").trim(),
        role: String(caseStudy?.role || "").trim(),
        timeline: toDisplayName(caseStudy?.timeline),
        budget: formatCaseStudyBudget(caseStudy?.budget),
        projectLink: normalizeProjectLinkValue(caseStudy?.projectLink),
        projectFileName: String(caseStudy?.projectFile?.name || "").trim(),
      }))
      .filter((caseStudy) =>
        [
          caseStudy.title,
          caseStudy.description,
          caseStudy.niche,
          caseStudy.role,
          caseStudy.timeline,
          caseStudy.budget,
          caseStudy.projectLink,
          caseStudy.projectFileName,
        ].some((entry) => hasMeaningfulValue(entry)),
      );
  }, [serviceDraft?.caseStudies, serviceDraft?.caseStudy]);

  const caseStudyPreviewLinks = useMemo(
    () =>
      Array.from(
        new Set(caseStudyCards.map((caseStudy) => caseStudy.projectLink).filter(Boolean)),
      ),
    [caseStudyCards],
  );

  useEffect(() => {
    if (!caseStudyPreviewLinks.length || typeof authFetch !== "function") {
      return undefined;
    }

    const cachedEntries = {};
    const linksToFetch = [];

    caseStudyPreviewLinks.forEach((link) => {
      const cacheKey = toCaseStudyPreviewKey(link);
      if (!cacheKey) {
        return;
      }

      if (CASE_STUDY_PREVIEW_CACHE.has(cacheKey)) {
        const cachedPreview = CASE_STUDY_PREVIEW_CACHE.get(cacheKey);
        if (cachedPreview) {
          cachedEntries[cacheKey] = cachedPreview;
        }
        return;
      }

      if (caseStudyPreviewRequestsRef.current.has(cacheKey)) {
        return;
      }

      caseStudyPreviewRequestsRef.current.add(cacheKey);
      linksToFetch.push(link);
    });

    if (Object.keys(cachedEntries).length > 0) {
      setCaseStudyPreviewMap((current) => ({ ...current, ...cachedEntries }));
    }

    if (!linksToFetch.length) {
      return undefined;
    }

    let cancelled = false;

    const loadCaseStudyPreviews = async () => {
      const previewEntries = await Promise.all(
        linksToFetch.map(async (link) => {
          const preview = await fetchCaseStudyPreview(link);
          return [toCaseStudyPreviewKey(link), preview];
        }),
      );

      previewEntries.forEach(([cacheKey, preview]) => {
        if (!cacheKey) {
          return;
        }

        CASE_STUDY_PREVIEW_CACHE.set(cacheKey, preview || null);
        caseStudyPreviewRequestsRef.current.delete(cacheKey);
      });

      if (cancelled) {
        return;
      }

      setCaseStudyPreviewMap((current) => {
        const nextState = { ...current };

        previewEntries.forEach(([cacheKey, preview]) => {
          if (cacheKey && preview) {
            nextState[cacheKey] = preview;
          }
        });

        return nextState;
      });
    };

    void loadCaseStudyPreviews();

    return () => {
      cancelled = true;
    };
  }, [authFetch, caseStudyPreviewLinks, fetchCaseStudyPreview]);

  const resolvedCaseStudyCards = useMemo(
    () =>
      caseStudyCards.map((caseStudy) => {
        const previewKey = toCaseStudyPreviewKey(caseStudy.projectLink);
        const preview = previewKey ? caseStudyPreviewMap[previewKey] : null;
        const projectHost = getProjectHostLabel(caseStudy.projectLink);
        const displayTitle = caseStudy.title || `Project ${caseStudy.order}`;

        return {
          ...caseStudy,
          displayTitle,
          projectHost,
          previewImage:
            resolveAvatarUrl(preview?.image, { allowBlob: true }) ||
            resolveAvatarUrl(preview?.sourceImage, { allowBlob: true }) ||
            "",
          previewTitle: String(preview?.title || "").trim(),
          previewDescription: String(preview?.description || "").trim(),
          previewInitials: getInitials(
            caseStudy.title || caseStudy.niche || projectHost || serviceName,
            serviceName.charAt(0).toUpperCase() || "P",
          ),
        };
      }),
    [caseStudyCards, caseStudyPreviewMap, serviceName],
  );

  const experienceLabel =
    EXPERIENCE_LABELS[serviceInfoForm?.experience] || "Not selected";

  const deliveryLabel =
    DELIVERY_TIMELINE_LABELS[servicePricingForm?.deliveryTimeline] || "Not selected";
  const startingPriceDisplay = resolveStartingPriceDisplay(
    servicePricingForm?.priceRange,
  );

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col items-center">
      <div className="w-full space-y-8">
        <div className="text-center">
          <h1 className="text-balance text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl lg:text-[3.1rem] lg:leading-[1.04]">
            <span>Final </span>
            <span className="text-primary">Review</span>
            <span> Before </span>
            <span className="text-primary">Submission</span>
          </h1>
        </div>

        <div className="w-full">
          <ServiceInfoStepper
            activeStepId="preview"
            onStepChange={onServiceStepChange}
          />
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.58fr)_300px] xl:grid-cols-[minmax(0,1.62fr)_332px]">
          <article className="space-y-7">
            <div className="space-y-3">
              <div className="space-y-2">
                <h2 className="text-balance text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                  {reviewTitle}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-full border border-white/10 bg-white/8 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
                  {profilePhotoPreview?.url ? (
                    <img
                      src={profilePhotoPreview.url}
                      alt={`${serviceName} profile`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-white/72">
                      {avatarFallbackInitial}
                    </div>
                  )}
                </div>

                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-white">{freelancerName}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/38">
                    {serviceName}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="group relative overflow-hidden rounded-[30px] border border-white/8 bg-[#0d0d0d] shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
                {mediaPreview?.url ? (
                  <img
                    src={mediaPreview.url}
                    alt={`${serviceName} preview`}
                    className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-[1.015]"
                  />
                ) : (
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(255,214,10,0.12),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.06),transparent_22%),linear-gradient(135deg,#090909,#131313_55%,#111111)]">
                    <div className="absolute inset-y-0 left-[30%] w-px bg-white/10" />
                    <div className="absolute inset-y-0 right-[30%] w-px bg-white/10" />
                    <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/35 shadow-[0_0_60px_rgba(250,204,21,0.1)]" />
                    <div className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/12" />
                    <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/25" />
                    <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.78))]" />
                    <div className="absolute inset-x-6 top-6 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 backdrop-blur-sm">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                        Visual Preview
                      </p>
                      <p className="mt-2 max-w-sm text-sm text-white/65">
                        Add service images in the media step to replace this placeholder.
                      </p>
                    </div>
                  </div>
                )}

                {hasMultipleMediaPreviews ? (
                  <>
                    <button
                      type="button"
                      onClick={handlePreviousMediaPreview}
                      className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-black/55 text-white/90 backdrop-blur-md transition-colors hover:border-white/20 hover:bg-black/70"
                      aria-label="Show previous image"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={handleNextMediaPreview}
                      className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-black/55 text-white/90 backdrop-blur-md transition-colors hover:border-white/20 hover:bg-black/70"
                      aria-label="Show next image"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>

                    <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
                      <span className="rounded-full border border-white/12 bg-black/55 px-3 py-1 text-xs font-medium text-white/86 backdrop-blur-md">
                        {activeMediaPreviewIndex + 1} / {mediaPreviews.length}
                      </span>
                    </div>
                  </>
                ) : null}
              </div>

              <div className="space-y-1">
                <h3 className={SECTION_TITLE_CLASS}>
                  Description
                </h3>
                <p className={SECTION_BODY_CLASS}>
                  {description}
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <h3 className={SECTION_TITLE_CLASS}>
                    Case Studies
                  </h3>
                  <p className={SECTION_SUBTITLE_CLASS}>
                    Portfolio projects added in the case-study step.
                  </p>
                </div>

                {resolvedCaseStudyCards.length > 0 ? (
                  <div className="grid gap-4 xl:grid-cols-2">
                    {resolvedCaseStudyCards.map((caseStudy) => (
                      <article
                        key={caseStudy.id}
                        className="group overflow-hidden rounded-[28px] border border-white/8 bg-card shadow-[0_18px_54px_rgba(0,0,0,0.28)] transition-transform duration-300 hover:-translate-y-0.5 hover:border-white/12"
                      >
                        <div className="relative overflow-hidden border-b border-white/8">
                          {caseStudy.previewImage ? (
                            <>
                              <img
                                src={caseStudy.previewImage}
                                alt={`${caseStudy.displayTitle} preview`}
                                className="aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                              />
                              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.08)_0%,rgba(5,5,5,0.22)_38%,rgba(5,5,5,0.86)_100%)]" />
                            </>
                          ) : (
                            <div className="relative aspect-[16/9] w-full overflow-hidden bg-[radial-gradient(circle_at_18%_20%,rgba(250,204,21,0.2),transparent_26%),radial-gradient(circle_at_82%_12%,rgba(255,255,255,0.07),transparent_22%),linear-gradient(135deg,#0d0d0d,#131313_52%,#161616)]">
                              <div className="absolute inset-y-0 left-[26%] w-px bg-white/8" />
                              <div className="absolute inset-y-0 right-[26%] w-px bg-white/8" />
                              <div className="absolute left-6 top-6 flex h-20 w-20 items-center justify-center rounded-[24px] border border-white/10 bg-white/[0.06] shadow-[0_10px_40px_rgba(0,0,0,0.28)] backdrop-blur-sm">
                                <span className="text-2xl font-semibold tracking-[-0.08em] text-white">
                                  {caseStudy.previewInitials}
                                </span>
                              </div>
                              <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.82))]" />
                            </div>
                          )}

                          <div className="absolute left-5 right-5 top-5 flex items-start justify-between gap-3">
                            <span className="rounded-full border border-white/12 bg-black/45 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/78 backdrop-blur-md">
                              Case Study {caseStudy.order}
                            </span>

                            {caseStudy.niche ? (
                              <span className="max-w-[70%] truncate rounded-full border border-primary/25 bg-black/35 px-3 py-1 text-xs font-medium text-primary backdrop-blur-md">
                                {caseStudy.niche}
                              </span>
                            ) : null}
                          </div>

                          <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4">
                            <div className="min-w-0">
                              <h4 className="truncate text-2xl font-semibold tracking-[-0.04em] text-white">
                                {caseStudy.displayTitle}
                              </h4>
                              {caseStudy.projectHost ? (
                                <p className="mt-1 truncate text-xs font-medium uppercase tracking-[0.16em] text-white/58">
                                  {caseStudy.projectHost}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4 p-5">
                          <p
                            className="overflow-hidden text-sm leading-7 text-white/72"
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {caseStudy.description ||
                              caseStudy.previewDescription ||
                              "Add a short case study description in the case-study step to strengthen this service preview."}
                          </p>

                          <div className="flex flex-wrap gap-2">
                            {caseStudy.role ? (
                              <span className={CASE_STUDY_META_PILL_CLASS}>
                                {toDisplayName(caseStudy.role)}
                              </span>
                            ) : null}
                            {caseStudy.timeline ? (
                              <span className={CASE_STUDY_META_PILL_CLASS}>
                                {caseStudy.timeline}
                              </span>
                            ) : null}
                            {caseStudy.budget ? (
                              <span className={CASE_STUDY_META_PILL_CLASS}>
                                {caseStudy.budget}
                              </span>
                            ) : null}
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-4">
                            <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-white/58">
                              {caseStudy.projectFileName ? (
                                <span className="inline-flex min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/72">
                                  <FileText className="h-3.5 w-3.5 shrink-0" />
                                  <span className="max-w-[180px] truncate">
                                    {caseStudy.projectFileName}
                                  </span>
                                </span>
                              ) : null}
                            </div>

                            {caseStudy.projectLink ? (
                              <a
                                href={caseStudy.projectLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/85"
                              >
                                View project
                                <ArrowUpRight className="h-4 w-4" />
                              </a>
                            ) : (
                              <span className="text-xs font-medium uppercase tracking-[0.16em] text-white/32">
                                No project link
                              </span>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-[#151515] px-4 py-5 text-sm text-white/45">
                    Add at least one case study in the case-study step to show it here.
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <h3 className={SECTION_TITLE_CLASS}>
                    Skills Category
                  </h3>
                  <p className={SECTION_SUBTITLE_CLASS}>
                    The sub-categories clients will associate with this service.
                  </p>
                </div>

                {selectedCategoryLabels.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {selectedCategoryLabels.map((tag) => (
                      <PreviewTag key={tag} label={tag} variant="category" />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-[#151515] px-4 py-5 text-sm text-white/45">
                    Select at least one sub-category in the overview step to show it here.
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <h3 className={SECTION_TITLE_CLASS}>
                    Skills
                  </h3>
                  <p className={SECTION_SUBTITLE_CLASS}>
                    Skills grouped by sub-category for clear mapping.
                  </p>
                </div>

                {skillsBySubCategory.length > 0 ? (
                  <div className="space-y-4">
                    {skillsBySubCategory.map((group) => (
                      <div key={group.id} className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                          {group.label}
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          {group.skills.map((tag) => (
                            <PreviewTag key={`${group.id}-${tag}`} label={tag} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : skillTags.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {skillTags.map((tag) => (
                      <PreviewTag key={tag} label={tag} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-[#151515] px-4 py-5 text-sm text-white/45">
                    Add tools or custom skills in the overview step to populate this section.
                  </div>
                )}
              </div>
            </div>
          </article>

          <aside className="space-y-4">
            <div className="relative overflow-hidden rounded-[29px] border border-white/8 bg-card">
              <div className="absolute inset-0" />
              <section className="relative p-6">
                <p className={CARD_LABEL_CLASS}>Starting Price</p>
                <p className={CARD_VALUE_CLASS}>
                  {startingPriceDisplay.label}
                </p>
              </section>
            </div>

            <div className="space-y-3">
              <div className="rounded-[24px] border border-white/8 bg-card p-5 shadow-[0_16px_50px_rgba(0,0,0,0.28)]">
                <p className={CARD_LABEL_CLASS}>
                  Experience Level
                </p>
                <p className={CARD_VALUE_CLASS}>
                  {experienceLabel}
                </p>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-card p-5 shadow-[0_16px_50px_rgba(0,0,0,0.28)]">
                <p className={CARD_LABEL_CLASS}>
                  Delivery Timeline
                </p>
                <p className={CARD_VALUE_CLASS}>
                  {deliveryLabel}
                </p>
              </div>



              <div className="rounded-[24px] border border-white/8 bg-card p-5 shadow-[0_16px_50px_rgba(0,0,0,0.28)]">
                <p className={CARD_LABEL_CLASS}>
                  Positive Keywords
                </p>

                {keywordTags.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {keywordTags.slice(0, 5).map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/78"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className={CARD_VALUE_CLASS}>
                    Not selected
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default FreelancerServiceReviewSlide;
