import React, { useState, useRef, useMemo, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, LayoutGrid, Search, X } from 'lucide-react';
import { cn } from "@/shared/lib/utils";
import { Input } from "@/components/ui/input";
import { API_BASE_URL, request } from "@/shared/lib/api-client";
import { getSubcategorySelectionKey, normalizeStringArray } from "../../service-details";
import { toast } from "sonner";

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
  const triggerRowRef = useRef(null);
  const popupRef = useRef(null);
  const searchInputRef = useRef(null);
  const browseSearchInputRef = useRef(null);
  const preFetchAbortRef = useRef(null);
  const preFetchedOptionsKeyRef = useRef("");
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
    <div className="space-y-3" ref={containerRef}>
      <div className="relative">
        {/* â”€â”€ Trigger row: text search input + Browse button â”€â”€ */}
        <div
          ref={triggerRowRef}
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
            className="h-full min-w-0 flex-1 rounded-l-xl bg-transparent px-4 !text-[14px] !leading-5 text-foreground outline-none placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground/50 placeholder:font-normal [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 [&::placeholder]:font-normal"
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
              </div>
            )}
          </div>
        ) : null}
      </div>

        {/* --- Selected category tags --- */}
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

        {/* --- Selected skills tags --- */}
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
                <div className="border-b border-border px-2.5 py-2">
                  <input
                    ref={browseSearchInputRef}
                    type="text"
                    value={browseSearchQuery}
                    onChange={(event) => setBrowseSearchQuery(event.target.value)}
                    placeholder="Search categories..."
                    className="h-8 w-full rounded-lg border border-border/50 bg-muted/40 px-3 text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-border focus:bg-card"
                  />
                </div>

                <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
                  {/* Categories column */}
                  <div className={cn(
                    "flex min-h-0 min-w-0 flex-col border-b border-border md:border-b-0 md:border-r md:border-r-border",
                    activeCategoryValue ? "h-[140px] shrink-0 md:h-auto md:flex-1" : "flex-1"
                  )}>
                    <div className="shrink-0 border-b border-border px-3 py-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Categories
                        </p>
                        <p className="text-[10px] text-muted-foreground/80">
                          {selectedOptions.length} selected
                        </p>
                      </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:!hidden px-2 py-1.5">
                      {isLoading ? (
                        <div className="px-2 py-1.5 text-xs text-muted-foreground/60">
                          {loadingMessage}
                        </div>
                      ) : options.length === 0 ? (
                        <div className="px-2 py-1.5 text-xs text-muted-foreground/60">
                          {emptyMessage}
                        </div>
                      ) : filteredBrowseOptions.length === 0 ? (
                        <div className="px-2 py-1.5 text-xs text-muted-foreground/60">
                          {noResultsMessage}
                        </div>
                      ) : (
                        filteredBrowseOptions.map((option) => {
                          const isSelected = selectedSet.has(String(option.value));
                          const isActive = activeCategoryValue === String(option.value);
                          return (
                            <div key={option.value} className="relative my-0.5 w-full">
                              <button
                                type="button"
                                onClick={() => toggleOption(option.value)}
                                className={cn(
                                  "flex min-w-0 w-full items-center gap-2 rounded-lg border px-3 py-2 pr-9 text-left text-xs transition-colors",
                                  isActive
                                    ? "border-primary bg-primary text-primary-foreground shadow-[0_0_0_1px_rgba(var(--brand-rgb),0.25)]"
                                    : isSelected
                                      ? "border-border bg-muted text-foreground hover:border-primary/50 hover:bg-muted/80"
                                      : "border-transparent text-foreground hover:bg-muted",
                                )}
                                aria-pressed={isSelected}
                              >
                                <span className="min-w-0 flex-1 truncate">
                                  {option.label}
                                </span>
                              </button>
                              {isSelected ? (
                                <button
                                  type="button"
                                  onClick={() => removeOption(option.value)}
                                  className={cn(
                                    "absolute right-0.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-transparent shadow-none transition-colors focus:outline-none focus-visible:outline-none focus-visible:ring-0",
                                    isActive
                                      ? "text-primary-foreground hover:text-primary-foreground/90"
                                      : "text-muted-foreground hover:text-foreground",
                                  )}
                                  aria-label={`Remove ${option.label}`}
                                >
                                  <X className="h-3 w-3 stroke-[2.5]" />
                                </button>
                              ) : null}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Skills column */}
                  <div className={cn(
                    "flex min-h-0 min-w-0 flex-col",
                    activeCategoryValue ? "flex-1" : "shrink-0 md:flex-1"
                  )}>
                    {activeCategoryValue ? (
                      <>
                        <div className="shrink-0 border-b border-border px-3 py-2">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                              Skills
                            </p>
                            <p className="text-[10px] text-muted-foreground/80">
                              {activeSelectionCount} selected
                            </p>
                          </div>
                        </div>

                        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 py-1.5">
                          <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:!hidden pr-0">
                            <div className="flex flex-col gap-1">
                              {isToolsLoading &&
                              activeToolOptions.length === 0 &&
                              activeSuggestedSkills.length === 0 &&
                              activeVisibleCustomSkills.length === 0 ? (
                                <p className="text-xs text-muted-foreground">Loading skills...</p>
                              ) : activeToolOptions.length > 0 ||
                                activeVisibleCustomSkills.length > 0 ? (
                                <>
                                  {activeVisibleCustomSkills.length > 0 ? (
                                    <div className="space-y-1">
                                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground px-1 pt-1">
                                        Resume Skills
                                      </p>
                                      {activeVisibleCustomSkills.map((skill) => (
                                        <button
                                          key={skill}
                                          type="button"
                                          onClick={() => handleToggleSuggestedSkill(skill)}
                                          className="flex w-full items-center justify-between rounded-lg border border-primary/60 bg-primary/10 px-3 py-2 text-left text-xs text-primary transition-colors hover:bg-primary/15"
                                          aria-pressed
                                        >
                                          <span className="min-w-0 flex-1 truncate">
                                            {skill}
                                          </span>
                                          <Check className="ml-2 h-3 w-3 shrink-0 text-primary" />
                                        </button>
                                      ))}
                                    </div>
                                  ) : null}
                                  {activeToolOptions.length > 0 ? (
                                    <div className="space-y-1">
                                      {activeVisibleCustomSkills.length > 0 ? (
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground px-1 pt-1">
                                          Preset Skills
                                        </p>
                                      ) : null}
                                      {activeToolOptions.map((tool) => {
                                        const isSelected = activeSelectedToolIds.includes(
                                          tool.id,
                                        );
                                        return (
                                          <button
                                            key={tool.id}
                                            type="button"
                                            onClick={() => handleToggleTool(tool.id)}
                                            className={cn(
                                              "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-colors",
                                              isSelected
                                                ? "border-primary/60 bg-primary/10 text-primary"
                                                : "border-border bg-muted text-foreground hover:border-primary/50 hover:bg-muted/80",
                                            )}
                                            aria-pressed={isSelected}
                                          >
                                            <span className="min-w-0 flex-1 truncate">
                                              {tool.label}
                                            </span>
                                            {isSelected && (
                                              <Check className="ml-2 h-3 w-3 shrink-0 text-primary animate-in fade-in zoom-in-75 duration-100" />
                                            )}
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
                                        "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-colors",
                                        isSelected
                                          ? "border-primary/60 bg-primary/10 text-primary"
                                          : "border-border bg-muted text-foreground hover:border-primary/50 hover:bg-muted/80",
                                      )}
                                      aria-pressed={isSelected}
                                    >
                                      <span className="min-w-0 flex-1 truncate">
                                        {skill}
                                      </span>
                                      {isSelected && (
                                        <Check className="ml-2 h-3 w-3 shrink-0 text-primary animate-in fade-in zoom-in-75 duration-100" />
                                      )}
                                    </button>
                                  );
                                })
                              ) : (
                                <p className="text-xs text-muted-foreground">
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
                                  className="flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
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
                                  className="flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
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
                      <div className="flex items-center justify-center px-4 py-3 md:flex-1 md:py-8 text-sm text-muted-foreground text-center">
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
  );
};


export default CategoryMultiSelect;


