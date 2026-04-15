export const FREELANCER_SERVICE_OPTIONS = [
  { id: "branding", label: "Branding", icon: "sparkles" },
  { id: "web_development", label: "Web Development", icon: "globe" },
  { id: "seo", label: "SEO", icon: "search" },
  {
    id: "social_media_marketing",
    label: "Social Media Management",
    icon: "share2",
  },
  {
    id: "paid_advertising",
    label: "Performance Marketing",
    icon: "trendingUp",
  },
  { id: "app_development", label: "App Development", icon: "smartphone" },
  {
    id: "software_development",
    label: "Software Development",
    icon: "code",
  },
  { id: "lead_generation", label: "Lead Generation", icon: "target" },
  { id: "video_services", label: "Video Services", icon: "video" },
  { id: "writing_content", label: "Writing & Content", icon: "penTool" },
  {
    id: "customer_support",
    label: "Customer Support Services",
    icon: "messageCircle",
  },
  {
    id: "influencer_marketing",
    label: "Influencer Marketing",
    icon: "star",
  },
  { id: "ugc_marketing", label: "UGC Marketing", icon: "clapperboard" },
  { id: "ai_automation", label: "AI Automation", icon: "bot" },
  {
    id: "whatsapp_chatbot",
    label: "WhatsApp Chatbot",
    icon: "messageSquare",
  },
  {
    id: "creative_design",
    label: "Creative & Design",
    icon: "palette",
  },
  { id: "3d_modeling", label: "3D Modeling", icon: "box" },
  { id: "cgi_videos", label: "CGI Video Services", icon: "film" },
  { id: "crm_erp", label: "CRM & ERP Solutions", icon: "barChart3" },
  { id: "voice_agent", label: "Voice Agent / AI Calling", icon: "mic" },
];

export const FREELANCER_ONBOARDING_SLIDES = [
  {
    id: "welcome",
    progressValue: 4,
    continueLabel: "Continue",
  },
  {
    id: "workPreference",
    progressValue: 8,
    continueLabel: "Continue",
  },
  {
    id: "individualProof",
    progressValue: 12,
    continueLabel: "Continue",
  },
  {
    id: "basicProfile",
    title: "Complete Your Profile",
    description: "Let's establish your professional presence",
    progressValue: 16,
    footerMode: "profileActions",
    countryOptions: ["India", "United States", "United Kingdom"],
    stateOptions: ["Maharashtra", "Karnataka", "Delhi NCR"],
    languageOptions: ["English", "Hindi", "Marathi", "Spanish"],
  },
  {
    id: "services",
    title: "Which Services Do You Want To Offer?",
    description: "Select at least 1 service. You can choose as many as you want.",
    progressValue: 20,
    continueLabel: "Continue",
    services: FREELANCER_SERVICE_OPTIONS,
  },
];
