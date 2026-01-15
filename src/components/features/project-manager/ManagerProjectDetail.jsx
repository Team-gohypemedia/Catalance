"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
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
import Calendar from "lucide-react/dist/esm/icons/calendar";
import MessageSquare from "lucide-react/dist/esm/icons/message-square";
import Send from "lucide-react/dist/esm/icons/send";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import { SOP_TEMPLATES, getSopFromTitle } from "@/shared/data/sopTemplates";

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
      className={`${
        colors[status] || "bg-gray-500"
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
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchProject();
    fetchMessages();
  }, [projectId]);

  const fetchProject = async () => {
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
  };

  const fetchMessages = async () => {
    try {
      const res = await authFetch(`/chat/projects/${projectId}/messages`);
      const data = await res.json();

      if (res.ok && data?.data) {
        setMessages(data.data.messages || []);
        if (data.data.conversation?.id) {
          setConversationId(data.data.conversation.id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  // Get accepted proposal for freelancer info
  const acceptedProposal = useMemo(() => {
    return project?.proposals?.find((p) => p.status === "ACCEPTED");
  }, [project]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const clientId = project?.ownerId;
      const freelancerId = acceptedProposal?.freelancerId;
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

  const freelancer = acceptedProposal?.freelancer;
  const freelancerPay = acceptedProposal?.amount
    ? Math.round(acceptedProposal.amount * 0.7)
    : project?.budget
    ? Math.round(project.budget * 0.7)
    : 0;

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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDescription(true)}
            >
              <FileText className="h-4 w-4 mr-2" />
              View Description
            </Button>
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
              className={`border shadow-sm backdrop-blur ${
                disputeCount > 0
                  ? "border-red-500/50 bg-red-500/5"
                  : "border-border/60 bg-card/80"
              }`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disputes</CardTitle>
                <AlertTriangle
                  className={`h-4 w-4 ${
                    disputeCount > 0 ? "text-red-500" : "text-muted-foreground"
                  }`}
                />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-semibold ${
                    disputeCount > 0 ? "text-red-500" : ""
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
                                  className={`flex-1 text-sm ${
                                    task.status === "completed"
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
                          className={`p-3 rounded-lg space-y-1 ${
                            msg.senderRole === "PROJECT_MANAGER"
                              ? "bg-primary/10 border border-primary/20 ml-4"
                              : "bg-muted/30 mr-4"
                          }`}
                        >
                          <p
                            className={`text-xs font-medium ${
                              msg.senderRole === "PROJECT_MANAGER"
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
