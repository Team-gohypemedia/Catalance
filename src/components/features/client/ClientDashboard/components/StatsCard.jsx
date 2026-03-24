import React, { memo } from "react";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import { Card, CardContent } from "@/components/ui/card";

const StatsCard = ({
  title,
  value,
  trend,
  trendType = "up",
  icon: Icon,
  accentColor = "primary",
}) => {
  const colors = {
    primary: "bg-primary/10",
    blue: "bg-blue-500/10",
    red: "bg-red-500/10",
    green: "bg-green-500/10",
  };

  return (
    <Card className="group relative overflow-hidden rounded-xl border-border/60 transition-shadow hover:shadow-md">
      <div
        className={`absolute top-0 right-0 h-16 w-16 ${colors[accentColor]} -mt-2 -mr-2 rounded-bl-full transition-transform group-hover:scale-110`}
      />
      <CardContent className="relative z-10 p-6">
        <p className="mb-1 text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="text-3xl tracking-tight">{value}</h3>
        {trend ? (
          <p
            className={`mt-2 flex items-center text-xs font-bold ${
              trendType === "up"
                ? "text-green-600"
                : trendType === "warning"
                  ? "text-orange-600"
                  : "text-muted-foreground"
            }`}
          >
            {trendType === "up" ? (
              <TrendingUp className="mr-1 h-3.5 w-3.5" />
            ) : null}
            {trendType === "warning" ? (
              <AlertTriangle className="mr-1 h-3.5 w-3.5" />
            ) : null}
            {trend}
          </p>
        ) : null}
        {Icon ? <div className="mt-3 flex -space-x-2 overflow-hidden" /> : null}
      </CardContent>
    </Card>
  );
};

export default memo(StatsCard);
