import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Send, UserSearch } from "lucide-react";
import { api } from "@/lib/api/client";
import { formatDate, formatINR, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/overlays";
import { DataTable, Segmented } from "@/components/admin/DataTable";
import { AdminHeader, Kpi, KpiGrid, Status } from "@/components/admin/kit";
import { expiresIn, offerChip, skillLine } from "@/components/projects/meta";

/** Groups for the PM queue. "Needs you" = waiting on the PM (review, client answer, declined/expired to re-offer). */
const GROUPS = {
  all: { label: "All", test: () => true },
  needs: { label: "Needs you", test: (o) => o.stage === "PM_REVIEW" || o.stage === "CLIENT_REVIEW" || ["DECLINED", "EXPIRED", "ACCEPTED", "DISPUTED"].includes(o.status) },
  open: { label: "Waiting on student", test: (o) => o.status === "OFFERED" },
  active: { label: "In delivery", test: (o) => ["ACCEPTED", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED", "ON_HOLD", "DISPUTED"].includes(o.status) },
  done: { label: "Closed", test: (o) => ["COMPLETED", "CANCELLED", "DECLINED", "EXPIRED", "WITHDRAWN"].includes(o.status) },
};

/** Project offers (PM workspace, spec §4.3, §5.3). PMs see their own offers; admins see all. */
export default function AdminOffers() {
  const navigate = useNavigate();
  const [group, setGroup] = useState("needs");
  const list = useQuery({ queryKey: ["pm-offers"], queryFn: () => api.get("/api/pm/offers") });
  const data = useMemo(() => (list.data || []).filter(GROUPS[group].test), [list.data, group]);
  const counts = Object.fromEntries(Object.entries(GROUPS).map(([k, g]) => [k, (list.data || []).filter(g.test).length]));
  const rows = list.data || [];

  const columns = [
    {
      id: "title",
      header: "Project",
      sortValue: (o) => o.title,
      cell: (o) => (
        <div className="min-w-0">
          <p className="max-w-[340px] truncate font-medium">{o.title}</p>
          <p className="truncate text-xs text-muted">{skillLine(o)}{o.catalanceProjectId ? ` · ${o.catalanceProjectId}` : ""}</p>
        </div>
      ),
    },
    {
      id: "student",
      header: "Student",
      sortValue: (o) => o.student?.name,
      cell: (o) => (
        <span className="inline-flex min-w-0 items-center gap-2">
          <Avatar name={o.student?.name} src={o.student?.avatarUrl} size="sm" />
          <span className="truncate">{o.student?.name}</span>
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortValue: (o) => o.status,
      cell: (o) => {
        const s = offerChip(o);
        return (
          <div>
            <Status tone={s.tone}>{s.label}</Status>
            {o.status === "OFFERED" && <p className="mt-1 text-[11px] text-subtle">{expiresIn(o.expiresAt)}</p>}
          </div>
        );
      },
    },
    { id: "payout", header: "Payout", align: "right", sortValue: (o) => o.payoutINR, cell: (o) => <span className="tabular-nums">{formatINR(o.payoutINR)}</span> },
    { id: "deadline", header: "Deadline", sortValue: (o) => o.deadline, hideOnMobile: true, cell: (o) => <span className="text-muted">{formatDate(o.deadline)}</span> },
    { id: "updated", header: "Updated", sortValue: (o) => o.updatedAt, hideOnMobile: true, cell: (o) => <span className="text-muted">{timeAgo(o.updatedAt)}</span> },
  ];

  return (
    <div>
      <AdminHeader
        title="Project offers"
        description="Offers to verified students, from shortlist to client acceptance."
        actions={
          <Button leftIcon={UserSearch} to="/admin/talent">
            Find talent
          </Button>
        }
      />

      <KpiGrid className="mb-6">
        <Kpi icon={Send} label="Waiting on student" value={rows.filter(GROUPS.open.test).length} />
        <Kpi label="In delivery" value={rows.filter(GROUPS.active.test).length} />
        <Kpi label="Review needed" value={rows.filter((o) => o.stage === "PM_REVIEW").length} />
        <Kpi label="Client review" value={rows.filter((o) => o.stage === "CLIENT_REVIEW").length} />
      </KpiGrid>

      <DataTable
        data={data}
        loading={list.isLoading}
        error={list.error}
        onRetry={list.refetch}
        columns={columns}
        initialSort={{ id: "updated", desc: true }}
        onRowClick={(o) => navigate(`/admin/offers/${o.id}`)}
        search={{ placeholder: "Search project or student…", text: (o) => [o.title, o.student?.name, o.catalanceProjectId, o.skill?.name].join(" ") }}
        toolbar={<Segmented value={group} onChange={setGroup} label="Offer group" options={Object.entries(GROUPS).map(([value, g]) => ({ value, label: g.label, count: list.data ? counts[value] : undefined }))} />}
        empty={{
          icon: Send,
          title: group === "needs" ? "Nothing needs you right now" : "No offers here",
          description: "Shortlist a verified student to send an offer.",
          action: (
            <Button variant="outline" to="/admin/talent">
              Find talent
            </Button>
          ),
        }}
      />
    </div>
  );
}
