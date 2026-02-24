import React from "react";
import IndianRupee from "lucide-react/dist/esm/icons/indian-rupee";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import Send from "lucide-react/dist/esm/icons/send";

export const StatsGrid = ({ metrics, formatCurrency }) => {
    const stats = [
        {
            label: "Total Earnings",
            value: formatCurrency(metrics.earnings),
            subtitle: "Estimated (70% share)",
            icon: IndianRupee,
            iconBg: "bg-primary/10",
            iconColor: "text-primary",
            borderHover: "hover:border-primary/40",
        },
        {
            label: "Active Projects",
            value: metrics.activeProjects,
            subtitle: `${Math.min(metrics.activeProjects, 5)} of 5 capacity`,
            icon: Briefcase,
            iconBg: "bg-blue-500/10",
            iconColor: "text-blue-500",
            borderHover: "hover:border-blue-500/40",
            progress: Math.min((metrics.activeProjects / 5) * 100, 100),
            progressColor: "bg-blue-500",
        },
        {
            label: "Pending Proposals",
            value: metrics.proposalsReceived,
            subtitle: "Awaiting response",
            icon: Send,
            iconBg: "bg-violet-500/10",
            iconColor: "text-violet-500",
            borderHover: "hover:border-violet-500/40",
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                    <div
                        key={stat.label}
                        className={`bg-card p-5 rounded-xl border border-border shadow-sm ${stat.borderHover} transition-all duration-200 group`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <p className="text-sm font-medium text-muted-foreground">
                                {stat.label}
                            </p>
                            <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                                <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                            </div>
                        </div>
                        <p className="text-2xl font-bold tracking-tight text-foreground mb-1">
                            {stat.value}
                        </p>
                        {stat.progress !== undefined ? (
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${stat.progressColor} rounded-full transition-all duration-700`}
                                        style={{ width: `${stat.progress}%` }}
                                    />
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {stat.subtitle}
                                </span>
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground">
                                {stat.subtitle}
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

