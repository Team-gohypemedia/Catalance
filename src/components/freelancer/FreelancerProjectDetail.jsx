"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
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
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  MessageCircle,
  Circle,
  AlertCircle,
  IndianRupee,
  Send,
  Upload,
  FileText,
  Calendar as CalendarIcon,
  Headset,
  Mail,
  Phone,
  Image,
  Globe,
  Linkedin,
  Github,
  Link2,
  Info,
  Check,
  CheckCheck,
  Pencil,
  X,
  ChevronUp,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { ProjectNotepad } from "@/components/ui/notepad";

import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";
import { FreelancerTopBar } from "@/components/freelancer/FreelancerTopBar";
import { useAuth } from "@/context/AuthContext";
import { SOP_TEMPLATES } from "@/data/sopTemplates";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
const ProjectDetailSkeleton = () => (
  <div className="min-h-screen bg-background text-foreground p-6 md:p-8 w-full">
    <div className="w-full max-w-full mx-auto space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
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
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="border border-border/60 bg-card/80">
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/60"
                >
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
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
          <Card className="border border-border/60 bg-card/80 h-96">
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-10 w-2/3 ml-auto" />
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

const COMMON_ISSUES = [
  "Client Unresponsive",
  "Payment Issue",
  "Scope Creep",
  "Project Stalled",
  "Harassment/Unprofessional Behavior",
  "Other",
];

const ClientInfoCard = ({ client }) => {
  if (!client) return null;

  return (
    <Card className="border border-border/60 bg-card/80 shadow-sm backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Client Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border border-border">
            <AvatarImage src={client.avatar} alt={client.fullName} />
            <AvatarFallback>
              {(client.fullName || "C").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground">
                {client.fullName || "Client Name"}
              </span>
              {client.isVerified && (
                <CheckCircle2
                  className="w-3.5 h-3.5 text-blue-500"
                  fill="currentColor"
                  stroke="white"
                />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ClientAboutCard = ({ client, project, onUpdateLink }) => {
  if (!client) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [linkValue, setLinkValue] = useState(project?.externalLink || "");
  const [isSaving, setIsSaving] = useState(false);

  // Update local state if prop changes
  useEffect(() => {
    setLinkValue(project?.externalLink || "");
  }, [project?.externalLink]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateLink(linkValue);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update link", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setLinkValue(project?.externalLink || "");
    setIsEditing(false);
  };

  const displayLink = project?.externalLink || client.portfolio;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-base text-foreground">About</h3>

      <div className="space-y-3">
        {/* Project Link with Edit Mode */}
        <div className="flex flex-col gap-2">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={linkValue}
                  onChange={(e) => setLinkValue(e.target.value)}
                  className="pl-9 h-9 text-sm"
                  placeholder="https://project-link.com"
                  autoFocus
                />
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-muted-foreground hover:text-destructive"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            // Display Mode
            <div className="group relative min-h-[24px] flex items-center">
              {displayLink ? (
                <a
                  href={displayLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 text-sm text-blue-400 hover:underline font-medium break-all pr-8"
                >
                  <Link2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    {displayLink.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </span>
                </a>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Link2 className="w-4 h-4 shrink-0" />
                  <span>No project link</span>
                </div>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="absolute -right-2 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.preventDefault();
                  setIsEditing(true);
                }}
              >
                <Pencil className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          )}
        </div>

        {/* Tech Stack - parsed from description */}
        {(() => {
          const desc = project?.description || "";
          const techMatch = desc.match(/Tech stack:\s*([^-\n]+)/i);
          const techStack = techMatch ? techMatch[1].trim() : null;
          return techStack ? (
            <div className="flex items-start gap-2 text-sm">
              <span className="text-muted-foreground">Tech Stack:</span>
              <span className="text-foreground font-medium">{techStack}</span>
            </div>
          ) : null;
        })()}

        {/* Summary - parsed from description */}
        {(() => {
          const desc = project?.description || "";
          const summaryMatch = desc.match(/Summary[:\s-]+(.+)/i);
          const summary = summaryMatch ? summaryMatch[1].trim() : null;
          return summary ? (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {summary}
            </p>
          ) : null;
        })()}
      </div>
    </div>
  );
};

const FreelancerProjectDetailContent = () => {
  const { projectId } = useParams();
  const { authFetch, isAuthenticated, user } = useAuth();

  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(true);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [completedTaskIds, setCompletedTaskIds] = useState(new Set());
  const [verifiedTaskIds, setVerifiedTaskIds] = useState(new Set());
  const [isSending, setIsSending] = useState(false);
  const [paymentData, setPaymentData] = useState({
    totalPaid: 0,
    totalPending: 0,
  });
  const fileInputRef = useRef(null);

  // Dispute Report State
  const [reportOpen, setReportOpen] = useState(false);
  const [issueText, setIssueText] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  const [date, setDate] = useState();
  const [time, setTime] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [serverAvailableSlots, setServerAvailableSlots] = useState([]);

  useEffect(() => {
    if (!date || !authFetch) return;

    const fetchAvailability = async () => {
      try {
        console.log("Fetching availability for date:", date.toISOString());
        const res = await authFetch(
          `/disputes/availability?date=${date.toISOString()}`
        );
        console.log("Availability response status:", res.status);
        if (res.ok) {
          const payload = await res.json();
          console.log("Availability payload:", payload);
          setServerAvailableSlots(payload.data || []);
        } else {
          console.error("Availability fetch failed with status:", res.status);
          const errorText = await res.text();
          console.error("Error response:", errorText);
        }
      } catch (e) {
        console.error("Failed to fetch availability", e);
      }
    };
    fetchAvailability();
  }, [date, authFetch]);

  // Filter time slots based on selected date
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

  // Handle reporting a dispute (same logic as client)
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
    const rawBudget = extractField("Budget");
    let budget = rawBudget;
    if (rawBudget) {
      // Parse numeric value, reduce by 30%, and reformat
      const numericBudget = parseFloat(rawBudget.replace(/[^0-9.]/g, ""));
      if (!isNaN(numericBudget)) {
        const reducedBudget = Math.round(numericBudget * 0.7);
        const currency = rawBudget.match(/[A-Z$€£¥₹]+/i)?.[0] || "INR";
        budget = `${currency} ${reducedBudget.toLocaleString()}`;
      }
    }
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

  // Handle reporting a dispute (same logic as client)
  const handleReport = async () => {
    if (!issueText.trim()) {
      toast.error("Please describe the issue");
      return;
    }

    let fullDescription = issueText;
    let meetingDateIso = undefined;

    if (date) {
      fullDescription += `\n\nDate of Issue: ${format(date, "PPP")}`;

      // Combine for structural save
      const combined = new Date(date);
      if (time) {
        fullDescription += `\nTime: ${time}`;
        const [timeStr, period] = time.split(" ");
        let [hours, minutes] = timeStr.split(":").map(Number);
        if (period === "PM" && hours !== 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;
        combined.setHours(hours, minutes, 0, 0);
      } else {
        combined.setHours(9, 0, 0, 0);
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
        const response = await authFetch("/proposals");
        const payload = await response.json().catch(() => null);
        const proposals = Array.isArray(payload?.data) ? payload.data : [];
        const match = proposals.find(
          (p) => String(p?.project?.id) === String(projectId)
        );

        if (match?.project && active) {
          const normalizedProgress = (() => {
            const value = Number(match.project.progress ?? match.progress ?? 0);
            return Number.isFinite(value)
              ? Math.max(0, Math.min(100, value))
              : 0;
          })();

          const normalizedBudget = (() => {
            const value = Number(match.project.budget ?? match.budget ?? 0);
            return Number.isFinite(value) ? Math.max(0, value) : 0;
          })();

          setProject({
            id: match.project.id,
            ownerId: match.project.ownerId, // Needed for chat key
            title: match.project.title || "Project",
            client:
              match.project.owner?.fullName ||
              match.project.owner?.name ||
              match.project.owner?.email ||
              "Client",
            progress: normalizedProgress,
            status: match.project.status || match.status || "IN_PROGRESS",
            budget: normalizedBudget,
            currency: match.project.currency || match.currency || "₹",
            spent: Number(match.project.spent || 0),
            spent: Number(match.project.spent || 0),
            manager: match.project.manager, // Map manager details
            owner: match.project.owner, // Store full owner object for details card
            externalLink: match.project.externalLink || null, // Project link
            description: match.project.description || null, // Project description
          });
          setIsFallback(false);

          // Load saved task progress from database
          if (Array.isArray(match.project.completedTasks)) {
            setCompletedTaskIds(new Set(match.project.completedTasks));
          }
          if (Array.isArray(match.project.verifiedTasks)) {
            setVerifiedTaskIds(new Set(match.project.verifiedTasks));
          }
        } else if (active) {
          setProject(null);
          setIsFallback(true);
        }
      } catch (error) {
        console.error("Failed to load freelancer project detail:", error);
        if (active) {
          setProject(null);
          setIsFallback(true);
        }
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

  // Fetch actual payment data from API
  useEffect(() => {
    if (!project?.id || !authFetch) return;

    const fetchPayments = async () => {
      try {
        const res = await authFetch(`/payments/project/${project.id}/summary`);
        if (res.ok) {
          const data = await res.json();
          if (data?.data) {
            setPaymentData({
              totalPaid: data.data.totalPaid || 0,
              totalPending: data.data.totalPending || 0,
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch payment data:", error);
      }
    };

    fetchPayments();
  }, [project?.id, authFetch]);

  // Create or reuse a chat conversation for this project
  useEffect(() => {
    if (!project || !authFetch || !user?.id) return;

    // Key Logic: CHAT:PROJECT_ID:OWNER_ID:FREELANCER_ID (User is Freelancer)
    // Fallback to project:ID only if owner unknown, but for sync needs CHAT:...
    let key = `project:${project.id}`;
    if (project.ownerId && user.id) {
      key = `CHAT:${project.id}:${project.ownerId}:${user.id}`;
    }

    console.log("Freelancer Chat Init - Key:", key);

    let cancelled = false;

    const ensureConversation = async () => {
      try {
        const response = await authFetch("/chat/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service: key,
            projectTitle: project?.title || "Project Chat",
            forceNew: false,
          }),
        });

        const payload = await response.json().catch(() => null);
        const convo = payload?.data || payload;
        if (convo?.id && !cancelled) {
          setConversationId(convo.id);
        }
      } catch (error) {
        console.error("Failed to create project chat conversation", error);
      }
    };

    ensureConversation();
    return () => {
      cancelled = true;
    };
  }, [authFetch, project, user]);

  // Load chat history
  const fetchMessages = useCallback(async () => {
    if (!conversationId || !authFetch) return;
    try {
      const response = await authFetch(
        `/chat/conversations/${conversationId}/messages`
      );
      const payload = await response.json().catch(() => null);
      const list = Array.isArray(payload?.data?.messages)
        ? payload.data.messages
        : payload?.messages || [];

      const normalized = list.map((msg) => {
        // Logic: I am the freelancer.
        // If senderId == my id, it's me.
        // If senderRole == 'FREELANCER', it's me.
        // Everything else (Client/Assistant) is 'other'.
        const isMe =
          (user?.id && String(msg.senderId) === String(user.id)) ||
          msg.senderRole === "FREELANCER"; // Check for explicit role

        return {
          id: msg.id,
          sender:
            msg.role === "assistant" ? "assistant" : isMe ? "user" : "other",
          text: msg.content,
          timestamp: msg.createdAt ? new Date(msg.createdAt) : new Date(),
          createdAt: msg.createdAt,
          readAt: msg.readAt,
          attachment: msg.attachment,
          senderName: msg.senderName,
        };
      });

      // Merge logic to keep pending messages
      setMessages((prev) => {
        const pending = prev.filter((m) => m.pending);
        // Dedupe based on signature (sender + text + attachment name)
        const backendSignatures = new Set(
          normalized.map(
            (m) => `${m.sender}:${m.text}:${m.attachment?.name || ""}`
          )
        );

        const stillPending = pending.filter((p) => {
          const signature = `${p.sender}:${p.text}:${p.attachment?.name || ""}`;
          return !backendSignatures.has(signature);
        });
        return [...normalized, ...stillPending];
      });
    } catch (error) {
      console.error("Failed to load project chat messages", error);
    }
  }, [authFetch, conversationId, user]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !conversationId || !authFetch) return;

    // Optimistic message
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
      const serviceKey =
        project?.ownerId && user?.id
          ? `CHAT:${project?.id || projectId}:${project.ownerId}:${user.id}`
          : `project:${project?.id || projectId}`;

      await authFetch(`/chat/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: userMessage.text,
          service: serviceKey,
          senderRole: "FREELANCER",
          senderName:
            user?.fullName || user?.name || user?.email || "Freelancer",
          skipAssistant: true, // Persist to DB
        }),
      });
      // Polling will fetch the real message
    } catch (error) {
      console.error("Failed to send project chat message", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file && conversationId) {
      // Capture current input text to send with file
      const textContent = input;

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

        setMessages((prev) => [...prev, userMessage]);

        // Clear input immediately
        setInput("");

        // Build the correct service key for notifications
        const serviceKey =
          project?.ownerId && user?.id
            ? `CHAT:${project?.id || projectId}:${project.ownerId}:${user.id}`
            : `project:${project?.id || projectId}`;

        await authFetch(`/chat/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: textContent,
            service: serviceKey,
            senderRole: "FREELANCER",
            senderName:
              user?.fullName || user?.name || user?.email || "Freelancer",
            attachment,
            skipAssistant: true,
          }),
        });

        toast.success("File sent successfully");
        fetchMessages(); // Sync with backend
      } catch (e) {
        console.error("Upload failed", e);
        toast.error("Failed to send file");
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const docs = useMemo(() => {
    return messages
      .filter((m) => m.attachment)
      .map((m) => ({
        ...m.attachment,
        createdAt: m.createdAt || m.timestamp,
      }));
  }, [messages]);

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
    if (project?.progress !== undefined && project?.progress !== null) {
      const value = Number(project.progress);
      return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
    }
    const status = mapStatus(project?.status);
    if (status === "completed") return 100;
    if (status === "in-progress") return 45;
    return 10;
  }, [project]);

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
      return {
        ...phase,
        status,
        progress: normalized,
      };
    });
  }, [overallProgress, activeSOP]);

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

  // Handle task click to toggle completion
  const handleTaskClick = async (e, uniqueKey, taskTitle) => {
    e.stopPropagation();
    e.preventDefault();

    if (verifiedTaskIds.has(uniqueKey)) {
      toast.error("Cannot change status of a verified task");
      return;
    }

    let newCompleted;
    let isMarkingComplete = false;

    setCompletedTaskIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(uniqueKey)) {
        updated.delete(uniqueKey);
      } else {
        updated.add(uniqueKey);
        isMarkingComplete = true;
      }
      newCompleted = Array.from(updated);
      return updated;
    });

    // Save to database
    if (project?.id && authFetch) {
      try {
        const payload = {
          completedTasks: newCompleted,
        };

        // Only send notification when marking as complete (not when unchecking)
        if (isMarkingComplete && taskTitle) {
          payload.notificationMeta = {
            type: "TASK_COMPLETED",
            taskName: taskTitle,
          };
        }

        await authFetch(`/projects/${project.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (error) {
        console.error("Failed to save task state:", error);
      }
    }
  };

  const completedPhases = derivedPhases.filter(
    (p) => p.status === "completed"
  ).length;
  const pageTitle = project?.title
    ? `Project: ${project.title}`
    : "Project Dashboard";

  const totalBudget = useMemo(() => {
    if (project?.budget !== undefined && project?.budget !== null) {
      const value = Number(project.budget);
      // Reduce 30% platform fee - Freelancer sees 70%
      if (Number.isFinite(value)) return Math.max(0, value * 0.7);
    }
    return 0;
  }, [project]);

  const spentBudget = useMemo(() => {
    // Use actual payment data from API (already 70% after platform fee)
    return paymentData.totalPaid || 0;
  }, [paymentData]);

  const remainingBudget = useMemo(
    () => Math.max(0, totalBudget - spentBudget),
    [spentBudget, totalBudget]
  );

  const activePhase = useMemo(() => {
    return (
      derivedPhases.find((p) => p.status !== "completed") ||
      derivedPhases[derivedPhases.length - 1]
    );
  }, [derivedPhases]);

  const visibleTasks = useMemo(() => {
    if (!activePhase) return [];
    return derivedTasks.filter((t) => t.phase === activePhase.id);
  }, [derivedTasks, activePhase]);

  // Show skeleton while loading
  if (isLoading) {
    return (
      <RoleAwareSidebar>
        <div className="mt-5 ml-5 mr-5">
          <FreelancerTopBar label="Loading..." />
        </div>
        <ProjectDetailSkeleton />
      </RoleAwareSidebar>
    );
  }

  return (
    <RoleAwareSidebar>
      <div className="min-h-screen bg-background text-foreground p-6 md:p-8 w-full relative">
        {project?.status === "AWAITING_PAYMENT" && (
          <div className="absolute inset-0 z-50 backdrop-blur-md bg-background/60">
            <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center p-6 text-center">
              <div className="max-w-lg space-y-6">
                <div className="p-6 rounded-full bg-yellow-500/10 mb-4 animate-pulse mx-auto w-fit">
                  <span className="text-4xl">⏳</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Waiting for Client Approval
                </h2>
                <p className="text-muted-foreground leading-relaxed font-medium">
                  We are waiting for the client to complete the upfront payment
                  for{" "}
                  <span className="font-semibold text-foreground">
                    {project.title}
                  </span>
                  . Once approved, the project will start.
                </p>
                <div className="pt-4">
                  <Button
                    variant="outline"
                    onClick={() => window.history.back()}
                  >
                    Go Back
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="w-full max-w-full mx-auto space-y-6">
          <FreelancerTopBar label={pageTitle} />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                {pageTitle}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isLoading
                  ? "Loading project details..."
                  : isFallback
                  ? "Previewing layout with sample data."
                  : "Track project progress and deliverables in one place."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-2 shadow-sm"
                  >
                    <Headset className="w-4 h-4" /> Catalyst
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-2" align="end">
                  <div className="grid gap-1">
                    <h4 className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Contact Catalyst
                    </h4>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-auto py-3 px-3 rounded-lg hover:bg-muted/80 transition-colors"
                      asChild
                    >
                      <a
                        href="https://wa.me/919999999999"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                          <MessageCircle className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col items-start text-sm">
                          <span className="font-semibold text-foreground">
                            WhatsApp
                          </span>
                          <span className="text-xs text-muted-foreground font-normal">
                            Chat immediately
                          </span>
                        </div>
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-auto py-3 px-3 rounded-lg hover:bg-muted/80 transition-colors"
                      asChild
                    >
                      <a href="tel:+919999999999">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                          <Phone className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col items-start text-sm">
                          <span className="font-semibold text-foreground">
                            Call Support
                          </span>
                          <span className="text-xs text-muted-foreground font-normal">
                            Voice assistance
                          </span>
                        </div>
                      </a>
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <ProjectNotepad projectId={project?.id || projectId} />
            </div>
          </div>

          {!isLoading && isFallback && (
            <div className="rounded-lg border border-border/60 bg-accent/40 px-4 py-3 text-sm text-muted-foreground">
              Project details for this link are unavailable. Previewing layout
              with sample data.
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
                  {/* Dark Progress Bar with Handle */}
                  <div className="relative">
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300 bg-linear-to-r from-amber-500 via-yellow-400 to-amber-400"
                        style={{ width: `${overallProgress}%` }}
                      />
                    </div>
                    {/* Circular Handle */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-300 rounded-full shadow-md transition-all duration-300"
                      style={{ left: `calc(${overallProgress}% - 8px)` }}
                    />
                  </div>

                  {/* Phase Cards */}
                  <div className="grid grid-cols-4 gap-3">
                    {/* Phase 1 */}
                    <div
                      className={`p-4 rounded-lg border-l-4 ${
                        derivedPhases[0]?.status === "completed"
                          ? "bg-emerald-50 dark:bg-emerald-950/30 border-l-emerald-500"
                          : derivedPhases[0]?.status === "in-progress"
                          ? "bg-blue-50 dark:bg-blue-950/30 border-l-blue-500"
                          : "bg-gray-50 dark:bg-gray-800/30 border-l-transparent"
                      }`}
                    >
                      <div
                        className={`text-xs font-medium uppercase tracking-wider mb-1 ${
                          derivedPhases[0]?.status === "completed"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : derivedPhases[0]?.status === "in-progress"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-500"
                        }`}
                      >
                        Phase 1
                      </div>
                      <div className="font-semibold text-foreground mb-1 text-sm">
                        {derivedPhases[0]?.name || "Discovery"}
                      </div>
                      <div
                        className={`text-xs flex items-center gap-1.5 ${
                          derivedPhases[0]?.status === "completed"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : derivedPhases[0]?.status === "in-progress"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-500"
                        }`}
                      >
                        {derivedPhases[0]?.status === "completed" && (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        {derivedPhases[0]?.status === "in-progress" && (
                          <Circle className="w-3.5 h-3.5 fill-current" />
                        )}
                        {derivedPhases[0]?.status === "completed"
                          ? "Completed"
                          : derivedPhases[0]?.status === "in-progress"
                          ? "Active"
                          : "Pending"}
                      </div>
                    </div>

                    {/* Phase 2 */}
                    <div
                      className={`p-4 rounded-lg border-l-4 ${
                        derivedPhases[1]?.status === "completed"
                          ? "bg-emerald-50 dark:bg-emerald-950/30 border-l-emerald-500"
                          : derivedPhases[1]?.status === "in-progress"
                          ? "bg-blue-50 dark:bg-blue-950/30 border-l-blue-500"
                          : "bg-gray-50 dark:bg-gray-800/30 border-l-transparent"
                      }`}
                    >
                      <div
                        className={`text-xs font-medium uppercase tracking-wider mb-1 ${
                          derivedPhases[1]?.status === "completed"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : derivedPhases[1]?.status === "in-progress"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-500"
                        }`}
                      >
                        Phase 2
                      </div>
                      <div className="font-semibold text-foreground mb-1 text-sm">
                        {derivedPhases[1]?.name || "Development"}
                      </div>
                      <div
                        className={`text-xs flex items-center gap-1.5 ${
                          derivedPhases[1]?.status === "completed"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : derivedPhases[1]?.status === "in-progress"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-500"
                        }`}
                      >
                        {derivedPhases[1]?.status === "completed" && (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        {derivedPhases[1]?.status === "in-progress" && (
                          <Circle className="w-3.5 h-3.5 fill-current" />
                        )}
                        {derivedPhases[1]?.status === "completed"
                          ? "Completed"
                          : derivedPhases[1]?.status === "in-progress"
                          ? "Active"
                          : "Pending"}
                      </div>
                    </div>

                    {/* Phase 3 */}
                    <div
                      className={`p-4 rounded-lg border-l-4 ${
                        derivedPhases[2]?.status === "completed"
                          ? "bg-emerald-50 dark:bg-emerald-950/30 border-l-emerald-500"
                          : derivedPhases[2]?.status === "in-progress"
                          ? "bg-blue-50 dark:bg-blue-950/30 border-l-blue-500"
                          : "bg-gray-50 dark:bg-gray-800/30 border-l-transparent"
                      }`}
                    >
                      <div
                        className={`text-xs font-medium uppercase tracking-wider mb-1 ${
                          derivedPhases[2]?.status === "completed"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : derivedPhases[2]?.status === "in-progress"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-500"
                        }`}
                      >
                        Phase 3
                      </div>
                      <div className="font-semibold text-foreground mb-1 text-sm">
                        {derivedPhases[2]?.name || "Testing"}
                      </div>
                      <div
                        className={`text-xs flex items-center gap-1.5 ${
                          derivedPhases[2]?.status === "completed"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : derivedPhases[2]?.status === "in-progress"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-500"
                        }`}
                      >
                        {derivedPhases[2]?.status === "completed" && (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        {derivedPhases[2]?.status === "in-progress" && (
                          <Circle className="w-3.5 h-3.5 fill-current" />
                        )}
                        {derivedPhases[2]?.status === "completed"
                          ? "Completed"
                          : derivedPhases[2]?.status === "in-progress"
                          ? "Active"
                          : "Pending"}
                      </div>
                    </div>

                    {/* Phase 4 */}
                    <div
                      className={`p-4 rounded-lg border-l-4 ${
                        derivedPhases[3]?.status === "completed"
                          ? "bg-emerald-50 dark:bg-emerald-950/30 border-l-emerald-500"
                          : derivedPhases[3]?.status === "in-progress"
                          ? "bg-blue-50 dark:bg-blue-950/30 border-l-blue-500"
                          : "bg-gray-50 dark:bg-gray-800/30 border-l-transparent"
                      }`}
                    >
                      <div
                        className={`text-xs font-medium uppercase tracking-wider mb-1 ${
                          derivedPhases[3]?.status === "completed"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : derivedPhases[3]?.status === "in-progress"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-500"
                        }`}
                      >
                        Phase 4
                      </div>
                      <div className="font-semibold text-foreground mb-1 text-sm">
                        {derivedPhases[3]?.name || "Deployment"}
                      </div>
                      <div
                        className={`text-xs flex items-center gap-1.5 ${
                          derivedPhases[3]?.status === "completed"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : derivedPhases[3]?.status === "in-progress"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-500"
                        }`}
                      >
                        {derivedPhases[3]?.status === "completed" && (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        {derivedPhases[3]?.status === "in-progress" && (
                          <Circle className="w-3.5 h-3.5 fill-current" />
                        )}
                        {derivedPhases[3]?.status === "completed"
                          ? "Completed"
                          : derivedPhases[3]?.status === "in-progress"
                          ? "Active"
                          : "Pending"}
                      </div>
                    </div>
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
                    {
                      derivedTasks.filter((t) => t.status === "completed")
                        .length
                    }{" "}
                    of {derivedTasks.length} tasks completed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion
                    type="single"
                    collapsible
                    defaultValue={activePhase?.id}
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
                                className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-card hover:bg-accent/60 transition-colors cursor-pointer"
                                onClick={(e) =>
                                  handleTaskClick(e, task.uniqueKey, task.title)
                                }
                              >
                                {task.status === "completed" ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                ) : (
                                  <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
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
                                {task.verified && (
                                  <Badge className="h-6 px-2 text-[10px] bg-emerald-500 text-white">
                                    Verified
                                  </Badge>
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
              {/* Client Info Card - Top of sidebar */}
              <ClientInfoCard client={project?.owner} />
              <ClientAboutCard
                client={project?.owner}
                project={project}
                onUpdateLink={async (newLink) => {
                  const response = await authFetch(`/projects/${projectId}`, {
                    method: "PATCH",
                    body: JSON.stringify({ externalLink: newLink }),
                  });
                  if (response.ok) {
                    const data = await response.json();
                    setProject((prev) => ({
                      ...prev,
                      externalLink: data.data.externalLink,
                    }));
                    toast.success("Project link updated");
                  } else {
                    toast.error("Failed to update link");
                  }
                }}
              />

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
                              <p className="leading-relaxed whitespace-pre-wrap wrap-break-word">
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
                      {docs.map((doc, idx) => {
                        const isImage =
                          doc.type?.startsWith("image/") ||
                          doc.url?.match(/\.(jpg|jpeg|png|webp|gif)$/i);
                        return (
                          <a
                            key={idx}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm p-2 border border-border/60 rounded bg-muted/20 hover:bg-muted/40 transition-colors"
                          >
                            {isImage ? (
                              <Image className="w-4 h-4 text-blue-500 shrink-0" />
                            ) : (
                              <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                            )}
                            <span className="truncate flex-1">{doc.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {doc.createdAt
                                ? format(new Date(doc.createdAt), "MMM d, yyyy")
                                : ""}
                            </span>
                          </a>
                        );
                      })}
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
                      {project?.currency || "₹"}
                      {totalBudget.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-border/60">
                    <span>Paid</span>
                    <span className="font-semibold text-emerald-600">
                      {project?.currency || "₹"}
                      {spentBudget.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Remaining</span>
                    <span className="font-semibold text-foreground">
                      {project?.currency || "₹"}
                      {remainingBudget.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
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
                        { dayOfWeek: [0] }, // Disable Sundays only (Enable Saturday)
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

const FreelancerProjectDetail = () => {
  return <FreelancerProjectDetailContent />;
};

export default FreelancerProjectDetail;
