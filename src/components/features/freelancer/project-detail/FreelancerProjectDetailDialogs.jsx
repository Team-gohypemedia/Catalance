import CalendarIcon from "lucide-react/dist/esm/icons/calendar";
import Mail from "lucide-react/dist/esm/icons/mail";
import Phone from "lucide-react/dist/esm/icons/phone";
import format from "date-fns/format";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/shared/lib/utils";

const FreelancerProjectDetailDialogs = ({
  taskCompletionConfirm,
  setTaskCompletionConfirm,
  handleConfirmTaskCompletion,
  reportOpen,
  setReportOpen,
  reportDialogContentRef,
  activeProjectManager,
  issueText,
  setIssueText,
  date,
  setDate,
  time,
  setTime,
  datePopoverOpen,
  setDatePopoverOpen,
  effectiveTimeSlots,
  availableTimeSlots,
  handleReport,
  isReporting,
  detailOpen,
  setDetailOpen,
  renderProjectDescription,
}) => (
  <>
    <Dialog
      open={taskCompletionConfirm.open}
      onOpenChange={(open) =>
        setTaskCompletionConfirm((prev) =>
          open ? prev : { open: false, uniqueKey: "", taskTitle: "" },
        )
      }
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {taskCompletionConfirm.isUnchecking 
              ? "Remove from Pending Review?" 
              : "Submit Task for Client Review?"}
          </DialogTitle>
          <DialogDescription>
            {taskCompletionConfirm.isUnchecking 
              ? `This will remove "${taskCompletionConfirm.taskTitle || "task"}" from pending review and move it back to in-progress.` 
              : `This will mark "${taskCompletionConfirm.taskTitle || "task"}" as pending review and notify the client. The task becomes completed only after client verification.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setTaskCompletionConfirm({
                open: false,
                uniqueKey: "",
                taskTitle: "",
              })
            }
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleConfirmTaskCompletion}
            variant={taskCompletionConfirm.isUnchecking ? "destructive" : "default"}
          >
            {taskCompletionConfirm.isUnchecking ? "Remove" : "Confirm and Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={reportOpen} onOpenChange={setReportOpen}>
      <DialogContent
        ref={reportDialogContentRef}
        className="sm:max-w-[500px] max-h-[92vh] flex flex-col p-6 sm:p-7 rounded-[28px] border-slate-200/60 bg-[#FAF8F5] shadow-2xl overflow-hidden"
      >
        <DialogHeader className="space-y-1.5 text-left pb-1 shrink-0">
          <DialogTitle className="text-xl font-bold text-slate-900">
            Contact your Project Catalyst
          </DialogTitle>
          <DialogDescription className="text-xs font-normal text-slate-600 leading-relaxed">
            Reach out for project support, disputes, or anything that needs Project Manager attention.
          </DialogDescription>
        </DialogHeader>

        <div className="subtle-scrollbar flex-1 space-y-4 overflow-y-auto py-3 pr-1">
          {/* PM Card matching reference image */}
          <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/60 bg-white p-3.5 shadow-2xs">
            <Avatar className="h-11 w-11 border-0 bg-[#FCECE2]">
              <AvatarImage
                src={activeProjectManager?.avatar}
                alt={activeProjectManager?.fullName || "PM"}
              />
              <AvatarFallback className="bg-[#FCECE2] text-[#D9692A] font-semibold text-sm">
                PM
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-slate-900 truncate">
                {activeProjectManager?.fullName || "swarnpriya Jha"}
              </span>
            </div>
          </div>

          {/* REQUEST TYPE */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-900 block">
              REQUEST TYPE
            </label>
            <div className="rounded-2xl border border-slate-200/60 bg-white p-4 space-y-0.5 shadow-2xs">
              <h5 className="text-sm font-bold text-slate-900">General support</h5>
              <p className="text-xs font-normal text-slate-500 leading-relaxed">
                Ask for help, raise an issue, or request PM support.
              </p>
            </div>
          </div>

          {/* Add Note */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900 block">Add Note</label>
            <Textarea
              placeholder="Add a note..."
              value={issueText}
              onChange={(event) => setIssueText(event.target.value)}
              className="min-h-28 max-h-40 rounded-2xl border border-slate-200/70 bg-white font-medium text-xs text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#D9692A] leading-relaxed p-3.5 shadow-2xs"
            />
          </div>

          {/* Project Manager Availability */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900 block">
              Project Manager Availability
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_170px] gap-2.5">
              <Popover
                open={datePopoverOpen}
                onOpenChange={setDatePopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-11 w-full justify-start rounded-2xl border border-slate-200/60 bg-white text-xs font-medium text-slate-900 shadow-2xs hover:bg-slate-50",
                      !date && "text-slate-400",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-slate-700" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  container={reportDialogContentRef.current ?? undefined}
                  align="start"
                  className="w-auto p-0 z-70"
                >
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(selectedDate) => {
                      setDate(selectedDate);
                      setTime("");
                      if (selectedDate) {
                        setDatePopoverOpen(false);
                      }
                    }}
                    initialFocus
                    disabled={[
                      { dayOfWeek: [0] },
                      { before: new Date(new Date().setHours(0, 0, 0, 0)) },
                    ]}
                    className="rounded-md"
                  />
                </PopoverContent>
              </Popover>

              <div className="w-full">
                <select
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  disabled={!date || effectiveTimeSlots.length === 0}
                  className={cn(
                    "h-11 w-full rounded-2xl border border-slate-200/60 bg-white px-3.5 text-xs font-medium text-slate-900 shadow-2xs outline-none focus:border-[#D9692A]",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    !time && "text-slate-400",
                  )}
                >
                  <option value="">
                    {date
                      ? effectiveTimeSlots.length > 0
                        ? "Select time"
                        : "No slots available"
                      : "Select date first"}
                  </option>
                  {effectiveTimeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {date && availableTimeSlots.length === 0 ? (
              <p className="text-[11px] font-medium text-slate-500 pt-0.5">
                No Project Manager slots are available on this date. Choose another date or clear the date to submit without scheduling a call.
              </p>
            ) : null}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2.5 pt-4 shrink-0 flex items-center justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setReportOpen(false)}
            className="h-11 rounded-2xl border border-slate-200/80 bg-white text-slate-900 font-semibold text-xs px-6 hover:bg-slate-50 shadow-2xs cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleReport}
            disabled={isReporting || !issueText.trim()}
            className="h-11 rounded-2xl bg-[#ECA282] hover:bg-[#D9692A] text-white font-semibold text-xs px-7 shadow-2xs cursor-pointer disabled:opacity-60 transition-all"
          >
            {isReporting ? "Submitting..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Project Details</DialogTitle>
          <DialogDescription>
            Full project description and scope.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          {renderProjectDescription({ showExtended: true })}
        </div>
      </DialogContent>
    </Dialog>
  </>
);

export default FreelancerProjectDetailDialogs;
