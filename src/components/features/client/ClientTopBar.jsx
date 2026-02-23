"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getSession } from "@/shared/lib/auth-storage";
import { useNotifications } from "@/shared/context/NotificationContext";
import { DashboardHeader } from "@/components/layout/GlobalDashboardHeader";

export const ClientTopBar = ({ label, title }) => {
  const [sessionUser, setSessionUser] = useState(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();

  useEffect(() => {
    const session = getSession();
    setSessionUser(session?.user ?? null);
  }, []);

  const explicitLabel = String(label || title || "").trim();

  const computedLabel = useMemo(() => {
    if (explicitLabel) return explicitLabel;
    if (pathname.startsWith("/client/profile")) return "Profile";
    if (pathname.startsWith("/client/proposal/drafts")) return "Proposal Drafts";
    if (pathname.startsWith("/client/proposal")) return "Proposals";
    if (pathname.startsWith("/client/messages")) return "Messages";
    if (pathname.startsWith("/client/project/")) return "Project Detail";
    if (pathname.startsWith("/client/project")) return "Projects";
    return "Dashboard";
  }, [explicitLabel, pathname]);

  const actionButtonLabel = "Projects";
  const actionButtonPath = "/client/project";
  const showProposalButton = true;

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
        navigate(`/client/messages?projectId=${projectId}`);
      } else {
        navigate("/client/messages");
      }
      return;
    }

    if (notification.type === "proposal") {
      navigate("/client/proposal");
      return;
    }

    if (
      (notification.type === "task_completed" ||
        notification.type === "task_verified") &&
      notification.data?.projectId
    ) {
      navigate(`/client/project/${notification.data.projectId}`);
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
      proposalLabel={actionButtonLabel}
      proposalPath={actionButtonPath}
      showProposalButton={showProposalButton}
    />
  );
};

export default ClientTopBar;
