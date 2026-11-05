import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from "recharts";
import {
  ArrowRight, ArrowUpRight, BadgeCheck, Briefcase, CalendarDays, Clock, Compass, FileCheck2, Flame, Hourglass, Inbox, PlayCircle, Receipt, RotateCcw, Send, Video,
} from "lucide-react";
import { api } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import { DIVISIONS, cn, formatDate, formatDuration, formatINR, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge, Card, Skeleton } from "@/components/ui/primitives";
import { Progress } from "@/components/ui/overlays";
import { DivisionBadge, EmptyState, ErrorState } from "@/components/ui/campus";
import { CourseCard } from "@/components/learning/CourseCard";
import { LESSON_TYPES } from "@/components/learning/meta";
import { CalmCover } from "@/components/learning/Cover";
import { ProgressRing } from "@/components/learning/ProgressRing";
import { AspirantPlanCard } from "@/components/aspirants/AspirantPlanCard";
import { NoGuarantee } from "@/components/marketing/NoGuarantee";
import { usePlatformConfig } from "@/lib/platform";

const reveal = { initial: { opacity: 0, y: 12 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.45, ease: "easeOut" } };

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-80" />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}

/** Small section title used inside the dashboard. */
function BlockTitle({ title, hint, link, linkLabel }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-base font-medium tracking-tight sm:text-lg">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-muted sm:text-sm">{hint}</p>}
      </div>
      {link && (
        <Link to={link} className="inline-flex shrink-0 items-center gap-1 text-sm text-muted transition-colors hover:text-primary">
          {linkLabel} <ArrowRight className="size-3.5" />
        </Link>
      )}
    </div>
  );
}

function ContinueCard({ item, secondary = false }) {
  const next = item.nextLesson;
  const NextIcon = next ? LESSON_TYPES[next.type]?.icon || PlayCircle : PlayCircle;
  return (
    <motion.div {...reveal} className="lg:col-span-2">
      <Card className="flex h-full flex-col gap-6 p-5 sm:flex-row sm:p-7">
        <CalmCover slug={item.course.track?.slug} size="hero" className="hidden w-52 shrink-0 rounded-xl border border-line sm:flex" />
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-xs text-muted">Continue learning</p>
          <h2 className="mt-1.5 text-xl leading-snug font-medium tracking-tight text-balance sm:text-2xl">{item.course.title}</h2>
          <p className="mt-1 text-sm text-muted">with {item.course.mentor?.name}</p>

          <div className="mt-5 flex items-center gap-3">
            <Progress value={item.progressPercent} className="h-1.5 flex-1" />
            <span className="text-xs text-muted tabular-nums">{item.progressPercent}%</span>
          </div>

          {next && (
            <div className="mt-4 flex items-center gap-3 border-t border-line pt-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted">
                <NextIcon className="size-4" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-subtle">Up next</p>
                <p className="truncate text-sm font-medium">{next.title}</p>
              </div>
              <span className="shrink-0 text-xs text-muted">{formatDuration(next.durationMinutes)}</span>
            </div>
          )}

          <div className="mt-auto flex flex-wrap items-center gap-2 pt-6">
            <Button to={next ? `/app/courses/${item.course.id}/learn/${next.id}` : `/app/courses/${item.course.id}`} variant={secondary ? "brandOutline" : "primary"} rightIcon={ArrowRight}>
              Resume lesson
            </Button>
            <Button to={`/app/courses/${item.course.id}`} variant={secondary ? "ghost" : "brandOutline"}>
              Syllabus
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function StartCard() {
  return (
    <motion.div {...reveal} className="lg:col-span-2">
      <Card className="flex h-full flex-col justify-center p-6 sm:p-8">
        <p className="text-xs text-muted">Start learning</p>
        <h2 className="mt-2 max-w-md text-2xl leading-tight font-medium tracking-tight sm:text-3xl">
          Your first course is <em className="accent">one click</em> away
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted">Choose a skill, learn it through practical lessons and prove it in one final task.</p>
        <div className="mt-6">
          <Button to="/app/catalog" rightIcon={ArrowRight}>
            Explore courses
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

function GoalCard({ goal, streak, showStreak }) {
  const pct = Math.round((goal.doneMinutes / Math.max(1, goal.targetMinutes)) * 100);
  const done = goal.doneMinutes >= goal.targetMinutes;
  return (
    <motion.div {...reveal}>
      <Card className="flex h-full flex-col p-5 sm:p-7">
        <p className="text-xs text-muted">Today's goal</p>
        <div className="flex flex-1 items-center gap-5 py-5 lg:flex-col lg:justify-center lg:text-center">
          <ProgressRing value={pct} size={112} stroke={8} color={done ? "var(--success)" : "var(--primary)"}>
            <span className="text-2xl leading-none font-medium tracking-tight tabular-nums">{goal.doneMinutes}</span>
            <span className="mt-1 text-[11px] text-muted">of {goal.targetMinutes} min</span>
          </ProgressRing>
          <div>
            <p className="font-medium">{done ? "Goal done for today" : `${goal.targetMinutes - goal.doneMinutes} minutes to go`}</p>
            <p className="mt-1 text-sm text-muted">{done ? "Nicely done. Rest or keep going." : "One short lesson gets you there."}</p>
          </div>
        </div>
        {showStreak && (
          <p className="flex items-center justify-center gap-1.5 border-t border-line pt-4 text-xs text-muted lg:justify-center">
            <Flame className="size-3.5 text-primary" /> {streak}-day streak{done ? ", safe for today" : ""}
          </p>
        )}
      </Card>
    </motion.div>
  );
}

function ActivityTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{label}</p>
      <p className="text-muted">{d.minutes} min learned</p>
      {payload[0].payload.showPoints && <p className="text-muted">{formatNumber(d.points)} pts earned</p>}
    </div>
  );
}

function WeeklyCard({ data: raw, showPoints }) {
  const data = raw.map((d) => ({ ...d, showPoints }));
  const totalMin = data.reduce((s, d) => s + d.minutes, 0);
  const totalPts = data.reduce((s, d) => s + d.points, 0);
  const activeDays = data.filter((d) => d.minutes > 0).length;
  const stats = [[formatDuration(totalMin), "learned"], ...(showPoints ? [[formatNumber(totalPts), "points"]] : []), [`${activeDays}/7`, "active days"]];
  return (
    <motion.div {...reveal} className={showPoints ? "lg:col-span-2" : "lg:col-span-3"}>
      <Card className="h-full p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs text-muted">This week</p>
            <h3 className="mt-1 text-base font-medium tracking-tight sm:text-lg">Minutes learned per day</h3>
          </div>
          <dl className="flex gap-6 sm:gap-8">
            {stats.map(([v, l]) => (
              <div key={l}>
                <dt className="sr-only">{l}</dt>
                <dd className="text-lg leading-none font-medium tracking-tight tabular-nums sm:text-xl">{v}</dd>
                <dd className="mt-1 text-[11px] text-muted">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="mt-6 h-48" role="img" aria-label={`Bar chart of minutes learned over the last 7 days, ${totalMin} minutes in total`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 0, left: -28, bottom: 0 }} barCategoryGap="34%">
              <CartesianGrid vertical={false} stroke="var(--line)" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "var(--subtle)", fontSize: 12 }} dy={6} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--subtle)", fontSize: 11 }} allowDecimals={false} />
              <ChartTooltip content={<ActivityTooltip />} cursor={{ fill: "var(--surface-2)", radius: 6 }} />
              <Bar dataKey="minutes" radius={[5, 5, 0, 0]} maxBarSize={36} isAnimationActive={false}>
                {data.map((d, i) => (
                  <Cell key={d.day + i} fill="var(--primary)" fillOpacity={i === data.length - 1 ? 1 : 0.35} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-3 flex items-center gap-4 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary/35" /> Past days</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" /> Today</span>
        </p>
      </Card>
    </motion.div>
  );
}

function RankCard({ rank, college }) {
  const order = Object.keys(DIVISIONS);
  const next = order[order.indexOf(rank.division) + 1];
  const curMin = DIVISIONS[rank.division]?.min || 0;
  const pct = rank.nextDivisionAt ? Math.round(((rank.seasonPoints - curMin) / (rank.nextDivisionAt - curMin)) * 100) : 100;
  return (
    <motion.div {...reveal}>
      <Link to="/app/leaderboard" className="group block h-full rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-line-strong sm:p-7">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted">Season rank</p>
            <ArrowUpRight className="size-4 text-subtle transition-colors group-hover:text-primary" />
          </div>
          <div className="mt-4 flex items-end gap-3">
            <p className="text-5xl leading-none font-medium tracking-tight tabular-nums">#{formatNumber(rank.position)}</p>
            <DivisionBadge division={rank.division} size="md" className="mb-1" />
          </div>
          <p className="mt-2 text-sm text-muted">
            in India this season
            {rank.collegePosition ? ` · #${rank.collegePosition} at ${college?.shortName || "your college"}` : ""}
          </p>
          <div className="mt-auto pt-8">
            <div className="mb-2 flex justify-between gap-2 text-xs">
              <span className="font-medium tabular-nums">{formatNumber(rank.seasonPoints)} pts</span>
              {next && <span className="text-muted">{DIVISIONS[next].label} at {formatNumber(rank.nextDivisionAt)}</span>}
            </div>
            <Progress value={Math.min(100, pct)} className="h-1.5" />
            <p className="mt-2.5 text-xs text-muted">
              {next ? `${formatNumber(rank.nextDivisionAt - rank.seasonPoints)} pts to ${DIVISIONS[next].label}, about ${Math.ceil((rank.nextDivisionAt - rank.seasonPoints) / 20)} lessons` : "Top division. Defend it."}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function SessionsCard({ sessions }) {
  return (
    <Card className="h-full p-5 sm:p-7">
      <BlockTitle title="Upcoming sessions" hint="1:1 time with working freelancers" link="/app/mentors" linkLabel="Book" />
      {sessions.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No sessions booked" description="A 30-minute 1:1 with a working freelancer can save you weeks." action={<Button to="/app/mentors" size="sm" variant="outline">Find a mentor</Button>} className="border-dashed py-8" />
      ) : (
        <ul className="divide-y divide-line">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
              <div className="flex w-11 shrink-0 flex-col items-center rounded-lg border border-line py-1.5">
                <span className="text-[10px] text-primary uppercase">{formatDate(s.date || s.startsAt, { month: "short" })}</span>
                <span className="text-base leading-none font-medium">{formatDate(s.date || s.startsAt, { day: "numeric" })}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{s.topic}</p>
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted"><Clock className="size-3" /> {s.time} · {s.mentor?.name}</p>
              </div>
              {s.meetLink && (
                <a href={s.meetLink} target="_blank" rel="noreferrer" className="flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-fg" aria-label={`Join session: ${s.topic}`}>
                  <Video className="size-4" strokeWidth={1.75} />
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function GigsCard({ gigs, stage }) {
  return (
    <Card className="h-full p-5 sm:p-7">
      <BlockTitle title="Practice gigs" hint={`Earn ladder stage ${stage} of 5`} link="/app/gigs" linkLabel="All gigs" />
      {gigs.length === 0 ? (
        <EmptyState icon={Briefcase} title="Gigs unlock soon" description="Finish lessons and assignments to unlock practice gigs." className="border-dashed py-8" />
      ) : (
        <ul className="divide-y divide-line">
          {gigs.map((g) => (
            <li key={g.id}>
              <Link to={`/app/gigs/${g.id}`} className="group flex items-center gap-4 py-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-medium text-muted">
                  {(g.company?.name || "?").slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium transition-colors group-hover:text-primary">{g.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">{g.company?.name} · {g.durationDays} days</p>
                </div>
                <span className="shrink-0 text-sm font-medium tabular-nums">{formatINR(g.payoutINR)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ───────────────────────── spec v1.0: one next action + journey ───────────────────────── */

const NEXT_ICONS = {
  VIEW_OFFER: Inbox,
  REASSESS: RotateCcw,
  VERIFY: BadgeCheck,
  SUBMIT_ASSESSMENT: Send,
  PAYMENT: Receipt,
  CONTINUE_LESSON: PlayCircle,
  START_ASSESSMENT: FileCheck2,
  UNDER_REVIEW: Hourglass,
  VERIFICATION_PENDING: Hourglass,
  OPPORTUNITIES: Inbox,
  EXPLORE: Compass,
};

/** Assessment status chips (spec §8.1 states). */
const ASSESSMENT_STATUS = {
  NOT_STARTED: { label: "Not started", tone: "neutral" },
  IN_PROGRESS: { label: "In progress", tone: "sky" },
  SUBMITTED: { label: "Submitted", tone: "violet" },
  UNDER_REVIEW: { label: "Under review", tone: "violet" },
  PASSED: { label: "Passed", tone: "success" },
  REASSESSMENT_REQUIRED: { label: "Reassessment required", tone: "warning" },
  FAILED: { label: "Not passed", tone: "danger" },
  APPEAL_PENDING: { label: "Appeal pending", tone: "warning" },
  VERIFIED: { label: "Verified", tone: "success" },
};

const LEVEL_LABEL = { BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced", STANDARD: "Standard" };

function NextActionCard({ action }) {
  const Icon = NEXT_ICONS[action.kind] || ArrowRight;
  return (
    <motion.div {...reveal}>
      <Card className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Icon className="size-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">Your next step</p>
          <h2 className="mt-1 text-xl leading-snug font-medium tracking-tight text-balance sm:text-2xl">{action.title}</h2>
          {action.body && <p className="mt-1 text-sm text-muted">{action.body}</p>}
        </div>
        <Button to={action.to} size="lg" rightIcon={ArrowRight} className="w-full shrink-0 sm:w-auto">
          {action.cta}
        </Button>
      </Card>
    </motion.div>
  );
}

function AssessmentsCard({ items }) {
  return (
    <Card className="h-full p-5 sm:p-7">
      <BlockTitle title="Assessments" hint="One final practical task per course" link="/app/assessments" linkLabel="All" />
      {items.length === 0 ? (
        <EmptyState icon={FileCheck2} title="No assessments yet" description="Enrol in a course to see its final assessment here." className="border-dashed py-8" />
      ) : (
        <ul className="divide-y divide-line">
          {items.slice(0, 4).map((a) => {
            const st = ASSESSMENT_STATUS[a.status] || ASSESSMENT_STATUS.NOT_STARTED;
            return (
              <li key={a.course.id}>
                <Link to={`/app/assessments/${a.course.id}`} className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium transition-colors group-hover:text-primary">{a.course.title}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {a.totalScore != null ? `${a.totalScore}/100` : a.attemptNo ? `Attempt ${a.attemptNo}` : "Not started"}
                      {a.reassessUntil && a.status === "REASSESSMENT_REQUIRED" ? ` · by ${formatDate(a.reassessUntil, { day: "numeric", month: "short" })}` : ""}
                    </p>
                  </div>
                  <Badge tone={st.tone}>{st.label}</Badge>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function SkillsCard({ skills }) {
  const active = skills.filter((s) => s.status === "ACTIVE");
  return (
    <Card className="flex h-full flex-col p-5 sm:p-7">
      <BlockTitle title="Verified skills" hint="Passed and checked by Catalance" link="/app/skills" linkLabel="My skills" />
      {active.length === 0 ? (
        <EmptyState icon={BadgeCheck} title="No verified skills yet" description="Pass a final assessment and complete your profile to get verified." className="border-dashed py-8" />
      ) : (
        <ul className="flex flex-wrap gap-2">
          {active.map((v) => (
            <li key={v.id}>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm">
                <BadgeCheck className="size-4 text-success" strokeWidth={1.75} />
                {v.skill?.name}
                <span className="text-xs text-muted">· {LEVEL_LABEL[v.level] || v.level}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      <NoGuarantee className="mt-auto pt-5" />
    </Card>
  );
}

function OffersCard({ offers }) {
  if (!offers.length) return null;
  return (
    <Card className="p-5 sm:p-7">
      <BlockTitle title="Open project offers" hint="Reply before the offer expires" link="/app/opportunities" linkLabel="All offers" />
      <ul className="divide-y divide-line">
        {offers.map((o) => (
          <li key={o.id}>
            <Link to={`/app/projects/${o.id}`} className="group flex items-center gap-4 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium transition-colors group-hover:text-primary">{o.title}</p>
                {o.expiresAt && <p className="mt-0.5 text-xs text-muted">Expires {formatDate(o.expiresAt, { day: "numeric", month: "short" })}</p>}
              </div>
              <span className="shrink-0 text-sm font-medium tabular-nums">{formatINR(o.payoutINR)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function Dashboard() {
  const { user: authUser } = useAuth();
  const { flags } = usePlatformConfig();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["dashboard"], queryFn: () => api.get("/api/me/dashboard") });

  if (isLoading) return <DashboardSkeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const user = data.user || authUser;
  const firstName = user?.name?.split(" ")[0] || "there";
  const [hero, ...moreInProgress] = data.continueLearning || [];
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  const gamified = Boolean(flags.gamification && data.rank);
  const nextAction = data.nextAction;
  // one primary button per screen: the lesson card's button is primary only when the next action is that lesson
  const lessonIsNext = nextAction?.kind === "CONTINUE_LESSON";

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted">{today}</p>
          <h1 className="mt-1.5 text-3xl leading-[1.1] font-medium tracking-tight sm:text-4xl">
            {greeting()}, <em className="accent">{firstName}</em>
          </h1>
        </div>
        {gamified && (
          <span className="inline-flex h-8 w-fit items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[13px] font-medium">
            <DivisionBadge division={user?.division} size="sm" />
          </span>
        )}
      </header>

      {nextAction && <NextActionCard action={nextAction} />}

      <OffersCard offers={data.openOffers || []} />

      {flags.aspirants && data.aspirantPlan && <AspirantPlanCard plan={data.aspirantPlan} aspirant={user?.aspirant || authUser?.aspirant} />}

      {(hero || !nextAction) && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {hero ? <ContinueCard item={hero} secondary={Boolean(nextAction) && !lessonIsNext} /> : <StartCard />}
          <GoalCard goal={data.todayGoal} streak={user?.streak ?? 0} showStreak={gamified} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <motion.div {...reveal}><AssessmentsCard items={data.assessments || []} /></motion.div>
        <motion.div {...reveal}><SkillsCard skills={data.verifiedSkills || []} /></motion.div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <WeeklyCard data={data.weeklyActivity || []} showPoints={gamified} />
        {gamified && <RankCard rank={data.rank} college={user?.college} />}
      </div>

      {moreInProgress.length > 0 && (
        <section>
          <BlockTitle title="Also in progress" link="/app/learn" linkLabel="My courses" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {moreInProgress.map((e) => (
              <Link
                key={e.id}
                to={e.nextLesson ? `/app/courses/${e.course.id}/learn/${e.nextLesson.id}` : `/app/courses/${e.course.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-line-strong"
              >
                <CalmCover slug={e.course.track?.slug} size="xs" className="size-14 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium transition-colors group-hover:text-primary">{e.course.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">{e.nextLesson ? `Next: ${e.nextLesson.title}` : "All lessons done"}</p>
                  <div className="mt-2.5 flex items-center gap-3">
                    <Progress value={e.progressPercent} className="h-1 flex-1" />
                    <span className="text-xs text-muted tabular-nums">{e.progressPercent}%</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {(flags.mentorBooking || flags.gigs) && (
        <div className={cn("grid grid-cols-1 gap-5", flags.mentorBooking && flags.gigs && "lg:grid-cols-2")}>
          {flags.mentorBooking && <motion.div {...reveal}><SessionsCard sessions={data.upcomingSessions || []} /></motion.div>}
          {flags.gigs && <motion.div {...reveal}><GigsCard gigs={data.openGigsForYou || []} stage={user?.ladderStage ?? 1} /></motion.div>}
        </div>
      )}

      <section className="pt-2">
        <BlockTitle title="Recommended for you" hint="Picked from your goal and interests" link="/app/catalog" linkLabel="Explore all" />
        {(data.recommended || []).length === 0 ? (
          <EmptyState icon={Compass} title="You've enrolled in everything" description="New courses are added regularly. Check back soon." />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {data.recommended.map((c, i) => <CourseCard key={c.id} course={c} index={i} />)}
          </div>
        )}
      </section>
    </div>
  );
}
