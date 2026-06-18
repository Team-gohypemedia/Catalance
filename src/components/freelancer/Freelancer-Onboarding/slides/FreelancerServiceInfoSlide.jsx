import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Check from "lucide-react/dist/esm/icons/check";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import X from "lucide-react/dist/esm/icons/x";

import { API_BASE_URL } from "@/shared/lib/api-client";
import { cn } from "@/shared/lib/utils";
import {
  ONBOARDING_FIELD_LABEL_CLASS,
  ONBOARDING_SERVICE_SKIP_BUTTON_CLASS,
} from "../typography";
import {
  deriveDraftSkillsAndTechnologies,
  getSubcategorySelectionKey,
  normalizeStringArray,
  syncDraftSubcategories,
} from "../service-details";
import {
  ServiceInfoStepper,
  CustomSelect,
  ServiceTitleTooltip,
} from "./shared/ServiceInfoComponents";
import CategoryMultiSelect from "./shared/CategoryComboSearch";
import { Button } from "@/components/ui/button";
import {
  applyServiceTemplate,
  DEFAULT_FREELANCER_ONBOARDING_CONTENT,
  resolveServiceInfoFields,
} from "@/shared/lib/freelancer-onboarding-content";
const ONBOARDING_SECTION_DESCRIPTION_CLASS = "text-base font-normal leading-7";

const EXPERIENCE_OPTIONS = [
  { value: "entry", label: "Entry Level (0â€“1 years)" },
  { value: "intermediate", label: "Intermediate (1â€“3 years)" },
  { value: "experienced", label: "Experienced (3â€“5 years)" },
  { value: "expert", label: "Expert (5â€“10 years)" },
  { value: "veteran", label: "Veteran (10+ years)" },
];

const SERVICE_TITLE_MAX = 80;

const toPositiveInteger = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const normalizeOptionEntries = (options = []) =>
  (Array.isArray(options) ? options : [])
    .map((option) => ({
      value: String(option?.value || "").trim(),
      label: String(option?.label || option?.value || "").trim(),
    }))
    .filter((option) => option.value && option.label);

const buildStringSignature = (values = []) => normalizeStringArray(values).join("|");
const buildIntegerSignature = (values = []) =>
  Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((value) => toPositiveInteger(value))
        .filter(Boolean),
    ),
  )
    .sort((left, right) => left - right)
    .join("|");
const normalizeSkillMatchKey = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const SERVICE_PLACEHOLDERS = {

  "influencer marketing": [
    "Influencer Growth Strategy",
    "Creator-Led Brand Growth",
    "Influencer Campaign Management",
    "Digital Creator Partnerships",
    "Influencer Activation Campaign",
  ],
  "website development": [
    "Build a modern Next.js web application",
    "Develop a custom e-commerce Shopify store",
    "Create a responsive business website in React",
  ],
  "web development": [
    "Build a modern Next.js web application",
    "Develop a custom e-commerce Shopify store",
    "Create a responsive business website in React",
  ],
  "app development": [
    "Develop a native iOS & Android App in Flutter",
    "Build a custom React Native mobile application",
    "Create a high-performance mobile app with Expo",
  ],
  "branding": [
    "Design a modern brand identity and logo",
    "Develop a complete corporate brand guidelines book",
    "Create a visual identity system for startup launch",
  ],
  "software development": [
    "Develop a custom SaaS platform with billing",
    "Build a secure REST API with Node.js and PostgreSQL",
    "Create a desktop app with Electron and React",
  ],
  "seo": [
    "Boost ranking with complete on-page SEO optimization",
    "Perform deep keyword research and competitor analysis",
    "Write SEO-friendly blog articles and content strategy",
  ],
  "social media management": [
    "Create a monthly social media content calendar",
    "Design engaging Instagram posts and stories template",
    "Manage community engagement and page growth",
  ],
};

const FreelancerServiceInfoSlide = ({
  currentService,
  currentServiceName,
  onboardingContent,
  serviceInfoFields = [],
  serviceDraft,
  serviceInfoForm,
  onServiceInfoFieldChange,
  onUpdateServiceDraft,
  onServiceStepChange,
  onSkipServices,
  serviceInfoValidationErrors = {},
  continueButton,
}) => {
  const serviceName = currentServiceName || "Service";
  const serviceInfoContent =
    onboardingContent?.serviceInfo ||
    DEFAULT_FREELANCER_ONBOARDING_CONTENT.serviceInfo;
  const stepperSteps =
    onboardingContent?.stepper?.steps ||
    DEFAULT_FREELANCER_ONBOARDING_CONTENT.stepper.steps;
  const resolvedFields = useMemo(() => {
    return Array.isArray(serviceInfoFields) && serviceInfoFields.length > 0
      ? serviceInfoFields
      : resolveServiceInfoFields(onboardingContent);
  }, [serviceInfoFields, onboardingContent]);
  const fieldMap = useMemo(() => {
    return Object.fromEntries(
      resolvedFields.map((field) => [field.id, field]),
    );
  }, [resolvedFields]);
  const experienceOptions =
    fieldMap.experience?.options ||
    serviceInfoContent?.fields?.experience?.options ||
    EXPERIENCE_OPTIONS;
  const configuredCategoryOptions = useMemo(
    () =>
      normalizeOptionEntries(
        fieldMap.categories?.options || serviceInfoContent?.fields?.categories?.options || [],
      ),
    [fieldMap.categories?.options, serviceInfoContent?.fields?.categories?.options],
  );
  const configuredSkillSuggestionsByCategory =
    fieldMap.categories?.skillSuggestionsByCategory ||
    serviceInfoContent?.fields?.categories?.skillSuggestionsByCategory ||
    {};
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [toolOptionsByCategory, setToolOptionsByCategory] = useState({});
  const [isToolsLoading, setIsToolsLoading] = useState(false);
  const [toolFetchError, setToolFetchError] = useState("");
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  
  const placeholders = useMemo(() => {
    const key = String(serviceName || "").toLowerCase().trim();
    return SERVICE_PLACEHOLDERS[key] || [
      fieldMap.title?.placeholder ||
      serviceInfoContent?.fields?.title?.placeholder ||
      "I will do something I'm really good at"
    ];
  }, [serviceName, fieldMap.title?.placeholder, serviceInfoContent?.fields?.title?.placeholder]);

  useEffect(() => {
    if (placeholders.length === 1) {
      setDisplayedPlaceholder(placeholders[0]);
      return;
    }

    let isMounted = true;
    let currentWordIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;
    let timer;

    const tick = () => {
      if (!isMounted) return;

      const currentWord = placeholders[currentWordIndex];
      
      if (!isDeleting) {
        setDisplayedPlaceholder(currentWord.substring(0, currentCharIndex + 1));
        currentCharIndex++;

        if (currentCharIndex === currentWord.length) {
          isDeleting = true;
          typingSpeed = 2000;
        } else {
          typingSpeed = 80;
        }
      } else {
        setDisplayedPlaceholder(currentWord.substring(0, currentCharIndex - 1));
        currentCharIndex--;

        if (currentCharIndex === 0) {
          isDeleting = false;
          currentWordIndex = (currentWordIndex + 1) % placeholders.length;
          typingSpeed = 500;
        } else {
          typingSpeed = 40;
        }
      }

      timer = setTimeout(tick, typingSpeed);
    };

    timer = setTimeout(tick, 500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [placeholders]);
  const toolOptionsCacheRef = useRef(new Map());
  const toolFetchRequestIdRef = useRef(0);

  const resolvedServiceId = toPositiveInteger(currentService?.id);
  const normalizedSubcategories = useMemo(
    () =>
      Array.isArray(serviceDraft?.subcategories)
        ? serviceDraft.subcategories
        : [],
    [serviceDraft?.subcategories],
  );
  const selectedCategoryKeys = useMemo(
    () =>
      normalizedSubcategories
        .map((entry) => getSubcategorySelectionKey(entry))
        .filter(Boolean),
    [normalizedSubcategories],
  );
  const selectedCatalogCategoryIds = useMemo(
    () =>
      Array.from(
        new Set(
          normalizedSubcategories
            .map((entry) => toPositiveInteger(entry?.subCategoryId))
            .filter(Boolean),
        ),
      ),
    [normalizedSubcategories],
  );
  const allCategoryOptions = useMemo(() => {
    return configuredCategoryOptions.length > 0 ? configuredCategoryOptions : categoryOptions;
  }, [categoryOptions, configuredCategoryOptions]);
  const activeSkillCategoryId = useMemo(() => {
    const requested = String(serviceDraft?.activeSkillCategory || "").trim();
    if (
      requested &&
      normalizedSubcategories.some((entry) => entry.subCategoryKey === requested)
    ) {
      return requested;
    }

    return normalizedSubcategories[0]?.subCategoryKey || "";
  }, [normalizedSubcategories, serviceDraft?.activeSkillCategory]);
  const derivedSkillsAndTechnologies = useMemo(
    () => deriveDraftSkillsAndTechnologies(serviceDraft, toolOptionsByCategory),
    [serviceDraft, toolOptionsByCategory],
  );
  const titleError = String(serviceInfoValidationErrors.title || "").trim();
  const categoryError = String(serviceInfoValidationErrors.category || "").trim();
  const skillsError = String(serviceInfoValidationErrors.skills || "").trim();
  const experienceError = String(serviceInfoValidationErrors.experience || "").trim();
  const customServiceInfoFields = resolvedFields.filter(
    (field) => !["title", "categories", "experience"].includes(field.id) && field.visible !== false,
  );

  useEffect(() => {
    if (configuredCategoryOptions.length > 0) {
      setCategoryOptions(configuredCategoryOptions);
      setIsCategoriesLoading(false);
      return undefined;
    }

    if (!resolvedServiceId) {
      setCategoryOptions([]);
      setIsCategoriesLoading(false);
      return undefined;
    }

    let cancelled = false;

    const fetchSubCategories = async () => {
      try {
        setIsCategoriesLoading(true);
        const response = await fetch(
          `${API_BASE_URL}/marketplace/filters/sub-categories?serviceId=${resolvedServiceId}`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch sub-categories");
        }

        const payload = await response.json();
        const nextCategoryOptions = (Array.isArray(payload?.data) ? payload.data : [])
          .map((entry) => ({
            value: getSubcategorySelectionKey({ subCategoryId: entry?.id }),
            label: String(entry?.name || "").trim(),
            isCustom: false,
            subCategoryId: entry?.id,
          }))
          .filter((entry) => entry.value && entry.label);

        if (!cancelled) {
          setCategoryOptions(nextCategoryOptions);
        }
      } catch {
        if (!cancelled) {
          setCategoryOptions([]);
        }
      } finally {
        if (!cancelled) {
          setIsCategoriesLoading(false);
        }
      }
    };

    void fetchSubCategories();
    return () => {
      cancelled = true;
    };
  }, [configuredCategoryOptions, resolvedServiceId]);

  useEffect(() => {
    if (configuredCategoryOptions.length > 0) {
      return undefined;
    }

    if (!normalizedSubcategories.some((entry) => entry?.isCustom)) {
      return undefined;
    }

    onUpdateServiceDraft((draft) => ({
      ...draft,
      subcategories: (Array.isArray(draft.subcategories) ? draft.subcategories : []).filter(
        (entry) => !entry?.isCustom && toPositiveInteger(entry?.subCategoryId),
      ),
      pendingCategoryLabels: [],
    }));
  }, [configuredCategoryOptions, normalizedSubcategories, onUpdateServiceDraft]);

  useEffect(() => {
    if (configuredCategoryOptions.length > 0) {
      setToolOptionsByCategory({});
      setToolFetchError("");
      setIsToolsLoading(false);
      return undefined;
    }

    const selectedIds = selectedCatalogCategoryIds;
    toolFetchRequestIdRef.current += 1;
    const requestId = toolFetchRequestIdRef.current;
    const abortController = new AbortController();

    if (!selectedIds.length) {
      setToolOptionsByCategory({});
      setToolFetchError("");
      setIsToolsLoading(false);
      return () => {
        abortController.abort();
      };
    }

    const cachedToolOptionsByCategory = {};
    const idsToFetch = [];

    selectedIds.forEach((subCategoryId) => {
      const cacheKey = String(subCategoryId);
      if (toolOptionsCacheRef.current.has(cacheKey)) {
        cachedToolOptionsByCategory[cacheKey] =
          toolOptionsCacheRef.current.get(cacheKey) || [];
      } else {
        idsToFetch.push(subCategoryId);
      }
    });

    setToolFetchError("");
    setToolOptionsByCategory(cachedToolOptionsByCategory);
    setIsToolsLoading(idsToFetch.length > 0);

    if (!idsToFetch.length) {
      return () => {
        abortController.abort();
      };
    }

    const fetchTools = async () => {
      const settledResults = await Promise.allSettled(
        idsToFetch.map(async (subCategoryId) => {
          const response = await fetch(
            `${API_BASE_URL}/marketplace/filters/tools?subCategoryId=${subCategoryId}`,
            { signal: abortController.signal },
          );
          if (!response.ok) {
            throw new Error("Failed to fetch tools");
          }

          const payload = await response.json();
          const options = (Array.isArray(payload?.data) ? payload.data : [])
            .map((entry) => ({
              id: toPositiveInteger(entry?.id),
              subCategoryId,
              name: String(entry?.name || "").trim(),
              label: String(entry?.name || "").trim(),
            }))
            .filter((entry) => entry.id && entry.label);

          toolOptionsCacheRef.current.set(String(subCategoryId), options);
          return [String(subCategoryId), options];
        }),
      );

      if (abortController.signal.aborted || requestId !== toolFetchRequestIdRef.current) {
        return;
      }

      const nextToolOptionsByCategory = { ...cachedToolOptionsByCategory };
      let hasAnySkills = Object.values(nextToolOptionsByCategory).some(
        (options) => Array.isArray(options) && options.length > 0,
      );
      let hadFailure = false;

      settledResults.forEach((result) => {
        if (result.status === "fulfilled") {
          const [subCategoryKey, options] = result.value;
          nextToolOptionsByCategory[subCategoryKey] = options;
          if (Array.isArray(options) && options.length > 0) {
            hasAnySkills = true;
          }
          return;
        }

        if (result.reason?.name !== "AbortError") {
          hadFailure = true;
        }
      });

      setToolOptionsByCategory(nextToolOptionsByCategory);
      setToolFetchError(
        hadFailure && !hasAnySkills ? "Unable to load skills right now." : "",
      );
    };

    void fetchTools().finally(() => {
      if (!abortController.signal.aborted && requestId === toolFetchRequestIdRef.current) {
        setIsToolsLoading(false);
      }
    });

    return () => {
      abortController.abort();
    };
  }, [configuredCategoryOptions, selectedCatalogCategoryIds]);

  useEffect(() => {
    const currentSkillsSignature = buildStringSignature(
      serviceDraft?.skillsAndTechnologies,
    );
    const nextSkillsSignature = buildStringSignature(derivedSkillsAndTechnologies);

    if (currentSkillsSignature === nextSkillsSignature) {
      return;
    }

    onUpdateServiceDraft((draft) => ({
      ...draft,
      skillsAndTechnologies: derivedSkillsAndTechnologies,
    }));
  }, [
    derivedSkillsAndTechnologies,
    onUpdateServiceDraft,
    serviceDraft?.skillsAndTechnologies,
  ]);

  useEffect(() => {
    if (!normalizedSubcategories.length) {
      return;
    }

    const normalizedToolOptionsByCategory = Object.fromEntries(
      Object.entries(toolOptionsByCategory || {}).map(([key, options]) => [
        String(key),
        Array.isArray(options) ? options : [],
      ]),
    );

    let hasAnyMappingChange = false;

    const nextSubcategories = normalizedSubcategories.map((entry) => {
      const subCategoryId = toPositiveInteger(entry?.subCategoryId);
      if (!subCategoryId) {
        return entry;
      }

      const toolOptions = normalizedToolOptionsByCategory[String(subCategoryId)] || [];
      if (!toolOptions.length) {
        return entry;
      }

      const toolIdByName = new Map();
      const toolIdByLooseName = new Map();

      toolOptions.forEach((tool) => {
        const toolLabel = String(tool?.label || tool?.name || "").trim();
        const toolId = toPositiveInteger(tool?.id);
        if (!toolId || !toolLabel) {
          return;
        }

        toolIdByName.set(toolLabel.toLowerCase(), toolId);
        toolIdByLooseName.set(normalizeSkillMatchKey(toolLabel), toolId);
      });

      const currentToolIds = Array.isArray(entry?.selectedToolIds)
        ? entry.selectedToolIds.map((value) => toPositiveInteger(value)).filter(Boolean)
        : [];
      const currentCustomSkillNames = normalizeStringArray(entry?.customSkillNames);
      const nextToolIds = [...currentToolIds];
      const remainingCustomSkillNames = [];

      currentCustomSkillNames.forEach((skillName) => {
        const normalizedSkillName = String(skillName || "").trim();
        const matchingToolId =
          toolIdByName.get(normalizedSkillName.toLowerCase()) ||
          toolIdByLooseName.get(normalizeSkillMatchKey(normalizedSkillName));
        if (matchingToolId) {
          if (!nextToolIds.includes(matchingToolId)) {
            nextToolIds.push(matchingToolId);
          }
          hasAnyMappingChange = true;
          return;
        }

        remainingCustomSkillNames.push(skillName);
      });

      if (
        buildIntegerSignature(currentToolIds) === buildIntegerSignature(nextToolIds) &&
        buildStringSignature(currentCustomSkillNames) === buildStringSignature(remainingCustomSkillNames)
      ) {
        return entry;
      }

      return {
        ...entry,
        selectedToolIds: nextToolIds,
        customSkillNames: remainingCustomSkillNames,
      };
    });

    if (!hasAnyMappingChange) {
      return;
    }

    onUpdateServiceDraft((draft) => ({
      ...draft,
      subcategories: nextSubcategories,
    }));
  }, [normalizedSubcategories, onUpdateServiceDraft, toolOptionsByCategory]);

  const handleSelectedCategoriesChange = (nextValues) => {
    if (configuredCategoryOptions.length > 0) {
      const normalizedNextValues = normalizeStringArray(nextValues);
      const labelByValue = new Map(
        configuredCategoryOptions.map((option) => [option.value, option.label]),
      );

      onUpdateServiceDraft((draft) => {
        const existingSubcategories = Array.isArray(draft?.subcategories) ? draft.subcategories : [];
        const existingByKey = new Map(
          existingSubcategories.map((entry) => [getSubcategorySelectionKey(entry), entry]),
        );
        const nextSubcategories = normalizedNextValues.map((value) => {
          const existingEntry = existingByKey.get(value);
          return {
            subCategoryId: null,
            subCategoryKey: value,
            label: labelByValue.get(value) || existingEntry?.label || value,
            isCustom: true,
            selectedToolIds: [],
            customSkillNames: normalizeStringArray(existingEntry?.customSkillNames),
          };
        });

        return {
          ...draft,
          subcategories: nextSubcategories,
          activeSkillCategory: nextSubcategories.some(
            (entry) => entry.subCategoryKey === draft?.activeSkillCategory,
          )
            ? draft.activeSkillCategory
            : nextSubcategories[0]?.subCategoryKey || null,
        };
      });
      return;
    }

    onUpdateServiceDraft((draft) => syncDraftSubcategories(draft, nextValues));
  };

  const handleSubcategorySkillChange = (subCategoryKey, nextSelection = {}) => {
    if (configuredCategoryOptions.length > 0) {
      const normalizedCustomSkills = normalizeStringArray(
        Array.isArray(nextSelection?.customSkillNames) ? nextSelection.customSkillNames : [],
      );

      onUpdateServiceDraft((draft) => ({
        ...draft,
        subcategories: (Array.isArray(draft.subcategories) ? draft.subcategories : []).map(
          (entry) =>
            entry?.subCategoryKey === subCategoryKey
              ? {
                  ...entry,
                  selectedToolIds: [],
                  customSkillNames: normalizedCustomSkills,
                }
              : entry,
        ),
      }));
      return;
    }

    const normalizedToolIds = normalizeStringArray(
      Array.isArray(nextSelection?.selectedToolIds)
        ? nextSelection.selectedToolIds
        : [],
    )
      .map((value) => toPositiveInteger(value))
      .filter(Boolean);
    const normalizedCustomSkills = normalizeStringArray(
      Array.isArray(nextSelection?.customSkillNames)
        ? nextSelection.customSkillNames
        : [],
    );

    onUpdateServiceDraft((draft) => ({
      ...draft,
      subcategories: (Array.isArray(draft.subcategories) ? draft.subcategories : []).map(
        (entry) => {
          if (entry?.subCategoryKey !== subCategoryKey) {
            return entry;
          }

          return {
            ...entry,
            selectedToolIds: normalizedToolIds,
            customSkillNames: normalizedCustomSkills,
          };
        },
      ),
    }));
  };

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col items-center">
      <div className="w-full space-y-8">
        <div className="text-center">
          <h1 className="text-xl md:text-4xl lg:text-5xl font-medium">
            {applyServiceTemplate(
              serviceInfoContent?.headingTitleTemplate,
              serviceName,
            )}
          </h1>
        </div>

        <div className="mx-auto w-full max-w-3xl">
          <ServiceInfoStepper
            activeStepId="overview"
            onStepChange={onServiceStepChange}
            steps={stepperSteps}
          />
        </div>

        <div className="mx-auto w-full max-w-3xl space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h2 className="text-lg sm:text-xl md:text-2xl font-medium text-foreground">
                {serviceInfoContent?.sectionTitle || "Add service info"}
              </h2>
              <p className={cn(ONBOARDING_SECTION_DESCRIPTION_CLASS, "text-muted-foreground")}>
                {serviceInfoContent?.sectionDescription ||
                  "Enter details of your service"}
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onSkipServices?.()}
              disabled={false}
              className={cn(
                ONBOARDING_SERVICE_SKIP_BUTTON_CLASS,
                "self-start px-3 py-2 text-sm sm:px-6 sm:py-0 sm:text-base",
              )}
            >
              Skip
            </Button>
          </div>

          <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <div className="space-y-0">
              {fieldMap.title?.visible === false ? null : (
              <>
              <div className="mb-1 flex items-center gap-2">
                <label
                  className={ONBOARDING_FIELD_LABEL_CLASS}
                  htmlFor="service-title-input"
                >
                  {fieldMap.title?.label || serviceInfoContent?.fields?.title?.label || "Service Title"}
                </label>
                <ServiceTitleTooltip
                  message={serviceInfoContent?.serviceTitleTooltip}
                />
              </div>
              <div className="relative">
                <input
                  id="service-title-input"
                  type="text"
                  value={serviceInfoForm.title}
                  onChange={(event) => {
                    if (event.target.value.length <= SERVICE_TITLE_MAX) {
                      onServiceInfoFieldChange("title", event.target.value);
                    }
                  }}
                  placeholder={displayedPlaceholder}
                  className={cn(
                    "h-10 w-full rounded-xl border bg-card px-4 !pr-24 !text-[14px] !leading-5 text-foreground outline-none transition-colors placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground/50 placeholder:font-normal [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 [&::placeholder]:font-normal focus:ring-1",
                    titleError
                      ? "border-destructive/70 focus:border-destructive/60 focus:ring-destructive/20"
                      : "border-border focus:border-primary/50 focus:ring-primary/20",
                  )}
                  aria-invalid={Boolean(titleError)}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/50">
                  {serviceInfoForm.title.length} / {SERVICE_TITLE_MAX} MAX
                </span>
              </div>
              {titleError ? (
                <p className="mt-1 text-sm text-destructive">{titleError}</p>
              ) : null}
              </>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {fieldMap.categories?.visible === false ? null : (
              <div className="space-y-0">
              <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
                {fieldMap.categories?.label || serviceInfoContent?.fields?.categories?.label || "Select Category"}
              </label>
              <CategoryMultiSelect
                selected={selectedCategoryKeys}
                onChange={handleSelectedCategoriesChange}
                options={allCategoryOptions}
                placeholder={
                  isCategoriesLoading
                    ? "Loading..."
                    : fieldMap.categories?.placeholder ||
                      serviceInfoContent?.fields?.categories?.placeholder ||
                      "Search here"
                }
                searchPlaceholder={
                  fieldMap.categories?.searchPlaceholder ||
                  serviceInfoContent?.fields?.categories?.searchPlaceholder ||
                  "Search here"
                }
                isLoading={isCategoriesLoading}
                hasError={Boolean(categoryError)}
                activeCategoryKey={activeSkillCategoryId}
                onActiveCategoryChange={(value) =>
                  onUpdateServiceDraft((draft) => ({
                    ...draft,
                    activeSkillCategory: value || null,
                  }))
                }
                selectedSubcategories={normalizedSubcategories}
                toolOptionsByCategory={toolOptionsByCategory}
                skillSuggestionsByCategory={configuredSkillSuggestionsByCategory}
                onSubcategorySkillChange={handleSubcategorySkillChange}
                isToolsLoading={isToolsLoading}
                toolFetchError={toolFetchError}
              />
              {categoryError ? (
                <p className="mt-1 text-sm text-destructive">{categoryError}</p>
              ) : null}
              {skillsError ? (
                <p className="mt-1 text-sm text-destructive">{skillsError}</p>
              ) : null}
              </div>
              )}

              {fieldMap.experience?.visible === false ? null : (
              <div className="space-y-0">
              <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
                {fieldMap.experience?.label || serviceInfoContent?.fields?.experience?.label || "Experience"}
              </label>
              <CustomSelect
                value={serviceInfoForm.experience}
                onChange={(value) => onServiceInfoFieldChange("experience", value)}
                options={experienceOptions}
                placeholder={
                  fieldMap.experience?.placeholder ||
                  serviceInfoContent?.fields?.experience?.placeholder ||
                  "Select experience level"
                }
                hasError={Boolean(experienceError)}
                className="h-10"
              />
              {experienceError ? (
                <p className="mt-1 text-sm text-destructive">{experienceError}</p>
              ) : null}
              </div>
              )}
            </div>

            {/* {customServiceInfoFields.map((field) => {
              const customValue = serviceDraft?.customFields?.serviceInfo?.[field.id] ?? "";
              const customError = String(serviceInfoValidationErrors[field.id] || "").trim();
              const isSelect = field.type === "select";
              const isMulti = field.type === "multiselect";

              if (isSelect || isMulti) {
                return (
                  <div key={field.id} className="space-y-0">
                    <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
                      {field.label}
                    </label>
                    <CustomSelect
                      value={customValue}
                      onChange={(value) => onServiceInfoFieldChange(field.id, value)}
                      options={field.options || []}
                      placeholder={field.placeholder || "Select option"}
                      isSearchable={Boolean(field.searchPlaceholder)}
                      searchPlaceholder={field.searchPlaceholder || "Search here"}
                      hasError={Boolean(customError)}
                      className="h-10"
                    />
                    {customError ? (
                      <p className="mt-1 text-sm text-destructive">{customError}</p>
                    ) : null}
                  </div>
                );
              }

              if (field.type === "textarea") {
                return (
                  <div key={field.id} className="space-y-0">
                    <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
                      {field.label}
                    </label>
                    <textarea
                      value={customValue}
                      onChange={(event) => onServiceInfoFieldChange(field.id, event.target.value)}
                      placeholder={field.placeholder || ""}
                      rows={4}
                      className={cn(
                        "w-full resize-none rounded-xl border bg-card px-4 py-3 !text-[14px] !leading-5 text-foreground outline-none transition-colors placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 focus:ring-1",
                        customError
                          ? "border-destructive/70 focus:border-destructive/60 focus:ring-destructive/20"
                          : "border-border focus:border-primary/50 focus:ring-primary/20",
                      )}
                    />
                    {customError ? (
                      <p className="mt-1 text-sm text-destructive">{customError}</p>
                    ) : null}
                  </div>
                );
              }

              return (
                <div key={field.id} className="space-y-0">
                  <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={customValue}
                    onChange={(event) => onServiceInfoFieldChange(field.id, event.target.value)}
                    placeholder={field.placeholder || ""}
                    className={cn(
                      "h-10 w-full rounded-xl border bg-card px-4 !text-[14px] !leading-5 text-foreground outline-none transition-colors placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 focus:ring-1",
                      customError
                        ? "border-destructive/70 focus:border-destructive/60 focus:ring-destructive/20"
                        : "border-border focus:border-primary/50 focus:ring-primary/20",
                    )}
                  />
                  {customError ? (
                    <p className="mt-1 text-sm text-destructive">{customError}</p>
                  ) : null}
                </div>
              );
            })} */}


          </div>
        </div>
      </div>

      {continueButton}
    </section>
  );
};

export default FreelancerServiceInfoSlide;
