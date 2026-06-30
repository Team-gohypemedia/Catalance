import React, { memo } from "react";
import Loader from "@/components/common/Loader";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/shared/lib/utils";
import { ProposalFreelancerAvatars } from "./ProposalShared.jsx";
import {
  GENERIC_PROPOSAL_CATEGORIES,
  clientProposalMetricBlockClassName,
  extractAgencyProposalServiceEntries,
  extractProposalDetails,
  getFirstNonEmptyText,
  getProposalFreelancerRecipients,
  proposalCardStatusClasses,
  proposalPanelClassName,
  resolveProposalBusinessName,
  resolveProposalProjectName,
  resolveProposalServiceLabel,
  shouldHideRejectedProposal,
  statusLabels,
  toDisplayTitleCase,
} from "./proposal-utils.js";

const ProposalRowCard = ({
  proposal,
  onDelete,
  onIncreaseBudget,
  onOpen,
  onPay,
  onSend,
  onViewFreelancers,
  isPaying,
  isSending,
}) => {
  const details = extractProposalDetails(proposal);
  const agencyServiceEntries = proposal?.isAgency
    ? extractAgencyProposalServiceEntries(proposal)
    : [];
  const showAgencyServiceBreakdown = agencyServiceEntries.length > 0;
  const isDraft = proposal.status === "draft";
  const canIncreaseBudget =
    Boolean(onIncreaseBudget) && Boolean(proposal?.canIncreaseBudget);
  const canSendToFreelancers =
    Boolean(onSend) &&
    !proposal.requiresPayment &&
    (isDraft || proposal.status === "pending" || proposal.status === "sent");
  const showPrimaryAction = canSendToFreelancers || Boolean(proposal.requiresPayment && onPay);
  const businessName = resolveProposalBusinessName(proposal);
  const displayBusinessName = businessName ? toDisplayTitleCase(businessName) : "";
  const projectName = resolveProposalProjectName(proposal);
  const serviceLabel = resolveProposalServiceLabel(proposal);
  const normalizedServiceType = String(serviceLabel || "").trim();
  const proposalServiceType =
    normalizedServiceType &&
    !GENERIC_PROPOSAL_CATEGORIES.has(normalizedServiceType.toLowerCase())
      ? toDisplayTitleCase(normalizedServiceType)
      : "";
  const showServiceTypeInHeader = Boolean(proposalServiceType) && !showAgencyServiceBreakdown;
  const cardTitle = displayBusinessName || projectName || serviceLabel || "Proposal";
  const freelancerRecipients = getProposalFreelancerRecipients(proposal);
  const canViewFreelancerDetails =
    freelancerRecipients.length > 0 && Boolean(onViewFreelancers);
  const canDeleteProposal = Boolean(onDelete) && !proposal.requiresPayment;
  const rejectionReasonText = shouldHideRejectedProposal(proposal)
    ? ""
    : getFirstNonEmptyText(proposal.rejectionReason);
  const showRejectionReason = proposal.status === "rejected" && Boolean(rejectionReasonText);
  const recipientCount = freelancerRecipients.length;
  const primaryActionLabel = canSendToFreelancers
    ? canIncreaseBudget
      ? "Increase Budget"
      : isSending
        ? "Sending..."
        : "Send Proposal"
    : proposal.requiresPayment && onPay
      ? isPaying
        ? "Processing..."
        : "Approve & Pay"
      : "";
  const showRecipientSection = isDraft || recipientCount > 0;

  return (
    <Card className={cn("h-full w-full min-h-[28rem] overflow-hidden shadow-none flex flex-col", proposalPanelClassName)}>
      <CardContent className="p-0 flex-1 flex flex-col">
        <div className="flex flex-1 w-full flex-col gap-4 p-3 xs:p-3.5 sm:gap-5 sm:p-4 xl:p-5">
          <div className="flex w-full items-center justify-between gap-3">
            <Badge
              variant="outline"
              className={cn(
                "rounded-full border bg-transparent px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
                proposalCardStatusClasses[proposal.status] ||
                  proposalCardStatusClasses.pending,
              )}
            >
              {statusLabels[proposal.status] || "Pending"}
            </Badge>

            <span className="ml-auto whitespace-nowrap text-[11px] font-medium normal-case tracking-[0.08em] text-muted-foreground">
              {proposal.submittedDate}
            </span>

            {canDeleteProposal ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onDelete(proposal)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <h3
                className="w-full truncate text-[clamp(1.05rem,1.3vw,1.4rem)] font-semibold leading-[1.08] tracking-[-0.04em] text-foreground"
                title={cardTitle}
              >
                {cardTitle}
              </h3>
              {showServiceTypeInHeader ? (
                <p
                  className="mt-1 w-full truncate text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                  title={proposalServiceType}
                >
                  {proposalServiceType}
                </p>
              ) : null}
              {showRejectionReason ? (
                <div className="max-w-[24rem] space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-destructive/80">
                    Freelancer response
                  </p>
                  <p
                    className="text-sm font-medium leading-6 text-destructive/90"
                    title={rejectionReasonText}
                  >
                    {rejectionReasonText}
                  </p>
                </div>
              ) : null}
            </div>

            {showAgencyServiceBreakdown ? (
              <div className="overflow-hidden rounded-[18px] border border-border/70 bg-background/35">
                <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,0.9fr)_minmax(0,0.9fr)] gap-3 px-4 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:px-5">
                  <p className="min-w-0">Service</p>
                  <p className="min-w-0">Budget</p>
                  <p className="min-w-0">Timeline</p>
                </div>

                <div className="divide-y divide-border/70">
                  {agencyServiceEntries.map((entry, index) => (
                    <div
                      key={`${entry.name}-${index}`}
                      className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,0.9fr)_minmax(0,0.9fr)] gap-3 px-4 py-3 sm:px-5"
                    >
                      <p className="min-w-0 break-words text-[0.72rem] font-medium leading-5 text-foreground sm:text-[0.78rem]">
                        {entry.name}
                      </p>
                      <p className="min-w-0 break-words text-[0.72rem] font-semibold leading-5 text-foreground sm:text-[0.78rem]">
                        {entry.budget}
                      </p>
                      <p className="min-w-0 break-words text-[0.72rem] font-semibold leading-5 text-foreground sm:text-[0.78rem]">
                        {entry.timeline}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div
                  className={clientProposalMetricBlockClassName}
                  style={{ containerType: "inline-size" }}
                >
                  <p className="whitespace-nowrap text-[0.68rem] sm:text-[0.72rem] font-semibold uppercase tracking-[0.08em] sm:tracking-[0.16em] text-muted-foreground">
                    Budget
                  </p>
                  <div className="mt-2 whitespace-nowrap text-[clamp(0.68rem,5cqi,1.2rem)] font-semibold leading-none tracking-[-0.03em] text-foreground">
                    {details.budget}
                  </div>
                </div>

                <div
                  className={clientProposalMetricBlockClassName}
                  style={{ containerType: "inline-size" }}
                >
                  <p className="whitespace-nowrap text-[0.68rem] sm:text-[0.72rem] font-semibold uppercase tracking-[0.08em] sm:tracking-[0.16em] text-muted-foreground">
                    Timeline
                  </p>
                  <div className="mt-2 whitespace-nowrap text-[clamp(0.68rem,5cqi,1.2rem)] font-semibold leading-none tracking-[-0.03em] text-foreground">
                    {details.delivery}
                  </div>
                </div>
              </div>
            )}

            {showRecipientSection ? (
              <div className="rounded-[14px] border border-border/70 bg-background/35 p-3">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                    Proposal Sent To
                  </p>
                  {canViewFreelancerDetails ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary/80"
                      onClick={() => onViewFreelancers?.(proposal)}
                    >
                      {recipientCount > 0 ? (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[10px] font-semibold text-primary">
                          {recipientCount}
                        </span>
                      ) : null}
                      <span>View All</span>
                    </button>
                  ) : null}
                </div>

                {recipientCount > 0 ? (
                  <ProposalFreelancerAvatars
                    proposal={proposal}
                    avatarClassName="h-9 w-9"
                    stackClassName="-space-x-2.5"
                    maxVisible={4}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No freelancers selected yet.
                  </p>
                )}
              </div>
            ) : null}
          </div>

          <div className="mt-auto flex flex-col gap-2">
            {showPrimaryAction ? (
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button
                  type="button"
                  className="h-10 w-full rounded-[12px] border border-border bg-background/35 px-2 tracking-tight text-[10px] font-semibold text-foreground shadow-none hover:bg-background xl:px-3 xl:text-[0.75rem]"
                  onClick={() => onOpen?.(proposal)}
                >
                  View Details
                </Button>

                <Button
                  type="button"
                  className="h-10 w-full rounded-[12px] bg-primary px-2 tracking-tight text-[10px] font-semibold text-primary-foreground shadow-none hover:bg-primary/90 xl:px-3 xl:text-[0.75rem]"
                  onClick={() => {
                    if (canSendToFreelancers) {
                      if (canIncreaseBudget) {
                        onIncreaseBudget?.(proposal);
                        return;
                      }

                      onSend?.(proposal);
                      return;
                    }

                    if (proposal.requiresPayment && onPay) {
                      onPay(proposal);
                    }
                  }}
                  disabled={isSending || isPaying}
                >
                  {isSending || isPaying ? (
                    <Loader size="sm" className="mr-2" />
                  ) : null}
                  {primaryActionLabel}
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                className="h-10 w-full rounded-[12px] bg-primary px-3 tracking-tight text-[0.8rem] font-semibold text-primary-foreground shadow-none hover:bg-primary/90 xl:px-5"
                onClick={() => onOpen?.(proposal)}
              >
                {proposal.status === "rejected"
                  ? "View Details"
                  : "View Proposal"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(ProposalRowCard);
