import React from "react";
import {
  FreelancerDashboardPanel,
  FreelancerDashboardSkeletonBlock,
} from "./shared.jsx";

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
}) => {
  return (
    <section>
      <FreelancerDashboardPanel className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="min-w-0 text-[1.2rem] font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-[1.35rem] lg:text-[1.55rem]">
            {isComplete
              ? "Your Catalance profile is ready"
              : "Finish setting up your Catalance profile"}
          </h2>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:w-auto lg:justify-end lg:gap-4">
            <span className="text-sm font-bold text-[#facc15]">
              {completionPercent}% Complete
            </span>
            <button
              type="button"
              className="h-10 w-full rounded-full bg-[#facc15] px-5 text-xs font-semibold text-black transition-colors hover:bg-[#ffd54f] sm:w-auto"
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
      </FreelancerDashboardPanel>
    </section>
  );
};

export default ProfileCompletionPanel;
