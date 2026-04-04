import { useEffect, useState } from "react";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Circle from "lucide-react/dist/esm/icons/circle";
import Clock from "lucide-react/dist/esm/icons/clock";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/shared/lib/utils";

const ClientProjectDetailMainColumn = ({
  projectDetailSnapshot,
  insetPanelClassName,
  panelClassName,
  eyebrowClassName,
  subheadingClassName,
  overallProgress,
  derivedPhases,
  derivedTasks,
  canMarkProjectCompleted,
  showLegacyCompletionPrompt,
  showProjectCompletionMilestone,
  projectCompletionMilestonePhaseId,
  handleMarkProjectCompleted,
  isCompletingProject,
  isInitialPaymentDue,
  dueInstallment,
  handlePayDueInstallment,
  isProcessingInstallment,
  isInitialPaymentPaid,
  initialInstallment,
  currentActivePhase,
  tasksByPhase,
  phaseGateInstallmentsByPhase,
  getPhaseIcon,
  isProjectCompleted,
  handleTaskClick,
  verifyingTaskIds,
  promptVerifyTask,
  formatINR,
}) => {
  const [expandedPhaseId, setExpandedPhaseId] = useState(() =>
    currentActivePhase?.id != null ? String(currentActivePhase.id) : "",
  );

  useEffect(() => {
    const activePhaseId =
      currentActivePhase?.id != null ? String(currentActivePhase.id) : "";

    setExpandedPhaseId((currentValue) => {
      const hasCurrentPhase = tasksByPhase.some(
        (phaseGroup) => String(phaseGroup.phaseId) === currentValue,
      );

      if (hasCurrentPhase) {
        return currentValue;
      }

      return activePhaseId;
    });
  }, [currentActivePhase?.id, tasksByPhase]);

  return (
    <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
          {projectDetailSnapshot.deliverablesItems.length > 0 ? (
            <ul className="space-y-5 px-2 pb-2 sm:px-2">
              {projectDetailSnapshot.deliverablesItems.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm leading-7 text-[#e4e4e7]"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#ffd400]" />
                  <span>{item}</span>
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
            {projectDetailSnapshot.websiteDetails
              .filter((item) => {
                if (!projectDetailSnapshot.deliverablesItems.length) return true;
                const normalizedLabel = item.label.toLowerCase();
                return ![
                  "deliverables",
                  "features/deliverables included",
                  "pages & features",
                ].includes(normalizedLabel);
              })
              .map((item) => (
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
                className={cn(
                  "relative flex w-full flex-col justify-between overflow-hidden rounded-[20px] border border-white/[0.08] bg-card p-5 text-left transition-all",
                  phaseValue
                    ? isExpanded
                      ? "cursor-pointer border-white/[0.14] ring-1 ring-white/[0.10] hover:border-white/[0.14] hover:ring-white/[0.10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-0"
                      : "cursor-pointer hover:border-white/[0.14] hover:ring-1 hover:ring-white/[0.10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-0"
                    : "",
                  isCompleted ? "shadow-[inset_2px_0_0_0_#10b981]" : "",
                )}
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
        <CardTitle className={eyebrowClassName}>Project Tasks</CardTitle>
        <CardDescription className={subheadingClassName}>
          {derivedTasks.filter((task) => task.verified).length} of{" "}
          {derivedTasks.length} tasks verified
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {showLegacyCompletionPrompt ? (
          <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
                  Final Step
                </p>
                <p className="mt-1 text-sm text-foreground">
                  All phases are verified. Mark this project as completed to lock
                  further changes.
                </p>
              </div>
              <Button
                size="sm"
                className="h-8 px-3 sm:self-end"
                onClick={handleMarkProjectCompleted}
                disabled={isCompletingProject}
              >
                {isCompletingProject ? (
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                )}
                {isCompletingProject ? "Saving" : "Mark Project Completed"}
              </Button>
            </div>
          </div>
        ) : null}

        {isInitialPaymentDue ? (
          <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-400">
                  Payment Required Before Phase 1
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {dueInstallment?.label || "Initial project payment"} is due to
                  unlock Phase 1 tasks.
                </p>
              </div>
              <Button
                size="sm"
                onClick={handlePayDueInstallment}
                disabled={isProcessingInstallment}
                className="h-8 px-3 sm:self-end"
              >
                {isProcessingInstallment ? (
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CreditCard className="mr-1 h-3.5 w-3.5" />
                )}
                {isProcessingInstallment
                  ? "Processing"
                  : `Pay ${dueInstallment?.percentage || ""}%`}
              </Button>
            </div>
          </div>
        ) : null}

        {isInitialPaymentPaid ? (
          <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
                  Initial Payment Confirmed
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {initialInstallment?.label || "Initial 20% payment"} is
                  completed. Phase 1 is unlocked.
                </p>
              </div>
            </div>
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
            const phaseInstallments =
              phaseGateInstallmentsByPhase[String(phaseGroup.phaseId)] || [];
            const shouldShowPhaseMilestones =
              phaseGroup.phaseStatus === "completed" &&
              phaseInstallments.length > 0;
            const shouldShowProjectCompletionPrompt =
              showProjectCompletionMilestone &&
              String(projectCompletionMilestonePhaseId) ===
                String(phaseGroup.phaseId);
            const shouldShowPhaseFooter =
              shouldShowPhaseMilestones || shouldShowProjectCompletionPrompt;

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
                            phaseGroup.tasks.filter((task) => task.verified)
                              .length
                          }{" "}
                          of {phaseGroup.tasks.length} verified
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
                      {phaseGroup.tasks.map((task) => {
                        const isTaskVerificationPending =
                          verifyingTaskIds.has(task.uniqueKey);

                        return (
                          <div
                            key={task.uniqueKey}
                            className={`flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3 transition-colors ${
                              phaseGroup.isLocked || isProjectCompleted
                                ? "pointer-events-none bg-muted/50 opacity-50"
                                : "cursor-pointer hover:bg-accent/60"
                            }`}
                            onClick={(event) =>
                              !phaseGroup.isLocked &&
                              !isProjectCompleted &&
                              handleTaskClick(event, task.uniqueKey)
                            }
                          >
                            {task.status === "completed" ? (
                              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
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
                                  {phaseGroup.isPaymentLocked
                                    ? "(Payment required)"
                                    : phaseGroup.isHistoricalLock
                                      ? "(Locked after next phase started)"
                                      : "(Locked)"}
                                </span>
                              ) : null}
                            </span>
                            {task.status === "completed" ? (
                              <Button
                                size="sm"
                                variant={task.verified ? "default" : "outline"}
                                disabled={
                                  phaseGroup.isLocked ||
                                  isProjectCompleted ||
                                  isTaskVerificationPending
                                }
                                className={`h-7 px-3 text-xs transition-all ${
                                  task.verified
                                    ? "border-transparent bg-emerald-500 text-white hover:bg-emerald-600"
                                    : "border-primary text-primary hover:bg-primary/10"
                                }`}
                                onClick={(event) =>
                                  !phaseGroup.isLocked &&
                                  promptVerifyTask(
                                    event,
                                    task.uniqueKey,
                                    task.title,
                                    task.verified,
                                  )
                                }
                              >
                                {isTaskVerificationPending ? (
                                  <>
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    Saving
                                  </>
                                ) : task.verified ? (
                                  "Verified"
                                ) : (
                                  "Verify"
                                )}
                              </Button>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {shouldShowPhaseFooter ? (
                  <div className="mt-4 space-y-3 border-b border-border/60 pb-4">
                    {shouldShowPhaseMilestones
                      ? phaseInstallments.map((installment) => {
                      const isDueNow = Boolean(installment?.isDue);
                      const isPaid = Boolean(installment?.isPaid);
                      const canPayInstallment =
                        isDueNow &&
                        dueInstallment?.sequence === installment.sequence;
                      const milestoneStatusLabel = isPaid
                        ? "Paid"
                        : isDueNow
                          ? "Due now"
                          : "Scheduled";

                      return (
                        <div
                          key={`installment-${phaseGroup.phaseId}-${installment.sequence}`}
                          className={cn(
                            "rounded-xl border px-3.5 py-2 transition-colors",
                            isPaid
                              ? "border-emerald-500/30 bg-emerald-500/10"
                              : isDueNow
                                ? "border-emerald-500/30 bg-accent/90"
                                : "border-border/60 bg-accent/65",
                          )}
                        >
                          <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                            <div className="flex items-start gap-2 sm:items-center">
                              <div
                                className={cn(
                                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                                  isPaid || isDueNow
                                    ? "border-emerald-500/30 bg-emerald-500/12 text-emerald-400"
                                    : "border-border/60 bg-background/70 text-muted-foreground",
                                )}
                              >
                                <CreditCard className="h-3 w-3" />
                              </div>
                              <div className="min-w-0 flex-1 space-y-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                                    Payment Milestone
                                  </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                  <p className="text-sm font-semibold leading-tight text-foreground sm:text-[15px]">
                                    {installment.label}
                                  </p>
                                  <span className="inline-flex items-center rounded-full border border-border/50 bg-background/50 px-2 py-0 text-[10px] font-medium leading-5 text-muted-foreground">
                                    {installment.percentage}% of project budget
                                  </span>
                                </div>
                                <p className="pt-0.5 text-xs leading-snug text-muted-foreground sm:text-[13px]">
                                  {installment.dueLabel ||
                                    "This payment unlocks once the phase is fully completed."}
                                </p>
                              </div>
                              <Badge
                                variant={isDueNow ? "secondary" : "outline"}
                                className={cn(
                                  "mt-0.5 shrink-0 self-start sm:mt-0 sm:self-center",
                                  isPaid
                                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                                    : isDueNow
                                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                                      : "border-border/60 bg-background/70 text-muted-foreground",
                                )}
                              >
                                {milestoneStatusLabel}
                              </Badge>
                            </div>

                            <div className="flex flex-col gap-1 sm:min-w-[118px] sm:border-l sm:border-border/50 sm:pl-3 sm:items-end">
                              <div className="text-left sm:text-right">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                  Amount
                                </p>
                                <p className="text-base font-semibold leading-tight text-foreground sm:text-[17px]">
                                  {formatINR(installment.amount || 0)}
                                </p>
                              </div>

                              {canPayInstallment ? (
                                <Button
                                  size="sm"
                                  className="h-7 w-fit px-2.5 text-[11px] sm:self-end"
                                  onClick={handlePayDueInstallment}
                                  disabled={isProcessingInstallment}
                                >
                                  {isProcessingInstallment ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <CreditCard className="h-3 w-3" />
                                  )}
                                  {isProcessingInstallment
                                    ? "Processing"
                                    : `Pay ${installment.percentage}%`}
                                </Button>
                              ) : null}
                            </div>
                          </div>
                          </div>
                        );
                      })
                      : null}

                    {shouldShowProjectCompletionPrompt ? (
                      <div className="rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2 transition-colors">
                        <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                          <div className="flex items-start gap-2 sm:items-center">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/12 text-primary">
                              <CheckCircle2 className="h-3 w-3" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                                  Project Completion Approval
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                <p className="text-sm font-semibold leading-tight text-foreground sm:text-[15px]">
                                  Final payment received. Approval required to close the project.
                                </p>
                                <Badge
                                  variant="secondary"
                                  className="border-primary/40 bg-primary/10 px-2 py-0 text-[10px] font-medium leading-5 text-primary"
                                >
                                  Client Approval Required
                                </Badge>
                              </div>
                              <p className="pt-0.5 text-xs leading-snug text-muted-foreground sm:text-[13px]">
                                The project will stay active until you approve completion.
                                Once confirmed, it will be marked completed and further
                                changes will be locked.
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1 sm:items-end">
                            <Button
                              size="sm"
                              className="h-7 w-fit px-2.5 text-[11px] sm:self-end"
                              onClick={handleMarkProjectCompleted}
                              disabled={!canMarkProjectCompleted || isCompletingProject}
                            >
                              {isCompletingProject ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3 w-3" />
                              )}
                              {isCompletingProject
                                ? "Saving"
                                : "Mark Project Completed"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : null}
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

export default ClientProjectDetailMainColumn;
