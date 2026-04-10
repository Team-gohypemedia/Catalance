import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Gavel from "lucide-react/dist/esm/icons/gavel";
import Video from "lucide-react/dist/esm/icons/video";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import FolderKanban from "lucide-react/dist/esm/icons/folder-kanban";
import MessageSquare from "lucide-react/dist/esm/icons/message-square";
import ClipboardList from "lucide-react/dist/esm/icons/clipboard-list";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import Clock from "lucide-react/dist/esm/icons/clock";
import Repeat2 from "lucide-react/dist/esm/icons/repeat-2";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import SlidersHorizontal from "lucide-react/dist/esm/icons/sliders-horizontal";
import { useNotifications } from "@/shared/context/NotificationContext";
import FreelancerWorkspaceHeader from "@/components/features/freelancer/FreelancerWorkspaceHeader";
import { getSession } from "@/shared/lib/auth-storage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/shared/context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { SuspensionAlert } from "@/components/ui/suspension-alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { consumeFreelancerWelcomePending } from "@/shared/lib/freelancer-onboarding-flags";
import {
  ProjectProposalCard,
  buildProjectCardModel,
  ProjectCardSkeleton,
} from "@/components/features/client/ClientProjects";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { getSopFromTitle } from "@/shared/data/sopTemplates";
import { extractLabeledLineValue } from "@/shared/lib/labeled-fields";
import { Skeleton } from "@/components/ui/skeleton";
import {
  toUniqueSkillNames,
  resolveAvatarUrl,
  normalizePresenceLink,
  hasTextValue,
  collectOnboardingPlatformLinks,
  isPortfolioLikeKey,
  toUniqueLabels,
  normalizeWorkExperienceEntries,
  collectEducationEntriesFromProfileDetails,
} from "@/components/features/freelancer/profile/freelancerProfileUtils";
import { cn } from "@/shared/lib/utils";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { toast } from "sonner";

const buildFreelancerProjectDestination = (projectId = "") => {
  const normalizedProjectId = String(projectId || "").trim();

  return normalizedProjectId
    ? `/freelancer/project/${encodeURIComponent(normalizedProjectId)}`
    : "/freelancer/project";
};

const buildFreelancerProposalDestination = ({ projectId = "" } = {}) => {
  const normalizedProjectId = String(projectId || "").trim();
  const params = new URLSearchParams();

  if (normalizedProjectId) {
    params.set("projectId", normalizedProjectId);
  }

  const query = params.toString();
  return query ? `/freelancer/proposals?${query}` : "/freelancer/proposals";
};

const resolveFreelancerNotificationDestination = (notification) => {
  const explicitDestination = String(
    notification?.data?.route ||
      notification?.data?.redirectTo ||
      notification?.data?.href ||
      notification?.data?.url ||
      notification?.data?.path ||
      "",
  ).trim();

  if (explicitDestination) {
    return explicitDestination;
  }

  const type = String(notification?.type || "").trim().toLowerCase();
  const projectId = String(
    notification?.data?.projectId || notification?.data?.syncedProjectId || "",
  ).trim();
  const status = String(notification?.data?.status || "").trim().toUpperCase();

  if (type === "chat") {
    const service = String(notification?.data?.service || "");
    const parts = service.split(":");
    let chatProjectId = projectId;

    if (!chatProjectId && parts.length >= 4 && parts[0] === "CHAT") {
      chatProjectId = parts[1];
    }

    return chatProjectId
      ? `/freelancer/messages?projectId=${encodeURIComponent(chatProjectId)}`
      : "/freelancer/messages";
  }

  if (
    type === "proposal" ||
    type === "proposal_followup" ||
    type === "budget_suggestion" ||
    type === "proposal_expired"
  ) {
    if (status === "ACCEPTED" && projectId) {
      return buildFreelancerProjectDestination(projectId);
    }

    if (status === "ACCEPTED") {
      return "/freelancer/proposals/accepted";
    }

    return buildFreelancerProposalDestination({ projectId });
  }

  if (type === "payment") {
    return "/freelancer/payments";
  }

  if (
    type === "meeting_scheduled" ||
    type === "task_completed" ||
    type === "task_verified" ||
    type === "task_unverified" ||
    type === "project_assigned" ||
    type === "freelancer_change_resolved" ||
    type === "freelancer_review"
  ) {
    return buildFreelancerProjectDestination(projectId);
  }

  return "/freelancer";
};

// ========== Phase Building Helper Functions (from ClientProjects) ==========
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

const clampProgress = (value) =>
  Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

const phaseTimelineShares = [15, 15, 50, 20];

const resolvePhaseIndexFromProgress = (progress = 0, totalPhases = 4) => {
  const normalizedProgress = clampProgress(progress);
  const activeShares = phaseTimelineShares.slice(0, Math.max(1, totalPhases));
  let cumulative = 0;

  for (let index = 0; index < activeShares.length; index += 1) {
    cumulative += activeShares[index] || 0;
    if (normalizedProgress < cumulative) {
      return index;
    }
  }

  return Math.max(0, activeShares.length - 1);
};

const normalizeComparableText = (value = "") =>
  String(value || "").trim().toLowerCase();

const getFirstNonEmptyText = (...values) => {
  for (const value of values.flat()) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }

  return "";
};

const scheduleRangeDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
});

const scheduleRangeDateWithYearFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
});

const scheduleDayInMs = 1000 * 60 * 60 * 24;

const normalizeScheduleDate = (value) => {
  if (!value) return null;

  const parsed = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  parsed.setHours(12, 0, 0, 0);
  return parsed;
};

const addScheduleDays = (date, days) => {
  const nextDate = normalizeScheduleDate(date);
  if (!nextDate) return null;

  nextDate.setDate(nextDate.getDate() + Number(days || 0));
  return nextDate;
};

const getInclusiveScheduleDaySpan = (startDate, endDate) => {
  const normalizedStart = normalizeScheduleDate(startDate);
  const normalizedEnd = normalizeScheduleDate(endDate);
  if (!normalizedStart || !normalizedEnd) return null;

  return Math.max(
    1,
    Math.round((normalizedEnd.getTime() - normalizedStart.getTime()) / scheduleDayInMs) + 1,
  );
};

const formatScheduleDateRange = (startDate, endDate) => {
  const normalizedStart = normalizeScheduleDate(startDate);
  const normalizedEnd = normalizeScheduleDate(endDate);
  if (!normalizedStart || !normalizedEnd) return "";

  const includeYear = normalizedStart.getFullYear() !== normalizedEnd.getFullYear();
  const formatter = includeYear
    ? scheduleRangeDateWithYearFormatter
    : scheduleRangeDateFormatter;

  return `${formatter.format(normalizedStart)} - ${formatter.format(normalizedEnd)}`;
};

const allocateScheduleDaysByShare = (totalDays, shares = []) => {
  const normalizedTotalDays = Math.max(1, Number(totalDays) || 1);
  const normalizedShares = (Array.isArray(shares) && shares.length ? shares : [100]).map(
    (share) => Math.max(0, Number(share) || 0),
  );

  const provisionalAllocations = normalizedShares.map((share, index) => {
    const rawDays = (normalizedTotalDays * share) / 100;
    return {
      index,
      wholeDays: Math.floor(rawDays),
      remainder: rawDays % 1,
      share,
    };
  });

  const allocatedDays = provisionalAllocations.map((item) => item.wholeDays);
  let assignedDays = allocatedDays.reduce((sum, count) => sum + count, 0);
  const rankedRemainders = provisionalAllocations
    .slice()
    .sort((a, b) => b.remainder - a.remainder || b.share - a.share || a.index - b.index);

  let cursor = 0;
  while (assignedDays < normalizedTotalDays && rankedRemainders.length > 0) {
    const target = rankedRemainders[cursor % rankedRemainders.length];
    allocatedDays[target.index] += 1;
    assignedDays += 1;
    cursor += 1;
  }

  return allocatedDays;
};

const extractLabeledValue = (value = "", labels = []) =>
  extractLabeledLineValue(value, labels);

const toDisplayTitleCase = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/(^|[\s/-])([a-z])/g, (match, prefix, char) => `${prefix}${char.toUpperCase()}`);

const resolveFreelancerProjectBusinessName = (project = {}, proposal = null) =>
  getFirstNonEmptyText(
    project?.businessName,
    project?.companyName,
    project?.brandName,
    project?.owner?.companyName,
    project?.owner?.businessName,
    project?.owner?.brandName,
    proposal?.businessName,
    proposal?.companyName,
    proposal?.brandName,
    extractLabeledValue(project?.description || "", [
      "Business Name",
      "Company Name",
      "Brand Name",
    ]),
    extractLabeledValue(proposal?.coverLetter || proposal?.description || "", [
      "Business Name",
      "Company Name",
      "Brand Name",
    ]),
  );

const resolveFreelancerProjectServiceType = (project = {}, proposal = null) =>
  getFirstNonEmptyText(
    project?.serviceType,
    project?.service,
    project?.serviceName,
    project?.serviceKey,
    project?.category,
    proposal?.serviceType,
    proposal?.service,
    proposal?.serviceName,
    proposal?.serviceKey,
    proposal?.category,
    extractLabeledValue(project?.description || "", [
      "Service Type",
      "Service",
      "Category",
    ]),
    extractLabeledValue(proposal?.coverLetter || proposal?.description || "", [
      "Service Type",
      "Service",
      "Category",
    ]),
    project?.sourceTitle,
    project?.templateTitle,
    proposal?.projectTitle,
    proposal?.title,
    project?.title,
  );

const buildDefaultPhases = (count = 4) =>
  Array.from({ length: Math.max(1, count) }, (_, index) => ({
    label: `Phase ${index + 1}`,
    value: 0,
  }));

const isProjectAwaitingKickoff = (project = {}) => {
  const normalizedStatus = String(project?.status || "").trim().toUpperCase();
  if (normalizedStatus === "AWAITING_PAYMENT") {
    return true;
  }

  const nextDueInstallment = project?.paymentPlan?.nextDueInstallment || null;
  const dueSequence = Number(nextDueInstallment?.sequence);
  const installmentMarkedPaid = Boolean(
    nextDueInstallment?.isPaid ||
      Number(nextDueInstallment?.amountPaid || 0) > 0,
  );

  return Number.isFinite(dueSequence) && dueSequence <= 1 && !installmentMarkedPaid;
};

const buildProjectPhaseSteps = (project) => {
  const sop = getSopFromTitle(project?.sourceTitle || project?.templateTitle || project?.serviceType || project?.title);
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

const isPhaseMarkedComplete = (phaseLike, fallbackLabel = "Upcoming") => {
  const normalizedStatus = String(
    phaseLike?.status || phaseLike?.state || phaseLike?.phaseStatus || "",
  ).toUpperCase();
  if (phaseLike?.isComplete || phaseLike?.completed || normalizedStatus === "COMPLETED") {
    return true;
  }

  const explicitProgress = Number(
    phaseLike?.phaseProgress ?? phaseLike?.progress ?? phaseLike?.value
  );
  if (Number.isFinite(explicitProgress) && clampProgress(explicitProgress) >= 100) {
    return true;
  }

  const totalTasks = Math.max(0, Number(phaseLike?.totalTasks || phaseLike?.taskCount || 0));
  const completedTasks = Math.max(
    0,
    Number(phaseLike?.verifiedTasks ?? phaseLike?.completedTasks ?? phaseLike?.doneTasks ?? 0),
  );
  if (totalTasks > 0 && completedTasks >= totalTasks) {
    return true;
  }

  const summary = resolvePhaseSummary(phaseLike, fallbackLabel);
  const taskSummaryMatch = String(summary).match(/(\d+)\s*\/\s*(\d+)\s*tasks?\s*done/i);
  if (taskSummaryMatch) {
    const completedTaskCount = Number(taskSummaryMatch[1]) || 0;
    const totalTaskCount = Number(taskSummaryMatch[2]) || 0;
    return totalTaskCount > 0 && completedTaskCount >= totalTaskCount;
  }

  return normalizeComparableText(summary) === "completed";
};

const resolvePhaseStepsForDisplay = (steps, phaseLike, fallbackLabel = "Upcoming") => {
  const normalizedSteps = Array.isArray(steps) ? steps : [];
  if (!isPhaseMarkedComplete(phaseLike, fallbackLabel)) {
    return normalizedSteps;
  }

  return normalizedSteps.map((step) => ({ ...step, state: "complete" }));
};

const buildProjectPhases = (project) => {
  const sop = getSopFromTitle(
    project?.sourceTitle || project?.templateTitle || project?.serviceType || project?.title,
  );
  const phaseSteps = buildProjectPhaseSteps(project);
  const paymentPlanPhases = Array.isArray(project?.paymentPlan?.phases)
    ? project.paymentPlan.phases
    : [];

  if (Array.isArray(project?.phases) && project.phases.length > 0) {
    return project.phases.map((phase, index) => {
      const summarySource = paymentPlanPhases[index]
        ? { ...phase, ...paymentPlanPhases[index] }
        : phase;
      const subLabel = resolvePhaseSummary(summarySource);

      return {
        label: phase?.label || phase?.name || `Phase ${index + 1}`,
        value: clampProgress(phase?.progress ?? phase?.value),
        progress: clampProgress(phase?.phaseProgress ?? phase?.progress ?? phase?.value),
        subLabel,
        steps: resolvePhaseStepsForDisplay(phaseSteps[index], summarySource, subLabel),
      };
    });
  }

  if (paymentPlanPhases.length > 0) {
    let completedBefore = 0;

    return paymentPlanPhases.map((phase, index) => {
      const totalTasks = Math.max(0, Number(phase?.totalTasks || 0));
      const verifiedTasks = Math.max(0, Number(phase?.verifiedTasks || 0));
      const phaseCompletion =
        totalTasks > 0 ? Math.min(verifiedTasks / totalTasks, 1) : phase?.isComplete ? 1 : 0;
      const value = Math.round(
        ((completedBefore + phaseCompletion) / paymentPlanPhases.length) * 100,
      );

      if (phase?.isComplete) {
        completedBefore += 1;
      }

      const subLabel = resolvePhaseSummary(phase, phase?.isComplete ? "Completed" : "Pending");

      return {
        label: phase?.name || `Phase ${index + 1}`,
        value,
        progress: Math.round(phaseCompletion * 100),
        subLabel,
        steps: resolvePhaseStepsForDisplay(phaseSteps[index], phase, subLabel),
      };
    });
  }

  return buildDefaultPhases(Number(project?.phaseCount) || 4).map((phase, index) => {
    const sopPhase = Array.isArray(sop?.phases) ? sop.phases[index] : null;
    const cleanedSopPhaseName = String(sopPhase?.name || "")
      .replace(/\s*\(\s*Phase-\d+\s*\)/i, "")
      .trim();
    const steps = resolvePhaseStepsForDisplay(
      phaseSteps[index],
      phase,
      index === 0 ? "Current phase" : "Upcoming",
    );
    const completedStepCount = Array.isArray(steps)
      ? steps.filter((step) => String(step?.state || "").toLowerCase() === "complete").length
      : 0;
    const totalStepCount = Array.isArray(steps) ? steps.length : 0;
    const subLabel = totalStepCount > 0
      ? `${completedStepCount}/${totalStepCount} tasks done`
      : index === 0
        ? "Current phase"
        : "Upcoming";

    return {
      ...phase,
      label: cleanedSopPhaseName || phase.label,
      subLabel,
      steps,
    };
  });
};
// ========== End Phase Building Helper Functions ==========

const isProjectCompletedForDashboard = (project = {}) => {
  const cardModel = buildProjectCardModel(project);
  return String(cardModel?.statusMeta?.label || "").trim().toUpperCase() === "COMPLETED";
};

const isProposalCompletedForDashboard = (proposal = {}) => {
  const project = proposal?.project || {};

  if (isProjectCompletedForDashboard(project)) {
    return true;
  }

  const normalizedStatus = String(project?.status || "").trim().toUpperCase();
  if (normalizedStatus === "COMPLETED") {
    return true;
  }

  const explicitProgress = Number(project?.progress ?? proposal?.progress);
  if (Number.isFinite(explicitProgress) && explicitProgress >= 100) {
    return true;
  }

  const proposalAmount = Number(proposal?.amount) || 0;
  const projectSpent = Number(project?.spent);
  if (proposalAmount > 0 && Number.isFinite(projectSpent) && projectSpent >= proposalAmount) {
    return true;
  }

  const phases = Array.isArray(project?.paymentPlan?.phases) ? project.paymentPlan.phases : [];
  if (phases.length > 0) {
    const allPhasesComplete = phases.every((phase) => {
      if (phase?.isComplete) return true;
      const totalTasks = Math.max(0, Number(phase?.totalTasks || 0));
      const verifiedTasks = Math.max(0, Number(phase?.verifiedTasks || 0));
      return totalTasks > 0 && verifiedTasks >= totalTasks;
    });

    if (allPhasesComplete) {
      return true;
    }
  }

  return false;
};

const resolveProjectFingerprint = (proposal = {}) => {
  const project = proposal?.project || {};
  const projectId = String(project?.id || "").trim();
  if (projectId) {
    return `project:${projectId}`;
  }

  const businessKey = String(
    project?.businessName ||
      project?.companyName ||
      project?.brandName ||
      proposal?.businessName ||
      proposal?.companyName ||
      proposal?.brandName ||
      project?.title ||
      "",
  )
    .trim()
    .toLowerCase();

  const ownerKey = String(project?.owner?.id || project?.owner?.name || "")
    .trim()
    .toLowerCase();

  const amountKey = String(Number(proposal?.amount) || 0);
  return `fallback:${businessKey}|${ownerKey}|${amountKey}`;
};

const buildFreelancerProfileCompletion = (payload = {}) => {
  const personal =
    payload?.personal && typeof payload.personal === "object"
      ? payload.personal
      : {};
  const portfolio =
    payload?.portfolio && typeof payload.portfolio === "object"
      ? payload.portfolio
      : {};
  const profileDetails =
    payload?.profileDetails && typeof payload.profileDetails === "object"
      ? payload.profileDetails
      : {};
  const onboardingIdentity =
    profileDetails?.identity && typeof profileDetails.identity === "object"
      ? profileDetails.identity
      : {};
  const services = Array.isArray(payload?.services) ? payload.services : [];
  const portfolioProjects = Array.isArray(payload?.portfolioProjects)
    ? payload.portfolioProjects
    : [];
  const onboardingServices = Array.from(
    new Set([
      ...(Array.isArray(profileDetails?.services) ? profileDetails.services : []),
      ...(Array.isArray(services) ? services : []),
    ])
  )
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  const onboardingGlobalIndustry = toUniqueLabels([
    ...(Array.isArray(profileDetails?.globalIndustryFocus)
      ? profileDetails.globalIndustryFocus
      : []),
    profileDetails?.globalIndustryOther || "",
  ]);
  const onboardingAvailability =
    profileDetails?.availability && typeof profileDetails.availability === "object"
      ? profileDetails.availability
      : {};
  const onboardingServiceDetailMap =
    profileDetails?.serviceDetails &&
    typeof profileDetails.serviceDetails === "object"
      ? profileDetails.serviceDetails
      : {};

  const onboardingPlatformLinks = collectOnboardingPlatformLinks(
    onboardingServiceDetailMap
  );
  const fallbackPortfolioLink =
    onboardingPlatformLinks.find((entry) => isPortfolioLikeKey(entry.key))?.url ||
    "";
  const fallbackLinkedinLink =
    onboardingPlatformLinks.find((entry) => entry.key.includes("linkedin"))?.url ||
    "";
  const fallbackGithubLink =
    onboardingPlatformLinks.find((entry) => entry.key.includes("github"))?.url ||
    "";
  const resolvedPortfolioLink =
    normalizePresenceLink(portfolio.portfolioUrl) ||
    normalizePresenceLink(onboardingIdentity?.portfolioUrl) ||
    fallbackPortfolioLink;
  const resolvedLinkedinLink =
    normalizePresenceLink(portfolio.linkedinUrl) ||
    normalizePresenceLink(onboardingIdentity?.linkedinUrl) ||
    fallbackLinkedinLink;
  const resolvedGithubLink =
    normalizePresenceLink(portfolio.githubUrl) || fallbackGithubLink;
  const resolvedResumeLink = normalizePresenceLink(portfolio.resume);

  const onboardingServiceEntries = Array.from(
    new Set([...onboardingServices, ...Object.keys(onboardingServiceDetailMap)])
  )
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .map((serviceKey) => ({
      serviceKey,
      detail: onboardingServiceDetailMap?.[serviceKey] || {},
    }));

  const serviceEntriesMissingDescription = onboardingServiceEntries.filter(
    ({ detail }) =>
      !hasTextValue(detail?.serviceDescription || detail?.description)
  ).length;
  const serviceEntriesMissingCover = onboardingServiceEntries.filter(
    ({ detail }) => !resolveAvatarUrl(detail?.coverImage, { allowBlob: true })
  ).length;
  const serviceEntriesWithAnyProfileData = onboardingServiceEntries.filter(
    ({ detail }) => {
      const description = String(
        detail?.serviceDescription || detail?.description || ""
      ).trim();
      const coverImage = resolveAvatarUrl(detail?.coverImage, { allowBlob: true });
      return Boolean(description || coverImage);
    }
  ).length;
  const serviceProfileCoverage = onboardingServiceEntries.length
    ? serviceEntriesWithAnyProfileData / onboardingServiceEntries.length
    : 0;

  const uniqueSkillCount = toUniqueSkillNames(
    (Array.isArray(payload?.skills) ? payload.skills : []).map(
      (entry) => entry?.name || entry
    )
  ).length;
  const missingSkillCount = Math.max(0, 5 - uniqueSkillCount);
  const skillsCoverage = Math.min(uniqueSkillCount, 5) / 5;

  const profileLinkCandidates = [
    { label: "Portfolio", value: resolvedPortfolioLink },
    { label: "LinkedIn", value: resolvedLinkedinLink },
    { label: "GitHub", value: resolvedGithubLink },
  ];
  const availableProfileLinkLabels = profileLinkCandidates
    .filter((item) => Boolean(item.value))
    .map((item) => item.label);
  const missingProfileLinkLabels = profileLinkCandidates
    .filter((item) => !item.value)
    .map((item) => item.label);
  const missingProfileLinkCount = Math.max(0, 2 - availableProfileLinkLabels.length);
  const linkCoverage = Math.min(availableProfileLinkLabels.length, 2) / 2;

  const normalizedWorkExperience = normalizeWorkExperienceEntries(
    Array.isArray(payload?.workExperience) ? payload.workExperience : []
  );
  const hasWorkExperienceEntries = normalizedWorkExperience.length > 0;
  const normalizedEducationEntries = collectEducationEntriesFromProfileDetails(
    profileDetails
  );
  const hasEducationEntries = normalizedEducationEntries.some((entry) => {
    if (!entry || typeof entry !== "object") return false;
    return (
      hasTextValue(entry.school) ||
      hasTextValue(entry.degree) ||
      hasTextValue(entry.field) ||
      hasTextValue(entry.country) ||
      hasTextValue(entry.startMonth) ||
      hasTextValue(entry.startYear) ||
      hasTextValue(entry.endMonth) ||
      hasTextValue(entry.endYear) ||
      hasTextValue(entry.graduationYear) ||
      hasTextValue(entry.grade) ||
      hasTextValue(entry.activities)
    );
  });

  const availabilityMissingDetails = [];
  if (!hasTextValue(onboardingAvailability?.hoursPerWeek)) {
    availabilityMissingDetails.push("weekly hours");
  }
  if (!hasTextValue(onboardingAvailability?.startTimeline)) {
    availabilityMissingDetails.push("start timeline");
  }
  const availabilityCoverage = (2 - availabilityMissingDetails.length) / 2;

  const policyMissingDetails = [];
  if (!profileDetails?.deliveryPolicyAccepted) {
    policyMissingDetails.push("delivery policy");
  }
  if (!profileDetails?.communicationPolicyAccepted) {
    policyMissingDetails.push("communication policy");
  }
  if (!hasTextValue(profileDetails?.acceptInProgressProjects)) {
    policyMissingDetails.push("in-progress project preference");
  }
  const policiesCoverage = (3 - policyMissingDetails.length) / 3;

  const profilePhotoUrl = resolveAvatarUrl(personal.avatar);
  const profileCoverUrl =
    resolveAvatarUrl(personal.coverImage) ||
    resolveAvatarUrl(onboardingIdentity?.coverImage) ||
    resolveAvatarUrl(profileDetails?.identity?.coverImage);
  const hasProfilePhoto = Boolean(profilePhotoUrl);
  const hasProfileCover = Boolean(profileCoverUrl || profilePhotoUrl);
  const hasProfessionalTitle = hasTextValue(onboardingIdentity?.professionalTitle);
  const hasProfessionalBio = hasTextValue(
    profileDetails?.professionalBio || personal?.bio
  );
  const hasCountry = hasTextValue(onboardingIdentity?.country);
  const hasCity = hasTextValue(onboardingIdentity?.city);
  const hasSelectedServices = onboardingServiceEntries.length > 0;
  const hasFeaturedProject = portfolioProjects.length > 0;
  const hasIndustryFocus = onboardingGlobalIndustry.length > 0;

  const profileCompletionCriteria = [
    { label: "Profile photo", score: hasProfilePhoto ? 1 : 0, weight: 4 },
    { label: "Profile cover", score: hasProfileCover ? 1 : 0, weight: 4 },
    {
      label: "Professional title",
      score: hasProfessionalTitle ? 1 : 0,
      weight: 8,
    },
    {
      label: "Professional bio",
      score: hasProfessionalBio ? 1 : 0,
      weight: 10,
    },
    {
      label: "Location details",
      score: hasCountry && hasCity ? 1 : 0,
      weight: 8,
    },
    {
      label: "Services selected",
      score: hasSelectedServices ? 1 : 0,
      weight: 12,
    },
    {
      label: "Service description/cover",
      score: serviceProfileCoverage,
      weight: 10,
    },
    {
      label: "Skills and tech stack",
      score: skillsCoverage,
      weight: 10,
    },
    {
      label: "Availability setup",
      score: availabilityCoverage,
      weight: 8,
    },
    { label: "Profile links", score: linkCoverage, weight: 8 },
    {
      label: "Featured project",
      score: hasFeaturedProject ? 1 : 0,
      weight: 8,
    },
    {
      label: "Resume uploaded",
      score: resolvedResumeLink ? 1 : 0,
      weight: 6,
    },
    {
      label: "Work experience",
      score: hasWorkExperienceEntries ? 1 : 0,
      weight: 6,
    },
    {
      label: "Education history",
      score: hasEducationEntries ? 1 : 0,
      weight: 6,
    },
    {
      label: "Industry focus",
      score: hasIndustryFocus ? 1 : 0,
      weight: 5,
    },
    { label: "Policies accepted", score: policiesCoverage, weight: 5 },
  ];

  const totalWeight = profileCompletionCriteria.reduce(
    (sum, item) => sum + item.weight,
    0
  );
  const totalScore = profileCompletionCriteria.reduce(
    (sum, item) => sum + item.score * item.weight,
    0
  );
  const percent = Math.round(
    Math.max(0, Math.min(100, totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0))
  );

  const completedSections = profileCompletionCriteria.filter(
    (item) => item.score >= 0.999
  ).length;
  const partialSections = profileCompletionCriteria.filter(
    (item) => item.score > 0 && item.score < 0.999
  ).length;

  const missingDetails = [];
  if (!hasProfilePhoto) {
    missingDetails.push("Upload a clear profile image.");
  }

  if (!hasProfileCover) {
    missingDetails.push("Add a cover image to strengthen your profile header.");
  }

  if (!hasProfessionalTitle) {
    missingDetails.push("Add your headline or role title.");
  }

  if (!hasProfessionalBio) {
    missingDetails.push("Write a short bio that highlights your expertise.");
  }

  if (!hasCountry || !hasCity) {
    const missingLocationParts = [];
    if (!hasCity) missingLocationParts.push("city");
    if (!hasCountry) missingLocationParts.push("country");
    missingDetails.push(`Add your ${missingLocationParts.join(" and ")}.`);
  }

  if (!hasSelectedServices) {
    missingDetails.push("Select at least one service you offer.");
  }

  if (hasSelectedServices && serviceProfileCoverage < 1) {
    const serviceDetailGaps = [];
    if (serviceEntriesMissingDescription > 0) {
      serviceDetailGaps.push(
        `${serviceEntriesMissingDescription} description${serviceEntriesMissingDescription === 1 ? "" : "s"}`
      );
    }
    if (serviceEntriesMissingCover > 0) {
      serviceDetailGaps.push(
        `${serviceEntriesMissingCover} cover image${serviceEntriesMissingCover === 1 ? "" : "s"}`
      );
    }
    missingDetails.push(
      `Complete ${serviceDetailGaps.join(" and ")} across your selected services.`
    );
  }

  if (skillsCoverage < 1) {
    missingDetails.push(
      missingSkillCount > 0
        ? `Add ${missingSkillCount} more skill${missingSkillCount === 1 ? "" : "s"} (target: 5).`
        : "Add a clearer tech stack with up to 5 key skills."
    );
  }

  if (availabilityMissingDetails.length > 0) {
    missingDetails.push(`Add ${availabilityMissingDetails.join(", ")}.`);
  }

  if (linkCoverage < 1) {
    const suggestedLinks = missingProfileLinkLabels.slice(0, 2).join(" or ");
    missingDetails.push(
      suggestedLinks
        ? `Add ${missingProfileLinkCount} more link${missingProfileLinkCount === 1 ? "" : "s"} (suggested: ${suggestedLinks}).`
        : `Add ${missingProfileLinkCount} more profile link${missingProfileLinkCount === 1 ? "" : "s"}.`
    );
  }

  if (!hasFeaturedProject) {
    missingDetails.push("Add at least one project to your portfolio.");
  }

  if (!resolvedResumeLink) {
    missingDetails.push("Upload your resume so clients can quickly review your profile.");
  }

  if (!hasWorkExperienceEntries) {
    missingDetails.push("Add at least one work experience entry.");
  }

  if (!hasEducationEntries) {
    missingDetails.push("Add your education details (school, degree, or year).");
  }

  if (!hasIndustryFocus) {
    missingDetails.push("Select your global industry focus.");
  }

  if (policyMissingDetails.length > 0) {
    missingDetails.push(`Review and complete: ${policyMissingDetails.join(", ")}.`);
  }

  let message = "Complete key sections to improve visibility.";
  if (percent >= 90) {
    message = "Your profile is client-ready.";
  } else if (percent >= 70) {
    message = "Almost there. Finish a few details to boost trust.";
  }

  return {
    percent,
    message,
    completedSections,
    partialSections,
    totalSections: profileCompletionCriteria.length,
    missingDetails: missingDetails.slice(0, 4),
  };
};

const ACTIVITY_TONE_STYLES = {
  emerald: {
    icon: "bg-emerald-500/12 text-emerald-400 ring-1 ring-emerald-500/20",
    badge: "bg-emerald-500/12 text-emerald-300",
  },
  amber: {
    icon: "bg-amber-500/12 text-amber-300 ring-1 ring-amber-500/20",
    badge: "bg-amber-500/12 text-amber-200",
  },
  blue: {
    icon: "bg-blue-500/12 text-blue-300 ring-1 ring-blue-500/20",
    badge: "bg-blue-500/12 text-blue-200",
  },
  violet: {
    icon: "bg-violet-500/12 text-violet-300 ring-1 ring-violet-500/20",
    badge: "bg-violet-500/12 text-violet-200",
  },
  rose: {
    icon: "bg-rose-500/12 text-rose-300 ring-1 ring-rose-500/20",
    badge: "bg-rose-500/12 text-rose-200",
  },
  slate: {
    icon: "bg-secondary/70 text-muted-foreground ring-1 ring-border",
    badge: "bg-secondary/70 text-muted-foreground",
  },
};

const FREELANCER_MOBILE_RECENT_ACTIVITY_PREVIEW_COUNT = 2;

const formatDashboardActivityTime = (value) => {
  if (!value) return "Now";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Now";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / (60 * 1000)));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";

  return `${diffDays}d ago`;
};

const FREELANCER_DASHBOARD_PANEL_CLASSNAME =
  "overflow-hidden rounded-[24px] border border-white/[0.08] bg-card";

const freelancerPendingProposalSurfaceToneClassName =
  "border border-white/[0.06] bg-card shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]";

const freelancerPendingProposalDetailBlockClassName =
  `flex min-w-0 flex-col rounded-[14px] ${freelancerPendingProposalSurfaceToneClassName} px-4 py-3 sm:px-5 sm:py-3.5 lg:min-h-[84px]`;

const freelancerPendingProposalActionButtonClassName =
  "inline-flex h-11 w-full items-center justify-center whitespace-nowrap rounded-[10px] px-4 text-sm font-semibold transition-colors";

const freelancerCompactEarningsSurfaceClassName =
  "rounded-[20px] border border-white/[0.06] bg-white/[0.03] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:px-5 sm:py-5";

const freelancerDashboardCurrencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const formatFreelancerDashboardCurrency = (amount) =>
  freelancerDashboardCurrencyFormatter.format(Number(amount) || 0);

const FREELANCER_SHARE_RATIO = 0.7;

const toFreelancerShareAmount = (amount) =>
  Math.round((Number(amount) || 0) * FREELANCER_SHARE_RATIO);

const INITIAL_FREELANCER_DASHBOARD_METRICS = {
  activeProjects: 0,
  completedProjects: 0,
  proposalsReceived: 0,
  acceptedProposals: [],
  pendingProposals: [],
  earnings: 0,
  receivedEarnings: 0,
  pendingEarnings: 0,
  totalProposals: 0,
};

const summarizeFreelancerDashboardMetrics = (proposals = []) => {
  const pendingProposals = [];
  const uniqueAcceptedByProject = new Map();

  proposals.forEach((proposal) => {
    const normalizedStatus = String(proposal?.status || "").toUpperCase();

    if (normalizedStatus === "PENDING") {
      pendingProposals.push(proposal);
    }

    if (normalizedStatus === "ACCEPTED") {
      const key = resolveProjectFingerprint(proposal);
      if (key && !uniqueAcceptedByProject.has(key)) {
        uniqueAcceptedByProject.set(key, proposal);
      }
    }
  });

  const acceptedProposals = Array.from(uniqueAcceptedByProject.values());
  let activeProjects = 0;
  let completedProjects = 0;
  let totalReceived = 0;
  let totalPending = 0;

  acceptedProposals.forEach((proposal) => {
    const proposalAmount = Number(proposal?.amount) || 0;
    const isCompleted = isProposalCompletedForDashboard(proposal);

    if (isCompleted) {
      completedProjects += 1;
      totalReceived += proposalAmount;
      return;
    }

    activeProjects += 1;
    totalPending += proposalAmount;
  });

  const receivedEarnings = Math.round(totalReceived * 0.7);
  const pendingEarnings = Math.round(totalPending * 0.7);

  return {
    activeProjects,
    completedProjects,
    proposalsReceived: pendingProposals.length,
    acceptedProposals,
    pendingProposals,
    earnings: receivedEarnings + pendingEarnings,
    receivedEarnings,
    pendingEarnings,
    totalProposals: proposals.length,
  };
};

const FreelancerDashboardPanel = ({ className = "", children }) => (
  <div className={`${FREELANCER_DASHBOARD_PANEL_CLASSNAME} ${className}`.trim()}>
    {children}
  </div>
);

const freelancerDashboardSkeletonClassName = "bg-white/[0.08]";

const FreelancerDashboardSkeletonBlock = ({ className }) => (
  <Skeleton className={cn(freelancerDashboardSkeletonClassName, className)} />
);

const freelancerMetricSkeletonItems = [
  { id: "active-projects", hasControl: false },
  { id: "completed-projects", hasControl: false },
  { id: "pending-proposals", hasControl: false },
  { id: "total-earnings", hasControl: true },
];

const FreelancerMetricCardSkeleton = ({ item }) => {
  const shouldSpanFullWidth = item.id === "pending-proposals" || item.id === "total-earnings";

  return (
    <FreelancerDashboardPanel
      className={cn(
        "group relative min-h-[136px] border border-transparent bg-card px-3.5 py-4 sm:min-h-[110px] sm:p-5",
        shouldSpanFullWidth && "col-span-2 xl:col-span-1",
      )}
    >
      <div className="flex h-full flex-col items-center justify-center text-center sm:hidden">
        {item.hasControl ? (
          <div className="flex w-full items-center justify-between">
            <span className="size-10 shrink-0" aria-hidden="true" />
            <FreelancerDashboardSkeletonBlock className="size-10 rounded-[16px]" />
            <FreelancerDashboardSkeletonBlock className="size-10 rounded-[16px]" />
          </div>
        ) : (
          <FreelancerDashboardSkeletonBlock className="size-10 rounded-[16px]" />
        )}
        <FreelancerDashboardSkeletonBlock className="mt-4 h-8 w-16 rounded-full" />
        <FreelancerDashboardSkeletonBlock className="mt-3 h-3 w-24 rounded-full" />
      </div>

      <div className="hidden h-full flex-col gap-2.5 sm:flex sm:gap-3">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex min-w-0 items-start gap-2 sm:items-center sm:gap-3">
            <FreelancerDashboardSkeletonBlock className="size-9 shrink-0 rounded-lg" />
            <FreelancerDashboardSkeletonBlock className="h-4 w-32 rounded-full" />
          </div>
          {item.hasControl ? (
            <FreelancerDashboardSkeletonBlock className="size-9 shrink-0 rounded-lg" />
          ) : null}
        </div>

        <div className="mt-auto flex min-w-0 items-end gap-1.5 sm:gap-2">
          <FreelancerDashboardSkeletonBlock className="h-8 w-20 rounded-full" />
        </div>
      </div>
    </FreelancerDashboardPanel>
  );
};

const FreelancerMetricCardsSkeleton = () => (
  <section className="grid auto-rows-fr grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
    {freelancerMetricSkeletonItems.map((item) => (
      <FreelancerMetricCardSkeleton
        key={`freelancer-metric-skeleton-${item.id}`}
        item={item}
      />
    ))}
  </section>
);

const FreelancerActiveProjectsSkeleton = () => (
  <section>
    <div className="mb-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <FreelancerDashboardSkeletonBlock className="h-8 w-44 rounded-full" />
        <FreelancerDashboardSkeletonBlock className="size-3 rounded-full" />
      </div>
      <div className="flex items-center gap-2">
        <FreelancerDashboardSkeletonBlock className="size-8 rounded-full" />
        <FreelancerDashboardSkeletonBlock className="size-8 rounded-full" />
      </div>
    </div>

    <div className="grid items-start gap-5 sm:gap-6 xl:gap-7 md:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <ProjectCardSkeleton key={`freelancer-active-project-skeleton-${item}`} />
      ))}
    </div>
  </section>
);

const FreelancerPendingProposalsSkeleton = () => (
  <section className="w-full min-w-0">
    <div className="mb-4 flex items-center gap-4 sm:mb-5">
      <FreelancerDashboardSkeletonBlock className="h-8 w-52 rounded-full" />
    </div>

    <FreelancerDashboardPanel className="overflow-hidden bg-card">
      <div className="divide-y divide-white/[0.06]">
        {[0, 1, 2].map((item) => (
          <div
            key={`freelancer-pending-proposal-skeleton-${item}`}
            className="px-4 py-5 sm:px-6 sm:py-6"
          >
            <div className="grid w-full min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_184px] lg:items-end">
              <div className="min-w-0">
                <FreelancerDashboardSkeletonBlock className="h-8 w-44 rounded-full" />

                <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
                  <div className={freelancerPendingProposalDetailBlockClassName}>
                    <FreelancerDashboardSkeletonBlock className="h-3 w-20 rounded-full" />
                    <FreelancerDashboardSkeletonBlock className="mt-3 h-6 w-24 rounded-full" />
                  </div>

                  <div className={freelancerPendingProposalDetailBlockClassName}>
                    <FreelancerDashboardSkeletonBlock className="h-3 w-16 rounded-full" />
                    <FreelancerDashboardSkeletonBlock className="mt-3 h-6 w-28 rounded-full" />
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-col gap-2.5 lg:h-[76px] lg:items-end lg:justify-end lg:gap-2">
                <FreelancerDashboardSkeletonBlock className="h-11 w-full rounded-[10px] lg:h-auto lg:min-h-0 lg:max-w-[184px] lg:flex-1" />
                <FreelancerDashboardSkeletonBlock className="h-11 w-full rounded-[10px] lg:h-auto lg:min-h-0 lg:max-w-[184px] lg:flex-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </FreelancerDashboardPanel>
  </section>
);

const FreelancerRecentActivitySkeleton = () => (
  <section className="w-full min-w-0">
    <div className="mb-4 flex items-center justify-between gap-4 sm:mb-5">
      <FreelancerDashboardSkeletonBlock className="h-8 w-44 rounded-full" />
      <FreelancerDashboardSkeletonBlock className="h-4 w-16 rounded-full" />
    </div>

    <FreelancerDashboardPanel className="overflow-hidden bg-card">
      {[0, 1, 2, 3].map((item) => (
        <div
          key={`freelancer-activity-skeleton-${item}`}
          className="flex flex-col gap-3 px-4 py-4 sm:px-6 sm:py-5 lg:flex-row lg:items-center lg:justify-between lg:gap-4"
        >
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <FreelancerDashboardSkeletonBlock className="size-9 rounded-full sm:size-10" />
            <div className="min-w-0 space-y-2">
              <FreelancerDashboardSkeletonBlock className="h-4 w-40 rounded-full" />
              <FreelancerDashboardSkeletonBlock className="h-3 w-56 rounded-full" />
            </div>
          </div>
          <FreelancerDashboardSkeletonBlock className="h-3 w-12 rounded-full" />
        </div>
      ))}
    </FreelancerDashboardPanel>
  </section>
);

const FreelancerActivityRow = ({ item, compact = false }) => {
  const Icon = item.icon || FolderKanban;
  const tone = ACTIVITY_TONE_STYLES[item.tone] || ACTIVITY_TONE_STYLES.slate;

  if (compact) {
    return (
      <button
        type="button"
        onClick={item.onClick}
        className="flex w-full items-start gap-4 rounded-[18px] px-3 py-3 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div className={cn("mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full", tone.icon)}>
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[1.05rem] font-semibold leading-tight text-white">
            {item.title}
          </p>
          <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {item.subtitle}
          </p>
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
        <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-full sm:size-10", tone.icon)}>
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{item.title}</p>
          <p className="text-xs leading-5 text-muted-foreground sm:truncate">{item.subtitle}</p>
        </div>
      </div>
      <span className="pl-12 text-xs text-muted-foreground sm:pl-13 lg:pl-0">{item.timeLabel}</span>
    </button>
  );
};

const FreelancerRecentActivitySection = ({ recentActivities, onOpenViewAll }) => {
  const isMobile = useIsMobile();
  const [showAllRecentActivities, setShowAllRecentActivities] = useState(false);

  useEffect(() => {
    if (!isMobile) {
      setShowAllRecentActivities(false);
    }
  }, [isMobile]);

  const hasOverflow = recentActivities.length > FREELANCER_MOBILE_RECENT_ACTIVITY_PREVIEW_COUNT;
  const visibleActivities =
    isMobile && !showAllRecentActivities
      ? recentActivities.slice(0, FREELANCER_MOBILE_RECENT_ACTIVITY_PREVIEW_COUNT)
      : recentActivities;
  const remainingActivityCount = Math.max(
    0,
    recentActivities.length - FREELANCER_MOBILE_RECENT_ACTIVITY_PREVIEW_COUNT,
  );

  return (
    <section className="w-full min-w-0">
      <div className="mb-4 flex items-center justify-between gap-4 sm:mb-5">
        <h2 className="text-[1.55rem] font-semibold tracking-[-0.04em] text-white sm:text-[1.65rem]">
          Recent Activity
        </h2>
        <button
          type="button"
          onClick={onOpenViewAll}
          className="ml-auto shrink-0 text-xs font-bold uppercase tracking-[0.18em] text-[#ffc107] transition-colors hover:text-[#ffd54f]"
        >
          View All
        </button>
      </div>

      <FreelancerDashboardPanel className="overflow-hidden bg-card">
        {recentActivities.length === 0 ? (
          <div className="px-5 py-6 text-sm text-[#8f96a3] sm:px-6">
            No recent activity yet.
          </div>
        ) : isMobile ? (
          <div className="px-3 pb-3 pt-3">
            <div className="space-y-1">
              {visibleActivities.map((item) => (
                <FreelancerActivityRow key={item.id} item={item} compact />
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
              <FreelancerActivityRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </FreelancerDashboardPanel>
    </section>
  );
};

const FreelancerProfileCompletionSkeleton = () => (
  <section>
    <FreelancerDashboardPanel className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <FreelancerDashboardSkeletonBlock className="h-8 w-[26rem] max-w-full rounded-full" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:w-auto lg:justify-end">
          <FreelancerDashboardSkeletonBlock className="h-5 w-24 rounded-full" />
          <FreelancerDashboardSkeletonBlock className="h-10 w-full rounded-full sm:w-32" />
        </div>
      </div>
      <FreelancerDashboardSkeletonBlock className="mt-5 h-2 w-full rounded-full" />
    </FreelancerDashboardPanel>
  </section>
);

const FreelancerChatsSkeleton = () => (
  <section className="w-full min-w-0">
    <div className="mb-4 sm:mb-5">
      <FreelancerDashboardSkeletonBlock className="h-8 w-40 rounded-full" />
    </div>
    <FreelancerDashboardPanel className="h-fit self-start p-4 sm:p-5">
      <div className="space-y-4 sm:space-y-5">
        {[0, 1].map((item) => (
          <div key={`freelancer-chat-skeleton-${item}`} className="rounded-[18px] bg-white/[0.03] px-3.5 py-3.5">
            <div className="flex items-start gap-3">
              <FreelancerDashboardSkeletonBlock className="size-10 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <FreelancerDashboardSkeletonBlock className="h-5 w-36 rounded-full" />
                  <FreelancerDashboardSkeletonBlock className="h-3 w-12 rounded-full" />
                </div>
                <FreelancerDashboardSkeletonBlock className="h-4 w-full rounded-full" />
                <FreelancerDashboardSkeletonBlock className="h-4 w-2/3 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <FreelancerDashboardSkeletonBlock className="mt-8 h-4 w-40 rounded-full" />
    </FreelancerDashboardPanel>
  </section>
);

const FreelancerCompactEarningsSummarySkeleton = () => (
  <section className="w-full min-w-0">
    <div className="mb-4 sm:mb-5">
      <FreelancerDashboardSkeletonBlock className="h-8 w-28 rounded-full" />
    </div>
    <FreelancerDashboardPanel className="overflow-hidden bg-card p-3.5 sm:p-4">

      <div className="space-y-3.5 sm:space-y-4">
        {[0, 1].map((item) => (
          <div
            key={`freelancer-compact-earnings-skeleton-${item}`}
            className={freelancerCompactEarningsSurfaceClassName}
          >
            <FreelancerDashboardSkeletonBlock className="h-3 w-20 rounded-full" />
            <FreelancerDashboardSkeletonBlock className="mt-3.5 h-7 w-32 rounded-full" />
            <FreelancerDashboardSkeletonBlock className="mt-2.5 h-4 w-40 rounded-full" />
            <FreelancerDashboardSkeletonBlock className="mt-4 h-4 w-28 rounded-full" />
          </div>
        ))}
      </div>
    </FreelancerDashboardPanel>
  </section>
);

const FreelancerCompactEarningsSummary = ({
  receivedAmount,
  pendingAmount,
  momentumLabel,
  nextPayoutLabel,
}) => (
  <section className="w-full min-w-0">
    <div className="mb-4 sm:mb-5">
      <h2 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-white sm:text-[1.65rem]">
        Earnings
      </h2>
    </div>
    <FreelancerDashboardPanel className="overflow-hidden bg-card p-3.5 sm:p-4">

      <div className="space-y-3.5 sm:space-y-4">
        <div className={freelancerCompactEarningsSurfaceClassName}>
          <p className="text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground">
            Received
          </p>
          <p className="mt-3.5 text-[1.65rem] font-semibold leading-none tracking-[-0.03em] text-white sm:text-[1.8rem]">
            {receivedAmount}
          </p>
          <p className="mt-2.5 text-sm text-muted-foreground">
            Cleared freelancer earnings
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <TrendingUp className="size-3.5" />
            <span>{momentumLabel}</span>
          </div>
        </div>

        <div className={freelancerCompactEarningsSurfaceClassName}>
          <p className="text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground">
            Pending
          </p>
          <p className="mt-3.5 text-[1.65rem] font-semibold leading-none tracking-[-0.03em] text-white sm:text-[1.8rem]">
            {pendingAmount}
          </p>
          <p className="mt-2.5 text-sm text-muted-foreground">
            Expected from active projects
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Clock className="size-3.5" />
            <span>{nextPayoutLabel}</span>
          </div>
        </div>
      </div>
    </FreelancerDashboardPanel>
  </section>
);

const FreelancerEarningsSkeleton = () => (
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
            <Card key={`freelancer-earnings-stat-skeleton-${item}`} className="border-white/[0.08] bg-background/30 shadow-none">
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

const FreelancerMetricCard = ({
  icon: Icon,
  title,
  value,
  detail,
  onClick,
  ariaLabel,
  control,
  className = "",
}) => {
  const handleKeyDown = (event) => {
    if (typeof onClick !== "function") return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };
  const renderDesktopControl = () => (control ? <div className="shrink-0">{control}</div> : null);

  return (
    <article
      className={`group relative flex min-h-[136px] flex-col rounded-[24px] border border-transparent bg-card px-3.5 py-4 transition-colors hover:border-[#facc15]/70 sm:min-h-[110px] sm:p-5 ${onClick ? "cursor-pointer" : ""} ${className}`.trim()}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
    >
      <div className="flex h-full flex-col items-center justify-center text-center sm:hidden">
        {control ? (
          <div className="flex w-full items-center justify-between">
            <span className="size-10 shrink-0 sm:size-14" aria-hidden="true" />
            <div className="flex size-10 shrink-0 items-center justify-center rounded-[16px] bg-white/[0.06] text-muted-foreground/75 sm:size-14 sm:rounded-[18px]">
              <Icon className="size-[18px] text-muted-foreground/75 sm:size-[22px]" />
            </div>
            <div className="shrink-0">{control}</div>
          </div>
        ) : (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-[16px] bg-white/[0.06] text-muted-foreground/75 sm:size-14 sm:rounded-[18px]">
            <Icon className="size-[18px] text-muted-foreground/75 sm:size-[22px]" />
          </div>
        )}
        <p className="mt-4 shrink-0 text-[2rem] font-semibold leading-none tracking-[-0.05em] text-white transition-colors group-hover:text-[#facc15] sm:mt-6 sm:text-[3rem]">
          {value}
        </p>
        <p className="mt-3 text-center text-[8px] font-medium uppercase tracking-[0.14em] text-muted-foreground sm:mt-4 sm:text-[11px] sm:tracking-[0.2em]">
          {title}
        </p>
        {detail ? (
          <p className="mt-2 min-w-0 text-xs leading-5 text-[#6b7280]">{detail}</p>
        ) : null}
      </div>
      <div className="hidden h-full flex-col gap-2.5 sm:flex sm:gap-3">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex min-w-0 items-start gap-2 sm:items-center sm:gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-muted-foreground/75">
              <Icon className="size-4 text-muted-foreground/75" />
            </div>
            <p className="line-clamp-2 text-[11px] font-medium uppercase leading-4 tracking-[0.12em] text-muted-foreground">
              {title}
            </p>
          </div>
          {renderDesktopControl()}
        </div>
        <div className="mt-auto flex min-w-0 items-end gap-1.5 sm:gap-2">
          <p className="shrink-0 text-[1.75rem] font-semibold leading-none tracking-[-0.02em] text-white transition-colors group-hover:text-[#facc15]">
            {value}
          </p>
          {detail ? (
            <p className="min-w-0 truncate text-xs leading-4 text-[#6b7280]">{detail}</p>
          ) : null}
        </div>
      </div>
    </article>
  );
};

const FreelancerProjectCarouselControls = ({
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  previousLabel = "Show previous active freelancer projects",
  nextLabel = "Show next active freelancer projects",
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

const FreelancerCarouselDots = ({
  count,
  activeIndex,
  onSelect,
  ariaLabel,
  getDotLabel,
}) => {
  if (count <= 1) return null;

  return (
    <div className="mt-2.5 flex items-center justify-center gap-2" aria-label={ariaLabel}>
      {Array.from({ length: count }, (_, index) => {
        const isActive = index === activeIndex;

        return (
          <button
            key={`freelancer-carousel-dot-${index}`}
            type="button"
            onClick={() => onSelect(index)}
            aria-label={getDotLabel(index)}
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

const FreelancerRunningProjectCard = ({
  item,
  isSelected,
  canShowSelection,
  onSelect,
}) => {
  const statusBg = "bg-[#2f1e05] text-[#fbbf24]";
  const lineBg = "bg-primary";
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
        canShowSelection && isSelected && "border-transparent bg-card shadow-[inset_0_0_0_2px_rgba(250,204,21,1)]",
      )}
    >
      <CardContent className={cn("p-4 pb-6", canShowSelection && isSelected && "pb-7")}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                {String(item?.clientLabel || "").toUpperCase()}
              </p>
              <p className="mt-2 truncate text-[1.15rem] font-semibold tracking-[-0.03em] text-white">
                {item?.title}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">{item?.timeLabel}</p>
            </div>

            <Badge className={cn("rounded-[10px] border-0 px-3 py-1 text-[11px] font-semibold", statusBg)}>
              {badgeLabel}
            </Badge>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Freelancer share</span>
              <span className="font-semibold text-zinc-100">{item?.amount}</span>
            </div>
            <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div className={cn("h-full rounded-full", lineBg)} style={{ width: `${progress}%` }} />
            </div>
          </div>
      </CardContent>
    </Card>
  );
};

const FreelancerPendingProposalRow = ({ item }) => (
  <div className="grid w-full min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_184px] lg:items-end">
    <div className="min-w-0 w-full">
      <p className="min-w-0 truncate text-[clamp(1.5rem,5vw,2.15rem)] font-semibold tracking-[-0.04em] text-white">
        {item.title}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3 sm:gap-3">
        <div className={freelancerPendingProposalDetailBlockClassName}>
          <p className="text-[0.76rem] uppercase tracking-[0.16em] text-muted-foreground">
            Service
          </p>
          <p className="mt-2.5 break-words text-[1.1rem] font-semibold tracking-[-0.02em] text-white">
            {item.service}
          </p>
        </div>

        <div className={freelancerPendingProposalDetailBlockClassName}>
          <p className="text-[0.76rem] uppercase tracking-[0.16em] text-muted-foreground">
            Budget
          </p>
          <p className="mt-2.5 text-[1.1rem] font-semibold tracking-[-0.02em] text-white">
            {item.budget}
          </p>
        </div>

        <div className={freelancerPendingProposalDetailBlockClassName}>
          <p className="text-[0.76rem] uppercase tracking-[0.16em] text-muted-foreground">
            Received
          </p>
          <p className="mt-2.5 break-words text-[1.1rem] font-semibold tracking-[-0.02em] text-white">
            {item.updatedAt || "Just now"}
          </p>
        </div>
      </div>
    </div>

    <div className="flex w-full flex-col gap-2.5 lg:h-[76px] lg:items-end lg:justify-end lg:gap-2">
      <button
        type="button"
        onClick={item.onView}
        disabled={item.isAccepting}
        className={cn(
          freelancerPendingProposalActionButtonClassName,
          "bg-[#ffc107] text-black hover:bg-[#ffd54f] lg:h-auto lg:min-h-0 lg:max-w-[184px] lg:flex-1",
          item.isAccepting && "cursor-not-allowed opacity-60",
        )}
      >
        View Details
      </button>

      <button
        type="button"
        onClick={item.onAccept}
        disabled={item.isAccepting}
        className={cn(
          freelancerPendingProposalActionButtonClassName,
          "border border-emerald-600 bg-transparent text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 lg:h-auto lg:min-h-0 lg:max-w-[184px] lg:flex-1",
          item.isAccepting && "cursor-not-allowed opacity-60",
        )}
      >
        {item.isAccepting ? "Accepting..." : "Accept Proposal"}
      </button>
    </div>
  </div>
);

const FreelancerPendingProposalCard = ({ item }) => (
  <article className="flex h-auto w-full max-w-full min-w-0 flex-col overflow-x-clip overflow-y-hidden rounded-[28px] border border-white/[0.06] bg-card p-4 transition-transform duration-200 hover:-translate-y-1 sm:p-5 xl:p-6">
    <FreelancerPendingProposalRow item={item} />
  </article>
);

const FreelancerPendingProposalListPanel = ({ pendingProposalRows }) => (
  <FreelancerDashboardPanel className="overflow-hidden bg-card">
    <div className="divide-y divide-white/[0.06]">
      {pendingProposalRows.map((item) => (
        <div key={item.id} className="px-4 py-5 sm:px-6 sm:py-6">
          <FreelancerPendingProposalRow item={item} />
        </div>
      ))}
    </div>
  </FreelancerDashboardPanel>
);

const FreelancerPendingProposalsSection = ({
  pendingProposalRows,
  onOpenAll,
  className = "",
}) => {
  const isMobile = useIsMobile();
  const shouldUsePendingProposalCarousel = isMobile && pendingProposalRows.length > 1;
  const [pendingProposalCarouselApi, setPendingProposalCarouselApi] = useState(null);
  const [canGoToPreviousPendingProposal, setCanGoToPreviousPendingProposal] = useState(false);
  const [canGoToNextPendingProposal, setCanGoToNextPendingProposal] = useState(false);
  const [pendingProposalSnapCount, setPendingProposalSnapCount] = useState(0);
  const [activePendingProposalSnap, setActivePendingProposalSnap] = useState(0);

  useEffect(() => {
    if (!pendingProposalCarouselApi || !shouldUsePendingProposalCarousel) {
      setCanGoToPreviousPendingProposal(false);
      setCanGoToNextPendingProposal(false);
      setPendingProposalSnapCount(0);
      setActivePendingProposalSnap(0);
      return undefined;
    }

    const syncPendingProposalCarouselState = () => {
      setCanGoToPreviousPendingProposal(pendingProposalCarouselApi.canScrollPrev());
      setCanGoToNextPendingProposal(pendingProposalCarouselApi.canScrollNext());
      setPendingProposalSnapCount(pendingProposalCarouselApi.scrollSnapList().length);
      setActivePendingProposalSnap(pendingProposalCarouselApi.selectedScrollSnap());
    };

    syncPendingProposalCarouselState();
    pendingProposalCarouselApi.on("select", syncPendingProposalCarouselState);
    pendingProposalCarouselApi.on("reInit", syncPendingProposalCarouselState);

    return () => {
      pendingProposalCarouselApi.off("select", syncPendingProposalCarouselState);
      pendingProposalCarouselApi.off("reInit", syncPendingProposalCarouselState);
    };
  }, [pendingProposalCarouselApi, shouldUsePendingProposalCarousel]);

  return (
    <section className={cn("w-full min-w-0", className)}>
      <div className="mb-4 flex items-center justify-between gap-4 sm:mb-5">
        <div className="min-w-0">
          <h2 className="text-[1.75rem] font-semibold tracking-[-0.02em] text-white">
            Pending Proposals
          </h2>
        </div>

        {shouldUsePendingProposalCarousel ? (
          <FreelancerProjectCarouselControls
            onPrevious={() => pendingProposalCarouselApi?.scrollPrev()}
            onNext={() => pendingProposalCarouselApi?.scrollNext()}
            canGoPrevious={canGoToPreviousPendingProposal}
            canGoNext={canGoToNextPendingProposal}
            previousLabel="Show previous pending proposal"
            nextLabel="Show next pending proposal"
          />
        ) : null}
      </div>

      {pendingProposalRows.length === 0 ? (
        <FreelancerDashboardPanel className="overflow-hidden bg-card">
          <div className="flex min-h-[240px] flex-col items-center justify-center px-5 py-10 text-center sm:min-h-[320px] sm:px-6 sm:py-12">
            <div className="flex size-14 items-center justify-center rounded-full bg-white/[0.06] text-muted-foreground sm:size-16">
              <ClipboardList className="size-6 sm:size-7" />
            </div>
            <p className="mt-6 text-base font-medium text-white">No pending proposals</p>
            <p className="mt-2 max-w-[320px] text-sm text-muted-foreground">
              New proposal requests from clients will appear here.
            </p>
            <button
              type="button"
              onClick={onOpenAll}
              className="mt-6 inline-flex min-w-[200px] items-center justify-center rounded-full bg-[#ffc107] px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#ffd54f] sm:min-w-0"
            >
              View Proposals
            </button>
          </div>
        </FreelancerDashboardPanel>
      ) : shouldUsePendingProposalCarousel ? (
        <div className="w-full min-w-0">
          <Carousel
            setApi={setPendingProposalCarouselApi}
            opts={{
              align: "start",
              containScroll: "trimSnaps",
              slidesToScroll: 1,
              duration: 34,
            }}
            className="w-full"
          >
            <CarouselContent className="ml-0 items-start gap-5 [backface-visibility:hidden] [will-change:transform] sm:gap-6 xl:gap-7">
              {pendingProposalRows.map((item) => (
                <CarouselItem key={item.id} className="basis-full pl-[2px] pr-[2px] pt-1">
                  <FreelancerPendingProposalCard item={item} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          <FreelancerCarouselDots
            count={pendingProposalSnapCount}
            activeIndex={activePendingProposalSnap}
            onSelect={(index) => pendingProposalCarouselApi?.scrollTo(index)}
            ariaLabel="Pending proposals carousel pagination"
            getDotLabel={(index) => `Go to pending proposal ${index + 1}`}
          />
        </div>
      ) : isMobile ? (
        <FreelancerPendingProposalCard item={pendingProposalRows[0]} />
      ) : (
        <FreelancerPendingProposalListPanel pendingProposalRows={pendingProposalRows} />
      )}
    </section>
  );
};

const FreelancerProjectRedirectCard = ({ item, className }) => {
  const isProposalPipelineCard = item.id === "proposal-pipeline";

  return (
    <div
      className={cn(
        "flex min-h-[320px] flex-col justify-between overflow-hidden rounded-[28px] border border-white/[0.06] bg-card p-4 sm:p-5 xl:p-6",
        className,
      )}
    >
      <div className="flex flex-1 flex-col items-center text-center">
        <h3 className="text-[clamp(1.5rem,5vw,2.15rem)] font-semibold tracking-[-0.04em] text-white">
          {item.title}
        </h3>

        <div className="flex w-full flex-1 items-center justify-center">
          <button
            type="button"
            aria-label={item.title}
            onClick={item.onClick}
            className="inline-flex h-[104px] w-[104px] items-center justify-center rounded-[14px] border border-primary/30 bg-primary/20 text-primary transition-colors hover:bg-primary/28"
          >
            <item.Icon className="size-10" strokeWidth={2} />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={item.onClick}
        className="inline-flex h-[58px] w-full shrink-0 items-center justify-center rounded-[14px] bg-[#f5cd05] px-6 text-[1.02rem] font-bold uppercase tracking-[0.04em] text-black transition-colors hover:bg-[#ffdd4f]"
      >
        {String(item.actionLabel || "Action").toUpperCase()}
      </button>
    </div>
  );
};

export const DashboardContent = ({ _roleOverride, children }) => {
  const isMobile = useIsMobile();
  const [sessionUser, setSessionUser] = useState(null);
  const { authFetch, user } = useAuth();
  const [metrics, setMetrics] = useState(INITIAL_FREELANCER_DASHBOARD_METRICS);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [upcomingMeeting, setUpcomingMeeting] = useState(null);
  const [showSuspensionAlert, setShowSuspensionAlert] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [showPendingPaymentsStat, setShowPendingPaymentsStat] = useState(false);
  const [pendingProposalActionId, setPendingProposalActionId] = useState(null);
  const [projectCarouselApi, setProjectCarouselApi] = useState(null);
  const [canGoToPreviousProjects, setCanGoToPreviousProjects] = useState(false);
  const [canGoToNextProjects, setCanGoToNextProjects] = useState(false);
  const [projectCarouselSnapCount, setProjectCarouselSnapCount] = useState(0);
  const [activeProjectSnap, setActiveProjectSnap] = useState(0);
  const [mobileProjectCardHeight, setMobileProjectCardHeight] = useState(0);
  const [runningProjectsFilter, setRunningProjectsFilter] = useState("all");
  const [runningProjectsCarouselApi, setRunningProjectsCarouselApi] = useState(null);
  const [canGoToPreviousRunningProjects, setCanGoToPreviousRunningProjects] = useState(false);
  const [canGoToNextRunningProjects, setCanGoToNextRunningProjects] = useState(false);
  const [runningProjectsCarouselSnapCount, setRunningProjectsCarouselSnapCount] = useState(0);
  const [activeRunningProjectsSnap, setActiveRunningProjectsSnap] = useState(0);
  const [selectedRunningProjectId, setSelectedRunningProjectId] = useState(null);
  const projectCardRefs = useRef({});
  const [profileCompletion, setProfileCompletion] = useState({
    percent: 0,
    message: "Loading profile completion...",
    completedSections: 0,
    partialSections: 0,
    totalSections: 0,
    missingDetails: [],
    isLoading: true,
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();

  const handleNotificationClick = useCallback((notification) => {
    markAsRead(notification.id);
    navigate(resolveFreelancerNotificationDestination(notification));
  }, [markAsRead, navigate]);

  const effectiveUser = user ?? sessionUser;
  const primaryRole = String(effectiveUser?.role || "").toUpperCase();
  const additionalRoles = Array.isArray(effectiveUser?.roles)
    ? effectiveUser.roles.map((role) => String(role).toUpperCase())
    : [];
  const normalizeBoolean = (value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      return normalized === "true" || normalized === "1";
    }
    return false;
  };
  const isFreelancerUser =
    primaryRole === "FREELANCER" || additionalRoles.includes("FREELANCER");
  const isOnboardingComplete = normalizeBoolean(
    effectiveUser?.onboardingComplete
  );
  const forcedRole = String(_roleOverride || "").toUpperCase();
  const isFreelancerRoute = location.pathname.startsWith("/freelancer");
  const showOnboardingAlert =
    forcedRole !== "CLIENT" &&
    isFreelancerRoute &&
    !isOnboardingComplete;
  const profileCompletionPercent = Math.max(
    0,
    Math.min(100, Number(profileCompletion.percent) || 0)
  );
  const showProfileCompletionSkeleton = metricsLoading || profileCompletion.isLoading;
  const shouldShowProfileCompletionPanel =
    showProfileCompletionSkeleton || profileCompletionPercent < 100;
  const profileCompletionComplete = profileCompletionPercent >= 90;
  const activeWorkspaceKey = useMemo(() => {
    if (location.pathname.startsWith("/freelancer/proposals")) return "proposals";
    if (location.pathname.startsWith("/freelancer/project")) return "projects";
    if (location.pathname.startsWith("/freelancer/messages")) return "messages";
    if (location.pathname.startsWith("/freelancer/payments")) return "payments";
    if (location.pathname.startsWith("/freelancer/profile")) return "profile";
    return "dashboard";
  }, [location.pathname]);
  const headerProfile = useMemo(() => {
    const displayName =
      effectiveUser?.fullName ||
      effectiveUser?.name ||
      effectiveUser?.email ||
      "Freelancer";

    return {
      name: displayName,
      avatar: effectiveUser?.avatar || "",
      initial: String(displayName).charAt(0).toUpperCase(),
      available: effectiveUser?.available,
      openToWork:
        typeof effectiveUser?.freelancerProfile?.openToWork === "boolean"
          ? effectiveUser.freelancerProfile.openToWork
          : typeof effectiveUser?.openToWork === "boolean"
            ? effectiveUser.openToWork
            : typeof effectiveUser?.available === "boolean"
              ? effectiveUser.available
              : undefined,
      isVerified: Boolean(
        effectiveUser?.freelancerProfile?.isVerified ?? effectiveUser?.isVerified
      ),
    };
  }, [
    effectiveUser?.avatar,
    effectiveUser?.available,
    effectiveUser?.email,
    effectiveUser?.fullName,
    effectiveUser?.freelancerProfile?.isVerified,
    effectiveUser?.freelancerProfile?.openToWork,
    effectiveUser?.isVerified,
    effectiveUser?.name,
    effectiveUser?.openToWork,
  ]);
  const handleWorkspaceNav = useCallback(
    (key) => {
      if (key === "dashboard") {
        navigate("/freelancer");
        return;
      }
      if (key === "proposals") {
        navigate("/freelancer/proposals");
        return;
      }
      if (key === "projects") {
        navigate("/freelancer/project");
        return;
      }
      if (key === "messages") {
        navigate("/freelancer/messages");
        return;
      }
      if (key === "payments") {
        navigate("/freelancer/payments");
        return;
      }
      if (key === "profile") {
        navigate("/freelancer/profile");
      }
    },
    [navigate],
  );

  useEffect(() => {
    const session = getSession();
    setSessionUser(session?.user ?? null);

    if (session?.user?.status === "SUSPENDED") {
      setShowSuspensionAlert(true);
    }
  }, []);

  useEffect(() => {
    if (!isFreelancerUser) return;

    if (consumeFreelancerWelcomePending()) {
      setShowWelcomeDialog(true);
    }
  }, [isFreelancerUser]);

  useEffect(() => {
    const loadMetrics = async () => {
      if (!authFetch) return;
      try {
        const response = await authFetch("/proposals?as=freelancer");
        const payload = await response.json().catch(() => null);
        const list = Array.isArray(payload?.data) ? payload.data : [];
        setMetrics(summarizeFreelancerDashboardMetrics(list));
      } catch (error) {
        console.error("Failed to load freelancer metrics", error);
      } finally {
        setMetricsLoading(false);
      }
    };

    const loadAppointments = async () => {
      if (!authFetch) return;
      try {
        const today = new Date().toISOString().split("T")[0];
        // Fetch APPROVED appointments from today onwards
        const res = await authFetch(
          `/appointments?status=APPROVED&startDate=${today}`
        );
        const data = await res.json();

        if (data?.data && Array.isArray(data.data)) {
          // Find the first future meeting
          const now = new Date();
          const future = data.data
            .map((a) => ({
              ...a,
              dateObj: new Date(
                `${a.date.split("T")[0]}T${a.startHour
                  .toString()
                  .padStart(2, "0")}:00:00`
              ),
            }))
            .filter((a) => a.dateObj > now)
            .sort((a, b) => a.dateObj - b.dateObj);

          if (future.length > 0) {
            setUpcomingMeeting(future[0]);
          } else {
            setUpcomingMeeting(null);
          }
        }
      } catch (err) {
        console.error("Failed to load appointments:", err);
      }
    };

    const loadProfileCompletion = async () => {
      if (!authFetch || !isFreelancerUser) {
        setProfileCompletion((previous) => ({
          ...previous,
          isLoading: false,
        }));
        return;
      }

      try {
        const response = await authFetch(`/profile?_t=${Date.now()}`, {
          suppressToast: true,
        });
        if (!response.ok) {
          throw new Error("Failed to fetch freelancer profile.");
        }
        const payload = await response.json().catch(() => null);
        const completion = buildFreelancerProfileCompletion(payload?.data || {});
        setProfileCompletion({
          ...completion,
          isLoading: false,
        });
      } catch (error) {
        console.error("Failed to load freelancer profile completion", error);
        setProfileCompletion((previous) => ({
          ...previous,
          isLoading: false,
        }));
      }
    };

    loadMetrics();
    loadAppointments();
    loadProfileCompletion();
  }, [authFetch, isFreelancerUser]);

  const activityItems = useMemo(() => {
    const items = [];
    const pushItem = (item) => {
      if (!item || items.some((entry) => entry.id === item.id)) return;
      items.push(item);
    };

    notifications.slice(0, 5).forEach((notification, index) => {
      const type = String(notification?.type || "").toLowerCase();
      const proposalStatus = String(notification?.data?.status || "").toUpperCase();
      const projectTitle =
        notification?.data?.projectTitle ||
        notification?.data?.title ||
        notification?.title ||
        "Catalance";

      let item = null;

      if (type === "proposal") {
        const accepted = proposalStatus === "ACCEPTED";
        item = {
          id: notification?.id || `activity-proposal-${index}`,
          title: accepted
            ? "Your proposal has been accepted."
            : notification?.title || "There is a proposal update.",
          subtitle: accepted
            ? `${projectTitle} is ready for delivery and client collaboration.`
            : notification?.message || `${projectTitle} has a new proposal status update.`,
          timeLabel: formatDashboardActivityTime(notification?.createdAt),
          icon: accepted ? Sparkles : Gavel,
          tone: accepted ? "emerald" : "amber",
          badge: accepted ? "Accepted" : "Proposal",
          isUnread: true,
          onClick: () => handleNotificationClick(notification),
        };
      } else if (type === "chat") {
        item = {
          id: notification?.id || `activity-chat-${index}`,
          title: notification?.title || "You received a new message.",
          subtitle:
            notification?.message ||
            "Open Messages to continue the conversation with your client.",
          timeLabel: formatDashboardActivityTime(notification?.createdAt),
          icon: MessageSquare,
          tone: "blue",
          badge: "Message",
          isUnread: true,
          onClick: () => handleNotificationClick(notification),
        };
      } else if (type === "meeting_scheduled") {
        item = {
          id: notification?.id || `activity-meeting-${index}`,
          title: notification?.title || "A new meeting has been scheduled.",
          subtitle:
            notification?.message ||
            "Check the meeting details and join on time from your project workspace.",
          timeLabel: formatDashboardActivityTime(notification?.createdAt),
          icon: Video,
          tone: "violet",
          badge: "Meeting",
          isUnread: true,
          onClick: () => handleNotificationClick(notification),
        };
      } else if (type === "task_verified") {
        item = {
          id: notification?.id || `activity-task-verified-${index}`,
          title: notification?.title || "Your submitted work has been verified.",
          subtitle:
            notification?.message ||
            "A client or manager approved your latest task submission.",
          timeLabel: formatDashboardActivityTime(notification?.createdAt),
          icon: TrendingUp,
          tone: "emerald",
          badge: "Verified",
          isUnread: true,
          onClick: () => handleNotificationClick(notification),
        };
      } else if (type === "task_completed") {
        item = {
          id: notification?.id || `activity-task-complete-${index}`,
          title: notification?.title || "A project milestone has been completed.",
          subtitle:
            notification?.message ||
            "Review the latest progress update in your active project workspace.",
          timeLabel: formatDashboardActivityTime(notification?.createdAt),
          icon: Sparkles,
          tone: "emerald",
          badge: "Milestone",
          isUnread: true,
          onClick: () => handleNotificationClick(notification),
        };
      } else if (type === "task_unverified") {
        item = {
          id: notification?.id || `activity-task-revision-${index}`,
          title: notification?.title || "A submitted task needs updates.",
          subtitle:
            notification?.message ||
            "Open the project and review the requested revision notes.",
          timeLabel: formatDashboardActivityTime(notification?.createdAt),
          icon: Clock,
          tone: "rose",
          badge: "Revision",
          isUnread: true,
          onClick: () => handleNotificationClick(notification),
        };
      }

      if (!item && (notification?.title || notification?.message)) {
        item = {
          id: notification?.id || `activity-general-${index}`,
          title: notification?.title || "New activity on Catalance.",
          subtitle: notification?.message || "Open your dashboard to review the update.",
          timeLabel: formatDashboardActivityTime(notification?.createdAt),
          icon: Sparkles,
          tone: "slate",
          badge: "Update",
          isUnread: true,
          onClick: () => handleNotificationClick(notification),
        };
      }

      pushItem(item);
    });

    if (items.length < 4 && metrics.acceptedProposals.length > 0) {
      const acceptedProposal = metrics.acceptedProposals[0];
      pushItem({
        id: `activity-project-started-${acceptedProposal.id}`,
        title: "Your project has started.",
        subtitle: `${
          acceptedProposal.project?.title || "Your accepted project"
        } is now active and ready for execution.`,
        timeLabel: formatDashboardActivityTime(
          acceptedProposal.project?.updatedAt ||
            acceptedProposal.updatedAt ||
            acceptedProposal.createdAt
        ),
        icon: Sparkles,
        tone: "emerald",
        badge: "Active Project",
        isUnread: false,
        onClick: () =>
          navigate(`/freelancer/project/${acceptedProposal.project?.id}`),
      });
    }

    if (items.length < 4 && metrics.pendingProposals.length > 0) {
      const pendingProposal = metrics.pendingProposals[0];
      pushItem({
        id: `activity-pending-proposal-${pendingProposal.id}`,
        title: "Your proposal is awaiting client response.",
        subtitle: `${
          pendingProposal.project?.title || "A recent proposal"
        } is still pending review.`,
        timeLabel: formatDashboardActivityTime(
          pendingProposal.updatedAt || pendingProposal.createdAt
        ),
        icon: Gavel,
        tone: "amber",
        badge: "Pending",
        isUnread: false,
        onClick: () => navigate("/freelancer/proposals"),
      });
    }

    if (items.length < 4 && upcomingMeeting) {
      pushItem({
        id: `activity-upcoming-meeting-${upcomingMeeting.id || upcomingMeeting.date}`,
        title: "You have an upcoming meeting.",
        subtitle: `${upcomingMeeting.title || "Client meeting"} starts at ${
          upcomingMeeting.startHour
        }:00.`,
        timeLabel: formatDashboardActivityTime(upcomingMeeting.date),
        icon: Video,
        tone: "violet",
        badge: "Upcoming",
        isUnread: false,
        onClick: () =>
          window.open(
            upcomingMeeting.meetingLink || "https://meet.google.com/",
            "_blank"
          ),
      });
    }

    if (!items.length) {
      pushItem({
        id: "activity-empty",
        title: "You're all caught up.",
        subtitle:
          "Proposal decisions, project starts, milestones, and meetings will appear here.",
        timeLabel: "Now",
        icon: Sparkles,
        tone: "slate",
        badge: "Activity",
        isUnread: false,
        onClick: () => navigate("/freelancer/proposals"),
      });
    }

    return items.slice(0, 4);
  }, [
    handleNotificationClick,
    metrics.acceptedProposals,
    metrics.pendingProposals,
    navigate,
    notifications,
    upcomingMeeting,
  ]);

  const [dashboardClock, setDashboardClock] = useState(() => new Date());

  useEffect(() => {
    const syncDashboardClock = () => {
      const next = new Date();

      setDashboardClock((current) => {
        if (
          current.getFullYear() === next.getFullYear() &&
          current.getMonth() === next.getMonth() &&
          current.getDate() === next.getDate() &&
          current.getHours() === next.getHours() &&
          current.getMinutes() === next.getMinutes()
        ) {
          return current;
        }

        return next;
      });
    };

    syncDashboardClock();
    const intervalId = window.setInterval(syncDashboardClock, 60 * 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const greeting = useMemo(() => {
    const hour = dashboardClock.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  }, [dashboardClock]);

  const firstName = useMemo(() => {
    const rawName = String(headerProfile?.name || "Freelancer").trim();
    if (!rawName) return "Freelancer";
    return rawName.split(/\s+/)[0] || "Freelancer";
  }, [headerProfile?.name]);
  const dashboardDateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      }).format(dashboardClock),
    [dashboardClock],
  );
  const handleAcceptPendingProposal = useCallback(
    async (proposal) => {
      const proposalId = String(proposal?.id || "").trim();
      if (!proposalId) {
        toast.error("Proposal id is missing.");
        return;
      }

      setPendingProposalActionId(proposalId);

      try {
        const response = await authFetch(`/proposals/${proposalId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "ACCEPTED" }),
        });

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => null);
          throw new Error(errorPayload?.message || `Status update failed (${response.status})`);
        }

        setMetrics((previous) => {
          const normalizedAcceptedProposal = {
            ...proposal,
            status: "ACCEPTED",
          };
          const pendingProposals = previous.pendingProposals.filter(
            (item) => String(item?.id || "") !== proposalId,
          );
          const acceptedByProject = new Map();

          [...previous.acceptedProposals, normalizedAcceptedProposal].forEach((item) => {
            const key = resolveProjectFingerprint(item);
            if (key && !acceptedByProject.has(key)) {
              acceptedByProject.set(key, item);
            }
          });

          const acceptedProposals = Array.from(acceptedByProject.values());
          let activeProjects = 0;
          let completedProjects = 0;
          let totalReceived = 0;
          let totalPending = 0;

          acceptedProposals.forEach((item) => {
            const proposalAmount = Number(item?.amount) || 0;
            const isCompleted = isProposalCompletedForDashboard(item);

            if (isCompleted) {
              completedProjects += 1;
              totalReceived += proposalAmount;
              return;
            }

            activeProjects += 1;
            totalPending += proposalAmount;
          });

          const receivedEarnings = Math.round(totalReceived * 0.7);
          const pendingEarnings = Math.round(totalPending * 0.7);

          return {
            ...previous,
            activeProjects,
            completedProjects,
            proposalsReceived: pendingProposals.length,
            acceptedProposals,
            pendingProposals,
            earnings: receivedEarnings + pendingEarnings,
            receivedEarnings,
            pendingEarnings,
          };
        });

        toast.success("Proposal accepted");
      } catch (error) {
        console.error("Pending proposal accept error:", error);
        toast.error(error?.message || "Could not accept proposal");
      } finally {
        setPendingProposalActionId(null);
      }
    },
    [authFetch],
  );
  const pendingProposalRows = useMemo(
    () =>
      metrics.pendingProposals.slice(0, 4).map((proposal, index) => {
        const serviceType = resolveFreelancerProjectServiceType(proposal?.project || {}, proposal);
        const title =
          proposal?.project?.businessName ||
          proposal?.project?.companyName ||
          proposal?.project?.title ||
          "Untitled proposal";
        const requestTime = formatDashboardActivityTime(proposal?.updatedAt || proposal?.createdAt);

        return {
          id: proposal?.id || `pending-proposal-${index}`,
          title: toDisplayTitleCase(title),
          updatedAt: requestTime,
          budget: formatFreelancerDashboardCurrency(toFreelancerShareAmount(proposal?.amount)),
          service: serviceType ? toDisplayTitleCase(serviceType) : "General Service",
          projectId: proposal?.project?.id,
          onView: () => {
            const query = proposal?.project?.id
              ? `?projectId=${encodeURIComponent(proposal.project.id)}`
              : "";
            navigate(`/freelancer/proposals${query}`);
          },
          onAccept: () => handleAcceptPendingProposal(proposal),
          isAccepting: pendingProposalActionId === String(proposal?.id || ""),
        };
      }),
    [handleAcceptPendingProposal, metrics.pendingProposals, navigate, pendingProposalActionId]
  );

  const recentChatUpdates = useMemo(
    () =>
      notifications
        .filter((item) => String(item?.type || "").toLowerCase() === "chat")
        .slice(0, 3),
    [notifications]
  );

  const resolveProjectProgress = useCallback((proposal, index = 0) => {
    const project = proposal?.project || {};
    if (isProjectAwaitingKickoff(project)) {
      return 0;
    }

    const explicitProgress = Number(proposal?.project?.progress);
    if (Number.isFinite(explicitProgress)) {
      return Math.max(0, Math.min(100, Math.round(explicitProgress)));
    }

    const proposalAmount = Number(proposal?.amount) || 0;
    const projectSpent = Number(proposal?.project?.spent);
    if (proposalAmount > 0 && Number.isFinite(projectSpent)) {
      return Math.max(12, Math.min(100, Math.round((projectSpent / proposalAmount) * 100)));
    }

    const normalizedStatus = String(project?.status || "").trim().toUpperCase();
    if (normalizedStatus === "IN_PROGRESS") return 35;
    if (normalizedStatus === "OPEN") return 10;
    return 0;
  }, []);

  const runningProjectCards = useMemo(
    () =>
      metrics.acceptedProposals
        .filter((proposal) => !isProposalCompletedForDashboard(proposal))
        .map((proposal, index) => {
        const project = proposal?.project || {};
        const projectId = project?.id;
        const progress = resolveProjectProgress(proposal, index);
        const businessName = resolveFreelancerProjectBusinessName(project, proposal);
        const serviceType = resolveFreelancerProjectServiceType(project, proposal);
        const ownerName =
          project?.owner?.fullName ||
          project?.owner?.name ||
          "Client";
        
        // Build full phase structure with steps using the same logic as client dashboard
        const basePhases = buildProjectPhases(project);
        const sop = getSopFromTitle(
          project?.sourceTitle || project?.templateTitle || project?.serviceType || project?.title,
        );
        const phaseSteps = buildProjectPhaseSteps(project);
        const requiredPhaseCount = Math.max(
          4,
          Number(project?.phaseCount) || 0,
          Array.isArray(sop?.phases) ? sop.phases.length : 0,
          basePhases.length,
        );

        const phases = Array.from({ length: requiredPhaseCount }, (_, phaseIndex) => {
          if (phaseIndex < basePhases.length) {
            return basePhases[phaseIndex];
          }

          const sopPhase = Array.isArray(sop?.phases) ? sop.phases[phaseIndex] : null;
          const phaseLabel = String(sopPhase?.name || `Phase ${phaseIndex + 1}`)
            .replace(/\s*\(\s*Phase-\d+\s*\)/i, "")
            .trim();

          return {
            label: phaseLabel || `Phase ${phaseIndex + 1}`,
            value: 0,
            progress: 0,
            subLabel: phaseIndex === 0 ? "Current phase" : "Upcoming",
            steps: Array.isArray(phaseSteps[phaseIndex]) ? phaseSteps[phaseIndex] : [],
          };
        });

        const completedPhases = phases.filter(
          (phase, phaseIndex) =>
            isPhaseMarkedComplete(
              phase,
              phaseIndex === 0 ? "Current phase" : "Upcoming",
            ),
        ).length;
        const inferredPhaseIndex = resolvePhaseIndexFromProgress(progress, phases.length || 4);
        const currentPhaseIndex = Math.min(
          Math.max(completedPhases, inferredPhaseIndex),
          Math.max(0, phases.length - 1),
        );
        const currentPhase = phases[currentPhaseIndex] || {
          label: "Phase 1",
          subLabel: "Current phase",
          steps: [],
        };
        
        const deadline = project?.deadline
          ? new Date(project.deadline).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "No deadline";
        const projectDisplayTitle =
          (businessName ? toDisplayTitleCase(businessName) : "") ||
          project?.title ||
          serviceType ||
          "Untitled project";

        return {
          id: proposal?.id || projectId || `running-project-${index}`,
          sectionLabel: "ACTIVE PROJECT",
          statusMeta: {
            tone: "warning",
            label: "In Progress",
          },
          title: projectDisplayTitle,
          serviceType,
          freelancerName: ownerName,
          freelancerRole: "Client",
          freelancerInitial: String(ownerName).charAt(0).toUpperCase(),
          freelancerAvatar: project?.owner?.avatar || "",
          budgetLabel: formatFreelancerDashboardCurrency(toFreelancerShareAmount(proposal?.amount)),
          dateLabel: "Deadline",
          dateValue: deadline,
          phaseProgressValue: progress,
          currentPhase,
          currentPhaseCountLabel: phases.length
            ? `${completedPhases}/${phases.length} Done`
            : "No Phases",
          currentPhaseSteps: Array.isArray(currentPhase?.steps)
            ? currentPhase.steps.map((step, stepIndex, collection) => {
                const firstPendingIndex = collection.findIndex(
                  (entry) => String(entry?.state || "").toLowerCase() !== "complete",
                );

                return {
                  ...step,
                  state:
                    !Array.isArray(project?.phases) &&
                    !String(currentPhase?.subLabel || "").toLowerCase().includes("completed") &&
                    String(step?.state || "").toLowerCase() === "pending" &&
                    firstPendingIndex === stepIndex
                      ? "current"
                      : step.state,
                };
              })
            : [],
          actionType: "link",
          actionLabel: "View Details",
          actionHref: projectId
            ? `/freelancer/project/${projectId}`
            : "/freelancer/project?view=ongoing",
          actionTone: "amber",
        };
      }),
    [metrics.acceptedProposals, resolveProjectProgress]
  );
  const shouldUseProjectCarousel = true;
  const activeProjectCardClassName = "w-full md:min-h-[506px]";
  const activeProjectRedirectCardClassName = "w-full h-full md:min-h-[506px]";
  const freelancerProjectRedirectCards = useMemo(() => {
    return [
      {
        id: "proposal-pipeline",
        Icon: ClipboardList,
        eyebrow: "Proposal Pipeline",
        title: "Keep your pipeline moving",
        description:
          "Review pending opportunities, send your next pitch, and keep new work flowing in.",
        highlights: ["Review pending proposals", "Follow up on open leads", "Send your next proposal"],
        actionLabel: "Open Proposals",
        onClick: () => navigate("/freelancer/proposals"),
      },
      {
        id: "client-inbox",
        Icon: MessageSquare,
        eyebrow: "Client Inbox",
        title: "Stay close to your clients",
        description:
          "Reply faster, jump into conversations, and keep project decisions moving without delay.",
        highlights: ["Check unread messages", "Prep for meetings", "Keep delivery updates aligned"],
        actionLabel: "Open Messages",
        onClick: () => navigate("/freelancer/messages"),
      },
    ];
  }, [navigate]);

  useEffect(() => {
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
  }, [isMobile, shouldUseProjectCarousel, runningProjectCards.length]);

  useEffect(() => {
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

  const previewMessages = useMemo(
    () =>
      recentChatUpdates.slice(0, 2).map((message, index) => {
        const rawBody = String(message?.message || "").trim();
        const senderMatch = rawBody.match(/^([^:]+):\s*(.+)$/);
        const senderName =
          message?.data?.senderName ||
          message?.data?.clientName ||
          message?.data?.businessName ||
          senderMatch?.[1] ||
          (message?.title && message.title !== "New Message" ? message.title : "") ||
          "Client";
        const previewText =
          senderMatch?.[2] ||
          rawBody ||
          "Open Messages to continue the conversation with your client.";
        const projectLabel =
          message?.data?.projectTitle ||
          message?.data?.businessName ||
          message?.data?.title ||
          "";

        return {
          id: message?.id || message?.createdAt || `preview-message-${index}`,
          senderName,
          previewText,
          projectLabel,
          timeLabel: formatDashboardActivityTime(message?.createdAt),
          initial: String(senderName).charAt(0).toUpperCase(),
        };
      }),
    [recentChatUpdates]
  );

  const earningsProjectScopeId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const raw = params.get("projectId");
    const normalized = raw ? String(raw).trim() : "";
    return normalized ? normalized : null;
  }, [location.search]);

  const acceptedProposalsForEarningsScope = useMemo(() => {
    if (!earningsProjectScopeId) return metrics.acceptedProposals;
    return metrics.acceptedProposals.filter(
      (proposal) => String(proposal?.project?.id || "") === earningsProjectScopeId,
    );
  }, [earningsProjectScopeId, metrics.acceptedProposals]);

  const pendingProposalsForEarningsScope = useMemo(() => {
    if (!earningsProjectScopeId) return metrics.pendingProposals;
    return metrics.pendingProposals.filter(
      (proposal) => String(proposal?.project?.id || "") === earningsProjectScopeId,
    );
  }, [earningsProjectScopeId, metrics.pendingProposals]);

  const earningsScopeMetrics = useMemo(
    () =>
      summarizeFreelancerDashboardMetrics([
        ...acceptedProposalsForEarningsScope,
        ...pendingProposalsForEarningsScope,
      ]),
    [acceptedProposalsForEarningsScope, pendingProposalsForEarningsScope],
  );

  const paymentCollectionPercentScoped = useMemo(() => {
    const totalTracked =
      earningsScopeMetrics.receivedEarnings + earningsScopeMetrics.pendingEarnings;
    if (!totalTracked) return 0;
    return Math.round(
      (earningsScopeMetrics.receivedEarnings / totalTracked) * 100,
    );
  }, [earningsScopeMetrics.pendingEarnings, earningsScopeMetrics.receivedEarnings]);

  const paymentHealthLabelScoped = useMemo(() => {
    if (paymentCollectionPercentScoped >= 80) return "Strong payout momentum";
    if (paymentCollectionPercentScoped >= 50) return "Healthy payment mix";
    if (earningsScopeMetrics.pendingEarnings > 0)
      return "Pending earnings can still convert";
    return "Start one more project to grow earnings";
  }, [earningsScopeMetrics.pendingEarnings, paymentCollectionPercentScoped]);

  const paymentCollectionPercent = useMemo(() => {
    const totalTracked = metrics.receivedEarnings + metrics.pendingEarnings;
    if (!totalTracked) return 0;
    return Math.round((metrics.receivedEarnings / totalTracked) * 100);
  }, [metrics.pendingEarnings, metrics.receivedEarnings]);

  const averageProjectShare = useMemo(() => {
    if (!metrics.acceptedProposals.length) return 0;
    return Math.round((metrics.receivedEarnings + metrics.pendingEarnings) / metrics.acceptedProposals.length);
  }, [
    metrics.acceptedProposals.length,
    metrics.pendingEarnings,
    metrics.receivedEarnings,
  ]);

  const earningsTrendData = useMemo(() => {
    const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });
    const labels = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      return monthFormatter.format(date);
    });

    const source = metrics.acceptedProposals
      .slice(-6)
      .map((proposal) => Math.round((Number(proposal?.amount) || 0) * 0.7))
      .filter((value) => value > 0);
    const fallback = [12000, 16800, 14500, 18900, 15700, 21400];
    const values = source.length ? [...source] : fallback;

    while (values.length < 6) {
      values.unshift(values[0] || 0);
    }

    const series = values.slice(-6);
    const max = Math.max(...series, 1);

    return labels.map((label, index) => ({
      label,
      value: series[index],
      height: Math.max(18, Math.round((series[index] / max) * 100)),
      isCurrent: index === labels.length - 1,
    }));
  }, [metrics.acceptedProposals]);

  const earningsMomentumSummary = useMemo(() => {
    const series = earningsTrendData.map((item) => Number(item?.value) || 0);
    const current = series[series.length - 1] || 0;
    const previous = series[series.length - 2] || 0;

    if (current <= 0 && previous <= 0) {
      return {
        label: "Tracking this month",
        toneClassName: "text-[#ffc107]",
      };
    }

    if (previous <= 0) {
      return {
        label: "First payout this month",
        toneClassName: "text-[#ffc107]",
      };
    }

    const delta = ((current - previous) / previous) * 100;
    const roundedDelta = Math.abs(delta);
    const formattedDelta =
      roundedDelta >= 100
        ? roundedDelta.toFixed(0)
        : roundedDelta.toFixed(1).replace(/\.0$/, "");

    return {
      label: `${delta >= 0 ? "+" : "-"}${formattedDelta}% this month`,
      toneClassName: delta >= 0 ? "text-[#ffc107]" : "text-rose-300",
    };
  }, [earningsTrendData]);

  const pendingPayoutRows = useMemo(() => {
    return metrics.acceptedProposals
      .filter((proposal) => !isProposalCompletedForDashboard(proposal))
      .map((proposal, index) => {
        const project = proposal?.project || {};
        const projectId = String(project?.id || "").trim();
        const businessName = resolveFreelancerProjectBusinessName(project, proposal);
        const dueInstallment = project?.paymentPlan?.nextDueInstallment || null;
        const rawAmount = Number(dueInstallment?.amount) || Number(proposal?.amount) || 0;

        return {
          id: proposal?.id || project?.id || `pending-payout-${index}`,
          title:
            (businessName ? toDisplayTitleCase(businessName) : "") ||
            project?.title ||
            "Untitled project",
          clientLabel:
            project?.owner?.fullName ||
            project?.owner?.name ||
            project?.owner?.companyName ||
            "Client",
          amount: formatFreelancerDashboardCurrency(Math.round(rawAmount * 0.7)),
          statusLabel: dueInstallment?.sequence
            ? `Milestone ${dueInstallment.sequence}`
            : "Awaiting clearance",
          timeLabel: project?.deadline
            ? `Due ${new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
              }).format(new Date(project.deadline))}`
            : `Updated ${formatDashboardActivityTime(proposal?.updatedAt || proposal?.createdAt)}`,
          progress: resolveProjectProgress(proposal, index),
          projectId,
          proposalId: proposal?.id ? String(proposal.id) : "",
        };
      });
  }, [metrics.acceptedProposals, resolveProjectProgress]);

  const nextPayoutSummaryLabel = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const candidateDates = metrics.acceptedProposals
      .filter((proposal) => !isProposalCompletedForDashboard(proposal))
      .map((proposal) => {
        const project = proposal?.project || {};
        const nextInstallment =
          project?.paymentPlan?.nextDueInstallment || proposal?.paymentPlan?.nextDueInstallment || null;

        return (
          nextInstallment?.dueDate ||
          nextInstallment?.date ||
          project?.deadline ||
          null
        );
      })
      .map((value) => {
        const parsed = value ? new Date(value) : null;
        return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
      })
      .filter(Boolean)
      .sort((left, right) => left - right);

    const nextDate = candidateDates.find((date) => date >= today) || null;
    if (nextDate) {
      const diffDays = Math.max(
        0,
        Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
      );

      if (diffDays === 0) return "Next payout expected today";
      if (diffDays === 1) return "Next payout in 1 day";
      return `Next payout in ${diffDays} days`;
    }

    if (metrics.pendingEarnings > 0) {
      return "Pending payout is being tracked";
    }

    return "No pending payouts right now";
  }, [metrics.acceptedProposals, metrics.pendingEarnings]);

  const receivedPayoutRows = useMemo(() => {
    return metrics.acceptedProposals
      .filter((proposal) => isProposalCompletedForDashboard(proposal))
      .slice(0, 4)
      .map((proposal, index) => {
        const project = proposal?.project || {};
        const businessName = resolveFreelancerProjectBusinessName(project, proposal);
        const rawAmount = Number(proposal?.amount) || 0;

        return {
          id: proposal?.id || project?.id || `received-payout-${index}`,
          title:
            (businessName ? toDisplayTitleCase(businessName) : "") ||
            project?.title ||
            "Completed project",
          clientLabel:
            project?.owner?.fullName ||
            project?.owner?.name ||
            project?.owner?.companyName ||
            "Client",
          amount: formatFreelancerDashboardCurrency(Math.round(rawAmount * 0.7)),
          statusLabel: "Received",
          timeLabel: proposal?.updatedAt || proposal?.createdAt
            ? `Cleared ${formatDashboardActivityTime(proposal?.updatedAt || proposal?.createdAt)}`
            : "Payout completed",
        };
      });
  }, [metrics.acceptedProposals]);

  const paymentHealthLabel = useMemo(() => {
    if (paymentCollectionPercent >= 80) return "Strong payout momentum";
    if (paymentCollectionPercent >= 50) return "Healthy payment mix";
    if (metrics.pendingEarnings > 0) return "Pending earnings can still convert";
    return "Start one more project to grow earnings";
  }, [metrics.pendingEarnings, paymentCollectionPercent]);

  const paymentActionItems = useMemo(() => {
    return [
      `${pendingPayoutRows.length} active payout ${pendingPayoutRows.length === 1 ? "source" : "sources"}`,
      `${receivedPayoutRows.length} cleared payment ${receivedPayoutRows.length === 1 ? "entry" : "entries"}`,
      `${paymentCollectionPercent}% of tracked earnings already received`,
    ];
  }, [paymentCollectionPercent, pendingPayoutRows.length, receivedPayoutRows.length]);

  const runningProjectsRows = useMemo(() => pendingPayoutRows, [pendingPayoutRows]);

  const runningProjectFilterOptions = useMemo(
    () => {
      const baseOptions = [
        {
          value: "all",
          label: "All projects",
          count: pendingPayoutRows.length,
          kind: "preset",
        },
      ];

      const projectOptions = runningProjectsRows.map((item) => ({
        value: `project:${String(item?.id || "")}`,
        label: item?.title || "Untitled project",
        count: 1,
        kind: "project",
      }));

      return [...baseOptions, ...projectOptions];
    },
    [pendingPayoutRows.length, runningProjectsRows],
  );

  const visibleRunningProjects = useMemo(() => {
    if (runningProjectsFilter.startsWith("project:")) {
      const selectedProjectId = runningProjectsFilter.replace("project:", "");
      return runningProjectsRows.filter(
        (item) => String(item?.id || "") === String(selectedProjectId || ""),
      );
    }

    return runningProjectsRows;
  }, [runningProjectsFilter, runningProjectsRows]);

  useEffect(() => {
    if (!visibleRunningProjects.length) {
      setSelectedRunningProjectId(null);
      return;
    }

    const hasSelectedVisible = visibleRunningProjects.some(
      (item) => String(item?.id || "") === String(selectedRunningProjectId || ""),
    );

    if (!hasSelectedVisible) {
      setSelectedRunningProjectId(String(visibleRunningProjects[0].id));
    }
  }, [selectedRunningProjectId, visibleRunningProjects]);

  const activeProposalForSchedule = useMemo(
    () => {
      const activeProposals = metrics.acceptedProposals.filter(
        (proposal) => !isProposalCompletedForDashboard(proposal),
      );

      if (!activeProposals.length) return null;

      if (selectedRunningProjectId) {
        const matched = activeProposals.find((proposal) => {
          const proposalId = String(proposal?.id || "").trim();
          const projectId = String(proposal?.project?.id || "").trim();
          return proposalId === String(selectedRunningProjectId) || projectId === String(selectedRunningProjectId);
        });
        if (matched) return matched;
      }

      return activeProposals[0] || null;
    },
    [metrics.acceptedProposals, selectedRunningProjectId],
  );

  const schedulePhases = useMemo(() => {
    const phases = activeProposalForSchedule
      ? buildProjectPhases(activeProposalForSchedule?.project || {})
      : [];

    const normalized = phases.slice(0, 4).map((phase, index) => {
      const steps = Array.isArray(phase?.steps) ? phase.steps : [];
      const completedSteps = steps.filter(
        (step) => String(step?.state || "").toLowerCase() === "complete",
      ).length;
      const stepProgress = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;

      const explicitProgress = Number(phase?.progress ?? phase?.value ?? 0);
      const resolvedProgress = Number.isFinite(explicitProgress) && explicitProgress > 0
        ? clampProgress(explicitProgress)
        : clampProgress(stepProgress);

      return {
        label: phase?.label || `Phase ${index + 1}`,
        summary: phase?.subLabel || "Pending",
        progress: resolvedProgress,
        isComplete:
          isPhaseMarkedComplete(phase, index === 0 ? "Current phase" : "Upcoming") ||
          resolvedProgress >= 100,
      };
    });

    while (normalized.length < 4) {
      const nextIndex = normalized.length;
      normalized.push({
        label: `Phase ${nextIndex + 1}`,
        summary: "Upcoming",
        progress: 0,
        isComplete: false,
      });
    }

    return normalized;
  }, [activeProposalForSchedule]);

  const completedSchedulePhaseCount = useMemo(
    () => schedulePhases.filter((phase) => phase.isComplete).length,
    [schedulePhases],
  );

  const currentSchedulePhase = useMemo(
    () => schedulePhases.find((phase) => !phase.isComplete) || schedulePhases[schedulePhases.length - 1] || null,
    [schedulePhases],
  );

  const pendingSchedulePhase = useMemo(
    () =>
      schedulePhases.find(
        (phase) =>
          !phase.isComplete &&
          String(phase?.label || "") !== String(currentSchedulePhase?.label || ""),
      ) || null,
    [currentSchedulePhase, schedulePhases],
  );

  const scheduledSchedulePhase = useMemo(
    () => schedulePhases[schedulePhases.length - 1] || null,
    [schedulePhases],
  );

  const scheduleTimelineShares = useMemo(() => phaseTimelineShares.slice(0, 4), []);

  const scheduleTimelineStarts = useMemo(() => {
    let cursor = 0;
    return scheduleTimelineShares.map((share) => {
      const start = cursor;
      cursor += share;
      return start;
    });
  }, [scheduleTimelineShares]);

  const activeScheduleProgressPct = useMemo(() => {
    if (!activeProposalForSchedule) return 0;

    const payoutHeuristic = clampProgress(resolveProjectProgress(activeProposalForSchedule, 0));

    const phaseWeightedProgress = schedulePhases.reduce(
      (acc, phase, index) => {
        if (acc.locked) {
          return acc;
        }

        const share = scheduleTimelineShares[index] ?? 0;
        if (phase?.isComplete) {
          return {
            value: acc.value + share,
            locked: false,
          };
        }

        return {
          value: acc.value + share * (clampProgress(phase?.progress ?? 0) / 100),
          locked: true,
        };
      },
      { value: 0, locked: false },
    ).value;

    return clampProgress(Math.max(payoutHeuristic, phaseWeightedProgress));
  }, [activeProposalForSchedule, resolveProjectProgress, schedulePhases, scheduleTimelineShares]);

  const activeScheduleDaysToDeadline = useMemo(() => {
    const deadlineRaw = activeProposalForSchedule?.project?.deadline;
    if (!deadlineRaw) return null;

    const deadline = new Date(deadlineRaw);
    if (Number.isNaN(deadline.getTime())) return null;

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);

    return Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }, [activeProposalForSchedule]);

  const activeScheduleDueInDays = useMemo(() => {
    if (!Number.isFinite(activeScheduleDaysToDeadline)) return null;
    return Math.max(0, activeScheduleDaysToDeadline);
  }, [activeScheduleDaysToDeadline]);

  const activeScheduleProjectTitle = useMemo(() => {
    const project = activeProposalForSchedule?.project || {};
    const businessName = resolveFreelancerProjectBusinessName(project, activeProposalForSchedule);
    const fallbackTitle = project?.title || activeProposalForSchedule?.projectTitle || "Active payouts";
    return (businessName ? toDisplayTitleCase(businessName) : "") || fallbackTitle;
  }, [activeProposalForSchedule]);

  const projectScheduleDeadlineDate = useMemo(
    () => normalizeScheduleDate(activeProposalForSchedule?.project?.deadline),
    [activeProposalForSchedule],
  );

  const projectScheduleDurationSeedDays = useMemo(() => {
    const project = activeProposalForSchedule?.project || {};
    const timelineText = getFirstNonEmptyText(
      project?.timeline,
      project?.duration,
      project?.launchTimeline,
      activeProposalForSchedule?.timeline,
      activeProposalForSchedule?.duration,
    ).toLowerCase();

    const match = timelineText.match(/(\d+)\s*(day|days|week|weeks|month|months)/i);
    if (!match) return null;

    const value = Number(match[1]);
    const unit = String(match[2] || "");
    if (!Number.isFinite(value) || value <= 0) {
      return null;
    }

    if (unit.startsWith("day")) return value;
    if (unit.startsWith("week")) return value * 7;
    if (unit.startsWith("month")) return value * 30;
    return null;
  }, [activeProposalForSchedule]);

  const projectScheduleStartDate = useMemo(() => {
    const proposal = activeProposalForSchedule || {};
    const project = activeProposalForSchedule?.project || {};
    const explicitStartDate = [
      project?.startDate,
      project?.startAt,
      project?.startsAt,
      project?.startedAt,
      project?.kickoffDate,
      project?.kickoffAt,
      project?.timelineStart,
      proposal?.startDate,
      proposal?.acceptedAt,
      proposal?.acceptedOn,
    ]
      .map(normalizeScheduleDate)
      .find(Boolean);

    if (explicitStartDate) {
      return explicitStartDate;
    }

    if (projectScheduleDeadlineDate && projectScheduleDurationSeedDays) {
      return addScheduleDays(projectScheduleDeadlineDate, -(projectScheduleDurationSeedDays - 1));
    }

    const fallbackStartDate = [
      project?.createdAt,
      project?.updatedAt,
      proposal?.createdAt,
      proposal?.updatedAt,
    ]
      .map(normalizeScheduleDate)
      .find(Boolean);

    return fallbackStartDate || normalizeScheduleDate(dashboardClock) || normalizeScheduleDate(new Date());
  }, [
    activeProposalForSchedule,
    dashboardClock,
    projectScheduleDeadlineDate,
    projectScheduleDurationSeedDays,
  ]);

  const projectScheduleDurationDays = useMemo(() => {
    if (projectScheduleDurationSeedDays) {
      return projectScheduleDurationSeedDays;
    }

    const resolvedDuration = getInclusiveScheduleDaySpan(
      projectScheduleStartDate,
      projectScheduleDeadlineDate,
    );
    if (resolvedDuration) {
      return resolvedDuration;
    }

    return 28;
  }, [projectScheduleDeadlineDate, projectScheduleDurationSeedDays, projectScheduleStartDate]);

  const projectScheduleEndDate = useMemo(() => {
    if (projectScheduleDeadlineDate) {
      return projectScheduleDeadlineDate;
    }

    return (
      addScheduleDays(projectScheduleStartDate, projectScheduleDurationDays - 1) ||
      normalizeScheduleDate(dashboardClock) ||
      normalizeScheduleDate(new Date())
    );
  }, [
    dashboardClock,
    projectScheduleDeadlineDate,
    projectScheduleDurationDays,
    projectScheduleStartDate,
  ]);

  const scheduleMarkerLeftPct = useMemo(
    () => clampProgress(activeScheduleProgressPct || 0),
    [activeScheduleProgressPct],
  );

  const schedulePhaseSegments = useMemo(() => {
    const totalDays =
      getInclusiveScheduleDaySpan(projectScheduleStartDate, projectScheduleEndDate) ||
      Math.max(1, projectScheduleDurationDays);
    const phaseDayAllocations = allocateScheduleDaysByShare(totalDays, scheduleTimelineShares);
    let elapsedDays = 0;

    return Array.from({ length: 4 }, (_, index) => {
      const phaseDurationDays = Math.max(0, phaseDayAllocations[index] ?? 0);
      const startOffset = elapsedDays;
      const endOffset = elapsedDays + Math.max(0, phaseDurationDays - 1);
      const start = addScheduleDays(projectScheduleStartDate, startOffset);
      const end = addScheduleDays(projectScheduleStartDate, endOffset);
      elapsedDays += phaseDurationDays;

      return {
        id: `schedule-phase-segment-${index + 1}`,
        label: `Phase ${index + 1}`,
        start,
        end,
        rangeLabel: formatScheduleDateRange(start, end),
        startPct: scheduleTimelineStarts[index] ?? 0,
        endPct: (scheduleTimelineStarts[index] ?? 0) + (scheduleTimelineShares[index] ?? 0),
      };
    });
  }, [
    projectScheduleDurationDays,
    projectScheduleEndDate,
    projectScheduleStartDate,
    scheduleTimelineShares,
    scheduleTimelineStarts,
  ]);

  const activeSchedulePhaseSegmentIndex = useMemo(
    () => resolvePhaseIndexFromProgress(scheduleMarkerLeftPct, scheduleTimelineShares.length || 4),
    [scheduleMarkerLeftPct, scheduleTimelineShares],
  );

  const scheduleTodayDateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }).format(dashboardClock),
    [dashboardClock],
  );

  const scheduleTimelineRows = useMemo(() => {
    const cumulativeBoundaries = scheduleTimelineShares.reduce((acc, share, index) => {
      const previous = index === 0 ? 0 : acc[index - 1];
      acc.push(previous + share);
      return acc;
    }, []);

    const normalizedProgress = clampProgress(activeScheduleProgressPct || 0);
    const activeIndex = cumulativeBoundaries.findIndex((boundary) => normalizedProgress < boundary);
    const resolvedActiveIndex = activeIndex >= 0 ? activeIndex : 3;

    return Array.from({ length: 4 }, (_, index) => {
      const phase = schedulePhases[index] || {
        label: `Phase ${index + 1}`,
        summary: "Upcoming",
        progress: 0,
        isComplete: false,
      };

      const isCompleted = index < resolvedActiveIndex;
      const isActive = index === resolvedActiveIndex;
      const isPending = index === resolvedActiveIndex + 1;
      const isScheduled = !isCompleted && !isActive && !isPending;

      return {
        id: `schedule-phase-${index + 1}`,
        title: `Phase ${index + 1}`,
        summary: phase.label || `Phase ${index + 1}`,
        progress: clampProgress(phase.progress || 0),
        rowStartPct: scheduleTimelineStarts[index] ?? 0,
        rowWidthPct: scheduleTimelineShares[index] ?? 15,
        isCompleted,
        isActive,
        isPending,
        isScheduled,
        rowLabel: isCompleted
          ? "FINISHED"
          : isActive
            ? "In Progress"
            : isPending
              ? "Pending"
              : "Scheduled",
        detailLabel: isCompleted
          ? "Done"
          : isActive
            ? `${clampProgress(phase.progress || 0)}% IN PROGRESS`
            : isPending
              ? "PENDING"
              : "",
        noteLabel: isCompleted
          ? null
          : isActive
            ? !Number.isFinite(activeScheduleDaysToDeadline)
              ? "On track"
              : activeScheduleDaysToDeadline < 0
                ? `Overdue ${Math.abs(activeScheduleDaysToDeadline)} days`
                : activeScheduleDaysToDeadline === 0
                  ? "Due today"
                  : `Due in ${activeScheduleDaysToDeadline} days`
            : isPending
              ? !Number.isFinite(activeScheduleDaysToDeadline)
                ? "Pending"
                : activeScheduleDaysToDeadline < 0
                  ? `Overdue ${Math.abs(activeScheduleDaysToDeadline)} days`
                  : `Due in ${Math.max(1, activeScheduleDaysToDeadline)} days`
              : !Number.isFinite(activeScheduleDaysToDeadline)
                ? "Scheduled"
                : activeScheduleDaysToDeadline < 0
                  ? `Overdue ${Math.abs(activeScheduleDaysToDeadline)} days`
                  : `due in ${Math.max(1, activeScheduleDaysToDeadline)} days`,
      };
    });
  }, [
    activeScheduleDaysToDeadline,
    activeScheduleProgressPct,
    schedulePhases,
    scheduleTimelineShares,
    scheduleTimelineStarts,
  ]);

  const showRunningProjectsCarouselControls =
    runningProjectsFilter === "all" && visibleRunningProjects.length > 3;

  useEffect(() => {
    const shouldUseRunningProjectsCarousel = runningProjectsFilter === "all";
    if (!runningProjectsCarouselApi || !shouldUseRunningProjectsCarousel) {
      setCanGoToPreviousRunningProjects(false);
      setCanGoToNextRunningProjects(false);
      setRunningProjectsCarouselSnapCount(0);
      setActiveRunningProjectsSnap(0);
      return undefined;
    }

    const syncRunningProjectsCarouselState = () => {
      setCanGoToPreviousRunningProjects(runningProjectsCarouselApi.canScrollPrev());
      setCanGoToNextRunningProjects(runningProjectsCarouselApi.canScrollNext());
      setRunningProjectsCarouselSnapCount(runningProjectsCarouselApi.scrollSnapList().length);
      setActiveRunningProjectsSnap(runningProjectsCarouselApi.selectedScrollSnap());
    };

    syncRunningProjectsCarouselState();
    runningProjectsCarouselApi.on("select", syncRunningProjectsCarouselState);
    runningProjectsCarouselApi.on("reInit", syncRunningProjectsCarouselState);

    return () => {
      runningProjectsCarouselApi.off("select", syncRunningProjectsCarouselState);
      runningProjectsCarouselApi.off("reInit", syncRunningProjectsCarouselState);
    };
  }, [runningProjectsCarouselApi, runningProjectsFilter]);

  const activeRunningProjectsFilterLabel =
    runningProjectFilterOptions.find((option) => option.value === runningProjectsFilter)?.label ||
    "All projects";

  const hero = useMemo(
    () => ({
      greeting,
      firstName,
      dateLabel: dashboardDateLabel,
    }),
    [dashboardDateLabel, firstName, greeting],
  );

  const dashboardMetricCards = useMemo(
    () => [
      {
        id: "active-projects",
        icon: FolderKanban,
        title: "Active Projects",
        value: String(metrics.activeProjects).padStart(2, "0"),
        onClick: () => navigate("/freelancer/project?view=ongoing"),
        ariaLabel: "Open active projects",
      },
      {
        id: "completed-projects",
        icon: CheckCircle2,
        title: "Completed Projects",
        value: String(metrics.completedProjects).padStart(2, "0"),
        onClick: () => navigate("/freelancer/project?view=completed"),
        ariaLabel: "Open completed projects",
      },
      {
        id: "pending-proposals",
        icon: ClipboardList,
        title: "Pending Proposals",
        value: String(metrics.pendingProposals.length).padStart(2, "0"),
        onClick: () => navigate("/freelancer/proposals?tab=pending"),
        ariaLabel: "Open pending proposals",
        className: "col-span-2 xl:col-span-1",
      },
      {
        id: "total-earnings",
        icon: CreditCard,
        title: showPendingPaymentsStat ? "Pending Payments" : "Total Earnings",
        value: showPendingPaymentsStat
          ? formatFreelancerDashboardCurrency(metrics.pendingEarnings)
          : formatFreelancerDashboardCurrency(metrics.earnings),
        onClick: () => navigate("/freelancer/payments"),
        ariaLabel: "Open payments",
        className: "col-span-2 xl:col-span-1",
        control: (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setShowPendingPaymentsStat((previous) => !previous);
            }}
            onKeyDown={(event) => {
              event.stopPropagation();
            }}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-[16px] bg-white/[0.06] text-muted-foreground/75 transition-colors hover:bg-white/[0.12] hover:text-[#facc15] sm:size-9 sm:rounded-lg"
            aria-label={
              showPendingPaymentsStat ? "Show total earnings" : "Show pending payments"
            }
          >
            <Repeat2 className="size-4 text-muted-foreground/75" />
          </button>
        ),
      },
    ],
    [metrics, navigate, showPendingPaymentsStat],
  );

  const dashboardModel = {
    sessionUser,
    showSuspensionAlert,
    setShowSuspensionAlert,
    showWelcomeDialog,
    setShowWelcomeDialog,
    headerProfile,
    activeWorkspaceKey,
    handleWorkspaceNav,
    notifications,
    unreadCount,
    markAllAsRead,
    handleNotificationClick,
    showOnboardingAlert,
    hero,
    metricsLoading,
    dashboardMetricCards,
    shouldShowProfileCompletionPanel,
    showProfileCompletionSkeleton,
    profileCompletionPercent,
    profileCompletionComplete,
    runningProjectCards,
    freelancerProjectRedirectCards,
    shouldUseProjectCarousel,
    setProjectCarouselApi,
    projectCarouselApi,
    canGoToPreviousProjects,
    canGoToNextProjects,
    projectCarouselSnapCount,
    activeProjectSnap,
    projectCardRefs,
    isMobile,
    mobileProjectCardHeight,
    activeProjectCardClassName,
    activeProjectRedirectCardClassName,
    pendingProposalRows,
    activityItems,
    previewMessages,
    earningsMomentumSummary,
    nextPayoutSummaryLabel,
    receivedEarningsLabel: formatFreelancerDashboardCurrency(metrics.receivedEarnings),
    pendingEarningsLabel: formatFreelancerDashboardCurrency(metrics.pendingEarnings),
    metrics,
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
    onOpenProfile: () => navigate("/freelancer/profile"),
    onOpenProposals: () => navigate("/freelancer/proposals"),
    onOpenMessages: () => navigate("/freelancer/messages"),
    onOpenOnboarding: () => navigate("/freelancer/onboarding"),
    onOpenNotificationSheet: () => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("freelancer-notifications:open"));
      }
    },
  };

  if (typeof children === "function") {
    return children(dashboardModel);
  }

  return (
    <div className="min-h-screen bg-background text-[#f1f5f9]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1536px] flex-col px-4 sm:px-6 lg:px-[40px] xl:w-[85%] xl:max-w-none">

      <SuspensionAlert
        open={showSuspensionAlert}
        onOpenChange={setShowSuspensionAlert}
        suspendedAt={sessionUser?.suspendedAt}
      />
      <Dialog open={showWelcomeDialog} onOpenChange={setShowWelcomeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Welcome to Catalance
            </DialogTitle>
            <DialogDescription>
              Your freelancer account is ready. You can explore the dashboard now
              and start onboarding whenever you want.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowWelcomeDialog(false)}
            >
              Continue to Dashboard
            </Button>
            <Button
              onClick={() => {
                setShowWelcomeDialog(false);
                navigate("/freelancer/onboarding");
              }}
            >
              Start Onboarding
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FreelancerWorkspaceHeader
        profile={headerProfile}
        activeWorkspaceKey={activeWorkspaceKey}
        onWorkspaceNav={handleWorkspaceNav}
        onOpenProfile={() => navigate("/freelancer/profile")}
        onPrimaryAction={
          activeWorkspaceKey !== "proposals"
            ? () => navigate("/freelancer/proposals")
            : undefined
        }
        notifications={notifications}
        unreadCount={unreadCount}
        markAllAsRead={markAllAsRead}
        onNotificationClick={handleNotificationClick}
      />

      <main className="relative z-10 flex-1 pb-12 pt-4 sm:pb-14 sm:pt-5">
        <div className="flex w-full flex-col gap-6 sm:gap-7">
          {showOnboardingAlert ? (
            <div className="relative overflow-hidden rounded-[24px] border border-[#facc15]/30 bg-[#252116] px-4 py-4 sm:px-5">
              <div className="pointer-events-none absolute -right-12 -top-16 h-36 w-36 rounded-full bg-[#facc15]/15 blur-3xl" />
              <div className="relative z-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#facc15]">
                    Onboarding Required
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-zinc-100">
                    Complete your profile to start getting matched with higher-value projects.
                  </h3>
                </div>
                <Button
                  className="h-9 rounded-full bg-[#facc15] px-5 text-xs font-bold text-black hover:bg-[#eab308]"
                  onClick={() => navigate("/freelancer/onboarding")}
                >
                  Start Onboarding
                </Button>
              </div>
            </div>
          ) : null}

          <section className="mt-1 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <p className="order-1 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground lg:order-2">
              {dashboardDateLabel}
            </p>
            <div className="order-2 min-w-0 lg:order-1">
              <h1 className="text-[clamp(2rem,4vw,3rem)] font-semibold leading-[0.96] tracking-[-0.05em] text-white">
                {greeting}, {firstName}
              </h1>
            </div>
          </section>

          {metricsLoading ? (
            <FreelancerMetricCardsSkeleton />
          ) : (
            <section className="grid auto-rows-fr grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
              <FreelancerMetricCard
                icon={FolderKanban}
                title="Active Projects"
                value={String(metrics.activeProjects).padStart(2, "0")}
                onClick={() => navigate("/freelancer/project?view=ongoing")}
                aria-label="Open active projects"
              />
              <FreelancerMetricCard
                icon={CheckCircle2}
                title="Completed Projects"
                value={String(metrics.completedProjects).padStart(2, "0")}
                onClick={() => navigate("/freelancer/project?view=completed")}
                aria-label="Open completed projects"
              />
              <FreelancerMetricCard
                icon={ClipboardList}
                title="Pending Proposals"
                value={String(metrics.pendingProposals.length).padStart(2, "0")}
                onClick={() => navigate("/freelancer/proposals?tab=pending")}
                aria-label="Open pending proposals"
                className="col-span-2 xl:col-span-1"
              />
              <FreelancerMetricCard
                icon={CreditCard}
                title={showPendingPaymentsStat ? "Pending Payments" : "Total Earnings"}
                value={
                  showPendingPaymentsStat
                    ? formatFreelancerDashboardCurrency(metrics.pendingEarnings)
                    : formatFreelancerDashboardCurrency(metrics.earnings)
                }
                onClick={() => navigate("/freelancer/payments")}
                aria-label="Open payments"
                className="col-span-2 xl:col-span-1"
                control={
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setShowPendingPaymentsStat((previous) => !previous);
                    }}
                    onKeyDown={(event) => {
                      event.stopPropagation();
                    }}
                    className="inline-flex size-10 shrink-0 items-center justify-center rounded-[16px] bg-white/[0.06] text-muted-foreground/75 transition-colors hover:bg-white/[0.12] hover:text-[#facc15] sm:size-9 sm:rounded-lg"
                    aria-label={showPendingPaymentsStat ? "Show total earnings" : "Show pending payments"}
                  >
                    <Repeat2 className="size-4 text-muted-foreground/75" />
                  </button>
                }
              />
            </section>
          )}

          {shouldShowProfileCompletionPanel ? (
            showProfileCompletionSkeleton ? (
              <FreelancerProfileCompletionSkeleton />
            ) : (
              <section>
                <FreelancerDashboardPanel className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <h2 className="min-w-0 text-[1.2rem] font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-[1.35rem] lg:text-[1.55rem]">
                      {profileCompletionComplete
                        ? "Your Catalance profile is ready"
                        : "Finish setting up your Catalance profile"}
                    </h2>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:w-auto lg:justify-end lg:gap-4">
                      <span className="text-sm font-bold text-[#facc15]">
                        {profileCompletionPercent}% Complete
                      </span>
                      <Button
                        className="h-10 w-full rounded-full bg-[#facc15] px-5 text-xs font-semibold text-black hover:bg-[#ffd54f] sm:w-auto"
                        onClick={() => navigate("/freelancer/profile")}
                      >
                        {profileCompletionComplete ? "Open Profile" : "Finish Setup"}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.96),rgba(255,255,255,0.72))] transition-all duration-700"
                      style={{ width: `${profileCompletionPercent}%` }}
                    />
                  </div>
                </FreelancerDashboardPanel>
              </section>
            )
          ) : null}

          {metricsLoading ? (
            <FreelancerActiveProjectsSkeleton />
          ) : (
          <section>
            <div className="mb-6 flex items-center justify-between gap-4">
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
                <FreelancerProjectCarouselControls
                  onPrevious={() => projectCarouselApi?.scrollPrev()}
                  onNext={() => projectCarouselApi?.scrollNext()}
                  canGoPrevious={canGoToPreviousProjects}
                  canGoNext={canGoToNextProjects}
                />
              ) : null}
            </div>

            {runningProjectCards.length === 0 ? (
              <FreelancerDashboardPanel className="flex min-h-[220px] items-center justify-center rounded-[28px] border border-white/[0.06] bg-card p-8 text-center">
                <div className="max-w-md">
                  <p className="text-[1.35rem] font-semibold tracking-[-0.03em] text-white">
                    No active projects yet
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[#94a3b8]">
                    Projects will appear here once a client approves your proposal and work has started.
                  </p>
                </div>
              </FreelancerDashboardPanel>
            ) : shouldUseProjectCarousel ? (
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
                    {runningProjectCards.map((projectCard) => (
                      <CarouselItem
                        key={projectCard.id}
                        className="pl-[2px] pr-[2px] pt-1 basis-full md:basis-[calc((100%-1.5rem)/2)] xl:basis-[calc((100%-3.5rem)/3)]"
                      >
                        <div
                          ref={(node) => {
                            projectCardRefs.current[projectCard.id] = node;
                          }}
                        >
                          <ProjectProposalCard
                            project={projectCard}
                            replaceSectionBadgeWithStatus
                            className={activeProjectCardClassName}
                          />
                        </div>
                      </CarouselItem>
                    ))}
                    {freelancerProjectRedirectCards.map((item) => (
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
                          <FreelancerProjectRedirectCard
                            item={item}
                            className={activeProjectRedirectCardClassName}
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
                <FreelancerCarouselDots
                  count={projectCarouselSnapCount}
                  activeIndex={activeProjectSnap}
                  onSelect={(index) => projectCarouselApi?.scrollTo(index)}
                  ariaLabel="Active projects carousel pagination"
                  getDotLabel={(index) => `Go to active project ${index + 1}`}
                />
              </div>
            ) : (
              <div className="grid items-start gap-5 sm:gap-6 xl:gap-7 md:grid-cols-2 xl:grid-cols-3">
                  {runningProjectCards.map((projectCard) => (
                    <ProjectProposalCard
                      key={projectCard.id}
                      project={projectCard}
                      replaceSectionBadgeWithStatus
                      className={activeProjectCardClassName}
                    />
                  ))}
                  {freelancerProjectRedirectCards.map((item) => (
                    <FreelancerProjectRedirectCard
                      key={item.id}
                      item={item}
                      className={activeProjectRedirectCardClassName}
                    />
                ))}
              </div>
            )}
          </section>
          )}

          <section className="grid items-start grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-5">
              {metricsLoading ? (
                <FreelancerPendingProposalsSkeleton />
              ) : (
                <FreelancerPendingProposalsSection
                  pendingProposalRows={pendingProposalRows}
                  onOpenAll={() => navigate("/freelancer/proposals")}
                />
              )}

              {metricsLoading ? (
                <FreelancerRecentActivitySkeleton />
              ) : (
                <FreelancerRecentActivitySection
                  recentActivities={activityItems}
                  onOpenViewAll={() => {
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new CustomEvent("freelancer-notifications:open"));
                    }
                  }}
                />
              )}
            </div>

            <div className="grid content-start items-start gap-5 self-start">
              {metricsLoading ? (
                <>
                  <FreelancerChatsSkeleton />
                  <FreelancerCompactEarningsSummarySkeleton />
                </>
              ) : (
                <>
                  <section className="w-full min-w-0">
                    <div className="mb-4 sm:mb-5">
                      <h2 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-white sm:text-[1.65rem]">
                        Active Chats
                      </h2>
                    </div>
                    <FreelancerDashboardPanel className="h-fit self-start p-4 sm:p-5">
                      {previewMessages.length === 0 ? (
                        <div className="flex min-h-[220px] flex-col items-center justify-center px-4 py-8 text-center sm:min-h-[260px] sm:py-10">
                          <div className="flex size-12 items-center justify-center rounded-full bg-white/[0.06] text-[#94a3b8] sm:size-14">
                            <MessageSquare className="size-6" />
                          </div>
                          <p className="mt-5 text-sm text-white">No active project chats yet</p>
                          <p className="mt-2 max-w-[220px] text-xs text-[#8f8f8f]">
                            Chat shortcuts appear here once a project becomes active and messaging is unlocked.
                          </p>
                        </div>
                      ) : (
                        <>
                          <ul className="space-y-4 sm:space-y-5">
                            {previewMessages.map((message) => (
                              <li
                                key={message.id}
                                className="rounded-[18px] bg-white/[0.03] px-3.5 py-3.5"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#272a31] text-[11px] font-bold text-zinc-100">
                                    {message.initial}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                      <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <p className="truncate text-sm font-semibold text-zinc-100">
                                            {message.senderName}
                                          </p>
                                          {message.projectLabel ? (
                                            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[#94a3b8]">
                                              {message.projectLabel}
                                            </span>
                                          ) : null}
                                        </div>
                                        <p className="mt-2 text-sm leading-5 text-zinc-200">
                                          {message.previewText}
                                        </p>
                                      </div>
                                      <span className="shrink-0 text-[11px] text-muted-foreground">
                                        {message.timeLabel}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                          <button
                            type="button"
                            onClick={() => navigate("/freelancer/messages")}
                            className="mt-8 flex w-full items-center justify-center gap-2 text-[13px] font-bold uppercase tracking-[0.16em] text-[#8f8f8f] transition-colors hover:text-white"
                          >
                            <span>Open Messages ({previewMessages.length})</span>
                            <ChevronRight className="size-[15px] stroke-[1.75]" />
                          </button>
                        </>
                      )}
                    </FreelancerDashboardPanel>
                  </section>

                  <FreelancerCompactEarningsSummary
                    receivedAmount={formatFreelancerDashboardCurrency(metrics.receivedEarnings)}
                    pendingAmount={formatFreelancerDashboardCurrency(metrics.pendingEarnings)}
                    momentumLabel={earningsMomentumSummary.label}
                    nextPayoutLabel={nextPayoutSummaryLabel}
                  />
                </>
              )}
            </div>
          </section>

          {metricsLoading ? (
            <FreelancerEarningsSkeleton />
          ) : (
          <section className="w-full min-w-0">
            <div className="mb-4 flex items-center justify-between gap-4 sm:mb-5">
              <h2 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-white sm:text-[1.65rem]">
                Delivery Pipeline
              </h2>
              <div className="ml-auto flex items-center gap-2 sm:gap-3">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 w-[12rem] justify-between rounded-full border-white/[0.12] bg-card px-3 text-[11px] font-semibold text-zinc-200 hover:bg-card data-[state=open]:bg-card"
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
                    className="w-[12rem] rounded-xl border-white/[0.12] bg-card p-1.5"
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
                          runningProjectsFilter === option.value && "bg-white/[0.08] text-white",
                          option.count === 0 && "cursor-not-allowed opacity-50",
                        )}
                      >
                        <span>{option.label}</span>
                        {option.kind === "preset" ? (
                          <span className="ml-auto text-[11px] text-zinc-400">{option.count}</span>
                        ) : null}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <FreelancerDashboardPanel className="overflow-hidden p-0">
              <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-7">
                <div className="flex flex-col gap-4">

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
                              className="absolute left-2 top-1/2 z-20 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/[0.08] bg-card/95 text-white transition-colors hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:border-white/[0.08] disabled:bg-card/70 disabled:text-white/35"
                            >
                              <ChevronLeft className="size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => runningProjectsCarouselApi?.scrollNext()}
                              disabled={!canGoToNextRunningProjects}
                              aria-label="Show next running project"
                              className="absolute right-2 top-1/2 z-20 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/[0.08] bg-card/95 text-white transition-colors hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:border-white/[0.08] disabled:bg-card/70 disabled:text-white/35"
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
                            {visibleRunningProjects.map((item, index) => (
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
                    {visibleRunningProjects.map((item, index) => (
                      <FreelancerRunningProjectCard
                        key={item.id}
                        item={item}
                        isSelected={String(selectedRunningProjectId || "") === String(item.id)}
                        canShowSelection={visibleRunningProjects.length > 1}
                        onSelect={() => setSelectedRunningProjectId(String(item.id))}
                      />
                    ))}
                    {visibleRunningProjects.length === 0 ? (
                      <Card className="md:col-span-2 xl:col-span-3 rounded-[18px] border border-dashed border-white/[0.12] bg-background/20 shadow-none">
                        <CardContent className="flex min-h-[140px] flex-col items-center justify-center p-6 text-center">
                          <p className="text-sm font-medium text-white">No projects in this filter</p>
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
                            <p className="mt-2 text-[1.05rem] font-semibold tracking-[-0.03em] text-white">
                              Phase timeline for {activeScheduleProjectTitle}
                            </p>
                          </div>
                          <Badge className="rounded-full border-0 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold text-zinc-300">
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
                                          key={`${row.id}`}
                                          className="absolute left-0 right-0"
                                          style={{ top: `${rowTop}px` }}
                                        >
                                          <p className="absolute top-[4px] flex h-[24px] items-center text-[10px] font-semibold uppercase tracking-[0.18em] leading-none text-muted-foreground">
                                            {row.title}
                                          </p>
                                          <p className="absolute top-[30px] flex h-[12px] items-center leading-none text-[10px] text-white/90">
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
                                              : "text-white/90",
                                          )}
                                        >
                                          {segment.rangeLabel}
                                        </p>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="relative mt-12 h-[214px]">
                                    <div className="absolute left-0 right-0 top-0 bottom-0 border-l border-white/[0.05]" />
                                    {[25, 50, 75].map((leftPct) => (
                                      <div
                                        key={`schedule-divider-${leftPct}`}
                                        className="absolute top-0 bottom-0 border-l border-white/[0.04]"
                                        style={{ left: `${leftPct}%` }}
                                      />
                                    ))}
                                    <div
                                      className="absolute top-[-6px] bottom-0 w-px border-l-2 border-dotted border-[#facc15]/60"
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
                                        <span className="mt-1 rounded-[6px] bg-primary px-2 py-0.5 text-[9px] font-semibold text-black">
                                          TODAY
                                        </span>
                                      </div>
                                    </div>

                                    {visualRows.map((row, rowIndex) => {
                                      const rowTop = rowIndex * 52;
                                      const rowLabelCenterPct = row.rowStartPct + row.rowWidthPct / 2;
                                      const isOnTrackNote = String(row.noteLabel || "").trim().toLowerCase() === "on track";
                                      return (
                                        <div key={row.id} className="absolute left-0 right-0" style={{ top: `${rowTop}px` }}>
                                          <div
                                            className={cn(
                                              "absolute top-0 h-[26px] rounded-[14px]",
                                              row.isCompleted
                                                ? "bg-emerald-500/10"
                                                : row.isActive
                                                  ? "bg-[#facc15]/35"
                                                  : "bg-white/[0.06]",
                                            )}
                                            style={{ left: `${row.rowStartPct}%`, width: `${row.rowWidthPct}%` }}
                                          />
                                          <div
                                            className={cn(
                                              "absolute top-[13px] inline-flex -translate-x-1/2 -translate-y-1/2 items-center justify-center whitespace-nowrap rounded-full px-4 py-1 text-[10px] font-semibold",
                                              row.isCompleted
                                                ? "bg-emerald-500/20 text-emerald-300"
                                                : row.isActive
                                                  ? "bg-[#facc15] text-black"
                                                  : "bg-white/[0.06] text-zinc-400",
                                            )}
                                            style={{ left: `${rowLabelCenterPct}%` }}
                                          >
                                            {row.rowLabel}
                                          </div>

                                          {row.isCompleted ? (
                                            <div
                                              className="absolute top-[30px] inline-flex items-center gap-1.5 text-[9px] font-semibold text-emerald-300"
                                              style={{ left: `calc(${row.rowStartPct}% + ${Math.max(1, row.rowWidthPct - 4)}%)` }}
                                            >
                                              <span className="inline-flex size-3.5 items-center justify-center rounded-full border border-emerald-400/40">
                                                <span className="size-1.5 rounded-full bg-emerald-400" />
                                              </span>
                                              Done
                                            </div>
                                          ) : row.isScheduled ? (
                                            <div
                                              className="absolute top-[31px] text-[9px] font-semibold text-zinc-500"
                                              style={{ left: `calc(${row.rowStartPct}% + ${Math.max(1, row.rowWidthPct - 8)}%)` }}
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
                                                  row.isActive ? "bg-[#facc15]" : "bg-zinc-500/70",
                                                )}
                                              />
                                              <span
                                                className={cn(
                                                  "text-[9px] font-semibold uppercase tracking-[0.16em]",
                                                  row.isActive ? "text-[#facc15]" : "text-zinc-300",
                                                )}
                                              >
                                                {row.detailLabel}
                                              </span>
                                              {row.noteLabel ? (
                                                <span
                                                  className={cn(
                                                    "rounded-[10px] border px-2 py-0.5 text-[9px] font-semibold",
                                                    isOnTrackNote
                                                      ? "border-[#facc15]/40 bg-[#facc15]/14 text-[#facc15]"
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
                              <p className="text-sm font-semibold text-white">No active project</p>
                              <p className="mt-2 text-xs text-zinc-400">
                                Project Schedule will appear when an active project is selected.
                              </p>
                            </div>
                          )}
                            </div>
                          </CardContent>
                        </Card>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {(() => {
                        const hasActiveProject = Boolean(activeProposalForSchedule);
                        const statusTone =
                          !hasActiveProject
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
                        const daysRemaining = hasActiveProject && Number.isFinite(activeScheduleDueInDays)
                          ? activeScheduleDueInDays
                          : pending
                            ? pending * 7
                            : 0;

                        return (
                          <>
                            <Card className="rounded-[20px] border border-white/[0.08] bg-card shadow-none">
                              <CardContent className="p-5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                  Current Status
                                </p>
                                <div className="mt-3 flex items-end justify-between gap-3">
                                  <p className="text-[1.35rem] font-semibold tracking-[-0.03em] text-white">
                                    {statusTone}
                                  </p>
                                  <p className="text-[11px] font-semibold text-[#facc15]">
                                    {hasActiveProject ? `${activeScheduleProgressPct}%` : "—"}
                                  </p>
                                </div>
                                <div className="mt-3 h-[2px] overflow-hidden rounded-full bg-white/[0.08]">
                                  <div
                                    className="h-full rounded-full bg-[#facc15]"
                                    style={{ width: `${hasActiveProject ? Math.min(100, activeScheduleProgressPct || 0) : 0}%` }}
                                  />
                                </div>
                                <p className="mt-4 text-[12px] font-medium text-muted-foreground">{statusSub}</p>
                              </CardContent>
                            </Card>

                            <Card className="rounded-[20px] border border-white/[0.08] bg-card shadow-none">
                              <CardContent className="p-5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                  Time Remaining
                                </p>
                                <p className="mt-3 text-[1.75rem] font-semibold tracking-[-0.03em] text-white">
                                  {hasActiveProject ? (daysRemaining ? `${daysRemaining} Days` : "—") : "No active project"}
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
                                <p className="mt-3 text-[1.75rem] font-semibold tracking-[-0.03em] text-white">
                                  {hasActiveProject ? `${completed}/${total}` : "No active project"}
                                </p>
                                <div className="mt-3 flex items-center gap-1">
                                  {Array.from({ length: dotCount }).map((_, i) => (
                                    <span
                                      // eslint-disable-next-line react/no-array-index-key
                                      key={i}
                                      className={cn(
                                        "h-1.5 w-1.5 rounded-full",
                                        hasActiveProject && i < dotsOn ? "bg-[#facc15]" : "bg-white/[0.18]",
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
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </FreelancerDashboardPanel>
          </section>
          )}
        </div>
      </main>
      </div>
    </div>
  );
};

const FreelancerDashboard = () => {
  return <DashboardContent />;
};

export const ClientDashboard = () => {
  return <DashboardContent _roleOverride="CLIENT" />;
};

export default FreelancerDashboard;
