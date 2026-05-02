import { useEffect, useMemo, useRef, useState } from "react";
import Check from "lucide-react/dist/esm/icons/check";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import X from "lucide-react/dist/esm/icons/x";

import { API_BASE_URL } from "@/shared/lib/api-client";
import { cn } from "@/shared/lib/utils";
import { ONBOARDING_FIELD_LABEL_CLASS } from "../typography";
import {
  deriveDraftSkillsAndTechnologies,
  getSubcategorySelectionKey,
  normalizeStringArray,
  syncDraftSubcategories,
} from "../service-details";
import {
  ServiceInfoStepper,
  CustomSelect,
} from "./shared/ServiceInfoComponents";
import { Button } from "@/components/ui/button";
const ONBOARDING_SECTION_DESCRIPTION_CLASS = "text-base font-normal leading-7";

const EXPERIENCE_OPTIONS = [
  { value: "entry", label: "Entry Level (0–1 years)" },
  { value: "intermediate", label: "Intermediate (1–3 years)" },
  { value: "experienced", label: "Experienced (3–5 years)" },
  { value: "expert", label: "Expert (5–10 years)" },
  { value: "veteran", label: "Veteran (10+ years)" },
];

const SERVICE_TITLE_MAX = 80;

const toPositiveInteger = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const buildNumberSignature = (values = []) =>
  values
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0)
    .join("|");

const buildStringSignature = (values = []) => normalizeStringArray(values).join("|");
const buildToolSelectionKey = (subCategoryId, toolId) => {
  const normalizedSubCategoryId = toPositiveInteger(subCategoryId);
  const normalizedToolId = toPositiveInteger(toolId);
  if (!normalizedSubCategoryId || !normalizedToolId) {
    return "";
  }
  return `${normalizedSubCategoryId}:${normalizedToolId}`;
};

const parseToolSelectionKey = (value = "") => {
  const normalizedValue = String(value || "").trim();
  const matched = normalizedValue.match(/^(\d+):(\d+)$/);
  if (!matched) {
    return null;
  }

  const subCategoryId = toPositiveInteger(matched[1]);
  const toolId = toPositiveInteger(matched[2]);
  if (!subCategoryId || !toolId) {
    return null;
  }

  return { subCategoryId, toolId };
};

const CategoryMultiSelect = ({
  options = [],
  selected = [],
  onChange,
  placeholder = "Select sub-categories",
  searchPlaceholder = "Search sub-categories",
  isLoading = false,
  closeOnSelect = false,
  hasError = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  const normalizedSelected = useMemo(
    () =>
      Array.isArray(selected)
        ? selected.map((value) => String(value || "").trim()).filter(Boolean)
        : [],
    [selected],
  );

  const selectedSet = useMemo(
    () => new Set(normalizedSelected),
    [normalizedSelected],
  );

  const selectedOptions = useMemo(
    () => options.filter((option) => selectedSet.has(String(option.value))),
    [options, selectedSet],
  );
  const getSelectedOptionLabel = (option) =>
    String(option?.selectedLabel || option?.label || "").trim();
  const filteredOptions = useMemo(() => {
    const normalizedQuery = String(searchQuery || "").trim().toLowerCase();
    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) =>
      String(option?.label || "")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [options, searchQuery]);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const frameId = requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    return () => cancelAnimationFrame(frameId);
  }, [isOpen]);

  const toggleOption = (optionValue) => {
    const normalizedValue = String(optionValue);
    if (selectedSet.has(normalizedValue)) {
      onChange(normalizedSelected.filter((value) => value !== normalizedValue));
      if (closeOnSelect) {
        setIsOpen(false);
      }
      return;
    }

    onChange([...normalizedSelected, normalizedValue]);
    if (closeOnSelect) {
      setIsOpen(false);
    }
  };

  const removeOption = (optionValue) => {
    const normalizedValue = String(optionValue);
    onChange(normalizedSelected.filter((value) => value !== normalizedValue));
  };

  const summaryText = useMemo(
    () => (isLoading ? "Loading..." : placeholder),
    [isLoading, placeholder],
  );

  return (
    <div className="space-y-3">
      <div className="relative" ref={containerRef}>
        {isOpen ? (
          <div
            className={cn(
              "flex h-12 w-full items-center gap-3 rounded-xl border bg-card px-4 !text-[14px] !leading-5 ring-1",
              hasError
                ? "border-destructive/70 ring-destructive/20"
                : "border-white/15 ring-white/10",
            )}
          >
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-full flex-1 bg-transparent !text-[14px] !leading-5 text-white outline-none placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5"
            />
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full text-primary/80 transition-colors hover:bg-primary/10 hover:text-primary"
              aria-label="Close sub-category search"
            >
              <ChevronDown className="h-4 w-4 rotate-180" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className={cn(
              "flex h-12 w-full items-center justify-between rounded-xl border bg-card px-4 !text-[14px] !leading-5 transition-colors focus:ring-1",
              hasError
                ? "border-destructive/70 text-white focus:border-destructive/60 focus:ring-destructive/20"
                : selectedOptions.length > 0
                  ? "border-white/10 text-white focus:border-white/20 focus:ring-white/10"
                  : "border-white/10 text-muted-foreground focus:border-white/20 focus:ring-white/10",
            )}
            aria-invalid={hasError}
          >
            <span className="truncate text-left">{summaryText}</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                selectedOptions.length > 0 ? "text-white/60" : "text-white/40"
              }`}
            />
          </button>
        )}

        {isOpen && (
          <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-white/10 bg-card shadow-xl shadow-black/40">
            <div className="max-h-56 overflow-y-auto">
              {options.length === 0 ? (
                <div className="px-4 py-3 text-sm text-white/40">
                  No sub-categories available
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-white/40">
                  No matching sub-categories
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = selectedSet.has(String(option.value));
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleOption(option.value)}
                      className={`mx-2 my-1 flex w-[calc(100%-1rem)] items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                        isSelected
                          ? "border-white/10 bg-accent text-white"
                          : "border-transparent text-white/80 hover:border-white/8 hover:bg-white/5"
                      }`}
                    >
                      <span className="font-medium">{option.label}</span>
                      {isSelected ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/25 bg-accent text-white">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map((option) => (
            <span
              key={option.value}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-card px-3 py-1.5 text-sm font-medium text-white"
            >
              {getSelectedOptionLabel(option)}
              <button
                type="button"
                onClick={() => removeOption(option.value)}
                className="rounded-full p-0.5 transition-colors hover:bg-white/10"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const FreelancerServiceInfoSlide = ({
  currentService,
  currentServiceName,
  serviceDraft,
  serviceInfoForm,
  onServiceInfoFieldChange,
  onUpdateServiceDraft,
  onServiceStepChange,
  onSkipServices,
  serviceInfoValidationErrors = {},
}) => {
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [toolOptionsByCategory, setToolOptionsByCategory] = useState({});
  const [isToolsLoading, setIsToolsLoading] = useState(false);

  const resolvedServiceId = toPositiveInteger(currentService?.id);
  const serviceName = currentServiceName || "Service";
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
      normalizedSubcategories
        .map((entry) => toPositiveInteger(entry?.subCategoryId))
        .filter(Boolean),
    [normalizedSubcategories],
  );
  const selectedCatalogCategoryIdsSignature = buildNumberSignature(
    selectedCatalogCategoryIds,
  );
  const pendingCategoryLabels = useMemo(
    () =>
      Array.isArray(serviceDraft?.pendingCategoryLabels)
        ? normalizeStringArray(serviceDraft.pendingCategoryLabels)
        : [],
    [serviceDraft?.pendingCategoryLabels],
  );
  const customCategoryOptions = useMemo(
    () =>
      normalizedSubcategories
        .filter((entry) => Boolean(entry?.isCustom) || !toPositiveInteger(entry?.subCategoryId))
        .map((entry) => ({
          value: getSubcategorySelectionKey(entry),
          label: String(entry?.label || entry?.name || entry?.subCategoryLabel || "").trim() || "Custom sub-category",
          isCustom: true,
        }))
        .filter((entry) => entry.value && entry.label),
    [normalizedSubcategories],
  );
  const allCategoryOptions = useMemo(() => {
    return [...categoryOptions];
  }, [categoryOptions]);
  const categoryOptionsByValue = useMemo(
    () =>
      new Map(
        allCategoryOptions.map((option) => [String(option.value), option]),
      ),
    [allCategoryOptions],
  );
  const selectedCategoryOptions = useMemo(
    () =>
      selectedCategoryKeys
        .map((selectionKey) => categoryOptionsByValue.get(String(selectionKey)))
        .filter(Boolean),
    [categoryOptionsByValue, selectedCategoryKeys],
  );
  const skillOptions = useMemo(
    () =>
      selectedCatalogCategoryIds.flatMap((subCategoryId) => {
        const tools = Array.isArray(toolOptionsByCategory[String(subCategoryId)])
          ? toolOptionsByCategory[String(subCategoryId)]
          : [];

        return tools
          .map((tool) => {
            const toolId = toPositiveInteger(tool?.id);
            const toolLabel = String(tool?.label || tool?.name || "").trim();
            const value = buildToolSelectionKey(subCategoryId, toolId);
            if (!value || !toolLabel) {
              return null;
            }

            return {
              value,
              label: toolLabel,
              selectedLabel: toolLabel,
            };
          })
          .filter(Boolean);
      }),
    [selectedCatalogCategoryIds, toolOptionsByCategory],
  );
  const selectedSkillValues = useMemo(
    () =>
      normalizedSubcategories.flatMap((entry) => {
        const subCategoryId = toPositiveInteger(entry?.subCategoryId);
        if (!subCategoryId) {
          return [];
        }

        const selectedToolIds = Array.isArray(entry?.selectedToolIds)
          ? entry.selectedToolIds
          : [];
        return selectedToolIds
          .map((toolId) => buildToolSelectionKey(subCategoryId, toolId))
          .filter(Boolean);
      }),
    [normalizedSubcategories],
  );
  const derivedSkillsAndTechnologies = useMemo(
    () => deriveDraftSkillsAndTechnologies(serviceDraft, toolOptionsByCategory),
    [serviceDraft, toolOptionsByCategory],
  );
  const titleError = String(serviceInfoValidationErrors.title || "").trim();
  const categoryError = String(serviceInfoValidationErrors.category || "").trim();
  const skillsError = String(serviceInfoValidationErrors.skills || "").trim();
  const experienceError = String(serviceInfoValidationErrors.experience || "").trim();

  useEffect(() => {
    if (!resolvedServiceId) {
      setCategoryOptions([]);
      return;
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
  }, [resolvedServiceId]);

  useEffect(() => {
    if (!normalizedSubcategories.some((entry) => entry?.isCustom)) {
      return;
    }

    onUpdateServiceDraft((draft) => ({
      ...draft,
      subcategories: (Array.isArray(draft.subcategories) ? draft.subcategories : []).filter(
        (entry) => !entry?.isCustom && toPositiveInteger(entry?.subCategoryId),
      ),
      pendingCategoryLabels: [],
    }));
  }, [normalizedSubcategories, onUpdateServiceDraft]);

  useEffect(() => {
    if (
      !normalizedSubcategories.some(
        (entry) =>
          Array.isArray(entry?.customSkillNames) && entry.customSkillNames.length > 0,
      )
    ) {
      return;
    }

    onUpdateServiceDraft((draft) => ({
      ...draft,
      subcategories: (Array.isArray(draft.subcategories) ? draft.subcategories : []).map(
        (entry) => ({
          ...entry,
          customSkillNames: [],
        }),
      ),
    }));
  }, [normalizedSubcategories, onUpdateServiceDraft]);

  useEffect(() => {
    if (!selectedCatalogCategoryIds.length) {
      setToolOptionsByCategory({});
      return;
    }

    let cancelled = false;

    const fetchTools = async () => {
      try {
        setIsToolsLoading(true);
        const toolEntries = await Promise.all(
          selectedCatalogCategoryIds.map(async (subCategoryId) => {
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
                subCategoryId,
                name: String(entry?.name || "").trim(),
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
      } finally {
        if (!cancelled) {
          setIsToolsLoading(false);
        }
      }
    };

    void fetchTools();
    return () => {
      cancelled = true;
    };
  }, [selectedCatalogCategoryIds, selectedCatalogCategoryIdsSignature]);

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

  const handleSelectedCategoriesChange = (nextValues) => {
    onUpdateServiceDraft((draft) => syncDraftSubcategories(draft, nextValues));
  };

  const handleSelectedSkillsChange = (nextValues) => {
    const selectedValues = Array.isArray(nextValues) ? nextValues : [];
    const selectedToolIdsByCategory = new Map();
    selectedValues.forEach((value) => {
      const parsedValue = parseToolSelectionKey(value);
      if (!parsedValue) {
        return;
      }

      const { subCategoryId, toolId } = parsedValue;
      const existingToolIds = selectedToolIdsByCategory.get(subCategoryId) || [];
      if (!existingToolIds.includes(toolId)) {
        selectedToolIdsByCategory.set(subCategoryId, [...existingToolIds, toolId]);
      }
    });

    onUpdateServiceDraft((draft) => ({
      ...draft,
      subcategories: (Array.isArray(draft.subcategories) ? draft.subcategories : []).map(
        (entry) => {
          const subCategoryId = toPositiveInteger(entry?.subCategoryId);
          if (!subCategoryId) {
            return entry;
          }

          return {
            ...entry,
            selectedToolIds: selectedToolIdsByCategory.get(subCategoryId) || [],
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
            <span>Fill Your </span>
            <span className="text-primary">{serviceName}</span>
            <span> Service Info</span>
          </h1>
        </div>

        <div className="w-full">
          <ServiceInfoStepper
            activeStepId="overview"
            onStepChange={onServiceStepChange}
          />
        </div>

        <div className="w-full space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-medium text-white">
                Add service info
              </h2>
              <p className={cn(ONBOARDING_SECTION_DESCRIPTION_CLASS, "text-muted-foreground")}>
                Enter details of your service
              </p>
            </div>

            <div className="ml-4 mr-2 mt-0.5 flex items-start sm:mt-0 sm:items-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onSkipServices?.()}
                disabled={false}
                className="h-auto px-0 py-0 text-sm font-normal text-white/75 hover:text-white hover:!bg-transparent hover:underline sm:h-11 sm:px-6 sm:text-base"
              >
                Skip
              </Button>
            </div>
          </div>

          <div className="space-y-6 rounded-2xl border border-white/8 bg-card p-5 sm:p-7">
            <div className="space-y-0">
              <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
                Service Title
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={serviceInfoForm.title}
                  onChange={(event) => {
                    if (event.target.value.length <= SERVICE_TITLE_MAX) {
                      onServiceInfoFieldChange("title", event.target.value);
                    }
                  }}
                  placeholder="I will do something I'm really good at"
                  className={cn(
                    "h-12 w-full rounded-xl border bg-card px-4 !text-[14px] !leading-5 text-white outline-none transition-colors placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 focus:ring-1",
                    titleError
                      ? "border-destructive/70 focus:border-destructive/60 focus:ring-destructive/20"
                      : "border-white/10 focus:border-primary/50 focus:ring-primary/20",
                  )}
                  aria-invalid={Boolean(titleError)}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/30">
                  {serviceInfoForm.title.length} / {SERVICE_TITLE_MAX} MAX
                </span>
              </div>
              {titleError ? (
                <p className="mt-1 text-sm text-destructive">{titleError}</p>
              ) : null}
            </div>

            <div className="space-y-0">
              <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
                Select Category
              </label>
              <CategoryMultiSelect
                selected={selectedCategoryKeys}
                onChange={handleSelectedCategoriesChange}
                options={allCategoryOptions}
                placeholder={isCategoriesLoading ? "Loading..." : "Search here"}
                searchPlaceholder="Search here"
                isLoading={isCategoriesLoading}
                hasError={Boolean(categoryError)}
              />
              {categoryError ? (
                <p className="mt-1 text-sm text-destructive">{categoryError}</p>
              ) : null}
            </div>

            <div className="space-y-0">
              <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
                Skills
              </label>
              {selectedCategoryOptions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/12 bg-card px-4 py-3 text-[14px] leading-5 text-white/20">
                  Select at least one sub-category to add skills.
                </div>
              ) : (
                <div className="space-y-3">
                  <CategoryMultiSelect
                    selected={selectedSkillValues}
                    onChange={handleSelectedSkillsChange}
                    options={skillOptions}
                    placeholder={isToolsLoading ? "Loading..." : "Search here"}
                    searchPlaceholder="Search here"
                    isLoading={isToolsLoading}
                    hasError={Boolean(skillsError)}
                  />
                </div>
              )}
              {skillsError ? (
                <p className="mt-1 text-sm text-destructive">{skillsError}</p>
              ) : null}
            </div>

            <div className="space-y-0">
              <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
                Experience
              </label>
              <CustomSelect
                value={serviceInfoForm.experience}
                onChange={(value) => onServiceInfoFieldChange("experience", value)}
                options={EXPERIENCE_OPTIONS}
                placeholder="Select experience level"
                hasError={Boolean(experienceError)}
              />
              {experienceError ? (
                <p className="mt-1 text-sm text-destructive">{experienceError}</p>
              ) : null}
            </div>


          </div>
        </div>
      </div>
    </section>
  );
};

export default FreelancerServiceInfoSlide;
