import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Filter from "lucide-react/dist/esm/icons/filter";
import Search from "lucide-react/dist/esm/icons/search";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import Check from "lucide-react/dist/esm/icons/check";
import X from "lucide-react/dist/esm/icons/x";
import LayoutGrid from "lucide-react/dist/esm/icons/layout-grid";
import List from "lucide-react/dist/esm/icons/list";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";

import { useAuth } from "@/shared/context/AuthContext";
import { PmShell } from "@/modules/project-manager/components/PmShell";
import { pmApi } from "@/modules/project-manager/services/pm-api";
import { useAsyncResource } from "@/modules/project-manager/hooks/use-async-resource";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/shared/lib/utils";

const toTaskKeySet = (value) => {
  if (Array.isArray(value)) {
    return new Set(value.map((item) => String(item || "").trim()).filter(Boolean));
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return new Set(parsed.map((item) => String(item || "").trim()).filter(Boolean));
      }
    } catch {
      return new Set();
    }
  }

  return new Set();
};

const hasPhaseOneProgress = (project) => {
  const completedTasks = toTaskKeySet(project?.completedTasks);
  if (completedTasks.size > 0) return true;

  const approvedPhases = new Set(
    (Array.isArray(project?.milestoneApprovals) ? project.milestoneApprovals : [])
      .map((item) => Number(item?.phase))
      .filter(Number.isFinite)
  );

  return approvedPhases.has(2) || approvedPhases.has(3) || approvedPhases.has(4);
};

const deriveProjectStatus = (project) => {
  const hasIssue = Array.isArray(project?.disputes)
    ? project.disputes.some((item) => String(item.status || "").toUpperCase() !== "RESOLVED")
    : false;
  if (hasIssue) return "Issue Raised";

  if (project?.displayStatus) return project.displayStatus;

  const approvedPhases = new Set(
    (Array.isArray(project?.milestoneApprovals) ? project.milestoneApprovals : [])
      .map((item) => Number(item?.phase))
      .filter(Number.isFinite)
  );
  const completedPhases = [
    hasPhaseOneProgress(project),
    approvedPhases.has(2),
    approvedPhases.has(3),
    approvedPhases.has(4),
  ].filter(Boolean).length;

  const rawStatus = String(project?.status || "").toUpperCase();
  if (rawStatus === "DRAFT") return "Proposal";
  if (completedPhases >= 4) return "Completed";
  if (rawStatus === "IN_PROGRESS" || completedPhases > 0) return "In Progress";
  return "Started";
};

const ACTIVE_PROJECT_STATUSES = new Set(["Started", "In Progress"]);

const normalizeStatusFilter = (value) => {
  const allowed = new Set(["ALL", "Started", "In Progress", "Completed", "Issue Raised", "Proposal"]);
  return allowed.has(value) ? value : "ALL";
};

const normalizeAssignmentFilter = (value) => {
  const allowed = new Set(["ALL", "ASSIGNED", "UNASSIGNED"]);
  return allowed.has(value) ? value : "ALL";
};

const normalizeSyncFilter = (value) => {
  const allowed = new Set(["ALL", "LAST_7_DAYS", "LAST_30_DAYS"]);
  return allowed.has(value) ? value : "ALL";
};

const normalizePresetFilter = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  return normalized === "ACTIVE" || normalized === "ISSUES" ? normalized : "ALL";
};

const mapProjectRow = (project) => {
  const proposalRows = Array.isArray(project?.proposals) ? project.proposals : [];
  const freelancer = (
    proposalRows.find(
      (proposal) =>
        String(proposal?.status || "").toUpperCase() === "ACCEPTED" &&
        proposal?.freelancer
    ) ||
    proposalRows.find(
      (proposal) =>
        String(proposal?.status || "").toUpperCase() === "REPLACED" &&
        proposal?.freelancer
    ) ||
    proposalRows.find((proposal) => proposal?.freelancer)
  )?.freelancer;

  return {
    id: project.id,
    title: project.title,
    clientName: project?.owner?.fullName || "Unknown Client",
    freelancerName: freelancer?.fullName || "Unassigned",
    status: deriveProjectStatus(project),
    budget: Number(project?.budget || 0),
    updatedAt: project?.updatedAt || project?.createdAt,
  };
};

const getInitials = (value = "") => {
  const parts = String(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const statusFilterLabels = {
  ALL: "All Status",
  Started: "Started",
  "In Progress": "In Progress",
  Completed: "Completed",
  "Issue Raised": "Issue Raised",
  Proposal: "Proposal",
};

const assignmentFilterLabels = {
  ALL: "All Assignment",
  ASSIGNED: "Assigned Freelancer",
  UNASSIGNED: "Unassigned Freelancer",
};

const syncFilterLabels = {
  ALL: "Any Sync Date",
  LAST_7_DAYS: "Synced in 7 days",
  LAST_30_DAYS: "Synced in 30 days",
};

const ProjectCardGridItem = ({ row, onOpen }) => {
  const isLive = row.status === "In Progress" || row.status === "Started";
  const isIssue = row.status === "Issue Raised";
  const isCompleted = row.status === "Completed";

  const statusToneClass = isCompleted
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    : isIssue
    ? "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400"
    : isLive
    ? "border-primary/25 bg-primary/10 text-primary"
    : "border-border bg-muted text-muted-foreground";

  return (
    <article className="group flex w-full flex-col justify-between rounded-[28px] border border-border bg-card p-5 sm:p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground/80">
            Workspace
          </span>
          <span
            className={cn(
              "inline-flex h-6.5 items-center gap-1.5 shrink-0 rounded-full border px-2.5 text-[9px] font-bold uppercase tracking-[0.12em]",
              statusToneClass
            )}
          >
            {isLive && <span className="size-1.5 shrink-0 rounded-full bg-primary animate-pulse" />}
            {isIssue && <span className="size-1.5 shrink-0 rounded-full bg-rose-500 animate-pulse" />}
            {row.status}
          </span>
        </div>

        <h3
          className="mt-3 text-lg font-semibold tracking-[-0.03em] text-foreground truncate group-hover:text-primary transition-colors"
          title={row.title}
        >
          {row.title}
        </h3>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Avatar className="size-7.5 shrink-0 border border-border">
              <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-bold">
                {getInitials(row.clientName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground/80 leading-none">
                Client
              </span>
              <p className="text-xs font-semibold text-foreground truncate leading-tight mt-0.5" title={row.clientName}>
                {row.clientName}
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-border/60 shrink-0" />

          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Avatar className="size-7.5 shrink-0 border border-border">
              <AvatarFallback className="bg-muted text-muted-foreground text-[9px] font-bold">
                {getInitials(row.freelancerName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground/80 leading-none">
                Freelancer
              </span>
              <p className="text-xs font-semibold text-foreground truncate leading-tight mt-0.5" title={row.freelancerName}>
                {row.freelancerName}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-border/60" />

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground/80">
              Budget
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground truncate">
              INR {row.budget.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground/80">
              Last Sync
            </p>
            <p className="mt-1 text-xs font-medium text-foreground truncate">
              {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : "Pending"}
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onOpen(row.id)}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-xs sm:text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
      >
        <span>Open Project</span>
        <ArrowRight className="size-4" />
      </button>
    </article>
  );
};

const ProjectCardListItem = ({ row, onOpen }) => {
  const isLive = row.status === "In Progress" || row.status === "Started";
  const isIssue = row.status === "Issue Raised";
  const isCompleted = row.status === "Completed";

  const statusToneClass = isCompleted
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    : isIssue
    ? "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400"
    : isLive
    ? "border-primary/25 bg-primary/10 text-primary"
    : "border-border bg-muted text-muted-foreground";

  return (
    <div className="group flex flex-col md:flex-row md:items-center justify-between gap-5 p-5 sm:p-6 rounded-[28px] border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
      <div className="flex items-center gap-4 min-w-0">
        <Avatar className="size-12 shrink-0 border border-border">
          <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
            {getInitials(row.title)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 space-y-1">
          <h3
            className="text-base font-semibold text-foreground truncate group-hover:text-primary transition-colors"
            title={row.title}
          >
            {row.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Client: <strong className="font-semibold text-foreground">{row.clientName}</strong></span>
            <span>•</span>
            <span>Freelancer: <strong className="font-semibold text-foreground">{row.freelancerName}</strong></span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between md:justify-end gap-6 sm:gap-8 border-t md:border-t-0 border-border/60 pt-4 md:pt-0">
        <div className="space-y-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground/80">
            Status
          </p>
          <span
            className={cn(
              "inline-flex h-6.5 items-center gap-1.5 rounded-full border px-2.5 text-[9px] font-bold uppercase tracking-[0.12em]",
              statusToneClass
            )}
          >
            {isLive && <span className="size-1.5 shrink-0 rounded-full bg-primary animate-pulse" />}
            {isIssue && <span className="size-1.5 shrink-0 rounded-full bg-rose-500 animate-pulse" />}
            {row.status}
          </span>
        </div>

        <div className="space-y-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground/80">
            Budget
          </p>
          <p className="text-sm font-semibold text-foreground">
            INR {row.budget.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground/80">
            Last Sync
          </p>
          <p className="text-xs font-medium text-muted-foreground">
            {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : "Pending"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpen(row.id)}
          className="flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs shrink-0 cursor-pointer"
        >
          <span>Open Project</span>
          <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
};

const ProjectCardSkeletonItem = () => (
  <div className="rounded-[28px] border border-border bg-card p-5 sm:p-6 space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-20 rounded-full" />
      <Skeleton className="h-6 w-24 rounded-full" />
    </div>
    <Skeleton className="h-6 w-3/4 rounded-md mt-2" />
    <div className="flex items-center gap-3 mt-4">
      <Skeleton className="size-9 rounded-full shrink-0" />
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-3.5 w-32 rounded-md" />
        <Skeleton className="h-3 w-24 rounded-md" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3 mt-4">
      <Skeleton className="h-16 rounded-2xl" />
    <Skeleton className="h-16 rounded-2xl" />
    </div>
    <Skeleton className="h-11 w-full rounded-full mt-6" />
  </div>
);

const ProjectsPage = () => {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [assignmentFilter, setAssignmentFilter] = useState("ALL");
  const [presetFilter, setPresetFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("grid");

  const { data, loading } = useAsyncResource(
    () => pmApi.getProjects(authFetch),
    [authFetch]
  );

  const rows = useMemo(
    () => (Array.isArray(data) ? data : []).map((project) => mapProjectRow(project)),
    [data]
  );

  useEffect(() => {
    setStatusFilter(normalizeStatusFilter(searchParams.get("status")));
    setAssignmentFilter(normalizeAssignmentFilter(searchParams.get("assignment")));
    setPresetFilter(normalizePresetFilter(searchParams.get("preset")));
  }, [searchParams]);

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        if (presetFilter === "ACTIVE" && !ACTIVE_PROJECT_STATUSES.has(row.status)) return false;
        if (presetFilter === "ISSUES" && row.status !== "Issue Raised") return false;
        if (statusFilter !== "ALL" && row.status !== statusFilter) return false;

        if (assignmentFilter === "ASSIGNED" && row.freelancerName === "Unassigned") return false;
        if (assignmentFilter === "UNASSIGNED" && row.freelancerName !== "Unassigned") return false;

        return true;
      }),
    [rows, presetFilter, statusFilter, assignmentFilter]
  );

  const hasActiveFilters =
    statusFilter !== "ALL" ||
    assignmentFilter !== "ALL" ||
    presetFilter !== "ALL";

  const handleResetFilters = useCallback(() => {
    setStatusFilter("ALL");
    setAssignmentFilter("ALL");
    setPresetFilter("ALL");
    navigate("/project-manager/projects");
  }, [navigate]);

  const handleSelectPreset = useCallback((presetKey) => {
    setPresetFilter(presetKey);
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      if (presetKey === "ALL") {
        nextParams.delete("preset");
      } else {
        nextParams.set("preset", presetKey.toLowerCase());
      }
      return nextParams;
    });
  }, [setSearchParams]);

  const handleOpenProject = useCallback((id) => {
    navigate(`/project-manager/projects/${id}`);
  }, [navigate]);

  const presetOptions = [
    { key: "ALL", label: "All Projects" },
    { key: "ACTIVE", label: "Active Projects" },
    { key: "ISSUES", label: "Issue Queue" },
  ];

  return (
    <PmShell
      title="Project Master List"
      subtitle="Comprehensive view of all active and historical project workspaces under your management."
    >
      <section className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex h-auto w-full max-w-[28rem] flex-nowrap items-stretch gap-1 rounded-[32px] border border-border bg-card p-1 shadow-xs sm:w-auto sm:max-w-none sm:gap-1.5 sm:p-1.5">
          {presetOptions.map((option) => {
            const isActive = presetFilter === option.key;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => handleSelectPreset(option.key)}
                className={cn(
                  "h-10 min-w-0 basis-0 flex-1 whitespace-nowrap rounded-full border border-transparent px-3 text-center text-xs font-semibold transition sm:h-11 sm:basis-auto sm:flex-none sm:px-5 sm:text-sm cursor-pointer",
                  isActive
                    ? "border-primary/70 bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5 sm:gap-3 w-full lg:w-auto">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-primary px-3 py-2 text-xs sm:text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-colors cursor-pointer shrink-0">
                <Filter className="size-3.5 shrink-0" />
                <span className="max-w-[130px] truncate">
                  {statusFilterLabels[statusFilter] || "All Status"}
                </span>
                <ChevronDown className="size-3.5 opacity-80 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-2xl border border-border bg-card p-1.5 shadow-md">
              {Object.entries(statusFilterLabels).map(([key, label]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={cn(
                    "cursor-pointer rounded-xl flex items-center justify-between px-3 py-2 text-sm",
                    statusFilter === key && "bg-muted font-medium"
                  )}
                >
                  <span className="truncate">{label}</span>
                  {statusFilter === key && <Check className="size-4 opacity-70 shrink-0 ml-2" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-primary px-3 py-2 text-xs sm:text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-colors cursor-pointer shrink-0">
                <Filter className="size-3.5 shrink-0" />
                <span className="max-w-[150px] truncate">
                  {assignmentFilterLabels[assignmentFilter] || "All Assignment"}
                </span>
                <ChevronDown className="size-3.5 opacity-80 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl border border-border bg-card p-1.5 shadow-md">
              {Object.entries(assignmentFilterLabels).map(([key, label]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => setAssignmentFilter(key)}
                  className={cn(
                    "cursor-pointer rounded-xl flex items-center justify-between px-3 py-2 text-sm",
                    assignmentFilter === key && "bg-muted font-medium"
                  )}
                >
                  <span className="truncate">{label}</span>
                  {assignmentFilter === key && <Check className="size-4 opacity-70 shrink-0 ml-2" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center justify-center size-9 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
              title="Reset all filters"
            >
              <X className="size-4" />
            </button>
          )}

          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/80 px-3 py-1.5 text-xs font-semibold text-foreground border border-border shrink-0">
            <span>Total:</span>
            <Badge className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {rows.length}
            </Badge>
          </span>

          <div className="flex items-center rounded-full border border-border bg-card p-1 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex size-8 items-center justify-center rounded-full transition-colors cursor-pointer",
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Grid View"
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "flex size-8 items-center justify-center rounded-full transition-colors cursor-pointer",
                viewMode === "list"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="List View"
            >
              <List className="size-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="mt-8">
        {loading ? (
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
                : "space-y-4"
            )}
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <ProjectCardSkeletonItem key={index} />
            ))}
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="rounded-[28px] border border-border bg-card p-12 text-center my-6">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Search className="size-7 opacity-70" />
            </div>
            <h2 className="mt-6 text-xl font-semibold tracking-[-0.03em] text-foreground">
              No matching projects found
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              No active or historical projects matched your selected filter criteria. Try resetting your search filters.
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="mt-6 rounded-full border-border bg-background px-6 py-2.5 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredRows.map((row) => (
              <ProjectCardGridItem key={row.id} row={row} onOpen={handleOpenProject} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRows.map((row) => (
              <ProjectCardListItem key={row.id} row={row} onOpen={handleOpenProject} />
            ))}
          </div>
        )}
      </section>
    </PmShell>
  );
};

export default ProjectsPage;
