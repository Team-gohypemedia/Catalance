import React from "react";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import MessageSquare from "lucide-react/dist/esm/icons/message-square";
import {
  FreelancerDashboardPanel,
  FreelancerDashboardSkeletonBlock,
} from "./shared.jsx";

export const FreelancerChatsSkeleton = () => (
  <section className="w-full min-w-0">
    <div className="mb-6">
      <FreelancerDashboardSkeletonBlock className="h-8 w-40 rounded-full" />
    </div>
    <FreelancerDashboardPanel className="h-fit self-start p-4 sm:p-5">
      <div className="space-y-4 sm:space-y-5">
        {[0, 1].map((item) => (
          <div
            key={`freelancer-chat-skeleton-${item}`}
            className="rounded-[18px] bg-white/[0.03] px-3.5 py-3.5"
          >
            <div className="flex items-start gap-3">
              <FreelancerDashboardSkeletonBlock className="size-10 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <FreelancerDashboardSkeletonBlock className="h-5 w-36 rounded-full" />
                  <FreelancerDashboardSkeletonBlock className="h-3 w-12 rounded-full" />
                </div>
                <FreelancerDashboardSkeletonBlock className="h-4 w-full rounded-full" />
                <FreelancerDashboardSkeletonBlock className="h-4 w-2/3 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <FreelancerDashboardSkeletonBlock className="mt-8 h-4 w-40 rounded-full" />
    </FreelancerDashboardPanel>
  </section>
);

const ActiveChats = ({ previewMessages, onOpenMessages }) => (
  <section className="flex h-full w-full min-w-0 flex-col">
    <div className="mb-6">
      <h2 className="text-[1.75rem] font-semibold tracking-[-0.02em] text-white">
        Active Chats
      </h2>
    </div>
    <FreelancerDashboardPanel
      className={
        previewMessages.length === 0
          ? "flex h-[220px] flex-col p-4 sm:h-[260px] sm:p-5"
          : "flex h-fit flex-col p-4 sm:p-5"
      }
    >
      {previewMessages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center sm:py-10">
          <div className="flex size-12 items-center justify-center rounded-full bg-white/[0.06] text-muted-foreground sm:size-14">
            <MessageSquare className="size-6" />
          </div>
          <p className="mt-5 text-sm text-white">No active project chats yet</p>
          <p className="mt-2 max-w-[220px] text-xs text-[#8f8f8f]">
            Chat shortcuts appear here once a project becomes active and messaging is
            unlocked.
          </p>
        </div>
      ) : (
        <>
          <ul className="space-y-4 sm:space-y-5">
            {previewMessages.map((message) => (
              <li
                key={message.id}
                className="rounded-[18px] bg-white/[0.03] px-3.5 py-3.5"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#272a31] text-[11px] font-bold text-zinc-100">
                    {message.initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-zinc-100">
                            {message.senderName}
                          </p>
                          {message.projectLabel ? (
                            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[#94a3b8]">
                              {message.projectLabel}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm leading-5 text-zinc-200">
                          {message.previewText}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {message.timeLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onOpenMessages}
            className="mt-8 flex w-full items-center justify-center gap-2 text-[13px] font-bold uppercase tracking-[0.16em] text-[#8f8f8f] transition-colors hover:text-white"
          >
            <span>Open Messages ({previewMessages.length})</span>
            <ChevronRight className="size-[15px] stroke-[1.75]" />
          </button>
        </>
      )}
    </FreelancerDashboardPanel>
  </section>
);

export default ActiveChats;
