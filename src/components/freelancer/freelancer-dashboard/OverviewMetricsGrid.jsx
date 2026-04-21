import React from "react";
import {
  FreelancerDashboardPanel,
  FreelancerDashboardSkeletonBlock,
} from "./shared.jsx";
import { cn } from "@/shared/lib/utils";

const metricsGridClassName =
  "mt-6 sm:mt-5 grid auto-rows-fr grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4";

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
        "group relative min-h-[136px] border border-transparent bg-card px-3.5 py-4 sm:min-h-[110px] sm:p-5",
        shouldSpanFullWidth && "col-span-2 xl:col-span-1",
      )}
    >
      <div className="flex h-full flex-col items-center justify-center text-center sm:hidden">
        {item.hasControl ? (
          <div className="flex w-full items-center justify-between">
            <span className="size-10 shrink-0" aria-hidden="true" />
            <FreelancerDashboardSkeletonBlock className="size-10 rounded-[16px]" />
            <FreelancerDashboardSkeletonBlock className="size-10 rounded-[16px]" />
          </div>
        ) : (
          <FreelancerDashboardSkeletonBlock className="size-10 rounded-[16px]" />
        )}
        <FreelancerDashboardSkeletonBlock className="mt-4 h-8 w-16 rounded-full" />
        <FreelancerDashboardSkeletonBlock className="mt-3 h-3 w-24 rounded-full" />
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
      className={`group relative flex min-h-[136px] flex-col rounded-[24px] border border-transparent bg-card px-3.5 py-4 transition-colors hover:border-[#facc15]/70 sm:min-h-[110px] sm:p-5 ${onClick ? "cursor-pointer" : ""} ${className}`.trim()}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
    >
      <div className="flex h-full flex-col items-center justify-center text-center sm:hidden">
        {control ? (
          <div className="flex w-full items-center justify-between">
            <span className="size-10 shrink-0 sm:size-14" aria-hidden="true" />
            <div className="flex size-10 shrink-0 items-center justify-center rounded-[16px] bg-white/[0.06] text-muted-foreground/75 sm:size-14 sm:rounded-[18px]">
              <Icon className="size-[18px] text-muted-foreground/75 sm:size-[22px]" />
            </div>
            <div className="shrink-0">{control}</div>
          </div>
        ) : (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-[16px] bg-white/[0.06] text-muted-foreground/75 sm:size-14 sm:rounded-[18px]">
            <Icon className="size-[18px] text-muted-foreground/75 sm:size-[22px]" />
          </div>
        )}
        <p className="mt-4 shrink-0 text-[2rem] font-semibold leading-none tracking-[-0.05em] text-white transition-colors group-hover:text-[#facc15] sm:mt-6 sm:text-[3rem]">
          {value}
        </p>
        <p className="mt-3 text-center text-[8px] font-medium uppercase tracking-[0.14em] text-muted-foreground sm:mt-4 sm:text-[11px] sm:tracking-[0.2em]">
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
          <p className="shrink-0 text-[1.75rem] font-semibold leading-none tracking-[-0.02em] text-white transition-colors group-hover:text-[#facc15]">
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
