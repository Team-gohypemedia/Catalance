import { useState, useEffect, useMemo, useRef } from "react";
import Check from "lucide-react/dist/esm/icons/check";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import Plus from "lucide-react/dist/esm/icons/plus";
import X from "lucide-react/dist/esm/icons/x";

import { API_BASE_URL } from "@/shared/lib/api-client";
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

const COMPLEXITY_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "expert", label: "Expert" },
];

const SERVICE_TITLE_MAX = 80;

const normalizeServiceLookupKey = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

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

const normalizeSubcategorySkillMap = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce((accumulator, [subcategoryId, skills]) => {
    const normalizedSubcategoryId = String(subcategoryId || "").trim();
    if (!normalizedSubcategoryId) {
      return accumulator;
    }

    const normalizedSkills = normalizeStringArray(skills);
    if (normalizedSkills.length > 0) {
      accumulator[normalizedSubcategoryId] = normalizedSkills;
    }

    return accumulator;
  }, {});
};

const flattenSubcategorySkillMap = (skillMap) =>
  normalizeStringArray(
    Object.values(skillMap || {}).flatMap((skills) =>
      Array.isArray(skills) ? skills : [],
    ),
  );

const buildSubcategorySkillMapSignature = (skillMap) =>
  Object.keys(skillMap || {})
    .sort()
    .map((subcategoryId) => {
      const normalizedSkills = normalizeStringArray(skillMap[subcategoryId]);
      return `${subcategoryId}:${normalizedSkills.join("|")}`;
    })
    .join("||");

/* ──────────────────── Tool Selection Input ──────────────────── */

const TechnologiesInput = ({
  tools = [],
  selected,
  onChange,
  isLoading,
}) => {
  const [customToolQuery, setCustomToolQuery] = useState("");
  const [isAddingCustomTool, setIsAddingCustomTool] = useState(false);

  const normalizedTools = useMemo(
    () => normalizeStringArray(tools),
    [tools],
  );

  const selectedToolSet = useMemo(
    () => new Set(selected.map((value) => String(value || "").toLowerCase())),
    [selected],
  );

  const availableTools = useMemo(
    () =>
      normalizedTools.filter(
        (tool) => !selectedToolSet.has(tool.toLowerCase()),
      ),
    [normalizedTools, selectedToolSet],
  );

  const addTool = (tool) => {
    const normalizedTool = String(tool || "").trim();
    if (!normalizedTool) {
      return;
    }

    if (!selectedToolSet.has(normalizedTool.toLowerCase())) {
      onChange([...selected, normalizedTool]);
    }
    setCustomToolQuery("");
    setIsAddingCustomTool(false);
  };

  const removeTool = (tool) => {
    onChange(selected.filter((t) => t !== tool));
  };

  const handleCustomToolSubmit = () => {
    const trimmedTool = customToolQuery.trim();
    if (!trimmedTool) {
      return;
    }

    addTool(trimmedTool);
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
          {normalizedTools.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {normalizedTools.map((tool) => {
                const isSelected = selectedToolSet.has(tool.toLowerCase());

                return (
                  <button
                    key={tool}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      if (!isSelected) {
                        addTool(tool);
                      }
                    }}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      isSelected
                        ? "border-primary/35 bg-primary/12 text-primary"
                        : "border-white/12 bg-card text-white/75 hover:border-white/20 hover:bg-white/5"
                    }`}
                  >
                    {tool}
                  </button>
                );
              })}
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
                onChange={(e) => setCustomToolQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCustomToolSubmit();
                  }
                }}
                placeholder="Add a custom skill or tool"
                className="h-11 flex-1 rounded-xl border border-white/10 bg-card px-4 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              />
              <div className="flex gap-2 sm:flex-none">
                <button
                  type="button"
                  onClick={handleCustomToolSubmit}
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

      {/* Selected tags */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((tool) => (
            <span
              key={tool}
              className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
            >
              {tool}
              <button
                type="button"
                onClick={() => removeTool(tool)}
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
  placeholder = "Select sub-categories",
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const normalizedSelected = Array.isArray(selected)
    ? selected.map((value) => String(value || "").trim()).filter(Boolean)
    : String(selected || "").trim()
      ? [String(selected).trim()]
      : [];

  const selectedSet = useMemo(
    () => new Set(normalizedSelected),
    [normalizedSelected],
  );

  const selectedOptions = useMemo(
    () => options.filter((option) => selectedSet.has(String(option.value))),
    [options, selectedSet],
  );

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
            } ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-white/10 bg-card shadow-xl shadow-black/40">
            <div className="max-h-56 overflow-y-auto">
              {options.length === 0 ? (
                <div className="px-4 py-3 text-sm text-white/40">
                  No sub-categories available
                </div>
              ) : (
                options.map((option) => {
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

/* ──────────────────── Main Slide ──────────────────── */

const FreelancerServiceInfoSlide = ({
  selectedServices,
  dbServices,
  serviceInfoForm,
  onServiceInfoFieldChange,
}) => {
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [toolOptionsByCategory, setToolOptionsByCategory] = useState({});
  const [isToolsLoading, setIsToolsLoading] = useState(false);

  const firstSelectedService =
    Array.isArray(selectedServices) && selectedServices.length > 0
      ? selectedServices[0]
      : null;

  const firstService =
    firstSelectedService && Array.isArray(dbServices)
      ? dbServices.find((service) => {
          if (service.id === firstSelectedService) {
            return true;
          }

          return (
            normalizeServiceLookupKey(service.name) ===
            normalizeServiceLookupKey(firstSelectedService)
          );
        })
      : null;
  const resolvedServiceId = firstService?.id ?? null;

  const serviceName = firstService?.name ?? "Service";

  const selectedCategoryIds = useMemo(() => {
    if (Array.isArray(serviceInfoForm.category)) {
      return serviceInfoForm.category
        .map((value) => String(value || "").trim())
        .filter(Boolean);
    }

    const legacyValue = String(serviceInfoForm.category || "").trim();
    return legacyValue ? [legacyValue] : [];
  }, [serviceInfoForm.category]);

  const selectedCategoryLabels = useMemo(() => {
    if (Array.isArray(serviceInfoForm.categoryLabel)) {
      return serviceInfoForm.categoryLabel
        .map((value) => String(value || "").trim())
        .filter(Boolean);
    }

    const legacyValue = String(serviceInfoForm.categoryLabel || "").trim();
    return legacyValue
      ? legacyValue
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      : [];
  }, [serviceInfoForm.categoryLabel]);

  const normalizedTechnologies = useMemo(
    () => normalizeStringArray(serviceInfoForm.technologies),
    [serviceInfoForm.technologies],
  );

  const normalizedSubcategorySkills = useMemo(
    () => normalizeSubcategorySkillMap(serviceInfoForm.subcategorySkills),
    [serviceInfoForm.subcategorySkills],
  );

  const selectedCategoryOptions = useMemo(
    () =>
      categoryOptions.filter((option) =>
        selectedCategoryIds.includes(String(option.value)),
      ),
    [categoryOptions, selectedCategoryIds],
  );

  const activeSkillCategoryId = useMemo(() => {
    const preferredCategoryId = String(
      serviceInfoForm.activeSkillCategory || "",
    ).trim();
    if (selectedCategoryIds.includes(preferredCategoryId)) {
      return preferredCategoryId;
    }

    return selectedCategoryIds[0] || "";
  }, [serviceInfoForm.activeSkillCategory, selectedCategoryIds]);

  const activeSkillCategoryOption = useMemo(
    () =>
      selectedCategoryOptions.find(
        (option) => String(option.value) === activeSkillCategoryId,
      ) || null,
    [activeSkillCategoryId, selectedCategoryOptions],
  );

  const activeSkillSelections = useMemo(() => {
    if (!activeSkillCategoryId) {
      return [];
    }

    return normalizeStringArray(normalizedSubcategorySkills[activeSkillCategoryId]);
  }, [activeSkillCategoryId, normalizedSubcategorySkills]);

  const activeCategoryToolOptions = useMemo(() => {
    if (!activeSkillCategoryId) {
      return [];
    }

    return normalizeStringArray(
      toolOptionsByCategory[String(activeSkillCategoryId)],
    ).sort((left, right) => left.localeCompare(right));
  }, [activeSkillCategoryId, toolOptionsByCategory]);

  // Fetch sub-categories from DB when the selected service changes
  useEffect(() => {
    if (!resolvedServiceId) {
      setCategoryOptions([]);
      return;
    }

    let cancelled = false;
    const fetchSubCategories = async () => {
      try {
        setIsCategoriesLoading(true);
        const res = await fetch(
          `${API_BASE_URL}/marketplace/filters/sub-categories?serviceId=${resolvedServiceId}`
        );
        if (!res.ok) throw new Error("Failed to fetch sub-categories");
        const json = await res.json();
        const data = (json.data || []).map((sc) => ({
          value: String(sc.id),
          label: sc.name,
        }));
        if (!cancelled) {
          setCategoryOptions(data);

          const selectedFromStoredLabels =
            selectedCategoryIds.length === 0 && selectedCategoryLabels.length > 0
              ? selectedCategoryLabels
                  .map((label) => data.find((opt) => opt.label === label)?.value)
                  .filter(Boolean)
              : selectedCategoryIds;

          const nextSelectedIds = selectedFromStoredLabels.filter((id) =>
            data.some((opt) => opt.value === id),
          );

          const nextSelectedLabels = data
            .filter((opt) => nextSelectedIds.includes(opt.value))
            .map((opt) => opt.label);

          if (nextSelectedIds.join("|") !== selectedCategoryIds.join("|")) {
            onServiceInfoFieldChange("category", nextSelectedIds);
          }

          if (nextSelectedLabels.join("|") !== selectedCategoryLabels.join("|")) {
            onServiceInfoFieldChange("categoryLabel", nextSelectedLabels);
          }
        }
      } catch {
        if (!cancelled) setCategoryOptions([]);
      } finally {
        if (!cancelled) setIsCategoriesLoading(false);
      }
    };

    fetchSubCategories();
    return () => { cancelled = true; };
  }, [resolvedServiceId]);

  // Fetch tools from DB when selected sub-categories change
  useEffect(() => {
    if (!selectedCategoryIds.length) {
      setToolOptionsByCategory({});
      return;
    }

    let cancelled = false;
    const fetchTools = async () => {
      try {
        setIsToolsLoading(true);
        const toolsByCategory = await Promise.all(
          selectedCategoryIds.map(async (subCategoryId) => {
            const res = await fetch(
              `${API_BASE_URL}/marketplace/filters/tools?subCategoryId=${subCategoryId}`
            );
            if (!res.ok) throw new Error("Failed to fetch tools");
            const json = await res.json();
            const normalizedTools = normalizeStringArray(
              (json.data || []).map((tool) => String(tool?.name || "").trim()),
            ).sort((left, right) => left.localeCompare(right));

            return [String(subCategoryId), normalizedTools];
          })
        );

        if (!cancelled) {
          setToolOptionsByCategory(Object.fromEntries(toolsByCategory));
        }
      } catch {
        if (!cancelled) setToolOptionsByCategory({});
      } finally {
        if (!cancelled) setIsToolsLoading(false);
      }
    };

    fetchTools();
    return () => { cancelled = true; };
  }, [selectedCategoryIds]);

  // Keep per-subcategory skills, flattened technologies, and active skills category in sync.
  useEffect(() => {
    const isWaitingForCategoryIdResolution =
      selectedCategoryIds.length === 0 && selectedCategoryLabels.length > 0;

    if (isWaitingForCategoryIdResolution) {
      return;
    }

    const selectedCategoryIdSet = new Set(selectedCategoryIds);
    const nextSubcategorySkills = Object.entries(normalizedSubcategorySkills).reduce(
      (accumulator, [subcategoryId, skills]) => {
        if (selectedCategoryIdSet.has(subcategoryId) && skills.length > 0) {
          accumulator[subcategoryId] = skills;
        }
        return accumulator;
      },
      {},
    );

    if (
      Object.keys(nextSubcategorySkills).length === 0 &&
      selectedCategoryIds.length > 0 &&
      normalizedTechnologies.length > 0
    ) {
      nextSubcategorySkills[selectedCategoryIds[0]] = normalizedTechnologies;
    }

    const nextFlattenedTechnologies = flattenSubcategorySkillMap(nextSubcategorySkills);

    if (
      buildSubcategorySkillMapSignature(nextSubcategorySkills) !==
      buildSubcategorySkillMapSignature(normalizedSubcategorySkills)
    ) {
      onServiceInfoFieldChange("subcategorySkills", nextSubcategorySkills);
    }

    if (nextFlattenedTechnologies.join("|") !== normalizedTechnologies.join("|")) {
      onServiceInfoFieldChange("technologies", nextFlattenedTechnologies);
    }

    const preferredCategoryId = String(
      serviceInfoForm.activeSkillCategory || "",
    ).trim();
    const nextActiveCategoryId = selectedCategoryIds.includes(preferredCategoryId)
      ? preferredCategoryId
      : selectedCategoryIds[0] || "";

    if (nextActiveCategoryId !== preferredCategoryId) {
      onServiceInfoFieldChange("activeSkillCategory", nextActiveCategoryId);
    }
  }, [
    normalizedSubcategorySkills,
    normalizedTechnologies,
    onServiceInfoFieldChange,
    selectedCategoryIds,
    selectedCategoryLabels,
    serviceInfoForm.activeSkillCategory,
  ]);

  const handleActiveCategorySkillsChange = (nextValues) => {
    if (!activeSkillCategoryId) {
      return;
    }

    const normalizedNextValues = normalizeStringArray(nextValues);
    const nextSubcategorySkills = {
      ...normalizedSubcategorySkills,
    };

    if (normalizedNextValues.length > 0) {
      nextSubcategorySkills[activeSkillCategoryId] = normalizedNextValues;
    } else {
      delete nextSubcategorySkills[activeSkillCategoryId];
    }

    const nextFlattenedTechnologies = flattenSubcategorySkillMap(nextSubcategorySkills);

    onServiceInfoFieldChange("subcategorySkills", nextSubcategorySkills);
    onServiceInfoFieldChange("technologies", nextFlattenedTechnologies);
  };

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col items-center">
      <div className="w-full space-y-8">
        {/* Heading */}
        <div className="text-center">
          <h1 className="text-balance text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl lg:text-[3.1rem] lg:leading-[1.04]">
            <span>Fill Your </span>
            <span className="text-primary">{serviceName}</span>
            <span> Service Info</span>
          </h1>
        </div>

        {/* Stepper */}
        <div className="w-full">
          <ServiceInfoStepper activeStepId="overview" />
        </div>

        {/* Step Content */}
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
            {/* Service Title */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                Service Title
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={serviceInfoForm.title}
                  onChange={(e) => {
                    if (e.target.value.length <= SERVICE_TITLE_MAX) {
                      onServiceInfoFieldChange("title", e.target.value);
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

            {/* Select Category */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                Select Category
              </label>
              <CategoryMultiSelect
                selected={selectedCategoryIds}
                onChange={(nextValues) => {
                  const normalizedNextValues = nextValues
                    .map((value) => String(value || "").trim())
                    .filter(Boolean);

                  const nextLabels = categoryOptions
                    .filter((option) =>
                      normalizedNextValues.includes(String(option.value))
                    )
                    .map((option) => option.label);

                  onServiceInfoFieldChange("category", normalizedNextValues);
                  onServiceInfoFieldChange("categoryLabel", nextLabels);
                }}
                options={categoryOptions}
                placeholder={
                  isCategoriesLoading
                    ? "Loading..."
                    : "Select sub-categories"
                }
                isLoading={isCategoriesLoading}
              />
            </div>

            {/* Technologies */}
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
                    value={activeSkillCategoryId}
                    onChange={(value) =>
                      onServiceInfoFieldChange("activeSkillCategory", value)
                    }
                    options={selectedCategoryOptions}
                    placeholder="Select a sub-category for skills"
                  />

                  <div className="rounded-xl border border-white/8 bg-card/60 p-3 sm:p-4">
                    <p className="mb-1 text-xs font-medium uppercase tracking-[0.12em] text-white/55">
                      Adding Skills To{" "}
                      <span className="text-primary">
                        {activeSkillCategoryOption?.label || "Selected sub-category"}
                      </span>
                    </p>
                    <p className="mb-3 text-xs text-white/45">
                      Choose tools from the selected sub-category or add your own.
                    </p>
                    <TechnologiesInput
                      tools={activeCategoryToolOptions}
                      selected={activeSkillSelections}
                      onChange={handleActiveCategorySkillsChange}
                      isLoading={isToolsLoading}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Experience */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                Experience
              </label>
              <CustomSelect
                value={serviceInfoForm.experience}
                onChange={(val) => onServiceInfoFieldChange("experience", val)}
                options={EXPERIENCE_OPTIONS}
                placeholder="Select experience level"
              />
            </div>

            {/* Project Complexity */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                Project Complexity
              </label>
              <CustomSelect
                value={serviceInfoForm.complexity}
                onChange={(val) => onServiceInfoFieldChange("complexity", val)}
                options={COMPLEXITY_OPTIONS}
                placeholder="Select complexity"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FreelancerServiceInfoSlide;
