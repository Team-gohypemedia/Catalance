import React from "react";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/shared/lib/utils";
import { toQuestionTitle } from "./utils";

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

export const StepHeader = ({ title, subtitle }) => (
    <div className="mb-8 text-center px-4">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
            {toQuestionTitle(title)}
        </h1>
        {subtitle && <p className="text-white/60 text-sm">{subtitle}</p>}
    </div>
);

export const OptionCard = ({
    selected,
    onClick,
    label,
    description,
    icon: Icon,
    compact = false,
    className = "",
}) => (
    <motion.button
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="button"
        onClick={onClick}
        className={cn(
            "group relative w-full flex items-center justify-between rounded-xl border transition-all duration-300 overflow-hidden",
            compact ? "px-4 py-3" : "px-6 py-5",
            selected
                ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/5"
                : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20",
            className
        )}
    >
        {selected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}

        <div className="flex items-center gap-5">
            {Icon && (
                <div
                    className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                        selected
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-110"
                            : "bg-white/10 text-white/60 group-hover:bg-white/20 group-hover:text-white"
                    )}
                >
                    <Icon className="w-5 h-5" />
                </div>
            )}
            <div className="text-left">
                <p
                    className={cn(
                        compact
                            ? "text-sm font-semibold transition-colors"
                            : "text-base font-semibold transition-colors",
                        selected ? "text-primary" : "text-white"
                    )}
                >
                    {label}
                </p>
                {description && (
                    <p
                        className={cn(
                            "text-white/50 mt-1 group-hover:text-white/70 transition-colors",
                            compact ? "text-xs" : "text-sm"
                        )}
                    >
                        {description}
                    </p>
                )}
            </div>
        </div>

        <div
            className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center shrink-0 ml-4 transition-all duration-300",
                selected
                    ? "bg-primary text-primary-foreground scale-110"
                    : "bg-white/10 text-transparent group-hover:bg-white/20"
            )}
        >
            <Check className="w-3.5 h-3.5" />
        </div>
    </motion.button>
);
