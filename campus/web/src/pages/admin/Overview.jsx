import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import {
  Activity, BadgeCheck, BookOpen, Briefcase, ChevronRight, ClipboardCheck, CreditCard, FolderKanban, GraduationCap, IndianRupee, PieChart, School, Star, UserPlus, Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api/client";
import { formatCompact, formatDate, formatINR, formatNumber, timeAgo } from "@/lib/utils";
import { Skeleton } from "@/components/ui/primitives";
import { EmptyState, ErrorState } from "@/components/ui/campus";
import { Button } from "@/components/ui/button";
import { AdminHeader, Kpi, KpiGrid, Panel } from "@/components/admin/kit";

const ACTIVITY_ICON = { ENROLLMENT: BookOpen, SUBMISSION: ClipboardCheck, GIG_APPLICATION: Briefcase, SIGNUP: UserPlus };
const FEED_LIMIT = 8;

function ChartTooltip({ active, payload, label, valueLabel, labelFormat }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-md">
      <p className="text-muted">{labelFormat ? labelFormat(label) : label}</p>
      <p className="mt-0.5 text-sm font-medium text-fg tabular-nums">
        {formatNumber(payload[0].value)} <span className="font-normal text-muted">{valueLabel}</span>
      </p>
    </div>
  );
}

function QueueRow({ to, icon: Icon, label, hint, count }) {
  return (
    <li>
      <Link to={to} className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-2/50">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted">
          <Icon className="size-4" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-fg">{label}</p>
          <p className="truncate text-xs text-muted">{hint}</p>
        </div>
        <span className={count ? "text-lg font-medium text-fg tabular-nums" : "text-lg font-medium text-subtle tabular-nums"}>{formatNumber(count)}</span>
        <ChevronRight className="size-4 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-muted" />
      </Link>
    </li>
  );
}

function TrackBars({ tracks }) {
  const max = Math.max(...tracks.map((t) => t.students || 0), 1);
  return (
    <ul className="space-y-4" role="list" aria-label="Top tracks by students enrolled">
      {tracks.map((t, i) => (
        <li key={t.id || t.title}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-fg">{t.title}</span>
            <span className="shrink-0 text-muted tabular-nums">{formatNumber(t.students)}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <motion.div
              className="h-full rounded-full bg-primary"
              style={{ opacity: 1 - i * 0.1 }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(4, ((t.students || 0) / max) * 100)}%` }}
              transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.04 }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** North star + funnel summary (spec §16). Quiet strip; the full funnel lives on Reports. */
function FunnelStrip({ funnel }) {
  if (funnel.error) return null;
  if (funnel.isLoading) return <Skeleton className="mt-5 h-28 rounded-2xl" />;
  const step = (key) => funnel.data?.steps?.find((s) => s.key === key);
  const tiles = [
    { icon: Star, label: "North star", value: formatNumber(funnel.data.northStar.count), hint: "Passed and finished a paid project" },
    { icon: CreditCard, label: "Paid students", value: formatNumber(step("paid")?.count ?? 0), hint: `${step("paid")?.ofSignups ?? 0}% of sign-ups` },
    { icon: BadgeCheck, label: "Verified skills", value: formatNumber(step("verified")?.count ?? 0), hint: `${step("verified")?.ofSignups ?? 0}% of sign-ups` },
    { icon: Briefcase, label: "First paid project", value: formatNumber(step("firstProject")?.count ?? 0), hint: `${step("firstProject")?.ofSignups ?? 0}% of sign-ups` },
  ];
  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted">Funnel, all time</p>
        <Link to="/admin/reports" className="text-xs text-muted transition-colors hover:text-fg">
          View reports
        </Link>
      </div>
      <KpiGrid>
        {tiles.map((t) => (
          <Kpi key={t.label} {...t} />
        ))}
      </KpiGrid>
    </div>
  );
}

export default function Overview() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["admin", "overview"], queryFn: () => api.get("/api/admin/overview") });
  const apps = useQuery({ queryKey: ["admin", "gig-applications", "SUBMITTED"], queryFn: () => api.get("/api/admin/gig-applications?status=SUBMITTED") });
  // spec §16 north star + funnel (all time): visitor → paid → verified → first accepted paid project
  const funnel = useQuery({ queryKey: ["admin", "funnel", {}], queryFn: () => api.get("/api/admin/funnel") });

  const header = (
    <AdminHeader
      title="Overview"
      description="Signups, learning, gigs and payouts at a glance."
      actions={
        <Button variant="outline" size="sm" to="/admin/courses" leftIcon={BookOpen}>
          Manage courses
        </Button>
      }
    />
  );

  if (error)
    return (
      <>
        {header}
        <ErrorState error={error} onRetry={refetch} />
      </>
    );

  if (isLoading)
    return (
      <>
        {header}
        <Skeleton className="h-56 rounded-2xl" />
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </>
    );

  const { kpis, signupsByDay = [], topTracks = [], recentActivity = [] } = data;
  const signups30 = signupsByDay.reduce((s, d) => s + d.count, 0);
  const signups7 = signupsByDay.slice(-7).reduce((s, d) => s + d.count, 0);
  const activePct = kpis.students ? Math.round((kpis.activeThisWeek / kpis.students) * 100) : 0;
  const feed = recentActivity.slice(0, FEED_LIMIT);

  const stats = [
    { icon: Users, label: "Students", value: formatNumber(kpis.students), hint: `+${signups30} in the last 30 days` },
    { icon: Activity, label: "Active this week", value: formatNumber(kpis.activeThisWeek), hint: `${activePct}% of all students` },
    { icon: BookOpen, label: "Enrollments", value: formatNumber(kpis.enrollments), hint: "Across all tracks" },
    { icon: PieChart, label: "Completion rate", value: `${kpis.completionRate}%`, hint: "Enrollments finished" },
    { icon: IndianRupee, label: "Paid to students", value: `₹${formatCompact(kpis.paidOutINR)}`, hint: `${formatINR(kpis.paidOutINR)} lifetime` },
    { icon: Briefcase, label: "Open gigs", value: formatNumber(kpis.openGigs), hint: "Live on the gig board" },
    { icon: ClipboardCheck, label: "Pending reviews", value: formatNumber(kpis.pendingSubmissions), hint: "Assignments waiting" },
    { icon: School, label: "Pending colleges", value: formatNumber(kpis.pendingColleges), hint: "Need verification" },
  ];

  return (
    <>
      {header}

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <KpiGrid>
          {stats.map((s) => (
            <Kpi key={s.label} {...s} />
          ))}
        </KpiGrid>
      </motion.div>

      <FunnelStrip funnel={funnel} />

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="New students"
          description="Daily signups, last 30 days"
          action={
            <div className="text-right">
              <p className="text-lg leading-none font-medium text-fg tabular-nums">{formatNumber(signups7)}</p>
              <p className="mt-1 text-xs text-muted">this week</p>
            </div>
          }
        >
          {signups30 === 0 ? (
            <EmptyState icon={UserPlus} title="No signups in 30 days" description="New students will show up here day by day." className="border-0 py-10" />
          ) : (
            <div className="h-60" role="img" aria-label={`Area chart of daily signups. ${signups30} students joined in the last 30 days.`}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={signupsByDay} margin={{ top: 12, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="signupFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.16} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--line)" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "var(--subtle)", fontSize: 11 }}
                    tickFormatter={(d) => formatDate(d, { day: "numeric", month: "short" })}
                    interval={6}
                    tickMargin={8}
                  />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--subtle)", fontSize: 11 }} width={40} />
                  <RTooltip
                    cursor={{ stroke: "var(--line-strong)", strokeWidth: 1 }}
                    content={<ChartTooltip valueLabel="signups" labelFormat={(d) => formatDate(d, { weekday: "short", day: "numeric", month: "short" })} />}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="var(--primary)"
                    strokeWidth={1.75}
                    fill="url(#signupFill)"
                    isAnimationActive={false}
                    activeDot={{ r: 4, stroke: "var(--surface)", strokeWidth: 2, fill: "var(--primary)" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel title="Needs attention" description="Clear these queues first." flush>
          <ul className="divide-y divide-line">
            <QueueRow to="/admin/submissions" icon={ClipboardCheck} label="Assignment reviews" hint="Score and give feedback" count={kpis.pendingSubmissions} />
            <QueueRow to="/admin/applications" icon={FolderKanban} label="Gig submissions" hint="Approve work, then pay out" count={apps.data?.length ?? 0} />
            <QueueRow to="/admin/colleges" icon={School} label="Colleges to verify" hint="New campuses from onboarding" count={kpis.pendingColleges} />
          </ul>
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-5">
        <Panel className="lg:col-span-2" title="Top tracks" description="By students enrolled">
          {!topTracks.length ? (
            <EmptyState icon={GraduationCap} title="No enrollments yet" description="Track popularity appears once students enroll." className="border-0 py-10" />
          ) : (
            <TrackBars tracks={topTracks} />
          )}
        </Panel>

        <Panel className="lg:col-span-3" title="Recent activity" description="Latest across learning, gigs and signups" flush>
          {!feed.length ? (
            <EmptyState icon={Activity} title="Quiet for now" description="Enrollments, submissions and gig applications land here." className="border-0 py-10" />
          ) : (
            <ol className="divide-y divide-line">
              {feed.map((a) => {
                const Icon = ACTIVITY_ICON[a.type] || UserPlus;
                return (
                  <li key={a.id} className="flex items-start gap-3 px-5 py-3">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted">
                      <Icon className="size-3.5" strokeWidth={1.75} />
                    </span>
                    <p className="min-w-0 flex-1 text-sm leading-snug text-fg/90">{a.text}</p>
                    <time className="shrink-0 pt-0.5 text-xs whitespace-nowrap text-subtle" dateTime={a.createdAt}>
                      {timeAgo(a.createdAt)}
                    </time>
                  </li>
                );
              })}
            </ol>
          )}
        </Panel>
      </div>
    </>
  );
}
