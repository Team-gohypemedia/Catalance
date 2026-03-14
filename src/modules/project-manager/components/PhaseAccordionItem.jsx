import PropTypes from "prop-types";
import Lock from "lucide-react/dist/esm/icons/lock";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const phaseStatusStyles = {
  Completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Pending Approval": "border-blue-200 bg-blue-50 text-blue-700",
  Locked: "border-slate-200 bg-slate-100 text-slate-700",
};

const taskStatusStyles = {
  VERIFIED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  COMPLETED: "border-blue-200 bg-blue-50 text-blue-700",
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
};

const getStatusClass = (status, type = "phase") => {
  if (type === "task") {
    return taskStatusStyles[status] || "border-slate-200 bg-slate-100 text-slate-600";
  }

  return phaseStatusStyles[status] || "border-slate-200 bg-slate-100 text-slate-600";
};

export const PhaseAccordionItem = ({ milestone, value, onApproveMilestone }) => {
  const totalTasks = Number(milestone.totalTasks || milestone.tasks?.length || 0);
  const verifiedCount = Number(milestone.verifiedCount || 0);
  const pendingCount = Math.max(totalTasks - verifiedCount, 0);
  const isLocked = milestone.status === "Locked";

  return (
    <AccordionItem
      value={value}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors data-[state=open]:border-blue-300 data-[state=open]:bg-blue-50/50 data-[state=open]:shadow-sm"
    >
      <AccordionTrigger className="px-4 py-3 hover:bg-blue-50/60 hover:no-underline">
        <div className="flex w-full flex-col gap-2 text-left">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                Phase {milestone.phase}
              </p>
              <h4 className="mt-0.5 text-sm font-semibold text-slate-900">
                {milestone.title}
              </h4>
            </div>
            <Badge
              variant="outline"
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${getStatusClass(milestone.status)}`}
            >
              {isLocked ? (
                <span className="inline-flex items-center gap-1">
                  <Lock className="h-3 w-3" /> {milestone.status}
                </span>
              ) : (
                milestone.status
              )}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
              Escrow: INR {Number(milestone.amount || 0).toLocaleString("en-IN")}
            </span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
              Verified: {verifiedCount}
            </span>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">
              Pending: {pendingCount}
            </span>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-4 pb-4">
        <div className="grid gap-2 border-t border-slate-200 pt-3 text-xs md:grid-cols-3">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50/80 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-700">
              Verified By
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900">{milestone.verifierName}</p>
            <p className="mt-1 text-[11px] text-slate-700">
              {verifiedCount}/{totalTasks} tasks verified
            </p>
          </div>

          <div className="rounded-lg border border-amber-100 bg-amber-50/80 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-700">
              Stuck On
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900 break-words">
              {milestone.stuckOn}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-700 break-words">
              {milestone.stuckNote}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-100/90 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-700">
              Phase Status
            </p>
            <Badge
              variant="outline"
              className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${getStatusClass(milestone.status)}`}
            >
              {milestone.status}
            </Badge>
            <p className="mt-2 text-[11px] text-slate-700">
              Total tasks mapped: {totalTasks}
            </p>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-700">
            Task Breakdown
          </p>
          {milestone.tasks.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="hidden grid-cols-[minmax(0,1fr)_160px_96px] gap-3 border-b border-slate-100 bg-slate-100/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-700 sm:grid">
                <span>Task</span>
                <span>Owner</span>
                <span>Status</span>
              </div>
              {milestone.tasks.map((task) => (
                <div
                  key={task.id}
                  className="grid gap-2 border-t border-slate-100 px-3 py-2 first:border-t-0 transition-colors hover:bg-blue-50/30 sm:grid-cols-[minmax(0,1fr)_160px_96px] sm:items-center sm:gap-3"
                >
                  <p className="text-sm font-medium text-slate-900 break-words">{task.title}</p>
                  <p className="text-[11px] text-slate-700">{task.leadName}</p>
                  <Badge
                    variant="outline"
                    className={`inline-flex w-fit rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${getStatusClass(task.status, "task")}`}
                  >
                    {task.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">
              No mapped tasks found for this phase.
            </p>
          )}
        </div>

        {milestone.eligibleForApproval ? (
          <div className="mt-4 flex justify-end border-t border-slate-200 pt-4">
            <Button
              onClick={() => onApproveMilestone(milestone.phase)}
              className="h-9 rounded-xl bg-blue-600 px-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-white hover:bg-blue-700"
            >
              Approve Payout
            </Button>
          </div>
        ) : null}
      </AccordionContent>
    </AccordionItem>
  );
};

PhaseAccordionItem.propTypes = {
  milestone: PropTypes.shape({
    amount: PropTypes.number,
    eligibleForApproval: PropTypes.bool,
    phase: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    status: PropTypes.string,
    stuckNote: PropTypes.string,
    stuckOn: PropTypes.string,
    tasks: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        leadName: PropTypes.string,
        status: PropTypes.string,
        title: PropTypes.string,
      })
    ),
    title: PropTypes.string,
    totalTasks: PropTypes.number,
    verifiedCount: PropTypes.number,
    verifierName: PropTypes.string,
  }).isRequired,
  onApproveMilestone: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
};

export default PhaseAccordionItem;

