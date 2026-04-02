import { useEffect, useMemo, useState } from "react";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Circle from "lucide-react/dist/esm/icons/circle";
import Clock from "lucide-react/dist/esm/icons/clock";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
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

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Service Type", value: projectDetailSnapshot.service },
          { label: "Budget", value: projectDetailSnapshot.budget },
          { label: "Timeline", value: projectDetailSnapshot.timeline },
        ].map((item) => (
          <div
            key={item.label}
            className={`${insetPanelClassName} min-w-0 bg-[#171717]`}
          >
            <p className={eyebrowClassName}>{item.label}</p>
            <p className="mt-3 break-words text-sm font-semibold tracking-[-0.02em] text-white sm:text-[15px]">
              {item.value || "Not specified"}
            </p>
          </div>
        ))}
      </div>

      <Card className={panelClassName}>
        <CardHeader className="pb-3">
          <CardTitle className={eyebrowClassName}>
            <span className="inline-flex items-center gap-2 align-middle">
              <span className="relative inline-flex size-[15px] shrink-0 items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-[#10b981]/10" />
                <span className="absolute inset-0 rounded-full bg-[#10b981]/20 animate-ping" />
                <span className="relative block size-[6px] rounded-full bg-[#10b981]" />
              </span>
              <span>Overview</span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="px-2 py-1">
            <p className="text-justify text-sm leading-7 text-[#d4d4d8]">
              {projectDetailSnapshot.overview ||
                "Project scope, priorities, and delivery context will appear here once the brief is fully structured."}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Card className={panelClassName}>
          <CardHeader className="px-4 pb-3 pt-4 sm:px-6 sm:pt-5">
            <CardTitle className={eyebrowClassName}>Features</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {projectDetailSnapshot.featuresDeliverables.length > 0 ? (
              <ul className="space-y-5 px-2 pb-2 sm:px-2">
                {projectDetailSnapshot.featuresDeliverables.map((feature, index) => (
                  <li
                    key={`feature-${index}`}
                    className="flex items-start gap-3 text-sm leading-7 text-[#e4e4e7]"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#ffd400]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-2 pb-1 text-sm leading-7 text-[#d4d4d8]">
                Feature and deliverable details will appear once the brief is
                structured.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className={panelClassName}>
          <CardHeader className="px-4 pb-3 pt-4 sm:px-6 sm:pt-5">
            <CardTitle className={eyebrowClassName}>Website Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-4 pb-4 pt-1 sm:px-6 sm:pb-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {projectDetailSnapshot.websiteDetails.map((item) => (
                <div
                  key={item.label}
                  className="min-h-[98px] rounded-[12px] bg-[#262626] px-4 py-4"
                >
                  <p className="text-[0.66rem] font-medium uppercase tracking-[0.15em] text-white/45">
                    {item.label}
                  </p>
                  <p className="mt-5 break-words text-[1.05rem] font-semibold leading-6 text-white sm:text-[1.08rem]">
                    {item.value || "Not specified"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className={panelClassName}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 pt-5 px-6">
          <CardTitle className={eyebrowClassName}>Project Progress</CardTitle>
          <span className="text-[1.1rem] font-semibold text-yellow-400">
            {Math.round(overallProgress)}% Complete
          </span>
        </CardHeader>
        <CardContent className="space-y-8 px-6 pb-6 pt-0">
          <div className="relative pt-2">
            <div className="h-[6px] w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-yellow-400 transition-all duration-300"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <div
              className="absolute top-1/2 h-3.5 w-3.5 -translate-y-[calc(50%-4px)] rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-300"
              style={{ left: `calc(${overallProgress}% - 7px)` }}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                  onClick={() => {
                    if (!phaseValue) return;
                    setExpandedPhaseId(phaseValue);
                  }}
                  aria-expanded={isExpanded}
                  className={`relative flex w-full flex-col justify-between overflow-hidden rounded-[20px] border border-white/[0.08] bg-card p-5 transition-all ${
                    phaseValue
                      ? isExpanded
                        ? "cursor-pointer border-white/[0.14] text-left ring-1 ring-white/[0.10] hover:border-white/[0.14] hover:ring-white/[0.10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-0"
                        : "cursor-pointer text-left hover:border-white/[0.14] hover:ring-1 hover:ring-white/[0.10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-0"
                      : "text-left"
                  } ${isCompleted ? "shadow-[inset_2px_0_0_0_#10b981]" : ""}`}
                >
                  <div>
                    <div
                      className={`mb-2 text-[0.68rem] font-bold uppercase tracking-[0.15em] ${
                        isPending
                          ? "text-muted-foreground/50"
                          : "text-muted-foreground"
                      }`}
                    >
                      Phase {index + 1}
                    </div>
                    <div
                      className={`mb-4 text-[15px] font-semibold leading-[1.4] ${
                        isPending ? "text-white/40" : "text-white/95"
                      }`}
                    >
                      {phase?.name || "Phase"}
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-2 text-[13px] font-semibold ${
                      isCompleted
                        ? "text-emerald-500"
                        : isActive
                          ? "text-[#f59e0b]"
                          : "text-muted-foreground/40"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : null}
                    {isActive ? <Clock className="h-4 w-4" /> : null}
                    {isCompleted
                      ? "Completed"
                      : isActive
                        ? "In progress"
                        : "Pending"}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className={panelClassName}>
        <CardHeader className="pb-3">
          <CardTitle className={eyebrowClassName}>Project Description</CardTitle>
          <CardDescription className={subheadingClassName}>
            {derivedTasks.filter((task) => task.status === "completed").length} of{" "}
            {derivedTasks.length} tasks completed
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {project?.notes ? (
            <div className="mb-4 flex items-start gap-2 rounded-[18px] border border-amber-500/20 bg-amber-500/8 px-4 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
              <p className="text-sm leading-6 text-[#f3e4b2]">
                <span className="font-medium text-white">Note:</span> {project.notes}
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
                        <div className="flex-1 text-left">
                          <div className="text-sm font-semibold text-foreground">
                            Phase {phaseGroup.phaseId}: {phaseGroup.phaseName}
                          </div>
                          <div className="text-xs text-muted-foreground">
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
                              <Clock className="h-5 w-5 shrink-0 text-amber-400" />
                            ) : (
                              <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                            )}
                            <span
                              className={`flex-1 text-sm ${
                                task.status === "completed"
                                  ? "line-through text-muted-foreground"
                                  : "text-foreground"
                              }`}
                            >
                              {task.title}
                              {phaseGroup.isLocked ? (
                                <span className="ml-2 inline-block text-xs font-medium text-amber-500 no-underline">
                                  (Locked)
                                </span>
                              ) : null}
                            </span>
                            {task.status === "pending-review" ? (
                              <Badge className="h-6 border-amber-500/20 bg-amber-500/12 px-2 text-[10px] text-amber-300">
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
                                ? "border-emerald-500/30 bg-emerald-500/10"
                                : isActive
                                  ? "border-primary/30 bg-primary/10"
                                  : "border-border/60 bg-accent/65",
                            )}
                          >
                            <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                              <div className="flex items-start gap-2 sm:items-center">
                                <div
                                  className={cn(
                                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                                    isPaid
                                      ? "border-emerald-500/30 bg-emerald-500/12 text-emerald-400"
                                      : isActive
                                        ? "border-primary/30 bg-primary/12 text-primary"
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
                                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                                      : isActive
                                        ? "border-primary/40 bg-primary/10 text-primary"
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
