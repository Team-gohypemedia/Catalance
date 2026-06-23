import React, { memo } from "react";
import Loader from "@/components/common/Loader";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/shared/lib/utils";
import {
  canUnsendProposalInvitee,
  getInitials,
  getProposalFreelancerRecipients,
  proposalCardStatusClasses,
  resolveProposalTitle,
  statusLabels,
} from "./proposal-utils.js";

const ProposalFreelancerDetailsDialog = ({
  proposal,
  open,
  onOpenChange,
  onUnsend,
  unsendingProposalId,
}) => {
  const recipients = getProposalFreelancerRecipients(proposal);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-[52rem] flex-col overflow-hidden border border-border/60 dark:border-white/10 bg-[linear-gradient(180deg,#ffffff,#faf9f6)] dark:bg-[linear-gradient(180deg,rgba(18,18,20,0.98),rgba(23,23,25,0.98))] p-0 text-foreground dark:text-white">
        <div className="flex-shrink-0 border-b border-border/60 dark:border-white/10 px-6 py-5">
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="text-xl font-semibold tracking-tight text-foreground dark:text-white">
              Freelancer details
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-muted-foreground dark:text-[#94a3b8]">
              {recipients.length > 1
                ? `${recipients.length} freelancers have received this proposal for ${resolveProposalTitle(proposal) || "this project"}.`
                : `Review who received this proposal for ${resolveProposalTitle(proposal) || "this project"}.`}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {recipients.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {recipients.map((invitee) => {
                const status = String(invitee?.status || "").toLowerCase();
                const canUnsend = canUnsendProposalInvitee(invitee);
                const isUnsending = unsendingProposalId === invitee?.proposalId;

                return (
                  <div
                    key={invitee?.proposalId || invitee?.id}
                    className="flex flex-col gap-3 rounded-2xl border border-border dark:border-white/10 bg-background/40 dark:bg-white/[0.03] p-4 transition-colors hover:border-border/80 dark:hover:border-white/15 hover:bg-background/80 dark:hover:bg-white/[0.05]"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-11 w-11 shrink-0 border border-border dark:border-white/10">
                        <AvatarImage src={invitee?.avatar} alt={invitee?.name} />
                        <AvatarFallback className="bg-muted dark:bg-[#111214] text-sm font-bold text-primary">
                          {getInitials(invitee?.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground dark:text-white">
                          {invitee?.name || "Freelancer"}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground dark:text-[#94a3b8]">
                          Sent {invitee?.submittedDate || "recently"}
                        </p>
                      </div>

                      <Badge
                        variant="outline"
                        className={cn(
                          "shrink-0 rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em]",
                          proposalCardStatusClasses[status] || proposalCardStatusClasses.pending,
                        )}
                      >
                        {statusLabels[status] || "Pending"}
                      </Badge>
                    </div>

                    {invitee.rejectionReason && status === "rejected" ? (
                      <div className="rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-[linear-gradient(145deg,rgba(244,63,94,0.14),rgba(244,63,94,0.04))] px-3.5 py-3">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-rose-600 dark:text-rose-300/85">
                          Freelancer response
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-rose-950 dark:text-rose-100">
                          {invitee.rejectionReason}
                        </p>
                      </div>
                    ) : canUnsend ? (
                      <Button
                        className="h-8 w-full rounded-full bg-[#141414] text-white hover:bg-black/90 dark:bg-white dark:text-[#141414] dark:hover:bg-white/90 px-4 text-xs font-semibold"
                        onClick={() => onUnsend?.(invitee)}
                        disabled={isUnsending}
                      >
                        {isUnsending ? (
                          <Loader size="sm" className="mr-1.5" />
                        ) : (
                          <Trash2 className="mr-1.5 h-3 w-3" />
                        )}
                        {isUnsending ? "Unsending..." : "Unsend Proposal"}
                      </Button>
                    ) : (
                      <p className="text-center text-[11px] text-muted-foreground dark:text-[#7f8795]">
                        Invite can no longer be unsent
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[22px] border border-dashed border-border dark:border-white/10 bg-background/20 dark:bg-white/[0.02] px-5 py-8 text-center">
              <p className="text-sm text-muted-foreground dark:text-[#94a3b8]">
                No freelancers have been linked to this proposal yet.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default memo(ProposalFreelancerDetailsDialog);
