/**
 * JSX-built UI mockups for marketing pages (no images):
 * MockLeaderboardCard, GigToast, TutorBubble, EarnLadder, PayLaterCalculator, LanguageDemo, RankChange.
 */
import { useEffect, useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, BadgeCheck, Bot, CheckCircle2, ChevronRight, Mic, Minus, Sparkles, Wallet } from "lucide-react";
import { Avatar } from "@/components/ui/overlays";
import { DivisionBadge, PointsPill } from "@/components/ui/campus";
import { cn, formatINR, formatNumber } from "@/lib/utils";
import { LADDER_STAGES, TUTOR_DEMO } from "./data";
import { iconFor } from "./primitives";

export function RankChange({ change = 0, className }) {
  if (!change)
    return (
      <span className={cn("inline-flex items-center text-xs font-semibold text-subtle", className)}>
        <Minus className="size-3.5" />
        <span className="sr-only">No change</span>
      </span>
    );
  const up = change > 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-bold", up ? "text-success" : "text-danger", className)}>
      {up ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
      {Math.abs(change)}
      <span className="sr-only">{up ? "places up" : "places down"}</span>
    </span>
  );
}

/* ── Floating leaderboard card ── */
const BOARD = [
  { name: "Karthik Pillai", college: "CIT, Nellore", points: 7840, division: "DIAMOND", change: 2 },
  { name: "Fatima Shaikh", college: "DSD, Pune", points: 7215, division: "DIAMOND", change: 0 },
  { name: "Aman Chauhan", college: "TDGP, Bikaner", points: 6930, division: "PLATINUM", change: 5 },
  { name: "Ishita Das", college: "BEC, Guwahati", points: 6480, division: "PLATINUM", change: -1 },
];
export function MockLeaderboardCard({ className, dark = false }) {
  return (
    <div className={cn("w-full max-w-sm rounded-2xl border p-4 shadow-sm backdrop-blur", dark ? "border-ink-line bg-ink-2/90 text-ink-fg" : "border-line bg-surface/95", className)}>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className={cn("eyebrow", dark && "text-ink-muted")}>Season 7 · National</p>
          <p className="text-lg font-medium">UI/UX leaderboard</p>
        </div>
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
          <span className="relative inline-flex size-2.5 rounded-full bg-success" />
        </span>
      </div>
      <ol className="space-y-1.5">
        {BOARD.map((r, i) => (
          <li key={r.name} className={cn("flex items-center gap-3 rounded-2xl px-2.5 py-2", i === 2 ? "bg-accent text-accent-fg" : dark ? "bg-ink" : "bg-surface-2/70")}>
            <span className="w-5 text-center text-sm font-medium">{i + 1}</span>
            <Avatar name={r.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{r.name}</p>
              <p className={cn("truncate text-[11px]", i === 2 ? "text-accent-fg/70" : dark ? "text-ink-muted" : "text-muted")}>{r.college}</p>
            </div>
            <DivisionBadge division={r.division} size="sm" showLabel={false} />
            <div className="text-right">
              <p className="text-sm font-medium">{formatNumber(r.points)}</p>
              <RankChange change={r.change} className={i === 2 ? "text-accent-fg" : undefined} />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ── "Gig approved" toast mock ── */
export function GigToast({ className, amount = 500, title = "Gig approved", body = "10 product captions · Jaipur Bandhej Co." }) {
  return (
    <div className={cn("flex w-full max-w-xs items-center gap-3 rounded-2xl border border-line bg-surface p-3 pr-4 shadow-sm", className)}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success-soft text-success">
        <Wallet className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-bold">
          {title} <CheckCircle2 className="size-4 text-success" />
        </p>
        <p className="truncate text-xs text-muted">{body}</p>
      </div>
      <span className="font-display text-lg font-medium text-success">+{formatINR(amount)}</span>
    </div>
  );
}

/* ── AI tutor chat bubble ── */
export function TutorBubble({ className }) {
  return (
    <div className={cn("w-full max-w-xs space-y-2", className)}>
      <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-sm text-primary-fg shadow-md">useEffect kab chalta hai?</div>
      <div className="flex items-end gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-accent">
          <Bot className="size-4" />
        </span>
        <div className="rounded-2xl rounded-bl-md border border-line bg-surface px-3.5 py-2.5 text-sm shadow-md">
          Simple hai! Component screen pe aane ke <b>baad</b> chalta hai — jaise class mein attendance lagne ke baad lecture shuru hota hai.
          <span className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-muted">
            <Mic className="size-3" /> Hinglish · voice on
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Interactive Earn Ladder ── */
export function EarnLadder({ dark = true, className }) {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setActive((a) => (a + 1) % LADDER_STAGES.length), 3200);
    return () => clearInterval(t);
  }, [auto]);
  const pick = (i) => {
    setAuto(false);
    setActive(i);
  };
  const s = LADDER_STAGES[active];
  const Icon = iconFor(s.icon);
  const pct = (active / (LADDER_STAGES.length - 1)) * 100;

  return (
    <div className={cn("grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-10", className)}>
      <div className="relative">
        {/* vertical rail */}
        <div className={cn("absolute top-6 bottom-6 left-[34px] w-1 rounded-full", dark ? "bg-ink-line" : "bg-line")} aria-hidden="true">
          <motion.div className="w-full rounded-full bg-linear-to-b from-accent to-primary" animate={{ height: `${pct}%` }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} />
        </div>
        <ol className="relative space-y-2" role="tablist" aria-label="Earn Ladder stages">
          {LADDER_STAGES.map((st, i) => {
            const SIcon = iconFor(st.icon);
            const isActive = i === active;
            const done = i < active;
            return (
              <li key={st.key}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => pick(i)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-4 rounded-2xl p-2 pr-4 text-left transition-colors",
                    isActive ? (dark ? "bg-ink-2" : "bg-surface") : dark ? "hover:bg-ink-2/60" : "hover:bg-surface/70",
                  )}
                >
                  <span
                    className={cn(
                      "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-xl border-2 transition-colors",
                      isActive ? "border-primary bg-primary text-primary-fg" : done ? "border-accent bg-accent text-accent-fg" : dark ? "border-ink-line bg-ink text-ink-muted" : "border-line bg-surface text-muted",
                    )}
                    style={{ marginLeft: 8 }}
                  >
                    <SIcon className="size-4.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("eyebrow block", dark && "text-ink-muted")}>Stage {st.stage}</span>
                    <span className={cn("block text-lg font-medium tracking-tight sm:text-xl", dark && "text-ink-fg")}>{st.title}</span>
                    <span className={cn("block truncate text-sm", dark ? "text-ink-muted" : "text-muted")}>{st.short}</span>
                  </span>
                  <ChevronRight className={cn("hidden size-5 shrink-0 transition-transform sm:block", isActive ? "translate-x-0.5 text-primary" : dark ? "text-ink-line" : "text-subtle")} />
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="relative min-h-[300px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={s.key}
            role="tabpanel"
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={cn("relative h-full overflow-hidden rounded-2xl border p-6 sm:p-8", dark ? "border-ink-line bg-ink-2 text-ink-fg" : "border-line bg-surface")}
          >
            <div className="absolute -top-16 -right-16 size-48 rounded-full bg-primary/30 blur-3xl" aria-hidden="true" />
            <div className="relative">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-fg">
                <Icon className="size-7" />
              </span>
              <p className={cn("eyebrow mt-6", dark && "text-ink-muted")}>Stage {s.stage} of 5</p>
              <h3 className="mt-1 font-display text-3xl font-medium tracking-tight sm:text-4xl">{s.title}</h3>
              <p className={cn("mt-3 leading-relaxed", dark ? "text-ink-muted" : "text-muted")}>{s.description}</p>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-fg">{s.reward}</span>
              </div>
              <div className={cn("mt-6 rounded-2xl border border-dashed p-4 text-sm", dark ? "border-ink-line" : "border-line-strong")}>
                <span className={cn("eyebrow mb-1 block", dark && "text-ink-muted")}>Real example</span>
                {s.example}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Study now, pay later calculator ── */
export function PayLaterCalculator({ className }) {
  const id = useId();
  const [fee, setFee] = useState(4999);
  const [monthly, setMonthly] = useState(4000);
  const perMonth = Math.round(monthly * 0.2);
  const months = perMonth > 0 ? Math.ceil(fee / perMonth) : 0;
  const keep = monthly - perMonth;
  const firstYearKeep = Math.max(0, monthly * 12 - fee);

  return (
    <div className={cn("rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-7", className)}>
      <div className="space-y-6">
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor={`${id}-fee`} className="text-sm font-semibold">
              Track fee
            </label>
            <span className="text-xl font-medium">{formatINR(fee)}</span>
          </div>
          <input id={`${id}-fee`} type="range" min={1999} max={14999} step={500} value={fee} onChange={(e) => setFee(Number(e.target.value))} className="mt-3 w-full cursor-pointer accent-primary" />
        </div>
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor={`${id}-earn`} className="text-sm font-semibold">
              What you earn from gigs / month
            </label>
            <span className="text-xl font-medium">{formatINR(monthly)}</span>
          </div>
          <input id={`${id}-earn`} type="range" min={1000} max={20000} step={500} value={monthly} onChange={(e) => setMonthly(Number(e.target.value))} className="mt-3 w-full cursor-pointer accent-primary" />
        </div>
      </div>

      <div className="mt-7 rounded-2xl bg-surface-2 p-4">
        <div className="flex h-4 overflow-hidden rounded-full" aria-hidden="true">
          <motion.div className="bg-accent" animate={{ width: "80%" }} />
          <motion.div className="bg-primary" animate={{ width: "20%" }} />
        </div>
        <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm">
          <span className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-accent" /> You keep <b>{formatINR(keep)}</b>
          </span>
          <span className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-primary" /> Towards fees <b>{formatINR(perMonth)}</b>
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3" aria-live="polite">
        <div className="rounded-2xl border border-line p-4">
          <p className="text-xs font-medium text-muted">Fees cleared in</p>
          <p className="mt-1 font-display text-3xl font-medium tracking-tight">
            {months} <span className="text-base font-semibold text-muted">{months === 1 ? "month" : "months"}</span>
          </p>
        </div>
        <div className="rounded-2xl bg-ink p-4 text-ink-fg">
          <p className="text-xs font-medium text-ink-muted">You keep in year one</p>
          <p className="mt-1 font-display text-3xl font-medium tracking-tight text-accent">{formatINR(firstYearKeep)}</p>
        </div>
      </div>
      <p className="mt-4 text-xs text-muted">Illustration only. 20% of gig earnings goes to fees until they're paid — then you keep 100%. Never earn? Never pay.</p>
    </div>
  );
}

/* ── AI tutor in your language ── */
export function LanguageDemo({ className }) {
  const langs = Object.keys(TUTOR_DEMO.answers);
  const [lang, setLang] = useState("hinglish");
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-ink-line bg-ink-2 text-ink-fg shadow-sm", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-ink-line px-4 py-3 sm:px-5">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex size-7 items-center justify-center rounded-full bg-accent text-accent-fg">
            <Sparkles className="size-3.5" />
          </span>
          Campus AI Tutor
        </span>
        <span className="eyebrow text-ink-muted">Web Dev · Lesson 12</span>
      </div>
      <div className="px-4 pt-4 sm:px-5" role="tablist" aria-label="Answer language">
        <div className="scrollbar-none flex gap-1.5 overflow-x-auto">
          {langs.map((l) => (
            <button
              key={l}
              type="button"
              role="tab"
              aria-selected={lang === l}
              onClick={() => setLang(l)}
              className={cn("shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors", lang === l ? "bg-accent text-accent-fg" : "bg-ink text-ink-muted hover:text-ink-fg")}
            >
              {TUTOR_DEMO.labels[l]}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3 p-4 sm:p-5">
        <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-fg">{TUTOR_DEMO.question}</div>
        <div className="flex items-start gap-2.5">
          <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-accent">
            <Bot className="size-4" />
          </span>
          <div className="min-h-[148px] flex-1 rounded-2xl rounded-tl-md bg-ink px-4 py-3 text-[15px] leading-relaxed">
            <AnimatePresence mode="wait">
              <motion.p key={lang} lang={lang === "hinglish" ? "en" : lang} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
                {TUTOR_DEMO.answers[lang]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-ink-line px-3 py-2 text-sm text-ink-muted">
          <Mic className="size-4 text-accent" />
          <span className="flex-1 truncate">Tap to ask by voice…</span>
          <span className="flex items-end gap-0.5" aria-hidden="true">
            {[8, 14, 10, 16, 6].map((h, i) => (
              <motion.span key={i} className="w-1 rounded-full bg-accent" animate={{ height: [h * 0.4, h, h * 0.5] }} transition={{ duration: 0.9, repeat: Infinity, repeatType: "mirror", delay: i * 0.1 }} />
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Passport-style proof card (for companies page) ── */
export function ProofCard({ className }) {
  return (
    <div className={cn("w-full max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-sm", className)}>
      <div className="flex items-center gap-3">
        <Avatar name="Aman Chauhan" size="lg" />
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-lg font-medium">
            Aman Chauhan <BadgeCheck className="size-4.5 text-sky" />
          </p>
          <p className="truncate text-sm text-muted">Diploma CS · TDGP, Bikaner</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          ["#4", "UI/UX rank"],
          ["14", "Verified gigs"],
          [formatINR(23800), "Earned"],
        ].map(([v, l]) => (
          <div key={l} className="rounded-2xl bg-surface-2 px-2 py-2.5">
            <p className="text-base font-medium">{v}</p>
            <p className="text-[11px] text-muted">{l}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {["Figma", "Design systems", "Prototyping", "User research"].map((s) => (
          <span key={s} className="rounded-full border border-line px-2.5 py-0.5 text-xs font-medium">
            {s}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <DivisionBadge division="GOLD" />
        <PointsPill points={3120} />
      </div>
      <div className="mt-4 flex h-9 w-full items-center justify-center rounded-lg bg-fg text-sm font-semibold text-bg" aria-hidden="true">
        Invite to interview
      </div>
    </div>
  );
}
