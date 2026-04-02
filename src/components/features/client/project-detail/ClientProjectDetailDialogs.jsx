import CalendarIcon from "lucide-react/dist/esm/icons/calendar";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/shared/lib/utils";
import ProjectDocumentAvatar from "./ProjectDocumentAvatar";

const ClientProjectDetailDialogs = ({
  verifyConfirmOpen,
  setVerifyConfirmOpen,
  pendingVerifyTask,
  setPendingVerifyTask,
  handleVerifyTask,
  reportOpen,
  setReportOpen,
  isReporting,
  reportDialogContentRef,
  catalystDialogTitle,
  catalystDialogDescription,
  activeProjectManager,
  isFreelancerChangeRequest,
  handleCatalystRequestTypeChange,
  catalystRequestTypes,
  freelancer,
  pendingFreelancerChangeRequest,
  latestFreelancerChangeRequest,
  freelancerChangeCount,
  catalystDialogNoteLabel,
  catalystDialogNotePlaceholder,
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
  handleCatalystSubmit,
  catalystDialogSubmitLabel,
  assetsDialogOpen,
  setAssetsDialogOpen,
  eyebrowClassName,
  clientDocs,
  formatAttachmentSize,
  getProjectDocumentPresentation,
  formatProjectDocumentTimestamp,
  insetPanelClassName,
  detailOpen,
  setDetailOpen,
  renderProjectDescription,
}) => (
  <>
    <Dialog open={verifyConfirmOpen} onOpenChange={setVerifyConfirmOpen}>
      <DialogContent disableScrollLock className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {pendingVerifyTask?.isVerified
              ? "Remove Verification?"
              : "Verify Task?"}
          </DialogTitle>
          <DialogDescription>
            {pendingVerifyTask?.isVerified
              ? `Are you sure you want to remove verification from \"${pendingVerifyTask?.title}\"? The freelancer will be notified.`
              : `Are you sure you want to verify \"${pendingVerifyTask?.title}\"? This confirms the task has been completed to your satisfaction.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={() => {
              setVerifyConfirmOpen(false);
              setPendingVerifyTask(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant={pendingVerifyTask?.isVerified ? "destructive" : "default"}
            onClick={() => {
              if (pendingVerifyTask) {
                handleVerifyTask(
                  pendingVerifyTask.uniqueKey,
                  pendingVerifyTask.title,
                  pendingVerifyTask.isVerified,
                );
              }
            }}
          >
            {pendingVerifyTask?.isVerified
              ? "Remove Verification"
              : "Verify Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog
      open={reportOpen}
      onOpenChange={(open) => {
        if (!isReporting) {
          setReportOpen(open);
        }
      }}
    >
      <DialogContent
        ref={reportDialogContentRef}
        className="sm:max-w-md max-h-[90vh] overflow-x-hidden overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>{catalystDialogTitle}</DialogTitle>
          <DialogDescription>{catalystDialogDescription}</DialogDescription>
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
              {isFreelancerChangeRequest
                ? "No active Project Manager is assigned yet. Your request will be queued for review once the project manager is available."
                : "No active project manager is assigned to this project yet."}
            </div>
          )}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Request type
            </p>
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/60 bg-background/40 p-1">
              <button
                type="button"
                onClick={() =>
                  handleCatalystRequestTypeChange(catalystRequestTypes.GENERAL)
                }
                className={cn(
                  "rounded-lg px-3 py-2 text-left transition-colors",
                  !isFreelancerChangeRequest
                    ? "bg-accent text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                <span className="block text-sm font-semibold">
                  General support
                </span>
                <span className="mt-1 block text-xs">
                  Ask for help, raise an issue, or request PM support.
                </span>
              </button>
              <button
                type="button"
                onClick={() =>
                  handleCatalystRequestTypeChange(
                    catalystRequestTypes.FREELANCER_CHANGE,
                  )
                }
                className={cn(
                  "rounded-lg px-3 py-2 text-left transition-colors",
                  isFreelancerChangeRequest
                    ? "bg-accent text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                <span className="block text-sm font-semibold">
                  Change freelancer
                </span>
                <span className="mt-1 block text-xs">
                  Request PM review for a freelancer replacement.
                </span>
              </button>
            </div>
          </div>
          {isFreelancerChangeRequest ? (
            <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-3">
              <div className="flex items-start gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Reassignment Flow
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    The Project Catalyst collects your reason, then the Project
                    Manager reviews and handles the freelancer change.
                  </p>
                </div>
              </div>
              {freelancer ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Current freelancer:{" "}
                  <span className="font-medium text-foreground">
                    {freelancer.fullName}
                  </span>
                </p>
              ) : null}
              {pendingFreelancerChangeRequest ? (
                <div className="mt-3 rounded-md border border-amber-500/20 bg-amber-500/10 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-400">
                    Pending request
                  </p>
                  <p className="mt-2 text-sm text-foreground">
                    {pendingFreelancerChangeRequest.reason}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Project Catalyst has already shared this with the Project
                    Manager for review.
                  </p>
                </div>
              ) : latestFreelancerChangeRequest ? (
                <div className="mt-3 rounded-md border border-border/60 bg-background/40 p-3 text-sm text-muted-foreground">
                  Last request{" "}
                  {latestFreelancerChangeRequest.requestNumber ||
                    freelancerChangeCount}{" "}
                  was completed
                  {latestFreelancerChangeRequest.replacementFreelancerName
                    ? ` and reassigned to ${latestFreelancerChangeRequest.replacementFreelancerName}.`
                    : "."}
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">
              {catalystDialogNoteLabel}
            </label>
            <Textarea
              placeholder={catalystDialogNotePlaceholder}
              value={issueText}
              onChange={(event) => setIssueText(event.target.value)}
              className="subtle-scrollbar field-sizing-fixed min-h-32 max-h-56 resize-none overflow-y-auto whitespace-pre-wrap break-words pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-button]:h-0 [&::-webkit-scrollbar-button]:w-0"
            />
            {isFreelancerChangeRequest ? (
              <p className="text-xs text-muted-foreground">
                Share clear delivery, communication, or quality concerns so the
                Project Manager has enough context to evaluate the change.
              </p>
            ) : null}
          </div>
          {!isFreelancerChangeRequest ? (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Project Manager Availability
              </label>
              <div className="space-y-2">
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,9rem)]">
                  <Popover
                    open={datePopoverOpen}
                    onOpenChange={setDatePopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full min-w-0 justify-start rounded-xl border-border/70 bg-background/60 text-left font-normal",
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
                          {
                            before: new Date(new Date().setHours(0, 0, 0, 0)),
                          },
                        ]}
                        className="rounded-md"
                      />
                    </PopoverContent>
                  </Popover>

                  <div className="min-w-0">
                    <Select
                      value={time || undefined}
                      onValueChange={setTime}
                      disabled={!date}
                    >
                      <SelectTrigger
                        className={cn(
                          "h-10 w-full rounded-xl border-border/70 bg-background/60 px-3 text-sm shadow-none",
                          !time && "text-muted-foreground",
                        )}
                      >
                        <SelectValue
                          placeholder={date ? "Select time" : "Select date first"}
                        />
                      </SelectTrigger>
                      <SelectContent className="z-[80] rounded-xl border-border/70 bg-popover/95 backdrop-blur supports-[backdrop-filter]:bg-popover/90">
                        {effectiveTimeSlots.map((slot) => (
                          <SelectItem
                            key={slot}
                            value={slot}
                            className="cursor-pointer rounded-lg"
                          >
                            {slot}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
          ) : null}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setReportOpen(false)}
            disabled={isReporting}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleCatalystSubmit}
            disabled={isReporting || !issueText.trim()}
          >
            {isReporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending
              </>
            ) : (
              catalystDialogSubmitLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={assetsDialogOpen} onOpenChange={setAssetsDialogOpen}>
      <DialogContent className="sm:max-w-2xl border border-white/[0.08] bg-[#171717] p-0 text-white shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="border-b border-white/[0.06] px-6 py-5">
          <DialogHeader className="text-left">
            <DialogTitle className={eyebrowClassName}>Shared Assets</DialogTitle>
            <DialogDescription className="text-sm text-white/78">
              {clientDocs.length} {clientDocs.length === 1 ? "asset" : "assets"} shared by client
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="max-h-[65vh] space-y-3 overflow-y-auto px-6 py-5">
          {clientDocs.length > 0 ? (
            clientDocs.map((doc, idx) => {
              const fileSize = formatAttachmentSize(doc.size) || "Shared file";
              const { extensionLabel } = getProjectDocumentPresentation(doc);

              return (
                <div
                  key={doc.messageId || doc.url || `${doc.name}-${idx}`}
                  className={cn(
                    insetPanelClassName,
                    "flex items-center gap-4 px-4 py-3",
                  )}
                >
                  <ProjectDocumentAvatar
                    doc={doc}
                    getProjectDocumentPresentation={getProjectDocumentPresentation}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {doc.name || "Shared document"}
                    </p>
                    <p className="mt-1 text-xs text-white/60">
                      {formatProjectDocumentTimestamp(doc.createdAt)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/68">
                      {extensionLabel}
                    </p>
                    <p className="mt-1 text-xs text-white/60">{fileSize}</p>
                  </div>
                  {doc.url ? (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="ml-2 rounded-full border-white/[0.08] bg-[#111111] text-white/82 shadow-none hover:bg-[#1b1b1b] hover:text-white"
                    >
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open
                      </a>
                    </Button>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className={cn(insetPanelClassName, "text-sm text-white/72")}>
              No shared assets are available yet.
            </div>
          )}
        </div>
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

export default ClientProjectDetailDialogs;
