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
  Plus,
  X,
  Upload,
  Link as LinkIcon,
  FileText,
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
import { getSession } from "@/shared/lib/auth-storage";
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
  { value: "less_than_1", label: "0-1 year", description: "Entry Level - Building foundational skills" },
  { value: "1_3", label: "1–3", description: "Intermediate - Executing projects with confidence" },
  { value: "3_5", label: "3–5", description: "Specialist - Proven track record of quality work" },
  { value: "5_plus", label: "5+", description: "Expert - Mastery of skills and complex problem solving" },
];

const WORKING_LEVEL_OPTIONS = [
  { value: "beginner", label: "Beginner", description: "Learning stage" },
  { value: "intermediate", label: "Intermediate", description: "Can handle projects independently" },
  { value: "advanced", label: "Advanced", description: "Can handle complex projects" },
];

const TOOLS_BY_SERVICE = {
  // Branding tools
  branding: ["Adobe Illustrator", "Adobe Photoshop", "Figma", "Canva", "Adobe InDesign", "Sketch"],
  // Website / UI-UX Design tools
  website_ui_ux: ["Next.js", "Wordpress", "Shopify", "Framer", "Figma", "Webflow"],
  // SEO tools
  seo: ["Ahrefs", "SEMrush", "Google Search Console", "Moz", "Yoast SEO", "Ubersuggest"],
  // Social Media Marketing tools
  social_media_marketing: ["Hootsuite", "Buffer", "Canva", "Meta Business Suite", "Later", "Sprout Social"],
  // Paid Advertising / Performance Marketing tools
  paid_advertising: ["Google Ads", "Facebook Ads Manager", "Google Analytics", "TikTok Ads", "LinkedIn Ads", "Hotjar"],
  // App Development tools
  app_development: ["React Native", "Flutter", "Swift", "Kotlin", "Firebase", "Expo"],
  // Software Development tools
  software_development: ["Python", "JavaScript", "Node.js", "React", "AWS", "Docker"],
  // Lead Generation tools
  lead_generation: ["Apollo.io", "LinkedIn Sales Navigator", "HubSpot", "ZoomInfo", "Hunter.io", "Lusha"],
  // Video Services tools
  video_services: ["Adobe Premiere Pro", "Final Cut Pro", "DaVinci Resolve", "After Effects", "CapCut", "Filmora"],
  // Writing & Content tools
  writing_content: ["Google Docs", "Grammarly", "Notion", "WordPress", "ChatGPT", "Jasper AI"],
  // Customer Support tools
  customer_support: ["Zendesk", "Freshdesk", "Intercom", "HubSpot", "LiveChat", "Crisp"],
  // Influencer Marketing tools
  influencer_marketing: ["Instagram", "TikTok", "YouTube Studio", "Upfluence", "CreatorIQ", "Grin"],
  // UGC Marketing tools
  ugc_marketing: ["Instagram", "TikTok", "Canva", "CapCut", "YouTube Studio", "InShot"],
  // AI Automation tools
  ai_automation: ["Zapier", "Make (Integromat)", "ChatGPT API", "Python", "n8n", "LangChain"],
  // WhatsApp Chatbot tools
  whatsapp_chatbot: ["WhatsApp Business API", "ManyChat", "Twilio", "Wati", "Respond.io", "Chatfuel"],
  // Creative & Design tools
  creative_design: ["Figma", "Adobe Photoshop", "Adobe Illustrator", "Canva", "Procreate", "Sketch"],
  // 3D Modeling tools
  "3d_modeling": ["Blender", "Maya", "Cinema 4D", "3ds Max", "SketchUp", "ZBrush"],
  // CGI Videos tools
  cgi_videos: ["Blender", "After Effects", "Cinema 4D", "Unreal Engine", "DaVinci Resolve", "Houdini"],
  // CRM & ERP tools
  crm_erp: ["Salesforce", "HubSpot", "Zoho CRM", "Pipedrive", "Microsoft Dynamics", "Freshsales"],
  // Voice Agent tools
  voice_agent: ["Twilio", "Dialogflow", "VoiceFlow", "VAPI", "Amazon Connect", "Retell AI"],
};

const STARTING_PRICE_RANGES = [
  "₹1,000 - ₹5,000",
  "₹5,000 - ₹10,000",
  "₹10,000 - ₹20,000",
  "₹20,000 - ₹50,000",
  "₹50,000+",
];

const ALL_TOOLS_SUGGESTIONS = [
  ...new Set([
    ...Object.values(TOOLS_BY_SERVICE).flat(),
    // Additional common tools
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

const HOURS_PER_WEEK_OPTIONS = [
  { value: "less_than_10", label: "Less than 10 hours" },
  { value: "10_20", label: "10–20 hours" },
  { value: "20_30", label: "20–30 hours" },
  { value: "30_plus", label: "30+ hours" },
];

const WORKING_MODE_OPTIONS = [
  { value: "fixed_hours", label: "Fixed hours" },
  { value: "flexible_hours", label: "Flexible hours" },
  { value: "on_demand", label: "On-demand" },
];

const START_TIMELINE_OPTIONS = [
  { value: "immediately", label: "Immediately" },
  { value: "within_3_5_days", label: "Within 3–5 days" },
  { value: "after_1_week", label: "After 1 week" },
];

const LONG_TERM_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
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

const PLATFORM_CHAT_ONLY_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const UPDATE_FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "milestones", label: "As per milestones" },
];

const PROJECT_TYPE_OPTIONS = [
  { value: "short_term", label: "Short-term" },
  { value: "long_term", label: "Long-term" },
  { value: "one_time", label: "One-time tasks" },
];

const STRICT_DEADLINES_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const SCOPE_PREFERENCE_OPTIONS = [
  { value: "defined", label: "Clearly defined" },
  { value: "flexible", label: "Flexible" },
];

const DEADLINE_HISTORY_OPTIONS = [
  { value: "never", label: "Never" },
  { value: "rarely", label: "Rarely" },
  { value: "occasionally", label: "Occasionally" },
];

const DELAY_HANDLING_OPTIONS = [
  { value: "inform_client", label: "Inform client in advance" },
  { value: "adjust_scope", label: "Adjust scope" },
  { value: "extend_timeline", label: "Extend timeline" },
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
  { id: 7, key: "tertiary_tools", label: "Tertiary Tools" },
  { id: 8, key: "has_previous_work", label: "Previous Work" },
  { id: 9, key: "starting_price", label: "Starting Price" },
  { id: 10, key: "portfolio_types", label: "Portfolio Type" },
  { id: 11, key: "availability", label: "Availability" },
  { id: 12, key: "revision_handling", label: "Revisions" },
  { id: 13, key: "project_type_preference", label: "Project Type" },
  { id: 14, key: "reliability_work_ethics", label: "Reliability" },
  { id: 15, key: "partial_scope", label: "Partial Scope" },
  { id: 16, key: "requote_agreement", label: "Re-quote Policy" },
  { id: 17, key: "communication_style", label: "Communication" },
  { id: 18, key: "response_time", label: "Response Time" },
  { id: 19, key: "timezone", label: "Timezone" },
  { id: 20, key: "why_catalance", label: "Motivation" },
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
          compact ? "text-sm font-semibold transition-colors" : "text-base font-semibold transition-colors",
          selected ? "text-primary" : "text-white"
        )}>{label}</p>
        {description && (
          <p className={cn(
            "text-white/50 mt-1 group-hover:text-white/70 transition-colors",
            compact ? "text-xs" : "text-sm"
          )}>{description}</p>
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



  const [currentStep, setCurrentStep] = useState(1);
  const [stepError, setStepError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otp, setOtp] = useState("");
  const [primaryToolInput, setPrimaryToolInput] = useState("");
  const [secondaryToolInput, setSecondaryToolInput] = useState("");

  const [formData, setFormData] = useState({
    role: "",
    selectedServices: [],
    experienceYears: "",
    workingLevel: "",
    serviceTools: {}, // { [serviceKey]: [] }
    customTools: {}, // { [serviceKey]: [] }
    hasPreviousWork: "",
    hasPreviousWork: "",
    startingPrices: {},
    portfolioTypes: [],
    hasWorkedWithClients: "",
    portfolioLink: "",
    workPreference: "",
    hoursPerWeek: "",
    workingMode: "",
    startTimeline: "",
    openToLongTerm: "",
    revisionHandling: "",
    pricingModel: "",
    projectRange: "",
    projectTypePreference: "",
    strictDeadlines: "",
    scopePreference: "",
    missedDeadlines: "",
    delayHandling: "",
    partialScope: "",
    sopAgreement: "",
    scopeFreezeAgreement: "",
    requoteAgreement: "",
    communicationStyle: "",
    responseTime: "",
    platformChatOnly: "",
    updateFrequency: "",
    keepDiscussionsOnPlatform: "",
    timezone: "",
    workingHours: "",
    qualityProcess: [],
    acceptsRatings: "",
    whyCatalance: "",
    termsAccepted: false,
    readyToStart: "",
    fullName: "",
    email: "",
    password: "",
    phone: "",
    countryCode: "US",
    location: "",
    caseStudyLink: "",
    caseStudyFile: null, // { name: string, url: string }
    portfolioFile: null, // { name: string, url: string }
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
  }, []);

  // Save state on changes
  useEffect(() => {
    localStorage.setItem("freelancer_onboarding_data", JSON.stringify(formData));
    localStorage.setItem("freelancer_onboarding_step", currentStep.toString());
    localStorage.setItem("freelancer_onboarding_data", JSON.stringify(formData));
    localStorage.setItem("freelancer_onboarding_step", currentStep.toString());
  }, [formData, currentStep]);

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

      // Special handling for selectedServices: max 3
      if (field === "selectedServices" && !exists && current.length >= 3) {
        toast.error("You can select up to 3 services (Primary, Secondary & Other)");
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
      case 5: {
        // Step 5: Tools for Service 0
        const svc0 = data.selectedServices[0];
        const tools = data.serviceTools[svc0] || [];
        const custom = data.customTools[svc0] || [];
        if (tools.length === 0 && custom.length === 0) return "Please select at least one tool.";
        return "";
      }
      case 6: {
        // Step 6: Tools for Service 1 (only if >= 2 selected)
        if (data.selectedServices.length < 2) return "";
        const svc1 = data.selectedServices[1];
        const tools = data.serviceTools[svc1] || [];
        const custom = data.customTools[svc1] || [];
        if (tools.length === 0 && custom.length === 0) return "Please select tools for your second service.";
        return "";
      }
      case 7: {
        // Step 7: Tools for Service 2 (only if >= 3 selected)
        if (data.selectedServices.length < 3) return "";
        const svc2 = data.selectedServices[2];
        const tools = data.serviceTools[svc2] || [];
        const custom = data.customTools[svc2] || [];
        if (tools.length === 0 && custom.length === 0) return "Please select tools for your third service.";
        return "";
      }
      case 8: // Previous Work
        if (!data.hasPreviousWork) return "Please make a selection.";
        if (data.hasPreviousWork === "yes") {
          const hasCaseStudy = data.caseStudyLink;
          const hasPortfolio = data.portfolioLink;
          if (!hasCaseStudy && !hasPortfolio) {
            return "Please provide at least one case study or portfolio link.";
          }
        }
        return "";
      case 9: // Starting Price
        for (const service of data.selectedServices) {
          if (!data.startingPrices[service]) return "Please select starting prices for all services.";
        }
        return "";
      case 10: // Portfolio Types
        if (data.portfolioTypes.length === 0) return "Please select at least one portfolio type.";
        return "";
      case 11: // Availability (was 13)
        if (!data.hoursPerWeek) return "Please select weekly availability.";
        if (!data.workingMode) return "Please select your preferred working mode.";
        if (!data.startTimeline) return "Please select when you can start.";
        if (!data.openToLongTerm) return "Please indicate if you're open to long-term work.";
        return "";
      case 12: // Revisions (was 14)
        if (!data.revisionHandling) return "Please select revision handling.";
        return "";
      case 13: // Project Type (was 17)
        if (!data.projectTypePreference) return "Please select your preferred project type.";
        if (!data.strictDeadlines) return "Please select your deadline comfort level.";
        if (!data.scopePreference) return "Please select your scope preference.";
        return "";
      case 14: // Reliability (was 18)
        if (!data.missedDeadlines) return "Please select your deadline history.";
        if (!data.delayHandling) return "Please select how you handle delays.";
        return "";
      case 15: // Partial Scope (was 19)
        if (!data.partialScope) return "Please make a selection.";
        return "";
      case 16: // Re-quote Policy (was 22)
        if (data.requoteAgreement !== "yes") return "You must agree to re-quoting policy.";
        return "";
      case 17: // Communication (was 23)
        if (!data.platformChatOnly) return "Please select your in-platform chat preference.";
        if (!data.updateFrequency) return "Please select your update frequency.";
        if (!data.keepDiscussionsOnPlatform) return "Please confirm discussion preference.";
        return "";
      case 18: // Response Time (was 24)
        if (!data.responseTime) return "Please select response time.";
        return "";
      case 19: // Timezone (was 25)
        // Timezone is optional
        return "";
      case 20: // Motivation (was 28)
        if (!data.whyCatalance.trim()) return "Please share your motivation.";
        if (!data.termsAccepted) return "You must accept the Terms & Conditions to continue.";
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

    // Step 5 -> Next
    // If < 2 services, skip 6 & 7 -> go to 8 (Prev Work)
    if (currentStep === 5 && formData.selectedServices.length < 2) {
      setCurrentStep(8);
      setStepError("");
      return;
    }

    // Step 6 -> Next
    // If < 3 services, skip 7 -> go to 8 (Prev Work)
    if (currentStep === 6 && formData.selectedServices.length < 3) {
      setCurrentStep(8);
      setStepError("");
      return;
    }

    // Portfolio types (Step 10) is skipped - go from 9 (Starting Price) directly to 11 (Availability)
    if (currentStep === 9) {
      setCurrentStep(11);
      setStepError("");
      return;
    }

    if (currentStep < totalSteps) {
      // For logged-in users, submit on last step before account creation
      if (user && currentStep === totalSteps) {
        handleSubmit();
        return;
      }
      setCurrentStep(currentStep + 1);
      setStepError("");
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      // Step 11 (Availability) -> Back logic
      // Needs to go to Step 9 (Starting Price), skipping 10 (Portfolio Types)
      if (currentStep === 11) {
        setCurrentStep(9);
        return;
      }

      // Step 8 (Prev Work) -> Back logic
      // If < 2 services, go back to 5
      // If 2 services, go back to 6
      // If 3 services, go back to 7
      if (currentStep === 8) {
        if (formData.selectedServices.length < 2) {
          setCurrentStep(5);
          return;
        }
        if (formData.selectedServices.length < 3) {
          setCurrentStep(6);
          return;
        }
      }

      // Step 7 (Tertiary) -> Back logic (implicit: goes to 6)

      // Step 6 (Secondary) -> Back logic
      // If navigating back from 6, we always go to 5.

      setCurrentStep(currentStep - 1);
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
          // Map service tools from new structure
          ...formData.serviceTools,
          // Merge custom tools into the same tool lists if needed, or send as separate structure
          // For now, let's append custom tools to the list if backend expects simple lists
          ...Object.keys(formData.customTools).reduce((acc, key) => {
            const existing = formData.serviceTools[key] || [];
            const custom = formData.customTools[key] || [];
            acc[key] = [...new Set([...existing, ...custom])];
            return acc;
          }, {})
        },
        hasPreviousWork: formData.hasPreviousWork,
        startingPrices: formData.startingPrices,
        portfolioTypes: formData.portfolioTypes, // Deprecated/Empty
        // Construct portfolio projects
        portfolioProjects: [
          (formData.caseStudyLink) ? {
            type: 'case_study',
            link: formData.caseStudyLink
          } : null,
          (formData.portfolioLink) ? {
            type: 'portfolio',
            link: formData.portfolioLink
          } : null
        ].filter(Boolean),
        hasWorkedWithClients: formData.hasWorkedWithClients,
        workPreference: formData.workPreference,
        workPreference: formData.workPreference,
        hoursPerWeek: formData.hoursPerWeek,
        workingMode: formData.workingMode,
        startTimeline: formData.startTimeline,
        openToLongTerm: formData.openToLongTerm,
        revisionHandling: formData.revisionHandling,
        pricingModel: formData.pricingModel,
        projectRange: formData.projectRange,
        projectTypePreference: formData.projectTypePreference,
        strictDeadlines: formData.strictDeadlines,
        scopePreference: formData.scopePreference,
        missedDeadlines: formData.missedDeadlines,
        delayHandling: formData.delayHandling,
        partialScope: formData.partialScope,
        communicationStyle: formData.communicationStyle,
        platformChatOnly: formData.platformChatOnly,
        updateFrequency: formData.updateFrequency,
        keepDiscussionsOnPlatform: formData.keepDiscussionsOnPlatform,
        responseTime: formData.responseTime,
        timezone: formData.timezone,
        workingHours: formData.workingHours,
        qualityProcess: formData.qualityProcess,
        whyCatalance: formData.whyCatalance,
        termsAccepted: formData.termsAccepted,
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
        subtitle="Select up to 3 services"
      />
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
        {SERVICE_OPTIONS.map((option, index) => {
          const selectedIndex = formData.selectedServices.indexOf(option.value);
          const isSelected = selectedIndex !== -1;
          const badgeLabel = selectedIndex === 0 ? "Primary" : (selectedIndex === 1 ? "Secondary" : "Other");

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
                "group flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 relative overflow-hidden min-h-[120px]",
                isSelected
                  ? "border-primary/50 bg-primary/5 shadow-md shadow-primary/5"
                  : "border-white/10 bg-white/5 hover:border-primary/30 hover:bg-white/10"
              )}
            >
              {isSelected && <div className="absolute inset-0 border-2 border-primary/50 rounded-xl" />}

              <div className={cn(
                "p-2.5 rounded-lg transition-colors mb-2",
                isSelected ? "bg-primary text-primary-foreground" : "bg-white/10 text-white/70 group-hover:bg-white/20 group-hover:text-white"
              )}>
                {option.icon && <option.icon className="w-5 h-5" />}
              </div>

              <span className={cn(
                "text-xs font-semibold text-center leading-tight transition-colors line-clamp-2 px-2",
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
            description={option.description}
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
    const service = formData.selectedServices[0];
    const serviceOption = SERVICE_OPTIONS.find(s => s.value === service);
    const serviceLabel = serviceOption ? serviceOption.label : service;
    const tools = TOOLS_BY_SERVICE[service] || [];
    // Helper to get tools for this specific service from state
    const currentServiceTools = formData.serviceTools[service] || [];

    return (
      <div className="space-y-4">
        <StepHeader
          onBack={handleBack}
          title={`Tools for ${serviceLabel}`}
          subtitle="Select all tools you actively use for this skill"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {tools.map((tool, index) => {
            const isSelected = currentServiceTools.includes(tool);
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
                onClick={() => {
                  // Custom toggle logic for serviceTools
                  setFormData(prev => {
                    const existing = prev.serviceTools[service] || [];
                    const updated = existing.includes(tool)
                      ? existing.filter(t => t !== tool)
                      : [...existing, tool];
                    return { ...prev, serviceTools: { ...prev.serviceTools, [service]: updated } };
                  });
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
            )
          })}
        </div>

        {/* Custom tools section */}
        <div className="mt-8 pt-3 border-t border-white/10">
          <p className="text-xs mb-4 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="font-semibold text-primary">Recommendation:</span>
            <span className="text-white/60">Accurate skill details improve project matching</span>
          </p>

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
              value={primaryToolInput}
              onChange={(e) => setPrimaryToolInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && primaryToolInput.trim()) {
                  e.preventDefault();
                  const val = primaryToolInput.trim();
                  setFormData(prev => {
                    const existing = prev.customTools[service] || [];
                    if (!existing.includes(val)) {
                      return { ...prev, customTools: { ...prev.customTools, [service]: [...existing, val] } };
                    }
                    return prev;
                  });
                  setPrimaryToolInput("");
                }
              }}
              className="bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 pr-20"
            />
            {primaryToolInput && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40 pointer-events-none">
                Press Enter ↵
              </span>
            )}

            {/* Autocomplete Suggestions */}
            {primaryToolInput && (
              <div className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto bg-[#1A1A1A] border border-white/10 rounded-lg shadow-xl">
                {ALL_TOOLS_SUGGESTIONS
                  .filter(tool =>
                    tool.toLowerCase().includes(primaryToolInput.toLowerCase()) &&
                    !(formData.customTools[service] || []).includes(tool)
                  )
                  .slice(0, 5)
                  .map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        setFormData(prev => {
                          const existing = prev.customTools[service] || [];
                          if (!existing.includes(suggestion)) {
                            return { ...prev, customTools: { ...prev.customTools, [service]: [...existing, suggestion] } };
                          }
                          return prev;
                        });
                        setPrimaryToolInput("");
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
          {(formData.customTools[service] || []).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {(formData.customTools[service] || []).map((tool, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="group flex items-center gap-1.5 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg text-sm text-primary hover:bg-primary/10 hover:border-primary/40 transition-all"
                >
                  <span className="font-medium">{tool}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => {
                        const existing = prev.customTools[service] || [];
                        return { ...prev, customTools: { ...prev.customTools, [service]: existing.filter(t => t !== tool) } };
                      });
                    }}
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

  const renderStep6 = () => {
    // Only if >= 2 services
    if (formData.selectedServices.length < 2) return null;
    const service = formData.selectedServices[1];
    const serviceOption = SERVICE_OPTIONS.find(s => s.value === service);
    const serviceLabel = serviceOption ? serviceOption.label : service;
    const tools = TOOLS_BY_SERVICE[service] || [];
    const currentServiceTools = formData.serviceTools[service] || [];

    return (
      <div className="space-y-4">
        <StepHeader
          onBack={handleBack}
          title={`Tools for ${serviceLabel}`}
          subtitle="Select tools for your secondary skill"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {tools.map((tool, index) => {
            const isSelected = currentServiceTools.includes(tool);
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
                onClick={() => {
                  setFormData(prev => {
                    const existing = prev.serviceTools[service] || [];
                    const updated = existing.includes(tool)
                      ? existing.filter(t => t !== tool)
                      : [...existing, tool];
                    return { ...prev, serviceTools: { ...prev.serviceTools, [service]: updated } };
                  });
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
            )
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-white/80 text-sm font-medium">Add custom tools</span>
          </div>
          <div className="relative">
            <Input
              placeholder="Type tool name + Enter"
              className="bg-white/5 border-white/20 text-white"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  e.preventDefault();
                  const val = e.currentTarget.value.trim();
                  setFormData(prev => {
                    const existing = prev.customTools[service] || [];
                    if (!existing.includes(val)) {
                      return { ...prev, customTools: { ...prev.customTools, [service]: [...existing, val] } };
                    }
                    return prev;
                  });
                  e.currentTarget.value = "";
                }
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {(formData.customTools[service] || []).map((t, i) => (
              <span key={i} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded border border-primary/20 flex items-center gap-1">
                {t}
                <X className="w-3 h-3 cursor-pointer" onClick={() => {
                  setFormData(prev => {
                    const existing = prev.customTools[service] || [];
                    return { ...prev, customTools: { ...prev.customTools, [service]: existing.filter(tool => tool !== t) } };
                  });
                }} />
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderStep7 = () => {
    // Only if >= 3 services
    if (formData.selectedServices.length < 3) return null;
    const service = formData.selectedServices[2];
    const serviceOption = SERVICE_OPTIONS.find(s => s.value === service);
    const serviceLabel = serviceOption ? serviceOption.label : service;
    const tools = TOOLS_BY_SERVICE[service] || [];
    const currentServiceTools = formData.serviceTools[service] || [];

    return (
      <div className="space-y-4">
        <StepHeader
          onBack={handleBack}
          title={`Tools for ${serviceLabel}`}
          subtitle="Select tools for your third skill"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {tools.map((tool, index) => {
            const isSelected = currentServiceTools.includes(tool);
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
                onClick={() => {
                  setFormData(prev => {
                    const existing = prev.serviceTools[service] || [];
                    const updated = existing.includes(tool)
                      ? existing.filter(t => t !== tool)
                      : [...existing, tool];
                    return { ...prev, serviceTools: { ...prev.serviceTools, [service]: updated } };
                  });
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
            )
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-white/80 text-sm font-medium">Add custom tools</span>
          </div>
          <div className="relative">
            <Input
              placeholder="Type tool name + Enter"
              className="bg-white/5 border-white/20 text-white"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  e.preventDefault();
                  const val = e.currentTarget.value.trim();
                  setFormData(prev => {
                    const existing = prev.customTools[service] || [];
                    if (!existing.includes(val)) {
                      return { ...prev, customTools: { ...prev.customTools, [service]: [...existing, val] } };
                    }
                    return prev;
                  });
                  e.currentTarget.value = "";
                }
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {(formData.customTools[service] || []).map((t, i) => (
              <span key={i} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded border border-primary/20 flex items-center gap-1">
                {t}
                <X className="w-3 h-3 cursor-pointer" onClick={() => {
                  setFormData(prev => {
                    const existing = prev.customTools[service] || [];
                    return { ...prev, customTools: { ...prev.customTools, [service]: existing.filter(tool => tool !== t) } };
                  });
                }} />
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderStep8 = () => (
    <div className="space-y-6">
      <StepHeader
        onBack={handleBack}
        title="Do you have previous work to showcase?"
        subtitle="This helps clients evaluate your expertise"
      />
      <div className="space-y-4">
        {/* Yes Option */}
        <div
          className={cn(
            "rounded-xl border transition-all duration-300 overflow-hidden",
            formData.hasPreviousWork === "yes"
              ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/5"
              : "border-white/10 bg-white/5 hover:bg-white/10"
          )}
        >
          <button
            type="button"
            onClick={() => handleFieldChange("hasPreviousWork", "yes")}
            className="w-full flex items-center justify-between px-6 py-5 text-left"
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                formData.hasPreviousWork === "yes" ? "bg-primary text-primary-foreground" : "bg-white/10 text-white/60"
              )}>
                <Check className="w-5 h-5" />
              </div>
              <div>
                <span className={cn(
                  "block text-base font-semibold",
                  formData.hasPreviousWork === "yes" ? "text-primary" : "text-white"
                )}>Yes</span>
                <span className="text-white/50 text-sm">I can upload case studies & portfolio</span>
              </div>
            </div>
            {formData.hasPreviousWork === "yes" && <div className="w-2 h-2 rounded-full bg-primary" />}
          </button>

          <AnimatePresence>
            {formData.hasPreviousWork === "yes" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6 pt-2 space-y-6 border-t border-primary/10">
                  <p className="text-xs mb-2 flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span className="font-semibold text-primary">Recommendation:</span>
                    <span className="text-white/60">Detailed case studies significantly improve shortlisting chances.</span>
                  </p>
                  {/* Case Study Section */}
                  <div className="space-y-3">
                    <Label className="text-white/80 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" /> Case Study
                    </Label>
                    <div className="grid grid-cols-1 gap-3">
                      <Input
                        value={formData.caseStudyLink}
                        onChange={(e) => handleFieldChange("caseStudyLink", e.target.value)}
                        placeholder="Link to case study (e.g. Behance, Website)"
                        className="bg-black/20 border-white/10 text-white placeholder:text-white/30"
                      />
                    </div>
                  </div>

                  {/* Portfolio Section */}
                  <div className="space-y-3">
                    <Label className="text-white/80 flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-primary" /> Portfolio
                    </Label>
                    <div className="grid grid-cols-1 gap-3">
                      <Input
                        value={formData.portfolioLink}
                        onChange={(e) => handleFieldChange("portfolioLink", e.target.value)}
                        placeholder="Link to portfolio"
                        className="bg-black/20 border-white/10 text-white placeholder:text-white/30"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* No Option */}
        <div
          className={cn(
            "rounded-xl border transition-all duration-300 overflow-hidden",
            formData.hasPreviousWork === "no"
              ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/5"
              : "border-white/10 bg-white/5 hover:bg-white/10"
          )}
        >
          <button
            type="button"
            onClick={() => handleFieldChange("hasPreviousWork", "no")}
            className="w-full flex items-center justify-between px-6 py-5 text-left"
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                formData.hasPreviousWork === "no" ? "bg-primary text-primary-foreground" : "bg-white/10 text-white/60"
              )}>
                <span className="text-sm font-bold">N</span>
              </div>
              <div>
                <span className={cn(
                  "block text-base font-semibold",
                  formData.hasPreviousWork === "no" ? "text-primary" : "text-white"
                )}>No</span>
                <span className="text-white/50 text-sm">I'm new but skilled</span>
              </div>
            </div>
            {formData.hasPreviousWork === "no" && <div className="w-2 h-2 rounded-full bg-primary" />}
          </button>

          <AnimatePresence>
            {formData.hasPreviousWork === "no" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6 pt-2 space-y-4 border-t border-primary/10">
                  <p className="text-xs mb-2 flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span className="font-semibold text-primary">Recommendation:</span>
                    <span className="text-white/60">You can add case studies later to unlock more projects.</span>
                  </p>
                  <div className="space-y-3">
                    <Label className="text-white/80 flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-white/50" /> Portfolio (Optional)
                    </Label>
                    <div className="grid grid-cols-1 gap-3">
                      <Input
                        value={formData.portfolioLink}
                        onChange={(e) => handleFieldChange("portfolioLink", e.target.value)}
                        placeholder="Link to portfolio (optional)"
                        className="bg-black/20 border-white/10 text-white placeholder:text-white/30"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );

  const renderStep9 = () => (
    <div className="space-y-6">
      <StepHeader
        onBack={handleBack}
        title="Your starting price for these services?"
      />
      <div className="space-y-6">
        {formData.selectedServices.map((serviceKey) => {
          const serviceOption = SERVICE_OPTIONS.find(s => s.value === serviceKey);
          const serviceLabel = serviceOption ? serviceOption.label : serviceKey;
          const currentPrice = formData.startingPrices[serviceKey] || "";

          return (
            <div key={serviceKey} className="space-y-2">
              <Label className="text-white/80 text-sm ml-1">{serviceLabel}</Label>
              <div className="relative group">
                {/* Using Select instead of Input for Ranges */}
                <Select
                  value={currentPrice}
                  onValueChange={(val) => {
                    const newPrices = { ...formData.startingPrices, [serviceKey]: val };
                    handleFieldChange("startingPrices", newPrices);
                  }}
                >
                  <SelectTrigger className="w-full bg-white/5 border-white/10 text-white p-6 rounded-xl">
                    <SelectValue placeholder="Select starting price range" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
                    {STARTING_PRICE_RANGES.map((range) => (
                      <SelectItem key={range} value={range} className="focus:bg-white/10 focus:text-white cursor-pointer">
                        {range}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        })}

        <div className="p-4 mt-2 flex justify-center">
          <p className="text-xs flex items-center justify-center gap-2 text-center">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <span>
              <span className="font-semibold text-primary inline mr-1">Recommendation:</span>
              <span className="text-white/60">Pricing far above market rates may reduce your chances of being selected.</span>
            </span>
          </p>
        </div>
      </div>
    </div>
  );



  const renderStep10 = () => (
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

  const renderStep13 = () => (
    <div className="space-y-7">
      <StepHeader
        onBack={handleBack}
        title="Availability & Commitment"
        subtitle="Share your availability so we can match you faster"
      />

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <p className="text-white/90 text-sm font-semibold">Weekly hours</p>
              <p className="text-white/50 text-[11px]">Pick one option</p>
            </div>
          </div>
          <div className="flex flex-nowrap gap-3 overflow-x-auto justify-center">
            {HOURS_PER_WEEK_OPTIONS.map(option => (
              <OptionCard
                key={option.value}
                compact
                selected={formData.hoursPerWeek === option.value}
                onClick={() => handleFieldChange("hoursPerWeek", option.value)}
                label={option.label}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <p className="text-white/90 text-sm font-semibold">Working mode</p>
              <p className="text-white/50 text-[11px]">How you prefer to schedule</p>
            </div>
          </div>
          <div className="flex flex-nowrap gap-3 overflow-x-auto justify-center">
            {WORKING_MODE_OPTIONS.map(option => (
              <OptionCard
                key={option.value}
                compact
                selected={formData.workingMode === option.value}
                onClick={() => handleFieldChange("workingMode", option.value)}
                label={option.label}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <p className="text-white/90 text-sm font-semibold">Start timeline</p>
              <p className="text-white/50 text-[11px]">Earliest availability</p>
            </div>
          </div>
          <div className="flex flex-nowrap gap-3 overflow-x-auto justify-center">
            {START_TIMELINE_OPTIONS.map(option => (
              <OptionCard
                key={option.value}
                compact
                selected={formData.startTimeline === option.value}
                onClick={() => handleFieldChange("startTimeline", option.value)}
                label={option.label}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <p className="text-white/90 text-sm font-semibold">Long‑term availability</p>
              <p className="text-white/50 text-[11px]">Ongoing or short‑term</p>
            </div>
          </div>
          <div className="flex flex-nowrap gap-3 overflow-x-auto justify-center">
            {LONG_TERM_OPTIONS.map(option => (
              <OptionCard
                key={option.value}
                compact
                selected={formData.openToLongTerm === option.value}
                onClick={() => handleFieldChange("openToLongTerm", option.value)}
                label={option.label}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <p className="text-[11px] flex items-center gap-2 text-white/60">
          <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>
            <span className="font-semibold text-primary inline mr-1">Recommendation:</span>
            Clear availability helps us match you with the right projects.
          </span>
        </p>
      </div>
    </div>
  );

  const renderStep14 = () => (
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

      <div className="p-4 mt-2 flex justify-center">
        <p className="text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          <span className="text-center">
            <span className="font-semibold text-primary inline mr-1">Recommendation:</span>
            <span className="text-white/60">Minimum 3 revisions included by default.</span>
          </span>
        </p>
      </div>
    </div>
  );

  const renderStep17ProjectType = () => (
    <div className="space-y-8">
      <StepHeader
        onBack={handleBack}
        title="Project Type Preference"
      />

      <div className="max-w-3xl mx-auto text-center space-y-6">
        <p className="text-white/60 text-xs uppercase tracking-[0.2em]">Questions</p>

        <div className="space-y-3">
          <p className="text-white/80 text-sm font-medium">What type of projects do you prefer?</p>
          <div className="flex flex-nowrap gap-3 justify-center">
            {PROJECT_TYPE_OPTIONS.map(option => (
              <OptionCard
                key={option.value}
                compact
                selected={formData.projectTypePreference === option.value}
                onClick={() => handleFieldChange("projectTypePreference", option.value)}
                label={option.label}
                className="justify-center"
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-white/80 text-sm font-medium">Are you comfortable working with strict deadlines?</p>
          <div className="grid grid-cols-2 gap-3">
            {STRICT_DEADLINES_OPTIONS.map(option => (
              <OptionCard
                key={option.value}
                compact
                selected={formData.strictDeadlines === option.value}
                onClick={() => handleFieldChange("strictDeadlines", option.value)}
                label={option.label}
                className="justify-center"
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-white/80 text-sm font-medium">Do you prefer clearly defined scopes or evolving requirements?</p>
          <div className="grid grid-cols-2 gap-3">
            {SCOPE_PREFERENCE_OPTIONS.map(option => (
              <OptionCard
                key={option.value}
                compact
                selected={formData.scopePreference === option.value}
                onClick={() => handleFieldChange("scopePreference", option.value)}
                label={option.label}
                className="justify-center"
              />
            ))}
          </div>
        </div>
      </div>

      <p className="text-white/50 text-xs text-center">
        <span className="font-semibold text-primary inline mr-1">Recommendation:</span>
        Choosing the right project type improves long-term success.
      </p>
    </div>
  );

  const renderStep18Reliability = () => (
    <div className="space-y-8">
      <StepHeader
        onBack={handleBack}
        title="Reliability & Work Ethics"
      />

      <div className="max-w-3xl mx-auto text-center space-y-6">

        <div className="space-y-3">
          <p className="text-white/80 text-sm font-medium">Have you ever missed a project deadline?</p>
          <div className="grid grid-cols-3 gap-3">
            {DEADLINE_HISTORY_OPTIONS.map(option => (
              <OptionCard
                key={option.value}
                compact
                selected={formData.missedDeadlines === option.value}
                onClick={() => handleFieldChange("missedDeadlines", option.value)}
                label={option.label}
                className="justify-center"
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-white/80 text-sm font-medium">How do you handle delays?</p>
          <div className="flex flex-nowrap gap-3 justify-center">
            {DELAY_HANDLING_OPTIONS.map(option => (
              <OptionCard
                key={option.value}
                compact
                selected={formData.delayHandling === option.value}
                onClick={() => handleFieldChange("delayHandling", option.value)}
                label={option.label}
                className="justify-center"
              />
            ))}
          </div>
        </div>
      </div>

      <p className="text-white/50 text-xs text-center">
        <span className="font-semibold text-primary inline mr-1">Recommendation:</span>
        Honest answers help set realistic client expectations.
      </p>
    </div>
  );

  const renderStep17 = () => (
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

  const renderStep20 = () => (
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

  const renderStep21 = () => (
    <div className="space-y-8">
      <StepHeader
        onBack={handleBack}
        title="Communication & Platform Usage"
        subtitle="Help us set the right expectations with clients"
      />

      <div className="max-w-3xl mx-auto text-center space-y-6">
        <div className="space-y-3">
          <p className="text-white/80 text-sm font-medium">Are you comfortable communicating only via in-platform chat?</p>
          <div className="grid grid-cols-2 gap-3">
            {PLATFORM_CHAT_ONLY_OPTIONS.map(option => (
              <OptionCard
                key={option.value}
                compact
                selected={formData.platformChatOnly === option.value}
                onClick={() => handleFieldChange("platformChatOnly", option.value)}
                label={option.label}
                className="justify-center"
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-white/80 text-sm font-medium">How often will you share project updates on the platform?</p>
          <div className="flex flex-nowrap gap-3 justify-center">
            {UPDATE_FREQUENCY_OPTIONS.map(option => (
              <OptionCard
                key={option.value}
                compact
                selected={formData.updateFrequency === option.value}
                onClick={() => handleFieldChange("updateFrequency", option.value)}
                label={option.label}
                className="justify-center"
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-white/80 text-sm font-medium">Are you willing to keep all project-related discussions on Catalance?</p>
          <div className="grid grid-cols-2 gap-3">
            {PLATFORM_CHAT_ONLY_OPTIONS.map(option => (
              <OptionCard
                key={option.value}
                compact
                selected={formData.keepDiscussionsOnPlatform === option.value}
                onClick={() => handleFieldChange("keepDiscussionsOnPlatform", option.value)}
                label={option.label}
                className="justify-center"
              />
            ))}
          </div>
        </div>
      </div>

      <p className="text-white/50 text-xs text-center">
        <span className="font-semibold text-primary inline mr-1">Recommendation:</span>
        Keeping communication on the platform helps us track work and resolve issues faster.
      </p>
    </div>
  );

  const renderStep22 = () => (
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

  const renderStep23 = () => (
    <div className="space-y-6">
      <StepHeader
        onBack={handleBack}
        title="Your Timezone"
        subtitle="This helps us match you with clients in compatible time zones"
      />
      <div className="space-y-4">
        <Select
          value={formData.timezone}
          onValueChange={(value) => handleFieldChange("timezone", value)}
        >
          <SelectTrigger className="w-full bg-white/5 border-white/10 text-white p-6 rounded-xl">
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent className="bg-[#1A1A1A] border-white/10 text-white max-h-[300px]">
            {TIMEZONE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="focus:bg-white/10 focus:text-white cursor-pointer">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderStep26 = () => (
    <div className="space-y-4">
      <StepHeader
        onBack={handleBack}
        title="Final Intent"
      />
      <div className="space-y-4">
        <p className="text-white/80 text-sm font-medium text-center">
          Why do you want to work on Catelance?
        </p>
        <Textarea
          value={formData.whyCatalance}
          onChange={(e) => handleFieldChange("whyCatalance", e.target.value)}
          placeholder="Short, serious answer"
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[150px]"
        />
        <label className="flex items-center gap-3 text-white/70 text-sm">
          <input
            type="checkbox"
            checked={formData.termsAccepted}
            onChange={(e) => handleFieldChange("termsAccepted", e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-white/10 text-primary focus:ring-primary/40"
          />
          <span>Terms &amp; Conditions</span>
        </label>
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
      case 11: return renderStep13(); // Availability (was step 13)
      case 12: return renderStep14(); // Revisions (was step 14)
      case 13: return renderStep17ProjectType(); // Project Type (was step 17)
      case 14: return renderStep18Reliability(); // Reliability (was step 18)
      case 15: return renderStep17(); // Partial Scope (was step 19)
      case 16: return renderStep20(); // Re-quote Policy (was step 22)
      case 17: return renderStep21(); // Communication (was step 23)
      case 18: return renderStep22(); // Response Time (was step 24)
      case 19: return renderStep23(); // Timezone (was step 25)
      case 20: return renderStep26(); // Motivation (was step 28)
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
      </div>
    </div>
  );
};

export default FreelancerMultiStepForm;
