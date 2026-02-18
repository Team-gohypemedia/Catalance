import React from "react";
import Target from "lucide-react/dist/esm/icons/target";

export const EarningsGoalWidget = ({ metrics, formatCurrency }) => {
    const percentage =
        metrics.earnings > 0
            ? Math.round((metrics.receivedEarnings / metrics.earnings) * 100)
            : 0;

    return (
        <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-primary/10">
                    <Target className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">
                    Earnings Goal
                </h3>
            </div>

            <div className="flex items-center gap-5">
                {/* Circular Progress */}
                <div className="relative w-20 h-20 shrink-0">
                    <svg
                        className="w-full h-full transform -rotate-90"
                        viewBox="0 0 100 100"
                    >
                        <circle
                            cx="50"
                            cy="50"
                            r="42"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-muted"
                        />
                        <circle
                            cx="50"
                            cy="50"
                            r="42"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={263.89}
                            strokeDashoffset={263.89 - 263.89 * (percentage / 100)}
                            className="text-primary transition-all duration-1000 ease-out"
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-foreground">
                            {percentage}%
                        </span>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex flex-col gap-3 flex-1 min-w-0">
                    <div>
                        <p className="text-xs text-muted-foreground mb-0.5">
                            Received
                        </p>
                        <p className="text-base font-semibold text-foreground">
                            {formatCurrency(metrics.receivedEarnings || 0)}
                        </p>
                    </div>
                    <div className="h-px bg-border" />
                    <div>
                        <p className="text-xs text-muted-foreground mb-0.5">
                            Pending
                        </p>
                        <p className="text-base font-semibold text-foreground">
                            {formatCurrency(metrics.pendingEarnings || 0)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
