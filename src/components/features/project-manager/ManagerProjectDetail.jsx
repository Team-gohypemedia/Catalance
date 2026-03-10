"use client";

import React, { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { RoleAwareSidebar } from "@/components/layout/RoleAwareSidebar";
import { ManagerTopBar } from "./ManagerTopBar";
import { useAuth } from "@/shared/context/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import FileText from "lucide-react/dist/esm/icons/file-text";
import User from "lucide-react/dist/esm/icons/user";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import DollarSign from "lucide-react/dist/esm/icons/dollar-sign";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Circle from "lucide-react/dist/esm/icons/circle";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import MessageSquare from "lucide-react/dist/esm/icons/message-square";
import Send from "lucide-react/dist/esm/icons/send";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Settings from "lucide-react/dist/esm/icons/settings";
import Wallet from "lucide-react/dist/esm/icons/wallet";
import { getSopFromTitle } from "@/shared/data/sopTemplates";
import { KanbanBoard } from "./KanbanBoard";
import { FreelancerReassignStepper } from "./FreelancerReassignStepper";

const MAX_FREELANCER_CHANGE_REQUESTS = 2;

const getPhaseIcon = (status) => {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    case "in-progress":
      return <AlertCircle className="w-5 h-5 text-blue-500" />;
    default:
      return <Circle className="w-5 h-5 text-muted-foreground" />;
  }
};

const getStatusBadge = (status) => {
  const colors = {
    DRAFT: "bg-gray-500",
    OPEN: "bg-green-500",
    IN_PROGRESS: "bg-yellow-500",
    AWAITING_PAYMENT: "bg-orange-500",
    COMPLETED: "bg-emerald-500",
  };
  return (
    <Badge
      className={`${colors[status] || "bg-gray-500"
        } text-white text-xs px-2 py-0.5`}
    >
      {status?.replace(/_/g, " ")}
    </Badge>
  );
};

const formatCurrency = (amount) => {
  return `₹${(amount || 0).toLocaleString("en-IN")}`;
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getLatestAssignmentProposal = (project) => {
  const proposals = Array.isArray(project?.proposals) ? project.proposals : [];
  return (
    proposals.find((proposal) => proposal?.status === "ACCEPTED") ||
    proposals.find((proposal) => proposal?.status === "REPLACED") ||
    proposals.find((proposal) => proposal?.status === "REJECTED") ||
    proposals[0] ||
    null
  );
};

const formatTime = (dateString) => {
  return new Date(dateString).toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ManagerProjectDetailContent = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { authFetch, user } = useAuth();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [showDescription, setShowDescription] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // PM Upgrades State
  const [kanbanTasks, setKanbanTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [generatingTasks, setGeneratingTasks] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [escrowReleasing, setEscrowReleasing] = useState(false);
  const [availableFreelancers, setAvailableFreelancers] = useState([]);
  const [loadingFreelancers, setLoadingFreelancers] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      const res = await authFetch(`/projects/${projectId}`);
      const data = await res.json();
      if (data?.data) {
        setProject(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch project:", err);
    } finally {
      setLoading(false);
    }
  }, [authFetch, projectId]);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await authFetch(`/chat/projects/${projectId}/messages`);
      const data = await res.json();

      if (res.ok && data?.data) {
        setMessages(data.data.messages || []);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  }, [authFetch, projectId]);

  const fetchTasks = useCallback(async () => {
    try {
      setTasksLoading(true);
      const res = await authFetch(`/projects/${projectId}/tasks`);
      const data = await res.json();
      if (res.ok && data?.data) {
        setKanbanTasks(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setTasksLoading(false);
    }
  }, [authFetch, projectId]);

  const fetchAvailableFreelancers = useCallback(async () => {
    try {
      setLoadingFreelancers(true);
      const res = await authFetch(
        "/users?role=FREELANCER&status=ACTIVE&onboardingComplete=true"
      );
      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(payload?.message || "Failed to load freelancers");
      }

      const freelancers = Array.isArray(payload?.data) ? payload.data : [];
      setAvailableFreelancers(
        [...freelancers].sort((left, right) =>
          String(left?.fullName || "").localeCompare(
            String(right?.fullName || "")
          )
        )
      );
    } catch (error) {
      console.error("Failed to load freelancers:", error);
      toast.error(error.message || "Failed to load freelancers");
    } finally {
      setLoadingFreelancers(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchProject();
    fetchMessages();
    fetchTasks();
  }, [fetchProject, fetchMessages, fetchTasks]);

  useEffect(() => {
    if (reassignOpen) {
      fetchAvailableFreelancers();
    }
  }, [reassignOpen, fetchAvailableFreelancers]);

  // --- Kanban Handlers ---
  const handleAddTask = async (taskData) => {
    try {
      const res = await authFetch(`/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData)
      });
      if (res.ok) {
        toast.success("Task added");
        fetchTasks();
      } else throw new Error("Failed to add task");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const res = await authFetch(`/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        fetchTasks();
      } else throw new Error("Failed to update task");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    // Optimistic update
    setKanbanTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    await handleUpdateTask(taskId, { status: newStatus });
  };

  const handleGenerateTasks = async () => {
    try {
      setGeneratingTasks(true);
      const res = await authFetch(`/projects/${projectId}/tasks/generate`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data?.data?.length > 0) {
        // Automatically save the generated tasks
        for (const task of data.data) {
          await authFetch(`/projects/${projectId}/tasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(task)
          });
        }
        toast.success(`Generated ${data.data.length} micro-tasks`);
        fetchTasks();
      } else {
        toast.error("Failed to generate tasks");
      }
    } catch (err) {
      toast.error("Error generating tasks: " + err.message);
    } finally {
      setGeneratingTasks(false);
    }
  };

  // --- Escrow Handler ---
  const handleReleaseEscrow = async () => {
    if (!window.confirm("Are you sure you want to approve and release escrow funds to the freelancer?")) return;
    try {
      setEscrowReleasing(true);
      const res = await authFetch(`/projects/${projectId}/escrow/release`, {
        method: "POST"
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Funds released successfully");
      } else {
        toast.error(data.message || "Failed to release funds");
      }
    } catch (err) {
      toast.error("Error releasing funds: " + err.message);
    } finally {
      setEscrowReleasing(false);
    }
  };

  // --- Reassignment Handlers ---
  const handlePauseProject = async () => {
    const res = await authFetch(`/projects/${projectId}/pause`, {
      method: "POST",
    });
    const payload = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(payload?.message || "Failed to pause project");
    }

    if (payload?.data) {
      setProject(payload.data);
      return;
    }

    await fetchProject();
  };

  const handleRemoveFreelancer = async () => {
    const res = await authFetch(`/projects/${projectId}/remove-freelancer`, {
      method: "POST",
    });
    const payload = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(payload?.message || "Failed to remove freelancer");
    }

    await fetchProject();
  };

  const handleAssignReplacement = async (freelancerId) => {
    const res = await authFetch(`/projects/${projectId}/reassign-freelancer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newFreelancerId: freelancerId }),
    });
    const payload = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(payload?.message || "Failed to assign freelancer");
    }

    if (payload?.data) {
      setProject(payload.data);
    } else {
      await fetchProject();
    }

    toast.success(payload?.message || "Replacement freelancer assigned");
  };

  const assignmentProposal = useMemo(
    () => getLatestAssignmentProposal(project),
    [project]
  );

  const freelancerChangeRequests = useMemo(
    () =>
      Array.isArray(project?.freelancerChangeRequests)
        ? project.freelancerChangeRequests
        : [],
    [project?.freelancerChangeRequests]
  );

  const pendingFreelancerChangeRequest = useMemo(
    () =>
      [...freelancerChangeRequests]
        .reverse()
        .find(
          (request) =>
            String(request?.status || "").toUpperCase() === "PENDING"
        ) || null,
    [freelancerChangeRequests]
  );

  const latestFreelancerChangeRequest = useMemo(
    () =>
      freelancerChangeRequests.length > 0
        ? freelancerChangeRequests[freelancerChangeRequests.length - 1]
        : null,
    [freelancerChangeRequests]
  );

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const clientId = project?.ownerId;
      const freelancerId = assignmentProposal?.freelancerId;
      const serviceKey =
        clientId && freelancerId
          ? `CHAT:${projectId}:${clientId}:${freelancerId}`
          : null;

      const res = await authFetch("/chat/conversations/new/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newMessage.trim(),
          service: serviceKey,
          projectTitle: project?.title,
          senderId: user?.id,
          senderRole: "PROJECT_MANAGER",
          senderName: "Catalyst",
          skipAssistant: true,
        }),
      });

      if (res.ok) {
        setNewMessage("");
        await fetchMessages();
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      } else {
        toast.error("Failed to send message");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("Error sending message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const freelancer = assignmentProposal?.freelancer;
  const freelancerPay = assignmentProposal?.amount
    ? Math.round(assignmentProposal.amount * 0.7)
    : project?.budget
      ? Math.round(project.budget * 0.7)
      : 0;
  const freelancerChangeCount = Number(project?.freelancerChangeCount || 0);

  // Determine SOP based on project title
  const activeSOP = useMemo(() => {
    return getSopFromTitle(project?.title);
  }, [project]);

  // Derive phases based on progress
  const overallProgress = project?.progress || 0;
  const derivedPhases = useMemo(() => {
    const phases = activeSOP.phases;
    const step = 100 / phases.length;
    return phases.map((phase, index) => {
      const phaseValue = Math.max(
        0,
        Math.min(step, overallProgress - index * step)
      );
      const normalized = Math.round((phaseValue / step) * 100);
      let status = "pending";
      if (normalized >= 100) status = "completed";
      else if (normalized > 0) status = "in-progress";
      return { ...phase, status, progress: normalized, index };
    });
  }, [overallProgress, activeSOP]);

  const completedPhases = derivedPhases.filter(
    (p) => p.status === "completed"
  ).length;

  // Derive tasks
  const derivedTasks = useMemo(() => {
    return activeSOP.tasks.map((task) => {
      const uniqueKey = `${task.phase}-${task.id}`;
      const taskPhase = derivedPhases.find((p) => p.id === task.phase);
      const phaseStatus = taskPhase?.status || task.status;
      if (phaseStatus === "completed")
        return {
          ...task,
          uniqueKey,
          status: "completed",
          phaseName: taskPhase?.name,
        };
      if (phaseStatus === "in-progress" && task.status === "completed")
        return { ...task, uniqueKey, phaseName: taskPhase?.name };
      return {
        ...task,
        uniqueKey,
        status: phaseStatus === "in-progress" ? "in-progress" : "pending",
        phaseName: taskPhase?.name,
      };
    });
  }, [derivedPhases, activeSOP]);

  // Group tasks by phase
  const tasksByPhase = useMemo(() => {
    const grouped = {};
    derivedTasks.forEach((task) => {
      if (!grouped[task.phase]) {
        const phase = derivedPhases.find((p) => p.id === task.phase);
        grouped[task.phase] = {
          phaseId: task.phase,
          phaseName: phase?.name || `Phase ${task.phase}`,
          phaseStatus: phase?.status || "pending",
          tasks: [],
        };
      }
      grouped[task.phase].tasks.push(task);
    });
    return Object.values(grouped);
  }, [derivedTasks, derivedPhases]);

  const effectiveStatus =
    project?.progress && Number(project.progress) >= 100
      ? "COMPLETED"
      : project?.status;
  const disputeCount = project?.disputes?.length || 0;

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen w-full">
        <ManagerTopBar />
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-12 w-96" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen w-full">
      <ManagerTopBar />
      <div className="min-h-screen bg-background text-foreground p-6 md:p-8 w-full">
        <div className="w-full max-w-full mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/project-manager/projects")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>

          {/* Title and Status */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight">
                  {project?.title}
                </h1>
                {getStatusBadge(effectiveStatus)}
              </div>
              <p className="text-sm text-muted-foreground">
                Created on {formatDate(project?.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReassignOpen(true)}
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <Settings className="h-4 w-4 mr-2" />
                {pendingFreelancerChangeRequest
                  ? "Resolve Change Request"
                  : "Reassign Freelancer"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDescription(true)}
              >
                <FileText className="h-4 w-4 mr-2" />
                View Description
              </Button>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border border-border/60 bg-card/80 shadow-sm backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Overall Progress
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">
                  {Math.round(overallProgress)}%
                </div>
                <Progress value={overallProgress} className="mt-3 h-2" />
              </CardContent>
            </Card>

            <Card className="border border-border/60 bg-card/80 shadow-sm backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Completed Phases
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">
                  {completedPhases}/{activeSOP.phases.length}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  phases completed
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border/60 bg-card/80 shadow-sm backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Client Budget
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">
                  {formatCurrency(project?.budget)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Freelancer:{" "}
                  <span className="text-emerald-500">
                    {formatCurrency(freelancerPay)}
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card
              className={`border shadow-sm backdrop-blur ${disputeCount > 0
                ? "border-red-500/50 bg-red-500/5"
                : "border-border/60 bg-card/80"
                }`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disputes</CardTitle>
                <AlertTriangle
                  className={`h-4 w-4 ${disputeCount > 0 ? "text-red-500" : "text-muted-foreground"
                    }`}
                />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-semibold ${disputeCount > 0 ? "text-red-500" : ""
                    }`}
                >
                  {disputeCount}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {disputeCount > 0 ? "active" : "no issues"}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">

              {/* Kanban Task Board (NEW) */}
              <Card className="border border-border/60 bg-card/80 shadow-sm backdrop-blur">
                <CardContent className="p-4 md:p-6">
                  <KanbanBoard
                    tasks={kanbanTasks}
                    loading={tasksLoading}
                    onAddTask={handleAddTask}
                    onUpdateTask={handleUpdateTask}
                    onStatusChange={handleStatusChange}
                    onGenerateTasks={handleGenerateTasks}
                    generatingTasks={generatingTasks}
                  />
                </CardContent>
              </Card>

              {/* Project Phases */}
              <Card className="border border-border/60 bg-card/80 shadow-sm backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Project Phases</CardTitle>
                  <CardDescription>
                    Monitor each phase of the project
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {derivedPhases.map((phase) => (
                    <div
                      key={phase.id}
                      className="flex items-start gap-3 pb-3 border-b border-border/60 last:border-0 last:pb-0 p-2 rounded"
                    >
                      <div className="mt-1">{getPhaseIcon(phase.status)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-sm">
                            {phase.name}
                          </h3>
                          <Badge
                            variant={
                              phase.status === "completed"
                                ? "default"
                                : "outline"
                            }
                            className={
                              phase.status === "completed"
                                ? "bg-emerald-500 text-white"
                                : ""
                            }
                          >
                            {phase.status === "in-progress"
                              ? "In Progress"
                              : phase.status === "completed"
                                ? "Completed"
                                : "Pending"}
                          </Badge>
                        </div>
                        <Progress value={phase.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {phase.progress}% complete
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Project Tasks */}
              <Card className="border border-border/60 bg-card/80 shadow-sm backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Project Tasks</CardTitle>
                  <CardDescription>
                    {
                      derivedTasks.filter((t) => t.status === "completed")
                        .length
                    }{" "}
                    of {derivedTasks.length} tasks completed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {tasksByPhase.map((phaseGroup) => (
                      <AccordionItem
                        key={phaseGroup.phaseId}
                        value={phaseGroup.phaseId}
                        className="border-border/60"
                      >
                        <AccordionTrigger className="hover:no-underline py-3">
                          <div className="flex items-center gap-3 flex-1">
                            {getPhaseIcon(phaseGroup.phaseStatus)}
                            <div className="flex-1 text-left">
                              <div className="font-semibold text-sm">
                                {phaseGroup.phaseName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {
                                  phaseGroup.tasks.filter(
                                    (t) => t.status === "completed"
                                  ).length
                                }{" "}
                                of {phaseGroup.tasks.length} completed
                              </div>
                            </div>
                            <Badge
                              variant={
                                phaseGroup.phaseStatus === "completed"
                                  ? "default"
                                  : "outline"
                              }
                              className={
                                phaseGroup.phaseStatus === "completed"
                                  ? "bg-emerald-500 text-white"
                                  : ""
                              }
                            >
                              {phaseGroup.phaseStatus === "completed"
                                ? "Completed"
                                : phaseGroup.phaseStatus === "in-progress"
                                  ? "In Progress"
                                  : "Pending"}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pt-2">
                            {phaseGroup.tasks.map((task) => (
                              <div
                                key={task.uniqueKey}
                                className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-card hover:bg-accent/60 transition-colors"
                              >
                                {task.status === "completed" ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                ) : (
                                  <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                )}
                                <span
                                  className={`flex-1 text-sm ${task.status === "completed"
                                    ? "line-through text-muted-foreground"
                                    : ""
                                    }`}
                                >
                                  {task.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {(pendingFreelancerChangeRequest || freelancerChangeCount > 0) && (
                <Card className="border border-border/60 bg-card/80 shadow-sm backdrop-blur">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      Freelancer Change
                    </CardTitle>
                    <CardDescription>
                      {pendingFreelancerChangeRequest
                        ? "The client has requested a replacement freelancer."
                        : `${freelancerChangeCount}/${MAX_FREELANCER_CHANGE_REQUESTS} change requests have been used on this project.`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Requests Used
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {freelancerChangeCount}/{MAX_FREELANCER_CHANGE_REQUESTS}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          pendingFreelancerChangeRequest
                            ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                            : "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                        }
                      >
                        {pendingFreelancerChangeRequest ? "Pending" : "Resolved"}
                      </Badge>
                    </div>

                    {pendingFreelancerChangeRequest ? (
                      <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-400">
                          Client Reason
                        </p>
                        <p className="mt-2 text-sm text-foreground">
                          {pendingFreelancerChangeRequest.reason}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Request {pendingFreelancerChangeRequest.requestNumber || 1} of{" "}
                          {MAX_FREELANCER_CHANGE_REQUESTS}
                        </p>
                        {pendingFreelancerChangeRequest.previousFreelancerName && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Current freelancer:{" "}
                            {pendingFreelancerChangeRequest.previousFreelancerName}
                          </p>
                        )}
                      </div>
                    ) : latestFreelancerChangeRequest ? (
                      <div className="rounded-lg border border-border/60 bg-background/30 p-3 text-sm text-muted-foreground">
                        Last request {latestFreelancerChangeRequest.requestNumber || freelancerChangeCount}{" "}
                        was completed
                        {latestFreelancerChangeRequest.replacementFreelancerName
                          ? ` and reassigned to ${latestFreelancerChangeRequest.replacementFreelancerName}.`
                          : "."}
                      </div>
                    ) : null}

                    <Button
                      variant={pendingFreelancerChangeRequest ? "default" : "outline"}
                      className="w-full"
                      onClick={() => setReassignOpen(true)}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      {pendingFreelancerChangeRequest
                        ? "Process Request"
                        : "Open Reassignment Flow"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Communication Log */}
              <Card className="flex flex-col h-96 border border-border/60 bg-card/80 shadow-sm backdrop-blur">
                <CardHeader className="border-b border-border/60 pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Project Chat
                  </CardTitle>
                  <CardDescription>
                    Chat with Client & Freelancer
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto space-y-3 py-4">
                  {messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No messages yet. Start the conversation!
                    </p>
                  ) : (
                    <>
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-3 rounded-lg space-y-1 ${msg.senderRole === "PROJECT_MANAGER"
                            ? "bg-primary/10 border border-primary/20 ml-4"
                            : "bg-muted/30 mr-4"
                            }`}
                        >
                          <p
                            className={`text-xs font-medium ${msg.senderRole === "PROJECT_MANAGER"
                              ? "text-primary"
                              : "text-muted-foreground"
                              }`}
                          >
                            {msg.senderName || "User"}
                          </p>
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-[10px] text-muted-foreground text-right">
                            {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </CardContent>
                <div className="flex gap-2 p-3 border-t border-border/60">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={sending}
                    className="flex-1 text-sm"
                  />
                  <Button
                    size="icon"
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </Card>

              {/* Client Info */}
              <Card className="border border-border/60 bg-card/80 shadow-sm backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-500" />
                    Client
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-blue-500 text-white">
                        {project?.owner?.fullName?.charAt(0) || "C"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {project?.owner?.fullName || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {project?.owner?.email}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Freelancer Info */}
              {freelancer && (
                <Card className="border border-border/60 bg-card/80 shadow-sm backdrop-blur">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-emerald-500" />
                      Freelancer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-emerald-500 text-white">
                          {freelancer.fullName?.charAt(0) || "F"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{freelancer.fullName}</p>
                        <p className="text-xs text-muted-foreground">
                          {freelancer.email}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Escrow Controls */}
              <Card className="border border-green-500/30 bg-green-500/5 shadow-sm backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-green-700 dark:text-green-400">
                    <Wallet className="h-5 w-5" />
                    Escrow & Payout
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Review completed milestones and release funds to the freelancer securely. Only release funds when work passes verification.
                  </p>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleReleaseEscrow}
                    disabled={escrowReleasing || !freelancer}
                  >
                    {escrowReleasing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Approve & Release Funds
                  </Button>
                </CardContent>
              </Card>

            </div>
          </div>

          {/* Description Dialog */}
          <Dialog open={showDescription} onOpenChange={setShowDescription}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Project Description</DialogTitle>
              </DialogHeader>
              <DialogDescription className="text-foreground whitespace-pre-wrap">
                {project?.description || "No description provided."}
              </DialogDescription>
            </DialogContent>
          </Dialog>

          {/* Freelancer Reassign Stepper */}
          <FreelancerReassignStepper
            open={reassignOpen}
            onOpenChange={setReassignOpen}
            onPauseProject={handlePauseProject}
            onRemoveFreelancer={handleRemoveFreelancer}
            onAssignReplacement={handleAssignReplacement}
            currentFreelancer={freelancer}
            freelancers={availableFreelancers}
            loadingFreelancers={loadingFreelancers}
            requestContext={
              pendingFreelancerChangeRequest
                ? {
                    reason: pendingFreelancerChangeRequest.reason,
                    requestNumber: pendingFreelancerChangeRequest.requestNumber,
                    maxRequests: MAX_FREELANCER_CHANGE_REQUESTS,
                  }
                : null
            }
          />
        </div>
      </div>
    </div>
  );
};

const ManagerProjectDetail = () => (
  <RoleAwareSidebar>
    <ManagerProjectDetailContent />
  </RoleAwareSidebar>
);

export default ManagerProjectDetail;
