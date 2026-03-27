import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cloud,
  Code2,
  Database,
  Heart,
  LineChart,
  MessageSquare,
  Rocket,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Users,
  Workflow,
  X
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getSession } from "@/shared/lib/auth-storage";
import { API_BASE_URL } from "@/shared/lib/api-client";
import { cn } from "@/shared/lib/utils";

const categories = [
  ["Web Development", "web_development", Code2, "Products and storefronts"],
  ["AI Automation", "ai_automation", Bot, "Agents and workflows"],
  ["SEO", "seo", LineChart, "Organic growth"],
  ["Lead Generation", "lead_generation", Rocket, "Outbound and funnels"],
  ["CRM & ERP", "crm_erp", Workflow, "Ops systems"],
  ["Voice Agent", "voice_agent", MessageSquare, "AI calling"],
  ["App Development", "app_development", BriefcaseBusiness, "Mobile products"],
  ["Customer Support", "customer_support", Users, "CX operations"]
].map(([label, value, icon, description]) => ({ label, value, icon, description }));

const shortcuts = categories.slice(0, 6);

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

const Marketplace = () => {
  const [favorites, setFavorites] = useState({});
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categoryRailState, setCategoryRailState] = useState({ left: false, right: false });
  const categoryRailRef = useRef(null);

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
    setLoading(true);
    try {
      const query = new URLSearchParams({ q: debouncedQ, sort, page: String(page), limit: String(MARKETPLACE_PAGE_SIZE) });
      if (category !== "all") query.append("category", category);
      if (debouncedMin) query.append("minBudget", debouncedMin);
      if (debouncedMax) query.append("maxBudget", debouncedMax);
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
  }, [category, debouncedMax, debouncedMin, debouncedQ, page, sort]);

  useEffect(() => setPage(1), [debouncedQ, category, debouncedMin, debouncedMax, sort]);
  useEffect(() => void fetchResults(), [fetchResults]);

  const updateCategoryRailState = useCallback(() => {
    const rail = categoryRailRef.current;
    if (!rail) return;
    const maxScrollLeft = Math.max(rail.scrollWidth - rail.clientWidth, 0);
    setCategoryRailState({
      left: rail.scrollLeft > 4,
      right: maxScrollLeft - rail.scrollLeft > 4
    });
  }, []);

  useEffect(() => {
    updateCategoryRailState();
    window.addEventListener("resize", updateCategoryRailState);
    return () => window.removeEventListener("resize", updateCategoryRailState);
  }, [updateCategoryRailState]);

  const scrollCategoryRail = (direction) => {
    const rail = categoryRailRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * 240, behavior: "smooth" });
  };

  const handleCategoryRailWheel = (event) => {
    const rail = categoryRailRef.current;
    if (!rail) return;
    if (rail.scrollWidth <= rail.clientWidth) return;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.preventDefault();
    rail.scrollBy({ left: event.deltaY, behavior: "auto" });
  };

  const heroFreelancerIds = new Set();
  data.forEach((item) => {
    const freelancerKey = item.freelancer?.id || item.freelancerId;
    if (freelancerKey) heroFreelancerIds.add(freelancerKey);
  });
  const heroExpertCount = heroFreelancerIds.size;

  const heroPeople = [];
  const heroPreviewIds = new Set();
  data.forEach((item) => {
    const freelancerKey = item.freelancer?.id || item.freelancerId;
    if (!freelancerKey || heroPreviewIds.has(freelancerKey) || heroPeople.length >= 3) return;
    heroPreviewIds.add(freelancerKey);
    heroPeople.push(item);
  });

  const resetFilters = () => {
    setQ("");
    setCategory("all");
    setMinBudget("");
    setMaxBudget("");
    setSort("newest");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background pt-24 text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-24 h-72 w-72 rounded-full bg-primary/18 blur-3xl" />
        <div className="absolute right-[-8%] top-[22rem] h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-[1280px] flex-col gap-14 px-4 pb-20 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <section
            ref={categoryRailRef}
            onScroll={updateCategoryRailState}
            onWheel={handleCategoryRailWheel}
            className={cn(glassPanelClass, "no-scrollbar flex-1 overflow-x-auto rounded-full px-2 py-2 scroll-smooth")}
          >
            <div className="flex min-w-max gap-2 pr-4">
              <button type="button" onClick={() => { setCategory("all"); scrollToSection("marketplace-results"); }} className={cn("shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition", category === "all" ? "bg-primary text-primary-foreground" : "text-slate-300 hover:bg-white/[0.06] hover:text-white")}>All specialties</button>
              {categories.map((item) => {
                const Icon = item.icon;
                const active = category === item.value;
                return (
                  <button key={item.value} type="button" onClick={() => { setCategory(item.value); scrollToSection("marketplace-results"); }} className={cn("inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition", active ? "bg-primary text-primary-foreground" : "text-slate-300 hover:bg-white/[0.06] hover:text-white")}>
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </section>
          {(categoryRailState.left || categoryRailState.right) && (
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Scroll services left"
                disabled={!categoryRailState.left}
                className="h-10 w-10 rounded-full border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] disabled:opacity-40"
                onClick={() => scrollCategoryRail(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Scroll services right"
                disabled={!categoryRailState.right}
                className="h-10 w-10 rounded-full border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] disabled:opacity-40"
                onClick={() => scrollCategoryRail(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)] lg:items-center">
          <div className="space-y-7">
            <Badge className="rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-primary">Curated professional marketplace</Badge>
            <div className="space-y-5">
              <h1 className="max-w-3xl text-4xl font-medium tracking-[-0.045em] text-white sm:text-5xl lg:text-[64px] lg:leading-[1.02]">Hire specialist freelancers for high-leverage digital work.</h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">Explore verified service packages across product, growth, automation, cloud, and operations. Compare talent with the speed of a marketplace and the clarity of a curated shortlist.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="h-14 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground hover:bg-primary/90" onClick={() => scrollToSection("marketplace-results")}>Explore services</Button>
              <Button asChild variant="outline" size="lg" className="h-14 rounded-full border-white/10 bg-white/[0.04] px-7 text-base font-semibold text-white shadow-sm hover:bg-white/[0.08]">
                <Link to="/contact" className="inline-flex items-center gap-2">Talk to a strategist <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[34px] border border-primary/25 bg-[linear-gradient(180deg,rgba(21,18,9,0.96),rgba(8,8,7,0.99))] p-3 shadow-[0_30px_100px_-48px_color-mix(in_srgb,var(--primary)_18%,transparent)]">
            <div className="relative min-h-[320px] overflow-hidden rounded-[28px]">
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(33,28,13,0.96),rgba(11,11,9,0.98))]" />
              <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(250,204,21,0.10)_1px,transparent_1.4px)] [background-size:18px_18px]" />
              <div className="absolute left-[-8%] top-[-14%] h-64 w-64 rounded-full bg-primary/12 blur-3xl" />
              <div className="absolute bottom-[-22%] right-[-8%] h-64 w-64 rounded-full bg-primary/8 blur-3xl" />
              <div className="relative flex min-h-[320px] flex-col items-center justify-center p-10 text-center">
                <div className="mx-auto flex items-center justify-center -space-x-4">
                  {heroPeople.map((person) => {
                    const freelancerKey = person.freelancer?.id || person.freelancerId || person.id;
                    return (
                      <div key={freelancerKey} className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-[3px] border-[#18150d] bg-white text-lg font-semibold text-slate-700 shadow-[0_10px_24px_-14px_rgba(0,0,0,0.9)]">
                        {person.freelancer?.avatar ? (
                          <img src={person.freelancer.avatar} alt={person.freelancer.fullName || "Freelancer"} className="h-full w-full object-cover" />
                        ) : (
                          <span>{getInitials(person.freelancer?.fullName)}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-8 text-[17px] font-semibold tracking-[-0.03em] text-white sm:text-[20px]">
                  {heroExpertCount > 0 ? `${heroExpertCount}+ Verified Marketplace Experts Active` : "Verified Marketplace Experts Active"}
                </p>
                <p className="mt-3 max-w-[420px] text-sm text-white/58">
                  Capability-led matching with distinct, verified freelancer profiles.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 lg:grid-cols-6">
          {shortcuts.map((item) => {
            const Icon = item.icon;
            const active = category === item.value;
            return (
              <button key={item.value} type="button" onClick={() => { setCategory(item.value); scrollToSection("marketplace-results"); }} className={cn("group flex min-h-[88px] items-center gap-3 rounded-[24px] border px-4 py-4 text-left shadow-[0_24px_60px_-42px_rgba(2,6,23,0.72)] transition-all", active ? "border-primary/30 bg-primary/10 text-primary" : "border-white/10 bg-white/[0.04] text-white hover:border-white/15 hover:bg-white/[0.06]")}>
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", active ? "bg-primary/15 text-primary" : "bg-white/[0.06] text-slate-300")}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-[13px] font-semibold leading-5">{item.label}</p>
                  <p className="truncate text-[11px] leading-4 text-slate-400" title={item.description}>{item.description}</p>
                </div>
              </button>
            );
          })}
        </section>

        <section id="marketplace-results" className="space-y-6">
          <div className={cn(glassPanelClass, "rounded-[34px] p-5")}>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,2.2fr)_repeat(4,minmax(0,1fr))]">
              <div className="relative lg:col-span-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search services, categories, or freelancer names" className={cn("h-14 rounded-full pl-11 pr-10 text-sm shadow-none focus-visible:ring-sky-400/30", controlSurfaceClass)} />
                {q && <button type="button" onClick={() => setQ("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white"><X className="h-4 w-4" /></button>}
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className={cn("h-14 w-full rounded-full px-5 py-0 shadow-none data-[size=default]:h-14", controlSurfaceClass)}><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All specialties</SelectItem>
                  {categories.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" value={minBudget} onChange={(event) => setMinBudget(event.target.value)} placeholder="Min budget" className={cn("h-14 rounded-full px-5 shadow-none", controlSurfaceClass, numberFieldClass)} />
              <Input type="number" value={maxBudget} onChange={(event) => setMaxBudget(event.target.value)} placeholder="Max budget" className={cn("h-14 rounded-full px-5 shadow-none", controlSurfaceClass, numberFieldClass)} />
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className={cn("h-14 w-full rounded-full px-5 py-0 shadow-none data-[size=default]:h-14", controlSurfaceClass)}><SelectValue placeholder="Sort" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
                <span className="inline-flex items-center gap-2 font-medium text-white"><SlidersHorizontal className="h-4 w-4 text-primary" />{total} results</span>
                {category !== "all" && <Badge className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary">{categories.find((item) => item.value === category)?.label}</Badge>}
              </div>
              <Button variant="ghost" className="h-9 self-start rounded-full px-4 text-sm font-medium text-slate-300 hover:bg-white/[0.06] hover:text-white sm:self-auto" onClick={resetFilters}>Reset filters</Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {shortcuts.map((item) => {
              const Icon = item.icon;
              const active = category === item.value;
              return (
                <button key={`chip-${item.value}`} type="button" onClick={() => setCategory(item.value)} className={cn("inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition", active ? "border-primary/30 bg-primary/10 text-primary" : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20 hover:text-white")}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
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
              </motion.div>
            ) : data.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="rounded-[34px] border border-dashed border-white/10 bg-white/[0.04] px-6 py-20 text-center shadow-[0_24px_80px_-42px_rgba(2,6,23,0.82)]">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.06] text-slate-400"><Search className="h-7 w-7" /></div>
                <h2 className="mt-6 text-2xl font-semibold tracking-tight text-white">No services match this mix yet</h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-400">Try broadening the category, adjusting budget boundaries, or using a keyword like AI, cloud, or security.</p>
                <Button variant="outline" className="mt-7 rounded-full border-white/10 bg-white/[0.04] px-6 py-5 text-sm font-semibold text-white hover:bg-white/[0.08]" onClick={resetFilters}>Clear all filters</Button>
              </motion.div>
            ) : (
              <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
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
              </motion.div>
            )}
          </AnimatePresence>

          {!loading && totalPages > 1 && (
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
