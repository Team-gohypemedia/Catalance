import React, { memo } from "react";
import FreelancerProfileDialog from "@/components/features/client/dashboard/FreelancerProfileDialog";
import FreelancerSelectionDialog from "@/components/features/client/dashboard/FreelancerSelectionDialog";
import ProposalDetailsDialog from "./ProposalDetailsDialog.jsx";
import ProposalFreelancerDetailsDialog from "./ProposalFreelancerDetailsDialog.jsx";
import {
  collectFreelancerSkillTokens,
  formatRating,
  freelancerMatchesRequiredSkill,
  generateFreelancerGradient,
} from "./proposal-utils.js";

const ClientProposalDialogs = ({
  user,
  activeProposal,
  isViewing,
  isLoadingProposal,
  isEditingProposal,
  isSavingProposal,
  editableProposalDraft,
  processingPaymentProposalId,
  sendingProposalId,
  sendingFreelancerId,
  freelancerDetailsProposal,
  unsendingProposalId,
  showFreelancerSelect,
  setShowFreelancerSelect,
  proposalForFreelancerSelection,
  isFreelancersLoading,
  freelancerSearch,
  setFreelancerSearch,
  filteredFreelancers,
  freelancerSelectionData,
  bestMatchFreelancerIds,
  projectRequiredSkills,
  showFreelancerProfile,
  viewingFreelancer,
  handleProposalDialogOpenChange,
  handleEditableProposalDraftChange,
  handleSaveProposalChanges,
  handleCancelProposalEditing,
  handleDelete,
  handleApproveAndPay,
  openFreelancerSelection,
  handleFreelancerDetailsDialogOpenChange,
  handleUnsendProposalFromFreelancer,
  sendProposalToFreelancer,
  handleFreelancerProfileOpenChange,
  handleViewFreelancerProfile,
  startEditingProposal,
}) => {
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
        processingPaymentProposalId={processingPaymentProposalId}
        sendingProposalId={sendingProposalId}
        handleProposalDialogOpenChange={handleProposalDialogOpenChange}
        handleEditableProposalDraftChange={handleEditableProposalDraftChange}
        handleSaveProposalChanges={handleSaveProposalChanges}
        handleCancelProposalEditing={handleCancelProposalEditing}
        handleDelete={handleDelete}
        handleApproveAndPay={handleApproveAndPay}
        openFreelancerSelection={openFreelancerSelection}
        startEditingProposal={startEditingProposal}
      />

      <FreelancerSelectionDialog
        open={showFreelancerSelect}
        onOpenChange={setShowFreelancerSelect}
        savedProposal={proposalForFreelancerSelection}
        isLoadingFreelancers={isFreelancersLoading}
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
        onSendProposal={sendProposalToFreelancer}
        collectFreelancerSkillTokens={collectFreelancerSkillTokens}
        freelancerMatchesRequiredSkill={freelancerMatchesRequiredSkill}
        generateGradient={generateFreelancerGradient}
        formatRating={formatRating}
      />

      <FreelancerProfileDialog
        open={showFreelancerProfile}
        onOpenChange={handleFreelancerProfileOpenChange}
        viewingFreelancer={viewingFreelancer}
      />
    </>
  );
};

export default memo(ClientProposalDialogs);
