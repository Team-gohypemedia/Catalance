import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { api, qs } from "@/lib/api/client";
import { timeAgo } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Field, Select, Skeleton } from "@/components/ui/primitives";
import { Avatar, Dialog, DialogContent } from "@/components/ui/overlays";
import { DataTable, Segmented } from "@/components/admin/DataTable";
import { AdminHeader } from "@/components/admin/kit";
import { AttemptStatus, levelLabel } from "@/components/assessment/meta";

function AssignDialog({ attempt, onClose }) {
  const qc = useQueryClient();
  const people = useQuery({ queryKey: ["admin", "evaluators", attempt.courseId], queryFn: () => api.get(`/api/admin/evaluators${qs({ courseId: attempt.courseId })}`) });
  const [evaluatorId, setEvaluatorId] = useState(attempt.evaluatorId || "");
  const assign = useMutation({
    mutationFn: () => api.post(`/api/evaluations/${attempt.id}/assign`, { evaluatorId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["evaluations"] });
      toast.success("Assigned.");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="sm" title="Assign evaluator" description={`${attempt.user?.name} · ${attempt.course?.title}`}>
        {people.isLoading ? (
          <Skeleton className="h-10" />
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!evaluatorId) return toast.error("Pick someone.");
              assign.mutate();
            }}
          >
            <Field label="Evaluator" htmlFor="as-ev">
              <Select id="as-ev" value={evaluatorId} onChange={(e) => setEvaluatorId(e.target.value)}>
                <option value="">Choose…</option>
                {(people.data || []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.role === "MENTOR" ? "course mentor" : p.role.toLowerCase()} · {p.openReviews} open
                  </option>
                ))}
              </Select>
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" loading={assign.isPending}>
                Assign
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function AdminEvaluations() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [view, setView] = useState("SUBMITTED");
  const [assigning, setAssigning] = useState(null);
  const params = view === "MINE" ? { status: "UNDER_REVIEW", mine: 1 } : { status: view };
  const list = useQuery({ queryKey: ["evaluations", view], queryFn: () => api.get(`/api/evaluations${qs(params)}`) });
  const open = useQuery({ queryKey: ["evaluations", "OPEN"], queryFn: () => api.get("/api/evaluations") });
  const count = (s) => (open.data ? open.data.filter((a) => a.status === s).length : undefined);

  const claim = useMutation({
    mutationFn: (id) => api.post(`/api/evaluations/${id}/claim`),
    onSuccess: (a) => {
      qc.invalidateQueries({ queryKey: ["evaluations"] });
      navigate(`/admin/evaluations/${a.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const columns = [
    {
      id: "student",
      header: "Student",
      sortValue: (a) => a.user?.name || "",
      cell: (a) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={a.user?.name} src={a.user?.avatarUrl} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium">{a.user?.name || "Student"}</p>
            <p className="truncate text-xs text-muted">{a.user?.college?.shortName || "—"}</p>
          </div>
        </div>
      ),
    },
    {
      id: "course",
      header: "Course",
      sortValue: (a) => a.course?.title || "",
      cell: (a) => (
        <div className="min-w-0 md:max-w-xs">
          <p className="truncate">{a.course?.title}</p>
          <p className="truncate text-xs text-muted">
            {levelLabel(a.course?.level)} · attempt {a.attemptNo}
          </p>
        </div>
      ),
    },
    { id: "status", header: "Status", sortValue: (a) => a.status, cell: (a) => <AttemptStatus status={a.status} /> },
    { id: "evaluator", header: "Evaluator", hideOnMobile: true, sortValue: (a) => a.evaluator?.name || "", cell: (a) => <span className="text-sm text-muted">{a.evaluator?.name || "Unassigned"}</span> },
    { id: "submitted", header: "Submitted", align: "right", sortValue: (a) => a.submittedAt || "", cell: (a) => <span className="text-xs whitespace-nowrap text-muted">{a.submittedAt ? timeAgo(a.submittedAt) : "—"}</span> },
    {
      id: "action",
      header: <span className="sr-only">Action</span>,
      align: "right",
      hideOnMobile: true,
      cell: (a) => (
        <div className="flex justify-end gap-1.5">
          {isAdmin && ["SUBMITTED", "UNDER_REVIEW"].includes(a.status) && (
            <Button size="sm" variant="ghost" leftIcon={UserPlus} onClick={(e) => (e.stopPropagation(), setAssigning(a))}>
              Assign
            </Button>
          )}
          {a.status === "SUBMITTED" ? (
            <Button size="sm" variant="outline" loading={claim.isPending && claim.variables === a.id} onClick={(e) => (e.stopPropagation(), claim.mutate(a.id))}>
              Claim
            </Button>
          ) : (
            <Button size="sm" variant={a.status === "UNDER_REVIEW" && a.evaluatorId === user?.id ? "outline" : "ghost"} onClick={(e) => (e.stopPropagation(), navigate(`/admin/evaluations/${a.id}`))}>
              {a.status === "APPEAL_PENDING" ? "Decide" : a.status === "UNDER_REVIEW" && a.evaluatorId === user?.id ? "Score" : "Open"}
            </Button>
          )}
        </div>
      ),
    },
  ];

  const options = [
    { value: "SUBMITTED", label: "Waiting", count: count("SUBMITTED") },
    { value: "MINE", label: "Mine", count: open.data ? open.data.filter((a) => a.status === "UNDER_REVIEW" && a.evaluatorId === user?.id).length : undefined },
    { value: "UNDER_REVIEW", label: "Under review", count: count("UNDER_REVIEW") },
    ...(isAdmin ? [{ value: "APPEAL_PENDING", label: "Appeals", count: count("APPEAL_PENDING") }] : []),
    { value: "REVIEWED", label: "Reviewed" },
  ];

  return (
    <>
      <AdminHeader
        title="Evaluation queue"
        description={
          user?.role === "MENTOR"
            ? "Final assessments in the courses you teach. Claim one, score it with its rubric, and write feedback the student can act on."
            : "Claim a submission, score it with the rubric version the student was briefed with, and write feedback they can act on."
        }
      />
      <DataTable
        data={list.data}
        loading={list.isLoading}
        error={list.error}
        onRetry={list.refetch}
        columns={columns}
        initialSort={{ id: "submitted", desc: view === "REVIEWED" }}
        onRowClick={(a) => navigate(`/admin/evaluations/${a.id}`)}
        search={{ placeholder: "Search student or course…", text: (a) => [a.user?.name, a.course?.title, a.user?.college?.name].join(" ") }}
        toolbar={<Segmented value={view} onChange={setView} label="Queue" options={options} />}
        empty={{ title: view === "SUBMITTED" ? "Queue is clear" : "Nothing here", description: view === "SUBMITTED" ? "New submissions show up here." : "Try another filter." }}
      />
      {assigning && <AssignDialog attempt={assigning} onClose={() => setAssigning(null)} />}
    </>
  );
}
