"use client";

import PropTypes from "prop-types";
import React from "react";
import { Link } from "react-router-dom";
import BadgeCheck from "lucide-react/dist/esm/icons/badge-check";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import House from "lucide-react/dist/esm/icons/house";
import LogOut from "lucide-react/dist/esm/icons/log-out";
import Repeat2 from "lucide-react/dist/esm/icons/repeat-2";
import UserRound from "lucide-react/dist/esm/icons/user-round";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/shared/context/AuthContext";
import { useDashboardSwitcher } from "@/shared/hooks/use-dashboard-switcher";
import { cn } from "@/shared/lib/utils";

const tileClasses =
  "flex size-[2.35rem] shrink-0 items-center justify-center rounded-[0.85rem] border border-white/[0.04] bg-white/[0.045] text-[#ececf1] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]";

const actionLabelClasses =
  "text-[0.84rem] font-semibold tracking-[-0.03em] text-white sm:text-[0.9rem]";

const ActionLink = ({ icon: Icon, label, to, onSelect }) => (
  <Link
    to={to}
    onClick={onSelect}
    className="flex items-center gap-2.5 rounded-[0.95rem] px-0.5 py-0.5 transition-colors duration-200 hover:bg-white/[0.025]"
  >
    <span className={tileClasses}>
      <Icon className="size-4.5 stroke-[1.85]" />
    </span>
    <span className={actionLabelClasses}>{label}</span>
  </Link>
);

ActionLink.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  to: PropTypes.string.isRequired,
};

const WorkspaceProfileDropdown = ({
  currentDashboard,
  displayName,
  profile,
  profileInitial,
  showVerifiedBadge = false,
}) => {
  const { logout } = useAuth();
  const [open, setOpen] = React.useState(false);
  const {
    canSwitchDashboard,
    currentDashboardLabel,
    dashboardPath,
    profilePath,
    switchDashboard,
    switchLabel,
  } = useDashboardSwitcher({ currentDashboard });
  const isFreelancer = currentDashboardLabel === "Freelancer";

  const closeDropdown = () => setOpen(false);

  const handleSwitchDashboard = () => {
    switchDashboard();
    closeDropdown();
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

          {showVerifiedBadge && profile?.isVerified ? (
            <span className="flex min-w-0 flex-col items-start gap-0.5 leading-none">
              <span className="max-w-[120px] truncate">{displayName}</span>
              <Badge
                title="This freelancer has successfully completed at least one project on our platform."
                className="h-5 border-emerald-500/20 bg-emerald-500/10 px-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-300"
              >
                <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                Verified Freelancer
              </Badge>
            </span>
          ) : (
            <span className="max-w-[120px] truncate">{displayName}</span>
          )}

          <ChevronDown
            className={cn(
              "h-4 w-4 text-white transition-transform duration-200",
              open ? "rotate-180" : ""
            )}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={14}
        className="w-[min(92vw,19.25rem)] rounded-[1.15rem] border border-white/[0.08] bg-[#121212] p-3 text-white shadow-[0_28px_84px_-48px_rgba(0,0,0,1)]"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <Avatar className="size-12 border border-white/[0.06] bg-white">
              <AvatarImage src={profile?.avatar} alt={displayName} />
              <AvatarFallback className="bg-white text-lg font-bold text-black">
                {profileInitial}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[1rem] font-semibold leading-none tracking-[-0.04em] text-white sm:text-[1.1rem]">
                {displayName}
              </p>
              <p className="mt-1 truncate text-[0.74rem] font-medium tracking-[-0.02em] text-[#7d7d86] sm:text-[0.8rem]">
                {profile?.email}
              </p>
            </div>
          </div>

          <Separator className="bg-white/[0.06]" />

          <div className="space-y-0.5">
            <ActionLink
              icon={House}
              label="Dashboard"
              to={dashboardPath}
              onSelect={closeDropdown}
            />
            <ActionLink
              icon={UserRound}
              label="Profile"
              to={profilePath}
              onSelect={closeDropdown}
            />
          </div>

          {canSwitchDashboard ? (
            <>
              <Separator className="bg-white/[0.06]" />

              <div className="rounded-[1rem] border border-white/[0.06] bg-white/[0.045] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSwitchDashboard}
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-[0.8rem] text-left transition-opacity hover:opacity-95"
                  >
                    <span className={tileClasses}>
                      <Repeat2 className="size-4.5 stroke-[1.85]" />
                    </span>

                    <span className="min-w-0">
                      <span className="block truncate text-[0.84rem] font-semibold tracking-[-0.03em] text-white">
                        {switchLabel}
                      </span>
                      <span className="mt-0.5 block truncate text-[0.72rem] text-[#85858d]">
                        Currently in {currentDashboardLabel} mode
                      </span>
                    </span>
                  </button>

                  <Switch
                    checked={isFreelancer}
                    onCheckedChange={handleSwitchDashboard}
                    aria-label={`${switchLabel} dashboard`}
                    className="h-6.5 w-[4rem] border-0 px-0.5 shadow-none data-[state=checked]:justify-end data-[state=checked]:bg-[#ffc107] data-[state=unchecked]:justify-start data-[state=unchecked]:bg-white/[0.12] [&_[data-slot=switch-thumb]]:size-4.5 [&_[data-slot=switch-thumb]]:!translate-x-0 [&_[data-slot=switch-thumb]]:shadow-none [&_[data-slot=switch-thumb]]:data-[state=checked]:bg-[#111111] [&_[data-slot=switch-thumb]]:data-[state=unchecked]:bg-white"
                  />
                </div>
              </div>
            </>
          ) : null}

          <Separator className="bg-white/[0.06]" />

          <button
            type="button"
            onClick={() => {
              closeDropdown();
              logout();
            }}
            className="flex w-full items-center gap-2.5 rounded-[1rem] border border-red-500/20 bg-red-500/[0.10] px-2 py-2 text-left transition-colors duration-200 hover:bg-red-500/[0.14]"
          >
            <span className="flex size-[2.35rem] shrink-0 items-center justify-center rounded-[0.85rem] bg-red-500/[0.12] text-[#ff6d6d]">
              <LogOut className="size-4.5 stroke-[1.85]" />
            </span>
            <span className="text-[0.84rem] font-semibold tracking-[-0.03em] text-[#ff6d6d]">
              Log Out
            </span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

WorkspaceProfileDropdown.propTypes = {
  currentDashboard: PropTypes.oneOf(["client", "freelancer"]).isRequired,
  displayName: PropTypes.string.isRequired,
  profile: PropTypes.shape({
    avatar: PropTypes.string,
    email: PropTypes.string,
    isVerified: PropTypes.bool,
  }),
  profileInitial: PropTypes.string.isRequired,
  showVerifiedBadge: PropTypes.bool,
};

export default WorkspaceProfileDropdown;
