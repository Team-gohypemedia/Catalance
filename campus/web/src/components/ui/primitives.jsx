/**
 * Small building blocks: Card, Badge, Input, Textarea, Select, Label, Field, Skeleton, Spinner, Separator, Kbd.
 */
import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Card ── */
export function Card({ className, interactive = false, ...props }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-surface",
        interactive && "transition-colors duration-200 hover:border-line-strong",
        className,
      )}
      {...props}
    />
  );
}
export const CardHeader = ({ className, ...p }) => <div className={cn("flex items-start justify-between gap-4 p-5 pb-0 sm:p-6 sm:pb-0", className)} {...p} />;
export const CardTitle = ({ className, ...p }) => <h3 className={cn("font-display text-lg font-medium tracking-tight", className)} {...p} />;
export const CardDescription = ({ className, ...p }) => <p className={cn("text-sm text-muted", className)} {...p} />;
export const CardContent = ({ className, ...p }) => <div className={cn("p-5 sm:p-6", className)} {...p} />;

/* ── Badge ── */
const badgeTones = {
  neutral: "bg-surface-2 text-muted",
  primary: "bg-primary-soft text-primary",
  accent: "bg-accent-soft text-fg dark:text-accent",
  violet: "bg-violet-soft text-violet",
  sky: "bg-sky-soft text-sky",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  outline: "border border-line bg-surface text-muted",
  ink: "bg-ink text-ink-fg",
};
/** <Badge tone="neutral|primary|accent|violet|sky|success|warning|danger|outline|ink" dot /> */
export function Badge({ className, tone = "neutral", dot = false, children, ...props }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", badgeTones[tone], className)} {...props}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/* ── Form controls ── */
const fieldBase =
  "w-full rounded-lg border border-line-strong bg-surface px-3.5 text-sm text-fg placeholder:text-subtle transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-[var(--ring)] disabled:opacity-60";

export const Input = forwardRef(function Input({ className, leftIcon: Left, ...props }, ref) {
  if (Left)
    return (
      <div className="relative">
        <Left className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" />
        <input ref={ref} className={cn(fieldBase, "h-11 pl-10", className)} {...props} />
      </div>
    );
  return <input ref={ref} className={cn(fieldBase, "h-11", className)} {...props} />;
});

export const Textarea = forwardRef(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(fieldBase, "min-h-28 py-3 leading-relaxed", className)} {...props} />;
});

export const Select = forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <select ref={ref} className={cn(fieldBase, "h-11 cursor-pointer appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9", className)} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238a8699' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }} {...props}>
      {children}
    </select>
  );
});

export const Label = ({ className, ...p }) => <label className={cn("text-sm font-medium text-fg", className)} {...p} />;

/** <Field label="Email" hint="…" error="…">{control}</Field> */
export function Field({ label, hint, error, htmlFor, className, children }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {error ? <p className="text-xs font-medium text-danger">{error}</p> : hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

/* ── Feedback ── */
export const Skeleton = ({ className, ...p }) => <div className={cn("skeleton rounded-xl", className)} {...p} />;

export const Spinner = ({ className }) => <Loader2 className={cn("size-5 animate-spin text-muted", className)} />;

export const Separator = ({ className, vertical = false }) => (
  <div className={cn(vertical ? "w-px self-stretch bg-line" : "h-px w-full bg-line", className)} />
);

export const Kbd = ({ className, ...p }) => (
  <kbd className={cn("rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-muted", className)} {...p} />
);
