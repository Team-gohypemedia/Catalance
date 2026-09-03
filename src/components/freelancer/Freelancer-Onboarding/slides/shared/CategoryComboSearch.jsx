import React, { useState, useRef, useMemo, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, ChevronRight, Minus, Search, X } from 'lucide-react';
import { cn } from "@/shared/lib/utils";
import { API_BASE_URL, request } from "@/shared/lib/api-client";
import { getSubcategorySelectionKey, normalizeStringArray } from "../../service-details";
import { toast } from "sonner";

const toPositiveInteger = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const normalizeSkillMatchKey = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const CategoryMultiSelect = ({
  options = [],
  selected = [],
  onChange,
  serviceLabel = "Website Development",
  placeholder = "Search categories & skills...",
  searchPlaceholder = "",
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
  const [shouldFocusBrowseSearch, setShouldFocusBrowseSearch] = useState(false);
  const [popupStyle, setPopupStyle] = useState(null);
  const [allPreFetchedTools, setAllPreFetchedTools] = useState({});
  const [requestingType, setRequestingType] = useState("");
  const [expandedCategoryKeys, setExpandedCategoryKeys] = useState(() => new Set());

  const containerRef = useRef(null);
  const triggerRowRef = useRef(null);
  const popupRef = useRef(null);
  const searchInputRef = useRef(null);
  const browseSearchInputRef = useRef(null);
  const preFetchAbortRef = useRef(null);
  const fetchedSubcategoriesRef = useRef(new Set());

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

  const customSelections = useMemo(() => {
    const catalogValues = new Set(options.map((option) => String(option.value || "").trim()));
    return (Array.isArray(selectedSubcategories) ? selectedSubcategories : [])
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
        if (!value || !selectedSet.has(value) || catalogValues.has(value)) return null;
        return { value, label: label || value };
      })
      .filter(Boolean);
  }, [options, selectedSet, selectedSubcategories]);

  const selectedOptions = useMemo(() => {
    const catalogSelections = options
      .filter((option) => selectedSet.has(String(option.value)))
      .map((option) => ({
        value: String(option.value || "").trim(),
        label: String(option.label || option.value || "").trim(),
      }));
    const seen = new Set(catalogSelections.map((option) => option.value));
    const uniqueCustomSelections = customSelections.filter((opt) => {
      if (seen.has(opt.value)) return false;
      seen.add(opt.value);
      return true;
    });
    const finalOptions = [...catalogSelections, ...uniqueCustomSelections];
    return finalOptions.filter(opt => opt.value !== "_unassigned_skills_");
  }, [options, selectedSet, customSelections]);

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

  const activeCategoryLabel = useMemo(
    () =>
      optionLabelByValue.get(activeCategoryValue) ||
      String(activeSubcategory?.label || activeSubcategory?.subCategoryKey || "").trim() ||
      "Selected category",
    [activeCategoryValue, activeSubcategory, optionLabelByValue],
  );

  const activeToolSource = useMemo(() => {
    if (!activeSubcategoryId) return [];
    const nextTools = toolOptionsByCategory[String(activeSubcategoryId)];
    return Array.isArray(nextTools) ? nextTools : [];
  }, [activeSubcategoryId, toolOptionsByCategory]);

  const activeToolOptions = useMemo(
    () => {
      const standardTools = activeToolSource
        .map((tool) => ({
          id: toPositiveInteger(tool?.id),
          label: String(tool?.label || tool?.name || "").trim(),
          isCustom: false,
        }))
        .filter((tool) => tool.id && tool.label);
      
      const customSkills = normalizeStringArray(activeSubcategory?.customSkillNames).map((skillName) => ({
        id: `custom-${skillName}`,
        label: skillName,
        isCustom: true,
      }));

      return [...standardTools, ...customSkills];
    },
    [activeToolSource, activeSubcategory],
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

  const filteredActiveVisibleCustomSkills = useMemo(() => {
    const normalizedQuery = String(browseSearchQuery || "").trim().toLowerCase();
    if (!normalizedQuery) return activeVisibleCustomSkills;
    return activeVisibleCustomSkills.filter((skill) => skill.toLowerCase().includes(normalizedQuery));
  }, [activeVisibleCustomSkills, browseSearchQuery]);

  const filteredBrowseOptions = useMemo(() => {
    const normalizedQuery = String(browseSearchQuery || "").trim().toLowerCase();
    const customOptions = customSelections.map(opt => ({ ...opt, isCustom: true }));
    const allOptions = [...options, ...customOptions].filter(opt => opt.value !== "_unassigned_skills_");
    if (!normalizedQuery) return allOptions;
    return allOptions.filter((option) =>
      String(
        [option?.label, option?.selectedLabel, option?.categoryLabel]
          .filter(Boolean)
          .join(" "),
      )
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [options, customSelections, browseSearchQuery]);

  const filteredActiveToolOptions = useMemo(() => {
    const normalizedQuery = String(browseSearchQuery || "").trim().toLowerCase();
    if (!normalizedQuery) return activeToolOptions;
    return activeToolOptions.filter((tool) => tool.label.toLowerCase().includes(normalizedQuery));
  }, [activeToolOptions, browseSearchQuery]);

  const filteredActiveSuggestedSkills = useMemo(() => {
    const normalizedQuery = String(browseSearchQuery || "").trim().toLowerCase();
    if (!normalizedQuery) return activeSuggestedSkills;
    return activeSuggestedSkills.filter((skill) => skill.toLowerCase().includes(normalizedQuery));
  }, [activeSuggestedSkills, browseSearchQuery]);

  const activeSelectedToolEntries = useMemo(() => {
    const toolLabelById = new Map(
      activeToolOptions.map((tool) => [tool.id, tool.label]),
    );
    const preFetchedOptions = allPreFetchedTools[activeCategoryValue] || [];
    (Array.isArray(preFetchedOptions) ? preFetchedOptions : []).forEach((tool) => {
        if (!toolLabelById.has(tool.id)) {
            toolLabelById.set(toPositiveInteger(tool?.id), String(tool?.label || tool?.name || "").trim());
        }
    });

    return activeSelectedToolIds.map((toolId) => ({
      id: toolId,
      label: toolLabelById.get(toolId) || (isToolsLoading ? "Loading..." : `Skill ${toolId}`),
    }));
  }, [activeSelectedToolIds, activeToolOptions, allPreFetchedTools, activeCategoryValue, isToolsLoading]);

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
      
      const preFetchedOptions = allPreFetchedTools[categoryKey] || [];
      (Array.isArray(preFetchedOptions) ? preFetchedOptions : []).forEach((tool) => {
          toolLabelById.set(toPositiveInteger(tool?.id), String(tool?.label || tool?.name || "").trim());
      });

      const toolEntries = (Array.isArray(entry?.selectedToolIds) ? entry.selectedToolIds : [])
        .map((toolId) => {
          const normalizedToolId = toPositiveInteger(toolId);
          if (!normalizedToolId) return null;
          return {
            type: "tool",
            categoryKey,
            categoryLabel,
            value: String(normalizedToolId),
            label: toolLabelById.get(normalizedToolId) || (isToolsLoading ? "Loading..." : `Skill ${normalizedToolId}`),
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
  }, [
    allPreFetchedTools,
    isToolsLoading,
    optionLabelByValue,
    selectedSet,
    selectedSubcategories,
    toolOptionsByCategory,
  ]);

  const selectedSkillsByCategory = useMemo(() => {
    const skillsByCategory = new Map();
    selectedSkillEntries.forEach((entry) => {
      const categorySkills = skillsByCategory.get(entry.categoryKey) || [];
      categorySkills.push(entry);
      skillsByCategory.set(entry.categoryKey, categorySkills);
    });
    return skillsByCategory;
  }, [selectedSkillEntries]);

  const displayedServiceLabel = String(serviceLabel || "").trim() || "Website Development";

  const optionsSignature = useMemo(() => {
    return (Array.isArray(options) ? options : [])
      .map((opt) => {
        const computedId =
          toPositiveInteger(opt.subCategoryId) ||
          (opt.value?.startsWith("catalog:") ? toPositiveInteger(opt.value.split(":")[1]) : null) ||
          toPositiveInteger(opt.value);
        return `${opt.value}:${computedId}`;
      })
      .join("|");
  }, [options]);

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Pre-fetch ALL skills for ALL categories in the background so we can search across them
  useEffect(() => {
    const currentOptions = optionsRef.current || [];
    const optionsWithIds = currentOptions
      .map((opt) => ({
        ...opt,
        computedId:
          toPositiveInteger(opt.subCategoryId) ||
          (opt.value?.startsWith("catalog:") ? toPositiveInteger(opt.value.split(":")[1]) : null) ||
          toPositiveInteger(opt.value),
      }))
      .filter((opt) => opt.computedId);

    const optionsToFetch = optionsWithIds.filter(
      (opt) => !fetchedSubcategoriesRef.current.has(opt.value)
    );

    if (!optionsToFetch.length) return;

    if (preFetchAbortRef.current) preFetchAbortRef.current.abort();
    const controller = new AbortController();
    preFetchAbortRef.current = controller;

    Promise.allSettled(
      optionsToFetch.map(async (opt) => {
        const subCatId = opt.computedId;
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
          fetchedSubcategoriesRef.current.add(optionValue);
        }
      });
      setAllPreFetchedTools((prev) => ({ ...prev, ...toolsByOptionValue }));
    });

    return () => {
      controller.abort();
    };
  }, [optionsSignature]);

  // Unified search index: categories + all pre-fetched skills + custom items
  const searchIndex = useMemo(() => {
    const entries = [];
    const customOptions = customSelections.map(opt => ({ ...opt, isCustom: true }));
    const allCategoryOptions = [...options, ...customOptions].filter(opt => opt.value !== "_unassigned_skills_");

    allCategoryOptions.forEach((opt) => {
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

    const customSkills = (Array.isArray(selectedSubcategories) ? selectedSubcategories : []).flatMap((sub) => {
      const categoryValue = getSubcategorySelectionKey(sub);
      const categoryLabel = optionLabelByValue.get(categoryValue) || categoryValue;
      return normalizeStringArray(sub.customSkillNames).map((skillName) => ({
        type: "skill",
        label: skillName,
        categoryValue,
        categoryLabel: categoryValue === "_unassigned_skills_" ? "Requested Skills" : categoryLabel,
        toolId: `custom-${skillName}`,
      }));
    });

    return [...entries, ...customSkills];
  }, [options, customSelections, allPreFetchedTools, optionLabelByValue, selectedSubcategories]);

  // Filtered inline search results (returns options when searchQuery is empty as well)
  const searchResults = useMemo(() => {
    const q = String(searchQuery || "").trim().toLowerCase();
    if (!q) {
      return {
        categories: searchIndex.filter((e) => e.type === "category").slice(0, 8),
        skills: searchIndex.filter((e) => e.type === "skill").slice(0, 15),
      };
    }
    const matching = searchIndex.filter((entry) =>
      entry.label.toLowerCase().includes(q),
    );
    return {
      categories: matching.filter((e) => e.type === "category").slice(0, 8),
      skills: matching.filter((e) => e.type === "skill").slice(0, 15),
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
        setShouldFocusBrowseSearch(false);
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
      const triggerElement = triggerRowRef.current;
      if (!triggerElement) return;
      const rect = triggerElement.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const margin = 12;
      const gap = 4;
      const spaceBelow = Math.max(0, viewportHeight - rect.bottom - margin - gap);
      const spaceAbove = Math.max(0, rect.top - margin - gap);
      const isMobile = viewportWidth < 768;
      const preferredMaxHeight = isMobile ? 420 : 340;
      const shouldOpenAbove = spaceBelow < preferredMaxHeight && spaceAbove > spaceBelow;
      const nextHeight = Math.max(
        Math.min(preferredMaxHeight, shouldOpenAbove ? spaceAbove : spaceBelow),
        0,
      );
      const nextWidth = Math.min(
        Math.max(rect.width, 560),
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
    if (!isBrowseOpen || !shouldFocusBrowseSearch) return undefined;
    const frameId = requestAnimationFrame(() => {
      browseSearchInputRef.current?.focus();
    });
    return () => cancelAnimationFrame(frameId);
  }, [isBrowseOpen, shouldFocusBrowseSearch]);

  const commitCategorySelection = (nextSelectedValues, nextActiveValue) => {
    onChange?.(nextSelectedValues);
    onActiveCategoryChange?.(nextActiveValue);
    if (closeOnSelect) {
      setIsBrowseOpen(false);
      setShouldFocusBrowseSearch(false);
    }
  };

  const getToolsForCategory = (option) => {
    const subCatId =
      toPositiveInteger(option?.subCategoryId) ||
      (String(option?.value || "").startsWith("catalog:")
        ? toPositiveInteger(String(option.value).split(":")[1])
        : null) ||
      toPositiveInteger(option?.value);

    const fromProps = subCatId ? toolOptionsByCategory[String(subCatId)] : null;
    const fromPreFetch =
      allPreFetchedTools[option?.value] ||
      (subCatId ? allPreFetchedTools[String(subCatId)] : null) ||
      (subCatId ? allPreFetchedTools[`catalog:${subCatId}`] : null);
    const tools =
      Array.isArray(fromProps) && fromProps.length > 0
        ? fromProps
        : Array.isArray(fromPreFetch)
          ? fromPreFetch
          : [];

    return tools
      .map((tool) => ({
        id: toPositiveInteger(tool?.id),
        label: String(tool?.label || tool?.name || "").trim(),
      }))
      .filter((t) => t.id && t.label);
  };

  const getSuggestedSkillsForCategory = (optionValue) => {
    const rawSkills = skillSuggestionsByCategory?.[optionValue];
    return normalizeStringArray(
      (Array.isArray(rawSkills) ? rawSkills : []).map(
        (entry) => entry?.label || entry?.value || entry,
      ),
    );
  };

  const getSelectedForCategory = (categoryKey) => {
    const matchesKey = (entryKey, targetKey, entrySubCategoryId) => {
      if (!targetKey) return false;
      const strTarget = String(targetKey).trim();
      const strEntry = String(entryKey || "").trim();
      if (strEntry === strTarget) return true;
      const targetId = strTarget.replace("catalog:", "");
      const entryId = strEntry.replace("catalog:", "");
      if (targetId && targetId === entryId) return true;
      if (entrySubCategoryId && String(entrySubCategoryId) === targetId) return true;
      return false;
    };

    const currentSub = (
      Array.isArray(selectedSubcategories) ? selectedSubcategories : []
    ).find((sub) =>
      matchesKey(getSubcategorySelectionKey(sub), categoryKey, sub?.subCategoryId)
    );
    const toolIds = (
      Array.isArray(currentSub?.selectedToolIds) ? currentSub.selectedToolIds : []
    )
      .map((val) => toPositiveInteger(val))
      .filter(Boolean);
    const customSkills = normalizeStringArray(currentSub?.customSkillNames);
    return { toolIds: new Set(toolIds), toolIdsList: toolIds, customSkills };
  };

  const toggleOption = (optionValue, forceOption = null) => {
    const normalizedValue = String(optionValue).trim();
    if (!normalizedValue) return;

    const opt =
      (Array.isArray(options) ? options : []).find((o) => String(o.value) === normalizedValue) ||
      (Array.isArray(customSelections) ? customSelections : []).find((o) => String(o.value) === normalizedValue) ||
      { value: normalizedValue };

    const { toolIds: currentToolIds, customSkills: currentCustomSkills } = getSelectedForCategory(normalizedValue);
    const availableTools = getToolsForCategory(opt);
    const availableSuggested = getSuggestedSkillsForCategory(normalizedValue);
    const allAvailableToolIds = availableTools.map((t) => t.id).filter(Boolean);
    const allAvailableSuggested = [...availableSuggested];
    const totalAvailableCount = allAvailableToolIds.length + allAvailableSuggested.length;
    const currentSelectedCount = currentToolIds.size + currentCustomSkills.length;
    const wasSelected = selectedSet.has(normalizedValue);
    const isAllSelected =
      totalAvailableCount > 0 ? currentSelectedCount >= totalAvailableCount : wasSelected;

    const shouldSelect = forceOption !== null ? forceOption : !isAllSelected;

    let nextSelectedValues;
    if (shouldSelect) {
      nextSelectedValues = wasSelected ? normalizedSelected : [...normalizedSelected, normalizedValue];
      commitCategorySelection(nextSelectedValues, normalizedValue);

      onSubcategorySkillChange?.(normalizedValue, {
        selectedToolIds: allAvailableToolIds,
        customSkillNames: allAvailableSuggested,
      });

      const subCatId =
        toPositiveInteger(opt?.subCategoryId) ||
        (String(opt?.value || "").startsWith("catalog:")
          ? toPositiveInteger(String(opt.value).split(":")[1])
          : null) ||
        toPositiveInteger(opt?.value);

      if (subCatId && allAvailableToolIds.length === 0) {
        fetch(`${API_BASE_URL}/marketplace/filters/tools?subCategoryId=${subCatId}`)
          .then((res) => res.json())
          .then((payload) => {
            const tools = (Array.isArray(payload?.data) ? payload.data : [])
              .map((entry) => ({
                id: toPositiveInteger(entry?.id),
                label: String(entry?.name || "").trim(),
              }))
              .filter((t) => t.id && t.label);
            if (tools.length > 0) {
              setAllPreFetchedTools((prev) => ({
                ...prev,
                [normalizedValue]: tools,
                [String(subCatId)]: tools,
              }));
              onSubcategorySkillChange?.(normalizedValue, {
                selectedToolIds: tools.map((t) => t.id),
                customSkillNames: allAvailableSuggested,
              });
            }
          })
          .catch(() => {});
      }
    } else {
      nextSelectedValues = normalizedSelected.filter((value) => value !== normalizedValue);
      const nextActiveValue =
        normalizedValue === activeCategoryValue
          ? nextSelectedValues[0] || ""
          : activeCategoryValue;
      commitCategorySelection(nextSelectedValues, nextActiveValue);

      onSubcategorySkillChange?.(normalizedValue, {
        selectedToolIds: [],
        customSkillNames: [],
      });
    }
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
    onSubcategorySkillChange?.(normalizedValue, {
      selectedToolIds: [],
      customSkillNames: [],
    });
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

  const toggleCategoryExpand = (categoryKey) => {
    const key = String(categoryKey || "").trim();
    if (!key) return;
    setExpandedCategoryKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
    onActiveCategoryChange?.(key);
  };

  const handleToggleToolForCategory = (categoryKey, toolId) => {
    const normalizedToolId = toPositiveInteger(toolId);
    if (!categoryKey || !normalizedToolId || !onSubcategorySkillChange) return;
    const currentSub = (
      Array.isArray(selectedSubcategories) ? selectedSubcategories : []
    ).find((sub) => getSubcategorySelectionKey(sub) === categoryKey);
    const currentToolIds = (
      Array.isArray(currentSub?.selectedToolIds)
        ? currentSub.selectedToolIds
        : []
    )
      .map((val) => toPositiveInteger(val))
      .filter(Boolean);
    const currentCustomSkills = normalizeStringArray(
      currentSub?.customSkillNames,
    );

    const isSelected = currentToolIds.includes(normalizedToolId);
    const nextToolIds = isSelected
      ? currentToolIds.filter((id) => id !== normalizedToolId)
      : [...currentToolIds, normalizedToolId];

    if (!selectedSet.has(categoryKey) && !isSelected) {
      onChange?.([...normalizedSelected, categoryKey]);
    }

    onSubcategorySkillChange(categoryKey, {
      selectedToolIds: nextToolIds,
      customSkillNames: currentCustomSkills,
    });
  };

  const handleToggleCustomSkillForCategory = (categoryKey, skillName) => {
    const normalizedSkill = String(skillName || "").trim();
    if (!categoryKey || !normalizedSkill || !onSubcategorySkillChange) return;
    const currentSub = (
      Array.isArray(selectedSubcategories) ? selectedSubcategories : []
    ).find((sub) => getSubcategorySelectionKey(sub) === categoryKey);
    const currentToolIds = (
      Array.isArray(currentSub?.selectedToolIds)
        ? currentSub.selectedToolIds
        : []
    )
      .map((val) => toPositiveInteger(val))
      .filter(Boolean);
    const currentCustomSkills = normalizeStringArray(
      currentSub?.customSkillNames,
    );

    const isSelected = currentCustomSkills.some(
      (s) => s.toLowerCase() === normalizedSkill.toLowerCase(),
    );
    const nextCustomSkills = isSelected
      ? currentCustomSkills.filter(
          (s) => s.toLowerCase() !== normalizedSkill.toLowerCase(),
        )
      : [...currentCustomSkills, normalizedSkill];

    if (!selectedSet.has(categoryKey) && !isSelected) {
      onChange?.([...normalizedSelected, categoryKey]);
    }

    onSubcategorySkillChange(categoryKey, {
      selectedToolIds: currentToolIds,
      customSkillNames: nextCustomSkills,
    });
  };

  const handleInlineSkillSelect = (entry) => {
    if (!entry) return;
    const { categoryValue, toolId, label } = entry;
    if (!categoryValue) return;

    if (typeof toolId === "number") {
      handleToggleToolForCategory(categoryValue, toolId);
    } else if (typeof toolId === "string" && toolId.startsWith("custom-")) {
      handleToggleCustomSkillForCategory(categoryValue, label);
    } else if (label) {
      handleToggleCustomSkillForCategory(categoryValue, label);
    }
  };

  const filteredBrowseAccordionOptions = useMemo(() => {
    const query = String(browseSearchQuery || "").trim().toLowerCase();
    const customOptions = customSelections.map((opt) => ({ ...opt, isCustom: true }));
    const allOptions = [...options, ...customOptions].filter(
      (opt) => opt.value !== "_unassigned_skills_",
    );

    if (!query) {
      return allOptions.map((opt) => ({
        option: opt,
        matchingTools: getToolsForCategory(opt),
        matchingSuggested: getSuggestedSkillsForCategory(String(opt.value)),
        isMatchBySkill: false,
      }));
    }

    return allOptions
      .map((opt) => {
        const catLabel = String(opt?.label || "").toLowerCase();
        const isCatMatch = catLabel.includes(query);
        const tools = getToolsForCategory(opt);
        const suggested = getSuggestedSkillsForCategory(String(opt.value));
        const matchingTools = tools.filter((t) =>
          t.label.toLowerCase().includes(query),
        );
        const matchingSuggested = suggested.filter((s) =>
          s.toLowerCase().includes(query),
        );
        const isSkillMatch =
          matchingTools.length > 0 || matchingSuggested.length > 0;

        if (isCatMatch || isSkillMatch) {
          return {
            option: opt,
            matchingTools: isCatMatch ? tools : matchingTools,
            matchingSuggested: isCatMatch ? suggested : matchingSuggested,
            isMatchBySkill: isSkillMatch,
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [
    options,
    customSelections,
    browseSearchQuery,
    allPreFetchedTools,
    toolOptionsByCategory,
    skillSuggestionsByCategory,
  ]);

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

  // Handle clicking a result from the inline search dropdown (allows multi-select)
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
      // Toggle the skill within that category
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
        let nextToolIds;
        if (currentToolIds.includes(entry.toolId)) {
          nextToolIds = currentToolIds.filter((id) => id !== entry.toolId);
        } else {
          nextToolIds = [...currentToolIds, entry.toolId];
        }
        onSubcategorySkillChange(entry.categoryValue, {
          selectedToolIds: nextToolIds,
          customSkillNames: currentCustom,
        });
      }
    }
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
      } else if (requestedType === "skill") {
        let targetCategoryValue = activeCategoryValue;
        
        if (!targetCategoryValue) {
          targetCategoryValue = "_unassigned_skills_";
          if (!selectedSet.has(targetCategoryValue)) {
            commitCategorySelection([...normalizedSelected, targetCategoryValue], targetCategoryValue);
          }
        }

        if (onSubcategorySkillChange) {
          const currentSubcategory =
            (Array.isArray(selectedSubcategories) ? selectedSubcategories : []).find(
              (entry) => getSubcategorySelectionKey(entry) === targetCategoryValue,
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
            onSubcategorySkillChange(targetCategoryValue, {
              selectedToolIds: currentToolIds,
              customSkillNames: [...currentCustomSkills, requestName],
            });
          }
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
    <div className="w-full space-y-3" ref={containerRef}>
      {selectedOptions.length > 0 ? (
        <div
          className="space-y-3"
          aria-label="Selected service categories and skills"
        >
          {selectedOptions.map((option) => {
            const categorySkills = selectedSkillsByCategory.get(option.value) || [];

            return (
              <div key={option.value} className="space-y-2 rounded-xl border border-border/50 bg-muted/[0.15] p-2.5 sm:p-3 transition-colors">
                {/* Category Header */}
                <div className="flex items-center justify-between gap-2 pb-1">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1 text-xs sm:text-sm font-semibold">
                    <span className="text-muted-foreground truncate font-medium">{displayedServiceLabel}</span>
                    <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/50" aria-hidden="true" />
                    <span className="text-foreground truncate font-semibold">{option.label}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeOption(option.value)}
                    className="shrink-0 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30 cursor-pointer whitespace-nowrap"
                    aria-label={`Remove ${option.label} category`}
                  >
                    <span>Remove</span>
                    <X className="h-3 w-3" />
                  </button>
                </div>

                {/* Selected Skill Items */}
                {categorySkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {categorySkills.map((entry) => (
                      <div
                        key={`${entry.categoryKey}-${entry.type}-${entry.value}`}
                        className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-lg border border-border/80 bg-card px-2.5 text-xs sm:text-sm font-medium text-foreground shadow-2xs transition-all hover:border-primary/40"
                      >
                        <span className="truncate">{entry.label}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkillEntry(entry)}
                          className="shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30 cursor-pointer"
                          aria-label={`Remove ${entry.label}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[36px] items-center justify-between rounded-lg border border-dashed border-border/70 bg-card/60 px-3 py-1.5 text-xs text-muted-foreground">
                    <span className="truncate">Choose skills for this category.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsBrowseOpen(true);
                        setShouldFocusBrowseSearch(true);
                      }}
                      className="shrink-0 text-xs font-semibold text-primary hover:underline ml-2 cursor-pointer"
                    >
                      Browse skills
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Trigger row: text search input + Browse button */}
      <div
        ref={triggerRowRef}
        className={cn(
          "relative flex h-11 w-full items-center rounded-xl border bg-card px-3.5 shadow-2xs transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
          hasError ? "border-destructive/70" : "border-border/80"
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-muted-foreground mr-2.5" aria-hidden="true" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsBrowseOpen(false);
            setShouldFocusBrowseSearch(false);
            setIsSearchOpen(true);
          }}
          onFocus={() => {
            setIsSearchOpen(true);
          }}
          onClick={() => {
            setIsSearchOpen(true);
          }}
          placeholder={isLoading ? loadingMessage : searchPlaceholder || placeholder || "Add demographics, skills or behaviors..."}
          disabled={isLoading}
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60 placeholder:font-normal"
        />
        <button
          type="button"
          onClick={() => {
            const nextBrowseOpen = !isBrowseOpen;
            setIsBrowseOpen(nextBrowseOpen);
            setShouldFocusBrowseSearch(nextBrowseOpen);
            setIsSearchOpen(false);
            setSearchQuery("");
          }}
          className={cn(
            "flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 cursor-pointer",
            isBrowseOpen
              ? "bg-primary !text-white shadow-2xs"
              : "text-foreground hover:bg-muted hover:text-primary",
          )}
          title="Browse all categories & skills"
          aria-expanded={isBrowseOpen}
          aria-haspopup="dialog"
        >
          <span className={cn(isBrowseOpen ? "!text-white" : "")}>Browse</span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-200",
              isBrowseOpen ? "rotate-180 !text-white" : "",
            )}
          />
        </button>

        {/* Inline search results dropdown (when typing search query without browse mode) */}
        {isSearchOpen && !isBrowseOpen ? (
          <div data-onboarding-popup="true" className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-2xl shadow-black/15 subtle-scrollbar dark:shadow-black/50">
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
                      className="rounded-md border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
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
                      className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                    >
                      {requestingType === "skill" ? "Sending..." : `Request skill "${normalizedSearchRequest}"`}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="p-1.5">
                {searchResults.skills.length > 0 && (
                  <div className="mb-2">
                    <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Skills
                    </p>
                    {searchResults.skills.map((entry) => {
                      const parentEntry = (Array.isArray(selectedSubcategories) ? selectedSubcategories : []).find(
                        (sub) => getSubcategorySelectionKey(sub) === entry.categoryValue
                      );
                      const isToolSelected =
                        typeof entry.toolId === "number" &&
                        Array.isArray(parentEntry?.selectedToolIds) &&
                        parentEntry.selectedToolIds.map(toPositiveInteger).includes(entry.toolId);
                      const isCustomSelected =
                        typeof entry.toolId === "string" &&
                        entry.toolId.startsWith("custom-") &&
                        normalizeStringArray(parentEntry?.customSkillNames).some(
                          (skill) => skill.toLowerCase() === entry.label.toLowerCase()
                        );
                      const isSelected = isToolSelected || isCustomSelected;

                      return (
                        <button
                          key={`search-skill-${entry.categoryValue}-${entry.toolId || entry.label}`}
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            void handleInlineSkillSelect(entry);
                          }}
                          onClick={(event) => {
                            event.preventDefault();
                            void handleInlineSkillSelect(entry);
                          }}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors cursor-pointer",
                            isSelected
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-foreground hover:bg-muted",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border",
                              isSelected ? "border-primary bg-primary" : "border-border",
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3 !text-white" />}
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

                {searchResults.categories.length > 0 && (
                  <div>
                    <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Categories
                    </p>
                    {searchResults.categories.map((entry) => {
                      const categoryKey = String(entry.categoryValue);
                      const isSelected = selectedSet.has(categoryKey);
                      const {
                        toolIds: selectedToolIdsSet,
                        customSkills: selectedCustomSkills,
                      } = getSelectedForCategory(categoryKey);
                      const selectedCount =
                        selectedToolIdsSet.size + selectedCustomSkills.length;
                      const opt =
                        (Array.isArray(options) ? options : []).find((o) => String(o.value) === categoryKey) ||
                        (Array.isArray(customSelections) ? customSelections : []).find((o) => String(o.value) === categoryKey) ||
                        { value: categoryKey };
                      const tools = getToolsForCategory(opt);
                      const suggested = getSuggestedSkillsForCategory(categoryKey);
                      const totalCount = tools.length + suggested.length;
                      const isAllSelected = totalCount > 0 ? selectedCount >= totalCount : isSelected;
                      const isPartiallySelected = isSelected && selectedCount > 0 && !isAllSelected;

                      return (
                        <button
                          key={`search-cat-${entry.categoryValue}`}
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            toggleOption(entry.categoryValue);
                          }}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors cursor-pointer",
                            isSelected
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-foreground hover:bg-muted",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border",
                              isAllSelected || isPartiallySelected ? "border-primary bg-primary text-primary-foreground" : "border-border",
                            )}
                          >
                            {isAllSelected ? (
                              <Check className="h-3 w-3 !text-white stroke-[3]" />
                            ) : isPartiallySelected ? (
                              <Minus className="h-3 w-3 !text-white stroke-[3]" />
                            ) : null}
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

        {/* Browse Accordion Dropdown directly attached under the input */}
        {isBrowseOpen && (
          <div
            data-onboarding-popup="true"
            className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-[360px] sm:max-h-[400px] overflow-y-auto rounded-xl border border-border bg-card p-2 sm:p-2.5 shadow-2xl shadow-black/15 dark:shadow-black/50 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:!hidden space-y-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            {isLoading ? (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                {loadingMessage}
              </div>
            ) : options.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                {emptyMessage}
              </div>
            ) : filteredBrowseAccordionOptions.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                {noResultsMessage}
              </div>
            ) : (
              filteredBrowseAccordionOptions.map(
                ({ option, matchingTools, matchingSuggested }) => {
                  const categoryKey = String(option.value);
                  const isSearching = Boolean(searchQuery.trim());
                  const isExpanded =
                    isSearching || expandedCategoryKeys.has(categoryKey);
                  const isSelected = selectedSet.has(categoryKey);
                  const {
                    toolIds: selectedToolIdsSet,
                    customSkills: selectedCustomSkills,
                  } = getSelectedForCategory(categoryKey);
                  const selectedCount =
                    selectedToolIdsSet.size + selectedCustomSkills.length;
                  const totalAvailableCount =
                    matchingTools.length + matchingSuggested.length;
                  const isAllSelected =
                    totalAvailableCount > 0
                      ? selectedCount >= totalAvailableCount
                      : isSelected;
                  const isPartiallySelected =
                    isSelected && selectedCount > 0 && !isAllSelected;
                  const hasSkills =
                    matchingTools.length > 0 || matchingSuggested.length > 0;

                  return (
                    <div
                      key={categoryKey}
                      className={cn(
                        "rounded-xl border transition-all duration-200 overflow-hidden",
                        isExpanded
                          ? "border-primary/40 bg-card shadow-xs"
                          : isSelected
                            ? "border-primary/30 bg-primary/[0.03]"
                            : "border-border/70 bg-card hover:border-border",
                      )}
                    >
                      {/* Category Header Row (Click to toggle dropdown) */}
                      <div
                        onClick={() => toggleCategoryExpand(categoryKey)}
                        className="flex items-center justify-between gap-2.5 px-3 py-2.5 sm:px-3.5 sm:py-2.5 cursor-pointer select-none hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleOption(option.value);
                            }}
                            className={cn(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors cursor-pointer",
                              isAllSelected || isPartiallySelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background hover:border-primary/60",
                            )}
                            aria-label={`Select category ${option.label}`}
                          >
                            {isAllSelected ? (
                              <Check className="h-2.5 w-2.5 stroke-[3]" />
                            ) : isPartiallySelected ? (
                              <Minus className="h-2.5 w-2.5 stroke-[3]" />
                            ) : null}
                          </button>

                          <span className="font-semibold text-xs sm:text-sm text-foreground truncate">
                            {option.label}
                          </span>

                          {selectedCount > 0 && (
                            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary shrink-0">
                              {selectedCount} skill{selectedCount > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                          <span className="text-[11px] font-medium hidden sm:inline text-muted-foreground/80">
                            {hasSkills
                              ? `${matchingTools.length + matchingSuggested.length} skills`
                              : ""}
                          </span>
                          <span
                            className={cn(
                              "p-0.5 rounded-md transition-transform duration-200",
                              isExpanded && "rotate-180",
                            )}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </span>
                        </div>
                      </div>

                      {/* Dropdown Skills Section */}
                      {isExpanded && (
                        <div className="border-t border-border/60 bg-muted/20 px-3 py-2.5 sm:px-3.5 sm:py-3 space-y-2">
                          {/* Suggested / Resume Skills */}
                          {matchingSuggested.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                                Suggested Skills
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {matchingSuggested.map((skill) => {
                                  const isSkillSelected =
                                    selectedCustomSkills.some(
                                      (s) =>
                                        s.toLowerCase() ===
                                        skill.toLowerCase(),
                                    );
                                  return (
                                    <button
                                      key={skill}
                                      type="button"
                                      onClick={() =>
                                        handleToggleCustomSkillForCategory(
                                          categoryKey,
                                          skill,
                                        )
                                      }
                                      className={cn(
                                        "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
                                        isSkillSelected
                                          ? "border-primary bg-primary/15 text-primary shadow-xs"
                                          : "border-border/70 bg-card text-foreground hover:border-primary/40 hover:bg-primary/[0.04]",
                                      )}
                                    >
                                      <span className="truncate">{skill}</span>
                                      {isSkillSelected ? (
                                        <Check className="h-3 w-3 text-primary" />
                                      ) : null}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Preset Tools / Skills */}
                          {matchingTools.length > 0 ? (
                            <div className="space-y-1.5">
                              {matchingSuggested.length > 0 && (
                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                                  Skills
                                </p>
                              )}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {matchingTools.map((tool) => {
                                  const isToolSelected =
                                    selectedToolIdsSet.has(tool.id);
                                  return (
                                    <button
                                      key={tool.id}
                                      type="button"
                                      onClick={() =>
                                        handleToggleToolForCategory(
                                          categoryKey,
                                          tool.id,
                                        )
                                      }
                                      className={cn(
                                        "flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-left text-xs transition-all cursor-pointer",
                                        isToolSelected
                                          ? "border-primary/60 bg-primary/10 text-primary font-medium shadow-xs"
                                          : "border-border/70 bg-card text-foreground hover:border-primary/40 hover:bg-primary/[0.04]",
                                      )}
                                    >
                                      <span className="truncate min-w-0 flex-1">
                                        {tool.label}
                                      </span>
                                      {isToolSelected ? (
                                        <Check className="ml-2 h-3.5 w-3.5 shrink-0 text-primary animate-in fade-in zoom-in-75 duration-100" />
                                      ) : (
                                        <span className="ml-2 h-3.5 w-3.5 shrink-0 rounded border border-border/80 bg-background" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ) : isToolsLoading ? (
                            <p className="py-1.5 text-xs text-muted-foreground">
                              Loading skills...
                            </p>
                          ) : matchingSuggested.length === 0 ? (
                            <p className="py-1.5 text-xs text-muted-foreground italic">
                              No skills found for this category.
                            </p>
                          ) : null}
                        </div>
                      )}
                    </div>
                  );
                },
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryMultiSelect;
