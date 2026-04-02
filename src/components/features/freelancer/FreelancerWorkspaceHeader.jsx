"use client";

import React from "react";
import Bell from "lucide-react/dist/esm/icons/bell";
import BriefcaseBusiness from "lucide-react/dist/esm/icons/briefcase-business";
import FileText from "lucide-react/dist/esm/icons/file-text";
import HandPlatter from "lucide-react/dist/esm/icons/hand-platter";
import House from "lucide-react/dist/esm/icons/house";
import LayoutDashboard from "lucide-react/dist/esm/icons/layout-dashboard";
import LogOut from "lucide-react/dist/esm/icons/log-out";
import Mail from "lucide-react/dist/esm/icons/mail";
import Menu from "lucide-react/dist/esm/icons/menu";
import PhoneCall from "lucide-react/dist/esm/icons/phone-call";
import Repeat2 from "lucide-react/dist/esm/icons/repeat-2";
import Store from "lucide-react/dist/esm/icons/store";
import UserRound from "lucide-react/dist/esm/icons/user-round";
import WalletCards from "lucide-react/dist/esm/icons/wallet-cards";
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
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
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
  { label: "Service", mobileLabel: "Services", key: "service", to: "/service" },
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

const MobileMenuLink = ({ active, item, onSelect, priority = "primary" }) => {
  const iconMap = {
    dashboard: LayoutDashboard,
    projects: BriefcaseBusiness,
    proposals: FileText,
    messages: Mail,
    payments: WalletCards,
    profile: UserRound,
    home: House,
    marketplace: Store,
    service: HandPlatter,
    contact: PhoneCall,
  };
  const Icon = iconMap[item.key];
  const content =
    priority === "primary" ? (
      <div
        className={cn(
          "flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left transition",
          active
            ? "bg-[#292514] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
            : "text-[#8f96a3] hover:bg-white/[0.03] hover:text-white",
        )}
      >
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-[12px] border transition",
            active
              ? "border-[#5a4a1a] bg-[#2f2a16] text-[#ffc107]"
              : "border-white/[0.05] bg-white/[0.02] text-[#8f96a3]",
          )}
        >
          {Icon ? <Icon className="size-4.5" /> : null}
        </span>
        <span className="text-[15px] font-medium">{item.mobileLabel || item.label}</span>
      </div>
    ) : (
      <div
        className={cn(
          "flex min-h-[58px] items-center gap-3 rounded-[18px] border px-4 py-3 text-left transition",
          active
            ? "border-[#5a4a1a] bg-[#292514] text-white"
            : "border-white/[0.05] bg-white/[0.03] text-[#d4d8e3] hover:border-white/[0.08] hover:bg-white/[0.05]",
        )}
      >
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-[12px]",
            active ? "text-[#ffc107]" : "text-[#a8afc1]",
          )}
        >
          {Icon ? <Icon className="size-4.5" /> : null}
        </span>
        <span className="text-[15px] font-medium">{item.mobileLabel || item.label}</span>
      </div>
    );

  if (typeof onSelect === "function") {
    return (
      <SheetClose asChild>
        <button type="button" onClick={() => onSelect(item.key)} className="w-full">
          {content}
        </button>
      </SheetClose>
    );
  }

  return (
    <SheetClose asChild>
      <Link to={item.to} className={priority === "secondary" ? "block" : "block w-full"}>
        {content}
      </Link>
    </SheetClose>
  );
};

const MobileProfileSwitchCard = ({
  currentDashboard,
  displayName,
  profile,
  profileInitial,
  profileTo,
}) => {
  const navigate = useNavigate();

  const switchTargetLabel = currentDashboard === "freelancer" ? "Client" : "Freelancer";
  const switchTargetPath = currentDashboard === "freelancer" ? "/client" : "/freelancer";

  return (
    <div className="rounded-[26px] border border-white/[0.05] bg-white/[0.03] p-4 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.85)]">
      <div className="flex items-center justify-between gap-3">
        <SheetClose asChild>
          <button
            type="button"
            onClick={() => navigate(profileTo)}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          >
            <div className="relative shrink-0">
              <Avatar className="size-12 border border-white/[0.08]">
                <AvatarImage src={profile?.avatar} alt={displayName} />
                <AvatarFallback className="bg-[#272c3d] text-sm font-bold text-white">
                  {profileInitial}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-[#161a28] bg-[#22c55e]" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[1rem] font-semibold text-white">{displayName}</p>
              <p className="mt-1 text-xs text-[#6f7688]">View profile</p>
            </div>
          </button>
        </SheetClose>

        <SheetClose asChild>
          <button
            type="button"
            onClick={() => navigate(switchTargetPath)}
            className="flex shrink-0 flex-col items-end gap-1 rounded-[18px] px-2 py-1 text-right transition hover:text-white"
          >
            <Repeat2 className="size-4 text-[#d7dbe6]" />
            <span className="text-[11px] font-medium text-[#7f8797]">switch to</span>
            <span className="text-xs font-semibold text-[#cfd5df]">{switchTargetLabel}</span>
          </button>
        </SheetClose>
      </div>
    </div>
  );
};

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

  React.useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const { body, documentElement } = document;
    const previousHtmlOverflow = documentElement.style.overflow;
    const previousHtmlOverscrollBehavior = documentElement.style.overscrollBehavior;
    const previousOverflow = body.style.overflow;
    const previousOverscrollBehavior = body.style.overscrollBehavior;

    if (open) {
      documentElement.style.overflow = "hidden";
      documentElement.style.overscrollBehavior = "none";
      body.style.overflow = "hidden";
      body.style.overscrollBehavior = "none";
    }

    return () => {
      documentElement.style.overflow = previousHtmlOverflow;
      documentElement.style.overscrollBehavior = previousHtmlOverscrollBehavior;
      body.style.overflow = previousOverflow;
      body.style.overscrollBehavior = previousOverscrollBehavior;
    };
  }, [open]);

  return (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[3px]"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      <Sheet open={open} onOpenChange={setOpen} modal={false}>
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
          className="z-50 w-full max-w-[22rem] border-l border-border bg-[#171718] p-0 text-white sm:max-w-[24rem]"
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
    </>
  );
};

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
  const { logout } = useAuth();
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

  return (
    <header className={cn("sticky top-0 z-50 bg-background", className)}>
      <div className="border-b border-border px-4 py-5 lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <Link to="/">
            <BrandMark />
          </Link>

          <div className="flex items-center gap-1">
            <div className="rounded-full bg-white/[0.02] text-[#ffc107]">
              {notificationButton}
            </div>

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
              side="left"
              showCloseButton={false}
              className="w-[min(88vw,22rem)] border-r border-white/[0.06] rounded-r-[28px] bg-[#101420] p-0 text-white shadow-[0_32px_100px_-36px_rgba(0,0,0,0.92)] sm:max-w-[22rem]"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation menu</SheetTitle>
                <SheetDescription>
                  Open workspace and site navigation links.
                </SheetDescription>
              </SheetHeader>

              <div className="flex items-center justify-between border-b border-white/[0.05] px-6 py-6">
                <SheetClose asChild>
                  <Link to="/">
                    <BrandMark />
                  </Link>
                </SheetClose>

                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-white/[0.04] text-[#ffc107]">
                    {notificationButton}
                  </div>
                  <SheetClose asChild>
                    <button
                      type="button"
                      aria-label="Close navigation menu"
                      className="inline-flex size-10 items-center justify-center rounded-full text-[#c6cad5] transition-colors hover:bg-white/[0.05] hover:text-white"
                    >
                      <X className="size-5" />
                    </button>
                  </SheetClose>
                </div>
              </div>

              <ScrollArea className="flex-1 px-6 pb-8">
                <div className="flex min-h-full flex-col">
                  <div className="pt-8">
                    <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5d6476]">
                      Main
                    </p>
                    <div className="mt-4 space-y-2">
                    {workspaceNavItems
                      .filter((item) => item.key !== "profile")
                      .map((item) => (
                      <MobileMenuLink
                        key={item.key}
                        item={item}
                        active={item.key === activeWorkspaceKey}
                        onSelect={onWorkspaceNav}
                        priority="primary"
                      />
                    ))}
                    </div>
                  </div>

                  <div className="mt-10">
                    <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5d6476]">
                      Home
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
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

                  <div className="mt-auto space-y-5 pb-2 pt-10">
                    <SheetClose asChild>
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                        }}
                        className="flex items-center gap-3 px-1 text-sm font-medium text-[#b0b7c7] transition hover:text-white"
                      >
                        <LogOut className="size-4.5" />
                        <span>Sign Out</span>
                      </button>
                    </SheetClose>

                    <MobileProfileSwitchCard
                      currentDashboard="freelancer"
                      displayName={displayName}
                      profile={profile}
                      profileInitial={profileInitial}
                      profileTo={_profileTo}
                    />
                  </div>
                </div>
              </ScrollArea>
            </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

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
