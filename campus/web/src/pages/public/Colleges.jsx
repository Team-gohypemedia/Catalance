import { useMemo, useState } from "react";
import { ArrowRight, Building2, MapPin, Search, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Skeleton } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/campus";
import { cn, formatCompact, formatNumber } from "@/lib/utils";
import { useCollegeBoard } from "@/components/marketing/hooks";
import { InkCta, PageHero, Reveal } from "@/components/marketing/primitives";
import { RankChange } from "@/components/marketing/mockups";

const TYPE_LABEL = { ENGINEERING: "Engineering", ARTS_SCIENCE: "Arts & Science", COMMERCE: "Commerce", DESIGN: "Design", MANAGEMENT: "Management", POLYTECHNIC: "Polytechnic" };

/** Quiet podium: three white cards, 2 · 1 · 3, the leader lifted slightly. */
function Podium({ items }) {
  const byRank = Object.fromEntries(items.map((it) => [it.rank, it]));
  return (
    <ol className="grid grid-cols-3 items-end gap-2 sm:gap-4">
      {[2, 1, 3].map((place, i) => {
        const it = byRank[place] || items[place - 1];
        if (!it) return <li key={place} />;
        const first = place === 1;
        return (
          <Reveal
            as="li"
            key={place}
            delay={i * 0.06}
            className={cn(
              "flex min-w-0 flex-col items-center rounded-2xl border bg-surface px-2 py-5 text-center sm:p-8",
              first ? "border-primary/40 pb-8 shadow-sm sm:pb-12" : "border-line",
            )}
          >
            <span className={cn("flex size-9 items-center justify-center rounded-full text-sm font-semibold tabular-nums", first ? "bg-primary text-primary-fg" : "bg-surface-2 text-muted")}>{place}</span>
            <span className="mt-4 flex size-11 items-center justify-center rounded-full border border-line bg-bg text-xs font-semibold tracking-tight sm:mt-5 sm:size-14 sm:text-sm">{it.college?.shortName?.slice(0, 4) || "—"}</span>
            <p className="mt-3 line-clamp-2 w-full text-xs leading-snug font-medium tracking-tight sm:mt-4 sm:text-lg">{it.college?.name}</p>
            <p className="mt-1 hidden items-center gap-1 text-xs text-muted sm:flex">
              <MapPin className="size-3" /> {it.college?.city}
              {it.college?.state ? `, ${it.college.state}` : ""}
            </p>
            <p className="mt-3 text-lg font-medium tracking-tight tabular-nums sm:mt-5 sm:text-2xl">{formatCompact(it.points)}</p>
            <p className="text-xs text-muted">points</p>
          </Reveal>
        );
      })}
    </ol>
  );
}

export default function Colleges() {
  const [period, setPeriod] = useState("season");
  const [q, setQ] = useState("");
  const { data, isLoading, usingFallback } = useCollegeBoard(period);
  const items = data?.items || [];
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((it) => `${it.college?.name} ${it.college?.shortName} ${it.college?.city} ${it.college?.state}`.toLowerCase().includes(s));
  }, [items, q]);
  const top3 = items.slice(0, 3);
  const totalPoints = items.reduce((a, b) => a + (b.points || 0), 0);

  return (
    <>
      <PageHero
        eyebrow={data?.season ? `${data.season.name}${data.season.number && !/season/i.test(data.season.name) ? ` · Season ${data.season.number}` : ""}` : "College leaderboard"}
        title={
          <>
            College vs college. May the <em className="accent">hungriest</em> campus win
          </>
        }
        description="Every lesson, assignment and gig a student finishes adds points to their college. No brand names, just what your batch actually does."
        actions={
          <>
            <Button to="/signup" size="xl" rightIcon={ArrowRight}>
              Add my college
            </Button>
            <Button to="/for-colleges" size="xl" variant="brandOutline">
              I'm a TPO or faculty
            </Button>
          </>
        }
      />

      <section className="container-campus pb-16 sm:pb-20">
        <div className="mx-auto max-w-4xl">
          {isLoading ? (
            <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
              {["h-48 sm:h-64", "h-56 sm:h-72", "h-48 sm:h-64"].map((h, i) => (
                <Skeleton key={i} className={cn("rounded-2xl", h)} />
              ))}
            </div>
          ) : top3.length ? (
            <Podium items={top3} />
          ) : (
            <p className="rounded-2xl border border-line bg-surface py-12 text-center text-muted">The season just started. No points on the board yet.</p>
          )}
        </div>
      </section>

      <section className="container-campus pb-8 sm:pb-12">
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="flex flex-col gap-4 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div role="group" aria-label="Period" className="inline-flex rounded-full border border-line bg-bg p-1">
                {[
                  ["season", "This season"],
                  ["all", "All time"],
                ].map(([k, l]) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={period === k}
                    onClick={() => setPeriod(k)}
                    className={cn("cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors", period === k ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg")}
                  >
                    {l}
                  </button>
                ))}
              </div>
              {!isLoading && items.length > 0 && (
                <p className="text-sm text-muted">
                  {formatNumber(items.length)} colleges · {formatCompact(totalPoints)} points
                  {usingFallback && " · recent snapshot"}
                </p>
              )}
            </div>
            <div className="w-full sm:w-72">
              <label htmlFor="college-filter" className="sr-only">
                Find your college
              </label>
              <Input id="college-filter" leftIcon={Search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find your college or city" />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="p-4">
              <EmptyState icon={Trophy} title="No colleges on the board yet" description="Be the first. Sign up, finish a lesson, and put your college on the map." action={<Button to="/signup">Put my college on the map</Button>} className="border-0" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={Building2}
                title={`No college matches “${q}”`}
                description="Your college isn't on the board yet. Sign up and add it; it takes one minute."
                action={
                  <Button to="/signup" rightIcon={ArrowRight}>
                    Bring my college in
                  </Button>
                }
                className="border-0"
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full sm:min-w-160 text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs text-muted">
                    <th scope="col" className="w-20 px-4 py-3 font-medium sm:w-24 sm:px-6">Rank</th>
                    <th scope="col" className="px-4 py-3 font-medium">College</th>
                    <th scope="col" className="hidden px-4 py-3 font-medium md:table-cell">Type</th>
                    <th scope="col" className="hidden px-4 py-3 font-medium sm:table-cell">Top skill</th>
                    <th scope="col" className="hidden px-4 py-3 text-right font-medium sm:table-cell">Avg / student</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium sm:px-6">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((it) => (
                    <tr key={it.college?.id || it.rank} className="border-b border-line transition-colors last:border-0 hover:bg-surface-2/50">
                      <td className="px-4 py-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <span className={cn("w-6 text-base font-medium tabular-nums", it.rank <= 3 ? "text-primary" : "text-fg")}>{it.rank}</span>
                          <RankChange change={it.change} />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium">{it.college?.name}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          {it.college?.city}
                          {it.college?.state ? `, ${it.college.state}` : ""}
                        </p>
                      </td>
                      <td className="hidden px-4 py-4 text-muted md:table-cell">{TYPE_LABEL[it.college?.type] || "College"}</td>
                      <td className="hidden px-4 py-4 text-muted sm:table-cell">{it.college?.topSkill || "—"}</td>
                      <td className="hidden px-4 py-4 text-right text-muted tabular-nums sm:table-cell">{formatNumber(it.college?.avgPoints || 0)}</td>
                      <td className="px-4 py-4 text-right font-medium tabular-nums sm:px-6">{formatNumber(it.points)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <InkCta
        title="Is your college here? Bring it in."
        description="Sign up, add your college in one step, and every point you earn counts for your campus. Get five friends in and you're on the national board."
        primary={{ to: "/signup", label: "Add my college" }}
        secondary={{ to: "/for-colleges", label: "I'm a TPO or faculty" }}
      />
    </>
  );
}
