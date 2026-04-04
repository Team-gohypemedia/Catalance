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
                ? "group inline-flex min-h-[52px] min-w-[180px] items-center gap-2 rounded-full border px-3 py-2 text-left text-sm transition-all"
                : "group inline-flex min-h-[62px] min-w-[200px] items-center gap-2.5 rounded-full border px-3.5 py-2.5 text-left text-sm transition-all",
              horizontal ? "shrink-0" : "flex-1",
              active
                ? "border-[#fbcc15]/55 bg-[#fbcc15]/14 text-white shadow-[0_0_0_1px_rgba(251,204,21,0.14)]"
                : isSubtypeStyle
                  ? "border-white/10 bg-[#11151d]/90 text-slate-200 hover:border-[#fbcc15]/35 hover:bg-[#171d28] hover:text-white"
                  : "border-white/10 bg-white/[0.05] text-slate-200 hover:border-white/20 hover:bg-white/[0.09] hover:text-white"
            )}
          >
            <span
              className={cn(
                isSubtypeStyle
                  ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors"
                  : "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors",
                active ? "bg-[#fbcc15]/95 text-black" : "bg-white/[0.08] text-[#fbcc15]"
              )}
            >
              <Wrench className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  "block truncate font-semibold leading-tight text-white",
                  isSubtypeStyle ? "text-[15px] sm:text-[15px]" : "text-[17px] sm:text-base"
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
      <div className={cn("relative", className)}>
        <button
          type="button"
          aria-label="Scroll technologies left"
          onClick={() => scrollRail(-1)}
          disabled={!railState.left}
          className="absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/55 text-slate-300 backdrop-blur-md transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Scroll technologies right"
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
          className={cn(
            "no-scrollbar flex flex-nowrap items-center overflow-x-auto scroll-smooth px-12 py-1",
            isSubtypeStyle ? "gap-2.5" : "gap-3"
          )}
        >
          {content}
        </div>

        {railState.left ? (
          <div className="pointer-events-none absolute bottom-0 left-10 top-0 w-14 bg-gradient-to-r from-[#111111] via-[#111111]/82 to-transparent" />
        ) : null}
        {railState.right ? (
          <div className="pointer-events-none absolute bottom-0 right-10 top-0 w-14 bg-gradient-to-l from-[#111111] via-[#111111]/82 to-transparent" />
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {content}

      {hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className={cn(
            "inline-flex items-center border border-dashed border-white/15 bg-white/[0.03] text-sm font-medium text-slate-300 transition hover:border-white/25 hover:bg-white/[0.07] hover:text-white",
            isSubtypeStyle ? "min-h-[52px] rounded-xl px-3 py-2" : "min-h-[62px] rounded-full px-3.5 py-2.5"
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
            isSubtypeStyle ? "min-h-[52px] rounded-xl px-3 py-2" : "min-h-[62px] rounded-full px-3.5 py-2.5"
          )}
        >
          Show less
        </button>
      ) : null}
    </div>
  );
};

export default TechnologyChips;
