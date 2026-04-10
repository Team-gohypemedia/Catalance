"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getSession } from "@/shared/lib/auth-storage";
import { useNotifications } from "@/shared/context/NotificationContext";
import FreelancerWorkspaceHeader from "@/components/features/freelancer/FreelancerWorkspaceHeader";

const buildFreelancerProjectDestination = (projectId = "") => {
  const normalizedProjectId = String(projectId || "").trim();

  return normalizedProjectId
    ? `/freelancer/project/${encodeURIComponent(normalizedProjectId)}`
    : "/freelancer/project";
};

const buildFreelancerProposalDestination = ({ projectId = "" } = {}) => {
  const normalizedProjectId = String(projectId || "").trim();
  const params = new URLSearchParams();

  if (normalizedProjectId) {
    params.set("projectId", normalizedProjectId);
  }

  const query = params.toString();
  return query ? `/freelancer/proposals?${query}` : "/freelancer/proposals";
};

const resolveFreelancerNotificationDestination = (notification) => {
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

  const type = String(notification?.type || "").trim().toLowerCase();
  const projectId = String(
    notification?.data?.projectId || notification?.data?.syncedProjectId || "",
  ).trim();
  const status = String(notification?.data?.status || "").trim().toUpperCase();

  if (type === "chat") {
    const service = String(notification?.data?.service || "");
    const parts = service.split(":");
    let chatProjectId = projectId;

    if (!chatProjectId && parts.length >= 4 && parts[0] === "CHAT") {
      chatProjectId = parts[1];
    }

    return chatProjectId
      ? `/freelancer/messages?projectId=${encodeURIComponent(chatProjectId)}`
      : "/freelancer/messages";
  }

  if (
    type === "proposal" ||
    type === "proposal_followup" ||
    type === "budget_suggestion" ||
    type === "proposal_expired"
  ) {
    if (status === "ACCEPTED" && projectId) {
      return buildFreelancerProjectDestination(projectId);
    }

    if (status === "ACCEPTED") {
      return "/freelancer/proposals/accepted";
    }

    return buildFreelancerProposalDestination({ projectId });
  }

  if (type === "payment") {
    return "/freelancer/payments";
  }

  if (
    type === "meeting_scheduled" ||
    type === "task_completed" ||
    type === "task_verified" ||
    type === "task_unverified" ||
    type === "project_assigned" ||
    type === "freelancer_change_resolved" ||
    type === "freelancer_review"
  ) {
    return buildFreelancerProjectDestination(projectId);
  }

  return "/freelancer";
};

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
    if (pathname.startsWith("/freelancer/profile")) return "profile";
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
      available: sessionUser?.available,
      openToWork:
        typeof sessionUser?.freelancerProfile?.openToWork === "boolean"
          ? sessionUser.freelancerProfile.openToWork
          : typeof sessionUser?.openToWork === "boolean"
            ? sessionUser.openToWork
            : typeof sessionUser?.available === "boolean"
              ? sessionUser.available
              : undefined,
    };
  }, [
    sessionUser?.avatar,
    sessionUser?.available,
    sessionUser?.email,
    sessionUser?.fullName,
    sessionUser?.freelancerProfile?.openToWork,
    sessionUser?.name,
    sessionUser?.openToWork,
  ]);
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
        return;
      }
      if (key === "profile") {
        navigate("/freelancer/profile");
      }
    },
    [navigate],
  );

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);

    navigate(resolveFreelancerNotificationDestination(notification));
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
