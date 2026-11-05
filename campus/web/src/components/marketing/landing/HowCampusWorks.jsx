import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BadgeCheck, BookOpen, BriefcaseBusiness, ClipboardCheck, Compass, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "../primitives";
import { Img } from "../Img";
import { NoGuarantee } from "../NoGuarantee";

/* Small product moments shown under each photo. */
function LessonChip() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
        <PlayCircle className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium">Tally · Lesson 4</p>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-3">
          <div className="h-full w-2/5 rounded-full bg-primary" />
        </div>
      </div>
      <span className="text-[11px] text-subtle">7 min</span>
    </div>
  );
}
function ChooseChip() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Compass className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium">UI/UX Design</p>
        <p className="truncate text-[11px] text-muted">Beginner · 10 days</p>
      </div>
    </div>
  );
}
function ProveChip() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
        <ClipboardCheck className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium">Final assessment</p>
        <p className="text-[11px] text-muted">Scored on a clear rubric</p>
      </div>
    </div>
  );
}
function OfferChip() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted">
        <BriefcaseBusiness className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium">Project offer</p>
        <p className="text-[11px] text-muted">When client work fits your skill</p>
      </div>
    </div>
  );
}
function CertChip() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
        <BadgeCheck className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium">Skill verified</p>
        <p className="text-[11px] text-muted">UI/UX Design · Beginner</p>
      </div>
    </div>
  );
}

// spec §7.2 journey: Choose → Learn → Prove → Get verified → Find opportunities
const STEPS = [
  { icon: Compass, title: "Choose", text: "Choose a skill that interests you.", photo: "mobileLearner", pos: "50% 25%", Chip: ChooseChip },
  { icon: BookOpen, title: "Learn", text: "Learn through practical lessons and tasks.", photo: "mentorTeaching", pos: "55% 35%", Chip: LessonChip },
  { icon: ClipboardCheck, title: "Prove", text: "Complete your final practical assessment.", photo: "womanHome", pos: "50% 35%", Chip: ProveChip },
  { icon: BadgeCheck, title: "Get verified", text: "Pass and complete your profile to verify that skill.", photo: "graduateWoman", pos: "60% 25%", Chip: CertChip },
  { icon: BriefcaseBusiness, title: "Find opportunities", text: "Get considered for suitable projects when client work is available.", photo: "mentorPortrait", pos: "45% 30%", Chip: OfferChip },
];

/** Horizontal timeline: a line with five numbered stops, each with a photo and a product moment. */
export function HowCampusWorks() {
  const reduce = useReducedMotion();
  return (
    <section id="how-campus-works" className="py-20 sm:py-28">
      <div className="container-campus">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow mb-4">How it works</p>
          <h2 className="text-3xl leading-[1.1] font-medium tracking-tight text-balance sm:text-5xl">Five steps, <em className="accent">one skill</em> at a time</h2>
        </Reveal>

        <div className="relative mt-14 sm:mt-16">
          {/* Timeline rail (desktop) */}
          <div className="absolute top-5 right-[10%] left-[10%] hidden h-px bg-line-strong lg:block" aria-hidden="true">
            <motion.div
              className="h-full origin-left bg-primary"
              initial={reduce ? false : { scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          <ol className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-12 sm:overflow-visible sm:px-0 lg:grid-cols-5 lg:gap-x-5 [&::-webkit-scrollbar]:hidden">
            {STEPS.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 0.08} className="relative w-[78%] shrink-0 snap-start sm:w-auto">
                <div className="flex flex-col items-start lg:items-center">
                  <span className="relative z-10 flex size-10 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-fg shadow-[0_0_0_6px_var(--bg)] tabular-nums">{i + 1}</span>
                </div>
                <div className="mt-5">
                  <Img photo={s.photo} ratio="4/3" sizes="(min-width: 1024px) 230px, (min-width: 640px) 45vw, 78vw" position={s.pos} credit="tr" icon={s.icon} className="rounded-2xl border-0" />
                  <div className="relative mx-3 -mt-7 rounded-xl border border-line bg-surface p-3 shadow-[0_10px_30px_-16px_rgb(0_0_0/0.3)]">
                    <s.Chip />
                  </div>
                </div>
                <h3 className="mt-5 text-xl font-medium tracking-tight lg:text-center">{s.title}</h3>
                <p className="mt-1 text-[15px] text-muted lg:text-center">{s.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>

        <div className="mt-12 text-center">
          <NoGuarantee className="mx-auto max-w-xl" />
          <Button to="/how-it-works" variant="link" rightIcon={ArrowRight} className="mt-3">
            See how it works in detail
          </Button>
        </div>
      </div>
    </section>
  );
}
