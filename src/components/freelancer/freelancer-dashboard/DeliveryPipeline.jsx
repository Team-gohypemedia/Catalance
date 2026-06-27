import React from "react";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import SlidersHorizontal from "lucide-react/dist/esm/icons/sliders-horizontal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { cn } from "@/shared/lib/utils";
import {
  FreelancerCarouselDots,
  FreelancerDashboardPanel,
  FreelancerDashboardSkeletonBlock,
} from "./shared.jsx";

export const FreelancerDeliveryPipelineSkeleton = () => (
  <section>
    <FreelancerDashboardPanel className="overflow-hidden p-0">
      <div className="border-b border-white/[0.05] px-4 py-5 sm:px-6 lg:px-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <FreelancerDashboardSkeletonBlock className="h-8 w-56 rounded-full" />
              <FreelancerDashboardSkeletonBlock className="h-6 w-24 rounded-full" />
            </div>
            <FreelancerDashboardSkeletonBlock className="mt-3 h-4 w-[28rem] max-w-full rounded-full" />
            <FreelancerDashboardSkeletonBlock className="mt-2 h-4 w-[24rem] max-w-full rounded-full" />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <FreelancerDashboardSkeletonBlock className="h-10 w-40 rounded-full" />
            <FreelancerDashboardSkeletonBlock className="h-10 w-36 rounded-full" />
          </div>
        </div>
      </div>

      <div className="px-4 py-5 sm:px-6 lg:px-7">
        <FreelancerDashboardSkeletonBlock className="h-10 w-full rounded-[16px]" />

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <Card
              key={`freelancer-earnings-stat-skeleton-${item}`}
              className="border-white/[0.08] bg-background/30 shadow-none"
            >
              <CardContent className="p-4 sm:p-5">
                <FreelancerDashboardSkeletonBlock className="h-4 w-24 rounded-full" />
                <FreelancerDashboardSkeletonBlock className="mt-4 h-8 w-28 rounded-full" />
                <FreelancerDashboardSkeletonBlock className="mt-3 h-4 w-36 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,1fr)]">
          <Card className="border-white/[0.08] bg-background/30 shadow-none">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <FreelancerDashboardSkeletonBlock className="h-6 w-40 rounded-full" />
                  <FreelancerDashboardSkeletonBlock className="mt-2 h-4 w-36 rounded-full" />
                </div>
                <FreelancerDashboardSkeletonBlock className="h-6 w-24 rounded-full" />
              </div>
              <FreelancerDashboardSkeletonBlock className="my-4 h-px w-full" />
              <FreelancerDashboardSkeletonBlock className="h-52 w-full rounded-[24px]" />
            </CardContent>
          </Card>

          <Card className="border-white/[0.08] bg-background/30 shadow-none">
            <CardContent className="p-4 sm:p-5">
              <div>
                <FreelancerDashboardSkeletonBlock className="h-6 w-28 rounded-full" />
                <FreelancerDashboardSkeletonBlock className="mt-2 h-4 w-44 rounded-full" />
              </div>
              <div className="mt-4 space-y-3">
                <FreelancerDashboardSkeletonBlock className="h-11 w-full rounded-[16px]" />
                <FreelancerDashboardSkeletonBlock className="h-11 w-full rounded-[16px]" />
                <FreelancerDashboardSkeletonBlock className="h-11 w-full rounded-[16px]" />
              </div>
              <FreelancerDashboardSkeletonBlock className="my-4 h-px w-full" />
              <FreelancerDashboardSkeletonBlock className="h-24 w-full rounded-[18px]" />
            </CardContent>
          </Card>
        </div>
      </div>
    </FreelancerDashboardPanel>
  </section>
);

const FreelancerRunningProjectCard = ({
  item,
  isSelected,
  canShowSelection,
  onSelect,
}) => {
  const progress = Math.max(0, Math.min(100, Number(item?.progress) || 0));
  const badgeLabel =
    String(item?.statusLabel || "").trim().toLowerCase() === "awaiting clearance"
      ? "In Progress"
      : item?.statusLabel;

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "relative cursor-pointer overflow-hidden rounded-[18px] bg-card shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] transition-colors hover:bg-card",
        canShowSelection &&
          isSelected &&
          "border-transparent bg-card shadow-[inset_0_0_0_2px_rgba(var(--brand-rgb),1)]",
      )}
    >
      <CardContent className={cn("p-4 pb-6", canShowSelection && isSelected && "pb-7")}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
              {String(item?.clientLabel || "").toUpperCase()}
            </p>
            <p className="mt-2 truncate text-[1.15rem] font-semibold tracking-[-0.03em] dark:text-white text-[#1C1B1F]">
              {item?.title}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">{item?.timeLabel}</p>
          </div>

          <Badge className="inline-flex items-center gap-1.5 rounded-full border-0 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            {badgeLabel}
          </Badge>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Freelancer share</span>
            <span className="font-semibold text-foreground dark:text-zinc-100">{item?.amount}</span>
          </div>
          <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const resolveMobilePipelineTone = (hasActiveProject, statusTone) => {
  if (!hasActiveProject) {
    return {
      textClass: "text-muted-foreground",
      dotClass: "bg-muted-foreground/75",
      barClass: "bg-muted",
    };
  }

  if (statusTone === "On track") {
    return {
      textClass: "text-emerald-500 dark:text-emerald-300",
      dotClass: "bg-emerald-500 dark:bg-emerald-400",
      barClass: "bg-emerald-500 dark:bg-emerald-400",
    };
  }

  if (statusTone === "Steady") {
    return {
      textClass: "text-primary",
      dotClass: "bg-primary",
      barClass: "bg-primary",
    };
  }

  return {
    textClass: "text-primary",
    dotClass: "bg-primary/20",
    barClass: "bg-primary/20",
  };
};

const resolveMobilePipelinePhaseAppearance = (row) => {
  if (row?.isCompleted) {
    return {
      dotClass: "border-emerald-500 dark:border-emerald-400 bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]",
      cardClass: "border-emerald-500/20 dark:border-emerald-400/18 bg-card",
      chipClass: "border-emerald-500/20 dark:border-emerald-400/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
      barClass: "bg-emerald-500 dark:bg-emerald-400",
      lineClass: "bg-emerald-500/55 dark:bg-emerald-400/55",
    };
  }

  if (row?.isActive) {
    return {
      dotClass: "border-primary bg-primary shadow-[0_0_0_4px_rgba(var(--brand-rgb),0.12)]",
      cardClass: "border-primary/20 bg-card",
      chipClass: "border-primary/20 bg-primary/10 text-primary",
      barClass: "bg-primary",
      lineClass: "bg-primary/55",
    };
  }

  if (row?.isPending) {
    return {
      dotClass: "border-primary/30 bg-primary/20 shadow-[0_0_0_4px_rgba(251,146,60,0.12)]",
      cardClass: "border-primary/10 bg-card",
      chipClass: "border-primary/20 bg-primary/5 text-primary",
      barClass: "bg-primary/20",
      lineClass: "bg-primary/20",
    };
  }

  return {
    dotClass: "border-border bg-muted",
    cardClass: "border-border bg-card",
    chipClass: "border-border bg-muted text-muted-foreground",
    barClass: "bg-muted",
    lineClass: "bg-border",
  };
};

const FreelancerRunningProjectCompactCard = ({ item, isSelected, onSelect }) => {
  const progress = Math.max(0, Math.min(100, Number(item?.progress) || 0));
  const badgeLabel =
    String(item?.statusLabel || "").trim().toLowerCase() === "awaiting clearance"
      ? "On Track"
      : item?.statusLabel;

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "w-[84vw] min-w-[15rem] max-w-[18rem] shrink-0 snap-start overflow-hidden rounded-[22px] border bg-card border-border shadow-sm",
        isSelected &&
          "border-primary shadow-[0_18px_40px_rgba(0,0,0,0.1)]",
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex size-9 items-center justify-center rounded-[12px] border border-border bg-muted">
            <span className="size-2.5 rotate-45 rounded-[3px] border border-primary/80" />
          </span>
          <Badge className="rounded-full border-0 bg-emerald-500/12 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300">
            {badgeLabel}
          </Badge>
        </div>

        <p className="mt-4 text-[1.15rem] font-semibold tracking-[-0.04em] text-foreground">
          {item?.title || "Untitled project"}
        </p>
        <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
          {item?.clientLabel ? `With ${item.clientLabel}` : item?.timeLabel}
        </p>

        <div className="mt-5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em]">
          <span className="text-muted-foreground">Progress</span>
          <span className="text-foreground">{progress}%</span>
        </div>

        <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${progress}%` }} />
        </div>
      </CardContent>
    </Card>
  );
};

const DeliveryPipeline = ({
  activeRunningProjectsFilterLabel,
  runningProjectFilterOptions,
  runningProjectsFilter,
  setRunningProjectsFilter,
  visibleRunningProjects,
  showRunningProjectsCarouselControls,
  runningProjectsCarouselApi,
  setRunningProjectsCarouselApi,
  canGoToPreviousRunningProjects,
  canGoToNextRunningProjects,
  runningProjectsCarouselSnapCount,
  activeRunningProjectsSnap,
  selectedRunningProjectId,
  setSelectedRunningProjectId,
  activeScheduleProjectTitle,
  activeProposalForSchedule,
  scheduleTimelineRows,
  schedulePhaseSegments,
  activeSchedulePhaseSegmentIndex,
  scheduleMarkerLeftPct,
  scheduleTodayDateLabel,
  activeScheduleProgressPct,
  schedulePhases,
  activeScheduleDueInDays,
  nextPayoutSummaryLabel,
}) => {
  const hasActiveProject = Boolean(activeProposalForSchedule);
  const statusTone = !hasActiveProject
    ? "No active project"
    : activeScheduleProgressPct >= 80
      ? "On track"
      : activeScheduleProgressPct >= 50
        ? "Steady"
        : "Delayed";
  const statusSub = hasActiveProject
    ? `Tracking ${activeScheduleProjectTitle}`
    : "Select a project from All projects to see live schedule metrics.";
  const completed = schedulePhases.filter((phase) => phase.isComplete).length;
  const pending = Math.max(0, schedulePhases.length - completed);
  const total = Math.max(1, schedulePhases.length || 4);
  const dotCount = Math.min(7, total);
  const dotsOn = Math.min(dotCount, completed);
  const daysRemaining =
    hasActiveProject && Number.isFinite(activeScheduleDueInDays)
      ? activeScheduleDueInDays
      : pending
        ? pending * 7
        : 0;
  const mobileStatusTone = resolveMobilePipelineTone(hasActiveProject, statusTone);

  return (
    <section className="w-full min-w-0">
      <div className="mb-4 hidden items-center justify-between gap-4 sm:mb-5 sm:flex">
        <h2 className="text-[22px] sm:text-[1.65rem] font-semibold tracking-[-0.04em] dark:text-white text-[#1C1B1F]">
          Delivery Pipeline
        </h2>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-8 w-[12rem] justify-between rounded-full border-border bg-card px-3 text-[11px] font-semibold text-foreground dark:text-zinc-200 hover:bg-card data-[state=open]:bg-card"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <SlidersHorizontal className="size-3.5 shrink-0" />
                  <span className="truncate">{activeRunningProjectsFilterLabel}</span>
                </span>
                <ChevronDown className="size-3.5 shrink-0 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-[12rem] rounded-xl border-border bg-card p-1.5"
            >
              {runningProjectFilterOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  disabled={option.count === 0}
                  onSelect={(event) => {
                    if (option.count === 0) {
                      event.preventDefault();
                      return;
                    }
                    setRunningProjectsFilter(option.value);
                  }}
                  className={cn(
                    "rounded-lg px-2.5 py-2 text-[12px] font-medium text-zinc-200",
                    runningProjectsFilter === option.value && "bg-white/[0.08] dark:text-white text-[#1C1B1F]",
                    option.count === 0 && "cursor-not-allowed opacity-50",
                  )}
                >
                  <span>{option.label}</span>
                  {option.kind === "preset" ? (
                    <span className="ml-auto text-[11px] text-zinc-400">
                      {option.count}
                    </span>
                  ) : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <FreelancerDashboardPanel className="overflow-hidden p-0">
        <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-7">
          <div className="flex flex-col gap-4 sm:hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-[22px] font-semibold tracking-[-0.03em] dark:text-white text-[#1C1B1F]">
                  Delivery Pipeline
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setRunningProjectsFilter("all")}
                className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--primary)]"
              >
                View all
              </button>
            </div>

            {visibleRunningProjects.length > 0 ? (
              <div className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex gap-3">
                  {visibleRunningProjects.map((item) => (
                    <FreelancerRunningProjectCompactCard
                      key={item.id}
                      item={item}
                      isSelected={String(selectedRunningProjectId || "") === String(item.id)}
                      onSelect={() => setSelectedRunningProjectId(String(item.id))}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <Card className="rounded-[22px] border border-dashed border-border bg-muted/20 shadow-none">
                <CardContent className="flex min-h-[120px] flex-col items-center justify-center p-5 text-center">
                  <p className="text-sm font-medium text-foreground">No active projects</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Switch filters or accept a proposal to start tracking delivery phases.
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="overflow-hidden rounded-[28px] border border-border bg-card shadow-none">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Project Schedule
                    </p>
                    <p className="mt-2 truncate text-[0.95rem] font-semibold tracking-[-0.03em] text-foreground">
                      {activeScheduleProjectTitle}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="inline-flex rounded-full bg-[var(--primary)] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-white">
                      Today
                    </span>
                    <p className="mt-1 text-[10px] font-medium text-[var(--primary)]">
                      {scheduleTodayDateLabel}
                    </p>
                  </div>
                </div>

                {hasActiveProject ? (
                  <div className="relative mt-5 pl-6">
                    <div className="absolute bottom-6 left-[7px] top-3 w-px bg-border" />

                    <div className="space-y-4">
                      {scheduleTimelineRows.map((row, index) => {
                        const phase = schedulePhases[index] || null;
                        const segment = schedulePhaseSegments[index] || null;
                        const appearance = resolveMobilePipelinePhaseAppearance(row);
                        const progressWidth = row?.isCompleted
                          ? 100
                          : row?.isActive
                            ? Math.max(8, Math.round(Number(row?.progress || phase?.progress || 0)))
                            : row?.isPending
                              ? 28
                              : 0;
                        const chipLabel = row?.isCompleted
                          ? "Completed"
                          : row?.isActive
                            ? row?.noteLabel || `${progressWidth}% in progress`
                            : row?.isPending
                              ? row?.noteLabel || "Pending"
                              : "Upcoming";
                        const helperLabel =
                          row?.isCompleted
                            ? phase?.summary && phase.summary !== "Pending"
                              ? phase.summary
                              : "Finished and ready for handoff."
                            : row?.isActive
                              ? phase?.summary && phase.summary !== "Pending"
                                ? phase.summary
                                : "Current phase progress is being tracked live."
                              : row?.isPending
                                ? phase?.summary && phase.summary !== "Pending"
                                  ? phase.summary
                                  : "Queued after the current phase closes."
                                : "Scheduled later in the delivery plan.";

                        return (
                          <div key={row.id} className="relative">
                            <span
                              className={cn(
                                "absolute left-[-24px] top-3 z-10 size-[13px] rounded-full border-[3px]",
                                appearance.dotClass,
                              )}
                            />

                            <div
                              className={cn(
                                "rounded-[22px] border px-4 py-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]",
                                appearance.cardClass,
                              )}
                            >
                              <p className="text-[9px] font-semibold uppercase tracking-[0.28em] dark:text-white text-[#1C1B1F]/28">
                                Phase {index + 1}
                              </p>
                              <p className="mt-2 text-[1.05rem] font-semibold tracking-[-0.03em] dark:text-white text-[#1C1B1F]">
                                {phase?.label || row?.summary || `Phase ${index + 1}`}
                              </p>
                              <p className="mt-1 text-[11px] text-zinc-500">
                                {segment?.rangeLabel || phase?.summary || "Upcoming"}
                              </p>

                              <div
                                className={cn(
                                  "mt-3 inline-flex rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em]",
                                  appearance.chipClass,
                                )}
                              >
                                {chipLabel}
                              </div>

                              <p className="mt-3 text-[11px] leading-5 text-zinc-500">
                                {helperLabel}
                              </p>

                              <div className="mt-4 h-[3px] w-full overflow-hidden rounded-full bg-muted">
                                <div
                                  className={cn("h-full rounded-full", appearance.barClass)}
                                  style={{ width: `${progressWidth}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[240px] flex-col items-center justify-center px-3 py-10 text-center">
                    <p className="text-sm font-semibold text-foreground">No active project</p>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      Select a running project to unlock the schedule timeline and delivery
                      checkpoints.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[22px] border border-border bg-card shadow-none">
              <CardContent className="p-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Current Status
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className={cn("size-2 rounded-sm", mobileStatusTone.dotClass)} />
                  <p
                    className={cn(
                      "text-[0.95rem] font-semibold uppercase tracking-[0.08em]",
                      mobileStatusTone.textClass,
                    )}
                  >
                    {hasActiveProject ? statusTone : "No active project"}
                  </p>
                </div>
                <div className="mt-4 h-[3px] overflow-hidden rounded-full bg-border">
                  <div
                    className={cn("h-full rounded-full", mobileStatusTone.barClass)}
                    style={{
                      width: `${hasActiveProject ? Math.min(100, activeScheduleProgressPct || 0) : 0}%`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Card className="rounded-[20px] border border-border bg-card shadow-none">
                <CardContent className="p-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Time Remaining
                  </p>
                  <p className="mt-3 text-[1.45rem] font-semibold tracking-[-0.04em] text-foreground">
                    {hasActiveProject
                      ? daysRemaining
                        ? `${daysRemaining} Days`
                        : "Today"
                      : "—"}
                  </p>
                  <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
                    {hasActiveProject ? nextPayoutSummaryLabel : "Awaiting an active delivery."}
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-[20px] border border-border bg-card shadow-none">
                <CardContent className="p-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Completed Tasks
                  </p>
                  <p className="mt-3 text-[1.45rem] font-semibold tracking-[-0.04em] text-foreground">
                    {hasActiveProject ? `${completed}/${total}` : "—"}
                  </p>
                  <div className="mt-3 flex items-center gap-1">
                    {Array.from({ length: dotCount }).map((_, index) => (
                      <span
                        key={`schedule-mobile-complete-dot-${index}`}
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          hasActiveProject && index < dotsOn
                            ? "bg-[var(--primary)]"
                            : "bg-muted",
                        )}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="hidden flex-col gap-4 sm:flex">
            {runningProjectsFilter === "all" && visibleRunningProjects.length > 0 ? (
              <>
                <div className="relative">
                  {showRunningProjectsCarouselControls ? (
                    <>
                      <button
                        type="button"
                        onClick={() => runningProjectsCarouselApi?.scrollPrev()}
                        disabled={!canGoToPreviousRunningProjects}
                        aria-label="Show previous running project"
                        className="absolute left-2 top-1/2 z-20 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/[0.08] bg-card/95 dark:text-white text-[#1C1B1F] transition-colors hover:bg-white/[0.08] hover:dark:text-white text-[#1C1B1F] disabled:cursor-not-allowed disabled:border-white/[0.08] disabled:bg-card/70 disabled:dark:text-white text-[#1C1B1F]/35"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => runningProjectsCarouselApi?.scrollNext()}
                        disabled={!canGoToNextRunningProjects}
                        aria-label="Show next running project"
                        className="absolute right-2 top-1/2 z-20 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/[0.08] bg-card/95 dark:text-white text-[#1C1B1F] transition-colors hover:bg-white/[0.08] hover:dark:text-white text-[#1C1B1F] disabled:cursor-not-allowed disabled:border-white/[0.08] disabled:bg-card/70 disabled:dark:text-white text-[#1C1B1F]/35"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </>
                  ) : null}

                  <Carousel
                    setApi={setRunningProjectsCarouselApi}
                    opts={{
                      align: "start",
                      containScroll: "trimSnaps",
                      slidesToScroll: 1,
                      duration: 34,
                    }}
                    className="w-full"
                  >
                    <CarouselContent className="ml-0 items-start gap-4 [backface-visibility:hidden] [will-change:transform]">
                      {visibleRunningProjects.map((item) => (
                        <CarouselItem
                          key={item.id}
                          className={cn(
                            "basis-full pl-[2px] pr-[2px]",
                            visibleRunningProjects.length === 1
                              ? "md:basis-full xl:basis-full"
                              : visibleRunningProjects.length === 2
                                ? "md:basis-[calc((100%-1rem)/2)] xl:basis-[calc((100%-1rem)/2)]"
                                : "md:basis-[calc((100%-1rem)/2)] xl:basis-[calc((100%-2rem)/3)]",
                          )}
                        >
                          <FreelancerRunningProjectCard
                            item={item}
                            isSelected={String(selectedRunningProjectId || "") === String(item.id)}
                            canShowSelection={visibleRunningProjects.length > 1}
                            onSelect={() => setSelectedRunningProjectId(String(item.id))}
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                </div>
                <FreelancerCarouselDots
                  count={runningProjectsCarouselSnapCount}
                  activeIndex={activeRunningProjectsSnap}
                  onSelect={(index) => runningProjectsCarouselApi?.scrollTo(index)}
                  ariaLabel="Running projects carousel pagination"
                  getDotLabel={(index) => `Go to running project ${index + 1}`}
                />
              </>
            ) : (
              <div
                className={cn(
                  "grid gap-4",
                  visibleRunningProjects.length > 1 && "md:grid-cols-2 xl:grid-cols-3",
                )}
              >
                {visibleRunningProjects.map((item) => (
                  <FreelancerRunningProjectCard
                    key={item.id}
                    item={item}
                    isSelected={String(selectedRunningProjectId || "") === String(item.id)}
                    canShowSelection={visibleRunningProjects.length > 1}
                    onSelect={() => setSelectedRunningProjectId(String(item.id))}
                  />
                ))}
                {visibleRunningProjects.length === 0 ? (
                  <Card className="rounded-[18px] border border-dashed border-white/[0.12] bg-background/20 shadow-none md:col-span-2 xl:col-span-3">
                    <CardContent className="flex min-h-[140px] flex-col items-center justify-center p-6 text-center">
                      <p className="text-sm font-medium dark:text-white text-[#1C1B1F]">No projects in this filter</p>
                      <p className="mt-2 text-xs text-zinc-400">
                        Switch to All projects to view every active payout card.
                      </p>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <Card className="w-full rounded-[20px] border border-white/[0.08] bg-card shadow-none">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        Project Schedule
                      </p>
                      <p className="mt-2 text-[1.05rem] font-semibold tracking-[-0.03em] dark:text-white text-[#1C1B1F]">
                        Phase timeline for {activeScheduleProjectTitle}
                      </p>
                    </div>
                    <Badge className="rounded-full border-0 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold dark:text-white text-[#1C1B1F]">
                      {(() => {
                        const dateCandidate = activeProposalForSchedule?.project?.deadline
                          ? new Date(activeProposalForSchedule.project.deadline)
                          : new Date();
                        const month = dateCandidate
                          .toLocaleDateString("en-US", { month: "short" })
                          .toUpperCase();
                        const year = dateCandidate.getFullYear();
                        return `${month} ${year}`;
                      })()}
                    </Badge>
                  </div>

                  <div className="mt-6 rounded-[18px] border border-white/[0.06] bg-card px-4 py-4">
                    {activeProposalForSchedule ? (
                      <div className="grid grid-cols-[160px_1fr] gap-6">
                        {(() => {
                          const visualRows = [...scheduleTimelineRows].reverse();

                          return (
                            <>
                              <div>
                                <div className="h-[34px] pt-1">
                                  <p className="text-[0.66rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
                                    MILESTONES
                                  </p>
                                  <p className="mt-1 text-[10px] opacity-0">placeholder</p>
                                </div>
                                <div className="relative mt-12 h-[214px]">
                                  {visualRows.map((row, rowIndex) => {
                                    const rowTop = rowIndex * 52;
                                    return (
                                      <div
                                        key={row.id}
                                        className="absolute left-0 right-0"
                                        style={{ top: `${rowTop}px` }}
                                      >
                                        <p className="absolute top-[4px] flex h-[24px] items-center text-[10px] font-semibold uppercase tracking-[0.18em] leading-none text-muted-foreground">
                                          {row.title}
                                        </p>
                                        <p className="absolute top-[30px] flex h-[12px] items-center leading-none text-[10px] dark:text-white text-[#1C1B1F]/90">
                                          {row.summary}
                                        </p>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="relative">
                                <div className="relative h-[34px]">
                                  {schedulePhaseSegments.map((segment, idx) => (
                                    <div
                                      key={segment.id}
                                      className="absolute top-0 min-w-0 px-2 text-center"
                                      style={{
                                        left: `${segment.startPct}%`,
                                        width: `${Math.max(0, segment.endPct - segment.startPct)}%`,
                                      }}
                                    >
                                      <p className="text-[10px] font-semibold text-muted-foreground">
                                        {segment.label}
                                      </p>
                                      <p
                                        className={cn(
                                          "mt-1 text-[10px]",
                                          idx === activeSchedulePhaseSegmentIndex
                                            ? "text-primary"
                                            : "dark:text-white text-[#1C1B1F]/90",
                                        )}
                                      >
                                        {segment.rangeLabel}
                                      </p>
                                    </div>
                                  ))}
                                </div>

                                <div className="relative mt-12 h-[214px]">
                                  <div className="absolute inset-y-0 left-0 right-0 border-l border-white/[0.05]" />
                                  {[25, 50, 75].map((leftPct) => (
                                    <div
                                      key={`schedule-divider-${leftPct}`}
                                      className="absolute inset-y-0 border-l border-white/[0.04]"
                                      style={{ left: `${leftPct}%` }}
                                    />
                                  ))}
                                  <div
                                    className="absolute bottom-0 top-[-6px] w-px border-l-2 border-dotted border-[var(--primary)]/60"
                                    style={{ left: `${scheduleMarkerLeftPct}%` }}
                                  />

                                  <div
                                    className="absolute top-[-52px] z-20 -translate-x-1/2"
                                    style={{ left: `${scheduleMarkerLeftPct}%` }}
                                  >
                                    <div className="inline-flex flex-col items-center">
                                      <span className="text-[9px] font-semibold text-muted-foreground">
                                        {scheduleTodayDateLabel}
                                      </span>
                                      <span className="mt-1 rounded-[6px] bg-primary px-2 py-0.5 text-[9px] font-semibold text-white">
                                        TODAY
                                      </span>
                                    </div>
                                  </div>

                                  {visualRows.map((row, rowIndex) => {
                                    const rowTop = rowIndex * 52;
                                    const rowLabelCenterPct =
                                      row.rowStartPct + row.rowWidthPct / 2;
                                    const isOnTrackNote =
                                      String(row.noteLabel || "").trim().toLowerCase() ===
                                      "on track";

                                    return (
                                      <div
                                        key={row.id}
                                        className="absolute left-0 right-0"
                                        style={{ top: `${rowTop}px` }}
                                      >
                                        <div
                                          className={cn(
                                            "absolute top-0 h-[26px] rounded-[14px]",
                                            row.isCompleted
                                              ? "bg-emerald-500/10"
                                              : row.isActive
                                                ? "bg-[var(--primary)]/35"
                                                : "bg-white/[0.06]",
                                          )}
                                          style={{
                                            left: `${row.rowStartPct}%`,
                                            width: `${row.rowWidthPct}%`,
                                          }}
                                        />
                                        <div
                                          className={cn(
                                            "absolute top-[13px] inline-flex -translate-x-1/2 -translate-y-1/2 items-center justify-center whitespace-nowrap rounded-full px-4 py-1 text-[10px] font-semibold",
                                            row.isCompleted
                                              ? "bg-emerald-500/20 text-emerald-300"
                                              : row.isActive
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-white/[0.06] text-zinc-400",
                                          )}
                                          style={{ left: `${rowLabelCenterPct}%` }}
                                        >
                                          {row.rowLabel}
                                        </div>

                                        {row.isCompleted ? (
                                          <div
                                            className="absolute top-[30px] inline-flex items-center gap-1.5 text-[9px] font-semibold text-emerald-300"
                                            style={{
                                              left: `calc(${row.rowStartPct}% + ${Math.max(
                                                1,
                                                row.rowWidthPct - 4,
                                              )}%)`,
                                            }}
                                          >
                                            <span className="inline-flex size-3.5 items-center justify-center rounded-full border border-emerald-400/40">
                                              <span className="size-1.5 rounded-full bg-emerald-400" />
                                            </span>
                                            Done
                                          </div>
                                        ) : row.isScheduled ? (
                                          <div
                                            className="absolute top-[31px] text-[9px] font-semibold text-zinc-500"
                                            style={{
                                              left: `calc(${row.rowStartPct}% + ${Math.max(
                                                1,
                                                row.rowWidthPct - 8,
                                              )}%)`,
                                            }}
                                          >
                                            {row.noteLabel}
                                          </div>
                                        ) : (
                                          <div
                                            className="absolute top-[31px] inline-flex items-center gap-2"
                                            style={{ left: `calc(${row.rowStartPct}% + 2%)` }}
                                          >
                                            <span
                                              className={cn(
                                                "size-1.5 rounded-full",
                                                row.isActive
                                                  ? "bg-[var(--primary)]"
                                                  : "bg-zinc-500/70",
                                              )}
                                            />
                                            <span
                                              className={cn(
                                                "text-[9px] font-semibold uppercase tracking-[0.16em]",
                                                row.isActive
                                                  ? "text-[var(--primary)]"
                                                  : "text-zinc-300",
                                              )}
                                            >
                                              {row.detailLabel}
                                            </span>
                                            {row.noteLabel ? (
                                              <span
                                                className={cn(
                                                  "rounded-[10px] border px-2 py-0.5 text-[9px] font-semibold",
                                                  isOnTrackNote
                                                    ? "border-[var(--primary)]/40 bg-[var(--primary)]/14 text-[var(--primary)]"
                                                    : "border-rose-500/30 bg-rose-500/10 text-rose-300",
                                                )}
                                              >
                                                {row.noteLabel}
                                              </span>
                                            ) : null}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
                        <p className="text-sm font-semibold dark:text-white text-[#1C1B1F]">No active project</p>
                        <p className="mt-2 text-xs text-zinc-400">
                          Project Schedule will appear when an active project is selected.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card className="rounded-[20px] border border-white/[0.08] bg-card shadow-none">
                  <CardContent className="p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Current Status
                    </p>
                    <div className="mt-3 flex items-end justify-between gap-3">
                      <p className="text-[1.35rem] font-semibold tracking-[-0.03em] dark:text-white text-[#1C1B1F]">
                        {statusTone}
                      </p>
                      <p className="text-[11px] font-semibold text-[var(--primary)]">
                        {hasActiveProject ? `${activeScheduleProgressPct}%` : "—"}
                      </p>
                    </div>
                    <div className="mt-3 h-[2px] overflow-hidden rounded-full bg-white/[0.08]">
                      <div
                        className="h-full rounded-full bg-[var(--primary)]"
                        style={{
                          width: `${hasActiveProject ? Math.min(100, activeScheduleProgressPct || 0) : 0}%`,
                        }}
                      />
                    </div>
                    <p className="mt-4 text-[12px] font-medium text-muted-foreground">
                      {statusSub}
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-[20px] border border-white/[0.08] bg-card shadow-none">
                  <CardContent className="p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Time Remaining
                    </p>
                    <p className="mt-3 text-[1.75rem] font-semibold tracking-[-0.03em] dark:text-white text-[#1C1B1F]">
                      {hasActiveProject
                        ? daysRemaining
                          ? `${daysRemaining} Days`
                          : "—"
                        : "No active project"}
                    </p>
                    <p className="mt-2 text-[12px] text-muted-foreground">
                      {hasActiveProject
                        ? `Next payout window: ${nextPayoutSummaryLabel}`
                        : "Next payout window details will appear once a project is active."}
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-[20px] border border-white/[0.08] bg-card shadow-none">
                  <CardContent className="p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Completed Tasks
                    </p>
                    <p className="mt-3 text-[1.75rem] font-semibold tracking-[-0.03em] dark:text-white text-[#1C1B1F]">
                      {hasActiveProject ? `${completed}/${total}` : "No active project"}
                    </p>
                    <div className="mt-3 flex items-center gap-1">
                      {Array.from({ length: dotCount }).map((_, index) => (
                        <span
                          key={`schedule-complete-dot-${index}`}
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            hasActiveProject && index < dotsOn
                              ? "bg-[var(--primary)]"
                              : "bg-white/[0.18]",
                          )}
                        />
                      ))}
                    </div>
                    <p className="mt-3 text-[12px] text-muted-foreground">
                      {hasActiveProject
                        ? "Cleared payouts vs. tracked payout sources."
                        : "Task completion summary appears when an active project is available."}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </FreelancerDashboardPanel>
    </section>
  );
};

export default DeliveryPipeline;
