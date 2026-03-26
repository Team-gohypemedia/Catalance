"use client";

import React from "react";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import BriefcaseBusiness from "lucide-react/dist/esm/icons/briefcase-business";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import ClipboardList from "lucide-react/dist/esm/icons/clipboard-list";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import FolderKanban from "lucide-react/dist/esm/icons/folder-kanban";
import MessageSquareText from "lucide-react/dist/esm/icons/message-square-text";
import Repeat2 from "lucide-react/dist/esm/icons/repeat-2";
import ShieldAlert from "lucide-react/dist/esm/icons/shield-alert";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import Users from "lucide-react/dist/esm/icons/users";
import { Link } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import ClientDashboardFooter from "@/components/features/client/ClientDashboardFooter";
import {
  ProjectCardSkeleton,
  ProjectProposalCard,
} from "@/components/features/client/ClientProjects";
import ClientWorkspaceHeader from "@/components/features/client/ClientWorkspaceHeader";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { cn } from "@/shared/lib/utils";

const metricIconMap = {
  proposals: ClipboardList,
  freelancers: Users,
  tasks: ShieldAlert,
  projects: FolderKanban,
  payments: CreditCard,
};

const fullWidthMetricIds = new Set(["pending-approvals", "payments-summary"]);

const activityIconMap = {
  proposal: BriefcaseBusiness,
  project: FolderKanban,
  message: MessageSquareText,
  milestone: Sparkles,
  success: CheckCircle2,
};

const activityToneMap = {
  blue: "bg-[#1f3558]/65 text-[#6ea8ff]",
  amber: "bg-[#3b2d0a] text-[#ffc107]",
  green: "bg-[#102e24] text-[#23d18b]",
  violet: "bg-[#33204c] text-[#c084fc]",
  slate: "bg-[#273142] text-[#94a3b8]",
};

const draftToneMap = {
  amber: "bg-[#40310a] text-[#ffc107]",
  blue: "bg-[#19345d] text-[#60a5fa]",
  green: "bg-[#163822] text-[#34d399]",
  violet: "bg-[#3d2459] text-[#c084fc]",
};

const truncatePhaseSubLabel = (value, maxLength = 24) => {
  if (typeof value !== "string") return "";
  const trimmedValue = value.trim();
  if (!trimmedValue) return "";
  return trimmedValue.length > maxLength
    ? `${trimmedValue.slice(0, maxLength - 3).trimEnd()}...`
    : trimmedValue;
};

const truncatePhaseLabel = (value, maxLength = 28) => {
  if (typeof value !== "string") return "";
  const trimmedValue = value.trim();
  if (!trimmedValue) return "";
  return trimmedValue.length > maxLength
    ? `${trimmedValue.slice(0, maxLength - 3).trimEnd()}...`
    : trimmedValue;
};

const DashboardPanel = ({ className, children, ...props }) => (
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

const dashboardSkeletonClassName = "bg-white/[0.08]";

const DashboardSkeletonBlock = ({ className }) => (
  <Skeleton className={cn(dashboardSkeletonClassName, className)} />
);

const ClientDashboardLoadingSkeleton = ({ hero }) => (
  <main className="flex-1 pb-12">
    <section className="mt-14 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="text-[clamp(2rem,4vw,3rem)] font-semibold leading-[0.96] tracking-[-0.05em] text-white">
          {hero.greeting}, {hero.firstName}
        </h1>
        <p className="mt-1 text-sm text-[#94a3b8]">{hero.description}</p>
      </div>
      <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#64748b]">
        {hero.dateLabel}
      </p>
    </section>

        <section className="mt-12 grid auto-rows-fr grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <DashboardPanel
              key={`dashboard-metric-skeleton-${item}`}
              className={cn(
                "bg-accent p-3.5 sm:p-5",
                item >= 2 && "col-span-2 xl:col-span-1",
              )}
            >
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start justify-between gap-2 sm:gap-3">
                  <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                    <DashboardSkeletonBlock className="size-8 rounded-lg sm:size-9" />
                    <DashboardSkeletonBlock className="h-3 w-16 rounded-full sm:h-3.5 sm:w-24" />
                  </div>
                  <DashboardSkeletonBlock className="size-8 rounded-lg sm:h-6 sm:w-16 sm:rounded-full" />
                </div>
                <DashboardSkeletonBlock className="h-8 w-20 rounded-full sm:h-9 sm:w-28" />
              </div>
            </DashboardPanel>
          ))}
        </section>

        <section className="mt-14">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <DashboardSkeletonBlock className="h-8 w-44 rounded-full" />
              <DashboardSkeletonBlock className="size-3 rounded-full" />
            </div>
            <DashboardSkeletonBlock className="h-8 w-20 rounded-full" />
          </div>

          <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <ProjectCardSkeleton key={`dashboard-project-card-skeleton-${item}`} />
            ))}
          </div>
        </section>

        <section className="mt-14 grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="flex flex-col gap-7">
            <DashboardPanel className="overflow-hidden bg-accent">
              <div className="flex items-center justify-between border-b border-white/[0.05] px-6 py-5">
                <DashboardSkeletonBlock className="h-7 w-40 rounded-full" />
                <DashboardSkeletonBlock className="h-4 w-16 rounded-full" />
              </div>
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
            </DashboardPanel>
          </div>

          <div className="flex flex-col gap-7">
            <DashboardPanel className="bg-accent p-5">
              <DashboardSkeletonBlock className="h-7 w-36 rounded-full" />
              <div className="mt-5 space-y-3">
                <DashboardSkeletonBlock className="h-12 w-full rounded-[18px]" />
                <DashboardSkeletonBlock className="h-12 w-full rounded-[18px]" />
              </div>
            </DashboardPanel>

            <DashboardPanel className="overflow-hidden bg-accent px-6 pb-6 pt-7">
              <DashboardSkeletonBlock className="h-7 w-44 rounded-full" />
              <DashboardSkeletonBlock className="mt-3 h-4 w-64 rounded-full" />
              <div className="mt-8 space-y-6">
                {[0, 1].map((item) => (
                  <div key={`dashboard-chat-skeleton-${item}`} className="flex items-start gap-3.5">
                    <DashboardSkeletonBlock className="size-10 rounded-full" />
                    <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_96px] gap-x-2 gap-y-2">
                      <div className="space-y-2">
                        <DashboardSkeletonBlock className="h-5 w-36 rounded-full" />
                        <DashboardSkeletonBlock className="h-3 w-28 rounded-full" />
                        <DashboardSkeletonBlock className="h-3 w-44 rounded-full" />
                      </div>
                      <div className="row-span-2 flex flex-col justify-end gap-2">
                        <DashboardSkeletonBlock className="h-7 w-full rounded-[8px]" />
                        <DashboardSkeletonBlock className="h-7 w-full rounded-[8px]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <DashboardSkeletonBlock className="mt-9 h-4 w-40 rounded-full" />
            </DashboardPanel>
          </div>
        </section>

        <section className="mt-16">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.05em] text-white">
                Project Progress
              </h2>
              <p className="mt-2 text-sm text-[#94a3b8]">
                Track ongoing project phases once the initial project payment has been completed.
              </p>
            </div>
            <DashboardSkeletonBlock className="h-12 w-40 rounded-full" />
          </div>

          <DashboardPanel className="mt-3 overflow-hidden bg-accent p-6">
            <DashboardSkeletonBlock className="h-[360px] w-full rounded-[24px]" />
          </DashboardPanel>
        </section>
  </main>
);

const OverviewMetricCard = ({ item }) => {
  const Icon = metricIconMap[item.iconKey] || ClipboardList;
  const hasValueSwitch = Boolean(item.hasValueSwitch && item.alternateValue);
  const shouldSpanFullWidth = fullWidthMetricIds.has(item.id);
  const [showPrimaryValue, setShowPrimaryValue] = React.useState(
    item.defaultMode !== "alternate",
  );

  React.useEffect(() => {
    setShowPrimaryValue(item.defaultMode !== "alternate");
  }, [item.defaultMode, item.value, item.alternateValue]);

  const displayedTitle =
    hasValueSwitch && !showPrimaryValue
      ? item.alternateTitle || item.title
      : item.title;
  const displayedValue =
    hasValueSwitch && !showPrimaryValue
      ? item.alternateValue
      : item.value;
  const primaryToggleLabel = String(item.title || "primary value").toLowerCase();
  const alternateToggleLabel = String(
    item.alternateTitle || item.title || "alternate value",
  ).toLowerCase();

  return (
    <DashboardPanel
      className={cn(
        "group min-h-[96px] border border-transparent bg-accent p-3.5 transition-colors hover:border-primary/70 sm:min-h-[110px] sm:p-5",
        shouldSpanFullWidth && "col-span-2 xl:col-span-1",
      )}
    >
      <div className="flex flex-col gap-2.5 sm:gap-3">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex min-w-0 items-start gap-2 sm:items-center sm:gap-3">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-[#9ca3af] sm:size-9">
              <Icon className="size-3 sm:size-4" />
            </div>
            <p className="line-clamp-2 text-[9px] font-medium uppercase leading-[1.05rem] tracking-[0.08em] text-[#6b7280] sm:text-[11px] sm:leading-4 sm:tracking-[0.12em]">
              {displayedTitle}
            </p>
          </div>

          {hasValueSwitch ? (
            <button
              type="button"
              onClick={() => setShowPrimaryValue((current) => !current)}
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-[#9ca3af] transition-colors hover:bg-white/[0.12] hover:text-primary sm:size-9"
              aria-label={
                showPrimaryValue
                  ? `Show ${alternateToggleLabel}`
                  : `Show ${primaryToggleLabel}`
              }
              title={
                showPrimaryValue
                  ? `Switch to ${alternateToggleLabel}`
                  : `Switch to ${primaryToggleLabel}`
              }
            >
              <Repeat2 className="size-3 sm:size-4" />
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap items-end gap-x-1.5 gap-y-1 sm:gap-2">
          <p className="text-[1.35rem] font-semibold leading-none tracking-[-0.02em] text-white transition-colors group-hover:text-primary sm:text-[1.75rem]">
            {displayedValue}
          </p>
          {item.detail ? (
            <p className="text-[10px] leading-4 text-[#6b7280] sm:text-xs">{item.detail}</p>
          ) : null}
        </div>
      </div>
    </DashboardPanel>
  );
};

const DraftProposalsPanel = ({ draftProposalRows, onOpenQuickProject }) => (
  <DashboardPanel className="overflow-hidden bg-accent">
    <div className="px-4 py-4 sm:px-6 sm:py-5">
      <h2 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-white sm:text-[1.65rem]">
        Draft Proposals
      </h2>
    </div>

    {draftProposalRows.length === 0 ? (
      <div className="flex min-h-[240px] flex-col items-center justify-center px-5 py-10 text-center sm:min-h-[320px] sm:px-6 sm:py-12">
        <div className="flex size-14 items-center justify-center rounded-full bg-white/[0.06] text-[#94a3b8] sm:size-16">
          <ClipboardList className="size-6 sm:size-7" />
        </div>
        <p className="mt-6 text-base font-medium text-white">No draft proposals yet</p>
        <p className="mt-2 max-w-[320px] text-sm text-[#8f96a3]">
          Start a new proposal to build your project brief and invite freelancers.
        </p>
        <button
          type="button"
          onClick={onOpenQuickProject}
          className="mt-6 inline-flex min-w-[200px] items-center justify-center rounded-full bg-[#ffc107] px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#ffd54f] sm:min-w-0"
        >
          Create New Proposal
        </button>
      </div>
    ) : (
      draftProposalRows.map((item) => <DraftProposalRow key={item.id} item={item} />)
    )}
  </DashboardPanel>
);

const ProjectCarouselControls = ({
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
}) => (
  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={onPrevious}
      disabled={!canGoPrevious}
      aria-label="Show previous active projects"
      className="inline-flex size-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-[#94a3b8] transition-colors hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
    >
      <ChevronLeft className="size-4" />
    </button>

    <button
      type="button"
      onClick={onNext}
      disabled={!canGoNext}
      aria-label="Show next active projects"
      className="inline-flex size-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-[#94a3b8] transition-colors hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
    >
      <ChevronRight className="size-4" />
    </button>
  </div>
);

const ProjectRedirectCard = ({ item, className }) => (
  <DashboardPanel
    className={cn(
      "flex flex-col overflow-hidden bg-accent p-4 sm:p-5 xl:p-6",
      className,
    )}
  >
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] border border-white/[0.08] bg-white/[0.06] text-[#d4d4d8] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:h-8 sm:w-8">
          <item.Icon className="size-3.5 sm:size-4" strokeWidth={1.85} />
        </div>
        <span className="inline-flex h-7 items-center rounded-[8px] bg-white/[0.06] px-2.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[#23d18b] sm:h-8 sm:px-3 sm:text-[11px] sm:tracking-[0.22em]">
          {item.eyebrow}
        </span>
      </div>

      <h3 className="mt-5 text-[clamp(1.5rem,5vw,2.05rem)] font-semibold leading-[1.04] tracking-[-0.04em] text-white">
        {item.title}
      </h3>
      <p className="mt-3 max-w-[28ch] text-sm leading-6 text-[#8f96a3] line-clamp-3">
        {item.description}
      </p>

      <div className="mt-6 min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1 [scrollbar-color:rgba(255,255,255,0.16)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/[0.14]">
        {item.highlights.map((highlight) => (
          <div
            key={highlight}
            className="flex items-center gap-3 rounded-[14px] border border-white/[0.06] bg-white/[0.035] px-3.5 py-2.5 text-sm text-[#e5e7eb] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
          >
            <span aria-hidden="true" className="size-2 rounded-full bg-[#ffc107]" />
            <span className="line-clamp-1">{highlight}</span>
          </div>
        ))}
      </div>
    </div>

    <button
      type="button"
      onClick={item.onClick}
      className="mt-6 inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-[16px] bg-[#ffc107] px-5 py-3.5 text-sm font-semibold text-black transition-colors hover:bg-[#ffd54f]"
    >
      <span>{item.actionLabel}</span>
      <ChevronRight className="size-4" />
    </button>
  </DashboardPanel>
);

const ActivityRow = ({ item }) => {
  const Icon = activityIconMap[item.iconKey] || FolderKanban;

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
          <p className="text-xs leading-5 text-[#94a3b8] sm:truncate">{item.subtitle}</p>
        </div>
      </div>
      <span className="pl-12 text-xs text-[#64748b] sm:pl-13 lg:pl-0">{item.timeLabel}</span>
    </button>
  );
};

const DraftProposalRow = ({ item }) => (
  <div className="flex flex-col gap-4 border-b border-white/[0.05] px-4 py-4 last:border-b-0 sm:px-5 sm:py-5 md:flex-row md:items-center md:justify-between">
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-3">
        <p className="truncate text-lg font-medium text-white">{item.title}</p>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]",
            draftToneMap[item.tagTone] || draftToneMap.amber,
          )}
        >
          {item.tag}
        </span>
      </div>
      {item.updatedAt ? (
        <p className="mt-2 text-sm text-[#94a3b8]">Updated {item.updatedAt}</p>
      ) : null}
    </div>

    <div className="flex flex-wrap items-center gap-3 md:flex-nowrap md:gap-4">
      <span className="min-w-0 text-left text-base font-medium text-[#f1f5f9] sm:text-[1.1rem] md:min-w-[112px] md:text-right">
        {item.budget}
      </span>

      <Link
        to="/client/proposal?tab=draft"
        className="inline-flex min-w-[144px] items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#f2f2f2] md:min-w-0"
      >
        View Details
      </Link>

      <button
        type="button"
        onClick={item.onDelete}
        className="flex size-9 items-center justify-center rounded-full text-[#71809a] transition-colors hover:bg-white/[0.05] hover:text-white"
        aria-label={`Delete ${item.title}`}
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  </div>
);

const AcceptedFreelancerRow = ({ item }) => (
  <div className="flex items-start gap-3.5">
    <Avatar className="mt-0.5 size-10 shrink-0 border border-white/10 shadow-[0_10px_24px_rgba(0,0,0,0.2)]">
      <AvatarImage src={item.avatar} alt={item.name} />
      <AvatarFallback className="bg-[#1e293b] text-sm text-white">
        {item.initial}
      </AvatarFallback>
    </Avatar>

    <div className="grid min-w-0 flex-1 grid-cols-1 gap-y-3 sm:max-w-[320px] sm:grid-cols-[minmax(0,1fr)_96px] sm:grid-rows-[auto_auto] sm:gap-x-2 sm:gap-y-0">
      <div className="min-w-0 sm:col-start-1 sm:row-start-1">
        <p className="min-w-0 truncate text-[1.08rem] font-semibold leading-[1.05] tracking-[-0.03em] text-white">
          {item.name}
        </p>
        <p className="mt-0 min-w-0 truncate text-[12px] leading-none text-[#8a8a8a]">
          {item.role}
        </p>
      </div>

      <div className="flex w-full gap-2 sm:col-start-2 sm:row-span-2 sm:flex-col sm:justify-end sm:self-stretch">
        <button
          type="button"
          onClick={item.onView}
          className="inline-flex h-8 flex-1 items-center justify-center rounded-[8px] bg-white/[0.08] px-3 text-[12px] font-semibold text-white transition-colors hover:bg-white/[0.14] sm:h-7 sm:flex-none"
        >
          {item.viewLabel || "View"}
        </button>
        <button
          type="button"
          onClick={item.onMessage}
          className="inline-flex h-8 flex-1 items-center justify-center rounded-[8px] bg-white px-3 text-[11px] font-bold uppercase tracking-[0.01em] text-black transition-colors hover:bg-[#f2f2f2] sm:h-7 sm:flex-none"
        >
          MESSAGE
        </button>
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-[12px] leading-none text-[#8f8f8f] sm:col-start-1 sm:row-start-2 sm:flex-nowrap sm:items-end sm:self-end">
        <FolderKanban className="size-[12px] shrink-0 text-[#64748b]" />
        <span className="min-w-0 truncate text-white">{item.projectLabel}</span>
        <span className="shrink-0 text-[#64748b]">&bull;</span>
        <span className="truncate">{item.activityLabel}</span>
      </div>
    </div>
  </div>
);

const ProjectProgressLockedCard = ({ project, onViewProject }) => (
  <Card className="overflow-hidden rounded-[28px] border border-white/[0.06] bg-accent text-white shadow-none backdrop-blur-[10px]">
    <CardContent className="px-4 py-5 sm:px-6 sm:py-7">
      <div className="flex min-h-[280px] flex-col justify-between gap-6 md:gap-8 lg:min-h-[320px] lg:flex-row lg:items-center">
        <div className="max-w-2xl">
          <Badge
            variant="outline"
            className="border-[#5a4304] bg-[#312404] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#facc15] shadow-none"
          >
            Initial Payment Pending
          </Badge>
          <h3 className="mt-5 text-[clamp(1.8rem,3vw,2.5rem)] font-semibold tracking-[-0.04em] text-white">
            Progress unlocks after the first payment
          </h3>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#94a3b8]">
            {project?.lockedDescription ||
              "The project progress graph will appear after the initial project amount is paid."}
          </p>
        </div>

        <div className="w-full rounded-[24px] border border-white/[0.08] bg-[linear-gradient(135deg,rgba(255,193,7,0.16),rgba(255,255,255,0.04))] p-5 sm:max-w-[320px] sm:rounded-[28px] sm:p-6">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-black/20 text-[#facc15]">
            <CreditCard className="size-5" />
          </div>
          <p className="mt-5 text-sm font-medium uppercase tracking-[0.16em] text-[#fcd34d]">
            Next unlock
          </p>
          <p className="mt-3 text-[1.6rem] font-semibold tracking-[-0.04em] text-white">
            {project?.lockedPaymentLabel || "Initial project payment"}
          </p>
          {project?.lockedPaymentValue ? (
            <p className="mt-2 text-sm font-medium text-[#d4d4d4]">
              {project.lockedPaymentValue}
            </p>
          ) : null}
        </div>
      </div>
    </CardContent>

    <CardFooter className="flex flex-col items-start gap-4 border-t border-white/[0.05] px-4 py-5 text-[#d4d4d4] sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6">
      <Badge
        variant="outline"
        className="gap-3 border-0 bg-transparent px-0 py-0 text-xs font-medium text-[#d4d4d4] shadow-none sm:text-sm"
      >
        <span aria-hidden="true" className="size-3 rounded-full bg-[#facc15]" />
        Progress will appear after payment
      </Badge>
      <button
        type="button"
        onClick={() => onViewProject?.(project.id)}
        className="flex w-full items-center justify-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#171717] transition-colors hover:bg-white/90 sm:w-auto"
      >
        View Project
        <ChevronRight className="size-4 stroke-[2]" />
      </button>
    </CardFooter>
  </Card>
);

const projectProgressChartConfig = {
  progress: {
    label: "Progress",
    color: "#facc15",
  },
};

const formatWholePercentage = (value) => `${Math.round(Number(value) || 0)}%`;

const ProjectProgressTooltip = ({ active, payload }) => {
  const point = payload?.[0]?.payload;

  if (!active || !point) {
    return null;
  }

  const isTaskPoint = point.pointType === "task";
  const isPaymentPoint = point.pointType === "payment";
  const isStartPoint = point.pointType === "start";
  const eyebrow = isTaskPoint
    ? point.isCurrent
      ? "Current task"
      : "Completed task"
    : isPaymentPoint
      ? "Client payment paid"
    : isStartPoint
      ? "Phase start"
    : point.isCurrent
      ? "Current phase"
      : point.isCompleted
        ? "Completed phase"
        : "Upcoming phase";
  const detailLabel = isTaskPoint
    ? point.taskSequenceLabel || point.taskSummary
    : isPaymentPoint
      ? point.paymentAmountLabel || point.paymentSummary || "Client payment received"
      : isStartPoint
        ? point.startSummary || "Project begins here"
      : point.taskSummary;

  return (
    <div className="w-[min(72vw,196px)] rounded-[18px] border border-white/[0.08] bg-[#232323]/95 px-3 py-2.5 text-white shadow-[0_14px_30px_rgba(0,0,0,0.34)] backdrop-blur-md sm:min-w-[220px] sm:rounded-[20px] sm:px-4 sm:py-3 sm:shadow-[0_18px_40px_rgba(0,0,0,0.4)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8f96a3] sm:text-[11px] sm:tracking-[0.16em]">
        {eyebrow}
      </p>
      <p className="mt-1.5 text-sm font-semibold leading-[1.2] text-white sm:mt-2 sm:text-base">
        {isTaskPoint
          ? point.taskLabel
          : isPaymentPoint
            ? point.paymentLabel
            : isStartPoint
              ? point.startLabel || "Phase start"
              : point.phaseFullLabel}
      </p>
      <p className="mt-1 text-[11px] leading-4 text-[#94a3b8] sm:text-xs">
        {point.phaseFullLabel}
      </p>
      <div className="mt-2.5 flex flex-wrap items-end gap-x-1.5 gap-y-1 sm:mt-3 sm:gap-2">
        <span className="text-xl font-semibold leading-none text-[#facc15] sm:text-2xl">
          {formatWholePercentage(point.progressValue)}
        </span>
        <span className="pb-0.5 text-xs leading-4 text-[#cbd5e1] sm:pb-1 sm:text-sm">
          {detailLabel}
        </span>
      </div>
      {point.taskPreview && !isTaskPoint && !isPaymentPoint ? (
        <p className="mt-2.5 text-[11px] leading-4 text-[#94a3b8] sm:mt-3 sm:text-xs sm:leading-5">
          Focus: {point.taskPreview}
        </p>
      ) : null}
    </div>
  );
};

const ProjectProgressXAxisTick = ({ x, y, payload, phaseLookup }) => {
  const phase = phaseLookup.get(Number(payload.value));

  if (!phase) {
    return null;
  }

  const titleColor = phase.isCurrent
    ? "#f3f4f6"
    : phase.isCompleted
      ? "#d4d4d4"
      : "#8b95a5";
  const summaryColor = phase.isCurrent
    ? "#facc15"
    : phase.isCompleted
      ? "#94a3b8"
      : "#6b7280";

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={14} textAnchor="middle" fill={titleColor} fontSize="11" fontWeight="600">
        <tspan x="0">{phase.phaseLabel}</tspan>
        <tspan x="0" dy="20" fill={summaryColor} fontSize="10" fontWeight="500">
          {phase.taskSummary}
        </tspan>
      </text>
    </g>
  );
};

const ProjectProgressAreaDot = ({ cx, cy, payload, compact = false }) => {
  if (
    !Number.isFinite(payload?.progressValue) ||
    !Number.isFinite(cx) ||
    !Number.isFinite(cy)
  ) {
    return null;
  }

  const isTaskPoint = payload.pointType === "task";
  const isPaymentPoint = payload.pointType === "payment";
  const isStartPoint = payload.pointType === "start";
  const radius = isPaymentPoint
    ? compact ? 4.5 : 5
    : isStartPoint
      ? compact ? 3.5 : 4
    : isTaskPoint
      ? payload.isCurrent ? (compact ? 3.75 : 4.5) : compact ? 2.5 : 3.25
      : payload.isCurrent ? (compact ? 7 : 8) : compact ? 5 : 5.5;
  const fillColor = isPaymentPoint
    ? "transparent"
    : isStartPoint
      ? "#f3f4f6"
    : isTaskPoint
      ? payload.isCurrent
        ? "#facc15"
        : "rgba(250,204,21,0.88)"
      : payload.isCurrent
        ? "#facc15"
        : "#f3f4f6";
  const strokeColor = isPaymentPoint
    ? "#facc15"
    : isStartPoint
      ? "#232323"
    : isTaskPoint
      ? "#232323"
      : payload.isCurrent ? "#232323" : "rgba(250,204,21,0.55)";
  const strokeWidth = isPaymentPoint
    ? 2.25
    : isStartPoint
      ? 1.75
    : isTaskPoint
      ? payload.isCurrent ? 1.75 : 1.25
      : payload.isCurrent ? 3 : 2;

  return (
    <circle
      cx={cx}
      cy={cy}
      r={radius}
      fill={fillColor}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
    />
  );
};

const ProjectProgressChartCard = ({
  project,
  onViewProject,
}) => {
  const isMobile = useIsMobile();
  const chartStartX = isMobile ? -1 : -0.45;
  const paymentPointEpsilon = 0.003;
  const normalizedPhases = React.useMemo(() => {
    const sourcePhases = Array.isArray(project?.phases) ? project.phases : [];

    if (sourcePhases.length === 0) {
      return [{ label: "Phase 1", value: 0, subLabel: "Current phase" }];
    }

    return sourcePhases.map((phase, index) => {
      const numericValue = Number(phase?.value);
      const value = Number.isFinite(numericValue)
        ? Math.max(0, Math.min(100, numericValue))
        : 0;

      return {
        ...phase,
        label: phase?.label || `Phase ${index + 1}`,
        value,
        targetValue: Math.max(
          value,
          Number.isFinite(Number(phase?.targetValue))
            ? Math.max(0, Math.min(100, Number(phase.targetValue)))
            : value,
        ),
      };
    });
  }, [project?.phases]);

  const activePhaseIndex = Math.min(
    Number.isFinite(project?.currentPhaseIndex)
      ? project.currentPhaseIndex
      : project?.highlightIndex || 0,
    Math.max(normalizedPhases.length - 1, 0),
  );

  const { chartData, phaseLookup, chartMaxX } = React.useMemo(() => {
    const nextChartData = [
      {
        pointId: "progress-start",
        pointType: "start",
        phasePosition: chartStartX,
        progressValue: 0,
        phaseFullLabel: normalizedPhases[0]?.label || "Phase 1",
        startLabel: `${normalizedPhases[0]?.label || "Phase 1"} start`,
        startSummary: "Project begins here",
      },
    ];
    const nextPhaseLookup = new Map();
    const paymentCheckpointMap = new Map();
    let maxPhasePosition = Math.max(normalizedPhases.length - 1, 0);

    (Array.isArray(project?.paymentCheckpoints) ? project.paymentCheckpoints : []).forEach(
      (checkpoint) => {
        const gateKey = Math.max(0, Number(checkpoint?.dueAfterCompletedPhases || 0));
        const existing = paymentCheckpointMap.get(gateKey) || [];
        existing.push(checkpoint);
        paymentCheckpointMap.set(gateKey, existing);
      },
    );

    const appendPaymentPoints = ({
      gateKey,
      phaseLabel,
      fallbackProgressValue,
    }) => {
      const checkpoints = paymentCheckpointMap.get(gateKey) || [];
      checkpoints.forEach((checkpoint, checkpointIndex) => {
        const gateAnchorPosition = gateKey === 0 ? chartStartX : Math.max(gateKey - 1, 0);
        const phasePosition =
          gateAnchorPosition + (checkpointIndex > 0 ? checkpointIndex * paymentPointEpsilon : 0);

        nextChartData.push({
          pointId: checkpoint?.id || `payment-${gateKey}-${checkpointIndex}`,
          pointType: "payment",
          phasePosition,
          progressValue: Number.isFinite(Number(checkpoint?.progressValue))
            ? Number(checkpoint.progressValue)
            : fallbackProgressValue,
          phaseFullLabel: checkpoint?.phaseFullLabel || phaseLabel,
          paymentLabel: checkpoint?.label || `Client payment ${checkpointIndex + 1}`,
          paymentAmountLabel: checkpoint?.amountLabel || "",
          paymentSummary: checkpoint?.percentageLabel || "Client payment received",
          isCompleted: true,
          isCurrent: false,
        });

        maxPhasePosition = Math.max(maxPhasePosition, phasePosition);
      });
    };

    appendPaymentPoints({
      gateKey: 0,
      phaseLabel: "Before project start",
      fallbackProgressValue: 0,
    });

    normalizedPhases.forEach((phase, index) => {
      const steps = Array.isArray(phase?.steps) ? phase.steps : [];
      const totalTasks = steps.length;
      const completedSteps = steps.filter((step) => step?.state === "completed");
      const currentSteps = steps.filter(
        (step) => step?.state === "current" || step?.state === "in_progress",
      );
      const completedTasks = completedSteps.length;
      const currentTasks = currentSteps.length;
      const achievedTasks = Math.min(totalTasks, completedTasks + currentTasks);
      const previousPhase = nextPhaseLookup.get(index - 1);
      const previousProgress = index === 0 ? 0 : previousPhase?.targetValue ?? 0;
      const targetValue = Math.max(
        Number(phase?.targetValue ?? phase?.value ?? 0),
        previousProgress,
      );
      const rawProgressValue = Math.max(Number(phase?.value || 0), previousProgress);
      const taskDrivenProgress =
        totalTasks > 0
          ? previousProgress + ((targetValue - previousProgress) * achievedTasks) / totalTasks
          : rawProgressValue;
      const progressValue = index > activePhaseIndex
        ? null
        : index === activePhaseIndex
          ? Math.max(previousProgress, Math.min(targetValue, taskDrivenProgress))
          : targetValue;
      const displayedTasksDone = index === activePhaseIndex ? achievedTasks : completedTasks;
      const taskSummary =
        totalTasks > 0
          ? `${Math.min(displayedTasksDone, totalTasks)}/${totalTasks} tasks done`
          : truncatePhaseSubLabel(phase?.subLabel, 26) || "No tasks yet";
      const taskPreview =
        steps.find((step) => step?.state === "current" || step?.state === "in_progress")?.title ||
        steps.find((step) => step?.state === "pending")?.title ||
        "";
      const segmentStartX = index === 0 ? chartStartX : index - 1;
      const segmentWidth = index === 0 ? 0 - chartStartX : 1;
      const phaseTargetSpan = Math.max(targetValue - previousProgress, 0);
      const phaseRatio = phaseTargetSpan > 0 && Number.isFinite(progressValue)
        ? Math.min(Math.max((progressValue - previousProgress) / phaseTargetSpan, 0), 1)
        : 0;
      const phasePosition = index === activePhaseIndex
        ? segmentStartX + segmentWidth * phaseRatio
        : index;

      const chartPoint = {
        phaseKey: `phase-${index}`,
        phaseLabel: truncatePhaseLabel(phase?.label, 24) || `Phase ${index + 1}`,
        phaseFullLabel: phase?.label || `Phase ${index + 1}`,
        phaseIndex: index,
        phasePosition,
        progressValue,
        targetValue,
        totalTasks,
        completedTasks: Math.min(displayedTasksDone, totalTasks),
        currentTasks,
        taskSummary,
        taskPreview,
        pointType: "phase",
        isCompleted: index < activePhaseIndex,
        isCurrent: index === activePhaseIndex,
      };

      nextPhaseLookup.set(index, chartPoint);

      if (!Number.isFinite(progressValue)) {
        return;
      }

      const visibleSteps =
        index < activePhaseIndex
          ? completedSteps
          : [...completedSteps, ...currentSteps];
      const visibleSegmentWidth = Math.max(phasePosition - segmentStartX, 0);
      const taskSpan = Math.max(progressValue - previousProgress, 0);

      visibleSteps.forEach((step, stepIndex) => {
        const fraction = (stepIndex + 1) / (visibleSteps.length + 1);
        const taskSequence = Math.min(
          Number(step?.sequence || stepIndex + 1),
          Math.max(totalTasks, 1),
        );
        nextChartData.push({
          pointId: `${chartPoint.phaseKey}-task-${step?.id || stepIndex}`,
          pointType: "task",
          phaseKey: chartPoint.phaseKey,
          phaseIndex: index,
          phasePosition: segmentStartX + visibleSegmentWidth * fraction,
          phaseLabel: chartPoint.phaseLabel,
          phaseFullLabel: chartPoint.phaseFullLabel,
          taskLabel: step?.title || `Task ${stepIndex + 1}`,
          taskSequenceLabel:
            totalTasks > 0 ? `Task ${taskSequence} of ${totalTasks}` : `Task ${taskSequence}`,
          taskSummary:
            totalTasks > 0
              ? `${Math.min(taskSequence, totalTasks)}/${totalTasks} tasks done`
              : "",
          taskPreview: chartPoint.taskPreview,
          progressValue:
            taskSpan === 0
              ? progressValue
              : previousProgress + taskSpan * fraction,
          isCompleted: step?.state === "completed",
          isCurrent: step?.state === "current" || step?.state === "in_progress",
        });

        maxPhasePosition = Math.max(
          maxPhasePosition,
          segmentStartX + visibleSegmentWidth * fraction,
        );
      });

      nextChartData.push({
        ...chartPoint,
        pointId: chartPoint.phaseKey,
      });

      maxPhasePosition = Math.max(maxPhasePosition, phasePosition);
      appendPaymentPoints({
        gateKey: index + 1,
        phaseLabel: chartPoint.phaseFullLabel,
        fallbackProgressValue: targetValue,
      });
    });

    const pointTypeOrder = {
      start: 0,
      task: 1,
      phase: 2,
      payment: 3,
    };

    nextChartData.sort((leftPoint, rightPoint) => {
      if (leftPoint.phasePosition !== rightPoint.phasePosition) {
        return leftPoint.phasePosition - rightPoint.phasePosition;
      }

      return (pointTypeOrder[leftPoint.pointType] ?? 99) -
        (pointTypeOrder[rightPoint.pointType] ?? 99);
    });

    return {
      chartData: nextChartData,
      chartMaxX: maxPhasePosition,
      phaseLookup: nextPhaseLookup,
    };
  }, [
    activePhaseIndex,
    chartStartX,
    normalizedPhases,
    paymentPointEpsilon,
    project?.paymentCheckpoints,
  ]);

  const progressGradientId = React.useId().replace(/:/g, "");
  const progressFillId = `project-progress-fill-${progressGradientId}`;

  if (project?.isProgressLocked) {
    return <ProjectProgressLockedCard project={project} onViewProject={onViewProject} />;
  }

  return (
    <Card className="overflow-hidden rounded-[28px] border border-white/[0.06] bg-accent text-white shadow-none backdrop-blur-[10px]">
      <CardContent className="px-3 pb-2 pt-4 sm:px-6 sm:pb-3 sm:pt-5">
        <p className={cn("mb-3 text-[11px] font-medium text-[#8f96a3] lg:hidden", isMobile && "hidden")}>
          Swipe horizontally to view the full timeline.
        </p>
        <div className={cn(
          !isMobile && "overflow-x-auto pb-2 [scrollbar-color:rgba(255,255,255,0.16)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/[0.14]",
        )}>
          <div className={cn(!isMobile && "min-w-[720px] md:min-w-[860px] lg:min-w-0")}>
            <ChartContainer
              config={projectProgressChartConfig}
              className={cn(
                "w-full aspect-auto [&_.recharts-cartesian-axis-tick_text]:fill-[#8f96a3]",
                isMobile ? "h-[320px]" : "h-[328px] sm:h-[368px] lg:h-[410px]",
              )}
            >
              <AreaChart
                accessibilityLayer
                data={chartData}
                margin={{
                  top: 20,
                  right: isMobile ? 6 : 24,
                  left: isMobile ? 0 : 4,
                  bottom: isMobile ? 8 : 12,
                }}
              >
                <defs>
                  <linearGradient id={progressFillId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-progress)" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="var(--color-progress)" stopOpacity={0.06} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
                <XAxis
                  type="number"
                  dataKey="phasePosition"
                  domain={[chartStartX, Math.max(chartMaxX, normalizedPhases.length - 1, 0)]}
                  ticks={normalizedPhases.map((_, index) => index)}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  height={isMobile ? 14 : 58}
                  tickMargin={isMobile ? 0 : 14}
                  tick={isMobile
                    ? false
                    : (props) => (
                      <ProjectProgressXAxisTick
                        {...props}
                        phaseLookup={phaseLookup}
                      />
                    )}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 20, 40, 60, 80, 100]}
                  tickLine={false}
                  axisLine={false}
                  width={isMobile ? 38 : 56}
                  tickMargin={10}
                  tickFormatter={(value) => formatWholePercentage(value)}
                  tick={{ fill: "#a3a3a3", fontSize: isMobile ? 10 : 12 }}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ProjectProgressTooltip />}
                />
                <Area
                  dataKey="progressValue"
                  type="linear"
                  fill={`url(#${progressFillId})`}
                  fillOpacity={1}
                  connectNulls={false}
                  stroke="var(--color-progress)"
                  strokeWidth={4}
                  dot={<ProjectProgressAreaDot compact={isMobile} />}
                  activeDot={{
                    r: isMobile ? 7 : 9,
                    fill: "#facc15",
                    stroke: "#232323",
                    strokeWidth: isMobile ? 2.5 : 3,
                  }}
                />
              </AreaChart>
            </ChartContainer>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col items-start gap-4 border-t border-white/[0.05] px-4 py-5 text-[#d4d4d4] sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6">
        <Badge
          variant="outline"
          className="gap-3 border-0 bg-transparent px-0 py-0 text-xs font-medium text-[#d4d4d4] shadow-none sm:text-sm"
        >
          <span aria-hidden="true" className="size-3 rounded-full bg-[#facc15]" />
          Phase start, task, and payment checkpoints
        </Badge>
        <button
          type="button"
          onClick={() => onViewProject?.(project.id)}
          className="flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
        >
          View Project
          <ChevronRight className="size-4 stroke-[2]" />
        </button>
      </CardFooter>
    </Card>
  );
};

const ProjectProgressSection = ({
  progressProjects,
  onViewProject,
  onOpenQuickProject,
}) => {
  const projects = React.useMemo(
    () => (Array.isArray(progressProjects) ? progressProjects : []),
    [progressProjects],
  );
  const [activeProjectId, setActiveProjectId] = React.useState("");

  React.useEffect(() => {
    if (!projects.length) {
      setActiveProjectId("");
      return;
    }

    setActiveProjectId((currentProjectId) =>
      projects.some((project) => project.id === currentProjectId)
        ? currentProjectId
        : projects[0]?.id || "",
    );
  }, [projects]);

  const activeProject =
    projects.find((project) => project.id === activeProjectId) || projects[0];
  const triggerProjectLabel = activeProject?.label || "Projects";
  return (
    <section className="mt-14 sm:mt-16">
      <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-[clamp(1.9rem,8vw,3rem)] font-semibold tracking-[-0.05em] text-white">
            Project Progress
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#94a3b8]">
            Track ongoing project phases once the initial project payment has been completed.
          </p>
        </div>

        {projects.length > 0 ? (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-11 w-full items-center justify-between gap-3 rounded-full border border-white/[0.08] bg-accent px-4 text-sm font-semibold text-white transition-colors hover:border-white/[0.14] hover:bg-white/[0.03] sm:h-12 sm:px-5 md:min-w-[220px] md:w-auto"
                aria-label="Open projects menu"
              >
                <span className="max-w-[10rem] truncate">{triggerProjectLabel}</span>
                <ChevronDown className="size-4 text-[#8f96a3]" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={10}
              className="w-[min(100vw-2rem,280px)] rounded-[22px] border border-white/[0.08] bg-[#232323] p-2 text-white shadow-[0_24px_70px_-36px_rgba(0,0,0,0.95)]"
            >
              <DropdownMenuLabel className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8f96a3]">
                Select Project
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1 bg-white/[0.06]" />

              <DropdownMenuRadioGroup
                value={activeProjectId}
                onValueChange={setActiveProjectId}
              >
                {projects.map((project) => (
                  <DropdownMenuRadioItem
                    key={project.id}
                    value={project.id}
                    className="rounded-[16px] px-3 py-3 pl-3 text-white transition-colors hover:bg-white/[0.04] focus:bg-white/[0.06] focus:text-white data-[state=checked]:bg-white/[0.06] [&>span:first-child]:hidden"
                  >
                    <span className="truncate text-sm font-semibold text-white">
                      {project.label}
                    </span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      {projects.length > 0 ? (
        <div className="mt-3">
          <ProjectProgressChartCard project={activeProject} onViewProject={onViewProject} />
        </div>
      ) : (
        <DashboardPanel className="mt-3 min-h-[220px] p-5 sm:p-8">
          <div className="flex min-h-[140px] items-center justify-center text-center sm:min-h-[170px]">
            <div className="max-w-md">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.04] text-[#cbd5e1]">
                <FolderKanban className="size-6" />
              </div>
              <p className="mt-5 text-[1.35rem] font-semibold tracking-[-0.03em] text-white">
                No ongoing projects yet
              </p>
              <p className="mt-3 text-sm leading-6 text-[#94a3b8]">
                Only ongoing projects appear here after a freelancer is assigned and the
                initial payment is completed.
              </p>
              {typeof onOpenQuickProject === "function" ? (
                <button
                  type="button"
                  onClick={onOpenQuickProject}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#ffc107] px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#ffd54f] sm:w-auto"
                >
                  Start New Project
                </button>
              ) : null}
            </div>
          </div>
        </DashboardPanel>
      )}
    </section>
  );
};

const ClientDashboardShell = ({
  profile,
  metrics,
  showcaseItems,
  isProjectsLoading = false,
  recentActivities,
  hero,
  unreadCount,
  draftProposalRows = [],
  acceptedFreelancers = [],
  acceptedFreelancersCount = 0,
  progressProjects = [],
  onSiteNav,
  onDashboardNav,
  onOpenNotifications,
  onOpenProfile,
  onOpenQuickProject,
  onOpenViewProposals,
  onOpenViewProjects,
  onOpenMessages,
  onOpenHireFreelancer,
  onPayRunningProject,
  runningProjectProcessingId = null,
  onViewProject,
}) => {
  const shouldUseProjectCarousel = showcaseItems.length > 3;
  const activeProjectCardClassName = "w-full";
  const activeProjectRedirectCardClassName = "w-full md:min-h-[506px]";
  const [projectCarouselApi, setProjectCarouselApi] = React.useState(null);
  const [canGoToPreviousProjects, setCanGoToPreviousProjects] = React.useState(false);
  const [canGoToNextProjects, setCanGoToNextProjects] = React.useState(false);
  const projectRedirectCards = React.useMemo(() => {
    if (showcaseItems.length === 0 || shouldUseProjectCarousel) {
      return [];
    }

    const candidates = [
      typeof onOpenQuickProject === "function"
        ? {
            id: "start-project",
            Icon: Sparkles,
            eyebrow: "Project Pipeline",
            title: "Start another project",
            description:
              "Launch a fresh brief, define the scope, and keep your delivery pipeline active.",
            highlights: ["Create a new proposal", "Set budget and timeline", "Invite the right talent"],
            actionLabel: "Start New Project",
            onClick: onOpenQuickProject,
          }
        : null,
      typeof onOpenHireFreelancer === "function"
        ? {
            id: "browse-marketplace",
            Icon: Users,
            eyebrow: "Talent Marketplace",
            title: "Find your next specialist",
            description:
              "Browse verified freelancers and open the next engagement when you are ready.",
            highlights: ["Explore verified talent", "Compare specialists fast", "Add another active project"],
            actionLabel: "Browse Marketplace",
            onClick: onOpenHireFreelancer,
          }
        : null,
    ].filter(Boolean);

    return candidates.slice(0, Math.max(0, 3 - showcaseItems.length));
  }, [
    onOpenHireFreelancer,
    onOpenQuickProject,
    shouldUseProjectCarousel,
    showcaseItems.length,
  ]);

  React.useEffect(() => {
    if (!projectCarouselApi || !shouldUseProjectCarousel) {
      setCanGoToPreviousProjects(false);
      setCanGoToNextProjects(false);
      return undefined;
    }

    const syncProjectCarouselState = () => {
      setCanGoToPreviousProjects(projectCarouselApi.canScrollPrev());
      setCanGoToNextProjects(projectCarouselApi.canScrollNext());
    };

    syncProjectCarouselState();
    projectCarouselApi.on("select", syncProjectCarouselState);
    projectCarouselApi.on("reInit", syncProjectCarouselState);

    return () => {
      projectCarouselApi.off("select", syncProjectCarouselState);
      projectCarouselApi.off("reInit", syncProjectCarouselState);
    };
  }, [projectCarouselApi, shouldUseProjectCarousel]);

  return (
    <div className="min-h-screen bg-[#212121] text-[#f1f5f9]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1536px] flex-col px-4 sm:px-6 lg:px-[40px] xl:w-[85%] xl:max-w-none">
        <ClientWorkspaceHeader
          profile={profile}
          activeWorkspaceKey="dashboard"
          unreadCount={unreadCount}
          onSiteNav={onSiteNav}
          onWorkspaceNav={onDashboardNav}
          onOpenProfile={onOpenProfile}
          primaryActionLabel="New Proposal"
          primaryActionTo="/service"
          onOpenNotifications={onOpenNotifications}
        />

        {isProjectsLoading ? (
          <ClientDashboardLoadingSkeleton hero={hero} />
        ) : (
          <main className="flex-1 pb-12">
          <section className="mt-14 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-[clamp(2rem,4vw,3rem)] font-semibold leading-[0.96] tracking-[-0.05em] text-white">
                {hero.greeting}, {hero.firstName}
              </h1>
              <p className="mt-1 text-sm text-[#94a3b8]">{hero.description}</p>
            </div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#64748b]">
              {hero.dateLabel}
            </p>
          </section>

          <section className="mt-12 grid auto-rows-fr grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
            {metrics.map((item) => (
              <OverviewMetricCard key={item.id || item.title} item={item} />
            ))}
          </section>

          {!isProjectsLoading && showcaseItems.length === 0 ? (
            <section className="mt-14">
              <DraftProposalsPanel
                draftProposalRows={draftProposalRows}
                onOpenQuickProject={onOpenQuickProject}
              />
            </section>
          ) : null}

          <section className="mt-14">
          <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-[1.75rem] font-semibold tracking-[-0.02em] text-white">
                    Active Projects
                  </h2>
                  <span className="size-[15px] rounded-full bg-[#10b981]/10 p-[4.5px]">
                    <span className="block size-[6px] rounded-full bg-[#10b981]" />
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#94a3b8]">
                  Track your active deliveries, budgets, and freelancer progress at a glance.
                </p>
              </div>

              {shouldUseProjectCarousel ? (
                <ProjectCarouselControls
                  onPrevious={() => projectCarouselApi?.scrollPrev()}
                  onNext={() => projectCarouselApi?.scrollNext()}
                  canGoPrevious={canGoToPreviousProjects}
                  canGoNext={canGoToNextProjects}
                />
              ) : null}
            </div>

            {isProjectsLoading ? (
              <div className="grid gap-5 sm:gap-6 xl:gap-7 md:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2].map((item) => (
                  <ProjectCardSkeleton key={`active-project-skeleton-${item}`} />
                ))}
              </div>
            ) : showcaseItems.length > 0 ? (
              <>
                {shouldUseProjectCarousel ? (
                  <Carousel
                    setApi={setProjectCarouselApi}
                    opts={{
                      align: "start",
                      containScroll: "trimSnaps",
                      slidesToScroll: 1,
                      duration: 34,
                    }}
                    className="w-full"
                  >
                    <CarouselContent className="items-stretch [backface-visibility:hidden] [will-change:transform]">
                      {showcaseItems.map((item) => (
                        <CarouselItem
                          key={item.id}
                          className="basis-full md:basis-1/2 xl:basis-1/3"
                        >
                          <ProjectProposalCard
                            project={item}
                            onPay={onPayRunningProject}
                            isPaying={runningProjectProcessingId === item.id}
                            className="h-full w-full"
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                ) : (
                    <div className="grid items-start gap-5 sm:gap-6 xl:gap-7 md:grid-cols-2 xl:grid-cols-3">
                      {showcaseItems.map((item) => (
                        <ProjectProposalCard
                          key={item.id}
                          project={item}
                          onPay={onPayRunningProject}
                          isPaying={runningProjectProcessingId === item.id}
                          className={activeProjectCardClassName}
                        />
                      ))}
                      {projectRedirectCards.map((item) => (
                        <ProjectRedirectCard
                          key={item.id}
                          item={item}
                          className={activeProjectRedirectCardClassName}
                        />
                      ))}
                  </div>
                )}
              </>
            ) : (
              <DashboardPanel className="flex min-h-[220px] items-center justify-center p-8 text-center">
                <div className="max-w-md">
                  <p className="text-[1.35rem] font-semibold tracking-[-0.03em] text-white">
                    No active projects yet
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[#94a3b8]">
                    Projects will appear here once a freelancer is assigned and work has started.
                  </p>
                </div>
              </DashboardPanel>
            )}
          </section>

          <section className="mt-14 grid items-start gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-7 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="flex flex-col gap-5 sm:gap-6 xl:gap-7">
              {!isProjectsLoading && showcaseItems.length > 0 ? (
                <DraftProposalsPanel
                  draftProposalRows={draftProposalRows}
                  onOpenQuickProject={onOpenQuickProject}
                />
              ) : null}
              <DashboardPanel className="overflow-hidden bg-accent">
                <div className="flex items-center justify-between gap-3 border-b border-white/[0.05] px-4 py-4 sm:px-6 sm:py-5">
                  <h2 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-white sm:text-[1.65rem]">
                    Recent Activity
                  </h2>
                  <button
                    type="button"
                    onClick={onOpenViewProjects}
                    className="ml-auto shrink-0 text-xs font-bold uppercase tracking-[0.18em] text-[#ffc107] transition-colors hover:text-[#ffd54f]"
                  >
                    View All
                  </button>
                </div>
                <div>
                  {recentActivities.map((item) => (
                    <ActivityRow key={item.id} item={item} />
                  ))}
                </div>
              </DashboardPanel>
            </div>

            <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-1 xl:gap-7">
              <DashboardPanel className="bg-accent p-4 sm:p-5">
                <h2 className="text-[1.4rem] font-semibold tracking-[-0.04em] text-white sm:text-[1.55rem]">
                  Action Center
                </h2>

                <div className="mt-5 space-y-3">
                  <button
                    type="button"
                    onClick={onOpenViewProposals}
                    className="w-full rounded-[18px] bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:text-base"
                  >
                    View Proposals
                  </button>
                  <button
                    type="button"
                    onClick={onOpenViewProjects}
                    className="w-full rounded-[18px] bg-white px-4 py-3 text-sm font-semibold text-[#171717] transition-colors hover:bg-white/90 sm:text-base"
                  >
                    View Projects
                  </button>
                </div>
              </DashboardPanel>

              <DashboardPanel className="w-full overflow-hidden rounded-[20px] bg-accent px-4 pb-5 pt-5 sm:px-6 sm:pb-6 sm:pt-7">
                <h2 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-white sm:text-[1.6rem]">
                  Active Project Chats
                </h2>
                <p className="mt-2 text-[14px] leading-5 text-[#8f8f8f]">
                  Quick shortcuts to message freelancers on active projects.
                </p>

                {acceptedFreelancers.length === 0 ? (
                  <div className="flex min-h-[220px] flex-col items-center justify-center px-4 py-8 text-center sm:min-h-[260px] sm:py-10">
                    <div className="flex size-12 items-center justify-center rounded-full bg-white/[0.06] text-[#94a3b8] sm:size-14">
                      <MessageSquareText className="size-6" />
                    </div>
                    <p className="mt-5 text-sm text-white">No active project chats yet</p>
                    <p className="mt-2 max-w-[220px] text-xs text-[#8f8f8f]">
                      Chat shortcuts appear here once a project becomes active and messaging is unlocked.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mt-6 space-y-6 sm:mt-8 sm:space-y-[30px]">
                      {acceptedFreelancers.map((item) => (
                        <AcceptedFreelancerRow key={item.id} item={item} />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={onOpenMessages}
                      className="mt-9 flex w-full items-center justify-center gap-2 text-[13px] font-bold uppercase tracking-[0.16em] text-[#8f8f8f] transition-colors hover:text-white"
                    >
                      <span>
                        Open Messages ({acceptedFreelancersCount || acceptedFreelancers.length})
                      </span>
                      <ChevronRight className="size-[15px] stroke-[1.75]" />
                    </button>
                  </>
                )}
              </DashboardPanel>
            </div>
          </section>

          <ProjectProgressSection
            progressProjects={progressProjects}
            onViewProject={onViewProject || onOpenViewProjects}
            onOpenQuickProject={onOpenQuickProject}
          />
          </main>
        )}

        <ClientDashboardFooter variant="workspace" />
      </div>
    </div>
  );
};

export default ClientDashboardShell;
