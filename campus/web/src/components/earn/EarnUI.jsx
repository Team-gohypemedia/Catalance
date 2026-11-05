/** Reusable pieces for Earn & Rank screens (gigs, applications, portfolio, badges, countdown). Catalance style: calm, neutral, one accent. */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { ArrowUpRight, BadgeCheck, CalendarClock, Check, Clock, Lock, Pencil, Trash2, Users, X } from "lucide-react";
import { cn, formatDate, formatINR, initials, timeAgo } from "@/lib/utils";
import { Tooltip } from "@/components/ui/overlays";
import { APP_FLOW, APP_STATUS, DIFFICULTY, badgeIcon, trackMeta } from "./meta";

export function Markdown({ children, className }) {
  return (
    <div className={cn("prose-campus text-[15px]", className)}>
      <ReactMarkdown>{children || ""}</ReactMarkdown>
    </div>
  );
}

/** Company monogram in a neutral circle. */
export function CompanyMonogram({ company, size = "md", className }) {
  const s = { sm: "size-9 text-xs", md: "size-11 text-sm", lg: "size-14 text-base" }[size];
  const name = (company?.name || "?").split(",")[0];
  return (
    <span aria-hidden="true" className={cn("flex shrink-0 items-center justify-center rounded-full border border-line bg-surface-2 font-medium text-fg", s, className)}>
      {initials(name)}
    </span>
  );
}

/** Quiet outlined tag. */
export function Tag({ children, className, icon: Icon }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-0.5 text-xs whitespace-nowrap text-muted", className)}>
      {Icon && <Icon className="size-3" strokeWidth={1.75} />}
      {children}
    </span>
  );
}

const STATUS_DOT = {
  sky: "bg-sky",
  violet: "bg-violet",
  warning: "bg-warning",
  success: "bg-success",
  accent: "bg-primary",
  danger: "bg-danger",
  neutral: "bg-subtle",
};

/** Status as a calm pill: neutral surface, coloured dot. */
export function StatusBadge({ status, className }) {
  const s = APP_STATUS[status] || { label: status, tone: "neutral" };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-fg", className)}>
      <span className={cn("size-1.5 rounded-full", STATUS_DOT[s.tone] || STATUS_DOT.neutral)} />
      {s.label}
    </span>
  );
}

export function daysLeft(deadline) {
  const d = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (d < 0) return "Closed";
  if (d === 0) return "Due today";
  return `${d} days left`;
}

/** Gig row for the board (job-board style). */
export function GigCard({ gig, userStage = 1, index = 0 }) {
  const t = trackMeta(gig.category);
  const locked = userStage < gig.minStage;
  const spotsLeft = gig.spotsLeft ?? gig.spots;
  const diff = DIFFICULTY[gig.difficulty] || DIFFICULTY.EASY;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 8) * 0.03, duration: 0.35 }}>
      <Link
        to={`/app/gigs/${gig.id}`}
        className="group flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-line-strong sm:flex-row sm:items-center sm:gap-5 sm:p-6"
      >
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <CompanyMonogram company={gig.company} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-muted">{gig.company?.name}</p>
            <h3 className="mt-0.5 text-base leading-snug font-medium text-fg group-hover:text-primary sm:text-[17px]">{gig.title}</h3>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Tag icon={t.icon}>{t.short}</Tag>
              <Tag>{diff.label}</Tag>
              <Tag>{gig.minStage >= 4 ? "Real project" : "Micro-gig"}</Tag>
              {(gig.skills || []).slice(0, 2).map((s) => (
                <Tag key={s} className="hidden md:inline-flex">{s}</Tag>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between gap-4 border-t border-line pt-4 sm:w-56 sm:shrink-0 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
          <div className="sm:text-right">
            <p className="text-lg font-medium tracking-tight text-fg tabular-nums">{formatINR(gig.payoutINR)}</p>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted sm:justify-end">
              <span className="inline-flex items-center gap-1"><Clock className="size-3" strokeWidth={1.75} /> {gig.durationDays}d</span>
              <span className={cn("inline-flex items-center gap-1", spotsLeft <= 1 && "text-primary")}>
                <Users className="size-3" strokeWidth={1.75} /> {spotsLeft} {spotsLeft === 1 ? "spot" : "spots"}
              </span>
              <span className="inline-flex items-center gap-1"><CalendarClock className="size-3" strokeWidth={1.75} /> {daysLeft(gig.deadline)}</span>
            </p>
          </div>
          {gig.myApplication ? (
            <StatusBadge status={gig.myApplication.status} />
          ) : locked ? (
            <span className="inline-flex items-center gap-1 text-xs text-subtle"><Lock className="size-3" /> Stage {gig.minStage}</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">You can apply <ArrowUpRight className="size-3.5" /></span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

/** Calm status tracker for a gig application. Horizontal by default, vertical with `vertical`. */
export function ApplicationTimeline({ application, compact = false, vertical = false }) {
  const status = application?.status;
  const rejected = status === "REJECTED";
  const idx = rejected ? 1 : APP_FLOW.indexOf(status);
  const steps = rejected ? ["APPLIED", "REJECTED"] : APP_FLOW;

  const dot = (s, i) => {
    const done = i < idx || (i === idx && (s === "PAID" || rejected));
    const current = i === idx;
    return (
      <span
        className={cn(
          "relative z-10 flex shrink-0 items-center justify-center rounded-full transition-colors",
          compact ? "size-2.5" : "size-5",
          s === "REJECTED"
            ? "bg-danger text-white"
            : done
              ? "bg-primary text-primary-fg"
              : current
                ? "border-2 border-primary bg-surface"
                : "border border-line-strong bg-surface",
        )}
      >
        {!compact && (s === "REJECTED" ? <X className="size-3" strokeWidth={2.5} /> : done ? <Check className="size-3" strokeWidth={2.5} /> : current ? <span className="size-1.5 rounded-full bg-primary" /> : null)}
      </span>
    );
  };

  if (vertical) {
    return (
      <ol className="space-y-0">
        {steps.map((s, i) => {
          const reached = i <= idx;
          return (
            <li key={s} className="relative flex gap-3 pb-5 last:pb-0">
              {i < steps.length - 1 && <span className={cn("absolute top-5 bottom-0 left-[9.5px] w-px", i < idx ? "bg-primary" : "bg-line")} />}
              {dot(s, i)}
              <div className="-mt-0.5 min-w-0">
                <p className={cn("text-sm", reached ? "font-medium text-fg" : "text-subtle")}>{APP_STATUS[s].label}</p>
                {i === idx && <p className="mt-0.5 text-xs text-muted">{APP_STATUS[s].hint}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol className="flex w-full items-start" aria-label={`Application status: ${APP_STATUS[status]?.label || status}`}>
      {steps.map((s, i) => (
        <li key={s} className="relative flex flex-1 flex-col items-center text-center">
          {i > 0 && <span className={cn("absolute right-1/2 h-px w-full", compact ? "top-1.25" : "top-2.5", i <= idx ? (s === "REJECTED" ? "bg-danger" : "bg-primary") : "bg-line")} />}
          {dot(s, i)}
          {!compact && <span className={cn("mt-2 text-[11px] sm:text-xs", i === idx ? "font-medium text-fg" : i < idx ? "text-muted" : "text-subtle")}>{APP_STATUS[s].label}</span>}
        </li>
      ))}
    </ol>
  );
}

/** Live countdown to a date. */
export function useCountdown(target) {
  const [nowTs, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, new Date(target || 0).getTime() - nowTs);
  return {
    done: diff === 0,
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

/** Quiet inline countdown: 12d 04h 31m 09s */
export function Countdown({ to, className }) {
  const c = useCountdown(to);
  const parts = [
    ["d", c.days],
    ["h", c.hours],
    ["m", c.minutes],
    ["s", c.seconds],
  ];
  return (
    <div className={cn("flex items-baseline gap-2.5 tabular-nums", className)} role="timer" aria-label={`${c.days} days ${c.hours} hours left`}>
      {parts.map(([label, v]) => (
        <span key={label} className="inline-flex items-baseline gap-0.5">
          <span className="text-xl font-medium tracking-tight text-fg">{String(v).padStart(2, "0")}</span>
          <span className="text-xs text-muted">{label}</span>
        </span>
      ))}
    </div>
  );
}

export function VerifiedSeal({ source, className }) {
  const label = source === "GIG" ? "Verified client gig" : "Mentor-reviewed assignment";
  return (
    <Tooltip content={label}>
      <span className={cn("inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2 py-0.5 text-[11px] font-medium text-fg", className)}>
        <BadgeCheck className="size-3.5 text-primary" strokeWidth={2} /> Verified
      </span>
    </Tooltip>
  );
}

export const SOURCE_LABEL = { GIG: "Client gig", ASSIGNMENT: "Assignment", PERSONAL: "Personal project" };

/** Portfolio tile. Pass onEdit / onDelete for the owner's manager view. */
export function PortfolioCard({ item, onEdit, onDelete, index = 0 }) {
  const t = item.category ? trackMeta(item.category) : null;
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index, 6) * 0.04, duration: 0.4 }}
      className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-line-strong sm:p-6"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted">{SOURCE_LABEL[item.source] || item.source}</span>
        {item.verified ? <VerifiedSeal source={item.source} /> : <span className="text-[11px] text-subtle">Self-reported</span>}
      </div>
      <h3 className="mt-3 text-base leading-snug font-medium text-fg">{item.title}</h3>
      {item.description && <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted">{item.description}</p>}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {t && <Tag icon={t.icon}>{t.short}</Tag>}
        {(item.skills || []).slice(0, 4).map((s) => (
          <Tag key={s}>{s}</Tag>
        ))}
      </div>
      <div className="mt-auto pt-5">
      <div className="flex items-center justify-between gap-2 border-t border-line pt-4">
        <span className="text-xs text-subtle">{timeAgo(item.createdAt)}</span>
        <div className="flex items-center gap-1">
          {item.link && (
            <a href={item.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary-soft">
              View work <ArrowUpRight className="size-3.5" />
            </a>
          )}
          {onEdit && item.source === "PERSONAL" && (
            <button onClick={() => onEdit(item)} className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-fg" aria-label={`Edit ${item.title}`}>
              <Pencil className="size-3.5" />
            </button>
          )}
          {onDelete && item.source === "PERSONAL" && (
            <button onClick={() => onDelete(item)} className="rounded-md p-1.5 text-muted hover:bg-danger-soft hover:text-danger" aria-label={`Delete ${item.title}`}>
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      </div>
      </div>
    </motion.article>
  );
}

export function BadgeTile({ badge }) {
  const Icon = badgeIcon(badge.icon);
  return (
    <Tooltip content={`${badge.description} · ${formatDate(badge.earnedAt)}`}>
      <div className="flex min-w-0 items-center gap-3 rounded-xl border border-line bg-surface p-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Icon className="size-4" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-fg">{badge.title}</p>
          <p className="truncate text-xs text-muted">{badge.description}</p>
        </div>
      </div>
    </Tooltip>
  );
}

/** Small stat block used across earn pages: label above, medium value. */
export function Stat({ label, value, hint, className }) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 truncate text-xl font-medium tracking-tight text-fg tabular-nums sm:text-2xl">{value}</p>
      {hint && <p className="mt-0.5 truncate text-xs text-subtle">{hint}</p>}
    </div>
  );
}

/** Section card wrapper with optional title row. */
export function Panel({ title, description, action, className, bodyClassName, children }) {
  return (
    <section className={cn("rounded-2xl border border-line bg-surface", className)}>
      {(title || action) && (
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
          <div className="min-w-0">
            {title && <h2 className="text-base font-medium text-fg">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn("p-5 sm:p-6", bodyClassName)}>{children}</div>
    </section>
  );
}
