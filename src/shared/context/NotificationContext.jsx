"use client";

import PropTypes from "prop-types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { useOptionalAuth } from "@/shared/context/AuthContext";
import {
  SOCKET_IO_URL,
  SOCKET_OPTIONS,
  SOCKET_ENABLED,
  request as apiClient,
} from "@/shared/lib/api-client";
import {
  requestNotificationPermission,
  onForegroundMessage,
} from "@/shared/lib/firebase";
import { MARKETPLACE_CHAT_UPDATED_EVENT } from "@/shared/lib/marketplace-chat-requests";

const NotificationContext = createContext(null);
NotificationContext.displayName = "NotificationContext";

// Maximum notifications to store
const MAX_NOTIFICATIONS = 50;

const normalizeNotificationAudience = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (!normalized) return null;
  if (["client", "owner", "customer"].includes(normalized)) return "client";
  if (["freelancer", "contractor"].includes(normalized)) return "freelancer";

  return null;
};

const getAudienceFromPathname = (pathname = "") => {
  if (pathname.startsWith("/client")) return "client";
  if (pathname.startsWith("/freelancer")) return "freelancer";

  return null;
};

const inferChatAudience = (notification, currentUserId) => {
  const service = String(notification?.data?.service || "");
  const parts = service.split(":");

  if (parts[0] !== "CHAT") {
    return null;
  }

  if (parts.length >= 4) {
    const clientId = String(parts[2] || "");
    const freelancerId = String(parts[3] || "");
    const normalizedUserId = String(currentUserId || "");

    if (
      normalizedUserId &&
      clientId &&
      freelancerId &&
      clientId !== freelancerId
    ) {
      if (normalizedUserId === clientId) return "client";
      if (normalizedUserId === freelancerId) return "freelancer";
    }
  }

  return null;
};

const inferProposalAudience = (notification) => {
  const title = String(notification?.title || "")
    .trim()
    .toLowerCase();
  const message = String(notification?.message || "")
    .trim()
    .toLowerCase();
  const status = String(notification?.data?.status || "")
    .trim()
    .toUpperCase();

  if (
    title.includes("new proposal application") ||
    title.includes("proposal rejected by freelancer") ||
    title.includes("your proposal is still pending") ||
    title.includes("proposal expired")
  ) {
    return "client";
  }

  if (
    message.includes("pay the initial 20%") ||
    message.includes("has accepted your proposal")
  ) {
    return "client";
  }

  if (
    title.includes("new proposal received") ||
    title.includes("proposal update") ||
    title.includes("proposal rejected") ||
    title.includes("project assignment updated") ||
    title.includes("you were assigned")
  ) {
    return "freelancer";
  }

  if (
    message.includes("your proposal for") ||
    message.includes("you have been assigned") ||
    message.includes("another proposal was accepted")
  ) {
    return "freelancer";
  }

  if (status === "REPLACED") {
    return "freelancer";
  }

  if (status === "ACCEPTED" && message.includes("congratulations")) {
    return "freelancer";
  }

  return null;
};

const inferNotificationAudience = (notification, currentUserId) => {
  const explicitAudience =
    normalizeNotificationAudience(notification?.audience) ||
    normalizeNotificationAudience(notification?.data?.audience) ||
    normalizeNotificationAudience(notification?.data?.dashboard) ||
    normalizeNotificationAudience(notification?.data?.targetDashboard) ||
    normalizeNotificationAudience(notification?.data?.recipientRole) ||
    normalizeNotificationAudience(notification?.data?.recipientAudience);

  if (explicitAudience) {
    return explicitAudience;
  }

  const type = String(notification?.type || "")
    .trim()
    .toLowerCase();

  if (type === "chat") {
    return inferChatAudience(notification, currentUserId);
  }

  if (type === "proposal" || type === "proposal_expired") {
    return inferProposalAudience(notification) || (type === "proposal_expired" ? "client" : null);
  }

  if (type === "task_completed") {
    return "client";
  }

  if (type === "budget_suggestion") {
    return "client";
  }

  if (
    type === "task_verified" ||
    type === "task_unverified" ||
    type === "payment" ||
    type === "freelancer_review"
  ) {
    return "freelancer";
  }

  if (type === "freelancer_change_resolved") {
    return "client";
  }

  if (type === "marketplace_request_accepted") {
    return "client";
  }

  if (type === "marketplace_request") {
    const marketplaceStatus = String(notification?.data?.requestStatus || "").trim().toLowerCase();
    if (marketplaceStatus === "accepted") {
      return "client";
    }
  }

  return null;
};

const notificationMatchesAudience = (notification, audience, currentUserId) => {
  if (!audience) {
    return true;
  }

  const resolvedAudience = inferNotificationAudience(notification, currentUserId);

  if (!resolvedAudience) {
    return true;
  }

  return resolvedAudience === audience;
};

const resolveNotificationDestination = (notification, activeAudience = null) => {
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

  const type = String(notification?.type || "")
    .trim()
    .toLowerCase();
  const projectId = String(
    notification?.data?.projectId || notification?.data?.syncedProjectId || "",
  ).trim();

  if (type === "chat") {
    const service = String(notification?.data?.service || "");
    const parts = service.split(":");
    let chatProjectId = projectId;

    if (!chatProjectId && parts.length >= 4 && parts[0] === "CHAT") {
      chatProjectId = parts[1];
    }

    return chatProjectId
      ? `/${activeAudience || "client"}/messages?projectId=${encodeURIComponent(chatProjectId)}`
      : `/${activeAudience || "client"}/messages`;
  }

  if (
    type === "proposal" ||
    type === "proposal_followup" ||
    type === "budget_suggestion" ||
    type === "proposal_expired"
  ) {
    if (String(notification?.data?.status || "").trim().toUpperCase() === "ACCEPTED" && projectId) {
      return `/${activeAudience || "client"}/project/${encodeURIComponent(projectId)}`;
    }

    return activeAudience === "freelancer"
      ? "/freelancer/proposals"
      : projectId
        ? `/client/proposal?projectId=${encodeURIComponent(projectId)}`
        : "/client/proposal";
  }

  if (
    type === "marketplace_request_accepted" ||
    (type === "marketplace_request" &&
      String(notification?.data?.requestStatus || "").trim().toLowerCase() === "accepted")
  ) {
    return `/${activeAudience || "client"}/messages`;
  }

  if (
    type === "task_completed" ||
    type === "task_verified" ||
    type === "task_unverified" ||
    type === "freelancer_change_resolved"
  ) {
    return projectId
      ? `/${activeAudience || "client"}/project/${encodeURIComponent(projectId)}`
      : `/${activeAudience || "client"}/project`;
  }

  return `/${activeAudience || "client"}`;
};
export const NotificationProvider = ({ children }) => {
  const auth = useOptionalAuth();
  const user = auth?.user ?? null;
  const isAuthenticated = Boolean(auth?.isAuthenticated);
  const isLoading = Boolean(auth?.isLoading);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);
  const [fcmToken, setFcmToken] = useState(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const connectedRef = useRef(false);
  const fcmListenerRef = useRef(null);
  const activeAudience = useMemo(
    () => getAudienceFromPathname(pathname),
    [pathname],
  );
  const isOnboardingPath = useMemo(
    () => String(pathname || "").includes("/onboarding"),
    [pathname],
  );

  // Add a new notification
  const addNotification = useCallback((notification) => {
    const audience =
      normalizeNotificationAudience(notification?.audience) ||
      normalizeNotificationAudience(notification?.data?.audience);

    const newNotification = {
      id:
        notification.id ||
        `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type: notification.type || "general",
      title: notification.title || "Notification",
      message: notification.message || "",
      read: Boolean(notification.read),
      createdAt: notification.createdAt || new Date().toISOString(),
      audience,
      data: audience
        ? { ...(notification.data || {}), audience }
        : notification.data || {},
    };

    setNotifications((prev) => {
      // Deduplicate: If we already have a notification with this ID, ignore it
      if (newNotification.id && prev.some((n) => n.id === newNotification.id)) {
        return prev;
      }
      const updated = [newNotification, ...prev].slice(0, MAX_NOTIFICATIONS);
      return updated;
    });

    if (newNotification.type !== "system") {
      const destinationUrl = resolveNotificationDestination(newNotification, activeAudience);

      toast(newNotification.title, {
        id: newNotification.id,
        description: newNotification.message,
        onClick: destinationUrl ? () => navigate(destinationUrl) : undefined,
      });
    }
  }, [navigate, activeAudience]);

  // Mark a notification as read while keeping it visible in the list
  const markAsRead = useCallback(async (notificationId) => {
    // Optimistically update the read state and unread counters
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === notificationId);

      if (target && !target.read) {
        return prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification,
        );
      }
      return prev;
    });

    try {
      await apiClient(`/notifications/${notificationId}/read`, {
        method: "PATCH",
      });
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    const notificationIdsToMark = notifications
      .filter(
        (notification) =>
          !notification.read &&
          notificationMatchesAudience(notification, activeAudience, user?.id),
      )
      .map((notification) => notification.id)
      .filter(Boolean);

    if (!notificationIdsToMark.length) {
      return;
    }

    setNotifications((prev) =>
      prev.map((notification) =>
        notificationIdsToMark.includes(notification.id)
          ? { ...notification, read: true }
          : notification,
      ),
    );

    try {
      await Promise.allSettled(
        notificationIdsToMark.map((notificationId) =>
          apiClient(`/notifications/${notificationId}/read`, {
            method: "PATCH",
          }),
        ),
      );
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  }, [activeAudience, notifications, user?.id]);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const markTypeAsRead = useCallback(async (type) => {
    const normalizedType = String(type || "").trim().toLowerCase();
    if (!normalizedType) return;

    const notificationIdsToMark = notifications
      .filter((notification) => {
        const isTargetType =
          String(notification.type || "").toLowerCase() === normalizedType;
        const matchesAudience = notificationMatchesAudience(
          notification,
          activeAudience,
          user?.id,
        );

        return !notification.read && isTargetType && matchesAudience;
      })
      .map((notification) => notification.id)
      .filter(Boolean);

    if (!notificationIdsToMark.length) {
      return;
    }

    setNotifications((prev) =>
      prev.map((notification) =>
        notificationIdsToMark.includes(notification.id)
          ? { ...notification, read: true }
          : notification,
      ),
    );

    try {
      await Promise.allSettled(
        notificationIdsToMark.map((notificationId) =>
          apiClient(`/notifications/${notificationId}/read`, {
            method: "PATCH",
          }),
        ),
      );
    } catch (error) {
      console.error(`Failed to mark ${normalizedType} notifications as read`, error);
    }
  }, [activeAudience, notifications, user?.id]);

  // Request push notification permission
  const requestPushPermission = useCallback(async () => {
    try {
      const token = await requestNotificationPermission();
      if (token) {
        setFcmToken(token);
        setPushEnabled(true);
        console.log("[Notification] FCM token obtained:", token);

        // Save token to backend for push notifications
        try {
          await apiClient("/profile/fcm-token", {
            method: "POST",
            body: JSON.stringify({ fcmToken: token }),
          });
          console.log("[Notification] FCM token saved to backend");

          // Show local confirmation
          addNotification({
            type: "system",
            title: "Notifications Enabled",
            message: "You will now receive updates on this device.",
            createdAt: new Date().toISOString(),
          });
          toast.success("Notifications enabled successfully");
        } catch (saveError) {
          console.error(
            "[Notification] Failed to save FCM token to backend:",
            saveError,
          );
        }

        return token;
      } else {
        // Token null means permission denied or error
        if (Notification.permission === "denied") {
          toast.error("Notifications are blocked", {
            description:
              "Please enable notifications for this site in your browser settings (click the lock icon in address bar).",
          });
        } else {
          toast.error("Could not enable notifications");
        }
        return null;
      }
    } catch (error) {
      console.error("[Notification] Error requesting push permission:", error);
      toast.error("Failed to request permission");
      return null;
    }
  }, [addNotification]);

  // Set up FCM foreground message listener
  useEffect(() => {
    if (!pushEnabled || fcmListenerRef.current) return;

    fcmListenerRef.current = onForegroundMessage((payload) => {
      console.log("[Notification] FCM foreground message:", payload);

      if (payload.notification) {
        // Extract type from data payload if available, otherwise default to "push"
        const notificationType = payload.data?.type || "push";

        addNotification({
          type: notificationType,
          title: payload.notification.title,
          message: payload.notification.body,
          data: payload.data || {},
        });
      }
    });

    return () => {
      fcmListenerRef.current = null;
    };
  }, [pushEnabled, addNotification]);

  // Check initial push permission state
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushEnabled(Notification.permission === "granted");
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    // Wait for auth to finish loading before fetching notifications.
    // This prevents 401 errors when the token is being verified.
    if (isOnboardingPath || !isAuthenticated || isLoading) return;

    try {
      const data = await apiClient("/notifications");
      setNotifications(data.notifications || []);
    } catch (error) {
      // Silently ignore 401 errors - user is not authenticated or session expired
      if (
        error.message?.includes("401") ||
        error.message?.includes("expired") ||
        error.message?.includes("Invalid")
      ) {
        return;
      }
      console.error("[Notification] Failed to fetch notifications:", error);
    }
  }, [isAuthenticated, isLoading, isOnboardingPath]);

  // Fetch initial notifications
  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  useEffect(() => {
    if (!isAuthenticated || isLoading || isOnboardingPath) {
      return undefined;
    }

    const handleMarketplaceChatUpdated = () => {
      refreshNotifications();
    };

    window.addEventListener(MARKETPLACE_CHAT_UPDATED_EVENT, handleMarketplaceChatUpdated);

    return () => {
      window.removeEventListener(MARKETPLACE_CHAT_UPDATED_EVENT, handleMarketplaceChatUpdated);
    };
  }, [isAuthenticated, isLoading, isOnboardingPath, refreshNotifications]);
  // Connect to socket.io for real-time notifications
  useEffect(() => {
    if (
      isOnboardingPath ||
      !SOCKET_ENABLED ||
      !SOCKET_IO_URL ||
      !isAuthenticated ||
      !user?.id
    ) {
      return;
    }

    // Avoid double connections
    if (connectedRef.current) {
      return;
    }

    const newSocket = io(SOCKET_IO_URL, {
      ...SOCKET_OPTIONS,
      query: { userId: user.id },
    });

    setSocket(newSocket);
    connectedRef.current = true;

    newSocket.on("connect", () => {
      // Removed notification:join since we use Firebase Cloud Messaging now
    });

    // Listen for room join confirmation
    newSocket.on("notification:joined", ({ room, userId }) => {
      // Legacy - kept to prevent errors if server still emits it
      void room;
      void userId;
    });

    newSocket.on("disconnect", () => {
      connectedRef.current = false;
    });

    newSocket.on("notification:new", (notification) => {
      addNotification(notification);
    });

    newSocket.on("chat:message", (message) => {
      if (!message || (message.senderId && String(message.senderId) === String(user?.id))) {
        return;
      }
      
      addNotification({
        id: `chat-${message.id || Date.now()}`,
        type: "chat",
        title: "New Message",
        message: `${message.senderName || "Someone"}: ${message.content || "Sent an attachment"}`,
        data: {
          projectId: message.conversationId,
          service: message.service || message.serviceKey || "",
          audience: message.senderRole === "CLIENT" ? "freelancer" : "client",
        }
      });
    });
    newSocket.on("connect_error", (error) => {
      console.error("[Notification] Connection error:", error.message);
    });

    return () => {
      newSocket.disconnect();
      setSocket(null);
      connectedRef.current = false;
    };
  }, [isAuthenticated, isOnboardingPath, user?.id, user?.role, addNotification]);

  // Function to mark chat notifications as read (when opening Messages)
  const markChatAsRead = useCallback(() => {
    return markTypeAsRead("chat");
  }, [markTypeAsRead]);

  // Function to mark proposal notifications as read
  const markProposalsAsRead = useCallback(() => {
    return markTypeAsRead("proposal");
  }, [markTypeAsRead]);

  const scopedNotifications = useMemo(() => {
    if (!activeAudience) {
      return notifications;
    }

    return notifications.filter((notification) =>
      notificationMatchesAudience(notification, activeAudience, user?.id),
    );
  }, [activeAudience, notifications, user?.id]);

  const unreadCount = useMemo(
    () => scopedNotifications.filter((notification) => !notification.read).length,
    [scopedNotifications],
  );

  const chatUnreadCount = useMemo(
    () =>
      scopedNotifications.filter(
        (notification) =>
          !notification.read &&
          String(notification.type || "").toLowerCase() === "chat",
      ).length,
    [scopedNotifications],
  );

  const proposalUnreadCount = useMemo(
    () =>
      scopedNotifications.filter(
        (notification) =>
          !notification.read &&
          String(notification.type || "").toLowerCase() === "proposal",
      ).length,
    [scopedNotifications],
  );

  const allUnreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const value = useMemo(
    () => ({
      notifications: scopedNotifications,
      unreadCount,
      chatUnreadCount,
      proposalUnreadCount,
      allNotifications: notifications,
      allUnreadCount,
      activeAudience,
      socket,
      fcmToken,
      pushEnabled,
      addNotification,
      markAsRead,
      markAllAsRead,
      markChatAsRead,
      markProposalsAsRead,
      clearAll,
      refreshNotifications,
      requestPushPermission,
    }),
    [
      scopedNotifications,
      unreadCount,
      chatUnreadCount,
      proposalUnreadCount,
      notifications,
      allUnreadCount,
      activeAudience,
      socket,
      fcmToken,
      pushEnabled,
      addNotification,
      markAsRead,
      markAllAsRead,
      markChatAsRead,
      markProposalsAsRead,
      clearAll,
      refreshNotifications,
      requestPushPermission,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    console.warn("useNotifications was called outside a NotificationProvider. Returning fallback notifications.");
    return {
      notifications: [],
      unreadCount: 0,
      markAsRead: () => {},
      markAllAsRead: () => {},
      removeNotification: () => {},
      clearNotifications: () => {},
      refreshNotifications: () => {},
      socket: null,
      loading: false,
    };
  }

  return context;
};

export { NotificationContext };






