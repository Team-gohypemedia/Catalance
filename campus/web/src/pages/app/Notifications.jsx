import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BellOff, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { cn, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/primitives";
import { EmptyState, ErrorState, PageHeader } from "@/components/ui/campus";
import { NOTIF_META } from "@/components/community/constants";

/** UI copy stays emoji-free even if a notification body contains one. */
const clean = (s) => String(s || "").replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "").replace(/\s{2,}/g, " ").trim();

const isToday = (d) => new Date(d).toDateString() === new Date().toDateString();

export default function Notifications() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["notifications"], queryFn: () => api.get("/api/notifications") });

  const markLocal = (fn) => qc.setQueryData(["notifications"], (prev) => (Array.isArray(prev) ? prev.map(fn) : prev));

  const readAll = useMutation({
    mutationFn: () => api.post("/api/notifications/read-all"),
    onMutate: () => markLocal((n) => ({ ...n, read: true })),
    onSuccess: () => toast.success("All caught up"),
    onError: (e) => toast.error(e.message),
    onSettled: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const open = (n) => {
    if (!n.read) {
      markLocal((x) => (x.id === n.id ? { ...x, read: true } : x));
      api
        .post(`/api/notifications/${n.id}/read`)
        .catch(() => {})
        .finally(() => qc.invalidateQueries({ queryKey: ["notifications"] }));
    }
    if (n.link) navigate(n.link);
  };

  const list = data || [];
  const unread = list.filter((n) => !n.read).length;
  const groups = [
    ["Today", list.filter((n) => isToday(n.createdAt))],
    ["Earlier", list.filter((n) => !isToday(n.createdAt))],
  ].filter(([, items]) => items.length);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        description={unread ? `${unread} new since you last checked.` : "You're all caught up."}
        actions={
          <Button variant="outline" size="sm" leftIcon={CheckCheck} disabled={!unread} loading={readAll.isPending} onClick={() => readAll.mutate()}>
            Mark all read
          </Button>
        }
      />
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !list.length ? (
        <EmptyState icon={BellOff} title="Nothing here yet" description="Replies to your doubts, gig updates and rank changes will show up here." />
      ) : (
        <div className="space-y-8">
          {groups.map(([label, items]) => (
            <section key={label}>
              <p className="mb-3 px-1 text-xs text-muted">{label}</p>
              <ul className="overflow-hidden rounded-2xl border border-line bg-surface">
                {items.map((n, i) => {
                  const meta = NOTIF_META[n.type] || NOTIF_META.SYSTEM;
                  const Icon = meta.icon;
                  return (
                    <motion.li key={n.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.03 }} className="border-b border-line last:border-0">
                      <button
                        onClick={() => open(n)}
                        className={cn("flex w-full cursor-pointer items-start gap-4 p-4 text-left transition-colors hover:bg-surface-2/60 sm:px-6 sm:py-5", !n.read && "bg-primary-soft/30")}
                      >
                        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-2", n.read ? "text-muted" : "text-primary")}>
                          <Icon className="size-4" strokeWidth={1.75} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-3">
                            <span className={cn("text-sm", n.read ? "text-fg/80" : "font-medium")}>{clean(n.title)}</span>
                            <span className="shrink-0 text-xs text-subtle">{timeAgo(n.createdAt)}</span>
                          </span>
                          {n.body && <span className="mt-0.5 line-clamp-2 block text-sm text-muted">{clean(n.body)}</span>}
                          <span className="mt-1.5 block text-[11px] text-subtle">{meta.label}</span>
                        </span>
                        {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                      </button>
                    </motion.li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
