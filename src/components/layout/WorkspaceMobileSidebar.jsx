"use client";

import PropTypes from "prop-types";
import React from "react";
import BriefcaseBusiness from "lucide-react/dist/esm/icons/briefcase-business";
import BadgeCheck from "lucide-react/dist/esm/icons/badge-check";
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
import logo from "@/assets/logos/logo.svg";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/shared/lib/utils";

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

const WorkspaceBrandMark = () => (
  <div className="flex items-center gap-2">
    <div className="flex size-7.5 items-center justify-center overflow-hidden rounded-full bg-primary shadow-[0_10px_30px_-18px_rgba(255,193,7,0.9)]">
      <img
        src={logo}
        alt=""
        className="h-6.5 w-6.5 object-contain"
      />
    </div>
    <span className="text-[0.96rem] font-bold tracking-[-0.04em] text-white">
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

const MobileMenuLink = ({ active, item, onSelect, priority = "primary" }) => {
  const Icon = iconMap[item.key];
  const label = item.mobileLabel || item.label;
  const content =
    priority === "primary" ? (
      <div
        className={cn(
          "flex w-full items-center gap-2.5 rounded-[16px] px-3 py-2 text-left transition-colors duration-200",
          active
            ? "bg-[#302915] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
            : "text-[#8f96a3] hover:bg-white/[0.03] hover:text-white",
        )}
      >
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-[11px] transition-colors duration-200",
            active
              ? "bg-[#241f11] text-[#ffc107] shadow-[inset_0_0_0_1px_rgba(255,193,7,0.12)]"
              : "text-[#8790a4]",
          )}
        >
          {Icon ? <Icon className="size-3.5" /> : null}
        </span>
        <span className="truncate text-[0.88rem] font-medium">{label}</span>
      </div>
    ) : (
      <div
        className={cn(
          "flex min-h-[42px] items-center gap-2 rounded-[16px] border px-3 py-2 text-left transition-colors duration-200",
          active
            ? "border-[#5d4d18] bg-[#302915] text-white"
            : "border-white/[0.05] bg-white/[0.03] text-[#d4d8e3] hover:border-white/[0.08] hover:bg-white/[0.05]",
        )}
      >
        <span
          className={cn(
            "flex size-6.5 shrink-0 items-center justify-center rounded-[10px]",
            active ? "text-[#ffc107]" : "text-[#a8afc1]",
          )}
        >
          {Icon ? <Icon className="size-3.5" /> : null}
        </span>
        <span className="truncate text-[0.83rem] font-medium">{label}</span>
      </div>
    );

  if (typeof onSelect === "function") {
    return (
      <SheetClose asChild>
        <button
          type="button"
          onClick={() => onSelect(item.key)}
          className={cn("block", priority === "primary" && "w-full")}
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
        className={cn("block", priority === "primary" && "w-full")}
      >
        {content}
      </Link>
    </SheetClose>
  );
};

MobileMenuLink.propTypes = {
  active: PropTypes.bool,
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
  const switchTargetLabel =
    currentDashboard === "freelancer" ? "Client" : "Freelancer";
  const switchTargetPath =
    currentDashboard === "freelancer" ? "/client" : "/freelancer";

  return (
    <div className="rounded-[20px] border border-white/[0.05] bg-white/[0.03] px-3 py-2.5 shadow-[0_24px_60px_-44px_rgba(0,0,0,0.95)]">
      <div className="flex items-center justify-between gap-2.5">
        <SheetClose asChild>
          <button
            type="button"
            onClick={() => navigate(profileTo)}
            className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
          >
            <div className="relative shrink-0">
              <Avatar className="size-9 border border-white/[0.08]">
                <AvatarImage src={profile?.avatar} alt={displayName} />
                <AvatarFallback className="bg-[#272c3d] text-sm font-bold text-white">
                  {profileInitial}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-[#111522] bg-[#22c55e]" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[0.88rem] font-semibold text-white">
                {displayName}
              </p>
              {profile?.isVerified ? (
                <Badge
                  title="This freelancer has successfully completed at least one project on our platform."
                  className="mt-1 h-5 border-emerald-500/20 bg-emerald-500/10 px-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-300"
                >
                  <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                  Verified Freelancer
                </Badge>
              ) : null}
              {typeof profile?.openToWork === "boolean" ? (
                <Badge
                  title="Auto-managed from your active project count."
                  className={`mt-1 h-5 px-2 text-[9px] font-semibold uppercase tracking-[0.16em] ${
                    profile.openToWork
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                      : "border-amber-500/20 bg-amber-500/10 text-amber-300"
                  }`}
                >
                  {profile.openToWork ? "Open to Work" : "At Capacity"}
                </Badge>
              ) : null}
              <p className="mt-0.5 text-[10px] text-[#6f7688]">View profile</p>
            </div>
          </button>
        </SheetClose>

        <SheetClose asChild>
          <button
            type="button"
            onClick={() => navigate(switchTargetPath)}
            className="flex shrink-0 flex-col items-end gap-0 rounded-[14px] px-1.5 py-1 text-right transition hover:bg-white/[0.04] hover:text-white"
          >
            <Repeat2 className="size-3.5 text-[#d7dbe6]" />
            <span className="text-[10px] font-medium text-[#7f8797]">
              switch to
            </span>
            <span className="text-[11px] font-semibold text-[#cfd5df]">
              {switchTargetLabel}
            </span>
          </button>
        </SheetClose>
      </div>
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
    <div className="border-b border-border px-4 py-3 lg:hidden">
      <div className="flex items-center justify-between gap-2.5">
        <Link to="/">
          <WorkspaceBrandMark />
        </Link>

        <div className="flex items-center gap-1">
          {topNotificationButton ? (
            <div className="rounded-full bg-white/[0.03] text-[#ffc107]">
              {topNotificationButton}
            </div>
          ) : null}

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open navigation menu"
                className="inline-flex size-10 items-center justify-center rounded-full bg-white/[0.02] text-white transition-colors hover:bg-white/[0.06]"
              >
                <Menu className="size-5" />
              </button>
            </SheetTrigger>

            <SheetContent
              side="right"
              showCloseButton={false}
              className="w-[min(92vw,23rem)] border-l border-border bg-background p-0 text-white shadow-[0_36px_120px_-48px_rgba(0,0,0,1)] sm:max-w-[23rem]"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation menu</SheetTitle>
                <SheetDescription>
                  Open workspace and site navigation links.
                </SheetDescription>
              </SheetHeader>

              <div className="flex items-center justify-between border-b border-border/70 px-4.5 py-3.5">
                <SheetClose asChild>
                  <Link to="/">
                    <WorkspaceBrandMark />
                  </Link>
                </SheetClose>

                <div className="flex items-center gap-2">
                  {drawerNotificationButton ? (
                    <div className="rounded-full bg-white/[0.04] text-[#ffc107]">
                      {drawerNotificationButton}
                    </div>
                  ) : null}

                  <SheetClose asChild>
                    <button
                      type="button"
                      aria-label="Close navigation menu"
                      className="inline-flex size-9 items-center justify-center rounded-full text-[#c6cad5] transition-colors hover:bg-white/[0.05] hover:text-white"
                    >
                      <X className="size-4.5" />
                    </button>
                  </SheetClose>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col px-4.5 pb-3.5">
                <div className="flex flex-1 flex-col gap-4 py-3.5">
                  <section>
                    <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#5d6476]">
                      Main
                    </p>
                    <div className="mt-1.5 space-y-0">
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
                  </section>

                  <section>
                    <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#5d6476]">
                      Home
                    </p>
                    <div className="mt-1.5 grid grid-cols-2 gap-1.5">
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
                  </section>

                  <div className="mt-auto space-y-2.5 pb-0.5">
                    <SheetClose asChild>
                      <button
                        type="button"
                        onClick={onLogout}
                        className="flex items-center gap-2.5 px-1 text-[0.88rem] font-medium text-[#b0b7c7] transition hover:text-white"
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
  renderNotificationButton: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.node,
  ]),
};

export default WorkspaceMobileSidebar;
