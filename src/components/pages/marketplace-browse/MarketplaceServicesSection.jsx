import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, LayoutGrid, Search, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { cn } from "@/shared/lib/utils";

const RAIL_SCROLL_STEP = 280;

const ServiceChip = ({ service, active = false, onSelect }) => {
  const Icon = service.icon || LayoutGrid;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(service.key || service.value)}
      className={cn(
        "group inline-flex h-[150px] w-full flex-col items-start justify-between rounded-[22px] border px-4 py-4 text-left text-sm transition-all duration-200",
        active
          ? "border-[var(--primary)]/60 bg-[var(--primary)]/10 text-white shadow-[0_0_0_1px_rgba(var(--brand-rgb),0.18)]"
          : "border-white/10 bg-white/[0.04] text-slate-200 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
      )}
    >
      <span
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors",
          active
            ? "border-[var(--primary)]/35 bg-[var(--primary)]/14 text-[var(--primary)]"
            : "border-white/12 bg-white/[0.03] text-slate-300 group-hover:border-white/20 group-hover:text-white"
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>

      <span className="min-w-0 w-full">
        <span className="line-clamp-2 text-[17px] font-semibold leading-[1.25] tracking-[-0.01em] text-white sm:text-[18px]">
          {service.label}
        </span>
      </span>
    </button>
  );
};

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
    <div className="space-y-5 p-2 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">
            Professional Services
          </h2>
        </div>

        <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1 lg:w-[320px]">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              value={searchValue}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-12 rounded-full border border-white/10 bg-white/[0.035] pl-10 pr-10 text-sm text-white placeholder:text-slate-500 focus-visible:border-white/20 focus-visible:ring-0"
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
          <div className="shrink-0">
            {actions}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, index) => (
            <Skeleton
              key={`service-chip-skeleton-${index}`}
              className="h-[164px] w-full rounded-[22px]"
            />
          ))}
        </div>
      ) : services.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {services.map((service) => {
            const serviceIdentity = service.key || service.value || service.label;
            return (
              <ServiceChip
                key={serviceIdentity}
                service={service}
                active={activeServiceKey === (service.key || service.value)}
                onSelect={onSelectService}
              />
            );
          })}
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
