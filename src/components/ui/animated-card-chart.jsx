"use client";

import * as React from "react";
import { useState } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * A utility function to conditionally join class names.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const floatingAnimation = `
@keyframes floating {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}
`;

// --- Card Components ---

export function AnimatedCard({ className, ...props }) {
  return (
    <>
      <style>{floatingAnimation}</style>
      <div
        role="region"
        aria-labelledby="card-title"
        aria-describedby="card-description"
        className={cn(
          "group/animated-card relative w-full overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition-all duration-500 cursor-pointer hover:!animate-none hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_20px_40px_-15px_rgba(217,105,42,0.15)] dark:border-zinc-800 dark:bg-black dark:hover:border-primary/30",
          className
        )}
        style={{
          animation: "floating 3s ease-in-out infinite"
        }}
        {...props}
      />
    </>
  );
}

export function CardBody({ className, ...props }) {
  return (
    <div
      role="group"
      className={cn(
        "flex flex-col space-y-1.5 border-t border-zinc-200 p-6 dark:border-zinc-800",
        className
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }) {
  return (
    <h3
      className={cn(
        "text-xl font-bold leading-none tracking-tight text-black dark:text-white",
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }) {
  return (
    <p
      className={cn(
        "text-sm text-neutral-500 dark:text-neutral-400",
        className
      )}
      {...props}
    />
  );
}

export function CardVisual({ className, ...props }) {
  return (
    <div
      className={cn("h-[240px] w-full overflow-hidden relative", className)}
      {...props}
    />
  );
}

// --- Visual3 Component and its Sub-components ---

export function Visual3({
  mainColor = "#D9692A",
  secondaryColor = "#F9D949",
  gridColor = "#80808015",
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div 
      className="relative h-full w-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="absolute inset-0 z-20"
        style={{
          "--color": mainColor,
          "--secondary-color": secondaryColor,
        }}
      />

      <div className="relative h-full w-full overflow-hidden rounded-t-[32px]">
        <Layer4
          color={mainColor}
          secondaryColor={secondaryColor}
          hovered={hovered}
        />
        <Layer3 color={mainColor} />
        <Layer2 color={mainColor} />
        <Layer1 color={mainColor} secondaryColor={secondaryColor} />
        <EllipseGradient color={mainColor} />
        <GridLayer color={gridColor} />
      </div>
    </div>
  );
}

const GridLayer = ({ color }) => {
  return (
    <div
      style={{ "--grid-color": color }}
      className="pointer-events-none absolute inset-0 z-[4] h-full w-full bg-transparent bg-[linear-gradient(to_right,var(--grid-color)_1px,transparent_1px),linear-gradient(to_bottom,var(--grid-color)_1px,transparent_1px)] bg-[size:24px_24px] bg-center opacity-70 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]"
    />
  );
};

const EllipseGradient = ({ color }) => {
  return (
    <div className="absolute inset-0 z-[5] flex h-full w-full items-center justify-center">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 356 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <rect width="356" height="180" fill="url(#paint0_radial_12_207)" />
        <defs>
          <radialGradient
            id="paint0_radial_12_207"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(178 98) rotate(90) scale(98 178)"
          >
            <stop stopColor={color} stopOpacity="0.25" />
            <stop offset="0.34" stopColor={color} stopOpacity="0.15" />
            <stop offset="1" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
};

const Layer1 = ({ color, secondaryColor }) => {
  return (
    <div
      className="absolute top-6 left-6 z-[8] flex items-center gap-2"
      style={{
        "--color": color,
        "--secondary-color": secondaryColor,
      }}
    >
      <div className="flex shrink-0 items-center rounded-full border border-zinc-200 bg-white/25 px-2 py-1 backdrop-blur-sm transition-opacity duration-300 ease-in-out group-hover/animated-card:opacity-0 dark:border-zinc-800 dark:bg-black/25">
        <div className="h-2 w-2 rounded-full bg-[var(--color)]" />
        <span className="ml-1.5 text-[11px] font-bold text-black dark:text-white">
          +15,2%
        </span>
      </div>
      <div className="flex shrink-0 items-center rounded-full border border-zinc-200 bg-white/25 px-2 py-1 backdrop-blur-sm transition-opacity duration-300 ease-in-out group-hover/animated-card:opacity-0 dark:border-zinc-800 dark:bg-black/25">
        <div className="h-2 w-2 rounded-full bg-[var(--secondary-color)]" />
        <span className="ml-1.5 text-[11px] font-bold text-black dark:text-white">
          +18,7%
        </span>
      </div>
    </div>
  );
};

const Layer2 = ({ color }) => {
  return (
    <div
      className="group relative h-full w-full"
      style={{ "--color": color }}
    >
      <div className="ease-[cubic-bezier(0.6, 0.6, 0, 1)] absolute inset-0 z-[7] flex w-full translate-y-full items-start justify-center bg-transparent px-6 pt-2 transition-transform duration-500 group-hover/animated-card:translate-y-0">
        <div className="ease-[cubic-bezier(0.6, 0, 1)] rounded-xl border border-zinc-200 bg-white/60 p-3 opacity-0 shadow-lg backdrop-blur-xl transition-opacity duration-500 group-hover/animated-card:opacity-100 dark:border-zinc-800 dark:bg-black/60">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color)]" />
            <p className="text-xs font-bold text-black dark:text-white">
              Project Delivery Velocity
            </p>
          </div>
          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
            Real-time efficiency metrics visualization.
          </p>
        </div>
      </div>
    </div>
  );
};

const Layer3 = ({ color }) => {
  return (
    <div className="ease-[cubic-bezier(0.6, 0.6, 0, 1)] absolute inset-0 z-[6] flex translate-y-full items-center justify-center opacity-0 transition-all duration-500 group-hover/animated-card:translate-y-0 group-hover/animated-card:opacity-100">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 356 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <rect width="356" height="180" fill="url(#paint0_linear_29_3)" />
        <defs>
          <linearGradient
            id="paint0_linear_29_3"
            x1="178"
            y1="0"
            x2="178"
            y2="180"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0.35" stopColor={color} stopOpacity="0" />
            <stop offset="1" stopColor={color} stopOpacity="0.3" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

const Layer4 = ({ color, secondaryColor, hovered }) => {
  const rectsData = [
    { width: 15, height: 20, y: 130, hoverHeight: 20, hoverY: 150, x: 40, fill: "currentColor", hoverFill: secondaryColor },
    { width: 15, height: 20, y: 110, hoverHeight: 20, hoverY: 150, x: 60, fill: color, hoverFill: color },
    { width: 15, height: 40, y: 90, hoverHeight: 30, hoverY: 140, x: 80, fill: color, hoverFill: color },
    { width: 15, height: 30, y: 100, hoverHeight: 50, hoverY: 120, x: 100, fill: color, hoverFill: color },
    { width: 15, height: 30, y: 130, hoverHeight: 40, hoverY: 130, x: 120, fill: "currentColor", hoverFill: secondaryColor },
    { width: 15, height: 50, y: 130, hoverHeight: 20, hoverY: 150, x: 140, fill: "currentColor", hoverFill: secondaryColor },
    { width: 15, height: 50, y: 80, hoverHeight: 30, hoverY: 140, x: 160, fill: color, hoverFill: color },
    { width: 15, height: 30, y: 100, hoverHeight: 20, hoverY: 150, x: 180, fill: color, hoverFill: color },
    { width: 15, height: 20, y: 130, hoverHeight: 40, hoverY: 130, x: 200, fill: "currentColor", hoverFill: secondaryColor },
    { width: 15, height: 40, y: 90, hoverHeight: 60, hoverY: 110, x: 220, fill: color, hoverFill: color },
    { width: 15, height: 30, y: 130, hoverHeight: 70, hoverY: 100, x: 240, fill: "currentColor", hoverFill: secondaryColor },
    { width: 15, height: 50, y: 130, hoverHeight: 50, hoverY: 120, x: 260, fill: "currentColor", hoverFill: secondaryColor },
    { width: 15, height: 20, y: 130, hoverHeight: 80, hoverY: 90, x: 280, fill: "currentColor", hoverFill: secondaryColor },
    { width: 15, height: 30, y: 100, hoverHeight: 90, hoverY: 60, x: 300, fill: color, hoverFill: color },
  ];

  return (
    <div className="ease-[cubic-bezier(0.6, 0.6, 0, 1)] absolute inset-0 z-[8] flex h-full w-full items-center justify-center text-neutral-800/10 transition-transform duration-500 group-hover/animated-card:scale-150 dark:text-white/15">
      <svg width="100%" height="100%" viewBox="0 0 356 180" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
        {rectsData.map((rect, index) => (
          <rect
            key={index}
            width={rect.width}
            height={hovered ? rect.hoverHeight : rect.height}
            x={rect.x}
            y={hovered ? rect.hoverY : rect.y}
            fill={hovered ? rect.hoverFill : rect.fill}
            rx="3"
            ry="3"
            className="ease-[cubic-bezier(0.6, 0.6, 0, 1)] transition-all duration-500"
          />
        ))}
      </svg>
    </div>
  );
};
