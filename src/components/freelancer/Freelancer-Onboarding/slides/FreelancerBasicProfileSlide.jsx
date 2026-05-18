import Check from "lucide-react/dist/esm/icons/check";
import { useRef, useState } from "react";
import Camera from "lucide-react/dist/esm/icons/camera";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Upload from "lucide-react/dist/esm/icons/upload";
import X from "lucide-react/dist/esm/icons/x";

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
import ProfilePhotoCameraDialog from "@/components/common/ProfilePhotoCameraDialog";
import { cn } from "@/shared/lib/utils";
import { ONBOARDING_FIELD_LABEL_CLASS } from "../typography";

const inputClassName =
  "h-14 rounded-[18px] border border-white/[0.04] bg-card px-5 !text-[14px] !leading-5 text-white shadow-none placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 focus-visible:border-primary/45 focus-visible:ring-primary/15";
const selectTriggerClassName =
  "flex h-14 w-full appearance-none items-center justify-between gap-3 rounded-[18px] border border-white/[0.04] !bg-card px-5 text-left !text-[14px] !leading-5 text-white shadow-none outline-none transition-[border-color,box-shadow] data-[size=default]:!h-14 data-[placeholder]:!text-[14px] data-[placeholder]:!leading-5 data-[placeholder]:text-muted-foreground hover:!bg-card focus-visible:border-primary/45 focus-visible:ring-3 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50 [&_[data-slot=select-value]]:!text-[14px] [&_[data-slot=select-value]]:!leading-5";
const textAreaClassName =
  "min-h-[120px] rounded-[24px] border border-white/[0.04] bg-card px-5 py-4 !text-[14px] !leading-5 text-white shadow-none placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 focus-visible:border-primary/45 focus-visible:ring-primary/15 md:min-h-[80px]";
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

const FreelancerBasicProfileSlide = ({
  slide,
  basicProfileForm,
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
}) => {
  const deviceInputRef = useRef(null);
  const [isPhotoMenuOpen, setIsPhotoMenuOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const normalizedStateOptions = Array.isArray(stateOptions) ? stateOptions : [];
  const hasStateOptions = normalizedStateOptions.length > 0;
  const stateSelectValue =
    hasStateOptions && normalizedStateOptions.includes(basicProfileForm.state)
      ? basicProfileForm.state
      : "";
  const selectedLanguages = Array.isArray(basicProfileForm.languages)
    ? basicProfileForm.languages
    : [];

  const usernameError = basicProfileErrors.username;
  const professionalBioError = basicProfileErrors.professionalBio;
  const countryError = basicProfileErrors.country;
  const stateError = basicProfileErrors.state;
  const languagesError = basicProfileErrors.languages;
  const profilePhotoError = basicProfileErrors.profilePhoto;
  const resumeError = basicProfileErrors.resume;

  const selectedLanguageLabels = selectedLanguages.map(
    (value) => languageOptions.find((option) => option.value === value)?.label || value,
  );
  const selectedLanguageSummary = selectedLanguageLabels.length
    ? [
        selectedLanguageLabels.slice(0, 2).join(", "),
        selectedLanguageLabels.length > 2
          ? `+${selectedLanguageLabels.length - 2} more`
          : "",
      ]
        .filter(Boolean)
        .join(" ")
    : "Select language";
  const usernameHelperText = {
    idle: "",
    checking: "Checking username availability...",
    available: "Username is available.",
    unavailable: "That username is already taken.",
    error: "Unable to verify username right now.",
  };
  const slideTitle = slide?.title || "Complete Your Profile";
  const slideDescription =
    slide?.description || "Let's establish your professional presence";
  const resumeLabel = resolveFileLabel(resumeFile, "Resume uploaded");
  const hasResume = Boolean(resumeLabel);
  const fullNameError = basicProfileErrors.fullName;
  const hasProfilePhoto = Boolean(profilePhotoPreviewUrl);
  const fullNameValue = String(basicProfileForm.fullName || "").trim();
  const profileInitials = getInitials(fullNameValue);
  const isUsernameAvailable = usernameStatus === "available" && !usernameError;

  const getFieldLabelClasses = (hasError) =>
    cn(
      ONBOARDING_FIELD_LABEL_CLASS,
      "mb-1 block",
      hasError && "!text-destructive",
    );

  const getInputClasses = (hasError, className) =>
    cn(inputClassName, hasError && dangerFieldClassName, className);

  const getSelectTriggerClasses = (hasError) =>
    cn(selectTriggerClassName, hasError && dangerFieldClassName);

  const getTextAreaClasses = (hasError) =>
    cn(textAreaClassName, hasError && dangerFieldClassName);

  const toggleLanguage = (languageValue) => {
    const nextLanguages = selectedLanguages.includes(languageValue)
      ? selectedLanguages.filter((value) => value !== languageValue)
      : [...selectedLanguages, languageValue];

    onBasicProfileFieldChange("languages", nextLanguages);
  };

  const handleProfilePhotoInputChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onProfilePhotoSelect(file);
    }
    event.target.value = "";
  };

  return (
    <section className="mx-auto flex min-h-[68vh] w-full max-w-4xl flex-col items-center justify-center gap-5">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-xl font-medium text-primary md:text-4xl lg:text-5xl mb-1 md:mb-2 lg:mb-2">
          {slideTitle}
        </h1>
        <p className="text-muted-foreground font-regular text-sm md:text-lg lg:text-base">
          {slideDescription}
        </p>
      </div>

      <div className="relative w-full overflow-hidden rounded-[32px] border border-white/[0.07] bg-[#0b0b0c] px-5 py-7 shadow-[0_28px_100px_rgba(0,0,0,0.34)] sm:px-10 sm:py-10 lg:px-16 lg:py-12">
        <div className="relative space-y-8">
        <div className="grid gap-5 md:grid-cols-[max-content_minmax(0,1fr)] md:gap-6 md:items-start">
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
                          "group relative flex size-32 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-white/20 bg-[#1a1a1a] text-primary transition hover:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/55 focus:ring-offset-2 focus:ring-offset-[#0b0b0c] sm:size-36",
                          profilePhotoError &&
                            "border-destructive/80 hover:border-destructive/80 focus:ring-destructive/55",
                        )}
                    >
                      {hasProfilePhoto ? (
                        <img
                          src={profilePhotoPreviewUrl}
                          alt="Freelancer profile"
                          className="size-full object-cover"
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
                    className="w-56 rounded-[18px] border border-white/10 bg-[#161616] p-1 text-white shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsPhotoMenuOpen(false);
                        setIsCameraOpen(true);
                      }}
                      className="flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-sm text-white transition-colors hover:bg-white/8 focus:bg-white/8 focus:outline-none"
                    >
                      <Camera className="size-4 text-primary" />
                      <span>Take a picture</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPhotoMenuOpen(false);
                        deviceInputRef.current?.click();
                      }}
                      className="flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-sm text-white transition-colors hover:bg-white/8 focus:bg-white/8 focus:outline-none"
                    >
                      <Upload className="size-4 text-primary" />
                      <span>Choose from device</span>
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
                    className="absolute right-1 top-1 flex size-8 items-center justify-center rounded-full border border-white/10 bg-[#101010] text-white/75 shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition-colors hover:border-white/20 hover:text-white"
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
                <p className={cn(ONBOARDING_FIELD_LABEL_CLASS, "text-white")}>
                  Profile Photo
                </p>
                <p className="text-sm text-white/55">
                  JPG, PNG or GIF. Max 5MB.
                </p>
              </div>
            </div>

            {profilePhotoError ? (
              <p className="mt-3 text-center text-sm text-destructive">
                {profilePhotoError}
              </p>
            ) : null}
          </div>

          <div className="h-full space-y-6">
            <div className="space-y-3">
              <Label className={getFieldLabelClasses(Boolean(fullNameError))}>
                Name
              </Label>
              <Input
                value={basicProfileForm.fullName}
                onChange={(event) =>
                  onBasicProfileFieldChange("fullName", event.target.value)
                }
                placeholder="Enter your full name"
                className={getInputClasses(Boolean(fullNameError))}
                aria-invalid={Boolean(fullNameError)}
                autoComplete="name"
              />
              {fullNameError ? (
                <p className="text-sm text-destructive">{fullNameError}</p>
              ) : null}
            </div>

            <div className="space-y-3">
              <Label className={getFieldLabelClasses(Boolean(usernameError))}>
                Username
              </Label>
              <div className="relative">
                <Input
                  value={basicProfileForm.username}
                  onChange={(event) =>
                    onBasicProfileFieldChange("username", event.target.value)
                  }
                  onBlur={onUsernameBlur}
                  placeholder="Enter username"
                  className={getInputClasses(Boolean(usernameError), "pr-14")}
                  aria-invalid={Boolean(usernameError)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
                {usernameStatus === "checking" ? (
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/45">
                    <Loader2 className="size-4 animate-spin" />
                  </span>
                ) : null}
                {isUsernameAvailable ? (
                  <span className="pointer-events-none absolute right-4 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_0_0_1px_rgba(16,185,129,0.28)]">
                    <Check className="size-4" />
                  </span>
                ) : null}
                {usernameStatus === "unavailable" && !usernameError ? (
                  <span className="pointer-events-none absolute right-4 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-destructive text-white">
                    <X className="size-3.5" />
                  </span>
                ) : null}
              </div>
              {usernameError ? (
                <p className="text-sm text-destructive">{usernameError}</p>
              ) : usernameStatus !== "idle" && usernameHelperText[usernameStatus] ? (
                <p
                  className={cn(
                    "text-sm",
                    isUsernameAvailable && "text-emerald-400",
                    usernameStatus === "checking" && "text-white/45",
                    usernameStatus === "unavailable" && "text-destructive",
                    usernameStatus === "error" && "text-primary",
                  )}
                >
                  {usernameHelperText[usernameStatus]}
                </p>
              ) : null}
            </div>

          </div>
        </div>

        <div className="w-full space-y-3">
          <Label className={getFieldLabelClasses(Boolean(professionalBioError))}>
            Professional Bio
          </Label>
          <Textarea
            value={basicProfileForm.professionalBio}
            onChange={(event) =>
              onBasicProfileFieldChange("professionalBio", event.target.value)
            }
            placeholder="Tell us about your background, expertise, and what makes you unique..."
            className={getTextAreaClasses(Boolean(professionalBioError))}
            aria-invalid={Boolean(professionalBioError)}
          />
          {professionalBioError ? (
            <p className="text-sm text-destructive">{professionalBioError}</p>
          ) : null}
        </div>

        <div className="space-y-3">
          <Label className={getFieldLabelClasses(Boolean(resumeError))}>
            Upload Your CV
          </Label>

          <div
            className={cn(
              "flex flex-row items-center gap-3 rounded-[20px] border border-white/[0.04] bg-card p-3",
              resumeError && "border-destructive/70 bg-destructive/5",
            )}
          >
            <label className="inline-flex">
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    onResumeSelect(file);
                  }
                  event.target.value = "";
                }}
              />
                <span className="inline-flex h-10 min-w-[128px] shrink-0 items-center justify-center gap-2 rounded-[14px] bg-[#232323] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2a2a2a] max-sm:!text-sm">
                  <Upload className="size-3.5 text-white" />
                  Browse
                </span>
            </label>

            <div className="min-w-0 flex-1">
              {hasResume ? (
                <div className="flex items-center gap-2 text-sm text-white">
                  <FileText className="size-4 shrink-0 text-primary" />
                  <span className="truncate">{resumeLabel}</span>
                </div>
              ) : null}
              <p className={cn("truncate text-sm font-normal leading-5 text-white/20", hasResume && "mt-1")}>
                PDF or DOCX file, max 5MB
              </p>
            </div>

            {hasResume ? (
              <button
                type="button"
                onClick={onResumeRemove}
                className="self-start text-xs font-medium text-white/48 transition-colors hover:text-white/78 sm:self-center"
              >
                Remove
              </button>
            ) : null}
          </div>

          {resumeError ? (
            <p className="text-sm text-destructive">{resumeError}</p>
          ) : null}
        </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label className={getFieldLabelClasses(Boolean(countryError))}>
                Country
              </Label>
              <Select
                value={basicProfileForm.country}
                onValueChange={(value) =>
                  onBasicProfileFieldChange("country", value)
                }
              >
                <SelectTrigger
                  className={getSelectTriggerClasses(Boolean(countryError))}
                  aria-invalid={Boolean(countryError)}
                >
                  <SelectValue
                    className="!text-[14px] !leading-5"
                    placeholder="Select country"
                  />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  sideOffset={8}
                  className="max-h-72 rounded-[18px] border-white/10 bg-[#161616] text-white shadow-[0_18px_60px_rgba(0,0,0,0.45)]"
                >
                  {countryOptions.map((country) => (
                    <SelectItem
                      key={country}
                      value={country}
                      className="cursor-pointer focus:bg-white/10 focus:text-white"
                    >
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {countryError ? (
                <p className="text-sm text-destructive">{countryError}</p>
              ) : null}
            </div>

            <div className="space-y-3">
              <Label className={getFieldLabelClasses(Boolean(stateError))}>
                State / Province
              </Label>
              {hasStateOptions ? (
                <Select
                  value={stateSelectValue}
                  onValueChange={(value) =>
                    onBasicProfileFieldChange("state", value)
                  }
                  disabled={!basicProfileForm.country || isStateOptionsLoading}
                >
                  <SelectTrigger
                    className={getSelectTriggerClasses(Boolean(stateError))}
                    aria-invalid={Boolean(stateError)}
                  >
                    <SelectValue
                      className="!text-[14px] !leading-5"
                      placeholder={
                        !basicProfileForm.country
                          ? "Select country first"
                          : isStateOptionsLoading
                            ? "Loading states..."
                            : "Select state"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    sideOffset={8}
                    className="max-h-72 rounded-[18px] border-white/10 bg-[#161616] text-white shadow-[0_18px_60px_rgba(0,0,0,0.45)]"
                  >
                    {normalizedStateOptions.map((stateOption) => (
                      <SelectItem
                        key={stateOption}
                        value={stateOption}
                        className="cursor-pointer focus:bg-white/10 focus:text-white"
                      >
                        {stateOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={basicProfileForm.state}
                  onChange={(event) =>
                    onBasicProfileFieldChange("state", event.target.value)
                  }
                  placeholder={
                    basicProfileForm.country
                      ? "Type your state"
                      : "Select country first"
                  }
                  disabled={!basicProfileForm.country || isStateOptionsLoading}
                  className={getInputClasses(Boolean(stateError))}
                  aria-invalid={Boolean(stateError)}
                />
              )}
              {stateError ? (
                <p className="text-sm text-destructive">{stateError}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-3">
            <Label className={getFieldLabelClasses(Boolean(languagesError))}>
              Select Language
            </Label>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-invalid={Boolean(languagesError)}
                  className={cn(
                    getSelectTriggerClasses(Boolean(languagesError)),
                    "justify-between",
                  )}
                >
                  <span
                    className={cn(
                      "truncate text-left !text-[14px] !leading-5",
                      selectedLanguages.length ? "text-white" : "text-muted-foreground",
                    )}
                  >
                    {selectedLanguageSummary}
                  </span>
                  <ChevronDown className="size-4 shrink-0 text-white/40" />
                </button>
              </PopoverTrigger>

              <PopoverContent
                align="center"
                sideOffset={8}
                className="w-[var(--radix-popover-trigger-width)] rounded-[18px] border border-white/10 bg-[#161616] p-1 text-white shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl"
              >
                <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
                  {languageOptions.map((language) => {
                    const isChecked = selectedLanguages.includes(language.value);

                    return (
                      <button
                        key={language.value}
                        type="button"
                        onClick={() => toggleLanguage(language.value)}
                        className="flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-sm text-white transition-colors hover:bg-white/8"
                      >
                        <Checkbox
                          checked={isChecked}
                          className="pointer-events-none border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <span className="truncate">{language.label}</span>
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            {languagesError ? (
              <p className="text-sm text-destructive">{languagesError}</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FreelancerBasicProfileSlide;
