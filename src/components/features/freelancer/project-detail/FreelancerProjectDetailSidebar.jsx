import React from "react";
import { Link } from "react-router-dom";
import Check from "lucide-react/dist/esm/icons/check";
import CheckCheck from "lucide-react/dist/esm/icons/check-check";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Image from "lucide-react/dist/esm/icons/image";
import IndianRupee from "lucide-react/dist/esm/icons/indian-rupee";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Send from "lucide-react/dist/esm/icons/send";
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
import { cn } from "@/shared/lib/utils";
import ClientInfoCard from "./ClientInfoCard";

const FreelancerProjectDetailSidebar = ({
  panelClassName,
  insetPanelClassName,
  eyebrowClassName,
  subheadingClassName,
  project,
  handleProjectLinkUpdate,
  messages,
  input,
  setInput,
  handleSendMessage,
  isSending,
  fileInputRef,
  handleFileUpload,
  docs,
  formatAttachmentSize,
  totalBudget,
  spentBudget,
  remainingBudget,
  billingRoadmap,
}) => (
  <div className="space-y-4">
    <ClientInfoCard
      client={project?.owner}
      project={project}
      onUpdateLink={handleProjectLinkUpdate}
      panelClassName={panelClassName}
      eyebrowClassName={eyebrowClassName}
    />

    <Card className={cn(panelClassName, "min-h-[340px] overflow-hidden")}>
      <CardHeader className="space-y-2 border-b border-white/[0.06] pb-3">
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
                  ? `/freelancer/messages?projectId=${encodeURIComponent(project.id)}`
                  : "/freelancer/messages"
              }
            >
              Open in Messages
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="max-h-[320px] min-h-[200px] space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex min-h-[160px] items-center justify-center rounded-[14px] border border-dashed border-white/[0.08] bg-card px-4 text-center text-sm text-muted-foreground">
            No messages yet. Start the conversation with your client.
          </div>
        ) : (
          messages.map((message, index) => {
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
                    <span className="rounded-full border border-white/[0.06] bg-card px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
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
                    className={`flex max-w-[88%] flex-col overflow-hidden rounded-2xl px-4 py-2.5 text-sm ${
                      isSelf
                        ? "rounded-tr-sm bg-primary text-primary-foreground shadow-sm"
                        : "rounded-tl-sm border border-white/[0.06] bg-card text-white"
                    }`}
                  >
                    {message.sender === "other" && message.senderName ? (
                      <span className="mb-1 block text-[10px] text-muted-foreground">
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
                        message.attachment.url?.match(
                          /\.(jpg|jpeg|png|gif|webp)$/i,
                        ) ? (
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
                                ? "border border-white/[0.06] bg-card"
                                : "bg-black/10"
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
          })
        )}
      </CardContent>
      <div className="flex gap-2 border-t border-white/[0.06] p-3">
        <Input
          placeholder="Type your message..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyPress={(event) => event.key === "Enter" && handleSendMessage()}
          className="h-10 border-white/[0.08] bg-card text-sm text-white placeholder:text-[#6b7280]"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          size="sm"
          variant="outline"
          className="h-10 w-10 border-white/[0.08] bg-card p-0 text-[#cfd3da] hover:bg-card/80"
          disabled={isSending}
          title="Upload document"
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
          className="h-10 w-10 p-0"
          disabled={isSending}
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </Card>

    <Card className={panelClassName}>
      <CardHeader className="pb-3">
        <CardTitle className={eyebrowClassName}>Client Documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {docs.length > 0 ? (
          docs.slice(0, 6).map((doc, idx) => {
            const isImage =
              doc.type?.startsWith("image/") ||
              doc.url?.match(/\.(jpg|jpeg|png|webp|gif)$/i);
            const fileSize = formatAttachmentSize(doc.size);

            return (
              <a
                key={idx}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-[16px] border border-white/[0.06] bg-[#111111] px-3 py-3 text-sm transition-colors hover:bg-white/[0.03]"
              >
                <span
                  className={cn(
                    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                    isImage ? "bg-emerald-500/12" : "bg-primary/10",
                  )}
                >
                  {isImage ? (
                    <Image className="h-4 w-4 text-emerald-300" />
                  ) : (
                    <FileText className="h-4 w-4 text-primary" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {doc.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[
                      fileSize,
                      doc.createdAt
                        ? format(new Date(doc.createdAt), "MMM d, yyyy")
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                </div>
              </a>
            );
          })
        ) : (
          <p className="text-sm text-white">
            No documents attached yet. Upload project documentation here.
          </p>
        )}
      </CardContent>
    </Card>

    <Card className={panelClassName}>
      <CardHeader className="pb-3">
        <CardTitle className={cn(eyebrowClassName, "flex items-center gap-2")}>
          <IndianRupee className="h-3.5 w-3.5" />
          Your Earnings Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 text-sm text-white">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
          <span>Your Total Share</span>
          <span className="font-semibold text-white">
            {project?.currency || "₹"}
            {totalBudget.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
          <span>Paid to You</span>
          <span className="font-semibold text-emerald-400">
            {project?.currency || "₹"}
            {spentBudget.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Pending Payout</span>
          <span className="font-semibold text-white">
            {project?.currency || "₹"}
            {remainingBudget.toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>

    <Card className={panelClassName}>
      <CardHeader className="pb-3">
        <CardTitle className={eyebrowClassName}>Payout Schedule</CardTitle>
        <CardDescription className={subheadingClassName}>
          Track your payout releases: 20% kickoff, 40% progress review, 40%
          final handover.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {billingRoadmap.map((milestone) => (
          <div
            key={milestone.id}
            className={cn(
              insetPanelClassName,
              "space-y-3 p-4",
              milestone.status === "active" && "border-primary/25 bg-primary/10",
              milestone.status === "paid" && "border-emerald-500/20 bg-emerald-500/10",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {milestone.label}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">
                  {project?.currency || "₹"}
                  {milestone.amount.toLocaleString()}
                </p>
              </div>
              <Badge
                className={cn(
                  "border px-2.5 py-1 text-[10px] font-medium",
                  milestone.status === "paid" &&
                    "border-emerald-500/10 bg-emerald-500/15 text-emerald-200",
                  milestone.status === "active" &&
                    "border-primary/10 bg-primary/15 text-primary",
                  milestone.status === "scheduled" &&
                    "border-white/[0.08] bg-[#111111] text-muted-foreground",
                )}
              >
                {milestone.status === "paid"
                  ? "Paid"
                  : milestone.status === "active"
                    ? "Next Payout"
                    : "Upcoming"}
              </Badge>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              {milestone.note}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);

export default FreelancerProjectDetailSidebar;
