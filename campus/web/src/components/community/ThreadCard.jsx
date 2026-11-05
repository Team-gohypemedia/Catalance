import { Link } from "react-router-dom";
import { Check, MessageCircle } from "lucide-react";
import { Avatar } from "@/components/ui/overlays";
import { cn, timeAgo } from "@/lib/utils";
import { RoleTag } from "./AuthorLine";
import { VoteButton } from "./VoteButton";
import { trackById } from "./constants";

const excerpt = (md = "") =>
  md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);

/** Subtle green "Solved" badge. */
export function SolvedBadge({ className }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-medium text-success", className)}>
      <Check className="size-3" strokeWidth={2.5} /> Solved
    </span>
  );
}

/** One row in the community list. Render inside a divided container. */
export function ThreadCard({ thread, onTagClick }) {
  const track = trackById(thread.trackId);
  const a = thread.author;
  return (
    <article className="group relative flex gap-4 px-4 py-5 transition-colors hover:bg-surface-2/50 sm:px-6">
      <div className="relative z-10 pt-0.5">
        <VoteButton path={`/api/threads/${thread.id}/upvote`} upvotes={thread.upvotes} hasUpvoted={thread.hasUpvoted} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[15px] leading-snug font-medium tracking-tight text-fg sm:text-base">
            <Link to={`/app/community/${thread.id}`} className="after:absolute after:inset-0 group-hover:text-primary focus-visible:outline-none">
              {thread.title}
            </Link>
          </h3>
          <span
            className={cn(
              "mt-0.5 hidden shrink-0 items-center gap-1.5 text-xs tabular-nums sm:inline-flex",
              thread.repliesCount === 0 ? "text-subtle" : "text-muted",
            )}
          >
            <MessageCircle className="size-3.5" />
            {thread.repliesCount}
          </span>
        </div>
        <p className="mt-1 line-clamp-1 text-sm text-muted">{excerpt(thread.body)}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-subtle">
          {thread.solved && <SolvedBadge />}
          {!thread.solved && thread.repliesCount === 0 && (
            <span className="rounded-full border border-line px-2 py-0.5 text-[11px] font-medium text-muted">Unanswered</span>
          )}
          {a && (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Avatar name={a.name} src={a.avatarUrl} size="xs" />
              <span className="truncate font-medium text-fg/80">{a.name}</span>
              <RoleTag role={a.role} />
            </span>
          )}
          <span>{timeAgo(thread.createdAt)}</span>
          {track && (
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full" style={{ background: track.color }} />
              {track.title}
            </span>
          )}
          <span className="inline-flex items-center gap-1 sm:hidden">
            <MessageCircle className="size-3.5" /> {thread.repliesCount}
          </span>
          {thread.tags?.length > 0 && (
            <span className="relative z-10 flex flex-wrap gap-1">
              {thread.tags.slice(0, 3).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onTagClick?.(t)}
                  className="cursor-pointer rounded-md px-1 text-subtle hover:bg-surface-2 hover:text-primary"
                >
                  #{t}
                </button>
              ))}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
