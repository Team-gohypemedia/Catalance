import React, { memo, useEffect, useMemo, useState } from "react";
import ClientPageHeader from "@/components/features/client/ClientPageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/shared/lib/utils";
import ProposalCardsCarousel from "./ProposalCardsCarousel.jsx";
import { EmptyStateCard, ProposalLoadingState } from "./ProposalStates.jsx";
import { proposalTabCopy } from "./proposal-utils.js";

const proposalTypeConfig = [
  { value: "freelancer", label: "Freelancer" },
  { value: "agency", label: "Agency" },
];

const statusTabConfig = [
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending Approval" },
  { value: "rejected", label: "Rejected" },
];

const segmentedControlClassName =
  "inline-flex h-auto w-full flex-nowrap items-stretch justify-between gap-0.5 rounded-[32px] border border-border bg-background p-0.5 shadow-none sm:gap-1 sm:p-1";

const buildProposalBucketsByType = (grouped = {}) => {
  const buckets = {
    freelancer: { draft: [], pending: [], rejected: [] },
    agency: { draft: [], pending: [], rejected: [] },
  };

  statusTabConfig.forEach(({ value }) => {
    (grouped[value] || []).forEach((proposal) => {
      const typeKey = proposal?.isAgency ? "agency" : "freelancer";
      buckets[typeKey][value].push(proposal);
    });
  });

  return buckets;
};

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
  const [activeType, setActiveType] = useState("freelancer");
  const [hasSelectedType, setHasSelectedType] = useState(false);

  const proposalsByType = useMemo(
    () => buildProposalBucketsByType(grouped),
    [grouped],
  );

  const typeCounts = useMemo(
    () =>
      proposalTypeConfig.reduce((counts, item) => {
        counts[item.value] = statusTabConfig.reduce(
          (total, statusItem) =>
            total + (proposalsByType[item.value]?.[statusItem.value]?.length || 0),
          0,
        );
        return counts;
      }, {}),
    [proposalsByType],
  );

  useEffect(() => {
    if (hasSelectedType || isLoading || (typeCounts[activeType] || 0) > 0) {
      return;
    }

    const fallbackType = proposalTypeConfig.find(
      (item) => item.value !== activeType && (typeCounts[item.value] || 0) > 0,
    );

    if (fallbackType) {
      setActiveType(fallbackType.value);
    }
  }, [activeType, hasSelectedType, isLoading, typeCounts]);

  const scopedGrouped = proposalsByType[activeType] || proposalsByType.freelancer;
  const statusCounts = useMemo(
    () =>
      statusTabConfig.reduce((counts, item) => {
        counts[item.value] = scopedGrouped[item.value]?.length || 0;
        return counts;
      }, {}),
    [scopedGrouped],
  );
  const currentTabMeta = proposalTabCopy[activeTab] || proposalTabCopy.draft;
  const emptyStateTitle =
    activeType === "agency"
      ? "No agency proposals found for selected status"
      : "No freelancer proposals found for selected status";
  const emptyStateDescription =
    currentTabMeta.emptyDescription ||
    `Select another status tab or create a new ${activeType} proposal to see results here.`;

  const renderTabContent = (tabValue) => {
    const items = scopedGrouped[tabValue] || [];

    if (isLoading) {
      return <ProposalLoadingState />;
    }

    if (items.length === 0) {
      return (
        <EmptyStateCard
          title={emptyStateTitle}
          description={emptyStateDescription}
        />
      );
    }

    if (tabValue === "draft") {
      return (
        <ProposalCardsCarousel
          proposals={items}
          onOpen={handleOpenProposal}
          onDelete={handleDelete}
          onIncreaseBudget={openBudgetDialogForProposal}
          onSend={openFreelancerSelection}
          onViewFreelancers={handleOpenFreelancerDetails}
          sendingProposalId={sendingProposalId}
        />
      );
    }

    if (tabValue === "pending") {
      return (
        <ProposalCardsCarousel
          proposals={items}
          onOpen={handleOpenProposal}
          onDelete={handleDelete}
          onIncreaseBudget={openBudgetDialogForProposal}
          onPay={handleApproveAndPay}
          onSend={openFreelancerSelection}
          onViewFreelancers={handleOpenFreelancerDetails}
          processingPaymentProposalId={processingPaymentProposalId}
          sendingProposalId={sendingProposalId}
        />
      );
    }

    return (
      <ProposalCardsCarousel
        proposals={items}
        onOpen={handleOpenProposal}
        onDelete={handleDelete}
        onIncreaseBudget={openBudgetDialogForProposal}
        onViewFreelancers={handleOpenFreelancerDetails}
      />
    );
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full space-y-8"
    >
      <ClientPageHeader
        title="Project Proposals"
        dateLabel={false}
        className="lg:items-start"
        titleClassName="text-[clamp(1.35rem,2.1vw,2.55rem)] leading-[0.98] tracking-[-0.05em] whitespace-nowrap"
        actions={
          <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-nowrap sm:justify-end sm:overflow-x-auto sm:[scrollbar-width:none] sm:[&::-webkit-scrollbar]:hidden lg:flex-nowrap lg:items-center">
            <div
              className={cn(
                segmentedControlClassName,
                "w-auto self-start shrink-0 sm:self-auto",
              )}
              role="tablist"
              aria-label="Proposal type"
            >
              {proposalTypeConfig.map((item) => {
                const isActive = item.value === activeType;

                return (
                  <button
                    key={item.value}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => {
                      setHasSelectedType(true);
                      setActiveType(item.value);
                    }}
                    className={cn(
                      "inline-flex h-10 min-w-0 flex-1 items-center justify-center rounded-full border border-transparent px-2.5 text-[clamp(0.62rem,1vw,0.88rem)] font-semibold leading-none tracking-[-0.02em] whitespace-nowrap shadow-none transition sm:h-11 sm:min-w-[6.5rem] sm:flex-none sm:px-4 sm:text-sm",
                      isActive
                        ? "border-primary/70 bg-primary text-primary-foreground"
                        : "bg-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span>{item.label}</span>
                    <span
                      className={cn(
                        "ml-1 hidden min-w-4 items-center justify-center rounded-full px-1.5 py-0.5 text-[8px] font-semibold leading-none xl:inline-flex",
                        isActive
                          ? "bg-black/10 text-primary-foreground/80"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {typeCounts[item.value] || 0}
                    </span>
                  </button>
                );
              })}
            </div>

            <TabsList
              className="flex h-auto w-full items-center justify-start gap-2 border-0 bg-transparent p-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:w-auto sm:justify-end"
            >
              {statusTabConfig.map((item) => {
                const isStatusActive = item.value === activeTab;

                return (
                  <TabsTrigger
                    key={item.value}
                    value={item.value}
                    className="h-9 shrink-0 rounded-full border border-border bg-card px-4 text-center text-xs font-semibold leading-none tracking-[-0.02em] whitespace-nowrap text-muted-foreground shadow-none transition hover:text-foreground sm:h-10 sm:px-5 sm:text-sm data-[state=active]:border-primary/40 data-[state=active]:!bg-primary/10 data-[state=active]:!text-primary data-[state=active]:shadow-none lg:h-11 lg:text-[0.92rem]"
                  >
                    <span className="inline-flex items-center justify-center gap-1.5">
                      <span>{item.label}</span>
                      <span
                        className={cn(
                          "hidden min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold leading-none xl:inline-flex",
                          isStatusActive
                            ? "bg-black/10 text-primary-foreground/80"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {statusCounts[item.value] || 0}
                      </span>
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
        }
      />

      <TabsContent value="draft" className="m-0">
        {renderTabContent("draft")}
      </TabsContent>

      <TabsContent value="pending" className="m-0">
        {renderTabContent("pending")}
      </TabsContent>

      <TabsContent value="rejected" className="m-0">
        {renderTabContent("rejected")}
      </TabsContent>
    </Tabs>
  );
};

export default memo(ProposalTabsSection);
