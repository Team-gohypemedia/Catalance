import React from "react";
import ClientDashboardFooter from "@/components/features/client/ClientDashboardFooter";
import {
  ClientProposalDataProvider,
  ClientProposalHeader,
  ClientProposalDialogs,
  ProposalTabsSection,
  useClientProposalData,
} from "@/components/client/client-proposal";

const ClientProposalWorkspace = () => {
  const {
    unreadCount,
    user,
    activeTab,
    grouped,
    isLoading,
    setActiveTab,
    processingPaymentProposalId,
    sendingProposalId,
    activeProposal,
    isViewing,
    isLoadingProposal,
    isEditingProposal,
    isSavingProposal,
    editableProposalDraft,
    sendingFreelancerId,
    unsendingProposalId,
    freelancerDetailsProposal,
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
    handleFreelancerProfileOpenChange,
    viewingFreelancer,
    handleProposalDialogOpenChange,
    handleEditableProposalDraftChange,
    handleSaveProposalChanges,
    handleCancelProposalEditing,
    handleDelete,
    handleApproveAndPay,
    openFreelancerSelection,
    handleOpenProposal,
    handleOpenFreelancerDetails,
    handleFreelancerDetailsDialogOpenChange,
    handleUnsendProposalFromFreelancer,
    sendProposalToFreelancer,
    handleViewFreelancerProfile,
    startEditingProposal,
  } = useClientProposalData();

  return (
    <div className="min-h-screen bg-background text-[#f1f5f9]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1536px] flex-col px-4 sm:px-6 lg:px-[40px] xl:w-[85%] xl:max-w-none">
        <ClientProposalHeader unreadCount={unreadCount} user={user} />

        <main className="flex-1 pb-12">
          <ProposalTabsSection
            activeTab={activeTab}
            grouped={grouped}
            isLoading={isLoading}
            setActiveTab={setActiveTab}
            processingPaymentProposalId={processingPaymentProposalId}
            sendingProposalId={sendingProposalId}
            handleApproveAndPay={handleApproveAndPay}
            handleDelete={handleDelete}
            handleOpenFreelancerDetails={handleOpenFreelancerDetails}
            handleOpenProposal={handleOpenProposal}
            openFreelancerSelection={openFreelancerSelection}
          />
        </main>

        <ClientDashboardFooter variant="workspace" />
      </div>

      <ClientProposalDialogs
        user={user}
        activeProposal={activeProposal}
        isViewing={isViewing}
        isLoadingProposal={isLoadingProposal}
        isEditingProposal={isEditingProposal}
        isSavingProposal={isSavingProposal}
        editableProposalDraft={editableProposalDraft}
        processingPaymentProposalId={processingPaymentProposalId}
        sendingProposalId={sendingProposalId}
        sendingFreelancerId={sendingFreelancerId}
        freelancerDetailsProposal={freelancerDetailsProposal}
        unsendingProposalId={unsendingProposalId}
        showFreelancerSelect={showFreelancerSelect}
        setShowFreelancerSelect={setShowFreelancerSelect}
        proposalForFreelancerSelection={proposalForFreelancerSelection}
        isFreelancersLoading={isFreelancersLoading}
        freelancerSearch={freelancerSearch}
        setFreelancerSearch={setFreelancerSearch}
        filteredFreelancers={filteredFreelancers}
        freelancerSelectionData={freelancerSelectionData}
        bestMatchFreelancerIds={bestMatchFreelancerIds}
        projectRequiredSkills={projectRequiredSkills}
        showFreelancerProfile={showFreelancerProfile}
        handleFreelancerProfileOpenChange={handleFreelancerProfileOpenChange}
        viewingFreelancer={viewingFreelancer}
        handleProposalDialogOpenChange={handleProposalDialogOpenChange}
        handleEditableProposalDraftChange={handleEditableProposalDraftChange}
        handleSaveProposalChanges={handleSaveProposalChanges}
        handleCancelProposalEditing={handleCancelProposalEditing}
        handleDelete={handleDelete}
        handleApproveAndPay={handleApproveAndPay}
        openFreelancerSelection={openFreelancerSelection}
        handleFreelancerDetailsDialogOpenChange={handleFreelancerDetailsDialogOpenChange}
        handleUnsendProposalFromFreelancer={handleUnsendProposalFromFreelancer}
        sendProposalToFreelancer={sendProposalToFreelancer}
        handleViewFreelancerProfile={handleViewFreelancerProfile}
        startEditingProposal={startEditingProposal}
      />
    </div>
  );
};

const ClientProposal = () => (
  <ClientProposalDataProvider>
    <ClientProposalWorkspace />
  </ClientProposalDataProvider>
);

export default ClientProposal;
