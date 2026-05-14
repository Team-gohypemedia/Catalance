"use client";

import { useState } from "react";
import { useTheme } from "@/components/providers/theme-provider";
import Sun from "lucide-react/dist/esm/icons/sun";
import Monitor from "lucide-react/dist/esm/icons/monitor";
import Moon from "lucide-react/dist/esm/icons/moon";
import { cn } from "@/shared/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const THEME_OPTIONS = [
  {
    value: "light",
    label: "Light",
    description: "Always light",
    Icon: Sun,
  },
  {
    value: "system",
    label: "System",
    description: "Follows your OS",
    Icon: Monitor,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Always dark",
    Icon: Moon,
  },
];

const iconMap = {
  light: Sun,
  system: Monitor,
  dark: Moon,
};

/**
 * ThemeToggle ΓÇö single icon trigger ΓåÆ popover with Light / System / Dark options.
 * Matches the WorkspaceProfileDropdown visual style (dark glass, rounded-[1rem]).
 */
export default function ThemeToggle({ className }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const ActiveIcon = iconMap[theme] ?? Moon;

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Toggle colour theme"
          aria-haspopup="dialog"
          aria-expanded={open}
          className={cn(
            "inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-all duration-200",
            // Light Mode Appearance
            "border border-black/[0.08] bg-white/10 text-foreground/70 shadow-sm",
            "hover:border-black/[0.14] hover:bg-black/[0.04] hover:text-foreground",
            // Dark Mode Appearance
            "dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white/70",
            "dark:hover:border-white/[0.14] dark:hover:bg-white/[0.10] dark:hover:text-white",
            // Open/Active state
            open && "ring-2 ring-primary/20 border-primary/40 text-primary dark:text-white",
            className,
          )}
        >
          <ActiveIcon className="size-[1.05rem] stroke-[1.7]" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={14}
        className={cn(
          "w-[15rem] overflow-hidden rounded-[1.2rem] border p-1.5 backdrop-blur-xl shadow-2xl",
          // Light Mode
          "border-black/[0.06] bg-white/90 text-[#1C1B1F]",
          // Dark Mode
          "dark:border-white/[0.08] dark:bg-[#0A0A0A]/95 dark:text-white"
        )}
      >
        <div className="flex flex-col gap-0.5">
          {THEME_OPTIONS.map((option) => {
            const isSelected = theme === option.value;
            const { Icon } = option;

            return (
              <button
                key={option.value}
                onClick={() => {
                  setTheme(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[0.8rem] px-3.5 py-2.5 text-left transition-all duration-200",
                  // Selected State ΓÇö Solid fill for visibility
                  isSelected
                    ? "bg-primary text-[#1C1B1F] shadow-md"
                    : "text-foreground/60 hover:bg-black/[0.04] hover:text-foreground dark:text-white/60 dark:hover:bg-white/[0.04] dark:hover:text-white"
                )}
              >
                <div className={cn(
                  "flex size-8 items-center justify-center rounded-full transition-colors",
                  isSelected 
                    ? "bg-white/20 text-[#1C1B1F]" 
                    : "bg-black/[0.05] dark:bg-white/[0.05]"
                )}>
                  <Icon className="size-4 stroke-[2.5]" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className={cn(
                    "text-[0.88rem] font-bold",
                    isSelected ? "text-[#1C1B1F]" : "text-foreground dark:text-white"
                  )}>
                    {option.label}
                  </span>
                  <span className={cn(
                    "text-[0.72rem] font-medium",
                    isSelected ? "text-[#1C1B1F]/70" : "opacity-60"
                  )}>
                    {option.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
