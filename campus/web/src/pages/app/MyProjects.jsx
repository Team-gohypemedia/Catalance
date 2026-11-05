import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock, FolderOpen } from "lucide-react";
import { api } from "@/lib/api/client";
import { cn, formatDate, formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/primitives";
import { EmptyState, ErrorState, PageHeader } from "@/components/ui/campus";
import { OfferChip, PayoutChip } from "@/components/projects/parts";
import { skillLine } from "@/components/projects/meta";

const TABS = [
  { key: "active", label: "Active" },
  { key: "open", label: "Offers" },
  { key: "past", label: "Past" },
];

const EMPTY = {
  active: { title: "No active projects", description: "Projects you accept show up here with their milestones and deliveries." },
  open: { title: "No open offers", description: "New offers from your PM will appear here." },
  past: { title: "Nothing here yet", description: "Completed, declined and expired offers are kept here." },
};

/** My projects (spec §4.2): active work first, then open offers, then history. */
export default function MyProjects() {
  const [tab, setTab] = useState("active");
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["my-offers", "all"], queryFn: () => api.get("/api/me/offers") });

  const buckets = {
    active: (data || []).filter((o) => ["ACCEPTED", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED", "ON_HOLD", "DISPUTED"].includes(o.status)),
    open: (data || []).filter((o) => o.status === "OFFERED"),
    past: (data || []).filter((o) => ["COMPLETED", "CANCELLED", "DECLINED", "EXPIRED", "WITHDRAWN"].includes(o.status)),
  };
  const list = buckets[tab];

  return (
    <div>
      <PageHeader eyebrow="Work" title="My projects" description="Track milestones, submit work and see payout status." />

      <div role="tablist" aria-label="Project filter" className="mb-6 inline-flex rounded-full border border-line bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "cursor-pointer rounded-full px-4 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none",
              tab === t.key ? "bg-primary text-primary-fg" : "text-muted hover:text-fg",
            )}
          >
            {t.label}
            {data && <span className="ml-1.5 tabular-nums opacity-80">{buckets[t.key].length}</span>}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !list.length ? (
        <EmptyState
          icon={FolderOpen}
          title={EMPTY[tab].title}
          description={EMPTY[tab].description}
          action={
            <Button variant="outline" to="/app/opportunities">
              Explore opportunities
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {list.map((o) => {
            const next = o.milestones?.find((m) => m.status !== "APPROVED");
            return (
              <li key={o.id}>
                <Card interactive className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:gap-6">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <OfferChip offer={o} />
                      {["COMPLETED", "ACCEPTED", "IN_PROGRESS", "SUBMITTED"].includes(o.status) && o.payoutStatus !== "NOT_DUE" && <PayoutChip status={o.payoutStatus} />}
                    </div>
                    <Link to={`/app/projects/${o.id}`} className="mt-2 block truncate text-base font-medium tracking-tight hover:underline">
                      {o.title}
                    </Link>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                      <span>{skillLine(o)}</span>
                      {next ? (
                        <span className={cn("inline-flex items-center gap-1", next.overdue && "text-danger")}>
                          <CalendarClock className="size-3.5" /> {next.title} · {formatDate(next.dueAt)}
                        </span>
                      ) : (
                        o.deadline && (
                          <span className="inline-flex items-center gap-1">
                            <CalendarClock className="size-3.5" /> Due {formatDate(o.deadline)}
                          </span>
                        )
                      )}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <span className="text-lg font-medium tracking-tight tabular-nums">{formatINR(o.payoutINR)}</span>
                    <Button size="sm" variant="outline" to={`/app/projects/${o.id}`} rightIcon={ArrowRight}>
                      View project
                    </Button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
