import React from "react";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";

const FREELANCER_DASHBOARD_PANEL_CLASSNAME =
  "overflow-hidden rounded-[24px] border border-white/[0.08] bg-card";

const freelancerDashboardSkeletonClassName = "bg-white/[0.08]";

export const FreelancerDashboardPanel = ({ className = "", children, ...props }) => (
  <div
    {...props}
    className={cn(FREELANCER_DASHBOARD_PANEL_CLASSNAME, className)}
  >
    {children}
  </div>
);

export const FreelancerDashboardSkeletonBlock = ({ className }) => (
  <Skeleton className={cn(freelancerDashboardSkeletonClassName, className)} />
);

export const FreelancerProjectCarouselControls = ({
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  previousLabel = "Show previous items",
  nextLabel = "Show next items",
}) => (
  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={onPrevious}
      disabled={!canGoPrevious}
      aria-label={previousLabel}
      className="inline-flex size-8 items-center justify-center rounded-full border border-white/[0.08] bg-card text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground disabled:cursor-not-allowed disabled:border-white/[0.08] disabled:bg-card disabled:text-muted-foreground disabled:opacity-40"
    >
      <ChevronLeft className="size-4" />
    </button>

    <button
      type="button"
      onClick={onNext}
      disabled={!canGoNext}
      aria-label={nextLabel}
      className="inline-flex size-8 items-center justify-center rounded-full border border-white/[0.08] bg-card text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground disabled:cursor-not-allowed disabled:border-white/[0.08] disabled:bg-card disabled:text-muted-foreground disabled:opacity-40"
    >
      <ChevronRight className="size-4" />
    </button>
  </div>
);

export const FreelancerCarouselDots = ({
  count,
  activeIndex,
  onSelect,
  ariaLabel = "Carousel pagination",
  getDotLabel = (index) => `Go to slide ${index + 1}`,
}) => {
  if (count <= 1) return null;

  const maxVisible = 5;
  let start = 0;
  let end = count;

  if (count > maxVisible) {
    start = Math.max(0, activeIndex - 2);
    end = start + maxVisible;
    if (end > count) {
      end = count;
      start = Math.max(0, end - maxVisible);
    }
  }

  return (
    <div
      className="mt-2.5 flex items-center justify-center gap-1.5 h-3"
      aria-label={ariaLabel}
    >
      {Array.from({ length: count }, (_, index) => {
        if (count > maxVisible && (index < start || index >= end)) {
          return null;
        }

        const isActive = index === activeIndex;

        let scaleClass = "scale-100";
        if (count > maxVisible) {
          const isFirstVisible = index === start;
          const isLastVisible = index === end - 1;
          const hasMoreBefore = start > 0;
          const hasMoreAfter = end < count;

          if ((isFirstVisible && hasMoreBefore) || (isLastVisible && hasMoreAfter)) {
            scaleClass = "scale-[0.6]";
          } else if (
            (index === start + 1 && hasMoreBefore) ||
            (index === end - 2 && hasMoreAfter)
          ) {
            scaleClass = "scale-[0.8]";
          }
        }

        return (
          <button
            key={`freelancer-carousel-dot-${index}`}
            type="button"
            onClick={() => onSelect(index)}
            aria-label={getDotLabel(index)}
            aria-pressed={isActive}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300 shrink-0",
              scaleClass,
              isActive
                ? "w-6 bg-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.32)]"
                : "w-1.5 bg-primary/20 hover:bg-primary/40",
            )}
          />
        );
      })}
    </div>
  );
};
