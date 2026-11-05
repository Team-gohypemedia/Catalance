import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { cn, formatCompact } from "@/lib/utils";

/**
 * Optimistic upvote toggle. Quiet by default: a thin chevron and a count.
 * <VoteButton path="/api/threads/th_1/upvote" upvotes={12} hasUpvoted={false} onSettled={() => …} />
 */
export function VoteButton({ path, upvotes = 0, hasUpvoted = false, vertical = true, disabled = false, onSettled, className }) {
  const [state, setState] = useState({ upvotes, hasUpvoted });
  const [busy, setBusy] = useState(false);

  useEffect(() => setState({ upvotes, hasUpvoted }), [upvotes, hasUpvoted]);

  const toggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy || disabled) return;
    const prev = state;
    setState({ upvotes: prev.upvotes + (prev.hasUpvoted ? -1 : 1), hasUpvoted: !prev.hasUpvoted });
    setBusy(true);
    try {
      const res = await api.post(path);
      setState(res);
      onSettled?.(res);
    } catch (err) {
      setState(prev);
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      aria-pressed={state.hasUpvoted}
      aria-label={state.hasUpvoted ? `Remove upvote (${state.upvotes})` : `Upvote (${state.upvotes})`}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center justify-center font-medium tabular-nums transition-colors disabled:cursor-default",
        vertical ? "w-11 flex-col gap-0.5 rounded-xl border py-1.5 text-sm" : "h-8 gap-1 rounded-full border px-3 text-xs",
        state.hasUpvoted
          ? "border-primary/30 bg-primary-soft text-primary"
          : "border-line bg-surface text-muted hover:border-line-strong hover:text-fg",
        className,
      )}
    >
      <ChevronUp className={cn(vertical ? "size-4" : "size-3.5", "transition-transform", state.hasUpvoted && "-translate-y-px")} strokeWidth={2.25} />
      <span>{formatCompact(state.upvotes)}</span>
    </button>
  );
}
