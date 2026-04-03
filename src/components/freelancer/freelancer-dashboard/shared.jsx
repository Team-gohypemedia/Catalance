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

export const FreelancerCarouselDots = ({
  count,
  activeIndex,
  onSelect,
  ariaLabel = "Carousel pagination",
  getDotLabel = (index) => `Go to slide ${index + 1}`,
}) => {
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
            key={`freelancer-carousel-dot-${index}`}
            type="button"
            onClick={() => onSelect(index)}
            aria-label={getDotLabel(index)}
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
};
