import React, { memo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Plus from "lucide-react/dist/esm/icons/plus";
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
                : "w-2.5 bg-primary/20 hover:bg-primary/40",
            )}
          />
        );
      })}
    </div>
  );
});

const ProposalCardsCarousel = ({
  title,
  proposals,
  showCreateCard = false,
  onDelete,
  onIncreaseBudget,
  onOpen,
  onPay,
  onSend,
  onViewFreelancers,
  processingPaymentProposalId,
  sendingProposalId,
}) => {
  const navigate = useNavigate();
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

  const totalCards = proposals.length + (showCreateCard ? 1 : 0);
  const shouldUseProposalCarousel = isMobile || totalCards > 3;

  if (!shouldUseProposalCarousel) {
    return (
      <div className="w-full">
        {title && <h2 className="mb-4 text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h2>}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
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
        {showCreateCard && (
          <div 
            onClick={() => navigate("/service")}
            className="group flex h-full w-full overflow-hidden rounded-[28px] border-2 border-dashed border-primary/30 hover:border-primary/60 bg-card/40 hover:bg-primary/5 dark:border-primary/20 dark:hover:border-primary/40 dark:hover:bg-primary/10 transition-all duration-300 cursor-pointer flex-col items-center justify-center min-h-[28rem] p-6 text-center shadow-none"
          >
            <div className="rounded-full bg-primary/10 p-4 text-primary group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
              <Plus className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <div className="mt-5 space-y-2">
              <h3 className="text-base font-semibold text-foreground tracking-tight">Create New Proposal</h3>
            </div>
          </div>
        )}
        </div>
      </div>
    );
  }

  const shouldShowProposalCarouselControls = isMobile
    ? totalCards > 1
    : totalCards > 3;
  const proposalCarouselDesktopControlClassName =
    "size-11 rounded-full border border-border bg-background text-foreground shadow-none hover:bg-background hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed";
  const proposalCarouselMobileControlClassName =
    "size-8 rounded-full border border-border bg-background/95 text-foreground shadow-none hover:bg-background hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed";

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
        {(title || shouldShowProposalCarouselControls) ? (
          <div className="mb-3 flex items-center justify-between gap-4">
            {title ? (
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {title}
              </h2>
            ) : (
              <div />
            )}
            {shouldShowProposalCarouselControls && (
              <div className="hidden justify-end gap-2 md:flex">
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
            )}
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

        <CarouselContent className="ml-0 items-stretch gap-4 [backface-visibility:hidden] [will-change:transform]">
          {proposals.map((proposal) => (
            <CarouselItem
              key={proposal.id}
              className="pl-0 basis-full md:basis-[calc((100%-1rem)/2)] lg:basis-[calc((100%-2rem)/3)]"
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
          {showCreateCard && (
            <CarouselItem className="pl-0 basis-full md:basis-[calc((100%-1rem)/2)] lg:basis-[calc((100%-2rem)/3)]">
              <div 
                onClick={() => navigate("/service")}
                className="group flex h-full w-full overflow-hidden rounded-[28px] border-2 border-dashed border-primary/30 hover:border-primary/60 bg-card/40 hover:bg-primary/5 dark:border-primary/20 dark:hover:border-primary/40 dark:hover:bg-primary/10 transition-all duration-300 cursor-pointer flex-col items-center justify-center min-h-[28rem] p-6 text-center shadow-none"
              >
                <div className="rounded-full bg-primary/10 p-4 text-primary group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                  <Plus className="h-6 w-6" strokeWidth={2.5} />
                </div>
                <div className="mt-5 space-y-2">
                  <h3 className="text-base font-semibold text-foreground tracking-tight">Create New Proposal</h3>
                </div>
              </div>
            </CarouselItem>
          )}
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
