"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import ClipboardList from "lucide-react/dist/esm/icons/clipboard-list";
import Plus from "lucide-react/dist/esm/icons/plus";
import Users from "lucide-react/dist/esm/icons/users";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import Check from "lucide-react/dist/esm/icons/check";
import Filter from "lucide-react/dist/esm/icons/filter";
import ClientDashboardFooter from "@/components/features/client/ClientDashboardFooter";
import ClientWorkspaceHeader from "@/components/features/client/ClientWorkspaceHeader";
import { ProjectCarouselControls } from "@/components/client/client-dashboard/shared.jsx";
import ProjectRedirectCard from "@/components/client/client-dashboard/ProjectRedirectCard.jsx";
import { useAuth } from "@/shared/context/AuthContext";
import { useNotifications } from "@/shared/context/NotificationContext";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import {
  resolveUserDisplayName,
  resolveUserSecondaryLabel,
} from "@/shared/lib/user-display";
import { cn } from "@/shared/lib/utils";
import {
  buildProjectCardModel,
  ProjectCardSkeleton,
  ProjectProposalCard,
} from "@/components/features/client/ClientProjects";
import { useClientProjectsData } from "./useClientProjectsData.js";

const projectFilterOptions = [
  { key: "ongoing", label: "Ongoing Projects" },
  { key: "completed", label: "Completed Projects" },
];

const projectFilterKeys = new Set(projectFilterOptions.map((option) => option.key));

const activeProjectCardClassName = "w-full h-full";
const activeProjectRedirectCardClassName = "w-full h-full md:min-h-[506px]";

const getDisplayName = (user) => resolveUserDisplayName(user, "Client");

const getInitials = (value = "") => {
  const parts = String(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "C";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const EmptyProjectsState = ({
  title = "No projects yet",
  description = "Active and pending collaborations will appear here once freelancers accept your proposals.",
  showAction = true,
}) => (
  <div className="rounded-[28px] border border-border bg-card p-8 text-center">
    <div className="mx-auto flex max-w-md flex-col items-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <ClipboardList className="size-7" />
      </div>
      <h2 className="mt-6 text-[1.35rem] font-semibold tracking-[-0.03em] text-foreground">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
      {showAction ? (
        <Link
          to="/service"
          className="mt-6 inline-flex items-center justify-center rounded-[14px] bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/80 dark:text-[#141414]"
        >
          Create New Proposal
        </Link>
      ) : null}
    </div>
  </div>
);

const ProjectCarouselDots = ({ count, activeIndex, onSelect, ariaLabel, getDotLabel }) => {
  if (count <= 1) return null;

  return (
    <div className="mt-2.5 flex items-center justify-center gap-2" aria-label={ariaLabel}>
      {Array.from({ length: count }, (_, index) => {
        const isActive = index === activeIndex;

        return (
          <button
            key={`client-project-carousel-dot-${index}`}
            type="button"
            onClick={() => onSelect(index)}
            aria-label={
              typeof getDotLabel === "function"
                ? getDotLabel(index)
                : `Go to project ${index + 1}`
            }
            aria-pressed={isActive}
            className={cn(
              "h-2.5 rounded-full transition-all duration-200",
              isActive
                ? "w-7 bg-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.32)]"
                : "w-2.5 bg-primary/40 hover:bg-primary/60",
            )}
          />
        );
      })}
    </div>
  );
};

const ClientProjectsPage = () => {
  const { projects, isLoading, processingProjectId, handleApproveAndPay } =
    useClientProjectsData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { unreadCount } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projectCarouselApi, setProjectCarouselApi] = useState(null);
  const [canGoToPreviousProject, setCanGoToPreviousProject] = useState(false);
  const [canGoToNextProject, setCanGoToNextProject] = useState(false);
  const [projectCarouselSnapCount, setProjectCarouselSnapCount] = useState(0);
  const [activeProjectSnap, setActiveProjectSnap] = useState(0);
  const [activeFilter, setActiveFilter] = useState("ongoing");
  const [mobileProjectCardHeight, setMobileProjectCardHeight] = useState(0);
  const [activeServiceFilter, setActiveServiceFilter] = useState("all");
  const [activeFreelancerFilter, setActiveFreelancerFilter] = useState("all");

  const projectCardRefs = useRef({});
  const hasUserSelectedFilterRef = useRef(false);
  const requestedFilter = String(searchParams.get("filter") || "").toLowerCase();
  const hasRequestedFilter = projectFilterKeys.has(requestedFilter);

  useEffect(() => {
    if (!hasRequestedFilter) {
      hasUserSelectedFilterRef.current = false;
      setActiveFilter("ongoing");
      return;
    }

    hasUserSelectedFilterRef.current = true;
    setActiveFilter(requestedFilter);
  }, [hasRequestedFilter, requestedFilter]);

  const headerDisplayName = useMemo(() => getDisplayName(user), [user]);
  const projectCards = useMemo(
    () => projects.map((project) => buildProjectCardModel(project)),
    [projects],
  );
  const ongoingProjectCount = useMemo(
    () => projectCards.filter((project) => project.statusMeta.label !== "Completed").length,
    [projectCards],
  );
  const completedProjectCount = useMemo(
    () => projectCards.filter((project) => project.statusMeta.label === "Completed").length,
    [projectCards],
  );
  const handleStartProject = useCallback(() => {
    navigate("/service");
  }, [navigate]);

  const handleBrowseMarketplace = useCallback(() => {
    navigate("/marketplace");
  }, [navigate]);

  const projectRedirectCards = useMemo(
    () => [
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
    ],
    [handleBrowseMarketplace, handleStartProject],
  );

  const servicesWithCounts = useMemo(() => {
    const counts = {};
    projectCards.forEach((project) => {
      const name = project.freelancerName;
      if (activeFreelancerFilter !== "all" && name !== activeFreelancerFilter) {
        return;
      }
      if (project.serviceType) {
        counts[project.serviceType] = (counts[project.serviceType] || 0) + 1;
      }
    });
    return counts;
  }, [projectCards, activeFreelancerFilter]);

  const availableServices = useMemo(() => {
    return ["all", ...Object.keys(servicesWithCounts)];
  }, [servicesWithCounts]);

  const freelancersWithCounts = useMemo(() => {
    const counts = {};
    projectCards.forEach((project) => {
      if (activeServiceFilter !== "all" && project.serviceType !== activeServiceFilter) {
        return;
      }
      const name = project.freelancerName;
      if (name && name !== "Assigned Freelancer") {
        counts[name] = (counts[name] || 0) + 1;
      }
    });
    return counts;
  }, [projectCards, activeServiceFilter]);

  const availableFreelancers = useMemo(() => {
    return ["all", ...Object.keys(freelancersWithCounts)];
  }, [freelancersWithCounts]);

  const visibleProjectCards = useMemo(
    () =>
      projectCards.filter((project) => {
        const matchesStatus =
          activeFilter === "completed"
            ? project.statusMeta.label === "Completed"
            : project.statusMeta.label !== "Completed";
        const matchesService =
          activeServiceFilter === "all" ? true : project.serviceType === activeServiceFilter;
        const matchesFreelancer =
          activeFreelancerFilter === "all" ? true : project.freelancerName === activeFreelancerFilter;
        return matchesStatus && matchesService && matchesFreelancer;
      }),
    [activeFilter, activeServiceFilter, activeFreelancerFilter, projectCards],
  );

  const carouselProjectCards = useMemo(
    () => (visibleProjectCards.length > 0 ? [...visibleProjectCards, ...projectRedirectCards] : []),
    [projectRedirectCards, visibleProjectCards],
  );

  const shouldUseProjectCarousel = isMobile
    ? carouselProjectCards.length > 1
    : carouselProjectCards.length > 3;

  useEffect(() => {
    if (!projectCarouselApi || !shouldUseProjectCarousel) {
      setCanGoToPreviousProject(false);
      setCanGoToNextProject(false);
      setProjectCarouselSnapCount(0);
      setActiveProjectSnap(0);
      return undefined;
    }

    const syncProjectCarouselState = () => {
      setCanGoToPreviousProject(projectCarouselApi.canScrollPrev());
      setCanGoToNextProject(projectCarouselApi.canScrollNext());
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
  }, [isMobile, measureProjectCardHeights, shouldUseProjectCarousel, visibleProjectCards.length]);

  const handleSelectFilter = useCallback(
    (nextFilter) => {
      hasUserSelectedFilterRef.current = true;
      setActiveFilter(nextFilter);
      setSearchParams((currentParams) => {
        const nextParams = new URLSearchParams(currentParams);
        nextParams.set("filter", nextFilter);
        return nextParams;
      });
    },
    [setSearchParams],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
          <div className="mx-auto flex min-h-screen w-full max-w-[1536px] flex-col px-4 sm:px-6 lg:px-[40px] xl:w-[94%] xl:max-w-none">
        <ClientWorkspaceHeader
              profile={{
                avatar: user?.avatar,
                name: headerDisplayName,
                email: resolveUserSecondaryLabel(user),
                initial: getInitials(headerDisplayName),
              }}
              activeWorkspaceKey="projects"
              unreadCount={unreadCount}
            />

            <main className="flex-1 pb-12">
              <section className="mt-12 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <h1 className="text-[clamp(2rem,4vw,3rem)] font-semibold leading-[0.96] tracking-[-0.05em] text-foreground">
                    {activeFilter === "completed" ? "Completed Projects" : "Active Projects"}
                  </h1>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="inline-flex h-auto w-full flex-nowrap items-stretch gap-1 rounded-[32px] border border-border bg-background p-1 shadow-none sm:w-auto sm:max-w-none sm:gap-2 sm:p-1.5">
                    {projectFilterOptions.map((option) => {
                      const count =
                        option.key === "completed" ? completedProjectCount : ongoingProjectCount;
                      const isActive = activeFilter === option.key;

                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => handleSelectFilter(option.key)}
                          className={cn(
                            "h-10 min-w-0 basis-0 flex-1 whitespace-nowrap rounded-full border border-transparent px-4 text-center text-[0.72rem] font-semibold tracking-[-0.01em] transition sm:h-11 sm:basis-auto sm:flex-none sm:px-5 sm:text-[0.95rem] sm:tracking-normal",
                            isActive
                              ? "border-[var(--primary)]/70 bg-[var(--primary)] text-white dark:text-[#141414]"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {option.label} ({count})
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex flex-col sm:flex-row w-full sm:w-auto items-end sm:items-center justify-end gap-3">
                    {availableServices.length > 1 && (
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center justify-between w-full sm:w-auto sm:min-w-[180px] h-10 sm:h-11 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-colors cursor-pointer shadow-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              <Filter className="size-4 shrink-0" />
                              <span className="truncate pr-2">
                                {activeServiceFilter === "all" ? "All Services" : activeServiceFilter.split(/[_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                              </span>
                            </div>
                            <ChevronDown className="size-4 opacity-80 shrink-0" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[280px] sm:w-auto sm:min-w-[200px] sm:max-w-[400px] max-h-[300px] overflow-y-auto rounded-2xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                          {availableServices.map((service) => {
                            const count = service === "all"
                              ? Object.values(servicesWithCounts).reduce((a, b) => a + b, 0)
                              : servicesWithCounts[service];

                            const baseLabel = service === "all" 
                              ? "All Services" 
                              : service
                                  .split(/[_]/)
                                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                  .join(" ");
                            
                            const displayLabel = `${baseLabel} (${count})`;
                                  
                            return (
                              <DropdownMenuItem 
                                key={service} 
                                onClick={() => setActiveServiceFilter(service)}
                                className={cn("cursor-pointer rounded-xl flex items-center justify-between px-3 py-2 text-sm", activeServiceFilter === service && "bg-muted font-medium")}
                              >
                                <span className="pr-2">{displayLabel}</span>
                                {activeServiceFilter === service && <Check className="size-4 opacity-50 shrink-0 ml-2" />}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    {availableFreelancers.length > 1 && (
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center justify-between w-full sm:w-auto sm:min-w-[180px] h-10 sm:h-11 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-colors cursor-pointer shadow-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              <Filter className="size-4 shrink-0" />
                              <span className="truncate pr-2">
                                {activeFreelancerFilter === "all" ? "All Freelancers" : activeFreelancerFilter}
                              </span>
                            </div>
                            <ChevronDown className="size-4 opacity-80 shrink-0" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[280px] sm:w-auto sm:min-w-[200px] sm:max-w-[400px] max-h-[300px] overflow-y-auto rounded-2xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                          {availableFreelancers.map((freelancer) => {
                            const count = freelancer === "all"
                              ? Object.values(freelancersWithCounts).reduce((a, b) => a + b, 0)
                              : freelancersWithCounts[freelancer];

                            const baseLabel = freelancer === "all" ? "All Freelancers" : freelancer;
                            const displayLabel = `${baseLabel} (${count})`;

                            return (
                              <DropdownMenuItem 
                                key={freelancer} 
                                onClick={() => setActiveFreelancerFilter(freelancer)}
                                className={cn("cursor-pointer rounded-xl flex items-center justify-between px-3 py-2 text-sm", activeFreelancerFilter === freelancer && "bg-muted font-medium")}
                              >
                                <span className="pr-2">{displayLabel}</span>
                                {activeFreelancerFilter === freelancer && <Check className="size-4 opacity-50 shrink-0 ml-2" />}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    {!isLoading && shouldUseProjectCarousel ? (
                      <div className="hidden sm:flex items-center">
                        <ProjectCarouselControls
                          onPrevious={() => projectCarouselApi?.scrollPrev()}
                          onNext={() => projectCarouselApi?.scrollNext()}
                          canGoPrevious={canGoToPreviousProject}
                          canGoNext={canGoToNextProject}
                          previousLabel={`Show previous ${
                            activeFilter === "completed" ? "completed" : "ongoing"
                          } projects`}
                          nextLabel={`Show next ${
                            activeFilter === "completed" ? "completed" : "ongoing"
                          } projects`}
                        />
                      </div>
                    ) : null}
                  </div>
                  {!isLoading && shouldUseProjectCarousel && (
                    <div className="flex sm:hidden items-center justify-end w-full mt-2">
                      <ProjectCarouselControls
                        onPrevious={() => projectCarouselApi?.scrollPrev()}
                        onNext={() => projectCarouselApi?.scrollNext()}
                        canGoPrevious={canGoToPreviousProject}
                        canGoNext={canGoToNextProject}
                        previousLabel={`Show previous ${
                          activeFilter === "completed" ? "completed" : "ongoing"
                        } projects`}
                        nextLabel={`Show next ${
                          activeFilter === "completed" ? "completed" : "ongoing"
                        } projects`}
                      />
                    </div>
                  )}
                </div>
              </section>

              <section className="mt-8 sm:mt-10">
                {isLoading ? (
                  <div className="grid items-stretch gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                    {[1, 2, 3].map((item) => (
                      <ProjectCardSkeleton key={item} />
                    ))}
                  </div>
                ) : carouselProjectCards.length > 0 ? (
                  shouldUseProjectCarousel ? (
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
                        <CarouselContent className="ml-0 items-stretch gap-5 [backface-visibility:hidden] [will-change:transform] sm:gap-6 xl:gap-7">
                          {carouselProjectCards.map((item) => {
                            const isStaticCard =
                              item.id === "start-project" || item.id === "browse-marketplace";

                            return (
                              <CarouselItem
                                key={item.id}
                                className="basis-full pl-[2px] pr-[2px] pt-1 md:basis-[calc((100%-1.5rem)/2)] lg:basis-[calc((100%-3rem)/3)] xl:basis-[calc((100%-3.5rem)/3)]"
                              >
                                {isStaticCard ? (
                                  <div
                                    className="h-full"
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
                                ) : (
                                  <div
                                    className="h-full"
                                    ref={(node) => {
                                      projectCardRefs.current[item.id] = node;
                                    }}
                                  >
                                    <ProjectProposalCard
                                      project={item}
                                      onPay={handleApproveAndPay}
                                      isPaying={processingProjectId === item.id}
                                      replaceSectionBadgeWithStatus
                                      className={activeProjectCardClassName}
                                    />
                                  </div>
                                )}
                              </CarouselItem>
                            );
                          })}
                        </CarouselContent>
                      </Carousel>

                      <ProjectCarouselDots
                        count={projectCarouselSnapCount}
                        activeIndex={activeProjectSnap}
                        onSelect={(index) => projectCarouselApi?.scrollTo(index)}
                        ariaLabel={
                          activeFilter === "completed"
                            ? "Completed projects carousel pagination"
                            : "Ongoing projects carousel pagination"
                        }
                        getDotLabel={(index) =>
                          index < visibleProjectCards.length
                            ? `Go to ${activeFilter === "completed" ? "completed" : "ongoing"} project ${
                                index + 1
                              }`
                            : index === visibleProjectCards.length
                              ? "Go to start new project card"
                              : "Go to browse marketplace card"
                        }
                      />
                    </div>
                  ) : (
                    <div className="grid items-stretch gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                      {carouselProjectCards.map((item) => {
                        const isStaticCard =
                          item.id === "start-project" || item.id === "browse-marketplace";

                        return isStaticCard ? (
                          <ProjectRedirectCard
                            key={item.id}
                            item={item}
                            className={activeProjectRedirectCardClassName}
                          />
                        ) : (
                          <ProjectProposalCard
                            key={item.id}
                            project={item}
                            onPay={handleApproveAndPay}
                            isPaying={processingProjectId === item.id}
                            replaceSectionBadgeWithStatus
                            className={activeProjectCardClassName}
                          />
                        );
                      })}
                    </div>
                  )
                ) : projectCards.length > 0 ? (
                  <EmptyProjectsState
                    title={
                      activeFilter === "completed"
                        ? "No completed projects yet"
                        : "No ongoing projects right now"
                    }
                    description={
                      activeFilter === "completed"
                        ? "Completed projects will appear here after final delivery and payment closure."
                        : "Projects appear here after a freelancer accepts your proposal."
                    }
                    showAction={false}
                  />
                ) : (
                  <EmptyProjectsState />
                )}
              </section>
            </main>

            <ClientDashboardFooter variant="workspace" />
          </div>
        </div>
      );
    };

    export default ClientProjectsPage;
