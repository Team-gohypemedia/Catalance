import React, { memo } from "react";
import ProposalBudgetDialog from "@/components/client/client-proposal/ProposalBudgetDialog.jsx";
import { useOptionalClientDashboardData } from "./useClientDashboardData.js";

const ClientDashboardDialogs = () => {
  const dashboardData = useOptionalClientDashboardData();
  const budgetDialogState = dashboardData?.budgetDialogState || {};
  const budgetDialogActions = dashboardData?.budgetDialogActions || {};

  return (
    <ProposalBudgetDialog
      open={Boolean(budgetDialogState.isOpen)}
      proposal={budgetDialogState.budgetDialogProposal}
      budgetInput={budgetDialogState.budgetInput}
      onBudgetInputChange={budgetDialogActions.setBudgetInput}
      onOpenChange={budgetDialogActions.handleBudgetDialogOpenChange}
      onSubmit={budgetDialogActions.submitBudgetIncrease}
      isUpdatingBudget={budgetDialogState.isUpdatingBudget}
    />
  );
};

export default memo(ClientDashboardDialogs);
