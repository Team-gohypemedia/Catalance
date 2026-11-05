import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Compass, Search, X } from "lucide-react";
import { api, qs } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { EmptyState, ErrorState, PageHeader } from "@/components/ui/campus";
import { Button } from "@/components/ui/button";
import { Select, Skeleton } from "@/components/ui/primitives";
import { CourseCard, CourseCardSkeleton } from "@/components/learning/CourseCard";
import { COURSE_LEVELS, LEVEL_LABELS } from "@/components/learning/catalog-meta";

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center rounded-full border px-3.5 py-1.5 text-sm transition-colors",
        active ? "border-primary/40 bg-primary-soft text-primary" : "border-line bg-surface text-muted hover:border-line-strong hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}

const quietSelect = "h-10 rounded-full border-line pl-4 text-sm text-muted hover:border-line-strong";

// spec §13.1 discovery filters: duration and price bands map to the API's maxDays / minPrice / maxPrice
const DURATIONS = [
  ["10", "Up to 10 days"],
  ["15", "Up to 15 days"],
  ["20", "Up to 20 days"],
];
const PRICES = {
  free: { label: "Free", maxPrice: 0 },
  low: { label: "Under ₹3,000", minPrice: 1, maxPrice: 2999 },
  mid: { label: "₹3,000 to ₹6,000", minPrice: 3000, maxPrice: 6000 },
  high: { label: "Over ₹6,000", minPrice: 6001 },
};

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const get = (k) => params.get(k) || "";
  const q = get("q");
  const category = get("category");
  const skill = get("skill");
  const level = get("level");
  const days = get("days");
  const price = get("price");
  const open = get("open");
  const track = get("track"); // legacy links from older pages
  const sort = get("sort") || "popular";
  const [search, setSearch] = useState(q);
  useEffect(() => setSearch(q), [q]);

  const update = (patch) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    setParams(next, { replace: true });
  };

  // debounce typing into the URL
  useEffect(() => {
    if (search === q) return;
    const t = setTimeout(() => update({ q: search.trim() }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const band = PRICES[price] || {};
  const filters = { q, category, skill, level, maxDays: days, minPrice: band.minPrice, maxPrice: band.maxPrice, open, track, sort: sort === "popular" ? "" : sort };
  const { data: courses, isLoading, error, refetch } = useQuery({ queryKey: ["courses", filters], queryFn: () => api.get(`/api/courses${qs(filters)}`) });

  // facet options: categories and skills that have listed courses
  const all = useQuery({ queryKey: ["courses", {}], queryFn: () => api.get("/api/courses"), staleTime: 300_000 });
  const facets = useMemo(() => {
    const cats = new Map();
    for (const c of all.data || []) {
      if (!c.skill?.category) continue;
      const key = c.skill.category.slug;
      if (!cats.has(key)) cats.set(key, { ...c.skill.category, skills: new Map() });
      cats.get(key).skills.set(c.skill.slug, c.skill);
    }
    return [...cats.values()].map((c) => ({ ...c, skills: [...c.skills.values()].sort((a, b) => a.name.localeCompare(b.name)) }));
  }, [all.data]);
  const skillOptions = category ? facets.find((c) => c.slug === category)?.skills || [] : facets.flatMap((c) => c.skills);
  const activeCategory = facets.find((c) => c.slug === category);
  const activeSkill = skillOptions.find((s) => s.slug === skill);

  const hasFilters = Boolean(q || category || skill || level || days || price || open || track);
  const clearAll = () => {
    setSearch("");
    setParams({}, { replace: true });
  };

  return (
    <div>
      <PageHeader eyebrow="Explore" title="Find your course" description="Practical courses by skill and level. Pass the assessment to get verified." />

      {/* Search */}
      <div className="relative">
        <label htmlFor="catalog-search" className="sr-only">Search courses</label>
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
        <input
          id="catalog-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search UI/UX, Reels, React, SEO, Excel"
          className="h-12 w-full rounded-full border border-line bg-surface pr-11 pl-11 text-[15px] text-fg shadow-sm transition-colors placeholder:text-subtle hover:border-line-strong focus:border-line-strong focus:ring-4 focus:ring-[var(--ring)] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {search && (
          <button type="button" onClick={() => setSearch("")} className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-full p-1.5 text-subtle hover:bg-surface-2 hover:text-fg" aria-label="Clear search">
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Category chips */}
      <div className="mt-5">
        {all.isLoading ? (
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 w-32 shrink-0 rounded-full" />)}
          </div>
        ) : (
          <div className="scrollbar-none -mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" role="group" aria-label="Category">
            <Chip active={!category} onClick={() => update({ category: "", skill: "" })}>All</Chip>
            {facets.map((c) => (
              <Chip key={c.slug} active={category === c.slug} onClick={() => update({ category: category === c.slug ? "" : c.slug, skill: "" })}>
                {c.name}
              </Chip>
            ))}
            {track && (
              <Chip active onClick={() => update({ track: "" })}>
                Track: {track.replace(/-/g, " ")} <X className="ml-1.5 size-3.5" aria-hidden="true" />
              </Chip>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <label className="sr-only" htmlFor="f-skill">Skill</label>
        <Select id="f-skill" value={skill} onChange={(e) => update({ skill: e.target.value })} className={cn(quietSelect, skill && "text-fg")}>
          <option value="">All skills</option>
          {skillOptions.map((s) => (
            <option key={s.slug} value={s.slug}>{s.name}</option>
          ))}
        </Select>
        <label className="sr-only" htmlFor="f-level">Level</label>
        <Select id="f-level" value={level} onChange={(e) => update({ level: e.target.value })} className={cn(quietSelect, level && "text-fg")}>
          <option value="">All levels</option>
          {COURSE_LEVELS.map((l) => (
            <option key={l} value={l}>{LEVEL_LABELS[l]}</option>
          ))}
        </Select>
        <label className="sr-only" htmlFor="f-days">Duration</label>
        <Select id="f-days" value={days} onChange={(e) => update({ days: e.target.value })} className={cn(quietSelect, days && "text-fg")}>
          <option value="">Any duration</option>
          {DURATIONS.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </Select>
        <label className="sr-only" htmlFor="f-price">Price</label>
        <Select id="f-price" value={price} onChange={(e) => update({ price: e.target.value })} className={cn(quietSelect, price && "text-fg")}>
          <option value="">Any price</option>
          {Object.entries(PRICES).map(([v, p]) => (
            <option key={v} value={v}>{p.label}</option>
          ))}
        </Select>
        <label className="sr-only" htmlFor="f-open">Enrolment</label>
        <Select id="f-open" value={open} onChange={(e) => update({ open: e.target.value })} className={cn(quietSelect, open && "text-fg")}>
          <option value="">Open or closed</option>
          <option value="1">Enrolment open</option>
          <option value="0">Enrolment closed</option>
        </Select>
        <label className="sr-only" htmlFor="f-sort">Sort by</label>
        <Select id="f-sort" value={sort} onChange={(e) => update({ sort: e.target.value === "popular" ? "" : e.target.value })} className={quietSelect}>
          <option value="popular">Most popular</option>
          <option value="price">Lowest price</option>
          <option value="rating">Highest rated</option>
          <option value="new">Newest</option>
        </Select>
      </div>

      {/* Results */}
      <div className="mt-10 mb-5 flex min-h-8 flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted" aria-live="polite">
          {isLoading ? "Finding courses" : `${courses?.length ?? 0} course${courses?.length === 1 ? "" : "s"}`}
          {activeSkill ? <> in <span className="text-fg">{activeSkill.name}</span></> : activeCategory ? <> in <span className="text-fg">{activeCategory.name}</span></> : null}
          {q && <> for “<span className="text-fg">{q}</span>”</>}
        </p>
        {hasFilters && (
          <Button variant="ghost" size="sm" leftIcon={X} onClick={clearAll}>
            Clear filters
          </Button>
        )}
      </div>

      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <CourseCardSkeleton key={i} />)}
        </div>
      ) : !courses?.length ? (
        <EmptyState
          icon={Compass}
          title="No courses match"
          description="Try another keyword or clear a filter."
          action={<Button variant="outline" onClick={clearAll}>Show all courses</Button>}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((c, i) => <CourseCard key={c.id} course={c} index={i} />)}
        </div>
      )}
    </div>
  );
}
