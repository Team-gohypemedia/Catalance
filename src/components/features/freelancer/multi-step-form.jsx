"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  ChevronRight,
  X,
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
  Trash2,
  ExternalLink,
  Link2,
  DollarSign,
  ClipboardCheck,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { COUNTRY_CODES } from "@/shared/data/countryCodes";

import { API_BASE_URL, signup, verifyOtp } from "@/shared/lib/api-client";
import { useAuth } from "@/shared/context/AuthContext";

const PROFESSIONAL_FIELD_ICONS = {
  "Development & Tech": "💻",
  "Digital Marketing": "📱",
  "Creative & Design": "🎨",
  "Writing & Content": "✍️",
  "Lead Generation": "🎯",
  "Video Services": "🎬",
  "Lifestyle & Personal": "💆",
  "Customer Support": "💬",
  "Administrative Services": "📊",
  "Audio Services": "🎧",
};

const ROLE_OPTIONS = [
  { value: "individual", label: "Individual Freelancer", icon: User },
  { value: "agency", label: "Agency / Studio", icon: Building2 },
  { value: "part-time", label: "Part-time Freelancer", icon: Clock },
];

const SERVICE_OPTIONS = [
  { value: "website_development", label: "Website Development", icon: Globe },
  { value: "app_development", label: "App Development", icon: Smartphone },
  { value: "software_development", label: "Software Development", icon: Code },
  { value: "lead_generation", label: "Lead Generation", icon: Target },
  { value: "video_services", label: "Video Services", icon: Video },
  { value: "seo_optimization", label: "SEO Optimization", icon: Search },
  {
    value: "social_media_management",
    label: "Social Media Management",
    icon: Share2,
  },
  {
    value: "performance_marketing",
    label: "Performance Marketing",
    icon: TrendingUp,
  },
  { value: "creative_design", label: "Creative & Design", icon: Palette },
  { value: "writing_content", label: "Writing & Content", icon: PenTool },
  { value: "customer_support", label: "Customer Support", icon: MessageCircle },
  { value: "influencer_ugc", label: "Influencer / UGC Marketing", icon: Star },
  { value: "crm_erp", label: "CRM & ERP", icon: BarChart3 },
  { value: "ai_automation", label: "AI Automation", icon: Bot },
  { value: "whatsapp_chatbot", label: "WhatsApp Chatbot", icon: MessageSquare },
  { value: "3d_modeling", label: "3D Modeling", icon: Box },
  { value: "cgi_videos", label: "CGI Videos", icon: Film },
];

const EXPERIENCE_YEARS_OPTIONS = [
  { value: "less_than_1", label: "Less than 1 year" },
  { value: "1_3", label: "1–3 years" },
  { value: "3_5", label: "3–5 years" },
  { value: "5_plus", label: "5+ years" },
];

const WORKING_LEVEL_OPTIONS = [
  { value: "beginner", label: "Beginner", description: "Learning stage" },
  {
    value: "intermediate",
    label: "Intermediate",
    description: "Can handle projects independently",
  },
  {
    value: "advanced",
    label: "Advanced",
    description: "Can handle complex projects",
  },
];

const TOOLS_BY_SERVICE = {
  website_development: [
    "WordPress",
    "Webflow",
    "Shopify",
    "Wix",
    "Squarespace",
    "Figma",
    "HTML/CSS",
    "JavaScript",
    "React",
    "Vue.js",
    "Next.js",
  ],
  app_development: [
    "React Native",
    "Flutter",
    "Swift",
    "Kotlin",
    "Xcode",
    "Android Studio",
    "Firebase",
    "Expo",
  ],
  software_development: [
    "Python",
    "Java",
    "C++",
    "Node.js",
    "Docker",
    "Git",
    "AWS",
    "Azure",
    "PostgreSQL",
    "MongoDB",
  ],
  lead_generation: [
    "Apollo.io",
    "LinkedIn Sales Navigator",
    "Hunter.io",
    "ZoomInfo",
    "Lusha",
    "Snov.io",
    "Lemlist",
  ],
  video_services: [
    "Adobe Premiere Pro",
    "Final Cut Pro",
    "DaVinci Resolve",
    "After Effects",
    "CapCut",
    "Filmora",
  ],
  seo_optimization: [
    "Ahrefs",
    "SEMrush",
    "Google Search Console",
    "Screaming Frog",
    "Moz",
    "Ubersuggest",
    "Yoast SEO",
  ],
  social_media_management: [
    "Hootsuite",
    "Buffer",
    "Sprout Social",
    "Later",
    "Canva",
    "Meta Business Suite",
    "TikTok Creator Studio",
  ],
  performance_marketing: [
    "Google Ads",
    "Facebook Ads Manager",
    "TikTok Ads",
    "LinkedIn Ads",
    "Google Analytics",
    "Hotjar",
  ],
  creative_design: [
    "Figma",
    "Adobe Photoshop",
    "Illustrator",
    "Canva",
    "Sketch",
    "InDesign",
    "Affinity Designer",
  ],
  writing_content: [
    "Google Docs",
    "Grammarly",
    "Hemingway",
    "Notion",
    "WordPress",
    "Medium",
    "Jasper AI",
  ],
  customer_support: [
    "Zendesk",
    "Freshdesk",
    "Intercom",
    "HubSpot",
    "LiveChat",
    "Crisp",
    "Tidio",
  ],
  influencer_ugc: [
    "Instagram",
    "TikTok",
    "YouTube Studio",
    "Canva",
    "CapCut",
    "Linktree",
    "Later",
  ],
  crm_erp: [
    "Salesforce",
    "HubSpot",
    "Zoho CRM",
    "SAP",
    "Oracle",
    "Microsoft Dynamics",
    "Pipedrive",
  ],
  ai_automation: [
    "Zapier",
    "Make (Integromat)",
    "n8n",
    "ChatGPT API",
    "Python",
    "LangChain",
    "Flowise",
  ],
  whatsapp_chatbot: [
    "Twilio",
    "WhatsApp Business API",
    "Chatfuel",
    "ManyChat",
    "Wati",
    "Respond.io",
  ],
  "3d_modeling": [
    "Blender",
    "Maya",
    "Cinema 4D",
    "3ds Max",
    "ZBrush",
    "SketchUp",
    "Houdini",
  ],
  cgi_videos: [
    "Blender",
    "After Effects",
    "Cinema 4D",
    "Unreal Engine",
    "Houdini",
    "Nuke",
    "DaVinci Resolve",
  ],
};

const PORTFOLIO_TYPE_OPTIONS = [
  {
    value: "live_links",
    label: "Live links",
    description: "Links to live websites or apps",
  },
  {
    value: "drive_folder",
    label: "Drive folder",
    description: "Google Drive or cloud storage",
  },
  {
    value: "case_studies",
    label: "Case studies",
    description: "Detailed project breakdowns",
  },
  {
    value: "demo_samples",
    label: "Demo samples",
    description: "Sample work or mockups",
  },
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
  { value: "entry_level", label: "Entry-level" },
  { value: "mid_range", label: "Mid-range" },
  { value: "premium", label: "Premium" },
];

const STEPS = [
  { id: 1, key: "role", label: "Role & Intent" },
  { id: 2, key: "skill_validation", label: "Skill Validation" },
  { id: 3, key: "portfolio_proof", label: "Portfolio & Proof" },
  { id: 4, key: "work_style", label: "Work Style" },
  { id: 5, key: "pricing_availability", label: "Pricing & Availability" },
  { id: 6, key: "sop_alignment", label: "SOP & Alignment" },
  { id: 7, key: "professional", label: "Professional" },
  { id: 8, key: "specialty", label: "Specialty" },
  { id: 9, key: "skills", label: "Skills" },
  { id: 10, key: "experience", label: "Experience" },
  { id: 11, key: "portfolio", label: "Portfolio Links" },
  { id: 12, key: "terms", label: "Terms" },
  { id: 13, key: "personal", label: "Personal info" },
];

const PROFESSIONAL_FIELDS = [
  "Development & Tech",
  "Digital Marketing",
  "Creative & Design",
  "Writing & Content",
  "Lead Generation",
  "Video Services",
  ,
  "Lifestyle & Personal",
  "Customer Support",
  "Administrative Services",
  "Audio Services",
];

const SPECIALTY_SKILLS_MAP = {
  "Front-end Development": [
    "React",
    "Vue.js",
    "Angular",
    "Tailwind CSS",
    "TypeScript",
    "Next.js",
    "Svelte",
    "WordPress",
    "Shopify",
    "Webflow",
    "HTML5",
    "CSS3",
    "Bootstrap",
  ],
  "Back-end Development": [
    "Node.js",
    "Python",
    "Java",
    "C#",
    "PostgreSQL",
    "MongoDB",
    "Docker",
    "PHP",
    "Laravel",
    "Ruby on Rails",
    "Go",
    "Redis",
    "GraphQL",
  ],
  "Full-stack Development": [
    "React",
    "Node.js",
    "PostgreSQL",
    "Docker",
    "TypeScript",
    "AWS",
    "Git",
    "Next.js",
    "GraphQL",
    "Firebase",
    "Supabase",
    "PHP",
    "Laravel",
  ],
  "Mobile App Development": [
    "Swift (iOS)",
    "Kotlin (Android)",
    "React Native",
    "Flutter",
    "Firebase",
    "Ionic",
    "Xamarin",
  ],
  "DevOps & Cloud": [
    "AWS",
    "Docker",
    "Kubernetes",
    "CI/CD",
    "Linux",
    "Terraform",
    "GitHub Actions",
    "Azure",
    "Google Cloud",
    "Jenkins",
    "Ansible",
  ],
  "Data & Analytics": [
    "Python",
    "SQL",
    "Tableau",
    "Power BI",
    "Machine Learning",
    "Pandas",
    "Data Science",
    "R",
    "BigQuery",
    "Apache Spark",
    "Hadoop",
  ],
  "SEO Specialist": [
    "SEO",
    "SEM",
    "Google Analytics",
    "Keyword Research",
    "Content Optimization",
    "Link Building",
    "Ahrefs",
    "Semrush",
    "Google Search Console",
  ],
  "Performance Marketer": [
    "Google Ads",
    "Facebook Ads",
    "Conversion Optimization",
    "A/B Testing",
    "Analytics",
    "LinkedIn Ads",
    "TikTok Ads",
  ],
  "Content Marketing": [
    "Content Writing",
    "Copywriting",
    "Blog Writing",
    "SEO Writing",
    "Social Media Content",
    "Email Copy",
    "Technical Writing",
  ],
  "Email Marketing": [
    "Email Campaigns",
    "Automation",
    "Segmentation",
    "Copy Writing",
    "A/B Testing",
    "Mailchimp",
    "Klaviyo",
    "HubSpot",
  ],
  "UI/UX Design": [
    "Figma",
    "Sketch",
    "Adobe XD",
    "Prototyping",
    "User Research",
    "Wireframing",
    "InVision",
    "Framer",
  ],
  "Graphic Design": [
    "Adobe Creative Suite",
    "Canva",
    "Logo Design",
    "Branding",
    "Typography",
    "Illustration",
    "Photoshop",
    "Illustrator",
    "InDesign",
  ],
  "Product Design": [
    "Figma",
    "Prototyping",
    "User Testing",
    "Design Systems",
    "Interaction Design",
    "Product Strategy",
  ],
  "Brand Identity": [
    "Logo Design",
    "Brand Strategy",
    "Color Theory",
    "Typography",
    "Visual Identity",
    "Brand Guidelines",
  ],
  "WordPress Development": [
    "Theme Development",
    "Plugin Development",
    "Elementor",
    "WooCommerce",
    "PHP",
    "Speed Optimization",
    "Security",
    "Divi",
  ],
  "Shopify Development": [
    "Liquid",
    "Theme Customization",
    "Shopify Plus",
    "App Development",
    "Store Setup",
    "Migration",
    "Headless Shopify",
  ],
  "CMS & No-Code": [
    "Webflow",
    "Wix",
    "Squarespace",
    "Bubble",
    "Framer",
    "Zapier",
    "Airtable",
  ],
  "General Specialist": [
    "General Services",
    "Consulting",
    "Strategy",
    "Project Management",
    "Virtual Assistance",
  ],
};

const EXPERIENCE_OPTIONS = ["Fresher", "0-1", "1-3", "3-5", "5-8", "10+"];

const specialtyOptionsByField = {
  "Development & Tech": [
    "Front-end Development",
    "Back-end Development",
    "Full-stack Development",
    "Mobile App Development",
    "DevOps & Cloud",
    "DevOps & Cloud",
    "Data & Analytics",
    "WordPress Development",
    "Shopify Development",
    "CMS & No-Code",
  ],
  "Digital Marketing": [
    "SEO Specialist",
    "Performance Marketer",
    "Content Marketing",
    "Email Marketing",
  ],
  "Creative & Design": [
    "UI/UX Design",
    "Graphic Design",
    "Product Design",
    "Brand Identity",
  ],
};

const fallbackSpecialtyOptions = [
  "General Specialist",
  "Consultant",
  "Strategist",
  "Project Specialist",
];

const FreelancerMultiStepForm = () => {
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
    selectedTools: [],
    hasPreviousWork: "",
    portfolioTypes: [],
    hasWorkedWithClients: "",
    portfolioLink: "",
    onboardingProjects: [],
    workPreference: "",
    hoursPerDay: "",
    revisionHandling: "",
    pricingModel: "",
    projectRange: "",
    partialScope: "",
    sopAgreement: "",
    scopeFreezeAgreement: "",
    requoteAgreement: "",
    professionalField: "",
    specialty: [],
    skills: [],
    customSkillInput: "",
    experience: "",
    portfolioWebsite: "",
    linkedinProfile: "",
    githubProfile: "",
    portfolioProjects: [],
    portfolioFileName: "",
    termsAccepted: false,
    fullName: "",
    email: "",
    password: "",
    phone: "",
    countryCode: "US",
    location: "",
  });

  const navigate = useNavigate();
  const { login: setAuthSession } = useAuth();

  const totalSteps = STEPS.length;
  const progress = Math.round((currentStep / totalSteps) * 100);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (stepError) {
      setStepError("");
    }
  };

  const toggleSpecialty = (specialtyValue) => {
    setFormData((prev) => {
      const currentSpecialties = Array.isArray(prev.specialty)
        ? prev.specialty
        : [];
      const exists = currentSpecialties.includes(specialtyValue);
      return {
        ...prev,
        specialty: exists
          ? currentSpecialties.filter((s) => s !== specialtyValue)
          : [...currentSpecialties, specialtyValue],
      };
    });
    if (stepError) setStepError("");
  };

  const toggleSkill = (skill) => {
    setFormData((prev) => {
      const exists = prev.skills.includes(skill);
      return {
        ...prev,
        skills: exists
          ? prev.skills.filter((s) => s !== skill)
          : [...prev.skills, skill],
      };
    });
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const handleAddCustomSkill = () => {
    const value = formData.customSkillInput.trim();
    if (!value) return;

    setFormData((prev) => {
      if (prev.skills.includes(value)) {
        return { ...prev, customSkillInput: "" };
      }

      return {
        ...prev,
        skills: [...prev.skills, value],
        customSkillInput: "",
      };
    });
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    handleFieldChange("portfolioFileName", file ? file.name : "");
  };

  const toggleService = (serviceValue) => {
    setFormData((prev) => {
      const currentServices = Array.isArray(prev.selectedServices)
        ? prev.selectedServices
        : [];
      const exists = currentServices.includes(serviceValue);
      return {
        ...prev,
        selectedServices: exists
          ? currentServices.filter((s) => s !== serviceValue)
          : [...currentServices, serviceValue],
      };
    });
    if (stepError) setStepError("");
  };

  const toggleTool = (tool) => {
    setFormData((prev) => {
      const currentTools = Array.isArray(prev.selectedTools)
        ? prev.selectedTools
        : [];
      const exists = currentTools.includes(tool);
      return {
        ...prev,
        selectedTools: exists
          ? currentTools.filter((t) => t !== tool)
          : [...currentTools, tool],
      };
    });
    if (stepError) setStepError("");
  };

  const togglePortfolioType = (type) => {
    setFormData((prev) => {
      const currentTypes = Array.isArray(prev.portfolioTypes)
        ? prev.portfolioTypes
        : [];
      const exists = currentTypes.includes(type);
      return {
        ...prev,
        portfolioTypes: exists
          ? currentTypes.filter((t) => t !== type)
          : [...currentTypes, type],
      };
    });
    if (stepError) setStepError("");
  };

  const addOnboardingProject = (project) => {
    setFormData((prev) => ({
      ...prev,
      onboardingProjects: [...(prev.onboardingProjects || []), project],
    }));
    if (stepError) setStepError("");
  };

  const removeOnboardingProject = (index) => {
    setFormData((prev) => ({
      ...prev,
      onboardingProjects: prev.onboardingProjects.filter((_, i) => i !== index),
    }));
  };

  const validateStep = (step, data) => {
    switch (step) {
      case 1: {
        if (!data.role) {
          return "Please select your role type to continue.";
        }
        if (!data.selectedServices || data.selectedServices.length === 0) {
          return "Please select at least one service you want to offer.";
        }
        return "";
      }
      case 2: {
        if (!data.experienceYears) {
          return "Please select your years of experience.";
        }
        if (!data.workingLevel) {
          return "Please select your working level.";
        }
        if (!data.selectedTools || data.selectedTools.length === 0) {
          return "Please select at least one tool you actively use.";
        }
        return "";
      }
      case 3: {
        if (!data.hasPreviousWork) {
          return "Please indicate if you have previous work to showcase.";
        }
        if (!data.hasWorkedWithClients) {
          return "Please indicate if you have worked with clients before.";
        }
        return "";
      }
      case 4: {
        if (!data.workPreference) {
          return "Please select your preferred work style.";
        }
        if (!data.hoursPerDay) {
          return "Please select how many hours you can dedicate per day.";
        }
        if (!data.revisionHandling) {
          return "Please select how you handle revisions.";
        }
        return "";
      }
      case 5: {
        if (!data.pricingModel) {
          return "Please select a pricing model.";
        }
        if (!data.projectRange) {
          return "Please select your typical project range.";
        }
        if (!data.partialScope) {
          return "Please indicate if you are open to partial-scope projects.";
        }
        return "";
      }
      case 6: {
        if (!data.sopAgreement) {
          return "Please confirm if you agree to follow Catalance SOPs.";
        }
        if (data.sopAgreement === "no") {
          return "You must agree to follow Catalance SOPs to proceed.";
        }
        if (!data.scopeFreezeAgreement) {
          return "Please confirm your understanding of scope freeze.";
        }
        if (data.scopeFreezeAgreement === "no") {
          return "You must agree to the scope freeze policy to proceed.";
        }
        if (!data.requoteAgreement) {
          return "Please confirm your agreement on re-quoting policy.";
        }
        if (data.requoteAgreement === "no") {
          return "You must agree to the re-quoting policy to proceed.";
        }
        return "";
      }
      case 7: {
        if (!data.professionalField) {
          return "Please choose your professional field to continue.";
        }
        return "";
      }
      case 8: {
        if (!data.specialty || data.specialty.length === 0) {
          return "Please select at least one specialty to continue.";
        }
        return "";
      }
      case 9: {
        if (!data.skills || data.skills.length === 0) {
          return "Add at least one skill before continuing.";
        }
        return "";
      }
      case 10: {
        if (!data.experience) {
          return "Please select your years of experience.";
        }
        return "";
      }
      case 11: {
        if (data.experience === "Fresher") {
          if (!data.linkedinProfile.trim()) {
            return "Please provide your LinkedIn profile.";
          }
          if (!data.portfolioFileName) {
            return "Please upload your resume/portfolio file.";
          }
          return "";
        }

        if (!data.portfolioWebsite.trim() || !data.linkedinProfile.trim()) {
          return "Please provide both your portfolio website and LinkedIn profile.";
        }
        if (
          data.professionalField === "Development & Tech" &&
          !data.githubProfile.trim()
        ) {
          return "As a developer, you must provide your GitHub profile URL.";
        }
        return "";
      }
      case 12: {
        if (!data.termsAccepted) {
          return "You must agree to the Terms and Conditions to continue.";
        }
        return "";
      }
      case 13: {
        if (
          !data.fullName.trim() ||
          !data.email.trim() ||
          !data.password.trim() ||
          !data.location.trim()
        ) {
          return "Full name, email, password, and location are required.";
        }
        if (!data.email.includes("@")) {
          return "Please enter a valid email address.";
        }
        if (data.password.trim().length < 8) {
          return "Password must be at least 8 characters long.";
        }
        return "";
      }
      default:
        return "";
    }
  };

  const findFirstInvalidStep = (targetStep = totalSteps, data = formData) => {
    for (let step = 1; step <= targetStep; step += 1) {
      const message = validateStep(step, data);
      if (message) {
        return { step, message };
      }
    }
    return null;
  };

  const handleNext = () => {
    const validation = validateStep(currentStep, formData);
    if (validation) {
      setStepError(validation);
      toast.error(validation);
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      setStepError("");
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setStepError("");
    }
  };

  const handleGoToStep = (targetStep) => {
    if (targetStep === currentStep) return;

    if (targetStep < currentStep) {
      setCurrentStep(targetStep);
      setStepError("");
      return;
    }

    const validation = findFirstInvalidStep(targetStep, formData);
    if (validation) {
      setCurrentStep(validation.step);
      setStepError(validation.message);
      toast.error(validation.message);
      return;
    }

    setCurrentStep(targetStep);
    setStepError("");
  };

  const handleSubmit = async () => {
    const validation = findFirstInvalidStep(totalSteps, formData);
    if (validation) {
      setCurrentStep(validation.step);
      setStepError(validation.message);
      toast.error(validation.message);
      return;
    }

    setIsSubmitting(true);
    setStepError("");

    try {
      const normalizedEmail = formData.email.trim().toLowerCase();
      const freelancerProfile = {
        category: formData.professionalField,
        specialty: formData.specialty,
        experience: formData.experience,
        skills: formData.skills,
        portfolio: {
          portfolioUrl: formData.portfolioWebsite,
          linkedinUrl: formData.linkedinProfile,
          githubUrl: formData.githubProfile,
        },
        acceptedTerms: formData.termsAccepted,
        phone: (() => {
          const country = COUNTRY_CODES.find(
            (c) => c.code === formData.countryCode
          );
          const dialCode = country ? country.dial_code : "+1";
          return `${dialCode} ${formData.phone}`;
        })(),
        location: formData.location,
      };

      const authPayload = await signup({
        fullName: formData.fullName.trim(),
        email: normalizedEmail,
        password: formData.password,
        role: "FREELANCER",
        freelancerProfile,
      });

      // If signup returns an accessToken, it means verification wasn't required (legacy or changed)
      // Otherwise, it prompts for OTP
      if (!authPayload?.accessToken) {
        setIsVerifying(true);
        setIsSubmitting(false);
        toast.success("Verification code sent to your email!");
        return;
      }

      setAuthSession(authPayload?.user, authPayload?.accessToken);

      const profilePayload = {
        personal: {
          name: formData.fullName.trim(),
          email: normalizedEmail,
          phone: (() => {
            const country = COUNTRY_CODES.find(
              (c) => c.code === formData.countryCode
            );
            const dialCode = country ? country.dial_code : "+1";
            return `${dialCode} ${formData.phone}`;
          })(),
          location: formData.location.trim(),
        },
        skills: Array.isArray(formData.skills)
          ? formData.skills.filter(Boolean)
          : [],
        workExperience: [],
        services: [
          formData.professionalField,
          ...(Array.isArray(formData.specialty)
            ? formData.specialty
            : [formData.specialty]),
        ].filter(Boolean),
      };

      try {
        const baseUrl = API_BASE_URL || "/api";
        const response = await fetch(`${baseUrl}/profile`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authPayload?.accessToken
              ? { Authorization: `Bearer ${authPayload.accessToken}` }
              : {}),
          },
          body: JSON.stringify(profilePayload),
        });

        if (!response.ok) {
          console.warn(
            "Unable to persist initial profile details",
            response.status
          );
        }
      } catch (error) {
        console.warn("Profile save during onboarding failed:", error);
      }

      toast.success("Your freelancer account has been created.");
      navigate("/freelancer", { replace: true });
    } catch (error) {
      const message =
        error?.message || "Unable to create your freelancer account right now.";
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

      // Now create the profile
      const profilePayload = {
        personal: {
          name: formData.fullName.trim(),
          email: normalizedEmail,
          phone: (() => {
            const country = COUNTRY_CODES.find(
              (c) => c.code === formData.countryCode
            );
            const dialCode = country ? country.dial_code : "+1";
            return `${dialCode} ${formData.phone}`;
          })(),
          location: formData.location.trim(),
        },
        skills: Array.isArray(formData.skills)
          ? formData.skills.filter(Boolean)
          : [],
        workExperience: [],
        services: [
          formData.professionalField,
          ...(Array.isArray(formData.specialty)
            ? formData.specialty
            : [formData.specialty]),
        ].filter(Boolean),
      };

      try {
        const baseUrl = API_BASE_URL || "/api";
        const response = await fetch(`${baseUrl}/profile`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authPayload.accessToken}`,
          },
          body: JSON.stringify(profilePayload),
        });
        if (!response.ok)
          console.warn("Profile creation warn:", response.status);
      } catch (err) {
        console.warn("Profile creation failed:", err);
      }

      toast.success("Account verified and created successfully!");
      navigate("/freelancer", { replace: true });
    } catch (error) {
      toast.error(error.message || "Invalid verification code");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentSpecialtyOptions =
    specialtyOptionsByField[formData.professionalField] ||
    fallbackSpecialtyOptions;

  const currentSpecialtySkills = React.useMemo(() => {
    const specialties = Array.isArray(formData.specialty)
      ? formData.specialty
      : [formData.specialty];

    // Collect all skills from all selected specialties
    const allSkills = specialties.flatMap(
      (spec) => SPECIALTY_SKILLS_MAP[spec] || []
    );

    // Return unique skills
    return [...new Set(allSkills)];
  }, [formData.specialty]);

  const isLastStep = currentStep === totalSteps;
  const disableNext =
    isSubmitting || (currentStep === 12 && !formData.termsAccepted);

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-8 md:py-12 relative overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <svg
          className="w-full h-full opacity-10"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="var(--grid-line-color)"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        {/* Animated orbs in primary tone */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/25 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="w-full max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center relative z-10 mt-5">
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-2">
            Become a Freelancer
          </h1>
          <p className="text-sm md:text-base max-w-md mx-auto text-muted-foreground">
            Join our community and start earning from your expertise
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 px-1 relative z-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-xs font-semibold text-primary">
              {progress}% Complete
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="mb-12 px-1 relative z-10">
          <div className="grid grid-cols-8 gap-2">
            {STEPS.map((step) => {
              const isCompleted = currentStep > step.id;
              const isActive = currentStep === step.id;

              return (
                <button
                  key={step.id}
                  onClick={() => handleGoToStep(step.id)}
                  className={cn(
                    "relative flex flex-col items-center gap-2 group transition-all duration-300",
                    isActive || isCompleted
                      ? "cursor-pointer"
                      : "cursor-not-allowed opacity-60"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg font-semibold text-sm transition-all duration-300 transform shadow-sm",
                      isCompleted
                        ? "bg-primary text-primary-foreground shadow-md"
                        : isActive
                          ? "bg-card text-primary border-2 border-primary"
                          : "bg-muted text-muted-foreground border border-border"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span>{step.id}</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium text-center transition-all duration-300",
                      isActive || isCompleted
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10 items-stretch">
          {/* Left Panel - Form Content */}
          <div className="lg:col-span-2">
            <Card className="border border-border bg-card text-card-foreground shadow-xl backdrop-blur-sm h-full min-h-[500px] lg:min-h-[540px]">
              <CardContent className="pt-8 pb-6 space-y-6 flex flex-col justify-between h-full">
                {/* Step Content */}
                <div className="space-y-6">
                  {isVerifying ? (
                    <div className="space-y-6 py-4 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                          <span className="text-3xl">✉️</span>
                        </div>
                        <h2 className="text-2xl font-semibold text-foreground">
                          Verify Your Email
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                          We sent a verification code to{" "}
                          <span className="font-medium text-foreground">
                            {formData.email}
                          </span>
                        </p>
                      </div>

                      <div className="space-y-4 max-w-sm mx-auto">
                        <Input
                          type="text"
                          value={otp}
                          onChange={(e) =>
                            setOtp(
                              e.target.value.replace(/[^0-9]/g, "").slice(0, 6)
                            )
                          }
                          placeholder="000000"
                          className="text-center text-3xl tracking-[0.5em] font-mono h-16"
                          maxLength={6}
                        />
                        <Button
                          className="w-full h-12 text-lg"
                          onClick={handleVerifyOtp}
                          disabled={isSubmitting || otp.length < 6}
                        >
                          {isSubmitting ? "Verifying..." : "Verify & Continue"}
                        </Button>
                        <p
                          className="text-xs text-center text-muted-foreground cursor-pointer hover:text-primary"
                          onClick={() => setIsVerifying(false)}
                        >
                          Incorrect email? Go back
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {currentStep === 1 && (
                        <StepRoleIntent
                          role={formData.role}
                          selectedServices={formData.selectedServices}
                          onSelectRole={(value) =>
                            handleFieldChange("role", value)
                          }
                          onToggleService={toggleService}
                        />
                      )}
                      {currentStep === 2 && (
                        <StepSkillValidation
                          experienceYears={formData.experienceYears}
                          workingLevel={formData.workingLevel}
                          selectedTools={formData.selectedTools}
                          selectedServices={formData.selectedServices}
                          onSelectExperienceYears={(value) =>
                            handleFieldChange("experienceYears", value)
                          }
                          onSelectWorkingLevel={(value) =>
                            handleFieldChange("workingLevel", value)
                          }
                          onToggleTool={toggleTool}
                        />
                      )}
                      {currentStep === 3 && (
                        <StepPortfolioProof
                          hasPreviousWork={formData.hasPreviousWork}
                          portfolioTypes={formData.portfolioTypes}
                          hasWorkedWithClients={formData.hasWorkedWithClients}
                          portfolioLink={formData.portfolioLink}
                          portfolioProjects={formData.onboardingProjects}
                          onSelectHasPreviousWork={(value) =>
                            handleFieldChange("hasPreviousWork", value)
                          }
                          onTogglePortfolioType={togglePortfolioType}
                          onSelectHasWorkedWithClients={(value) =>
                            handleFieldChange("hasWorkedWithClients", value)
                          }
                          onPortfolioLinkChange={(value) =>
                            handleFieldChange("portfolioLink", value)
                          }
                          onAddProject={addOnboardingProject}
                          onRemoveProject={removeOnboardingProject}
                        />
                      )}
                      {currentStep === 4 && (
                        <StepWorkStyle
                          workPreference={formData.workPreference}
                          hoursPerDay={formData.hoursPerDay}
                          revisionHandling={formData.revisionHandling}
                          onSelectWorkPreference={(value) =>
                            handleFieldChange("workPreference", value)
                          }
                          onSelectHoursPerDay={(value) =>
                            handleFieldChange("hoursPerDay", value)
                          }
                          onSelectRevisionHandling={(value) =>
                            handleFieldChange("revisionHandling", value)
                          }
                        />
                      )}
                      {currentStep === 5 && (
                        <StepPricingAvailability
                          pricingModel={formData.pricingModel}
                          projectRange={formData.projectRange}
                          partialScope={formData.partialScope}
                          onSelectPricingModel={(value) =>
                            handleFieldChange("pricingModel", value)
                          }
                          onSelectProjectRange={(value) =>
                            handleFieldChange("projectRange", value)
                          }
                          onSelectPartialScope={(value) =>
                            handleFieldChange("partialScope", value)
                          }
                        />
                      )}
                      {currentStep === 6 && (
                        <StepSOPAlignment
                          sopAgreement={formData.sopAgreement}
                          scopeFreezeAgreement={formData.scopeFreezeAgreement}
                          requoteAgreement={formData.requoteAgreement}
                          onSelectSOPAgreement={(value) =>
                            handleFieldChange("sopAgreement", value)
                          }
                          onSelectScopeFreezeAgreement={(value) =>
                            handleFieldChange("scopeFreezeAgreement", value)
                          }
                          onSelectRequoteAgreement={(value) =>
                            handleFieldChange("requoteAgreement", value)
                          }
                        />
                      )}
                      {currentStep === 7 && (
                        <StepProfessional
                          selectedField={formData.professionalField}
                          onSelectField={(value) =>
                            handleFieldChange("professionalField", value)
                          }
                        />
                      )}
                      {currentStep === 8 && (
                        <StepSpecialty
                          selectedSpecialties={formData.specialty}
                          onToggle={toggleSpecialty}
                          options={currentSpecialtyOptions}
                        />
                      )}
                      {currentStep === 9 && (
                        <StepSkills
                          skills={formData.skills}
                          currentSpecialtySkills={currentSpecialtySkills}
                          customSkillInput={formData.customSkillInput}
                          onToggleSkill={toggleSkill}
                          onRemoveSkill={handleRemoveSkill}
                          onCustomInputChange={(value) =>
                            handleFieldChange("customSkillInput", value)
                          }
                          onAddCustomSkill={handleAddCustomSkill}
                          specialty={formData.specialty}
                        />
                      )}
                      {currentStep === 10 && (
                        <StepExperience
                          experience={formData.experience}
                          onSelectExperience={(value) =>
                            handleFieldChange("experience", value)
                          }
                        />
                      )}
                      {currentStep === 11 && (
                        <StepPortfolio
                          website={formData.portfolioWebsite}
                          linkedin={formData.linkedinProfile}
                          github={formData.githubProfile}
                          fileName={formData.portfolioFileName}
                          isDeveloper={
                            formData.professionalField === "Development & Tech"
                          }
                          isFresher={formData.experience === "Fresher"}
                          onWebsiteChange={(value) =>
                            handleFieldChange("portfolioWebsite", value)
                          }
                          onLinkedinChange={(value) =>
                            handleFieldChange("linkedinProfile", value)
                          }
                          onGithubChange={(value) =>
                            handleFieldChange("githubProfile", value)
                          }
                          onFileChange={handleFileChange}
                        />
                      )}
                      {currentStep === 12 && (
                        <StepTerms
                          accepted={formData.termsAccepted}
                          onToggle={(value) =>
                            handleFieldChange("termsAccepted", value)
                          }
                        />
                      )}
                      {currentStep === 13 && (
                        <StepPersonalInfo
                          fullName={formData.fullName}
                          email={formData.email}
                          password={formData.password}
                          phone={formData.phone}
                          countryCode={formData.countryCode}
                          location={formData.location}
                          onChange={handleFieldChange}
                        />
                      )}
                    </>
                  )}

                  {stepError && (
                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/40">
                      <p className="text-sm text-destructive">{stepError}</p>
                    </div>
                  )}
                </div>
                <div className="md:hidden flex justify-center">
                  {!isVerifying && (
                    <Button
                      type="button"
                      disabled={disableNext}
                      onClick={isLastStep ? handleSubmit : handleNext}
                    >
                      <span className="absolute inset-0 bg-white/15 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <span className="relative flex items-center gap-2 justify-center">
                        {isSubmitting && isLastStep
                          ? "Submitting..."
                          : isLastStep
                            ? "Submit"
                            : "Next"}
                        {!isLastStep && !isSubmitting && (
                          <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                        )}
                      </span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Visual Panel */}
          <div className="hidden lg:flex flex-col h-full items-center">
            <div className="sticky top-6 w-full pt-30 h-full min-h-[500px] lg:min-h-[540px] max-w-[420px] rounded-xl overflow-hidden border border-border bg-card shadow-xl flex flex-col gap-6 items-center p-6">
              <div className="w-full flex flex-col items-center justify-center text-center gap-4">
                <StepVisualPanel
                  currentStep={currentStep}
                  formData={formData}
                />
              </div>
              <div className="w-full text-center pt-10">
                {/* Login Link */}
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <a
                    href="/login"
                    className="font-semibold text-primary hover:underline"
                  >
                    Login here
                  </a>
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 w-full">
                {!isVerifying && (
                  <Button
                    type="button"
                    disabled={disableNext}
                    onClick={isLastStep ? handleSubmit : handleNext}
                  >
                    <span className="absolute inset-0 bg-white/15 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <span className="relative flex items-center gap-2 justify-center">
                      {isSubmitting && isLastStep
                        ? "Submitting..."
                        : isLastStep
                          ? "Submit"
                          : "Next"}
                      {!isLastStep && !isSubmitting && (
                        <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      )}
                    </span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StepVisualPanel = ({ currentStep, formData }) => {
  const getVisualContent = () => {
    switch (currentStep) {
      case 1: {
        const selectedRole = ROLE_OPTIONS.find(
          (r) => r.value === formData.role
        );
        const RoleIcon = selectedRole?.icon || Target;
        const selectedServicesList =
          formData.selectedServices
            ?.map((svc) => SERVICE_OPTIONS.find((s) => s.value === svc))
            .filter(Boolean) || [];

        return (
          <div className="text-center space-y-5 animate-in fade-in slide-in-from-right-8 duration-500">
            {/* Dynamic Role Icon */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <RoleIcon className="h-8 w-8 text-primary" />
            </div>

            {/* Role Name */}
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                {selectedRole ? selectedRole.label : "Tell Us About Yourself"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedServicesList.length > 0
                  ? `${selectedServicesList.length} service(s) selected`
                  : "Select your role and services"}
              </p>
            </div>

            {/* Selected Services List */}
            {selectedServicesList.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Services
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {selectedServicesList.slice(0, 4).map((service) => {
                    const ServiceIcon = service.icon;
                    return (
                      <div
                        key={service.value}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium"
                      >
                        <ServiceIcon className="h-3.5 w-3.5" />
                        <span>{service.label}</span>
                      </div>
                    );
                  })}
                  {selectedServicesList.length > 4 && (
                    <div className="px-2.5 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-medium">
                      +{selectedServicesList.length - 4} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      }
      case 2:
        return (
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                {formData.workingLevel
                  ? WORKING_LEVEL_OPTIONS.find(
                    (l) => l.value === formData.workingLevel
                  )?.label
                  : "Skill Validation"}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {formData.experienceYears
                  ? `${EXPERIENCE_YEARS_OPTIONS.find(
                    (e) => e.value === formData.experienceYears
                  )?.label
                  } experience`
                  : "Validate your expertise level"}
              </p>
              {formData.selectedTools?.length > 0 && (
                <p className="text-xs text-primary mt-2">
                  {formData.selectedTools.length} tool(s) selected
                </p>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Palette className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                {formData.hasPreviousWork === "yes"
                  ? "Portfolio Ready"
                  : formData.hasPreviousWork === "no"
                    ? "New & Skilled"
                    : "Portfolio & Proof"}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {formData.onboardingProjects?.length > 0
                  ? `${formData.onboardingProjects.length} project(s) added`
                  : formData.portfolioLink
                    ? "Portfolio website added"
                    : "Share your proof of work"}
              </p>
              {formData.hasWorkedWithClients && (
                <p className="text-xs text-primary mt-2">
                  {formData.hasWorkedWithClients === "yes"
                    ? "Experienced with clients"
                    : "First-time freelancer"}
                </p>
              )}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                Work Preference
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {formData.workPreference
                  ? WORK_PREFERENCE_OPTIONS.find(
                    (w) => w.value === formData.workPreference
                  )?.label
                  : "Define your working style"}
              </p>
              {formData.hoursPerDay && (
                <p className="text-xs text-primary mt-2">
                  {
                    HOURS_PER_DAY_OPTIONS.find(
                      (h) => h.value === formData.hoursPerDay
                    )?.label
                  }{" "}
                  availability
                </p>
              )}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                Pricing & Availability
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {formData.pricingModel
                  ? PRICING_MODEL_OPTIONS.find(
                    (p) => p.value === formData.pricingModel
                  )?.label
                  : "Set your pricing preferences"}
              </p>
              {formData.projectRange && (
                <p className="text-xs text-primary mt-2">
                  {
                    PROJECT_RANGE_OPTIONS.find(
                      (r) => r.value === formData.projectRange
                    )?.label
                  }{" "}
                  projects
                </p>
              )}
            </div>
          </div>
        );
      case 6:
        return (
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ClipboardCheck className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                SOP & Alignment
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {formData.sopAgreement === "yes" &&
                  formData.scopeFreezeAgreement === "yes" &&
                  formData.requoteAgreement === "yes"
                  ? "Alignment Confirmed"
                  : "Please confirm alignment"}
              </p>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-6xl">
              {PROFESSIONAL_FIELD_ICONS[formData.professionalField] || "💼"}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                {formData.professionalField
                  ? "Professional Field Selected"
                  : "Choose Your Field"}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {formData.professionalField
                  ? `You're ready to share your ${formData.professionalField}`
                  : "Pick a professional field that matches your expertise"}
              </p>
            </div>
          </div>
        );
      case 8:
        return (
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-6xl">🎯</div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                {formData.specialty && formData.specialty.length > 0
                  ? "Specialties Selected"
                  : "Select Your Specialties"}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {formData.specialty && formData.specialty.length > 0
                  ? `Selected: ${formData.specialty.join(", ")}`
                  : "Narrow down your focus area to attract the right clients"}
              </p>
            </div>
          </div>
        );
      case 9:
        return (
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex flex-wrap gap-2 justify-center">
              {formData.skills.slice(0, 3).map((skill, idx) => (
                <div
                  key={skill}
                  className="px-3 py-1 rounded-full bg-primary/15 border border-primary/40 text-primary text-xs font-semibold"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  {skill}
                </div>
              ))}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                Skills Added: {formData.skills.length}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {formData.skills.length > 0
                  ? "Great! Your skills make you stand out"
                  : "Add skills that match your specialty"}
              </p>
            </div>
          </div>
        );
      case 10:
        return (
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-6xl">📈</div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                {formData.experience
                  ? `${formData.experience} Years`
                  : "Experience Level"}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {formData.experience
                  ? `You bring ${formData.experience} years of expertise`
                  : "Tell us about your professional experience"}
              </p>
            </div>
          </div>
        );
      case 11:
        return (
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-6xl">🎨</div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                Portfolio Links
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {formData.portfolioWebsite && formData.linkedinProfile
                  ? "Your profile is looking professional!"
                  : "Link your portfolio and LinkedIn to showcase your work"}
              </p>
            </div>
          </div>
        );
      case 12:
        return (
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-6xl">
              {formData.termsAccepted ? "✅" : "📋"}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                {formData.termsAccepted ? "Terms Accepted" : "Agree to Terms"}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {formData.termsAccepted
                  ? "You're all set with our terms!"
                  : "Review and accept our terms to proceed"}
              </p>
            </div>
          </div>
        );
      case 13:
        return (
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-6xl">👤</div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                {formData.fullName
                  ? "Profile Complete!"
                  : "Complete Your Profile"}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {formData.fullName
                  ? `Welcome, ${formData.fullName}! Ready to launch your career`
                  : "Add your personal details to finalize your profile"}
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return getVisualContent();
};

const StepRoleIntent = ({
  role,
  selectedServices,
  onSelectRole,
  onToggleService,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          Role & Intent
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Tell us about yourself and the services you want to offer on
          Catelance.
        </p>
      </div>

      {/* Role Selection */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.18em]">
          What best describes you?
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {ROLE_OPTIONS.map((option) => {
            const isActive = role === option.value;
            return (
              <button
                key={option.value}
                onClick={() => onSelectRole(option.value)}
                className={cn(
                  "w-full px-4 py-4 rounded-lg border text-center text-sm font-medium transition-all duration-300 transform hover:-translate-y-px flex flex-col items-center gap-2 shadow-xs",
                  isActive
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-muted text-foreground hover:bg-secondary"
                )}
              >
                <option.icon className="h-6 w-6" />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Services Multi-select */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.18em]">
          Which services do you want to offer on Catelance? (Multi-select)
        </p>
        <div className="grid gap-2 md:grid-cols-2 max-h-[280px] overflow-y-auto pr-2">
          {SERVICE_OPTIONS.map((service) => {
            const isActive = selectedServices.includes(service.value);
            return (
              <button
                key={service.value}
                onClick={() => onToggleService(service.value)}
                className={cn(
                  "w-full px-3 py-2.5 rounded-lg border text-left text-sm font-medium transition-all duration-300 transform hover:-translate-y-px flex items-center justify-between gap-2 shadow-xs",
                  isActive
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-muted text-foreground hover:bg-secondary"
                )}
              >
                <span className="flex items-center gap-2">
                  <service.icon className="h-5 w-5" />
                  <span>{service.label}</span>
                </span>
                {isActive && (
                  <Check className="h-4 w-4 text-primary animate-in zoom-in spin-in-45" />
                )}
              </button>
            );
          })}
        </div>
        {selectedServices.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {selectedServices.length} service(s) selected
          </p>
        )}
      </div>
    </div>
  );
};

const StepSkillValidation = ({
  experienceYears,
  workingLevel,
  selectedTools,
  selectedServices,
  onSelectExperienceYears,
  onSelectWorkingLevel,
  onToggleTool,
}) => {
  // Get available tools based on selected services
  const availableTools = React.useMemo(() => {
    const tools = new Set();
    selectedServices.forEach((service) => {
      const serviceTools = TOOLS_BY_SERVICE[service] || [];
      serviceTools.forEach((tool) => tools.add(tool));
    });
    return Array.from(tools).sort();
  }, [selectedServices]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          Skill Validation
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Help us understand your experience level and the tools you work with.
        </p>
      </div>

      {/* Experience Years */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.18em]">
          How many years of experience do you have in your selected service(s)?
        </p>
        <div className="grid gap-2 md:grid-cols-4">
          {EXPERIENCE_YEARS_OPTIONS.map((option) => {
            const isActive = experienceYears === option.value;
            return (
              <button
                key={option.value}
                onClick={() => onSelectExperienceYears(option.value)}
                className={cn(
                  "w-full px-3 py-3 rounded-lg border text-center text-sm font-medium transition-all duration-300 hover:-translate-y-px",
                  isActive
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-muted text-foreground hover:bg-secondary"
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Working Level */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.18em]">
          What is your working level?
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {WORKING_LEVEL_OPTIONS.map((option) => {
            const isActive = workingLevel === option.value;
            return (
              <button
                key={option.value}
                onClick={() => onSelectWorkingLevel(option.value)}
                className={cn(
                  "w-full px-4 py-4 rounded-lg border text-left text-sm transition-all duration-300 hover:-translate-y-px",
                  isActive
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-muted text-foreground hover:bg-secondary"
                )}
              >
                <span className="font-semibold block">{option.label}</span>
                <span className="text-xs text-muted-foreground mt-1 block">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tools Multi-select */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.18em]">
            Which tools do you actively use?
          </p>
          {selectedTools.length > 0 && (
            <span className="text-xs text-primary font-medium">
              {selectedTools.length} selected
            </span>
          )}
        </div>
        {availableTools.length > 0 ? (
          <div className="grid gap-2 md:grid-cols-3 max-h-[200px] overflow-y-auto pr-2">
            {availableTools.map((tool) => {
              const isActive = selectedTools.includes(tool);
              return (
                <button
                  key={tool}
                  onClick={() => onToggleTool(tool)}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg border text-left text-sm font-medium transition-all duration-200 flex items-center justify-between gap-2",
                    isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted text-foreground hover:bg-secondary"
                  )}
                >
                  <span>{tool}</span>
                  {isActive && <Check className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Go back to Step 1 to select services first
          </p>
        )}
      </div>
    </div>
  );
};

const StepPortfolioProof = ({
  hasPreviousWork,
  portfolioTypes,
  hasWorkedWithClients,
  portfolioLink,
  portfolioProjects,
  onSelectHasPreviousWork,
  onTogglePortfolioType,
  onSelectHasWorkedWithClients,
  onPortfolioLinkChange,
  onAddProject,
  onRemoveProject,
}) => {
  const [newProjectUrl, setNewProjectUrl] = useState("");
  const [isLoadingProject, setIsLoadingProject] = useState(false);

  const handleAddProject = async () => {
    if (!newProjectUrl.trim()) return;

    // Check for duplicates
    if (portfolioProjects.some((p) => p.link === newProjectUrl)) {
      toast.error("Project already added");
      setNewProjectUrl("");
      return;
    }

    setIsLoadingProject(true);
    try {
      const baseUrl = API_BASE_URL || "/api";
      const res = await fetch(
        `${baseUrl}/utils/metadata?url=${encodeURIComponent(newProjectUrl)}`
      );
      const data = await res.json();

      if (data.success) {
        onAddProject({
          link: newProjectUrl,
          image: data.data.image,
          title:
            data.data.title ||
            newProjectUrl.replace(/^https?:\/\//, "").split("/")[0],
        });
        toast.success("Project added!");
      } else {
        onAddProject({
          link: newProjectUrl,
          image: null,
          title: newProjectUrl.replace(/^https?:\/\//, "").split("/")[0],
        });
      }
      setNewProjectUrl("");
    } catch (err) {
      console.error(err);
      toast.error("Could not fetch preview, but link added.");
      onAddProject({
        link: newProjectUrl,
        image: null,
        title: newProjectUrl.replace(/^https?:\/\//, "").split("/")[0],
      });
      setNewProjectUrl("");
    } finally {
      setIsLoadingProject(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          Portfolio & Proof of Work
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Share your previous work and experience with clients.
        </p>
      </div>

      {/* Previous Work */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.18em]">
          Do you have previous work to showcase?
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <button
            onClick={() => onSelectHasPreviousWork("yes")}
            className={cn(
              "w-full px-4 py-4 rounded-lg border text-left text-sm transition-all duration-300 hover:-translate-y-px",
              hasPreviousWork === "yes"
                ? "border-primary bg-primary/10 text-primary shadow-sm"
                : "border-border bg-muted text-foreground hover:bg-secondary"
            )}
          >
            <span className="font-semibold block">Yes</span>
            <span className="text-xs text-muted-foreground">
              Upload links/files
            </span>
          </button>
          <button
            onClick={() => onSelectHasPreviousWork("no")}
            className={cn(
              "w-full px-4 py-4 rounded-lg border text-left text-sm transition-all duration-300 hover:-translate-y-px",
              hasPreviousWork === "no"
                ? "border-primary bg-primary/10 text-primary shadow-sm"
                : "border-border bg-muted text-foreground hover:bg-secondary"
            )}
          >
            <span className="font-semibold block">No</span>
            <span className="text-xs text-muted-foreground">
              I'm new but skilled
            </span>
          </button>
        </div>
      </div>

      {/* Portfolio Types & Links - Only show if hasPreviousWork is "yes" */}
      {hasPreviousWork === "yes" && (
        <>
          {/* Portfolio Website Link */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.18em]">
              Portfolio Website (optional)
            </p>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="url"
                placeholder="https://yourportfolio.com"
                value={portfolioLink}
                onChange={(e) => onPortfolioLinkChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Project Links */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.18em]">
              Add Project Links
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="url"
                  placeholder="https://project-link.com"
                  value={newProjectUrl}
                  onChange={(e) => setNewProjectUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddProject()}
                  className="pl-10"
                  disabled={isLoadingProject}
                />
              </div>
              <Button
                type="button"
                onClick={handleAddProject}
                disabled={!newProjectUrl.trim() || isLoadingProject}
                size="icon"
                className="shrink-0"
              >
                {isLoadingProject ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Project Cards */}
            {portfolioProjects.length > 0 && (
              <div className="grid gap-3 grid-cols-2 md:grid-cols-3 mt-3">
                {portfolioProjects.map((project, index) => (
                  <div
                    key={project.link}
                    className="relative group rounded-lg border border-border bg-card overflow-hidden aspect-video"
                  >
                    {project.image ? (
                      <img
                        src={project.image}
                        alt={project.title}
                        className="w-full h-full object-contain bg-muted"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Globe className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    {/* Text Overlay */}
                    <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/50 to-transparent p-2">
                      <p className="text-xs font-medium text-white truncate">
                        {project.title}
                      </p>
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-primary hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                        View
                      </a>
                    </div>
                    <button
                      onClick={() => onRemoveProject(index)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-destructive/90 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Worked with Clients */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.18em]">
          Have you worked with clients before?
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <button
            onClick={() => onSelectHasWorkedWithClients("yes")}
            className={cn(
              "w-full px-4 py-3 rounded-lg border text-center text-sm font-medium transition-all duration-300 hover:-translate-y-px",
              hasWorkedWithClients === "yes"
                ? "border-primary bg-primary/10 text-primary shadow-sm"
                : "border-border bg-muted text-foreground hover:bg-secondary"
            )}
          >
            Yes
          </button>
          <button
            onClick={() => onSelectHasWorkedWithClients("no")}
            className={cn(
              "w-full px-4 py-3 rounded-lg border text-center text-sm font-medium transition-all duration-300 hover:-translate-y-px",
              hasWorkedWithClients === "no"
                ? "border-primary bg-primary/10 text-primary shadow-sm"
                : "border-border bg-muted text-foreground hover:bg-secondary"
            )}
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
};

const StepWorkStyle = ({
  workPreference,
  hoursPerDay,
  revisionHandling,
  onSelectWorkPreference,
  onSelectHoursPerDay,
  onSelectRevisionHandling,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          Work Style & Productivity Check
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          How do you prefer to work?
        </p>
      </div>

      {/* Work Preference */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.18em]">
          Work Preference
        </p>
        <div className="grid gap-2 md:grid-cols-1">
          {WORK_PREFERENCE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onSelectWorkPreference(option.value)}
              className={cn(
                "w-full px-4 py-3 rounded-lg border text-left text-sm transition-all duration-200 flex items-center justify-between",
                workPreference === option.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted text-foreground hover:bg-secondary"
              )}
            >
              <span className="font-medium">{option.label}</span>
              {workPreference === option.value && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </div>

      {/* Hours Per Day */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.18em]">
          How many hours per day can you realistically dedicate?
        </p>
        <div className="grid gap-2 grid-cols-2">
          {HOURS_PER_DAY_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onSelectHoursPerDay(option.value)}
              className={cn(
                "w-full px-4 py-3 rounded-lg border text-center text-sm transition-all duration-200",
                hoursPerDay === option.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted text-foreground hover:bg-secondary"
              )}
            >
              <span className="font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Revision Handling */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.18em]">
          How do you handle revisions?
        </p>
        <div className="grid gap-2 md:grid-cols-2">
          {REVISION_HANDLING_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onSelectRevisionHandling(option.value)}
              className={cn(
                "w-full px-4 py-3 rounded-lg border text-center text-sm transition-all duration-200",
                revisionHandling === option.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted text-foreground hover:bg-secondary"
              )}
            >
              <span className="font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const StepPricingAvailability = ({
  pricingModel,
  projectRange,
  partialScope,
  onSelectPricingModel,
  onSelectProjectRange,
  onSelectPartialScope,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          Pricing & Availability
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Define your pricing preferences.
        </p>
      </div>

      {/* Pricing Model */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.18em]">
          What pricing model do you prefer?
        </p>
        <div className="grid gap-2 grid-cols-3">
          {PRICING_MODEL_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onSelectPricingModel(option.value)}
              className={cn(
                "w-full px-4 py-3 rounded-lg border text-center text-sm transition-all duration-200",
                pricingModel === option.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted text-foreground hover:bg-secondary"
              )}
            >
              <span className="font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Project Range */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.18em]">
          Your typical project range (per service)?
        </p>
        <div className="grid gap-2 grid-cols-3">
          {PROJECT_RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onSelectProjectRange(option.value)}
              className={cn(
                "w-full px-4 py-3 rounded-lg border text-center text-sm transition-all duration-200",
                projectRange === option.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted text-foreground hover:bg-secondary"
              )}
            >
              <span className="font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Partial Scope */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.18em]">
          Are you open to partial-scope projects?
        </p>
        <div className="grid gap-2 grid-cols-2">
          <button
            onClick={() => onSelectPartialScope("yes")}
            className={cn(
              "w-full px-4 py-3 rounded-lg border text-center text-sm font-medium transition-all duration-300 hover:-translate-y-px",
              partialScope === "yes"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-muted text-foreground hover:bg-secondary"
            )}
          >
            Yes
          </button>
          <button
            onClick={() => onSelectPartialScope("no")}
            className={cn(
              "w-full px-4 py-3 rounded-lg border text-center text-sm font-medium transition-all duration-300 hover:-translate-y-px",
              partialScope === "no"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-muted text-foreground hover:bg-secondary"
            )}
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
};

const StepSOPAlignment = ({
  sopAgreement,
  scopeFreezeAgreement,
  requoteAgreement,
  onSelectSOPAgreement,
  onSelectScopeFreezeAgreement,
  onSelectRequoteAgreement,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          SOP & Platform Alignment
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Please confirm your understanding of our operating procedures.
        </p>
      </div>

      {/* SOP Agreement */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.18em]">
          Do you agree to follow Catalance’s 4-phase SOP for all projects?
        </p>
        <div className="grid gap-2 grid-cols-2">
          <button
            onClick={() => onSelectSOPAgreement("yes")}
            className={cn(
              "w-full px-4 py-3 rounded-lg border text-center text-sm font-medium transition-all duration-300 hover:-translate-y-px",
              sopAgreement === "yes"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-muted text-foreground hover:bg-secondary"
            )}
          >
            Yes (mandatory)
          </button>
          <button
            onClick={() => onSelectSOPAgreement("no")}
            className={cn(
              "w-full px-4 py-3 rounded-lg border text-center text-sm font-medium transition-all duration-300 hover:-translate-y-px",
              sopAgreement === "no"
                ? "border-destructive bg-destructive/10 text-destructive"
                : "border-border bg-muted text-foreground hover:bg-secondary"
            )}
          >
            No
          </button>
        </div>
      </div>

      {/* Scope Freeze Agreement */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.18em]">
          Do you understand that work starts only after scope freeze and
          approval?
        </p>
        <div className="grid gap-2 grid-cols-2">
          <button
            onClick={() => onSelectScopeFreezeAgreement("yes")}
            className={cn(
              "w-full px-4 py-3 rounded-lg border text-center text-sm font-medium transition-all duration-300 hover:-translate-y-px",
              scopeFreezeAgreement === "yes"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-muted text-foreground hover:bg-secondary"
            )}
          >
            Yes
          </button>
          <button
            onClick={() => onSelectScopeFreezeAgreement("no")}
            className={cn(
              "w-full px-4 py-3 rounded-lg border text-center text-sm font-medium transition-all duration-300 hover:-translate-y-px",
              scopeFreezeAgreement === "no"
                ? "border-destructive bg-destructive/10 text-destructive"
                : "border-border bg-muted text-foreground hover:bg-secondary"
            )}
          >
            No
          </button>
        </div>
      </div>

      {/* Re-quote Agreement */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.18em]">
          Do you agree that scope changes require re-quoting?
        </p>
        <div className="grid gap-2 grid-cols-2">
          <button
            onClick={() => onSelectRequoteAgreement("yes")}
            className={cn(
              "w-full px-4 py-3 rounded-lg border text-center text-sm font-medium transition-all duration-300 hover:-translate-y-px",
              requoteAgreement === "yes"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-muted text-foreground hover:bg-secondary"
            )}
          >
            Yes
          </button>
          <button
            onClick={() => onSelectRequoteAgreement("no")}
            className={cn(
              "w-full px-4 py-3 rounded-lg border text-center text-sm font-medium transition-all duration-300 hover:-translate-y-px",
              requoteAgreement === "no"
                ? "border-destructive bg-destructive/10 text-destructive"
                : "border-border bg-muted text-foreground hover:bg-secondary"
            )}
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
};

const StepProfessional = ({ selectedField, onSelectField }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          Choose Your Professional Field
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Select the category that best describes your work.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {PROFESSIONAL_FIELDS.map((field) => {
          const isActive = selectedField === field;
          const icon = PROFESSIONAL_FIELD_ICONS[field] || "💼";
          return (
            <button
              key={field}
              onClick={() => onSelectField(field)}
              className={cn(
                "w-full px-4 py-4 rounded-lg border text-left text-sm font-medium transition-all duration-300 transform hover:-translate-y-px flex items-center gap-3 shadow-xs",
                isActive
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted text-foreground hover:bg-secondary"
              )}
            >
              <span className="text-xl">{icon}</span>
              <span>{field}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const StepSpecialty = ({ selectedSpecialties, onToggle, options }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          Select Your Specialties
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose your specific skills within your professional field. You can
          select multiple.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {options.map((option) => {
          const isActive = selectedSpecialties.includes(option);
          return (
            <button
              key={option}
              onClick={() => onToggle(option)}
              className={cn(
                "w-full px-4 py-3 rounded-lg border text-left text-sm font-medium transition-all duration-300 transform hover:-translate-y-px flex items-center justify-between shadow-xs",
                isActive
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : "border-border bg-muted text-foreground hover:bg-secondary"
              )}
            >
              <span>{option}</span>
              {isActive && (
                <Check className="h-4 w-4 text-primary animate-in zoom-in spin-in-45" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const StepSkills = ({
  skills,
  currentSpecialtySkills,
  customSkillInput,
  onToggleSkill,
  onRemoveSkill,
  onCustomInputChange,
  onAddCustomSkill,
  specialty,
}) => {
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onAddCustomSkill();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          Select Your Skills
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose skills related to your specialties. You can also add custom
          skills.
        </p>
      </div>

      {skills.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.18em]">
            Selected Skills ({skills.length})
          </p>
          <div className="flex flex-wrap gap-2 p-4 rounded-lg bg-muted border border-border min-h-12">
            {skills.map((skill, index) => (
              <div
                key={skill}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/40 text-primary text-sm font-medium"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => onRemoveSkill(skill)}
                  className="ml-1 hover:text-primary-foreground/80 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.18em]">
          Recommended Skills
        </p>
        <div className="flex flex-wrap gap-2">
          {currentSpecialtySkills.map((skill) => {
            const isActive = skills.includes(skill);
            return (
              <button
                key={skill}
                type="button"
                onClick={() => onToggleSkill(skill)}
                className={cn(
                  "px-3 py-1.5 rounded-full border text-sm font-medium transition-all duration-300 transform hover:-translate-y-px",
                  isActive
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-muted text-foreground hover:bg-secondary"
                )}
              >
                {skill}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom skill input */}
      <div className="space-y-3">
        <Label className="text-sm text-foreground font-semibold">
          Add Custom Skill
        </Label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            type="text"
            value={customSkillInput}
            onChange={(event) => onCustomInputChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a skill and press Add or Enter"
            className="h-11 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
          <Button
            type="button"
            onClick={onAddCustomSkill}
            className="h-11 rounded-lg bg-primary text-primary-foreground px-6 font-semibold hover:bg-primary/90"
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
};

const StepExperience = ({ experience, onSelectExperience }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          Your Expertise Level
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Select your years of experience.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        {EXPERIENCE_OPTIONS.map((option) => {
          const isActive = experience === option;
          return (
            <button
              key={option}
              onClick={() => onSelectExperience(option)}
              className={cn(
                "w-full px-4 py-3 rounded-lg border text-sm font-medium transition-all duration-300 transform hover:-translate-y-px",
                isActive
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : "border-border bg-muted text-foreground hover:bg-secondary"
              )}
            >
              {option === "Fresher" ? option : `${option} years`}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const StepPortfolio = ({
  website,
  linkedin,
  github,
  fileName,
  isDeveloper,
  isFresher,
  onWebsiteChange,
  onLinkedinChange,
  onGithubChange,
  onFileChange,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Showcase Your Work
        </h2>
        <p className="text-sm text-muted-foreground">
          Link your portfolio, LinkedIn, and GitHub to stand out.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="portfolioWebsite"
            className="text-sm text-foreground font-semibold"
          >
            Portfolio Website {isFresher ? "(Optional)" : ""}
          </Label>
          <Input
            id="portfolioWebsite"
            type="url"
            value={website}
            onChange={(event) => onWebsiteChange(event.target.value)}
            placeholder="https://yourportfolio.com"
            className="h-11 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="linkedinProfile"
            className="text-sm text-foreground font-semibold"
          >
            LinkedIn Profile
          </Label>
          <Input
            id="linkedinProfile"
            type="url"
            value={linkedin}
            onChange={(event) => onLinkedinChange(event.target.value)}
            placeholder="https://linkedin.com/in/yourprofile"
            className="h-11 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="githubProfile"
            className="text-sm text-foreground font-semibold"
          >
            GitHub Profile{" "}
            {isDeveloper && !isFresher ? "(Mandatory)" : "(Optional)"}
          </Label>
          <Input
            id="githubProfile"
            type="url"
            value={github}
            onChange={(event) => onGithubChange(event.target.value)}
            placeholder="https://github.com/yourusername"
            className="h-11 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="portfolioFile"
            className="text-sm text-foreground font-semibold"
          >
            Upload Resume/PDF {isFresher ? "(Mandatory)" : "(Optional)"}
          </Label>
          <Input
            id="portfolioFile"
            type="file"
            accept=".pdf"
            onChange={onFileChange}
            className="h-11 cursor-pointer rounded-lg bg-background border border-input text-muted-foreground file:bg-transparent"
          />
          {fileName && (
            <p className="text-xs text-muted-foreground">
              Selected: {fileName}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const StepTerms = ({ accepted, onToggle }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          Terms &amp; Conditions
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Please agree to the terms to complete your profile.
        </p>
      </div>

      <div className="space-y-4">
        <div className="max-h-64 overflow-y-auto rounded-lg bg-muted p-4 text-xs leading-relaxed text-muted-foreground border border-border scrollbar-thin">
          <p className="font-semibold text-primary mb-3">
            Freelancer Terms &amp; Conditions – GoHypeMedia
          </p>
          <ol className="list-decimal space-y-2 ps-4">
            <li>
              <span className="font-semibold">Project Completion</span> –
              Payment will only be made upon successful completion and delivery
              of the assigned project as per the agreed scope, timeline, and
              quality standards.
            </li>
            <li>
              <span className="font-semibold">Professional Conduct</span> – You
              agree to maintain clear communication, meet deadlines, and deliver
              original, high-quality work.
            </li>
            <li>
              <span className="font-semibold">Confidentiality</span> – All
              client and project information must remain confidential.
            </li>
            <li>
              <span className="font-semibold">Payment Terms</span> – Payments
              are processed after approval of deliverables.
            </li>
          </ol>
        </div>

        <label className="flex items-center gap-3 p-3 rounded-lg bg-muted border border-border cursor-pointer hover:bg-secondary transition-colors">
          <Checkbox
            checked={accepted}
            onCheckedChange={(value) => onToggle(Boolean(value))}
            className="border-input data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <span className="text-sm text-foreground">
            I agree to the Terms and Conditions
          </span>
        </label>
      </div>
    </div>
  );
};

const StepPersonalInfo = ({
  fullName,
  email,
  password,
  phone,
  location,
  countryCode,
  onChange,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          Personal Information
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This information will be used to create your account.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="fullName"
            className="text-sm text-foreground font-semibold"
          >
            Full Name *
          </Label>
          <Input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(event) => onChange("fullName", event.target.value)}
            placeholder="John Doe"
            className="h-11 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="text-sm text-foreground font-semibold"
          >
            Email Address *
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => onChange("email", event.target.value)}
            placeholder="you@example.com"
            className="h-11 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="password"
            className="text-sm text-foreground font-semibold"
          >
            Password * (Min 8 characters)
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => onChange("password", event.target.value)}
            placeholder="••••••••"
            className="h-11 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="phone"
            className="text-sm text-foreground font-semibold"
          >
            Phone Number
          </Label>
          <div className="flex gap-2">
            <Select
              value={countryCode}
              onValueChange={(value) => onChange("countryCode", value)}
            >
              <SelectTrigger className="w-[140px] h-11 bg-background border border-input">
                {/* Render selected value manually to keep trigger compact */}
                <span className="truncate">
                  {(() => {
                    const selected = COUNTRY_CODES.find(
                      (c) => c.code === countryCode
                    );
                    return selected
                      ? `${selected.code} ${selected.dial_code}`
                      : "Code";
                  })()}
                </span>
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {COUNTRY_CODES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{country.name}</span>
                      <span className="text-muted-foreground">
                        ({country.dial_code})
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(event) => onChange("phone", event.target.value)}
              placeholder="(555) 000-0000"
              className="flex-1 h-11 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="location"
            className="text-sm text-foreground font-semibold"
          >
            Location *
          </Label>
          <Input
            id="location"
            type="text"
            value={location}
            onChange={(event) => onChange("location", event.target.value)}
            placeholder="City, Country"
            className="h-11 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
        </div>
      </div>
    </div>
  );
};

export default FreelancerMultiStepForm;
