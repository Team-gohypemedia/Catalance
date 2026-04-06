import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Plus from "lucide-react/dist/esm/icons/plus";
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
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { processProjectInstallmentPayment } from "@/shared/lib/project-payment";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";
import { useOptionalClientDashboardData } from "./useClientDashboardData.js";

const activeProjectCardClassName = "w-full";
const activeProjectRedirectCardClassName = "w-full h-full md:min-h-[506px]";

const ProjectRedirectCard = memo(function ProjectRedirectCard({
  item,
  className,
}) {
  const isStartProjectCard = item.id === "start-project";
  const isBrowseMarketplaceCard = item.id === "browse-marketplace";

  if (isStartProjectCard || isBrowseMarketplaceCard) {
    const heading = isStartProjectCard ? "Create New Proposal" : item.title;
    const ctaLabel = isStartProjectCard
      ? "START NEW PROJECT"
      : String(item.actionLabel || "Browse Marketplace").toUpperCase();

    return (
      <DashboardPanel
        className={cn(
          "flex min-h-[320px] flex-col justify-between overflow-hidden bg-card p-4 sm:p-5 xl:p-6",
          className,
        )}
      >
        <div className="flex flex-1 flex-col items-center text-center">
          <h3 className="text-[clamp(1.5rem,5vw,2.15rem)] font-semibold tracking-[-0.04em] text-white">
            {heading}
          </h3>

          <div className="flex w-full flex-1 items-center justify-center">
            <button
              type="button"
              aria-label={
                isStartProjectCard ? "Create new proposal" : "Browse marketplace"
              }
              onClick={item.onClick}
              className="inline-flex h-[104px] w-[104px] items-center justify-center rounded-[14px] border border-primary/30 bg-primary/20 text-primary transition-colors hover:bg-primary/28"
            >
              {isStartProjectCard ? (
                <Plus className="size-10" strokeWidth={2.6} />
              ) : (
                <Users className="size-10" strokeWidth={2} />
              )}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={item.onClick}
          className="inline-flex h-[58px] w-full shrink-0 items-center justify-center rounded-[14px] bg-[#f5cd05] px-6 text-[1.02rem] font-bold uppercase tracking-[0.04em] text-black transition-colors hover:bg-[#ffdd4f]"
        >
          {ctaLabel}
        </button>
      </DashboardPanel>
    );
  }

  return (
    <DashboardPanel
      className={cn(
        "flex flex-col overflow-hidden bg-card p-4 sm:p-5 xl:p-6",
        className,
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] border border-white/[0.08] bg-white/[0.06] text-[#d4d4d8] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:h-8 sm:w-8">
            <item.Icon className="size-3.5 sm:size-4" strokeWidth={1.85} />
          </div>
          <span className="inline-flex h-7 items-center rounded-[8px] bg-white/[0.06] px-2.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[#23d18b] sm:h-8 sm:px-3 sm:text-[11px] sm:tracking-[0.22em]">
            {item.eyebrow}
          </span>
        </div>

        <h3 className="mt-5 text-[clamp(1.5rem,5vw,2.05rem)] font-semibold leading-[1.04] tracking-[-0.04em] text-white">
          {item.title}
        </h3>
        <p className="mt-3 max-w-[28ch] text-sm leading-6 text-[#8f96a3] line-clamp-3">
          {item.description}
        </p>

        <div className="mt-6 min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1 [scrollbar-color:rgba(255,255,255,0.16)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/[0.14]">
          {item.highlights.map((highlight) => (
            <div
              key={highlight}
              className="flex items-center gap-3 rounded-[14px] border border-white/[0.06] bg-white/[0.035] px-3.5 py-2.5 text-sm text-[#e5e7eb] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
            >
              <span aria-hidden="true" className="size-2 rounded-full bg-[#ffc107]" />
              <span className="line-clamp-1">{highlight}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={item.onClick}
        className="mt-6 inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-[16px] bg-[#ffc107] px-5 py-3.5 text-sm font-semibold text-black transition-colors hover:bg-[#ffd54f]"
      >
        <span>{item.actionLabel}</span>
        <ChevronRight className="size-4" />
      </button>
    </DashboardPanel>
  );
});

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
        eyebrow: "Project Pipeline",
        title: "Start another project",
        description:
          "Launch a fresh brief, define the scope, and keep your delivery pipeline active.",
        highlights: [
          "Create a new proposal",
          "Set budget and timeline",
          "Invite the right talent",
        ],
        actionLabel: "Start New Project",
        onClick: handleStartProject,
      },
      {
        id: "browse-marketplace",
        Icon: Users,
        eyebrow: "Talent Marketplace",
        title: "Find your next specialist",
        description:
          "Browse verified freelancers and open the next engagement when you are ready.",
        highlights: [
          "Explore verified talent",
          "Compare specialists fast",
          "Add another active project",
        ],
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
            <p className="mt-3 text-sm leading-6 text-[#94a3b8]">
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
