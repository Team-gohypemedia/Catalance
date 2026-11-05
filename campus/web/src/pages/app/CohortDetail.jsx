import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays, Clock, MessageSquare, Users } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/primitives";
import { Avatar, Tooltip } from "@/components/ui/overlays";
import { EmptyState, ErrorState } from "@/components/ui/campus";
import { Markdown } from "@/components/community/Markdown";
import { AuthorLine } from "@/components/community/AuthorLine";
import { CohortStatus, SeatsMeter, TrackLabel, cohortStatus } from "@/components/community/CohortCard";

export default function CohortDetail() {
  const { cohortId } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const [showAll, setShowAll] = useState(false);

  const { data: c, isLoading, error, refetch } = useQuery({ queryKey: ["cohort", cohortId], queryFn: () => api.get(`/api/cohorts/${cohortId}`) });

  const onCohort = (msg) => (data) => {
    qc.setQueryData(["cohort", cohortId], (prev) => ({ ...prev, ...data, posts: prev?.posts || data.posts }));
    qc.invalidateQueries({ queryKey: ["cohorts"] });
    qc.invalidateQueries({ queryKey: ["cohort", cohortId] });
    toast.success(msg(data));
  };
  const join = useMutation({ mutationFn: () => api.post(`/api/cohorts/${cohortId}/join`), onSuccess: onCohort((d) => `Welcome to ${d.title}`), onError: (e) => toast.error(e.message) });
  const leave = useMutation({ mutationFn: () => api.post(`/api/cohorts/${cohortId}/leave`), onSuccess: onCohort(() => "You left the cohort"), onError: (e) => toast.error(e.message) });
  const post = useMutation({
    mutationFn: () => api.post(`/api/cohorts/${cohortId}/posts`, { body: draft }),
    onSuccess: (p) => {
      qc.setQueryData(["cohort", cohortId], (prev) => (prev ? { ...prev, posts: [p, ...(prev.posts || [])] } : prev));
      setDraft("");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading)
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-24 rounded-md" />
        <Skeleton className="h-56 rounded-2xl" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  if (error)
    return error.status === 404 ? (
      <EmptyState icon={Users} title="Cohort not found" action={<Button to="/app/cohorts">All cohorts</Button>} />
    ) : (
      <ErrorState error={error} onRetry={refetch} />
    );

  const status = cohortStatus(c);
  const isLead = user?.id === c.leadMentorId;
  const canPost = c.isMember || isLead || user?.role === "ADMIN";
  const full = c.membersCount >= c.maxMembers;
  const members = c.members || [];
  const shown = showAll ? members : members.slice(0, 24);

  return (
    <div>
      <Link to="/app/cohorts" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg">
        <ArrowLeft className="size-4" /> Cohorts
      </Link>

      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_280px] md:items-end">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <TrackLabel track={c.track} />
              <CohortStatus cohort={c} />
            </div>
            <h1 className="mt-3 text-3xl leading-[1.1] font-medium tracking-tight sm:text-4xl">{c.title}</h1>
            <p className="mt-3 max-w-2xl leading-relaxed text-muted">{c.description}</p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4 text-subtle" /> {c.schedule}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4 text-subtle" /> {status.upcoming ? "Starts" : "Started"} {formatDate(c.startDate)}
              </span>
              {c.leadMentor && (
                <Link to={`/app/mentors/${c.leadMentor.id}`} className="inline-flex items-center gap-1.5 hover:text-fg">
                  <Avatar name={c.leadMentor.name} src={c.leadMentor.avatarUrl} size="xs" /> Led by <span className="text-fg">{c.leadMentor.name}</span>
                </Link>
              )}
            </div>
          </div>
          <div className="space-y-4 rounded-xl border border-line p-4">
            <SeatsMeter membersCount={c.membersCount} maxMembers={c.maxMembers} />
            {isLead ? (
              <p className="text-sm text-muted">You lead this cohort.</p>
            ) : c.isMember ? (
              <Button variant="outline" className="w-full" loading={leave.isPending} onClick={() => leave.mutate()}>
                Leave cohort
              </Button>
            ) : (
              <Button className="w-full" disabled={full} loading={join.isPending} onClick={() => join.mutate()}>
                {full ? "Cohort full" : "Join cohort"}
              </Button>
            )}
          </div>
        </div>
      </motion.section>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0">
          <h2 className="mb-4 text-lg font-medium tracking-tight">Cohort feed</h2>
          {canPost ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (draft.trim()) post.mutate();
              }}
              className="mb-5 rounded-2xl border border-line bg-surface p-4 transition-colors focus-within:border-line-strong sm:p-5"
            >
              <div className="flex gap-3">
                <Avatar name={user?.name} src={user?.avatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <label htmlFor="cohort-post" className="sr-only">
                    Write a post
                  </label>
                  <textarea
                    id="cohort-post"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={3}
                    className="block w-full resize-none bg-transparent pt-1.5 text-sm leading-relaxed outline-none placeholder:text-subtle"
                    placeholder="Share progress, a link to your work, or a question for the group"
                  />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                <span className="text-xs text-subtle">Markdown supported</span>
                <Button type="submit" size="sm" loading={post.isPending} disabled={!draft.trim()}>
                  Post
                </Button>
              </div>
            </form>
          ) : (
            <p className="mb-5 rounded-2xl border border-dashed border-line-strong p-4 text-center text-sm text-muted">Join the cohort to post in the feed.</p>
          )}
          {c.posts?.length ? (
            <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
              {c.posts.map((p) => (
                <motion.article key={p.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 sm:p-6">
                  <AuthorLine author={p.author} createdAt={p.createdAt} />
                  <Markdown className="mt-3 sm:pl-[42px]">{p.body}</Markdown>
                </motion.article>
              ))}
            </div>
          ) : (
            <EmptyState icon={MessageSquare} title="The feed is quiet" description="Say hi and tell everyone what you want to build in this cohort." />
          )}
        </section>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="text-sm font-medium">Schedule</h2>
            <p className="mt-2 text-lg font-medium tracking-tight">{c.schedule}</p>
            <p className="mt-1 text-sm text-muted">Live on Google Meet. Recordings are shared in the feed.</p>
          </section>
          <section className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="mb-4 text-sm font-medium">
              Members <span className="font-normal text-subtle">· {c.membersCount}</span>
            </h2>
            {members.length ? (
              <>
                <div className="grid grid-cols-6 gap-2">
                  {shown.map((m) => (
                    <Tooltip key={m.id} content={`${m.name}${m.college?.shortName ? ` · ${m.college.shortName}` : ""}`}>
                      <Link to={m.username ? `/u/${m.username}` : "#"} className="block rounded-full" aria-label={m.name}>
                        <Avatar name={m.name} src={m.avatarUrl} size="md" />
                      </Link>
                    </Tooltip>
                  ))}
                </div>
                {members.length > 24 && (
                  <Button variant="link" size="sm" className="mt-4" onClick={() => setShowAll((s) => !s)}>
                    {showAll ? "Show less" : `Show all ${members.length}`}
                  </Button>
                )}
              </>
            ) : (
              <p className="text-sm text-muted">No members yet. Be the first to join.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
