import React from "react";
import {
  ActiveChats,
  ActiveProjects,
  ClientDashboardDialogs,
  ClientDashboardDataProvider,
  ClientDashboardHeader,
  DraftedProposals,
  HeroGreetingBlock,
  OverviewMetricsGrid,
  ProjectProgress,
  RecentActivity,
  WishlistedFreelancers,
} from "@/components/client/client-dashboard";
import ClientDashboardFooter from "@/components/features/client/ClientDashboardFooter";

const ClientDashboard = () => (
  <ClientDashboardDataProvider>
    <div className="min-h-screen bg-background text-[#f1f5f9]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1536px] flex-col px-4 sm:px-6 lg:px-[40px] xl:w-[85%] xl:max-w-none">
        <ClientDashboardHeader />

        <main className="flex-1 pb-12">
          <HeroGreetingBlock />
          <OverviewMetricsGrid />
          <ActiveProjects />

          <section className="mt-14 grid items-start gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-7 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="min-w-0 flex flex-col gap-5 sm:gap-6 xl:gap-7">
              <DraftedProposals />
              <RecentActivity />
            </div>

            <div className="grid gap-5 sm:gap-6 xl:gap-7">
              <ActiveChats />
              <WishlistedFreelancers />
            </div>
          </section>

          <ProjectProgress />
        </main>

        <ClientDashboardFooter variant="workspace" />
      </div>

      <ClientDashboardDialogs />
    </div>
  </ClientDashboardDataProvider>
);

export default ClientDashboard;
