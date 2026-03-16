"use client";

import React from "react";
import BriefcaseBusiness from "lucide-react/dist/esm/icons/briefcase-business";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import ClipboardList from "lucide-react/dist/esm/icons/clipboard-list";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import FolderKanban from "lucide-react/dist/esm/icons/folder-kanban";
import MessageSquareText from "lucide-react/dist/esm/icons/message-square-text";
import Plus from "lucide-react/dist/esm/icons/plus";
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

const runningProjectStatusToneMap = {
  success: "border-[#14532d] bg-[#0c2616] text-[#34d399]",
  warning: "border-[#5a3b0d] bg-[#2f1e05] text-[#fbbf24]",
  slate: "border-white/[0.08] bg-white/[0.04] text-[#cbd5e1]",
  amber: "border-[#5a4304] bg-[#312404] text-[#facc15]",
};

const runningProjectButtonToneMap = {
  amber: "bg-[#ffc107] text-black hover:bg-[#ffd54f] disabled:bg-[#ffc107]/70",
  slate: "bg-white/[0.08] text-white hover:bg-white/[0.12] disabled:bg-white/[0.08]",
  success: "bg-[#14311f] text-[#dcfce7] hover:bg-[#194428] disabled:bg-[#14311f]",
  warning: "bg-[#3a2607] text-[#fde68a] hover:bg-[#53350a] disabled:bg-[#3a2607]",
};

const runningProjectProgressTextToneMap = {
  success: "text-[#34d399]",
  warning: "text-[#fbbf24]",
  slate: "text-[#cbd5e1]",
  amber: "text-[#facc15]",
};

const fallbackProgressProjects = [
  {
    id: "project-1",
    progressCategory: "completed",
    label: "Project 1",
    calloutLabel: "Phase 2",
    calloutValue: "40%",
    calloutDetail: "2 tasks pending",
    highlightIndex: 1,
    phases: [
      { label: "Phase 1", value: 8 },
      { label: "Phase 2", value: 40 },
      { label: "Phase 3", value: 72 },
      { label: "Phase 4", value: 100 },
    ],
  },
  {
    id: "project-2",
    progressCategory: "ongoing",
    label: "Project 2",
    calloutLabel: "Phase 3",
    calloutValue: "55%",
    calloutDetail: "3 reviews pending",
    highlightIndex: 2,
    phases: [
      { label: "Phase 1", value: 10 },
      { label: "Phase 2", value: 28 },
      { label: "Phase 3", value: 55 },
      { label: "Phase 4", value: 88 },
    ],
  },
  {
    id: "project-3",
    progressCategory: "ongoing",
    label: "Project 3",
    calloutLabel: "Phase 3",
    calloutValue: "72%",
    calloutDetail: "Ready for delivery",
    highlightIndex: 2,
    phases: [
      { label: "Phase 1", value: 12 },
      { label: "Phase 2", value: 35 },
      { label: "Phase 3", value: 72 },
      { label: "Phase 4", value: 94 },
    ],
  },
];

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

  return (
    <DashboardPanel className="min-h-[110px] border-transparent bg-accent p-5">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-[#9ca3af]">
            <Icon className="size-4" />
          </div>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#6b7280]">
            {item.title}
          </p>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-[1.75rem] font-semibold leading-none tracking-[-0.02em] text-white">
            {item.value}
          </p>
          {item.detail ? (
            <p className="text-xs text-[#6b7280]">{item.detail}</p>
          ) : null}
        </div>
      </div>
    </DashboardPanel>
  );
};

const CreateProposalCard = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex min-h-[128px] w-full flex-col items-center justify-center gap-3 rounded-[28px] border border-transparent bg-accent px-6 py-6 text-center transition-colors hover:border-primary/60 hover:bg-accent/90"
  >
    <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
      <Plus className="size-5" />
    </div>
    <p className="text-[1.35rem] font-semibold leading-tight tracking-[-0.03em] text-white">
      Create New Proposal
    </p>
    <p className="text-sm leading-5 text-[#94a3b8]">Start a new project</p>
  </button>
);

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

const RunningProjectMilestone = ({ item }) => {
  const isComplete = item.state === "complete";
  const isCurrent = item.state === "current";

  return (
    <div className="flex items-center gap-3">
      {isComplete ? (
        <CheckCircle2 className="size-5 shrink-0 fill-[#ffc107] text-[#ffc107]" />
      ) : isCurrent ? (
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-[#ffc107]/50">
          <span className="size-1.5 rounded-full bg-[#ffc107]" />
        </span>
      ) : (
        <span className="size-5 shrink-0 rounded-full border border-white/[0.1]" />
      )}

      <span
        className={cn(
          "text-[0.98rem] leading-6",
          isComplete || isCurrent ? "text-[#f3f4f6]" : "text-[#6b7280]",
        )}
      >
        {item.label}
      </span>
    </div>
  );
};

const RunningProjectCard = ({ item }) => {
  const progressValue = Math.max(0, Math.min(100, Number(item.progressValue) || 0));
  const handleAction = item.onAction || item.onClick;

  return (
    <article className="flex h-full flex-col rounded-[28px] border border-white/[0.06] bg-accent p-5 backdrop-blur-[10px] transition-transform duration-200 hover:-translate-y-1">
      <button
        type="button"
        onClick={item.onClick}
        className="flex flex-1 flex-col text-left"
      >
        <div className="flex items-start justify-between gap-4">
          <span className="rounded-[8px] bg-white/[0.06] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#9ca3af]">
            {item.sectionLabel || "Active Project"}
          </span>

          <span
            className={cn(
              "inline-flex rounded-full border px-3 py-1 text-[0.82rem] font-semibold",
              runningProjectStatusToneMap[item.statusTone] || runningProjectStatusToneMap.slate,
            )}
          >
            {item.statusLabel || "Open"}
          </span>
        </div>

        <h3 className="mt-5 text-[clamp(1.55rem,2vw,2rem)] font-semibold tracking-[-0.04em] text-white">
          {item.title}
        </h3>

        <div className="mt-6 flex items-center gap-3">
          <Avatar className="size-11 shrink-0 border border-white/10 shadow-[0_12px_24px_rgba(0,0,0,0.24)]">
            <AvatarImage src={item.personAvatar} alt={item.personName} />
            <AvatarFallback className="bg-[#1f2937] text-sm text-white">
              {item.personInitial || "C"}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <p className="truncate text-[1rem] font-medium text-white">
              {item.personName || "Catalance Workspace"}
            </p>
            <p className="truncate text-sm text-[#8f96a3]">
              {item.personRole || "Project workspace"}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-[14px] border border-white/[0.05] bg-black/20 p-4">
            <p className="text-[0.76rem] uppercase tracking-[0.16em] text-[#7f8794]">
              {item.budgetLabel || "Budget"}
            </p>
            <p className="mt-3 text-[1.1rem] font-semibold tracking-[-0.02em] text-white">
              {item.budgetValue || "Flexible"}
            </p>
          </div>

          <div className="rounded-[14px] border border-white/[0.05] bg-black/20 p-4">
            <p className="text-[0.76rem] uppercase tracking-[0.16em] text-[#7f8794]">
              {item.dateLabel || "Timeline"}
            </p>
            <p className="mt-3 text-[1.1rem] font-semibold tracking-[-0.02em] text-white">
              {item.dateValue || "To be finalized"}
            </p>
          </div>
        </div>

        <div className="mt-7 flex items-center justify-between gap-3">
          <span className="text-sm text-[#9ca3af]">Overall Progress</span>
          <span
            className={cn(
              "text-sm font-semibold",
              runningProjectProgressTextToneMap[item.statusTone] ||
                runningProjectProgressTextToneMap.slate,
            )}
          >
            {item.progressText || `${progressValue}%`}
          </span>
        </div>

        <div className="mt-3 h-2 rounded-full bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.92),rgba(255,255,255,0.62))]"
            style={{ width: `${progressValue}%` }}
          />
        </div>

        <div className="mt-6 space-y-3">
          {(item.milestones || []).map((milestone) => (
            <RunningProjectMilestone
              key={`${item.id}-${milestone.label}`}
              item={milestone}
            />
          ))}
        </div>
      </button>

      <button
        type="button"
        disabled={item.actionDisabled}
        onClick={handleAction}
        className={cn(
          "mt-6 rounded-[14px] px-4 py-3.5 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-80",
          runningProjectButtonToneMap[item.buttonTone] || runningProjectButtonToneMap.slate,
        )}
      >
        {item.buttonLabel || "View Project"}
      </button>
    </article>
  );
};

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

const ProjectProgressChartCard = ({
  project,
  onViewProject,
  activeProgressTab,
  onChangeProgressTab,
}) => {
  const chartWidth = 960;
  const chartHeight = 360;
  const leftPadding = 74;
  const rightPadding = 34;
  const topPadding = 36;
  const bottomPadding = 66;
  const usableWidth = chartWidth - leftPadding - rightPadding;
  const usableHeight = chartHeight - topPadding - bottomPadding;

  const chartPoints = project.phases.map((phase, index) => {
    const x =
      leftPadding +
      (index / Math.max(project.phases.length - 1, 1)) * usableWidth;
    const y = topPadding + ((100 - phase.value) / 100) * usableHeight;
    return { ...phase, x, y };
  });

  const polylinePoints = chartPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const highlightPoint =
    chartPoints[project.highlightIndex] || chartPoints[Math.min(1, chartPoints.length - 1)];
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
        <div className="mb-3 flex justify-end">
          <div className="inline-flex h-auto w-fit flex-wrap gap-2 rounded-full border border-white/[0.14] bg-white/[0.08] p-1.5">
            <button
              type="button"
              onClick={() => onChangeProgressTab("ongoing")}
              className={cn(
                "inline-flex min-w-[128px] items-center justify-center rounded-full border border-transparent px-4 py-2 text-sm font-semibold transition-colors",
                activeProgressTab === "ongoing"
                  ? "bg-white text-[#171717]"
                  : "text-[#a6b0c0] hover:bg-white/[0.12] hover:text-white",
              )}
            >
              Ongoing
            </button>
            <button
              type="button"
              onClick={() => onChangeProgressTab("completed")}
              className={cn(
                "inline-flex min-w-[128px] items-center justify-center rounded-full border border-transparent px-4 py-2 text-sm font-semibold transition-colors",
                activeProgressTab === "completed"
                  ? "bg-white text-[#171717]"
                  : "text-[#a6b0c0] hover:bg-white/[0.12] hover:text-white",
              )}
            >
              Completed
            </button>
          </div>
        </div>

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

            {chartPoints.map((point) => (
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

            {chartPoints.map((point) => (
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

            {chartPoints.map((point) => (
              <text
                key={`${point.label}-axis`}
                x={point.x}
                y={chartHeight - 18}
                textAnchor="middle"
                fill="#d4d4d4"
                fontSize="14"
                fontWeight="500"
              >
                {point.label}
              </text>
            ))}
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

const ProjectProgressSection = ({ progressProjects, onViewProject }) => {
  const projects = progressProjects?.length ? progressProjects : fallbackProgressProjects;
  const resolveCategory = React.useCallback((project) => {
    const rawCategory = String(
      project?.progressCategory || project?.status || "",
    ).toLowerCase();

    if (rawCategory === "completed") {
      return "completed";
    }

    if (rawCategory === "ongoing") {
      return "ongoing";
    }

    const finalPhaseValue = Number(project?.phases?.[project.phases.length - 1]?.value || 0);
    return finalPhaseValue >= 100 ? "completed" : "ongoing";
  }, []);

  const [activeProgressTab, setActiveProgressTab] = React.useState(
    projects.some((project) => resolveCategory(project) === "ongoing")
      ? "ongoing"
      : "completed",
  );
  const filteredProjects = React.useMemo(
    () => projects.filter((project) => resolveCategory(project) === activeProgressTab),
    [activeProgressTab, projects, resolveCategory],
  );
  const [activeProjectId, setActiveProjectId] = React.useState(filteredProjects[0]?.id || "");

  React.useEffect(() => {
    if (!filteredProjects.length) {
      setActiveProjectId("");
      return;
    }

    if (!filteredProjects.some((project) => project.id === activeProjectId)) {
      setActiveProjectId(filteredProjects[0]?.id || "");
    }
  }, [activeProjectId, filteredProjects]);

  const activeProject =
    filteredProjects.find((project) => project.id === activeProjectId) || filteredProjects[0];
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
              Track the progress of project phases that require your attention.
            </p>
          </div>

          {filteredProjects.length > 0 ? (
            <TabsList className="h-auto flex-wrap gap-2 rounded-full border border-white/[0.08] bg-accent p-1.5">
              {filteredProjects.map((project) => (
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

        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <TabsContent key={project.id} value={project.id} className="mt-3">
              <ProjectProgressChartCard
                project={project}
                onViewProject={onViewProject}
                activeProgressTab={activeProgressTab}
                onChangeProgressTab={setActiveProgressTab}
              />
            </TabsContent>
          ))
        ) : (
          <DashboardPanel className="mt-3 flex min-h-[220px] items-center justify-center p-8 text-center">
            <div className="max-w-md">
              <p className="text-[1.35rem] font-semibold tracking-[-0.03em] text-white">
                No {activeProgressTab} projects yet
              </p>
              <p className="mt-3 text-sm leading-6 text-[#94a3b8]">
                {activeProgressTab === "completed"
                  ? "Completed projects will appear here once milestones are fully closed."
                  : "Ongoing projects will appear here once work has started."}
              </p>
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
            <OverviewMetricCard key={item.title} item={item} />
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
              Running Projects
            </h2>
            <span className="size-[15px] rounded-full bg-[#10b981]/10 p-[4.5px]">
              <span className="block size-[6px] rounded-full bg-[#10b981]" />
            </span>
          </div>

          {showcaseItems.length > 0 ? (
            <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
              {showcaseItems.map((item) => (
                <RunningProjectCard key={item.id} item={item} />
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

        <ProjectProgressSection progressProjects={progressProjects} onViewProject={onViewProject || onOpenViewProjects} />
      </main>

      <ClientDashboardFooter variant="workspace" />
    </div>
  </div>
);

export default ClientDashboardShell;
