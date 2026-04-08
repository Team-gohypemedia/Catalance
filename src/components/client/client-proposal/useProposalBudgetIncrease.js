import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { formatINR } from "@/shared/lib/currency";
import { parseProposalBudgetValue } from "./proposal-utils.js";
import {
  getProposalBudgetProjectId,
  getProposalBudgetUpdateTargets,
  resolveProposalBudgetTarget,
  resolveProposalBudgetTitle,
  resolveProposalBudgetValue,
  syncStoredProposalBudgetRecords,
} from "./proposal-budget-utils.js";

export const useProposalBudgetIncrease = ({
  authFetch,
  userId,
  proposals = [],
  notifications = [],
  markNotificationAsRead,
  onBudgetUpdated,
}) => {
  const proposalsRef = useRef(proposals);
  const notificationsRef = useRef(notifications);
  const [budgetDialogProposal, setBudgetDialogProposal] = useState(null);
  const [budgetInput, setBudgetInput] = useState("");
  const [isUpdatingBudget, setIsUpdatingBudget] = useState(false);

  useEffect(() => {
    proposalsRef.current = proposals;
  }, [proposals]);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const resetBudgetDialog = useCallback(() => {
    setBudgetDialogProposal(null);
    setBudgetInput("");
  }, []);

  const openBudgetDialogForProposal = useCallback((proposal) => {
    const resolvedProposal = resolveProposalBudgetTarget(proposalsRef.current, proposal);

    if (!resolvedProposal) {
      toast.error("Could not find the proposal budget to update.");
      return;
    }

    setBudgetDialogProposal(resolvedProposal);
    setBudgetInput("");
  }, []);

  const openBudgetDialogByProjectId = useCallback((projectId) => {
    const resolvedProposal = resolveProposalBudgetTarget(
      proposalsRef.current,
      projectId,
    );

    if (!resolvedProposal) {
      toast.error("Could not find the proposal budget to update.");
      return;
    }

    setBudgetDialogProposal(resolvedProposal);
    setBudgetInput("");
  }, []);

  const handleBudgetDialogOpenChange = useCallback(
    (open) => {
      if (!open) {
        resetBudgetDialog();
      }
    },
    [resetBudgetDialog],
  );

  const submitBudgetIncrease = useCallback(async () => {
    const targetProposal = resolveProposalBudgetTarget(
      proposalsRef.current,
      budgetDialogProposal,
    );
    const projectId = getProposalBudgetProjectId(targetProposal);
    const nextBudgetValue = parseProposalBudgetValue(budgetInput);
    const currentBudgetValue = resolveProposalBudgetValue(targetProposal);

    if (!projectId || !targetProposal) {
      toast.error("Could not resolve the proposal budget to update.");
      return;
    }

    if (!nextBudgetValue || nextBudgetValue <= currentBudgetValue) {
      toast.error("New budget must be higher than the current budget.");
      return;
    }

    setIsUpdatingBudget(true);

    try {
      const projectResponse = await authFetch(`/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budget: nextBudgetValue }),
      });
      const projectPayload = await projectResponse.json().catch(() => null);

      if (!projectResponse.ok) {
        throw new Error(projectPayload?.message || "Failed to update budget.");
      }

      const proposalTargets = getProposalBudgetUpdateTargets(
        proposalsRef.current,
        targetProposal,
      );

      const updateResults = await Promise.allSettled(
        proposalTargets.map(async (proposal) => {
          const response = await authFetch(`/proposals/${proposal.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: nextBudgetValue }),
          });
          const payload = await response.json().catch(() => null);

          if (!response.ok) {
            throw new Error(payload?.message || "Failed to update proposal budget.");
          }

          return proposal.id;
        }),
      );

      const updatedProposalIds = updateResults
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);
      const failedProposalUpdates = updateResults.filter(
        (result) => result.status === "rejected",
      );

      syncStoredProposalBudgetRecords({
        userId,
        projectId,
        projectTitle: resolveProposalBudgetTitle(targetProposal),
        budgetValue: nextBudgetValue,
      });

      const matchingNotifications = (Array.isArray(notificationsRef.current)
        ? notificationsRef.current
        : []
      )
        .filter(
          (notification) =>
            !notification?.read &&
            String(notification?.type || "").toLowerCase() === "budget_suggestion" &&
            String(notification?.data?.projectId || "").trim() === projectId,
        )
        .map((notification) => notification?.id)
        .filter(Boolean);

      if (
        matchingNotifications.length > 0 &&
        typeof markNotificationAsRead === "function"
      ) {
        await Promise.allSettled(
          matchingNotifications.map((notificationId) =>
            markNotificationAsRead(notificationId),
          ),
        );
      }

      if (typeof onBudgetUpdated === "function") {
        await onBudgetUpdated({
          projectId,
          proposal: targetProposal,
          budgetValue: nextBudgetValue,
          updatedProposalIds,
        });
      }

      const notifiedCount = updatedProposalIds.length;
      const formattedBudget = formatINR(nextBudgetValue);

      if (failedProposalUpdates.length > 0) {
        toast.success(
          notifiedCount > 0
            ? `Budget updated to ${formattedBudget}. ${notifiedCount} freelancer${notifiedCount === 1 ? "" : "s"} were notified.`
            : `Budget updated to ${formattedBudget}.`,
        );
        toast.error("Some freelancer proposal updates could not be completed.");
      } else {
        toast.success(
          notifiedCount > 0
            ? `Budget updated to ${formattedBudget}. ${notifiedCount} freelancer${notifiedCount === 1 ? "" : "s"} were notified.`
            : `Budget updated to ${formattedBudget}.`,
        );
      }

      resetBudgetDialog();
    } catch (error) {
      console.error("Failed to increase proposal budget:", error);
      toast.error(error?.message || "Failed to update budget.");
    } finally {
      setIsUpdatingBudget(false);
    }
  }, [
    authFetch,
    budgetDialogProposal,
    budgetInput,
    markNotificationAsRead,
    onBudgetUpdated,
    resetBudgetDialog,
    userId,
  ]);

  return {
    budgetDialogState: {
      budgetDialogProposal,
      budgetInput,
      isUpdatingBudget,
      isOpen: Boolean(budgetDialogProposal),
    },
    budgetDialogActions: {
      openBudgetDialogForProposal,
      openBudgetDialogByProjectId,
      handleBudgetDialogOpenChange,
      setBudgetInput,
      submitBudgetIncrease,
      resetBudgetDialog,
    },
  };
};

