import {
    SERVICE_OPTIONS,
    SERVICE_GROUPS,
    DEFAULT_TECH_STACK_OPTIONS,
    DAILY_TECH_OPTIONS_BY_SERVICE,
    PRICE_RANGE_MIN,
    PRICE_RANGE_MAX,
} from "./constants";

// ============================================================================
// SERVICE DETAIL FACTORY
// ============================================================================

export const createServiceDetail = () => ({
    experienceYears: "",
    workingLevel: "",
    serviceDescription: "",
    coverImage: "",
    platformLinks: {},
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

const normalizeServiceKey = (value = "") =>
    String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

const SERVICE_KEY_ALIASES = {
    website_uiux: "web_development",
    website_ui_ux: "web_development",
    website_ui_ux_design_2d_3d: "web_development",
    website_ui_ux_design: "web_development",
    "web-development": "web_development",
};

export const getServiceLabel = (serviceKey) => {
    const canonicalKey = SERVICE_KEY_ALIASES[normalizeServiceKey(serviceKey)] || normalizeServiceKey(serviceKey);
    const match = SERVICE_OPTIONS.find(
        (option) => normalizeServiceKey(option.value) === canonicalKey,
    );

    if (match?.label) return match.label;
    if (canonicalKey === "web_development") {
        return "Web Development";
    }

    return String(serviceKey || "").trim();
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

export const shouldAddOtherToServiceGroup = (group) => {
    if (!group || !Array.isArray(group.options)) return false;
    if (group.options.some(isOtherServiceGroupOption)) return false;
    const nonOtherOptionsCount = group.options.filter(
        (option) => !isOtherServiceGroupOption(option),
    ).length;
    return nonOtherOptionsCount % 2 !== 0;
};

export const normalizeServiceGroup = (group) => {
    if (!group || !shouldAddOtherToServiceGroup(group)) return group;
    return {
        ...group,
        options: appendOtherServiceGroupOption(group.options),
    };
};

const TECH_OR_PLATFORM_GROUP_ID_PATTERN = /tech_stack|tools|platforms/i;
const TECH_OR_PLATFORM_GROUP_LABEL_PATTERN = /\b(technolog(?:y|ies)|tools?|platforms?)\b/i;

const isTechOrPlatformGroup = (group) => {
    const groupId = String(group?.id || "");
    const groupLabel = String(group?.label || "");
    return (
        TECH_OR_PLATFORM_GROUP_ID_PATTERN.test(groupId) ||
        TECH_OR_PLATFORM_GROUP_LABEL_PATTERN.test(groupLabel)
    );
};

const toNormalizedOptionValue = (option) => {
    if (typeof option === "string") return option.trim().toLowerCase();
    if (!option || typeof option !== "object") return "";
    const value = option.value ?? option.label ?? "";
    return String(value).trim().toLowerCase();
};

const appendUniqueOptions = (options = [], extraOptions = []) => {
    if (!Array.isArray(options)) return options;
    const hasObjectOptions = options.some((option) => option && typeof option === "object");
    const existingValues = new Set(
        options
            .map(toNormalizedOptionValue)
            .filter(Boolean),
    );

    const nextOptions = [...options];
    extraOptions.forEach((option) => {
        const normalizedOption = String(option || "").trim();
        if (!normalizedOption) return;
        const key = normalizedOption.toLowerCase();
        if (existingValues.has(key)) return;
        existingValues.add(key);
        nextOptions.push(
            hasObjectOptions
                ? { value: normalizedOption, label: normalizedOption }
                : normalizedOption,
        );
    });

    return nextOptions;
};

const TECH_PARITY_FALLBACKS_BY_SERVICE = {
    web_development: ["Framer Motion", "Nuxt.js", "SvelteKit"],
    software_development: ["RabbitMQ", "Elasticsearch", "Kafka"],
    app_development: ["React Query", "Realm", "SQLite"],
    creative_design: ["Adobe Lightroom", "Procreate", "LottieFiles"],
    social_media_marketing: ["Metricool", "Later", "Sprout Social"],
    seo: ["Looker Studio", "Bing Webmaster Tools", "AnswerThePublic"],
    lead_generation: ["Phantombuster", "Outreach.io", "Mailshake"],
    voice_agent: ["LiveKit", "WebRTC", "Speechmatics"],
    branding: ["Adobe InDesign", "Affinity Designer", "FigJam"],
    paid_advertising: ["Google Optimize", "Crazy Egg", "Triple Whale"],
    video_services: ["Motion Array", "Envato Elements", "Runway"],
    customer_support: ["Kustomer", "Front", "Olark"],
    ugc_marketing: ["VN Editor", "TikTok Creative Center", "Canva Pro"],
    influencer_marketing: ["HypeAuditor", "Traackr", "Brandwatch"],
    ai_automation: ["CrewAI", "LlamaIndex", "Supabase Edge Functions"],
    whatsapp_chatbot: ["Interakt", "Kommo", "Pabbly Connect"],
    crm_erp: ["NetSuite", "QuickBooks", "Tableau"],
    "3d_modeling": ["Marmoset Toolbag", "Marvelous Designer", "Substance 3D Sampler"],
    cgi_videos: ["EmberGen", "Blackmagic Fusion", "PFTrack"],
    writing_content: ["Originality.ai", "Frase", "Clearscope"],
};

const GLOBAL_TECH_PARITY_FALLBACKS = [
    "Git/GitHub",
    "Notion",
    "Google Workspace",
    "Custom Integrations",
];

const ensureOddTechNonOtherOptions = (options = [], serviceKey) => {
    if (!Array.isArray(options) || options.length % 2 !== 0) return options;

    const hasObjectOptions = options.some((option) => option && typeof option === "object");
    const existingValues = new Set(
        options
            .map(toNormalizedOptionValue)
            .filter(Boolean),
    );

    const parityCandidates = [
        ...(TECH_PARITY_FALLBACKS_BY_SERVICE[serviceKey] || []),
        ...GLOBAL_TECH_PARITY_FALLBACKS,
    ];

    for (const candidate of parityCandidates) {
        const normalized = String(candidate || "").trim();
        if (!normalized) continue;
        const key = normalized.toLowerCase();
        if (existingValues.has(key)) continue;
        return [
            ...options,
            hasObjectOptions ? { value: normalized, label: normalized } : normalized,
        ];
    }

    const defaultCandidate = "Advanced Tooling";
    return [
        ...options,
        hasObjectOptions
            ? { value: defaultCandidate, label: defaultCandidate }
            : defaultCandidate,
    ];
};

const enrichTechOrPlatformGroupOptions = (group, serviceKey) => {
    if (!group || !Array.isArray(group.options) || !isTechOrPlatformGroup(group)) {
        return group;
    }

    const extraOptions = DAILY_TECH_OPTIONS_BY_SERVICE[serviceKey] || [];
    if (!extraOptions.length) return group;

    const expandedOptions = appendUniqueOptions(group.options, extraOptions);
    const nonOtherOptions = expandedOptions.filter(
        (option) => !isOtherServiceGroupOption(option),
    );
    const otherOption = expandedOptions.find((option) =>
        isOtherServiceGroupOption(option),
    );

    return {
        ...group,
        options: otherOption
            ? [...nonOtherOptions, otherOption]
            : nonOtherOptions,
    };
};

const limitGroupOptionsToFivePlusOther = (group) => {
    if (!group || !Array.isArray(group.options)) return group;

    const nonOtherOptions = group.options.filter(
        (option) => !isOtherServiceGroupOption(option),
    );
    const existingOtherOption = group.options.find((option) =>
        isOtherServiceGroupOption(option),
    );
    const hasObjectOptions = group.options.some(
        (option) => option && typeof option === "object",
    );
    const fallbackOtherOption = hasObjectOptions
        ? { value: "Other", label: "Other" }
        : "Other";

    return {
        ...group,
        options: [
            ...nonOtherOptions.slice(0, 5),
            existingOtherOption || fallbackOtherOption,
        ],
    };
};

const ensureEvenServiceGroupOptions = (group, serviceKey) => {
    if (!group || !Array.isArray(group.options)) return group;
    const hasObjectOptions = group.options.some(
        (option) => option && typeof option === "object",
    );
    const fallbackOtherOption = hasObjectOptions
        ? { value: "Other", label: "Other" }
        : "Other";

    const nonOtherOptions = group.options.filter(
        (option) => !isOtherServiceGroupOption(option),
    );
    const existingOtherOption = group.options.find((option) =>
        isOtherServiceGroupOption(option),
    );

    if (isTechOrPlatformGroup(group)) {
        const nextNonOtherOptions = ensureOddTechNonOtherOptions(
            nonOtherOptions,
            serviceKey,
        );

        return {
            ...group,
            options: [...nextNonOtherOptions, existingOtherOption || fallbackOtherOption],
        };
    }

    const combinedOptions = existingOtherOption
        ? [...nonOtherOptions, existingOtherOption]
        : [...nonOtherOptions];

    if (combinedOptions.length % 2 === 0) {
        return {
            ...group,
            options: combinedOptions,
        };
    }

    if (existingOtherOption) {
        return {
            ...group,
            options: nonOtherOptions,
        };
    }

    return {
        ...group,
        options: [...nonOtherOptions, fallbackOtherOption],
    };
};

export const getServiceGroups = (serviceKey) =>
    (SERVICE_GROUPS[serviceKey] || [])
        .filter(shouldIncludeServiceGroup)
        .map(normalizeServiceGroup)
        .map((group) => enrichTechOrPlatformGroupOptions(group, serviceKey))
        .map((group, index) =>
            index === 0 && !isTechOrPlatformGroup(group)
                ? limitGroupOptionsToFivePlusOther(group)
                : group,
        )
        .map((group) => ensureEvenServiceGroupOptions(group, serviceKey));

export const getTechStackOptions = (serviceKey) => {
    const groups = getServiceGroups(serviceKey);
    const toolGroups = groups.filter((group) => isTechOrPlatformGroup(group));
    const baseOptions = toolGroups.length ? toolGroups.flatMap((group) => group.options) : [];
    const options = baseOptions.length ? baseOptions : DEFAULT_TECH_STACK_OPTIONS;
    const unique = Array.from(new Set(options));
    const nonOtherOptions = unique.filter(
        (option) => String(option).trim().toLowerCase() !== "other",
    );
    const nextNonOtherOptions = ensureOddTechNonOtherOptions(
        nonOtherOptions,
        serviceKey,
    );

    return [...nextNonOtherOptions, "Other"];
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

export const normalizeUsernameInput = (value = "") =>
    String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 20);

export const isValidUsername = (value = "") =>
    /^(?=.*\d)[a-z0-9]{5,20}$/.test(String(value || "").trim());

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
