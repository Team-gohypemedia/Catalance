import React from "react";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import SendHorizontal from "lucide-react/dist/esm/icons/send-horizontal";
import { cn } from "@/shared/lib/utils";
import {
  formatConversationTimestamp,
  getFirstNonEmptyText,
} from "../utils";

const RequestDetailsPanel = React.memo(function RequestDetailsPanel({
  request,
  mobileView = false,
  onBack,
}) {
  if (!request) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center bg-card px-6">
        <div className="max-w-md text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-border bg-muted text-primary">
            <SendHorizontal className="size-6" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-foreground">
            Select a request
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Review the request details and wait for the freelancer to accept or
            decline the marketplace inquiry.
          </p>
        </div>
      </div>
    );
  }

  const memberNames = Array.isArray(request.memberNames)
    ? request.memberNames.join(", ")
    : "";

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-card">
      <div
        className={cn(
          "sticky top-0 z-10 border-b border-border bg-card",
          mobileView ? "px-4 py-4" : "px-5 py-5 md:px-7",
        )}
      >
        <div className="flex items-start gap-3">
          {mobileView ? (
            <button
              type="button"
              onClick={onBack}
              className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-foreground transition hover:bg-muted/80"
              aria-label="Back to requests"
            >
              <ChevronLeft className="size-5" />
            </button>
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-2">
              <p className="truncate text-[1.2rem] font-semibold tracking-[-0.3px] text-foreground">
                {getFirstNonEmptyText(
                  request.serviceTitle,
                  request.title,
                  "Marketplace Request",
                )}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {memberNames ||
                  getFirstNonEmptyText(request.clientName, request.freelancerName)}
              </p>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
                Pending freelancer review
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6">
        <div className="mx-auto flex w-full max-w-[980px] flex-col gap-5">
          <div className="rounded-[24px] border border-border bg-background/40 p-5 md:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-base font-semibold text-foreground">
                  {getFirstNonEmptyText(request.freelancerName, "Freelancer")}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Marketplace request sent
                </p>
              </div>
              <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground/80">
                {formatConversationTimestamp(request.updatedAt || request.createdAt)}
              </span>
            </div>

            <div className="mt-5 rounded-[20px] border border-border bg-muted/30 px-4 py-3 text-sm leading-7 text-foreground">
              {request.requestMessage || request.previewText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default RequestDetailsPanel;
