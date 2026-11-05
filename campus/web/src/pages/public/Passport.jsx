import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowUpRight, Award, BadgeCheck, BookOpenCheck, Briefcase, CalendarCheck, Copy, GraduationCap, MapPin, School, Search, Send, ShieldCheck, Timer } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api/client";
import { cn, formatDate, formatINR, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/primitives";
import { Avatar } from "@/components/ui/overlays";
import { DivisionBadge, EmptyState, ErrorState } from "@/components/ui/campus";
import { BadgeTile, PortfolioCard } from "@/components/earn/EarnUI";
import { trackMeta } from "@/components/earn/meta";
import { PreparationRecordCard } from "@/components/aspirants/parts";
import { usePlatformConfig } from "@/lib/platform";

/** Stat strip columns by item count, so the strip never ends in an empty cell on wide screens. */
const STAT_COLS = { 2: "", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4", 5: "sm:grid-cols-5", 6: "sm:grid-cols-3 lg:grid-cols-6", 7: "sm:grid-cols-4 lg:grid-cols-7" };

const reveal = { initial: { opacity: 0, y: 12 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.45 } };

function SectionTitle({ title, meta, id }) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
      <h2 id={id} className="text-lg font-medium tracking-tight">{title}</h2>
      {meta && <span className="text-xs text-muted">{meta}</span>}
    </div>
  );
}

function SkillList({ skills }) {
  return (
    <ul className="divide-y divide-line">
      {skills.map((s) => (
        <li key={s.name} className="flex items-center justify-between gap-3 py-3">
          <span className="flex min-w-0 items-center gap-1.5 text-sm text-fg">
            <span className="truncate">{s.name}</span>
            {s.verified && <BadgeCheck className="size-3.5 shrink-0 text-primary" aria-label="Verified" />}
          </span>
          <span className="flex shrink-0 items-center gap-1" aria-label={`Level ${s.level} of 5`}>
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className={cn("h-1 w-3 rounded-full", n <= s.level ? (s.verified ? "bg-primary" : "bg-muted/50") : "bg-surface-2")} />
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Prep years presented as a strength. Never shows age or attempts (the API doesn't send them). */
function PreparationSection({ record, firstName }) {
  const years = Number(record.prepYears) || 0;
  const points = [
    {
      icon: CalendarCheck,
      title: "Shows up every day",
      text: years ? `${years} year${years === 1 ? "" : "s"} on a self-set study schedule, without a boss or a classroom.` : "Keeps a self-set study schedule, without a boss or a classroom.",
    },
    {
      icon: Timer,
      title: "Calm under a clock",
      text: record.mockTestsTaken ? `${formatNumber(record.mockTestsTaken)} timed mock tests, reviewed and improved on.` : "Practises timed tests and reviews every mistake.",
    },
    {
      icon: BookOpenCheck,
      title: "Learns fast, alone",
      text: record.studyHoursTotal ? `${formatNumber(record.studyHoursTotal)} hours of self-study across ${record.strengths?.length || "many"} subjects.` : "Hundreds of hours of structured self-study.",
    },
  ];
  return (
    <motion.section {...reveal} aria-labelledby="prep-record-title">
      <SectionTitle id="prep-record-title" title="Preparation record" meta={record.examName} />
      <PreparationRecordCard record={record} />
      <div className="mt-4 rounded-2xl border border-line bg-surface p-5 sm:p-7">
        <p className="text-sm text-muted">What this means at work</p>
        <ul className="mt-4 grid gap-5 sm:grid-cols-3">
          {points.map((p) => (
            <li key={p.title}>
              <span className="flex size-9 items-center justify-center rounded-full bg-surface-2 text-primary">
                <p.icon className="size-4" strokeWidth={1.75} />
              </span>
              <p className="mt-3 text-sm font-medium text-fg">{p.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{p.text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 border-t border-line pt-4 text-xs text-muted">
          Prep numbers are self-reported by {firstName}. Skills marked <BadgeCheck className="inline size-3.5 text-primary" /> passed a Campus assessment and were approved.
        </p>
      </div>
    </motion.section>
  );
}

function PassportSkeleton() {
  return (
    <div className="container-campus max-w-5xl py-8 sm:py-12">
      <Skeleton className="h-72 rounded-2xl" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}

export default function Passport() {
  const { username } = useParams();
  const { user: me } = useAuth();
  const { flags } = usePlatformConfig();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["passport", username], queryFn: () => api.get(`/api/u/${encodeURIComponent(username)}`), retry: false });

  if (isLoading) return <PassportSkeleton />;
  if (error)
    return (
      <div className="container-campus py-16">
        {error.status === 404 ? (
          <EmptyState
            icon={Search}
            title={`No passport for @${username}`}
            description="This Skill Passport doesn't exist or was made private. Check the spelling, or explore who's leading this season."
            action={<Button to="/">Go to Campus</Button>}
          />
        ) : (
          <ErrorState error={error} onRetry={refetch} />
        )}
      </div>
    );

  const { user, college, stats, portfolio, certificates, badges, skills } = data;
  const verifications = data.verifications || [];
  const isMe = me?.id === user.id;
  const firstName = user.name.split(" ")[0];
  const verifiedCount = portfolio.filter((p) => p.verified).length;
  const hireHref = `mailto:talent@catalance.in?subject=${encodeURIComponent(`Hiring ${user.name} (@${user.username}) via Campus`)}`;
  const url = typeof window !== "undefined" ? window.location.href : "";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Passport link copied");
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  // rank, points, gigs and earnings only while those features are on (the API sends null when they're off)
  const statItems = [
    { label: "Verified skills", value: formatNumber(verifications.length) },
    flags.gamification && { label: "Season rank", value: stats.seasonRank ? `#${formatNumber(stats.seasonRank)}` : "-", hint: college?.rank ? `College #${college.rank}` : "Nationally" },
    flags.gamification && { label: "Season points", value: formatNumber(user.seasonPoints), hint: <DivisionBadge division={user.division} size="sm" /> },
    flags.gigs && stats.gigsCompleted != null && { label: "Gigs delivered", value: formatNumber(stats.gigsCompleted) },
    flags.wallet && stats.earnedINR != null && { label: "Earned on Campus", value: formatINR(stats.earnedINR) },
    { label: "Courses completed", value: formatNumber(stats.coursesCompleted) },
    flags.community && { label: "Helpful answers", value: formatNumber(stats.helpfulAnswers) },
  ].filter(Boolean);

  return (
    <div className="container-campus max-w-5xl py-8 sm:py-12">
      {/* Header */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="p-5 sm:p-8">
          <p className="flex items-center gap-2 text-xs text-muted">
            <ShieldCheck className="size-4 text-primary" strokeWidth={1.75} /> Skill Passport, verified by Catalance Campus
          </p>
          <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
              <Avatar name={user.name} src={user.avatarUrl} size="xl" className="ring-4 ring-surface-2" />
              <div className="min-w-0">
                <h1 className="text-3xl leading-[1.1] font-medium tracking-tight sm:text-4xl">{user.name}</h1>
                {user.headline && <p className="mt-1.5 max-w-xl text-base text-muted">{user.headline}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted">
                  {college &&
                    (flags.gamification ? (
                      <Link to={me ? `/app/colleges/${college.id}` : "/colleges"} className="inline-flex items-center gap-1.5 hover:text-fg">
                        <School className="size-4" strokeWidth={1.75} /> {college.name}
                        {college.verified && <BadgeCheck className="size-3.5 text-primary" />}
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <School className="size-4" strokeWidth={1.75} /> {college.name}
                      </span>
                    ))}
                  {user.stream && (
                    <span className="inline-flex items-center gap-1.5"><GraduationCap className="size-4" strokeWidth={1.75} /> {user.stream}{user.year ? `, Year ${user.year}` : ""}</span>
                  )}
                  {user.city && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" strokeWidth={1.75} /> {user.city}</span>}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 md:flex-col md:items-stretch">
              {!isMe ? (
                <Button href={hireHref} leftIcon={Send}>Hire via Catalance</Button>
              ) : (
                <Button to="/app/portfolio" leftIcon={Briefcase}>Edit my portfolio</Button>
              )}
              <Button variant="outline" leftIcon={Copy} onClick={copy}>Copy link</Button>
            </div>
          </div>
          {user.interests?.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-1.5">
              {user.interests.map((slug) => {
                const t = trackMeta(slug);
                return (
                  <span key={slug} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs text-muted">
                    <t.icon className="size-3" strokeWidth={1.75} /> {t.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>
        <dl className={cn("grid grid-cols-2 gap-px border-t border-line bg-line", STAT_COLS[statItems.length] || "sm:grid-cols-3")}>
          {statItems.map((s) => (
            <div key={s.label} className="bg-surface p-4 sm:px-6 sm:py-5">
              <dt className="text-xs text-muted">{s.label}</dt>
              <dd className="mt-1 text-lg font-medium tracking-tight tabular-nums sm:text-xl">{s.value}</dd>
              {s.hint && <dd className="mt-1 text-xs text-subtle">{s.hint}</dd>}
            </div>
          ))}
        </dl>
      </motion.section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        {/* Main */}
        <div className="min-w-0 space-y-10">
          {user.bio && (
            <motion.section {...reveal}>
              <SectionTitle title="About" />
              <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{user.bio}</p>
            </motion.section>
          )}

          {data.preparationRecord && <PreparationSection record={data.preparationRecord} firstName={firstName} />}

          <section aria-labelledby="pf-title">
            <SectionTitle id="pf-title" title="Proof portfolio" meta={`${verifiedCount} of ${portfolio.length} verified`} />
            {portfolio.length ? (
              <div className="grid gap-4 sm:grid-cols-2">{portfolio.map((p, i) => <PortfolioCard key={p.id} item={p} index={i} />)}</div>
            ) : (
              <EmptyState icon={Briefcase} title="No portfolio items yet" description="Reviewed assignments and project work will show up here." />
            )}
          </section>

          <motion.section {...reveal} aria-labelledby="cert-title">
            <SectionTitle id="cert-title" title="Certificates" meta={certificates.length ? `${certificates.length} issued` : null} />
            {certificates.length ? (
              <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
                {certificates.map((c) => (
                  <li key={c.id} className="flex items-center gap-4 px-5 py-4">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-primary"><Award className="size-4" strokeWidth={1.75} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.courseTitle}</p>
                      <p className="truncate text-xs text-muted">{c.trackTitle} · {c.mentorName} · {formatDate(c.issuedAt)}{c.score != null ? ` · ${c.score}%` : ""}</p>
                    </div>
                    <Link to={`/verify/${c.verifyCode}`} className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary-soft">
                      Verify <ArrowUpRight className="size-3.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-2xl border border-line bg-surface p-5 text-sm text-muted">No certificates yet.</p>
            )}
          </motion.section>
        </div>

        {/* Aside */}
        <aside className="min-w-0 space-y-8 lg:sticky lg:top-24">
          <motion.section {...reveal} className="rounded-2xl border border-line bg-surface p-5 sm:p-6" aria-labelledby="skills-title">
            <h2 id="skills-title" className="text-base font-medium">Verified skills</h2>
            <p className="mt-1 text-xs text-muted">
              <BadgeCheck className="inline size-3.5 text-primary" /> Passed a practical Campus assessment, approved by the Campus team.
            </p>
            {verifications.length ? (
              <ul className="mt-2 divide-y divide-line">
                {verifications.map((v) => (
                  <li key={v.verifyCode} className="flex items-center justify-between gap-3 py-3">
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-sm text-fg">
                        <span className="truncate">{v.skill?.name || "Skill"}</span>
                        <BadgeCheck className="size-3.5 shrink-0 text-primary" aria-label="Verified" />
                      </span>
                      <span className="block text-xs text-muted capitalize">{String(v.level || "").toLowerCase()} · {formatDate(v.awardedAt)}</span>
                    </span>
                    <Link to={`/verify/skill/${v.verifyCode}`} className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary-soft">
                      Check <ArrowUpRight className="size-3.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted">No verified skills yet.</p>
            )}
            {skills.length > 0 && (
              <>
                <h3 className="mt-5 text-sm font-medium">Skills</h3>
                <div className="mt-1"><SkillList skills={skills} /></div>
              </>
            )}
          </motion.section>

          {flags.gamification && (
          <motion.section {...reveal} aria-labelledby="badges-title">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h2 id="badges-title" className="text-base font-medium">Badges</h2>
              <span className="text-xs text-muted">{badges.length} earned</span>
            </div>
            {badges.length ? (
              <div className="grid min-w-0 grid-cols-1 gap-2">{badges.map((b) => <BadgeTile key={b.id} badge={b} />)}</div>
            ) : (
              <p className="text-sm text-muted">No badges yet. They're earned for streaks, first gigs, top ranks and more.</p>
            )}
          </motion.section>
          )}
        </aside>
      </div>

      {/* CTA */}
      {!isMe && (
        <motion.section {...reveal} className="mt-14 rounded-2xl border border-line bg-surface px-5 py-12 text-center sm:px-10 sm:py-16">
          <p className="eyebrow">For companies</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-3xl leading-[1.1] font-medium tracking-tight text-balance sm:text-4xl">
            Like what {firstName} <em className="accent">builds</em>?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-balance text-muted">Work with verified Campus talent on a project. Catalance project managers handle scope, contracts and payments.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" leftIcon={Send} href={hireHref}>Hire via Catalance</Button>
            <Button size="lg" variant="brandOutline" to="/for-companies">Scout more talent</Button>
          </div>
        </motion.section>
      )}
    </div>
  );
}
