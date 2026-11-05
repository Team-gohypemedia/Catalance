import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Compass, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/campus";
import { cn } from "@/lib/utils";
import { useTracks } from "@/components/marketing/hooks";
import { InkCta, PageHero, Reveal, TrackCard, staggerChild, staggerParent } from "@/components/marketing/primitives";
import { BridgeTrackCard } from "@/components/aspirants/parts";
import { isBridge } from "@/components/aspirants/data";

const matches = (t, tab) => tab === "ALL" || (tab === "ASPIRANTS" ? isBridge(t) : t.category === tab);

const TABS = [
  ["ALL", "All tracks"],
  ["TECH", "Tech"],
  ["NON_TECH", "Non-tech"],
  ["ASPIRANTS", "For aspirants"],
];

export default function Tracks() {
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get("audience") === "aspirants" ? "ASPIRANTS" : "ALL");
  const { data, isLoading } = useTracks();
  const tracks = (data || []).filter((t) => matches(t, tab));
  const counts = Object.fromEntries(TABS.map(([k]) => [k, (data || []).filter((t) => matches(t, k)).length]));

  return (
    <>
      <PageHero
        eyebrow="Tracks"
        title={
          <>
            Pick a path. Build <em className="accent">skills you can prove</em>
          </>
        }
        description="Each track is a path of short, practical courses that end in an assessment. Taught by people who do this work."
        actions={
          <Button to="/skills" variant="brandOutline" rightIcon={ArrowRight}>
            Browse by skill
          </Button>
        }
      />

      <section className="container-campus pb-20 sm:pb-28">
        <div className="flex justify-center">
          <div role="tablist" aria-label="Filter tracks" className="inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1 scrollbar-none">
            {TABS.map(([k, label]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={cn(
                  "shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  tab === k ? "bg-primary text-primary-fg" : "text-muted hover:text-fg",
                )}
              >
                {label}
                {counts[k] ? <span className={cn("ml-1.5 tabular-nums", tab === k ? "opacity-80" : "text-subtle")}>{counts[k]}</span> : null}
              </button>
            ))}
          </div>
        </div>

        {tab === "ASPIRANTS" && (
          <Reveal className="mx-auto mt-8 flex max-w-4xl flex-col gap-5 rounded-2xl border border-line bg-surface p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="flex items-start gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-primary">
                <Landmark className="size-4.5" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-lg font-medium tracking-tight">Preparing for a govt exam? Your prep already counts.</p>
                <p className="mt-1 text-sm text-muted">Bridge tracks start from Quant, DI, English, Hindi and Banking Awareness. 45 minutes a day, alongside your prep.</p>
              </div>
            </div>
            <Button to="/aspirants" variant="brandOutline" rightIcon={ArrowRight} className="shrink-0">
              How it works
            </Button>
          </Reveal>
        )}

        <div className="mt-10">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-56 rounded-2xl" />
              ))}
            </div>
          ) : tracks.length === 0 ? (
            <EmptyState
              icon={Compass}
              title="No tracks here yet"
              description="New tracks open as courses launch. Check the other tab."
              action={
                <Button onClick={() => setTab("ALL")} variant="outline">
                  Show all tracks
                </Button>
              }
            />
          ) : (
            <motion.div key={tab} variants={staggerParent} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tracks.map((t) => (
                <motion.div key={t.slug} variants={staggerChild}>
                  {isBridge(t) ? <BridgeTrackCard track={t} /> : <TrackCard track={t} />}
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      <section className="border-y border-line bg-surface-2/40 py-20 sm:py-28">
        <div className="container-campus">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Not sure yet?</p>
            <h2 className="mt-3 text-3xl leading-[1.1] font-medium tracking-tight text-balance sm:text-5xl">
              Can't decide? <em className="accent">Don't overthink it.</em>
            </h2>
            <p className="mt-4 text-base text-balance text-muted sm:text-lg">Tell us your goal when you sign up and we will suggest a course. You can switch any time.</p>
          </Reveal>
          <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
            {[
              ["Clear prices", "Every course shows its fee, GST and duration before you enrol."],
              ["Switch any time", "Your progress and verified skills stay with you."],
              ["Mix tech and non-tech", "Many learners pair design with writing, or data with marketing."],
            ].map(([t, d], i) => (
              <Reveal key={t} delay={i * 0.05} className="rounded-2xl border border-line bg-surface p-6">
                <p className="font-medium tracking-tight">{t}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{d}</p>
              </Reveal>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <Button to="/signup" size="lg" rightIcon={ArrowRight}>
              Help me choose
            </Button>
          </div>
        </div>
      </section>

      <InkCta
        title={
          <>
            Start with one skill. <em className="accent">Prove it.</em>
          </>
        }
        description="Short courses, a real assessment and a skill badge anyone can check."
        primary={{ to: "/app/catalog", label: "Explore courses" }}
        secondary={{ to: "/skills", label: "See all skills" }}
      />
    </>
  );
}
