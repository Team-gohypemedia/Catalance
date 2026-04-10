import React, { memo } from "react";
import ClientPageHeader from "@/components/features/client/ClientPageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/shared/lib/utils";
import ProposalCardsCarousel from "./ProposalCardsCarousel.jsx";
import { EmptyStateCard, ProposalLoadingState } from "./ProposalStates.jsx";
import { proposalTabCopy } from "./proposal-utils.js";

const tabConfig = [
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending Approval" },
  { value: "rejected", label: "Rejected" },
];

const ProposalTabsSection = ({ proposalState, actions }) => {
  const {
    activeTab,
    grouped,
    isLoading,
    processingPaymentProposalId,
    sendingProposalId,
  } = proposalState;
  const {
    setActiveTab,
    handleApproveAndPay,
    handleDelete,
    openBudgetDialogForProposal,
    handleOpenFreelancerDetails,
    handleOpenProposal,
    openFreelancerSelection,
  } = actions;

  const currentTabItems = grouped[activeTab] || [];
  const currentTabMeta = proposalTabCopy[activeTab] || proposalTabCopy.draft;

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full space-y-8"
    >
      <ClientPageHeader
        title="Project Proposals"
        dateLabel={false}
        actions={
          <TabsList className="inline-flex h-auto w-full max-w-[24rem] flex-nowrap items-stretch justify-between gap-1 rounded-[32px] border border-border bg-background p-1 shadow-none sm:w-auto sm:max-w-none sm:gap-2 sm:p-1.5">
            {tabConfig.map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className={cn(
                  "h-10 min-w-[4.75rem] flex-none rounded-full border border-transparent text-center text-[0.72rem] font-semibold text-muted-foreground shadow-none transition hover:text-foreground sm:h-11 sm:min-w-0 sm:flex-none sm:px-5 sm:text-[0.95rem] sm:leading-normal sm:tracking-normal sm:whitespace-nowrap data-[state=active]:!border-primary/70 data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:!shadow-none",
                  item.value === "pending"
                    ? "max-w-[6.5rem] whitespace-normal px-2 py-1 leading-[1.02] tracking-[-0.01em] sm:max-w-none sm:py-0"
                    : "whitespace-nowrap px-4 leading-none tracking-[-0.01em]",
                )}
              >
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        }
      />

      <TabsContent value="draft" className="m-0">
        {isLoading ? (
          <ProposalLoadingState />
        ) : currentTabItems.length > 0 ? (
          <ProposalCardsCarousel
            proposals={currentTabItems}
            onOpen={handleOpenProposal}
            onDelete={handleDelete}
            onIncreaseBudget={openBudgetDialogForProposal}
            onSend={openFreelancerSelection}
            onViewFreelancers={handleOpenFreelancerDetails}
            sendingProposalId={sendingProposalId}
          />
        ) : (
          <EmptyStateCard
            title={currentTabMeta.emptyTitle}
            description={currentTabMeta.emptyDescription}
          />
        )}
      </TabsContent>

      <TabsContent value="pending" className="m-0">
        {isLoading ? (
          <ProposalLoadingState />
        ) : currentTabItems.length > 0 ? (
          <ProposalCardsCarousel
            proposals={currentTabItems}
            onOpen={handleOpenProposal}
            onDelete={handleDelete}
            onIncreaseBudget={openBudgetDialogForProposal}
            onPay={handleApproveAndPay}
            onSend={openFreelancerSelection}
            onViewFreelancers={handleOpenFreelancerDetails}
            processingPaymentProposalId={processingPaymentProposalId}
            sendingProposalId={sendingProposalId}
          />
        ) : (
          <EmptyStateCard
            title={currentTabMeta.emptyTitle}
            description={currentTabMeta.emptyDescription}
          />
        )}
      </TabsContent>

      <TabsContent value="rejected" className="m-0">
        {isLoading ? (
          <ProposalLoadingState />
        ) : currentTabItems.length > 0 ? (
          <ProposalCardsCarousel
            proposals={currentTabItems}
            onOpen={handleOpenProposal}
            onDelete={handleDelete}
            onIncreaseBudget={openBudgetDialogForProposal}
            onViewFreelancers={handleOpenFreelancerDetails}
          />
        ) : (
          <EmptyStateCard
            title={currentTabMeta.emptyTitle}
            description={currentTabMeta.emptyDescription}
          />
        )}
      </TabsContent>
    </Tabs>
  );
};

export default memo(ProposalTabsSection);
