import { useMemo, useRef, useState } from "react";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import Check from "lucide-react/dist/esm/icons/check";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import IndianRupee from "lucide-react/dist/esm/icons/indian-rupee";
import Link2 from "lucide-react/dist/esm/icons/link-2";
import Upload from "lucide-react/dist/esm/icons/upload";
import X from "lucide-react/dist/esm/icons/x";
import { toast } from "sonner";
import { request } from "@/shared/lib/api-client";
import { useAuth } from "@/shared/context/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { CustomSelect } from "@/components/freelancer/Freelancer-Onboarding/slides/shared/ServiceInfoComponents";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ROLE_OPTIONS = [
  { value: "full_execution", label: "Full execution" },
  { value: "partial_contribution", label: "Partial contribution" },
  { value: "team_project", label: "Team project" },
];

const TIMELINE_OPTIONS = [
  { value: "under_1_week", label: "Under 1 Week" },
  { value: "1_2_weeks", label: "1–2 Weeks" },
  { value: "2_4_weeks", label: "2–4 Weeks" },
  { value: "4_6_weeks", label: "4–6 Weeks" },
  { value: "6_8_weeks", label: "6–8 Weeks" },
  { value: "8_12_weeks", label: "8–12 Weeks" },
  { value: "12_plus_weeks", label: "12+ Weeks" },
];

const normalizeServiceKey = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const normalizeServiceKeyList = (values = []) => {
  const candidates = Array.isArray(values) ? values : [values];
  const seen = new Set();

  return candidates.reduce((acc, value) => {
    const rawValue = String(value || "").trim();
    const normalizedValue = normalizeServiceKey(rawValue);
    if (!normalizedValue || seen.has(normalizedValue)) {
      return acc;
    }

    seen.add(normalizedValue);
    acc.push(rawValue);
    return acc;
  }, []);
};

const FileUploadButton = ({ file, onChange }) => {
  const inputRef = useRef(null);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-[14px] leading-5 text-muted-foreground/60 transition-colors hover:border-border/80 hover:bg-muted/10",
        )}
      >
        <Upload className="h-4 w-4" />
        <span>{file ? file.name : "Upload file"}</span>
      </button>
      {file ? (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/75 hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        onChange={(e) => {
          const selected = e.target.files?.[0] || null;
          onChange(selected);
          e.target.value = "";
        }}
        className="hidden"
      />
    </div>
  );
};

const ServiceLinkMultiSelect = ({
  value = [],
  options = [],
  onChange,
  placeholder = "Link case study to service",
}) => {
  const normalizedOptions = useMemo(
    () => (Array.isArray(options) ? options : []),
    [options]
  );
  const selectedValues = useMemo(() => normalizeServiceKeyList(value), [value]);
  const selectedValueSet = useMemo(
    () => new Set(selectedValues.map((entry) => normalizeServiceKey(entry))),
    [selectedValues]
  );
  const optionLabelMap = useMemo(() => {
    const map = new Map();

    normalizedOptions.forEach((option) => {
      const normalizedValue = normalizeServiceKey(option?.value);
      const label = String(option?.label || option?.value || "").trim();
      if (normalizedValue && label && !map.has(normalizedValue)) {
        map.set(normalizedValue, label);
      }
    });

    return map;
  }, [normalizedOptions]);
  const selectedLabels = selectedValues
    .map((serviceKey) => optionLabelMap.get(normalizeServiceKey(serviceKey)) || serviceKey)
    .filter(Boolean);

  const selectedSummary =
    selectedLabels.length === 0
      ? placeholder
      : selectedLabels.length === 1
        ? selectedLabels[0]
        : `${selectedLabels[0]} +${selectedLabels.length - 1} more`;

  const updateSelection = (nextValues) => {
    onChange?.(normalizeServiceKeyList(nextValues));
  };

  const toggleService = (serviceKey) => {
    const normalizedTarget = normalizeServiceKey(serviceKey);
    if (!normalizedTarget) return;

    const nextValues = selectedValues.some(
      (entry) => normalizeServiceKey(entry) === normalizedTarget
    )
      ? selectedValues.filter(
          (entry) => normalizeServiceKey(entry) !== normalizedTarget
        )
      : [...selectedValues, serviceKey];

    updateSelection(nextValues);
  };

  return (
    <div className="space-y-2">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex h-12 w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 text-left text-sm outline-none transition-colors hover:border-border/80 focus:border-primary/50 focus:ring-1 focus:ring-primary/20",
              selectedValues.length ? "text-foreground" : "text-muted-foreground/70"
            )}
          >
            <span className="min-w-0 flex-1 truncate">{selectedSummary}</span>
            <span className="flex items-center gap-2 text-muted-foreground">
              {selectedValues.length ? (
                <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/90">
                  {selectedValues.length} selected
                </span>
              ) : null}
              <ChevronDown className="h-4 w-4" />
            </span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          sideOffset={6}
          className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[18rem] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card p-2 shadow-2xl"
        >
          <DropdownMenuLabel className="px-2 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Link case study to service
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="my-1 bg-border" />

          {normalizedOptions.length ? (
            normalizedOptions.map((option) => {
              const optionValue = String(option?.value || "").trim();
              const normalizedOptionValue = normalizeServiceKey(optionValue);
              const checked = selectedValueSet.has(normalizedOptionValue);

              return (
                <DropdownMenuItem
                  key={optionValue || option?.label}
                  role="menuitemcheckbox"
                  aria-checked={checked}
                  onSelect={(event) => {
                    event.preventDefault();
                    toggleService(optionValue);
                  }}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors",
                    checked
                      ? "bg-primary/10 text-foreground"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <span className="truncate">{String(option?.label || optionValue)}</span>
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0 transition-opacity",
                      checked ? "text-primary opacity-100" : "opacity-0"
                    )}
                    aria-hidden="true"
                  />
                </DropdownMenuItem>
              );
            })
          ) : (
            <div className="px-2 py-3 text-sm text-muted-foreground">
              No services available to link yet.
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

const CaseStudyModalContent = ({
  caseStudyForm,
  nicheOptions = [],
  serviceOptions = [],
  onCaseStudyFieldChange,
  onSave,
  onClose,
  isSaving = false,
  isEditing = false,
  onAddRequestedNiche,
}) => {
  const { authFetch } = useAuth();
  const [isRequestingNiche, setIsRequestingNiche] = useState(false);

  const handleRequestNiche = async (requestName) => {
    if (!requestName) return;

    setIsRequestingNiche(true);
    try {
      const response = await authFetch("/user-requests", {
        method: "POST",
        body: JSON.stringify({
          request: requestName,
          requestedType: "niche",
        }),
      });
      const payload = await response.json();

      if (payload?.data?.status === "EXISTS" && payload?.data?.existingEntity) {
        toast.success(`Niche "${requestName}" already exists. Selected it for you.`);
        const existingVal = payload.data.existingEntity.value || payload.data.existingEntity.name;
        onAddRequestedNiche?.({ value: existingVal, label: payload.data.existingEntity.label || payload.data.existingEntity.name });
        onCaseStudyFieldChange("niche", existingVal);
      } else {
        toast.success(`"${requestName}" sent for admin review.`);
        onAddRequestedNiche?.({ value: requestName, label: requestName });
        onCaseStudyFieldChange("niche", requestName);
      }
    } catch (error) {
      console.error("Failed to submit niche request:", error);
      // Even if it fails (e.g., timeout or server error), add it locally so the user isn't blocked
      toast.success(`"${requestName}" added locally (pending admin review).`);
      onAddRequestedNiche?.({ value: requestName, label: requestName });
      onCaseStudyFieldChange("niche", requestName);
    } finally {
      setIsRequestingNiche(false);
    }
  };

  const resolvedNicheOptions = useMemo(() => {
    const options = Array.isArray(nicheOptions) ? nicheOptions : [];
    if (caseStudyForm.niche && !options.some((o) => o.value === caseStudyForm.niche)) {
      return [...options, { value: caseStudyForm.niche, label: caseStudyForm.niche }];
    }
    return options;
  }, [nicheOptions, caseStudyForm.niche]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="max-h-[calc(100vh-7rem)] overflow-y-auto subtle-scrollbar pr-3">
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[1.5rem] font-semibold tracking-tight text-foreground sm:text-[1.8rem]">
                Case Studies
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">Fill in the details below.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-0">
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Case Study Title</label>
              <input
                value={caseStudyForm.title}
                onChange={(e) => onCaseStudyFieldChange("title", e.target.value)}
                placeholder="e.g. E-commerce Platform Redesign"
                className="h-12 w-full rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-0">
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Description</label>
              <textarea
                value={caseStudyForm.description}
                onChange={(e) => onCaseStudyFieldChange("description", e.target.value)}
                placeholder="Briefly describe the project and its goals..."
                rows={4}
                className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-0">
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Niche</label>
                <CustomSelect
                  value={caseStudyForm.niche}
                  onChange={(val) => onCaseStudyFieldChange("niche", val)}
                  options={resolvedNicheOptions}
                  placeholder="Select niche"
                  isSearchable
                  searchPlaceholder="Search niches"
                  onRequestMissingOption={handleRequestNiche}
                  isRequestingOption={isRequestingNiche}
                />
              </div>

              <div className="space-y-0">
                <label className="mb-1 block text-sm font-medium leading-snug text-muted-foreground">
                  Link case study to service
                </label>
                <ServiceLinkMultiSelect
                  value={caseStudyForm.serviceKeys || caseStudyForm.serviceKey || []}
                  onChange={(values) => onCaseStudyFieldChange("serviceKeys", values)}
                  options={serviceOptions}
                  placeholder="Link case study to service"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-0">
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Case Study Link (Optional)</label>
                <div className="relative">
                  <Link2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  <input
                    type="url"
                    value={caseStudyForm.projectLink}
                    onChange={(e) => onCaseStudyFieldChange("projectLink", e.target.value)}
                    placeholder="https://..."
                    className="h-12 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-0">
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Case Study File (Optional)</label>
                <FileUploadButton
                  file={caseStudyForm.projectFile}
                  onChange={(file) => onCaseStudyFieldChange("projectFile", file)}
                />
              </div>

              <div className="space-y-0">
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Your Role</label>
                <CustomSelect
                  value={caseStudyForm.role}
                  onChange={(val) => onCaseStudyFieldChange("role", val)}
                  options={ROLE_OPTIONS}
                  placeholder="Select role"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-0">
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Timeline</label>
                <CustomSelect
                  value={caseStudyForm.timeline}
                  onChange={(val) => onCaseStudyFieldChange("timeline", val)}
                  options={TIMELINE_OPTIONS}
                  placeholder="Select duration"
                />
              </div>

              <div className="space-y-0">
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Budget</label>
                <div className="relative">
                  <IndianRupee className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  <input
                    value={caseStudyForm.budget}
                    onChange={(e) => onCaseStudyFieldChange("budget", String(e.target.value || "").replace(/[^0-9]/g, ""))}
                    placeholder="e.g. 5000"
                    className="h-12 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center border-t border-border pt-5">
            <Button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              aria-busy={isSaving}
              className="min-w-[180px] cursor-pointer justify-center disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                "Save changes"
              ) : (
                "Save case study"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseStudyModalContent;
