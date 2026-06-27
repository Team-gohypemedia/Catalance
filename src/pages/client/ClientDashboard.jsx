import React from "react";
import {
  ActiveChats,
  ActiveProjects,
  ClientDashboardDialogs,
  ClientDashboardDataProvider,
  ClientDashboardHeader,
  HeroGreetingBlock,
  OverviewMetricsGrid,
  useOptionalClientDashboardData,
  ProjectProgress,
  RecentActivity,
  Proposals,
} from "@/components/client/client-dashboard";
import ClientDashboardFooter from "@/components/features/client/ClientDashboardFooter";

const ClientDashboardContent = () => {
  const dashboardData = useOptionalClientDashboardData();
  const isLoading = Boolean(dashboardData?.isLoading);
  const activeProjectCount = Number(dashboardData?.activeProjectCount || 0);
  const useEmptyWorkspaceLayout = !isLoading && activeProjectCount === 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-[1536px] flex-col px-4 sm:px-6 lg:px-[40px] xl:w-[94%] xl:max-w-none">
        <ClientDashboardHeader />

        <main className="flex-1 pb-12">
          <HeroGreetingBlock />
          <ActiveProjects />

          <section className={useEmptyWorkspaceLayout ? "mt-14" : "mt-14 grid items-start gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-7 xl:grid-cols-[minmax(0,1fr)_420px]"}>
            <div className={useEmptyWorkspaceLayout ? "" : "min-w-0 flex flex-col gap-5 sm:gap-6 xl:gap-7"}>
              <Proposals />
            </div>

            {!useEmptyWorkspaceLayout && (
              <div className="grid gap-5 sm:gap-6 xl:gap-7">
                <ActiveChats />
              </div>
            )}
          </section>

          <ProjectProgress />

          <RecentActivity className="mt-14 sm:mt-16" />
        </main>

        <ClientDashboardFooter variant="workspace" />
      </div>

      <ClientDashboardDialogs />
    </div>
  );
};

const ClientDashboard = () => (
  <ClientDashboardDataProvider>
    <ClientDashboardContent />
  </ClientDashboardDataProvider>
);

export default ClientDashboard;
