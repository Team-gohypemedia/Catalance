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
  "flex size-[2.05rem] shrink-0 items-center justify-center rounded-[0.8rem] border border-border bg-muted text-foreground";

const actionLabelClasses =
  "text-[0.86rem] font-semibold tracking-[-0.03em] text-foreground sm:text-[0.9rem]";

const ActionLink = ({ icon: Icon, label, to, onSelect }) => (
  <Link
    to={to}
    onClick={onSelect}
    className="flex items-center gap-2.5 rounded-[0.95rem] px-0.5 py-0.5 transition-colors duration-200 hover:bg-muted"
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
  portalled = true,
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
          className="flex h-11 shrink-0 items-center gap-2.5 rounded-full border border-border bg-transparent px-3.5 text-[0.92rem] font-semibold text-[#1C1B1F] dark:text-white shadow-none transition-colors hover:border-border hover:bg-transparent"
        >
          <Avatar className="size-6.5 border border-border">
            <AvatarImage src={profile?.avatar} alt={displayName} />
            <AvatarFallback className="bg-black/5 text-xs font-semibold text-black">
              {profileInitial}
            </AvatarFallback>
          </Avatar>

          {showVerifiedBadge && profile?.isVerified ? (
            <span className="flex min-w-0 flex-col items-start gap-0.5 leading-none">
              <span className="max-w-[104px] truncate whitespace-nowrap">{displayName}</span>
              <Badge
                title="This freelancer has successfully completed at least one project on our platform."
                className="h-4.5 border-emerald-500/20 bg-emerald-500/10 px-1.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-emerald-300"
              >
                <BadgeCheck className="h-2.5 w-2.5" aria-hidden="true" />
                Verified Freelancer
              </Badge>
            </span>
          ) : (
            <span className="max-w-[104px] truncate whitespace-nowrap">{displayName}</span>
          )}

          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-[#1C1B1F] dark:text-white transition-transform duration-200",
              open ? "rotate-180" : ""
            )}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={12}
        portalled={portalled}
        className="w-[min(92vw,17rem)] rounded-[1rem] border border-border bg-card p-2.5 text-foreground shadow-lg"
      >
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5">
            <Avatar className="size-10 border border-border">
              <AvatarImage src={profile?.avatar} alt={displayName} />
              <AvatarFallback className="bg-muted text-base font-bold text-foreground">
                {profileInitial}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.98rem] font-semibold leading-none tracking-[-0.04em] text-foreground sm:text-[1.05rem]">
                {displayName}
              </p>
              <p className="mt-1 truncate text-[0.78rem] font-medium tracking-[-0.02em] text-muted-foreground sm:text-[0.82rem]">
                {profile?.email}
              </p>
            </div>
          </div>

          <Separator />

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
              <Separator />

              <div className="rounded-[0.95rem] border border-border bg-muted p-1.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSwitchDashboard}
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-[0.75rem] text-left transition-opacity hover:opacity-95"
                  >
                    <span className={tileClasses}>
                      <Repeat2 className="size-4.5 stroke-[1.85]" />
                    </span>

                    <span className="min-w-0">
                      <span className="block truncate text-[0.86rem] font-semibold tracking-[-0.03em] text-foreground">
                        {switchLabel}
                      </span>
                      <span className="mt-0.5 block truncate text-[0.73rem] text-muted-foreground">
                        Currently in {currentDashboardLabel} mode
                      </span>
                    </span>
                  </button>

                  <Switch
                    checked={isFreelancer}
                    onCheckedChange={handleSwitchDashboard}
                    aria-label={`${switchLabel} dashboard`}
                    className="h-6 w-[3.55rem] border-0 px-0.5 shadow-none data-[state=checked]:justify-end data-[state=checked]:bg-primary data-[state=unchecked]:justify-start data-[state=unchecked]:bg-muted-foreground/30 [&_[data-slot=switch-thumb]]:size-4 [&_[data-slot=switch-thumb]]:!translate-x-0 [&_[data-slot=switch-thumb]]:shadow-none [&_[data-slot=switch-thumb]]:data-[state=checked]:bg-background [&_[data-slot=switch-thumb]]:data-[state=unchecked]:bg-background"
                  />
                </div>
              </div>
            </>
          ) : null}

          <Separator />

          <button
            type="button"
            onClick={() => {
              closeDropdown();
              logout();
            }}
            className="flex w-full items-center gap-2 rounded-[0.95rem] border border-red-500/20 bg-red-500/[0.10] px-2 py-1.75 text-left transition-colors duration-200 hover:bg-red-500/[0.14]"
          >
            <span className="flex size-[2.05rem] shrink-0 items-center justify-center rounded-[0.8rem] bg-red-500/[0.12] text-[#ff6d6d]">
              <LogOut className="size-4 stroke-[1.85]" />
            </span>
            <span className="text-[0.86rem] font-semibold tracking-[-0.03em] text-[#ff6d6d]">
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
