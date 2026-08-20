import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import IndianRupee from "lucide-react/dist/esm/icons/indian-rupee";
import Link2 from "lucide-react/dist/esm/icons/link-2";
import Eye from "lucide-react/dist/esm/icons/eye";
import Info from "lucide-react/dist/esm/icons/info";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Plus from "lucide-react/dist/esm/icons/plus";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import Upload from "lucide-react/dist/esm/icons/upload";
import X from "lucide-react/dist/esm/icons/x";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { getPricingUnitOptions, resolveServiceKey } from "../service-details";

const CASE_STUDY_BANNER_MAX_BYTES = 4.5 * 1024 * 1024;

const ONBOARDING_PAGE_TITLE_CLASS =
  "text-[20px] font-semibold leading-[1.12] tracking-[-0.03em] sm:text-[34px] md:text-[40px]";
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
  activeCaseStudyId = null,
  activeCaseStudyIndex = 0,
  nicheOptions = [],
  dbServices = [],
  currentServiceKey = "",
  currentServiceName = "",
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
  const [caseStudyToDeleteId, setCaseStudyToDeleteId] = useState(null);
  const resolvedServiceKey = useMemo(
    () =>
      resolveServiceKey(
        dbServices,
        currentServiceKey || currentServiceName,
      ),
    [currentServiceKey, currentServiceName, dbServices],
  );
  const shouldHideWebsiteCaseStudyPricingFields =
    resolvedServiceKey === "website_development" ||
    resolvedServiceKey === "web_development";


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

  useEffect(() => {
    if (!shouldHideWebsiteCaseStudyPricingFields) {
      return;
    }

    if (caseStudyForm.pricingUnit) {
      onCaseStudyFieldChange("pricingUnit", "");
    }

    if (caseStudyForm.pricingQuantity) {
      onCaseStudyFieldChange("pricingQuantity", "");
    }
  }, [
    caseStudyForm.pricingQuantity,
    caseStudyForm.pricingUnit,
    onCaseStudyFieldChange,
    shouldHideWebsiteCaseStudyPricingFields,
  ]);

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
                          setCaseStudyToDeleteId(caseStudyId);
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

            {/* Pricing fields (Unit and Quantity) */}
            {(() => {
              const options = getPricingUnitOptions(resolvedServiceKey || currentServiceName);
              const currentUnit = caseStudyForm.pricingUnit || options[0].value;

              return !shouldHideWebsiteCaseStudyPricingFields && options[0].value !== "project" ? (
                <div className="grid min-w-0 gap-5 sm:grid-cols-2">
                  <div className="min-w-0 space-y-0">
                    <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
                      Pricing Unit
                    </label>
                    <div className="relative">
                      <select
                        value={currentUnit}
                        onChange={(e) => {
                          onCaseStudyFieldChange("pricingUnit", e.target.value);
                          if (e.target.value === "project") {
                            onCaseStudyFieldChange("pricingQuantity", "1");
                          }
                        }}
                        className="h-10 w-full appearance-none rounded-xl border border-border bg-card px-3 text-[14px] leading-5 text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                      >
                        {options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="min-w-0 space-y-0">
                    <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
                      Quantity
                      <span className="ml-1 text-muted-foreground/60 font-normal normal-case tracking-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={caseStudyForm.pricingQuantity !== undefined ? caseStudyForm.pricingQuantity : "1"}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, "");
                          onCaseStudyFieldChange("pricingQuantity", val);
                        }}
                        disabled={currentUnit === "project"}
                        className="h-10 w-full rounded-xl border border-border bg-card px-3 text-[14px] leading-5 text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>
              ) : null;
            })()}

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
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 dark:bg-black/75 backdrop-blur-sm p-4 text-foreground"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{
                type: "spring",
                stiffness: 320,
                damping: 28,
              }}
              className="relative w-full max-w-[480px] max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#09090b] p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.85)] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:!hidden flex flex-col justify-between"
            >
              {/* Close Button */}
              <button
                onClick={handleCloseModal}
                className="absolute right-3.5 top-3.5 sm:right-4 sm:top-4 size-7 sm:size-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer z-20"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>

              <div>
                {/* ━━━ Header Section: Rocket + Title + 3D Podium ━━━ */}
                <div className="flex items-start justify-between gap-2 pt-0.5">
                  <div className="flex-1 min-w-0 pr-1">
                    <span className="text-2xl sm:text-3xl block mb-1 select-none" role="img" aria-label="Rocket">
                      🚀
                    </span>
                    <h2 className="text-2xl sm:text-[26px] font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                      Stand Out.
                      <br />
                      <span className="text-primary">Rank Higher.</span>
                    </h2>
                    <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">
                      Freelancers with case studies get more visibility and win trust.
                    </p>
                  </div>

                  {/* 3D Podium Graphic (Transparent PNG) */}
                  <div className="shrink-0 -mr-1 -mt-2">
                    <img
                      src="/assets/onboarding/podium-leaderboard.png"
                      alt="Top Rated Podium"
                      className="w-32 sm:w-36 h-auto object-contain select-none pointer-events-none drop-shadow-md"
                    />
                  </div>
                </div>

                {/* ━━━ Top Rated Freelancers Leaderboard Card ━━━ */}
                <div className="mt-3.5 rounded-xl border border-slate-100 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#131316] p-2.5 sm:p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <div className="size-4.5 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-xs">
                      🏆
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Top Rated Freelancers
                    </span>
                  </div>

                  {/* Row 1: Your Profile (Highlighted Active Row - Yellow Theme) */}
                  <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border border-primary/40 bg-gradient-to-r from-primary/15 via-primary/10 to-transparent dark:from-primary/20 dark:via-primary/10 dark:to-transparent shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-xs sm:text-sm font-black text-primary w-3.5 shrink-0">1</span>
                      <div className="relative shrink-0">
                        <img
                          src="/assets/onboarding/top-rated-avatar.png"
                          alt="Your Profile"
                          className="size-7 sm:size-8 rounded-full object-cover border border-primary/50 shadow-2xs"
                        />
                        <span className="absolute -top-1.5 -right-1 text-[11px] select-none rotate-[15deg]">
                          👑
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        Your Profile
                      </span>
                      <span className="shrink-0 px-1.5 py-0.5 rounded border border-primary/40 bg-primary/20 text-[8px] sm:text-[9px] font-bold tracking-wider text-primary uppercase">
                        TOP RATED
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-white shrink-0">
                      <span className="text-amber-400 text-sm leading-none">★</span>
                      <span>5.0</span>
                    </div>
                  </div>

                  {/* Rows 2 to 5 (Dummy Skeleton Rows) */}
                  {[
                    { rank: 2, rating: "4.9", barWidth: "w-28 sm:w-36" },
                    { rank: 3, rating: "4.8", barWidth: "w-24 sm:w-28" },
                    { rank: 4, rating: "4.7", barWidth: "w-20 sm:w-24" },
                    { rank: 5, rating: "4.6", barWidth: "w-16 sm:w-20" },
                  ].map((row) => (
                    <div
                      key={`top-ranked-${row.rank}`}
                      className="flex items-center justify-between gap-2 px-2.5 py-0.5 rounded-md opacity-60 dark:opacity-40"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 w-3.5 shrink-0">
                          {row.rank}
                        </span>
                        <div className="size-5.5 sm:size-6 rounded-full bg-slate-200 dark:bg-white/10 shrink-0" />
                        <div className={cn("h-1.5 bg-slate-200 dark:bg-white/10 rounded-full", row.barWidth)} />
                      </div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">
                        <span className="text-amber-400 text-xs">★</span>
                        <span>{row.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ━━━ Why Case Studies Matter Section ━━━ */}
                <div className="mt-3.5">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-amber-400 font-bold text-xs sm:text-sm tracking-tighter select-none">ˏˋ</span>
                    <h3 className="text-xs sm:text-[13px] font-extrabold text-slate-900 dark:text-white tracking-tight">
                      Why Case Studies Matter
                    </h3>
                    <span className="text-amber-400 font-bold text-xs sm:text-sm tracking-tighter select-none">ˎˊ</span>
                  </div>

                  {/* 3 Value Prop Cards */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* Card 1: More Visibility */}
                    <div className="rounded-xl border border-purple-100 dark:border-purple-500/20 bg-gradient-to-b from-purple-50/60 to-white dark:from-purple-950/25 dark:to-[#131316] p-2 text-center flex flex-col items-center justify-start min-h-[96px] shadow-2xs">
                      <div className="size-7 sm:size-8 rounded-full bg-[#8b5cf6] text-white flex items-center justify-center shadow-xs mb-1 shrink-0">
                        <Eye className="size-3.5 sm:size-4 stroke-[2.5]" />
                      </div>
                      <h4 className="text-[10px] sm:text-[11px] font-bold text-[#6d28d9] dark:text-purple-300 leading-tight">
                        More Visibility
                      </h4>
                      <p className="text-[8.5px] sm:text-[9.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        Rank higher in search and marketplace
                      </p>
                    </div>

                    {/* Card 2: Build Trust */}
                    <div className="rounded-xl border border-blue-100 dark:border-blue-500/20 bg-gradient-to-b from-blue-50/60 to-white dark:from-blue-950/25 dark:to-[#131316] p-2 text-center flex flex-col items-center justify-start min-h-[96px] shadow-2xs">
                      <div className="size-7 sm:size-8 rounded-full bg-[#3b82f6] text-white flex items-center justify-center shadow-xs mb-1 shrink-0">
                        <ShieldCheck className="size-3.5 sm:size-4 stroke-[2.5]" />
                      </div>
                      <h4 className="text-[10px] sm:text-[11px] font-bold text-[#1d4ed8] dark:text-blue-300 leading-tight">
                        Build Trust
                      </h4>
                      <p className="text-[8.5px] sm:text-[9.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        Clients feel confident hiring proven experts
                      </p>
                    </div>

                    {/* Card 3: Win More Projects */}
                    <div className="rounded-xl border border-emerald-100 dark:border-emerald-500/20 bg-gradient-to-b from-emerald-50/60 to-white dark:from-emerald-950/25 dark:to-[#131316] p-2 text-center flex flex-col items-center justify-start min-h-[96px] shadow-2xs">
                      <div className="size-7 sm:size-8 rounded-full bg-[#10b981] text-white flex items-center justify-center shadow-xs mb-1 shrink-0">
                        <TrendingUp className="size-3.5 sm:size-4 stroke-[2.5]" />
                      </div>
                      <h4 className="text-[10px] sm:text-[11px] font-bold text-[#047857] dark:text-emerald-300 leading-tight">
                        Win More Projects
                      </h4>
                      <p className="text-[8.5px] sm:text-[9.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        More inquiries and successful projects
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ━━━ Footer Section: CTA Button + Arrow + 3D Folder ━━━ */}
              <div className="mt-3.5 pt-2 flex items-center justify-between gap-2 relative">
                <div className="flex-1">
                  <button
                    onClick={handleCloseModal}
                    className="keep-white h-10 sm:h-11 px-5 sm:px-6 rounded-xl bg-gradient-to-r from-[#f97316] to-[#ea580c] dark:from-primary dark:to-primary !text-white dark:!text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-[0_6px_20px_rgba(249,115,22,0.35)] dark:shadow-[0_6px_20px_rgba(249,217,73,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <div className="keep-white size-5 rounded-full bg-white/25 dark:bg-black/15 flex items-center justify-center !text-white dark:!text-black shrink-0">
                      <Plus className="keep-white size-3.5 stroke-[3] !stroke-white dark:!stroke-black !text-white dark:!text-black" />
                    </div>
                    <span className="keep-white font-extrabold !text-white dark:!text-slate-950">
                      Add Case Study
                    </span>
                  </button>
                  <span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400 mt-1.5 block">
                    You can edit or update anytime.
                  </span>
                </div>

                {/* Playful curved arrow */}
                <svg
                  className="w-9 h-7 text-primary/80 -mb-2 shrink-0 hidden sm:block select-none pointer-events-none"
                  viewBox="0 0 48 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 8C14 4 28 8 36 24M36 24L36 16"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                {/* 3D Case Study Folder (Transparent PNG) */}
                <div className="shrink-0 -mb-1">
                  <img
                    src="/assets/onboarding/case-study-folder.png"
                    alt="Case Study Folder"
                    className="w-18 sm:w-20 h-auto object-contain select-none pointer-events-none drop-shadow-md"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog
        open={caseStudyToDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setCaseStudyToDeleteId(null);
        }}
      >
        <AlertDialogContent className="max-w-md bg-card border border-border">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 className="h-6 w-6 text-destructive" />
              </div>
              <AlertDialogTitle className="text-xl font-semibold text-foreground">Delete Case Study</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-4 text-base text-muted-foreground">
              Are you sure you want to delete this case study? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex justify-end gap-3">
            <AlertDialogCancel className="border-border text-foreground hover:bg-muted">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (caseStudyToDeleteId) {
                  onRemoveCaseStudy?.(caseStudyToDeleteId);
                  setCaseStudyToDeleteId(null);
                }
              }}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>

  );
};

export default FreelancerCaseStudySlide;
