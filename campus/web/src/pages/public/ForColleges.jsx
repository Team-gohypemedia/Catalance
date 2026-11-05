import { ArrowRight, BarChart3, BellRing, Building2, FileSpreadsheet, GraduationCap, IndianRupee, Megaphone, ShieldCheck, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContactForm, Faq, InkCta, PageHero, Reveal } from "@/components/marketing/primitives";

function SectionHeader({ eyebrow, title, description }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="mt-3 text-3xl leading-[1.1] font-medium tracking-tight text-balance sm:text-5xl">{title}</h2>
      {description && <p className="mt-4 text-base text-balance text-muted sm:text-lg">{description}</p>}
    </Reveal>
  );
}

const WHY = [
  { icon: Trophy, title: "Verified skills for your batch", body: "Students prove each skill in a practical, rubric-scored assessment, not a multiple-choice quiz." },
  { icon: BarChart3, title: "Progress you can see", body: "See who's active, which skills your batch is learning and who has passed an assessment." },
  { icon: IndianRupee, title: "A route to real projects", body: "Verified students become eligible for suitable Catalance projects when client work is available. Not guaranteed." },
  { icon: ShieldCheck, title: "Verified proof, not just certificates", body: "Assessed work and verified skills build a Skill Passport anyone can check." },
  { icon: FileSpreadsheet, title: "Simple reports", body: "Monthly exports on enrolments, assessments and verified skills." },
  { icon: Megaphone, title: "Campus ambassadors", body: "We train student leads who run cohorts, events and hackathons on your campus." },
];

const STEPS = [
  { icon: Building2, t: "Intro call", d: "30 minutes with our partnerships team to understand your goals." },
  { icon: Users, t: "Faculty onboarding", d: "We set up your college page and dashboard, and train a faculty coordinator." },
  { icon: BellRing, t: "Campus launch", d: "A launch session and ambassador drive. Students sign up with your college code." },
  { icon: GraduationCap, t: "Monthly reviews", d: "Review progress, assessments and verified skills together." },
];

const FAQ = [
  { q: "Does the college have to pay anything?", a: "No. Campus partnerships are free for colleges. Students pay the course fee shown on each course, with GST, before they start." },
  { q: "Will this clash with our curriculum or timetable?", a: "No. Campus runs alongside college. Lessons are short and self-paced, and cohorts meet in the evenings. Many partners map tracks to their skill-enhancement or value-added courses." },
  { q: "What data do we get?", a: "A dashboard with active students, courses, assessment results and verified skills, plus a monthly report." },
  { q: "Does Campus guarantee placements?", a: "No. Campus verifies skills. Verified students can be considered for suitable Catalance projects when client work is available. Projects, jobs and earnings are not guaranteed." },
];

export default function ForColleges() {
  return (
    <>
      <PageHero
        eyebrow="For colleges & TPOs"
        title={
          <>
            Verified skills for <em className="accent">your students</em>
          </>
        }
        description="Your students learn practical skills, prove them in a final assessment and get verified. You see their progress, free."
        actions={
          <>
            <Button href="#contact" size="xl" rightIcon={ArrowRight}>
              Partner with Campus
            </Button>
            <Button to="/tracks" size="xl" variant="brandOutline">
              Explore Courses
            </Button>
          </>
        }
      />

      <section className="container-campus pb-20 sm:pb-28">
        <Reveal className="mx-auto grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
          {[
            ["₹0", "cost to the college"],
            ["2 weeks", "from call to launch"],
            ["1 task", "to prove each skill"],
            ["Monthly", "progress reports"],
          ].map(([v, l]) => (
            <div key={l} className="bg-surface p-5 text-center sm:p-6">
              <p className="text-2xl font-medium tracking-tight">{v}</p>
              <p className="mt-1 text-xs text-muted sm:text-sm">{l}</p>
            </div>
          ))}
        </Reveal>
      </section>

      <section className="border-y border-line bg-surface-2/40 py-20 sm:py-28">
        <div className="container-campus">
          <SectionHeader eyebrow="Why partner" title={<>Proof your students can <em className="accent">show</em></>} description="Campus gives your students verified skills, and gives you the data to see progress." />
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {WHY.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 0.05} className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
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

      <section className="container-campus py-20 sm:py-28">
        <SectionHeader eyebrow="How partnership works" title={<>Live in <em className="accent">two weeks</em></>} />
        <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.t} delay={i * 0.05} className="rounded-2xl border border-line bg-surface p-6 sm:p-7">
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-full bg-surface-2 text-primary">
                  <s.icon className="size-4.5" strokeWidth={1.75} />
                </span>
                <span className="text-sm font-medium text-subtle tabular-nums">0{i + 1}</span>
              </div>
              <h3 className="mt-5 text-lg font-medium tracking-tight">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.d}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section id="contact" className="scroll-mt-24 border-t border-line py-20 sm:py-28">
        <div className="container-campus grid gap-12 lg:grid-cols-[1fr_1.25fr] lg:gap-16">
          <Reveal>
            <p className="eyebrow">Talk to us</p>
            <h2 className="mt-3 text-3xl leading-[1.1] font-medium tracking-tight text-balance sm:text-5xl">
              Let's bring Campus to <em className="accent">your batch</em>
            </h2>
            <p className="mt-4 text-base text-muted sm:text-lg">Tell us a little about your college. Our partnerships team, based in Bengaluru, will call you back in your language.</p>
            <div className="mt-10">
              <Faq items={FAQ} />
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <ContactForm kind="college" />
          </Reveal>
        </div>
      </section>

      <InkCta
        title="See what your students can learn."
        description="Every course shows its level, fee and duration upfront."
        primary={{ to: "/tracks", label: "Explore Courses" }}
        secondary={{ to: "/how-it-works", label: "How students use Campus" }}
      />
    </>
  );
}
