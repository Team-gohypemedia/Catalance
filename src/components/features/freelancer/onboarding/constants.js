import {
    User,
    Building2,
    Clock,
    Globe,
    Smartphone,
    Code,
    Target,
    Video,
    Search,
    Share2,
    TrendingUp,
    Palette,
    PenTool,
    MessageCircle,
    Star,
    BarChart3,
    Bot,
    MessageSquare,
    Box,
    Film,
    Sparkles,
    Mic,
} from "lucide-react";
import { COUNTRY_CODES } from "@/shared/data/countryCodes";

// ============================================================================
// CONSTANTS & OPTIONS
// ============================================================================

export const ROLE_OPTIONS = [
    { value: "individual", label: "Individual Freelancer", icon: User, description: "Working independently on projects" },
    { value: "agency", label: "Agency / Studio", icon: Building2, description: "Team of professionals" },
    { value: "part_time", label: "Part-Time Freelancer", icon: Clock, description: "Freelancing alongside other work" },
];

export const SERVICE_LIMITS = {
    individual: 3,
    agency: 5,
    part_time: 2,
};

export const SERVICE_OPTIONS = [
    { value: "branding", label: "Branding", icon: Sparkles },
    { value: "website_ui_ux", label: "Website Development", icon: Globe },
    { value: "seo", label: "SEO", icon: Search },
    { value: "social_media_marketing", label: "Social Media Management", icon: Share2 },
    { value: "paid_advertising", label: "Performance Marketing / Paid Ads", icon: TrendingUp },
    { value: "app_development", label: "App Development", icon: Smartphone },
    { value: "software_development", label: "Software Development", icon: Code },
    { value: "lead_generation", label: "Lead Generation", icon: Target },
    { value: "video_services", label: "Video Services", icon: Video },
    { value: "writing_content", label: "Writing & Content", icon: PenTool },
    { value: "customer_support", label: "Customer Support Services", icon: MessageCircle },
    { value: "influencer_marketing", label: "Influencer Marketing", icon: Star },
    { value: "ugc_marketing", label: "UGC Marketing", icon: Video },
    { value: "ai_automation", label: "AI Automation", icon: Bot },
    { value: "whatsapp_chatbot", label: "WhatsApp Chatbot", icon: MessageSquare },
    { value: "creative_design", label: "Creative & Design", icon: Palette },
    { value: "3d_modeling", label: "3D Modeling", icon: Box },
    { value: "cgi_videos", label: "CGI Video Services", icon: Film },
    { value: "crm_erp", label: "CRM & ERP Solutions", icon: BarChart3 },
    { value: "voice_agent", label: "Voice Agent / AI Calling", icon: Mic },
];

export const EXPERIENCE_YEARS_OPTIONS = [
    { value: "less_than_1", label: "Less than 1 year" },
    { value: "1_3", label: "1–3 years" },
    { value: "3_5", label: "3–5 years" },
    { value: "5_plus", label: "5+ years" },
];

export const WORKING_LEVEL_OPTIONS = [
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
];

export const YES_NO_OPTIONS = [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
];

export const UPCOMING_NICHE_OPTIONS = [
    { value: "yes", label: "Yes, same niche" },
    { value: "open", label: "Open to all" },
];

export const LANGUAGE_OPTIONS = [
    { value: "English", label: "English" },
    { value: "Hindi", label: "Hindi" },
    { value: "Spanish", label: "Spanish" },
    { value: "French", label: "French" },
    { value: "German", label: "German" },
    { value: "Chinese", label: "Mandarin Chinese" },
    { value: "Arabic", label: "Arabic" },
    { value: "Bengali", label: "Bengali" },
    { value: "Portuguese", label: "Portuguese" },
    { value: "Russian", label: "Russian" },
    { value: "Japanese", label: "Japanese" },
    { value: "Punjabi", label: "Punjabi" },
    { value: "Telugu", label: "Telugu" },
    { value: "Marathi", label: "Marathi" },
    { value: "Tamil", label: "Tamil" },
    { value: "Urdu", label: "Urdu" },
    { value: "Gujarati", label: "Gujarati" },
    { value: "Kannada", label: "Kannada" },
    { value: "Malayalam", label: "Malayalam" },
    { value: "Italian", label: "Italian" },
    { value: "Other", label: "Other (Custom)" },
].sort((a, b) => {
    if (a.value === "Other") return 1;
    if (b.value === "Other") return -1;
    return a.label.localeCompare(b.label);
});

export const COUNTRY_OPTIONS = Array.from(
    new Set((COUNTRY_CODES || []).map((country) => country.name).filter(Boolean)),
).sort((a, b) => a.localeCompare(b));

export const STATE_OPTIONS_CACHE = new Map();

export const ROLE_IN_PROJECT_OPTIONS = [
    { value: "full_execution", label: "Full execution" },
    { value: "partial_contribution", label: "Partial contribution" },
    { value: "team_project", label: "Team project" },
];

export const PROJECT_TIMELINE_OPTIONS = [
    { value: "less_than_2_weeks", label: "Less than 2 weeks" },
    { value: "2_4_weeks", label: "2–4 weeks" },
    { value: "1_3_months", label: "1–3 months" },
    { value: "3_plus_months", label: "3+ months" },
];

export const PROJECT_COMPLEXITY_OPTIONS = [
    { value: "small", label: "Small tasks / Quick projects" },
    { value: "medium", label: "Medium complexity projects" },
    { value: "large", label: "Large / Enterprise level systems" },
    { value: "all_types", label: "All Types Of Projects" },
];

export const IN_PROGRESS_PROJECT_OPTIONS = [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
];

export const PRICE_RANGE_MIN = 1000;
export const PRICE_RANGE_MAX = 1000000;
export const PRICE_RANGE_STEP = 1000;

export const AVERAGE_PROJECT_PRICE_OPTIONS = [
    { value: "Under INR 5,000", label: "Under INR 5,000" },
    { value: "INR 5,000 - 10,000", label: "INR 5,000 - 10,000" },
    { value: "INR 10,000 - 25,000", label: "INR 10,000 - 25,000" },
    { value: "INR 25,000 - 50,000", label: "INR 25,000 - 50,000" },
    { value: "INR 50,000 - 1 Lakh", label: "INR 50,000 - 1 Lakh" },
    { value: "INR 1 Lakh - 3 Lakhs", label: "INR 1 Lakh - 3 Lakhs" },
    { value: "INR 3 Lakhs - 5 Lakhs", label: "INR 3 Lakhs - 5 Lakhs" },
    { value: "INR 5 Lakhs - 10 Lakhs", label: "INR 5 Lakhs - 10 Lakhs" },
    { value: "Over INR 10 Lakhs", label: "Over INR 10 Lakhs" },
];

export const INDUSTRY_NICHE_OPTIONS = [
    "Real Estate",
    "Healthcare",
    "E-commerce",
    "SaaS",
    "Education",
    "Finance",
    "Hospitality",
    "Fitness & Wellness",
    "Personal Brands / Influencers",
    "Local Businesses",
    "Startups",
    "Enterprise Businesses",
    "Other",
];

export const DEFAULT_TECH_STACK_OPTIONS = [
    "Figma",
    "Adobe XD",
    "Photoshop",
    "WordPress",
    "Shopify",
    "Webflow",
    "React / Next.js",
    "Node.js",
    "Python",
    "Java",
    "Google Analytics",
    "Zapier",
    "HubSpot",
    "Other",
];

export const BUDGET_RANGE_OPTIONS = [
    { value: "under_10k", label: "Under INR 10,000" },
    { value: "10k_50k", label: "INR 10,000 - 50,000" },
    { value: "50k_1l", label: "INR 50,000 - 1 Lakh" },
    { value: "1l_2l", label: "INR 1 Lakh - 2 Lakhs" },
    { value: "2l_5l", label: "INR 2 Lakhs - 5 Lakhs" },
    { value: "5l_10l", label: "INR 5 Lakhs - 10 Lakhs" },
    { value: "over_10l", label: "Over INR 10 Lakhs" },
];

export const HOURS_PER_WEEK_OPTIONS = [
    { value: "less_than_10", label: "Less than 10 hours" },
    { value: "10_20", label: "10-20 hours" },
    { value: "20_30", label: "20-30 hours" },
    { value: "30_plus", label: "30+ hours" },
];

export const WORKING_SCHEDULE_OPTIONS = [
    { value: "fixed", label: "Fixed daily hours" },
    { value: "flexible", label: "Flexible schedule" },
    { value: "on_demand", label: "On-demand availability" },
];

export const START_TIMELINE_OPTIONS = [
    { value: "immediately", label: "Immediately" },
    { value: "within_3_days", label: "Within 3 days" },
    { value: "within_1_week", label: "Within 1 week" },
];

export const DEADLINE_HISTORY_OPTIONS = [
    { value: "never", label: "Never" },
    { value: "rarely", label: "Rarely" },
    { value: "occasionally", label: "Occasionally" },
];

export const DELAY_HANDLING_OPTIONS = [
    { value: "inform_client", label: "Inform client early and adjust timeline" },
    { value: "increase_effort", label: "Increase effort/resources" },
    { value: "renegotiate_scope", label: "Renegotiate scope" },
];

export const CASE_STUDY_FIELDS = [
    {
        key: "projectTitle",
        label: "Project Title",
        placeholder: "Project title",
        type: "text",
    },
    {
        key: "industry",
        label: "Industry / Niche of Project",
        type: "select",
        options: INDUSTRY_NICHE_OPTIONS,
    },
    {
        key: "goal",
        label: "Main Project Goal",
        placeholder: "Primary goal",
        type: "text",
    },
    {
        key: "role",
        label: "Your Role in This Project",
        type: "select",
        options: ROLE_IN_PROJECT_OPTIONS,
    },
    {
        key: "techStack",
        label: "Tech Stack / Tools Used (Min 3)",
        type: "multiselect",
        min: 3,
    },
    {
        key: "timeline",
        label: "Project Timeline",
        type: "select",
        options: PROJECT_TIMELINE_OPTIONS,
    },
    {
        key: "budgetRange",
        label: "Project Budget Range",
        type: "select",
        options: BUDGET_RANGE_OPTIONS,
    },
    {
        key: "results",
        label: "What Measurable Results Did This Project Achieve?",
        placeholder: "Share key outcomes or metrics",
        type: "textarea",
    },
];

export const SERVICE_GROUPS = {
    website_ui_ux: [
        {
            id: "website_specialization",
            label: "Which Types Of Websites Do You Build?",
            options: [
                "Corporate / Business",
                "E-commerce",
                "SaaS Platforms",
                "Marketplace Websites",
                "Landing Pages",
                "Portfolio Websites",
            ],
        },
        {
            id: "website_tech_stack",
            label: "Which Technologies Do You Actively Use? (Min 3)",
            options: [
                "WordPress",
                "Shopify",
                "Webflow",
                "React / Next.js",
                "PHP / Laravel",
                "Node.js",
                "Custom CMS",
            ],
            min: 3,
        },
        {
            id: "website_capability",
            label: "Which Development Scope Can You Handle?",
            options: [
                "Template / Builder Based",
                "Custom Frontend",
                "Full Stack Development",
                "Scalable Enterprise Systems",
            ],
        },
        {
            id: "website_performance",
            label: "Which Services Do You Provide?",
            options: [
                "Speed Optimization",
                "SEO-Friendly Development",
                "Security Setup",
                "API Integrations",
                "Maintenance Support",
            ],
        },
    ],
    software_development: [
        {
            id: "software_specialization",
            label: "Which Software Solutions Do You Build?",
            options: [
                "Business Management Software",
                "SaaS Platforms",
                "Enterprise Software",
                "Automation Tools",
                "Custom Dashboards",
            ],
        },
        {
            id: "software_tech_stack",
            label: "Which Technologies Do You Actively Use? (Min 3)",
            options: [
                "Java",
                ".NET",
                "Python",
                "Node.js",
                "PHP",
                "Microservices Architecture",
            ],
            min: 3,
        },
        {
            id: "software_capability",
            label: "Which Development Scope Can You Handle?",
            options: [
                "Internal Business Tools",
                "Cloud-Based SaaS",
                "Enterprise Solutions",
                "API / System Integration",
            ],
        },
    ],
    app_development: [
        {
            id: "app_platforms",
            label: "Platform expertise",
            options: [
                "Android",
                "iOS",
                "Cross Platform (Flutter / React Native)",
                "Progressive Web Apps",
            ],
        },
        {
            id: "app_types",
            label: "App type",
            options: [
                "E-commerce Apps",
                "Service Booking Apps",
                "Marketplace Apps",
                "Social Apps",
                "SaaS Apps",
            ],
        },
        {
            id: "app_features",
            label: "Features capability",
            options: [
                "Payment Gateway",
                "Push Notifications",
                "Chat / Messaging",
                "Admin Dashboard",
                "API Integration",
            ],
        },
    ],
    creative_design: [
        {
            id: "design_specialization",
            label: "Specialization",
            options: [
                "UI / UX Design",
                "Branding Design",
                "Social Media Creatives",
                "Ad Creatives",
                "Packaging Design",
                "Motion Graphics",
            ],
        },
        {
            id: "design_tools",
            label: "Tools",
            options: [
                "Figma",
                "Adobe XD",
                "Photoshop",
                "Illustrator",
                "After Effects",
                "Blender",
            ],
        },
        {
            id: "design_approach",
            label: "Design approach",
            options: [
                "Research Based",
                "Trend Based",
                "Brand Guideline Based",
            ],
        },
    ],
    social_media_marketing: [
        {
            id: "social_platforms",
            label: "Platform expertise",
            options: [
                "Instagram",
                "Facebook",
                "LinkedIn",
                "Twitter / X",
                "YouTube",
                "Pinterest",
            ],
        },
        {
            id: "social_scope",
            label: "Service scope",
            options: [
                "Content Planning",
                "Post Design",
                "Caption Writing",
                "Community Management",
                "Analytics & Reporting",
            ],
        },
        {
            id: "social_strategy",
            label: "Strategy style",
            options: [
                "Brand Awareness Focus",
                "Engagement Growth",
                "Lead Generation",
                "Sales Funnel Content",
            ],
        },
    ],
    seo: [
        {
            id: "seo_specialization",
            label: "SEO specialization",
            options: [
                "On Page SEO",
                "Technical SEO",
                "Local SEO",
                "E-commerce SEO",
                "Content SEO",
                "International SEO",
            ],
        },
        {
            id: "seo_tools",
            label: "Tools",
            options: [
                "Ahrefs",
                "SEMrush",
                "GSC",
                "Screaming Frog",
                "Surfer SEO",
            ],
        },
        {
            id: "seo_deliverables",
            label: "Deliverables",
            options: [
                "SEO Audit",
                "Keyword Research",
                "Backlink Strategy",
                "Monthly Reports",
                "Content Plan",
            ],
        },
    ],
    lead_generation: [
        {
            id: "lead_channels",
            label: "Lead channels",
            options: [
                "Paid Ads Leads",
                "Organic Leads",
                "LinkedIn Lead Gen",
                "Cold Email / Outreach",
                "Landing Page Funnels",
            ],
        },
        {
            id: "lead_crm_tools",
            label: "CRM / Tracking tools",
            options: [
                "HubSpot",
                "Zoho",
                "Salesforce",
                "GoHighLevel",
            ],
        },
        {
            id: "lead_qualification",
            label: "Lead qualification",
            options: [
                "Basic Leads",
                "Qualified Leads",
                "Sales Ready Leads",
            ],
        },
    ],
    voice_agent: [
        {
            id: "voice_use_case",
            label: "Agent use case",
            options: [
                "Customer Support",
                "Sales Calls",
                "Appointment Booking",
                "IVR Systems",
            ],
        },
        {
            id: "voice_platforms",
            label: "Platforms",
            options: [
                "Twilio",
                "ElevenLabs",
                "VAPI",
                "Custom AI Voice APIs",
            ],
        },
        {
            id: "voice_integration",
            label: "Integration capability",
            options: [
                "CRM Integration",
                "WhatsApp / SMS",
                "Call Analytics",
            ],
        },
    ],
    branding: [
        {
            id: "branding_scope",
            label: "Branding scope",
            options: [
                "Logo Design",
                "Brand Identity",
                "Brand Strategy",
                "Packaging & Visual Systems",
                "Brand Guidelines",
            ],
        },
        {
            id: "branding_approach",
            label: "Branding approach",
            options: [
                "Market Research Driven",
                "Storytelling Driven",
                "Visual Identity Driven",
            ],
        },
    ],
    paid_advertising: [
        {
            id: "ads_platforms",
            label: "Platform expertise",
            options: [
                "Meta Ads",
                "Google Ads",
                "LinkedIn Ads",
                "YouTube Ads",
                "TikTok Ads",
            ],
        },
        {
            id: "ads_campaign_types",
            label: "Campaign types",
            options: [
                "Lead Generation",
                "E-commerce Sales",
                "Retargeting",
                "App Installs",
                "Brand Awareness",
            ],
        },
        {
            id: "ads_tracking_tools",
            label: "Tracking tools",
            options: [
                "GTM",
                "Meta Pixel",
                "GA4",
                "Conversion API",
            ],
        },
    ],
    video_services: [
        {
            id: "video_types",
            label: "Video type",
            options: [
                "Social Media Reels",
                "Corporate Videos",
                "Explainer Videos",
                "Ad Videos",
                "YouTube Content",
            ],
        },
        {
            id: "video_tools",
            label: "Tools",
            options: [
                "Premiere Pro",
                "After Effects",
                "DaVinci Resolve",
                "CapCut",
            ],
        },
    ],
    customer_support: [
        {
            id: "support_channels",
            label: "Support channels",
            options: [
                "Email Support",
                "Live Chat",
                "Phone Support",
                "Social Media Support",
                "WhatsApp Support",
            ],
        },
        {
            id: "support_crm",
            label: "CRM tools",
            options: [
                "Zendesk",
                "Freshdesk",
                "Intercom",
                "Zoho Desk",
            ],
        },
    ],
    ugc_marketing: [
        {
            id: "ugc_content",
            label: "Content types",
            options: [
                "Product Reviews",
                "Testimonial Videos",
                "Lifestyle UGC",
                "Social Proof Content",
            ],
        },
        {
            id: "ugc_platforms",
            label: "Platform focus",
            options: [
                "Instagram",
                "TikTok",
                "YouTube Shorts",
            ],
        },
    ],
    influencer_marketing: [
        {
            id: "influencer_campaigns",
            label: "Campaign type",
            options: [
                "Brand Collaborations",
                "Product Seeding",
                "Paid Influencer Campaigns",
                "Affiliate Campaigns",
            ],
        },
        {
            id: "influencer_platforms",
            label: "Platform expertise",
            options: [
                "Instagram",
                "YouTube",
                "TikTok",
                "LinkedIn",
            ],
        },
    ],
    ai_automation: [
        {
            id: "automation_type",
            label: "Automation type",
            options: [
                "Marketing Automation",
                "CRM Automation",
                "Workflow Automation",
                "AI Chatbots",
                "AI Agents",
            ],
        },
        {
            id: "automation_tools",
            label: "Tools",
            options: [
                "Zapier",
                "Make.com",
                "OpenAI API",
                "LangChain",
                "ManyChat",
            ],
        },
    ],
    whatsapp_chatbot: [
        {
            id: "whatsapp_bot_type",
            label: "Bot type",
            options: [
                "Customer Support Bot",
                "Sales Funnel Bot",
                "Lead Qualification Bot",
                "Appointment Booking Bot",
            ],
        },
        {
            id: "whatsapp_platforms",
            label: "Platforms",
            options: [
                "WhatsApp Business API",
                "Twilio",
                "WATI",
                "Gupshup",
            ],
        },
    ],
    crm_erp: [
        {
            id: "crm_implementation",
            label: "Implementation type",
            options: [
                "CRM Setup",
                "ERP Integration",
                "Sales Automation",
                "Business Workflow Setup",
            ],
        },
        {
            id: "crm_platforms",
            label: "Platforms",
            options: [
                "Salesforce",
                "Zoho",
                "HubSpot",
                "Odoo",
            ],
        },
    ],
    "3d_modeling": [
        {
            id: "modeling_type",
            label: "Modeling type",
            options: [
                "Product Modeling",
                "Architecture Modeling",
                "Character Modeling",
                "Industrial Modeling",
            ],
        },
        {
            id: "modeling_tools",
            label: "Tools",
            options: [
                "Blender",
                "Maya",
                "3ds Max",
                "ZBrush",
            ],
        },
    ],
    cgi_videos: [
        {
            id: "cgi_type",
            label: "CGI type",
            options: [
                "Product CGI Ads",
                "Architectural Visualization",
                "Animation Films",
                "Motion CGI",
            ],
        },
        {
            id: "cgi_tools",
            label: "Tools",
            options: [
                "Unreal Engine",
                "Cinema4D",
                "Blender",
                "After Effects",
            ],
        },
    ],
    writing_content: [
        {
            id: "writing_content_type",
            label: "Content type",
            options: [
                "Blog Writing",
                "Website Content",
                "SEO Content",
                "Copywriting",
                "Script Writing",
                "Technical Writing",
            ],
        },
        {
            id: "writing_tools",
            label: "Tools",
            options: [
                "Grammarly",
                "Surfer SEO",
                "Hemingway",
                "AI Writing Tools",
            ],
        },
    ],
};
