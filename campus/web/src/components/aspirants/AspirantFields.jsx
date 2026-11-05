/**
 * The editable aspirant form, shared by onboarding ("Your preparation" step) and Profile ("Aspirant mode").
 * value = form state from aspirantToForm(); onChange(patch).
 */
import { useId } from "react";
import { Eye, Lock, Sparkles } from "lucide-react";
import { Field, Input, Select } from "@/components/ui/primitives";
import { Switch } from "@/components/ui/overlays";
import { cn, formatNumber } from "@/lib/utils";
import { DAILY_MINUTES, EXAMS, STRENGTHS, estimateMockTests, estimateStudyHours, examMeta } from "./data";
import { ChipToggle } from "./parts";

function GroupLabel({ id, children, hint }) {
  return (
    <div className="mb-2.5">
      <p id={id} className="text-sm font-semibold text-fg">
        {children}
      </p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function AspirantFields({ value, onChange, errors = {}, showStats = true, className }) {
  const id = useId();
  const meta = value.exam ? examMeta(value.exam) : null;
  const set = (k) => (e) => onChange({ [k]: e.target.value });
  const toggleStrength = (s) => onChange({ strengths: value.strengths.includes(s) ? value.strengths.filter((x) => x !== s) : [...value.strengths, s] });
  const years = Number(value.prepYears) || 0;

  return (
    <div className={cn("space-y-7", className)}>
      {/* Exam */}
      <div>
        <GroupLabel id={`${id}-exam`}>Which exam are you preparing for?</GroupLabel>
        <div role="radiogroup" aria-labelledby={`${id}-exam`} className="flex flex-wrap gap-2">
          {EXAMS.map((e) => (
            <ChipToggle
              key={e.value}
              role="radio"
              active={value.exam === e.value}
              icon={e.icon}
              onClick={() => onChange({ exam: e.value, examName: e.names.includes(value.examName) || !value.examName ? e.names[0] : value.examName })}
            >
              {e.label}
              <span className="text-xs font-medium opacity-70" lang="hi">
                {e.hindi}
              </span>
            </ChipToggle>
          ))}
        </div>
        {errors.exam && <p className="mt-2 text-xs font-medium text-danger">{errors.exam}</p>}
      </div>

      {/* Exam name */}
      <Field label="Exact exam name" htmlFor={`${id}-name`} error={errors.examName} hint="Pick a suggestion or type your own, e.g. UPPSC or SSC CGL.">
        <Input id={`${id}-name`} list={`${id}-names`} value={value.examName} onChange={set("examName")} placeholder={meta?.names[0] || "e.g. SSC CGL"} autoComplete="off" />
        <datalist id={`${id}-names`}>
          {(meta ? meta.names : EXAMS.flatMap((e) => e.names)).map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
        {meta && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {meta.names.slice(0, 6).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange({ examName: n })}
                className={cn("cursor-pointer rounded-full px-2.5 py-1 text-xs font-semibold transition-colors", value.examName === n ? "bg-fg text-bg" : "bg-surface-2 text-muted hover:text-fg")}
              >
                {n}
              </button>
            ))}
          </div>
        )}
      </Field>

      {/* Prep years + attempts */}
      <div className="grid gap-5 sm:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor={`${id}-years`} className="text-sm font-semibold">
              Years of preparation
            </label>
            <span className="font-display text-2xl font-extrabold tracking-tight">
              {years}
              {years === 8 ? "+" : ""} <span className="text-sm font-semibold text-muted">yr{years === 1 ? "" : "s"}</span>
            </span>
          </div>
          <input
            id={`${id}-years`}
            type="range"
            min={0}
            max={8}
            step={1}
            value={years}
            onChange={(e) => onChange({ prepYears: Number(e.target.value) })}
            className="mt-2 w-full cursor-pointer accent-primary"
            aria-valuetext={`${years} years`}
          />
          <div className="flex justify-between text-[11px] text-subtle" aria-hidden="true">
            <span>Just started</span>
            <span>8+ years</span>
          </div>
          <p className="mt-1.5 text-xs text-muted">Every year here counts as discipline and self-study on your record.</p>
        </div>
        <Field label="Attempts used" htmlFor={`${id}-att`} hint="Private. Only for your planner.">
          <Select id={`${id}-att`} value={String(value.attemptsUsed ?? 0)} onChange={(e) => onChange({ attemptsUsed: Number(e.target.value) })}>
            {Array.from({ length: 11 }).map((_, n) => (
              <option key={n} value={n}>
                {n === 0 ? "None yet" : n === 10 ? "10+" : n}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {/* Strengths */}
      <div>
        <GroupLabel id={`${id}-str`} hint="We'll match these to private-sector skills you already half-know.">
          Your strong subjects
        </GroupLabel>
        <div role="group" aria-labelledby={`${id}-str`} className="flex flex-wrap gap-2">
          {STRENGTHS.map((s) => (
            <ChipToggle key={s} active={value.strengths.includes(s)} onClick={() => toggleStrength(s)}>
              {s}
            </ChipToggle>
          ))}
        </div>
      </div>

      {/* Daily minutes */}
      <div>
        <GroupLabel id={`${id}-min`} hint="Time for Campus alongside your prep. Change it any time.">
          How much time a day?
        </GroupLabel>
        <div role="radiogroup" aria-labelledby={`${id}-min`} className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {DAILY_MINUTES.map((m) => {
            const on = Number(value.dailyMinutes) === m.value;
            return (
              <button
                key={m.value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onChange({ dailyMinutes: m.value })}
                className={cn(
                  "relative cursor-pointer rounded-2xl border-2 bg-surface p-3.5 text-left transition-all hover:-translate-y-0.5",
                  on ? "border-primary shadow-md" : "border-line hover:border-line-strong",
                )}
              >
                {m.recommended && (
                  <span className="absolute -top-2.5 right-3 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-fg">
                    <Sparkles className="size-2.5" /> Recommended
                  </span>
                )}
                <span className="block font-display text-2xl font-extrabold tracking-tight">{m.label}</span>
                <span className="block text-xs text-muted">{m.recommended ? "Fits around prep" : m.hint}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Optional numbers */}
      {showStats && (
        <div className="rounded-3xl border border-line bg-surface-2/50 p-4 sm:p-5">
          <p className="text-sm font-semibold">Your preparation record (optional)</p>
          <p className="mt-0.5 text-xs text-muted">Leave blank and we'll estimate from your prep years. You can edit these later.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="Study hours" htmlFor={`${id}-hrs`}>
              <Input id={`${id}-hrs`} type="number" inputMode="numeric" min={0} value={value.studyHoursTotal} onChange={set("studyHoursTotal")} placeholder={`≈ ${formatNumber(estimateStudyHours(years))}`} />
            </Field>
            <Field label="Mock tests taken" htmlFor={`${id}-mocks`}>
              <Input id={`${id}-mocks`} type="number" inputMode="numeric" min={0} value={value.mockTestsTaken} onChange={set("mockTestsTaken")} placeholder={`≈ ${formatNumber(estimateMockTests(years))}`} />
            </Field>
            <Field label="Best mock percentile" htmlFor={`${id}-pct`} error={errors.bestMockPercentile}>
              <Input id={`${id}-pct`} type="number" inputMode="numeric" min={0} max={100} value={value.bestMockPercentile} onChange={set("bestMockPercentile")} placeholder="e.g. 92" />
            </Field>
          </div>
        </div>
      )}

      {/* Birth year (private) */}
      <Field
        label="Birth year (optional)"
        htmlFor={`${id}-by`}
        error={errors.birthYear}
        hint="Only for your private age-limit planner. Never shown publicly."
      >
        <Input id={`${id}-by`} type="number" inputMode="numeric" leftIcon={Lock} min={1960} max={new Date().getFullYear() - 15} value={value.birthYear} onChange={set("birthYear")} placeholder="e.g. 2000" className="sm:max-w-48" />
      </Field>

      {/* Passport switch */}
      <div className="flex items-start justify-between gap-4 rounded-2xl border border-line bg-surface p-4">
        <div className="min-w-0">
          <label htmlFor={`${id}-pass`} className="flex items-center gap-2 text-sm font-semibold">
            <Eye className="size-4 text-primary" /> Show my Preparation record on my Skill Passport
          </label>
          <p className="mt-1 text-xs text-muted">Shows your exam, prep years, study hours and strengths as strengths. Never your age or attempts.</p>
        </div>
        <Switch id={`${id}-pass`} checked={!!value.showOnPassport} onCheckedChange={(v) => onChange({ showOnPassport: v })} />
      </div>
    </div>
  );
}
