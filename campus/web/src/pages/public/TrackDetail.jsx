import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, BookOpen, Check, ClipboardCheck, Compass, GraduationCap, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api/client";
import { formatCompact, formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/primitives";
import { EmptyState, ErrorState } from "@/components/ui/campus";
import { trackBySlug } from "@/components/marketing/data";
import { InkCta, Reveal, TrackIcon, staggerChild, staggerParent } from "@/components/marketing/primitives";
import { NoGuarantee } from "@/components/marketing/NoGuarantee";
import { CourseCard } from "@/components/learning/CourseCard";

// spec §1.1: learning → assessment → verification → eligibility (never a guaranteed job)
const JOURNEY = [
  { icon: BookOpen, title: "Learn", short: "Short lessons and practical tasks." },
  { icon: ClipboardCheck, title: "Submit", short: "One assessment, scored on a rubric." },
  { icon: ShieldCheck, title: "Get verified", short: "Pass to earn a skill badge." },
  { icon: Compass, title: "Project ready", short: "Become eligible for relevant projects." },
];

function SectionHeader({ eyebrow, title, description }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="mt-3 text-3xl leading-[1.1] font-medium tracking-tight text-balance sm:text-5xl">{title}</h2>
      {description && <p className="mt-4 text-base text-balance text-muted sm:text-lg">{description}</p>}
    </Reveal>
  );
}

function Loading() {
  return (
    <div className="container-campus">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 py-20 sm:py-28">
        <Skeleton className="h-8 w-40 rounded-full" />
        <Skeleton className="h-16 w-full max-w-xl" />
        <Skeleton className="h-6 w-full max-w-md" />
        <Skeleton className="h-12 w-64 rounded-lg" />
      </div>
      <div className="grid gap-4 pb-20 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default function TrackDetail() {
  const { slug } = useParams();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["public", "track", slug], queryFn: () => api.get(`/api/tracks/${slug}`), retry: false });

  if (isLoading) return <Loading />;

  const fallback = trackBySlug(slug);
  let track = data;
  if (error) {
    if (fallback) track = { ...fallback, courses: [] };
    else if (error.status === 404)
      return (
        <div className="container-campus py-20">
          <EmptyState
            icon={Compass}
            title="We couldn't find that track"
            description="It may have been renamed. Browse all nine tracks instead."
            action={
              <Button to="/tracks" leftIcon={ArrowLeft}>
                All tracks
              </Button>
            }
          />
        </div>
      );
    else
      return (
        <div className="container-campus py-20">
          <ErrorState error={error} onRetry={refetch} />
        </div>
      );
  }

  const color = track.color || "#FF5A1F";
  const courses = track.courses || [];
  const outcomes = track.outcomes || [];
  const careers = track.careers || [];
  const stats = [
    track.durationWeeks ? `${track.durationWeeks} weeks` : null,
    `${track.coursesCount ?? courses.length} courses`,
    track.studentsCount ? `${formatCompact(track.studentsCount)} learners` : "New track",
    track.level || null,
  ].filter(Boolean);

  return (
    <>
      {/* Hero: calm, centered; the track colour is only a small accent */}
      <section className="relative">
        <div className="container-campus pt-8 pb-20 sm:pt-10 sm:pb-24">
          <Link to="/tracks" className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-medium text-muted transition-colors hover:text-fg">
            <ArrowLeft className="size-4" /> All tracks
          </Link>
          <Reveal className="mx-auto mt-10 flex max-w-3xl flex-col items-center text-center sm:mt-14">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5 text-sm font-medium">
              <TrackIcon name={track.icon} slug={track.slug} className="size-4" style={{ color }} />
              {track.category === "NON_TECH" ? "Non-tech track" : "Tech track"}
            </span>
            <h1 className="mt-6 text-4xl leading-[1.1] font-medium tracking-tight text-balance sm:text-6xl lg:text-7xl">{track.title}</h1>
            {track.tagline && <p className="mx-auto mt-5 max-w-2xl text-base text-balance text-muted sm:text-lg">{track.tagline}</p>}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button href="#courses" size="xl" rightIcon={ArrowRight}>
                View courses
              </Button>
              <Button to="/skills" size="xl" variant="brandOutline">
                Browse by skill
              </Button>
            </div>
            <ul className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted">
              {stats.map((s, i) => (
                <li key={s} className="flex items-center gap-6">
                  {i > 0 && <span className="size-1 rounded-full bg-line-strong" aria-hidden="true" />}
                  {s}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Outcomes + careers */}
      <section className="border-y border-line bg-surface-2/40 py-20 sm:py-28">
        <div className="container-campus">
          <SectionHeader eyebrow="Outcomes" title={<>What you'll be <em className="accent">able to do</em></>} description="Skills you can show in your work. Pay figures are indicative market data, not a promise." />
          <div className="mt-14 grid gap-4 lg:grid-cols-2">
            <Reveal className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
              <p className="text-lg font-medium tracking-tight">You'll learn to</p>
              {outcomes.length ? (
                <ul className="mt-5 space-y-3.5">
                  {outcomes.map((o) => (
                    <li key={o} className="flex items-start gap-3 text-[15px]">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-2">
                        <Check className="size-3" style={{ color }} strokeWidth={2.5} />
                      </span>
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-muted">Outcomes for this track are being finalised by our mentors.</p>
              )}
            </Reveal>
            <Reveal delay={0.06} className="flex flex-col rounded-2xl border border-line bg-surface p-6 sm:p-8">
              <p className="text-lg font-medium tracking-tight">Where it leads</p>
              {careers.length ? (
                <ul className="mt-3 divide-y divide-line">
                  {careers.map((c) => (
                    <li key={c.title} className="flex items-center justify-between gap-4 py-4">
                      <span className="min-w-0 text-[15px]">{c.title}</span>
                      <span className="shrink-0 text-right">
                        <span className="block font-medium tabular-nums">{formatINR(c.avgPayINR)}</span>
                        <span className="block text-xs text-muted">avg. per year</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-muted">Our mentors are still compiling pay data for this track.</p>
              )}
              <p className="mt-auto pt-4 text-xs text-subtle">Indicative pay for India, from public job listings and Catalance freelancer earnings.</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Courses */}
      <section id="courses" className="container-campus scroll-mt-24 py-20 sm:py-28">
        <SectionHeader eyebrow="The path" title={<>Courses in <em className="accent">this track</em></>} description="Each course shows its level, length and fee. Each ends with an assessment." />
        <div className="mt-14">
          {courses.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="Courses are being added"
              description="Courses for this track open soon. Browse the skills that are open now."
              action={<Button to="/skills">See skills</Button>}
            />
          ) : (
            <motion.div variants={staggerParent} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((c, i) => (
                <motion.div key={c.id} variants={staggerChild} className="h-full">
                  <CourseCard course={c} index={i} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Journey */}
      <section className="border-t border-line py-20 sm:py-28">
        <div className="container-campus">
          <SectionHeader eyebrow="After the course" title={<>From course to <em className="accent">verified skill</em></>} description={`How a ${track.title} course leads to a verified skill.`} />
          <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {JOURNEY.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 0.05} className="rounded-2xl border border-line bg-surface p-6">
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-full bg-surface-2 text-primary">
                    <s.icon className="size-4.5" strokeWidth={1.75} />
                  </span>
                  <span className="text-sm font-medium text-subtle tabular-nums">0{i + 1}</span>
                </div>
                <p className="mt-5 font-medium tracking-tight">{s.title}</p>
                <p className="mt-1 text-sm text-muted">{s.short}</p>
              </Reveal>
            ))}
          </ol>
          <NoGuarantee className="mx-auto mt-10 max-w-xl text-center" />
        </div>
      </section>

      <InkCta
        title={`Start ${track.title} this week`}
        description="Clear fees, a real assessment and a skill badge anyone can check."
        primary={{ to: `/app/catalog?track=${track.slug}`, label: "Explore courses" }}
        secondary={{ to: "/faqs", label: "Read FAQs" }}
      />
    </>
  );
}
