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
          <DialogTitle>Submit Task for Client Review?</DialogTitle>
          <DialogDescription>
            This will mark "{taskCompletionConfirm.taskTitle || "task"}" as
            pending review and notify the client. The task becomes completed
            only after client verification.
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
          <Button type="button" onClick={handleConfirmTaskCompletion}>
            Confirm and Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={reportOpen} onOpenChange={setReportOpen}>
      <DialogContent
        ref={reportDialogContentRef}
        className="sm:max-w-md max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>Contact your Project Catalyst</DialogTitle>
          <DialogDescription>
            Describe the issue or dispute regarding this project. A Project
            Manager will get involved to resolve it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {activeProjectManager ? (
            <div className="mb-2 flex items-center gap-3 rounded-md border bg-muted/50 p-3">
              <Avatar className="h-10 w-10 border bg-background">
                <AvatarImage
                  src={activeProjectManager.avatar}
                  alt={activeProjectManager.fullName}
                />
                <AvatarFallback className="bg-primary/10 text-primary">
                  PM
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="mb-1 text-sm font-semibold text-foreground">
                  {activeProjectManager.fullName}
                </span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span>{activeProjectManager.email}</span>
                </div>
                {activeProjectManager.phone ? (
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>{activeProjectManager.phone}</span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border/70 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              No active project manager is assigned to this project yet.
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Add Note</label>
            <Textarea
              placeholder="Add a note..."
              value={issueText}
              onChange={(event) => setIssueText(event.target.value)}
              className="min-h-25 whitespace-pre-wrap break-all"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">
              Project Manager Availability
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Popover
                  open={datePopoverOpen}
                  onOpenChange={setDatePopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-60 justify-start text-left font-normal",
                        !date && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
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

                <div className="w-35">
                  <select
                    value={time}
                    onChange={(event) => setTime(event.target.value)}
                    disabled={!date}
                    className={cn(
                      "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm",
                      "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      !time && "text-muted-foreground",
                    )}
                  >
                    <option value="">
                      {date
                        ? effectiveTimeSlots.length > 0
                          ? "Select time"
                          : "No slots"
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
                <p className="text-xs text-muted-foreground">
                  Manager has no configured slots for this date. Using default
                  working-hour options.
                </p>
              ) : null}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setReportOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleReport}
            disabled={isReporting || !issueText.trim()}
          >
            {isReporting ? "Submit" : "Submit"}
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
