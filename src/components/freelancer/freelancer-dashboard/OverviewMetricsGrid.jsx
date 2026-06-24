import React from "react";
import {
  FreelancerDashboardPanel,
  FreelancerDashboardSkeletonBlock,
} from "./shared.jsx";
import { cn } from "@/shared/lib/utils";

const metricsGridClassName =
  "mt-6 sm:mt-5 grid auto-rows-fr grid-cols-2 gap-2.5 sm:gap-5 xl:grid-cols-4";

const freelancerMetricSkeletonItems = [
  { id: "active-projects", hasControl: false },
  { id: "completed-projects", hasControl: false },
  { id: "pending-proposals", hasControl: false },
  { id: "total-earnings", hasControl: true },
];

const FreelancerMetricCardSkeleton = ({ item }) => {
  const shouldSpanFullWidth =
    item.id === "pending-proposals" || item.id === "total-earnings";

  return (
    <FreelancerDashboardPanel
      className={cn(
        "group relative min-h-[110px] border border-transparent bg-card px-2.5 py-3 sm:min-h-[110px] sm:p-5",
      )}
    >
      <div className="flex h-full flex-col items-center justify-center text-center sm:hidden">
        {item.hasControl ? (
          <div className="flex w-full items-center justify-between">
            <span className="size-8 shrink-0" aria-hidden="true" />
            <FreelancerDashboardSkeletonBlock className="size-8 rounded-[12px]" />
            <FreelancerDashboardSkeletonBlock className="size-8 rounded-[12px]" />
          </div>
        ) : (
          <FreelancerDashboardSkeletonBlock className="size-8 rounded-[12px]" />
        )}
        <FreelancerDashboardSkeletonBlock className="mt-3 h-7 w-14 rounded-full" />
        <FreelancerDashboardSkeletonBlock className="mt-2 h-2.5 w-20 rounded-full" />
      </div>

      <div className="hidden h-full flex-col gap-2.5 sm:flex sm:gap-3">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex min-w-0 items-start gap-2 sm:items-center sm:gap-3">
            <FreelancerDashboardSkeletonBlock className="size-9 shrink-0 rounded-lg" />
            <FreelancerDashboardSkeletonBlock className="h-4 w-32 rounded-full" />
          </div>
          {item.hasControl ? (
            <FreelancerDashboardSkeletonBlock className="size-9 shrink-0 rounded-lg" />
          ) : null}
        </div>

        <div className="mt-auto flex min-w-0 items-end gap-1.5 sm:gap-2">
          <FreelancerDashboardSkeletonBlock className="h-8 w-20 rounded-full" />
        </div>
      </div>
    </FreelancerDashboardPanel>
  );
};

export const FreelancerMetricCardsSkeleton = () => (
  <section className={metricsGridClassName}>
    {freelancerMetricSkeletonItems.map((item) => (
      <FreelancerMetricCardSkeleton
        key={`freelancer-metric-skeleton-${item.id}`}
        item={item}
      />
    ))}
  </section>
);

const FreelancerMetricCard = ({
  icon: Icon,
  title,
  value,
  detail,
  onClick,
  ariaLabel,
  control,
  className = "",
}) => {
  const handleKeyDown = (event) => {
    if (typeof onClick !== "function") return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <article
      className={`group relative flex min-h-[110px] flex-col rounded-[20px] border border-transparent bg-card px-2.5 py-3 transition-colors hover:border-[var(--primary)]/70 sm:min-h-[110px] sm:p-5 ${onClick ? "cursor-pointer" : ""} ${className}`.trim()}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
    >
      {control ? (
        <div className="absolute right-2.5 top-2.5 z-20 sm:hidden">
          {control}
        </div>
      ) : null}

      <div className="flex h-full flex-col items-center justify-center text-center sm:hidden">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.06] text-muted-foreground/75 sm:size-14 sm:rounded-[18px]">
          <Icon className="size-4 text-muted-foreground/75 sm:size-[22px]" />
        </div>
        <p className="mt-3 shrink-0 text-[1.65rem] font-semibold leading-none tracking-[-0.05em] dark:text-white text-[#1C1B1F] transition-colors group-hover:text-[var(--primary)] sm:mt-6 sm:text-[3rem]">
          {value}
        </p>
        <p className="mt-2 text-center text-[7px] font-medium uppercase tracking-[0.12em] text-muted-foreground sm:mt-4 sm:text-[11px] sm:tracking-[0.2em]">
          {title}
        </p>
        {detail ? (
          <p className="mt-2 min-w-0 text-xs leading-5 text-[#6b7280]">{detail}</p>
        ) : null}
      </div>

      <div className="hidden h-full flex-col gap-2.5 sm:flex sm:gap-3">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex min-w-0 items-start gap-2 sm:items-center sm:gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-muted-foreground/75">
              <Icon className="size-4 text-muted-foreground/75" />
            </div>
            <p className="line-clamp-2 text-[11px] font-medium uppercase leading-4 tracking-[0.12em] text-muted-foreground">
              {title}
            </p>
          </div>
          {control ? <div className="shrink-0">{control}</div> : null}
        </div>

        <div className="mt-auto flex min-w-0 items-end gap-1.5 sm:gap-2">
          <p className="shrink-0 text-[1.75rem] font-semibold leading-none tracking-[-0.02em] dark:text-white text-[#1C1B1F] transition-colors group-hover:text-[var(--primary)]">
            {value}
          </p>
          {detail ? (
            <p className="min-w-0 truncate text-xs leading-4 text-[#6b7280]">
              {detail}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
};

const OverviewMetricsGrid = ({ metrics, isLoading }) => {
  if (isLoading) {
    return <FreelancerMetricCardsSkeleton />;
  }

  return (
    <section className={metricsGridClassName}>
      {metrics.map((metric) => (
        <FreelancerMetricCard key={metric.id} {...metric} />
      ))}
    </section>
  );
};

export default OverviewMetricsGrid;
