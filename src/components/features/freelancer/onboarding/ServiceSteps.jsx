import React from "react";
import { motion } from "framer-motion";
import { Upload, X, Plus, Trash2, Check, ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
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
} from "@/components/ui/popover";

import {
    SERVICE_OPTIONS,
    EXPERIENCE_YEARS_OPTIONS,
    WORKING_LEVEL_OPTIONS,
    YES_NO_OPTIONS,
    UPCOMING_NICHE_OPTIONS,
    INDUSTRY_NICHE_OPTIONS,
    PROJECT_COMPLEXITY_OPTIONS,
    PRICE_RANGE_MIN,
    PRICE_RANGE_MAX,
    PRICE_RANGE_STEP,
    AVERAGE_PROJECT_PRICE_OPTIONS,
    ROLE_IN_PROJECT_OPTIONS,
    PROJECT_TIMELINE_OPTIONS,
    BUDGET_RANGE_OPTIONS,
    DEFAULT_TECH_STACK_OPTIONS,
} from "./constants";
import {
    getServiceLabel,
    getServiceLimit,
    getServiceGroups,
    getTechStackOptions,
    createServiceDetail,
    formatPriceLabel,
    parsePriceValue,
    clampPriceValue,
} from "./utils";
import { StepHeader, OptionCard } from "./sub-components";

// ============================================================================
// SERVICES SELECTION STEP
// ============================================================================

export const ServicesStep = ({
    formData,
    toggleServiceSelection,
    hasMultipleChoices,
    currentStep,
    renderContinueButton,
}) => {
    const limit = getServiceLimit(formData.role);
    const showContinue = hasMultipleChoices(SERVICE_OPTIONS);
    return (
        <div className="space-y-6">
            <StepHeader
                title="Which Services Do You Want To Offer?"
                subtitle={`Select up to ${limit} services`}
            />
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
                {SERVICE_OPTIONS.map((option) => {
                    const selectedIndex = formData.selectedServices.indexOf(option.value);
                    const isSelected = selectedIndex !== -1;
                    return (
                        <motion.button
                            layout
                            key={option.value}
                            type="button"
                            onClick={() => toggleServiceSelection(option.value)}
                            className={cn(
                                "group flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 relative overflow-hidden min-h-[120px]",
                                isSelected
                                    ? "border-primary/50 bg-primary/5 shadow-md shadow-primary/5"
                                    : "border-white/10 bg-white/5 hover:border-primary/30 hover:bg-white/10"
                            )}
                        >
                            {isSelected && <div className="absolute inset-0 border-2 border-primary/50 rounded-xl" />}

                            <div
                                className={cn(
                                    "p-2.5 rounded-lg transition-colors mb-2",
                                    isSelected
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-white/10 text-white/70 group-hover:bg-white/20 group-hover:text-white"
                                )}
                            >
                                {option.icon && <option.icon className="w-5 h-5" />}
                            </div>

                            <span
                                className={cn(
                                    "text-xs font-semibold text-center leading-tight transition-colors line-clamp-2 px-2",
                                    isSelected ? "text-primary" : "text-white"
                                )}
                            >
                                {option.label}
                            </span>
                        </motion.button>
                    );
                })}
            </div>
            {renderContinueButton(currentStep, { show: showContinue })}
        </div>
    );
};

// ============================================================================
// SERVICE EXPERIENCE STEP
// ============================================================================

export const ServiceExperienceStep = ({ formData, updateServiceField, renderServiceMeta, serviceKey }) => (
    <div className="space-y-4">
        <StepHeader
            title={`Years Of Experience In ${getServiceLabel(serviceKey)}?`}
            subtitle={renderServiceMeta(serviceKey)}
        />
        <div className="space-y-3">
            {EXPERIENCE_YEARS_OPTIONS.map((option) => (
                <OptionCard
                    key={option.value}
                    selected={formData.serviceDetails?.[serviceKey]?.experienceYears === option.value}
                    onClick={() => updateServiceField(serviceKey, "experienceYears", option.value, 0)}
                    label={option.label}
                />
            ))}
        </div>
    </div>
);

// ============================================================================
// SERVICE LEVEL STEP
// ============================================================================

export const ServiceLevelStep = ({ formData, updateServiceField, renderServiceMeta, serviceKey }) => (
    <div className="space-y-4">
        <StepHeader
            title={`Working Level For ${getServiceLabel(serviceKey)}?`}
            subtitle={renderServiceMeta(serviceKey)}
        />
        <div className="space-y-3">
            {WORKING_LEVEL_OPTIONS.map((option) => (
                <OptionCard
                    key={option.value}
                    selected={formData.serviceDetails?.[serviceKey]?.workingLevel === option.value}
                    onClick={() => updateServiceField(serviceKey, "workingLevel", option.value, 0)}
                    label={option.label}
                />
            ))}
        </div>
    </div>
);

// ============================================================================
// SERVICE PROJECTS STEP
// ============================================================================

export const ServiceProjectsStep = ({ formData, updateServiceField, renderServiceMeta, serviceKey }) => (
    <div className="space-y-4">
        <StepHeader
            title={`Do You Have Previous Projects In ${getServiceLabel(serviceKey)}?`}
            subtitle="Case study is mandatory if yes"
        />
        <div className="space-y-3">
            {YES_NO_OPTIONS.map((option) => (
                <OptionCard
                    key={option.value}
                    selected={formData.serviceDetails?.[serviceKey]?.hasPreviousProjects === option.value}
                    onClick={() => updateServiceField(serviceKey, "hasPreviousProjects", option.value, 0)}
                    label={option.label}
                />
            ))}
        </div>
    </div>
);

// ============================================================================
// SERVICE CASE FIELD STEP
// ============================================================================

export const ServiceCaseFieldStep = ({
    formData,
    updateServiceCaseField,
    renderServiceMeta,
    serviceKey,
    field,
    queueAdvance,
    hasMultipleChoices,
    hasSingleChoice,
    parseCustomTools,
    normalizeCustomTools,
    techStackOtherDrafts,
    setTechStackOtherDrafts,
    currentStep,
    renderContinueButton,
}) => {
    const caseStudy = formData.serviceDetails?.[serviceKey]?.caseStudy || {};

    if (field.type === "select") {
        const options = Array.isArray(field.options) ? field.options : [];
        const value = caseStudy[field.key] || "";
        return (
            <div className="space-y-6">
                <StepHeader title={field.label} subtitle={renderServiceMeta(serviceKey)} />
                <Select
                    value={value}
                    onValueChange={(next) => {
                        updateServiceCaseField(
                            serviceKey,
                            field.key,
                            next,
                            next === "Other" ? null : 0
                        );
                        if (field.key === "industry" && next !== "Other" && caseStudy.industryOther) {
                            updateServiceCaseField(serviceKey, "industryOther", "");
                        }
                    }}
                >
                    <SelectTrigger className="w-full bg-white/5 border-white/10 text-white p-6 rounded-xl">
                        <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-white/10 text-white max-h-[300px]">
                        {options.map((option) => (
                            <SelectItem key={option.value || option} value={option.value || option} className="focus:bg-white/10 focus:text-white cursor-pointer">
                                {option.label || option}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {field.key === "industry" && value === "Other" && (
                    <div className="space-y-2">
                        <Label className="text-white/70 text-xs">Other industry</Label>
                        <Input
                            value={caseStudy.industryOther || ""}
                            onChange={(e) => updateServiceCaseField(serviceKey, "industryOther", e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && caseStudy.industryOther?.trim()) {
                                    e.preventDefault();
                                    queueAdvance(0);
                                }
                            }}
                            placeholder="Type the industry"
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                        />
                    </div>
                )}
                {renderContinueButton(currentStep, {
                    show: hasMultipleChoices(options) && field.key === "industry" && value === "Other",
                })}
            </div>
        );
    }

    if (field.type === "multiselect") {
        const selections = Array.isArray(caseStudy[field.key]) ? caseStudy[field.key] : [];
        const options =
            field.key === "techStack"
                ? getTechStackOptions(serviceKey)
                : field.options || [];
        const showContinue = hasMultipleChoices(options);
        const customTools = field.key === "techStack" ? parseCustomTools(caseStudy.techStackOther) : [];
        const draftOtherTools = techStackOtherDrafts[serviceKey] || "";

        const toggleValue = (option) => {
            const exists = selections.includes(option);
            const nextValues = exists
                ? selections.filter((item) => item !== option)
                : [...selections, option];
            updateServiceCaseField(serviceKey, field.key, nextValues);
            if (field.key === "techStack" && !nextValues.includes("Other")) {
                if (caseStudy.techStackOther) {
                    updateServiceCaseField(serviceKey, "techStackOther", "");
                }
                setTechStackOtherDrafts((prev) => {
                    if (!prev[serviceKey]) return prev;
                    const nextDrafts = { ...prev };
                    delete nextDrafts[serviceKey];
                    return nextDrafts;
                });
            }
            if (hasSingleChoice(options) && !exists && nextValues.length > 0) {
                queueAdvance(0);
            }
        };

        const addCustomTools = () => {
            const parsedInput = parseCustomTools(draftOtherTools);
            if (!parsedInput.length) return;
            const nextTools = normalizeCustomTools([...customTools, ...parsedInput]);
            updateServiceCaseField(serviceKey, "techStackOther", nextTools.join(", "));
            setTechStackOtherDrafts((prev) => ({ ...prev, [serviceKey]: "" }));
        };

        const removeCustomTool = (toolToRemove) => {
            const nextTools = customTools.filter((tool) => tool.toLowerCase() !== toolToRemove.toLowerCase());
            updateServiceCaseField(serviceKey, "techStackOther", nextTools.join(", "));
        };

        return (
            <div className="space-y-6">
                <StepHeader title={field.label} subtitle={renderServiceMeta(serviceKey)} />
                <div className="grid grid-cols-2 gap-3">
                    {options.map((option) => (
                        <OptionCard
                            key={option.value || option}
                            compact
                            selected={selections.includes(option.value || option)}
                            onClick={() => toggleValue(option.value || option)}
                            label={option.label || option}
                            className="justify-center"
                        />
                    ))}
                </div>
                {field.min && (
                    <p className="text-xs text-white/50 text-center">
                        {field.key === "techStack" ? `Select at least ${field.min} tools.` : `Select at least ${field.min} options.`}
                    </p>
                )}

                {field.key === "techStack" && selections.includes("Other") && (
                    <div className="space-y-3">
                        <Label className="text-white/70 text-xs">Other tools</Label>
                        <div className="flex gap-2">
                            <Input
                                value={draftOtherTools}
                                onChange={(e) => setTechStackOtherDrafts((prev) => ({ ...prev, [serviceKey]: e.target.value }))}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        addCustomTools();
                                    }
                                }}
                                placeholder="Type tools, e.g. Next.js, Tailwind, Prisma"
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                            />
                            <button
                                type="button"
                                onClick={addCustomTools}
                                disabled={!draftOtherTools.trim()}
                                className={cn(
                                    "px-4 py-2 rounded-xl font-semibold transition-all",
                                    draftOtherTools.trim()
                                        ? "bg-white/10 text-white hover:bg-white/20"
                                        : "bg-white/5 text-white/40 cursor-not-allowed"
                                )}
                            >
                                Add
                            </button>
                        </div>

                        {customTools.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {customTools.map((tool) => (
                                    <span
                                        key={tool}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 bg-white/5 text-xs text-white/90"
                                    >
                                        {tool}
                                        <button
                                            type="button"
                                            onClick={() => removeCustomTool(tool)}
                                            className="text-white/60 hover:text-white transition-colors"
                                            aria-label={`Remove ${tool}`}
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        <p className="text-xs text-white/45">Press Enter or click Add to include each tool.</p>
                    </div>
                )}

                {renderContinueButton(currentStep, { show: showContinue })}
            </div>
        );
    }

    const value = caseStudy[field.key] || "";
    const isTextarea = field.type === "textarea";

    return (
        <div className="space-y-6">
            <StepHeader title={field.label} subtitle={renderServiceMeta(serviceKey)} />
            {isTextarea ? (
                <Textarea
                    value={value}
                    onChange={(e) => updateServiceCaseField(serviceKey, field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[140px] rounded-xl p-4"
                />
            ) : (
                <Input
                    value={value}
                    onChange={(e) => updateServiceCaseField(serviceKey, field.key, e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && value.trim()) {
                            e.preventDefault();
                            queueAdvance(0);
                        }
                    }}
                    placeholder={field.placeholder}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
            )}
            {renderContinueButton()}
        </div>
    );
};

// ============================================================================
// SERVICE SAMPLE WORK STEP
// ============================================================================

export const ServiceSampleWorkStep = ({ formData, updateServiceField, renderServiceMeta, serviceKey }) => (
    <div className="space-y-4">
        <StepHeader
            title="Do You Have Sample Or Practice Work To Showcase?"
            subtitle={renderServiceMeta(serviceKey)}
        />
        <div className="space-y-3">
            {YES_NO_OPTIONS.map((option) => (
                <OptionCard
                    key={option.value}
                    selected={formData.serviceDetails?.[serviceKey]?.hasSampleWork === option.value}
                    onClick={() => updateServiceField(serviceKey, "hasSampleWork", option.value, 0)}
                    label={option.label}
                />
            ))}
        </div>
        {formData.serviceDetails?.[serviceKey]?.hasSampleWork === "no" && (
            <div className="mt-4 p-4 rounded-xl border border-white/10 bg-white/5">
                <p className="text-xs text-white/60 text-center">
                    If no sample work is provided, your profile remains visible only for entry-level, low-budget, and trial projects.
                </p>
            </div>
        )}
    </div>
);

// ============================================================================
// SERVICE SAMPLE UPLOAD STEP
// ============================================================================

export const ServiceSampleUploadStep = ({ formData, updateServiceField, renderServiceMeta, serviceKey, renderContinueButton }) => {
    const sample = formData.serviceDetails?.[serviceKey]?.sampleWork;
    return (
        <div className="space-y-6">
            <StepHeader title="Upload Your Sample Or Practice Work" subtitle={renderServiceMeta(serviceKey)} />
            <div className="space-y-3">
                <input
                    type="file"
                    className="hidden"
                    id={`sample-upload-${serviceKey}`}
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            updateServiceField(serviceKey, "sampleWork", { name: file.name, url: URL.createObjectURL(file) }, 0);
                        }
                    }}
                />
                <label
                    htmlFor={`sample-upload-${serviceKey}`}
                    className="flex items-center gap-3 px-4 py-4 rounded-xl border border-dashed border-white/20 hover:border-primary/50 hover:bg-white/5 cursor-pointer transition-all"
                >
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <Upload className="w-5 h-5 text-white/70" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <span className="block text-sm text-white/80 truncate">
                            {sample?.name || "Upload file (PDF, image, or doc)"}
                        </span>
                    </div>
                    {sample && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                updateServiceField(serviceKey, "sampleWork", null);
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
// SERVICE AVERAGE PRICE STEP
// ============================================================================

// ============================================================================
// SERVICE AVERAGE PRICE STEP
// ============================================================================

export const ServiceAveragePriceStep = ({
    formData,
    updateServiceField,
    renderServiceMeta,
    serviceKey,
    queueAdvance,
    renderContinueButton,
    currentStep,
}) => {
    const detail = formData.serviceDetails?.[serviceKey];
    const value = detail?.averageProjectPrice || "";

    return (
        <div className="space-y-6">
            <StepHeader
                title={`What Is Your Average Project Price Range For ${getServiceLabel(serviceKey)}?`}
                subtitle={renderServiceMeta(serviceKey)}
            />
            <Select
                value={value}
                onValueChange={(next) => {
                    updateServiceField(serviceKey, "averageProjectPrice", next, 0);
                    queueAdvance(0);
                }}
            >
                <SelectTrigger className="w-full bg-white/5 border-white/10 text-white p-6 rounded-xl">
                    <SelectValue placeholder="Select a price range" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-white/10 text-white max-h-[300px]">
                    {AVERAGE_PROJECT_PRICE_OPTIONS.map((option) => (
                        <SelectItem
                            key={option.value}
                            value={option.value}
                            className="focus:bg-white/10 focus:text-white cursor-pointer"
                        >
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {renderContinueButton(currentStep, { show: !!value })}
        </div>
    );
};

// ============================================================================
// SERVICE GROUP STEP
// ============================================================================

export const ServiceGroupStep = ({
    formData,
    updateServiceField,
    renderServiceMeta,
    serviceKey,
    groupId,
    queueAdvance,
    hasMultipleChoices,
    hasSingleChoice,
    parseCustomTools,
    normalizeCustomTools,
    groupOtherDrafts,
    setGroupOtherDrafts,
    currentStep,
    renderContinueButton,
}) => {
    const serviceGroups = getServiceGroups(serviceKey);
    const group = serviceGroups.find((entry) => entry.id === groupId);
    const isFirstGroup = serviceGroups[0]?.id === groupId;
    const details = formData.serviceDetails?.[serviceKey] || createServiceDetail();
    const existingGroups = details.groups || {};
    const selections = Array.isArray(existingGroups[groupId]) ? existingGroups[groupId] : [];
    const minSelections = group?.min || 1;
    const optionEntries = Array.isArray(group?.options)
        ? group.options
            .map((option) => {
                if (typeof option === "string") {
                    return { value: option, label: option };
                }
                if (!option || typeof option !== "object") return null;
                const value = String(option.value ?? option.label ?? "").trim();
                const label = String(option.label ?? option.value ?? "").trim();
                if (!value) return null;
                return { value, label: label || value };
            })
            .filter(Boolean)
        : [];
    const optionValues = optionEntries.map((option) => option.value);
    const otherOptionValue = optionValues.find((value) => value.toLowerCase() === "other") || null;
    const otherSelected = Boolean(otherOptionValue && selections.includes(otherOptionValue));
    const groupOtherKey = `${serviceKey}:${groupId}`;
    const groupOtherDraft = groupOtherDrafts[groupOtherKey] || "";
    const customGroupValues = otherSelected
        ? normalizeCustomTools(parseCustomTools(details?.groupOther?.[groupId] || ""))
        : [];
    const showContinue = hasMultipleChoices(optionEntries);

    if (!group) return null;

    const updateGroupOtherValues = (nextValues) => {
        const normalizedValues = normalizeCustomTools(nextValues);
        const nextGroupOther = { ...(details.groupOther || {}) };
        if (normalizedValues.length > 0) {
            nextGroupOther[groupId] = normalizedValues.join(", ");
        } else {
            delete nextGroupOther[groupId];
        }
        updateServiceField(serviceKey, "groupOther", nextGroupOther);
    };

    const toggleValue = (option) => {
        const exists = selections.includes(option);
        const nextValues = exists
            ? selections.filter((item) => item !== option)
            : [...selections, option];
        updateServiceField(serviceKey, "groups", {
            ...existingGroups,
            [groupId]: nextValues,
        });

        if (otherOptionValue && option === otherOptionValue && exists) {
            if ((details.groupOther || {})[groupId]) {
                const nextGroupOther = { ...(details.groupOther || {}) };
                delete nextGroupOther[groupId];
                updateServiceField(serviceKey, "groupOther", nextGroupOther);
            }
            setGroupOtherDrafts((prev) => {
                if (!prev[groupOtherKey]) return prev;
                const nextDrafts = { ...prev };
                delete nextDrafts[groupOtherKey];
                return nextDrafts;
            });
        }

        if (hasSingleChoice(optionEntries) && nextValues.length >= minSelections) {
            const onlyOption = optionEntries[0]?.value;
            if (onlyOption !== otherOptionValue) {
                queueAdvance(0);
                return;
            }

            const existingCustomValues = normalizeCustomTools(parseCustomTools(details?.groupOther?.[groupId] || ""));
            if (existingCustomValues.length > 0) {
                queueAdvance(0);
            }
        }
    };

    const addCustomGroupValues = () => {
        const parsedInput = parseCustomTools(groupOtherDraft);
        if (!parsedInput.length) return;
        const nextCustomValues = normalizeCustomTools([...customGroupValues, ...parsedInput]);
        updateGroupOtherValues(nextCustomValues);
        setGroupOtherDrafts((prev) => ({ ...prev, [groupOtherKey]: "" }));
    };

    const removeCustomGroupValue = (valueToRemove) => {
        const nextCustomValues = customGroupValues.filter(
            (item) => item.toLowerCase() !== valueToRemove.toLowerCase()
        );
        updateGroupOtherValues(nextCustomValues);
    };

    return (
        <div className="space-y-6">
            <StepHeader
                title={isFirstGroup ? `Which Areas Of ${getServiceLabel(serviceKey)} Do You Specialize In?` : group.label}
                subtitle={renderServiceMeta(serviceKey)}
            />
            <div className="grid grid-cols-2 gap-3">
                {optionEntries.map((option) => (
                    <OptionCard
                        key={option.value}
                        compact
                        selected={selections.includes(option.value)}
                        onClick={() => toggleValue(option.value)}
                        label={option.label}
                        className="justify-center"
                    />
                ))}
            </div>
            {minSelections > 1 && (
                <p className="text-xs text-white/50 text-center">
                    Select at least {minSelections} options.
                </p>
            )}

            {otherSelected && (
                <div className="space-y-3">
                    <Label className="text-white/70 text-xs">Other options</Label>
                    <div className="flex gap-2">
                        <Input
                            value={groupOtherDraft}
                            onChange={(e) => setGroupOtherDrafts((prev) => ({ ...prev, [groupOtherKey]: e.target.value }))}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    addCustomGroupValues();
                                }
                            }}
                            placeholder="Type options, e.g. Strapi, Supabase, Firebase"
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                        />
                        <button
                            type="button"
                            onClick={addCustomGroupValues}
                            disabled={!groupOtherDraft.trim()}
                            className={cn(
                                "px-4 py-2 rounded-xl font-semibold transition-all",
                                groupOtherDraft.trim()
                                    ? "bg-white/10 text-white hover:bg-white/20"
                                    : "bg-white/5 text-white/40 cursor-not-allowed"
                            )}
                        >
                            Add
                        </button>
                    </div>

                    {customGroupValues.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {customGroupValues.map((item) => (
                                <span
                                    key={item}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 bg-white/5 text-xs text-white/90"
                                >
                                    {item}
                                    <button
                                        type="button"
                                        onClick={() => removeCustomGroupValue(item)}
                                        className="text-white/60 hover:text-white transition-colors"
                                        aria-label={`Remove ${item}`}
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    <p className="text-xs text-white/45">Press Enter or click Add to include each option.</p>
                </div>
            )}
            {renderContinueButton(currentStep, { show: showContinue })}
        </div>
    );
};

// ============================================================================
// SERVICE INDUSTRY FOCUS STEP
// ============================================================================

// ============================================================================
// GLOBAL NICHE STEP
// ============================================================================

export const GlobalNicheStep = ({
    formData,
    updateFormField,
    renderContinueButton,
    currentStep,
    hasMultipleChoices,
    hasSingleChoice,
    queueAdvance,
}) => {
    const selections = Array.isArray(formData.globalIndustryFocus) ? formData.globalIndustryFocus : [];
    const otherValue = formData.globalIndustryOther || "";
    const showContinue = hasMultipleChoices(INDUSTRY_NICHE_OPTIONS);

    const toggleNiche = (option) => {
        const exists = selections.includes(option);
        const nextValues = exists
            ? selections.filter((item) => item !== option)
            : [...selections, option];

        updateFormField("globalIndustryFocus", nextValues, null);

        if (!nextValues.includes("Other") && otherValue) {
            updateFormField("globalIndustryOther", "");
        }
    };

    return (
        <div className="space-y-6">
            <StepHeader
                title="Which Industries Or Niches Do You Work In?"
                subtitle="Select all that apply"
            />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-3">
                {INDUSTRY_NICHE_OPTIONS.map((option) => (
                    <OptionCard
                        key={option}
                        compact
                        selected={selections.includes(option)}
                        onClick={() => toggleNiche(option)}
                        label={option}
                        className={cn("justify-center", option === "Other" && "col-span-2 md:col-span-3 lg:col-span-5 xl:col-span-5")}
                    />
                ))}
            </div>

            {selections.includes("Other") && (
                <div className="space-y-2">
                    <Label className="text-white/70 text-xs">Other niche</Label>
                    <Input
                        value={otherValue}
                        onChange={(e) => updateFormField("globalIndustryOther", e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && otherValue.trim()) {
                                e.preventDefault();
                                queueAdvance(0);
                            }
                        }}
                        placeholder="Type your niche"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    />
                </div>
            )}

            {renderContinueButton(currentStep, {
                show: selections.length > 0 &&
                    (!selections.includes("Other") || otherValue.trim().length > 0)
            })}
        </div>
    );
};

// ============================================================================
// SERVICE INDUSTRY FOCUS STEP
// ============================================================================

export const ServiceIndustryFocusStep = ({ formData, updateServiceField, renderServiceMeta, serviceKey }) => (
    <div className="space-y-4">
        <StepHeader
            title="For Upcoming Projects, Would You Like To Continue With The Same Niche?"
            subtitle={renderServiceMeta(serviceKey)}
        />
        <div className="space-y-3">
            {UPCOMING_NICHE_OPTIONS.map((option) => (
                <OptionCard
                    key={option.value}
                    selected={formData.serviceDetails?.[serviceKey]?.industryFocus === option.value}
                    onClick={() => updateServiceField(serviceKey, "industryFocus", option.value, 0)}
                    label={option.label}
                />
            ))}
        </div>
    </div>
);

// ============================================================================
// SERVICE NICHES STEP
// ============================================================================

export const ServiceNichesStep = ({
    formData,
    updateServiceField,
    renderServiceMeta,
    serviceKey,
    queueAdvance,
    hasMultipleChoices,
    hasSingleChoice,
    currentStep,
    renderContinueButton,
}) => {
    const values = formData.serviceDetails?.[serviceKey]?.niches || [];
    const otherValue = formData.serviceDetails?.[serviceKey]?.otherNiche || "";
    const showContinue = hasMultipleChoices(INDUSTRY_NICHE_OPTIONS);
    const handleNicheToggle = (option) => {
        const details = formData.serviceDetails?.[serviceKey] || createServiceDetail();
        const current = Array.isArray(details.niches) ? details.niches : [];
        const exists = current.includes(option);
        const nextValues = exists ? current.filter((item) => item !== option) : [...current, option];
        updateServiceField(serviceKey, "niches", nextValues, null);
        if (!nextValues.includes("Other") && details.otherNiche) {
            updateServiceField(serviceKey, "otherNiche", "");
        }
        if (hasSingleChoice(INDUSTRY_NICHE_OPTIONS) && !exists && nextValues.length > 0) {
            queueAdvance(0);
        }
    };

    return (
        <div className="space-y-6">
            <StepHeader
                title="Select Industries You Specialize In"
                subtitle={renderServiceMeta(serviceKey)}
            />
            <div className="grid grid-cols-2 gap-3">
                {INDUSTRY_NICHE_OPTIONS.map((option) => (
                    <OptionCard
                        key={option}
                        compact
                        selected={values.includes(option)}
                        onClick={() => handleNicheToggle(option)}
                        label={option}
                        className="justify-center"
                    />
                ))}
            </div>

            {values.includes("Other") && (
                <div className="space-y-2">
                    <Label className="text-white/70 text-xs">Other niche</Label>
                    <Input
                        value={otherValue}
                        onChange={(e) => updateServiceField(serviceKey, "otherNiche", e.target.value)}
                        placeholder="Type your niche"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    />
                </div>
            )}

            {renderContinueButton(currentStep, { show: showContinue })}
        </div>
    );
};

// ============================================================================
// SERVICE INDUSTRY ONLY STEP
// ============================================================================

export const ServiceIndustryOnlyStep = ({ formData, updateServiceField, renderServiceMeta, serviceKey }) => (
    <div className="space-y-4">
        <StepHeader
            title="Do You Prefer Working Only In These Industries?"
            subtitle={renderServiceMeta(serviceKey)}
        />
        <div className="space-y-3">
            {YES_NO_OPTIONS.map((option) => (
                <OptionCard
                    key={option.value}
                    selected={formData.serviceDetails?.[serviceKey]?.preferOnlyIndustries === option.value}
                    onClick={() => updateServiceField(serviceKey, "preferOnlyIndustries", option.value, 0)}
                    label={option.label}
                />
            ))}
        </div>
    </div>
);

// ============================================================================
// SERVICE COMPLEXITY STEP
// ============================================================================

export const ServiceComplexityStep = ({ formData, updateServiceField, renderServiceMeta, serviceKey }) => (
    <div className="space-y-4">
        <StepHeader
            title="What Level Of Project Complexity Are You Comfortable Handling?"
            subtitle={renderServiceMeta(serviceKey)}
        />
        <div className="space-y-3">
            {PROJECT_COMPLEXITY_OPTIONS.map((option) => (
                <OptionCard
                    key={option.value}
                    selected={formData.serviceDetails?.[serviceKey]?.projectComplexity === option.value}
                    onClick={() => updateServiceField(serviceKey, "projectComplexity", option.value, 0)}
                    label={option.label}
                />
            ))}
        </div>
    </div>
);

// ============================================================================
// SERVICE PROJECT DETAILS STEP
// ============================================================================

export const ServiceProjectDetailsStep = ({
    formData,
    updateServiceField,
    renderServiceMeta,
    serviceKey,
    renderContinueButton,
    currentStep,
}) => {
    const projects = formData.serviceDetails?.[serviceKey]?.projects;
    // Initialize with one empty project if undefined or empty
    React.useEffect(() => {
        if (!projects || projects.length === 0) {
            updateServiceField(serviceKey, "projects", [{}]);
        }
    }, [projects, serviceKey]);

    const projectList = projects || [{}];

    const updateProject = (index, field, value) => {
        const newProjects = [...projectList];
        newProjects[index] = { ...newProjects[index], [field]: value };
        updateServiceField(serviceKey, "projects", newProjects);
    };

    const addProject = () => {
        updateServiceField(serviceKey, "projects", [...projectList, {}]);
    };

    const removeProject = (index) => {
        if (projectList.length <= 1) return; // Prevent deleting the last one? Or allow and show empty state?
        const newProjects = projectList.filter((_, i) => i !== index);
        updateServiceField(serviceKey, "projects", newProjects);
    };

    const isValid = projectList.every(p =>
        p.title?.trim() &&
        p.description?.trim() &&
        p.role &&
        p.timeline &&
        p.techStack?.length > 0 &&
        p.budget
    );

    return (
        <div className="space-y-8">
            <StepHeader
                title="Tell Us About Your Best Projects"
                subtitle={renderServiceMeta(serviceKey)}
            />

            <div className="space-y-8">
                {projectList.map((project, index) => (
                    <div key={index} className="space-y-5 p-5 rounded-xl bg-white/5 border border-white/10 relative">
                        {projectList.length > 1 && (
                            <button
                                onClick={() => removeProject(index)}
                                className="absolute top-4 right-4 text-white/40 hover:text-red-400 transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}

                        <h3 className="text-lg font-medium text-white">Project {index + 1}</h3>

                        {/* Project Title */}
                        <div className="space-y-1.5">
                            <Label className="text-white/70 text-[11px]">Project Title</Label>
                            <Input
                                value={project.title || ""}
                                onChange={(e) => updateProject(index, "title", e.target.value)}
                                placeholder="e.g. E-commerce Platform Redesign"
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <Label className="text-white/70 text-[11px]">Project Description</Label>
                            <Textarea
                                value={project.description || ""}
                                onChange={(e) => updateProject(index, "description", e.target.value)}
                                placeholder="Briefly describe the project and its goals..."
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[100px]"
                            />
                        </div>

                        {/* Role & Timeline Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-white/70 text-[11px]">Your Role</Label>
                                <Select
                                    value={project.role || ""}
                                    onValueChange={(value) => updateProject(index, "role", value)}
                                >
                                    <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
                                        {ROLE_IN_PROJECT_OPTIONS.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value} className="focus:bg-white/10 focus:text-white cursor-pointer">
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-white/70 text-[11px]">Timeline</Label>
                                <Select
                                    value={project.timeline || ""}
                                    onValueChange={(value) => updateProject(index, "timeline", value)}
                                >
                                    <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                                        <SelectValue placeholder="Select duration" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
                                        {PROJECT_TIMELINE_OPTIONS.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value} className="focus:bg-white/10 focus:text-white cursor-pointer">
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Tech Stack */}
                        <div className="space-y-1.5">
                            <Label className="text-white/70 text-[11px]">Tech Stack / Tools</Label>
                            <TechStackSelect
                                value={project.techStack || []}
                                onChange={(val) => updateProject(index, "techStack", val)}
                            />
                        </div>

                        {/* Budget */}
                        <div className="space-y-1.5">
                            <Label className="text-white/70 text-[11px]">Budget</Label>
                            <Select
                                value={project.budget || ""}
                                onValueChange={(value) => updateProject(index, "budget", value)}
                            >
                                <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                                    <SelectValue placeholder="Select budget range" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
                                    {BUDGET_RANGE_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value} className="focus:bg-white/10 focus:text-white cursor-pointer">
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={addProject}
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
            >
                <Plus className="w-4 h-4" />
                Add Another Project
            </button>

            {renderContinueButton(currentStep, { show: isValid })}
        </div>
    );
};

// Helper component for Tech Stack Multi-select
const TechStackSelect = ({ value, onChange }) => {
    const [open, setOpen] = React.useState(false);

    const handleSelect = (optionValue) => {
        const next = value.includes(optionValue)
            ? value.filter((v) => v !== optionValue)
            : [...value, optionValue];
        onChange(next);
    };

    return (
        <div className="space-y-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between flex items-center h-10 px-3 rounded-md bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                    >
                        <span className="text-sm text-white/70">
                            {value.length > 0 ? `${value.length} selected` : "Select technologies..."}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 bg-[#1A1A1A] border-white/10 text-white" align="start">
                    <Command className="bg-transparent">
                        <CommandInput placeholder="Search tech stack..." className="h-9 text-white placeholder:text-white/30" />
                        <CommandEmpty>No framework found.</CommandEmpty>
                        <CommandList>
                            <CommandGroup className="max-h-[200px] overflow-y-auto">
                                {DEFAULT_TECH_STACK_OPTIONS.map((tech) => (
                                    <CommandItem
                                        key={tech}
                                        value={tech}
                                        onSelect={() => handleSelect(tech)}
                                        className="text-white hover:bg-white/10 aria-selected:bg-white/10 cursor-pointer"
                                    >
                                        <div className={cn(
                                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                            value.includes(tech) ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                                        )}>
                                            <Check className={cn("h-4 w-4")} />
                                        </div>
                                        {tech}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {value.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {value.map((tech) => (
                        <div key={tech} className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded text-xs text-white">
                            {tech}
                            <button onClick={() => handleSelect(tech)} className="hover:text-red-400 ml-1">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
