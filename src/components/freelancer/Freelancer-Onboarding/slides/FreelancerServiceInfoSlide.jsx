import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Check from "lucide-react/dist/esm/icons/check";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import X from "lucide-react/dist/esm/icons/x";
import Plus from "lucide-react/dist/esm/icons/plus";
import { toast } from "sonner";

import { API_BASE_URL, request } from "@/shared/lib/api-client";
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

const CategoryMultiSelect = ({
  options = [],
  selected = [],
  onChange,
  placeholder = "Search categories & skills...",
  searchPlaceholder = "Search categories & skills...",
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
  onRequestCreated,
}) => {
  const [isBrowseOpen, setIsBrowseOpen] = useState(false);
  const [browseSearchQuery, setBrowseSearchQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [popupStyle, setPopupStyle] = useState(null);
  const [allPreFetchedTools, setAllPreFetchedTools] = useState({});
  const [requestingType, setRequestingType] = useState("");

  const containerRef = useRef(null);
  const popupRef = useRef(null);
  const searchInputRef = useRef(null);
  const browseSearchInputRef = useRef(null);
  const preFetchAbortRef = useRef(null);
  const preFetchedOptionsKeyRef = useRef("");

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

  const selectedOptions = useMemo(() => {
    const catalogSelections = options
      .filter((option) => selectedSet.has(String(option.value)))
      .map((option) => ({
        value: String(option.value || "").trim(),
        label: String(option.label || option.value || "").trim(),
      }));
    const seen = new Set(catalogSelections.map((option) => option.value));
    const customSelections = (Array.isArray(selectedSubcategories) ? selectedSubcategories : [])
      .map((entry) => {
        const value = getSubcategorySelectionKey(entry);
        const label = String(
          entry?.label ||
            entry?.subCategoryLabel ||
            entry?.name ||
            entry?.subCategoryKey ||
            value ||
            "",
        ).trim();
        if (!value || !selectedSet.has(value) || seen.has(value)) return null;
        seen.add(value);
        return { value, label: label || value };
      })
      .filter(Boolean);
    return [...catalogSelections, ...customSelections];
  }, [options, selectedSet, selectedSubcategories]);

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
    if (!activeSubcategoryId) return [];
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
      if (!normalizedValue || seen.has(normalizedValue)) return accumulator;
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
    if (!activeSelectedCustomSkills.length) return [];
    const toolLabelKeys = new Set(
      activeToolOptions.map((tool) => normalizeSkillMatchKey(tool.label)),
    );
    return activeSelectedCustomSkills.filter(
      (skill) => !toolLabelKeys.has(normalizeSkillMatchKey(skill)),
    );
  }, [activeSelectedCustomSkills, activeToolOptions]);

  const filteredBrowseOptions = useMemo(() => {
    const normalizedQuery = String(browseSearchQuery || "").trim().toLowerCase();
    if (!normalizedQuery) return options;
    return options.filter((option) =>
      String(
        [option?.label, option?.selectedLabel, option?.categoryLabel]
          .filter(Boolean)
          .join(" "),
      )
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [options, browseSearchQuery]);

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
      if (!categoryKey || !selectedSet.has(categoryKey)) return [];
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
          if (!normalizedToolId) return null;
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

  // Pre-fetch ALL skills for ALL categories in the background so we can search across them
  useEffect(() => {
    const optionsWithIds = options.filter((opt) => toPositiveInteger(opt.subCategoryId));
    if (!optionsWithIds.length) return;

    const optionsKey = optionsWithIds.map((o) => o.value).join(",");
    if (preFetchedOptionsKeyRef.current === optionsKey) return;
    preFetchedOptionsKeyRef.current = optionsKey;

    if (preFetchAbortRef.current) preFetchAbortRef.current.abort();
    const controller = new AbortController();
    preFetchAbortRef.current = controller;

    Promise.allSettled(
      optionsWithIds.map(async (opt) => {
        const subCatId = toPositiveInteger(opt.subCategoryId);
        const response = await fetch(
          `${API_BASE_URL}/marketplace/filters/tools?subCategoryId=${subCatId}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Failed");
        const payload = await response.json();
        const tools = (Array.isArray(payload?.data) ? payload.data : [])
          .map((entry) => ({
            id: toPositiveInteger(entry?.id),
            label: String(entry?.name || "").trim(),
          }))
          .filter((t) => t.id && t.label);
        return [opt.value, tools];
      }),
    ).then((results) => {
      if (controller.signal.aborted) return;
      const toolsByOptionValue = {};
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          const [optionValue, tools] = result.value;
          toolsByOptionValue[optionValue] = tools;
        }
      });
      setAllPreFetchedTools((prev) => ({ ...prev, ...toolsByOptionValue }));
    });

    return () => {
      controller.abort();
    };
  }, [options]);

  // Unified search index: categories + all pre-fetched skills
  const searchIndex = useMemo(() => {
    const entries = [];
    options.forEach((opt) => {
      entries.push({
        type: "category",
        label: opt.label,
        categoryValue: opt.value,
        categoryLabel: opt.label,
        toolId: null,
      });
    });
    Object.entries(allPreFetchedTools).forEach(([optionValue, tools]) => {
      const categoryLabel = optionLabelByValue.get(optionValue) || optionValue;
      (Array.isArray(tools) ? tools : []).forEach((tool) => {
        entries.push({
          type: "skill",
          label: tool.label,
          categoryValue: optionValue,
          categoryLabel,
          toolId: tool.id,
        });
      });
    });
    return entries;
  }, [options, allPreFetchedTools, optionLabelByValue]);

  // Filtered inline search results
  const searchResults = useMemo(() => {
    const q = String(searchQuery || "").trim().toLowerCase();
    if (!q) return { categories: [], skills: [] };
    const matching = searchIndex.filter((entry) =>
      entry.label.toLowerCase().includes(q),
    );
    return {
      categories: matching.filter((e) => e.type === "category").slice(0, 8),
      skills: matching.filter((e) => e.type === "skill").slice(0, 12),
    };
  }, [searchIndex, searchQuery]);

  const hasSearchResults =
    searchResults.categories.length > 0 || searchResults.skills.length > 0;

  const normalizedSearchRequest = useMemo(
    () => String(searchQuery || "").trim().replace(/\s+/g, " "),
    [searchQuery],
  );

  // Click outside: close both panels
  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;
      const isInsideTrigger = containerRef.current?.contains(target);
      const isInsidePopup = popupRef.current?.contains(target);
      if (!isInsideTrigger && !isInsidePopup) {
        setIsBrowseOpen(false);
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isBrowseOpen) setBrowseSearchQuery("");
  }, [isBrowseOpen]);

  // Position the browse portal popup
  useLayoutEffect(() => {
    if (!isBrowseOpen || typeof window === "undefined") return undefined;

    const updatePopupPosition = () => {
      const triggerElement = containerRef.current;
      if (!triggerElement) return;
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
  }, [isBrowseOpen]);

  useEffect(() => {
    if (!isBrowseOpen) return undefined;
    const frameId = requestAnimationFrame(() => {
      browseSearchInputRef.current?.focus();
    });
    return () => cancelAnimationFrame(frameId);
  }, [isBrowseOpen]);

  const commitCategorySelection = (nextSelectedValues, nextActiveValue) => {
    onChange?.(nextSelectedValues);
    onActiveCategoryChange?.(nextActiveValue);
    if (closeOnSelect) setIsBrowseOpen(false);
  };

  const toggleOption = (optionValue) => {
    const normalizedValue = String(optionValue).trim();
    if (!normalizedValue) return;
    const wasSelected = selectedSet.has(normalizedValue);
    const nextSelectedValues = wasSelected
      ? normalizedSelected
      : [...normalizedSelected, normalizedValue];
    commitCategorySelection(nextSelectedValues, normalizedValue);
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

  const handleSkillSelectionChange = (nextSelectedToolIds, nextCustomSkillNames) => {
    if (!activeCategoryValue || !onSubcategorySkillChange) return;
    onSubcategorySkillChange(activeCategoryValue, {
      selectedToolIds: nextSelectedToolIds,
      customSkillNames: nextCustomSkillNames,
    });
  };

  const handleToggleTool = (toolId) => {
    const normalizedToolId = toPositiveInteger(toolId);
    if (!normalizedToolId) return;
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
    if (!normalizedSkillName) return;
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
    if (!entry?.categoryKey || !onSubcategorySkillChange) return;
    const currentSubcategory =
      (Array.isArray(selectedSubcategories) ? selectedSubcategories : []).find(
        (subcategory) => getSubcategorySelectionKey(subcategory) === entry.categoryKey,
      ) || null;
    if (!currentSubcategory) return;
    const currentToolIds = (Array.isArray(currentSubcategory.selectedToolIds)
      ? currentSubcategory.selectedToolIds
      : [])
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

  // Handle clicking a result from the inline search dropdown
  const handleSelectSearchResult = (entry) => {
    if (entry.type === "category") {
      toggleOption(entry.categoryValue);
    } else {
      // Auto-select the parent category if not already selected
      if (!selectedSet.has(entry.categoryValue)) {
        const nextValues = [...normalizedSelected, entry.categoryValue];
        onChange?.(nextValues);
        onActiveCategoryChange?.(entry.categoryValue);
      }
      // Auto-select the skill within that category
      if (onSubcategorySkillChange) {
        const currentEntry = (Array.isArray(selectedSubcategories) ? selectedSubcategories : [])
          .find((e) => getSubcategorySelectionKey(e) === entry.categoryValue);
        const currentToolIds = currentEntry
          ? (Array.isArray(currentEntry.selectedToolIds) ? currentEntry.selectedToolIds : [])
              .map(toPositiveInteger)
              .filter(Boolean)
          : [];
        const currentCustom = currentEntry
          ? normalizeStringArray(currentEntry.customSkillNames)
          : [];
        if (!currentToolIds.includes(entry.toolId)) {
          onSubcategorySkillChange(entry.categoryValue, {
            selectedToolIds: [...currentToolIds, entry.toolId],
            customSkillNames: currentCustom,
          });
        }
      }
    }
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  const selectExistingRequestEntity = (payload, requestName) => {
    if (payload?.status !== "EXISTS") return false;

    const entity = payload.existingEntity || {};
    if (payload.existingType === "category") {
      const subCategoryId = toPositiveInteger(entity.id);
      const categoryValue = subCategoryId ? `catalog:${subCategoryId}` : "";
      if (!categoryValue) return false;
      const nextSelectedValues = selectedSet.has(categoryValue)
        ? normalizedSelected
        : [...normalizedSelected, categoryValue];
      commitCategorySelection(nextSelectedValues, categoryValue);
      toast.success(`${entity.name || requestName} already exists. Added it to your service.`);
      return true;
    }

    if (payload.existingType === "skill") {
      const toolId = toPositiveInteger(entity.id);
      const subCategoryId = toPositiveInteger(entity.subCategoryId);
      const categoryValue = subCategoryId ? `catalog:${subCategoryId}` : "";
      if (!toolId || !categoryValue || !onSubcategorySkillChange) return false;

      const nextSelectedValues = selectedSet.has(categoryValue)
        ? normalizedSelected
        : [...normalizedSelected, categoryValue];
      onChange?.(nextSelectedValues);
      onActiveCategoryChange?.(categoryValue);

      const currentSubcategory =
        (Array.isArray(selectedSubcategories) ? selectedSubcategories : []).find(
          (entry) => getSubcategorySelectionKey(entry) === categoryValue,
        ) || null;
      const currentToolIds = (Array.isArray(currentSubcategory?.selectedToolIds)
        ? currentSubcategory.selectedToolIds
        : [])
        .map(toPositiveInteger)
        .filter(Boolean);
      const currentCustomSkills = normalizeStringArray(currentSubcategory?.customSkillNames);
      if (!currentToolIds.includes(toolId)) {
        onSubcategorySkillChange(categoryValue, {
          selectedToolIds: [...currentToolIds, toolId],
          customSkillNames: currentCustomSkills,
        });
      }
      toast.success(`${entity.name || requestName} already exists. Added it to your skills.`);
      return true;
    }

    return false;
  };

  const submitMissingOptionRequest = async (requestedType) => {
    const requestName = normalizedSearchRequest;
    if (!requestName || requestingType) return;

    setRequestingType(requestedType);
    try {
      const payload = await request("/user-requests", {
        method: "POST",
        body: JSON.stringify({
          request: requestName,
          requestedType,
        }),
      });

      if (selectExistingRequestEntity(payload, requestName)) {
        setSearchQuery("");
        setIsSearchOpen(false);
        return;
      }

      if (requestedType === "category") {
        const customValue = requestName;
        if (!selectedSet.has(customValue)) {
          commitCategorySelection([...normalizedSelected, customValue], customValue);
        }
      } else if (activeCategoryValue && onSubcategorySkillChange) {
        const currentSubcategory =
          (Array.isArray(selectedSubcategories) ? selectedSubcategories : []).find(
            (entry) => getSubcategorySelectionKey(entry) === activeCategoryValue,
          ) || null;
        const currentToolIds = (Array.isArray(currentSubcategory?.selectedToolIds)
          ? currentSubcategory.selectedToolIds
          : [])
          .map(toPositiveInteger)
          .filter(Boolean);
        const currentCustomSkills = normalizeStringArray(currentSubcategory?.customSkillNames);
        const hasSkill = currentCustomSkills.some(
          (skill) => skill.toLowerCase() === requestName.toLowerCase(),
        );
        if (!hasSkill) {
          onSubcategorySkillChange(activeCategoryValue, {
            selectedToolIds: currentToolIds,
            customSkillNames: [...currentCustomSkills, requestName],
          });
        }
      }

      onRequestCreated?.({
        requestedType,
        request: requestName,
        data: payload,
      });
      toast.success(`${requestName} sent for admin review`);
      setSearchQuery("");
      setIsSearchOpen(false);
    } catch (error) {
      console.error("Failed to submit user request:", error);
      toast.error(error?.message || "Failed to submit request");
    } finally {
      setRequestingType("");
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative" ref={containerRef}>
        {/* â”€â”€ Trigger row: text search input + Browse button â”€â”€ */}
        <div
          className={cn(
            "flex h-10 w-full items-center rounded-xl border bg-card transition-colors",
            hasError
              ? "border-destructive/70"
              : isSearchOpen || isBrowseOpen
                ? "border-primary/50 ring-1 ring-primary/20"
                : "border-border",
          )}
        >
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsBrowseOpen(false);
              setIsSearchOpen(e.target.value.trim().length > 0);
            }}
            onFocus={() => {
              if (searchQuery.trim()) setIsSearchOpen(true);
            }}
            placeholder={isLoading ? loadingMessage : searchPlaceholder}
            disabled={isLoading}
            className="h-full min-w-0 flex-1 rounded-l-xl bg-transparent px-4 !text-[14px] !leading-5 text-foreground outline-none placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={() => {
              setIsBrowseOpen((current) => !current);
              setIsSearchOpen(false);
              setSearchQuery("");
            }}
            className={cn(
              "flex h-full items-center gap-1 rounded-r-xl border-l border-border px-3 text-xs font-medium transition-colors",
              isBrowseOpen
                ? "bg-primary/10 text-primary border-primary/30"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
            title="Browse all categories & skills"
          >
            <span className="hidden sm:inline">Browse</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isBrowseOpen && "rotate-180",
              )}
            />
          </button>
        </div>

        {/* â”€â”€ Inline search results dropdown â”€â”€ */}
        {isSearchOpen && searchQuery.trim() ? (
          <div data-onboarding-popup="true" className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-border bg-card shadow-xl shadow-black/10 subtle-scrollbar dark:shadow-black/40">
            {!hasSearchResults ? (
              <div className="space-y-3 px-4 py-3">
                <p className="text-sm text-muted-foreground">{noResultsMessage}</p>
                {normalizedSearchRequest ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        void submitMissingOptionRequest("category");
                      }}
                      disabled={Boolean(requestingType)}
                      className="rounded-md border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {requestingType === "category" ? "Sending..." : `Request category "${normalizedSearchRequest}"`}
                    </button>
                    <button
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        void submitMissingOptionRequest("skill");
                      }}
                      disabled={Boolean(requestingType)}
                      className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {requestingType === "skill" ? "Sending..." : `Request skill "${normalizedSearchRequest}"`}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="p-1.5">
                {searchResults.categories.length > 0 && (
                  <div className="mb-1">
                    <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Categories
                    </p>
                    {searchResults.categories.map((entry) => {
                      const isSelected = selectedSet.has(entry.categoryValue);
                      return (
                        <button
                          key={entry.categoryValue}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectSearchResult(entry);
                          }}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                            isSelected
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-muted",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                              isSelected ? "border-primary bg-primary" : "border-border",
                            )}
                          >
                            {isSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                          </span>
                          <span className="min-w-0 flex-1 truncate font-medium">{entry.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {searchResults.skills.length > 0 && (
                  <div>
                    <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Skills
                    </p>
                    {searchResults.skills.map((entry) => {
                      const parentEntry = (Array.isArray(selectedSubcategories)
                        ? selectedSubcategories
                        : []).find(
                        (e) => getSubcategorySelectionKey(e) === entry.categoryValue,
                      );
                      const isSelected =
                        Boolean(parentEntry) &&
                        (Array.isArray(parentEntry.selectedToolIds)
                          ? parentEntry.selectedToolIds
                          : []
                        )
                          .map(toPositiveInteger)
                          .includes(entry.toolId);
                      return (
                        <button
                          key={`${entry.categoryValue}-${entry.toolId}`}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectSearchResult(entry);
                          }}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                            isSelected
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-muted",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                              isSelected ? "border-primary bg-primary" : "border-border",
                            )}
                          >
                            {isSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                          </span>
                          <span className="min-w-0 flex-1 truncate font-medium">{entry.label}</span>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {entry.categoryLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}

        {/* â”€â”€ Selected category tags â”€â”€ */}
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

        {/* â”€â”€ Selected skills tags â”€â”€ */}
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

        {/* â”€â”€ Browse panel (two-column portal) â”€â”€ */}
        {isBrowseOpen && typeof document !== "undefined"
          ? createPortal(
              <div
                ref={popupRef}
                data-onboarding-popup="true"
                className="z-[70] flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl shadow-black/10 dark:shadow-black/40"
                style={popupStyle || undefined}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="border-b border-border p-2.5">
                  <input
                    ref={browseSearchInputRef}
                    type="text"
                    value={browseSearchQuery}
                    onChange={(event) => setBrowseSearchQuery(event.target.value)}
                    placeholder="Search categories..."
                    className="h-10 w-full rounded-lg border border-input bg-card px-3 !text-[14px] !leading-5 text-foreground outline-none transition-colors placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                  />
                </div>

                <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
                  {/* Categories column */}
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
                      ) : filteredBrowseOptions.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground/60">
                          {noResultsMessage}
                        </div>
                      ) : (
                        filteredBrowseOptions.map((option) => {
                          const isSelected = selectedSet.has(String(option.value));
                          const isActive = activeCategoryValue === String(option.value);
                          return (
                            <div key={option.value} className="relative my-1 w-full">
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

                  {/* Skills column */}
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
                                <p className="text-sm text-muted-foreground">Loading skills...</p>
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
                                                isSelected
                                                  ? "text-primary"
                                                  : "text-muted-foreground/50",
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
            {(() => {
              const headingText = applyServiceTemplate(
                serviceInfoContent?.headingTitleTemplate,
                serviceName,
              );
              const matchIdx = headingText.toLowerCase().lastIndexOf("service info");
              if (matchIdx >= 0) {
                const mainPart = headingText.slice(0, matchIdx);
                const highlightPart = headingText.slice(matchIdx);
                return (
                  <>
                    <span>{mainPart}</span>
                    <span className="text-primary">
                      {highlightPart}
                    </span>
                  </>
                );
              }
              return <span>{headingText}</span>;
            })()}
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
