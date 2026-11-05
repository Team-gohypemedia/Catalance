import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Briefcase, CalendarCheck, ExternalLink, Gift, LayoutGrid, Rows3, Star, UserCog } from "lucide-react";
import { api } from "@/lib/api/client";
import { formatINR, formatNumber, LANGUAGES } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/primitives";
import { Avatar } from "@/components/ui/overlays";
import { EmptyState, ErrorState, StarRating } from "@/components/ui/campus";
import { DataTable, Segmented } from "@/components/admin/DataTable";
import { AdminHeader, Kpi, KpiGrid, Tag } from "@/components/admin/kit";

const langLabel = (c) => LANGUAGES.find((l) => l.code === c)?.label || c;
const price = (p) => (p ? formatINR(p) : "Free");

function MentorCard({ m }) {
  const p = m.mentorProfile || {};
  return (
    <div className="flex h-full flex-col rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-line-strong">
      <div className="flex items-start gap-3">
        <Avatar name={m.name} src={m.avatarUrl} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-fg">{m.name}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted">{p.headline || m.headline}</p>
        </div>
      </div>
      <p className="mt-3 inline-flex items-center gap-1.5 truncate text-xs text-subtle">
        <Briefcase className="size-3.5 shrink-0" strokeWidth={1.75} /> {p.company || "Independent"} · {p.yearsExperience || 0} yrs
      </p>
      <div className="mt-3 mb-4 flex flex-wrap gap-1">
        {(p.expertise || []).slice(0, 3).map((e) => (
          <Tag key={e}>{e}</Tag>
        ))}
      </div>
      <dl className="mt-auto grid grid-cols-3 gap-2 border-t border-line pt-4">
        <div>
          <dt className="text-[11px] text-subtle">{formatNumber(p.reviewsCount)} reviews</dt>
          <dd className="mt-0.5"><StarRating rating={p.rating || 0} /></dd>
        </div>
        <div>
          <dt className="text-[11px] text-subtle">Sessions</dt>
          <dd className="mt-0.5 text-sm text-fg tabular-nums">{formatNumber(p.sessionsCount)}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-subtle">Per session</dt>
          <dd className="mt-0.5 text-sm text-fg tabular-nums">{price(p.priceINR)}</dd>
        </div>
      </dl>
    </div>
  );
}

export default function Mentors() {
  const [view, setView] = useState("cards");
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["admin", "mentors"], queryFn: () => api.get("/api/admin/mentors") });
  const mentors = data || [];
  const sessions = mentors.reduce((s, m) => s + (m.mentorProfile?.sessionsCount || 0), 0);
  const rated = mentors.filter((m) => m.mentorProfile?.rating);
  const avgRating = rated.length ? rated.reduce((s, m) => s + m.mentorProfile.rating, 0) / rated.length : 0;
  const free = mentors.filter((m) => !m.mentorProfile?.priceINR).length;

  const columns = [
    {
      id: "name",
      header: "Mentor",
      sortValue: (m) => m.name,
      cell: (m) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={m.name} src={m.avatarUrl} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium">{m.name}</p>
            <p className="truncate text-xs text-muted md:max-w-60">{m.mentorProfile?.company || m.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: "expertise",
      header: "Expertise",
      cell: (m) => (
        <div className="flex flex-wrap gap-1">
          {(m.mentorProfile?.expertise || []).slice(0, 2).map((e) => (
            <Tag key={e}>{e}</Tag>
          ))}
        </div>
      ),
    },
    { id: "rating", header: "Rating", align: "right", sortValue: (m) => m.mentorProfile?.rating || 0, cell: (m) => <StarRating rating={m.mentorProfile?.rating || 0} /> },
    { id: "sessions", header: "Sessions", align: "right", sortValue: (m) => m.mentorProfile?.sessionsCount || 0, cell: (m) => <span className="tabular-nums">{formatNumber(m.mentorProfile?.sessionsCount)}</span> },
    { id: "price", header: "Price", align: "right", sortValue: (m) => m.mentorProfile?.priceINR || 0, cell: (m) => <span className="tabular-nums">{price(m.mentorProfile?.priceINR)}</span> },
    {
      id: "langs",
      header: "Languages",
      hideOnMobile: true,
      cell: (m) => <span className="text-xs text-muted">{(m.mentorProfile?.languages || []).map(langLabel).join(", ") || "—"}</span>,
    },
    {
      id: "link",
      header: <span className="sr-only">Profile</span>,
      align: "right",
      hideOnMobile: true,
      cell: (m) => (
        <Button variant="ghost" size="sm" to={`/app/mentors/${m.id}`} rightIcon={ExternalLink}>
          Profile
        </Button>
      ),
    },
  ];

  return (
    <>
      <AdminHeader
        title="Mentors"
        description="Working freelancers who teach courses, review work and take 1:1 sessions. Promote a student from the Students page."
        actions={<Segmented value={view} onChange={setView} label="View" options={[{ value: "cards", label: <LayoutGrid className="size-4" aria-label="Cards" /> }, { value: "table", label: <Rows3 className="size-4" aria-label="Table" /> }]} />}
      />

      {!error && (
        <div className="mb-6">
          {isLoading ? (
            <Skeleton className="h-28 rounded-2xl" />
          ) : (
            <KpiGrid>
              <Kpi icon={UserCog} label="Mentors" value={formatNumber(mentors.length)} hint="Teaching and reviewing" />
              <Kpi icon={Star} label="Avg rating" value={avgRating ? avgRating.toFixed(2) : "—"} hint={`From ${rated.length} rated mentors`} />
              <Kpi icon={CalendarCheck} label="Sessions held" value={formatNumber(sessions)} hint="1:1 sessions, all time" />
              <Kpi icon={Gift} label="Free mentors" value={formatNumber(free)} hint="₹0 per session" />
            </KpiGrid>
          )}
        </div>
      )}

      {view === "table" ? (
        <DataTable
          data={data}
          loading={isLoading}
          error={error}
          onRetry={refetch}
          columns={columns}
          initialSort={{ id: "rating", desc: true }}
          search={{ placeholder: "Search mentors or expertise…", text: (m) => [m.name, m.mentorProfile?.company, ...(m.mentorProfile?.expertise || [])].join(" ") }}
          empty={{ icon: UserCog, title: "No mentors yet", description: "Promote a student or add a mentor account." }}
        />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-60 rounded-2xl" />
          ))}
        </div>
      ) : !mentors.length ? (
        <EmptyState icon={UserCog} title="No mentors yet" description="Promote a student from the Students page to make them a mentor." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {mentors.map((m, i) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.24) }}>
              <MentorCard m={m} />
            </motion.div>
          ))}
        </div>
      )}
    </>
  );
}
