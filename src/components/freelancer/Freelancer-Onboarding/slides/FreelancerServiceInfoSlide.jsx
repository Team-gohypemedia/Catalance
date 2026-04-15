import { useState, useEffect, useMemo, useRef } from "react";
import Search from "lucide-react/dist/esm/icons/search";
import Plus from "lucide-react/dist/esm/icons/plus";
import X from "lucide-react/dist/esm/icons/x";

import { cn } from "@/shared/lib/utils";
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
  { value: "simple", label: "Simple" },
  { value: "moderate", label: "Moderate" },
  { value: "complex", label: "Complex" },
  { value: "enterprise", label: "Enterprise-grade" },
];

const SERVICE_TITLE_MAX = 80;

/* ──────────────────── Autocomplete Tag Input ──────────────────── */

const TechnologiesInput = ({ tools = [], selected, onChange, isLoading }) => {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return tools
      .filter(
        (t) => t.toLowerCase().includes(q) && !selected.includes(t)
      )
      .slice(0, 8);
  }, [query, tools, selected]);

  const queryExactMatch = tools.some(
    (t) => t.toLowerCase() === query.trim().toLowerCase()
  );
  const alreadyAdded = selected.some(
    (t) => t.toLowerCase() === query.trim().toLowerCase()
  );
  const showAddCustom =
    query.trim().length > 0 && !queryExactMatch && !alreadyAdded;

  const addTool = (tool) => {
    if (!selected.includes(tool)) {
      onChange([...selected, tool]);
    }
    setQuery("");
    inputRef.current?.focus();
  };

  const removeTool = (tool) => {
    onChange(selected.filter((t) => t !== tool));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = query.trim();
      if (!trimmed) return;

      if (suggestions.length > 0) {
        addTool(suggestions[0]);
      } else if (!alreadyAdded) {
        addTool(trimmed);
      }
    }
    if (e.key === "Backspace" && !query && selected.length > 0) {
      removeTool(selected[selected.length - 1]);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showDropdown =
    isFocused &&
    query.trim().length > 0 &&
    (suggestions.length > 0 || showAddCustom);

  return (
    <div className="space-y-3" ref={containerRef}>
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={
            isLoading ? "Loading tools..." : "Type to search or add tools..."
          }
          disabled={isLoading}
          className="h-12 w-full rounded-xl border border-white/10 bg-card pl-11 pr-4 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
        />

        {/* Suggestions dropdown */}
        {showDropdown && (
          <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-white/10 bg-card shadow-xl shadow-black/40">
            <div className="max-h-52 overflow-y-auto">
              {suggestions.map((tool) => (
                <button
                  key={tool}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addTool(tool)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-white/80 transition-colors hover:bg-white/5"
                >
                  <Plus className="h-3.5 w-3.5 text-white/40" />
                  {tool}
                </button>
              ))}

              {showAddCustom && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addTool(query.trim())}
                  className="flex w-full items-center gap-3 border-t border-white/5 px-4 py-3 text-left text-sm text-primary transition-colors hover:bg-primary/5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add &ldquo;{query.trim()}&rdquo;
                </button>
              )}
            </div>
          </div>
        )}
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

/* ──────────────────── Main Slide ──────────────────── */

const FreelancerServiceInfoSlide = ({
  selectedServices,
  dbServices,
  serviceInfoForm,
  onServiceInfoFieldChange,
}) => {
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [toolOptions, setToolOptions] = useState([]);
  const [isToolsLoading, setIsToolsLoading] = useState(false);

  const firstServiceId =
    Array.isArray(selectedServices) && selectedServices.length > 0
      ? selectedServices[0]
      : null;

  const firstService =
    firstServiceId && Array.isArray(dbServices)
      ? dbServices.find((s) => s.id === firstServiceId)
      : null;

  const serviceName = firstService?.name ?? "Service";

  // Fetch sub-categories from DB when the selected service changes
  useEffect(() => {
    if (!firstServiceId) {
      setCategoryOptions([]);
      return;
    }

    let cancelled = false;
    const fetchSubCategories = async () => {
      try {
        setIsCategoriesLoading(true);
        const res = await fetch(
          `${API_BASE_URL}/marketplace/filters/sub-categories?serviceId=${firstServiceId}`
        );
        if (!res.ok) throw new Error("Failed to fetch sub-categories");
        const json = await res.json();
        const data = (json.data || []).map((sc) => ({
          value: String(sc.id),
          label: sc.name,
        }));
        if (!cancelled) {
          setCategoryOptions(data);
          const currentValid = data.some(
            (opt) => opt.value === serviceInfoForm.category
          );
          if (!currentValid && serviceInfoForm.category) {
            onServiceInfoFieldChange("category", "");
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
  }, [firstServiceId]);

  // Fetch tools from DB when the selected category (sub-category) changes
  useEffect(() => {
    const subCategoryId = serviceInfoForm.category;
    if (!subCategoryId) {
      setToolOptions([]);
      return;
    }

    let cancelled = false;
    const fetchTools = async () => {
      try {
        setIsToolsLoading(true);
        const res = await fetch(
          `${API_BASE_URL}/marketplace/filters/tools?subCategoryId=${subCategoryId}`
        );
        if (!res.ok) throw new Error("Failed to fetch tools");
        const json = await res.json();
        const data = (json.data || []).map((t) => t.name);
        if (!cancelled) {
          setToolOptions(data);
        }
      } catch {
        if (!cancelled) setToolOptions([]);
      } finally {
        if (!cancelled) setIsToolsLoading(false);
      }
    };

    fetchTools();
    return () => { cancelled = true; };
  }, [serviceInfoForm.category]);

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
              <CustomSelect
                value={serviceInfoForm.category}
                onChange={(val) => onServiceInfoFieldChange("category", val)}
                options={categoryOptions}
                placeholder={
                  isCategoriesLoading
                    ? "Loading..."
                    : "Select a category"
                }
              />
            </div>

            {/* Technologies */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                Technologies
              </label>
              <TechnologiesInput
                tools={toolOptions}
                selected={serviceInfoForm.technologies}
                onChange={(next) =>
                  onServiceInfoFieldChange("technologies", next)
                }
                isLoading={isToolsLoading}
              />
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
