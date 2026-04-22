import { useEffect, useMemo, useState } from "react";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Cloud from "lucide-react/dist/esm/icons/cloud";
import Code2 from "lucide-react/dist/esm/icons/code-2";
import Database from "lucide-react/dist/esm/icons/database";
import Globe from "lucide-react/dist/esm/icons/globe";
import Layers3 from "lucide-react/dist/esm/icons/layers-3";
import MapPinned from "lucide-react/dist/esm/icons/map-pinned";
import Smartphone from "lucide-react/dist/esm/icons/smartphone";
import Wallet from "lucide-react/dist/esm/icons/wallet";
import Wrench from "lucide-react/dist/esm/icons/wrench";

import { ServiceInfoStepper } from "./shared/ServiceInfoComponents";
import { API_BASE_URL } from "@/shared/lib/api-client";

const EXPERIENCE_LABELS = {
  entry: "0-1 Years",
  intermediate: "1-3 Years",
  experienced: "3-5 Years",
  expert: "5-10 Years",
  veteran: "10+ Years",
};

const COMPLEXITY_LABELS = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  expert: "Expert",
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

const PRICE_RANGE_LABELS = {
  under_5k: "Under ₹5,000",
  "5k_10k": "₹5,000 - ₹10,000",
  "5k_15k": "₹5,000 - ₹15,000",
  "15k_20k": "₹15,000 - ₹20,000",
  "15k_30k": "₹15,000 - ₹30,000",
  "30k_40k": "₹30,000 - ₹40,000",
  "30k_50k": "₹30,000 - ₹50,000",
  "50k_75k": "₹50,000 - ₹75,000",
  "50k_1l": "₹50,000 - ₹1,00,000",
  "1l_2l": "₹1,00,000 - ₹2,00,000",
  "1l_3l": "₹1,00,000 - ₹3,00,000",
  "3l_plus": "₹3,00,000+",
};

const SECTION_TITLE_CLASS =
  "text-2xl font-semibold tracking-[-0.03em] text-white";
const SECTION_SUBTITLE_CLASS = "text-sm text-white/48";
const SECTION_BODY_CLASS =
  "max-w-3xl text-sm leading-7 text-white/72 sm:text-base sm:leading-8";
const CARD_LABEL_CLASS = "text-[11px] uppercase tracking-[0.22em] text-white/38";
const CARD_SUBTEXT_CLASS = "text-xs leading-relaxed text-white/45";
const CARD_VALUE_CLASS = "mt-3 text-xl font-semibold tracking-[-0.03em] text-white";

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

const extractStartingPrice = (label = "") => {
  const normalized = String(label || "").trim();
  if (!normalized) {
    return "Custom Quote";
  }

  const [firstValue] = normalized.split(/\s*[-–—]\s*/);
  return firstValue || normalized;
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
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [toolOptionsByCategory, setToolOptionsByCategory] = useState({});
  const [activeMediaPreviewIndex, setActiveMediaPreviewIndex] = useState(0);
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
              selectedToolIds: Array.isArray(entry?.selectedToolIds)
                ? entry.selectedToolIds
                    .map((value) => toPositiveInteger(value))
                    .filter(Boolean)
                : [],
              customSkillNames: normalizeStringArray(entry?.customSkillNames),
            }))
            .filter((entry) => entry.subCategoryId)
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
    const pendingLabels = Array.isArray(serviceDraft?.pendingCategoryLabels)
      ? serviceDraft.pendingCategoryLabels
      : [];

    return normalizeStringArray(
      resolvedLabels.length > 0 ? resolvedLabels : pendingLabels,
    );
  }, [categoryOptions, selectedSubcategoryIds, serviceDraft?.pendingCategoryLabels]);

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
          id: subcategoryEntry.subCategoryId,
          label:
            categoryLabelById.get(subcategoryEntry.subCategoryId) ||
            `Sub-category ${subcategoryEntry.subCategoryId}`,
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

  const experienceLabel =
    EXPERIENCE_LABELS[serviceInfoForm?.experience] || "Not selected";
  const complexityLabel =
    COMPLEXITY_LABELS[serviceInfoForm?.complexity] || "Not selected";
  const deliveryLabel =
    DELIVERY_TIMELINE_LABELS[servicePricingForm?.deliveryTimeline] || "Flexible";
  const priceLabel =
    PRICE_RANGE_LABELS[servicePricingForm?.priceRange] || "Custom Quote";
  const startingPriceLabel = extractStartingPrice(priceLabel);

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
            <div className="relative overflow-hidden rounded-[29px] border border-white/8 bg-[#171717] shadow-[0_24px_80px_rgba(0,0,0,0.48)]">
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.01))]" />
              <section className="relative p-6">
                <div className="space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className={CARD_LABEL_CLASS}>Starting Price</p>
                      <p className={CARD_SUBTEXT_CLASS}>
                        Tailored to the scope of your service offering
                      </p>
                    </div>
                    <p className="text-right text-3xl font-semibold tracking-[-0.04em] text-white">
                      {startingPriceLabel}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="h-12 w-full rounded-full bg-primary px-5 text-sm font-semibold text-black transition-colors hover:bg-primary/90"
                  >
                    Continue ({startingPriceLabel})
                  </button>
                </div>
              </section>
            </div>

            <div className="space-y-3">
              <div className="rounded-[24px] border border-white/8 bg-[#141414] p-5 shadow-[0_16px_50px_rgba(0,0,0,0.28)]">
                <p className={CARD_LABEL_CLASS}>
                  Experience Level
                </p>
                <p className={CARD_VALUE_CLASS}>
                  {experienceLabel}
                </p>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-[#141414] p-5 shadow-[0_16px_50px_rgba(0,0,0,0.28)]">
                <p className={CARD_LABEL_CLASS}>
                  Delivery Timeline
                </p>
                <p className={CARD_VALUE_CLASS}>
                  {deliveryLabel}
                </p>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-[#141414] p-5 shadow-[0_16px_50px_rgba(0,0,0,0.28)]">
                <p className={CARD_LABEL_CLASS}>
                  Service Complexity
                </p>
                <p className={CARD_VALUE_CLASS}>
                  {complexityLabel}
                </p>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-[#141414] p-5 shadow-[0_16px_50px_rgba(0,0,0,0.28)]">
                <div className="flex items-start gap-4">
                  <div>
                    <p className={CARD_LABEL_CLASS}>
                      Positive Keywords
                    </p>
                    <p className={CARD_SUBTEXT_CLASS}>
                      Quick signals for search and matching.
                    </p>
                  </div>
                </div>

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
                  <p className="mt-4 text-sm text-white/42">
                    No keywords added yet.
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
