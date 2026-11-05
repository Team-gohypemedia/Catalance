import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Horizontal snap carousel: native swipe on touch, arrow buttons on desktop.
 * Returns the scroller ref + arrow state so the arrows can live in the section header.
 */
export function useCarousel(deps = []) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const [edges, setEdges] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [update, ...deps]);

  const scroll = (dir) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: reduce ? "auto" : "smooth" });
  };

  return { ref, edges, prev: () => scroll(-1), next: () => scroll(1), reset: () => ref.current?.scrollTo({ left: 0 }) };
}

export function CarouselArrows({ carousel, label, className, tone = "default" }) {
  const btn = cn(
    "flex size-11 cursor-pointer items-center justify-center rounded-full border transition-colors disabled:cursor-default disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    tone === "ink" ? "border-ink-line text-ink-fg hover:bg-ink-2" : "border-line-strong bg-surface text-fg hover:border-fg/40 hover:bg-surface-2",
  );
  return (
    <div className={cn("hidden gap-2 sm:flex", className)}>
      <button type="button" className={btn} onClick={carousel.prev} disabled={carousel.edges.start} aria-label={`Previous ${label}`}>
        <ChevronLeft className="size-5" strokeWidth={1.75} />
      </button>
      <button type="button" className={btn} onClick={carousel.next} disabled={carousel.edges.end} aria-label={`Next ${label}`}>
        <ChevronRight className="size-5" strokeWidth={1.75} />
      </button>
    </div>
  );
}

/** The scroll track. Children are list items; give them a width class. */
export function CarouselTrack({ carousel, label, className, children }) {
  return (
    <ul
      ref={carousel.ref}
      aria-label={label}
      className={cn(
        "-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pt-1 pb-4 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:gap-5 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:px-0 [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {children}
    </ul>
  );
}
