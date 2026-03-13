"use client";

import React from "react";
import Bell from "lucide-react/dist/esm/icons/bell";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/shared/lib/utils";

const marketingNavItems = [
  { label: "Home", key: "home", to: "/" },
  { label: "Marketplace", key: "marketplace", to: "/marketplace" },
  { label: "Service", key: "service", to: "/service" },
  { label: "Contact", key: "contact", to: "/contact" },
];

const workspaceNavItems = [
  { label: "Dashboard", key: "dashboard", to: "/client" },
  { label: "Proposals", key: "proposals", to: "/client/proposal" },
  { label: "Projects", key: "projects", to: "/client/project" },
  { label: "Messages", key: "messages", to: "/client/messages" },
  { label: "Payments", key: "payments", to: "/client/payments" },
  { label: "Freelancers", key: "freelancers", to: "/marketplace" },
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

const BrandMark = () => (
  <div className="flex items-center gap-2">
    <div className="flex size-8 items-center justify-center rounded-full bg-[#facc15]">
      <div className="size-4 rounded-full border-2 border-[#0a0a0a]" />
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
          ? "border-[#ffc107]/30 bg-[#ffc107]/15 text-[#ffc107]"
          : "border-white/10 bg-transparent text-[#94a3b8] hover:text-white",
      )
    : variant === "workspace"
      ? cn(
          "rounded-full px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "border border-white/10 bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
            : "text-[#94a3b8] hover:text-white",
        )
      : cn(
          "text-sm font-medium transition-colors",
          active ? "text-[#facc15]" : "text-[#94a3b8] hover:text-white",
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
  activeMarketingKey = "home",
  activeWorkspaceKey = "dashboard",
  onSiteNav,
  onWorkspaceNav,
  onOpenProfile,
  profileTo = "/client/profile",
  onPrimaryAction,
  primaryActionLabel = "Hire Freelancer",
  primaryActionTo = "/marketplace",
  primaryActionIcon: PrimaryActionIcon = null,
  notificationNode,
  onOpenNotifications,
  notificationTo = "/client/messages",
  unreadCount = 0,
  className,
}) => {
  const displayName = String(profile?.name || "Client").trim() || "Client";
  const profileInitial = profile?.initial || getInitials(displayName);

  const profileContent = (
    <>
      <Avatar className="size-7 border border-black/10">
        <AvatarImage src={profile?.avatar} alt={displayName} />
        <AvatarFallback className="bg-black/5 text-xs font-semibold text-black">
          {profileInitial}
        </AvatarFallback>
      </Avatar>
      <span className="max-w-[120px] truncate">{displayName}</span>
    </>
  );

  const primaryActionContent = (
    <>
      {PrimaryActionIcon ? <PrimaryActionIcon className="size-4" /> : null}
      <span>{primaryActionLabel}</span>
    </>
  );

  const notificationButton = notificationNode || (() => {
    const content = (
      <>
        <Bell className="size-4.5" />
        {unreadCount > 0 ? (
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#ffc107]" />
        ) : null}
      </>
    );

    const className =
      "relative flex size-9 items-center justify-center text-[#94a3b8] transition-colors hover:text-white";

    if (typeof onOpenNotifications === "function") {
      return (
        <button
          type="button"
          onClick={onOpenNotifications}
          className={className}
          aria-label="Open notifications"
        >
          {content}
        </button>
      );
    }

    return (
      <Link to={notificationTo} className={className} aria-label="Open notifications">
        {content}
      </Link>
    );
  })();

  return (
    <header className={cn("space-y-7", className)}>
      <div className="mx-auto w-full rounded-[40px] border border-white/10 bg-[#171717]/70 px-4 py-3 shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] backdrop-blur-[6px] sm:px-6 xl:w-[70%]">
        <div className="flex items-center justify-between gap-4">
          <Link to="/">
            <BrandMark />
          </Link>

          <HeaderNav
            items={marketingNavItems}
            activeKey={activeMarketingKey}
            onSelect={onSiteNav}
          />

          {typeof onOpenProfile === "function" ? (
            <button
              type="button"
              onClick={onOpenProfile}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-[#222222] px-3 py-2 text-sm font-semibold text-white transition-colors hover:border-white/15 hover:bg-[#292929]"
            >
              {profileContent}
            </button>
          ) : (
            <Link
              to={profileTo}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-[#222222] px-3 py-2 text-sm font-semibold text-white transition-colors hover:border-white/15 hover:bg-[#292929]"
            >
              {profileContent}
            </Link>
          )}
        </div>

        <div className="mt-4 lg:hidden">
          <HeaderNav
            items={marketingNavItems}
            activeKey={activeMarketingKey}
            onSelect={onSiteNav}
            mobile
          />
        </div>
      </div>

      <div className="mt-7 border-b border-[#ffc107]/10 pb-3">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <HeaderNav
              items={workspaceNavItems}
              activeKey={activeWorkspaceKey}
              onSelect={onWorkspaceNav}
              variant="workspace"
            />
            <HeaderNav
              items={workspaceNavItems}
              activeKey={activeWorkspaceKey}
              onSelect={onWorkspaceNav}
              mobile
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
    </header>
  );
};

export default ClientWorkspaceHeader;
