import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import Plus from "lucide-react/dist/esm/icons/plus";
import Users from "lucide-react/dist/esm/icons/users";
import Filter from "lucide-react/dist/esm/icons/filter";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import {
  ProjectCarouselControls,
  ProjectCarouselDots,
} from "./shared.jsx";
import {
  ProjectCardSkeleton,
  ProjectProposalCard,
} from "@/components/features/client/ClientProjects";
import ProjectRedirectCard from "./ProjectRedirectCard.jsx";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { processProjectInstallmentPayment } from "@/shared/lib/project-payment";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";
import { useOptionalClientDashboardData } from "./useClientDashboardData.js";

const activeProjectCardClassName = "w-full";
const activeProjectRedirectCardClassName = "w-full md:min-h-[506px]";

const ActiveProjects = memo(function ActiveProjects({
  showcaseItems,
  isLoading = false,
  onOpenQuickProject,
  onOpenHireFreelancer,
  onPayRunningProject,
  runningProjectProcessingId = null,
  className = "",
}) {
  const navigate = useNavigate();
  const dashboardData = useOptionalClientDashboardData();
  const isMobile = useIsMobile();
  const [localProcessingProjectId, setLocalProcessingProjectId] = useState(null);
  const items = useMemo(
    () =>
      Array.isArray(showcaseItems)
        ? showcaseItems
        : dashboardData?.activeProjectCards || [],
    [dashboardData?.activeProjectCards, showcaseItems],
  );
  const resolvedIsLoading =
    Array.isArray(showcaseItems) || !dashboardData ? isLoading : dashboardData.isLoading;
  const resolvedRunningProjectProcessingId =
    runningProjectProcessingId ?? localProcessingProjectId;
  const [projectCarouselApi, setProjectCarouselApi] = useState(null);
  const [canGoToPreviousProjects, setCanGoToPreviousProjects] = useState(false);
  const [canGoToNextProjects, setCanGoToNextProjects] = useState(false);
  const [projectCarouselSnapCount, setProjectCarouselSnapCount] = useState(0);
  const [activeProjectSnap, setActiveProjectSnap] = useState(0);
  const [mobileProjectCardHeight, setMobileProjectCardHeight] = useState(0);
  const projectCardRefs = useRef({});

  const projectRedirectCards = useMemo(() => {
    const handleStartProject =
      typeof onOpenQuickProject === "function"
        ? onOpenQuickProject
        : () => navigate("/service");
    const handleBrowseMarketplace =
      typeof onOpenHireFreelancer === "function"
        ? onOpenHireFreelancer
        : () => navigate("/marketplace");

    return [
      {
        id: "start-project",
        Icon: Plus,
        title: "Create New Proposal",
        actionLabel: "Start New Project",
        onClick: handleStartProject,
      },
      // {
      //   id: "browse-marketplace",
      //   Icon: Users,
      //   title: "Find your next specialist",
      //   actionLabel: "Browse Marketplace",
      //   onClick: handleBrowseMarketplace,
      // },
    ];
  }, [navigate, onOpenHireFreelancer, onOpenQuickProject]);

  const [selectedCategory, setSelectedCategory] = useState("All projects");

  // Get categories and their item counts
  const categoriesWithCounts = useMemo(() => {
    const counts = {};
    items.forEach((project) => {
      if (project.serviceType) {
        counts[project.serviceType] = (counts[project.serviceType] || 0) + 1;
      }
    });
    return counts;
  }, [items]);

  const categoryOptions = useMemo(() => {
    return Object.keys(categoriesWithCounts);
  }, [categoriesWithCounts]);

  // Filter project cards based on selected category
  const filteredItems = useMemo(() => {
    if (selectedCategory === "All projects") {
      return items;
    }
    return items.filter(
      (project) => project.serviceType === selectedCategory
    );
  }, [items, selectedCategory]);

  // Only show redirect cards when viewing "All projects"
  const visibleRedirectCards = useMemo(() => {
    if (selectedCategory === "All projects") {
      return projectRedirectCards;
    }
    return [];
  }, [projectRedirectCards, selectedCategory]);

  const handlePayProject = useCallback(
    async (project) => {
      if (!project?.id) return;

      if (typeof onPayRunningProject === "function") {
        await onPayRunningProject(project);
        return;
      }

      if (!dashboardData?.authFetch || !dashboardData?.refreshDashboardData) return;

      setLocalProcessingProjectId(project.id);

      try {
        const paymentResult = await processProjectInstallmentPayment({
          authFetch: dashboardData.authFetch,
          projectId: project.id,
          description: `${project.dueInstallment?.label || "Project payment"} for ${
            project.title || "project"
          }`,
        });

        toast.success(paymentResult?.message || "Payment completed successfully.");
        await dashboardData.refreshDashboardData({ silent: true });
      } catch (error) {
        console.error("Project payment failed:", error);
        toast.error(error?.message || "Failed to process payment");
      } finally {
        setLocalProcessingProjectId(null);
      }
    },
    [dashboardData, onPayRunningProject],
  );

  const totalVisibleProjectCards = filteredItems.length + visibleRedirectCards.length;
  const shouldUseProjectCarousel = isMobile
    ? totalVisibleProjectCards > 1
    : totalVisibleProjectCards > 3;
  // Hide the whole section when there are no running projects to show.
  const shouldHideEmptySection = !resolvedIsLoading && items.length === 0;

  useEffect(() => {
    if (!projectCarouselApi || !shouldUseProjectCarousel) {
      setCanGoToPreviousProjects(false);
      setCanGoToNextProjects(false);
      setProjectCarouselSnapCount(0);
      setActiveProjectSnap(0);
      return undefined;
    }

    const syncProjectCarouselState = () => {
      setCanGoToPreviousProjects(projectCarouselApi.canScrollPrev());
      setCanGoToNextProjects(projectCarouselApi.canScrollNext());
      setProjectCarouselSnapCount(projectCarouselApi.scrollSnapList().length);
      setActiveProjectSnap(projectCarouselApi.selectedScrollSnap());
    };

    syncProjectCarouselState();
    projectCarouselApi.on("select", syncProjectCarouselState);
    projectCarouselApi.on("reInit", syncProjectCarouselState);

    return () => {
      projectCarouselApi.off("select", syncProjectCarouselState);
      projectCarouselApi.off("reInit", syncProjectCarouselState);
    };
  }, [projectCarouselApi, shouldUseProjectCarousel]);



  const measureProjectCardHeights = useCallback(() => {
    const heights = Object.values(projectCardRefs.current)
      .map((card) => card?.getBoundingClientRect().height || 0)
      .filter((height) => height > 0);

    if (heights.length === 0) {
      setMobileProjectCardHeight(0);
      return;
    }

    const maxHeight = Math.ceil(Math.max(...heights));
    setMobileProjectCardHeight((currentHeight) =>
      currentHeight === maxHeight ? currentHeight : maxHeight,
    );
  }, []);

  useEffect(() => {
    if (filteredItems.length === 0) {
      setMobileProjectCardHeight(0);
      return undefined;
    }

    let frameId = 0;
    const scheduleMeasure = () => {
      if (typeof window === "undefined") {
        return;
      }
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(measureProjectCardHeights);
    };

    scheduleMeasure();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
          scheduleMeasure();
        })
        : null;

    Object.values(projectCardRefs.current).forEach((card) => {
      if (card && resizeObserver) {
        resizeObserver.observe(card);
      }
    });

    window.addEventListener("resize", scheduleMeasure);

    return () => {
      window.removeEventListener("resize", scheduleMeasure);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.cancelAnimationFrame(frameId);
    };
  }, [isMobile, measureProjectCardHeights, shouldUseProjectCarousel, filteredItems.length]);

  if (shouldHideEmptySection) {
    return null;
  }

  return (
    <section className={cn("mt-6 sm:mt-14", className)}>
      <div className="mb-4 flex flex-col gap-3.5 sm:mb-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center justify-between w-full sm:w-auto min-w-0">
          <div className="flex items-center gap-3">
            <h2 className="text-[22px] sm:text-[1.75rem] font-semibold tracking-[-0.02em] text-foreground">
              Active Projects
            </h2>
            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary/10 px-2 text-[11px] font-bold text-primary">
              {filteredItems.length}
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
          {!resolvedIsLoading && items.length > 0 && (
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
                    {items.length}
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

          {!resolvedIsLoading && shouldUseProjectCarousel ? (
            <ProjectCarouselControls
              onPrevious={() => projectCarouselApi?.scrollPrev()}
              onNext={() => projectCarouselApi?.scrollNext()}
              canGoPrevious={canGoToPreviousProjects}
              canGoNext={canGoToNextProjects}
              previousLabel="Show previous active projects"
              nextLabel="Show next active projects"
            />
          ) : null}
        </div>
      </div>

      {resolvedIsLoading ? (
        <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-6 xl:grid-cols-3 xl:gap-7">
          {[0, 1, 2].map((item) => (
            <ProjectCardSkeleton key={`active-project-skeleton-${item}`} />
          ))}
        </div>
      ) : items.length > 0 ? (
        <>
          {filteredItems.length === 0 && visibleRedirectCards.length === 0 ? (
            <DashboardPanel className="flex h-[220px] items-center justify-center rounded-[28px] border border-white/[0.06] bg-card p-8 text-center sm:h-[260px]">
              <div className="max-w-md">
                <p className="text-[1.35rem] font-semibold tracking-[-0.03em] dark:text-white text-[#1C1B1F]">
                  No projects in this category
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Try selecting another category or "All projects" to view your active pipeline.
                </p>
              </div>
            </DashboardPanel>
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
                  {filteredItems.map((item) => (
                    <CarouselItem
                      key={item.id}
                      className="basis-full pl-[2px] pr-[2px] pt-1 md:basis-[calc((100%-1.5rem)/2)] lg:basis-[calc((100%-3rem)/3)] xl:basis-[calc((100%-3.5rem)/3)]"
                    >
                      <div
                        ref={(node) => {
                          projectCardRefs.current[item.id] = node;
                        }}
                      >
                        <ProjectProposalCard
                          project={item}
                          onPay={handlePayProject}
                          isPaying={resolvedRunningProjectProcessingId === item.id}
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
                          mobileProjectCardHeight > 0
                            ? { height: `${mobileProjectCardHeight}px` }
                            : undefined
                        }
                      >
                        <ProjectRedirectCard
                          item={item}
                          className="w-full h-full"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
              <ProjectCarouselDots
                count={projectCarouselSnapCount}
                activeIndex={activeProjectSnap}
                onSelect={(index) => projectCarouselApi?.scrollTo(index)}
                ariaLabel="Active projects carousel pagination"
                getDotLabel={(index) => `Go to active projects slide ${index + 1}`}
              />
            </div>
          ) : (
            <div className="grid items-start gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-6 xl:grid-cols-3 xl:gap-7">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  ref={(node) => {
                    projectCardRefs.current[item.id] = node;
                  }}
                  className="w-full"
                >
                  <ProjectProposalCard
                    project={item}
                    onPay={handlePayProject}
                    isPaying={resolvedRunningProjectProcessingId === item.id}
                    replaceSectionBadgeWithStatus
                    className={activeProjectCardClassName}
                  />
                </div>
              ))}
              {visibleRedirectCards.map((item) => (
                <div
                  key={item.id}
                  style={
                    mobileProjectCardHeight > 0
                      ? { height: `${mobileProjectCardHeight}px` }
                      : undefined
                  }
                  className="w-full"
                >
                  <ProjectRedirectCard
                    item={item}
                    className="w-full h-full"
                  />
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}
    </section>
  );
});

export default ActiveProjects;
