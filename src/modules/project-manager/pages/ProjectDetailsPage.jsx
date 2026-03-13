import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Send from "lucide-react/dist/esm/icons/send";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import Settings from "lucide-react/dist/esm/icons/settings";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Download from "lucide-react/dist/esm/icons/download";
import FileText from "lucide-react/dist/esm/icons/file-text";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Users from "lucide-react/dist/esm/icons/users";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import Plus from "lucide-react/dist/esm/icons/plus";
import { toast } from "sonner";
import { useAuth } from "@/shared/context/AuthContext";
import { pmApi } from "@/modules/project-manager/services/pm-api";
import { PmShell } from "@/modules/project-manager/components/PmShell";
import { useAsyncResource } from "@/modules/project-manager/hooks/use-async-resource";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getSopFromTitle } from "@/shared/data/sopTemplates";

const getTaskLeadRole = (phaseId) => {
  const normalizedPhase = String(phaseId || "");
  if (normalizedPhase === "1") return "CLIENT";
  if (normalizedPhase === "4") return "PROJECT_MANAGER";
  return "FREELANCER";
};

const normalizeExternalLink = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
};

const toLocalDateTimeInputValue = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const buildMeetingFormDefaults = () => {
  const now = new Date();
  const startsAt = new Date(now);
  startsAt.setSeconds(0, 0);
  startsAt.setMinutes(0);
  startsAt.setHours(startsAt.getHours() + 1);

  const endsAt = new Date(startsAt);
  endsAt.setHours(endsAt.getHours() + 1);

  return {
    title: "Project Sync",
    participantScope: "BOTH",
    platform: "INTERNAL",
    notes: "",
    startsAt: toLocalDateTimeInputValue(startsAt),
    endsAt: toLocalDateTimeInputValue(endsAt),
  };
};

const ProjectDetailsPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { authFetch, user } = useAuth();
  const [composer, setComposer] = useState("");
  const [sending, setSending] = useState(false);
  const [clientProfileOpen, setClientProfileOpen] = useState(false);
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
  const [meetingSubmitting, setMeetingSubmitting] = useState(false);
  const [meetingForm, setMeetingForm] = useState(() => buildMeetingFormDefaults());
  const [checklist, setChecklist] = useState({
    sourceCodeTransferred: false,
    documentationFinalized: false,
    credentialsShared: false,
    finalFilesDelivered: false,
    noPendingIssues: false,
  });

  const details = useAsyncResource(
    () => pmApi.getProjectDetails(authFetch, projectId),
    [authFetch, projectId]
  );
  
  const messages = useAsyncResource(
    () => pmApi.getProjectMessages(authFetch, projectId),
    [authFetch, projectId]
  );
  const notifications = useAsyncResource(
    () => pmApi.getNotifications(authFetch),
    [authFetch]
  );
  const meetings = useAsyncResource(
    () =>
      pmApi.getMeetings(authFetch, {
        view: "month",
        from: new Date().toISOString().slice(0, 10),
      }),
    [authFetch]
  );

  useEffect(() => {
    if (details.data?.handoverChecklist) {
        setChecklist(prev => ({ ...prev, ...details.data.handoverChecklist }));
    }
  }, [details.data]);

  const handleSendMessage = async () => {
    if (!composer.trim() || sending) return;
    setSending(true);
    try {
        await pmApi.sendProjectMessage(authFetch, projectId, composer);
        setComposer("");
        messages.refresh();
        toast.success("Message sent");
    } catch (e) {
        toast.error(e.message || "Failed to send message");
    } finally {
        setSending(false);
    }
  };

  const handleApproveMilestone = async (phase) => {
    try {
        await pmApi.approveMilestone(authFetch, projectId, phase, "Approved via PM Dashboard");
        details.refresh();
        toast.success(`Phase ${phase} approved`);
    } catch (e) {
        toast.error(e.message || "Approval failed");
    }
  };

  const handleFinalizeHandover = async () => {
    try {
        await pmApi.finalizeHandover(authFetch, projectId, checklist);
        details.refresh();
        toast.success("Project handover finalized");
    } catch (e) {
        toast.error(e.message || "Failed to finalize handover");
    }
  };

  const handleOpenPortfolio = () => {
    if (!freelancerProfile) return;

    const directPortfolioUrl = normalizeExternalLink(freelancerProfile.portfolio);
    const fallbackPortfolioUrl = normalizeExternalLink(
      freelancerProfile.portfolioProjects?.[0]?.link
    );

    if (directPortfolioUrl || fallbackPortfolioUrl) {
      window.open(directPortfolioUrl || fallbackPortfolioUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (freelancerProfile.id) {
      navigate(`/project-manager/profile/${freelancerProfile.id}`);
      return;
    }

    toast.info("Portfolio is not available yet.");
  };

  const handleScheduleMeeting = async () => {
    if (meetingSubmitting) return;

    const startsAt = new Date(meetingForm.startsAt);
    const endsAt = new Date(meetingForm.endsAt);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
      toast.error("Please select valid start and end time.");
      return;
    }

    if (
      (meetingForm.participantScope === "FREELANCER" || meetingForm.participantScope === "BOTH") &&
      !freelancerProfile?.id
    ) {
      toast.error("No freelancer assigned on this project.");
      return;
    }

    setMeetingSubmitting(true);
    try {
      const startsAtIso = startsAt.toISOString();
      const endsAtIso = endsAt.toISOString();

      const conflict = await pmApi.detectMeetingConflicts(authFetch, {
        startsAt: startsAtIso,
        endsAt: endsAtIso,
      });

      if (conflict?.hasConflict) {
        const suggestion = Array.isArray(conflict.suggestedSlots) && conflict.suggestedSlots[0]
          ? ` Try ${new Date(conflict.suggestedSlots[0].startsAt).toLocaleString()}.`
          : "";
        toast.error(`Meeting slot conflict detected.${suggestion}`);
        return;
      }

      await pmApi.createMeeting(authFetch, {
        projectId,
        title: meetingForm.title || "Project Sync",
        participantScope: meetingForm.participantScope,
        platform: meetingForm.platform,
        notes: meetingForm.notes,
        startsAt: startsAtIso,
        endsAt: endsAtIso,
      });

      toast.success("Meeting scheduled successfully.");
      setMeetingDialogOpen(false);
      setMeetingForm(buildMeetingFormDefaults());
      meetings.refresh();
    } catch (e) {
      toast.error(e.message || "Failed to schedule meeting.");
    } finally {
      setMeetingSubmitting(false);
    }
  };

  const project = details.data?.project || {};
  const clientProfile = details.data?.clientProfile || {};
  const freelancerProfile = details.data?.freelancerProfile || null;
  const milestoneRows = useMemo(
    () => (Array.isArray(details.data?.milestones) ? details.data.milestones : []),
    [details.data?.milestones]
  );
  const conversationRows = messages.data?.messages || [];
  const recentAlerts = notifications.data?.recentAlerts;
  const projectMeetings = useMemo(() => {
    const rows = Array.isArray(meetings.data?.meetings) ? meetings.data.meetings : [];
    return rows
      .filter((meeting) => String(meeting?.projectId || "") === String(projectId || ""))
      .sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt))
      .slice(0, 4);
  }, [meetings.data?.meetings, projectId]);

  const projectNotifications = useMemo(() => {
    const normalizedProjectId = String(projectId || "");
    const alerts = Array.isArray(recentAlerts) ? recentAlerts : [];
    return alerts.filter((alert) => {
      if (!alert || typeof alert !== "object") return false;
      const payload = alert.data;
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
      const relatedProjectId =
        payload.projectId ?? payload.relatedProjectId ?? payload.project?.id;
      return String(relatedProjectId || "") === normalizedProjectId;
    });
  }, [recentAlerts, projectId]);

  const sopTemplate = useMemo(() => getSopFromTitle(project.title), [project.title]);
  const completedTaskSet = useMemo(
    () => new Set(Array.isArray(project.completedTasks) ? project.completedTasks : []),
    [project.completedTasks]
  );
  const verifiedTaskSet = useMemo(
    () => new Set(Array.isArray(project.verifiedTasks) ? project.verifiedTasks : []),
    [project.verifiedTasks]
  );

  const assigneeNames = useMemo(
    () => ({
      CLIENT: clientProfile.clientName || "Client",
      FREELANCER: freelancerProfile?.freelancerName || "Unassigned Freelancer",
      PROJECT_MANAGER: user?.fullName || "Project Catalyst",
    }),
    [clientProfile.clientName, freelancerProfile?.freelancerName, user?.fullName]
  );

  const sopTaskRows = useMemo(() => {
    const tasks = Array.isArray(sopTemplate?.tasks) ? sopTemplate.tasks : [];

    return tasks.map((task, index) => {
      const key = `${task.phase}-${task.id}`;
      const isVerified = verifiedTaskSet.has(key);
      const isCompleted = completedTaskSet.has(key);
      const leadRole = getTaskLeadRole(task.phase);
      const phaseName =
        sopTemplate?.phases?.find((phase) => String(phase.id) === String(task.phase))?.name ||
        `Phase ${task.phase}`;

      return {
        id: key,
        serial: index + 1,
        phaseId: task.phase,
        phaseName: String(phaseName).replace(/\s*\(\s*Phase-\d+\s*\)/i, "").trim(),
        title: task.title,
        leadRole,
        leadName: assigneeNames[leadRole],
        status: isVerified ? "VERIFIED" : isCompleted ? "COMPLETED" : "PENDING",
      };
    });
  }, [assigneeNames, completedTaskSet, sopTemplate, verifiedTaskSet]);

  const roleProgressRows = useMemo(() => {
    const roleOrder = ["CLIENT", "FREELANCER", "PROJECT_MANAGER"];
    return roleOrder.map((role) => {
      const roleTasks = sopTaskRows.filter((task) => task.leadRole === role);
      const verified = roleTasks.filter((task) => task.status === "VERIFIED").length;
      const completed = roleTasks.filter((task) => task.status === "COMPLETED").length;
      const pending = roleTasks.filter((task) => task.status === "PENDING").length;

      return {
        role,
        assignee: assigneeNames[role] || role,
        total: roleTasks.length,
        verified,
        completed,
        pending,
      };
    });
  }, [assigneeNames, sopTaskRows]);

  const phaseInsightRows = useMemo(() => {
    const tasksByPhase = sopTaskRows.reduce((acc, task) => {
      const phaseKey = String(task.phaseId || "");
      if (!acc[phaseKey]) acc[phaseKey] = [];
      acc[phaseKey].push(task);
      return acc;
    }, {});

    return milestoneRows.map((milestone) => {
      const phaseKey = String(milestone.phase || "");
      const phaseTasks = tasksByPhase[phaseKey] || [];
      const verifiedCount = phaseTasks.filter((task) => task.status === "VERIFIED").length;
      const completedPendingVerification = phaseTasks.filter((task) => task.status === "COMPLETED");
      const pendingTasks = phaseTasks.filter((task) => task.status === "PENDING");
      const pendingLeads = Array.from(new Set(pendingTasks.map((task) => task.leadName).filter(Boolean)));

      let stuckOn = "No blocker";
      let stuckNote = "All tasks in this phase are clear.";

      if (completedPendingVerification.length > 0) {
        stuckOn = clientProfile.clientName || "Client";
        stuckNote = `${completedPendingVerification.length} task(s) completed by freelancer, waiting for client verification.`;
      } else if (pendingTasks.length > 0) {
        const leadPreview = pendingLeads.slice(0, 2).join(", ");
        stuckOn = leadPreview || "Assigned users";
        if (pendingLeads.length > 2) {
          stuckOn = `${leadPreview} +${pendingLeads.length - 2}`;
        }
        stuckNote = `${pendingTasks.length} task(s) still pending in this phase.`;
      }

      return {
        ...milestone,
        tasks: phaseTasks,
        totalTasks: phaseTasks.length,
        verifiedCount,
        stuckOn,
        stuckNote,
        verifierName: clientProfile.clientName || "Client",
      };
    });
  }, [milestoneRows, sopTaskRows, clientProfile.clientName]);

  if (details.loading) {
    return <PmShell title="Loading..." subtitle="Fetching project details from vault..."><div className="p-20 text-center font-bold text-slate-400">Syncing project data...</div></PmShell>;
  }

  if (!details.data && !details.loading) {
      return <PmShell title="Project Not Found" subtitle="Error 404"><div className="p-20 text-center"><Button onClick={() => navigate("/project-manager/projects")}>Back to Projects</Button></div></PmShell>;
  }

  return (
    <PmShell 
      title={project.title} 
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-10 rounded-xl border-blue-100 bg-blue-50 px-5 text-xs font-bold text-blue-600 hover:bg-blue-100"
            onClick={() => setMeetingDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Schedule Meeting
          </Button>
          <Button
            variant="outline"
            className="h-10 rounded-xl border-rose-100 bg-rose-50 px-5 text-xs font-bold text-rose-600 hover:bg-rose-100"
            onClick={() => toast.info("Escalation module opening...")}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Escalate to Admin
          </Button>
        </div>
      }
    >
      <div className="mb-6 flex items-center gap-2 text-xs font-medium text-slate-400">
        <Link to="/project-manager" className="hover:text-blue-600">Dashboard</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/project-manager/projects" className="hover:text-blue-600">Projects</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-900">{project.title}</span>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <Badge className={`${project.status?.color === 'red' ? 'bg-rose-600' : 'bg-blue-600'} text-[10px] font-bold text-white px-2 py-0.5 rounded uppercase`}>
            {project.status?.label || "ACTIVE"}
        </Badge>
        <span className="text-xs font-medium text-slate-400">Project ID: #{project.id}</span>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-8 h-auto w-full justify-start gap-8 rounded-none border-b border-slate-100 bg-transparent p-0">
          <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent px-0 pb-3 font-bold text-slate-400 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600">Overview</TabsTrigger>
          <TabsTrigger value="messages" className="rounded-none border-b-2 border-transparent px-0 pb-3 font-bold text-slate-400 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600">Messages</TabsTrigger>
          <TabsTrigger value="milestones" className="rounded-none border-b-2 border-transparent px-0 pb-3 font-bold text-slate-400 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600">Milestones</TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-none border-b-2 border-transparent px-0 pb-3 font-bold text-slate-400 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <div className="space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="rounded-[32px] border-slate-100 shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow">
                  <CardContent className="p-8">
                    <div className="mb-6 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-blue-50 flex items-center justify-center">
                             <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <h3 className="text-sm font-bold text-slate-900">Client Profile</h3>
                       </div>
                    </div>
                    <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                       <Avatar className="h-14 w-14 rounded-2xl shadow-sm">
                          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${clientProfile.clientName}`} />
                          <AvatarFallback>C</AvatarFallback>
                       </Avatar>
                       <div>
                          <p className="text-base font-bold text-slate-900">{clientProfile.clientName}</p>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{clientProfile.company || "Direct Client"}</p>
                       </div>
                    </div>
                    <div className="space-y-5">
                       <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Project Scope</p>
                          <p className="text-xs font-medium text-slate-600 leading-relaxed line-clamp-3">{project.description}</p>
                       </div>
                       <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Budget Allocation</p>
                          <p className="text-xl font-black text-slate-900">INR {Number(project.budget || 0).toLocaleString("en-IN")}</p>
                       </div>
                       <Button
                          variant="outline"
                          className="h-11 w-full rounded-xl border-slate-200 bg-white text-[10px] font-black tracking-widest text-slate-600 hover:bg-slate-50 uppercase"
                          onClick={() => setClientProfileOpen(true)}
                       >
                          VIEW CLIENT PROFILE
                       </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[32px] border-slate-100 shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow">
                  <CardContent className="p-8">
                    <div className="mb-6 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                             <Users className="h-5 w-5 text-indigo-600" />
                          </div>
                          <h3 className="text-sm font-bold text-slate-900">Freelancer</h3>
                       </div>
                    </div>
                    {freelancerProfile ? (
                        <>
                            <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl bg-indigo-50/30 border border-indigo-50">
                               <Avatar className="h-14 w-14 rounded-2xl shadow-sm">
                                  <AvatarImage src={freelancerProfile.avatar} />
                                  <AvatarFallback className="bg-slate-100">{freelancerProfile.freelancerName?.[0]}</AvatarFallback>
                               </Avatar>
                               <div>
                                  <p className="text-base font-bold text-slate-900">{freelancerProfile.freelancerName}</p>
                                  <div className="flex items-center gap-1 mt-0.5">
                                     <span className="text-yellow-500 text-xs">★</span>
                                     <span className="text-xs font-bold text-slate-900">{freelancerProfile.rating}</span>
                                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter ml-1">({freelancerProfile.reviewsCount} reviews)</span>
                                  </div>
                               </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mb-6">
                               {freelancerProfile.skills.slice(0, 4).map(skill => (
                                 <Badge key={skill} variant="secondary" className="bg-white border border-slate-100 text-slate-600 text-[9px] font-bold rounded-lg px-2 py-0.5 shadow-sm">{skill.toUpperCase()}</Badge>
                               ))}
                               {freelancerProfile.skills.length > 4 && <span className="text-[9px] font-bold text-slate-400">+{freelancerProfile.skills.length - 4}</span>}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1 h-11 rounded-xl border-slate-100 bg-slate-50 text-[10px] font-black tracking-widest text-slate-600 hover:bg-white hover:border-indigo-100 hover:text-indigo-600 transition-all uppercase" onClick={handleOpenPortfolio}>
                                    VIEW FULL PORTFOLIO
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="flex-1 h-11 rounded-xl border-rose-100 bg-rose-50 text-[10px] font-black tracking-widest text-rose-600 hover:bg-rose-100 transition-all uppercase"
                                    onClick={() => navigate(`/project-manager/marketplace?projectId=${projectId}&reassign=true`)}
                                >
                                    REASSIGN FREELANCER
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 space-y-3 border-2 border-dashed border-slate-100 rounded-[24px] bg-slate-50/30">
                            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100">
                               <Plus className="h-5 w-5 text-slate-400" />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NO TALENT ASSIGNED</p>
                            <Button variant="default" className="h-9 rounded-lg bg-blue-600 text-[10px] font-black tracking-widest uppercase px-4" onClick={() => navigate("/project-manager/marketplace")}>Browse Marketplace</Button>
                        </div>
                    )}
                  </CardContent>
                </Card>
              </div>              <Card className="rounded-[40px] border-slate-100 shadow-sm bg-white overflow-hidden">
                <CardContent className="p-10">
                  <div className="mb-10 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                           <CreditCard className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                           <h3 className="text-base font-bold text-slate-900">Milestone Payout Tracker</h3>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Secure Escrow Distribution</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">COMPLETION</span>
                        <Badge className="bg-emerald-500 text-[10px] font-black text-white px-3 py-1 rounded-lg">
                           {milestoneRows.filter(m => m.status === 'Approved' || m.status === 'Completed').length} / {milestoneRows.length} PHASES
                        </Badge>
                     </div>
                  </div>
                  
                  <div className="grid gap-4 lg:grid-cols-2">
                    {phaseInsightRows.map((milestone, i) => (
                      <div
                        key={`${milestone.phase}-${i}`}
                        className={`rounded-3xl border border-slate-100 bg-white p-5 shadow-sm ${
                          milestone.status === "Locked" ? "opacity-50" : ""
                        }`}
                      >
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              Phase {milestone.phase}
                            </p>
                            <h4 className="mt-1 text-sm font-black text-slate-900">
                              {milestone.title}
                            </h4>
                          </div>
                          <Badge
                            className={`text-[9px] font-black uppercase tracking-widest ${
                              milestone.status === "Approved" || milestone.status === "Completed"
                                ? "bg-emerald-500 text-white"
                                : milestone.status === "Pending Approval"
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {milestone.status}
                          </Badge>
                        </div>

                        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                              Verified By
                            </p>
                            <p className="mt-1 text-xs font-bold text-slate-900">{milestone.verifierName}</p>
                            <p className="text-[10px] font-medium text-slate-500">
                              {milestone.verifiedCount}/{milestone.totalTasks} tasks verified
                            </p>
                          </div>
                          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">
                              Stuck On
                            </p>
                            <p className="mt-1 text-xs font-bold text-slate-900">{milestone.stuckOn}</p>
                            <p className="text-[10px] font-medium text-slate-500">{milestone.stuckNote}</p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Task Breakdown
                          </p>
                          <div className="space-y-2">
                            {milestone.tasks.length > 0 ? (
                              milestone.tasks.map((task) => (
                                <div
                                  key={task.id}
                                  className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-xs font-bold text-slate-800">{task.title}</p>
                                    <p className="text-[10px] font-medium text-slate-400">{task.leadName}</p>
                                  </div>
                                  <Badge
                                    className={`ml-3 text-[9px] font-black uppercase tracking-widest ${
                                      task.status === "VERIFIED"
                                        ? "bg-emerald-500 text-white"
                                        : task.status === "COMPLETED"
                                          ? "bg-blue-600 text-white"
                                          : "bg-slate-100 text-slate-500"
                                    }`}
                                  >
                                    {task.status}
                                  </Badge>
                                </div>
                              ))
                            ) : (
                              <p className="rounded-xl border border-dashed border-slate-200 px-3 py-3 text-xs font-medium text-slate-400">
                                No mapped tasks found for this phase.
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              Escrow Amount
                            </p>
                            <p className="text-base font-black text-slate-900">
                              INR {milestone.amount?.toLocaleString("en-IN")}
                            </p>
                          </div>
                          {milestone.eligibleForApproval && (
                            <Button
                              onClick={() => handleApproveMilestone(milestone.phase)}
                              className="h-10 rounded-xl bg-blue-600 px-5 text-[10px] font-black tracking-widest uppercase text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
                            >
                              Approve Payout
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[40px] border-slate-100 shadow-sm bg-white overflow-hidden">
                <CardHeader className="p-8 pb-5 border-b border-slate-100">
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle className="text-base font-bold text-slate-900">
                      All Phase Task Matrix
                    </CardTitle>
                    <Badge className="bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest px-3 py-1">
                      {sopTaskRows.filter((task) => task.status === "VERIFIED").length} / {sopTaskRows.length} Verified
                    </Badge>
                  </div>
                  <p className="text-xs font-medium text-slate-500 mt-2">
                    Sabhi phases ke sabhi tasks, assigned user, aur status tracking.
                  </p>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid gap-3 border-b border-slate-100 bg-slate-50/40 p-5 sm:grid-cols-3">
                    {roleProgressRows.map((roleRow) => (
                      <div key={roleRow.role} className="rounded-2xl border border-slate-100 bg-white p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {roleRow.role.replace("_", " ")}
                        </p>
                        <p className="mt-1 text-sm font-black text-slate-900">{roleRow.assignee}</p>
                        <p className="mt-1 text-[11px] font-medium text-slate-500">
                          Total {roleRow.total} | Verified {roleRow.verified} | Completed {roleRow.completed} | Pending {roleRow.pending}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px]">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Point</th>
                          <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Phase</th>
                          <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Task</th>
                          <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Lead Role</th>
                          <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Assigned User</th>
                          <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sopTaskRows.map((task) => (
                          <tr key={task.id} className="border-t border-slate-100 align-top">
                            <td className="px-4 py-3 text-xs font-black text-slate-700">{task.serial}</td>
                            <td className="px-4 py-3 text-xs font-bold text-slate-500 whitespace-nowrap">
                              Phase {task.phaseId}
                              <div className="text-[10px] font-medium text-slate-400 mt-1">
                                {task.phaseName}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-slate-800 leading-relaxed">{task.title}</td>
                            <td className="px-4 py-3">
                              <Badge
                                className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 ${
                                  task.leadRole === "CLIENT"
                                    ? "bg-blue-50 text-blue-700 border border-blue-100"
                                    : task.leadRole === "FREELANCER"
                                      ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                                      : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                }`}
                              >
                                {task.leadRole.replace("_", " ")}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm font-bold text-slate-900">{task.leadName}</td>
                            <td className="px-4 py-3">
                              <Badge
                                className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 ${
                                  task.status === "VERIFIED"
                                    ? "bg-emerald-500 text-white"
                                    : task.status === "COMPLETED"
                                      ? "bg-blue-600 text-white"
                                      : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {task.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <div className="rounded-[40px] border-2 border-dashed border-blue-100 bg-blue-50/30 p-10 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-100 transition-opacity">
                    <CheckCircle className="h-48 w-48 text-blue-600" />
                 </div>
                 <div className="flex flex-col lg:flex-row items-center gap-10">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[30px] bg-white text-blue-600 shadow-xl shadow-blue-600/5">
                       <Download className="h-8 w-8" />
                    </div>
                    <div className="flex-1 text-center lg:text-left">
                       <h3 className="mb-2 text-xl font-bold text-slate-900">Handover Documentation</h3>
                       <p className="mb-8 text-sm font-medium text-slate-500 leading-relaxed max-w-xl">
                          Ensure all deliverables, source files, and credentials have been securely verified by you before initiating Final Release.
                       </p>
                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                          <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl bg-white/60 hover:bg-white transition-colors border border-slate-100">
                             <Checkbox 
                                checked={checklist.sourceCodeTransferred} 
                                onCheckedChange={(v) => setChecklist(p => ({...p, sourceCodeTransferred: !!v}))}
                                className="h-5 w-5 rounded-lg border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 shadow-sm" 
                             />
                             <span className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">Sources</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl bg-white/60 hover:bg-white transition-colors border border-slate-100">
                             <Checkbox 
                                checked={checklist.documentationFinalized} 
                                onCheckedChange={(v) => setChecklist(p => ({...p, documentationFinalized: !!v}))}
                                className="h-5 w-5 rounded-lg border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 shadow-sm" 
                             />
                             <span className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">Docs</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl bg-white/60 hover:bg-white transition-colors border border-slate-100">
                             <Checkbox 
                                checked={checklist.credentialsShared} 
                                onCheckedChange={(v) => setChecklist(p => ({...p, credentialsShared: !!v}))}
                                className="h-5 w-5 rounded-lg border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 shadow-sm" 
                             />
                             <span className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">Access</span>
                          </label>
                       </div>
                       <Button 
                           onClick={handleFinalizeHandover}
                           disabled={!checklist.sourceCodeTransferred || !checklist.documentationFinalized || !checklist.credentialsShared}
                           className="h-14 rounded-2xl bg-blue-600 px-10 text-xs font-black tracking-widest uppercase text-white shadow-xl shadow-blue-600/30 hover:bg-blue-700 disabled:opacity-30 disabled:grayscale transition-all hover:scale-105 active:scale-95"
                       >
                          Finalize Project Closure
                       </Button>
                    </div>
                 </div>
              </div>
            </div>

            <div className="space-y-6">
               <Card className="rounded-3xl border-slate-100 shadow-sm bg-white">
                  <CardContent className="p-5">
                     <div className="mb-4 flex items-center justify-between">
                        <div>
                           <h4 className="text-sm font-bold text-slate-900">Meeting Scheduler</h4>
                           <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">PM + Client/Freelancer/Both</p>
                        </div>
                        <Button
                          variant="outline"
                          className="h-8 rounded-lg border-blue-100 bg-blue-50 px-3 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-100"
                          onClick={() => setMeetingDialogOpen(true)}
                        >
                          Schedule
                        </Button>
                     </div>
                     <div className="space-y-2">
                        {meetings.loading ? (
                          <p className="text-xs font-medium text-slate-400">Loading meetings...</p>
                        ) : projectMeetings.length > 0 ? (
                          projectMeetings.map((meeting) => (
                            <div key={meeting.id} className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
                              <p className="text-xs font-bold text-slate-900">{meeting.title}</p>
                              <p className="text-[11px] font-medium text-slate-500">
                                {new Date(meeting.startsAt).toLocaleString()} - {new Date(meeting.endsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </p>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Scope: {meeting.participantScope || "BOTH"}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs font-medium text-slate-400">No meetings scheduled for this project yet.</p>
                        )}
                     </div>
                  </CardContent>
               </Card>

               <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden flex flex-col h-[750px] bg-white">
                  <div className="flex items-center justify-between border-b border-slate-100 p-4">
                     <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                           <Avatar className="h-8 w-8 border-2 border-white">
                              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${project.title}`} />
                           </Avatar>
                        </div>
                        <div>
                           <h4 className="text-sm font-bold text-slate-900">Assigned Workspace</h4>
                           <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">• ACTIVE SYNC</p>
                        </div>
                     </div>
                     <Settings className="h-4 w-4 text-slate-400" />
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar bg-slate-50/10">
                     {messages.loading ? (
                         <div className="flex h-full items-center justify-center text-xs font-bold text-slate-300">Syncing messages...</div>
                     ) : conversationRows.length > 0 ? (
                         conversationRows.map((msg) => (
                           <div key={msg.id} className={`flex flex-col ${msg.senderRole === 'PROJECT_MANAGER' ? 'items-end' : 'items-start'}`}>
                              <p className="mb-1 text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                 {msg.senderLabel} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <div className={`max-w-[90%] rounded-2xl p-4 text-sm font-medium ${msg.senderRole === 'PROJECT_MANAGER' ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-500/10' : 'bg-white border border-slate-100 text-slate-900 rounded-tl-none shadow-sm'}`}>
                                 {msg.content}
                              </div>
                           </div>
                         ))
                     ) : (
                         <div className="flex h-full flex-col items-center justify-center text-center p-8 space-y-4">
                             <MessageCircle className="h-12 w-12 text-slate-100" />
                             <p className="text-sm font-bold text-slate-400">No messages yet. Start the conversation with the client and freelancer.</p>
                         </div>
                     )}
                  </div>
                  
                  <div className="p-4 border-t border-slate-100 bg-white">
                     <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative">
                        <Input 
                           value={composer}
                           onChange={(e) => setComposer(e.target.value)}
                           className="h-14 w-full rounded-2xl border-none bg-slate-50 px-6 pr-14 text-sm font-medium placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-600/20" 
                           placeholder="Drop an update or ask a question..."
                           disabled={sending}
                        />
                        <button 
                            type="submit"
                            disabled={sending || !composer.trim()}
                            className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 disabled:opacity-50 transition-all"
                        >
                            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </button>
                     </form>
                  </div>
               </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="messages" className="mt-0 focus-visible:outline-none">
          <Card className="rounded-[40px] border-slate-100 shadow-sm bg-white overflow-hidden flex flex-col h-[700px]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Project Conversation</h3>
                <p className="text-xs font-medium text-slate-400">
                  Trio group chat: Project Manager + Client + Freelancer.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge className="bg-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-700">PM: {user?.fullName || "Project Manager"}</Badge>
                  <Badge className="bg-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-700">Client: {clientProfile.clientName || "Client"}</Badge>
                  <Badge className="bg-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-700">Freelancer: {freelancerProfile?.freelancerName || "Unassigned"}</Badge>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate(`/project-manager/messages?projectId=${projectId}`)}
                className="h-10 rounded-xl border-slate-200 bg-white px-4 text-[10px] font-black tracking-widest uppercase text-slate-600"
              >
                Full Screen
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/20">
              {messages.loading ? (
                <div className="flex h-full items-center justify-center text-xs font-bold text-slate-300">
                  Syncing messages...
                </div>
              ) : conversationRows.length > 0 ? (
                conversationRows.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.senderRole === "PROJECT_MANAGER" ? "items-end" : "items-start"
                    }`}
                  >
                    <p className="mb-1 text-[10px] font-bold text-slate-400">
                      {msg.senderLabel} •{" "}
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-sm font-medium ${
                        msg.senderRole === "PROJECT_MANAGER"
                          ? "bg-blue-600 text-white rounded-tr-none"
                          : "bg-white border border-slate-100 text-slate-900 rounded-tl-none"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center p-8 space-y-3">
                  <MessageCircle className="h-10 w-10 text-slate-200" />
                  <p className="text-sm font-bold text-slate-400">
                    No messages yet. Aap pehla message bhej sakte ho.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 p-4 bg-white">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="relative"
              >
                <Input
                  value={composer}
                  onChange={(e) => setComposer(e.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-sm font-medium placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-600/20"
                  placeholder="Type message as Project Manager..."
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !composer.trim()}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </form>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="milestones" className="mt-0 focus-visible:outline-none">
           <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <Card className="rounded-3xl border-slate-100 p-8 shadow-sm bg-white">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">UNLOCKED FUNDS</p>
                    <p className="text-2xl font-black text-emerald-600">INR {milestoneRows.filter(m => m.status === 'Approved' || m.status === 'Completed').reduce((acc, m) => acc + (m.amount || 0), 0).toLocaleString("en-IN")}</p>
                 </Card>
                 <Card className="rounded-3xl border-slate-100 p-8 shadow-sm bg-white">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ESCROW HOLD</p>
                    <p className="text-2xl font-black text-blue-600">INR {milestoneRows.filter(m => m.status === 'Locked' || m.status === 'Pending Approval').reduce((acc, m) => acc + (m.amount || 0), 0).toLocaleString("en-IN")}</p>
                 </Card>
                 <Card className="rounded-3xl border-slate-100 p-8 shadow-sm bg-white">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">TOTAL BUDGET</p>
                    <p className="text-2xl font-black text-slate-900">INR {Number(project.budget || 0).toLocaleString("en-IN")}</p>
                 </Card>
              </div>

              <Card className="rounded-[40px] border-slate-100 shadow-sm bg-white overflow-hidden">
                 <div className="p-10">
                    <h3 className="text-xl font-bold text-slate-900 mb-8">Detailed Milestone Audit</h3>
                    <div className="space-y-12">
                       {milestoneRows.map((milestone, idx) => {
                          const phaseTasks = sopTaskRows
                            .filter((task) => String(task.phaseId) === String(milestone.phase))
                            .filter((task) => task.status === "VERIFIED" || task.status === "COMPLETED")
                            .slice(0, 4);

                          return (
                          <div key={idx} className="flex gap-10">
                             <div className="flex flex-col items-center">
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black ${milestone.status === 'Approved' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                                   {idx + 1}
                                </div>
                                {idx < milestoneRows.length - 1 && <div className="flex-1 w-0.5 bg-slate-100 my-4" />}
                             </div>
                             <div className="flex-1 pb-10 border-b border-slate-50 last:border-0 last:pb-0">
                                <div className="flex justify-between items-start mb-4">
                                   <div>
                                      <h4 className="text-lg font-black text-slate-900">{milestone.title}</h4>
                                      <Badge variant="outline" className={`mt-2 font-black text-[9px] uppercase ${milestone.status === 'Approved' ? 'border-emerald-200 text-emerald-600 bg-emerald-50' : 'border-slate-200 text-slate-400'}`}>{milestone.status}</Badge>
                                   </div>
                                   <div className="text-right">
                                      <p className="text-xl font-black text-slate-900">INR {milestone.amount?.toLocaleString("en-IN")}</p>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payout Volume</p>
                                   </div>
                                </div>
                                <div className="grid grid-cols-2 gap-8 mt-6 p-6 rounded-2xl bg-slate-50 border border-slate-100">
                                   <div>
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Deliverables Verified</p>
                                      {phaseTasks.length > 0 ? (
                                        <ul className="space-y-2">
                                          {phaseTasks.map((task) => (
                                            <li key={task.id} className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                              <CheckCircle className="h-3 w-3 text-emerald-500" />
                                              {task.title}
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="text-xs font-medium text-slate-500">
                                          No verified deliverables in this phase yet.
                                        </p>
                                      )}
                                   </div>
                                   <div>
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">PM Notes</p>
                                      <p className="text-xs font-medium text-slate-500 italic leading-relaxed">{milestone.validationNotes || "No specific auditor notes for this phase."}</p>
                                   </div>
                                </div>
                             </div>
                          </div>
                          );
                       })}
                    </div>
                 </div>
              </Card>
           </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-0 focus-visible:outline-none">
            <Card className="rounded-[2.5rem] border-slate-100 shadow-xl overflow-hidden">
                <CardContent className="p-10">
                  {notifications.loading ? (
                    <p className="py-20 text-center font-bold text-slate-400">
                      Loading project notifications...
                    </p>
                  ) : projectNotifications.length > 0 ? (
                    <div className="space-y-4">
                      {projectNotifications.map((alert) => (
                        <div
                          key={alert.id}
                          className="flex items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-5"
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${
                                alert.read ? "bg-slate-300" : "bg-blue-600"
                              }`}
                            />
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                                  {alert.type || "General"}
                                </span>
                                {!alert.read ? (
                                  <Badge className="bg-blue-600 text-[9px] font-black uppercase tracking-wider text-white">
                                    New
                                  </Badge>
                                ) : null}
                              </div>
                              <p className="text-sm font-bold text-slate-900">{alert.title}</p>
                              <p className="text-xs font-medium text-slate-500">{alert.message}</p>
                            </div>
                          </div>
                          <span className="whitespace-nowrap text-[10px] font-bold text-slate-400">
                            {new Date(alert.createdAt).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-20 text-center font-bold text-slate-400">
                      No notifications for this project yet.
                    </p>
                  )}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={meetingDialogOpen} onOpenChange={setMeetingDialogOpen}>
        <DialogContent className="max-w-xl rounded-3xl border-slate-100 p-0">
          <DialogHeader className="border-b border-slate-100 p-6 pb-4">
            <DialogTitle className="text-lg font-black text-slate-900">
              Schedule Project Meeting
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Project manager automatically included. Choose client, freelancer, or both.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 p-6">
            <div>
              <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Meeting Title</p>
              <Input
                value={meetingForm.title}
                onChange={(e) => setMeetingForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Project Sync"
                className="h-11 rounded-xl border-slate-200"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Participants</p>
                <select
                  value={meetingForm.participantScope}
                  onChange={(e) => setMeetingForm((prev) => ({ ...prev, participantScope: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700"
                >
                  <option value="CLIENT">Project Manager + Client</option>
                  <option value="FREELANCER">Project Manager + Freelancer</option>
                  <option value="BOTH">Project Manager + Client + Freelancer</option>
                </select>
              </div>
              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Platform</p>
                <select
                  value={meetingForm.platform}
                  onChange={(e) => setMeetingForm((prev) => ({ ...prev, platform: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700"
                >
                  <option value="INTERNAL">Internal</option>
                  <option value="GOOGLE_MEET">Google Meet</option>
                  <option value="ZOOM">Zoom</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Starts At</p>
                <Input
                  type="datetime-local"
                  value={meetingForm.startsAt}
                  onChange={(e) => setMeetingForm((prev) => ({ ...prev, startsAt: e.target.value }))}
                  className="h-11 rounded-xl border-slate-200"
                />
              </div>
              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Ends At</p>
                <Input
                  type="datetime-local"
                  value={meetingForm.endsAt}
                  onChange={(e) => setMeetingForm((prev) => ({ ...prev, endsAt: e.target.value }))}
                  className="h-11 rounded-xl border-slate-200"
                />
              </div>
            </div>

            <div>
              <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Notes</p>
              <textarea
                value={meetingForm.notes}
                onChange={(e) => setMeetingForm((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
                placeholder="Agenda or instructions..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 focus:border-blue-300 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl border-slate-200 bg-white px-4 text-xs font-bold text-slate-600"
                onClick={() => setMeetingDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="h-10 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700"
                disabled={meetingSubmitting}
                onClick={handleScheduleMeeting}
              >
                {meetingSubmitting ? "Scheduling..." : "Schedule Meeting"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={clientProfileOpen} onOpenChange={setClientProfileOpen}>
        <DialogContent className="max-w-xl rounded-3xl border-slate-100 p-0">
          <DialogHeader className="border-b border-slate-100 p-6 pb-4">
            <DialogTitle className="text-lg font-black text-slate-900">
              Client Profile
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Project manager view for this client and project summary.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 p-6">
            <div className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Client Name
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  {clientProfile.clientName || "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Email
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  {clientProfile.email || "Not available"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Company
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  {clientProfile.company || "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Budget
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  INR {Number(project.budget || 0).toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Requirements
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {clientProfile.requirements || project.description || "No requirements shared yet."}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="mt-16 flex items-center justify-between border-t border-slate-100 pt-8 pb-8">
         <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-blue-600 rounded flex items-center justify-center">
               <span className="text-white text-[10px] font-bold">🚀</span>
            </div>
            <span className="text-xs text-slate-400">© 2024 Catalance Platform. All rights reserved.</span>
         </div>
      </div>
    </PmShell>
  );
};

export default ProjectDetailsPage;
