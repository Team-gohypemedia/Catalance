import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, Check, Link2, MessageCircleQuestion } from "lucide-react";
import { toast } from "sonner";
import { api, qs } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import { cn, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/primitives";
import { EmptyState, ErrorState, PointsPill } from "@/components/ui/campus";
import { Markdown } from "@/components/community/Markdown";
import { MarkdownEditor } from "@/components/community/MarkdownEditor";
import { AuthorLine } from "@/components/community/AuthorLine";
import { VoteButton } from "@/components/community/VoteButton";
import { SolvedBadge } from "@/components/community/ThreadCard";
import { trackById } from "@/components/community/constants";

export default function Thread() {
  const { threadId } = useParams();
  const { user, refreshUser } = useAuth();
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const [editorKey, setEditorKey] = useState(0);

  const { data: thread, isLoading, error, refetch } = useQuery({
    queryKey: ["thread", threadId],
    queryFn: () => api.get(`/api/threads/${threadId}`),
  });

  const track = trackById(thread?.trackId);
  const { data: related } = useQuery({
    queryKey: ["threads", { track: track?.slug, related: true }],
    queryFn: () => api.get(`/api/threads${qs({ track: track.slug, sort: "top" })}`),
    enabled: !!track,
  });

  const isAuthor = thread && user && thread.authorId === user.id;

  const reply = useMutation({
    mutationFn: () => api.post(`/api/threads/${threadId}/replies`, { body: draft }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["thread", threadId] });
      qc.invalidateQueries({ queryKey: ["threads"] });
      setDraft("");
      setEditorKey((k) => k + 1);
      if (!isAuthor) {
        toast.success(
          <span className="flex items-center gap-2">
            Reply posted. Thanks for helping. <PointsPill points={5} />
          </span>,
        );
        refreshUser().catch(() => {});
      } else toast.success("Reply posted");
    },
    onError: (e) => toast.error(e.message),
  });

  const accept = useMutation({
    mutationFn: (replyId) => api.post(`/api/replies/${replyId}/accept`),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["thread", threadId] });
      qc.invalidateQueries({ queryKey: ["threads"] });
      toast.success(r.authorId === user?.id ? "Marked as the solution" : `Solved. ${r.author?.name?.split(" ")[0] || "They"} earned +50 pts for helping.`);
    },
    onError: (e) => toast.error(e.message),
  });

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied. Share it with someone who can help.");
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  if (isLoading)
    return (
      <div className="space-y-5">
        <Skeleton className="h-5 w-32 rounded-md" />
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  if (error)
    return error.status === 404 ? (
      <EmptyState icon={MessageCircleQuestion} title="This doubt doesn't exist" description="It may have been removed." action={<Button to="/app/community">Back to community</Button>} />
    ) : (
      <ErrorState error={error} onRetry={refetch} />
    );

  const relatedList = (related || []).filter((t) => t.id !== thread.id).slice(0, 4);
  const replyCount = thread.replies.length;

  return (
    <div>
      <Link to="/app/community" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg">
        <ArrowLeft className="size-4" /> Community
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          {/* Question */}
          <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="rounded-2xl border border-line bg-surface p-5 sm:p-8">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted">
              {thread.solved ? <SolvedBadge /> : <span className="rounded-full border border-line px-2 py-0.5 text-[11px] font-medium">Open</span>}
              {track && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full" style={{ background: track.color }} />
                  {track.title}
                </span>
              )}
            </div>
            <h1 className="text-2xl leading-[1.2] font-medium tracking-tight text-balance sm:text-[28px]">{thread.title}</h1>
            <AuthorLine author={thread.author} createdAt={thread.createdAt} className="mt-5" size="sm" />

            <div className="mt-6 border-t border-line pt-6">
              <Markdown>{thread.body}</Markdown>
              {thread.tags?.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-1.5">
                  {thread.tags.map((t) => (
                    <Link
                      key={t}
                      to={`/app/community?tag=${encodeURIComponent(t)}`}
                      className="rounded-full border border-line px-2.5 py-0.5 text-xs text-muted transition-colors hover:border-line-strong hover:text-fg"
                    >
                      #{t}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
              <div className="flex items-center gap-3">
                <VoteButton vertical={false} path={`/api/threads/${thread.id}/upvote`} upvotes={thread.upvotes} hasUpvoted={thread.hasUpvoted} />
                <span className="hidden text-xs text-subtle sm:inline">Upvote if you have the same doubt</span>
              </div>
              <Button variant="ghost" size="sm" leftIcon={Link2} onClick={share} className="text-muted">
                Copy link
              </Button>
            </div>
          </motion.article>

          {/* Replies */}
          <div className="mt-10 mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-medium tracking-tight">
              {replyCount} {replyCount === 1 ? "answer" : "answers"}
            </h2>
            {isAuthor && !thread.solved && replyCount > 0 && <p className="text-xs text-muted">Found your answer? Accept it to reward the helper.</p>}
          </div>

          {replyCount === 0 ? (
            <div className="rounded-2xl border border-dashed border-line-strong px-6 py-10 text-center">
              <p className="font-medium">No answers yet</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                {isAuthor ? "Helpers have been notified. Adding code or screenshots helps." : "Be the first to help. An accepted answer is worth +50 season points."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {thread.replies.map((r, i) => (
                  <motion.div key={r.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: Math.min(i, 6) * 0.03 }}>
                    <ReplyCard
                      reply={r}
                      canAccept={isAuthor && r.authorId !== user.id && !r.isAccepted}
                      onAccept={() => accept.mutate(r.id)}
                      accepting={accept.isPending && accept.variables === r.id}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Composer */}
          <section className="mt-8 rounded-2xl border border-line bg-surface p-5 sm:p-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (draft.trim().length >= 2) reply.mutate();
              }}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <label htmlFor="reply-body" className="text-base font-medium">
                  {isAuthor ? "Add more details" : "Your answer"}
                </label>
                {!isAuthor && <span className="text-xs text-subtle">+5 pts for a reply, +50 if accepted</span>}
              </div>
              <MarkdownEditor
                key={editorKey}
                id="reply-body"
                value={draft}
                onChange={setDraft}
                minRows="min-h-32"
                placeholder={isAuthor ? "Update: I tried… / Here's the full error…" : "Explain it like you would to a junior. Code blocks welcome."}
              />
              <div className="mt-4 flex items-center justify-end">
                <Button type="submit" loading={reply.isPending} disabled={draft.trim().length < 2}>
                  Post answer
                </Button>
              </div>
            </form>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="text-sm font-medium">Answers that get accepted</h2>
            <ul className="mt-3 space-y-2.5 text-sm text-muted">
              {["Start with the fix, then the why", "Show code, not just words", "Hinglish is welcome. Be clear and kind."].map((t) => (
                <li key={t} className="flex gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  {t}
                </li>
              ))}
            </ul>
          </section>
          {relatedList.length > 0 && (
            <section className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="mb-3 text-sm font-medium">More in {track.title}</h2>
              <ul className="-mx-2 space-y-0.5">
                {relatedList.map((t) => (
                  <li key={t.id}>
                    <Link to={`/app/community/${t.id}`} className="group block rounded-lg px-2 py-2 transition-colors hover:bg-surface-2">
                      <p className="line-clamp-2 text-sm text-fg group-hover:text-primary">{t.title}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-subtle">
                        {t.solved && <Check className="size-3 text-success" strokeWidth={2.5} />}
                        {t.repliesCount} replies · {timeAgo(t.createdAt)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <Link
            to="/app/mentors"
            className="group flex items-start justify-between gap-3 rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-line-strong"
          >
            <div>
              <p className="text-sm font-medium">Need a deeper walkthrough?</p>
              <p className="mt-1 text-sm text-muted">Book a 1:1 with a mentor. Many sessions are free.</p>
            </div>
            <ArrowUpRight className="size-4 shrink-0 text-subtle transition-colors group-hover:text-primary" />
          </Link>
        </aside>
      </div>
    </div>
  );
}

function ReplyCard({ reply, canAccept, onAccept, accepting }) {
  return (
    <article className={cn("rounded-2xl border bg-surface p-5 sm:p-6", reply.isAccepted ? "border-success/40" : "border-line")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <AuthorLine author={reply.author} createdAt={reply.createdAt} />
        {reply.isAccepted && (
          <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-medium text-success">
            <Check className="size-3.5" strokeWidth={2.5} /> Accepted answer
          </span>
        )}
      </div>
      <Markdown className="mt-4">{reply.body}</Markdown>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <VoteButton vertical={false} path={`/api/replies/${reply.id}/upvote`} upvotes={reply.upvotes} hasUpvoted={reply.hasUpvoted} />
        {canAccept && (
          <Button
            size="sm"
            variant="outline"
            leftIcon={Check}
            onClick={onAccept}
            loading={accepting}
            className="rounded-full border-success/40 bg-transparent text-success hover:bg-success-soft"
          >
            Accept answer
          </Button>
        )}
      </div>
    </article>
  );
}
