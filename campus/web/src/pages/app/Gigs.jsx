import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, Lock, MessageSquareQuote, Search, Wallet } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, qs } from "@/lib/api/client";
import { cn, formatINR, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Select, Skeleton } from "@/components/ui/primitives";
import { Switch, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/overlays";
import { EmptyState, ErrorState, PageHeader } from "@/components/ui/campus";
import { ApplicationTimeline, CompanyMonogram, GigCard, StatusBadge } from "@/components/earn/EarnUI";
import { APP_STATUS, DIFFICULTY, TRACKS } from "@/components/earn/meta";

const STAGE_NAMES = { 1: "Learn", 2: "Practice", 3: "Micro-gig", 4: "Real project", 5: "Hired" };

function EligibilityBanner({ stage }) {
  const microOpen = stage >= 3;
  const realOpen = stage >= 4;
  return (
    <section className="mb-8 flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-primary text-sm font-medium text-primary">{stage}</span>
        <div>
          <p className="text-base font-medium">Stage {stage}, {STAGE_NAMES[stage]}</p>
          <p className="mt-0.5 text-sm text-muted">
            {realOpen ? "Micro-gigs and real projects are open to you." : microOpen ? "Micro-gigs are open. Real projects unlock at Stage 4." : "Gigs unlock at Stage 3. Finish practice to start earning."}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {[
          { label: "Micro-gigs", sub: "₹200 to ₹1,500", open: microOpen },
          { label: "Real projects", sub: "₹2,000 to ₹15,000", open: realOpen },
        ].map((t) => (
          <span key={t.label} className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs">
            {t.open ? <span className="size-1.5 rounded-full bg-success" /> : <Lock className="size-3 text-subtle" />}
            <span className={cn("font-medium", t.open ? "text-fg" : "text-muted")}>{t.label}</span>
            <span className="text-subtle">{t.sub}</span>
          </span>
        ))}
        <Button to="/app/ladder" variant="ghost" size="sm" rightIcon={ArrowRight}>View ladder</Button>
      </div>
    </section>
  );
}

function GridSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-2xl" />
      ))}
    </div>
  );
}

function Board({ stage }) {
  const [filters, setFilters] = useState({ category: "", difficulty: "", eligible: false, q: "" });
  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v }));
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["gigs", filters],
    queryFn: () => api.get(`/api/gigs${qs({ ...filters, eligible: filters.eligible ? "true" : "" })}`),
    placeholderData: (prev) => prev,
  });
  const pool = (data || []).reduce((n, g) => n + g.payoutINR, 0);
  const active = filters.category || filters.difficulty || filters.eligible || filters.q;

  return (
    <div>
      <div className="mb-5">
        <div className="grid gap-3 md:grid-cols-[1fr_200px_auto]">
          <label className="sr-only" htmlFor="gig-q">Search gigs</label>
          <Input id="gig-q" leftIcon={Search} placeholder="Search gigs, skills or companies…" value={filters.q} onChange={(e) => set("q", e.target.value)} />
          <label className="sr-only" htmlFor="gig-cat">Track</label>
          <Select id="gig-cat" value={filters.category} onChange={(e) => set("category", e.target.value)}>
            <option value="">All tracks</option>
            {Object.entries(TRACKS).map(([slug, t]) => (
              <option key={slug} value={slug}>{t.label}</option>
            ))}
          </Select>
          <label className="flex h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3.5 text-sm text-fg">
            Eligible only
            <Switch checked={filters.eligible} onCheckedChange={(v) => set("eligible", v)} aria-label="Show only gigs I can apply to" />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
                    {[["", "Any level"], ...Object.entries(DIFFICULTY).map(([k, d]) => [k, d.label])].map(([k, label]) => (
            <button
              key={k || "any"}
              onClick={() => set("difficulty", k)}
              aria-pressed={filters.difficulty === k}
              className={cn("rounded-full border px-3 py-1 text-xs transition-colors", filters.difficulty === k ? "border-primary bg-primary-soft font-medium text-primary" : "border-line bg-surface text-muted hover:text-fg")}
            >
              {label}
            </button>
          ))}
          {active && (
            <button onClick={() => setFilters({ category: "", difficulty: "", eligible: false, q: "" })} className="ml-auto text-xs font-medium text-primary hover:underline">
              Clear filters
            </button>
          )}
        </div>
      </div>

      {data && data.length > 0 && (
        <p className="mb-4 text-sm text-muted">
          <span className="font-medium text-fg">{data.length} open gigs</span> <span className="text-subtle">·</span> {formatINR(pool)} in payouts
        </p>
      )}

      {isLoading ? (
        <GridSkeleton />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !data.length ? (
        <EmptyState
          icon={Briefcase}
          title="No gigs match these filters"
          description="Try another track or switch off 'Eligible only'. New gigs drop every Monday and Thursday."
          action={active ? <Button variant="outline" onClick={() => setFilters({ category: "", difficulty: "", eligible: false, q: "" })}>Clear filters</Button> : null}
        />
      ) : (
        <div className="space-y-3">
          {data.map((g, i) => (
            <GigCard key={g.id} gig={g} userStage={stage} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function MyApplications() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["my-gig-applications"], queryFn: () => api.get("/api/me/gig-applications") });
  const [status, setStatus] = useState("");
  const list = useMemo(() => (data || []).filter((a) => !status || a.status === status), [data, status]);

  if (isLoading)
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
    );
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (!data.length)
    return <EmptyState icon={MessageSquareQuote} title="No applications yet" description="Pick a gig that matches your track and send a short, specific pitch. Most students land their first gig in 3 tries." />;

  const earned = data.filter((a) => a.status === "PAID").reduce((n, a) => n + (a.gig?.payoutINR || 0), 0);
  const counts = data.reduce((m, a) => ({ ...m, [a.status]: (m[a.status] || 0) + 1 }), {});

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button onClick={() => setStatus("")} className={cn("rounded-full border px-3 py-1 text-xs", !status ? "border-primary bg-primary-soft font-medium text-primary" : "border-line bg-surface text-muted hover:text-fg")}>
          All · {data.length}
        </button>
        {Object.entries(APP_STATUS)
          .filter(([k]) => counts[k])
          .map(([k, s]) => (
            <button key={k} onClick={() => setStatus(k)} className={cn("rounded-full border px-3 py-1 text-xs", status === k ? "border-primary bg-primary-soft font-medium text-primary" : "border-line bg-surface text-muted hover:text-fg")}>
              {s.label} · {counts[k]}
            </button>
          ))}
        {earned > 0 && (
          <span className="ml-auto inline-flex items-center gap-1.5 text-sm text-muted">
            Earned from gigs <span className="font-medium text-fg">{formatINR(earned)}</span>
          </span>
        )}
      </div>
      <div className="space-y-3">
        {list.map((a, i) => (
          <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Link to={`/app/gigs/${a.gigId}`} className="block rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-line-strong sm:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <CompanyMonogram company={a.gig?.company} />
                  <div className="min-w-0">
                    <p className="truncate text-sm text-muted">{a.gig?.company?.name}</p>
                    <p className="mt-0.5 font-medium text-fg">{a.gig?.title || "Gig"}</p>
                    <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                      <StatusBadge status={a.status} /> {APP_STATUS[a.status]?.hint} · updated {timeAgo(a.updatedAt || a.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-5 md:w-[380px]">
                  <div className="flex-1"><ApplicationTimeline application={a} compact /></div>
                  <p className="w-20 shrink-0 text-right text-base font-medium tabular-nums">{formatINR(a.gig?.payoutINR || 0)}</p>
                </div>
              </div>
              {a.feedback && (
                <p className="mt-4 rounded-xl bg-surface-2 px-4 py-3 text-sm text-muted">
                  <span className="font-medium text-fg">Mentor feedback. </span>
                  {a.feedback}
                </p>
              )}
              {a.status === "ACCEPTED" && (
                <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  Submit your work <ArrowRight className="size-4" />
                </p>
              )}
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function Gigs() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "mine" ? "mine" : "board";
  const stage = user?.ladderStage || 1;

  return (
    <div>
      <PageHeader
        eyebrow="Earn · Gigs"
        title={<>Real work, <em className="accent">real rupees</em></>}
        description="Micro-gigs and projects from Indian businesses, each with a Campus mentor who has your back."
        actions={<Button to="/app/wallet" variant="outline" leftIcon={Wallet}>Wallet · {formatINR(user?.walletBalanceINR || 0)}</Button>}
      />
      <EligibilityBanner stage={stage} />
      <Tabs value={tab} onValueChange={(v) => setParams(v === "mine" ? { tab: "mine" } : {}, { replace: true })}>
        <TabsList>
          <TabsTrigger value="board">Gig board</TabsTrigger>
          <TabsTrigger value="mine">My applications</TabsTrigger>
        </TabsList>
        <TabsContent value="board">
          <Board stage={stage} />
        </TabsContent>
        <TabsContent value="mine">
          <MyApplications />
        </TabsContent>
      </Tabs>
    </div>
  );
}
