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
          <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-white/[0.06] bg-[#202020] text-[#ffc107]">
            <SendHorizontal className="size-6" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-white">
            Select a request
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#8f96a3]">
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
          "sticky top-0 z-10 border-b border-white/[0.06] bg-card",
          mobileView ? "px-4 py-4" : "px-5 py-5 md:px-7",
        )}
      >
        <div className="flex items-start gap-3">
          {mobileView ? (
            <button
              type="button"
              onClick={onBack}
              className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-white transition hover:bg-white/[0.06]"
              aria-label="Back to requests"
            >
              <ChevronLeft className="size-5" />
            </button>
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-2">
              <p className="truncate text-[1.2rem] font-semibold tracking-[-0.3px] text-white">
                {getFirstNonEmptyText(
                  request.serviceTitle,
                  request.title,
                  "Marketplace Request",
                )}
              </p>
              <p className="truncate text-sm text-[#cbd5e1]">
                {memberNames ||
                  getFirstNonEmptyText(request.clientName, request.freelancerName)}
              </p>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#7f8795]">
                Pending freelancer review
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6">
        <div className="mx-auto flex w-full max-w-[980px] flex-col gap-5">
          <div className="rounded-[24px] border border-white/[0.06] bg-background/40 p-5 md:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-base font-semibold text-white">
                  {getFirstNonEmptyText(request.freelancerName, "Freelancer")}
                </p>
                <p className="mt-1 text-sm text-[#8f96a3]">
                  Marketplace request sent
                </p>
              </div>
              <span className="text-xs uppercase tracking-[0.16em] text-[#7f8795]">
                {formatConversationTimestamp(request.updatedAt || request.createdAt)}
              </span>
            </div>

            <div className="mt-5 rounded-[20px] border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm leading-7 text-[#d7dee8]">
              {request.requestMessage || request.previewText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default RequestDetailsPanel;
