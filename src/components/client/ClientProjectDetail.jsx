"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  Calendar as CalendarIcon,
  Link2,
  Info,
  Headset,
  Mail,
  Phone,
  IndianRupee,
  Send,
  Upload,
  FileText,
  Check,
  CheckCheck,
  ExternalLink,
} from "lucide-react";
import { ProjectNotepad } from "@/components/ui/notepad";
import BookAppointment from "@/components/appointments/BookAppointment";
import { Input } from "@/components/ui/input";
import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";
import { ClientTopBar } from "@/components/client/ClientTopBar";
import { SOP_TEMPLATES } from "@/data/sopTemplates";
import { useAuth } from "@/context/AuthContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Skeleton Loading Component
const ProjectDetailSkeleton = () => (
  <div className="min-h-screen bg-background text-foreground p-6 md:p-8 w-full">
    <div className="w-full max-w-full mx-auto space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-3" />
            <Skeleton className="h-2 w-full" />
          </CardContent>
        </Card>
        <Card className="border border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12 mb-2" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Phases Card Skeleton */}
          <Card className="border border-border/60 bg-card/80">
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 pb-3 border-b border-border/60 last:border-0"
                >
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Tasks Card Skeleton */}
          <Card className="border border-border/60 bg-card/80">
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-36" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/60"
                >
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-7 w-16 rounded" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Skeleton */}
        <div className="space-y-4">
          <Card className="border border-border/60 bg-card/80">
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
          <Card className="border border-border/60 bg-card/80">
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
          <Card className="border border-border/60 bg-card/80 h-96">
            <CardHeader>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-40" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-10 w-2/3 ml-auto" />
              <Skeleton className="h-10 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
);

const initialMessages = [];

const getPhaseIcon = (status) => {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    case "in-progress":
      return <AlertCircle className="w-5 h-5 text-blue-600" />;
    default:
      return <Circle className="w-5 h-5 text-gray-400" />;
  }
};

const getStatusBadge = (status) => {
  const variants = {
    completed: "default",
    "in-progress": "secondary",
    pending: "outline",
  };
  return variants[status] || "outline";
};

const mapStatus = (status = "") => {
  const normalized = status.toString().toUpperCase();
  if (normalized === "COMPLETED") return "completed";
  if (normalized === "IN_PROGRESS" || normalized === "OPEN")
    return "in-progress";
  return "pending";
};

const FreelancerInfoCard = ({ freelancer }) => {
  if (!freelancer) return null;

  return (
    <Card className="border border-border/60 bg-card/80 shadow-sm backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Freelancer Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-border">
            <AvatarImage src={freelancer.avatar} alt={freelancer.fullName} />
            <AvatarFallback>
              {(freelancer.fullName || "F").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base text-foreground">
                {freelancer.fullName || "Freelancer Name"}
              </span>
              {freelancer.isVerified && (
                <CheckCircle2
                  className="w-4 h-4 text-blue-500"
                  fill="currentColor"
                  stroke="white"
                />
              )}
            </div>
            {freelancer.jobTitle && (
              <span className="text-sm text-muted-foreground">
                {freelancer.jobTitle}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const FreelancerAboutCard = ({ freelancer, project }) => {
  if (!freelancer) return null;
  const projectLink = project?.externalLink || "";

  return (
    <div className="space-y-4 pt-2">
      <h3 className="font-bold text-base text-foreground">About</h3>

      <div className="space-y-4">
        {projectLink ? (
          <a
            href={projectLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-blue-500 hover:underline group"
          >
            <div className="w-5 flex justify-center">
              <Link2 className="w-4 h-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
            </div>
            <span className="truncate">Project Link</span>
          </a>
        ) : (
          <div className="text-sm text-muted-foreground italic">
            No project link
          </div>
        )}

        {/* Project Summary - parsed from description */}
        {(() => {
          const desc = (project?.description || "").trim();
          const summaryMatch = desc.match(
            /Summary[:\s]+(.+?)(?=(?:\r?\n\s*(?:Pages & Features|Core pages|Deliverables|Budget|Next Steps|Integrations|Designs|Hosting|Domain|Timeline)[:\s])|$)/is
          );
          const summary = summaryMatch
            ? summaryMatch[1]
                .replace(/^[\s-]+/, "")
                .replace(/[\s-]+$/, "")
                .trim()
            : null;
          return summary ? (
            <div className="pt-2 border-t border-border/40">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                Project Summary
              </span>
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {summary}
              </p>
            </div>
          ) : null;
        })()}
      </div>
    </div>
  );
};

const ProjectDashboard = () => {
  const { projectId } = useParams();
  const { authFetch, isAuthenticated, user } = useAuth();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [completedTaskIds, setCompletedTaskIds] = useState(new Set());
  const [verifiedTaskIds, setVerifiedTaskIds] = useState(new Set());
  const fileInputRef = useRef(null);

  // Dispute Report State
  const [reportOpen, setReportOpen] = useState(false);
  const [issueText, setIssueText] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [date, setDate] = useState();
  const [time, setTime] = useState("");

  const [serverAvailableSlots, setServerAvailableSlots] = useState([]);

  useEffect(() => {
    if (!date || !authFetch) return;

    const fetchAvailability = async () => {
      try {
        const res = await authFetch(
          `/disputes/availability?date=${date.toISOString()}`
        );
        if (res.ok) {
          const payload = await res.json();
          setServerAvailableSlots(payload.data || []);
        }
      } catch (e) {
        console.error("Failed to fetch availability", e);
      }
    };
    fetchAvailability();
  }, [date, authFetch]);

  // Filter time slots based on selected date
  const availableTimeSlots = useMemo(() => {
    if (!date) return [];

    // The backend now returns explicitly available slots as strings ["09:00 AM", ...]
    let slots = [...serverAvailableSlots];

    // 1. Filter past times if today
    const isToday = new Date().toDateString() === date.toDateString();
    const now = new Date();
    const currentHour = now.getHours();

    if (isToday) {
      slots = slots.filter((slot) => {
        const [time, period] = slot.split(" ");
        let [hours, minutes] = time.split(":").map(Number);
        if (period === "PM" && hours !== 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;
        return hours > currentHour;
      });
    }

    return slots;
  }, [date, serverAvailableSlots]);

  // Book Appointment State
  const [bookAppointmentOpen, setBookAppointmentOpen] = useState(false);

  // Verify Confirmation State
  const [verifyConfirmOpen, setVerifyConfirmOpen] = useState(false);
  const [pendingVerifyTask, setPendingVerifyTask] = useState(null); // { uniqueKey, title, isVerified }

  const renderProjectDescription = (options = {}) => {
    const { showExtended = false } = options;
    if (!project?.description) {
      return (
        <p className="text-sm text-muted-foreground">
          No project description available.
        </p>
      );
    }

    const desc = project.description;
    const fieldNames = [
      "Service",
      "Project",
      "Client",
      "Website type",
      "Tech stack",
      "Pages",
      "Timeline",
      "Budget",
      "Next Steps",
      "Summary",
      "Deliverables",
      "Pages & Features",
      "Core pages",
      "Additional pages",
      "Integrations",
      "Payment Gateway",
      "Designs",
      "Hosting",
      "Domain",
      "Deployment",
    ];
    const fieldPattern = fieldNames.join("|");
    const extractField = (fieldName) => {
      const regex = new RegExp(
        `${fieldName}[:\\s]+(.+?)(?=(?:${fieldPattern})[:\\s]|$)`,
        "is"
      );
      const match = desc.match(regex);
      if (match) {
        return match[1]
          .replace(/^[\s-]+/, "")
          .replace(/[\s-]+$/, "")
          .trim();
      }
      return null;
    };

    const service = extractField("Service");
    const projectName = extractField("Project");
    const client = extractField("Client");
    const websiteType = extractField("Website type");
    const techStack = extractField("Tech stack");
    const timeline = extractField("Timeline");
    const budget = extractField("Budget");
    const hosting = extractField("Hosting");
    const domain = extractField("Domain");
    const integrations = extractField("Integrations");
    const deployment = extractField("Deployment");

    const summaryMatch = desc.match(
      /Summary[:\s]+(.+?)(?=(?:\r?\n\s*(?:Pages & Features|Core pages|Deliverables|Budget|Next Steps|Integrations|Designs|Hosting|Domain|Timeline)[:\s])|$)/is
    );
    const summary = summaryMatch
      ? summaryMatch[1]
          .replace(/^[\s-]+/, "")
          .replace(/[\s-]+$/, "")
          .trim()
      : null;

    const deliverables = [];
    const delivMatch = desc.match(/Deliverables[:\s-]+([^-]+)/i);
    if (delivMatch) {
      const items = delivMatch[1].split(/[,•]/);
      items.forEach((item) => {
        const trimmed = item.trim();
        if (trimmed && trimmed.length > 3) {
          deliverables.push(trimmed);
        }
      });
    }

    const fields = [
      { label: "Service", value: service },
      { label: "Project", value: projectName },
      { label: "Client", value: client },
      { label: "Website Type", value: websiteType },
      { label: "Tech Stack", value: techStack },
      { label: "Timeline", value: timeline },
      ...(showExtended
        ? [
            { label: "Budget", value: budget },
            { label: "Hosting", value: hosting },
            { label: "Domain", value: domain },
            { label: "Integrations", value: integrations },
            { label: "Deployment", value: deployment },
          ]
        : []),
    ].filter((f) => f.value);

    const corePages =
      extractField("Core pages included") || extractField("Core pages");
    const additionalPages =
      extractField("Additional pages\\/features") ||
      extractField("Additional pages");

    const parsePagesString = (str) => {
      if (!str) return [];
      return str
        .split(/[,]/)
        .map((p) =>
          p
            .replace(/^[\s-]+/, "")
            .replace(/[\s-]+$/, "")
            .trim()
        )
        .filter(
          (p) =>
            p.length > 2 &&
            !p.includes(":") &&
            !p.toLowerCase().includes("additional") &&
            !p.toLowerCase().includes("pages")
        );
    };

    const corePagesArr = parsePagesString(corePages);
    const additionalPagesArr = parsePagesString(additionalPages);

    return (
      <>
        <div className="space-y-4">
          {fields.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {fields.map((field, index) => (
                <div key={index} className="text-sm">
                  <span className="text-muted-foreground">{field.label}: </span>
                  <span className="text-foreground font-medium">
                    {field.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {summary && (
            <div className="pt-2">
              <p className="text-sm text-muted-foreground font-medium mb-1">
                Summary
              </p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {summary}
              </p>
            </div>
          )}

          {(corePagesArr.length > 0 || additionalPagesArr.length > 0) && (
            <div className="pt-2">
              <p className="text-sm text-muted-foreground font-medium mb-3">
                Pages & Features
              </p>
              <div className="space-y-4">
                {corePagesArr.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Core Pages:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {corePagesArr.map((page, index) => (
                        <div
                          key={index}
                          className="text-xs bg-muted px-2 py-1.5 rounded-md text-foreground text-center truncate"
                          title={page}
                        >
                          {page}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {additionalPagesArr.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Additional Pages/Features:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {additionalPagesArr.map((page, index) => (
                        <div
                          key={index}
                          className="text-xs bg-primary/10 px-2 py-1.5 rounded-md text-foreground text-center truncate"
                          title={page}
                        >
                          {page}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {deliverables.length > 0 && (
            <div className="pt-2">
              <p className="text-sm text-muted-foreground font-medium mb-2">
                Deliverables
              </p>
              <ul className="space-y-1.5">
                {deliverables.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-foreground"
                  >
                    <span className="text-primary mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {fields.length === 0 && !summary && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {desc}
            </p>
          )}
        </div>

        {project?.notes && (
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <span className="font-medium">Note:</span> {project.notes}
              </p>
            </div>
          </div>
        )}
      </>
    );
  };

  const handleReport = async () => {
    if (!issueText.trim()) {
      toast.error("Please describe the issue");
      return;
    }

    let fullDescription = issueText;
    let meetingDateIso = undefined;

    if (date) {
      fullDescription += `\n\nDate of Issue: ${format(date, "PPP")}`;

      // Combine date + time for structural saving
      const combined = new Date(date);
      if (time) {
        fullDescription += `\nTime: ${time}`;
        const [timeStr, period] = time.split(" ");
        let [hours, minutes] = timeStr.split(":").map(Number);
        if (period === "PM" && hours !== 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;
        combined.setHours(hours, minutes, 0, 0);
      } else {
        combined.setHours(9, 0, 0, 0); // Default to 9 AM if no time?? Or just omit time?
      }
      meetingDateIso = combined.toISOString();
    }

    setIsReporting(true);
    try {
      const res = await authFetch("/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: fullDescription,
          projectId: project?.id || projectId,
          meetingDate: meetingDateIso,
        }),
      });
      if (res.ok) {
        toast.success(
          "Dispute raised. A Project Manager will review it shortly."
        );
        setReportOpen(false);
        setIssueText("");
        setDate(undefined);
        setTime("");
      } else {
        toast.error("Failed to raise dispute");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error raising dispute");
    } finally {
      setIsReporting(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    let active = true;
    const fetchProject = async () => {
      setIsLoading(true);
      try {
        const response = await authFetch(`/projects/${projectId}`);
        const payload = await response.json().catch(() => null);
        const data = payload?.data || null;

        if (active && data) {
          setProject(data);
          // Load saved task progress from database
          if (Array.isArray(data.completedTasks)) {
            setCompletedTaskIds(new Set(data.completedTasks));
          }
          if (Array.isArray(data.verifiedTasks)) {
            setVerifiedTaskIds(new Set(data.verifiedTasks));
          }
        }
      } catch (error) {
        console.error("Failed to load project detail:", error);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchProject();
    return () => {
      active = false;
    };
  }, [authFetch, isAuthenticated, projectId]);

  const updateProjectProgress = async (
    newProgress,
    completedArr,
    verifiedArr,
    notificationMeta = null
  ) => {
    if (!project?.id) return;

    // Optimistic update
    setProject((prev) => ({ ...prev, progress: newProgress }));

    try {
      const payload = {
        progress: newProgress,
        completedTasks: completedArr,
        verifiedTasks: verifiedArr,
      };

      if (notificationMeta) {
        payload.notificationMeta = notificationMeta;
      }

      await authFetch(`/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("Failed to update project progress:", error);
    }
  };

  // Chat & Conversation Logic
  const [conversationId, setConversationId] = useState(null);
  const [isSending, setIsSending] = useState(false);

  // 1. Ensure Conversation Exists
  useEffect(() => {
    if (!project?.id || !authFetch) return;

    let key = `project:${project.id}`;
    // Check for accepted proposal to sync with DM chat
    const acceptedProposal = project.proposals?.find(
      (p) => p.status === "ACCEPTED"
    );

    console.log(
      "Chat Init - Project:",
      project?.id,
      "User:",
      user?.id,
      "Owner:",
      project?.ownerId
    );

    // Logic matches ClientChat.jsx: CHAT:PROJECT_ID:CLIENT_ID:FREELANCER_ID
    if (acceptedProposal && user?.id && acceptedProposal.freelancerId) {
      key = `CHAT:${project.id}:${user.id}:${acceptedProposal.freelancerId}`;
      console.log("Using Project-Based Chat Key (User):", key);
    } else if (
      acceptedProposal &&
      project.ownerId &&
      acceptedProposal.freelancerId
    ) {
      // Fallback to ownerId if user isn't loaded yet (though auth should prevent this)
      key = `CHAT:${project.id}:${project.ownerId}:${acceptedProposal.freelancerId}`;
      console.log("Using Project-Based Chat Key (Owner Fallback):", key);
    } else {
      console.log("Using Project Chat Key (Fallback):", key);
    }

    const initChat = async () => {
      try {
        const res = await authFetch("/chat/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service: key,
            projectTitle: project?.title || "Project Chat",
          }),
        });
        const payload = await res.json().catch(() => null);
        const convo = payload?.data || payload;
        if (convo?.id) setConversationId(convo.id);
      } catch (e) {
        console.error("Chat init error:", e);
      }
    };
    initChat();
  }, [project, authFetch, user]);

  // 2. Fetch Messages
  useEffect(() => {
    if (!conversationId || !authFetch) return;
    const fetchMessages = async () => {
      try {
        const res = await authFetch(
          `/chat/conversations/${conversationId}/messages`
        );
        const payload = await res.json().catch(() => null);
        const msgs = payload?.data?.messages || [];

        const mapped = msgs.map((m) => {
          const isMe =
            (user?.id && m.senderId === user.id) || m.senderRole === "CLIENT";
          return {
            id: m.id,
            sender:
              m.role === "assistant" ? "assistant" : isMe ? "user" : "other",
            text: m.content,
            timestamp: new Date(m.createdAt),
            createdAt: m.createdAt, // Needed for date logic
            readAt: m.readAt, // Needed for receipts
            attachment: m.attachment, // { name, size, type, url? }
            senderName: m.senderName,
          };
        });
        // Merge logic: Use backend data but preserve local pending messages if not yet in backend
        setMessages((prev) => {
          const pending = prev.filter((m) => m.pending);
          // Dedupe based on signature (sender + text + attachment name) as ID changes
          const backendSignatures = new Set(
            mapped.map(
              (m) => `${m.sender}:${m.text}:${m.attachment?.name || ""}`
            )
          );

          const stillPending = pending.filter((p) => {
            const signature = `${p.sender}:${p.text}:${
              p.attachment?.name || ""
            }`;
            return !backendSignatures.has(signature);
          });
          return [...mapped, ...stillPending];
        });
      } catch (e) {
        console.error("Fetch messages error:", e);
      }
    };
    fetchMessages();
    // Poll every 5s for new messages (simple real-time)
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [conversationId, authFetch]);

  const handleSendMessage = async () => {
    if (!input.trim() || !conversationId) return;

    const tempId = Date.now().toString();
    const userMessage = {
      id: tempId,
      sender: "user",
      text: input,
      timestamp: new Date(),
      pending: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      // Build the correct service key for notifications
      const acceptedProposal = project?.proposals?.find(
        (p) => p.status === "ACCEPTED"
      );
      let serviceKey = `project:${project?.id || projectId}`;
      if (acceptedProposal && user?.id && acceptedProposal.freelancerId) {
        serviceKey = `CHAT:${project?.id || projectId}:${user.id}:${
          acceptedProposal.freelancerId
        }`;
      }

      await authFetch(`/chat/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: userMessage.text,
          service: serviceKey,
          senderRole: "CLIENT",
          senderName: user?.fullName || user?.name || user?.email || "Client",
          skipAssistant: true, // Force persistence to DB
        }),
      });
      // Optionally refetch or let poller handle it.
      // The API returns the assistant response too, we could append it immediately.
    } catch (error) {
      console.error("Send message error:", error);
      // setMessages(prev => prev.filter(m => m.id !== tempId)); // Revert on fail?
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file && conversationId) {
      // Capture current input text to send with file
      const textContent = input;

      setIsSending(true);

      // First upload the file to R2
      const formData = new FormData();
      formData.append("file", file);

      try {
        const uploadResponse = await authFetch("/upload/chat", {
          method: "POST",
          body: formData,
          skipLogoutOn401: true,
        });

        if (!uploadResponse.ok) {
          throw new Error("Upload failed");
        }

        const uploadResult = await uploadResponse.json();
        const fileUrl = uploadResult.data?.url || uploadResult.url;

        const attachment = {
          name: file.name,
          size: file.size,
          type: file.type,
          url: fileUrl,
        };

        const tempId = Date.now().toString();
        const userMessage = {
          id: tempId,
          sender: "user",
          text: textContent,
          timestamp: new Date(),
          attachment,
          pending: true,
        };

        // Optimistic update
        setMessages((prev) => [...prev, userMessage]);

        // Clear input immediately
        setInput("");

        // Build the correct service key for notifications
        const acceptedProposal = project?.proposals?.find(
          (p) => p.status === "ACCEPTED"
        );
        let serviceKey = `project:${project?.id || projectId}`;
        if (acceptedProposal && user?.id && acceptedProposal.freelancerId) {
          serviceKey = `CHAT:${project?.id || projectId}:${user.id}:${
            acceptedProposal.freelancerId
          }`;
        }

        await authFetch(`/chat/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: textContent,
            service: serviceKey,
            senderRole: "CLIENT",
            senderName: user?.fullName || user?.name || user?.email || "Client",
            attachment, // Send attachment metadata with URL
            skipAssistant: true,
          }),
        });

        toast.success("File sent successfully");
        fetchMessages(); // Sync with backend
      } catch (err) {
        console.error("Upload error:", err);
        toast.error("Failed to send file");
        // Optional: Remove optimistic message here if desired
      } finally {
        setIsSending(false);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const docs = useMemo(() => {
    return messages.filter((m) => m.attachment).map((m) => m.attachment);
  }, [messages]);

  // ... (SOP and Progress logic remains same) ...

  // Budget - use actual project budget, default to 0 if not set
  const totalBudget = useMemo(() => {
    if (project?.budget !== undefined && project?.budget !== null) {
      const value = Number(project.budget);
      if (Number.isFinite(value)) return Math.max(0, value);
    }
    return 0;
  }, [project]);

  const spentBudget = useMemo(() => {
    // Use dynamic spent if available
    return project?.spent ? Number(project.spent) : 0;
  }, [project]);

  const remainingBudget = useMemo(
    () => Math.max(0, totalBudget - spentBudget),
    [spentBudget, totalBudget]
  );

  const freelancer = useMemo(() => {
    return project?.proposals?.find((p) => p.status === "ACCEPTED")?.freelancer;
  }, [project]);

  // Render ...
  // Update Documents Card to use `docs`

  /* Inside JSX for Documents Card: */
  /*
     <CardContent>
        {docs.length > 0 ? (
          <div className="space-y-2">
            {docs.map((doc, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm p-2 border border-border/60 rounded bg-muted/20">
                 <FileText className="w-4 h-4 text-primary" />
                 <span className="truncate flex-1">{doc.name}</span>
                 <span className="text-xs text-muted-foreground">{doc.size}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No documents attached yet. Upload project documentation here.
          </p>
        )}
      </CardContent>
  */

  const activeSOP = useMemo(() => {
    if (!project?.title) return SOP_TEMPLATES.WEBSITE;

    const title = project.title.toLowerCase();

    // Helper for word boundary check
    const has = (word) => new RegExp(`\\b${word}\\b`, "i").test(title);

    if (
      has("app") ||
      has("apps") ||
      has("mobile") ||
      has("ios") ||
      has("android") ||
      title.includes("application")
    ) {
      return SOP_TEMPLATES.APP;
    }
    if (
      title.includes("software") ||
      title.includes("platform") ||
      title.includes("system") ||
      has("crm") ||
      has("erp") ||
      has("saas")
    ) {
      return SOP_TEMPLATES.SOFTWARE;
    }
    if (
      title.includes("security") ||
      title.includes("audit") ||
      title.includes("penetration") ||
      title.includes("cyber") ||
      has("iso") ||
      has("gdpr")
    ) {
      return SOP_TEMPLATES.CYBERSECURITY;
    }
    if (
      has("brand") ||
      title.includes("strategy") ||
      title.includes("identity") ||
      title.includes("positioning")
    ) {
      return SOP_TEMPLATES.BRAND_STRATEGY;
    }
    if (has("pr") || title.includes("public relations")) {
      return SOP_TEMPLATES.PUBLIC_RELATIONS;
    }
    if (has("seo") || title.includes("search engine")) {
      return SOP_TEMPLATES.SEO;
    }
    if (has("smo") || title.includes("social media")) {
      return SOP_TEMPLATES.SMO;
    }
    if (
      title.includes("lead generation") ||
      has("sales") ||
      title.includes("prospecting")
    ) {
      return SOP_TEMPLATES.LEAD_GENERATION;
    }
    if (title.includes("qualification") || title.includes("scoring")) {
      return SOP_TEMPLATES.LEAD_QUALIFICATION;
    }
    if (title.includes("business leads") || title.includes("b2b leads")) {
      return SOP_TEMPLATES.BUSINESS_LEADS;
    }
    if (title.includes("content marketing") || title.includes("inbound")) {
      return SOP_TEMPLATES.CONTENT_MARKETING;
    }
    if (
      title.includes("social lead") ||
      title.includes("paid social") ||
      title.includes("social ads")
    ) {
      return SOP_TEMPLATES.SOCIAL_MEDIA_LEAD_GEN;
    }
    if (title.includes("customer support") || title.includes("helpdesk")) {
      return SOP_TEMPLATES.CUSTOMER_SUPPORT;
    }
    if (title.includes("technical support") || title.includes("it support")) {
      return SOP_TEMPLATES.TECHNICAL_SUPPORT;
    }
    // Strict check for Project Management to avoid "Development" matching "pm"
    if (
      title.includes("project management") ||
      has("pm") ||
      title.includes("coordination")
    ) {
      return SOP_TEMPLATES.PROJECT_MANAGEMENT;
    }
    if (
      title.includes("data entry") ||
      title.includes("typing") ||
      title.includes("excel") ||
      title.includes("spreadsheet")
    ) {
      return SOP_TEMPLATES.DATA_ENTRY;
    }
    if (title.includes("transcription") || title.includes("transcribe")) {
      return SOP_TEMPLATES.TRANSCRIPTION;
    }
    if (title.includes("translation") || title.includes("translate")) {
      return SOP_TEMPLATES.TRANSLATION;
    }
    if (
      title.includes("tutoring") ||
      has("tutor") ||
      title.includes("teaching")
    ) {
      return SOP_TEMPLATES.TUTORING;
    }
    if (title.includes("coaching") || has("coach")) {
      return SOP_TEMPLATES.COACHING;
    }
    if (title.includes("course") || title.includes("curriculum")) {
      return SOP_TEMPLATES.COURSE_DEVELOPMENT;
    }
    if (title.includes("legal") || has("law") || title.includes("contract")) {
      return SOP_TEMPLATES.LEGAL_CONSULTING;
    }
    if (
      title.includes("intellectual property") ||
      title.includes("trademark") ||
      title.includes("patent") ||
      title.includes("copyright") ||
      has("ip")
    ) {
      return SOP_TEMPLATES.IP_SERVICES;
    }
    return SOP_TEMPLATES.WEBSITE;
  }, [project]);

  const overallProgress = useMemo(() => {
    // If progress is explicit in the DB, use it
    if (project?.progress !== undefined && project?.progress !== null) {
      const value = Number(project.progress);
      return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
    }
    // Fallback logic if needed (or default to 0)
    return 0;
  }, [project]);

  const derivedPhases = useMemo(() => {
    const phases = activeSOP.phases;
    const step = 100 / phases.length;
    return phases.map((phase, index) => {
      // Calculate how much "progress" this phase accounts for
      const phaseValue = Math.max(
        0,
        Math.min(step, overallProgress - index * step)
      );
      const normalized = Math.round((phaseValue / step) * 100);
      let status = "pending";
      if (normalized >= 100) status = "completed";
      else if (normalized > 0) status = "in-progress";
      return {
        ...phase,
        status,
        progress: normalized,
        index, // Keep track of original index
      };
    });
  }, [overallProgress, activeSOP]);

  // Handle phase click to update progress
  const handlePhaseClick = (phaseIndex) => {
    // Determine the progress value required to complete THIS phase
    const phases = activeSOP.phases;
    const step = 100 / phases.length;

    // If clicking the current phase, verify if we should complete it or uncomplete it?
    // Simplified logic: Clicking a phase completes it (and all before it).
    // If it's already complete, maybe doing nothing or toggle?
    // Let's assume clicking sets the progress to the end of that phase.

    const targetProgress = Math.round((phaseIndex + 1) * step);

    // Logic refinement: if I click the last completed phase, maybe I want to undo it?
    // Let's stick to "Click to complete up to here".
    updateProjectProgress(targetProgress);
  };

  const visiblePhases = useMemo(() => {
    let foundCurrent = false;
    return derivedPhases.filter((phase) => {
      if (foundCurrent) return false;
      if (phase.status !== "completed") {
        foundCurrent = true;
        return true;
      }
      return true;
    });
  }, [derivedPhases]);

  // Find the current active phase (first non-completed phase)
  const currentActivePhase = useMemo(() => {
    return (
      derivedPhases.find((p) => p.status !== "completed") ||
      derivedPhases[derivedPhases.length - 1]
    );
  }, [derivedPhases]);

  const derivedTasks = useMemo(() => {
    const tasks = activeSOP.tasks;
    // Show ALL tasks from all phases
    return tasks.map((task) => {
      // Use unique key combining phase and task id
      const uniqueKey = `${task.phase}-${task.id}`;
      const isCompleted = completedTaskIds.has(uniqueKey);
      const isVerified = verifiedTaskIds.has(uniqueKey);
      const taskPhase = derivedPhases.find((p) => p.id === task.phase);
      const phaseStatus = taskPhase?.status || task.status;

      // Check if task is manually completed by user
      if (isCompleted) {
        return {
          ...task,
          uniqueKey,
          status: "completed",
          verified: isVerified,
          phaseName: taskPhase?.name,
        };
      }
      if (phaseStatus === "completed") {
        return {
          ...task,
          uniqueKey,
          status: "completed",
          verified: isVerified,
          phaseName: taskPhase?.name,
        };
      }
      if (phaseStatus === "in-progress" && task.status === "completed") {
        return {
          ...task,
          uniqueKey,
          verified: isVerified,
          phaseName: taskPhase?.name,
        };
      }
      return {
        ...task,
        uniqueKey,
        status: phaseStatus === "in-progress" ? "in-progress" : "pending",
        verified: false,
        phaseName: taskPhase?.name,
      };
    });
  }, [derivedPhases, activeSOP, completedTaskIds, verifiedTaskIds]);

  // Group tasks by phase for display
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

  // Handle task click to toggle completion (just marks as checked, not verified)
  const handleTaskClick = async (e, uniqueKey) => {
    e.stopPropagation();
    e.preventDefault();

    let newCompleted, newVerified;

    setCompletedTaskIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(uniqueKey)) {
        updated.delete(uniqueKey);
      } else {
        updated.add(uniqueKey);
      }
      newCompleted = Array.from(updated);
      return updated;
    });

    // Also remove from verified if unchecking
    setVerifiedTaskIds((prev) => {
      const updated = new Set(prev);
      if (!newCompleted.includes(uniqueKey)) {
        updated.delete(uniqueKey);
      }
      newVerified = Array.from(updated);
      return updated;
    });

    // Calculate new progress based on VERIFIED tasks
    const allTasks = activeSOP.tasks;
    const totalTasks = allTasks.length;
    const verifiedCount = allTasks.filter((t) =>
      newVerified.includes(`${t.phase}-${t.id}`)
    ).length;
    const newProgress = Math.round((verifiedCount / totalTasks) * 100);

    // Save to database
    updateProjectProgress(newProgress, newCompleted, newVerified);
  };

  // Handle verify button click - this updates progress
  // First show confirmation dialog
  const promptVerifyTask = (e, uniqueKey, taskTitle, isCurrentlyVerified) => {
    e.stopPropagation();
    e.preventDefault();
    if (e.nativeEvent) e.nativeEvent.stopImmediatePropagation();

    setPendingVerifyTask({
      uniqueKey,
      title: taskTitle,
      isVerified: isCurrentlyVerified,
    });
    setVerifyConfirmOpen(true);
  };

  // Actually perform the verification
  const handleVerifyTask = async (
    uniqueKey,
    taskTitle,
    isCurrentlyVerified
  ) => {
    setVerifyConfirmOpen(false);
    setPendingVerifyTask(null);

    // Compute new verified list synchronously BEFORE updating state
    const currentVerified = Array.from(verifiedTaskIds);
    let newVerified;
    let isMarkingVerified = false;

    if (currentVerified.includes(uniqueKey)) {
      // Removing verification
      newVerified = currentVerified.filter((id) => id !== uniqueKey);
      isMarkingVerified = false;
    } else {
      // Adding verification
      newVerified = [...currentVerified, uniqueKey];
      isMarkingVerified = true;
    }

    // Update local state
    setVerifiedTaskIds(new Set(newVerified));

    // Calculate new progress
    const allTasks = activeSOP.tasks;
    const totalTasks = allTasks.length;
    const verifiedCount = allTasks.filter((t) =>
      newVerified.includes(`${t.phase}-${t.id}`)
    ).length;
    const newProgress = Math.round((verifiedCount / totalTasks) * 100);

    // Build notification metadata for both verifying and un-verifying
    let notificationMeta = null;
    if (taskTitle) {
      if (isMarkingVerified) {
        notificationMeta = { type: "TASK_VERIFIED", taskName: taskTitle };
      } else {
        notificationMeta = { type: "TASK_UNVERIFIED", taskName: taskTitle };
      }
    }

    // Save to database
    const currentCompleted = Array.from(completedTaskIds);
    await updateProjectProgress(
      newProgress,
      currentCompleted,
      newVerified,
      notificationMeta
    );
  };

  const completedPhases = derivedPhases.filter(
    (p) => p.status === "completed"
  ).length;
  const pageTitle = project?.title
    ? `Project: ${project.title}`
    : "Project Dashboard";

  // Show skeleton while loading
  if (isLoading) {
    return (
      <RoleAwareSidebar>
        <div className="mt-5 ml-5">
          <ClientTopBar title="Loading..." />
        </div>
        <ProjectDetailSkeleton />
      </RoleAwareSidebar>
    );
  }

  return (
    <RoleAwareSidebar>
      <div className="min-h-screen bg-background text-foreground p-6 md:p-8 w-full">
        <div className="w-full max-w-full mx-auto space-y-6">
          <ClientTopBar title={pageTitle} />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                {pageTitle}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isLoading
                  ? "Loading project details..."
                  : "Track project progress and manage tasks efficiently"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setReportOpen(true)}
                    >
                      <Headset /> Catalyst
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Project Catalyst</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <ProjectNotepad projectId={project?.id || projectId} />
            </div>
          </div>

          {/* Book Appointment Dialog */}
          <BookAppointment
            isOpen={bookAppointmentOpen}
            onClose={() => setBookAppointmentOpen(false)}
            projectId={project?.id || projectId}
            projectTitle={project?.title}
          />
          {!isLoading && !project && (
            <div className="rounded-lg border border-border/60 bg-accent/40 px-4 py-3 text-sm text-muted-foreground">
              No project data found for this link. Showing sample progress so
              you can preview the layout.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <Card className="border border-border/60 bg-card/80 shadow-sm backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Project Progress
                  </CardTitle>
                  <span className="text-lg font-semibold text-amber-500">
                    {Math.round(overallProgress)}% Complete
                  </span>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="relative">
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-400"
                        style={{ width: `${overallProgress}%` }}
                      />
                    </div>
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-300 rounded-full shadow-md transition-all duration-300"
                      style={{ left: `calc(${overallProgress}% - 8px)` }}
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    {Array.from({ length: 4 }).map((_, index) => {
                      const phase = derivedPhases[index];
                      const isCompleted = phase?.status === "completed";
                      const isActive = phase?.status === "in-progress";
                      return (
                        <div
                          key={phase?.id || `phase-${index}`}
                          className={`p-4 rounded-lg border-l-4 ${
                            isCompleted
                              ? "bg-emerald-50 dark:bg-emerald-950/30 border-l-emerald-500"
                              : isActive
                              ? "bg-blue-50 dark:bg-blue-950/30 border-l-blue-500"
                              : "bg-gray-50 dark:bg-gray-800/30 border-l-transparent"
                          }`}
                        >
                          <div
                            className={`text-xs font-medium uppercase tracking-wider mb-1 ${
                              isCompleted
                                ? "text-emerald-600 dark:text-emerald-400"
                                : isActive
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-gray-500"
                            }`}
                          >
                            Phase {index + 1}
                          </div>
                          <div className="font-semibold text-foreground mb-1 text-sm">
                            {phase?.name || "Phase"}
                          </div>
                          <div
                            className={`text-xs flex items-center gap-1.5 ${
                              isCompleted
                                ? "text-emerald-600 dark:text-emerald-400"
                                : isActive
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-gray-500"
                            }`}
                          >
                            {isCompleted && (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            {isActive && (
                              <Circle className="w-3.5 h-3.5 fill-current" />
                            )}
                            {isCompleted
                              ? "Completed"
                              : isActive
                              ? "Active"
                              : "Pending"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-border/60 bg-card/80 shadow-sm backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Project Description
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setDetailOpen(true)}
                    aria-label="View full project details"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderProjectDescription({ showExtended: false })}
                </CardContent>
              </Card>

              {/* All Tasks Grouped by Phase - Accordion */}
              <Card className="border border-border/60 bg-card/80 shadow-sm backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-foreground">
                    Project Tasks
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {derivedTasks.filter((t) => t.verified).length} of{" "}
                    {derivedTasks.length} tasks verified
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion
                    type="single"
                    collapsible
                    defaultValue={currentActivePhase?.id}
                    className="w-full"
                  >
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
                              <div className="font-semibold text-sm text-foreground">
                                {phaseGroup.phaseName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {
                                  phaseGroup.tasks.filter((t) => t.verified)
                                    .length
                                }{" "}
                                of {phaseGroup.tasks.length} verified
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
                                className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-card hover:bg-accent/60 transition-colors cursor-pointer"
                                onClick={(e) =>
                                  handleTaskClick(e, task.uniqueKey)
                                }
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
                                      : "text-foreground"
                                  }`}
                                >
                                  {task.title}
                                </span>
                                {task.status === "completed" && (
                                  <Button
                                    size="sm"
                                    variant={
                                      task.verified ? "default" : "outline"
                                    }
                                    className={`h-7 px-3 text-xs transition-all ${
                                      task.verified
                                        ? "bg-emerald-500 hover:bg-emerald-600 text-white border-transparent"
                                        : "border-primary text-primary hover:bg-primary/10"
                                    }`}
                                    onClick={(e) =>
                                      promptVerifyTask(
                                        e,
                                        task.uniqueKey,
                                        task.title,
                                        task.verified
                                      )
                                    }
                                  >
                                    {task.verified ? "Verified" : "Verify"}
                                  </Button>
                                )}
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

            <div className="space-y-4">
              {/* Freelancer Info Card */}
              <FreelancerInfoCard freelancer={freelancer} />
              <FreelancerAboutCard freelancer={freelancer} project={project} />

              {/* Project Chat - First */}
              <Card className="flex flex-col h-96 border border-border/60 bg-card/80 shadow-sm backdrop-blur">
                <CardHeader className="border-b border-border/60">
                  <CardTitle className="text-base text-foreground">
                    Project Chat
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Ask questions and share documents
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto space-y-3 py-4">
                  {messages.map((message, index) => {
                    const isSelf = message.sender === "user";
                    const isAssistant = message.sender === "assistant";
                    const align =
                      isAssistant || !isSelf ? "justify-start" : "justify-end";

                    const prevMessage = messages[index - 1];
                    const currentDate = message.createdAt
                      ? new Date(message.createdAt)
                      : new Date();
                    const prevDate = prevMessage?.createdAt
                      ? new Date(prevMessage.createdAt)
                      : null;
                    const showDateDivider =
                      !prevDate || !isSameDay(currentDate, prevDate);

                    return (
                      <React.Fragment key={message.id || index}>
                        {showDateDivider && (
                          <div className="flex justify-center my-4">
                            <span className="bg-muted/40 px-3 py-1 rounded-full text-[10px] uppercase font-medium tracking-wide text-muted-foreground/70">
                              {isToday(currentDate)
                                ? "Today"
                                : isYesterday(currentDate)
                                ? "Yesterday"
                                : format(currentDate, "MMMM d, yyyy")}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${align}`}>
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm flex flex-col overflow-hidden ${
                              isSelf
                                ? "bg-primary text-primary-foreground rounded-tr-sm shadow-sm"
                                : "bg-muted text-foreground rounded-tl-sm border border-border/60"
                            }`}
                          >
                            {message.sender === "other" &&
                              message.senderName && (
                                <span className="text-[10px] opacity-70 mb-1 block">
                                  {message.senderName}
                                </span>
                              )}

                            {message.text && (
                              <p className="leading-relaxed whitespace-pre-wrap break-words">
                                {message.text}
                              </p>
                            )}

                            {message.attachment && (
                              <div className="mt-2">
                                {message.attachment.type?.startsWith(
                                  "image/"
                                ) ||
                                message.attachment.url?.match(
                                  /\.(jpg|jpeg|png|gif|webp)$/i
                                ) ? (
                                  <a
                                    href={message.attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block"
                                  >
                                    <img
                                      src={message.attachment.url}
                                      alt={
                                        message.attachment.name || "Attachment"
                                      }
                                      className="max-w-[180px] max-h-[180px] rounded-lg object-cover"
                                    />
                                  </a>
                                ) : (
                                  <a
                                    href={message.attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-2 p-2 rounded-lg bg-background/20 hover:bg-background/30 transition-colors ${
                                      !isSelf
                                        ? "border border-border/50 bg-background/50"
                                        : ""
                                    }`}
                                  >
                                    <FileText className="h-4 w-4 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium truncate max-w-[140px]">
                                        {message.attachment.name || "File"}
                                      </p>
                                    </div>
                                  </a>
                                )}
                              </div>
                            )}

                            <div className="flex items-center gap-1 self-end mt-1 justify-end">
                              <span className="text-[10px] opacity-70 whitespace-nowrap">
                                {format(currentDate, "h:mm a")}
                              </span>
                              {isSelf && (
                                <span className="ml-1 opacity-90">
                                  {message.readAt ? (
                                    <CheckCheck className="h-3 w-3" />
                                  ) : (
                                    <Check className="h-3 w-3" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </CardContent>
                <div className="border-t border-border/60 p-3 flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="h-9 text-sm bg-muted border-border/60"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    size="sm"
                    variant="outline"
                    className="h-9 w-9 p-0 border-border/60"
                    title="Upload document"
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
                  />
                  <Button
                    onClick={handleSendMessage}
                    size="sm"
                    variant="default"
                    className="h-9 w-9 p-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </Card>

              {/* Documents - Second */}
              <Card className="border border-border/60 bg-card/80 shadow-sm backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-foreground">
                    <FileText className="w-4 h-4" />
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {docs.length > 0 ? (
                    <div className="space-y-2">
                      {docs.map((doc, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-sm p-2 border border-border/60 rounded bg-muted/20"
                        >
                          <FileText className="w-4 h-4 text-primary" />
                          <span className="truncate flex-1">{doc.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {doc.size}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No documents attached yet. Upload project documentation
                      here.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Budget Summary - Third */}
              <Card className="border border-border/60 bg-card/80 shadow-sm backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-foreground">
                    <IndianRupee className="w-4 h-4" />
                    Budget Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex justify-between items-center pb-2 border-b border-border/60">
                    <span>Total Budget</span>
                    <span className="font-semibold text-foreground">
                      ₹{totalBudget.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-border/60">
                    <span>Spent</span>
                    <span className="font-semibold text-emerald-600">
                      ₹{spentBudget.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Remaining</span>
                    <span className="font-semibold text-foreground">
                      ₹{remainingBudget.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Confirmation Dialog */}
      <Dialog open={verifyConfirmOpen} onOpenChange={setVerifyConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {pendingVerifyTask?.isVerified
                ? "Remove Verification?"
                : "Verify Task?"}
            </DialogTitle>
            <DialogDescription>
              {pendingVerifyTask?.isVerified
                ? `Are you sure you want to remove verification from "${pendingVerifyTask?.title}"? The freelancer will be notified.`
                : `Are you sure you want to verify "${pendingVerifyTask?.title}"? This confirms the task has been completed to your satisfaction.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setVerifyConfirmOpen(false);
                setPendingVerifyTask(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant={
                pendingVerifyTask?.isVerified ? "destructive" : "default"
              }
              onClick={() => {
                if (pendingVerifyTask) {
                  handleVerifyTask(
                    pendingVerifyTask.uniqueKey,
                    pendingVerifyTask.title,
                    pendingVerifyTask.isVerified
                  );
                }
              }}
            >
              {pendingVerifyTask?.isVerified
                ? "Remove Verification"
                : "Verify Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contact your Project Catalyst</DialogTitle>
            <DialogDescription>
              Describe the issue or dispute regarding this project. A Project
              Manager will get involved to resolve it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {project?.manager && (
              <div className="bg-muted/50 p-3 rounded-md mb-2 border flex items-center gap-3">
                <Avatar className="h-10 w-10 border bg-background">
                  <AvatarImage
                    src={project.manager.avatar}
                    alt={project.manager.fullName}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    PM
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground mb-1">
                    {project.manager.fullName}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="w-3 h-3" />
                    <span>{project.manager.email}</span>
                  </div>
                  {project.manager.phone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <Phone className="w-3 h-3" />
                      <span>{project.manager.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Add Note</label>
              <Textarea
                placeholder="Add a note..."
                value={issueText}
                onChange={(e) => setIssueText(e.target.value)}
                className="min-h-[100px] whitespace-pre-wrap break-all"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Project Manager Availability
              </label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      disabled={[
                        { dayOfWeek: [0] }, // Disable only Sunday
                        { before: new Date() }, // Disable past dates
                      ]}
                      className="rounded-md border"
                    />
                  </PopoverContent>
                </Popover>
                <div className="flex items-center gap-2">
                  <Select value={time} onValueChange={setTime}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {availableTimeSlots.length > 0 ? (
                          availableTimeSlots.map((slot) => (
                            <SelectItem key={slot} value={slot}>
                              {slot}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-xs text-muted-foreground text-center">
                            No slots available
                          </div>
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleReport}
              disabled={isReporting || !issueText.trim()}
            >
              {isReporting ? "Submit" : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Project Details</DialogTitle>
            <DialogDescription>
              Full project description and scope.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-1 space-y-4">
            {renderProjectDescription({ showExtended: true })}
          </div>
        </DialogContent>
      </Dialog>
    </RoleAwareSidebar>
  );
};

const ClientProjectDetail = () => <ProjectDashboard />;

export default ClientProjectDetail;
