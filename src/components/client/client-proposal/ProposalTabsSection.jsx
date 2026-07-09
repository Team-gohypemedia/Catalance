import React, { memo, useEffect, useMemo, useState } from "react";
import ClientPageHeader from "@/components/features/client/ClientPageHeader";
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
import ListFilter from "lucide-react/dist/esm/icons/list-filter";

const proposalTypeConfig = [
  { value: "freelancer", label: "Freelancer" },
  { value: "agency", label: "Agency" },
];

const statusTabConfig = [
  { value: "draft", label: "Draft Proposals" },
  { value: "pending", label: "Pending Approval" },
  { value: "applications", label: "Marketplace Proposals" },
  { value: "rejected", label: "Rejected Proposals" },
];

const statusFilterConfig = [
  { value: "all", label: "All Proposals" },
  { value: "draft", label: "Draft Proposals" },
  { value: "pending", label: "Pending Approval" },
  { value: "applications", label: "Marketplace Proposals" },
  { value: "rejected", label: "Rejected Proposals" },
];

const segmentedControlClassName =
  "inline-flex h-auto w-full flex-nowrap items-stretch justify-between gap-0.5 rounded-[32px] border border-border bg-background p-0.5 shadow-none sm:gap-1 sm:p-1";

const buildProposalBucketsByType = (grouped = {}) => {
  const buckets = {
    freelancer: { draft: [], pending: [], applications: [], rejected: [] },
    agency: { draft: [], pending: [], applications: [], rejected: [] },
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
    grouped,
    isLoading,
    processingPaymentProposalId,
    sendingProposalId,
    acceptingProposalId,
    rejectingProposalId,
  } = proposalState;
  const {
    handleApproveAndPay,
    handleDelete,
    openBudgetDialogForProposal,
    handleOpenFreelancerDetails,
    handleOpenProposal,
    openFreelancerSelection,
    handleAcceptApplication,
    handleRejectApplication,
  } = actions;
  const [activeType, setActiveType] = useState("freelancer");
  const [activeStatusFilter, setActiveStatusFilter] = useState("all");
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

  const activeStatusLabel = statusFilterConfig.find((item) => item.value === activeStatusFilter)?.label || "All Proposals";

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
  const emptyStateTitle =
    activeType === "agency"
      ? "No agency proposals found"
      : "No freelancer proposals found";
  const emptyStateDescription = `Create a new ${activeType} proposal to see results here.`;

  const renderTabContent = (tabValue, title) => {
    const items = scopedGrouped[tabValue] || [];

    if (isLoading) {
      return (
        <div className="space-y-4">
          {title && <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h2>}
          <ProposalLoadingState />
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="space-y-4">
          {title && <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h2>}
          <EmptyStateCard
            title={emptyStateTitle}
            description={emptyStateDescription}
          />
        </div>
      );
    }

    if (tabValue === "draft") {
      return (
        <ProposalCardsCarousel
          title={title}
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
          title={title}
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

    if (tabValue === "applications") {
      return (
        <ProposalCardsCarousel
          title={title}
          proposals={items}
          onOpen={handleOpenProposal}
          onDelete={handleDelete}
          onAcceptApplication={handleAcceptApplication}
          onRejectApplication={handleRejectApplication}
          onViewFreelancers={handleOpenFreelancerDetails}
          acceptingProposalId={acceptingProposalId}
          rejectingProposalId={rejectingProposalId}
        />
      );
    }

    return (
      <ProposalCardsCarousel
        title={title}
        proposals={items}
        onOpen={handleOpenProposal}
        onDelete={handleDelete}
        onIncreaseBudget={openBudgetDialogForProposal}
        onViewFreelancers={handleOpenFreelancerDetails}
      />
    );
  };

  return (
    <div className="w-full space-y-8">
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
          <div className="flex flex-col items-start lg:items-end gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Freelancer / Agency Toggle */}
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
                          ? "bg-white text-primary"
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
                  <span>{activeStatusLabel}</span>
                </span>
                <ChevronDown className={cn("h-5 w-5 text-foreground transition-transform duration-200", dropdownOpen && "rotate-180")} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-full min-w-[14.5rem] rounded-[20px] border border-border bg-card p-2 shadow-[0_12px_32px_rgba(0,0,0,0.08)] animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex flex-col gap-1">
                    {statusFilterConfig.map((item) => {
                      const isStatusActive = item.value === activeStatusFilter;
                      
                      let Icon = ListFilter;
                      if (item.value === "draft") Icon = FileText;
                      else if (item.value === "pending") Icon = History;
                      else if (item.value === "applications") Icon = Check;
                      else if (item.value === "rejected") Icon = XCircle;
                      
                      // Custom styles for icons
                      const iconColor = item.value === "rejected" ? "text-destructive" : "text-primary";

                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => {
                            setActiveStatusFilter(item.value);
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
                          {isStatusActive && (
                            <Check className="h-[18px] w-[18px] text-primary" />
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

      <div className="space-y-12 pb-12">
        {statusTabConfig.map((status) => {
          if (activeStatusFilter !== "all" && activeStatusFilter !== status.value) {
            return null;
          }

          // If there are no items for this status and it's not "draft", we can choose to hide it or show empty state.
          // Since the user wants to see the sections, let's render them with titles.
          const items = scopedGrouped[status.value] || [];
          
          // Let's only render empty state for "draft" when viewing "All Proposals". 
          // For pending, applications, and rejected, hide the section if empty so it doesn't look too cluttered in the "All" view.
          // However, if the user explicitly filters by a status, show its empty state.
          if (!isLoading && items.length === 0 && status.value !== "draft" && activeStatusFilter === "all") {
            return null;
          }

          return (
            <section key={status.value} className="space-y-2">
              {renderTabContent(status.value, status.label)}
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default memo(ProposalTabsSection);
