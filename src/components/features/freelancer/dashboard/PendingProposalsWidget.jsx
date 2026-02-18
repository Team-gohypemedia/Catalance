import React from "react";
import FileText from "lucide-react/dist/esm/icons/file-text";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import { Button } from "@/components/ui/button";

export const PendingProposalsWidget = ({
    metrics,
    formatCurrency,
    navigate,
}) => {
    return (
        <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-violet-500/10">
                        <FileText className="h-4 w-4 text-violet-500" />
                    </div>
                    <h3 className="font-semibold text-sm text-foreground">
                        Pending Proposals
                    </h3>
                </div>
                {metrics.proposalsReceived > 0 && (
                    <span className="text-xs font-semibold text-violet-500 bg-violet-500/10 px-2 py-0.5 rounded-md">
                        {metrics.proposalsReceived}
                    </span>
                )}
            </div>

            <div className="flex flex-col gap-2">
                {metrics.pendingProposals.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                        No pending proposals
                    </p>
                ) : (
                    <>
                        {metrics.pendingProposals.slice(0, 3).map((p) => (
                            <div
                                key={p.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer group"
                                onClick={() => navigate("/freelancer/proposals")}
                            >
                                <div className="flex-1 min-w-0 mr-3">
                                    <p className="text-sm font-medium text-foreground truncate">
                                        {p.project?.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatCurrency(p.amount * 0.7)}
                                    </p>
                                </div>
                                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                            </div>
                        ))}
                        {metrics.pendingProposals.length > 3 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs text-muted-foreground hover:text-foreground mt-1"
                                onClick={() => navigate("/freelancer/proposals")}
                            >
                                View all {metrics.proposalsReceived} proposals
                            </Button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
