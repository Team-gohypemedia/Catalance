import { useRef } from "react";
import IndianRupee from "lucide-react/dist/esm/icons/indian-rupee";
import Link2 from "lucide-react/dist/esm/icons/link-2";
import Plus from "lucide-react/dist/esm/icons/plus";
import Upload from "lucide-react/dist/esm/icons/upload";
import X from "lucide-react/dist/esm/icons/x";

import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import {
  ONBOARDING_FIELD_LABEL_CLASS,
  ONBOARDING_SERVICE_SKIP_BUTTON_CLASS,
} from "../typography";
import {
  ServiceInfoStepper,
  CustomSelect,
} from "./shared/ServiceInfoComponents";

const ONBOARDING_PAGE_TITLE_CLASS =
  "text-balance text-[34px] font-semibold leading-[1.08] tracking-[-0.04em] sm:text-[40px]";
const ONBOARDING_SECTION_TITLE_CLASS = "text-2xl font-medium leading-tight tracking-[-0.02em]";
const ONBOARDING_SECTION_DESCRIPTION_CLASS = "text-base font-normal leading-7";

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

const toTitleCase = (value) =>
  String(value || "")
    .trim()
    .replace(/\S+/g, (word) =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    );

/* ──────────────────── File Upload Button ──────────────────── */

const FileUploadButton = ({ file, onChange, hasError = false }) => {
  const inputRef = useRef(null);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex h-12 w-full items-center justify-center gap-2 rounded-xl border bg-card px-4 !text-[14px] !leading-5 text-white/20 transition-colors",
          hasError
            ? "border-destructive/70 hover:border-destructive/80"
            : "border-white/10 hover:border-white/20",
        )}
        aria-invalid={hasError}
      >
        <Upload className="h-4 w-4" />
        <span>{file ? file.name : "Upload file"}</span>
      </button>
      {file && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
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

/* ──────────────────── Main Slide ──────────────────── */

const FreelancerCaseStudySlide = ({
  caseStudyForm,
  caseStudies = [],
  activeCaseStudyIndex = 0,
  activeCaseStudyId = "",
  nicheOptions = [],
  onCaseStudyFieldChange,
  onAddCaseStudy,
  onRemoveCaseStudy,
  onActiveCaseStudyChange,
  onServiceStepChange,
  onSkipServices,
  caseStudyValidationErrors = {},
}) => {
  const activeCaseStudyLabel =
    toTitleCase(caseStudyForm?.title) ||
    `Case Study ${Number.isInteger(activeCaseStudyIndex) ? activeCaseStudyIndex + 1 : 1}`;
  const normalizedCaseStudies = Array.isArray(caseStudies) ? caseStudies : [];
  const titleError = String(caseStudyValidationErrors.title || "").trim();
  const descriptionError = String(caseStudyValidationErrors.description || "").trim();
  const nicheError = String(caseStudyValidationErrors.niche || "").trim();
  const roleError = String(caseStudyValidationErrors.role || "").trim();
  const timelineError = String(caseStudyValidationErrors.timeline || "").trim();
  const budgetError = String(caseStudyValidationErrors.budget || "").trim();

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col items-center">
      <div className="w-full space-y-8">
        {/* Heading */}
        <div className="text-center">
          <h1 className={ONBOARDING_PAGE_TITLE_CLASS}>
            <span>Tell Us About </span>
            <span className="text-primary">Your</span>
            <span> Previous </span>
            <span className="text-primary">Work</span>
          </h1>
        </div>

        {/* Stepper */}
        <div className="w-full">
          <ServiceInfoStepper
            activeStepId="caseStudy"
            onStepChange={onServiceStepChange}
          />
        </div>

        {/* Step Content */}
        <div className="w-full space-y-5">
          <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0 space-y-3">
                <div>
                  <h2 className={cn(ONBOARDING_SECTION_TITLE_CLASS, "text-white")}>
                    Case Studies
                  </h2>
                  <p className={cn(ONBOARDING_SECTION_DESCRIPTION_CLASS, "text-muted-foreground")}>
                    Add multiple case studies and switch between them while filling the details.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:flex-wrap sm:justify-end">
                <button
                  type="button"
                  onClick={onAddCaseStudy}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary bg-primary px-4 text-sm font-semibold text-black transition-colors hover:bg-primary/90 sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  Add Case Study
                </button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onSkipServices?.()}
                  className={cn(
                    ONBOARDING_SERVICE_SKIP_BUTTON_CLASS,
                    "shrink-0 px-3 py-2 text-sm sm:px-6 sm:py-0 sm:text-base",
                  )}
                >
                  Skip
                </Button>
              </div>
            </div>

            {normalizedCaseStudies.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {normalizedCaseStudies.map((caseStudy, index) => {
                  const caseStudyId = String(caseStudy?.id || "").trim();
                  const isActive = caseStudyId && caseStudyId === activeCaseStudyId;
                  const caseStudyLabel =
                    toTitleCase(caseStudy?.title) ||
                    `Case Study ${index + 1}`;

                  return (
                    <div key={caseStudyId || `case-study-${index}`} className="relative">
                      <button
                        type="button"
                        onClick={() => onActiveCaseStudyChange?.(caseStudyId)}
                        className={cn(
                          "inline-flex h-10 items-center rounded-full border py-0 pl-4 pr-14 text-sm font-semibold transition-colors",
                          isActive
                            ? "border-primary bg-primary text-black"
                            : "border-transparent bg-card text-white/65 hover:text-white",
                        )}
                      >
                        <span className="truncate max-w-[11rem]">{caseStudyLabel}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveCaseStudy?.(caseStudyId);
                        }}
                        className={cn(
                          "absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-background p-1.5 text-primary transition-colors hover:bg-background/90",
                        )}
                        aria-label={`Remove ${caseStudyLabel}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-white/10 bg-card p-5 shadow-[0_18px_60px_rgba(0,0,0,0.24)] sm:p-6">
          {/* Project Header */}
          <h3 className={cn(ONBOARDING_SECTION_TITLE_CLASS, "mb-4 text-white")}>
            {activeCaseStudyLabel}
          </h3>

          <div className="space-y-6">
            {/* Case Study Title */}
            <div className="space-y-0">
              <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
                Case Study Title
              </label>
              <input
                type="text"
                value={caseStudyForm.title}
                onChange={(e) =>
                  onCaseStudyFieldChange("title", e.target.value)
                }
                placeholder="e.g. E-commerce Platform Redesign"
                className={cn(
                  "h-12 w-full rounded-xl border bg-card px-4 !text-[14px] !leading-5 text-white outline-none transition-colors placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 focus:ring-1",
                  titleError
                    ? "border-destructive/70 focus:border-destructive/60 focus:ring-destructive/20"
                    : "border-white/10 focus:border-primary/50 focus:ring-primary/20",
                )}
                aria-invalid={Boolean(titleError)}
              />
              {titleError ? (
                <p className="mt-1 text-sm text-destructive">{titleError}</p>
              ) : null}
            </div>

            {/* Description */}
            <div className="space-y-0">
              <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
                Description
              </label>
              <textarea
                value={caseStudyForm.description}
                onChange={(e) =>
                  onCaseStudyFieldChange("description", e.target.value)
                }
                placeholder="Briefly describe the project and its goals..."
                rows={4}
                className={cn(
                  "w-full resize-none rounded-xl border bg-card px-4 py-3 !text-[14px] !leading-5 text-white outline-none transition-colors placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 focus:ring-1",
                  descriptionError
                    ? "border-destructive/70 focus:border-destructive/60 focus:ring-destructive/20"
                    : "border-white/10 focus:border-primary/50 focus:ring-primary/20",
                )}
                aria-invalid={Boolean(descriptionError)}
              />
              {descriptionError ? (
                <p className="mt-1 text-sm text-destructive">{descriptionError}</p>
              ) : null}
            </div>

            {/* Niche */}
            <div className="space-y-0">
              <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
                Niche
              </label>
              <CustomSelect
                value={caseStudyForm.niche}
                onChange={(val) => onCaseStudyFieldChange("niche", val)}
                options={nicheOptions}
                placeholder="select niche"
                isSearchable
                searchPlaceholder="Search niches"
                hasError={Boolean(nicheError)}
              />
              {nicheError ? (
                <p className="mt-1 text-sm text-destructive">{nicheError}</p>
              ) : null}
            </div>

            {/* 3-column row: Project Link, Project File, Your Role */}
            <div className="grid gap-5 sm:grid-cols-3">
              {/* Project Link */}
              <div className="space-y-0">
                <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
                  Project Link (Optional)
                </label>
                <div className="relative">
                  <Link2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <input
                    type="url"
                    value={caseStudyForm.projectLink}
                    onChange={(e) =>
                      onCaseStudyFieldChange("projectLink", e.target.value)
                    }
                    placeholder="https://..."
                    className={cn(
                      "h-12 w-full rounded-xl border border-white/10 bg-card pl-10 pr-4 !text-[14px] !leading-5 text-white outline-none transition-colors placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 focus:border-primary/50 focus:ring-1 focus:ring-primary/20",
                    )}
                  />
                </div>
              </div>

              {/* Project File */}
              <div className="space-y-0">
                <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
                  Project File (Optional)
                </label>
                <FileUploadButton
                  file={caseStudyForm.projectFile}
                  onChange={(file) =>
                    onCaseStudyFieldChange("projectFile", file)
                  }
                />
              </div>

              {/* Your Role */}
              <div className="space-y-0">
                <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
                  Your Role
                </label>
                <CustomSelect
                  value={caseStudyForm.role}
                  onChange={(val) => onCaseStudyFieldChange("role", val)}
                  options={ROLE_OPTIONS}
                  placeholder="Select role"
                  hasError={Boolean(roleError)}
                />
                {roleError ? (
                  <p className="mt-1 text-sm text-destructive">{roleError}</p>
                ) : null}
              </div>
            </div>
            {/* 2-column row: Timeline, Budget */}
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Timeline */}
              <div className="space-y-0">
                <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
                  Timeline
                </label>
                <CustomSelect
                  value={caseStudyForm.timeline}
                  onChange={(val) => onCaseStudyFieldChange("timeline", val)}
                  options={TIMELINE_OPTIONS}
                  placeholder="Select duration"
                  hasError={Boolean(timelineError)}
                />
                {timelineError ? (
                  <p className="mt-1 text-sm text-destructive">{timelineError}</p>
                ) : null}
              </div>

              {/* Budget */}
              <div className="space-y-0">
                <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
                  Budget
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={caseStudyForm.budget}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      onCaseStudyFieldChange("budget", val);
                    }}
                    placeholder="e.g. 5000"
                    className={cn(
                      "h-12 w-full rounded-xl border bg-card pl-10 pr-4 !text-[14px] !leading-5 text-white outline-none transition-colors placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 focus:ring-1",
                      budgetError
                        ? "border-destructive/70 focus:border-destructive/60 focus:ring-destructive/20"
                        : "border-white/10 focus:border-primary/50 focus:ring-primary/20",
                    )}
                    aria-invalid={Boolean(budgetError)}
                  />
                </div>
                {budgetError ? (
                  <p className="mt-1 text-sm text-destructive">{budgetError}</p>
                ) : null}
              </div>
            </div>
      </div>
      </div>
      </div>
      </div>
    </section>
  );
};

export default FreelancerCaseStudySlide;
