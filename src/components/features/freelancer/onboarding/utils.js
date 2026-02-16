import {
    SERVICE_OPTIONS,
    SERVICE_GROUPS,
    DEFAULT_TECH_STACK_OPTIONS,
    PRICE_RANGE_MIN,
    PRICE_RANGE_MAX,
} from "./constants";

// ============================================================================
// SERVICE DETAIL FACTORY
// ============================================================================

export const createServiceDetail = () => ({
    experienceYears: "",
    workingLevel: "",
    hasPreviousProjects: "",
    caseStudy: {
        projectTitle: "",
        industry: "",
        industryOther: "",
        goal: "",
        role: "",
        techStack: [],
        techStackOther: "",
        timeline: "",
        budgetRange: "",
        results: "",
    },
    hasSampleWork: "",
    sampleWork: null,
    averagePrice: "",
    averageProjectPrice: "", // Added for dropdown selection
    groups: {},
    groupOther: {},
    industryFocus: "",
    niches: [],
    otherNiche: "",
    preferOnlyIndustries: "",
    projectComplexity: "",
});

// ============================================================================
// SERVICE HELPERS
// ============================================================================

export const getServiceLabel = (serviceKey) => {
    const match = SERVICE_OPTIONS.find((option) => option.value === serviceKey);
    return match ? match.label : serviceKey;
};

const REMOVED_SERVICE_GROUP_QUESTIONS = new Set([
    "which services do you provide?",
]);

export const shouldIncludeServiceGroup = (group) => {
    const normalizedLabel = String(group?.label || "").trim().toLowerCase();
    return !REMOVED_SERVICE_GROUP_QUESTIONS.has(normalizedLabel);
};

export const isOtherServiceGroupOption = (option) => {
    if (typeof option === "string") {
        return option.trim().toLowerCase() === "other";
    }
    if (!option || typeof option !== "object") return false;
    const valueOrLabel = option.value ?? option.label ?? "";
    return String(valueOrLabel).trim().toLowerCase() === "other";
};

export const appendOtherServiceGroupOption = (options = []) => {
    if (!Array.isArray(options)) return [];
    if (options.some(isOtherServiceGroupOption)) return options;
    const hasObjectOptions = options.some((option) => option && typeof option === "object");
    return [...options, hasObjectOptions ? { value: "Other", label: "Other" } : "Other"];
};

export const shouldAddOtherToServiceGroup = () => true;

export const normalizeServiceGroup = (group) => {
    if (!group || !shouldAddOtherToServiceGroup(group)) return group;
    return {
        ...group,
        options: appendOtherServiceGroupOption(group.options),
    };
};

export const getServiceGroups = (serviceKey) =>
    (SERVICE_GROUPS[serviceKey] || [])
        .filter(shouldIncludeServiceGroup)
        .map(normalizeServiceGroup);

export const getTechStackOptions = (serviceKey) => {
    const groups = getServiceGroups(serviceKey);
    const toolGroups = groups.filter((group) => /tech_stack|tools|platforms/i.test(group.id));
    const baseOptions = toolGroups.length ? toolGroups.flatMap((group) => group.options) : [];
    const options = baseOptions.length ? baseOptions : DEFAULT_TECH_STACK_OPTIONS;
    const unique = Array.from(new Set(options));
    return unique.includes("Other") ? unique : [...unique, "Other"];
};

// ============================================================================
// PRICE HELPERS
// ============================================================================

export const parsePriceValue = (value) => {
    const digits = String(value ?? "")
        .replace(/[^\d]/g, "")
        .trim();
    if (!digits) return NaN;
    const parsed = Number(digits);
    return Number.isFinite(parsed) ? parsed : NaN;
};

export const clampPriceValue = (value) => Math.min(PRICE_RANGE_MAX, Math.max(PRICE_RANGE_MIN, value));

export const formatPriceLabel = (value) => Number(value).toLocaleString("en-IN");

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export const isValidUrl = (value = "") => {
    const trimmed = value.trim();
    if (!trimmed) return false;
    try {
        new URL(trimmed);
        return true;
    } catch {
        return false;
    }
};

export const isValidUsername = (value = "") =>
    /^[a-zA-Z0-9_]{3,20}$/.test(value.trim());

export const toQuestionTitle = (value = "") =>
    value
        .split(" ")
        .map((word) => {
            if (!word) return word;
            const letters = word.replace(/[^A-Za-z]/g, "");
            if (letters.length > 1 && letters.toUpperCase() === letters) return word;
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(" ");

export const parseCustomTools = (value = "") =>
    String(value)
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean);

export const normalizeCustomTools = (items = []) => {
    const seen = new Set();
    const next = [];

    items.forEach((item) => {
        const trimmed = String(item || "").trim();
        if (!trimmed) return;
        const key = trimmed.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        next.push(trimmed);
    });

    return next;
};
