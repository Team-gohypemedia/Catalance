import React, { useCallback, useEffect, useMemo, useState } from "react";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Gavel from "lucide-react/dist/esm/icons/gavel";
import Video from "lucide-react/dist/esm/icons/video";
import MessageSquare from "lucide-react/dist/esm/icons/message-square";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import Clock from "lucide-react/dist/esm/icons/clock";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
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

  const inquiryCards = useMemo(
    () =>
      metrics.pendingProposals.slice(0, 4).map((proposal, index) => {
        const ownerName =
          proposal?.project?.owner?.fullName || proposal?.project?.owner?.name || "Client";
        const requestTime = formatDashboardActivityTime(
          proposal?.updatedAt || proposal?.createdAt
        );

        return {
          id: proposal.id || `inquiry-${index}`,
          ownerName,
          ownerInitial: String(ownerName).charAt(0).toUpperCase(),
          title: proposal?.project?.title || "Untitled project request",
          preview:
            proposal?.project?.description ||
            "Hi! I am looking for a reliable freelancer to start this project quickly.",
          requestTime,
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
    () => metrics.acceptedProposals.slice(0, 3),
    [metrics.acceptedProposals]
  );

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

          <section>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-100 sm:text-[34px]">
              {greeting}, {firstName}
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Here&apos;s a summary of your freelance business.
            </p>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-white/[0.06] bg-accent p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-zinc-400">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md border border-[#3a3d44] bg-[#17191d]">
                    <TrendingUp className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-xs font-medium tracking-wide">Total Earnings</p>
                </div>
                <span className="rounded-full bg-[#22c55e]/15 px-2 py-0.5 text-[10px] font-semibold text-[#4ade80]">
                  {metrics.earnings > 0
                    ? `+${Math.round((metrics.receivedEarnings / metrics.earnings) * 100)}%`
                    : "New"}
                </span>
              </div>
              <p className="mt-4 text-[30px] font-extrabold tracking-tight text-zinc-100">
                {formatCurrency(metrics.earnings)}
              </p>
            </article>

            <article className="rounded-2xl border border-white/[0.06] bg-accent p-5">
              <div className="flex items-center gap-2 text-zinc-400">
                <div className="flex h-6 w-6 items-center justify-center rounded-md border border-[#3a3d44] bg-[#17191d]">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <p className="text-xs font-medium tracking-wide">Active Projects</p>
              </div>
              <p className="mt-4 text-[30px] font-extrabold tracking-tight text-zinc-100">
                {String(metrics.activeProjects).padStart(2, "0")}
              </p>
            </article>

            <article className="rounded-2xl border border-white/[0.06] bg-accent p-5">
              <div className="flex items-center gap-2 text-zinc-400">
                <div className="flex h-6 w-6 items-center justify-center rounded-md border border-[#3a3d44] bg-[#17191d]">
                  <Clock className="h-3.5 w-3.5" />
                </div>
                <p className="text-xs font-medium tracking-wide">Pending Payments</p>
              </div>
              <p className="mt-4 text-[30px] font-extrabold tracking-tight text-zinc-100">
                {formatCurrency(metrics.pendingEarnings)}
              </p>
            </article>

            <article className="rounded-2xl border border-white/[0.06] bg-accent p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-zinc-400">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md border border-[#3a3d44] bg-[#17191d]">
                    <MessageSquare className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-xs font-medium tracking-wide">Client&apos;s Request</p>
                </div>
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#facc15]" />
              </div>
              <p className="mt-4 text-[30px] font-extrabold tracking-tight text-zinc-100">
                {String(metrics.pendingProposals.length).padStart(2, "0")}
              </p>
            </article>
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_350px]">
            <article className="rounded-2xl border border-white/[0.06] bg-accent p-6 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
              <h2 className="text-xl font-semibold text-zinc-100">
                Client Inquiries
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                Manage your incoming project requests and potential collaborations.
              </p>

              {inquiryCards.length === 0 ? (
                <div className="mt-5 rounded-xl border border-dashed border-white/[0.06] bg-background p-6 text-sm text-zinc-400">
                  No client inquiries yet. New requests will appear here.
                </div>
              ) : (
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {inquiryCards.map((inquiry) => (
                    <div
                      key={inquiry.id}
                      className="flex flex-col justify-between rounded-2xl border border-white/[0.06] bg-accent p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2a2d34] text-base font-bold text-zinc-100">
                          {inquiry.ownerInitial}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-zinc-100">{inquiry.ownerName}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge className="h-5 rounded-full border-0 bg-[#facc15]/15 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#facc15]">
                              {inquiry.title}
                            </Badge>
                            <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                              <Clock className="h-3 w-3" />
                              {inquiry.requestTime}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="mt-3 line-clamp-2 text-sm text-zinc-300">
                        &ldquo;{inquiry.preview}
                      </p>

                      <div className="mt-4 flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 flex-1 rounded-xl border-white/10 bg-transparent text-xs font-semibold text-zinc-200 hover:bg-white/[0.06]"
                          onClick={() =>
                            navigate(
                              inquiry.projectId
                                ? `/freelancer/messages?projectId=${inquiry.projectId}`
                                : "/freelancer/messages"
                            )
                          }
                        >
                          Reply
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 flex-1 rounded-xl border-white/10 bg-transparent text-xs font-semibold text-zinc-200 hover:bg-white/[0.06]"
                          onClick={() =>
                            navigate(
                              inquiry.projectId
                                ? `/freelancer/project/${inquiry.projectId}`
                                : "/freelancer/proposals"
                            )
                          }
                        >
                          View Profile
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <div className="flex flex-col gap-5">
              <article className="rounded-2xl border border-white/[0.06] bg-accent p-5 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-100">Profile Completion</h3>
                  <span className="text-sm font-bold text-[#facc15]">{profileCompletionPercent}%</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-background">
                  <div
                    className="h-full rounded-full bg-[#facc15] transition-all duration-700"
                    style={{ width: `${profileCompletionPercent}%` }}
                  />
                </div>
                <p className="mt-3 text-xs text-zinc-400">{profileCompletion.message}</p>
                <Button
                  className="mt-4 h-9 w-full rounded-lg bg-zinc-100 text-xs font-semibold text-zinc-900 hover:bg-zinc-200"
                  onClick={() => navigate("/freelancer/profile")}
                >
                  {profileCompletionComplete ? "View Profile" : "Complete Profile"}
                </Button>
              </article>

              <article className="rounded-2xl border border-white/[0.06] bg-accent p-5 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
                <h3 className="text-sm font-semibold text-zinc-100">Monthly Earnings</h3>
                <div className="mt-4 rounded-xl border border-[#30333a] bg-[#16181b] p-3">
                  <svg viewBox="0 0 320 120" className="h-28 w-full" role="img" aria-label="Monthly earnings trend">
                    <defs>
                      <linearGradient id="freelancerMonthlyArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#facc15" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={`${monthlyEarningsPath} L320,120 L0,120 Z`} fill="url(#freelancerMonthlyArea)" />
                    <path
                      d={monthlyEarningsPath}
                      fill="none"
                      stroke="#facc15"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="mt-1 grid grid-cols-6 text-center text-[11px] text-zinc-500">
                    {[
                      "Jan",
                      "Feb",
                      "Mar",
                      "Apr",
                      "May",
                      "Jun",
                    ].map((label) => (
                      <span key={label}>{label}</span>
                    ))}
                  </div>
                </div>
              </article>

              <article className="rounded-2xl border border-white/[0.06] bg-accent p-5 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
                <h3 className="text-sm font-semibold text-zinc-100">New Messages</h3>
                {recentChatUpdates.length === 0 ? (
                  <p className="mt-3 text-xs text-zinc-400">No new messages right now.</p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {recentChatUpdates.map((message) => (
                      <li key={message.id || message.createdAt} className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#272a31] text-[11px] font-bold text-zinc-200">
                          {String(message?.title || "M").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-zinc-100">
                            {message?.title || "New message"}
                          </p>
                          <p className="line-clamp-1 text-[11px] text-zinc-500">
                            {message?.message || "You have a new conversation update."}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </article>

              <article className="rounded-2xl border border-white/[0.06] bg-accent p-5 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
                <h3 className="text-sm font-semibold text-zinc-100">Proposals</h3>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-2xl font-extrabold text-zinc-100">{proposalStats.sent}</p>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Sent</p>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-[#facc15]">{proposalStats.accepted}</p>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Accepted</p>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-zinc-100">{proposalStats.pending}</p>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Pending</p>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <section className="rounded-2xl border border-white/[0.06] bg-accent p-6 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-zinc-100">Recent Activity</h3>
              <Button
                variant="link"
                className="h-auto p-0 text-xs font-semibold uppercase tracking-[0.16em] text-[#facc15] hover:text-[#facc15]/80"
                onClick={() => navigate("/freelancer/proposals")}
              >
                View all
              </Button>
            </div>

            <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-accent">
              {activityItems.map((item, index) => {
                const Icon = item.icon;
                const tone =
                  ACTIVITY_TONE_STYLES[item.tone] || ACTIVITY_TONE_STYLES.slate;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.onClick}
                    className={`flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-white/[0.04] ${
                      index < activityItems.length - 1 ? "border-b border-white/[0.06]" : ""
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone.icon}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
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
            </div>

            <p className="mt-3 text-xs text-zinc-500">
              {unreadActivityCount > 0
                ? `${unreadActivityCount} unread updates`
                : "No unread updates"}
            </p>
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_350px]">
            <article className="rounded-2xl border border-white/[0.06] bg-accent p-6 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-zinc-100">Active Projects</h3>
                <Button
                  variant="link"
                  className="h-auto p-0 text-xs font-semibold uppercase tracking-[0.16em] text-[#facc15] hover:text-[#facc15]/80"
                  onClick={() => navigate("/freelancer/project?view=ongoing")}
                >
                  View all
                </Button>
              </div>

              {activeProjectCards.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#3a3d44] bg-[#17191d] p-6 text-sm text-zinc-400">
                  No active projects yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {activeProjectCards.map((proposal, index) => {
                    const projectId = proposal?.project?.id;
                    const projectTitle = proposal?.project?.title || "Untitled Project";
                    const progress = resolveProjectProgress(proposal, index);
                    const budget = formatCurrency((Number(proposal?.amount) || 0) * 0.7);
                    const dueDate = proposal?.project?.deadline
                      ? new Date(proposal.project.deadline).toLocaleDateString()
                      : "Ongoing";

                    return (
                      <div
                        key={proposal.id || `active-${index}`}
                        className="rounded-xl border border-white/[0.06] bg-accent p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-zinc-100">{projectTitle}</p>
                            <p className="text-xs text-zinc-500">
                              {budget} • Due {dueDate}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            className="h-8 rounded-lg bg-zinc-100 px-4 text-xs font-semibold text-zinc-900 hover:bg-zinc-200"
                            onClick={() =>
                              navigate(
                                projectId
                                  ? `/freelancer/project/${projectId}`
                                  : "/freelancer/project?view=ongoing"
                              )
                            }
                          >
                            View Project
                          </Button>
                        </div>

                        <div className="mt-3 flex items-center gap-3">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-background">
                            <div
                              className="h-full rounded-full bg-[#facc15]"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-xs font-semibold text-zinc-300">
                            {progress}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>

            <article className="rounded-2xl border border-white/[0.06] bg-accent p-6 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
              <h3 className="text-sm font-semibold text-zinc-100">Quick Status</h3>
              {upcomingMeeting ? (
                <div className="mt-4 rounded-xl border border-white/[0.06] bg-accent p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#facc15]">
                    Upcoming Meeting
                  </p>
                  <p className="mt-2 text-sm font-semibold text-zinc-100">
                    {upcomingMeeting.title || "Client Meeting"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {new Date(upcomingMeeting.date).toLocaleDateString()} •
                    {` ${upcomingMeeting.startHour}:00 - ${upcomingMeeting.endHour}:00`}
                  </p>
                  <Button
                    className="mt-3 h-8 w-full rounded-lg bg-[#facc15] text-xs font-semibold text-black hover:bg-[#eab308]"
                    onClick={() =>
                      window.open(
                        upcomingMeeting.meetingLink || "https://meet.google.com/",
                        "_blank"
                      )
                    }
                  >
                    Join Meeting
                  </Button>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-white/[0.06] bg-accent p-4 text-xs text-zinc-400">
                  No upcoming meetings scheduled.
                </div>
              )}

              <div className="mt-4 rounded-xl border border-white/[0.06] bg-accent p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                  Payment Split
                </p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-300">
                    <span>Received</span>
                    <span className="font-semibold text-zinc-100">
                      {formatCurrency(metrics.receivedEarnings)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-300">
                    <span>Pending</span>
                    <span className="font-semibold text-zinc-100">
                      {formatCurrency(metrics.pendingEarnings)}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          </section>

          <section className="rounded-2xl border border-white/[0.06] bg-accent p-6 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-2xl font-semibold text-zinc-100">Active Jobs Overview</h3>
              <Button
                variant="link"
                className="h-auto p-0 text-xs font-semibold uppercase tracking-[0.16em] text-[#facc15] hover:text-[#facc15]/80"
                onClick={() => navigate("/freelancer/project?view=ongoing")}
              >
                View all
              </Button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-accent">
              <table className="min-w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-accent">
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      Project Name
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      Client
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      Budget
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.acceptedProposals.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-sm text-zinc-400">
                        No active jobs yet.
                      </td>
                    </tr>
                  ) : (
                    metrics.acceptedProposals.map((proposal) => (
                      <tr
                        key={proposal.id}
                        className="border-b border-white/[0.06] text-sm text-zinc-200 transition-colors last:border-b-0 hover:bg-white/[0.04]"
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-zinc-100">
                            {proposal.project?.title || "Untitled Project"}
                          </p>
                          <p className="text-xs text-zinc-500">
                            Due {proposal.project?.deadline
                              ? new Date(proposal.project.deadline).toLocaleDateString()
                              : "soon"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                            Active
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {proposal.project?.owner?.fullName || "Client"}
                        </td>
                        <td className="px-4 py-3 font-semibold text-zinc-100">
                          {formatCurrency((Number(proposal?.amount) || 0) * 0.7)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-zinc-400 hover:bg-[#2f333a] hover:text-[#facc15]"
                            onClick={() =>
                              navigate(
                                proposal.project?.id
                                  ? `/freelancer/project/${proposal.project.id}`
                                  : "/freelancer/project?view=ongoing"
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


