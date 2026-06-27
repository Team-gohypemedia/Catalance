import React, { useState, useMemo } from "react";
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
import Filter from "lucide-react/dist/esm/icons/filter";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

    <div className="grid items-start gap-5 sm:gap-6 xl:gap-7 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <ProjectCardSkeleton key={`freelancer-active-project-skeleton-${item}`} />
      ))}
    </div>
  </section>
);

import Check from "lucide-react/dist/esm/icons/check";

const FreelancerProjectRedirectCard = ({ item, className }) => {
  return (
    <div
      className={`flex min-h-[506px] flex-col justify-between overflow-hidden rounded-[28px] border border-border bg-card p-5 sm:p-6 xl:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] transition-all hover:border-primary/20 ${className}`.trim()}
    >
      <div className="flex flex-1 flex-col items-center text-center">
        {/* Illustrative Graphical Header */}
        <div className="relative mb-5 flex h-[110px] w-full items-center justify-center">
          {/* Background Glow */}
          <div className="absolute size-20 rounded-full bg-primary/5 blur-md" />
          
          {/* Main Icon Container */}
          <div className="relative flex size-16 items-center justify-center rounded-[20px] bg-primary/10 border border-primary/25 text-primary shadow-sm">
            <item.Icon className="size-8" strokeWidth={2} />
          </div>

          {/* Floating Illustrative Elements */}
          {item.id === "proposal-pipeline" ? (
            <div className="absolute right-[calc(50%-44px)] top-5 flex size-5 items-center justify-center rounded-full border border-primary/25 bg-white p-0.5 text-primary shadow-sm dark:bg-zinc-950">
              <Check className="size-3 stroke-[3]" />
            </div>
          ) : (
            <div className="absolute right-[calc(50%-44px)] top-5 flex size-5 items-center justify-center rounded-full border border-primary/25 bg-white p-0.5 text-primary shadow-sm dark:bg-zinc-950">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            </div>
          )}
        </div>

        {/* Text Details */}
        <h3 className="text-[20px] font-bold tracking-[-0.03em] text-[#1C1B1F] dark:text-white sm:text-[1.35rem]">
          {item.title}
        </h3>
        
        <p className="mt-2.5 max-w-[260px] text-[0.82rem] leading-relaxed text-muted-foreground sm:text-xs">
          {item.description}
        </p>

        {/* Feature list box */}
        <div className="mt-6 w-full rounded-[18px] border border-primary/10 bg-primary/[0.03] dark:bg-white/[0.01] p-4 space-y-3.5">
          {item.highlights?.map((highlight, index) => (
            <div
              key={index}
              className="flex items-center gap-3 text-left text-[0.82rem] font-semibold text-foreground/80 sm:text-xs"
            >
              <div className="flex size-4 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
                <Check className="size-2.5 stroke-[3]" />
              </div>
              <span className="truncate">{highlight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Button */}
      <button
        type="button"
        onClick={item.onClick}
        className="flex w-full items-center justify-center rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 mt-6"
      >
        {item.actionLabel}
      </button>
    </div>
  );
};

const ActiveProjects = ({
  runningProjectCards = [],
  redirectCards = [],
  shouldUseProjectCarousel: originalShouldUseProjectCarousel,
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
}) => {
  const [selectedCategory, setSelectedCategory] = useState("All projects");

  // Get categories and their item counts
  const categoriesWithCounts = useMemo(() => {
    const counts = {};
    runningProjectCards.forEach((project) => {
      if (project.serviceType) {
        counts[project.serviceType] = (counts[project.serviceType] || 0) + 1;
      }
    });
    return counts;
  }, [runningProjectCards]);

  const categoryOptions = useMemo(() => {
    return Object.keys(categoriesWithCounts);
  }, [categoriesWithCounts]);

  // Filter project cards based on selected category
  const filteredProjectCards = useMemo(() => {
    if (selectedCategory === "All projects") {
      return runningProjectCards;
    }
    return runningProjectCards.filter(
      (project) => project.serviceType === selectedCategory
    );
  }, [runningProjectCards, selectedCategory]);

  // Only show redirect cards when viewing "All projects"
  const visibleRedirectCards = useMemo(() => {
    if (selectedCategory === "All projects") {
      return redirectCards;
    }
    return [];
  }, [redirectCards, selectedCategory]);

  const totalVisibleCards = filteredProjectCards.length + visibleRedirectCards.length;
  const shouldUseProjectCarousel = isMobile
    ? totalVisibleCards > 1
    : totalVisibleCards > 3;

  return (
    <section>
      <div className="mb-6 flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center justify-between w-full sm:w-auto min-w-0">
          <div className="flex items-center gap-3">
            <h2 className="text-[22px] sm:text-[1.75rem] font-semibold tracking-[-0.02em] dark:text-white text-[#1C1B1F]">
              Active Projects
            </h2>
            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary/10 px-2 text-[11px] font-bold text-primary">
              {filteredProjectCards.length}
            </span>
            <span className="relative inline-flex size-[15px] shrink-0 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-[#10b981]/10" />
              <span className="absolute inset-0 rounded-full bg-[#10b981]/20 animate-ping" />
              <span className="relative block size-[6px] rounded-full bg-[#10b981]" />
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 w-full sm:w-auto">
          {/* Service Category Dropdown Filter */}
          {runningProjectCards.length > 0 && (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-colors cursor-pointer sm:text-sm"
                >
                  <Filter className="size-3.5" />
                  <span>
                    {selectedCategory === "All projects"
                      ? "All projects"
                      : selectedCategory}
                  </span>
                  <ChevronDown className="size-3.5 opacity-80" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={6}
                className="w-[280px] min-w-[var(--radix-dropdown-menu-trigger-width)] rounded-2xl bg-card p-1.5 border border-border shadow-md"
              >
                <DropdownMenuItem
                  onClick={() => setSelectedCategory("All projects")}
                  className={`flex justify-between items-center px-3 py-2.5 text-xs sm:text-sm rounded-xl cursor-pointer hover:bg-muted focus:bg-muted focus:text-foreground ${
                    selectedCategory === "All projects" ? "bg-muted font-semibold" : ""
                  }`}
                >
                  <span>All projects</span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground bg-primary/5 px-2 py-0.5 rounded-full">
                    {runningProjectCards.length}
                  </span>
                </DropdownMenuItem>
                {categoryOptions.map((category) => (
                  <DropdownMenuItem
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`flex justify-between items-center px-3 py-2.5 text-xs sm:text-sm rounded-xl cursor-pointer hover:bg-muted focus:bg-muted focus:text-foreground ${
                      selectedCategory === category ? "bg-muted font-semibold" : ""
                    }`}
                  >
                    <span className="pr-2">{category}</span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground bg-primary/5 px-2 py-0.5 rounded-full shrink-0">
                      {categoriesWithCounts[category]}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

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
      </div>

      {filteredProjectCards.length === 0 && visibleRedirectCards.length === 0 ? (
        <FreelancerDashboardPanel className="flex h-[220px] items-center justify-center rounded-[28px] border border-white/[0.06] bg-card p-8 text-center sm:h-[260px]">
          <div className="max-w-md">
            <p className="text-[1.35rem] font-semibold tracking-[-0.03em] dark:text-white text-[#1C1B1F]">
              No projects in this category
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Try selecting another category or "All projects" to view your active pipeline.
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
              {filteredProjectCards.map((projectCard) => (
                <CarouselItem
                  key={projectCard.id}
                  className="basis-full pl-[2px] pr-[2px] pt-1 md:basis-[calc((100%-1.5rem)/2)] lg:basis-[calc((100%-3rem)/3)] xl:basis-[calc((100%-3.5rem)/3)]"
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
              {visibleRedirectCards.map((item) => (
                <CarouselItem
                  key={item.id}
                  className="basis-full pl-[2px] pr-[2px] pt-1 md:basis-[calc((100%-1.5rem)/2)] lg:basis-[calc((100%-3rem)/3)] xl:basis-[calc((100%-3.5rem)/3)]"
                >
                  <div
                    className="h-full"
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
        <div className="grid items-start gap-5 sm:gap-6 xl:gap-7 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {filteredProjectCards.map((projectCard) => (
            <ProjectProposalCard
              key={projectCard.id}
              project={projectCard}
              replaceSectionBadgeWithStatus
              className={activeProjectCardClassName}
            />
          ))}
          {visibleRedirectCards.map((item) => (
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
};

export default ActiveProjects;
