"use client";

import React from "react";
import BriefcaseBusiness from "lucide-react/dist/esm/icons/briefcase-business";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import ClipboardList from "lucide-react/dist/esm/icons/clipboard-list";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import FolderKanban from "lucide-react/dist/esm/icons/folder-kanban";
import MessageSquareText from "lucide-react/dist/esm/icons/message-square-text";
import Repeat2 from "lucide-react/dist/esm/icons/repeat-2";
import ShieldAlert from "lucide-react/dist/esm/icons/shield-alert";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Star from "lucide-react/dist/esm/icons/star";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import Users from "lucide-react/dist/esm/icons/users";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClientDashboardFooter from "@/components/features/client/ClientDashboardFooter";
import { ProjectProposalCard } from "@/components/features/client/ClientProjects";
import ClientWorkspaceHeader from "@/components/features/client/ClientWorkspaceHeader";
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

const DashboardPanel = ({ className, children }) => (
  <div
    className={cn(
      "rounded-[28px] border border-white/[0.06] bg-[#232323]/90 backdrop-blur-[10px]",
      className,
    )}
  >
    {children}
  </div>
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
              className="inline-flex h-6 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.03] px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#94a3b8] transition-colors hover:border-primary/70 hover:text-primary"
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
              <Repeat2 className="size-3" />
              Switch
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

const InterestedFreelancerRow = ({ item }) => (
  <div className="flex items-start gap-3.5">
    <Avatar className="mt-0.5 size-10 shrink-0 border border-white/10 shadow-[0_10px_24px_rgba(0,0,0,0.2)]">
      <AvatarImage src={item.avatar} alt={item.name} />
      <AvatarFallback className="bg-[#1e293b] text-sm text-white">
        {item.initial}
      </AvatarFallback>
    </Avatar>

    <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr),132px] grid-rows-[auto,auto,auto] gap-x-3.5 gap-y-1">
      <p className="col-start-1 row-start-1 min-w-0 truncate text-[1.08rem] font-semibold leading-[1.05] tracking-[-0.03em] text-white">
        {item.name}
      </p>

      <p className="col-start-1 row-start-2 min-w-0 truncate self-end text-[12px] leading-none text-[#8a8a8a]">
        {item.role}
      </p>

      <p className="col-start-2 row-start-2 self-end pt-0.5 text-right text-[15px] font-semibold leading-none tracking-[-0.01em] text-white">
        {item.rateLabel}
        {item.rateSuffix ? (
          <span className="ml-0.5 text-[15px] font-normal text-[#8a8a8a]">{item.rateSuffix}</span>
        ) : null}
      </p>

      <div className="col-start-1 row-start-3 flex min-w-0 items-center gap-1.5 text-[12px] leading-none text-[#8f8f8f]">
        <Star className="size-[12px] fill-[#ffc107] text-[#ffc107]" />
        <span className="font-semibold text-white">{item.rating}</span>
        <span className="text-[#64748b]">&bull;</span>
        <span>{item.projectsLabel}</span>
      </div>

      <div className="col-start-2 row-start-3 flex items-center justify-end gap-2 self-center">
        <button
          type="button"
          onClick={item.onView}
          className="inline-flex h-7 min-w-[50px] items-center justify-center rounded-[8px] bg-white/[0.08] px-3 text-[12px] font-semibold text-white transition-colors hover:bg-white/[0.14]"
        >
          View
        </button>

        <button
          type="button"
          onClick={item.onMessage}
          className="inline-flex h-7 min-w-[88px] items-center justify-center rounded-[8px] bg-white px-3 text-[11px] font-bold uppercase tracking-[0.01em] text-black transition-colors hover:bg-[#f2f2f2]"
        >
          MESSAGE
        </button>
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

const ProjectProgressChartCard = ({
  project,
  onViewProject,
}) => {
  const chartWidth = 960;
  const chartHeight = 388;
  const leftPadding = 74;
  const rightPadding = 34;
  const topPadding = 36;
  const bottomPadding = 88;
  const usableWidth = chartWidth - leftPadding - rightPadding;
  const usableHeight = chartHeight - topPadding - bottomPadding;

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

  if (project?.isProgressLocked) {
    return <ProjectProgressLockedCard project={project} onViewProject={onViewProject} />;
  }

  const chartPoints = normalizedPhases.map((phase, index) => {
    const x =
      leftPadding +
      (index / Math.max(normalizedPhases.length - 1, 1)) * usableWidth;
    const y = topPadding + ((100 - phase.value) / 100) * usableHeight;
    return { ...phase, index, x, y };
  });

  const activePhaseIndex = Math.min(
    Number.isFinite(project?.currentPhaseIndex)
      ? project.currentPhaseIndex
      : project?.highlightIndex || 0,
    Math.max(chartPoints.length - 1, 0),
  );
  const visibleChartPoints = chartPoints.slice(0, activePhaseIndex + 1);
  const basePolylinePoints = chartPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const polylinePoints = visibleChartPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const highlightPoint =
    visibleChartPoints[visibleChartPoints.length - 1] || chartPoints[0];
  const isNearRightEdge = highlightPoint.x >= chartWidth - rightPadding - 48;
  const isNearLeftEdge = highlightPoint.x <= leftPadding + 48;
  const isNearTopEdge = highlightPoint.y <= topPadding + 24;
  const verticalTransform = isNearTopEdge ? "translateY(16px)" : "translateY(-105%)";
  const calloutStyle = isNearRightEdge
    ? {
        right: "16px",
        top: `${(highlightPoint.y / chartHeight) * 100}%`,
        transform: verticalTransform,
      }
    : isNearLeftEdge
      ? {
          left: "16px",
          top: `${(highlightPoint.y / chartHeight) * 100}%`,
          transform: verticalTransform,
        }
      : {
          left: `${(highlightPoint.x / chartWidth) * 100}%`,
          top: `${(highlightPoint.y / chartHeight) * 100}%`,
          transform: isNearTopEdge ? "translate(-50%, 16px)" : "translate(-50%, -105%)",
        };

  return (
    <Card className="overflow-hidden rounded-[28px] border border-white/[0.06] bg-accent text-white shadow-none backdrop-blur-[10px]">
      <CardContent className="px-4 py-5 sm:px-6">
        <div className="relative">
          <Card
            className="pointer-events-none absolute min-w-[156px] rounded-[24px] border border-white/[0.08] bg-[linear-gradient(90deg,rgba(255,255,255,0.05),rgba(255,255,255,0.01),rgba(255,255,255,0.05))] px-5 py-4 text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
            style={calloutStyle}
          >
            <p className="text-[2rem] font-semibold leading-none tracking-[-0.04em] text-white">
              {project.calloutLabel}
            </p>
            <p className="mt-2 text-[1.2rem] font-semibold text-[#ffc107]">
              {project.calloutValue}
              <span className="ml-2 text-sm font-medium text-[#94a3b8]">
                {project.calloutDetail}
              </span>
            </p>
          </Card>

          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-full w-full">
            {[100, 80, 60, 40, 20, 0].map((value) => {
              const y = topPadding + ((100 - value) / 100) * usableHeight;
              return (
                <g key={value}>
                  <line
                    x1={leftPadding}
                    y1={y}
                    x2={chartWidth - rightPadding}
                    y2={y}
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="1"
                  />
                  <text
                    x={18}
                    y={y + 5}
                    fill="#a3a3a3"
                    fontSize="14"
                    fontWeight="500"
                  >
                    {value}%
                  </text>
                </g>
              );
            })}

            <polyline
              points={basePolylinePoints}
              fill="none"
              stroke="rgba(255,255,255,0.28)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {visibleChartPoints.map((point) => (
              <line
                key={`${point.label}-grid`}
                x1={point.x}
                y1={point.y}
                x2={point.x}
                y2={chartHeight - bottomPadding}
                stroke="rgba(255,255,255,0.16)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            ))}

            <polyline
              points={polylinePoints}
              fill="none"
              stroke="#facc15"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {visibleChartPoints.map((point) => (
              <circle
                key={point.label}
                cx={point.x}
                cy={point.y}
                r="8"
                fill="#facc15"
                stroke="#292929"
                strokeWidth="3"
              />
            ))}

            <line
              x1={leftPadding}
              y1={chartHeight - bottomPadding}
              x2={chartWidth - rightPadding}
              y2={chartHeight - bottomPadding}
              stroke="rgba(255,255,255,0.14)"
              strokeWidth="1"
            />

            {chartPoints.map((point) => {
              const isCompletedPhase = point.index < activePhaseIndex;
              const isCurrentPhase = point.index === activePhaseIndex;
              const isFirstPhase = point.index === 0;
              const isLastPhase = point.index === chartPoints.length - 1;
              const phaseLabel = truncatePhaseLabel(point.label, 24);
              const phaseSubLabel = truncatePhaseSubLabel(point.subLabel);
              const labelX = isFirstPhase ? point.x - 8 : isLastPhase ? point.x + 8 : point.x;
              const labelAnchor = isFirstPhase ? "start" : isLastPhase ? "end" : "middle";

              return (
                <g key={`${point.label}-axis`}>
                  <text
                    x={labelX}
                    y={phaseSubLabel ? chartHeight - 38 : chartHeight - 22}
                    textAnchor={labelAnchor}
                    fill={
                      isCurrentPhase
                        ? "#f3f4f6"
                        : isCompletedPhase
                          ? "#d4d4d4"
                          : "#8b95a5"
                    }
                    fontSize="11"
                    fontWeight="600"
                  >
                    {phaseLabel}
                  </text>
                  {phaseSubLabel ? (
                    <text
                      x={labelX}
                      y={chartHeight - 18}
                      textAnchor={labelAnchor}
                      fill={
                        isCurrentPhase
                          ? "#facc15"
                          : isCompletedPhase
                            ? "#94a3b8"
                            : "#6b7280"
                      }
                      fontSize="9"
                      fontWeight="500"
                    >
                      {phaseSubLabel}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-3 border-t border-white/[0.05] px-4 py-5 text-[#d4d4d4] sm:px-6">
        <Badge
          variant="outline"
          className="gap-3 border-0 bg-transparent px-0 py-0 text-sm font-medium text-[#d4d4d4] shadow-none"
        >
          <span aria-hidden="true" className="size-3 rounded-full bg-[#facc15]" />
          Milestones
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
  const [activeProjectId, setActiveProjectId] = React.useState(projects[0]?.id || "");

  React.useEffect(() => {
    if (!projects.length) {
      setActiveProjectId("");
      return;
    }

    if (!projects.some((project) => project.id === activeProjectId)) {
      setActiveProjectId(projects[0]?.id || "");
    }
  }, [activeProjectId, projects]);

  const activeProject =
    projects.find((project) => project.id === activeProjectId) || projects[0];
  const activeTabsValue = activeProject?.id || "";

  return (
    <section className="mt-16">
      <Tabs value={activeTabsValue} onValueChange={setActiveProjectId} className="gap-0">
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
            <TabsList className="h-auto flex-wrap gap-2 rounded-full border border-white/[0.08] bg-accent p-1.5">
              {projects.map((project) => (
                <TabsTrigger
                  key={project.id}
                  value={project.id}
                  className="rounded-full border border-transparent px-5 py-2 text-sm text-[#8f96a3] shadow-none transition-colors data-[state=active]:border-transparent data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:shadow-none hover:text-white"
                >
                  {project.label}
                </TabsTrigger>
              ))}
            </TabsList>
          ) : null}
        </div>

        {projects.length > 0 ? (
          projects.map((project) => (
            <TabsContent key={project.id} value={project.id} className="mt-3">
              <ProjectProgressChartCard project={project} onViewProject={onViewProject} />
            </TabsContent>
          ))
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
      </Tabs>
    </section>
  );
};

const ClientDashboardShell = ({
  profile,
  metrics,
  showcaseItems,
  recentActivities,
  hero,
  unreadCount,
  draftProposalRows = [],
  interestedFreelancers = [],
  interestedFreelancersCount = 0,
  progressProjects = [],
  onSiteNav,
  onDashboardNav,
  onOpenNotifications,
  onOpenProfile,
  onOpenQuickProject,
  onOpenViewProposals,
  onOpenViewProjects,
  onOpenHireFreelancer,
  onPayRunningProject,
  runningProjectProcessingId = null,
  onViewProject,
}) => (
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

        {showcaseItems.length === 0 ? (
          <section className="mt-14">
            <DraftProposalsPanel
              draftProposalRows={draftProposalRows}
              onOpenQuickProject={onOpenQuickProject}
            />
          </section>
        ) : null}

        <section className="mt-14">
          <div className="mb-6 flex items-center gap-3">
            <h2 className="text-[1.7rem] font-semibold tracking-[-0.04em] text-white">
              Active Projects
            </h2>
            <span className="size-[15px] rounded-full bg-[#10b981]/10 p-[4.5px]">
              <span className="block size-[6px] rounded-full bg-[#10b981]" />
            </span>
          </div>

          {showcaseItems.length > 0 ? (
            <div className="grid items-start gap-7 md:grid-cols-2 xl:grid-cols-3">
              {showcaseItems.map((item) => (
                <ProjectProposalCard
                  key={item.id}
                  project={item}
                  onPay={onPayRunningProject}
                  isPaying={runningProjectProcessingId === item.id}
                />
              ))}
            </div>
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
            {showcaseItems.length > 0 ? (
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
                Interested Freelancers
              </h2>
              <p className="mt-2 text-[14px] leading-5 text-[#8f8f8f]">
                Have shown interest in the brief.
              </p>

              {interestedFreelancers.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                  <div className="flex size-14 items-center justify-center rounded-full bg-white/[0.06] text-[#94a3b8]">
                    <Users className="size-6" />
                  </div>
                  <p className="mt-5 text-sm text-white">No interested freelancers yet</p>
                  <p className="mt-2 max-w-[220px] text-xs text-[#8f8f8f]">
                    Invite talent from the marketplace to populate this list.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mt-8 space-y-[30px]">
                    {interestedFreelancers.map((item) => (
                      <InterestedFreelancerRow key={item.id} item={item} />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={onOpenHireFreelancer}
                    className="mt-9 flex w-full items-center justify-center gap-2 text-[13px] font-bold uppercase tracking-[0.16em] text-[#8f8f8f] transition-colors hover:text-white"
                  >
                    <span>View All ({interestedFreelancersCount || interestedFreelancers.length})</span>
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

      <ClientDashboardFooter variant="workspace" />
    </div>
  </div>
);

export default ClientDashboardShell;
