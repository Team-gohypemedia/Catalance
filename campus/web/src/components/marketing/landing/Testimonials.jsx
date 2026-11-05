import { Link } from "react-router-dom";
import { ArrowUpRight, BadgeCheck, Quote, UserRound } from "lucide-react";
import { Reveal } from "../primitives";
import { Img } from "../Img";
import { STORIES } from "./content";
import { CarouselArrows, CarouselTrack, useCarousel } from "./Carousel";

const FEATURED = STORIES[0];
const REST = STORIES.slice(1);

function Featured({ t }) {
  return (
    <figure className="grid overflow-hidden rounded-3xl border border-line bg-bg md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <Img
        photo={t.image}
        alt={`Photo representing ${t.name}`}
        ratio={null}
        sizes="(min-width: 1024px) 520px, 100vw"
        position={t.photoPos || "50% 30%"}
        credit="br"
        icon={UserRound}
        className="aspect-[4/3] rounded-none border-0 md:aspect-auto md:min-h-[400px]"
      >
        <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-surface/95 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur">
          <BadgeCheck className="size-3.5 text-success" aria-hidden="true" />
          {t.tag}
        </span>
      </Img>
      <div className="flex flex-col p-6 sm:p-10">
        <Quote className="size-8 text-primary" strokeWidth={1.5} aria-hidden="true" />
        <blockquote lang="hi-Latn" className="mt-5 text-2xl leading-snug font-medium tracking-tight text-balance sm:text-[32px] sm:leading-[1.25]">
          {t.quote}
        </blockquote>
        <figcaption className="mt-6">
          <p className="font-medium">{t.name}</p>
          <p className="text-sm text-muted">{t.meta}</p>
        </figcaption>
        <dl className="mt-auto grid grid-cols-3 gap-4 border-t border-line pt-6">
          {[
            ["Before", "B.Com student"],
            ["Course", "8 weeks"],
            ["Now", t.stat],
          ].map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="text-xs text-subtle">{k}</dt>
              <dd className="mt-1 text-[15px] leading-snug font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </figure>
  );
}

function SmallStory({ t }) {
  return (
    <figure className="flex h-full flex-col rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-line-strong">
      <div className="flex items-center gap-3">
        <Img photo={t.image} alt="" ratio="1/1" sizes="56px" widths={[480]} position={t.photoPos || "50% 30%"} credit={false} icon={UserRound} className="size-14 shrink-0 rounded-full border-0" />
        <figcaption className="min-w-0">
          <p className="truncate text-[15px] font-medium">{t.name}</p>
          <p className="truncate text-xs text-muted">{t.meta}</p>
        </figcaption>
      </div>
      <blockquote className="mt-4 text-[17px] leading-snug tracking-tight text-fg">“{t.quote}”</blockquote>
      <p className="mt-auto pt-5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-xs font-medium text-success">
          <BadgeCheck className="size-3.5" aria-hidden="true" />
          {t.stat}
        </span>
      </p>
    </figure>
  );
}

export function Testimonials() {
  const carousel = useCarousel([]);
  return (
    <section id="stories" className="border-y border-line bg-surface py-20 sm:py-28">
      <div className="container-campus">
        <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow mb-4">Learner stories</p>
            <h2 className="text-3xl leading-[1.1] font-medium tracking-tight text-balance sm:text-5xl">People like you, building real skills</h2>
          </div>
          <Link to="/tracks" className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline">
            Explore Courses <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </Reveal>

        <Reveal delay={0.05} className="mt-10">
          <Featured t={FEATURED} />
        </Reveal>

        <div className="mt-10 flex items-center justify-between gap-4">
          <p className="text-sm text-muted">More stories</p>
          <CarouselArrows carousel={carousel} label="stories" />
        </div>
        <div className="mt-4">
          <CarouselTrack carousel={carousel} label="More learner stories">
            {REST.map((t) => (
              <li key={t.name} className="w-[80%] shrink-0 snap-start sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]">
                <SmallStory t={t} />
              </li>
            ))}
          </CarouselTrack>
        </div>
        <p className="mt-4 text-xs text-subtle">Stories are illustrative of typical learner journeys on Campus.</p>
      </div>
    </section>
  );
}
