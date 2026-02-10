
"use client";

import React, { useMemo, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Check,
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
  Loader2,
  Sparkles,
  Mic,
  X,
  Upload,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { cn } from "@/shared/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { signup, verifyOtp, updateProfile, listFreelancers, fetchStatesByCountry } from "@/shared/lib/api-client";
import { useAuth } from "@/shared/context/AuthContext";
import { COUNTRY_CODES } from "@/shared/data/countryCodes";

// ============================================================================
// CONSTANTS & OPTIONS
// ============================================================================

const ROLE_OPTIONS = [
  { value: "individual", label: "Individual Freelancer", icon: User, description: "Working independently on projects" },
  { value: "agency", label: "Agency / Studio", icon: Building2, description: "Team of professionals" },
  { value: "part_time", label: "Part-Time Freelancer", icon: Clock, description: "Freelancing alongside other work" },
];

const SERVICE_LIMITS = {
  individual: 3,
  agency: 5,
  part_time: 2,
};

const SERVICE_OPTIONS = [
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
const EXPERIENCE_YEARS_OPTIONS = [
  { value: "less_than_1", label: "Less than 1 year" },
  { value: "1_3", label: "1–3 years" },
  { value: "3_5", label: "3–5 years" },
  { value: "5_plus", label: "5+ years" },
];

const WORKING_LEVEL_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const YES_NO_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const UPCOMING_NICHE_OPTIONS = [
  { value: "yes", label: "Yes, same niche" },
  { value: "open", label: "Open to all" },
];

const LANGUAGE_OPTIONS = [
  { value: "English", label: "English" },
  { value: "Hindi", label: "Hindi" },
  { value: "Other", label: "Other (Custom)" },
];

const COUNTRY_OPTIONS = Array.from(
  new Set((COUNTRY_CODES || []).map((country) => country.name).filter(Boolean)),
).sort((a, b) => a.localeCompare(b));

const STATE_OPTIONS_CACHE = new Map();

const ROLE_IN_PROJECT_OPTIONS = [
  { value: "full_execution", label: "Full execution" },
  { value: "partial_contribution", label: "Partial contribution" },
  { value: "team_project", label: "Team project" },
];

const PROJECT_TIMELINE_OPTIONS = [
  { value: "less_than_2_weeks", label: "Less than 2 weeks" },
  { value: "2_4_weeks", label: "2–4 weeks" },
  { value: "1_3_months", label: "1–3 months" },
  { value: "3_plus_months", label: "3+ months" },
];

const PROJECT_COMPLEXITY_OPTIONS = [
  { value: "small", label: "Small tasks / Quick projects" },
  { value: "medium", label: "Medium complexity projects" },
  { value: "large", label: "Large / Enterprise level systems" },
  { value: "all_types", label: "All Types Of Projects" },
];

const IN_PROGRESS_PROJECT_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const PRICE_RANGE_MIN = 1000;
const PRICE_RANGE_MAX = 1000000;
const PRICE_RANGE_STEP = 1000;



const SERVICE_GROUPS = {
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

const INDUSTRY_NICHE_OPTIONS = [
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

const DEFAULT_TECH_STACK_OPTIONS = [
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

const BUDGET_RANGE_OPTIONS = [
  { value: "under_10k", label: "Under INR 10,000" },
  { value: "10k_50k", label: "INR 10,000 - 50,000" },
  { value: "50k_1l", label: "INR 50,000 - 1 Lakh" },
  { value: "1l_2l", label: "INR 1 Lakh - 2 Lakhs" },
  { value: "2l_5l", label: "INR 2 Lakhs - 5 Lakhs" },
  { value: "5l_10l", label: "INR 5 Lakhs - 10 Lakhs" },
  { value: "over_10l", label: "Over INR 10 Lakhs" },
];

const HOURS_PER_WEEK_OPTIONS = [
  { value: "less_than_10", label: "Less than 10 hours" },
  { value: "10_20", label: "10-20 hours" },
  { value: "20_30", label: "20-30 hours" },
  { value: "30_plus", label: "30+ hours" },
];


const WORKING_SCHEDULE_OPTIONS = [
  { value: "fixed", label: "Fixed daily hours" },
  { value: "flexible", label: "Flexible schedule" },
  { value: "on_demand", label: "On-demand availability" },
];

const START_TIMELINE_OPTIONS = [
  { value: "immediately", label: "Immediately" },
  { value: "within_3_days", label: "Within 3 days" },
  { value: "within_1_week", label: "Within 1 week" },
];

const DEADLINE_HISTORY_OPTIONS = [
  { value: "never", label: "Never" },
  { value: "rarely", label: "Rarely" },
  { value: "occasionally", label: "Occasionally" },
];

const DELAY_HANDLING_OPTIONS = [
  { value: "inform_client", label: "Inform client early and adjust timeline" },
  { value: "increase_effort", label: "Increase effort/resources" },
  { value: "renegotiate_scope", label: "Renegotiate scope" },
];

const CASE_STUDY_FIELDS = [
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

const createServiceDetail = () => ({
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
  groups: {},
  groupOther: {},
  industryFocus: "",
  niches: [],
  otherNiche: "",
  preferOnlyIndustries: "",
  projectComplexity: "",
});

const getServiceLabel = (serviceKey) => {
  const match = SERVICE_OPTIONS.find((option) => option.value === serviceKey);
  return match ? match.label : serviceKey;
};

const getServiceLimit = (role) => SERVICE_LIMITS[role] || 3;

const REMOVED_SERVICE_GROUP_QUESTIONS = new Set([
  "which services do you provide?",
]);

const shouldIncludeServiceGroup = (group) => {
  const normalizedLabel = String(group?.label || "").trim().toLowerCase();
  return !REMOVED_SERVICE_GROUP_QUESTIONS.has(normalizedLabel);
};

const isOtherServiceGroupOption = (option) => {
  if (typeof option === "string") {
    return option.trim().toLowerCase() === "other";
  }
  if (!option || typeof option !== "object") return false;
  const valueOrLabel = option.value ?? option.label ?? "";
  return String(valueOrLabel).trim().toLowerCase() === "other";
};

const appendOtherServiceGroupOption = (options = []) => {
  if (!Array.isArray(options)) return [];
  if (options.some(isOtherServiceGroupOption)) return options;
  const hasObjectOptions = options.some((option) => option && typeof option === "object");
  return [...options, hasObjectOptions ? { value: "Other", label: "Other" } : "Other"];
};

const shouldAddOtherToServiceGroup = (group) => {
  const normalizedId = String(group?.id || "").trim().toLowerCase();
  const normalizedLabel = String(group?.label || "").trim().toLowerCase();
  return (
    normalizedId.includes("tech_stack") ||
    normalizedLabel.includes("which technologies do you actively use")
  );
};

const normalizeServiceGroup = (group) => {
  if (!group || !shouldAddOtherToServiceGroup(group)) return group;
  return {
    ...group,
    options: appendOtherServiceGroupOption(group.options),
  };
};

const getServiceGroups = (serviceKey) =>
  (SERVICE_GROUPS[serviceKey] || [])
    .filter(shouldIncludeServiceGroup)
    .map(normalizeServiceGroup);

const getTechStackOptions = (serviceKey) => {
  const groups = getServiceGroups(serviceKey);
  const toolGroups = groups.filter((group) => /tech_stack|tools|platforms/i.test(group.id));
  const baseOptions = toolGroups.length ? toolGroups.flatMap((group) => group.options) : [];
  const options = baseOptions.length ? baseOptions : DEFAULT_TECH_STACK_OPTIONS;
  const unique = Array.from(new Set(options));
  return unique.includes("Other") ? unique : [...unique, "Other"];
};

const parsePriceValue = (value) => {
  const digits = String(value ?? "")
    .replace(/[^\d]/g, "")
    .trim();
  if (!digits) return NaN;
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const clampPriceValue = (value) => Math.min(PRICE_RANGE_MAX, Math.max(PRICE_RANGE_MIN, value));

const formatPriceLabel = (value) => Number(value).toLocaleString("en-IN");

const isValidUrl = (value = "") => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
};

const isValidUsername = (value = "") =>
  /^[a-zA-Z0-9_]{3,20}$/.test(value.trim());

const toQuestionTitle = (value = "") =>
  value
    .split(" ")
    .map((word) => {
      if (!word) return word;
      const letters = word.replace(/[^A-Za-z]/g, "");
      if (letters.length > 1 && letters.toUpperCase() === letters) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const StepHeader = ({ title, subtitle }) => (
  <div className="mb-8 text-center px-4">
    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
      {toQuestionTitle(title)}
    </h1>
    {subtitle && <p className="text-white/60 text-sm">{subtitle}</p>}
  </div>
);

const OptionCard = ({
  selected,
  onClick,
  label,
  description,
  icon: Icon,
  compact = false,
  className = "",
}) => (
  <motion.button
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    type="button"
    onClick={onClick}
    className={cn(
      "group relative w-full flex items-center justify-between rounded-xl border transition-all duration-300 overflow-hidden",
      compact ? "px-4 py-3" : "px-6 py-5",
      selected
        ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/5"
        : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20",
      className
    )}
  >
    {selected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}

    <div className="flex items-center gap-5">
      {Icon && (
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
            selected
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-110"
              : "bg-white/10 text-white/60 group-hover:bg-white/20 group-hover:text-white"
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="text-left">
        <p
          className={cn(
            compact
              ? "text-sm font-semibold transition-colors"
              : "text-base font-semibold transition-colors",
            selected ? "text-primary" : "text-white"
          )}
        >
          {label}
        </p>
        {description && (
          <p
            className={cn(
              "text-white/50 mt-1 group-hover:text-white/70 transition-colors",
              compact ? "text-xs" : "text-sm"
            )}
          >
            {description}
          </p>
        )}
      </div>
    </div>

    <div
      className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center shrink-0 ml-4 transition-all duration-300",
        selected
          ? "bg-primary text-primary-foreground scale-110"
          : "bg-white/10 text-transparent group-hover:bg-white/20"
      )}
    >
      <Check className="w-3.5 h-3.5" />
    </div>
  </motion.button>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const FreelancerMultiStepForm = () => {
  const navigate = useNavigate();
  const { login: setAuthSession, user, refreshUser } = useAuth();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepError, setStepError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otp, setOtp] = useState("");
  const [usernameStatus, setUsernameStatus] = useState("idle");
  const usernameCheckRef = useRef(0);
  const [techStackOtherDrafts, setTechStackOtherDrafts] = useState({});
  const [groupOtherDrafts, setGroupOtherDrafts] = useState({});
  const [stateOptions, setStateOptions] = useState([]);
  const [isStateOptionsLoading, setIsStateOptionsLoading] = useState(false);

  const [formData, setFormData] = useState({
    professionalTitle: "",
    username: "",
    country: "",
    city: "",
    profilePhoto: null,
    languages: [],
    otherLanguage: "",
    linkedinUrl: "",
    portfolioUrl: "",
    role: "",
    selectedServices: [],
    serviceDetails: {},
    deliveryPolicyAccepted: false,
    hoursPerWeek: "",
    workingSchedule: "",
    startTimeline: "",
    missedDeadlines: "",
    delayHandling: "",
    communicationPolicyAccepted: false,
    acceptInProgressProjects: "",
    termsAccepted: false,
    professionalBio: "",
    fullName: "",
    email: "",
    password: "",
  });

  const advanceTimerRef = useRef(null);
  const queuedStepKeyRef = useRef("");
  const [pendingAdvance, setPendingAdvance] = useState(false);

  const steps = useMemo(() => {
    const sequence = [];

    sequence.push({ key: "profile-basics", type: "profileBasics" });

    sequence.push({ key: "role", type: "role" });
    sequence.push({ key: "services", type: "services" });

    formData.selectedServices.forEach((serviceKey) => {
      sequence.push({ key: `svc-${serviceKey}-experience`, type: "serviceExperience", serviceKey });
      sequence.push({ key: `svc-${serviceKey}-level`, type: "serviceLevel", serviceKey });
      sequence.push({ key: `svc-${serviceKey}-projects`, type: "serviceProjects", serviceKey });

      const detail = formData.serviceDetails?.[serviceKey];
      if (detail?.hasPreviousProjects === "yes") {
        CASE_STUDY_FIELDS.forEach((field) => {
          sequence.push({
            key: `svc-${serviceKey}-case-${field.key}`,
            type: "serviceCaseField",
            serviceKey,
            field,
          });
        });
      }

      if (detail?.hasPreviousProjects === "no") {
        sequence.push({ key: `svc-${serviceKey}-sample-work`, type: "serviceSampleWork", serviceKey });
        if (detail?.hasSampleWork === "yes") {
          sequence.push({ key: `svc-${serviceKey}-sample-upload`, type: "serviceSampleUpload", serviceKey });
        }
      }

      sequence.push({ key: `svc-${serviceKey}-industry-focus`, type: "serviceIndustryFocus", serviceKey });

      getServiceGroups(serviceKey).forEach((group) => {
        sequence.push({
          key: `svc-${serviceKey}-group-${group.id}`,
          type: "serviceGroup",
          serviceKey,
          groupId: group.id,
        });
      });

      sequence.push({ key: `svc-${serviceKey}-avg-price`, type: "serviceAveragePrice", serviceKey });

      sequence.push({ key: `svc-${serviceKey}-complexity`, type: "serviceComplexity", serviceKey });
    });

    sequence.push({ key: "hours", type: "hours" });
    sequence.push({ key: "working-schedule", type: "workingSchedule" });
    sequence.push({ key: "start-timeline", type: "startTimeline" });
    sequence.push({ key: "missed-deadlines", type: "missedDeadlines" });
    sequence.push({ key: "delay-handling", type: "delayHandling" });
    sequence.push({ key: "delivery-policy", type: "deliveryPolicy" });
    sequence.push({ key: "communication-policy", type: "communicationPolicy" });
    sequence.push({ key: "accept-in-progress", type: "acceptInProgressProjects" });
    sequence.push({ key: "bio", type: "bio" });

    return sequence;
  }, [formData]);

  const totalSteps = steps.length;
  const currentStep = steps[currentStepIndex];

  useEffect(() => {
    const savedData = localStorage.getItem("freelancer_onboarding_data");
    const savedStep = localStorage.getItem("freelancer_onboarding_step");

    if (savedData) {
      try {
        setFormData(JSON.parse(savedData));
      } catch (e) {
        console.error("Failed to parse saved form data", e);
      }
    }
    if (savedStep) {
      setCurrentStepIndex(parseInt(savedStep, 10));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("freelancer_onboarding_data", JSON.stringify(formData));
    localStorage.setItem("freelancer_onboarding_step", currentStepIndex.toString());
  }, [formData, currentStepIndex]);

  useEffect(() => {
    if (!steps.length) return;
    if (currentStepIndex >= steps.length) {
      setCurrentStepIndex(steps.length - 1);
    }
  }, [steps.length, currentStepIndex]);

  // Handle browser back button - intercept and navigate to previous step instead
  useEffect(() => {
    // Push initial state when component mounts
    if (currentStepIndex === 0) {
      window.history.replaceState({ step: 0 }, "");
    }

    const handlePopState = (event) => {
      // If we have step state and we're not at step 0, go back a step
      if (currentStepIndex > 0) {
        event.preventDefault();
        // Push state again to prevent actually going back in browser history
        window.history.pushState({ step: currentStepIndex - 1 }, "");
        setCurrentStepIndex((prev) => Math.max(0, prev - 1));
        setStepError("");
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [currentStepIndex]);

  // Push history state when step changes (so back button works)
  useEffect(() => {
    if (currentStepIndex > 0) {
      window.history.pushState({ step: currentStepIndex }, "");
    }
  }, [currentStepIndex]);

  useEffect(() => {
    if (!formData.role) return;
    const limit = getServiceLimit(formData.role);
    if (formData.selectedServices.length > limit) {
      setFormData((prev) => ({
        ...prev,
        selectedServices: prev.selectedServices.slice(0, limit),
      }));
    }
  }, [formData.role, formData.selectedServices.length]);

  useEffect(() => {
    if (formData.selectedServices.length === 0) return;
    setFormData((prev) => {
      const nextDetails = { ...prev.serviceDetails };
      let changed = false;

      prev.selectedServices.forEach((serviceKey) => {
        if (!nextDetails[serviceKey]) {
          nextDetails[serviceKey] = createServiceDetail();
          changed = true;
        }
      });

      return changed ? { ...prev, serviceDetails: nextDetails } : prev;
    });
  }, [formData.selectedServices]);

  useEffect(() => {
    let isCancelled = false;
    const countryName = String(formData.country || "").trim();

    if (!countryName) {
      setStateOptions([]);
      setIsStateOptionsLoading(false);
      return () => {
        isCancelled = true;
      };
    }

    const cachedStates = STATE_OPTIONS_CACHE.get(countryName);
    if (STATE_OPTIONS_CACHE.has(countryName)) {
      setStateOptions(cachedStates);
      setIsStateOptionsLoading(false);
      return () => {
        isCancelled = true;
      };
    }

    setIsStateOptionsLoading(true);

    void fetchStatesByCountry(countryName)
      .then((response) => {
        const nextStates = Array.isArray(response?.states)
          ? response.states
              .map((state) => String(state || "").trim())
              .filter(Boolean)
              .sort((a, b) => a.localeCompare(b))
          : [];

        STATE_OPTIONS_CACHE.set(countryName, nextStates);

        if (isCancelled) return;
        setStateOptions(nextStates);
      })
      .catch((error) => {
        console.error("Failed to load state options:", error);
        if (isCancelled) return;
        setStateOptions([]);
      })
      .finally(() => {
        if (isCancelled) return;
        setIsStateOptionsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [formData.country]);

  useEffect(() => {
    if (!isVerifying) return;
    if (otp.length === 6 && !isSubmitting) {
      handleVerifyOtp();
    }
  }, [otp, isVerifying, isSubmitting]);

  useEffect(() => {
    if (!pendingAdvance) return;
    setPendingAdvance(false);

    if (!currentStep) return;
    if (queuedStepKeyRef.current && queuedStepKeyRef.current !== currentStep.key) {
      return;
    }
    queuedStepKeyRef.current = "";
    const validation = validateStep(currentStep, formData);
    if (validation) {
      setStepError(validation);
      toast.error(validation);
      return;
    }

    if (currentStepIndex >= totalSteps - 1) {
      handleSubmit();
      return;
    }

    setCurrentStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
    setStepError("");
  }, [pendingAdvance, currentStep, currentStepIndex, totalSteps, formData]);

  useEffect(() => () => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
    }
  }, []);

  const queueAdvance = (delay = 0) => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
    }
    queuedStepKeyRef.current = currentStep?.key || "";
    advanceTimerRef.current = setTimeout(() => {
      setPendingAdvance(true);
    }, delay);
  };

  const checkUsernameAvailability = async (value = formData.username) => {
    const normalized = value.trim();
    if (!isValidUsername(normalized)) {
      setUsernameStatus("idle");
      return;
    }

    const currentUsername =
      (user?.profileDetails?.identity?.username ||
        user?.profileDetails?.username ||
        user?.username ||
        "")
        .trim()
        .toLowerCase();

    if (currentUsername && currentUsername === normalized.toLowerCase()) {
      setUsernameStatus("available");
      return;
    }

    const requestId = usernameCheckRef.current + 1;
    usernameCheckRef.current = requestId;
    setUsernameStatus("checking");

    try {
      const freelancers = await listFreelancers();
      if (usernameCheckRef.current !== requestId) return;

      const isTaken = Array.isArray(freelancers) && freelancers.some((freelancer) => {
        const existing =
          freelancer?.profileDetails?.identity?.username ||
          freelancer?.profileDetails?.username ||
          freelancer?.username ||
          "";
        return existing.trim().toLowerCase() === normalized.toLowerCase();
      });

      setUsernameStatus(isTaken ? "unavailable" : "available");
    } catch (error) {
      if (usernameCheckRef.current !== requestId) return;
      console.error("Failed to check username availability:", error);
      setUsernameStatus("error");
    }
  };

  const handleBack = () => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
    }
    queuedStepKeyRef.current = "";
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      setStepError("");
    }
  };

  const updateFormField = (field, value, advanceDelay = null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (stepError) setStepError("");
    if (advanceDelay !== null) queueAdvance(advanceDelay);
  };

  const handleCountryChange = (country, advanceDelay = null) => {
    setFormData((prev) => {
      if (prev.country === country) return prev;
      return {
        ...prev,
        country,
        city: "",
      };
    });
    if (stepError) setStepError("");
    if (advanceDelay !== null) queueAdvance(advanceDelay);
  };

  const updateServiceField = (serviceKey, field, value, advanceDelay = null) => {
    setFormData((prev) => {
      const details = prev.serviceDetails?.[serviceKey] || createServiceDetail();
      return {
        ...prev,
        serviceDetails: {
          ...prev.serviceDetails,
          [serviceKey]: {
            ...details,
            [field]: value,
          },
        },
      };
    });
    if (stepError) setStepError("");
    if (advanceDelay !== null) queueAdvance(advanceDelay);
  };

  const updateServiceCaseField = (serviceKey, field, value, advanceDelay = null) => {
    setFormData((prev) => {
      const details = prev.serviceDetails?.[serviceKey] || createServiceDetail();
      return {
        ...prev,
        serviceDetails: {
          ...prev.serviceDetails,
          [serviceKey]: {
            ...details,
            caseStudy: {
              ...(details.caseStudy || {}),
              [field]: value,
            },
          },
        },
      };
    });
    if (stepError) setStepError("");
    if (advanceDelay !== null) queueAdvance(advanceDelay);
  };

  const hasMultipleChoices = (options = []) => Array.isArray(options) && options.length > 1;
  const hasSingleChoice = (options = []) => Array.isArray(options) && options.length === 1;
  const parseCustomTools = (value = "") =>
    String(value)
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);

  const normalizeCustomTools = (items = []) => {
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

  const toggleServiceSelection = (serviceKey) => {
    const current = formData.selectedServices;
    const exists = current.includes(serviceKey);
    const limit = getServiceLimit(formData.role);

    if (!exists && current.length >= limit) {
      toast.error(`You can select up to ${limit} services.`);
      return;
    }

    const next = exists
      ? current.filter((item) => item !== serviceKey)
      : [...current, serviceKey];

    setFormData((prev) => ({ ...prev, selectedServices: next }));

    if (hasSingleChoice(SERVICE_OPTIONS) && !exists && next.length > 0) {
      queueAdvance(0);
    }
  };

  const validateStep = (step, data) => {
    if (!step) return "";

    const detail = step.serviceKey ? data.serviceDetails?.[step.serviceKey] : null;

    switch (step.type) {
      case "profileBasics":
        if (!data.professionalTitle.trim()) return "Please enter your profession title.";
        if (!data.username.trim()) return "Please enter a username.";
        if (!isValidUsername(data.username)) {
          return "Username must be 3-20 characters and only letters, numbers, or underscores.";
        }
        if (usernameStatus === "checking") return "Checking username availability...";
        if (usernameStatus === "unavailable") return "That username is already taken.";
        if (usernameStatus === "error") return "Unable to verify username. Please try again.";
        if (usernameStatus !== "available") return "Please check username availability.";
        if (!data.country) return "Please select your country.";
        if (!data.city.trim()) return "Please select your state.";
        if (!data.profilePhoto) return "Please upload a profile photo.";
        if (!data.languages.length) return "Please select at least one language.";
        if (data.languages.includes("Other") && !data.otherLanguage.trim()) {
          return "Please specify your other language.";
        }
        if (!isValidUrl(data.linkedinUrl)) return "Please enter a valid LinkedIn profile URL.";
        if (!isValidUrl(data.portfolioUrl)) return "Please enter a valid portfolio or website URL.";
        return "";
      case "professionalTitle":
        return data.professionalTitle.trim() ? "" : "Please enter your profession title.";
      case "username":
        if (!data.username.trim()) return "Please enter a username.";
        if (!isValidUsername(data.username)) {
          return "Username must be 3-20 characters and only letters, numbers, or underscores.";
        }
        if (usernameStatus === "checking") return "Checking username availability...";
        if (usernameStatus === "unavailable") return "That username is already taken.";
        if (usernameStatus === "error") return "Unable to verify username. Please try again.";
        if (usernameStatus !== "available") return "Please check username availability.";
        return "";
      case "country":
        return data.country ? "" : "Please select your country.";
      case "city":
        return data.city.trim() ? "" : "Please select your state.";
      case "profilePhoto":
        return data.profilePhoto ? "" : "Please upload a profile photo.";
      case "languages":
        if (!data.languages.length) return "Please select at least one language.";
        if (data.languages.includes("Other") && !data.otherLanguage.trim()) {
          return "Please specify your other language.";
        }
        return "";
      case "linkedin":
        return isValidUrl(data.linkedinUrl) ? "" : "Please enter a valid LinkedIn profile URL.";
      case "portfolio":
        return isValidUrl(data.portfolioUrl) ? "" : "Please enter a valid portfolio or website URL.";
      case "role":
        return data.role ? "" : "Please select how you want to work on Catalance.";
      case "services":
        return data.selectedServices.length > 0 ? "" : "Please select at least one service.";
      case "serviceExperience":
        return detail?.experienceYears ? "" : "Please select your experience for this service.";
      case "serviceLevel":
        return detail?.workingLevel ? "" : "Please select your working level.";
      case "serviceProjects":
        return detail?.hasPreviousProjects ? "" : "Please select an option.";
      case "serviceCaseField":
        if (step.field.type === "multiselect") {
          const selections = detail?.caseStudy?.[step.field.key] || [];
          if (!selections.length) return "Please select at least one option.";
          if (step.field.key === "techStack") {
            const customTools = parseCustomTools(detail?.caseStudy?.techStackOther);
            const otherSelected = selections.includes("Other");
            const selectedPredefinedTools = selections.filter((item) => item !== "Other").length;
            const totalSelectedTools = selectedPredefinedTools + (otherSelected ? customTools.length : 0);

            if (step.field.min && totalSelectedTools < step.field.min) {
              return `Please select at least ${step.field.min} tools.`;
            }
            if (otherSelected && customTools.length === 0) {
              return "Please add at least one custom tool.";
            }
            return "";
          }
          if (step.field.min && selections.length < step.field.min) {
            return `Please select at least ${step.field.min} options.`;
          }
          return "";
        }
        if (step.field.type === "select") {
          const value = detail?.caseStudy?.[step.field.key];
          if (!value) return "Please select an option.";
          if (step.field.key === "industry" && value === "Other" && !detail?.caseStudy?.industryOther?.trim()) {
            return "Please specify the industry.";
          }
          return "";
        }
        return detail?.caseStudy?.[step.field.key]?.trim()
          ? ""
          : "Please fill out this field.";
      case "serviceSampleWork":
        return detail?.hasSampleWork ? "" : "Please select an option.";
      case "serviceSampleUpload":
        return detail?.sampleWork ? "" : "Please upload a sample or practice work.";
      case "serviceAveragePrice": {
        const minPrice = parsePriceValue(detail?.averagePriceMin);
        const maxPrice = parsePriceValue(detail?.averagePriceMax);
        if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice)) {
          return "Please set both minimum and maximum price.";
        }
        if (maxPrice < minPrice) return "Maximum price must be greater than or equal to minimum price.";
        return "";
      }
      case "serviceGroup": {
        const groups = detail?.groups || {};
        const selections = Array.isArray(groups[step.groupId]) ? groups[step.groupId] : [];
        const group = getServiceGroups(step.serviceKey).find((entry) => entry.id === step.groupId);
        const minSelections = group?.min || 1;
        const optionValues = Array.isArray(group?.options)
          ? group.options
              .map((option) => {
                if (typeof option === "string") return option;
                const value = option?.value ?? option?.label;
                return typeof value === "string" ? value : "";
              })
              .map((value) => value.trim())
              .filter(Boolean)
          : [];

        const otherOptionValue = optionValues.find((value) => value.toLowerCase() === "other") || null;
        const otherSelected = Boolean(otherOptionValue && selections.includes(otherOptionValue));
        const customValues = otherSelected
          ? normalizeCustomTools(parseCustomTools(detail?.groupOther?.[step.groupId] || ""))
          : [];

        if (otherSelected && customValues.length === 0) {
          return "Please add at least one custom option.";
        }

        const selectedWithoutOther = otherOptionValue
          ? selections.filter((value) => value !== otherOptionValue)
          : selections;
        const totalSelections = selectedWithoutOther.length + customValues.length;

        return totalSelections >= minSelections
          ? ""
          : `Please select at least ${minSelections} option${minSelections > 1 ? "s" : ""}.`;
      }
      case "serviceIndustryFocus":
        return detail?.industryFocus ? "" : "Please select an option.";
      case "serviceNiches":
        if (!detail?.niches?.length) return "Please select at least one niche.";
        if (detail.niches.includes("Other") && !detail.otherNiche.trim()) {
          return "Please specify your other niche.";
        }
        return "";
      case "serviceIndustryOnly":
        return detail?.preferOnlyIndustries ? "" : "Please select an option.";
      case "serviceComplexity":
        return detail?.projectComplexity ? "" : "Please select a complexity level.";
      case "deliveryPolicy":
        return data.deliveryPolicyAccepted ? "" : "Please accept the delivery and revision policy.";
      case "hours":
        return data.hoursPerWeek ? "" : "Please select weekly availability.";
      case "workingSchedule":
        return data.workingSchedule ? "" : "Please select a working schedule.";
      case "startTimeline":
        return data.startTimeline ? "" : "Please select when you can start.";
      case "missedDeadlines":
        return data.missedDeadlines ? "" : "Please select your deadline history.";
      case "delayHandling":
        return data.delayHandling ? "" : "Please select how you handle delays.";
      case "communicationPolicy":
        return data.communicationPolicyAccepted ? "" : "Please accept the communication policy.";
      case "acceptInProgressProjects":
        return data.acceptInProgressProjects ? "" : "Please select an option.";
      case "bio":
        if (!data.professionalBio.trim()) return "Please write a short professional bio.";
        return data.termsAccepted ? "" : "Please agree to the terms and conditions.";
      default:
        return "";
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const validation = validateStep(currentStep, formData);
    if (validation) {
      setStepError(validation);
      toast.error(validation);
      return;
    }

    setIsSubmitting(true);
    setStepError("");

    try {
      const identity = {
        professionalTitle: formData.professionalTitle,
        username: formData.username,
        country: formData.country,
        city: formData.city,
        profilePhoto: formData.profilePhoto,
        languages: formData.languages,
        otherLanguage: formData.otherLanguage,
        linkedinUrl: formData.linkedinUrl,
        portfolioUrl: formData.portfolioUrl,
      };

      const freelancerProfile = {
        identity,
        role: formData.role,
        services: formData.selectedServices,
        serviceDetails: formData.serviceDetails,
        availability: {
          hoursPerWeek: formData.hoursPerWeek,
          workingSchedule: formData.workingSchedule,
          startTimeline: formData.startTimeline,
        },
        reliability: {
          missedDeadlines: formData.missedDeadlines,
          delayHandling: formData.delayHandling,
        },
        deliveryPolicyAccepted: formData.deliveryPolicyAccepted,
        communicationPolicyAccepted: formData.communicationPolicyAccepted,
        acceptInProgressProjects: formData.acceptInProgressProjects,
        termsAccepted: formData.termsAccepted,
        professionalBio: formData.professionalBio,
      };

      if (user) {
        await updateProfile({
          profileDetails: freelancerProfile,
          bio: formData.professionalBio,
          linkedin: formData.linkedinUrl,
          portfolio: formData.portfolioUrl,
          onboardingComplete: true,
        });

        await refreshUser();
        localStorage.removeItem("freelancer_onboarding_data");
        localStorage.removeItem("freelancer_onboarding_step");

        toast.success("Profile completed successfully!");
        navigate("/freelancer", { replace: true });
        return;
      }

      if (!formData.fullName.trim() || !formData.email.trim() || !formData.password.trim()) {
        toast.error("Please sign up or log in before completing onboarding.");
        setIsSubmitting(false);
        return;
      }

      const authPayload = await signup({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: "FREELANCER",
        freelancerProfile,
        portfolio: formData.portfolioUrl,
        linkedin: formData.linkedinUrl,
        bio: formData.professionalBio,
      });

      if (!authPayload?.accessToken) {
        setIsVerifying(true);
        setIsSubmitting(false);
        if (authPayload?.emailDelivery === "not_sent") {
          toast.warning(
            "Verification email could not be delivered. Use the OTP from backend logs in development."
          );
        } else {
          toast.success("Verification code sent to your email!");
        }
        return;
      }

      setAuthSession(authPayload?.user, authPayload?.accessToken);
      localStorage.removeItem("freelancer_onboarding_data");
      localStorage.removeItem("freelancer_onboarding_step");

      toast.success("Your freelancer account has been created.");
      navigate("/freelancer", { replace: true });
    } catch (error) {
      const message = error?.message || "Unable to complete setup right now.";
      setStepError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      toast.error("Please enter a valid verification code");
      return;
    }

    setIsSubmitting(true);
    try {
      const normalizedEmail = formData.email.trim().toLowerCase();
      const authPayload = await verifyOtp({ email: normalizedEmail, otp });

      setAuthSession(authPayload?.user, authPayload?.accessToken);

      localStorage.removeItem("freelancer_onboarding_data");
      localStorage.removeItem("freelancer_onboarding_step");

      toast.success("Account verified and created successfully!");
      navigate("/freelancer", { replace: true });
    } catch (error) {
      toast.error(error.message || "Invalid verification code");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderServiceMeta = (serviceKey) => {
    const totalServices = formData.selectedServices.length;
    if (totalServices <= 1) return "";

    const index = formData.selectedServices.indexOf(serviceKey);
    if (index === -1) return "";

    const label = getServiceLabel(serviceKey);
    return `Service ${index + 1} of ${totalServices}: ${label}`;
  };

  const renderContinueButton = (step = currentStep, { show = true } = {}) => {
    if (!show) return null;
    const validation = validateStep(step, formData);
    const disabled = Boolean(validation);

    const footer = (
      <div className="fixed inset-x-0 bottom-0 z-40 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-zinc-950/95 to-transparent" />
        <div className="relative mx-auto max-w-4xl px-6 pt-4 sm:pt-6 pb-4 sm:pb-6 flex justify-center">
        <button
          type="button"
          onClick={() => queueAdvance(0)}
          disabled={disabled}
          className={cn(
            "pointer-events-auto min-w-[180px] px-8 py-3 rounded-xl font-semibold transition-all",
            disabled
              ? "bg-white/10 text-white/40 cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20"
          )}
        >
          Continue
        </button>
        </div>
      </div>
    );

    if (typeof document === "undefined") return footer;
    return createPortal(footer, document.body);
  };

  const renderProfileBasicsStep = () => {
    const helperText = {
      idle: "Use 3-20 characters: letters, numbers, or underscores.",
      checking: "Checking availability...",
      available: "Username is available.",
      unavailable: "That username is already taken.",
      error: "Unable to check username right now.",
    };
    const canCheck = isValidUsername(formData.username);
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
            <div className="flex gap-2">
              <Input
                value={formData.username}
                onChange={(e) => {
                  updateFormField("username", e.target.value);
                  setUsernameStatus("idle");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canCheck) {
                    e.preventDefault();
                    checkUsernameAvailability();
                  }
                }}
                placeholder="username"
                className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 flex-1"
              />
              <button
                type="button"
                onClick={() => checkUsernameAvailability()}
                disabled={!canCheck || usernameStatus === "checking"}
                className={cn(
                  "px-4 h-10 rounded-lg text-sm font-semibold transition-all",
                  !canCheck || usernameStatus === "checking"
                    ? "bg-white/10 text-white/40 cursor-not-allowed"
                    : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                {usernameStatus === "checking" ? "Checking..." : "Check"}
              </button>
            </div>
            <p
              className={cn(
                "text-xs min-h-4",
                usernameStatus === "available" && "text-green-400",
                usernameStatus === "unavailable" && "text-red-400",
                (usernameStatus === "idle" || usernameStatus === "checking") && "text-white/50",
                usernameStatus === "error" && "text-yellow-400"
              )}
            >
              {helperText[usernameStatus] || helperText.idle}
            </p>
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
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-dashed border-white/20 hover:border-primary/50 hover:bg-white/5 cursor-pointer transition-all"
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

          <div className="space-y-1.5 lg:col-span-2">
            <Label className="text-white/70 text-[11px]">Languages</Label>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {LANGUAGE_OPTIONS.map((option) => {
                const isSelected = values.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleLanguage(option.value)}
                    className={cn(
                      "h-10 px-3 rounded-lg border flex items-center justify-between text-sm font-medium transition-all",
                      isSelected
                        ? "border-primary/50 bg-primary/5 text-primary"
                        : "border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20"
                    )}
                  >
                    <span className="truncate">{option.label}</span>
                    <span
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-white/10 text-transparent"
                      )}
                    >
                      <Check className="w-3 h-3" />
                    </span>
                  </button>
                );
              })}
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

  const renderSingleSelectStep = ({ title, subtitle, options, value, onSelect, compact = false, columns = 1 }) => (
    <div className="space-y-4">
      <StepHeader title={title} subtitle={subtitle} />
      <div className={cn(columns > 1 ? "grid gap-3" : "space-y-3", columns === 2 && "grid-cols-2", columns === 3 && "grid-cols-3")}>
        {options.map((option) => (
          <OptionCard
            key={option.value}
            compact={compact}
            selected={value === option.value}
            onClick={() => onSelect(option.value)}
            label={option.label}
            description={option.description}
            icon={option.icon}
            className={columns > 1 ? "justify-center" : ""}
          />
        ))}
      </div>
    </div>
  );

  const renderProfessionalTitleStep = () => (
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

  const renderUsernameStep = () => {
    const helperText = {
      idle: "Use 3-20 characters: letters, numbers, or underscores.",
      checking: "Checking availability...",
      available: "Username is available.",
      unavailable: "That username is already taken.",
      error: "Unable to check username right now.",
    };

    const canCheck = isValidUsername(formData.username);

    return (
      <div className="space-y-6">
        <StepHeader
          title="Choose a username"
          subtitle="This will appear on your public profile"
        />
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            value={formData.username}
            onChange={(e) => {
              updateFormField("username", e.target.value);
              setUsernameStatus("idle");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && isValidUsername(formData.username)) {
                e.preventDefault();
                checkUsernameAvailability();
              }
            }}
            placeholder="username"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 flex-1"
          />
          <button
            type="button"
            onClick={() => checkUsernameAvailability()}
            disabled={!canCheck || usernameStatus === "checking"}
            className={cn(
              "px-4 py-2 rounded-xl font-semibold transition-all",
              !canCheck || usernameStatus === "checking"
                ? "bg-white/10 text-white/40 cursor-not-allowed"
                : "bg-white/10 text-white hover:bg-white/20"
            )}
          >
            {usernameStatus === "checking" ? "Checking..." : "Check"}
          </button>
        </div>
        <p
          className={cn(
            "text-sm",
            usernameStatus === "available" && "text-green-400",
            usernameStatus === "unavailable" && "text-red-400",
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

  const renderCountryStep = () => (
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

  const renderCityStep = () => (
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

  const renderProfilePhotoStep = () => {
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

  const renderLanguagesStep = () => {
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
        <div className="grid grid-cols-2 gap-3">
          {LANGUAGE_OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              compact
              selected={values.includes(option.value)}
              onClick={() => toggleLanguage(option.value)}
              label={option.label}
              className="justify-center"
            />
          ))}
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

  const renderLinkedinStep = () => (
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

  const renderPortfolioStep = () => (
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

  const renderRoleStep = () => (
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

  const renderServicesStep = () => {
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

  const renderServiceExperience = (serviceKey) => (
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

  const renderServiceLevel = (serviceKey) => (
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

  const renderServiceProjects = (serviceKey) => (
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

  const renderServiceCaseField = (serviceKey, field) => {
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

  const renderServiceSampleWork = (serviceKey) => (
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

  const renderServiceSampleUpload = (serviceKey) => {
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

  const renderServiceAveragePrice = (serviceKey) => {
    const detail = formData.serviceDetails?.[serviceKey];
    const minPrice = detail?.averagePriceMin || "";
    const maxPrice = detail?.averagePriceMax || "";
    const parsedMinPrice = parsePriceValue(minPrice);
    const parsedMaxPrice = parsePriceValue(maxPrice);
    const sliderMin = Number.isFinite(parsedMinPrice) ? clampPriceValue(parsedMinPrice) : PRICE_RANGE_MIN;
    const sliderMax = Number.isFinite(parsedMaxPrice)
      ? clampPriceValue(Math.max(parsedMaxPrice, sliderMin))
      : Math.max(sliderMin, PRICE_RANGE_MIN * 5);

    const updatePriceRange = (nextMin, nextMax) => {
      const clampedMin = clampPriceValue(nextMin);
      const clampedMax = clampPriceValue(Math.max(nextMax, clampedMin));
      updateServiceField(serviceKey, "averagePriceMin", String(clampedMin));
      updateServiceField(serviceKey, "averagePriceMax", String(clampedMax));
    };

    return (
      <div className="space-y-6">
        <StepHeader
          title={`What Is Your Average Project Price Range For ${getServiceLabel(serviceKey)}?`}
          subtitle={renderServiceMeta(serviceKey)}
        />
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
          <div className="flex justify-between text-sm text-white/80">
            <span>{formatPriceLabel(sliderMin)}</span>
            <span>{formatPriceLabel(sliderMax)}</span>
          </div>
          <Slider
            min={PRICE_RANGE_MIN}
            max={PRICE_RANGE_MAX}
            step={PRICE_RANGE_STEP}
            value={[sliderMin, sliderMax]}
            onValueChange={(values) => {
              if (!Array.isArray(values) || values.length < 2) return;
              updatePriceRange(values[0], values[1]);
            }}
          />
          <div className="flex justify-between text-xs text-white/45">
            <span>{formatPriceLabel(PRICE_RANGE_MIN)}</span>
            <span>{formatPriceLabel(PRICE_RANGE_MAX)}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs text-white/60 mb-2">Minimum Price</label>
            <Input
              type="number"
              value={minPrice}
              onChange={(e) => {
                const rawValue = e.target.value;
                if (!rawValue) {
                  updateServiceField(serviceKey, "averagePriceMin", "");
                  return;
                }

                const nextMin = parsePriceValue(rawValue);
                if (!Number.isFinite(nextMin)) return;

                const safeMin = clampPriceValue(nextMin);
                const currentMax = Number.isFinite(parsedMaxPrice)
                  ? clampPriceValue(parsedMaxPrice)
                  : safeMin;

                updatePriceRange(safeMin, Math.max(currentMax, safeMin));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && minPrice && maxPrice) {
                  e.preventDefault();
                  queueAdvance(0);
                }
              }}
              min={PRICE_RANGE_MIN}
              max={PRICE_RANGE_MAX}
              step={PRICE_RANGE_STEP}
              placeholder="e.g. 25000"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>
          <div className="flex items-end pb-2 text-white/40">to</div>
          <div className="flex-1">
            <label className="block text-xs text-white/60 mb-2">Maximum Price</label>
            <Input
              type="number"
              value={maxPrice}
              onChange={(e) => {
                const rawValue = e.target.value;
                if (!rawValue) {
                  updateServiceField(serviceKey, "averagePriceMax", "");
                  return;
                }

                const nextMax = parsePriceValue(rawValue);
                if (!Number.isFinite(nextMax)) return;

                const safeMax = clampPriceValue(nextMax);
                const currentMin = Number.isFinite(parsedMinPrice)
                  ? clampPriceValue(parsedMinPrice)
                  : PRICE_RANGE_MIN;

                updatePriceRange(Math.min(currentMin, safeMax), safeMax);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && minPrice && maxPrice) {
                  e.preventDefault();
                  queueAdvance(0);
                }
              }}
              min={PRICE_RANGE_MIN}
              max={PRICE_RANGE_MAX}
              step={PRICE_RANGE_STEP}
              placeholder="e.g. 75000"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>
        </div>
        {renderContinueButton()}
      </div>
    );
  };

  const renderServiceGroup = (serviceKey, groupId) => {
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

  const renderServiceIndustryFocus = (serviceKey) => (
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

  const renderServiceNiches = (serviceKey) => {
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

  const renderServiceIndustryOnly = (serviceKey) => (
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

  const renderServiceComplexity = (serviceKey) => (
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

  const renderDeliveryPolicy = () => (
    <div className="space-y-6">
      <StepHeader
        title="Do You Agree To Catalance Delivery & Revision SOP?"
        subtitle="Required To Continue"
      />
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
        <p className="text-white/70 text-sm">
          Catalance maintains standardized delivery and revision policies to ensure fairness, transparency, and dispute
          protection for both clients and freelancers.
        </p>
        <div className="space-y-2 text-sm text-white/70">
          <p>Up to 3 revisions included per milestone</p>
          <p>Scope changes handled through milestone modification SOP</p>
          <p>Final deliverables submitted through Catalance milestone system</p>
          <p>Reporting and updates follow platform workflow</p>
        </div>
      </div>
      <label className="flex items-center justify-center gap-3 text-white/70 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={formData.deliveryPolicyAccepted}
          onChange={(e) => updateFormField("deliveryPolicyAccepted", e.target.checked, 0)}
          className="h-5 w-5 rounded border-white/20 bg-white/10 text-primary focus:ring-primary/40"
        />
        <span>Yes (Required)</span>
      </label>
    </div>
  );

  const renderCommunicationPolicy = () => (
    <div className="space-y-6">
      <StepHeader
        title="Do You Agree To Catalance Communication Policy?"
        subtitle="Required To Continue"
      />
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
        <p className="text-white/70 text-sm">
          To ensure project transparency, client protection, and freelancer dispute coverage, all communication must remain
          within Catalance.
        </p>
        <div className="space-y-2 text-sm text-white/70">
          <p>All project discussions must remain inside Catalance</p>
          <p>External contact sharing is restricted during active projects</p>
          <p>Project updates must follow Catalance reporting SOP</p>
          <p>Freelancers must maintain response time within 12 hours</p>
        </div>
      </div>
      <label className="flex items-center justify-center gap-3 text-white/70 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={formData.communicationPolicyAccepted}
          onChange={(e) => updateFormField("communicationPolicyAccepted", e.target.checked, 0)}
          className="h-5 w-5 rounded border-white/20 bg-white/10 text-primary focus:ring-primary/40"
        />
        <span>Yes (Required)</span>
      </label>
    </div>
  );

  const renderAcceptInProgressProjects = () => (
    <div className="space-y-4">
      <StepHeader title="Do You Accept Projects That Are Already In Progress Or Partially Completed?" />
      <div className="space-y-3">
        {IN_PROGRESS_PROJECT_OPTIONS.map((option) => (
          <OptionCard
            key={option.value}
            selected={formData.acceptInProgressProjects === option.value}
            onClick={() => updateFormField("acceptInProgressProjects", option.value, 0)}
            label={option.label}
          />
        ))}
      </div>
    </div>
  );

  const renderBioStep = () => (
    <div className="space-y-6">
      <StepHeader
        title="Write A Short Professional Bio"
        subtitle="Keep It Concise And Professional"
      />
      <Textarea
        value={formData.professionalBio}
        onChange={(e) => updateFormField("professionalBio", e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && formData.professionalBio.trim()) {
            e.preventDefault();
            queueAdvance(0);
          }
        }}
        placeholder="Write 2-4 sentences about your experience, specialties, and the value you bring."
        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[160px] rounded-xl p-4"
      />
      <label className="flex items-start gap-3 text-white/70 text-sm cursor-pointer rounded-xl border border-white/10 bg-white/5 p-4">
        <input
          type="checkbox"
          checked={formData.termsAccepted}
          onChange={(e) => updateFormField("termsAccepted", e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/10 text-primary focus:ring-primary/40"
        />
        <span>Agree To The Terms & Conditions</span>
      </label>
      <p className="text-xs text-white/50 text-center">Tip: Press Ctrl+Enter or use Continue.</p>
      {renderContinueButton()}
    </div>
  );

  const renderOtpVerification = () => (
    <div className="space-y-6">
      <StepHeader title="Verify Your Email" subtitle={`We sent a code to ${formData.email}`} />
      <div>
        <Label className="text-white/70 text-sm">Verification Code</Label>
        <Input
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter 6-digit code"
          maxLength={6}
          className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-white/30 text-center text-2xl tracking-widest"
        />
      </div>
      {isSubmitting && (
        <div className="flex items-center justify-center gap-2 text-white/60 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Verifying...
        </div>
      )}
    </div>
  );

  const renderCurrentStep = () => {
    if (isVerifying) return renderOtpVerification();
    if (!currentStep) return null;

    switch (currentStep.type) {
      case "profileBasics":
        return renderProfileBasicsStep();
      case "professionalTitle":
        return renderProfessionalTitleStep();
      case "username":
        return renderUsernameStep();
      case "country":
        return renderCountryStep();
      case "city":
        return renderCityStep();
      case "profilePhoto":
        return renderProfilePhotoStep();
      case "languages":
        return renderLanguagesStep();
      case "linkedin":
        return renderLinkedinStep();
      case "portfolio":
        return renderPortfolioStep();
      case "role":
        return renderRoleStep();
      case "services":
        return renderServicesStep();
      case "serviceExperience":
        return renderServiceExperience(currentStep.serviceKey);
      case "serviceLevel":
        return renderServiceLevel(currentStep.serviceKey);
      case "serviceProjects":
        return renderServiceProjects(currentStep.serviceKey);
      case "serviceCaseField":
        return renderServiceCaseField(currentStep.serviceKey, currentStep.field);
      case "serviceSampleWork":
        return renderServiceSampleWork(currentStep.serviceKey);
      case "serviceSampleUpload":
        return renderServiceSampleUpload(currentStep.serviceKey);
      case "serviceGroup":
        return renderServiceGroup(currentStep.serviceKey, currentStep.groupId);
      case "serviceAveragePrice":
        return renderServiceAveragePrice(currentStep.serviceKey);
      case "serviceIndustryFocus":
        return renderServiceIndustryFocus(currentStep.serviceKey);
      case "serviceNiches":
        return renderServiceNiches(currentStep.serviceKey);
      case "serviceIndustryOnly":
        return renderServiceIndustryOnly(currentStep.serviceKey);
      case "serviceComplexity":
        return renderServiceComplexity(currentStep.serviceKey);
      case "deliveryPolicy":
        return renderDeliveryPolicy();
      case "hours":
        return renderSingleSelectStep({
          title: "How Many Hours Can You Dedicate Weekly?",
          options: HOURS_PER_WEEK_OPTIONS,
          value: formData.hoursPerWeek,
          onSelect: (value) => updateFormField("hoursPerWeek", value, 0),
        });
      case "workingSchedule":
        return renderSingleSelectStep({
          title: "Preferred Working Schedule",
          options: WORKING_SCHEDULE_OPTIONS,
          value: formData.workingSchedule,
          onSelect: (value) => updateFormField("workingSchedule", value, 0),
        });
      case "startTimeline":
        return renderSingleSelectStep({
          title: "When Can You Usually Start A New Project?",
          options: START_TIMELINE_OPTIONS,
          value: formData.startTimeline,
          onSelect: (value) => updateFormField("startTimeline", value, 0),
        });
      case "missedDeadlines":
        return renderSingleSelectStep({
          title: "Have You Ever Missed A Project Deadline?",
          options: DEADLINE_HISTORY_OPTIONS,
          value: formData.missedDeadlines,
          onSelect: (value) => updateFormField("missedDeadlines", value, 0),
        });
      case "delayHandling":
        return renderSingleSelectStep({
          title: "How Do You Handle Project Delays Or Blockers?",
          options: DELAY_HANDLING_OPTIONS,
          value: formData.delayHandling,
          onSelect: (value) => updateFormField("delayHandling", value, 0),
        });
      case "communicationPolicy":
        return renderCommunicationPolicy();
      case "acceptInProgressProjects":
        return renderAcceptInProgressProjects();
      case "bio":
        return renderBioStep();
      default:
        return null;
    }
  };

  return (
    <div className="h-screen w-full bg-zinc-950 text-white relative overflow-hidden flex flex-col font-sans selection:bg-primary/30">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: "4s" }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] mix-blend-screen" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a] border-b border-white/5 shadow-2xl shadow-black/50">
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/5 w-full">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out shadow-[0_0_10px_rgba(253,224,71,0.5)]"
              style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
            />
          </div>

          <div className="w-full px-6 h-16 relative flex items-center justify-center">
            {currentStepIndex > 0 && (
              <button
                onClick={handleBack}
                className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-all backdrop-blur-md z-20 group"
              >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
              </button>
            )}

            <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">
              Step {currentStepIndex + 1} of {totalSteps}
            </span>
          </div>
        </div>

        <div className="relative h-full overflow-y-auto w-full custom-scrollbar">
          <div className="max-w-4xl mx-auto px-6 pt-24 pb-36 min-h-full flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={isVerifying ? "verify" : currentStep?.key}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full my-auto"
              >
                {renderCurrentStep()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreelancerMultiStepForm;
