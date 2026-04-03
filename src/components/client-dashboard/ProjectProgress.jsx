import React, { memo } from "react";
import { ProjectProgressSection } from "@/components/features/client/dashboard/ClientDashboardShell.jsx";
import {
  DashboardPanel,
  DashboardSkeletonBlock,
} from "@/components/client-dashboard/shared.jsx";
import { cn } from "@/shared/lib/utils";

const ProjectProgress = memo(function ProjectProgress({
  isLoading = false,
  className = "",
  ...props
}) {
  if (isLoading) {
    return (
      <section className={cn("mt-14 sm:mt-16", className)}>
        <div className="mb-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.05em] text-white">
              Project Progress
            </h2>
            <p className="mt-2 text-sm text-[#94a3b8]">
              Track ongoing project phases once the initial project payment has
              been completed.
            </p>
          </div>
          <DashboardSkeletonBlock className="h-12 w-40 rounded-full" />
        </div>

        <DashboardPanel className="overflow-hidden bg-accent p-6">
          <DashboardSkeletonBlock className="h-[360px] w-full rounded-[24px]" />
        </DashboardPanel>
      </section>
    );
  }

  return <ProjectProgressSection {...props} />;
});

export default ProjectProgress;
