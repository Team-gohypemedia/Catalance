import { useEffect, useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BadgeCheck, GraduationCap, Search, Star, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/primitives";
import { useAuth } from "@/context/AuthContext";
import { cn, formatNumber } from "@/lib/utils";
import { usePlatformConfig } from "@/lib/platform";
import { NoGuarantee } from "../NoGuarantee";
import { usePublicStats } from "../hooks";
import { Img } from "../Img";
import { MENTOR_PHOTOS, photoSrc } from "../photos";

const EASE = [0.22, 1, 0.36, 1];

export const POPULAR_SEARCHES = [
  { label: "Tally & GST", q: "tally" },
  { label: "Excel", q: "excel" },
  { label: "Digital Marketing", q: "digital marketing" },
  { label: "Video Editing", q: "video editing" },
];

/* Keyword → track slug, so a guest search lands on the right track page. */
const KEYWORDS = [
  [/tally|gst|account|book ?keep|ca\b/, "accounting-tally-gst"],
  [/excel|sheet|mis|data entry/, "excel-for-aspirants"],
  [/translat|hindi|subtit/, "translation-hindi-english"],
  [/market|seo|ads|social|instagram/, "digital-marketing"],
  [/video|reel|edit|premiere/, "video-editing"],
  [/writ|content|copy|blog/, "content-writing"],
  [/graphic|canva|logo|brand|illustrat/, "graphic-design"],
  [/ui|ux|figma|product design/, "ui-ux-design"],
  [/data|sql|power ?bi|analy/, "data-analytics"],
  [/ai\b|automat|python|chatgpt/, "ai-automation"],
  [/app|flutter|android|mobile/, "app-development"],
  [/web|html|css|react|javascript|code|coding/, "web-development"],
];
export function searchHref(raw, isAuthed) {
  const q = raw.trim();
  if (isAuthed) return q ? `/app/catalog?q=${encodeURIComponent(q)}` : "/app/catalog";
  if (!q) return "/tracks";
  const hit = KEYWORDS.find(([re]) => re.test(q.toLowerCase()));
  return hit ? `/tracks/${hit[1]}` : "/tracks";
}

/** Hero title from settings: the last sentence gets the Catalance italic accent ("… <em>Get verified.</em>"). */
function HeroTitle({ title }) {
  const parts = title.trim().match(/[^.!?]+[.!?]*/g) || [title];
  const last = parts.length > 1 ? parts.pop().trim() : null;
  return (
    <>
      <span className="block">{parts.join("").trim()}</span>
      {last && <em className="accent block pr-2 pb-[0.08em] text-[1.1em]">{last}</em>}
    </>
  );
}

/** True at sm and up (used for a shorter search placeholder on phones). */
function useWide() {
  const get = () => typeof window === "undefined" || window.matchMedia("(min-width: 640px)").matches;
  const [wide, setWide] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const on = () => setWide(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return wide;
}

export function HeroSearch({ className, size = "lg" }) {
  const { isAuthed } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const id = useId();
  const wide = useWide();
  const go = (value) => navigate(searchHref(value, isAuthed));
  return (
    <div className={className}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go(q);
        }}
        className={cn(
          "flex items-center gap-2 rounded-2xl border border-line-strong bg-surface p-1.5 pl-4 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-18px_rgb(0_0_0/0.25)] transition-colors focus-within:border-primary focus-within:ring-4 focus-within:ring-ring sm:pl-5",
          size === "lg" ? "h-14 sm:h-16" : "h-12",
        )}
      >
        <Search className="size-5 shrink-0 text-subtle" strokeWidth={1.75} aria-hidden="true" />
        <label htmlFor={id} className="sr-only">
          What do you want to learn?
        </label>
        <input
          id={id}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={wide ? "What do you want to learn? e.g. Tally, Excel, Spoken English…" : "Try Tally, Excel, Spoken English…"}
          className="h-full min-w-0 flex-1 truncate bg-transparent text-[15px] text-fg placeholder:text-subtle focus:outline-none sm:text-[15px] [&::-webkit-search-cancel-button]:hidden"
        />
        <button
          type="submit"
          className="flex h-full shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-fg transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:px-5 sm:text-[15px]"
        >
          <Search className="size-4 sm:hidden" aria-hidden="true" />
          <span className="max-sm:sr-only">Search</span>
        </button>
      </form>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-[13px] text-subtle">Popular:</span>
        {POPULAR_SEARCHES.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => go(s.q)}
            className="cursor-pointer rounded-full border border-line bg-surface/70 px-3 py-1 text-[13px] text-muted transition-colors hover:border-line-strong hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function GlassCard({ icon: Icon, title, sub, tone = "primary", className }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-white/60 bg-surface/80 py-2.5 pr-4 pl-2.5 shadow-[0_12px_32px_-12px_rgb(0_0_0/0.25)] backdrop-blur-md dark:border-line dark:bg-surface/85",
        className,
      )}
    >
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", tone === "success" ? "bg-success-soft text-success" : "bg-primary-soft text-primary")}>
        <Icon className="size-4.5" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] leading-tight font-medium whitespace-nowrap text-fg">{title}</span>
        <span className="mt-0.5 block text-[11px] leading-tight whitespace-nowrap text-muted">{sub}</span>
      </span>
    </div>
  );
}

const FACES = ["m_3", "m_5", "m_4", "m_8"];

export function Hero() {
  const { data: s, isLoading } = usePublicStats();
  const { isAuthed } = useAuth();
  const { content } = usePlatformConfig();
  const reduce = useReducedMotion();
  const fade = (d) => ({ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay: d, ease: EASE } });

  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute -top-40 right-[-10%] h-[720px] w-[900px] bg-[radial-gradient(closest-side,var(--primary-soft),transparent)] opacity-90"
        aria-hidden="true"
      />
      <div className="container-campus relative grid items-center gap-12 pt-8 pb-16 sm:pt-12 lg:grid-cols-[minmax(0,1.22fr)_minmax(0,1fr)] lg:gap-12 lg:pt-10 lg:pb-20">
        {/* Left */}
        <div className="min-w-0">
          <motion.div {...fade(0)}>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-[13px] shadow-sm">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-50 motion-reduce:hidden" />
                <span className="relative inline-flex size-2 rounded-full bg-success" />
              </span>
              {isLoading ? <Skeleton className="h-4 w-12" /> : <span className="font-semibold tabular-nums">{formatNumber(s?.students)}+</span>}
              <span className="text-muted">learners</span>
              <span className="h-3.5 w-px bg-line-strong" aria-hidden="true" />
              <span lang="hi-Latn" className="text-muted">
                Apni bhasha mein seekho
              </span>
            </span>
          </motion.div>

          <motion.h1 {...fade(0.05)} className="mt-6 text-[2.6rem] leading-[1.05] font-medium tracking-tight sm:text-6xl lg:text-[4.1rem]">
            <HeroTitle title={content.hero.title} />
          </motion.h1>

          <motion.p {...fade(0.1)} className="mt-5 max-w-2xl text-base text-muted sm:text-lg">
            {content.hero.subtitle}
          </motion.p>

          <motion.div {...fade(0.15)} className="mt-8 max-w-[640px]">
            <HeroSearch />
          </motion.div>

          <motion.div {...fade(0.2)} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            {isAuthed ? (
              <>
                <Button to="/app" size="xl" rightIcon={ArrowRight}>
                  Continue learning
                </Button>
                <Button to="/app/catalog" size="xl" variant="brandOutline">
                  Explore Courses
                </Button>
              </>
            ) : (
              <>
                <Button to="/tracks" size="xl" rightIcon={ArrowRight}>
                  Explore Courses
                </Button>
                <Button to="/how-it-works" size="xl" variant="brandOutline">
                  How It Works
                </Button>
              </>
            )}
          </motion.div>

          <motion.div {...fade(0.22)}>
            <NoGuarantee className="mt-4 max-w-xl" />
          </motion.div>

          <motion.div {...fade(0.25)} className="mt-7 flex items-center gap-3">
            <span className="flex -space-x-2" aria-hidden="true">
              {FACES.map((id) => (
                <img
                  key={id}
                  src={photoSrc(MENTOR_PHOTOS[id], 80, { height: 80 })}
                  alt=""
                  width={32}
                  height={32}
                  className="size-8 rounded-full object-cover ring-2 ring-bg"
                  style={{ backgroundColor: MENTOR_PHOTOS[id].color }}
                />
              ))}
            </span>
            <span className="text-sm text-muted">
              <span className="inline-flex items-center gap-1 font-medium text-fg">
                4.8 <Star className="size-3.5 fill-warning text-warning" aria-label="stars" />
              </span>{" "}
              from 12,400+ learner reviews
            </span>
          </motion.div>
        </div>

        {/* Right: editorial photo composition */}
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
          className="relative mx-auto w-full max-w-[500px] lg:mr-0"
        >
          <div className="relative ml-auto w-[82%]">
            <Img
              photo="heroStudent"
              ratio="4/5"
              priority
              sizes="(min-width: 1024px) 460px, 80vw"
              widths={[480, 800, 1200]}
              position="58% 50%"
              credit="tr"
              icon={GraduationCap}
              className="rounded-[28px] border-0 shadow-[0_30px_60px_-30px_rgb(0_0_0/0.35)]"
            />
          </div>
          <div className="absolute bottom-[-4%] left-0 w-[44%]">
            <Img
              photo="mobileLearner"
              ratio="1/1"
              priority
              sizes="240px"
              widths={[480, 800]}
              position="50% 20%"
              credit="bl"
              icon={GraduationCap}
              className="rounded-3xl border-[6px] border-bg shadow-[0_20px_40px_-20px_rgb(0_0_0/0.35)]"
            />
          </div>

          <GlassCard icon={Video} title="Live doubt class · 6 PM" sub="Tally & GST · in Hinglish" className="absolute top-[9%] left-[-2%] sm:left-[-6%]" />
          <GlassCard
            icon={BadgeCheck}
            tone="success"
            title="Skill verified"
            sub="Tally & GST · Pooja K."
            className="absolute right-[-2%] bottom-[14%] sm:right-[-4%]"
          />
        </motion.div>
      </div>
    </section>
  );
}
