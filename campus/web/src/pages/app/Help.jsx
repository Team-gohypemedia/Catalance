import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, LifeBuoy, Mail, Plus } from "lucide-react";
import { api } from "@/lib/api/client";
import { timeAgo } from "@/lib/utils";
import { usePlatformConfig } from "@/lib/platform";
import { Button } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/primitives";
import { EmptyState, ErrorState, PageHeader } from "@/components/ui/campus";
import { Faq } from "@/components/marketing/primitives";
import { NewTicketDialog, TicketStatus, categoryLabel } from "@/components/support/ticket-kit";

/** Help & support (spec §4.2): own tickets, FAQs, and the route to raise a complaint. */
export default function Help() {
  const [open, setOpen] = useState(false);
  const { content, support } = usePlatformConfig();
  const { data: tickets, isLoading, error, refetch } = useQuery({ queryKey: ["support-tickets"], queryFn: () => api.get("/api/support/tickets") });

  return (
    <div>
      <PageHeader
        title="Help & support"
        description="Ask a question, report a problem or raise a complaint. We usually reply within 2 working days."
        actions={
          <Button leftIcon={Plus} onClick={() => setOpen(true)}>
            New ticket
          </Button>
        }
      />

      <section aria-labelledby="my-tickets">
        <h2 id="my-tickets" className="mb-3 text-base font-medium tracking-tight">
          Your tickets
        </h2>
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={LifeBuoy}
            title="No tickets yet"
            description="If something isn't working, tell us. Check the questions below first, the answer may be there."
            action={
              <Button size="sm" variant="brandOutline" onClick={() => setOpen(true)}>
                New ticket
              </Button>
            }
          />
        ) : (
          <ul className="space-y-3">
            {tickets.map((t) => (
              <li key={t.id}>
                <Link to={`/app/help/${t.id}`} className="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-line-strong sm:p-5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium transition-colors group-hover:text-primary sm:text-base">{t.subject}</p>
                    <p className="mt-1 truncate text-xs text-muted">
                      {categoryLabel(t.category)} · updated {timeAgo(t.updatedAt)}
                      {t.messages?.length ? ` · ${t.messages.length} ${t.messages.length === 1 ? "reply" : "replies"}` : ""}
                    </p>
                  </div>
                  <TicketStatus status={t.status} />
                  <ArrowRight className="hidden size-4 shrink-0 text-subtle transition-colors group-hover:text-primary sm:block" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="faqs" className="mt-10">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 id="faqs" className="text-base font-medium tracking-tight">
            Common questions
          </h2>
          <Link to="/faqs" className="text-sm text-muted hover:text-primary">
            All FAQs
          </Link>
        </div>
        <Faq items={content.faqs.slice(0, 6)} />
      </section>

      <Card className="mt-10 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted">
          <Mail className="size-4" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-medium">Not happy with an answer?</p>
          <p className="mt-0.5 text-muted">
            Open the ticket and choose Raise a complaint. Complaints go to a senior team member. You can also email{" "}
            <a href={`mailto:${support.email}`} className="text-primary hover:underline">
              {support.email}
            </a>
            .
          </p>
        </div>
        <Link to="/legal/terms" className="shrink-0 text-sm text-muted hover:text-primary">
          Policies
        </Link>
      </Card>

      <NewTicketDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
