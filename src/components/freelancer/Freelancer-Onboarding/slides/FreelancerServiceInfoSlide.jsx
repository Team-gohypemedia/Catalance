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
import { Button } from "@/components/ui/button";
import {
  applyServiceTemplate,
  DEFAULT_FREELANCER_ONBOARDING_CONTENT,
  resolveServiceInfoFields,
} from "@/shared/lib/freelancer-onboarding-content";
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

const CategoryMultiSelect = ({
  options = [],
  selected = [],
  onChange,
  placeholder = "Select sub-categories",
  searchPlaceholder = "Search sub-categories",
  isLoading = false,
  loadingMessage = "Loading...",
  emptyMessage = "No options available",
  noResultsMessage = "No matching options",
  closeOnSelect = false,
  hasError = false,
  activeCategoryKey = "",
  onActiveCategoryChange,
  selectedSubcategories = [],
  toolOptionsByCategory = {},
  skillSuggestionsByCategory = {},
  onSubcategorySkillChange,
  isToolsLoading = false,
  toolFetchError = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [popupStyle, setPopupStyle] = useState(null);
  const containerRef = useRef(null);
  const popupRef = useRef(null);
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
  const optionLabelByValue = useMemo(
    () =>
      new Map(
        options.map((option) => [String(option.value || "").trim(), String(option.label || "").trim()]),
      ),
    [options],
  );

  const activeCategoryValue = useMemo(() => {
    const normalizedActive = String(activeCategoryKey || "").trim();
    if (normalizedActive && selectedSet.has(normalizedActive)) {
      return normalizedActive;
    }

    return normalizedSelected[0] || "";
  }, [activeCategoryKey, normalizedSelected, selectedSet]);

  const activeSubcategory = useMemo(
    () =>
      (Array.isArray(selectedSubcategories) ? selectedSubcategories : []).find(
        (entry) => getSubcategorySelectionKey(entry) === activeCategoryValue,
      ) || null,
    [activeCategoryValue, selectedSubcategories],
  );

  const activeSubcategoryId = toPositiveInteger(activeSubcategory?.subCategoryId);

  const activeToolSource = useMemo(() => {
    if (!activeSubcategoryId) {
      return [];
    }

    const nextTools = toolOptionsByCategory[String(activeSubcategoryId)];
    return Array.isArray(nextTools) ? nextTools : [];
  }, [activeSubcategoryId, toolOptionsByCategory]);

  const activeToolOptions = useMemo(
    () =>
      activeToolSource
        .map((tool) => ({
          id: toPositiveInteger(tool?.id),
          label: String(tool?.label || tool?.name || "").trim(),
        }))
        .filter((tool) => tool.id && tool.label),
    [activeToolSource],
  );
  const activeSuggestedSkills = useMemo(() => {
    const rawSkills = skillSuggestionsByCategory?.[activeCategoryValue];
    return normalizeStringArray(
      (Array.isArray(rawSkills) ? rawSkills : []).map(
        (entry) => entry?.label || entry?.value || entry,
      ),
    );
  }, [activeCategoryValue, skillSuggestionsByCategory]);

  const activeSelectedToolIds = useMemo(() => {
    const rawIds = Array.isArray(activeSubcategory?.selectedToolIds)
      ? activeSubcategory.selectedToolIds
      : [];
    const seen = new Set();
    return rawIds.reduce((accumulator, value) => {
      const normalizedValue = toPositiveInteger(value);
      if (!normalizedValue || seen.has(normalizedValue)) {
        return accumulator;
      }

      seen.add(normalizedValue);
      accumulator.push(normalizedValue);
      return accumulator;
    }, []);
  }, [activeSubcategory?.selectedToolIds]);

  const activeSelectedToolIdSet = useMemo(
    () => new Set(activeSelectedToolIds),
    [activeSelectedToolIds],
  );

  const activeSelectedCustomSkills = useMemo(
    () => normalizeStringArray(activeSubcategory?.customSkillNames),
    [activeSubcategory?.customSkillNames],
  );
  const activeVisibleCustomSkills = useMemo(() => {
    if (!activeSelectedCustomSkills.length) {
      return [];
    }

    const toolLabelKeys = new Set(
      activeToolOptions.map((tool) => normalizeSkillMatchKey(tool.label)),
    );

    return activeSelectedCustomSkills.filter(
      (skill) => !toolLabelKeys.has(normalizeSkillMatchKey(skill)),
    );
  }, [activeSelectedCustomSkills, activeToolOptions]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = String(searchQuery || "").trim().toLowerCase();
    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) =>
      String(
        [option?.label, option?.selectedLabel, option?.categoryLabel]
          .filter(Boolean)
          .join(" "),
      )
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [options, searchQuery]);

  const activeSelectedToolEntries = useMemo(() => {
    const toolLabelById = new Map(
      activeToolOptions.map((tool) => [tool.id, tool.label]),
    );

    return activeSelectedToolIds.map((toolId) => ({
      id: toolId,
      label: toolLabelById.get(toolId) || `Skill ${toolId}`,
    }));
  }, [activeSelectedToolIds, activeToolOptions]);

  const activeSelectionCount =
    activeSelectedToolEntries.length + activeSelectedCustomSkills.length;

  const selectedSkillEntries = useMemo(() => {
    const normalizedEntries = Array.isArray(selectedSubcategories) ? selectedSubcategories : [];

    return normalizedEntries.flatMap((entry) => {
      const categoryKey = getSubcategorySelectionKey(entry);
      if (!categoryKey || !selectedSet.has(categoryKey)) {
        return [];
      }

      const categoryLabel =
        optionLabelByValue.get(categoryKey) ||
        String(entry?.label || entry?.subCategoryKey || "").trim() ||
        "Category";
      const subCategoryId = toPositiveInteger(entry?.subCategoryId);
      const toolOptions = subCategoryId
        ? toolOptionsByCategory[String(subCategoryId)] || []
        : [];
      const toolLabelById = new Map(
        (Array.isArray(toolOptions) ? toolOptions : []).map((tool) => [
          toPositiveInteger(tool?.id),
          String(tool?.label || tool?.name || "").trim(),
        ]),
      );

      const toolEntries = (Array.isArray(entry?.selectedToolIds) ? entry.selectedToolIds : [])
        .map((toolId) => {
          const normalizedToolId = toPositiveInteger(toolId);
          if (!normalizedToolId) {
            return null;
          }

          return {
            type: "tool",
            categoryKey,
            categoryLabel,
            value: String(normalizedToolId),
            label: toolLabelById.get(normalizedToolId) || `Skill ${normalizedToolId}`,
          };
        })
        .filter(Boolean);

      const customEntries = normalizeStringArray(entry?.customSkillNames).map((skillName) => ({
        type: "custom",
        categoryKey,
        categoryLabel,
        value: skillName,
        label: skillName,
      }));

      return [...toolEntries, ...customEntries];
    });
  }, [optionLabelByValue, selectedSet, selectedSubcategories, toolOptionsByCategory]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;
      const isInsideTrigger = containerRef.current?.contains(target);
      const isInsidePopup = popupRef.current?.contains(target);

      if (!isInsideTrigger && !isInsidePopup) {
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

  useLayoutEffect(() => {
    if (!isOpen || typeof window === "undefined") {
      return undefined;
    }

    const updatePopupPosition = () => {
      const triggerElement = containerRef.current;
      if (!triggerElement) {
        return;
      }

      const rect = triggerElement.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const margin = 12;
      const gap = 8;
      const spaceBelow = Math.max(0, viewportHeight - rect.bottom - margin - gap);
      const spaceAbove = Math.max(0, rect.top - margin - gap);
      const preferredMaxHeight = 440;
      const shouldOpenAbove = spaceBelow < preferredMaxHeight && spaceAbove > spaceBelow;
      const nextHeight = Math.max(
        Math.min(preferredMaxHeight, shouldOpenAbove ? spaceAbove : spaceBelow),
        0,
      );
      const nextWidth = Math.min(
        Math.max(rect.width, 860),
        viewportWidth - margin * 2,
      );
      const nextLeft = Math.min(
        Math.max(rect.left, margin),
        viewportWidth - nextWidth - margin,
      );

      setPopupStyle({
        position: "fixed",
        left: `${nextLeft}px`,
        width: `${nextWidth}px`,
        height: `${nextHeight}px`,
        top: shouldOpenAbove
          ? "auto"
          : `${Math.min(rect.bottom + gap, viewportHeight - margin)}px`,
        bottom: shouldOpenAbove
          ? `${Math.max(viewportHeight - rect.top + gap, margin)}px`
          : "auto",
      });
    };

    updatePopupPosition();

    window.addEventListener("resize", updatePopupPosition);
    window.addEventListener("scroll", updatePopupPosition, true);

    return () => {
      window.removeEventListener("resize", updatePopupPosition);
      window.removeEventListener("scroll", updatePopupPosition, true);
    };
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

  const commitCategorySelection = (nextSelectedValues, nextActiveValue) => {
    onChange?.(nextSelectedValues);
    onActiveCategoryChange?.(nextActiveValue);

    if (closeOnSelect) {
      setIsOpen(false);
    }
  };

  const toggleOption = (optionValue) => {
    const normalizedValue = String(optionValue).trim();
    if (!normalizedValue) {
      return;
    }

    const wasSelected = selectedSet.has(normalizedValue);
    const nextSelectedValues = wasSelected
      ? normalizedSelected
      : [...normalizedSelected, normalizedValue];
    const nextActiveValue = normalizedValue;

    commitCategorySelection(nextSelectedValues, nextActiveValue);
  };

  const removeOption = (optionValue) => {
    const normalizedValue = String(optionValue);
    const nextSelectedValues = normalizedSelected.filter(
      (value) => value !== normalizedValue,
    );
    const nextActiveValue =
      normalizedValue === activeCategoryValue
        ? nextSelectedValues[0] || ""
        : activeCategoryValue;

    commitCategorySelection(nextSelectedValues, nextActiveValue);
  };

  const handleSkillSelectionChange = (
    nextSelectedToolIds,
    nextCustomSkillNames,
  ) => {
    if (!activeCategoryValue || !onSubcategorySkillChange) {
      return;
    }

    onSubcategorySkillChange(activeCategoryValue, {
      selectedToolIds: nextSelectedToolIds,
      customSkillNames: nextCustomSkillNames,
    });
  };

  const handleToggleTool = (toolId) => {
    const normalizedToolId = toPositiveInteger(toolId);
    if (!normalizedToolId) {
      return;
    }

    const nextSelectedToolIds = activeSelectedToolIdSet.has(normalizedToolId)
      ? activeSelectedToolIds.filter((value) => value !== normalizedToolId)
      : [...activeSelectedToolIds, normalizedToolId];

    handleSkillSelectionChange(nextSelectedToolIds, activeSelectedCustomSkills);
  };

  const handleRemoveCustomSkill = (skillName) => {
    handleSkillSelectionChange(
      activeSelectedToolIds,
      activeSelectedCustomSkills.filter(
        (value) =>
          String(value || "").trim().toLowerCase() !== skillName.toLowerCase(),
      ),
    );
  };

  const handleToggleSuggestedSkill = (skillName) => {
    const normalizedSkillName = String(skillName || "").trim();
    if (!normalizedSkillName) {
      return;
    }

    const nextCustomSkillNames = activeSelectedCustomSkills.some(
      (value) => value.toLowerCase() === normalizedSkillName.toLowerCase(),
    )
      ? activeSelectedCustomSkills.filter(
          (value) => value.toLowerCase() !== normalizedSkillName.toLowerCase(),
        )
      : [...activeSelectedCustomSkills, normalizedSkillName];

    handleSkillSelectionChange(activeSelectedToolIds, nextCustomSkillNames);
  };

  const handleRemoveSkillEntry = (entry) => {
    if (!entry?.categoryKey || !onSubcategorySkillChange) {
      return;
    }

    const currentSubcategory =
      (Array.isArray(selectedSubcategories) ? selectedSubcategories : []).find(
        (subcategory) => getSubcategorySelectionKey(subcategory) === entry.categoryKey,
      ) || null;

    if (!currentSubcategory) {
      return;
    }

    const currentToolIds = (Array.isArray(currentSubcategory.selectedToolIds)
      ? currentSubcategory.selectedToolIds
      : []
    )
      .map((value) => toPositiveInteger(value))
      .filter(Boolean);
    const currentCustomSkills = normalizeStringArray(currentSubcategory.customSkillNames);

    if (entry.type === "tool") {
      const nextToolIds = currentToolIds.filter((value) => String(value) !== String(entry.value));
      onSubcategorySkillChange(entry.categoryKey, {
        selectedToolIds: nextToolIds,
        customSkillNames: currentCustomSkills,
      });
      return;
    }

    const nextCustomSkills = currentCustomSkills.filter(
      (value) => value.toLowerCase() !== String(entry.value || "").trim().toLowerCase(),
    );
    onSubcategorySkillChange(entry.categoryKey, {
      selectedToolIds: currentToolIds,
      customSkillNames: nextCustomSkills,
    });
  };

  const summaryText = useMemo(
    () => (isLoading ? loadingMessage : placeholder),
    [isLoading, loadingMessage, placeholder],
  );

  return (
    <div className="space-y-3">
      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className={cn(
            "flex h-12 w-full items-center justify-between rounded-xl border bg-card px-4 !text-[14px] !leading-5 transition-colors focus:ring-1",
            hasError
              ? "border-destructive/70 text-foreground focus:border-destructive/60 focus:ring-destructive/20"
              : selectedOptions.length > 0
                ? "border-border text-foreground focus:border-primary/50 focus:ring-primary/20"
                : "border-border text-muted-foreground focus:border-primary/50 focus:ring-primary/20",
            isOpen && "border-primary/50 ring-1 ring-primary/20",
          )}
          aria-invalid={hasError}
          aria-expanded={isOpen}
        >
          <span className="truncate text-left">{summaryText}</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              selectedOptions.length > 0 ? "text-foreground/60" : "text-muted-foreground",
              isOpen && "rotate-180",
            )}
          />
        </button>

        {selectedOptions.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedOptions.map((option) => (
              <span
                key={option.value}
                className="inline-flex max-w-full items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 text-[12px] font-medium text-foreground"
              >
                <span className="min-w-0 truncate">{option.label}</span>
                <button
                  type="button"
                  onClick={() => removeOption(option.value)}
                  className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={`Remove ${option.label}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        ) : null}

        {selectedSkillEntries.length > 0 ? (
          <div className="mt-4 space-y-2">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Skills
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedSkillEntries.map((entry) => (
                <span
                  key={`${entry.categoryKey}-${entry.type}-${entry.value}`}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 text-[12px] font-medium text-foreground"
                >
                  <span className="truncate">{entry.label}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkillEntry(entry)}
                    className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={`Remove ${entry.label}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {isOpen && typeof document !== "undefined"
          ? createPortal(
              <div
                ref={popupRef}
                className="z-[70] flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl shadow-black/10 dark:shadow-black/40"
                style={popupStyle || undefined}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="border-b border-border p-2.5">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={searchPlaceholder}
                    className="h-10 w-full rounded-lg border border-input bg-card px-3 !text-[14px] !leading-5 text-foreground outline-none transition-colors placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                  />
                </div>

                <div
                  className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row"
                >
                  <div className="flex min-h-0 min-w-0 flex-1 flex-col border-b border-border md:border-b-0 md:border-r md:border-r-border">
                    <div className="shrink-0 border-b border-border px-4 py-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Categories
                        </p>
                        <p className="text-[11px] text-muted-foreground/80">
                          {selectedOptions.length} selected
                        </p>
                      </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto subtle-scrollbar px-4 py-3">
                      {isLoading ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground/60">
                          {loadingMessage}
                        </div>
                      ) : options.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground/60">
                          {emptyMessage}
                        </div>
                      ) : filteredOptions.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground/60">
                          {noResultsMessage}
                        </div>
                      ) : (
                        filteredOptions.map((option) => {
                          const isSelected = selectedSet.has(String(option.value));
                          const isActive = activeCategoryValue === String(option.value);

                          return (
                            <div
                              key={option.value}
                              className="relative my-1 w-full"
                            >
                              <button
                                type="button"
                                onClick={() => toggleOption(option.value)}
                                className={cn(
                                  "flex min-w-0 w-full items-center gap-2 rounded-lg border px-4 py-3 pr-12 text-left text-sm transition-colors",
                                  isActive
                                    ? "border-primary bg-primary text-primary-foreground shadow-[0_0_0_1px_rgba(var(--brand-rgb),0.25)]"
                                    : isSelected
                                      ? "border-border bg-muted text-foreground hover:border-primary/50 hover:bg-muted/80"
                                      : "border-transparent text-foreground hover:bg-muted",
                                )}
                                aria-pressed={isSelected}
                                >
                                  <span className="min-w-0 flex-1 truncate font-medium">
                                    {option.label}
                                  </span>
                                </button>
                              {isSelected ? (
                                <button
                                type="button"
                                onClick={() => removeOption(option.value)}
                                className={cn(
                                    "absolute right-1 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-lg bg-transparent shadow-none transition-colors focus:outline-none focus-visible:outline-none focus-visible:ring-0",
                                    isActive
                                      ? "text-primary-foreground hover:text-primary-foreground/90"
                                      : "text-muted-foreground hover:text-foreground",
                                  )}
                                  aria-label={`Remove ${option.label}`}
                                >
                                  <X className="h-4 w-4 stroke-[2.5]" />
                                </button>
                              ) : null}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                    {activeCategoryValue ? (
                      <>
                        <div className="shrink-0 border-b border-border px-4 py-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                              Skills
                            </p>
                            <p className="text-[11px] text-muted-foreground/80">
                              {activeSelectionCount} selected
                            </p>
                          </div>
                        </div>

                        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-3">
                          <div className="min-h-0 flex-1 overflow-y-auto subtle-scrollbar pr-0">
                            <div className="flex flex-col gap-2">
                              {isToolsLoading &&
                              activeToolOptions.length === 0 &&
                              activeSuggestedSkills.length === 0 &&
                              activeVisibleCustomSkills.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                  Loading skills...
                                </p>
                              ) : activeToolOptions.length > 0 ||
                                activeVisibleCustomSkills.length > 0 ? (
                                <>
                                  {activeVisibleCustomSkills.length > 0 ? (
                                    <div className="space-y-2">
                                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                        Resume Skills
                                      </p>
                                      {activeVisibleCustomSkills.map((skill) => (
                                        <button
                                          key={skill}
                                          type="button"
                                          onClick={() => handleToggleSuggestedSkill(skill)}
                                          className="flex w-full items-center justify-between rounded-xl border border-primary/60 bg-primary/10 px-4 py-3 text-left text-sm text-primary transition-colors hover:bg-primary/15"
                                          aria-pressed
                                        >
                                          <span className="min-w-0 flex-1 truncate font-medium">
                                            {skill}
                                          </span>
                                          <Check className="ml-3 h-4 w-4 shrink-0 text-primary" />
                                        </button>
                                      ))}
                                    </div>
                                  ) : null}
                                  {activeToolOptions.length > 0 ? (
                                    <div className="space-y-2">
                                      {activeVisibleCustomSkills.length > 0 ? (
                                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                          Marketplace Skills
                                        </p>
                                      ) : null}
                                      {activeToolOptions.map((tool) => {
                                        const isSelected = activeSelectedToolIdSet.has(tool.id);
                                        return (
                                          <button
                                            key={tool.id}
                                            type="button"
                                            onClick={() => handleToggleTool(tool.id)}
                                            className={cn(
                                              "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                                              isSelected
                                                ? "border-primary/60 bg-primary/10 text-primary"
                                                : "border-border bg-muted text-foreground hover:border-primary/50 hover:bg-muted/80",
                                            )}
                                            aria-pressed={isSelected}
                                          >
                                            <span className="min-w-0 flex-1 truncate font-medium">
                                              {tool.label}
                                            </span>
                                            <Check
                                              className={cn(
                                                "ml-3 h-4 w-4 shrink-0 transition-colors",
                                                isSelected ? "text-primary" : "text-muted-foreground/50",
                                              )}
                                            />
                                          </button>
                                        );
                                      })}
                                    </div>
                                  ) : null}
                                </>
                              ) : activeSuggestedSkills.length > 0 ? (
                                activeSuggestedSkills.map((skill) => {
                                  const isSelected = activeSelectedCustomSkills.some(
                                    (value) => value.toLowerCase() === skill.toLowerCase(),
                                  );

                                  return (
                                    <button
                                      key={skill}
                                      type="button"
                                      onClick={() => handleToggleSuggestedSkill(skill)}
                                      className={cn(
                                        "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                                        isSelected
                                          ? "border-primary/60 bg-primary/10 text-primary"
                                          : "border-border bg-muted text-foreground hover:border-primary/50 hover:bg-muted/80",
                                      )}
                                      aria-pressed={isSelected}
                                    >
                                      <span className="min-w-0 flex-1 truncate font-medium">
                                        {skill}
                                      </span>
                                      <Check
                                        className={cn(
                                          "ml-3 h-4 w-4 shrink-0 transition-colors",
                                          isSelected ? "text-primary" : "text-muted-foreground/50",
                                        )}
                                      />
                                    </button>
                                  );
                                })
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  {activeToolOptions.length === 0
                                    ? toolFetchError ||
                                      "No preset skills found for this sub-category."
                                    : "No matching skills found."}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 border-t border-border pt-3">
                            <div className="flex flex-wrap gap-2">
                              {activeSelectedToolEntries.map((tool) => (
                                <span
                                  key={tool.id}
                                  className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                                >
                                  {tool.label}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleTool(tool.id)}
                                    className="rounded-full p-0.5 transition-colors hover:bg-primary/15"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              ))}
                              {activeSelectedCustomSkills.map((skill) => (
                                <span
                                  key={skill}
                                  className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                                >
                                  {skill}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCustomSkill(skill)}
                                    className="rounded-full p-0.5 transition-colors hover:bg-primary/15"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-1 items-center justify-center px-4 py-8 text-sm text-muted-foreground">
                        Select a category to manage its skills.
                      </div>
                    )}
                  </div>
                </div>
              </div>,
              document.body,
            )
          : null}
      </div>
    </div>
  );
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
}) => {
  const serviceInfoContent =
    onboardingContent?.serviceInfo ||
    DEFAULT_FREELANCER_ONBOARDING_CONTENT.serviceInfo;
  const stepperSteps =
    onboardingContent?.stepper?.steps ||
    DEFAULT_FREELANCER_ONBOARDING_CONTENT.stepper.steps;
  const resolvedFields =
    Array.isArray(serviceInfoFields) && serviceInfoFields.length > 0
      ? serviceInfoFields
      : resolveServiceInfoFields(onboardingContent);
  const fieldMap = Object.fromEntries(
    resolvedFields.map((field) => [field.id, field]),
  );
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
  const toolOptionsCacheRef = useRef(new Map());
  const toolFetchRequestIdRef = useRef(0);

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
    return configuredCategoryOptions.length > 0 ? configuredCategoryOptions : [...categoryOptions];
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

        <div className="w-full">
          <ServiceInfoStepper
            activeStepId="overview"
            onStepChange={onServiceStepChange}
            steps={stepperSteps}
          />
        </div>

        <div className="w-full space-y-5">
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

          <div className="space-y-6 rounded-2xl border border-border bg-card p-5 sm:p-7">
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
                  placeholder={
                    fieldMap.title?.placeholder ||
                    serviceInfoContent?.fields?.title?.placeholder ||
                    "I will do something I'm really good at"
                  }
                  className={cn(
                    "h-12 w-full rounded-xl border bg-card px-4 !pr-24 !text-[14px] !leading-5 text-foreground outline-none transition-colors placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 focus:ring-1",
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

            <div className="space-y-0">
              {fieldMap.categories?.visible === false ? null : (
              <>
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
              </>
              )}
            </div>

            <div className="space-y-0">
              {fieldMap.experience?.visible === false ? null : (
              <>
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
              />
              {experienceError ? (
                <p className="mt-1 text-sm text-destructive">{experienceError}</p>
              ) : null}
              </>
              )}
            </div>

            {customServiceInfoFields.map((field) => {
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
                      "h-12 w-full rounded-xl border bg-card px-4 !text-[14px] !leading-5 text-foreground outline-none transition-colors placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 focus:ring-1",
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
            })}


          </div>
        </div>
      </div>
    </section>
  );
};

export default FreelancerServiceInfoSlide;
