import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import ClipboardList from "lucide-react/dist/esm/icons/clipboard-list";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import FolderKanban from "lucide-react/dist/esm/icons/folder-kanban";
import Repeat2 from "lucide-react/dist/esm/icons/repeat-2";
import ShieldAlert from "lucide-react/dist/esm/icons/shield-alert";
import Users from "lucide-react/dist/esm/icons/users";
import { useNavigate } from "react-router-dom";
import {
  DashboardPanel,
  DashboardSkeletonBlock,
} from "@/components/client/client-dashboard/shared.jsx";
import { useOptionalClientDashboardData } from "./useClientDashboardData.js";
import { formatDashboardMetricAmount } from "./dashboard-utils.js";
import { cn } from "@/shared/lib/utils";

const metricIconMap = {
  proposals: ClipboardList,
  completed: CheckCircle2,
  freelancers: Users,
  tasks: ShieldAlert,
  projects: FolderKanban,
  payments: CreditCard,
};

const fullWidthMetricIds = new Set(["pending-approvals", "payments-summary"]);

const dashboardMetricSkeletonItems = [
  { id: "active-projects", hasValueSwitch: false },
  { id: "completed-projects", hasValueSwitch: false },
  { id: "pending-approvals", hasValueSwitch: false },
  { id: "payments-summary", hasValueSwitch: true },
];

const buildDashboardMetrics = ({
  activeProjectCount,
  completedProjectCount,
  pendingProposalCount,
  paymentSummary,
}) => [
  {
    id: "active-projects",
    title: "ACTIVE PROJECTS",
    value: String(activeProjectCount || 0).padStart(2, "0"),
    iconKey: "projects",
    to: "/client/project?filter=ongoing",
  },
  {
    id: "completed-projects",
    title: "COMPLETED PROJECTS",
    value: String(completedProjectCount || 0).padStart(2, "0"),
    iconKey: "completed",
    to: "/client/project?filter=completed",
  },
  {
    id: "pending-approvals",
    title: "PENDING APPROVALS",
    value: String(pendingProposalCount || 0).padStart(2, "0"),
    iconKey: "proposals",
    to: "/client/proposal?tab=pending",
  },
  {
    id: "payments-summary",
    title: "TOTAL AMOUNT PAID",
    value: formatDashboardMetricAmount(paymentSummary?.totalPaid || 0),
    alternateTitle: "PENDING PAYMENTS",
    alternateValue: formatDashboardMetricAmount(paymentSummary?.totalPending || 0),
    hasValueSwitch: true,
    defaultMode: "alternate",
    iconKey: "payments",
    to: "/client/payments",
  },
];

const OverviewMetricCardSkeleton = memo(function OverviewMetricCardSkeleton({
  item,
}) {
  const shouldSpanFullWidth = fullWidthMetricIds.has(item.id);

  return (
    <DashboardPanel
      className={cn(
        "group relative min-h-[136px] border border-transparent bg-card px-3.5 py-4 sm:min-h-[110px] sm:p-5",
        shouldSpanFullWidth && "col-span-2 xl:col-span-1",
      )}
    >
      <div className="flex h-full flex-col items-center justify-center text-center sm:hidden">
        {item.hasValueSwitch ? (
          <div className="flex w-full items-center justify-between">
            <span className="size-10 shrink-0" aria-hidden="true" />
            <DashboardSkeletonBlock className="size-10 rounded-[16px]" />
            <DashboardSkeletonBlock className="size-10 rounded-[16px]" />
          </div>
        ) : (
          <DashboardSkeletonBlock className="size-10 rounded-[16px]" />
        )}
        <DashboardSkeletonBlock className="mt-4 h-8 w-16 rounded-full" />
        <DashboardSkeletonBlock className="mt-3 h-3 w-24 rounded-full" />
      </div>

      <div className="hidden h-full flex-col gap-2.5 sm:flex sm:gap-3">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <DashboardSkeletonBlock className="size-9 shrink-0 rounded-lg" />
            <DashboardSkeletonBlock className="h-4 w-28 rounded-full" />
          </div>
          {item.hasValueSwitch ? (
            <DashboardSkeletonBlock className="size-9 shrink-0 rounded-lg" />
          ) : null}
        </div>

        <div className="mt-auto flex flex-wrap items-end gap-x-1.5 gap-y-1 sm:gap-2">
          <DashboardSkeletonBlock className="h-8 w-16 rounded-full" />
        </div>
      </div>
    </DashboardPanel>
  );
});

const OverviewMetricCard = memo(function OverviewMetricCard({ item }) {
  const navigate = useNavigate();
  const Icon = metricIconMap[item.iconKey] || ClipboardList;
  const hasValueSwitch = Boolean(item.hasValueSwitch && item.alternateValue);
  const shouldSpanFullWidth = fullWidthMetricIds.has(item.id);
  const isInteractive = Boolean(item.to || item.onClick);
  const [showPrimaryValue, setShowPrimaryValue] = useState(
    item.defaultMode !== "alternate",
  );

  useEffect(() => {
    setShowPrimaryValue(item.defaultMode !== "alternate");
  }, [item.alternateValue, item.defaultMode, item.value]);

  const displayedTitle =
    hasValueSwitch && !showPrimaryValue
      ? item.alternateTitle || item.title
      : item.title;
  const displayedValue =
    hasValueSwitch && !showPrimaryValue ? item.alternateValue : item.value;
  const primaryToggleLabel = String(item.title || "primary value").toLowerCase();
  const alternateToggleLabel = String(
    item.alternateTitle || item.title || "alternate value",
  ).toLowerCase();

  const handleCardActivation = useCallback(() => {
    if (typeof item.onClick === "function") {
      item.onClick();
      return;
    }

    if (item.to) {
      navigate(item.to);
    }
  }, [item, navigate]);

  const handleCardKeyDown = useCallback(
    (event) => {
      if (!isInteractive) return;

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleCardActivation();
      }
    },
    [handleCardActivation, isInteractive],
  );

  const renderSwitchButton = useCallback(
    (className, iconClassName) => (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setShowPrimaryValue((current) => !current);
        }}
        onKeyDown={(event) => {
          event.stopPropagation();
        }}
        className={className}
        aria-label={
          showPrimaryValue
            ? `Show ${alternateToggleLabel}`
            : `Show ${primaryToggleLabel}`
        }
        title={
          showPrimaryValue
            ? `Switch to ${alternateToggleLabel}`
            : `Switch to ${primaryToggleLabel}`
        }
      >
        <Repeat2 className={iconClassName} />
      </button>
    ),
    [alternateToggleLabel, primaryToggleLabel, showPrimaryValue],
  );

  return (
    <DashboardPanel
      role={isInteractive ? "link" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? handleCardActivation : undefined}
      onKeyDown={isInteractive ? handleCardKeyDown : undefined}
      aria-label={
        isInteractive
          ? `Open ${String(displayedTitle || item.title).toLowerCase()}`
          : undefined
      }
      className={cn(
        "group relative min-h-[136px] border border-transparent bg-card px-3.5 py-4 transition-colors sm:min-h-[110px] sm:p-5",
        isInteractive
          ? "cursor-pointer hover:border-primary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          : "hover:border-primary/70",
        shouldSpanFullWidth && "col-span-2 xl:col-span-1",
      )}
    >
      <div className="flex h-full flex-col items-center justify-center text-center sm:hidden">
        {hasValueSwitch ? (
          <div className="flex w-full items-center justify-between">
            <span className="size-10 shrink-0 sm:size-14" aria-hidden="true" />
            <div className="flex size-10 shrink-0 items-center justify-center rounded-[16px] bg-white/[0.06] text-muted-foreground/75 sm:size-14 sm:rounded-[18px]">
              <Icon className="size-[18px] text-muted-foreground/75 sm:size-[22px]" />
            </div>
            {renderSwitchButton(
              "inline-flex size-10 shrink-0 items-center justify-center rounded-[16px] bg-white/[0.06] text-muted-foreground/75 transition-colors hover:bg-white/[0.12] hover:text-primary",
              "size-4 text-muted-foreground/75",
            )}
          </div>
        ) : (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-[16px] bg-white/[0.06] text-muted-foreground/75">
            <Icon className="size-[18px] text-muted-foreground/75" />
          </div>
        )}
        <p className="mt-4 text-[2rem] font-semibold leading-none tracking-[-0.05em] text-white transition-colors group-hover:text-primary">
          {displayedValue}
        </p>
        <p className="mt-3 text-center text-[8px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {displayedTitle}
        </p>
        {item.detail ? (
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {item.detail}
          </p>
        ) : null}
      </div>

      <div className="hidden h-full flex-col gap-2.5 sm:flex sm:gap-3">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-muted-foreground/75">
              <Icon className="size-4 text-muted-foreground/75" />
            </div>
            <p className="line-clamp-2 text-[11px] font-medium uppercase leading-4 tracking-[0.12em] text-muted-foreground">
              {displayedTitle}
            </p>
          </div>
          {hasValueSwitch
            ? renderSwitchButton(
              "inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-muted-foreground/75 transition-colors hover:bg-white/[0.12] hover:text-primary",
              "size-4 text-muted-foreground/75",
            )
            : null}
        </div>

        <div className="flex flex-wrap items-end gap-x-1.5 gap-y-1 sm:gap-2">
          <p className="text-[1.75rem] font-semibold leading-none tracking-[-0.02em] text-white transition-colors group-hover:text-primary">
            {displayedValue}
          </p>
          {item.detail ? (
            <p className="text-xs leading-4 text-muted-foreground">{item.detail}</p>
          ) : null}
        </div>
      </div>
    </DashboardPanel>
  );
});

const OverviewMetricsGrid = memo(function OverviewMetricsGrid({
  metrics,
  isLoading = false,
  className = "",
}) {
  const dashboardData = useOptionalClientDashboardData();
  const items = useMemo(() => {
    if (Array.isArray(metrics)) {
      return metrics;
    }

    if (!dashboardData) {
      return [];
    }

    return buildDashboardMetrics({
      activeProjectCount: dashboardData.activeProjectCount,
      completedProjectCount: dashboardData.completedProjectCount,
      pendingProposalCount: dashboardData.pendingProposalCount,
      paymentSummary: dashboardData.paymentSummary,
    });
  }, [dashboardData, metrics]);
  const resolvedIsLoading =
    Array.isArray(metrics) || !dashboardData ? isLoading : dashboardData.isLoading;

  return (
    <section
      className={cn(
        "mt-12 grid auto-rows-fr grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4",
        className,
      )}
    >
      {resolvedIsLoading
        ? dashboardMetricSkeletonItems.map((item) => (
          <OverviewMetricCardSkeleton
            key={`dashboard-metric-skeleton-${item.id}`}
            item={item}
          />
        ))
        : items.map((item) => (
          <OverviewMetricCard key={item.id || item.title} item={item} />
        ))}
    </section>
  );
});

export default OverviewMetricsGrid;
