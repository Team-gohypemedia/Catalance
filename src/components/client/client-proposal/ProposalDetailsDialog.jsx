import React, { memo, useMemo } from "react";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Layers3 from "lucide-react/dist/esm/icons/layers-3";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Pencil from "lucide-react/dist/esm/icons/pencil";
import Send from "lucide-react/dist/esm/icons/send";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import UserRound from "lucide-react/dist/esm/icons/user-round";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/shared/lib/utils";
import {
  ProposalMetric,
  ProposalSectionCard,
  ProposalStructuredList,
  ProposalSummaryItem,
} from "./ProposalShared.jsx";
import {
  buildProposalStructuredData,
  extractProposalDetails,
  getDisplayName,
  normalizeProposalStatus,
  resolveProposalServiceLabel,
  resolveProposalTitle,
  statusColors,
  statusLabels,
} from "./proposal-utils.js";

const ProposalDetailsDialog = ({
  user,
  activeProposal,
  isViewing,
  isLoadingProposal,
  isEditingProposal,
  isSavingProposal,
  editableProposalDraft,
  processingPaymentProposalId,
  sendingProposalId,
  handleProposalDialogOpenChange,
  handleEditableProposalDraftChange,
  handleSaveProposalChanges,
  handleCancelProposalEditing,
  handleDelete,
  handleApproveAndPay,
  openFreelancerSelection,
  startEditingProposal,
}) => {
  const headerDisplayName = getDisplayName(user);
  const activeProposalDetails = activeProposal ? extractProposalDetails(activeProposal) : null;
  const activeProposalStructuredData = useMemo(
    () =>
      activeProposal
        ? buildProposalStructuredData(activeProposal, headerDisplayName)
        : null,
    [activeProposal, headerDisplayName],
  );
  const canEditActiveProposal = useMemo(() => {
    const normalizedStatus = normalizeProposalStatus(activeProposal?.status || "");
    return (
      Boolean(activeProposal) &&
      !activeProposal?.requiresPayment &&
      (normalizedStatus === "draft" ||
        normalizedStatus === "pending" ||
        normalizedStatus === "sent")
    );
  }, [activeProposal?.requiresPayment, activeProposal?.status]);
  const proposalModalTitle = useMemo(() => {
    const baseTitle = resolveProposalTitle(activeProposal) || "Proposal";
    if (!isEditingProposal) return baseTitle;
    return String(editableProposalDraft.title || "").trim() || baseTitle;
  }, [activeProposal, editableProposalDraft.title, isEditingProposal]);

  return (
    <Dialog
      open={isViewing && Boolean(activeProposal)}
      onOpenChange={handleProposalDialogOpenChange}
    >
      <DialogContent className="flex max-h-[92vh] w-[min(92vw,820px)] flex-col overflow-hidden border border-border/60 bg-accent p-0 sm:max-w-[820px] [&>button]:right-5 [&>button]:top-5 [&>button]:z-10 [&>button]:rounded-full [&>button]:border [&>button]:border-white/10 [&>button]:bg-background/60 [&>button]:p-1.5 [&>button]:opacity-100 [&>button]:transition-colors [&>button:hover]:bg-background/80 [&>button:hover]:text-white [&>button_svg]:h-4 [&>button_svg]:w-4">
        <div className="shrink-0 border-b border-white/10 px-6 py-5">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="text-2xl font-semibold tracking-tight text-foreground">
                    {proposalModalTitle}
                  </DialogTitle>
                  {activeProposal?.status ? (
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]",
                        statusColors[activeProposal.status] || statusColors.pending,
                      )}
                    >
                      {statusLabels[activeProposal.status] || activeProposal.status}
                    </Badge>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <Badge
                    variant="outline"
                    className="h-9 w-fit rounded-full border-white/10 bg-background/40 px-3.5 text-[#a6adbb]"
                  >
                    {activeProposal?.submittedDate || "No date"}
                  </Badge>
                  <span className="text-xs uppercase tracking-[0.18em] text-[#64748b]">
                    Last updated
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pr-10 sm:justify-end sm:pr-12">
                {canEditActiveProposal ? (
                  isEditingProposal ? (
                    <>
                      <Button
                        variant="outline"
                        className="h-11 rounded-full border-white/10 bg-background/30 px-5 text-white hover:bg-background/50"
                        onClick={handleCancelProposalEditing}
                        disabled={isSavingProposal}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="h-11 rounded-full bg-primary px-5 text-[#141414] hover:bg-primary/90"
                        onClick={handleSaveProposalChanges}
                        disabled={isSavingProposal}
                      >
                        {isSavingProposal ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        {isSavingProposal ? "Saving..." : "Save Changes"}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      className="h-11 rounded-full border-primary/25 bg-primary/10 px-5 text-primary hover:bg-primary/15"
                      onClick={startEditingProposal}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Proposal
                    </Button>
                  )
                ) : null}
              </div>
            </div>

            <DialogDescription className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {activeProposal?.status === "draft"
                ? "Review the draft, polish the scope, and send it to the right freelancer."
                : canEditActiveProposal
                  ? "Review the proposal details and update the scope while the freelancer decision is still pending."
                  : "Review the proposal details, payment status, and delivery expectations."}
            </DialogDescription>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 [scrollbar-color:rgba(255,255,255,0.18)_transparent] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-2">
          <div className="space-y-8 pb-2">
            <section className="space-y-3">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#64748b]">
                  01 Project Summary
                </p>
                <h3 className="text-lg font-semibold tracking-tight text-white">
                  Start with the essentials
                </h3>
                <p className="text-sm leading-6 text-[#94a3b8]">
                  Review the project name, client details, service, and budget before diving
                  into the full scope.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <ProposalMetric
                  icon={FileText}
                  label="Project Name"
                  value={
                    isEditingProposal ? (
                      <Input
                        value={editableProposalDraft.title}
                        onChange={(event) =>
                          handleEditableProposalDraftChange("title", event.target.value)
                        }
                        className="h-11 border-white/10 bg-background/60 text-white placeholder:text-[#6f7785] focus-visible:border-[#ffc107]/45 focus-visible:ring-[#ffc107]/20"
                        placeholder="Project name"
                      />
                    ) : (
                      resolveProposalTitle(activeProposal) || "Not set"
                    )
                  }
                />
                <ProposalMetric
                  icon={UserRound}
                  label="Client Name"
                  value={
                    isEditingProposal ? (
                      <Input
                        value={editableProposalDraft.clientName}
                        onChange={(event) =>
                          handleEditableProposalDraftChange("clientName", event.target.value)
                        }
                        className="h-11 border-white/10 bg-background/60 text-white placeholder:text-[#6f7785] focus-visible:border-[#ffc107]/45 focus-visible:ring-[#ffc107]/20"
                        placeholder="Client name"
                      />
                    ) : (
                      activeProposalStructuredData?.clientName || headerDisplayName
                    )
                  }
                />
                <ProposalMetric
                  icon={Layers3}
                  label="Service"
                  value={
                    isEditingProposal ? (
                      <Input
                        value={editableProposalDraft.service}
                        onChange={(event) =>
                          handleEditableProposalDraftChange("service", event.target.value)
                        }
                        className="h-11 border-white/10 bg-background/60 text-white placeholder:text-[#6f7785] focus-visible:border-[#ffc107]/45 focus-visible:ring-[#ffc107]/20"
                        placeholder="Service"
                      />
                    ) : (
                      resolveProposalServiceLabel(activeProposal)
                    )
                  }
                />
                <ProposalMetric
                  icon={CreditCard}
                  label="Budget"
                  value={
                    isEditingProposal ? (
                      <Input
                        value={editableProposalDraft.budget}
                        onChange={(event) =>
                          handleEditableProposalDraftChange("budget", event.target.value)
                        }
                        className="h-11 border-white/10 bg-background/60 text-white placeholder:text-[#6f7785] focus-visible:border-[#ffc107]/45 focus-visible:ring-[#ffc107]/20"
                        placeholder="e.g. 40000"
                      />
                    ) : (
                      activeProposalDetails?.budget || "Not set"
                    )
                  }
                />
              </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.95fr)]">
              <section className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#64748b]">
                    02 Project Scope
                  </p>
                  <h3 className="text-lg font-semibold tracking-tight text-white">
                    What the project includes
                  </h3>
                </div>
                <ProposalSectionCard
                  title="Project Overview"
                  description="A clean summary of the project direction and business context."
                >
                  {isLoadingProposal ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading details...
                    </div>
                  ) : isEditingProposal ? (
                    <Textarea
                      value={editableProposalDraft.projectOverview}
                      onChange={(event) =>
                        handleEditableProposalDraftChange("projectOverview", event.target.value)
                      }
                      className="min-h-[180px] border-white/10 bg-background/60 text-white placeholder:text-[#6f7785] focus-visible:border-[#ffc107]/45 focus-visible:ring-[#ffc107]/20"
                      placeholder="Summarize the project, business context, and intended outcome."
                    />
                  ) : (
                    <p className="text-sm leading-7 text-white">
                      {activeProposalStructuredData?.projectOverview || "No overview added yet."}
                    </p>
                  )}
                </ProposalSectionCard>

                <div className="grid gap-4 lg:grid-cols-2">
                  <ProposalSectionCard
                    title="Primary Objectives"
                    description="Key goals this proposal is meant to deliver."
                    className="h-full"
                  >
                    {isEditingProposal ? (
                      <Textarea
                        value={editableProposalDraft.objectivesText}
                        onChange={(event) =>
                          handleEditableProposalDraftChange("objectivesText", event.target.value)
                        }
                        className="min-h-[220px] border-white/10 bg-background/60 text-white placeholder:text-[#6f7785] focus-visible:border-[#ffc107]/45 focus-visible:ring-[#ffc107]/20"
                        placeholder={"One objective per line\nExample: Launch MVP for internal testing"}
                      />
                    ) : (
                      <ProposalStructuredList
                        items={activeProposalStructuredData?.objectives || []}
                        emptyMessage="No objectives added yet."
                      />
                    )}
                  </ProposalSectionCard>

                  <ProposalSectionCard
                    title="Deliverables"
                    description="The concrete scope and outputs expected from this proposal."
                    className="h-full"
                  >
                    {isEditingProposal ? (
                      <Textarea
                        value={editableProposalDraft.deliverablesText}
                        onChange={(event) =>
                          handleEditableProposalDraftChange("deliverablesText", event.target.value)
                        }
                        className="min-h-[220px] border-white/10 bg-background/60 text-white placeholder:text-[#6f7785] focus-visible:border-[#ffc107]/45 focus-visible:ring-[#ffc107]/20"
                        placeholder={"One deliverable per line\nExample: Admin dashboard with analytics"}
                      />
                    ) : (
                      <ProposalStructuredList
                        items={activeProposalStructuredData?.deliverables || []}
                        emptyMessage="No deliverables added yet."
                      />
                    )}
                  </ProposalSectionCard>
                </div>
              </section>

              <section className="space-y-4 xl:sticky xl:top-0">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#64748b]">
                    03 Technical And Delivery
                  </p>
                  <h3 className="text-lg font-semibold tracking-tight text-white">
                    Supporting details
                  </h3>
                </div>
                <ProposalSectionCard
                  title={isEditingProposal ? "Delivery Details" : "Project Details"}
                  description={
                    isEditingProposal
                      ? "Update the timeline and review the current proposal status."
                      : "Keep track of the delivery window and proposal state."
                  }
                >
                  {isEditingProposal ? (
                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                            Timeline
                          </p>
                          <Input
                            value={editableProposalDraft.timeline}
                            onChange={(event) =>
                              handleEditableProposalDraftChange("timeline", event.target.value)
                            }
                            className="h-11 border-white/10 bg-background/60 text-white placeholder:text-[#6f7785] focus-visible:border-[#ffc107]/45 focus-visible:ring-[#ffc107]/20"
                            placeholder="e.g. 3+ months"
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 border-t border-white/8 pt-4 sm:grid-cols-2">
                        <ProposalSummaryItem
                          label="Current Status"
                          value={activeProposalDetails?.statusDisplay || "Draft"}
                        />
                        <ProposalSummaryItem
                          label="Last Updated"
                          value={activeProposal?.submittedDate || "No date"}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                      <ProposalSummaryItem
                        label="Project Name"
                        value={resolveProposalTitle(activeProposal) || "Not set"}
                      />
                      <ProposalSummaryItem
                        label="Timeline"
                        value={activeProposalDetails?.delivery || "Not set"}
                      />
                      <ProposalSummaryItem
                        label="Current Status"
                        value={activeProposalDetails?.statusDisplay || "Draft"}
                      />
                      <ProposalSummaryItem
                        label="Last Updated"
                        value={activeProposal?.submittedDate || "No date"}
                      />
                    </div>
                  )}
                </ProposalSectionCard>

                <ProposalSectionCard
                  title="Tech Stack"
                  description="Preferred platforms, frameworks, and tools."
                >
                  {isEditingProposal ? (
                    <Textarea
                      value={editableProposalDraft.techStackText}
                      onChange={(event) =>
                        handleEditableProposalDraftChange("techStackText", event.target.value)
                      }
                      className="min-h-[160px] border-white/10 bg-background/60 text-white placeholder:text-[#6f7785] focus-visible:border-[#ffc107]/45 focus-visible:ring-[#ffc107]/20"
                      placeholder={"One technology per line\nExample: Next.js"}
                    />
                  ) : Array.isArray(activeProposalStructuredData?.techStack) &&
                    activeProposalStructuredData.techStack.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {activeProposalStructuredData.techStack.map((item) => (
                        <Badge
                          key={item}
                          variant="outline"
                          className="rounded-full border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
                        >
                          {item}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm leading-6 text-[#94a3b8]">
                      No tech stack added yet.
                    </p>
                  )}
                </ProposalSectionCard>

                <ProposalSectionCard
                  title="Delivery Notes"
                  description="Extra constraints, assumptions, or handover expectations."
                >
                  {isEditingProposal ? (
                    <Textarea
                      value={editableProposalDraft.notes}
                      onChange={(event) =>
                        handleEditableProposalDraftChange("notes", event.target.value)
                      }
                      className="min-h-[180px] border-white/10 bg-background/60 text-white placeholder:text-[#6f7785] focus-visible:border-[#ffc107]/45 focus-visible:ring-[#ffc107]/20"
                      placeholder="Add any assumptions, dependencies, or special notes."
                    />
                  ) : (
                    <p className="text-sm leading-7 text-white">
                      {activeProposalStructuredData?.notes || "No delivery notes added yet."}
                    </p>
                  )}
                </ProposalSectionCard>
              </section>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 flex flex-col gap-4 border-t border-white/10 bg-accent/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-6 text-muted-foreground">
            Use the action buttons to continue the proposal lifecycle from here.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {activeProposal?.status === "draft" && !activeProposal?.requiresPayment ? (
              <Button
                variant="outline"
                className="h-11 rounded-full border-primary/25 bg-primary/10 px-5 text-primary hover:bg-primary/15"
                onClick={() => openFreelancerSelection(activeProposal)}
                disabled={sendingProposalId === activeProposal?.id}
              >
                {sendingProposalId === activeProposal?.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {sendingProposalId === activeProposal?.id
                  ? "Sending..."
                  : "Send to Freelancers"}
              </Button>
            ) : null}

            {activeProposal?.requiresPayment ? (
              <Button
                className="rounded-full bg-emerald-500 text-black hover:bg-emerald-400"
                onClick={() => handleApproveAndPay(activeProposal)}
                disabled={processingPaymentProposalId === activeProposal?.id}
              >
                {processingPaymentProposalId === activeProposal?.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                {processingPaymentProposalId === activeProposal?.id
                  ? "Processing..."
                  : "Approve & Pay"}
              </Button>
            ) : null}

            {activeProposal && !activeProposal.requiresPayment ? (
              <Button
                variant="ghost"
                className="h-11 rounded-full px-3 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-300"
                onClick={() => handleDelete(activeProposal)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default memo(ProposalDetailsDialog);
