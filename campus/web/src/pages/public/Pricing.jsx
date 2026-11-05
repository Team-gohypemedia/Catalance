import { ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { cn, formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Faq, InkCta, PageHero, Reveal } from "@/components/marketing/primitives";
import { NoGuarantee } from "@/components/marketing/NoGuarantee";
import { usePlatformConfig } from "@/lib/platform";

/**
 * Pricing (spec §6.2): one fee per course, set by level. GST shown separately, 100% advance by default,
 * one reassessment included. Defaults come from admin settings (pricing.levelDefaults, pricing.gstPercent).
 */

const LEVELS = [
  { key: "BEGINNER", name: "Beginner", blurb: "Start a new skill from the basics.", features: ["Practical lessons and tasks", "Final practical assessment", "Course certificate on completion"] },
  { key: "INTERMEDIATE", name: "Intermediate", blurb: "Build on what you know with deeper work.", features: ["Longer real-world tasks", "Final practical assessment", "Skill verification when you pass"], featured: true },
  { key: "ADVANCED", name: "Advanced", blurb: "Client-grade work, reviewed in detail.", features: ["Complex briefs", "Detailed rubric feedback", "Skill verification when you pass"] },
];
const FALLBACK = { BEGINNER: { priceINR: 2499, durationDays: 10 }, INTERMEDIATE: { priceINR: 5000, durationDays: 15 }, ADVANCED: { priceINR: 10000, durationDays: 20 } };

function LevelCard({ level, fee, days, gstPercent, featured, delay }) {
  const gst = Math.round((fee * gstPercent) / 100);
  return (
    <Reveal delay={delay} className={cn("flex flex-col rounded-2xl border bg-surface p-6 sm:p-8", featured ? "border-primary shadow-sm" : "border-line")}>
      <p className="text-lg font-medium tracking-tight">{level.name}</p>
      <p className="mt-1.5 min-h-10 text-sm text-muted">{level.blurb}</p>
      <div className="mt-6 flex items-baseline gap-1.5">
        <span className="text-5xl font-medium tracking-tight tabular-nums">{formatINR(fee)}</span>
        <span className="text-sm text-muted">+ GST</span>
      </div>
      <p className="mt-1 text-sm text-muted">
        {days} days · total {formatINR(fee + gst)} with {gstPercent}% GST
      </p>
      <ul className="mt-8 space-y-3 border-t border-line pt-6 text-sm">
        {level.features.map((f) => (
          <li key={f} className="flex gap-3">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={2.25} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

export default function Pricing() {
  const { pricing, payments, assessment } = usePlatformConfig();
  const defaults = { ...FALLBACK, ...(pricing.levelDefaults || {}) };
  const gstPercent = pricing.gstPercent ?? 18;
  const advance = payments?.advancePercent ?? 100;
  const reassessments = Math.max(0, (assessment.maxAttempts ?? 2) - 1);
  const windowDays = assessment.reassessWindowDays ?? 14;

  const faqs = [
    { q: "When do I pay?", a: advance >= 100 ? "The full fee is paid before the course starts. You get a receipt by email and in Payments." : `${advance}% of the fee is paid before the course starts. The rest is shown at checkout.` },
    { q: "Is GST included?", a: `No. Fees are shown without GST. ${gstPercent}% GST is added at checkout and shown on your receipt.` },
    {
      q: "What if I don't pass the assessment?",
      a: reassessments
        ? `Your fee includes ${reassessments === 1 ? "one reassessment" : `${reassessments} reassessments`} within ${windowDays} days. You get written feedback first.`
        : "You get written feedback on every attempt.",
    },
    { q: "Can I get a refund?", a: "Refunds follow the Refund and Cancellation Policy. Read it before you pay." },
    { q: "Does paying verify my skill?", a: "No. Only passing the final assessment and completing your profile verifies a skill." },
  ];

  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title={
          <>
            One clear fee <em className="accent">per course</em>
          </>
        }
        description="Every course shows its price, duration and level before you enrol."
        actions={
          <Button to="/tracks" size="xl" rightIcon={ArrowRight}>
            Explore Courses
          </Button>
        }
      />

      <section className="container-campus pb-16 sm:pb-24">
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
          {LEVELS.map((l, i) => (
            <LevelCard key={l.key} level={l} fee={defaults[l.key]?.priceINR || 0} days={defaults[l.key]?.durationDays || 0} gstPercent={gstPercent} featured={l.featured} delay={i * 0.05} />
          ))}
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-muted">Typical fees by level. Each course shows its own price. Some short courses use a single Standard level.</p>

        <Reveal className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-3">
          {[
            ["Paid in advance", advance >= 100 ? "The full fee is paid before you start." : `${advance}% is paid before you start.`],
            ["GST shown separately", `${gstPercent}% GST is added at checkout and shown on your receipt.`],
            [reassessments ? "Reassessment included" : "Feedback included", reassessments ? `${reassessments === 1 ? "One reassessment" : `${reassessments} reassessments`} within ${windowDays} days if you don't pass.` : "Written feedback on every attempt."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-line bg-surface p-6">
              <p className="font-medium">{t}</p>
              <p className="mt-1.5 text-sm text-muted">{d}</p>
            </div>
          ))}
        </Reveal>
        <NoGuarantee className="mx-auto mt-8 max-w-xl text-center" />
      </section>

      <section className="border-t border-line py-20 sm:py-28">
        <div className="container-campus">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Questions</p>
            <h2 className="mt-3 text-3xl leading-[1.1] font-medium tracking-tight text-balance sm:text-5xl">About fees</h2>
          </Reveal>
          <Reveal className="mx-auto mt-12 max-w-3xl">
            <Faq items={faqs} />
            <p className="mt-6 text-center text-sm text-muted">
              Read the{" "}
              <Link to="/legal/refund" className="text-primary hover:underline">
                refund and cancellation policy
              </Link>
              .
            </p>
          </Reveal>
        </div>
      </section>

      <InkCta title="Pick your first skill." description="See the level, fee and duration before you enrol." primary={{ to: "/tracks", label: "Explore Courses" }} secondary={{ to: "/how-it-works", label: "How It Works" }} />
    </>
  );
}
