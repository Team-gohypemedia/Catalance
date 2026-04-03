import React from "react";

const HeroGreetingBlock = ({ greeting, firstName, dateLabel, className = "" }) => {
  return (
    <section
      className={`mt-1 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between ${className}`.trim()}
    >
      <p className="order-1 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground lg:order-2">
        {dateLabel}
      </p>
      <div className="order-2 min-w-0 lg:order-1">
        <h1 className="text-[clamp(2rem,4vw,3rem)] font-semibold leading-[0.96] tracking-[-0.05em] text-white">
          {greeting}, {firstName}
        </h1>
      </div>
    </section>
  );
};

export default HeroGreetingBlock;
