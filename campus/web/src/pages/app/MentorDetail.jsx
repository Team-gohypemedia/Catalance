import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Briefcase, CalendarPlus, Check, Clock, Copy, Languages, MapPin, Star, Video } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import { cn, formatINR, formatNumber, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input, Skeleton, Textarea } from "@/components/ui/primitives";
import { Avatar } from "@/components/ui/overlays";
import { CourseCover, EmptyState, ErrorState, StarRating } from "@/components/ui/campus";
import { formatSlot, formatTime, langLabel, parseYMD } from "@/components/community/constants";
import { downloadIcs } from "@/components/community/mentor-utils";
import { PriceTag } from "@/components/community/PriceTag";

const GOOD_FOR = ["Portfolio and case study review", "Pricing your first gigs", "Getting unstuck on a project", "Career and internship advice"];

export default function MentorDetail() {
  const { mentorId } = useParams();
  const { user } = useAuth();
  const { data: mentor, isLoading, error, refetch } = useQuery({
    queryKey: ["mentor", mentorId],
    queryFn: () => api.get(`/api/mentors/${mentorId}`),
  });

  if (isLoading)
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-24 rounded-md" />
        <Skeleton className="h-52 rounded-2xl" />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  if (error)
    return error.status === 404 ? (
      <EmptyState icon={Briefcase} title="Mentor not found" description="This profile may have moved." action={<Button to="/app/mentors">All mentors</Button>} />
    ) : (
      <ErrorState error={error} onRetry={refetch} />
    );

  const p = mentor.mentorProfile || {};
  const isSelf = user?.id === mentor.id;
  const first = mentor.name.split(" ")[0];

  return (
    <div>
      <Link to="/app/mentors" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg">
        <ArrowLeft className="size-4" /> Mentors
      </Link>

      {/* Profile header */}
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar name={mentor.name} src={mentor.avatarUrl} size="xl" />
            <div className="min-w-0">
              <p className="eyebrow">Mentor · working freelancer</p>
              <h1 className="mt-2 text-3xl leading-[1.1] font-medium tracking-tight sm:text-4xl">{mentor.name}</h1>
              <p className="mt-2 max-w-xl text-muted">{p.headline}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-subtle">
                {p.company && (
                  <span className="inline-flex items-center gap-1.5">
                    <Briefcase className="size-4" /> {p.company}
                  </span>
                )}
                {mentor.city && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4" /> {mentor.city}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Languages className="size-4" /> {(p.languages || []).map(langLabel).join(", ")}
                </span>
              </div>
            </div>
          </div>
          <dl className="grid shrink-0 grid-cols-3 divide-x divide-line rounded-xl border border-line">
            <HeroStat
              value={
                <span className="inline-flex items-center gap-1">
                  <Star className="size-4 fill-warning text-warning" />
                  {Number(p.rating || 0).toFixed(1)}
                </span>
              }
              label={`${formatNumber(p.reviewsCount || 0)} reviews`}
            />
            <HeroStat value={formatNumber(p.sessionsCount || 0)} label="sessions" />
            <HeroStat value={`${p.yearsExperience || 0} yrs`} label="freelancing" />
          </dl>
        </div>
      </motion.section>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-10">
          <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <h2 className="text-lg font-medium tracking-tight">About</h2>
            <p className="mt-3 leading-relaxed text-muted">{mentor.bio || p.headline}</p>

            <h3 className="mt-8 text-sm font-medium">Expertise</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {(p.expertise || []).map((e) => (
                <span key={e} className="rounded-full border border-line px-3 py-1 text-sm text-fg">
                  {e}
                </span>
              ))}
            </div>

            <h3 className="mt-8 text-sm font-medium">Good to book for</h3>
            <ul className="mt-3 grid gap-2.5 text-sm text-muted sm:grid-cols-2">
              {GOOD_FOR.map((t) => (
                <li key={t} className="flex items-center gap-2.5">
                  <Check className="size-4 shrink-0 text-primary" /> {t}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-medium tracking-tight">Courses by {first}</h2>
            {mentor.courses?.length ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {mentor.courses.map((c) => (
                  <Link
                    key={c.id}
                    to={`/app/courses/${c.slug || c.id}`}
                    className="group overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:border-line-strong"
                  >
                    <CourseCover cover={c.cover} title={c.title} className="h-28" />
                    <div className="p-5">
                      <p className="line-clamp-1 text-sm text-muted">{c.subtitle || c.track?.title}</p>
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <StarRating rating={c.rating || 0} count={c.ratingsCount} />
                        <span className="text-subtle">{c.lessonsCount || 0} lessons</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-line-strong p-6 text-center text-sm text-muted">No courses published yet. Book a 1:1 instead.</p>
            )}
          </section>

          <section>
            <h2 className="mb-4 text-lg font-medium tracking-tight">What students say</h2>
            {mentor.reviews?.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {mentor.reviews.map((r) => (
                  <figure key={r.id} className="rounded-2xl border border-line bg-surface p-6">
                    <div className="flex items-center gap-0.5" aria-label={`${r.rating} out of 5`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={cn("size-3.5", i < r.rating ? "fill-warning text-warning" : "text-line-strong")} />
                      ))}
                    </div>
                    <blockquote className="mt-3 text-sm leading-relaxed text-fg">“{r.comment}”</blockquote>
                    <figcaption className="mt-4 flex items-center gap-2 text-xs">
                      <Avatar name={r.userName} size="xs" />
                      <span className="font-medium">{r.userName}</span>
                      <span className="text-subtle">· {timeAgo(r.createdAt)}</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No reviews yet.</p>
            )}
          </section>
        </div>

        <aside className="order-first min-w-0 space-y-5 lg:sticky lg:top-24 lg:order-none lg:self-start">
          {isSelf ? (
            <div className="rounded-2xl border border-line bg-surface p-6 text-center">
              <p className="text-base font-medium">This is your public mentor profile</p>
              <p className="mt-1 text-sm text-muted">Students book you from here. Manage sessions in your studio.</p>
              <Button to="/app/mentor" className="mt-5">
                Open Mentor studio
              </Button>
            </div>
          ) : (
            <>
              <BookingWidget mentor={mentor} />
              <MySessions mentorId={mentor.id} />
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

function HeroStat({ value, label }) {
  return (
    <div className="px-4 py-3 text-center sm:px-6">
      <dd className="text-lg font-medium tracking-tight tabular-nums">{value}</dd>
      <dt className="mt-0.5 text-xs text-subtle">{label}</dt>
    </div>
  );
}

function StepLabel({ n, children }) {
  return (
    <p className="mb-3 flex items-center gap-2 text-sm font-medium">
      <span className="flex size-5 items-center justify-center rounded-full bg-surface-2 text-[11px] text-muted tabular-nums">{n}</span>
      {children}
    </p>
  );
}

function BookingWidget({ mentor }) {
  const qc = useQueryClient();
  const p = mentor.mentorProfile || {};
  const days = mentor.openSlots || [];
  const firstOpen = days.find((d) => d.times.length)?.date || null;
  const [date, setDate] = useState(firstOpen);
  const [time, setTime] = useState(null);
  const [topic, setTopic] = useState("");
  const [note, setNote] = useState("");
  const [booked, setBooked] = useState(null);

  const selectedDay = useMemo(() => days.find((d) => d.date === date), [days, date]);

  const book = useMutation({
    mutationFn: () => api.post(`/api/mentors/${mentor.id}/book`, { date, time, topic, note }),
    onSuccess: (b) => {
      setBooked(b);
      qc.invalidateQueries({ queryKey: ["mentor", mentor.id] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Session booked. Check your notifications.");
    },
    onError: (e) => {
      toast.error(e.message);
      if (e.status === 409) qc.invalidateQueries({ queryKey: ["mentor", mentor.id] });
    },
  });

  const reset = () => {
    setBooked(null);
    setTime(null);
    setTopic("");
    setNote("");
  };

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Meet link copied");
    } catch {
      toast.error("Couldn't copy");
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-5">
        <div>
          <h2 className="text-base font-medium">Book a 1:1</h2>
          <p className="mt-0.5 text-xs text-subtle">45 min · Google Meet</p>
        </div>
        <PriceTag price={p.priceINR} suffix="" className={p.priceINR ? "text-base" : ""} />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {booked ? (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="p-6 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-success-soft text-success">
              <Check className="size-6" strokeWidth={2.25} />
            </span>
            <p className="mt-4 text-lg font-medium tracking-tight">You're booked</p>
            <p className="mt-1 text-sm text-muted">
              {formatSlot(booked.date, booked.time)} with {mentor.name.split(" ")[0]}
            </p>
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-line p-1.5 pl-3 text-left">
              <Video className="size-4 shrink-0 text-subtle" />
              <a href={booked.meetLink} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-xs text-fg hover:text-primary">
                {booked.meetLink.replace("https://", "")}
              </a>
              <Button size="iconSm" variant="ghost" aria-label="Copy meet link" onClick={() => copy(booked.meetLink)}>
                <Copy className="size-4" />
              </Button>
            </div>
            <div className="mt-5 grid gap-2">
              <Button
                variant="brandOutline"
                leftIcon={CalendarPlus}
                onClick={() => downloadIcs({ date: booked.date, time: booked.time, topic: booked.topic, mentorName: mentor.name, meetLink: booked.meetLink })}
              >
                Add to calendar
              </Button>
              <Button variant="ghost" onClick={reset} className="text-muted">
                Book another slot
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="p-6"
            onSubmit={(e) => {
              e.preventDefault();
              if (date && time && topic.trim().length >= 3) book.mutate();
            }}
          >
            <StepLabel n={1}>Pick a day</StepLabel>
            <div className="scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="listbox" aria-label="Available days">
              {days.map((d) => {
                const dt = parseYMD(d.date);
                const open = d.times.length > 0;
                const active = d.date === date;
                return (
                  <button
                    key={d.date}
                    type="button"
                    role="option"
                    aria-selected={active}
                    disabled={!open}
                    onClick={() => {
                      setDate(d.date);
                      setTime(null);
                    }}
                    className={cn(
                      "flex w-[52px] shrink-0 cursor-pointer flex-col items-center rounded-xl border py-2 transition-colors disabled:cursor-not-allowed disabled:opacity-35",
                      active ? "border-primary bg-primary-soft text-primary" : "border-line bg-surface hover:border-line-strong",
                    )}
                  >
                    <span className={cn("text-[10px] font-medium tracking-wide uppercase", active ? "text-primary" : "text-subtle")}>
                      {dt.toLocaleDateString("en-IN", { weekday: "short" })}
                    </span>
                    <span className="mt-0.5 text-base leading-tight font-medium tabular-nums">{dt.getDate()}</span>
                  </button>
                );
              })}
            </div>
            {!firstOpen && <p className="mt-3 rounded-xl bg-surface-2 p-3 text-sm text-muted">Fully booked for the next two weeks. Check back soon or ask in the community.</p>}

            {selectedDay && (
              <div className="mt-6">
                <StepLabel n={2}>Pick a time</StepLabel>
                <div className="grid grid-cols-3 gap-1.5">
                  {selectedDay.times.map((t) => (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={time === t}
                      onClick={() => setTime(t)}
                      className={cn(
                        "cursor-pointer rounded-lg border py-2 text-sm tabular-nums transition-colors",
                        time === t ? "border-primary bg-primary text-primary-fg" : "border-line text-fg hover:border-line-strong",
                      )}
                    >
                      {formatTime(t)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {time && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="mt-6 space-y-4">
                <StepLabel n={3}>Confirm</StepLabel>
                <Field label="Topic" htmlFor="book-topic">
                  <Input id="book-topic" value={topic} maxLength={140} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Review my portfolio before placements" />
                </Field>
                <Field label="Note for the mentor (optional)" htmlFor="book-note">
                  <Textarea id="book-note" value={note} onChange={(e) => setNote(e.target.value)} className="min-h-20" placeholder="Links, context, what you've tried" />
                </Field>
                <p className="flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-2.5 text-sm text-fg">
                  <Clock className="size-4 text-subtle" /> {formatSlot(date, time)}
                </p>
                <Button type="submit" className="w-full" size="lg" loading={book.isPending} disabled={topic.trim().length < 3}>
                  Confirm booking{p.priceINR ? ` · ${formatINR(p.priceINR)}` : ""}
                </Button>
                <p className="text-center text-xs text-subtle">Free cancellation up to the session start.</p>
              </motion.div>
            )}
          </motion.form>
        )}
      </AnimatePresence>
    </section>
  );
}

function MySessions({ mentorId }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data } = useQuery({ queryKey: ["bookings"], queryFn: () => api.get("/api/me/bookings") });
  const cancel = useMutation({
    mutationFn: (id) => api.post(`/api/bookings/${id}/cancel`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["mentor", mentorId] });
      toast.success("Session cancelled. The mentor has been notified.");
    },
    onError: (e) => toast.error(e.message),
  });
  const mine = (data || []).filter((b) => b.mentorId === mentorId && b.userId === user?.id && b.status === "UPCOMING");
  if (!mine.length) return null;
  return (
    <section className="rounded-2xl border border-line bg-surface p-6">
      <h2 className="text-sm font-medium">Your upcoming sessions</h2>
      <ul className="mt-3 divide-y divide-line">
        {mine.map((b) => (
          <li key={b.id} className="py-3 first:pt-1 last:pb-0">
            <p className="text-sm font-medium">{b.topic}</p>
            <p className="mt-0.5 text-xs text-subtle">{formatSlot(b.date, b.time)}</p>
            <div className="mt-2.5 flex gap-2">
              <Button size="sm" variant="outline" href={b.meetLink} target="_blank" rel="noopener noreferrer" leftIcon={Video}>
                Join
              </Button>
              <Button size="sm" variant="ghost" className="text-muted" loading={cancel.isPending && cancel.variables === b.id} onClick={() => cancel.mutate(b.id)}>
                Cancel
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
