"use client";

import React from "react";
import Bell from "lucide-react/dist/esm/icons/bell";
import BriefcaseBusiness from "lucide-react/dist/esm/icons/briefcase-business";
import CalendarDays from "lucide-react/dist/esm/icons/calendar-days";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Clock3 from "lucide-react/dist/esm/icons/clock-3";
import FolderKanban from "lucide-react/dist/esm/icons/folder-kanban";
import Heart from "lucide-react/dist/esm/icons/heart";
import MessageSquareText from "lucide-react/dist/esm/icons/message-square-text";
import Plus from "lucide-react/dist/esm/icons/plus";
import Receipt from "lucide-react/dist/esm/icons/receipt";
import Send from "lucide-react/dist/esm/icons/send";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Star from "lucide-react/dist/esm/icons/star";
import Wallet from "lucide-react/dist/esm/icons/wallet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";

const FIGMA_PROJECT_IMAGE =
  "https://www.figma.com/api/mcp/asset/4acce3fe-79ed-4308-b085-bac7b8198fb2";

const metricIconMap = {
  wallet: Wallet,
  folder: FolderKanban,
  receipt: Receipt,
};

const activityIconMap = {
  proposal: BriefcaseBusiness,
  project: FolderKanban,
  message: MessageSquareText,
  milestone: Sparkles,
  success: CheckCircle2,
};

const activityToneMap = {
  blue: "bg-[#3b82f6]/10 text-[#60a5fa]",
  amber: "bg-[#ffc107]/10 text-[#ffc107]",
  green: "bg-[#22c55e]/10 text-[#34d399]",
  violet: "bg-[#a855f7]/10 text-[#c084fc]",
  slate: "bg-[#334155]/70 text-[#94a3b8]",
};

const showcaseToneMap = {
  amber: "bg-[#ffc107] text-[#0a0a0a] hover:bg-[#ffd54f]",
  slate: "bg-[#1e293b]/60 text-[#f1f5f9] hover:bg-[#334155]",
  success: "bg-[#22c55e]/15 text-[#bbf7d0] hover:bg-[#22c55e]/20",
};

const footerLinks = [
  { label: "Privacy Policy", key: "privacy" },
  { label: "Terms of Service", key: "terms" },
  { label: "Support Center", key: "support" },
];

const siteLinks = [
  { label: "Home", key: "home" },
  { label: "Marketplace", key: "marketplace" },
  { label: "Service", key: "service" },
  { label: "Contact", key: "contact" },
];

const dashboardTabs = [
  { label: "Dashboard", key: "dashboard" },
  { label: "Proposals", key: "proposals" },
  { label: "Projects", key: "projects" },
  { label: "Messages", key: "messages" },
  { label: "Payments", key: "payments" },
];

const SectionCard = ({ className, children }) => (
  <div
    className={cn(
      "rounded-[24px] border border-[#1e293b] bg-[#303030]/40 shadow-[0px_0px_20px_0px_rgba(255,193,5,0.03)] backdrop-blur-[6px]",
      className,
    )}
  >
    {children}
  </div>
);

const BrandMark = () => (
  <div className="flex items-center gap-2">
    <div className="flex size-8 items-center justify-center rounded-full bg-[#facc15]">
      <div className="size-4 rounded-full border-2 border-[#0a0a0a]" />
    </div>
    <span className="text-base font-bold tracking-[-0.5px] text-white">
      Catalance
    </span>
  </div>
);

const DesktopLinks = ({ items, activeKey, onAction }) => (
  <div className="hidden items-center gap-8 lg:flex">
    {items.map((item) => (
      <button
        key={item.key}
        type="button"
        onClick={() => onAction(item.key)}
        className={cn(
          "text-sm font-medium transition-colors",
          item.key === activeKey ? "text-[#facc15]" : "text-[#94a3b8] hover:text-white",
        )}
      >
        {item.label}
      </button>
    ))}
  </div>
);

const MobileLinks = ({ items, activeKey, onAction }) => (
  <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden">
    {items.map((item) => (
      <button
        key={item.key}
        type="button"
        onClick={() => onAction(item.key)}
        className={cn(
          "rounded-full border px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
          item.key === activeKey
            ? "border-[#ffc107]/30 bg-[#ffc107]/15 text-[#ffc107]"
            : "border-white/10 bg-transparent text-[#94a3b8] hover:text-white",
        )}
      >
        {item.label}
      </button>
    ))}
  </div>
);

const MetricCard = ({ item }) => {
  const Icon = metricIconMap[item.iconKey] || Wallet;

  return (
    <div className="rounded-[20px] border border-white/[0.03] bg-linear-to-r from-[#2f2f2f] to-[#303030] p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[#ffc107]/10 text-[#ffc107]">
          <Icon className="size-5" />
        </div>
        {item.badge ? (
          <div
            className={cn(
              "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]",
              item.badgeTone === "green"
                ? "bg-[#22c55e]/10 text-[#34d399]"
                : "border border-white/10 bg-[#171717]/60 text-[#94a3b8]",
            )}
          >
            {item.badge}
          </div>
        ) : null}
      </div>
      <p className="mt-4 text-sm text-[#94a3b8]">{item.title}</p>
      <p className="mt-1 text-[30px] font-bold leading-[36px] tracking-[-0.75px] text-[#f1f5f9]">
        {item.value}
      </p>
      {item.detail ? (
        <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#34d399]">
          <Sparkles className="size-3.5" />
          <span>{item.detail}</span>
        </div>
      ) : null}
    </div>
  );
};

const ShowcaseCard = ({ item }) => (
  <article
    role="button"
    tabIndex={0}
    onClick={item.onClick}
    onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        item.onClick?.();
      }
    }}
    className="group flex w-full cursor-pointer flex-col overflow-hidden rounded-[18px] border border-[#1e293b] bg-[#141414] text-left transition-transform hover:-translate-y-0.5"
  >
    <div className="relative h-[210px] overflow-hidden bg-[#e5e7eb]">
      <img
        src={item.imageSrc || FIGMA_PROJECT_IMAGE}
        alt=""
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        loading="lazy"
      />
      <div className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-black/20 text-[#ef4444] backdrop-blur-sm">
        <Heart className="size-3.5 fill-current" />
      </div>
    </div>

    <div className="flex flex-1 flex-col gap-4 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="shrink-0 text-sm text-[#6b6b6b]">{item.eyebrow}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 text-white">
          <Clock3 className="size-4" />
          <span className="text-base font-medium">{item.amount}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="line-clamp-2 flex-1 text-[18px] font-semibold text-white">
          {item.title}
        </p>
        <p className="shrink-0 text-xs text-[#6b6b6b]">{item.secondaryAmount}</p>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <Star className="size-4 fill-[#ffc107] text-[#ffc107]" />
        <span className="font-semibold text-white">{item.metricPrimary}</span>
        <span className="text-xs text-[#cacaca]">{item.metricSecondary}</span>
      </div>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          item.onAction();
        }}
        className={cn(
          "mt-auto rounded-[6px] px-4 py-2.5 text-center text-sm transition-colors",
          showcaseToneMap[item.buttonTone] || showcaseToneMap.slate,
        )}
      >
        {item.buttonLabel}
      </button>
    </div>
  </article>
);

const ActivityRow = ({ item }) => {
  const Icon = activityIconMap[item.iconKey] || FolderKanban;

  return (
    <button
      type="button"
      onClick={item.onClick}
      className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-white/[0.02]"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full",
            activityToneMap[item.tone] || activityToneMap.slate,
          )}
        >
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#f1f5f9]">
            {item.title}
          </p>
          <p className="truncate text-xs text-[#94a3b8]">{item.subtitle}</p>
        </div>
      </div>
      <span className="shrink-0 text-xs text-[#64748b]">{item.timeLabel}</span>
    </button>
  );
};

const AppointmentSlotButton = ({ slot, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "rounded-[16px] border px-4 py-3 text-center text-xs font-medium transition-all",
      selected
        ? "border-[#ffc107] bg-[#ffc107]/20 text-[#ffc107] shadow-[0px_0px_20px_0px_rgba(255,193,7,0.3)]"
        : "border-white/10 text-[#cbd5e1] hover:border-[#ffc107]/30 hover:text-white",
    )}
  >
    {slot}
  </button>
);

const EmptyState = ({ title, description, actionLabel, onAction }) => (
  <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
    <div className="flex size-16 items-center justify-center rounded-full bg-[#1e293b] text-[#64748b]">
      <MessageSquareText className="size-7" />
    </div>
    <p className="mt-6 text-sm text-[#94a3b8]">{title}</p>
    <p className="mt-2 max-w-[220px] text-xs text-[#64748b]">{description}</p>
    <button
      type="button"
      onClick={onAction}
      className="mt-5 text-sm font-bold text-[#ffc107] transition-colors hover:text-[#facc15]"
    >
      {actionLabel}
    </button>
  </div>
);

const FooterLink = ({ item, onAction }) => (
  <button
    type="button"
    onClick={() => onAction(item.key)}
    className="text-xs text-[#64748b] transition-colors hover:text-[#f1f5f9]"
  >
    {item.label}
  </button>
);

const ClientDashboardShell = ({
  profile,
  metrics,
  showcaseItems,
  recentActivities,
  activeChats,
  appointmentCard,
  hero,
  unreadCount,
  draftCount,
  selectedAppointmentTime,
  onSelectAppointmentTime,
  onSiteNav,
  onDashboardNav,
  onOpenNotifications,
  onOpenProfile,
  onOpenQuickProject,
  onOpenViewProposals,
  onOpenViewProjects,
  onOpenMessenger,
  onFooterAction,
}) => (
  <div
    className="min-h-screen bg-[#212121] text-[#f1f5f9]"
    style={{
      backgroundImage:
        "radial-gradient(circle at 50% 50%, rgba(255,193,5,0.05) 0%, rgba(255,193,5,0) 24%), linear-gradient(90deg, #212121 0%, #212121 100%)",
    }}
  >
    <div className="mx-auto flex min-h-screen max-w-[1311px] flex-col px-4 pt-5 sm:px-6 lg:px-[40px]">
      <header className="mx-auto w-full max-w-[1024px] rounded-[40px] border border-white/10 bg-[#171717]/70 px-4 py-3 shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] backdrop-blur-[6px] sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <BrandMark />
          <DesktopLinks items={siteLinks} activeKey="home" onAction={onSiteNav} />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenProfile}
              className="flex items-center gap-2 rounded-full bg-[#facc15] px-3 py-2 text-sm font-semibold text-black transition-transform hover:scale-[1.01]"
            >
              <Avatar className="size-7 border border-black/10">
                <AvatarImage src={profile.avatar} alt={profile.name} />
                <AvatarFallback className="bg-black/5 text-xs font-semibold text-black">
                  {profile.initial}
                </AvatarFallback>
              </Avatar>
              <span className="max-w-[120px] truncate">{profile.name}</span>
            </button>
          </div>
        </div>
        <div className="mt-4 lg:hidden">
          <MobileLinks items={siteLinks} activeKey="home" onAction={onSiteNav} />
        </div>
      </header>

      <main className="flex-1 pb-12">
        <div className="mt-7 border-b border-[#ffc107]/10 pb-3">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <DesktopLinks
                items={dashboardTabs}
                activeKey="dashboard"
                onAction={onDashboardNav}
              />
              <MobileLinks
                items={dashboardTabs}
                activeKey="dashboard"
                onAction={onDashboardNav}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onOpenQuickProject}
                className="flex items-center gap-2 rounded-[16px] bg-[#ffc107] px-4 py-2 text-sm font-bold text-[#0a0a0a] transition-colors hover:bg-[#ffd54f]"
              >
                <Plus className="size-4" />
                <span>Project</span>
              </button>
              <button
                type="button"
                onClick={onOpenNotifications}
                className="relative flex size-9 items-center justify-center text-[#94a3b8] transition-colors hover:text-white"
                aria-label="Open notifications"
              >
                <Bell className="size-4.5" />
                {unreadCount > 0 ? (
                  <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#ffc107]" />
                ) : null}
              </button>
            </div>
          </div>
        </div>

        <section className="mt-14 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-[-0.75px] text-[#f1f5f9]">
              {hero.greeting}, {hero.firstName}
            </h1>
            <p className="mt-2 text-sm text-[#94a3b8]">{hero.description}</p>
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#64748b]">
            {hero.dateLabel}
          </p>
        </section>

        <section className="mt-14 grid gap-4 md:grid-cols-3">
          {metrics.map((item) => (
            <MetricCard key={item.title} item={item} />
          ))}
        </section>

        <section className="mt-14">
          <div className="mb-5 flex items-center gap-3">
            <h2 className="text-[18px] font-bold leading-7 text-[#f1f5f9]">
              Running Projects
            </h2>
            <span className="size-[15px] rounded-full bg-[#10b981]/10 p-[4.5px]">
              <span className="block size-[6px] rounded-full bg-[#10b981]" />
            </span>
          </div>

          <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
            {showcaseItems.map((item) => (
              <ShowcaseCard key={item.id} item={item} />
            ))}
          </div>
        </section>

        <section className="mt-14 grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
          <SectionCard className="overflow-hidden">
            <div className="border-b border-white/5 px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-[18px] font-bold leading-7 text-[#f1f5f9]">
                  Recent Activity
                </h2>
                <button
                  type="button"
                  onClick={onOpenViewProjects}
                  className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ffc107] transition-colors hover:text-[#facc15]"
                >
                  View All
                </button>
              </div>
            </div>
            <div>
              {recentActivities.map((item) => (
                <ActivityRow key={item.id} item={item} />
              ))}
            </div>
          </SectionCard>

          <div className="space-y-6">
            <SectionCard className="p-6">
              <h2 className="text-[18px] font-bold leading-7 text-[#f1f5f9]">
                Action Center
              </h2>
              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={onOpenQuickProject}
                  className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-[#ffc107] px-4 py-3 text-base font-bold text-[#0a0a0a] transition-colors hover:bg-[#ffd54f]"
                >
                  <Send className="size-4.5" />
                  <span>New Proposal</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenViewProposals}
                  className="w-full rounded-[16px] bg-[#1e293b]/50 px-4 py-3 text-base font-semibold text-[#f1f5f9] transition-colors hover:bg-[#334155]"
                >
                  View Proposals
                </button>
                <button
                  type="button"
                  onClick={onOpenViewProjects}
                  className="w-full rounded-[16px] bg-[#1e293b]/50 px-4 py-3 text-base font-semibold text-[#f1f5f9] transition-colors hover:bg-[#334155]"
                >
                  View Projects
                </button>
              </div>
              {draftCount > 0 ? (
                <p className="mt-4 text-xs text-[#94a3b8]">
                  {draftCount} saved proposal{draftCount > 1 ? "s" : ""} ready to continue.
                </p>
              ) : null}
            </SectionCard>

            <SectionCard className="p-6">
              <h2 className="text-[18px] font-bold leading-7 text-[#f1f5f9]">
                Active Chat
              </h2>
              {activeChats.length === 0 ? (
                <EmptyState
                  title="No active chats yet"
                  description="Your conversations with freelancers and project managers will appear here."
                  actionLabel="Open Messenger"
                  onAction={onOpenMessenger}
                />
              ) : (
                <div className="mt-6 space-y-4">
                  {activeChats.map((chat) => (
                    <button
                      key={chat.id}
                      type="button"
                      onClick={chat.onClick}
                      className="flex w-full items-center gap-3 rounded-[18px] border border-white/5 bg-black/10 px-3 py-3 text-left transition-colors hover:bg-black/20"
                    >
                      <Avatar className="size-12 border border-white/10">
                        <AvatarImage src={chat.avatar} alt={chat.name} />
                        <AvatarFallback className="bg-[#1e293b] text-sm text-white">
                          {chat.initial}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-[#f1f5f9]">
                            {chat.name}
                          </p>
                          <span
                            className={cn(
                              "size-2 rounded-full",
                              chat.isOnline ? "bg-[#22c55e]" : "bg-[#64748b]",
                            )}
                          />
                        </div>
                        <p className="truncate text-xs text-[#94a3b8]">{chat.subtitle}</p>
                        {chat.message ? (
                          <p className="mt-1 truncate text-xs text-[#64748b]">
                            {chat.message}
                          </p>
                        ) : null}
                      </div>
                    </button>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onOpenMessenger}
                    className="h-auto justify-start px-0 text-sm font-bold text-[#ffc107] hover:bg-transparent hover:text-[#facc15]"
                  >
                    Open Messenger
                  </Button>
                </div>
              )}
            </SectionCard>

            <SectionCard className="overflow-hidden">
              <div className="px-6 pb-4 pt-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ffc107]/80">
                  Appointment
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-[-0.6px] text-[#f1f5f9]">
                  With Project Manager
                </h2>
              </div>

              <div className="flex items-center justify-between border-y border-white/5 bg-white/5 px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="size-12 border-2 border-[#ffc107]/20">
                      <AvatarImage src={appointmentCard.avatar} alt={appointmentCard.managerName} />
                      <AvatarFallback className="bg-[#1e293b] text-sm text-white">
                        {appointmentCard.initial}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 size-3.5 rounded-full border-2 border-[#1e1e1e] bg-[#22c55e]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#f1f5f9]">
                      {appointmentCard.managerName}
                    </p>
                    <p className="text-xs text-[#94a3b8]">{appointmentCard.managerStatus}</p>
                  </div>
                </div>
                <CalendarDays className="size-5 text-[#94a3b8]" />
              </div>

              <div className="px-6 py-4">
                <p className="text-xs text-[#94a3b8]">
                  Selected Date:{" "}
                  <span className="font-medium text-[#f1f5f9]">
                    {appointmentCard.dateLabel}
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 px-6 pb-6">
                {appointmentCard.slots.map((slot) => (
                  <AppointmentSlotButton
                    key={slot}
                    slot={slot}
                    selected={slot === selectedAppointmentTime}
                    onClick={() => onSelectAppointmentTime(slot)}
                  />
                ))}
              </div>

              <div className="px-6 pb-6">
                <button
                  type="button"
                  onClick={appointmentCard.onBook}
                  className="w-full rounded-[24px] bg-[#ffc107] px-5 py-4 text-base font-bold text-black transition-colors hover:bg-[#ffd54f]"
                >
                  Book Appointment
                </button>
                {appointmentCard.projectTitle ? (
                  <p className="mt-3 text-center text-xs text-[#64748b]">
                    Booking for {appointmentCard.projectTitle}
                  </p>
                ) : null}
              </div>
            </SectionCard>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#1e293b]/50 px-2 py-8">
        <div className="flex flex-col gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p className="text-xs text-[#64748b]">
            Copyright 2026 Catalance. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:justify-end">
            {footerLinks.map((item) => (
              <FooterLink key={item.key} item={item} onAction={onFooterAction} />
            ))}
          </div>
        </div>
      </footer>
    </div>
  </div>
);

export default ClientDashboardShell;
