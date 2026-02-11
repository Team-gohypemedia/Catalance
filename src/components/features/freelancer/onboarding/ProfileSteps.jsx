import React from "react";
import { Check, Upload, X } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    ROLE_OPTIONS,
    LANGUAGE_OPTIONS,
    COUNTRY_OPTIONS,
} from "./constants";
import { isValidUsername } from "./utils";
import { StepHeader, OptionCard } from "./sub-components";

// ============================================================================
// PROFILE BASICS STEP (combined form)
// ============================================================================

export const ProfileBasicsStep = ({
    formData,
    updateFormField,
    handleCountryChange,
    usernameStatus,
    debouncedUsernameCheck,
    usernameDebounceRef,
    checkUsernameAvailability,
    stateOptions,
    isStateOptionsLoading,
    renderContinueButton,
}) => {
    const helperText = {
        idle: "Use 3-20 characters: letters, numbers, or underscores.",
        too_short: "Username must be at least 3 characters.",
        invalid: "Only letters, numbers, and underscores allowed (3-20 chars).",
        checking: "Checking availability...",
        available: "✓ Username is available!",
        unavailable: "✗ That username is already taken.",
        error: "Unable to check username right now.",
    };
    const values = formData.languages || [];
    const otherSelected = values.includes("Other");
    const photo = formData.profilePhoto;

    const toggleLanguage = (value) => {
        const exists = values.includes(value);
        const nextValues = exists ? values.filter((item) => item !== value) : [...values, value];
        updateFormField("languages", nextValues);
        if (!nextValues.includes("Other") && formData.otherLanguage) {
            updateFormField("otherLanguage", "");
        }
    };

    return (
        <div className="space-y-5">
            <div className="text-center space-y-1">
                <h1 className="text-2xl md:text-[2rem] font-bold text-white leading-tight">
                    Complete Your Basic Profile
                </h1>
                <p className="text-white/60 text-sm">Answer these details to continue</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label className="text-white/70 text-[11px]">Profession Title</Label>
                    <Input
                        value={formData.professionalTitle}
                        onChange={(e) => updateFormField("professionalTitle", e.target.value)}
                        placeholder="Example: Consultant"
                        className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-white/70 text-[11px]">Username</Label>
                    <div className="relative">
                        <Input
                            value={formData.username}
                            onChange={(e) => {
                                const val = e.target.value;
                                updateFormField("username", val);
                                debouncedUsernameCheck(val);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && isValidUsername(formData.username)) {
                                    e.preventDefault();
                                    if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current);
                                    checkUsernameAvailability();
                                }
                            }}
                            placeholder="username"
                            className={cn(
                                "h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 pr-10",
                                usernameStatus === "available" && "border-green-500/50",
                                usernameStatus === "unavailable" && "border-red-500/50",
                                (usernameStatus === "too_short" || usernameStatus === "invalid") && "border-amber-500/30"
                            )}
                        />
                        {usernameStatus === "checking" && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            </div>
                        )}
                        {usernameStatus === "available" && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400">
                                <Check className="w-4 h-4" />
                            </div>
                        )}
                        {usernameStatus === "unavailable" && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400">
                                <span className="text-sm font-bold">✗</span>
                            </div>
                        )}
                    </div>
                    <p
                        className={cn(
                            "text-xs min-h-4 transition-colors duration-200",
                            usernameStatus === "available" && "text-green-400",
                            usernameStatus === "unavailable" && "text-red-400",
                            (usernameStatus === "too_short" || usernameStatus === "invalid") && "text-amber-400",
                            (usernameStatus === "idle" || usernameStatus === "checking") && "text-white/50",
                            usernameStatus === "error" && "text-yellow-400"
                        )}
                    >
                        {helperText[usernameStatus] || helperText.idle}
                    </p>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-white/70 text-[11px]">Professional Bio</Label>
                    <Textarea
                        value={formData.professionalBio}
                        onChange={(e) => updateFormField("professionalBio", e.target.value)}
                        placeholder="Write 2-4 sentences about your experience, specialties, and the value you bring."
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-[100px] resize-none"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-white/70 text-[11px]">Profile Photo</Label>
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="profile-photo-upload"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const nextPhoto = { name: file.name, url: URL.createObjectURL(file) };
                                updateFormField("profilePhoto", nextPhoto);
                            }
                        }}
                    />
                    <label
                        htmlFor="profile-photo-upload"
                        className="flex items-center gap-3 px-3 h-[100px] rounded-lg border border-dashed border-white/10 bg-white/5 hover:border-primary/50 hover:bg-white/10 cursor-pointer transition-all"
                    >
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                            {photo?.url ? (
                                <img src={photo.url} alt="Profile preview" className="w-full h-full object-cover" />
                            ) : (
                                <Upload className="w-4 h-4 text-white/70" />
                            )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <span className="block text-sm text-white/80 truncate">
                                {photo?.name || "Upload photo (PNG, JPG)"}
                            </span>
                        </div>
                        {photo && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    updateFormField("profilePhoto", null);
                                }}
                                className="p-1 hover:bg-white/10 rounded-full"
                            >
                                <X className="w-4 h-4 text-white/50" />
                            </button>
                        )}
                    </label>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-white/70 text-[11px]">Country</Label>
                    <Select
                        value={formData.country || ""}
                        onValueChange={(value) => handleCountryChange(value)}
                    >
                        <SelectTrigger className="w-full h-10 bg-white/5 border-white/10 text-white px-3 rounded-lg">
                            <SelectValue placeholder="Select your country" />
                        </SelectTrigger>
                        <SelectContent
                            position="popper"
                            align="start"
                            side="bottom"
                            sideOffset={4}
                            className="bg-[#1A1A1A] border-white/10 text-white w-[var(--radix-select-trigger-width)] max-h-[45vh]"
                        >
                            {COUNTRY_OPTIONS.map((country) => (
                                <SelectItem key={country} value={country} className="focus:bg-white/10 focus:text-white cursor-pointer">
                                    {country}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-white/70 text-[11px]">State / Province</Label>
                    <Select
                        value={formData.city || ""}
                        onValueChange={(value) => updateFormField("city", value)}
                        disabled={!formData.country || isStateOptionsLoading || stateOptions.length === 0}
                    >
                        <SelectTrigger className="w-full h-10 bg-white/5 border-white/10 text-white px-3 rounded-lg">
                            <SelectValue
                                placeholder={
                                    !formData.country
                                        ? "Select country first"
                                        : isStateOptionsLoading
                                            ? "Loading states..."
                                            : stateOptions.length > 0
                                                ? "Select your state"
                                                : "No state list found"
                                }
                            />
                        </SelectTrigger>
                        <SelectContent
                            position="popper"
                            align="start"
                            side="bottom"
                            sideOffset={4}
                            className="bg-[#1A1A1A] border-white/10 text-white w-[var(--radix-select-trigger-width)] max-h-[45vh]"
                        >
                            {stateOptions.length > 0 ? (
                                stateOptions.map((state) => (
                                    <SelectItem key={state} value={state} className="focus:bg-white/10 focus:text-white cursor-pointer">
                                        {state}
                                    </SelectItem>
                                ))
                            ) : (
                                <SelectItem value="__state_unavailable__" disabled>
                                    No state list found for selected country
                                </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                    {!isStateOptionsLoading && formData.country && stateOptions.length === 0 && (
                        <Input
                            value={formData.city}
                            onChange={(e) => updateFormField("city", e.target.value)}
                            placeholder="Type your state"
                            className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                        />
                    )}
                </div>



                <div className="space-y-1.5 lg:col-span-2">
                    <Label className="text-white/70 text-[11px]">Languages</Label>
                    <div className="space-y-3">
                        <Select
                            value=""
                            onValueChange={(value) => {
                                if (value) {
                                    toggleLanguage(value);
                                }
                            }}
                        >
                            <SelectTrigger className="w-full h-10 bg-white/5 border-white/10 text-white px-3 rounded-lg">
                                <SelectValue placeholder="Select languages..." />
                            </SelectTrigger>
                            <SelectContent
                                className="bg-[#1A1A1A] border-white/10 text-white w-[var(--radix-select-trigger-width)] max-h-[300px]"
                                position="popper"
                                sideOffset={5}
                            >
                                {LANGUAGE_OPTIONS.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                        className="focus:bg-white/10 focus:text-white cursor-pointer pl-2"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                checked={values.includes(option.value)}
                                                className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary pointer-events-none"
                                            />
                                            <span>{option.label}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Selected Languages Tags */}
                        {values.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {values.map((lang) => {
                                    const label = LANGUAGE_OPTIONS.find(l => l.value === lang)?.label || lang;
                                    return (
                                        <div
                                            key={lang}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium group hover:bg-primary/20 transition-colors"
                                        >
                                            <span>{label}</span>
                                            <button
                                                type="button"
                                                onClick={() => toggleLanguage(lang)}
                                                className="hover:text-primary/80 focus:outline-none"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {otherSelected && (
                    <div className="space-y-1.5 lg:col-span-2">
                        <Label className="text-white/70 text-[11px]">Other language</Label>
                        <Input
                            value={formData.otherLanguage}
                            onChange={(e) => updateFormField("otherLanguage", e.target.value)}
                            placeholder="Type your language"
                            className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                        />
                    </div>
                )}

                <div className="space-y-1.5">
                    <Label className="text-white/70 text-[11px]">LinkedIn Profile URL</Label>
                    <Input
                        type="url"
                        value={formData.linkedinUrl}
                        onChange={(e) => updateFormField("linkedinUrl", e.target.value)}
                        placeholder="https://www.linkedin.com/in/your-profile"
                        className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-white/70 text-[11px]">Portfolio Or Website Link</Label>
                    <Input
                        type="url"
                        value={formData.portfolioUrl}
                        onChange={(e) => updateFormField("portfolioUrl", e.target.value)}
                        placeholder="https://your-portfolio.com"
                        className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    />
                </div>
            </div>

            {renderContinueButton()}
        </div>
    );
};

// ============================================================================
// PROFESSIONAL TITLE STEP
// ============================================================================

export const ProfessionalTitleStep = ({ formData, updateFormField, queueAdvance, renderContinueButton }) => (
    <div className="space-y-6">
        <StepHeader
            title="What Is Your Profession Title?"
            subtitle="Example: Consultant"
        />
        <Input
            value={formData.professionalTitle}
            onChange={(e) => updateFormField("professionalTitle", e.target.value)}
            onKeyDown={(e) => {
                if (e.key === "Enter" && formData.professionalTitle.trim()) {
                    e.preventDefault();
                    queueAdvance(0);
                }
            }}
            placeholder="Your profession title"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
        />
        {renderContinueButton()}
    </div>
);

// ============================================================================
// USERNAME STEP
// ============================================================================

export const UsernameStep = ({
    formData,
    updateFormField,
    usernameStatus,
    debouncedUsernameCheck,
    usernameDebounceRef,
    checkUsernameAvailability,
    renderContinueButton,
}) => {
    const helperText = {
        idle: "Use 3-20 characters: letters, numbers, or underscores.",
        too_short: "Username must be at least 3 characters.",
        invalid: "Only letters, numbers, and underscores allowed (3-20 chars).",
        checking: "Checking availability...",
        available: "✓ Username is available!",
        unavailable: "✗ That username is already taken.",
        error: "Unable to check username right now.",
    };

    return (
        <div className="space-y-6">
            <StepHeader
                title="Choose a username"
                subtitle="This will appear on your public profile"
            />
            <div className="relative">
                <Input
                    value={formData.username}
                    onChange={(e) => {
                        const val = e.target.value;
                        updateFormField("username", val);
                        debouncedUsernameCheck(val);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && isValidUsername(formData.username)) {
                            e.preventDefault();
                            if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current);
                            checkUsernameAvailability();
                        }
                    }}
                    placeholder="username"
                    className={cn(
                        "bg-white/5 border-white/10 text-white placeholder:text-white/30 pr-10",
                        usernameStatus === "available" && "border-green-500/50",
                        usernameStatus === "unavailable" && "border-red-500/50",
                        (usernameStatus === "too_short" || usernameStatus === "invalid") && "border-amber-500/30"
                    )}
                />
                {usernameStatus === "checking" && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                )}
                {usernameStatus === "available" && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400">
                        <Check className="w-4 h-4" />
                    </div>
                )}
                {usernameStatus === "unavailable" && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400">
                        <span className="text-sm font-bold">✗</span>
                    </div>
                )}
            </div>
            <p
                className={cn(
                    "text-sm transition-colors duration-200",
                    usernameStatus === "available" && "text-green-400",
                    usernameStatus === "unavailable" && "text-red-400",
                    (usernameStatus === "too_short" || usernameStatus === "invalid") && "text-amber-400",
                    (usernameStatus === "idle" || usernameStatus === "checking") && "text-white/50",
                    usernameStatus === "error" && "text-yellow-400"
                )}
            >
                {helperText[usernameStatus] || helperText.idle}
            </p>
            {renderContinueButton()}
        </div>
    );
};

// ============================================================================
// COUNTRY STEP
// ============================================================================

export const CountryStep = ({ formData, handleCountryChange }) => (
    <div className="space-y-6">
        <StepHeader title="Which Country Are You Based In?" />
        <Select
            value={formData.country || ""}
            onValueChange={(value) => handleCountryChange(value, 0)}
        >
            <SelectTrigger className="w-full bg-white/5 border-white/10 text-white p-6 rounded-xl">
                <SelectValue placeholder="Select your country" />
            </SelectTrigger>
            <SelectContent
                position="popper"
                align="start"
                side="bottom"
                sideOffset={4}
                className="bg-[#1A1A1A] border-white/10 text-white w-[var(--radix-select-trigger-width)] max-h-[45vh]"
            >
                {COUNTRY_OPTIONS.map((country) => (
                    <SelectItem key={country} value={country} className="focus:bg-white/10 focus:text-white cursor-pointer">
                        {country}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    </div>
);

// ============================================================================
// CITY / STATE STEP
// ============================================================================

export const CityStep = ({
    formData,
    updateFormField,
    queueAdvance,
    stateOptions,
    isStateOptionsLoading,
    renderContinueButton,
}) => (
    <div className="space-y-6">
        <StepHeader title="Which State Are You Based In?" />
        <Select
            value={formData.city || ""}
            onValueChange={(value) => updateFormField("city", value, 0)}
            disabled={!formData.country || isStateOptionsLoading || stateOptions.length === 0}
        >
            <SelectTrigger className="w-full bg-white/5 border-white/10 text-white p-6 rounded-xl">
                <SelectValue
                    placeholder={
                        !formData.country
                            ? "Select country first"
                            : isStateOptionsLoading
                                ? "Loading states..."
                                : stateOptions.length > 0
                                    ? "Select your state"
                                    : "No state list found"
                    }
                />
            </SelectTrigger>
            <SelectContent
                position="popper"
                align="start"
                side="bottom"
                sideOffset={4}
                className="bg-[#1A1A1A] border-white/10 text-white w-[var(--radix-select-trigger-width)] max-h-[45vh]"
            >
                {stateOptions.length > 0 ? (
                    stateOptions.map((state) => (
                        <SelectItem key={state} value={state} className="focus:bg-white/10 focus:text-white cursor-pointer">
                            {state}
                        </SelectItem>
                    ))
                ) : (
                    <SelectItem value="__state_unavailable__" disabled>
                        No state list found for selected country
                    </SelectItem>
                )}
            </SelectContent>
        </Select>
        {!isStateOptionsLoading && formData.country && stateOptions.length === 0 && (
            <Input
                value={formData.city}
                onChange={(e) => updateFormField("city", e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && formData.city.trim()) {
                        e.preventDefault();
                        queueAdvance(0);
                    }
                }}
                placeholder="Type your state"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
        )}
        {renderContinueButton()}
    </div>
);

// ============================================================================
// PROFILE PHOTO STEP
// ============================================================================

export const ProfilePhotoStep = ({ formData, updateFormField, renderContinueButton }) => {
    const photo = formData.profilePhoto;

    return (
        <div className="space-y-6">
            <StepHeader
                title="Upload a profile photo"
                subtitle="Clear headshots work best"
            />
            <div className="space-y-4">
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="profile-photo-upload"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            const nextPhoto = { name: file.name, url: URL.createObjectURL(file) };
                            updateFormField("profilePhoto", nextPhoto);
                        }
                    }}
                />
                <label
                    htmlFor="profile-photo-upload"
                    className="flex items-center gap-4 px-4 py-4 rounded-xl border border-dashed border-white/20 hover:border-primary/50 hover:bg-white/5 cursor-pointer transition-all"
                >
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                        {photo?.url ? (
                            <img src={photo.url} alt="Profile preview" className="w-full h-full object-cover" />
                        ) : (
                            <Upload className="w-5 h-5 text-white/70" />
                        )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <span className="block text-sm text-white/80 truncate">
                            {photo?.name || "Upload photo (PNG, JPG)"}
                        </span>
                    </div>
                    {photo && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                updateFormField("profilePhoto", null);
                            }}
                            className="p-1 hover:bg-white/10 rounded-full"
                        >
                            <X className="w-4 h-4 text-white/50" />
                        </button>
                    )}
                </label>
            </div>
            {renderContinueButton()}
        </div>
    );
};

// ============================================================================
// LANGUAGES STEP
// ============================================================================

export const LanguagesStep = ({
    formData,
    updateFormField,
    queueAdvance,
    hasMultipleChoices,
    hasSingleChoice,
    currentStep,
    renderContinueButton,
}) => {
    const values = formData.languages || [];
    const otherSelected = values.includes("Other");

    const toggleLanguage = (value) => {
        const exists = values.includes(value);
        const nextValues = exists ? values.filter((item) => item !== value) : [...values, value];
        updateFormField("languages", nextValues);
        if (!nextValues.includes("Other") && formData.otherLanguage) {
            updateFormField("otherLanguage", "");
        }
        if (hasSingleChoice(LANGUAGE_OPTIONS) && !exists && nextValues.length > 0) {
            queueAdvance(0);
        }
    };

    return (
        <div className="space-y-6">
            <StepHeader title="Languages You Can Work Professionally In" />
            <div className="space-y-3">
                <Select
                    value=""
                    onValueChange={(value) => {
                        if (value) {
                            toggleLanguage(value);
                        }
                    }}
                >
                    <SelectTrigger className="w-full h-10 bg-white/5 border-white/10 text-white px-3 rounded-lg">
                        <SelectValue placeholder="Select languages..." />
                    </SelectTrigger>
                    <SelectContent
                        className="bg-[#1A1A1A] border-white/10 text-white w-[var(--radix-select-trigger-width)] max-h-[300px]"
                        position="popper"
                        sideOffset={5}
                    >
                        {LANGUAGE_OPTIONS.map((option) => (
                            <SelectItem
                                key={option.value}
                                value={option.value}
                                className="focus:bg-white/10 focus:text-white cursor-pointer pl-2"
                            >
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={values.includes(option.value)}
                                        className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary pointer-events-none"
                                    />
                                    <span>{option.label}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {values.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {values.map((lang) => {
                            const label = LANGUAGE_OPTIONS.find(l => l.value === lang)?.label || lang;
                            return (
                                <div
                                    key={lang}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium group hover:bg-primary/20 transition-colors"
                                >
                                    <span>{label}</span>
                                    <button
                                        type="button"
                                        onClick={() => toggleLanguage(lang)}
                                        className="hover:text-primary/80 focus:outline-none"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {otherSelected && (
                <div className="space-y-2">
                    <Label className="text-white/70 text-xs">Other language</Label>
                    <Input
                        value={formData.otherLanguage}
                        onChange={(e) => updateFormField("otherLanguage", e.target.value)}
                        placeholder="Type your language"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    />
                </div>
            )}

            {renderContinueButton(currentStep, { show: hasMultipleChoices(LANGUAGE_OPTIONS) })}
        </div>
    );
};

// ============================================================================
// LINKEDIN STEP
// ============================================================================

export const LinkedinStep = ({ formData, updateFormField, queueAdvance, renderContinueButton }) => (
    <div className="space-y-6">
        <StepHeader title="LinkedIn Profile URL" />
        <Input
            type="url"
            value={formData.linkedinUrl}
            onChange={(e) => updateFormField("linkedinUrl", e.target.value)}
            onKeyDown={(e) => {
                if (e.key === "Enter" && formData.linkedinUrl.trim()) {
                    e.preventDefault();
                    queueAdvance(0);
                }
            }}
            placeholder="https://www.linkedin.com/in/your-profile"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
        />
        {renderContinueButton()}
    </div>
);

// ============================================================================
// PORTFOLIO STEP
// ============================================================================

export const PortfolioStep = ({ formData, updateFormField, queueAdvance, renderContinueButton }) => (
    <div className="space-y-6">
        <StepHeader title="Portfolio Or Website Link" />
        <Input
            type="url"
            value={formData.portfolioUrl}
            onChange={(e) => updateFormField("portfolioUrl", e.target.value)}
            onKeyDown={(e) => {
                if (e.key === "Enter" && formData.portfolioUrl.trim()) {
                    e.preventDefault();
                    queueAdvance(0);
                }
            }}
            placeholder="https://your-portfolio.com"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
        />
        {renderContinueButton()}
    </div>
);

// ============================================================================
// ROLE STEP
// ============================================================================

export const RoleStep = ({ formData, updateFormField }) => (
    <div className="space-y-4">
        <StepHeader title="How Do You Want To Work On Catalance?" />
        <div className="space-y-3">
            {ROLE_OPTIONS.map((option) => (
                <OptionCard
                    key={option.value}
                    selected={formData.role === option.value}
                    onClick={() => updateFormField("role", option.value, 0)}
                    label={option.label}
                    description={option.description}
                    icon={option.icon}
                />
            ))}
        </div>
    </div>
);
