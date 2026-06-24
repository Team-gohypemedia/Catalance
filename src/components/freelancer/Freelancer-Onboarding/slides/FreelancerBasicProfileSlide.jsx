import { useEffect, useMemo, useRef, useState } from "react";
import Camera from "lucide-react/dist/esm/icons/camera";
import Check from "lucide-react/dist/esm/icons/check";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Upload from "lucide-react/dist/esm/icons/upload";
import X from "lucide-react/dist/esm/icons/x";

import ProfilePhotoCameraDialog from "@/components/common/ProfilePhotoCameraDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_FREELANCER_ONBOARDING_CONTENT,
  resolveBasicProfileFields,
} from "@/shared/lib/freelancer-onboarding-content";
import { cn } from "@/shared/lib/utils";
import { ONBOARDING_FIELD_LABEL_CLASS } from "../typography";

const inputClassName =
  "h-[46px] rounded-[10px] border border-input bg-card px-5 !text-[14px] !leading-5 text-foreground shadow-none placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground/50 placeholder:font-normal [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 [&::placeholder]:font-normal focus-visible:border-primary/45 focus-visible:ring-primary/15";
const selectTriggerClassName =
  "flex h-[46px] w-full appearance-none items-center justify-between gap-3 rounded-[10px] border border-input !bg-card px-5 text-left !text-[14px] !leading-5 text-foreground shadow-none outline-none transition-[border-color,box-shadow] data-[size=default]:!h-[46px] data-[placeholder]:!text-[14px] data-[placeholder]:!leading-5 data-[placeholder]:text-muted-foreground/50 data-[placeholder]:font-normal hover:!bg-card focus-visible:border-primary/45 focus-visible:ring-3 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50 [&_[data-slot=select-value]]:!text-[14px] [&_[data-slot=select-value]]:!leading-5";
const textAreaClassName =
  "min-h-[120px] rounded-[10px] border border-input bg-card px-5 py-4 !text-[14px] !leading-5 text-foreground shadow-none placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground/50 placeholder:font-normal [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 [&::placeholder]:font-normal focus-visible:border-primary/45 focus-visible:ring-primary/15 md:min-h-[80px]";
const dangerFieldClassName =
  "border-destructive/75 text-destructive focus-visible:border-destructive focus-visible:ring-destructive/20";

const resolveFileLabel = (value, fallback = "") => {
  if (!value) {
    return "";
  }

  const explicitName = String(value?.name || "").trim();
  if (explicitName) {
    return explicitName;
  }

  const rawUrl =
    typeof value === "string"
      ? value
      : value?.uploadedUrl || value?.url || "";
  const tail = String(rawUrl || "")
    .split(/[?#]/)[0]
    .split("/")
    .pop();

  return tail ? decodeURIComponent(tail) : fallback;
};

const getInitials = (value = "") => {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return "";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const getFieldValue = (form, fieldId) => {
  if (Object.prototype.hasOwnProperty.call(form || {}, fieldId)) {
    return form?.[fieldId];
  }

  return form?.customFields?.[fieldId];
};

const getFieldLabelClasses = (hasError) =>
  cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block", hasError && "!text-destructive");

const getInputClasses = (hasError, className) =>
  cn(inputClassName, hasError && dangerFieldClassName, className);

const getSelectTriggerClasses = (hasError) =>
  cn(selectTriggerClassName, hasError && dangerFieldClassName);

const getTextAreaClasses = (hasError) =>
  cn(textAreaClassName, hasError && dangerFieldClassName);

const resolveMultiSelectSummary = (values = [], options = [], placeholder = "") => {
  const selectedValues = Array.isArray(values) ? values : [];
  const selectedLabels = selectedValues.map(
    (value) => options.find((option) => option.value === value)?.label || value,
  );

  if (!selectedLabels.length) {
    return placeholder;
  }

  return [
    selectedLabels.slice(0, 2).join(", "),
    selectedLabels.length > 2 ? `+${selectedLabels.length - 2} more` : "",
  ]
    .filter(Boolean)
    .join(" ");
};

const renderTitle = (title) => {
  if (typeof title !== "string") return title;
  if (title.endsWith("Profile")) {
    const mainPart = title.slice(0, -7);
    return (
      <>
        {mainPart}
        <span className="text-primary">Profile</span>
      </>
    );
  }
  return title;
};

const FreelancerBasicProfileSlide = ({
  slide,
  basicProfileForm,
  basicProfileFields = [],
  onBasicProfileFieldChange,
  onUsernameBlur,
  basicProfileErrors = {},
  usernameStatus = "idle",
  countryOptions = [],
  stateOptions = [],
  languageOptions = [],
  isStateOptionsLoading = false,
  profilePhotoPreviewUrl = "",
  onProfilePhotoSelect,
  onProfilePhotoRemove,
  resumeFile = null,
  onResumeSelect,
  onResumeRemove,
  isResumeAutofillRunning = false,
  resumeAutofillTone = "muted",
  resumeAutofillMessage = "",
  resumeUploadRequestId = 0,
  onboardingContent,
  continueButton,
}) => {
  const deviceInputRef = useRef(null);
  const resumeInputRef = useRef(null);
  const [isPhotoMenuOpen, setIsPhotoMenuOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [photoLoadError, setPhotoLoadError] = useState(false);
  const content =
    onboardingContent || DEFAULT_FREELANCER_ONBOARDING_CONTENT;
  const resolvedFields = useMemo(
    () =>
      Array.isArray(basicProfileFields) && basicProfileFields.length > 0
        ? basicProfileFields
        : resolveBasicProfileFields(content),
    [basicProfileFields, content],
  );
  const visibleFields = resolvedFields.filter((field) => field?.visible !== false);
  const fieldMap = useMemo(
    () =>
      Object.fromEntries(
        resolvedFields.map((field) => [String(field?.id || "").trim(), field]),
      ),
    [resolvedFields],
  );
  const profilePhotoField = fieldMap.profilePhoto || null;
  const fullNameField = fieldMap.fullName || null;
  const usernameField = fieldMap.username || null;
  const professionalBioField = fieldMap.professionalBio || null;
  const resumeField = fieldMap.resume || null;
  const countryField = fieldMap.country || null;
  const stateField = fieldMap.state || null;
  const languageField = fieldMap.languages || null;
  const normalizedStateOptions = Array.isArray(stateOptions) ? stateOptions : [];
  const hasStateOptions = normalizedStateOptions.length > 0;
  const stateSelectValue = hasStateOptions
    ? normalizedStateOptions.includes(basicProfileForm.state)
      ? basicProfileForm.state
      : ""
    : basicProfileForm.state || "";
  const fullNameValue = String(getFieldValue(basicProfileForm, "fullName") || "").trim();
  const profileInitials = getInitials(fullNameValue);
  const displayUsername = basicProfileForm.username
    ? `@${String(basicProfileForm.username).toLowerCase().replace(/[^a-z0-9]/g, "")}`
    : "";
  const usernameError = basicProfileErrors.username;
  const isUsernameAvailable = usernameStatus === "available" && !usernameError;
  const usernameHelperText = {
    idle: "",
    checking: `Checking if ${displayUsername || "username"} is available...`,
    available: `${displayUsername} is available.`,
    unavailable: `${displayUsername} is already taken.`,
    error: "Couldn't verify availability - you can still continue.",
  };
  const slideTitle =
    content?.basicProfile?.title || slide?.title || "Complete Your Profile";
  const slideDescription =
    content?.basicProfile?.description ||
    slide?.description ||
    "Let's establish your professional presence";
  const resumeLabel = resolveFileLabel(resumeFile, "Resume uploaded");
  const hasResume = Boolean(resumeLabel);
  const hasProfilePhoto = Boolean(profilePhotoPreviewUrl) && !photoLoadError;
  const selectedLanguages = Array.isArray(basicProfileForm.languages)
    ? basicProfileForm.languages
    : [];
  const languageSummary = resolveMultiSelectSummary(
    selectedLanguages,
    languageOptions,
    languageField?.placeholder || "Select language",
  );

  useEffect(() => {
    setPhotoLoadError(false);
  }, [profilePhotoPreviewUrl]);

  useEffect(() => {
    if (!resumeUploadRequestId || isResumeAutofillRunning) {
      return;
    }

    resumeInputRef.current?.click();
  }, [resumeUploadRequestId, isResumeAutofillRunning]);

  const toggleLanguage = (field, optionValue) => {
    const currentValues = Array.isArray(getFieldValue(basicProfileForm, field.id))
      ? getFieldValue(basicProfileForm, field.id)
      : [];
    const nextValues = currentValues.includes(optionValue)
      ? currentValues.filter((value) => value !== optionValue)
      : [...currentValues, optionValue];

    onBasicProfileFieldChange(field.id, nextValues);
  };

  const handleProfilePhotoInputChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onProfilePhotoSelect(file);
    }
    event.target.value = "";
    event.target.blur();
  };

  const renderProfilePhotoField = () => {
    if (!profilePhotoField || profilePhotoField.visible === false) {
      return null;
    }

    const profilePhotoError = basicProfileErrors.profilePhoto;

    return (
      <div className="flex h-full flex-col items-center text-center">
        <div className="flex flex-col items-center gap-3 md:pt-3 lg:gap-4 lg:pt-0">
          <div className="relative w-fit">
            <Popover open={isPhotoMenuOpen} onOpenChange={setIsPhotoMenuOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={hasProfilePhoto ? "Change profile photo" : "Add profile photo"}
                  aria-invalid={Boolean(profilePhotoError)}
                  className={cn(
                    "group relative flex size-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-primary transition hover:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/55 focus:ring-offset-2 focus:ring-offset-card sm:size-28",
                    profilePhotoError &&
                      "border-destructive/80 hover:border-destructive/80 focus:ring-destructive/55",
                  )}
                >
                  {hasProfilePhoto ? (
                    <img
                      src={profilePhotoPreviewUrl}
                      alt=""
                      className="size-full object-cover"
                      onError={() => setPhotoLoadError(true)}
                    />
                  ) : fullNameValue ? (
                    <div className="flex size-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_rgba(255,255,255,0.02)_50%,_rgba(0,0,0,0.05)_100%)]">
                      <span className="text-2xl font-semibold leading-none tracking-[0.12em] text-primary transition group-hover:scale-[1.04] sm:text-3xl">
                        {profileInitials}
                      </span>
                    </div>
                  ) : (
                    <Camera className="size-9 transition group-hover:scale-[1.04]" />
                  )}
                </button>
              </PopoverTrigger>

              <PopoverContent
                align="center"
                sideOffset={10}
                className="w-56 rounded-[18px] border border-border bg-popover p-1 text-popover-foreground shadow-[0_18px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl"
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsPhotoMenuOpen(false);
                    setIsCameraOpen(true);
                  }}
                  className="flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                >
                  <Camera className="size-4 text-primary" />
                  <span>{profilePhotoField.menuCameraLabel || "Take a picture"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPhotoMenuOpen(false);
                    deviceInputRef.current?.click();
                  }}
                  className="flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                >
                  <Upload className="size-4 text-primary" />
                  <span>{profilePhotoField.menuUploadLabel || "Choose from device"}</span>
                </button>
              </PopoverContent>
            </Popover>

            <input
              ref={deviceInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfilePhotoInputChange}
            />

            {hasProfilePhoto ? (
              <button
                type="button"
                onClick={onProfilePhotoRemove}
                aria-label="Remove profile photo"
                className="absolute right-1 top-1 flex size-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-[0_10px_30px_rgba(0,0,0,0.15)] transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            ) : null}

            <ProfilePhotoCameraDialog
              open={isCameraOpen}
              onOpenChange={setIsCameraOpen}
              onCapture={onProfilePhotoSelect}
            />
          </div>

          <div className="space-y-1">
            <p className={cn(ONBOARDING_FIELD_LABEL_CLASS, "text-foreground")}>
              {profilePhotoField.label || "Profile Photo"}
            </p>
            <p className="text-sm text-muted-foreground">
              {profilePhotoField.helperText || "JPG, PNG or GIF. Max 5MB."}
            </p>
          </div>
        </div>

        {profilePhotoError ? (
          <p className="mt-3 text-center text-sm text-destructive">
            {profilePhotoError}
          </p>
        ) : null}
      </div>
    );
  };

  const renderTextField = (field) => {
    const fieldValue = getFieldValue(basicProfileForm, field.id) || "";
    const fieldError = basicProfileErrors[field.id];
    const isUsernameField = field.id === "username";

    return (
      <div key={field.id} className="space-y-3">
        <Label className={getFieldLabelClasses(Boolean(fieldError))}>
          {field.label}
        </Label>
        {isUsernameField ? (
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 select-none text-sm font-medium text-muted-foreground">
              {field.prefix || "@"}
            </span>
            <Input
              value={fieldValue}
              onChange={(event) =>
                onBasicProfileFieldChange(field.id, event.target.value)
              }
              onBlur={onUsernameBlur}
              placeholder={field.placeholder || "yourname"}
              className={getInputClasses(Boolean(fieldError), "pl-7 pr-14")}
              aria-invalid={Boolean(fieldError)}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            {usernameStatus === "checking" ? (
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
              </span>
            ) : null}
            {isUsernameAvailable ? (
              <span className="pointer-events-none absolute right-4 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_0_0_1px_rgba(16,185,129,0.28)]">
                <Check className="size-4" />
              </span>
            ) : null}
            {usernameStatus === "unavailable" && !fieldError ? (
              <span className="pointer-events-none absolute right-4 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-destructive text-white">
                <X className="size-3.5" />
              </span>
            ) : null}
          </div>
        ) : (
          <Input
            value={fieldValue}
            onChange={(event) =>
              onBasicProfileFieldChange(field.id, event.target.value)
            }
            placeholder={field.placeholder || ""}
            className={getInputClasses(Boolean(fieldError))}
            aria-invalid={Boolean(fieldError)}
            autoComplete={field.id === "fullName" ? "name" : undefined}
          />
        )}

        {fieldError ? (
          <p className="text-sm text-destructive">{fieldError}</p>
        ) : isUsernameField && usernameStatus !== "idle" && usernameHelperText[usernameStatus] ? (
          <p
            className={cn(
              "text-sm",
              isUsernameAvailable && "text-emerald-500 dark:text-emerald-400",
              usernameStatus === "checking" && "text-muted-foreground",
              usernameStatus === "unavailable" && "text-destructive",
              usernameStatus === "error" && "text-muted-foreground",
            )}
          >
            {usernameHelperText[usernameStatus]}
          </p>
        ) : null}
      </div>
    );
  };

  const renderTextareaField = (field) => {
    const fieldValue = getFieldValue(basicProfileForm, field.id) || "";
    const fieldError = basicProfileErrors[field.id];
    const isBio = field.id === "professionalBio";
    const wordCount = isBio ? String(fieldValue).trim().split(/\s+/).filter(Boolean).length : 0;
    const isOverLimit = isBio && wordCount > 100;

    return (
      <div key={field.id} className="w-full space-y-3">
        <Label className={getFieldLabelClasses(Boolean(fieldError) || isOverLimit)}>
          {field.label}
        </Label>
        <div className="relative">
          <Textarea
            value={fieldValue}
            onChange={(event) =>
              onBasicProfileFieldChange(field.id, event.target.value)
            }
            placeholder={field.placeholder || ""}
            className={cn(
              getTextAreaClasses(Boolean(fieldError) || isOverLimit),
              isBio && "pb-9 pr-14"
            )}
            aria-invalid={Boolean(fieldError) || isOverLimit}
          />
          {isBio && (
            <span
              className={cn(
                "absolute right-3.5 bottom-3.5 text-[11px] font-normal transition-colors pointer-events-none",
                isOverLimit ? "text-destructive" : "text-black/20 dark:text-white/20",
              )}
            >
              {wordCount} / 100 words
            </span>
          )}
        </div>
        {fieldError ? (
          <p className="text-sm text-destructive">{fieldError}</p>
        ) : null}
      </div>
    );
  };

  const renderResumeField = (field) => {
    const fieldError = basicProfileErrors[field.id];
    const resumeAutofillMessageClassName =
      resumeAutofillTone === "error"
        ? "text-destructive"
        : resumeAutofillTone === "success"
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-muted-foreground";
    const isOptional = field?.required === false;
    const resumeHeadline = hasResume ? "Resume attached" : "Upload your CV";
    const resumeSupportingText =
      field.helperText || "PDF or DOCX file, max 5MB";

    return (
      <div key={field.id} className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Label className={getFieldLabelClasses(Boolean(fieldError))}>
            <span className="inline-flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              {field.label}
            </span>
          </Label>
          {isOptional ? (
            <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Optional
            </span>
          ) : null}
        </div>

        <div
          className={cn(
            "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-[12px] border border-dashed border-primary/40 bg-primary/5 px-4 py-3 sm:px-5 sm:py-3.5",
            fieldError && "border-destructive/70 bg-destructive/5",
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Sparkles className="size-4" />
            </div>
            <div className="flex min-w-0 flex-col text-left">
              <span className="truncate text-sm font-medium text-foreground">
                {hasResume ? resumeLabel : "AI Autofill"}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {hasResume ? "Resume attached" : resumeSupportingText}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <label className="inline-flex">
              <input
                ref={resumeInputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                disabled={isResumeAutofillRunning}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    onResumeSelect(file);
                  }
                  event.target.value = "";
                  event.target.blur();
                }}
              />
              <span className="inline-flex h-8 cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90">
                {isResumeAutofillRunning ? (
                  <Loader2 className="size-3.5 animate-spin text-primary-foreground" />
                ) : (
                  <Upload className="size-3.5 text-primary-foreground" />
                )}
                {isResumeAutofillRunning
                  ? field.loadingLabel || "Reading..."
                  : field.browseLabel || "Browse"}
              </span>
            </label>

            {hasResume ? (
              <button
                type="button"
                onClick={onResumeRemove}
                className="flex h-8 items-center justify-center rounded-full border border-border bg-background px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {field.removeLabel || "Remove"}
              </button>
            ) : null}
          </div>
        </div>

        {fieldError ? <p className="text-sm text-destructive">{fieldError}</p> : null}
        {!fieldError && resumeAutofillMessage ? (
          <p className={cn("text-sm", resumeAutofillMessageClassName)}>
            {resumeAutofillMessage}
          </p>
        ) : null}
      </div>
    );
  };

  const renderSelectField = (field) => {
    const fieldValue = getFieldValue(basicProfileForm, field.id) || "";
    const fieldError = basicProfileErrors[field.id];
    const isCountryField = field.id === "country";
    const isStateField = field.id === "state";
    const resolvedOptions =
      field.dataSource === "countryOptions"
        ? countryOptions.map((option) => ({ value: option, label: option }))
        : field.dataSource === "stateOptions"
          ? normalizedStateOptions.map((option) => ({ value: option, label: option }))
          : Array.isArray(field.options)
            ? field.options
            : [];

    if (isStateField && !hasStateOptions) {
      return (
        <div key={field.id} className="space-y-3">
          <Label className={getFieldLabelClasses(Boolean(fieldError))}>
            {field.label}
          </Label>
          <Input
            value={fieldValue}
            onChange={(event) =>
              onBasicProfileFieldChange(field.id, event.target.value)
            }
            placeholder={
              basicProfileForm.country
                ? field.inputPlaceholder || "Type your state"
                : field.selectCountryFirstLabel || "Select country first"
            }
            disabled={!basicProfileForm.country || isStateOptionsLoading}
            className={getInputClasses(Boolean(fieldError))}
            aria-invalid={Boolean(fieldError)}
          />
          {fieldError ? <p className="text-sm text-destructive">{fieldError}</p> : null}
        </div>
      );
    }

    return (
      <div key={field.id} className="space-y-3">
        <Label className={getFieldLabelClasses(Boolean(fieldError))}>
          {field.label}
        </Label>
        <Select
          value={isStateField ? stateSelectValue : fieldValue}
          onValueChange={(value) => onBasicProfileFieldChange(field.id, value)}
          disabled={isStateField && (!basicProfileForm.country || isStateOptionsLoading)}
        >
          <SelectTrigger
            className={getSelectTriggerClasses(Boolean(fieldError))}
            aria-invalid={Boolean(fieldError)}
          >
            <SelectValue
              className="!text-[14px] !leading-5"
              placeholder={
                isStateField
                  ? !basicProfileForm.country
                    ? field.selectCountryFirstLabel || "Select country first"
                    : isStateOptionsLoading
                      ? field.loadingLabel || "Loading states..."
                      : field.selectPlaceholder || "Select state"
                  : field.placeholder || "Select option"
              }
            />
          </SelectTrigger>
          <SelectContent
            position="popper"
            sideOffset={8}
            className="max-h-72 rounded-[18px] border-border bg-popover text-popover-foreground shadow-[0_18px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_18px_60px_rgba(0,0,0,0.45)]"
          >
            {resolvedOptions.map((option) => (
              <SelectItem
                key={`${field.id}-${option.value}`}
                value={option.value}
                className="cursor-pointer focus:bg-accent focus:text-accent-foreground"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldError ? <p className="text-sm text-destructive">{fieldError}</p> : null}
      </div>
    );
  };

  const renderMultiselectField = (field) => {
    const fieldError = basicProfileErrors[field.id];
    const fieldValue = Array.isArray(getFieldValue(basicProfileForm, field.id))
      ? getFieldValue(basicProfileForm, field.id)
      : [];
    const resolvedOptions =
      field.dataSource === "languageOptions"
        ? languageOptions
        : Array.isArray(field.options)
          ? field.options
          : [];
    const summary = resolveMultiSelectSummary(
      fieldValue,
      resolvedOptions,
      field.placeholder || "Select option",
    );

    return (
      <div key={field.id} className="space-y-3">
        <Label className={getFieldLabelClasses(Boolean(fieldError))}>
          {field.label}
        </Label>

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-invalid={Boolean(fieldError)}
              className={cn(getSelectTriggerClasses(Boolean(fieldError)), "justify-between")}
            >
              <span
                className={cn(
                  "truncate text-left !text-[14px] !leading-5",
                  fieldValue.length ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {summary}
              </span>
              <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </PopoverTrigger>

          <PopoverContent
            align="center"
            sideOffset={8}
            className="w-[var(--radix-popover-trigger-width)] rounded-[18px] border border-border bg-popover p-1 text-popover-foreground shadow-[0_18px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          >
            <div className="max-h-72 space-y-1 overflow-y-auto subtle-scrollbar pr-1">
              {resolvedOptions.map((option) => {
                const isChecked = fieldValue.includes(option.value);

                return (
                  <div
                    key={`${field.id}-${option.value}`}
                    onClick={() => toggleLanguage(field, option.value)}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <Checkbox
                      checked={isChecked}
                      className="pointer-events-none border-input data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                    />
                    <span className="truncate">{option.label}</span>
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        {fieldError ? <p className="text-sm text-destructive">{fieldError}</p> : null}
      </div>
    );
  };

  const renderField = (field) => {
    if (!field || field.visible === false) {
      return null;
    }

    if (field.id === "profilePhoto") {
      return null;
    }

    switch (field.type) {
      case "textarea":
        return renderTextareaField(field);
      case "file":
        return renderResumeField(field);
      case "select":
        return renderSelectField(field);
      case "multiselect":
        return renderMultiselectField(field);
      case "text":
      default:
        return renderTextField(field);
    }
  };

  const primaryIdentityFields = [fullNameField, usernameField].filter(
    (field) => field?.visible !== false,
  );
  const bioField = professionalBioField?.visible !== false ? professionalBioField : null;
  const countryStateFields = [countryField, stateField].filter(
    (field) => field?.visible !== false,
  );
  const renderedFieldIds = new Set([
    "profilePhoto",
    "fullName",
    "username",
    "professionalBio",
    "resume",
    "country",
    "state",
    "languages",
  ]);
  const remainingFields = visibleFields.filter((field) => !renderedFieldIds.has(field.id));

  return (
    <section className="mx-auto flex min-h-[68vh] w-full max-w-4xl flex-col items-center justify-center gap-5 mt-[10px] mt-[20px] sm:mt-0">
      <div className="w-full max-w-2xl text-center">
        <h1 className="mb-1 text-xl font-medium text-foreground md:mb-2 md:text-4xl lg:mb-2 lg:text-5xl">
          {renderTitle(slideTitle)}
        </h1>
        <p className="text-sm font-regular text-muted-foreground md:text-lg lg:text-base">
          {slideDescription}
        </p>
      </div>

      <div className="relative w-full overflow-hidden rounded-[10px] border border-border bg-card px-3 py-4 shadow-[0_28px_100px_rgba(0,0,0,0.08)] dark:shadow-[0_28px_100px_rgba(0,0,0,0.34)] sm:px-6 sm:py-7 lg:px-10 lg:py-9">
        <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
          
          <div className="space-y-6 lg:space-y-8">
            {profilePhotoField || primaryIdentityFields.length ? (
              <div className="grid gap-5 md:grid-cols-[max-content_minmax(0,1fr)] md:items-start md:gap-6">
                {renderProfilePhotoField()}

                <div className="flex h-full w-full flex-col justify-center space-y-5">
                  {primaryIdentityFields.map((field) => renderField(field))}
                </div>
              </div>
            ) : null}

            {bioField ? renderField(bioField) : null}
          </div>

          <div className="space-y-6 lg:space-y-8">
            {resumeField?.visible !== false ? renderField(resumeField) : null}

            {(countryStateFields.length > 0 || languageField?.visible !== false) ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {countryStateFields.map((field) => renderField(field))}
                {languageField?.visible !== false ? (
                  <div className="sm:col-span-2">
                    {renderField(languageField)}
                  </div>
                ) : null}
              </div>
            ) : null}

            {remainingFields.map((field) => renderField(field))}
          </div>
          
        </div>

        {continueButton ? (
          <div className="pt-5 border-t border-border">
            {continueButton}
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default FreelancerBasicProfileSlide;
