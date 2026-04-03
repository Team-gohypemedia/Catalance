import React, { memo, useEffect, useMemo, useState } from "react";
import BriefcaseBusiness from "lucide-react/dist/esm/icons/briefcase-business";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import FolderKanban from "lucide-react/dist/esm/icons/folder-kanban";
import MessageSquareText from "lucide-react/dist/esm/icons/message-square-text";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Wallet from "lucide-react/dist/esm/icons/wallet";
import {
  DashboardPanel,
  DashboardSkeletonBlock,
} from "@/components/client-dashboard/shared.jsx";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { cn } from "@/shared/lib/utils";

const MOBILE_RECENT_ACTIVITY_PREVIEW_COUNT = 2;

const activityIconMap = {
  proposal: BriefcaseBusiness,
  project: FolderKanban,
  message: MessageSquareText,
  milestone: Sparkles,
  budget: Wallet,
  success: CheckCircle2,
};

const activityToneMap = {
  blue: "bg-[#1f3558]/65 text-[#6ea8ff]",
  amber: "bg-[#3b2d0a] text-[#ffc107]",
  warning: "bg-[#3b2d0a] text-[#ffc107]",
  green: "bg-[#102e24] text-[#23d18b]",
  violet: "bg-[#33204c] text-[#c084fc]",
  slate: "bg-[#273142] text-[#94a3b8]",
};

const ActivityRow = memo(function ActivityRow({ item, compact = false }) {
  const Icon = activityIconMap[item.iconKey] || FolderKanban;
  const hasAction = typeof item.onAction === "function";
  const actionLabel = item.actionLabel || "View";

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
            activityToneMap[item.tone] || activityToneMap.slate,
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
          {hasAction ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                item.onAction();
              }}
              className="mt-3 inline-flex h-8 items-center justify-center rounded-[8px] bg-[#ffc107] px-3 text-xs font-semibold text-black transition-colors hover:bg-[#ffd54f]"
            >
              {actionLabel}
            </button>
          ) : null}
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
            activityToneMap[item.tone] || activityToneMap.slate,
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
      <div className="flex items-center gap-3 pl-12 sm:pl-13 lg:pl-0">
        {hasAction ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              item.onAction();
            }}
            className="inline-flex h-8 items-center justify-center rounded-[8px] bg-[#ffc107] px-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-black transition-colors hover:bg-[#ffd54f]"
          >
            {actionLabel}
          </button>
        ) : null}
        <span className="text-xs text-muted-foreground">{item.timeLabel}</span>
      </div>
    </button>
  );
});

const RecentActivity = memo(function RecentActivity({
  recentActivities,
  onOpenViewProjects,
  onOpenNotifications,
  isLoading = false,
  className = "",
}) {
  const isMobile = useIsMobile();
  const items = useMemo(
    () => (Array.isArray(recentActivities) ? recentActivities : []),
    [recentActivities],
  );
  const [showAllRecentActivities, setShowAllRecentActivities] = useState(false);

  useEffect(() => {
    if (!isMobile) {
      setShowAllRecentActivities(false);
    }
  }, [isMobile]);

  const hasOverflow = items.length > MOBILE_RECENT_ACTIVITY_PREVIEW_COUNT;
  const visibleActivities =
    isMobile && !showAllRecentActivities
      ? items.slice(0, MOBILE_RECENT_ACTIVITY_PREVIEW_COUNT)
      : items;
  const remainingActivityCount = Math.max(
    0,
    items.length - MOBILE_RECENT_ACTIVITY_PREVIEW_COUNT,
  );

  return (
    <section className={cn("w-full min-w-0", className)}>
      <div className="mb-4 flex items-center justify-between gap-4 sm:mb-5">
        <h2 className="text-[1.55rem] font-semibold tracking-[-0.04em] text-white sm:text-[1.65rem]">
          Recent Activity
        </h2>
        {!isLoading ? (
          <button
            type="button"
            onClick={
              typeof onOpenNotifications === "function"
                ? onOpenNotifications
                : onOpenViewProjects
            }
            className="ml-auto shrink-0 text-xs font-bold uppercase tracking-[0.18em] text-[#ffc107] transition-colors hover:text-[#ffd54f]"
          >
            View All
          </button>
        ) : null}
      </div>

      <DashboardPanel className="overflow-hidden bg-card">
        {isLoading ? (
          <div>
            {[0, 1, 2, 3].map((item) => (
              <div
                key={`dashboard-activity-skeleton-${item}`}
                className="flex items-center justify-between gap-4 border-b border-white/[0.05] px-6 py-5 last:border-b-0"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <DashboardSkeletonBlock className="size-10 rounded-full" />
                  <div className="min-w-0 space-y-2">
                    <DashboardSkeletonBlock className="h-4 w-40 rounded-full" />
                    <DashboardSkeletonBlock className="h-3 w-56 rounded-full" />
                  </div>
                </div>
                <DashboardSkeletonBlock className="h-3 w-14 rounded-full" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="px-5 py-6 text-sm text-[#8f96a3] sm:px-6">
            No recent activity yet.
          </div>
        ) : isMobile ? (
          <div className="px-3 pb-3 pt-3">
            <div className="space-y-1">
              {visibleActivities.map((item) => (
                <ActivityRow key={item.id} item={item} compact />
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
          <div>
            {items.map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </DashboardPanel>
    </section>
  );
});

export default RecentActivity;
