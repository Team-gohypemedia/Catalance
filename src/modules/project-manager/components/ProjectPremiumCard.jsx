import { useMemo } from "react";
import PropTypes from "prop-types";
import MessageSquare from "lucide-react/dist/esm/icons/message-square";
import Clock from "lucide-react/dist/esm/icons/clock";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import Zap from "lucide-react/dist/esm/icons/zap";
import Target from "lucide-react/dist/esm/icons/target";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const statusConfig = {
  "ISSUE RAISED": "bg-rose-500 text-white shadow-lg shadow-rose-200",
  "IN PROGRESS": "bg-blue-600 text-white shadow-lg shadow-blue-200",
  "PROPOSAL": "bg-slate-900 text-white shadow-lg shadow-slate-200",
  "STARTED": "bg-indigo-600 text-white shadow-lg shadow-indigo-200",
  "COMPLETED": "bg-emerald-500 text-white shadow-lg shadow-emerald-200",
};

export const ProjectPremiumCard = ({ project, onOpen }) => {
  const statusClass = statusConfig[project.status.toUpperCase()] || "bg-slate-400 text-white";
  
  const activityLabel = useMemo(() => {
    if (project.lastActivityFriendly) return project.lastActivityFriendly;
    if (!project.lastActivityTime) return "Live Sync";
    
    try {
        const date = new Date(project.lastActivityTime);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hr ago`;
        return `${diffDays} d ago`;
    } catch {
        return "Live Sync";
    }
  }, [project.lastActivityFriendly, project.lastActivityTime]);

  return (
    <Card className="group relative overflow-hidden rounded-[48px] border-slate-100 bg-white shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-700 outline-none">
      <div className="absolute top-0 right-0 p-12 opacity-0 group-hover:opacity-5 transition-opacity duration-700 pointer-events-none">
         <Target className="h-64 w-64 text-blue-600" />
      </div>
      
      <CardContent className="p-10 relative z-10">
        <div className="mb-10 flex items-start justify-between">
          <Badge className={`rounded-xl border-0 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] ${statusClass}`}>
            {project.status.toUpperCase()}
          </Badge>
          <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
             <MoreHorizontal className="h-6 w-6" />
          </div>
        </div>
        
        <div className="mb-12">
          <h3 className="mb-3 text-3xl font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors cursor-pointer" onClick={() => onOpen(project.id)}>
            {project.projectName}
          </h3>
          <div className="flex items-center gap-3">
             <div className="h-4 w-4 rounded-full bg-slate-100 flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
             </div>
             <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
               Client Hub: <span className="text-slate-900 ml-1">{project.clientName}</span>
             </p>
          </div>
        </div>
        
        <div className="mb-12 flex items-center justify-between bg-slate-50/50 p-8 rounded-[38px] border border-slate-100 transition-colors group-hover:bg-white group-hover:border-blue-50">
          <div className="flex items-center gap-6">
            <div className="relative">
               <Avatar className="h-16 w-16 rounded-[24px] border-4 border-white shadow-xl">
                 <AvatarImage src={project.freelancerAvatar} />
                 <AvatarFallback className="bg-slate-200 text-slate-500 font-black">{project.assignedFreelancer?.[0]}</AvatarFallback>
               </Avatar>
               <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-lg bg-emerald-500 border-2 border-white shadow-sm flex items-center justify-center">
                  <Zap className="h-3 w-3 text-white fill-white" />
               </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Operational Lead</span>
              <span className="text-lg font-black text-slate-900">{project.assignedFreelancer || "Recruiting..."}</span>
            </div>
          </div>
          
          <div className="hidden sm:flex flex-col items-end">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Comms Volume</span>
             <div className="flex items-center gap-3 px-5 py-2.5 bg-white rounded-2xl shadow-sm border border-slate-100">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <span className="text-lg font-black text-slate-900">{project.totalMessages}</span>
             </div>
          </div>
        </div>
        
        <div className="mb-12 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Execution Velocity</p>
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">{project.milestoneProgress}%</span>
            </div>
          </div>
          <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden p-1 shadow-inner">
             <div 
               className={`h-2 rounded-full transition-all duration-1000 ease-out ${project.status === "COMPLETED" ? "bg-emerald-500" : "bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)] shadow-blue-500"}`}
               style={{ width: `${project.milestoneProgress}%` }}
             />
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-10 border-t border-slate-100">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-[20px] bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
               <Clock className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Last Activity</span>
               <span className="text-xs font-black text-slate-900 whitespace-nowrap">{activityLabel}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3">
             {project.hasIssue && (
                <Badge className="bg-rose-50 text-rose-600 border border-rose-100 px-5 py-2.5 rounded-2xl flex items-center gap-2 shadow-sm">
                   <AlertTriangle className="h-4 w-4" />
                   <span className="text-[9px] font-black uppercase tracking-[0.1em]">Action Required</span>
                </Badge>
             )}
             
             {project.upcomingMeeting && (
                <Badge className="bg-blue-600 text-white border-none px-5 py-2.5 rounded-2xl flex items-center gap-2 shadow-xl shadow-blue-500/20">
                   <MessageCircle className="h-4 w-4" />
                   <span className="text-[9px] font-black uppercase tracking-[0.1em]">
                     {new Date(project.upcomingMeeting).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </span>
                </Badge>
             )}

             <Button 
               className="h-12 px-8 rounded-2xl bg-slate-900 font-black text-[10px] tracking-widest uppercase text-white hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10"
               onClick={() => onOpen(project.id)}
             >
                Open Vault
             </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

ProjectPremiumCard.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.string.isRequired,
    projectName: PropTypes.string.isRequired,
    clientName: PropTypes.string,
    assignedFreelancer: PropTypes.string,
    freelancerAvatar: PropTypes.string,
    status: PropTypes.string.isRequired,
    totalMessages: PropTypes.number,
    milestoneProgress: PropTypes.number,
    lastActivityFriendly: PropTypes.string,
    hasIssue: PropTypes.bool,
    urgentMeeting: PropTypes.bool,
    upcomingMeeting: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  }).isRequired,
  onOpen: PropTypes.func.isRequired,
};
