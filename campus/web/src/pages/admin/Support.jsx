import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Headset, UserCheck } from "lucide-react";
import { api, qs } from "@/lib/api/client";
import { timeAgo } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge, Field, Select, Skeleton, Textarea } from "@/components/ui/primitives";
import { EmptyState, ErrorState } from "@/components/ui/campus";
import { AdminHeader, Drawer, Panel, SectionLabel } from "@/components/admin/kit";
import { PRIORITY_TONE, TICKET_CATEGORIES, TICKET_STATUS, TicketStatus, TicketThread, categoryLabel } from "@/components/support/ticket-kit";

const PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"];
const cap = (s) => s.charAt(0) + s.slice(1).toLowerCase().replace("_", " ");

/** Staff support queue (spec §11): ADMIN, PROJECT_MANAGER, FINANCE. Changes are audited by the API. */
export default function Support() {
  const [filters, setFilters] = useState({ status: "", category: "" });
  const [openId, setOpenId] = useState(null);
  const { data: tickets, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-support", filters],
    queryFn: () => api.get(`/api/admin/support/tickets${qs(filters)}`),
  });
  const current = tickets?.find((t) => t.id === openId) || null;
  const openCount = tickets?.filter((t) => !["RESOLVED", "CLOSED"].includes(t.status)).length ?? 0;

  return (
    <div>
      <AdminHeader title="Support" description={tickets ? `${openCount} open · complaints and disputes first` : "Tickets, complaints and disputes."} />

      <div className="mb-4 flex flex-wrap gap-3">
        <Select aria-label="Status" className="h-10 w-44" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All statuses</option>
          {Object.entries(TICKET_STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </Select>
        <Select aria-label="Topic" className="h-10 w-52" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
          <option value="">All topics</option>
          {TICKET_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      </div>

      <Panel flush>
        {isLoading ? (
          <div className="space-y-2 p-5">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : error ? (
          <ErrorState error={error} onRetry={refetch} className="border-0" />
        ) : tickets.length === 0 ? (
          <EmptyState icon={Headset} title="No tickets" description="Nothing matches these filters." className="border-0" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-line text-left text-xs text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Ticket</th>
                  <th className="px-3 py-3 font-medium">From</th>
                  <th className="px-3 py-3 font-medium">Priority</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {tickets.map((t) => (
                  <tr key={t.id} className="cursor-pointer transition-colors hover:bg-surface-2" onClick={() => setOpenId(t.id)}>
                    <td className="max-w-xs px-5 py-3">
                      <button type="button" className="block max-w-full truncate text-left font-medium text-fg hover:text-primary" onClick={() => setOpenId(t.id)}>
                        {t.subject}
                      </button>
                      <p className="text-xs text-muted">{categoryLabel(t.category)}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="truncate">{t.user?.name}</p>
                      <p className="truncate text-xs text-muted">{t.user?.email}</p>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={PRIORITY_TONE[t.priority]}>{cap(t.priority)}</Badge>
                    </td>
                    <td className="px-3 py-3">
                      <TicketStatus status={t.status} />
                    </td>
                    <td className="px-5 py-3 text-right text-xs whitespace-nowrap text-muted">{timeAgo(t.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <TicketDrawer ticket={current} onClose={() => setOpenId(null)} />
    </div>
  );
}

function TicketDrawer({ ticket, onClose }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);
  const [resolution, setResolution] = useState("");
  useEffect(() => {
    setReply("");
    setInternal(false);
    setResolution(ticket?.resolution || "");
  }, [ticket?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-support"] });
  const send = useMutation({
    mutationFn: () => api.post(`/api/support/tickets/${ticket.id}/messages`, { body: reply, internal }),
    onSuccess: () => {
      setReply("");
      refresh();
      toast.success(internal ? "Note added" : "Reply sent");
    },
    onError: (e) => toast.error(e.message),
  });
  const patch = useMutation({
    mutationFn: (body) => api.patch(`/api/admin/support/tickets/${ticket.id}`, body),
    onSuccess: () => {
      refresh();
      toast.success("Ticket updated");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Drawer open={Boolean(ticket)} onOpenChange={(o) => !o && onClose()} title={ticket?.subject} description={ticket ? `${categoryLabel(ticket.category)} · ${ticket.user?.name}` : ""} size="xl">
      {ticket && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Status" htmlFor="tk-status">
              <Select id="tk-status" value={ticket.status} disabled={patch.isPending} onChange={(e) => patch.mutate({ status: e.target.value, ...(e.target.value === "RESOLVED" && resolution ? { resolution } : {}) })}>
                {Object.entries(TICKET_STATUS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Priority" htmlFor="tk-priority">
              <Select id="tk-priority" value={ticket.priority} disabled={patch.isPending} onChange={(e) => patch.mutate({ priority: e.target.value })}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {cap(p)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Owner">
              {ticket.ownerId === user?.id ? (
                <p className="flex h-11 items-center gap-1.5 text-sm text-muted">
                  <UserCheck className="size-4" /> You
                </p>
              ) : (
                <Button variant="outline" className="h-11 w-full" disabled={patch.isPending} onClick={() => patch.mutate({ ownerId: user.id })}>
                  {ticket.ownerId ? "Take over" : "Assign to me"}
                </Button>
              )}
            </Field>
          </div>

          <div>
            <SectionLabel>Conversation</SectionLabel>
            <TicketThread ticket={ticket} viewerId={user?.id} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!reply.trim()) return toast.error("Write a message.");
              send.mutate();
            }}
          >
            <label htmlFor="staff-reply" className="text-sm font-medium">
              Reply
            </label>
            <Textarea id="staff-reply" className="mt-1.5" value={reply} onChange={(e) => setReply(e.target.value)} />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-muted">
                <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} className="size-4 accent-primary" />
                Internal note (student won't see it)
              </label>
              <Button type="submit" loading={send.isPending}>
                {internal ? "Add note" : "Send reply"}
              </Button>
            </div>
          </form>

          <div className="border-t border-line pt-5">
            <Field label="Resolution" htmlFor="tk-resolution" hint="Shown to the student when the ticket is resolved.">
              <Textarea id="tk-resolution" value={resolution} onChange={(e) => setResolution(e.target.value)} className="min-h-20" />
            </Field>
            <div className="mt-3 flex justify-end">
              <Button variant="brandOutline" loading={patch.isPending} disabled={!resolution.trim()} onClick={() => patch.mutate({ status: "RESOLVED", resolution })}>
                Resolve
              </Button>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}
