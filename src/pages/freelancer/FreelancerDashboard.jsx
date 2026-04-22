import React from "react";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SuspensionAlert } from "@/components/ui/suspension-alert";
import FreelancerWorkspaceHeader from "@/components/features/freelancer/FreelancerWorkspaceHeader";
import { DashboardContent as FreelancerDashboardContent } from "@/components/freelancer/freelancer-dashboard/FreelancerDashboardContent.jsx";
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
  return (
    <FreelancerDashboardContent>
      {(model) => {
        const hasRunningProjects =
          !model.metricsLoading && model.runningProjectCards.length > 0;

        return (
        <div className="min-h-screen bg-background text-[#f1f5f9]">
          <div className="mx-auto flex min-h-screen w-full max-w-[1536px] flex-col px-4 sm:px-6 lg:px-[40px] xl:w-[85%] xl:max-w-none">
            <SuspensionAlert
              open={model.showSuspensionAlert}
              onOpenChange={model.setShowSuspensionAlert}
              suspendedAt={model.sessionUser?.suspendedAt}
            />

            <Dialog
              open={model.showWelcomeDialog}
              onOpenChange={model.setShowWelcomeDialog}
            >
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Welcome to Catalance
                  </DialogTitle>
                  <DialogDescription>
                    Your freelancer account is ready. You can explore the dashboard now
                    and start onboarding whenever you want.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => model.setShowWelcomeDialog(false)}
                  >
                    Continue to Dashboard
                  </Button>
                  <Button
                    onClick={() => {
                      model.setShowWelcomeDialog(false);
                      model.onOpenOnboarding();
                    }}
                  >
                    Start Onboarding
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

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
                {model.showOnboardingAlert ? (
                  <div className="relative overflow-hidden rounded-[24px] border border-[#facc15]/30 bg-[#252116] px-4 py-4 sm:px-5">
                    <div className="pointer-events-none absolute -right-12 -top-16 h-36 w-36 rounded-full bg-[#facc15]/15 blur-3xl" />
                    <div className="relative z-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#facc15]">
                          Onboarding Required
                        </p>
                        <h3 className="mt-1 text-base font-semibold text-zinc-100">
                          Complete your profile to start getting matched with
                          higher-value projects.
                        </h3>
                      </div>
                      <Button
                        className="h-9 rounded-full bg-[#facc15] px-5 text-xs font-bold text-black hover:bg-[#eab308]"
                        onClick={model.onOpenOnboarding}
                      >
                        Start Onboarding
                      </Button>
                    </div>
                  </div>
                ) : null}

                <HeroGreetingBlock
                  greeting={model.hero.greeting}
                  firstName={model.hero.firstName}
                  dateLabel={model.hero.dateLabel}
                />

                <OverviewMetricsGrid
                  metrics={model.dashboardMetricCards}
                  isLoading={model.metricsLoading}
                />

                {model.shouldShowProfileCompletionPanel ? (
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
          </div>
        </div>
        );
      }}
    </FreelancerDashboardContent>
  );
};

export default FreelancerDashboard;
