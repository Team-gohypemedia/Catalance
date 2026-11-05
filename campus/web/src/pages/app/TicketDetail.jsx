import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, SearchX } from "lucide-react";
import { api } from "@/lib/api/client";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, Skeleton, Textarea } from "@/components/ui/primitives";
import { EmptyState, ErrorState, PageHeader } from "@/components/ui/campus";
import { NewTicketDialog, TicketStatus, TicketThread, categoryLabel } from "@/components/support/ticket-kit";

/** One support ticket: the thread, a reply box, and complaint escalation (spec §4.2 Help, §11). */
export default function TicketDetail() {
  const { ticketId } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [reply, setReply] = useState("");
  const [escalate, setEscalate] = useState(false);
  const { data: t, isLoading, error, refetch } = useQuery({ queryKey: ["support-ticket", ticketId], queryFn: () => api.get(`/api/support/tickets/${ticketId}`), retry: false });

  const send = useMutation({
    mutationFn: () => api.post(`/api/support/tickets/${ticketId}/messages`, { body: reply }),
    onSuccess: (updated) => {
      qc.setQueryData(["support-ticket", ticketId], updated);
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
      setReply("");
      toast.success("Reply sent");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }
  if (error?.status === 404) {
    return (
      <EmptyState
        icon={SearchX}
        title="Ticket not found"
        description="It may have been removed, or it belongs to another account."
        action={
          <Button to="/app/help" size="sm" variant="brandOutline">
            Back to Help
          </Button>
        }
      />
    );
  }
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const closed = ["RESOLVED", "CLOSED"].includes(t.status);
  const isComplaint = t.category === "COMPLAINT" || t.category === "DISPUTE";

  return (
    <div className="max-w-3xl">
      <Link to="/app/help" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeft className="size-4" /> Help & support
      </Link>
      <PageHeader title={t.subject} description={`${categoryLabel(t.category)} · opened ${formatDate(t.createdAt)}`} actions={<TicketStatus status={t.status} />} />

      {closed && t.resolution && (
        <Card className="mb-5 flex gap-3 p-4 sm:p-5">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" strokeWidth={1.75} />
          <div className="text-sm">
            <p className="font-medium">{t.status === "RESOLVED" ? "Resolved" : "Closed"}</p>
            <p className="mt-0.5 text-muted">{t.resolution}</p>
          </div>
        </Card>
      )}

      <TicketThread ticket={t} viewerId={user?.id} />

      <form
        className="mt-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!reply.trim()) return toast.error("Write a message.");
          send.mutate();
        }}
      >
        <label htmlFor="reply" className="text-sm font-medium">
          {closed ? "Still need help? Reply to reopen" : "Reply"}
        </label>
        <Textarea id="reply" className="mt-1.5" value={reply} maxLength={5000} onChange={(e) => setReply(e.target.value)} />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          {!isComplaint ? (
            <button type="button" className="text-sm text-muted underline-offset-4 hover:text-fg hover:underline" onClick={() => setEscalate(true)}>
              Raise a complaint
            </button>
          ) : (
            <span className="text-xs text-muted">Complaints are handled by a senior team member.</span>
          )}
          <Button type="submit" loading={send.isPending}>
            Submit
          </Button>
        </div>
      </form>

      <NewTicketDialog
        open={escalate}
        onOpenChange={setEscalate}
        defaults={{ category: "COMPLAINT", subject: `Complaint: ${t.subject}`.slice(0, 140), relatedType: "TICKET", relatedId: t.id }}
      />
    </div>
  );
}
