"use client";
import { cn } from "@/shared/lib/utils";
import { memo, useMemo } from "react";

const ShimmerComponent = ({
  children,
  as: Component = "span",
  className,
  duration = 1,
  spread = 2
}) => {
  const textLength = typeof children === 'string' ? children.length : 10;
  const dynamicSpread = useMemo(() => textLength * spread, [textLength, spread]);

  return (
    <Component
      className={cn(
        "relative inline-block bg-[length:250%_100%,auto] bg-clip-text text-transparent animate-shimmer",
        "[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--color-background),#0000_calc(50%+var(--spread)))] [background-repeat:no-repeat,padding-box]",
        className
      )}
      style={{
        "--spread": `${dynamicSpread}px`,
        "--shimmer-duration": `${duration}s`,
        backgroundImage:
          "var(--bg), linear-gradient(white, white)"
      }}
    >
      {children}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 100% center; }
          100% { background-position: 0% center; }
        }
        .animate-shimmer {
          animation: shimmer var(--shimmer-duration, 2s) linear infinite;
        }
      `}</style>
    </Component>
  );
};

export const Shimmer = memo(ShimmerComponent);
