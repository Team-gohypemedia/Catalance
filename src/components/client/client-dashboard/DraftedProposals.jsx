import React, { memo, useEffect, useMemo, useState } from "react";
import ClipboardList from "lucide-react/dist/esm/icons/clipboard-list";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import {
  DashboardPanel,
  ProjectCarouselControls,
  ProjectCarouselDots,
} from "./shared.jsx";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { cn } from "@/shared/lib/utils";

const draftProposalSurfaceToneClassName =
  "border border-white/[0.06] bg-card shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]";

const draftProposalDetailBlockClassName =
  `flex min-w-0 flex-col rounded-[14px] ${draftProposalSurfaceToneClassName} p-4 lg:h-[76px]`;

const draftProposalActionButtonClassName =
  "inline-flex h-11 w-full items-center justify-center whitespace-nowrap rounded-[10px] px-4 text-sm font-semibold transition-colors";

const DraftProposalRow = memo(function DraftProposalRow({ item }) {
  return (
    <div className="grid w-full min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end">
      <div className="min-w-0 w-full">
        <p className="min-w-0 truncate text-[1.4rem] font-semibold tracking-[-0.04em] text-white sm:text-[1.55rem]">
          {item.title}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
          <div className={draftProposalDetailBlockClassName}>
            <p className="text-[0.76rem] uppercase tracking-[0.16em] text-muted-foreground">
              Service
            </p>
            <p className="mt-3 break-words text-[1.1rem] font-semibold tracking-[-0.02em] text-white">
              {item.tag}
            </p>
          </div>

          <div className={draftProposalDetailBlockClassName}>
            <p className="text-[0.76rem] uppercase tracking-[0.16em] text-muted-foreground">
              Budget
            </p>
            <p className="mt-3 text-[1.1rem] font-semibold tracking-[-0.02em] text-white">
              {item.budget}
            </p>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col gap-2.5 lg:h-[76px] lg:items-stretch lg:gap-2">
        <button
          type="button"
          onClick={item.onSend}
          className={cn(
            draftProposalActionButtonClassName,
            "bg-[#ffc107] text-black hover:bg-[#ffd54f] lg:h-auto lg:flex-1",
          )}
        >
          Send Proposal
        </button>

        <div className="grid grid-cols-[minmax(0,1fr)_44px] gap-2.5 lg:h-auto lg:flex-1 lg:gap-2">
          <button
            type="button"
            onClick={item.onView}
            className={cn(
              draftProposalActionButtonClassName,
              `${draftProposalSurfaceToneClassName} text-white hover:bg-white/[0.05] lg:h-full`,
            )}
          >
            View Details
          </button>

          <button
            type="button"
            onClick={item.onDelete}
            className={cn(
              draftProposalActionButtonClassName,
              `${draftProposalSurfaceToneClassName} px-0 text-muted-foreground hover:bg-white/[0.05] hover:text-white lg:h-full`,
            )}
            aria-label={`Delete ${item.title}`}
          >
            <Trash2 className="size-4 text-current" />
          </button>
        </div>
      </div>
    </div>
  );
});

const DraftProposalCard = memo(function DraftProposalCard({ item }) {
  return (
    <article className="flex h-auto w-full max-w-full min-w-0 flex-col overflow-x-clip overflow-y-hidden rounded-[28px] border border-white/[0.06] bg-card p-4 transition-transform duration-200 hover:-translate-y-1 sm:p-5 xl:p-6">
      <DraftProposalRow item={item} />
    </article>
  );
});

const DraftProposalListPanel = memo(function DraftProposalListPanel({
  draftProposalRows,
}) {
  return (
    <DashboardPanel className="overflow-hidden bg-card">
      <div className="divide-y divide-white/[0.06]">
        {draftProposalRows.map((item) => (
          <div key={item.id} className="px-4 py-5 sm:px-6 sm:py-6">
            <DraftProposalRow item={item} />
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
});

const DraftedProposals = memo(function DraftedProposals({
  draftProposalRows,
  onOpenQuickProject,
  className = "",
}) {
  const isMobile = useIsMobile();
  const items = useMemo(
    () => (Array.isArray(draftProposalRows) ? draftProposalRows : []),
    [draftProposalRows],
  );
  const shouldUseDraftProposalCarousel = isMobile && items.length > 1;
  const [draftProposalCarouselApi, setDraftProposalCarouselApi] = useState(null);
  const [canGoToPreviousDraftProposal, setCanGoToPreviousDraftProposal] = useState(false);
  const [canGoToNextDraftProposal, setCanGoToNextDraftProposal] = useState(false);
  const [draftProposalSnapCount, setDraftProposalSnapCount] = useState(0);
  const [activeDraftProposalSnap, setActiveDraftProposalSnap] = useState(0);

  useEffect(() => {
    if (!draftProposalCarouselApi || !shouldUseDraftProposalCarousel) {
      setCanGoToPreviousDraftProposal(false);
      setCanGoToNextDraftProposal(false);
      setDraftProposalSnapCount(0);
      setActiveDraftProposalSnap(0);
      return undefined;
    }

    const syncDraftProposalCarouselState = () => {
      setCanGoToPreviousDraftProposal(draftProposalCarouselApi.canScrollPrev());
      setCanGoToNextDraftProposal(draftProposalCarouselApi.canScrollNext());
      setDraftProposalSnapCount(draftProposalCarouselApi.scrollSnapList().length);
      setActiveDraftProposalSnap(draftProposalCarouselApi.selectedScrollSnap());
    };

    syncDraftProposalCarouselState();
    draftProposalCarouselApi.on("select", syncDraftProposalCarouselState);
    draftProposalCarouselApi.on("reInit", syncDraftProposalCarouselState);

    return () => {
      draftProposalCarouselApi.off("select", syncDraftProposalCarouselState);
      draftProposalCarouselApi.off("reInit", syncDraftProposalCarouselState);
    };
  }, [draftProposalCarouselApi, shouldUseDraftProposalCarousel]);

  return (
    <section className={cn("w-full min-w-0", className)}>
      <div className="mb-4 flex items-center justify-between gap-4 sm:mb-5">
        <div className="min-w-0">
          <h2 className="text-[1.75rem] font-semibold tracking-[-0.02em] text-white">
            Drafted Proposals
          </h2>
        </div>

        {shouldUseDraftProposalCarousel ? (
          <ProjectCarouselControls
            onPrevious={() => draftProposalCarouselApi?.scrollPrev()}
            onNext={() => draftProposalCarouselApi?.scrollNext()}
            canGoPrevious={canGoToPreviousDraftProposal}
            canGoNext={canGoToNextDraftProposal}
            previousLabel="Show previous draft proposal"
            nextLabel="Show next draft proposal"
          />
        ) : null}
      </div>

      {items.length === 0 ? (
        <DashboardPanel className="overflow-hidden bg-card">
          <div className="flex min-h-[240px] flex-col items-center justify-center px-5 py-10 text-center sm:min-h-[320px] sm:px-6 sm:py-12">
            <div className="flex size-14 items-center justify-center rounded-full bg-white/[0.06] text-[#94a3b8] sm:size-16">
              <ClipboardList className="size-6 sm:size-7" />
            </div>
            <p className="mt-6 text-base font-medium text-white">
              No draft proposals yet
            </p>
            <p className="mt-2 max-w-[320px] text-sm text-muted-foreground">
              Start a new proposal to build your project brief and invite
              freelancers.
            </p>
            <button
              type="button"
              onClick={onOpenQuickProject}
              className="mt-6 inline-flex min-w-[200px] items-center justify-center rounded-full bg-[#ffc107] px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#ffd54f] sm:min-w-0"
            >
              Create New Proposal
            </button>
          </div>
        </DashboardPanel>
      ) : shouldUseDraftProposalCarousel ? (
        <div className="w-full min-w-0">
          <Carousel
            setApi={setDraftProposalCarouselApi}
            opts={{
              align: "start",
              containScroll: "trimSnaps",
              slidesToScroll: 1,
              duration: 34,
            }}
            className="w-full"
          >
            <CarouselContent className="ml-0 items-start gap-5 [backface-visibility:hidden] [will-change:transform] sm:gap-6 xl:gap-7">
              {items.map((item) => (
                <CarouselItem
                  key={item.id}
                  className="basis-full pl-[2px] pr-[2px] pt-1"
                >
                  <DraftProposalCard item={item} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          <ProjectCarouselDots
            count={draftProposalSnapCount}
            activeIndex={activeDraftProposalSnap}
            onSelect={(index) => draftProposalCarouselApi?.scrollTo(index)}
            ariaLabel="Draft proposals carousel pagination"
            getDotLabel={(index) => `Go to draft proposal ${index + 1}`}
          />
        </div>
      ) : isMobile ? (
        <DraftProposalCard item={items[0]} />
      ) : (
        <DraftProposalListPanel draftProposalRows={items} />
      )}
    </section>
  );
});

export default DraftedProposals;
