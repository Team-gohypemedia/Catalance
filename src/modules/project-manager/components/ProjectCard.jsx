import PropTypes from "prop-types";
import Clock3 from "lucide-react/dist/esm/icons/clock-3";
import MessageSquare from "lucide-react/dist/esm/icons/message-square";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import CalendarClock from "lucide-react/dist/esm/icons/calendar-clock";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/modules/project-manager/components/StatusBadge";

export const ProjectCard = ({ project, onOpen }) => (
  <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
    <CardHeader className="space-y-3 pb-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <CardTitle className="line-clamp-1 text-2xl font-semibold text-slate-900">{project.projectName}</CardTitle>
          <p className="text-sm text-slate-600">Client: {project.clientName}</p>
          <p className="text-sm text-slate-600">Freelancer: {project.assignedFreelancer}</p>
        </div>
        <StatusBadge status={project.status} />
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-slate-500">Total Messages</p>
          <p className="text-2xl font-semibold text-slate-900">{project.totalMessages}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-slate-500">Unread</p>
          <p className="text-2xl font-semibold text-slate-900">{project.unreadMessages}</p>
        </div>
      </div>

      <div className="space-y-1 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Last sender: {project.lastMessageSender || "No messages yet"}
        </div>
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4" />
          Last activity: {project.lastActivityTime ? new Date(project.lastActivityTime).toLocaleString() : "N/A"}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Milestone Progress</span>
          <span className="font-semibold text-blue-600">{project.milestoneProgress}%</span>
        </div>
        <Progress value={project.milestoneProgress} className="h-2.5 rounded-full bg-slate-200" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {project.unreadMessages > 0 ? (
          <Badge className="rounded-full border border-slate-200 bg-slate-900 px-3 py-1 text-white">
            {project.unreadMessages} unread
          </Badge>
        ) : null}
        {project.upcomingMeeting ? (
          <Badge variant="outline" className="gap-1 rounded-full border-slate-300 px-3 py-1 text-slate-700">
            <CalendarClock className="h-3.5 w-3.5" />
            Meeting {new Date(project.upcomingMeeting).toLocaleString()}
          </Badge>
        ) : null}
        {project.urgentMeeting ? (
          <Badge className="rounded-full bg-rose-100 px-3 py-1 text-rose-700">Meeting in 30 mins</Badge>
        ) : null}
        {project.hasIssue ? (
          <Badge className="gap-1 rounded-full bg-rose-100 px-3 py-1 text-rose-700">
            <AlertTriangle className="h-3.5 w-3.5" />
            Needs attention
          </Badge>
        ) : null}
      </div>

      <Button className="h-11 w-full rounded-xl bg-blue-600 text-base font-semibold hover:bg-blue-700" onClick={() => onOpen(project.id)}>
        Open Project
      </Button>
    </CardContent>
  </Card>
);

ProjectCard.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.string.isRequired,
    projectName: PropTypes.string.isRequired,
    clientName: PropTypes.string,
    assignedFreelancer: PropTypes.string,
    status: PropTypes.string.isRequired,
    totalMessages: PropTypes.number,
    unreadMessages: PropTypes.number,
    lastMessageSender: PropTypes.string,
    lastActivityTime: PropTypes.string,
    milestoneProgress: PropTypes.number,
    upcomingMeeting: PropTypes.string,
    urgentMeeting: PropTypes.bool,
    hasIssue: PropTypes.bool,
  }).isRequired,
  onOpen: PropTypes.func.isRequired,
};
