import { ArrowRight, BadgeCheck, BookOpen, BriefcaseBusiness, ClipboardCheck, Compass, FileText, MessagesSquare, RotateCcw, Scale, Users, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Faq, InkCta, PageHero, Reveal } from "@/components/marketing/primitives";
import { NoGuarantee } from "@/components/marketing/NoGuarantee";
import { usePlatformConfig } from "@/lib/platform";

function SectionHeader({ eyebrow, title, description }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="mt-3 text-3xl leading-[1.1] font-medium tracking-tight text-balance sm:text-5xl">{title}</h2>
      {description && <p className="mt-4 text-base text-balance text-muted sm:text-lg">{description}</p>}
    </Reveal>
  );
}

/** Spec §7.2 journey, word for word. */
const STEPS = [
  { icon: Compass, title: "Choose", body: "Choose a skill that interests you. Each course shows its level, fee, duration and outcome before you enrol." },
  { icon: BookOpen, title: "Learn", body: "Learn through practical lessons and tasks, taught by people who do the work." },
  { icon: ClipboardCheck, title: "Prove", body: "Complete your final practical assessment. An evaluator scores it against a published rubric." },
  { icon: BadgeCheck, title: "Get verified", body: "Pass and complete your profile to verify that skill. Anyone can check it with its code." },
  { icon: BriefcaseBusiness, title: "Find opportunities", body: "Get considered for suitable projects when client work is available. Every offer shows the payout before you accept." },
];

/** What the assessment rules look like, from settings (spec §8, §19 defaults). */
function rules(assessment) {
  const reassess = Math.max(0, (assessment.maxAttempts ?? 2) - 1);
  return [
    { icon: FileText, title: "One practical task", body: "A real-world brief with clear instructions and a rubric you can read before you start." },
    { icon: ClipboardCheck, title: `Pass at ${assessment.passScore ?? 70}/100`, body: "You also need every critical criterion met. Your feedback explains each score." },
    {
      icon: RotateCcw,
      title: reassess ? `${reassess === 1 ? "One reassessment" : `${reassess} reassessments`} included` : "Feedback on every attempt",
      body: `Didn't pass? Use the feedback and try again within ${assessment.reassessWindowDays ?? 14} days.`,
    },
    { icon: Scale, title: "Fair appeals", body: "Think a result is wrong? Appeal once. A different reviewer decides." },
  ];
}

const TOGETHER = [
  { icon: MessagesSquare, title: "Community Q&A", body: "Ask a question and get answers from other learners and mentors.", flag: "community" },
  { icon: Video, title: "1:1 mentor sessions", body: "Book a working professional for a portfolio review or a stuck task.", flag: "mentorBooking" },
  { icon: Users, title: "Cohorts", body: "Study groups with a lead mentor and a weekly schedule.", flag: "cohorts" },
];

export default function HowItWorks() {
  const { assessment, content, flags } = usePlatformConfig();
  const together = TOGETHER.filter((t) => flags[t.flag]);

  return (
    <>
      <PageHero
        eyebrow="How it works"
        title={
          <>
            Learn a skill. Prove it. <em className="accent">Get verified.</em>
          </>
        }
        description="Five steps. One final task. A skill you can show."
        actions={
          <Button to="/tracks" size="xl" rightIcon={ArrowRight}>
            Explore Courses
          </Button>
        }
      />

      <section className="container-campus pb-20 sm:pb-28">
        <ol className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 0.05} className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-surface-2 text-primary">
                  <s.icon className="size-4.5" strokeWidth={1.75} />
                </span>
                <span className="text-sm font-medium text-subtle tabular-nums">{i + 1}</span>
              </div>
              <h2 className="mt-6 text-lg font-medium tracking-tight">{s.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            </Reveal>
          ))}
        </ol>
        <NoGuarantee className="mx-auto mt-8 max-w-xl text-center" />
      </section>

      <section className="border-y border-line bg-surface-2/40 py-20 sm:py-28">
        <div className="container-campus">
          <SectionHeader eyebrow="The assessment" title={<>Clear rules, <em className="accent">fair</em> results</>} description="The same rubric for everyone. Paying or finishing lessons never verifies a skill on its own." />
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {rules(assessment).map((f, i) => (
              <Reveal key={f.title} delay={i * 0.05} className="rounded-2xl border border-line bg-surface p-6 sm:p-7">
                <span className="flex size-10 items-center justify-center rounded-full bg-surface-2 text-primary">
                  <f.icon className="size-4.5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-5 text-lg font-medium tracking-tight">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {together.length > 0 && (
        <section className="container-campus py-20 sm:py-28">
          <SectionHeader eyebrow="Support" title={<>You're not <em className="accent">alone</em></>} description="Help is built into every step." />
          <div className={`mx-auto mt-14 grid max-w-5xl gap-4 sm:grid-cols-2 ${together.length > 2 ? "lg:grid-cols-3" : ""}`}>
            {together.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.05} className="rounded-2xl border border-line bg-surface p-6 sm:p-7">
                <span className="flex size-10 items-center justify-center rounded-full bg-surface-2 text-primary">
                  <f.icon className="size-4.5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-5 text-lg font-medium tracking-tight">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section className={`container-campus py-20 sm:py-28 ${together.length ? "border-t border-line" : ""}`}>
        <SectionHeader eyebrow="Questions" title={<>Before you <em className="accent">start</em></>} />
        <Reveal className="mx-auto mt-12 max-w-3xl">
          <Faq items={content.faqs.slice(0, 5)} />
        </Reveal>
      </section>

      <InkCta title="Pick your first skill." description="See the level, fee and duration of every course before you enrol." primary={{ to: "/tracks", label: "Explore Courses" }} secondary={{ to: "/pricing", label: "See pricing" }} />
    </>
  );
}
