"use client";
import { cn } from "@/shared/lib/utils";
import { memo, useId } from "react";

const ShimmerComponent = ({
  children,
  as: Component = "span",
  className,
  style,
  duration = 2,
  textColor = "currentColor",
  shimmerColor = "hsl(var(--primary))"
}) => {
  const id = useId();
  const animationName = `shimmer-${id.replace(/:/g, '')}`;

  return (
    <Component
      className={cn(
        "relative inline-block",
        className
      )}
      style={{
        background: `linear-gradient(90deg, ${textColor} 0%, ${textColor} 40%, ${shimmerColor} 50%, ${textColor} 60%, ${textColor} 100%)`,
        backgroundSize: "200% 100%",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
        color: "transparent",
        animation: `${animationName} ${duration}s linear infinite`,
        ...style
      }}
    >
      {children}
      <style>{`
        @keyframes ${animationName} {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
      `}</style>
    </Component>
  );
};

export const Shimmer = memo(ShimmerComponent);
