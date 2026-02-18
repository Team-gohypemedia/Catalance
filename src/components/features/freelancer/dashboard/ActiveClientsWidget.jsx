import React from "react";
import MessageSquare from "lucide-react/dist/esm/icons/message-square";
import Users from "lucide-react/dist/esm/icons/users";
import { Button } from "@/components/ui/button";

export const ActiveClientsWidget = ({ metrics, navigate }) => {
    return (
        <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-500/10">
                        <Users className="h-4 w-4 text-blue-500" />
                    </div>
                    <h3 className="font-semibold text-sm text-foreground">
                        Active Clients
                    </h3>
                </div>
                {metrics.acceptedProposals.length > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground h-7 text-xs px-2"
                        onClick={() => navigate("/freelancer/messages")}
                    >
                        View All
                    </Button>
                )}
            </div>
            <div className="flex flex-col gap-2">
                {metrics.acceptedProposals.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                        No active clients yet
                    </p>
                ) : (
                    metrics.acceptedProposals.slice(0, 5).map((proposal) => (
                        <div
                            key={proposal.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                        >
                            <div className="relative">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                                    {(proposal.project?.owner?.fullName || "C").charAt(0)}
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-card rounded-full" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                    {proposal.project?.owner?.fullName || "Client"}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {proposal.project?.title}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(
                                        `/freelancer/messages?projectId=${proposal.projectId}`
                                    );
                                }}
                            >
                                <MessageSquare className="h-4 w-4" />
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
