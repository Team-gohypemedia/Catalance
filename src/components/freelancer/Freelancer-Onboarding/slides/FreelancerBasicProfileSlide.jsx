import Check from "lucide-react/dist/esm/icons/check";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Paperclip from "lucide-react/dist/esm/icons/paperclip";
import Upload from "lucide-react/dist/esm/icons/upload";
import UserRound from "lucide-react/dist/esm/icons/user-round";
import X from "lucide-react/dist/esm/icons/x";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/shared/lib/utils";

const fieldLabelClassName =
  "text-[11px] font-semibold uppercase tracking-[0.32em] text-white/48";
const inputClassName =
  "h-14 rounded-[18px] border border-white/[0.04] bg-card px-5 text-base text-white shadow-none placeholder:text-white/20 focus-visible:border-primary/45 focus-visible:ring-primary/15";
const selectTriggerClassName =
  "flex h-14 w-full appearance-none items-center justify-between gap-3 rounded-[18px] border border-white/[0.04] !bg-card px-5 text-left text-base text-white shadow-none outline-none transition-[border-color,box-shadow] data-[size=default]:!h-14 data-[placeholder]:text-white/20 hover:!bg-card focus-visible:border-primary/45 focus-visible:ring-3 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50";
const textAreaClassName =
  "min-h-[170px] rounded-[24px] border border-white/[0.04] bg-card px-5 py-4 text-base text-white shadow-none placeholder:text-white/20 focus-visible:border-primary/45 focus-visible:ring-primary/15";
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
  const resumeLabel = resolveFileLabel(resumeFile, "Resume uploaded");
  const hasResume = Boolean(resumeLabel);

  const getFieldLabelClasses = (hasError) =>
    cn(fieldLabelClassName, hasError && "text-destructive");

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

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col items-center">
      <div className="relative w-full overflow-hidden rounded-[32px] border border-white/[0.07] bg-[#0b0b0c] px-5 py-7 shadow-[0_28px_100px_rgba(0,0,0,0.34)] sm:px-10 sm:py-10 lg:px-16 lg:py-12">
        <div className="relative space-y-8">
          <div className="sr-only">
            <h1>{slide?.title || "Complete your profile"}</h1>
            <p>{slide?.description || "Basic profile setup"}</p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <Avatar
              className={cn(
                "size-28 border-[3px] border-white/15 sm:size-32",
                profilePhotoPreviewUrl
                  ? "bg-white shadow-[0_0_0_8px_rgba(255,255,255,0.02)]"
                  : "bg-card",
                profilePhotoError && "border-destructive/80",
              )}
            >
              {profilePhotoPreviewUrl ? (
                <>
                  <AvatarImage
                    src={profilePhotoPreviewUrl}
                    alt="Freelancer profile"
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-card text-white/25">
                    <UserRound className="size-14" />
                  </AvatarFallback>
                </>
              ) : (
                <div className="flex size-full items-center justify-center rounded-full bg-card text-white/25">
                  <UserRound className="size-14" />
                </div>
              )}
            </Avatar>

            <div className="flex flex-col items-center gap-2">
              <label className="inline-flex">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      onProfilePhotoSelect(file);
                    }
                    event.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-11 rounded-[14px] border-primary bg-transparent px-6 text-sm font-semibold text-primary shadow-none hover:bg-primary/10 hover:text-primary",
                    profilePhotoError &&
                      "border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive",
                  )}
                  asChild
                >
                  <span>
                    <Upload className="size-4" />
                    Upload
                  </span>
                </Button>
              </label>

              {profilePhotoPreviewUrl ? (
                <button
                  type="button"
                  onClick={onProfilePhotoRemove}
                  className="text-xs font-medium text-white/48 transition-colors hover:text-white/78"
                >
                  Remove photo
                </button>
              ) : null}
            </div>

            {profilePhotoError ? (
              <p className="text-sm text-destructive">{profilePhotoError}</p>
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
              {usernameStatus === "available" && !usernameError ? (
                <span className="pointer-events-none absolute right-4 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground">
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
                  usernameStatus === "available" && "text-primary",
                  usernameStatus === "checking" && "text-white/45",
                  usernameStatus === "unavailable" && "text-destructive",
                  usernameStatus === "error" && "text-amber-400",
                )}
              >
                {usernameHelperText[usernameStatus]}
              </p>
            ) : null}
          </div>

          <div className="space-y-3">
            <Label className={getFieldLabelClasses(Boolean(professionalBioError))}>
              Profile Details
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
            <div className="flex items-center gap-2.5">
              <Paperclip className="size-4 text-primary" />
              <p className="text-lg font-medium text-white">Upload Your CV</p>
            </div>

            <div
              className={cn(
                "flex flex-col gap-3 rounded-[20px] border border-white/[0.04] bg-card p-3 sm:flex-row sm:items-center",
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
                <span className="inline-flex h-10 min-w-[128px] items-center justify-center gap-2 rounded-[14px] bg-[#232323] px-5 text-sm font-semibold text-primary transition-colors hover:bg-[#2a2a2a]">
                  <Upload className="size-4" />
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
                <p className={cn("text-xs text-white/35", hasResume && "mt-1")}>
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
                  <SelectValue placeholder="Select country" />
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
                      "truncate text-left",
                      selectedLanguages.length ? "text-white" : "text-white/20",
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
