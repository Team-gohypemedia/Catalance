import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Plus from "lucide-react/dist/esm/icons/plus";
import Funnel from "lucide-react/dist/esm/icons/funnel";
import Search from "lucide-react/dist/esm/icons/search";
import { useAuth } from "@/shared/context/AuthContext";
import { PmShell } from "@/modules/project-manager/components/PmShell";
import { pmApi } from "@/modules/project-manager/services/pm-api";
import { useAsyncResource } from "@/modules/project-manager/hooks/use-async-resource";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/modules/project-manager/components/StatusBadge";
import { Badge } from "@/components/ui/badge";

const mapProjectRow = (project) => {
  const hasIssue = Array.isArray(project?.disputes)
    ? project.disputes.some((item) => String(item.status || "").toUpperCase() !== "RESOLVED")
    : false;

  const statusMap = {
    DRAFT: "Proposal",
    OPEN: "Started",
    AWAITING_PAYMENT: "Started",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
  };

  const status = hasIssue
    ? "Issue Raised"
    : statusMap[String(project?.status || "").toUpperCase()] || "Started";

  const proposalRows = Array.isArray(project?.proposals) ? project.proposals : [];
  const freelancer = (
    proposalRows.find(
      (proposal) =>
        String(proposal?.status || "").toUpperCase() === "ACCEPTED" &&
        proposal?.freelancer
    ) ||
    proposalRows.find(
      (proposal) =>
        String(proposal?.status || "").toUpperCase() === "REPLACED" &&
        proposal?.freelancer
    ) ||
    proposalRows.find((proposal) => proposal?.freelancer)
  )?.freelancer;

  return {
    id: project.id,
    title: project.title,
    clientName: project?.owner?.fullName || "Unknown",
    freelancerName: freelancer?.fullName || "Unassigned",
    status,
    budget: Number(project?.budget || 0),
    updatedAt: project?.updatedAt || project?.createdAt,
  };
};

const ProjectsPage = () => {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [assignmentFilter, setAssignmentFilter] = useState("ALL");
  const [syncFilter, setSyncFilter] = useState("ALL");

  const { data, loading } = useAsyncResource(
    () => pmApi.getProjects(authFetch),
    [authFetch]
  );

  const rows = useMemo(
    () => (Array.isArray(data) ? data : []).map((project) => mapProjectRow(project)),
    [data]
  );

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        if (statusFilter !== "ALL" && row.status !== statusFilter) return false;

        if (assignmentFilter === "ASSIGNED" && row.freelancerName === "Unassigned") return false;
        if (assignmentFilter === "UNASSIGNED" && row.freelancerName !== "Unassigned") return false;

        if (syncFilter !== "ALL") {
          const updatedAt = row.updatedAt ? new Date(row.updatedAt) : null;
          if (!updatedAt || Number.isNaN(updatedAt.getTime())) return false;

          const now = Date.now();
          const diffDays = (now - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
          if (syncFilter === "LAST_7_DAYS" && diffDays > 7) return false;
          if (syncFilter === "LAST_30_DAYS" && diffDays > 30) return false;
        }

        return true;
      }),
    [rows, statusFilter, assignmentFilter, syncFilter]
  );

  return (
    <PmShell
      title="Project Master List"
      subtitle="Comprehensive view of all active and historical project workspaces under your management."
    >
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
               <Funnel className="h-4 w-4 text-slate-400" />
               Project Filters
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-3">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                <option value="ALL">All Status</option>
                <option value="Started">Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Issue Raised">Issue Raised</option>
                <option value="Proposal">Proposal</option>
              </select>
              <select
                value={assignmentFilter}
                onChange={(event) => setAssignmentFilter(event.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                <option value="ALL">All Assignment</option>
                <option value="ASSIGNED">Assigned Freelancer</option>
                <option value="UNASSIGNED">Unassigned Freelancer</option>
              </select>
              <select
                value={syncFilter}
                onChange={(event) => setSyncFilter(event.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                <option value="ALL">Any Sync Date</option>
                <option value="LAST_7_DAYS">Synced in 7 days</option>
                <option value="LAST_30_DAYS">Synced in 30 days</option>
              </select>
            </div>
            <Button
              variant="outline"
              className="h-11 rounded-xl border-slate-200 px-4 text-xs font-black uppercase tracking-wider text-slate-600"
              onClick={() => {
                setStatusFilter("ALL");
                setAssignmentFilter("ALL");
                setSyncFilter("ALL");
              }}
            >
              Reset
            </Button>
         </div>
         <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Managed:</span>
            <Badge className="bg-slate-900 text-[10px] font-black">{rows.length}</Badge>
         </div>
      </div>

      <div className="space-y-4">
         {loading ? (
           Array.from({ length: 3 }).map((_, index) => (
             <Card key={index} className="rounded-[32px] border-slate-100 h-24 animate-pulse bg-slate-50/50" />
           ))
         ) : filteredRows.length === 0 ? (
           <div className="py-24 text-center rounded-[40px] border-2 border-dashed border-slate-100 bg-slate-50/20">
              <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                 <Search className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-400 italic">No matching projects found.</p>
              <Button
                variant="link"
                onClick={() => {
                  setStatusFilter("ALL");
                  setAssignmentFilter("ALL");
                  setSyncFilter("ALL");
                }}
                className="text-blue-600 font-black text-xs uppercase mt-2"
              >
                Clear Filter
              </Button>
           </div>
         ) : (
           <div className="grid gap-4">
             {filteredRows.map((row) => (
               <div 
                 key={row.id} 
                 className="group relative flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-[32px] border border-slate-100 bg-white shadow-sm transition-all hover:shadow-xl hover:border-blue-100 hover:-translate-y-1"
               >
                 <div className="flex items-center gap-6">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                       <Plus className="h-8 w-8 rotate-45" />
                    </div>
                    <div className="space-y-1">
                       <h3 className="text-base font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">{row.title}</h3>
                       <div className="flex items-center gap-4">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">CLIENT: <span className="text-slate-600">{row.clientName}</span></p>
                          <div className="h-1 w-1 rounded-full bg-slate-200" />
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ROLE: <span className="text-slate-600">{row.freelancerName}</span></p>
                       </div>
                    </div>
                 </div>

                 <div className="flex flex-wrap items-center gap-8 md:gap-12">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">STATUS</p>
                       <StatusBadge status={row.status} />
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">BUDGET</p>
                       <p className="text-sm font-black text-slate-900">INR {row.budget.toLocaleString("en-IN")}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">LAST SYNC</p>
                       <p className="text-xs font-bold text-slate-500">{row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : "Pending"}</p>
                    </div>
                    <Button
                      className="h-12 w-12 md:w-auto md:px-6 rounded-2xl bg-slate-900 text-[10px] font-black tracking-widest uppercase text-white shadow-lg shadow-slate-900/10 hover:bg-blue-600 transition-all hover:scale-105 active:scale-95"
                      onClick={() => navigate(`/project-manager/projects/${row.id}`)}
                    >
                      <span className="hidden md:inline">Open Project</span>
                      <Plus className="md:hidden h-5 w-5" />
                    </Button>
                 </div>
               </div>
             ))}
           </div>
         )}
      </div>
    </PmShell>
  );
};

export default ProjectsPage;
