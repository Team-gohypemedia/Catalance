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
        "rounded-[28px] border border-white/[0.06] bg-[#232323]/90 backdrop-blur-[10px]",
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
        className="inline-flex size-8 items-center justify-center rounded-full border border-white/[0.08] bg-card text-white transition-colors hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:border-white/[0.08] disabled:bg-card disabled:text-white/35"
      >
        <ChevronLeft className="size-4" />
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={!canGoNext}
        aria-label={nextLabel}
        className="inline-flex size-8 items-center justify-center rounded-full border border-white/[0.08] bg-card text-white transition-colors hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:border-white/[0.08] disabled:bg-card disabled:text-white/35"
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

  return (
    <div
      className="mt-2.5 flex items-center justify-center gap-2"
      aria-label={ariaLabel}
    >
      {Array.from({ length: count }, (_, index) => {
        const isActive = index === activeIndex;

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
              "h-2.5 rounded-full transition-all duration-200",
              isActive
                ? "w-7 bg-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.32)]"
                : "w-2.5 bg-white/[0.14] hover:bg-white/[0.28]",
            )}
          />
        );
      })}
    </div>
  );
});
