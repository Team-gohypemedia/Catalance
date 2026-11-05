import { useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Clock, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/primitives";
import { EmptyState, ErrorState } from "@/components/ui/campus";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api/client";
import { cn, formatCompact, formatDuration, formatINR, LANGUAGES } from "@/lib/utils";
import { Img } from "../Img";
import { MENTOR_PHOTOS, TRACK_THUMBS, photoSrc } from "../photos";
import { Reveal } from "../primitives";
import { CarouselArrows, CarouselTrack, useCarousel } from "./Carousel";

const TABS = [
  { id: "all", label: "All" },
  { id: "office", label: "Office & Accounts", slugs: ["accounting-tally-gst", "excel-for-aspirants", "translation-hindi-english", "data-analytics"] },
  { id: "creative", label: "Creative", slugs: ["digital-marketing", "content-writing", "graphic-design", "video-editing"] },
  { id: "tech", label: "Tech", slugs: ["web-development", "app-development", "ui-ux-design", "data-analytics", "ai-automation"] },
  { id: "govt", label: "Govt exam prep", slugs: ["excel-for-aspirants", "translation-hindi-english", "accounting-tally-gst"] },
];

const LANG_LABEL = Object.fromEntries(LANGUAGES.map((l) => [l.code, l.label]));
const langChip = (langs = []) => {
  const first = langs.includes("hi") ? "hi" : langs[0];
  const label = first === "hi" ? "Hindi" : first === "hinglish" ? "Hinglish" : LANG_LABEL[first] || "English";
  return langs.length > 1 ? `${label} +${langs.length - 1}` : label;
};

function CourseCard({ course, href }) {
  const thumb = TRACK_THUMBS[course.track?.slug];
  const mentorPhoto = MENTOR_PHOTOS[course.mentorId];
  const free = course.isFree || !course.priceINR;
  return (
    <Link
      to={href}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_18px_40px_-24px_rgb(0_0_0/0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:hover:translate-y-0"
    >
      <Img
        photo={thumb}
        alt=""
        ratio="16/10"
        sizes="(min-width: 1024px) 290px, (min-width: 640px) 45vw, 80vw"
        widths={[480, 800]}
        credit={false}
        icon={BookOpen}
        className="rounded-none border-0"
        imgClassName="transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
      >
        <span className="absolute top-3 left-3 rounded-full bg-surface/95 px-2.5 py-1 text-[11px] font-medium text-fg shadow-sm backdrop-blur">{langChip(course.languages)}</span>
      </Img>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-[11px] font-medium tracking-wide text-subtle uppercase">{course.track?.title}</p>
        <h3 className="mt-1.5 line-clamp-2 min-h-[2.75rem] text-[17px] leading-snug font-medium tracking-tight text-fg">{course.title}</h3>
        {course.mentor && (
          <p className="mt-3 flex items-center gap-2 text-[13px] text-muted">
            {mentorPhoto ? (
              <img src={photoSrc(mentorPhoto, 64, { height: 64 })} alt="" width={22} height={22} loading="lazy" className="size-[22px] rounded-full object-cover" style={{ backgroundColor: mentorPhoto.color }} />
            ) : null}
            <span className="truncate">{course.mentor.name}</span>
          </p>
        )}
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
          <span className="inline-flex items-center gap-1">
            <Star className="size-3.5 fill-warning text-warning" aria-hidden="true" />
            <span className="font-medium text-fg">{Number(course.rating || 4.7).toFixed(1)}</span>
            <span>({formatCompact(course.ratingsCount || 0)})</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5" aria-hidden="true" />
            {formatCompact(course.studentsCount || 0)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden="true" />
            {formatDuration(course.durationMinutes)}
          </span>
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-4">
          <span className="text-[17px] font-medium tracking-tight">{free ? "Free" : formatINR(course.priceINR)}</span>
          {free ? (
            <span className="rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-medium text-success">Start today</span>
          ) : (
            <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-muted">+ GST</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

const ITEM_W = "w-[80%] shrink-0 snap-start sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-3.75rem)/4)]";

export function PopularCourses() {
  const { isAuthed } = useAuth();
  const [tab, setTab] = useState("all");
  const uid = useId();
  const tabRefs = useRef({});
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["public", "courses"],
    queryFn: () => api.get("/api/courses"),
    retry: false,
    staleTime: 5 * 60_000,
  });

  const list = useMemo(() => {
    const all = Array.isArray(data) ? data : [];
    const t = TABS.find((x) => x.id === tab);
    if (t?.slugs) return all.filter((c) => t.slugs.includes(c.track?.slug)).slice(0, 12);
    // "All": lead with skills anyone can start (office, creative, aspirant), one course per track, tech after
    const order = ["accounting-tally-gst", "excel-for-aspirants", "digital-marketing", "content-writing", "translation-hindi-english", "video-editing", "graphic-design", "data-analytics", "web-development", "ui-ux-design", "app-development", "ai-automation"];
    const rank = (c) => {
      const i = order.indexOf(c.track?.slug);
      return i === -1 ? order.length : i;
    };
    const seen = new Set();
    const firstPerTrack = [...all].sort((a, b) => rank(a) - rank(b)).filter((c) => !seen.has(c.track?.slug) && seen.add(c.track?.slug));
    return firstPerTrack.slice(0, 12);
  }, [data, tab]);

  const carousel = useCarousel([list.length, tab]);

  const choose = (id) => {
    setTab(id);
    carousel.reset();
  };
  const onKey = (e) => {
    const i = TABS.findIndex((t) => t.id === tab);
    let n = null;
    if (e.key === "ArrowRight") n = (i + 1) % TABS.length;
    if (e.key === "ArrowLeft") n = (i - 1 + TABS.length) % TABS.length;
    if (e.key === "Home") n = 0;
    if (e.key === "End") n = TABS.length - 1;
    if (n === null) return;
    e.preventDefault();
    choose(TABS[n].id);
    tabRefs.current[TABS[n].id]?.focus();
  };

  return (
    <section id="courses" className="py-20 sm:py-28">
      <div className="container-campus">
        <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow mb-4">Popular courses</p>
            <h2 className="text-3xl leading-[1.1] font-medium tracking-tight text-balance sm:text-5xl">Start with what people are learning now</h2>
          </div>
          <Button to={isAuthed ? "/app/catalog" : "/tracks"} variant="link" rightIcon={ArrowRight} className="shrink-0 self-start px-0 sm:self-auto">
            View all courses
          </Button>
        </Reveal>

        <div className="mt-10 flex items-center justify-between gap-4">
          <div className="-mx-4 min-w-0 flex-1 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
            <div role="tablist" aria-label="Course categories" onKeyDown={onKey} className="flex w-max gap-2">
              {TABS.map((t) => {
                const on = t.id === tab;
                return (
                  <button
                    key={t.id}
                    ref={(el) => (tabRefs.current[t.id] = el)}
                    id={`${uid}-tab-${t.id}`}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    aria-controls={`${uid}-panel`}
                    tabIndex={on ? 0 : -1}
                    onClick={() => choose(t.id)}
                    className={cn(
                      "relative shrink-0 cursor-pointer rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
                      on ? "border-fg text-bg" : "border-line bg-surface text-muted hover:border-line-strong hover:text-fg",
                    )}
                  >
                    {on && <motion.span layoutId="course-tab" className="absolute inset-0 rounded-full bg-fg" transition={{ type: "spring", bounce: 0.15, duration: 0.4 }} />}
                    <span className="relative">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <CarouselArrows carousel={carousel} label="courses" />
        </div>

        <div id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-tab-${tab}`} className="mt-6">
          {error ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={cn(i > 0 && "hidden sm:block", i > 1 && "sm:hidden lg:block")}>
                  <CardSkeleton />
                </div>
              ))}
            </div>
          ) : list.length === 0 ? (
            <EmptyState icon={BookOpen} title="New courses coming soon" description="Browse all tracks while we add more here." action={<Button to="/tracks">See all tracks</Button>} />
          ) : (
            <CarouselTrack carousel={carousel} label="Courses">
              {list.map((c) => (
                <li key={c.id} className={ITEM_W}>
                  <CourseCard course={c} href={isAuthed ? `/app/courses/${c.id}` : `/tracks/${c.track?.slug}`} />
                </li>
              ))}
            </CarouselTrack>
          )}
        </div>
      </div>
    </section>
  );
}
