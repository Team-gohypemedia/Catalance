import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatINR } from "@/lib/utils";
import { usePlatformConfig } from "@/lib/platform";
import { Reveal } from "../primitives";
import { AnimatedNumber } from "./AnimatedNumber";

const inr = (n) => formatINR(Math.round(n));

const LEVELS = [
  ["BEGINNER", "Beginner"],
  ["INTERMEDIATE", "Intermediate"],
  ["ADVANCED", "Advanced"],
];
const FALLBACK = { BEGINNER: { priceINR: 2499, durationDays: 10 }, INTERMEDIATE: { priceINR: 5000, durationDays: 15 }, ADVANCED: { priceINR: 10000, durationDays: 20 } };

/**
 * Orange pricing band (spec §6.2): clear fee per level, GST shown separately, 100% advance.
 * Kept under the old export name so the landing layout is unchanged; "study now, pay later" was removed (spec §9.4).
 */
export function PayLater() {
  const { pricing, payments, assessment } = usePlatformConfig();
  const [level, setLevel] = useState("BEGINNER");
  const defaults = { ...FALLBACK, ...(pricing.levelDefaults || {}) };
  const fee = defaults[level]?.priceINR || 0;
  const gstPercent = pricing.gstPercent ?? 18;
  const gst = (fee * gstPercent) / 100;
  const advance = payments?.advancePercent ?? 100;
  const reassessments = Math.max(0, (assessment?.maxAttempts ?? 2) - 1);

  return (
    <section id="pricing-band" className="relative isolate overflow-hidden bg-primary py-20 text-primary-fg sm:py-28">
      <div className="pointer-events-none absolute -top-1/2 -right-1/4 -z-10 size-[900px] rounded-full bg-[radial-gradient(closest-side,rgb(255_255_255/0.16),transparent)]" aria-hidden="true" />
      <div className="container-campus grid items-center gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-16">
        <Reveal>
          <p className="eyebrow mb-4 !text-primary-fg/75">Pricing</p>
          <h2 className="text-3xl leading-[1.1] font-medium tracking-tight text-balance sm:text-5xl">One clear fee per course.</h2>
          <p className="mt-4 text-base text-primary-fg/80 sm:text-lg">See the price, duration and level before you enrol.</p>
          <ul className="mt-8 space-y-3 text-[15px]">
            {[
              advance >= 100 ? "Paid in full before you start" : `${advance}% paid before you start`,
              `GST (${gstPercent}%) shown separately`,
              reassessments ? `${reassessments === 1 ? "One reassessment" : `${reassessments} reassessments`} included` : "Final assessment included",
            ].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-fg/15">
                  <Check className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.08} className="text-fg">
          <div className="grid overflow-hidden rounded-3xl bg-surface shadow-[0_40px_80px_-40px_rgb(0_0_0/0.45)]">
            <div className="p-6 sm:p-8">
              <p className="text-sm font-medium" id="level-label">
                Level
              </p>
              <div role="radiogroup" aria-labelledby="level-label" className="mt-3 inline-flex flex-wrap gap-1 rounded-full border border-line bg-surface p-1">
                {LEVELS.map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={level === key}
                    onClick={() => setLevel(key)}
                    className={cn("cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors", level === key ? "bg-primary text-primary-fg" : "text-muted hover:text-fg")}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col border-t border-line bg-surface-2/50 p-6 sm:p-8" aria-live="polite">
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs text-muted">Course fee</p>
                  <p className="mt-1 text-xl font-medium tracking-tight sm:text-3xl">
                    <AnimatedNumber value={fee} format={inr} duration={0.6} />
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted">GST</p>
                  <p className="mt-1 text-xl font-medium tracking-tight sm:text-3xl">
                    <AnimatedNumber value={gst} format={inr} duration={0.6} />
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted">Duration</p>
                  <p className="mt-1 text-xl font-medium tracking-tight sm:text-3xl">
                    <AnimatedNumber value={defaults[level]?.durationDays || 0} duration={0.6} /> <span className="text-sm font-normal text-muted">days</span>
                  </p>
                </div>
              </div>
              <p className="mt-6 text-sm text-muted">
                Total <span className="font-medium text-fg tabular-nums">{inr(fee + gst)}</span>, including the final practical assessment.
              </p>

              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
                <p className="text-[11px] text-subtle">Typical fees. Each course shows its own price.</p>
                <Button to="/pricing" variant="link" rightIcon={ArrowRight} className="px-0">
                  See pricing
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
