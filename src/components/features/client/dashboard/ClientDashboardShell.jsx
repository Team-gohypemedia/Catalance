"use client";

import React from "react";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import BriefcaseBusiness from "lucide-react/dist/esm/icons/briefcase-business";
import CalendarDays from "lucide-react/dist/esm/icons/calendar-days";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import ClipboardList from "lucide-react/dist/esm/icons/clipboard-list";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import FolderKanban from "lucide-react/dist/esm/icons/folder-kanban";
import MessageSquareText from "lucide-react/dist/esm/icons/message-square-text";
import Plus from "lucide-react/dist/esm/icons/plus";
import Repeat2 from "lucide-react/dist/esm/icons/repeat-2";
import ShieldAlert from "lucide-react/dist/esm/icons/shield-alert";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import Users from "lucide-react/dist/esm/icons/users";
import Wallet from "lucide-react/dist/esm/icons/wallet";
import { useNavigate } from "react-router-dom";
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  completed: CheckCircle2,
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

const MOBILE_RECENT_ACTIVITY_PREVIEW_COUNT = 2;

const draftProposalSurfaceToneClassName =
  "border border-white/[0.06] bg-card shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]";

const draftProposalDetailBlockClassName =
  `flex min-w-0 flex-col justify-between rounded-[14px] ${draftProposalSurfaceToneClassName} px-4 pt-4 pb-5 min-h-[90px]`;

const draftProposalActionButtonClassName =
  "inline-flex h-11 w-full items-center justify-center whitespace-nowrap rounded-[10px] px-4 text-sm font-semibold transition-colors";

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

const dashboardMetricSkeletonItems = [
  { id: "active-projects", hasValueSwitch: false },
  { id: "completed-projects", hasValueSwitch: false },
  { id: "pending-approvals", hasValueSwitch: false },
  { id: "payments-summary", hasValueSwitch: true },
];

const OverviewMetricCardSkeleton = ({ item }) => {
  const shouldSpanFullWidth = fullWidthMetricIds.has(item.id);

  return (
    <DashboardPanel
      className={cn(
        "group relative min-h-[136px] border border-transparent bg-card px-3.5 py-4 sm:min-h-[110px] sm:p-5",
        shouldSpanFullWidth && "col-span-2 xl:col-span-1",
      )}
    >
      <div className="flex h-full flex-col items-center justify-center text-center sm:hidden">
        {item.hasValueSwitch ? (
          <div className="flex w-full items-center justify-between">
            <span className="size-10 shrink-0" aria-hidden="true" />
            <DashboardSkeletonBlock className="size-10 rounded-[16px]" />
            <DashboardSkeletonBlock className="size-10 rounded-[16px]" />
          </div>
        ) : (
          <DashboardSkeletonBlock className="size-10 rounded-[16px]" />
        )}
        <DashboardSkeletonBlock className="mt-4 h-8 w-16 rounded-full" />
        <DashboardSkeletonBlock className="mt-3 h-3 w-24 rounded-full" />
      </div>

      <div className="hidden h-full flex-col gap-2.5 sm:flex sm:gap-3">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <DashboardSkeletonBlock className="size-9 shrink-0 rounded-lg" />
            <DashboardSkeletonBlock className="h-4 w-28 rounded-full" />
          </div>
          {item.hasValueSwitch ? (
            <DashboardSkeletonBlock className="size-9 shrink-0 rounded-lg" />
          ) : null}
        </div>

        <div className="mt-auto flex flex-wrap items-end gap-x-1.5 gap-y-1 sm:gap-2">
          <DashboardSkeletonBlock className="h-8 w-16 rounded-full" />
        </div>
      </div>
    </DashboardPanel>
  );
};

const ClientDashboardLoadingSkeleton = ({ hero }) => (
  <main className="flex-1 pb-12">
    <section className="mt-14 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground lg:hidden">
          {hero.dateLabel}
        </p>
        <h1 className="text-[clamp(2rem,4vw,3rem)] font-semibold leading-[0.96] tracking-[-0.05em] text-white">
          {hero.greeting}, {hero.firstName}
        </h1>
        {hero.description ? (
          <p className="mt-2 text-sm text-muted-foreground sm:mt-1">{hero.description}</p>
        ) : null}
      </div>
      <p className="hidden text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground lg:block">
        {hero.dateLabel}
      </p>
    </section>

    <section className="mt-12 grid auto-rows-fr grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
      {dashboardMetricSkeletonItems.map((item) => (
        <OverviewMetricCardSkeleton
          key={`dashboard-metric-skeleton-${item.id}`}
          item={item}
        />
      ))}
    </section>

    <section className="mt-14">
      <div className="mb-4 flex items-center justify-between gap-4 sm:mb-5">
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
        <DashboardPanel className="overflow-hidden bg-card">
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
        <DashboardPanel className="overflow-hidden bg-card px-6 pb-6 pt-7">
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
  const navigate = useNavigate();
  const Icon = metricIconMap[item.iconKey] || ClipboardList;
  const hasValueSwitch = Boolean(item.hasValueSwitch && item.alternateValue);
  const shouldSpanFullWidth = fullWidthMetricIds.has(item.id);
  const isInteractive = Boolean(item.to || item.onClick);
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
  const renderSwitchButton = (className, iconClassName) => (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        setShowPrimaryValue((current) => !current);
      }}
      onKeyDown={(event) => {
        event.stopPropagation();
      }}
      className={className}
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
      <Repeat2 className={iconClassName} />
    </button>
  );
  const handleCardActivation = React.useCallback(() => {
    if (typeof item.onClick === "function") {
      item.onClick();
      return;
    }

    if (item.to) {
      navigate(item.to);
    }
  }, [item, navigate]);
  const handleCardKeyDown = React.useCallback(
    (event) => {
      if (!isInteractive) return;

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleCardActivation();
      }
    },
    [handleCardActivation, isInteractive],
  );

  return (
    <DashboardPanel
      role={isInteractive ? "link" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? handleCardActivation : undefined}
      onKeyDown={isInteractive ? handleCardKeyDown : undefined}
      aria-label={
        isInteractive ? `Open ${String(displayedTitle || item.title).toLowerCase()}` : undefined
      }
      className={cn(
        "group relative min-h-[136px] border border-transparent bg-card px-3.5 py-4 transition-colors sm:min-h-[110px] sm:p-5",
        isInteractive
          ? "cursor-pointer hover:border-primary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          : "hover:border-primary/70",
        shouldSpanFullWidth && "col-span-2 xl:col-span-1",
      )}
    >
      <div className="flex h-full flex-col items-center justify-center text-center sm:hidden">
        {hasValueSwitch ? (
          <div className="flex w-full items-center justify-between">
            <span className="size-10 shrink-0 sm:size-14" aria-hidden="true" />
            <div className="flex size-10 shrink-0 items-center justify-center rounded-[16px] bg-white/[0.06] text-muted-foreground/75 sm:size-14 sm:rounded-[18px]">
              <Icon className="size-[18px] text-muted-foreground/75 sm:size-[22px]" />
            </div>
            {renderSwitchButton(
              "inline-flex size-10 shrink-0 items-center justify-center rounded-[16px] bg-white/[0.06] text-muted-foreground/75 transition-colors hover:bg-white/[0.12] hover:text-primary",
              "size-4 text-muted-foreground/75",
            )}
          </div>
        ) : (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-[16px] bg-white/[0.06] text-muted-foreground/75">
            <Icon className="size-[18px] text-muted-foreground/75" />
          </div>
        )}
        <p className="mt-4 text-[2rem] font-semibold leading-none tracking-[-0.05em] text-white transition-colors group-hover:text-primary">
          {displayedValue}
        </p>
        <p className="mt-3 text-center text-[8px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {displayedTitle}
        </p>
        {item.detail ? (
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.detail}</p>
        ) : null}
      </div>
      <div className="hidden h-full flex-col gap-2.5 sm:flex sm:gap-3">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-muted-foreground/75">
              <Icon className="size-4 text-muted-foreground/75" />
            </div>
            <p className="line-clamp-2 text-[11px] font-medium uppercase leading-4 tracking-[0.12em] text-muted-foreground">
              {displayedTitle}
            </p>
          </div>
          {hasValueSwitch
            ? renderSwitchButton(
              "inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-muted-foreground/75 transition-colors hover:bg-white/[0.12] hover:text-primary",
              "size-4 text-muted-foreground/75",
            )
            : null}
        </div>
        <div className="flex flex-wrap items-end gap-x-1.5 gap-y-1 sm:gap-2">
          <p className="text-[1.75rem] font-semibold leading-none tracking-[-0.02em] text-white transition-colors group-hover:text-primary">
            {displayedValue}
          </p>
          {item.detail ? (
            <p className="text-xs leading-4 text-muted-foreground">{item.detail}</p>
          ) : null}
        </div>
      </div>
    </DashboardPanel>
  );
};

const DraftProposalCard = ({ item }) => (
  <article className="flex h-auto w-full max-w-full min-w-0 flex-col overflow-x-clip overflow-y-hidden rounded-[28px] border border-white/[0.06] bg-card p-4 transition-transform duration-200 hover:-translate-y-1 sm:p-5 xl:p-6">
    <DraftProposalRow item={item} />
  </article>
);

const DraftProposalListPanel = ({ draftProposalRows }) => (
  <DashboardPanel className="overflow-hidden bg-card">
    <div className="divide-y divide-white/[0.06]">
      {draftProposalRows.map((item) => (
        <div key={item.id} className="px-4 py-5 sm:px-6 sm:py-6">
          <DraftProposalRow item={item} />
        </div>
      ))}
    </div>
  </DashboardPanel>
);

const DraftProposalsSection = ({ draftProposalRows, onOpenQuickProject, className = "" }) => {
  const isMobile = useIsMobile();
  const shouldUseDraftProposalCarousel = isMobile && draftProposalRows.length > 1;
  const [draftProposalCarouselApi, setDraftProposalCarouselApi] = React.useState(null);
  const [canGoToPreviousDraftProposal, setCanGoToPreviousDraftProposal] = React.useState(false);
  const [canGoToNextDraftProposal, setCanGoToNextDraftProposal] = React.useState(false);
  const [draftProposalSnapCount, setDraftProposalSnapCount] = React.useState(0);
  const [activeDraftProposalSnap, setActiveDraftProposalSnap] = React.useState(0);

  React.useEffect(() => {
    if (!draftProposalCarouselApi || !shouldUseDraftProposalCarousel) {
      setCanGoToPreviousDraftProposal(false);
      setCanGoToNextDraftProposal(false);
      setDraftProposalSnapCount(0);
      setActiveDraftProposalSnap(0);
      return undefined;
    }

    const syncDraftProposalCarouselState = () => {
      setCanGoToPreviousDraftProposal(draftProposalCarouselApi.canScrollPrev());
      setCanGoToNextDraftProposal(draftProposalCarouselApi.canScrollNext());
      setDraftProposalSnapCount(draftProposalCarouselApi.scrollSnapList().length);
      setActiveDraftProposalSnap(draftProposalCarouselApi.selectedScrollSnap());
    };

    syncDraftProposalCarouselState();
    draftProposalCarouselApi.on("select", syncDraftProposalCarouselState);
    draftProposalCarouselApi.on("reInit", syncDraftProposalCarouselState);

    return () => {
      draftProposalCarouselApi.off("select", syncDraftProposalCarouselState);
      draftProposalCarouselApi.off("reInit", syncDraftProposalCarouselState);
    };
  }, [draftProposalCarouselApi, shouldUseDraftProposalCarousel]);

  return (
    <section className={cn("w-full min-w-0", className)}>
      <div className="mb-4 flex items-center justify-between gap-4 sm:mb-5">
        <div className="min-w-0">
          <h2 className="text-[1.75rem] font-semibold tracking-[-0.02em] text-white">
            Drafted Proposals
          </h2>
        </div>

        {shouldUseDraftProposalCarousel ? (
          <ProjectCarouselControls
            onPrevious={() => draftProposalCarouselApi?.scrollPrev()}
            onNext={() => draftProposalCarouselApi?.scrollNext()}
            canGoPrevious={canGoToPreviousDraftProposal}
            canGoNext={canGoToNextDraftProposal}
            previousLabel="Show previous draft proposal"
            nextLabel="Show next draft proposal"
          />
        ) : null}
      </div>

      {draftProposalRows.length === 0 ? (
        <DashboardPanel className="overflow-hidden bg-card">
          <div className="flex min-h-[240px] flex-col items-center justify-center px-5 py-10 text-center sm:min-h-[320px] sm:px-6 sm:py-12">
            <div className="flex size-14 items-center justify-center rounded-full bg-white/[0.06] text-[#94a3b8] sm:size-16">
              <ClipboardList className="size-6 sm:size-7" />
            </div>
            <p className="mt-6 text-base font-medium text-white">No draft proposals yet</p>
            <p className="mt-2 max-w-[320px] text-sm text-muted-foreground">
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
        </DashboardPanel>
      ) : shouldUseDraftProposalCarousel ? (
        <div className="w-full min-w-0">
          <Carousel
            setApi={setDraftProposalCarouselApi}
            opts={{
              align: "start",
              containScroll: "trimSnaps",
              slidesToScroll: 1,
              duration: 34,
            }}
            className="w-full"
          >
            <CarouselContent className="ml-0 items-start gap-5 [backface-visibility:hidden] [will-change:transform] sm:gap-6 xl:gap-7">
              {draftProposalRows.map((item) => (
                <CarouselItem
                  key={item.id}
                  className="basis-full pl-[2px] pr-[2px] pt-1"
                >
                  <DraftProposalCard item={item} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          <ProjectCarouselDots
            count={draftProposalSnapCount}
            activeIndex={activeDraftProposalSnap}
            onSelect={(index) => draftProposalCarouselApi?.scrollTo(index)}
            ariaLabel="Draft proposals carousel pagination"
            getDotLabel={(index) => `Go to draft proposal ${index + 1}`}
          />
        </div>
      ) : isMobile ? (
        <DraftProposalCard item={draftProposalRows[0]} />
      ) : (
        <DraftProposalListPanel draftProposalRows={draftProposalRows} />
      )}
    </section>
  );
};

const ProjectCarouselControls = ({
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  previousLabel = "Show previous active projects",
  nextLabel = "Show next active projects",
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

const ProjectCarouselDots = ({
  count,
  activeIndex,
  onSelect,
  ariaLabel = "Active projects carousel pagination",
  getDotLabel,
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
            key={`active-project-dot-${index}`}
            type="button"
            onClick={() => onSelect(index)}
            aria-label={typeof getDotLabel === "function" ? getDotLabel(index) : `Go to active projects slide ${index + 1}`}
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

const ProjectRedirectCard = ({ item, className }) => {
  const isStartProjectCard = item.id === "start-project";
  const isBrowseMarketplaceCard = item.id === "browse-marketplace";

  if (isStartProjectCard || isBrowseMarketplaceCard) {
    const heading = isStartProjectCard ? "Create New Proposal" : item.title;
    const ctaLabel = isStartProjectCard
      ? "START NEW PROJECT"
      : String(item.actionLabel || "Browse Marketplace").toUpperCase();

    return (
      <DashboardPanel
        className={cn(
          "flex min-h-[320px] flex-col justify-between overflow-hidden bg-card p-4 sm:p-5 xl:p-6",
          className,
        )}
      >
        <div className="flex flex-1 flex-col items-center text-center">
          <h3 className="text-[clamp(1.5rem,5vw,2.15rem)] font-semibold tracking-[-0.04em] text-white">
            {heading}
          </h3>

          <div className="flex w-full flex-1 items-center justify-center">
            <button
              type="button"
              aria-label={isStartProjectCard ? "Create new proposal" : "Browse marketplace"}
              onClick={item.onClick}
              className="inline-flex h-[104px] w-[104px] items-center justify-center rounded-[14px] border border-primary/30 bg-primary/20 text-primary transition-colors hover:bg-primary/28"
            >
              {isStartProjectCard ? (
                <Plus className="size-10" strokeWidth={2.6} />
              ) : (
                <Users className="size-10" strokeWidth={2} />
              )}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={item.onClick}
          className="inline-flex h-[58px] w-full shrink-0 items-center justify-center rounded-[14px] bg-[#f5cd05] px-6 text-[1.02rem] font-bold uppercase tracking-[0.04em] text-black transition-colors hover:bg-[#ffdd4f]"
        >
          {ctaLabel}
        </button>
      </DashboardPanel>
    );
  }

  return (
    <DashboardPanel
      className={cn(
        "flex flex-col overflow-hidden bg-card p-4 sm:p-5 xl:p-6",
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
};

const ActivityRow = ({ item, compact = false }) => {
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
          <span className="mt-3 block text-xs text-muted-foreground">{item.timeLabel}</span>
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
          <p className="text-xs leading-5 text-muted-foreground sm:truncate">{item.subtitle}</p>
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
};

const RecentActivitySection = ({
  recentActivities,
  onOpenViewProjects,
  onOpenNotifications,
}) => {
  const isMobile = useIsMobile();
  const [showAllRecentActivities, setShowAllRecentActivities] = React.useState(false);

  React.useEffect(() => {
    if (!isMobile) {
      setShowAllRecentActivities(false);
    }
  }, [isMobile]);

  const hasOverflow = recentActivities.length > MOBILE_RECENT_ACTIVITY_PREVIEW_COUNT;
  const visibleActivities =
    isMobile && !showAllRecentActivities
      ? recentActivities.slice(0, MOBILE_RECENT_ACTIVITY_PREVIEW_COUNT)
      : recentActivities;
  const remainingActivityCount = Math.max(
    0,
    recentActivities.length - MOBILE_RECENT_ACTIVITY_PREVIEW_COUNT,
  );

  return (
    <section className="w-full min-w-0">
      <div className="mb-4 flex items-center justify-between gap-4 sm:mb-5">
        <h2 className="text-[1.55rem] font-semibold tracking-[-0.04em] text-white sm:text-[1.65rem]">
          Recent Activity
        </h2>
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
      </div>

      <DashboardPanel className="overflow-hidden bg-card">
        {recentActivities.length === 0 ? (
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
            {recentActivities.map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </DashboardPanel>
    </section>
  );
};

const DraftProposalRow = ({ item }) => (
  <div className="grid w-full min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end">
    <div className="min-w-0 w-full">
      <p className="min-w-0 truncate text-[1.4rem] font-semibold tracking-[-0.04em] text-white sm:text-[1.55rem]">
        {item.title}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
        <div className={draftProposalDetailBlockClassName}>
          <p className="text-[0.76rem] uppercase tracking-[0.16em] text-muted-foreground">
            Service
          </p>
          <p className="mt-3 break-words text-[1.1rem] font-semibold tracking-[-0.02em] text-white">
            {item.tag}
          </p>
        </div>

        <div className={draftProposalDetailBlockClassName}>
          <p className="text-[0.76rem] uppercase tracking-[0.16em] text-muted-foreground">
            Budget
          </p>
          <p className="mt-3 text-[1.1rem] font-semibold tracking-[-0.02em] text-white">
            {item.budget}
          </p>
        </div>
      </div>
    </div>

    <div className="flex w-full flex-col gap-2.5 lg:h-[76px] lg:items-stretch lg:gap-2">
      <button
        type="button"
        onClick={item.onSend}
        className={cn(
          draftProposalActionButtonClassName,
          "bg-[#ffc107] text-black hover:bg-[#ffd54f] lg:h-auto lg:flex-1",
        )}
      >
        Send Proposal
      </button>

      <div className="grid grid-cols-[minmax(0,1fr)_44px] gap-2.5 lg:h-auto lg:flex-1 lg:gap-2">
        <button
          type="button"
          onClick={item.onView}
          className={cn(
            draftProposalActionButtonClassName,
            `${draftProposalSurfaceToneClassName} text-white hover:bg-white/[0.05] lg:h-full`,
          )}
        >
          View Details
        </button>

        <button
          type="button"
          onClick={item.onDelete}
          className={cn(
            draftProposalActionButtonClassName,
            `${draftProposalSurfaceToneClassName} px-0 text-muted-foreground hover:bg-white/[0.05] hover:text-white lg:h-full`,
          )}
          aria-label={`Delete ${item.title}`}
        >
          <Trash2 className="size-4 text-current" />
        </button>
      </div>
    </div>
  </div>
);

const AcceptedFreelancerRow = ({ item, onOpenMessages }) => {
  const handleMessageClick = item.onMessage || onOpenMessages;

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
          <FolderKanban className="size-[12px] shrink-0 text-[#7a7f89]" />
          <span className="min-w-0 truncate">{item.projectLabel}</span>
          <span className="shrink-0 text-[#7a7f89]">&bull;</span>
          <span className="truncate">{item.activityLabel}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleMessageClick}
        className="inline-flex h-10 min-w-[94px] shrink-0 items-center justify-center rounded-[8px] bg-white px-4 text-[13px] font-medium uppercase tracking-[0.01em] text-black transition-colors hover:bg-[#f2f2f2]"
      >
        MESSAGE
      </button>
    </div>
  );
};

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

const projectProgressSeriesPalette = [
  { color: "#ffd400" },
  { color: "#7e70e8" },
  { color: "#f3a2cb" },
  { color: "#37d39a" },
  { color: "#6ea8ff" },
  { color: "#ff9d57" },
];

const projectProgressCurveTemplates = [
  [0, 0.08, 0.3, 0.52, 0.74, 1],
  [0, 0.5, 0.24, 0.42, 0.62, 0.76],
  [0, 0.14, 0.11, 0.3, 0.6, 0.82],
  [0, 0.16, 0.34, 0.55, 0.73, 0.94],
  [0, 0.32, 0.54, 0.66, 0.79, 0.91],
  [0, 0.11, 0.27, 0.49, 0.71, 0.88],
];

const projectProgressFilterPresets = {
  weekly: {
    label: "Weekly",
    offsets: [-6, -4, -2, 0, 2, 4, 6],
  },
  monthly: {
    label: "Monthly",
    offsets: [-21, -17, -14, -10, -6, 0, 6, 14],
  },
  custom: {
    label: "Custom",
  },
};

const projectProgressFullDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const projectProgressShortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const clampProjectProgressValue = (value, minimum, maximum) =>
  Math.min(Math.max(value, minimum), maximum);

const addDaysToProjectProgressDate = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const formatProjectProgressFullDate = (date) => projectProgressFullDateFormatter.format(date);

const formatProjectProgressShortDate = (date) => projectProgressShortDateFormatter.format(date);

const formatProjectProgressStageValue = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "phase-1";

  const roundedValue = Math.round(numericValue);
  return Math.abs(numericValue - roundedValue) < 0.05
    ? `phase-${roundedValue}`
    : `phase-${numericValue.toFixed(1)}`;
};

const buildProjectProgressTimelineFromOffsets = (todayDate, offsets) =>
  offsets.map((offset) => {
    const date = addDaysToProjectProgressDate(todayDate, offset);
    return {
      label: formatProjectProgressShortDate(date),
      fullLabel: formatProjectProgressFullDate(date),
      isToday: offset === 0,
    };
  });

const normalizeProjectProgressDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const buildProjectProgressCustomTimeline = (todayDate, customRange) => {
  const normalizedStart = normalizeProjectProgressDate(customRange?.from);
  const normalizedEnd = normalizeProjectProgressDate(customRange?.to);

  if (!normalizedStart || !normalizedEnd) {
    return buildProjectProgressTimelineFromOffsets(
      todayDate,
      projectProgressFilterPresets.monthly.offsets,
    );
  }

  const startTime = Math.min(normalizedStart.getTime(), normalizedEnd.getTime());
  const endTime = Math.max(normalizedStart.getTime(), normalizedEnd.getTime());
  const totalDays = Math.max(1, Math.round((endTime - startTime) / (1000 * 60 * 60 * 24)));
  const tickCount = Math.min(totalDays + 1, 8);
  const todayTime = normalizeProjectProgressDate(todayDate)?.getTime() ?? 0;
  let todayIndex = -1;
  let closestTodayDistance = Number.POSITIVE_INFINITY;

  const timeline = Array.from({ length: tickCount }, (_, index) => {
    const ratio = tickCount === 1 ? 0 : index / Math.max(tickCount - 1, 1);
    const nextTime = startTime + (endTime - startTime) * ratio;
    const date = normalizeProjectProgressDate(new Date(nextTime));
    const distance = Math.abs((date?.getTime() ?? 0) - todayTime);

    if (todayTime >= startTime && todayTime <= endTime && distance < closestTodayDistance) {
      todayIndex = index;
      closestTodayDistance = distance;
    }

    return {
      label: formatProjectProgressShortDate(date),
      fullLabel: formatProjectProgressFullDate(date),
      isToday: false,
    };
  });

  if (todayIndex >= 0) {
    timeline[todayIndex] = {
      ...timeline[todayIndex],
      isToday: true,
    };
  }

  return timeline;
};

const buildProjectProgressTimeline = ({ todayDate, filterMode, customRange }) => {
  if (filterMode === "custom") {
    return buildProjectProgressCustomTimeline(todayDate, customRange);
  }

  const preset = projectProgressFilterPresets[filterMode] || projectProgressFilterPresets.monthly;
  return buildProjectProgressTimelineFromOffsets(todayDate, preset.offsets);
};

const formatProjectProgressTriggerLabel = ({ filterMode, customRange, todayDate }) => {
  if (filterMode === "weekly") {
    const startDate = addDaysToProjectProgressDate(todayDate, -6);
    return `${formatProjectProgressShortDate(startDate)} - ${formatProjectProgressShortDate(todayDate)}`;
  }

  if (filterMode === "monthly") {
    const startDate = addDaysToProjectProgressDate(todayDate, -29);
    return `${formatProjectProgressShortDate(startDate)} - ${formatProjectProgressShortDate(todayDate)}`;
  }

  const normalizedStart = normalizeProjectProgressDate(customRange?.from);
  const normalizedEnd = normalizeProjectProgressDate(customRange?.to);

  if (normalizedStart && normalizedEnd) {
    return `${formatProjectProgressShortDate(normalizedStart)} - ${formatProjectProgressShortDate(normalizedEnd)}`;
  }

  return "Custom Range";
};

const resolveProjectProgressCurveValue = (curveTemplate, ratio) => {
  if (!Array.isArray(curveTemplate) || curveTemplate.length === 0) {
    return ratio;
  }

  if (curveTemplate.length === 1 || ratio <= 0) {
    return curveTemplate[0];
  }

  if (ratio >= 1) {
    return curveTemplate[curveTemplate.length - 1];
  }

  const scaledIndex = ratio * (curveTemplate.length - 1);
  const lowerIndex = Math.floor(scaledIndex);
  const upperIndex = Math.min(curveTemplate.length - 1, Math.ceil(scaledIndex));
  const interpolationProgress = scaledIndex - lowerIndex;
  const lowerValue = curveTemplate[lowerIndex];
  const upperValue = curveTemplate[upperIndex];

  return lowerValue + (upperValue - lowerValue) * interpolationProgress;
};

const resolveProjectProgressStageLevel = (project) => {
  const phases = Array.isArray(project?.phases) ? project.phases : [];
  const phaseCount = Math.max(phases.length, 4);
  const currentProgress = clampProjectProgressValue(
    Number(project?.progressValue || 0),
    0,
    100,
  );

  if (currentProgress >= 100) {
    return phaseCount;
  }

  const activePhaseIndex = clampProjectProgressValue(
    Number.isFinite(Number(project?.currentPhaseIndex))
      ? Number(project.currentPhaseIndex)
      : Number.isFinite(Number(project?.highlightIndex))
        ? Number(project.highlightIndex)
        : 0,
    0,
    Math.max(phaseCount - 1, 0),
  );
  const previousTarget = activePhaseIndex > 0
    ? clampProjectProgressValue(
      Number(
        phases[activePhaseIndex - 1]?.targetValue ??
        phases[activePhaseIndex - 1]?.value ??
        0,
      ),
      0,
      100,
    )
    : 0;
  const activeTarget = Math.max(
    previousTarget + 1,
    clampProjectProgressValue(
      Number(phases[activePhaseIndex]?.targetValue ?? phases[activePhaseIndex]?.value ?? 100),
      0,
      100,
    ),
    currentProgress,
  );
  const progressWithinPhase = activeTarget > previousTarget
    ? clampProjectProgressValue(
      (currentProgress - previousTarget) / (activeTarget - previousTarget),
      0,
      1,
    )
    : activePhaseIndex >= phaseCount - 1
      ? 1
      : 0;

  return clampProjectProgressValue(
    activePhaseIndex + 1 + progressWithinPhase,
    1,
    phaseCount,
  );
};

const resolveProjectProgressVisibleMarkerTypes = (project, pointCount, lastVisibleIndex) => {
  const markers = Array.from({ length: pointCount }, () => null);

  if (pointCount <= 0 || lastVisibleIndex <= 0) {
    return markers;
  }

  const phases = Array.isArray(project?.phases) ? project.phases : [];
  const phaseCount = Math.max(phases.length, 4);
  const activePhaseIndex = clampProjectProgressValue(
    Number.isFinite(Number(project?.currentPhaseIndex))
      ? Number(project.currentPhaseIndex)
      : Number.isFinite(Number(project?.highlightIndex))
        ? Number(project.highlightIndex)
        : 0,
    0,
    Math.max(phaseCount - 1, 0),
  );
  const visiblePhaseCount = Math.max(1, Math.min(phaseCount, activePhaseIndex + 1));
  const phaseIndexes = new Set();

  for (let phaseNumber = 1; phaseNumber <= visiblePhaseCount; phaseNumber += 1) {
    const mappedIndex = Math.max(
      1,
      Math.min(lastVisibleIndex, Math.round((phaseNumber / visiblePhaseCount) * lastVisibleIndex)),
    );
    phaseIndexes.add(mappedIndex);
  }

  const visibleTaskCount = phases
    .slice(0, visiblePhaseCount)
    .reduce((count, phase, phaseIndex) => {
      const steps = Array.isArray(phase?.steps) ? phase.steps : [];
      const visibleSteps = steps.filter((step) => {
        const stepState = String(step?.state || "").toLowerCase();
        if (phaseIndex < activePhaseIndex) {
          return stepState !== "pending";
        }

        return (
          stepState === "completed" || stepState === "current" || stepState === "in_progress"
        );
      });

      return count + visibleSteps.length;
    }, 0);

  const availableTaskIndexes = [];
  for (let index = 1; index < lastVisibleIndex; index += 1) {
    if (!phaseIndexes.has(index)) {
      availableTaskIndexes.push(index);
    }
  }

  const renderedTaskCount = Math.min(visibleTaskCount, availableTaskIndexes.length);

  for (let taskNumber = 0; taskNumber < renderedTaskCount; taskNumber += 1) {
    const slotIndex = Math.round(
      ((taskNumber + 1) * (availableTaskIndexes.length + 1)) / (renderedTaskCount + 1),
    ) - 1;
    const markerIndex = availableTaskIndexes[
      Math.max(0, Math.min(slotIndex, availableTaskIndexes.length - 1))
    ];

    markers[markerIndex] = "task";
  }

  phaseIndexes.forEach((index) => {
    markers[index] = "phase";
  });

  return markers;
};

const ProjectProgressTodayLabel = ({ viewBox }) => {
  const x = Number(viewBox?.x);
  const y = Number(viewBox?.y);

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={-24} y={8} width={48} height={20} rx={4} fill="#ffd400" />
      <text
        x={0}
        y={22}
        textAnchor="middle"
        fill="#171717"
        fontSize="10"
        fontWeight="700"
      >
        TODAY
      </text>
    </g>
  );
};

const ProjectProgressHighlightDot = ({ cx, cy, payload }) => {
  if (!payload?.isToday || !Number.isFinite(cx) || !Number.isFinite(cy)) {
    return null;
  }

  return (
    <g>
      <circle cx={cx} cy={cy} r={18} fill="rgba(255,212,0,0.1)" />
      <circle cx={cx} cy={cy} r={12} fill="rgba(255,212,0,0.14)" />
      <circle cx={cx} cy={cy} r={8} fill="#ffd400" stroke="#26211f" strokeWidth={4} />
    </g>
  );
};

const ProjectProgressSeriesDot = ({
  cx,
  cy,
  payload,
  color,
  markerTypeKey,
  highlightToday = false,
  compact = false,
}) => {
  const markerType = payload?.[markerTypeKey];

  if (!markerType || !Number.isFinite(cx) || !Number.isFinite(cy)) {
    return null;
  }

  const isToday = Boolean(payload?.isToday);

  if (markerType === "task") {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={compact ? 2.4 : 2.9}
        fill={color}
        stroke="#171717"
        strokeWidth={1.2}
      />
    );
  }

  if (highlightToday && isToday) {
    return <ProjectProgressHighlightDot cx={cx} cy={cy} payload={payload} />;
  }

  return (
    <circle
      cx={cx}
      cy={cy}
      r={compact ? 4.4 : 5.4}
      fill={color}
      stroke="#171717"
      strokeWidth={compact ? 2.1 : 2.6}
    />
  );
};

const ProjectProgressTooltip = ({ active, payload, label, seriesMetaMap }) => {
  const visiblePayload = Array.isArray(payload)
    ? payload.filter((entry) => Number.isFinite(Number(entry?.value)))
    : [];
  const point = visiblePayload[0]?.payload;

  if (!active || visiblePayload.length === 0) {
    return null;
  }

  return (
    <div className="min-w-[188px] rounded-[18px] border border-white/[0.08] bg-[#232323]/96 px-4 py-3 text-white shadow-[0_18px_40px_rgba(0,0,0,0.42)] backdrop-blur-md">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8f96a3]">
        Progress Snapshot
      </p>
      <p className="mt-1.5 text-sm font-semibold text-white">{point?.fullLabel || label}</p>

      <div className="mt-3 space-y-2.5">
        {visiblePayload.map((entry) => {
          const meta = seriesMetaMap.get(entry.dataKey);

          return (
            <div key={entry.dataKey} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: meta?.color || entry.color }}
                />
                <span className="truncate text-xs font-medium text-[#d4d4d4]">
                  {meta?.label || entry.name}
                </span>
              </div>
              <span className="shrink-0 text-xs font-semibold text-white">
                {formatProjectProgressStageValue(entry.value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ProjectProgressChartCard = ({
  project,
  visibleProjects,
  isOverallView,
  filterMode,
  customDateRange,
  onViewProject,
}) => {
  const isMobile = useIsMobile();
  const today = React.useMemo(() => new Date(), []);
  const timeline = React.useMemo(
    () =>
      buildProjectProgressTimeline({
        todayDate: today,
        filterMode,
        customRange: customDateRange,
      }),
    [customDateRange, filterMode, today],
  );
  const resolvedProjects = React.useMemo(
    () => (Array.isArray(visibleProjects) ? visibleProjects.filter(Boolean) : []),
    [visibleProjects],
  );

  if (!isOverallView && project?.isProgressLocked) {
    return <ProjectProgressLockedCard project={project} onViewProject={onViewProject} />;
  }

  if (resolvedProjects.length === 0) {
    if (project?.isProgressLocked) {
      return <ProjectProgressLockedCard project={project} onViewProject={onViewProject} />;
    }

    return (
      <DashboardPanel className="min-h-[320px] p-6 sm:p-8">
        <div className="flex min-h-[240px] items-center justify-center text-center">
          <div className="max-w-md">
            <p className="text-[1.35rem] font-semibold tracking-[-0.03em] text-white">
              Progress timeline is not ready yet
            </p>
            <p className="mt-3 text-sm leading-6 text-[#94a3b8]">
              Once an active project starts unlocking progress, the line chart will appear here.
            </p>
          </div>
        </div>
      </DashboardPanel>
    );
  }

  const isSingleSeries = resolvedProjects.length === 1;
  const todayIndex = timeline.findIndex((entry) => entry.isToday);
  const lastVisibleIndex = todayIndex >= 0 ? todayIndex : Math.max(timeline.length - 1, 0);
  const seriesMeta = resolvedProjects.map((entry, index) => {
    const palette =
      projectProgressSeriesPalette[index % projectProgressSeriesPalette.length] ||
      projectProgressSeriesPalette[0];
    const curveTemplate = isSingleSeries
      ? projectProgressCurveTemplates[0]
      : projectProgressCurveTemplates[index % projectProgressCurveTemplates.length] ||
      projectProgressCurveTemplates[0];
    const finalStageLevel = resolveProjectProgressStageLevel(entry);
    const markerTypes = resolveProjectProgressVisibleMarkerTypes(
      entry,
      timeline.length,
      lastVisibleIndex,
    );
    const values = timeline.map((point, pointIndex) => {
      if (todayIndex >= 0 && pointIndex > lastVisibleIndex) {
        return null;
      }

      if (pointIndex === 0) {
        return 1;
      }

      const curveRatio =
        lastVisibleIndex <= 0 ? 1 : pointIndex / Math.max(lastVisibleIndex, 1);
      const curveFactor = resolveProjectProgressCurveValue(curveTemplate, curveRatio);
      return Number((1 + (finalStageLevel - 1) * curveFactor).toFixed(3));
    });

    return {
      key: `project-series-${index}`,
      color: palette.color,
      label: entry.label,
      markerTypes,
      values,
    };
  });

  const chartConfig = seriesMeta.reduce((config, entry) => {
    config[entry.key] = {
      label: entry.label,
      color: entry.color,
    };
    return config;
  }, {});

  const chartData = timeline.map((point, index) => {
    const row = {
      label: point.label,
      fullLabel: point.fullLabel,
      isToday: point.isToday,
    };

    seriesMeta.forEach((entry) => {
      row[entry.key] = entry.values[index];
      row[`${entry.key}Marker`] = entry.markerTypes[index];
    });

    return row;
  });

  const seriesMetaMap = new Map(seriesMeta.map((entry) => [entry.key, entry]));
  const phaseAxisMax = Math.max(
    4,
    Math.ceil(
      Math.max(
        4,
        ...seriesMeta.flatMap((entry) =>
          entry.values.filter((value) => Number.isFinite(Number(value))),
        ),
      ),
    ),
  );
  const todayLabel = todayIndex >= 0 ? chartData[todayIndex]?.label : null;

  return (
    <Card className="overflow-hidden rounded-[32px] border border-white/[0.06] bg-card text-white shadow-[0_30px_90px_-28px_rgba(0,0,0,0.95)]">
      <CardContent className="px-4 pb-6 pt-4 sm:px-8 sm:pb-8 sm:pt-8">
        <div className="overflow-x-auto pb-2 [scrollbar-color:rgba(255,255,255,0.14)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/[0.12]">
          <div className="min-w-[720px] lg:min-w-0">
            <ChartContainer
              config={chartConfig}
              className={cn(
                "w-full aspect-auto [&_.recharts-cartesian-axis-tick_text]:fill-[#8e877c]",
                isMobile ? "h-[340px]" : "h-[440px] xl:h-[500px]",
              )}
            >
              <LineChart
                accessibilityLayer
                data={chartData}
                margin={{
                  top: 42,
                  right: isMobile ? 10 : 18,
                  left: isMobile ? 4 : 8,
                  bottom: 12,
                }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="rgba(255,255,255,0.07)"
                  strokeDasharray="4 6"
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={18}
                  tick={{ fill: "#8e877c", fontSize: isMobile ? 10 : 12, fontWeight: 500 }}
                />
                <YAxis
                  type="number"
                  domain={[0.7, phaseAxisMax + 0.3]}
                  ticks={Array.from({ length: phaseAxisMax }, (_, index) => index + 1)}
                  tickFormatter={(value) => `phase-${value}`}
                  tickLine={false}
                  axisLine={false}
                  width={isMobile ? 54 : 68}
                  tickMargin={16}
                  tick={{ fill: "#8e877c", fontSize: isMobile ? 10 : 12, fontWeight: 600 }}
                />
                {todayLabel ? (
                  <ReferenceLine
                    x={todayLabel}
                    stroke="rgba(255,212,0,0.48)"
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    ifOverflow="extendDomain"
                    label={<ProjectProgressTodayLabel />}
                  />
                ) : null}
                <ChartTooltip
                  cursor={false}
                  content={<ProjectProgressTooltip seriesMetaMap={seriesMetaMap} />}
                />
                {seriesMeta.map((entry, index) => (
                  <Line
                    key={entry.key}
                    type="natural"
                    dataKey={entry.key}
                    stroke={entry.color}
                    strokeWidth={index === 0 ? 3.5 : 3}
                    dot={(props) => (
                      <ProjectProgressSeriesDot
                        {...props}
                        color={entry.color}
                        compact={isMobile}
                        markerTypeKey={`${entry.key}Marker`}
                        highlightToday={index === 0}
                      />
                    )}
                    activeDot={false}
                    connectNulls={false}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      filter:
                        index === 0 ? "drop-shadow(0 0 6px rgba(255,212,0,0.38))" : "none",
                    }}
                  />
                ))}
              </LineChart>
            </ChartContainer>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {seriesMeta.map((entry) => (
            <div
              key={entry.key}
              className="inline-flex max-w-full items-center gap-2 rounded-full bg-white/[0.06] px-4 py-2 text-[12px] font-medium text-[#d7d2ca]"
            >
              <span
                className="size-2 rounded-full"
                style={{
                  backgroundColor: entry.color,
                  boxShadow:
                    entry.key === seriesMeta[0]?.key
                      ? `0 0 10px ${entry.color}`
                      : "none",
                }}
              />
              <span className="max-w-[110px] truncate sm:max-w-[150px]">{entry.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const ProjectProgressSection = ({
  progressProjects,
  onViewProject,
  onOpenQuickProject,
}) => {
  const projects = React.useMemo(
    () => (Array.isArray(progressProjects) ? progressProjects : []),
    [progressProjects],
  );
  const [selectedProjectView, setSelectedProjectView] = React.useState("overall");
  const today = React.useMemo(() => new Date(), []);
  const [dateFilterMode, setDateFilterMode] = React.useState("monthly");
  const [customDateRange, setCustomDateRange] = React.useState(() => ({
    from: addDaysToProjectProgressDate(new Date(), -14),
    to: new Date(),
  }));
  const [isDateFilterOpen, setIsDateFilterOpen] = React.useState(false);

  React.useEffect(() => {
    if (!projects.length) {
      setSelectedProjectView("overall");
      return;
    }

    setSelectedProjectView((currentValue) => {
      if (currentValue === "overall") {
        return currentValue;
      }

      return projects.some((project) => String(project?.id) === String(currentValue))
        ? currentValue
        : "overall";
    });
  }, [projects]);

  const activeProject =
    selectedProjectView === "overall"
      ? projects[0]
      : projects.find((project) => String(project?.id) === String(selectedProjectView)) ||
      projects[0];
  const isOverallView = selectedProjectView === "overall";
  const visibleProjects = isOverallView
    ? projects
    : activeProject
      ? [activeProject]
      : [];
  const triggerProjectLabel = isOverallView
    ? "Overall Project"
    : activeProject?.label || "Overall Project";
  const dateTriggerLabel = formatProjectProgressTriggerLabel({
    filterMode: dateFilterMode,
    customRange: customDateRange,
    todayDate: today,
  });

  return (
    <section className="mt-14 sm:mt-16">
      <div className="mb-4 flex flex-col gap-4 sm:mb-5 sm:gap-5 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="min-w-0 text-[1.75rem] font-semibold tracking-[-0.02em] text-white">
          Project Progress
        </h2>

        {projects.length > 0 ? (
          <div className="flex flex-wrap items-center gap-3">
            <Popover open={isDateFilterOpen} onOpenChange={setIsDateFilterOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-white/[0.06] bg-card px-4 text-sm font-medium text-[#d7d2ca] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors hover:border-white/[0.12] hover:bg-white/[0.04] sm:h-12 sm:px-5"
                  aria-label="Open date range filter"
                >
                  <CalendarDays className="size-4 shrink-0 text-[#b8afa2]" />
                  <span className="max-w-[10.5rem] truncate text-left sm:max-w-[12.5rem]">
                    {dateTriggerLabel}
                  </span>
                  <ChevronDown className="size-4 shrink-0 text-[#8f96a3]" />
                </button>
              </PopoverTrigger>

              <PopoverContent
                align="end"
                sideOffset={10}
                className="w-[min(100vw-2rem,360px)] rounded-[24px] border border-white/[0.08] bg-[#232323] p-4 text-white shadow-[0_24px_70px_-36px_rgba(0,0,0,0.95)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8f96a3]">
                      Date Filter
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#d7d2ca]">
                      Choose the chart range
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {Object.entries(projectProgressFilterPresets).map(([key, option]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setDateFilterMode(key);
                        if (key !== "custom") {
                          setIsDateFilterOpen(false);
                        }
                      }}
                      className={cn(
                        "inline-flex h-10 items-center justify-center rounded-[12px] border px-3 text-sm font-semibold transition-colors",
                        dateFilterMode === key
                          ? "border-[#ffd400]/40 bg-[#ffd400]/14 text-[#ffd400]"
                          : "border-white/[0.08] bg-white/[0.03] text-[#d7d2ca] hover:bg-white/[0.05]",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {dateFilterMode === "custom" ? (
                  <div className="mt-4 overflow-hidden rounded-[20px] border border-white/[0.08] bg-card/40">
                    <Calendar
                      mode="range"
                      numberOfMonths={1}
                      selected={customDateRange}
                      defaultMonth={customDateRange?.from || today}
                      onSelect={(range) => {
                        setCustomDateRange(range || { from: undefined, to: undefined });
                        if (range?.from && range?.to) {
                          setIsDateFilterOpen(false);
                        }
                      }}
                      className="w-full"
                      classNames={{
                        root: "w-full",
                        months: "w-full",
                        month: "w-full space-y-4",
                        nav: "relative flex items-center justify-between px-1",
                        caption_label: "text-sm font-semibold text-white",
                        nav_button:
                          "size-8 rounded-md border border-white/[0.08] bg-white/[0.03] text-white hover:bg-white/[0.06]",
                        button_previous: "!static",
                        button_next: "!static",
                        weekday:
                          "text-[11px] font-medium uppercase tracking-[0.16em] text-[#8f96a3]",
                        day: "text-sm text-[#d7d2ca]",
                        today: "bg-white/[0.08] text-white rounded-md",
                        outside: "text-[#5f6671]",
                        disabled: "text-[#5f6671] opacity-50",
                      }}
                    />
                  </div>
                ) : null}
              </PopoverContent>
            </Popover>

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-11 items-center justify-between gap-3 rounded-full border border-white/[0.06] bg-card px-4 text-sm font-semibold text-[#d7d2ca] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors hover:border-white/[0.12] hover:bg-white/[0.04] sm:h-12 sm:min-w-[170px] sm:px-5"
                  aria-label="Open project progress menu"
                >
                  <span className="max-w-[11rem] truncate text-left">{triggerProjectLabel}</span>
                  <ChevronDown className="size-4 text-[#8f96a3]" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                sideOffset={10}
                className="w-[min(100vw-2rem,280px)] rounded-[22px] border border-white/[0.08] bg-[#232323] p-2 text-white shadow-[0_24px_70px_-36px_rgba(0,0,0,0.95)]"
              >
                <DropdownMenuLabel className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8f96a3]">
                  View Progress
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1 bg-white/[0.06]" />

                <DropdownMenuRadioGroup
                  value={selectedProjectView}
                  onValueChange={setSelectedProjectView}
                >
                  <DropdownMenuRadioItem
                    value="overall"
                    className="rounded-[16px] px-3 py-3 pl-3 text-white transition-colors hover:bg-white/[0.04] focus:bg-white/[0.06] focus:text-white data-[state=checked]:bg-white/[0.06] [&>span:first-child]:hidden"
                  >
                    <span className="truncate text-sm font-semibold text-white">
                      Overall Project
                    </span>
                  </DropdownMenuRadioItem>

                  {projects.map((entry) => (
                    <DropdownMenuRadioItem
                      key={entry.id}
                      value={String(entry.id)}
                      className="rounded-[16px] px-3 py-3 pl-3 text-white transition-colors hover:bg-white/[0.04] focus:bg-white/[0.06] focus:text-white data-[state=checked]:bg-white/[0.06] [&>span:first-child]:hidden"
                    >
                      <span className="truncate text-sm font-semibold text-white">
                        {entry.label}
                      </span>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}
      </div>

      {projects.length > 0 ? (
        <div>
          <ProjectProgressChartCard
            project={activeProject}
            visibleProjects={visibleProjects}
            isOverallView={isOverallView}
            filterMode={dateFilterMode}
            customDateRange={customDateRange}
            onViewProject={onViewProject}
          />
        </div>
      ) : (
        <DashboardPanel className="min-h-[220px] p-5 sm:p-8">
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
  onOpenViewProjects,
  onOpenMessages,
  onOpenHireFreelancer,
  onPayRunningProject,
  runningProjectProcessingId = null,
  onViewProject,
}) => {
  const isMobile = useIsMobile();
  const shouldUseProjectCarousel = isMobile ? showcaseItems.length > 1 : showcaseItems.length > 3;
  const activeProjectCardClassName = "w-full";
  const activeProjectRedirectCardClassName = "w-full h-full md:min-h-[506px]";
  const [projectCarouselApi, setProjectCarouselApi] = React.useState(null);
  const [canGoToPreviousProjects, setCanGoToPreviousProjects] = React.useState(false);
  const [canGoToNextProjects, setCanGoToNextProjects] = React.useState(false);
  const [projectCarouselSnapCount, setProjectCarouselSnapCount] = React.useState(0);
  const [activeProjectSnap, setActiveProjectSnap] = React.useState(0);
  const [mobileProjectCardHeight, setMobileProjectCardHeight] = React.useState(0);
  const projectCardRefs = React.useRef({});
  const handleOpenNotificationSheet = React.useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.dispatchEvent(new CustomEvent("client-notifications:open"));
  }, []);
  const projectRedirectCards = React.useMemo(() => {
    const handleStartProject =
      typeof onOpenQuickProject === "function" ? onOpenQuickProject : () => { };
    const handleBrowseMarketplace =
      typeof onOpenHireFreelancer === "function" ? onOpenHireFreelancer : () => { };

    return [
      {
        id: "start-project",
        Icon: Sparkles,
        eyebrow: "Project Pipeline",
        title: "Start another project",
        description:
          "Launch a fresh brief, define the scope, and keep your delivery pipeline active.",
        highlights: ["Create a new proposal", "Set budget and timeline", "Invite the right talent"],
        actionLabel: "Start New Project",
        onClick: handleStartProject,
      },
      {
        id: "browse-marketplace",
        Icon: Users,
        eyebrow: "Talent Marketplace",
        title: "Find your next specialist",
        description:
          "Browse verified freelancers and open the next engagement when you are ready.",
        highlights: ["Explore verified talent", "Compare specialists fast", "Add another active project"],
        actionLabel: "Browse Marketplace",
        onClick: handleBrowseMarketplace,
      },
    ];
  }, [
    onOpenHireFreelancer,
    onOpenQuickProject,
  ]);

  React.useEffect(() => {
    if (!projectCarouselApi || !shouldUseProjectCarousel) {
      setCanGoToPreviousProjects(false);
      setCanGoToNextProjects(false);
      setProjectCarouselSnapCount(0);
      setActiveProjectSnap(0);
      return undefined;
    }

    const syncProjectCarouselState = () => {
      setCanGoToPreviousProjects(projectCarouselApi.canScrollPrev());
      setCanGoToNextProjects(projectCarouselApi.canScrollNext());
      setProjectCarouselSnapCount(projectCarouselApi.scrollSnapList().length);
      setActiveProjectSnap(projectCarouselApi.selectedScrollSnap());
    };

    syncProjectCarouselState();
    projectCarouselApi.on("select", syncProjectCarouselState);
    projectCarouselApi.on("reInit", syncProjectCarouselState);

    return () => {
      projectCarouselApi.off("select", syncProjectCarouselState);
      projectCarouselApi.off("reInit", syncProjectCarouselState);
    };
  }, [projectCarouselApi, shouldUseProjectCarousel]);

  React.useEffect(() => {
    if (!isMobile || !shouldUseProjectCarousel) {
      setMobileProjectCardHeight(0);
      return undefined;
    }

    let frameId = 0;
    const measureProjectCardHeights = () => {
      const heights = Object.values(projectCardRefs.current)
        .map((card) => card?.getBoundingClientRect().height || 0)
        .filter((height) => height > 0);

      if (heights.length === 0) {
        setMobileProjectCardHeight(0);
        return;
      }

      const maxHeight = Math.ceil(Math.max(...heights));
      setMobileProjectCardHeight((currentHeight) =>
        currentHeight === maxHeight ? currentHeight : maxHeight,
      );
    };

    const scheduleMeasure = () => {
      if (typeof window === "undefined") {
        return;
      }
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(measureProjectCardHeights);
    };

    scheduleMeasure();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
          scheduleMeasure();
        })
        : null;

    Object.values(projectCardRefs.current).forEach((card) => {
      if (card && resizeObserver) {
        resizeObserver.observe(card);
      }
    });

    window.addEventListener("resize", scheduleMeasure);

    return () => {
      window.removeEventListener("resize", scheduleMeasure);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.cancelAnimationFrame(frameId);
    };
  }, [isMobile, shouldUseProjectCarousel, showcaseItems.length]);

  return (
    <div className="min-h-screen bg-background text-[#f1f5f9]">
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
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground lg:hidden">
                  {hero.dateLabel}
                </p>
                <h1 className="text-[clamp(2rem,4vw,3rem)] font-semibold leading-[0.96] tracking-[-0.05em] text-white">
                  {hero.greeting}, {hero.firstName}
                </h1>
                {hero.description ? (
                  <p className="mt-2 text-sm text-muted-foreground sm:mt-1">{hero.description}</p>
                ) : null}
              </div>
              <p className="hidden text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground lg:block">
                {hero.dateLabel}
              </p>
            </section>

            <section className="mt-12 grid auto-rows-fr grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
              {metrics.map((item) => (
                <OverviewMetricCard key={item.id || item.title} item={item} />
              ))}
            </section>

            {!isProjectsLoading && showcaseItems.length === 0 ? (
              <DraftProposalsSection
                draftProposalRows={draftProposalRows}
                onOpenQuickProject={onOpenQuickProject}
                className="mt-14"
              />
            ) : null}

            <section className="mt-14">
              <div className="mb-4 flex items-center justify-between gap-4 sm:mb-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-[1.75rem] font-semibold tracking-[-0.02em] text-white">
                      Active Projects
                    </h2>
                    <span className="relative inline-flex size-[15px] shrink-0 items-center justify-center">
                      <span className="absolute inset-0 rounded-full bg-[#10b981]/10" />
                      <span className="absolute inset-0 rounded-full bg-[#10b981]/20 animate-ping" />
                      <span className="relative block size-[6px] rounded-full bg-[#10b981]" />
                    </span>
                  </div>
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
                    <div className="w-full">
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
                        <CarouselContent className="ml-0 items-start gap-5 [backface-visibility:hidden] [will-change:transform] sm:gap-6 xl:gap-7">
                          {showcaseItems.map((item) => (
                            <CarouselItem
                              key={item.id}
                              className="pl-[2px] pr-[2px] pt-1 basis-full md:basis-[calc((100%-1.5rem)/2)] xl:basis-[calc((100%-3.5rem)/3)]"
                            >
                              <div
                                ref={(node) => {
                                  projectCardRefs.current[item.id] = node;
                                }}
                              >
                                <ProjectProposalCard
                                  project={item}
                                  onPay={onPayRunningProject}
                                  isPaying={runningProjectProcessingId === item.id}
                                  replaceSectionBadgeWithStatus
                                  className={activeProjectCardClassName}
                                />
                              </div>
                            </CarouselItem>
                          ))}
                          {projectRedirectCards.map((item) => (
                            <CarouselItem
                              key={item.id}
                              className="pl-[2px] pr-[2px] pt-1 basis-full md:basis-[calc((100%-1.5rem)/2)] xl:basis-[calc((100%-3.5rem)/3)]"
                            >
                              <div
                                style={
                                  isMobile && mobileProjectCardHeight > 0
                                    ? { height: `${mobileProjectCardHeight}px` }
                                    : undefined
                                }
                              >
                                <ProjectRedirectCard
                                  item={item}
                                  className={activeProjectRedirectCardClassName}
                                />
                              </div>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                      </Carousel>
                      <ProjectCarouselDots
                        count={projectCarouselSnapCount}
                        activeIndex={activeProjectSnap}
                        onSelect={(index) => projectCarouselApi?.scrollTo(index)}
                      />
                    </div>
                  ) : (
                    <div className="grid items-start gap-5 sm:gap-6 xl:gap-7 md:grid-cols-2 xl:grid-cols-3">
                      {showcaseItems.map((item) => (
                        <ProjectProposalCard
                          key={item.id}
                          project={item}
                          onPay={onPayRunningProject}
                          isPaying={runningProjectProcessingId === item.id}
                          replaceSectionBadgeWithStatus
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
              <div className="min-w-0 flex flex-col gap-5 sm:gap-6 xl:gap-7">
                {!isProjectsLoading && showcaseItems.length > 0 ? (
                  <DraftProposalsSection
                    draftProposalRows={draftProposalRows}
                    onOpenQuickProject={onOpenQuickProject}
                  />
                ) : null}
                <RecentActivitySection
                  recentActivities={recentActivities}
                  onOpenViewProjects={onOpenViewProjects}
                  onOpenNotifications={handleOpenNotificationSheet}
                />
              </div>

              <div className="grid gap-5 sm:gap-6 xl:gap-7">
                <section className="w-full min-w-0">
                  <div className="mb-4 flex items-center justify-between gap-4 sm:mb-5">
                    <div className="min-w-0">
                      <h2 className="text-[1.75rem] font-semibold tracking-[-0.02em] text-white">
                        Active Chats
                      </h2>
                    </div>
                  </div>

                  <DashboardPanel className="w-full overflow-hidden bg-card px-5 pb-5 pt-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:px-6 sm:pb-6 sm:pt-6">

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
                        <div className="mt-5 sm:mt-6">
                          {acceptedFreelancers.map((item, index) => (
                            <div
                              key={item.id}
                              className={cn(
                                "py-5",
                                index === 0 ? "pt-0" : "",
                                index === acceptedFreelancers.length - 1
                                  ? "pb-0"
                                  : "border-b border-white/[0.08]",
                              )}
                            >
                              <AcceptedFreelancerRow
                                item={item}
                                onOpenMessages={onOpenMessages}
                              />
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={onOpenMessages}
                          className="mt-5 flex w-full items-center justify-center gap-2 border-t border-white/[0.08] pt-5 text-[13px] font-medium uppercase tracking-[0.12em] text-[#d6d6d6] transition-colors hover:text-white"
                        >
                          <span>
                            Open Messages ({acceptedFreelancersCount || acceptedFreelancers.length})
                          </span>
                          <ChevronRight className="size-[15px] stroke-[1.75]" />
                        </button>
                      </>
                    )}
                  </DashboardPanel>
                </section>
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
