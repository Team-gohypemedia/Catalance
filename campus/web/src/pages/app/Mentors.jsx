import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, GraduationCap, Search, Star } from "lucide-react";
import { api, qs } from "@/lib/api/client";
import { cn, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Select, Skeleton } from "@/components/ui/primitives";
import { Avatar, Switch } from "@/components/ui/overlays";
import { EmptyState, ErrorState, PageHeader } from "@/components/ui/campus";
import { PriceTag } from "@/components/community/PriceTag";
import { EXPERTISE_CHIPS, formatSlot, langLabel } from "@/components/community/constants";

const LANGS = ["en", "hinglish", "hi", "ta", "te", "bn", "mr"];

export default function Mentors() {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [expertise, setExpertise] = useState("");
  const [language, setLanguage] = useState("");
  const [free, setFree] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const filters = { q, expertise, language, free };
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["mentors", filters],
    queryFn: () => api.get(`/api/mentors${qs(filters)}`),
    placeholderData: (prev) => prev,
  });

  const clear = () => {
    setSearch("");
    setExpertise("");
    setLanguage("");
    setFree(false);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Mentors"
        title={
          <>
            Learn from people who do this <em className="accent">for a living</em>
          </>
        }
        description="Every mentor is a working freelancer. Book a 1:1 to review your portfolio, price a gig or get unstuck. Many sessions are free."
      />

      {/* Filters */}
      <div className="flex flex-col gap-2.5 md:flex-row md:items-center">
        <div className="flex-1">
          <label htmlFor="mentor-search" className="sr-only">
            Search mentors
          </label>
          <Input id="mentor-search" leftIcon={Search} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, skill or company" />
        </div>
        <div className="flex items-center gap-4">
          <label htmlFor="mentor-lang" className="sr-only">
            Language
          </label>
          <Select id="mentor-lang" value={language} onChange={(e) => setLanguage(e.target.value)} className="min-w-0 flex-1 md:w-44">
            <option value="">Any language</option>
            {LANGS.map((l) => (
              <option key={l} value={l}>
                {langLabel(l)}
              </option>
            ))}
          </Select>
          <label className="flex shrink-0 cursor-pointer items-center gap-2.5 text-sm text-muted">
            <Switch checked={free} onCheckedChange={setFree} aria-label="Free sessions only" />
            Free only
          </label>
        </div>
      </div>
      <div className="scrollbar-none -mx-1 mt-4 flex gap-1.5 overflow-x-auto px-1 pb-1">
        <Chip active={!expertise} onClick={() => setExpertise("")}>
          All
        </Chip>
        {EXPERTISE_CHIPS.map((e) => (
          <Chip key={e} active={expertise === e} onClick={() => setExpertise(expertise === e ? "" : e)}>
            {e}
          </Chip>
        ))}
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : !data?.length ? (
          <EmptyState
            icon={GraduationCap}
            title="No mentors match these filters"
            description="Try another skill or language, or ask your doubt in the community. Mentors answer there too."
            action={
              <Button variant="outline" onClick={clear}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <p className="mb-4 text-sm text-muted">{data.length} mentors available</p>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {data.map((m, i) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: Math.min(i, 8) * 0.03 }}>
                  <MentorCard mentor={m} />
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Chip({ active, children, ...props }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "shrink-0 cursor-pointer rounded-full border px-3.5 py-1.5 text-sm whitespace-nowrap transition-colors",
        active ? "border-primary bg-primary text-primary-fg" : "border-line bg-surface text-muted hover:border-line-strong hover:text-fg",
      )}
      {...props}
    >
      {children}
    </button>
  );
}


function MentorCard({ mentor }) {
  const p = mentor.mentorProfile || {};
  return (
    <Link
      to={`/app/mentors/${mentor.id}`}
      className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-6 transition-colors duration-200 hover:border-line-strong"
    >
      <div className="flex items-start justify-between gap-3">
        <Avatar name={mentor.name} src={mentor.avatarUrl} size="lg" />
        <PriceTag price={p.priceINR} />
      </div>
      <h3 className="mt-4 text-base font-medium tracking-tight text-fg">{mentor.name}</h3>
      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">{p.headline || mentor.headline}</p>
      <p className="mt-2 text-xs text-subtle">
        {p.company}
        {p.yearsExperience ? ` · ${p.yearsExperience} yrs freelancing` : ""}
      </p>
      {(p.expertise || []).length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {p.expertise.slice(0, 3).map((e) => (
            <span key={e} className="rounded-full border border-line px-2.5 py-0.5 text-xs text-muted">
              {e}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto pt-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <Star className="size-3.5 fill-warning text-warning" />
            <span className="font-medium text-fg">{Number(p.rating || 0).toFixed(1)}</span>
            <span className="text-subtle">({formatNumber(p.reviewsCount || 0)})</span>
          </span>
          <span className="text-line-strong">·</span>
          <span>{formatNumber(p.sessionsCount || 0)} sessions</span>
        </div>
        <p className="mt-1.5 truncate text-xs text-subtle">Speaks {(p.languages || []).map(langLabel).join(", ")}</p>
        <div className="mt-3 flex items-center justify-between gap-2 text-xs">
          <span className="min-w-0 truncate text-subtle">
            {mentor.nextAvailable ? (
              <>
                Next free slot <span className="text-fg">{formatSlot(mentor.nextAvailable.date, mentor.nextAvailable.time)}</span>
              </>
            ) : (
              "See availability"
            )}
          </span>
          <ArrowRight className="size-4 shrink-0 text-subtle transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
        </div>
      </div>
    </Link>
  );
}
