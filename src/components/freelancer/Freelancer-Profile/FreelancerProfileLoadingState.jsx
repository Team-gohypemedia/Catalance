import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";
import FreelancerProfilePageShell from "./FreelancerProfilePageShell";

const loadingItems = (count) => Array.from({ length: count }, (_, index) => index);

const LoadingBlock = ({ className = "" }) => (
  <Skeleton className={cn("bg-white/[0.08] dark:bg-white/[0.08]", className)} />
);

const LoadingHeroCard = () => (
  <Card className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
    <LoadingBlock className="h-36 w-full rounded-none sm:h-44 md:h-64" />

    <div className="absolute right-4 top-4 z-10">
      <LoadingBlock className="h-8 w-8 rounded-md" />
    </div>

    <div className="relative border-t border-border/60 bg-card px-4 pb-5 pt-14 sm:px-5 sm:pb-5 sm:pt-16 md:px-6 md:pt-20">
      <div className="absolute -top-16 left-4 sm:-top-20 sm:left-5 md:-top-24 md:left-6">
        <LoadingBlock className="h-24 w-24 rounded-full sm:h-32 sm:w-32 md:h-36 md:w-36" />
      </div>

      <div className="mt-2 space-y-4 sm:mt-0">
        <div className="space-y-3">
          <LoadingBlock className="h-9 w-56 rounded-full sm:h-10 sm:w-72 md:h-12 md:w-80" />

          <div className="flex flex-wrap gap-2">
            <LoadingBlock className="h-6 w-28 rounded-full" />
            <LoadingBlock className="h-6 w-24 rounded-full" />
            <LoadingBlock className="h-6 w-20 rounded-full" />
          </div>
        </div>

        <div className="space-y-2">
          <LoadingBlock className="h-4 w-full rounded-full" />
          <LoadingBlock className="h-4 w-11/12 rounded-full" />
          <LoadingBlock className="h-4 w-4/5 rounded-full" />
        </div>

        <div className="flex flex-wrap gap-2">
          <LoadingBlock className="h-9 w-28 rounded-full" />
          <LoadingBlock className="h-9 w-24 rounded-full" />
          <LoadingBlock className="h-9 w-32 rounded-full" />
          <LoadingBlock className="h-9 w-20 rounded-full" />
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <LoadingBlock className="h-10 w-28 rounded-xl" />
          <LoadingBlock className="h-10 w-32 rounded-xl" />
          <LoadingBlock className="h-10 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  </Card>
);

const LoadingSkillsCard = () => (
  <Card className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm md:p-6">
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-2">
        <LoadingBlock className="h-6 w-40 rounded-full" />
        <LoadingBlock className="h-4 w-56 rounded-full" />
      </div>
      <LoadingBlock className="h-10 w-28 rounded-xl" />
    </div>

    <div className="mt-4 flex flex-wrap gap-2">
      {loadingItems(10).map((item) => (
        <LoadingBlock
          key={`skills-skeleton-${item}`}
          className={`h-9 rounded-full ${item % 4 === 0 ? "w-28" : item % 4 === 1 ? "w-24" : item % 4 === 2 ? "w-20" : "w-32"}`}
        />
      ))}
    </div>
  </Card>
);

const LoadingServicesCard = () => (
  <Card className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm md:p-6">
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-2">
        <LoadingBlock className="h-6 w-52 rounded-full" />
        <LoadingBlock className="h-4 w-64 rounded-full" />
      </div>
      <LoadingBlock className="h-10 w-24 rounded-xl" />
    </div>

    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      {loadingItems(2).map((item) => (
        <div
          key={`service-skeleton-${item}`}
          className="rounded-2xl border border-border/60 bg-background/40 p-4"
        >
          <LoadingBlock className="h-36 w-full rounded-xl" />
          <div className="mt-4 space-y-2">
            <LoadingBlock className="h-5 w-32 rounded-full" />
            <LoadingBlock className="h-4 w-4/5 rounded-full" />
            <LoadingBlock className="h-4 w-2/3 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  </Card>
);

const LoadingProjectCard = ({ index }) => (
  <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))]">
    <div className="px-3 pt-3">
      <div className="relative h-44 overflow-hidden rounded-xl sm:h-52 md:h-56">
        <LoadingBlock className="h-full w-full rounded-none" />
        <div className="absolute right-3 top-3">
          <LoadingBlock className="h-9 w-9 rounded-md" />
        </div>
      </div>
    </div>

    <div className="flex flex-1 flex-col space-y-1.5 px-3.5 pb-3 pt-3 sm:space-y-2 sm:px-4 sm:pb-4 sm:pt-3.5">
      <LoadingBlock className="h-5 w-36 rounded-full" />
      <div className="space-y-2">
        <LoadingBlock className="h-4 w-full rounded-full" />
        <LoadingBlock className="h-4 w-11/12 rounded-full" />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {loadingItems(4).map((item) => (
          <div
            key={`project-detail-skeleton-${index}-${item}`}
            className="rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2"
          >
            <LoadingBlock className="h-3 w-16 rounded-full" />
            <LoadingBlock className="mt-2 h-4 w-24 rounded-full" />
          </div>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/6 pt-3">
        <div className="flex flex-wrap gap-2">
          <LoadingBlock className="h-7 w-28 rounded-full" />
          <LoadingBlock className="h-7 w-24 rounded-full" />
        </div>
        <LoadingBlock className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  </article>
);

const LoadingCaseStudiesCard = () => (
  <Card className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm md:p-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <LoadingBlock className="h-6 w-40 rounded-full" />
        <LoadingBlock className="h-4 w-64 rounded-full" />
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto">
        <LoadingBlock className="h-10 w-36 rounded-full" />
        <LoadingBlock className="h-9 w-9 rounded-full" />
        <LoadingBlock className="h-9 w-9 rounded-full" />
      </div>
    </div>

    <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-2">
      {loadingItems(2).map((item) => (
        <LoadingProjectCard key={`case-study-skeleton-${item}`} index={item} />
      ))}
    </div>
  </Card>
);

const LoadingProfileCompletionCard = () => (
  <Card className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 shadow-sm md:p-5">
    <div className="pointer-events-none absolute -top-12 left-1/2 h-24 w-3/4 -translate-x-1/2 rounded-full opacity-[0.06] blur-2xl bg-primary/50" />

    <div className="relative pt-9">
      <div className="relative">
        <LoadingBlock className="h-2 w-full rounded-full" />
        <div className="absolute -top-8 left-[65%] z-10 flex -translate-x-1/2 flex-col items-center">
          <LoadingBlock className="h-6 w-11 rounded-lg" />
          <LoadingBlock className="-mt-1.5 h-2.5 w-2.5 rotate-45 rounded-[2px]" />
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs font-medium tracking-wide text-muted-foreground">
        <LoadingBlock className="h-3 w-8 rounded-full" />
        <LoadingBlock className="h-3 w-10 rounded-full" />
      </div>
    </div>

    <div className="mt-5 space-y-2">
      <LoadingBlock className="h-5 w-64 rounded-full" />
      <LoadingBlock className="h-5 w-56 rounded-full" />
    </div>

    <div className="mt-2 space-y-1.5">
      <LoadingBlock className="h-3 w-44 rounded-full" />
      <LoadingBlock className="h-3 w-36 rounded-full" />
    </div>

    <div className="mt-4 rounded-xl border border-border/60 bg-background/50 p-3">
      <LoadingBlock className="h-3 w-28 rounded-full" />
      <div className="mt-3 space-y-3">
        {loadingItems(4).map((item) => (
          <div key={`missing-detail-skeleton-${item}`} className="space-y-2">
            <LoadingBlock className="h-3.5 w-32 rounded-full" />
            <LoadingBlock className="h-3 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  </Card>
);

const LoadingWorkExperienceCard = () => (
  <Card className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm md:p-6">
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="space-y-2">
        <LoadingBlock className="h-6 w-48 rounded-full" />
        <LoadingBlock className="h-4 w-72 rounded-full" />
        <LoadingBlock className="h-9 w-36 rounded-xl" />
      </div>
      <LoadingBlock className="h-24 w-24 rounded-xl" />
    </div>

    <div className="mt-5 space-y-3">
      {loadingItems(2).map((item) => (
        <div
          key={`work-experience-skeleton-${item}`}
          className="rounded-xl border border-border/60 bg-background/40 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <LoadingBlock className="h-4 w-40 rounded-full" />
              <LoadingBlock className="h-3 w-28 rounded-full" />
            </div>
            <LoadingBlock className="h-7 w-7 rounded-md" />
          </div>

          <LoadingBlock className="mt-3 h-3 w-24 rounded-full" />

          <div className="mt-3 flex flex-wrap gap-2">
            <LoadingBlock className="h-6 w-20 rounded-md" />
            <LoadingBlock className="h-6 w-24 rounded-md" />
          </div>

          <div className="mt-3 space-y-2">
            <LoadingBlock className="h-3 w-full rounded-full" />
            <LoadingBlock className="h-3 w-11/12 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  </Card>
);

const LoadingEducationCard = () => (
  <Card className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm md:p-6">
    <div className="flex items-center justify-between gap-3">
      <LoadingBlock className="h-6 w-28 rounded-full" />
      <LoadingBlock className="h-9 w-28 rounded-xl" />
    </div>

    <div className="mt-4 rounded-xl border border-dashed border-border/50 bg-muted/10 p-4">
      <LoadingBlock className="h-4 w-52 rounded-full" />
      <LoadingBlock className="mt-2 h-4 w-44 rounded-full" />
    </div>
  </Card>
);

const FreelancerProfileLoadingState = ({
  headerProfile,
  notifications,
  unreadCount,
  markAllAsRead,
  onNotificationClick,
}) => (
  <FreelancerProfilePageShell
    headerProfile={headerProfile}
    notifications={notifications}
    unreadCount={unreadCount}
    markAllAsRead={markAllAsRead}
    onNotificationClick={onNotificationClick}
  >
    <div className="w-full py-6 md:py-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading profile sections.</span>

      <LoadingHeroCard />

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-5">
          <LoadingSkillsCard />
          <LoadingServicesCard />
          <LoadingCaseStudiesCard />
        </div>

        <div className="space-y-5 lg:sticky lg:top-40 lg:self-start">
          <LoadingProfileCompletionCard />
          <LoadingWorkExperienceCard />
          <LoadingEducationCard />
        </div>
      </div>
    </div>
  </FreelancerProfilePageShell>
);

export default FreelancerProfileLoadingState;
