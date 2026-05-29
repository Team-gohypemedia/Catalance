"use client";

import PropTypes from "prop-types";
import React from "react";
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
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Store from "lucide-react/dist/esm/icons/store";
import UserRound from "lucide-react/dist/esm/icons/user-round";
import WalletCards from "lucide-react/dist/esm/icons/wallet-cards";
import X from "lucide-react/dist/esm/icons/x";
import { Link, useNavigate } from "react-router-dom";
import logo from "@/assets/logos/logo.svg";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useDashboardSwitcher } from "@/shared/hooks/use-dashboard-switcher";
import { cn } from "@/shared/lib/utils";

const iconMap = {
  dashboard: LayoutDashboard,
  "growth-quest": Sparkles,
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

const WorkspaceBrandMark = () => (
  <div className="flex items-center gap-2">
    <div className="flex size-7.5 items-center justify-center overflow-hidden rounded-full bg-primary shadow-[0_10px_30px_-18px_rgba(255,193,7,0.9)]">
      <img
        src={logo}
        alt=""
        className="h-6.5 w-6.5 object-contain"
      />
    </div>
    <span className="text-[0.96rem] font-bold tracking-[-0.04em] text-foreground">
      Catalance
    </span>
  </div>
);

const renderNotificationSlot = (renderNotificationButton, key) => {
  if (!renderNotificationButton) {
    return null;
  }

  const notificationButton =
    typeof renderNotificationButton === "function"
      ? renderNotificationButton()
      : renderNotificationButton;

  return React.isValidElement(notificationButton)
    ? React.cloneElement(notificationButton, { key })
    : notificationButton;
};

const MobileMenuLink = ({
  active,
  className,
  item,
  onSelect,
  priority = "primary",
}) => {
  const Icon = iconMap[item.key];
  const label = item.mobileLabel || item.label;
  const content =
    priority === "primary" ? (
      <div
        className={cn(
          "flex w-full items-center gap-2.5 rounded-[15px] px-3 py-1 text-left transition-colors duration-200",
          active
            ? "bg-primary text-primary-foreground shadow-[inset_0_0_0_1px_rgba(255,193,7,0.32)]"
            : "text-muted-foreground hover:bg-white/[0.03] hover:text-foreground",
        )}
      >
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-[10px] transition-colors duration-200",
            active ? "text-primary-foreground" : "text-muted-foreground",
          )}
        >
          {Icon ? <Icon className="size-3.5" /> : null}
        </span>
        <span className="truncate text-[0.86rem] font-medium">{label}</span>
      </div>
    ) : (
      <div
        className={cn(
          "flex min-h-9 items-center gap-2 rounded-[15px] border px-3 py-1 text-left transition-colors duration-200",
          active
            ? "border-primary bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <span
          className={cn(
            "flex size-5.5 shrink-0 items-center justify-center rounded-[10px]",
            active ? "text-primary-foreground" : "text-muted-foreground",
          )}
        >
          {Icon ? <Icon className="size-3.5" /> : null}
        </span>
        <span className="truncate text-[0.82rem] font-medium">{label}</span>
      </div>
    );

  if (typeof onSelect === "function") {
    return (
      <SheetClose asChild>
        <button
          type="button"
          aria-current={active ? "page" : undefined}
          onClick={() => onSelect(item.key)}
          className={cn("block", priority === "primary" && "w-full", className)}
        >
          {content}
        </button>
      </SheetClose>
    );
  }

  return (
    <SheetClose asChild>
      <Link
        to={item.to}
        aria-current={active ? "page" : undefined}
        className={cn("block", priority === "primary" && "w-full", className)}
      >
        {content}
      </Link>
    </SheetClose>
  );
};

MobileMenuLink.propTypes = {
  active: PropTypes.bool,
  className: PropTypes.string,
  item: PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    mobileLabel: PropTypes.string,
    to: PropTypes.string,
  }).isRequired,
  onSelect: PropTypes.func,
  priority: PropTypes.oneOf(["primary", "secondary"]),
};

const MobileProfileSwitchCard = ({
  currentDashboard,
  displayName,
  profile,
  profileInitial,
  profileTo,
}) => {
  const navigate = useNavigate();
  const {
    canSwitchDashboard,
    currentDashboardLabel,
    switchDashboard,
    switchLabel,
  } = useDashboardSwitcher({ currentDashboard });
  const isFreelancer = currentDashboard === "freelancer";
  const handleSwitchDashboard = () => {
    switchDashboard();
  };

  return (
    <div className="rounded-2xl border border-border bg-card/65 backdrop-blur-md p-3.5 shadow-sm">
      <div className="flex items-start justify-between gap-2.5">
        <SheetClose asChild>
          <button
            type="button"
            onClick={() => navigate(profileTo)}
            className="flex min-w-0 flex-1 items-center gap-3 text-left group"
          >
            <div className="relative shrink-0">
              <Avatar className="size-10.5 border border-border bg-background shadow-sm transition-transform group-hover:scale-105">
                <AvatarImage src={profile?.avatar} alt={displayName} />
                <AvatarFallback className="bg-primary/20 text-base font-bold text-primary">
                  {profileInitial}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-background bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.3)] animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[0.92rem] font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                {displayName}
              </p>
              <p className="mt-0.5 text-[0.7rem] font-medium leading-tight text-muted-foreground">
                Current: <span className="font-semibold text-foreground/80">{currentDashboardLabel}</span> dashboard
              </p>
            </div>
          </button>
        </SheetClose>
      </div>

      {canSwitchDashboard ? (
        <>
          <div className="my-3 h-px bg-border/60" />

          <div className="flex items-center justify-between gap-2.5 rounded-xl bg-muted/40 p-2 border border-border/30">
            <SheetClose asChild>
              <button
                type="button"
                onClick={handleSwitchDashboard}
                className="flex min-w-0 flex-1 items-center gap-2.5 text-left transition-opacity hover:opacity-90"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                  <Repeat2 className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[0.82rem] font-bold tracking-tight text-foreground">
                    {switchLabel}
                  </span>
                  <span className="mt-0.5 block truncate text-[0.68rem] font-medium text-muted-foreground">
                    Currently in {currentDashboardLabel} mode
                  </span>
                </span>
              </button>
            </SheetClose>

            <SheetClose asChild>
              <Switch
                checked={isFreelancer}
                onCheckedChange={handleSwitchDashboard}
                aria-label={`${switchLabel} dashboard`}
                className="h-5.5 w-[3.05rem] shrink-0 border-0 px-0.5 shadow-none data-[state=checked]:justify-end data-[state=checked]:bg-[var(--primary)] data-[state=unchecked]:justify-start data-[state=unchecked]:bg-muted [&_[data-slot=switch-thumb]]:size-4 [&_[data-slot=switch-thumb]]:!translate-x-0 [&_[data-slot=switch-thumb]]:shadow-none [&_[data-slot=switch-thumb]]:data-[state=checked]:bg-background [&_[data-slot=switch-thumb]]:data-[state=unchecked]:bg-foreground"
              />
            </SheetClose>
          </div>
        </>
      ) : null}
    </div>
  );
};

MobileProfileSwitchCard.propTypes = {
  currentDashboard: PropTypes.oneOf(["client", "freelancer"]).isRequired,
  displayName: PropTypes.string.isRequired,
  profile: PropTypes.shape({
    avatar: PropTypes.string,
    isVerified: PropTypes.bool,
    openToWork: PropTypes.bool,
  }),
  profileInitial: PropTypes.string.isRequired,
  profileTo: PropTypes.string.isRequired,
};

const navItemShape = PropTypes.shape({
  key: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  mobileLabel: PropTypes.string,
  to: PropTypes.string,
});

const WorkspaceMobileSidebar = ({
  currentDashboard,
  displayName,
  profile,
  profileInitial,
  profileTo,
  activeMarketingKey = null,
  activeWorkspaceKey = "dashboard",
  marketingNavItems,
  workspaceNavItems,
  onSiteNav,
  onWorkspaceNav,
  onLogout,
  renderNotificationButton,
  flushContainerPadding = false,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const topNotificationButton = renderNotificationSlot(
    renderNotificationButton,
    "top-notifications",
  );
  const drawerNotificationButton = renderNotificationSlot(
    renderNotificationButton,
    "drawer-notifications",
  );

  return (
    <div
      className={cn(
        "relative z-50 flex-none bg-background border-b border-border shadow-xs px-4 py-2 lg:hidden",
        flushContainerPadding ? "-mx-4 w-[calc(100%+2rem)]" : "w-full",
      )}
    >
      <div className="flex w-full items-center justify-between gap-3">
        <Link to="/">
          <WorkspaceBrandMark />
        </Link>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {topNotificationButton ? (
            <div>
              {topNotificationButton}
            </div>
          ) : null}

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open navigation menu"
                className="inline-flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:text-muted-foreground"
              >
                <Menu className="size-5" />
              </button>
            </SheetTrigger>

            <SheetContent
              side="right"
              showCloseButton={false}
              className="w-[min(92vw,23rem)] border-l border-border bg-background p-0 text-foreground shadow-[0_36px_120px_-48px_rgba(0,0,0,1)] sm:max-w-[23rem]"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation menu</SheetTitle>
                <SheetDescription>
                  Open workspace and site navigation links.
                </SheetDescription>
              </SheetHeader>

              <div className="flex items-center justify-between px-4.5 py-2.5">
                <SheetClose asChild>
                  <Link to="/">
                    <WorkspaceBrandMark />
                  </Link>
                </SheetClose>

                <div className="flex items-center gap-2">
                  {drawerNotificationButton ? (
                    <div>
                      {drawerNotificationButton}
                    </div>
                  ) : null}

                  <SheetClose asChild>
                    <button
                      type="button"
                      aria-label="Close navigation menu"
                      className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <X className="size-4.5" />
                    </button>
                  </SheetClose>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto subtle-scrollbar px-4.5 pb-4 overscroll-contain">
                <div className="flex min-h-full flex-col gap-2.5 py-2">
                  <section>
                    <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#5d6476]">
                      Main
                    </p>
                    <div className="mt-1 space-y-0">
                      {workspaceNavItems.map((item) => (
                        <MobileMenuLink
                          key={item.key}
                          item={item}
                          active={item.key === activeWorkspaceKey}
                          onSelect={onWorkspaceNav}
                          priority="primary"
                        />
                      ))}
                    </div>
                  </section>

                  <section>
                    <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#5d6476]">
                      Home
                    </p>
                    <div className="mt-1 grid grid-cols-2 gap-1.5">
                      {marketingNavItems.map((item, index) => {
                        const shouldSpanFullWidth =
                          currentDashboard === "freelancer" &&
                          item.key === "contact" &&
                          index === marketingNavItems.length - 1;

                        return (
                          <MobileMenuLink
                            key={item.key}
                            item={item}
                            active={item.key === activeMarketingKey}
                            className={
                              shouldSpanFullWidth
                                ? "col-span-2 [&>div]:justify-center"
                                : undefined
                            }
                            onSelect={onSiteNav}
                            priority="secondary"
                          />
                        );
                      })}
                    </div>
                  </section>

                  <div className="mt-auto space-y-1.5 pb-0">
                    <SheetClose asChild>
                      <button
                        type="button"
                        onClick={onLogout}
                        className="flex items-center gap-2.5 px-1 text-[0.84rem] font-medium text-muted-foreground transition hover:text-foreground"
                      >
                        <LogOut className="size-4" />
                        <span>Sign Out</span>
                      </button>
                    </SheetClose>

                    <MobileProfileSwitchCard
                      currentDashboard={currentDashboard}
                      displayName={displayName}
                      profile={profile}
                      profileInitial={profileInitial}
                      profileTo={profileTo}
                    />
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
};

WorkspaceMobileSidebar.propTypes = {
  currentDashboard: PropTypes.oneOf(["client", "freelancer"]).isRequired,
  displayName: PropTypes.string.isRequired,
  profile: PropTypes.shape({
    avatar: PropTypes.string,
  }),
  profileInitial: PropTypes.string.isRequired,
  profileTo: PropTypes.string.isRequired,
  activeMarketingKey: PropTypes.string,
  activeWorkspaceKey: PropTypes.string,
  marketingNavItems: PropTypes.arrayOf(navItemShape).isRequired,
  workspaceNavItems: PropTypes.arrayOf(navItemShape).isRequired,
  onSiteNav: PropTypes.func,
  onWorkspaceNav: PropTypes.func,
  onLogout: PropTypes.func.isRequired,
  flushContainerPadding: PropTypes.bool,
  renderNotificationButton: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.node,
  ]),
};

export default WorkspaceMobileSidebar;
