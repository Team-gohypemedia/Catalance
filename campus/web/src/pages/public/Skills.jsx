import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, ClipboardCheck, Compass, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/primitives";
import { EmptyState, ErrorState } from "@/components/ui/campus";
import { InkCta, PageHero, Reveal } from "@/components/marketing/primitives";
import { NoGuarantee } from "@/components/marketing/NoGuarantee";
import { LEVEL_LABELS } from "@/components/learning/catalog-meta";

/**
 * Spec §4.1 "Services / Skills": categories → skills, each with its level formats and the client services it supplies.
 * Only published skills show (launch a few at a time); the CTA goes to the course catalogue filtered by skill.
 */

const STEPS = [
  { icon: BookOpen, title: "Learn", body: "A short course with practical tasks." },
  { icon: ClipboardCheck, title: "Submit", body: "One assessment, scored on a clear rubric." },
  { icon: ShieldCheck, title: "Get verified", body: "Pass to earn a skill badge anyone can check." },
];

function SkillCard({ skill }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-line-strong sm:p-7">
      <h3 className="text-lg font-medium tracking-tight">{skill.name}</h3>
      {skill.description && <p className="mt-1.5 text-sm leading-relaxed text-muted">{skill.description}</p>}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {(skill.formats || []).map((f) => (
          <span key={f} className="rounded-full border border-line px-2.5 py-0.5 text-xs text-muted">
            {LEVEL_LABELS[f] || f}
          </span>
        ))}
      </div>
      {skill.clientServices && (
        <div className="mt-5 border-t border-line pt-4">
          <p className="text-xs font-medium text-subtle">Client work it leads to</p>
          <p className="mt-1 text-sm leading-relaxed text-fg/90">{skill.clientServices}</p>
        </div>
      )}
      <div className="mt-auto flex items-center justify-between gap-3 pt-6">
        <span className="text-xs text-muted">{skill.coursesCount ? `${skill.coursesCount} course${skill.coursesCount === 1 ? "" : "s"}` : "Courses coming soon"}</span>
        <Button to={`/app/catalog?skill=${skill.slug}`} variant="brandOutline" size="sm" rightIcon={ArrowRight}>
          Explore courses
        </Button>
      </div>
    </div>
  );
}

export default function PublicSkills() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["public", "categories"], queryFn: () => api.get("/api/categories"), staleTime: 300_000 });
  const categories = data || [];
  const skillsCount = categories.reduce((n, c) => n + (c.skills?.length || 0), 0);

  return (
    <>
      <PageHero
        eyebrow="Skills"
        title={
          <>
            Skills we teach and <em className="accent">verify</em>
          </>
        }
        description="Practical digital skills, taught in short courses and checked by a real assessment."
        actions={
          <Button to="/app/catalog" size="lg" rightIcon={ArrowRight}>
            Explore courses
          </Button>
        }
      />

      <section className="container-campus pb-20 sm:pb-28">
        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : isLoading ? (
          <div className="space-y-12">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="mb-6 h-7 w-48" />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((__, j) => (
                    <Skeleton key={j} className="h-64 rounded-2xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : !skillsCount ? (
          <EmptyState icon={Compass} title="Skills are on their way" description="We are opening our first skills soon. Check back shortly." action={<Button to="/contact">Contact us</Button>} />
        ) : (
          <div className="space-y-16">
            {categories.map((c) => (
              <div key={c.id}>
                <Reveal className="mb-6 flex items-baseline justify-between gap-4">
                  <h2 className="text-2xl font-medium tracking-tight sm:text-3xl">{c.name}</h2>
                  <span className="text-sm text-muted">
                    {c.skills.length} skill{c.skills.length === 1 ? "" : "s"}
                  </span>
                </Reveal>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {c.skills.map((s, i) => (
                    <Reveal key={s.id} delay={Math.min(i, 5) * 0.04} className="h-full">
                      <SkillCard skill={s} />
                    </Reveal>
                  ))}
                </div>
              </div>
            ))}
            <p className="text-center text-sm text-muted">More skills open as client demand is confirmed.</p>
          </div>
        )}
      </section>

      <section className="border-y border-line bg-surface-2/40 py-20 sm:py-28">
        <div className="container-campus">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">How it works</p>
            <h2 className="mt-3 text-3xl leading-[1.1] font-medium tracking-tight text-balance sm:text-5xl">
              Learn, submit, <em className="accent">get verified</em>
            </h2>
          </Reveal>
          <ol className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 0.05} className="rounded-2xl border border-line bg-surface p-6">
                <span className="flex size-10 items-center justify-center rounded-full bg-surface-2 text-primary">
                  <s.icon className="size-4.5" strokeWidth={1.75} />
                </span>
                <p className="mt-5 font-medium tracking-tight">{s.title}</p>
                <p className="mt-1 text-sm text-muted">{s.body}</p>
              </Reveal>
            ))}
          </ol>
          <NoGuarantee className="mx-auto mt-10 max-w-xl text-center" />
        </div>
      </section>

      <InkCta
        title={
          <>
            Pick a skill. <em className="accent">Start this week.</em>
          </>
        }
        description="Short courses with clear prices. Questions first? Read the FAQs."
        primary={{ to: "/app/catalog", label: "Explore courses" }}
        secondary={{ to: "/faqs", label: "Read FAQs" }}
      />
    </>
  );
}
