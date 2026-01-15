"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Bell from "lucide-react/dist/esm/icons/bell";
import BellRing from "lucide-react/dist/esm/icons/bell-ring";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import PanelLeftClose from "lucide-react/dist/esm/icons/panel-left-close";
import PanelLeftOpen from "lucide-react/dist/esm/icons/panel-left-open";
import Sun from "lucide-react/dist/esm/icons/sun";
import Moon from "lucide-react/dist/esm/icons/moon";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { useTheme } from "@/components/providers/theme-provider";
import { getSession } from "@/shared/lib/auth-storage";
import { useNotifications } from "@/shared/context/NotificationContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Notepad } from "@/components/ui/notepad";

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

export const ClientTopBar = ({ label, interactive = true }) => {
  const { state, toggleSidebar } = useSidebar();
  const { theme, setTheme } = useTheme();
  const [sessionUser, setSessionUser] = useState(null);
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    pushEnabled,
    requestPushPermission,
  } = useNotifications();

  useEffect(() => {
    const session = getSession();
    setSessionUser(session?.user ?? null);
  }, []);

  const roleLabel = useMemo(() => {
    const baseRole = sessionUser?.role ?? "CLIENT";
    const normalized = baseRole.toLowerCase();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }, [sessionUser]);

  const computedLabel = useMemo(() => {
    if (label) {
      return label;
    }
    const fullName = sessionUser?.fullName?.trim();
    if (fullName) {
      return `${fullName}'s dashboard`;
    }
    return `${roleLabel} dashboard`;
  }, [label, sessionUser, roleLabel]);

  const sidebarClosed = state === "collapsed";
  const SidebarToggleIcon = sidebarClosed ? PanelLeftOpen : PanelLeftClose;
  const isDarkMode = theme === "dark";
  const ThemeIcon = isDarkMode ? Sun : Moon;

  const toggleTheme = () => {
    if (!interactive) return;
    setTheme(isDarkMode ? "light" : "dark");
  };

  const handleSidebarToggle = () => {
    if (!interactive) return;
    toggleSidebar();
  };

  const handleEnablePush = async () => {
    await requestPushPermission();
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    // Navigate based on notification type
    if (notification.type === "chat" && notification.data) {
      // Chat notification logic
      // Service string format: CHAT:projectId:clientId:freelancerId
      const service = notification.data.service || "";
      const parts = service.split(":");
      let projectId = notification.data.projectId;

      // Extract projectId from service string if not explicitly in data
      if (!projectId && parts.length >= 4 && parts[0] === "CHAT") {
        projectId = parts[1];
      }

      if (projectId) {
        navigate(`/client/messages?projectId=${projectId}`);
      } else {
        // Fallback or just go to messages
        navigate("/client/messages");
      }
    } else if (notification.type === "proposal") {
      // For proposal acceptance/updates, go to the proposal page
      navigate("/client/proposal");
    } else if (
      (notification.type === "task_completed" ||
        notification.type === "task_verified") &&
      notification.data?.projectId
    ) {
      // Task notifications - navigate to project detail
      navigate(`/client/project/${notification.data.projectId}`);
    }
  };

  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full border border-border text-muted-foreground hover:text-foreground disabled:opacity-60"
        onClick={handleSidebarToggle}
        disabled={!interactive}
      >
        <SidebarToggleIcon className="size-4" />
        <span className="sr-only">
          {sidebarClosed ? "Open navigation" : "Close navigation"}
        </span>
      </Button>
      <div className="flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium text-muted-foreground">
        <span className="truncate">{computedLabel}</span>
        <ChevronRight className="size-3.5" />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Notepad Feature */}
        <Notepad />

        {/* Notification Bell with Badge */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="relative rounded-full border border-border text-muted-foreground hover:text-foreground disabled:opacity-60"
              disabled={!interactive}
              aria-label="Notifications"
            >
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <Badge className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white border-0">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h4 className="text-sm font-semibold">Notifications</h4>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                  onClick={markAllAsRead}
                >
                  Mark all as read
                </Button>
              )}
            </div>

            {/* Enable Push Notifications Banner - Required for Firebase Messaging */}
            {/* Enable Push Notifications Banner - Removed per user request */}

            <ScrollArea className="h-72">
              {notifications.filter(
                (n) =>
                  !(
                    sessionUser?.role === "CLIENT" &&
                    n.type === "proposal" &&
                    (n.title?.includes("Invite Received") ||
                      n.message?.includes("by the client") ||
                      n.message?.includes("from a client"))
                  )
              ).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <Bell className="mb-2 h-8 w-8 opacity-40" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications
                    .filter(
                      (n) =>
                        !(
                          sessionUser?.role === "CLIENT" &&
                          n.type === "proposal" &&
                          (n.title?.includes("Invite Received") ||
                            n.message?.includes("by the client") ||
                            n.message?.includes("from a client"))
                        )
                    )
                    .slice(0, 20)
                    .map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-muted/50 ${
                          !notification.read ? "bg-primary/5" : ""
                        }`}
                      >
                        <div
                          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                            !notification.read ? "bg-primary" : "bg-transparent"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {notification.message}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground/70">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full border border-border text-muted-foreground hover:text-foreground disabled:opacity-60"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          disabled={!interactive}
        >
          <ThemeIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
};

export default ClientTopBar;
