import React, { memo } from "react";
import { cn } from "@/shared/lib/utils";

const HeroGreetingBlock = memo(function HeroGreetingBlock({
  hero,
  className = "",
}) {
  const dateLabel = hero?.dateLabel || "";
  const greeting = hero?.greeting || "Hello";
  const firstName = hero?.firstName || "Client";
  const description = hero?.description || "";

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
