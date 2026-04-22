import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  buildProjectCardModel,
  normalizeClientProjects,
} from "@/components/features/client/ClientProjects";
import { useAuth } from "@/shared/context/AuthContext";
import { useNotifications } from "@/shared/context/NotificationContext";
import { getSession } from "@/shared/lib/auth-storage";
import { fetchChatConversations } from "@/shared/lib/api-client";
import {
  createMarketplaceFavoriteSnapshot,
  loadMarketplaceFavorites,
  saveMarketplaceFavorites,
} from "@/shared/lib/marketplace-favorites";
import { hasUnlockedProjectChat } from "@/shared/lib/project-chat-access";
import {
  buildProposalBudgetDetailsPath,
  collectBudgetIncreaseProjects,
} from "@/components/client/client-proposal/proposal-budget-utils.js";
import { useProposalBudgetIncrease } from "@/components/client/client-proposal/useProposalBudgetIncrease.js";
import {
  getPendingProposalCount,
  getProjectPaymentSummary,
  isProjectCompleted,
} from "./dashboard-utils.js";
import { ClientDashboardDataContext } from "./client-dashboard-data-context.js";

const CLIENT_DASHBOARD_ACTIVE_PROGRESS_STATUSES = new Set([
  "AWAITING_PAYMENT",
  "OPEN",
  "IN_PROGRESS",
  "ONGOING",
  "ACTIVE",
  "IN_REVIEW",
  "ON_HOLD",
  "PAUSED",
]);
const CLIENT_DASHBOARD_RECENT_ACTIVITY_LIMIT = 4;
const CLIENT_DASHBOARD_ACTIVE_CHAT_LIMIT = 3;
const MARKETPLACE_WISHLIST_FETCH_LIMIT = 100;

const getFirstNonEmptyText = (...values) => {
  for (const value of values.flat(Infinity)) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }

  return "";
};

const toDisplayTitleCase = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/(^|[\s/-])([a-z])/g, (match, prefix, char) => `${prefix}${char.toUpperCase()}`);

const formatDashboardRelativeTime = (value) => {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return "Now";
  }

  const deltaInSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absSeconds = Math.abs(deltaInSeconds);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absSeconds < 45) return "Now";

  const deltaInMinutes = Math.round(deltaInSeconds / 60);
  if (Math.abs(deltaInMinutes) < 60) {
    return formatter.format(deltaInMinutes, "minute");
  }

  const deltaInHours = Math.round(deltaInMinutes / 60);
  if (Math.abs(deltaInHours) < 24) {
    return formatter.format(deltaInHours, "hour");
  }

  const deltaInDays = Math.round(deltaInHours / 24);
  if (Math.abs(deltaInDays) < 7) {
    return formatter.format(deltaInDays, "day");
  }

  const deltaInWeeks = Math.round(deltaInDays / 7);
  if (Math.abs(deltaInWeeks) < 4) {
    return formatter.format(deltaInWeeks, "week");
  }

  const deltaInMonths = Math.round(deltaInDays / 30);
  if (Math.abs(deltaInMonths) < 12) {
    return formatter.format(deltaInMonths, "month");
  }

  const deltaInYears = Math.round(deltaInDays / 365);
  return formatter.format(deltaInYears, "year");
};

const getChatMessagePreview = (message = "") => {
  const text = String(message || "").replace(/\s+/g, " ").trim();

  if (!text) {
    return "New message";
  }

  return text.length > 72 ? `${text.slice(0, 69).trimEnd()}...` : text;
};

const resolveProjectBusinessName = (project = {}, acceptedProposal = null) =>
  getFirstNonEmptyText(
    project?.businessName,
    project?.companyName,
    acceptedProposal?.businessName,
    acceptedProposal?.companyName,
    project?.title,
    acceptedProposal?.projectTitle,
    acceptedProposal?.title,
  );

const resolveProjectServiceLabel = (project = {}, acceptedProposal = null) =>
  getFirstNonEmptyText(
    project?.service,
    project?.serviceName,
    project?.serviceKey,
    project?.category,
    acceptedProposal?.service,
    acceptedProposal?.serviceName,
    acceptedProposal?.serviceKey,
    acceptedProposal?.category,
    project?.title,
  );

const isProjectProgressEligible = (project = {}) =>
  CLIENT_DASHBOARD_ACTIVE_PROGRESS_STATUSES.has(String(project?.rawStatus || project?.status || "").toUpperCase());

const getProjectId = (project = {}, fallbackIndex = 0) =>
  String(project?.id || `project-${fallbackIndex}`).trim();

const mergeProjectsWithProposals = (projects = [], proposals = []) => {
  const proposalsByProjectId = new Map();

  proposals.forEach((proposal) => {
    const projectId = String(
      proposal?.syncedProjectId || proposal?.projectId || proposal?.project?.id || "",
    ).trim();

    if (!projectId) {
      return;
    }

    const nextEntries = proposalsByProjectId.get(projectId) || [];
    nextEntries.push(proposal);
    proposalsByProjectId.set(projectId, nextEntries);
  });

  return projects.map((project) => {
    const projectId = String(project?.id || "").trim();
    if (!projectId) {
      return project;
    }

    const existingProposals = Array.isArray(project?.proposals) ? project.proposals : [];
    const mergedProposals =
      existingProposals.length > 0 ? existingProposals : proposalsByProjectId.get(projectId) || [];

    return mergedProposals === existingProposals ? project : { ...project, proposals: mergedProposals };
  });
};

const buildConversationProjectId = (conversation = {}) => {
  const service = String(conversation?.service || "");
  const parts = service.split(":");

  if (parts.length >= 2 && parts[0] === "CHAT") {
    return parts[1];
  }

  return String(conversation?.projectId || conversation?.project?.id || "").trim();
};

const buildAcceptedFreelancerRows = ({
  activeProjects = [],
  projectsById = new Map(),
  navigate,
}) => {
  const rows = [];
  let unlockedCount = 0;

  activeProjects.forEach((project, index) => {
    const projectId = getProjectId(project, index);
    const sourceProject = projectsById.get(projectId) || project;
    const proposals = Array.isArray(sourceProject?.proposals) ? sourceProject.proposals : [];
    const acceptedProposal = proposals.find(
      (proposal) => String(proposal?.status || "").toUpperCase() === "ACCEPTED",
    );
    const chatUnlocked = hasUnlockedProjectChat({
      ...sourceProject,
      status: sourceProject?.status || project?.rawStatus,
      paymentPlan: sourceProject?.paymentPlan || project?.paymentPlan,
    });

    const assignedFreelancer = acceptedProposal?.freelancer || null;
    const displayName = getFirstNonEmptyText(
      project?.freelancerName,
      assignedFreelancer?.fullName,
      assignedFreelancer?.name,
      acceptedProposal?.freelancerName,
      sourceProject?.freelancerName,
      assignedFreelancer?.email,
      `Freelancer ${index + 1}`,
    );
    const serviceLabel =
      project?.serviceType || resolveProjectServiceLabel(sourceProject, acceptedProposal);
    const projectLabel =
      project?.title ||
      resolveProjectBusinessName(sourceProject, acceptedProposal) ||
      sourceProject?.title ||
      serviceLabel ||
      "Project collaboration";
    const activityTime =
      acceptedProposal?.updatedAt ||
      acceptedProposal?.createdAt ||
      sourceProject?.updatedAt ||
      sourceProject?.createdAt;
    const avatar = getFirstNonEmptyText(
      project?.freelancerAvatar,
      assignedFreelancer?.avatar,
      assignedFreelancer?.avatarUrl,
      assignedFreelancer?.profilePhoto,
      acceptedProposal?.freelancerAvatar,
      acceptedProposal?.avatar,
    );

    rows.push({
      id: projectId,
      sortValue: new Date(activityTime || 0).getTime() || 0,
      chatUnlocked,
      name: displayName,
      initial: displayName.charAt(0).toUpperCase() || "F",
      avatar,
      role:
        project?.freelancerRole ||
        assignedFreelancer?.professionalTitle ||
        assignedFreelancer?.jobTitle ||
        assignedFreelancer?.headline ||
        toDisplayTitleCase(serviceLabel) ||
        "Active collaboration",
      projectLabel,
      activityLabel: chatUnlocked
        ? `Updated ${formatDashboardRelativeTime(activityTime)}`
        : "Kickoff payment pending",
      actionLabel: chatUnlocked ? "MESSAGE" : "VIEW PROJECT",
      onMessage: () =>
        navigate(
          chatUnlocked
            ? `/client/messages?projectId=${encodeURIComponent(projectId)}`
            : `/client/project/${encodeURIComponent(projectId)}`,
        ),
    });

    if (chatUnlocked) {
      unlockedCount += 1;
    }
  });

  rows.sort((left, right) => right.sortValue - left.sortValue);
  return {
    rows,
    unlockedCount,
  };
};

const buildProgressProjects = ({ projects = [] }) =>
  normalizeClientProjects(projects)
    .filter((project) => isProjectProgressEligible(project))
    .map((project, index) => {
      const cardModel = buildProjectCardModel(project);
      const projectId = String(cardModel.id || project.id || `progress-${index}`);

      return {
        ...cardModel,
        id: projectId,
        label: cardModel.title || project.title || `Project ${index + 1}`,
        title: cardModel.title || project.title || `Project ${index + 1}`,
      };
    });

const buildRecentActivities = ({
  notifications = [],
  projects = [],
  proposals = [],
  chatConversations = [],
  navigate,
  openBudgetDialogByProjectId,
}) => {
  const budgetIncreaseProjects = collectBudgetIncreaseProjects(proposals);
  const buildBudgetActivityItem = ({
    id,
    title,
    subtitle,
    createdAt,
    projectId,
  }) => {
    const normalizedProjectId = String(projectId || "").trim();
    const matchingBudgetTarget = budgetIncreaseProjects.get(normalizedProjectId) || null;
    const budgetDetailsPath = normalizedProjectId
      ? buildProposalBudgetDetailsPath(proposals, normalizedProjectId)
      : "/client/proposal";

    return {
      id,
      iconKey: "budget",
      tone: "warning",
      title: title || "Consider Increasing Budget",
      subtitle:
        subtitle ||
        "Your project budget could be adjusted to attract more freelancers.",
      timeLabel: formatDashboardRelativeTime(createdAt),
      sortValue: new Date(createdAt || 0).getTime() || 0,
      projectId: normalizedProjectId || null,
      secondaryActionLabel: "View Details",
      onSecondaryAction: () => navigate(budgetDetailsPath),
      actionLabel:
        matchingBudgetTarget && typeof openBudgetDialogByProjectId === "function"
          ? "Increase Budget"
          : undefined,
      onAction:
        matchingBudgetTarget && typeof openBudgetDialogByProjectId === "function"
          ? () => openBudgetDialogByProjectId(normalizedProjectId)
          : undefined,
      onClick: () => navigate(budgetDetailsPath),
    };
  };

  const recentNotificationItems = (Array.isArray(notifications) ? notifications : []).map(
    (notification, index) => {
      const type = String(notification?.type || "").toLowerCase();
      const createdAt = notification?.createdAt || notification?.updatedAt;
      const projectId = String(notification?.data?.projectId || "").trim();

      if (type === "chat") {
        return {
          id: notification?.id || `notification-chat-${index}`,
          iconKey: "message",
          tone: "amber",
          title: notification?.title || "New Message",
          subtitle:
            notification?.message ||
            notification?.data?.projectTitle ||
            "A freelancer sent you a new message.",
          timeLabel: formatDashboardRelativeTime(createdAt),
          sortValue: new Date(createdAt || 0).getTime() || 0,
          onClick: () =>
            navigate(
              projectId
                ? `/client/messages?projectId=${encodeURIComponent(projectId)}`
                : "/client/messages",
            ),
        };
      }

      if (type === "proposal") {
        const proposalStatus = String(notification?.data?.status || "").toUpperCase();

        return {
          id: notification?.id || `notification-proposal-${index}`,
          iconKey: "proposal",
          tone: "green",
          title: notification?.title || "Proposal Update",
          subtitle: notification?.message || "Your proposal workflow has a new update.",
          timeLabel: formatDashboardRelativeTime(createdAt),
          sortValue: new Date(createdAt || 0).getTime() || 0,
          onClick: () =>
            navigate(
              proposalStatus === "ACCEPTED" && projectId
                ? `/client/project/${encodeURIComponent(projectId)}`
                : "/client/proposal",
            ),
        };
      }

      if (type === "budget_suggestion") {
        return buildBudgetActivityItem({
          id: notification?.id || `notification-budget-${index}`,
          title: notification?.title,
          subtitle: notification?.message,
          createdAt,
          projectId,
        });
      }

      if (
        type === "task_completed" ||
        type === "task_verified" ||
        type === "freelancer_change_resolved"
      ) {
        return {
          id: notification?.id || `notification-project-${index}`,
          iconKey: "milestone",
          tone: "violet",
          title: notification?.title || "Milestone Completed",
          subtitle: notification?.message || "A project milestone has been completed.",
          timeLabel: formatDashboardRelativeTime(createdAt),
          sortValue: new Date(createdAt || 0).getTime() || 0,
          onClick: () =>
            navigate(
              projectId
                ? `/client/project/${encodeURIComponent(projectId)}`
                : "/client/project",
            ),
        };
      }

      return {
        id: notification?.id || `notification-general-${index}`,
        iconKey: "project",
        tone: "blue",
        title: notification?.title || "Workspace Update",
        subtitle: notification?.message || "Catalance updated your workspace.",
        timeLabel: formatDashboardRelativeTime(createdAt),
        sortValue: new Date(createdAt || 0).getTime() || 0,
        onClick: () => navigate("/client/project"),
      };
    },
  );

  const existingBudgetProjectIds = new Set(
    recentNotificationItems
      .map((item) => String(item?.projectId || "").trim())
      .filter(Boolean),
  );

  const derivedBudgetReminderItems = [...budgetIncreaseProjects.values()]
    .filter((entry) => !existingBudgetProjectIds.has(entry.projectId))
    .map((entry) =>
      buildBudgetActivityItem({
        id: `activity-budget-${entry.projectId}`,
        title: "Consider Increasing Budget",
        subtitle: `Your proposal for "${resolveProjectBusinessName(entry.proposal?.project, entry.proposal) || resolveProjectServiceLabel(entry.proposal?.project, entry.proposal) || resolveProjectBusinessName(entry.proposal, null) || "this project"}" has been pending for over 24 hours. Consider increasing your budget to attract freelancers.`,
        createdAt: entry.proposal?.updatedAt || entry.proposal?.createdAt,
        projectId: entry.projectId,
      }),
    );

  const prioritizedNotificationItems = [...recentNotificationItems, ...derivedBudgetReminderItems]
    .sort((left, right) => (right.sortValue || 0) - (left.sortValue || 0))
    .slice(0, CLIENT_DASHBOARD_RECENT_ACTIVITY_LIMIT)
    .map((item) => {
      const rest = { ...item };
      delete rest.sortValue;
      delete rest.projectId;
      return rest;
    });

  if (prioritizedNotificationItems.length > 0) {
    return prioritizedNotificationItems;
  }

  const sortedProjects = [...projects].sort((left, right) => {
    const leftTime = new Date(left?.updatedAt || left?.createdAt || 0).getTime();
    const rightTime = new Date(right?.updatedAt || right?.createdAt || 0).getTime();
    return rightTime - leftTime;
  });

  const latestProject = sortedProjects[0] || null;
  const latestAcceptedProject = sortedProjects.find((project) =>
    (Array.isArray(project?.proposals) ? project.proposals : []).some(
      (proposal) => String(proposal?.status || "").toUpperCase() === "ACCEPTED",
    ),
  );
  const latestCompletedProject = sortedProjects.find((project) =>
    String(project?.status || "").toUpperCase() === "COMPLETED",
  );
  const latestChat =
    [...(Array.isArray(chatConversations) ? chatConversations : [])].sort((left, right) => {
      const leftTime = new Date(left?.updatedAt || left?.createdAt || 0).getTime();
      const rightTime = new Date(right?.updatedAt || right?.createdAt || 0).getTime();
      return rightTime - leftTime;
    })[0] || null;

  const fallback = [];

  if (latestProject) {
    fallback.push({
      id: `activity-project-${latestProject.id}`,
      iconKey: "project",
      tone: "blue",
      title: "Project Updated",
      subtitle: latestProject.title || "A project was updated.",
      timeLabel: formatDashboardRelativeTime(latestProject.updatedAt || latestProject.createdAt),
      onClick: () => navigate(`/client/project/${encodeURIComponent(latestProject.id)}`),
    });
  }

  if (latestChat) {
    const chatProjectId = buildConversationProjectId(latestChat);
    fallback.push({
      id: `activity-chat-${latestChat.id}`,
      iconKey: "message",
      tone: "amber",
      title: "New Message",
      subtitle:
        latestChat.projectTitle ||
        getChatMessagePreview(latestChat.lastMessage) ||
        `From ${getFirstNonEmptyText(latestChat?.freelancer?.fullName, latestChat?.freelancer?.name, "Freelancer")}`,
      timeLabel: latestChat.updatedAt ? formatDashboardRelativeTime(latestChat.updatedAt) : "Live",
      onClick: () =>
        navigate(
          chatProjectId
            ? `/client/messages?projectId=${encodeURIComponent(chatProjectId)}`
            : "/client/messages",
        ),
    });
  }

  if (latestAcceptedProject || latestCompletedProject) {
    const project = latestAcceptedProject || latestCompletedProject;
    fallback.push({
      id: `activity-success-${project.id}`,
      iconKey: "milestone",
      tone: "violet",
      title:
        String(project?.status || "").toUpperCase() === "COMPLETED"
          ? "Milestone Completed"
          : "Proposal Accepted",
      subtitle: project.title || "Project progress moved forward.",
      timeLabel: formatDashboardRelativeTime(project.updatedAt || project.createdAt),
      onClick: () => navigate(`/client/project/${encodeURIComponent(project.id)}`),
    });
  }

  if (fallback.length === 0) {
    fallback.push({
      id: "activity-empty",
      iconKey: "project",
      tone: "blue",
      title: "Workspace ready",
      subtitle: "Start a proposal to populate your dashboard activity feed.",
      timeLabel: "Now",
      onClick: () => navigate("/service"),
    });
  }

  return fallback.slice(0, CLIENT_DASHBOARD_RECENT_ACTIVITY_LIMIT);
};

const fetchClientDashboardData = async (authFetch) => {
  const readArrayResponse = async (responsePromise) => {
    try {
      const response = await responsePromise;
      const payload = await response.json().catch(() => null);

      if (!response.ok || !Array.isArray(payload?.data)) {
        return [];
      }

      return payload.data;
    } catch {
      return [];
    }
  };

  const [projects, proposals, chatConversations] = await Promise.all([
    readArrayResponse(authFetch("/projects", { skipLogoutOn401: true })),
    readArrayResponse(authFetch("/proposals?as=owner", { skipLogoutOn401: true })),
    fetchChatConversations().catch(() => []),
  ]);

  return {
    projects,
    proposals,
    chatConversations: Array.isArray(chatConversations) ? chatConversations : [],
  };
};

const toWishlistedFreelancerRows = (favoriteIds = [], snapshots = {}) =>
  Array.from(new Set(favoriteIds))
    .map((favoriteId) => {
      const snapshot = snapshots[favoriteId];
      if (snapshot) return snapshot;
      return {
        id: favoriteId,
        freelancerName: "Saved freelancer",
        serviceTitle: "Wishlisted service",
        updatedAt: null,
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      const leftTime = new Date(left?.updatedAt || 0).getTime() || 0;
      const rightTime = new Date(right?.updatedAt || 0).getTime() || 0;
      return rightTime - leftTime;
    });

export const ClientDashboardDataProvider = ({ children }) => {
  const { authFetch, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { notifications, markAsRead } = useNotifications();
  const [projects, setProjects] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [chatConversations, setChatConversations] = useState([]);
  const [wishlistedFreelancers, setWishlistedFreelancers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const sessionUser = useMemo(() => user ?? getSession()?.user ?? null, [user]);

  const refreshWishlistedFreelancers = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlistedFreelancers([]);
      return [];
    }

    const userId = sessionUser?.id || user?.id;
    const { favoriteMap, itemSnapshots } = loadMarketplaceFavorites(userId);
    const favoriteIds = Object.entries(favoriteMap)
      .filter(([, isSelected]) => Boolean(isSelected))
      .map(([favoriteId]) => String(favoriteId || "").trim())
      .filter(Boolean);

    if (!favoriteIds.length) {
      setWishlistedFreelancers([]);
      return [];
    }

    const nextSnapshots = { ...itemSnapshots };
    const missingFavoriteIds = favoriteIds.filter((favoriteId) => !nextSnapshots[favoriteId]);

    if (missingFavoriteIds.length > 0) {
      try {
        const response = await authFetch(
          `/marketplace?page=1&limit=${MARKETPLACE_WISHLIST_FETCH_LIMIT}`,
          {
            method: "GET",
            suppressToast: true,
            skipLogoutOn401: true,
          },
        );
        const payload = await response.json().catch(() => null);

        if (response.ok && Array.isArray(payload?.data)) {
          const missingIdSet = new Set(missingFavoriteIds);

          payload.data.forEach((entry) => {
            const snapshot = createMarketplaceFavoriteSnapshot(entry);
            if (!snapshot || !missingIdSet.has(snapshot.id)) return;
            nextSnapshots[snapshot.id] = snapshot;
          });

          saveMarketplaceFavorites(userId, {
            favoriteMap,
            itemSnapshots: nextSnapshots,
          });
        }
      } catch {
        // Keep rendering available local snapshots even if hydration fails.
      }
    }

    const nextRows = toWishlistedFreelancerRows(favoriteIds, nextSnapshots);
    setWishlistedFreelancers(nextRows);
    return nextRows;
  }, [authFetch, isAuthenticated, sessionUser?.id, user?.id]);

  const refreshDashboardData = useCallback(
    async ({ silent = false } = {}) => {
      if (!isAuthenticated) {
        setProjects([]);
        setProposals([]);
        setChatConversations([]);
        setWishlistedFreelancers([]);
        setIsLoading(false);
        return { projects: [], proposals: [], chatConversations: [] };
      }

      if (!silent) {
        setIsLoading(true);
      }

      try {
        const nextData = await fetchClientDashboardData(authFetch);
        setProjects(nextData.projects);
        setProposals(nextData.proposals);
        setChatConversations(nextData.chatConversations);
        return nextData;
      } catch (error) {
        console.error("Failed to load client dashboard data:", error);
        setProjects([]);
        setProposals([]);
        setChatConversations([]);
        setWishlistedFreelancers([]);
        return { projects: [], proposals: [], chatConversations: [] };
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [authFetch, isAuthenticated],
  );

  useEffect(() => {
    void refreshDashboardData();
  }, [refreshDashboardData]);

  useEffect(() => {
    void refreshWishlistedFreelancers();
  }, [refreshWishlistedFreelancers]);

  const handleDashboardBudgetUpdated = useCallback(async () => {
    await refreshDashboardData({ silent: true });
  }, [refreshDashboardData]);

  const { budgetDialogState, budgetDialogActions } = useProposalBudgetIncrease({
    authFetch,
    userId: sessionUser?.id || user?.id,
    proposals,
    notifications,
    markNotificationAsRead: markAsRead,
    onBudgetUpdated: handleDashboardBudgetUpdated,
  });

  const mergedProjects = useMemo(
    () => mergeProjectsWithProposals(projects, proposals),
    [projects, proposals],
  );
  const mergedProjectsById = useMemo(
    () =>
      new Map(
        mergedProjects
          .map((project) => [String(project?.id || "").trim(), project])
          .filter(([projectId]) => Boolean(projectId)),
      ),
    [mergedProjects],
  );

  const normalizedProjects = useMemo(
    () => normalizeClientProjects(mergedProjects),
    [mergedProjects],
  );

  const activeProjects = useMemo(
    () =>
      normalizedProjects.filter(
        (project) =>
          !isProjectCompleted({
            status: project.rawStatus,
            paymentPlan: project.paymentPlan,
          }),
      ),
    [normalizedProjects],
  );

  const completedProjects = useMemo(
    () =>
      normalizedProjects.filter((project) =>
        isProjectCompleted({
          status: project.rawStatus,
          paymentPlan: project.paymentPlan,
        }),
      ),
    [normalizedProjects],
  );

  const activeProjectCards = useMemo(
    () => activeProjects.map((project) => buildProjectCardModel(project)),
    [activeProjects],
  );

  const paymentSummary = useMemo(
    () => getProjectPaymentSummary(projects),
    [projects],
  );

  const pendingProposalCount = useMemo(
    () => getPendingProposalCount(proposals),
    [proposals],
  );

  const acceptedFreelancerSection = useMemo(
    () => buildAcceptedFreelancerRows({ activeProjects, projectsById: mergedProjectsById, navigate }),
    [activeProjects, mergedProjectsById, navigate],
  );

  const progressProjects = useMemo(
    () => buildProgressProjects({ projects: mergedProjects }),
    [mergedProjects],
  );

  const recentActivities = useMemo(
    () =>
      buildRecentActivities({
        notifications,
        projects: mergedProjects,
        proposals,
        chatConversations,
        navigate,
        openBudgetDialogByProjectId: budgetDialogActions.openBudgetDialogByProjectId,
      }),
    [
      budgetDialogActions.openBudgetDialogByProjectId,
      chatConversations,
      mergedProjects,
      navigate,
      notifications,
      proposals,
    ],
  );

  const value = useMemo(
    () => ({
      authFetch,
      isAuthenticated,
      isLoading,
      chatConversations,
      acceptedFreelancers: acceptedFreelancerSection.rows.slice(0, CLIENT_DASHBOARD_ACTIVE_CHAT_LIMIT),
      acceptedFreelancersCount: acceptedFreelancerSection.unlockedCount,
      acceptedFreelancersTotalCount: acceptedFreelancerSection.rows.length,
      progressProjects,
      recentActivities,
      pendingProposalCount,
      paymentSummary,
      projects,
      projectsWithProposals: mergedProjects,
      proposals,
      wishlistedFreelancers,
      wishlistedFreelancersCount: wishlistedFreelancers.length,
      refreshDashboardData,
      refreshWishlistedFreelancers,
      sessionUser,
      user,
      normalizedProjects,
      activeProjects,
      activeProjectCards,
      activeProjectCount: activeProjects.length,
      budgetDialogState,
      budgetDialogActions,
      completedProjects,
      completedProjectCount: completedProjects.length,
    }),
    [
      activeProjectCards,
      activeProjects,
      authFetch,
      budgetDialogActions,
      budgetDialogState,
      chatConversations,
      acceptedFreelancerSection,
      completedProjects,
      isAuthenticated,
      isLoading,
      normalizedProjects,
      progressProjects,
      recentActivities,
      paymentSummary,
      pendingProposalCount,
      projects,
      mergedProjects,
      proposals,
      wishlistedFreelancers,
      refreshDashboardData,
      refreshWishlistedFreelancers,
      sessionUser,
      user,
    ],
  );

  return (
    <ClientDashboardDataContext.Provider value={value}>
      {children}
    </ClientDashboardDataContext.Provider>
  );
};
