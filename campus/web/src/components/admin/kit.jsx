/**
 * Admin-only building blocks, in the calm Catalance admin style:
 * AdminHeader, Panel, KpiGrid/Kpi, Status/StatusBadge, Tag, SectionLabel,
 * Drawer (side sheet), ConfirmDialog, TagInput, ListEditor, Markdown, KV rows.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import ReactMarkdown from "react-markdown";
import { ArrowDown, ArrowUp, ChevronRight, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives";
import { Dialog, DialogContent } from "@/components/ui/overlays";

/* ── Page header: quiet title, one line of context, actions on the right ── */
export function AdminHeader({ title, description, actions, crumbs, className }) {
  return (
    <header className={cn("mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {crumbs?.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-2 flex min-w-0 items-center gap-1 text-sm text-muted">
            {crumbs.map((c, i) => (
              <span key={i} className="flex min-w-0 items-center gap-1">
                {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-subtle" />}
                {c.to ? (
                  <Link to={c.to} className="shrink-0 transition-colors hover:text-fg">
                    {c.label}
                  </Link>
                ) : (
                  <span className="truncate text-fg">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-2xl leading-[1.15] font-medium tracking-tight text-fg sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/* ── Panel: the one card shape used across admin ── */
export function Panel({ title, description, action, children, className, bodyClassName, footer, flush = false }) {
  return (
    <section className={cn("min-w-0 rounded-2xl border border-line bg-surface", className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-medium text-fg">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={cn(!flush && "p-5", bodyClassName)}>{children}</div>
      {footer && <div className="border-t border-line px-5 py-3">{footer}</div>}
    </section>
  );
}

/* ── KPI strip: one bordered block split by hairlines ── */
export function KpiGrid({ children, className }) {
  return <div className={cn("grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4", className)}>{children}</div>;
}
export function Kpi({ icon: Icon, label, value, hint, className }) {
  return (
    <div className={cn("min-w-0 bg-surface p-4 sm:p-5", className)}>
      <div className="flex items-center gap-2.5">
        {Icon && (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted">
            <Icon className="size-3.5" strokeWidth={1.75} />
          </span>
        )}
        <p className="truncate text-sm text-muted">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-medium tracking-tight text-fg tabular-nums sm:text-[28px]">{value}</p>
      {hint && <p className="mt-1 truncate text-xs text-subtle">{hint}</p>}
    </div>
  );
}

/* ── Subtle status: hairline pill with a small coloured dot ── */
const DOT = {
  neutral: "bg-subtle",
  primary: "bg-primary",
  accent: "bg-accent",
  violet: "bg-violet",
  sky: "bg-sky",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};
export function Status({ tone = "neutral", children, className }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2 py-0.5 text-xs font-medium whitespace-nowrap text-fg/80", className)}>
      <span className={cn("size-1.5 shrink-0 rounded-full", DOT[tone] || DOT.neutral)} aria-hidden="true" />
      {children}
    </span>
  );
}

/** Neutral chip for skills, expertise, tags. */
export function Tag({ children, className }) {
  return <span className={cn("inline-flex items-center rounded-md bg-surface-2 px-1.5 py-0.5 text-xs whitespace-nowrap text-muted", className)}>{children}</span>;
}

/** Small label above a group inside drawers and panels. */
export function SectionLabel({ children, className, action }) {
  return (
    <div className={cn("mb-2 flex items-center justify-between gap-2", className)}>
      <p className="text-xs font-medium text-muted">{children}</p>
      {action}
    </div>
  );
}

/* ── Drawer: right-side sheet. <Drawer open onOpenChange title description footer>…</Drawer> ── */
export function Drawer({ open, onOpenChange, title, description, footer, size = "md", children }) {
  const widths = { md: "sm:max-w-md", lg: "sm:max-w-xl", xl: "sm:max-w-2xl" };
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/30" />
        <DialogPrimitive.Content
          className={cn("fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-line bg-surface shadow-xl focus:outline-none", widths[size])}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <DialogPrimitive.Title className="truncate text-base font-medium text-fg">{title}</DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="mt-0.5 text-sm text-muted">{description}</DialogPrimitive.Description>
              ) : (
                <DialogPrimitive.Description className="sr-only">{typeof title === "string" ? title : "Details"}</DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close className="-mr-1.5 rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-fg" aria-label="Close">
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">{children}</div>
          {footer && <div className="border-t border-line bg-surface px-5 py-3 sm:px-6">{footer}</div>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/* ── ConfirmDialog ── */
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = "Confirm", tone = "danger", loading, onConfirm }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={title} description={description} size="sm">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── TagInput: chips + enter/comma to add. value: string[] ── */
export function TagInput({ value = [], onChange, placeholder = "Type and press Enter", id, suggestions = [] }) {
  const [draft, setDraft] = useState("");
  const add = (raw) => {
    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()));
    if (parts.length) onChange([...value, ...parts]);
    setDraft("");
  };
  const unused = suggestions.filter((s) => !value.includes(s)).slice(0, 8);
  return (
    <div>
      <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-line bg-surface px-2 py-1.5 transition-colors focus-within:border-primary focus-within:ring-4 focus-within:ring-[var(--ring)]">
        {value.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-surface-2 py-0.5 pr-0.5 pl-2 text-xs font-medium text-fg">
            {tag}
            <button type="button" aria-label={`Remove ${tag}`} onClick={() => onChange(value.filter((v) => v !== tag))} className="cursor-pointer rounded p-0.5 text-muted hover:bg-surface-3 hover:text-fg">
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          placeholder={value.length ? "" : placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
          }}
          onBlur={() => draft.trim() && add(draft)}
          className="h-7 min-w-24 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-subtle"
        />
      </div>
      {unused.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {unused.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange([...value, s])}
              className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-line px-2 py-0.5 text-xs text-muted transition-colors hover:border-line-strong hover:text-fg"
            >
              <Plus className="size-3" /> {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── ListEditor: ordered list of strings (deliverables, outcomes…) ── */
export function ListEditor({ value = [], onChange, placeholder = "Add an item", addLabel = "Add item" }) {
  const set = (i, v) => onChange(value.map((x, k) => (k === i ? v : x)));
  const move = (i, d) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {value.map((item, i) => (
        <div key={i} className="group flex items-center gap-1.5">
          <span className="w-5 shrink-0 text-right text-xs text-subtle tabular-nums">{i + 1}</span>
          <Input value={item} onChange={(e) => set(i, e.target.value)} placeholder={placeholder} className="h-10" aria-label={`Item ${i + 1}`} />
          <div className="flex shrink-0">
            <IconBtn label="Move up" disabled={i === 0} onClick={() => move(i, -1)} icon={ArrowUp} />
            <IconBtn label="Move down" disabled={i === value.length - 1} onClick={() => move(i, 1)} icon={ArrowDown} />
            <IconBtn label="Remove" onClick={() => onChange(value.filter((_, k) => k !== i))} icon={Trash2} danger />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, ""])}
        className="ml-6.5 inline-flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-fg"
      >
        <Plus className="size-3.5" /> {addLabel}
      </button>
    </div>
  );
}

export function IconBtn({ label, icon: Icon, onClick, disabled, danger, className }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-8 cursor-pointer items-center justify-center rounded-lg text-subtle transition-colors hover:bg-surface-2 hover:text-fg focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent",
        danger && "hover:bg-danger-soft hover:text-danger",
        className,
      )}
    >
      <Icon className="size-4" strokeWidth={1.75} />
    </button>
  );
}

/* ── Markdown preview ── */
export function Markdown({ children, className }) {
  if (!children?.trim()) return <p className="text-sm text-subtle italic">Nothing to preview yet.</p>;
  return (
    <div className={cn("prose-campus text-sm", className)}>
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}

/* ── Key/value row for drawers ── */
export function KV({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-2.5 text-sm last:border-0">
      <span className="shrink-0 text-muted">{label}</span>
      <span className="min-w-0 text-right break-words text-fg">{children}</span>
    </div>
  );
}

/* ── Status tones ── */
export const APP_STATUS = {
  APPLIED: { label: "Applied", tone: "sky" },
  ACCEPTED: { label: "Accepted", tone: "violet" },
  SUBMITTED: { label: "Submitted", tone: "warning" },
  APPROVED: { label: "Approved", tone: "success" },
  PAID: { label: "Paid", tone: "primary" },
  REJECTED: { label: "Rejected", tone: "danger" },
};
export const StatusBadge = ({ status, map = APP_STATUS }) => {
  const s = map[status] || { label: status, tone: "neutral" };
  return <Status tone={s.tone}>{s.label}</Status>;
};

export const LADDER_STAGES = { 1: "Learn", 2: "Practice", 3: "Micro-gig", 4: "Real project", 5: "Hired" };
export function StagePill({ stage = 1 }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs whitespace-nowrap text-fg/80">
      <span className="flex gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={cn("h-2.5 w-1 rounded-full", n <= stage ? "bg-primary" : "bg-line-strong")} />
        ))}
      </span>
      {LADDER_STAGES[stage] || `Stage ${stage}`}
    </span>
  );
}

/** Company "logo" from name + color (data-driven color is allowed). */
export function CompanyMark({ company, size = "md" }) {
  const s = size === "sm" ? "size-7 text-[10px] rounded-md" : "size-9 text-xs rounded-lg";
  return (
    <span className={cn("flex shrink-0 items-center justify-center font-medium text-white", s)} style={{ background: company?.logoColor || "#6B4EFF" }}>
      {(company?.name || "?").slice(0, 2).toUpperCase()}
    </span>
  );
}
