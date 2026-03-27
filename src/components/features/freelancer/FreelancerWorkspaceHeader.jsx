"use client";

import React from "react";
import Bell from "lucide-react/dist/esm/icons/bell";
import Menu from "lucide-react/dist/esm/icons/menu";
import X from "lucide-react/dist/esm/icons/x";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import logo from "@/assets/logos/logo.svg";
import { useAuth } from "@/shared/context/AuthContext";
import { cn } from "@/shared/lib/utils";

/* ─── Profile Dropdown ──────────────────────────────────────────────── */
const ProfileDropdown = ({ profile, displayName, profileInitial }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [isFreelancer, setIsFreelancer] = React.useState(true);

  const handleToggle = () => {
    const next = !isFreelancer;
    setIsFreelancer(next);
    navigate(next ? "/freelancer" : "/client");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-sm font-semibold text-white transition-colors hover:border-border hover:bg-background"
        >
          <Avatar className="size-7 border border-border">
            <AvatarImage src={profile?.avatar} alt={displayName} />
            <AvatarFallback className="bg-black/5 text-xs font-semibold text-black">
              {profileInitial}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-[120px] truncate">{displayName}</span>
          <svg
            className={cn("h-3.5 w-3.5 text-white transition-transform duration-200", open ? "rotate-180" : "")}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-56 border border-border bg-background p-0 text-white shadow-[0_24px_70px_-36px_rgba(0,0,0,0.95)]"
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Avatar className="size-9 border border-border">
            <AvatarImage src={profile?.avatar} alt={displayName} />
            <AvatarFallback className="bg-white/10 text-sm font-bold text-white">
              {profileInitial}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{displayName}</p>
            <p className="truncate text-xs text-white/40">{profile?.email}</p>
          </div>
        </div>

        {/* Menu */}
        <div className="p-1 space-y-0.5">
          {/* Dashboard */}
          <Link
            to="/freelancer"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/8 hover:text-white"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 text-white/60">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </span>
            Dashboard
          </Link>

          {/* Toggle */}
          <div className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-white/5 transition-all">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 text-white/60">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-medium text-white/80">{isFreelancer ? "Freelancer" : "Client"}</p>
                <p className="text-[10px] text-white/40 leading-none">Switch view</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggle}
              className={cn(
                "relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                isFreelancer ? "bg-[#ffc107]" : "bg-white/20"
              )}
              aria-label="Switch between Client and Freelancer"
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out",
                  isFreelancer ? "translate-x-3.5" : "translate-x-0"
                )}
              />
            </button>
          </div>

          {/* Divider */}
          <div className="my-1 border-t border-border" />

          {/* Profile */}
          <Link
            to="/freelancer/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/8 hover:text-white"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 text-white/60">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
            Profile
          </Link>

          {/* Log Out */}
          <button
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </span>
            Log Out
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const marketingNavItems = [
  { label: "Home", key: "home", to: "/" },
  { label: "Marketplace", key: "marketplace", to: "/marketplace" },
  { label: "Service", key: "service", to: "/service" },
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
        className="h-5 w-5 object-contain"
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
            ? "border border-border bg-background text-white"
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

const MobileMenuLink = ({ active, item, onSelect, priority = "primary" }) => {
  const className =
    priority === "primary"
      ? cn(
          "block w-full py-1 text-left text-[1.75rem] font-semibold uppercase tracking-[0.12em] transition-colors",
          active ? "text-[#ffc107]" : "text-muted-foreground hover:text-[#ffc107]",
        )
      : cn(
          "block w-full py-1 text-left text-base font-semibold uppercase tracking-[0.14em] transition-colors",
          active ? "text-[#ffc107]" : "text-muted-foreground hover:text-foreground",
        );

  if (typeof onSelect === "function") {
    return (
      <SheetClose asChild>
        <button type="button" onClick={() => onSelect(item.key)} className={className}>
          {item.label}
        </button>
      </SheetClose>
    );
  }

  return (
    <SheetClose asChild>
      <Link to={item.to} className={className}>
        {item.label}
      </Link>
    </SheetClose>
  );
};

const NotificationPopoverButton = ({
  notifications = [],
  unreadCount = 0,
  markAllAsRead,
  onNotificationClick,
}) => (
  <Popover modal={false}>
    <PopoverTrigger
      className="relative flex size-9 items-center justify-center text-[#94a3b8] transition-colors hover:text-white"
      aria-label="Open notifications"
    >
      <Bell className="size-4.5" />
      {unreadCount > 0 ? (
        <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#ffc107]" />
      ) : null}
    </PopoverTrigger>
    <PopoverContent
      align="end"
      sideOffset={10}
        className="w-[22rem] border border-border bg-[#171718] p-0 text-white shadow-[0_24px_70px_-36px_rgba(0,0,0,0.95)]"
      >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h4 className="text-sm font-semibold">Notifications</h4>
        {unreadCount > 0 ? (
          <button
            type="button"
            className="text-xs font-medium text-primary transition hover:text-primary/80"
            onClick={() => {
              void markAllAsRead?.();
            }}
          >
            Mark all as read
          </button>
        ) : null}
      </div>
      <ScrollArea className="h-72">
        {notifications.length === 0 ? (
          <div className="flex h-full min-h-52 flex-col items-center justify-center gap-2 px-6 text-center text-[#7e8392]">
            <Bell className="h-8 w-8 opacity-40" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-white/6">
            {notifications.slice(0, 20).map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => onNotificationClick?.(notification)}
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
                  <p className="truncate text-sm font-medium text-white">
                    {notification.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#8f96a3]">
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
);

const FreelancerWorkspaceHeader = ({
  profile,
  activeMarketingKey = "home",
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
  const displayName = String(profile?.name || "Freelancer").trim() || "Freelancer";
  const profileInitial = profile?.initial || getInitials(displayName);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const primaryActionContent = <span>{primaryActionLabel}</span>;

  const notificationButton = (
    <NotificationPopoverButton
      notifications={notifications}
      unreadCount={unreadCount}
      markAllAsRead={markAllAsRead}
      onNotificationClick={onNotificationClick}
    />
  );

  const handleMobilePrimaryAction = () => {
    setMobileMenuOpen(false);
    onPrimaryAction?.();
  };

  return (
    <header className={cn("sticky top-0 z-50 bg-background", className)}>
      <div className="border-b border-border px-4 py-5 lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <Link to="/">
            <BrandMark />
          </Link>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open navigation menu"
                className="inline-flex size-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/5"
              >
                <Menu className="size-6" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              showCloseButton={false}
              className="w-full max-w-none border-l-0 bg-background p-0 text-white sm:max-w-none"
            >
              <div className="flex items-center justify-between px-6 py-6">
                <SheetClose asChild>
                  <Link to="/">
                    <BrandMark />
                  </Link>
                </SheetClose>

                <SheetClose asChild>
                  <button
                    type="button"
                    aria-label="Close navigation menu"
                    className="inline-flex size-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/5"
                  >
                    <X className="size-6" />
                  </button>
                </SheetClose>
              </div>

              <ScrollArea className="flex-1 px-6 pb-8">
                <div className="flex min-h-full flex-col">
                  <div className="space-y-7 pt-10">
                    {workspaceNavItems.map((item) => (
                      <MobileMenuLink
                        key={item.key}
                        item={item}
                        active={item.key === activeWorkspaceKey}
                        onSelect={onWorkspaceNav}
                      />
                    ))}
                  </div>

                  <div className="mt-12 border-t border-border pt-8">
                    <div className="space-y-5">
                      {marketingNavItems.map((item) => (
                        <MobileMenuLink
                          key={item.key}
                          item={item}
                          active={item.key === activeMarketingKey}
                          onSelect={onSiteNav}
                          priority="secondary"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto space-y-4 pb-2 pt-12">
                    {typeof onPrimaryAction === "function" ? (
                      <button
                        type="button"
                        onClick={handleMobilePrimaryAction}
                        className="flex w-full items-center justify-center gap-2 rounded-[18px] bg-[#ffc107] px-4 py-3 text-sm font-bold text-[#0a0a0a] transition-colors hover:bg-[#ffd54f]"
                      >
                        {primaryActionContent}
                      </button>
                    ) : (
                      <SheetClose asChild>
                        <Link
                          to={primaryActionTo}
                          className="flex w-full items-center justify-center gap-2 rounded-[18px] bg-[#ffc107] px-4 py-3 text-sm font-bold text-[#0a0a0a] transition-colors hover:bg-[#ffd54f]"
                        >
                          {primaryActionContent}
                        </Link>
                      </SheetClose>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <ProfileDropdown
                          profile={profile}
                          displayName={displayName}
                          profileInitial={profileInitial}
                        />
                      </div>
                      <div className="shrink-0">{notificationButton}</div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="hidden space-y-4 pb-3 pt-3 lg:block">
        <div className="mx-auto w-full rounded-[40px] border border-border bg-[#171717]/70 p-3 shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] backdrop-blur-[6px] sm:p-4 xl:w-[70%]">
          <div className="flex items-center justify-between gap-4">
            <Link to="/">
              <BrandMark />
            </Link>

            <HeaderNav
              items={marketingNavItems}
              activeKey={activeMarketingKey}
              onSelect={onSiteNav}
            />

            <ProfileDropdown
              profile={profile}
              displayName={displayName}
              profileInitial={profileInitial}
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
