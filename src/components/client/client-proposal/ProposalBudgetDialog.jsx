import React, { memo } from "react";
import Loader from "@/components/common/Loader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatINR } from "@/shared/lib/currency";
import { resolveProposalBusinessName, resolveProposalTitle } from "./proposal-utils.js";
import { resolveProposalBudgetValue } from "./proposal-budget-utils.js";

const ProposalBudgetDialog = ({
  open,
  proposal,
  budgetInput,
  onBudgetInputChange,
  onOpenChange,
  onSubmit,
  isUpdatingBudget = false,
}) => {
  const proposalLabel =
    resolveProposalBusinessName(proposal) || resolveProposalTitle(proposal) || "this proposal";
  const currentBudgetValue = resolveProposalBudgetValue(proposal);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-border dark:border-white/10 bg-background text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Increase Budget</DialogTitle>
          <DialogDescription className="text-sm leading-6 text-muted-foreground">
            Update the budget for {proposalLabel} and notify freelancers who still
            have this proposal pending in their proposal section.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-[18px] border border-border dark:border-white/10 bg-background/35 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Current Budget
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {currentBudgetValue > 0 ? formatINR(currentBudgetValue) : "Not set"}
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="proposal-budget-increase-input"
              className="text-sm font-medium text-foreground"
            >
              New Budget
            </label>
            <Input
              id="proposal-budget-increase-input"
              value={budgetInput}
              onChange={(event) => onBudgetInputChange?.(event.target.value)}
              placeholder="e.g. 60000 or INR 60,000"
              className="h-11 border-border dark:border-white/10 bg-background/60 text-foreground placeholder:text-[#6f7785] focus-visible:border-[var(--primary)]/45 focus-visible:ring-[var(--primary)]/20"
            />
          </div>
        </div>

        <DialogFooter className="gap-3 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            className="border-border dark:border-white/10 bg-background/30 text-foreground dark:text-white hover:bg-muted dark:hover:bg-background/50"
            onClick={() => onOpenChange?.(false)}
            disabled={isUpdatingBudget}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={onSubmit}
            disabled={isUpdatingBudget}
          >
            {isUpdatingBudget ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isUpdatingBudget ? "Updating..." : "Update Budget"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default memo(ProposalBudgetDialog);

