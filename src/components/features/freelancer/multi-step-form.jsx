"use client";

import React, { useState, useMemo, useEffect } from "react";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/components/ui/button";
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

import { COUNTRY_CODES } from "@/shared/data/countryCodes";
import { API_BASE_URL, signup, verifyOtp, updateProfile } from "@/shared/lib/api-client";
import { useAuth } from "@/shared/context/AuthContext";

// ============================================================================
// CONSTANTS & OPTIONS
// ============================================================================

const ROLE_OPTIONS = [
  { value: "individual", label: "Individual Freelancer", icon: User, description: "Working independently on projects" },
  { value: "agency", label: "Agency / Studio", icon: Building2, description: "Team of professionals" },
  { value: "part_time", label: "Part-time Freelancer", icon: Clock, description: "Freelancing alongside other work" },
];

const SERVICE_OPTIONS = [
  { value: "branding", label: "Branding", icon: Sparkles },
  { value: "website_ui_ux", label: "Website / UI–UX Design", icon: Globe },
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
  { value: "less_than_1", label: "Less than 1 year" },
  { value: "1_3", label: "1–3 years" },
  { value: "3_5", label: "3–5 years" },
  { value: "5_plus", label: "5+ years" },
];

const WORKING_LEVEL_OPTIONS = [
  { value: "beginner", label: "Beginner", description: "Learning stage" },
  { value: "intermediate", label: "Intermediate", description: "Can handle projects independently" },
  { value: "advanced", label: "Advanced", description: "Can handle complex projects" },
];

const TOOLS_BY_SERVICE = {
  // Branding tools
  branding: ["Adobe Illustrator", "Adobe Photoshop", "Figma", "Canva", "Sketch", "Adobe InDesign", "Affinity Designer", "CorelDRAW", "Brandmark", "Looka"],
  // Website / UI-UX Design tools
  website_ui_ux: ["Figma", "Adobe XD", "Sketch", "InVision", "Framer", "Zeplin", "Marvel", "Principle", "ProtoPie", "Maze"],
  // SEO tools
  seo: ["Ahrefs", "SEMrush", "Google Search Console", "Screaming Frog", "Moz", "Ubersuggest", "Yoast SEO", "Surfer SEO", "SE Ranking", "SpyFu"],
  // Social Media Marketing tools
  social_media_marketing: ["Hootsuite", "Buffer", "Sprout Social", "Later", "Canva", "Meta Business Suite", "TikTok Creator Studio", "Loomly", "SocialBee", "Agorapulse"],
  // Paid Advertising / Performance Marketing tools
  paid_advertising: ["Google Ads", "Facebook Ads Manager", "TikTok Ads", "LinkedIn Ads", "Google Analytics", "Hotjar", "Mixpanel", "Amplitude", "Optimizely", "VWO"],
  // App Development tools
  app_development: ["React Native", "Flutter", "Swift", "Kotlin", "Xcode", "Android Studio", "Firebase", "Expo", "Fastlane", "TestFlight"],
  // Software Development tools
  software_development: ["Python", "Java", "C++", "Node.js", "Docker", "Git", "AWS", "Azure", "PostgreSQL", "MongoDB"],
  // Lead Generation tools
  lead_generation: ["Apollo.io", "LinkedIn Sales Navigator", "Hunter.io", "ZoomInfo", "Lusha", "Snov.io", "Lemlist", "Clearbit", "Leadfeeder", "Outreach"],
  // Video Services tools
  video_services: ["Adobe Premiere Pro", "Final Cut Pro", "DaVinci Resolve", "After Effects", "CapCut", "Filmora", "Camtasia", "Sony Vegas", "HitFilm", "iMovie"],
  // Writing & Content tools
  writing_content: ["Google Docs", "Grammarly", "Hemingway", "Notion", "WordPress", "Medium", "Jasper AI", "Copy.ai", "Surfer SEO", "Clearscope"],
  // Customer Support tools
  customer_support: ["Zendesk", "Freshdesk", "Intercom", "HubSpot", "LiveChat", "Crisp", "Tidio", "Help Scout", "Kayako", "Zoho Desk"],
  // Influencer Marketing tools
  influencer_marketing: ["Instagram", "TikTok", "YouTube Studio", "Upfluence", "AspireIQ", "Grin", "CreatorIQ", "Heepsy", "Modash", "Traackr"],
  // UGC Marketing tools
  ugc_marketing: ["Instagram", "TikTok", "YouTube Studio", "Canva", "CapCut", "Linktree", "Later", "VSCO", "InShot", "Lightroom Mobile"],
  // AI Automation tools
  ai_automation: ["Zapier", "Make (Integromat)", "n8n", "ChatGPT API", "Python", "LangChain", "Flowise", "OpenAI", "Anthropic API", "Hugging Face"],
  // WhatsApp Chatbot tools
  whatsapp_chatbot: ["Twilio", "WhatsApp Business API", "Chatfuel", "ManyChat", "Wati", "Respond.io", "Gupshup", "Infobip", "MessageBird", "360dialog"],
  // Creative & Design tools
  creative_design: ["Figma", "Adobe Photoshop", "Illustrator", "Canva", "Sketch", "InDesign", "Affinity Designer", "Adobe XD", "Procreate", "CorelDRAW"],
  // 3D Modeling tools
  "3d_modeling": ["Blender", "Maya", "Cinema 4D", "3ds Max", "ZBrush", "SketchUp", "Houdini", "Rhino", "Modo", "Fusion 360"],
  // CGI Videos tools
  cgi_videos: ["Blender", "After Effects", "Cinema 4D", "Unreal Engine", "Houdini", "Nuke", "DaVinci Resolve", "Unity", "Octane Render", "V-Ray"],
  // CRM & ERP tools
  crm_erp: ["Salesforce", "HubSpot", "Zoho CRM", "SAP", "Oracle", "Microsoft Dynamics", "Pipedrive", "Freshsales", "Monday CRM", "NetSuite"],
  // Voice Agent tools
  voice_agent: ["Twilio", "Amazon Connect", "Google Cloud Speech", "Azure Cognitive Services", "Dialogflow", "VoiceFlow", "VAPI", "Retell AI", "Deepgram", "AssemblyAI"],
};

const PORTFOLIO_TYPE_OPTIONS = [
  { value: "live_links", label: "Live links", description: "Links to live websites or apps" },
  { value: "drive_folder", label: "Drive folder", description: "Google Drive or cloud storage" },
  { value: "case_studies", label: "Case studies", description: "Detailed project breakdowns" },
  { value: "demo_samples", label: "Demo samples", description: "Sample work or mockups" },
];

const WORK_PREFERENCE_OPTIONS = [
  { value: "fixed_scope", label: "Fixed-scope projects" },
  { value: "milestone_based", label: "Milestone-based projects" },
  { value: "monthly_retainer", label: "Monthly/retainer work" },
];

const HOURS_PER_DAY_OPTIONS = [
  { value: "2_3", label: "2–3 hours" },
  { value: "4_6", label: "4–6 hours" },
  { value: "6_8", label: "6–8 hours" },
  { value: "full_time", label: "Full-time" },
];

const REVISION_HANDLING_OPTIONS = [
  { value: "agreed_scope", label: "As per agreed scope only" },
  { value: "flexible", label: "Flexible (within reason)" },
];

const PRICING_MODEL_OPTIONS = [
  { value: "fixed_price", label: "Fixed price" },
  { value: "hourly", label: "Hourly" },
  { value: "monthly", label: "Monthly" },
];

const PROJECT_RANGE_OPTIONS = [
  { value: "entry_level", label: "Entry-level (< $500)" },
  { value: "mid_range", label: "Mid-range ($500 - $5k)" },
  { value: "premium", label: "Premium ($5k+)" },
];

const COMMUNICATION_STYLE_OPTIONS = [
  { value: "async", label: "Async", description: "Messages, updates at milestones" },
  { value: "daily_checkins", label: "Daily check-ins", description: "Regular daily updates" },
];

const RESPONSE_TIME_OPTIONS = [
  { value: "within_24h", label: "Within 24 hours" },
  { value: "same_day", label: "Same working day" },
];

const QUALITY_PROCESS_OPTIONS = [
  { value: "self_review", label: "Self-review" },
  { value: "checklist_qa", label: "Checklist-based QA" },
  { value: "peer_review", label: "Peer review" },
];

const TIMEZONE_OPTIONS = [
  { value: "IST", label: "IST (Indian Standard Time)" },
  { value: "PST", label: "PST (Pacific Standard Time)" },
  { value: "EST", label: "EST (Eastern Standard Time)" },
  { value: "CST", label: "CST (Central Standard Time)" },
  { value: "GMT", label: "GMT (Greenwich Mean Time)" },
  { value: "CET", label: "CET (Central European Time)" },
  { value: "AST", label: "AST (Atlantic Standard Time)" },
  { value: "MST", label: "MST (Mountain Standard Time)" },
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "BST", label: "BST (British Summer Time)" },
  { value: "AEST", label: "AEST (Australian Eastern Standard Time)" },
];

const WORKING_HOURS_OPTIONS = [
  { value: "9_to_6", label: "9 AM - 6 PM" },
  { value: "10_to_7", label: "10 AM - 7 PM" },
  { value: "8_to_5", label: "8 AM - 5 PM" },
  { value: "flexible", label: "Flexible Schedule" },
  { value: "overlap_us", label: "Overlap with US Hours" },
  { value: "overlap_uk", label: "Overlap with UK Hours" },
  { value: "weekend_only", label: "Weekend Only" },
  { value: "night_shift", label: "Night Shift" },
];

// Each step = one question/action
const STEPS = [
  { id: 1, key: "role", label: "Role Type" },
  { id: 2, key: "services", label: "Services" },
  { id: 3, key: "experience_years", label: "Experience" },
  { id: 4, key: "working_level", label: "Working Level" },
  { id: 5, key: "primary_tools", label: "Primary Tools" },
  { id: 6, key: "secondary_tools", label: "Secondary Tools" },
  { id: 7, key: "has_previous_work", label: "Previous Work" },
  { id: 8, key: "portfolio_types", label: "Portfolio Type" },
  { id: 9, key: "worked_with_clients", label: "Client History" },
  { id: 10, key: "work_preference", label: "Work Style" },
  { id: 11, key: "hours_per_day", label: "Availability" },
  { id: 12, key: "revision_handling", label: "Revisions" },
  { id: 13, key: "pricing_model", label: "Pricing" },
  { id: 14, key: "project_range", label: "Project Range" },
  { id: 15, key: "partial_scope", label: "Partial Scope" },
  { id: 16, key: "sop_agreement", label: "SOP Agreement" },
  { id: 17, key: "scope_freeze", label: "Scope Freeze" },
  { id: 18, key: "requote_agreement", label: "Re-quote Policy" },
  { id: 19, key: "communication_style", label: "Communication" },
  { id: 20, key: "response_time", label: "Response Time" },
  { id: 21, key: "timezone", label: "Timezone" },
  { id: 22, key: "quality_process", label: "Quality" },
  { id: 23, key: "accepts_ratings", label: "Ratings" },
  { id: 24, key: "why_catalance", label: "Motivation" },
  { id: 25, key: "ready_to_start", label: "Readiness" },
  { id: 26, key: "personal_info", label: "Account" },
];

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const ProgressBar = ({ currentStep, totalSteps }) => {
  const progress = (currentStep / totalSteps) * 100;
  return (
    <div className="w-full h-[2px] bg-white/10 overflow-hidden relative">
      <div
        className="h-full bg-white transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

const StepHeader = ({ title, subtitle }) => (
  <div className="mb-8 text-center px-4">
    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
      {title}
    </h1>
    {subtitle && (
      <p className="text-white/60 text-sm">{subtitle}</p>
    )}
  </div>
);

const OptionCard = ({
  selected,
  onClick,
  label,
  description,
  icon: Icon,
  multiSelect = false,
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
      "group relative w-full flex items-center justify-between px-6 py-5 rounded-xl border transition-all duration-300 overflow-hidden",
      selected
        ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/5"
        : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
    )}
  >
    {/* Active indicator bar */}
    {selected && (
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
    )}

    <div className="flex items-center gap-5">
      {Icon && (
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
          selected
            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-110"
            : "bg-white/10 text-white/60 group-hover:bg-white/20 group-hover:text-white"
        )}>
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="text-left">
        <p className={cn(
          "text-base font-semibold transition-colors",
          selected ? "text-primary" : "text-white"
        )}>{label}</p>
        {description && (
          <p className="text-white/50 text-sm mt-1 group-hover:text-white/70 transition-colors">{description}</p>
        )}
      </div>
    </div>

    <div className={cn(
      "w-6 h-6 rounded-full flex items-center justify-center shrink-0 ml-4 transition-all duration-300",
      selected
        ? "bg-primary text-primary-foreground scale-110"
        : "bg-white/10 text-transparent group-hover:bg-white/20"
    )}>
      <Check className="w-3.5 h-3.5" />
    </div>
  </motion.button>
);

const ActionButton = ({ onClick, disabled, loading, children, variant = "primary" }) => (
  <Button
    onClick={onClick}
    disabled={disabled || loading}
    className={cn(
      "w-full py-6 text-base font-medium rounded-full transition-all",
      variant === "primary"
        ? "bg-primary hover:bg-primary-strong text-primary-foreground"
        : "bg-white/10 hover:bg-white/20 text-white"
    )}
  >
    {loading ? (
      <Loader2 className="w-5 h-5 animate-spin" />
    ) : (
      children
    )}
  </Button>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const FreelancerMultiStepForm = () => {
  const navigate = useNavigate();
  const { login: setAuthSession, user, refreshUser } = useAuth();

  const [hasStarted, setHasStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [stepError, setStepError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otp, setOtp] = useState("");

  const [formData, setFormData] = useState({
    role: "",
    selectedServices: [],
    experienceYears: "",
    workingLevel: "",
    primarySkillTools: [],
    secondarySkillTools: [],
    hasPreviousWork: "",
    portfolioTypes: [],
    hasWorkedWithClients: "",
    portfolioLink: "",
    workPreference: "",
    hoursPerDay: "",
    revisionHandling: "",
    pricingModel: "",
    projectRange: "",
    partialScope: "",
    sopAgreement: "",
    scopeFreezeAgreement: "",
    requoteAgreement: "",
    communicationStyle: "",
    responseTime: "",
    timezone: "",
    workingHours: "",
    qualityProcess: [],
    acceptsRatings: "",
    whyCatalance: "",
    readyToStart: "",
    fullName: "",
    email: "",
    password: "",
    phone: "",
    countryCode: "US",
    location: "",
  });

  const totalSteps = STEPS.length;

  // Load saved state on mount
  useEffect(() => {
    const savedData = localStorage.getItem("freelancer_onboarding_data");
    const savedStep = localStorage.getItem("freelancer_onboarding_step");
    const savedHasStarted = localStorage.getItem("freelancer_onboarding_started");

    if (savedData) {
      try {
        setFormData(JSON.parse(savedData));
      } catch (e) {
        console.error("Failed to parse saved form data", e);
      }
    }
    if (savedStep) {
      setCurrentStep(parseInt(savedStep, 10));
    }
    if (savedHasStarted) {
      setHasStarted(JSON.parse(savedHasStarted));
    }
  }, []);

  // Save state on changes
  useEffect(() => {
    localStorage.setItem("freelancer_onboarding_data", JSON.stringify(formData));
    localStorage.setItem("freelancer_onboarding_step", currentStep.toString());
    localStorage.setItem("freelancer_onboarding_started", JSON.stringify(hasStarted));
  }, [formData, currentStep, hasStarted]);

  // Get relevant tools based on selected services
  const availableTools = useMemo(() => {
    const tools = new Set();
    formData.selectedServices.forEach(service => {
      const serviceTools = TOOLS_BY_SERVICE[service] || [];
      serviceTools.forEach(tool => tools.add(tool));
    });
    return Array.from(tools);
  }, [formData.selectedServices]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (stepError) setStepError("");
  };

  const toggleArrayField = (field, value) => {
    setFormData(prev => {
      const current = Array.isArray(prev[field]) ? prev[field] : [];
      const exists = current.includes(value);

      // Special handling for selectedServices: max 2
      if (field === "selectedServices" && !exists && current.length >= 2) {
        toast.error("You can select up to 2 services (Primary & Secondary)");
        return prev;
      }

      return {
        ...prev,
        [field]: exists
          ? current.filter(v => v !== value)
          : [...current, value],
      };
    });
    if (stepError) setStepError("");
  };

  // ============================================================================
  // VALIDATION
  // ============================================================================

  const validateStep = (step, data) => {
    switch (step) {
      case 1:
        if (!data.role) return "Please select your role type.";
        return "";
      case 2:
        if (data.selectedServices.length === 0) return "Please select at least one service.";
        return "";
      case 3:
        if (!data.experienceYears) return "Please select your experience.";
        return "";
      case 4:
        if (!data.workingLevel) return "Please select your working level.";
        return "";
      case 5:
        // Primary skill tools
        if (data.primarySkillTools.length === 0) return "Please select at least one tool for your primary skill.";
        return "";
      case 6:
        // Secondary skill tools (only required if 2 services selected)
        if (data.selectedServices.length >= 2 && data.secondarySkillTools.length === 0) {
          return "Please select at least one tool for your secondary skill.";
        }
        return "";
      case 7:
        if (!data.hasPreviousWork) return "Please make a selection.";
        return "";
      case 8:
        // Portfolio types only required if has previous work
        if (data.hasPreviousWork === "yes" && data.portfolioTypes.length === 0) {
          return "Please select at least one portfolio type.";
        }
        return "";
      case 9:
        if (!data.hasWorkedWithClients) return "Please make a selection.";
        return "";
      case 10:
        if (!data.workPreference) return "Please select your work preference.";
        return "";
      case 11:
        if (!data.hoursPerDay) return "Please select hours per day.";
        return "";
      case 12:
        if (!data.revisionHandling) return "Please select revision handling.";
        return "";
      case 13:
        if (!data.pricingModel) return "Please select a pricing model.";
        return "";
      case 14:
        if (!data.projectRange) return "Please select your project range.";
        return "";
      case 15:
        if (!data.partialScope) return "Please make a selection.";
        return "";
      case 16:
        if (data.sopAgreement !== "yes") return "You must agree to follow Catalance SOPs.";
        return "";
      case 17:
        if (data.scopeFreezeAgreement !== "yes") return "You must understand scope freeze policy.";
        return "";
      case 18:
        if (data.requoteAgreement !== "yes") return "You must agree to re-quoting policy.";
        return "";
      case 19:
        if (!data.communicationStyle) return "Please select communication style.";
        return "";
      case 20:
        if (!data.responseTime) return "Please select response time.";
        return "";
      case 21:
        // Timezone is optional, just continue
        return "";
      case 22:
        if (data.qualityProcess.length === 0) return "Please select at least one QA method.";
        return "";
      case 23:
        if (data.acceptsRatings !== "yes") return "You must accept ratings and reviews.";
        return "";
      case 24:
        if (!data.whyCatalance.trim()) return "Please share your motivation.";
        return "";
      case 25:
        if (!data.readyToStart) return "Please make a selection.";
        return "";
      case 26:
        if (!data.fullName.trim()) return "Please enter your full name.";
        if (!data.email.trim() || !data.email.includes("@")) return "Please enter a valid email.";
        if (data.password.length < 8) return "Password must be at least 8 characters.";
        if (!data.location.trim()) return "Please enter your location.";
        return "";
      default:
        return "";
    }
  };

  const handleNext = () => {
    const validation = validateStep(currentStep, formData);
    if (validation) {
      setStepError(validation);
      toast.error(validation);
      return;
    }

    // Skip secondary tools step if only one service selected
    if (currentStep === 5 && formData.selectedServices.length < 2) {
      setCurrentStep(7); // Skip to has_previous_work
      setStepError("");
      return;
    }

    // Skip portfolio types step if no previous work
    if (currentStep === 7 && formData.hasPreviousWork === "no") {
      setCurrentStep(9); // Skip to worked with clients
      setStepError("");
      return;
    }

    if (currentStep < totalSteps) {
      // If user is logged in and next step is the Account step (last step), submit instead
      if (user && currentStep === totalSteps - 1) {
        handleSubmit();
        return;
      }
      setCurrentStep(currentStep + 1);
      setStepError("");
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      // Handle skip back for portfolio types
      if (currentStep === 9 && formData.hasPreviousWork === "no") {
        setCurrentStep(7);
      }
      // Handle skip back for secondary tools (if only one service selected)
      else if (currentStep === 7 && formData.selectedServices.length < 2) {
        setCurrentStep(5);
      }
      else {
        setCurrentStep(currentStep - 1);
      }
      setStepError("");
    }
  };

  // ============================================================================
  // SUBMIT
  // ============================================================================

  const handleSubmit = async () => {
    // If NOT logged in, we must be on the last step (Account), so validate.
    // If logged in, we skipped the last step, so we validate currentStep (which is 24).
    const validation = validateStep(currentStep, formData);
    if (validation) {
      setStepError(validation);
      toast.error(validation);
      return;
    }

    setIsSubmitting(true);
    setStepError("");

    try {
      const normalizedEmail = formData.email?.trim().toLowerCase() || user?.email; // Use user email if logged in
      const freelancerProfile = {
        role: formData.role,
        services: formData.selectedServices,
        experienceYears: formData.experienceYears,
        workingLevel: formData.workingLevel,
        tools: {
          primary: {
            skill: formData.selectedServices[0] || "",
            tools: formData.primarySkillTools,
          },
          secondary: formData.selectedServices[1] ? {
            skill: formData.selectedServices[1],
            tools: formData.secondarySkillTools,
          } : null,
        },
        hasPreviousWork: formData.hasPreviousWork,
        portfolioTypes: formData.portfolioTypes,
        hasWorkedWithClients: formData.hasWorkedWithClients,
        workPreference: formData.workPreference,
        hoursPerDay: formData.hoursPerDay,
        revisionHandling: formData.revisionHandling,
        pricingModel: formData.pricingModel,
        projectRange: formData.projectRange,
        partialScope: formData.partialScope,
        communicationStyle: formData.communicationStyle,
        responseTime: formData.responseTime,
        timezone: formData.timezone,
        workingHours: formData.workingHours,
        qualityProcess: formData.qualityProcess,
        whyCatalance: formData.whyCatalance,
        readyToStart: formData.readyToStart,
        phone: (() => {
          if (user) return user.phoneNumber || "";
          const country = COUNTRY_CODES.find(c => c.code === formData.countryCode);
          const dialCode = country ? country.dial_code : "+1";
          return `${dialCode} ${formData.phone}`;
        })(),
        location: formData.location || user?.location || "",
      };

      if (user) {
        // Authenticated flow: Update profile
        await updateProfile({
          freelancerProfile,
          onboardingComplete: true
        });

        await refreshUser();

        // Clear saved state
        localStorage.removeItem("freelancer_onboarding_data");
        localStorage.removeItem("freelancer_onboarding_step");
        localStorage.removeItem("freelancer_onboarding_started");

        // Refresh session to get updated flags
        toast.success("Profile completed successfully!");
        navigate("/freelancer", { replace: true });
        // Trigger a reload or re-fetch of user? 
        // navigate usually triggers layout re-render, but context user might be stale.
        // The verifyUser loop in AuthContext (if implemented correctly) or a page reload might be needed used.
        // For now, assume verifyUser runs on mount or we can manually refresh.
        // We can force refresh via window.location.reload() to be safe, 
        // OR rely on the fact we are navigating to dashboard.

      } else {
        // Unauthenticated flow: Signup
        const authPayload = await signup({
          fullName: formData.fullName.trim(),
          email: normalizedEmail,
          password: formData.password,
          role: "FREELANCER",
          freelancerProfile,
        });

        if (!authPayload?.accessToken) {
          setIsVerifying(true);
          setIsSubmitting(false);
          toast.success("Verification code sent to your email!");
          return;
        }

        setAuthSession(authPayload?.user, authPayload?.accessToken);

        // Clear saved state
        localStorage.removeItem("freelancer_onboarding_data");
        localStorage.removeItem("freelancer_onboarding_step");
        localStorage.removeItem("freelancer_onboarding_started");

        toast.success("Your freelancer account has been created.");
        navigate("/freelancer", { replace: true });
      }
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

      // Clear saved state
      localStorage.removeItem("freelancer_onboarding_data");
      localStorage.removeItem("freelancer_onboarding_step");
      localStorage.removeItem("freelancer_onboarding_started");

      toast.success("Account verified and created successfully!");
      navigate("/freelancer", { replace: true });
    } catch (error) {
      toast.error(error.message || "Invalid verification code");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // RENDER INDIVIDUAL STEPS
  // ============================================================================

  const renderWelcome = () => (
    <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
        <Bot className="w-10 h-10 text-primary" />
      </div>

      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold text-white">
          Welcome to Catalance
        </h1>
        <p className="text-xl text-white/60 leading-relaxed font-light">
          To help us know you better and build your personalized dashboard, we need a little information about your skills and preferences.
        </p>
      </div>

      <div className="pt-8 w-full max-w-sm">
        <Button
          onClick={() => setHasStarted(true)}
          className="w-full py-8 text-lg font-medium rounded-full bg-linear-to-r from-primary to-primary-strong hover:from-primary-strong hover:to-primary border border-primary/20 shadow-lg shadow-primary/20 transition-all duration-300 transform hover:scale-[1.02] text-primary-foreground"
        >
          Let's Get Started
        </Button>
        <p className="text-white/30 text-sm mt-4">
          Takes about 2-3 minutes
        </p>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <StepHeader
        onBack={handleBack}
        showBack={false}
        title="What best describes you?"
      />
      <div className="space-y-3">
        {ROLE_OPTIONS.map(option => (
          <OptionCard
            key={option.value}
            selected={formData.role === option.value}
            onClick={() => handleFieldChange("role", option.value)}
            label={option.label}
            description={option.description}
            icon={option.icon}
          />
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <StepHeader
        onBack={handleBack}
        title="Which services do you want to offer?"
        subtitle="Select up to 2 services"
      />
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-2">
        {SERVICE_OPTIONS.map((option, index) => {
          const selectedIndex = formData.selectedServices.indexOf(option.value);
          const isSelected = selectedIndex !== -1;
          const badgeLabel = selectedIndex === 0 ? "Primary" : (selectedIndex === 1 ? "Secondary" : "");

          return (
            <motion.button
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              key={option.value}
              type="button"
              onClick={() => toggleArrayField("selectedServices", option.value)}
              className={cn(
                "group flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-200 relative overflow-hidden min-h-[90px]",
                isSelected
                  ? "border-primary/50 bg-primary/5 shadow-md shadow-primary/5"
                  : "border-white/10 bg-white/5 hover:border-primary/30 hover:bg-white/10"
              )}
            >
              {isSelected && <div className="absolute inset-0 border-2 border-primary/50 rounded-xl" />}

              <div className={cn(
                "p-1.5 rounded-lg transition-colors mb-1.5",
                isSelected ? "bg-primary text-primary-foreground" : "bg-white/10 text-white/70 group-hover:bg-white/20 group-hover:text-white"
              )}>
                {option.icon && <option.icon className="w-4 h-4" />}
              </div>

              <span className={cn(
                "text-[10px] font-semibold text-center leading-tight transition-colors line-clamp-2 px-1",
                isSelected ? "text-primary" : "text-white"
              )}>{option.label}</span>

              {isSelected && (
                <div className="absolute top-2 right-2">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-black bg-primary px-1.5 py-0.5 rounded-sm shadow-sm">
                    {badgeLabel}
                  </span>
                </div>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <StepHeader
        onBack={handleBack}
        title="How many years of experience do you have?"
        subtitle="In your selected service(s)"
      />
      <div className="space-y-3">
        {EXPERIENCE_YEARS_OPTIONS.map(option => (
          <OptionCard
            key={option.value}
            selected={formData.experienceYears === option.value}
            onClick={() => handleFieldChange("experienceYears", option.value)}
            label={option.label}
          />
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <StepHeader
        onBack={handleBack}
        title="What is your working level?"
      />
      <div className="space-y-3">
        {WORKING_LEVEL_OPTIONS.map(option => (
          <OptionCard
            key={option.value}
            selected={formData.workingLevel === option.value}
            onClick={() => handleFieldChange("workingLevel", option.value)}
            label={option.label}
            description={option.description}
          />
        ))}
      </div>
    </div>
  );

  // Get primary skill label
  const getPrimarySkillLabel = () => {
    const primaryService = formData.selectedServices[0];
    const serviceOption = SERVICE_OPTIONS.find(s => s.value === primaryService);
    return serviceOption?.label || "Primary Skill";
  };

  // Get secondary skill label
  const getSecondarySkillLabel = () => {
    const secondaryService = formData.selectedServices[1];
    const serviceOption = SERVICE_OPTIONS.find(s => s.value === secondaryService);
    return serviceOption?.label || "Secondary Skill";
  };

  // Get tools for primary skill
  const getPrimarySkillTools = () => {
    const primaryService = formData.selectedServices[0];
    return TOOLS_BY_SERVICE[primaryService] || [];
  };

  // Get tools for secondary skill
  const getSecondarySkillTools = () => {
    const secondaryService = formData.selectedServices[1];
    return TOOLS_BY_SERVICE[secondaryService] || [];
  };

  const renderStep5 = () => {
    const tools = getPrimarySkillTools();
    const skillLabel = getPrimarySkillLabel();

    return (
      <div className="space-y-4">
        <StepHeader
          onBack={handleBack}
          title={`Tools for ${skillLabel}`}
          subtitle="Select all tools you actively use for this skill"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {tools.map((tool, index) => {
            const isSelected = formData.primarySkillTools.includes(tool);
            return (
              <motion.button
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                key={tool}
                type="button"
                onClick={() => toggleArrayField("primarySkillTools", tool)}
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
            )
          })}
        </div>
      </div>
    );
  };

  const renderStep6 = () => {
    const tools = getSecondarySkillTools();
    const skillLabel = getSecondarySkillLabel();

    return (
      <div className="space-y-4">
        <StepHeader
          onBack={handleBack}
          title={`Tools for ${skillLabel}`}
          subtitle="Select all tools you actively use for this skill"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {tools.map((tool, index) => {
            const isSelected = formData.secondarySkillTools.includes(tool);
            return (
              <motion.button
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                key={tool}
                type="button"
                onClick={() => toggleArrayField("secondarySkillTools", tool)}
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
            )
          })}
        </div>
      </div>
    );
  };

  const renderStep7 = () => (
    <div className="space-y-4">
      <StepHeader
        onBack={handleBack}
        title="Do you have previous work to showcase?"
      />
      <div className="space-y-3">
        <OptionCard
          selected={formData.hasPreviousWork === "yes"}
          onClick={() => handleFieldChange("hasPreviousWork", "yes")}
          label="Yes"
          description="I can upload links/files"
        />
        <OptionCard
          selected={formData.hasPreviousWork === "no"}
          onClick={() => handleFieldChange("hasPreviousWork", "no")}
          label="No"
          description="I'm new but skilled"
        />
      </div>
    </div>
  );

  const renderStep8 = () => (
    <div className="space-y-4">
      <StepHeader
        onBack={handleBack}
        title="What type of portfolio do you have?"
        subtitle="Select all that apply"
      />
      <div className="space-y-3">
        {PORTFOLIO_TYPE_OPTIONS.map(option => (
          <OptionCard
            key={option.value}
            selected={formData.portfolioTypes.includes(option.value)}
            onClick={() => toggleArrayField("portfolioTypes", option.value)}
            label={option.label}
            description={option.description}
            multiSelect
          />
        ))}
      </div>
      <div className="pt-4">
        <Label className="text-white/70 text-sm">Portfolio Link (optional)</Label>
        <Input
          value={formData.portfolioLink}
          onChange={(e) => handleFieldChange("portfolioLink", e.target.value)}
          placeholder="https://your-portfolio.com"
          className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-white/30"
        />
      </div>
    </div>
  );

  const renderStep9 = () => (
    <div className="space-y-4">
      <StepHeader
        onBack={handleBack}
        title="Have you worked with clients before?"
      />
      <div className="space-y-3">
        <OptionCard
          selected={formData.hasWorkedWithClients === "yes"}
          onClick={() => handleFieldChange("hasWorkedWithClients", "yes")}
          label="Yes"
        />
        <OptionCard
          selected={formData.hasWorkedWithClients === "no"}
          onClick={() => handleFieldChange("hasWorkedWithClients", "no")}
          label="No"
        />
      </div>
    </div>
  );

  const renderStep10 = () => (
    <div className="space-y-4">
      <StepHeader
        onBack={handleBack}
        title="How do you prefer to work?"
      />
      <div className="space-y-3">
        {WORK_PREFERENCE_OPTIONS.map(option => (
          <OptionCard
            key={option.value}
            selected={formData.workPreference === option.value}
            onClick={() => handleFieldChange("workPreference", option.value)}
            label={option.label}
          />
        ))}
      </div>
    </div>
  );

  const renderStep11 = () => (
    <div className="space-y-4">
      <StepHeader
        onBack={handleBack}
        title="How many hours per day can you dedicate?"
      />
      <div className="space-y-3">
        {HOURS_PER_DAY_OPTIONS.map(option => (
          <OptionCard
            key={option.value}
            selected={formData.hoursPerDay === option.value}
            onClick={() => handleFieldChange("hoursPerDay", option.value)}
            label={option.label}
          />
        ))}
      </div>
    </div>
  );

  const renderStep12 = () => (
    <div className="space-y-4">
      <StepHeader
        onBack={handleBack}
        title="How do you handle revisions?"
      />
      <div className="space-y-3">
        {REVISION_HANDLING_OPTIONS.map(option => (
          <OptionCard
            key={option.value}
            selected={formData.revisionHandling === option.value}
            onClick={() => handleFieldChange("revisionHandling", option.value)}
            label={option.label}
          />
        ))}
      </div>
    </div>
  );

  const renderStep13 = () => (
    <div className="space-y-4">
      <StepHeader
        onBack={handleBack}
        title="What pricing model do you prefer?"
      />
      <div className="space-y-3">
        {PRICING_MODEL_OPTIONS.map(option => (
          <OptionCard
            key={option.value}
            selected={formData.pricingModel === option.value}
            onClick={() => handleFieldChange("pricingModel", option.value)}
            label={option.label}
          />
        ))}
      </div>
    </div>
  );

  const renderStep14 = () => (
    <div className="space-y-4">
      <StepHeader
        onBack={handleBack}
        title="Your typical project range?"
      />
      <div className="space-y-3">
        {PROJECT_RANGE_OPTIONS.map(option => (
          <OptionCard
            key={option.value}
            selected={formData.projectRange === option.value}
            onClick={() => handleFieldChange("projectRange", option.value)}
            label={option.label}
          />
        ))}
      </div>
    </div>
  );

  const renderStep15 = () => (
    <div className="space-y-4">
      <StepHeader
        onBack={handleBack}
        title="Are you open to partial-scope projects?"
      />
      <div className="space-y-3">
        <OptionCard
          selected={formData.partialScope === "yes"}
          onClick={() => handleFieldChange("partialScope", "yes")}
          label="Yes"
        />
        <OptionCard
          selected={formData.partialScope === "no"}
          onClick={() => handleFieldChange("partialScope", "no")}
          label="No"
        />
      </div>
    </div>
  );

  const renderStep16 = () => (
    <div className="space-y-4">
      <StepHeader
        onBack={handleBack}
        title="Do you agree to follow Catalance's 4-phase SOP?"
        subtitle="This is mandatory to proceed"
      />
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
        <p className="text-amber-200 text-sm">
          âš ï¸ All projects on Catalance follow our standard operating procedures.
        </p>
      </div>
      <div className="space-y-3">
        <button
          onClick={() => handleFieldChange("sopAgreement", "yes")}
          className={cn(
            "w-full py-4 rounded-xl font-medium transition-all text-center",
            formData.sopAgreement === "yes"
              ? "bg-green-500 text-white"
              : "bg-white/10 text-white/70 hover:bg-white/20"
          )}
        >
          Yes, I agree
        </button>
      </div>
    </div>
  );

  const renderStep17 = () => (
    <div className="space-y-4">
      <StepHeader
        onBack={handleBack}
        title="Work starts only after scope freeze and approval"
        subtitle="Do you understand this policy?"
      />
      <div className="space-y-3">
        <button
          onClick={() => handleFieldChange("scopeFreezeAgreement", "yes")}
          className={cn(
            "w-full py-4 rounded-xl font-medium transition-all text-center",
            formData.scopeFreezeAgreement === "yes"
              ? "bg-green-500 text-white"
              : "bg-white/10 text-white/70 hover:bg-white/20"
          )}
        >
          Yes, I understand
        </button>
      </div>
    </div>
  );

  const renderStep18 = () => (
    <div className="space-y-4">
      <StepHeader
        onBack={handleBack}
        title="Scope changes require re-quoting"
        subtitle="Do you agree to this policy?"
      />
      <div className="space-y-3">
        <button
          onClick={() => handleFieldChange("requoteAgreement", "yes")}
          className={cn(
            "w-full py-4 rounded-xl font-medium transition-all text-center",
            formData.requoteAgreement === "yes"
              ? "bg-green-500 text-white"
              : "bg-white/10 text-white/70 hover:bg-white/20"
          )}
        >
          Yes, I agree
        </button>
      </div>
    </div>
  );

  const renderStep19 = () => (
    <div className="space-y-4">
      <StepHeader
        onBack={handleBack}
        title="Preferred communication style?"
      />
      <div className="space-y-3">
        {COMMUNICATION_STYLE_OPTIONS.map(option => (
          <OptionCard
            key={option.value}
            selected={formData.communicationStyle === option.value}
            onClick={() => handleFieldChange("communicationStyle", option.value)}
            label={option.label}
            description={option.description}
          />
        ))}
      </div>
    </div>
  );

  const renderStep20 = () => (
    <div className="space-y-4">
      <StepHeader
        onBack={handleBack}
        title="Response time commitment?"
      />
      <div className="space-y-3">
        {RESPONSE_TIME_OPTIONS.map(option => (
          <OptionCard
            key={option.value}
            selected={formData.responseTime === option.value}
            onClick={() => handleFieldChange("responseTime", option.value)}
            label={option.label}
          />
        ))}
      </div>
    </div>
  );

  const renderStep21 = () => (
    <div className="space-y-4">
      <StepHeader
        onBack={handleBack}
        title="Timezone & working hours"
        subtitle="Optional but recommended"
      />
      <div className="space-y-4">
        <div className="space-y-4">
          <div>
            <Label className="text-white/70 text-sm">Your timezone</Label>
            <Select
              value={formData.timezone}
              onValueChange={(value) => handleFieldChange("timezone", value)}
            >
              <SelectTrigger className="mt-2 w-full bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-white/70 text-sm">Working hours</Label>
            <Select
              value={formData.workingHours}
              onValueChange={(value) => handleFieldChange("workingHours", value)}
            >
              <SelectTrigger className="mt-2 w-full bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Select working hours" />
              </SelectTrigger>
              <SelectContent>
                {WORKING_HOURS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep22 = () => (
    <div className="space-y-4">
      <StepHeader
        onBack={handleBack}
        title="How do you ensure quality before delivery?"
        subtitle="Select all that apply"
      />
      <div className="space-y-3">
        {QUALITY_PROCESS_OPTIONS.map(option => (
          <OptionCard
            key={option.value}
            selected={formData.qualityProcess.includes(option.value)}
            onClick={() => toggleArrayField("qualityProcess", option.value)}
            label={option.label}
            multiSelect
          />
        ))}
      </div>
    </div>
  );

  const renderStep23 = () => (
    <div className="space-y-4">
      <StepHeader
        onBack={handleBack}
        title="Are you comfortable with ratings and reviews?"
        subtitle="After every project completion"
      />
      <div className="space-y-3">
        <OptionCard
          selected={formData.acceptsRatings === "yes"}
          onClick={() => handleFieldChange("acceptsRatings", "yes")}
          label="Yes"
          description="I welcome feedback and ratings"
        />
      </div>
    </div>
  );

  const renderStep24 = () => (
    <div className="space-y-4">
      <StepHeader
        onBack={handleBack}
        title="Why do you want to work on Catalance?"
      />
      <Textarea
        value={formData.whyCatalance}
        onChange={(e) => handleFieldChange("whyCatalance", e.target.value)}
        placeholder="Share your motivation..."
        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[150px]"
      />
    </div>
  );

  const renderStep25 = () => (
    <div className="space-y-4">
      <StepHeader
        onBack={handleBack}
        title="Ready to start immediately if selected?"
      />
      <div className="space-y-3">
        <OptionCard
          selected={formData.readyToStart === "yes"}
          onClick={() => handleFieldChange("readyToStart", "yes")}
          label="Yes"
        />
        <OptionCard
          selected={formData.readyToStart === "not_yet"}
          onClick={() => handleFieldChange("readyToStart", "not_yet")}
          label="Not yet"
        />
      </div>
    </div>
  );

  const renderStep26 = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 bg-[#121212] overflow-hidden rounded-3xl border border-white/5 shadow-2xl min-h-[600px]">
      {/* Left Columns - Form */}
      <div className="p-8 lg:p-12 flex flex-col justify-center">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Create your account</h2>
          <p className="text-white/50 text-sm">Enter your details below to create your account</p>
          <p className="text-[10px] uppercase tracking-widest text-primary font-bold mt-2">
            YOU'RE CREATING A FREELANCER ACCOUNT
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-white/70 text-sm font-semibold">Full name</Label>
            <Input
              value={formData.fullName}
              onChange={(e) => handleFieldChange("fullName", e.target.value)}
              placeholder="John Doe"
              className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/20 h-11 rounded-lg focus:border-primary/50 transition-colors"
            />
          </div>
          <div>
            <Label className="text-white/70 text-sm font-semibold">Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleFieldChange("email", e.target.value)}
              placeholder="you@example.com"
              className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/20 h-11 rounded-lg focus:border-primary/50 transition-colors"
            />
          </div>
          <div>
            <Label className="text-white/70 text-sm font-semibold">Password</Label>
            <div className="relative mt-1.5">
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => handleFieldChange("password", e.target.value)}
                placeholder="Min. 8 characters"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-11 rounded-lg pr-10 focus:border-primary/50 transition-colors"
              />
            </div>
            <p className="text-white/30 text-xs mt-1">Must be at least 8 characters long.</p>
          </div>

          <Button
            className="w-full h-11 bg-primary hover:bg-primary-strong text-black font-bold rounded-lg mt-4 transition-all"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
          </Button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#121212] px-2 text-white/30">Or continue with</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full h-11 border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all"
            onClick={() => toast.info("Google Auth not implemented")}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="text-center mt-4">
            <span className="text-white/50 text-sm">Already have an account? </span>
            <button
              onClick={() => navigate("/login")}
              className="text-white/90 hover:text-white underline underline-offset-4 text-sm font-medium transition-colors"
            >
              Sign in
            </button>
          </div>

          <div className="text-center mt-6">
            <p className="text-[10px] text-white/30">
              By clicking continue, you agree to our <a href="#" className="underline hover:text-white/50">Terms of Service</a> and <a href="#" className="underline hover:text-white/50">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column - Image & Branding */}
      <div className="relative hidden lg:flex flex-col items-center justify-center p-12 bg-zinc-900 overflow-hidden">
        {/* Background Image Placeholder with Overlay */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80')] bg-cover bg-center opacity-40 mix-blend-overlay" />
        <div className="absolute inset-0 bg-linear-to-b from-transparent to-black/80" />

        <div className="relative z-10 text-center max-w-md">
          <h3 className="text-4xl font-bold text-white/20 leading-tight mb-6 font-serif">
            THE TRUSTED SPACE FOR <br />
            <span className="text-white/40">SKILLED FREELANCERS.</span>
          </h3>
          {/* Abstract rings/decoration */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/5 rounded-full animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] border border-white/5 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] border border-white/5 rounded-full" />
        </div>
      </div>
    </div>
  );

  const renderOtpVerification = () => (
    <div className="space-y-6">
      <StepHeader
        onBack={() => setIsVerifying(false)}
        title="Verify your email"
        subtitle={`We sent a code to ${formData.email}`}
      />
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
      <ActionButton onClick={handleVerifyOtp} loading={isSubmitting}>
        Verify & Complete
      </ActionButton>
    </div>
  );

  const renderCurrentStep = () => {
    if (isVerifying) return renderOtpVerification();

    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      case 7: return renderStep7();
      case 8: return renderStep8();
      case 9: return renderStep9();
      case 10: return renderStep10();
      case 11: return renderStep11();
      case 12: return renderStep12();
      case 13: return renderStep13();
      case 14: return renderStep14();
      case 15: return renderStep15();
      case 16: return renderStep16();
      case 17: return renderStep17();
      case 18: return renderStep18();
      case 19: return renderStep19();
      case 20: return renderStep20();
      case 21: return renderStep21();
      case 22: return renderStep22();
      case 23: return renderStep23();
      case 24: return renderStep24();
      case 25: return renderStep25();
      case 26: return renderStep26();
      default: return null;
    }
  };

  const isLastStep = currentStep === totalSteps;

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="h-screen w-full bg-zinc-950 text-white relative overflow-hidden flex flex-col font-sans selection:bg-primary/30">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] mix-blend-screen" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {!hasStarted ? (
          <div className="min-h-screen flex items-center justify-center px-6">
            {renderWelcome()}
          </div>
        ) : (
          <>
            {/* Progress Bar - Clean top bar */}
            {/* Top Navigation Bar */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a] border-b border-white/5 shadow-2xl shadow-black/50">

              {/* Progress Bar Line at the very top edge */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-white/5 w-full">
                <div
                  className="h-full bg-primary transition-all duration-300 ease-out shadow-[0_0_10px_rgba(253,224,71,0.5)]"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>

              <div className="w-full px-6 h-16 relative flex items-center justify-center">
                {/* Back Button - Absolute Left */}
                {currentStep > 1 && (
                  <button
                    onClick={handleBack}
                    className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-all backdrop-blur-md z-20 group"
                  >
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                  </button>
                )}

                {/* Step Counter - Centered */}
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">
                  Step {currentStep} of {totalSteps}
                </span>
              </div>
            </div>

            {/* Main Content - Scrollable Area */}
            <div className="relative pt-24 pb-32 h-full overflow-y-auto w-full custom-scrollbar">
              <div className="max-w-6xl mx-auto px-6 h-full flex flex-col justify-center min-h-[600px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isVerifying ? 'verify' : currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="w-full"
                  >
                    {renderCurrentStep()}
                  </motion.div>
                </AnimatePresence>

                {stepError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <p className="text-red-400 text-sm font-medium">{stepError}</p>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Bottom Action Button */}
            {!isVerifying && (
              <div className="fixed bottom-0 left-0 right-0 p-6 bg-linear-to-t from-[#0a0a0a] via-[#0a0a0a]/95 to-transparent">
                <div className="max-w-md mx-auto">
                  <ActionButton
                    onClick={isLastStep ? handleSubmit : handleNext}
                    loading={isSubmitting}
                  >
                    {isLastStep ? "Create Account" : "Continue"}
                  </ActionButton>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FreelancerMultiStepForm;
