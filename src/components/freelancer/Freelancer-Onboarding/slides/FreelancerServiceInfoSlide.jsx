import { useEffect, useMemo, useRef, useState } from "react";
import Check from "lucide-react/dist/esm/icons/check";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import Plus from "lucide-react/dist/esm/icons/plus";
import X from "lucide-react/dist/esm/icons/x";

import { API_BASE_URL } from "@/shared/lib/api-client";
import {
  appendCustomSubcategorySelection,
  deriveDraftSkillsAndTechnologies,
  getSubcategorySelectionKey,
  normalizeCustomSkillNames,
  normalizeStringArray,
  syncDraftSubcategories,
} from "../service-details";
import {
  ServiceInfoStepper,
  CustomSelect,
} from "./shared/ServiceInfoComponents";

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

const TechnologiesInput = ({
  toolOptions = [],
  selectedToolIds = [],
  unresolvedToolIds = [],
  customSkillNames = [],
  onSelectedToolIdsChange,
  onCustomSkillNamesChange,
  isLoading,
}) => {
  const [customToolQuery, setCustomToolQuery] = useState("");
  const [toolSearchQuery, setToolSearchQuery] = useState("");
  const [isAddingCustomTool, setIsAddingCustomTool] = useState(false);

  const normalizedToolOptions = useMemo(
    () =>
      (Array.isArray(toolOptions) ? toolOptions : [])
        .filter((option) => Number.isInteger(Number(option?.id)))
        .map((option) => ({
          id: Number(option.id),
          label: String(option.label || option.name || "").trim(),
        }))
        .filter((option) => option.label)
        .sort((left, right) => left.label.localeCompare(right.label)),
    [toolOptions],
  );

  const selectedToolIdSet = useMemo(
    () => new Set(selectedToolIds.map((value) => Number(value))),
    [selectedToolIds],
  );
  const filteredToolOptions = useMemo(() => {
    const normalizedQuery = String(toolSearchQuery || "").trim().toLowerCase();
    if (!normalizedQuery) {
      return normalizedToolOptions;
    }

    return normalizedToolOptions.filter((tool) =>
      String(tool?.label || "")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [normalizedToolOptions, toolSearchQuery]);

  const addCustomSkill = () => {
    const nextSkill = String(customToolQuery || "").trim();
    if (!nextSkill) {
      return;
    }

    onCustomSkillNamesChange(
      normalizeCustomSkillNames([...customSkillNames, nextSkill]),
    );
    setCustomToolQuery("");
    setIsAddingCustomTool(false);
  };

  const toggleTool = (toolId) => {
    const normalizedToolId = Number(toolId);
    if (!Number.isInteger(normalizedToolId) || normalizedToolId <= 0) {
      return;
    }

    if (selectedToolIdSet.has(normalizedToolId)) {
      onSelectedToolIdsChange(
        selectedToolIds.filter((value) => Number(value) !== normalizedToolId),
      );
      return;
    }

    onSelectedToolIdsChange([...selectedToolIds, normalizedToolId]);
  };

  const removeCustomSkill = (skillName) => {
    onCustomSkillNamesChange(
      customSkillNames.filter(
        (entry) => String(entry || "").toLowerCase() !== String(skillName || "").toLowerCase(),
      ),
    );
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-white/45">
            Available Tools
          </p>
          <button
            type="button"
            onClick={() => setIsAddingCustomTool((current) => !current)}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-white/18 px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:border-primary/35 hover:text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            Add More
          </button>
        </div>
        <div className="rounded-xl border border-white/8 bg-card/60 p-2.5">
          {normalizedToolOptions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <div className="w-full">
                <input
                  type="text"
                  value={toolSearchQuery}
                  onChange={(event) => setToolSearchQuery(event.target.value)}
                  placeholder="Search skills or tools"
                  className="h-10 w-full rounded-lg border border-white/10 bg-card px-3 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                />
              </div>
              {filteredToolOptions.map((tool) => {
                const isSelected = selectedToolIdSet.has(tool.id);

                return (
                  <button
                    key={tool.id}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => toggleTool(tool.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      isSelected
                        ? "border-primary/35 bg-primary/12 text-primary"
                        : "border-white/12 bg-card text-white/75 hover:border-white/20 hover:bg-white/5"
                    }`}
                  >
                    {tool.label}
                  </button>
                );
              })}
              {filteredToolOptions.length === 0 ? (
                <div className="w-full px-1 py-1 text-sm text-muted-foreground">
                  No matching tools found.
                </div>
              ) : null}
            </div>
          ) : !isLoading ? (
            <div className="px-1 py-1 text-sm text-muted-foreground">
              No tools found for this sub-category yet.
            </div>
          ) : (
            <div className="px-1 py-1 text-sm text-muted-foreground">
              Loading tools...
            </div>
          )}

          {isAddingCustomTool && (
            <div className="mt-3 flex flex-col gap-2 border-t border-white/8 pt-3 sm:flex-row">
              <input
                type="text"
                value={customToolQuery}
                onChange={(event) => setCustomToolQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addCustomSkill();
                  }
                }}
                placeholder="Add a custom skill or tool"
                className="h-11 flex-1 rounded-xl border border-white/10 bg-card px-4 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              />
              <div className="flex gap-2 sm:flex-none">
                <button
                  type="button"
                  onClick={addCustomSkill}
                  disabled={!customToolQuery.trim()}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-primary/35 bg-primary/12 px-4 text-sm font-medium text-primary transition-colors hover:bg-primary/18 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-card disabled:text-white/35"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomToolQuery("");
                    setIsAddingCustomTool(false);
                  }}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-card px-4 text-sm font-medium text-white/70 transition-colors hover:border-white/18 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {(selectedToolIds.length > 0 || unresolvedToolIds.length > 0 || customSkillNames.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {normalizedToolOptions
            .filter((tool) => selectedToolIdSet.has(tool.id))
            .map((tool) => (
              <span
                key={`tool-${tool.id}`}
                className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
              >
                {tool.label}
                <button
                  type="button"
                  onClick={() => toggleTool(tool.id)}
                  className="rounded-full p-0.5 transition-colors hover:bg-primary/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

          {unresolvedToolIds.map((toolId) => (
            <span
              key={`legacy-${toolId}`}
              className="flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/5 px-3 py-1.5 text-sm font-medium text-white/75"
            >
              {`Legacy tool #${toolId}`}
              <button
                type="button"
                onClick={() =>
                  onSelectedToolIdsChange(
                    selectedToolIds.filter((value) => Number(value) !== Number(toolId)),
                  )
                }
                className="rounded-full p-0.5 transition-colors hover:bg-white/10"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}

          {customSkillNames.map((skillName) => (
            <span
              key={`custom-${skillName}`}
              className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
            >
              {skillName}
              <button
                type="button"
                onClick={() => removeCustomSkill(skillName)}
                className="rounded-full p-0.5 transition-colors hover:bg-primary/20"
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

const CategoryMultiSelect = ({
  options = [],
  selected = [],
  onChange,
  onCreateOption,
  placeholder = "Select sub-categories",
  isLoading = false,
  allowCustom = false,
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
  const trimmedSearchQuery = String(searchQuery || "").trim();
  const canCreateCustomOption = useMemo(() => {
    if (!allowCustom || !trimmedSearchQuery) {
      return false;
    }

    const normalizedQuery = trimmedSearchQuery.toLowerCase();
    return !options.some(
      (option) => String(option?.label || "").trim().toLowerCase() === normalizedQuery,
    );
  }, [allowCustom, options, trimmedSearchQuery]);
  const isCreateActionEnabled =
    canCreateCustomOption && typeof onCreateOption === "function";

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

  const handleCreateOption = () => {
    if (canCreateCustomOption && typeof onCreateOption === "function") {
      onCreateOption(trimmedSearchQuery);
      setSearchQuery("");
      setIsOpen(false);
      return;
    }

    searchInputRef.current?.focus();
  };

  const toggleOption = (optionValue) => {
    const normalizedValue = String(optionValue);
    if (selectedSet.has(normalizedValue)) {
      onChange(normalizedSelected.filter((value) => value !== normalizedValue));
      return;
    }

    onChange([...normalizedSelected, normalizedValue]);
  };

  const removeOption = (optionValue) => {
    const normalizedValue = String(optionValue);
    onChange(normalizedSelected.filter((value) => value !== normalizedValue));
  };

  const summaryText = useMemo(() => {
    if (isLoading) {
      return "Loading...";
    }

    if (selectedOptions.length === 0) {
      return placeholder;
    }

    if (selectedOptions.length <= 2) {
      return selectedOptions.map((option) => option.label).join(", ");
    }

    const visibleLabels = selectedOptions
      .slice(0, 2)
      .map((option) => option.label)
      .join(", ");

    return `${visibleLabels} +${selectedOptions.length - 2} more`;
  }, [isLoading, placeholder, selectedOptions]);

  return (
    <div className="space-y-3">
      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className={`flex h-12 w-full items-center justify-between rounded-xl border bg-card px-4 text-sm transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/20 ${
            selectedOptions.length > 0
              ? "border-primary/25 text-white"
              : "border-white/10 text-white/40"
          }`}
        >
          <span className="truncate text-left">{summaryText}</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${
              selectedOptions.length > 0 ? "text-primary" : "text-white/40"
            } ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-white/10 bg-card shadow-xl shadow-black/40">
            <div className="border-b border-white/8 p-2.5">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && canCreateCustomOption) {
                    event.preventDefault();
                    handleCreateOption();
                  }
                }}
                placeholder="Search sub-categories"
                className="h-10 w-full rounded-lg border border-white/10 bg-card px-3 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              />
            </div>
            {allowCustom ? (
              <div className="border-b border-white/8 px-2.5 py-2">
                <button
                  type="button"
                  onClick={handleCreateOption}
                  className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                    isCreateActionEnabled
                      ? "border-primary/20 bg-primary/8 hover:border-primary/35 hover:bg-primary/12"
                      : "border-white/8 bg-white/[0.02] hover:border-white/14 hover:bg-white/[0.04]"
                  }`}
                >
                  <span
                    className={`font-medium ${
                      isCreateActionEnabled ? "text-white" : "text-white/58"
                    }`}
                  >
                    {!trimmedSearchQuery
                      ? "Type above to add a custom sub-category"
                      : canCreateCustomOption
                        ? "Add custom sub-category"
                        : "Matching sub-category already exists"}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 ${
                      isCreateActionEnabled ? "text-primary" : "text-white/48"
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {trimmedSearchQuery || "Custom"}
                  </span>
                </button>
              </div>
            ) : null}
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
                          ? "border-primary/30 bg-primary/12 text-primary"
                          : "border-transparent text-white/80 hover:border-white/8 hover:bg-white/5"
                      }`}
                    >
                      <span className="font-medium">{option.label}</span>
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
                          <Check className="h-3.5 w-3.5" />
                          Selected
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
              className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
            >
              {option.label}
              <button
                type="button"
                onClick={() => removeOption(option.value)}
                className="rounded-full p-0.5 transition-colors hover:bg-primary/20"
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
          label: String(entry?.label || "").trim() || "Custom sub-category",
          isCustom: true,
        }))
        .filter((entry) => entry.value && entry.label),
    [normalizedSubcategories],
  );
  const allCategoryOptions = useMemo(() => {
    const seen = new Set();

    return [...categoryOptions, ...customCategoryOptions].filter((option) => {
      const optionValue = String(option?.value || "").trim();
      if (!optionValue || seen.has(optionValue)) {
        return false;
      }

      seen.add(optionValue);
      return true;
    });
  }, [categoryOptions, customCategoryOptions]);
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
  const activeSkillCategoryId =
    String(serviceDraft?.activeSkillCategory || "").trim() ||
    selectedCategoryKeys[0] ||
    null;
  const activeSubcategory =
    normalizedSubcategories.find(
      (entry) => getSubcategorySelectionKey(entry) === activeSkillCategoryId,
    ) || null;
  const activeCategoryToolOptions = useMemo(
    () =>
      toolOptionsByCategory[
        String(toPositiveInteger(activeSubcategory?.subCategoryId) || "")
      ] || [],
    [activeSubcategory?.subCategoryId, toolOptionsByCategory],
  );
  const activeSelectedToolIds = useMemo(
    () =>
      Array.isArray(activeSubcategory?.selectedToolIds)
        ? activeSubcategory.selectedToolIds
        : [],
    [activeSubcategory?.selectedToolIds],
  );
  const activeCustomSkillNames = Array.isArray(activeSubcategory?.customSkillNames)
    ? activeSubcategory.customSkillNames
    : [];
  const activeToolIdsSet = useMemo(
    () => new Set(activeCategoryToolOptions.map((option) => Number(option.id))),
    [activeCategoryToolOptions],
  );
  const unresolvedActiveToolIds = useMemo(
    () =>
      activeSelectedToolIds.filter((toolId) => !activeToolIdsSet.has(Number(toolId))),
    [activeSelectedToolIds, activeToolIdsSet],
  );
  const derivedSkillsAndTechnologies = useMemo(
    () => deriveDraftSkillsAndTechnologies(serviceDraft, toolOptionsByCategory),
    [serviceDraft, toolOptionsByCategory],
  );

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
    if (!categoryOptions.length || selectedCategoryKeys.length > 0 || !pendingCategoryLabels.length) {
      return;
    }

    const resolvedCategoryValues = pendingCategoryLabels
      .map((label) =>
        categoryOptions.find(
          (option) => option.label.toLowerCase() === label.toLowerCase(),
        )?.value,
      )
      .filter(Boolean);
    const unmatchedCategoryLabels = pendingCategoryLabels.filter(
      (label) =>
        !categoryOptions.some(
          (option) => option.label.toLowerCase() === label.toLowerCase(),
        ),
    );

    onUpdateServiceDraft((draft) => {
      let nextDraft = syncDraftSubcategories(draft, resolvedCategoryValues);

      unmatchedCategoryLabels.forEach((label) => {
        nextDraft = appendCustomSubcategorySelection(nextDraft, label);
      });

      const hasStructuredSkills = nextDraft.subcategories.some(
        (entry) =>
          entry.selectedToolIds.length > 0 || entry.customSkillNames.length > 0,
      );

      if (!hasStructuredSkills && Array.isArray(draft?.skillsAndTechnologies) && draft.skillsAndTechnologies.length > 0) {
        nextDraft.subcategories = nextDraft.subcategories.map((entry, index) =>
          index === 0
            ? {
                ...entry,
                customSkillNames: normalizeCustomSkillNames(
                  draft.skillsAndTechnologies,
                ),
              }
            : entry,
        );
      }

      return {
        ...nextDraft,
        pendingCategoryLabels: [],
      };
    });
  }, [
    categoryOptions,
    onUpdateServiceDraft,
    pendingCategoryLabels,
    selectedCategoryKeys.length,
    selectedCatalogCategoryIdsSignature,
    serviceDraft?.skillsAndTechnologies,
  ]);

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

  const handleAddCustomCategory = (label) => {
    onUpdateServiceDraft((draft) => appendCustomSubcategorySelection(draft, label));
  };

  const handleActiveSubcategoryChange = (field, value) => {
    if (!activeSkillCategoryId) {
      return;
    }

    onUpdateServiceDraft((draft) => ({
      ...draft,
      subcategories: (Array.isArray(draft.subcategories) ? draft.subcategories : []).map(
        (entry) =>
          getSubcategorySelectionKey(entry) === activeSkillCategoryId
            ? {
                ...entry,
                [field]: value,
              }
            : entry,
      ),
    }));
  };

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col items-center">
      <div className="w-full space-y-8">
        <div className="text-center">
          <h1 className="text-balance text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl lg:text-[3.1rem] lg:leading-[1.04]">
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

        <div className="w-full space-y-7">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">
              Add service info
            </h2>
            <p className="text-sm text-muted-foreground sm:text-base">
              Provide the details of the service you will offer.
            </p>
          </div>

          <div className="space-y-6 rounded-2xl border border-white/8 bg-card/50 p-5 sm:p-7">
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
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
                  className="h-12 w-full rounded-xl border border-white/10 bg-card px-4 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/30">
                  {serviceInfoForm.title.length} / {SERVICE_TITLE_MAX} MAX
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                Select Category
              </label>
              <CategoryMultiSelect
                selected={selectedCategoryKeys}
                onChange={handleSelectedCategoriesChange}
                onCreateOption={handleAddCustomCategory}
                options={allCategoryOptions}
                placeholder={
                  isCategoriesLoading ? "Loading..." : "Select sub-categories"
                }
                isLoading={isCategoriesLoading}
                allowCustom
              />
            </div>

            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                Skills
              </label>
              {selectedCategoryOptions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/12 bg-card px-4 py-3 text-sm text-muted-foreground">
                  Select at least one sub-category to add skills.
                </div>
              ) : (
                <div className="space-y-3">
                  <CustomSelect
                    value={activeSkillCategoryId ? String(activeSkillCategoryId) : ""}
                    onChange={(value) =>
                      onUpdateServiceDraft((draft) => ({
                        ...draft,
                        activeSkillCategory: String(value || "").trim(),
                      }))
                    }
                    options={selectedCategoryOptions}
                    placeholder="Select a sub-category for skills"
                    isSearchable
                    searchPlaceholder="Search sub-categories"
                  />

                  <div className="rounded-xl border border-white/8 bg-card/60 p-3 sm:p-4">
                    <p className="mb-1 text-xs font-medium uppercase tracking-[0.12em] text-white/55">
                      Adding Skills To{" "}
                      <span className="text-primary">
                        {selectedCategoryOptions.find(
                          (option) => String(option.value) === String(activeSkillCategoryId),
                        )?.label || "Selected sub-category"}
                      </span>
                    </p>
                    <p className="mb-3 text-xs text-white/45">
                      Choose tools from the selected sub-category or add your own.
                    </p>
                    <TechnologiesInput
                      toolOptions={activeCategoryToolOptions}
                      selectedToolIds={activeSelectedToolIds}
                      unresolvedToolIds={unresolvedActiveToolIds}
                      customSkillNames={activeCustomSkillNames}
                      onSelectedToolIdsChange={(nextValues) =>
                        handleActiveSubcategoryChange(
                          "selectedToolIds",
                          nextValues
                            .map((value) => toPositiveInteger(value))
                            .filter(Boolean),
                        )
                      }
                      onCustomSkillNamesChange={(nextValues) =>
                        handleActiveSubcategoryChange(
                          "customSkillNames",
                          normalizeCustomSkillNames(nextValues),
                        )
                      }
                      isLoading={isToolsLoading}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                Experience
              </label>
              <CustomSelect
                value={serviceInfoForm.experience}
                onChange={(value) => onServiceInfoFieldChange("experience", value)}
                options={EXPERIENCE_OPTIONS}
                placeholder="Select experience level"
              />
            </div>


          </div>
        </div>
      </div>
    </section>
  );
};

export default FreelancerServiceInfoSlide;
