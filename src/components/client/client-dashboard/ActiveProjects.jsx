import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Users from "lucide-react/dist/esm/icons/users";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import {
  DashboardPanel,
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
const activeProjectRedirectCardClassName = "w-full h-full md:min-h-[506px]";

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
        Icon: Sparkles,
        title: "Create New Proposal",
        actionLabel: "Start New Project",
        onClick: handleStartProject,
      },
      {
        id: "browse-marketplace",
        Icon: Users,
        title: "Find your next specialist",
        actionLabel: "Browse Marketplace",
        onClick: handleBrowseMarketplace,
      },
    ];
  }, [navigate, onOpenHireFreelancer, onOpenQuickProject]);

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

  const totalVisibleProjectCards = items.length + projectRedirectCards.length;
  const shouldUseProjectCarousel = isMobile
    ? totalVisibleProjectCards > 1
    : totalVisibleProjectCards > 3;

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
    if (!isMobile || !shouldUseProjectCarousel) {
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
  }, [isMobile, measureProjectCardHeights, shouldUseProjectCarousel, items.length]);

  return (
    <section className={cn("mt-14", className)}>
      <div className="mb-4 flex items-center justify-between gap-4 sm:mb-5">
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

      {resolvedIsLoading ? (
        <div className="grid gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3 xl:gap-7">
          {[0, 1, 2].map((item) => (
            <ProjectCardSkeleton key={`active-project-skeleton-${item}`} />
          ))}
        </div>
      ) : items.length > 0 ? (
        <>
          {shouldUseProjectCarousel ? (
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
                  {items.map((item) => (
                    <CarouselItem
                      key={item.id}
                      className="basis-full pl-[2px] pr-[2px] pt-1 md:basis-[calc((100%-1.5rem)/2)] xl:basis-[calc((100%-3.5rem)/3)]"
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
                  {projectRedirectCards.map((item) => (
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
                        <ProjectRedirectCard
                          item={item}
                          className={activeProjectRedirectCardClassName}
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
            <div className="grid items-start gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3 xl:gap-7">
              {items.map((item) => (
                <ProjectProposalCard
                  key={item.id}
                  project={item}
                  onPay={handlePayProject}
                  isPaying={resolvedRunningProjectProcessingId === item.id}
                  replaceSectionBadgeWithStatus
                  className={activeProjectCardClassName}
                />
              ))}
              {projectRedirectCards.map((item) => (
                <ProjectRedirectCard
                  key={item.id}
                  item={item}
                  className={activeProjectRedirectCardClassName}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <DashboardPanel className="flex min-h-[220px] items-center justify-center p-8 text-center">
          <div className="max-w-md">
            <p className="text-[1.35rem] font-semibold tracking-[-0.03em] text-white">
              No active projects yet
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Projects will appear here once a freelancer is assigned and work
              has started.
            </p>
          </div>
        </DashboardPanel>
      )}
    </section>
  );
});

export default ActiveProjects;
