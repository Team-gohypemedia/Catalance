import React, { memo, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ClientWorkspaceHeader from "@/components/features/client/ClientWorkspaceHeader";
import { useNotifications } from "@/shared/context/NotificationContext";
import { useOptionalClientDashboardData } from "./useClientDashboardData.js";

const siteRoutes = {
  home: "/",
  marketplace: "/marketplace",
  service: "/service",
  contact: "/contact",
};

const workspaceRoutes = {
  dashboard: "/client",
  proposals: "/client/proposal",
  projects: "/client/project",
  messages: "/client/messages",
  payments: "/client/payments",
  profile: "/client/profile",
  freelancers: "/marketplace",
};

const ClientDashboardHeader = memo(function ClientDashboardHeader() {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const dashboardData = useOptionalClientDashboardData();
  const sessionUser = dashboardData?.sessionUser ?? null;

  const profile = useMemo(
    () => ({
      name: sessionUser?.fullName || sessionUser?.name || "Client",
      email: sessionUser?.email || "",
      avatar: sessionUser?.avatar || "",
      initial:
        (sessionUser?.fullName ||
          sessionUser?.name ||
          sessionUser?.email ||
          "C")
          .charAt(0)
          .toUpperCase(),
    }),
    [sessionUser?.avatar, sessionUser?.email, sessionUser?.fullName, sessionUser?.name],
  );

  const handleSiteNav = useCallback(
    (key) => {
      navigate(siteRoutes[key] || "/");
    },
    [navigate],
  );

  const handleWorkspaceNav = useCallback(
    (key) => {
      navigate(workspaceRoutes[key] || "/client");
    },
    [navigate],
  );

  const handleOpenMessages = useCallback(() => {
    navigate("/client/messages");
  }, [navigate]);

  return (
    <ClientWorkspaceHeader
      profile={profile}
      activeWorkspaceKey="dashboard"
      unreadCount={unreadCount}
      onSiteNav={handleSiteNav}
      onWorkspaceNav={handleWorkspaceNav}
      primaryActionLabel="New Proposal"
      primaryActionTo="/service"
      onOpenNotifications={handleOpenMessages}
    />
  );
});

export default ClientDashboardHeader;
