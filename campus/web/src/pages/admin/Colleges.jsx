import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, Check, Pencil, School, TrendingDown, TrendingUp, X } from "lucide-react";
import { api, qs } from "@/lib/api/client";
import { cn, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives";
import { DataTable, Segmented } from "@/components/admin/DataTable";
import { AdminHeader, IconBtn, Status, Tag } from "@/components/admin/kit";

const TYPES = { ENGINEERING: "Engineering", ARTS_SCIENCE: "Arts & Science", COMMERCE: "Commerce", DESIGN: "Design", MANAGEMENT: "Management", POLYTECHNIC: "Polytechnic" };

function RankChange({ value = 0 }) {
  if (!value) return <span className="text-xs text-subtle">—</span>;
  const up = value > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs tabular-nums", up ? "text-success" : "text-danger")}>
      <Icon className="size-3.5" />
      {Math.abs(value)}
    </span>
  );
}

export default function Colleges() {
  const qc = useQueryClient();
  const [verified, setVerified] = useState("");
  const [edit, setEdit] = useState(null); // { id, name, city }

  const list = useQuery({ queryKey: ["admin", "colleges", verified], queryFn: () => api.get(`/api/admin/colleges${qs({ verified })}`) });
  const all = useQuery({ queryKey: ["admin", "colleges", ""], queryFn: () => api.get("/api/admin/colleges") });
  const pending = (all.data || []).filter((c) => !c.verified).length;

  const patch = useMutation({
    mutationFn: ({ id, ...body }) => api.patch(`/api/admin/colleges/${id}`, body),
    onSuccess: (c, body) => {
      qc.invalidateQueries({ queryKey: ["admin", "colleges"] });
      qc.invalidateQueries({ queryKey: ["admin", "overview"] });
      toast.success(body.name || body.city ? `${c.shortName || c.name} updated` : c.verified ? `${c.name} is verified` : `${c.name} unverified`);
      setEdit(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const saveEdit = () => {
    if (!edit.name.trim() || !edit.city.trim()) return toast.error("Name and city can't be empty.");
    const c = list.data.find((x) => x.id === edit.id);
    patch.mutate({ id: edit.id, verified: c.verified, name: edit.name.trim(), city: edit.city.trim() });
  };

  const columns = [
    { id: "rank", header: "#", sortValue: (c) => c.rank || 9999, cell: (c) => <span className="text-muted tabular-nums">{c.rank || "—"}</span>, mobileLabel: "Rank", headerClassName: "w-12" },
    {
      id: "name",
      header: "College",
      sortValue: (c) => c.name,
      cell: (c) =>
        edit?.id === c.id ? (
          <div className="flex min-w-56 flex-col gap-1.5 sm:flex-row" onClick={(e) => e.stopPropagation()}>
            <Input aria-label="College name" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className="h-9" autoFocus onKeyDown={(e) => e.key === "Enter" && saveEdit()} />
            <Input aria-label="City" value={edit.city} onChange={(e) => setEdit({ ...edit, city: e.target.value })} className="h-9 sm:w-32" onKeyDown={(e) => e.key === "Enter" && saveEdit()} />
          </div>
        ) : (
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-medium">
              <span className="truncate md:max-w-xs">{c.name}</span>
              {c.verified ? <BadgeCheck className="size-4 shrink-0 text-primary" strokeWidth={1.75} aria-label="Verified" /> : <Status tone="warning">Pending</Status>}
            </p>
            <p className="truncate text-xs text-muted">
              {c.shortName} · {c.city}, {c.state} · {TYPES[c.type] || c.type}
            </p>
          </div>
        ),
    },
    { id: "students", header: "Students", align: "right", sortValue: (c) => c.studentsCount, cell: (c) => <span className="tabular-nums">{formatNumber(c.studentsCount)}</span> },
    { id: "points", header: "Points", align: "right", sortValue: (c) => c.totalPoints, cell: (c) => <span className="tabular-nums">{formatNumber(c.totalPoints)}</span> },
    { id: "avg", header: "Avg", align: "right", hideOnMobile: true, sortValue: (c) => c.avgPoints, cell: (c) => <span className="text-muted tabular-nums">{formatNumber(c.avgPoints)}</span> },
    { id: "change", header: "Change", align: "right", hideOnMobile: true, sortValue: (c) => c.rankChange || 0, cell: (c) => <RankChange value={c.rankChange} /> },
    { id: "skill", header: "Top skill", hideOnMobile: true, sortValue: (c) => c.topSkill || "", cell: (c) => (c.topSkill ? <Tag>{c.topSkill}</Tag> : <span className="text-subtle">—</span>) },
    {
      id: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      mobileLabel: "Actions",
      cell: (c) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {edit?.id === c.id ? (
            <>
              <IconBtn label="Save" icon={Check} onClick={saveEdit} />
              <IconBtn label="Cancel edit" icon={X} onClick={() => setEdit(null)} />
            </>
          ) : (
            <>
              <IconBtn label={`Edit ${c.name}`} icon={Pencil} onClick={() => setEdit({ id: c.id, name: c.name, city: c.city })} />
              <Button
                size="sm"
                variant={c.verified ? "ghost" : "outline"}
                className={c.verified ? "font-normal text-muted" : undefined}
                loading={patch.isPending && patch.variables?.id === c.id && !patch.variables?.name}
                onClick={() => patch.mutate({ id: c.id, verified: !c.verified })}
              >
                {c.verified ? "Unverify" : "Verify"}
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminHeader
        title="Colleges"
        description="Verify new campuses from onboarding. A verified college shows on the public college leaderboard."
      />
      <DataTable
        data={list.data}
        loading={list.isLoading}
        error={list.error}
        onRetry={list.refetch}
        columns={columns}
        initialSort={{ id: "rank", desc: false }}
        pageSize={15}
        search={{ placeholder: "Search colleges or cities…", text: (c) => [c.name, c.shortName, c.city, c.state].join(" ") }}
        toolbar={
          <Segmented
            value={verified}
            onChange={setVerified}
            label="Verification"
            options={[
              { value: "", label: "All", count: all.data?.length },
              { value: "false", label: "Pending", count: all.data ? pending : undefined },
              { value: "true", label: "Verified" },
            ]}
          />
        }
        empty={{ icon: School, title: verified === "false" ? "No colleges waiting" : "No colleges", description: verified === "false" ? "Every college is verified." : "Colleges appear as students onboard." }}
      />
    </>
  );
}
