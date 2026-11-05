import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Star, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api/client";
import { Img, PhotoCredit } from "../Img";
import { MENTORS } from "../data";
import { MENTOR_PHOTOS } from "../photos";
import { Reveal } from "../primitives";
import { CarouselArrows, CarouselTrack, useCarousel } from "./Carousel";

const MENTOR_IDS = ["u_mentor", "m_2", "m_3", "m_4", "m_5", "m_6", "m_7", "m_8"];

/* Guests: a static list matching the seeded mentors (GET /api/mentors needs login). */
const STATIC = MENTORS.map((m, i) => ({
  id: MENTOR_IDS[i],
  name: MENTOR_PHOTOS[MENTOR_IDS[i]]?.alt || m.name,
  headline: m.role,
  company: m.company,
  skills: [m.skill],
  years: m.years,
}));

function MentorCard({ m, to }) {
  return (
    <div className="group/photo relative">
    <Link to={to} className="group block focus-visible:outline-none">
      <Img
        photo={MENTOR_PHOTOS[m.id]}
        alt={m.name}
        ratio="4/5"
        sizes="(min-width: 1024px) 230px, (min-width: 640px) 30vw, 62vw"
        widths={[480, 800]}
        position="50% 25%"
        credit={false}
        icon={UserRound}
        className="rounded-2xl border-0 transition-shadow group-hover:shadow-[0_20px_40px_-24px_rgb(0_0_0/0.4)] group-focus-visible:ring-2 group-focus-visible:ring-primary"
        imgClassName="transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
      >
        {m.skills?.[0] && <span className="absolute top-3 left-3 rounded-full bg-surface/95 px-2.5 py-1 text-[11px] font-medium text-fg shadow-sm backdrop-blur">{m.skills[0]}</span>}
      </Img>
      <p className="mt-4 text-[17px] font-medium tracking-tight">{m.name}</p>
      <p className="mt-0.5 line-clamp-1 text-sm text-muted">{m.headline}</p>
      <p className="mt-1 flex items-center gap-1.5 text-[13px] text-subtle">
        {m.rating ? (
          <>
            <Star className="size-3.5 fill-warning text-warning" aria-hidden="true" />
            <span className="font-medium text-fg">{Number(m.rating).toFixed(1)}</span>
            <span aria-hidden="true">·</span>
          </>
        ) : null}
        <span className="truncate">{m.company}</span>
      </p>
    </Link>
      {/* Credit sits outside the link (no nested anchors), over the photo's bottom-right corner. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 aspect-[4/5]">
        <PhotoCredit
          photo={MENTOR_PHOTOS[m.id]}
          className="pointer-events-auto absolute right-2 bottom-2 z-20 opacity-0 transition-opacity duration-300 group-hover/photo:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-90"
        />
      </div>
    </div>
  );
}

export function Mentors() {
  const { isAuthed } = useAuth();
  const live = useQuery({ queryKey: ["mentors", "landing"], queryFn: () => api.get("/api/mentors"), enabled: isAuthed, retry: false, staleTime: 5 * 60_000 });

  const list = useMemo(() => {
    const items = Array.isArray(live.data) ? live.data : live.data?.items;
    if (!isAuthed || !items?.length) return STATIC;
    return items
      .filter((u) => MENTOR_PHOTOS[u.id])
      .slice(0, 8)
      .map((u) => ({
        id: u.id,
        name: u.name,
        headline: u.mentorProfile?.headline || u.headline,
        company: u.mentorProfile?.company || "",
        skills: u.mentorProfile?.expertise || u.skills || [],
        rating: u.mentorProfile?.rating,
      }));
  }, [live.data, isAuthed]);

  const carousel = useCarousel([list.length]);

  return (
    <section id="mentors" className="py-20 sm:py-28">
      <div className="container-campus">
        <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow mb-4">Mentors</p>
            <h2 className="text-3xl leading-[1.1] font-medium tracking-tight text-balance sm:text-5xl">Learn from people who do the job</h2>
            <p className="mt-4 text-base text-muted sm:text-lg">Working accountants, designers, editors and developers. Book a 1:1 when you are stuck.</p>
          </div>
          <CarouselArrows carousel={carousel} label="mentors" className="shrink-0" />
        </Reveal>

        <div className="mt-10">
          <CarouselTrack carousel={carousel} label="Mentors">
            {list.map((m) => (
              <li key={m.id} className="w-[62%] shrink-0 snap-start sm:w-[calc((100%-2.5rem)/3)] lg:w-[calc((100%-3.75rem)/4)]">
                <MentorCard m={m} to={isAuthed ? `/app/mentors/${m.id}` : "/signup"} />
              </li>
            ))}
          </CarouselTrack>
        </div>

        <div className="mt-6">
          <Button to={isAuthed ? "/app/mentors" : "/signup"} variant="link" rightIcon={ArrowRight} className="px-0">
            {isAuthed ? "See all mentors" : "Sign up to book a mentor"}
          </Button>
        </div>
      </div>
    </section>
  );
}
