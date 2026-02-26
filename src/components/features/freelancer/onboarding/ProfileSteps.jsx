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
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
    PopoverAnchor,
} from "@/components/ui/popover";
import { StepHeader, OptionCard } from "./sub-components";
import {
    ROLE_OPTIONS,
    LANGUAGE_OPTIONS,
    COUNTRY_OPTIONS,
    PROFESSION_TITLE_OPTIONS,
} from "./constants";
import { isValidUsername, normalizeUsernameInput, getServiceLabel } from "./utils";

// ============================================================================
// STATS STEP
// ============================================================================

export const StatsStep = ({ renderContinueButton }) => {
    return (
        <div className="w-full max-w-8xl mx-auto animate-in fade-in zoom-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-24 items-center">
                {/* Text Content */}
                <div className="space-y-4 text-center md:text-left order-2 md:order-1">
                    <h1 className="text-4xl md:text-6xl font-semibold text-white tracking-tighter leading-tight">
                        <span className="text-primary">10,000+</span> freelancers are already earning on Catalance
                    </h1>
                    <p className="text-lg md:text-xl text-white/70 leading-relaxed font-light">
                        Serious clients. Quality projects. Work that respects your craft.
                    </p>
                    <div className="pt-2 flex justify-center md:justify-start">
                        {renderContinueButton(undefined, { show: true })}
                    </div>
                </div>

                {/* Image Container */}
                <div className="w-full aspect-square md:aspect-auto md:h-[500px] rounded-2xl relative group order-1 md:order-2">
                    <img
                        src="/assets/slides/slide1.png"
                        alt="Freelancer Stats"
                        className="w-full h-full object-contain scale-150 lg:scale-[1.75]"
                    />
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// WELCOME STEP
// ============================================================================

export const WelcomeStep = ({ renderContinueButton, currentStep }) => (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-medium text-white tracking-tight">
                Time to <span className="text-primary">Show Off </span> a Little
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
                Tell us what you&apos;re great at so we can match you with clients who&apos;ll actually appreciate it. No boring forms, we promise.
            </p>
        </div>

        <div className="pt-10 w-full flex justify-center">
            {renderContinueButton(currentStep, { show: true })}
        </div>
    </div>
);

// ============================================================================
// PROFILE BASICS STEP (combined form)
// ============================================================================

export const ProfileBasicsStep = ({
    formData,
    updateFormField,
    onProfilePhotoSelect,
    clearProfilePhoto,
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
        idle: "Use 5-20 lowercase letters and numbers with at least 1 number.",
        too_short: "Username must be at least 5 characters.",
        missing_number: "Add at least 1 number.",
        invalid: "Only lowercase letters and numbers allowed (5-20 chars).",
        checking: "Checking availability...",
        available: "✓ Username is available!",
        unavailable: "✗ That username is already taken.",
        error: "Unable to check username right now.",
    };
    const values = Array.isArray(formData.languages) ? formData.languages : [];
    const otherSelected = values.includes("Other");
    const selectedLanguageSummary = values
        .map((lang) => LANGUAGE_OPTIONS.find((option) => option.value === lang)?.label || lang)
        .join(", ");
    const photo = formData.profilePhoto;
    const [openProfession, setOpenProfession] = React.useState(false);
    const [openLanguages, setOpenLanguages] = React.useState(false);
    const inputRef = React.useRef(null);
    const [popoverWidth, setPopoverWidth] = React.useState(0);

    React.useEffect(() => {
        if (inputRef.current) {
            setPopoverWidth(inputRef.current.offsetWidth);
        }
    }, [inputRef.current, openProfession]);

    const filteredProfessions = PROFESSION_TITLE_OPTIONS.filter((title) =>
        title.toLowerCase().includes((formData.professionalTitle || "").toLowerCase())
    );

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
                <h1 className="text-2xl md:text-[2rem] font-bold text-primary leading-tight">
                    Complete Your Basic Profile
                </h1>
                <p className="text-white/60 text-sm">Answer these details to continue</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label className="text-white/70 text-[11px]">Profession Title</Label>
                    <div className="relative">
                        <Popover open={openProfession && filteredProfessions.length > 0} onOpenChange={setOpenProfession}>
                            <PopoverAnchor asChild>
                                <div className="relative" ref={inputRef}>
                                    <Input
                                        value={formData.professionalTitle}
                                        onChange={(e) => {
                                            updateFormField("professionalTitle", e.target.value);
                                            setOpenProfession(true);
                                        }}
                                        onClick={() => setOpenProfession(true)}
                                        onFocus={() => setOpenProfession(true)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Tab" && openProfession && filteredProfessions.length > 0) {
                                                e.preventDefault();
                                                updateFormField("professionalTitle", filteredProfessions[0]);
                                                setOpenProfession(false);
                                            }
                                            if (e.key === "Enter" && openProfession && filteredProfessions.length > 0) {
                                                e.preventDefault();
                                                updateFormField("professionalTitle", filteredProfessions[0]);
                                                setOpenProfession(false);
                                            }
                                        }}
                                        placeholder="Example: Consultant"
                                        className="h-10 bg-accent dark:bg-accent border-white/10 text-white placeholder:text-white/30 pr-10"
                                    />
                                </div>
                            </PopoverAnchor>
                            <PopoverContent
                                className="p-0 bg-accent/60 backdrop-blur-xl border-white/10 text-foreground"
                                style={{ width: popoverWidth ? `${popoverWidth}px` : "auto" }}
                                align="start"
                                onOpenAutoFocus={(e) => e.preventDefault()}
                                onPointerDownOutside={(e) => {
                                    if (inputRef.current && inputRef.current.contains(e.target)) {
                                        e.preventDefault();
                                    }
                                }}
                            >
                                <Command className="bg-accent dark:bg-accent text-white">
                                    <CommandList>
                                        <CommandGroup className="max-h-[200px] overflow-y-auto">
                                            {filteredProfessions.map((title) => (
                                                <CommandItem
                                                    key={title}
                                                    value={title}
                                                    onSelect={(currentValue) => {
                                                        const cleanValue = currentValue;
                                                        // CommandItem might lower-case value, ensure we use original title from list if needed, 
                                                        // but here title is directly mapped so it should be fine or we might get lowercased.
                                                        // Actually CommandItem value prop is used for internal filtering, onSelect passes user value?
                                                        // shadcn onSelect passes value which is usually lowercased by default cmdk unless we override.
                                                        // Let's protect against casing issues by finding original from list if possible
                                                        const original = PROFESSION_TITLE_OPTIONS.find(t => t.toLowerCase() === cleanValue.toLowerCase()) || cleanValue;

                                                        updateFormField("professionalTitle", original);
                                                        setOpenProfession(false);
                                                    }}
                                                    className="text-white hover:bg-white/10 aria-selected:bg-white/10 cursor-pointer"
                                                >
                                                    {title}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-white/70 text-[11px]">Username</Label>
                    <div className="relative">
                        <Input
                            value={formData.username}
                            onChange={(e) => {
                                const val = normalizeUsernameInput(e.target.value);
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
                            maxLength={20}
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                            pattern="[a-z0-9]*"
                            className={cn(
                                "h-10 bg-accent dark:bg-accent border-white/10 text-white placeholder:text-white/30 pr-10",
                                usernameStatus === "available" && "border-green-500/50",
                                usernameStatus === "unavailable" && "border-red-500/50",
                                (usernameStatus === "too_short" || usernameStatus === "missing_number" || usernameStatus === "invalid") && "border-amber-500/30"
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
                            (usernameStatus === "too_short" || usernameStatus === "missing_number" || usernameStatus === "invalid") && "text-amber-400",
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
                        className="bg-accent dark:bg-accent border-white/10 text-white placeholder:text-white/30 h-[100px] resize-none"
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
                                onProfilePhotoSelect(file);
                                e.target.value = "";
                            }
                        }}
                    />
                    <label
                        htmlFor="profile-photo-upload"
                        className="flex items-center gap-3 px-3 h-[100px] rounded-lg border border-dashed border-white/10 bg-accent dark:bg-accent hover:border-primary/50 hover:bg-white/10 cursor-pointer transition-all"
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
                                    clearProfilePhoto();
                                }}
                                className="p-1 hover:bg-white/10 rounded-full"
                            >
                                <X className="w-4 h-4 text-white/50" />
                            </button>
                        )}
                    </label>
                    <p className="text-[11px] text-white/55">
                        Crop is supported. Final image must be 5MB or smaller.
                    </p>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-white/70 text-[11px]">Country</Label>
                    <Select
                        value={formData.country || ""}
                        onValueChange={(value) => handleCountryChange(value)}
                    >
                        <SelectTrigger className="w-full h-10 bg-accent dark:bg-accent border-white/10 text-white px-3 rounded-lg">
                            <SelectValue placeholder="Select your country" />
                        </SelectTrigger>
                        <SelectContent
                            position="popper"
                            align="start"
                            side="bottom"
                            sideOffset={4}
                            className="bg-accent/60 backdrop-blur-xl border-white/10 text-foreground w-[var(--radix-select-trigger-width)] max-h-[45vh]"
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
                        <SelectTrigger className="w-full h-10 bg-accent dark:bg-accent border-white/10 text-white px-3 rounded-lg">
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
                            className="bg-accent/60 backdrop-blur-xl border-white/10 text-foreground w-[var(--radix-select-trigger-width)] max-h-[45vh]"
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
                            className="h-10 bg-accent dark:bg-accent border-white/10 text-white placeholder:text-white/30"
                        />
                    )}
                </div>



                <div className="space-y-1.5 lg:col-span-2">
                    <Label className="text-white/70 text-[11px]">Languages</Label>
                    <div className="space-y-3">
                        <Popover open={openLanguages} onOpenChange={setOpenLanguages}>
                            <PopoverTrigger asChild>
                                <button
                                    type="button"
                                    className="w-full h-10 px-3 rounded-lg border border-white/10 bg-accent text-left text-sm flex items-center justify-between hover:border-primary/40 transition-colors"
                                >
                                    <span className={cn("truncate", values.length ? "text-white" : "text-white/40")}>
                                        {values.length ? selectedLanguageSummary : "Select languages..."}
                                    </span>
                                    <span className="text-[11px] text-white/50">{values.length} selected</span>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent
                                align="start"
                                className="p-0 bg-accent/60 backdrop-blur-xl border-white/10 text-foreground w-[var(--radix-popover-trigger-width)]"
                            >
                                <Command className="bg-accent text-white">
                                    <CommandInput placeholder="Search languages..." className="text-white" />
                                    <CommandList className="max-h-[260px]">
                                        <CommandEmpty>No language found.</CommandEmpty>
                                        <CommandGroup>
                                            {LANGUAGE_OPTIONS.map((option) => (
                                                <CommandItem
                                                    key={option.value}
                                                    value={`${option.label} ${option.value}`}
                                                    onSelect={() => toggleLanguage(option.value)}
                                                    className="cursor-pointer text-white hover:bg-white/10 aria-selected:bg-white/10"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Checkbox
                                                            checked={values.includes(option.value)}
                                                            className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary pointer-events-none"
                                                        />
                                                        <span>{option.label}</span>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>

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
                            className="h-10 bg-accent dark:bg-accent border-white/10 text-white placeholder:text-white/30"
                        />
                    </div>
                )}

            </div>

            {renderContinueButton()}
        </div>
    );
};

// ============================================================================
// PROFESSIONAL TITLE STEP
// ============================================================================

export const ProfessionalTitleStep = ({ formData, updateFormField, queueAdvance, renderContinueButton }) => {
    const [openProfession, setOpenProfession] = React.useState(false);
    const inputRef = React.useRef(null);
    const [popoverWidth, setPopoverWidth] = React.useState(0);

    React.useEffect(() => {
        if (inputRef.current) {
            setPopoverWidth(inputRef.current.offsetWidth);
        }
    }, [inputRef.current, openProfession]);

    const filteredProfessions = PROFESSION_TITLE_OPTIONS.filter((title) =>
        title.toLowerCase().includes((formData.professionalTitle || "").toLowerCase())
    );

    return (
        <div className="space-y-6">
            <StepHeader
                title="What Is Your Profession Title?"
                subtitle="Example: Consultant"
            />
            <div className="relative">
                <Popover open={openProfession && filteredProfessions.length > 0} onOpenChange={setOpenProfession}>
                    <PopoverAnchor asChild>
                        <div className="relative" ref={inputRef}>
                            <Input
                                value={formData.professionalTitle}
                                onChange={(e) => {
                                    updateFormField("professionalTitle", e.target.value);
                                    setOpenProfession(true);
                                }}
                                onClick={() => setOpenProfession(true)}
                                onFocus={() => setOpenProfession(true)}
                                onKeyDown={(e) => {
                                    if (e.key === "Tab" && openProfession && filteredProfessions.length > 0) {
                                        e.preventDefault();
                                        updateFormField("professionalTitle", filteredProfessions[0]);
                                        setOpenProfession(false);
                                    }
                                    if (e.key === "Enter") {
                                        if (openProfession && filteredProfessions.length > 0) {
                                            e.preventDefault();
                                            updateFormField("professionalTitle", filteredProfessions[0]);
                                            setOpenProfession(false);
                                        } else if (formData.professionalTitle.trim()) {
                                            e.preventDefault();
                                            queueAdvance(0);
                                        }
                                    }
                                }}
                                placeholder="Your profession title"
                                className="bg-accent dark:bg-accent border-white/10 text-white placeholder:text-white/30"
                            />
                        </div>
                    </PopoverAnchor>
                    <PopoverContent
                        className="p-0 bg-accent/60 backdrop-blur-xl border-white/10 text-foreground"
                        style={{ width: popoverWidth ? `${popoverWidth}px` : "auto" }}
                        align="start"
                        onOpenAutoFocus={(e) => e.preventDefault()}
                        onPointerDownOutside={(e) => {
                            if (inputRef.current && inputRef.current.contains(e.target)) {
                                e.preventDefault();
                            }
                        }}
                    >
                        <Command className="bg-accent dark:bg-accent text-white">
                            <CommandList>
                                <CommandGroup className="max-h-[200px] overflow-y-auto">
                                    {filteredProfessions.map((title) => (
                                        <CommandItem
                                            key={title}
                                            value={title}
                                            onSelect={(currentValue) => {
                                                const original = PROFESSION_TITLE_OPTIONS.find(t => t.toLowerCase() === currentValue.toLowerCase()) || currentValue;
                                                updateFormField("professionalTitle", original);
                                                setOpenProfession(false);
                                                // Should we auto-advance here if they select from list? Usually yes for single-step flow.
                                                // queueAdvance(0); // Optional based on UX preference. Let's keep manual continue or Enter for consistency unless requested.
                                            }}
                                            className="text-white hover:bg-white/10 aria-selected:bg-white/10 cursor-pointer"
                                        >
                                            {title}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
            {renderContinueButton()}
        </div>
    );
};

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
        idle: "Use 5-20 lowercase letters and numbers with at least 1 number.",
        too_short: "Username must be at least 5 characters.",
        missing_number: "Add at least 1 number.",
        invalid: "Only lowercase letters and numbers allowed (5-20 chars).",
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
                        const val = normalizeUsernameInput(e.target.value);
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
                    maxLength={20}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    pattern="[a-z0-9]*"
                    className={cn(
                        "bg-accent dark:bg-accent border-white/10 text-white placeholder:text-white/30 pr-10",
                        usernameStatus === "available" && "border-green-500/50",
                        usernameStatus === "unavailable" && "border-red-500/50",
                        (usernameStatus === "too_short" || usernameStatus === "missing_number" || usernameStatus === "invalid") && "border-amber-500/30"
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
                    (usernameStatus === "too_short" || usernameStatus === "missing_number" || usernameStatus === "invalid") && "text-amber-400",
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
            <SelectTrigger className="w-full bg-accent dark:bg-accent border-white/10 text-white p-6 rounded-xl">
                <SelectValue placeholder="Select your country" />
            </SelectTrigger>
            <SelectContent
                position="popper"
                align="start"
                side="bottom"
                sideOffset={4}
                className="bg-accent/60 backdrop-blur-xl border-white/10 text-foreground w-[var(--radix-select-trigger-width)] max-h-[45vh]"
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
            <SelectTrigger className="w-full bg-accent dark:bg-accent border-white/10 text-white p-6 rounded-xl">
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
                className="bg-accent/60 backdrop-blur-xl border-white/10 text-foreground w-[var(--radix-select-trigger-width)] max-h-[45vh]"
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
                className="bg-accent dark:bg-accent border-white/10 text-white placeholder:text-white/30"
            />
        )}
        {renderContinueButton()}
    </div>
);

// ============================================================================
// PROFILE PHOTO STEP
// ============================================================================

export const ProfilePhotoStep = ({
    formData,
    onProfilePhotoSelect,
    clearProfilePhoto,
    renderContinueButton,
}) => {
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
                            onProfilePhotoSelect(file);
                            e.target.value = "";
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
                                clearProfilePhoto();
                            }}
                            className="p-1 hover:bg-white/10 rounded-full"
                        >
                            <X className="w-4 h-4 text-white/50" />
                        </button>
                    )}
                </label>
                <p className="text-xs text-white/55">
                    Crop and optimize before saving. Max upload size is 5MB.
                </p>
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
    const values = Array.isArray(formData.languages) ? formData.languages : [];
    const otherSelected = values.includes("Other");
    const selectedLanguageSummary = values
        .map((lang) => LANGUAGE_OPTIONS.find((option) => option.value === lang)?.label || lang)
        .join(", ");
    const [openLanguages, setOpenLanguages] = React.useState(false);

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
                <Popover open={openLanguages} onOpenChange={setOpenLanguages}>
                    <PopoverTrigger asChild>
                        <button
                            type="button"
                            className="w-full h-10 px-3 rounded-lg border border-white/10 bg-accent text-left text-sm flex items-center justify-between hover:border-primary/40 transition-colors"
                        >
                            <span className={cn("truncate", values.length ? "text-white" : "text-white/40")}>
                                {values.length ? selectedLanguageSummary : "Select languages..."}
                            </span>
                            <span className="text-[11px] text-white/50">{values.length} selected</span>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent
                        align="start"
                        className="p-0 bg-accent/60 backdrop-blur-xl border-white/10 text-foreground w-[var(--radix-popover-trigger-width)]"
                    >
                        <Command className="bg-accent text-white">
                            <CommandInput placeholder="Search languages..." className="text-white" />
                            <CommandList className="max-h-[260px]">
                                <CommandEmpty>No language found.</CommandEmpty>
                                <CommandGroup>
                                    {LANGUAGE_OPTIONS.map((option) => (
                                        <CommandItem
                                            key={option.value}
                                            value={`${option.label} ${option.value}`}
                                            onSelect={() => toggleLanguage(option.value)}
                                            className="cursor-pointer text-white hover:bg-white/10 aria-selected:bg-white/10"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    checked={values.includes(option.value)}
                                                    className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary pointer-events-none"
                                                />
                                                <span>{option.label}</span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

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
                        className="bg-accent dark:bg-accent border-white/10 text-white placeholder:text-white/30"
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
        <StepHeader title="LinkedIn Profile URL (Optional)" />
        <Input
            type="url"
            value={formData.linkedinUrl}
            onChange={(e) => updateFormField("linkedinUrl", e.target.value)}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    queueAdvance(0);
                }
            }}
            placeholder="https://www.linkedin.com/in/your-profile"
            className="bg-accent dark:bg-accent border-white/10 text-white placeholder:text-white/30"
        />
        {renderContinueButton()}
    </div>
);

// ============================================================================
// PORTFOLIO STEP
// ============================================================================

export const PortfolioStep = ({ formData, updateFormField, queueAdvance, renderContinueButton }) => (
    <div className="space-y-6">
        <StepHeader title="Portfolio Or Website Link (Optional)" />
        <Input
            type="url"
            value={formData.portfolioUrl}
            onChange={(e) => updateFormField("portfolioUrl", e.target.value)}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    queueAdvance(0);
                }
            }}
            placeholder="https://your-portfolio.com"
            className="bg-accent dark:bg-accent border-white/10 text-white placeholder:text-white/30"
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

// ============================================================================
// PRICING STRATEGY STEP
// ============================================================================

export const PricingStrategyStep = ({ renderContinueButton }) => {
    return (
        <div className="w-full max-w-8xl mx-auto animate-in fade-in zoom-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-24 items-center">
                {/* Text Content */}
                <div className="space-y-4 text-center md:text-left order-2 md:order-1">
                    <h1 className="text-4xl md:text-6xl font-semibold text-white tracking-tighter leading-tight">
                        Smart pricing means <span className="text-primary">More opportunities</span>
                    </h1>
                    <p className="text-lg md:text-xl text-white/70 leading-relaxed font-light">
                        Freelancers who start with lower pricing get hired 3x faster
                    </p>
                    <div className="pt-2 flex justify-center md:justify-start">
                        {renderContinueButton(undefined, { show: true })}
                    </div>
                </div>

                {/* Image Container */}
                <div className="w-full aspect-square md:aspect-auto md:h-[500px] rounded-2xl relative group order-1 md:order-2">
                    <img
                        src="/assets/slides/slide2.png"
                        alt="Smart Pricing"
                        className="w-full h-full object-contain scale-150 lg:scale-[1.75]"
                    />
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// PORTFOLIO IMPORTANCE STEP
// ============================================================================

export const PortfolioImportanceStep = ({ renderContinueButton }) => {
    return (
        <div className="space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="text-center space-y-4">
                <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">
                    Profiles with <span className="text-primary">portfolios</span> get hired first
                </h1>
                <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
                    Even one solid case study increases your chances of landing projects by 80%. Your work speaks louder than words.
                </p>
            </div>

            <div className="pt-2 w-full flex justify-center">
                {renderContinueButton(undefined, { show: true })}
            </div>
        </div>
    );
};

// ============================================================================
// SERVICE TRANSITION STEP
// ============================================================================

export const ServiceTransitionStep = ({ renderContinueButton }) => {
    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="text-center space-y-4">
                <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">
                    You&apos;re almost <span className="text-primary">there</span>
                </h1>
                <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
                    The average freelancer lands their first project in just 2 weeks. Finish your profile and join them.
                </p>
            </div>

            {/* Empty Image Container */}
            <div className="w-full max-w-4xl mx-auto aspect-video bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-linear-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <p className="text-white/20 font-medium">Image Placeholder</p>
            </div>

            <div className="pt-4 w-full flex justify-center">
                {renderContinueButton(undefined, { show: true })}
            </div>
        </div>
    );
};

// ============================================================================
// SERVICE WELCOME STEP
// ============================================================================

export const ServiceWelcomeStep = ({
    serviceKey,
    serviceIndex = 0,
    totalServices = 1,
    renderContinueButton,
    currentStep,
}) => {
    const serviceLabel = getServiceLabel(serviceKey);

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="text-center space-y-4">
                {totalServices > 1 && (
                    <p className="text-sm text-white/50">
                        Service {serviceIndex + 1} of {totalServices}
                    </p>
                )}
                <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">
                    Let&apos;s Start Your <span className="text-primary">{serviceLabel}</span> Setup
                </h1>
                <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
                    We&apos;ll ask a few service-specific questions to match you with better-fit projects faster.
                </p>
            </div>

            <div className="pt-4 w-full flex justify-center">
                {renderContinueButton(currentStep, { show: true })}
            </div>
        </div>
    );
};

// ============================================================================
// SERVICE END STEP
// ============================================================================

export const ServiceEndStep = ({
    serviceKey,
    totalServices = 1,
    renderContinueButton,
    currentStep,
}) => {
    const serviceLabel = getServiceLabel(serviceKey);
    const isSingleService = totalServices <= 1;

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="text-center space-y-4">
                <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">
                    <span className="text-primary">Thank You</span>
                </h1>
                <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
                    {isSingleService
                        ? `You completed your ${serviceLabel} setup. Continue to finish your onboarding.`
                        : "You completed all selected service sections. Continue to finish your onboarding."}
                </p>
            </div>

            <div className="pt-4 w-full flex justify-center">
                {renderContinueButton(currentStep, { show: true })}
            </div>
        </div>
    );
};




