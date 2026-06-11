"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Moon from "lucide-react/dist/esm/icons/moon";
import Sun from "lucide-react/dist/esm/icons/sun";
import { flushSync } from "react-dom";
import { cn } from "@/shared/lib/utils";
import { useTheme } from "@/components/providers/theme-provider";

// ─── Clip-path helpers ──────────────────────────────────────────────────────

function polygonCollapsed(cx, cy, vertexCount) {
  const pairs = Array.from({ length: vertexCount }, () => `${cx}px ${cy}px`).join(", ");
  return `polygon(${pairs})`;
}

function getClipPaths(cx, cy, maxRadius) {
  return [
    `circle(0px at ${cx}px ${cy}px)`,
    `circle(${maxRadius}px at ${cx}px ${cy}px)`,
  ];
}

// ─── AnimatedThemeToggler ────────────────────────────────────────────────────

/**
 * Drop-in replacement for ThemeToggle.
 * Uses the View Transitions API for an animated circle reveal on toggle.
 * Integrates with the existing useTheme() context (light / dark only — no system).
 */
export default function ThemeToggle({ className }) {
  const { theme, setTheme } = useTheme();
  const buttonRef = useRef(null);
  const isDark = theme === "dark";

  const toggleTheme = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;

    const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;

    const { top, left, width, height } = button.getBoundingClientRect();
    const cx = left + width / 2;
    const cy = top + height / 2;

    const maxRadius = Math.hypot(
      Math.max(cx, viewportWidth - cx),
      Math.max(cy, viewportHeight - cy)
    );

    const newTheme = isDark ? "light" : "dark";

    const applyTheme = () => {
      document.documentElement.classList.toggle("dark");
      setTheme(newTheme);
    };

    if (typeof document.startViewTransition !== "function") {
      applyTheme();
      return;
    }

    const clipPath = getClipPaths(cx, cy, maxRadius);
    const duration = 400;

    const root = document.documentElement;
    root.dataset.catalanceThemeVt = "active";
    root.style.setProperty("--catalance-theme-vt-duration", `${duration}ms`);
    root.style.setProperty("--catalance-theme-vt-clip-from", clipPath[0]);

    const cleanup = () => {
      delete root.dataset.catalanceThemeVt;
      root.style.removeProperty("--catalance-theme-vt-duration");
      root.style.removeProperty("--catalance-theme-vt-clip-from");
    };

    const transition = document.startViewTransition(() => {
      flushSync(applyTheme);
    });

    if (typeof transition?.finished?.finally === "function") {
      transition.finished.finally(cleanup);
    } else {
      cleanup();
    }

    const ready = transition?.ready;
    if (ready && typeof ready.then === "function") {
      ready.then(() => {
        document.documentElement.animate(
          { clipPath },
          {
            duration,
            easing: "ease-in-out",
            fill: "forwards",
            pseudoElement: "::view-transition-new(root)",
          }
        );
      });
    }
  }, [isDark, setTheme]);

  return (
    <button
      type="button"
      ref={buttonRef}
      onClick={toggleTheme}
      aria-label="Toggle colour theme"
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-all duration-200",
        // Light
        "border border-black/[0.08] bg-primary/10 text-primary shadow-sm",
        "hover:border-primary/20 hover:bg-primary/20 hover:text-primary",
        // Dark
        "dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-primary",
        "dark:hover:border-primary/20 dark:hover:bg-primary/15 dark:hover:text-primary",
        className
      )}
    >
      {isDark ? (
        <Sun className="size-[1.05rem] stroke-[2.2] fill-primary/10" />
      ) : (
        <Moon className="size-[1.05rem] stroke-[2.2] fill-primary/10" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
