import React from "react";
import {
  FreelancerDashboardPanel,
  FreelancerDashboardSkeletonBlock,
} from "./shared.jsx";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";

export const FreelancerProfileCompletionSkeleton = () => (
  <section>
    <FreelancerDashboardPanel className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <FreelancerDashboardSkeletonBlock className="h-8 w-[26rem] max-w-full rounded-full" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:w-auto lg:justify-end">
          <FreelancerDashboardSkeletonBlock className="h-5 w-24 rounded-full" />
          <FreelancerDashboardSkeletonBlock className="h-10 w-full rounded-full sm:w-32" />
        </div>
      </div>
      <FreelancerDashboardSkeletonBlock className="mt-5 h-2 w-full rounded-full" />
    </FreelancerDashboardPanel>
  </section>
);

const ProfileCompletionPanel = ({
  completionPercent,
  isComplete,
  onOpenProfile,
  missingDetails = [],
  completionMessage = "",
}) => {
  return (
    <section>
      <FreelancerDashboardPanel className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-[22px] sm:text-[1.35rem] lg:text-[1.55rem] font-semibold leading-[1.08] tracking-[-0.03em] dark:text-white text-[#1C1B1F]">
              {isComplete
                ? "Your Catalance profile is ready"
                : "Finish setting up your Catalance profile"}
            </h2>
            {!isComplete && completionMessage && (
              <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
                {completionMessage}
              </p>
            )}
          </div>

          <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end lg:gap-4">
            <span className="text-sm font-bold text-[var(--primary)]">
              {completionPercent}% Complete
            </span>
            <button
              type="button"
              className="h-11 min-w-[180px] rounded-xl bg-[var(--primary)] px-6 text-sm font-bold text-white dark:text-[#1C1B1F] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:bg-primary/90 active:scale-98"
              onClick={onOpenProfile}
            >
              {isComplete ? "Open Profile" : "Finish Setup"}
            </button>
          </div>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${completionPercent}%` }}
          />
        </div>

        {/* Display remaining small tasks if profile is not complete */}
        {!isComplete && missingDetails.length > 0 && (
          <>
            <div className="mt-6 border-t border-white/[0.08] pt-5" />
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Remaining Setup Tasks
              </h3>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Click a task to edit
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {missingDetails.map((detail, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={onOpenProfile}
                  className="group flex items-start gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white/[0.05] active:translate-y-0"
                >
                  <div className="flex size-5 shrink-0 items-center justify-center rounded-full border border-muted-foreground/30 text-muted-foreground/50 group-hover:border-primary group-hover:bg-primary/10 group-hover:text-primary transition-all duration-200">
                    <div className="size-1.5 rounded-full bg-muted-foreground/30 group-hover:bg-primary transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors block">
                      {detail}
                    </span>
                  </div>
                  <ArrowRight className="size-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary ms-auto self-center" />
                </button>
              ))}
            </div>
          </>
        )}

        {/* Completion Celebration Message */}
        {isComplete && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4 text-emerald-400">
            <Sparkles className="size-5 shrink-0 text-emerald-400" />
            <p className="text-xs sm:text-sm font-medium text-emerald-300">
              Fantastic job! Your profile is 100% complete. You are fully ready to win new projects!
            </p>
          </div>
        )}
      </FreelancerDashboardPanel>
    </section>
  );
};

export default ProfileCompletionPanel;
