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
import { cn } from "@/shared/lib/utils";

const metricIconMap = {
  proposals: ClipboardList,
  freelancers: Users,
  tasks: ShieldAlert,
  projects: FolderKanban,
  payments: CreditCard,
};

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
        <h1 className="text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.05em] text-white">
          {hero.greeting}, {hero.firstName}
        </h1>
        <p className="mt-2 text-sm text-[#94a3b8]">{hero.description}</p>
      </div>
      <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#64748b]">
        {hero.dateLabel}
      </p>
    </section>

        <section className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <DashboardPanel key={`dashboard-metric-skeleton-${item}`} className="bg-accent p-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <DashboardSkeletonBlock className="size-9 rounded-lg" />
                    <DashboardSkeletonBlock className="h-3.5 w-24 rounded-full" />
                  </div>
                  <DashboardSkeletonBlock className="h-6 w-16 rounded-full" />
                </div>
                <DashboardSkeletonBlock className="h-9 w-28 rounded-full" />
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

  return (
    <DashboardPanel className="group min-h-[110px] border border-transparent bg-accent p-5 transition-colors hover:border-primary/70">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-[#9ca3af]">
              <Icon className="size-4" />
            </div>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#6b7280]">
              {displayedTitle}
            </p>
          </div>

          {hasValueSwitch ? (
            <button
              type="button"
              onClick={() => setShowPrimaryValue((current) => !current)}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-[#9ca3af] transition-colors hover:bg-white/[0.12] hover:text-primary"
              aria-label={
                showPrimaryValue
                  ? "Show pending payments"
                  : "Show total paid"
              }
              title={
                showPrimaryValue
                  ? "Switch to pending payments"
                  : "Switch to total paid"
              }
            >
              <Repeat2 className="size-4" />
            </button>
          ) : null}
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-[1.75rem] font-semibold leading-none tracking-[-0.02em] text-white transition-colors group-hover:text-primary">
            {displayedValue}
          </p>
          {item.detail ? (
            <p className="text-xs text-[#6b7280]">{item.detail}</p>
          ) : null}
        </div>
      </div>
    </DashboardPanel>
  );
};

const DraftProposalsPanel = ({ draftProposalRows, onOpenQuickProject }) => (
  <DashboardPanel className="overflow-hidden bg-accent">
    <div className="px-6 py-5">
      <h2 className="text-[1.65rem] font-semibold tracking-[-0.04em] text-white">
        Draft Proposals
      </h2>
    </div>

    {draftProposalRows.length === 0 ? (
      <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-white/[0.06] text-[#94a3b8]">
          <ClipboardList className="size-7" />
        </div>
        <p className="mt-6 text-base font-medium text-white">No draft proposals yet</p>
        <p className="mt-2 max-w-[320px] text-sm text-[#8f96a3]">
          Start a new proposal to build your project brief and invite freelancers.
        </p>
        <button
          type="button"
          onClick={onOpenQuickProject}
          className="mt-6 rounded-full bg-[#ffc107] px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#ffd54f]"
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

const ProjectRedirectCard = ({ item }) => (
  <DashboardPanel
    className="self-start flex flex-col overflow-hidden bg-accent p-6"
  >
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3">
        <div className="inline-flex size-11 shrink-0 items-center justify-center rounded-[18px] border border-white/[0.08] bg-white/[0.06] text-[#d4d4d8] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <item.Icon className="size-[18px]" strokeWidth={1.85} />
        </div>
        <span className="inline-flex rounded-[8px] bg-white/[0.06] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#23d18b]">
          {item.eyebrow}
        </span>
      </div>

      <h3 className="mt-5 text-[clamp(1.7rem,2vw,2.05rem)] font-semibold leading-[1.04] tracking-[-0.04em] text-white">
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
      className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-white/[0.02]"
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
          <p className="truncate text-sm font-semibold text-white">{item.title}</p>
          <p className="truncate text-xs text-[#94a3b8]">{item.subtitle}</p>
        </div>
      </div>
      <span className="shrink-0 text-xs text-[#64748b]">{item.timeLabel}</span>
    </button>
  );
};

const DraftProposalRow = ({ item }) => (
  <div className="flex flex-col gap-4 border-b border-white/[0.05] px-5 py-5 last:border-b-0 md:flex-row md:items-center md:justify-between">
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

    <div className="flex items-center gap-3 md:gap-4">
      <span className="min-w-[112px] text-right text-[1.1rem] font-medium text-[#f1f5f9]">
        {item.budget}
      </span>

      <Link
        to="/client/proposal?tab=draft"
        className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#f2f2f2]"
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

    <div className="grid min-w-0 max-w-[320px] flex-1 grid-cols-[minmax(0,1fr)_96px] grid-rows-[auto_auto] gap-x-2 gap-y-0">
      <div className="col-start-1 row-start-1 min-w-0">
        <p className="min-w-0 truncate text-[1.08rem] font-semibold leading-[1.05] tracking-[-0.03em] text-white">
          {item.name}
        </p>
        <p className="mt-0 min-w-0 truncate text-[12px] leading-none text-[#8a8a8a]">
          {item.role}
        </p>
      </div>

      <div className="col-start-2 row-span-2 flex w-full flex-col justify-end gap-2 self-stretch">
        <button
          type="button"
          onClick={item.onView}
          className="inline-flex h-7 w-full items-center justify-center rounded-[8px] bg-white/[0.08] px-3 text-[12px] font-semibold text-white transition-colors hover:bg-white/[0.14]"
        >
          {item.viewLabel || "View"}
        </button>
        <button
          type="button"
          onClick={item.onMessage}
          className="inline-flex h-7 w-full items-center justify-center rounded-[8px] bg-white px-3 text-[11px] font-bold uppercase tracking-[0.01em] text-black transition-colors hover:bg-[#f2f2f2]"
        >
          MESSAGE
        </button>
      </div>

      <div className="col-start-1 row-start-2 flex min-w-0 items-end gap-1.5 self-end text-[12px] leading-none text-[#8f8f8f]">
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
    <CardContent className="px-4 py-6 sm:px-6 sm:py-7">
      <div className="flex min-h-[320px] flex-col justify-between gap-8 lg:flex-row lg:items-center">
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

        <div className="w-full max-w-[320px] rounded-[28px] border border-white/[0.08] bg-[linear-gradient(135deg,rgba(255,193,7,0.16),rgba(255,255,255,0.04))] p-6">
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

    <CardFooter className="flex items-center justify-between gap-3 border-t border-white/[0.05] px-4 py-5 text-[#d4d4d4] sm:px-6">
      <Badge
        variant="outline"
        className="gap-3 border-0 bg-transparent px-0 py-0 text-sm font-medium text-[#d4d4d4] shadow-none"
      >
        <span aria-hidden="true" className="size-3 rounded-full bg-[#facc15]" />
        Progress will appear after payment
      </Badge>
      <button
        type="button"
        onClick={() => onViewProject?.(project.id)}
        className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#171717] transition-colors hover:bg-white/90"
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

  if (!active || !point || point.pointType === "start") {
    return null;
  }

  const isTaskPoint = point.pointType === "task";
  const eyebrow = isTaskPoint
    ? point.isCurrent
      ? "Current task"
      : "Completed task"
    : point.isCurrent
      ? "Current phase"
      : point.isCompleted
        ? "Completed phase"
        : "Upcoming phase";

  return (
    <div className="min-w-[220px] rounded-[20px] border border-white/[0.08] bg-[#232323]/95 px-4 py-3 text-white shadow-[0_18px_40px_rgba(0,0,0,0.4)] backdrop-blur-md">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8f96a3]">
        {eyebrow}
      </p>
      <p className="mt-2 text-base font-semibold text-white">
        {isTaskPoint ? point.taskLabel : point.phaseFullLabel}
      </p>
      <p className="mt-1 text-xs text-[#94a3b8]">{point.phaseFullLabel}</p>
      <div className="mt-3 flex items-end gap-2">
        <span className="text-2xl font-semibold text-[#facc15]">
          {formatWholePercentage(point.progressValue)}
        </span>
        <span className="pb-1 text-sm text-[#cbd5e1]">{point.taskSummary}</span>
      </div>
      {point.taskPreview && !isTaskPoint ? (
        <p className="mt-3 text-xs leading-5 text-[#94a3b8]">Focus: {point.taskPreview}</p>
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

const ProjectProgressAreaDot = ({ cx, cy, payload }) => {
  if (
    payload?.pointType === "start" ||
    !Number.isFinite(payload?.progressValue) ||
    !Number.isFinite(cx) ||
    !Number.isFinite(cy)
  ) {
    return null;
  }

  const isTaskPoint = payload.pointType === "task";
  const radius = isTaskPoint ? (payload.isCurrent ? 4.5 : 3.25) : payload.isCurrent ? 8 : 5.5;
  const fillColor = isTaskPoint
    ? payload.isCurrent
      ? "#facc15"
      : "rgba(250,204,21,0.88)"
    : payload.isCurrent
      ? "#facc15"
      : "#f3f4f6";
  const strokeColor = isTaskPoint ? "#232323" : payload.isCurrent ? "#232323" : "rgba(250,204,21,0.55)";
  const strokeWidth = isTaskPoint ? (payload.isCurrent ? 1.75 : 1.25) : payload.isCurrent ? 3 : 2;

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
  const chartStartX = -0.45;
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
      };
    });
  }, [project?.phases]);

  const activePhaseIndex = Math.min(
    Number.isFinite(project?.currentPhaseIndex)
      ? project.currentPhaseIndex
      : project?.highlightIndex || 0,
    Math.max(normalizedPhases.length - 1, 0),
  );

  const { chartData, phaseLookup } = React.useMemo(() => {
    const nextChartData = [
      {
        pointId: "progress-start",
        pointType: "start",
        phasePosition: chartStartX,
        progressValue: 0,
      },
    ];
    const nextPhaseLookup = new Map();

    normalizedPhases.forEach((phase, index) => {
      const steps = Array.isArray(phase?.steps) ? phase.steps : [];
      const totalTasks = steps.length;
      const completedSteps = steps.filter((step) => step?.state === "completed");
      const currentSteps = steps.filter(
        (step) => step?.state === "current" || step?.state === "in_progress",
      );
      const completedTasks = completedSteps.length;
      const currentTasks = currentSteps.length;
      const previousPhase = nextPhaseLookup.get(index - 1);
      const previousProgress = index === 0 ? 0 : previousPhase?.progressValue ?? 0;
      const progressValue =
        index > activePhaseIndex ? null : Math.max(Number(phase?.value || 0), previousProgress);
      const taskSummary =
        totalTasks > 0
          ? `${Math.min(completedTasks, totalTasks)}/${totalTasks} tasks done`
          : truncatePhaseSubLabel(phase?.subLabel, 26) || "No tasks yet";
      const taskPreview =
        steps.find((step) => step?.state === "current" || step?.state === "in_progress")?.title ||
        steps.find((step) => step?.state === "pending")?.title ||
        "";

      const chartPoint = {
        phaseKey: `phase-${index}`,
        phaseLabel: truncatePhaseLabel(phase?.label, 24) || `Phase ${index + 1}`,
        phaseFullLabel: phase?.label || `Phase ${index + 1}`,
        progressValue,
        totalTasks,
        completedTasks: Math.min(completedTasks, totalTasks),
        currentTasks,
        taskSummary,
        taskPreview,
        pointType: "phase",
        phasePosition: index,
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
      const segmentStartX = index === 0 ? chartStartX : index - 1;
      const segmentWidth = index === 0 ? 0 - chartStartX : 1;
      const taskSpan = Math.max(progressValue - previousProgress, 0);

      visibleSteps.forEach((step, stepIndex) => {
        const fraction = (stepIndex + 1) / (visibleSteps.length + 1);
        nextChartData.push({
          pointId: `${chartPoint.phaseKey}-task-${step?.id || stepIndex}`,
          pointType: "task",
          phaseKey: chartPoint.phaseKey,
          phaseIndex: index,
          phasePosition: segmentStartX + segmentWidth * fraction,
          phaseLabel: chartPoint.phaseLabel,
          phaseFullLabel: chartPoint.phaseFullLabel,
          taskLabel: step?.title || `Task ${stepIndex + 1}`,
          taskSummary: chartPoint.taskSummary,
          taskPreview: chartPoint.taskPreview,
          progressValue:
            taskSpan === 0
              ? progressValue
              : previousProgress + taskSpan * fraction,
          isCompleted: step?.state === "completed",
          isCurrent: step?.state === "current" || step?.state === "in_progress",
        });
      });

      nextChartData.push({
        ...chartPoint,
        pointId: chartPoint.phaseKey,
      });
    });

    return {
      chartData: nextChartData,
      phaseLookup: nextPhaseLookup,
    };
  }, [activePhaseIndex, chartStartX, normalizedPhases]);

  const progressGradientId = React.useId().replace(/:/g, "");
  const progressFillId = `project-progress-fill-${progressGradientId}`;

  if (project?.isProgressLocked) {
    return <ProjectProgressLockedCard project={project} onViewProject={onViewProject} />;
  }

  return (
    <Card className="overflow-hidden rounded-[28px] border border-white/[0.06] bg-accent text-white shadow-none backdrop-blur-[10px]">
      <CardContent className="px-4 py-5 sm:px-6">
        <ChartContainer
          config={projectProgressChartConfig}
          className="h-[430px] w-full aspect-auto [&_.recharts-cartesian-axis-tick_text]:fill-[#8f96a3]"
        >
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
              right: 24,
              left: 4,
              bottom: 24,
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
              domain={[chartStartX, Math.max(normalizedPhases.length - 1, 0)]}
              ticks={normalizedPhases.map((_, index) => index)}
              tickLine={false}
              axisLine={false}
              interval={0}
              height={72}
              tickMargin={18}
              tick={(props) => (
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
              width={56}
              tickMargin={10}
              tickFormatter={(value) => formatWholePercentage(value)}
              tick={{ fill: "#a3a3a3", fontSize: 12 }}
            />
            <ChartTooltip
              cursor={false}
              content={<ProjectProgressTooltip />}
            />
            <Area
              dataKey="progressValue"
              type="natural"
              fill={`url(#${progressFillId})`}
              fillOpacity={1}
              connectNulls={false}
              stroke="var(--color-progress)"
              strokeWidth={4}
              dot={<ProjectProgressAreaDot />}
              activeDot={{ r: 9, fill: "#facc15", stroke: "#232323", strokeWidth: 3 }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-3 border-t border-white/[0.05] px-4 py-5 text-[#d4d4d4] sm:px-6">
        <Badge
          variant="outline"
          className="gap-3 border-0 bg-transparent px-0 py-0 text-sm font-medium text-[#d4d4d4] shadow-none"
        >
          <span aria-hidden="true" className="size-3 rounded-full bg-[#facc15]" />
          Task checkpoints
        </Badge>
        <button
          type="button"
          onClick={() => onViewProject?.(project.id)}
          className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
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

        {projects.length > 0 ? (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-12 w-full items-center justify-between gap-3 rounded-full border border-white/[0.08] bg-accent px-5 text-sm font-semibold text-white transition-colors hover:border-white/[0.14] hover:bg-white/[0.03] sm:w-auto"
                aria-label="Open projects menu"
              >
                <span className="max-w-[10rem] truncate">{triggerProjectLabel}</span>
                <ChevronDown className="size-4 text-[#8f96a3]" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={10}
              className="w-[280px] rounded-[22px] border border-white/[0.08] bg-[#232323] p-2 text-white shadow-[0_24px_70px_-36px_rgba(0,0,0,0.95)]"
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
                  className="mt-6 rounded-full bg-[#ffc107] px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#ffd54f]"
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
              <h1 className="text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.05em] text-white">
                {hero.greeting}, {hero.firstName}
              </h1>
              <p className="mt-2 text-sm text-[#94a3b8]">{hero.description}</p>
            </div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#64748b]">
              {hero.dateLabel}
            </p>
          </section>

          <section className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
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
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-[1.75rem] font-semibold tracking-[-0.02em] text-white">
                  Active Projects
                </h2>
                <span className="size-[15px] rounded-full bg-[#10b981]/10 p-[4.5px]">
                  <span className="block size-[6px] rounded-full bg-[#10b981]" />
                </span>
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
              <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
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
                    <CarouselContent className="items-start [backface-visibility:hidden] [will-change:transform]">
                      {showcaseItems.map((item) => (
                        <CarouselItem
                          key={item.id}
                          className="md:basis-1/2 xl:basis-1/3"
                        >
                          <ProjectProposalCard
                            project={item}
                            onPay={onPayRunningProject}
                            isPaying={runningProjectProcessingId === item.id}
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                ) : (
                    <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
                      {showcaseItems.map((item) => (
                        <div key={item.id} className="self-start">
                          <ProjectProposalCard
                            project={item}
                            onPay={onPayRunningProject}
                          isPaying={runningProjectProcessingId === item.id}
                        />
                      </div>
                    ))}
                    {projectRedirectCards.map((item) => (
                      <ProjectRedirectCard key={item.id} item={item} />
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

          <section className="mt-14 grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="flex flex-col gap-7">
              {!isProjectsLoading && showcaseItems.length > 0 ? (
                <DraftProposalsPanel
                  draftProposalRows={draftProposalRows}
                  onOpenQuickProject={onOpenQuickProject}
                />
              ) : null}
              <DashboardPanel className="overflow-hidden bg-accent">
                <div className="flex items-center justify-between border-b border-white/[0.05] px-6 py-5">
                  <h2 className="text-[1.65rem] font-semibold tracking-[-0.04em] text-white">
                    Recent Activity
                  </h2>
                  <button
                    type="button"
                    onClick={onOpenViewProjects}
                    className="text-xs font-bold uppercase tracking-[0.18em] text-[#ffc107] transition-colors hover:text-[#ffd54f]"
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

            <div className="flex flex-col gap-7">
              <DashboardPanel className="bg-accent p-5">
                <h2 className="text-[1.55rem] font-semibold tracking-[-0.04em] text-white">
                  Action Center
                </h2>

                <div className="mt-5 space-y-3">
                  <button
                    type="button"
                    onClick={onOpenViewProposals}
                    className="w-full rounded-[18px] bg-primary px-4 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    View Proposals
                  </button>
                  <button
                    type="button"
                    onClick={onOpenViewProjects}
                    className="w-full rounded-[18px] bg-white px-4 py-3 text-base font-semibold text-[#171717] transition-colors hover:bg-white/90"
                  >
                    View Projects
                  </button>
                </div>
              </DashboardPanel>

              <DashboardPanel className="w-full overflow-hidden rounded-[20px] bg-accent px-6 pb-6 pt-7">
                <h2 className="text-[1.6rem] font-semibold tracking-[-0.04em] text-white">
                  Active Project Chats
                </h2>
                <p className="mt-2 text-[14px] leading-5 text-[#8f8f8f]">
                  Quick shortcuts to message freelancers on active projects.
                </p>

                {acceptedFreelancers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                    <div className="flex size-14 items-center justify-center rounded-full bg-white/[0.06] text-[#94a3b8]">
                      <MessageSquareText className="size-6" />
                    </div>
                    <p className="mt-5 text-sm text-white">No active project chats yet</p>
                    <p className="mt-2 max-w-[220px] text-xs text-[#8f8f8f]">
                      Chat shortcuts appear here once a project becomes active and messaging is unlocked.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mt-8 space-y-[30px]">
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
