import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, CheckCheck, ExternalLink, FolderKanban, IndianRupee, X } from "lucide-react";
import { api, qs } from "@/lib/api/client";
import { formatINR, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/primitives";
import { Avatar } from "@/components/ui/overlays";
import { DivisionBadge } from "@/components/ui/campus";
import { DataTable, Segmented } from "@/components/admin/DataTable";
import { AdminHeader, APP_STATUS, CompanyMark, Drawer, KV, SectionLabel, StagePill, StatusBadge } from "@/components/admin/kit";

const TABS = ["APPLIED", "ACCEPTED", "SUBMITTED", "APPROVED", "PAID", "REJECTED"];

/** Which moves make sense from each status. */
const ACTIONS = {
  APPLIED: [
    { to: "ACCEPTED", label: "Accept", icon: Check, variant: "primary" },
    { to: "REJECTED", label: "Reject", icon: X, variant: "outline" },
  ],
  ACCEPTED: [
    { to: "APPROVED", label: "Approve work", icon: CheckCheck, variant: "primary" },
    { to: "REJECTED", label: "Reject", icon: X, variant: "outline" },
  ],
  SUBMITTED: [
    { to: "APPROVED", label: "Approve work", icon: CheckCheck, variant: "primary" },
    { to: "REJECTED", label: "Reject", icon: X, variant: "outline" },
  ],
  APPROVED: [{ to: "PAID", label: "Mark paid", icon: IndianRupee, variant: "primary" }],
  PAID: [],
  REJECTED: [{ to: "APPLIED", label: "Move back to review", icon: Check, variant: "outline" }],
};

const SUCCESS = {
  ACCEPTED: "Accepted. The student has been notified.",
  REJECTED: "Rejected with a kind note.",
  APPROVED: "Approved: points awarded and a verified portfolio item added.",
  PAID: "Paid. The wallet has been credited.",
  APPLIED: "Moved back to review.",
};

function ApplicationDrawer({ app, onClose }) {
  const qc = useQueryClient();
  const [feedback, setFeedback] = useState(app?.feedback || "");
  const mutate = useMutation({
    mutationFn: (status) => api.post(`/api/admin/gig-applications/${app.id}/status`, { status, ...(feedback.trim() ? { feedback: feedback.trim() } : {}) }),
    onSuccess: (_res, status) => {
      qc.invalidateQueries({ queryKey: ["admin", "gig-applications"] });
      qc.invalidateQueries({ queryKey: ["admin", "overview"] });
      qc.invalidateQueries({ queryKey: ["admin", "students"] });
      toast.success(SUCCESS[status]);
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });
  if (!app) return null;
  const { gig, user } = app;
  const actions = ACTIONS[app.status] || [];
  const payout = gig?.payoutINR || 0;

  return (
    <Drawer
      open
      onOpenChange={(o) => !o && onClose()}
      size="lg"
      title={gig?.title || "Gig application"}
      description={`Applied ${timeAgo(app.createdAt)} · updated ${timeAgo(app.updatedAt || app.createdAt)}`}
      footer={
        actions.length ? (
          <div className="flex flex-wrap justify-end gap-2">
            {actions.map((a) => (
              <Button key={a.to} variant={a.variant} leftIcon={a.icon} loading={mutate.isPending && mutate.variables === a.to} disabled={mutate.isPending} onClick={() => mutate.mutate(a.to)}>
                {a.label}
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-muted">Paid out. Nothing left to do here.</p>
        )
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <StatusBadge status={app.status} />
          {gig && <span className="text-lg font-medium text-fg tabular-nums">{formatINR(payout)}</span>}
        </div>

        {user && (
          <section className="rounded-xl border border-line p-4">
            <div className="flex items-center gap-3">
              <Avatar name={user.name} src={user.avatarUrl} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted">{user.college?.name || "No college"}</p>
              </div>
              <Button variant="ghost" size="sm" to={`/u/${user.username}`} target="_blank" rightIcon={ExternalLink}>
                Passport
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3 text-xs">
              <StagePill stage={user.ladderStage} />
              <DivisionBadge division={user.division} size="sm" />
              <span className="text-muted">Earned {formatINR(user.lifetimeEarnedINR)}</span>
            </div>
          </section>
        )}

        <section>
          <SectionLabel>Pitch</SectionLabel>
          <blockquote className="rounded-xl border-l-2 border-line-strong bg-surface-2/50 px-4 py-3 text-sm leading-relaxed text-fg/90">{app.pitch || <span className="text-muted">No pitch written.</span>}</blockquote>
        </section>

        {(app.submissionLink || app.submissionNote) && (
          <section>
            <SectionLabel>Submission</SectionLabel>
            <div className="space-y-2 rounded-xl border border-line p-4 text-sm">
              {app.submissionLink && (
                <a href={app.submissionLink} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1.5 font-medium break-all text-primary hover:underline">
                  <ExternalLink className="size-4 shrink-0" /> {app.submissionLink}
                </a>
              )}
              {app.submissionNote && <p className="leading-relaxed text-muted">{app.submissionNote}</p>}
            </div>
          </section>
        )}

        {gig && (
          <section>
            <SectionLabel>Gig</SectionLabel>
            <div className="rounded-xl border border-line px-4 py-1">
              <KV label="Client">
                <span className="inline-flex items-center gap-2">
                  <CompanyMark company={gig.company} size="sm" /> {gig.company?.name}
                </span>
              </KV>
              <KV label="Payout">{formatINR(payout)}</KV>
              <KV label="Duration">{gig.durationDays} days</KV>
              <KV label="Difficulty"><span className="capitalize">{gig.difficulty?.toLowerCase()}</span></KV>
              {gig.mentor && <KV label="Mentor">{gig.mentor.name}</KV>}
              {gig.deliverables?.length > 0 && (
                <div className="py-2.5 text-sm">
                  <p className="mb-1.5 text-muted">Deliverables</p>
                  <ul className="list-disc space-y-1 pl-5">
                    {gig.deliverables.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {app.status === "APPROVED" && (
          <p className="rounded-xl border border-line bg-surface-2/50 p-4 text-sm text-muted">
            Marking paid credits {formatINR(payout)} as a gig earning. If {user?.name?.split(" ")[0] || "the student"} still owes course fees, 20% goes to fees automatically.
          </p>
        )}

        {actions.length > 0 && (
          <Field label="Feedback (optional)" htmlFor="app-feedback" hint="Sent to the student with the status update.">
            <Textarea id="app-feedback" rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Great colour choices. Next time, export at 1080×1080." />
          </Field>
        )}
        {!actions.length && app.feedback && (
          <section>
            <SectionLabel>Feedback sent</SectionLabel>
            <p className="text-sm text-muted">{app.feedback}</p>
          </section>
        )}
      </div>
    </Drawer>
  );
}

export default function Applications() {
  const [status, setStatus] = useState("SUBMITTED");
  const [openId, setOpenId] = useState(null);
  const list = useQuery({ queryKey: ["admin", "gig-applications", status], queryFn: () => api.get(`/api/admin/gig-applications${qs({ status })}`) });
  const all = useQuery({ queryKey: ["admin", "gig-applications", "ALL"], queryFn: () => api.get("/api/admin/gig-applications") });
  const counts = Object.fromEntries(TABS.map((t) => [t, (all.data || []).filter((a) => a.status === t).length]));
  const selected = (list.data || []).find((a) => a.id === openId) || null;

  const columns = [
    {
      id: "student",
      header: "Student",
      sortValue: (a) => a.user?.name || "",
      cell: (a) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={a.user?.name} src={a.user?.avatarUrl} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium">{a.user?.name || "Unknown student"}</p>
            <p className="truncate text-xs text-muted">{a.user?.college?.shortName || a.user?.college?.name || "—"}</p>
          </div>
        </div>
      ),
    },
    {
      id: "gig",
      header: "Gig",
      sortValue: (a) => a.gig?.title || "",
      cell: (a) => (
        <div className="flex min-w-0 items-center gap-2">
          <CompanyMark company={a.gig?.company} size="sm" />
          <span className="truncate text-fg/90 md:max-w-60">{a.gig?.title}</span>
        </div>
      ),
    },
    { id: "payout", header: "Payout", align: "right", sortValue: (a) => a.gig?.payoutINR || 0, cell: (a) => <span className="tabular-nums">{formatINR(a.gig?.payoutINR)}</span> },
    { id: "stage", header: "Stage", hideOnMobile: true, sortValue: (a) => a.user?.ladderStage || 0, cell: (a) => <StagePill stage={a.user?.ladderStage} /> },
    { id: "status", header: "Status", sortValue: (a) => a.status, cell: (a) => <StatusBadge status={a.status} /> },
    { id: "updated", header: "Updated", align: "right", sortValue: (a) => a.updatedAt || a.createdAt, cell: (a) => <span className="text-xs whitespace-nowrap text-muted">{timeAgo(a.updatedAt || a.createdAt)}</span> },
  ];

  return (
    <>
      <AdminHeader
        title="Gig applications"
        description="Accept applicants, review submitted work, approve and pay. Every move notifies the student."
        actions={
          <Button variant="outline" size="sm" to="/admin/gigs">
            Manage gigs
          </Button>
        }
      />
      <DataTable
        data={list.data}
        loading={list.isLoading}
        error={list.error}
        onRetry={list.refetch}
        columns={columns}
        initialSort={{ id: "updated", desc: true }}
        onRowClick={(a) => setOpenId(a.id)}
        search={{ placeholder: "Search student or gig…", text: (a) => [a.user?.name, a.user?.college?.name, a.gig?.title, a.gig?.company?.name].join(" ") }}
        toolbar={<Segmented value={status} onChange={setStatus} label="Application status" options={TABS.map((t) => ({ value: t, label: APP_STATUS[t].label, count: all.data ? counts[t] : undefined }))} />}
        empty={{ icon: FolderKanban, title: `No ${APP_STATUS[status].label.toLowerCase()} applications`, description: "The queue is clear. Time for a chai break." }}
      />
      {selected && <ApplicationDrawer key={selected.id} app={selected} onClose={() => setOpenId(null)} />}
    </>
  );
}
