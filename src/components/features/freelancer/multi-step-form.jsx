
"use client";

import React, { useMemo, useEffect, useRef, useState } from "react";
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
  Plus,
  X,
  Upload,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { cn } from "@/shared/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { signup, verifyOtp, updateProfile } from "@/shared/lib/api-client";
import { useAuth } from "@/shared/context/AuthContext";

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
  { value: "social_media_marketing", label: "Social Media Marketing", icon: Share2 },
  { value: "paid_advertising", label: "Paid Advertising / Performance Marketing", icon: TrendingUp },
  { value: "app_development", label: "App Development", icon: Smartphone },
  { value: "software_development", label: "Software Development", icon: Code },
  { value: "lead_generation", label: "Lead Generation", icon: Target },
  { value: "video_services", label: "Video Services", icon: Video },
  { value: "writing_content", label: "Writing & Content", icon: PenTool },
  { value: "customer_support", label: "Customer Support", icon: MessageCircle },
  { value: "influencer_marketing", label: "Influencer Marketing", icon: Star },
  { value: "ugc_marketing", label: "UGC Marketing", icon: Video },
  { value: "ai_automation", label: "AI Automation", icon: Bot },
  { value: "whatsapp_chatbot", label: "WhatsApp Chatbot", icon: MessageSquare },
  { value: "creative_design", label: "Creative & Design", icon: Palette },
  { value: "3d_modeling", label: "3D Modeling", icon: Box },
  { value: "cgi_videos", label: "CGI Video Services", icon: Film },
  { value: "crm_erp", label: "CRM & ERP Integrated Solutions", icon: BarChart3 },
  { value: "voice_agent", label: "Voice Agent", icon: Mic },
];
const EXPERIENCE_YEARS_OPTIONS = [
  { value: "less_than_1", label: "< 1 year" },
  { value: "1_3", label: "1-3" },
  { value: "3_5", label: "3-5" },
  { value: "5_plus", label: "5+" },
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

const YES_NO_OPEN_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "open", label: "Open to All" },
];

const TOOLS_BY_SERVICE = {
  branding: ["Adobe Illustrator", "Adobe Photoshop", "Figma", "Canva", "Adobe InDesign", "Sketch"],
  website_ui_ux: ["Next.js", "Wordpress", "Shopify", "Framer", "Figma", "Webflow"],
  seo: ["Ahrefs", "SEMrush", "Google Search Console", "Moz", "Yoast SEO", "Ubersuggest"],
  social_media_marketing: ["Hootsuite", "Buffer", "Canva", "Meta Business Suite", "Later", "Sprout Social"],
  paid_advertising: ["Google Ads", "Facebook Ads Manager", "Google Analytics", "TikTok Ads", "LinkedIn Ads", "Hotjar"],
  app_development: ["React Native", "Flutter", "Swift", "Kotlin", "Firebase", "Expo"],
  software_development: ["Python", "JavaScript", "Node.js", "React", "AWS", "Docker"],
  lead_generation: ["Apollo.io", "LinkedIn Sales Navigator", "HubSpot", "ZoomInfo", "Hunter.io", "Lusha"],
  video_services: ["Adobe Premiere Pro", "Final Cut Pro", "DaVinci Resolve", "After Effects", "CapCut", "Filmora"],
  writing_content: ["Google Docs", "Grammarly", "Notion", "WordPress", "ChatGPT", "Jasper AI"],
  customer_support: ["Zendesk", "Freshdesk", "Intercom", "HubSpot", "LiveChat", "Crisp"],
  influencer_marketing: ["Instagram", "TikTok", "YouTube Studio", "Upfluence", "CreatorIQ", "Grin"],
  ugc_marketing: ["Instagram", "TikTok", "Canva", "CapCut", "YouTube Studio", "InShot"],
  ai_automation: ["Zapier", "Make (Integromat)", "ChatGPT API", "Python", "n8n", "LangChain"],
  whatsapp_chatbot: ["WhatsApp Business API", "ManyChat", "Twilio", "Wati", "Respond.io", "Chatfuel"],
  creative_design: ["Figma", "Adobe Photoshop", "Adobe Illustrator", "Canva", "Procreate", "Sketch"],
  "3d_modeling": ["Blender", "Maya", "Cinema 4D", "3ds Max", "SketchUp", "ZBrush"],
  cgi_videos: ["Blender", "After Effects", "Cinema 4D", "Unreal Engine", "DaVinci Resolve", "Houdini"],
  crm_erp: ["Salesforce", "HubSpot", "Zoho CRM", "Pipedrive", "Microsoft Dynamics", "Freshsales"],
  voice_agent: ["Twilio", "Dialogflow", "VoiceFlow", "VAPI", "Amazon Connect", "Retell AI"],
};

const SPECIALIZATION_BY_SERVICE = {
  branding: ["Brand Strategy", "Visual Identity", "Logo Design", "Brand Guidelines", "Rebranding"],
  website_ui_ux: ["Landing Pages", "E-commerce", "Web Apps", "Portfolio Sites", "Performance Optimization", "Accessibility"],
  seo: ["On Page SEO", "Off Page SEO", "Technical SEO", "Local SEO", "E-commerce SEO"],
  social_media_marketing: ["Content Strategy", "Community Management", "Paid Social", "Influencer Outreach", "Analytics"],
  paid_advertising: ["Search Ads", "Social Ads", "Display Ads", "Retargeting", "Conversion Optimization"],
  app_development: ["iOS", "Android", "Cross-platform", "Backend Integration", "App Store Optimization"],
  software_development: ["Web Apps", "APIs", "Integrations", "DevOps", "QA & Testing"],
  lead_generation: ["Prospecting", "Email Outreach", "CRM Management", "Pipeline Optimization", "Data Enrichment"],
  video_services: ["Video Editing", "Motion Graphics", "Storyboarding", "Color Grading", "Sound Design"],
  writing_content: ["Blog Writing", "Copywriting", "Technical Writing", "Editing", "Content Strategy"],
  customer_support: ["Live Chat", "Email Support", "Ticketing", "Knowledge Base", "QA & Training"],
  influencer_marketing: ["Campaign Strategy", "Creator Outreach", "Contracting", "Reporting", "UGC Curation"],
  ugc_marketing: ["UGC Scripting", "Creator Management", "Video Editing", "Ads Iteration", "Performance Testing"],
  ai_automation: ["Workflow Automation", "Chatbots", "API Integrations", "Data Pipelines", "Prompt Engineering"],
  whatsapp_chatbot: ["Bot Flow Design", "API Integrations", "CRM Sync", "Conversation Templates", "Testing"],
  creative_design: ["Graphic Design", "UI Design", "Illustrations", "Presentation Design", "Marketing Collateral"],
  "3d_modeling": ["Modeling", "Texturing", "Lighting", "Rendering", "Rigging"],
  cgi_videos: ["Storyboarding", "Simulation", "Lighting", "Rendering", "Compositing"],
  crm_erp: ["Requirements Mapping", "Implementation", "Data Migration", "Customization", "Training"],
  voice_agent: ["Voice Flow Design", "NLU Tuning", "Integration", "Testing", "Monitoring"],
};

const DEFAULT_SPECIALIZATIONS = ["Strategy", "Implementation", "Optimization", "Audits", "Maintenance"];
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

const WORKING_MODE_OPTIONS = [
  { value: "fixed_daily", label: "Fixed daily hours" },
  { value: "flexible", label: "Flexible hours" },
  { value: "on_demand", label: "On-demand (as needed)" },
];

const WORKING_SCHEDULE_OPTIONS = [
  { value: "fixed", label: "Fixed Hours" },
  { value: "flexible", label: "Flexible" },
  { value: "on_demand", label: "On Demand" },
];

const START_TIMELINE_OPTIONS = [
  { value: "immediately", label: "Immediately" },
  { value: "within_3_5_days", label: "Within 3-5 days" },
  { value: "after_1_week", label: "After 1 week" },
];

const PROJECT_TYPE_OPTIONS = [
  { value: "short_term", label: "Short-term" },
  { value: "long_term", label: "Long-term" },
  { value: "one_time", label: "One-time tasks" },
];

const EXECUTION_STYLE_OPTIONS = [
  { value: "standard", label: "Standard workflow / checklist-based" },
  { value: "custom", label: "Custom strategy per client" },
  { value: "client_provided", label: "Client-provided strategy" },
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

const CURRENT_AVAILABILITY_OPTIONS = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "project_based", label: "Project-based" },
];

const LONG_TERM_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const CASE_STUDY_FIELDS = [
  { key: "projectName", label: "Enter project name", placeholder: "Project name" },
  { key: "industry", label: "Which industry was this project for?", placeholder: "Industry" },
  { key: "goal", label: "What was the main project goal?", placeholder: "Primary goal" },
  { key: "roleScope", label: "What was your role and scope?", placeholder: "Role and scope" },
  { key: "techStack", label: "Which tech stack did you use?", placeholder: "Tech stack" },
  { key: "timeline", label: "What was the project timeline?", placeholder: "e.g. 6 weeks" },
  { key: "outcomes", label: "What results or outcomes did you achieve?", placeholder: "e.g. Increased conversions by 20%", multiline: true },
];
const ALL_TOOLS_SUGGESTIONS = [
  ...new Set([
    ...Object.values(TOOLS_BY_SERVICE).flat(),
    "Jira", "Asana", "Trello", "Slack", "Microsoft Teams", "Discord",
    "Zoom", "Google Meet", "Tableau", "Power BI", "Looker",
    "Snowflake", "Databricks", "Redshift", "BigQuery",
    "Kubernetes", "Terraform", "Ansible", "Jenkins", "CircleCI",
    "GitLab", "GitHub", "Bitbucket", "Visual Studio Code", "IntelliJ IDEA",
    "Sublime Text", "Atom", "Eclipse", "NetBeans", "Android Studio",
    "Xcode", "Unity", "Unreal Engine", "Godot", "CryEngine",
    "Blender", "Maya", "3ds Max", "Cinema 4D", "ZBrush",
    "Houdini", "SketchUp", "Rhino", "SolidWorks", "AutoCAD",
    "Revit", "Fusion 360", "Inventor", "ArchiCAD", "Vectorworks",
    "Adobe Creative Cloud", "CorelDRAW", "Affinity Designer", "Affinity Photo", "GIMP",
    "Inkscape", "DaVinci Resolve", "Final Cut Pro", "Adobe Premiere Pro", "After Effects",
    "Audacity", "Adobe Audition", "Logic Pro", "Pro Tools", "FL Studio",
    "Ableton Live", "GarageBand", "Cubase", "Nuendo", "Studio One",
    "WordPress", "Shopify", "Wix", "Squarespace", "Webflow",
    "Magento", "WooCommerce", "BigCommerce", "PrestaShop", "Joomla",
    "Drupal", "Salesforce", "HubSpot", "Zoho", "Pipedrive",
    "Mailchimp", "Constant Contact", "Sendinblue", "ConvertKit", "AWeber",
    "Google Analytics", "Google Search Console", "SEMrush", "Ahrefs", "Moz",
    "Yoast SEO", "Screaming Frog", "Ubersuggest", "SpyFu", "Majestic",
    "Facebook Ads", "Google Ads", "LinkedIn Ads", "Twitter Ads", "Pinterest Ads",
    "TikTok Ads", "Snapchat Ads", "Bing Ads", "AdRoll", "Taboola",
    "Outbrain", "Criteo", "Amazon Advertising", "Walmart Connect", "eBay Ads",
    "Python", "JavaScript", "Java", "C++", "C#",
    "Ruby", "PHP", "Swift", "Kotlin", "Go",
    "Rust", "TypeScript", "Scala", "Perl", "Lua",
    "R", "Matlab", "SAS", "SPSS", "Stata",
    "Excel", "Google Sheets", "Airtable", "Notion", "Coda",
    "Zapier", "Make", "n8n", "IFTTT", "Power Automate"
  ])
].sort();

const createServiceDetail = () => ({
  experienceYears: "",
  workingLevel: "",
  hasPreviousProjects: "",
  caseStudy: {
    projectName: "",
    industry: "",
    goal: "",
    roleScope: "",
    techStack: "",
    timeline: "",
    budgetRange: "",
    outcomes: "",
  },
  hasSampleWork: "",
  sampleWork: null,
  averagePrice: "",
  preferredBudget: "",
  specializations: [],
  industryFocus: "",
  niches: [],
  otherNiche: "",
  industryExperience: "",
  preferOnlyIndustries: "",
  tools: [],
  customTools: [],
});

const getServiceLabel = (serviceKey) => {
  const match = SERVICE_OPTIONS.find((option) => option.value === serviceKey);
  return match ? match.label : serviceKey;
};

const getServiceLimit = (role) => SERVICE_LIMITS[role] || 3;

const getServiceSpecializations = (serviceKey) =>
  SPECIALIZATION_BY_SERVICE[serviceKey] || DEFAULT_SPECIALIZATIONS;

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const StepHeader = ({ title, subtitle }) => (
  <div className="mb-8 text-center px-4">
    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
      {title}
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
  const [toolInputs, setToolInputs] = useState({});

  const [formData, setFormData] = useState({
    role: "",
    selectedServices: [],
    serviceDetails: {},
    deliveryPolicyAccepted: false,
    hoursPerWeek: "",
    workingMode: "",
    workingSchedule: "",
    startTimeline: "",
    projectTypePreference: "",
    executionStyle: "",
    missedDeadlines: "",
    delayHandling: "",
    currentAvailability: "",
    communicationPolicyAccepted: false,
    openToLongTerm: "",
    professionalBio: "",
    fullName: "",
    email: "",
    password: "",
  });

  const advanceTimerRef = useRef(null);
  const [pendingAdvance, setPendingAdvance] = useState(false);

  const steps = useMemo(() => {
    const sequence = [];

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
        sequence.push({ key: `svc-${serviceKey}-case-budget`, type: "serviceCaseBudget", serviceKey });
      }

      if (detail?.hasPreviousProjects === "no") {
        sequence.push({ key: `svc-${serviceKey}-sample-work`, type: "serviceSampleWork", serviceKey });
        if (detail?.hasSampleWork === "yes") {
          sequence.push({ key: `svc-${serviceKey}-sample-upload`, type: "serviceSampleUpload", serviceKey });
        }
      }

      sequence.push({ key: `svc-${serviceKey}-avg-price`, type: "serviceAveragePrice", serviceKey });
      sequence.push({ key: `svc-${serviceKey}-preferred-budget`, type: "servicePreferredBudget", serviceKey });
      sequence.push({ key: `svc-${serviceKey}-specializations`, type: "serviceSpecializations", serviceKey });
      sequence.push({ key: `svc-${serviceKey}-industry-focus`, type: "serviceIndustryFocus", serviceKey });

      if (detail?.industryFocus === "yes") {
        sequence.push({ key: `svc-${serviceKey}-niches`, type: "serviceNiches", serviceKey });
        sequence.push({ key: `svc-${serviceKey}-industry-exp`, type: "serviceIndustryExperience", serviceKey });
        sequence.push({ key: `svc-${serviceKey}-industry-only`, type: "serviceIndustryOnly", serviceKey });
      }

      sequence.push({ key: `svc-${serviceKey}-tools`, type: "serviceTools", serviceKey });
    });

    sequence.push({ key: "delivery-policy", type: "deliveryPolicy" });

    sequence.push({ key: "hours", type: "hours" });
    sequence.push({ key: "working-mode", type: "workingMode" });
    sequence.push({ key: "working-schedule", type: "workingSchedule" });
    sequence.push({ key: "start-timeline", type: "startTimeline" });
    sequence.push({ key: "project-type", type: "projectType" });
    sequence.push({ key: "execution-style", type: "executionStyle" });
    sequence.push({ key: "missed-deadlines", type: "missedDeadlines" });
    sequence.push({ key: "delay-handling", type: "delayHandling" });
    sequence.push({ key: "current-availability", type: "currentAvailability" });

    sequence.push({ key: "communication-policy", type: "communicationPolicy" });

    sequence.push({ key: "open-long-term", type: "openLongTerm" });
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
    if (!isVerifying) return;
    if (otp.length === 6 && !isSubmitting) {
      handleVerifyOtp();
    }
  }, [otp, isVerifying, isSubmitting]);

  useEffect(() => {
    if (!pendingAdvance) return;
    setPendingAdvance(false);

    if (!currentStep) return;
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
    advanceTimerRef.current = setTimeout(() => {
      setPendingAdvance(true);
    }, delay);
  };

  const handleBack = () => {
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
              ...details.caseStudy,
              [field]: value,
            },
          },
        },
      };
    });
    if (stepError) setStepError("");
    if (advanceDelay !== null) queueAdvance(advanceDelay);
  };

  const toggleServiceArrayField = (serviceKey, field, value, advanceDelay = 650) => {
    const details = formData.serviceDetails?.[serviceKey] || createServiceDetail();
    const current = Array.isArray(details[field]) ? details[field] : [];
    const exists = current.includes(value);
    const nextValues = exists ? current.filter((item) => item !== value) : [...current, value];

    updateServiceField(serviceKey, field, nextValues, null);

    if (nextValues.length > 0) {
      queueAdvance(advanceDelay);
    }
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
    if (next.length > 0) {
      queueAdvance(700);
    }
  };

  const validateStep = (step, data) => {
    if (!step) return "";

    const detail = step.serviceKey ? data.serviceDetails?.[step.serviceKey] : null;

    switch (step.type) {
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
        return detail?.caseStudy?.[step.field.key]?.trim()
          ? ""
          : "Please fill out this field.";
      case "serviceCaseBudget":
        return detail?.caseStudy?.budgetRange ? "" : "Please select a budget range.";
      case "serviceSampleWork":
        return detail?.hasSampleWork ? "" : "Please select an option.";
      case "serviceSampleUpload":
        return detail?.sampleWork ? "" : "Please upload a sample or practice work.";
      case "serviceAveragePrice":
        return detail?.averagePrice ? "" : "Please enter your average project price.";
      case "servicePreferredBudget":
        return detail?.preferredBudget ? "" : "Please select a preferred budget range.";
      case "serviceSpecializations":
        return detail?.specializations?.length ? "" : "Please select at least one specialization.";
      case "serviceIndustryFocus":
        return detail?.industryFocus ? "" : "Please select an option.";
      case "serviceNiches":
        if (!detail?.niches?.length) return "Please select at least one niche.";
        if (detail.niches.includes("Other") && !detail.otherNiche.trim()) {
          return "Please specify your other niche.";
        }
        return "";
      case "serviceIndustryExperience":
        return detail?.industryExperience ? "" : "Please select your industry experience.";
      case "serviceIndustryOnly":
        return detail?.preferOnlyIndustries ? "" : "Please select an option.";
      case "serviceTools": {
        const tools = detail?.tools || [];
        const custom = detail?.customTools || [];
        return tools.length || custom.length
          ? ""
          : "Please select or add at least one tool.";
      }
      case "deliveryPolicy":
        return data.deliveryPolicyAccepted ? "" : "Please accept the delivery and revision policy.";
      case "hours":
        return data.hoursPerWeek ? "" : "Please select weekly availability.";
      case "workingMode":
        return data.workingMode ? "" : "Please select a working mode.";
      case "workingSchedule":
        return data.workingSchedule ? "" : "Please select a working schedule.";
      case "startTimeline":
        return data.startTimeline ? "" : "Please select when you can start.";
      case "projectType":
        return data.projectTypePreference ? "" : "Please select a project type.";
      case "executionStyle":
        return data.executionStyle ? "" : "Please select how you execute projects.";
      case "missedDeadlines":
        return data.missedDeadlines ? "" : "Please select your deadline history.";
      case "delayHandling":
        return data.delayHandling ? "" : "Please select how you handle delays.";
      case "currentAvailability":
        return data.currentAvailability ? "" : "Please select your current availability.";
      case "communicationPolicy":
        return data.communicationPolicyAccepted ? "" : "Please accept the communication policy.";
      case "openLongTerm":
        return data.openToLongTerm ? "" : "Please select an option.";
      case "bio":
        return data.professionalBio.trim() ? "" : "Please write a short professional bio.";
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
      const freelancerProfile = {
        role: formData.role,
        services: formData.selectedServices,
        serviceDetails: formData.serviceDetails,
        deliveryPolicyAccepted: formData.deliveryPolicyAccepted,
        availability: {
          hoursPerWeek: formData.hoursPerWeek,
          workingMode: formData.workingMode,
          workingSchedule: formData.workingSchedule,
          startTimeline: formData.startTimeline,
          projectTypePreference: formData.projectTypePreference,
          executionStyle: formData.executionStyle,
          missedDeadlines: formData.missedDeadlines,
          delayHandling: formData.delayHandling,
          currentAvailability: formData.currentAvailability,
        },
        communicationPolicyAccepted: formData.communicationPolicyAccepted,
        openToLongTerm: formData.openToLongTerm,
        professionalBio: formData.professionalBio,
      };

      if (user) {
        await updateProfile({
          profileDetails: freelancerProfile,
          bio: formData.professionalBio,
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
        bio: formData.professionalBio,
      });

      if (!authPayload?.accessToken) {
        setIsVerifying(true);
        setIsSubmitting(false);
        toast.success("Verification code sent to your email!");
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
    const index = formData.selectedServices.indexOf(serviceKey);
    const label = getServiceLabel(serviceKey);
    return `Service ${index + 1} of ${formData.selectedServices.length}: ${label}`;
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

  const renderMultiSelectStep = ({ title, subtitle, options, values, onToggle, columns = 2 }) => (
    <div className="space-y-4">
      <StepHeader title={title} subtitle={subtitle} />
      <div className={cn("grid gap-3", columns === 2 && "grid-cols-2", columns === 3 && "grid-cols-3")}> 
        {options.map((option) => (
          <OptionCard
            key={option.value || option}
            compact
            selected={values.includes(option.value || option)}
            onClick={() => onToggle(option.value || option)}
            label={option.label || option}
            className="justify-center"
          />
        ))}
      </div>
    </div>
  );

  const renderRoleStep = () => (
    <div className="space-y-4">
      <StepHeader title="How do you want to work on Catalance?" />
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
    return (
      <div className="space-y-6">
        <StepHeader
          title="Which services do you want to offer?"
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
      </div>
    );
  };

  const renderServiceExperience = (serviceKey) => (
    <div className="space-y-4">
      <StepHeader
        title={`Years of experience in ${getServiceLabel(serviceKey)}?`}
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
        title={`Working level for ${getServiceLabel(serviceKey)}?`}
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
        title={`Do you have previous projects in ${getServiceLabel(serviceKey)}?`}
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
    const value = formData.serviceDetails?.[serviceKey]?.caseStudy?.[field.key] || "";
    return (
      <div className="space-y-6">
        <StepHeader title={field.label} subtitle={renderServiceMeta(serviceKey)} />
        {field.multiline ? (
          <Textarea
            value={value}
            onChange={(e) => updateServiceCaseField(serviceKey, field.key, e.target.value)}
            onBlur={() => value.trim() && queueAdvance(0)}
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
            onBlur={() => value.trim() && queueAdvance(0)}
            placeholder={field.placeholder}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        )}
      </div>
    );
  };

  const renderServiceCaseBudget = (serviceKey) => (
    <div className="space-y-6">
      <StepHeader
        title="What was the project budget range?"
        subtitle={renderServiceMeta(serviceKey)}
      />
      <Select
        value={formData.serviceDetails?.[serviceKey]?.caseStudy?.budgetRange || ""}
        onValueChange={(value) => updateServiceCaseField(serviceKey, "budgetRange", value, 0)}
      >
        <SelectTrigger className="w-full bg-white/5 border-white/10 text-white p-6 rounded-xl">
          <SelectValue placeholder="Select budget range" />
        </SelectTrigger>
        <SelectContent className="bg-[#1A1A1A] border-white/10 text-white max-h-[300px]">
          {BUDGET_RANGE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="focus:bg-white/10 focus:text-white cursor-pointer">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const renderServiceSampleWork = (serviceKey) => (
    <div className="space-y-4">
      <StepHeader
        title="Do you have sample or practice work to showcase?"
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
        <StepHeader title="Upload your sample or practice work" subtitle={renderServiceMeta(serviceKey)} />
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
      </div>
    );
  };

  const renderServiceAveragePrice = (serviceKey) => (
    <div className="space-y-6">
      <StepHeader
        title={`What is your average project price for ${getServiceLabel(serviceKey)}?`}
        subtitle={renderServiceMeta(serviceKey)}
      />
      <Input
        value={formData.serviceDetails?.[serviceKey]?.averagePrice || ""}
        onChange={(e) => updateServiceField(serviceKey, "averagePrice", e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.currentTarget.value.trim()) {
            e.preventDefault();
            queueAdvance(0);
          }
        }}
        onBlur={(e) => e.target.value.trim() && queueAdvance(0)}
        placeholder="e.g. INR 50,000"
        className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
      />
    </div>
  );

  const renderServicePreferredBudget = (serviceKey) => (
    <div className="space-y-6">
      <StepHeader
        title="What budget projects do you prefer to work on next?"
        subtitle={renderServiceMeta(serviceKey)}
      />
      <Select
        value={formData.serviceDetails?.[serviceKey]?.preferredBudget || ""}
        onValueChange={(value) => updateServiceField(serviceKey, "preferredBudget", value, 0)}
      >
        <SelectTrigger className="w-full bg-white/5 border-white/10 text-white p-6 rounded-xl">
          <SelectValue placeholder="Select preferred budget range" />
        </SelectTrigger>
        <SelectContent className="bg-[#1A1A1A] border-white/10 text-white max-h-[300px]">
          {BUDGET_RANGE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="focus:bg-white/10 focus:text-white cursor-pointer">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const renderServiceSpecializations = (serviceKey) => {
    const options = getServiceSpecializations(serviceKey).map((item) => ({ value: item, label: item }));
    const values = formData.serviceDetails?.[serviceKey]?.specializations || [];

    return renderMultiSelectStep({
      title: `Which areas of ${getServiceLabel(serviceKey)} do you specialize in?`,
      subtitle: renderServiceMeta(serviceKey),
      options,
      values,
      onToggle: (value) => toggleServiceArrayField(serviceKey, "specializations", value, 650),
      columns: 2,
    });
  };

  const renderServiceIndustryFocus = (serviceKey) => (
    <div className="space-y-4">
      <StepHeader
        title={`Do you specialize in specific industries for ${getServiceLabel(serviceKey)}?`}
        subtitle={renderServiceMeta(serviceKey)}
      />
      <div className="space-y-3">
        {YES_NO_OPEN_OPTIONS.map((option) => (
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
    const handleNicheToggle = (option) => {
      const details = formData.serviceDetails?.[serviceKey] || createServiceDetail();
      const current = Array.isArray(details.niches) ? details.niches : [];
      const exists = current.includes(option);
      const nextValues = exists ? current.filter((item) => item !== option) : [...current, option];
      updateServiceField(serviceKey, "niches", nextValues, null);

      const hasOther = nextValues.includes("Other");
      const hasOtherValue = details.otherNiche?.trim();
      if (nextValues.length > 0 && (!hasOther || hasOtherValue)) {
        queueAdvance(650);
      }
    };

    return (
      <div className="space-y-6">
        <StepHeader
          title="Which niches do you specialize in?"
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
              onBlur={() => otherValue.trim() && queueAdvance(0)}
              placeholder="Type your niche"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>
        )}
      </div>
    );
  };

  const renderServiceIndustryExperience = (serviceKey) => (
    <div className="space-y-4">
      <StepHeader
        title="How experienced are you in your selected industries?"
        subtitle={renderServiceMeta(serviceKey)}
      />
      <div className="space-y-3">
        {[
          { value: "beginner", label: "Beginner" },
          { value: "experienced", label: "Experienced" },
          { value: "specialist", label: "Specialist" },
        ].map((option) => (
          <OptionCard
            key={option.value}
            selected={formData.serviceDetails?.[serviceKey]?.industryExperience === option.value}
            onClick={() => updateServiceField(serviceKey, "industryExperience", option.value, 0)}
            label={option.label}
          />
        ))}
      </div>
    </div>
  );

  const renderServiceIndustryOnly = (serviceKey) => (
    <div className="space-y-4">
      <StepHeader
        title="Do you prefer working ONLY in these industries?"
        subtitle={renderServiceMeta(serviceKey)}
      />
      <div className="space-y-3">
        {YES_NO_OPEN_OPTIONS.map((option) => (
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

  const renderServiceTools = (serviceKey) => {
    const tools = TOOLS_BY_SERVICE[serviceKey] || [];
    const selected = formData.serviceDetails?.[serviceKey]?.tools || [];
    const custom = formData.serviceDetails?.[serviceKey]?.customTools || [];
    const inputValue = toolInputs[serviceKey] || "";

    return (
      <div className="space-y-6">
        <StepHeader
          title={`Which tools do you actively use for ${getServiceLabel(serviceKey)}?`}
          subtitle={renderServiceMeta(serviceKey)}
        />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {tools.map((tool) => {
            const isSelected = selected.includes(tool);
            return (
              <motion.button
                layout
                key={tool}
                type="button"
                onClick={() => {
                  const nextValues = isSelected
                    ? selected.filter((item) => item !== tool)
                    : [...selected, tool];
                  updateServiceField(serviceKey, "tools", nextValues);
                  if (nextValues.length || custom.length) {
                    queueAdvance(650);
                  }
                }}
                className={cn(
                  "group flex items-center justify-between px-4 py-4 rounded-xl border transition-all duration-200",
                  isSelected
                    ? "border-primary/50 bg-primary/5 text-primary shadow-sm shadow-primary/10"
                    : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:border-white/20 hover:text-white"
                )}
              >
                <span className="text-sm font-medium text-left truncate">{tool}</span>
                {isSelected && <Check className="w-4 h-4 text-primary shrink-0 ml-2" />}
              </motion.button>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
              <Plus className="w-3.5 h-3.5 text-white/60" />
            </div>
            <span className="text-white/80 text-sm font-medium">Add your own tools</span>
          </div>
          <div className="relative group/input">
            <Input
              type="text"
              placeholder="Type a tool name and press Enter"
              value={inputValue}
              onChange={(e) =>
                setToolInputs((prev) => ({
                  ...prev,
                  [serviceKey]: e.target.value,
                }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && inputValue.trim()) {
                  e.preventDefault();
                  const val = inputValue.trim();
                  if (!custom.includes(val)) {
                    updateServiceField(serviceKey, "customTools", [...custom, val]);
                  }
                  setToolInputs((prev) => ({ ...prev, [serviceKey]: "" }));
                  queueAdvance(650);
                }
              }}
              className="bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 pr-20"
            />
            {inputValue && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40 pointer-events-none">
                Press Enter
              </span>
            )}

            {inputValue && (
              <div className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto bg-[#1A1A1A] border border-white/10 rounded-lg shadow-xl">
                {ALL_TOOLS_SUGGESTIONS.filter(
                  (tool) =>
                    tool.toLowerCase().includes(inputValue.toLowerCase()) &&
                    !custom.includes(tool)
                )
                  .slice(0, 5)
                  .map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        if (!custom.includes(suggestion)) {
                          updateServiceField(serviceKey, "customTools", [...custom, suggestion]);
                        }
                        setToolInputs((prev) => ({ ...prev, [serviceKey]: "" }));
                        queueAdvance(650);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-white/80 hover:bg-white/5 hover:text-primary transition-colors flex items-center gap-2"
                    >
                      <Sparkles className="w-3 h-3 opacity-50" />
                      {suggestion}
                    </button>
                  ))}
              </div>
            )}
          </div>
          {(custom || []).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {custom.map((tool) => (
                <motion.div
                  key={tool}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="group flex items-center gap-1.5 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg text-sm text-primary hover:bg-primary/10 hover:border-primary/40 transition-all"
                >
                  <span className="font-medium">{tool}</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateServiceField(
                        serviceKey,
                        "customTools",
                        custom.filter((item) => item !== tool)
                      )
                    }
                    className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-primary/60 hover:bg-primary/20 hover:text-primary transition-colors ml-1"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDeliveryPolicy = () => (
    <div className="space-y-6">
      <StepHeader
        title="Delivery & Revision Policy"
        subtitle="Please review and accept the standard policy"
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
        <span>I accept the delivery and revision policy</span>
      </label>
    </div>
  );

  const renderCommunicationPolicy = () => (
    <div className="space-y-6">
      <StepHeader
        title="Communication Policy"
        subtitle="Mandatory platform governance"
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
        <span>I accept the communication policy</span>
      </label>
    </div>
  );

  const renderBioStep = () => (
    <div className="space-y-6">
      <StepHeader
        title="Write a short professional bio about yourself"
        subtitle="Keep it concise and professional"
      />
      <Textarea
        value={formData.professionalBio}
        onChange={(e) => updateFormField("professionalBio", e.target.value)}
        onBlur={() => formData.professionalBio.trim() && queueAdvance(0)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && formData.professionalBio.trim()) {
            e.preventDefault();
            queueAdvance(0);
          }
        }}
        placeholder="Write 2-4 sentences about your experience, specialties, and the value you bring."
        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[160px] rounded-xl p-4"
      />
      <p className="text-xs text-white/50 text-center">Tip: Press Ctrl+Enter or click outside to continue.</p>
    </div>
  );

  const renderOtpVerification = () => (
    <div className="space-y-6">
      <StepHeader title="Verify your email" subtitle={`We sent a code to ${formData.email}`} />
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
      case "serviceCaseBudget":
        return renderServiceCaseBudget(currentStep.serviceKey);
      case "serviceSampleWork":
        return renderServiceSampleWork(currentStep.serviceKey);
      case "serviceSampleUpload":
        return renderServiceSampleUpload(currentStep.serviceKey);
      case "serviceAveragePrice":
        return renderServiceAveragePrice(currentStep.serviceKey);
      case "servicePreferredBudget":
        return renderServicePreferredBudget(currentStep.serviceKey);
      case "serviceSpecializations":
        return renderServiceSpecializations(currentStep.serviceKey);
      case "serviceIndustryFocus":
        return renderServiceIndustryFocus(currentStep.serviceKey);
      case "serviceNiches":
        return renderServiceNiches(currentStep.serviceKey);
      case "serviceIndustryExperience":
        return renderServiceIndustryExperience(currentStep.serviceKey);
      case "serviceIndustryOnly":
        return renderServiceIndustryOnly(currentStep.serviceKey);
      case "serviceTools":
        return renderServiceTools(currentStep.serviceKey);
      case "deliveryPolicy":
        return renderDeliveryPolicy();
      case "hours":
        return renderSingleSelectStep({
          title: "How many hours can you dedicate per week?",
          options: HOURS_PER_WEEK_OPTIONS,
          value: formData.hoursPerWeek,
          onSelect: (value) => updateFormField("hoursPerWeek", value, 0),
        });
      case "workingMode":
        return renderSingleSelectStep({
          title: "What is your preferred working mode?",
          options: WORKING_MODE_OPTIONS,
          value: formData.workingMode,
          onSelect: (value) => updateFormField("workingMode", value, 0),
        });
      case "workingSchedule":
        return renderSingleSelectStep({
          title: "What is your preferred working schedule?",
          options: WORKING_SCHEDULE_OPTIONS,
          value: formData.workingSchedule,
          onSelect: (value) => updateFormField("workingSchedule", value, 0),
        });
      case "startTimeline":
        return renderSingleSelectStep({
          title: "When can you usually start a new project?",
          options: START_TIMELINE_OPTIONS,
          value: formData.startTimeline,
          onSelect: (value) => updateFormField("startTimeline", value, 0),
        });
      case "projectType":
        return renderSingleSelectStep({
          title: "What type of projects do you prefer?",
          options: PROJECT_TYPE_OPTIONS,
          value: formData.projectTypePreference,
          onSelect: (value) => updateFormField("projectTypePreference", value, 0),
        });
      case "executionStyle":
        return renderSingleSelectStep({
          title: "How do you typically execute projects?",
          options: EXECUTION_STYLE_OPTIONS,
          value: formData.executionStyle,
          onSelect: (value) => updateFormField("executionStyle", value, 0),
        });
      case "missedDeadlines":
        return renderSingleSelectStep({
          title: "Have you ever missed a project deadline?",
          options: DEADLINE_HISTORY_OPTIONS,
          value: formData.missedDeadlines,
          onSelect: (value) => updateFormField("missedDeadlines", value, 0),
        });
      case "delayHandling":
        return renderSingleSelectStep({
          title: "How do you handle project delays or blockers?",
          options: DELAY_HANDLING_OPTIONS,
          value: formData.delayHandling,
          onSelect: (value) => updateFormField("delayHandling", value, 0),
        });
      case "currentAvailability":
        return renderSingleSelectStep({
          title: "Current availability?",
          options: CURRENT_AVAILABILITY_OPTIONS,
          value: formData.currentAvailability,
          onSelect: (value) => updateFormField("currentAvailability", value, 0),
        });
      case "communicationPolicy":
        return renderCommunicationPolicy();
      case "openLongTerm":
        return renderSingleSelectStep({
          title: "Are you open to long-term or retainer-based work?",
          options: LONG_TERM_OPTIONS,
          value: formData.openToLongTerm,
          onSelect: (value) => updateFormField("openToLongTerm", value, 0),
        });
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
          <div className="max-w-6xl mx-auto px-6 py-24 min-h-full flex flex-col">
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
