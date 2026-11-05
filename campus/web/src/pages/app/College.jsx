import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { ArrowDown, ArrowLeft, ArrowUp, BadgeCheck, Copy, MapPin, Megaphone, School } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api/client";
import { cn, divisionFor, formatCompact, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/primitives";
import { Avatar } from "@/components/ui/overlays";
import { DivisionBadge, EmptyState, ErrorState } from "@/components/ui/campus";
import { Stat } from "@/components/earn/EarnUI";
import { ChartTooltip, axisProps } from "@/components/earn/ChartTooltip";

const TYPE_LABEL = { ENGINEERING: "Engineering", ARTS_SCIENCE: "Arts & Science", COMMERCE: "Commerce", DESIGN: "Design", MANAGEMENT: "Management", POLYTECHNIC: "Polytechnic" };

export default function College() {
  const { collegeId } = useParams();
  const { user } = useAuth();
  const { data: c, isLoading, error, refetch } = useQuery({ queryKey: ["college", collegeId], queryFn: () => api.get(`/api/colleges/${collegeId}`) });

  const back = (
    <Link to="/app/leaderboard" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
      <ArrowLeft className="size-4" /> Leaderboard
    </Link>
  );

  if (isLoading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-64 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
      </div>
    );
  if (error)
    return (
      <div>
        {back}
        {error.status === 404 ? <EmptyState icon={School} title="College not found" description="This college isn't on Campus yet." action={<Button to="/app/leaderboard">Back to leaderboard</Button>} /> : <ErrorState error={error} onRetry={refetch} />}
      </div>
    );

  const mine = user?.collegeId === c.id;
  const inviteLink = `${window.location.origin}/signup?college=${c.id}&ref=${user?.username || ""}`;
  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Invite link copied. Share it in your class group.");
    } catch {
      toast.error("Couldn't copy. Long-press the link to copy it.");
    }
  };

  return (
    <div>
      {back}
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="rounded-2xl border border-line bg-surface p-5 sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4 sm:gap-5">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full border border-line bg-surface-2 text-sm font-medium text-fg sm:size-16">{c.shortName}</span>
            <div className="min-w-0">
              <h1 className="flex flex-wrap items-center gap-2 text-2xl leading-[1.15] font-medium tracking-tight sm:text-3xl">
                {c.name}
                {c.verified && <BadgeCheck className="size-5 shrink-0 text-primary" aria-label="Verified college" />}
              </h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" strokeWidth={1.75} /> {c.city}, {c.state}</span>
                <span className="text-subtle">·</span>
                <span>{TYPE_LABEL[c.type] || c.type}</span>
                {mine && (
                  <span className="rounded-full border border-primary/40 px-2 py-px text-xs font-medium text-primary">Your college</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-baseline gap-3 md:flex-col md:items-end md:gap-1">
            <p className="text-xs text-muted">National rank</p>
            <p className="flex items-baseline gap-2">
              <span className="text-3xl font-medium tracking-tight tabular-nums">#{c.rank}</span>
              {c.rankChange ? (
                <span className={cn("inline-flex items-center gap-0.5 text-xs tabular-nums", c.rankChange > 0 ? "text-success" : "text-danger")}>
                  {c.rankChange > 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />} {Math.abs(c.rankChange)}
                </span>
              ) : null}
            </p>
          </div>
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-6 lg:grid-cols-4">
          <Stat label="Season points" value={formatCompact(c.totalPoints)} hint="Sum of all members" />
          <Stat label="Students" value={formatNumber(c.studentsCount)} />
          <div className="min-w-0">
            <p className="text-xs text-muted">Avg per student</p>
            <p className="mt-1 flex items-center gap-2 text-xl font-medium tracking-tight tabular-nums sm:text-2xl">
              {formatNumber(c.avgPoints)} <DivisionBadge division={divisionFor(c.avgPoints)} size="sm" showLabel={false} />
            </p>
          </div>
          <Stat label="Top skill" value={c.topSkill || c.skillsBreakdown[0]?.skill || "-"} />
        </dl>
      </motion.section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-6">
          <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
            <p className="text-sm text-muted">Momentum</p>
            <h2 className="mt-1 text-base font-medium">Season points, last 6 months</h2>
            <div className="mt-5 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={c.monthlyPoints} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cpts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--line)" />
                  <XAxis dataKey="month" {...axisProps} />
                  <YAxis {...axisProps} tickFormatter={formatCompact} width={44} />
                  <RTooltip cursor={{ stroke: "var(--line-strong)" }} content={<ChartTooltip format={formatNumber} unit="points" />} />
                  <Area type="monotone" dataKey="points" name="points" stroke="var(--primary)" strokeWidth={2} fill="url(#cpts)" dot={false} activeDot={{ r: 4, fill: "var(--primary)", stroke: "var(--surface)", strokeWidth: 2 }} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
            <p className="text-sm text-muted">Skills on campus</p>
            <h2 className="mt-1 text-base font-medium">What {c.shortName} students are good at</h2>
            {c.skillsBreakdown.length ? (
              <ul className="mt-5 space-y-3.5">
                {c.skillsBreakdown.map((s) => {
                  const max = Math.max(...c.skillsBreakdown.map((x) => x.count), 1);
                  return (
                    <li key={s.skill} className="grid grid-cols-[110px_1fr_auto] items-center gap-3 text-sm sm:grid-cols-[140px_1fr_auto]">
                      <span className="truncate text-fg">{s.skill}</span>
                      <span className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                        <span className="block h-full rounded-full bg-primary" style={{ width: `${(s.count / max) * 100}%` }} />
                      </span>
                      <span className="w-8 text-right text-xs text-muted tabular-nums">{s.count}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted">No skills recorded yet.</p>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
            <h2 className="text-base font-medium">Top students this season</h2>
            {c.topStudents.length ? (
              <ol className="mt-3 divide-y divide-line">
                {c.topStudents.map((s, i) => (
                  <li key={s.id}>
                    <Link to={`/u/${s.username}`} className={cn("-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-surface-2", s.id === user?.id && "bg-primary-soft hover:bg-primary-soft")}>
                      <span className="w-4 text-center text-xs text-muted tabular-nums">{i + 1}</span>
                      <Avatar name={s.name} src={s.avatarUrl} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-fg">{s.name}{s.id === user?.id && " (you)"}</p>
                        <p className="truncate text-xs text-muted">{s.stream || "Student"}{s.year ? ` · Year ${s.year}` : ""}</p>
                      </div>
                      <DivisionBadge division={s.division} size="sm" showLabel={false} />
                      <span className="w-10 text-right text-sm font-medium tabular-nums">{formatCompact(s.seasonPoints)}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-sm text-muted">No students yet. Be the first.</p>
            )}
          </section>

          <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
            <span className="flex size-10 items-center justify-center rounded-full bg-surface-2 text-primary"><Megaphone className="size-4.5" strokeWidth={1.75} /></span>
            <h3 className="mt-4 text-base font-medium">{mine ? `Push ${c.shortName} up the table` : `Know someone at ${c.shortName}?`}</h3>
            <p className="mt-1 text-sm text-muted">Every classmate who joins adds to your college's season points. The top 3 colleges get a Campus fest on us.</p>
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-line p-1.5 pl-3">
              <span className="min-w-0 flex-1 truncate text-xs text-muted">{inviteLink.replace(/^https?:\/\//, "")}</span>
              <Button size="sm" leftIcon={Copy} onClick={copyInvite}>Copy</Button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
