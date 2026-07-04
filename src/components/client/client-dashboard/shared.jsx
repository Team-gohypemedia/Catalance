import React, { memo } from "react";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";

const dashboardSkeletonClassName = "bg-white/[0.08]";

export const DashboardPanel = memo(function DashboardPanel({
  className,
  children,
  ...props
}) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-[28px] border border-white/[0.06] bg-card backdrop-blur-[10px]",
        className,
      )}
    >
      {children}
    </div>
  );
});

export const DashboardSkeletonBlock = memo(function DashboardSkeletonBlock({
  className,
}) {
  return <Skeleton className={cn(dashboardSkeletonClassName, className)} />;
});

export const ProjectCarouselControls = memo(function ProjectCarouselControls({
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  previousLabel = "Show previous items",
  nextLabel = "Show next items",
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onPrevious}
        disabled={!canGoPrevious}
        aria-label={previousLabel}
        className="inline-flex size-8 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="size-4" />
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={!canGoNext}
        aria-label={nextLabel}
        className="inline-flex size-8 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
});

export const ProjectCarouselDots = memo(function ProjectCarouselDots({
  count,
  activeIndex,
  onSelect,
  ariaLabel = "Carousel pagination",
  getDotLabel,
}) {
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
            key={`dashboard-dot-${index}`}
            type="button"
            onClick={() => onSelect(index)}
            aria-label={
              typeof getDotLabel === "function"
                ? getDotLabel(index)
                : `Go to slide ${index + 1}`
            }
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
});
