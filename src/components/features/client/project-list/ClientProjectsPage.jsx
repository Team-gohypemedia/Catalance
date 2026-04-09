"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import ClipboardList from "lucide-react/dist/esm/icons/clipboard-list";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import ClientDashboardFooter from "@/components/features/client/ClientDashboardFooter";
import ClientPageHeader from "@/components/features/client/ClientPageHeader";
import ClientWorkspaceHeader from "@/components/features/client/ClientWorkspaceHeader";
import { useAuth } from "@/shared/context/AuthContext";
import { useNotifications } from "@/shared/context/NotificationContext";
import { useIsMobile } from "@/shared/hooks/use-mobile";
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

const getDisplayName = (user) =>
  user?.fullName || user?.name || user?.email?.split("@")[0] || "Client";

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
  <div className="rounded-[28px] border border-white/[0.06] bg-card p-8 text-center">
    <div className="mx-auto flex max-w-md flex-col items-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-white/[0.06] text-[#94a3b8]">
        <ClipboardList className="size-7" />
      </div>
      <h2 className="mt-6 text-[1.35rem] font-semibold tracking-[-0.03em] text-white">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-[#94a3b8]">{description}</p>
      {showAction ? (
        <Link
          to="/client/proposal"
          className="mt-6 inline-flex items-center justify-center rounded-[14px] bg-[#ffc107] px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-[#ffd54f]"
        >
          Create New Proposal
        </Link>
      ) : null}
    </div>
  </div>
);

const ProjectCarouselDots = ({ count, activeIndex, onSelect, ariaLabel }) => {
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
            aria-label={`Go to project ${index + 1}`}
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
};

const ClientProjectsPage = () => {
  const { projects, isLoading, processingProjectId, handleApproveAndPay } =
    useClientProjectsData();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { unreadCount } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projectCarouselApi, setProjectCarouselApi] = useState(null);
  const [canGoToPreviousProject, setCanGoToPreviousProject] = useState(false);
  const [canGoToNextProject, setCanGoToNextProject] = useState(false);
  const [projectCarouselSnapCount, setProjectCarouselSnapCount] = useState(0);
  const [activeProjectSnap, setActiveProjectSnap] = useState(0);
  const [activeFilter, setActiveFilter] = useState("ongoing");
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
  const visibleProjectCards = useMemo(
    () =>
      projectCards.filter((project) =>
        activeFilter === "completed"
          ? project.statusMeta.label === "Completed"
          : project.statusMeta.label !== "Completed",
      ),
    [activeFilter, projectCards],
  );
  const shouldUseProjectCarousel = isMobile && visibleProjectCards.length > 1;

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

  useEffect(() => {
    if (isLoading) return;
    if (hasUserSelectedFilterRef.current) return;

    if (activeFilter === "ongoing" && ongoingProjectCount === 0 && completedProjectCount > 0) {
      setActiveFilter("completed");
    }

    if (activeFilter === "completed" && completedProjectCount === 0 && ongoingProjectCount > 0) {
      setActiveFilter("ongoing");
    }
  }, [activeFilter, completedProjectCount, isLoading, ongoingProjectCount]);

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
    <div className="min-h-screen bg-background text-[#f1f5f9]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1536px] flex-col px-4 sm:px-6 lg:px-[40px] xl:w-[85%] xl:max-w-none">
        <ClientWorkspaceHeader
          profile={{
            avatar: user?.avatar,
            name: headerDisplayName,
            initial: getInitials(headerDisplayName),
          }}
          activeWorkspaceKey="projects"
          unreadCount={unreadCount}
        />

        <main className="flex-1 pb-12">
          <ClientPageHeader
            title="Project Proposals"
            dateLabel={false}
            actions={
              <div className="inline-flex h-auto w-full max-w-[22rem] flex-nowrap items-stretch gap-1 rounded-[32px] border border-border bg-card p-1 shadow-none sm:w-auto sm:max-w-none sm:gap-2 sm:p-1.5">
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
                          ? "border-[#ffc107]/70 bg-[#ffc107] text-[#141414]"
                          : "text-[#a3a6ad] hover:text-white",
                      )}
                    >
                      {option.label} ({count})
                    </button>
                  );
                })}
              </div>
            }
          />

          <section className="mt-12">
            {isLoading ? (
              <div className="grid items-start gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <ProjectCardSkeleton key={item} />
                ))}
              </div>
            ) : visibleProjectCards.length > 0 ? (
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
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="absolute left-0 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 size-8 rounded-full border border-border bg-background/95 text-foreground shadow-none hover:bg-background hover:text-foreground disabled:opacity-100 disabled:text-muted-foreground md:hidden"
                      onClick={() => projectCarouselApi?.scrollPrev()}
                      disabled={!canGoToPreviousProject}
                      aria-label="Show previous project"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="absolute right-0 top-1/2 z-10 translate-x-1/2 -translate-y-1/2 size-8 rounded-full border border-border bg-background/95 text-foreground shadow-none hover:bg-background hover:text-foreground disabled:opacity-100 disabled:text-muted-foreground md:hidden"
                      onClick={() => projectCarouselApi?.scrollNext()}
                      disabled={!canGoToNextProject}
                      aria-label="Show next project"
                    >
                      <ChevronRight className="size-4" />
                    </Button>

                    <CarouselContent className="ml-0 items-start gap-5 [backface-visibility:hidden] [will-change:transform] sm:gap-6 xl:gap-7">
                      {visibleProjectCards.map((project) => (
                        <CarouselItem key={project.id} className="basis-full pl-[2px] pr-[2px] pt-1">
                          <ProjectProposalCard
                            project={project}
                            onPay={handleApproveAndPay}
                            isPaying={processingProjectId === project.id}
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>

                  <ProjectCarouselDots
                    count={projectCarouselSnapCount}
                    activeIndex={activeProjectSnap}
                    onSelect={(index) => projectCarouselApi?.scrollTo(index)}
                    ariaLabel="Project carousel pagination"
                  />
                </div>
              ) : (
                <div className="grid items-start gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {visibleProjectCards.map((project) => (
                    <ProjectProposalCard
                      key={project.id}
                      project={project}
                      onPay={handleApproveAndPay}
                      isPaying={processingProjectId === project.id}
                    />
                  ))}
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
