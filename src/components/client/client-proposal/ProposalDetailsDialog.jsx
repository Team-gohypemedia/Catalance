import React, { memo, useMemo } from "react";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Layers3 from "lucide-react/dist/esm/icons/layers-3";
import Loader from "@/components/common/Loader";
import Pencil from "lucide-react/dist/esm/icons/pencil";
import Send from "lucide-react/dist/esm/icons/send";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
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
import ProposalAIChatSidebar from "./ProposalAIChatSidebar.jsx";
import {
  buildProposalStructuredData,
  extractProposalDetails,
  getDisplayName,
  normalizeProposalStatus,
  resolveProposalServiceLabel,
  resolveProposalTitle,
  resolveProposalAgencyFlag,
  extractAgencyProposalServiceEntries,
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
  canIncreaseBudget,
  canOpenFreelancerSelection,
  processingPaymentProposalId,
  sendingProposalId,
  handleProposalDialogOpenChange,
  handleEditableProposalDraftChange,
  handleSaveProposalChanges,
  handleCancelProposalEditing,
  handleDelete,
  handleApproveAndPay,
  openBudgetDialogForProposal,
  openFreelancerSelection,
  startEditingProposal,
}) => {
  const [isAIChatOpen, setIsAIChatOpen] = React.useState(false);

  const headerDisplayName = getDisplayName(user);
  const activeProposalDetails = activeProposal ? extractProposalDetails(activeProposal) : null;
  const isAgency = activeProposal ? resolveProposalAgencyFlag(activeProposal) : false;
  const agencyServiceEntries = isAgency ? extractAgencyProposalServiceEntries(activeProposal) : [];
  const normalizedStatus = useMemo(() => {
    return normalizeProposalStatus(activeProposal?.status || "");
  }, [activeProposal?.status]);

  const activeProposalStructuredData = useMemo(
    () =>
      activeProposal
        ? buildProposalStructuredData(activeProposal, headerDisplayName)
        : null,
    [activeProposal, headerDisplayName],
  );
  const canEditActiveProposal = useMemo(() => {
    return (
      Boolean(activeProposal) &&
      !activeProposal?.requiresPayment &&
      (normalizedStatus === "draft" ||
        normalizedStatus === "pending" ||
        normalizedStatus === "sent")
    );
  }, [activeProposal, normalizedStatus]);
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
      <DialogContent className={cn(
        "fixed top-0 left-0 translate-x-0 translate-y-0 flex h-dvh w-full max-h-none max-w-none flex-col overflow-hidden border-none bg-background p-0 rounded-none transition-all duration-300 ease-in-out [&>button]:right-3.5 [&>button]:top-3.5 sm:[&>button]:right-5 sm:[&>button]:top-5 [&>button]:z-10 [&>button]:rounded-full [&>button]:border [&>button]:border-border/60 dark:[&>button]:border-white/10 [&>button]:bg-background/60 [&>button]:p-1.5 [&>button]:opacity-100 [&>button]:transition-colors [&>button:hover]:bg-background/80 dark:[&>button:hover]:bg-background/80 [&>button:hover]:text-foreground dark:[&>button:hover]:text-white [&>button_svg]:h-4 [&>button_svg]:w-4 sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:h-[92vh] sm:max-h-[92vh] sm:rounded-[28px] sm:border sm:border-border/60",
        isAIChatOpen 
          ? "lg:w-[min(95vw,1220px)] lg:max-w-[1220px] sm:w-[min(98vw,1000px)] sm:max-w-[1000px]" 
          : "sm:w-[min(96vw,820px)] sm:max-w-[820px]"
      )}>
        <div className={cn(
          "shrink-0 border-b border-border/60 dark:border-white/10 px-4 py-3 sm:px-6 sm:py-4 transition-all duration-300 w-full",
          isAIChatOpen && "sm:max-w-[calc(100%-350px)] lg:max-w-[calc(100%-400px)]"
        )}>
          <div className="flex flex-col gap-3 sm:gap-5">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-2 sm:space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                    {proposalModalTitle}
                  </DialogTitle>
                  {normalizedStatus ? (
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]",
                        statusColors[normalizedStatus] || statusColors.pending,
                      )}
                    >
                      {statusLabels[normalizedStatus] || activeProposal.status}
                    </Badge>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Badge
                    variant="outline"
                    className="h-7 sm:h-8 w-fit rounded-full border-border dark:border-white/10 bg-background/40 px-3 text-muted-foreground dark:text-[#a6adbb]"
                  >
                    {activeProposal?.submittedDate || "No date"}
                  </Badge>
                  <span className="text-[10px] sm:text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Last updated
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pr-10 sm:justify-end sm:pr-12">
                {canEditActiveProposal ? (
                  isEditingProposal ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 rounded-full border-border dark:border-white/10 bg-background/30 px-3.5 text-xs text-foreground dark:text-white hover:bg-muted dark:hover:bg-background/50 sm:h-9 sm:px-4 sm:text-sm"
                        onClick={handleCancelProposalEditing}
                        disabled={isSavingProposal}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        className="h-8 rounded-full bg-primary px-3.5 text-xs text-primary-foreground hover:bg-primary/90 sm:h-9 sm:px-4 sm:text-sm"
                        onClick={handleSaveProposalChanges}
                        disabled={isSavingProposal}
                      >
                        {isSavingProposal ? (
                          <Loader size="sm" className="mr-2" />
                        ) : null}
                        {isSavingProposal ? "Saving..." : "Save Changes"}
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 rounded-full border-primary/25 bg-primary/10 px-3.5 text-xs text-primary hover:bg-primary/15 sm:h-9 sm:px-4 sm:text-sm"
                      onClick={startEditingProposal}
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Edit Proposal
                    </Button>
                  )
                ) : null}

                {canEditActiveProposal && !isEditingProposal && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      startEditingProposal();
                      setIsAIChatOpen(true);
                    }}
                    className="h-8 rounded-full border-primary/25 bg-background/30 px-3.5 text-xs text-foreground hover:bg-primary/20 hover:text-primary transition-colors sm:h-9 sm:px-4 sm:text-sm"
                  >
                    <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" />
                    Edit with AI
                  </Button>
                )}
              </div>
            </div>

            <DialogDescription className="max-w-2xl text-xs sm:text-sm leading-5 sm:leading-6 text-muted-foreground">
              {normalizedStatus === "draft"
                ? "Review the draft, polish the scope, and send it to the right freelancer."
                : canEditActiveProposal
                  ? "Review the proposal details and update the scope while the freelancer decision is still pending."
                  : "Review the proposal details, payment status, and delivery expectations."}
            </DialogDescription>
          </div>
        </div>

        <div className={cn(
          "min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 transition-all duration-300 [scrollbar-color:rgba(0,0,0,0.1)_transparent] dark:[scrollbar-color:rgba(255,255,255,0.18)_transparent] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/10 dark:[&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-2 w-full",
          isAIChatOpen && "sm:max-w-[calc(100%-350px)] lg:max-w-[calc(100%-400px)]"
        )}>
          <div className="space-y-6 pb-2">
            <section className="space-y-2">
              <div className="space-y-0.5">
                <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  01 Project Summary
                </p>
                <h3 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
                  Start with the essentials
                </h3>
                <p className="text-xs sm:text-sm leading-5 sm:leading-6 text-muted-foreground">
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
                        className="h-9 rounded-xl border-border bg-background/40 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/45 focus-visible:ring-primary/20 dark:border-white/10 dark:bg-background/60"
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
                        className="h-9 rounded-xl border-border bg-background/40 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/45 focus-visible:ring-primary/20 dark:border-white/10 dark:bg-background/60"
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
                        className="h-9 rounded-xl border-border bg-background/40 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/45 focus-visible:ring-primary/20 dark:border-white/10 dark:bg-background/60"
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
                    isAgency ? (
                      <span className="text-muted-foreground">Multiple Budgets</span>
                    ) : isEditingProposal ? (
                      <Input
                        value={editableProposalDraft.budget}
                        onChange={(event) =>
                          handleEditableProposalDraftChange("budget", event.target.value)
                        }
                        className="h-9 rounded-xl border-border bg-background/40 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/45 focus-visible:ring-primary/20 dark:border-white/10 dark:bg-background/60"
                        placeholder="e.g. 40000"
                      />
                    ) : (
                      activeProposalDetails?.budget || "Not set"
                    )
                  }
                />
              </div>

              {agencyServiceEntries.length > 0 && (
                <div className="mt-5 overflow-hidden rounded-[18px] border border-border dark:border-white/10 bg-card dark:bg-background/35">
                  <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,0.9fr)_minmax(0,0.9fr)] gap-3 px-4 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:px-5">
                    <p className="min-w-0">Service</p>
                    <p className="min-w-0">Budget</p>
                    <p className="min-w-0">Timeline</p>
                  </div>
                  <div className="divide-y divide-border dark:divide-white/10">
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
              )}
            </section>

            <div className="grid gap-4 items-start xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.95fr)]">
              <section className="space-y-3">
                <div className="space-y-0.5">
                  <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    02 Project Scope
                  </p>
                  <h3 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
                    What the project includes
                  </h3>
                </div>
                <ProposalSectionCard
                  title="Project Overview"
                  description="A clean summary of the project direction and business context."
                >
                  {isLoadingProposal ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader size="sm" />
                      Loading details...
                    </div>
                  ) : isEditingProposal ? (
                    <Textarea
                      value={editableProposalDraft.projectOverview}
                      onChange={(event) =>
                        handleEditableProposalDraftChange("projectOverview", event.target.value)
                      }
                      className="min-h-[130px] border-border bg-background/40 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/45 focus-visible:ring-primary/20 dark:border-white/10 dark:bg-background/60"
                      placeholder="Summarize the project, business context, and intended outcome."
                    />
                  ) : (
                    <p className="text-sm leading-7 text-foreground">
                      {activeProposalStructuredData?.projectOverview || "No overview added yet."}
                    </p>
                  )}
                </ProposalSectionCard>

                <div className="grid gap-3 items-start lg:grid-cols-2">
                  <ProposalSectionCard
                    title="Primary Objectives"
                    description="Key goals this proposal is meant to deliver."
                    className="lg:sticky lg:top-0"
                  >
                    {isEditingProposal ? (
                      <Textarea
                        value={editableProposalDraft.objectivesText}
                        onChange={(event) =>
                          handleEditableProposalDraftChange("objectivesText", event.target.value)
                        }
                        className="min-h-[160px] border-border bg-background/40 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/45 focus-visible:ring-primary/20 dark:border-white/10 dark:bg-background/60"
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
                    className="lg:sticky lg:top-0"
                  >
                    {isEditingProposal ? (
                      <Textarea
                        value={editableProposalDraft.deliverablesText}
                        onChange={(event) =>
                          handleEditableProposalDraftChange("deliverablesText", event.target.value)
                        }
                        className="min-h-[160px] border-border bg-background/40 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/45 focus-visible:ring-primary/20 dark:border-white/10 dark:bg-background/60"
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

              <section className="space-y-3 xl:sticky xl:top-0">
                <div className="space-y-0.5">
                  <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    03 Technical And Delivery
                  </p>
                  <h3 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
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
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            Timeline
                          </p>
                          {isAgency ? (
                            <p className="h-9 flex items-center text-sm font-medium text-muted-foreground">Multiple Timelines</p>
                          ) : (
                            <Input
                              value={editableProposalDraft.timeline}
                              onChange={(event) =>
                                handleEditableProposalDraftChange("timeline", event.target.value)
                              }
                              className="h-9 rounded-xl border-border bg-background/40 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/45 focus-visible:ring-primary/20 dark:border-white/10 dark:bg-background/60"
                              placeholder="e.g. 3+ months"
                            />
                          )}
                        </div>
                      </div>
                      <div className="grid gap-3 border-t border-border dark:border-white/8 pt-3 sm:grid-cols-2">
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
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      <ProposalSummaryItem
                        label="Project Name"
                        value={resolveProposalTitle(activeProposal) || "Not set"}
                      />
                      <ProposalSummaryItem
                        label="Timeline"
                        value={isAgency ? "Multiple Timelines" : (activeProposalDetails?.delivery || "Not set")}
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
                      className="min-h-[110px] border-border bg-background/40 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/45 focus-visible:ring-primary/20 dark:border-white/10 dark:bg-background/60"
                      placeholder={"One technology per line\nExample: Next.js"}
                    />
                  ) : Array.isArray(activeProposalStructuredData?.techStack) &&
                    activeProposalStructuredData.techStack.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {activeProposalStructuredData.techStack.map((item) => (
                        <Badge
                          key={item}
                          variant="outline"
                          className="rounded-full border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                        >
                          {item}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm leading-6 text-muted-foreground">
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
                      className="min-h-[130px] border-border bg-background/40 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/45 focus-visible:ring-primary/20 dark:border-white/10 dark:bg-background/60"
                      placeholder="Add any assumptions, dependencies, or special notes."
                    />
                  ) : (
                    <p className="text-sm leading-7 text-foreground">
                      {activeProposalStructuredData?.notes || "No delivery notes added yet."}
                    </p>
                  )}
                </ProposalSectionCard>
              </section>
            </div>
          </div>
        </div>

        <DialogFooter className={cn(
          "shrink-0 flex flex-row items-center justify-between gap-3 border-t border-border/60 bg-muted/40 p-3 dark:border-white/10 dark:bg-accent/60 transition-all duration-300 w-full",
          isAIChatOpen && "sm:max-w-[calc(100%-350px)] lg:max-w-[calc(100%-400px)]"
        )}>
          <div>
            {activeProposal && !activeProposal.requiresPayment ? (
              <Button
                type="button"
                variant="ghost"
                className="h-8 rounded-full px-2.5 text-xs text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-300 sm:h-9 sm:px-3 sm:text-sm"
                onClick={() => handleDelete(activeProposal)}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete
              </Button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
            {normalizedStatus === "draft" && !activeProposal?.requiresPayment ? (
              <Button
                type="button"
                variant="outline"
                className="h-8 rounded-full border-primary/25 bg-primary/10 px-3.5 text-xs text-primary hover:bg-primary/15 sm:h-9 sm:px-4 sm:text-sm"
                onClick={() => openFreelancerSelection(activeProposal)}
                disabled={sendingProposalId === activeProposal?.id}
              >
                {sendingProposalId === activeProposal?.id ? (
                  <Loader size="sm" className="mr-2" />
                ) : (
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                )}
                {sendingProposalId === activeProposal?.id
                  ? "Sending..."
                  : "Send to Freelancers"}
              </Button>
            ) : null}

            {canIncreaseBudget ? (
              <Button
                type="button"
                className="h-8 rounded-full bg-primary px-3.5 text-xs text-primary-foreground hover:bg-primary/90 sm:h-9 sm:px-4 sm:text-sm"
                onClick={() => openBudgetDialogForProposal(activeProposal)}
                disabled={isSavingProposal || isLoadingProposal}
              >
                Increase Budget
              </Button>
            ) : null}

            {canIncreaseBudget && canOpenFreelancerSelection ? (
              <Button
                type="button"
                variant="outline"
                className="h-8 rounded-full border-primary/25 bg-primary/10 px-3.5 text-xs text-primary hover:bg-primary/15 sm:h-9 sm:px-4 sm:text-sm"
                onClick={() => openFreelancerSelection(activeProposal)}
                disabled={sendingProposalId === activeProposal?.id}
              >
                {sendingProposalId === activeProposal?.id ? (
                  <Loader size="sm" className="mr-2" />
                ) : (
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                )}
                {sendingProposalId === activeProposal?.id
                  ? "Sending..."
                  : "Send to More Freelancers"}
              </Button>
            ) : null}

            {activeProposal?.requiresPayment ? (
              <Button
                type="button"
                className="h-8 rounded-full bg-emerald-500 px-3.5 text-xs text-black hover:bg-emerald-400 sm:h-9 sm:px-4 sm:text-sm"
                onClick={() => handleApproveAndPay(activeProposal)}
                disabled={processingPaymentProposalId === activeProposal?.id}
              >
                {processingPaymentProposalId === activeProposal?.id ? (
                  <Loader size="sm" className="mr-2" />
                ) : (
                  <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                )}
                {processingPaymentProposalId === activeProposal?.id
                  ? "Processing..."
                  : "Approve & Pay"}
              </Button>
            ) : null}
          </div>
        </DialogFooter>

        <ProposalAIChatSidebar 
          open={isAIChatOpen} 
          onClose={() => setIsAIChatOpen(false)} 
          editableProposalDraft={editableProposalDraft} 
          onDraftChange={handleEditableProposalDraftChange} 
        />
      </DialogContent>
    </Dialog>
  );
};

export default memo(ProposalDetailsDialog);
