import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Award, BadgeCheck, FileCheck2, GraduationCap, IdCard, Info, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/primitives";
import { Avatar } from "@/components/ui/overlays";
import { useAuth } from "@/context/AuthContext";
import { cn, formatINR } from "@/lib/utils";
import { Faq, InkCta, Pill, Reveal, SectionTitle, staggerChild, staggerParent } from "@/components/marketing/primitives";
import { BRIDGE_TRACKS, MAPPER_EXAMS, PREP_MAP, SWITCH_PLAN } from "@/components/aspirants/data";
import { BridgeTrackCard, PreparationRecordCard, TimeRing } from "@/components/aspirants/parts";
import { useBridgeTracks } from "@/components/aspirants/hooks";

const SIGNUP = "/signup?goal=aspirant";

/* ───────────────────────── 1. Hero ───────────────────────── */

function Hero({ primaryCta }) {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(ellipse_45%_55%_at_50%_10%,var(--primary-soft),transparent)] opacity-80"
        aria-hidden="true"
      />
      <div className="container-campus relative flex flex-col items-center pt-16 pb-20 text-center sm:pt-24 sm:pb-28">
        <Reveal>
          <Pill className="text-muted">
            <span className="sm:hidden">For government-exam aspirants</span>
            <span className="hidden sm:inline">For SSC, Banking, Railways, UPSC and State PSC aspirants</span>
          </Pill>
        </Reveal>
        <Reveal delay={0.05}>
          <p lang="hi" className="mt-8 text-lg text-muted sm:text-xl">
            तैयारी भी, करियर भी।
          </p>
          <h1 className="mt-3 max-w-4xl text-[2.6rem] leading-[1.08] font-medium tracking-tight text-balance sm:text-6xl lg:text-7xl">
            Taiyari bhi,
            <br />
            <em className="accent text-[1.08em]">career bhi.</em>
          </h1>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted sm:text-lg">
            Your preparation already counts. Add 45 minutes a day and build a backup career on the subjects you've already mastered.
          </p>
        </Reveal>
        <Reveal delay={0.18} className="mt-9 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <Button to={primaryCta.to} size="xl">
            {primaryCta.label}
          </Button>
          <Button href="#mapper" size="xl" variant="brandOutline">
            What is my prep worth?
          </Button>
        </Reveal>
        <Reveal delay={0.26}>
          <ul className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted">
            {["Clear fees upfront", "Hindi, Hinglish and English", "30 to 90 minutes a day"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <BadgeCheck className="size-4 text-primary" /> {t}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────── 2. Mapper ───────────────────────── */

function PrepMapper() {
  const [exam, setExam] = useState("SSC");
  const rows = PREP_MAP[exam] || [];
  const meta = MAPPER_EXAMS.find((e) => e.value === exam);
  return (
    <section id="mapper" className="container-campus scroll-mt-24 py-20 sm:py-28">
      <Reveal>
        <SectionTitle
          eyebrow="Your prep already counts"
          title={
            <>
              Every subject has a <em className="accent">paying job</em>
            </>
          }
          description="Pick your exam and see how each subject turns into a private-sector skill, a role and a salary."
        />
      </Reveal>

      <Reveal delay={0.08} className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <div role="radiogroup" aria-label="Choose your exam" className="scrollbar-none flex gap-1 overflow-x-auto border-b border-line p-2 sm:justify-center">
          {MAPPER_EXAMS.map((e) => {
            const on = e.value === exam;
            return (
              <button
                key={e.value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setExam(e.value)}
                className={cn("shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors", on ? "bg-primary text-primary-fg" : "text-muted hover:bg-surface-2 hover:text-fg")}
              >
                {e.label}
              </button>
            );
          })}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.ul
            key={exam}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            variants={staggerParent}
            className="divide-y divide-line"
            aria-live="polite"
            aria-label={`${meta?.label} subjects mapped to private-sector jobs`}
          >
            {rows.map((r) => (
              <motion.li key={r.subject} variants={staggerChild} className="grid gap-1.5 px-5 py-4 sm:grid-cols-[1fr_auto_1.3fr_auto] sm:items-center sm:gap-4 sm:px-6">
                <span className="font-medium">{r.subject}</span>
                <ArrowRight className="hidden size-4 text-subtle sm:block" aria-hidden="true" />
                <span className="text-sm">
                  <span className="text-fg">{r.job}</span>
                  <span className="block text-xs text-muted">{r.skill}</span>
                </span>
                <span className="text-sm font-medium tabular-nums sm:text-right">
                  {formatINR(r.pay[0])}–{formatINR(r.pay[1]).replace("₹", "")}
                  <span className="ml-1 text-xs font-normal text-muted">/mo</span>
                </span>
              </motion.li>
            ))}
          </motion.ul>
        </AnimatePresence>
      </Reveal>
      <p className="mx-auto mt-4 flex max-w-4xl items-start gap-1.5 text-xs text-muted">
        <Info className="mt-0.5 size-3.5 shrink-0" /> Indicative entry-level monthly pay in Indian cities. Actual pay depends on city, company and your proof portfolio.
      </p>
    </section>
  );
}

/* ───────────────────────── 3. Bridge tracks ───────────────────────── */

function BridgeTracks() {
  const { data, isLoading } = useBridgeTracks();
  const tracks = data?.length ? data : BRIDGE_TRACKS;
  return (
    <section className="border-y border-line bg-surface-2/40 py-20 sm:py-28">
      <div className="container-campus">
        <Reveal>
          <SectionTitle
            eyebrow="Bridge tracks"
            title={
              <>
                Start where your <em className="accent">prep ends</em>
              </>
            }
            description="Short tracks that begin from exam subjects you already know, taught in Hindi and English."
          />
        </Reveal>
        {isLoading ? (
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : (
          <motion.div variants={staggerParent} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} className="mt-12 grid gap-5 md:grid-cols-3">
            {tracks.map((t) => (
              <motion.div key={t.slug} variants={staggerChild}>
                <BridgeTrackCard track={t} />
              </motion.div>
            ))}
          </motion.div>
        )}
        <Reveal className="mx-auto mt-10 max-w-2xl text-center">
          <p className="text-base text-fg sm:text-lg">
            <span className="font-medium">Exam link:</span> You've solved hundreds of DI tables for SSC CGL. A pivot table is the same skill in Excel.
          </p>
          <p className="mt-2 text-sm text-muted">Every bridge lesson opens like this, so you always know what you already know.</p>
          <Button to="/tracks?audience=aspirants" variant="brandOutline" size="lg" rightIcon={ArrowRight} className="mt-8">
            All aspirant tracks
          </Button>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────── 4. 45 minutes a day + Switch plan ───────────────────────── */

function DailyPlan() {
  return (
    <section id="switch" className="container-campus scroll-mt-24 py-20 sm:py-28">
      <Reveal>
        <SectionTitle
          eyebrow="How it works"
          title={
            <>
              45 minutes a day, <em className="accent">90 days</em> to a switch
            </>
          }
          description="Insurance, not a distraction. One short lesson, then back to your prep. When you're ready to move, the plan is already in motion."
        />
      </Reveal>
      <div className="mt-14 grid gap-5 lg:grid-cols-4">
        <Reveal className="flex flex-col items-center justify-center rounded-2xl border border-line bg-surface p-6 text-center sm:p-8">
          <TimeRing value={45} max={45} size={120} stroke={8} label="45" sublabel="min / day" />
          <p className="mt-5 text-lg font-medium tracking-tight">About 6% of a study day</p>
          <p className="mt-1 text-sm text-muted">The other 94% stays with your exam.</p>
        </Reveal>
        {SWITCH_PLAN.map((s, i) => (
          <Reveal key={s.range} delay={(i + 1) * 0.08} className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <span className="flex size-9 items-center justify-center rounded-full bg-surface-2 text-sm font-medium text-primary">{i + 1}</span>
              <span className="text-xs text-subtle">{s.range}</span>
            </div>
            <h3 className="mt-6 text-xl font-medium tracking-tight">{s.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.desc}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── 5. Preparation record ───────────────────────── */

const SAMPLE_RECORD = {
  examName: "SSC CGL",
  prepYears: 3,
  studyHoursTotal: 5600,
  mockTestsTaken: 214,
  bestMockPercentile: 96,
  strengths: ["Quant", "Data Interpretation", "Reasoning", "English"],
  traits: ["Discipline", "Self-study", "Analytical reading"],
  bridgeCourses: 2,
};

function PreparationRecordSection() {
  return (
    <section className="border-t border-line py-20 sm:py-28">
      <div className="container-campus grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
        <Reveal>
          <SectionTitle
            align="left"
            eyebrow="Preparation record"
            title={
              <>
                Prep years aren't a gap. <em className="accent">They're proof.</em>
              </>
            }
            description="Your Skill Passport shows your preparation for what it is: discipline, thousands of study hours and hundreds of timed tests."
          />
          <ul className="mt-8 space-y-3.5">
            {["Exam, prep years, study hours and strong subjects", "Traits employers value: discipline and self-study", "Never your age or number of attempts", "Switch it off any time"].map((t) => (
              <li key={t} className="flex items-start gap-3 text-[15px] text-muted">
                <BadgeCheck className="mt-0.5 size-4.5 shrink-0 text-primary" strokeWidth={1.75} />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="rounded-3xl border border-line bg-surface-2/60 p-3 sm:p-4">
            <div className="flex items-center gap-3 px-2 pt-1 pb-3">
              <Avatar name="Pooja Yadav" size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">Pooja Yadav</p>
                <p className="truncate text-xs text-muted">Prayagraj · B.Sc Maths · /u/pooja</p>
              </div>
              <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-muted">
                <IdCard className="size-3.5" /> Skill Passport
              </span>
            </div>
            <PreparationRecordCard record={SAMPLE_RECORD} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────── 6. Credentials (honest) ───────────────────────── */

const TODAY = [
  { icon: Award, title: "Verified skill certificates", text: "Issued when you complete a course, with a public verify code." },
  { icon: FileCheck2, title: "Proof portfolio", text: "Assessed work and verified skills." },
  { icon: IdCard, title: "Skill Passport", text: "One public link with your verified skills and preparation record." },
];
const PATHWAYS = ["Skill India / NSDC", "SWAYAM", "Academic Bank of Credits", "UGC-approved open universities"];

function Credentials() {
  return (
    <section className="container-campus py-20 sm:py-28">
      <Reveal>
        <SectionTitle
          eyebrow="Credentials, honestly"
          title={
            <>
              What you get, and what's <em className="accent">coming</em>
            </>
          }
          description="We'd rather be clear than oversell. Here's exactly what a Campus credential is today."
        />
      </Reveal>
      <div className="mt-14 grid gap-5 lg:grid-cols-2">
        <Reveal className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <p className="eyebrow flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-success" /> Available today
          </p>
          <ul className="mt-6 space-y-5">
            {TODAY.map((t) => (
              <li key={t.title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-primary">
                  <t.icon className="size-4.5" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="font-medium">{t.title}</p>
                  <p className="mt-0.5 text-sm text-muted">{t.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.08} className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <p className="eyebrow flex items-center gap-1.5">
            <GraduationCap className="size-3.5" /> Partner pathways
          </p>
          <p className="mt-4 text-sm text-muted">We're working towards pathways that could help Campus learning count towards recognised credentials. None are live yet.</p>
          <ul className="mt-5 divide-y divide-line rounded-xl border border-line">
            {PATHWAYS.map((p) => (
              <li key={p} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-sm">{p}</span>
                <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-medium text-muted">Coming soon</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 flex items-start gap-2 text-xs text-muted">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            Campus certificates are verified skill certificates. They are not degrees or government diplomas.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────── 7. FAQ ───────────────────────── */

const FAQ = [
  {
    q: "Will this distract me from my exam?",
    a: "It's designed not to. You choose a daily budget of 30, 45, 60 or 90 minutes and Campus plans around it: one short lesson, then back to your prep. When today's minutes are done, the dashboard tells you to go back to studying. Many bridge lessons even reinforce exam subjects like Quant, DI and English.",
  },
  {
    q: "I'm Hindi medium. Will I manage?",
    a: "Yes. Bridge tracks are taught in Hindi and English. Being strong in Hindi is a real advantage in translation work.",
  },
  {
    q: "My attempts are almost over. Is it too late?",
    a: "Not at all. Your years of preparation are exactly what employers mean by discipline and self-study, and your Preparation record shows that. The 90-day Switch plan gives you a cohort of former aspirants, interview practice and mentors who made the same move.",
  },
  {
    q: "What does it cost?",
    a: "Some courses are free. Paid courses show their fee and GST before you enrol, and the fee is paid before you start.",
  },
  {
    q: "Will Campus give me a degree or a government certificate?",
    a: "No. Campus gives verified skill certificates, a proof portfolio and a Skill Passport. We're working on partner pathways towards recognised credentials (Skill India/NSDC, SWAYAM, Academic Bank of Credits, UGC-approved open universities), and they're marked “coming soon” until they're live.",
  },
  {
    q: "Will anyone see my age or number of attempts?",
    a: "Never. Your birth year is only used for a private age-limit planner on your own dashboard, and attempts are never shown publicly. Your public Preparation record shows only your exam, prep years, study hours, mock tests and strengths, and you can switch it off.",
  },
];

function FaqSection() {
  return (
    <section className="border-t border-line py-20 sm:py-28">
      <div className="container-campus">
        <Reveal>
          <SectionTitle
            eyebrow="FAQ"
            title={
              <>
                Sawaal? <em className="accent">Jawaab yahan.</em>
              </>
            }
          />
        </Reveal>
        <Reveal delay={0.08} className="mx-auto mt-12 max-w-3xl">
          <Faq items={FAQ} />
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────── Page ───────────────────────── */

export default function Aspirants() {
  const { isAuthed, user } = useAuth();
  const { hash } = useLocation();
  // Deep links such as /aspirants#switch (from the dashboard planner)
  useEffect(() => {
    if (!hash) return;
    const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    return () => clearTimeout(t);
  }, [hash]);
  const isStudent = isAuthed && user?.role === "STUDENT";
  const primaryCta = isStudent
    ? user?.aspirant
      ? { to: "/app", label: "Open my aspirant plan" }
      : { to: "/app/profile#aspirant", label: "Turn on Aspirant mode" }
    : { to: SIGNUP, label: "Start my backup plan" };

  return (
    <>
      <Hero primaryCta={primaryCta} />
      <PrepMapper />
      <BridgeTracks />
      <DailyPlan />
      <PreparationRecordSection />
      <Credentials />
      <FaqSection />
      <InkCta
        title={
          <>
            Taiyari jaari rakhiye.
            <br />
            Backup <em className="accent">aaj se.</em>
          </>
        }
        description="Add 45 minutes a day and build a backup career, in Hindi or English."
        primary={primaryCta}
        secondary={{ to: "/tracks?audience=aspirants", label: "See bridge tracks" }}
      />
    </>
  );
}
