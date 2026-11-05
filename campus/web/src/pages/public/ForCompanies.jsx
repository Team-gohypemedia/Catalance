import { ArrowRight, BadgeCheck, ClipboardList, FileCheck2, MessagesSquare, ShieldCheck, UserCheck, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero, Reveal } from "@/components/marketing/primitives";
import { CATALANCE_URL } from "@/lib/catalance";

/**
 * For Businesses (spec §4.1): managed talent and PM-led delivery. Client briefs are captured by Catalance,
 * so "Share a Project" goes to the Catalance brief flow; a Catalance project manager matches verified Campus talent.
 */
const BRIEF_URL = `${CATALANCE_URL}/service`;

function SectionHeader({ eyebrow, title, description }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="mt-3 text-3xl leading-[1.1] font-medium tracking-tight text-balance sm:text-5xl">{title}</h2>
      {description && <p className="mt-4 text-base text-balance text-muted sm:text-lg">{description}</p>}
    </Reveal>
  );
}

const STEPS = [
  { icon: ClipboardList, title: "Share your project", body: "Tell us what you need, your budget and your deadline. It takes a few minutes on Catalance." },
  { icon: UserCheck, title: "A project manager plans it", body: "A Catalance PM scopes the work, agrees the price with you and picks verified talent." },
  { icon: Workflow, title: "Work is delivered and checked", body: "The PM reviews every delivery against your acceptance criteria before it reaches you." },
  { icon: FileCheck2, title: "You accept, then pay out", body: "Payout to the freelancer happens only after you accept the work." },
];

const WHY = [
  { icon: BadgeCheck, t: "Verified skills", d: "Talent has passed a practical, rubric-scored assessment for the skill and level you need." },
  { icon: ShieldCheck, t: "One accountable manager", d: "Your PM owns scope, quality and timelines. You don't manage freelancers yourself." },
  { icon: MessagesSquare, t: "Clear terms", d: "Deliverables, revisions and deadlines are agreed before work starts." },
];

export default function ForCompanies() {
  return (
    <>
      <PageHero
        eyebrow="For businesses"
        title={
          <>
            Managed talent, <em className="accent">PM-led</em> delivery
          </>
        }
        description="Share your project. A Catalance project manager delivers it with verified talent."
        actions={
          <Button href={BRIEF_URL} size="xl" rightIcon={ArrowRight}>
            Share a Project
          </Button>
        }
      />

      <section className="container-campus pb-20 sm:pb-28">
        <SectionHeader eyebrow="How it works" title={<>From brief to <em className="accent">accepted</em> work</>} />
        <ol className="mx-auto mt-14 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 0.05} className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-surface-2 text-primary">
                  <s.icon className="size-4.5" strokeWidth={1.75} />
                </span>
                <span className="text-sm font-medium text-subtle tabular-nums">{i + 1}</span>
              </div>
              <h3 className="mt-6 text-lg font-medium tracking-tight">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="border-y border-line bg-surface-2/40 py-20 sm:py-28">
        <div className="container-campus">
          <SectionHeader eyebrow="Why Catalance" title={<>Quality you can <em className="accent">count on</em></>} />
          <div className="mx-auto mt-14 grid max-w-5xl gap-4 md:grid-cols-3">
            {WHY.map((w, i) => (
              <Reveal key={w.t} delay={i * 0.05} className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
                <span className="flex size-10 items-center justify-center rounded-full bg-surface-2 text-primary">
                  <w.icon className="size-4.5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-5 text-lg font-medium tracking-tight">{w.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{w.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-campus py-20 text-center sm:py-28">
        <Reveal className="mx-auto max-w-2xl">
          <h2 className="text-3xl leading-[1.1] font-medium tracking-tight text-balance sm:text-5xl">
            Have a project in <em className="accent">mind?</em>
          </h2>
          <p className="mt-4 text-base text-muted sm:text-lg">Design, marketing, websites and business support. Tell us what you need.</p>
          <div className="mt-8 flex justify-center">
            <Button href={BRIEF_URL} size="lg" rightIcon={ArrowRight}>
              Share a Project
            </Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
