import React, { memo, useEffect, useState } from "react";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { cn } from "@/shared/lib/utils";
import ProposalRowCard from "./ProposalRowCard.jsx";

const ClientProposalCarouselDots = memo(function ClientProposalCarouselDots({
  count,
  activeIndex,
  onSelect,
}) {
  if (count <= 1) return null;

  return (
    <div
      className="mt-2.5 flex items-center justify-center gap-2"
      aria-label="Proposals carousel pagination"
    >
      {Array.from({ length: count }, (_, index) => {
        const isActive = index === activeIndex;

        return (
          <button
            key={`client-proposal-carousel-dot-${index}`}
            type="button"
            onClick={() => onSelect(index)}
            aria-label={`Go to proposal ${index + 1}`}
            aria-pressed={isActive}
            className={cn(
              "h-2.5 rounded-full transition-all duration-200",
              isActive
                ? "w-7 bg-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.32)]"
                : "w-2.5 bg-white/[0.14] hover:bg-white/[0.28]",
            )}
          />
        );
      })}
    </div>
  );
});

const ProposalCardsCarousel = ({
  proposals,
  onDelete,
  onIncreaseBudget,
  onOpen,
  onPay,
  onSend,
  onViewFreelancers,
  processingPaymentProposalId,
  sendingProposalId,
}) => {
  const isMobile = useIsMobile();
  const [proposalCarouselApi, setProposalCarouselApi] = useState(null);
  const [canGoToPreviousProposal, setCanGoToPreviousProposal] = useState(false);
  const [canGoToNextProposal, setCanGoToNextProposal] = useState(false);
  const [proposalCarouselSnapCount, setProposalCarouselSnapCount] = useState(0);
  const [activeProposalSnap, setActiveProposalSnap] = useState(0);

  useEffect(() => {
    if (!proposalCarouselApi) {
      setCanGoToPreviousProposal(false);
      setCanGoToNextProposal(false);
      setProposalCarouselSnapCount(0);
      setActiveProposalSnap(0);
      return undefined;
    }

    const syncProposalCarouselState = () => {
      setCanGoToPreviousProposal(proposalCarouselApi.canScrollPrev());
      setCanGoToNextProposal(proposalCarouselApi.canScrollNext());
      setProposalCarouselSnapCount(proposalCarouselApi.scrollSnapList().length);
      setActiveProposalSnap(proposalCarouselApi.selectedScrollSnap());
    };

    syncProposalCarouselState();
    proposalCarouselApi.on("select", syncProposalCarouselState);
    proposalCarouselApi.on("reInit", syncProposalCarouselState);

    return () => {
      proposalCarouselApi.off("select", syncProposalCarouselState);
      proposalCarouselApi.off("reInit", syncProposalCarouselState);
    };
  }, [proposalCarouselApi]);

  if (!proposals.length) return null;

  const shouldUseProposalCarousel = isMobile || proposals.length > 4;

  if (!shouldUseProposalCarousel) {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {proposals.map((proposal) => (
          <ProposalRowCard
            key={proposal.id}
            proposal={proposal}
            onDelete={onDelete}
            onIncreaseBudget={onIncreaseBudget}
            onOpen={onOpen}
            onPay={onPay}
            onSend={onSend}
            onViewFreelancers={onViewFreelancers}
            isPaying={processingPaymentProposalId === proposal.id}
            isSending={sendingProposalId === proposal.id}
          />
        ))}
      </div>
    );
  }

  const shouldShowProposalCarouselControls = isMobile
    ? proposals.length > 1
    : proposals.length > 4;
  const proposalCarouselDesktopControlClassName =
    "size-11 rounded-full border border-border bg-background text-foreground shadow-none hover:bg-background hover:text-foreground disabled:opacity-100 disabled:text-muted-foreground";
  const proposalCarouselMobileControlClassName =
    "size-8 rounded-full border border-border bg-background/95 text-foreground shadow-none hover:bg-background hover:text-foreground disabled:opacity-100 disabled:text-muted-foreground";

  return (
    <div className="w-full">
      <Carousel
        className="w-full"
        setApi={setProposalCarouselApi}
        opts={{
          align: "start",
          containScroll: "trimSnaps",
        }}
      >
        {shouldShowProposalCarouselControls ? (
          <div className="mb-5 hidden justify-end gap-2 md:flex">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={proposalCarouselDesktopControlClassName}
              onClick={() => proposalCarouselApi?.scrollPrev()}
              disabled={!canGoToPreviousProposal}
              aria-label="Show previous proposal"
            >
              <ChevronLeft className="size-5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={proposalCarouselDesktopControlClassName}
              onClick={() => proposalCarouselApi?.scrollNext()}
              disabled={!canGoToNextProposal}
              aria-label="Show next proposal"
            >
              <ChevronRight className="size-5" />
            </Button>
          </div>
        ) : null}

        {shouldShowProposalCarouselControls ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={`absolute left-0 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 md:hidden ${proposalCarouselMobileControlClassName}`}
              onClick={() => proposalCarouselApi?.scrollPrev()}
              disabled={!canGoToPreviousProposal}
              aria-label="Show previous proposal"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={`absolute right-0 top-1/2 z-10 translate-x-1/2 -translate-y-1/2 md:hidden ${proposalCarouselMobileControlClassName}`}
              onClick={() => proposalCarouselApi?.scrollNext()}
              disabled={!canGoToNextProposal}
              aria-label="Show next proposal"
            >
              <ChevronRight className="size-4" />
            </Button>
          </>
        ) : null}

        <CarouselContent className="ml-0 items-stretch gap-5 [backface-visibility:hidden] [will-change:transform]">
          {proposals.map((proposal) => (
            <CarouselItem
              key={proposal.id}
              className="pl-0 basis-full md:basis-[calc((100%-1.25rem)/2)] lg:basis-[calc((100%-2.5rem)/3)] xl:basis-[calc((100%-3.75rem)/4)]"
            >
              <ProposalRowCard
                proposal={proposal}
                onDelete={onDelete}
                onIncreaseBudget={onIncreaseBudget}
                onOpen={onOpen}
                onPay={onPay}
                onSend={onSend}
                onViewFreelancers={onViewFreelancers}
                isPaying={processingPaymentProposalId === proposal.id}
                isSending={sendingProposalId === proposal.id}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <ClientProposalCarouselDots
        count={proposalCarouselSnapCount}
        activeIndex={activeProposalSnap}
        onSelect={(index) => proposalCarouselApi?.scrollTo(index)}
      />
    </div>
  );
};

export default memo(ProposalCardsCarousel);
