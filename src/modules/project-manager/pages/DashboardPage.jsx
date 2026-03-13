import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Search from "lucide-react/dist/esm/icons/search";
import Filter from "lucide-react/dist/esm/icons/filter";
import Plus from "lucide-react/dist/esm/icons/plus";
import LayoutGrid from "lucide-react/dist/esm/icons/layout-grid";
import List from "lucide-react/dist/esm/icons/list";
import CalendarIcon from "lucide-react/dist/esm/icons/calendar";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/shared/context/AuthContext";
import { PmShell } from "@/modules/project-manager/components/PmShell";
import { MeetingCard } from "@/modules/project-manager/components/MeetingCard";
import { ProjectPremiumCard } from "@/modules/project-manager/components/ProjectPremiumCard";
import { useAsyncResource } from "@/modules/project-manager/hooks/use-async-resource";
import { pmApi } from "@/modules/project-manager/services/pm-api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  return (
    <PmShell
      title="Management Hub"
      subtitle={`Overseeing ${stats.activeProjects} operational units across the platform infrastructure.`}
      actions={
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-11 rounded-2xl border-slate-200 bg-white px-5 text-[10px] font-black tracking-widest uppercase text-slate-600 hover:bg-slate-50 transition-all outline-none">
             Monitor Logs
          </Button>
          <Button className="h-11 rounded-2xl bg-blue-600 px-6 text-[10px] font-black tracking-widest uppercase text-white shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all" onClick={() => navigate("/project-manager/create-project")}>
            <Plus className="mr-2 h-4 w-4" />
            New Operation
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
         {[
            { label: 'Active Projects', value: stats.activeProjects, icon: LayoutGrid, color: 'blue', sub: 'Running now' },
            { label: 'Open Issues', value: stats.openIssues, icon: AlertCircle, color: 'rose', sub: 'Needs attention' },
            { label: 'Unread Comms', value: stats.unreadMessages, icon: MessageCircle, color: 'indigo', sub: 'Inbound updates' },
            { label: 'Today Meetings', value: stats.upcomingMeetings, icon: CalendarIcon, color: 'amber', sub: 'Upcoming syncs' },
         ].map((stat, i) => (
           <Card key={i} className="rounded-[32px] border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group overflow-hidden bg-white">
              <CardContent className="p-8">
                 <div className={`h-12 w-12 rounded-2xl bg-${stat.color}-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
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
              <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
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
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3].map(i => <div key={i} className="h-48 rounded-[40px] bg-slate-50 animate-pulse border-2 border-dashed border-slate-100" />)}
           </div>
        ) : meetings.length > 0 ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {meetings.map((meeting) => (
               <MeetingCard 
                 key={meeting.id} 
                 {...meeting} 
                 project={meeting.projectName}
                 time={new Date(meeting.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 status={meeting.isToday ? "TODAY" : meeting.isTomorrow ? "TOMORROW" : meeting.status}
                 highlight={meeting.isInThirtyMinutes}
               />
             ))}
           </div>
        ) : (
           <div className="flex flex-col items-center justify-center py-16 rounded-[48px] border-2 border-dashed border-slate-100 bg-white shadow-inner text-center space-y-4">
              <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center">
                 <CheckCircle2 className="h-8 w-8 text-slate-200" />
              </div>
              <p className="text-sm font-bold text-slate-400 italic">No operational briefings scheduled for the next 24 hours.</p>
           </div>
        )}
      </section>

      <section className="space-y-8">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                 <LayoutGrid className="h-5 w-5" />
              </div>
              <div>
                 <h2 className="text-xl font-black text-slate-900 leading-tight">Elite Portfolios</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">High-Security Operational Workspaces</p>
              </div>
           </div>
           <div className="flex items-center gap-2 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-100">
             <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white text-slate-900 shadow-sm transition-all">
               <LayoutGrid className="h-5 w-5" />
             </Button>
             <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-slate-600 transition-all" onClick={() => navigate("/project-manager/projects")}>
               <List className="h-5 w-5" />
             </Button>
           </div>
        </div>

        {loading ? (
          <div className="grid gap-8 md:grid-cols-2">
            {[1, 2, 3, 4].map(i => <div key={i} className="aspect-video rounded-[48px] bg-slate-100 animate-pulse" />)}
          </div>
        ) : projects.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2">
            {projects.map((project) => (
              <ProjectPremiumCard 
                key={project.id} 
                project={project} 
                onOpen={(id) => navigate(`/project-manager/projects/${id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-8 rounded-[60px] bg-white border-2 border-dashed border-slate-100 shadow-inner">
            <div className="h-24 w-24 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center animate-bounce">
              <Plus className="h-10 w-10" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-black text-slate-900">Zero Active Deployments</h3>
              <p className="text-sm font-medium text-slate-400 max-w-sm mx-auto leading-relaxed">Initiate your first secure project workspace to begin orchestrating high-level digital talent.</p>
            </div>
            <Button className="h-14 rounded-2xl bg-blue-600 px-10 text-[10px] font-black tracking-widest uppercase text-white shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:scale-[1.05] transition-all" onClick={() => navigate("/project-manager/create-project")}>
               Spawn Operation
            </Button>
          </div>
        )}
      </section>
    </PmShell>
  );
};

export default DashboardPage;
