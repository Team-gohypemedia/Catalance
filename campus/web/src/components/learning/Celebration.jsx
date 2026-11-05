import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Zap } from "lucide-react";
import { formatNumber } from "@/lib/utils";

/**
 * Small, elegant completion moment: a card that rises from the bottom with a check,
 * a short burst of a few dots, and the points earned. Render with `show`; dismiss via onDone.
 */
export function Celebration({ show, points = 0, title = "Lesson complete", subtitle, onDone }) {
  const dots = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const angle = (i / 10) * Math.PI * 2;
        return { id: i, x: Math.cos(angle) * 26, y: Math.sin(angle) * 26, accent: i % 2 === 0 };
      }),
    [],
  );
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="pointer-events-none fixed inset-x-0 bottom-24 z-60 flex justify-center px-4 lg:bottom-10"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          onAnimationComplete={() => {
            if (onDone) setTimeout(onDone, 1600);
          }}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface py-3 pr-5 pl-3 shadow-lg">
            <span className="relative flex size-10 shrink-0 items-center justify-center">
              {dots.map((d) => (
                <motion.span
                  key={d.id}
                  className={d.accent ? "absolute size-1 rounded-full bg-primary" : "absolute size-1 rounded-full bg-accent"}
                  initial={{ x: 0, y: 0, opacity: 0 }}
                  animate={{ x: d.x, y: d.y, opacity: [0, 1, 0] }}
                  transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
                />
              ))}
              <motion.span
                className="flex size-10 items-center justify-center rounded-full bg-success-soft text-success"
                initial={{ scale: 0.6 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <Check className="size-5" strokeWidth={2.2} />
              </motion.span>
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-fg">{title}</p>
              {subtitle && <p className="mt-0.5 max-w-[16rem] truncate text-xs text-muted">{subtitle}</p>}
            </div>
            {points > 0 && (
              <span className="ml-1 inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary">
                <Zap className="size-3" aria-hidden="true" />+{formatNumber(points)} pts
              </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
