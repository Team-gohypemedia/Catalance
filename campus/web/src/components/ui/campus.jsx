/**
 * Campus-specific shared components:
 * PageHeader, StatCard, EmptyState, ErrorState, CourseCover, DivisionBadge, SectionHeading, StarRating, PointsPill
 */
import { AlertTriangle, Star, Zap } from "lucide-react";
import { cn, DIVISIONS, formatNumber } from "@/lib/utils";
import { Button } from "./button";
import { usePlatformConfig } from "@/lib/platform";

/** Top of every app page. <PageHeader eyebrow="Learn" title="My courses" description="…" actions={<Button/>} />
 *  `title` may contain one <em className="accent">…</em>. */
export function PageHeader({ eyebrow, title, description, actions, className }) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2.5">{eyebrow}</p>}
        <h1 className="font-display text-2xl leading-[1.15] font-medium tracking-tight text-balance sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-muted sm:text-[15px]">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Section heading, Catalance style: centered by default, medium weight, optional <em className="accent">.
 *  <SectionHeading eyebrow="Our partners" title={<>Trusted by <em className="accent">leaders</em></>} description="…" align="center|left" /> */
export function SectionHeading({ eyebrow, title, description, align = "center", className, dark = false, size = "lg" }) {
  const centered = align === "center";
  return (
    <div className={cn("max-w-2xl", centered && "mx-auto text-center", className)}>
      {eyebrow && (
        <p className={cn("eyebrow mb-4 inline-flex items-center gap-3", dark && "text-ink-muted")}>
          {centered && <span className="h-px w-8 bg-line-strong" aria-hidden="true" />}
          {eyebrow}
          {centered && <span className="h-px w-8 bg-line-strong" aria-hidden="true" />}
        </p>
      )}
      <h2
        className={cn(
          "font-display leading-[1.1] font-medium tracking-tight text-balance",
          size === "sm" ? "text-2xl sm:text-3xl" : size === "md" ? "text-3xl sm:text-4xl" : "text-3xl sm:text-5xl",
          dark && "text-ink-fg",
        )}
      >
        {title}
      </h2>
      {description && <p className={cn("mt-4 text-base text-balance text-muted sm:text-lg", centered && "mx-auto", dark && "text-ink-muted")}>{description}</p>}
    </div>
  );
}

/** Tones are kept for API compatibility; icons always sit in a calm neutral circle. Pass `accent` to tint the icon with the brand colour. */
/** <StatCard icon={Flame} label="Streak" value="12 days" hint="Best: 31" tone="primary" /> */
export function StatCard({ icon: Icon, label, value, hint, tone, accent = false, className }) {
  return (
    <div className={cn("rounded-2xl border border-line bg-surface p-5 sm:p-6", className)} data-tone={tone}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">{label}</p>
        {Icon && (
          <span className={cn("flex size-9 items-center justify-center rounded-full bg-surface-2", accent ? "text-primary" : "text-muted")}>
            <Icon className="size-4" strokeWidth={1.75} />
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-2xl leading-none font-medium tracking-tight sm:text-[28px]">{value}</p>
      {hint && <p className="mt-2 text-xs text-subtle">{hint}</p>}
    </div>
  );
}

/** <EmptyState icon={BookOpen} title="No courses yet" description="…" action={<Button/>} /> */
export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-line bg-surface px-6 py-14 text-center", className)}>
      {Icon && (
        <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-surface-2 text-muted">
          <Icon className="size-5" strokeWidth={1.75} />
        </span>
      )}
      <h3 className="font-display text-base font-medium tracking-tight sm:text-lg">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-balance text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** For failed queries. <ErrorState error={error} onRetry={refetch} /> */
export function ErrorState({ error, onRetry, className }) {
  return (
    <div className={cn("flex flex-col items-center rounded-2xl border border-line bg-surface px-6 py-12 text-center", className)}>
      <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger">
        <AlertTriangle className="size-5" strokeWidth={1.75} />
      </span>
      <h3 className="font-display text-lg font-medium tracking-tight">Something went wrong</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{error?.message || "We couldn't load this. Please try again."}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-5" onClick={() => onRetry()}>
          Try again
        </Button>
      )}
    </div>
  );
}

/**
 * Generative cover art for courses / portfolio items — no images needed.
 * cover = { from: "#FF5A1F", to: "#6B4EFF", pattern: "dots|grid|waves|rings" }
 * Calm by default: a soft two-tone gradient with a gentle light falloff. Pass `subtlePattern` to show `cover.pattern` very faintly.
 */
export function CourseCover({ cover, title, icon: Icon, className, children, subtlePattern = false }) {
  const from = cover?.from || "#D9692A";
  const to = cover?.to || "#B8572A";
  const pattern = cover?.pattern;
  const patterns = {
    dots: "radial-gradient(rgba(255,255,255,.10) 1px, transparent 1px) 0 0/18px 18px",
    grid: "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px) 0 0/32px 32px, linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px) 0 0/32px 32px",
    waves: "repeating-radial-gradient(circle at 0 100%, transparent 0 22px, rgba(255,255,255,.06) 22px 23px)",
    rings: "repeating-radial-gradient(circle at 90% 10%, transparent 0 18px, rgba(255,255,255,.07) 18px 19px)",
  };
  return (
    <div
      className={cn("relative isolate overflow-hidden", className)}
      style={{ background: `linear-gradient(150deg, ${from} 0%, color-mix(in oklab, ${from} 55%, ${to}) 55%, ${to} 100%)` }}
    >
      {subtlePattern && patterns[pattern] && <div className="absolute inset-0 -z-10" style={{ background: patterns[pattern] }} />}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_15%_0%,rgba(255,255,255,.22),transparent_60%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgba(0,0,0,.18),transparent_55%)]" />
      {Icon && <Icon className="absolute top-4 right-4 size-6 text-white/75" strokeWidth={1.5} />}
      {title && <p className="absolute right-14 bottom-4 left-4 line-clamp-2 font-display text-lg leading-tight font-medium tracking-tight text-white">{title}</p>}
      {children}
    </div>
  );
}

/** <DivisionBadge division="GOLD" size="sm|md|lg" showLabel /> — hexagon medal */
/** Season division badge. Renders nothing while the gamification flag is off (spec §2), wherever it is used. */
export function DivisionBadge({ division = "BRONZE", size = "md", showLabel = true, className }) {
  const { flags } = usePlatformConfig();
  if (!flags.gamification) return null;
  const d = DIVISIONS[division] || DIVISIONS.BRONZE;
  const px = { sm: 16, md: 22, lg: 36, xl: 56 }[size] || 22;
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <svg width={px} height={px} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 1.5 21.5 7v10L12 22.5 2.5 17V7z" fill={d.color} />
        <path d="M12 5.5 18 9v6l-6 3.5L6 15V9z" fill="rgba(255,255,255,.22)" />
        <path d="m12 8.4 1.1 2.3 2.5.3-1.8 1.7.5 2.5L12 14l-2.3 1.2.5-2.5-1.8-1.7 2.5-.3z" fill="#fff" />
      </svg>
      {showLabel && <span className="text-xs font-medium text-fg">{d.label}</span>}
    </span>
  );
}

export function StarRating({ rating = 0, count, className }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm", className)}>
      <Star className="size-4 fill-warning text-warning" />
      <span className="font-medium">{Number(rating).toFixed(1)}</span>
      {count !== undefined && <span className="text-muted">({formatNumber(count)})</span>}
    </span>
  );
}

/** "+40 pts" pill used when points are awarded — quiet outline pill. */
export function PointsPill({ points, className }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-0.5 text-xs font-medium text-fg", className)}>
      <Zap className="size-3 fill-primary text-primary" />+{formatNumber(points)} pts
    </span>
  );
}
