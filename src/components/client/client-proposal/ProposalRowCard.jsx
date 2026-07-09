import React, { memo, useState, useMemo } from "react";
import Loader from "@/components/common/Loader";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import MoreVertical from "lucide-react/dist/esm/icons/more-vertical";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Eye from "lucide-react/dist/esm/icons/eye";
import Send from "lucide-react/dist/esm/icons/send";
import XCircle from "lucide-react/dist/esm/icons/x-circle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/shared/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
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

const parseProposalString = (text) => {
  if (!text) return null;

  const result = {
    clientName: "",
    businessName: "",
    serviceType: "",
    projectOverview: "",
    objectives: [],
    deliverables: [],
    techStack: {
      frontend: "",
      backend: "",
      database: "",
      hosting: "",
    }
  };

  const extractMatch = (regex) => {
    const match = text.match(regex);
    return match ? match[1].trim() : "";
  };

  result.clientName = extractMatch(/Client Name:\s*(.*?)(?=\s*Business Name:|\s*$)/i);
  result.businessName = extractMatch(/Business Name:\s*(.*?)(?=\s*Service Type:|\s*$)/i);
  result.serviceType = extractMatch(/Service Type:\s*(.*?)(?=\s*Project Overview:|\s*$)/i);
  
  result.projectOverview = extractMatch(/Project Overview:\s*(.*?)(?=\s*Primary Objectives:|\s*Features\/Deliverables Included:|\s*$)/is);
  
  const objectivesText = extractMatch(/Primary Objectives:\s*(.*?)(?=\s*Features\/Deliverables Included:|\s*$)/is);
  if (objectivesText) {
    result.objectives = objectivesText.split(/[-*•\n]+/).map(s => s.trim()).filter(s => s.length > 0);
  }

  const deliverablesText = extractMatch(/Features\/Deliverables Included:\s*(.*?)(?=\s*Website Type:|\s*Design Style:|\s*Website Build Type:|\s*$)/is);
  if (deliverablesText) {
    result.deliverables = deliverablesText.split(/[-*•\n]+/).map(s => s.trim()).filter(s => s.length > 0);
  }

  result.techStack.frontend = extractMatch(/Frontend Framework:\s*(.*?)(?=\s*Backend Technology:|\s*$)/i) || extractMatch(/Frontend:\s*(.*?)(?=\s*Backend:|\s*$)/i);
  result.techStack.backend = extractMatch(/Backend Technology:\s*(.*?)(?=\s*Database:|\s*$)/i) || extractMatch(/Backend:\s*(.*?)(?=\s*Database:|\s*$)/i);
  result.techStack.database = extractMatch(/Database:\s*(.*?)(?=\s*Hosting:|\s*$)/i);
  result.techStack.hosting = extractMatch(/Hosting:\s*(.*?)(?=\s*Page Count:|\s*Launch Timeline:|\s*$)/i);

  if (!result.projectOverview && result.objectives.length === 0 && result.deliverables.length === 0) {
    return null;
  }

  return result;
};

const ProposalRowCard = ({
  proposal,
  onDelete,
  onIncreaseBudget,
  onOpen,
  onPay,
  onSend,
  onAcceptApplication,
  onRejectApplication,
  onViewFreelancers,
  isPaying,
  isSending,
  isAccepting,
  isRejecting,
}) => {
  const details = extractProposalDetails(proposal);
  const agencyServiceEntries = proposal?.isAgency
    ? extractAgencyProposalServiceEntries(proposal)
    : [];
  const showAgencyServiceBreakdown = agencyServiceEntries.length > 0;
  const isDraft = proposal.status === "draft";
  const isMarketplaceApplication = Boolean(proposal.isMarketplaceApplication);
  const canIncreaseBudget =
    Boolean(onIncreaseBudget) && Boolean(proposal?.canIncreaseBudget);
  const canSendToFreelancers =
    Boolean(onSend) &&
    !proposal.requiresPayment &&
    !isMarketplaceApplication &&
    (isDraft || proposal.status === "pending" || proposal.status === "sent");
  const canAcceptApplication = Boolean(onAcceptApplication) && isMarketplaceApplication;
  const showPrimaryAction = canSendToFreelancers || canAcceptApplication || Boolean(proposal.requiresPayment && onPay);
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
  const primaryActionLabel = canAcceptApplication
    ? isAccepting
      ? "Accepting..."
      : "Accept Application"
    : canSendToFreelancers
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
  const showRecipientSection = isDraft || isMarketplaceApplication || recipientCount > 0;

  const [overviewExpanded, setOverviewExpanded] = useState(false);
  const [objectivesExpanded, setObjectivesExpanded] = useState(false);

  const parsedData = useMemo(() => {
    return parseProposalString(proposal.content || proposal.summary || "");
  }, [proposal.content, proposal.summary]);

  const projectOverview = parsedData?.projectOverview || proposal.summary || proposal.content || "";
  const objectives = parsedData?.objectives || [];

  const dateStr = useMemo(() => {
    const rawDate = proposal.submittedDate || proposal.updatedAt || proposal.createdAt;
    if (!rawDate) return "No date";
    const parsed = new Date(rawDate);
    if (isNaN(parsed.getTime())) return String(rawDate);
    return parsed.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [proposal.submittedDate, proposal.updatedAt, proposal.createdAt]);

  return (
    <Card className="h-full w-full min-h-[28rem] overflow-hidden border border-border bg-card p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] transition-transform duration-200 hover:-translate-y-1 flex flex-col">
      <CardContent className="p-0 flex-1 flex flex-col">
        <div className="w-full min-w-0 flex-1 flex flex-col">
          {/* Top Header Section */}
          <div className="flex items-center justify-between">
            <div className={cn(
              "inline-flex items-center justify-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              proposal.status === "draft"
                ? "bg-[#FFF0EA] text-[#FF6A39] dark:bg-primary/10 dark:text-primary"
                : proposal.status === "accepted"
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-350"
                : proposal.status === "rejected"
                ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-350"
                : "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-350"
            )}>
              {statusLabels[proposal.status] || "Pending"}
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
                {dateStr}
              </span>

              {canDeleteProposal ? (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                      aria-label="Draft options"
                    >
                      <MoreVertical className="size-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl border border-border bg-card p-1 shadow-md">
                    <DropdownMenuItem
                      onClick={() => onDelete(proposal)}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                      <span>Delete Draft</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
          </div>

          {/* Title */}
          <h3
            title={cardTitle}
            className="mt-4 truncate text-xl font-bold tracking-tight text-foreground"
          >
            {cardTitle}
          </h3>

          {/* Service Type Line */}
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Briefcase className="size-3.5 text-muted-foreground/70 shrink-0" />
            <span className="truncate">Service: {proposalServiceType || "General"}</span>
          </div>

          {showRejectionReason ? (
            <div className="mt-4 max-w-[24rem] space-y-1.5">
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

          {/* Collapsible Sections Container */}
          <div className="mt-4 flex flex-col gap-2.5">
            {/* Project Overview Collapsible Box */}
            {projectOverview && (
              <div className="border border-border/60 bg-background rounded-xl overflow-hidden">
                <div
                  onClick={() => setOverviewExpanded(!overviewExpanded)}
                  className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-muted/30 transition-colors"
                >
                  <span className="text-xs font-semibold text-foreground">Project Overview</span>
                  {overviewExpanded ? (
                    <ChevronUp className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  )}
                </div>
                {overviewExpanded && (
                  <div className="border-t border-border/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground bg-muted/10">
                    {projectOverview}
                  </div>
                )}
              </div>
            )}

            {/* Key Objectives Collapsible Box */}
            {objectives.length > 0 && (
              <div className="border border-border/60 bg-background rounded-xl overflow-hidden">
                <div
                  onClick={() => setObjectivesExpanded(!objectivesExpanded)}
                  className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-muted/30 transition-colors"
                >
                  <span className="text-xs font-semibold text-foreground">Key Objectives</span>
                  {objectivesExpanded ? (
                    <ChevronUp className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  )}
                </div>
                {objectivesExpanded && (
                  <div className="border-t border-border/40 px-4 py-3 bg-muted/10">
                    <ul className="flex flex-col gap-2">
                      {objectives.map((obj, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                          <CheckCircle2 className="size-3.5 shrink-0 text-primary mt-[1px]" />
                          <span className="leading-relaxed">{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Breakdown or Budget/Timeline boxes */}
          <div className="mt-4">
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
                <div className="flex flex-col items-center justify-center gap-1 rounded-xl bg-[#F8F9FA] dark:bg-muted/10 py-3.5 text-center">
                  <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground/85 leading-none">Budget</span>
                  <span className="text-[17px] font-extrabold text-foreground truncate max-w-full px-2 mt-1.5">{details.budget}</span>
                </div>
                <div className="flex flex-col items-center justify-center gap-1 rounded-xl bg-[#F8F9FA] dark:bg-muted/10 py-3.5 text-center">
                  <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground/85 leading-none">Timeline</span>
                  <span className="text-[17px] font-extrabold text-foreground truncate max-w-full px-2 mt-1.5">{details.delivery || "Not set"}</span>
                </div>
              </div>
            )}
          </div>

          {/* Recipient / Proposal Sent To section */}
          {showRecipientSection ? (
            <div className="mt-4 rounded-[14px] border border-border/70 bg-background/35 p-3">
              <div className="mb-2 flex items-start justify-between gap-2">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                  {isMarketplaceApplication ? "Applicant" : "Proposal Sent To"}
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
                  onClick={() => onViewFreelancers?.(proposal)}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No freelancers selected yet.
                </p>
              )}
            </div>
          ) : null}

          {/* Action Buttons */}
          <div className="mt-5 flex items-center gap-3 w-full">
            {showPrimaryAction ? (
              <div className={cn("w-full flex flex-col gap-2.5", !canAcceptApplication && "grid grid-cols-2 gap-3")}>
                {canAcceptApplication ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 w-full">
                      <button
                        type="button"
                        onClick={() => onOpen?.(proposal)}
                        className="flex-1 flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F8F9FA] dark:bg-white/[0.06] hover:bg-muted/80 dark:hover:bg-white/[0.1] text-xs font-bold text-foreground transition-colors cursor-pointer border border-transparent"
                      >
                        <Eye className="size-4 text-muted-foreground" />
                        <span>View Details</span>
                      </button>

                      <button
                        type="button"
                        disabled={isRejecting}
                        onClick={() => onRejectApplication?.(proposal)}
                        className="flex-1 flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-xs font-bold text-rose-600 dark:text-rose-400 transition-colors cursor-pointer border border-transparent"
                      >
                        {isRejecting ? (
                          <Loader size="sm" className="mr-2" />
                        ) : (
                          <XCircle className="size-3.5" />
                        )}
                        <span>Reject</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={isAccepting}
                      onClick={() => onAcceptApplication?.(proposal)}
                      className="w-full flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] hover:bg-primary/80 text-xs font-bold text-white dark:text-[#141414] transition-colors cursor-pointer"
                    >
                      {isAccepting ? (
                        <Loader size="sm" className="mr-2" />
                      ) : (
                        <CheckCircle2 className="size-3.5" />
                      )}
                      <span>Accept Application</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onOpen?.(proposal)}
                      className="flex-1 flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F8F9FA] dark:bg-white/[0.06] hover:bg-muted/80 dark:hover:bg-white/[0.1] text-xs font-bold text-foreground transition-colors cursor-pointer border border-transparent"
                    >
                      <Eye className="size-4 text-muted-foreground" />
                      <span>View Details</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSending || isPaying || isAccepting}
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
                      className="flex-1 flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] hover:bg-primary/80 text-xs font-bold text-white dark:text-[#141414] transition-colors cursor-pointer"
                    >
                      {isSending || isPaying || isAccepting ? (
                        <Loader size="sm" className="mr-2" />
                      ) : (
                        <Send className="size-3.5" />
                      )}
                      <span>{primaryActionLabel}</span>
                    </button>
                  </>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onOpen?.(proposal)}
                className="w-full flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F8F9FA] dark:bg-white/[0.06] hover:bg-muted/80 dark:hover:bg-white/[0.1] text-xs font-bold text-foreground transition-colors cursor-pointer border border-transparent"
              >
                <Eye className="size-4 text-muted-foreground" />
                <span>
                  {proposal.status === "rejected"
                    ? "View Details"
                    : "View Proposal"}
                </span>
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(ProposalRowCard);
