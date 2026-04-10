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
  const { userState, proposalState, dialogState, freelancerState, actions } =
    useClientProposalData();

  return (
    <div className="min-h-screen bg-background text-[#f1f5f9]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1536px] flex-col px-4 sm:px-6 lg:px-[40px] xl:w-[85%] xl:max-w-none">
        <ClientProposalHeader userState={userState} />

        <main className="flex-1 pb-12">
          <ProposalTabsSection proposalState={proposalState} actions={actions} />
        </main>

        <ClientDashboardFooter variant="workspace" />
      </div>

      <ClientProposalDialogs
        userState={userState}
        proposalState={proposalState}
        dialogState={dialogState}
        freelancerState={freelancerState}
        actions={actions}
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
