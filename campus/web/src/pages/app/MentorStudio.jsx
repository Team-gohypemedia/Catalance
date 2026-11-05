import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from "recharts";
import { Check, ExternalLink, Video } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import { cn, formatINR, formatNumber, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input, Skeleton, Textarea } from "@/components/ui/primitives";
import { Avatar, Dialog, DialogContent } from "@/components/ui/overlays";
import { ErrorState, PageHeader } from "@/components/ui/campus";
import { Markdown } from "@/components/community/Markdown";
import { formatSlot } from "@/components/community/constants";

export default function MentorStudio() {
  const { user } = useAuth();
  const allowed = user?.role === "MENTOR" || user?.role === "ADMIN";
  if (!allowed) return <BecomeMentor />;
  return <Studio user={user} />;
}

function BecomeMentor() {
  return (
    <div>
      <PageHeader
        eyebrow="Mentor studio"
        title={
          <>
            Teach what you've <em className="accent">earned</em>
          </>
        }
      />
      <section className="max-w-3xl rounded-2xl border border-line bg-surface p-6 sm:p-10">
        <h2 className="text-2xl leading-[1.15] font-medium tracking-tight sm:text-3xl">Become a Campus mentor</h2>
        <p className="mt-3 leading-relaxed text-muted">
          Mentors are working freelancers who review assignments, run 1:1 sessions and lead cohorts. Reach Diamond division, complete 5 paid gigs, and keep a 4.5+ helper rating to apply.
        </p>
        <ul className="mt-6 space-y-2.5 text-sm text-muted">
          {["Earn per session and per reviewed assignment", "Build your name with students across India", "Start today by answering doubts in the community"].map((t) => (
            <li key={t} className="flex gap-2.5">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {t}
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button to="/app/community">Help in the community</Button>
          <Button to="/app/leaderboard" variant="brandOutline">
            Check your rank
          </Button>
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value, hint, className }) {
  return (
    <div className={cn("px-5 py-5 sm:px-6", className)}>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-2xl font-medium tracking-tight tabular-nums sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-subtle">{hint}</p>}
    </div>
  );
}

function Panel({ title, description, children, className }) {
  return (
    <section className={cn("min-w-0 rounded-2xl border border-line bg-surface", className)}>
      <div className="px-6 pt-5">
        <h2 className="text-base font-medium">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      <div className="p-6 pt-4">{children}</div>
    </section>
  );
}

function Studio({ user }) {
  const [reviewing, setReviewing] = useState(null);
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["mentor-overview"], queryFn: () => api.get("/api/mentor/overview") });

  return (
    <div>
      <PageHeader eyebrow="Mentor studio" title={`Namaste, ${user.name.split(" ")[0]}`} description="Your sessions, review queue and impact in one place." />
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-28 rounded-2xl" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Skeleton className="h-80 rounded-2xl" />
            <Skeleton className="h-80 rounded-2xl" />
          </div>
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 rounded-2xl border border-line bg-surface lg:grid-cols-4">
            <Kpi label="Earnings" value={formatINR(data.earningsINR)} hint="Lifetime on Campus" className="border-r border-b border-line lg:border-b-0" />
            <Kpi label="Rating" value={data.rating ? Number(data.rating).toFixed(1) : "–"} hint="From student reviews" className="border-b border-line lg:border-r lg:border-b-0" />
            <Kpi label="Students helped" value={formatNumber(data.studentsHelped)} hint="Sessions, reviews, answers" className="border-r border-line" />
            <Kpi label="To review" value={data.pendingSubmissions.length} hint="Assignments waiting" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Panel title="Sessions this week" description={`${data.weekly.reduce((s, d) => s + d.sessions, 0)} sessions in the last 7 days`}>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.weekly} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--line)" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "var(--subtle)", fontSize: 12 }} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--subtle)", fontSize: 12 }} />
                    <ChartTooltip
                      cursor={{ fill: "var(--surface-2)" }}
                      contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, fontSize: 12, color: "var(--fg)", boxShadow: "var(--shadow-md)" }}
                      labelStyle={{ color: "var(--muted)" }}
                      formatter={(v) => [v, "Sessions"]}
                    />
                    <Bar dataKey="sessions" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title="Upcoming sessions">
              {data.upcomingSessions.length ? (
                <ul className="-my-3 divide-y divide-line">
                  {data.upcomingSessions.slice(0, 5).map((b) => (
                    <li key={b.id} className="flex items-center gap-3 py-3">
                      <Avatar name={b.user?.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{b.user?.name}</p>
                        <p className="truncate text-xs text-muted">{b.topic}</p>
                        <p className="mt-0.5 text-xs text-subtle">{formatSlot(b.date, b.time)}</p>
                      </div>
                      <Button size="iconSm" variant="ghost" href={b.meetLink} target="_blank" rel="noopener noreferrer" aria-label="Join meet" className="text-muted">
                        <Video className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-center text-sm text-muted">No upcoming sessions. Students will book your open slots.</p>
              )}
            </Panel>
          </div>

          <section>
            <div className="mb-4 flex items-baseline justify-between gap-2">
              <h2 className="text-lg font-medium tracking-tight">Review queue</h2>
              {data.pendingSubmissions.length > 0 && <span className="text-sm text-subtle">{data.pendingSubmissions.length} waiting</span>}
            </div>
            {data.pendingSubmissions.length ? (
              <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
                {data.pendingSubmissions.map((s, i) => (
                  <motion.li
                    key={s.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: Math.min(i, 8) * 0.02 }}
                    className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-surface-2/50 sm:px-6"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar name={s.user?.name} size="md" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{s.lessonTitle}</p>
                        <p className="truncate text-xs text-subtle">
                          {s.user?.name}
                          {s.user?.college?.shortName ? ` · ${s.user.college.shortName}` : ""}
                          {s.courseTitle ? ` · ${s.courseTitle}` : ""} · {timeAgo(s.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="brandOutline" onClick={() => setReviewing(s)}>
                      Review
                    </Button>
                  </motion.li>
                ))}
              </ul>
            ) : (
              <div className="rounded-2xl border border-dashed border-line-strong px-6 py-12 text-center">
                <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-success-soft text-success">
                  <Check className="size-5" />
                </span>
                <p className="mt-3 font-medium">Review queue is clear</p>
                <p className="mt-1 text-sm text-muted">New assignment submissions from your courses will appear here.</p>
              </div>
            )}
          </section>
        </div>
      )}
      <ReviewDialog submission={reviewing} onClose={() => setReviewing(null)} />
    </div>
  );
}

function ReviewDialog({ submission, onClose }) {
  const qc = useQueryClient();
  const [score, setScore] = useState(80);
  const [feedback, setFeedback] = useState("");
  const max = submission?.maxScore || 100;

  const review = useMutation({
    mutationFn: () => api.post(`/api/mentor/submissions/${submission.id}/review`, { score, feedback }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mentor-overview"] });
      toast.success("Review sent. It's now verified in their Proof Portfolio.");
      setFeedback("");
      setScore(80);
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const pct = score / max;
  const tone = pct >= 0.8 ? "text-success" : pct >= 0.5 ? "text-warning" : "text-danger";

  return (
    <Dialog open={!!submission} onOpenChange={(o) => !o && onClose()}>
      {submission && (
        <DialogContent size="lg" title={submission.lessonTitle} description={`${submission.user?.name || "Student"}${submission.courseTitle ? ` · ${submission.courseTitle}` : ""}`}>
          <div className="space-y-6">
            <div className="rounded-xl border border-line p-4">
              <p className="mb-2 text-xs font-medium text-muted">Student work</p>
              {submission.text && <p className="text-sm leading-relaxed whitespace-pre-wrap">{submission.text}</p>}
              {submission.link && (
                <a
                  href={submission.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn("inline-flex items-center gap-1.5 text-sm font-medium break-all text-primary hover:underline", submission.text && "mt-3")}
                >
                  {submission.link} <ExternalLink className="size-3.5 shrink-0" />
                </a>
              )}
              {!submission.text && !submission.link && <p className="text-sm text-muted">No content attached.</p>}
            </div>

            {submission.brief && (
              <details className="group rounded-xl border border-line px-4 py-3">
                <summary className="cursor-pointer text-sm font-medium text-fg">Assignment brief</summary>
                <Markdown className="mt-3 text-sm">{submission.brief}</Markdown>
              </details>
            )}

            {submission.rubric?.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-muted">Rubric</p>
                <ul className="divide-y divide-line rounded-xl border border-line">
                  {submission.rubric.map((r) => (
                    <li key={r.criterion} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                      <span>{r.criterion}</span>
                      <span className="text-xs text-subtle tabular-nums">{r.points} pts</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Field label="Score" htmlFor="rv-score">
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={0}
                  max={max}
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  aria-label="Score slider"
                  className="flex-1 accent-[var(--primary)]"
                />
                <Input
                  id="rv-score"
                  type="number"
                  min={0}
                  max={max}
                  value={score}
                  onChange={(e) => setScore(Math.max(0, Math.min(max, Number(e.target.value) || 0)))}
                  className="w-20 text-center tabular-nums"
                />
                <span className={cn("w-12 text-sm font-medium tabular-nums", tone)}>/ {max}</span>
              </div>
            </Field>
            <Field label="Feedback" htmlFor="rv-feedback" hint="What worked, what to fix, one next step. Students see this.">
              <Textarea id="rv-feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Strong structure and clear CTA. Tighten the intro to two lines and…" />
            </Field>
            <div className="flex justify-end gap-2 border-t border-line pt-5">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button loading={review.isPending} disabled={feedback.trim().length < 10} onClick={() => review.mutate()}>
                Send review
              </Button>
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
