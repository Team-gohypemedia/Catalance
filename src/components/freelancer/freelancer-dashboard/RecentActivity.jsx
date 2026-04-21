import React, { useEffect, useState } from "react";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import FolderKanban from "lucide-react/dist/esm/icons/folder-kanban";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { cn } from "@/shared/lib/utils";
import {
  FreelancerDashboardPanel,
  FreelancerDashboardSkeletonBlock,
} from "./shared.jsx";

const ACTIVITY_TONE_STYLES = {
  amber: {
    icon: "bg-[#facc15]/10 text-[#facc15] ring-1 ring-[#facc15]/20",
  },
  blue: {
    icon: "bg-sky-500/10 text-sky-300 ring-1 ring-sky-500/20",
  },
  emerald: {
    icon: "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20",
  },
  violet: {
    icon: "bg-violet-500/10 text-violet-300 ring-1 ring-violet-500/20",
  },
  rose: {
    icon: "bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/20",
  },
  slate: {
    icon: "bg-secondary/70 text-muted-foreground ring-1 ring-border",
  },
};

const FREELANCER_MOBILE_RECENT_ACTIVITY_PREVIEW_COUNT = 2;
const FREELANCER_LOW_ACTIVITY_THRESHOLD = 2;
const FREELANCER_RECENT_ACTIVITY_PANEL_MIN_HEIGHT_CLASSNAME =
  "min-h-[320px] sm:min-h-[370px]";

export const FreelancerRecentActivitySkeleton = () => (
  <section className="w-full min-w-0">
    <div className="mb-4 flex items-center justify-between gap-4 sm:mb-5">
      <FreelancerDashboardSkeletonBlock className="h-8 w-44 rounded-full" />
      <FreelancerDashboardSkeletonBlock className="h-4 w-16 rounded-full" />
    </div>

    <FreelancerDashboardPanel
      className={cn(
        "overflow-hidden bg-card",
        FREELANCER_RECENT_ACTIVITY_PANEL_MIN_HEIGHT_CLASSNAME,
      )}
    >
      {[0, 1, 2, 3].map((item) => (
        <div
          key={`freelancer-activity-skeleton-${item}`}
          className="flex flex-col gap-3 px-4 py-4 sm:px-6 sm:py-5 lg:flex-row lg:items-center lg:justify-between lg:gap-4"
        >
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <FreelancerDashboardSkeletonBlock className="size-9 rounded-full sm:size-10" />
            <div className="min-w-0 space-y-2">
              <FreelancerDashboardSkeletonBlock className="h-4 w-40 rounded-full" />
              <FreelancerDashboardSkeletonBlock className="h-3 w-56 rounded-full" />
            </div>
          </div>
          <FreelancerDashboardSkeletonBlock className="h-3 w-12 rounded-full" />
        </div>
      ))}
    </FreelancerDashboardPanel>
  </section>
);

const FreelancerActivityRow = ({ item, compact = false }) => {
  const Icon = item.icon || FolderKanban;
  const tone = ACTIVITY_TONE_STYLES[item.tone] || ACTIVITY_TONE_STYLES.slate;

  if (compact) {
    return (
      <button
        type="button"
        onClick={item.onClick}
        className="flex w-full items-start gap-4 rounded-[18px] px-3 py-3 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div
          className={cn(
            "mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full",
            tone.icon,
          )}
        >
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[1.05rem] font-semibold leading-tight text-white">
            {item.title}
          </p>
          <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {item.subtitle}
          </p>
          <span className="mt-3 block text-xs text-muted-foreground">
            {item.timeLabel}
          </span>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={item.onClick}
      className="flex w-full flex-col gap-3 px-4 py-4 text-left transition-colors hover:bg-white/[0.02] sm:px-6 sm:py-5 lg:flex-row lg:items-center lg:justify-between lg:gap-4"
    >
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full sm:size-10",
            tone.icon,
          )}
        >
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{item.title}</p>
          <p className="text-xs leading-5 text-muted-foreground sm:truncate">
            {item.subtitle}
          </p>
        </div>
      </div>
      <span className="pl-12 text-xs text-muted-foreground sm:pl-13 lg:pl-0">
        {item.timeLabel}
      </span>
    </button>
  );
};

const RecentActivity = ({ recentActivities, onOpenViewAll, className = "" }) => {
  const isMobile = useIsMobile();
  const [showAllRecentActivities, setShowAllRecentActivities] = useState(false);

  useEffect(() => {
    if (!isMobile) {
      setShowAllRecentActivities(false);
    }
  }, [isMobile]);

  const hasOverflow =
    recentActivities.length > FREELANCER_MOBILE_RECENT_ACTIVITY_PREVIEW_COUNT;
  const visibleActivities =
    isMobile && !showAllRecentActivities
      ? recentActivities.slice(0, FREELANCER_MOBILE_RECENT_ACTIVITY_PREVIEW_COUNT)
      : recentActivities;
  const remainingActivityCount = Math.max(
    0,
    recentActivities.length - FREELANCER_MOBILE_RECENT_ACTIVITY_PREVIEW_COUNT,
  );
  const shouldShowLowActivityFiller =
    !isMobile &&
    recentActivities.length > 0 &&
    recentActivities.length <= FREELANCER_LOW_ACTIVITY_THRESHOLD;

  return (
    <section className={cn("flex h-full w-full min-w-0 flex-col", className)}>
      <div className="mb-4 flex items-center justify-between gap-4 sm:mb-5">
        <h2 className="text-[1.55rem] font-semibold tracking-[-0.04em] text-white sm:text-[1.65rem]">
          Recent Activity
        </h2>
        <button
          type="button"
          onClick={onOpenViewAll}
          className="ml-auto shrink-0 text-xs font-bold uppercase tracking-[0.18em] text-[#ffc107] transition-colors hover:text-[#ffd54f]"
        >
          View All
        </button>
      </div>

      <FreelancerDashboardPanel
        className={cn(
          "overflow-hidden bg-card",
          (recentActivities.length === 0 || shouldShowLowActivityFiller) && [
            "flex flex-1 flex-col",
            FREELANCER_RECENT_ACTIVITY_PANEL_MIN_HEIGHT_CLASSNAME,
          ],
        )}
      >
        {recentActivities.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 text-center text-sm text-[#8f96a3] sm:px-6 sm:py-12">
            No recent activity yet.
          </div>
        ) : isMobile ? (
          <div className="px-3 pb-3 pt-3">
            <div className="space-y-1">
              {visibleActivities.map((item) => (
                <FreelancerActivityRow key={item.id} item={item} compact />
              ))}
            </div>

            {hasOverflow ? (
              <div className="px-2 pt-4">
                <div className="h-px bg-white/[0.08]" />
                <button
                  type="button"
                  onClick={() => setShowAllRecentActivities((current) => !current)}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 text-sm font-semibold text-[#cbd5e1] transition-colors hover:text-white"
                  aria-expanded={showAllRecentActivities}
                >
                  <span>
                    {showAllRecentActivities
                      ? "Show Less"
                      : `View ${remainingActivityCount} More`}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-4 transition-transform duration-200",
                      showAllRecentActivities ? "rotate-180" : "rotate-0",
                    )}
                  />
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className={cn(shouldShowLowActivityFiller && "flex flex-1 flex-col")}>
            <div>
              {recentActivities.map((item) => (
                <FreelancerActivityRow key={item.id} item={item} />
              ))}
            </div>

            {shouldShowLowActivityFiller ? (
              <div className="flex flex-1 items-center justify-center border-t border-white/[0.06] px-6 py-10 text-center">
                <div className="max-w-xl">
                  <p className="text-sm font-semibold text-white/85">
                    More updates will appear here as your freelancer activity grows.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Proposal decisions, project starts, milestones, meetings, and
                    payout updates will automatically fill this space.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </FreelancerDashboardPanel>
    </section>
  );
};

export default RecentActivity;
