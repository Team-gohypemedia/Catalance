import { useEffect, useMemo, useRef, useState } from "react";
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
import { Accordion } from "@/components/ui/accordion";
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
import FreelancerProfileDialog from "@/components/features/client/dashboard/FreelancerProfileDialog";
import { getSopFromTitle } from "@/shared/data/sopTemplates";
import { PhaseAccordionItem } from "@/modules/project-manager/components/PhaseAccordionItem";

const getTaskLeadRole = (phaseId) => {
  const normalizedPhase = String(phaseId || "");
  if (normalizedPhase === "1") return "CLIENT";
  if (normalizedPhase === "4") return "PROJECT_MANAGER";
  return "FREELANCER";
};

const TASK_ROLE_FILTERS = [
  { value: "ALL", label: "All" },
  { value: "CLIENT", label: "Client" },
  { value: "FREELANCER", label: "Freelancer" },
  { value: "PROJECT_MANAGER", label: "Project Manager" },
];

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
  const [freelancerProfileOpen, setFreelancerProfileOpen] = useState(false);
  const [projectSummaryOpen, setProjectSummaryOpen] = useState(false);
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
  const [meetingSubmitting, setMeetingSubmitting] = useState(false);
  const [meetingForm, setMeetingForm] = useState(() => buildMeetingFormDefaults());
  const [activePhaseValue, setActivePhaseValue] = useState("");
  const [activeTaskRoleFilter, setActiveTaskRoleFilter] = useState("ALL");
  const [showAllTaskRows, setShowAllTaskRows] = useState(false);
  const milestoneAccordionRef = useRef(null);
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

  const handleViewFreelancerProfile = () => {
    if (!viewingFreelancerProfile) {
      toast.info("Freelancer profile is not available yet.");
      return;
    }
    setFreelancerProfileOpen(true);
  };

  const handleViewClientProfile = () => {
    const hasClientData = Boolean(
      clientProfile?.clientName || clientProfile?.id || clientProfile?.email
    );
    if (!hasClientData) {
      toast.info("Client profile is not available yet.");
      return;
    }
    setClientProfileOpen(true);
  };

  const handleViewProject = () => {
    setProjectSummaryOpen(true);
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
  const viewingFreelancerProfile = useMemo(() => {
    if (!freelancerProfile) return null;

    const skills = Array.isArray(freelancerProfile.skills)
      ? freelancerProfile.skills
      : [];
    const portfolioProjects = Array.isArray(freelancerProfile.portfolioProjects)
      ? freelancerProfile.portfolioProjects
      : [];
    const displayName = freelancerProfile.freelancerName || "Freelancer";

    return {
      id: freelancerProfile.id || "",
      fullName: displayName,
      name: displayName,
      avatar: freelancerProfile.avatar || "",
      rating: Number(freelancerProfile.rating || 0),
      reviewCount: Number(freelancerProfile.reviewsCount || 0),
      reviewsCount: Number(freelancerProfile.reviewsCount || 0),
      skills,
      portfolio: freelancerProfile.portfolio || "",
      freelancerProjects: portfolioProjects,
      profileDetails: {
        role: "Freelancer",
        fullName: displayName,
        skills,
        experienceYears: Number(freelancerProfile.experienceYears || 0),
        portfolio: freelancerProfile.portfolio || "",
        portfolioProjects,
      },
    };
  }, [freelancerProfile]);
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

  const totalTaskSummary = useMemo(() => {
    const verified = sopTaskRows.filter((task) => task.status === "VERIFIED").length;
    const completed = sopTaskRows.filter((task) => task.status === "COMPLETED").length;
    const pending = sopTaskRows.filter((task) => task.status === "PENDING").length;

    return {
      role: "ALL",
      assignee: "All Roles",
      total: sopTaskRows.length,
      verified,
      completed,
      pending,
    };
  }, [sopTaskRows]);

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

  useEffect(() => {
    if (phaseInsightRows.length === 0) {
      setActivePhaseValue("");
      return;
    }

    setActivePhaseValue((currentValue) => {
      if (
        currentValue &&
        phaseInsightRows.some((row) => `phase-${row.phase}` === currentValue)
      ) {
        return currentValue;
      }
      return `phase-${phaseInsightRows[0].phase}`;
    });
  }, [phaseInsightRows]);

  useEffect(() => {
    if (!activePhaseValue) return;

    const handleOutsideClick = (event) => {
      const wrapper = milestoneAccordionRef.current;
      if (wrapper && !wrapper.contains(event.target)) {
        setActivePhaseValue("");
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [activePhaseValue]);

  const completedPhases = useMemo(
    () =>
      phaseInsightRows.filter(
        (milestone) =>
          milestone.status === "Approved" || milestone.status === "Completed"
      ).length,
    [phaseInsightRows]
  );

  const filteredSopTaskRows = useMemo(() => {
    if (activeTaskRoleFilter === "ALL") return sopTaskRows;
    return sopTaskRows.filter((task) => task.leadRole === activeTaskRoleFilter);
  }, [activeTaskRoleFilter, sopTaskRows]);

  const visibleSopTaskRows = useMemo(
    () => (showAllTaskRows ? filteredSopTaskRows : filteredSopTaskRows.slice(0, 4)),
    [filteredSopTaskRows, showAllTaskRows]
  );

  useEffect(() => {
    setShowAllTaskRows(false);
  }, [activeTaskRoleFilter, projectId, sopTaskRows.length]);

  useEffect(() => {
    setActiveTaskRoleFilter("ALL");
  }, [projectId]);

  if (details.loading) {
    return <PmShell title="Loading..." subtitle="Fetching project details from vault..."><div className="p-20 text-center font-bold text-slate-600">Syncing project data...</div></PmShell>;
  }

  if (!details.data && !details.loading) {
      return <PmShell title="Project Not Found" subtitle="Error 404"><div className="p-20 text-center"><Button onClick={() => navigate("/project-manager/projects")}>Back to Projects</Button></div></PmShell>;
  }

  return (
    <PmShell 
      title={project.title}
      className="overflow-x-clip bg-gradient-to-b from-slate-50 via-white to-blue-50/30"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-10 rounded-xl !border-blue-300 !bg-blue-100 px-5 text-xs font-bold !text-blue-700 shadow-sm hover:!bg-blue-200"
            onClick={() => setMeetingDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Schedule Meeting
          </Button>
          <Button
            variant="outline"
            className="h-10 rounded-xl !border-rose-300 !bg-rose-100 px-5 text-xs font-bold !text-rose-700 shadow-sm hover:!bg-rose-200"
            onClick={() => toast.info("Escalation module opening...")}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Escalate to Admin
          </Button>
        </div>
      }
    >
      <div className="mb-6 flex items-center gap-2 text-xs font-medium text-slate-600">
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
        <span className="text-xs font-medium text-slate-600">Project ID: #{project.id}</span>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6 h-auto w-full justify-start gap-2 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          <TabsTrigger value="overview" className="rounded-xl border border-transparent px-4 py-2 font-semibold text-slate-700 data-[state=active]:!border-blue-200 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white">Overview</TabsTrigger>
          <TabsTrigger value="messages" className="rounded-xl border border-transparent px-4 py-2 font-semibold text-slate-700 data-[state=active]:!border-blue-200 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white">Messages</TabsTrigger>
          <TabsTrigger value="milestones" className="rounded-xl border border-transparent px-4 py-2 font-semibold text-slate-700 data-[state=active]:!border-blue-200 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white">Milestones</TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-xl border border-transparent px-4 py-2 font-semibold text-slate-700 data-[state=active]:!border-blue-200 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0 overflow-x-clip">
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="rounded-3xl border-slate-200 shadow-sm bg-white overflow-hidden group transition-all hover:shadow-lg hover:shadow-blue-100/70">
                  <CardContent className="p-6">
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
                          <p className="text-xs font-bold text-slate-600 uppercase tracking-tighter">{clientProfile.company || "Direct Client"}</p>
                       </div>
                    </div>
                    <div className="space-y-5">
                       <div>
                          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">Project Scope</p>
                          <p className="text-xs font-medium text-slate-600 leading-relaxed line-clamp-3">{project.description}</p>
                       </div>
                       <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Budget Allocation</p>
                          <p className="text-xl font-black text-slate-900">INR {Number(project.budget || 0).toLocaleString("en-IN")}</p>
                       </div>
                       <div className="grid gap-2 sm:grid-cols-2">
                          <Button
                             variant="outline"
                             className="h-11 rounded-xl !border-blue-200 !bg-blue-50 text-[10px] font-black tracking-widest !text-blue-700 hover:!bg-blue-100 uppercase shadow-sm"
                             onClick={handleViewProject}
                          >
                             VIEW PROJECT
                          </Button>
                          <Button
                             variant="outline"
                             className="h-11 rounded-xl !border-blue-200 !bg-blue-50 text-[10px] font-black tracking-widest !text-blue-700 hover:!bg-blue-100 uppercase shadow-sm"
                             onClick={handleViewClientProfile}
                          >
                             VIEW CLIENT PROFILE
                          </Button>
                       </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl border-slate-200 shadow-sm bg-white overflow-hidden group transition-all hover:shadow-lg hover:shadow-indigo-100/70">
                  <CardContent className="p-6">
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
                                     <span className="text-yellow-500 text-xs">*</span>
                                     <span className="text-xs font-bold text-slate-900">{freelancerProfile.rating}</span>
                                     <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter ml-1">({freelancerProfile.reviewsCount} reviews)</span>
                                  </div>
                               </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mb-6">
                               {freelancerProfile.skills.slice(0, 4).map(skill => (
                                 <Badge key={skill} variant="secondary" className="bg-white border border-slate-100 text-slate-600 text-[9px] font-bold rounded-lg px-2 py-0.5 shadow-sm">{skill.toUpperCase()}</Badge>
                               ))}
                               {freelancerProfile.skills.length > 4 && <span className="text-[9px] font-bold text-slate-600">+{freelancerProfile.skills.length - 4}</span>}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1 h-11 rounded-xl !border-indigo-200 !bg-indigo-50 text-[10px] font-black tracking-widest !text-indigo-700 hover:!bg-indigo-100 transition-all uppercase shadow-sm" onClick={handleViewFreelancerProfile}>
                                    VIEW FULL PROFILE
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="flex-1 h-11 rounded-xl !border-rose-200 !bg-rose-50 text-[10px] font-black tracking-widest !text-rose-700 hover:!bg-rose-100 transition-all uppercase shadow-sm"
                                    onClick={() => navigate(`/project-manager/marketplace?projectId=${projectId}&reassign=true`)}
                                >
                                    REASSIGN FREELANCER
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 space-y-3 border-2 border-dashed border-slate-100 rounded-[24px] bg-slate-50/30">
                            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100">
                               <Plus className="h-5 w-5 text-slate-600" />
                            </div>
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">NO TALENT ASSIGNED</p>
                            <Button variant="default" className="h-9 rounded-lg bg-blue-600 text-[10px] font-black tracking-widest uppercase px-4" onClick={() => navigate("/project-manager/marketplace")}>Browse Marketplace</Button>
                        </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="rounded-3xl border-slate-200 shadow-sm bg-white overflow-hidden">
                <CardContent className="space-y-5 p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50">
                        <CreditCard className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">
                          Milestone Payout Tracker
                        </h3>
                        <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-600">
                          Secure Escrow Distribution
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-700"
                    >
                      {completedPhases} Completed
                    </Badge>
                  </div>

                  <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-emerald-50/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Phases Overview</p>
                        <p className="text-xs text-slate-700">
                          Expand each phase to review blockers, verification, and payout readiness.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant="outline"
                          className="rounded-full border-slate-300 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-700"
                        >
                          {phaseInsightRows.length} Total Phases
                        </Badge>
                        <Badge
                          variant="outline"
                          className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-700"
                        >
                          {completedPhases} Completed
                        </Badge>
                        <Badge
                          variant="outline"
                          className="rounded-full border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-700"
                        >
                          {Math.max(phaseInsightRows.length - completedPhases, 0)} Pending
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {phaseInsightRows.length > 0 ? (
                    <div ref={milestoneAccordionRef}>
                      <Accordion
                        type="single"
                        collapsible
                        value={activePhaseValue}
                        onValueChange={(nextValue) =>
                          setActivePhaseValue((currentValue) =>
                            currentValue === nextValue ? "" : nextValue
                          )
                        }
                        className="space-y-3"
                      >
                        {phaseInsightRows.map((milestone) => (
                          <PhaseAccordionItem
                            key={`phase-${milestone.phase}`}
                            value={`phase-${milestone.phase}`}
                            milestone={milestone}
                            onApproveMilestone={handleApproveMilestone}
                          />
                        ))}
                      </Accordion>
                    </div>
                  ) : (
                    <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-700">
                      No milestone phases available for this project yet.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-slate-200 shadow-sm bg-white overflow-hidden">
                <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-blue-50/70 to-white p-6 pb-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle className="text-base font-bold text-slate-900">
                      All Phase Task Matrix
                    </CardTitle>
                    <Badge className="bg-slate-100 text-slate-700 text-[10px] font-semibold uppercase tracking-[0.08em] px-3 py-1">
                      {visibleSopTaskRows.length} / {filteredSopTaskRows.length} Points
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    Start with 4 points. Use role cards to filter tasks and tap view more for complete list.
                  </p>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/40 p-5 sm:grid-cols-2 xl:grid-cols-4">
                    {[totalTaskSummary, ...roleProgressRows].map((roleRow) => {
                      const roleKey = roleRow.role;
                      const isActive = activeTaskRoleFilter === roleKey;
                      const roleLabel =
                        roleKey === "ALL"
                          ? "All Tasks"
                          : TASK_ROLE_FILTERS.find((filter) => filter.value === roleKey)?.label ||
                            roleKey.replace("_", " ");

                      return (
                      <button
                        type="button"
                        key={roleKey}
                        onClick={() => setActiveTaskRoleFilter(roleKey)}
                        className={`rounded-2xl border bg-white p-4 text-left transition-colors ${
                          isActive
                            ? "border-blue-200 bg-blue-50/60 shadow-sm"
                            : "border-slate-200/80 hover:bg-blue-50/40"
                        }`}
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-700">
                          {roleLabel}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{roleRow.assignee}</p>
                        <p className="mt-1 text-xs font-medium leading-relaxed text-slate-700">
                          Total {roleRow.total} | Verified {roleRow.verified} | Completed {roleRow.completed} | Pending {roleRow.pending}
                        </p>
                      </button>
                    );
                    })}
                  </div>

                  <div className="border-b border-slate-100 bg-white px-4 py-3 md:hidden">
                    <p className="text-xs font-medium text-slate-700">
                      Showing:{" "}
                      <span className="font-semibold text-slate-800">
                        {activeTaskRoleFilter === "ALL"
                          ? "All roles"
                          : activeTaskRoleFilter.replace("_", " ")}
                      </span>
                    </p>
                  </div>

                  <div className="space-y-2 p-4 md:hidden">
                    {visibleSopTaskRows.map((task) => (
                      <article key={task.id} className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <p className="text-xs font-semibold text-slate-700">Point {task.serial}</p>
                          <Badge
                            className={`text-[10px] font-semibold uppercase tracking-[0.06em] px-2 py-0.5 ${
                              task.status === "VERIFIED"
                                ? "bg-emerald-500 text-white"
                                : task.status === "COMPLETED"
                                  ? "bg-blue-600 text-white"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {task.status}
                          </Badge>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                        <p className="mt-1 text-xs text-slate-700">
                          Phase {task.phaseId} | {task.phaseName}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge
                            className={`text-[10px] font-semibold uppercase tracking-[0.06em] px-2 py-0.5 ${
                              task.leadRole === "CLIENT"
                                ? "bg-blue-50 text-blue-700 border border-blue-100"
                                : task.leadRole === "FREELANCER"
                                  ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            }`}
                          >
                            {task.leadRole.replace("_", " ")}
                          </Badge>
                          <span className="text-xs font-medium text-slate-600">{task.leadName}</span>
                        </div>
                      </article>
                    ))}
                    {visibleSopTaskRows.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm font-medium text-slate-700">
                        No tasks found for this role.
                      </p>
                    ) : null}
                  </div>

                  <div className="hidden overflow-hidden md:block">
                    <table className="w-full table-fixed">
                      <colgroup>
                        <col className="w-16" />
                        <col className="w-[170px]" />
                        <col />
                        <col className="w-[130px]" />
                        <col className="w-[170px]" />
                        <col className="w-[110px]" />
                      </colgroup>
                      <thead className="bg-slate-100/80">
                        <tr>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-700">Point</th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-700">Phase</th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-700">Task</th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-700">Lead Role</th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-700">Assigned User</th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-700">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {visibleSopTaskRows.map((task) => (
                          <tr key={task.id} className="border-t border-slate-100 align-top transition-colors hover:bg-blue-50/30">
                            <td className="px-4 py-3 text-sm font-semibold text-slate-800">{task.serial}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                              Phase {task.phaseId}
                              <div className="mt-1 text-xs font-medium text-slate-700">
                                {task.phaseName}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium leading-relaxed text-slate-900 break-words">
                              {task.title}
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                className={`text-[10px] font-semibold uppercase tracking-[0.06em] px-2 py-0.5 ${
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
                            <td className="px-4 py-3 text-sm font-semibold text-slate-800 break-words">{task.leadName}</td>
                            <td className="px-4 py-3">
                              <Badge
                                className={`text-[10px] font-semibold uppercase tracking-[0.06em] px-2 py-0.5 ${
                                  task.status === "VERIFIED"
                                    ? "bg-emerald-500 text-white"
                                    : task.status === "COMPLETED"
                                      ? "bg-blue-600 text-white"
                                      : "bg-amber-50 text-amber-700 border border-amber-200"
                                }`}
                              >
                                {task.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                        {visibleSopTaskRows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-4 py-10 text-center text-sm font-medium text-slate-700"
                            >
                              No tasks found for this role.
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                  {filteredSopTaskRows.length > 4 ? (
                    <div className="flex justify-end border-t border-slate-100 bg-white px-4 py-3">
                      <Button
                        variant="outline"
                        className="h-9 rounded-lg !border-blue-200 !bg-blue-50 px-3 text-[11px] font-semibold !text-blue-700 shadow-sm hover:!bg-blue-100"
                        onClick={() => setShowAllTaskRows((current) => !current)}
                      >
                        {showAllTaskRows
                          ? "Show fewer points"
                          : `View more (${filteredSopTaskRows.length} points)`}
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <div className="group relative overflow-hidden rounded-3xl border border-blue-200/70 bg-gradient-to-r from-blue-50 via-white to-indigo-50/70 p-8 shadow-sm">
                 <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-100 transition-opacity">
                    <CheckCircle className="h-48 w-48 text-blue-600" />
                 </div>
                 <div className="flex flex-col lg:flex-row items-center gap-10">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[30px] bg-white text-blue-600 shadow-xl shadow-blue-600/5">
                       <Download className="h-8 w-8" />
                    </div>
                    <div className="flex-1 text-center lg:text-left">
                       <h3 className="mb-2 text-xl font-bold text-slate-900">Handover Documentation</h3>
                       <p className="mb-8 text-sm font-medium text-slate-700 leading-relaxed max-w-xl">
                          Ensure all deliverables, source files, and credentials have been securely verified by you before initiating Final Release.
                       </p>
                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                          <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl bg-white hover:bg-blue-50/60 transition-colors border border-blue-100 shadow-sm">
                             <Checkbox 
                                checked={checklist.sourceCodeTransferred} 
                                onCheckedChange={(v) => setChecklist(p => ({...p, sourceCodeTransferred: !!v}))}
                                className="h-5 w-5 rounded-md border-blue-300 bg-white data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 shadow-sm" 
                             />
                             <span className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">Sources</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl bg-white hover:bg-blue-50/60 transition-colors border border-blue-100 shadow-sm">
                             <Checkbox 
                                checked={checklist.documentationFinalized} 
                                onCheckedChange={(v) => setChecklist(p => ({...p, documentationFinalized: !!v}))}
                                className="h-5 w-5 rounded-md border-blue-300 bg-white data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 shadow-sm" 
                             />
                             <span className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">Docs</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl bg-white hover:bg-blue-50/60 transition-colors border border-blue-100 shadow-sm">
                             <Checkbox 
                                checked={checklist.credentialsShared} 
                                onCheckedChange={(v) => setChecklist(p => ({...p, credentialsShared: !!v}))}
                                className="h-5 w-5 rounded-md border-blue-300 bg-white data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 shadow-sm" 
                             />
                             <span className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">Access</span>
                          </label>
                       </div>
                       <Button 
                           onClick={handleFinalizeHandover}
                           disabled={!checklist.sourceCodeTransferred || !checklist.documentationFinalized || !checklist.credentialsShared}
                           className="h-14 rounded-2xl bg-blue-600 px-10 text-xs font-black tracking-widest uppercase text-white shadow-xl shadow-blue-600/30 hover:bg-blue-700 disabled:bg-blue-300 disabled:text-white/95 disabled:opacity-100 disabled:grayscale-0 transition-all hover:scale-105 active:scale-95"
                       >
                          Finalize Project Closure
                       </Button>
                    </div>
                 </div>
              </div>
            </div>

            <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
               <Card className="rounded-3xl border-slate-200/80 shadow-sm bg-white">
                  <CardContent className="p-5">
                     <div className="mb-4 flex items-center justify-between">
                        <div>
                           <h4 className="text-sm font-bold text-slate-900">Meeting Scheduler</h4>
                           <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">PM + Client/Freelancer/Both</p>
                        </div>
                        <Button
                          variant="outline"
                          className="h-8 rounded-lg !border-blue-300 !bg-blue-100 px-3 text-[10px] font-black uppercase tracking-widest !text-blue-700 hover:!bg-blue-200 shadow-sm"
                          onClick={() => setMeetingDialogOpen(true)}
                        >
                          Schedule
                        </Button>
                     </div>
                     <div className="space-y-2">
                        {meetings.loading ? (
                          <p className="text-xs font-medium text-slate-600">Loading meetings...</p>
                        ) : projectMeetings.length > 0 ? (
                          projectMeetings.map((meeting) => (
                            <div key={meeting.id} className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
                              <p className="text-xs font-bold text-slate-900">{meeting.title}</p>
                              <p className="text-[11px] font-medium text-slate-700">
                                {new Date(meeting.startsAt).toLocaleString()} - {new Date(meeting.endsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </p>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                Scope: {meeting.participantScope || "BOTH"}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs font-medium text-slate-600">No meetings scheduled for this project yet.</p>
                        )}
                     </div>
                  </CardContent>
               </Card>

               <Card className="flex h-[clamp(540px,68vh,700px)] flex-col overflow-hidden rounded-3xl border-slate-200/80 bg-white shadow-sm">
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
                     <Settings className="h-4 w-4 text-slate-600" />
                  </div>
                  
                  <div className="subtle-scrollbar flex-1 space-y-6 overflow-y-auto bg-slate-50/10 p-4">
                     {messages.loading ? (
                         <div className="flex h-full items-center justify-center text-xs font-bold text-slate-300">Syncing messages...</div>
                     ) : conversationRows.length > 0 ? (
                         conversationRows.map((msg) => (
                           <div key={msg.id} className={`flex flex-col ${msg.senderRole === 'PROJECT_MANAGER' ? 'items-end' : 'items-start'}`}>
                              <p className="mb-1 text-[9px] font-black text-slate-600 uppercase tracking-tighter">
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
                             <p className="text-sm font-bold text-slate-600">No messages yet. Start the conversation with the client and freelancer.</p>
                         </div>
                     )}
                  </div>
                  
                  <div className="p-4 border-t border-slate-100 bg-white">
                     <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative">
                        <Input 
                           value={composer}
                           onChange={(e) => setComposer(e.target.value)}
                           className="h-14 w-full rounded-2xl border !border-blue-200 !bg-white px-6 pr-14 text-sm font-medium !text-slate-800 placeholder:text-slate-600 shadow-sm focus-visible:ring-2 focus-visible:ring-blue-600/20" 
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
          <Card className="flex h-[clamp(560px,72vh,760px)] flex-col overflow-hidden rounded-3xl border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Project Conversation</h3>
                <p className="text-xs font-medium text-slate-600">
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

            <div className="subtle-scrollbar flex-1 space-y-4 overflow-y-auto bg-slate-50/20 p-5">
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
                    <p className="mb-1 text-[10px] font-bold text-slate-600">
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
                  <p className="text-sm font-bold text-slate-600">
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
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-sm font-medium placeholder:text-slate-600 focus-visible:ring-2 focus-visible:ring-blue-600/20"
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
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">UNLOCKED FUNDS</p>
                    <p className="text-2xl font-black text-emerald-600">INR {milestoneRows.filter(m => m.status === 'Approved' || m.status === 'Completed').reduce((acc, m) => acc + (m.amount || 0), 0).toLocaleString("en-IN")}</p>
                 </Card>
                 <Card className="rounded-3xl border-slate-100 p-8 shadow-sm bg-white">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">ESCROW HOLD</p>
                    <p className="text-2xl font-black text-blue-600">INR {milestoneRows.filter(m => m.status === 'Locked' || m.status === 'Pending Approval').reduce((acc, m) => acc + (m.amount || 0), 0).toLocaleString("en-IN")}</p>
                 </Card>
                 <Card className="rounded-3xl border-slate-100 p-8 shadow-sm bg-white">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">TOTAL BUDGET</p>
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
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black ${milestone.status === 'Approved' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-600'}`}>
                                   {idx + 1}
                                </div>
                                {idx < milestoneRows.length - 1 && <div className="flex-1 w-0.5 bg-slate-100 my-4" />}
                             </div>
                             <div className="flex-1 pb-10 border-b border-slate-50 last:border-0 last:pb-0">
                                <div className="flex justify-between items-start mb-4">
                                   <div>
                                      <h4 className="text-lg font-black text-slate-900">{milestone.title}</h4>
                                      <Badge variant="outline" className={`mt-2 font-black text-[9px] uppercase ${milestone.status === 'Approved' ? 'border-emerald-200 text-emerald-600 bg-emerald-50' : 'border-slate-200 text-slate-600'}`}>{milestone.status}</Badge>
                                   </div>
                                   <div className="text-right">
                                      <p className="text-xl font-black text-slate-900">INR {milestone.amount?.toLocaleString("en-IN")}</p>
                                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Payout Volume</p>
                                   </div>
                                </div>
                                <div className="grid grid-cols-2 gap-8 mt-6 p-6 rounded-2xl bg-slate-50 border border-slate-100">
                                   <div>
                                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Deliverables Verified</p>
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
                                        <p className="text-xs font-medium text-slate-700">
                                          No verified deliverables in this phase yet.
                                        </p>
                                      )}
                                   </div>
                                   <div>
                                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">PM Notes</p>
                                      <p className="text-xs font-medium text-slate-700 italic leading-relaxed">{milestone.validationNotes || "No specific auditor notes for this phase."}</p>
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
                    <p className="py-20 text-center font-bold text-slate-600">
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
                              <p className="text-xs font-medium text-slate-700">{alert.message}</p>
                            </div>
                          </div>
                          <span className="whitespace-nowrap text-[10px] font-bold text-slate-600">
                            {new Date(alert.createdAt).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-20 text-center font-bold text-slate-600">
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
            <DialogDescription className="text-sm text-slate-700">
              Project manager automatically included. Choose client, freelancer, or both.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 p-6">
            <div>
              <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-600">Meeting Title</p>
              <Input
                value={meetingForm.title}
                onChange={(e) => setMeetingForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Project Sync"
                className="h-11 rounded-xl border-slate-200"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-600">Participants</p>
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
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-600">Platform</p>
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
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-600">Starts At</p>
                <Input
                  type="datetime-local"
                  value={meetingForm.startsAt}
                  onChange={(e) => setMeetingForm((prev) => ({ ...prev, startsAt: e.target.value }))}
                  className="h-11 rounded-xl border-slate-200"
                />
              </div>
              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-600">Ends At</p>
                <Input
                  type="datetime-local"
                  value={meetingForm.endsAt}
                  onChange={(e) => setMeetingForm((prev) => ({ ...prev, endsAt: e.target.value }))}
                  className="h-11 rounded-xl border-slate-200"
                />
              </div>
            </div>

            <div>
              <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-600">Notes</p>
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

      <Dialog open={projectSummaryOpen} onOpenChange={setProjectSummaryOpen}>
        <DialogContent className="max-w-2xl rounded-3xl border-slate-100 p-0">
          <DialogHeader className="border-b border-slate-100 p-6 pb-4">
            <DialogTitle className="text-lg font-black text-slate-900">
              Project Overview
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-700">
              Dynamic project details with full manager visibility.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 p-6">
            <div className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                  Project Name
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  {project.title || "Untitled Project"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                  Project ID
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  #{project.id || projectId}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                  Status
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  {project.status?.label || "Active"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                  Budget
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  INR {Number(project.budget || 0).toLocaleString("en-IN")}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                  Created
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  {project.createdAt ? new Date(project.createdAt).toLocaleString() : "Not available"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                  Updated
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  {project.updatedAt ? new Date(project.updatedAt).toLocaleString() : "Not available"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                Project Description
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {project.description || "No description available."}
              </p>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <Button
                variant="outline"
                className="h-10 rounded-xl border-slate-200 bg-white px-4 text-xs font-bold text-slate-600"
                onClick={() => {
                  setProjectSummaryOpen(false);
                  handleViewClientProfile();
                }}
              >
                View Client Profile
              </Button>
              <Button
                className="h-10 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700"
                onClick={() => {
                  setProjectSummaryOpen(false);
                  navigate(`/project-manager/projects/${projectId}`);
                }}
              >
                Open Full Project Page
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <FreelancerProfileDialog
        open={freelancerProfileOpen}
        onOpenChange={setFreelancerProfileOpen}
        viewingFreelancer={viewingFreelancerProfile}
      />

      <Dialog open={clientProfileOpen} onOpenChange={setClientProfileOpen}>
        <DialogContent className="max-w-xl rounded-3xl border-slate-100 p-0">
          <DialogHeader className="border-b border-slate-100 p-6 pb-4">
            <DialogTitle className="text-lg font-black text-slate-900">
              Client Profile
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-700">
              Project manager view for this client and project summary.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 p-6">
            <div className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                  Client Name
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  {clientProfile.clientName || "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                  Email
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  {clientProfile.email || "Not available"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                  Company
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  {clientProfile.company || "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                  Budget
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  INR {Number(project.budget || 0).toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                Requirements
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {clientProfile.requirements || project.description || "No requirements shared yet."}
              </p>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <Button
                variant="outline"
                className="h-10 rounded-xl border-slate-200 bg-white px-4 text-xs font-bold text-slate-600"
                onClick={() => {
                  setClientProfileOpen(false);
                  setProjectSummaryOpen(true);
                }}
              >
                View Project
              </Button>
              <Button
                className="h-10 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700"
                onClick={() => {
                  setClientProfileOpen(false);
                  navigate(`/project-manager/projects/${projectId}`);
                }}
              >
                Open Full Project Page
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6 pb-1">
         <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-blue-600 rounded flex items-center justify-center">
               <span className="text-white text-[10px] font-bold">C</span>
            </div>
            <span className="text-xs text-slate-600">(c) 2024 Catalance Platform. All rights reserved.</span>
         </div>
      </div>
    </PmShell>
  );
};

export default ProjectDetailsPage;



