"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Bell from "lucide-react/dist/esm/icons/bell";
import Settings from "lucide-react/dist/esm/icons/settings";
import { Button } from "@/components/ui/button";
import { getSession } from "@/shared/lib/auth-storage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/shared/context/NotificationContext";
import { SidebarTrigger } from "@/components/ui/sidebar";

const resolveProjectIdFromNotification = (notification) => {
  const directProjectId = notification?.data?.projectId;
  if (directProjectId) return String(directProjectId);

  const service = String(notification?.data?.service || "");
  const parts = service.split(":");
  if (parts.length >= 4 && parts[0] === "CHAT") {
    return parts[1];
  }

  return "";
};

export const ManagerTopBar = () => {
  const navigate = useNavigate();
  const [sessionUser, setSessionUser] = useState(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();

  useEffect(() => {
    const session = getSession();
    setSessionUser(session?.user ?? null);
  }, []);

  const handleNotificationClick = useCallback(
    (notification) => {
      if (!notification) return;

      markAsRead(notification.id);

      const projectId = resolveProjectIdFromNotification(notification);
      const notificationType = String(notification.type || "").toLowerCase();

      if (notificationType === "chat") {
        navigate(
          projectId
            ? `/project-manager/messages?projectId=${projectId}`
            : "/project-manager/messages"
        );
        return;
      }

      if (
        notificationType === "proposal" ||
        notificationType === "meeting_scheduled" ||
        notificationType === "task_completed" ||
        notificationType === "task_verified" ||
        notificationType === "task_unverified" ||
        notificationType === "freelancer_change_resolved" ||
        notificationType === "admin_approval_required"
      ) {
        navigate(
          projectId
            ? `/project-manager/projects/${projectId}`
            : "/project-manager/projects"
        );
        return;
      }

      navigate(projectId ? `/project-manager/projects/${projectId}` : "/project-manager");
    },
    [markAsRead, navigate]
  );

  return (
    <div className="sticky top-0 z-40 flex min-h-16 w-full items-center justify-between gap-3 border-b border-border/40 bg-background/80 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8 md:h-16">
      <div className="flex items-center gap-2 lg:hidden">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
      </div>
      <div className="hidden flex-1 lg:block" />

      <div className="ml-auto flex min-w-0 items-center gap-3">
        <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-xs">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open notifications"
                className="relative h-8 w-8 rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 ? (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-background bg-destructive" />
                ) : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 rounded-2xl p-0 border-border bg-card shadow-lg">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h4 className="text-sm font-semibold text-foreground">Notifications</h4>
                {unreadCount > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs text-primary hover:bg-transparent hover:underline"
                    onClick={markAllAsRead}
                  >
                    Mark all as read
                  </Button>
                ) : null}
              </div>
              <ScrollArea className="h-72 [&_[data-slot=scroll-area-scrollbar]]:hidden">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-4 py-10 text-center text-muted-foreground">
                    <Bell className="mb-2 h-8 w-8 opacity-40" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {notifications.slice(0, 20).map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => handleNotificationClick(notification)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-muted/60 ${
                          !notification.read ? "bg-primary/5" : "bg-card"
                        }`}
                      >
                        <div
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                            !notification.read ? "bg-primary" : "bg-muted-foreground/30"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {notification.title}
                          </p>
                          <p className="line-clamp-2 text-xs text-muted-foreground mt-0.5">
                            {notification.message}
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
            aria-label="Open settings"
            onClick={() => navigate("/project-manager/profile")}
            className="h-8 w-8 rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        <div className="mx-1 hidden h-6 w-[1px] bg-border sm:block" />

        <button
          type="button"
          onClick={() => navigate("/project-manager/profile")}
          className="group flex min-w-0 items-center gap-3 rounded-full py-1 pl-2 pr-1 transition-colors hover:bg-muted/60"
        >
          <div className="hidden min-w-0 flex-col items-end text-right sm:flex">
            <span className="text-sm font-semibold leading-tight text-foreground truncate max-w-[160px]">
              {sessionUser?.fullName || "Project Manager"}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Management Portal
            </span>
          </div>
          <Avatar className="h-9 w-9 rounded-full border border-border shadow-xs transition-transform group-hover:scale-105">
            <AvatarImage src={sessionUser?.avatar} />
            <AvatarFallback className="bg-primary text-[11px] font-bold uppercase text-primary-foreground">
              {sessionUser?.fullName?.split(" ").map((name) => name[0]).join("") || "PM"}
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
    </div>
  );
};
