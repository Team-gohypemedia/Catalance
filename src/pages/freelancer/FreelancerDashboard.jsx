import React from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SuspensionAlert } from "@/components/ui/suspension-alert";
import FreelancerWorkspaceHeader from "@/components/features/freelancer/FreelancerWorkspaceHeader";
import FreelancerOnboardingWelcomeModal from "@/components/features/freelancer/FreelancerOnboardingWelcomeModal.jsx";
import { DashboardContent as FreelancerDashboardContent } from "@/components/freelancer/freelancer-dashboard/FreelancerDashboardContent.jsx";
import { useAuth } from "@/shared/context/AuthContext";
import { useNotifications } from "@/shared/context/NotificationContext";
import {
  FREELANCER_ONBOARDING_PATH,
  requiresFreelancerOnboarding,
} from "@/shared/lib/dashboard-preference";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createMarketplaceChatRequest, acceptMarketplaceChatRequest, declineMarketplaceChatRequest } from "@/shared/lib/marketplace-chat-requests";
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
  PendingProposals,
  ProfileCompletionPanel,
  RecentActivity,
  FreelancerWelcomeHub,
  FreelancerGrowthQuestWidget,
  RecommendedProjects,
} from "@/components/freelancer/freelancer-dashboard";

const FreelancerDashboard = () => {
  const navigate = useNavigate();
  const { user, authFetch } = useAuth();
  const { refreshNotifications } = useNotifications();
  const [isWelcomeDismissed] = React.useState(false);
  const [requestActionId, setRequestActionId] = React.useState(null);
  const shouldShowOnboardingWelcome = requiresFreelancerOnboarding(user) && !isWelcomeDismissed;

  useEffect(() => {
    if (!shouldShowOnboardingWelcome || typeof window === "undefined") {
      return undefined;
    }

    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPaddingRight = body.style.paddingRight;
    const previousHtmlOverflow = documentElement.style.overflow;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

    body.style.overflow = "hidden";
    documentElement.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = previousBodyOverflow;
      body.style.paddingRight = previousBodyPaddingRight;
      documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [shouldShowOnboardingWelcome]);
  const handleMarketplaceRequestDecision = React.useCallback(
    async (request, decision) => {
      const requestId = String(request?.requestId || request?.id || "").trim();
      if (!requestId || !authFetch) {
        return;
      }

      const normalizedDecision = String(decision || "").trim().toLowerCase();
      if (!["accepted", "declined"].includes(normalizedDecision)) {
        return;
      }

      setRequestActionId(requestId);
      try {
        const response = await authFetch(
          `/notifications/marketplace-request/${encodeURIComponent(requestId)}/status`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: normalizedDecision }),
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to update request status (status ${response.status})`);
        }

        if (normalizedDecision === "accepted") {
          createMarketplaceChatRequest({
            ...request,
            id: requestId,
            requestId: requestId,
            status: "accepted",
            requestStatus: "accepted",
            requestSource: "marketplace",
            previewText: request.requestMessage || request.previewText || "",
            updatedAt: new Date().toISOString(),
          });

          const acceptedRequest = acceptMarketplaceChatRequest(requestId);
          if (acceptedRequest) {
            toast.success("Inquiry accepted. Opening chat...");
            await refreshNotifications?.();
            navigate(`/freelancer/messages?requestId=${encodeURIComponent(requestId)}`);
            return;
          }
        } else {
          const declinedRequest = declineMarketplaceChatRequest(requestId);
          if (declinedRequest) {
            toast.success("Request declined.");
          }
        }

        await refreshNotifications?.();
      } catch (error) {
        console.error("Failed to update marketplace request status:", error);
        toast.error("Unable to update this request right now.");
      } finally {
        setRequestActionId(null);
      }
    },
    [authFetch, navigate, refreshNotifications],
  );

  return (
    <FreelancerDashboardContent>
      {(model) => {
        const hasRunningProjects =
          !model.metricsLoading && model.runningProjectCards.length > 0;
        const shouldShowProfileProgressPanel =
          !shouldShowOnboardingWelcome &&
          model.shouldShowProfileCompletionPanel;

        return (
        <div className="min-h-screen bg-background text-foreground">
          <div className="mx-auto flex w-full max-w-[1536px] flex-col px-4 sm:px-6 lg:px-[40px] xl:w-[94%] xl:max-w-none">
            <FreelancerWorkspaceHeader
              profile={model.headerProfile}
              activeWorkspaceKey={model.activeWorkspaceKey}
              onWorkspaceNav={model.handleWorkspaceNav}
              onOpenProfile={model.onOpenProfile}

              notifications={model.notifications}
              unreadCount={model.unreadCount}
              markAllAsRead={model.markAllAsRead}
              onNotificationClick={model.handleNotificationClick}
              workspaceNavHidden={shouldShowOnboardingWelcome}
            />

            <SuspensionAlert
              open={model.showSuspensionAlert}
              onOpenChange={model.setShowSuspensionAlert}
              suspendedAt={model.sessionUser?.suspendedAt}
            />

            <main className="relative z-10 flex-1 pb-12 sm:pb-14">
              <div className="flex w-full flex-col gap-6 sm:gap-7">
                <HeroGreetingBlock
                  greeting={model.hero.greeting}
                  firstName={model.hero.firstName}
                  dateLabel={model.hero.dateLabel}
                />

                {/* Pending Client Inquiries */}
                {model.pendingRequests && model.pendingRequests.length > 0 && (
                  <section className="w-full mt-2 mb-2">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-[22px] sm:text-[1.75rem] font-semibold tracking-[-0.02em] text-[#1C1B1F] dark:text-white">
                          Pending Client Inquiries
                        </h2>
                        <span className="relative inline-flex size-[15px] shrink-0 items-center justify-center">
                          <span className="absolute inset-0 rounded-full bg-[#f59e0b]/10" />
                          <span className="absolute inset-0 rounded-full bg-[#f59e0b]/20 animate-ping" />
                          <span className="relative block size-[6px] rounded-full bg-[#f59e0b]" />
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {model.pendingRequests.map((req) => (
                        <div key={req.id} className="flex flex-col justify-between rounded-3xl border border-black/5 bg-[#FDF7F0] dark:bg-[#18130d] dark:border-white/5 p-5 shadow-sm hover:shadow-md transition-all">
                          <div>
                            <div className="flex items-center gap-3 mb-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={req.clientAvatar} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                  {String(req.clientName || "C").charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-bold text-sm text-foreground capitalize">{req.clientName}</h4>
                                <p className="text-[12px] text-muted-foreground font-medium line-clamp-1" title={req.serviceTitle}>
                                  {req.serviceTitle || "Service Inquiry"}
                                </p>
                              </div>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 mb-4 leading-relaxed italic bg-white/60 dark:bg-black/40 p-3 rounded-xl border border-black/5 dark:border-white/5">
                              "{req.requestMessage}"
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              type="button"
                              className="h-10 rounded-full bg-primary hover:bg-primary/90 text-xs font-semibold text-primary-foreground gap-1.5 shadow-sm"
                              disabled={requestActionId === req.id}
                              onClick={() => handleMarketplaceRequestDecision(req, "accepted")}
                            >
                              {requestActionId === req.id ? "Working..." : "Accept Inquiry & Chat"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="h-10 rounded-full border border-destructive/30 bg-transparent text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive dark:border-destructive/30 dark:text-destructive"
                              disabled={requestActionId === req.id}
                              onClick={() => handleMarketplaceRequestDecision(req, "declined")}
                            >
                              Decline
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {!model.metricsLoading && !hasRunningProjects && model.pendingProposalRows.length === 0 && (
                  <FreelancerWelcomeHub
                    profileCompletionPercent={model.profileCompletionPercent}
                    isDailyQuestCompleted={model.isDailyQuestCompleted}
                    payoutMethodConnected={model.payoutMethodConnected}
                    openToWork={model.headerProfile.openToWork}
                    onOpenProfile={model.onOpenProfile}
                  />
                )}

                {shouldShowProfileProgressPanel ? (
                  model.showProfileCompletionSkeleton ? (
                    <FreelancerProfileCompletionSkeleton />
                  ) : (
                    <ProfileCompletionPanel
                      completionPercent={model.profileCompletionPercent}
                      isComplete={model.profileCompletionComplete}
                      onOpenProfile={model.onOpenProfile}
                      missingDetails={model.profileCompletionMissingDetails}
                      completionMessage={model.profileCompletionMessage}
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
                ) : model.pendingProposalRows.length > 0 ? (
                  <PendingProposals
                    pendingProposalRows={model.pendingProposalRows}
                    onOpenAll={model.onOpenProposals}
                  />
                ) : null}

                <section className="grid items-stretch grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
                  <div className="flex h-full min-w-0 flex-col gap-5">
                    {model.metricsLoading ? (
                      <FreelancerPendingProposalsSkeleton gridCols={2} />
                    ) : hasRunningProjects ? (
                      <PendingProposals
                        pendingProposalRows={model.pendingProposalRows}
                        onOpenAll={model.onOpenProposals}
                        gridCols={2}
                      />
                    ) : model.pendingProposalRows.length > 0 ? (
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
                      <RecommendedProjects
                        liveProjects={model.liveProjects}
                        userServices={model.userServices}
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

                    {/* Fill empty space with recommended projects if they already have active/pending projects */}
                    {!model.metricsLoading && (hasRunningProjects || model.pendingProposalRows.length > 0) && (
                      <RecommendedProjects liveProjects={model.liveProjects} userServices={model.userServices} />
                    )}
                  </div>

                  <div className="flex h-full flex-col gap-5 self-stretch">
                    {model.metricsLoading ? (
                      <>
                        <div className="h-[200px] w-full rounded-[28px] bg-white/[0.04] animate-pulse" />
                        <FreelancerChatsSkeleton />
                        <FreelancerClientReviewsSkeleton />
                        <FreelancerCompactEarningsSummarySkeleton />
                      </>
                    ) : (
                      <>
                        <FreelancerGrowthQuestWidget
                          engagementDetails={model.engagementDetails}
                        />
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
                navigate(FREELANCER_ONBOARDING_PATH)
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







