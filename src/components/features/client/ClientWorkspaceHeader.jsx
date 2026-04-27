"use client";

import React from "react";
import Bell from "lucide-react/dist/esm/icons/bell";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import WorkspaceProfileDropdown from "@/components/layout/WorkspaceProfileDropdown";
import WorkspaceMobileSidebar from "@/components/layout/WorkspaceMobileSidebar";
import logo from "@/assets/logos/logo.svg";
import { useNotifications } from "@/shared/context/NotificationContext";
import { useAuth } from "@/shared/context/AuthContext";
import { cn } from "@/shared/lib/utils";

const marketingNavItems = [
  { label: "Home", key: "home", to: "/" },
  { label: "Marketplace", key: "marketplace", to: "/marketplace" },
  { label: "Service", mobileLabel: "Services", key: "service", to: "/service" },
  { label: "Contact", key: "contact", to: "/contact" },
];

const workspaceNavItems = [
  { label: "Dashboard", key: "dashboard", to: "/client" },
  { label: "Proposals", key: "proposals", to: "/client/proposal" },
  { label: "Projects", key: "projects", to: "/client/project" },
  { label: "Messages", key: "messages", to: "/client/messages" },
  { label: "Payments", key: "payments", to: "/client/payments" },
  { label: "Profile", key: "profile", to: "/client/profile" },
];

const getInitials = (value = "") => {
  const parts = String(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "C";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const buildClientProjectDestination = (projectId = "") => {
  const normalizedProjectId = String(projectId || "").trim();

  return normalizedProjectId
    ? `/client/project/${encodeURIComponent(normalizedProjectId)}`
    : "/client/project";
};

const buildClientProposalDestination = ({ projectId = "", tab = "pending" } = {}) => {
  const normalizedProjectId = String(projectId || "").trim();
  const params = new URLSearchParams();

  if (normalizedProjectId) {
    params.set("projectId", normalizedProjectId);
  }

  if (tab) {
    params.set("tab", tab);
  }

  const query = params.toString();
  return query ? `/client/proposal?${query}` : "/client/proposal";
};

const resolveNotificationDestination = (notification, fallbackTo = "/client/project") => {
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
      ? `/client/messages?projectId=${encodeURIComponent(chatProjectId)}`
      : "/client/messages";
  }

  if (
    type === "proposal" ||
    type === "proposal_followup" ||
    type === "budget_suggestion" ||
    type === "proposal_expired"
  ) {
    if (status === "ACCEPTED" && projectId) {
      return buildClientProjectDestination(projectId);
    }

    const proposalTab =
      type === "proposal_expired" ||
      status === "REJECTED" ||
      status === "DECLINED" ||
      status === "EXPIRED"
        ? "rejected"
        : "pending";

    return buildClientProposalDestination({ projectId, tab: proposalTab });
  }

  if (
    type === "task_completed" ||
    type === "task_verified" ||
    type === "task_unverified" ||
    type === "freelancer_change_resolved" ||
    type === "freelancer_change_request" ||
    type === "project_assigned" ||
    type === "meeting_scheduled" ||
    type === "payment" ||
    type === "freelancer_review"
  ) {
    return buildClientProjectDestination(projectId);
  }

  return fallbackTo;
};

const BrandMark = () => (
  <div className="flex items-center gap-2">
    <div className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-primary">
      <img
        src={logo}
        alt=""
        className="h-7 w-7 object-contain"
      />
    </div>
    <span className="text-base font-bold tracking-[-0.5px] text-white">
      Catalance
    </span>
  </div>
);

const NotificationSheetController = ({ notificationTo = "/client/project" }) => {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const {
    notifications = [],
    unreadCount: contextUnreadCount = 0,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const unreadCount = contextUnreadCount;

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleOpenNotificationsSheet = () => {
      setOpen(true);
    };

    window.addEventListener("client-notifications:open", handleOpenNotificationsSheet);

    return () => {
      window.removeEventListener("client-notifications:open", handleOpenNotificationsSheet);
    };
  }, []);

  const handleNotificationClick = (notification) => {
    if (!notification?.id) return;

    markAsRead(notification.id);
    setOpen(false);

    navigate(resolveNotificationDestination(notification, notificationTo));
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="w-[min(92vw,23rem)] border-l border-border bg-background p-0 text-white shadow-[0_36px_120px_-48px_rgba(0,0,0,1)] sm:max-w-[23rem]"
      >
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b border-border px-4 py-3 pr-12">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <SheetTitle className="text-sm font-semibold text-white">Notifications</SheetTitle>
                <SheetDescription className="mt-1 text-xs text-[#8f96a3]">
                  Stay updated with project, proposal, and message activity.
                </SheetDescription>
              </div>
              {unreadCount > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto shrink-0 p-0 text-xs font-medium text-primary transition hover:bg-transparent hover:text-primary/80"
                  onClick={() => {
                    void markAllAsRead();
                  }}
                >
                  Mark all as read
                </Button>
              ) : null}
            </div>
          </SheetHeader>
          <ScrollArea className="flex-1">
            {notifications.length === 0 ? (
              <div className="flex h-full min-h-52 flex-col items-center justify-center gap-2 px-6 text-center text-[#7e8392]">
                <Bell className="h-8 w-8 opacity-40" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-white/6">
                {notifications.slice(0, 20).map((notification) => {
                  const notificationTime = notification?.updatedAt || notification?.createdAt;
                  const formattedTime = notificationTime
                    ? new Date(notificationTime).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : null;

                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-white/5",
                        !notification.read && "bg-primary/5",
                      )}
                    >
                      <div
                        className={cn(
                          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                          !notification.read ? "bg-primary" : "bg-white/15",
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white whitespace-normal break-words">
                          {notification.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-[#8f96a3] whitespace-normal break-words">
                          {notification.message}
                        </p>
                        {formattedTime ? (
                          <p className="mt-1 text-[11px] text-[#6b7280]">{formattedTime}</p>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
          <SheetFooter className="border-t border-border p-3">
            <SheetClose asChild>
              <Button type="button" variant="outline" className="w-full">
                Close
              </Button>
            </SheetClose>
          </SheetFooter>
        </div>
      </SheetContent>
      </Sheet>
  );
};

const NotificationTriggerButton = ({ unreadCount = 0 }) => {
  const handleOpenNotifications = () => {
    if (typeof window === "undefined") {
      return;
    }

    window.dispatchEvent(new CustomEvent("client-notifications:open"));
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleOpenNotifications}
      className="relative size-9 rounded-full text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
      aria-label="Open notifications"
    >
      <Bell className="size-4.5" />
      {unreadCount > 0 ? (
        <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#ffc107]" />
      ) : null}
    </Button>
  );
};

const HeaderNavItem = ({ active, item, mobile, onSelect, variant = "marketing" }) => {
  const className = mobile
    ? cn(
        "rounded-full border px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
        active
          ? "border-primary/30 bg-primary/15 text-primary"
          : "border-border bg-transparent text-muted-foreground hover:text-foreground",
      )
    : variant === "workspace"
      ? cn(
          "rounded-full px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "border border-border bg-background text-primary"
            : "text-muted-foreground hover:text-foreground",
        )
      : cn(
          "text-sm font-medium transition-colors",
          active ? "text-[#facc15]" : "text-muted-foreground hover:text-foreground",
        );

  if (typeof onSelect === "function") {
    return (
      <button
        key={item.key}
        type="button"
        onClick={() => onSelect(item.key)}
        className={className}
      >
        {item.label}
      </button>
    );
  }

  return (
    <Link key={item.key} to={item.to} className={className}>
      {item.label}
    </Link>
  );
};

const HeaderNav = ({ activeKey, items, mobile = false, onSelect, variant = "marketing" }) => (
  <nav
    className={
      mobile
        ? "flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden"
        : cn(
            "hidden items-center lg:flex",
            variant === "workspace" ? "gap-8 xl:gap-10" : "gap-10 xl:gap-12",
          )
    }
  >
    {items.map((item) => (
      <HeaderNavItem
        key={item.key}
        active={item.key === activeKey}
        item={item}
        mobile={mobile}
        onSelect={onSelect}
        variant={variant}
      />
    ))}
  </nav>
);

const ClientWorkspaceHeader = ({
  profile,
  activeMarketingKey = null,
  activeWorkspaceKey = "dashboard",
  onSiteNav,
  onWorkspaceNav,
  onOpenProfile: _onOpenProfile,
  profileTo: _profileTo = "/client/profile",
  onPrimaryAction,
  primaryActionLabel = "New Proposal",
  primaryActionTo = "/service",
  primaryActionIcon: PrimaryActionIcon = null,
  notificationNode,
  onOpenNotifications: _onOpenNotifications,
  notificationTo = "/client/messages",
  unreadCount = 0,
  className,
}) => {
  const { logout } = useAuth();
  const displayName = String(profile?.name || "Client").trim() || "Client";
  const profileInitial = profile?.initial || getInitials(displayName);

  const primaryActionContent = (
    <>
      {PrimaryActionIcon ? <PrimaryActionIcon className="size-4" /> : null}
      <span>{primaryActionLabel}</span>
    </>
  );

  const notificationButton = notificationNode || <NotificationTriggerButton unreadCount={unreadCount} />;

  return (
    <header className={cn("sticky top-0 z-50 bg-background", className)}>
      <NotificationSheetController notificationTo={notificationTo} />
      <WorkspaceMobileSidebar
        currentDashboard="client"
        displayName={displayName}
        profile={profile}
        profileInitial={profileInitial}
        profileTo={_profileTo}
        activeMarketingKey={activeMarketingKey}
        activeWorkspaceKey={activeWorkspaceKey}
        marketingNavItems={marketingNavItems}
        workspaceNavItems={workspaceNavItems}
        onSiteNav={onSiteNav}
        onWorkspaceNav={onWorkspaceNav}
        onLogout={() => {
          logout();
        }}
        flushContainerPadding
        renderNotificationButton={() => notificationNode || <NotificationTriggerButton unreadCount={unreadCount} />}
      />

      <div className="hidden space-y-4 pb-3 pt-3 lg:block">
        <div className="mx-auto w-full rounded-[40px] border border-border bg-background p-3 sm:p-4 xl:w-[70%]">
          <div className="flex items-center justify-between gap-4">
            <Link to="/">
              <BrandMark />
            </Link>

            <HeaderNav
              items={marketingNavItems}
              activeKey={activeMarketingKey}
              onSelect={onSiteNav}
            />

            <WorkspaceProfileDropdown
              profile={profile}
              displayName={displayName}
              profileInitial={profileInitial}
              currentDashboard="client"
            />
          </div>
        </div>

        <div className="mt-7 border-b border-border pb-3">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <HeaderNav
                items={workspaceNavItems}
                activeKey={activeWorkspaceKey}
                onSelect={onWorkspaceNav}
                variant="workspace"
              />
            </div>

            <div className="flex items-center gap-5">
              {typeof onPrimaryAction === "function" ? (
                <button
                  type="button"
                  onClick={onPrimaryAction}
                  className="flex items-center gap-2 rounded-[16px] bg-[#ffc107] px-4 py-2 text-sm font-bold text-[#0a0a0a] transition-colors hover:bg-[#ffd54f]"
                >
                  {primaryActionContent}
                </button>
              ) : (
                <Link
                  to={primaryActionTo}
                  className="flex items-center gap-2 rounded-[16px] bg-[#ffc107] px-4 py-2 text-sm font-bold text-[#0a0a0a] transition-colors hover:bg-[#ffd54f]"
                >
                  {primaryActionContent}
                </Link>
              )}

              {notificationButton}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ClientWorkspaceHeader;
