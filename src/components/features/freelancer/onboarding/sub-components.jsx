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
            "group relative w-full h-full flex items-center justify-center rounded-xl border transition-all duration-300 overflow-hidden",
            compact ? "px-4 py-3" : "px-6 py-5",
            selected
                ? "border-primary bg-transparent shadow-lg shadow-primary/5"
                : "border-white/10 bg-transparent hover:bg-white/5 hover:border-white/20",
            className
        )}
    >
        <div className="relative w-full flex items-center justify-center">
            {Icon && (
                <div
                    className={cn(
                        "absolute left-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 border",
                        selected
                            ? "bg-transparent border-primary text-primary shadow-md shadow-primary/20 scale-110"
                            : "bg-transparent border-white/10 text-white/60 group-hover:border-white/20 group-hover:text-white"
                    )}
                >
                    <Icon className="w-5 h-5" />
                </div>
            )}
            <div className="text-center w-full px-12">
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
    </motion.button>
);
