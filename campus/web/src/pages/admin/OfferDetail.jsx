import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, CircleSlash, Pause, Pencil, Play, RotateCcw, Scale, Undo2, UserSearch, X } from "lucide-react";
import { api } from "@/lib/api/client";
import { cn, formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Select, Skeleton, Textarea } from "@/components/ui/primitives";
import { Avatar, Dialog, DialogContent } from "@/components/ui/overlays";
import { EmptyState, ErrorState } from "@/components/ui/campus";
import { AdminHeader, KV, Panel, Status } from "@/components/admin/kit";
import { DeliveryList, MilestoneList, OfferBody, OfferFacts, Timeline } from "@/components/projects/parts";
import { PAYOUT_STATUS, SPLIT_BASIS_LABEL, dateTime, expiresIn, offerChip, skillLine } from "@/components/projects/meta";

/** Status moves a PM can make (mirrors STATUS_MOVES in api/src/services/projects.js). */
const MOVES = [
  { to: "IN_PROGRESS", from: ["ACCEPTED", "ON_HOLD", "DISPUTED"], label: (o) => (o.status === "ACCEPTED" ? "Start (kickoff done)" : "Resume"), icon: Play, note: false, variant: "primary" },
  { to: "ON_HOLD", from: ["ACCEPTED", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED"], label: () => "Put on hold", icon: Pause, note: true },
  { to: "DISPUTED", from: ["IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED", "ON_HOLD"], label: () => "Mark disputed", icon: Scale, note: true },
  { to: "COMPLETED", from: ["DISPUTED"], label: () => "Resolve as completed", icon: Check, note: true },
  { to: "WITHDRAWN", from: ["OFFERED"], label: () => "Withdraw offer", icon: Undo2, note: true, danger: true },
  { to: "CANCELLED", from: ["ACCEPTED", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED", "ON_HOLD", "DISPUTED"], label: () => "Cancel project", icon: X, note: true, danger: true },
];

/** One offer in the PM workspace (spec §5.3 steps 4–8): kickoff, milestones, review, client acceptance, history. */
export default function AdminOfferDetail() {
  const { offerId } = useParams();
  const qc = useQueryClient();
  const { data: o, isLoading, error, refetch } = useQuery({ queryKey: ["pm-offer", offerId], queryFn: () => api.get(`/api/pm/offers/${offerId}`) });

  const done = (msg) => (u) => {
    qc.setQueryData(["pm-offer", offerId], u);
    qc.invalidateQueries({ queryKey: ["pm-offers"] });
    qc.invalidateQueries({ queryKey: ["pm-talent"] });
    qc.invalidateQueries({ queryKey: ["finance-offers"] });
    toast.success(msg);
  };

  if (isLoading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-24" />
        <Skeleton className="h-96" />
      </div>
    );
  if (error?.status === 404)
    return <EmptyState icon={CircleSlash} title="Offer not found" description="It doesn't exist or isn't one of yours." action={<Button variant="outline" to="/admin/offers">Project offers</Button>} />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const chip = offerChip(o);
  const reofferable = ["DECLINED", "EXPIRED", "WITHDRAWN"].includes(o.status);
  const active = ["ACCEPTED", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED", "ON_HOLD", "DISPUTED"].includes(o.status);

  return (
    <div>
      <AdminHeader
        title={o.title}
        description={skillLine(o)}
        crumbs={[{ label: "Project offers", to: "/admin/offers" }, { label: o.title }]}
        actions={
          <>
            {o.status === "OFFERED" && (
              <Button variant="outline" leftIcon={Pencil} to={`/admin/offers/${o.id}/edit`}>
                Edit
              </Button>
            )}
            {reofferable && (
              <Button leftIcon={UserSearch} to={`/admin/talent?from=${o.id}${o.skill?.slug ? `&skill=${o.skill.slug}` : ""}${o.level ? `&level=${o.level}` : ""}`}>
                Offer to another student
              </Button>
            )}
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Status tone={chip.tone}>{chip.label}</Status>
        {o.status === "OFFERED" && <span className="text-xs text-warning">{expiresIn(o.expiresAt)}</span>}
        {o.payoutStatus !== "NOT_DUE" && <Status tone={PAYOUT_STATUS[o.payoutStatus]?.tone}>Payout {PAYOUT_STATUS[o.payoutStatus]?.label.toLowerCase()}</Status>}
        {o.status === "DECLINED" && o.declineReason && <span className="text-sm text-muted">Reason: {o.declineReason}</span>}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          {o.stage === "PM_REVIEW" && <ReviewPanel o={o} onDone={done} />}
          {o.stage === "CLIENT_REVIEW" && <ClientPanel o={o} onDone={done} />}

          <OfferFacts offer={o} />

          {(o.deliveries?.length > 0 || active || o.status === "COMPLETED") && (
            <Panel title="Deliveries" description={`${o.revisionsUsed} of ${o.revisionLimit} revisions used`}>
              <DeliveryList deliveries={o.deliveries} />
            </Panel>
          )}

          <Panel title="Milestones">
            <MilestoneList milestones={o.milestones} renderAction={active ? (m) => <MilestoneAction o={o} m={m} onDone={done} /> : undefined} />
          </Panel>

          <Panel title="Offer terms" description="As the student sees them.">
            <OfferBody offer={o} pmName={o.pm?.name} showMilestones={false} />
          </Panel>
        </div>

        <aside className="min-w-0 space-y-6">
          <Panel title="Student">
            <div className="flex items-center gap-3">
              <Avatar name={o.student?.name} src={o.student?.avatarUrl} />
              <div className="min-w-0">
                <p className="truncate font-medium">{o.student?.name}</p>
                <p className="truncate text-xs text-muted">{o.student?.college?.shortName || o.student?.college?.name}</p>
              </div>
            </div>
            <div className="mt-4">
              <KV label="PM">{o.pm?.name || "—"}</KV>
              <KV label="Catalance project">{o.catalanceProjectId || "Not linked"}</KV>
              <KV label="Sent">{dateTime(o.createdAt)}</KV>
              {o.respondedAt && <KV label="Answered">{dateTime(o.respondedAt)}</KV>}
            </div>
            <div className="mt-3 rounded-xl bg-surface-2/60 p-3">
              <p className="text-xs font-medium text-muted">Why shortlisted</p>
              <p className="mt-1 text-sm whitespace-pre-line text-fg">{o.shortlistReason || "—"}</p>
            </div>
          </Panel>

          <StatusActions o={o} onDone={done} />

          {o.finance && <FinanceSummary f={o.finance} />}

          <Panel title="History">
            <Timeline history={o.history} showNotes />
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function ReviewPanel({ o, onDone }) {
  const [mode, setMode] = useState(null);
  const [note, setNote] = useState("");
  const left = o.revisionLimit - o.revisionsUsed;
  const last = o.deliveries.at(-1);
  const review = useMutation({
    mutationFn: (decision) => api.post(`/api/pm/offers/${o.id}/review`, { decision, note: note.trim() }),
    onSuccess: (u, decision) => {
      setMode(null);
      setNote("");
      onDone(decision === "APPROVE" ? "Approved. Now record the client's answer." : "Changes requested")(u);
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Panel title={`Review version ${last?.version}`} description="Check it against the acceptance criteria." className="border-primary/40">
      <ul className="mb-4 space-y-1">
        {o.acceptanceCriteria.map((c, i) => (
          <li key={i} className="flex gap-2 text-sm text-muted">
            <Check className="mt-0.5 size-4 shrink-0 text-subtle" /> {c}
          </li>
        ))}
      </ul>
      {mode === "REVISION" ? (
        <div className="space-y-3">
          <Field label="What exactly needs to change?" htmlFor="rv-note" hint={`${left} of ${o.revisionLimit} revisions left. This uses one.`}>
            <Textarea id="rv-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Keep it to the agreed scope." />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setMode(null)}>
              Back
            </Button>
            <Button loading={review.isPending} disabled={note.trim().length < 5} onClick={() => review.mutate("REVISION")}>
              Request changes
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" leftIcon={RotateCcw} disabled={left <= 0} onClick={() => setMode("REVISION")} title={left <= 0 ? "Revision limit used up" : undefined}>
            Request changes{left <= 0 ? " (limit reached)" : ""}
          </Button>
          <Button leftIcon={Check} loading={review.isPending} onClick={() => review.mutate("APPROVE")}>
            Approve and send to client
          </Button>
        </div>
      )}
    </Panel>
  );
}

function ClientPanel({ o, onDone }) {
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState("5");
  const send = useMutation({
    mutationFn: (accepted) => api.post(`/api/pm/offers/${o.id}/client-acceptance`, { accepted, feedback: feedback.trim() || undefined, rating: accepted ? Number(rating) : undefined }),
    onSuccess: (u, accepted) => onDone(accepted ? "Completed. Payout is now eligible." : "Marked as disputed")(u),
    onError: (e) => toast.error(e.message),
  });
  return (
    <Panel title="Client answer" description="Record what the client said in Catalance." className="border-primary/40">
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
          <Field label="Client feedback" htmlFor="cl-fb">
            <Textarea id="cl-fb" rows={2} maxLength={2000} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Shown to the student." />
          </Field>
          <Field label="Rating" htmlFor="cl-rating">
            <Select id="cl-rating" value={rating} onChange={(e) => setRating(e.target.value)}>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} / 5
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" leftIcon={Scale} loading={send.isPending && send.variables === false} disabled={!feedback.trim()} onClick={() => send.mutate(false)} title="Add the client's concern first">
            Client disputes
          </Button>
          <Button leftIcon={Check} loading={send.isPending && send.variables === true} onClick={() => send.mutate(true)}>
            Client accepted
          </Button>
        </div>
      </div>
    </Panel>
  );
}

function MilestoneAction({ o, m, onDone }) {
  const update = useMutation({
    mutationFn: (status) => api.post(`/api/pm/offers/${o.id}/milestones/${m.id}`, { status }),
    onSuccess: onDone("Milestone updated"),
    onError: (e) => toast.error(e.message),
  });
  if (m.status === "APPROVED")
    return (
      <Button size="sm" variant="ghost" loading={update.isPending} onClick={() => update.mutate("PENDING")}>
        Reopen
      </Button>
    );
  return (
    <Button size="sm" variant="outline" leftIcon={Check} loading={update.isPending} onClick={() => update.mutate("APPROVED")}>
      Approve
    </Button>
  );
}

function StatusActions({ o, onDone }) {
  const [move, setMove] = useState(null);
  const [note, setNote] = useState("");
  const moves = MOVES.filter((m) => m.from.includes(o.status));
  const change = useMutation({
    mutationFn: ({ to }) => api.post(`/api/pm/offers/${o.id}/status`, { status: to, note: note.trim() }),
    onSuccess: (u) => {
      setMove(null);
      setNote("");
      onDone("Status updated. The student was notified.")(u);
    },
    onError: (e) => toast.error(e.message),
  });
  if (!moves.length) return null;
  return (
    <Panel title="Actions">
      <div className="flex flex-col gap-2">
        {moves.map((m) => (
          <Button
            key={m.to}
            variant={m.variant || "outline"}
            leftIcon={m.icon}
            className={cn("justify-start", m.danger && "text-danger")}
            onClick={() => (m.note ? setMove(m) : change.mutate(m))}
            loading={change.isPending && change.variables?.to === m.to && !m.note}
          >
            {m.label(o)}
          </Button>
        ))}
      </div>
      <Dialog open={Boolean(move)} onOpenChange={(v) => !v && setMove(null)}>
        <DialogContent title={move ? move.label(o) : ""} description="Add a short note. The student sees the status; the note stays in the log." size="sm">
          <Field label="Note" htmlFor="st-note">
            <Textarea id="st-note" rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setMove(null)}>
              Back
            </Button>
            <Button variant={move?.danger ? "danger" : "primary"} disabled={!note.trim()} loading={change.isPending} onClick={() => change.mutate(move)}>
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Panel>
  );
}

/** Admin-only (finance block is only returned for ADMIN). Editing happens in Project finance. */
function FinanceSummary({ f }) {
  return (
    <Panel title="Finance" description="Internal. Never shown to the student." action={<Button size="sm" variant="ghost" to="/admin/payouts">Open</Button>}>
      <KV label="Client price">{f.clientPriceINR == null ? "Not set" : formatINR(f.clientPriceINR)}</KV>
      <KV label="Split basis">{SPLIT_BASIS_LABEL[f.splitBasis] || "Default"}</KV>
      <KV label="Freelancer share">{f.freelancerSharePercent == null ? "Default" : `${f.freelancerSharePercent}%`}</KV>
      <KV label="Platform share">{f.platformShareINR == null ? "Not snapshotted" : formatINR(f.platformShareINR)}</KV>
      <KV label="Net payout">{formatINR(f.netPayoutINR)}</KV>
    </Panel>
  );
}
