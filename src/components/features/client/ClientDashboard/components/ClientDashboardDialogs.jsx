import React, { Suspense, lazy, memo } from "react";

const ViewProposalDialog = lazy(
  () => import("@/components/features/client/dashboard/ViewProposalDialog"),
);
const EditProposalDialog = lazy(
  () => import("@/components/features/client/dashboard/EditProposalDialog"),
);
const FreelancerSelectionDialog = lazy(
  () => import("@/components/features/client/dashboard/FreelancerSelectionDialog"),
);
const FreelancerProfileDialog = lazy(
  () => import("@/components/features/client/dashboard/FreelancerProfileDialog"),
);
const SuspensionAlert = lazy(() => import("@/components/ui/suspension-alert").then((module) => ({
  default: module.SuspensionAlert,
})));

const DialogFallback = () => null;

const ClientDashboardDialogs = ({
  showViewProposal,
  setShowViewProposal,
  savedProposal,
  resolveProposalTitle,
  formatBudget,
  openEditProposal,
  showEditProposal,
  setShowEditProposal,
  editForm,
  setEditForm,
  saveProposalChanges,
  showFreelancerSelect,
  setShowFreelancerSelect,
  isFreelancersLoading,
  isSendingProposal,
  sendingFreelancerId,
  freelancerSearch,
  setFreelancerSearch,
  filteredFreelancers,
  freelancerSelectionData,
  bestMatchFreelancerIds,
  projectRequiredSkills,
  setViewingFreelancer,
  setShowFreelancerProfile,
  sendProposalToFreelancer,
  collectFreelancerSkillTokens,
  freelancerMatchesRequiredSkill,
  generateGradient,
  formatRating,
  showFreelancerProfile,
  viewingFreelancer,
  showSuspensionAlert,
  setShowSuspensionAlert,
  sessionUser,
}) => (
  <Suspense fallback={<DialogFallback />}>
    {showViewProposal ? (
      <ViewProposalDialog
        open={showViewProposal}
        onOpenChange={setShowViewProposal}
        savedProposal={savedProposal}
        resolveProposalTitle={resolveProposalTitle}
        formatBudget={formatBudget}
        onEditProposal={openEditProposal}
      />
    ) : null}

    {showEditProposal ? (
      <EditProposalDialog
        open={showEditProposal}
        onOpenChange={setShowEditProposal}
        editForm={editForm}
        setEditForm={setEditForm}
        onSaveChanges={saveProposalChanges}
      />
    ) : null}

    {showFreelancerSelect ? (
      <FreelancerSelectionDialog
        open={showFreelancerSelect}
        onOpenChange={setShowFreelancerSelect}
        savedProposal={savedProposal}
        isLoadingFreelancers={isFreelancersLoading}
        isSendingProposal={isSendingProposal}
        sendingFreelancerId={sendingFreelancerId}
        freelancerSearch={freelancerSearch}
        onFreelancerSearchChange={setFreelancerSearch}
        filteredFreelancers={filteredFreelancers}
        freelancerSelectionData={freelancerSelectionData}
        bestMatchFreelancerIds={bestMatchFreelancerIds}
        projectRequiredSkills={projectRequiredSkills}
        onViewFreelancer={(freelancer) => {
          setViewingFreelancer(freelancer);
          setShowFreelancerProfile(true);
        }}
        onSendProposal={(freelancer) => {
          setShowFreelancerSelect(false);
          sendProposalToFreelancer(freelancer);
        }}
        collectFreelancerSkillTokens={collectFreelancerSkillTokens}
        freelancerMatchesRequiredSkill={freelancerMatchesRequiredSkill}
        generateGradient={generateGradient}
        formatRating={formatRating}
      />
    ) : null}

    {showFreelancerProfile ? (
      <FreelancerProfileDialog
        open={showFreelancerProfile}
        onOpenChange={setShowFreelancerProfile}
        viewingFreelancer={viewingFreelancer}
      />
    ) : null}

    {showSuspensionAlert ? (
      <SuspensionAlert
        open={showSuspensionAlert}
        onOpenChange={setShowSuspensionAlert}
        suspendedAt={sessionUser?.suspendedAt}
      />
    ) : null}
  </Suspense>
);

export default memo(ClientDashboardDialogs);
