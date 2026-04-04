import React from "react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import {
  ProjectProposalCard,
  ProjectCardSkeleton,
} from "@/components/features/client/ClientProjects";
import {
  FreelancerCarouselDots,
  FreelancerDashboardPanel,
  FreelancerProjectCarouselControls,
} from "./shared.jsx";

export const FreelancerActiveProjectsSkeleton = () => (
  <section>
    <div className="mb-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="h-8 w-44 rounded-full bg-white/[0.08]" />
        <div className="size-3 rounded-full bg-white/[0.08]" />
      </div>
      <div className="flex items-center gap-2">
        <div className="size-8 rounded-full bg-white/[0.08]" />
        <div className="size-8 rounded-full bg-white/[0.08]" />
      </div>
    </div>

    <div className="grid items-start gap-5 sm:gap-6 xl:gap-7 md:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <ProjectCardSkeleton key={`freelancer-active-project-skeleton-${item}`} />
      ))}
    </div>
  </section>
);

const FreelancerProjectRedirectCard = ({ item, className }) => (
  <div
    className={`flex min-h-[320px] flex-col justify-between overflow-hidden rounded-[28px] border border-white/[0.06] bg-card p-4 sm:p-5 xl:p-6 ${className}`.trim()}
  >
    <div className="flex flex-1 flex-col items-center text-center">
      <h3 className="text-[clamp(1.5rem,5vw,2.15rem)] font-semibold tracking-[-0.04em] text-white">
        {item.title}
      </h3>

      <div className="flex w-full flex-1 items-center justify-center">
        <button
          type="button"
          aria-label={item.title}
          onClick={item.onClick}
          className="inline-flex h-[104px] w-[104px] items-center justify-center rounded-[14px] border border-primary/30 bg-primary/20 text-primary transition-colors hover:bg-primary/28"
        >
          <item.Icon className="size-10" strokeWidth={2} />
        </button>
      </div>
    </div>

    <button
      type="button"
      onClick={item.onClick}
      className="inline-flex h-[58px] w-full shrink-0 items-center justify-center rounded-[14px] bg-[#f5cd05] px-6 text-[1.02rem] font-bold uppercase tracking-[0.04em] text-black transition-colors hover:bg-[#ffdd4f]"
    >
      {String(item.actionLabel || "Action").toUpperCase()}
    </button>
  </div>
);

const ActiveProjects = ({
  runningProjectCards,
  redirectCards,
  shouldUseProjectCarousel,
  setProjectCarouselApi,
  projectCarouselApi,
  canGoPrevious,
  canGoNext,
  projectCarouselSnapCount,
  activeProjectSnap,
  projectCardRefs,
  isMobile,
  mobileProjectCardHeight,
  activeProjectCardClassName,
  activeProjectRedirectCardClassName,
}) => (
  <section>
    <div className="mb-6 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-[1.75rem] font-semibold tracking-[-0.02em] text-white">
            Active Projects
          </h2>
          <span className="relative inline-flex size-[15px] shrink-0 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-[#10b981]/10" />
            <span className="absolute inset-0 rounded-full bg-[#10b981]/20 animate-ping" />
            <span className="relative block size-[6px] rounded-full bg-[#10b981]" />
          </span>
        </div>
      </div>

      {shouldUseProjectCarousel ? (
        <FreelancerProjectCarouselControls
          onPrevious={() => projectCarouselApi?.scrollPrev()}
          onNext={() => projectCarouselApi?.scrollNext()}
          canGoPrevious={canGoPrevious}
          canGoNext={canGoNext}
          previousLabel="Show previous active freelancer projects"
          nextLabel="Show next active freelancer projects"
        />
      ) : null}
    </div>

    {runningProjectCards.length === 0 ? (
      <FreelancerDashboardPanel className="flex min-h-[220px] items-center justify-center rounded-[28px] border border-white/[0.06] bg-card p-8 text-center">
        <div className="max-w-md">
          <p className="text-[1.35rem] font-semibold tracking-[-0.03em] text-white">
            No active projects yet
          </p>
          <p className="mt-3 text-sm leading-6 text-[#94a3b8]">
            Projects will appear here once a client approves your proposal and work has
            started.
          </p>
        </div>
      </FreelancerDashboardPanel>
    ) : shouldUseProjectCarousel ? (
      <div className="w-full">
        <Carousel
          setApi={setProjectCarouselApi}
          opts={{
            align: "start",
            containScroll: "trimSnaps",
            slidesToScroll: 1,
            duration: 34,
          }}
          className="w-full"
        >
          <CarouselContent className="ml-0 items-start gap-5 [backface-visibility:hidden] [will-change:transform] sm:gap-6 xl:gap-7">
            {runningProjectCards.map((projectCard) => (
              <CarouselItem
                key={projectCard.id}
                className="basis-full pl-[2px] pr-[2px] pt-1 md:basis-[calc((100%-1.5rem)/2)] xl:basis-[calc((100%-3.5rem)/3)]"
              >
                <div
                  ref={(node) => {
                    projectCardRefs.current[projectCard.id] = node;
                  }}
                >
                  <ProjectProposalCard
                    project={projectCard}
                    replaceSectionBadgeWithStatus
                    className={activeProjectCardClassName}
                  />
                </div>
              </CarouselItem>
            ))}
            {redirectCards.map((item) => (
              <CarouselItem
                key={item.id}
                className="basis-full pl-[2px] pr-[2px] pt-1 md:basis-[calc((100%-1.5rem)/2)] xl:basis-[calc((100%-3.5rem)/3)]"
              >
                <div
                  style={
                    isMobile && mobileProjectCardHeight > 0
                      ? { height: `${mobileProjectCardHeight}px` }
                      : undefined
                  }
                >
                  <FreelancerProjectRedirectCard
                    item={item}
                    className={activeProjectRedirectCardClassName}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        <FreelancerCarouselDots
          count={projectCarouselSnapCount}
          activeIndex={activeProjectSnap}
          onSelect={(index) => projectCarouselApi?.scrollTo(index)}
          ariaLabel="Active projects carousel pagination"
          getDotLabel={(index) => `Go to active project ${index + 1}`}
        />
      </div>
    ) : (
      <div className="grid items-start gap-5 sm:gap-6 xl:gap-7 md:grid-cols-2 xl:grid-cols-3">
        {runningProjectCards.map((projectCard) => (
          <ProjectProposalCard
            key={projectCard.id}
            project={projectCard}
            replaceSectionBadgeWithStatus
            className={activeProjectCardClassName}
          />
        ))}
        {redirectCards.map((item) => (
          <FreelancerProjectRedirectCard
            key={item.id}
            item={item}
            className={activeProjectRedirectCardClassName}
          />
        ))}
      </div>
    )}
  </section>
);

export default ActiveProjects;
