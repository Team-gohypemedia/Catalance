import React from "react";
import Clock from "lucide-react/dist/esm/icons/clock";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import {
  FreelancerDashboardPanel,
  FreelancerDashboardSkeletonBlock,
} from "./shared.jsx";

const freelancerCompactEarningsSurfaceClassName =
  "rounded-[20px] border border-white/[0.06] bg-card px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:px-5 sm:py-5";

export const FreelancerCompactEarningsSummarySkeleton = () => (
  <section className="w-full min-w-0">
    <div className="mb-4 sm:mb-5">
      <FreelancerDashboardSkeletonBlock className="h-8 w-28 rounded-full" />
    </div>
    <FreelancerDashboardPanel className="overflow-hidden bg-card p-3.5 sm:p-4">
      <div className="space-y-3.5 sm:space-y-4">
        {[0, 1].map((item) => (
          <div
            key={`freelancer-compact-earnings-skeleton-${item}`}
            className={freelancerCompactEarningsSurfaceClassName}
          >
            <FreelancerDashboardSkeletonBlock className="h-3 w-20 rounded-full" />
            <FreelancerDashboardSkeletonBlock className="mt-3.5 h-7 w-32 rounded-full" />
            <FreelancerDashboardSkeletonBlock className="mt-2.5 h-4 w-40 rounded-full" />
            <FreelancerDashboardSkeletonBlock className="mt-4 h-4 w-28 rounded-full" />
          </div>
        ))}
      </div>
    </FreelancerDashboardPanel>
  </section>
);

const CompactEarningsSummary = ({
  receivedAmount,
  pendingAmount,
  momentumLabel,
  nextPayoutLabel,
}) => (
  <section className="w-full min-w-0">
    <div className="mb-4 sm:mb-5">
      <h2 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-white sm:text-[1.65rem]">
        Earnings
      </h2>
    </div>
    <FreelancerDashboardPanel className="overflow-hidden bg-card p-3.5 sm:p-4">
      <div className="space-y-3.5 sm:space-y-4">
        <div className={freelancerCompactEarningsSurfaceClassName}>
          <p className="text-[0.72rem] uppercase tracking-[0.18em] text-white">
            Received
          </p>
          <p className="mt-3.5 text-[1.65rem] font-semibold leading-none tracking-[-0.03em] text-white sm:text-[1.8rem]">
            {receivedAmount}
          </p>
          <p className="mt-2.5 text-sm text-muted-foreground">
            Cleared freelancer earnings
          </p>
          <div className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <TrendingUp className="size-3.5" />
            <span>{momentumLabel}</span>
          </div>
        </div>

        <div className={freelancerCompactEarningsSurfaceClassName}>
          <p className="text-[0.72rem] uppercase tracking-[0.18em] text-white">
            Pending
          </p>
          <p className="mt-3.5 text-[1.65rem] font-semibold leading-none tracking-[-0.03em] text-white sm:text-[1.8rem]">
            {pendingAmount}
          </p>
          <p className="mt-2.5 text-sm text-muted-foreground">
            Expected from active projects
          </p>
          <div className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Clock className="size-3.5" />
            <span>{nextPayoutLabel}</span>
          </div>
        </div>
      </div>
    </FreelancerDashboardPanel>
  </section>
);

export default CompactEarningsSummary;
