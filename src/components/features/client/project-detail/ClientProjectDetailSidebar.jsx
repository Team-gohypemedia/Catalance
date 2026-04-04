import React from "react";
import { Link } from "react-router-dom";
import Check from "lucide-react/dist/esm/icons/check";
import CheckCheck from "lucide-react/dist/esm/icons/check-check";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import FileText from "lucide-react/dist/esm/icons/file-text";
import IndianRupee from "lucide-react/dist/esm/icons/indian-rupee";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Send from "lucide-react/dist/esm/icons/send";
import Star from "lucide-react/dist/esm/icons/star";
import Upload from "lucide-react/dist/esm/icons/upload";
import format from "date-fns/format";
import isSameDay from "date-fns/isSameDay";
import isToday from "date-fns/isToday";
import isYesterday from "date-fns/isYesterday";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/shared/lib/utils";
import FreelancerInfoCard from "./FreelancerInfoCard";
import ProjectDocumentAvatar from "./ProjectDocumentAvatar";

const getInstallmentScheduleNote = (installment, installments) => {
  const phaseGate = Number(installment?.dueAfterCompletedPhases || 0);
  const sequence = Number(installment?.sequence || 0);
  const totalInstallments = Array.isArray(installments) ? installments.length : 0;
  const isFinalInstallment = totalInstallments > 0 && sequence === totalInstallments;

  if (phaseGate <= 0 || sequence === 1) {
    return "Charged once kickoff is approved and the project starts.";
  }

  if (isFinalInstallment || phaseGate >= 4) {
    return "Charged once final handover is approved.";
  }

  if (phaseGate === 2) {
    return "Charged once the mid-project review is approved.";
  }

  return `Charged once phase ${phaseGate} is approved.`;
};

const ClientProjectDetailSidebar = ({
  panelClassName,
  insetPanelClassName,
  eyebrowClassName,
  subheadingClassName,
  freelancer,
  project,
  messages,
  input,
  setInput,
  handleSendMessage,
  fileInputRef,
  handleFileUpload,
  isSending,
  isChatLockedUntilPayment,
  clientDocs,
  setAssetsDialogOpen,
  formatAttachmentSize,
  getProjectDocumentPresentation,
  formatProjectDocumentTimestamp,
  totalBudget,
  spentBudget,
  remainingBudget,
  paymentPlan,
  dueInstallment,
  isProcessingInstallment,
  handlePayDueInstallment,
  shouldCollectFreelancerReview,
  existingFreelancerReview,
  shouldShowFreelancerReviewPrompt,
  reviewRating,
  setReviewRating,
  reviewComment,
  setReviewComment,
  handleSubmitFreelancerReview,
  isSubmittingFreelancerReview,
  handleDeferFreelancerReview,
  shouldShowFreelancerReviewReminder,
  setReviewDeferredState,
}) => (
  <div className="space-y-4">
    <FreelancerInfoCard
      freelancer={freelancer}
      project={project}
      panelClassName={panelClassName}
      eyebrowClassName={eyebrowClassName}
    />

    <Card id="client-project-chat" className={`${panelClassName} flex h-96 flex-col`}>
      <CardHeader className="space-y-2 border-b border-border/60 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <CardTitle className={eyebrowClassName}>Project Chat</CardTitle>
            <CardDescription className={cn(subheadingClassName, "text-xs")}>
              Ask questions and share documents
            </CardDescription>
          </div>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-7 border-border/60 px-2.5 text-[11px]"
          >
            <Link
              to={
                project?.id
                  ? `/client/messages?projectId=${encodeURIComponent(project.id)}`
                  : "/client/messages"
              }
            >
              Open in Messages
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 overflow-y-auto py-4">
        {messages.map((message, index) => {
          const isSelf = message.sender === "user";
          const isAssistant = message.sender === "assistant";
          const align = isAssistant || !isSelf ? "justify-start" : "justify-end";

          const prevMessage = messages[index - 1];
          const currentDate = message.createdAt
            ? new Date(message.createdAt)
            : new Date();
          const prevDate = prevMessage?.createdAt
            ? new Date(prevMessage.createdAt)
            : null;
          const showDateDivider = !prevDate || !isSameDay(currentDate, prevDate);

          return (
            <React.Fragment key={message.id || index}>
              {showDateDivider ? (
                <div className="my-4 flex justify-center">
                  <span className="rounded-full bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
                    {isToday(currentDate)
                      ? "Today"
                      : isYesterday(currentDate)
                        ? "Yesterday"
                        : format(currentDate, "MMMM d, yyyy")}
                  </span>
                </div>
              ) : null}
              <div className={`flex ${align}`}>
                <div
                  className={`flex max-w-[85%] flex-col overflow-hidden rounded-2xl px-4 py-2.5 text-sm ${
                    isSelf
                      ? "rounded-tr-sm bg-primary text-primary-foreground shadow-sm"
                      : "rounded-tl-sm border border-border/60 bg-muted text-foreground"
                  }`}
                >
                  {message.sender === "other" && message.senderName ? (
                    <span className="mb-1 block text-[10px] opacity-70">
                      {message.senderName}
                    </span>
                  ) : null}

                  {message.text ? (
                    <p className="leading-relaxed whitespace-pre-wrap wrap-break-word">
                      {message.text}
                    </p>
                  ) : null}

                  {message.attachment ? (
                    <div className="mt-2">
                      {message.attachment.type?.startsWith("image/") ||
                      message.attachment.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <a
                          href={message.attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img
                            src={message.attachment.url}
                            alt={message.attachment.name || "Attachment"}
                            className="max-h-45 max-w-45 rounded-lg object-cover"
                          />
                        </a>
                      ) : (
                        <a
                          href={message.attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-2 rounded-lg p-2 transition-colors ${
                            !isSelf
                              ? "border border-border/50 bg-background/50"
                              : "bg-background/20 hover:bg-background/30"
                          }`}
                        >
                          <FileText className="h-4 w-4 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="max-w-35 truncate text-xs font-medium">
                              {message.attachment.name || "File"}
                            </p>
                          </div>
                        </a>
                      )}
                    </div>
                  ) : null}

                  <div className="mt-1 flex items-center justify-end gap-1 self-end">
                    <span className="whitespace-nowrap text-[10px] opacity-70">
                      {format(currentDate, "h:mm a")}
                    </span>
                    {isSelf ? (
                      <span className="ml-1 opacity-90">
                        {message.readAt ? (
                          <CheckCheck className="h-3 w-3" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </CardContent>
      <div className="space-y-2 border-t border-border/60 p-3">
        {isChatLockedUntilPayment ? (
          <div className="w-full rounded-md border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            Pending your payment. Messages will start after the initial 20%
            payment.
          </div>
        ) : null}
        <div className="flex gap-2">
          <Input
            placeholder={
              isChatLockedUntilPayment
                ? "Complete payment to unlock chat"
                : "Type your message..."
            }
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyPress={(event) => event.key === "Enter" && handleSendMessage()}
            className="h-9 border-border/60 bg-muted text-sm"
            disabled={isChatLockedUntilPayment || isSending}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            size="sm"
            variant="outline"
            className="h-9 w-9 border-border/60 p-0"
            title="Upload document"
            disabled={isChatLockedUntilPayment || isSending}
          >
            <Upload className="h-4 w-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
          />
          <Button
            onClick={handleSendMessage}
            size="sm"
            variant="default"
            className="h-9 w-9 p-0"
            disabled={isChatLockedUntilPayment || isSending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>

    <Card className={panelClassName}>
      <CardHeader className="pb-3">
        <CardTitle className={eyebrowClassName}>Client Documents</CardTitle>
        <CardDescription className={cn(subheadingClassName, "text-sm text-white/78")}>
          {clientDocs.length} {clientDocs.length === 1 ? "document" : "documents"} shared by client
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {clientDocs.length > 0 ? (
          <div className="space-y-1">
            {clientDocs.slice(0, 6).map((doc, idx) => {
              const fileSize = formatAttachmentSize(doc.size) || "Shared file";
              const { extensionLabel } = getProjectDocumentPresentation(doc);
              const fileHref = doc.url || "#client-project-chat";

              return (
                <a
                  key={doc.messageId || doc.url || `${doc.name}-${idx}`}
                  href={fileHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 rounded-[18px] px-1 py-2 transition-colors hover:bg-white/[0.025]"
                >
                  <ProjectDocumentAvatar
                    doc={doc}
                    getProjectDocumentPresentation={getProjectDocumentPresentation}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[1rem] font-semibold leading-tight text-[#f1efed]">
                      {doc.name || "Shared document"}
                    </p>
                    <p className="mt-1 text-[0.96rem] text-[#a9a39d]">
                      {formatProjectDocumentTimestamp(doc.createdAt)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[0.95rem] font-semibold uppercase text-[#b7b1ab]">
                      {extensionLabel}
                    </p>
                    <p className="mt-1 text-[0.96rem] text-[#a9a39d]">
                      {fileSize}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        ) : (
          <div className={cn(insetPanelClassName, "text-sm text-white/72")}>
            No documents attached yet. Upload project documentation here.
          </div>
        )}

        {clientDocs.length > 0 ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setAssetsDialogOpen(true)}
            className="mt-6 h-12 w-full rounded-full border-white/[0.08] bg-[#111111] text-xs font-medium uppercase tracking-[0.22em] text-white/78 shadow-none hover:bg-[#181818] hover:text-white"
          >
            View all shared assets
          </Button>
        ) : null}
      </CardContent>
    </Card>

    <Card className={panelClassName}>
      <CardHeader className="pb-3">
        <CardTitle className={cn(eyebrowClassName, "flex items-center gap-2")}>
          <IndianRupee className="h-4 w-4" />
          Budget Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-white">
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <span>Total Budget</span>
          <span className="font-semibold text-foreground">
            ₹{totalBudget.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <span>Spent</span>
          <span className="font-semibold text-emerald-600">
            ₹{spentBudget.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Remaining</span>
          <span className="font-semibold text-foreground">
            ₹{remainingBudget.toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>

    <Card className={panelClassName}>
      <CardHeader className="pb-3">
        <CardTitle className={eyebrowClassName}>Payment Schedule</CardTitle>
        <CardDescription className={subheadingClassName}>
          Track your project payments: 20% kickoff, 40% progress review, 40%
          final handover.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {Array.isArray(paymentPlan?.installments) && paymentPlan.installments.length > 0 ? (
          <div className="space-y-3">
            {paymentPlan.installments.map((installment) => (
              <div
                key={installment.sequence}
                className={cn(
                  insetPanelClassName,
                  "space-y-3 p-4",
                  installment.isDue && "border-primary/25 bg-primary/10",
                  installment.isPaid && "border-emerald-500/20 bg-emerald-500/10",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {installment.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">
                      ₹{Number(installment.amount || 0).toLocaleString()}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      "border px-2.5 py-1 text-[10px] font-medium",
                      installment.isPaid
                        ? "border-emerald-500/10 bg-emerald-500/15 text-emerald-200"
                        : installment.isDue
                          ? "border-primary/10 bg-primary/15 text-primary"
                          : "border-white/[0.08] bg-[#111111] text-muted-foreground",
                    )}
                  >
                    {installment.isPaid
                      ? "Paid"
                      : installment.isDue
                        ? "Next Payment"
                        : "Upcoming"}
                  </Badge>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  {getInstallmentScheduleNote(
                    installment,
                    paymentPlan.installments,
                  )}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Payment schedule will appear once a proposal is accepted.
          </p>
        )}

        {dueInstallment ? (
          <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
            <p className="text-sm font-semibold text-foreground">
              Current payment due: {dueInstallment.label}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Pay {dueInstallment.percentage}% now to keep the project billing on
              schedule.
            </p>
            <Button
              className="mt-3 w-full gap-2"
              disabled={isProcessingInstallment}
              onClick={handlePayDueInstallment}
            >
              {isProcessingInstallment ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              {isProcessingInstallment
                ? "Processing..."
                : `Pay ${dueInstallment.percentage}%`}
            </Button>
          </div>
        ) : paymentPlan?.isFullyPaid ? (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
            All scheduled client payments are complete.
          </div>
        ) : paymentPlan ? (
          <div className="rounded-lg border border-border/60 bg-transparent p-3 text-sm text-muted-foreground">
            No payment is due right now. The next installment will unlock
            automatically when its phase gate is complete.
          </div>
        ) : null}
      </CardContent>
    </Card>

    {shouldCollectFreelancerReview ? (
      <Card className={panelClassName}>
        <CardHeader className="pb-3">
          <CardTitle className={eyebrowClassName}>Freelancer Review</CardTitle>
          <CardDescription className={subheadingClassName}>
            {existingFreelancerReview
              ? "Thanks for sharing your feedback for this completed project."
              : "Project completed. Please rate your freelancer experience."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {existingFreelancerReview ? (
            <>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 5 }).map((_, index) => {
                  const filled =
                    index < Number(existingFreelancerReview.rating || 0);
                  return (
                    <Star
                      key={`reviewed-star-${index + 1}`}
                      className={cn(
                        "h-4 w-4",
                        filled
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground",
                      )}
                    />
                  );
                })}
                <span className="ml-1 text-xs text-muted-foreground">
                  {Number(existingFreelancerReview.rating || 0)} / 5
                </span>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm text-foreground">
                {existingFreelancerReview.comment}
              </div>
            </>
          ) : shouldShowFreelancerReviewPrompt ? (
            <>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Your rating
                </p>
                <div className="mt-2 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, index) => {
                    const value = index + 1;
                    const selected = value <= reviewRating;

                    return (
                      <button
                        key={`pending-review-star-${value}`}
                        type="button"
                        onClick={() => setReviewRating(value)}
                        className="rounded p-0.5 transition-transform hover:scale-105"
                        aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
                      >
                        <Star
                          className={cn(
                            "h-5 w-5",
                            selected
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground",
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Your feedback
                </p>
                <Textarea
                  className="mt-2"
                  rows={4}
                  placeholder="Share a quick feedback for the freelancer..."
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  className="flex-1"
                  onClick={handleSubmitFreelancerReview}
                  disabled={isSubmittingFreelancerReview}
                >
                  {isSubmittingFreelancerReview ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {isSubmittingFreelancerReview
                    ? "Submitting"
                    : "Submit Review"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDeferFreelancerReview}
                  disabled={isSubmittingFreelancerReview}
                >
                  Not now
                </Button>
              </div>
            </>
          ) : shouldShowFreelancerReviewReminder ? (
            <div className="rounded-lg border border-border/60 bg-background/50 p-3">
              <p className="text-sm font-semibold text-foreground">
                Review pending
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                You can submit your freelancer review anytime from this project
                section.
              </p>
              <Button
                className="mt-3 w-full"
                variant="outline"
                onClick={() => setReviewDeferredState(false)}
              >
                Review now
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    ) : null}
  </div>
);

export default ClientProjectDetailSidebar;
