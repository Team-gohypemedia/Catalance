"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Circle from "lucide-react/dist/esm/icons/circle";
import ClipboardList from "lucide-react/dist/esm/icons/clipboard-list";
import Clock3 from "lucide-react/dist/esm/icons/clock-3";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import { Link, useSearchParams } from "react-router-dom";

import { FreelancerTopBar } from "@/components/features/freelancer/FreelancerTopBar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/shared/context/AuthContext";
import { getSopFromTitle } from "@/shared/data/sopTemplates";
import { formatINR, getFreelancerVisibleBudgetValue } from "@/shared/lib/currency";
import { cn } from "@/shared/lib/utils";

const PROJECT_PROGRESS_BY_STATUS = Object.freeze({
  COMPLETED: 100,
  IN_PROGRESS: 48,
  OPEN: 24,
  DRAFT: 14,
});

const projectStatusToneMap = {
  success: "border-[#14532d] bg-[#0c2616] text-[#34d399]",
  warning: "border-[#5a3b0d] bg-[#2f1e05] text-[#fbbf24]",
  slate: "border-white/[0.08] bg-white/[0.04] text-[#cbd5e1]",
};

const projectActionToneMap = {
  amber: "bg-[#ffc107] text-black hover:bg-[#ffd54f]",
  slate: "bg-white/[0.08] text-white hover:bg-white/[0.12]",
};

const projectFilterOptions = [
  { key: "ongoing", label: "Ongoing Projects" },
  { key: "completed", label: "Completed Projects" },
];

const getInitials = (value = "") => {
  const parts = String(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "C";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const formatProjectDate = (value) => {
  if (!value) return "";

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "";

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getFirstNonEmptyText = (...values) => {
  for (const value of values.flat()) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }

  return "";
};

const escapeRegExp = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const extractLabeledValue = (value = "", labels = []) => {
  const source = String(value || "");
  if (!source) return "";

  for (const label of labels) {
    const match = source.match(
      new RegExp(`${escapeRegExp(label)}[:\\s\\-\\n\\u2022]*([^\\n]+)`, "i"),
    );
    const extracted = match?.[1]?.trim();
    if (extracted) return extracted;
  }

  return "";
};

const cleanDisplayText = (value = "") =>
  String(value || "")
    .replace(/\s*#+\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeComparableText = (value = "") =>
  String(value || "").trim().toLowerCase();

const toDisplayTitleCase = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/(^|[\s/-])([a-z])/g, (match, prefix, char) => `${prefix}${char.toUpperCase()}`);

const normalizeTimelineValue = (value = "") => {
  const normalizedValue = cleanDisplayText(value);
  if (!normalizedValue) return "";

  const parsedDate = new Date(normalizedValue);
  if (!Number.isNaN(parsedDate.getTime())) {
    return formatProjectDate(normalizedValue);
  }

  return normalizedValue;
};

const resolveProjectBusinessName = (project = {}, acceptedProposal = null) =>
  getFirstNonEmptyText(
    project?.businessName,
    project?.companyName,
    acceptedProposal?.businessName,
    acceptedProposal?.companyName,
    extractLabeledValue(project?.description || "", [
      "Business Name",
      "Company Name",
      "Brand Name",
    ]),
    extractLabeledValue(
      acceptedProposal?.coverLetter || acceptedProposal?.description || "",
      ["Business Name", "Company Name", "Brand Name"],
    ),
  );

const resolveProjectServiceType = (project = {}, acceptedProposal = null) =>
  getFirstNonEmptyText(
    project?.service,
    project?.serviceName,
    project?.serviceKey,
    project?.category,
    acceptedProposal?.service,
    acceptedProposal?.serviceName,
    acceptedProposal?.serviceKey,
    acceptedProposal?.category,
    extractLabeledValue(project?.description || "", [
      "Service Type",
      "Service",
      "Category",
    ]),
    extractLabeledValue(
      acceptedProposal?.coverLetter || acceptedProposal?.description || "",
      ["Service Type", "Service", "Category"],
    ),
    project?.title,
  );

const resolveProjectTimelineMeta = (project = {}, acceptedProposal = null) => {
  const timelineText = getFirstNonEmptyText(
    project?.timeline,
    acceptedProposal?.timeline,
    extractLabeledValue(project?.description || "", ["Timeline"]),
    extractLabeledValue(
      acceptedProposal?.coverLetter || acceptedProposal?.description || "",
      ["Timeline"],
    ),
  );

  if (timelineText) {
    return {
      label: "Timeline",
      value: normalizeTimelineValue(timelineText),
    };
  }

  const deadlineText = getFirstNonEmptyText(
    project?.deadline,
    project?.dueDate,
    project?.targetDate,
    acceptedProposal?.deadline,
  );

  return {
    label: deadlineText ? "Deadline" : "Timeline",
    value: normalizeTimelineValue(deadlineText),
  };
};

const toTaskIdArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item || "").trim()).filter(Boolean);
      }
    } catch {
      return [];
    }
  }

  return [];
};

const clampProgress = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

const resolveProjectProgress = (project) => {
  const explicitProgress = Number(project?.progress);
  if (Number.isFinite(explicitProgress) && explicitProgress > 0) {
    return clampProgress(explicitProgress);
  }

  return PROJECT_PROGRESS_BY_STATUS[project?.rawStatus] ?? 18;
};

const resolveProjectStatusMeta = (project) => {
  const progressValue = resolveProjectProgress(project);

  if (project?.rawStatus === "COMPLETED" || progressValue >= 100) {
    return { label: "Completed", tone: "success" };
  }

  if (progressValue > 0) {
    return { label: "In Progress", tone: "warning" };
  }

  return { label: "Starting Soon", tone: "slate" };
};

const resolvePhaseSummary = (phaseLike, fallbackLabel = "Upcoming") => {
  const explicitSummary = [
    phaseLike?.subLabel,
    phaseLike?.subtitle,
    phaseLike?.detail,
    phaseLike?.description,
    phaseLike?.summary,
  ].find((value) => typeof value === "string" && value.trim());

  if (explicitSummary) {
    return explicitSummary.trim();
  }

  const totalTasks = Math.max(0, Number(phaseLike?.totalTasks || phaseLike?.taskCount || 0));
  const completedTasks = Math.max(
    0,
    Number(phaseLike?.verifiedTasks ?? phaseLike?.completedTasks ?? phaseLike?.doneTasks ?? 0),
  );

  if (totalTasks > 0) {
    return `${Math.min(completedTasks, totalTasks)}/${totalTasks} tasks done`;
  }

  return fallbackLabel;
};

const buildDefaultPhases = (count = 4) =>
  Array.from({ length: Math.max(1, count) }, (_, index) => ({
    label: `Phase ${index + 1}`,
    value: Math.round(((index + 1) / Math.max(count, 1)) * 100),
  }));

const buildProjectPhaseSteps = (project) => {
  const sop = getSopFromTitle(
    project?.templateTitle || project?.serviceType || project?.sourceTitle || "",
  );
  const verifiedTaskIds = new Set(toTaskIdArray(project?.verifiedTasks));
  const completedTaskIds = new Set(toTaskIdArray(project?.completedTasks));

  return (Array.isArray(sop?.phases) ? sop.phases : []).map((phase) => {
    const phaseTasks = Array.isArray(sop?.tasks)
      ? sop.tasks.filter((task) => String(task?.phase) === String(phase?.id))
      : [];

    return phaseTasks.map((task, taskIndex) => {
      const taskKey = `${task.phase}-${task.id}`;
      const isVerified = verifiedTaskIds.has(taskKey);
      const isCompleted = completedTaskIds.has(taskKey);

      return {
        id: taskKey,
        sequence: taskIndex + 1,
        title: task?.title || `Step ${taskIndex + 1}`,
        state: isVerified ? "complete" : isCompleted ? "current" : "pending",
      };
    });
  });
};

const buildProjectPhases = (project) => {
  const phaseSteps = buildProjectPhaseSteps(project);

  if (Array.isArray(project?.phases) && project.phases.length > 0) {
    return project.phases.map((phase, index) => ({
      label: phase?.label || phase?.name || `Phase ${index + 1}`,
      value: clampProgress(phase?.progress ?? phase?.value),
      progress: clampProgress(phase?.phaseProgress ?? phase?.progress ?? phase?.value),
      subLabel: resolvePhaseSummary(phase),
      steps: phaseSteps[index] || [],
    }));
  }

  if (Array.isArray(project?.milestones) && project.milestones.length > 0) {
    let completedBefore = 0;

    return project.milestones.map((milestone, index) => {
      const isCompleted =
        milestone?.completed || String(milestone?.status || "").toUpperCase() === "COMPLETED";
      const milestoneProgress = isCompleted ? 1 : clampProgress(milestone?.progress) / 100;
      const value = Math.round(
        ((completedBefore + milestoneProgress) / project.milestones.length) * 100,
      );

      if (isCompleted) {
        completedBefore += 1;
      }

      return {
        label: milestone?.label || milestone?.name || `Phase ${index + 1}`,
        value,
        progress: Math.round(milestoneProgress * 100),
        subLabel: isCompleted
          ? "Completed"
          : clampProgress(milestone?.progress) > 0
            ? `${clampProgress(milestone?.progress)}% complete`
            : "Pending",
        steps: phaseSteps[index] || [],
      };
    });
  }

  return buildDefaultPhases(Number(project?.phaseCount) || 4).map((phase, index) => ({
    ...phase,
    subLabel: index === 0 ? "Current phase" : "Upcoming",
    steps: phaseSteps[index] || [],
  }));
};

const resolveCurrentPhaseProgress = (phase, steps, fallbackValue = 0) => {
  const normalizedSteps = Array.isArray(steps) ? steps : [];

  if (normalizedSteps.length > 0) {
    const completedSteps = normalizedSteps.filter(
      (step) => String(step?.state || "").toLowerCase() === "complete",
    ).length;

    return clampProgress((completedSteps / normalizedSteps.length) * 100);
  }

  const taskSummaryMatch = String(phase?.subLabel || "").match(/(\d+)\s*\/\s*(\d+)\s*tasks?\s*done/i);
  if (taskSummaryMatch) {
    const completedTasks = Number(taskSummaryMatch[1]) || 0;
    const totalTasks = Number(taskSummaryMatch[2]) || 0;

    if (totalTasks > 0) {
      return clampProgress((completedTasks / totalTasks) * 100);
    }
  }

  const explicitPhaseProgress = Number(phase?.phaseProgress ?? phase?.progress);
  if (Number.isFinite(explicitPhaseProgress)) {
    return clampProgress(explicitPhaseProgress);
  }

  return clampProgress(fallbackValue);
};

const determineCurrentPhaseIndex = (project, phases) => {
  if (Number.isFinite(project?.currentPhaseIndex) && project.currentPhaseIndex >= 0) {
    return Math.min(project.currentPhaseIndex, Math.max(phases.length - 1, 0));
  }

  if (Array.isArray(project?.phases) && project.phases.length > 0) {
    const firstIncompleteIndex = project.phases.findIndex(
      (phase) => clampProgress(phase?.progress ?? phase?.value) < 100,
    );
    return firstIncompleteIndex === -1 ? project.phases.length - 1 : firstIncompleteIndex;
  }

  if (Array.isArray(project?.milestones) && project.milestones.length > 0) {
    const firstIncompleteIndex = project.milestones.findIndex((milestone) => {
      const status = String(milestone?.status || "").toUpperCase();
      return !(milestone?.completed || status === "COMPLETED");
    });
    return firstIncompleteIndex === -1 ? project.milestones.length - 1 : firstIncompleteIndex;
  }

  const phaseStep = 100 / Math.max(phases.length, 1);
  return Math.min(Math.floor(resolveProjectProgress(project) / phaseStep), phases.length - 1);
};

const normalizeFreelancerProjects = (remote = []) => {
  const uniqueProjects = new Map();

  remote.forEach((proposal) => {
    if (String(proposal?.status || "").toUpperCase() !== "ACCEPTED" || !proposal?.project?.id) {
      return;
    }

    const project = proposal.project;
    if (uniqueProjects.has(project.id)) return;

    const businessName = resolveProjectBusinessName(project, proposal);
    const serviceType = resolveProjectServiceType(project, proposal);
    const timelineMeta = resolveProjectTimelineMeta(project, proposal);
    const payoutValue = getFreelancerVisibleBudgetValue(project?.budget ?? proposal?.budget);
    const clientName =
      project?.owner?.fullName ||
      project?.owner?.name ||
      project?.owner?.email?.split("@")[0] ||
      "Client";
    const rawStatus = String(project?.status || proposal?.status || "").toUpperCase();

    uniqueProjects.set(project.id, {
      id: project.id,
      rawStatus,
      title:
        (businessName ? toDisplayTitleCase(businessName) : "") ||
        project?.title ||
        serviceType ||
        "Untitled Project",
      businessName,
      serviceType,
      sectionLabel: rawStatus === "COMPLETED" ? "Completed Project" : "Assigned Project",
      clientName,
      clientAvatar: project?.owner?.avatar || "",
      clientRole:
        businessName &&
        normalizeComparableText(businessName) !== normalizeComparableText(project?.title)
          ? toDisplayTitleCase(businessName)
          : "Project Owner",
      clientInitial: getInitials(clientName),
      payoutValue: Number.isFinite(Number(payoutValue)) ? Math.max(0, Number(payoutValue)) : 0,
      payoutLabel:
        Number.isFinite(Number(payoutValue)) && Number(payoutValue) > 0
          ? formatINR(payoutValue)
          : "TBD",
      timelineLabel: timelineMeta.value || "To be finalized",
      timelineDisplayLabel: timelineMeta.label,
      progress: Number(project?.progress) || 0,
      phases: Array.isArray(project?.phases) ? project.phases : [],
      milestones: Array.isArray(project?.milestones) ? project.milestones : [],
      phaseCount: Number(project?.phaseCount) || 0,
      currentPhaseIndex: Number(project?.currentPhaseIndex),
      completedTasks: project?.completedTasks ?? null,
      verifiedTasks: project?.verifiedTasks ?? null,
      sourceTitle: project?.title || serviceType || "",
      templateTitle: serviceType || project?.title || "",
      statusBucket:
        rawStatus === "COMPLETED" || clampProgress(project?.progress) >= 100
          ? "completed"
          : "ongoing",
      sortDate:
        project?.updatedAt ||
        project?.createdAt ||
        proposal?.updatedAt ||
        proposal?.createdAt ||
        "",
    });
  });

  return Array.from(uniqueProjects.values()).toSorted((left, right) => {
    const leftDate = new Date(left.sortDate || 0).getTime();
    const rightDate = new Date(right.sortDate || 0).getTime();
    return rightDate - leftDate;
  });
};

const buildFreelancerProjectCardModel = (project) => {
  const statusMeta = resolveProjectStatusMeta(project);
  const progressValue = resolveProjectProgress(project);
  const phases = buildProjectPhases(project);
  const currentPhaseIndex = determineCurrentPhaseIndex(project, phases);
  const currentPhase = phases[currentPhaseIndex] || {
    label: "Phase 1",
    subLabel: "Current phase",
    steps: [],
  };
  const currentPhaseSteps = Array.isArray(currentPhase?.steps)
    ? currentPhase.steps.map((step, stepIndex, collection) => {
        const firstPendingIndex = collection.findIndex(
          (entry) => String(entry?.state || "").toLowerCase() !== "complete",
        );

        return {
          ...step,
          state:
            String(step?.state || "").toLowerCase() === "pending" && firstPendingIndex === stepIndex
              ? "current"
              : step.state,
        };
      })
    : [];
  const phaseProgressValue = resolveCurrentPhaseProgress(currentPhase, currentPhaseSteps, progressValue);
  const totalPhases = Math.max(phases.length, 1);
  const phaseNumber = Math.min(currentPhaseIndex + 1, totalPhases);
  const showServiceType =
    Boolean(project.serviceType) &&
    normalizeComparableText(project.serviceType) !== normalizeComparableText(project.title);

  return {
    ...project,
    statusMeta,
    progressValue,
    phaseProgressValue,
    currentPhase,
    currentPhaseSteps,
    currentPhaseCountLabel: `Phase ${phaseNumber} of ${totalPhases}`,
    showServiceType,
    actionHref: `/freelancer/project/${project.id}`,
    actionLabel: statusMeta.label === "Completed" ? "View Summary" : "Open Workspace",
    actionTone: statusMeta.label === "Completed" ? "slate" : "amber",
  };
};

const ProjectCardSkeleton = () => (
  <div className="rounded-[28px] border border-white/[0.06] bg-accent p-6">
    <div className="flex items-start justify-between gap-4">
      <Skeleton className="h-6 w-32 bg-white/8" />
      <Skeleton className="h-7 w-24 rounded-full bg-white/8" />
    </div>
    <Skeleton className="mt-5 h-10 w-56 bg-white/8" />
    <Skeleton className="mt-3 h-4 w-36 bg-white/8" />
    <div className="mt-6 flex items-center gap-3">
      <Skeleton className="size-11 rounded-full bg-white/8" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-36 bg-white/8" />
        <Skeleton className="h-4 w-24 bg-white/8" />
      </div>
    </div>
    <div className="mt-6 grid grid-cols-2 gap-4">
      <Skeleton className="h-24 rounded-[14px] bg-white/8" />
      <Skeleton className="h-24 rounded-[14px] bg-white/8" />
    </div>
    <Skeleton className="mt-7 h-2 w-full rounded-full bg-white/8" />
    <div className="mt-6 rounded-[18px] border border-white/[0.06] bg-white/[0.035] p-4">
      <Skeleton className="h-4 w-32 bg-white/8" />
      <Skeleton className="mt-4 h-4 w-44 bg-white/8" />
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-full bg-white/8" />
        <Skeleton className="h-4 w-[88%] bg-white/8" />
        <Skeleton className="h-4 w-[78%] bg-white/8" />
      </div>
    </div>
    <Skeleton className="mt-8 h-12 w-full rounded-[14px] bg-white/8" />
  </div>
);

const ProjectPhaseStep = ({ item }) => {
  const state = String(item?.state || "").toLowerCase();
  const isComplete = state === "complete";
  const isCurrent = state === "current" || state === "in_progress";
  const statusMeta = isComplete
    ? {
        label: "Completed",
        Icon: CheckCircle2,
        badgeClassName: "border-[#166534]/50 bg-[#052e16] text-[#4ade80]",
        textClassName: "text-[#f3f4f6]",
        iconClassName: "text-[#22c55e]",
      }
    : isCurrent
      ? {
          label: "In Progress",
          Icon: Clock3,
          badgeClassName: "border-[#ffc107]/25 bg-[#3a2800] text-[#ffc107]",
          textClassName: "text-[#f3f4f6]",
          iconClassName: "text-[#ffc107]",
        }
      : {
          label: "Pending",
          Icon: Circle,
          badgeClassName: "border-white/[0.08] bg-white/[0.04] text-[#94a3b8]",
          textClassName: "text-[#6b7280]",
          iconClassName: "text-[#94a3b8]",
        };
  const StatusIcon = statusMeta.Icon;

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <StatusIcon className={cn("size-5 shrink-0", statusMeta.iconClassName)} />

        <span
          title={item.title || item.label}
          className={cn("truncate text-[0.88rem] leading-5", statusMeta.textClassName)}
        >
          {item.title || item.label}
        </span>
      </div>

      <span
        className={cn(
          "inline-flex shrink-0 items-center rounded-full border px-2 py-1 text-[0.63rem] font-semibold uppercase tracking-[0.12em]",
          statusMeta.badgeClassName,
        )}
      >
        {statusMeta.label}
      </span>
    </div>
  );
};

const FreelancerProjectCard = ({ project }) => {
  const detailPanelClassName =
    "border border-white/[0.06] bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]";
  const phaseSteps = Array.isArray(project.currentPhaseSteps) ? project.currentPhaseSteps : [];
  const actionClassName = cn(
    "flex w-full items-center justify-center gap-2 rounded-[14px] px-4 py-3.5 text-base font-semibold transition-colors",
    projectActionToneMap[project.actionTone] || projectActionToneMap.slate,
  );

  return (
    <article className="flex h-full flex-col rounded-[28px] border border-white/[0.06] bg-accent p-6 transition-transform duration-200 hover:-translate-y-1 [content-visibility:auto]">
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-4">
          <span className="rounded-[8px] bg-white/[0.06] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#9ca3af]">
            {project.sectionLabel}
          </span>

          <span
            className={cn(
              "inline-flex rounded-full border px-3 py-1 text-[0.82rem] font-semibold",
              projectStatusToneMap[project.statusMeta.tone] || projectStatusToneMap.slate,
            )}
          >
            {project.statusMeta.label}
          </span>
        </div>

        <h2 className="mt-5 text-[clamp(1.75rem,2vw,2.15rem)] font-semibold tracking-[-0.04em] text-white">
          {project.title}
        </h2>

        {project.showServiceType ? (
          <p className="mt-2 text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-[#8f96a3]">
            {project.serviceType}
          </p>
        ) : null}

        <div className="mt-6 flex items-center gap-3">
          <Avatar className="size-11 shrink-0 border border-white/10 shadow-[0_12px_24px_rgba(0,0,0,0.24)]">
            <AvatarImage src={project.clientAvatar} alt={project.clientName} />
            <AvatarFallback className="bg-[#1f2937] text-sm text-white">
              {project.clientInitial}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <p className="truncate text-[1rem] font-medium text-white">{project.clientName}</p>
            <p className="truncate text-sm text-[#8f96a3]">{project.clientRole}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className={cn("rounded-[14px] p-4", detailPanelClassName)}>
            <p className="text-[0.76rem] uppercase tracking-[0.16em] text-[#7f8794]">Your Payout</p>
            <p className="mt-3 text-[1.1rem] font-semibold tracking-[-0.02em] text-white">
              {project.payoutLabel}
            </p>
          </div>

          <div className={cn("rounded-[14px] p-4", detailPanelClassName)}>
            <p className="text-[0.76rem] uppercase tracking-[0.16em] text-[#7f8794]">
              {project.timelineDisplayLabel}
            </p>
            <p className="mt-3 text-[1.1rem] font-semibold tracking-[-0.02em] text-white">
              {project.timelineLabel}
            </p>
          </div>
        </div>

        <div className="mt-7 flex items-center justify-between gap-3">
          <span className="text-sm text-[#9ca3af]">Current Phase Progress</span>
          <span className="text-sm font-semibold text-[#ffc107]">{project.phaseProgressValue}%</span>
        </div>

        <div className="mt-3 h-2 rounded-full bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.92),rgba(255,255,255,0.62))]"
            style={{ width: `${project.phaseProgressValue}%` }}
          />
        </div>

        <div className={cn("mt-5 flex min-h-[174px] flex-col rounded-[18px] p-3.5", detailPanelClassName)}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#7f8794]">
              Current Phase
            </p>
            <span className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[0.63rem] font-semibold uppercase tracking-[0.12em] text-[#94a3b8]">
              {project.currentPhaseCountLabel}
            </span>
          </div>

          <p
            title={project.currentPhase?.label || "Phase 1"}
            className="mt-2 line-clamp-1 text-[0.98rem] font-semibold tracking-[-0.02em] text-white"
          >
            {project.currentPhase?.label || "Phase 1"}
          </p>

          {project.currentPhase?.subLabel ? (
            <p title={project.currentPhase.subLabel} className="mt-1 truncate text-sm text-[#8f96a3]">
              {project.currentPhase.subLabel}
            </p>
          ) : null}

          {phaseSteps.length > 0 ? (
            <div className="mt-3 max-h-[104px] space-y-2 overflow-y-auto pr-1 [scrollbar-color:rgba(255,255,255,0.16)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/[0.14]">
              {phaseSteps.map((step) => (
                <ProjectPhaseStep key={`${project.id}-${step.id || step.title}`} item={step} />
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-[#8f96a3]">
              Phase steps will appear here once the project SOP is configured.
            </p>
          )}
        </div>

        <div className="mt-auto pt-6">
          <Link to={project.actionHref} className={actionClassName}>
            {project.actionLabel}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </article>
  );
};

const EmptyProjectsState = ({
  title = "No projects yet",
  description = "Accepted projects will appear here once a client moves your proposal into delivery.",
  actionLabel = "View Proposals",
  actionHref = "/freelancer/proposals",
}) => (
  <div className="rounded-[28px] border border-white/[0.06] bg-accent p-8 text-center">
    <div className="mx-auto flex max-w-md flex-col items-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-white/[0.06] text-[#94a3b8]">
        <ClipboardList className="size-7" />
      </div>
      <h2 className="mt-6 text-[1.35rem] font-semibold tracking-[-0.03em] text-white">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-[#94a3b8]">{description}</p>
      <Link
        to={actionHref}
        className="mt-6 inline-flex items-center justify-center rounded-[14px] bg-[#ffc107] px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-[#ffd54f]"
      >
        {actionLabel}
      </Link>
    </div>
  </div>
);

const FreelancerProjectsContent = () => {
  const { authFetch, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const activeFilter = searchParams.get("view") === "completed" ? "completed" : "ongoing";

  const loadProjects = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await authFetch("/proposals");
      const payload = await response.json().catch(() => null);
      const remote = Array.isArray(payload?.data) ? payload.data : [];
      setProjects(normalizeFreelancerProjects(remote));
    } catch (error) {
      console.error("Failed to load freelancer projects:", error);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadProjects();
  }, [isAuthenticated, loadProjects]);

  const setActiveFilter = useCallback(
    (nextFilter) => {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("view", nextFilter);
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const projectCards = useMemo(
    () => projects.map((project) => buildFreelancerProjectCardModel(project)),
    [projects],
  );
  const ongoingProjectCount = useMemo(
    () => projectCards.filter((project) => project.statusBucket !== "completed").length,
    [projectCards],
  );
  const completedProjectCount = useMemo(
    () => projectCards.filter((project) => project.statusBucket === "completed").length,
    [projectCards],
  );
  const visibleProjectCards = useMemo(
    () =>
      projectCards.filter((project) =>
        activeFilter === "completed"
          ? project.statusBucket === "completed"
          : project.statusBucket !== "completed",
      ),
    [activeFilter, projectCards],
  );

  useEffect(() => {
    if (isLoading) return;

    if (activeFilter === "ongoing" && ongoingProjectCount === 0 && completedProjectCount > 0) {
      setActiveFilter("completed");
    }

    if (activeFilter === "completed" && completedProjectCount === 0 && ongoingProjectCount > 0) {
      setActiveFilter("ongoing");
    }
  }, [
    activeFilter,
    completedProjectCount,
    isLoading,
    ongoingProjectCount,
    setActiveFilter,
  ]);

  return (
    <div className="flex-1 flex flex-col relative h-full overflow-hidden bg-background transition-colors duration-300">
      <FreelancerTopBar />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 z-10 relative scroll-smooth">
        <div className="max-w-[1600px] mx-auto">
          <section className="space-y-4">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[0.84rem] font-semibold uppercase tracking-[0.34em] text-[#ffc107]/80">
                  Freelancer Projects
                </p>
                <h1 className="mt-3 text-[clamp(2rem,4vw,3rem)] font-bold tracking-[-0.75px] text-[#f1f5f9]">
                  Project Workspace
                </h1>
                <p className="mt-2 max-w-[38rem] text-sm text-[#94a3b8]">
                  Track active delivery work, review completed handovers, and keep every client project in one place.
                </p>
              </div>

              <div className="flex justify-start lg:justify-end">
                <div className="inline-flex h-auto flex-wrap gap-2 rounded-full border border-white/[0.08] bg-accent p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  {projectFilterOptions.map((option) => {
                    const count =
                      option.key === "completed" ? completedProjectCount : ongoingProjectCount;
                    const isActive = activeFilter === option.key;

                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setActiveFilter(option.key)}
                        className={cn(
                          "h-11 rounded-full border border-transparent px-5 text-[0.95rem] font-semibold transition",
                          isActive
                            ? "border-[#ffc107]/70 bg-[#ffc107] text-[#141414]"
                            : "text-[#a3a6ad] hover:text-white",
                        )}
                      >
                        {option.label} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-12">
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <ProjectCardSkeleton key={item} />
                ))}
              </div>
            ) : visibleProjectCards.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {visibleProjectCards.map((project) => (
                  <FreelancerProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : projectCards.length > 0 ? (
              <EmptyProjectsState
                title={
                  activeFilter === "completed"
                    ? "No completed projects yet"
                    : "No ongoing projects right now"
                }
                description={
                  activeFilter === "completed"
                    ? "Completed delivery work will appear here once a project is fully wrapped up."
                    : "Ongoing client work will appear here as soon as an accepted proposal becomes an active project."
                }
              />
            ) : (
              <EmptyProjectsState
                title="No project work yet"
                description="Accepted collaborations will show up here once a client starts the project workspace."
                actionLabel="Go To Proposals"
              />
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

const FreelancerProjects = () => <FreelancerProjectsContent />;

export default FreelancerProjects;
