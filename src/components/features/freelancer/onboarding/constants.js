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

export const SUB_PROFESSION_OPTIONS_BY_SERVICE = {
    branding: [
        "Brand Strategist",
        "Brand Designer",
        "Brand Identity Designer",
        "Logo Designer",
        "Visual Identity Designer",
        "Brand Naming Specialist",
        "Packaging Designer",
        "Brand Guidelines Specialist",
    ],
    website_ui_ux: [
        "Web Developer",
        "Frontend Developer",
        "Full Stack Developer",
        "UI/UX Designer",
        "Product Designer",
        "WordPress Developer",
        "Shopify Developer",
        "Webflow Developer",
        "Landing Page Designer",
        "Website Performance Specialist",
    ],
    seo: [
        "SEO Specialist",
        "Technical SEO Specialist",
        "On-Page SEO Specialist",
        "Off-Page SEO Specialist",
        "Local SEO Specialist",
        "E-commerce SEO Specialist",
        "SEO Content Strategist",
        "SEO Analyst",
    ],
    social_media_marketing: [
        "Social Media Manager",
        "Social Media Strategist",
        "Social Media Content Creator",
        "Community Manager",
        "Social Media Ads Specialist",
        "Social Media Analyst",
    ],
    paid_advertising: [
        "Performance Marketer",
        "Paid Ads Specialist",
        "Google Ads Specialist",
        "Meta Ads Specialist",
        "PPC Specialist",
        "Paid Media Buyer",
        "Campaign Optimization Specialist",
    ],
    app_development: [
        "App Developer",
        "Android Developer",
        "iOS Developer",
        "Flutter Developer",
        "React Native Developer",
        "Mobile UI/UX Designer",
        "App Backend Developer",
        "Mobile QA Engineer",
    ],
    software_development: [
        "Software Developer",
        "Backend Developer",
        "Full Stack Developer",
        "API Developer",
        "SaaS Developer",
        "Software Architect",
        "DevOps Engineer",
        "QA Engineer",
        "Cloud Engineer",
    ],
    lead_generation: [
        "Lead Generation Specialist",
        "Outreach Specialist",
        "Sales Development Representative",
        "Appointment Setter",
        "B2B Prospecting Specialist",
        "Email Outreach Specialist",
        "CRM Lead Nurturing Specialist",
    ],
    video_services: [
        "Video Editor",
        "Motion Graphics Designer",
        "Video Producer",
        "Cinematographer",
        "Color Grading Specialist",
        "Reels Editor",
        "YouTube Video Editor",
        "Explainer Video Specialist",
    ],
    writing_content: [
        "Content Writer",
        "Copywriter",
        "Technical Content Writer",
        "SEO Content Writer",
        "Blog Writer",
        "Script Writer",
        "UX Writer",
        "Product Description Writer",
    ],
    customer_support: [
        "Customer Support Specialist",
        "Customer Success Manager",
        "Live Chat Support Specialist",
        "Email Support Specialist",
        "Technical Support Specialist",
        "Helpdesk Specialist",
        "Client Onboarding Specialist",
    ],
    influencer_marketing: [
        "Influencer Marketing Manager",
        "Influencer Outreach Specialist",
        "Creator Partnerships Manager",
        "Influencer Campaign Coordinator",
        "Influencer Analyst",
    ],
    ugc_marketing: [
        "UGC Content Specialist",
        "UGC Campaign Manager",
        "UGC Creator Manager",
        "Short Form Content Strategist",
        "UGC Video Producer",
    ],
    ai_automation: [
        "AI Automation Specialist",
        "No-Code Automation Developer",
        "Workflow Automation Consultant",
        "AI Integration Specialist",
        "Prompt Engineer",
        "AI Operations Specialist",
        "Zapier Automation Specialist",
        "Make.com Automation Specialist",
    ],
    whatsapp_chatbot: [
        "WhatsApp Chatbot Specialist",
        "Chatbot Developer",
        "Conversational AI Designer",
        "WhatsApp API Integration Specialist",
        "Bot Flow Designer",
        "Customer Journey Automation Specialist",
    ],
    creative_design: [
        "Creative Designer",
        "Graphic Designer",
        "Visual Designer",
        "Social Media Designer",
        "Marketing Designer",
        "Presentation Designer",
        "Ad Creative Designer",
        "UI Designer",
    ],
    "3d_modeling": [
        "3D Artist",
        "3D Modeler",
        "3D Animator",
        "3D Product Visualizer",
        "3D Environment Artist",
        "Character Modeler",
        "3D Rendering Specialist",
    ],
    cgi_videos: [
        "CGI Artist",
        "CGI Animator",
        "VFX Artist",
        "Compositing Artist",
        "3D Motion Designer",
        "Product CGI Specialist",
        "Visual Effects Specialist",
    ],
    crm_erp: [
        "CRM Consultant",
        "ERP Consultant",
        "CRM Implementation Specialist",
        "ERP Implementation Specialist",
        "HubSpot Specialist",
        "Salesforce Specialist",
        "Zoho CRM Specialist",
        "CRM Administrator",
        "Business Process Automation Consultant",
    ],
    voice_agent: [
        "Voice AI Specialist",
        "Voice Bot Developer",
        "AI Calling Specialist",
        "Conversational Voice Designer",
        "Speech AI Engineer",
        "Call Flow Designer",
        "Voice Automation Consultant",
    ],
};

export const PROFESSION_TITLE_OPTIONS = Array.from(
    new Set(Object.values(SUB_PROFESSION_OPTIONS_BY_SERVICE).flat()),
).sort();

export const ROLE_OPTIONS = [
    { value: "individual", label: "Individual Freelancer", icon: User, description: "Working independently on projects" },
    { value: "agency", label: "Agency / Studio", icon: Building2, description: "Team of professionals" },
    { value: "part_time", label: "Part-Time Freelancer", icon: Clock, description: "Freelancing alongside other work" },
];

export const SERVICE_OPTIONS = [
    { value: "branding", label: "Branding", icon: Sparkles },
    { value: "website_ui_ux", label: "Web Development", icon: Globe },
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

export const DEFAULT_SERVICE_PLATFORM_PROFILE_FIELDS = [
    { key: "website", label: "Professional Website", placeholder: "https://your-website.com" },
    { key: "portfolio", label: "Portfolio Website", placeholder: "https://your-portfolio.com" },
    { key: "linkedin", label: "LinkedIn Profile", placeholder: "https://www.linkedin.com/in/your-profile" },
    { key: "github", label: "GitHub / Code Profile", placeholder: "https://github.com/your-username" },
];

const SERVICE_PLATFORM_LINK_FALLBACK_FIELDS = [
    { key: "linkedin", label: "LinkedIn Profile", placeholder: "https://www.linkedin.com/in/your-profile" },
    { key: "github", label: "GitHub Profile", placeholder: "https://github.com/your-username" },
    { key: "portfolio", label: "Portfolio Website", placeholder: "https://your-portfolio.com" },
];

export const SERVICE_PLATFORM_PROFILE_FIELDS = {
    branding: [
        { key: "behance", label: "Behance Profile", placeholder: "https://www.behance.net/your-profile" },
        { key: "dribbble", label: "Dribbble Profile", placeholder: "https://dribbble.com/your-profile" },
        { key: "portfolio", label: "Portfolio Website", placeholder: "https://your-portfolio.com" },
    ],
    website_ui_ux: [
        { key: "liveProjects", label: "Live Website / Landing Page", placeholder: "https://your-live-project.com" },
        { key: "github", label: "GitHub Profile", placeholder: "https://github.com/your-username" },
        { key: "dribbble", label: "Dribbble / UI Portfolio", placeholder: "https://dribbble.com/your-profile" },
    ],
    seo: [
        { key: "website", label: "Website You Optimized", placeholder: "https://example-client-site.com" },
        { key: "linkedin", label: "LinkedIn Profile", placeholder: "https://www.linkedin.com/in/your-profile" },
        { key: "portfolio", label: "SEO Case Study Link", placeholder: "https://your-portfolio.com/seo-case-study" },
    ],
    social_media_marketing: [
        { key: "instagram", label: "Instagram Profile / Work", placeholder: "https://www.instagram.com/your-handle" },
        { key: "facebook", label: "Facebook Page / Work", placeholder: "https://www.facebook.com/your-page" },
        { key: "linkedin", label: "LinkedIn Profile", placeholder: "https://www.linkedin.com/in/your-profile" },
    ],
    paid_advertising: [
        { key: "portfolio", label: "Campaign Case Studies", placeholder: "https://your-portfolio.com/ads-case-studies" },
        { key: "linkedin", label: "LinkedIn Profile", placeholder: "https://www.linkedin.com/in/your-profile" },
        { key: "website", label: "Professional Website", placeholder: "https://your-website.com" },
    ],
    app_development: [
        { key: "playStore", label: "Google Play App Link", placeholder: "https://play.google.com/store/apps/details?id=your.app" },
        { key: "appStore", label: "Apple App Store Link", placeholder: "https://apps.apple.com/app/id123456789" },
        { key: "github", label: "GitHub Profile", placeholder: "https://github.com/your-username" },
    ],
    software_development: [
        { key: "github", label: "GitHub Profile", placeholder: "https://github.com/your-username" },
        { key: "stackOverflow", label: "Stack Overflow Profile", placeholder: "https://stackoverflow.com/users/your-id" },
        { key: "portfolio", label: "Portfolio Website", placeholder: "https://your-portfolio.com" },
    ],
    lead_generation: [
        { key: "linkedin", label: "LinkedIn Profile", placeholder: "https://www.linkedin.com/in/your-profile" },
        { key: "portfolio", label: "Lead Generation Case Studies", placeholder: "https://your-portfolio.com/leadgen-case-studies" },
        { key: "website", label: "Professional Website", placeholder: "https://your-website.com" },
    ],
    video_services: [
        { key: "youtube", label: "YouTube Channel", placeholder: "https://www.youtube.com/@your-channel" },
        { key: "vimeo", label: "Vimeo Profile", placeholder: "https://vimeo.com/your-profile" },
        { key: "instagram", label: "Instagram Portfolio", placeholder: "https://www.instagram.com/your-handle" },
    ],
    writing_content: [
        { key: "medium", label: "Medium / Blog Profile", placeholder: "https://medium.com/@your-handle" },
        { key: "substack", label: "Substack / Newsletter", placeholder: "https://yourname.substack.com" },
        { key: "portfolio", label: "Writing Portfolio", placeholder: "https://your-portfolio.com/writing" },
    ],
    customer_support: [
        { key: "linkedin", label: "LinkedIn Profile", placeholder: "https://www.linkedin.com/in/your-profile" },
        { key: "portfolio", label: "Support Portfolio / Case Studies", placeholder: "https://your-portfolio.com/support" },
        { key: "website", label: "Professional Website", placeholder: "https://your-website.com" },
    ],
    influencer_marketing: [
        { key: "instagram", label: "Instagram Profile", placeholder: "https://www.instagram.com/your-handle" },
        { key: "youtube", label: "YouTube Profile", placeholder: "https://www.youtube.com/@your-channel" },
        { key: "tiktok", label: "TikTok Profile", placeholder: "https://www.tiktok.com/@your-handle" },
    ],
    ugc_marketing: [
        { key: "instagram", label: "Instagram Profile", placeholder: "https://www.instagram.com/your-handle" },
        { key: "tiktok", label: "TikTok Profile", placeholder: "https://www.tiktok.com/@your-handle" },
        { key: "youtube", label: "YouTube Shorts / Reels Work", placeholder: "https://www.youtube.com/@your-channel" },
    ],
    ai_automation: [
        { key: "github", label: "GitHub Profile", placeholder: "https://github.com/your-username" },
        { key: "portfolio", label: "Automation Portfolio", placeholder: "https://your-portfolio.com/automation" },
        { key: "website", label: "Professional Website", placeholder: "https://your-website.com" },
    ],
    whatsapp_chatbot: [
        { key: "demoLink", label: "Chatbot Demo Link", placeholder: "https://wa.me/1234567890?text=hi" },
        { key: "portfolio", label: "Bot Case Study Link", placeholder: "https://your-portfolio.com/chatbot" },
        { key: "website", label: "Professional Website", placeholder: "https://your-website.com" },
    ],
    creative_design: [
        { key: "behance", label: "Behance Profile", placeholder: "https://www.behance.net/your-profile" },
        { key: "dribbble", label: "Dribbble Profile", placeholder: "https://dribbble.com/your-profile" },
        { key: "portfolio", label: "Portfolio Website", placeholder: "https://your-portfolio.com" },
    ],
    "3d_modeling": [
        { key: "artstation", label: "ArtStation Profile", placeholder: "https://www.artstation.com/your-profile" },
        { key: "sketchfab", label: "Sketchfab Profile", placeholder: "https://sketchfab.com/your-profile" },
        { key: "behance", label: "Behance / Portfolio Link", placeholder: "https://www.behance.net/your-profile" },
    ],
    cgi_videos: [
        { key: "vimeo", label: "Vimeo Portfolio", placeholder: "https://vimeo.com/your-profile" },
        { key: "youtube", label: "YouTube Portfolio", placeholder: "https://www.youtube.com/@your-channel" },
        { key: "artstation", label: "ArtStation / Showreel", placeholder: "https://www.artstation.com/your-profile" },
    ],
    crm_erp: [
        { key: "portfolio", label: "CRM/ERP Case Studies", placeholder: "https://your-portfolio.com/crm-erp" },
        { key: "linkedin", label: "LinkedIn Profile", placeholder: "https://www.linkedin.com/in/your-profile" },
        { key: "website", label: "Professional Website", placeholder: "https://your-website.com" },
    ],
    voice_agent: [
        { key: "demoCall", label: "Voice Agent Demo Link", placeholder: "https://your-website.com/voice-agent-demo" },
        { key: "portfolio", label: "Voice AI Case Studies", placeholder: "https://your-portfolio.com/voice-ai" },
        { key: "github", label: "GitHub Profile", placeholder: "https://github.com/your-username" },
    ],
};

export const getServicePlatformProfileFields = (serviceKey) => {
    const serviceFields = SERVICE_PLATFORM_PROFILE_FIELDS[serviceKey] || [];
    const sourceFields = serviceFields.length
        ? serviceFields
        : [...DEFAULT_SERVICE_PLATFORM_PROFILE_FIELDS, ...SERVICE_PLATFORM_LINK_FALLBACK_FIELDS];

    const fieldsByKey = new Map();
    sourceFields.forEach((field) => {
        const key = String(field?.key || "").trim();
        if (!key || fieldsByKey.has(key)) return;
        fieldsByKey.set(key, field);
    });

    return Array.from(fieldsByKey.values());
};

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
    "Technology",
    "SaaS",
    "E-commerce",
    "Startups",
    "Consulting & Professional Services",
    "Personal Brands / Influencers",
    "Education",
    "Healthcare",
    "Finance",
    "Real Estate",
    "Food & Beverage",
    "Entertainment & Media",
    "Fashion & Apparel",
    "Beauty & Cosmetics",
    "Local Businesses",
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

export const DAILY_TECH_OPTIONS_BY_SERVICE = {
    website_ui_ux: [
        "HTML / CSS / JavaScript",
        "TypeScript",
        "Tailwind CSS",
        "Bootstrap",
        "Framer",
        "Elementor",
        "WooCommerce",
        "Webflow CMS",
        "Vercel",
        "Cloudflare",
        "Vue / Nuxt",
        "Git/GitHub",
    ],
    software_development: [
        "TypeScript",
        "React",
        "Next.js",
        "Python",
        "Django / FastAPI",
        "Java / Spring Boot",
        ".NET",
        "PostgreSQL / MySQL",
        "MongoDB",
        "Redis",
        "Docker",
        "Kubernetes",
        "AWS / GCP / Azure",
        "Git/GitHub",
        "CI/CD Pipelines",
    ],
    app_development: [
        "React Native",
        "Flutter",
        "Kotlin",
        "Swift",
        "Expo",
        "Firebase",
        "Supabase",
        "Appwrite",
        "Android Studio",
        "Xcode",
        "REST / GraphQL APIs",
        "Push Notifications (FCM/APNs)",
    ],
    creative_design: [
        "Figma",
        "Adobe Photoshop",
        "Adobe Illustrator",
        "Canva",
        "Framer",
        "Sketch",
        "Adobe InDesign",
        "Adobe Firefly",
        "Midjourney",
        "DALL-E",
        "After Effects",
    ],
    social_media_marketing: [
        "Meta Business Suite",
        "Instagram",
        "Facebook",
        "LinkedIn",
        "YouTube",
        "TikTok",
        "X / Twitter",
        "Threads",
        "Pinterest",
        "Buffer / Hootsuite",
        "Canva",
        "Google Analytics 4",
    ],
    seo: [
        "Google Search Console",
        "Google Analytics 4",
        "Google Keyword Planner",
        "Google Trends",
        "PageSpeed Insights",
        "Screaming Frog",
        "SEMrush",
        "Ahrefs",
        "Yoast SEO",
        "Rank Math",
        "Surfer SEO",
        "Moz",
        "Ubersuggest",
    ],
    lead_generation: [
        "LinkedIn Sales Navigator",
        "Apollo",
        "Lemlist",
        "Clay",
        "HubSpot",
        "Pipedrive",
        "Close CRM",
        "Instantly",
        "Hunter.io",
        "Clearbit",
        "Google Sheets / Airtable",
    ],
    voice_agent: [
        "VAPI",
        "Twilio",
        "ElevenLabs",
        "Deepgram",
        "Retell AI",
        "Bland AI",
        "OpenAI Realtime API",
        "Whisper",
        "AssemblyAI",
        "Make.com",
        "Zapier",
    ],
    branding: [
        "Adobe Illustrator",
        "Adobe Photoshop",
        "Canva",
        "Figma",
        "Adobe Express",
        "Behance",
        "Dribbble",
        "Miro",
        "Notion",
    ],
    paid_advertising: [
        "Google Ads",
        "Meta Ads Manager",
        "LinkedIn Ads",
        "Tamboola Ads",
        "YouTube Ads",
        "Google Merchant Center",
        "Microsoft Ads",
        "Google Tag Manager",
        "GA4",
        "Meta Pixel",
        "Hotjar",
        "Looker Studio",
    ],
    video_services: [
        "Adobe Premiere Pro",
        "After Effects",
        "DaVinci Resolve",
        "Final Cut Pro",
        "CapCut",
        "Filmora",
        "Canva Video",
        "Descript",
        "Frame.io",
        "Audition",
    ],
    customer_support: [
        "Zendesk",
        "Freshdesk",
        "Intercom",
        "Help Scout",
        "HubSpot Service Hub",
        "Salesforce Service Cloud",
        "Zoho Desk",
        "Gorgias",
        "LiveChat",
        "WhatsApp Business",
        "Slack",
    ],
    ugc_marketing: [
        "Instagram Reels",
        "TikTok",
        "YouTube Shorts",
        "Meta Creator Studio",
        "Canva",
        "CapCut",
        "InShot",
        "Amazon Influencer",
        "Snapchat Spotlight",
    ],
    influencer_marketing: [
        "Instagram",
        "YouTube",
        "TikTok",
        "X / Twitter",
        "Twitch",
        "LinkedIn",
        "CreatorIQ",
        "Upfluence",
        "Aspire",
        "Modash",
        "GRIN",
    ],
    ai_automation: [
        "Zapier",
        "Make.com",
        "n8n",
        "Pipedream",
        "Airtable",
        "Notion API",
        "OpenAI API",
        "Claude API",
        "LangChain",
        "Vector Databases",
        "Google Apps Script",
    ],
    whatsapp_chatbot: [
        "Meta WhatsApp Cloud API",
        "WhatsApp Business API",
        "Twilio",
        "360dialog",
        "WATI",
        "Gupshup",
        "ManyChat",
        "Botpress",
        "Dialogflow",
        "Make.com",
    ],
    crm_erp: [
        "Salesforce",
        "HubSpot",
        "Zoho CRM",
        "Microsoft Dynamics 365",
        "Odoo",
        "SAP",
        "Pipedrive",
        "Monday CRM",
        "Freshsales",
        "Power BI",
        "Zapier",
    ],
    "3d_modeling": [
        "Blender",
        "Maya",
        "3ds Max",
        "Cinema 4D",
        "Substance Painter",
        "Houdini",
        "Rhino 3D",
        "KeyShot",
        "Unreal Engine",
    ],
    cgi_videos: [
        "Blender",
        "Cinema 4D",
        "Maya",
        "Houdini",
        "Unreal Engine",
        "After Effects",
        "Octane Render",
        "Redshift",
        "Arnold",
        "Nuke",
        "DaVinci Resolve",
    ],
    writing_content: [
        "Google Docs",
        "Notion",
        "Grammarly",
        "Hemingway Editor",
        "Surfer SEO",
        "Jasper",
        "ChatGPT",
        "Claude",
        "Copyscape",
        "Ahrefs",
        "WordPress Editor",
    ],
};

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
                "Other",
            ],
            min: 2,
        },
        {
            id: "website_tech_stack",
            label: "Which Technologies Do You Actively Use? (Min 2)",
            options: [
                "WordPress",
                "Shopify",
                "Webflow",
                "React / Next.js",
                "PHP / Laravel",
                "Node.js",
                "Custom CMS",
            ],
            min: 2,
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
                "Tamboola Ads",
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
