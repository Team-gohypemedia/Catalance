import React, { memo } from "react";
import FreelancerProfileDialog from "@/components/features/client/dashboard/FreelancerProfileDialog";
import FreelancerSelectionDialog from "@/components/features/client/dashboard/FreelancerSelectionDialog";
import ProposalBudgetDialog from "./ProposalBudgetDialog.jsx";
import ProposalDetailsDialog from "./ProposalDetailsDialog.jsx";
import ProposalFreelancerDetailsDialog from "./ProposalFreelancerDetailsDialog.jsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  collectFreelancerSkillTokens,
  formatRating,
  freelancerMatchesRequiredSkill,
  generateFreelancerGradient,
} from "./proposal-utils.js";

const ClientProposalDialogs = ({
  userState,
  proposalState,
  dialogState,
  freelancerState,
  actions,
}) => {
  const { user } = userState || {};
  const {
    activeProposal,
    isLoadingProposal,
    isEditingProposal,
    isSavingProposal,
    editableProposalDraft,
    canIncreaseBudgetForActiveProposal,
    canOpenFreelancerSelectionForActiveProposal,
    processingPaymentProposalId,
    sendingProposalId,
  } = proposalState || {};
  const {
    isViewing,
    budgetDialogProposal,
    budgetInput,
    freelancerDetailsProposal,
    isUpdatingBudget,
    showFreelancerSelect,
    showFreelancerProfile,
    viewingFreelancer,
    unsendingProposalId,
  } = dialogState || {};
  const {
    sendingFreelancerId,
    freelancerSearch,
    isFreelancersLoading,
    freelancerFetchStatus,
    freelancerFetchError,
    proposalForFreelancerSelection,
    filteredFreelancers,
    freelancerSelectionData,
    bestMatchFreelancerIds,
    projectRequiredSkills,
  } = freelancerState || {};
  const [showSentInfo, setShowSentInfo] = React.useState(false);

  const {
    setShowFreelancerSelect,
    setFreelancerSearch,
    setBudgetInput,
    submitBudgetIncrease,
    handleBudgetDialogOpenChange,
    handleProposalDialogOpenChange,
    handleEditableProposalDraftChange,
    handleSaveProposalChanges,
    handleCancelProposalEditing,
    handleDelete,
    handleApproveAndPay,
    openBudgetDialogForProposal,
    openFreelancerSelection,
    handleFreelancerDetailsDialogOpenChange,
    handleUnsendProposalFromFreelancer,
    sendProposalToFreelancer,
    handleFreelancerProfileOpenChange,
    handleViewFreelancerProfile,
    startEditingProposal,
  } = actions || {};

  return (
    <>
      <ProposalFreelancerDetailsDialog
        proposal={freelancerDetailsProposal}
        open={Boolean(freelancerDetailsProposal)}
        onOpenChange={handleFreelancerDetailsDialogOpenChange}
        onUnsend={handleUnsendProposalFromFreelancer}
        unsendingProposalId={unsendingProposalId}
      />

      <ProposalDetailsDialog
        user={user}
        activeProposal={activeProposal}
        isViewing={isViewing}
        isLoadingProposal={isLoadingProposal}
        isEditingProposal={isEditingProposal}
        isSavingProposal={isSavingProposal}
        editableProposalDraft={editableProposalDraft}
        canIncreaseBudget={canIncreaseBudgetForActiveProposal}
        canOpenFreelancerSelection={canOpenFreelancerSelectionForActiveProposal}
        processingPaymentProposalId={processingPaymentProposalId}
        sendingProposalId={sendingProposalId}
        handleProposalDialogOpenChange={handleProposalDialogOpenChange}
        handleEditableProposalDraftChange={handleEditableProposalDraftChange}
        handleSaveProposalChanges={handleSaveProposalChanges}
        handleCancelProposalEditing={handleCancelProposalEditing}
        handleDelete={handleDelete}
        handleApproveAndPay={handleApproveAndPay}
        openBudgetDialogForProposal={openBudgetDialogForProposal}
        openFreelancerSelection={openFreelancerSelection}
        startEditingProposal={startEditingProposal}
      />

      <ProposalBudgetDialog
        open={Boolean(budgetDialogProposal)}
        proposal={budgetDialogProposal}
        budgetInput={budgetInput}
        onBudgetInputChange={setBudgetInput}
        onOpenChange={handleBudgetDialogOpenChange}
        onSubmit={submitBudgetIncrease}
        isUpdatingBudget={isUpdatingBudget}
      />

      <FreelancerSelectionDialog
        open={showFreelancerSelect}
        onOpenChange={setShowFreelancerSelect}
        savedProposal={proposalForFreelancerSelection}
        isLoadingFreelancers={isFreelancersLoading}
        freelancerFetchStatus={freelancerFetchStatus}
        freelancerFetchError={freelancerFetchError}
        isSendingProposal={
          sendingProposalId === (proposalForFreelancerSelection?.id ?? null)
        }
        sendingFreelancerId={sendingFreelancerId}
        freelancerSearch={freelancerSearch}
        onFreelancerSearchChange={setFreelancerSearch}
        filteredFreelancers={filteredFreelancers}
        freelancerSelectionData={freelancerSelectionData}
        bestMatchFreelancerIds={bestMatchFreelancerIds}
        projectRequiredSkills={projectRequiredSkills}
        onViewFreelancer={handleViewFreelancerProfile}
        onSendProposal={async (freelancer) => {
          const success = await sendProposalToFreelancer(freelancer);
          if (success) {
            setShowFreelancerSelect(false);
            setShowSentInfo(true);
          }
        }}
        collectFreelancerSkillTokens={collectFreelancerSkillTokens}
        freelancerMatchesRequiredSkill={freelancerMatchesRequiredSkill}
        generateGradient={generateFreelancerGradient}
        formatRating={formatRating}
      />

      {showFreelancerProfile ? (
        <FreelancerProfileDialog
          open={showFreelancerProfile}
          onOpenChange={handleFreelancerProfileOpenChange}
          viewingFreelancer={viewingFreelancer}
        />
      ) : null}

      <AlertDialog open={showSentInfo} onOpenChange={setShowSentInfo}>
        <AlertDialogContent className="border border-border dark:border-white/[0.08] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Proposal Sent</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm leading-relaxed">
              This proposal draft has been moved from your drafts to the active pending proposals section.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-[12px] h-9 text-xs sm:text-sm shadow-none">
              Got It
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default memo(ClientProposalDialogs);
