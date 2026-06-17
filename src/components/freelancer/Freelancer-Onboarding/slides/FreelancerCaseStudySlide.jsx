import { useEffect, useMemo, useRef, useState } from "react";
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
import { MAX_ONBOARDING_CASE_STUDIES } from "../service-details";
import {
  DEFAULT_FREELANCER_ONBOARDING_CONTENT,
  resolveCaseStudyFields,
} from "@/shared/lib/freelancer-onboarding-content";

const CASE_STUDY_BANNER_MAX_BYTES = 4.5 * 1024 * 1024;

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

const GRADIENT_OPTIONS = [
  { value: "bg-[linear-gradient(135deg,#090909,#131313_55%,#111111)]", label: "Sleek Dark" },
  { value: "bg-[linear-gradient(135deg,#0a192f,#112240_55%,#020c1b)]", label: "Midnight Blue" },
  { value: "bg-[linear-gradient(135deg,#1f0c2a,#2d153e_55%,#14071c)]", label: "Deep Purple" },
  { value: "bg-[linear-gradient(135deg,#2b1510,#3d2019_55%,#1c0c08)]", label: "Warm Cocoa" },
  { value: "bg-[linear-gradient(135deg,#081b15,#0c2a21_55%,#040f0c)]", label: "Forest Night" },
];

const toTitleCase = (value) =>
  String(value || "")
    .trim()
    .replace(/\S+/g, (word) =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    );

const getCaseStudyBannerPreviewUrl = (value) => {
  if (typeof value === "string") {
    return String(value).trim();
  }

  if (typeof File !== "undefined" && value instanceof File) {
    return URL.createObjectURL(value);
  }

  return "";
};

const getCaseStudyProjectFileMeta = (value) => {
  if (!value) {
    return { name: "", url: "" };
  }

  if (typeof value === "string") {
    const trimmedValue = String(value).trim();
    const fallbackName =
      trimmedValue.split("/").filter(Boolean).pop()?.split("?")[0] || "Uploaded file";
    return {
      name: decodeURIComponent(fallbackName),
      url: trimmedValue,
    };
  }

  if (typeof File !== "undefined" && value instanceof File) {
    return {
      name: String(value.name || "Selected file").trim(),
      url: "",
    };
  }

  return {
    name: String(value?.name || value?.fileName || "").trim(),
    url: String(value?.url || value?.uploadedUrl || "").trim(),
  };
};

/* ──────────────────── File Upload Button ──────────────────── */

const FileUploadButton = ({
  file,
  onChange,
  hasError = false,
  accept = undefined,
}) => {
  const inputRef = useRef(null);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex h-10 w-full items-center justify-start gap-2 rounded-xl border bg-card px-4 !text-[14px] !leading-5 transition-colors",
          file ? "text-foreground" : "text-muted-foreground",
          hasError
            ? "border-destructive/70 hover:border-destructive/80"
            : "border-border hover:border-border/80",
        )}
        aria-invalid={hasError}
      >
        <Upload className="h-4 w-4" />
        <span className="truncate">
          {file 
            ? typeof file === "string" 
              ? "File Uploaded" 
              : file.name 
            : "Upload file"}
        </span>
      </button>
      {file && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
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
  onboardingContent,
  caseStudyForm,
  caseStudyFields = [],
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
  onUploadMediaFile,
  continueButton,
}) => {
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [bannerUploadError, setBannerUploadError] = useState("");
  const caseStudyContent =
    onboardingContent?.caseStudy ||
    DEFAULT_FREELANCER_ONBOARDING_CONTENT.caseStudy;
  const stepperSteps =
    onboardingContent?.stepper?.steps ||
    DEFAULT_FREELANCER_ONBOARDING_CONTENT.stepper.steps;
  const resolvedFields =
    Array.isArray(caseStudyFields) && caseStudyFields.length > 0
      ? caseStudyFields
      : resolveCaseStudyFields(onboardingContent);
  const fieldMap = Object.fromEntries(
    resolvedFields.map((field) => [field.id, field]),
  );
  const roleOptions =
    fieldMap.role?.options ||
    caseStudyContent?.fields?.role?.options ||
    ROLE_OPTIONS;
  const timelineOptions =
    fieldMap.timeline?.options ||
    caseStudyContent?.fields?.timeline?.options ||
    TIMELINE_OPTIONS;
  const resolvedNicheOptions =
    Array.isArray(fieldMap.niche?.options) && fieldMap.niche.options.length > 0
      ? fieldMap.niche.options
      : Array.isArray(caseStudyContent?.fields?.niche?.options) &&
          caseStudyContent.fields.niche.options.length > 0
        ? caseStudyContent.fields.niche.options
        : nicheOptions;
  const activeCaseStudyLabel =
    toTitleCase(caseStudyForm?.title) ||
    `Case Study ${Number.isInteger(activeCaseStudyIndex) ? activeCaseStudyIndex + 1 : 1}`;
  const normalizedCaseStudies = Array.isArray(caseStudies) ? caseStudies : [];
  const isCaseStudyLimitReached =
    normalizedCaseStudies.length >= MAX_ONBOARDING_CASE_STUDIES;
  const bannerPreviewUrl = useMemo(
    () => getCaseStudyBannerPreviewUrl(caseStudyForm.previewImage),
    [caseStudyForm.previewImage],
  );
  const projectFileMeta = useMemo(
    () => getCaseStudyProjectFileMeta(caseStudyForm.projectFile),
    [caseStudyForm.projectFile],
  );
  useEffect(() => {
    if (
      typeof caseStudyForm.previewImage === "string" ||
      !bannerPreviewUrl.startsWith("blob:")
    ) {
      return undefined;
    }

    return () => {
      URL.revokeObjectURL(bannerPreviewUrl);
    };
  }, [bannerPreviewUrl, caseStudyForm.previewImage]);
  const titleError = String(caseStudyValidationErrors.title || "").trim();
  const descriptionError = String(caseStudyValidationErrors.description || "").trim();
  const nicheError = String(caseStudyValidationErrors.niche || "").trim();
  const roleError = String(caseStudyValidationErrors.role || "").trim();
  const timelineError = String(caseStudyValidationErrors.timeline || "").trim();
  const budgetError = String(caseStudyValidationErrors.budget || "").trim();
  const customCaseStudyFields = resolvedFields.filter(
    (field) =>
      !["title", "description", "niche", "projectLink", "projectFile", "role", "timeline", "budget", "previewImage"].includes(field.id) &&
      field.visible !== false,
  );

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col items-center">
      <div className="w-full space-y-8">
        {/* Heading */}
        <div className="text-center">
          <h1 className={ONBOARDING_PAGE_TITLE_CLASS}>
            {caseStudyContent?.headingTitle || "Tell Us About Your Previous Work"}
          </h1>
        </div>

        {/* Stepper */}
        <div className="mx-auto w-full max-w-3xl">
          <ServiceInfoStepper
            activeStepId="caseStudy"
            onStepChange={onServiceStepChange}
            steps={stepperSteps}
          />
        </div>

        {/* Step Content */}
        <div className="mx-auto w-full max-w-3xl space-y-4">
          <div className="space-y-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-3 sm:flex sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-3">
                <div>
                  <h2 className={cn(ONBOARDING_SECTION_TITLE_CLASS, "text-foreground")}>
                    {caseStudyContent?.sectionTitle || "Case Studies"}
                  </h2>
                  <p className={cn(ONBOARDING_SECTION_DESCRIPTION_CLASS, "text-muted-foreground")}>
                    {caseStudyContent?.sectionDescription ||
                      "Add multiple case studies and switch between them while filling the details."}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onSkipServices?.()}
                className={cn(
                  ONBOARDING_SERVICE_SKIP_BUTTON_CLASS,
                  "shrink-0 whitespace-nowrap px-3 py-2 text-sm sm:hidden",
                )}
              >
                Skip
              </Button>

              <div className="hidden sm:flex sm:flex-nowrap sm:items-center sm:justify-end sm:gap-3">
                <button
                  type="button"
                  onClick={onAddCaseStudy}
                  disabled={isCaseStudyLimitReached}
                  className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-primary bg-primary px-4 text-sm font-semibold whitespace-nowrap text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:border-border/60 disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 disabled:hover:bg-muted sm:w-auto"
                >
                  <Plus className="h-4 w-4 text-inherit" />
                  {caseStudyContent?.addButtonLabel || "Add Case Study"}
                </button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onSkipServices?.()}
                  className={cn(
                    ONBOARDING_SERVICE_SKIP_BUTTON_CLASS,
                    "shrink-0 whitespace-nowrap px-3 py-2 text-sm sm:px-6 sm:py-0 sm:text-base",
                  )}
                >
                  Skip
                </Button>
              </div>
            </div>

            <div className="sm:hidden">
              <button
                type="button"
                onClick={onAddCaseStudy}
                disabled={isCaseStudyLimitReached}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary bg-primary px-4 text-sm font-semibold whitespace-nowrap text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:border-border/60 disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 disabled:hover:bg-muted"
              >
                <Plus className="h-4 w-4 text-inherit" />
                {caseStudyContent?.addButtonLabel || "Add Case Study"}
              </button>
            </div>

            {normalizedCaseStudies.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
                {normalizedCaseStudies.map((caseStudy, index) => {
                  const caseStudyId = String(caseStudy?.id || "").trim();
                  const isActive = caseStudyId && caseStudyId === activeCaseStudyId;
                  const caseStudyLabel =
                    toTitleCase(caseStudy?.title) ||
                    `Case Study ${index + 1}`;

                  return (
                    <div
                      key={caseStudyId || `case-study-${index}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => onActiveCaseStudyChange?.(caseStudyId)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onActiveCaseStudyChange?.(caseStudyId);
                        }
                      }}
                      className={cn(
                        "flex h-10 items-center justify-center gap-2 rounded-full border pl-4 pr-1.5 text-center text-sm font-semibold transition-colors cursor-pointer",
                        isActive
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-muted/30 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span 
                        className={cn("truncate max-w-[11rem]", isActive && "text-primary-foreground")}
                      >
                        {caseStudyLabel}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveCaseStudy?.(caseStudyId);
                        }}
                        className={cn(
                          "shrink-0 rounded-full bg-background p-1 text-primary transition-colors hover:bg-background/90",
                        )}
                        aria-label={`Remove ${caseStudyLabel}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {isCaseStudyLimitReached ? (
              <p className="mt-3 text-sm text-muted-foreground">
                {caseStudyContent?.limitMessage ||
                  "Onboarding limit reached: 5 case studies. Add more later from your profile."}
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_18px_60px_rgba(0,0,0,0.08)]">
          {/* Project Header */}
          <h3 className={cn(ONBOARDING_SECTION_TITLE_CLASS, "mb-4 text-foreground")}>
            {activeCaseStudyLabel}
          </h3>

          <div className="space-y-4">
            {/* Case Study Title */}
            <div className="space-y-0">
              <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
                {fieldMap.title?.label || caseStudyContent?.fields?.title?.label || "Case Study Title"}
              </label>
              <input
                type="text"
                value={caseStudyForm.title}
                onChange={(e) =>
                  onCaseStudyFieldChange("title", e.target.value)
                }
                placeholder={
                  fieldMap.title?.placeholder ||
                  caseStudyContent?.fields?.title?.placeholder ||
                  "e.g. E-commerce Platform Redesign"
                }
                className={cn(
                  "h-10 w-full rounded-xl border bg-card px-4 !text-[14px] !leading-5 text-foreground outline-none transition-colors placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 focus:ring-1",
                  titleError
                    ? "border-destructive/70 focus:border-destructive/60 focus:ring-destructive/20"
                    : "border-border focus:border-primary/50 focus:ring-primary/20",
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
                {fieldMap.description?.label || caseStudyContent?.fields?.description?.label || "Description"}
              </label>
              <textarea
                value={caseStudyForm.description}
                onChange={(e) =>
                  onCaseStudyFieldChange("description", e.target.value)
                }
                placeholder={
                  fieldMap.description?.placeholder ||
                  caseStudyContent?.fields?.description?.placeholder ||
                  "Briefly describe the project and its goals..."
                }
                rows={4}
                className={cn(
                  "w-full resize-none rounded-xl border bg-card px-4 py-3 !text-[14px] !leading-5 text-foreground outline-none transition-colors placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 focus:ring-1",
                  descriptionError
                    ? "border-destructive/70 focus:border-destructive/60 focus:ring-destructive/20"
                    : "border-border focus:border-primary/50 focus:ring-primary/20",
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
                {fieldMap.niche?.label || caseStudyContent?.fields?.niche?.label || "Niche"}
              </label>
              <CustomSelect
                value={caseStudyForm.niche}
                onChange={(val) => onCaseStudyFieldChange("niche", val)}
                options={resolvedNicheOptions}
                placeholder={
                  fieldMap.niche?.placeholder || caseStudyContent?.fields?.niche?.placeholder || "Select niche"
                }
                isSearchable
                searchPlaceholder={
                  fieldMap.niche?.searchPlaceholder || caseStudyContent?.fields?.niche?.searchPlaceholder ||
                  "Search niches"
                }
                hasError={Boolean(nicheError)}
                className="h-10"
              />
              {nicheError ? (
                <p className="mt-1 text-sm text-destructive">{nicheError}</p>
              ) : null}
            </div>

            {/* 2-column row: Project Link, Your Role */}
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Project Link */}
              <div className="space-y-0">
                <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
                  {fieldMap.projectLink?.label || caseStudyContent?.fields?.projectLink?.label ||
                    "Project Link (Optional)"}
                </label>
                <div className="relative">
                  <Link2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                  <input
                    type="url"
                    value={caseStudyForm.projectLink}
                    onChange={(e) =>
                      onCaseStudyFieldChange("projectLink", e.target.value)
                    }
                    placeholder={
                      fieldMap.projectLink?.placeholder || caseStudyContent?.fields?.projectLink?.placeholder ||
                      "https://..."
                    }
                    className={cn(
                      "h-10 w-full rounded-xl border border-border bg-card pl-10 pr-4 !text-[14px] !leading-5 text-foreground outline-none transition-colors placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 focus:border-primary/50 focus:ring-1 focus:ring-primary/20",
                    )}
                  />
                </div>
              </div>

              {/* Your Role */}
              <div className="space-y-0">
                <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
                  {fieldMap.role?.label || caseStudyContent?.fields?.role?.label || "Your Role"}
                </label>
                <CustomSelect
                  value={caseStudyForm.role}
                  onChange={(val) => onCaseStudyFieldChange("role", val)}
                  options={roleOptions}
                  placeholder={
                    fieldMap.role?.placeholder || caseStudyContent?.fields?.role?.placeholder || "Select role"
                  }
                  hasError={Boolean(roleError)}
                  className="h-10"
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
                  {fieldMap.timeline?.label || caseStudyContent?.fields?.timeline?.label || "Timeline"}
                </label>
                <CustomSelect
                  value={caseStudyForm.timeline}
                  onChange={(val) => onCaseStudyFieldChange("timeline", val)}
                  options={timelineOptions}
                  placeholder={
                    fieldMap.timeline?.placeholder || caseStudyContent?.fields?.timeline?.placeholder ||
                    "Select duration"
                  }
                  hasError={Boolean(timelineError)}
                  className="h-10"
                />
                {timelineError ? (
                  <p className="mt-1 text-sm text-destructive">{timelineError}</p>
                ) : null}
              </div>

              {/* Budget */}
              <div className="space-y-0">
                <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
                  {fieldMap.budget?.label || caseStudyContent?.fields?.budget?.label || "Budget"}
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                  <input
                    type="text"
                    value={caseStudyForm.budget}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      onCaseStudyFieldChange("budget", val);
                    }}
                    placeholder={
                      fieldMap.budget?.placeholder || caseStudyContent?.fields?.budget?.placeholder ||
                      "e.g. 5000"
                    }
                    className={cn(
                      "h-10 w-full rounded-xl border bg-card pl-10 pr-4 !text-[14px] !leading-5 text-foreground outline-none transition-colors placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 focus:ring-1",
                      budgetError
                        ? "border-destructive/70 focus:border-destructive/60 focus:ring-destructive/20"
                        : "border-border focus:border-primary/50 focus:ring-primary/20",
                    )}
                    aria-invalid={Boolean(budgetError)}
                  />
                </div>
                {budgetError ? (
                  <p className="mt-1 text-sm text-destructive">{budgetError}</p>
                ) : null}
              </div>
            </div>

            {/* 2-column row: Project File, Banner Image */}
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Project File */}
              <div className="space-y-0">
                <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
                  {fieldMap.projectFile?.label || caseStudyContent?.fields?.projectFile?.label ||
                    "Project File (Optional)"}
                </label>
                <FileUploadButton
                  file={caseStudyForm.projectFile}
                  onChange={(file) =>
                    onCaseStudyFieldChange("projectFile", file)
                  }
                />
                {projectFileMeta.name ? (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {projectFileMeta.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Project file ready
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {projectFileMeta.url ? (
                        <a
                          href={projectFileMeta.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                        >
                          View
                        </a>
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onCaseStudyFieldChange("projectFile", null)}
                      >
                        Remove file
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Banner Image */}
              <div className="space-y-0">
                <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
                  Banner Image (Optional)
                </label>
                <FileUploadButton
                  file={caseStudyForm.previewImage}
                  isLoading={isUploadingBanner}
                  accept="image/*"
                  hasError={Boolean(bannerUploadError)}
                  onChange={async (file) => {
                    if (!file) {
                      setBannerUploadError("");
                      onCaseStudyFieldChange("previewImage", null);
                      return;
                    }
                    if (typeof file === "string") {
                      setBannerUploadError("");
                      onCaseStudyFieldChange("previewImage", file);
                      return;
                    }
                    const fileType = String(file.type || "").trim().toLowerCase();
                    if (!fileType.startsWith("image/")) {
                      setBannerUploadError("Banner image must be an image file.");
                      return;
                    }
                    if (file.size > CASE_STUDY_BANNER_MAX_BYTES) {
                      setBannerUploadError("Banner image must be 4.5MB or smaller.");
                      return;
                    }
                    try {
                      setBannerUploadError("");
                      setIsUploadingBanner(true);
                      const uploaded = await onUploadMediaFile(file);
                      if (uploaded?.url) {
                        onCaseStudyFieldChange("previewImage", uploaded.url);
                      }
                    } catch (err) {
                      setBannerUploadError(
                        err?.message || "Failed to upload the banner image.",
                      );
                      console.error("Banner upload error:", err);
                    } finally {
                      setIsUploadingBanner(false);
                    }
                  }}
                />
                {bannerPreviewUrl ? (
                  <div className="mt-3 space-y-3">
                    <div className="overflow-hidden rounded-2xl border border-border bg-card">
                      <img
                        src={bannerPreviewUrl}
                        alt="Case study banner preview"
                        className="aspect-[16/9] w-full object-cover"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setBannerUploadError("");
                          onCaseStudyFieldChange("previewImage", null);
                        }}
                      >
                        Remove photo
                      </Button>
                    </div>
                  </div>
                ) : null}
                <span className="text-xs text-muted-foreground mt-2 block">
                  {bannerUploadError || "JPG, PNG, GIF, or WebP. Max 4.5MB."}
                </span>
              </div>
            </div>


            {customCaseStudyFields.map((field) => {
              const customValue = caseStudyForm?.customFields?.[field.id] ?? "";
              const customError = String(caseStudyValidationErrors[field.id] || "").trim();

              if (field.type === "textarea") {
                return (
                  <div key={field.id} className="space-y-0">
                    <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
                      {field.label}
                    </label>
                    <textarea
                      value={customValue}
                      onChange={(e) => onCaseStudyFieldChange(field.id, e.target.value)}
                      placeholder={field.placeholder || ""}
                      rows={4}
                      className={cn(
                        "w-full resize-none rounded-xl border bg-card px-4 py-3 !text-[14px] !leading-5 text-foreground outline-none transition-colors placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 focus:ring-1",
                        customError
                          ? "border-destructive/70 focus:border-destructive/60 focus:ring-destructive/20"
                          : "border-border focus:border-primary/50 focus:ring-primary/20",
                      )}
                    />
                    {customError ? <p className="mt-1 text-sm text-destructive">{customError}</p> : null}
                  </div>
                );
              }

              if (field.type === "select") {
                return (
                  <div key={field.id} className="space-y-0">
                    <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
                      {field.label}
                    </label>
                    <CustomSelect
                      value={customValue}
                      onChange={(val) => onCaseStudyFieldChange(field.id, val)}
                      options={field.options || []}
                      placeholder={field.placeholder || "Select option"}
                      isSearchable={Boolean(field.searchPlaceholder)}
                      searchPlaceholder={field.searchPlaceholder || "Search"}
                      hasError={Boolean(customError)}
                      className="h-10"
                    />
                    {customError ? <p className="mt-1 text-sm text-destructive">{customError}</p> : null}
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
                    onChange={(e) => onCaseStudyFieldChange(field.id, e.target.value)}
                    placeholder={field.placeholder || ""}
                    className={cn(
                      "h-10 w-full rounded-xl border bg-card px-4 !text-[14px] !leading-5 text-foreground outline-none transition-colors placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 focus:ring-1",
                      customError
                        ? "border-destructive/70 focus:border-destructive/60 focus:ring-destructive/20"
                        : "border-border focus:border-primary/50 focus:ring-primary/20",
                    )}
                  />
                  {customError ? <p className="mt-1 text-sm text-destructive">{customError}</p> : null}
                </div>
              );
            })}
      </div>
      </div>
      </div>
      </div>

      {continueButton}
    </section>
  );
};

export default FreelancerCaseStudySlide;
