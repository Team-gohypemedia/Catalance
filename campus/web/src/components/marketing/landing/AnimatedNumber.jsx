import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const defaultFormat = (n) => Math.round(n).toLocaleString("en-IN");

/**
 * Number that counts up from 0 the first time it scrolls into view, then animates
 * smoothly between later values. Writes straight to the DOM, so it never re-renders React.
 */
export function AnimatedNumber({ value, format = defaultFormat, duration = 1.2, className }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const current = useRef(0);
  const fmt = useRef(format);
  fmt.current = format;

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;
    const target = Number(value) || 0;
    if (reduce) {
      current.current = target;
      el.textContent = fmt.current(target);
      return;
    }
    const controls = animate(current.current, target, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        current.current = v;
        el.textContent = fmt.current(v);
      },
    });
    return () => controls.stop();
  }, [value, inView, reduce, duration]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {fmt.current(0)}
    </span>
  );
}
