import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Wrench } from "lucide-react";
import { cn } from "@/shared/lib/utils";

const DEFAULT_LIMIT = 8;
const RAIL_SCROLL_STEP = 280;

const TechnologyChips = ({
  items = [],
  selectedValues = [],
  onToggle,
  limit = DEFAULT_LIMIT,
  horizontal = false,
  chipStyle = "default",
  itemClassName,
  emptyLabel = "No technologies surfaced yet.",
  className,
}) => {
  const railRef = useRef(null);
  const [railState, setRailState] = useState({ left: false, right: false });
  const [expanded, setExpanded] = useState(false);
  const isSubtypeStyle = chipStyle === "subtype";
  const visibleItems = horizontal || expanded ? items : items.slice(0, limit);
  const hiddenCount = Math.max(items.length - visibleItems.length, 0);

  const updateRailState = () => {
    const rail = railRef.current;
    if (!rail) return;
    const maxScrollLeft = Math.max(rail.scrollWidth - rail.clientWidth, 0);
    setRailState({
      left: rail.scrollLeft > 4,
      right: maxScrollLeft - rail.scrollLeft > 4,
    });
  };

  useEffect(() => {
    if (!horizontal) return undefined;
    updateRailState();
    window.addEventListener("resize", updateRailState);
    return () => window.removeEventListener("resize", updateRailState);
  }, [horizontal, items.length]);

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

  if (!items.length) {
    if (!String(emptyLabel || "").trim()) {
      return null;
    }
    return (
      <p className={cn("text-sm text-slate-500", className)}>
        {emptyLabel}
      </p>
    );
  }

  const content = visibleItems.map((item) => {
    const active = selectedValues.includes(item.key);
    return (
      <button
        key={item.key}
        type="button"
        onClick={() => onToggle?.(item.key)}
        className={cn(
          isSubtypeStyle
            ? "group inline-flex min-h-[38px] min-w-[125px] items-center gap-2 rounded-xl border px-3 py-1.5 text-left text-[13px] transition-all duration-300"
            : "group inline-flex min-h-[52px] min-w-[170px] items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-all duration-300",
          horizontal ? "shrink-0" : "flex-1",
          active
            ? "border-primary bg-primary/8 text-primary shadow-sm dark:text-white"
            : isSubtypeStyle
              ? "border-border bg-card/45 text-muted-foreground hover:border-primary/20 hover:bg-card/75 dark:border-white/10 dark:bg-white/[0.015] dark:text-slate-300"
              : "border-border bg-card/45 text-muted-foreground hover:border-primary/20 hover:bg-card/75 dark:border-white/8 dark:bg-white/[0.04] dark:text-slate-300"
        , itemClassName)}
      >
        <span
          className={cn(
            isSubtypeStyle
              ? "flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full transition-colors"
              : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
            active ? "bg-primary text-primary-foreground" : "bg-muted text-primary dark:bg-white/[0.06]"
          )}
        >
          <Wrench className={isSubtypeStyle ? "h-3 w-3" : "h-3.5 w-3.5"} />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate font-semibold leading-tight text-foreground dark:text-white",
              isSubtypeStyle ? "text-[13px] sm:text-[13.5px]" : "text-[15px] sm:text-[16px]"
            )}
          >
            {item.label}
          </span>
        </span>
      </button>
    );
  });

  if (horizontal) {
    return (
      <div className={cn("relative group/rail w-full overflow-visible", className)}>
        {/* Left scroll button */}
        <button
          type="button"
          aria-label="Scroll technologies left"
          onClick={() => scrollRail(-1)}
          disabled={!railState.left}
          className="absolute -left-3.5 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background/90 text-muted-foreground shadow-md transition-all duration-300 hover:scale-105 hover:border-primary hover:bg-background hover:text-foreground disabled:pointer-events-none disabled:opacity-0 dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-300"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Right scroll button */}
        <button
          type="button"
          aria-label="Scroll technologies right"
          onClick={() => scrollRail(1)}
          disabled={!railState.right}
          className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background/90 text-muted-foreground shadow-md transition-all duration-300 hover:scale-105 hover:border-primary hover:bg-background hover:text-foreground disabled:pointer-events-none disabled:opacity-0 dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-300"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <div
          ref={railRef}
          onScroll={updateRailState}
          onWheel={handleWheel}
          className={cn(
            "no-scrollbar flex flex-nowrap items-center overflow-x-auto scroll-smooth px-1.5 py-1.5",
            isSubtypeStyle ? "gap-2" : "gap-2.5"
          )}
        >
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {content}

      {hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className={cn(
            "inline-flex items-center border border-dashed border-white/15 bg-white/[0.03] text-sm font-medium text-slate-300 transition hover:border-white/25 hover:bg-white/[0.07] hover:text-white",
            isSubtypeStyle ? "min-h-[38px] rounded-xl px-3 py-1.5" : "min-h-[52px] rounded-xl px-3.5 py-2.5"
          )}
        >
          +{hiddenCount} more
        </button>
      ) : null}

      {expanded && items.length > limit ? (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className={cn(
            "inline-flex items-center border border-white/10 bg-transparent text-sm font-medium text-slate-400 transition hover:border-white/20 hover:text-white",
            isSubtypeStyle ? "min-h-[38px] rounded-xl px-3 py-1.5" : "min-h-[52px] rounded-xl px-3.5 py-2.5"
          )}
        >
          Show less
        </button>
      ) : null}
    </div>
  );
};

export default TechnologyChips;
