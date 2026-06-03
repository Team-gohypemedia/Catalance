import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, LayoutGrid, CheckCircle2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import cataLogo from "@/assets/logos/logo.svg";

/* ─── 3D Icon / Logo Mappings ─── */
const SERVICE_LOGO_MODULES = import.meta.glob('../../assets/icons/*.png', {
  eager: true,
  import: 'default',
});

const normalizeServiceLogoKey = (value = '') =>
  String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[_-]+/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const SERVICE_LOGOS_BY_KEY = Object.entries(SERVICE_LOGO_MODULES).reduce((acc, [path, source]) => {
  const fileName = String(path || '').split('/').pop()?.replace(/\.png$/i, '') || '';
  const key = normalizeServiceLogoKey(fileName);
  if (key) {
    acc[key] = source;
  }
  return acc;
}, {});

const SERVICE_LOGO_KEYS = Object.keys(SERVICE_LOGOS_BY_KEY);

const SERVICE_LOGO_ALIASES = {
  branding: 'branding and brand identity',
  'branding kit': 'branding and brand identity',
  'web development': 'website development',
  website: 'website development',
  'website uiux': 'website development',
  'website ui ux': 'website development',
  seo: 'seo optimization',
  'seo search engine optimisation': 'seo optimization',
  'seo search engine optimization': 'seo optimization',
  'social media marketing organic': 'social media management',
  'paid advertising performance': 'performance marketing',
  'performance marketing': 'performance marketing',
  'app development android ios cross platform': 'app development',
  'software development web saas custom systems': 'software development',
  'writing content': 'writing and content',
  'whatsapp chatbot': 'whatsapp chat bot',
  'creative design': 'creative and design',
  'modeling 3d': '3d modeling',
  'cgi video services': 'cgi video',
  'crm erp integrated solutions': 'crm and erp solutions',
  'crm and erp integrated solutions': 'crm and erp solutions',
};

const resolveServiceLogoSrc = (service = {}) => {
  const candidates = [
    service.slug,
    service.key,
    service.value,
    service.id,
    service.name,
    service.label,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeServiceLogoKey(candidate);
    if (!normalized) continue;

    const mappedKey = SERVICE_LOGO_ALIASES[normalized] || normalized;
    if (SERVICE_LOGOS_BY_KEY[mappedKey]) return SERVICE_LOGOS_BY_KEY[mappedKey];

    const fuzzyKey = SERVICE_LOGO_KEYS.find((key) => key.includes(mappedKey) || mappedKey.includes(key));
    if (fuzzyKey) return SERVICE_LOGOS_BY_KEY[fuzzyKey];
  }

  return cataLogo;
};

/* ─── Service Card ─── */
const ServiceCarouselCard = ({ service, index, isActive, onSelect }) => {
  const Icon = service.icon || LayoutGrid;
  const logoSrc = resolveServiceLogoSrc(service);

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(service.key || service.value)}
      className="relative shrink-0 cursor-pointer outline-none group"
      whileHover={{
        rotateX: 3,
        rotateY: 3,
        rotate: isActive ? 0 : 1.5,
        scale: 1.03,
        transition: { duration: 0.28, ease: "easeOut" },
      }}
      whileTap={{ scale: 0.97 }}
      style={{ perspective: "800px" }}
    >
      {/* Outer glow when active */}
      {isActive && (
        <motion.div
          layoutId="active-card-glow"
          className="absolute -inset-[1px] rounded-[28px] bg-primary/20 blur-[2px]"
          initial={false}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}

      <div
        className={cn(
          "relative h-[290px] w-56 md:w-64 overflow-hidden rounded-[26px] border flex flex-col items-stretch justify-between p-5 transition-all duration-300 themed-card",
          isActive
            ? "border-primary/40 bg-primary/10 shadow-[0_0_40px_-10px_rgba(var(--brand-rgb),0.5)] dark:bg-primary/8"
            : "border-white/8 bg-white/[0.04] shadow-[0_20px_60px_-20px_rgba(2,6,23,0.7)] hover:border-white/15 dark:bg-slate-950/40"
        )}
      >
        {/* Subtle grid texture */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[26px] opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />

        {/* Top: step number + icon */}
        <div className="relative z-10 flex w-full items-start justify-between">
          <span
            className={cn(
              "font-mono text-[11px] font-bold tracking-[0.25em]",
              isActive ? "text-primary" : "text-slate-400 dark:text-slate-600"
            )}
          >
            {String(index).padStart(2, "0")}
          </span>
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors duration-200",
              isActive
                ? "border-primary/35 bg-primary/12 text-primary"
                : "border-black/5 bg-black/[0.02] text-slate-500 dark:border-white/12 dark:bg-white/[0.04] dark:text-slate-400"
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>

        {/* Center: 3D illustration */}
        <div className="flex-1 flex items-center justify-center w-full py-1">
          <img
            src={logoSrc}
            alt={service.label}
            className="w-24 h-24 object-contain drop-shadow-md group-hover:scale-[1.06] transition-transform duration-300"
          />
        </div>

        {/* Bottom: label + badge */}
        <div className="relative z-10 w-full space-y-3 text-center">
          <h3
            className={cn(
              "text-[16px] font-bold leading-snug tracking-tight text-center text-foreground dark:text-white",
              isActive ? "text-primary dark:text-primary" : ""
            )}
          >
            {service.label}
          </h3>

          {isActive ? (
            <span className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-[11px] font-semibold text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Active filter
            </span>
          ) : (
            <span className="mx-auto inline-flex items-center gap-1 rounded-full border border-black/8 bg-white/40 px-4 py-1.5 text-[11px] font-medium text-slate-500 dark:border-white/8 dark:bg-white/[0.03] dark:text-slate-400 group-hover:border-primary/30 group-hover:bg-white group-hover:text-primary dark:group-hover:bg-white/10 dark:group-hover:text-white transition-all duration-200">
              Tap to filter &rarr;
            </span>
          )}
        </div>

        {/* Corner check for active */}
        {isActive && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute right-3 top-3"
          >
            <CheckCircle2 className="h-4 w-4 text-primary fill-primary/20" />
          </motion.div>
        )}
      </div>
    </motion.button>
  );
};

/* ─── All-categories "reset" card ─── */
const AllServicesCard = ({ isActive, onSelect }) => (
  <motion.button
    type="button"
    onClick={() => onSelect("all")}
    className="relative shrink-0 cursor-pointer outline-none"
    whileHover={{ scale: 1.03, transition: { duration: 0.22 } }}
    whileTap={{ scale: 0.97 }}
  >
    {isActive && (
      <motion.div
        layoutId="active-card-glow"
        className="absolute -inset-[1px] rounded-[28px] bg-gradient-to-br from-primary/50 via-primary/20 to-transparent blur-[2px]"
        initial={false}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
    )}
    <div
      className={cn(
        "relative h-[260px] w-44 overflow-hidden rounded-[26px] border flex flex-col items-center justify-center gap-4 transition-all duration-300",
        isActive
          ? "border-primary/40 bg-primary/10"
          : "border-white/8 bg-white/[0.03] hover:border-white/15"
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl border",
          isActive
            ? "border-primary/35 bg-primary/12 text-primary"
            : "border-white/12 bg-white/[0.04] text-slate-400"
        )}
      >
        <LayoutGrid className="h-6 w-6" />
      </div>
      <div className="text-center">
        <p className={cn("text-[15px] font-semibold", isActive ? "text-white" : "text-slate-300")}>
          All
        </p>
        <p className="text-[11px] text-slate-500">Browse all</p>
      </div>
      {isActive && <CheckCircle2 className="h-4 w-4 text-primary fill-primary/20" />}
    </div>
  </motion.button>
);

/* ─── Main Carousel ─── */
const ServiceCategoryCarousel = ({
  services = [],
  loading = false,
  activeServiceKey = "all",
  onSelectService,
}) => {
  const carouselRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollability = () => {
    const rail = carouselRef.current;
    if (!rail) return;
    const maxScroll = Math.max(rail.scrollWidth - rail.clientWidth, 0);
    setCanScrollLeft(rail.scrollLeft > 4);
    setCanScrollRight(maxScroll - rail.scrollLeft > 4);
  };

  useEffect(() => {
    checkScrollability();
    window.addEventListener("resize", checkScrollability);
    return () => window.removeEventListener("resize", checkScrollability);
  }, [services.length, loading]);

  const scrollBy = (dir) => {
    carouselRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4 overflow-hidden px-3 py-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[260px] w-56 shrink-0 animate-pulse rounded-[26px] border border-white/5 bg-white/[0.03]"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full space-y-4">
      {/* Carousel track */}
      <div
        ref={carouselRef}
        className="flex overflow-x-auto scroll-smooth overscroll-x-contain [scrollbar-width:none] pt-4 pb-2"
        onScroll={checkScrollability}
      >
        <div className="flex gap-3 px-6">


          {services.map((service, idx) => (
            <motion.div
              key={service.key || service.value}
              initial={{ opacity: 0, y: 16 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { duration: 0.38, delay: 0.06 * (idx + 1), ease: "easeOut" },
              }}
            >
              <ServiceCarouselCard
                service={service}
                index={idx + 1}
                isActive={activeServiceKey === (service.key || service.value)}
                onSelect={onSelectService}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      <div className="flex w-full justify-end gap-2 pr-6 sm:pr-8 lg:pr-[40px]">
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          disabled={!canScrollLeft}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-slate-300 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white disabled:opacity-25 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => scrollBy(1)}
          disabled={!canScrollRight}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-slate-300 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white disabled:opacity-25 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export { ServiceCategoryCarousel, ServiceCarouselCard };
export default ServiceCategoryCarousel;
