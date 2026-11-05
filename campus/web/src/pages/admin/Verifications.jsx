import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, ExternalLink, Link2, RotateCcw, ShieldOff } from "lucide-react";
import { api, qs } from "@/lib/api/client";
import { formatDate, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/primitives";
import { Avatar, Dialog, DialogContent } from "@/components/ui/overlays";
import { DataTable, Segmented } from "@/components/admin/DataTable";
import { AdminHeader, Drawer, KV, SectionLabel, Status } from "@/components/admin/kit";
import { VERIFICATION_STATUS, VerificationChip, levelLabel } from "@/components/assessment/meta";

const Student = ({ u }) => (
  <div className="flex min-w-0 items-center gap-3">
    <Avatar name={u?.name} src={u?.avatarUrl} size="sm" />
    <div className="min-w-0">
      <p className="truncate font-medium">{u?.name || "Student"}</p>
      <p className="truncate text-xs text-muted">{u?.college?.shortName || "—"}</p>
    </div>
  </div>
);

/** Approve (note optional) or revoke / reinstate (reason required). */
function ActionDialog({ action, onClose }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const cfg = {
    approve: { title: "Approve verification", description: "Issues the skill badge and notifies the student. Logged in the audit log.", label: "Approve", path: `/api/admin/attempts/${action.row.id}/verify`, body: () => ({ note: text.trim() || undefined }), required: false, field: "Note (optional)" },
    revoke: { title: "Revoke badge", description: "The badge stops showing as verified and the student is told why. Logged in the audit log.", label: "Revoke", path: `/api/admin/verifications/${action.row.id}/revoke`, body: () => ({ reason: text.trim() }), required: true, field: "Reason" },
    reinstate: { title: "Reinstate badge", description: "The badge becomes active again. Logged in the audit log.", label: "Reinstate", path: `/api/admin/verifications/${action.row.id}/reinstate`, body: () => ({ reason: text.trim() }), required: true, field: "Reason" },
  }[action.kind];
  const send = useMutation({
    mutationFn: () => api.post(cfg.path, cfg.body()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "verifications"] });
      toast.success(action.kind === "approve" ? "Verified. The badge is live." : action.kind === "revoke" ? "Badge revoked." : "Badge reinstated.");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="sm" title={cfg.title} description={cfg.description}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (cfg.required && text.trim().length < 5) return toast.error("Add a reason (at least 5 characters).");
            send.mutate();
          }}
        >
          <Field label={cfg.field} htmlFor="va-text">
            <Textarea id="va-text" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant={action.kind === "revoke" ? "danger" : "primary"} loading={send.isPending}>
              {cfg.label}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PendingDrawer({ row, onClose, onApprove }) {
  const ob = row.onboarding || {};
  return (
    <Drawer
      open
      onOpenChange={(o) => !o && onClose()}
      title={row.user?.name}
      description={`${row.course?.title} · ${levelLabel(row.course?.level)}`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" to={`/admin/evaluations/${row.id}`}>
            Open attempt
          </Button>
          <Button leftIcon={BadgeCheck} onClick={onApprove}>
            Approve
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <KV label="Skill">{row.course?.skill?.name || "Not linked"}</KV>
          <KV label="Score">{row.totalScore}/100 · rubric v{row.rubricVersion}</KV>
          <KV label="Evaluator">{row.evaluator?.name || "—"}</KV>
          <KV label="Passed">{formatDate(row.reviewedAt)}</KV>
        </div>
        <div>
          <SectionLabel>Onboarding</SectionLabel>
          <KV label="Portfolio">
            <a href={ob.portfolioUrl} target="_blank" rel="noreferrer" className="break-all text-primary hover:underline">
              {ob.portfolioUrl}
            </a>
          </KV>
          <KV label="Identity">{ob.identityConfirmed ? "Confirmed" : "Not confirmed"}</KV>
          <KV label="Payout details">{ob.payoutReady ? "Ready" : "Not yet"}</KV>
          <KV label="Availability">{ob.availabilityConfirmed ? ob.availabilityNote || "Confirmed" : "Not confirmed"}</KV>
          <KV label="Sent">{formatDate(ob.submittedAt)}</KV>
        </div>
        <div>
          <SectionLabel>Submission</SectionLabel>
          {(row.submission?.links || []).map((l) => (
            <a key={l} href={l} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm break-all text-primary hover:underline">
              <Link2 className="size-4 shrink-0" /> {l}
            </a>
          ))}
        </div>
      </div>
    </Drawer>
  );
}

function VerificationDrawer({ v, onClose, onAction }) {
  return (
    <Drawer
      open
      onOpenChange={(o) => !o && onClose()}
      title={`${v.skill?.name} · ${levelLabel(v.level)}`}
      description={v.user?.name}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" leftIcon={ExternalLink} href={`/verify/skill/${v.verifyCode}`} target="_blank" rel="noreferrer">
            Public page
          </Button>
          {v.status === "ACTIVE" || v.status === "EXPIRED" ? (
            <Button variant="danger" leftIcon={ShieldOff} onClick={() => onAction("revoke")}>
              Revoke
            </Button>
          ) : null}
          {v.status === "REVOKED" || v.status === "EXPIRED" ? (
            <Button leftIcon={RotateCcw} onClick={() => onAction("reinstate")}>
              Reinstate
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <KV label="Status">
            <VerificationChip status={v.status} />
          </KV>
          <KV label="Awarded">{formatDate(v.awardedAt)}</KV>
          <KV label="Expires">{v.expiresAt ? formatDate(v.expiresAt) : "No expiry"}</KV>
          <KV label="Course">{v.course?.title || "—"}</KV>
          <KV label="Rubric">Version {v.rubricVersion ?? "—"}</KV>
          <KV label="Approved by">{v.approvedBy?.name || "—"}</KV>
          <KV label="Code">
            <span className="font-mono text-xs">{v.verifyCode}</span>
          </KV>
          {v.revokedReason && <KV label="Revoked because">{v.revokedReason}</KV>}
        </div>
        <div>
          <SectionLabel>Evidence</SectionLabel>
          {v.evidence.map((e) => (
            <a key={e.url + e.label} href={e.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm break-all text-primary hover:underline">
              <Link2 className="size-4 shrink-0" /> {e.label}
            </a>
          ))}
        </div>
        <div>
          <SectionLabel>Status history</SectionLabel>
          <ol className="space-y-2">
            {(v.history || []).map((h, i) => (
              <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <Status tone={VERIFICATION_STATUS[h.status]?.tone}>{VERIFICATION_STATUS[h.status]?.label || h.status}</Status>
                <span className="text-muted">{h.reason}</span>
                <span className="ml-auto text-xs text-subtle">{formatDate(h.at)}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Drawer>
  );
}

export default function AdminVerifications() {
  const [view, setView] = useState("PENDING");
  const [open, setOpen] = useState(null);
  const [action, setAction] = useState(null);
  const pending = view === "PENDING";
  const list = useQuery({
    queryKey: ["admin", "verifications", view],
    queryFn: () => api.get(`/api/admin/verifications${qs(pending ? { pending: 1 } : { status: view === "ALL" ? "" : view })}`),
  });
  const pendingCount = useQuery({ queryKey: ["admin", "verifications", "PENDING"], queryFn: () => api.get("/api/admin/verifications?pending=1"), enabled: !pending });
  const count = pending ? list.data?.length : pendingCount.data?.length;

  const pendingColumns = [
    { id: "student", header: "Student", sortValue: (r) => r.user?.name || "", cell: (r) => <Student u={r.user} /> },
    { id: "skill", header: "Skill", sortValue: (r) => r.course?.skill?.name || "", cell: (r) => <div className="min-w-0"><p className="truncate">{r.course?.skill?.name || <span className="text-warning">No skill linked</span>}</p><p className="truncate text-xs text-muted">{levelLabel(r.course?.level)} · {r.course?.title}</p></div> },
    { id: "score", header: "Score", align: "right", sortValue: (r) => r.totalScore, cell: (r) => <span className="tabular-nums">{r.totalScore}/100</span> },
    { id: "sent", header: "Onboarding", align: "right", sortValue: (r) => r.onboarding?.submittedAt || "", cell: (r) => <span className="text-xs text-muted">{timeAgo(r.onboarding?.submittedAt)}</span> },
    {
      id: "action",
      header: <span className="sr-only">Action</span>,
      align: "right",
      hideOnMobile: true,
      cell: (r) => (
        <Button size="sm" variant="outline" onClick={(e) => (e.stopPropagation(), setAction({ kind: "approve", row: r }))}>
          Approve
        </Button>
      ),
    },
  ];
  const columns = [
    { id: "student", header: "Student", sortValue: (v) => v.user?.name || "", cell: (v) => <Student u={v.user} /> },
    { id: "skill", header: "Skill", sortValue: (v) => v.skill?.name || "", cell: (v) => <div className="min-w-0"><p className="truncate">{v.skill?.name}</p><p className="truncate text-xs text-muted">{levelLabel(v.level)}</p></div> },
    { id: "status", header: "Status", sortValue: (v) => v.status, cell: (v) => <VerificationChip status={v.status} /> },
    { id: "awarded", header: "Awarded", align: "right", sortValue: (v) => v.awardedAt, cell: (v) => <span className="text-xs text-muted">{formatDate(v.awardedAt)}</span> },
    {
      id: "action",
      header: <span className="sr-only">Action</span>,
      align: "right",
      hideOnMobile: true,
      cell: (v) =>
        v.status === "REVOKED" ? (
          <Button size="sm" variant="ghost" onClick={(e) => (e.stopPropagation(), setAction({ kind: "reinstate", row: v }))}>
            Reinstate
          </Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={(e) => (e.stopPropagation(), setAction({ kind: "revoke", row: v }))}>
            Revoke
          </Button>
        ),
    },
  ];

  return (
    <>
      <AdminHeader title="Verifications" description="Approve skill badges for students who passed and finished onboarding. Revoke or reinstate with a reason. Every change is logged." />
      <DataTable
        key={pending ? "pending" : "list"}
        data={list.data}
        loading={list.isLoading}
        error={list.error}
        onRetry={list.refetch}
        columns={pending ? pendingColumns : columns}
        initialSort={pending ? { id: "sent" } : { id: "awarded", desc: true }}
        onRowClick={setOpen}
        search={{ placeholder: "Search student or skill…", text: (r) => [r.user?.name, r.skill?.name, r.course?.skill?.name, r.course?.title].join(" ") }}
        toolbar={
          <Segmented
            value={view}
            onChange={(v) => {
              setView(v);
              setOpen(null);
            }}
            label="Verification status"
            options={[
              { value: "PENDING", label: "To approve", count },
              { value: "ACTIVE", label: "Active" },
              { value: "REVOKED", label: "Revoked" },
              { value: "EXPIRED", label: "Expired" },
              { value: "ALL", label: "All" },
            ]}
          />
        }
        empty={{ title: pending ? "Nothing to approve" : "No badges here", description: pending ? "Passed students who finish onboarding show up here." : "Try another filter." }}
      />
      {open && pending && <PendingDrawer row={open} onClose={() => setOpen(null)} onApprove={() => setAction({ kind: "approve", row: open })} />}
      {open && !pending && <VerificationDrawer v={open} onClose={() => setOpen(null)} onAction={(kind) => setAction({ kind, row: open })} />}
      {action && (
        <ActionDialog
          action={action}
          onClose={() => {
            setAction(null);
            setOpen(null);
          }}
        />
      )}
    </>
  );
}
