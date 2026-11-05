/**
 * Audit log (spec §3 Admin, §10 AuditLog, §15): who changed what, when, and why.
 * Filters by area, action, actor and date; each row opens a before/after diff. CSV export for audits.
 */
import { useMemo, useState } from "react";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, RotateCcw, ScrollText } from "lucide-react";
import { qs, api } from "@/lib/api/client";
import { formatDate, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Skeleton } from "@/components/ui/primitives";
import { Avatar } from "@/components/ui/overlays";
import { EmptyState, ErrorState } from "@/components/ui/campus";
import { AdminHeader, Drawer, KV, Panel, SectionLabel, Status, Tag } from "@/components/admin/kit";
import { downloadCsv } from "@/components/admin/csv-download";

/** Areas map to audit entities; "action" filters by prefix (e.g. "order." = every payment action). */
const AREAS = [
  { value: "", label: "All areas" },
  { value: "order.", label: "Payments and refunds" },
  { value: "assessment.", label: "Assessment results" },
  { value: "verification.", label: "Verifications" },
  { value: "offer.", label: "Project offers" },
  { value: "payout.", label: "Payouts" },
  { value: "finance.", label: "Finance splits" },
  { value: "user.", label: "Access and roles" },
  { value: "settings.", label: "Settings" },
  { value: "course.", label: "Courses" },
  { value: "support.", label: "Support" },
  { value: "report.", label: "Report exports" },
];

const TONE = [
  [/revoke|refund|suspend|fail|delete|unverify|dispute/, "danger"],
  [/result|appeal|status|split|adjust/, "warning"],
  [/approve|verify|paid|payout|create|role/, "success"],
  [/settings|export/, "violet"],
];
const toneFor = (action = "") => TONE.find(([re]) => re.test(action))?.[1] || "neutral";
const ROLE_LABEL = { ADMIN: "Admin", FINANCE: "Finance", PROJECT_MANAGER: "Project manager", EVALUATOR: "Evaluator", MENTOR: "Instructor", STUDENT: "Student" };
const pretty = (action = "") => action.replace(/[._]/g, " ").replace(/^\w/, (c) => c.toUpperCase());

const show = (v) => {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
};

/** Field-level before/after rows: changed fields first. */
function diffRows(before, after) {
  const b = before && typeof before === "object" ? before : {};
  const a = after && typeof after === "object" ? after : {};
  const keys = [...new Set([...Object.keys(b), ...Object.keys(a)])];
  return keys
    .map((k) => ({ key: k, before: b[k], after: a[k], changed: JSON.stringify(b[k]) !== JSON.stringify(a[k]) }))
    .sort((x, y) => Number(y.changed) - Number(x.changed));
}

function DiffTable({ before, after }) {
  const rows = diffRows(before, after);
  if (!rows.length) return <p className="text-sm text-muted">No field details were recorded.</p>;
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-2/60 text-xs text-muted">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">Field</th>
            <th scope="col" className="px-3 py-2 font-medium">Before</th>
            <th scope="col" className="px-3 py-2 font-medium">After</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => (
            <tr key={r.key} className="align-top">
              <td className="px-3 py-2 font-mono text-xs text-muted">{r.key}</td>
              <td className={r.changed ? "px-3 py-2 break-all text-danger line-through decoration-danger/40" : "px-3 py-2 break-all text-muted"}>{show(r.before)}</td>
              <td className={r.changed ? "px-3 py-2 break-all font-medium text-success" : "px-3 py-2 break-all text-muted"}>{show(r.after)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EntryDrawer({ entry, onClose }) {
  return (
    <Drawer open onOpenChange={(o) => !o && onClose()} size="lg" title={pretty(entry.action)} description={`${formatDate(entry.createdAt, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}`}>
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <KV label="Actor">{entry.actor ? `${entry.actor.name} (${ROLE_LABEL[entry.actorRole] || entry.actorRole || "—"})` : "System"}</KV>
          <KV label="Action">
            <Status tone={toneFor(entry.action)}>{entry.action}</Status>
          </KV>
          <KV label="Record">
            {entry.entity} <span className="font-mono text-xs text-muted">{entry.entityId || ""}</span>
          </KV>
          <KV label="IP">{entry.ip || "—"}</KV>
        </div>
        {entry.reason && (
          <div>
            <SectionLabel>Reason</SectionLabel>
            <p className="rounded-xl bg-surface-2/60 px-4 py-3 text-sm text-fg">{entry.reason}</p>
          </div>
        )}
        <div>
          <SectionLabel>Before and after</SectionLabel>
          <DiffTable before={entry.before} after={entry.after} />
        </div>
      </div>
    </Drawer>
  );
}

const EMPTY = { action: "", actorId: "", from: "", to: "", entityId: "" };

export default function AdminAudit() {
  const [filters, setFilters] = useState(EMPTY);
  const [open, setOpen] = useState(null);
  const [exporting, setExporting] = useState(false);
  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const params = { action: filters.action, actorId: filters.actorId, from: filters.from, to: filters.to, entityId: filters.entityId.trim() };

  const q = useInfiniteQuery({
    queryKey: ["admin", "audit", params],
    queryFn: ({ pageParam }) => api.get(`/api/admin/audit${qs({ ...params, cursor: pageParam })}`),
    initialPageParam: undefined,
    getNextPageParam: (last) => last?.nextCursor || undefined,
    placeholderData: keepPreviousData,
  });
  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) || [], [q.data]);
  const actors = useMemo(() => {
    const m = new Map();
    for (const i of items) if (i.actor) m.set(i.actor.id, i.actor);
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);
  const filtered = Object.values(filters).some(Boolean);

  async function exportCsv() {
    setExporting(true);
    try {
      await downloadCsv(`/api/admin/audit${qs({ ...params, format: "csv" })}`, `campus-audit-${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success("Audit log downloaded");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <AdminHeader
        title="Audit log"
        description="Every privileged change: payments, results, verifications, offers, payouts and access."
        actions={
          <Button variant="outline" size="sm" leftIcon={Download} loading={exporting} onClick={exportCsv}>
            Export CSV
          </Button>
        }
      />

      <Panel bodyClassName="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-1.5">
          <Label htmlFor="au-area">Area</Label>
          <Select id="au-area" value={filters.action} onChange={set("action")}>
            {AREAS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="au-actor">Actor</Label>
          <Select id="au-actor" value={filters.actorId} onChange={set("actorId")}>
            <option value="">Anyone</option>
            {actors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="au-id">Record id</Label>
          <Input id="au-id" value={filters.entityId} onChange={set("entityId")} placeholder="e.g. ord_react_aarav" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="au-from">From</Label>
          <Input id="au-from" type="date" value={filters.from} onChange={set("from")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="au-to">To</Label>
          <Input id="au-to" type="date" value={filters.to} onChange={set("to")} />
        </div>
      </Panel>

      <Panel
        className="mt-5"
        title="Changes"
        description={q.isLoading ? "Loading…" : `${items.length}${q.hasNextPage ? "+" : ""} entries, newest first`}
        action={
          filtered && (
            <Button variant="ghost" size="sm" leftIcon={RotateCcw} onClick={() => setFilters(EMPTY)}>
              Clear filters
            </Button>
          )
        }
        flush
      >
        {q.error ? (
          <ErrorState error={q.error} onRetry={q.refetch} className="m-5" />
        ) : q.isLoading ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : !items.length ? (
          <EmptyState
            icon={ScrollText}
            title={filtered ? "Nothing matches these filters" : "No changes recorded yet"}
            description={filtered ? "Try a wider date range or another area." : "Admin, payment, assessment and verification changes show up here."}
            className="border-0 py-12"
          />
        ) : (
          <>
            <ul className="divide-y divide-line">
              {items.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => setOpen(e)}
                    className="flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-surface-2/50 focus-visible:bg-surface-2/50 focus-visible:outline-none"
                  >
                    <Avatar name={e.actor?.name || "System"} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-fg">{e.actor?.name || "System"}</span>
                        <Status tone={toneFor(e.action)}>{pretty(e.action)}</Status>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {e.entity} <span className="font-mono">{e.entityId}</span>
                        {e.reason ? ` · ${e.reason}` : ""}
                      </p>
                    </div>
                    <div className="hidden shrink-0 text-right sm:block">
                      {e.actorRole && <Tag>{ROLE_LABEL[e.actorRole] || e.actorRole}</Tag>}
                    </div>
                    <time className="shrink-0 pt-0.5 text-xs whitespace-nowrap text-subtle" dateTime={e.createdAt} title={formatDate(e.createdAt, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}>
                      {timeAgo(e.createdAt)}
                    </time>
                  </button>
                </li>
              ))}
            </ul>
            {q.hasNextPage && (
              <div className="border-t border-line p-4 text-center">
                <Button variant="outline" size="sm" loading={q.isFetchingNextPage} onClick={() => q.fetchNextPage()}>
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </Panel>

      {open && <EntryDrawer entry={open} onClose={() => setOpen(null)} />}
    </>
  );
}
