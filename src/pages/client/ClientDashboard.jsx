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
  WishlistedFreelancers,
} from "@/components/client/client-dashboard";
import ClientDashboardFooter from "@/components/features/client/ClientDashboardFooter";

const ClientDashboardContent = () => {
  const dashboardData = useOptionalClientDashboardData();
  const isLoading = Boolean(dashboardData?.isLoading);
  const activeProjectCount = Number(dashboardData?.activeProjectCount || 0);
  const useEmptyWorkspaceLayout = !isLoading && activeProjectCount === 0;

  return (
    <div className="min-h-screen bg-background text-[#f1f5f9]">
      <div className="mx-auto flex w-full max-w-[1536px] flex-col px-4 sm:px-6 lg:px-[40px] xl:w-[85%] xl:max-w-none">
        <ClientDashboardHeader />

        <main className="flex-1 pb-12">
          <HeroGreetingBlock />
          <OverviewMetricsGrid />
          <ActiveProjects />

          {useEmptyWorkspaceLayout ? (
            <section className="mt-14 flex flex-col gap-5 sm:gap-6 xl:gap-7">
              <Proposals />

              <section className="grid items-stretch gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-7 xl:grid-cols-[minmax(0,1fr)_420px]">
                <div className="min-w-0 flex h-full flex-col gap-5 sm:gap-6 xl:gap-7">
                  <RecentActivity />
                </div>

                <div className="grid h-full gap-5 sm:gap-6 xl:gap-7">
                  <WishlistedFreelancers />
                </div>
              </section>
            </section>
          ) : (
            <section className="mt-14 grid items-start gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-7 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="min-w-0 flex flex-col gap-5 sm:gap-6 xl:gap-7">
                <Proposals />
                <RecentActivity />
              </div>

              <div className="grid gap-5 sm:gap-6 xl:gap-7">
                <ActiveChats />
                <WishlistedFreelancers />
              </div>
            </section>
          )}

          <ProjectProgress />
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
