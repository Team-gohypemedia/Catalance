"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getSession } from "@/shared/lib/auth-storage";
import { useNotifications } from "@/shared/context/NotificationContext";
import { DashboardHeader } from "@/components/layout/GlobalDashboardHeader";

export const FreelancerTopBar = ({ label }) => {
  const [sessionUser, setSessionUser] = useState(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();

  useEffect(() => {
    const session = getSession();
    setSessionUser(session?.user ?? null);
  }, []);

  const computedLabel = useMemo(() => {
    if (label) return label;
    if (pathname.startsWith("/freelancer/profile")) return "Profile";
    if (pathname.startsWith("/freelancer/proposals")) return "Proposals";
    if (pathname.startsWith("/freelancer/messages")) return "Messages";
    if (pathname.startsWith("/freelancer/project/")) return "Project Detail";
    if (pathname.startsWith("/freelancer/project")) return "Projects";
    return "Dashboard";
  }, [label, pathname]);

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
    <DashboardHeader
      userName={sessionUser?.fullName}
      tabLabel={computedLabel}
      notifications={notifications}
      unreadCount={unreadCount}
      markAllAsRead={markAllAsRead}
      handleNotificationClick={handleNotificationClick}
    />
  );
};

export default FreelancerTopBar;
