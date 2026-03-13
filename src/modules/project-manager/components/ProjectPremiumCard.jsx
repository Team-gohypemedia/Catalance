import { useMemo } from "react";
import PropTypes from "prop-types";
import MessageSquare from "lucide-react/dist/esm/icons/message-square";
import Clock from "lucide-react/dist/esm/icons/clock";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const statusConfig = {
  "ISSUE RAISED": "bg-rose-100 text-rose-700 border border-rose-200",
  "IN PROGRESS": "bg-blue-100 text-blue-700 border border-blue-200",
  "PROPOSAL": "bg-slate-100 text-slate-700 border border-slate-200",
  "STARTED": "bg-indigo-100 text-indigo-700 border border-indigo-200",
  "COMPLETED": "bg-emerald-100 text-emerald-700 border border-emerald-200",
};

export const ProjectPremiumCard = ({ project, onOpen }) => {
  const statusClass =
    statusConfig[project.status.toUpperCase()] ||
    "bg-slate-100 text-slate-700 border border-slate-200";
  
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
    <div className="border-b border-slate-200 px-4 py-5 last:border-b-0 md:px-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-center">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Badge
              className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusClass}`}
            >
              {project.status.toUpperCase()}
            </Badge>
            <div className="flex items-center gap-2 rounded-md border border-slate-200 px-2.5 py-1.5">
              <MessageSquare className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-700">
                {project.totalMessages}
              </span>
            </div>
          </div>

          <div>
            <h3
              className="text-xl font-bold text-slate-900 leading-tight cursor-pointer"
              onClick={() => onOpen(project.id)}
            >
              {project.projectName}
            </h3>
            <p className="mt-1 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Client Hub: <span className="text-slate-800">{project.clientName}</span>
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2.5">
              <Avatar className="h-10 w-10 rounded-lg">
                <AvatarImage src={project.freelancerAvatar} />
                <AvatarFallback className="bg-slate-200 text-slate-600 font-semibold">
                  {project.assignedFreelancer?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Freelancer
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {project.assignedFreelancer || "Unassigned"}
                </p>
              </div>
            </div>

            <div className="rounded-md border border-slate-200 px-3 py-2.5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Last Activity
              </p>
              <div className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Clock className="h-4 w-4 text-slate-500" />
                <span>{activityLabel}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Execution Velocity
              </p>
              <span className="text-xs font-semibold text-slate-700">
                {project.milestoneProgress}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  project.status === "COMPLETED" ? "bg-emerald-500" : "bg-blue-600"
                }`}
                style={{ width: `${project.milestoneProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-stretch justify-between gap-3 lg:items-end">
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            {project.hasIssue && (
              <Badge className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 text-[10px] font-semibold">
                <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                Action Required
              </Badge>
            )}

            {project.upcomingMeeting && (
              <Badge className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 text-[10px] font-semibold">
                <MessageCircle className="mr-1 h-3.5 w-3.5" />
                {new Date(project.upcomingMeeting).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Badge>
            )}
          </div>

          <Button
            className="h-10 rounded-md bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 lg:min-w-[140px]"
            onClick={() => onOpen(project.id)}
          >
            Open Project
          </Button>
        </div>
      </div>
    </div>
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
