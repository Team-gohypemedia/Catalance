/**
 * Project offer building blocks shared by the student pages (/app/opportunities, /app/projects) and the PM console.
 * OfferChip, PayoutChip, OfferFacts, OfferBody (the student-facing terms, also used as the PM editor preview),
 * MilestoneList, DeliveryList, Timeline, PolicyLink.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { CalendarClock, Check, Clock, ExternalLink, IndianRupee, LifeBuoy, RotateCcw } from "lucide-react";
import { api } from "@/lib/api/client";
import { cn, formatDate, formatINR } from "@/lib/utils";
import { Badge, Skeleton } from "@/components/ui/primitives";
import { Dialog, DialogContent } from "@/components/ui/overlays";
import { Button } from "@/components/ui/button";
import { MILESTONE_STATUS, OFFER_STATUS, PAYOUT_STATUS, dateTime, offerChip } from "./meta";

export function OfferChip({ offer, className }) {
  const s = offerChip(offer);
  return (
    <Badge tone={s.tone} dot className={className}>
      {s.label}
    </Badge>
  );
}

export function PayoutChip({ status, className }) {
  const s = PAYOUT_STATUS[status] || PAYOUT_STATUS.NOT_DUE;
  return (
    <Badge tone={s.tone} className={className}>
      Payout {s.label.toLowerCase()}
    </Badge>
  );
}

/** Payout, deadline, hours, revisions: the four facts a student decides on. */
export function OfferFacts({ offer, className }) {
  const facts = [
    { icon: IndianRupee, label: "You receive", value: formatINR(offer.payoutINR), strong: true },
    { icon: CalendarClock, label: "Deadline", value: offer.deadline ? formatDate(offer.deadline) : "To be agreed" },
    { icon: Clock, label: "Estimated effort", value: offer.expectedHours ? `${offer.expectedHours} hours` : "To be agreed" },
    { icon: RotateCcw, label: "Revisions", value: `${offer.revisionsUsed || 0} of ${offer.revisionLimit ?? 0} used` },
  ];
  return (
    <dl className={cn("grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4", className)}>
      {facts.map(({ icon: Icon, label, value, strong }) => (
        <div key={label} className="min-w-0 bg-surface p-4">
          <dt className="flex items-center gap-1.5 text-xs text-muted">
            <Icon className="size-3.5 shrink-0" strokeWidth={1.75} /> {label}
          </dt>
          <dd className={cn("mt-1.5 truncate tabular-nums", strong ? "text-xl font-medium tracking-tight text-fg" : "text-sm font-medium text-fg")}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Block({ title, children }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-medium text-fg">{title}</h3>
      {children}
    </section>
  );
}

function Bullets({ items, empty = "Not set" }) {
  if (!items?.length) return <p className="text-sm text-subtle">{empty}</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((t, i) => (
        <li key={i} className="flex gap-2 text-sm text-muted">
          <Check className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.75} />
          <span className="min-w-0 break-words">{t}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * The offer terms as the student sees them (spec §9.1). Never shows client price or the internal split.
 * `pmName` is shown as the contact; support always goes through Help & support.
 */
export function OfferBody({ offer, pmName, showMilestones = true }) {
  return (
    <div className="space-y-6">
      {offer.summary && <p className="text-sm leading-relaxed whitespace-pre-line text-muted">{offer.summary}</p>}
      <Block title="Deliverables">
        <Bullets items={offer.deliverables} />
      </Block>
      <Block title="Accepted when">
        <Bullets items={offer.acceptanceCriteria} />
      </Block>
      {showMilestones && (
        <Block title="Milestones">
          <MilestoneList milestones={offer.milestones} />
        </Block>
      )}
      <Block title="Tools and access">
        {offer.tools?.length ? (
          <div className="flex flex-wrap gap-1.5">
            {offer.tools.map((t) => (
              <span key={t} className="rounded-full border border-line px-2.5 py-0.5 text-xs text-fg/80">
                {t}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-subtle">Shared at kickoff</p>
        )}
      </Block>
      <Block title="Confidentiality and ownership">
        <p className="text-sm whitespace-pre-line text-muted">{offer.confidentiality || "Client files are confidential. Paid work belongs to the client."}</p>
      </Block>
      <Block title="Contact">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          <span>Project manager: {pmName || "Catalance PM"}</span>
          <a href="/app/help" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
            <LifeBuoy className="size-3.5" /> Help & support
          </a>
        </p>
      </Block>
    </div>
  );
}

export function MilestoneList({ milestones, renderAction }) {
  if (!milestones?.length) return <p className="text-sm text-subtle">One final delivery</p>;
  return (
    <ol className="divide-y divide-line rounded-xl border border-line">
      {milestones.map((m, i) => {
        const s = MILESTONE_STATUS[m.status] || MILESTONE_STATUS.PENDING;
        return (
          <li key={m.id || i} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs text-muted tabular-nums">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-fg">{m.title}</p>
              {m.dueAt && <p className={cn("text-xs", m.overdue ? "text-danger" : "text-subtle")}>{m.overdue ? "Overdue · " : "Due "}{dateTime(m.dueAt)}</p>}
            </div>
            <Badge tone={s.tone}>{s.label}</Badge>
            {renderAction?.(m)}
          </li>
        );
      })}
    </ol>
  );
}

export function DeliveryList({ deliveries }) {
  if (!deliveries?.length) return <p className="text-sm text-subtle">Nothing submitted yet.</p>;
  return (
    <ol className="space-y-3">
      {[...deliveries].reverse().map((d) => (
        <li key={d.version} className="rounded-xl border border-line p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-fg">Version {d.version}</p>
            <p className="text-xs text-subtle">{dateTime(d.submittedAt)}</p>
          </div>
          {d.text && <p className="mt-2 text-sm whitespace-pre-line text-muted">{d.text}</p>}
          {d.links?.length > 0 && (
            <ul className="mt-2 space-y-1">
              {d.links.map((l) => (
                <li key={l} className="min-w-0">
                  <a href={l} target="_blank" rel="noreferrer noopener" className="inline-flex max-w-full items-center gap-1 text-sm text-primary hover:underline">
                    <ExternalLink className="size-3.5 shrink-0" /> <span className="truncate">{l}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
          {d.review ? (
            <div className={cn("mt-3 rounded-lg px-3 py-2 text-sm", d.review.decision === "APPROVE" ? "bg-success-soft text-success" : "bg-warning-soft text-fg")}>
              <p className="font-medium">{d.review.decision === "APPROVE" ? "Approved" : "Changes requested"}{d.review.by?.name ? ` by ${d.review.by.name}` : ""}</p>
              {d.review.note && <p className="mt-0.5 whitespace-pre-line text-fg/80">{d.review.note}</p>}
            </div>
          ) : (
            <p className="mt-3 text-xs text-subtle">Waiting for review</p>
          )}
        </li>
      ))}
    </ol>
  );
}

/** Status history. `showNotes` for staff (notes may be internal). */
export function Timeline({ history, showNotes = false }) {
  if (!history?.length) return <p className="text-sm text-subtle">No updates yet.</p>;
  return (
    <ol className="relative space-y-4 border-l border-line pl-5">
      {[...history].reverse().map((h, i) => (
        <li key={i} className="relative">
          <span className={cn("absolute top-1.5 -left-[25px] size-2.5 rounded-full border-2 border-surface", i === 0 ? "bg-primary" : "bg-line-strong")} aria-hidden="true" />
          <p className="text-sm font-medium text-fg">{OFFER_STATUS[h.status]?.label || h.status}</p>
          <p className="text-xs text-subtle">
            {dateTime(h.at)}
            {showNotes && h.by?.name ? ` · ${h.by.name}` : ""}
          </p>
          {showNotes && h.note && <p className="mt-1 text-sm text-muted">{h.note}</p>}
        </li>
      ))}
    </ol>
  );
}

/** "Read the project terms" link that opens the PROJECT_POLICY text (GET /api/platform/policies/project). */
export function PolicyLink({ children = "project terms" }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading, error } = useQuery({ queryKey: ["policy", "project"], queryFn: () => api.get("/api/platform/policies/project"), enabled: open, staleTime: 300_000 });
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="cursor-pointer font-medium text-primary underline-offset-2 hover:underline">
        {children}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Project terms" description={data?.version ? `Version ${data.version}` : undefined} size="lg">
          <div className="max-h-[60vh] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : error || !data?.text ? (
              <p className="text-sm text-muted">
                Each project has its own scope, payout, deadline and revision limit, shown on the offer. Client files stay confidential and paid work belongs to the client. Payouts are made after the client accepts the work. Projects and earnings are not guaranteed.
              </p>
            ) : (
              <div className="prose-campus text-sm">
                <ReactMarkdown>{data.text}</ReactMarkdown>
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
