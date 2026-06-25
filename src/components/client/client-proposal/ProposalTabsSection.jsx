import React, { memo, useEffect, useMemo, useState } from "react";
import ClientPageHeader from "@/components/features/client/ClientPageHeader";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/shared/lib/utils";
import ProposalCardsCarousel from "./ProposalCardsCarousel.jsx";
import { EmptyStateCard, ProposalLoadingState } from "./ProposalStates.jsx";
import { proposalTabCopy } from "./proposal-utils.js";

import ArrowUpNarrowWide from "lucide-react/dist/esm/icons/arrow-up-narrow-wide";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import Check from "lucide-react/dist/esm/icons/check";
import FileText from "lucide-react/dist/esm/icons/file-text";
import History from "lucide-react/dist/esm/icons/history";
import XCircle from "lucide-react/dist/esm/icons/x-circle";

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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeTabLabel = statusTabConfig.find((item) => item.value === activeTab)?.label || "Draft";

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
          showCreateCard={true}
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
        title={
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <span>Project Proposals</span>
          </div>
        }
        dateLabel={false}
        className="lg:items-start"
        titleClassName="text-[clamp(1.35rem,2.1vw,2.55rem)] leading-[0.98] tracking-[-0.05em] whitespace-nowrap"
        actions={
          <div className="flex flex-col sm:flex-row gap-3.5 items-start sm:items-center w-full sm:w-auto">
            <div className="flex items-center gap-2 sm:gap-3">
              {proposalTypeConfig.map((item) => {
                const isActive = item.value === activeType;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setHasSelectedType(true);
                      setActiveType(item.value);
                    }}
                    className={cn(
                      "inline-flex items-center justify-center rounded-full font-semibold whitespace-nowrap transition-all duration-300",
                      "h-8 px-3 text-xs sm:h-[46px] sm:px-6 sm:text-[15px]",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(var(--brand-rgb),0.2)] dark:shadow-none"
                        : "border border-border bg-card text-foreground hover:bg-muted/50 dark:hover:bg-zinc-800/50"
                    )}
                  >
                    <span>{item.label}</span>
                    <span
                      className={cn(
                        "ml-1.5 sm:ml-2 inline-flex items-center justify-center rounded-full font-bold leading-none transition-colors duration-300",
                        "h-4 w-4 text-[10px] sm:h-5 sm:w-5 sm:text-[10px]",
                        isActive
                          ? "bg-white/20 text-primary-foreground"
                          : "bg-muted text-foreground"
                      )}
                    >
                      {typeCounts[item.value] || 0}
                    </span>
                  </button>
                );
              })}
            </div>
            {/* Custom status dropdown select */}
            <div ref={dropdownRef} className="relative w-full sm:w-[14.5rem] shrink-0">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex h-[46px] w-full items-center justify-between rounded-[14px] border-2 border-primary bg-card px-4 text-[15px] font-semibold text-foreground transition hover:bg-muted/20"
              >
                <span className="flex items-center gap-2">
                  <ArrowUpNarrowWide className="h-5 w-5 text-primary" />
                  <span>{activeTabLabel}</span>
                </span>
                <ChevronDown className={cn("h-5 w-5 text-foreground transition-transform duration-200", dropdownOpen && "rotate-180")} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-full min-w-[14.5rem] rounded-[20px] border border-border bg-card p-2 shadow-[0_12px_32px_rgba(0,0,0,0.08)] animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex flex-col gap-1">
                    {statusTabConfig.map((item) => {
                      const isStatusActive = item.value === activeTab;
                      const Icon = item.value === "draft" ? FileText : item.value === "pending" ? History : XCircle;
                      
                      // Custom styles for icons
                      const iconColor = item.value === "rejected" ? "text-destructive" : "text-primary";

                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => {
                            setActiveTab(item.value);
                            setDropdownOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between rounded-[12px] px-3.5 py-3 text-left text-sm font-semibold transition-colors duration-200",
                            isStatusActive
                              ? "bg-primary/10 text-foreground"
                              : "bg-transparent text-foreground hover:bg-muted/50"
                          )}
                        >
                          <span className="flex items-center gap-3">
                            <Icon className={cn("h-5 w-5 shrink-0", iconColor)} />
                            <span>{item.label}</span>
                          </span>
                          {isStatusActive ? (
                            <Check className="h-[18px] w-[18px] text-primary" />
                          ) : (
                            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-bold text-muted-foreground">
                              {statusCounts[item.value] || 0}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
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
