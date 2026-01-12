/**
 * Conversation State Machine for Chatbot
 * 
 * Deterministic state tracking to prevent:
 * - Context loss
 * - Question repetition
 * - Robotic tone
 */

import { CHATBOTS_BY_SERVICE, getChatbot } from "./chatbots/index.js";
import { getServiceDefinition } from "./service-catalog.js";

export const SERVICE_QUESTIONS_MAP = Object.freeze(
    Object.fromEntries(
        Object.entries(CHATBOTS_BY_SERVICE).map(([service, chatbot]) => [
            service,
            chatbot.questions,
        ])
    )
);

const resolveServiceQuestions = (service = "") => {
    const cataConfig = getCataConfig(service);
    if (cataConfig && Array.isArray(cataConfig.questions)) {
        return {
            questions: cataConfig.questions,
            source: "cata",
            definition: { cata: true, requiredKeys: cataConfig.requiredKeys },
            skipIntro: true,
        };
    }
    const definition = getServiceDefinition(service);
    if (definition && Array.isArray(definition.fields) && definition.fields.length) {
        return {
            questions: definition.fields,
            source: "catalog",
            definition,
            skipIntro: Boolean(definition?.skipIntro),
        };
    }
    const chatbot = getChatbot(service);
    return {
        questions: chatbot?.questions || [],
        source: "chatbot",
        definition: null,
        skipIntro: Boolean(chatbot?.skipIntro),
    };
};

const QUESTION_KEY_TAG_REGEX = /\[QUESTION_KEY:\s*([^\]]+)\]/i;

const normalizeText = (value = "") => (value || "").toString().trim();

const resolveQuestionKey = (question = {}, index = 0) =>
    question.key ||
    question.field ||
    question.name ||
    question.answerKey ||
    question.id ||
    question.questionId ||
    question.question_id ||
    `q${index + 1}`;

const resolveQuestionId = (question = {}, key = "", index = 0) =>
    question.id || question.questionId || question.question_id || key || `q${index + 1}`;

const resolveNextQuestionId = (question = {}) => {
    const next =
        question.nextId ||
        question.nextQuestionId ||
        question.next;
    if (next === null || next === undefined) return null;
    if (typeof next === "string") {
        const trimmed = next.trim();
        return trimmed ? trimmed : null;
    }
    return String(next);
};

const resolveAnswerType = (question = {}) =>
    question.answerType ||
    question.expectedAnswerType ||
    (question.multiSelect ? "multi_select" : null) ||
    (Array.isArray(question.suggestions) && question.suggestions.length
        ? "single_select"
        : "text");

const resolveLocaleTemplates = (question = {}) => {
    const candidate =
        question.templatesByLocale ||
        question.templatesByLanguage ||
        question.templatesByLang ||
        question.textByLocale ||
        question.questionByLocale ||
        question.promptByLocale ||
        question.textsByLocale;

    if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
        return candidate;
    }

    if (question.templates && typeof question.templates === "object" && !Array.isArray(question.templates)) {
        return question.templates;
    }

    return null;
};

const resolveTemplatesForLocale = (question = {}, locale = "en") => {
    const localeMap = resolveLocaleTemplates(question);
    const localeKey = (locale || "en").toString();
    if (localeMap) {
        const candidates = [
            localeKey,
            localeKey.toLowerCase(),
            localeKey.replace("_", "-"),
        ];
        if (localeKey.includes("-")) {
            const base = localeKey.split("-")[0];
            candidates.push(base, base.toLowerCase());
        }
        candidates.push("en", "en-us", "en-gb");

        for (const key of candidates) {
            if (!key) continue;
            const value = localeMap[key];
            if (Array.isArray(value)) return value;
            if (typeof value === "string") return [value];
        }
    }

    if (Array.isArray(question.templates)) return question.templates;
    if (typeof question.templates === "string") return [question.templates];
    if (typeof question.text === "string") return [question.text];
    if (typeof question.baseQuestion === "string") return [question.baseQuestion];
    if (typeof question.question === "string") return [question.question];
    if (typeof question.prompt === "string") return [question.prompt];

    return [];
};

const normalizeQuestions = (questions = []) => {
    const list = Array.isArray(questions) ? questions : [];
    return list.map((question, index) => {
        const key = resolveQuestionKey(question, index);
        const id = resolveQuestionId(question, key, index);
        const nextId = resolveNextQuestionId(question);
        const answerType = resolveAnswerType(question);
        return {
            ...question,
            key,
            id,
            nextId,
            answerType,
        };
    });
};

const orderQuestionsByFlow = (questions = []) => {
    const list = Array.isArray(questions) ? questions : [];
    if (!list.length) return [];

    const map = new Map();
    for (const question of list) {
        if (!map.has(question.id)) {
            map.set(question.id, question);
        }
    }

    const incoming = new Map();
    for (const question of list) {
        const nextId = question.nextId;
        if (!nextId) continue;
        incoming.set(nextId, (incoming.get(nextId) || 0) + 1);
    }

    const startQuestion =
        list.find((q) => q.start === true) ||
        list.find((q) => !incoming.has(q.id)) ||
        list[0];

    const ordered = [];
    const visited = new Set();
    let current = startQuestion;

    while (current && !visited.has(current.id)) {
        ordered.push(current);
        visited.add(current.id);
        current = current.nextId ? map.get(current.nextId) : null;
    }

    for (const question of list) {
        if (!visited.has(question.id)) {
            ordered.push(question);
        }
    }

    return ordered;
};

const escapeRegExp = (value = "") =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const canonicalize = (value = "") =>
    normalizeText(value)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

const canonicalizeForI18n = (value = "") =>
    normalizeText(value)
        .normalize("NFKC")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, "");

const CATA_SERVICE_MAP = new Map([
    ["websitedevelopment", "Website Development"],
    ["leadgeneration", "Lead Generation"],
    ["seooptimization", "SEO Optimization"],
    ["seo", "SEO Optimization"],
    ["brandingnaminglogoandbrandidentity", "Branding (Naming, Logo & Brand Identity)"],
    ["branding", "Branding (Naming, Logo & Brand Identity)"],
    ["brandidentity", "Branding (Naming, Logo & Brand Identity)"],
]);

const resolveCataService = (service = "") => {
    const key = canonicalize(normalizeText(service));
    if (!key) return null;
    return CATA_SERVICE_MAP.get(key) || null;
};

const isWebsiteDevelopmentService = (service = "") =>
    resolveCataService(service) === "Website Development";

const CATA_WEBSITE_PAGES = [
    "Services",
    "Products",
    "Portfolio/Gallery",
    "Testimonials",
    "Blog",
    "FAQ",
    "Pricing",
    "Shop/Store",
    "Cart/Checkout",
    "Wishlist",
    "Order Tracking",
    "Reviews/Ratings",
    "Search",
    "Book Now",
    "Account/Login",
    "Admin Dashboard",
    "User Dashboard",
    "Analytics Dashboard",
    "Notifications",
    "Chat/Support Widget",
    "Help/Support",
    "Resources",
    "Events",
    "3D Animations",
    "3D Model Viewer",
    "None",
];

const CATA_WEBSITE_REQUIREMENTS = ["New website", "Revamping existing website"];

const CATA_PRIMARY_OBJECTIVES = [
    "Generating leads",
    "Selling products or services online",
    "Building brand credibility",
    "Showcasing work or portfolio",
];

const CATA_DESIGN_EXPERIENCES = [
    "Clean and simple design",
    "Premium and modern UI",
    "Interactive or 3D-based design",
];

const CATA_WEBSITE_TYPES = [
    "Platform-based website (No-code / CMS)",
    "Coded website (Custom development)",
];

const CATA_PLATFORM_PREFERENCES = [
    "WordPress",
    "Webflow",
    "Wix",
    "Shopify",
    "Squarespace",
    "Framer",
    "Bubble",
    "Zoho Sites",
    "Google Sites",
    "Magento (Adobe Commerce)",
    "Other: ________",
];

const CATA_CODED_TECH_STACKS = [
    "HTML, CSS, JavaScript (Static)",
    "React.js",
    "Next.js",
    "Vue.js",
    "Nuxt.js",
    "Angular",
    "Svelte",
    "SvelteKit",
    "SolidJS",
    "Qwik",
    "Remix",
    "Gatsby",
    "Astro",
    "Ember.js",
    "Alpine.js",
    "Lit / Web Components",
    "jQuery",
    "Other: ________",
    "Discuss Later",
    "Skip",
];

const CATA_BACKEND_OPTIONS = [
    "Node.js (Express)",
    "Node.js (NestJS)",
    "Python (Django)",
    "Python (Flask)",
    "Python (FastAPI)",
    "PHP (Laravel)",
    "Ruby on Rails",
    "Java (Spring Boot)",
    ".NET",
    "Go (Gin / Fiber)",
    "Serverless (AWS / Vercel)",
    "Discuss Later",
    "Skip",
];

const CATA_DATABASE_OPTIONS = [
    "No database needed",
    "MySQL",
    "PostgreSQL",
    "MongoDB",
    "Firebase / Firestore",
    "Supabase",
    "Discuss later",
];

const CATA_ECOMMERCE_OPTIONS = [
    "Custom eCommerce",
    "Stripe / Razorpay integration",
    "WooCommerce (if hybrid)",
];

const CATA_CONTENT_STATUSES = ["All content is ready", "Content needs to be created"];

const CATA_REFERENCE_OPTIONS = ["Yes", "No", "Skip"];

const CATA_LAUNCH_TIMELINES = [
    "Within 2-4 weeks",
    "Within 1-2 months",
    "The timeline is flexible",
];

const CATA_BUDGET_RANGES = [
    "Under INR 25,000 (Basic website)",
    "INR 25,000 - 50,000 (Standard website)",
    "INR 50,000 - 1,00,000 (Advanced website)",
    "INR 1,00,000 - 2,50,000 (Custom / dynamic website)",
    "INR 2,50,000 and above (High-end, scalable platform)",
];
const CATA_WEBSITE_MIN_BUDGET = 25000;

const CATA_SEO_BUSINESS_CATEGORIES = [
    "Local service business",
    "E-commerce or D2C brand",
    "B2B or corporate business",
];

const CATA_SEO_TARGET_LOCATIONS = [
    "A specific city - ________",
    "A state or region - ________",
    "Pan-India",
    "International markets",
];

const CATA_SEO_KEYWORD_PLANNING = [
    "We will provide keywords - ________",
    "Open to expert recommendation",
];

const CATA_SEO_GOALS = [
    "Increasing website traffic",
    "Generating quality leads",
    "Improving brand visibility",
];

const CATA_SEO_CONTENT_STATUS = [
    "Content is already available",
    "Content needs to be created",
    "Content needs optimisation",
];

const CATA_SEO_SITUATIONS = [
    "New website with no SEO",
    "Some SEO work has been done",
    "Website is already ranking",
];

const CATA_SEO_COMPETITION = [
    "Low competition",
    "Medium competition",
    "High competition",
];

const CATA_SEO_SERVICE_DURATION = [
    "1 month",
    "3 months",
    "6 months",
    "12 months",
];

const CATA_SEO_GROWTH_EXPECTATIONS = [
    "Slow and steady growth",
    "Moderate growth",
    "Aggressive growth",
];

const CATA_SEO_BUDGET_RANGES = [
    "Under INR 10,000 / month",
    "INR 10,000 - 25,000 / month",
    "INR 25,000 - 50,000 / month",
    "INR 50,000 and above / month",
];

const CATA_BRAND_STAGES = ["New brand", "Existing brand", "Rebranding"];

const CATA_BRAND_NAMING_SUPPORT = [
    "No, the brand name is already finalised",
    "Yes, Few name suggestions",
    "Yes, Complete naming strategy",
];

const CATA_BRAND_PERCEPTION = [
    "Professional and trustworthy",
    "Modern and bold",
    "Premium and minimal",
    "Youthful and energetic",
];

const CATA_BRAND_AUDIENCE = [
    "Businesses (B2B)",
    "Consumers (B2C)",
    "Direct-to-consumer (D2C)",
    "A mix of different audiences",
];

const CATA_BRAND_USAGE = [
    "Website and digital platforms",
    "Social media channels",
    "Packaging and print materials",
    "Across all platforms",
];

const CATA_BRAND_REFERENCES = ["Yes -", "No"];

const CATA_BRAND_DELIVERABLES = [
    "Brand strategy & positioning",
    "Brand vision, mission & values",
    "Target audience & buyer persona",
    "Competitor & market analysis",
    "Brand tone of voice",
    "Logo design (primary, secondary, icon)",
    "Color palette",
    "Typography system",
    "Visual identity elements & patterns",
    "Iconography style",
    "Image / illustration style",
    "Brand guidelines / brand book",
    "Business card design",
    "Letterhead & stationery",
    "Email signature",
    "Pitch deck / presentation template",
    "Brochure / flyer design",
    "Social media profile & cover designs",
    "Social media post templates",
    "Website UI brand direction",
    "Brand messaging & brand story",
    "Complete brand identity kit",
];

const CATA_BRAND_TIMELINES = [
    "Within 2 weeks",
    "Within 3-4 weeks",
    "Within 1-2 months",
];

const CATA_BRAND_CREATIVE_FREEDOM = [
    "Full creative freedom",
    "Some guidelines -",
    "Strict brand guidelines -",
];

const CATA_BRAND_BUDGET_RANGES = [
    "Under INR 25,000",
    "INR 25,000 - 50,000",
    "INR 50,000 - 1,00,000",
    "INR 1,00,000 and above",
];

const normalizeCataChoice = (value = "") =>
    canonicalize(normalizeText(value).toLowerCase());

const isPlatformWebsiteType = (value = "") => {
    const canon = normalizeCataChoice(value);
    if (!canon) return false;
    return (
        canon.includes("platformbased") ||
        canon.includes("nocode") ||
        canon.includes("cms") ||
        canon.includes("platform")
    );
};

const isCodedWebsiteType = (value = "") => {
    const canon = normalizeCataChoice(value);
    if (!canon) return false;
    return (
        canon.includes("codedwebsite") ||
        canon.includes("customdevelopment") ||
        canon.includes("customcode") ||
        canon.includes("coded")
    );
};

const isStaticTechStack = (value = "") => {
    const canon = normalizeCataChoice(value);
    return canon.includes("htmlcssjavascript");
};

const shouldAskPlatformPreference = (data = {}) =>
    isPlatformWebsiteType(data.website_type);

const shouldAskTechStack = (data = {}) =>
    isCodedWebsiteType(data.website_type);

const isDiscussLaterChoice = (value = "") =>
    splitSelections(value).some(
        (item) => normalizeText(item).toLowerCase() === "discuss later"
    );

const shouldAskBackendStack = (data = {}) => {
    if (!isCodedWebsiteType(data.website_type)) return false;
    if (!normalizeText(data.tech_stack)) return false;
    return true;
};

const shouldAskDatabaseStack = (data = {}) => {
    if (!shouldAskBackendStack(data)) return false;
    const backendValue = normalizeText(data.backend);
    if (!backendValue) return false;
    if (backendValue === "[skipped]") return false;
    return !isDiscussLaterChoice(backendValue);
};

const shouldAskEcommerceStack = (data = {}) => {
    const objective = normalizeText(data.primary_objective).toLowerCase();
    if (objective.includes("selling")) return true;

    const platforms = normalizeText(data.platform_preference).toLowerCase();
    if (/(shopify|woocommerce|magento)/.test(platforms)) return true;

    return false;
};

const shouldAskLeadCity = (data = {}) => {
    const target = normalizeText(data.target_location).toLowerCase();
    return target.includes("specific city");
};

const shouldAskLeadRegion = (data = {}) => {
    const target = normalizeText(data.target_location).toLowerCase();
    return (
        target.includes("state or region") ||
        target.includes("state") ||
        target.includes("region")
    );
};

const CATA_SERVICE_CONFIGS = new Map([
    [
        "Website Development",
        {
            requiredKeys: [
                "name",
                "website_requirement",
                "primary_objective",
                "design_experience",
                "website_type",
                "platform_preference",
                "tech_stack",
                "backend",
                "database",
                "additional_pages",
                "content_status",
                "references",
                "launch_timeline",
                "budget_range",
            ],
            listFields: new Set([
                "platform_preference",
                "tech_stack",
                "backend",
                "additional_pages",
            ]),
            questions: [
                {
                    key: "name",
                    templates: [
                        "Hi! I see you're interested in Website Development. What's your name? Let's get started.",
                    ],
                    suggestions: null,
                    required: true,
                    tags: ["name"],
                },
                {
                    key: "website_requirement",
                    templates: ["What best describes your website requirement?"],
                    suggestions: CATA_WEBSITE_REQUIREMENTS,
                    expectedType: "enum",
                    required: true,
                },
                {
                    key: "primary_objective",
                    templates: ["What is the primary objective of your website?"],
                    suggestions: CATA_PRIMARY_OBJECTIVES,
                    expectedType: "enum",
                    required: true,
                },
                {
                    key: "design_experience",
                    templates: ["What type of design experience are you looking for?"],
                    suggestions: CATA_DESIGN_EXPERIENCES,
                    expectedType: "enum",
                    required: true,
                },
                {
                    key: "website_type",
                    templates: ["What type of website do you need?"],
                    suggestions: CATA_WEBSITE_TYPES,
                    expectedType: "enum",
                    required: true,
                },
                {
                    key: "platform_preference",
                    templates: [
                        "If Platform-based website is selected, choose preferred platform(s):",
                    ],
                    suggestions: CATA_PLATFORM_PREFERENCES,
                    multiSelect: true,
                    expectedType: "list",
                    required: true,
                    when: shouldAskPlatformPreference,
                },
                {
                    key: "tech_stack",
                    templates: [
                        "For coded websites, choose your preferred frontend technology:",
                    ],
                    suggestions: CATA_CODED_TECH_STACKS,
                    multiSelect: true,
                    expectedType: "list",
                    required: true,
                    when: shouldAskTechStack,
                    allowSkip: true,
                },
                {
                    key: "backend",
                    templates: ["Which backend technology do you prefer?"],
                    suggestions: CATA_BACKEND_OPTIONS,
                    multiSelect: true,
                    expectedType: "list",
                    required: true,
                    when: shouldAskBackendStack,
                    allowSkip: true,
                },
                {
                    key: "database",
                    templates: ["Which database would you like to use for your website?"],
                    suggestions: CATA_DATABASE_OPTIONS,
                    expectedType: "enum",
                    required: true,
                    when: shouldAskDatabaseStack,
                },
                {
                    key: "additional_pages",
                    templates: [
                        "Every website includes: Home, About, Contact, Privacy Policy & Terms. What additional pages do you need? (Select all that apply)",
                    ],
                    suggestions: CATA_WEBSITE_PAGES,
                    multiSelect: true,
                    expectedType: "list",
                    required: true,
                },
                {
                    key: "content_status",
                    templates: ["What is the status of your website content?"],
                    suggestions: CATA_CONTENT_STATUSES,
                    expectedType: "enum",
                    required: true,
                },
                {
                    key: "references",
                    templates: ["Do you have any reference websites you like?"],
                    suggestions: CATA_REFERENCE_OPTIONS,
                    expectedType: "text",
                    required: true,
                    allowSkip: true,
                },
                {
                    key: "launch_timeline",
                    templates: ["When would you like to launch the website?"],
                    suggestions: CATA_LAUNCH_TIMELINES,
                    expectedType: "timeline_text",
                    required: true,
                    tags: ["timeline"],
                },
                {
                    key: "budget_range",
                    templates: ["What is your budget for this project (in INR)?"],
                    suggestions: CATA_BUDGET_RANGES,
                    hideSuggestions: true,
                    expectedType: "budget_text",
                    required: true,
                    tags: ["budget"],
                },
            ],
        },
    ],
    [
        "Lead Generation",
        {
            requiredKeys: [
                "name",
                "lead_type",
                "target_audience",
                "target_location",
                "target_city",
                "target_region",
                "lead_volume",
                "channels",
                "lead_quality",
                "crm_usage",
                "campaign_duration",
                "monthly_budget",
            ],
            listFields: new Set(["channels"]),
            questions: [
                {
                    id: "Q1",
                    nextId: "Q2",
                    key: "name",
                    answerType: "text",
                    required: true,
                    disableSharedContext: true,
                    forceAsk: true,
                    patterns: ["name", "call you", "full name"],
                    templates: ["What's your name?"],
                    suggestions: null,
                    tags: ["name"],
                },
                {
                    id: "Q2",
                    nextId: "Q3",
                    key: "lead_type",
                    answerType: "single_select",
                    required: true,
                    disableSharedContext: true,
                    forceAsk: true,
                    patterns: ["lead type", "phone call", "form submissions", "whatsapp", "chat"],
                    templates: ["What type of leads are you primarily looking for?"],
                    suggestions: ["Phone call leads", "Form submissions", "WhatsApp or chat leads"],
                },
                {
                    id: "Q3",
                    nextId: "Q4",
                    key: "target_audience",
                    answerType: "single_select",
                    required: true,
                    disableSharedContext: true,
                    forceAsk: true,
                    patterns: ["target audience", "b2b", "b2c", "businesses", "consumers"],
                    templates: ["Who is your target audience?"],
                    suggestions: ["Businesses (B2B)", "Consumers (B2C)", "A mix of both"],
                },
                {
                    id: "Q4",
                    nextId: "Q5",
                    key: "target_location",
                    answerType: "single_select",
                    required: true,
                    disableSharedContext: true,
                    forceAsk: true,
                    patterns: ["location", "city", "region", "pan-india"],
                    templates: ["Which locations do you want to target for lead generation?"],
                    suggestions: ["A specific city", "A state or region", "Pan-India"],
                },
                {
                    id: "Q5",
                    nextId: "Q6",
                    key: "target_city",
                    answerType: "text",
                    required: true,
                    disableSharedContext: true,
                    forceAsk: true,
                    patterns: ["specific city", "city name", "which city"],
                    templates: ["Please share the specific city name."],
                    suggestions: null,
                    tags: ["location"],
                    when: shouldAskLeadCity,
                },
                {
                    id: "Q6",
                    nextId: "Q7",
                    key: "target_region",
                    answerType: "text",
                    required: true,
                    disableSharedContext: true,
                    forceAsk: true,
                    patterns: ["state", "region", "state or region"],
                    templates: ["Please share the state or region."],
                    suggestions: null,
                    tags: ["location"],
                    when: shouldAskLeadRegion,
                },
                {
                    id: "Q7",
                    nextId: "Q8",
                    key: "lead_volume",
                    answerType: "single_select",
                    required: true,
                    disableSharedContext: true,
                    forceAsk: true,
                    patterns: ["leads per month", "lead volume", "volume"],
                    templates: ["How many leads do you expect per month?"],
                    suggestions: ["Low volume", "Medium volume", "High volume"],
                },
                {
                    id: "Q8",
                    nextId: "Q9",
                    key: "channels",
                    answerType: "multi_select",
                    required: true,
                    disableSharedContext: true,
                    forceAsk: true,
                    patterns: ["channels", "google", "meta", "linkedin", "email", "tools"],
                    templates: ["Which channels should be used for lead generation? (Multiple)"],
                    suggestions: ["Google", "Meta", "LinkedIn", "Email", "Third party tools"],
                    multiSelect: true,
                },
                {
                    id: "Q9",
                    nextId: "Q10",
                    key: "lead_quality",
                    answerType: "single_select",
                    required: true,
                    disableSharedContext: true,
                    forceAsk: true,
                    patterns: ["lead quality", "raw leads", "pre-qualified"],
                    templates: ["What level of lead quality do you require?"],
                    suggestions: ["Raw leads", "Pre-qualified leads"],
                },
                {
                    id: "Q10",
                    nextId: "Q11",
                    key: "crm_usage",
                    answerType: "single_select",
                    required: true,
                    disableSharedContext: true,
                    forceAsk: true,
                    patterns: ["crm", "lead tracking", "tracking system"],
                    templates: ["Do you currently use a CRM or lead tracking system?"],
                    suggestions: ["Yes, a CRM is already in place", "No"],
                },
                {
                    id: "Q11",
                    nextId: "Q12",
                    key: "campaign_duration",
                    answerType: "single_select",
                    required: true,
                    disableSharedContext: true,
                    forceAsk: true,
                    patterns: ["campaign duration", "how long", "short-term", "long-term"],
                    templates: ["How long do you want to run the lead generation campaigns?"],
                    suggestions: ["Short-term", "Medium-term", "Long-term"],
                },
                {
                    id: "Q12",
                    nextId: null,
                    key: "monthly_budget",
                    answerType: "single_select",
                    required: true,
                    disableSharedContext: true,
                    forceAsk: true,
                    patterns: ["budget", "monthly budget", "spend"],
                    templates: ["What is your monthly budget for lead generation?"],
                    suggestions: [
                        "Under ?15,000 / month",
                        "?15,000 – ?30,000 / month",
                        "?30,000 – ?60,000 / month",
                        "?60,000 – ?1,00,000 / month",
                        "?1,00,000 and above / month",
                    ],
                },
            ],
        },
    ],
    [
        "SEO Optimization",
        {
            requiredKeys: [
                "name",
                "business_category",
                "target_locations",
                "keyword_planning",
                "primary_goal",
                "content_status",
                "seo_situation",
                "competition_level",
                "service_duration",
                "growth_expectation",
                "budget_range",
            ],
            listFields: new Set([]),
            questions: [
                {
                    key: "name",
                    templates: [
                        "Hi! I see you're interested in SEO Optimization. What's your name? Let's get started.",
                    ],
                    suggestions: null,
                    required: true,
                    tags: ["name"],
                },
                {
                    key: "business_category",
                    templates: ["Which category best describes your business?"],
                    suggestions: CATA_SEO_BUSINESS_CATEGORIES,
                    expectedType: "enum",
                    required: true,
                },
                {
                    key: "target_locations",
                    templates: ["Which geographic locations would you like to target through SEO?"],
                    suggestions: CATA_SEO_TARGET_LOCATIONS,
                    expectedType: "enum",
                    required: true,
                },
                {
                    key: "keyword_planning",
                    templates: ["How would you like to approach keyword planning?"],
                    suggestions: CATA_SEO_KEYWORD_PLANNING,
                    expectedType: "enum",
                    required: true,
                },
                {
                    key: "primary_goal",
                    templates: ["What is your primary goal with SEO?"],
                    suggestions: CATA_SEO_GOALS,
                    expectedType: "enum",
                    required: true,
                },
                {
                    key: "content_status",
                    templates: ["What is the current status of your website content?"],
                    suggestions: CATA_SEO_CONTENT_STATUS,
                    expectedType: "enum",
                    required: true,
                },
                {
                    key: "seo_situation",
                    templates: ["What best describes your current SEO situation?"],
                    suggestions: CATA_SEO_SITUATIONS,
                    expectedType: "enum",
                    required: true,
                },
                {
                    key: "competition_level",
                    templates: ["How competitive is your industry online?"],
                    suggestions: CATA_SEO_COMPETITION,
                    expectedType: "enum",
                    required: true,
                },
                {
                    key: "service_duration",
                    templates: ["How long would you like to continue SEO services?"],
                    suggestions: CATA_SEO_SERVICE_DURATION,
                    expectedType: "enum",
                    required: true,
                },
                {
                    key: "growth_expectation",
                    templates: ["What kind of growth are you expecting from SEO?"],
                    suggestions: CATA_SEO_GROWTH_EXPECTATIONS,
                    expectedType: "enum",
                    required: true,
                },
                {
                    key: "budget_range",
                    templates: ["Which monthly budget range best suits you?"],
                    suggestions: CATA_SEO_BUDGET_RANGES,
                    expectedType: "budget_text",
                    required: true,
                    tags: ["budget"],
                },
            ],
        },
    ],
    [
        "Branding (Naming, Logo & Brand Identity)",
        {
            requiredKeys: [
                "name",
                "brand_stage",
                "naming_support",
                "brand_perception",
                "target_audience",
                "branding_usage",
                "reference_brands",
                "deliverables",
                "timeline",
                "creative_freedom",
                "budget_range",
            ],
            listFields: new Set(["deliverables"]),
            questions: [
                {
                    key: "name",
                    templates: [
                        "Hi! I see you're interested in Branding (Naming, Logo & Brand Identity). What's your name? Let's get started.",
                    ],
                    suggestions: null,
                    required: true,
                    tags: ["name"],
                },
                {
                    key: "brand_stage",
                    templates: ["At what stage is your brand currently?"],
                    suggestions: CATA_BRAND_STAGES,
                    expectedType: "enum",
                    required: true,
                },
                {
                    key: "naming_support",
                    templates: ["Do you require assistance with finalising or creating your brand name?"],
                    suggestions: CATA_BRAND_NAMING_SUPPORT,
                    expectedType: "enum",
                    required: true,
                },
                {
                    key: "brand_perception",
                    templates: ["How would you like your brand to be perceived by your audience?"],
                    suggestions: CATA_BRAND_PERCEPTION,
                    expectedType: "enum",
                    required: true,
                },
                {
                    key: "target_audience",
                    templates: ["Who is your primary target audience?"],
                    suggestions: CATA_BRAND_AUDIENCE,
                    expectedType: "enum",
                    required: true,
                    tags: ["audience"],
                },
                {
                    key: "branding_usage",
                    templates: ["Where will this branding be used most frequently?"],
                    suggestions: CATA_BRAND_USAGE,
                    expectedType: "enum",
                    required: true,
                },
                {
                    key: "reference_brands",
                    templates: ["Do you have any reference brands whose style you admire?"],
                    suggestions: CATA_BRAND_REFERENCES,
                    expectedType: "enum",
                    required: true,
                },
                {
                    key: "deliverables",
                    templates: ["Which branding deliverables are you looking for? (multiple options)"],
                    suggestions: CATA_BRAND_DELIVERABLES,
                    multiSelect: true,
                    expectedType: "list",
                    required: true,
                },
                {
                    key: "timeline",
                    templates: ["What is your preferred timeline for completing the branding work?"],
                    suggestions: CATA_BRAND_TIMELINES,
                    expectedType: "timeline_text",
                    required: true,
                    tags: ["timeline"],
                },
                {
                    key: "creative_freedom",
                    templates: ["How much creative freedom would you like to give the design team?"],
                    suggestions: CATA_BRAND_CREATIVE_FREEDOM,
                    expectedType: "enum",
                    required: true,
                },
                {
                    key: "budget_range",
                    templates: ["Which budget level best represents your expectation for this project?"],
                    suggestions: CATA_BRAND_BUDGET_RANGES,
                    expectedType: "budget_text",
                    required: true,
                    tags: ["budget"],
                },
            ],
        },
    ],
]);

const getCataConfig = (service = "") => {
    const resolved = resolveCataService(service);
    if (!resolved) return null;
    return CATA_SERVICE_CONFIGS.get(resolved) || null;
};

export const isCataService = (service = "") => Boolean(getCataConfig(service));

const normalizeForSuggestionMatching = (value = "") => {
    const text = normalizeText(value).toLowerCase();
    if (!text) return "";

    return (
        text
            // Common shorthand users type in one-shot briefs.
            .replace(/\becom(m)?\b/g, "ecommerce")
            .replace(/\be-?\s*commerce\b/g, "ecommerce")
            // Normalize common feature nouns.
            .replace(/\bwish\s*list\b/g, "wishlist")
            .replace(/\breview\b/g, "reviews")
            .replace(/\brating\b/g, "ratings")
        // Keep punctuation as-is; tokenization happens later.
    );
};

const stripMarkdownFormatting = (value = "") => {
    let text = normalizeText(value);
    if (!text) return text;

    // Basic Markdown cleanup so regex-based extraction can work with inputs like **CartNest**.
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
    text = text.replace(/[*`~]/g, "");
    text = text.replace(/_{1,2}/g, "");

    return text.replace(/\s+/g, " ").trim();
};

const CHANGE_TECH_SENTINEL = "__CHANGE_TECH__";

const isBrandingNamingServiceQuestions = (questions = []) => {
    const list = Array.isArray(questions) ? questions : [];
    if (!list.length) return false;
    const brandingKeys = new Set([
        "brand_stage",
        "naming_support",
        "brand_perception",
        "branding_usage",
        "reference_brands",
        "creative_freedom",
    ]);
    return list.some((question, index) =>
        brandingKeys.has(resolveQuestionKey(question, index))
    );
};

const withMandatoryBrief = (questions = []) => {
    const list = Array.isArray(questions) ? questions : [];
    if (isBrandingNamingServiceQuestions(list)) return list;
    const hasExplicitFlow = list.some((q) =>
        Boolean(
            q?.nextId ||
            q?.nextQuestionId ||
            q?.next ||
            q?.questionId ||
            q?.id ||
            q?.start
        )
    );
    if (hasExplicitFlow) return list;
    const briefKeys = new Set([
        "brief",
        "summary",
        "description",
        "problem",
        "use_case",
        "business_info",
        "vision",
    ]);

    if (list.some((q, index) => briefKeys.has(resolveQuestionKey(q, index)))) return list;

    const briefQuestion = {
        key: "brief",
        patterns: ["brief", "summary", "overview", "requirements"],
        templates: ["Please share a short brief of what you need (2-3 lines)."],
        suggestions: null,
    };

    if (!list.length) return [briefQuestion];

    const insertIndex = Math.min(1, list.length);
    return [
        ...list.slice(0, insertIndex),
        briefQuestion,
        ...list.slice(insertIndex),
    ];
};

const shouldSkipMandatoryBrief = (service = "") => {
    const canon = canonicalize(normalizeText(service));
    return (
        canon === "writingcontent" ||
        canon === "writingandcontent" ||
        canon === "customersupport" ||
        canon === "influencermarketing" ||
        canon === "influencerugcmarketing" ||
        canon === "ugcmarketing" ||
        canon === "ugcusergeneratedcontentmarketing" ||
        canon === "3dmodeling" ||
        canon.startsWith("3dmodeling") ||
        canon === "aiautomation" ||
        canon.startsWith("aiautomation") ||
        canon === "whatsappchatbot" ||
        canon.startsWith("whatsappchatbot") ||
        canon === "voiceagent" ||
        canon.startsWith("voiceagent") ||
        canon === "creativeanddesign" ||
        canon.startsWith("creativeanddesign")
    );
};

const resolveIntroServiceLabel = (service = "") => {
    const label = normalizeText(service);
    if (!label) return "your project";
    const lower = label.toLowerCase();
    if (lower === "default" || lower === "project") return "your project";
    return label;
};

const buildGlobalIntroPrompt = (service = "") =>
    `Hi! I see you're interested in ${resolveIntroServiceLabel(service)}. What's your name? Let's get started.`;

const withGlobalIntroQuestion = (questions = [], service = "") => {
    const list = Array.isArray(questions) ? [...questions] : [];
    const introPrompt = buildGlobalIntroPrompt(service);
    if (!list.length) {
        return [
            {
                key: "name",
                patterns: ["name", "call you", "who are you"],
                templates: [introPrompt],
                suggestions: null,
                required: true,
                start: true,
            },
        ];
    }

    const isPersonalNameQuestion = (question = {}, index = 0) => {
        const key = resolveQuestionKey(question, index);
        if (!key) return false;
        const tags = new Set([...(question.tags || []), ...getQuestionTags({ ...question, key })]);
        if (!tags.has("name")) return false;
        if (tags.has("company")) return false;
        if (/(company|business|brand|project|organization)/i.test(key)) return false;
        return true;
    };

    const nameIndex = list.findIndex((q, index) => isPersonalNameQuestion(q, index));
    const existing = nameIndex >= 0 ? list[nameIndex] : null;
    const introQuestion = {
        ...(existing || {}),
        key: "name",
        templates: [introPrompt],
        suggestions: null,
        required: true,
        start: true,
        nextId: null,
        nextQuestionId: null,
        next: null,
    };

    const remaining =
        nameIndex >= 0
            ? [...list.slice(0, nameIndex), ...list.slice(nameIndex + 1)]
            : list;

    return [introQuestion, ...remaining];
};

const isChangeTechnologyMessage = (value = "") => {
    const canon = canonicalize(value);
    if (!canon) return false;

    return (
        canon === "changetechnology" ||
        canon === "changetech" ||
        canon === "switchtechnology" ||
        canon === "switchtech" ||
        canon === "differenttechnology" ||
        canon === "chooseanothertechnology" ||
        canon === "chooseanothertech" ||
        canon === "changestack" ||
        canon === "switchstack" ||
        canon === "changeplatform" ||
        canon === "switchplatform"
    );
};

const getSuggestionAliases = (value = "") => {
    const text = normalizeText(value);
    if (!text) return [];

    const aliases = new Set([text]);

    const withoutParens = text
        .replace(/\s*\([^)]*\)\s*/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    if (withoutParens) aliases.add(withoutParens);

    const parenMatches = Array.from(text.matchAll(/\(([^)]+)\)/g));
    for (const match of parenMatches) {
        const inside = normalizeText(match[1]);
        if (!inside) continue;

        // Only treat parenthetical content as aliases when it contains explicit alternatives.
        // Example: "Payment Gateway (Razorpay/Stripe)" -> ["Razorpay", "Stripe"]
        // Avoid broad aliases like "(React)" which would match many unrelated options.
        if (/[\\/|,]/.test(inside)) {
            for (const part of inside.split(/[\\/|,]/)) {
                const cleaned = normalizeText(part);
                if (cleaned) aliases.add(cleaned);
            }
        }
    }

    for (const part of text.split(/[\\/|]/)) {
        const cleaned = normalizeText(part);
        if (cleaned) aliases.add(cleaned);
    }

    if (text.toLowerCase().endsWith(" yet")) {
        const noYet = text.slice(0, -4).trim();
        if (noYet) aliases.add(noYet);
    }

    for (const alias of Array.from(aliases)) {
        const withoutJs = alias
            .replace(/\.?\bjs\b/gi, "")
            .replace(/\s+/g, " ")
            .trim();
        // Avoid creating overly-generic aliases like "Next" from "Next.js".
        if (withoutJs && withoutJs !== alias && withoutJs.length >= 5) {
            aliases.add(withoutJs);
        }
    }

    return Array.from(aliases);
};

const matchSuggestionsInMessage = (question, rawMessage) => {
    const message = normalizeText(rawMessage);
    if (!message) return [];
    if (!Array.isArray(question?.suggestions) || question.suggestions.length === 0) {
        return [];
    }

    const messageLower = normalizeForSuggestionMatching(message);
    const messageCanonical = canonicalize(messageLower);
    const tokens = (messageLower.match(/[a-z0-9]+/gi) || []).map((t) =>
        canonicalize(t.toLowerCase())
    );
    const tokenSet = new Set(tokens.filter(Boolean));
    // Add common bigrams to support inputs like "next js" -> "nextjs".
    for (let i = 0; i < tokens.length - 1; i++) {
        const bigram = `${tokens[i]}${tokens[i + 1]}`;
        if (bigram) tokenSet.add(bigram);
    }
    const matches = [];

    for (const option of question.suggestions) {
        const optionText = normalizeText(option);
        if (!optionText) continue;

        let isMatch = false;

        // Handle composite options like "React.js + Node.js" where users often type "react and node".
        if (/[+&]/.test(optionText)) {
            const parts = optionText
                .split(/[+&]/)
                .map((part) => normalizeText(part.replace(/\([^)]*\)/g, "")))
                .filter(Boolean);

            const partCanons = parts
                .map((part) => canonicalize(part.toLowerCase()))
                .filter((canon) => canon && canon.length >= 3);

            if (partCanons.length >= 2) {
                const allPresent = partCanons.every(
                    (canon) => tokenSet.has(canon) || messageCanonical.includes(canon)
                );
                if (allPresent) isMatch = true;
            }
        }

        if (!isMatch) {
            const aliases = getSuggestionAliases(optionText);
            for (const alias of aliases) {
                const aliasLower = normalizeText(alias).toLowerCase();
                const aliasCanonical = canonicalize(aliasLower);
                if (!aliasCanonical) continue;

                if (!aliasLower.includes(" ")) {
                    // For single tokens, require whole-token matching to avoid false positives
                    // like "help" matching "helps" or "search" matching "research".
                    isMatch = tokenSet.has(aliasCanonical);
                } else {
                    // For multi-word phrases, allow canonical containment.
                    isMatch = messageCanonical.includes(aliasCanonical) || messageLower.includes(aliasLower);
                }

                if (isMatch) break;
            }
        }

        if (isMatch) matches.push(optionText);
    }

    const unique = Array.from(new Set(matches));
    if (unique.length <= 1) return unique;

    // Prefer the most specific options when one match is a strict substring of another.
    const ranked = unique
        .map((optionText) => {
            const canon = canonicalize(optionText.toLowerCase());
            return { optionText, canon, len: canon.length };
        })
        .sort((a, b) => b.len - a.len);

    const kept = [];
    for (const item of ranked) {
        if (!item.canon || item.len <= 3) {
            kept.push(item);
            continue;
        }

        const isSub = kept.some(
            (keptItem) =>
                keptItem.canon &&
                keptItem.len > item.len &&
                keptItem.canon.includes(item.canon)
        );
        if (!isSub) kept.push(item);
    }

    return kept.map((item) => item.optionText);
};

const matchExactSuggestionSelections = (question, rawMessage) => {
    const message = normalizeText(rawMessage);
    if (!message) return [];
    if (!Array.isArray(question?.suggestions) || question.suggestions.length === 0) return [];

    // Only attempt exact parsing for short, selection-like inputs (e.g. chip picks).
    if (message.length > 180) return [];

    const parts = message
        .split(/[,|]/)
        .map((part) => normalizeText(part))
        .filter(Boolean);

    if (!parts.length) return [];

    const suggestionsByCanon = new Map();
    for (const option of question.suggestions) {
        const canon = canonicalize(String(option || "").toLowerCase());
        if (canon) suggestionsByCanon.set(canon, option);
    }

    const matches = [];
    for (const part of parts) {
        const canon = canonicalize(part.toLowerCase());
        if (!canon) continue;
        const option = suggestionsByCanon.get(canon);
        if (option) matches.push(option);
    }

    // Only accept when every comma-separated item matched a suggestion option.
    if (matches.length !== parts.length || matches.length === 0) return [];

    const unique = Array.from(new Set(matches));
    const hasNone = unique.some((opt) => canonicalize(String(opt || "").toLowerCase()) === "none");
    if (hasNone) return ["None"];

    return unique;
};

const trimEntity = (value = "") => {
    let text = normalizeText(value);
    if (!text) return "";

    // Prefer the part before common separators.
    text = text.split(/\s+and\s+/i)[0];
    text = text.split(/\s+but\s+/i)[0];
    text = text.split(/\s+so\s+/i)[0];
    text = text.split(/\s+because\s+/i)[0];
    text = text.split(/[,.!\n]/)[0];

    return normalizeText(text).replace(/\s+/g, " ");
};

const extractDescriptionFromMixedMessage = (value = "") => {
    const text = normalizeText(value);
    if (!text) return null;

    const startPatterns = [
        // Match only the project/brand name segment, stopping before common separators like "and", commas, or budget/tech markers.
        /\b(?:my\s+)?(?:company|business|brand|project)\s*(?:name\s*)?(?:is|:|called|named)\s+[^\n,.;]{1,80}?(?=(?:\s+(?:and|with|\bbudget\b|\btech\b|\btimeline\b))|[,.!\n]|$)/i,
    ];

    let startIndex = 0;
    for (const pattern of startPatterns) {
        const match = text.match(pattern);
        if (match && typeof match.index === "number") {
            startIndex = match.index + match[0].length;
            break;
        }
    }

    const tail = text.slice(startIndex);
    const tailLower = tail.toLowerCase();

    const markerIndexes = [
        tailLower.search(/\bbudget\b/),
        tailLower.search(/\btech(?:nology)?\b/),
        tailLower.search(/\btimeline\b/),
        tailLower.search(/\bdeploy(?:ment)?\b|\bhost(?:ed|ing)?\b/),
        tailLower.search(/\bdomain\b/),
        tailLower.search(/\bintegration\b/),
    ].filter((idx) => idx >= 0);

    const endIndex = markerIndexes.length ? Math.min(...markerIndexes) : tail.length;
    let candidate = tail.slice(0, endIndex);

    candidate = candidate
        .replace(/^[\s,.;:-]+/, "")
        .replace(/^\s*(?:and\s+)?(?:it\s+is|it's|its)\s+/i, "")
        .replace(/^\s*(?:and|also|plus)\b\s*/i, "")
        .replace(/\s+/g, " ")
        .trim();

    // If we didn't find a project/brand marker, strip common lead-ins like "my name ..."
    if (startIndex === 0) {
        candidate = candidate
            .replace(/^(?:hi|hello|hey)\b[!,.\s-]*/i, "")
            .replace(
                /^(?:my\s+name|name)\s*(?:is|:)?\s+(?!and\b|i\b|im\b|i'm\b|we\b|we're\b)[a-z][a-z'’.-]*(?:\s+(?!and\b|i\b|im\b|i'm\b|we\b|we're\b)[a-z][a-z'’.-]*){0,2}\b[!,.\s-]*/i,
                ""
            )
            .replace(/^\s*(?:and|so)\b\s*/i, "")
            .replace(
                /\b(?:my\s+)?(?:company|business|brand|project)\s*(?:name\s*)?(?:is|:|called|named)\s+[^\n,.;]{1,80}?(?=(?:\s+(?:and|with|\bbudget\b|\btech\b|\btimeline\b))|[,.!\n]|$)/gi,
                ""
            )
            .replace(/\s+/g, " ")
            .trim();
    }

    if (candidate.length < 20) return null;
    return candidate;
};

const extractOrganizationName = (value = "") => {
    const text = normalizeText(value);
    if (!text) return null;

    const trimOrganizationCandidate = (candidate = "") => {
        let refined = normalizeText(candidate);
        if (!refined) return "";

        const lower = refined.toLowerCase();
        const markerIndexes = [
            lower.search(/\bbudget\b/),
            lower.search(/\btech(?:nology)?\b|\bstack\b/),
            lower.search(/\btimeline\b|\bdeadline\b/),
            lower.search(/\bdeploy(?:ment)?\b|\bhost(?:ing|ed)?\b/),
            lower.search(/\bdomain\b/),
        ].filter((idx) => idx >= 0);

        const endIndex = markerIndexes.length ? Math.min(...markerIndexes) : refined.length;
        refined = refined.slice(0, endIndex);

        return refined.replace(/[\s,.;:-]+$/, "").trim();
    };

    const looksLikeGenericProjectLabel = (candidate = "") => {
        const cleaned = normalizeText(candidate)
            .replace(/\?/g, "")
            .replace(/^\s*(?:a|an|the|my|our|this|that|its)\b\s*/i, "")
            .replace(/\s+/g, " ")
            .trim();
        if (!cleaned) return true;

        const canon = canonicalize(cleaned);
        if (!canon) return true;

        const genericCanons = new Set([
            "ecomm",
            "ecom",
            "ecommerce",
            "ecommercewebsite",
            "website",
            "webapp",
            "webapplication",
            "app",
            "application",
            "mobileapp",
            "mobileapplication",
            "landingpage",
            "portfolio",
            "businesswebsite",
            "informationalwebsite",
            "saas",
            "dashboard",
            "platform",
            "marketplace",
            "store",
            "shop",
            "onlinestore",
        ]);

        if (genericCanons.has(canon)) return true;

        // If the extracted "name" still contains generic project nouns, it's likely a type/description.
        if (
            /\s/.test(cleaned) &&
            /\b(website|web\s*app|app|application|store|shop|platform|marketplace|dashboard|landing\s*page|portfolio|saas|e-?\s*commerce)\b/i.test(
                cleaned
            )
        ) {
            return true;
        }

        return false;
    };

    const patterns = [
        // "The name I'm thinking of is CartNest"
        /\b(?:the\s+)?name\s+i['’]m\s+thinking\s+of\s*(?:is|:)?\s*([a-z0-9][a-z0-9&._' -]{1,80})/i,
        /\b(?:the\s+)?name\s+i[’'\?]m\s+thinking\s+of\s*(?:is|:)?\s*([a-z0-9][a-z0-9&._' -]{1,80})/i,
        /\b(?:the\s+)?name\s+im\s+thinking\s+of\s*(?:is|:)?\s*([a-z0-9][a-z0-9&._' -]{1,80})/i,
        /\b(?:the\s+)?name\s+i\s+am\s+thinking\s+of\s*(?:is|:)?\s*([a-z0-9][a-z0-9&._' -]{1,80})/i,
        /\b(?:the\s+)?name\s+i\s+have\s+in\s+mind\s*(?:is|:)?\s*([a-z0-9][a-z0-9&._' -]{1,80})/i,
        /\bfor\s+(?:my\s+)?(?:company|business|brand|project)\s+([a-z0-9][a-z0-9&._' -]{1,80})/i,
        /\bmy\s+(?:company|business|brand|project)\s*(?:name\s*)?(?:is|:|called|named)\s*([a-z0-9][a-z0-9&._' -]{1,80})/i,
        /\b(?:company|business|brand|project)\s*(?:name\s*)?(?:is|:|called|named)\s*([a-z0-9][a-z0-9&._' -]{1,80})/i,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (!match) continue;
        const candidate = trimOrganizationCandidate(trimEntity(match[1]));
        if (candidate && candidate.length <= 60 && !looksLikeGenericProjectLabel(candidate)) {
            return candidate;
        }
    }

    // Common phrasing: "my project called Markify", "it's called Markify"
    if (
        /\b(?:called|named)\b/i.test(text) &&
        /\b(company|business|brand|project|app|website|platform|product|tool|manager|system|dashboard|store|marketplace|saas)\b/i.test(
            text
        )
    ) {
        const match = text.match(/\b(?:called|named)\s+([a-z0-9][a-z0-9&._' -]{1,80})/i);
        if (match) {
            const candidate = trimOrganizationCandidate(trimEntity(match[1]));
            if (candidate && candidate.length <= 60 && !looksLikeGenericProjectLabel(candidate)) {
                return candidate;
            }
        }
    }

    return null;
};

const getQuestionKeyFromAssistant = (value = "") => {
    const match = normalizeText(value).match(QUESTION_KEY_TAG_REGEX);
    return match ? match[1].trim() : null;
};

const withQuestionKeyTag = (text = "", key = "") => {
    if (!key) return text;
    if (QUESTION_KEY_TAG_REGEX.test(text)) return text;
    return `${text}\n[QUESTION_KEY: ${key}]`;
};

const isGreetingMessage = (value = "") => {
    const raw = normalizeText(value);
    if (!raw) return false;

    const text = raw
        .toLowerCase()
        .replace(/[^a-z0-9'\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    // Treat as a greeting only when the message is basically *just* a greeting.
    // Examples that should count: "hi", "hello!", "hey there"
    // Examples that should NOT count: "hi i need a website", "hello can you help with SEO?"
    if (text.length > 20) return false;

    const compact = text.replace(/\s+/g, "");

    if (/^(hi|hey|yo|sup|hii+)(there)?$/.test(compact)) return true;
    if (/^(what'?sup|whatsup)(there)?$/.test(compact)) return true;

    // Common "hello" variations / typos: hello, helloo, hellooo, hellow, helo, hlo.
    if (/^(hell+o+w*|helo+|hlo+|hlw+)(there)?$/.test(compact)) return true;

    return false;
};

const isSkipMessage = (value = "") => {
    const text = normalizeText(value).toLowerCase();
    return text === "skip" || text === "done" || text === "na" || text === "n/a" || text.includes("skip");
};

const extractBudget = (value = "") => {
    const text = normalizeText(value).replace(/\?/g, "");
    if (!text) return null;
    if (/^flexible$/i.test(text)) return "Flexible";
    if (/\bcustom\s*amount\b/i.test(text)) return "Custom amount";

    // Range budget: "?1,00,000 - ?4,00,000" or "100000-400000"

    let match = text.match(
        /(?:\u20B9|inr|rs\.?|rupees?)?\s*([\d,]{4,}(?:\.\d+)?)\s*(?:-|to)\s*(?:\u20B9|inr|rs\.?|rupees?)?\s*([\d,]{4,}(?:\.\d+)?)\b/i
    );
    if (match) {
        return `${match[1].replace(/,/g, "")}-${match[2].replace(/,/g, "")}`;
    }

    match = text.match(/under\s+(?:\u20B9|inr|rs\.?|rupees?)?\s*([\d,]{4,})\b/i);
    if (match) return match[1].replace(/,/g, "");

    match = text.match(/(?:\u20B9|inr|rs\.?|rupees?)\s*([\d,]+(?:\.\d+)?)\b/i);
    if (match) return match[1].replace(/,/g, "");

    // Chip/label style: "Custom React.js + Node.js (?1,50,000+)" or "(1,50,000+)"
    match = text.match(/\(([^)]{0,60})\)\s*$/);
    if (match && /(?:\u20B9|inr|rs\.?|rupees?|\+|\/-)/i.test(match[1])) {
        const insideNumber = match[1].match(/([\d,]{4,})/);
        if (insideNumber) return insideNumber[1].replace(/,/g, "");
    }

    match = text.match(/\b(\d+(?:\.\d+)?)\s*(k|thousand|thousands)\b/i);
    if (match) {
        const unit = match[2].toLowerCase();
        if (unit.startsWith("k")) return `${match[1]}k`;
        return `${match[1]}000`; // crude normalization for "thousand"
    }

    match = text.match(/\b(\d+(?:\.\d+)?)\s*(m|mn|million|millions)\b/i);
    if (match) return `${match[1]}M`;

    match = text.match(/\b(\d+(?:\.\d+)?)\s*(l)\b/i);
    if (match) return `${match[1]}L`;

    match = text.match(/\b(\d+(?:\.\d+)?)\s*lakh(s)?\b/i);
    if (match) return `${match[1]} lakh`;

    // Bare numeric budgets are common replies when the budget question is active.
    match = text.match(/^\s*([\d,]{4,})\s*(?:\+|\/-)?\s*$/);
    if (match) return match[1].replace(/,/g, "");

    match = text.match(/\b(\d{4,})\b/);
    if (match && /(budget|cost|price|inr|\u20B9|rs|rupees?)/i.test(text)) return match[1];

    // Fallback: comma-separated budgets in longer sentences (e.g. "budget is 95,000").
    match = text.match(/\b(?:budget|cost|price)\b[^0-9]{0,24}([\d,]{4,})\b/i);
    if (match) return match[1].replace(/,/g, "");

    return null;
};

const extractTimeline = (value = "") => {
    const text = normalizeText(value).replace(/\?/g, "");
    if (!text) return null;
    if (/^flexible$/i.test(text)) return "Flexible";

    let match = text.match(/\b(\d+\s*-\s*\d+)\s*(day|week|month|year)s?\b/i);
    if (match) {
        const range = match[1].replace(/\s*/g, "");
        const unit = match[2].toLowerCase();
        return `${range} ${unit}s`;
    }

    match = text.match(/\b(\d+)\s*(day|week|month|year)s?\b/i);
    if (match) {
        const count = parseInt(match[1], 10);
        const unit = match[2].toLowerCase();
        return `${count} ${unit}${count === 1 ? "" : "s"}`;
    }

    if (/\b(asap|urgent|immediately)\b/i.test(text)) return text;
    if (/\bby\b/i.test(text)) return text;
    if (/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\b/i.test(text)) return text;

    return null;
};

const extractTechDetailsFromMessage = (value = "") => {
    const text = normalizeText(value);
    if (!text) return [];

    const lower = text.toLowerCase();
    const markerMatch = lower.match(/\b(?:tech(?:nology)?\s*stack|tech\s*stack)\b\s*(?:is|:)?\s*/i);

    const scanForCommonTech = (sourceLower = "") => {
        const found = [];

        if (/\bexpress\b/.test(sourceLower)) found.push("Express");
        if (/\bmongo\s*db\b/.test(sourceLower) || /\bmongodb\b/.test(sourceLower)) found.push("MongoDB");
        if (/\bpostgres(?:ql)?\b/.test(sourceLower) || /\bpostgre\s*sql\b/.test(sourceLower)) found.push("PostgreSQL");
        if (/\bmysql\b/.test(sourceLower)) found.push("MySQL");
        if (/\bredis\b/.test(sourceLower)) found.push("Redis");
        if (/\bdocker\b/.test(sourceLower)) found.push("Docker");
        if (/\bprisma\b|\bpris(?:ma|em|m)\b/.test(sourceLower)) found.push("Prisma");
        if (/\bneon\s*db\b/.test(sourceLower)) found.push("Neon DB");
        if (/\bopen\s*-?\s*(?:source|sourse)\b/.test(sourceLower) && /\bmodel\b/.test(sourceLower)) {
            found.push("Open-source model");
        }

        return found;
    };

    const scanned = scanForCommonTech(lower);

    if (!markerMatch || typeof markerMatch.index !== "number") {
        return scanned;
    }

    const start = markerMatch.index + markerMatch[0].length;
    const tail = text.slice(start);
    const tailLower = tail.toLowerCase();

    const stopIndexes = [
        tailLower.search(/\bbudget\b/),
        tailLower.search(/\btimeline\b|\bdeadline\b/),
        tailLower.search(/\bdeploy(?:ment)?\b|\bhost(?:ing|ed)?\b/),
        tailLower.search(/\bdomain\b/),
        tailLower.search(/\b\d+\s*(?:day|week|month|year)s?\b/),
    ].filter((idx) => idx >= 0);

    const end = stopIndexes.length ? Math.min(...stopIndexes) : tail.length;
    const segmentRaw = tail.slice(0, end);

    const parts = segmentRaw
        .replace(/[\n\r]/g, " ")
        .split(/\s*(?:,|\/|&|\+|\band\b)\s*/i)
        .map((part) =>
            normalizeText(part)
                .replace(/^[\s,.;:-]+/, "")
                .replace(/^\s*(?:some\s+of\s+the|some\s+of|some|the|a|an)\b\s*/i, "")
                .replace(/\s+/g, " ")
                .trim()
        )
        .filter(Boolean);

    const normalized = parts.map((part) => {
        const p = part.toLowerCase();

        if (/\breact\b/.test(p) || /\breactjs\b/.test(p) || /\breact\.js\b/.test(p)) return "React.js";
        if (/\bnext\b/.test(p) || /\bnextjs\b/.test(p) || /\bnext\.js\b/.test(p)) return "Next.js";
        if (/\bnode\b/.test(p) || /\bnodejs\b/.test(p) || /\bnode\.js\b/.test(p)) return "Node.js";
        if (/\bpris(?:ma|em|m)\b/.test(p)) return "Prisma";
        if (/\bneon\b/.test(p)) return "Neon DB";
        if (/\bpostgres(?:ql)?\b/.test(p) || /\bpostgre\s*sql\b/.test(p)) return "PostgreSQL";
        if (/\bmongo(?:db)?\b/.test(p)) return "MongoDB";
        if (/\bmysql\b/.test(p)) return "MySQL";
        if (/\bopen\s*-?\s*(?:source|sourse)\b/.test(p) && /\bmodel\b/.test(p)) return "Open-source model";

        return part;
    });

    const seen = new Set();
    const unique = [];
    for (const item of normalized) {
        const canon = canonicalize(item.toLowerCase());
        if (!canon) continue;
        if (seen.has(canon)) continue;
        seen.add(canon);
        unique.push(item);
    }

    // Merge scanned values with marker-based parsing (dedupe).
    for (const item of scanned) {
        const canon = canonicalize(item.toLowerCase());
        if (!canon) continue;
        if (seen.has(canon)) continue;
        seen.add(canon);
        unique.push(item);
    }

    return unique;
};

const formatInr = (amount) => {
    if (!Number.isFinite(amount)) return "";
    try {
        return `?${Math.round(amount).toLocaleString("en-IN")}`;
    } catch {
        return `?${Math.round(amount)}`;
    }
};

const inferPagesFromBrief = (pagesQuestion, rawText = "", websiteTypeHint = "") => {
    if (!pagesQuestion || !Array.isArray(pagesQuestion?.suggestions) || !pagesQuestion.suggestions.length) {
        return [];
    }

    const text = normalizeForSuggestionMatching(rawText);
    if (!text) return [];

    const lower = text.toLowerCase();
    const websiteTypeLower = normalizeText(websiteTypeHint).toLowerCase();

    const suggestions = pagesQuestion.suggestions;
    const suggestionsByCanon = new Map();
    for (const option of suggestions) {
        const canon = canonicalize(String(option || "").toLowerCase());
        if (canon) suggestionsByCanon.set(canon, option);
    }

    const picked = new Set();
    const add = (label) => {
        const canon = canonicalize(String(label || "").toLowerCase());
        if (!canon) return;
        const option = suggestionsByCanon.get(canon);
        if (!option) return;
        if (canonicalize(String(option).toLowerCase()) === "none") return;
        picked.add(option);
    };

    const isEcommerce =
        /\be\s*-?\s*commerce\b|\becommerce\b|\bonline\s+store\b|\bonline\s+shop\b/i.test(lower) ||
        /\be\s*-?\s*commerce\b|\becommerce\b|\bonline\s+store\b|\bonline\s+shop\b/i.test(websiteTypeLower);

    if (isEcommerce) add("Shop/Store");

    if (
        /\bproducts?\b/i.test(lower) ||
        /\bproduct\s+categor/i.test(lower) ||
        /\bcatalog(?:ue)?\b/i.test(lower) ||
        /\binventory\b/i.test(lower) ||
        /\bsku\b/i.test(lower)
    ) {
        add("Products");
    }

    if (/\bsearch\b|\bfilters?\b|\bsort(?:ing)?\b/i.test(lower)) add("Search");
    if (/\breviews?\b|\bratings?\b|\bstars?\b/i.test(lower)) add("Reviews/Ratings");

    if (/\bwishlist\b|\bfavou?rites?\b|\bsave\s+for\s+later\b/i.test(lower)) add("Wishlist");

    if (
        /\bcart\b|\bcheckout\b|\bpayments?\b|\bpay\b|\brazorpay\b|\bstripe\b/i.test(lower)
    ) {
        add("Cart/Checkout");
    }

    if (
        /\border\s*tracking\b|\btrack\s*order\b|\btracking\b.*\border\b|\border\b.*\btracking\b/i.test(
            lower
        )
    ) {
        add("Order Tracking");
    }

    if (
        /\bsign\s*up\b|\bsignup\b|\bregister\b|\blog\s*in\b|\blogin\b|\bauth(?:entication)?\b|\bjwt\b/i.test(
            lower
        )
    ) {
        add("Account/Login");
    }

    const hasAdminPanel =
        /\badmin\s*(?:panel|dashboard|portal|console|section|area)\b/i.test(lower) ||
        /\bmanage\s+(?:products?|orders?|users?|inventory|stock|catalog|prices?|pricing)\b/i.test(lower) ||
        /\b(?:product|order|user|inventory|stock|catalog)\s+management\b/i.test(lower) ||
        /\b(?:update|edit)\s+(?:prices?|pricing|stock|inventory)\b/i.test(lower) ||
        /\b(?:coupons?|discounts?|promo\s*codes?)\b/i.test(lower);

    if (hasAdminPanel) add("Admin Dashboard");

    if (/\banalytics\b|\breports?\b|\bmetrics\b|\binsights?\b/i.test(lower)) add("Analytics Dashboard");
    if (/\bnotifications?\b|\bemail\s+notifications?\b|\balerts?\b|\bsms\b|\bpush\b/i.test(lower)) {
        add("Notifications");
    }

    if (
        /\blive\s+chat\b|\bchat\s+widget\b|\bsupport\s+widget\b|\bcustomer\s+support\s+chat\b|\bwhatsapp\b/i.test(
            lower
        )
    ) {
        add("Chat/Support Widget");
    }

    if (/\bfaq\b|\bfrequently\s+asked\b/i.test(lower)) add("FAQ");
    if (/\bblog\b|\barticles?\b|\bposts?\b/i.test(lower)) add("Blog");
    if (/\btestimonials?\b|\bcustomer\s+stories\b/i.test(lower)) add("Testimonials");
    if (
        /\bpricing\b/i.test(lower) ||
        /\bplans?\s+and\s+pricing\b/i.test(lower) ||
        /\bsubscription\s+plans?\b/i.test(lower) ||
        /\bprice\s*plans?\b/i.test(lower)
    ) {
        add("Pricing");
    }
    if (/\bportfolio\b|\bgallery\b|\blookbook\b/i.test(lower)) add("Portfolio/Gallery");
    if (/\bbook\s*now\b|\bbooking\b|\bappointments?\b|\bschedule\b/i.test(lower)) add("Book Now");
    if (/\bresources?\b|\bdownloads?\b|\bdocumentation\b|\bdocs\b/i.test(lower)) add("Resources");
    if (/\bevents?\b|\bevent\s+calendar\b/i.test(lower)) add("Events");

    if (/\b3d\b/i.test(lower) && /\banimations?\b|\banimation\b/i.test(lower)) add("3D Animations");
    if (/\b3d\b/i.test(lower) && /\b(?:model\s+viewer|3d\s+viewer|viewer)\b/i.test(lower)) {
        add("3D Model Viewer");
    }

    const ordered = suggestions.filter((option) => picked.has(option));

    // Only treat this as reliable when we picked multiple high-signal pages/features.
    if (ordered.length < 2 && !isEcommerce) return [];
    return ordered;
};

const splitSelections = (value = "") =>
    normalizeText(value)
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);

const parseInrAmount = (value = "") => {
    const text = normalizeText(value)
        .replace(/\?/g, "")
        .replace(/[?,]/g, "")
        .replace(/\/-|\+/g, "")
        .trim()
        .toLowerCase();

    if (!text) return null;

    const cleaned = text.replace(/\b(inr|rs|rupees?)\b/g, "").trim();

    let match = cleaned.match(/^(\d+(?:\.\d+)?)\s*k$/i);
    if (match) return Math.round(parseFloat(match[1]) * 1000);

    match = cleaned.match(/^(\d+(?:\.\d+)?)\s*l$/i);
    if (match) return Math.round(parseFloat(match[1]) * 100000);

    match = cleaned.match(/^(\d+(?:\.\d+)?)\s*lakh$/i);
    if (match) return Math.round(parseFloat(match[1]) * 100000);

    match = cleaned.match(/^(\d+(?:\.\d+)?)\s*lakhs$/i);
    if (match) return Math.round(parseFloat(match[1]) * 100000);

    match = cleaned.match(/(\d+)/);
    if (match) return parseInt(match[1], 10);

    return null;
};

const parseInrBudgetRange = (value = "") => {
    const text = normalizeText(value).replace(/\?/g, "");
    if (!text) return null;
    if (/^flexible$/i.test(text)) return { flexible: true };

    const rangeMatch = text.match(/(.+?)\s*(?:-|–|to)\s*(.+)/i);
    if (rangeMatch) {
        const min = parseInrAmount(rangeMatch[1]);
        const max = parseInrAmount(rangeMatch[2]);
        if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
        return {
            min: Math.min(min, max),
            max: Math.max(min, max),
        };
    }

    const single = parseInrAmount(text);
    if (!Number.isFinite(single)) return null;
    return { min: single, max: single };
};

const parseMinInrFromLabel = (value = "") => {
    const text = normalizeText(value);
    if (!text) return null;
    const matches = text.match(/(\d[\d,]*)/g);
    if (!matches || matches.length === 0) return null;
    const numbers = matches
        .map((item) => parseInt(item.replace(/,/g, ""), 10))
        .filter((num) => Number.isFinite(num));
    if (!numbers.length) return null;
    return Math.min(...numbers);
};

const findBudgetQuestion = (questions = []) => {
    const list = Array.isArray(questions) ? questions : [];
    return (
        list.find((question) => {
            const key = question?.key || "";
            const tags = Array.isArray(question?.tags) ? question.tags : getQuestionTags(question);
            return key.includes("budget") || tags.includes("budget");
        }) || null
    );
};

const resolveCataBudgetMinimum = (questions = []) => {
    const budgetQuestion = findBudgetQuestion(questions);
    const suggestions = Array.isArray(budgetQuestion?.suggestions)
        ? budgetQuestion.suggestions
        : [];
    let min = null;
    for (const suggestion of suggestions) {
        const candidate = parseMinInrFromLabel(suggestion);
        if (!Number.isFinite(candidate)) continue;
        if (min === null || candidate < min) {
            min = candidate;
        }
    }
    return Number.isFinite(min) ? min : null;
};

const formatBudgetDisplay = (range) => {
    if (!range) return "";
    if (range.flexible) return "Flexible";
    if (!Number.isFinite(range.min) || !Number.isFinite(range.max)) return "";
    if (range.min === range.max) return formatInr(range.min);
    return `${formatInr(range.min)} - ${formatInr(range.max)}`;
};

const resolveMinimumWebsiteBudget = (collectedData = {}) => {
    const techSelections = splitSelections(collectedData.tech);
    const tech = techSelections.join(" ").toLowerCase();
    const pages = splitSelections(collectedData.pages).join(" ").toLowerCase();
    const description = normalizeText(collectedData.description).toLowerCase();
    const buildModeRaw = normalizeText(collectedData.build_mode).toLowerCase();
    const buildModeCanon = canonicalize(buildModeRaw);
    const isCustomCodeMode =
        buildModeCanon.includes("customcode") || buildModeCanon.includes("codedwebsite");

    const wants3D =
        pages.includes("3d ") ||
        pages.startsWith("3d") ||
        pages.includes("3d animations") ||
        pages.includes("3d model") ||
        /\b3d\b/.test(description) ||
        /\b(?:virtual\s*try\s*-?\s*on|try\s*-?\s*on|augmented\s+reality|\bar\b|face\s*filter|shade\s*(?:match|test))\b/i.test(
            description
        );

    const hasWordPress = tech.includes("wordpress");
    const hasCustomShopify = tech.includes("hydrogen");
    const hasShopify = tech.includes("shopify");
    const hasNext = tech.includes("next.js");
    const hasReact = tech.includes("react.js");
    const hasCustomReactNode =
        tech.includes("react.js + node.js") ||
        tech.includes("mern") ||
        tech.includes("pern");
    const hasReactStack = tech.includes("react");
    const hasNode = tech.includes("node.js") || tech.includes("nodejs");
    const hasLaravel = tech.includes("laravel");
    const hasDjango = tech.includes("django");
    const hasVue = tech.includes("vue");
    const hasPython = tech.includes("python");
    const hasPhp = tech.includes("php");

    const isCustomCodeTech =
        hasCustomShopify ||
        hasNext ||
        hasCustomReactNode ||
        hasReactStack ||
        hasNode ||
        hasLaravel ||
        hasDjango ||
        hasVue ||
        hasPython ||
        hasPhp;

    if (isCustomCodeMode || isCustomCodeTech) {
        if (wants3D) {
            return { key: "custom_3d", label: "3D Custom Website", min: 30000, wants3D: true, range: null };
        }
        return { key: "custom_code", label: "Custom coded website", min: 30000, wants3D: false, range: null };
    }

    const bases = [
        { when: hasWordPress, key: "wordpress", label: "WordPress", min: 30000 },
        { when: hasReact, key: "react", label: "React.js", min: 60000 },
        { when: hasCustomShopify, key: "custom_shopify", label: "Custom Shopify", min: 80000 },
        { when: hasShopify, key: "shopify", label: "Shopify", min: 30000 },
        { when: hasNext, key: "nextjs", label: "Next.js", min: 175000 },
        { when: hasCustomReactNode, key: "custom_react_node", label: "Custom React.js + Node.js", min: 150000 },
    ].filter((b) => b.when);

    const base =
        bases.length > 0
            ? bases.reduce((best, current) => (current.min > best.min ? current : best))
            : { key: "website", label: "Website", min: 30000 };

    if (!wants3D) {
        return { ...base, wants3D: false, range: null };
    }

    if (base.key === "wordpress") {
        return { key: "wordpress_3d", label: "3D WordPress", min: 45000, wants3D: true, range: null };
    }

    const range = { min: 100000, max: 400000 };
    return {
        key: "custom_3d",
        label: "3D Custom Website",
        min: Math.max(base.min, range.min),
        wants3D: true,
        range,
        baseKey: base.key,
        baseLabel: base.label,
    };
};

const validateWebsiteBudget = (collectedData = {}) => {
    const rawBudget = collectedData?.budget;
    const requirement = resolveMinimumWebsiteBudget(collectedData);

    if (!rawBudget || rawBudget === "[skipped]" || /^flexible$/i.test(rawBudget)) {
        return { isValid: true, reason: null, requirement, parsed: null };
    }

    const parsed = parseInrBudgetRange(rawBudget);
    if (!parsed || parsed.flexible) {
        return { isValid: false, reason: "unparsed", requirement, parsed: null };
    }

    if (Number.isFinite(requirement?.min) && parsed.max < requirement.min) {
        return { isValid: false, reason: "too_low", requirement, parsed };
    }

    return { isValid: true, reason: null, requirement, parsed };
};

const LOW_BUDGET_SUGGESTIONS = ["Continue with this budget", "Increase budget"];
const LOW_BUDGET_CONFIRM_SUGGESTIONS = ["Confirm", "Increase budget"];

const isIncreaseBudgetDecision = (value = "") => {
    const canon = canonicalize(value);
    return (
        canon === "increasebudget" ||
        canon === "increase" ||
        canon === "raisebudget" ||
        canon === "raisethebudget" ||
        canon === "increaseyourbudget"
    );
};

const isProceedWithLowBudgetDecision = (value = "") => {
    const canon = canonicalize(value);
    return (
        canon === "continuewiththisbudget" ||
        canon === "continuewithcurrentbudget" ||
        canon === "continuewithbudget" ||
        canon === "continuebudget" ||
        canon === "proceedwithcurrentbudget" ||
        canon === "proceedwithbudget" ||
        canon === "proceedbudget" ||
        canon === "continue" ||
        canon === "proceed" ||
        canon === "goahead"
    );
};

const isLowBudgetConfirmDecision = (value = "") => {
    const canon = canonicalize(value);
    return (
        canon === "confirm" ||
        canon === "confirmed" ||
        canon === "yes" ||
        canon === "yesconfirm" ||
        canon === "yesproceed" ||
        canon === "yescontinue" ||
        isProceedWithLowBudgetDecision(value)
    );
};

const formatBudgetForWarning = (rawBudget = "") => {
    const range = parseInrBudgetRange(rawBudget);
    if (!range) return rawBudget;
    return formatBudgetDisplay(range) || rawBudget;
};

const formatMinimumBudgetLabel = (requirement) => {
    if (!requirement) return "";
    if (requirement.range) return formatBudgetDisplay(requirement.range);
    if (Number.isFinite(requirement.min)) return `${formatInr(requirement.min)}+`;
    return "";
};

const buildWebsiteBudgetSuggestions = (requirement) => {
    if (!requirement) return null;

    return ["Change technology"];
};

const NO_CODE_TECH_CANONS = new Set(["shopify", "wix", "godaddy", "webflow", "framer"]);
const WORDPRESS_TECH_CANON = "wordpress";

const normalizeTechSelectionCanons = (value = "") =>
    splitSelections(value)
        .map((part) => normalizeText(part))
        .filter(Boolean)
        .filter((part) => {
            const lower = part.toLowerCase();
            return lower !== "none" && lower !== "[skipped]";
        })
        .map((part) => canonicalize(part.toLowerCase()))
        .filter(Boolean);

const hasWordPressSelection = (value = "") =>
    normalizeTechSelectionCanons(value).some((canon) => canon.includes(WORDPRESS_TECH_CANON));

const hasNoCodePlatformSelection = (value = "") =>
    normalizeTechSelectionCanons(value).some((canon) => NO_CODE_TECH_CANONS.has(canon));

const resolveBuildModeFlags = (value = "") => {
    const canon = canonicalize(normalizeText(value).toLowerCase());
    if (!canon) return { isNoCode: false, isCustomCode: false };

    return {
        isNoCode: canon.includes("nocode"),
        isCustomCode: canon.includes("customcode") || canon.includes("codedwebsite"),
    };
};

const shouldSkipDeploymentQuestion = (collectedData = {}) => {
    const techValue = normalizeText(collectedData.tech || "");
    const buildModeValue = normalizeText(collectedData.build_mode || "");
    const { isNoCode, isCustomCode } = resolveBuildModeFlags(buildModeValue);

    if (hasWordPressSelection(techValue)) return false;
    if (isCustomCode) return false;
    if (isNoCode) return true;
    if (hasNoCodePlatformSelection(techValue)) return true;

    return false;
};

const shouldSkipQuestion = (question, collectedData = {}) => {
    if (!question || !Object.prototype.hasOwnProperty.call(question, "when")) {
        return false;
    }
    if (typeof question.when === "function") {
        return !question.when(collectedData);
    }
    if (typeof question.when === "boolean") {
        return !question.when;
    }
    return false;
};

const resolveMinimumWebsiteTimelineWeeks = (collectedData = {}) => {
    const normalizeSelections = (value = "") =>
        splitSelections(value)
            .map((part) => normalizeText(part))
            .filter(Boolean)
            .filter((part) => {
                const lower = part.toLowerCase();
                return lower !== "none" && lower !== "[skipped]";
            });

    const pagesRaw = normalizeText(collectedData.pages || collectedData.pages_inferred || "");
    const integrationsRaw = normalizeText(collectedData.integrations || "");
    const pages = normalizeSelections(pagesRaw);
    const integrations = normalizeSelections(integrationsRaw);

    if (!pages.length && !integrations.length) return null;

    const websiteType = normalizeText(collectedData.website_type).toLowerCase();
    const pageCanons = new Set(
        pages.map((part) => canonicalize(part.toLowerCase())).filter(Boolean)
    );
    const integrationCanons = new Set(
        integrations.map((part) => canonicalize(part.toLowerCase())).filter(Boolean)
    );

    const hasPage = (label = "") => pageCanons.has(canonicalize(label.toLowerCase()));
    const hasIntegration = (label = "") =>
        integrationCanons.has(canonicalize(label.toLowerCase()));

    const isEcommerce =
        websiteType.includes("e-commerce") ||
        websiteType.includes("ecommerce") ||
        hasPage("Shop/Store") ||
        hasPage("Cart/Checkout") ||
        hasIntegration("Payment Gateway (Razorpay/Stripe)");

    const isWebApp = websiteType.includes("web app") || websiteType.includes("webapp");

    const hasDashboards =
        hasPage("Admin Dashboard") || hasPage("User Dashboard") || hasPage("Analytics Dashboard");
    const hasAuth = hasPage("Account/Login");
    const hasOrders = hasPage("Order Tracking");
    const hasCommerceFeatures =
        hasPage("Cart/Checkout") || hasPage("Wishlist") || hasPage("Reviews/Ratings");
    const hasEngagement = hasPage("Notifications") || hasPage("Chat/Support Widget") || hasPage("Search");
    const has3D = hasPage("3D Animations") || hasPage("3D Model Viewer");

    const totalSelections = pages.length + integrations.length;
    const isComplex =
        isEcommerce ||
        isWebApp ||
        hasDashboards ||
        hasAuth ||
        hasOrders ||
        hasCommerceFeatures ||
        hasEngagement ||
        has3D ||
        integrations.length >= 2 ||
        totalSelections >= 4;

    if (!isComplex) return null;

    return { minWeeks: 4, label: "this feature set" };
};

const formatTimelineWeeksLabel = (weeks) => {
    if (!Number.isFinite(weeks)) return "";
    const rounded = Math.max(1, Math.round(weeks));
    if (rounded % 4 === 0) {
        const months = Math.max(1, Math.round(rounded / 4));
        return months === 1 ? "1 month" : `${months} months`;
    }
    return rounded === 1 ? "1 week" : `${rounded} weeks`;
};

const validateWebsiteTimeline = (collectedData = {}) => {
    const rawTimeline = collectedData?.timeline;
    const requirement = resolveMinimumWebsiteTimelineWeeks(collectedData);

    if (!rawTimeline || rawTimeline === "[skipped]" || /^flexible$/i.test(rawTimeline)) {
        return { isValid: true, reason: null, requirement, weeks: null };
    }

    const parsedWeeks = parseTimelineWeeks(rawTimeline);
    if (!parsedWeeks || !requirement) {
        return { isValid: true, reason: null, requirement, weeks: parsedWeeks };
    }

    if (Number.isFinite(requirement?.minWeeks) && parsedWeeks < requirement.minWeeks) {
        return { isValid: false, reason: "too_short", requirement, weeks: parsedWeeks };
    }

    return { isValid: true, reason: null, requirement, weeks: parsedWeeks };
};

const isBareBudgetAnswer = (value = "") => {
    const text = normalizeText(value)
        .replace(/\?/g, "")
        .toLowerCase();
    if (!text) return false;
    if (text === "flexible") return true;

    // Examples: "60000", "?60,000", "INR 60000", "60k", "1 lakh", "Under ?120,000"
    if (/^under\s+(?:\u20B9|inr|rs\.?|rupees?)?\s*\d[\d,]*(?:\.\d+)?\s*(?:k|l|lakh)?\s*$/i.test(text)) {
        return true;
    }

    return /^(?:(?:\u20B9|inr|rs\.?|rupees?)\s*)?\d[\d,]*(?:\.\d+)?\s*(?:k|l|lakh)?\s*$/.test(text);
};

const isBareTimelineAnswer = (value = "") => {
    const text = normalizeText(value)
        .replace(/[???]/g, "")
        .toLowerCase();
    if (!text) return false;
    if (text === "flexible") return true;
    if (/^(asap|urgent|immediately|this week|next week|next month)$/i.test(text)) return true;
    if (/^\d+\s*-\s*\d+\s*(day|week|month|year)s?$/.test(text)) return true;
    return /^\d+\s*(day|week|month|year)s?$/.test(text);
};

const isUserQuestion = (value = "") => {
    const text = normalizeText(value);
    if (!text) return false;
    // Treat as a question only when question-mark punctuation is present (not inside words like "I?m" or "?95,000").
    // This intentionally does NOT infer questions from leading words (e.g. "can you ...") unless the user
    // includes a question mark, so the chatbot doesn't break the questionnaire flow on statement-like inputs.
    if (!/[???](?![\p{L}\p{N}])/u.test(text)) return false;

    const withoutMarks = text.replace(/[???](?![\p{L}\p{N}])/gu, "");
    // Treat pure budget/timeline inputs as answers even if a user typed '?'. Otherwise it's a question.
    if (isBareBudgetAnswer(withoutMarks) || isBareTimelineAnswer(withoutMarks)) return false;
    return true;
};

const looksLikeProjectBrief = (value = "") => {
    const text = normalizeText(value);
    if (!text) return false;

    const lower = text.toLowerCase();
    const isLong = text.length >= 140;
    const hasMultipleSentences = (text.match(/[.!?\n]/g) || []).length >= 2;

    let signals = 0;

    if (/\bbudget\b/.test(lower) || /\b(inr|rs\.?|rupees?)\b/.test(lower) || lower.includes("?")) {
        signals += 1;
    }

    if (/\btimeline\b|\bdeadline\b/.test(lower) || /\b\d+\s*(day|week|month|year)s?\b/i.test(text)) {
        signals += 1;
    }

    if (
        /\btech\s*stack\b|\bstack\b|\breact\b|\bnext\b|\bnode\b|\bexpress\b|\bwordpress\b|\bshopify\b|\blaravel\b|\bdjango\b|\bmongodb\b|\bpostgres\b|\bmysql\b|\bprisma\b/i.test(
            lower
        )
    ) {
        signals += 1;
    }

    if (/\b(i\s+want|i\s+need|looking\s+to|build|create|develop|from\s+scratch)\b/i.test(lower)) {
        signals += 1;
    }

    if (/\b(features?|requirements?|must-?have|include|pages?)\b/i.test(lower)) {
        signals += 1;
    }

    // Long, multi-sentence messages that clearly talk about a website/app are usually a one-shot brief
    // even if the user doesn't explicitly say "features/requirements".
    if (
        /\b(website|web\s*app|app|platform|store|shop|marketplace|landing\s*page|portfolio|saas|e-?\s*commerce|ecommerce)\b/i.test(
            lower
        )
    ) {
        signals += 1;
    }

    if (
        /\b(?:users?|customers?|visitors?|people|clients?)\b/i.test(lower) &&
        /\b(?:can|should|able\s+to|must|need\s+to)\b/i.test(lower)
    ) {
        signals += 1;
    }

    // For shorter messages, require stronger evidence; for longer/multi-sentence briefs, a couple of signals is enough.
    if (isLong || hasMultipleSentences) return signals >= 2;
    return signals >= 3;
};

const stripTrailingQuestionSentence = (value = "") => {
    const text = normalizeText(value);
    const matches = Array.from(text.matchAll(/\?(?![a-z0-9])/gi));
    if (!matches.length) return text;
    const last = matches[matches.length - 1];
    const qIndex = typeof last?.index === "number" ? last.index : -1;
    if (qIndex < 0) return text;

    const before = text.slice(0, qIndex);
    const lastBoundary = Math.max(
        before.lastIndexOf("."),
        before.lastIndexOf("!"),
        before.lastIndexOf("\n")
    );

    // If we can't confidently split sentences, keep the original text.
    if (lastBoundary < 0) return text;

    const head = text.slice(0, lastBoundary + 1).trim();
    return head || text;
};

const NON_NAME_SINGLE_TOKENS = new Set([
    "there",
    "bro",
    "buddy",
    "sir",
    "madam",
    "maam",
    "mam",
    "boss",
    "team",
    "everyone",
    "guys",
    "all",
    "friend",
    "mate",
    "pal",
    "dude",
    "help",
    "support",
    "please",
    "plz",
    "thanks",
    "thankyou",
    "thx",
    "ok",
    "okay",
    "sure",
    "yes",
    "yep",
    "no",
    "nope",
    "nah",
]);

const isLikelyName = (value = "") => {
    const text = normalizeText(value).replace(/\?/g, "");
    if (!text) return false;
    if (text.length > 40) return false;
    if (isGreetingMessage(text)) return false;
    if (isUserQuestion(text)) return false;
    if (/\bhttps?:\/\//i.test(text) || /\bwww\./i.test(text)) return false;
    if (text.includes("@")) return false;
    if (/\d{2,}/.test(text)) return false;
    if (/\b(?:brand|company|business|project|product|app|website)\s+name\b/i.test(text)) {
        return false;
    }
    if (/\bname\b/i.test(text) && /\b(finali[sz]ed|already|set|confirmed)\b/i.test(text)) {
        return false;
    }

    const tokens = text
        .toLowerCase()
        .replace(/[^a-z'\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .filter(Boolean);

    if (tokens.length === 1 && NON_NAME_SINGLE_TOKENS.has(tokens[0])) return false;
    if (
        /(budget|timeline|website|web\s*app|app|project|proposal|quote|pricing|price|cost|estimate|generate|need|want|build|looking|landing|page|portfolio|e-?commerce|ecommerce|shopify|wordpress|react|next|mern|pern|saas|dashboard)\b/i.test(
            text
        )
    ) {
        return false;
    }
    return /[a-zA-Z]/.test(text);
};

const startsWithNonNameIntro = (value = "") => {
    const text = normalizeText(value).toLowerCase();
    if (!text) return false;

    const tokens = text
        .replace(/[^a-z'\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .filter(Boolean);

    if (!tokens.length) return false;
    const first = tokens[0];

    const blockedFirstTokens = new Set([
        "thinking",
        "looking",
        "planning",
        "trying",
        "working",
        "building",
        "creating",
        "developing",
        "here",
        "from",
        "based",
    ]);

    if (blockedFirstTokens.has(first)) return true;

    // Common non-name phrases: "I'm a developer", "I'm an agency", etc.
    if (tokens.length > 1 && /^(a|an|the)$/.test(first)) return true;

    // Role labels that commonly appear in introductions but aren't names.
    if (
        tokens.length <= 3 &&
        /\b(developer|designer|founder|owner|student|freelancer|agency|team|company)\b/i.test(text)
    ) {
        return true;
    }

    return false;
};

const extractName = (value = "") => {
    let text = normalizeText(value).replace(/\?/g, "");
    if (!text) return null;
    if (isGreetingMessage(text)) return null;

    // Handle common patterns like "hi kaif", "hello harsh" without treating the greeting as part of the name.
    const leadingGreeting = text.match(/^(?:hi|hey|yo|sup|hii+|hello|hell+o+w*|helo+|hlo+|hlw+)\b\s+(.+)$/i);
    if (leadingGreeting) {
        text = normalizeText(leadingGreeting[1]);
        if (!text) return null;
        if (isGreetingMessage(text)) return null;
    }

    const explicitMyName = text.match(/\bmy\s+name\s*(?:is|:)?\s+(.+)$/i);
    const explicitNameLabel = text.match(/^\s*name\s*(?:is|:)?\s+(.+)$/i);
    const explicitIAm = text.match(/\b(?:i\s+am|i['’\?]m|im|this\s+is)\s+(.+)$/i);

    const explicitMatch = explicitMyName || explicitNameLabel || explicitIAm;
    if (explicitMatch) {
        const candidate = trimEntity(explicitMatch[1]);
        const limited = candidate.split(/\s+/).slice(0, 3).join(" ");
        if (startsWithNonNameIntro(limited)) return null;
        return isLikelyName(limited) ? limited : null;
    }

    return isLikelyName(text) ? trimEntity(text) : null;
};

const extractExplicitName = (value = "") => {
    const text = normalizeText(value).replace(/\?/g, "");
    if (!text) return null;

    const patterns = [
        /\bmy\s+name\s*(?:is|:)?\s+(.+)/i,
        /^\s*name\s*(?:is|:)?\s+(.+)/i,
        /\b(?:i\s+am|i['’\?]m|im|this\s+is)\s+(.+)/i,
    ];

    let explicitMatch = null;
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            explicitMatch = match;
            break;
        }
    }
    if (!explicitMatch) return null;

    const candidate = trimEntity(explicitMatch[1]);
    const limited = candidate.split(/\s+/).slice(0, 3).join(" ");
    if (startsWithNonNameIntro(limited)) return null;
    return isLikelyName(limited) ? limited : null;
};

const stripInternalTags = (value = "") =>
    normalizeText(value)
        .replace(/\[(?:QUESTION_KEY|SUGGESTIONS|MULTI_SELECT|MAX_SELECT):[\s\S]*?\]/gi, "")
        .trim();

const extractNameFromAssistantMessage = (value = "") => {
    const text = stripInternalTags(value);
    if (!text) return null;

    // Common template across services: "Nice to meet you, {name}!"
    const match = text.match(/\bnice\s+to\s+meet\s+you,?\s+(.+?)(?:[!.,\n]|$)/i);
    if (!match) return null;

    const candidate = trimEntity(match[1]);
    const limited = candidate.split(/\s+/).slice(0, 3).join(" ");
    if (!limited) return null;
    if (isGreetingMessage(limited)) return null;
    return isLikelyName(limited) ? limited : null;
};

const shouldApplyWebsiteBudgetRules = (questions = []) =>
    questions.some((q) => q?.key === "tech") &&
    questions.some((q) => q?.key === "pages");

const getCurrentStepFromCollected = (questions = [], collectedData = {}) => {
    const applyWebsiteBudgetRules = shouldApplyWebsiteBudgetRules(questions);
    const applyWebsiteTimelineRules =
        applyWebsiteBudgetRules && questions.some((q) => q?.key === "timeline");
    const skipDeployment = shouldSkipDeploymentQuestion(collectedData);

    for (let i = 0; i < questions.length; i++) {
        const key = questions[i]?.key;
        if (!key) continue;
        if (shouldSkipQuestion(questions[i], collectedData)) {
            continue;
        }
        if (key === "deployment" && skipDeployment) {
            continue;
        }
        const value = collectedData[key];
        if (value === undefined || value === null || normalizeText(value) === "") {
            return i;
        }

        if (key === "budget" && applyWebsiteBudgetRules) {
            const budgetCheck = validateWebsiteBudget(collectedData);
            if (!budgetCheck.isValid) {
                return i;
            }
        }

        if (key === "timeline" && applyWebsiteTimelineRules) {
            const timelineCheck = validateWebsiteTimeline(collectedData);
            if (!timelineCheck.isValid) {
                return i;
            }
        }
    }
    return questions.length;
};

const buildLowBudgetWarning = (state) => {
    const questions = Array.isArray(state?.questions) ? state.questions : [];
    const cataConfig = getCataConfig(state?.service);
    if (cataConfig) {
        const resolvedService = resolveCataService(state?.service);
        if (resolvedService === "Website Development") {
            if (state?.meta?.allowLowBudget || state?.meta?.lowBudgetConfirmed) return null;
            const collectedData = state?.collectedData || {};
            const budgetQuestion = findBudgetQuestion(questions);
            const budgetKey = budgetQuestion?.key || "";
            const rawBudget = normalizeText(collectedData[budgetKey] || "");
            if (!rawBudget || rawBudget === "[skipped]") return null;

            const parsed = parseInrBudgetRange(rawBudget);
            if (!parsed || parsed.flexible) return null;
            if (Number.isFinite(parsed.max) && parsed.max >= CATA_WEBSITE_MIN_BUDGET) return null;

            return (
                "The budget you've entered is below the minimum amount required for this service.\n" +
                "Please note that if we proceed with this budget, the quality, scalability, and reliability of the website may vary."
            );
        }

        if (state?.meta?.allowLowBudget) return null;
        const collectedData = state?.collectedData || {};
        const budgetQuestion = findBudgetQuestion(questions);
        const budgetKey = budgetQuestion?.key || "";
        const rawBudget = normalizeText(collectedData[budgetKey] || "");
        if (!rawBudget || rawBudget === "[skipped]") return null;

        const minBudget = resolveCataBudgetMinimum(questions);
        if (!Number.isFinite(minBudget)) return null;

        const parsed = parseInrBudgetRange(rawBudget);
        if (!parsed || parsed.flexible) return null;
        if (Number.isFinite(parsed.max) && parsed.max >= minBudget) return null;

        const budgetLabel = formatBudgetDisplay(parsed) || rawBudget;
        const minLabel = formatInr(minBudget);
        return (
            `Your budget of ${budgetLabel} is below the minimum for this service (${minLabel}). ` +
            "This budget may be too low to attract freelancers. " +
            "Would you like to increase the budget or continue with the current budget?"
        );
    }
    if (!shouldApplyWebsiteBudgetRules(questions)) return null;
    if (state?.meta?.allowLowBudget) return null;

    const collectedData = state?.collectedData || {};
    const rawBudget = normalizeText(collectedData.budget || "");
    if (!rawBudget || rawBudget === "[skipped]") return null;
    const techValue = normalizeText(collectedData.tech || "");
    if (!techValue || techValue === "[skipped]") return null;

    const budgetCheck = validateWebsiteBudget(collectedData);
    if (!budgetCheck || budgetCheck.reason !== "too_low") return null;

    const requirement = budgetCheck.requirement || null;
    const techLabel =
        requirement?.label ||
        normalizeText(collectedData.tech || "") ||
        "this stack";
    const budgetLabel = formatBudgetForWarning(rawBudget) || rawBudget;
    const minLabel = formatMinimumBudgetLabel(requirement);
    const minSuffix = minLabel ? ` (${minLabel})` : "";
    return (
        `Your budget (${budgetLabel}) is below the minimum for ${techLabel}${minSuffix}. ` +
        "This may be too low to deliver the project at a professional standard. " +
        "Would you like to increase your budget or continue with the current budget?"
    );
};

const getQuestionFocusKeyFromUserMessage = (questions = [], message = "") => {
    const text = normalizeText(message);
    if (!text) return null;

    // When the user message contains a question mark but also includes a long brief,
    // only use the *question sentence* to decide what they're asking about.
    const focusText = (() => {
        const matches = Array.from(text.matchAll(/\?(?![a-z0-9])/gi));
        if (!matches.length) return text;
        const last = matches[matches.length - 1];
        const qIndex = typeof last?.index === "number" ? last.index : -1;
        if (qIndex < 0) return text;
        const before = qIndex >= 0 ? text.slice(0, qIndex) : text;
        const lastBoundary = Math.max(
            before.lastIndexOf("."),
            before.lastIndexOf("!"),
            before.lastIndexOf("\n")
        );
        const start = lastBoundary >= 0 ? lastBoundary + 1 : 0;
        return text.slice(start);
    })();

    const messageLower = focusText.toLowerCase();
    const messageCanonical = canonicalize(messageLower);
    if (!messageCanonical) return null;

    let bestKey = null;
    let bestScore = 0;

    for (const question of questions) {
        const key = question?.key;
        if (!key) continue;

        const patterns = new Set();
        patterns.add(key.replace(/_/g, " "));
        if (Array.isArray(question.patterns)) {
            for (const pattern of question.patterns) {
                const cleaned = normalizeText(pattern);
                if (cleaned) patterns.add(cleaned);
            }
        }

        let score = 0;
        for (const pattern of patterns) {
            const patternLower = pattern.toLowerCase();
            if (!patternLower) continue;

            if (!patternLower.includes(" ")) {
                const re = new RegExp(`\\b${escapeRegExp(patternLower)}\\b`, "i");
                if (re.test(messageLower)) score += Math.min(patternLower.length, 12);
                continue;
            }

            const patternCanonical = canonicalize(patternLower);
            if (patternCanonical && messageCanonical.includes(patternCanonical)) {
                score += Math.min(patternCanonical.length, 16);
            }
        }

        if (score > bestScore) {
            bestKey = key;
            bestScore = score;
        }
    }

    if (!bestKey || bestScore < 4) return null;
    return bestKey;
};

const extractKnownFieldsFromMessage = (questions = [], message = "", collectedData = {}) => {
    const text = normalizeText(message);
    if (!text || isGreetingMessage(text)) return {};
    const userAskedQuestion = isUserQuestion(text);
    const isBrief = looksLikeProjectBrief(text);
    const treatAsQuestionForInference = userAskedQuestion && !isBrief;
    const extractionText = isBrief ? stripTrailingQuestionSentence(text) : text;
    const parsingText = stripMarkdownFormatting(extractionText);

    const keys = new Set(questions.map((q) => q.key));
    const updates = {};

    if (keys.has("budget")) {
        const budget = extractBudget(parsingText);
        if (budget) {
            const hasBudgetCue =
                /\b(budget|cost|price|spend)\b/i.test(parsingText) ||
                /\b(inr|rs\.?|rupees?)\b/i.test(parsingText) ||
                parsingText.includes("\u20B9");
            if (hasBudgetCue || isBareBudgetAnswer(parsingText)) {
                updates.budget = budget;
            }
        }
    }

    if (keys.has("timeline")) {
        const timeline = extractTimeline(parsingText);
        if (timeline) updates.timeline = timeline;
    }

    if (keys.has("name") && !collectedData.name) {
        // Only extract a name out-of-sequence when it's explicitly stated, to avoid
        // misclassifying values like "portfolio" or "landing page" as a person's name.
        const name = extractExplicitName(parsingText);
        if (name) updates.name = name;
    }

    const orgKey = keys.has("company")
        ? "company"
        : keys.has("business_name")
            ? "business_name"
            : keys.has("business")
                ? "business"
                : keys.has("brand")
                    ? "brand"
                    : keys.has("project")
                        ? "project"
                        : null;

    if (orgKey && !collectedData[orgKey]) {
        const org = extractOrganizationName(parsingText);
        if (org) updates[orgKey] = org;
    }

    const descriptionKey =
        keys.has("brief")
            ? "brief"
            : keys.has("description")
                ? "description"
                : keys.has("summary")
                    ? "summary"
                    : keys.has("vision")
                        ? "vision"
                        : keys.has("problem")
                            ? "problem"
                            : keys.has("business_info")
                                ? "business_info"
                                : null;

    if (descriptionKey && !collectedData[descriptionKey] && !treatAsQuestionForInference) {
        const description = extractDescriptionFromMixedMessage(parsingText);
        if (description) {
            updates[descriptionKey] = description;
        } else if (isBrief) {
            updates[descriptionKey] = parsingText;
        }
    }

    if (keys.has("tech") && !collectedData.tech && !treatAsQuestionForInference) {
        const techSelections = extractTechDetailsFromMessage(parsingText);
        if (techSelections.length) updates.tech = techSelections.join(", ");
    }

    if (keys.has("pages") && !collectedData.pages && !collectedData.pages_inferred && isBrief) {
        const pagesQuestion = questions.find((q) => q.key === "pages");
        const inferred = inferPagesFromBrief(
            pagesQuestion,
            parsingText,
            collectedData.website_type || ""
        );
        if (inferred.length) {
            updates.pages_inferred = inferred.join(", ");
        }
    }

    return updates;
};

const extractAnswerForQuestion = (question = {}, rawMessage = "") => {
    const rawText = normalizeText(rawMessage);
    if (!rawText) return null;

    const message = stripMarkdownFormatting(rawText);
    if (!message) return null;

    if (isSkipMessage(message)) return "[skipped]";

    switch (question?.key) {
        case "name": {
            return extractName(message);
        }
        case "budget": {
            if (isChangeTechnologyMessage(message)) return CHANGE_TECH_SENTINEL;
            const budget = extractBudget(message);
            if (budget) return budget;

            const exactSelections = matchExactSuggestionSelections(question, message);
            if (exactSelections.length) {
                const parsed = extractBudget(exactSelections[0]);
                if (parsed) return parsed;
            }

            const suggestionMatches = matchSuggestionsInMessage(question, message);
            if (suggestionMatches.length) {
                const parsed = extractBudget(suggestionMatches[0]);
                if (parsed) return parsed;
            }

            return null;
        }
        case "timeline": {
            const timeline = extractTimeline(message);
            if (timeline) return timeline;
            break;
        }
        case "tech": {
            const techSelections = extractTechDetailsFromMessage(message);
            if (techSelections.length) return techSelections.join(", ");
            break;
        }
        case "company":
        case "business_name":
        case "business":
        case "brand":
        case "project": {
            const org = extractOrganizationName(message);
            if (org) return org;

            const trimmed = trimEntity(message);
            if (!trimmed) return null;
            if (trimmed.length > 60) return null;
            if (
                /\b(website|web\s*app|app|application|platform|store|shop|marketplace|dashboard|landing\s*page|portfolio|saas|e-?\s*commerce|ecommerce)\b/i.test(
                    trimmed
                )
            ) {
                return null;
            }

            return trimmed;
        }
        default: {
            const exactSelections = matchExactSuggestionSelections(question, message);
            if (exactSelections.length) {
                const limitedMatches =
                    question.multiSelect &&
                    Number.isFinite(question.maxSelect) &&
                    question.maxSelect > 0
                        ? exactSelections.slice(0, question.maxSelect)
                        : exactSelections;

                return question.multiSelect ? limitedMatches.join(", ") : limitedMatches[0];
            }

            const suggestionMatches = matchSuggestionsInMessage(question, message);
            if (suggestionMatches.length) {
                const limitedMatches =
                    question.multiSelect &&
                    Number.isFinite(question.maxSelect) &&
                    question.maxSelect > 0
                        ? suggestionMatches.slice(0, question.maxSelect)
                        : suggestionMatches;

                return question.multiSelect ? limitedMatches.join(", ") : limitedMatches[0];
            }

            if (Array.isArray(question.suggestions) && question.suggestions.length) {
                // If this is a closed-set question and nothing matched, avoid incorrectly
                // capturing a long multi-field message as the answer.
                if (message.length > 80) return null;
            }

            if (isUserQuestion(message)) {
                const qMatch = message.match(/\?(?![a-z0-9])/i);
                const qIndex = qMatch && typeof qMatch.index === "number" ? qMatch.index : -1;
                const beforeQuestion = qIndex >= 0 ? message.slice(0, qIndex).trim() : "";
                const cutAt = Math.max(
                    beforeQuestion.lastIndexOf("."),
                    beforeQuestion.lastIndexOf("!"),
                    beforeQuestion.lastIndexOf("\n")
                );
                const candidate = (cutAt > -1
                    ? beforeQuestion.slice(0, cutAt)
                    : beforeQuestion
                ).trim();

                if (!candidate) return null;
                if (isUserQuestion(candidate)) return null;
                if (isBareBudgetAnswer(candidate) || isBareTimelineAnswer(candidate)) return null;
                if (extractBudget(candidate) && candidate.length <= 30) return null;
                if (extractTimeline(candidate) && candidate.length <= 30) return null;

                return candidate;
            }

            // Avoid capturing pure budget/timeline answers for unrelated questions.
            if (isBareBudgetAnswer(message) || isBareTimelineAnswer(message)) return null;
            const budget = extractBudget(message);
            if (budget && message.length <= 30) return null;
            const timeline = extractTimeline(message);
            if (timeline && message.length <= 30) return null;

            return message;
        }
    }
};


const DEFAULT_CURRENCY = "INR";

const detectCurrency = (text = "", locale = "en-IN") => {
    if (!text) return DEFAULT_CURRENCY;
    if (text.includes("$")) return "USD";
    if (text.includes("\u20B9")) return "INR";
    if (text.includes("\u20AC")) return "EUR";
    if (text.includes("\u00A3")) return "GBP";
    const codeMatch = text.match(/\b(INR|USD|EUR|GBP)\b/i);
    if (codeMatch) return codeMatch[1].toUpperCase();
    if (/\b(rs\.?|rupees?)\b/i.test(text)) return "INR";
    if ((locale || "").toLowerCase().includes("en-in")) return "INR";
    return DEFAULT_CURRENCY;
};

const parseMoneyToken = (raw = "") => {
    const cleaned = normalizeText(raw).replace(/,/g, "").toLowerCase();
    if (!cleaned) return null;
    const match = cleaned.match(
        /^(\d+(?:\.\d+)?)(?:\s*(k|m|mn|l|lakh|lakhs|million))?$/
    );
    if (!match) return null;
    const value = parseFloat(match[1]);
    if (!Number.isFinite(value)) return null;
    const suffix = match[2];
    if (!suffix) return value;
    if (suffix === "k") return value * 1000;
    if (suffix === "m" || suffix === "mn" || suffix === "million") return value * 1000000;
    if (suffix === "l" || suffix === "lakh" || suffix === "lakhs") return value * 100000;
    return value;
};

const normalizeMoneyValue = (raw = "", locale = "en-IN") => {
    const text = normalizeText(raw);
    if (!text) return { status: "invalid", error: "empty" };
    if (/^flexible$/i.test(text)) {
        return { status: "ok", normalized: { flexible: true, currency: detectCurrency(text, locale) }, confidence: 0.7 };
    }

    const lowered = text.toLowerCase().replace(/[–—]/g, "-");
    const currency = detectCurrency(lowered, locale);
    const period = /\b(per\s+month|monthly|\/month)\b/i.test(lowered) ? "month" : null;

    const rangeMatch = lowered.match(
        /(\d[\d,]*(?:\.\d+)?\s*(?:k|m|mn|l|lakh|lakhs|million)?)\s*(?:-|to)\s*(\d[\d,]*(?:\.\d+)?\s*(?:k|m|mn|l|lakh|lakhs|million)?)/i
    );
    if (rangeMatch) {
        const min = parseMoneyToken(rangeMatch[1]);
        const max = parseMoneyToken(rangeMatch[2]);
        if (Number.isFinite(min) && Number.isFinite(max)) {
            const low = Math.min(min, max);
            const high = Math.max(min, max);
            return {
                status: "ok",
                normalized: { min: low, max: high, currency, period },
                confidence: currency ? 0.85 : 0.7,
            };
        }
    }

    const underMatch = lowered.match(
        /\b(under|less than|below)\b[^0-9]*([\d,]+(?:\.\d+)?\s*(?:k|m|mn|l|lakh|lakhs|million)?)/i
    );
    if (underMatch) {
        const max = parseMoneyToken(underMatch[2]);
        if (Number.isFinite(max)) {
            return {
                status: "ok",
                normalized: { min: null, max, currency, period },
                confidence: currency ? 0.8 : 0.6,
            };
        }
    }

    const tokenMatch = lowered.match(/[\d,]+(?:\.\d+)?\s*(?:k|m|mn|l|lakh|lakhs|million)?/i);
    if (tokenMatch) {
        const amount = parseMoneyToken(tokenMatch[0]);
        if (Number.isFinite(amount)) {
            return {
                status: "ok",
                normalized: { min: amount, max: amount, currency, period },
                confidence: currency ? 0.9 : 0.75,
            };
        }
    }

    return { status: "invalid", error: "money_format" };
};

const NUMBER_WORDS = new Map([
    ["one", 1],
    ["two", 2],
    ["three", 3],
    ["four", 4],
    ["five", 5],
    ["six", 6],
    ["seven", 7],
    ["eight", 8],
    ["nine", 9],
    ["ten", 10],
    ["eleven", 11],
    ["twelve", 12],
]);

const parseNumberWordOrDigit = (value = "") => {
    const trimmed = normalizeText(value).toLowerCase();
    if (!trimmed) return null;
    if (NUMBER_WORDS.has(trimmed)) return NUMBER_WORDS.get(trimmed);
    const num = parseFloat(trimmed);
    return Number.isFinite(num) ? num : null;
};

const normalizeDurationValue = (raw = "", allowedUnits = null) => {
    const text = normalizeText(raw);
    if (!text) return { status: "invalid", error: "empty" };
    const lowered = text.toLowerCase();

    if (/^flexible$/.test(lowered) || /\bongoing\b/.test(lowered)) {
        return { status: "ok", normalized: { flexible: true, label: text }, confidence: 0.7 };
    }

    if (/\bby\b/.test(lowered) || /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\b/.test(lowered)) {
        return { status: "ok", normalized: { label: text, kind: "date" }, confidence: 0.7 };
    }

    const normalized = lowered.replace(/[–—]/g, "-");
    const rangeMatch = normalized.match(
        /(\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(?:-|to)\s*(\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(day|week|month|year)s?/i
    );
    if (rangeMatch) {
        const min = parseNumberWordOrDigit(rangeMatch[1]);
        const max = parseNumberWordOrDigit(rangeMatch[2]);
        const unit = rangeMatch[3].toLowerCase();
        if (Number.isFinite(min) && Number.isFinite(max)) {
            return {
                status: "ok",
                normalized: { min, max, unit },
                confidence: 0.85,
            };
        }
    }

    const singleMatch = normalized.match(
        /(\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(day|week|month|year)s?/i
    );
    if (singleMatch) {
        const value = parseNumberWordOrDigit(singleMatch[1]);
        const unit = singleMatch[2].toLowerCase();
        if (Number.isFinite(value)) {
            return { status: "ok", normalized: { value, unit }, confidence: 0.9 };
        }
    }

    const quickUnits = allowedUnits && allowedUnits.length ? allowedUnits : ["week", "month"];
    const bareNumber = parseNumberWordOrDigit(normalized);
    if (Number.isFinite(bareNumber)) {
        return {
            status: "ambiguous",
            options: quickUnits.map((unit) => `${bareNumber} ${unit}${bareNumber === 1 ? "" : "s"}`),
            confidence: 0.3,
        };
    }

    return { status: "invalid", error: "duration_format" };
};

const normalizeNumberRangeValue = (raw = "") => {
    const text = normalizeText(raw);
    if (!text) return { status: "invalid", error: "empty" };
    const lowered = text.toLowerCase().replace(/[–—]/g, "-");

    const rangeMatch = lowered.match(/(\d+(?:\.\d+)?)[\s-]*(?:to|-)[\s-]*(\d+(?:\.\d+)?)/);
    if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[2]);
        if (Number.isFinite(min) && Number.isFinite(max)) {
            return {
                status: "ok",
                normalized: { min, max },
                confidence: 0.8,
            };
        }
    }

    const singleMatch = lowered.match(/(\d+(?:\.\d+)?)(\+)?/);
    if (singleMatch) {
        const value = parseFloat(singleMatch[1]);
        if (Number.isFinite(value)) {
            const plus = Boolean(singleMatch[2]);
            return {
                status: "ok",
                normalized: plus ? { min: value, max: null } : { min: value, max: value },
                confidence: 0.75,
            };
        }
    }

    return { status: "invalid", error: "number_format" };
};

const normalizeSelectionValue = (question, raw = "", allowMultiple = false) => {
    const text = normalizeText(raw);
    if (!text) return { status: "invalid", error: "empty" };
    if (!Array.isArray(question?.suggestions) || question.suggestions.length === 0) {
        return { status: "ok", normalized: allowMultiple ? splitSelections(text) : text, confidence: 0.6 };
    }

    const exact = matchExactSuggestionSelections(question, text);
    if (exact.length) {
        const values = allowMultiple ? exact : [exact[0]];
        return { status: "ok", normalized: values, confidence: 0.9 };
    }

    const matches = matchSuggestionsInMessage(question, text);
    if (matches.length) {
        const values = allowMultiple ? matches : [matches[0]];
        return { status: "ok", normalized: values, confidence: 0.8 };
    }

    return { status: "invalid", error: "enum_mismatch" };
};

const normalizeTextValue = (raw = "") => {
    const text = normalizeText(raw);
    if (!text) return { status: "invalid", error: "empty" };
    return { status: "ok", normalized: text, confidence: 0.85 };
};

const formatSlotValue = (slot) => {
    if (!slot || slot.status !== "answered") return "";
    const value = slot.normalized;
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "number") return `${value}`;
    if (value.flexible && value.label) return value.label;
    if (value.kind === "date" && value.label) return value.label;
    if (value.min !== undefined || value.max !== undefined) {
        const min = Number.isFinite(value.min) ? value.min : null;
        const max = Number.isFinite(value.max) ? value.max : null;
        const unit = value.unit ? value.unit : "";
        const unitLabel = unit ? `${unit}${max !== 1 ? "s" : ""}` : "";
        if (min !== null && max !== null && min === max) {
            return unitLabel ? `${min} ${unitLabel}` : `${min}`;
        }
        if (min !== null && max !== null) {
            return unitLabel ? `${min}-${max} ${unitLabel}` : `${min}-${max}`;
        }
        if (max !== null) return unitLabel ? `${max} ${unitLabel}` : `${max}`;
        if (min !== null) return unitLabel ? `${min}+ ${unitLabel}` : `${min}+`;
    }
    if (value.value && value.unit) {
        const count = value.value;
        const unit = value.unit;
        return `${count} ${unit}${count === 1 ? "" : "s"}`;
    }
    return "";
};

const buildCollectedData = (questions = [], slots = {}) => {
    const collectedData = {};
    for (const question of questions) {
        const key = question?.key;
        if (!key) continue;
        const slot = slots[key];
        if (slot?.status === "answered") {
            const formatted = formatSlotValue(slot);
            if (formatted) collectedData[key] = formatted;
        } else if (slot?.status === "declined") {
            collectedData[key] = "[skipped]";
        }
    }
    return collectedData;
};

const shouldIgnoreSharedContext = (question = {}) => Boolean(question?.disableSharedContext);

const applyCataSharedContextUpdate = (sharedContext, question, slot, options = {}) => {
    if (!sharedContext || !question || !slot) return { updated: false };
    if (shouldIgnoreSharedContext(question)) return { updated: false };
    if (slot.status !== "answered") return { updated: false };
    const resolvedService = resolveCataService(options.service);
    if (!resolvedService) return { updated: false };
    const config = getCataConfig(resolvedService);
    if (!config) return { updated: false };

    const value = question.multiSelect ? slot.normalized : formatSlotValue(slot);
    const valueLabel = formatCataSharedValue(value);
    if (!valueLabel) return { updated: false };

    const existingValue = resolveCataSharedValue(sharedContext, question, resolvedService);
    const existingCompare = normalizeCataCompareValue(existingValue);
    const nextCompare = normalizeCataCompareValue(value);

    if (!existingCompare) {
        setCataSharedValue(sharedContext, question, value, resolvedService);
        return { updated: true };
    }

    if (existingCompare === nextCompare) {
        return { updated: false };
    }

    const priorConflict = options.existingConflict;
    if (priorConflict) {
        const previousCompare = normalizeCataCompareValue(priorConflict.previousValue);
        const proposedCompare = normalizeCataCompareValue(priorConflict.proposedValue);
        if (previousCompare && previousCompare === nextCompare) {
            return { updated: false };
        }
        if (proposedCompare && proposedCompare === nextCompare) {
            setCataSharedValue(sharedContext, question, value, resolvedService);
            return { updated: true };
        }
    }

    if (options.allowConflicts === false) {
        return { updated: false };
    }

    return {
        updated: false,
        conflict: {
            source: "cata",
            previousValue: formatCataSharedValue(existingValue),
            proposedValue: valueLabel,
            questionKey: question.key,
        },
    };
};

const applySharedContextUpdate = (sharedContext, question, slot, options = {}) => {
    if (!sharedContext || !question || !slot) return { updated: false };
    if (shouldIgnoreSharedContext(question)) return { updated: false };
    if (resolveCataService(options.service)) {
        return applyCataSharedContextUpdate(sharedContext, question, slot, options);
    }
    if (slot.status !== "answered") return { updated: false };
    const value = formatSlotValue(slot);
    if (!value || shouldSkipSharedValue(value)) return { updated: false };

    const target = resolveSharedContextTarget(question);
    if (!target) return { updated: false };

    const existingValue = resolveSharedContextValue(sharedContext, question, options.service);
    let existingCompare = normalizeSharedComparison(existingValue, target.field);
    if (target.field === "tech_preferences" && isTechPreferencePlaceholder(existingValue)) {
        existingCompare = "";
    }
    const nextCompare = normalizeSharedComparison(value, target.field);

    if (!existingCompare) {
        setSharedContextValue(sharedContext, target, value, options.service);
        return { updated: true };
    }

    if (existingCompare === nextCompare) {
        return { updated: false };
    }

    const priorConflict = options.existingConflict;
    if (priorConflict) {
        const previousCompare = normalizeSharedComparison(
            priorConflict.previousValue,
            target.field
        );
        const proposedCompare = normalizeSharedComparison(
            priorConflict.proposedValue,
            target.field
        );
        if (previousCompare && previousCompare === nextCompare) {
            return { updated: false };
        }
        if (proposedCompare && proposedCompare === nextCompare) {
            setSharedContextValue(sharedContext, target, value, options.service);
            return { updated: true };
        }
    }

    if (options.allowConflicts === false) {
        return { updated: false };
    }

    return {
        updated: false,
        conflict: {
            field: target.field,
            subfield: target.subfield,
            previousValue: existingValue,
            proposedValue: value,
            questionKey: question.key,
        },
    };
};

const mergeSharedContextFromState = (state) => {
    if (!state) return state;
    const resolvedService = resolveCataService(state.service);
    if (resolvedService) {
        const sharedContext = normalizeSharedContext(state.sharedContext);
        const questions = Array.isArray(state.questions) ? state.questions : [];
        const slots = state.slots || {};
        let updated = false;

        for (const question of questions) {
            if (!question?.key) continue;
            const slot = slots[question.key];
            if (!slot || slot.status !== "answered") continue;
            const value = question.multiSelect ? slot.normalized : formatSlotValue(slot);
            const valueLabel = formatCataSharedValue(value);
            if (!valueLabel) continue;

            const existingValue = resolveCataSharedValue(sharedContext, question, resolvedService);
            if (normalizeCataCompareValue(existingValue)) continue;

            setCataSharedValue(sharedContext, question, value, resolvedService);
            updated = true;
        }

        if (!updated) return state;
        return {
            ...state,
            sharedContext,
        };
    }
    const sharedContext = normalizeSharedContext(state.sharedContext);
    const questions = Array.isArray(state.questions) ? state.questions : [];
    const slots = state.slots || {};
    let updated = false;

    for (const question of questions) {
        if (!question?.key) continue;
        const slot = slots[question.key];
        if (!slot || slot.status !== "answered") continue;
        const target = resolveSharedContextTarget(question);
        if (!target) continue;
        const existingValue = resolveSharedContextValue(sharedContext, question, state.service);
        if (normalizeSharedComparison(existingValue, target.field)) continue;

        const value = formatSlotValue(slot);
        if (!value || shouldSkipSharedValue(value)) continue;
        setSharedContextValue(sharedContext, target, value, state.service);
        updated = true;
    }

    if (!updated) return state;
    return {
        ...state,
        sharedContext,
    };
};

const resolveSlotDisplayValue = (state, key) => {
    if (!state || !key) return "";
    const slot = state?.slots?.[key];
    if (slot?.status === "answered") {
        return formatSlotValue(slot);
    }
    return normalizeText(state?.collectedData?.[key] || "");
};

const WEBSITE_TECH_SUGGESTIONS = {
    noCode: [
        "Shopify",
        "Wix",
        "GoDaddy",
        "Webflow",
        "Framer",
        "WordPress",
        "No preference",
    ],
    customCode: [
        "Next.js",
        "React.js",
        "React.js + Node.js",
        "Shopify + Hydrogen (React)",
        "Laravel + Vue",
        "Django + React",
        "No preference",
    ],
};

const WORDPRESS_DEPLOYMENT_SUGGESTIONS = [
    "Managed WordPress Hosting (WP Engine/Kinsta)",
    "Shared Hosting (Hostinger/Bluehost/SiteGround)",
    "Cloud Hosting (Cloudways)",
    "Self-managed VPS",
    "WordPress.com",
    "Not sure yet",
];

const WEBSITE_TIMELINE_SUGGESTIONS = {
    noCode: ["1 week", "2 week", "1 month"],
    customCode: ["1 month", "2-3 months", "3-6 months"],
};

const resolveWebsiteTechSuggestions = (state, questions, question) => {
    if (!question || question.key !== "tech") return null;
    const hasBuildMode = Array.isArray(questions) && questions.some((q) => q?.key === "build_mode");
    if (!hasBuildMode) return null;

    const buildModeRaw = resolveSlotDisplayValue(state, "build_mode");
    const buildMode = normalizeText(buildModeRaw).toLowerCase();
    if (!buildMode) return null;

    const canon = canonicalize(buildMode);
    if (canon.includes("nocode") || buildMode.includes("no code") || buildMode.includes("no-code")) {
        return WEBSITE_TECH_SUGGESTIONS.noCode;
    }
    if (canon.includes("custom") || canon.includes("coded") || buildMode.includes("custom code")) {
        return WEBSITE_TECH_SUGGESTIONS.customCode;
    }
    return null;
};

const resolveWebsiteTimelineSuggestions = (state, questions, question) => {
    if (!question || question.key !== "timeline") return null;
    const hasBuildMode = Array.isArray(questions) && questions.some((q) => q?.key === "build_mode");
    if (!hasBuildMode) return null;

    const buildModeRaw = resolveSlotDisplayValue(state, "build_mode");
    const { isNoCode, isCustomCode } = resolveBuildModeFlags(buildModeRaw);

    if (isNoCode) return WEBSITE_TIMELINE_SUGGESTIONS.noCode;
    if (isCustomCode) return WEBSITE_TIMELINE_SUGGESTIONS.customCode;
    return null;
};

const resolveWebsiteDeploymentSuggestions = (state, question) => {
    if (!question || question.key !== "deployment") return null;

    const techValue = resolveSlotDisplayValue(state, "tech");
    if (!techValue) return null;

    if (hasWordPressSelection(techValue)) {
        return WORDPRESS_DEPLOYMENT_SUGGESTIONS;
    }

    return null;
};

const applyTemplatePlaceholders = (text, state) => {
    if (!text) return text;
    let output = text;
    const name =
        resolveSlotDisplayValue(state, "name") ||
        resolveSlotDisplayValue(state, "first_name") ||
        resolveSlotDisplayValue(state, "full_name");

    if (name) {
        output = output.replace(/\{name\}/gi, name);
    } else if (/\{name\}/i.test(output)) {
        output = output.replace(/\s*,\s*\{name\}/gi, "");
        output = output.replace(/\{name\}/gi, "");
        output = output.replace(/\s+!/g, "!");
        output = output.replace(/\s+\?/g, "?");
        output = output.replace(/\s{2,}/g, " ");
    }

    if (/\{tech\}/i.test(output)) {
        const tech = resolveSlotDisplayValue(state, "tech") || "your chosen stack";
        output = output.replace(/\{tech\}/gi, tech);
    }

    if (/\{min_budget\}/i.test(output)) {
        const requirement = resolveMinimumWebsiteBudget(state?.collectedData || {});
        const rangeLabel = requirement?.range ? formatBudgetDisplay(requirement.range) : "";
        const min = Number.isFinite(requirement?.min) ? requirement.min : null;
        const minLabel = rangeLabel || (min ? `${formatInr(min)}+` : "");
        const fallback = minLabel || "a realistic budget";
        output = output.replace(/\{min_budget\}/gi, fallback);
    }

    return output.trim();
};

const getQuestionTags = (question = {}) => {
    if (Array.isArray(question.tags) && question.tags.length) return question.tags;
    const key = question.key || "";
    const tags = [];
    if (key.includes("budget")) tags.push("budget");
    if (key.includes("timeline") || key.includes("delivery")) tags.push("timeline");
    if (key.includes("goal")) tags.push("goal");
    if (key.includes("audience")) tags.push("audience");
    if (key.includes("location")) tags.push("location");
    const hasName = key.includes("name");
    const isBrandNameKey = key === "brand" || (key.includes("brand") && hasName);
    if (
        key.includes("company") ||
        isBrandNameKey ||
        key.includes("business") ||
        key.includes("organization") ||
        (hasName && key.includes("project"))
    ) {
        tags.push("company");
    }
    if (key.includes("name")) tags.push("name");
    if (key.includes("brief") || key.includes("summary") || key.includes("description")) tags.push("description");
    if (key.includes("deliverable") || key.includes("format") || key.includes("output")) tags.push("deliverables");
    if (key.includes("platform")) tags.push("platforms");
    if (key.includes("style") || key.includes("tone") || key.includes("mood")) tags.push("style");
    if (key.includes("service_type") || key.endsWith("type")) tags.push("service_type");
    if (key.includes("notes") || key.includes("request")) tags.push("notes");
    return tags;
};

const SHARED_CONTEXT_DEFAULTS = Object.freeze({
    full_name: "",
    preferred_name: "",
    business_type: "",
    project_name: "",
    project_one_liner: "",
    website_live: "",
    target_location: "",
    target_audience: "",
    general_budget: "",
    tech_preferences: {
        stack: "",
        hosting: "",
        domain: "",
    },
    integrations: "",
    timeline: "",
    service_budgets: {},
    global: { client_name: "" },
    service_data: {},
    active_service: "",
    asked_questions_log: {},
});

const normalizeCataListValue = (value) => {
    if (Array.isArray(value)) {
        return value.map((item) => normalizeText(item)).filter(Boolean);
    }
    const text = normalizeText(value);
    if (!text) return [];
    return splitSelections(text).map((part) => normalizeText(part)).filter(Boolean);
};

const normalizeCataBrief = (service, brief = {}) => {
    const config = CATA_SERVICE_CONFIGS.get(service);
    if (!config) return {};
    const normalized = {};
    const questions = Array.isArray(config.questions) ? config.questions : [];

    for (const question of questions) {
        const key = question?.key;
        if (!key || key === "name") continue;
        if (config.listFields?.has(key)) {
            normalized[key] = normalizeCataListValue(brief?.[key]);
        } else {
            normalized[key] = normalizeText(brief?.[key] || "");
        }
    }

    return normalized;
};

const normalizeCataSharedContext = (shared = {}) => {
    const safeShared = shared && typeof shared === "object" ? shared : {};
    const legacyGlobal =
        safeShared.global_profile && typeof safeShared.global_profile === "object"
            ? safeShared.global_profile
            : {};
    const legacyService =
        safeShared.service_briefs && typeof safeShared.service_briefs === "object"
            ? safeShared.service_briefs
            : {};
    const globalRaw =
        safeShared.global && typeof safeShared.global === "object"
            ? safeShared.global
            : legacyGlobal;
    const serviceRaw =
        safeShared.service_data && typeof safeShared.service_data === "object"
            ? safeShared.service_data
            : legacyService;
    const askedLog =
        safeShared.asked_questions_log && typeof safeShared.asked_questions_log === "object"
            ? safeShared.asked_questions_log
            : {};
    const normalizedServiceData = {};

    for (const [service] of CATA_SERVICE_CONFIGS.entries()) {
        normalizedServiceData[service] = normalizeCataBrief(service, serviceRaw[service] || {});
    }

    const rawActive = normalizeText(safeShared.active_service || "");
    const resolvedActive = resolveCataService(rawActive) || rawActive;

    return {
        global: { client_name: normalizeText(globalRaw.client_name || "") },
        service_data: normalizedServiceData,
        active_service: resolvedActive,
        asked_questions_log: { ...askedLog },
    };
};

const normalizeSharedContext = (shared = {}) => {
    const safeShared =
        shared && typeof shared === "object" ? shared : {};
    const tech = safeShared.tech_preferences || {};
    const serviceBudgets =
        safeShared.service_budgets && typeof safeShared.service_budgets === "object"
            ? { ...safeShared.service_budgets }
            : {};
    const cataContext = normalizeCataSharedContext(safeShared);

    return {
        ...SHARED_CONTEXT_DEFAULTS,
        full_name: normalizeText(safeShared.full_name || ""),
        preferred_name: normalizeText(safeShared.preferred_name || ""),
        business_type: normalizeText(safeShared.business_type || ""),
        project_name: normalizeText(safeShared.project_name || ""),
        project_one_liner: normalizeText(safeShared.project_one_liner || ""),
        website_live: normalizeText(safeShared.website_live || ""),
        target_location: normalizeText(safeShared.target_location || ""),
        target_audience: normalizeText(safeShared.target_audience || ""),
        general_budget: normalizeText(safeShared.general_budget || ""),
        tech_preferences: {
            stack: normalizeText(tech.stack || tech.tech_stack || ""),
            hosting: normalizeText(tech.hosting || ""),
            domain: normalizeText(tech.domain || ""),
        },
        integrations: Array.isArray(safeShared.integrations)
            ? safeShared.integrations.join(", ")
            : normalizeText(safeShared.integrations || ""),
        timeline: normalizeText(safeShared.timeline || ""),
        service_budgets: serviceBudgets,
        global: cataContext.global,
        service_data: cataContext.service_data,
        active_service: cataContext.active_service,
        asked_questions_log: cataContext.asked_questions_log,
    };
};

const formatCataSharedValue = (value) => {
    if (Array.isArray(value)) return value.join(", ");
    return normalizeText(value);
};

const normalizeCataCompareValue = (value) => {
    if (Array.isArray(value)) {
        const items = value
            .map((item) => canonicalize(normalizeText(item)))
            .filter(Boolean)
            .sort();
        return items.join("|");
    }
    return canonicalize(normalizeText(value));
};

const resolveCataSharedValue = (sharedContext, question, service) => {
    const resolvedService = resolveCataService(service);
    if (!resolvedService || !question?.key) return "";
    if (question.key === "name") {
        return normalizeText(sharedContext?.global?.client_name || "");
    }
    const brief = sharedContext?.service_data?.[resolvedService] || {};
    const raw = brief[question.key];
    if (Array.isArray(raw)) {
        return raw.length ? raw : "";
    }
    return raw || "";
};

const setCataSharedValue = (sharedContext, question, value, service) => {
    if (!sharedContext || !question?.key) return;
    const resolvedService = resolveCataService(service);
    if (!resolvedService) return;
    const config = getCataConfig(resolvedService);
    if (!config) return;
    sharedContext.active_service = resolvedService;

    if (question.key === "name") {
        const cleaned = normalizeText(value);
        if (!cleaned) return;
        sharedContext.global = sharedContext.global || { client_name: "" };
        sharedContext.global.client_name = cleaned;
        return;
    }

    const isListField = Boolean(config.listFields?.has(question.key));
    const cleaned = isListField ? normalizeCataListValue(value) : normalizeText(value);
    if (isListField && (!cleaned || cleaned.length === 0)) return;
    if (!isListField && !cleaned) return;

    sharedContext.service_data = sharedContext.service_data || {};
    if (!sharedContext.service_data[resolvedService]) {
        sharedContext.service_data[resolvedService] = normalizeCataBrief(resolvedService, {});
    }
    sharedContext.service_data[resolvedService][question.key] = cleaned;
};

const hasSharedContextValue = (sharedContext) => {
    if (!sharedContext) return false;
    const values = [
        sharedContext.full_name,
        sharedContext.preferred_name,
        sharedContext.business_type,
        sharedContext.project_name,
        sharedContext.project_one_liner,
        sharedContext.website_live,
        sharedContext.target_location,
        sharedContext.target_audience,
        sharedContext.general_budget,
        sharedContext.integrations,
        sharedContext.timeline,
    ];
    if (values.some((value) => normalizeText(value))) return true;

    const tech = sharedContext.tech_preferences || {};
    if (
        normalizeText(tech.stack) ||
            normalizeText(tech.hosting) ||
            normalizeText(tech.domain)
    ) {
        return true;
    }

    const cataName = normalizeText(sharedContext.global?.client_name || "");
    if (cataName) return true;

    const serviceData = sharedContext.service_data || {};
    for (const brief of Object.values(serviceData)) {
        if (!brief || typeof brief !== "object") continue;
        for (const value of Object.values(brief)) {
            if (Array.isArray(value)) {
                if (value.some((item) => normalizeText(item))) return true;
            } else if (normalizeText(value)) {
                return true;
            }
        }
    }

    const budgets = sharedContext.service_budgets || {};
    return Object.values(budgets).some((value) => normalizeText(value));
};

const shouldSkipSharedValue = (value = "") => {
    const text = normalizeText(value).toLowerCase();
    if (!text) return true;
    const canon = canonicalize(text);
    return (
        canon === "notsure" ||
        canon === "notsureyet" ||
        canon === "notyet" ||
        canon === "nopreference" ||
        canon === "none" ||
        canon === "na" ||
        canon === "unknown"
    );
};

const normalizeSharedComparison = (value = "", field = "") => {
    const text = normalizeText(value);
    if (!text) return "";
    if (field === "general_budget") {
        const range = parseInrBudgetRange(text);
        if (range) {
            const min = Number.isFinite(range.min) ? range.min : "";
            const max = Number.isFinite(range.max) ? range.max : "";
            return `${min}-${max}`;
        }
        const cleaned = text.replace(/\b(inr|rs|rupees?)\b/gi, "");
        return canonicalize(cleaned);
    }
    if (field === "timeline") {
        const weeks = parseTimelineWeeks(text);
        if (Number.isFinite(weeks)) return `weeks:${weeks}`;
        return canonicalize(text);
    }
    return canonicalize(text);
};

const normalizeTechPreferenceValue = (value = "") =>
    normalizeText(value).toLowerCase().replace(/\s*-\s*$/, "");

const isTechPreferencePlaceholder = (value = "") => {
    const normalized = normalizeTechPreferenceValue(value);
    return (
        normalized === "yes, specific technologies" ||
        normalized === "no, open to recommendations"
    );
};

const resolveSharedContextTarget = (question = {}) => {
    const key = normalizeText(question.key || "").toLowerCase();
    if (!key) return null;
    const tags = new Set([...(question.tags || []), ...getQuestionTags(question)]);
    const isNamingSupportKey = key === "naming_support";
    const isBusinessNameKey = key.includes("business") && key.includes("name");
    const isCompanyNameKey = key.includes("company") && key.includes("name");
    const isProjectNameKey = key.includes("project") && key.includes("name");
    const isBrandNameKey = key === "brand" || (key.includes("brand") && key.includes("name"));
    const isBusinessTypeKey =
        key.includes("business_type") ||
        (key.includes("business") && key.includes("type")) ||
        key.includes("industry") ||
        key.includes("niche");
    const isBusinessOnlyKey = key.includes("business") && !key.includes("name") && !isBusinessTypeKey;
    const isProjectNameCandidate =
        isBusinessNameKey ||
        isCompanyNameKey ||
        isProjectNameKey ||
        isBrandNameKey ||
        key === "company" ||
        key === "project" ||
        key.includes("company") ||
        key.includes("project_name");

    if (isBusinessTypeKey) {
        return { field: "business_type" };
    }
    if ((tags.has("company") || isProjectNameCandidate) && !isBusinessOnlyKey) {
        return { field: "project_name" };
    }

    if (!isNamingSupportKey && (tags.has("name") || key.includes("name"))) {
        return { field: "full_name" };
    }
    if (
        tags.has("description") ||
        key.includes("summary") ||
        key.includes("brief") ||
        key.includes("description") ||
        key.includes("vision") ||
        key.includes("business_info")
    ) {
        return { field: "project_one_liner" };
    }
    if (
        tags.has("location") ||
        key.includes("location") ||
        key.includes("geo") ||
        key.includes("city") ||
        key.includes("country")
    ) {
        return { field: "target_location" };
    }
    if (tags.has("audience") || key.includes("audience")) {
        return { field: "target_audience" };
    }
    if (tags.has("budget") || key.includes("budget")) {
        return { field: "general_budget" };
    }
    if (key.includes("delivery_approach")) {
        return null;
    }
    if (key === "tech_stack_preference") {
        return null;
    }
    if (tags.has("timeline") || key.includes("timeline") || key.includes("delivery")) {
        return { field: "timeline" };
    }
    if (
        tags.has("online_presence") ||
        key === "website" ||
        key === "website_url" ||
        key.endsWith("_website") ||
        key.endsWith("_website_url")
    ) {
        return { field: "website_live" };
    }
    if (
        key.includes("tech") ||
        key.includes("stack") ||
        key.includes("hosting") ||
        key.includes("domain") ||
        key.includes("deployment")
    ) {
        let subfield = "stack";
        if (key.includes("hosting") || key.includes("deployment")) subfield = "hosting";
        if (key.includes("domain")) subfield = "domain";
        return { field: "tech_preferences", subfield };
    }
    if (key.includes("integration")) return { field: "integrations" };

    return null;
};

const resolveSharedNameValue = (sharedContext, key = "") => {
    const normalizedKey = normalizeText(key).toLowerCase();
    if (normalizedKey.includes("full")) {
        return sharedContext.full_name || sharedContext.preferred_name || "";
    }
    if (normalizedKey.includes("first")) {
        return sharedContext.preferred_name || sharedContext.full_name || "";
    }
    return sharedContext.preferred_name || sharedContext.full_name || "";
};

const resolveSharedContextValue = (sharedContext, question, service) => {
    if (!sharedContext || !question) return "";
    if (resolveCataService(service)) {
        return resolveCataSharedValue(sharedContext, question, service);
    }
    const target = resolveSharedContextTarget(question);
    if (!target) return "";
    const key = normalizeText(question.key || "").toLowerCase();

    if (target.field === "full_name") {
        return resolveSharedNameValue(sharedContext, key);
    }
    if (target.field === "general_budget") {
        const serviceKey = normalizeText(service || "");
        const serviceBudget =
            serviceKey && sharedContext.service_budgets
                ? sharedContext.service_budgets[serviceKey]
                : "";
        return normalizeText(serviceBudget || sharedContext.general_budget || "");
    }
    if (target.field === "tech_preferences") {
        const prefs = sharedContext.tech_preferences || {};
        return normalizeText(prefs[target.subfield] || "");
    }
    return normalizeText(sharedContext[target.field] || "");
};

const setSharedContextValue = (sharedContext, target, value, service) => {
    if (!sharedContext || !target) return;
    const cleaned = normalizeText(value);
    if (!cleaned) return;

    if (target.field === "full_name") {
        sharedContext.full_name = cleaned;
        const first = cleaned.split(" ")[0];
        if (first) sharedContext.preferred_name = first;
        return;
    }

    if (target.field === "general_budget") {
        sharedContext.general_budget = cleaned;
        const serviceKey = normalizeText(service || "");
        if (serviceKey) {
            sharedContext.service_budgets = {
                ...(sharedContext.service_budgets || {}),
                [serviceKey]: cleaned,
            };
        }
        return;
    }

    if (target.field === "tech_preferences") {
        const next = {
            ...(sharedContext.tech_preferences || SHARED_CONTEXT_DEFAULTS.tech_preferences),
        };
        next[target.subfield || "stack"] = cleaned;
        sharedContext.tech_preferences = next;
        return;
    }

    sharedContext[target.field] = cleaned;
};

const SHARED_FIELD_LABELS = Object.freeze({
    full_name: "your name",
    preferred_name: "your name",
    business_type: "your business type",
    project_name: "your company or project name",
    project_one_liner: "your project summary",
    website_live: "your website status",
    target_location: "your target location",
    target_audience: "your target audience",
    general_budget: "your budget",
    tech_preferences: "your tech preference",
    integrations: "your integrations",
    timeline: "your timeline",
});

const resolveSharedFieldLabel = (conflict = {}) => {
    if (!conflict?.field) return "that detail";
    if (conflict.field === "tech_preferences") {
        if (conflict.subfield === "hosting") return "your hosting preference";
        if (conflict.subfield === "domain") return "your domain preference";
        return "your tech stack preference";
    }
    return SHARED_FIELD_LABELS[conflict.field] || "that detail";
};

const truncateSharedValue = (value = "", maxLen = 80) => {
    const text = normalizeText(value);
    if (!text) return "";
    if (text.length <= maxLen) return text;
    return `${text.slice(0, maxLen - 3).trim()}...`;
};

const buildSharedConflictPrompt = (question, conflict) => {
    if (!question?.key || !conflict) return "";
    if (conflict.source === "cata") {
        const previous = truncateSharedValue(conflict.previousValue);
        const proposed = truncateSharedValue(conflict.proposedValue);
        if (!previous || !proposed) return "";
        const base = `Earlier you said "${previous}", now "${proposed}". Which should I keep?`;
        const suggestions = [proposed, previous].filter(Boolean);
        const text = suggestions.length
            ? `${base}\n[SUGGESTIONS: ${suggestions.join(" | ")}]`
            : base;
        return withQuestionKeyTag(text.trim(), question.key);
    }
    const label = resolveSharedFieldLabel(conflict);
    const previous = truncateSharedValue(conflict.previousValue);
    const proposed = truncateSharedValue(conflict.proposedValue);
    if (!previous || !proposed) return "";

    const base = `Earlier you said ${label} was \"${previous}\". Should I update it to \"${proposed}\" or keep \"${previous}\"?`;
    const suggestions = [proposed, previous].filter(Boolean);
    const text = suggestions.length
        ? `${base}\n[SUGGESTIONS: ${suggestions.join(" | ")}]`
        : base;
    return withQuestionKeyTag(text.trim(), question.key);
};

const isRequiredQuestion = (question = {}) => {
    if (typeof question.required === "boolean") return question.required;
    const key = question.key || "";
    return (
        key === "name" ||
        key === "first_name" ||
        key === "full_name" ||
        key === "company" ||
        key === "company_name" ||
        key === "budget" ||
        key === "timeline" ||
        key === "delivery_timeline"
    );
};

const extractLocationFromMessage = (value = "") => {
    const text = normalizeText(value);
    if (!text) return null;
    const match = text.match(/\b(?:based in|located in|from)\s+([^,.;\n]+)/i);
    if (match) return normalizeText(match[1]);
    return null;
};

const extractGoalFromMessage = (value = "") => {
    const text = normalizeText(value);
    if (!text) return null;
    const match = text.match(/\b(?:goal|purpose|objective)\b\s*(?:is|:)?\s*([^,.;\n]+)/i);
    if (match) return normalizeText(match[1]);
    return null;
};

const extractAudienceFromMessage = (value = "") => {
    const text = normalizeText(value);
    if (!text) return null;
    const match = text.match(/\btarget audience\b\s*(?:is|:)?\s*([^,.;\n]+)/i);
    if (match) return normalizeText(match[1]);
    return null;
};

const hasBudgetSignal = (value = "") =>
    /\b(budget|cost|price|spend)\b/i.test(value) ||
    /\b(inr|rs\.?|rupees?)\b/i.test(value) ||
    value.includes("\u20B9") ||
    isBareBudgetAnswer(value);

const hasTimelineSignal = (value = "") =>
    /\b(timeline|deadline|delivery|start|completed)\b/i.test(value) ||
    isBareTimelineAnswer(value);

const hasLocationSignal = (value = "") =>
    /\b(based in|located in|from|location|city|country)\b/i.test(value);

const hasKeywordSignal = (value = "", tags = []) => {
    const lowered = normalizeText(value).toLowerCase();
    return tags.some((tag) => lowered.includes(tag));
};

const createSlotDefaults = () => ({
    status: "empty",
    raw: "",
    normalized: null,
    confidence: 0,
    askedCount: 0,
    clarifiedOnce: false,
    validationErrors: [],
    options: null,
});

const ensureSlot = (slots, key) => {
    if (!slots[key]) slots[key] = createSlotDefaults();
    return slots[key];
};

const recomputeProgress = (state) => {
    const questions = Array.isArray(state?.questions) ? state.questions : [];
    const slots = state?.slots || {};
    const { missingRequired, missingOptional } = buildMissingLists(
        questions,
        slots,
        state?.collectedData || {},
        { service: state?.service }
    );
    const nextKey = findNextQuestionKey(questions, missingRequired, missingOptional);
    const currentStep = nextKey ? questions.findIndex((q) => q.key === nextKey) : questions.length;
    const asked = Object.keys(slots).filter((key) => (slots[key]?.askedCount || 0) > 0);
    const answered = Object.keys(slots).filter((key) => slots[key]?.status === "answered");

    return {
        ...state,
        missingRequired,
        missingOptional,
        currentStep,
        asked,
        answered,
        isComplete: missingRequired.length === 0 && missingOptional.length === 0,
    };
};

const clearBudgetSlot = (state) => {
    if (!state) return state;
    const next = {
        ...state,
        slots: { ...(state.slots || {}) },
        collectedData: { ...(state.collectedData || {}) },
    };
    const budgetKey = findBudgetQuestion(Array.isArray(state.questions) ? state.questions : [])?.key || "budget";
    if (next.slots[budgetKey]) {
        next.slots[budgetKey] = createSlotDefaults();
    }
    delete next.collectedData[budgetKey];
    return next;
};

const applySlotResult = (slot, result, raw) => {
    slot.raw = raw;
    slot.validationErrors = [];
    slot.options = null;
    if (result.status === "ok") {
        slot.status = "answered";
        slot.normalized = result.normalized;
        slot.confidence = result.confidence || 0;
        return;
    }
    if (result.status === "ambiguous") {
        slot.status = "ambiguous";
        slot.normalized = null;
        slot.confidence = result.confidence || 0;
        slot.options = Array.isArray(result.options) ? result.options : null;
        if (result.error) slot.validationErrors = [result.error];
        return;
    }
    slot.status = "invalid";
    slot.normalized = null;
    slot.confidence = 0;
    if (result.error) slot.validationErrors = [result.error];
};

const collectQuestionMatches = (question, message) => {
    if (!Array.isArray(question?.suggestions) || question.suggestions.length === 0) {
        return [];
    }
    return matchSuggestionsInMessage(question, message);
};

const evaluateAnswerForQuestion = (question, message, options = {}) => {
    const text = normalizeText(message);
    if (!text) return null;
    const expectedType = question.expectedType || question.expected_type || question.answerType || "text";
    const allowMultiple = question.multiSelect || expectedType === "list";
    const allowedUnits = question.allowedUnits || question.allowed_units || null;
    const wasQuestion = options.wasQuestion === true;
    const force = options.force === true;

    if (expectedType === "money") {
        if (!force && !hasBudgetSignal(text)) return null;
        return normalizeMoneyValue(text);
    }

    if (expectedType === "budget_text") {
        const looksLikeBudget = hasBudgetSignal(text) || isBareBudgetAnswer(text);
        if (!force && !looksLikeBudget) return null;
        return { status: "ok", normalized: text, confidence: 0.75 };
    }

    if (expectedType === "duration") {
        if (!force && !hasTimelineSignal(text) && !/\b(day|week|month|year)\b/i.test(text)) return null;
        return normalizeDurationValue(text, allowedUnits);
    }

    if (expectedType === "timeline_text") {
        const looksLikeTimeline = hasTimelineSignal(text) || isBareTimelineAnswer(text);
        if (!force && !looksLikeTimeline) return null;
        return { status: "ok", normalized: text, confidence: 0.75 };
    }

    if (expectedType === "number_range") {
        if (!force && !/\d/.test(text)) return null;
        return normalizeNumberRangeValue(text);
    }

    if (expectedType === "enum") {
        if (!force && collectQuestionMatches(question, text).length === 0) return null;
        return normalizeSelectionValue(question, text, false);
    }

    if (expectedType === "list") {
        if (!force && collectQuestionMatches(question, text).length === 0) return null;
        return normalizeSelectionValue(question, text, true);
    }

    if (!force && wasQuestion) return null;

    const tags = getQuestionTags(question);
    if (force && expectedType === "text" && isGreetingMessage(text)) {
        return { status: "invalid", error: "greeting_only" };
    }
    if (tags.includes("name")) {
        const name = extractExplicitName(text) || extractName(text);
        if (!name) {
            if (!force) return null;
            return { status: "invalid", error: "name_missing" };
        }
        return { status: "ok", normalized: name, confidence: 0.8 };
    }
    if (tags.includes("company")) {
        const org = extractOrganizationName(text);
        if (!org && !force) return null;
        return org ? { status: "ok", normalized: org, confidence: 0.8 } : normalizeTextValue(text);
    }
    if (tags.includes("location")) {
        const location = extractLocationFromMessage(text);
        if (!location && !force) return null;
        return location ? { status: "ok", normalized: location, confidence: 0.8 } : normalizeTextValue(text);
    }
    if (tags.includes("goal")) {
        const goal = extractGoalFromMessage(text);
        if (!goal && !force) return null;
        return goal ? { status: "ok", normalized: goal, confidence: 0.75 } : normalizeTextValue(text);
    }
    if (tags.includes("audience")) {
        const audience = extractAudienceFromMessage(text);
        if (!audience && !force) return null;
        return audience ? { status: "ok", normalized: audience, confidence: 0.75 } : normalizeTextValue(text);
    }

    if (looksLikeProjectBrief(text) && !force) {
        return { status: "ok", normalized: text, confidence: 0.7 };
    }

    return normalizeTextValue(text);
};

const buildMissingLists = (questions, slots, collectedData = {}, options = {}) => {
    const missingRequired = [];
    const missingOptional = [];
    const cataConfig = getCataConfig(options.service);
    const skipDeployment = cataConfig ? false : shouldSkipDeploymentQuestion(collectedData);
    const isCataFlow = Boolean(cataConfig);
    for (const question of questions) {
        const key = question.key;
        if (!key) continue;
        if (shouldSkipQuestion(question, collectedData)) continue;
        if (key === "deployment" && skipDeployment) continue;
        const slot = slots[key];
        const required = cataConfig
            ? cataConfig.requiredKeys.includes(key)
            : isRequiredQuestion(question);
        const answered = slot?.status === "answered";
        const forceAsk = question?.forceAsk === true;
        const askedCount = slot?.askedCount || 0;
        const declined = slot?.status === "declined";
        const allowSkip = question?.allowSkip === true;
        const treatAsAnswered =
            (answered && !(forceAsk && askedCount === 0)) ||
            (declined && allowSkip);
        if (required && !treatAsAnswered) missingRequired.push(key);
        if (!isCataFlow && !required && !treatAsAnswered && !declined) missingOptional.push(key);
    }
    return { missingRequired, missingOptional };
};

const findNextQuestionKey = (questions, missingRequired, missingOptional) => {
    const targets = missingRequired.length ? missingRequired : missingOptional;
    if (!targets.length) return null;
    const next = questions.find((q) => targets.includes(q.key));
    return next ? next.key : null;
};

const buildForcedChoices = (question) => {
    if (Array.isArray(question?.suggestions) && question.suggestions.length) {
        return question.suggestions;
    }
    const expectedType = question.expectedType || question.answerType;
    if (expectedType === "money") {
        return ["INR 50000-100000", "INR 100000-300000", "INR 300000+", "Not sure yet"];
    }
    if (expectedType === "duration") {
        return ["1 week", "2-4 weeks", "1-2 months", "Flexible"];
    }
    return null;
};

const buildClarificationText = (question) => {
    const examples = Array.isArray(question?.examples) ? question.examples : [];
    if (examples.length >= 2) {
        return `Please reply with something like \"${examples[0]}\" or \"${examples[1]}\".`;
    }
    const forced = buildForcedChoices(question);
    if (Array.isArray(forced) && forced.length >= 2) {
        return "Please choose one option below.";
    }
    return "Please reply with a short, specific answer.";
};

const shouldCaptureOutOfOrder = (question, message) => {
    const text = normalizeText(message);
    if (!text) return false;
    const expectedType = question.expectedType || question.expected_type || question.answerType || "text";
    const tags = getQuestionTags(question);
    const matches = collectQuestionMatches(question, text);
    const hasKeywords = hasKeywordSignal(text, tags);

    if (expectedType === "money") return hasBudgetSignal(text);
    if (expectedType === "budget_text") return hasBudgetSignal(text) || isBareBudgetAnswer(text);
    if (expectedType === "duration") {
        return hasTimelineSignal(text) || /\b(day|week|month|year)\b/i.test(text);
    }
    if (expectedType === "timeline_text") {
        return hasTimelineSignal(text) || isBareTimelineAnswer(text);
    }
    if (expectedType === "number_range") {
        return /\d/.test(text) && (hasKeywords || /\bhow many\b|\bnumber of\b/i.test(text));
    }

    if (matches.length) {
        const generic = matches.every((match) =>
            /^(yes|no|maybe|not sure)$/i.test(normalizeText(match).toLowerCase())
        );
        return generic ? hasKeywords : true;
    }

    if (tags.includes("location")) return hasLocationSignal(text);
    if (tags.includes("name")) return hasKeywords;
    if (tags.includes("company")) return hasKeywords || Boolean(extractOrganizationName(text));
    if (tags.includes("goal") || tags.includes("audience")) return hasKeywords;
    if (tags.includes("description") && looksLikeProjectBrief(text)) return true;
    if (tags.includes("notes") && hasKeywords) return true;

    return false;
};

const applyMessageToState = (state, message, activeKey = null, options = {}) => {
    const rawMessage = normalizeText(message);
    if (!rawMessage) return state;
    const questions = Array.isArray(state?.questions) ? state.questions : [];
    const slots = { ...(state?.slots || {}) };
    const wasQuestion = isUserQuestion(rawMessage);
    const stripped = stripMarkdownFormatting(rawMessage);
    const sharedContext = normalizeSharedContext(state?.sharedContext);
    const allowSharedContextUpdates = options.allowSharedContextUpdates !== false;
    const allowSharedContextConflicts = options.allowSharedContextConflicts !== false;

    const questionByKey = new Map(questions.map((q) => [q.key, q]));
    const activeQuestion = activeKey ? questionByKey.get(activeKey) : null;
    let sharedContextUpdated = false;

    const handleSharedContextUpdate = (question, slot, existingConflict) => {
        if (!allowSharedContextUpdates) return { updated: false };
        const result = applySharedContextUpdate(sharedContext, question, slot, {
            service: state?.service,
            existingConflict,
            allowConflicts: allowSharedContextConflicts,
        });
        if (result?.updated) sharedContextUpdated = true;
        return result;
    };

    if (activeQuestion?.key) {
        const slot = ensureSlot(slots, activeQuestion.key);
        slot.askedCount += 1;

        if (isSkipMessage(stripped)) {
            const canSkip = Boolean(activeQuestion?.allowSkip) || !isRequiredQuestion(activeQuestion);
            if (!canSkip) {
                applySlotResult(slot, { status: "invalid", error: "required" }, stripped);
            } else {
                slot.status = "declined";
                slot.raw = stripped;
                slot.normalized = null;
                slot.confidence = 1;
            }
        } else {
            const force = !wasQuestion || shouldCaptureOutOfOrder(activeQuestion, stripped);
            const result = force
                ? evaluateAnswerForQuestion(activeQuestion, stripped, { force: true, wasQuestion })
                : null;
            if (result) {
                const existingConflict = slot.sharedConflict || null;
                applySlotResult(slot, result, stripped);
                if (slot.status === "answered") {
                    const sharedResult = handleSharedContextUpdate(
                        activeQuestion,
                        slot,
                        existingConflict
                    );
                    if (sharedResult?.conflict) {
                        slot.status = "ambiguous";
                        slot.normalized = null;
                        slot.confidence = 0;
                        slot.validationErrors = ["shared_conflict"];
                        slot.options = [
                            sharedResult.conflict.proposedValue,
                            sharedResult.conflict.previousValue,
                        ].filter(Boolean);
                        slot.sharedConflict = sharedResult.conflict;
                    } else if (existingConflict) {
                        delete slot.sharedConflict;
                    }
                }
            }
        }
    }

    for (const question of questions) {
        if (!question?.key || question.key === activeKey) continue;
        const slot = ensureSlot(slots, question.key);
        const answered = slot.status === "answered";
        const shouldCapture = shouldCaptureOutOfOrder(question, stripped);
        if (!shouldCapture) continue;

        if (answered && !hasKeywordSignal(stripped, getQuestionTags(question))) {
            continue;
        }

        const result = evaluateAnswerForQuestion(question, stripped, { force: false, wasQuestion });
        if (result) {
            const existingConflict = slot.sharedConflict || null;
            applySlotResult(slot, result, stripped);
            if (slot.status === "answered") {
                const sharedResult = handleSharedContextUpdate(question, slot, existingConflict);
                if (sharedResult?.conflict) {
                    slot.status = "ambiguous";
                    slot.normalized = null;
                    slot.confidence = 0;
                    slot.validationErrors = ["shared_conflict"];
                    slot.options = [
                        sharedResult.conflict.proposedValue,
                        sharedResult.conflict.previousValue,
                    ].filter(Boolean);
                    slot.sharedConflict = sharedResult.conflict;
                } else if (existingConflict) {
                    delete slot.sharedConflict;
                }
            }
        }
    }

    const collectedData = buildCollectedData(questions, slots);

    const { missingRequired, missingOptional } = buildMissingLists(
        questions,
        slots,
        collectedData,
        { service: state?.service }
    );
    const nextKey = findNextQuestionKey(questions, missingRequired, missingOptional);
    const currentStep = nextKey ? questions.findIndex((q) => q.key === nextKey) : questions.length;

    const asked = Object.keys(slots).filter((key) => (slots[key]?.askedCount || 0) > 0);
    const answered = Object.keys(slots).filter((key) => slots[key]?.status === "answered");

    return {
        ...state,
        slots,
        collectedData,
        missingRequired,
        missingOptional,
        asked,
        answered,
        currentStep,
        isComplete: missingRequired.length === 0 && missingOptional.length === 0,
        sharedContext: sharedContextUpdated ? sharedContext : state?.sharedContext,
        meta: {
            ...(state?.meta || {}),
            wasQuestion,
        },
    };
};

const applySharedContextToState = (state) => {
    if (!state) return state;
    const questions = Array.isArray(state?.questions) ? state.questions : [];
    if (!questions.length) return state;
    const slots = { ...(state?.slots || {}) };
    const sharedContext = normalizeSharedContext(state?.sharedContext);
    const isCataService = Boolean(resolveCataService(state?.service));
    let updated = false;

    for (const question of questions) {
        if (!question?.key) continue;
        if (shouldIgnoreSharedContext(question)) continue;
        const slot = ensureSlot(slots, question.key);
        if (slot.status !== "empty" && slot.status !== "declined") continue;
        const sharedValue = resolveSharedContextValue(sharedContext, question, state?.service);
        if (!sharedValue) continue;
        if (!isCataService && shouldSkipSharedValue(sharedValue)) continue;
        applySlotResult(
            slot,
            { status: "ok", normalized: sharedValue, confidence: 0.9 },
            sharedValue
        );
        updated = true;
    }

    if (!updated) {
        return {
            ...state,
            sharedContext,
        };
    }

    const collectedData = buildCollectedData(questions, slots);
    return recomputeProgress({
        ...state,
        slots,
        collectedData,
        sharedContext,
    });
};

/**
 * Build conversation state from message history
 * @param {Array} history - Array of {role, content} messages
 * @param {string} service - Service name
 * @returns {Object} State with collectedData and currentStep
 */
export function buildConversationState(history, service, sharedContext) {
    const { questions: rawQuestions, source, definition, skipIntro } = resolveServiceQuestions(service);
    const resolvedService = resolveCataService(service) || service;
    const isCataService = source === "cata";
    const safeHistory = Array.isArray(history) ? history : [];
    const needsBrief =
        !isCataService &&
        source !== "catalog" &&
        !skipIntro &&
        !shouldSkipMandatoryBrief(resolvedService);
    const baseQuestions = needsBrief ? withMandatoryBrief(rawQuestions) : rawQuestions;
    const questionSeed = isCataService || skipIntro
        ? baseQuestions
        : withGlobalIntroQuestion(baseQuestions, resolvedService);
    const normalizedQuestions = normalizeQuestions(questionSeed);
    const questions = orderQuestionsByFlow(normalizedQuestions);

    const slots = {};
    for (const question of questions) {
        if (question?.key) {
            slots[question.key] = createSlotDefaults();
        }
    }

    let state = {
        service: resolvedService,
        serviceSource: source,
        serviceDefinition: definition,
        questions,
        slots,
        collectedData: {},
        sharedContext: normalizeSharedContext(sharedContext),
        asked: [],
        answered: [],
        missingRequired: [],
        missingOptional: [],
        currentStep: 0,
        isComplete: false,
        pendingQuestionKey: null,
        meta: {},
    };

    let lastQuestionKey = null;
    for (const msg of safeHistory) {
        if (msg?.role === "assistant") {
            const askedKey = getQuestionKeyFromAssistant(msg.content);
            if (askedKey) lastQuestionKey = askedKey;
            continue;
        }
        if (msg?.role === "user") {
            state = applyMessageToState(state, msg.content, lastQuestionKey, {
                allowSharedContextUpdates: false,
                allowSharedContextConflicts: false,
            });
        }
    }

    state = applySharedContextToState(state);
    state = mergeSharedContextFromState(state);
    if (isCataService && state.sharedContext) {
        state.sharedContext = {
            ...state.sharedContext,
            active_service: resolvedService,
        };
    }

    if (!state.missingRequired?.length && !state.missingOptional?.length) {
        const { missingRequired, missingOptional } = buildMissingLists(
            questions,
            state.slots,
            state.collectedData,
            { service: state?.service }
        );
        const nextKey = findNextQuestionKey(questions, missingRequired, missingOptional);
        state.missingRequired = missingRequired;
        state.missingOptional = missingOptional;
        state.currentStep = nextKey ? questions.findIndex((q) => q.key === nextKey) : questions.length;
        state.isComplete = missingRequired.length === 0 && missingOptional.length === 0;
    }

    if (lastQuestionKey) {
        state.pendingQuestionKey = lastQuestionKey;
    }

    return state;
}

/**
 * Process the user's current message and update state
 * @param {Object} state - Current conversation state
 * @param {string} message - User's message
 * @returns {Object} Updated state
 */
export function processUserAnswer(state, message) {
    const rawService = state?.service || "";
    const { questions: rawQuestions, source, definition, skipIntro } = resolveServiceQuestions(rawService);
    const resolvedService = resolveCataService(rawService) || rawService;
    const isCataService = source === "cata";
    const needsBrief =
        !isCataService &&
        source !== "catalog" &&
        !skipIntro &&
        !shouldSkipMandatoryBrief(resolvedService);
    const baseQuestions = needsBrief ? withMandatoryBrief(rawQuestions) : rawQuestions;
    const questionSeed = isCataService || skipIntro
        ? baseQuestions
        : withGlobalIntroQuestion(baseQuestions, resolvedService);
    const normalizedQuestions = normalizeQuestions(questionSeed);
    const stateQuestions = Array.isArray(state?.questions) ? state.questions : [];
    const normalizedKeys = new Set(normalizedQuestions.map((q) => q.key));
    const stateKeys = new Set(stateQuestions.map((q) => q.key));
    const shouldRefreshQuestions =
        normalizedQuestions.length !== stateQuestions.length ||
        normalizedQuestions.some((q) => !stateKeys.has(q.key)) ||
        stateQuestions.some((q) => !normalizedKeys.has(q.key));
    const questions = orderQuestionsByFlow(
        stateQuestions.length && !shouldRefreshQuestions ? stateQuestions : normalizedQuestions
    );

    const normalizedMessage = normalizeText(message);
    let workingState = {
        ...state,
        service: resolvedService,
        sharedContext: normalizeSharedContext(state?.sharedContext),
    };
    const hasLowBudgetPending = Boolean(workingState?.meta?.lowBudgetPending);
    const hasLowBudgetConfirmPending = Boolean(workingState?.meta?.lowBudgetConfirmPending);
    const budgetDecisionIncrease = hasLowBudgetPending && isIncreaseBudgetDecision(normalizedMessage);
    const budgetDecisionProceed = hasLowBudgetPending && isProceedWithLowBudgetDecision(normalizedMessage);
    const budgetInputDetected =
        hasLowBudgetPending && (hasBudgetSignal(normalizedMessage) || isBareBudgetAnswer(normalizedMessage));
    const budgetConfirmProceed =
        hasLowBudgetConfirmPending && isLowBudgetConfirmDecision(normalizedMessage);
    const budgetConfirmIncrease =
        hasLowBudgetConfirmPending && isIncreaseBudgetDecision(normalizedMessage);

    if (hasLowBudgetConfirmPending) {
        if (budgetConfirmProceed) {
            const nextState = recomputeProgress({
                ...workingState,
                meta: {
                    ...(workingState?.meta || {}),
                    lowBudgetConfirmPending: false,
                    lowBudgetPending: false,
                    allowLowBudget: true,
                    lowBudgetConfirmed: true,
                    lowBudgetStatus: "Proceeding below minimum budget",
                },
            });
            return nextState;
        }
        if (budgetConfirmIncrease) {
            const cleared = clearBudgetSlot(workingState);
            const nextState = recomputeProgress({
                ...cleared,
                meta: {
                    ...(cleared?.meta || {}),
                    lowBudgetConfirmPending: false,
                    lowBudgetPending: false,
                    allowLowBudget: false,
                    lowBudgetConfirmed: false,
                },
            });
            return nextState;
        }
        return {
            ...workingState,
            meta: { ...(workingState?.meta || {}), wasQuestion: isUserQuestion(normalizedMessage) },
        };
    }

    if (hasLowBudgetPending) {
        if (budgetDecisionProceed) {
            const shouldConfirmLowBudget = isWebsiteDevelopmentService(workingState?.service);
            const nextState = recomputeProgress({
                ...workingState,
                meta: {
                    ...(workingState?.meta || {}),
                    lowBudgetPending: false,
                    lowBudgetConfirmPending: shouldConfirmLowBudget,
                    allowLowBudget: shouldConfirmLowBudget ? false : true,
                },
            });
            return nextState;
        }
        if (budgetDecisionIncrease) {
            const cleared = clearBudgetSlot(workingState);
            const nextState = recomputeProgress({
                ...cleared,
                meta: {
                    ...(cleared?.meta || {}),
                    lowBudgetPending: false,
                    lowBudgetConfirmPending: false,
                    allowLowBudget: false,
                    lowBudgetConfirmed: false,
                },
            });
            return nextState;
        }
        if (!budgetInputDetected) {
            return {
                ...workingState,
                meta: { ...(workingState?.meta || {}), wasQuestion: isUserQuestion(normalizedMessage) },
            };
        }
        workingState = {
            ...workingState,
            meta: {
                ...(workingState?.meta || {}),
                lowBudgetPending: false,
                lowBudgetConfirmPending: false,
                allowLowBudget: false,
            },
        };
    }

    const greetingOnly =
        !workingState?.pendingQuestionKey && isGreetingMessage(normalizedMessage);

    const activeKey =
        workingState?.pendingQuestionKey ||
        (greetingOnly ? null : questions[workingState?.currentStep || 0]?.key) ||
        null;

    const nextState = applyMessageToState(
        {
            ...workingState,
            questions,
            serviceSource: source,
            serviceDefinition: definition,
        },
        message,
        activeKey
    );

    if (nextState?.meta?.allowLowBudget) {
        const budgetCheck = validateWebsiteBudget(nextState?.collectedData || {});
        if (budgetCheck?.isValid) {
            nextState.meta.allowLowBudget = false;
        }
    }
    if (isWebsiteDevelopmentService(nextState?.service) && nextState?.meta?.allowLowBudget) {
        const rawBudget = normalizeText(nextState?.collectedData?.budget_range || "");
        const parsed = parseInrBudgetRange(rawBudget);
        if (parsed && Number.isFinite(parsed.max) && parsed.max >= CATA_WEBSITE_MIN_BUDGET) {
            nextState.meta.allowLowBudget = false;
            nextState.meta.lowBudgetConfirmed = false;
            nextState.meta.lowBudgetStatus = "";
        }
    }

    const resolvedAfter = resolveCataService(nextState?.service);
    if (resolvedAfter && nextState?.sharedContext) {
        nextState.sharedContext = {
            ...nextState.sharedContext,
            active_service: resolvedAfter,
        };
    }

    return {
        ...nextState,
        pendingQuestionKey: null,
    };
}

/**
 * Get the next humanized question
 * @param {Object} state - Current conversation state
 * @returns {string} Next question with suggestions formatted
 */
export function getNextHumanizedQuestion(state) {
    const questions = Array.isArray(state?.questions) ? state.questions : [];
    const slots = state?.slots || {};
    const locale = state?.i18n?.locale || "en";
    const missingRequired = Array.isArray(state?.missingRequired) ? state.missingRequired : [];
    const missingOptional = Array.isArray(state?.missingOptional) ? state.missingOptional : [];
    const isCataFlow = isCataService(state?.service);
    const suppressSharedIntro = questions.length
        ? questions.every((question) => Boolean(question?.disableSharedContext))
        : false;

    if (!questions.length) return null;

    if (state?.meta?.lowBudgetConfirmPending) {
        return `Please confirm you want to continue with this budget.\n[SUGGESTIONS: ${LOW_BUDGET_CONFIRM_SUGGESTIONS.join(" | ")}]`;
    }

    const findSharedConflict = (requiredOnly) => {
        for (const question of questions) {
            if (!question?.key) continue;
            if (requiredOnly && !isRequiredQuestion(question)) continue;
            const slot = slots[question.key];
            if (slot?.sharedConflict || slot?.validationErrors?.includes("shared_conflict")) {
                return question.key;
            }
        }
        return null;
    };

    const sharedConflictKey = missingRequired.length
        ? findSharedConflict(true)
        : findSharedConflict(false);

    if (sharedConflictKey) {
        const question = questions.find((q) => q.key === sharedConflictKey) || null;
        const slot = question ? slots[question.key] : null;
        if (question && slot?.sharedConflict) {
            const prompt = buildSharedConflictPrompt(question, slot.sharedConflict);
            if (prompt) {
                state.pendingQuestionKey = question.key;
                return prompt;
            }
        }
    }

    const lowBudgetWarning = buildLowBudgetWarning(state);
    if (lowBudgetWarning) {
        state.meta = { ...(state?.meta || {}), lowBudgetPending: true };
        return `${lowBudgetWarning}\n[SUGGESTIONS: ${LOW_BUDGET_SUGGESTIONS.join(" | ")}]`;
    }

    const findIssue = (requiredOnly) => {
        for (const question of questions) {
            if (!question?.key) continue;
            if (requiredOnly && !isRequiredQuestion(question)) continue;
            const slot = slots[question.key];
            if (slot?.status === "ambiguous" || slot?.status === "invalid") {
                return question.key;
            }
        }
        return null;
    };

    const issueKey = missingRequired.length
        ? findIssue(true)
        : findIssue(false);

    let question = null;
    let text = "";
    let suggestionsOverride = null;
    let isClarification = false;

    if (issueKey) {
        question = questions.find((q) => q.key === issueKey) || null;
        const slot = question ? slots[question.key] : null;
        if (question && slot) {
            isClarification = true;
            const templates = resolveTemplatesForLocale(question, locale);
            const basePrompt = templates.length ? templates[0] : question.prompt || "";
            if (isCataFlow) {
                text = basePrompt;
                if (!slot.clarifiedOnce) {
                    slot.clarifiedOnce = true;
                }
            } else {
                const isNameQuestion = question.key === "name";

                if (isNameQuestion) {
                    const validationErrors = Array.isArray(slot.validationErrors)
                        ? slot.validationErrors
                        : [];
                    const hasGreetingError = validationErrors.includes("greeting_only");
                    text = hasGreetingError ? "Hi! What's your name?" : "Thanks! What should I call you?";

                    if (!slot.clarifiedOnce) {
                        slot.clarifiedOnce = true;
                    }
                } else {
                    text = `${basePrompt}\n${buildClarificationText(question)}`.trim();

                    if (!slot.clarifiedOnce) {
                        slot.clarifiedOnce = true;
                    } else {
                        suggestionsOverride = buildForcedChoices(question);
                        if (suggestionsOverride) {
                            text = `${basePrompt}\nPlease choose one option below.`.trim();
                        }
                    }

                    if (slot.options && slot.options.length) {
                        suggestionsOverride = slot.options;
                    }
                }
            }
        }
    }

    if (!question) {
        const nextKey = findNextQuestionKey(questions, missingRequired, missingOptional);
        if (!nextKey) return null;
        question = questions.find((q) => q.key === nextKey) || null;
        if (!question) return null;

        const slot = slots[question.key];
        const templates = resolveTemplatesForLocale(question, locale);
        const basePrompt = templates.length ? templates[0] : question.prompt || "";
        const askedCount = slot?.askedCount || 0;
        if (askedCount > 0 && !isCataFlow) {
            text = `Quick check: ${basePrompt}`;
        } else {
            text = basePrompt;
        }
    }

    if (!text && question?.prompt) {
        text = question.prompt;
    }

    text = applyTemplatePlaceholders(text, state);

    if (
        !isClarification &&
        !isCataFlow &&
        !suppressSharedIntro &&
        !state?.meta?.sharedContextIntroShown &&
        hasSharedContextValue(state?.sharedContext)
    ) {
        const asked = Array.isArray(state?.asked) ? state.asked : [];
        if (asked.length === 0) {
            const serviceLabel = resolveIntroServiceLabel(state?.service || "");
            const intro = `I'll reuse what you already shared and only ask what's missing for ${serviceLabel}.`;
            text = `${intro}\n${text}`.trim();
            state.meta = { ...(state?.meta || {}), sharedContextIntroShown: true };
        }
    }

    if (!isCataFlow) {
        if (!suggestionsOverride && question?.key === "tech") {
            const techSuggestions = resolveWebsiteTechSuggestions(state, questions, question);
            if (Array.isArray(techSuggestions) && techSuggestions.length) {
                suggestionsOverride = techSuggestions;
            }
        }
        if (!suggestionsOverride && question?.key === "deployment") {
            const deploymentSuggestions = resolveWebsiteDeploymentSuggestions(state, question);
            if (Array.isArray(deploymentSuggestions) && deploymentSuggestions.length) {
                suggestionsOverride = deploymentSuggestions;
            }
        }
        if (!suggestionsOverride && question?.key === "timeline") {
            const timelineSuggestions = resolveWebsiteTimelineSuggestions(state, questions, question);
            if (Array.isArray(timelineSuggestions) && timelineSuggestions.length) {
                suggestionsOverride = timelineSuggestions;
            }
        }
    }

    const suggestionsToUse =
        question?.hideSuggestions
            ? null
            : Array.isArray(suggestionsOverride) && suggestionsOverride.length
                ? suggestionsOverride
                : question?.suggestions;

    if (suggestionsToUse && suggestionsToUse.length) {
        const tag = question.multiSelect ? "MULTI_SELECT" : "SUGGESTIONS";
        text += `\n[${tag}: ${suggestionsToUse.join(" | ")}]`;
    }

    if (question?.multiSelect && Number.isFinite(question.maxSelect) && question.maxSelect > 0) {
        text += `\n[MAX_SELECT: ${question.maxSelect}]`;
    }

    if (question?.key) {
        state.pendingQuestionKey = question.key;
    }

    return question?.key ? withQuestionKeyTag(text.trim(), question.key) : text.trim();
}

/**
 * Check if we have enough info to generate proposal
 * @param {Object} state - Current conversation state
 * @returns {boolean}
 */
export function shouldGenerateProposal(state) {
    const questions = Array.isArray(state?.questions) ? state.questions : [];
    const slots = state?.slots || {};
    const lowBudgetWarning = buildLowBudgetWarning(state);
    if (lowBudgetWarning) return false;
    if (state?.meta?.lowBudgetPending || state?.meta?.lowBudgetConfirmPending) return false;
    const { missingRequired, missingOptional } = buildMissingLists(
        questions,
        slots,
        state?.collectedData || {},
        { service: state?.service }
    );
    return missingRequired.length === 0 && missingOptional.length === 0;
}

const parseTimelineWeeks = (value = "") => {
    const text = normalizeText(value).toLowerCase();
    if (!text) return null;

    let match = text.match(/\b(\d+)\s*weeks?\b/);
    if (match) return Math.max(1, parseInt(match[1], 10));

    match = text.match(/\b(\d+)\s*months?\b/);
    if (match) return Math.max(1, parseInt(match[1], 10) * 4);

    match = text.match(/\b(\d+)\s*days?\b/);
    if (match) return Math.max(1, Math.ceil(parseInt(match[1], 10) / 7));

    return null;
};

const parseDurationMonths = (value = "") => {
    const text = normalizeText(value).toLowerCase();
    if (!text) return null;

    let match = text.match(/\b(\d+(?:\.\d+)?)\s*months?\b/);
    if (match) {
        const months = parseFloat(match[1]);
        return Number.isFinite(months) ? Math.max(1, Math.round(months)) : null;
    }

    match = text.match(/\b(\d+(?:\.\d+)?)\s*weeks?\b/);
    if (match) {
        const weeks = parseFloat(match[1]);
        return Number.isFinite(weeks) ? Math.max(1, Math.ceil(weeks / 4)) : null;
    }

    match = text.match(/\b(\d+(?:\.\d+)?)\s*days?\b/);
    if (match) {
        const days = parseFloat(match[1]);
        return Number.isFinite(days) ? Math.max(1, Math.ceil(days / 30)) : null;
    }

    return null;
};

const collectRoadmapFeatureParts = (collectedData = {}) => {
    const normalizeList = (raw = "") =>
        splitSelections(raw)
            .map((part) => normalizeText(part))
            .filter(Boolean)
            .filter((part) => {
                const lower = part.toLowerCase();
                return lower !== "none" && lower !== "[skipped]";
            });

    const pagesRaw = normalizeText(collectedData.pages || collectedData.pages_inferred || "");
    const pages = normalizeList(pagesRaw);

    const integrationsRaw = normalizeText(collectedData.integrations || "");
    const integrations = normalizeList(integrationsRaw);

    const merged = [...pages, ...integrations];
    const seen = new Set();
    const unique = [];
    for (const item of merged) {
        const canon = canonicalize(String(item || "").toLowerCase());
        if (!canon) continue;
        if (seen.has(canon)) continue;
        seen.add(canon);
        unique.push(item);
    }

    return { pages, integrations, all: unique };
};

const collectRoadmapFeatures = (collectedData = {}) =>
    collectRoadmapFeatureParts(collectedData).all;

const buildWebsiteRoadmapMilestones = ({ weeks, isEcommerce, hasAdmin } = {}) => {
    const totalWeeks = Number.isFinite(weeks) && weeks > 0 ? weeks : 6;
    const milestones = [];

    if (isEcommerce) {
        milestones.push("Week 1: Setup, DB schema, auth, UI foundation");
        milestones.push("Week 2: Product catalog + categories, search & filters");
        milestones.push("Week 3: Product pages + reviews, cart + wishlist");
        milestones.push("Week 4: Checkout, payments + webhooks, order flow");
        if (hasAdmin) {
            milestones.push("Week 5: Admin panel, coupons, order tracking, email notifications");
        } else {
            milestones.push("Week 5: Order management + notifications, refinements");
        }
        milestones.push("Week 6: QA, deployment (domain+SSL), handover");
    } else {
        milestones.push("Week 1: Discovery, design direction, setup");
        milestones.push("Week 2: Core pages + content structure");
        milestones.push("Week 3: Forms/integrations, responsive polish");
        milestones.push("Week 4: QA, deployment (domain+SSL), handover");
    }

    // If timeline is shorter, compress to the last N milestones.
    if (totalWeeks <= 4) {
        return milestones.slice(-Math.max(3, totalWeeks));
    }
    if (totalWeeks < milestones.length) {
        return milestones.slice(0, totalWeeks);
    }
    return milestones;
};

export function generateRoadmapFromState(state) {
    const collectedData = state?.collectedData || {};

    const projectName =
        normalizeText(collectedData.company) ||
        normalizeText(collectedData.project) ||
        normalizeText(collectedData.brand) ||
        "Your project";

    const websiteType = normalizeText(collectedData.website_type) || "Website";
    const techStack = normalizeText(collectedData.tech) || "To be confirmed";

    const budgetRaw = normalizeText(collectedData.budget);
    const budgetParsed = budgetRaw ? parseInrBudgetRange(budgetRaw) : null;
    const budgetDisplay = budgetParsed ? formatBudgetDisplay(budgetParsed) || budgetRaw : (budgetRaw || "");

    const timelineRaw = normalizeText(collectedData.timeline);
    const timelineWeeks = parseTimelineWeeks(timelineRaw);

    const description = normalizeText(collectedData.description);
    const featureParts = collectRoadmapFeatureParts(collectedData);
    const features = featureParts.all;

    const isEcommerce =
        websiteType.toLowerCase().includes("e-commerce") ||
        websiteType.toLowerCase().includes("ecommerce") ||
        features.some((f) => canonicalize(f.toLowerCase()) === canonicalize("Shop/Store".toLowerCase())) ||
        features.some((f) => canonicalize(f.toLowerCase()) === canonicalize("Cart/Checkout".toLowerCase()));

    const hasAdmin = features.some(
        (f) => canonicalize(f.toLowerCase()) === canonicalize("Admin Dashboard".toLowerCase())
    );

    const milestones = buildWebsiteRoadmapMilestones({
        weeks: timelineWeeks,
        isEcommerce,
        hasAdmin,
    });

    const pageLine = featureParts.pages.length
        ? featureParts.pages.join(", ")
        : "To be finalized from requirements";

    const integrationsLine = featureParts.integrations.length
        ? featureParts.integrations.join(", ")
        : "None specified yet";

    const summarize = (value = "", maxLen = 180) => {
        const text = normalizeText(value);
        if (!text) return "";
        const cleaned = text.replace(/\s+/g, " ").trim();
        if (cleaned.length <= maxLen) return cleaned;

        const head = cleaned.slice(0, maxLen);
        const lastBoundary = Math.max(head.lastIndexOf("."), head.lastIndexOf("!"), head.lastIndexOf("\n"));
        const trimmed = lastBoundary >= 60 ? head.slice(0, lastBoundary + 1) : head;
        return `${trimmed.trim()}...`;
    };

    const summary = (() => {
        const cleaned = summarize(description);
        const descriptionLooksClean =
            cleaned &&
            cleaned.length <= 140 &&
            !/\b(budget|timeline|deadline|tech\s*stack|stack)\b/i.test(description);
        if (descriptionLooksClean) return cleaned;

        const pageCanon = new Set(featureParts.pages.map((p) => canonicalize(String(p || "").toLowerCase())));
        const integrationCanon = new Set(
            featureParts.integrations.map((p) => canonicalize(String(p || "").toLowerCase()))
        );

        const hasPage = (label) => pageCanon.has(canonicalize(String(label || "").toLowerCase()));
        const hasIntegration = (label) =>
            integrationCanon.has(canonicalize(String(label || "").toLowerCase()));

        const base = isEcommerce ? "E-commerce website" : `${websiteType} website`;
        const highlights = [];

        if (/\b(?:virtual\s*try\s*-?\s*on|try\s*-?\s*on|augmented\s+reality|\bar\b|shade\s*(?:match|test))\b/i.test(
            description
        )) {
            highlights.push("virtual try-on/AR");
        }

        if (hasPage("Products") || hasPage("Shop/Store")) highlights.push("product catalog");
        if (hasPage("Search")) highlights.push("search & filters");
        if (hasPage("Cart/Checkout")) highlights.push("cart & checkout");
        if (hasIntegration("Payment Gateway (Razorpay/Stripe)")) highlights.push("payments");
        if (hasAdmin) highlights.push("admin panel");
        if (hasPage("Order Tracking")) highlights.push("order tracking");
        if (hasPage("Notifications")) highlights.push("notifications");
        if (hasPage("Reviews/Ratings")) highlights.push("reviews");
        if (hasPage("Wishlist")) highlights.push("wishlist");

        const short = highlights.filter(Boolean).slice(0, 6);
        if (!short.length) return base;
        return `${base} with ${short.join(", ")}`;
    })();

    const applyWebsiteBudgetRules =
        Array.isArray(state?.questions) &&
        state.questions.some((q) => q?.key === "tech") &&
        state.questions.some((q) => q?.key === "pages");

    const budgetCheck = applyWebsiteBudgetRules ? validateWebsiteBudget(collectedData) : null;
    const requirement = budgetCheck?.requirement || null;
    const requiredMin = Number.isFinite(requirement?.min) ? requirement.min : null;
    const minLabel = requiredMin ? formatInr(requiredMin) : "";
    const scopeLabel = requirement?.label || "this scope";

    const costBuckets = isEcommerce
        ? [
            { label: "Setup", pct: 0.15 },
            { label: "Catalog+PDP", pct: 0.25 },
            { label: "Checkout+Payments", pct: 0.3 },
            { label: "Admin/Ops", pct: 0.2 },
            { label: "QA+Deploy", pct: 0.1 },
        ]
        : [
            { label: "Discovery+Design", pct: 0.25 },
            { label: "Build", pct: 0.45 },
            { label: "Integrations", pct: 0.15 },
            { label: "QA+Deploy", pct: 0.15 },
        ];

    const shouldUseMinimumForBreakdown =
        Boolean(budgetCheck && !budgetCheck.isValid && budgetCheck.reason === "too_low" && requiredMin);

    const costBaseAmount = (() => {
        if (shouldUseMinimumForBreakdown) return requiredMin;
        if (budgetParsed && Number.isFinite(budgetParsed.max)) return budgetParsed.max;
        return null;
    })();

    const costBaseLabel = costBaseAmount ? formatInr(costBaseAmount) : "";

    const costSplit = (() => {
        const pctOnly = costBuckets
            .map((b) => `${b.label} ${Math.round(b.pct * 100)}%`)
            .join(" | ");

        if (!costBaseAmount) return pctOnly;

        return costBuckets
            .map((b) => {
                const amount = Math.round(costBaseAmount * b.pct);
                return `${b.label} ~${formatInr(amount)}`;
            })
            .join(" | ");
    })();

    const costSplitTitle = (() => {
        if (!costBaseAmount) return "Cost split (rough)";
        if (shouldUseMinimumForBreakdown) return `Cost split (rough, based on minimum ${costBaseLabel})`;
        if (budgetDisplay) return `Cost split (rough, based on ${costBaseLabel})`;
        return `Cost split (rough, based on ${costBaseLabel})`;
    })();

    const feasibilityNote = (() => {
        if (!budgetRaw) return "";
        if (!applyWebsiteBudgetRules || !budgetCheck) return "";
        if (budgetCheck.isValid) return "";

        if (budgetCheck.reason === "too_low" && minLabel) {
            return (
                `\n\nFeasibility: ${budgetDisplay || budgetRaw} is below the minimum for ${scopeLabel} (${minLabel}+).` +
                `\nOptions:` +
                `\n- Increase budget to ${minLabel}+` +
                `\n- Keep budget and reduce scope / phase delivery` +
                `\n- Switch to a lower-cost stack (e.g., WordPress/Shopify)`
            );
        }

        return minLabel ? `\n\nFeasibility: Budget should be at least ${minLabel}+ for ${scopeLabel}.` : "";
    })();

    const titleBits = [
        budgetDisplay ? budgetDisplay : null,
        timelineRaw ? timelineRaw : null,
    ].filter(Boolean);

    const titleSuffix = titleBits.length ? ` (${titleBits.join(", ")})` : "";

    const summaryLine = summary ? `Summary: ${summary}` : "";

    return (
        `Roadmap + Estimate${titleSuffix}\n` +
        `Project: ${stripMarkdownFormatting(projectName)} (${websiteType})\n` +
        `Stack: ${stripMarkdownFormatting(techStack)}\n` +
        (summaryLine ? `${stripMarkdownFormatting(summaryLine)}\n` : "") +
        `Pages/features: ${stripMarkdownFormatting(pageLine)}\n` +
        `Integrations: ${stripMarkdownFormatting(integrationsLine)}\n\n` +
        `Milestones:\n` +
        milestones.map((m) => `- ${m}`).join("\n") +
        `\n\n${costSplitTitle}: ${costSplit}` +
        feasibilityNote
    ).trim();
}

const formatCataListValue = (value) => {
    if (Array.isArray(value)) {
        return value
            .map((item) => normalizeText(item))
            .filter((item) => item && item !== "[skipped]")
            .join(", ");
    }
    const normalized = normalizeText(value);
    return normalized === "[skipped]" ? "" : normalized;
};

const resolveCataFieldValue = (state, key) => {
    const slot = state?.slots?.[key];
    if (slot?.status === "answered") {
        return slot.normalized ?? formatSlotValue(slot);
    }
    const collected = state?.collectedData?.[key];
    const collectedText = normalizeText(collected);
    if (collectedText && collectedText !== "[skipped]") return collected;
    const sharedContext = normalizeSharedContext(state?.sharedContext || {});
    const sharedValue = resolveCataSharedValue(sharedContext, { key }, state?.service);
    const sharedText = normalizeText(sharedValue);
    return sharedText === "[skipped]" ? "" : sharedValue;
};

const generateCataProposalFromState = (state) => {
    const resolvedService = resolveCataService(state?.service);
    if (!resolvedService) return "";

    const clientName = normalizeText(
        resolveCataFieldValue(state, "name") ||
        normalizeSharedContext(state?.sharedContext || {}).global?.client_name ||
        ""
    );

    if (resolvedService === "Website Development") {
        const sharedContext = normalizeSharedContext(state?.sharedContext || {});
        const projectName = normalizeText(sharedContext.project_name || "");

        const requirement = normalizeText(resolveCataFieldValue(state, "website_requirement"));
        const objective = normalizeText(resolveCataFieldValue(state, "primary_objective"));
        const designExperience = normalizeText(resolveCataFieldValue(state, "design_experience"));
        const websiteType = normalizeText(resolveCataFieldValue(state, "website_type"));
        const platformPreference = formatCataListValue(
            resolveCataFieldValue(state, "platform_preference")
        );
        const techStack = formatCataListValue(resolveCataFieldValue(state, "tech_stack"));
        const backend = formatCataListValue(resolveCataFieldValue(state, "backend"));
        const database = formatCataListValue(resolveCataFieldValue(state, "database"));
        const ecommerce = formatCataListValue(resolveCataFieldValue(state, "ecommerce"));
        const additionalPages = formatCataListValue(resolveCataFieldValue(state, "additional_pages"));
        const contentStatus = normalizeText(resolveCataFieldValue(state, "content_status"));
        const references = normalizeText(resolveCataFieldValue(state, "references"));
        const timeline = normalizeText(resolveCataFieldValue(state, "launch_timeline"));
        const budget = normalizeText(resolveCataFieldValue(state, "budget_range"));

        const sections = ["[PROPOSAL_DATA]"];
        sections.push("## Proposal Title");
        const titleSuffix = projectName ? ` - ${projectName}` : "";
        sections.push(`- Website Development Proposal${titleSuffix}`);
        sections.push("");

        const overviewLines = ["- Service: Website Development"];
        if (clientName) overviewLines.push(`- Client: ${clientName}`);
        if (projectName) overviewLines.push(`- Project: ${projectName}`);
        if (websiteType) overviewLines.push(`- Website type: ${websiteType}`);
        if (requirement) overviewLines.push(`- Requirement: ${requirement}`);
        if (objective) overviewLines.push(`- Primary objective: ${objective}`);
        if (designExperience) overviewLines.push(`- Design experience: ${designExperience}`);

        sections.push("Project Overview");
        sections.push(...overviewLines);
        sections.push("");

        const techLines = [];
        if (platformPreference) techLines.push(`- Platform preference: ${platformPreference}`);
        if (techStack) techLines.push(`- Tech stack: ${techStack}`);
        if (backend) techLines.push(`- Backend: ${backend}`);
        if (database) techLines.push(`- Database: ${database}`);
        if (ecommerce) techLines.push(`- E-commerce: ${ecommerce}`);

        if (techLines.length) {
            sections.push("Tech & Platform");
            sections.push(...techLines);
            sections.push("");
        }

        sections.push("Pages & Content");
        sections.push("- Core pages included: Home, About, Contact, Privacy Policy, Terms");
        if (additionalPages) sections.push(`- Additional pages/features: ${additionalPages}`);
        if (contentStatus) sections.push(`- Content status: ${contentStatus}`);
        if (references) sections.push(`- Reference websites: ${references}`);
        sections.push("");

        if (timeline) {
            sections.push("Timeline");
            sections.push(`- ${timeline}`);
            sections.push("");
        }

        const lowBudgetStatus = normalizeText(state?.meta?.lowBudgetStatus || "");

        if (budget || lowBudgetStatus) {
            sections.push("Budget Range");
            if (budget) sections.push(`- ${budget}`);
            if (lowBudgetStatus) sections.push(`- ${lowBudgetStatus}`);
            sections.push("");
        }

        sections.push("Next Steps");
        sections.push("- Approve proposal to kick start the project");
        sections.push("[/PROPOSAL_DATA]");

        return sections.join("\n").trim();
    }

    if (resolvedService === "Lead Generation") {
        const businessType = normalizeText(resolveCataFieldValue(state, "business_type"));
        const targetAudience = normalizeText(resolveCataFieldValue(state, "target_audience"));
        const examples = normalizeText(resolveCataFieldValue(state, "examples_links"));

        const sections = ["[PROPOSAL_DATA]"];
        sections.push("## Proposal Title");
        sections.push(`- Lead Generation Proposal — ${clientName}`);
        sections.push("");

        sections.push("Confirmed Brief");
        sections.push("- Service: Lead Generation");
        sections.push(`- Business type: ${businessType}`);
        sections.push(`- Target audience: ${targetAudience}`);
        sections.push(`- Examples/case studies: ${examples}`);
        sections.push("");

        sections.push("Next Steps");
        sections.push("- Confirm the brief");
        sections.push("- Share any missing assets or links");
        sections.push("- Approve proposal to begin");
        sections.push("[/PROPOSAL_DATA]");

        return sections.join("\n").trim();
    }

    if (resolvedService === "SEO Optimization") {
        const businessCategory = normalizeText(resolveCataFieldValue(state, "business_category"));
        const targetLocations = normalizeText(resolveCataFieldValue(state, "target_locations"));
        const keywordPlanning = normalizeText(resolveCataFieldValue(state, "keyword_planning"));
        const primaryGoal = normalizeText(resolveCataFieldValue(state, "primary_goal"));
        const contentStatus = normalizeText(resolveCataFieldValue(state, "content_status"));
        const seoSituation = normalizeText(resolveCataFieldValue(state, "seo_situation"));
        const competitionLevel = normalizeText(resolveCataFieldValue(state, "competition_level"));
        const serviceDuration = normalizeText(resolveCataFieldValue(state, "service_duration"));
        const growthExpectation = normalizeText(resolveCataFieldValue(state, "growth_expectation"));
        const budgetRange = normalizeText(resolveCataFieldValue(state, "budget_range"));

        const sections = ["[PROPOSAL_DATA]"];
        sections.push("## Proposal Title");
        const titleSuffix = clientName ? ` - ${clientName}` : "";
        sections.push(`- SEO Optimization Proposal${titleSuffix}`);
        sections.push("");

        sections.push("Confirmed Brief");
        sections.push("- Service: SEO Optimization");
        sections.push(`- Business category: ${businessCategory}`);
        sections.push(`- Target locations: ${targetLocations}`);
        sections.push(`- Keyword planning: ${keywordPlanning}`);
        sections.push(`- Primary goal: ${primaryGoal}`);
        sections.push(`- Content status: ${contentStatus}`);
        sections.push(`- Current SEO situation: ${seoSituation}`);
        sections.push(`- Competition level: ${competitionLevel}`);
        sections.push(`- SEO duration: ${serviceDuration}`);
        sections.push(`- Growth expectation: ${growthExpectation}`);
        sections.push(`- Monthly budget range: ${budgetRange}`);
        sections.push("");

        sections.push("Next Steps");
        sections.push("- Confirm the brief");
        sections.push("- Share access/website details if needed");
        sections.push("- Approve proposal to begin");
        sections.push("[/PROPOSAL_DATA]");

        return sections.join("\n").trim();
    }

    if (resolvedService === "Branding (Naming, Logo & Brand Identity)") {
        const brandStage = normalizeText(resolveCataFieldValue(state, "brand_stage"));
        const namingSupport = normalizeText(resolveCataFieldValue(state, "naming_support"));
        const brandPerception = normalizeText(resolveCataFieldValue(state, "brand_perception"));
        const targetAudience = normalizeText(resolveCataFieldValue(state, "target_audience"));
        const brandingUsage = normalizeText(resolveCataFieldValue(state, "branding_usage"));
        const referenceBrands = normalizeText(resolveCataFieldValue(state, "reference_brands"));
        const deliverablesRaw = resolveCataFieldValue(state, "deliverables");
        const deliverablesList = listFromValue(deliverablesRaw);
        const timeline = normalizeText(resolveCataFieldValue(state, "timeline"));
        const creativeFreedom = normalizeText(resolveCataFieldValue(state, "creative_freedom"));
        const budgetRange = normalizeText(resolveCataFieldValue(state, "budget_range"));

        const sections = ["[PROPOSAL_DATA]"];
        sections.push("## Proposal Title");
        const titleSuffix = clientName ? ` - ${clientName}` : "";
        sections.push(`- Branding Proposal${titleSuffix}`);
        sections.push("");

        sections.push("Confirmed Brief");
        sections.push("- Service: Branding (Naming, Logo & Brand Identity)");
        sections.push(`- Brand stage: ${brandStage}`);
        sections.push(`- Naming support: ${namingSupport}`);
        sections.push(`- Brand perception: ${brandPerception}`);
        sections.push(`- Target audience: ${targetAudience}`);
        sections.push(`- Primary usage: ${brandingUsage}`);
        sections.push(`- Reference brands: ${referenceBrands}`);
        sections.push("");

        sections.push("Deliverables");
        if (deliverablesList.length) {
            deliverablesList.forEach((item) => sections.push(`- ${item}`));
        } else {
            sections.push("- To be confirmed");
        }
        sections.push("");

        if (timeline) {
            sections.push("Timeline");
            sections.push(`- ${timeline}`);
            sections.push("");
        }

        if (creativeFreedom) {
            sections.push("Creative Direction");
            sections.push(`- ${creativeFreedom}`);
            sections.push("");
        }

        if (budgetRange) {
            sections.push("Budget Range");
            sections.push(`- ${budgetRange}`);
            sections.push("");
        }

        sections.push("Next Steps");
        sections.push("- Approve proposal to kick start the project");
        sections.push("[/PROPOSAL_DATA]");

        return sections.join("\n").trim();
    }

    return "";
};

/**
 * Generate proposal from collected state
 * @param {Object} state - Completed conversation state
 * @returns {string} Proposal in [PROPOSAL_DATA] format
 */
export function generateProposalFromState(state) {
    const cataProposal = generateCataProposalFromState(state);
    if (cataProposal) return cataProposal;
    const collectedData = state?.collectedData || {};
    const questions = Array.isArray(state?.questions) ? state.questions : [];
    const slots = state?.slots || {};
    const sharedContext = normalizeSharedContext(state?.sharedContext || {});
    const rawService = normalizeText(state?.service || "");
    const serviceName =
        rawService && rawService.toLowerCase() !== "default"
            ? rawService
            : "General Services";

    const normalizeValue = (value = "") => {
        const text = normalizeText(value);
        if (!text || text === "[skipped]") return "";
        return text;
    };

    const firstNonEmpty = (...values) => {
        for (const value of values) {
            if (Array.isArray(value)) {
                for (const item of value) {
                    const text = normalizeValue(item);
                    if (text) return text;
                }
                continue;
            }
            const text = normalizeValue(value);
            if (text) return text;
        }
        return "";
    };

    const getSlotValue = (key = "") => {
        const slot = slots[key];
        if (slot?.status === "answered") {
            return formatSlotValue(slot);
        }
        return normalizeValue(collectedData[key]);
    };

    const getValuesByTag = (tag) => {
        const values = [];
        const seen = new Set();
        for (const question of questions) {
            if (!question?.key) continue;
            const tags = Array.isArray(question.tags) && question.tags.length
                ? question.tags
                : getQuestionTags(question);
            if (!tags.includes(tag)) continue;
            const value = getSlotValue(question.key);
            if (!value) continue;
            const canon = canonicalize(value.toLowerCase());
            if (canon && !seen.has(canon)) {
                seen.add(canon);
                values.push(value);
            }
        }
        return values;
    };

    const addUnique = (list, value) => {
        if (!list) return;
        if (Array.isArray(value)) {
            value.forEach((item) => addUnique(list, item));
            return;
        }
        const text = normalizeValue(value);
        if (!text) return;
        const canon = canonicalize(text.toLowerCase());
        if (!canon) return;
        if (list.some((item) => canonicalize(normalizeText(item).toLowerCase()) === canon)) return;
        list.push(text);
    };

    const cleanList = (items = []) => {
        const cleaned = [];
        const seen = new Set();
        for (const item of items) {
            const text = normalizeValue(item);
            if (!text) continue;
            const canon = canonicalize(text.toLowerCase());
            if (!canon || canon === "none" || canon === "na" || canon === "nopreference") continue;
            if (seen.has(canon)) continue;
            seen.add(canon);
            cleaned.push(text);
        }
        return cleaned;
    };

    const listFromValue = (value) => cleanList(splitSelections(normalizeValue(value)));

    const summarizeLine = (value, suffix = ".") => {
        const text = normalizeValue(value);
        if (!text) return "";
        const cleaned = text.replace(/\s+/g, " ").trim();
        if (!cleaned) return "";
        if (/[.!?]$/.test(cleaned)) return cleaned;
        return `${cleaned}${suffix}`;
    };

    const formatCurrency = (amount, currency = DEFAULT_CURRENCY) => {
        if (!Number.isFinite(amount)) return "";
        const locale = currency === "INR" ? "en-IN" : "en-US";
        const rounded = Math.round(amount);
        const formatted = rounded.toLocaleString(locale);
        return `${currency} ${formatted}`;
    };

    const formatBudgetNormalized = (normalized) => {
        if (!normalized) return "";
        if (normalized.flexible) return "Flexible";
        const currency = normalized.currency || DEFAULT_CURRENCY;
        const min = Number.isFinite(normalized.min) ? normalized.min : null;
        const max = Number.isFinite(normalized.max) ? normalized.max : null;
        const periodLabel = normalized.period === "month" ? " per month" : "";
        if (min !== null && max !== null && min === max) {
            return `${formatCurrency(min, currency)}${periodLabel}`;
        }
        if (min !== null && max !== null) {
            return `${formatCurrency(min, currency)} - ${formatCurrency(max, currency)}${periodLabel}`;
        }
        if (max !== null) return `Under ${formatCurrency(max, currency)}${periodLabel}`;
        if (min !== null) return `${formatCurrency(min, currency)}+${periodLabel}`;
        return "";
    };

    const formatBudgetValue = (value) => {
        const text = normalizeValue(value);
        if (!text) return "";
        if (/flexible/i.test(text)) return "Flexible";
        const parsed = normalizeMoneyValue(text);
        if (parsed?.status === "ok" && parsed.normalized) {
            const formatted = formatBudgetNormalized(parsed.normalized);
            if (formatted) return formatted;
            if (parsed.normalized.flexible) return "Flexible";
        }
        return text;
    };

    const resolveBudget = () => {
        const budgetQuestion = questions.find((question) =>
            (question?.tags || []).includes("budget") || getQuestionTags(question).includes("budget")
        );
        const budgetKey = budgetQuestion?.key || "";
        let value = "";
        if (budgetKey) {
            const slot = slots[budgetKey];
            if (slot?.status === "answered") {
                if (slot.normalized) {
                    value = formatBudgetNormalized(slot.normalized) || formatSlotValue(slot);
                } else {
                    value = formatSlotValue(slot);
                }
            } else {
                value = normalizeValue(collectedData[budgetKey]);
            }
        }
        if (!value) value = normalizeValue(collectedData.budget);
        const serviceKey = normalizeText(serviceName);
        if (!value && serviceKey && sharedContext.service_budgets) {
            value = normalizeValue(sharedContext.service_budgets[serviceKey]);
        }
        if (!value) value = normalizeValue(sharedContext.general_budget);
        return formatBudgetValue(value);
    };

    const resolveTimeline = () =>
        normalizeValue(
            firstNonEmpty(
                getValuesByTag("timeline"),
                getSlotValue("delivery_timeline"),
                collectedData.timeline,
                sharedContext.timeline
            )
        );

    const resolveServiceCategory = (service) => {
        const canon = canonicalize(normalizeText(service).toLowerCase());
        if (!canon) return "general";
        if (canon.includes("seo")) return "seo";
        if (canon.includes("lead")) return "lead";
        if (canon.includes("website") || canon.includes("webdevelopment") || canon.includes("webdesign")) {
            return "website";
        }
        if (canon.includes("landingpage") || canon.includes("ecommerce")) return "website";
        return "general";
    };

    const clientName = firstNonEmpty(
        resolveSlotDisplayValue(state, "name"),
        resolveSlotDisplayValue(state, "first_name"),
        resolveSlotDisplayValue(state, "full_name"),
        sharedContext.preferred_name,
        sharedContext.full_name
    );

    const projectNameRaw = firstNonEmpty(
        getSlotValue("company"),
        getSlotValue("project"),
        getSlotValue("brand"),
        sharedContext.project_name
    );

    const businessType = firstNonEmpty(getSlotValue("business"), sharedContext.business_type);
    const projectSummary = firstNonEmpty(
        getSlotValue("description"),
        getSlotValue("brief"),
        getValuesByTag("description").join(" "),
        sharedContext.project_one_liner
    );
    const goalValue = firstNonEmpty(
        getSlotValue("goal"),
        getSlotValue("goals"),
        getSlotValue("objective"),
        getValuesByTag("goal").join(", ")
    );
    const audienceValue = firstNonEmpty(getSlotValue("audience"), sharedContext.target_audience);
    const locationValue = firstNonEmpty(
        getSlotValue("geo"),
        getSlotValue("target_location"),
        getValuesByTag("location").join(", "),
        sharedContext.target_location
    );
    const websiteLive = firstNonEmpty(getSlotValue("website_live"), sharedContext.website_live);
    const designStatus = firstNonEmpty(getSlotValue("design"), getSlotValue("design_assets"));
    const techStack = firstNonEmpty(
        getSlotValue("tech"),
        getSlotValue("tech_stack"),
        sharedContext.tech_preferences?.stack
    );
    const hostingPref = firstNonEmpty(
        getSlotValue("deployment"),
        sharedContext.tech_preferences?.hosting
    );
    const domainStatus = firstNonEmpty(
        getSlotValue("domain"),
        sharedContext.tech_preferences?.domain
    );
    const integrationsList = listFromValue(
        firstNonEmpty(getSlotValue("integrations"), sharedContext.integrations)
    );
    const platformsValue = firstNonEmpty(
        getSlotValue("platforms"),
        getSlotValue("channels"),
        getValuesByTag("platforms").join(", ")
    );
    const deliverablesValue = getValuesByTag("deliverables").join(", ");
    const styleValue = getValuesByTag("style").join(", ");
    const notesValue = firstNonEmpty(getSlotValue("assets"), getSlotValue("references"));
    const budgetValue = resolveBudget();
    const timelineValueRaw = resolveTimeline();

    const serviceCategory = resolveServiceCategory(serviceName);
    const phases = [];
    const deliverables = [];
    const tools = [];
    const metrics = [];
    const templateContext = [];
    const templateInputs = [];
    const templateAssumptions = [];
    const templateOutOfScope = [];
    let defaultTimeline = "4-6 weeks";

    const addPhase = (title, tasks, milestone) => phases.push({ title, tasks, milestone });

    if (serviceCategory === "website") {
        const corePages = ["Home", "About", "Services/Products", "Contact", "Privacy Policy", "Terms"];
        const pagesRaw = firstNonEmpty(getSlotValue("pages"), collectedData.pages_inferred);
        const pages = listFromValue(pagesRaw);
        const coreCanons = new Set(corePages.map((item) => canonicalize(item.toLowerCase())));
        const additionalPages = pages.filter((page) => !coreCanons.has(canonicalize(page.toLowerCase())));
        const additionalLabel = additionalPages.length ? additionalPages.join(", ") : "To be confirmed";

        if (!additionalPages.length) {
            addUnique(templateInputs, "List of additional pages/features beyond the core pages.");
            addUnique(templateAssumptions, "Additional pages beyond the core set will be finalized during kickoff.");
        }

        const buildMode = normalizeValue(getSlotValue("build_mode"));
        let stackLabel = techStack;
        if (!stackLabel) {
            stackLabel = /no\s*-?code/i.test(buildMode)
                ? "Webflow or WordPress (no-code)"
                : "React/Next.js + Node.js";
            addUnique(templateAssumptions, `Tech stack assumed as ${stackLabel}.`);
        }

        const hostingList = listFromValue(hostingPref);
        let hostingLabel = hostingList.length ? hostingList.join(", ") : "";
        if (!hostingLabel) {
            hostingLabel = /no\s*-?code/i.test(buildMode)
                ? "Managed hosting on chosen platform"
                : "Vercel/Netlify";
            addUnique(templateAssumptions, `Hosting assumed as ${hostingLabel}.`);
        }

        const websiteIntegrations = listFromValue(firstNonEmpty(getSlotValue("integrations"), sharedContext.integrations));
        const integrationLabel = websiteIntegrations.length ? websiteIntegrations.join(", ") : "Analytics + Email (assumed)";
        if (!websiteIntegrations.length) {
            addUnique(templateAssumptions, "Assuming standard analytics and email integrations unless otherwise specified.");
            addUnique(templateInputs, "Required integrations (payments, CRM, email, analytics).");
        }

        if (!designStatus) addUnique(templateInputs, "Design files, references, or brand guidelines.");
        if (!domainStatus) addUnique(templateInputs, "Domain status and DNS access.");

        const pageCanon = new Set(pages.map((item) => canonicalize(String(item).toLowerCase())));
        const hasEcommerce = ["shopstore", "cartcheckout", "wishlist", "ordertracking"].some((item) =>
            pageCanon.has(canonicalize(item))
        );
        const featureList = [];
        if (hasEcommerce) addUnique(featureList, "Product catalog, cart, and checkout");
        if (!featureList.length) addUnique(featureList, "Lead capture forms and content management");

        addUnique(templateContext, `Website type: ${summarizeLine(getSlotValue("website_type") || "Website")}`);
        if (pages.length) addUnique(templateContext, `Additional pages requested: ${summarizeLine(pages.join(", "))}`);
        if (designStatus) addUnique(templateContext, `Design status: ${summarizeLine(designStatus)}`);

        addPhase(
            "Discovery & Architecture",
            [
                "Requirements workshop and sitemap",
                "Define page list and feature scope",
                "User roles and permissions matrix",
                "Content plan and SEO baseline",
            ],
            "Sitemap, feature list, and user flows approved"
        );
        addPhase(
            "UI/UX & Content Prep",
            [
                "Wireframes and visual design or design adaptation",
                "Responsive layout system and components",
                "Copy guidance and content structure",
            ],
            "Designs or wireframes approved"
        );
        addPhase(
            "Development",
            [
                "Responsive front-end build for all pages",
                "Auth flows (signup/login/reset) and profile management",
                "Admin dashboard modules (users/content/plans)",
            ],
            "Feature-complete build ready for QA"
        );
        addPhase(
            "Integrations & QA",
            [
                `Integrations setup (${integrationLabel})`,
                "Cross-browser and device testing",
                "Performance, accessibility, and SEO checks",
            ],
            "QA sign-off and launch checklist complete"
        );
        addPhase(
            "Launch & Handover",
            [
                "Deploy to hosting and configure domain/SSL",
                "Handover documentation and training",
                "Post-launch support window",
            ],
            "Site live and handover delivered"
        );

        deliverables.push(
            `Sitemap and page list (core: ${corePages.join(", ")}; additional: ${additionalLabel}).`,
            `Core feature list: ${featureList.join(", ")}.`,
            "User roles and permissions matrix (guest/user/admin).",
            "Auth flows: signup/login/reset with email verification.",
            "Admin dashboard modules: user, content, and plan management.",
            `Integrations setup: ${integrationLabel}.`,
            "Hosting/deployment setup and launch checklist.",
            "Handover documentation and post-launch support."
        );

        tools.push(
            `Tech stack: ${stackLabel}`,
            `Hosting/deployment: ${hostingLabel}`,
            "Design handoff (Figma or equivalent)",
            "Analytics (GA4) and event tracking",
            "Email service (SendGrid/Resend) if needed"
        );

        metrics.push(
            "Page load time under 3 seconds (target).",
            "Core Web Vitals passing (to finalize after baseline).",
            "Primary CTA conversion rate (to finalize after baseline).",
            "Form submission or signup volume (to finalize after baseline).",
            "Uptime 99.5%+ after launch."
        );

        addUnique(templateInputs, "Brand assets (logo, colors, fonts) and approved copy.");
        addUnique(templateInputs, "Access to hosting and domain provider.");
        addUnique(templateInputs, "Integration credentials and API keys.");
        addUnique(templateInputs, "Legal pages content (privacy policy, terms).");

        addUnique(templateOutOfScope, "Ongoing content updates beyond the agreed scope.");
        addUnique(templateOutOfScope, "Paid advertising management or media spend.");
        addUnique(templateOutOfScope, "Third-party subscription fees (hosting, domain, plugins).");

        defaultTimeline = "6-8 weeks";
    } else if (serviceCategory === "lead") {
        const leadVolume = normalizeValue(getSlotValue("volume"));
        const offer = normalizeValue(getSlotValue("offer"));
        const geoTarget = firstNonEmpty(getSlotValue("geo"), locationValue);
        const channelPref = firstNonEmpty(getSlotValue("channels"), platformsValue);
        const leadAssets = normalizeValue(getSlotValue("assets"));
        const isB2b = /\bb2b\b|saas|enterprise|agency|consulting/.test(
            (businessType || "").toLowerCase()
        );

        let channelList = listFromValue(channelPref);
        if (!channelList.length) {
            channelList = isB2b
                ? ["LinkedIn Ads", "Cold email", "Google Search"]
                : ["Meta Ads", "Google Search"];
            addUnique(templateAssumptions, "Channel mix assumed based on best-practice fit for the niche.");
        }
        const channelLabel = channelList.join(", ");
        const crmLabel =
            integrationsList.find((item) => /hubspot|salesforce|zoho|crm/i.test(item.toLowerCase())) ||
            "CRM or Google Sheets";

        if (leadVolume) addUnique(templateContext, `Target lead volume: ${summarizeLine(leadVolume)}`);
        if (offer) addUnique(templateContext, `Primary offer/CTA: ${summarizeLine(offer)}`);
        if (geoTarget) addUnique(templateContext, `Target geography: ${summarizeLine(geoTarget)}`);
        if (leadAssets) addUnique(templateContext, `Existing assets: ${summarizeLine(leadAssets)}`);

        addPhase(
            "Strategy & Lead Definition",
            [
                "Define ICP and lead qualification (MQL/SQL)",
                "Clarify offer, CTA, and funnel stages",
                "Set KPIs and measurement plan",
            ],
            "Lead definition and KPI targets approved"
        );
        addPhase(
            "Funnel & Asset Build",
            [
                "Landing page or lead form setup",
                "Lead magnet and booking flow",
                "Email/SMS follow-up sequences",
            ],
            "Funnel assets ready for launch"
        );
        addPhase(
            "Channel Setup & Tracking",
            [
                `Channel setup for ${channelLabel}`,
                "Pixel and conversion event setup",
                "UTM structure and CRM/lead delivery integration",
            ],
            "Tracking and lead delivery ready"
        );
        addPhase(
            "Creative & Launch",
            [
                "Creative production and ad copy",
                "A/B testing plan and initial launch",
                "Budget allocation by channel",
            ],
            "Campaigns live with first tests running"
        );
        addPhase(
            "Optimization & Reporting",
            [
                "Weekly optimization and bidding adjustments",
                "Lead quality feedback loop",
                "Weekly reports and monthly insights",
            ],
            "Stable CPL and lead flow established"
        );

        deliverables.push(
            "ICP and lead definition document (MQL/SQL criteria).",
            `Channel plan and targeting matrix (${channelLabel}).`,
            "Offer and funnel blueprint (landing page, lead magnet, booking).",
            "Creative plan with ad formats and copy angles.",
            "Tracking setup (pixels, conversion events, UTMs).",
            `Lead delivery workflow (${crmLabel} + instant alerts) and response SLA guidance.`,
            "Reporting cadence with weekly KPI summary and monthly insights."
        );

        tools.push(
            `Channels: ${channelLabel}`,
            "Analytics: GA4 + Tag Manager",
            "Tracking: conversion pixels and UTMs",
            `Lead delivery: ${crmLabel}`,
            "Reporting dashboard (Looker Studio or equivalent)"
        );

        metrics.push(
            "Qualified leads per week/month (to finalize after baseline).",
            "Cost per lead (CPL) target (to finalize after baseline).",
            "Landing page conversion rate (to finalize after baseline).",
            "MQL to SQL conversion rate (to finalize after baseline).",
            "Lead response time SLA (recommended under 15 minutes)."
        );

        addUnique(templateInputs, "Access to ad accounts or permission to create new accounts.");
        addUnique(templateInputs, "Offer details, pricing, and qualification criteria.");
        addUnique(templateInputs, "Brand assets and creative guidelines.");
        addUnique(templateInputs, "CRM access or lead delivery preference.");
        addUnique(templateInputs, "Historical campaign data (if available).");

        addUnique(templateAssumptions, "Lead quality depends on response time and follow-up.");
        addUnique(templateOutOfScope, "Ad spend or media budget (billed separately).");
        addUnique(templateOutOfScope, "Sales closing or pipeline management by our team.");
        addUnique(templateOutOfScope, "Platform policy approvals and compliance delays.");

        defaultTimeline = "4-6 weeks for initial ramp + ongoing optimization";
    } else if (serviceCategory === "seo") {
        const seoScope = normalizeValue(getSlotValue("seo_scope") || getSlotValue("seo"));
        const keywords = normalizeValue(getSlotValue("keywords"));
        const niche = firstNonEmpty(getSlotValue("business_niche"), businessType);

        if (niche) addUnique(templateContext, `Business niche: ${summarizeLine(niche)}`);
        if (seoScope) addUnique(templateContext, `SEO scope: ${summarizeLine(seoScope)}`);
        if (keywords) addUnique(templateContext, `Target keywords: ${summarizeLine(keywords)}`);
        if (websiteLive) addUnique(templateContext, `Website status: ${summarizeLine(websiteLive)}`);

        if (!seoScope) addUnique(templateAssumptions, "Assuming full SEO scope unless specified.");
        if (!keywords) addUnique(templateInputs, "Priority keywords or core service pages.");

        addPhase(
            "Audit & Baseline",
            [
                "Technical SEO audit (indexing, crawl, CWV basics)",
                "On-page and content audit",
                "Backlink profile review",
            ],
            "Baseline audit report and priority issues delivered"
        );
        addPhase(
            "Keyword Research & Mapping",
            [
                "Keyword research and intent mapping",
                "Map keywords to existing/new pages",
                "Define content gaps and opportunities",
            ],
            "Keyword map and content gaps approved"
        );
        addPhase(
            "Technical SEO Fixes",
            [
                "Indexation, sitemap, and robots updates",
                "Schema markup and structured data",
                "Performance and CWV improvements",
            ],
            "Technical fixes backlog completed or handed off"
        );
        addPhase(
            "On-Page Optimization",
            [
                "Title/meta updates and heading structure",
                "Internal linking improvements",
                "Content refresh for priority pages",
            ],
            "Priority pages optimized and published"
        );
        addPhase(
            "Content & Link Building",
            [
                "Pillar page + cluster content plan",
                "Monthly blog topics and briefs",
                "White-hat outreach and citation building",
            ],
            "Content plan live and link-building started"
        );
        addPhase(
            "Reporting & Iteration",
            [
                "Rank tracking and KPI reporting",
                "Monthly insights and next-step roadmap",
                "Iterative improvements based on data",
            ],
            "Monthly SEO report delivered"
        );

        deliverables.push(
            "SEO audit report (technical, on-page, content, backlinks).",
            "Keyword research and mapping to pages.",
            "Technical SEO fixes list (indexation, sitemap/robots, CWV, schema).",
            "On-page optimization updates for priority pages.",
            "Content plan (pillar pages + clusters + monthly blog topics).",
            "White-hat link-building plan and outreach cadence.",
            "Reporting dashboard and monthly SEO report."
        );

        tools.push(
            "Google Search Console (GSC)",
            "Google Analytics 4 (GA4)",
            "Screaming Frog or equivalent crawler",
            "Ahrefs/SEMrush for research",
            "Rank tracking tool (to be confirmed)"
        );

        metrics.push(
            "Organic sessions growth (to finalize after baseline).",
            "Keyword ranking improvements (top 3/top 10).",
            "Search impressions and CTR (to finalize after baseline).",
            "Indexed pages and crawl health metrics.",
            "Conversions from organic traffic (to finalize after baseline)."
        );

        addUnique(templateInputs, "Access to CMS, GSC, and GA4.");
        addUnique(templateInputs, "Competitor list and priority services/products.");
        addUnique(templateInputs, "Content approval and brand guidelines.");
        addUnique(templateInputs, "Developer access for technical fixes (if needed).");

        addUnique(templateAssumptions, "SEO results typically take 60-90 days depending on competition.");
        addUnique(templateOutOfScope, "Guaranteed rankings or instant results.");
        addUnique(templateOutOfScope, "Paid advertising or PPC management.");
        addUnique(templateOutOfScope, "Content production beyond agreed volume.");

        defaultTimeline = "3-6 months (ongoing)";
    } else {
        addPhase(
            "Discovery",
            ["Requirements gathering", "Scope confirmation", "Success criteria alignment"],
            "Scope and goals approved"
        );
        addPhase(
            "Planning",
            ["Execution plan and timeline", "Resource allocation", "Risk assessment"],
            "Project plan approved"
        );
        addPhase(
            "Execution",
            ["Produce core deliverables", "Internal reviews", "Client feedback loops"],
            "Core deliverables completed"
        );
        addPhase(
            "QA & Handover",
            ["Quality checks", "Final revisions", "Documentation and handover"],
            "Final delivery completed"
        );

        deliverables.push(
            "Detailed scope and requirements document.",
            "Execution plan with milestones.",
            "Core deliverables aligned to scope.",
            "Quality assurance checklist and revisions.",
            "Final handover documentation."
        );

        tools.push(
            "Project management workspace",
            "Communication and review workflow",
            "Reporting and documentation tools"
        );

        metrics.push(
            "On-time delivery of milestones.",
            "Quality benchmarks met (to finalize after baseline).",
            "Stakeholder approval within agreed cycles.",
            "Client satisfaction rating (to finalize after delivery)."
        );

        addUnique(templateInputs, "Access to required assets and references.");
        addUnique(templateInputs, "Approval contacts and feedback cadence.");
        addUnique(templateInputs, "Goals and success criteria.");
        addUnique(templateInputs, "Budget and timeline confirmation.");

        addUnique(templateOutOfScope, "Work outside the defined scope.");
        addUnique(templateOutOfScope, "Third-party costs or licenses.");
        addUnique(templateOutOfScope, "Ongoing support unless specified.");
    }

    const generalInputs = [];
    const generalAssumptions = [];
    const generalOutOfScope = [];

    let projectName = projectNameRaw || "New Project";
    if (!projectNameRaw) {
        addUnique(generalInputs, "Project or business name.");
        addUnique(generalAssumptions, "Project name to be confirmed.");
    }

    let goalLine = "";
    if (goalValue && projectSummary) {
        goalLine = `${goalValue}. ${summarizeLine(projectSummary)}`;
    } else {
        goalLine = goalValue || projectSummary || "";
    }
    if (!goalLine) {
        goalLine = "Goals to be confirmed during kickoff.";
        addUnique(generalInputs, "Primary goal and success criteria.");
        addUnique(generalAssumptions, "Goals will be finalized after kickoff.");
    }

    let targetLine = "";
    if (audienceValue && locationValue) {
        targetLine = `${audienceValue} (Location: ${locationValue})`;
    } else {
        targetLine = audienceValue || locationValue || "";
    }
    if (!targetLine) {
        targetLine = "To be confirmed.";
        addUnique(generalInputs, "Target audience and location.");
    }

    let budgetDisplay = budgetValue || "To be confirmed.";
    if (!budgetValue) {
        addUnique(generalInputs, "Budget range or monthly spend.");
        addUnique(generalAssumptions, "Budget to be finalized after scope confirmation.");
    }

    let timelineDisplay = timelineValueRaw || defaultTimeline || "To be confirmed.";
    if (!timelineValueRaw) {
        addUnique(generalAssumptions, `Timeline assumed at ${defaultTimeline}.`);
        addUnique(generalInputs, "Preferred timeline or launch date.");
    }

    if (!clientName) addUnique(generalInputs, "Primary contact name.");

    const baseContext = [];
    if (businessType) addUnique(baseContext, `Business type: ${summarizeLine(businessType)}`);
    if (projectSummary) addUnique(baseContext, `Project summary: ${summarizeLine(projectSummary)}`);
    if (goalValue) addUnique(baseContext, `Primary goals: ${summarizeLine(goalValue)}`);
    if (audienceValue) addUnique(baseContext, `Target audience: ${summarizeLine(audienceValue)}`);
    if (locationValue) addUnique(baseContext, `Target location: ${summarizeLine(locationValue)}`);
    if (websiteLive) addUnique(baseContext, `Website status: ${summarizeLine(websiteLive)}`);
    if (designStatus) addUnique(baseContext, `Design assets: ${summarizeLine(designStatus)}`);
    if (domainStatus) addUnique(baseContext, `Domain status: ${summarizeLine(domainStatus)}`);
    if (techStack) addUnique(baseContext, `Tech preference: ${summarizeLine(techStack)}`);
    if (integrationsList.length) {
        addUnique(baseContext, `Integrations mentioned: ${summarizeLine(integrationsList.join(", "))}`);
    }
    if (platformsValue) addUnique(baseContext, `Platforms/channels: ${summarizeLine(platformsValue)}`);
    if (deliverablesValue) addUnique(baseContext, `Requested deliverables: ${summarizeLine(deliverablesValue)}`);
    if (styleValue) addUnique(baseContext, `Style/tone: ${summarizeLine(styleValue)}`);
    if (notesValue) addUnique(baseContext, `Existing assets/links: ${summarizeLine(notesValue)}`);

    const contextBullets = cleanList([...baseContext, ...templateContext]);
    if (contextBullets.length < 2) {
        addUnique(contextBullets, `Service: ${serviceName}.`);
        addUnique(contextBullets, `Project: ${projectName}.`);
    }

    const extraTools = [];
    if (techStack) addUnique(extraTools, `Tech stack: ${techStack}`);
    if (hostingPref) addUnique(extraTools, `Hosting/deployment: ${hostingPref}`);
    if (domainStatus) addUnique(extraTools, `Domain/DNS: ${domainStatus}`);
    if (integrationsList.length) addUnique(extraTools, `Integrations: ${integrationsList.join(", ")}`);
    if (platformsValue) addUnique(extraTools, `Platforms: ${platformsValue}`);

    if (deliverables.length < 6) {
        addUnique(deliverables, "Detailed scope and requirements document.");
        addUnique(deliverables, "Implementation plan with milestones.");
        addUnique(deliverables, "Quality assurance checklist and revisions.");
    }
    if (metrics.length < 4) {
        addUnique(metrics, "Primary KPI achievement (to finalize after baseline).");
        addUnique(metrics, "Time-to-complete milestone adherence.");
        addUnique(metrics, "Stakeholder approval within agreed cycles.");
    }
    if (tools.length < 4) {
        addUnique(tools, "Analytics & reporting setup");
        addUnique(tools, "Project management (Notion/Trello)");
        addUnique(tools, "Communication (Slack/Email)");
    }

    const clientInputs = cleanList([...generalInputs, ...templateInputs]);
    if (clientInputs.length < 4) {
        addUnique(clientInputs, "Timely approvals and feedback.");
        addUnique(clientInputs, "Access to required accounts/tools.");
    }

    const assumptions = cleanList([...generalAssumptions, ...templateAssumptions]);
    const outOfScope = cleanList([...generalOutOfScope, ...templateOutOfScope]);
    if (!outOfScope.length) {
        addUnique(outOfScope, "Third-party fees and subscriptions.");
        addUnique(outOfScope, "Ongoing work beyond the agreed scope.");
    }

    const sections = ["[PROPOSAL_DATA]"];

    sections.push("## Proposal Title");
    sections.push(`- ${serviceName} Proposal — ${projectName}`);
    sections.push("");

    sections.push("## 1. Project Overview");
    sections.push(`- Service: ${serviceName}`);
    sections.push(`- Project: ${projectName}`);
    sections.push(`- Client: ${clientName || "To be confirmed."}`);
    sections.push(`- Goal (1–2 lines): ${goalLine}`);
    sections.push(`- Target audience / location (if relevant): ${targetLine}`);
    sections.push(`- Budget: ${budgetDisplay}`);
    sections.push(`- Timeline: ${timelineDisplay}`);
    sections.push("");

    sections.push("## 2. Current Context (What we know)");
    contextBullets.slice(0, 6).forEach((item) => sections.push(`- ${item}`));
    sections.push("");

    sections.push("## 3. Scope of Work (What we will do)");
    phases.slice(0, 6).forEach((phase, index) => {
        const tasks = cleanList(phase.tasks || []);
        const taskLine = tasks.length ? tasks.join("; ") : "Detailed tasks to be confirmed.";
        sections.push(`- Phase ${index + 1}: ${phase.title} - ${taskLine}`);
    });
    sections.push("");

    sections.push("## 4. Deliverables (What you get)");
    deliverables.forEach((item) => sections.push(`- ${item}`));
    sections.push("");

    sections.push("## 5. Timeline & Milestones");
    phases.slice(0, 6).forEach((phase, index) => {
        const milestone = phase.milestone || (phase.tasks || [])[0] || "Milestone delivery";
        sections.push(`- Phase ${index + 1}: ${phase.title} - ${milestone}`);
    });
    sections.push("");

    sections.push("## 6. Tools / Tech / Integrations");
    cleanList([...tools, ...extraTools]).forEach((item) => sections.push(`- ${item}`));
    sections.push("");

    sections.push("## 7. Success Metrics (How we measure results)");
    metrics.slice(0, 10).forEach((item) => sections.push(`- ${item}`));
    sections.push("");

    sections.push("## 8. Client Inputs Required");
    clientInputs.forEach((item) => sections.push(`- ${item}`));
    sections.push("");

    sections.push("## 9. Assumptions & Out of Scope");
    assumptions.forEach((item) => sections.push(`- Assumption: ${item}`));
    outOfScope.forEach((item) => sections.push(`- Out of scope: ${item}`));
    sections.push("");

    sections.push("## 10. Next Steps (MANDATORY ENDING — VERBATIM)");
    sections.push("Next Steps");
    sections.push("- Approve proposal to kick start the project");
    sections.push("[/PROPOSAL_DATA]");

    return sections.join("\n").trim();
}

/**
 * Get opening message for a service
 * @param {string} service - Service name
 * @returns {string} Opening greeting
 */
export function getOpeningMessage(service) {
    return getChatbot(service).openingMessage;
}















