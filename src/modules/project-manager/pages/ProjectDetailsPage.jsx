import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Send from "lucide-react/dist/esm/icons/send";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import Settings from "lucide-react/dist/esm/icons/settings";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Download from "lucide-react/dist/esm/icons/download";
import Upload from "lucide-react/dist/esm/icons/upload";
import FileText from "lucide-react/dist/esm/icons/file-text";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import MessageSquare from "lucide-react/dist/esm/icons/message-square";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Users from "lucide-react/dist/esm/icons/users";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import Plus from "lucide-react/dist/esm/icons/plus";
import UserPlus from "lucide-react/dist/esm/icons/user-plus";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import CalendarIcon from "lucide-react/dist/esm/icons/calendar";
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
import { SopEditorDialog } from "@/modules/project-manager/components/SopEditorDialog";

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

const formatTimelineDateTime = (value) => {
  if (!value) return "Present";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString();
};

const normalizeRequirementsText = (value) => {
  const raw = String(value || "")
    .replace(/```(?:markdown)?/gi, "")
    .replace(/'''/g, "")
    .replace(/\r\n/g, "\n")
    .trim();
  if (!raw) return "";

  return raw
    .replace(/\s{2,}/g, " ")
    .replace(
      /\s(?=(Client Name:|Business Name:|Service Type:|Project Overview:|Primary Objectives:|Features\/Deliverables Included:|Launch Timeline:|Budget:|Website Type:|Design Style:|Website Build Type:|Frontend Framework:|Backend Technology:|Database:|Hosting:|Page Count:))/g,
      "\n"
    )
    .trim();
};

const parseRequirementsIntoSections = (rawText = "") => {
  if (!rawText || !rawText.trim()) return [];

  const clean = rawText
    .replace(/```markdown\n?/gi, "")
    .replace(/```\n?/g, "")
    .trim();

  const sections = [];
  const lines = clean.split("\n");
  let currentSection = { title: "Overview", items: [], content: "" };

  const knownHeaderKeys = [
    "overview",
    "project overview",
    "primary objectives",
    "objectives",
    "features",
    "deliverables",
    "features/deliverables included",
    "features/deliverables",
    "tech stack",
    "technology",
    "timeline",
    "budget",
    "scope",
    "preferences",
    "requirements",
    "additional notes",
    "key features",
  ];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const isListItem = trimmed.startsWith("- ") || trimmed.startsWith("* ") || /^\d+\.\s+/.test(trimmed);
    const headerMatch = trimmed.match(/^(?:\*{1,2})?([^:*]+?)(?:\*{1,2})?:\s*(.*)$/);

    if (headerMatch && !isListItem) {
      const key = headerMatch[1].toLowerCase().trim();
      const value = headerMatch[2].trim();

      if (["client name", "business name", "service type"].includes(key)) {
        return;
      }

      if (knownHeaderKeys.some((hk) => key.includes(hk)) || key.length < 30) {
        if (currentSection.items.length > 0 || currentSection.content.trim()) {
          sections.push({ ...currentSection });
        }
        currentSection = {
          title: headerMatch[1].trim(),
          items: [],
          content: value,
        };
        return;
      }
    }

    if (isListItem) {
      const cleanVal = trimmed.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "");
      currentSection.items.push(cleanVal);
      return;
    }

    currentSection.content = currentSection.content
      ? `${currentSection.content}\n${trimmed}`
      : trimmed;
  });

  if (currentSection.items.length > 0 || currentSection.content.trim()) {
    sections.push(currentSection);
  }

  return sections;
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
    platform: "GOOGLE_MEET",
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
  const [sopEditorOpen, setSopEditorOpen] = useState(false);
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

      const meetingTitle = meetingForm.title || "Project Sync";
      const scope = meetingForm.participantScope || "BOTH";
      const formattedTime = new Date(startsAtIso).toLocaleString();

      // Target recipients based on participantScope requirement
      const recipientDetails = [];
      const recipientEmails = [];

      if (scope === "CLIENT" || scope === "BOTH") {
        const clientName = clientProfile.clientName || project.clientName || "Client";
        const clientEmail = clientProfile.email || "client@catalance.com";
        recipientDetails.push(`Client (${clientName})`);
        recipientEmails.push(clientEmail);
      }

      if (scope === "FREELANCER" || scope === "BOTH") {
        const freelancerName = freelancerProfile?.freelancerName || project.assignedFreelancer || "Freelancer";
        const freelancerEmail = freelancerProfile?.email || "freelancer@catalance.com";
        recipientDetails.push(`Freelancer (${freelancerName})`);
        recipientEmails.push(freelancerEmail);
      }

      const recipientsText = recipientDetails.join(" & ");
      const emailsText = recipientEmails.join(", ");

      await pmApi.createMeeting(authFetch, {
        projectId,
        title: meetingTitle,
        participantScope: scope,
        platform: meetingForm.platform,
        notes: meetingForm.notes,
        startsAt: startsAtIso,
        endsAt: endsAtIso,
      });

      // Save notification to LocalStorage for Dashboard Notifications
      const existingNotifs = JSON.parse(localStorage.getItem("catalance_meeting_notifications") || "[]");
      const newNotif = {
        id: `notif-meeting-${Date.now()}`,
        projectId,
        projectName: project.title,
        title: `📅 Meeting Invitation: ${meetingTitle}`,
        message: `Project Manager scheduled '${meetingTitle}' on ${formattedTime}. Platform: ${meetingForm.platform || "Google Meet"}. Invited: ${recipientsText}`,
        recipients: recipientEmails,
        participantScope: scope,
        createdAt: new Date().toISOString(),
        isUnread: true,
        type: "MEETING_INVITE",
      };
      localStorage.setItem("catalance_meeting_notifications", JSON.stringify([newNotif, ...existingNotifs]));

      // Dispatch custom window event for open dashboards
      window.dispatchEvent(new CustomEvent("catalance_notification_added", { detail: newNotif }));

      toast.success(`Meeting scheduled & Email invitation sent to ${recipientsText}!`, {
        description: `Notification sent to: ${emailsText} | Scheduled for ${formattedTime}`,
      });

      setMeetingDialogOpen(false);
      setMeetingForm(buildMeetingFormDefaults());
      meetings.refresh();
    } catch (err) {
      toast.error(err.message || "Failed to schedule meeting");
    } finally {
      setMeetingSubmitting(false);
    }
  };

  const handleApproveSop = async () => {
    try {
      setSending(true);
      await pmApi.approveSop(authFetch, projectId);
      toast.success("SOP Approved & Released successfully.");
      details.refresh();
    } catch (err) {
      toast.error(err.message || "Failed to approve SOP.");
    } finally {
      setSending(false);
    }
  };

  const handleHoldSop = async () => {
    try {
      setSending(true);
      await pmApi.holdSop(authFetch, projectId);
      toast.success("SOP is now on Hold.");
      details.refresh();
    } catch (err) {
      toast.error(err.message || "Failed to hold SOP.");
    } finally {
      setSending(false);
    }
  };

  const handleHoldTask = async (taskId, phaseId, isHeld) => {
    const previousData = details.data;
    if (previousData?.project?.customSop?.tasks) {
      const newTasks = previousData.project.customSop.tasks.map((t) => {
        if (String(t.id) === String(taskId) && String(t.phase) === String(phaseId)) {
          return { ...t, isHeld };
        }
        return t;
      });
      details.setData({
        ...previousData,
        project: {
          ...previousData.project,
          customSop: {
            ...previousData.project.customSop,
            tasks: newTasks,
          },
        },
      });
    }

    try {
      await pmApi.holdTask(authFetch, projectId, { taskId, phaseId, isHeld });
      toast.success(`Task ${isHeld ? 'put on hold' : 'unheld'} successfully.`);
    } catch (err) {
      if (previousData) {
        details.setData(previousData);
      }
      toast.error(err.message || "Failed to update task hold status.");
    }
  };
  const project = details.data?.project || {};
  const clientProfile = details.data?.clientProfile || {};
  const rawFreelancer = details.data?.freelancerProfile || details.data?.freelancer || null;

  const freelancerProfile = useMemo(() => {
    if (rawFreelancer) {
      const name = rawFreelancer.freelancerName || rawFreelancer.fullName || rawFreelancer.name || "Freelancer";
      return {
        ...rawFreelancer,
        id: rawFreelancer.id || "",
        freelancerName: name,
        avatar: rawFreelancer.avatar || "",
        rating: Number(rawFreelancer.rating || 0),
        reviewsCount: Number(rawFreelancer.reviewsCount || rawFreelancer.reviewCount || 0),
        skills: Array.isArray(rawFreelancer.skills) ? rawFreelancer.skills : [],
        email: rawFreelancer.email || "",
      };
    }

    const proj = details.data?.project || {};
    const proposals = Array.isArray(details.data?.proposals)
      ? details.data.proposals
      : Array.isArray(proj.proposals)
      ? proj.proposals
      : [];

    const acceptedProposal =
      proposals.find((p) => String(p?.status || "").toUpperCase() === "ACCEPTED") ||
      proposals.find((p) => String(p?.status || "").toUpperCase() === "REPLACED") ||
      proposals.find((p) => p?.freelancer);

    const fallbackFreelancer = proj.freelancer || proj.assignedFreelancer || acceptedProposal?.freelancer;

    if (fallbackFreelancer) {
      const name =
        typeof fallbackFreelancer === "string"
          ? fallbackFreelancer
          : fallbackFreelancer.fullName || fallbackFreelancer.name || fallbackFreelancer.freelancerName || "Freelancer";

      if (name && name !== "Unassigned") {
        return {
          id: typeof fallbackFreelancer === "object" ? fallbackFreelancer.id || "" : "",
          freelancerName: name,
          avatar: typeof fallbackFreelancer === "object" ? fallbackFreelancer.avatar || "" : "",
          rating: typeof fallbackFreelancer === "object" ? Number(fallbackFreelancer.rating || 0) : 0,
          reviewsCount: typeof fallbackFreelancer === "object" ? Number(fallbackFreelancer.reviewsCount || 0) : 0,
          skills: typeof fallbackFreelancer === "object" && Array.isArray(fallbackFreelancer.skills) ? fallbackFreelancer.skills : [],
          email: typeof fallbackFreelancer === "object" ? fallbackFreelancer.email || "" : "",
        };
      }
    }

    return null;
  }, [details.data]);
  const requirementsText = useMemo(
    () =>
      normalizeRequirementsText(
        clientProfile.requirements || project.description || ""
      ),
    [clientProfile.requirements, project.description]
  );
  const requirementsSections = useMemo(
    () => parseRequirementsIntoSections(requirementsText || ""),
    [requirementsText]
  );
  const freelancerAssignmentHistory = Array.isArray(details.data?.freelancerAssignmentHistory)
    ? details.data.freelancerAssignmentHistory
    : [];
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

  const sopTemplate = useMemo(() => project?.customSop || getSopFromTitle(project.title), [project?.customSop, project.title]);
  const completedTaskSet = useMemo(() => {
    let tasks = project?.completedTasks;
    if (typeof tasks === "string") {
      try {
        tasks = JSON.parse(tasks);
      } catch (e) {
        tasks = [];
      }
    }
    return new Set(Array.isArray(tasks) ? tasks : []);
  }, [project?.completedTasks]);
  const verifiedTaskSet = useMemo(() => {
    let tasks = project?.verifiedTasks;
    if (typeof tasks === "string") {
      try {
        tasks = JSON.parse(tasks);
      } catch (e) {
        tasks = [];
      }
    }
    return new Set(Array.isArray(tasks) ? tasks : []);
  }, [project?.verifiedTasks]);

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
      const leadRole = task.assignedRole || getTaskLeadRole(task.phase);
      const phaseName =
        sopTemplate?.phases?.find((phase) => String(phase.id) === String(task.phase))?.name ||
        `Phase ${task.phase}`;

      return {
        id: key,
        originalTaskId: task.id,
        serial: index + 1,
        phaseId: task.phase,
        phaseName: String(phaseName).replace(/\s*\(\s*Phase-\d+\s*\)/i, "").trim(),
        title: task.title,
        leadRole,
        leadName: assigneeNames[leadRole],
        timeline: task.timeline,
        status: isVerified ? "VERIFIED" : isCompleted ? "COMPLETED" : "PENDING",
        isHeld: !!task.isHeld,
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
      const allPhaseTasks = tasksByPhase[phaseKey] || [];
      const phaseTasks = allPhaseTasks.filter((task) => !task.isHeld);
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
        tasks: allPhaseTasks,
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
      className="min-h-screen bg-background text-foreground"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-9 rounded-full border border-border bg-card px-4 text-xs font-semibold text-foreground shadow-xs hover:bg-muted"
            onClick={() => setMeetingDialogOpen(true)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5 text-primary" />
            Schedule Meeting
          </Button>
          <Button
            variant="outline"
            className="h-9 rounded-full border border-destructive/20 bg-destructive/10 px-4 text-xs font-semibold text-destructive shadow-xs hover:bg-destructive/20"
            onClick={() => toast.info("Escalation module opening...")}
          >
            <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
            Escalate to Admin
          </Button>
        </div>
      }
    >
      <div className="mb-4 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Link to="/project-manager" className="hover:text-foreground">Dashboard</Link>
        <ChevronRight className="h-3 w-3 opacity-60" />
        <Link to="/project-manager/projects" className="hover:text-foreground">Projects</Link>
        <ChevronRight className="h-3 w-3 opacity-60" />
        <span className="text-foreground font-semibold truncate max-w-[200px]">{project.title}</span>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <Badge className="rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-semibold px-3 py-0.5 uppercase tracking-wider">
            {project.status?.label || "ACTIVE"}
        </Badge>
        <span className="text-xs font-medium text-muted-foreground">Project ID: #{project.id}</span>
      </div>

      <Tabs defaultValue="overview" className="w-full space-y-6">
        <TabsContent value="overview" className="mt-0 overflow-x-clip space-y-6">
          <div className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="rounded-3xl border border-border/60 bg-card text-card-foreground shadow-xs overflow-hidden group transition-all hover:shadow-md">
                  <CardContent className="p-6 space-y-5">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                             <FileText className="h-5 w-5" />
                          </div>
                          <h3 className="text-base font-semibold text-foreground">Client Profile</h3>
                       </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/40 border border-border/40">
                       <Avatar className="h-12 w-12 rounded-full border border-border shadow-xs">
                          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${clientProfile.clientName}`} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">C</AvatarFallback>
                       </Avatar>
                       <div className="min-w-0">
                          <p className="text-base font-semibold text-foreground truncate">{clientProfile.clientName}</p>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{clientProfile.company || "Direct Client"}</p>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Project Scope</p>
                          <p className="text-xs font-medium text-muted-foreground leading-relaxed line-clamp-3">{project.description}</p>
                       </div>
                       <div className="flex justify-between items-center pt-3 border-t border-border/40">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Budget Allocation</p>
                          <p className="text-xl font-bold text-foreground">INR {Number(project.budget || 0).toLocaleString("en-IN")}</p>
                       </div>
                       <div className="grid gap-2 sm:grid-cols-2 pt-1">
                          <Button
                             variant="outline"
                             className="h-10 rounded-full border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-xs"
                             onClick={handleViewProject}
                          >
                             View Project
                          </Button>
                          <Button
                             variant="outline"
                             className="h-10 rounded-full border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-xs"
                             onClick={handleViewClientProfile}
                          >
                             Client Profile
                          </Button>
                       </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl border border-border/60 bg-card text-card-foreground shadow-xs overflow-hidden group transition-all hover:shadow-md">
                  <CardContent className="p-6 space-y-5">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                             <Users className="h-5 w-5" />
                          </div>
                          <h3 className="text-base font-semibold text-foreground">Freelancer</h3>
                       </div>
                    </div>
                    {freelancerProfile ? (
                        <>
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/40 border border-border/40">
                               <Avatar className="h-12 w-12 rounded-full border border-border shadow-xs">
                                  <AvatarImage src={freelancerProfile.avatar} />
                                  <AvatarFallback className="bg-primary/10 text-primary font-bold">{freelancerProfile.freelancerName?.[0]}</AvatarFallback>
                               </Avatar>
                               <div className="min-w-0">
                                  <p className="text-base font-semibold text-foreground truncate">{freelancerProfile.freelancerName}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                     <span className="text-amber-500 text-xs">★</span>
                                     <span className="text-xs font-semibold text-foreground">{freelancerProfile.rating}</span>
                                     <span className="text-xs text-muted-foreground font-medium">({freelancerProfile.reviewsCount} reviews)</span>
                                  </div>
                               </div>
                            </div>
                             <div className="flex flex-wrap gap-1.5">
                                {freelancerProfile.skills.slice(0, 4).map(skill => (
                                  <Badge key={skill} variant="secondary" className="bg-muted text-muted-foreground border border-border/50 text-[10px] font-semibold rounded-full px-2.5 py-0.5">{skill.toUpperCase()}</Badge>
                                ))}
                                {freelancerProfile.skills.length > 4 && <span className="text-[10px] font-semibold text-muted-foreground self-center">+{freelancerProfile.skills.length - 4}</span>}
                             </div>
                             <div className="rounded-2xl border border-border/40 bg-muted/20 p-3">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                  Assignment Timeline
                                </p>
                                {freelancerAssignmentHistory.length > 0 ? (
                                  <div className="space-y-2">
                                    {freelancerAssignmentHistory.slice(0, 3).map((entry) => (
                                      <div
                                        key={entry.proposalId}
                                        className="rounded-xl border border-border/50 bg-card p-2.5"
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <p className="text-xs font-semibold text-foreground">
                                            {entry.freelancerName}
                                          </p>
                                          <Badge
                                            variant="outline"
                                            className={`text-[9px] font-semibold uppercase rounded-full px-2 py-0.5 ${
                                              entry.status === "CURRENT"
                                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                : "border-border bg-muted text-muted-foreground"
                                            }`}
                                          >
                                            {entry.status}
                                          </Badge>
                                        </div>
                                        <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                                          {formatTimelineDateTime(entry.startedAt)} -{" "}
                                          {entry.endedAt ? formatTimelineDateTime(entry.endedAt) : "Present"}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs font-medium text-muted-foreground">
                                    No freelancer assignment history yet.
                                  </p>
                                )}
                             </div>
                             <div className="grid gap-2 sm:grid-cols-2 pt-1">
                                 <Button variant="outline" className="h-10 rounded-full border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-xs" onClick={handleViewFreelancerProfile}>
                                      Full Profile
                                 </Button>
                                 <Button 
                                     variant="outline" 
                                     className="h-10 rounded-full border border-destructive/20 bg-destructive/5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors shadow-xs"
                                     onClick={() => navigate(`/project-manager/marketplace?projectId=${projectId}&reassign=true`)}
                                 >
                                     Reassign
                                 </Button>
                             </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-3 border border-dashed border-border/60 rounded-2xl bg-muted/20">
                            <div className="h-11 w-11 flex items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                               <UserPlus className="h-5.5 w-5.5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-foreground">No Freelancer Assigned</p>
                              <p className="text-xs font-medium text-muted-foreground mt-0.5 max-w-xs">
                                Assign top talent to manage milestones and project deliverables.
                              </p>
                            </div>
                            <Button
                              variant="default"
                              className="h-9.5 rounded-full bg-primary text-xs font-bold text-primary-foreground px-6 shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
                              onClick={() => navigate(`/project-manager/marketplace?projectId=${projectId}`)}
                            >
                              Assign Freelancer
                            </Button>
                        </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="rounded-3xl border border-border/60 bg-card text-card-foreground shadow-xs overflow-hidden">
                <CardContent className="space-y-6 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-foreground">
                          Milestone Payout Tracker
                        </h3>
                        <p className="text-xs text-muted-foreground font-medium">
                          Secure Escrow Distribution
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-full border border-primary/20 bg-primary/10 px-3 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                        onClick={() => setSopEditorOpen(true)}
                      >
                        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                        Edit SOP with AI
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-full border border-border bg-card px-3 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                        onClick={() => setSopEditorOpen(true)}
                      >
                        <Settings className="mr-1.5 h-3.5 w-3.5" />
                        Edit SOP
                      </Button>
                      <Badge
                        variant="outline"
                        className="rounded-full border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                      >
                        {completedPhases} Completed
                      </Badge>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/50 bg-muted/30 p-4">
                    {!project.isSopApprovedByPM ? (
                      <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 shadow-xs flex items-start sm:items-center justify-between flex-col sm:flex-row gap-3">
                        <div className="flex gap-3 items-start sm:items-center">
                          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <div>
                            <h4 className="text-sm font-semibold text-foreground">SOP Pending Approval</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">The client and freelancer cannot proceed until you approve the SOP.</p>
                          </div>
                        </div>
                        <Button 
                          onClick={handleApproveSop} 
                          disabled={sending} 
                          className="bg-amber-600 hover:bg-amber-700 text-white font-semibold whitespace-nowrap text-xs h-9 px-4 rounded-full shadow-xs w-full sm:w-auto"
                        >
                          {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                          Approve & Release SOP
                        </Button>
                      </div>
                    ) : (
                      <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 shadow-xs flex items-start sm:items-center justify-between flex-col sm:flex-row gap-3">
                        <div className="flex gap-3 items-start sm:items-center">
                          <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <div>
                            <h4 className="text-sm font-semibold text-foreground">SOP is Active & Released</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">The client and freelancer have access to the phases.</p>
                          </div>
                        </div>
                        <Button 
                          onClick={handleHoldSop} 
                          disabled={sending} 
                          variant="outline"
                          className="border-border bg-card hover:bg-muted text-foreground font-semibold whitespace-nowrap text-xs h-9 px-4 rounded-full shadow-xs w-full sm:w-auto"
                        >
                          {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                          Hold SOP
                        </Button>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Phases Overview</p>
                        <p className="text-xs text-muted-foreground font-medium">
                          Expand each phase to review blockers, verification, and payout readiness.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant="outline"
                          className="rounded-full border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground"
                        >
                          {phaseInsightRows.length} Total Phases
                        </Badge>
                        <Badge
                          variant="outline"
                          className="rounded-full border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                        >
                          {completedPhases} Completed
                        </Badge>
                        <Badge
                          variant="outline"
                          className="rounded-full border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
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
                            onHoldTask={handleHoldTask}
                          />
                        ))}
                      </Accordion>
                    </div>
                  ) : (
                    <p className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                      No milestone phases available for this project yet.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-3xl border border-border/60 bg-card text-card-foreground shadow-xs overflow-hidden">
                <CardHeader className="border-b border-border/60 bg-muted/20 p-6 pb-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle className="text-base font-semibold text-foreground">
                      All Phase Task Matrix
                    </CardTitle>
                    <Badge className="bg-muted text-muted-foreground text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full border border-border/50">
                      {visibleSopTaskRows.length} / {filteredSopTaskRows.length} Points
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground font-medium">
                    Start with 4 points. Use role cards to filter tasks and tap view more for complete list.
                  </p>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid gap-3 border-b border-border/60 bg-muted/10 p-5 sm:grid-cols-2 lg:grid-cols-4">
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
                        className={`rounded-2xl border p-4 text-left transition-colors ${
                          isActive
                            ? "border-primary/30 bg-primary/10 shadow-xs"
                            : "border-border/60 bg-card hover:bg-muted/40"
                        }`}
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {roleLabel}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">{roleRow.assignee}</p>
                        <p className="mt-1 text-xs font-medium leading-relaxed text-muted-foreground">
                          Total {roleRow.total} | Verified {roleRow.verified} | Completed {roleRow.completed} | Pending {roleRow.pending}
                        </p>
                      </button>
                    );
                    })}
                  </div>

                  <div className="border-b border-border/60 bg-card px-4 py-3 md:hidden">
                    <p className="text-xs font-medium text-muted-foreground">
                      Showing:{" "}
                      <span className="font-semibold text-foreground">
                        {activeTaskRoleFilter === "ALL"
                          ? "All roles"
                          : activeTaskRoleFilter.replace("_", " ")}
                      </span>
                    </p>
                  </div>

                  <div className="space-y-2 p-4 md:hidden">
                    {visibleSopTaskRows.map((task) => (
                      <article key={task.id} className="rounded-2xl border border-border/60 bg-card p-3">
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <p className="text-xs font-semibold text-muted-foreground">Point {task.serial}</p>
                          {task.status !== "PENDING" && (
                            <Badge
                              className={`text-[10px] font-semibold uppercase rounded-full px-2.5 py-0.5 ${
                                task.status === "VERIFIED"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                  : task.status === "COMPLETED"
                                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                    : "bg-primary/10 text-primary border border-primary/20"
                              }`}
                            >
                              {task.status === "COMPLETED" ? "PENDING REVIEW" : task.status}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-foreground">{task.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Phase {task.phaseId} | {task.phaseName}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge
                            className={`text-[10px] font-semibold uppercase rounded-full px-2.5 py-0.5 ${
                              task.leadRole === "CLIENT"
                                ? "bg-primary/10 text-primary border border-primary/20"
                                : task.leadRole === "FREELANCER"
                                  ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            }`}
                          >
                            {task.leadRole.replace("_", " ")}
                          </Badge>
                          <span className="text-xs font-medium text-muted-foreground">{task.leadName}</span>
                        </div>
                      </article>
                    ))}
                    {visibleSopTaskRows.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-border/60 px-4 py-6 text-center text-sm font-medium text-muted-foreground">
                        No tasks found for this role.
                      </p>
                    ) : null}
                  </div>

                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[800px] table-fixed">
                      <colgroup>
                        <col className="w-16" />
                        <col className="w-[170px]" />
                        <col />
                        <col className="w-[130px]" />
                        <col className="w-[170px]" />
                        <col className="w-[110px]" />
                        <col className="w-[100px]" />
                      </colgroup>
                      <thead className="bg-muted/40">
                        <tr>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Point</th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Phase</th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Task</th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Lead Role</th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Assigned User</th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border/60">
                        {visibleSopTaskRows.map((task) => (
                          <tr key={task.id} className="align-top transition-colors hover:bg-muted/30">
                            <td className="px-4 py-3 text-sm font-semibold text-foreground">{task.serial}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-foreground">
                              Phase {task.phaseId}
                              <div className="mt-0.5 text-xs font-medium text-muted-foreground">
                                {task.phaseName}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium leading-relaxed text-foreground break-words">
                              {task.title}
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                className={`text-[10px] font-semibold uppercase rounded-full px-2.5 py-0.5 ${
                                  task.leadRole === "CLIENT"
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : task.leadRole === "FREELANCER"
                                      ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                }`}
                              >
                                {task.leadRole.replace("_", " ")}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-foreground break-words">{task.leadName}</td>
                            <td className="px-4 py-3">
                              {task.status !== "PENDING" ? (
                                <Badge
                                  className={`text-[10px] font-semibold uppercase rounded-full px-2.5 py-0.5 ${
                                    task.status === "VERIFIED"
                                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                      : task.status === "COMPLETED"
                                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                        : "bg-primary/10 text-primary border border-primary/20"
                                  }`}
                                >
                                  {task.status === "COMPLETED" ? "PENDING REVIEW" : task.status}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleHoldTask(task.originalTaskId, task.phaseId, !task.isHeld)}
                                className={`h-7 px-2.5 text-[10px] font-semibold uppercase rounded-full ${
                                  task.isHeld
                                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                                }`}
                              >
                                {task.isHeld ? "UNHOLD" : "HOLD"}
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {visibleSopTaskRows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-4 py-10 text-center text-sm font-medium text-muted-foreground"
                            >
                              No tasks found for this role.
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                  {filteredSopTaskRows.length > 4 ? (
                    <div className="flex justify-end border-t border-border/60 bg-card px-4 py-3">
                      <Button
                        variant="outline"
                        className="h-9 rounded-full border border-border bg-card px-4 text-xs font-semibold text-foreground hover:bg-muted"
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

              <div className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 sm:p-8 shadow-xs">
                 <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                       <Download className="h-7 w-7" />
                    </div>
                    <div className="flex-1 text-center lg:text-left">
                       <h3 className="mb-1 text-lg font-semibold text-foreground">Handover Documentation</h3>
                       <p className="mb-6 text-xs font-medium text-muted-foreground leading-relaxed max-w-xl">
                          Ensure all deliverables, source files, and credentials have been securely verified by you before initiating Final Release.
                       </p>
                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                          <label className="flex items-center gap-3 cursor-pointer p-3.5 rounded-2xl bg-muted/40 hover:bg-muted/60 transition-colors border border-border/50">
                             <Checkbox 
                                checked={checklist.sourceCodeTransferred} 
                                onCheckedChange={(v) => setChecklist(p => ({...p, sourceCodeTransferred: !!v}))}
                                className="h-4 w-4 rounded border-border" 
                             />
                             <span className="text-xs font-semibold text-foreground">Sources</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer p-3.5 rounded-2xl bg-muted/40 hover:bg-muted/60 transition-colors border border-border/50">
                             <Checkbox 
                                checked={checklist.documentationFinalized} 
                                onCheckedChange={(v) => setChecklist(p => ({...p, documentationFinalized: !!v}))}
                                className="h-4 w-4 rounded border-border" 
                             />
                             <span className="text-xs font-semibold text-foreground">Docs</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer p-3.5 rounded-2xl bg-muted/40 hover:bg-muted/60 transition-colors border border-border/50">
                             <Checkbox 
                                checked={checklist.credentialsShared} 
                                onCheckedChange={(v) => setChecklist(p => ({...p, credentialsShared: !!v}))}
                                className="h-4 w-4 rounded border-border" 
                             />
                             <span className="text-xs font-semibold text-foreground">Access</span>
                          </label>
                       </div>
                       <Button 
                           onClick={handleFinalizeHandover}
                           disabled={!checklist.sourceCodeTransferred || !checklist.documentationFinalized || !checklist.credentialsShared}
                           className="h-11 rounded-full bg-primary px-8 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
                       >
                          Finalize Project Closure
                       </Button>
                    </div>
                 </div>
              </div>
            </div>

            <div className="space-y-6 2xl:sticky 2xl:top-24 2xl:self-start">
               <Card className="rounded-3xl border border-border/60 bg-card text-card-foreground shadow-xs">
                  <CardContent className="p-5">
                     <div className="mb-4 flex items-center justify-between">
                        <div>
                           <h4 className="text-sm font-semibold text-foreground">Meeting Scheduler</h4>
                           <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">PM + Client/Freelancer/Both</p>
                        </div>
                        <Button
                          variant="outline"
                          className="h-8 rounded-full border border-primary/20 bg-primary/10 px-3 text-xs font-semibold text-primary hover:bg-primary/20"
                          onClick={() => setMeetingDialogOpen(true)}
                        >
                          Schedule
                        </Button>
                     </div>
                     <div className="space-y-2">
                        {meetings.loading ? (
                          <p className="text-xs font-medium text-muted-foreground">Loading meetings...</p>
                        ) : projectMeetings.length > 0 ? (
                          projectMeetings.map((meeting) => (
                            <div key={meeting.id} className="rounded-2xl border border-border/50 bg-muted/30 p-3 mb-2 last:mb-0">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-foreground">{meeting.title}</p>
                                {meeting.meetingLink && (
                                  <a
                                    href={meeting.meetingLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] font-semibold text-primary hover:underline bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20"
                                  >
                                    Join
                                  </a>
                                )}
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {new Date(meeting.startsAt).toLocaleString()} - {new Date(meeting.endsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </p>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
                                Scope: {meeting.participantScope || "BOTH"}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs font-medium text-muted-foreground">No meetings scheduled for this project yet.</p>
                        )}
                     </div>
                  </CardContent>
               </Card>

                <Card className="flex h-[clamp(540px,68vh,700px)] flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
                   {/* Header matching Image 2 */}
                   <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-white">
                      <div>
                         <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">PROJECT CHAT</h4>
                         <p className="text-xs font-medium text-slate-500 mt-0.5">Ask questions & share files</p>
                      </div>
                      
                      <Button
                         type="button"
                         variant="outline"
                         onClick={() => navigate(`/project-manager/messages?projectId=${projectId}`)}
                         className="h-9 rounded-xl border-amber-200/80 bg-amber-50/60 text-[#D9692A] hover:bg-amber-100/80 font-bold text-xs px-4 transition-all shadow-2xs cursor-pointer"
                      >
                         Open Chat
                      </Button>
                   </div>
                   
                   {/* Chat Body */}
                   <div className="subtle-scrollbar flex-1 space-y-4 overflow-y-auto bg-white p-5">
                      {messages.loading ? (
                          <div className="flex h-full flex-col items-center justify-center gap-2 text-xs font-bold text-slate-400">
                             <Loader2 className="h-5 w-5 animate-spin text-[#D9692A]" />
                             <span>Syncing project chat...</span>
                          </div>
                      ) : conversationRows.length > 0 ? (
                          conversationRows.map((msg) => (
                            <div key={msg.id} className={`flex flex-col ${msg.senderRole === 'PROJECT_MANAGER' ? 'items-end' : 'items-start'}`}>
                               <p className="mb-1 text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                                  {msg.senderLabel} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                               </p>
                               <div className={`max-w-[90%] rounded-2xl p-3.5 text-xs font-medium shadow-2xs ${msg.senderRole === 'PROJECT_MANAGER' ? 'bg-[#D9692A] text-white rounded-tr-none' : 'bg-slate-100 border border-slate-200/60 text-slate-900 rounded-tl-none'}`}>
                                  {(() => {
                                    const raw = String(msg.content || "");
                                    const scopeMatch = raw.match(/^\[SCOPE:(\w+)\]/i);
                                    const scope = scopeMatch ? scopeMatch[1] : null;
                                    const scopeBadge = scope === "CLIENT" ? "PM + Client" : scope === "FREELANCER" ? "PM + Freelancer" : scope === "BOTH" ? "All Participants" : null;

                                    const text = raw.replace(/^\[SCOPE:\w+\]\s*/i, "").replace(/^\[System\]/i, "[Project Manager]").trim();
                                    const isMeeting = /meeting/i.test(text) && (text.includes("scheduled") || text.includes("Invitation") || text.includes("Join"));

                                    if (isMeeting) {
                                      const titleMatch = text.match(/"([^"]+)"/);
                                      const title = titleMatch ? titleMatch[1] : "Project Sync";
                                      const linkMatch = text.match(/https?:\/\/[^\s]+/);
                                      const link = linkMatch ? linkMatch[0].replace(/[.,;)]+$/, "") : "https://meet.google.com/new";
                                      const timeMatch = text.match(/scheduled for ([^\n.]+)/i);
                                      const timeStr = timeMatch ? timeMatch[1].replace(/\.?\s*Join Meeting.*$/i, "").trim() : "";

                                      return (
                                        <div className="space-y-2.5 min-w-[220px]">
                                          <div className="flex items-center justify-between gap-2 border-b border-current/20 pb-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                              <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                                <CalendarIcon className="h-4 w-4" />
                                              </div>
                                              <div className="min-w-0">
                                                <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Meeting Scheduled</p>
                                                <p className="text-xs font-semibold truncate">{title}</p>
                                              </div>
                                            </div>
                                            {scopeBadge && (
                                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-white/20 shrink-0">
                                                {scopeBadge}
                                              </span>
                                            )}
                                          </div>
                                          {timeStr && (
                                            <p className="text-[11px] font-medium opacity-90">
                                              📅 {timeStr}
                                            </p>
                                          )}
                                          <div className="pt-1">
                                            <a
                                              href={link}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center justify-center gap-1.5 h-8 px-4 rounded-full bg-white text-[#D9692A] text-xs font-bold shadow-xs hover:bg-amber-50 transition-colors"
                                            >
                                              <span>Join Meeting</span>
                                              <ExternalLink className="h-3.5 w-3.5" />
                                            </a>
                                          </div>
                                        </div>
                                      );
                                    }

                                    return text;
                                  })()}
                               </div>
                            </div>
                          ))
                      ) : (
                          <div className="flex h-full flex-col items-center justify-center p-4 my-auto">
                             <div className="w-full rounded-3xl border border-dashed border-slate-200/90 bg-slate-50/50 p-10 text-center">
                                <p className="text-sm font-semibold text-slate-700 max-w-xs mx-auto leading-relaxed">
                                   No messages yet. Start the conversation with your client.
                                </p>
                             </div>
                          </div>
                      )}
                   </div>
                   
                   {/* Footer Input Bar matching Image 2 */}
                   <div className="p-4 border-t border-slate-100 bg-white">
                      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center gap-2">
                         <Input 
                            value={composer}
                            onChange={(e) => setComposer(e.target.value)}
                            className="h-12 flex-1 rounded-2xl border border-slate-200 bg-amber-50/20 px-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#D9692A]" 
                            placeholder="Type your message..."
                            disabled={sending}
                         />
                         <button
                            type="button"
                            onClick={() => navigate(`/project-manager/messages?projectId=${projectId}`)}
                            className="h-12 w-12 flex items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all shrink-0 cursor-pointer"
                            title="Upload file in full chat"
                         >
                            <Upload className="h-4 w-4" />
                         </button>
                         <button 
                             type="submit"
                             disabled={sending || !composer.trim()}
                             className="h-12 w-12 flex items-center justify-center rounded-2xl bg-[#D9692A] text-white shadow-xs hover:bg-[#B85A24] disabled:opacity-50 transition-all shrink-0 cursor-pointer"
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
                          ? "bg-[#D9692A] text-white rounded-tr-none"
                          : "bg-white border border-slate-100 text-slate-900 rounded-tl-none"
                      }`}
                    >
                      {(() => {
                        const raw = String(msg.content || "");
                        const text = raw.replace(/^\[SCOPE:\w+\]\s*/i, "").replace(/^\[System\]/i, "[Project Manager]").trim();
                        const isMeeting = /meeting/i.test(text) && (text.includes("scheduled") || text.includes("Invitation") || text.includes("Join") || text.includes("Project Sync"));

                        if (isMeeting) {
                          const titleMatch = text.match(/"([^"]+)"/);
                          const title = titleMatch ? titleMatch[1] : "Project Sync";
                          const linkMatch = text.match(/https?:\/\/[^\s]+/);
                          const link = linkMatch ? linkMatch[0].replace(/[.,;)]+$/, "") : "https://meet.google.com/new";
                          const timeMatch = text.match(/scheduled for ([^\n.]+)/i);
                          let timeStr = timeMatch ? timeMatch[1].replace(/\.?\s*Join Meeting.*$/i, "").trim() : "";

                          if (!timeStr) {
                            const fallbackTime = text.match(/\b\d{1,2}\/\d{1,2}\/\d{4}[^.]*/);
                            if (fallbackTime) {
                              timeStr = fallbackTime[0].trim();
                            }
                          }

                          return (
                            <div className="space-y-2.5 min-w-[220px] p-0.5">
                              <div className="flex items-center gap-2 border-b border-current/20 pb-2">
                                <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                  <CalendarIcon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Meeting Scheduled</p>
                                  <p className="text-xs font-semibold truncate">{title}</p>
                                </div>
                              </div>
                              {timeStr && (
                                <p className="text-[11px] font-medium opacity-90">
                                  📅 {timeStr}
                                </p>
                              )}
                              <div className="pt-1">
                                <a
                                  href={link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center gap-1.5 h-8 px-4 rounded-full bg-white text-primary text-xs font-bold shadow-xs hover:bg-white/90 transition-colors"
                                >
                                  <span>Join Meeting</span>
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </div>
                            </div>
                          );
                        }

                        return text;
                      })()}
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
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-sm font-medium placeholder:text-slate-600 focus-visible:ring-2 focus-visible:ring-[#D9692A]/20"
                  placeholder="Type message as Project Manager..."
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !composer.trim()}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-[#D9692A] text-white hover:bg-[#B85A24] disabled:opacity-40"
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
                 <Card className="rounded-3xl border-orange-100 p-8 shadow-sm bg-gradient-to-br from-white to-orange-50/50">
                    <p className="text-[10px] font-black text-orange-600/70 uppercase tracking-widest mb-1">UNLOCKED FUNDS</p>
                    <p className="text-2xl font-black text-[#D9692A]">INR {milestoneRows.filter(m => m.status === 'Approved' || m.status === 'Completed').reduce((acc, m) => acc + (m.amount || 0), 0).toLocaleString("en-IN")}</p>
                 </Card>
                 <Card className="rounded-3xl border-orange-100 p-8 shadow-sm bg-gradient-to-br from-white to-orange-50/50">
                    <p className="text-[10px] font-black text-orange-600/70 uppercase tracking-widest mb-1">ESCROW HOLD</p>
                    <p className="text-2xl font-black text-[#D9692A]">INR {milestoneRows.filter(m => m.status === 'Locked' || m.status === 'Pending Approval').reduce((acc, m) => acc + (m.amount || 0), 0).toLocaleString("en-IN")}</p>
                 </Card>
                 <Card className="rounded-3xl border-orange-100 p-8 shadow-sm bg-gradient-to-br from-white to-orange-50/50">
                    <p className="text-[10px] font-black text-orange-600/70 uppercase tracking-widest mb-1">TOTAL BUDGET</p>
                    <p className="text-2xl font-black text-[#D9692A]">INR {Number(project.budget || 0).toLocaleString("en-IN")}</p>
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
                          <div key={idx} className="flex gap-4 md:gap-10">
                             <div className="flex flex-col items-center">
                                <div className={`h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center font-black ${milestone.status === 'Approved' ? 'bg-[#D9692A] text-white shadow-lg shadow-[#D9692A]/30' : 'bg-orange-100/50 text-[#D9692A]'}`}>
                                   {idx + 1}
                                </div>
                                {idx < milestoneRows.length - 1 && <div className="flex-1 w-0.5 bg-orange-100/50 my-4" />}
                             </div>
                             <div className="flex-1 pb-10 border-b border-orange-50 last:border-0 last:pb-0 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:justify-between items-start mb-4 gap-2">
                                   <div className="min-w-0">
                                      <h4 className="text-lg font-black text-slate-900 truncate">{milestone.title}</h4>
                                      <Badge variant="outline" className={`mt-2 font-black text-[9px] uppercase ${milestone.status === 'Approved' ? 'border-[#D9692A] text-[#D9692A] bg-orange-50' : 'border-orange-200 text-orange-600 bg-orange-50/50'}`}>{milestone.status}</Badge>
                                   </div>
                                   <div className="sm:text-right mt-2 sm:mt-0">
                                      <p className="text-xl font-black text-[#D9692A]">INR {milestone.amount?.toLocaleString("en-IN")}</p>
                                      <p className="text-[10px] font-bold text-orange-600/70 uppercase tracking-widest">Payout Volume</p>
                                   </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mt-6 p-4 md:p-6 rounded-2xl bg-gradient-to-br from-orange-50/40 to-white border border-orange-100/50 shadow-sm">
                                   <div>
                                      <p className="text-[10px] font-black text-orange-600/70 uppercase tracking-widest mb-2">Deliverables Verified</p>
                                      {phaseTasks.length > 0 ? (
                                        <ul className="space-y-2">
                                          {phaseTasks.map((task) => (
                                            <li key={task.id} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                                              <CheckCircle className="h-3 w-3 text-[#D9692A]" />
                                              {task.title}
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="text-xs font-medium text-slate-500 italic">
                                          No verified deliverables in this phase yet.
                                        </p>
                                      )}
                                   </div>
                                   <div>
                                      <p className="text-[10px] font-black text-orange-600/70 uppercase tracking-widest mb-2">PM Notes</p>
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
                                alert.read ? "bg-slate-300" : "bg-[#D9692A]"
                              }`}
                            />
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#D9692A]">
                                  {alert.type || "General"}
                                </span>
                                {!alert.read ? (
                                  <Badge className="bg-[#D9692A] text-[9px] font-black uppercase tracking-wider text-white">
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
                <Input
                  value="Google Meet"
                  disabled
                  className="h-11 w-full rounded-xl border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-500 cursor-not-allowed"
                />
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
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 focus:border-orange-300 focus:outline-none"
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
                className="h-10 rounded-xl bg-[#D9692A] px-4 text-xs font-bold text-white hover:bg-[#B85A24]"
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
        <DialogContent className="max-w-3xl rounded-3xl border-border bg-card p-0 shadow-2xl overflow-hidden text-card-foreground">
          <DialogHeader className="border-b border-border bg-gradient-to-r from-primary/10 via-background to-accent/20 p-6 pb-5">
            <DialogTitle className="text-xl font-extrabold text-foreground">
              {project.title || "Untitled Project"}
            </DialogTitle>
            <DialogDescription className="text-xs font-semibold text-muted-foreground">
              Complete project brief and requirements overview.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 p-6 max-h-[75vh] overflow-y-auto subtle-scrollbar">
            {/* Quick Info Bar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3.5 py-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Client</span>
                <span className="text-xs font-bold text-foreground">{clientProfile.clientName || "Unknown"}</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3.5 py-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Budget</span>
                <span className="text-xs font-bold text-foreground">INR {Number(project.budget || 0).toLocaleString("en-IN")}</span>
              </div>
              {freelancerProfile && (
                <div className="flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3.5 py-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Freelancer</span>
                  <span className="text-xs font-bold text-foreground">{freelancerProfile.freelancerName}</span>
                </div>
              )}
            </div>

            {/* Structured Requirements Sections */}
            {requirementsSections.length > 0 ? (
              <div className="space-y-3.5">
                {requirementsSections.map((section, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-border/60 bg-card shadow-xs overflow-hidden"
                  >
                    <div className="px-4 py-2.5 bg-muted/40 border-b border-border/60 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">
                        {section.title}
                      </h4>
                    </div>
                    <div className="p-4 space-y-3">
                      {section.content && (
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line font-medium">
                          {section.content}
                        </p>
                      )}
                      {section.items.length > 0 && (
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {section.items.map((item, itemIdx) => (
                            <li
                              key={itemIdx}
                              className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-muted/20 px-3 py-2"
                            >
                              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                              <span className="text-xs font-medium text-foreground leading-relaxed">
                                {item}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-5">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground font-medium">
                  {project.description || "No description available."}
                </p>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex flex-wrap justify-end gap-3 pt-1">
              <Button
                variant="outline"
                className="h-10 rounded-xl border-border bg-card px-4 text-xs font-bold text-foreground hover:bg-muted transition-colors"
                onClick={() => {
                  setProjectSummaryOpen(false);
                  handleViewClientProfile();
                }}
              >
                View Client Profile
              </Button>
              <Button
                className="h-10 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
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
        <DialogContent className="max-w-4xl rounded-3xl border-border bg-card p-0 shadow-2xl overflow-hidden text-card-foreground">
          <DialogHeader className="border-b border-border bg-gradient-to-r from-primary/10 via-background to-accent/20 p-6 pb-5">
            <DialogTitle className="text-xl font-extrabold text-foreground">
              Client Profile
            </DialogTitle>
            <DialogDescription className="text-xs font-semibold text-muted-foreground">
              PM-ready snapshot with client details and project requirement brief.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 p-6 max-h-[80vh] overflow-y-auto subtle-scrollbar">
            <div className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3.5 min-w-0">
                <Avatar className="h-12 w-12 rounded-xl border border-primary/20 shrink-0">
                  <AvatarImage src={clientProfile.avatar || ""} />
                  <AvatarFallback className="bg-primary text-sm font-black text-primary-foreground">
                    {(clientProfile.clientName || "Client")
                      .split(" ")
                      .map((part) => part?.[0] || "")
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold text-foreground truncate">
                    {clientProfile.clientName || "Unknown Client"}
                  </p>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-primary truncate">
                    {clientProfile.company || "Direct Client"}
                  </p>
                </div>
              </div>
              <Badge className="w-fit rounded-full bg-primary px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-primary-foreground shrink-0">
                Active Engagement
              </Badge>
            </div>

            <div className="grid gap-4 rounded-2xl border border-border/60 bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                  Client Name
                </p>
                <p className="mt-1 text-xs font-bold text-foreground truncate">
                  {clientProfile.clientName || "Unknown"}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                  Email
                </p>
                <p className="mt-1 text-xs font-semibold text-foreground truncate" title={clientProfile.email}>
                  {clientProfile.email || "Not available"}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                  Company
                </p>
                <p className="mt-1 text-xs font-semibold text-foreground truncate">
                  {clientProfile.company || "Not specified"}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                  Budget
                </p>
                <p className="mt-1 text-xs font-bold text-foreground">
                  INR {Number(project.budget || 0).toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-3">
                Requirements & Project Brief
              </p>
              {requirementsSections.length === 0 ? (
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-5">
                  <p className="text-xs text-foreground leading-relaxed whitespace-pre-line font-medium">
                    {requirementsText || "No requirements shared yet."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[44vh] overflow-y-auto subtle-scrollbar pr-1">
                  {requirementsSections.map((section, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-border/60 bg-card shadow-xs overflow-hidden"
                    >
                      <div className="px-4 py-2.5 bg-muted/40 border-b border-border/60 flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">
                          {section.title}
                        </h4>
                      </div>
                      <div className="p-4 space-y-3">
                        {section.content ? (
                          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line font-medium">
                            {section.content}
                          </p>
                        ) : null}
                        {section.items.length > 0 ? (
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {section.items.map((item, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2.5 text-xs bg-muted/30 p-2.5 rounded-xl border border-border/40"
                              >
                                <span className="text-primary font-black mt-0.5">•</span>
                                <span className="text-foreground leading-relaxed font-medium">
                                  {item}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2.5 border-t border-border/60 pt-4 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                className="h-10 rounded-full border-border bg-background px-5 text-xs font-bold text-foreground hover:bg-accent"
                onClick={() => {
                  setClientProfileOpen(false);
                  setProjectSummaryOpen(true);
                }}
              >
                View Project Overview
              </Button>
              <Button
                className="h-10 rounded-full bg-primary px-5 text-xs font-bold text-primary-foreground hover:opacity-90 shadow-xs"
                onClick={() => {
                  setClientProfileOpen(false);
                  navigate(`/project-manager/projects/${projectId}`);
                }}
              >
                Open Full Project Workspace
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6 pb-1">
         <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-[#D9692A] rounded flex items-center justify-center">
               <span className="text-white text-[10px] font-bold">C</span>
            </div>
            <span className="text-xs text-slate-600">(c) 2024 Catalance Platform. All rights reserved.</span>
         </div>
      </div>
      <SopEditorDialog
        open={sopEditorOpen}
        onOpenChange={setSopEditorOpen}
        project={project}
        currentSop={sopTemplate}
        onSaved={() => details.refresh()}
      />
    </PmShell>
  );
};

export default ProjectDetailsPage;



