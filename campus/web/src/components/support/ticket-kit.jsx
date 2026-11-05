import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Badge, Field, Input, Select, Textarea } from "@/components/ui/primitives";
import { Dialog, DialogContent } from "@/components/ui/overlays";

/** Support ticket meta shared by the student Help pages and the staff Support queue (spec §4.2 Help, §11). */
export const TICKET_STATUS = {
  OPEN: { label: "Open", tone: "sky" },
  IN_PROGRESS: { label: "In progress", tone: "violet" },
  RESOLVED: { label: "Resolved", tone: "success" },
  CLOSED: { label: "Closed", tone: "neutral" },
};

export const TICKET_CATEGORIES = [
  { value: "GENERAL", label: "General question" },
  { value: "PAYMENT", label: "Payment or refund" },
  { value: "COURSE", label: "Course or lessons" },
  { value: "ASSESSMENT", label: "Assessment or result" },
  { value: "PROJECT", label: "Project offer" },
  { value: "COMPLAINT", label: "Complaint" },
  { value: "DISPUTE", label: "Dispute" },
];
export const categoryLabel = (v) => TICKET_CATEGORIES.find((c) => c.value === v)?.label || v;

export const PRIORITY_TONE = { LOW: "neutral", NORMAL: "outline", HIGH: "warning", URGENT: "danger" };

export function TicketStatus({ status }) {
  const s = TICKET_STATUS[status] || TICKET_STATUS.OPEN;
  return (
    <Badge tone={s.tone} dot>
      {s.label}
    </Badge>
  );
}

/**
 * "New ticket" dialog. `defaults` pre-fills category/subject/related (e.g. a complaint escalated from a ticket).
 * Opens the new ticket on success.
 */
export function NewTicketDialog({ open, onOpenChange, defaults = {} }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [form, setForm] = useState({ category: defaults.category || "GENERAL", subject: defaults.subject || "", body: "" });
  const [errors, setErrors] = useState({});

  const create = useMutation({
    mutationFn: (body) => api.post("/api/support/tickets", body),
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
      toast.success("Ticket sent", { description: "We usually reply within 2 working days." });
      onOpenChange(false);
      setForm({ category: "GENERAL", subject: "", body: "" });
      navigate(`/app/help/${t.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    if (form.subject.trim().length < 3) next.subject = "Add a short subject.";
    if (form.body.trim().length < 10) next.body = "Tell us a little more (at least 10 characters).";
    setErrors(next);
    if (Object.keys(next).length) return;
    create.mutate({ ...form, relatedType: defaults.relatedType || null, relatedId: defaults.relatedId || null });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={defaults.category === "COMPLAINT" ? "Raise a complaint" : "New ticket"} description="Tell us what happened. One topic per ticket.">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Topic" htmlFor="tk-category">
            <Select id="tk-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {TICKET_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Subject" htmlFor="tk-subject" error={errors.subject}>
            <Input id="tk-subject" value={form.subject} maxLength={140} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Payment done but course still locked" />
          </Field>
          <Field label="Details" htmlFor="tk-body" error={errors.body} hint="Add order, course or project names if they help. Never share passwords or OTPs.">
            <Textarea id="tk-body" value={form.body} maxLength={5000} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending}>
              Submit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Message thread (oldest first). Internal staff notes are marked; students never receive them from the API. */
export function TicketThread({ ticket, viewerId }) {
  const items = [{ id: "first", authorId: ticket.userId, authorName: ticket.user?.name || "You", body: ticket.body, at: ticket.createdAt, internal: false }, ...(ticket.messages || [])];
  return (
    <ol className="space-y-3">
      {items.map((m) => {
        const mine = m.authorId === viewerId;
        return (
          <li
            key={m.id}
            className={`rounded-2xl border p-4 sm:p-5 ${m.internal ? "border-dashed border-warning/50 bg-warning-soft/40" : mine ? "border-line bg-surface" : "border-line bg-surface-2"}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
              <span className="font-medium text-fg">{mine ? "You" : m.authorName}</span>
              <span className="flex items-center gap-2">
                {m.internal && <Badge tone="warning">Internal note</Badge>}
                {new Date(m.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-fg/90">{m.body}</p>
          </li>
        );
      })}
    </ol>
  );
}
