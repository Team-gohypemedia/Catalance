import React from "react";
import { useNavigate } from "react-router-dom";
import { SuspensionAlert } from "@/components/ui/suspension-alert";
import FreelancerWorkspaceHeader from "@/components/features/freelancer/FreelancerWorkspaceHeader";
import FreelancerOnboardingWelcomeModal from "@/components/features/freelancer/FreelancerOnboardingWelcomeModal.jsx";
import { DashboardContent as FreelancerDashboardContent } from "@/components/freelancer/freelancer-dashboard/FreelancerDashboardContent.jsx";
import { useAuth } from "@/shared/context/AuthContext";
import {
  FREELANCER_ONBOARDING_PATH,
  requiresFreelancerOnboarding,
} from "@/shared/lib/dashboard-preference";
import {
  ActiveChats,
  ActiveProjects,
  ClientReviewsPanel,
  CompactEarningsSummary,
  DeliveryPipeline,
  FreelancerActiveProjectsSkeleton,
  FreelancerChatsSkeleton,
  FreelancerClientReviewsSkeleton,
  FreelancerCompactEarningsSummarySkeleton,
  FreelancerDeliveryPipelineSkeleton,
  FreelancerPendingProposalsSkeleton,
  FreelancerProfileCompletionSkeleton,
  FreelancerRecentActivitySkeleton,
  HeroGreetingBlock,
  OverviewMetricsGrid,
  PendingProposals,
  ProfileCompletionPanel,
  RecentActivity,
} from "@/components/freelancer/freelancer-dashboard";

const FreelancerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const shouldShowOnboardingWelcome = requiresFreelancerOnboarding(user);

  return (
    <FreelancerDashboardContent>
      {(model) => {
        const hasRunningProjects =
          !model.metricsLoading && model.runningProjectCards.length > 0;
        const shouldShowProfileProgressPanel =
          !shouldShowOnboardingWelcome &&
          model.shouldShowProfileCompletionPanel;

        return (
        <div className="min-h-screen bg-background text-[#f1f5f9]">
          <div className="mx-auto flex min-h-screen w-full max-w-[1536px] flex-col px-4 sm:px-6 lg:px-[40px] xl:w-[85%] xl:max-w-none">
            <SuspensionAlert
              open={model.showSuspensionAlert}
              onOpenChange={model.setShowSuspensionAlert}
              suspendedAt={model.sessionUser?.suspendedAt}
            />

            <FreelancerWorkspaceHeader
              profile={model.headerProfile}
              activeWorkspaceKey={model.activeWorkspaceKey}
              onWorkspaceNav={model.handleWorkspaceNav}
              onOpenProfile={model.onOpenProfile}
              onPrimaryAction={
                model.activeWorkspaceKey !== "proposals"
                  ? model.onOpenProposals
                  : undefined
              }
              notifications={model.notifications}
              unreadCount={model.unreadCount}
              markAllAsRead={model.markAllAsRead}
              onNotificationClick={model.handleNotificationClick}
            />

            <main className="relative z-10 flex-1 pb-12 sm:pb-14">
              <div className="flex w-full flex-col gap-6 sm:gap-7">
                <HeroGreetingBlock
                  greeting={model.hero.greeting}
                  firstName={model.hero.firstName}
                  dateLabel={model.hero.dateLabel}
                />

                <OverviewMetricsGrid
                  metrics={model.dashboardMetricCards}
                  isLoading={model.metricsLoading}
                />

                {shouldShowProfileProgressPanel ? (
                  model.showProfileCompletionSkeleton ? (
                    <FreelancerProfileCompletionSkeleton />
                  ) : (
                    <ProfileCompletionPanel
                      completionPercent={model.profileCompletionPercent}
                      isComplete={model.profileCompletionComplete}
                      onOpenProfile={model.onOpenProfile}
                    />
                  )
                ) : null}

                {model.metricsLoading ? (
                  <FreelancerActiveProjectsSkeleton />
                ) : hasRunningProjects ? (
                  <ActiveProjects
                    runningProjectCards={model.runningProjectCards}
                    redirectCards={model.freelancerProjectRedirectCards}
                    shouldUseProjectCarousel={model.shouldUseProjectCarousel}
                    setProjectCarouselApi={model.setProjectCarouselApi}
                    projectCarouselApi={model.projectCarouselApi}
                    canGoPrevious={model.canGoToPreviousProjects}
                    canGoNext={model.canGoToNextProjects}
                    projectCarouselSnapCount={model.projectCarouselSnapCount}
                    activeProjectSnap={model.activeProjectSnap}
                    projectCardRefs={model.projectCardRefs}
                    isMobile={model.isMobile}
                    mobileProjectCardHeight={model.mobileProjectCardHeight}
                    activeProjectCardClassName={model.activeProjectCardClassName}
                    activeProjectRedirectCardClassName={
                      model.activeProjectRedirectCardClassName
                    }
                  />
                ) : (
                  <PendingProposals
                    pendingProposalRows={model.pendingProposalRows}
                    onOpenAll={model.onOpenProposals}
                  />
                )}

                <section className="grid items-stretch grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
                  <div className="flex h-full min-w-0 flex-col gap-5">
                    {model.metricsLoading ? (
                      <FreelancerPendingProposalsSkeleton />
                    ) : hasRunningProjects ? (
                      <PendingProposals
                        pendingProposalRows={model.pendingProposalRows}
                        onOpenAll={model.onOpenProposals}
                      />
                    ) : (
                      <ActiveProjects
                        runningProjectCards={model.runningProjectCards}
                        redirectCards={model.freelancerProjectRedirectCards}
                        shouldUseProjectCarousel={model.shouldUseProjectCarousel}
                        setProjectCarouselApi={model.setProjectCarouselApi}
                        projectCarouselApi={model.projectCarouselApi}
                        canGoPrevious={model.canGoToPreviousProjects}
                        canGoNext={model.canGoToNextProjects}
                        projectCarouselSnapCount={model.projectCarouselSnapCount}
                        activeProjectSnap={model.activeProjectSnap}
                        projectCardRefs={model.projectCardRefs}
                        isMobile={model.isMobile}
                        mobileProjectCardHeight={model.mobileProjectCardHeight}
                        activeProjectCardClassName={model.activeProjectCardClassName}
                        activeProjectRedirectCardClassName={
                          model.activeProjectRedirectCardClassName
                        }
                      />
                    )}

                    {model.metricsLoading ? (
                      <FreelancerRecentActivitySkeleton />
                    ) : (
                      <RecentActivity
                        recentActivities={model.activityItems}
                        onOpenViewAll={model.onOpenNotificationSheet}
                        className="flex-1"
                      />
                    )}
                  </div>

                  <div className="flex h-full flex-col gap-5 self-stretch">
                    {model.metricsLoading ? (
                      <>
                        <FreelancerChatsSkeleton />
                        <FreelancerClientReviewsSkeleton />
                        <FreelancerCompactEarningsSummarySkeleton />
                      </>
                    ) : (
                      <>
                        <ActiveChats
                          previewMessages={model.previewMessages}
                          onOpenMessages={model.onOpenMessages}
                        />
                        <ClientReviewsPanel
                          reviews={model.clientReviews}
                          meta={model.clientReviewsMeta}
                          isLoading={model.clientReviewsLoading}
                        />
                        <CompactEarningsSummary
                          receivedAmount={model.receivedEarningsLabel}
                          pendingAmount={model.pendingEarningsLabel}
                          momentumLabel={model.earningsMomentumSummary.label}
                          nextPayoutLabel={model.nextPayoutSummaryLabel}
                        />
                      </>
                    )}
                  </div>
                </section>

                {model.metricsLoading ? (
                  <FreelancerDeliveryPipelineSkeleton />
                ) : (
                  <DeliveryPipeline
                    activeRunningProjectsFilterLabel={
                      model.activeRunningProjectsFilterLabel
                    }
                    runningProjectFilterOptions={model.runningProjectFilterOptions}
                    runningProjectsFilter={model.runningProjectsFilter}
                    setRunningProjectsFilter={model.setRunningProjectsFilter}
                    visibleRunningProjects={model.visibleRunningProjects}
                    showRunningProjectsCarouselControls={
                      model.showRunningProjectsCarouselControls
                    }
                    runningProjectsCarouselApi={model.runningProjectsCarouselApi}
                    setRunningProjectsCarouselApi={
                      model.setRunningProjectsCarouselApi
                    }
                    canGoToPreviousRunningProjects={
                      model.canGoToPreviousRunningProjects
                    }
                    canGoToNextRunningProjects={model.canGoToNextRunningProjects}
                    runningProjectsCarouselSnapCount={
                      model.runningProjectsCarouselSnapCount
                    }
                    activeRunningProjectsSnap={model.activeRunningProjectsSnap}
                    selectedRunningProjectId={model.selectedRunningProjectId}
                    setSelectedRunningProjectId={model.setSelectedRunningProjectId}
                    activeScheduleProjectTitle={model.activeScheduleProjectTitle}
                    activeProposalForSchedule={model.activeProposalForSchedule}
                    scheduleTimelineRows={model.scheduleTimelineRows}
                    schedulePhaseSegments={model.schedulePhaseSegments}
                    activeSchedulePhaseSegmentIndex={
                      model.activeSchedulePhaseSegmentIndex
                    }
                    scheduleMarkerLeftPct={model.scheduleMarkerLeftPct}
                    scheduleTodayDateLabel={model.scheduleTodayDateLabel}
                    activeScheduleProgressPct={model.activeScheduleProgressPct}
                    schedulePhases={model.schedulePhases}
                    activeScheduleDueInDays={model.activeScheduleDueInDays}
                    nextPayoutSummaryLabel={model.nextPayoutSummaryLabel}
                  />
                )}
              </div>
            </main>

            <FreelancerOnboardingWelcomeModal
              open={shouldShowOnboardingWelcome}
              onStartOnboarding={() =>
                navigate(FREELANCER_ONBOARDING_PATH, { replace: true })
              }
            />
          </div>
        </div>
        );
      }}
    </FreelancerDashboardContent>
  );
};

export default FreelancerDashboard;
