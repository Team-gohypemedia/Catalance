"use client";

import React, { memo, useCallback, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Bell from "lucide-react/dist/esm/icons/bell";
import Plus from "lucide-react/dist/esm/icons/plus";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/common/ThemeToggle";
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
  { label: "Overview", key: "overview", to: "/project-manager" },
  { label: "Active Projects", key: "projects", to: "/project-manager/projects?preset=active" },
  { label: "Appointments", key: "appointments", to: "/project-manager/appointments" },
  { label: "Resolved History", key: "history", to: "/project-manager/projects?status=Completed" },
  { label: "Chat", key: "messages", to: "/project-manager/messages" },
  { label: "Profile", key: "profile", to: "/project-manager/profile" },
];

const BrandMark = () => (
  <div className="flex items-center gap-2">
    <div className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-primary">
      <img
        src={logo}
        alt="Catalance"
        className="h-7 w-7 object-contain invert dark:invert-0"
      />
    </div>
    <span className="text-base font-bold tracking-[-0.5px] text-foreground">
      Catalance
    </span>
  </div>
);

const NotificationSheetController = () => {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const {
    notifications = [],
    unreadCount = 0,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOpenNotifications = () => setOpen(true);
    window.addEventListener("pm-notifications:open", handleOpenNotifications);
    return () => window.removeEventListener("pm-notifications:open", handleOpenNotifications);
  }, []);

  const handleNotificationClick = (notification) => {
    if (!notification?.id) return;
    markAsRead(notification.id);
    setOpen(false);

    const type = String(notification?.type || "").toLowerCase();
    const projectId = notification?.data?.projectId;

    if (type === "chat") {
      navigate(projectId ? `/project-manager/messages?projectId=${projectId}` : "/project-manager/messages");
      return;
    }

    navigate(projectId ? `/project-manager/projects/${projectId}` : "/project-manager");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="w-[min(92vw,23rem)] border-l border-border bg-background p-0 text-foreground shadow-[0_36px_120px_-48px_rgba(0,0,0,1)] sm:max-w-[23rem]"
      >
        <div className="flex flex-1 flex-col overflow-hidden min-h-0">
          <SheetHeader className="border-b border-border p-4 pr-12">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-sm font-semibold text-foreground">Notifications</SheetTitle>
                {unreadCount > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto shrink-0 p-0 text-xs font-medium text-primary transition hover:bg-transparent hover:underline whitespace-nowrap"
                    onClick={() => markAllAsRead()}
                  >
                    Mark all as read
                  </Button>
                ) : null}
              </div>
              <SheetDescription className="text-xs text-muted-foreground truncate w-full">
                Management alerts, project status updates, and messages.
              </SheetDescription>
            </div>
          </SheetHeader>
          <ScrollArea className="flex-1 min-h-0 [&_[data-slot=scroll-area-scrollbar]]:hidden">
            {notifications.length === 0 ? (
              <div className="flex h-full min-h-52 flex-col items-center justify-center gap-2 px-6 text-center text-muted-foreground">
                <Bell className="h-8 w-8 opacity-40" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.slice(0, 20).map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-muted/50",
                      !notification.read && "bg-primary/5",
                    )}
                  >
                    <div
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        !notification.read ? "bg-primary" : "bg-muted-foreground/30",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground whitespace-normal break-words">
                        {notification.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground whitespace-normal break-words">
                        {notification.message}
                      </p>
                    </div>
                  </button>
                ))}
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
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("pm-notifications:open"));
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleOpenNotifications}
      className="relative size-9 rounded-full text-foreground transition-colors hover:bg-muted"
      aria-label="Open notifications"
    >
      <Bell className="size-4.5" />
      {unreadCount > 0 ? (
        <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary" />
      ) : null}
    </Button>
  );
};

const HeaderNavItem = ({ active, item, mobile, onSelect, variant = "marketing" }) => {
  const className = mobile
    ? cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
        active
          ? "border-primary/30 bg-primary/15 text-primary"
          : "border-border bg-transparent text-muted-foreground hover:text-foreground",
      )
    : variant === "workspace"
      ? cn(
          "rounded-full px-3.5 py-2 text-sm lg:text-[15px] font-medium transition-colors",
          active
            ? "border border-border bg-background text-primary shadow-xs font-semibold"
            : "text-muted-foreground hover:text-foreground",
        )
      : cn(
          "text-sm lg:text-[15px] font-medium transition-colors",
          active ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground",
        );

  if (typeof onSelect === "function") {
    return (
      <button key={item.key} type="button" onClick={() => onSelect(item.key)} className={className}>
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
        ? "flex items-center gap-2 shrink-0 lg:hidden"
        : cn(
            "hidden items-center lg:flex",
            variant === "workspace" ? "-ml-3 gap-2 lg:gap-2.5 xl:gap-3" : "gap-6 lg:gap-8 xl:gap-10",
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

export const ManagerWorkspaceHeader = memo(function ManagerWorkspaceHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  const profile = useMemo(
    () => ({
      name: user?.fullName || user?.name || "Project Manager",
      email: user?.email || "",
      avatar: user?.avatar || "",
      initial: (user?.fullName || user?.name || "P").charAt(0).toUpperCase(),
    }),
    [user?.avatar, user?.email, user?.fullName, user?.name],
  );

  const getActiveWorkspaceKey = () => {
    const path = location.pathname;
    if (path === "/project-manager") return "overview";
    if (path.startsWith("/project-manager/projects")) {
      const search = location.search;
      if (search.includes("preset=active")) return "projects";
      if (search.includes("status=Completed")) return "history";
      return "projects";
    }
    if (path.startsWith("/project-manager/appointments") || path.startsWith("/project-manager/availability")) return "appointments";
    if (path.startsWith("/project-manager/messages")) return "messages";
    if (path.startsWith("/project-manager/profile")) return "profile";
    return "overview";
  };

  const activeWorkspaceKey = getActiveWorkspaceKey();

  const handleSiteNav = useCallback(
    (key) => {
      const routes = { home: "/", marketplace: "/marketplace", service: "/service", contact: "/contact" };
      navigate(routes[key] || "/");
    },
    [navigate],
  );

  const handleWorkspaceNav = useCallback(
    (key) => {
      const item = workspaceNavItems.find((i) => i.key === key);
      if (item) navigate(item.to);
    },
    [navigate],
  );

  const [headerHeight, setHeaderHeight] = React.useState(120);
  const headerRef = React.useRef(null);

  React.useEffect(() => {
    if (!headerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (headerRef.current) setHeaderHeight(headerRef.current.offsetHeight);
    });
    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div style={{ height: headerHeight }} className="w-full flex-none transition-[height] duration-200" aria-hidden="true" />
      <header
        ref={headerRef}
        className="fixed top-0 px-4 md:px-6 lg:px-20 left-0 w-full z-50 flex-none bg-background border-b border-border/40"
      >
        <NotificationSheetController />
        <WorkspaceMobileSidebar
          currentDashboard="project-manager"
          displayName={profile.name}
          profile={profile}
          profileInitial={profile.initial}
          profileTo="/project-manager/profile"
          marketingNavItems={marketingNavItems}
          workspaceNavItems={workspaceNavItems}
          onSiteNav={handleSiteNav}
          onWorkspaceNav={handleWorkspaceNav}
          onLogout={logout}
          renderNotificationButton={() => <NotificationTriggerButton unreadCount={unreadCount} />}
        />

        {/* Mobile Workspace Navigation */}
        <div className="flex items-center gap-3 border-b border-border/50 bg-background px-4 py-3 lg:hidden overflow-x-auto">
          <HeaderNav
            items={workspaceNavItems}
            activeKey={activeWorkspaceKey}
            onSelect={handleWorkspaceNav}
            variant="workspace"
            mobile={true}
          />
        </div>

        <div className="hidden pb-3 pt-3 lg:block bg-transparent">
          {/* Main Top Navbar */}
          <div className="mx-auto w-full border border-border/50 dark:border-border bg-background rounded-[40px] p-3 sm:p-4 xl:w-[94%]">
            <div className="flex items-center justify-between gap-4 px-3 sm:px-0">
              <Link to="/">
                <BrandMark />
              </Link>

              <HeaderNav
                items={marketingNavItems}
                activeKey={null}
                onSelect={handleSiteNav}
              />

              <div className="flex items-center gap-4">
                <ThemeToggle />
                <WorkspaceProfileDropdown
                  profile={profile}
                  displayName={profile.name}
                  profileInitial={profile.initial}
                  currentDashboard="project-manager"
                />
              </div>
            </div>
          </div>

          {/* Secondary Workspace Navbar */}
          <div className="mt-5">
            <div className="mx-auto w-full flex flex-col gap-4 border-b border-border/50 dark:border-border px-6 pb-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6 xl:w-[94%]">
              <div className="space-y-3">
                <HeaderNav
                  items={workspaceNavItems}
                  activeKey={activeWorkspaceKey}
                  onSelect={handleWorkspaceNav}
                  variant="workspace"
                />
              </div>

              <div className="flex items-center gap-4 lg:gap-5">
                <Button
                  type="button"
                  onClick={() => navigate("/project-manager/create-project")}
                  className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
                >
                  <Plus className="size-4" />
                  <span>Create Project</span>
                </Button>

                <NotificationTriggerButton unreadCount={unreadCount} />
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
});

export default ManagerWorkspaceHeader;
