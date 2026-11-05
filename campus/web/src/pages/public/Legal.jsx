import { Link, NavLink, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { FileQuestion } from "lucide-react";
import { api } from "@/lib/api/client";
import { CATALANCE_URL, cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/primitives";
import { EmptyState, ErrorState } from "@/components/ui/campus";

/** Legal pages (spec §4.1): /legal/:doc, text and version from admin settings (GET /api/platform/policies/:doc). */
export const LEGAL_DOCS = [
  { doc: "terms", label: "Terms of use" },
  { doc: "privacy", label: "Privacy policy" },
  { doc: "refund", label: "Refund and cancellation" },
  { doc: "assessment", label: "Assessment policy" },
  { doc: "project", label: "Freelancer and project policy" },
];

/** Catalance marketplace policies also apply to project work done through Catalance. */
const CATALANCE_POLICY = { terms: "/terms", privacy: "/privacy", refund: "/refund-policy" };

export default function Legal() {
  const { doc = "terms" } = useParams();
  const meta = LEGAL_DOCS.find((d) => d.doc === doc);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["policy", doc],
    queryFn: () => api.get(`/api/platform/policies/${doc}`),
    enabled: Boolean(meta),
    staleTime: 60_000,
  });

  return (
    <section className="container-campus py-12 sm:py-20">
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[14rem_1fr]">
        <nav aria-label="Policies" className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow mb-3">Legal</p>
          <ul className="scrollbar-none flex gap-1 overflow-x-auto lg:flex-col">
            {LEGAL_DOCS.map((d) => (
              <li key={d.doc} className="shrink-0">
                <NavLink
                  to={`/legal/${d.doc}`}
                  className={({ isActive }) => cn("block rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors", isActive ? "bg-primary-soft font-medium text-primary" : "text-muted hover:text-fg")}
                >
                  {d.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <article className="min-w-0">
          {!meta ? (
            <EmptyState icon={FileQuestion} title="Policy not found" description="Pick a policy from the list." action={<Button to="/legal/terms" size="sm" variant="brandOutline">Terms of use</Button>} />
          ) : isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-72" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-6 h-64" />
            </div>
          ) : error ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : (
            <>
              <h1 className="text-3xl leading-[1.1] font-medium tracking-tight sm:text-5xl">{meta.label}</h1>
              {data.version && <p className="mt-3 text-sm text-muted">Version {/^\d{4}-\d{2}-\d{2}$/.test(data.version) ? formatDate(data.version) : data.version}</p>}
              <div className="prose-campus mt-8 max-w-2xl text-[15px]">
                <ReactMarkdown>{data.text}</ReactMarkdown>
              </div>
              {CATALANCE_POLICY[doc] && (
                <p className="mt-10 text-sm text-muted">
                  Catalance's{" "}
                  <a href={`${CATALANCE_URL}${CATALANCE_POLICY[doc]}`} className="text-primary hover:underline">
                    {meta.label.toLowerCase()}
                  </a>{" "}
                  also applies to projects delivered through Catalance.
                </p>
              )}
              <p className="mt-4 text-sm text-muted">
                Questions about this policy?{" "}
                <Link to="/contact" className="text-primary hover:underline">
                  Contact support
                </Link>
                .
              </p>
            </>
          )}
        </article>
      </div>
    </section>
  );
}
