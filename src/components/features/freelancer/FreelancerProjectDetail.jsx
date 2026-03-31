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
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import Circle from "lucide-react/dist/esm/icons/circle";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import IndianRupee from "lucide-react/dist/esm/icons/indian-rupee";
import Send from "lucide-react/dist/esm/icons/send";
import Upload from "lucide-react/dist/esm/icons/upload";
import FileText from "lucide-react/dist/esm/icons/file-text";
import CalendarIcon from "lucide-react/dist/esm/icons/calendar";
import Headset from "lucide-react/dist/esm/icons/headset";
import Mail from "lucide-react/dist/esm/icons/mail";
import Phone from "lucide-react/dist/esm/icons/phone";
import Image from "lucide-react/dist/esm/icons/image";
import Link2 from "lucide-react/dist/esm/icons/link-2";
import Check from "lucide-react/dist/esm/icons/check";
import CheckCheck from "lucide-react/dist/esm/icons/check-check";
import Pencil from "lucide-react/dist/esm/icons/pencil";
import X from "lucide-react/dist/esm/icons/x";
import Flag from "lucide-react/dist/esm/icons/flag";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import { ProjectNotepad } from "@/components/ui/notepad";

import FreelancerWorkspaceHeader from "@/components/features/freelancer/FreelancerWorkspaceHeader";
import { useAuth } from "@/shared/context/AuthContext";
import { getSopFromTitle } from "@/shared/data/sopTemplates";
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
import format from "date-fns/format";
import isToday from "date-fns/isToday";
import isYesterday from "date-fns/isYesterday";
import isSameDay from "date-fns/isSameDay";
import { formatINR, getFreelancerVisibleBudgetValue } from "@/shared/lib/currency";
import { extractStructuredFieldValue } from "@/shared/lib/labeled-fields";
import { cn } from "@/shared/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const DEFAULT_MEETING_TIME_SLOTS = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
];

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

const mapStatus = (status = "") => {
  const normalized = status.toString().toUpperCase();
  if (normalized === "COMPLETED") return "completed";
  if (normalized === "IN_PROGRESS" || normalized === "OPEN")
    return "in-progress";
  return "pending";
};

const projectPanelClassName =
  "rounded-[26px] border border-white/[0.08] bg-[#171717] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]";
const projectInsetPanelClassName =
  "rounded-[20px] border border-white/[0.08] bg-[#111111] px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]";
const projectSectionEyebrowClassName =
  "text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground";
const projectSectionSubheadingClassName = "text-white";
const projectDetailFieldNames = [
  "Service",
  "Project",
  "Client",
  "Website type",
  "Website Type",
  "Website Build Type",
  "Tech stack",
  "Pages",
  "Timeline",
  "Launch Timeline",
  "Budget",
  "Next Steps",
  "Summary",
  "Project Overview",
  "Deliverables",
  "Pages & Features",
  "Core pages",
  "Core pages included",
  "Additional pages",
  "Additional pages/features",
  "Integrations",
  "Payment Gateway",
  "Designs",
  "Design Style",
  "Hosting",
  "Domain",
  "Deployment",
  "Frontend Framework",
  "Frontend",
  "Backend Technology",
  "Backend",
  "Database",
];

const readProjectDetailField = (description = "", fieldName = "") =>
  extractStructuredFieldValue(description, fieldName, projectDetailFieldNames)
    ?.replace(/^[\s-]+/, "")
    ?.replace(/[\s-]+$/, "")
    ?.trim() || "";

const parseProjectDetailList = (value = "") =>
  String(value || "")
    .split(/[,•]/)
    .map((item) =>
      item
        .replace(/^[\s-]+/, "")
        .replace(/[\s-]+$/, "")
        .trim(),
    )
    .filter(
      (item) =>
        item.length > 1 &&
        !item.includes(":") &&
        !item.toLowerCase().includes("additional") &&
        !item.toLowerCase().includes("pages"),
    );

const formatAttachmentSize = (size) => {
  const numericSize = Number(size);
  if (!Number.isFinite(numericSize) || numericSize <= 0) return null;

  const units = ["B", "KB", "MB", "GB"];
  let unitIndex = 0;
  let value = numericSize;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const ClientInfoCard = ({ client, project, onUpdateLink }) => {
  if (!client) return null;

  return (
    <Card className={projectPanelClassName}>
      <CardHeader className="pb-3">
        <CardTitle className={projectSectionEyebrowClassName}>
          Client Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-11 w-11 border border-white/[0.08] bg-[#111111]">
            <AvatarImage src={client.avatar} alt={client.fullName} />
            <AvatarFallback className="bg-[#111111] text-white">
              {(client.fullName || "C").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-white">
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

        <div className="border-t border-white/[0.06] pt-4">
          <ClientAboutCard
            client={client}
            project={project}
            onUpdateLink={onUpdateLink}
          />
        </div>
      </CardContent>
    </Card>
  );
};

const ClientAboutCard = ({ client, project, onUpdateLink }) => {
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

  if (!client) return null;

  const displayLink = project?.externalLink || client?.portfolio;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white">About</h3>

      <div className="space-y-2.5">
        {/* Project Link with Edit Mode */}
        <div className="flex flex-col gap-2">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={linkValue}
                  onChange={(e) => setLinkValue(e.target.value)}
                  className="h-9 border-white/[0.08] bg-[#111111] pl-9 text-sm text-white"
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
            <div className="group relative min-h-6 flex items-center">
              {displayLink ? (
                <a
                  href={displayLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 break-all pr-8 text-sm font-medium text-primary hover:underline"
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
  const milestoneFileInputRef = useRef(null);
  const reportDialogContentRef = useRef(null);
  const [milestoneDraft, setMilestoneDraft] = useState({
    title: "",
    githubUrl: "",
    figmaUrl: "",
    notes: "",
  });
  const [milestoneFile, setMilestoneFile] = useState(null);
  const [isSubmittingMilestone, setIsSubmittingMilestone] = useState(false);

  // Dispute Report State
  const [reportOpen, setReportOpen] = useState(false);
  const [issueText, setIssueText] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  const [date, setDate] = useState();
  const [time, setTime] = useState("");
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [availabilityManager, setAvailabilityManager] = useState(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [serverAvailableSlots, setServerAvailableSlots] = useState([]);

  useEffect(() => {
    if (!date || !authFetch) {
      setServerAvailableSlots([]);
      return;
    }

    const fetchAvailability = async () => {
      try {
        const query = new URLSearchParams({
          date: format(date, "yyyy-MM-dd"),
          projectId: project?.id || projectId,
        }).toString();
        const res = await authFetch(`/disputes/availability?${query}`);
        if (res.ok) {
          const payload = await res.json();
          setServerAvailableSlots(Array.isArray(payload.data) ? payload.data : []);
          setAvailabilityManager(payload.manager || null);
        } else {
          setServerAvailableSlots([]);
        }
      } catch (e) {
        console.error("Failed to fetch availability", e);
        setServerAvailableSlots([]);
      }
    };
    fetchAvailability();
  }, [date, authFetch, project?.id, projectId]);

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
        let hours = Number(time.split(":")[0]);
        if (period === "PM" && hours !== 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;
        return hours > currentHour;
      });
    }

    return slots;
  }, [date, serverAvailableSlots]);

  const effectiveTimeSlots = useMemo(() => {
    if (!date) return [];
    return availableTimeSlots.length > 0
      ? availableTimeSlots
      : DEFAULT_MEETING_TIME_SLOTS;
  }, [date, availableTimeSlots]);

  useEffect(() => {
    if (time && !effectiveTimeSlots.includes(time)) {
      setTime("");
    }
  }, [effectiveTimeSlots, time]);

  useEffect(() => {
    if (!reportOpen) {
      setDatePopoverOpen(false);
    }
  }, [reportOpen]);

  const activeProjectManager = useMemo(() => {
    if (
      project?.manager?.role === "PROJECT_MANAGER" &&
      project?.manager?.status === "ACTIVE"
    ) {
      return project.manager;
    }
    if (
      availabilityManager?.role === "PROJECT_MANAGER" &&
      availabilityManager?.status === "ACTIVE"
    ) {
      return availabilityManager;
    }
    return null;
  }, [project?.manager, availabilityManager]);

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
    let meetingHour = undefined;
    const meetingDateLocal = date ? format(date, "yyyy-MM-dd") : undefined;

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
        meetingHour = hours;
        combined.setHours(hours, minutes, 0, 0);
      } else {
        combined.setHours(9, 0, 0, 0);
        meetingHour = 9;
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
          meetingDateLocal,
          meetingHour,
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
        setDatePopoverOpen(false);
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

  const handleMilestoneFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setMilestoneFile(file);
  };

  const normalizeUrl = (value = "") => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    return `https://${raw}`;
  };

  const submitMilestoneForReview = async () => {
    if (!conversationId || !authFetch) {
      toast.error("Chat is not ready yet. Please try again in a moment.");
      return;
    }

    const title = milestoneDraft.title.trim();
    const githubUrl = normalizeUrl(milestoneDraft.githubUrl);
    const figmaUrl = normalizeUrl(milestoneDraft.figmaUrl);
    const notes = milestoneDraft.notes.trim();

    if (!title) {
      toast.error("Add a milestone title before submitting.");
      return;
    }

    if (!milestoneFile && !githubUrl && !figmaUrl) {
      toast.error("Attach a file or add a GitHub/Figma link for review.");
      return;
    }

    setIsSubmittingMilestone(true);
    try {
      let attachment = null;
      if (milestoneFile) {
        const formData = new FormData();
        formData.append("file", milestoneFile);
        const uploadResponse = await authFetch("/upload/chat", {
          method: "POST",
          body: formData,
          skipLogoutOn401: true,
        });
        if (!uploadResponse.ok) {
          throw new Error("Failed to upload milestone file");
        }
        const uploadPayload = await uploadResponse.json();
        const fileUrl = uploadPayload?.data?.url || uploadPayload?.url;
        attachment = {
          name: milestoneFile.name,
          size: milestoneFile.size,
          type: milestoneFile.type,
          url: fileUrl,
        };
      }

      const lines = [
        "[Milestone Submission]",
        `Title: ${title}`,
      ];
      if (githubUrl) lines.push(`GitHub: ${githubUrl}`);
      if (figmaUrl) lines.push(`Figma: ${figmaUrl}`);
      if (notes) lines.push(`Notes: ${notes}`);
      const content = lines.join("\n");

      const serviceKey =
        project?.ownerId && user?.id
          ? `CHAT:${project?.id || projectId}:${project.ownerId}:${user.id}`
          : `project:${project?.id || projectId}`;

      await authFetch(`/chat/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          service: serviceKey,
          senderRole: "FREELANCER",
          senderName: user?.fullName || user?.name || user?.email || "Freelancer",
          attachment,
          skipAssistant: true,
        }),
      });

      setMilestoneDraft({
        title: "",
        githubUrl: "",
        figmaUrl: "",
        notes: "",
      });
      setMilestoneFile(null);
      if (milestoneFileInputRef.current) {
        milestoneFileInputRef.current.value = "";
      }
      toast.success("Milestone submitted for PM review.");
      fetchMessages();
    } catch (error) {
      console.error("Failed to submit milestone", error);
      toast.error(error?.message || "Failed to submit milestone");
    } finally {
      setIsSubmittingMilestone(false);
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

  const submittedMilestones = useMemo(() => {
    return messages
      .filter((message) => message.sender === "user")
      .filter((message) => String(message.text || "").includes("[Milestone Submission]"))
      .map((message, index) => ({
        id: message.id || `milestone-${index}`,
        text: message.text,
        attachment: message.attachment,
        createdAt: message.createdAt || message.timestamp,
      }))
      .slice(-4)
      .reverse();
  }, [messages]);

  const activeSOP = useMemo(() => {
    return getSopFromTitle(project?.title);
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
    const allTasks = activeSOP.tasks;

    return phases.map((phase) => {
      const phaseTasks = allTasks.filter((t) => t.phase === phase.id);
      const totalPhaseTasks = phaseTasks.length;

      const verifiedCount = phaseTasks.filter((t) =>
        verifiedTaskIds.has(`${t.phase}-${t.id}`)
      ).length;

      const progress =
        totalPhaseTasks > 0
          ? Math.round((verifiedCount / totalPhaseTasks) * 100)
          : 0;

      let status = "pending";
      if (progress >= 100) status = "completed";
      else if (verifiedCount > 0) status = "in-progress";

      return {
        ...phase,
        name: phase.name.replace(/\s*\(\s*Phase-\d+\s*\)/i, "").trim(),
        status,
        progress,
      };
    });
  }, [activeSOP, verifiedTaskIds]);

  const derivedTasks = useMemo(() => {
    const tasks = activeSOP.tasks;
    // Show ALL tasks from all phases
    return tasks.map((task) => {
      // Use unique key combining phase and task id
      const uniqueKey = `${task.phase}-${task.id}`;
      const isCompleted = completedTaskIds.has(uniqueKey);
      const isVerified = verifiedTaskIds.has(uniqueKey);
      const taskPhase = derivedPhases.find((p) => p.id === task.phase);

      // Check if task is verified (highest priority)
      if (isVerified) {
        return {
          ...task,
          uniqueKey,
          status: "completed",
          verified: true,
          phaseName: taskPhase?.name,
        };
      }

      // Check if task is manually completed by user
      if (isCompleted) {
        return {
          ...task,
          uniqueKey,
          status: "completed",
          verified: false,
          phaseName: taskPhase?.name,
        };
      }

      return {
        ...task,
        uniqueKey,
        status: "pending",
        verified: false,
        phaseName: taskPhase?.name,
      };
    });
  }, [derivedPhases, activeSOP, completedTaskIds, verifiedTaskIds]);

  // Group tasks by phase for display
  const tasksByPhase = useMemo(() => {
    // Group tasks by phase ID
    const grouped = {};
    derivedTasks.forEach((task) => {
      if (!grouped[task.phase]) grouped[task.phase] = [];
      grouped[task.phase].push(task);
    });

    // Iterate sorted phases to build groups and calculate locks
    let isPrevPhaseComplete = true; // First phase is always unlocked

    return derivedPhases.map((phase) => {
      const tasks = grouped[phase.id] || [];
      const isLocked = !isPrevPhaseComplete;

      // Determine completion for THIS phase (for next iteration)
      // A phase is complete if it has tasks AND all are verified
      const isComplete = tasks.length > 0 && tasks.every((t) => t.verified);

      // Update check for next phase
      isPrevPhaseComplete = isComplete;

      return {
        phaseId: phase.id,
        phaseName: phase.name,
        phaseStatus: phase.status,
        tasks,
        isLocked,
      };
    });
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

  const pageTitle = project?.title
    ? `Project: ${project.title}`
    : "Project Dashboard";

  const totalBudget = useMemo(() => {
    return getFreelancerVisibleBudgetValue(project?.budget) ?? 0;
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

  const projectDetailSnapshot = useMemo(() => {
    const description = String(project?.description || "").trim();
    const extractField = (fieldName) => readProjectDetailField(description, fieldName);
    const service =
      extractField("Service") ||
      extractField("Website type") ||
      project?.title ||
      "Not specified";
    const budget =
      extractField("Budget") ||
      (totalBudget > 0 ? formatINR(totalBudget) : "Not set");
    const clientName =
      project?.owner?.fullName ||
      project?.client ||
      extractField("Client") ||
      "Not specified";
    const timeline =
      extractField("Timeline") ||
      extractField("Launch Timeline") ||
      "Not set";
    const websiteType =
      extractField("Website type") ||
      extractField("Website Type") ||
      service;
    const designStyle =
      extractField("Design Style") ||
      extractField("Designs") ||
      extractField("Website Build Type");
    const frontend =
      extractField("Frontend Framework") ||
      extractField("Frontend") ||
      extractField("Tech stack");
    const backend =
      extractField("Backend Technology") ||
      extractField("Backend") ||
      extractField("Deployment");
    const database = extractField("Database");
    const techStack = extractField("Tech stack");
    const summary =
      extractField("Summary") ||
      extractField("Project Overview") ||
      "";

    const corePages = parseProjectDetailList(
      extractField("Core pages included") || extractField("Core pages"),
    );
    const additionalPages = parseProjectDetailList(
      extractField("Additional pages/features") ||
        extractField("Additional pages"),
    );
    const pagesField = extractField("Pages");
    const allPages = [...corePages, ...additionalPages];
    const pageSummary = pagesField || (allPages.length ? `${allPages.length} pages` : "Not specified");

    const overview =
      summary ||
      (description
        ? description
            .split(/\r?\n/)
            .map((line) => line.trim())
            .find(
              (line) =>
                line &&
                !projectDetailFieldNames.some((field) =>
                  line.toLowerCase().startsWith(`${field.toLowerCase()}:`),
                ),
            ) || ""
        : "");

    return {
      service,
      budget,
      clientName,
      timeline,
      overview,
      websiteDetails: [
        { label: "Website Type", value: websiteType || "Not specified" },
        { label: "Pages", value: pageSummary },
        { label: "Design Style", value: designStyle || "Not specified" },
        { label: "Client", value: clientName },
        { label: "Frontend", value: frontend || techStack || "Not specified" },
        { label: "Backend", value: backend || "Not specified" },
        { label: "Database", value: database || "Not specified" },
      ],
      pageTags: allPages,
    };
  }, [project, totalBudget]);

  const billingRoadmap = useMemo(() => {
    const milestones = [
      {
        id: "kickoff",
        label: "Phase 1 / Kickoff Payment",
        percentage: 20,
        note: "Unlocks project kickoff and initial delivery work.",
      },
      {
        id: "review",
        label: "Phase 2 / Progress Review",
        percentage: 40,
        note: "Shared after the mid-project review and approval.",
      },
      {
        id: "handover",
        label: "Phase 4 / Final Handover",
        percentage: 40,
        note: "Released once the final handover is approved.",
      },
    ];

    let previousThreshold = 0;

    return milestones.map((milestone, index) => {
      const amount = Math.round((totalBudget * milestone.percentage) / 100);
      const threshold = previousThreshold + amount;
      const isPaid = spentBudget >= threshold && amount > 0;
      const isCurrent =
        !isPaid &&
        amount > 0 &&
        (spentBudget >= previousThreshold || (index === 0 && spentBudget <= 0));

      previousThreshold = threshold;

      return {
        ...milestone,
        amount,
        status: isPaid ? "paid" : isCurrent ? "active" : "scheduled",
      };
    });
  }, [spentBudget, totalBudget]);

  const handleProjectLinkUpdate = useCallback(
    async (newLink) => {
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
        return;
      }

      toast.error("Failed to update link");
    },
    [authFetch, projectId],
  );

  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-[#f1f5f9]">
        <div className="mx-auto flex min-h-screen w-full max-w-[1536px] flex-col px-4 sm:px-6 lg:px-[40px] xl:w-[85%] xl:max-w-none">
          <FreelancerWorkspaceHeader
            profile={{
              avatar: user?.avatar,
              name: String(user?.fullName || user?.name || "Freelancer").trim() || "Freelancer",
            }}
            activeWorkspaceKey="projects"
            primaryActionLabel="Projects"
            primaryActionTo="/freelancer/project"
          />
        </div>
        <ProjectDetailSkeleton />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background text-[#f1f5f9]">
        <div className="mx-auto flex min-h-screen w-full max-w-[1536px] flex-col px-4 sm:px-6 lg:px-[40px] xl:w-[85%] xl:max-w-none">
          <FreelancerWorkspaceHeader
            profile={{
              avatar: user?.avatar,
              name: String(user?.fullName || user?.name || "Freelancer").trim() || "Freelancer",
            }}
            activeWorkspaceKey="projects"
            primaryActionLabel="Projects"
            primaryActionTo="/freelancer/project"
          />

          <main className="relative flex-1 space-y-5 pb-10 pt-4 sm:space-y-6 sm:pb-12 sm:pt-6">
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
                  We are waiting for the client to complete the initial 20% payment
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
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1.5">
              <h1 className="text-[clamp(1.85rem,4vw,2.75rem)] font-semibold leading-[1.02] tracking-[-0.05em] text-white">
                {pageTitle}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isLoading
                  ? "Loading project details..."
                  : isFallback
                  ? "Previewing layout with sample data."
                  : "Track project progress and deliverables in one place."}
              </p>
              {!isLoading && (
                <p className="text-xs text-muted-foreground/80">
                  {activeProjectManager
                    ? `Project Catalyst: ${activeProjectManager.fullName}`
                    : "Project Catalyst: Not assigned yet"}
                </p>
              )}
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto sm:self-start sm:flex-nowrap">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    className="h-9 gap-2 rounded-full bg-primary px-4 text-primary-foreground shadow-none hover:bg-primary/90"
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

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Service Type", value: projectDetailSnapshot.service },
                  { label: "Budget", value: projectDetailSnapshot.budget },
                  { label: "Timeline", value: projectDetailSnapshot.timeline },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`${projectInsetPanelClassName} min-w-0 bg-[#171717]`}
                  >
                    <p className={projectSectionEyebrowClassName}>{item.label}</p>
                    <p className="mt-3 break-words text-sm font-semibold tracking-[-0.02em] text-white sm:text-[15px]">
                      {item.value || "Not specified"}
                    </p>
                  </div>
                ))}
              </div>

              <Card className={projectPanelClassName}>
                <CardHeader className="pb-3">
                  <CardTitle className={projectSectionEyebrowClassName}>
                    <span className="inline-flex items-center gap-2 align-middle">
                      <span className="relative inline-flex size-[15px] shrink-0 items-center justify-center">
                        <span className="absolute inset-0 rounded-full bg-[#10b981]/10" />
                        <span className="absolute inset-0 rounded-full bg-[#10b981]/20 animate-ping" />
                        <span className="relative block size-[6px] rounded-full bg-[#10b981]" />
                      </span>
                      <span>Overview</span>
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="px-2 py-1">
                    <p className="text-sm leading-7 text-[#d4d4d8] text-justify">
                      {projectDetailSnapshot.overview ||
                        "Project scope, priorities, and delivery context will appear here once the brief is fully structured."}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className={projectPanelClassName}>
                <CardHeader className="px-4 pb-3 pt-4 sm:px-6 sm:pt-5">
                  <CardTitle className={projectSectionEyebrowClassName}>
                    Website Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-4 pb-4 pt-1 sm:px-6 sm:pb-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    {projectDetailSnapshot.websiteDetails.map((item) => {
                      const val = item.value || "Not specified";
                      const isList = val.includes(" - ") || val.match(/^[-•]\s/m);

                      return (
                        <div
                          key={item.label}
                          className={`min-h-[70px] min-w-0 border-l border-white/[0.08] pl-4 flex flex-col justify-start py-1 ${
                            isList ? "sm:col-span-2" : ""
                          }`}
                        >
                          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            {item.label}
                          </p>
                          {(() => {
                            if (isList) {
                              const listItems = val
                                .split(/\s+-\s+|\r?\n/)
                                .map((entry) => entry.replace(/^[-•]\s*/, "").trim())
                                .filter(Boolean);

                              if (listItems.length > 1) {
                                return (
                                  <ul className="mt-4 grid gap-x-8 gap-y-3 list-none pl-0 sm:grid-cols-2">
                                    {listItems.map((listItem, index) => (
                                      <li
                                        key={`${item.label}-${index}`}
                                        className="relative pl-[1.125rem] text-sm font-medium leading-relaxed text-white"
                                      >
                                        <span className="absolute left-0 top-[0.6rem] h-1 w-1 rounded-full bg-white/40" />
                                        {listItem}
                                      </li>
                                    ))}
                                  </ul>
                                );
                              }
                            }

                            return (
                              <p className="mt-1.5 break-words whitespace-pre-wrap text-sm font-medium leading-6 text-white">
                                {val}
                              </p>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                  {projectDetailSnapshot.pageTags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {projectDetailSnapshot.pageTags.map((page) => (
                        <span
                          key={page}
                          className="inline-flex items-center rounded-full border border-white/[0.08] bg-[#111111] px-3 py-1 text-[11px] font-medium text-[#cfd3da]"
                        >
                          {page}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card className={projectPanelClassName}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className={projectSectionEyebrowClassName}>
                    Project Progress
                  </CardTitle>
                  <span className="text-lg font-semibold text-primary">
                    {Math.round(overallProgress)}% Complete
                  </span>
                </CardHeader>
                <CardContent className="space-y-5 pt-0">
                  <div className="relative">
                    <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
                      <div
                        className="h-full rounded-full transition-all duration-300 bg-linear-to-r from-amber-500 via-yellow-400 to-amber-400"
                        style={{ width: `${overallProgress}%` }}
                      />
                    </div>
                    <div
                      className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white/70 bg-white shadow-md transition-all duration-300"
                      style={{ left: `calc(${overallProgress}% - 8px)` }}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {derivedPhases.slice(0, 4).map((phase, index) => {
                      const isCompleted = phase?.status === "completed";
                      const isActive = phase?.status === "in-progress";

                      return (
                        <div
                          key={phase?.id || `project-phase-${index + 1}`}
                          className={cn(
                            "rounded-[18px] border px-4 py-4",
                            isCompleted
                              ? "border-emerald-500/25 bg-emerald-500/10"
                              : isActive
                                ? "border-primary/20 bg-primary/10"
                                : "border-white/[0.08] bg-[#111111]",
                          )}
                        >
                          <p
                            className={cn(
                              "text-[0.68rem] font-semibold uppercase tracking-[0.18em]",
                              isCompleted
                                ? "text-emerald-300"
                                : isActive
                                  ? "text-primary"
                                  : "text-muted-foreground",
                            )}
                          >
                            Phase {index + 1}
                          </p>
                          <p className="mt-2 text-sm font-semibold leading-6 text-white">
                            {phase?.name || "Pending phase"}
                          </p>
                          <div
                            className={cn(
                              "mt-3 inline-flex items-center gap-2 text-xs font-medium",
                              isCompleted
                                ? "text-emerald-300"
                                : isActive
                                  ? "text-primary"
                                : "text-muted-foreground",
                            )}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : isActive ? (
                              <Circle className="h-3.5 w-3.5 fill-current" />
                            ) : (
                              <Circle className="h-3.5 w-3.5" />
                            )}
                            {isCompleted ? "Completed" : isActive ? "In Progress" : "Pending"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className={projectPanelClassName}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className={projectSectionEyebrowClassName}>
                        Project Description
                      </CardTitle>
                      <CardDescription className={cn("mt-2", projectSectionSubheadingClassName)}>
                        {derivedTasks.filter((t) => t.status === "completed").length} of{" "}
                        {derivedTasks.length} tasks completed
                      </CardDescription>
                    </div>
                    <div className="min-w-[120px] space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        <span>Progress</span>
                        <span>{Math.round(overallProgress)}%</span>
                      </div>
                      <Progress
                        value={overallProgress}
                        className="h-1.5 bg-white/[0.08]"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  {project?.notes ? (
                    <div className="mb-4 flex items-start gap-2 rounded-[18px] border border-amber-500/20 bg-amber-500/8 px-4 py-3">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                      <p className="text-sm leading-6 text-[#f3e4b2]">
                        <span className="font-medium text-white">Note:</span> {project.notes}
                      </p>
                    </div>
                  ) : null}
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
                        className="border-white/[0.06]"
                      >
                        <AccordionTrigger className="py-4 hover:no-underline">
                          <div className="flex items-center gap-3 flex-1">
                            {getPhaseIcon(phaseGroup.phaseStatus)}
                            <div className="flex-1 text-left">
                              <div className="text-sm font-semibold text-white">
                                Phase {phaseGroup.phaseId}:{" "}
                                {phaseGroup.phaseName}
                              </div>
                              <div className="text-xs text-[#8f96a3]">
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
                                  ? "border-emerald-500/10 bg-emerald-500/15 text-emerald-200"
                                  : "border-white/[0.08] bg-[#111111] text-[#cfd3da]"
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
                                className={`flex items-center gap-3 rounded-[16px] border border-white/[0.06] bg-[#111111] p-3.5 transition-colors ${
                                  phaseGroup.isLocked
                                    ? "pointer-events-none opacity-50"
                                    : "cursor-pointer hover:bg-white/[0.03]"
                                }`}
                                onClick={(e) =>
                                  !phaseGroup.isLocked &&
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
                                      ? "text-muted-foreground line-through"
                                      : "text-white"
                                  }`}
                                >
                                  {task.title}
                                  {phaseGroup.isLocked && (
                                    <span className="ml-2 inline-block text-xs font-medium text-amber-400 no-underline">
                                      (Locked)
                                    </span>
                                  )}
                                </span>
                                {task.verified && (
                                  <Badge className="h-6 border-emerald-500/10 bg-emerald-500/15 px-2 text-[10px] text-emerald-200">
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
              <ClientInfoCard
                client={project?.owner}
                project={project}
                onUpdateLink={handleProjectLinkUpdate}
              />

              <Card className={cn(projectPanelClassName, "overflow-hidden")}>
                <CardHeader className="border-b border-white/[0.06] pb-3">
                  <CardTitle className={projectSectionEyebrowClassName}>
                    Project Chat
                  </CardTitle>
                  <CardDescription className={projectSectionSubheadingClassName}>
                    Ask questions and share documents
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-[320px] space-y-3 overflow-y-auto px-4 py-4">
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
                          <div className="my-4 flex justify-center">
                            <span className="rounded-full border border-white/[0.06] bg-[#111111] px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
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
                            className={`flex max-w-[88%] flex-col overflow-hidden rounded-2xl px-4 py-2.5 text-sm ${
                              isSelf
                                ? "rounded-tr-sm bg-primary text-primary-foreground shadow-sm"
                                : "rounded-tl-sm border border-white/[0.06] bg-[#111111] text-white"
                            }`}
                          >
                            {message.sender === "other" &&
                              message.senderName && (
                                <span className="mb-1 block text-[10px] text-muted-foreground">
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
                                      className="max-w-45 max-h-45 rounded-lg object-cover"
                                    />
                                  </a>
                                ) : (
                                  <a
                                    href={message.attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-2 rounded-lg p-2 transition-colors ${
                                      !isSelf
                                        ? "border border-white/[0.06] bg-white/[0.04]"
                                        : "bg-black/10"
                                    }`}
                                  >
                                    <FileText className="h-4 w-4 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium truncate max-w-35">
                                        {message.attachment.name || "File"}
                                      </p>
                                    </div>
                                  </a>
                                )}
                              </div>
                            )}

                            <div className="mt-1 flex items-center justify-end gap-1 self-end">
                              <span className="whitespace-nowrap text-[10px] opacity-70">
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
                <div className="flex gap-2 border-t border-white/[0.06] p-3">
                  <Input
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="h-10 border-white/[0.08] bg-[#111111] text-sm text-white placeholder:text-[#6b7280]"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    size="sm"
                    variant="outline"
                    className="h-10 w-10 border-white/[0.08] bg-[#111111] p-0 text-[#cfd3da] hover:bg-white/[0.04]"
                    disabled={isSending}
                    title="Upload document"
                  >
                    <Upload className="h-4 w-4" />
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
                    className="h-10 w-10 p-0"
                    disabled={isSending}
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </Card>

              <Card className={projectPanelClassName}>
                <CardHeader className="pb-3">
                  <CardTitle className={projectSectionEyebrowClassName}>
                    Client Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {docs.length > 0 ? (
                    docs.slice(0, 6).map((doc, idx) => {
                      const isImage =
                        doc.type?.startsWith("image/") ||
                        doc.url?.match(/\.(jpg|jpeg|png|webp|gif)$/i);
                      const fileSize = formatAttachmentSize(doc.size);

                      return (
                        <a
                          key={idx}
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 rounded-[16px] border border-white/[0.06] bg-[#111111] px-3 py-3 text-sm transition-colors hover:bg-white/[0.03]"
                        >
                          <span
                            className={cn(
                              "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                              isImage ? "bg-emerald-500/12" : "bg-primary/10",
                            )}
                          >
                            {isImage ? (
                              <Image className="h-4 w-4 text-emerald-300" />
                            ) : (
                              <FileText className="h-4 w-4 text-primary" />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-white">
                              {doc.name}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {[fileSize, doc.createdAt ? format(new Date(doc.createdAt), "MMM d, yyyy") : null]
                                .filter(Boolean)
                                .join(" • ")}
                            </p>
                          </div>
                        </a>
                      );
                    })
                  ) : (
                    <p className="text-sm text-white">
                      No documents attached yet. Upload project documentation
                      here.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className={projectPanelClassName}>
                <CardHeader className="pb-3">
                  <CardTitle className={cn(projectSectionEyebrowClassName, "flex items-center gap-2")}>
                    <IndianRupee className="h-3.5 w-3.5" />
                    Budget Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0 text-sm text-white">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <span>Total Budget</span>
                    <span className="font-semibold text-white">
                      {project?.currency || "₹"}
                      {totalBudget.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <span>Spent</span>
                    <span className="font-semibold text-emerald-400">
                      {project?.currency || "₹"}
                      {spentBudget.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Remaining</span>
                    <span className="font-semibold text-white">
                      {project?.currency || "₹"}
                      {remainingBudget.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className={projectPanelClassName}>
                <CardHeader className="pb-3">
                  <CardTitle className={projectSectionEyebrowClassName}>
                    Billing Roadmap
                  </CardTitle>
                  <CardDescription className={projectSectionSubheadingClassName}>
                    20% to start, 40% after phase 2, and the final 40% after phase 4.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {billingRoadmap.map((milestone) => (
                    <div
                        key={milestone.id}
                        className={cn(
                          projectInsetPanelClassName,
                          "space-y-3 p-4",
                          milestone.status === "active" && "border-primary/25 bg-primary/10",
                          milestone.status === "paid" && "border-emerald-500/20 bg-emerald-500/10",
                        )}
                      >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            {milestone.label}
                          </p>
                          <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">
                            {project?.currency || "₹"}
                            {milestone.amount.toLocaleString()}
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            "border px-2.5 py-1 text-[10px] font-medium",
                            milestone.status === "paid" &&
                              "border-emerald-500/10 bg-emerald-500/15 text-emerald-200",
                            milestone.status === "active" &&
                              "border-primary/10 bg-primary/15 text-primary",
                            milestone.status === "scheduled" &&
                              "border-white/[0.08] bg-[#111111] text-muted-foreground",
                          )}
                        >
                          {milestone.status === "paid"
                            ? "Completed"
                            : milestone.status === "active"
                              ? "Active"
                              : "Scheduled"}
                        </Badge>
                      </div>
                      <p className="text-xs leading-5 text-muted-foreground">
                        {milestone.note}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className={projectPanelClassName}>
                <CardHeader className="pb-3">
                  <CardTitle className={projectSectionEyebrowClassName}>
                    Submit Milestone
                  </CardTitle>
                  <CardDescription className={projectSectionSubheadingClassName}>
                    Send deliverables, GitHub links, and Figma files for review.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <Input
                    value={milestoneDraft.title}
                    onChange={(event) =>
                      setMilestoneDraft((prev) => ({
                        ...prev,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Milestone title (required)"
                    className="h-10 border-white/[0.08] bg-[#111111] text-sm text-white placeholder:text-[#6b7280]"
                  />
                  <Input
                    value={milestoneDraft.githubUrl}
                    onChange={(event) =>
                      setMilestoneDraft((prev) => ({
                        ...prev,
                        githubUrl: event.target.value,
                      }))
                    }
                    placeholder="GitHub link (optional)"
                    className="h-10 border-white/[0.08] bg-[#111111] text-sm text-white placeholder:text-[#6b7280]"
                  />
                  <Input
                    value={milestoneDraft.figmaUrl}
                    onChange={(event) =>
                      setMilestoneDraft((prev) => ({
                        ...prev,
                        figmaUrl: event.target.value,
                      }))
                    }
                    placeholder="Figma link (optional)"
                    className="h-10 border-white/[0.08] bg-[#111111] text-sm text-white placeholder:text-[#6b7280]"
                  />
                  <Textarea
                    value={milestoneDraft.notes}
                    onChange={(event) =>
                      setMilestoneDraft((prev) => ({
                        ...prev,
                        notes: event.target.value,
                      }))
                    }
                    placeholder="Notes for PM (scope, QA checklist, known gaps)"
                    className="min-h-24 border-white/[0.08] bg-[#111111] text-sm text-white placeholder:text-[#6b7280]"
                  />

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 gap-2 border-white/[0.08] bg-[#111111] text-[#cfd3da] hover:bg-white/[0.04]"
                      onClick={() => milestoneFileInputRef.current?.click()}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {milestoneFile ? "Replace file" : "Attach file"}
                    </Button>
                    {milestoneFile ? (
                      <p className="truncate text-xs text-[#8f96a3]">
                        {milestoneFile.name}
                      </p>
                    ) : (
                      <p className="text-xs text-[#8f96a3]">No file attached</p>
                    )}
                    <input
                      ref={milestoneFileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleMilestoneFileChange}
                      accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.zip"
                    />
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    className="w-full gap-2"
                    disabled={isSubmittingMilestone}
                    onClick={submitMilestoneForReview}
                  >
                    {isSubmittingMilestone ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Flag className="h-4 w-4" />
                    )}
                    Submit for Review
                  </Button>

                  {submittedMilestones.length > 0 ? (
                    <div className="space-y-2 pt-2">
                      <p className="text-xs uppercase tracking-[0.2em] text-[#8f96a3]">
                        Recent Submissions
                      </p>
                      {submittedMilestones.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-[16px] border border-white/[0.06] bg-[#111111] p-3"
                        >
                          <p className="line-clamp-2 text-xs text-white">
                            {item.text}
                          </p>
                          <p className="mt-1 text-[10px] text-[#8f96a3]">
                            {item.createdAt
                              ? format(new Date(item.createdAt), "MMM d, h:mm a")
                              : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
        </div>
      </div>
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent
          ref={reportDialogContentRef}
          className="sm:max-w-md max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>Contact your Project Catalyst</DialogTitle>
            <DialogDescription>
              Describe the issue or dispute regarding this project. A Project
              Manager will get involved to resolve it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {activeProjectManager && (
              <div className="bg-muted/50 p-3 rounded-md mb-2 border flex items-center gap-3">
                <Avatar className="h-10 w-10 border bg-background">
                  <AvatarImage
                    src={activeProjectManager.avatar}
                    alt={activeProjectManager.fullName}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    PM
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground mb-1">
                    {activeProjectManager.fullName}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="w-3 h-3" />
                    <span>{activeProjectManager.email}</span>
                  </div>
                  {activeProjectManager.phone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <Phone className="w-3 h-3" />
                      <span>{activeProjectManager.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {!activeProjectManager && (
              <div className="rounded-md border border-dashed border-border/70 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                No active project manager is assigned to this project yet.
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Add Note</label>
              <Textarea
                placeholder="Add a note..."
                value={issueText}
                onChange={(e) => setIssueText(e.target.value)}
                className="min-h-25 whitespace-pre-wrap break-all"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Project Manager Availability
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Popover
                    open={datePopoverOpen}
                    onOpenChange={setDatePopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-60 justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      container={reportDialogContentRef.current ?? undefined}
                      align="start"
                      className="w-auto p-0 z-70"
                    >
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(selectedDate) => {
                          setDate(selectedDate);
                          setTime("");
                          if (selectedDate) {
                            setDatePopoverOpen(false);
                          }
                        }}
                        initialFocus
                        disabled={[
                          { dayOfWeek: [0] },
                          { before: new Date(new Date().setHours(0, 0, 0, 0)) },
                        ]}
                        className="rounded-md"
                      />
                    </PopoverContent>
                  </Popover>

                  <div className="w-35">
                    <select
                      value={time}
                      onChange={(event) => setTime(event.target.value)}
                      disabled={!date}
                      className={cn(
                        "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm",
                        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        !time && "text-muted-foreground"
                      )}
                    >
                      <option value="">
                        {date
                          ? effectiveTimeSlots.length > 0
                            ? "Select time"
                            : "No slots"
                          : "Select date first"}
                      </option>
                      {effectiveTimeSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {date && availableTimeSlots.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Manager has no configured slots for this date. Using default
                    working-hour options.
                  </p>
                )}
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
    </>
  );
};

const FreelancerProjectDetail = () => {
  return <FreelancerProjectDetailContent />;
};

export default FreelancerProjectDetail;

