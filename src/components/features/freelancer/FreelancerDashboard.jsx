import React, { useCallback, useEffect, useMemo, useState } from "react";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Gavel from "lucide-react/dist/esm/icons/gavel";
import Video from "lucide-react/dist/esm/icons/video";
import MessageSquare from "lucide-react/dist/esm/icons/message-square";
import ClipboardList from "lucide-react/dist/esm/icons/clipboard-list";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import Clock from "lucide-react/dist/esm/icons/clock";
import Repeat2 from "lucide-react/dist/esm/icons/repeat-2";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import { useNotifications } from "@/shared/context/NotificationContext";
import FreelancerWorkspaceHeader from "@/components/features/freelancer/FreelancerWorkspaceHeader";
import { getSession } from "@/shared/lib/auth-storage";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/shared/context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { SuspensionAlert } from "@/components/ui/suspension-alert";
import { consumeFreelancerWelcomePending } from "@/shared/lib/freelancer-onboarding-flags";
import {
  ProjectProposalCard,
  buildProjectCardModel,
} from "@/components/features/client/ClientProjects";
import { getSopFromTitle } from "@/shared/data/sopTemplates";
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

const normalizeComparableText = (value = "") =>
  String(value || "").trim().toLowerCase();

const buildDefaultPhases = (count = 4) =>
  Array.from({ length: Math.max(1, count) }, (_, index) => ({
    label: `Phase ${index + 1}`,
    value: Math.round(((index + 1) / Math.max(count, 1)) * 100),
  }));

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
    const subLabel = index === 0 ? "Current phase" : "Upcoming";

    return {
      ...phase,
      subLabel,
      steps: resolvePhaseStepsForDisplay(phaseSteps[index], phase, subLabel),
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

const PENDING_PROPOSAL_TONE_STYLES = {
  amber: "bg-[#40310a] text-[#ffc107]",
  blue: "bg-[#19345d] text-[#60a5fa]",
  green: "bg-[#163822] text-[#34d399]",
  violet: "bg-[#3d2459] text-[#c084fc]",
};

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

export const DashboardContent = ({ _roleOverride }) => {
  const [sessionUser, setSessionUser] = useState(null);
  const { authFetch, user } = useAuth();
  const [metrics, setMetrics] = useState({
    activeProjects: 0,
    completedProjects: 0,
    proposalsReceived: 0,
    acceptedProposals: [],
    pendingProposals: [],
    earnings: 0,
    receivedEarnings: 0,
    pendingEarnings: 0,
    totalProposals: 0,
  });
  const [upcomingMeeting, setUpcomingMeeting] = useState(null);
  const [showSuspensionAlert, setShowSuspensionAlert] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [showPendingPaymentsStat, setShowPendingPaymentsStat] = useState(false);
  const [projectCarouselIndex, setProjectCarouselIndex] = useState(0);
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
    if (notification.type === "chat" && notification.data) {
      const service = notification.data.service || "";
      const parts = service.split(":");
      let projectId = notification.data.projectId;
      if (!projectId && parts.length >= 4 && parts[0] === "CHAT") {
        projectId = parts[1];
      }
      navigate(
        projectId
          ? `/freelancer/messages?projectId=${projectId}`
          : "/freelancer/messages"
      );
      return;
    }

    if (notification.type === "proposal") {
      const { status, projectId } = notification.data || {};
      if (status === "ACCEPTED" && projectId) {
        navigate(`/freelancer/project/${projectId}`);
      } else if (status === "ACCEPTED") {
        navigate("/freelancer/proposals/accepted");
      } else {
        navigate("/freelancer/proposals");
      }
      return;
    }

    if (
      (notification.type === "meeting_scheduled" ||
        notification.type === "task_completed" ||
        notification.type === "task_verified" ||
        notification.type === "task_unverified") &&
      notification.data?.projectId
    ) {
      navigate(`/freelancer/project/${notification.data.projectId}`);
      return;
    }

    navigate("/freelancer");
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
  const profileCompletionComplete = profileCompletionPercent >= 90;
  const activeWorkspaceKey = useMemo(() => {
    if (location.pathname.startsWith("/freelancer/proposals")) return "proposals";
    if (location.pathname.startsWith("/freelancer/project")) return "projects";
    if (location.pathname.startsWith("/freelancer/messages")) return "messages";
    if (location.pathname.startsWith("/freelancer/payments")) return "payments";
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
    };
  }, [effectiveUser?.avatar, effectiveUser?.email, effectiveUser?.fullName, effectiveUser?.name]);
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

        const pending = list.filter(
          (p) => (p.status || "").toUpperCase() === "PENDING"
        );
        const accepted = list.filter(
          (p) => (p.status || "").toUpperCase() === "ACCEPTED"
        );
        const uniqueAcceptedByProject = accepted.reduce((acc, proposal) => {
          const key = resolveProjectFingerprint(proposal);
          if (!key || acc.has(key)) return acc;
          acc.set(key, proposal);
          return acc;
        }, new Map());
        const acceptedProjects = Array.from(uniqueAcceptedByProject.values());
        const completedProjects = acceptedProjects.filter((proposal) =>
          isProposalCompletedForDashboard(proposal),
        );
        const activeProjects = acceptedProjects.filter(
          (proposal) => !isProposalCompletedForDashboard(proposal),
        );

        let totalReceived = 0;
        let totalPending = 0;

        acceptedProjects.forEach((p) => {
          const amount = Number(p.amount) || 0;
          const status = p.project?.status || "";

          // Reverting to strict logic: Only count as 'Received' if project is COMPLETED.
          // Even if client paid upfront (spent > 0), it's not "Received" by freelancer until completion.
          let paidAmount = 0;
          if (status === "COMPLETED") {
            paidAmount = amount;
          }

          totalReceived += paidAmount;
          totalPending += Math.max(0, amount - paidAmount);
        });

        console.log(
          "DEBUG: Accepted Proposals:",
          acceptedProjects.map((p) => ({
            id: p.id,
            projectId: p.project?.id,
            amount: p.amount,
            projectSpent: p.project?.spent,
            projectStatus: p.project?.status,
          }))
        );
        console.log(
          "DEBUG: totalReceived:",
          totalReceived,
          "totalPending:",
          totalPending
        );

        // Freelancer 70% share of the calculated amounts
        const receivedEarnings = Math.round(totalReceived * 0.7);
        const pendingEarnings = Math.round(totalPending * 0.7);
        const totalEarnings = receivedEarnings + pendingEarnings;

        setMetrics({
          activeProjects: activeProjects.length,
          completedProjects: completedProjects.length,
          proposalsReceived: pending.length,
          acceptedProposals: acceptedProjects,
          pendingProposals: pending,
          earnings: totalEarnings,
          receivedEarnings,
          pendingEarnings,
          totalProposals: list.length,
        });
      } catch (error) {
        console.error("Failed to load freelancer metrics", error);
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

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

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

  const unreadActivityCount = useMemo(
    () => activityItems.filter((item) => item.isUnread).length,
    [activityItems]
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const firstName = useMemo(() => {
    const rawName = String(headerProfile?.name || "Freelancer").trim();
    if (!rawName) return "Freelancer";
    return rawName.split(/\s+/)[0] || "Freelancer";
  }, [headerProfile?.name]);

  const pendingProposalRows = useMemo(
    () =>
      metrics.pendingProposals.slice(0, 4).map((proposal, index) => {
        const title =
          proposal?.project?.businessName ||
          proposal?.project?.companyName ||
          proposal?.project?.title ||
          "Untitled proposal";
        const requestTime = formatDashboardActivityTime(proposal?.updatedAt || proposal?.createdAt);
        const toneCycle = ["amber", "blue", "green", "violet"];

        return {
          id: proposal?.id || `pending-proposal-${index}`,
          title,
          tag: "Pending",
          tagTone: toneCycle[index % toneCycle.length],
          updatedAt: requestTime,
          budget: formatCurrency(Number(proposal?.amount) || 0),
          projectId: proposal?.project?.id,
        };
      }),
    [formatCurrency, metrics.pendingProposals]
  );

  const recentChatUpdates = useMemo(
    () =>
      notifications
        .filter((item) => String(item?.type || "").toLowerCase() === "chat")
        .slice(0, 3),
    [notifications]
  );

  const resolveProjectProgress = useCallback((proposal, index = 0) => {
    const explicitProgress = Number(proposal?.project?.progress);
    if (Number.isFinite(explicitProgress)) {
      return Math.max(0, Math.min(100, Math.round(explicitProgress)));
    }

    const proposalAmount = Number(proposal?.amount) || 0;
    const projectSpent = Number(proposal?.project?.spent);
    if (proposalAmount > 0 && Number.isFinite(projectSpent)) {
      return Math.max(12, Math.min(100, Math.round((projectSpent / proposalAmount) * 100)));
    }

    const fallbackProgress = [75, 54, 38, 66];
    return fallbackProgress[index % fallbackProgress.length];
  }, []);

  const monthlyEarningsSeries = useMemo(() => {
    const fallback = [48, 50, 46, 64, 42, 61];
    const source = metrics.acceptedProposals
      .slice(0, 6)
      .map((proposal) => Number(proposal?.amount) || 0)
      .filter((value) => value > 0);

    if (!source.length) return fallback;

    while (source.length < 6) {
      source.unshift(source[0]);
    }

    const minValue = Math.min(...source);
    const maxValue = Math.max(...source);
    if (maxValue === minValue) return fallback;

    return source.map((value) => {
      const normalized = (value - minValue) / (maxValue - minValue);
      return Math.round(36 + normalized * 30);
    });
  }, [metrics.acceptedProposals]);

  const monthlyEarningsPath = useMemo(() => {
    const chartWidth = 320;
    const chartHeight = 120;
    const steps = monthlyEarningsSeries.length - 1;
    if (steps <= 0) return "M0,60 L320,60";

    return monthlyEarningsSeries
      .map((value, index) => {
        const x = (chartWidth / steps) * index;
        const y = chartHeight - value;
        return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
  }, [monthlyEarningsSeries]);

  const proposalStats = useMemo(
    () => ({
      sent: metrics.totalProposals,
      accepted: metrics.acceptedProposals.length,
      pending: metrics.pendingProposals.length,
    }),
    [
      metrics.acceptedProposals.length,
      metrics.pendingProposals.length,
      metrics.totalProposals,
    ]
  );

  const activeProjectCards = useMemo(
    () =>
      metrics.acceptedProposals.filter(
        (proposal) => !isProposalCompletedForDashboard(proposal),
      ).slice(0, 4),
    [metrics.acceptedProposals]
  );

  const runningProjectCards = useMemo(
    () =>
      activeProjectCards.map((proposal, index) => {
        const project = proposal?.project || {};
        const projectId = project?.id;
        const progress = resolveProjectProgress(proposal, index);
        const ownerName =
          project?.owner?.fullName ||
          project?.owner?.name ||
          "Client";
        
        // Build full phase structure with steps using the same logic as client dashboard
        const phases = buildProjectPhases(project);
        const completedPhases = phases.filter(
          (phase) => clampProgress(phase?.progress ?? phase?.value ?? 0) >= 100
        ).length;
        const currentPhaseIndex = Math.min(completedPhases, phases.length - 1);
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
          project?.businessName ||
          project?.companyName ||
          project?.brandName ||
          proposal?.businessName ||
          proposal?.companyName ||
          proposal?.brandName ||
          project?.title ||
          "Untitled project";

        return {
          id: proposal?.id || projectId || `running-project-${index}`,
          sectionLabel: "ACTIVE PROJECT",
          statusMeta: {
            tone: "warning",
            label: "In Progress",
          },
          title: projectDisplayTitle,
          serviceType: proposal?.serviceType || project?.serviceType || "",
          freelancerName: ownerName,
          freelancerRole: "Client",
          freelancerInitial: String(ownerName).charAt(0).toUpperCase(),
          freelancerAvatar: project?.owner?.avatar || "",
          budgetLabel: formatCurrency(Number(proposal?.amount) || 0),
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
          actionTone: "slate",
        };
      }),
    [activeProjectCards, formatCurrency, resolveProjectProgress]
  );

  useEffect(() => {
    const maxStartIndex = Math.max(0, Math.floor((runningProjectCards.length - 1) / 3) * 3);
    if (projectCarouselIndex > maxStartIndex) {
      setProjectCarouselIndex(maxStartIndex);
    }
  }, [projectCarouselIndex, runningProjectCards.length]);

  const previewMessages = useMemo(
    () => recentChatUpdates.slice(0, 2),
    [recentChatUpdates]
  );

  const monthlyEarningsBars = useMemo(() => {
    const max = Math.max(...monthlyEarningsSeries, 1);
    return monthlyEarningsSeries.map((value) => {
      const normalized = Math.max(10, Math.round((value / max) * 100));
      return normalized;
    });
  }, [monthlyEarningsSeries]);

  return (
    <div className="min-h-screen bg-[#212121] text-[#f1f5f9]">
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

      <main className="relative z-10 flex-1 pb-10 pt-5">
        <div className="flex w-full flex-col gap-6">
          {showOnboardingAlert ? (
            <div className="relative overflow-hidden rounded-2xl border border-[#facc15]/30 bg-[#252116] px-5 py-4">
              <div className="pointer-events-none absolute -right-12 -top-16 h-36 w-36 rounded-full bg-[#facc15]/15 blur-3xl" />
              <div className="relative z-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
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

          <section className="mt-2">
            <h1 className="text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.05em] text-white">
              {greeting}, {firstName}
            </h1>
            <p className="mt-2 text-sm text-[#94a3b8]">
              Here&apos;s a summary of your freelance business.
            </p>
          </section>

          <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <article
              className="group min-h-[110px] cursor-pointer rounded-[28px] border border-transparent bg-accent p-5 transition-colors hover:border-[#facc15]/70"
              onClick={() => navigate("/freelancer/project?view=ongoing")}
              role="button"
              aria-label="Open active projects"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-[#9ca3af]">
                  <Sparkles className="size-4" />
                </div>
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#6b7280]">
                  Active Projects
                </p>
              </div>
              <p className="mt-3 text-[1.75rem] font-semibold leading-none tracking-[-0.02em] text-white transition-colors group-hover:text-[#facc15]">
                {metrics.activeProjects}
              </p>
            </article>

            <article
              className="group min-h-[110px] cursor-pointer rounded-[28px] border border-transparent bg-accent p-5 transition-colors hover:border-[#facc15]/70"
              onClick={() => navigate("/freelancer/project?view=completed")}
              role="button"
              aria-label="Open completed projects"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-[#9ca3af]">
                  <MessageSquare className="size-4" />
                </div>
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#6b7280]">
                  Completed Projects
                </p>
              </div>
              <p className="mt-3 text-[1.75rem] font-semibold leading-none tracking-[-0.02em] text-white transition-colors group-hover:text-[#facc15]">
                {metrics.completedProjects}
              </p>
            </article>

            <article
              className="group min-h-[110px] cursor-pointer rounded-[28px] border border-transparent bg-accent p-5 transition-colors hover:border-[#facc15]/70"
              onClick={() => navigate("/freelancer/proposals?tab=pending")}
              role="button"
              aria-label="Open pending proposals"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-[#9ca3af]">
                  <Clock className="size-4" />
                </div>
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#6b7280]">
                  Pending Proposals
                </p>
              </div>
              <p className="mt-3 text-[1.75rem] font-semibold leading-none tracking-[-0.02em] text-white transition-colors group-hover:text-[#facc15]">
                {metrics.pendingProposals.length}
              </p>
            </article>

            <article
              className="group min-h-[110px] cursor-pointer rounded-[28px] border border-transparent bg-accent p-5 transition-colors hover:border-[#facc15]/70"
              onClick={() => navigate("/freelancer/payments")}
              role="button"
              aria-label="Open payments"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-[#9ca3af]">
                    {showPendingPaymentsStat ? (
                      <Clock className="size-4" />
                    ) : (
                      <TrendingUp className="size-4" />
                    )}
                  </div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#6b7280]">
                    {showPendingPaymentsStat ? "Pending Payments" : "Total Earnings"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setShowPendingPaymentsStat((previous) => !previous);
                  }}
                  className="inline-flex size-8 items-center justify-center rounded-full border border-[#facc15]/45 bg-[#2b2b2b] text-[#facc15] transition-colors hover:border-[#facc15]/70 hover:bg-[#323232]"
                  aria-label={showPendingPaymentsStat ? "Show total earnings" : "Show pending payments"}
                >
                  <Repeat2 className="size-4" />
                </button>
              </div>
              <p
                className="mt-3 text-[1.75rem] font-semibold leading-none tracking-[-0.02em] text-white transition-colors group-hover:text-[#facc15]"
              >
                {showPendingPaymentsStat
                  ? formatCurrency(metrics.pendingEarnings)
                  : formatCurrency(metrics.earnings)}
              </p>
            </article>
          </section>

          <section className="mt-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-zinc-100">Active Projects</h2>
              <Button
                variant="link"
                className="h-auto p-0 text-xs font-semibold uppercase tracking-[0.14em] text-[#facc15] hover:text-[#facc15]/80"
                onClick={() => navigate("/freelancer/project?view=ongoing")}
              >
                View all
              </Button>
            </div>

            {runningProjectCards.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/[0.1] bg-background/40 p-8 text-center text-sm text-zinc-400">
                No active projects right now.
              </div>
            ) : (
              <div>
                <div className="grid min-w-0 items-start justify-items-center gap-6 md:grid-cols-2 md:justify-items-stretch xl:grid-cols-3">
                  {runningProjectCards.slice(projectCarouselIndex, projectCarouselIndex + 3).map((projectCard) => (
                    <ProjectProposalCard
                      key={projectCard.id}
                      project={projectCard}
                      className="mx-auto w-full max-w-[22.5rem] md:mx-0 md:max-w-none"
                    />
                  ))}
                </div>

                {runningProjectCards.length > 3 && (
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 w-9 rounded-full border-white/15 bg-white/[0.04] p-0 hover:bg-white/[0.08]"
                      onClick={() => setProjectCarouselIndex(Math.max(0, projectCarouselIndex - 3))}
                      disabled={projectCarouselIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-2">
                      {Array.from({ length: Math.ceil(runningProjectCards.length / 3) }).map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setProjectCarouselIndex(index * 3)}
                          className={`h-2 rounded-full transition-all ${
                            Math.floor((projectCarouselIndex) / 3) === index
                              ? "w-6 bg-[#facc15]"
                              : "w-2 bg-white/[0.2] hover:bg-white/[0.3]"
                          }`}
                        />
                      ))}
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 w-9 rounded-full border-white/15 bg-white/[0.04] p-0 hover:bg-white/[0.08]"
                      onClick={() => setProjectCarouselIndex(Math.min(runningProjectCards.length - 3, projectCarouselIndex + 3))}
                      disabled={projectCarouselIndex + 3 >= runningProjectCards.length}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="mt-12 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-5">
              <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-accent shadow-[0_8px_22px_rgba(0,0,0,0.28)]">
              <div className="px-6 py-5">
                <h2 className="text-[1.65rem] font-semibold tracking-[-0.04em] text-white">
                  Pending Proposals
                </h2>
              </div>

              {pendingProposalRows.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                  <div className="flex size-16 items-center justify-center rounded-full bg-white/[0.06] text-[#94a3b8]">
                    <ClipboardList className="size-7" />
                  </div>
                  <p className="mt-6 text-base font-medium text-white">No pending proposals</p>
                  <p className="mt-2 max-w-[320px] text-sm text-[#8f96a3]">
                    New proposal requests from clients will appear here.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/freelancer/proposals")}
                    className="mt-6 rounded-full bg-[#ffc107] px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#ffd54f]"
                  >
                    View Proposals
                  </button>
                </div>
              ) : (
                pendingProposalRows.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 border-b border-white/[0.05] px-5 py-5 last:border-b-0 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="truncate text-lg font-medium text-white">{item.title}</p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                            PENDING_PROPOSAL_TONE_STYLES[item.tagTone] || PENDING_PROPOSAL_TONE_STYLES.amber
                          }`}
                        >
                          {item.tag}
                        </span>
                      </div>
                      {item.updatedAt ? (
                        <p className="mt-2 text-sm text-[#94a3b8]">Received {item.updatedAt}</p>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-3 md:gap-4">
                      <span className="min-w-[112px] text-right text-[1.1rem] font-medium text-[#f1f5f9]">
                        {item.budget}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          const query = item.projectId ? `?projectId=${encodeURIComponent(item.projectId)}` : "";
                          navigate(`/freelancer/proposals${query}`);
                        }}
                        className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#f2f2f2]"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))
              )}
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-accent shadow-[0_8px_22px_rgba(0,0,0,0.28)]">
              <div className="flex items-center justify-between border-b border-white/[0.05] px-6 py-5">
                <h2 className="text-[1.65rem] font-semibold tracking-[-0.04em] text-white">
                  Recent Activity
                </h2>
                <button
                  type="button"
                  onClick={() => navigate("/freelancer/proposals")}
                  className="text-xs font-bold uppercase tracking-[0.18em] text-[#ffc107] transition-colors hover:text-[#ffd54f]"
                >
                  View All
                </button>
              </div>

              <div>
                {(activityItems.length > 0 ? activityItems.slice(0, 4) : []).map((item, index) => {
                  const Icon = item.icon;
                  const tone = ACTIVITY_TONE_STYLES[item.tone] || ACTIVITY_TONE_STYLES.slate;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={item.onClick}
                      className="flex w-full items-start gap-3 px-6 py-4 text-left transition-colors hover:bg-white/[0.04]"
                    >
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone.icon}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-zinc-100">{item.title}</p>
                            <p className="line-clamp-1 text-xs text-zinc-400">{item.subtitle}</p>
                          </div>
                          <span className="shrink-0 text-[11px] text-zinc-500">{item.timeLabel}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {activityItems.length === 0 ? (
                  <p className="px-6 py-4 text-sm text-zinc-400">No activity yet.</p>
                ) : null}
              </div>
              </div>
            </div>

            <div className="space-y-5">
              <article className="rounded-2xl border border-white/[0.08] bg-accent p-5 shadow-[0_8px_22px_rgba(0,0,0,0.28)]">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-100">Profile Completion</h3>
                <span className="text-sm font-bold text-[#facc15]">{profileCompletionPercent}%</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.12]">
                <div
                  className="h-full rounded-full bg-[#facc15] transition-all duration-700"
                  style={{ width: `${profileCompletionPercent}%` }}
                />
              </div>
              <Button
                className="mt-4 h-9 w-full rounded-full bg-zinc-100 text-xs font-semibold text-zinc-900 hover:bg-zinc-200"
                onClick={() => navigate("/freelancer/profile")}
              >
                {profileCompletionComplete ? "Finish Setup" : "Finish Setup"}
              </Button>
            </article>

              <article className="rounded-2xl border border-white/[0.08] bg-accent p-5 shadow-[0_8px_22px_rgba(0,0,0,0.28)]">
              <h3 className="text-sm font-semibold text-zinc-100">Messages Preview</h3>
              {previewMessages.length === 0 ? (
                <p className="mt-3 text-xs text-zinc-400">No new messages right now.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {previewMessages.map((message) => (
                    <li key={message.id || message.createdAt} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#272a31] text-[11px] font-bold text-zinc-100">
                        {String(message?.title || "M").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-zinc-100">
                          {message?.title || "New message"}
                        </p>
                        <p className="line-clamp-1 text-xs text-zinc-500">
                          {message?.message || "You have a new conversation update."}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <Button
                variant="outline"
                className="mt-4 h-8 w-full rounded-full border-white/15 bg-transparent text-xs text-zinc-200 hover:bg-white/[0.06]"
                onClick={() => navigate("/freelancer/messages")}
              >
                Go to inbox
              </Button>
              </article>

              <article className="rounded-2xl border border-white/[0.08] bg-accent p-5 shadow-[0_8px_22px_rgba(0,0,0,0.28)]">
              <h3 className="text-sm font-semibold text-zinc-100">Earnings & Payments</h3>
              <div className="mt-4 grid h-36 grid-cols-5 items-end gap-2 rounded-xl border border-white/[0.08] bg-background/30 p-3">
                {monthlyEarningsBars.slice(0, 5).map((value, index) => (
                  <div key={`bar-${index}`} className="flex h-full flex-col justify-end">
                    <div
                      className={
                        index === 4
                          ? "w-full rounded-sm bg-[#facc15]"
                          : "w-full rounded-sm bg-white/[0.08]"
                      }
                      style={{ height: `${value}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-5 text-center text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                {["Jan", "Feb", "Mar", "Apr", "May"].map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              </article>
            </div>
          </section>
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


