import { getSopFromTitle } from "@/shared/data/sopTemplates";
import { formatINR } from "@/shared/lib/currency";

export const ONGOING_PROJECT_STATUSES = new Set([
  "AWAITING_PAYMENT",
  "IN_PROGRESS",
  "ONGOING",
  "ACTIVE",
  "IN_REVIEW",
  "ON_HOLD",
  "PAUSED",
  "OPEN",
]);

export const projectProgressSeriesPalette = [
  { color: "#ffd400" },
  { color: "#7e70e8" },
  { color: "#f3a2cb" },
  { color: "#37d39a" },
  { color: "#6ea8ff" },
  { color: "#ff9d57" },
];

export const projectProgressCurveTemplates = [
  [0, 0.08, 0.3, 0.52, 0.74, 1],
  [0, 0.5, 0.24, 0.42, 0.62, 0.76],
  [0, 0.14, 0.11, 0.3, 0.6, 0.82],
  [0, 0.16, 0.34, 0.55, 0.73, 0.94],
  [0, 0.32, 0.54, 0.66, 0.79, 0.91],
  [0, 0.11, 0.27, 0.49, 0.71, 0.88],
];

export const projectProgressFilterPresets = {
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

const VISIBLE_ACTIVE_PHASE_STEP_STATES = new Set([
  "complete",
  "completed",
  "current",
  "in_progress",
]);

const clampProjectProgressValue = (value, minimum, maximum) =>
  Math.min(Math.max(value, minimum), maximum);

const clampProjectProgressPercentage = (value) =>
  Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

export const addDaysToProjectProgressDate = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

export const createProjectProgressDefaultDateRange = (todayDate = new Date()) => ({
  from: addDaysToProjectProgressDate(todayDate, -14),
  to: todayDate,
});

export const formatProjectProgressFullDate = (date) =>
  projectProgressFullDateFormatter.format(date);

export const formatProjectProgressShortDate = (date) =>
  projectProgressShortDateFormatter.format(date);

export const formatProjectProgressStageValue = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "phase-1";

  const roundedValue = Math.round(numericValue);
  return Math.abs(numericValue - roundedValue) < 0.05
    ? `phase-${roundedValue}`
    : `phase-${numericValue.toFixed(1)}`;
};

export const resolveProjectProgressStageLabel = (project, fallbackValue) => {
  const explicitStageLabel = String(project?.phaseProgressMeta?.stageLabel || "").trim();
  if (explicitStageLabel) {
    return explicitStageLabel;
  }

  return formatProjectProgressStageValue(fallbackValue);
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

export const buildProjectProgressTimeline = ({ todayDate, filterMode, customRange }) => {
  if (filterMode === "custom") {
    return buildProjectProgressCustomTimeline(todayDate, customRange);
  }

  const preset = projectProgressFilterPresets[filterMode] || projectProgressFilterPresets.monthly;
  return buildProjectProgressTimelineFromOffsets(todayDate, preset.offsets);
};

export const formatProjectProgressTriggerLabel = ({
  filterMode,
  customRange,
  todayDate,
}) => {
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

export const resolveProjectProgressCurveValue = (curveTemplate, ratio) => {
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

export const resolveProjectProgressStageLevel = (project) => {
  const explicitStageValue = Number(project?.phaseProgressMeta?.stageValue);
  if (Number.isFinite(explicitStageValue)) {
    const phases = Array.isArray(project?.phases) ? project.phases : [];
    const phaseCount = Math.max(phases.length, 4);
    return clampProjectProgressValue(explicitStageValue, 1, phaseCount + 1);
  }

  const phases = Array.isArray(project?.phases) ? project.phases : [];
  const phaseCount = Math.max(phases.length, 4);
  const explicitCurrentPhaseIndex = Number.isFinite(Number(project?.currentPhaseIndex))
    ? Number(project.currentPhaseIndex)
    : Number.isFinite(Number(project?.highlightIndex))
      ? Number(project.highlightIndex)
      : null;

  if (explicitCurrentPhaseIndex !== null) {
    return clampProjectProgressValue(explicitCurrentPhaseIndex + 1, 1, phaseCount);
  }

  const currentProgress = clampProjectProgressValue(Number(project?.progressValue || 0), 0, 100);

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
  const previousTarget =
    activePhaseIndex > 0
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
  const progressWithinPhase =
    activeTarget > previousTarget
      ? clampProjectProgressValue(
          (currentProgress - previousTarget) / (activeTarget - previousTarget),
          0,
          1,
        )
      : activePhaseIndex >= phaseCount - 1
        ? 1
        : 0;

  return clampProjectProgressValue(activePhaseIndex + 1 + progressWithinPhase, 1, phaseCount);
};

export const resolveProjectProgressVisibleMarkerTypes = (
  project,
  pointCount,
  lastVisibleIndex,
) => {
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

        return VISIBLE_ACTIVE_PHASE_STEP_STATES.has(stepState);
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
    const markerIndex =
      availableTaskIndexes[Math.max(0, Math.min(slotIndex, availableTaskIndexes.length - 1))];

    markers[markerIndex] = "task";
  }

  phaseIndexes.forEach((index) => {
    markers[index] = "phase";
  });

  return markers;
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

const getFirstProjectInstallment = (project = {}) =>
  Array.isArray(project?.paymentPlan?.installments)
    ? project.paymentPlan.installments[0] || null
    : null;

const hasUnlockedProjectProgress = (project = {}) => {
  const normalizedStatus = String(project?.rawStatus || project?.status || "").toUpperCase();
  if (normalizedStatus === "IN_PROGRESS" || normalizedStatus === "COMPLETED") {
    return true;
  }

  const firstInstallment = getFirstProjectInstallment(project);
  if (!firstInstallment) {
    return false;
  }

  if (firstInstallment.isPaid) {
    return true;
  }

  const firstInstallmentAmount = Number(firstInstallment.amount || 0);
  const paidAmount = Number(project?.paymentPlan?.paidAmount ?? project?.spent ?? 0);
  return firstInstallmentAmount > 0 && paidAmount >= firstInstallmentAmount;
};

const buildDefaultProgressPhases = (count = 4) =>
  Array.from({ length: Math.max(1, count) }, (_, index) => ({
    label: `Phase ${index + 1}`,
    totalTasks: 0,
    completedTasks: 0,
    steps: [],
  }));

const buildProjectPhaseSteps = (project = {}) => {
  const sop = getSopFromTitle(
    project?.templateTitle || project?.sourceTitle || project?.title || "",
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

const buildProgressProjectPhases = (project = {}) => {
  const phaseSteps = buildProjectPhaseSteps(project);
  const paymentPlanPhases = Array.isArray(project?.paymentPlan?.phases)
    ? project.paymentPlan.phases
    : [];

  if (paymentPlanPhases.length > 0) {
    return paymentPlanPhases.map((phase, index) => {
      const steps = phaseSteps[index] || [];
      const totalTasks = Math.max(steps.length, Number(phase?.totalTasks || 0));
      const completedTasks = Math.min(
        totalTasks,
        Math.max(
          0,
          Number(phase?.verifiedTasks ?? phase?.completedTasks ?? phase?.doneTasks ?? 0),
        ),
      );

      return {
        label: phase?.name || `Phase ${index + 1}`,
        totalTasks,
        completedTasks,
        steps,
      };
    });
  }

  if (Array.isArray(project?.phases) && project.phases.length > 0) {
    return project.phases.map((phase, index) => {
      const steps = phaseSteps[index] || [];
      const totalTasks = Math.max(
        steps.length,
        Number(phase?.totalTasks || phase?.taskCount || 0),
      );
      const completedTasksFromSteps = steps.filter(
        (step) => String(step?.state || "").toLowerCase() === "complete",
      ).length;
      const completedTasks = Math.min(
        totalTasks,
        Math.max(
          completedTasksFromSteps,
          Number(phase?.verifiedTasks ?? phase?.completedTasks ?? phase?.doneTasks ?? 0),
        ),
      );

      return {
        label: phase?.label || phase?.name || `Phase ${index + 1}`,
        totalTasks,
        completedTasks,
        steps,
      };
    });
  }

  if (Array.isArray(project?.milestones) && project.milestones.length > 0) {
    return project.milestones.map((milestone, index) => {
      const steps = phaseSteps[index] || [];
      const totalTasks = Math.max(steps.length, Number(milestone?.totalTasks || 0));
      const completedTasks = milestone?.completed
        ? totalTasks
        : Math.min(
            totalTasks,
            Math.max(0, Number(milestone?.verifiedTasks ?? milestone?.completedTasks ?? 0)),
          );

      return {
        label: milestone?.label || milestone?.name || `Phase ${index + 1}`,
        totalTasks,
        completedTasks,
        steps,
      };
    });
  }

  return buildDefaultProgressPhases(Number(project?.phaseCount) || 4).map((phase, index) => ({
    ...phase,
    steps: phaseSteps[index] || [],
  }));
};

const resolveProgressProjectCurrentPhaseIndex = (project = {}, phases = []) => {
  if (
    Number.isFinite(Number(project?.currentPhaseIndex)) &&
    Number(project.currentPhaseIndex) >= 0
  ) {
    return Math.min(Number(project.currentPhaseIndex), Math.max(phases.length - 1, 0));
  }

  const firstIncompletePhaseIndex = phases.findIndex((phase) => {
    if (phase.totalTasks > 0) {
      return phase.completedTasks < phase.totalTasks;
    }

    return false;
  });

  if (firstIncompletePhaseIndex >= 0) {
    return firstIncompletePhaseIndex;
  }

  return Math.max(phases.length - 1, 0);
};

export const getPhaseProgressValue = (phaseNumber, completedTasks, totalTasks) => {
  const safePhaseNumber = Math.max(1, Number(phaseNumber) || 1);
  const safeTotalTasks = Math.max(0, Number(totalTasks) || 0);
  const clampedCompletedTasks = Math.min(
    safeTotalTasks,
    Math.max(0, Number(completedTasks) || 0),
  );
  const decimalDigits = Math.max(1, String(Math.max(safeTotalTasks, 1)).length);
  const divisor = 10 ** decimalDigits;
  const decimalLabel = String(clampedCompletedTasks).padStart(decimalDigits, "0");

  return {
    phaseNumber: safePhaseNumber,
    completedTasks: clampedCompletedTasks,
    totalTasks: safeTotalTasks,
    stageValue: Number(
      (safePhaseNumber + clampedCompletedTasks / divisor).toFixed(decimalDigits + 2),
    ),
    stageLabel:
      clampedCompletedTasks > 0
        ? `phase-${safePhaseNumber}.${decimalLabel}`
        : `phase-${safePhaseNumber}`,
  };
};

export const buildProgressProjects = (projectCards = []) =>
  projectCards
    .filter(Boolean)
    .filter((project) =>
      ONGOING_PROJECT_STATUSES.has(String(project?.rawStatus || project?.status || "").toUpperCase()),
    )
    .map((project, index) => {
      const basePhases = buildProgressProjectPhases(project);
      const currentPhaseIndex = resolveProgressProjectCurrentPhaseIndex(project, basePhases);
      const phases = basePhases.map((phase, phaseIndex) => {
        const steps = Array.isArray(phase?.steps) ? phase.steps : [];
        const firstPendingIndex = steps.findIndex(
          (step) => String(step?.state || "").toLowerCase() === "pending",
        );

        return {
          ...phase,
          steps: steps.map((step, stepIndex) => ({
            ...step,
            state:
              phaseIndex < currentPhaseIndex
                ? "complete"
                : phaseIndex === currentPhaseIndex &&
                    String(step?.state || "").toLowerCase() === "pending" &&
                    firstPendingIndex === stepIndex
                  ? "current"
                  : step.state,
          })),
        };
      });
      const currentPhase = phases[currentPhaseIndex] || phases[0] || {
        label: "Phase 1",
        totalTasks: 0,
        completedTasks: 0,
        steps: [],
      };
      const currentPhaseSteps = Array.isArray(currentPhase.steps) ? currentPhase.steps : [];
      const completedTasksInCurrentPhase = currentPhaseSteps.length
        ? currentPhaseSteps.filter(
            (step) => String(step?.state || "").toLowerCase() === "complete",
          ).length
        : Math.max(0, Number(currentPhase.completedTasks || 0));
      const totalTasksInCurrentPhase = currentPhaseSteps.length
        ? currentPhaseSteps.length
        : Math.max(0, Number(currentPhase.totalTasks || 0));
      const phaseProgressMeta = getPhaseProgressValue(
        currentPhaseIndex + 1,
        completedTasksInCurrentPhase,
        totalTasksInCurrentPhase,
      );
      const firstInstallment = getFirstProjectInstallment(project);
      const isProgressUnlocked = hasUnlockedProjectProgress(project);

      return {
        id: project?.id || `progress-project-${index}`,
        label: project?.title || `Project ${index + 1}`,
        rawStatus: project?.rawStatus || project?.status || "",
        phases,
        currentPhaseIndex,
        currentPhase,
        currentPhaseSteps,
        phaseProgressMeta,
        progressValue: clampProjectProgressPercentage(project?.progressValue),
        isProgressUnlocked,
        isProgressLocked: !isProgressUnlocked,
        lockedPaymentLabel: firstInstallment?.label || "Initial project payment",
        lockedPaymentValue:
          Number(firstInstallment?.amount || 0) > 0
            ? formatINR(Number(firstInstallment.amount))
            : "",
        lockedDescription: firstInstallment?.label
          ? `${firstInstallment.label} must be paid before the project progress graph appears.`
          : "The project progress graph will appear after the initial project amount is paid.",
      };
    });
