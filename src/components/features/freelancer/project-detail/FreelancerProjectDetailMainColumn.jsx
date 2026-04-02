import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Circle from "lucide-react/dist/esm/icons/circle";
import Clock from "lucide-react/dist/esm/icons/clock";
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
  getPhaseIcon,
  handleTaskClick,
}) => (
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

    <div className="grid gap-4 lg:grid-cols-2">
      <Card className={panelClassName}>
        <CardHeader className="pb-3">
          <CardTitle className={eyebrowClassName}>Primary Objectives</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {projectDetailSnapshot.primaryObjectives.length > 0 ? (
            <ul className="space-y-2 px-2 pb-1">
              {projectDetailSnapshot.primaryObjectives.map((objective, index) => (
                <li
                  key={`objective-${index}`}
                  className="relative pl-4 text-sm leading-7 text-[#d4d4d8]"
                >
                  <span className="absolute left-0 top-[0.75rem] h-1 w-1 rounded-full bg-white/55" />
                  {objective}
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-2 pb-1 text-sm leading-7 text-[#d4d4d8]">
              Primary objectives will appear once the brief is structured.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className={panelClassName}>
        <CardHeader className="pb-3">
          <CardTitle className={eyebrowClassName}>
            Features/Deliverables Included
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {projectDetailSnapshot.featuresDeliverables.length > 0 ? (
            <ul className="space-y-2 px-2 pb-1">
              {projectDetailSnapshot.featuresDeliverables.map((feature, index) => (
                <li
                  key={`feature-${index}`}
                  className="relative pl-4 text-sm leading-7 text-[#d4d4d8]"
                >
                  <span className="absolute left-0 top-[0.75rem] h-1 w-1 rounded-full bg-white/55" />
                  {feature}
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
    </div>

    <Card className={panelClassName}>
      <CardHeader className="px-4 pb-3 pt-4 sm:px-6 sm:pt-5">
        <CardTitle className={eyebrowClassName}>Website Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4 pt-1 sm:px-6 sm:pb-6">
        <div className="grid gap-6 sm:grid-cols-2">
          {projectDetailSnapshot.websiteDetails.map((item) => {
            const val = item.value || "Not specified";
            const isList = val.includes(" - ") || val.match(/^[-•]\s/m);

            return (
              <div
                key={item.label}
                className={`min-h-[70px] min-w-0 border-l border-white/[0.08] pl-4 flex flex-col justify-start py-1 ${
                  isList ? "sm:col-span-2" : ""
                }`}
              >
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {item.label}
                </p>
                {(() => {
                  if (isList) {
                    const listItems = val
                      .split(/\s+-\s+|\r?\n/)
                      .map((entry) => entry.replace(/^[-•]\s*/, "").trim())
                      .filter(Boolean);

                    if (listItems.length > 1) {
                      return (
                        <ul className="mt-4 grid list-none gap-x-8 gap-y-3 pl-0 sm:grid-cols-2">
                          {listItems.map((listItem, index) => (
                            <li
                              key={`${item.label}-${index}`}
                              className="relative pl-[1.125rem] text-sm font-medium leading-relaxed text-white"
                            >
                              <span className="absolute left-0 top-[0.6rem] h-1 w-1 rounded-full bg-white/40" />
                              {listItem}
                            </li>
                          ))}
                        </ul>
                      );
                    }
                  }

                  return (
                    <p className="mt-1.5 break-words whitespace-pre-wrap text-sm font-medium leading-6 text-white">
                      {val}
                    </p>
                  );
                })()}
              </div>
            );
          })}
        </div>
        {projectDetailSnapshot.pageTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {projectDetailSnapshot.pageTags.map((page) => (
              <span
                key={page}
                className="inline-flex items-center rounded-full border border-white/[0.08] bg-[#111111] px-3 py-1 text-[11px] font-medium text-[#cfd3da]"
              >
                {page}
              </span>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>

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
            const isCompleted = phase?.status === "completed";
            const isActive = phase?.status === "in-progress";
            const isPending = !isCompleted && !isActive;

            return (
              <div
                key={phase?.id || `phase-${index}`}
                className={`flex flex-col justify-between rounded-[20px] p-5 transition-all ${
                  isCompleted
                    ? "bg-background shadow-[inset_2px_0_0_0_#10b981]"
                    : isActive
                      ? "bg-background"
                      : "bg-background"
                }`}
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
              </div>
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
              <span className="font-medium text-white">Note:</span>{" "}
              {project.notes}
            </p>
          </div>
        ) : null}
        <Accordion
          type="single"
          collapsible
          defaultValue={activePhase?.id}
          className="w-full"
        >
          {tasksByPhase.map((phaseGroup) => (
            <AccordionItem
              key={phaseGroup.phaseId}
              value={phaseGroup.phaseId}
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
                      className={`flex items-center gap-3 rounded-lg border border-border/60 bg-background p-3 transition-colors ${
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
          ))}
        </Accordion>
      </CardContent>
    </Card>
  </div>
);

export default FreelancerProjectDetailMainColumn;
