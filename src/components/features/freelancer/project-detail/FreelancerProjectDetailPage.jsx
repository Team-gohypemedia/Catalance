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
import Clock from "lucide-react/dist/esm/icons/clock";
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
import FreelancerProjectDetailDialogs from "./FreelancerProjectDetailDialogs";
import FreelancerProjectDetailHeader from "./FreelancerProjectDetailHeader";
import FreelancerProjectDetailMainColumn from "./FreelancerProjectDetailMainColumn";
import FreelancerProjectDetailSidebar from "./FreelancerProjectDetailSidebar";
import ProjectDetailSkeleton from "./ProjectDetailSkeleton";

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

const extractNarrativeSection = (description = "", sectionLabel = "", nextSectionLabels = []) => {
  const source = String(description || "");
  if (!source.trim() || !sectionLabel) return "";

  const startRegex = new RegExp(`${sectionLabel}\\s*:?\\s*`, "i");
  const startMatch = source.match(startRegex);
  if (!startMatch || typeof startMatch.index !== "number") return "";

  const startIndex = startMatch.index + startMatch[0].length;
  let endIndex = source.length;

  nextSectionLabels.forEach((label) => {
    if (!label) return;
    const regex = new RegExp(`${label}\\s*:?`, "i");
    const slice = source.slice(startIndex);
    const match = slice.match(regex);
    if (match && typeof match.index === "number") {
      endIndex = Math.min(endIndex, startIndex + match.index);
    }
  });

  return source
    .slice(startIndex, endIndex)
    .replace(/^[\s-]+/, "")
    .replace(/[\s-]+$/, "")
    .trim();
};

const toNarrativeBulletItems = (value = "") =>
  String(value || "")
    .split(/\s+-\s+|[\r\n]+|•/)
    .map((item) =>
      item
        .replace(/^[\s-]+/, "")
        .replace(/[\s-]+$/, "")
        .trim(),
    )
    .filter((item) => item.length > 2);

const websiteDetailDuplicatePrefixes = [
  "website type",
  "pages",
  "design style",
  "client",
  "frontend",
  "frontend framework",
  "backend",
  "backend technology",
  "database",
  "website build type",
  "hosting",
  "page count",
  "launch timeline",
  "budget",
];

const removeWebsiteDetailDuplicates = (items = []) =>
  items.filter((item) => {
    const normalized = String(item || "").trim().toLowerCase();
    if (!normalized) return false;

    return !websiteDetailDuplicatePrefixes.some((prefix) =>
      normalized.startsWith(`${prefix}:`),
    );
  });

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
  const [taskCompletionConfirm, setTaskCompletionConfirm] = useState({
    open: false,
    uniqueKey: "",
    taskTitle: "",
  });
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
          status: "pending-review",
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

  const toggleTaskCompletion = async (uniqueKey, taskTitle) => {
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

    if (project?.id && authFetch) {
      try {
        const payload = {
          completedTasks: newCompleted,
        };

        // Notify client only when freelancer submits task for review.
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

        if (isMarkingComplete) {
          toast.success("Task submitted for client review.");
        } else {
          toast.info("Task moved back to pending.");
        }
      } catch (error) {
        console.error("Failed to save task state:", error);
        toast.error("Failed to update task status.");
      }
    }
  };

  // Handle task click to toggle completion with explicit freelancer confirmation.
  const handleTaskClick = async (e, uniqueKey, taskTitle) => {
    e.stopPropagation();
    e.preventDefault();

    if (verifiedTaskIds.has(uniqueKey)) {
      toast.error("Cannot change status of a verified task");
      return;
    }

    const isCurrentlyCompleted = completedTaskIds.has(uniqueKey);

    if (!isCurrentlyCompleted) {
      setTaskCompletionConfirm({
        open: true,
        uniqueKey,
        taskTitle: taskTitle || "this task",
      });
      return;
    }

    await toggleTaskCompletion(uniqueKey, taskTitle);
  };

  const handleConfirmTaskCompletion = async () => {
    const { uniqueKey, taskTitle } = taskCompletionConfirm;
    if (!uniqueKey) return;

    setTaskCompletionConfirm({ open: false, uniqueKey: "", taskTitle: "" });
    await toggleTaskCompletion(uniqueKey, taskTitle);
  };

  const totalBudget = useMemo(() => {
    return getFreelancerVisibleBudgetValue(project?.budget) ?? 0;
  }, [project]);

  const paidAmountFromApi = useMemo(
    () => Math.max(0, Number(paymentData?.totalPaid) || 0),
    [paymentData],
  );

  const paidAmountFromPhase = useMemo(() => {
    if (!totalBudget || !Array.isArray(derivedPhases) || derivedPhases.length === 0) {
      return 0;
    }

    const milestones = [
      { phaseOrder: 1, percentage: 20 },
      { phaseOrder: 2, percentage: 40 },
      { phaseOrder: 4, percentage: 40 },
    ];

    const firstIncompletePhaseIndex = derivedPhases.findIndex(
      (phase) => phase?.status !== "completed",
    );
    const currentPhaseIndex =
      firstIncompletePhaseIndex >= 0
        ? firstIncompletePhaseIndex
        : Math.max(derivedPhases.length - 1, 0);
    const currentPhaseOrder = currentPhaseIndex + 1;
    const currentPhaseStatus = String(derivedPhases[currentPhaseIndex]?.status || "");

    const paidPercent = milestones.reduce((sum, milestone) => {
      const isPaid =
        milestone.phaseOrder < currentPhaseOrder ||
        (milestone.phaseOrder === currentPhaseOrder && currentPhaseStatus === "completed");
      return sum + (isPaid ? milestone.percentage : 0);
    }, 0);

    return Math.round((totalBudget * paidPercent) / 100);
  }, [derivedPhases, totalBudget]);

  const spentBudget = useMemo(() => {
    // Prefer API values, but fall back to phase-derived payout when API summary is stale.
    return Math.max(paidAmountFromApi, paidAmountFromPhase);
  }, [paidAmountFromApi, paidAmountFromPhase]);

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
    const acceptedProposal = project?.proposals?.find((proposal) => proposal?.status === "ACCEPTED");
    const service =
      project?.serviceName ||
      acceptedProposal?.serviceName ||
      project?.serviceType ||
      acceptedProposal?.serviceType ||
      project?.serviceKey ||
      acceptedProposal?.serviceKey ||
      extractField("Service") ||
      extractField("Service Type") ||
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

    const businessName =
      project?.businessName ||
      project?.companyName ||
      project?.brandName ||
      project?.owner?.businessName ||
      project?.owner?.companyName ||
      project?.owner?.brandName ||
      acceptedProposal?.businessName ||
      acceptedProposal?.companyName ||
      acceptedProposal?.brandName ||
      extractField("Business Name") ||
      extractField("Company Name") ||
      extractField("Brand Name") ||
      "";

          const sanitizedOverview = overview
            .replace(/\bPrimary\s+Objectives\b\s*:?\s*[\s\S]*$/i, "")
            .replace(/\bFeatures\s*\/\s*Deliverables\s*Included\b\s*:?\s*[\s\S]*$/i, "")
            .replace(/\bFeatures\s*\/\s*Deliverables\b\s*:?\s*[\s\S]*$/i, "")
            .replace(/\bDeliverables\s*Included\b\s*:?\s*[\s\S]*$/i, "")
            .trim();

    const primaryObjectivesRaw = extractNarrativeSection(
      description,
      "Primary Objectives",
      ["Features/Deliverables Included", "Features/Deliverables", "Deliverables Included"],
    );
    const featuresDeliverablesRaw =
      extractNarrativeSection(description, "Features/Deliverables Included") ||
      extractNarrativeSection(description, "Features/Deliverables") ||
      extractNarrativeSection(description, "Deliverables Included");

    const primaryObjectives = toNarrativeBulletItems(primaryObjectivesRaw);
    const featuresDeliverables = removeWebsiteDetailDuplicates(
      toNarrativeBulletItems(featuresDeliverablesRaw),
    );

    return {
      service,
      budget,
      clientName,
      timeline,
      overview: sanitizedOverview,
      businessName,
      primaryObjectives,
      featuresDeliverables,
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
        label: "Phase 1 / Kickoff Payout",
        phaseOrder: 1,
        percentage: 20,
        note: "Released to you after kickoff is approved.",
      },
      {
        id: "review",
        label: "Phase 2 / Progress Payout",
        phaseOrder: 2,
        percentage: 40,
        note: "Released to you after the mid-project review is approved.",
      },
      {
        id: "handover",
        label: "Phase 4 / Final Payout",
        phaseOrder: 4,
        percentage: 40,
        note: "Released to you once final handover is approved.",
      },
    ];

    const hasPhaseProgress = Array.isArray(derivedPhases) && derivedPhases.length > 0;
    const firstIncompletePhaseIndex = hasPhaseProgress
      ? derivedPhases.findIndex((phase) => phase?.status !== "completed")
      : -1;
    const currentPhaseIndex = hasPhaseProgress
      ? firstIncompletePhaseIndex >= 0
        ? firstIncompletePhaseIndex
        : Math.max(derivedPhases.length - 1, 0)
      : -1;
    const currentPhaseOrder = currentPhaseIndex >= 0 ? currentPhaseIndex + 1 : null;

    return milestones.map((milestone, index) => {
      const amount = Math.round((totalBudget * milestone.percentage) / 100);
      const isPaidByPhase =
        hasPhaseProgress &&
        currentPhaseOrder !== null &&
        (milestone.phaseOrder < currentPhaseOrder ||
          (milestone.phaseOrder === currentPhaseOrder &&
            String(derivedPhases[currentPhaseIndex]?.status || "") === "completed"));

      const isCurrentByPhase =
        hasPhaseProgress && currentPhaseOrder !== null && milestone.phaseOrder === currentPhaseOrder;

      const fallbackThresholdPercent =
        milestones
          .slice(0, index + 1)
          .reduce((sum, item) => sum + (Number(item.percentage) || 0), 0) / 100;
      const fallbackPreviousThresholdPercent =
        milestones
          .slice(0, index)
          .reduce((sum, item) => sum + (Number(item.percentage) || 0), 0) / 100;
      const isPaidByAmount = amount > 0 && spentBudget >= totalBudget * fallbackThresholdPercent;
      const isCurrentByAmount =
        !isPaidByAmount &&
        amount > 0 &&
        spentBudget >= totalBudget * fallbackPreviousThresholdPercent;

      const isPaid = hasPhaseProgress ? isPaidByPhase : isPaidByAmount;
      const isCurrent = hasPhaseProgress ? isCurrentByPhase : isCurrentByAmount;

      return {
        ...milestone,
        amount,
        status: isPaid ? "paid" : isCurrent ? "active" : "scheduled",
      };
    });
  }, [derivedPhases, spentBudget, totalBudget]);

  const pageTitle =
    String(
      projectDetailSnapshot?.businessName ||
      project?.businessName ||
      project?.companyName ||
      project?.brandName ||
      project?.owner?.businessName ||
      project?.owner?.companyName ||
      project?.owner?.brandName ||
      project?.title ||
      "Project Dashboard",
    )
      .replace(/^(business name|company name|brand name|client name)\s*:\s*/i, "")
      .replace(/\s*service\s*type\s*:\s*.*$/i, "")
      .trim();

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
          <FreelancerProjectDetailHeader
            pageTitle={pageTitle}
            activeProjectManager={activeProjectManager}
            project={project}
            projectId={projectId}
            isFallback={isFallback}
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
            <FreelancerProjectDetailMainColumn
              projectDetailSnapshot={projectDetailSnapshot}
              insetPanelClassName={projectInsetPanelClassName}
              panelClassName={projectPanelClassName}
              eyebrowClassName={projectSectionEyebrowClassName}
              subheadingClassName={projectSectionSubheadingClassName}
              overallProgress={overallProgress}
              derivedPhases={derivedPhases}
              derivedTasks={derivedTasks}
              project={project}
              activePhase={activePhase}
              tasksByPhase={tasksByPhase}
              getPhaseIcon={getPhaseIcon}
              handleTaskClick={handleTaskClick}
            />
            <FreelancerProjectDetailSidebar
              panelClassName={projectPanelClassName}
              insetPanelClassName={projectInsetPanelClassName}
              eyebrowClassName={projectSectionEyebrowClassName}
              subheadingClassName={projectSectionSubheadingClassName}
              project={project}
              handleProjectLinkUpdate={handleProjectLinkUpdate}
              messages={messages}
              input={input}
              setInput={setInput}
              handleSendMessage={handleSendMessage}
              isSending={isSending}
              fileInputRef={fileInputRef}
              handleFileUpload={handleFileUpload}
              docs={docs}
              formatAttachmentSize={formatAttachmentSize}
              totalBudget={totalBudget}
              spentBudget={spentBudget}
              remainingBudget={remainingBudget}
              billingRoadmap={billingRoadmap}
              milestoneDraft={milestoneDraft}
              setMilestoneDraft={setMilestoneDraft}
              milestoneFileInputRef={milestoneFileInputRef}
              milestoneFile={milestoneFile}
              handleMilestoneFileChange={handleMilestoneFileChange}
              isSubmittingMilestone={isSubmittingMilestone}
              submitMilestoneForReview={submitMilestoneForReview}
              submittedMilestones={submittedMilestones}
            />
          </div>
        </div>
      </main>
        </div>
      </div>
            <FreelancerProjectDetailDialogs
        taskCompletionConfirm={taskCompletionConfirm}
        setTaskCompletionConfirm={setTaskCompletionConfirm}
        handleConfirmTaskCompletion={handleConfirmTaskCompletion}
        reportOpen={reportOpen}
        setReportOpen={setReportOpen}
        reportDialogContentRef={reportDialogContentRef}
        activeProjectManager={activeProjectManager}
        issueText={issueText}
        setIssueText={setIssueText}
        date={date}
        setDate={setDate}
        time={time}
        setTime={setTime}
        datePopoverOpen={datePopoverOpen}
        setDatePopoverOpen={setDatePopoverOpen}
        effectiveTimeSlots={effectiveTimeSlots}
        availableTimeSlots={availableTimeSlots}
        handleReport={handleReport}
        isReporting={isReporting}
        detailOpen={detailOpen}
        setDetailOpen={setDetailOpen}
        renderProjectDescription={renderProjectDescription}
      />
    </>
  );
};

const FreelancerProjectDetailPage = () => <FreelancerProjectDetailContent />;

export default FreelancerProjectDetailPage;