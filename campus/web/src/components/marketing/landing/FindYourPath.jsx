import { useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Briefcase, Clock, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Img } from "../Img";
import { TRACK_THUMBS, photoSrc } from "../photos";
import { Reveal } from "../primitives";
import { PERSONAS } from "./content";

const EASE = [0.22, 1, 0.36, 1];

/** "I am a…" picker: vertical tabs on the left, the persona's photo and path on the right. */
export function FindYourPath() {
  const { isAuthed } = useAuth();
  const [value, setValue] = useState(PERSONAS[0].id);
  const uid = useId();
  const refs = useRef({});
  const p = PERSONAS.find((x) => x.id === value) || PERSONAS[0];

  const onKey = (e) => {
    const i = PERSONAS.findIndex((x) => x.id === value);
    let n = null;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") n = (i + 1) % PERSONAS.length;
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") n = (i - 1 + PERSONAS.length) % PERSONAS.length;
    if (e.key === "Home") n = 0;
    if (e.key === "End") n = PERSONAS.length - 1;
    if (n === null) return;
    e.preventDefault();
    setValue(PERSONAS[n].id);
    refs.current[PERSONAS[n].id]?.focus();
  };

  return (
    <section id="find-your-path" className="border-y border-line bg-surface py-20 sm:py-28">
      <div className="container-campus">
        <Reveal className="max-w-2xl">
          <p className="eyebrow mb-4">Find your path</p>
          <h2 className="text-3xl leading-[1.1] font-medium tracking-tight text-balance sm:text-5xl">Tell us where you are. We&rsquo;ll show the way.</h2>
        </Reveal>

        <Reveal delay={0.05} className="mt-10 grid gap-6 lg:mt-14 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10">
          {/* Tabs */}
          <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-0 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
            <p className="mb-3 hidden text-sm text-muted lg:block">I am a…</p>
            <div role="tablist" aria-label="I am a" aria-orientation="vertical" onKeyDown={onKey} className="flex w-max gap-2 lg:w-auto lg:flex-col lg:gap-1">
              {PERSONAS.map((x) => {
                const on = x.id === value;
                return (
                  <button
                    key={x.id}
                    ref={(el) => (refs.current[x.id] = el)}
                    id={`${uid}-tab-${x.id}`}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    aria-controls={`${uid}-panel`}
                    tabIndex={on ? 0 : -1}
                    onClick={() => setValue(x.id)}
                    className={cn(
                      "group relative flex shrink-0 cursor-pointer items-center gap-3 rounded-full border px-4 py-2 text-left text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:rounded-xl lg:border-transparent lg:px-4 lg:py-3.5 lg:text-[15px]",
                      on ? "border-primary bg-primary-soft text-fg lg:border-line lg:bg-bg" : "border-line text-muted hover:text-fg lg:hover:bg-bg/60",
                    )}
                  >
                    {on && <motion.span layoutId="path-bar" className="absolute top-3 bottom-3 left-0 hidden w-[3px] rounded-full bg-primary lg:block" transition={{ type: "spring", bounce: 0.15, duration: 0.4 }} />}
                    <span className="relative">{x.label}</span>
                    <ArrowRight className={cn("ml-auto hidden size-4 transition-opacity lg:block", on ? "text-primary opacity-100" : "opacity-0 group-hover:opacity-40")} aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Panel */}
          <div id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-tab-${p.id}`} className="grid overflow-hidden rounded-3xl border border-line bg-bg md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
            <div className="relative min-h-[260px] md:min-h-[460px]">
              <AnimatePresence initial={false}>
                <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease: EASE }} className="absolute inset-0">
                  <Img photo={p.image} ratio={null} sizes="(min-width: 1024px) 420px, 100vw" position={p.photoPos || "50% 35%"} credit="br" icon={GraduationCap} className="size-full rounded-none border-0" />
                </motion.div>
              </AnimatePresence>
              <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-surface/95 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur">
                <Clock className="size-3.5 text-primary" aria-hidden="true" />
                {p.time}
              </span>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="flex flex-col p-6 sm:p-8"
              >
                <h3 className="text-2xl leading-tight font-medium tracking-tight sm:text-[28px]">{p.headline}</h3>
                <p className="mt-2 text-[15px] text-muted">{p.extra}</p>

                <ol className="mt-6 space-y-2.5">
                  {p.path.map((c, i) => {
                    const thumb = TRACK_THUMBS[c.slug];
                    return (
                      <li key={c.slug}>
                        <Link to={`/tracks/${c.slug}`} className="group flex items-center gap-3 rounded-2xl border border-line bg-surface p-2 pr-4 transition-colors hover:border-line-strong">
                          {thumb ? (
                            <img src={photoSrc(thumb, 160, { height: 120 })} alt="" width={56} height={42} loading="lazy" className="h-[42px] w-14 shrink-0 rounded-xl object-cover" style={{ backgroundColor: thumb.color }} />
                          ) : null}
                          <span className="min-w-0 flex-1">
                            <span className="block text-[11px] text-subtle">Step {i + 1}</span>
                            <span className="block truncate text-[15px] font-medium">{c.title}</span>
                          </span>
                          <span className="shrink-0 text-xs text-subtle">{c.weeks} wk</span>
                          <ArrowRight className="size-4 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                        </Link>
                      </li>
                    );
                  })}
                </ol>

                <ul className="mt-6 space-y-2" aria-label="Jobs you can aim for">
                  {p.jobs.map((j) => (
                    <li key={j.title} className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2 text-muted">
                        <Briefcase className="size-3.5 shrink-0 text-subtle" aria-hidden="true" />
                        <span className="truncate">{j.title}</span>
                      </span>
                      <span className="shrink-0 font-medium tabular-nums">{j.pay}/mo</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-8">
                  <Button to={isAuthed ? (p.track ? `/tracks/${p.track}` : "/aspirants") : p.href} size="lg" rightIcon={ArrowRight} className="w-full sm:w-auto">
                    {isAuthed ? "See this path" : p.cta}
                  </Button>
                  <p className="mt-3 text-xs text-subtle">Pay shown is typical starting pay, not a promise.</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
