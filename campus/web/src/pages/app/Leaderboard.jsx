import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, BadgeCheck, Minus, Trophy } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, qs } from "@/lib/api/client";
import { cn, DIVISIONS, divisionFor, formatNumber } from "@/lib/utils";
import { Select, Skeleton } from "@/components/ui/primitives";
import { Avatar, Tabs, TabsList, TabsTrigger } from "@/components/ui/overlays";
import { DivisionBadge, EmptyState, ErrorState, PageHeader } from "@/components/ui/campus";
import { Countdown } from "@/components/earn/EarnUI";
import { CITIES, TRACKS } from "@/components/earn/meta";

const MEDAL = { 1: DIVISIONS.GOLD.color, 2: DIVISIONS.SILVER.color, 3: DIVISIONS.BRONZE.color };

function Change({ value }) {
  if (!value) return <span className="inline-flex items-center text-xs text-subtle" aria-label="No change"><Minus className="size-3" /></span>;
  const up = value > 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs tabular-nums", up ? "text-success" : "text-danger")} aria-label={`${up ? "Up" : "Down"} ${Math.abs(value)}`}>
      {up ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
      {Math.abs(value)}
    </span>
  );
}

const entityOf = (item) => {
  if (item.college) {
    const c = item.college;
    return { key: c.id, name: c.name, sub: `${c.city} · ${formatNumber(c.studentsCount)} students`, to: `/app/colleges/${c.id}`, mono: c.shortName, verified: c.verified };
  }
  const u = item.user;
  return { key: u.id, name: u.name, sub: u.college ? `${u.college.shortName} · ${u.city || u.college.city}` : u.city || "Independent learner", to: `/u/${u.username}`, user: u };
};

function Monogram({ text }) {
  return <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line bg-surface-2 text-[10px] font-medium text-fg">{text}</span>;
}

function RankCell({ rank }) {
  if (MEDAL[rank])
    return (
      <span className="mx-auto flex size-7 items-center justify-center rounded-full border-2 text-xs font-medium text-fg tabular-nums" style={{ borderColor: MEDAL[rank] }} aria-label={`Rank ${rank}`}>
        {rank}
      </span>
    );
  return <span className="block text-center text-sm text-muted tabular-nums">{rank}</span>;
}

function Row({ item, highlight, index, onVisible }) {
  const e = entityOf(item);
  const ref = useRef(null);
  useEffect(() => {
    if (!highlight || !onVisible || !ref.current || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([en]) => onVisible(en.isIntersecting), { rootMargin: "0px 0px -80px 0px" });
    io.observe(ref.current);
    return () => {
      io.disconnect();
      onVisible(false);
    };
  }, [highlight, onVisible]);
  const top = item.rank <= 3;
  return (
    <motion.li ref={ref} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(index, 15) * 0.015 }}>
      <Link
        to={e.to}
        className={cn(
          "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2 sm:gap-4 sm:px-6",
          top && "py-3.5",
          highlight && "bg-primary-soft hover:bg-primary-soft",
        )}
      >
        <span className="w-8 shrink-0"><RankCell rank={item.rank} /></span>
        {e.user ? <Avatar name={e.name} src={e.user.avatarUrl} size="sm" /> : <Monogram text={e.mono} />}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm">
            <span className={cn("truncate", top || highlight ? "font-medium text-fg" : "text-fg")}>{e.name}</span>
            {e.verified && <BadgeCheck className="size-3.5 shrink-0 text-primary" aria-label="Verified college" />}
            {highlight && <span className="rounded-full border border-primary/40 px-1.5 text-[10px] font-medium text-primary">You</span>}
          </p>
          <p className="truncate text-xs text-muted">{e.sub}</p>
        </div>
        <span className="hidden w-24 sm:block"><DivisionBadge division={item.division} size="sm" /></span>
        <span className="hidden w-10 justify-end sm:flex"><Change value={item.change} /></span>
        <span className={cn("w-16 shrink-0 text-right text-sm tabular-nums sm:w-20", top ? "font-medium text-fg" : "text-fg")}>{formatNumber(item.points)}</span>
      </Link>
    </motion.li>
  );
}

function DivisionList({ points }) {
  const entries = Object.entries(DIVISIONS);
  const mine = points !== undefined ? divisionFor(points) : null;
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <h2 className="text-base font-medium">Divisions</h2>
      <p className="mt-1 text-sm text-muted">Based on season points. They reset every month.</p>
      <ol className="mt-4 divide-y divide-line">
        {[...entries].reverse().map(([key, d]) => {
          const reached = points !== undefined && points >= d.min;
          return (
            <li key={key} className={cn("flex items-center gap-3 py-2.5", !reached && "opacity-60")}>
              <DivisionBadge division={key} size="sm" showLabel={false} />
              <span className="flex-1 text-sm text-fg">{d.label}</span>
              {mine === key && <span className="rounded-full border border-primary/40 px-2 text-[10px] font-medium text-primary">You</span>}
              <span className="text-xs text-muted tabular-nums">{formatNumber(d.min)}+</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [scope, setScope] = useState("students");
  const [filters, setFilters] = useState({ period: "season", track: "", city: "" });
  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v }));
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["leaderboard", scope, filters],
    queryFn: () => api.get(`/api/leaderboard${qs({ scope, ...filters })}`),
    placeholderData: (prev) => prev,
  });

  const items = data?.items || [];
  const isMine = (item) => (scope === "students" ? item.user?.id === user?.id : item.college?.id === user?.collegeId);
  const meVisible = items.some(isMine);
  const [meInView, setMeInView] = useState(false);

  return (
    <div>
      <PageHeader eyebrow="Rank" title="The leaderboard" description="Monthly seasons. Every student, every college, one national table. Companies scout from the top." />

      {/* Season */}
      <section className="mb-6 flex flex-col gap-5 rounded-2xl border border-line bg-surface p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm text-muted">
            <span className="size-1.5 rounded-full bg-success" /> Live season
          </p>
          {data ? <h2 className="mt-1 text-xl font-medium tracking-tight sm:text-2xl">{data.season.name}</h2> : <Skeleton className="mt-1 h-8 w-56" />}
          {data?.me && (
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
              You're <span className="font-medium text-fg">#{data.me.rank}</span> {scope === "colleges" ? "with your college" : "nationally"}
              <span className="text-subtle">·</span> {formatNumber(data.me.points)} pts
              <span className="text-subtle">·</span> <DivisionBadge division={data.me.division} size="sm" />
            </p>
          )}
        </div>
        {data && (
          <div className="md:text-right">
            <p className="mb-1 text-xs text-muted">Season ends in</p>
            <Countdown to={data.season.endsAt} />
          </div>
        )}
      </section>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={scope} onValueChange={setScope}>
          <TabsList>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="colleges">College vs college</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="grid grid-cols-3 gap-2 lg:w-[480px]">
          <label className="sr-only" htmlFor="lb-period">Period</label>
          <Select id="lb-period" value={filters.period} onChange={(e) => set("period", e.target.value)} className="h-10">
            <option value="season">Season</option>
            <option value="all">All time</option>
          </Select>
          <label className="sr-only" htmlFor="lb-track">Track</label>
          <Select id="lb-track" value={filters.track} onChange={(e) => set("track", e.target.value)} className="h-10">
            <option value="">All tracks</option>
            {Object.entries(TRACKS).map(([slug, t]) => <option key={slug} value={slug}>{t.short}</option>)}
          </Select>
          <label className="sr-only" htmlFor="lb-city">City</label>
          <Select id="lb-city" value={filters.city} onChange={(e) => set("city", e.target.value)} className="h-10">
            <option value="">All cities</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px] xl:items-start">
        <div className="min-w-0">
          {isLoading ? (
            <Skeleton className="h-[560px] rounded-2xl" />
          ) : error ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : !items.length ? (
            <EmptyState icon={Trophy} title="No one here yet" description="Nobody matches these filters this season. Be the first to put this city or track on the map." />
          ) : (
            <>
              <section className="overflow-hidden rounded-2xl border border-line bg-surface">
                <div className="flex items-center gap-3 border-b border-line bg-surface-2/60 px-4 py-2.5 text-xs text-muted sm:gap-4 sm:px-6">
                  <span className="w-8 text-center">Rank</span>
                  <span className="w-8" aria-hidden="true" />
                  <span className="flex-1">{scope === "colleges" ? "College" : "Student"}</span>
                  <span className="hidden w-24 sm:block">Division</span>
                  <span className="hidden w-10 text-right sm:block">Change</span>
                  <span className="w-16 text-right sm:w-20">Points</span>
                </div>
                <ul className="divide-y divide-line">
                  {items.map((item, i) => (
                    <Row key={entityOf(item).key} item={item} index={i} highlight={isMine(item)} onVisible={setMeInView} />
                  ))}
                </ul>
              </section>
              {/* sticky "you" row */}
              {data.me && (
                <div className={cn("sticky bottom-20 z-10 mt-3 transition-opacity duration-200 lg:bottom-4", meInView && "pointer-events-none opacity-0")} aria-hidden={meInView || undefined}>
                  <div className="flex items-center gap-3 rounded-xl border border-primary/40 bg-surface px-4 py-3 shadow-md sm:gap-4 sm:px-6">
                    <span className="w-8 shrink-0 text-center text-sm font-medium text-primary tabular-nums">#{data.me.rank}</span>
                    {scope === "students" ? <Avatar name={user?.name} src={user?.avatarUrl} size="sm" /> : <Monogram text={user?.college?.shortName || "-"} />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{scope === "students" ? "You" : user?.college?.name}</p>
                      <p className="truncate text-xs text-muted">{meVisible ? "Highlighted in the table" : "Outside the top 100. Keep climbing."}</p>
                    </div>
                    <DivisionBadge division={data.me.division} size="sm" showLabel={false} />
                    <span className="w-16 text-right text-sm font-medium tabular-nums sm:w-20">{formatNumber(data.me.points)}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <aside className="space-y-4">
          <DivisionList points={user?.seasonPoints} />
          <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
            <h2 className="text-base font-medium">How points work</h2>
            <ul className="mt-3 divide-y divide-line text-sm">
              {[["Lesson completed", 20], ["Quiz passed", 40], ["Assignment submitted", 60], ["Answer accepted", 50], ["Course completed", 250], ["Gig approved", 400]].map(([l, p]) => (
                <li key={l} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-muted">{l}</span>
                  <span className="font-medium text-fg tabular-nums">+{p}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
