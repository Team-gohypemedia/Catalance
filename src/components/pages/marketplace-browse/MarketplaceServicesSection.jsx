import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { cn } from "@/shared/lib/utils";

const RAIL_SCROLL_STEP = 280;

const ServiceChip = ({ service, active = false, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect?.(service.key)}
    className={cn(
      "group inline-flex h-[62px] min-w-[220px] shrink-0 items-center rounded-[5px] border px-5 text-left text-sm transition-all duration-200",
      active
        ? "border-[#fbcc15]/45 bg-[#fbcc15]/10 text-white shadow-[0_0_0_1px_rgba(251,204,21,0.12)]"
        : "border-white/10 bg-white/[0.04] text-slate-200 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
    )}
  >
    <span className="min-w-0 flex-1">
      <span className="block truncate text-[17px] font-semibold leading-tight text-white sm:text-[18px]">
        {service.label}
      </span>
    </span>
  </button>
);

const MarketplaceServicesSection = ({
  services = [],
  loading = false,
  searchValue = "",
  searchPlaceholder = "Search services",
  onSearchChange,
  onSelectService,
  activeServiceKey = "all",
  actions = null,
}) => {
  const railRef = useRef(null);
  const [railState, setRailState] = useState({ left: false, right: false });

  useEffect(() => {
    const updateRailState = () => {
      const rail = railRef.current;
      if (!rail) return;
      const maxScrollLeft = Math.max(rail.scrollWidth - rail.clientWidth, 0);
      setRailState({
        left: rail.scrollLeft > 4,
        right: maxScrollLeft - rail.scrollLeft > 4,
      });
    };

    updateRailState();
    window.addEventListener("resize", updateRailState);
    return () => window.removeEventListener("resize", updateRailState);
  }, [services.length, loading]);

  const updateRailState = () => {
    const rail = railRef.current;
    if (!rail) return;
    const maxScrollLeft = Math.max(rail.scrollWidth - rail.clientWidth, 0);
    setRailState({
      left: rail.scrollLeft > 4,
      right: maxScrollLeft - rail.scrollLeft > 4,
    });
  };

  const scrollRail = (direction) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * RAIL_SCROLL_STEP, behavior: "smooth" });
  };

  const handleWheel = (event) => {
    const rail = railRef.current;
    if (!rail) return;
    if (rail.scrollWidth <= rail.clientWidth) return;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.preventDefault();
    rail.scrollBy({ left: event.deltaY, behavior: "auto" });
  };

  return (
    <div className="space-y-5 rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_24px_70px_-42px_rgba(2,6,23,0.82)] backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">
            Professional Services
          </h2>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          <div className="relative min-w-0 flex-1 lg:w-[320px]">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              value={searchValue}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-11 rounded-full border border-white/10 bg-white/[0.04] pl-10 pr-10 text-sm text-white placeholder:text-slate-500 focus-visible:ring-0"
            />
            {searchValue ? (
              <button
                type="button"
                onClick={() => onSearchChange?.("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          {actions}
        </div>
      </div>

      {loading ? (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton
              key={`service-chip-skeleton-${index}`}
              className="h-[62px] w-52 shrink-0 rounded-[5px]"
            />
          ))}
        </div>
      ) : services.length ? (
        <div className="relative">
          <button
            type="button"
            aria-label="Scroll services left"
            onClick={() => scrollRail(-1)}
            disabled={!railState.left}
            className="absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/55 text-slate-300 backdrop-blur-md transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Scroll services right"
            onClick={() => scrollRail(1)}
            disabled={!railState.right}
            className="absolute right-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/55 text-slate-300 backdrop-blur-md transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div
            ref={railRef}
            onScroll={updateRailState}
            onWheel={handleWheel}
            className="no-scrollbar flex items-center gap-3 overflow-x-auto scroll-smooth px-12 py-1"
          >
            {services.map((service) => {
              return (
                <ServiceChip
                  key={service.key}
                  service={service}
                  active={activeServiceKey === service.key}
                  onSelect={onSelectService}
                />
              );
            })}
          </div>

          {railState.left ? (
            <div className="pointer-events-none absolute bottom-0 left-10 top-0 w-14 bg-gradient-to-r from-[#111111] via-[#111111]/82 to-transparent" />
          ) : null}
          {railState.right ? (
            <div className="pointer-events-none absolute bottom-0 right-10 top-0 w-14 bg-gradient-to-l from-[#111111] via-[#111111]/82 to-transparent" />
          ) : null}
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-5 py-10 text-center">
          <p className="text-base font-semibold text-white">No services match this search.</p>
          <p className="mt-2 text-sm text-slate-400">
            Try a broader keyword or clear the search.
          </p>
        </div>
      )}
    </div>
  );
};

export default MarketplaceServicesSection;
