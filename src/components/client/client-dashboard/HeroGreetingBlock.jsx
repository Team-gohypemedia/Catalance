import React, { memo, useMemo } from "react";
import { cn } from "@/shared/lib/utils";
import { useOptionalClientDashboardData } from "./useClientDashboardData.js";
import {
  formatDashboardDate,
  getDashboardGreeting,
} from "./dashboard-utils.js";

const HeroGreetingBlock = memo(function HeroGreetingBlock({
  hero,
  className = "",
}) {
  const dashboardData = useOptionalClientDashboardData();
  const sessionUser = dashboardData?.sessionUser ?? null;
  const resolvedHero = useMemo(() => {
    if (hero) {
      return hero;
    }

    return {
      greeting: getDashboardGreeting(),
      firstName: sessionUser?.fullName?.split(" ")[0] || "Client",
      dateLabel: formatDashboardDate(new Date(), {
        weekday: "long",
        month: "short",
        day: "numeric",
      }).toUpperCase(),
      description: "",
    };
  }, [hero, sessionUser?.fullName]);

  const dateLabel = resolvedHero?.dateLabel || "";
  const greeting = resolvedHero?.greeting || "Hello";
  const firstName = resolvedHero?.firstName || "Client";
  const description = resolvedHero?.description || "";

  return (
    <section
      className={cn(
        "mt-14 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between",
        className,
      )}
    >
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground lg:hidden">
          {dateLabel}
        </p>
        <h1 className="text-[clamp(2rem,4vw,3rem)] font-semibold leading-[0.96] tracking-[-0.05em] text-white">
          {greeting}, {firstName}
        </h1>
        {description ? (
          <p className="mt-2 text-sm text-muted-foreground sm:mt-1">
            {description}
          </p>
        ) : null}
      </div>
      <p className="hidden text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground lg:block">
        {dateLabel}
      </p>
    </section>
  );
});

export default HeroGreetingBlock;
