"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getSession } from "@/shared/lib/auth-storage";
import { useNotifications } from "@/shared/context/NotificationContext";
import FreelancerWorkspaceHeader from "@/components/features/freelancer/FreelancerWorkspaceHeader";

export const FreelancerTopBar = () => {
  const [sessionUser, setSessionUser] = useState(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();

  useEffect(() => {
    const session = getSession();
    setSessionUser(session?.user ?? null);
  }, []);

  const activeWorkspaceKey = useMemo(() => {
    if (pathname.startsWith("/freelancer/proposals")) return "proposals";
    if (pathname.startsWith("/freelancer/project")) return "projects";
    if (pathname.startsWith("/freelancer/messages")) return "messages";
    if (pathname.startsWith("/freelancer/payments")) return "payments";
    return "dashboard";
  }, [pathname]);
  const profile = useMemo(() => {
    const displayName =
      sessionUser?.fullName ||
      sessionUser?.name ||
      sessionUser?.email ||
      "Freelancer";

    return {
      name: displayName,
      avatar: sessionUser?.avatar || "",
      initial: String(displayName).charAt(0).toUpperCase(),
    };
  }, [sessionUser?.avatar, sessionUser?.email, sessionUser?.fullName, sessionUser?.name]);
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

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);

    if (notification.type === "chat" && notification.data) {
      const service = notification.data.service || "";
      const parts = service.split(":");
      let projectId = notification.data.projectId;

      if (!projectId && parts.length >= 4 && parts[0] === "CHAT") {
        projectId = parts[1];
      }

      if (projectId) {
        navigate(`/freelancer/messages?projectId=${projectId}`);
      } else {
        navigate("/freelancer/messages");
      }
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
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1536px] px-4 sm:px-6 lg:px-[40px] xl:w-[85%] xl:max-w-none">
      <FreelancerWorkspaceHeader
        profile={profile}
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
    </div>
  );
};

export default FreelancerTopBar;
