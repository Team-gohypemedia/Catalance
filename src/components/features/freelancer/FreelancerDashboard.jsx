import React, { useCallback, useEffect, useMemo, useState } from "react";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Gavel from "lucide-react/dist/esm/icons/gavel";
import Video from "lucide-react/dist/esm/icons/video";
import MessageSquare from "lucide-react/dist/esm/icons/message-square";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import Clock from "lucide-react/dist/esm/icons/clock";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import { RoleAwareSidebar } from "@/components/layout/RoleAwareSidebar";
import { useNotifications } from "@/shared/context/NotificationContext";
import { DashboardHeader } from "@/components/layout/GlobalDashboardHeader";
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
import { Badge } from "@/components/ui/badge";
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

        let totalReceived = 0;
        let totalPending = 0;

        accepted.forEach((p) => {
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
          accepted.map((p) => ({
            id: p.id,
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
          activeProjects: accepted.length,
          proposalsReceived: pending.length,
          acceptedProposals: accepted,
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

  return (
    <div className="flex-1 flex flex-col relative h-full overflow-hidden bg-background transition-colors duration-300">

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

      <DashboardHeader
        userName={sessionUser?.fullName}
        tabLabel="Dashboard"
        notifications={notifications}
        unreadCount={unreadCount}
        markAllAsRead={markAllAsRead}
        handleNotificationClick={handleNotificationClick}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 z-10 relative scroll-smooth">
        <div className="max-w-400 mx-auto">
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Left Column (Stats + Pipeline + Table) */}
            <div className="flex-1 min-w-0 flex flex-col gap-10">
              {/* Page Title Wrapper - Removed */}

              {showOnboardingAlert ? (
                <div className="bg-card/40 border-l-4 border-l-yellow-500 border-border rounded-xl p-5 flex flex-col sm:flex-row items-center gap-5 relative overflow-hidden group transition-all duration-300 hover:bg-card/60">
                  <div className="flex-1 text-center sm:text-left">
                    <h4 className="text-base font-bold text-foreground mb-1 flex items-center justify-center sm:justify-start gap-2">
                      <Sparkles className="h-4 w-4 text-yellow-500" />
                      Complete your onboarding to start getting projects
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Add your profile details and services so clients can
                      discover and hire you.
                    </p>
                  </div>

                  <Button
                    size="sm"
                    className="w-full sm:w-auto font-bold bg-yellow-500 text-black hover:bg-yellow-600 transition-all rounded-xl px-6"
                    onClick={() => navigate("/freelancer/onboarding")}
                  >
                    Start Onboarding
                  </Button>
                </div>
              ) : null}

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Total Earnings */}
                <div className="bg-card p-8 rounded-xl border border-border shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-primary/40 transition-all relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-110"></div>
                  <div className="relative z-10">
                    <p className="text-muted-foreground text-xs font-bold mb-2 uppercase tracking-widest">
                      Total Amount
                    </p>
                    <h3 className="text-4xl font-black tracking-tight text-foreground">
                      {formatCurrency(metrics.earnings)}
                    </h3>
                    <p className="text-sm text-green-500 mt-3 flex items-center font-bold">
                      <TrendingUp className="h-4 w-4 mr-1.5" /> Estimated (70%
                      share)
                    </p>
                  </div>
                </div>

                {/* Active Projects */}
                <div className="bg-card p-8 rounded-xl border border-border shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-blue-500/40 transition-all relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-110"></div>
                  <div className="relative z-10">
                    <p className="text-muted-foreground text-xs font-bold mb-2 uppercase tracking-widest">
                      Active Projects
                    </p>
                    <h3 className="text-4xl font-black tracking-tight text-foreground">
                      {metrics.activeProjects}
                    </h3>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{
                            width: `${Math.min(
                              (metrics.activeProjects / 5) * 100,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-blue-500">
                        Utilization
                      </span>
                    </div>
                  </div>
                </div>

                {/* Proposals Sent */}
                <div className="bg-card p-8 rounded-xl border border-border shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-purple-500/40 transition-all relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-110"></div>
                  <div className="relative z-10">
                    <p className="text-muted-foreground text-xs font-bold mb-2 uppercase tracking-widest">
                      Pending Proposals
                    </p>
                    <h3 className="text-4xl font-black tracking-tight text-foreground">
                      {metrics.proposalsReceived}
                    </h3>
                    <p className="text-sm text-purple-500 mt-3 flex items-center font-bold">
                      <Clock className="h-4 w-4 mr-1.5" /> Awaiting client
                      response
                    </p>
                  </div>
                </div>
              </div>

              {/* Activity Feed */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Activity</h3>
                    <p className="text-sm text-muted-foreground">
                      Proposal decisions, project starts, meetings, and milestone
                      updates appear here.
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="w-fit border border-border/70 bg-secondary/40 text-foreground"
                  >
                    {unreadActivityCount > 0
                      ? `${unreadActivityCount} new`
                      : "Live feed"}
                  </Badge>
                </div>

                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
                  {activityItems.map((item, index) => {
                    const Icon = item.icon;
                    const tone =
                      ACTIVITY_TONE_STYLES[item.tone] || ACTIVITY_TONE_STYLES.slate;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={item.onClick}
                        className={`flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-secondary/20 ${
                          index < activityItems.length - 1 ? "border-b border-border/70" : ""
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone.icon}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-foreground">
                                  {item.title}
                                </p>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] ${tone.badge}`}
                                >
                                  {item.badge}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {item.subtitle}
                              </p>
                            </div>

                            <span className="shrink-0 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                              {item.timeLabel}
                            </span>
                          </div>
                        </div>

                        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Projects Table */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground">
                    Active Jobs Overview
                  </h3>
                  <Button
                    variant="link"
                    className="text-primary hover:text-primary/80 h-auto p-0 font-semibold"
                    onClick={() => navigate("/freelancer/project?view=ongoing")}
                  >
                    View All <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>

                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-secondary/40 border-b border-border">
                        <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          Project Name
                        </th>
                        <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          Status
                        </th>
                        <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          Client
                        </th>
                        <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          Budget
                        </th>
                        <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {metrics.acceptedProposals.length === 0 ? (
                        <tr>
                          <td
                            colSpan="5"
                            className="px-6 py-8 text-center text-muted-foreground text-sm"
                          >
                            No active jobs yet.
                          </td>
                        </tr>
                      ) : (
                        metrics.acceptedProposals.map((proposal) => (
                          <tr
                            key={proposal.id}
                            className="group hover:bg-secondary/30 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="font-bold text-foreground">
                                {proposal.project?.title || "Untitled Project"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(
                                  proposal.project?.createdAt || Date.now()
                                ).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/50">
                                Active
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold border border-border">
                                  {(
                                    proposal.project?.owner?.fullName || "C"
                                  ).charAt(0)}
                                </div>
                                <span className="text-sm font-medium">
                                  {proposal.project?.owner?.fullName ||
                                    "Client"}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-foreground">
                                {formatCurrency(proposal.amount * 0.7)}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                onClick={() =>
                                  navigate(
                                    `/freelancer/project/${proposal.project?.id}`
                                  )
                                }
                              >
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Sidebar - Widgets (Merged) */}
            <div className="w-full lg:w-80 shrink-0 flex flex-col gap-6">
              {/* Dynamic Upcoming Meeting Widget (Moved to TOP for visibility) */}
              {/* Dynamic Upcoming Meeting Widget (Moved to TOP for visibility) */}
              {(() => {
                // If no upcoming meeting, hide the widget
                if (!upcomingMeeting) return null;

                const meetingDate = new Date(upcomingMeeting.date);
                const isToday =
                  new Date().toDateString() === meetingDate.toDateString();
                const dateDisplay = isToday
                  ? "Today"
                  : meetingDate.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  });
                const timeDisplay = `${upcomingMeeting.startHour}:00 - ${upcomingMeeting.endHour}:00`;

                return (
                  <div className="bg-card rounded-xl border border-border p-8 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col items-center justify-center shrink-0 min-w-60 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -mr-6 -mt-6"></div>
                    <h3 className="font-bold text-lg text-foreground mb-2 flex items-center gap-2 relative z-10">
                      <Video className="h-5 w-5 text-primary" />
                      Upcoming Meeting
                    </h3>
                    <div className="relative z-10 mb-4">
                      <p className="text-sm font-bold text-foreground">
                        {upcomingMeeting.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dateDisplay} • {timeDisplay}
                      </p>
                      {upcomingMeeting.manager && (
                        <p className="text-xs text-muted-foreground mt-1">
                          with {upcomingMeeting.manager.fullName}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 relative z-10">
                      <Button
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-lg shadow-primary/20 text-xs sm:text-sm"
                        onClick={() =>
                          window.open(
                            upcomingMeeting.meetingLink ||
                            "https://meet.google.com/",
                            "_blank"
                          )
                        }
                        disabled={
                          !upcomingMeeting.meetingLink &&
                          !upcomingMeeting.meetingLink?.startsWith("http")
                        }
                      >
                        Join Meeting
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 font-bold text-xs sm:text-sm"
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                );
              })()}

              {/* Pending Proposals Widget */}
              <div className="bg-card rounded-xl border border-border p-8 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold text-lg text-foreground">
                    Profile Completion
                  </h3>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      profileCompletionComplete
                        ? "bg-green-500/20 text-green-400"
                        : "bg-primary/15 text-primary"
                    }`}
                  >
                    {profileCompletionPercent}%
                  </span>
                </div>

                <div className="mt-4 h-2 rounded-full bg-secondary/80 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      profileCompletionComplete ? "bg-green-500" : "bg-primary"
                    }`}
                    style={{ width: `${profileCompletionPercent}%` }}
                  />
                </div>

                <p className="mt-3 text-sm text-muted-foreground">
                  {profileCompletion.message}
                </p>

                <p className="mt-2 text-xs text-muted-foreground">
                  {profileCompletion.completedSections}/{profileCompletion.totalSections} sections completed
                  {profileCompletion.partialSections > 0
                    ? ` | ${profileCompletion.partialSections} in progress`
                    : ""}
                </p>

                {!profileCompletion.isLoading && profileCompletion.missingDetails.length > 0 ? (
                  <ul className="mt-3 space-y-1.5">
                    {profileCompletion.missingDetails.slice(0, 2).map((item, index) => (
                      <li key={`${item}-${index}`} className="text-xs text-muted-foreground">
                        • {item}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <Button
                  className="mt-4 w-full font-bold"
                  onClick={() => navigate("/freelancer/profile")}
                >
                  {profileCompletionComplete ? "View Profile" : "Complete Profile"}
                </Button>
              </div>

              {/* Pending Proposals Widget */}
              <div className="bg-primary/5 dark:bg-card rounded-xl p-8 border border-primary/10 dark:border-border shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] relative overflow-hidden">
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-foreground relative z-10">
                  <Gavel className="text-primary h-5 w-5" /> Pending Proposals
                  <Badge className="bg-primary text-black hover:bg-primary/90 ml-auto font-bold">
                    {metrics.proposalsReceived}
                  </Badge>
                </h3>

                <div className="flex flex-col gap-3 relative z-10">
                  {metrics.pendingProposals.length === 0 ? (
                    <div className="text-sm text-muted-foreground italic">
                      No pending proposals.
                    </div>
                  ) : (
                    metrics.pendingProposals.slice(0, 3).map((p) => (
                      <div
                        key={p.id}
                        className="bg-background/80 backdrop-blur-sm p-4 rounded-xl border border-border hover:border-primary/30 transition-all"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="text-sm font-bold text-foreground truncate">
                              {p.project?.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Client: {p.project?.owner?.fullName}
                            </p>
                          </div>
                          <span className="text-xs font-bold text-foreground whitespace-nowrap">
                            {formatCurrency(p.amount * 0.7)}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs h-7 font-bold"
                            onClick={() => navigate("/freelancer/proposals")}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Earnings Goal / Payment Status Widget */}
              <div className="bg-card rounded-xl border border-border p-8 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
                <h3 className="font-bold text-lg text-foreground mb-6">
                  Earnings Goal
                </h3>
                <div className="flex items-center gap-6">
                  {/* Circular Progress */}
                  <div className="relative w-28 h-28 shrink-0">
                    <svg
                      className="w-full h-full transform -rotate-90"
                      viewBox="0 0 100 100"
                    >
                      {/* Track */}
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        className="text-secondary dark:text-zinc-800"
                      />
                      {/* Progress */}
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={263.89}
                        strokeDashoffset={
                          263.89 -
                          263.89 *
                          (metrics.earnings > 0
                            ? metrics.receivedEarnings / metrics.earnings
                            : 0)
                        }
                        className="text-primary transition-all duration-1000 ease-out"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-black text-foreground">
                        {metrics.earnings > 0
                          ? Math.round(
                            (metrics.receivedEarnings / metrics.earnings) *
                            100
                          )
                          : 0}
                        %
                      </span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                        Received Payment
                      </p>
                      <p className="text-xl font-black text-foreground leading-none">
                        {formatCurrency(metrics.receivedEarnings || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                        Pending Payment
                      </p>
                      <p className="text-xl font-black text-foreground leading-none">
                        {formatCurrency(metrics.pendingEarnings || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Clients (Was Assigned Talent) */}
              <div className="bg-card rounded-xl border border-border p-8 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg text-foreground">
                    Active Clients
                  </h3>
                  <Button
                    variant="link"
                    className="text-primary hover:text-primary/80 h-auto p-0 font-semibold text-sm"
                    onClick={() => navigate("/freelancer/messages")}
                  >
                    View All
                  </Button>
                </div>
                <ul className="flex flex-col gap-4">
                  {metrics.acceptedProposals.length === 0 ? (
                    <div className="text-sm text-muted-foreground italic">
                      No active clients yet.
                    </div>
                  ) : (
                    // List all accepted proposals (Active Clients/Projects)
                    metrics.acceptedProposals.slice(0, 5).map((proposal) => (
                      <li key={proposal.id} className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground font-bold border-2 border-background ring-2 ring-border/20">
                            {(proposal.project?.owner?.fullName || "C").charAt(
                              0
                            )}
                          </div>
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full"></span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">
                            {proposal.project?.owner?.fullName || "Client"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {proposal.project?.title}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary rounded-full transition-colors"
                          onClick={() =>
                            navigate(
                              `/freelancer/messages?projectId=${proposal.projectId}`
                            )
                          }
                        >
                          <MessageSquare className="h-5 w-5" />
                        </Button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const FreelancerDashboard = () => {
  return (
    <RoleAwareSidebar>
      <DashboardContent />
    </RoleAwareSidebar>
  );
};

export const ClientDashboard = () => {
  return (
    <RoleAwareSidebar>
      <DashboardContent _roleOverride="CLIENT" />
    </RoleAwareSidebar>
  );
};

export default FreelancerDashboard;


