import Check from "lucide-react/dist/esm/icons/check";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Pencil from "lucide-react/dist/esm/icons/pencil";
import Upload from "lucide-react/dist/esm/icons/upload";
import UserRound from "lucide-react/dist/esm/icons/user-round";
import X from "lucide-react/dist/esm/icons/x";

import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
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
  "text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground";
const inputClassName =
  "h-14 rounded-2xl border-white/8 bg-accent px-5 text-base text-white shadow-none placeholder:text-muted-foreground/55 focus-visible:border-primary/45 focus-visible:ring-primary/15";
const selectTriggerClassName =
  "flex h-14 w-full appearance-none items-center justify-between gap-2 rounded-2xl border border-white/8 bg-accent px-5 text-left text-base text-white shadow-none outline-none transition-[color,box-shadow] data-[placeholder]:text-muted-foreground/55 focus-visible:border-primary/45 focus-visible:ring-3 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 dark:hover:bg-input/50";
const textAreaClassName =
  "min-h-[164px] rounded-[22px] border-white/8 bg-accent px-5 py-4 text-base text-white shadow-none placeholder:text-muted-foreground/45 focus-visible:border-primary/45 focus-visible:ring-primary/15";
const dangerFieldClassName =
  "border-destructive/80 text-destructive focus-visible:border-destructive focus-visible:ring-destructive/20";

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
    : "Select languages";
  const usernameHelperText = {
    idle: "",
    checking: "Checking username availability...",
    available: "Username is available.",
    unavailable: "That username is already taken.",
    error: "Unable to verify username right now.",
  };

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
    <section className="mx-auto flex w-full max-w-6xl flex-col items-center">
      <div className="w-full max-w-6xl space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-balance text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl lg:text-[3.2rem] lg:leading-[1.04]">
            {slide.title}
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            {slide.description}
          </p>
        </div>

        <div className="rounded-[28px] border border-white/8 bg-card px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="relative">
                  <Avatar
                    className={cn(
                      "size-28 border border-white/8 bg-accent dark:bg-input/30 sm:size-32",
                      profilePhotoError && "border-destructive/80",
                    )}
                  >
                    {profilePhotoPreviewUrl ? (
                      <AvatarImage
                        src={profilePhotoPreviewUrl}
                        alt="Freelancer profile"
                        className="object-cover"
                      />
                    ) : null}
                    <AvatarFallback className="bg-accent text-muted-foreground dark:bg-input/30">
                      <UserRound className="size-14" />
                    </AvatarFallback>
                    <AvatarBadge className="bottom-1 right-0 size-9 border-[3px] border-card bg-primary text-primary-foreground ring-0 [&>svg]:size-4 sm:size-10">
                      <Pencil className="size-4" />
                    </AvatarBadge>
                  </Avatar>
                </div>

                <div
                  className={cn(
                    "flex flex-wrap items-center gap-3",
                    profilePhotoError &&
                      "rounded-2xl border border-destructive/70 bg-destructive/5 px-3 py-2",
                  )}
                >
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
                        "h-12 rounded-xl border-primary bg-transparent px-6 text-sm font-semibold text-primary shadow-none hover:bg-primary/10 hover:text-primary",
                        profilePhotoError &&
                          "border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive",
                      )}
                      asChild
                    >
                      <span>
                        <Upload className="size-4" />
                        {profilePhotoPreviewUrl ? "Change photo" : "Upload photo"}
                      </span>
                    </Button>
                  </label>

                  {profilePhotoPreviewUrl ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={onProfilePhotoRemove}
                      className="h-12 rounded-xl px-4 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
                    >
                      <X className="size-4" />
                      Remove
                    </Button>
                  ) : null}
                </div>
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
                  placeholder="username"
                  className={getInputClasses(Boolean(usernameError), "pr-14")}
                  aria-invalid={Boolean(usernameError)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
                {usernameStatus === "checking" ? (
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                  </span>
                ) : null}
                {usernameStatus === "available" && !usernameError ? (
                  <span className="pointer-events-none absolute right-4 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-4" />
                  </span>
                ) : null}
              </div>
              {usernameError ? (
                <p className="text-sm text-destructive">{usernameError}</p>
              ) : usernameStatus !== "idle" && usernameHelperText[usernameStatus] ? (
                <p
                  className={cn(
                    "text-sm",
                    usernameStatus === "available" && "text-emerald-400",
                    usernameStatus === "checking" && "text-muted-foreground",
                    usernameStatus === "error" && "text-amber-400",
                  )}
                >
                  {usernameHelperText[usernameStatus]}
                </p>
              ) : null}
            </div>

            <div className="space-y-3">
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
                  <SelectContent position="popper" sideOffset={6} className="max-h-72">
                    {countryOptions.map((country) => (
                      <SelectItem key={country} value={country}>
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
                <Select
                  value={stateSelectValue}
                  onValueChange={(value) =>
                    onBasicProfileFieldChange("state", value)
                  }
                  disabled={
                    !basicProfileForm.country ||
                    isStateOptionsLoading ||
                    !hasStateOptions
                  }
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
                            : hasStateOptions
                              ? "Select state"
                              : "No states available"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    side="top"
                    align="center"
                    sideOffset={6}
                    className="max-h-72"
                  >
                    {hasStateOptions ? (
                      normalizedStateOptions.map((stateOption) => (
                        <SelectItem key={stateOption} value={stateOption}>
                          {stateOption}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="__no_state_options__" disabled>
                        {
                          !basicProfileForm.country
                            ? "Select country first"
                            : isStateOptionsLoading
                              ? "Loading states..."
                              : "No states available"
                        }
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {stateError ? (
                  <p className="text-sm text-destructive">{stateError}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-3">
              <Label className={getFieldLabelClasses(Boolean(languagesError))}>
                Select Languages
              </Label>

              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-invalid={Boolean(languagesError)}
                    className={cn(
                      getSelectTriggerClasses(Boolean(languagesError)),
                      "flex items-center justify-between gap-2",
                    )}
                  >
                    <span
                      className={cn(
                        "truncate text-left",
                        selectedLanguages.length ? "text-white" : "text-muted-foreground/55",
                      )}
                    >
                      {selectedLanguageSummary}
                    </span>
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground/70" />
                  </button>
                </PopoverTrigger>

                <PopoverContent
                  align="center"
                  sideOffset={8}
                  className="w-[var(--radix-popover-trigger-width)] border-white/10 bg-popover p-1 text-popover-foreground shadow-md backdrop-blur-xl"
                >
                  <div className="max-h-72 space-y-1 overflow-y-auto">
                    {languageOptions.map((language) => {
                      const isChecked = selectedLanguages.includes(language.value);

                      return (
                        <button
                          key={language.value}
                          type="button"
                          onClick={() => toggleLanguage(language.value)}
                          className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
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

              {selectedLanguages.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedLanguages.map((languageValue) => {
                    const languageLabel =
                      languageOptions.find((option) => option.value === languageValue)
                        ?.label || languageValue;

                    return (
                      <button
                        key={languageValue}
                        type="button"
                        onClick={() => toggleLanguage(languageValue)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                      >
                        <span>{languageLabel}</span>
                        <X className="size-3" />
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {languagesError ? (
                <p className="text-sm text-destructive">{languagesError}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FreelancerBasicProfileSlide;
