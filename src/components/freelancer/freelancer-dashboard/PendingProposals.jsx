import React, { useEffect, useState } from "react";
import ClipboardList from "lucide-react/dist/esm/icons/clipboard-list";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import Clock from "lucide-react/dist/esm/icons/clock";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  FreelancerCarouselDots,
  FreelancerDashboardPanel,
  FreelancerDashboardSkeletonBlock,
  FreelancerProjectCarouselControls,
} from "./shared.jsx";

export const FreelancerPendingProposalsSkeleton = ({ gridCols = 3 }) => (
  <section className="w-full min-w-0">
    <div className="mb-4 flex items-center gap-4 sm:mb-5">
      <FreelancerDashboardSkeletonBlock className="h-8 w-52 rounded-full" />
    </div>

    <div className={cn(
      "grid grid-cols-1 md:grid-cols-2 gap-5",
      gridCols === 3 ? "lg:grid-cols-3" : ""
    )}>
      {Array.from({ length: gridCols }).map((_, idx) => (
        <div key={idx} className="flex h-auto w-full flex-col rounded-[28px] border border-border/50 bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <FreelancerDashboardSkeletonBlock className="h-6 w-20 rounded-full" />
            <FreelancerDashboardSkeletonBlock className="h-8 w-8 rounded-full" />
          </div>
          <div className="mt-5 space-y-2">
            <FreelancerDashboardSkeletonBlock className="h-4 w-24 rounded-full" />
            <FreelancerDashboardSkeletonBlock className="h-7 w-48 rounded-full" />
          </div>
          <div className="flex items-center justify-between mt-5">
            <div className="flex items-center gap-3">
              <FreelancerDashboardSkeletonBlock className="h-10 w-10 rounded-full" />
              <div className="space-y-1.5">
                <FreelancerDashboardSkeletonBlock className="h-4 w-28 rounded-full" />
                <FreelancerDashboardSkeletonBlock className="h-3.5 w-16 rounded-full" />
              </div>
            </div>
            <div className="space-y-1.5 text-right">
              <FreelancerDashboardSkeletonBlock className="h-3 w-16 rounded-full ml-auto" />
              <FreelancerDashboardSkeletonBlock className="h-4 w-32 rounded-full" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-5 py-4 border-t border-b border-border/50">
            <div className="space-y-1.5">
              <FreelancerDashboardSkeletonBlock className="h-3 w-20 rounded-full" />
              <FreelancerDashboardSkeletonBlock className="h-6 w-24 rounded-full" />
            </div>
            <div className="space-y-1.5 pl-4">
              <FreelancerDashboardSkeletonBlock className="h-3 w-16 rounded-full" />
              <FreelancerDashboardSkeletonBlock className="h-5 w-20 rounded-full" />
            </div>
          </div>
          <div className="mt-5 space-y-2.5">
            <FreelancerDashboardSkeletonBlock className="h-11 w-full rounded-full" />
            <div className="flex gap-2.5">
              <FreelancerDashboardSkeletonBlock className="h-10 flex-1 rounded-full" />
              <FreelancerDashboardSkeletonBlock className="h-10 flex-1 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
);

const FreelancerPendingProposalCard = ({ item }) => (
  <article className="flex h-auto w-full max-w-full min-w-0 flex-col rounded-[28px] border border-border/55 dark:border-white/[0.06] bg-card p-6 shadow-sm transition-transform duration-200 hover:-translate-y-1">
    {/* Header row: Status badge, Date, and Delete icon */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FAF1EB] text-[#D9692A] border-transparent dark:bg-[#F9D949]/5 dark:text-[#F9D949] dark:border dark:border-[#F9D949]/30">
          Pending
        </span>
        <span className="text-sm font-medium text-muted-foreground">
          {item.formattedDate}
        </span>
      </div>
      <button
        type="button"
        onClick={item.onReject}
        disabled={item.isAccepting}
        className="text-muted-foreground hover:text-rose-500 transition-colors p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50"
        title="Reject Proposal"
      >
        <Trash2 className="size-5 text-[#D9692A] dark:text-[#F9D949]" />
      </button>
    </div>

    {/* Project Title Section */}
    <div className="mt-3">
      <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground/80 block">
        Project Name
      </span>
      <h3 className="mt-1 text-[18px] font-semibold tracking-[-0.03em] text-foreground truncate">
        {item.title}
      </h3>
    </div>

    {/* Client & Service Row */}
    <div className="mt-4 flex items-center justify-between gap-3">
      {/* Left side: Client Info */}
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <Avatar className="size-9 shrink-0 border border-border">
          <AvatarImage src={item.clientAvatar} alt={item.clientName} />
          <AvatarFallback className="bg-[#FAF1EB] text-[#D9692A] dark:bg-white/[0.06] dark:text-[#F9D949] text-xs font-bold">
            {item.clientInitial}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground leading-tight">
            {item.clientName}
          </p>
          <p className="truncate text-xs text-muted-foreground leading-tight mt-0.5">
            Client
          </p>
        </div>
      </div>

      {/* Right side: Service Info */}
      <div className="flex flex-col items-end min-w-0 max-w-[45%]">
        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground/80 leading-none mb-1.5">
          Service
        </span>
        <span 
          className="text-right text-xs font-semibold text-[#D9692A] dark:text-[#F9D949] truncate w-full"
          title={item.service || "General"}
        >
          {item.service || "General"}
        </span>
      </div>
    </div>

    {/* Details Grid: Agreed Amount and Delivery */}
    <div className="grid grid-cols-2 gap-4 mt-5 py-4 border-t border-b border-border/55 dark:border-white/[0.06]">
      <div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground block">
          Agreed Amount
        </span>
        <div className="h-7 flex items-center mt-1.5">
          <span className="text-[18px] font-extrabold tracking-tight text-[#D9692A] dark:text-[#F9D949] leading-none">
            {item.budget}
          </span>
        </div>
      </div>
      <div className="border-l border-border/55 dark:border-white/[0.06] pl-4">
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground block">
          Delivery
        </span>
        <div className="h-7 flex items-center gap-1.5 mt-1.5">
          <Clock className="size-4 text-[#D9692A] dark:text-[#F9D949] shrink-0" />
          <span className="text-sm sm:text-base font-bold text-foreground leading-none truncate">
            {item.delivery}
          </span>
        </div>
      </div>
    </div>

    {/* Actions Section */}
    <div className="mt-5 space-y-2.5">
      <button
        type="button"
        onClick={item.onView}
        disabled={item.isAccepting}
        className="w-full h-11 rounded-full font-bold text-xs bg-[#D9692A] text-white hover:bg-[#C25820] dark:bg-[#F9D949] dark:text-[#1C1B1F] dark:hover:bg-[#E2C23B] transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        View Details
      </button>
      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={item.onAccept}
          disabled={item.isAccepting}
          className="flex-1 h-10 rounded-full font-semibold text-xs transition-colors flex items-center justify-center border border-[#A3E2C9] bg-[#E8F8F2] text-[#0F8A5F] hover:bg-[#D4F2E5] dark:border-[#20684C] dark:bg-[#102A20] dark:text-[#52D49C] dark:hover:bg-[#163B2D] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {item.isAccepting ? "Accepting..." : "Accept"}
        </button>
        <button
          type="button"
          onClick={item.onReject}
          disabled={item.isAccepting}
          className="flex-1 h-10 rounded-full font-semibold text-xs transition-colors flex items-center justify-center border border-[#F5C7BC] bg-[#FCECE8] text-[#D9381E] hover:bg-[#F9DCD5] dark:border-[#682424] dark:bg-[#2C1616] dark:text-[#E26666] dark:hover:bg-[#3D1F1F] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reject
        </button>
      </div>
    </div>
  </article>
);

const FreelancerPendingProposalListPanel = ({ pendingProposalRows, gridCols = 3 }) => (
  <div className={cn(
    "grid grid-cols-1 md:grid-cols-2 gap-5",
    gridCols === 3 ? "lg:grid-cols-3" : ""
  )}>
    {pendingProposalRows.map((item) => (
      <FreelancerPendingProposalCard key={item.id} item={item} />
    ))}
  </div>
);

const PendingProposals = ({ pendingProposalRows, onOpenAll, className = "", gridCols = 3 }) => {
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
          <h2 className="text-[22px] sm:text-[1.75rem] font-semibold tracking-[-0.02em] dark:text-white text-[#1C1B1F]">
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
            <p className="mt-6 text-base font-medium dark:text-white text-[#1C1B1F]">No pending proposals</p>
            <p className="mt-2 max-w-[320px] text-sm text-muted-foreground">
              New proposal requests from clients will appear here.
            </p>
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
        <FreelancerPendingProposalListPanel pendingProposalRows={pendingProposalRows} gridCols={gridCols} />
      )}
    </section>
  );
};

export default PendingProposals;
