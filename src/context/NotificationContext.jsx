"use client";

import PropTypes from "prop-types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef
} from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { SOCKET_IO_URL, SOCKET_OPTIONS, SOCKET_ENABLED, request as apiClient } from "@/lib/api-client";
import { requestNotificationPermission, onForegroundMessage } from "@/lib/firebase";

const NotificationContext = createContext(null);
NotificationContext.displayName = "NotificationContext";

// Maximum notifications to store
const MAX_NOTIFICATIONS = 50;

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [proposalUnreadCount, setProposalUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [fcmToken, setFcmToken] = useState(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const connectedRef = useRef(false);
  const fcmListenerRef = useRef(null);

  // Add a new notification
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: notification.id || `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type: notification.type || "general",
      title: notification.title || "Notification",
      message: notification.message || "",
      read: false,
      createdAt: notification.createdAt || new Date().toISOString(),
      data: notification.data || {}
    };

    setNotifications((prev) => {
      // Deduplicate: If we already have a notification with this ID, ignore it
      if (newNotification.id && prev.some(n => n.id === newNotification.id)) {
        return prev;
      }
      const updated = [newNotification, ...prev].slice(0, MAX_NOTIFICATIONS);
      return updated;
    });
    setUnreadCount((prev) => prev + 1);
    // Track chat-specific notifications for Messages badge
    if (notification.type === "chat") {
      setChatUnreadCount((prev) => prev + 1);
    }
    // Track proposal-specific notifications
    if (notification.type === "proposal") {
      setProposalUnreadCount((prev) => prev + 1);
    }
  }, []);

  // Remove a notification when clicked/read
  const markAsRead = useCallback(async (notificationId) => {
    // Optimistically remove from UI
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await apiClient(`/notifications/${notificationId}/read`, { method: "PATCH" });
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    // Optimistically clear all
    setNotifications([]);
    setUnreadCount(0);
    setChatUnreadCount(0);
    setProposalUnreadCount(0);

    try {
      await apiClient("/notifications/read-all", { method: "PATCH" });
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    setChatUnreadCount(0);
    setProposalUnreadCount(0);
  }, []);

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
            body: JSON.stringify({ fcmToken: token })
          });
          console.log("[Notification] FCM token saved to backend");
          
          // Show local confirmation
          addNotification({
            type: "system",
            title: "Notifications Enabled",
            message: "You will now receive updates on this device.",
            createdAt: new Date().toISOString()
          });
          toast.success("Notifications enabled successfully");
        } catch (saveError) {
          console.error("[Notification] Failed to save FCM token to backend:", saveError);
        }
        
        return token;
      } else {
        // Token null means permission denied or error
        if (Notification.permission === 'denied') {
          toast.error("Notifications are blocked", {
            description: "Please enable notifications for this site in your browser settings (click the lock icon in address bar)."
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
  }, []);

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
          data: payload.data || {}
        });
      }
    });

    return () => {
      fcmListenerRef.current = null;
    };
  }, [pushEnabled, addNotification]);

  // Check initial push permission state
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushEnabled(Notification.permission === 'granted');
    }
  }, []);

  // Fetch initial notifications
  useEffect(() => {
    if (!isAuthenticated) return;

      const fetchNotifications = async () => {
      try {
        const data = await apiClient("/notifications");
        
        // User wants notifications to be "one time" (removed when read)
        // So we only filter unread ones
        setNotifications((data.notifications || []).filter(n => !n.read));
        setUnreadCount(data.unreadCount || 0);
        setChatUnreadCount(data.chatUnreadCount || 0);
        setProposalUnreadCount(data.proposalUnreadCount || 0);
      } catch (error) {
        console.error("[Notification] Failed to fetch notifications:", error);
      }
    };

    fetchNotifications();
  }, [isAuthenticated]);

  // Connect to socket.io for real-time notifications
  useEffect(() => {
    console.log("[Notification] Checking connection prerequisites:", {
      SOCKET_ENABLED,
      SOCKET_IO_URL,
      isAuthenticated,
      userId: user?.id
    });

    if (!SOCKET_ENABLED || !SOCKET_IO_URL || !isAuthenticated || !user?.id) {
      console.log("[Notification] Prerequisites not met, skipping socket connection");
      return;
    }

    // Avoid double connections
    if (connectedRef.current) {
      console.log("[Notification] Already connected, skipping");
      return;
    }

    console.log("[Notification] Connecting to:", SOCKET_IO_URL, "with userId:", user.id, "type:", typeof user.id);
    
    const newSocket = io(SOCKET_IO_URL, {
      ...SOCKET_OPTIONS,
      query: { userId: user.id }
    });

    setSocket(newSocket);
    connectedRef.current = true;

    newSocket.on("connect", () => {
      console.log("[Notification] ✅ Socket connected! Socket ID:", newSocket.id);
      // Removed notification:join since we use Firebase Cloud Messaging now
    });

    // Listen for room join confirmation
    newSocket.on("notification:joined", ({ room, userId }) => {
      // Legacy - kept to prevent errors if server still emits it
      console.log(`[Notification] 🎉 Successfully joined room: ${room} for user: ${userId}`);
    });

    newSocket.on("disconnect", () => {
      console.log("[Notification] Socket disconnected");
      connectedRef.current = false;
    });

    newSocket.on("notification:new", (notification) => {
      console.log("[Notification] 📨 Socket notification received:", notification);
      addNotification(notification);
    });
    
    // NOTE: chat:message listener REMOVED from here - chat messages are handled by Chat components 
    // and notifications for new messages come via Firebase Push Notifications


    newSocket.on("connect_error", (error) => {
      console.error("[Notification] Connection error:", error.message);
    });

    return () => {
      newSocket.disconnect();
      setSocket(null);
      connectedRef.current = false;
    };
  }, [isAuthenticated, user?.id, user?.role, addNotification]);

  // Function to mark chat notifications as read (when opening Messages)
  const markChatAsRead = useCallback(() => {
    setChatUnreadCount(0);
  }, []);

  // Function to mark proposal notifications as read
  const markProposalsAsRead = useCallback(() => {
    setProposalUnreadCount(0);
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      chatUnreadCount,
      proposalUnreadCount,
      socket,
      fcmToken,
      pushEnabled,
      addNotification,
      markAsRead,
      markAllAsRead,
      markChatAsRead,
      markProposalsAsRead,
      clearAll,
      requestPushPermission
    }),
    [notifications, unreadCount, chatUnreadCount, proposalUnreadCount, socket, fcmToken, pushEnabled, addNotification, markAsRead, markAllAsRead, markChatAsRead, markProposalsAsRead, clearAll, requestPushPermission]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }

  return context;
};

export { NotificationContext };

