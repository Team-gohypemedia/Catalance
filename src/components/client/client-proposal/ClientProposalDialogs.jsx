import React from "react";
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
import { useClientProposalData } from "./useClientProposalData.js";

const ClientProposalDialogs = () => {
  const {
    freelancerDetailsProposal,
    unsendingProposalId,
    handleFreelancerDetailsDialogOpenChange,
    handleUnsendProposalFromFreelancer,
    showFreelancerSelect,
    setShowFreelancerSelect,
    proposalForFreelancerSelection,
    isFreelancersLoading,
    sendingProposalId,
    sendingFreelancerId,
    freelancerSearch,
    setFreelancerSearch,
    filteredFreelancers,
    freelancerSelectionData,
    bestMatchFreelancerIds,
    projectRequiredSkills,
    handleViewFreelancerProfile,
    sendProposalToFreelancer,
    showFreelancerProfile,
    handleFreelancerProfileOpenChange,
    viewingFreelancer,
  } = useClientProposalData();

  return (
    <>
      <ProposalFreelancerDetailsDialog
        proposal={freelancerDetailsProposal}
        open={Boolean(freelancerDetailsProposal)}
        onOpenChange={handleFreelancerDetailsDialogOpenChange}
        onUnsend={handleUnsendProposalFromFreelancer}
        unsendingProposalId={unsendingProposalId}
      />

      <ProposalDetailsDialog />

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

export default ClientProposalDialogs;
