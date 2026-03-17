import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Plus from "lucide-react/dist/esm/icons/plus";
import LayoutGrid from "lucide-react/dist/esm/icons/layout-grid";
import List from "lucide-react/dist/esm/icons/list";
import CalendarIcon from "lucide-react/dist/esm/icons/calendar";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/shared/context/AuthContext";
import { PmShell } from "@/modules/project-manager/components/PmShell";
import { MeetingCard } from "@/modules/project-manager/components/MeetingCard";
import { ProjectPremiumCard } from "@/modules/project-manager/components/ProjectPremiumCard";
import { useAsyncResource } from "@/modules/project-manager/hooks/use-async-resource";
import { pmApi } from "@/modules/project-manager/services/pm-api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STAT_COLOR_CLASS = {
  blue: { bg: "bg-blue-50", text: "text-blue-600" },
  rose: { bg: "bg-rose-50", text: "text-rose-600" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-600" },
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const { data, loading } = useAsyncResource(
    () => pmApi.getDashboard(authFetch),
    [authFetch]
  );

  const projects = useMemo(() => data?.projects || [], [data?.projects]);
  const meetings = useMemo(() => data?.upcomingMeetings || [], [data?.upcomingMeetings]);
  const stats = data?.stats || { activeProjects: 0, openIssues: 0, unreadMessages: 0, upcomingMeetings: 0 };
  const [portfolioView, setPortfolioView] = useState("grid");
  const openMeetingProject = (projectId) => {
    if (!projectId) return;
    navigate(`/project-manager/projects/${projectId}`);
  };

  return (
    <PmShell
      title="Management Hub"
      subtitle={`Overseeing ${stats.activeProjects} operational units across the platform infrastructure.`}

    >
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
         {[
            { label: 'Active Projects', value: stats.activeProjects, icon: LayoutGrid, color: 'blue', sub: 'Running now' },
            { label: 'Open Issues', value: stats.openIssues, icon: AlertCircle, color: 'rose', sub: 'Needs attention' },
            { label: 'Unread Comms', value: stats.unreadMessages, icon: MessageCircle, color: 'indigo', sub: 'Inbound updates' },
            { label: 'Today Meetings', value: stats.upcomingMeetings, icon: CalendarIcon, color: 'amber', sub: 'Upcoming syncs' },
         ].map((stat, i) => (
           <Card key={i} className="rounded-[7px] border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden bg-white">
              <CardContent className="p-8">
                 <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-[7px] transition-transform group-hover:scale-110 ${STAT_COLOR_CLASS[stat.color]?.bg || "bg-slate-50"}`}>
                    <stat.icon className={`h-6 w-6 ${STAT_COLOR_CLASS[stat.color]?.text || "text-slate-600"}`} />
                 </div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                 <div className="flex items-end justify-between">
                    <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
                    <p className="text-[10px] font-bold text-slate-400 italic mb-1">{stat.sub}</p>
                 </div>
              </CardContent>
           </Card>
         ))}
      </div>

      <section className="mb-12">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-[7px] bg-slate-900 text-white flex items-center justify-center">
                 <CalendarIcon className="h-5 w-5" />
              </div>
              <div>
                 <h2 className="text-xl font-black text-slate-900 leading-tight">Meeting Pipeline</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Vetting & Sync Schedules</p>
              </div>
           </div>
           <Button 
             variant="link" 
             className="text-[10px] font-black text-blue-600 uppercase tracking-widest p-0 h-auto hover:text-blue-700 transition-colors flex items-center gap-2 group" 
             onClick={() => navigate("/project-manager/calendar")}
           >
              Expanded View
              <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
           </Button>
        </div>
        
        {loading ? (
           <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1,2,3].map(i => <div key={i} className="h-48 rounded-[7px] bg-slate-50 animate-pulse border-2 border-dashed border-slate-100" />)}
           </div>
        ) : meetings.length > 0 ? (
           <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
             {meetings.map((meeting) => (
               <MeetingCard 
                 key={meeting.id} 
                 {...meeting} 
                 project={meeting.projectName}
                 time={new Date(meeting.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 status={meeting.isToday ? "TODAY" : meeting.isTomorrow ? "TOMORROW" : meeting.status}
                 highlight={meeting.isInThirtyMinutes}
                 onOpen={meeting.projectId ? () => openMeetingProject(meeting.projectId) : undefined}
               />
             ))}
           </div>
        ) : (
           <div className="flex flex-col items-center justify-center py-12 rounded-[7px] border-2 border-dashed border-slate-100 bg-white shadow-inner text-center space-y-4">
              <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center">
                 <CheckCircle2 className="h-8 w-8 text-slate-200" />
              </div>
              <p className="text-sm font-bold text-slate-400 italic">No operational briefings scheduled for the next 24 hours.</p>
           </div>
        )}
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-[7px] bg-slate-900 text-white flex items-center justify-center">
                 <LayoutGrid className="h-5 w-5" />
              </div>
              <div>
                 <h2 className="text-xl font-black text-slate-900 leading-tight">Elite Portfolios</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">High-Security Operational Workspaces</p>
              </div>
           </div>
           <div className="flex items-center gap-2">
             <div className="flex items-center gap-2 bg-slate-100/50 p-1 rounded-[7px] border border-slate-100">
             <Button
               variant="ghost"
               size="icon"
               aria-pressed={portfolioView === "grid"}
               className={`h-10 w-10 rounded-xl transition-all ${portfolioView === "grid" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
               onClick={() => setPortfolioView("grid")}
             >
               <LayoutGrid className="h-5 w-5" />
             </Button>
             <Button
               variant="ghost"
               size="icon"
               aria-pressed={portfolioView === "list"}
               className={`h-10 w-10 rounded-xl transition-all ${portfolioView === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
               onClick={() => setPortfolioView("list")}
             >
               <List className="h-5 w-5" />
             </Button>
             </div>
             <Button
               variant="link"
               className="h-auto p-0 text-[10px] font-black text-blue-600 uppercase tracking-widest"
               onClick={() => navigate("/project-manager/projects")}
             >
               Full List
             </Button>
           </div>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map(i => <div key={i} className="aspect-video rounded-[7px] bg-slate-100 animate-pulse" />)}
          </div>
        ) : projects.length > 0 ? (
          portfolioView === "grid" ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              {projects.map((project) => (
                <ProjectPremiumCard
                  key={project.id}
                  project={project}
                  onOpen={(id) => navigate(`/project-manager/projects/${id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => navigate(`/project-manager/projects/${project.id}`)}
                  className="flex w-full items-center justify-between border-b border-slate-100 px-5 py-4 text-left last:border-b-0 hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-black text-slate-900">{project.projectName}</p>
                    <p className="text-[11px] font-medium text-slate-500">
                      {project.clientName} | {project.assignedFreelancer}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      className={`text-[9px] font-black uppercase ${
                        project.statusColor === "red"
                          ? "bg-rose-600 text-white"
                          : project.statusColor === "green"
                            ? "bg-emerald-600 text-white"
                            : "bg-blue-600 text-white"
                      }`}
                    >
                      {project.status}
                    </Badge>
                    <span className="text-[10px] font-bold text-slate-400">
                      Unread: {project.unreadMessages || 0}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-6 rounded-[7px] bg-white border-2 border-dashed border-slate-100 shadow-inner">
            <div className="h-20 w-20 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center animate-bounce">
              <Plus className="h-10 w-10" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-black text-slate-900">Zero Active Deployments</h3>
              <p className="text-sm font-medium text-slate-400 max-w-sm mx-auto leading-relaxed">Initiate your first secure project workspace to begin orchestrating high-level digital talent.</p>
            </div>
            <Button className="h-12 rounded-[7px] bg-blue-600 px-8 text-[10px] font-black tracking-widest uppercase text-white shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:scale-[1.03] transition-all" onClick={() => navigate("/project-manager/create-project")}>
               Spawn Operation
            </Button>
          </div>
        )}
      </section>
    </PmShell>
  );
};

export default DashboardPage;
