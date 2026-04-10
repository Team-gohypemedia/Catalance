import React, { memo, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import FolderKanban from "lucide-react/dist/esm/icons/folder-kanban";
import MessageSquareText from "lucide-react/dist/esm/icons/message-square-text";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DashboardPanel,
  DashboardSkeletonBlock,
} from "@/components/client/client-dashboard/shared.jsx";
import { useOptionalClientDashboardData } from "./useClientDashboardData.js";
import { cn } from "@/shared/lib/utils";

const AcceptedFreelancerRow = memo(function AcceptedFreelancerRow({
  item,
  onOpenMessages,
}) {
  const handleMessageClick = item.onMessage || onOpenMessages;
  const actionLabel = item.actionLabel || "MESSAGE";

  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3.5 sm:gap-4">
      <Avatar className="size-11 shrink-0 border border-white/10 shadow-[0_10px_24px_rgba(0,0,0,0.2)]">
        <AvatarImage src={item.avatar} alt={item.name} />
        <AvatarFallback className="bg-[#1e293b] text-sm text-white">
          {item.initial}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0">
        <p className="truncate text-[1.08rem] font-semibold leading-tight tracking-[-0.03em] text-white">
          {item.name}
        </p>
        <p className="mt-0.5 truncate text-[0.94rem] leading-tight text-[#b3b3b3]">
          {item.role}
        </p>

        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5 text-[13px] leading-none text-muted-foreground">
          <FolderKanban className="h-3 w-3 shrink-0 text-[#7a7f89]" />
          <span className="min-w-0 truncate">{item.projectLabel}</span>
          <span className="shrink-0 text-[#7a7f89]">&bull;</span>
          <span className="truncate">{item.activityLabel}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleMessageClick}
        className="inline-flex h-10 min-w-23.5 shrink-0 items-center justify-center rounded-xl bg-white px-4 text-[13px] font-medium uppercase tracking-[0.01em] text-black transition-colors hover:bg-[#f2f2f2]"
      >
        {actionLabel}
      </button>
    </div>
  );
});

const ActiveChats = memo(function ActiveChats({
  acceptedFreelancers,
  acceptedFreelancersCount,
  acceptedFreelancersTotalCount,
  onOpenMessages,
  isLoading = false,
  className = "",
}) {
  const navigate = useNavigate();
  const dashboardData = useOptionalClientDashboardData();
  const items = useMemo(
    () =>
      Array.isArray(acceptedFreelancers)
        ? acceptedFreelancers
        : dashboardData?.acceptedFreelancers || [],
    [acceptedFreelancers, dashboardData?.acceptedFreelancers],
  );
  const resolvedAcceptedFreelancersCount = useMemo(() => {
    if (Number.isFinite(acceptedFreelancersCount)) {
      return acceptedFreelancersCount;
    }

    if (Number.isFinite(dashboardData?.acceptedFreelancersCount)) {
      return dashboardData.acceptedFreelancersCount;
    }

    return items.filter((item) => item?.chatUnlocked !== false).length;
  }, [acceptedFreelancersCount, dashboardData?.acceptedFreelancersCount, items]);
  const resolvedAcceptedFreelancersTotalCount = useMemo(() => {
    if (Number.isFinite(acceptedFreelancersTotalCount)) {
      return acceptedFreelancersTotalCount;
    }

    if (Number.isFinite(dashboardData?.acceptedFreelancersTotalCount)) {
      return dashboardData.acceptedFreelancersTotalCount;
    }

    return items.length;
  }, [acceptedFreelancersTotalCount, dashboardData?.acceptedFreelancersTotalCount, items.length]);
  const resolvedIsLoading = isLoading || dashboardData?.isLoading;
  const hasUnlockedChats = resolvedAcceptedFreelancersCount > 0;
  const hasMoreProjectsInMessages = resolvedAcceptedFreelancersTotalCount > items.length;
  const handleOpenMessages = useCallback(() => {
    if (typeof onOpenMessages === "function") {
      onOpenMessages();
      return;
    }

    navigate("/client/messages");
  }, [navigate, onOpenMessages]);

  return (
    <section className={cn("w-full min-w-0", className)}>
      <div className="mb-4 flex items-center justify-between gap-4 sm:mb-5">
        <div className="min-w-0">
          <h2 className="text-[1.75rem] font-semibold tracking-[-0.02em] text-white">
            Active Chats
          </h2>
        </div>
      </div>

      <DashboardPanel className="w-full overflow-hidden bg-card px-5 pb-5 pt-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:px-6 sm:pb-6 sm:pt-6">
        {resolvedIsLoading ? (
          <>
            <DashboardSkeletonBlock className="h-7 w-44 rounded-full" />
            <DashboardSkeletonBlock className="mt-3 h-4 w-64 rounded-full" />
            <div className="mt-8 space-y-6">
              {[0, 1].map((item) => (
                <div
                  key={`dashboard-chat-skeleton-${item}`}
                  className="flex items-start gap-3.5"
                >
                  <DashboardSkeletonBlock className="size-10 rounded-full" />
                  <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_96px] gap-x-2 gap-y-2">
                    <div className="space-y-2">
                      <DashboardSkeletonBlock className="h-5 w-36 rounded-full" />
                      <DashboardSkeletonBlock className="h-3 w-28 rounded-full" />
                      <DashboardSkeletonBlock className="h-3 w-44 rounded-full" />
                    </div>
                    <div className="row-span-2 flex flex-col justify-end gap-2">
                      <DashboardSkeletonBlock className="h-7 w-full rounded-xl" />
                      <DashboardSkeletonBlock className="h-7 w-full rounded-xl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <DashboardSkeletonBlock className="mt-9 h-4 w-40 rounded-full" />
          </>
        ) : items.length === 0 ? (
          <div className="flex min-h-55 flex-col items-center justify-center px-4 py-8 text-center sm:min-h-65 sm:py-10">
            <div className="flex size-12 items-center justify-center rounded-full bg-white/6 text-[#94a3b8] sm:size-14">
              <MessageSquareText className="size-6" />
            </div>
            <p className="mt-5 text-sm text-white">No active project chats yet</p>
            <p className="mt-2 max-w-55 text-xs text-[#8f8f8f]">
              Chat shortcuts appear here once a project becomes active and
              messaging is unlocked.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-5 sm:mt-6">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={cn(
                    "py-5",
                    index === 0 ? "pt-0" : "",
                    index === items.length - 1
                      ? "pb-0"
                      : "border-b border-white/8",
                  )}
                >
                  <AcceptedFreelancerRow
                    item={item}
                    onOpenMessages={handleOpenMessages}
                  />
                </div>
              ))}
            </div>

            {hasMoreProjectsInMessages ? (
              <button
                type="button"
                onClick={handleOpenMessages}
                className="mt-5 flex w-full items-center justify-center gap-2 border-t border-white/8 pt-5 text-[13px] font-medium uppercase tracking-[0.12em] text-[#d6d6d6] transition-colors hover:text-white"
              >
                <span>View All Projects In Messages ({resolvedAcceptedFreelancersTotalCount})</span>
                <ChevronRight className="size-3.75 stroke-[1.75]" />
              </button>
            ) : hasUnlockedChats ? (
              <button
                type="button"
                onClick={handleOpenMessages}
                className="mt-5 flex w-full items-center justify-center gap-2 border-t border-white/8 pt-5 text-[13px] font-medium uppercase tracking-[0.12em] text-[#d6d6d6] transition-colors hover:text-white"
              >
                <span>Open Messages ({resolvedAcceptedFreelancersCount})</span>
                <ChevronRight className="size-3.75 stroke-[1.75]" />
              </button>
            ) : (
              <p className="mt-5 border-t border-white/8 pt-5 text-center text-[12px] font-medium uppercase tracking-[0.12em] text-[#8f8f8f]">
                Messages unlock after kickoff payment
              </p>
            )}
          </>
        )}
      </DashboardPanel>
    </section>
  );
});

export default ActiveChats;
