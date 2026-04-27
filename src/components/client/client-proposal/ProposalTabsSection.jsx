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
  "inline-flex h-auto w-full flex-nowrap items-stretch justify-between gap-1 rounded-[32px] border border-border bg-background p-1 shadow-none sm:gap-2 sm:p-1.5";

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
        actions={
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end lg:flex-nowrap lg:items-center">
            <div
              className={cn(
                segmentedControlClassName,
                "max-w-none sm:w-auto sm:max-w-none",
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
                      "inline-flex h-10 min-w-[7rem] flex-1 items-center justify-center rounded-full border border-transparent px-4 text-sm font-semibold shadow-none transition sm:h-11 sm:px-5",
                      isActive
                        ? "border-primary/70 bg-primary text-primary-foreground"
                        : "bg-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span>{item.label}</span>
                    <span
                      className={cn(
                        "ml-2 inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                        isActive
                          ? "bg-black/10 text-primary-foreground/80"
                          : "bg-white/[0.05] text-muted-foreground",
                      )}
                    >
                      {typeCounts[item.value] || 0}
                    </span>
                  </button>
                );
              })}
            </div>

            <TabsList
              className={cn(
                segmentedControlClassName,
                "max-w-[26rem] sm:w-auto sm:max-w-none",
              )}
            >
              {statusTabConfig.map((item) => {
                const isStatusActive = item.value === activeTab;

                return (
                  <TabsTrigger
                    key={item.value}
                    value={item.value}
                    className={cn(
                      "h-10 min-w-[4.75rem] flex-none rounded-full border border-transparent text-center text-[0.72rem] font-semibold text-muted-foreground shadow-none transition hover:text-foreground sm:h-11 sm:min-w-0 sm:flex-none sm:px-5 sm:text-[0.95rem] sm:leading-normal sm:tracking-normal sm:whitespace-nowrap data-[state=active]:!border-primary/70 data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:!shadow-none",
                      item.value === "pending"
                        ? "max-w-[7.75rem] whitespace-normal px-2 py-1 leading-[1.02] tracking-[-0.01em] sm:max-w-none sm:py-0"
                        : "whitespace-nowrap px-4 leading-none tracking-[-0.01em]",
                    )}
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      <span>{item.label}</span>
                      <span
                        className={cn(
                          "hidden min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none sm:inline-flex",
                          isStatusActive
                            ? "bg-black/10 text-primary-foreground/80"
                            : "bg-white/[0.05] text-muted-foreground",
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
