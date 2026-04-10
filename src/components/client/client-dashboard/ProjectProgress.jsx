import React, { memo, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useOptionalClientDashboardData } from "./useClientDashboardData.js";
import { DashboardPanel, DashboardSkeletonBlock } from "./shared.jsx";
import { ProjectProgressSection } from "./ProjectProgressChart.jsx";
import { buildProgressProjects } from "./ProjectProgress.helpers.js";
import { cn } from "@/shared/lib/utils";

const projectProgressSkeletonYAxisLabels = ["phase-4", "phase-3", "phase-2", "phase-1"];

const projectProgressSkeletonXAxisLabels = ["w-10", "w-12", "w-10", "w-8", "w-12", "w-10"];

const projectProgressSkeletonLegendItems = [
  { id: "series-1", widthClassName: "w-16 sm:w-20" },
  { id: "series-2", widthClassName: "w-20 sm:w-24" },
];

const ProjectProgressLoadingSkeleton = memo(function ProjectProgressLoadingSkeleton({
  className = "",
}) {
  return (
    <section className={cn("mt-14 sm:mt-16", className)} aria-busy="true">
      <div className="mb-4 flex flex-col gap-4 sm:mb-5 sm:gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-3">
          <DashboardSkeletonBlock className="h-9 w-56 rounded-full sm:h-10 sm:w-72" />
          <DashboardSkeletonBlock className="h-4 w-[min(100%,26rem)] rounded-full" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <DashboardSkeletonBlock className="h-11 w-36 rounded-full sm:h-12" />
          <DashboardSkeletonBlock className="h-11 w-44 rounded-full sm:h-12" />
        </div>
      </div>

      <DashboardPanel className="overflow-hidden bg-card shadow-[0_30px_90px_-28px_rgba(0,0,0,0.95)]">
        <div className="px-4 pb-6 pt-4 sm:px-8 sm:pb-8 sm:pt-8">
          <div className="overflow-x-auto pb-2 [scrollbar-color:rgba(255,255,255,0.14)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/12">
            <div className="min-w-180 lg:min-w-0">
              <div className="grid h-85 grid-cols-[68px_minmax(0,1fr)] gap-4 sm:h-110 xl:h-125">
                <div className="flex flex-col justify-between py-10">
                  {projectProgressSkeletonYAxisLabels.map((label, index) => (
                    <DashboardSkeletonBlock
                      key={`project-progress-skeleton-y-${label}`}
                      className={cn(
                        "h-3 rounded-full",
                        index === 0 ? "w-16" : index === 1 ? "w-14" : index === 2 ? "w-12" : "w-10",
                      )}
                    />
                  ))}
                </div>

                <div className="relative overflow-hidden rounded-[26px] border border-white/4 bg-[#1d1d1d]/90 px-4 py-5 sm:px-6">
                  <div className="absolute inset-0">
                    {[16, 36, 56, 76].map((topOffset) => (
                      <div
                        key={`project-progress-skeleton-grid-${topOffset}`}
                        className="absolute left-0 right-0 border-t border-dashed border-white/7"
                        style={{ top: `${topOffset}%` }}
                      />
                    ))}
                  </div>

                  <div className="relative flex h-full flex-col justify-between">
                    <div className="absolute right-[11%] top-3 flex h-[82%] flex-col items-center">
                      <DashboardSkeletonBlock className="h-5 w-12 rounded-sm bg-[#ffd400]/25" />
                      <div className="mt-2 h-full border-l border-dashed border-[#ffd400]/35" />
                      <DashboardSkeletonBlock className="size-4 rounded-full bg-[#ffd400]/35" />
                    </div>

                    <svg
                      viewBox="0 0 1000 360"
                      className="h-full w-full overflow-visible"
                      aria-hidden="true"
                    >
                      <path
                        d="M 48 302 C 132 236, 190 168, 262 154 S 408 150, 492 194 S 650 244, 760 164 S 900 118, 952 114"
                        fill="none"
                        stroke="rgba(126,112,232,0.36)"
                        strokeWidth="5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 48 302 C 220 302, 424 302, 952 302"
                        fill="none"
                        stroke="rgba(255,212,0,0.28)"
                        strokeWidth="5"
                        strokeLinecap="round"
                      />
                      {[96, 258, 434, 618, 796, 934].map((x, index) => (
                        <circle
                          key={`project-progress-skeleton-dot-${x}`}
                          cx={x}
                          cy={[300, 154, 194, 164, 118, 114][index]}
                          r={index === 0 ? 8 : 6}
                          fill={index === 0 ? "rgba(255,212,0,0.42)" : "rgba(126,112,232,0.35)"}
                          stroke="#171717"
                          strokeWidth={index === 0 ? 4 : 3}
                        />
                      ))}
                    </svg>

                    <div className="mt-4 flex items-center justify-between gap-3 px-2 sm:px-4">
                      {projectProgressSkeletonXAxisLabels.map((widthClassName, index) => (
                        <DashboardSkeletonBlock
                          key={`project-progress-skeleton-x-${index}`}
                          className={cn("h-3 rounded-full", widthClassName)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {projectProgressSkeletonLegendItems.map((item) => (
                  <div
                    key={`project-progress-skeleton-legend-${item.id}`}
                    className="inline-flex max-w-full items-center gap-2 rounded-full bg-white/6 px-4 py-2"
                  >
                    <DashboardSkeletonBlock className="size-2 rounded-full" />
                    <DashboardSkeletonBlock
                      className={cn("h-3 rounded-full", item.widthClassName)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardPanel>
    </section>
  );
});

const ProjectProgress = memo(function ProjectProgress({
  isLoading = false,
  className = "",
  onOpenQuickProject,
  progressProjects,
  onViewProject,
  ...props
}) {
  const navigate = useNavigate();
  const dashboardData = useOptionalClientDashboardData();
  const resolvedProgressProjects = useMemo(() => {
    if (Array.isArray(progressProjects)) {
      return progressProjects;
    }

    return buildProgressProjects(dashboardData?.activeProjectCards || []);
  }, [dashboardData?.activeProjectCards, progressProjects]);
  const resolvedIsLoading = isLoading || dashboardData?.isLoading;
  const handleViewProject = useCallback(
    (projectId) => {
      if (!projectId) return;

      navigate(`/client/project/${encodeURIComponent(projectId)}`);
    },
    [navigate],
  );
  const handleOpenQuickProject = useCallback(() => {
    if (typeof onOpenQuickProject === "function") {
      onOpenQuickProject();
      return;
    }

    navigate("/service");
  }, [navigate, onOpenQuickProject]);

  if (resolvedIsLoading) {
    return <ProjectProgressLoadingSkeleton className={className} />;
  }

  return (
    <ProjectProgressSection
      {...props}
      progressProjects={resolvedProgressProjects}
      onViewProject={onViewProject || handleViewProject}
      onOpenQuickProject={handleOpenQuickProject}
    />
  );
});

export default ProjectProgress;
