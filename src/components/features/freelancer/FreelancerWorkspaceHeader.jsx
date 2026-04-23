"use client";

import React from "react";
import Bell from "lucide-react/dist/esm/icons/bell";
import { Link } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import WorkspaceProfileDropdown from "@/components/layout/WorkspaceProfileDropdown";
import WorkspaceMobileSidebar from "@/components/layout/WorkspaceMobileSidebar";
import logo from "@/assets/logos/logo.svg";
import { useAuth } from "@/shared/context/AuthContext";
import { cn } from "@/shared/lib/utils";

const marketingNavItems = [
  { label: "Home", key: "home", to: "/" },
  { label: "Opportunity", key: "marketplace", to: "/marketplace" },
  { label: "Contact", key: "contact", to: "/contact" },
];

const workspaceNavItems = [
  { label: "Dashboard", key: "dashboard", to: "/freelancer" },
  { label: "Proposals", key: "proposals", to: "/freelancer/proposals" },
  { label: "Projects", key: "projects", to: "/freelancer/project" },
  { label: "Messages", key: "messages", to: "/freelancer/messages" },
  { label: "Payments", key: "payments", to: "/freelancer/payments" },
  { label: "Profile", key: "profile", to: "/freelancer/profile" },
];

const getInitials = (value = "") => {
  const parts = String(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "F";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
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

const NotificationPopoverButton = ({
  notifications = [],
  unreadCount = 0,
  markAllAsRead,
  onNotificationClick,
}) => {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleOpenNotificationsSheet = () => {
      setOpen(true);
    };

    window.addEventListener("freelancer-notifications:open", handleOpenNotificationsSheet);

    return () => {
      window.removeEventListener("freelancer-notifications:open", handleOpenNotificationsSheet);
    };
  }, []);

  return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className="relative flex size-9 items-center justify-center text-[#94a3b8] transition-colors hover:text-white"
            aria-label="Open notifications"
          >
            <Bell className="size-4.5" />
            {unreadCount > 0 ? (
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#ffc107]" />
            ) : null}
          </button>
        </SheetTrigger>

        <SheetContent
          side="right"
          className="w-[min(92vw,23rem)] border-l border-border bg-background p-0 text-white shadow-[0_36px_120px_-48px_rgba(0,0,0,1)] sm:max-w-[23rem]"
        >
          <div className="flex h-full min-h-0 flex-col">
            <SheetHeader className="border-b border-border px-4 py-3 pr-12">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <SheetTitle className="text-sm font-semibold text-white">Notifications</SheetTitle>
                  <SheetDescription className="mt-1 text-xs text-[#8f96a3]">
                    Stay updated with project, proposal, and message activity.
                  </SheetDescription>
                </div>

                {unreadCount > 0 ? (
                  <button
                    type="button"
                    className="h-auto shrink-0 p-0 text-xs font-medium text-primary transition hover:text-primary/80"
                    onClick={() => {
                      void markAllAsRead?.();
                    }}
                  >
                    Mark all as read
                  </button>
                ) : null}
              </div>
            </SheetHeader>

            <ScrollArea className="min-h-0 flex-1">
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
                        onClick={() => {
                          onNotificationClick?.(notification);
                          setOpen(false);
                        }}
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
                <button
                  type="button"
                  className="w-full rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  Close
                </button>
              </SheetClose>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
  );
};

const FreelancerWorkspaceHeader = ({
  profile,
  activeMarketingKey = null,
  activeWorkspaceKey = "dashboard",
  onSiteNav,
  onWorkspaceNav,
  onOpenProfile: _onOpenProfile,
  profileTo: _profileTo = "/freelancer/profile",
  onPrimaryAction,
  primaryActionLabel = "Proposals",
  primaryActionTo = "/freelancer/proposals",
  notifications = [],
  unreadCount = 0,
  markAllAsRead,
  onNotificationClick,
  className,
}) => {
  const { logout } = useAuth();
  const displayName = String(profile?.name || "Freelancer").trim() || "Freelancer";
  const profileInitial = profile?.initial || getInitials(displayName);

  const primaryActionContent = <span>{primaryActionLabel}</span>;

  const notificationButton = (
    <NotificationPopoverButton
      notifications={notifications}
      unreadCount={unreadCount}
      markAllAsRead={markAllAsRead}
      onNotificationClick={onNotificationClick}
    />
  );

  return (
    <header className={cn("sticky top-0 z-50 bg-background", className)}>
      <WorkspaceMobileSidebar
        currentDashboard="freelancer"
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
        renderNotificationButton={() => (
          <NotificationPopoverButton
            notifications={notifications}
            unreadCount={unreadCount}
            markAllAsRead={markAllAsRead}
            onNotificationClick={onNotificationClick}
          />
        )}
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
              currentDashboard="freelancer"
              showVerifiedBadge
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

export default FreelancerWorkspaceHeader;
