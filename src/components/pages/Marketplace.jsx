import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight, BadgeCheck, Bot, BriefcaseBusiness, Banknote, Tag, Check,
  ChevronLeft, ChevronRight, Clock, Cloud, Code2,
  Database, Heart, LayoutGrid, LineChart, MessageSquare,
  Plus, RefreshCcw, Rocket, Search, Settings, SlidersHorizontal,
  Sparkles, Star, Users, Workflow, X, Zap
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  AnimatedCard,
  CardBody,
  CardDescription,
  CardTitle,
  CardVisual,
  Visual3
} from "@/components/ui/animated-card-chart";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Sparkles as SparklesBackground } from "@/components/ui/sparkles";
import MarketplaceServicesSection from "@/components/pages/marketplace-browse/MarketplaceServicesSection";
import SubcategorySection from "@/components/pages/marketplace-browse/SubcategorySection";
import ServiceCategoryCarousel from "@/components/ui/service-category-carousel";
import { getSession } from "@/shared/lib/auth-storage";
import { useAuth } from "@/shared/context/AuthContext";
import { API_BASE_URL } from "@/shared/lib/api-client";
import {
  createMarketplaceFavoriteSnapshot,
  loadMarketplaceFavorites,
  saveMarketplaceFavorites,
} from "@/shared/lib/marketplace-favorites";
import { cn } from "@/shared/lib/utils";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { AnimatedHeroText } from "@/components/ui/animated-hero";
import ProcessVideo from "@/components/sections/marketplace/ProcessVideo";
import { useTheme } from "@/components/providers/theme-provider";

const FALLBACK_CATEGORIES = [
  ["Web Development", "web_development", Code2, "Products and storefronts"],
  ["AI Automation", "ai_automation", Bot, "Agents and workflows"],
  ["SEO", "seo", LineChart, "Organic growth"],
  ["Lead Generation", "lead_generation", Rocket, "Outbound and funnels"],
  ["CRM & ERP", "crm_erp", Workflow, "Ops systems"],
  ["Voice Agent", "voice_agent", MessageSquare, "AI calling"],
  ["App Development", "app_development", BriefcaseBusiness, "Mobile products"],
  ["Customer Support", "customer_support", Users, "CX operations"]
].map(([label, value, icon, description]) => ({ label, value, icon, description }));

const SERVICE_META_BY_KEY = {
  branding: { icon: Sparkles, description: "Identity systems and brand direction" },
  web_development: { icon: Code2, description: "Custom sites, landing pages, and storefronts" },
  seo: { icon: LineChart, description: "Organic growth and technical visibility" },
  social_media_marketing: { icon: Users, description: "Content systems and social growth" },
  paid_advertising: { icon: Rocket, description: "Paid media and performance campaigns" },
  app_development: { icon: BriefcaseBusiness, description: "Mobile apps and cross-platform builds" },
  software_development: { icon: Workflow, description: "Custom products, SaaS, and internal systems" },
  lead_generation: { icon: Rocket, description: "Outbound systems and funnel execution" },
  video_services: { icon: MessageSquare, description: "Video editing and production support" },
  writing_content: { icon: Tag, description: "Copy, articles, and conversion content" },
  customer_support: { icon: Users, description: "CX workflows and support delivery" },
  influencer_marketing: { icon: Star, description: "Creator partnerships and campaign rollout" },
  ugc_marketing: { icon: Sparkles, description: "UGC systems for paid and organic channels" },
  ai_automation: { icon: Bot, description: "Agents, workflows, and AI integrations" },
  whatsapp_chatbot: { icon: MessageSquare, description: "WhatsApp automation and support bots" },
  creative_design: { icon: Sparkles, description: "Creative systems for marketing and brand" },
  "3d_modeling": { icon: Database, description: "3D assets, renders, and product visuals" },
  cgi_videos: { icon: Cloud, description: "CGI storytelling and motion visuals" },
  crm_erp: { icon: Workflow, description: "Business systems, CRM, and ERP operations" },
  voice_agent: { icon: MessageSquare, description: "Voice AI and call automation" },
};

const SERVICE_KEY_ALIASES = {
  branding_kit: "branding",
  brand_identity: "branding",
  website_uiux: "web_development",
  website_ui_ux: "web_development",
  website_development: "web_development",
  web_development: "web_development",
  web_development_service: "web_development",
  seo_service: "seo",
  search_engine_optimization: "seo",
  social_media_management: "social_media_marketing",
  social_media_marketing: "social_media_marketing",
  performance_marketing: "paid_advertising",
  paid_ads: "paid_advertising",
  paid_advertising: "paid_advertising",
  app_development: "app_development",
  software_development: "software_development",
  lead_generation: "lead_generation",
  video_services: "video_services",
  video_service: "video_services",
  writing_content: "writing_content",
  writing_and_content: "writing_content",
  customer_support_services: "customer_support",
  customer_support: "customer_support",
  influencer_marketing: "influencer_marketing",
  ugc_marketing: "ugc_marketing",
  ai_automation: "ai_automation",
  whatsapp_chatbot: "whatsapp_chatbot",
  creative_design: "creative_design",
  cgi_video_services: "cgi_videos",
  cgi_videos: "cgi_videos",
  crm_erp: "crm_erp",
  crm_and_erp_solutions: "crm_erp",
  voice_agent: "voice_agent",
  voice_agent_ai_calling: "voice_agent",
};

const WEB_MODE_OPTIONS = [
  { value: "code", label: "Code" },
  { value: "no_code", label: "No-code" },
];

const WEB_NO_CODE_FALLBACK_OPTIONS = [
  "WordPress",
  "Shopify",
  "WooCommerce",
  "Webflow",
  "Wix",
  "Squarespace",
  "Framer",
  "Bubble",
];

const WEB_CODE_FALLBACK_OPTIONS = [
  "Next.js",
  "React",
  "Vue",
  "Angular",
  "Node.js",
  "Laravel",
  "Django",
  "FastAPI",
  "PostgreSQL",
  "MongoDB",
  "Supabase",
];

const faqs = [
  ["How are freelancers vetted?", "Listings combine verified freelancer data with service-specific marketplace details."],
  ["Can I compare multiple services first?", "Yes. The page is structured around quick filtering and dense service comparison before you open a detail page."],
  ["What if I need a custom scope?", "Use the marketplace to identify the best specialist, then continue through the service detail flow to shape the engagement."],
  ["Let me know more about moneyback guarantee?", "Our money-back guarantee ensures peace of mind by offering a full refund if you're not satisfied with the final product within a specified time frame."],
  ["Do I need to know how to code?", "No, you don't need to know how to code. Our platform offers intuitive tools and templates that allow you to create and manage your website with ease."]
];


const TRUST_PILLARS = [
  {
    id: "verified",
    title: "Verified specialists",
    description: "Credibility signals and profile quality checks keep quality discovery high.",
    icon: BadgeCheck,
  },
  {
    id: "curated",
    title: "Curated service lanes",
    description: "Categories, sub-categories, and tools make discovery focused instead of noisy.",
    icon: Workflow,
  },
  {
    id: "discovery",
    title: "Faster discovery",
    description: "Structured cards surface pricing, delivery speed, and fit signals instantly.",
    icon: Sparkles,
  },
  {
    id: "execution",
    title: "Execution-ready briefs",
    description: "Open project context makes it easier for specialists to respond with aligned proposals.",
    icon: Clock,
  },
];

const WHY_CATALANCE_COMPARISON_ROWS = [
  {
    id: "verification",
    feature: "Talent Verification",
    icon: BadgeCheck,
    catalance: { label: "100% Verified Experts", tone: "positive" },
    fiverr: { label: "No Verification", tone: "negative" },
    upwork: { label: "Partial Verification", tone: "neutral" },
  },
  {
    id: "pricing",
    feature: "Transparent Pricing",
    icon: Banknote,
    catalance: { label: "Clear & Upfront Pricing", tone: "positive" },
    fiverr: { label: "Service Fees Hidden", tone: "negative" },
    upwork: { label: "Complex Fee Structure", tone: "negative" },
  },
  {
    id: "support",
    feature: "Dedicated Support",
    icon: MessageSquare,
    catalance: { label: "24/7 Human Support", tone: "positive" },
    fiverr: { label: "Limited Support", tone: "negative" },
    upwork: { label: "Limited Support", tone: "neutral" },
  },
  {
    id: "guarantee",
    feature: "Project Success Guarantee",
    icon: Star,
    catalance: { label: "Yes, We've Got Your Back", tone: "positive" },
    fiverr: { label: "No Guarantee", tone: "negative" },
    upwork: { label: "No Guarantee", tone: "negative" },
  },
  {
    id: "offers",
    feature: "Custom Offers",
    icon: Tag,
    catalance: { label: "Yes", tone: "positive" },
    fiverr: { label: "Limited", tone: "negative" },
    upwork: { label: "Yes", tone: "positive" },
  },
  {
    id: "quality",
    feature: "Quality of Work",
    icon: Sparkles,
    catalance: { label: "Top 1% Talent", tone: "positive" },
    fiverr: { label: "Varies", tone: "negative" },
    upwork: { label: "Good", tone: "positive" },
  },
];

const FALLBACK_OPEN_PROJECTS = [
  {
    id: "fallback-project-1",
    title: "Launch-ready Shopify redesign for premium wellness brand",
    serviceName: "Web Development",
    timeline: "4-6 weeks",
    budgetLabel: "Rs. 2,20,000",
    summary: "Need storefront redesign, PDP optimization, and conversion-focused checkout flow.",
    ctaLabel: "View Details",
    ctaTo: "/marketplace",
  },
  {
    id: "fallback-project-2",
    title: "AI lead qualification flow for B2B SaaS outbound team",
    serviceName: "AI Automation",
    timeline: "3-4 weeks",
    budgetLabel: "Rs. 1,40,000",
    summary: "Build lead scoring and routing automation connected to CRM and WhatsApp workflow.",
    ctaLabel: "View Details",
    ctaTo: "/marketplace",
  },
  {
    id: "fallback-project-3",
    title: "Performance creative sprint for fintech paid acquisition",
    serviceName: "Performance Marketing",
    timeline: "2-3 weeks",
    budgetLabel: "Rs. 95,000",
    summary: "Need static and short-form ad creatives with hooks mapped to funnel stages.",
    ctaLabel: "View Details",
    ctaTo: "/marketplace",
  },
  {
    id: "fallback-project-4",
    title: "SEO content cluster for HR-tech product launch campaign",
    serviceName: "SEO",
    timeline: "6-8 weeks",
    budgetLabel: "Rs. 1,10,000",
    summary: "Looking for technical SEO and topic clusters aligned to buyer-intent keywords.",
    ctaLabel: "View Details",
    ctaTo: "/marketplace",
  },
];

const glassPanelClass = "glass-panel border border-white/10 bg-white/[0.04] shadow-[0_24px_80px_-42px_rgba(2,6,23,0.82)] backdrop-blur-xl";
const glassCardClass = "glass-card border border-white/10 bg-white/[0.05] shadow-[0_24px_70px_-42px_rgba(2,6,23,0.78)]";
const controlSurfaceClass = "themed-input border-white/10 bg-black/20 text-white placeholder:text-slate-500";
const numberFieldClass = "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";
const MARKETPLACE_PAGE_SIZE = 12;
const deliveryLabels = {
  less_than_2_weeks: "< 2 weeks",
  two_weeks: "2 weeks",
  "2_4_weeks": "2-4 weeks",
  "1_3_months": "1-3 months",
  "3_plus_months": "3+ months",
  rush: "Rush (< 1 week)"
};

const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};

const getInitials = (name = "") =>
  String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "C";

const getGradient = (seed = "") => {
  const gradients = [
    "from-sky-400/35 via-cyan-300/20 to-slate-900/85",
    "from-emerald-400/35 via-teal-300/20 to-slate-900/85",
    "from-primary/35 via-primary/50/20 to-slate-900/85",
    "from-rose-300/35 via-pink-300/20 to-slate-900/85"
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
};

const formatPrice = (price, range) => {
  const numeric = Number(price);
  if (Number.isFinite(numeric) && numeric > 0) return `Rs. ${numeric.toLocaleString("en-IN")}`;
  if (range) {
    const normalizedRange = String(range).replace(/inr/gi, "Rs.").trim();
    const firstValue = normalizedRange.split(/\s*(?:-|–|—|to)\s*/i)[0]?.trim() || normalizedRange;
    return /rs\.?/i.test(firstValue) ? firstValue : `Rs. ${firstValue}`;
  }
  return "Contact for pricing";
};

const normalizeRoleToken = (value = "") =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const parseBooleanFlag = (value) => {
  if (value === true) return true;
  if (value === false || value === null || value === undefined) return false;
  if (typeof value === "number") return value === 1;
  const normalized = String(value || "").trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(normalized)) return true;
  if (["false", "0", "no", "n", ""].includes(normalized)) return false;
  return false;
};

const getRelativePostedLabel = (value) => {
  if (!value) return "Recently posted";

  const postedAt = new Date(value);
  if (Number.isNaN(postedAt.getTime())) return "Recently posted";

  const diffMs = Date.now() - postedAt.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "Posted just now";
  if (diffMinutes < 60) return `Posted ${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Posted ${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `Posted ${diffDays}d ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `Posted ${diffMonths}mo ago`;

  const diffYears = Math.floor(diffMonths / 12);
  return `Posted ${diffYears}y ago`;
};

const formatProjectBudget = (project = {}) => {
  const numericBudget = Number(project?.budget);
  if (Number.isFinite(numericBudget) && numericBudget > 0) {
    return `Rs. ${numericBudget.toLocaleString("en-IN")}`;
  }
  const budgetSummary = String(project?.budgetSummary || "").trim();
  if (budgetSummary) return budgetSummary;
  return "Budget on request";
};

const resolveProjectCardCta = (project = {}) =>
  project?.hasSubmittedProposal
    ? {
        label: "View Details",
        to: `/freelancer/project/${project.id}`,
      }
    : {
        label: "Send Proposal",
        to: "/freelancer/proposals",
      };

const scrollToSection = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const normalizeKey = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const formatTokenLabel = (value = "") =>
  String(value || "")
    .replace(/[_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const resolveMarketplaceServiceKey = (service = {}) => {
  const candidates = [
    service.value,
    service.slug,
    service.id,
    service.name,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeKey(candidate);
    if (!normalized) continue;
    if (SERVICE_KEY_ALIASES[normalized]) return SERVICE_KEY_ALIASES[normalized];
    if (SERVICE_META_BY_KEY[normalized]) return normalized;
  }

  return normalizeKey(service.slug || service.id || service.name);
};

const normalizeQuestionOptions = (question = {}) =>
  (Array.isArray(question?.options) ? question.options : [])
    .map((option) => {
      if (typeof option === "string") {
        return { value: option, label: option };
      }

      if (option && typeof option === "object") {
        return {
          value: option.value || option.label || "",
          label: option.label || option.value || "",
        };
      }

      return null;
    })
    .filter((option) => option?.label);

const dedupeLabeledOptions = (values = []) => {
  const seen = new Set();
  const result = [];

  values.forEach((entry) => {
    const label = String(entry?.label || "").trim();
    const value = String(entry?.value || label).trim();
    const key = normalizeKey(value || label);
    if (!label || !key || seen.has(key)) return;
    seen.add(key);
    result.push({
      value: value || label,
      label,
    });
  });

  return result;
};

const dedupeServiceCategories = (values = []) => {
  const seen = new Set();
  const result = [];

  values.forEach((entry) => {
    const key = normalizeKey(entry?.value || entry?.slug || entry?.name);
    if (!key || seen.has(key)) return;
    seen.add(key);
    result.push(entry);
  });

  return result;
};

const dedupeOptionsByValue = (values = []) => {
  const seen = new Set();
  const result = [];

  values.forEach((entry) => {
    const key = normalizeKey(entry?.value || entry?.label);
    if (!key || seen.has(key)) return;
    seen.add(key);
    result.push(entry);
  });

  return result;
};

const buildServiceCategoryEntry = (service = {}) => {
  const value = resolveMarketplaceServiceKey(service);
  const meta = SERVICE_META_BY_KEY[value] || {};

  return {
    ...service,
    value,
    label: service.name || meta.label || formatTokenLabel(value),
    description:
      service.description ||
      meta.description ||
      "Browse specialists and compare offers in this lane.",
    icon: meta.icon || Sparkles,
  };
};

const toQueryableTechValue = (option = {}) => {
  const rawLabel = String(option?.label || option?.value || "").trim();
  const baseLabel = rawLabel.split("(")[0]?.trim() || rawLabel;
  const normalized = normalizeKey(baseLabel);

  if (normalized === "html_css_js") return "JavaScript";
  if (normalized === "node_js") return "Node.js";
  if (normalized === "react_next_js") return "Next.js";
  if (normalized === "vue_nuxt") return "Vue";
  if (normalized === "postgresql_mysql") return "PostgreSQL";

  return baseLabel || rawLabel;
};

const extractTechOptionsFromData = (items = []) => {
  const counts = new Map();
  const labelsByKey = new Map();

  items.forEach((item) => {
    [
      ...(Array.isArray(item?.techStack) ? item.techStack : []),
      ...(Array.isArray(item?.serviceDetails?.techStack) ? item.serviceDetails.techStack : []),
      ...(Array.isArray(item?.serviceDetails?.skillsAndTechnologies)
        ? item.serviceDetails.skillsAndTechnologies
        : []),
      ...(Array.isArray(item?.serviceDetails?.serviceSpecializations)
        ? item.serviceDetails.serviceSpecializations
        : []),
    ].forEach((entry) => {
      const label = String(entry || "").trim();
      const key = normalizeKey(label);
      if (!label || !key || label.length > 28) return;
      counts.set(key, (counts.get(key) || 0) + 1);
      if (!labelsByKey.has(key)) labelsByKey.set(key, label);
    });
  });

  return Array.from(counts.entries())
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return String(labelsByKey.get(a[0]) || "").localeCompare(String(labelsByKey.get(b[0]) || ""));
    })
    .slice(0, 12)
    .map(([key]) => {
      const label = labelsByKey.get(key) || formatTokenLabel(key);
      return { value: label, label };
    });
};

const getQuestionById = (service = {}, matcher = () => false) =>
  (Array.isArray(service?.questions) ? service.questions : []).find((question) => matcher(question));

const getWebTechOptions = (service = {}, selectedBuildModes = []) => {
  const selectedModes = new Set(selectedBuildModes);
  const includeCode = selectedModes.size === 0 || selectedModes.has("code");
  const includeNoCode = selectedModes.size === 0 || selectedModes.has("no_code");
  const options = [];

  if (includeNoCode) {
    const noCodeQuestion = getQuestionById(service, (question) =>
      ["platform_choice", "platform", "platform_based"].includes(normalizeKey(question?.id))
    );
    const noCodeOptions = normalizeQuestionOptions(noCodeQuestion);
    options.push(
      ...(
        noCodeOptions.length
          ? noCodeOptions
          : WEB_NO_CODE_FALLBACK_OPTIONS.map((label) => ({ value: label, label }))
      )
    );
  }

  if (includeCode) {
    const codeQuestions = (Array.isArray(service?.questions) ? service.questions : []).filter((question) =>
      /^coded_/.test(String(question?.id || ""))
    );
    const codeOptions = codeQuestions.flatMap((question) => normalizeQuestionOptions(question));
    options.push(
      ...(
        codeOptions.length
          ? codeOptions
          : WEB_CODE_FALLBACK_OPTIONS.map((label) => ({ value: label, label }))
      )
    );
  }

  return dedupeOptionsByValue(
    dedupeLabeledOptions(options).map((option) => ({
      ...option,
      value: toQueryableTechValue(option),
    }))
  );
};

const toggleSelection = (values = [], nextValue = "") =>
  values.includes(nextValue)
    ? values.filter((value) => value !== nextValue)
    : [...values, nextValue];

const parsePositiveInteger = (value) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const readMarketplaceSearchState = () => {
  if (typeof window === "undefined") {
    return {
      q: "",
      category: "all",
      selectedSubCategoryId: null,
      selectedToolId: null,
      selectedBuildModes: [],
      minBudget: "",
      maxBudget: "",
      sort: "newest",
      duration: "",
      rating: "",
      page: 1,
      view: "",
    };
  }

  const params = new URLSearchParams(window.location.search);
  const getValue = (key) => String(params.get(key) || "").trim();
  const allowedBuildModes = new Set(WEB_MODE_OPTIONS.map((option) => option.value));

  return {
    q: getValue("q"),
    category: normalizeKey(getValue("category")) || "all",
    selectedSubCategoryId: parsePositiveInteger(params.get("subCategoryId")),
    selectedToolId: parsePositiveInteger(params.get("toolId")),
    selectedBuildModes: getValue("buildMode")
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => allowedBuildModes.has(entry)),
    minBudget: getValue("minBudget"),
    maxBudget: getValue("maxBudget"),
    sort: getValue("sort") || "newest",
    duration: getValue("duration"),
    rating: getValue("rating"),
    page: parsePositiveInteger(params.get("page")) || 1,
    view: getValue("view"),
  };
};

const Marketplace = () => {
  const { isAuthenticated, user, authFetch } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const resultsRequestIdRef = useRef(0);
  const projectRequestIdRef = useRef(0);
  const initialSearchStateRef = useRef(readMarketplaceSearchState());
  const initialSearchState = initialSearchStateRef.current;
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("marketplace-page");
    return () => document.documentElement.classList.remove("marketplace-page");
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobileViewport(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isDarkMode = 
    theme === "dark" || 
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [favorites, setFavorites] = useState({});
  const [activeMarketplaceView, setActiveMarketplaceView] = useState(() => {
    const sessionUser = getSession()?.user;
    const roles = Array.isArray(sessionUser?.roles) ? sessionUser.roles : [];
    const roleTokens = [
      normalizeRoleToken(sessionUser?.role),
      ...roles.map((entry) => normalizeRoleToken(entry)),
    ].filter(Boolean);
    if (initialSearchState.view === "projects" && roleTokens.includes("FREELANCER")) {
      return "projects";
    }
    return roleTokens.includes("FREELANCER") ? "projects" : "freelancers";
  });
  const [q, setQ] = useState(initialSearchState.q);
  const [category, setCategory] = useState(initialSearchState.category);
  const [filterServices, setFilterServices] = useState([]);
  const [filterServicesLoading, setFilterServicesLoading] = useState(true);
  const [subCategoryOptions, setSubCategoryOptions] = useState([]);
  const [subCategoriesLoading, setSubCategoriesLoading] = useState(false);
  const [toolOptions, setToolOptions] = useState([]);
  const [toolsLoading, setToolsLoading] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(
    initialSearchState.selectedSubCategoryId
  );
  const [selectedToolId, setSelectedToolId] = useState(initialSearchState.selectedToolId);
  const [selectedBuildModes, setSelectedBuildModes] = useState(
    initialSearchState.selectedBuildModes
  );
  const [minBudget, setMinBudget] = useState(initialSearchState.minBudget);
  const [maxBudget, setMaxBudget] = useState(initialSearchState.maxBudget);
  const [sort, setSort] = useState(initialSearchState.sort);
  const [duration, setDuration] = useState(initialSearchState.duration);
  const [rating, setRating] = useState(initialSearchState.rating);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [draftCategory, setDraftCategory] = useState("all");
  const [draftMinBudget, setDraftMinBudget] = useState("100000");
  const [draftMaxBudget, setDraftMaxBudget] = useState("500000");
  const [draftDuration, setDraftDuration] = useState("");
  const [draftRating, setDraftRating] = useState("");
  const [draftBuildModes, setDraftBuildModes] = useState([]);

  const syncDraftFilters = useCallback(() => {
    setDraftCategory(category);
    setDraftMinBudget(minBudget || "100000");
    setDraftMaxBudget(maxBudget || "500000");
    setDraftDuration(duration);
    setDraftRating(rating);
    setDraftBuildModes(selectedBuildModes);
  }, [category, minBudget, maxBudget, duration, rating, selectedBuildModes]);

  const applyFilters = () => {
    setCategory(draftCategory);
    setMinBudget(draftMinBudget === "100000" ? "" : draftMinBudget);
    setMaxBudget(draftMaxBudget === "500000" ? "" : draftMaxBudget);
    setDuration(draftDuration);
    setRating(draftRating);
    setSelectedBuildModes(draftBuildModes);
    setIsFilterOpen(false);
  };

  const clearDraftFilters = () => {
    setDraftCategory("all");
    setDraftMinBudget("100000");
    setDraftMaxBudget("500000");
    setDraftDuration("");
    setDraftRating("");
    setDraftBuildModes([]);
  };

  const [page, setPage] = useState(initialSearchState.page);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const [projectData, setProjectData] = useState([]);
  const [projectTotal, setProjectTotal] = useState(0);
  const [projectTotalPages, setProjectTotalPages] = useState(0);
  const [projectLoading, setProjectLoading] = useState(false);
  const [projectAccessError, setProjectAccessError] = useState("");
  const [openFaqItems, setOpenFaqItems] = useState({});
  const previousCategoryRef = useRef(category);
  const didInitializeBuildModesRef = useRef(false);
  const didInitializePageResetRef = useRef(false);

  const sessionUser = useMemo(() => user ?? getSession()?.user ?? null, [user]);
  const viewerRoleTokens = useMemo(() => {
    const roles = Array.isArray(sessionUser?.roles) ? sessionUser.roles : [];
    return [
      normalizeRoleToken(sessionUser?.role),
      ...roles.map((entry) => normalizeRoleToken(entry)),
    ].filter(Boolean);
  }, [sessionUser]);
  const canUseClientWishlist =
    isAuthenticated && viewerRoleTokens.includes("CLIENT");
  const wishlistOwnerId = canUseClientWishlist ? sessionUser?.id : null;

  const canViewProjectsMarketplace =
    isAuthenticated && normalizeRoleToken(user?.role) === "FREELANCER";

  const serviceCategories = useMemo(
    () =>
      (filterServices.length
        ? dedupeServiceCategories(
            filterServices.map((service) =>
              buildServiceCategoryEntry({
                id: service.id,
                key: service.key,
                name: service.name,
                label: service.label || service.name,
                value: service.key,
                slug: service.key,
              })
            )
          )
        : FALLBACK_CATEGORIES
      ).map((entry) => {
        if (entry.icon) {
          return {
            ...entry,
            key: entry.key || entry.value,
          };
        }
        const value = resolveMarketplaceServiceKey(entry);
        const normalized = buildServiceCategoryEntry({ ...entry, value });
        return {
          ...normalized,
          key: normalized.key || normalized.value,
        };
      }),
    [filterServices]
  );

  const activeService = serviceCategories.find((service) => service.value === category) || null;
  const activeBrowseService = activeService;

  const debouncedQ = useDebounce(q, 180);
  const debouncedMin = useDebounce(minBudget, 400);
  const debouncedMax = useDebounce(maxBudget, 400);
  const shouldShowResults = category !== "all" || Boolean(String(debouncedQ || "").trim());
  const sparklesEnabled = !shouldReduceMotion && !isMobileViewport;
  const sparklesDensity = isMobileViewport ? 60 : 120;
  const sparklesSpeed = isMobileViewport ? 0.35 : 0.55;

  useEffect(() => {
    if (!canUseClientWishlist || !wishlistOwnerId) {
      setFavorites({});
      return;
    }

    const storedFavorites = loadMarketplaceFavorites(wishlistOwnerId);
    setFavorites(storedFavorites.favoriteMap);
  }, [canUseClientWishlist, wishlistOwnerId]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia("(max-width: 1024px)");
    const syncViewport = () => setIsMobileViewport(mediaQuery.matches);
    syncViewport();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncViewport);
      return () => mediaQuery.removeEventListener("change", syncViewport);
    }

    mediaQuery.addListener(syncViewport);
    return () => mediaQuery.removeListener(syncViewport);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchFilterServices = async () => {
      setFilterServicesLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/marketplace/filters/services`);
        if (!res.ok) throw new Error("Failed to fetch marketplace filter services");
        const json = await res.json();
        if (cancelled) return;
        const services = Array.isArray(json?.data) ? json.data : [];
        setFilterServices(services);
      } catch (error) {
        console.error("[Marketplace] Failed to load filter services:", error);
        if (!cancelled) setFilterServices([]);
      } finally {
        if (!cancelled) setFilterServicesLoading(false);
      }
    };

    void fetchFilterServices();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!didInitializeBuildModesRef.current) {
      didInitializeBuildModesRef.current = true;
      return;
    }
    setSelectedBuildModes([]);
  }, [category]);

  useEffect(() => {
    if (canViewProjectsMarketplace && activeMarketplaceView !== "projects") {
      setActiveMarketplaceView("projects");
      return;
    }
    if (!canViewProjectsMarketplace && activeMarketplaceView === "projects") {
      setActiveMarketplaceView("freelancers");
    }
  }, [activeMarketplaceView, canViewProjectsMarketplace]);

  useEffect(() => {
    let cancelled = false;
    const hasCategoryChanged = previousCategoryRef.current !== category;
    previousCategoryRef.current = category;

    if (category === "all") {
      setSelectedServiceId(null);
      setSelectedSubCategoryId(null);
      setSelectedToolId(null);
      setSubCategoryOptions([]);
      setToolOptions([]);
      setSubCategoriesLoading(false);
      setToolsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const selectedService =
      filterServices.find(
        (service) =>
          resolveMarketplaceServiceKey({
            ...service,
            value: service.key,
            slug: service.key,
          }) === category
      ) || null;
    const nextServiceId = Number.isInteger(selectedService?.id) ? selectedService.id : null;

    setSelectedServiceId(nextServiceId);
    if (hasCategoryChanged) {
      setSelectedSubCategoryId(null);
      setSelectedToolId(null);
      setToolOptions([]);
    }

    if (!nextServiceId) {
      setSubCategoryOptions([]);
      setSubCategoriesLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const fetchSubCategories = async () => {
      setSubCategoriesLoading(true);
      try {
        const query = new URLSearchParams({ serviceId: String(nextServiceId) });
        const res = await fetch(`${API_BASE_URL}/marketplace/filters/sub-categories?${query.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch sub-categories");
        const json = await res.json();
        if (cancelled) return;
        setSubCategoryOptions(Array.isArray(json?.data) ? json.data : []);
      } catch (error) {
        console.error("[Marketplace] Failed to load sub-categories:", error);
        if (!cancelled) setSubCategoryOptions([]);
      } finally {
        if (!cancelled) setSubCategoriesLoading(false);
      }
    };

    void fetchSubCategories();

    return () => {
      cancelled = true;
    };
  }, [category, filterServices]);

  useEffect(() => {
    let cancelled = false;

    if (!selectedSubCategoryId) {
      setSelectedToolId(null);
      setToolOptions([]);
      setToolsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const fetchTools = async () => {
      setToolsLoading(true);
      try {
        const query = new URLSearchParams({ subCategoryId: String(selectedSubCategoryId) });
        const res = await fetch(`${API_BASE_URL}/marketplace/filters/tools?${query.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch tools");
        const json = await res.json();
        if (cancelled) return;
        setToolOptions(Array.isArray(json?.data) ? json.data : []);
      } catch (error) {
        console.error("[Marketplace] Failed to load tools:", error);
        if (!cancelled) setToolOptions([]);
      } finally {
        if (!cancelled) setToolsLoading(false);
      }
    };

    void fetchTools();

    return () => {
      cancelled = true;
    };
  }, [selectedSubCategoryId]);

  const toggleFavorite = (event, item) => {
    event.preventDefault();
    event.stopPropagation();
    if (!canUseClientWishlist || !wishlistOwnerId) return;

    const favoriteId = String(item?.id || "").trim();
    if (!favoriteId) return;

    setFavorites((current) => {
      const isSelected = Boolean(current[favoriteId]);
      const nextFavoriteMap = { ...current };
      if (isSelected) {
        delete nextFavoriteMap[favoriteId];
      } else {
        nextFavoriteMap[favoriteId] = true;
      }

      const { itemSnapshots } = loadMarketplaceFavorites(wishlistOwnerId);
      const nextSnapshots = { ...itemSnapshots };

      if (isSelected) {
        delete nextSnapshots[favoriteId];
      } else {
        const snapshot = createMarketplaceFavoriteSnapshot(item);
        if (snapshot) {
          nextSnapshots[favoriteId] = snapshot;
        }
      }

      saveMarketplaceFavorites(wishlistOwnerId, {
        favoriteMap: nextFavoriteMap,
        itemSnapshots: nextSnapshots,
      });

      return nextFavoriteMap;
    });
  };

  const fetchResults = useCallback(async () => {
    const requestId = resultsRequestIdRef.current + 1;
    resultsRequestIdRef.current = requestId;

    if (activeMarketplaceView !== "freelancers") {
      if (requestId === resultsRequestIdRef.current) {
        setLoading(false);
      }
      return;
    }

    if (!shouldShowResults) {
      if (requestId === resultsRequestIdRef.current) {
        setData([]);
        setTotal(0);
        setTotalPages(0);
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      const query = new URLSearchParams({ q: debouncedQ, sort, page: String(page), limit: String(MARKETPLACE_PAGE_SIZE) });
      if (category !== "all") query.append("category", category);
      if (selectedServiceId) query.append("serviceId", String(selectedServiceId));
      if (selectedSubCategoryId) query.append("subCategoryId", String(selectedSubCategoryId));
      if (selectedToolId) query.append("toolId", String(selectedToolId));
      if (selectedBuildModes.length) query.append("buildMode", selectedBuildModes.join(","));
      if (debouncedMin) query.append("minBudget", debouncedMin);
      if (debouncedMax) query.append("maxBudget", debouncedMax);
      if (duration) query.append("duration", duration);
      if (rating) query.append("rating", rating);
      const res = await fetch(`${API_BASE_URL}/marketplace?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch marketplace");
      const json = await res.json();
      if (requestId !== resultsRequestIdRef.current) return;
      setData(json?.data || []);
      setTotal(json?.total || 0);
      setTotalPages(json?.totalPages || 0);
    } catch (error) {
      if (requestId !== resultsRequestIdRef.current) return;
      console.error(error);
      setData([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      if (requestId === resultsRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [activeMarketplaceView, category, debouncedMax, debouncedMin, debouncedQ, duration, page, rating, selectedBuildModes, selectedServiceId, selectedSubCategoryId, selectedToolId, shouldShowResults, sort]);

  const fetchProjectResults = useCallback(async () => {
    const requestId = projectRequestIdRef.current + 1;
    projectRequestIdRef.current = requestId;

    const projectsModeActive = canViewProjectsMarketplace || activeMarketplaceView === "projects";
    if (!projectsModeActive) {
      if (requestId === projectRequestIdRef.current) {
        setProjectLoading(false);
      }
      return;
    }

    if (!canViewProjectsMarketplace) {
      if (requestId === projectRequestIdRef.current) {
        setProjectData([]);
        setProjectTotal(0);
        setProjectTotalPages(0);
        setProjectAccessError("");
        setProjectLoading(false);
      }
      return;
    }

    setProjectLoading(true);
    setProjectAccessError("");
    try {
      const query = new URLSearchParams({
        q: debouncedQ,
        page: String(page),
        limit: String(MARKETPLACE_PAGE_SIZE),
      });
      if (category !== "all") query.append("category", category);
      if (selectedServiceId) query.append("serviceId", String(selectedServiceId));
      if (selectedSubCategoryId) query.append("subCategoryId", String(selectedSubCategoryId));
      if (selectedToolId) query.append("toolId", String(selectedToolId));
      if (debouncedMin) query.append("minBudget", debouncedMin);
      if (debouncedMax) query.append("maxBudget", debouncedMax);

      const response = await authFetch(`/marketplace/projects/live?${query.toString()}`, {
        method: "GET",
        suppressToast: true,
        skipLogoutOn401: true,
      });

      if (response.status === 403) {
        if (requestId !== projectRequestIdRef.current) return;
        setProjectData([]);
        setProjectTotal(0);
        setProjectTotalPages(0);
        setProjectAccessError("Only logged-in freelancers can view live client projects.");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch marketplace projects");
      }

      const payload = await response.json();
      if (requestId !== projectRequestIdRef.current) return;
      const nextData = Array.isArray(payload?.data) ? payload.data : [];

      setProjectData(nextData);
      setProjectTotal(Number(payload?.total || 0));
      setProjectTotalPages(Number(payload?.totalPages || 0));
    } catch (error) {
      if (requestId !== projectRequestIdRef.current) return;
      if (error?.code === 401) {
        setProjectAccessError("Log in as freelancer to view live client projects.");
      } else {
        console.error("[Marketplace] Failed to load live projects:", error);
        setProjectAccessError("Unable to load live projects right now.");
      }
      setProjectData([]);
      setProjectTotal(0);
      setProjectTotalPages(0);
    } finally {
      if (requestId === projectRequestIdRef.current) {
        setProjectLoading(false);
      }
    }
  }, [activeMarketplaceView, authFetch, canViewProjectsMarketplace, category, debouncedMax, debouncedMin, debouncedQ, page, selectedServiceId, selectedSubCategoryId, selectedToolId]);

  useEffect(() => {
    if (!didInitializePageResetRef.current) {
      didInitializePageResetRef.current = true;
      return;
    }
    setPage(1);
  }, [
    activeMarketplaceView,
    debouncedQ,
    category,
    debouncedMin,
    debouncedMax,
    duration,
    rating,
    selectedBuildModes,
    selectedServiceId,
    selectedSubCategoryId,
    selectedToolId,
    sort,
  ]);
  useEffect(() => void fetchResults(), [fetchResults]);
  useEffect(() => void fetchProjectResults(), [fetchProjectResults]);

  const marketplaceSearchParams = useMemo(() => {
    const params = new URLSearchParams();
    const normalizedQuery = String(q || "").trim();
    if (normalizedQuery) params.set("q", normalizedQuery);
    if (category !== "all") params.set("category", category);
    if (selectedSubCategoryId) params.set("subCategoryId", String(selectedSubCategoryId));
    if (selectedToolId) params.set("toolId", String(selectedToolId));
    if (selectedBuildModes.length > 0) params.set("buildMode", selectedBuildModes.join(","));
    if (minBudget) params.set("minBudget", String(minBudget).trim());
    if (maxBudget) params.set("maxBudget", String(maxBudget).trim());
    if (sort && sort !== "newest") params.set("sort", sort);
    if (duration) params.set("duration", duration);
    if (rating) params.set("rating", rating);
    if (page > 1) params.set("page", String(page));
    if (activeMarketplaceView === "projects") params.set("view", "projects");
    return params.toString();
  }, [
    activeMarketplaceView,
    category,
    duration,
    maxBudget,
    minBudget,
    page,
    q,
    rating,
    selectedBuildModes,
    selectedSubCategoryId,
    selectedToolId,
    sort,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const nextUrl = [
      window.location.pathname,
      marketplaceSearchParams ? `?${marketplaceSearchParams}` : "",
    ].join("");
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (nextUrl !== currentUrl) {
      window.history.replaceState(window.history.state || {}, "", nextUrl);
    }
  }, [marketplaceSearchParams]);

  const resetFilters = () => {
    setQ("");
    setCategory("all");
    setSelectedBuildModes([]);
    setSelectedServiceId(null);
    setSelectedSubCategoryId(null);
    setSelectedToolId(null);
    setSubCategoryOptions([]);
    setToolOptions([]);
    setMinBudget("");
    setMaxBudget("");
    setDuration("");
    setRating("");
    setSort("newest");
  };

  const handleCategorySelect = (nextCategory) => {
    if (nextCategory === category) {
      setCategory("all");
      return;
    }
    setCategory(nextCategory);
  };

  const handleSubCategorySelect = (nextValue) => {
    setSelectedSubCategoryId((current) => {
      if (current === nextValue) return null;
      return nextValue;
    });
    setSelectedToolId(null);
  };

  const handleToolSelect = (nextValue) => {
    setSelectedToolId((current) => (current === nextValue ? null : nextValue));
  };

  const toggleFaqItem = (question) => {
    setOpenFaqItems((current) => ({
      ...current,
      [question]: !current[question],
    }));
  };

  const visibleBrowseServices = useMemo(
    () =>
      serviceCategories.filter((service) => {
        if (!debouncedQ || category !== "all") return true;
        const blob = [service.label, service.description].join(" ").toLowerCase();
        return blob.includes(debouncedQ.toLowerCase());
      }),
    [category, debouncedQ, serviceCategories]
  );
  const isProjectsView = canViewProjectsMarketplace || activeMarketplaceView === "projects";
  const shouldRenderFreelancerResults =
    !canViewProjectsMarketplace &&
    activeMarketplaceView === "freelancers" &&
    shouldShowResults;
  const activeTotalPages = isProjectsView ? projectTotalPages : totalPages;

  const openProjectsShowcase = useMemo(() => {
    if (Array.isArray(projectData) && projectData.length) {
      return {
        isFallback: false,
        items: projectData.slice(0, 4).map((item, index) => {
          const timeline = String(item?.timeline || item?.duration || "").trim();
          const cta = resolveProjectCardCta(item);
          return {
            id: item?.id || `project-${index}`,
            title: item?.title || "Untitled project",
            serviceName: item?.serviceName || activeBrowseService?.label || activeService?.label || "General service",
            timeline: timeline || "Timeline shared on discussion",
            budgetLabel: formatProjectBudget(item),
            summary: String(item?.summary || item?.description || "").trim() || "No project summary provided yet.",
            ctaLabel: cta.label,
            ctaTo: cta.to,
          };
        }),
      };
    }

    return {
      isFallback: true,
      items: FALLBACK_OPEN_PROJECTS.map((entry) => ({
        ...entry,
        ctaLabel: canViewProjectsMarketplace ? "Explore Marketplace" : "Join as freelancer",
        ctaTo: canViewProjectsMarketplace ? "/marketplace" : "/signup?role=freelancer",
      })),
    };
  }, [activeBrowseService?.label, activeService?.label, canViewProjectsMarketplace, projectData]);

  const marketplaceBrowseActions = (
    <Dialog open={isFilterOpen} onOpenChange={(open) => { setIsFilterOpen(open); if (open) syncDraftFilters(); }}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="h-11 shrink-0 rounded-full bg-white/[0.04] px-5 text-[13px] font-semibold text-slate-200 hover:bg-white/10 hover:text-white">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="w-[90vw] max-w-[760px] rounded-[24px] border border-border bg-card p-0 shadow-2xl sm:w-[760px] [&>button]:hidden overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-8 py-6">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold tracking-tight text-foreground">Filters</h3>
            <p className="text-sm text-muted-foreground">Refine your search</p>
          </div>
          <button type="button" onClick={() => setIsFilterOpen(false)} className="rounded-full p-2 text-muted-foreground hover:bg-foreground/10 hover:text-foreground">
            <X className="h-6 w-6" />
          </button>
        </div>

          <div className="grid max-h-[70vh] grid-cols-1 gap-x-16 gap-y-10 overflow-x-hidden overflow-y-auto px-8 py-8 no-scrollbar sm:grid-cols-2">
          <div className="space-y-6">
            <h4 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.15em] text-[var(--primary)]">
              <Banknote className="h-5 w-5" /> PRICE RANGE
            </h4>
            <div className="px-2">
              <Slider
                min={0}
                max={1000000}
                step={10000}
                value={[Number(draftMinBudget), Number(draftMaxBudget)]}
                onValueChange={([min, max]) => { setDraftMinBudget(String(min)); setDraftMaxBudget(String(max)); }}
                className="[&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:border-[var(--primary)] [&_[role=slider]]:bg-[var(--primary)] [&_[role=track]]:h-2 [&_[role=track]]:bg-muted [&>.relative>.absolute]:bg-[var(--primary)]"
              />
            </div>
            <div className="flex items-center justify-between px-1 text-sm font-semibold text-foreground">
              <span>Rs. {Number(draftMinBudget).toLocaleString("en-IN")}</span>
              <span>Rs. {Number(draftMaxBudget).toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              <Clock className="h-5 w-5" /> DURATION
            </h4>
            <div className="flex flex-col gap-4">
              {["Up to 4 weeks", "5-6 weeks", "7+ weeks"].map((label) => {
                const active = draftDuration === label;
                return (
                  <button key={label} type="button" onClick={() => setDraftDuration(active ? "" : label)} className="flex items-center gap-3 text-[15px] font-medium text-muted-foreground hover:text-foreground">
                    <div className={cn("flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 transition-all", active ? "border-[var(--primary)] bg-[var(--primary)]" : "border-border bg-transparent")}>
                      {active && <Check className="h-3 w-3 text-black" strokeWidth={3} />}
                    </div>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              <Star className="h-5 w-5" /> RATINGS
            </h4>
            <div className="flex flex-col gap-4">
              {["4.5+ Stars", "4.0+ Stars"].map((label) => {
                const active = draftRating === label;
                return (
                  <button key={label} type="button" onClick={() => setDraftRating(active ? "" : label)} className="flex items-center gap-3 text-[15px] font-medium text-muted-foreground hover:text-foreground">
                    <div className={cn("flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 transition-all", active ? "border-[var(--primary)] bg-transparent" : "border-border bg-transparent")}>
                      {active && <div className="h-2.5 w-2.5 rounded-full bg-[var(--primary)]" />}
                    </div>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

            <div className="space-y-6 pb-2">
              <h4 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                <Tag className="h-5 w-5" /> CATEGORIES
            </h4>
            <div className="flex flex-wrap gap-3">
              {serviceCategories.map((c) => {
                const active = draftCategory === c.value;
                return (
                  <button
                    key={c.value}
                    onClick={() => setDraftCategory(active ? "all" : c.value)}
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-5 py-2.5 text-[14px] font-semibold transition-all",
                      active
                        ? "border-[var(--primary)] text-[var(--primary)]"
                        : "border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground"
                    )}
                  >
                    {active && <Code2 className="h-4 w-4" />}
                    {c.label}
                  </button>
                );
              })}
              </div>
            </div>

            {draftCategory === "web_development" ? (
              <div className="space-y-6 pb-2">
                <h4 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  <Code2 className="h-5 w-5" /> BUILD MODE
                </h4>
                <div className="flex flex-wrap gap-3">
                  {WEB_MODE_OPTIONS.map((option) => {
                    const active = draftBuildModes.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setDraftBuildModes((current) => toggleSelection(current, option.value))}
                        className={cn(
                          "rounded-full border px-4 py-2.5 text-sm font-semibold transition-all",
                          active
                            ? "border-[var(--primary)]/45 bg-[var(--primary)]/12 text-[var(--primary)]"
                            : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

        <div className="flex items-center justify-between rounded-none border-t border-border bg-muted/30 px-8 py-6 shadow-2xl">
          <button onClick={clearDraftFilters} className="text-[13px] font-bold uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground">
            RESET
          </button>
          <Button onClick={applyFilters} className="h-12 min-w-[160px] rounded-full border border-[var(--primary)]/40 bg-[var(--primary)] px-8 text-[14px] font-bold text-[var(--primary-foreground)] drop-shadow-[0_0_15px_rgba(var(--brand-rgb),0.25)] hover:bg-[var(--primary)]/90 hover:opacity-90 active:scale-95">
            APPLY FILTERS
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Full Screen Hero Section */}
      <section className="relative flex w-full flex-col items-center justify-start overflow-hidden bg-background pt-24 pb-0">
        {/* Diagonal Grid Background */}
        <div
          className="absolute inset-0 z-0 opacity-[0.4] dark:opacity-[0.1]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 1px, transparent 20px),
              repeating-linear-gradient(-45deg, currentColor 0, currentColor 1px, transparent 1px, transparent 20px)
            `,
            backgroundSize: "40px 40px",
            color: isDarkMode ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.15)"
          }}
        />

        {/* Sparkles Background */}
        {sparklesEnabled ? (
          <div className="absolute inset-0 z-0 pointer-events-none opacity-45">
            <SparklesBackground
              className="h-full w-full"
              density={sparklesDensity}
              speed={sparklesSpeed}
              minSpeed={0.12}
              size={0.9}
              minSize={0.35}
              opacity={0.45}
              minOpacity={0.08}
              color="#ffffff"
              options={{ fpsLimit: 60 }}
            />
          </div>
        ) : null}

        {/* Glow Behind Planet */}
        <div className="pointer-events-none absolute bottom-[15%] left-1/2 h-[600px] w-[100%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_bottom,rgba(var(--brand-rgb),0.45)_0%,rgba(var(--brand-rgb),0.15)_45%,transparent_70%)] blur-[60px]" />
        <div className="pointer-events-none absolute bottom-[10%] left-1/2 h-[400px] w-[70%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_bottom,rgba(255,255,255,0.8)_0%,rgba(var(--brand-rgb),0.4)_50%,transparent_70%)] blur-[30px]" />

        {/* Hero Section + Full Carousel */}
        <div className="relative z-10 w-full pt-12 pb-8">
          <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
            <div className="relative z-10 mb-32 flex flex-col items-center gap-7 px-4 text-center">
              <h1 className="max-w-[900px] text-[44px] font-medium tracking-tight text-white sm:text-[56px] md:text-[64px] lg:text-[76px] lg:leading-[1.05]">
                <AnimatedHeroText 
                  staticText="Hire experts for" 
                  titles={["High-Impact Work", "Strategic Growth", "Expert Execution", "Verified Results", "Vetted Quality"]}
                  className="flex flex-col items-center"
                />
              </h1>
              <p className="mx-auto max-w-xl text-[17px] leading-relaxed text-[#c9c9c9]">
                Explore verified services, compare talent<br className="hidden sm:block" />fast, curated shortlist clarity.
              </p>
              <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row">
                <Button size="lg" className="h-12 rounded-full border border-[var(--primary)] bg-[var(--primary)] px-8 text-[15px] font-semibold text-[var(--primary-foreground)] transition-all hover:bg-[var(--primary)]/90 hover:opacity-90" onClick={() => scrollToSection("marketplace-results")}>
                  Explore Services
                </Button>
                <Button asChild variant="secondary" size="lg" className="h-12 rounded-full bg-white px-8 text-[15px] font-semibold text-black transition-all hover:bg-white/90">
                  <Link to="/contact">Talk to a strategist</Link>
                </Button>
              </div>
            </div>

            <div id="marketplace-results" className="w-full">
              <ServiceCategoryCarousel
                services={visibleBrowseServices}
                loading={filterServicesLoading}
                onSelectService={handleCategorySelect}
                activeServiceKey={category}
              />
            </div>
          </div>
        </div>

        {/* Planet Horizon */}
        <div className="pointer-events-none absolute bottom-0 left-1/2 w-[150%] -translate-x-1/2 translate-y-[25%] lg:w-[130%]">
          <div className="relative aspect-[3/1] w-full">
            <div className="absolute w-full h-full rounded-[100%] bg-background" />
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{ filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.8))' }}
            >
              <path d="M 20 10 A 50 50 0 0 1 80 10 A 50 45 0 0 0 20 10 Z" fill="#ffffff" />
            </svg>
            <div className="absolute left-1/2 top-[-50px] h-[80px] w-[30%] max-w-[600px] -translate-x-1/2 rounded-[100%] bg-white opacity-20 blur-[40px] mix-blend-screen" />
          </div>
        </div>
      </section>


      {/* ── Freelancer / Project results — appear right after carousel ── */}
      <AnimatePresence>
        {(shouldRenderFreelancerResults || isProjectsView) && category !== "all" && (
          <motion.div
            key="results-panel"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
            exit={{ opacity: 0, y: 16 }}
            className="relative z-20 mx-auto w-full max-w-[1280px] px-4 pt-4 sm:px-6 lg:px-8"
          >
            {/* Active category header */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
                  {isProjectsView ? "Live Projects" : "Specialists"}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-3xl font-bold tracking-tight text-foreground dark:text-white sm:text-4xl">
                    {activeBrowseService?.label || activeService?.label || "All Services"}
                  </h3>
                  {!loading && !projectLoading && (
                    <Badge variant="secondary" className="rounded-full bg-primary/10 px-3 py-1 text-[12px] font-bold text-primary hover:bg-primary/20">
                      {(isProjectsView ? projectTotal : total)} result{(isProjectsView ? projectTotal : total) === 1 ? "" : "s"}
                    </Badge>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setCategory("all"); setSelectedSubCategoryId(null); setSelectedToolId(null); }}
                className="group inline-flex items-center gap-2.5 rounded-full border border-primary/10 bg-white/60 px-5 py-2.5 text-[13px] font-bold text-muted-foreground shadow-sm backdrop-blur-md transition-all hover:border-primary/40 hover:bg-white hover:text-primary dark:border-white/12 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.08]"
              >
                <X className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
                Clear filter
              </button>
            </div>

            {/* Subcategory row */}
            {category !== "all" && (
              <div className="mb-6">
                <SubcategorySection
                  service={activeBrowseService || activeService}
                  subCategories={subCategoryOptions}
                  tools={toolOptions}
                  selectedSubCategoryId={selectedSubCategoryId}
                  selectedToolId={selectedToolId}
                  onSelectSubCategory={handleSubCategorySelect}
                  onSelectTool={handleToolSelect}
                  subCategoriesLoading={subCategoriesLoading}
                  toolsLoading={toolsLoading}
                  hideHeadings
                  hideEmptyMessages
                />
              </div>
            )}

            {/* Freelancer grid */}
            {shouldRenderFreelancerResults && (
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                      {Array.from({ length: MARKETPLACE_PAGE_SIZE }).map((_, index) => (
                        <Card key={`skeleton-${index}`} className={cn(glassCardClass, "overflow-hidden rounded-[28px]")}>
                          <Skeleton className="h-44 w-full rounded-none" />
                          <CardContent className="space-y-4 p-5">
                            <div className="flex items-center gap-3"><Skeleton className="h-11 w-11 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-20" /></div></div>
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-4 w-4/5" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </motion.div>
                ) : data.length === 0 ? (
                  <motion.div key="empty" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="rounded-[34px] border border-dashed border-border bg-card/40 px-6 py-20 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground"><Search className="h-7 w-7" /></div>
                    <h2 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">No specialists found</h2>
                    <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">Try broadening the category or clearing some filters.</p>
                    <Button variant="outline" className="mt-7 rounded-full border-border bg-card px-6 py-5 text-sm font-semibold text-foreground hover:bg-muted" onClick={resetFilters}>Clear all filters</Button>
                  </motion.div>
                ) : (
                  <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                      {data.map((item) => {
                        const image = item.serviceDetails?.coverImage || item.serviceDetails?.image || null;
                        const rating = Number(item.rating || 0);
                        const hasRating = rating > 0;
                        const delivery = item.serviceDetails?.deliveryTime ? deliveryLabels[item.serviceDetails.deliveryTime] || String(item.serviceDetails.deliveryTime).replace(/_/g, " ") : null;
                        const price = formatPrice(item.serviceDetails?.startingPrice || item.serviceDetails?.minBudget || item.serviceDetails?.price, item.serviceDetails?.averageProjectPriceRange || item.serviceDetails?.priceRange);
                        return (
                          <motion.article
                            key={item.id}
                            className="h-full"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, ease: "easeOut" }}
                          >
                            <Link
                              to={`/marketplace/service/${item.id}`}
                              state={{ marketplaceReturnTo: `${location.pathname}${location.search}` }}
                              className="block h-full"
                            >
                              <Card className="group relative h-full overflow-hidden rounded-[28px] border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-lg dark:border-white/8 dark:bg-[#070c18] dark:shadow-[0_22px_70px_-30px_rgba(2,6,23,0.9)]">
                                {/* Image / gradient banner */}
                                <div className="relative h-48 overflow-hidden bg-muted dark:bg-slate-950">
                                  {image
                                    ? <img src={image} alt={item.service || "Marketplace service"} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    : <div className={cn("absolute inset-0 bg-gradient-to-br", getGradient(item.serviceKey || item.id))} />
                                  }
                                  {/* Gradient overlay */}
                                  <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent dark:from-[#070c18] dark:via-[#070c18]/20" />

                                  {/* Wishlist */}
                                  {canUseClientWishlist && (
                                    <div className="absolute right-3 top-3">
                                      <button type="button" onClick={(event) => toggleFavorite(event, item)} aria-label={favorites[item.id] ? "Remove from favorites" : "Add to favorites"} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/60 text-foreground backdrop-blur-md transition hover:bg-background/80 dark:border-white/15 dark:bg-black/60 dark:text-white">
                                        <Heart className={cn("h-3.5 w-3.5", favorites[item.id] ? "fill-rose-500 text-rose-500" : "text-muted-foreground dark:text-slate-200")} />
                                      </button>
                                    </div>
                                  )}

                                  {/* Featured badge */}
                                  {item.isFeatured && (
                                    <div className="absolute bottom-3 left-3">
                                      <Badge className="rounded-full border-none bg-emerald-500/90 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                                        <Sparkles className="mr-1 h-2.5 w-2.5" /> Featured
                                      </Badge>
                                    </div>
                                  )}
                                </div>

                                <CardContent className="flex flex-col gap-3 p-4">
                                  {/* Freelancer row */}
                                  <div className="flex items-center gap-3">
                                    {item.freelancer?.avatar
                                      ? <img src={item.freelancer.avatar} alt={item.freelancer.fullName || "Freelancer"} loading="lazy" decoding="async" className="h-10 w-10 rounded-full border border-border object-cover dark:border-white/10" />
                                      : <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted text-xs font-bold text-foreground dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200">{getInitials(item.freelancer?.fullName)}</div>
                                    }
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5">
                                        <p className="truncate text-sm font-semibold text-foreground dark:text-white">{item.freelancer?.fullName || "Anonymous"}</p>
                                        {parseBooleanFlag(item.freelancer?.isVerified) && <BadgeCheck className="h-3.5 w-3.5 shrink-0 fill-primary text-black" />}
                                      </div>
                                      {hasRating && (
                                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                          <Star className="h-3 w-3 fill-primary text-primary" />
                                          <span className="font-bold text-foreground dark:text-white">{rating.toFixed(1)}</span>
                                          <span className="font-medium">({item.reviewCount || 0} reviews)</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Service title */}
                                  <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">{item.serviceDetails?.categoryLabel || item.serviceCategory || "Service"}</p>
                                    <h3 className="mt-0.5 line-clamp-2 text-[14px] font-semibold leading-snug text-foreground group-hover:text-primary dark:text-white dark:group-hover:text-white/90">
                                      {item.service || "Untitled service"}
                                    </h3>
                                  </div>

                                  {/* Bio snippet */}
                                  {item.bio && <p className="line-clamp-2 text-[12px] leading-relaxed text-muted-foreground dark:text-slate-500">{item.bio}</p>}

                                  {/* Footer: price + CTA */}
                                  <div className="mt-auto flex items-center justify-between border-t border-border pt-3 dark:border-white/6">
                                    <div>
                                      {delivery && (
                                        <div className="mb-1 inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground dark:text-slate-500">
                                          <Clock className="h-3 w-3" />{delivery}
                                        </div>
                                      )}
                                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Starts from</p>
                                      <p className="text-[16px] font-bold tracking-tight text-foreground dark:text-white">{price}</p>
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/35 bg-primary/90 px-3.5 py-2 text-[11px] font-bold text-primary-foreground transition group-hover:bg-primary">
                                      View <ArrowRight className="h-3 w-3" />
                                    </span>
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          </motion.article>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}

          {isProjectsView ? (
            <AnimatePresence mode="wait">
              {projectLoading ? (
                <motion.div key="projects-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                      Live projects
                    </p>
                    <h3 className="text-2xl font-bold tracking-tight text-foreground dark:text-white">
                      Client project listings
                    </h3>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: MARKETPLACE_PAGE_SIZE }).map((_, index) => (
                      <Card key={`project-skeleton-${index}`} className={cn(glassCardClass, "overflow-hidden rounded-[28px]")}>
                        <Skeleton className="h-44 w-full rounded-none" />
                        <CardContent className="space-y-4 p-5">
                          <Skeleton className="h-4 w-3/5" />
                          <Skeleton className="h-6 w-full" />
                          <Skeleton className="h-4 w-5/6" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-10 w-full rounded-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              ) : canViewProjectsMarketplace && projectAccessError ? (
                <motion.div key="projects-access-error" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="rounded-[34px] border border-dashed border-white/10 bg-white/[0.04] px-6 py-16 text-center shadow-[0_24px_80px_-42px_rgba(2,6,23,0.82)]">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.06] text-slate-400"><X className="h-7 w-7" /></div>
                  <h2 className="mt-6 text-2xl font-semibold tracking-tight text-white">Projects marketplace unavailable</h2>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-400">{projectAccessError}</p>
                </motion.div>
              ) : projectData.length === 0 ? (
                <motion.div key="projects-empty" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="rounded-[34px] border border-dashed border-white/10 bg-white/[0.04] px-6 py-20 text-center shadow-[0_24px_80px_-42px_rgba(2,6,23,0.82)]">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.06] text-slate-400"><Search className="h-7 w-7" /></div>
                  <h2 className="mt-6 text-2xl font-semibold tracking-tight text-white">No live projects match this filter yet</h2>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-400">Try broadening service or budget filters to view more client opportunities.</p>
                  <Button variant="outline" className="mt-7 rounded-full border-white/10 bg-white/[0.04] px-6 py-5 text-sm font-semibold text-white hover:bg-white/[0.08]" onClick={resetFilters}>Clear all filters</Button>
                </motion.div>
              ) : (
                <motion.div key="projects-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                      Live projects
                    </p>
                    <h3 className="text-2xl font-semibold tracking-[-0.04em] text-white">
                      Client project listings
                    </h3>
                    <p className="text-sm text-slate-400">
                      {projectTotal} result{projectTotal === 1 ? "" : "s"}
                      {activeBrowseService?.label || activeService?.label
                        ? ` in ${activeBrowseService?.label || activeService?.label}.`
                        : "."}
                    </p>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    {projectData.map((item) => {
                      const timeline = String(item?.timeline || item?.duration || "").trim();
                      const clientLabel = String(item?.companyName || item?.clientName || "").trim();
                      const summary = String(item?.summary || item?.description || "").trim();
                      const cta = resolveProjectCardCta(item);
                      return (
                        <motion.article key={item.id} className="h-full">
                          <Card className="group h-full overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] shadow-[0_22px_70px_-42px_rgba(2,6,23,0.82)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-[0_28px_90px_-40px_color-mix(in_srgb,var(--primary)_22%,transparent)]">
                            <div className="relative h-44 overflow-hidden border-b border-white/10 bg-slate-950">
                              <div className={cn("absolute inset-0 bg-gradient-to-br", getGradient(item.serviceKey || item.id))} />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent" />
                              <div className="absolute inset-x-0 bottom-0 space-y-2 p-4">
                                <Badge className="inline-flex w-fit rounded-full border border-white/20 bg-white/12 px-3 py-1 text-[11px] font-semibold text-white">
                                  {item.serviceName || "General service"}
                                </Badge>
                                <p className="text-xs text-white/80">
                                  {getRelativePostedLabel(item.postedAt || item.createdAt)}
                                </p>
                              </div>
                            </div>
                            <CardContent className="flex min-h-[252px] flex-col p-5">
                              <h3 className="line-clamp-2 text-base font-semibold leading-6 text-white">
                                {item.title || "Untitled project"}
                              </h3>
                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                {item.subCategory ? (
                                  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-slate-300">
                                    {item.subCategory}
                                  </span>
                                ) : null}
                                {timeline ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-slate-300">
                                    <Clock className="h-3 w-3" />
                                    {timeline}
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-3 line-clamp-3 text-xs leading-6 text-slate-400">
                                {summary || "No project summary provided yet."}
                              </p>
                              {clientLabel ? (
                                <p className="mt-3 truncate text-xs font-medium text-slate-300">
                                  Client: {clientLabel}
                                </p>
                              ) : null}
                              <div className="mt-auto flex items-end justify-between border-t border-white/10 pt-4">
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                    Budget
                                  </p>
                                  <p className="mt-1 text-lg font-semibold tracking-tight text-white">
                                    {formatProjectBudget(item)}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  {item.hasSubmittedProposal && item.proposalStatus ? (
                                    <Badge className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
                                      {formatTokenLabel(item.proposalStatus)}
                                    </Badge>
                                  ) : null}
                                  <Link
                                    to={cta.to}
                                    className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:border-primary hover:bg-primary/90"
                                  >
                                    {cta.label}
                                    <ArrowRight className="h-3.5 w-3.5" />
                                  </Link>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.article>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          ) : null}

                     {((shouldRenderFreelancerResults && !loading) || (isProjectsView && !projectLoading)) && activeTotalPages > 1 && (
              <div className="mt-6 flex flex-col gap-4 rounded-[30px] border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-400">
                  Page <span className="font-semibold text-white">{page}</span> of{" "}
                  <span className="font-semibold text-white">{activeTotalPages}</span>
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" size="icon" className="h-11 w-11 rounded-full border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: activeTotalPages }, (_, index) => index + 1)
                    .filter((pageNumber) => {
                      if (activeTotalPages <= 7) return true;
                      if (pageNumber === 1 || pageNumber === activeTotalPages) return true;
                      if (Math.abs(pageNumber - page) <= 1) return true;
                      return false;
                    })
                    .reduce((acc, pageNumber, index, array) => {
                      if (index > 0 && pageNumber - array[index - 1] > 1) acc.push("ellipsis");
                      acc.push(pageNumber);
                      return acc;
                    }, [])
                    .map((item, index) => {
                      if (item === "ellipsis") return <span key={`ellipsis-${index}`} className="px-1 text-slate-500">…</span>;
                      const pageNumber = item;
                      const isCurrentPage = pageNumber === page;
                      return (
                        <div key={pageNumber} className="contents">
                          <Button type="button" variant={isCurrentPage ? "default" : "outline"} size="icon" className={cn("h-11 w-11 rounded-full", isCurrentPage ? "border-primary bg-primary text-black hover:bg-primary/90" : "border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]")} onClick={() => setPage(pageNumber)}>
                            {pageNumber}
                          </Button>
                        </div>
                      );
                    })}
                  <Button type="button" variant="outline" size="icon" className="h-11 w-11 rounded-full border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]" disabled={page >= activeTotalPages} onClick={() => setPage((current) => Math.min(activeTotalPages, current + 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Static Sections: projects showcase, why-catalance, FAQ, CTA ── */}
      <div className="relative z-20 mx-auto mt-4 flex w-full max-w-[1280px] flex-col gap-14 px-4 pb-24 sm:gap-16 sm:px-6 lg:px-8">

        {canViewProjectsMarketplace ? (
        <section id="open-projects" className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <Badge className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                Live Projects
              </Badge>
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-foreground dark:text-white sm:text-4xl">
                Open client briefs in active demand
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground dark:text-slate-400">
                Real project context helps specialists respond with sharper proposals and gives buyers clearer match quality.
              </p>
            </div>
            {openProjectsShowcase.isFallback ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-4 py-2 text-xs font-medium text-muted-foreground dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Marketplace preview
              </span>
            ) : null}
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {openProjectsShowcase.items.map((project) => (
              <article key={project.id} className="h-full">
                <Card className="group h-full rounded-[28px] border border-border bg-card shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_22px_70px_-42px_rgba(2,6,23,0.82)]">
                  <CardContent className="flex h-full min-h-[264px] flex-col p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] font-medium text-foreground dark:border-white/15 dark:bg-white/[0.03] dark:text-slate-200">
                        {project.serviceName}
                      </Badge>
                      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/30 px-2.5 py-1 text-[11px] font-medium text-muted-foreground dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300">
                        <Clock className="h-3 w-3" />
                        {project.timeline}
                      </span>
                    </div>
                    <h3 className="mt-4 line-clamp-2 text-base font-semibold leading-6 text-foreground dark:text-white">
                      {project.title}
                    </h3>
                    <p className="mt-3 line-clamp-3 text-xs leading-6 text-muted-foreground dark:text-slate-400">
                      {project.summary}
                    </p>

                    <div className="mt-auto flex items-end justify-between border-t border-border pt-4 dark:border-white/10">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70 dark:text-slate-500">
                          Budget
                        </p>
                        <p className="mt-1 text-lg font-semibold tracking-tight text-foreground dark:text-white">
                          {project.budgetLabel}
                        </p>
                      </div>
                      <Link
                        to={project.ctaTo}
                        className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:border-primary hover:bg-primary/90"
                      >
                        {project.ctaLabel}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </article>
            ))}
          </div>
        </section>
        ) : null}


        {/* Process Video Section */}
        <div className="w-full">
          <ProcessVideo />
        </div>

        <section id="why-catalance" className="relative space-y-12 py-12">
          {/* Section Header */}
          <div className="space-y-4 text-center">
            <Badge className="rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
              Why Catalance
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight text-foreground dark:text-white sm:text-6xl">
              That’s Why You’ll Love <br />
              <span className="italic font-medium text-primary">
                Working With Us
              </span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg font-medium leading-relaxed text-muted-foreground">
              With top-tier specialists, daily updates, and unlimited revisions, we make the 
              service experience fast, flexible, and frustration-free.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid gap-6 lg:grid-cols-12 lg:grid-rows-2">
            {/* Column 1: Specialists Grid */}
            <div className="lg:col-span-4 lg:row-span-2">
              <Card className="group relative h-full overflow-hidden rounded-[32px] border border-border bg-card shadow-lg transition-all hover:border-primary/30 dark:border-white/10 dark:bg-white/[0.03]">
                <CardContent className="flex h-full flex-col p-8">
                  <div className="mb-8 space-y-3">
                    <h3 className="text-2xl font-bold text-foreground dark:text-white">Specialists Who Get It</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      You'll work with experienced experts who make things simple, smooth, and always focused on results.
                    </p>
                  </div>
                  
                  {/* Avatar Grid: 3x3 Pattern */}
                  <div className="mt-auto grid grid-cols-3 gap-3">
                    {/* Row 1 */}
                    <div className="aspect-square rounded-2xl bg-zinc-200/50 dark:bg-white/[0.03]" />
                    <div className="aspect-square overflow-hidden rounded-2xl border border-border bg-white dark:border-white/10 dark:bg-transparent">
                      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=specialist-1" alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="aspect-square rounded-2xl bg-zinc-200/50 dark:bg-white/[0.03]" />
                    
                    {/* Row 2 */}
                    <div className="aspect-square overflow-hidden rounded-2xl border border-border bg-white dark:border-white/10 dark:bg-transparent">
                      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=specialist-2" alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="aspect-square rounded-2xl bg-zinc-200/50 dark:bg-white/[0.03]" />
                    <div className="aspect-square overflow-hidden rounded-2xl border border-border bg-white dark:border-white/10 dark:bg-transparent">
                      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=specialist-3" alt="" className="h-full w-full object-cover" />
                    </div>

                    {/* Row 3 */}
                    <div className="aspect-square rounded-2xl bg-zinc-200/50 dark:bg-white/[0.03]" />
                    <div className="aspect-square overflow-hidden rounded-2xl border border-border bg-white dark:border-white/10 dark:bg-transparent">
                      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=specialist-4" alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="aspect-square rounded-2xl bg-zinc-200/50 dark:bg-white/[0.03]" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Column 2: Metrics (Stacked) */}
            <div className="space-y-6 lg:col-span-4 lg:row-span-2">
              {/* Delivery Card */}
              <Card className="group relative overflow-hidden rounded-[32px] border border-border bg-card shadow-lg transition-all hover:border-primary/30 dark:border-white/10 dark:bg-white/[0.03]">
                <CardContent className="p-8">
                  <div className="relative mb-8 flex flex-col items-center">
                    <div className="relative z-10 flex gap-2">
                      <div className="h-8 w-8 rounded-full border border-border bg-zinc-100 p-1 dark:border-white/10 dark:bg-white/[0.05]">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=s1" alt="" className="h-full w-full" />
                      </div>
                      <div className="h-8 w-8 rounded-full border border-border bg-zinc-100 p-1 dark:border-white/10 dark:bg-white/[0.05]">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=s2" alt="" className="h-full w-full" />
                      </div>
                      <div className="h-8 w-8 rounded-full border border-border bg-zinc-100 p-1 dark:border-white/10 dark:bg-white/[0.05]">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=s3" alt="" className="h-full w-full" />
                      </div>
                    </div>
                    <div className="absolute top-4 h-12 w-24 border-x border-b border-primary/20 rounded-b-3xl" />
                    <div className="mt-10">
                      <Badge className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary">
                        + Daily Progress
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-foreground dark:text-white">24-Hour Delivery</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      We start fast and deliver your first results in just a day. No delays, no chasing.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Revisions Card */}
              <Card className="group relative overflow-hidden rounded-[32px] border border-border bg-card shadow-lg transition-all hover:border-primary/30 dark:border-white/10 dark:bg-white/[0.03]">
                <CardContent className="p-8">
                  <div className="relative mb-12 flex h-24 items-center justify-center">
                    {/* Complex Decorative Line (SVG) */}
                    <svg className="absolute inset-0 h-full w-full opacity-30" preserveAspectRatio="none" viewBox="0 0 100 100">
                      <path 
                        d="M 5,0 L 5,20 L 25,20 L 25,50 L 75,50 L 75,20 L 95,20 L 95,80" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="0.5"
                        className="text-primary"
                      />
                    </svg>
                    
                    <Badge className="relative z-10 rounded-full border border-primary/30 bg-card px-6 py-2.5 text-[14px] font-bold text-foreground shadow-2xl dark:bg-[#0d0d0d] dark:text-white">
                      Request, Anytime
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-foreground dark:text-white">Unlimited Revisions</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Need changes? Just say it — We'll keep tweaking until you're truly happy.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Column 3: Transparency/Tasks */}
            <div className="lg:col-span-4 lg:row-span-2">
              <Card className="group relative h-full overflow-hidden rounded-[32px] border border-border bg-card shadow-lg transition-all hover:border-primary/30 dark:border-white/10 dark:bg-white/[0.03]">
                <CardContent className="flex h-full flex-col p-8">
                  <div className="mb-8 space-y-3">
                    <h3 className="text-2xl font-bold text-foreground dark:text-white">Full Transparency</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Track every task, every step. See every update. We keep you in the loop at all times.
                    </p>
                  </div>

                  {/* Task Mockup */}
                  <div className="mt-auto space-y-4 rounded-3xl border border-border bg-muted/40 p-6 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <span className="text-[14px] font-bold text-foreground dark:text-white">Tasks</span>
                         <span className="text-[14px] font-bold text-muted-foreground">/</span>
                         <span className="text-[14px] font-bold text-muted-foreground">Catalance</span>
                      </div>
                      <Settings className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="space-y-4 pt-2">
                      {[
                        { label: "Project Kickoff", status: "Completed", color: "bg-emerald-500", icon: BriefcaseBusiness },
                        { label: "Wireframes", status: "Completed", color: "bg-emerald-500", icon: LayoutGrid },
                        { label: "UI Design", status: "In Progress", color: "bg-amber-500", icon: Sparkles },
                        { label: "Framer Development", status: "Pending", color: "bg-rose-500", icon: Code2 },
                      ].map((task, i) => (
                        <div key={i} className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <task.icon className="h-4.5 w-4.5 text-foreground dark:text-white" />
                            <span className="text-[14px] font-bold text-foreground/90 dark:text-white/90">{task.label}</span>
                          </div>
                          <Badge variant="outline" className="flex items-center gap-2 rounded-full border-border bg-card/50 px-2.5 py-0.5 text-[10px] font-bold dark:border-white/10">
                             <span className="relative flex h-2 w-2">
                               <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", task.color)} />
                               <span className={cn("relative inline-flex h-2 w-2 rounded-full", task.color)} />
                             </span>
                             {task.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 pt-2 text-[13px] font-bold text-muted-foreground/60 transition-colors hover:text-primary">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted/50 dark:bg-white/[0.05]">
                        <Plus className="h-3.5 w-3.5" />
                      </div>
                      Add New Task
                    </div>
                    
                    <div className="flex justify-center pt-2">
                      <span className="text-[12px] font-bold tracking-tight text-muted-foreground opacity-70">catalance®</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Large CTA Button */}
          <div className="flex justify-center pt-8">
            <Button
              size="lg"
              className="group relative h-16 overflow-hidden rounded-full bg-primary px-10 text-lg font-bold text-primary-foreground shadow-xl transition-all hover:scale-105 hover:shadow-primary/20"
              onClick={() => navigate("/contact")}
            >
              <span className="relative z-10 mr-4">Book a 15-min call</span>
              <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-primary transition-all duration-300 group-hover:-rotate-45 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <ArrowRight className="h-4 w-4" />
              </div>
            </Button>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-10 lg:items-start">
          <div className="space-y-6 lg:sticky lg:top-24">
            <Badge className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/40 px-4 py-2 text-xs font-medium text-muted-foreground dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              FAQ
            </Badge>
            <div className="space-y-4">
              <h2 className="text-4xl font-semibold tracking-[-0.03em] text-foreground dark:text-white sm:text-5xl">
                Frequently
                <br />
                <span className="text-muted-foreground dark:text-slate-400">Asked Questions</span>
              </h2>
              <p className="max-w-md text-base leading-8 text-muted-foreground dark:text-slate-400">
                The marketplace is meant to reduce uncertainty early. These are the signals most teams look for before moving deeper into a service.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {faqs.map(([question, answer]) => {
              const isOpen = Boolean(openFaqItems[question]);
              return (
                <div
                  key={question}
                  className={cn(
                    "rounded-[24px] border transition-all duration-300",
                    isOpen
                      ? "border-primary/30 bg-card shadow-lg dark:border-white/15 dark:bg-black/45"
                      : "border-border bg-card/40 hover:border-primary/20 hover:bg-card/60 dark:border-white/10 dark:bg-black/20"
                  )}
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-7 py-6 text-left"
                    onClick={() => toggleFaqItem(question)}
                    aria-expanded={isOpen}
                  >
                    <span className="text-xl font-medium leading-tight text-foreground dark:text-white">{question}</span>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center text-foreground dark:text-white/90">
                      {isOpen ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key={`${question}-content`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-7 pb-7">
                          <p className="max-w-3xl text-[18px] leading-8 text-muted-foreground dark:text-slate-400">{answer}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[48px] border border-border bg-card shadow-2xl backdrop-blur-3xl dark:border-white/10 dark:bg-white/[0.04]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute right-[-10%] bottom-[-40%] h-96 w-96 rounded-full bg-primary/20 blur-[120px]" />
            <div className="absolute left-[22%] top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-primary/10 blur-[100px]" />
          </div>
          
          <div className="relative grid gap-12 px-8 py-16 lg:grid-cols-2 lg:items-center lg:px-16">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  Get Started
                </Badge>
                <h2 className="text-4xl font-bold tracking-[-0.04em] text-foreground dark:text-white sm:text-5xl lg:leading-[1.1]">
                  Need a marketplace that feels fast for buyers and credible for specialists?
                </h2>
                <p className="text-lg leading-relaxed text-muted-foreground dark:text-white/70">
                  Start by browsing service lanes or join as a freelancer and publish your offer into a more structured buying flow.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="h-16 rounded-full bg-primary px-10 text-lg font-bold text-primary-foreground shadow-xl transition-all hover:scale-105 hover:bg-primary/90"
                  onClick={() => scrollToSection("marketplace-results")}
                >
                  Explore services
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-16 rounded-full border-primary/25 bg-primary/10 px-10 text-lg font-bold text-primary transition-all hover:scale-105 hover:bg-primary/20"
                >
                  <Link to="/signup?role=freelancer">Join as freelancer</Link>
                </Button>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <AnimatedCard className="w-full max-w-[420px] scale-100 lg:scale-110">
                <CardVisual>
                  <Visual3 mainColor={isDarkMode ? "#F9D949" : "#D9692A"} secondaryColor={isDarkMode ? "#ffffff" : "#F9D949"} />
                </CardVisual>
                <CardBody>
                  <CardTitle>Catalance Efficiency</CardTitle>
                  <CardDescription>
                    Real-time project tracking and performance metrics.
                  </CardDescription>
                </CardBody>
              </AnimatedCard>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Marketplace;
