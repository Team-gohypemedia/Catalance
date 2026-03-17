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
    <div className="sticky top-0 z-50 flex h-20 w-full items-center justify-between border-b border-slate-100 bg-white/80 px-4 backdrop-blur-md">
      <div className="w-full max-w-xl" />

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-[7px] border border-slate-100 bg-slate-50/50 p-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open notifications"
                className="relative h-9 w-9 rounded-[7px] border-0 bg-transparent text-slate-500 transition-all hover:bg-white hover:text-blue-600 hover:shadow-sm"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 ? (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-rose-500" />
                ) : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <h4 className="text-sm font-semibold text-slate-900">Notifications</h4>
                {unreadCount > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs text-blue-600 hover:bg-transparent hover:text-blue-700"
                    onClick={markAllAsRead}
                  >
                    Mark all as read
                  </Button>
                ) : null}
              </div>
              <ScrollArea className="h-72">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-4 py-10 text-center text-slate-400">
                    <Bell className="mb-2 h-8 w-8 opacity-40" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.slice(0, 20).map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => handleNotificationClick(notification)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${
                          !notification.read ? "bg-blue-50/50" : "bg-white"
                        }`}
                      >
                        <div
                          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                            !notification.read ? "bg-blue-600" : "bg-slate-200"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {notification.title}
                          </p>
                          <p className="line-clamp-2 text-xs text-slate-500">
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
            className="h-9 w-9 rounded-[7px] border-0 bg-transparent text-slate-500 transition-all hover:bg-white hover:text-blue-600 hover:shadow-sm"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>

        <div className="mx-2 h-8 w-[1px] bg-slate-100" />

        <button
          type="button"
          onClick={() => navigate("/project-manager/profile")}
          className="group flex items-center gap-3 pl-2"
        >
          <div className="flex flex-col items-end text-right">
            <span className="text-sm font-bold leading-none text-slate-900">
              {sessionUser?.fullName || "Project Manager"}
            </span>
            <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Management Portal
            </span>
          </div>
          <Avatar className="h-11 w-11 rounded-2xl border-2 border-white shadow-md ring-1 ring-slate-100 transition-transform group-hover:scale-105">
            <AvatarImage src={sessionUser?.avatar} />
            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-[10px] font-bold uppercase text-white">
              {sessionUser?.fullName?.split(" ").map((name) => name[0]).join("") || "PM"}
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
    </div>
  );
};
