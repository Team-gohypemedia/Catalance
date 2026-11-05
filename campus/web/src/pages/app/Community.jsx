import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CheckCircle2, MessageCircleQuestion, PenSquare, Search, X } from "lucide-react";
import { api, qs } from "@/lib/api/client";
import { cn, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Select, Skeleton } from "@/components/ui/primitives";
import { Avatar } from "@/components/ui/overlays";
import { DivisionBadge, EmptyState, ErrorState, PageHeader } from "@/components/ui/campus";
import { ThreadCard } from "@/components/community/ThreadCard";
import { RoleTag } from "@/components/community/AuthorLine";
import { AskDoubtDialog } from "@/components/community/AskDoubtDialog";
import { TRACKS, trackById } from "@/components/community/constants";
import { usePlatformConfig } from "@/lib/platform";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "unanswered", label: "Unanswered" },
  { key: "solved", label: "Solved" },
  { key: "mine", label: "Mine" },
];

export default function Community() {
  const { flags } = usePlatformConfig();
  const [params, setParams] = useSearchParams();
  const filter = params.get("filter") || "all";
  const sort = params.get("sort") || "new";
  const tag = params.get("tag") || "";
  const track = params.get("track") || "";
  const [search, setSearch] = useState(params.get("q") || "");
  const [q, setQ] = useState(search);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const update = (patch) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (!v || (k === "filter" && v === "all") || (k === "sort" && v === "new")) next.delete(k);
      else next.set(k, v);
    }
    setParams(next, { replace: true });
  };

  const filters = { filter, sort, tag, track, q };
  const { data: threads, isLoading, error, refetch } = useQuery({
    queryKey: ["threads", filters],
    queryFn: () => api.get(`/api/threads${qs({ ...filters, filter: filter === "all" ? "" : filter, sort: sort === "new" ? "" : sort })}`),
    placeholderData: (prev) => prev,
  });
  const { data: allThreads } = useQuery({ queryKey: ["threads", {}], queryFn: () => api.get("/api/threads") });

  const tagCloud = useMemo(() => {
    const counts = {};
    for (const t of allThreads || []) for (const tg of t.tags || []) counts[tg] = (counts[tg] || 0) + 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 14);
  }, [allThreads]);

  const stats = useMemo(() => {
    const list = allThreads || [];
    return { total: list.length, solved: list.filter((t) => t.solved).length, open: list.filter((t) => t.repliesCount === 0).length };
  }, [allThreads]);

  const activeTrack = trackById(track);

  return (
    <div>
      <PageHeader
        eyebrow="Community"
        title={
          <>
            Doubts, answered by people who've <em className="accent">been there</em>
          </>
        }
        description="Ask anything about code, clients, pricing or career. Helping a junior counts on the leaderboard."
        actions={
          <Button leftIcon={PenSquare} onClick={() => setAsking(true)}>
            Ask a doubt
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          {/* Search and selects */}
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <div className="flex-1">
              <label htmlFor="community-search" className="sr-only">
                Search doubts
              </label>
              <Input id="community-search" leftIcon={Search} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search doubts, e.g. pricing or useEffect" />
            </div>
            <div className="flex gap-2.5">
              <label htmlFor="community-track" className="sr-only">
                Track
              </label>
              <Select id="community-track" value={track} onChange={(e) => update({ track: e.target.value })} className="min-w-0 flex-1 sm:w-44">
                <option value="">All tracks</option>
                {TRACKS.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.title}
                  </option>
                ))}
              </Select>
              <label htmlFor="community-sort" className="sr-only">
                Sort
              </label>
              <Select id="community-sort" value={sort} onChange={(e) => update({ sort: e.target.value })} className="w-32 shrink-0">
                <option value="new">Newest</option>
                <option value="top">Top voted</option>
              </Select>
            </div>
          </div>

          {/* List */}
          <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-4 sm:px-6">
              <div className="scrollbar-none -mb-px flex max-w-full gap-5 overflow-x-auto" role="tablist" aria-label="Filter doubts">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    role="tab"
                    aria-selected={filter === f.key}
                    onClick={() => update({ filter: f.key })}
                    className={cn(
                      "cursor-pointer border-b-2 py-3.5 text-sm font-medium whitespace-nowrap transition-colors",
                      filter === f.key ? "border-primary text-fg" : "border-transparent text-muted hover:text-fg",
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              {(tag || activeTrack || q) && (
                <div className="flex flex-wrap items-center gap-1.5 py-2.5">
                  {tag && <ActiveChip label={`#${tag}`} onClear={() => update({ tag: "" })} />}
                  {activeTrack && <ActiveChip label={activeTrack.title} onClear={() => update({ track: "" })} />}
                  {q && <ActiveChip label={`“${q}”`} onClear={() => setSearch("")} />}
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="divide-y divide-line">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex gap-4 px-4 py-5 sm:px-6">
                    <Skeleton className="h-14 w-11 rounded-xl" />
                    <div className="flex-1 space-y-2.5">
                      <Skeleton className="h-4 w-3/4 rounded-md" />
                      <Skeleton className="h-3.5 w-full rounded-md" />
                      <Skeleton className="h-3 w-1/2 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-4 sm:p-6">
                <ErrorState error={error} onRetry={refetch} />
              </div>
            ) : !threads?.length ? (
              <div className="p-4 sm:p-6">
                <EmptyState
                  className="border-0"
                  icon={filter === "unanswered" ? CheckCircle2 : MessageCircleQuestion}
                  title={filter === "unanswered" ? "Every doubt has a reply" : filter === "mine" ? "You haven't asked anything yet" : "No doubts match this"}
                  description={filter === "mine" ? "Stuck on something? Asking is how everyone here started." : "Try another tag or search, or be the first to ask."}
                  action={
                    <Button leftIcon={PenSquare} onClick={() => setAsking(true)}>
                      Ask a doubt
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="divide-y divide-line">
                {threads.map((t, i) => (
                  <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: Math.min(i, 8) * 0.02 }}>
                    <ThreadCard thread={t} onTagClick={(tg) => update({ tag: tg })} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          <div className="grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-surface">
            {[
              ["Doubts", stats.total],
              ["Solved", stats.solved],
              ["Need help", stats.open],
            ].map(([label, value]) => (
              <div key={label} className="px-3 py-4 text-center">
                <p className="text-xl font-medium tracking-tight tabular-nums">{formatNumber(value)}</p>
                <p className="mt-0.5 text-xs text-muted">{label}</p>
              </div>
            ))}
          </div>
          {/* helper ranking and points are gamification (off by default, spec §2) */}
          {flags.gamification && <TopHelpers />}
          {flags.gamification && <PointsCard />}
          <SideCard title="Popular tags">
            {tagCloud.length ? (
              <div className="flex flex-wrap gap-1.5">
                {tagCloud.map(([tg, n]) => (
                  <button
                    key={tg}
                    onClick={() => update({ tag: tag === tg ? "" : tg })}
                    aria-pressed={tag === tg}
                    className={cn(
                      "cursor-pointer rounded-full border px-2.5 py-1 text-xs transition-colors",
                      tag === tg ? "border-primary bg-primary-soft text-primary" : "border-line text-muted hover:border-line-strong hover:text-fg",
                    )}
                  >
                    #{tg} <span className="text-subtle">{n}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-16 rounded-full" />
                ))}
              </div>
            )}
          </SideCard>
        </aside>
      </div>

      <AskDoubtDialog open={asking} onOpenChange={setAsking} />
    </div>
  );
}

function SideCard({ title, children, className }) {
  return (
    <section className={cn("rounded-2xl border border-line bg-surface p-5", className)}>
      <h2 className="mb-4 text-sm font-medium text-fg">{title}</h2>
      {children}
    </section>
  );
}

function ActiveChip({ label, onClear }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-2 py-0.5 pr-1 pl-2.5 text-xs font-medium text-fg">
      {label}
      <button onClick={onClear} aria-label={`Clear ${label}`} className="cursor-pointer rounded-full p-0.5 text-muted hover:bg-surface-3 hover:text-fg">
        <X className="size-3" />
      </button>
    </span>
  );
}

function TopHelpers() {
  const { data, isLoading, error } = useQuery({ queryKey: ["community", "top-helpers"], queryFn: () => api.get("/api/community/top-helpers"), retry: false });
  if (error) return null; // optional widget, hide quietly if the API doesn't support it
  return (
    <SideCard title="Top helpers this week">
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9" />
          ))}
        </div>
      ) : !data?.length ? (
        <p className="py-4 text-center text-sm text-muted">No answers yet this week. Your reply could top this list.</p>
      ) : (
        <ol className="-mx-2 space-y-0.5">
          {data.map((h, i) => (
            <li key={h.user.id} className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface-2">
              <span className="w-4 text-center text-xs text-subtle tabular-nums">{i + 1}</span>
              <Avatar name={h.user.name} src={h.user.avatarUrl} size="sm" />
              <div className="min-w-0 flex-1">
                <Link to={h.user.username ? `/u/${h.user.username}` : "#"} className="flex items-center gap-1.5 text-sm font-medium hover:text-primary">
                  <span className="truncate">{h.user.name}</span>
                  {h.user.role === "MENTOR" ? <RoleTag role="MENTOR" /> : <DivisionBadge division={h.user.division} size="sm" showLabel={false} />}
                </Link>
                <p className="truncate text-xs text-subtle">
                  {h.answers} answers · {h.accepted} accepted
                </p>
              </div>
              <span className="text-xs font-medium text-muted tabular-nums">+{h.points}</span>
            </li>
          ))}
        </ol>
      )}
    </SideCard>
  );
}

function PointsCard() {
  const rows = [
    { label: "Reply to someone's doubt", pts: "+5" },
    { label: "Your answer is accepted", pts: "+50" },
    { label: "Upvotes on your answers", pts: "Rep" },
  ];
  return (
    <SideCard title="How helping pays">
      <ul className="space-y-2.5">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted">{r.label}</span>
            <span className="font-medium text-fg tabular-nums">{r.pts}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 border-t border-line pt-4 text-xs leading-relaxed text-subtle">
        Points count for you and your college on the season leaderboard. Replies to your own doubt don't earn points.
      </p>
    </SideCard>
  );
}
