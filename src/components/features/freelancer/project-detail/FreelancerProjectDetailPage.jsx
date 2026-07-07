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
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import Circle from "lucide-react/dist/esm/icons/circle";
import Clock from "lucide-react/dist/esm/icons/clock";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import IndianRupee from "lucide-react/dist/esm/icons/indian-rupee";
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
import { ProjectNotepad } from "@/components/ui/notepad";

import FreelancerWorkspaceHeader from "@/components/features/freelancer/FreelancerWorkspaceHeader";
import { useAuth } from "@/shared/context/AuthContext";
import { getSopFromTitle } from "@/shared/data/sopTemplates";
import {
  resolveUserDisplayName,
  resolveUserSecondaryLabel,
} from "@/shared/lib/user-display";
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
import IDEWorkspaceModal from "./IDEWorkspaceModal";

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
  "rounded-2xl border border-border bg-card shadow-none dark:border-white/[0.08] dark:bg-[#171717]";
const projectInsetPanelClassName =
  "rounded-xl border border-border bg-muted px-3.5 py-3 dark:border-white/[0.08] dark:bg-[#111111]";
const projectSectionEyebrowClassName =
  "text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground";
const projectSectionSubheadingClassName = "text-foreground dark:text-white";
const projectDetailFieldNames = [
  "Client Name",
  "Business Name",
  "Company Name",
  "Brand Name",
  "Service",
  "Service Type",
  "Project",
  "Client",
  "Website type",
  "Website Type",
  "Website Build Type",
  "Tech stack",
  "Pages",
  "Page Count",
  "Timeline",
  "Launch Timeline",
  "Budget",
  "Next Steps",
  "Summary",
  "Project Overview",
  "Primary Objectives",
  "Deliverables",
  "Features/Deliverables Included",
  "Pages & Features",
  "Core pages",
  "Core pages included",
  "Additional pages",
  "Additional pages/features",
  "Integrations",
  "Payment Gateway",
  "Designs",
  "Design Style",
  "Reference Designs",
  "Engagement Model",
  "Delivery Timeline",
  "Volume",
  "Creative Type",
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
  const [aiUsage, setAiUsage] = useState(null);
  const [isAuditingHeader, setIsAuditingHeader] = useState(false);
  const fileInputRef = useRef(null);


  const reportDialogContentRef = useRef(null);
  const isUpdatingTaskRef = useRef(false);
  const lastMutationTimeRef = useRef(0);

  // IDE Workspace state
  const [ideOpen, setIdeOpen] = useState(false);
  const [ideRepoState, setIdeRepoState] = useState({ repoUrl: null, repoFullName: null, isNewRepo: false });

  const handleOpenIDE = useCallback(({ repoUrl, repoFullName, isNewRepo }) => {
    setIdeRepoState({ repoUrl, repoFullName, isNewRepo });
    setIdeOpen(true);
  }, []);


  const handleRepoLinked = useCallback((url) => {
    // When a repo is linked, update project's externalLink locally
    setProject((prev) => prev ? { ...prev, externalLink: url } : prev);
  }, []);

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
    return availableTimeSlots;
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
          <div className="mt-4 p-4 bg-primary/10 dark:bg-primary/90/30 border border-primary/20 dark:border-primary/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-primary dark:text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-primary dark:text-primary">
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
      if (availableTimeSlots.length === 0) {
        toast.error(
          "No Project Manager slots are available on that date. Choose another date or clear the date to submit without scheduling."
        );
        return;
      }

      if (!time) {
        toast.error(
          "Select an available time or clear the date to submit without scheduling."
        );
        return;
      }

      fullDescription += `\n\nDate of Issue: ${format(date, "PPP")}`;

      // Combine for structural save
      const combined = new Date(date);
      fullDescription += `\nTime: ${time}`;
      const [timeStr, period] = time.split(" ");
      let [hours, minutes] = timeStr.split(":").map(Number);
      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;
      meetingHour = hours;
      combined.setHours(hours, minutes, 0, 0);
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

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          payload?.message ||
            payload?.error ||
            "Failed to raise dispute."
        );
      }

      toast.success(
        "Dispute raised. A Project Manager will review it shortly."
      );
      setReportOpen(false);
      setIssueText("");
      setDate(undefined);
      setTime("");
      setDatePopoverOpen(false);
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Error raising dispute");
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
    const fetchProject = async (isBackground = false) => {
      const fetchStartTime = Date.now();
      if (isBackground && isUpdatingTaskRef.current) return;
      if (!isBackground) setIsLoading(true);
      try {
        const response = await authFetch(`/proposals?t=${Date.now()}`);
        const payload = await response.json().catch(() => null);
        
        // Ignore stale fetch results if a mutation occurred during or right after the request started,
        // or if a mutation was very recent (within 10 seconds, to allow backend replica sync).
        if (
          fetchStartTime < lastMutationTimeRef.current || 
          isUpdatingTaskRef.current ||
          Date.now() - lastMutationTimeRef.current < 10000
        ) {
          return;
        }

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
            customSop: typeof match.project.customSop === "string" 
              ? (() => { try { return JSON.parse(match.project.customSop); } catch { return null; } })()
              : (match.project.customSop || null),
          });
          setIsFallback(false);

          // Load saved task progress from database
          if (Array.isArray(match.project.completedTasks)) {
            setCompletedTaskIds(new Set(match.project.completedTasks));
          }
          if (Array.isArray(match.project.verifiedTasks)) {
            setVerifiedTaskIds(new Set(match.project.verifiedTasks));
          }
        } else if (active && !isBackground) {
          setProject(null);
          setIsFallback(true);
        }
      } catch (error) {
        console.error("Failed to load freelancer project detail:", error);
        if (active && !isBackground) {
          setProject(null);
          setIsFallback(true);
        }
      } finally {
        if (active && !isBackground) {
          setIsLoading(false);
        }
      }
    };

    fetchProject();
    const interval = setInterval(() => fetchProject(true), 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [authFetch, isAuthenticated, projectId]);

  // Fetch payment and AI usage data from API
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

    const fetchAiUsage = async () => {
      try {
        const res = await authFetch(`/github/usage/${project.id}`);
        if (res.ok) {
          const data = await res.json();
          setAiUsage(data);
        }
      } catch (error) {
        console.error("Failed to fetch AI usage:", error);
      }
    };

    fetchPayments();
    fetchAiUsage();

    const interval = setInterval(fetchAiUsage, 10000); // refresh usage stats
    return () => clearInterval(interval);
  }, [project?.id, authFetch]);

  const handleTriggerAuditHeader = async () => {
    setIsAuditingHeader(true);
    const toastId = toast.loading("Initiating AI Quality & Security Audit...");
    try {
      const res = await authFetch("/github/repo/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Audit failed");
      toast.success("AI Code Quality & Security Audit Complete! 🛡️", { id: toastId });
      
      // Auto-reload window to display updated audits
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error(err);
      toast.error(`Auditing failed: ${err.message}`, { id: toastId });
    } finally {
      setIsAuditingHeader(false);
    }
  };



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
            resolveUserDisplayName(user, "Freelancer"),
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
              resolveUserDisplayName(user, "Freelancer"),
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
    return project?.customSop || getSopFromTitle(project?.title);
  }, [project?.title, project?.customSop]);

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
      const allPhaseTasks = allTasks.filter((t) => t.phase === phase.id);
      const phaseTasks = allPhaseTasks.filter((t) => !t.isHeld);
      const totalPhaseTasks = phaseTasks.length;

      const verifiedCount = phaseTasks.filter((t) =>
        verifiedTaskIds.has(`${t.phase}-${t.id}`)
      ).length;

      let progress = 0;
      let status = "pending";

      if (allPhaseTasks.length > 0 && totalPhaseTasks === 0) {
        progress = 100;
        status = "completed";
      } else if (totalPhaseTasks > 0) {
        progress = Math.round((verifiedCount / totalPhaseTasks) * 100);
        if (progress >= 100) status = "completed";
        else if (verifiedCount > 0) status = "in-progress";
      }

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
      // A phase is complete if it has tasks AND all active tasks are verified
      const activeTasks = tasks.filter((t) => !t.isHeld);
      const isComplete =
        activeTasks.length > 0
          ? activeTasks.every((t) => t.verified)
          : tasks.length > 0;

      // Update check for next phase
      isPrevPhaseComplete = isComplete;

      return {
        phaseId: phase.id,
        phaseName: phase.name,
        phaseTimeline: phase.timeline,
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

    const prevCompleted = completedTaskIds;
    const updated = new Set(prevCompleted);
    let isMarkingComplete = false;
    
    if (updated.has(uniqueKey)) {
      updated.delete(uniqueKey);
    } else {
      updated.add(uniqueKey);
      isMarkingComplete = true;
    }
    const newCompleted = Array.from(updated);
    setCompletedTaskIds(updated);

    if (project?.id && authFetch) {
      isUpdatingTaskRef.current = true;
      try {
        isUpdatingTaskRef.current = true;
        lastMutationTimeRef.current = Date.now();
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

        const updateRes = await authFetch(`/projects/${project.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!updateRes.ok) {
          throw new Error("Failed to update task status on server.");
        }

        // Send automated chat message to notify the client
        if (isMarkingComplete && taskTitle && conversationId) {
          try {
            const serviceKey =
              project?.ownerId && user?.id
                ? `CHAT:${project?.id || projectId}:${project.ownerId}:${user.id}`
                : `project:${project?.id || projectId}`;

            await authFetch(`/chat/conversations/${conversationId}/messages`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                content: `I have completed the task: "${taskTitle}". Please review it when you have a moment.`,
                service: serviceKey,
                senderRole: "FREELANCER",
                senderName: resolveUserDisplayName(user, "Freelancer"),
                skipAssistant: true, 
              }),
            });
            
            // Add optimistic message to the chat view
            setMessages((prev) => [...prev, {
              id: Date.now().toString(),
              sender: "user",
              text: `I have completed the task: "${taskTitle}". Please review it when you have a moment.`,
              timestamp: new Date(),
              pending: true,
            }]);
          } catch (e) {
            console.error("Failed to send automated task completion message", e);
          }
        }

        if (isMarkingComplete) {
          toast.success("Task submitted for client review.");
        } else {
          toast.info("Task moved back to pending.");
        }
      } catch (error) {
        console.error("Failed to save task state:", error);
        toast.error("Failed to update task status.");
        // Revert local state on failure
        setCompletedTaskIds((prev) => {
          const reverted = new Set(prev);
          if (isMarkingComplete) {
            reverted.delete(uniqueKey);
          } else {
            reverted.add(uniqueKey);
          }
          return reverted;
        });
      } finally {
        isUpdatingTaskRef.current = false;
        lastMutationTimeRef.current = Date.now();
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
        isUnchecking: false,
      });
      return;
    } else {
      setTaskCompletionConfirm({
        open: true,
        uniqueKey,
        taskTitle: taskTitle || "this task",
        isUnchecking: true,
      });
      return;
    }
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

    const milestones = derivedPhases.length > 0
      ? derivedPhases.map((p, i) => ({ phaseOrder: Number(p.id) || (i + 1), percentage: p.progress || 0 }))
      : [
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
    const buildType =
      extractField("Website Build Type") ||
      extractField("Build Type") ||
      "Custom Dev";
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
    const featuresDeliverablesRaw =
      extractNarrativeSection(description, "Features/Deliverables Included") ||
      extractNarrativeSection(description, "Features/Deliverables") ||
      extractNarrativeSection(description, "Deliverables Included");
    const featuresDeliverables = removeWebsiteDetailDuplicates(
      toNarrativeBulletItems(featuresDeliverablesRaw),
    );

    const excludedLower = [
      "freelancer",
      "freelancer name",
      "service",
      "service type",
      "service name",
      "project",
      "projects",
      "client",
      "client name",
      "business name",
      "company name",
      "brand name",
      "summary",
      "project overview",
      "primary objectives",
      "budget",
      "timeline",
      "launch timeline",
    ];

    const topItems = [];
    const normalItems = [];
    const seenVals = new Set();

    for (const field of projectDetailFieldNames) {
      if (excludedLower.includes(field.toLowerCase())) continue;
      const val = extractField(field);
      if (val && !seenVals.has(val.toLowerCase())) {
        const item = { label: field, value: val };
        const isList = val.includes(" - ") || val.match(/^[-•]\s/m);
        if (isList) {
          topItems.push(item);
        } else {
          normalItems.push(item);
        }
        seenVals.add(val.toLowerCase());
      }
    }

    const websiteDetails = [...topItems, ...normalItems];

    // fallback if absolutely empty
    if (websiteDetails.length === 0 && (websiteType || designStyle || frontend || backend)) {
      websiteDetails.push(
        { label: "Category", value: websiteType || "Not specified" },
        { label: "Visual Style", value: designStyle || "Not specified" },
        { label: "Frontend", value: frontend || techStack || "Not specified" },
        { label: "Backend", value: backend || "Not specified" }
      );
    }

    return {
      service,
      budget,
      clientName,
      timeline,
      overview: sanitizedOverview,
      businessName,
      featuresDeliverables,
      websiteDetails,
      pageTags: allPages,
    };
  }, [project, totalBudget]);

  const billingRoadmap = useMemo(() => {
    const milestones = derivedPhases.length > 0
      ? derivedPhases.map((p, i) => ({
          id: `phase-${p.id}`,
          label: p.name || `Phase ${i + 1} Payout`,
          phaseOrder: Number(p.id) || (i + 1),
          percentage: p.progress || 0,
          note: `Payout for Phase ${i + 1}.`,
        }))
      : [
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
            note: "Released upon final handover and closure.",
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
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
          <FreelancerWorkspaceHeader
            profile={{
              avatar: user?.avatar,
              name: resolveUserDisplayName(user, "Freelancer"),
              email: resolveUserSecondaryLabel(user),
              available: user?.available,
              openToWork:
                typeof user?.freelancerProfile?.openToWork === "boolean"
                  ? user.freelancerProfile.openToWork
                  : typeof user?.openToWork === "boolean"
                    ? user.openToWork
                    : typeof user?.available === "boolean"
                      ? user.available
                      : undefined,
            }}
            activeWorkspaceKey="projects"
            primaryActionLabel="Projects"
            primaryActionTo="/freelancer/project"
          />
          <ProjectDetailSkeleton />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
          <FreelancerWorkspaceHeader
            profile={{
              avatar: user?.avatar,
              name: resolveUserDisplayName(user, "Freelancer"),
              email: resolveUserSecondaryLabel(user),
              available: user?.available,
              openToWork:
                typeof user?.freelancerProfile?.openToWork === "boolean"
                  ? user.freelancerProfile.openToWork
                  : typeof user?.openToWork === "boolean"
                    ? user.openToWork
                    : typeof user?.available === "boolean"
                      ? user.available
                      : undefined,
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
                <div className="p-6 rounded-full bg-primary/10/10 mb-4 animate-pulse mx-auto w-fit">
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
                <div className="w-full space-y-5">
          <FreelancerProjectDetailHeader
            pageTitle={pageTitle}
            activeProjectManager={activeProjectManager}
            project={project}
            projectId={projectId}
            isFallback={isFallback}
            isAuditing={isAuditingHeader}
            onTriggerAudit={handleTriggerAuditHeader}
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
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
              billingRoadmap={billingRoadmap}
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
              onOpenIDE={handleOpenIDE}
              onRepoLinked={handleRepoLinked}
              aiUsage={aiUsage}
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

      {/* GitHub VS Code IDE full-screen modal */}
      <IDEWorkspaceModal
        isOpen={ideOpen}
        onClose={() => setIdeOpen(false)}
        repoUrl={ideRepoState.repoUrl}
        repoFullName={ideRepoState.repoFullName}
        project={project}
      />
    </>
  );
};

const FreelancerProjectDetailPage = () => <FreelancerProjectDetailContent />;

export default FreelancerProjectDetailPage;
