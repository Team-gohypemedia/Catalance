import React, { useEffect, useState } from "react";
import ClipboardList from "lucide-react/dist/esm/icons/clipboard-list";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { cn } from "@/shared/lib/utils";
import {
  FreelancerCarouselDots,
  FreelancerDashboardPanel,
  FreelancerDashboardSkeletonBlock,
  FreelancerProjectCarouselControls,
} from "./shared.jsx";

const freelancerPendingProposalSurfaceToneClassName =
  "border border-white/[0.06] bg-card shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]";

const freelancerPendingProposalDetailBlockClassName = `flex min-w-0 flex-col rounded-[14px] ${freelancerPendingProposalSurfaceToneClassName} px-4 py-3 sm:px-5 sm:py-3.5 lg:min-h-[84px]`;

const freelancerPendingProposalActionButtonClassName =
  "inline-flex h-11 w-full items-center justify-center whitespace-nowrap rounded-[10px] px-4 text-sm font-semibold transition-colors";

export const FreelancerPendingProposalsSkeleton = () => (
  <section className="w-full min-w-0">
    <div className="mb-4 flex items-center gap-4 sm:mb-5">
      <FreelancerDashboardSkeletonBlock className="h-8 w-52 rounded-full" />
    </div>

    <FreelancerDashboardPanel className="overflow-hidden bg-card">
      <div className="divide-y divide-white/[0.06]">
        {[0, 1, 2].map((item) => (
          <div
            key={`freelancer-pending-proposal-skeleton-${item}`}
            className="px-4 py-5 sm:px-6 sm:py-6"
          >
            <div className="grid w-full min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_184px] lg:items-end">
              <div className="min-w-0">
                <FreelancerDashboardSkeletonBlock className="h-8 w-44 rounded-full" />

                <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
                  <div className={freelancerPendingProposalDetailBlockClassName}>
                    <FreelancerDashboardSkeletonBlock className="h-3 w-20 rounded-full" />
                    <FreelancerDashboardSkeletonBlock className="mt-3 h-6 w-24 rounded-full" />
                  </div>

                  <div className={freelancerPendingProposalDetailBlockClassName}>
                    <FreelancerDashboardSkeletonBlock className="h-3 w-16 rounded-full" />
                    <FreelancerDashboardSkeletonBlock className="mt-3 h-6 w-28 rounded-full" />
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-col gap-2.5 lg:h-[76px] lg:items-end lg:justify-end lg:gap-2">
                <FreelancerDashboardSkeletonBlock className="h-11 w-full rounded-[10px] lg:h-auto lg:min-h-0 lg:max-w-[184px] lg:flex-1" />
                <FreelancerDashboardSkeletonBlock className="h-11 w-full rounded-[10px] lg:h-auto lg:min-h-0 lg:max-w-[184px] lg:flex-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </FreelancerDashboardPanel>
  </section>
);

const FreelancerPendingProposalRow = ({ item }) => (
  <div className="grid w-full min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_184px] lg:items-end">
    <div className="min-w-0 w-full">
      <p className="min-w-0 truncate text-[clamp(1.5rem,5vw,2.15rem)] font-semibold tracking-[-0.04em] text-white">
        {item.title}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3 sm:gap-3">
        <div className={freelancerPendingProposalDetailBlockClassName}>
          <p className="text-[0.76rem] uppercase tracking-[0.16em] text-muted-foreground">
            Service
          </p>
          <p className="mt-2.5 break-words text-[1.1rem] font-semibold tracking-[-0.02em] text-white">
            {item.service}
          </p>
        </div>

        <div className={freelancerPendingProposalDetailBlockClassName}>
          <p className="text-[0.76rem] uppercase tracking-[0.16em] text-muted-foreground">
            Budget
          </p>
          <p className="mt-2.5 text-[1.1rem] font-semibold tracking-[-0.02em] text-white">
            {item.budget}
          </p>
        </div>

        <div className={freelancerPendingProposalDetailBlockClassName}>
          <p className="text-[0.76rem] uppercase tracking-[0.16em] text-muted-foreground">
            Received
          </p>
          <p className="mt-2.5 break-words text-[1.1rem] font-semibold tracking-[-0.02em] text-white">
            {item.updatedAt || "Just now"}
          </p>
        </div>
      </div>
    </div>

    <div className="flex w-full flex-col gap-2.5 lg:h-[76px] lg:items-end lg:justify-end lg:gap-2">
      <button
        type="button"
        onClick={item.onView}
        disabled={item.isAccepting}
        className={cn(
          freelancerPendingProposalActionButtonClassName,
          "bg-[#ffc107] text-black hover:bg-[#ffd54f] lg:h-auto lg:min-h-0 lg:max-w-[184px] lg:flex-1",
          item.isAccepting && "cursor-not-allowed opacity-60",
        )}
      >
        View Details
      </button>

      <button
        type="button"
        onClick={item.onAccept}
        disabled={item.isAccepting}
        className={cn(
          freelancerPendingProposalActionButtonClassName,
          "border border-emerald-600 bg-transparent text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 lg:h-auto lg:min-h-0 lg:max-w-[184px] lg:flex-1",
          item.isAccepting && "cursor-not-allowed opacity-60",
        )}
      >
        {item.isAccepting ? "Accepting..." : "Accept Proposal"}
      </button>
    </div>
  </div>
);

const FreelancerPendingProposalCard = ({ item }) => (
  <article className="flex h-auto w-full max-w-full min-w-0 flex-col overflow-x-clip overflow-y-hidden rounded-[28px] border border-white/[0.06] bg-card p-4 transition-transform duration-200 hover:-translate-y-1 sm:p-5 xl:p-6">
    <FreelancerPendingProposalRow item={item} />
  </article>
);

const FreelancerPendingProposalListPanel = ({ pendingProposalRows }) => (
  <FreelancerDashboardPanel className="overflow-hidden bg-card">
    <div className="divide-y divide-white/[0.06]">
      {pendingProposalRows.map((item) => (
        <div key={item.id} className="px-4 py-5 sm:px-6 sm:py-6">
          <FreelancerPendingProposalRow item={item} />
        </div>
      ))}
    </div>
  </FreelancerDashboardPanel>
);

const PendingProposals = ({ pendingProposalRows, onOpenAll, className = "" }) => {
  const isMobile = useIsMobile();
  const shouldUsePendingProposalCarousel = isMobile && pendingProposalRows.length > 1;
  const [pendingProposalCarouselApi, setPendingProposalCarouselApi] = useState(null);
  const [canGoToPreviousPendingProposal, setCanGoToPreviousPendingProposal] = useState(false);
  const [canGoToNextPendingProposal, setCanGoToNextPendingProposal] = useState(false);
  const [pendingProposalSnapCount, setPendingProposalSnapCount] = useState(0);
  const [activePendingProposalSnap, setActivePendingProposalSnap] = useState(0);

  useEffect(() => {
    if (!pendingProposalCarouselApi || !shouldUsePendingProposalCarousel) {
      setCanGoToPreviousPendingProposal(false);
      setCanGoToNextPendingProposal(false);
      setPendingProposalSnapCount(0);
      setActivePendingProposalSnap(0);
      return undefined;
    }

    const syncPendingProposalCarouselState = () => {
      setCanGoToPreviousPendingProposal(pendingProposalCarouselApi.canScrollPrev());
      setCanGoToNextPendingProposal(pendingProposalCarouselApi.canScrollNext());
      setPendingProposalSnapCount(pendingProposalCarouselApi.scrollSnapList().length);
      setActivePendingProposalSnap(pendingProposalCarouselApi.selectedScrollSnap());
    };

    syncPendingProposalCarouselState();
    pendingProposalCarouselApi.on("select", syncPendingProposalCarouselState);
    pendingProposalCarouselApi.on("reInit", syncPendingProposalCarouselState);

    return () => {
      pendingProposalCarouselApi.off("select", syncPendingProposalCarouselState);
      pendingProposalCarouselApi.off("reInit", syncPendingProposalCarouselState);
    };
  }, [pendingProposalCarouselApi, shouldUsePendingProposalCarousel]);

  return (
    <section className={cn("w-full min-w-0", className)}>
      <div className="mb-4 flex items-center justify-between gap-4 sm:mb-5">
        <div className="min-w-0">
          <h2 className="text-[1.75rem] font-semibold tracking-[-0.02em] text-white">
            Pending Proposals
          </h2>
        </div>

        {shouldUsePendingProposalCarousel ? (
          <FreelancerProjectCarouselControls
            onPrevious={() => pendingProposalCarouselApi?.scrollPrev()}
            onNext={() => pendingProposalCarouselApi?.scrollNext()}
            canGoPrevious={canGoToPreviousPendingProposal}
            canGoNext={canGoToNextPendingProposal}
            previousLabel="Show previous pending proposal"
            nextLabel="Show next pending proposal"
          />
        ) : null}
      </div>

      {pendingProposalRows.length === 0 ? (
        <FreelancerDashboardPanel className="overflow-hidden bg-card">
          <div className="flex min-h-[240px] flex-col items-center justify-center px-5 py-10 text-center sm:min-h-[320px] sm:px-6 sm:py-12">
            <div className="flex size-14 items-center justify-center rounded-full bg-white/[0.06] text-muted-foreground sm:size-16">
              <ClipboardList className="size-6 sm:size-7" />
            </div>
            <p className="mt-6 text-base font-medium text-white">No pending proposals</p>
            <p className="mt-2 max-w-[320px] text-sm text-muted-foreground">
              New proposal requests from clients will appear here.
            </p>
            <button
              type="button"
              onClick={onOpenAll}
              className="mt-6 inline-flex min-w-[200px] items-center justify-center rounded-full bg-[#ffc107] px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#ffd54f] sm:min-w-0"
            >
              View Proposals
            </button>
          </div>
        </FreelancerDashboardPanel>
      ) : shouldUsePendingProposalCarousel ? (
        <div className="w-full min-w-0">
          <Carousel
            setApi={setPendingProposalCarouselApi}
            opts={{
              align: "start",
              containScroll: "trimSnaps",
              slidesToScroll: 1,
              duration: 34,
            }}
            className="w-full"
          >
            <CarouselContent className="ml-0 items-start gap-5 [backface-visibility:hidden] [will-change:transform] sm:gap-6 xl:gap-7">
              {pendingProposalRows.map((item) => (
                <CarouselItem key={item.id} className="basis-full pl-[2px] pr-[2px] pt-1">
                  <FreelancerPendingProposalCard item={item} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          <FreelancerCarouselDots
            count={pendingProposalSnapCount}
            activeIndex={activePendingProposalSnap}
            onSelect={(index) => pendingProposalCarouselApi?.scrollTo(index)}
            ariaLabel="Pending proposals carousel pagination"
            getDotLabel={(index) => `Go to pending proposal ${index + 1}`}
          />
        </div>
      ) : isMobile ? (
        <FreelancerPendingProposalCard item={pendingProposalRows[0]} />
      ) : (
        <FreelancerPendingProposalListPanel pendingProposalRows={pendingProposalRows} />
      )}
    </section>
  );
};

export default PendingProposals;
