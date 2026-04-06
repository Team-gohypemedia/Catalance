import React from "react";
import CalendarDays from "lucide-react/dist/esm/icons/calendar-days";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import FolderKanban from "lucide-react/dist/esm/icons/folder-kanban";
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { cn } from "@/shared/lib/utils";
import { DashboardPanel } from "./shared.jsx";
import {
  buildProjectProgressTimeline,
  createProjectProgressDefaultDateRange,
  formatProjectProgressStageValue,
  formatProjectProgressTriggerLabel,
  projectProgressCurveTemplates,
  projectProgressFilterPresets,
  projectProgressSeriesPalette,
  resolveProjectProgressCurveValue,
  resolveProjectProgressStageLabel,
  resolveProjectProgressStageLevel,
  resolveProjectProgressVisibleMarkerTypes,
} from "./ProjectProgress.helpers.js";

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

const ProjectProgressTodayLabel = ({ viewBox }) => {
  const x = Number(viewBox?.x);
  const y = Number(viewBox?.y);

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={-24} y={8} width={48} height={20} rx={4} fill="#ffd400" />
      <text x={0} y={22} textAnchor="middle" fill="#171717" fontSize="10" fontWeight="700">
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

  if (highlightToday && payload?.isToday) {
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
          const stageLabel =
            point?.[`${entry.dataKey}StageLabel`] ||
            formatProjectProgressStageValue(entry.value);

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
              <span className="shrink-0 text-xs font-semibold text-white">{stageLabel}</span>
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

      const curveRatio = lastVisibleIndex <= 0 ? 1 : pointIndex / Math.max(lastVisibleIndex, 1);
      const curveFactor = resolveProjectProgressCurveValue(curveTemplate, curveRatio);
      return Number((1 + (finalStageLevel - 1) * curveFactor).toFixed(3));
    });

    return {
      key: `project-series-${index}`,
      color: palette.color,
      label: entry.label,
      finalStageLabel: resolveProjectProgressStageLabel(entry, finalStageLevel),
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
      row[`${entry.key}StageLabel`] = index === lastVisibleIndex ? entry.finalStageLabel : null;
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
                    entry.key === seriesMeta[0]?.key ? `0 0 10px ${entry.color}` : "none",
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
  const [customDateRange, setCustomDateRange] = React.useState(() =>
    createProjectProgressDefaultDateRange(new Date()),
  );
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
  const visibleProjects = isOverallView ? projects : activeProject ? [activeProject] : [];
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
        <ProjectProgressChartCard
          project={activeProject}
          visibleProjects={visibleProjects}
          isOverallView={isOverallView}
          filterMode={dateFilterMode}
          customDateRange={customDateRange}
          onViewProject={onViewProject}
        />
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
