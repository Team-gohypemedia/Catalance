import { useEffect, useMemo, useState } from "react";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Circle from "lucide-react/dist/esm/icons/circle";
import Clock from "lucide-react/dist/esm/icons/clock";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import Globe from "lucide-react/dist/esm/icons/globe";
import Settings from "lucide-react/dist/esm/icons/settings";
import Files from "lucide-react/dist/esm/icons/files";
import Palette from "lucide-react/dist/esm/icons/palette";
import Cloud from "lucide-react/dist/esm/icons/cloud";
import Code2 from "lucide-react/dist/esm/icons/code-2";
import Terminal from "lucide-react/dist/esm/icons/terminal";
import Database from "lucide-react/dist/esm/icons/database";
import HelpCircle from "lucide-react/dist/esm/icons/help-circle";

const getMetadataIcon = (label) => {
  const normalized = String(label || "").toLowerCase();
  if (normalized.includes("website type") || normalized.includes("type")) {
    return Globe;
  }
  if (normalized.includes("build")) {
    return Settings;
  }
  if (normalized.includes("page")) {
    return Files;
  }
  if (normalized.includes("design") || normalized.includes("style")) {
    return Palette;
  }
  if (normalized.includes("hosting")) {
    return Cloud;
  }
  if (normalized.includes("frontend") || normalized.includes("framework") || normalized.includes("tech stack")) {
    return Code2;
  }
  if (normalized.includes("backend") || normalized.includes("technology")) {
    return Terminal;
  }
  if (normalized.includes("database")) {
    return Database;
  }
  return HelpCircle;
};
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/shared/lib/utils";

const FreelancerProjectDetailMainColumn = ({
  projectDetailSnapshot,
  insetPanelClassName,
  panelClassName,
  eyebrowClassName,
  subheadingClassName,
  overallProgress,
  derivedPhases,
  derivedTasks,
  project,
  activePhase,
  tasksByPhase,
  billingRoadmap,
  getPhaseIcon,
  handleTaskClick,
}) => {
  const [expandedPhaseId, setExpandedPhaseId] = useState(() =>
    activePhase?.id != null ? String(activePhase.id) : "",
  );
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const [isFeaturesExpanded, setIsFeaturesExpanded] = useState(false);

  useEffect(() => {
    const activePhaseId =
      activePhase?.id != null ? String(activePhase.id) : "";

    setExpandedPhaseId((currentValue) => {
      const hasCurrentPhase = tasksByPhase.some(
        (phaseGroup) => String(phaseGroup.phaseId) === currentValue,
      );

      if (hasCurrentPhase) {
        return currentValue;
      }

      return activePhaseId;
    });
  }, [activePhase?.id, tasksByPhase]);

  const payoutMilestonesByPhase = useMemo(() => {
    const grouped = {};

    if (!Array.isArray(billingRoadmap)) {
      return grouped;
    }

    billingRoadmap.forEach((milestone) => {
      const phaseKey = String(milestone?.phaseOrder || "");
      if (!phaseKey) return;

      if (!Array.isArray(grouped[phaseKey])) {
        grouped[phaseKey] = [];
      }

      grouped[phaseKey].push(milestone);
    });

    return grouped;
  }, [billingRoadmap]);

  const overviewText = projectDetailSnapshot.overview || "";
  const isOverviewLong = overviewText.length > 180;
  const truncatedOverview = isOverviewLong && !isOverviewExpanded
    ? `${overviewText.slice(0, 180)}...`
    : overviewText;
 
  const featuresList = projectDetailSnapshot.featuresDeliverables || [];
  const isFeaturesLong = featuresList.length > 4;
  const visibleFeaturesList = isFeaturesLong && !isFeaturesExpanded
    ? featuresList.slice(0, 4)
    : featuresList;

  return (
    <div className="space-y-3">
      {/* Compact stat pills */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Service", value: projectDetailSnapshot.service },
          { label: "Budget", value: projectDetailSnapshot.budget },
          { label: "Timeline", value: projectDetailSnapshot.timeline },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-border bg-card px-3.5 py-3 dark:border-white/[0.08] dark:bg-[#171717]"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
            <p className="mt-1.5 truncate text-sm font-semibold text-foreground dark:text-white">
              {item.value || "—"}
            </p>
          </div>
        ))}
      </div>

      {/* Overview Card */}
      <Card className={panelClassName}>
        <CardHeader className="px-4 pb-2 pt-4">
          <CardTitle className={eyebrowClassName}>
            <span className="inline-flex items-center gap-2 align-middle">
              <span className="relative inline-flex size-[12px] shrink-0 items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-[#10b981]/10" />
                <span className="absolute inset-0 rounded-full bg-[#10b981]/20 animate-ping" />
                <span className="relative block size-[5px] rounded-full bg-[#10b981]" />
              </span>
              <span>Overview</span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-1">
          <p className="text-sm leading-6 text-muted-foreground dark:text-[#d4d4d8]">
            <span className="lg:hidden">
              {truncatedOverview ||
                "Project scope, priorities, and delivery context will appear here once the brief is structured."}
            </span>
            <span className="hidden lg:inline">
              {overviewText ||
                "Project scope, priorities, and delivery context will appear here once the brief is structured."}
            </span>
          </p>
          {isOverviewLong && (
            <button
              type="button"
              onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
              className="mt-2.5 text-xs font-semibold text-primary hover:underline lg:hidden"
            >
              {isOverviewExpanded ? "Read Less" : "Read More"}
            </button>
          )}
        </CardContent>
      </Card>
      {/* Features & Specs stacked vertically */}
      <div className="flex flex-col gap-3">
        <Card className={panelClassName}>
          <CardHeader className="px-4 pb-2 pt-4">
            <CardTitle className={eyebrowClassName}>Specifications</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-1">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {projectDetailSnapshot.websiteDetails.map((item) => {
                const IconComponent = getMetadataIcon(item.label);
                return (
                  <div
                    key={item.label}
                    className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 dark:border-white/[0.04] dark:bg-[#262626]/40 px-3 py-2.5"
                  >
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                      <IconComponent className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/60 dark:text-white/45">
                        {item.label}
                      </p>
                      <p className="text-[13px] font-semibold text-foreground dark:text-white/90 leading-snug">
                        {item.value || "—"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className={panelClassName}>
          <CardHeader className="px-4 pb-2 pt-4">
            <CardTitle className={eyebrowClassName}>Features & Deliverables</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-1">
            {featuresList.length > 0 ? (
              <div className="space-y-2">
                {/* Mobile/Tablet view */}
                <ul className="space-y-2 lg:hidden">
                  {visibleFeaturesList.map((feature, index) => (
                    <li
                      key={`feature-mob-${index}`}
                      className="flex items-start gap-2 text-sm leading-6 text-foreground/85 dark:text-[#e4e4e7]"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#ffd400]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {/* Desktop view */}
                <ul className="hidden space-y-2 lg:block">
                  {featuresList.map((feature, index) => (
                    <li
                      key={`feature-desk-${index}`}
                      className="flex items-start gap-2 text-sm leading-6 text-foreground/85 dark:text-[#e4e4e7]"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#ffd400]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
 
                {isFeaturesLong && (
                  <button
                    type="button"
                    onClick={() => setIsFeaturesExpanded(!isFeaturesExpanded)}
                    className="mt-2.5 text-xs font-semibold text-primary hover:underline lg:hidden"
                  >
                    {isFeaturesExpanded ? "Read Less" : "Read More"}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground dark:text-[#d4d4d8]">
                Feature and deliverable details will appear once the brief is structured.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Project Progress */}
      <Card className={panelClassName}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 pb-3 pt-4">
          <CardTitle className={eyebrowClassName}>Project Progress</CardTitle>
          <span className="text-sm font-bold text-primary">{overallProgress}%</span>
        </CardHeader>
        <CardContent className="space-y-4 px-4 pb-4 pt-0">
          {/* Progress bar */}
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted dark:bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>

          {/* Phase cards */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => {
              const phase = derivedPhases[index];
              const phaseValue = phase?.id != null ? String(phase.id) : "";
              const isCompleted = phase?.status === "completed";
              const isActive = phase?.status === "in-progress";
              const isPending = !isCompleted && !isActive;
              const isExpanded = phaseValue !== "" && expandedPhaseId === phaseValue;

              return (
                <button
                  type="button"
                  key={phase?.id || `phase-${index}`}
                  onClick={() => { if (!phaseValue) return; setExpandedPhaseId(phaseValue); }}
                  aria-expanded={isExpanded}
                  className={cn(
                    "relative flex w-full flex-col justify-between overflow-hidden rounded-2xl border bg-card p-3.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    isCompleted ? "border-emerald-500/30 shadow-[inset_2px_0_0_0_#10b981]" : "border-border dark:border-white/[0.08]",
                    isExpanded && "ring-1 ring-border dark:ring-white/[0.12]",
                    phaseValue ? "cursor-pointer hover:border-primary/20" : "",
                  )}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                      Phase {index + 1}
                    </div>
                    {phase?.timeline && (
                      <div className="text-[9px] uppercase font-semibold tracking-wider text-muted-foreground/60">
                        Due: {phase.timeline}
                      </div>
                    )}
                  </div>
                  <div className={`mb-3 text-[13px] font-semibold leading-tight ${
                    isPending ? "text-muted-foreground/50 dark:text-white/40" : "text-foreground dark:text-white"
                  }`}>
                    {phase?.name || "Phase"}
                  </div>
                  <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${
                    isCompleted ? "text-emerald-500" : isActive ? "text-primary" : "text-muted-foreground/40"
                  }`}>
                    {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                    {isActive ? <Clock className="h-3.5 w-3.5" /> : null}
                    {isCompleted ? "Done" : isActive ? "Active" : "Pending"}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Task breakdown card */}
      <Card className={panelClassName}>
        <CardHeader className="px-4 pb-2 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className={eyebrowClassName}>Task Breakdown</CardTitle>
            <span className="text-[11px] font-medium text-muted-foreground">
              {derivedTasks.filter((task) => task.status === "completed").length}/{derivedTasks.length} done
            </span>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-3">
          {project?.notes ? (
            <div className="mb-4 flex items-start gap-2 rounded-[18px] border border-amber-500/20 bg-amber-500/10 dark:border-primary/20 dark:bg-primary/5 px-4 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-primary animate-pulse" />
              <p className="text-sm leading-6 text-amber-800 dark:text-[#f3e4b2]">
                <span className="font-medium text-amber-950 dark:text-white">Note:</span> {project.notes}
              </p>
            </div>
          ) : null}
          <Accordion
            type="single"
            collapsible
            value={expandedPhaseId || undefined}
            onValueChange={setExpandedPhaseId}
            className="w-full"
          >
            {tasksByPhase.map((phaseGroup) => {
              const phaseMilestones =
                payoutMilestonesByPhase[String(phaseGroup.phaseId)] || [];
              const shouldShowPhaseMilestones = phaseMilestones.length > 0;

              return (
                <div key={phaseGroup.phaseId}>
                  <AccordionItem
                    value={String(phaseGroup.phaseId)}
                    className="border-border/60"
                  >
                    <AccordionTrigger className="py-3 hover:no-underline">
                      <div className="flex flex-1 items-center gap-3">
                        {getPhaseIcon(phaseGroup.phaseStatus)}
                        <div className="flex-1">
                          <div className="font-semibold text-foreground flex flex-col">
                            <span>Phase {phaseGroup.phaseId}: {phaseGroup.phaseName}</span>
                            {phaseGroup.phaseTimeline && (
                              <span className="text-xs text-muted-foreground mt-0.5 font-normal">
                                Deadline: {phaseGroup.phaseTimeline}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {
                              phaseGroup.tasks.filter(
                                (task) => task.status === "completed",
                              ).length
                            }{" "}
                            of {phaseGroup.tasks.length} completed
                          </div>
                        </div>
                        <Badge
                          variant={
                            phaseGroup.phaseStatus === "completed"
                              ? "default"
                              : "outline"
                          }
                          className={
                            phaseGroup.phaseStatus === "completed"
                              ? "bg-emerald-500 text-white"
                              : ""
                          }
                        >
                          {phaseGroup.phaseStatus === "completed"
                            ? "Completed"
                            : phaseGroup.phaseStatus === "in-progress"
                              ? "In Progress"
                              : "Pending"}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pt-2">
                        {phaseGroup.tasks.map((task) => (
                          <div
                            key={task.uniqueKey}
                            className={`flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3 transition-colors ${
                              phaseGroup.isLocked
                                ? "pointer-events-none bg-muted/50 opacity-50"
                                : "cursor-pointer hover:bg-accent/60"
                            }`}
                            onClick={(event) =>
                              !phaseGroup.isLocked &&
                              handleTaskClick(event, task.uniqueKey, task.title)
                            }
                          >
                            {task.status === "completed" ? (
                              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                            ) : task.status === "pending-review" ? (
                              <Clock className="h-5 w-5 shrink-0 text-primary" />
                            ) : (
                              <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                            )}
                            <span
                              className={`flex-1 text-sm flex flex-col ${
                                task.status === "completed"
                                  ? "line-through text-muted-foreground"
                                  : "text-foreground"
                              }`}
                            >
                              <span>
                                {task.title}
                                {phaseGroup.isLocked ? (
                                  <span className="ml-2 inline-block text-xs font-medium text-primary no-underline">
                                    (Locked)
                                  </span>
                                ) : null}
                              </span>
                              {task.timeline && (
                                <span className="text-xs text-muted-foreground mt-0.5 no-underline">
                                  Due: {task.timeline}
                                </span>
                              )}
                            </span>
                            {task.status === "pending-review" ? (
                              <Badge className="h-6 border-primary/20/20 bg-primary/10/12 px-2 text-[10px] text-primary">
                                Pending Review
                              </Badge>
                            ) : null}
                            {task.verified ? (
                              <Badge className="h-6 bg-emerald-500 px-2 text-[10px] text-white">
                                Completed
                              </Badge>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {shouldShowPhaseMilestones ? (
                    <div className="mt-4 space-y-3 border-b border-border/60 pb-4">
                      {phaseMilestones.map((milestone) => {
                        const isPaid = milestone.status === "paid";
                        const isActive = milestone.status === "active";
                        const milestoneStatusLabel = isPaid
                          ? "Paid"
                          : isActive
                            ? "Next Payout"
                            : "Upcoming";

                        return (
                          <div
                            key={`milestone-${phaseGroup.phaseId}-${milestone.id}`}
                            className={cn(
                              "rounded-xl border px-3.5 py-2 transition-colors",
                              isPaid
                                ? "border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/10"
                                : isActive
                                  ? "border-primary/30 bg-primary/5 dark:bg-primary/10"
                                  : "border-border/60 bg-muted/40 dark:bg-accent/65",
                            )}
                          >
                            <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                              <div className="flex items-start gap-2 sm:items-center">
                                <div
                                  className={cn(
                                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                                    isPaid
                                      ? "border-emerald-200 dark:border-emerald-500/30 bg-emerald-100/50 dark:bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                                      : isActive
                                        ? "border-primary/20 dark:border-primary/30 bg-primary/10 dark:bg-primary/12 text-primary"
                                        : "border-border/60 bg-background/70 text-muted-foreground",
                                  )}
                                >
                                  <CreditCard className="h-3 w-3" />
                                </div>
                                <div className="min-w-0 flex-1 space-y-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                                      Payout Milestone
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                    <p className="text-sm font-semibold leading-tight text-foreground sm:text-[15px]">
                                      {milestone.label}
                                    </p>
                                    <span className="inline-flex items-center rounded-full border border-border/50 bg-background/50 px-2 py-0 text-[10px] font-medium leading-5 text-muted-foreground">
                                      {milestone.percentage}% of project budget
                                    </span>
                                  </div>
                                  <p className="pt-0.5 text-xs leading-snug text-muted-foreground sm:text-[13px]">
                                    {milestone.note}
                                  </p>
                                </div>
                                <Badge
                                  variant={isActive ? "secondary" : "outline"}
                                  className={cn(
                                    "mt-0.5 shrink-0 self-start sm:mt-0 sm:self-center",
                                    isPaid
                                      ? "border-emerald-200 dark:border-emerald-500/40 bg-emerald-100/40 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-500"
                                      : isActive
                                        ? "border-primary/20 dark:border-primary/40 bg-primary/10 text-primary"
                                        : "border-border/60 bg-background/70 text-muted-foreground",
                                  )}
                                >
                                  {milestoneStatusLabel}
                                </Badge>
                              </div>

                              <div className="flex flex-col gap-1 sm:min-w-[118px] sm:items-end sm:border-l sm:border-border/50 sm:pl-3">
                                <div className="text-left sm:text-right">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                    Amount
                                  </p>
                                  <p className="text-base font-semibold leading-tight text-foreground sm:text-[17px]">
                                    {project?.currency || "₹"}
                                    {Number(milestone.amount || 0).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default FreelancerProjectDetailMainColumn;
