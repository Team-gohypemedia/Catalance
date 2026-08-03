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
  "ISSUE RAISED": "bg-destructive/10 text-destructive border-destructive/20",
  "IN PROGRESS": "bg-primary/10 text-primary border-primary/20",
  "PROPOSAL": "bg-muted text-muted-foreground border-border",
  "STARTED": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  "COMPLETED": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
};

export const ProjectPremiumCard = ({ project, onOpen }) => {
  const statusClass =
    statusConfig[project.status.toUpperCase()] ||
    "bg-muted text-muted-foreground border-border";
  
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
    <div
      onClick={() => onOpen(project.id)}
      className="group flex flex-col justify-between rounded-3xl border border-border/60 bg-card p-5 sm:p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/40 cursor-pointer space-y-5"
    >
      <div className="space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-3">
          <Badge className={`rounded-full px-3 py-0.5 text-[10px] font-semibold tracking-wider ${statusClass}`}>
            {project.status.toUpperCase()}
          </Badge>
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5 text-primary" />
            <span className="font-semibold text-foreground">{project.totalMessages || 0}</span>
          </div>
        </div>

        {/* Title & Client */}
        <div>
          <h3 className="text-lg font-semibold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-1">
            {project.projectName}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground font-medium truncate">
            Client: <span className="text-foreground font-semibold">{project.clientName || "Unknown"}</span>
          </p>
        </div>

        {/* Freelancer & Activity Chips */}
        <div className="grid gap-2.5 sm:grid-cols-2">
          <div className="flex items-center gap-2.5 rounded-2xl border border-border/50 bg-muted/30 p-2.5">
            <Avatar className="h-8 w-8 rounded-full border border-border shrink-0">
              <AvatarImage src={project.freelancerAvatar} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                {project.assignedFreelancer?.[0] || "F"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Freelancer</p>
              <p className="text-xs font-semibold text-foreground truncate">{project.assignedFreelancer || "Unassigned"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-2xl border border-border/50 bg-muted/30 p-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
              <Clock className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Last Activity</p>
              <p className="text-xs font-semibold text-foreground truncate">{activityLabel}</p>
            </div>
          </div>
        </div>

        {/* Milestone Progress Bar */}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Progress</span>
            <span className="font-bold text-primary">{project.milestoneProgress || 0}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                project.status === "COMPLETED" ? "bg-emerald-500" : "bg-primary"
              }`}
              style={{ width: `${project.milestoneProgress || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="flex items-center justify-between pt-2 gap-3 border-t border-border/40">
        <div className="flex flex-wrap items-center gap-1.5">
          {project.hasIssue && (
            <Badge className="bg-destructive/10 text-destructive border-destructive/20 rounded-full px-2 py-0.5 text-[9px] font-semibold">
              <AlertTriangle className="mr-1 h-3 w-3" />
              Issue
            </Badge>
          )}
          {project.upcomingMeeting && (
            <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full px-2 py-0.5 text-[9px] font-semibold">
              <MessageCircle className="mr-1 h-3 w-3" />
              Sync
            </Badge>
          )}
        </div>

        <Button
          type="button"
          className="h-9 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(project.id);
          }}
        >
          Open Project
        </Button>
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
