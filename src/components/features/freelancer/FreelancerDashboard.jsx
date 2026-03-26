import React, { useCallback, useEffect, useMemo, useState } from "react";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Gavel from "lucide-react/dist/esm/icons/gavel";
import Video from "lucide-react/dist/esm/icons/video";
import MessageSquare from "lucide-react/dist/esm/icons/message-square";
import ClipboardList from "lucide-react/dist/esm/icons/clipboard-list";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import Clock from "lucide-react/dist/esm/icons/clock";
import Repeat2 from "lucide-react/dist/esm/icons/repeat-2";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import { useNotifications } from "@/shared/context/NotificationContext";
import FreelancerWorkspaceHeader from "@/components/features/freelancer/FreelancerWorkspaceHeader";
import { getSession } from "@/shared/lib/auth-storage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

const getFirstNonEmptyText = (...values) => {
  for (const value of values.flat()) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }

  return "";
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

const FREELANCER_DASHBOARD_PANEL_CLASSNAME =
  "overflow-hidden rounded-[24px] border border-white/[0.08] bg-accent";

const freelancerDashboardCurrencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const formatFreelancerDashboardCurrency = (amount) =>
  freelancerDashboardCurrencyFormatter.format(Number(amount) || 0);

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

const FreelancerMetricCardsSkeleton = () => (
  <section className="mt-2 grid auto-rows-fr grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
    {[0, 1, 2, 3].map((item) => (
      <FreelancerDashboardPanel
        key={`freelancer-metric-skeleton-${item}`}
        className={cn("p-3.5 sm:p-5", item >= 2 && "col-span-2 xl:col-span-1")}
      >
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <FreelancerDashboardSkeletonBlock className="size-8 rounded-lg sm:size-9" />
              <FreelancerDashboardSkeletonBlock className="h-3 w-16 rounded-full sm:h-3.5 sm:w-24" />
            </div>
            <FreelancerDashboardSkeletonBlock className="size-7 rounded-lg sm:size-8" />
          </div>
          <FreelancerDashboardSkeletonBlock className="h-8 w-16 rounded-full sm:h-9 sm:w-24" />
        </div>
      </FreelancerDashboardPanel>
    ))}
  </section>
);

const FreelancerActiveProjectsSkeleton = () => (
  <section className="mt-3">
    <div className="mb-6 flex items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <FreelancerDashboardSkeletonBlock className="h-8 w-44 rounded-full" />
          <FreelancerDashboardSkeletonBlock className="size-3 rounded-full" />
        </div>
        <FreelancerDashboardSkeletonBlock className="mt-2 h-4 w-72 rounded-full" />
      </div>
      <div className="hidden sm:flex items-center gap-2">
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
  <FreelancerDashboardPanel>
    <div className="px-4 py-4 sm:px-6 sm:py-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <FreelancerDashboardSkeletonBlock className="h-8 w-48 rounded-full" />
          <FreelancerDashboardSkeletonBlock className="mt-2 h-4 w-72 rounded-full" />
        </div>
        <FreelancerDashboardSkeletonBlock className="h-4 w-16 rounded-full" />
      </div>
    </div>

    {[0, 1, 2].map((item) => (
      <div
        key={`freelancer-pending-proposal-skeleton-${item}`}
        className="border-t border-white/[0.05] px-4 py-4 sm:px-6 sm:py-5"
      >
        <div className="flex flex-col gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <FreelancerDashboardSkeletonBlock className="h-6 w-36 rounded-full" />
              <FreelancerDashboardSkeletonBlock className="h-5 w-20 rounded-full" />
            </div>
            <FreelancerDashboardSkeletonBlock className="h-4 w-24 rounded-full" />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <FreelancerDashboardSkeletonBlock className="h-6 w-28 rounded-full" />
            <FreelancerDashboardSkeletonBlock className="h-10 w-32 rounded-full" />
          </div>
        </div>
      </div>
    ))}
  </FreelancerDashboardPanel>
);

const FreelancerRecentActivitySkeleton = () => (
  <FreelancerDashboardPanel>
    <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-4 sm:px-6 sm:py-5">
      <FreelancerDashboardSkeletonBlock className="h-8 w-44 rounded-full" />
      <FreelancerDashboardSkeletonBlock className="h-4 w-16 rounded-full" />
    </div>

    {[0, 1, 2, 3].map((item) => (
      <div
        key={`freelancer-activity-skeleton-${item}`}
        className="flex items-center justify-between gap-4 border-b border-white/[0.05] px-4 py-4 last:border-b-0 sm:px-6"
      >
        <div className="flex min-w-0 items-center gap-3">
          <FreelancerDashboardSkeletonBlock className="size-8 rounded-full" />
          <div className="space-y-2">
            <FreelancerDashboardSkeletonBlock className="h-4 w-40 rounded-full" />
            <FreelancerDashboardSkeletonBlock className="h-3 w-56 rounded-full" />
          </div>
        </div>
        <FreelancerDashboardSkeletonBlock className="h-3 w-12 rounded-full" />
      </div>
    ))}
  </FreelancerDashboardPanel>
);

const FreelancerProfileCompletionSkeleton = () => (
  <FreelancerDashboardPanel className="h-fit self-start p-4 sm:p-5">
    <div className="flex items-start justify-between gap-3">
      <div>
        <FreelancerDashboardSkeletonBlock className="h-5 w-36 rounded-full" />
        <FreelancerDashboardSkeletonBlock className="mt-2 h-4 w-44 rounded-full" />
      </div>
      <FreelancerDashboardSkeletonBlock className="h-5 w-12 rounded-full" />
    </div>
    <FreelancerDashboardSkeletonBlock className="mt-4 h-2 w-full rounded-full" />
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
      <FreelancerDashboardSkeletonBlock className="h-4 w-20 rounded-full" />
      <FreelancerDashboardSkeletonBlock className="h-4 w-24 rounded-full" />
      <FreelancerDashboardSkeletonBlock className="h-4 w-16 rounded-full" />
    </div>
    <FreelancerDashboardSkeletonBlock className="mt-5 h-10 w-full rounded-full" />
  </FreelancerDashboardPanel>
);

const FreelancerChatsSkeleton = () => (
  <FreelancerDashboardPanel className="h-fit self-start p-4 sm:p-5">
    <FreelancerDashboardSkeletonBlock className="h-8 w-52 rounded-full" />
    <FreelancerDashboardSkeletonBlock className="mt-3 h-4 w-56 rounded-full" />
    <FreelancerDashboardSkeletonBlock className="mt-2 h-4 w-40 rounded-full" />
    <div className="mt-6 space-y-4 sm:mt-8">
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
);

const FreelancerEarningsSkeleton = () => (
  <section className="mt-5">
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
}) => (
  <article
    className={`group flex min-h-[96px] flex-col rounded-[24px] border border-transparent bg-accent p-3.5 transition-colors hover:border-[#facc15]/70 sm:min-h-[110px] sm:p-5 ${onClick ? "cursor-pointer" : ""} ${className}`.trim()}
    onClick={onClick}
    role={onClick ? "button" : undefined}
    aria-label={ariaLabel}
  >
    <div className="flex h-full flex-col gap-2.5 sm:gap-3">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex min-w-0 items-start gap-2 sm:items-center sm:gap-3">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-[#9ca3af] sm:size-9">
            <Icon className="size-3.5 sm:size-4" />
          </div>
          <p className="line-clamp-2 text-[10px] font-medium uppercase leading-4 tracking-[0.1em] text-[#6b7280] sm:text-[11px] sm:tracking-[0.12em]">
            {title}
          </p>
        </div>
        {control}
      </div>
      <div className="mt-auto flex min-w-0 items-end gap-1.5 sm:gap-2">
        <p className="shrink-0 text-[1.35rem] font-semibold leading-none tracking-[-0.02em] text-white transition-colors group-hover:text-[#facc15] sm:text-[1.75rem]">
          {value}
        </p>
        {detail ? (
          <p className="min-w-0 truncate text-[11px] leading-4 text-[#6b7280] sm:text-xs">{detail}</p>
        ) : null}
      </div>
    </div>
  </article>
);

const FreelancerProjectCarouselControls = ({
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
      aria-label="Show previous active freelancer projects"
      className="inline-flex size-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-[#94a3b8] transition-colors hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
    >
      <ChevronLeft className="size-4" />
    </button>

    <button
      type="button"
      onClick={onNext}
      disabled={!canGoNext}
      aria-label="Show next active freelancer projects"
      className="inline-flex size-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-[#94a3b8] transition-colors hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
    >
      <ChevronRight className="size-4" />
    </button>
  </div>
);

const FreelancerProjectRedirectCard = ({ item, className }) => (
  <FreelancerDashboardPanel
    className={cn(
      "flex flex-col overflow-hidden p-4 sm:p-5 xl:p-6",
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
  </FreelancerDashboardPanel>
);

export const DashboardContent = ({ _roleOverride }) => {
  const [sessionUser, setSessionUser] = useState(null);
  const { authFetch, user } = useAuth();
  const [metrics, setMetrics] = useState(INITIAL_FREELANCER_DASHBOARD_METRICS);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [upcomingMeeting, setUpcomingMeeting] = useState(null);
  const [showSuspensionAlert, setShowSuspensionAlert] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [showPendingPaymentsStat, setShowPendingPaymentsStat] = useState(false);
  const [projectCarouselApi, setProjectCarouselApi] = useState(null);
  const [canGoToPreviousProjects, setCanGoToPreviousProjects] = useState(false);
  const [canGoToNextProjects, setCanGoToNextProjects] = useState(false);
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
  const showProfileCompletionSkeleton = metricsLoading || profileCompletion.isLoading;
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
  const dashboardDateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      }).format(new Date()),
    [],
  );
  const profileCompletionHighlights = useMemo(
    () => (Array.isArray(profileCompletion.missingDetails) ? profileCompletion.missingDetails.slice(0, 2) : []),
    [profileCompletion.missingDetails],
  );

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
          budget: formatFreelancerDashboardCurrency(Number(proposal?.amount) || 0),
          projectId: proposal?.project?.id,
        };
      }),
    [metrics.pendingProposals]
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
          budgetLabel: formatFreelancerDashboardCurrency(Number(proposal?.amount) || 0),
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
  const shouldUseProjectCarousel = runningProjectCards.length > 3;
  const activeProjectCardClassName = "h-full w-full";
  const activeProjectRedirectCardClassName = "w-full md:min-h-[506px]";
  const freelancerProjectRedirectCards = useMemo(() => {
    if (runningProjectCards.length === 0 || shouldUseProjectCarousel) {
      return [];
    }

    const candidates = [
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

    return candidates.slice(0, Math.max(0, 3 - runningProjectCards.length));
  }, [navigate, runningProjectCards.length, shouldUseProjectCarousel]);

  useEffect(() => {
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

  const pendingPayoutRows = useMemo(() => {
    return metrics.acceptedProposals
      .filter((proposal) => !isProposalCompletedForDashboard(proposal))
      .slice(0, 4)
      .map((proposal, index) => {
        const project = proposal?.project || {};
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
        };
      });
  }, [metrics.acceptedProposals, resolveProjectProgress]);

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
            <div className="min-w-0">
              <h1 className="text-[clamp(2rem,4vw,3rem)] font-semibold leading-[0.96] tracking-[-0.05em] text-white">
                {greeting}, {firstName}
              </h1>
              <p className="mt-1 text-sm text-[#94a3b8]">
                Here&apos;s a summary of your freelance business.
              </p>
            </div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#64748b]">
              {dashboardDateLabel}
            </p>
          </section>

          {metricsLoading ? (
            <FreelancerMetricCardsSkeleton />
          ) : (
            <section className="mt-2 grid auto-rows-fr grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
              <FreelancerMetricCard
                icon={Sparkles}
                title="Active Projects"
                value={metrics.activeProjects}
                onClick={() => navigate("/freelancer/project?view=ongoing")}
                aria-label="Open active projects"
              />
              <FreelancerMetricCard
                icon={MessageSquare}
                title="Completed Projects"
                value={metrics.completedProjects}
                onClick={() => navigate("/freelancer/project?view=completed")}
                aria-label="Open completed projects"
              />
              <FreelancerMetricCard
                icon={Clock}
                title="Pending Proposals"
                value={metrics.pendingProposals.length}
                onClick={() => navigate("/freelancer/proposals?tab=pending")}
                aria-label="Open pending proposals"
                className="col-span-2 xl:col-span-1"
              />
              <FreelancerMetricCard
                icon={showPendingPaymentsStat ? Clock : TrendingUp}
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
                    className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-[#9ca3af] transition-colors hover:bg-white/[0.12] hover:text-[#facc15] sm:size-8"
                    aria-label={showPendingPaymentsStat ? "Show total earnings" : "Show pending payments"}
                  >
                    <Repeat2 className="size-3.5 sm:size-4" />
                  </button>
                }
              />
            </section>
          )}

          {metricsLoading ? (
            <FreelancerActiveProjectsSkeleton />
          ) : (
          <section className="mt-3">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-[1.75rem] font-semibold tracking-[-0.02em] text-white">
                    Active Projects
                  </h2>
                  <span className="size-[15px] rounded-full bg-[#10b981]/10 p-[4.5px]">
                    <span className="block size-[6px] rounded-full bg-[#10b981]" />
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#94a3b8]">
                  Stay on top of your current deliveries, timelines, and client workspaces.
                </p>
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
              <FreelancerDashboardPanel className="flex min-h-[220px] items-center justify-center p-8 text-center">
                <div>
                  <p className="text-base font-medium text-white">No active projects right now.</p>
                  <p className="mt-2 max-w-[360px] text-sm text-[#8f96a3]">
                    Accepted projects will appear here once a client approves your proposal.
                  </p>
                </div>
              </FreelancerDashboardPanel>
            ) : shouldUseProjectCarousel ? (
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
                <CarouselContent className="items-stretch [backface-visibility:hidden] [will-change:transform]">
                  {runningProjectCards.map((projectCard) => (
                    <CarouselItem
                      key={projectCard.id}
                      className="basis-full md:basis-1/2 xl:basis-1/3"
                    >
                      <ProjectProposalCard
                        project={projectCard}
                        className={activeProjectCardClassName}
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            ) : (
              <div className="grid items-start gap-5 sm:gap-6 xl:gap-7 md:grid-cols-2 xl:grid-cols-3">
                  {runningProjectCards.map((projectCard) => (
                    <ProjectProposalCard
                      key={projectCard.id}
                      project={projectCard}
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

          <section className="mt-4 grid items-start grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-5">
              {metricsLoading ? (
                <FreelancerPendingProposalsSkeleton />
              ) : (
              <FreelancerDashboardPanel>
              <div className="px-4 py-4 sm:px-6 sm:py-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-white sm:text-[1.65rem]">
                      Pending Proposals
                    </h2>
                    <p className="mt-1 text-sm text-[#94a3b8]">
                      Review recent opportunities that still need a client decision.
                    </p>
                  </div>
                  <Button
                    variant="link"
                    className="h-auto justify-start p-0 text-xs font-semibold uppercase tracking-[0.14em] text-[#ffc107] hover:text-[#ffd54f] sm:justify-end"
                    onClick={() => navigate("/freelancer/proposals")}
                  >
                    View All
                  </Button>
                </div>
              </div>

              {pendingProposalRows.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-5 py-10 text-center sm:px-6 sm:py-12">
                  <div className="flex size-14 items-center justify-center rounded-full bg-white/[0.06] text-[#94a3b8] sm:size-16">
                    <ClipboardList className="size-6 sm:size-7" />
                  </div>
                  <p className="mt-5 text-base font-medium text-white">No pending proposals</p>
                  <p className="mt-2 max-w-[320px] text-sm text-[#8f96a3]">
                    New proposal requests from clients will appear here.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/freelancer/proposals")}
                    className="mt-6 inline-flex min-w-[200px] items-center justify-center rounded-full bg-[#ffc107] px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#ffd54f] sm:min-w-0"
                  >
                    View Proposals
                  </button>
                </div>
              ) : (
                pendingProposalRows.map((item) => (
                  <div
                    key={item.id}
                    className="border-t border-white/[0.05] px-4 py-4 first:border-t-0 sm:px-6 sm:py-5"
                  >
                    <div className="flex flex-col gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <p className="min-w-0 truncate text-[1.05rem] font-semibold text-white">{item.title}</p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                            PENDING_PROPOSAL_TONE_STYLES[item.tagTone] || PENDING_PROPOSAL_TONE_STYLES.amber
                          }`}
                        >
                          {item.tag}
                        </span>
                      </div>
                      {item.updatedAt ? (
                        <p className="mt-1.5 text-sm text-[#94a3b8]">Received {item.updatedAt}</p>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-base font-medium text-[#f1f5f9] sm:text-[1.1rem]">
                        {item.budget}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          const query = item.projectId ? `?projectId=${encodeURIComponent(item.projectId)}` : "";
                          navigate(`/freelancer/proposals${query}`);
                        }}
                        className="inline-flex min-w-[144px] items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#f2f2f2] sm:min-w-0"
                      >
                        View Details
                      </button>
                    </div>
                    </div>
                  </div>
                ))
              )}
              </FreelancerDashboardPanel>
              )}

              {metricsLoading ? (
                <FreelancerRecentActivitySkeleton />
              ) : (
              <FreelancerDashboardPanel>
              <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-4 sm:px-6 sm:py-5">
                <h2 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-white sm:text-[1.65rem]">
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
                {(activityItems.length > 0 ? activityItems.slice(0, 4) : []).map((item) => {
                  const Icon = item.icon;
                  const tone = ACTIVITY_TONE_STYLES[item.tone] || ACTIVITY_TONE_STYLES.slate;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={item.onClick}
                      className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-white/[0.04] sm:px-6"
                    >
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone.icon}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-semibold text-zinc-100">{item.title}</p>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tone.badge}`}>
                                {item.badge}
                              </span>
                            </div>
                            <p className="mt-1 text-xs leading-5 text-zinc-400 sm:line-clamp-1">{item.subtitle}</p>
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
              </FreelancerDashboardPanel>
              )}
            </div>

            <div className="grid content-start items-start gap-5 self-start md:grid-cols-2 xl:grid-cols-1">
              {showProfileCompletionSkeleton ? (
                <FreelancerProfileCompletionSkeleton />
              ) : (
              <FreelancerDashboardPanel className="h-fit self-start p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">Profile Completion</h3>
                  <p className="mt-1 text-sm leading-6 text-[#94a3b8]">
                    {profileCompletion.message}
                  </p>
                </div>
                <span className="text-sm font-bold text-[#facc15]">{profileCompletionPercent}%</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.12]">
                <div
                  className="h-full rounded-full bg-[#facc15] transition-all duration-700"
                  style={{ width: `${profileCompletionPercent}%` }}
                />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#94a3b8]">
                <p>
                  <span className="font-semibold text-white">{profileCompletion.completedSections}</span>{" "}
                  complete
                </p>
                <p>
                  <span className="font-semibold text-white">{profileCompletion.partialSections}</span>{" "}
                  in progress
                </p>
                <p>
                  <span className="font-semibold text-white">{profileCompletion.totalSections}</span>{" "}
                  total
                </p>
              </div>
              {profileCompletionHighlights.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {profileCompletionHighlights.map((item) => (
                    <li key={item} className="text-sm leading-6 text-[#94a3b8]">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
              <Button
                className="mt-4 h-10 w-full rounded-full bg-zinc-100 text-xs font-semibold text-zinc-900 hover:bg-zinc-200"
                onClick={() => navigate("/freelancer/profile")}
              >
                {profileCompletionComplete ? "Open Profile" : "Finish Setup"}
              </Button>
            </FreelancerDashboardPanel>
              )}

              {metricsLoading ? (
                <FreelancerChatsSkeleton />
              ) : (
              <FreelancerDashboardPanel className="h-fit self-start p-4 sm:p-5">
              <h3 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-white sm:text-[1.6rem]">
                Active Project Chats
              </h3>
              <p className="mt-2 text-[14px] leading-5 text-[#8f8f8f]">
                Quick shortcuts to message clients on active projects.
              </p>
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
                <ul className="mt-6 space-y-4 sm:mt-8 sm:space-y-5">
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
                            <span className="shrink-0 text-[11px] text-zinc-500">
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
              )}
            </div>
          </section>

          {metricsLoading ? (
            <FreelancerEarningsSkeleton />
          ) : (
          <section className="mt-5">
            <FreelancerDashboardPanel className="overflow-hidden p-0">
              <div className="border-b border-white/[0.05] px-4 py-5 sm:px-6 lg:px-7">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-white sm:text-[1.65rem]">
                        Earnings & Payments
                      </h2>
                      <Badge
                        variant="outline"
                        className="border-white/[0.08] bg-white/[0.04] text-[#facc15]"
                      >
                        Live snapshot
                      </Badge>
                    </div>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-[#94a3b8]">
                      Track what you&apos;ve already earned, what is still pending, and which active
                      projects are likely to convert into your next payouts.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      variant="outline"
                      className="h-10 rounded-full border-white/15 bg-transparent px-5 text-xs font-semibold text-zinc-100 hover:bg-white/[0.06]"
                      onClick={() => navigate("/freelancer/project?view=ongoing")}
                    >
                      View active projects
                    </Button>
                    <Button
                      className="h-10 rounded-full bg-[#facc15] px-5 text-xs font-semibold text-black hover:bg-[#ffd54f]"
                      onClick={() => navigate("/freelancer/payments")}
                    >
                      Open payments
                    </Button>
                  </div>
                </div>
              </div>

              <div className="px-4 py-5 sm:px-6 lg:px-7">
                <Tabs defaultValue="overview" className="gap-4">
                  <TabsList className="h-auto w-full justify-start gap-2 overflow-x-auto rounded-[16px] bg-white/[0.04] p-1 text-white">
                    <TabsTrigger
                      value="overview"
                      className="rounded-[12px] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] data-[state=active]:bg-[#facc15] data-[state=active]:text-black"
                    >
                      Overview
                    </TabsTrigger>
                    <TabsTrigger
                      value="schedule"
                      className="rounded-[12px] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] data-[state=active]:bg-[#facc15] data-[state=active]:text-black"
                    >
                      Schedule
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <Card className="border-white/[0.08] bg-background/30 shadow-none">
                        <CardContent className="p-4 sm:p-5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b7280]">
                            Received
                          </p>
                          <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
                            {formatFreelancerDashboardCurrency(metrics.receivedEarnings)}
                          </p>
                          <p className="mt-2 text-sm text-[#94a3b8]">Cleared freelancer earnings</p>
                        </CardContent>
                      </Card>

                      <Card className="border-white/[0.08] bg-background/30 shadow-none">
                        <CardContent className="p-4 sm:p-5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b7280]">
                            Pending
                          </p>
                          <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
                            {formatFreelancerDashboardCurrency(metrics.pendingEarnings)}
                          </p>
                          <p className="mt-2 text-sm text-[#94a3b8]">Expected from active projects</p>
                        </CardContent>
                      </Card>

                      <Card className="border-white/[0.08] bg-background/30 shadow-none">
                        <CardContent className="p-4 sm:p-5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b7280]">
                            Collection Rate
                          </p>
                          <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
                            {paymentCollectionPercent}%
                          </p>
                          <Progress
                            value={paymentCollectionPercent}
                            className="mt-3 h-2 bg-white/[0.08] [&>div]:bg-[#facc15]"
                          />
                        </CardContent>
                      </Card>

                      <Card className="border-white/[0.08] bg-background/30 shadow-none">
                        <CardContent className="p-4 sm:p-5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b7280]">
                            Avg Project Share
                          </p>
                          <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
                            {formatFreelancerDashboardCurrency(averageProjectShare)}
                          </p>
                          <p className="mt-2 text-sm text-[#94a3b8]">
                            Based on accepted project earnings
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,1fr)]">
                      <Card className="border-white/[0.08] bg-background/30 shadow-none">
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="text-base font-semibold text-white">Cashflow snapshot</h3>
                              <p className="mt-1 text-sm text-[#94a3b8]">{paymentHealthLabel}</p>
                            </div>
                            <Badge
                              variant="outline"
                              className="border-white/[0.08] bg-white/[0.04] text-zinc-200"
                            >
                              Last 6 months
                            </Badge>
                          </div>

                          <Separator className="my-4 bg-white/[0.06]" />

                          <div className="grid h-44 grid-cols-6 items-end gap-2 sm:h-52 sm:gap-3">
                            {earningsTrendData.map((item) => (
                              <div key={item.label} className="flex h-full min-w-0 flex-col justify-end gap-3">
                                <div className="flex min-h-0 flex-1 items-end">
                                  <div
                                    className={cn(
                                      "w-full rounded-[10px] bg-white/[0.08] transition-all",
                                      item.isCurrent && "bg-[#facc15]",
                                    )}
                                    style={{ height: `${item.height}%` }}
                                  />
                                </div>
                                <div className="space-y-1 text-center">
                                  <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                                    {item.label}
                                  </p>
                                  <p
                                    className={cn(
                                      "truncate text-[11px] text-[#94a3b8]",
                                      item.isCurrent && "font-semibold text-[#facc15]",
                                    )}
                                  >
                                    {formatFreelancerDashboardCurrency(item.value)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-white/[0.08] bg-background/30 shadow-none">
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="text-base font-semibold text-white">At a glance</h3>
                              <p className="mt-1 text-sm text-[#94a3b8]">
                                Quick signals from your live payout pipeline.
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className="border-white/[0.08] bg-white/[0.04] text-[#facc15]"
                            >
                              {pendingPayoutRows.length} pending
                            </Badge>
                          </div>

                          <div className="mt-4 space-y-3">
                            {paymentActionItems.map((item) => (
                              <div
                                key={item}
                                className="rounded-[16px] border border-white/[0.08] bg-white/[0.03] px-3.5 py-3 text-sm text-[#d4d4d8]"
                              >
                                {item}
                              </div>
                            ))}
                          </div>

                          <Separator className="my-4 bg-white/[0.06]" />

                          {pendingPayoutRows.length === 0 ? (
                            <div className="rounded-[18px] border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-5 text-sm text-[#94a3b8]">
                              No pending payouts right now. New cleared milestones will appear here.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {pendingPayoutRows.slice(0, 2).map((item) => (
                                <div
                                  key={item.id}
                                  className="rounded-[18px] border border-white/[0.08] bg-white/[0.03] px-4 py-3.5"
                                >
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                                        <Badge
                                          variant="outline"
                                          className="border-[#5a3b0d] bg-[#2f1e05] text-[#fbbf24]"
                                        >
                                          {item.statusLabel}
                                        </Badge>
                                      </div>
                                      <p className="mt-1 text-sm text-[#94a3b8]">{item.clientLabel}</p>
                                    </div>
                                    <div className="shrink-0">
                                      <p className="text-sm font-semibold text-white sm:text-right">{item.amount}</p>
                                      <p className="mt-1 text-xs text-zinc-500 sm:text-right">{item.timeLabel}</p>
                                    </div>
                                  </div>
                                  <Progress
                                    value={item.progress}
                                    className="mt-3 h-2 bg-white/[0.08] [&>div]:bg-[#facc15]"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="schedule" className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <Card className="border-white/[0.08] bg-background/30 shadow-none">
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="text-base font-semibold text-white">Upcoming payouts</h3>
                              <p className="mt-1 text-sm text-[#94a3b8]">
                                Projects that are still moving toward their next payment.
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className="border-white/[0.08] bg-white/[0.04] text-[#facc15]"
                            >
                              {pendingPayoutRows.length}
                            </Badge>
                          </div>

                          <div className="mt-4 space-y-3">
                            {pendingPayoutRows.length === 0 ? (
                              <div className="rounded-[18px] border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-5 text-sm text-[#94a3b8]">
                                No pending payout milestones yet.
                              </div>
                            ) : (
                              pendingPayoutRows.map((item) => (
                                <div
                                  key={item.id}
                                  className="rounded-[18px] border border-white/[0.08] bg-white/[0.03] px-4 py-3.5"
                                >
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                                        <Badge
                                          variant="outline"
                                          className="border-[#5a3b0d] bg-[#2f1e05] text-[#fbbf24]"
                                        >
                                          {item.statusLabel}
                                        </Badge>
                                      </div>
                                      <p className="mt-1 text-sm text-[#94a3b8]">{item.clientLabel}</p>
                                    </div>
                                    <div className="shrink-0">
                                      <p className="text-sm font-semibold text-white sm:text-right">{item.amount}</p>
                                      <p className="mt-1 text-xs text-zinc-500 sm:text-right">{item.timeLabel}</p>
                                    </div>
                                  </div>
                                  <Progress
                                    value={item.progress}
                                    className="mt-3 h-2 bg-white/[0.08] [&>div]:bg-[#facc15]"
                                  />
                                </div>
                              ))
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-white/[0.08] bg-background/30 shadow-none">
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="text-base font-semibold text-white">Recently received</h3>
                              <p className="mt-1 text-sm text-[#94a3b8]">
                                A quick log of projects that have already cleared payout.
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className="border-white/[0.08] bg-white/[0.04] text-emerald-300"
                            >
                              {receivedPayoutRows.length}
                            </Badge>
                          </div>

                          <div className="mt-4 space-y-3">
                            {receivedPayoutRows.length === 0 ? (
                              <div className="rounded-[18px] border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-5 text-sm text-[#94a3b8]">
                                Received payouts will show up here after project completion.
                              </div>
                            ) : (
                              receivedPayoutRows.map((item) => (
                                <div
                                  key={item.id}
                                  className="rounded-[18px] border border-white/[0.08] bg-white/[0.03] px-4 py-3.5"
                                >
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                                        <Badge
                                          variant="outline"
                                          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                        >
                                          {item.statusLabel}
                                        </Badge>
                                      </div>
                                      <p className="mt-1 text-sm text-[#94a3b8]">{item.clientLabel}</p>
                                    </div>
                                    <div className="shrink-0">
                                      <p className="text-sm font-semibold text-white sm:text-right">{item.amount}</p>
                                      <p className="mt-1 text-xs text-zinc-500 sm:text-right">{item.timeLabel}</p>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
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


