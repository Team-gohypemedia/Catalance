import React from "react";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import FolderOpen from "lucide-react/dist/esm/icons/folder-open";
import { Button } from "@/components/ui/button";

export const ActiveJobsTable = ({ metrics, formatCurrency, navigate }) => {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-foreground">
                    Active Jobs
                </h3>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground h-8 text-xs font-medium"
                    onClick={() => navigate("/freelancer/project?view=ongoing")}
                >
                    View All <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card">
                {metrics.acceptedProposals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="p-3 rounded-full bg-muted mb-3">
                            <FolderOpen className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">
                            No active jobs yet
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                            Accepted proposals will appear here
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">
                                    Project
                                </th>
                                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">
                                    Client
                                </th>
                                <th className="px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">
                                    Budget
                                </th>
                                <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right w-12">
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {metrics.acceptedProposals.map((proposal) => (
                                <tr
                                    key={proposal.id}
                                    className="group hover:bg-muted/50 transition-colors cursor-pointer"
                                    onClick={() =>
                                        navigate(
                                            `/freelancer/project/${proposal.project?.id}`
                                        )
                                    }
                                >
                                    <td className="px-4 py-3">
                                        <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                                            {proposal.project?.title || "Untitled Project"}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {new Date(
                                                proposal.project?.createdAt || Date.now()
                                            ).toLocaleDateString(undefined, {
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                            Active
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 hidden sm:table-cell">
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
                                                {(
                                                    proposal.project?.owner?.fullName || "C"
                                                ).charAt(0)}
                                            </div>
                                            <span className="text-sm text-foreground">
                                                {proposal.project?.owner?.fullName ||
                                                    "Client"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell">
                                        <span className="text-sm font-medium text-foreground">
                                            {formatCurrency(proposal.amount * 0.7)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors inline-block" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
