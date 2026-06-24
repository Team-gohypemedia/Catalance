import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import IndianRupee from "lucide-react/dist/esm/icons/indian-rupee";
import Link2 from "lucide-react/dist/esm/icons/link-2";
import Info from "lucide-react/dist/esm/icons/info";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Plus from "lucide-react/dist/esm/icons/plus";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import Upload from "lucide-react/dist/esm/icons/upload";
import X from "lucide-react/dist/esm/icons/x";
import { toast } from "sonner";

import { request } from "@/shared/lib/api-client";
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
  "text-balance text-xl font-semibold leading-[1.12] tracking-[-0.03em] sm:text-[34px] md:text-[40px]";
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
  isLoading = false,
}) => {
  const inputRef = useRef(null);

  return (
    <div className="relative min-w-0">
      <button
        type="button"
        onClick={() => !isLoading && inputRef.current?.click()}
        disabled={isLoading}
        className={cn(
          "flex h-10 w-full min-w-0 items-center justify-start gap-2 rounded-xl border bg-card px-4 !text-[14px] !leading-5 transition-colors disabled:cursor-not-allowed disabled:opacity-70",
          file && !isLoading ? "pr-9" : "",
          file ? "text-foreground" : "text-muted-foreground",
          hasError
            ? "border-destructive/70 hover:border-destructive/80"
            : "border-border hover:border-border/80",
        )}
        aria-invalid={hasError}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
        ) : (
          <Upload className="h-4 w-4 shrink-0" />
        )}
        <span className="min-w-0 truncate text-left">
          {isLoading
            ? "Uploading..."
            : file
              ? typeof file === "string"
                ? "File Uploaded"
                : file.name
              : "Upload file"}
        </span>
      </button>
      {file && !isLoading && (
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
  totalSelectedServices = 1,
  currentServiceIndex = 0,
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
  user,
  onAddRequestedNiche,
  isAgency = false,
}) => {
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [bannerUploadError, setBannerUploadError] = useState("");
  const titleInputRef = useRef(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const infoModalScrollRef = useRef(null);
  const [isRequestingNiche, setIsRequestingNiche] = useState(false);

  // Scroll onboarding container to top on mobile when slide mounts or active case study changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        const scrollContainer = document.querySelector(".subtle-scrollbar");
        if (scrollContainer) {
          scrollContainer.scrollTop = 0;
        }
      }
    }
  }, [activeCaseStudyId, activeCaseStudyIndex]);

  // Scroll modal content to bottom when opened (mobile)
  useEffect(() => {
    if (showInfoModal) {
      const timer = setTimeout(() => {
        if (infoModalScrollRef.current) {
          infoModalScrollRef.current.scrollTop = infoModalScrollRef.current.scrollHeight;
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [showInfoModal]);

  const handleRequestNiche = async (requestName) => {
    if (!requestName) return;

    setIsRequestingNiche(true);
    try {
      const payload = await request("/user-requests", {
        method: "POST",
        body: JSON.stringify({
          request: requestName,
          requestedType: "niche",
        }),
      });

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
      toast.error(error?.message || "Failed to request niche");
    } finally {
      setIsRequestingNiche(false);
    }
  };

  useEffect(() => {
    titleInputRef.current?.focus();

    // Wait until the user auth state is resolved to prevent guest vs. user ID race conditions
    if (user === undefined) {
      return;
    }

    const storageKey = isAgency
      ? `seen_case_study_info_modal_agency_${user?.id || "guest"}`
      : `seen_case_study_info_modal_${user?.id || "guest"}`;

    const hasSeen = localStorage.getItem(storageKey);
    if (!hasSeen) {
      // Show info popup after a comfortable 2.5-second delay to let the user see the form first
      const timer = setTimeout(() => {
        // Double check hasSeen inside the timeout to prevent race conditions if opened manually
        if (!localStorage.getItem(storageKey)) {
          setShowInfoModal(true);
          localStorage.setItem(storageKey, "true");
        }
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [user?.id, isAgency, user]);

  const handleCloseModal = () => {
    setShowInfoModal(false);

    // Ensure the storage key is set when manually closing
    if (user !== undefined) {
      const storageKey = isAgency
        ? `seen_case_study_info_modal_agency_${user?.id || "guest"}`
        : `seen_case_study_info_modal_${user?.id || "guest"}`;
      localStorage.setItem(storageKey, "true");
    }

    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 50);
  };

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
  const resolvedNicheOptions = useMemo(() => {
    let options = [];
    if (Array.isArray(fieldMap.niche?.options) && fieldMap.niche.options.length > 0) {
      options = fieldMap.niche.options;
    } else if (
      Array.isArray(caseStudyContent?.fields?.niche?.options) &&
      caseStudyContent.fields.niche.options.length > 0
    ) {
      options = caseStudyContent.fields.niche.options;
    } else {
      options = nicheOptions;
    }

    // Ensure the currently selected niche is always in the options list so the dropdown label resolves correctly
    if (caseStudyForm.niche && !options.some((o) => o.value === caseStudyForm.niche)) {
      return [...options, { value: caseStudyForm.niche, label: caseStudyForm.niche }];
    }
    return options;
  }, [fieldMap.niche?.options, caseStudyContent?.fields?.niche?.options, nicheOptions, caseStudyForm.niche]);
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
    <section className="mx-auto flex w-full max-w-6xl flex-col items-center pt-5 sm:pt-0">
      <div className="w-full space-y-4">
        {/* Heading */}
        <div className="mx-auto w-full max-w-3xl relative text-center">
          
          {totalSelectedServices > 1 && (
            <div className="mb-2 text-sm font-semibold tracking-wide text-foreground uppercase">
              Service {currentServiceIndex + 1} of {totalSelectedServices}
            </div>
          )}
          <h1 className={ONBOARDING_PAGE_TITLE_CLASS}>
            {(() => {
              const headingText = caseStudyContent?.headingTitle || "Tell Us About Your Previous Work";
              const matchIdx = headingText.toLowerCase().lastIndexOf("previous work");
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

        {/* Stepper */}
        <div className="mx-auto w-full max-w-3xl relative flex flex-col sm:flex-row items-center sm:justify-center gap-4 sm:gap-0">
          <ServiceInfoStepper
            activeStepId="caseStudy"
            onStepChange={onServiceStepChange}
          />
          {onSkipServices && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onSkipServices?.()}
              className="onboarding-skip-btn static self-end sm:self-auto sm:absolute sm:right-0 shrink-0 whitespace-nowrap px-3 py-2 cursor-pointer"
            >Skip</Button>
          )}
        </div>

        {/* Step Content */}
        <div className="mx-auto w-full max-w-3xl space-y-4">
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 sm:flex sm:items-center sm:justify-between">
                <div className="min-w-0 sm:flex-1">
                  <h2 className={cn(ONBOARDING_SECTION_TITLE_CLASS, "text-foreground")}>
                    {caseStudyContent?.sectionTitle || "Case Studies"}
                  </h2>
                </div>

                <div className="hidden sm:flex sm:flex-nowrap sm:items-center sm:justify-end sm:gap-3">
                  <button
                    type="button"
                    onClick={onAddCaseStudy}
                    disabled={isCaseStudyLimitReached}
                    className="case-study-add-btn inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-primary bg-transparent px-4 text-sm font-semibold whitespace-nowrap text-primary transition-all duration-200 hover:bg-primary/10 disabled:cursor-not-allowed disabled:border-border/60 disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 disabled:hover:bg-muted sm:w-auto"
                  >
                    <Plus className="h-4 w-4 text-primary" />
                    {caseStudyContent?.addButtonLabel || "Add Case Study"}
                  </button>
                </div>
              </div>

              <p className={cn(ONBOARDING_SECTION_DESCRIPTION_CLASS, "text-muted-foreground sm:whitespace-nowrap")}>
                {caseStudyContent?.sectionDescription ||
                  "Add multiple case studies and switch between them."}
              </p>
            </div>

            <div className="sm:hidden">
              <button
                type="button"
                onClick={onAddCaseStudy}
                disabled={isCaseStudyLimitReached}
                className="case-study-add-btn inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary bg-transparent px-4 text-sm font-semibold whitespace-nowrap text-primary transition-all duration-200 hover:bg-primary/10 disabled:cursor-not-allowed disabled:border-border/60 disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 disabled:hover:bg-muted"
              >
                <Plus className="h-4 w-4 text-primary" />
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
                          "shrink-0 rounded-full bg-background p-1 text-primary transition-colors hover:bg-background/90 dark:bg-black dark:text-white dark:hover:bg-black/80 case-study-close-btn",
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

          <div className="relative rounded-2xl border border-border bg-card p-4 shadow-[0_18px_60px_rgba(0,0,0,0.08)]">
            <button
              type="button"
              onClick={() => {
                setShowInfoModal(true);
                if (user !== undefined) {
                  const storageKey = isAgency
                    ? `seen_case_study_info_modal_agency_${user?.id || "guest"}`
                    : `seen_case_study_info_modal_${user?.id || "guest"}`;
                  localStorage.setItem(storageKey, "true");
                }
              }}
              className="absolute right-4 top-4 inline-flex size-6 items-center justify-center rounded-full bg-primary/15 text-primary transition-all duration-200 hover:bg-primary/25 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 cursor-pointer z-10"
              aria-label="View case studies info"
              title="View case studies info"
            >
              <Info className="size-3.5" />
            </button>
            {/* Project Header */}
            <h3 className={cn(ONBOARDING_SECTION_TITLE_CLASS, "mb-4 pr-8 text-foreground")}>
              {activeCaseStudyLabel}
            </h3>

          <div className="space-y-4">
            {/* Case Study Title */}
            <div className="space-y-0">
              <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
                {fieldMap.title?.label || caseStudyContent?.fields?.title?.label || "Case Study Title"}
              </label>
              <input
                ref={titleInputRef}
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
                  "h-10 w-full rounded-xl border bg-card px-4 !text-[14px] !leading-5 text-foreground outline-none transition-colors placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground/50 placeholder:font-normal [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 [&::placeholder]:font-normal focus:ring-1",
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
              <div className="relative">
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
                  rows={2}
                  className={cn(
                    "w-full resize-y h-[72px] min-h-[60px] rounded-xl border bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 placeholder:font-normal [&::placeholder]:font-normal focus:ring-1 pb-9 pr-14 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:!hidden",
                    (descriptionError || String(caseStudyForm.description || "").trim().split(/\s+/).filter(Boolean).length > 150)
                      ? "border-destructive/70 focus:border-destructive/60 focus:ring-destructive/20"
                      : "border-border focus:border-primary/50 focus:ring-primary/20",
                  )}
                  aria-invalid={Boolean(descriptionError)}
                />
                <span
                  className={cn(
                    "absolute right-3.5 bottom-3.5 text-[11px] font-normal transition-colors pointer-events-none",
                    String(caseStudyForm.description || "").trim().split(/\s+/).filter(Boolean).length > 150
                      ? "text-destructive"
                      : "text-black/20 dark:text-white/20",
                  )}
                >
                  {String(caseStudyForm.description || "").trim().split(/\s+/).filter(Boolean).length} / 150 words
                </span>
              </div>
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
                onRequestMissingOption={handleRequestNiche}
                isRequestingOption={isRequestingNiche}
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
                      "h-10 w-full rounded-xl border border-border bg-card pl-10 pr-4 !text-[14px] !leading-5 text-foreground outline-none transition-colors placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground/50 placeholder:font-normal [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 [&::placeholder]:font-normal focus:border-primary/50 focus:ring-1 focus:ring-primary/20",
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
                      "h-10 w-full rounded-xl border bg-card pl-10 pr-4 !text-[14px] !leading-5 text-foreground outline-none transition-colors placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground/50 placeholder:font-normal [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 [&::placeholder]:font-normal focus:ring-1",
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
            <div className="grid min-w-0 gap-5 sm:grid-cols-2">
              {/* Project File */}
              <div className="min-w-0 space-y-0">
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
                  <div className="mt-3 flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {projectFileMeta.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Project file ready
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
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
              <div className="min-w-0 space-y-0">
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
                  <div className="mt-3 min-w-0 space-y-3">
                    <div className="w-full max-w-full overflow-hidden rounded-2xl border border-border bg-card">
                      <img
                        src={bannerPreviewUrl}
                        alt="Case study banner preview"
                        className="block aspect-[16/9] w-full max-w-full object-cover"
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
                        "w-full resize-none rounded-xl border bg-card px-4 py-3 !text-[14px] !leading-5 text-foreground outline-none transition-colors placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground/50 placeholder:font-normal [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 [&::placeholder]:font-normal focus:ring-1",
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
                      "h-10 w-full rounded-xl border bg-card px-4 !text-[14px] !leading-5 text-foreground outline-none transition-colors placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground/50 placeholder:font-normal [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 [&::placeholder]:font-normal focus:ring-1",
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

      {/* Get Discovered. Rank Higher. Info Popup */}
      <AnimatePresence>
        {showInfoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-foreground"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{
                type: "spring",
                stiffness: 280,
                damping: 26,
                mass: 0.9
              }}
              className="relative w-full max-w-[760px] md:w-[70%] lg:w-[48vw] max-h-[80vh] md:max-h-[72vh] flex flex-col rounded-3xl border border-border bg-card p-4 shadow-[0_28px_100px_rgba(0,0,0,0.16)] dark:shadow-[0_28px_100px_rgba(0,0,0,0.45)] overflow-hidden"
            >
              
              {/* Close Button */}
              <button
                onClick={handleCloseModal}
                className="absolute right-4 top-4 p-2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer z-10"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Modal Title */}
              <div className="text-center mb-2 shrink-0 pr-8">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Get Discovered. Rank Higher.
                </h2>
              </div>

              {/* Scrollable Content */}
              <div 
                ref={infoModalScrollRef}
                className="flex-1 overflow-y-auto pr-1 py-1 space-y-3"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,0.15) transparent' }}
              >
                {/* Modal Grid Content */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
                  
                  {/* Left Column: Top Rated Freelancer list */}
                  <div className="md:col-span-6 bg-muted/40 rounded-2xl p-3 border border-border/50 space-y-1.5 flex flex-col justify-center order-1 md:order-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-base">👑</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Top Rated Freelancers
                      </span>
                    </div>

                    {/* Row 1: Your Profile (Highlighted) */}
                    <div className="flex items-center justify-between gap-1.5 py-1.5 px-2 rounded-xl border border-primary/45 bg-primary/5 dark:bg-primary/10 shadow-sm min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="text-xs font-bold text-primary shrink-0">1</span>
                        {user?.avatar || user?.profilePhoto || user?.profileDetails?.identity?.profilePhoto ? (
                          <img
                            src={user?.avatar || user?.profilePhoto || user?.profileDetails?.identity?.profilePhoto}
                            alt=""
                            className="size-6 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            <span className="text-[9px] font-semibold text-primary">YP</span>
                          </div>
                        )}
                        <span className="text-xs font-semibold truncate text-foreground min-w-0 flex-1">Your Profile</span>
                        <span className="shrink-0 bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">
                          Top Rated
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0 text-xs font-semibold text-foreground">
                        <span className="text-amber-500">★</span>
                        <span>5.0</span>
                        <span className="text-[10px] text-muted-foreground font-normal ml-0.5">(128)</span>
                      </div>
                    </div>

                    {/* Row 2: Dummy Freelancer */}
                    <div className="flex items-center justify-between gap-1.5 py-1 px-2 rounded-xl opacity-60 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="text-xs font-bold text-muted-foreground shrink-0">2</span>
                        <div className="size-6 rounded-full bg-muted flex items-center justify-center shrink-0" />
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="h-1 w-12 bg-muted-foreground/30 rounded" />
                          <div className="h-1 w-8 bg-muted-foreground/20 rounded" />
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0 text-xs font-semibold text-foreground">
                        <span className="text-amber-500">★</span>
                        <span>4.9</span>
                      </div>
                    </div>

                    {/* Row 3: Dummy Freelancer */}
                    <div className="flex items-center justify-between gap-1.5 py-1 px-2 rounded-xl opacity-60 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="text-xs font-bold text-muted-foreground shrink-0">3</span>
                        <div className="size-6 rounded-full bg-muted flex items-center justify-center shrink-0" />
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="h-1 w-16 bg-muted-foreground/30 rounded" />
                          <div className="h-1 w-6 bg-muted-foreground/20 rounded" />
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0 text-xs font-semibold text-foreground">
                        <span className="text-amber-500">★</span>
                        <span>4.8</span>
                      </div>
                    </div>

                    {/* Row 4: Dummy Freelancer */}
                    <div className="flex items-center justify-between gap-1.5 py-1 px-2 rounded-xl opacity-60 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="text-xs font-bold text-muted-foreground shrink-0">4</span>
                        <div className="size-6 rounded-full bg-muted flex items-center justify-center shrink-0" />
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="h-1 w-10 bg-muted-foreground/30 rounded" />
                          <div className="h-1 w-8 bg-muted-foreground/20 rounded" />
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0 text-xs font-semibold text-foreground">
                        <span className="text-amber-500">★</span>
                        <span>4.7</span>
                      </div>
                    </div>

                    {/* Row 5: Dummy Freelancer */}
                    <div className="flex items-center justify-between gap-1.5 py-1 px-2 rounded-xl opacity-60 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="text-xs font-bold text-muted-foreground shrink-0">5</span>
                        <div className="size-6 rounded-full bg-muted flex items-center justify-center shrink-0" />
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="h-1 w-12 bg-muted-foreground/30 rounded" />
                          <div className="h-1 w-8 bg-muted-foreground/20 rounded" />
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0 text-xs font-semibold text-foreground">
                        <span className="text-amber-500">★</span>
                        <span>4.6</span>
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Case study info points */}
                  <div className="md:col-span-6 space-y-3 flex flex-col justify-between order-2 md:order-2">
                    <div>
                      <h3 className="text-sm md:text-base font-bold text-foreground whitespace-nowrap">
                        Complete Case Studies, <span className="text-primary">Get More Visibility</span>
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                        Freelancers with complete case studies are more likely to rank higher and win client trust.
                      </p>
                    </div>

                    {/* Features */}
                    <div className="space-y-2.5 pt-0.5">
                      {/* Feature 1 */}
                      <div className="flex gap-2.5 items-start">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <TrendingUp className="h-3.5 w-3.5" />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-foreground">Higher Visibility</h4>
                          <p className="text-[10px] text-muted-foreground leading-normal">
                            Better rankings in search results and marketplace.
                          </p>
                        </div>
                      </div>

                      {/* Feature 2 */}
                      <div className="flex gap-2.5 items-start">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <ShieldCheck className="h-3.5 w-3.5" />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-foreground">Build Trust</h4>
                          <p className="text-[10px] text-muted-foreground leading-normal">
                            Clients feel more confident hiring proven professionals.
                          </p>
                        </div>
                      </div>

                      {/* Feature 3 */}
                      <div className="flex gap-2.5 items-start">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Briefcase className="h-3.5 w-3.5" />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-foreground">Win More Projects</h4>
                          <p className="text-[10px] text-muted-foreground leading-normal">
                            Strong case studies lead to more inquiries and successful projects.
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Tip Box */}
                <div className="rounded-xl border border-primary/10 bg-primary/5 p-2 flex gap-2 items-start">
                  <span className="text-xs shrink-0">💡</span>
                  <p className="text-[10px] text-foreground leading-normal">
                    <span className="font-semibold">Tip:</span> Add detailed case studies with outcomes, screenshots, and results for best impact.
                  </p>
                </div>
              </div>

              {/* Start Button */}
              <div className="mt-3 flex flex-col items-center justify-center border-t border-border pt-3 shrink-0">
                <button
                  onClick={handleCloseModal}
                  className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-6 text-xs font-semibold text-white keep-white dark:text-black hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors cursor-pointer"
                >
                  Start Adding Case Studies
                </button>
                <span className="text-[9px] text-muted-foreground mt-1 text-center">
                  You can edit or update case studies anytime.
                </span>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default FreelancerCaseStudySlide;
