import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, BadgeCheck, Bot, BriefcaseBusiness, Banknote, Tag, Check,
  ChevronLeft, ChevronRight, Clock, Cloud, Code2,
  Database, Heart, LineChart, MessageSquare,
  Rocket, Search, ShieldCheck, SlidersHorizontal,
  Sparkles, Star, Users, Workflow, X
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Sparkles as SparklesBackground } from "@/components/ui/sparkles";
import MarketplaceServicesSection from "@/components/pages/marketplace-browse/MarketplaceServicesSection";
import SubcategorySection from "@/components/pages/marketplace-browse/SubcategorySection";
import { getSession } from "@/shared/lib/auth-storage";
import { API_BASE_URL } from "@/shared/lib/api-client";
import { cn } from "@/shared/lib/utils";

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

const spotlights = [
  ["AI & Machine Learning", "ai automation", Bot],
  ["Cloud Infrastructure", "cloud infrastructure", Cloud],
  ["Cybersecurity", "cybersecurity", ShieldCheck],
  ["Data Engineering", "data engineering", Database]
].map(([title, search, icon]) => ({ title, search, icon }));

const valueProps = [
  ["Specialists, not generalists", "Service-led cards make it easier to compare real outcomes."],
  ["Faster shortlisting", "Search, filters, pricing, and delivery cues sit in one flow."],
  ["Marketplace clarity", "The layout keeps proof, trust, and action paths obvious."]
];

const faqs = [
  ["How are freelancers vetted?", "Listings combine verified freelancer data with service-specific marketplace details."],
  ["Can I compare multiple services first?", "Yes. The page is structured around quick filtering and dense service comparison before you open a detail page."],
  ["What if I need a custom scope?", "Use the marketplace to identify the best specialist, then continue through the service detail flow to shape the engagement."]
];

const glassPanelClass = "border border-white/10 bg-white/[0.04] shadow-[0_24px_80px_-42px_rgba(2,6,23,0.82)] backdrop-blur-xl";
const glassCardClass = "border border-white/10 bg-white/[0.05] shadow-[0_24px_70px_-42px_rgba(2,6,23,0.78)]";
const controlSurfaceClass = "border-white/10 bg-black/20 text-white placeholder:text-slate-500";
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
    "from-amber-300/35 via-orange-300/20 to-slate-900/85",
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

const Marketplace = () => {
  const [favorites, setFavorites] = useState({});
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [browseData, setBrowseData] = useState({ services: [], selectedService: null });
  const [browseLoading, setBrowseLoading] = useState(true);
  const [serviceCatalog, setServiceCatalog] = useState([]);
  const [serviceCatalogLoading, setServiceCatalogLoading] = useState(true);
  const [selectedBuildModes, setSelectedBuildModes] = useState([]);
  const [selectedTechFilters, setSelectedTechFilters] = useState([]);
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [sort, setSort] = useState("newest");
  const [duration, setDuration] = useState("");
  const [rating, setRating] = useState("");

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

  const [page, setPage] = useState(1);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const serviceCategories = (
    serviceCatalog.length
      ? dedupeServiceCategories(serviceCatalog.map((service) => buildServiceCategoryEntry(service)))
      : FALLBACK_CATEGORIES
  ).map((entry) => {
    if (entry.icon) return entry;
    const value = resolveMarketplaceServiceKey(entry);
    return buildServiceCategoryEntry({ ...entry, value });
  });

  const activeService = serviceCategories.find((service) => service.value === category) || null;
  const activeBrowseService = browseData.selectedService;

  const debouncedQ = useDebounce(q, 400);
  const debouncedMin = useDebounce(minBudget, 400);
  const debouncedMax = useDebounce(maxBudget, 400);

  useEffect(() => {
    try {
      const session = getSession();
      const key = session?.user?.id ? `marketplace_favorites:${session.user.id}` : "marketplace_favorites:guest";
      const saved = localStorage.getItem(key);
      if (saved) setFavorites(JSON.parse(saved));
    } catch {
      // Ignore storage access failures in private browsing or restricted contexts.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchServiceCatalog = async () => {
      setServiceCatalogLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/ai/services`);
        if (!res.ok) throw new Error("Failed to fetch services");
        const json = await res.json();
        if (cancelled) return;
        const services = Array.isArray(json?.services) ? json.services : [];
        setServiceCatalog(services);
      } catch (error) {
        console.error("[Marketplace] Failed to load service catalog:", error);
        if (!cancelled) setServiceCatalog([]);
      } finally {
        if (!cancelled) setServiceCatalogLoading(false);
      }
    };

    void fetchServiceCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSelectedBuildModes([]);
    setSelectedTechFilters([]);
  }, [category]);

  useEffect(() => {
    let cancelled = false;

    const fetchBrowseData = async () => {
      setBrowseLoading(true);
      try {
        const query = new URLSearchParams();
        if (category !== "all") {
          query.append("service", category);
        }
        const res = await fetch(
          `${API_BASE_URL}/marketplace/browse${query.toString() ? `?${query.toString()}` : ""}`
        );
        if (!res.ok) throw new Error("Failed to fetch marketplace browse data");
        const json = await res.json();
        if (cancelled) return;
        const nextData = json?.data || {};
        setBrowseData({
          services: Array.isArray(nextData.services) ? nextData.services : [],
          selectedService:
            nextData.selectedService && typeof nextData.selectedService === "object"
              ? nextData.selectedService
              : null,
        });
      } catch (error) {
        console.error("[Marketplace] Failed to load browse data:", error);
        if (!cancelled) {
          setBrowseData({ services: [], selectedService: null });
        }
      } finally {
        if (!cancelled) {
          setBrowseLoading(false);
        }
      }
    };

    void fetchBrowseData();

    return () => {
      cancelled = true;
    };
  }, [category]);

  const toggleFavorite = (event, id) => {
    event.preventDefault();
    event.stopPropagation();
    setFavorites((current) => {
      const next = { ...current, [id]: !current[id] };
      try {
        const session = getSession();
        const key = session?.user?.id ? `marketplace_favorites:${session.user.id}` : "marketplace_favorites:guest";
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Ignore storage access failures in private browsing or restricted contexts.
      }
      return next;
    });
  };

  const fetchResults = useCallback(async () => {
    if (category === "all") {
      setData([]);
      setTotal(0);
      setTotalPages(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const query = new URLSearchParams({ q: debouncedQ, sort, page: String(page), limit: String(MARKETPLACE_PAGE_SIZE) });
      if (category !== "all") query.append("category", category);
      if (selectedBuildModes.length) query.append("buildMode", selectedBuildModes.join(","));
      if (selectedTechFilters.length) query.append("tech", selectedTechFilters.join(","));
      if (debouncedMin) query.append("minBudget", debouncedMin);
      if (debouncedMax) query.append("maxBudget", debouncedMax);
      if (duration) query.append("duration", duration);
      if (rating) query.append("rating", rating);
      const res = await fetch(`${API_BASE_URL}/marketplace?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch marketplace");
      const json = await res.json();
      setData(json?.data || []);
      setTotal(json?.total || 0);
      setTotalPages(json?.totalPages || 0);
    } catch (error) {
      console.error(error);
      setData([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [category, debouncedMax, debouncedMin, debouncedQ, duration, page, rating, selectedBuildModes, selectedTechFilters, sort]);

  useEffect(() => setPage(1), [debouncedQ, category, debouncedMin, debouncedMax, duration, rating, selectedBuildModes, selectedTechFilters, sort]);
  useEffect(() => void fetchResults(), [fetchResults]);

  const resetFilters = () => {
    setQ("");
    setCategory("all");
    setSelectedBuildModes([]);
    setSelectedTechFilters([]);
    setMinBudget("");
    setMaxBudget("");
    setDuration("");
    setRating("");
    setSort("newest");
  };

  const handleCategorySelect = (nextCategory) => {
    setCategory(nextCategory);
  };

  const toggleTechnologyFilter = (nextValue) => {
    setSelectedTechFilters((current) => toggleSelection(current, nextValue));
  };

  const visibleBrowseServices = browseData.services.filter((service) => {
    if (!debouncedQ || category !== "all") return true;
    const blob = [service.label, service.description, ...(service.subcategoryPreview || []), ...(service.technologyPreview || [])]
      .join(" ")
      .toLowerCase();
    return blob.includes(debouncedQ.toLowerCase());
  });

  const marketplaceBrowseActions = category !== "all" ? (
    <Dialog open={isFilterOpen} onOpenChange={(open) => { setIsFilterOpen(open); if (open) syncDraftFilters(); }}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="h-11 shrink-0 rounded-full bg-white/[0.04] px-5 text-[13px] font-semibold text-slate-200 hover:bg-white/10 hover:text-white">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="w-[90vw] max-w-[760px] rounded-sm border-white/10 bg-[#1e1e1e] p-0 shadow-[0_24px_80px_-42px_rgba(2,6,23,1)] sm:w-[760px] [&>button]:hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-8 py-6">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold tracking-tight text-white">Filters</h3>
            <p className="text-sm text-muted-foreground">Refine your search</p>
          </div>
          <button type="button" onClick={() => setIsFilterOpen(false)} className="rounded-full p-2 text-muted-foreground hover:bg-white/10 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

          <div className="grid max-h-[70vh] grid-cols-1 gap-x-16 gap-y-10 overflow-x-hidden overflow-y-auto px-8 py-8 no-scrollbar sm:grid-cols-2">
          <div className="space-y-6">
            <h4 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.15em] text-[#fbcc15]">
              <Banknote className="h-5 w-5" /> PRICE RANGE
            </h4>
            <div className="px-2">
              <Slider
                min={0}
                max={1000000}
                step={10000}
                value={[Number(draftMinBudget), Number(draftMaxBudget)]}
                onValueChange={([min, max]) => { setDraftMinBudget(String(min)); setDraftMaxBudget(String(max)); }}
                className="[&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:border-[#fbcc15] [&_[role=slider]]:bg-[#fbcc15] [&_[role=track]]:h-2 [&_[role=track]]:bg-slate-800 [&>.relative>.absolute]:bg-[#fbcc15]"
              />
            </div>
            <div className="flex items-center justify-between px-1 text-sm font-semibold text-white">
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
                  <button key={label} type="button" onClick={() => setDraftDuration(active ? "" : label)} className="flex items-center gap-3 text-[15px] font-medium text-muted-foreground hover:text-white">
                    <div className={cn("flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 transition-all", active ? "border-[#fbcc15] bg-[#fbcc15]" : "border-slate-500 bg-transparent")}>
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
                  <button key={label} type="button" onClick={() => setDraftRating(active ? "" : label)} className="flex items-center gap-3 text-[15px] font-medium text-muted-foreground hover:text-white">
                    <div className={cn("flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 transition-all", active ? "border-[#fbcc15] bg-transparent" : "border-slate-500 bg-transparent")}>
                      {active && <div className="h-2.5 w-2.5 rounded-full bg-[#fbcc15]" />}
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
                        ? "border-[#fbcc15] text-[#fbcc15]"
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
                            ? "border-[#fbcc15]/45 bg-[#fbcc15]/12 text-[#fbcc15]"
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

        <div className="flex items-center justify-between rounded-none border-t border-white/5 bg-[#1a1a1a] px-8 py-6 shadow-2xl">
          <button onClick={clearDraftFilters} className="text-[13px] font-bold uppercase tracking-[0.15em] text-muted-foreground hover:text-white">
            RESET
          </button>
          <Button onClick={applyFilters} className="h-12 min-w-[160px] rounded-full border border-[#fbcc15]/40 bg-[#fbcc15] px-8 text-[14px] font-bold text-black drop-shadow-[0_0_15px_rgba(251,204,21,0.25)] hover:bg-[#fbcc15]/90 hover:opacity-90 active:scale-95">
            APPLY FILTERS
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  ) : null;

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Full Screen Hero Section */}
      <section className="relative flex min-h-[100vh] w-full flex-col items-center justify-center overflow-hidden bg-background">
        {/* Sparkles Background */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
          <SparklesBackground
            className="h-full w-full"
            density={600}
            speed={0.8}
            minSpeed={0.2}
            size={1.2}
            minSize={0.4}
            opacity={0.8}
            minOpacity={0.1}
            color="#ffffff"
          />
        </div>

        {/* Glow Behind Planet */}
        <div className="pointer-events-none absolute bottom-[15%] left-1/2 h-[600px] w-[100%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_bottom,rgba(250,204,21,0.45)_0%,rgba(250,204,21,0.15)_45%,transparent_70%)] blur-[60px]" />
        <div className="pointer-events-none absolute bottom-[10%] left-1/2 h-[400px] w-[70%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_bottom,rgba(255,255,255,0.8)_0%,rgba(250,204,21,0.4)_50%,transparent_70%)] blur-[30px]" />

        {/* Content */}
        <div className="relative z-10 mb-[12vh] flex flex-col items-center gap-7 px-4 text-center">
          <h1 className="max-w-[800px] text-[44px] font-medium tracking-tight text-white sm:text-[56px] md:text-[64px] lg:text-[76px] lg:leading-[1.05]">
            Hire experts for<br />high-impact work.
          </h1>
          <p className="mx-auto max-w-xl text-[17px] leading-relaxed text-[#c9c9c9]">
            Explore verified services, compare talent<br className="hidden sm:block" />fast, curated shortlist clarity.
          </p>
          <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row">
            <Button size="lg" className="h-12 rounded-full border border-[#fbcc15] bg-[#fbcc15] px-8 text-[15px] font-semibold text-black transition-all hover:bg-[#fbcc15]/90 hover:opacity-90" onClick={() => scrollToSection("marketplace-results")}>
              Explore Services
            </Button>
            <Button asChild variant="secondary" size="lg" className="h-12 rounded-full bg-white px-8 text-[15px] font-semibold text-black transition-all hover:bg-white/90">
              <Link to="/contact">Talk to a strategist</Link>
            </Button>
          </div>
        </div>

        {/* Planet Horizon */}
        <div className="pointer-events-none absolute bottom-0 left-1/2 w-[150%] -translate-x-1/2 translate-y-[65%] lg:w-[130%]">
          <div className="relative aspect-[3/1] w-full">

            {/* 0. Base Black Planet (Anchors true horizon geometry) */}
            <div className="absolute w-full h-full rounded-[100%] bg-background" />

            {/* 1. The Pure Solid White SVG Crescent */}
            {/* An SVG crescent completely solves all blur, masking, and alignment constraints. It ensures a 100% solid, fully opaque #ffffff highlight that mathematically tracks the planet equator perfectly. 
                The explicit path points start at x=20 and x=80 (extended slightly wider), forcing the solid filled geometry to physically pinch down to an absolute 0px razor point near the screen edges. */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{ filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.8))' }}
            >
              <path d="M 20 10 A 50 50 0 0 1 80 10 A 50 45 0 0 0 20 10 Z" fill="#ffffff" />
            </svg>

            {/* 3. Center Volumetric Flare */}
            <div className="absolute left-1/2 top-[-50px] h-[80px] w-[30%] max-w-[600px] -translate-x-1/2 rounded-[100%] bg-white opacity-20 blur-[40px] mix-blend-screen" />
          </div>
        </div>
      </section>

      <section
        id="marketplace-results"
        className="relative z-30 mx-auto -mt-28 w-full max-w-[1280px] px-4 sm:-mt-32 sm:px-6 lg:-mt-32 lg:px-8"
      >
        <MarketplaceServicesSection
          services={visibleBrowseServices}
          loading={browseLoading || serviceCatalogLoading}
          searchValue={q}
          searchPlaceholder={category === "all" ? "Search services" : "Search freelancers"}
          onSearchChange={setQ}
          onSelectService={handleCategorySelect}
          activeServiceKey={category}
          actions={marketplaceBrowseActions}
        />
      </section>

      {/* Main Content Container Restored for content below hero */}
      <div className="relative z-20 mx-auto mt-5 flex w-full max-w-[1280px] flex-col gap-10 px-4 pb-20 sm:mt-6 sm:px-6 lg:px-8">
        <section className="space-y-5">
          {category !== "all" ? (
            <>
              <SubcategorySection
                service={activeBrowseService || activeService}
                selectedTechnologies={selectedTechFilters}
                onToggleTechnology={toggleTechnologyFilter}
              />
            </>
          ) : null}

          {category !== "all" ? (
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#fbcc15]">
                    Specialists
                  </p>
                  <h3 className="text-2xl font-semibold tracking-[-0.04em] text-white">
                    Freelancer listings
                  </h3>
                </div>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: MARKETPLACE_PAGE_SIZE }).map((_, index) => (
                    <Card key={`skeleton-${index}`} className={cn(glassCardClass, "overflow-hidden rounded-[28px]")}>
                      <Skeleton className="h-44 w-full rounded-none" />
                      <CardContent className="space-y-4 p-5">
                        <div className="flex items-center gap-3"><Skeleton className="h-11 w-11 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-20" /></div></div>
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-4 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            ) : data.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="rounded-[34px] border border-dashed border-white/10 bg-white/[0.04] px-6 py-20 text-center shadow-[0_24px_80px_-42px_rgba(2,6,23,0.82)]">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.06] text-slate-400"><Search className="h-7 w-7" /></div>
                <h2 className="mt-6 text-2xl font-semibold tracking-tight text-white">No services match this mix yet</h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-400">Try broadening the category, adjusting budget boundaries, or using a keyword like AI, cloud, or security.</p>
                <Button variant="outline" className="mt-7 rounded-full border-white/10 bg-white/[0.04] px-6 py-5 text-sm font-semibold text-white hover:bg-white/[0.08]" onClick={resetFilters}>Clear all filters</Button>
              </motion.div>
            ) : (
              <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#fbcc15]">
                    Specialists
                  </p>
                  <h3 className="text-2xl font-semibold tracking-[-0.04em] text-white">
                    Freelancer listings
                  </h3>
                  <p className="text-sm text-slate-400">
                    {total} result{total === 1 ? "" : "s"} in {activeBrowseService?.label || activeService?.label || "this service"}.
                  </p>
                </div>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {data.map((item) => {
                  const image = item.serviceDetails?.coverImage || item.serviceDetails?.image || null;
                  const rating = Number(item.rating || 0);
                  const hasRating = rating > 0;
                  const delivery = item.serviceDetails?.deliveryTime ? deliveryLabels[item.serviceDetails.deliveryTime] || String(item.serviceDetails.deliveryTime).replace(/_/g, " ") : null;
                  const price = formatPrice(item.serviceDetails?.startingPrice || item.serviceDetails?.minBudget || item.serviceDetails?.price, item.serviceDetails?.averageProjectPriceRange || item.serviceDetails?.priceRange);
                  return (
                    <motion.article key={item.id} className="h-full">
                      <Link to={`/marketplace/service/${item.id}`} className="block h-full">
                        <Card className="group h-full overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] shadow-[0_22px_70px_-42px_rgba(2,6,23,0.82)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-[0_28px_90px_-40px_color-mix(in_srgb,var(--primary)_22%,transparent)]">
                          <div className="relative h-44 overflow-hidden border-b border-white/10 bg-slate-950">
                            {image ? <img src={image} alt={item.service || "Marketplace service"} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /> : <div className={cn("absolute inset-0 bg-gradient-to-br", getGradient(item.serviceKey || item.id))} />}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                            <div className="absolute inset-x-0 top-0 flex items-start justify-end p-4">
                              <button type="button" onClick={(event) => toggleFavorite(event, item.id)} aria-label={favorites[item.id] ? "Remove from favorites" : "Add to favorites"} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-slate-950/72 text-white shadow-sm backdrop-blur-md transition hover:bg-slate-900/90">
                                <Heart className={cn("h-4 w-4", favorites[item.id] ? "fill-rose-500 text-rose-500" : "text-slate-200")} />
                              </button>
                            </div>
                            {item.isFeatured && <div className="absolute left-4 top-14"><Badge className="rounded-full border-none bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-white shadow-sm"><Sparkles className="h-3 w-3" />Featured</Badge></div>}
                          </div>
                          <CardContent className="flex min-h-[252px] flex-col p-5">
                            <div className="flex min-h-12 items-center gap-3">
                              {item.freelancer?.avatar ? <img src={item.freelancer.avatar} alt={item.freelancer.fullName || "Freelancer"} className="h-11 w-11 rounded-full border border-white/10 object-cover shadow-sm" /> : <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-xs font-semibold text-slate-200 shadow-sm">{getInitials(item.freelancer?.fullName)}</div>}
                              <div className="min-w-0 flex-1">
                                <div className="flex min-h-12 items-center justify-between gap-3">
                                  <div className="flex min-w-0 items-center gap-1.5">
                                    <p className="truncate text-sm font-semibold text-white">{item.freelancer?.fullName || "Anonymous"}</p>
                                    {item.freelancer?.isVerified && <BadgeCheck className="h-4 w-4 shrink-0 fill-primary text-black" />}
                                  </div>
                                  {hasRating ? (
                                    <div className="inline-flex shrink-0 items-center gap-1.5 text-xs text-slate-400">
                                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                      <span className="font-semibold text-white">{rating.toFixed(1)}</span>
                                      <span>({item.reviewCount || 0})</span>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                            <div className="mt-0.5 flex min-h-16 flex-col">
                              <h3 className="min-h-4 line-clamp-2 text-xs font-semibold leading-4 text-primary transition-colors group-hover:text-primary/85">{item.service || "Untitled service"}</h3>
                              <div className="mt-0 min-h-[3.5rem]">
                                {item.bio ? <p className="line-clamp-2 text-xs leading-5 text-slate-400">{item.bio}</p> : null}
                              </div>
                            </div>
                            <div className="mt-auto flex items-end justify-between border-t border-white/10 pt-4">
                              <div className="space-y-1">
                                {delivery && <div className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-slate-300"><Clock className="h-3.5 w-3.5" />{delivery}</div>}
                                <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Starts from</p><p className="mt-1 text-lg font-semibold tracking-tight text-white">{price}</p></div>
                              </div>
                              <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition group-hover:border-primary group-hover:bg-primary/90">View <ArrowRight className="h-3.5 w-3.5" /></span>
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
          ) : null}

          {category !== "all" && !loading && totalPages > 1 && (
            <div className="flex flex-col gap-4 rounded-[30px] border border-white/10 bg-white/[0.04] px-5 py-4 shadow-[0_24px_70px_-42px_rgba(2,6,23,0.82)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-400">
                Page <span className="font-semibold text-white">{page}</span> of{" "}
                <span className="font-semibold text-white">{totalPages}</span>
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-full border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, index) => index + 1)
                  .filter((pageNumber) => {
                    if (totalPages <= 7) return true;
                    if (pageNumber === 1 || pageNumber === totalPages) return true;
                    return Math.abs(pageNumber - page) <= 1;
                  })
                  .map((pageNumber, index, visiblePages) => {
                    const previous = visiblePages[index - 1];
                    const showGap = previous && pageNumber - previous > 1;
                    return (
                      <div key={`page-group-${pageNumber}`} className="flex items-center gap-2">
                        {showGap && <span className="px-1 text-sm text-slate-500">...</span>}
                        <Button
                          type="button"
                          variant={pageNumber === page ? "default" : "outline"}
                          className={cn(
                            "h-11 min-w-11 rounded-full px-4 text-sm font-semibold",
                            pageNumber === page
                              ? "bg-primary text-primary-foreground hover:bg-primary/90"
                              : "border-white/10 bg-white/[0.04] text-slate-200 hover:border-white/20 hover:bg-white/[0.08]"
                          )}
                          onClick={() => setPage(pageNumber)}
                        >
                          {pageNumber}
                        </Button>
                      </div>
                    );
                  })}
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-full border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {[
            ["1", "Brief the outcome", "Choose a service lane, filter by price and delivery, and scan the strongest matches fast."],
            ["2", "Compare proof", "Review positioning, ratings, pricing cues, and profile signals without leaving the shortlist."],
            ["3", "Move with confidence", "Open a service detail, align on scope, and take the conversation into delivery."],
          ].map(([step, title, copy]) => (
            <Card key={step} className={cn(glassCardClass, "rounded-[30px]")}>
              <CardContent className="space-y-5 p-7">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground">
                  {step}
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold tracking-tight text-white">How it works</h2>
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                  <p className="text-sm leading-7 text-slate-400">{copy}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="overflow-hidden rounded-[36px] border border-primary/20 bg-gradient-to-br from-black via-black to-primary/18 shadow-[0_34px_100px_-44px_rgba(2,6,23,0.8)]">
          <div className="grid gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] lg:px-10 lg:py-10">
            <div className="space-y-5">
              <Badge className="rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Trust and testimonials
              </Badge>
              <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                Built for teams that want premium outcomes without a slow procurement loop.
              </h2>
              <p className="max-w-2xl text-base leading-8 text-white/70">
                The Marketplace experience pairs structured comparison with editorial clarity, so buyers can move from discovery to a confident shortlist in one session.
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  ["4.9/5", "Average service rating"],
                  ["48 hrs", "Typical shortlist speed"],
                  ["Curated", "Capability-first categories"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-[26px] border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-md">
                    <p className="text-2xl font-semibold tracking-tight text-white">{value}</p>
                    <p className="mt-1 text-sm text-white/65">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4 self-center">
              {[
                ["Product lead, SaaS", "We used the marketplace filters to narrow down automation talent in under ten minutes. The shortlist felt curated, not crowded."],
                ["Operations manager, agency", "Pricing and delivery cues were clear enough to compare real fit before we opened a single profile in detail."],
              ].map(([author, quote]) => (
                <div key={author} className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md">
                  <div className="flex items-center gap-2 text-primary">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={`${author}-${index}`} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-7 text-white/78">{quote}</p>
                  <p className="mt-5 text-sm font-semibold text-white">{author}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <Badge className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                Popular categories
              </Badge>
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white">Explore high-demand capability lanes.</h2>
            </div>
            <Button
              variant="outline"
              className="rounded-full border-white/10 bg-white/[0.04] px-6 text-sm font-semibold text-white hover:bg-white/[0.08]"
              onClick={() => scrollToSection("marketplace-results")}
            >
              Browse all services
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {spotlights.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => {
                    setQ(item.search);
                    scrollToSection("marketplace-results");
                  }}
                  className="group overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.05] text-left shadow-[0_24px_70px_-42px_rgba(2,6,23,0.82)] transition hover:-translate-y-1.5 hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <div className={cn("h-32 bg-gradient-to-br px-6 py-6 text-white", [
                    "from-sky-500 to-cyan-400",
                    "from-emerald-500 to-teal-400",
                    "from-rose-500 to-orange-400",
                    "from-indigo-500 to-blue-400",
                  ][index % 4])}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="space-y-3 p-6">
                    <h3 className="text-xl font-semibold tracking-tight text-white transition-colors group-hover:text-sky-300">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-7 text-slate-400">
                      Launch directly into specialists who work in this lane and compare offers without losing context.
                    </p>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                      Search this lane <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {valueProps.map(([title, copy], index) => {
            const icons = [ShieldCheck, Rocket, Sparkles];
            const Icon = icons[index % icons.length];
            return (
              <Card key={title} className={cn(glassCardClass, "rounded-[30px]")}>
                <CardContent className="space-y-5 p-7">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold tracking-tight text-white">{title}</h2>
                    <p className="text-sm leading-7 text-slate-400">{copy}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          <div className="space-y-4">
            <Badge className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
              FAQ
            </Badge>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white">Questions buyers usually ask before they shortlist.</h2>
            <p className="max-w-xl text-base leading-8 text-slate-400">
              The marketplace is meant to reduce uncertainty early. These are the signals most teams look for before moving deeper into a service.
            </p>
          </div>
          <div className="rounded-[32px] border border-white/10 bg-white/[0.05] px-6 py-4 shadow-[0_24px_70px_-42px_rgba(2,6,23,0.82)]">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map(([question, answer]) => (
                <AccordionItem key={question} value={question} className="border-white/10">
                  <AccordionTrigger className="text-left text-base font-semibold text-white hover:no-underline">
                    {question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-7 text-slate-400">
                    {answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.04] shadow-[0_34px_100px_-44px_rgba(15,23,42,0.72)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute right-[-10%] bottom-[-40%] h-80 w-80 rounded-full bg-primary/18 blur-3xl" />
            <div className="absolute left-[22%] top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
          </div>
          <div className="relative flex flex-col gap-8 px-6 py-10 lg:flex-row lg:items-center lg:justify-between lg:px-10">
            <div className="max-w-2xl space-y-4">
              <Badge className="rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Final CTA
              </Badge>
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                Need a marketplace that feels fast for buyers and credible for specialists?
              </h2>
              <p className="text-base leading-8 text-white/72">
                Start by browsing service lanes or join as a freelancer and publish your offer into a more structured buying flow.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-14 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground hover:bg-primary/90"
                onClick={() => scrollToSection("marketplace-results")}
              >
                Explore services
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-14 rounded-full border-primary/25 bg-primary/10 px-7 text-base font-semibold text-primary hover:bg-primary/15"
              >
                <Link to="/signup?role=freelancer">Join as freelancer</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Marketplace;
