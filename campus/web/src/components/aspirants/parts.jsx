/**
 * Aspirant mode building blocks: TimeRing, ChipToggle, BridgeTrackCard, PreparationRecordCard.
 */
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, BadgeCheck, BookOpenCheck, Check, Clock, Flame, NotebookPen, Target } from "lucide-react";
import { cn, formatCompact, formatNumber } from "@/lib/utils";
import { bridgeIcon } from "./data";

/** Circular minutes ring. tone: primary | accent. dark = on ink panels. */
export function TimeRing({ value = 0, max = 45, size = 140, stroke = 12, label, sublabel, dark = false, tone = "primary", className }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, max ? value / max : 0));
  return (
    <div className={cn("relative inline-flex shrink-0 items-center justify-center", className)} style={{ width: size, height: size }} role="img" aria-label={`${value} of ${max} minutes`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className={dark ? "stroke-ink-line" : "stroke-surface-2"} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={tone === "accent" ? "stroke-accent" : "stroke-primary"}
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c * (1 - pct) }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl leading-none font-medium tracking-tight tabular-nums">{label ?? value}</span>
        {sublabel && <span className={cn("mt-1 text-[11px] font-medium", dark ? "text-ink-muted" : "text-muted")}>{sublabel}</span>}
      </div>
    </div>
  );
}

/** Toggle chip used for multi-select and single-select chip groups. */
export function ChipToggle({ active, onClick, children, role = "checkbox", className, icon: Icon }) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-all",
        active ? "border-primary bg-primary-soft text-primary" : "border-line bg-surface text-fg hover:border-line-strong hover:bg-surface-2",
        className,
      )}
    >
      {active ? <Check className="size-3.5" strokeWidth={3} /> : Icon ? <Icon className="size-3.5 text-muted" /> : null}
      {children}
    </button>
  );
}


/** Bridge track card with "Built on your prep" and the exam subjects it builds on. */
export function BridgeTrackCard({ track, className, compact = false, to }) {
  const Icon = bridgeIcon(track);
  const career = track.careers?.[0];
  return (
    <Link
      to={to || `/tracks/${track.slug}`}
      className={cn("group flex h-full flex-col rounded-2xl border border-line bg-surface p-6 transition-colors duration-200 hover:border-line-strong sm:p-7", className)}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-11 items-center justify-center rounded-full bg-surface-2 text-primary">
          <Icon className="size-5" strokeWidth={1.75} />
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-0.5 text-[11px] font-medium text-muted">
          <BadgeCheck className="size-3 text-primary" /> Built on your prep
        </span>
      </div>
      <h3 className="mt-6 text-lg font-medium tracking-tight">{track.title}</h3>
      {!compact && <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{track.tagline}</p>}
      {track.bridgeFrom?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {track.bridgeFrom.slice(0, 3).map((s) => (
            <span key={s} className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-medium text-muted">
              {s}
            </span>
          ))}
        </div>
      )}
      <div className="mt-auto flex items-center justify-between gap-2 pt-6 text-xs text-subtle">
        <span>
          {[track.durationWeeks ? `${track.durationWeeks} weeks` : null, track.studentsCount ? `${formatCompact(track.studentsCount)} learners` : null, !compact && career ? career.title : null]
            .filter(Boolean)
            .join(" · ")}
        </span>
        <ArrowUpRight className="size-4 shrink-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
      </div>
    </Link>
  );
}

/**
 * The "Preparation record" passport block. record = { examName, prepYears, studyHoursTotal, mockTestsTaken,
 * bestMockPercentile, strengths, traits, bridgeCourses }. Never receives age or attempts.
 */
export function PreparationRecordCard({ record, name, className }) {
  if (!record) return null;
  const years = Number(record.prepYears) || 0;
  const stats = [
    { icon: Flame, label: "Prep years", value: years ? `${years} yr${years === 1 ? "" : "s"}` : "<1 yr" },
    { icon: Clock, label: "Study hours", value: record.studyHoursTotal ? formatNumber(record.studyHoursTotal) : "—" },
    { icon: NotebookPen, label: "Mock tests", value: record.mockTestsTaken ? formatNumber(record.mockTestsTaken) : "—" },
    { icon: Target, label: "Best mock", value: record.bestMockPercentile !== null && record.bestMockPercentile !== undefined ? `${record.bestMockPercentile}%ile` : "—" },
  ];
  return (
    <div className={cn("rounded-2xl border border-line bg-surface p-5 sm:p-7", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">Preparation record</p>
          <h3 className="mt-2 text-2xl leading-tight font-medium tracking-tight">{record.examName || "Government exam"}</h3>
          <p className="mt-1 text-sm text-muted">
            {years ? `${years} year${years === 1 ? "" : "s"} of disciplined self-study` : "Disciplined self-study"} for {record.examName || "a government exam"}
            {name ? ` by ${name}` : ""}.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs font-medium text-muted">
          <BookOpenCheck className="size-3.5 text-primary" /> Self-reported
        </span>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-surface-2 p-3.5">
            <dt className="flex items-center gap-1.5 text-xs text-muted">
              <s.icon className="size-3.5" /> {s.label}
            </dt>
            <dd className="mt-1 text-xl font-medium tracking-tight tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>

      {record.traits?.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {record.traits.map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
              <BadgeCheck className="size-3.5" /> {t}
            </span>
          ))}
        </div>
      )}
      {record.strengths?.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-muted">Strong subjects</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {record.strengths.map((s) => (
              <span key={s} className="rounded-full border border-line px-2.5 py-0.5 text-xs font-medium">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
      {record.bridgeCourses ? (
        <p className="mt-5 border-t border-line pt-4 text-sm text-muted">
          Now building private-sector skills on Campus · <span className="font-medium text-fg">{record.bridgeCourses} bridge course{record.bridgeCourses === 1 ? "" : "s"}</span>
        </p>
      ) : null}
    </div>
  );
}
