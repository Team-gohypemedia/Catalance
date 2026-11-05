import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, Check, CircleSlash, Link2, Plus, Send, Timer, Trash2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { cn, formatDate, formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, Field, Input, Skeleton, Textarea } from "@/components/ui/primitives";
import { Dialog, DialogContent } from "@/components/ui/overlays";
import { EmptyState, ErrorState } from "@/components/ui/campus";
import { NoGuarantee } from "@/components/marketing/NoGuarantee";
import { DeliveryList, MilestoneList, OfferBody, OfferChip, OfferFacts, PayoutChip, PolicyLink, Timeline } from "@/components/projects/parts";
import { dateTime, expiresIn, skillLine } from "@/components/projects/meta";

const CAN_SUBMIT = ["ACCEPTED", "IN_PROGRESS", "REVISION_REQUESTED"];

/** One project offer (spec §9.1): review the exact payout and terms, accept or decline; then milestones, delivery, history. */
export default function ProjectDetail() {
  const { offerId } = useParams();
  const qc = useQueryClient();
  const { data: o, isLoading, error, refetch } = useQuery({ queryKey: ["my-offer", offerId], queryFn: () => api.get(`/api/me/offers/${offerId}`) });

  const onDone = (updated, msg) => {
    qc.setQueryData(["my-offer", offerId], updated);
    qc.invalidateQueries({ queryKey: ["my-offers"] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
    toast.success(msg);
  };

  if (isLoading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-24" />
        <Skeleton className="h-80" />
      </div>
    );
  if (error?.status === 404)
    return (
      <EmptyState
        icon={CircleSlash}
        title="Project not found"
        description="This offer doesn't exist or isn't yours."
        action={
          <Button variant="outline" to="/app/projects">
            My projects
          </Button>
        }
      />
    );
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const isOpen = o.status === "OFFERED";
  const lastReview = o.deliveries?.at(-1)?.review;

  return (
    <div>
      <Button variant="ghost" size="sm" to={isOpen ? "/app/opportunities" : "/app/projects"} leftIcon={ArrowLeft} className="-ml-2 mb-4">
        {isOpen ? "Opportunities" : "My projects"}
      </Button>

      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <OfferChip offer={o} />
          {!isOpen && o.payoutStatus !== "NOT_DUE" && <PayoutChip status={o.payoutStatus} />}
          <span className="text-xs text-muted">{skillLine(o)}</span>
        </div>
        <h1 className="mt-3 font-display text-2xl leading-[1.15] font-medium tracking-tight text-balance sm:text-3xl">{o.title}</h1>
      </header>

      <StatusBanner o={o} lastReview={lastReview} />

      <OfferFacts offer={o} className="mb-6" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          {CAN_SUBMIT.includes(o.status) && <DeliveryForm o={o} onDone={onDone} />}

          <Card>
            <CardContent className="p-6 sm:p-8">
              <h2 className="mb-5 text-base font-medium tracking-tight">Project details</h2>
              <OfferBody offer={o} pmName={o.pm?.name} />
            </CardContent>
          </Card>

          {!isOpen && (
            <Card>
              <CardContent className="space-y-4 p-6 sm:p-8">
                <h2 className="text-base font-medium tracking-tight">Your deliveries</h2>
                <DeliveryList deliveries={o.deliveries} />
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {isOpen && <RespondPanel o={o} onDone={onDone} />}
          {!isOpen && o.milestones?.length > 0 && (
            <Card>
              <CardContent className="space-y-3 p-5">
                <h2 className="text-sm font-medium">Milestones</h2>
                <MilestoneList milestones={o.milestones} />
              </CardContent>
            </Card>
          )}
          {o.status === "COMPLETED" && <PayoutCard o={o} />}
          <Card>
            <CardContent className="space-y-4 p-5">
              <h2 className="text-sm font-medium">Status</h2>
              <Timeline history={o.history} />
            </CardContent>
          </Card>
        </aside>
      </div>

      <NoGuarantee className="mt-8" />
    </div>
  );
}

function StatusBanner({ o, lastReview }) {
  const banner = {
    EXPIRED: { tone: "neutral", title: "This offer has expired", body: "It was not answered in time. You can still get new offers." },
    DECLINED: { tone: "neutral", title: "You declined this offer", body: o.declineReason ? `Your reason: ${o.declineReason}` : "Declining never counts against you." },
    WITHDRAWN: { tone: "neutral", title: "The PM withdrew this offer", body: "Nothing more is needed from you." },
    CANCELLED: { tone: "danger", title: "This project was cancelled", body: "Your PM will explain the next steps. Contact support if you have questions." },
    ON_HOLD: { tone: "neutral", title: "This project is on hold", body: "Pause work until your PM restarts it." },
    DISPUTED: { tone: "danger", title: "The client raised a concern", body: "Your PM is handling it and will contact you." },
    REVISION_REQUESTED: { tone: "warning", title: "Changes requested", body: lastReview?.note || "See the latest review below." },
    SUBMITTED: o.stage === "CLIENT_REVIEW" ? { tone: "success", title: "Approved by your PM", body: "Sent to the client for review." } : { tone: "neutral", title: "Submitted", body: "Your PM is reviewing your work." },
  }[o.status];
  if (!banner) return null;
  const tones = { neutral: "border-line bg-surface-2/60", warning: "border-warning/30 bg-warning-soft", danger: "border-danger/30 bg-danger-soft", success: "border-success/30 bg-success-soft" };
  return (
    <div role="status" className={cn("mb-6 rounded-2xl border px-5 py-4", tones[banner.tone])}>
      <p className="text-sm font-medium text-fg">{banner.title}</p>
      <p className="mt-0.5 text-sm whitespace-pre-line text-fg/80">{banner.body}</p>
      {o.status === "REVISION_REQUESTED" && (
        <p className="mt-1 text-xs text-muted">
          {o.revisionsUsed} of {o.revisionLimit} revisions used
        </p>
      )}
    </div>
  );
}

function RespondPanel({ o, onDone }) {
  const [agreed, setAgreed] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [reason, setReason] = useState("");
  const accept = useMutation({
    mutationFn: () => api.post(`/api/me/offers/${o.id}/accept`, { consents: ["PROJECT_POLICY"] }),
    onSuccess: (u) => onDone(u, "Offer accepted. Your PM will plan the kickoff."),
    onError: (e) => toast.error(e.message),
  });
  const decline = useMutation({
    mutationFn: () => api.post(`/api/me/offers/${o.id}/decline`, { reason: reason.trim() || undefined }),
    onSuccess: (u) => {
      setDeclineOpen(false);
      onDone(u, "Offer declined");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Card className="border-primary/40">
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div>
          <p className="text-sm text-muted">You receive</p>
          <p className="mt-1 text-3xl font-medium tracking-tight tabular-nums">{formatINR(o.payoutINR)}</p>
          <p className="mt-1 text-xs text-muted">Paid after the client accepts the work. Due {formatDate(o.deadline)}.</p>
        </div>
        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-warning">
          <Timer className="size-3.5" /> {expiresIn(o.expiresAt)} · {dateTime(o.expiresAt)}
        </p>
        <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-line p-3 text-sm">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]" />
          <span className="text-muted">
            I have read the scope, payout and the <PolicyLink />, and I agree to them.
          </span>
        </label>
        <Button className="w-full" size="lg" leftIcon={Check} disabled={!agreed} loading={accept.isPending} onClick={() => accept.mutate()}>
          Accept offer
        </Button>
        <Button className="w-full" variant="ghost" onClick={() => setDeclineOpen(true)}>
          Decline
        </Button>
        <p className="text-xs text-subtle">Declining never counts against you.</p>
      </CardContent>

      <Dialog open={declineOpen} onOpenChange={setDeclineOpen}>
        <DialogContent title="Decline this offer?" description="A reason helps your PM send better matches. It's optional." size="sm">
          <Field label="Reason (optional)" htmlFor="decline-reason">
            <Textarea id="decline-reason" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Exams that week" />
          </Field>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeclineOpen(false)}>
              Keep offer
            </Button>
            <Button variant="danger" loading={decline.isPending} onClick={() => decline.mutate()}>
              Decline offer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function DeliveryForm({ o, onDone }) {
  const [text, setText] = useState("");
  const [links, setLinks] = useState([""]);
  const cleanLinks = links.map((l) => l.trim()).filter(Boolean);
  const badLink = cleanLinks.find((l) => !/^https?:\/\/\S+\.\S+/.test(l));
  const submit = useMutation({
    mutationFn: () => api.post(`/api/me/offers/${o.id}/deliveries`, { text: text.trim(), links: cleanLinks }),
    onSuccess: (u) => {
      setText("");
      setLinks([""]);
      onDone(u, "Submitted. Your PM will review it.");
    },
    onError: (e) => toast.error(e.message),
  });
  const version = (o.deliveries?.length || 0) + 1;
  return (
    <Card>
      <CardContent className="space-y-4 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-medium tracking-tight">Submit work</h2>
          <span className="text-xs text-muted">Version {version}</span>
        </div>
        {o.status === "REVISION_REQUESTED" && (
          <p className="flex gap-2 rounded-xl bg-warning-soft px-3 py-2 text-sm text-fg">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" /> Fix only what was asked. Extra scope needs a new agreement.
          </p>
        )}
        <Field label="What did you deliver?" htmlFor="dl-text">
          <Textarea id="dl-text" rows={4} maxLength={5000} value={text} onChange={(e) => setText(e.target.value)} placeholder="Summarise what you did and how to check it." />
        </Field>
        <div className="space-y-2">
          <p className="text-sm font-medium">Links</p>
          {links.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                aria-label={`Link ${i + 1}`}
                type="url"
                leftIcon={Link2}
                value={l}
                onChange={(e) => setLinks(links.map((x, k) => (k === i ? e.target.value : x)))}
                placeholder="https://"
              />
              {links.length > 1 && (
                <Button type="button" variant="ghost" size="iconSm" aria-label={`Remove link ${i + 1}`} onClick={() => setLinks(links.filter((_, k) => k !== i))}>
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          ))}
          {links.length < 10 && (
            <Button type="button" variant="ghost" size="sm" leftIcon={Plus} onClick={() => setLinks([...links, ""])}>
              Add link
            </Button>
          )}
          {badLink && <p className="text-xs text-danger">Links must start with http:// or https://</p>}
        </div>
        <div className="flex justify-end">
          <Button leftIcon={Send} loading={submit.isPending} disabled={(!text.trim() && !cleanLinks.length) || !!badLink} onClick={() => submit.mutate()}>
            Submit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PayoutCard({ o }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium">Payout</h2>
          <PayoutChip status={o.payoutStatus} />
        </div>
        <p className="text-2xl font-medium tracking-tight tabular-nums">{formatINR(o.netPayoutINR ?? o.payoutINR)}</p>
        {o.netPayoutINR != null && o.netPayoutINR !== o.payoutINR && <p className="text-xs text-muted">Agreed {formatINR(o.payoutINR)}, adjusted by finance.</p>}
        <p className="text-xs text-muted">
          {o.payoutStatus === "PAID" ? `Paid ${formatDate(o.paidAt)}.` : o.payoutStatus === "FAILED" ? "The transfer failed. Check your payout details or contact support." : "Finance will process it soon."}
        </p>
        {o.feedback && (
          <blockquote className="border-l-2 border-line pl-3 text-sm text-muted">
            “{o.feedback}”{o.rating ? <span className="ml-1 text-xs text-subtle">· {o.rating}/5</span> : null}
          </blockquote>
        )}
      </CardContent>
    </Card>
  );
}
