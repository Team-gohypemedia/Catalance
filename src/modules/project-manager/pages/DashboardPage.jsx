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
  blue: { bg: "bg-primary/10", text: "text-primary" },
  rose: { bg: "bg-destructive/10", text: "text-destructive" },
  indigo: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400" },
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
  const firstUnreadProjectId = useMemo(
    () => projects.find((project) => Number(project?.unreadMessages || 0) > 0)?.id || null,
    [projects]
  );
  const statCards = useMemo(
    () => [
      {
        label: "Active Projects",
        value: stats.activeProjects,
        icon: LayoutGrid,
        color: "blue",
        sub: "Running now",
        href: "/project-manager/projects?preset=active",
      },
      {
        label: "Open Issues",
        value: stats.openIssues,
        icon: AlertCircle,
        color: "rose",
        sub: "Needs attention",
        href: "/project-manager/projects?preset=issues",
      },
      {
        label: "Unread Comms",
        value: stats.unreadMessages,
        icon: MessageCircle,
        color: "indigo",
        sub: "Inbound updates",
        href: firstUnreadProjectId
          ? `/project-manager/messages?projectId=${firstUnreadProjectId}`
          : "/project-manager/messages",
      },
      {
        label: "Today Meetings",
        value: stats.upcomingMeetings,
        icon: CalendarIcon,
        color: "amber",
        sub: "Upcoming syncs",
        href: "/project-manager/appointments?time=UPCOMING",
      },
    ],
    [firstUnreadProjectId, stats.activeProjects, stats.openIssues, stats.unreadMessages, stats.upcomingMeetings]
  );
  const openMeetingProject = (projectId) => {
    if (!projectId) return;
    navigate(`/project-manager/projects/${projectId}`);
  };

  return (
    <PmShell
      title="Management Hub"
      subtitle={`Overseeing ${loading ? "..." : stats.activeProjects} active operational units across platform infrastructure.`}
    >
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-5">
        {loading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="h-36 rounded-3xl bg-muted/50 animate-pulse border border-border/40" />
          ))
        ) : (
         statCards.map((stat) => (
           <button
             key={stat.label}
             type="button"
             onClick={() => navigate(stat.href)}
             className="w-full text-left outline-none group"
             aria-label={`Open ${stat.label}`}
           >
             <Card className="rounded-3xl border-border/60 bg-card text-card-foreground shadow-xs transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md overflow-hidden">
              <CardContent className="p-6">
                 <div className="flex items-center justify-between mb-4">
                   <div className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-transform group-hover:scale-105 ${STAT_COLOR_CLASS[stat.color]?.bg || "bg-muted"}`}>
                      <stat.icon className={`h-5.5 w-5.5 ${STAT_COLOR_CLASS[stat.color]?.text || "text-foreground"}`} />
                   </div>
                   <span className="text-[11px] font-medium text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded-full">
                     {stat.sub}
                   </span>
                 </div>
                 <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</p>
                 <h3 className="text-3xl font-bold tracking-tight text-foreground">{stat.value}</h3>
              </CardContent>
             </Card>
           </button>
         ))
        )}
      </div>

      {/* Meeting Pipeline Section */}
      <section className="space-y-5 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
           <div className="flex items-center gap-3">
              <h2 className="text-[22px] sm:text-[1.75rem] font-semibold tracking-[-0.02em] text-foreground">
                Meeting Pipeline
              </h2>
              <span className="relative inline-flex size-[15px] shrink-0 items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-emerald-500/10" />
                <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                <span className="relative block size-[6px] rounded-full bg-emerald-500" />
              </span>
           </div>
           <Button 
            variant="ghost" 
            className="text-xs font-semibold text-primary hover:text-primary/80 hover:bg-primary/5 p-0 h-auto self-start sm:self-auto flex items-center gap-1.5 group shrink-0" 
            onClick={() => navigate("/project-manager/appointments?time=UPCOMING")}
          >
            Expanded View
            <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Button>
        </div>
        
        {loading ? (
           <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => <div key={i} className="h-44 rounded-3xl bg-muted/50 animate-pulse border border-border/40" />)}
           </div>
        ) : meetings.length > 0 ? (
           <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
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
           <div className="flex flex-col items-center justify-center py-12 rounded-3xl border border-border/60 bg-card p-8 text-center space-y-3">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                 <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No operational briefings scheduled for the next 24 hours.</p>
           </div>
        )}
      </section>

      {/* Assigned Projects Section */}
      <section className="space-y-5 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
           <div className="flex items-center gap-3">
              <h2 className="text-[22px] sm:text-[1.75rem] font-semibold tracking-[-0.02em] text-foreground">
                Assigned Projects
              </h2>
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary/10 px-2 text-[11px] font-bold text-primary">
                {projects.length}
              </span>
           </div>
           <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
             <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-full border border-border/60">
               <Button
                 variant="ghost"
                 size="icon"
                 aria-pressed={portfolioView === "grid"}
                 className={`h-8 w-8 rounded-full transition-all ${portfolioView === "grid" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
                 onClick={() => setPortfolioView("grid")}
               >
                 <LayoutGrid className="h-4 w-4" />
               </Button>
               <Button
                 variant="ghost"
                 size="icon"
                 aria-pressed={portfolioView === "list"}
                 className={`h-8 w-8 rounded-full transition-all ${portfolioView === "list" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
                 onClick={() => setPortfolioView("list")}
               >
                 <List className="h-4 w-4" />
               </Button>
             </div>
             <Button
               variant="ghost"
               className="h-auto p-0 text-xs font-semibold text-primary hover:bg-transparent hover:underline shrink-0"
               onClick={() => navigate("/project-manager/projects")}
             >
               Full List
             </Button>
           </div>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-40 rounded-3xl bg-muted/50 animate-pulse border border-border/40" />)}
          </div>
        ) : projects.length > 0 ? (
          portfolioView === "grid" ? (
            <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectPremiumCard
                  key={project.id}
                  project={project}
                  onOpen={(id) => navigate(`/project-manager/projects/${id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-xs divide-y divide-border/60">
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => navigate(`/project-manager/projects/${project.id}`)}
                  className="flex w-full flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-4 text-left hover:bg-muted/40 gap-3 sm:gap-0 transition-colors"
                >
                  <div className="min-w-0 w-full sm:w-auto">
                    <p className="text-sm font-semibold text-foreground truncate">{project.projectName}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      Client: {project.clientName} | Freelancer: {project.assignedFreelancer}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-primary/10 text-primary border-primary/20"
                    >
                      {project.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-medium">
                      Unread: {project.unreadMessages || 0}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 rounded-3xl bg-card border border-border/60 shadow-xs px-6">
            <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Plus className="h-7 w-7" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-lg font-semibold text-foreground">Zero Active Deployments</h3>
              <p className="text-sm text-muted-foreground">Initiate your first secure project workspace to begin orchestrating digital talent.</p>
            </div>
            <Button 
              className="h-10 rounded-full bg-primary px-6 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors" 
              onClick={() => navigate("/project-manager/create-project")}
            >
               Spawn Operation
            </Button>
          </div>
        )}
      </section>
    </PmShell>
  );
};

export default DashboardPage;
