"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Circle from "lucide-react/dist/esm/icons/circle";
import Clock from "lucide-react/dist/esm/icons/clock";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import Star from "lucide-react/dist/esm/icons/star";
import CalendarIcon from "lucide-react/dist/esm/icons/calendar";
import Link2 from "lucide-react/dist/esm/icons/link-2";
import Info from "lucide-react/dist/esm/icons/info";
import Headset from "lucide-react/dist/esm/icons/headset";
import Mail from "lucide-react/dist/esm/icons/mail";
import Phone from "lucide-react/dist/esm/icons/phone";
import IndianRupee from "lucide-react/dist/esm/icons/indian-rupee";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import Send from "lucide-react/dist/esm/icons/send";
import Upload from "lucide-react/dist/esm/icons/upload";
import FileCode2 from "lucide-react/dist/esm/icons/file-code-2";
import FileImage from "lucide-react/dist/esm/icons/file-image";
import FileSpreadsheet from "lucide-react/dist/esm/icons/file-spreadsheet";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Check from "lucide-react/dist/esm/icons/check";
import CheckCheck from "lucide-react/dist/esm/icons/check-check";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import NotebookText from "lucide-react/dist/esm/icons/notebook-text";
import Presentation from "lucide-react/dist/esm/icons/presentation";
import { ProjectNotepad } from "@/components/ui/notepad";
import BookAppointment from "@/components/features/appointments/BookAppointment";
import ClientDashboardFooter from "@/components/features/client/ClientDashboardFooter";
import { Input } from "@/components/ui/input";
import ClientWorkspaceHeader from "@/components/features/client/ClientWorkspaceHeader";
import { getSopFromTitle } from "@/shared/data/sopTemplates";
import { useAuth } from "@/shared/context/AuthContext";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { extractStructuredFieldValue } from "@/shared/lib/labeled-fields";
import {
  buildPhaseOrderMap,
  getPhaseOrder,
  isCompletedPhaseLockedAfterAdvance,
  isPhaseOrderLockedByPayment,
  isTaskPhaseLockedByPayment,
} from "@/shared/lib/project-verification-gates";
import { cn } from "@/shared/lib/utils";
import { formatINR } from "@/shared/lib/currency";
import { processProjectInstallmentPayment } from "@/shared/lib/project-payment";
import { hasUnlockedProjectChat } from "@/shared/lib/project-chat-access";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ClientProjectDetailDialogs from "./ClientProjectDetailDialogs";
import ClientProjectDetailHeader from "./ClientProjectDetailHeader";
import ClientProjectDetailMainColumn from "./ClientProjectDetailMainColumn";
import ClientProjectDetailSidebar from "./ClientProjectDetailSidebar";
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

const MAX_FREELANCER_CHANGE_REQUESTS = 2;
const CATALYST_REQUEST_TYPES = {
  GENERAL: "general",
  FREELANCER_CHANGE: "freelancer-change",
};

const projectPanelClassName =
  "rounded-[26px] border border-white/[0.08] bg-[#171717] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]";
const projectInsetPanelClassName =
  "rounded-[20px] border border-white/[0.08] bg-[#111111] px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]";
const projectSectionEyebrowClassName =
  "text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground";
const projectSectionSubheadingClassName = "text-white";
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
    .split(/[,•\r\n]+/)
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

const PROJECT_DOCUMENT_TYPE_STYLES = {
  pdf: {
    label: "PDF",
    Icon: FileText,
    accentClassName: "bg-[#442828]",
    badgeClassName: "border-[#bf4c50] bg-[#532d2f] text-[#ff7075]",
  },
  ppt: {
    label: "PPT",
    Icon: Presentation,
    accentClassName: "bg-[#453022]",
    badgeClassName: "border-[#d98a45] bg-[#513223] text-[#ff9a43]",
  },
  pptx: {
    label: "PPT",
    Icon: Presentation,
    accentClassName: "bg-[#453022]",
    badgeClassName: "border-[#d98a45] bg-[#513223] text-[#ff9a43]",
  },
  xls: {
    label: "XLS",
    Icon: FileSpreadsheet,
    accentClassName: "bg-[#243a2f]",
    badgeClassName: "border-[#52cf7f] bg-[#1f3429] text-[#4ef58a]",
  },
  xlsx: {
    label: "XLSX",
    Icon: FileSpreadsheet,
    accentClassName: "bg-[#243a2f]",
    badgeClassName: "border-[#52cf7f] bg-[#1f3429] text-[#4ef58a]",
  },
  csv: {
    label: "CSV",
    Icon: FileCode2,
    accentClassName: "bg-[#24304b]",
    badgeClassName: "border-[#5d97ff] bg-[#23365a] text-[#69a7ff]",
  },
  doc: {
    label: "DOC",
    Icon: FileText,
    accentClassName: "bg-[#292d52]",
    badgeClassName: "border-[#7b84ff] bg-[#2a3161] text-[#8b92ff]",
  },
  docx: {
    label: "DOCX",
    Icon: FileText,
    accentClassName: "bg-[#292d52]",
    badgeClassName: "border-[#7b84ff] bg-[#2a3161] text-[#8b92ff]",
  },
  md: {
    label: "MD",
    Icon: NotebookText,
    accentClassName: "bg-[#303030]",
    badgeClassName: "border-[#8f8f8f] bg-[#2b2b2b] text-[#d8d3cf]",
  },
  txt: {
    label: "TXT",
    Icon: NotebookText,
    accentClassName: "bg-[#303030]",
    badgeClassName: "border-[#8f8f8f] bg-[#2b2b2b] text-[#d8d3cf]",
  },
  jpg: {
    label: "IMG",
    Icon: FileImage,
    accentClassName: "bg-[#26383d]",
    badgeClassName: "border-[#56c9c7] bg-[#1f3236] text-[#65ede9]",
  },
  jpeg: {
    label: "IMG",
    Icon: FileImage,
    accentClassName: "bg-[#26383d]",
    badgeClassName: "border-[#56c9c7] bg-[#1f3236] text-[#65ede9]",
  },
  png: {
    label: "IMG",
    Icon: FileImage,
    accentClassName: "bg-[#26383d]",
    badgeClassName: "border-[#56c9c7] bg-[#1f3236] text-[#65ede9]",
  },
  webp: {
    label: "IMG",
    Icon: FileImage,
    accentClassName: "bg-[#26383d]",
    badgeClassName: "border-[#56c9c7] bg-[#1f3236] text-[#65ede9]",
  },
  default: {
    label: "FILE",
    Icon: FileText,
    accentClassName: "bg-[#303030]",
    badgeClassName: "border-[#8f8f8f] bg-[#2b2b2b] text-[#d8d3cf]",
  },
};

const getProjectDocumentExtension = (doc = {}) => {
  const source = `${doc?.name || ""} ${doc?.url || ""}`.trim();
  const match = source.match(/\.([a-z0-9]+)(?:[?#].*)?$/i);
  if (match?.[1]) return match[1].toLowerCase();

  const [category, subtype] = String(doc?.type || "").split("/");
  if (category === "image") return subtype?.toLowerCase() || "png";
  if (subtype) return subtype.toLowerCase();

  return "";
};

const getProjectDocumentPresentation = (doc = {}) => {
  const extension = getProjectDocumentExtension(doc);
  const typeStyle =
    PROJECT_DOCUMENT_TYPE_STYLES[extension] || PROJECT_DOCUMENT_TYPE_STYLES.default;

  return {
    extension,
    extensionLabel: typeStyle.label || extension.toUpperCase() || "FILE",
    ...typeStyle,
  };
};

const formatProjectDocumentTimestamp = (value) => {
  if (!value) return "Modified recently";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Modified recently";

  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Modified today";
  if (diffDays === 1) return "Modified 1 day ago";
  if (diffDays < 7) return `Modified ${diffDays} days ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) {
    return `Modified ${diffWeeks} ${diffWeeks === 1 ? "week" : "weeks"} ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `Modified ${diffMonths} ${diffMonths === 1 ? "month" : "months"} ago`;
  }

  const diffYears = Math.floor(diffDays / 365);
  return `Modified ${diffYears} ${diffYears === 1 ? "year" : "years"} ago`;
};

// Skeleton Loading Component
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

const ProjectDashboard = () => {
  const { projectId } = useParams();
  const { authFetch, isAuthenticated, user } = useAuth();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [completedTaskIds, setCompletedTaskIds] = useState(new Set());
  const [verifiedTaskIds, setVerifiedTaskIds] = useState(new Set());
  const [verifyingTaskIds, setVerifyingTaskIds] = useState(() => new Set());
  const fileInputRef = useRef(null);
  const reportDialogContentRef = useRef(null);
  const completedTaskIdsRef = useRef(new Set());
  const verifiedTaskIdsRef = useRef(new Set());
  const latestProgressMutationIdRef = useRef(0);

  // Catalyst Request State
  const [reportOpen, setReportOpen] = useState(false);
  const [catalystRequestType, setCatalystRequestType] = useState(
    CATALYST_REQUEST_TYPES.GENERAL
  );
  const [issueText, setIssueText] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [assetsDialogOpen, setAssetsDialogOpen] = useState(false);
  const [date, setDate] = useState();
  const [time, setTime] = useState("");
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [availabilityManager, setAvailabilityManager] = useState(null);

  const [serverAvailableSlots, setServerAvailableSlots] = useState([]);
  const [deliverableReviews, setDeliverableReviews] = useState({});
  const [reviewingDeliverableId, setReviewingDeliverableId] = useState(null);
  const [isProcessingInstallment, setIsProcessingInstallment] = useState(false);
  const [isCompletingProject, setIsCompletingProject] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingFreelancerReview, setIsSubmittingFreelancerReview] =
    useState(false);
  const [reviewPromptDeferred, setReviewPromptDeferred] = useState(false);

  const syncProjectState = useCallback((data) => {
    if (!data) return;

    setProject(data);

    if (Array.isArray(data.completedTasks)) {
      const nextCompletedTaskIds = new Set(data.completedTasks);
      completedTaskIdsRef.current = nextCompletedTaskIds;
      setCompletedTaskIds(nextCompletedTaskIds);
    }

    if (Array.isArray(data.verifiedTasks)) {
      const nextVerifiedTaskIds = new Set(data.verifiedTasks);
      verifiedTaskIdsRef.current = nextVerifiedTaskIds;
      setVerifiedTaskIds(nextVerifiedTaskIds);
    }
  }, []);

  useEffect(() => {
    completedTaskIdsRef.current = completedTaskIds;
  }, [completedTaskIds]);

  useEffect(() => {
    verifiedTaskIdsRef.current = verifiedTaskIds;
  }, [verifiedTaskIds]);

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
        let [hours] = time.split(":").map(Number);
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

  const isFreelancerChangeRequest =
    catalystRequestType === CATALYST_REQUEST_TYPES.FREELANCER_CHANGE;

  const resetCatalystDialog = useCallback(
    (nextRequestType = CATALYST_REQUEST_TYPES.GENERAL) => {
      setCatalystRequestType(nextRequestType);
      setIssueText("");
      setDate(undefined);
      setTime("");
      setDatePopoverOpen(false);
    },
    []
  );

  const openCatalystDialog = useCallback(
    (nextRequestType = CATALYST_REQUEST_TYPES.GENERAL) => {
      resetCatalystDialog(nextRequestType);
      setReportOpen(true);
    },
    [resetCatalystDialog]
  );

  const handleCatalystRequestTypeChange = useCallback(
    (nextRequestType) => {
      if (nextRequestType === catalystRequestType) {
        return;
      }

      resetCatalystDialog(nextRequestType);
    },
    [catalystRequestType, resetCatalystDialog]
  );

  useEffect(() => {
    if (!reportOpen) {
      resetCatalystDialog();
    }
  }, [reportOpen, resetCatalystDialog]);

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
      "Launch Timeline",
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
    const extractField = (fieldName) =>
      extractStructuredFieldValue(desc, fieldName, fieldNames) || null;

    const service = extractField("Service");
    const projectName = extractField("Project");
    const client = extractField("Client");
    const websiteType = extractField("Website type");
    const techStack = extractField("Tech stack");
    const timeline = extractField("Timeline") || extractField("Launch Timeline");
    const budget = extractField("Budget");
    const hosting = extractField("Hosting");
    const domain = extractField("Domain");
    const integrations = extractField("Integrations");
    const deployment = extractField("Deployment");

    const summaryMatch = desc.match(
      /Summary[:\s]+(.+?)(?=(?:\r?\n\s*(?:Pages & Features|Core pages|Deliverables|Budget|Next Steps|Integrations|Designs|Hosting|Domain|Timeline|Launch Timeline)[:\s])|$)/is
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

  const handleCatalystSubmit = async () => {
    const note = issueText.trim();

    if (!note) {
      toast.error(
        isFreelancerChangeRequest
          ? "Please explain why you want the Project Manager to change the freelancer."
          : "Please describe the issue."
      );
      return;
    }

    if (isFreelancerChangeRequest) {
      if (!freelancer) {
        toast.error("There is no assigned freelancer to replace yet.");
        return;
      }

      if (pendingFreelancerChangeRequest) {
        toast.error("A freelancer change request is already pending review.");
        return;
      }

      if (remainingFreelancerChanges <= 0) {
        toast.error(
          "You have already used both freelancer change requests for this project."
        );
        return;
      }

      if (note.length < 10) {
        toast.error("Please provide a clear reason with at least 10 characters.");
        return;
      }

      setIsReporting(true);
      try {
        const res = await authFetch(
          `/projects/${project?.id || projectId}/request-freelancer-change`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason: note }),
          }
        );
        const payload = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(
            payload?.message || "Failed to submit freelancer change request."
          );
        }

        if (payload?.data) {
          syncProjectState(payload.data);
        }

        setReportOpen(false);
        toast.success(
          payload?.message ||
          "Your request has been sent to the Project Catalyst. The Project Manager will review it and handle the freelancer change."
        );
      } catch (error) {
        console.error("Failed to request freelancer change:", error);
        toast.error(error.message || "Failed to request freelancer change.");
      } finally {
        setIsReporting(false);
      }

      return;
    }

    let fullDescription = note;
    let meetingDateIso = undefined;
    let meetingHour = undefined;
    const meetingDateLocal = date ? format(date, "yyyy-MM-dd") : undefined;

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
        meetingHour = hours;
        combined.setHours(hours, minutes, 0, 0);
      } else {
        combined.setHours(9, 0, 0, 0); // Default to 9 AM if no time?? Or just omit time?
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
          syncProjectState(data);
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
  }, [authFetch, isAuthenticated, projectId, syncProjectState]);

  const updateProjectProgress = async (
    newProgress,
    completedArr,
    verifiedArr,
    notificationMeta = null
  ) => {
    if (!project?.id) return;
    const requestId = ++latestProgressMutationIdRef.current;
    const previousProgress = Number(project?.progress || 0);
    const previousCompletedArr = Array.from(completedTaskIdsRef.current);
    const previousVerifiedArr = Array.from(verifiedTaskIdsRef.current);
    const previousCompletedTaskIds = new Set(previousCompletedArr);
    const previousVerifiedTaskIds = new Set(previousVerifiedArr);
    const nextCompletedTaskIds = new Set(completedArr);
    const nextVerifiedTaskIds = new Set(verifiedArr);

    // Optimistic update keeps task status stable while request is in-flight.
    setProject((prev) =>
      prev
        ? {
          ...prev,
          progress: newProgress,
          completedTasks: completedArr,
          verifiedTasks: verifiedArr,
        }
        : prev
    );
    completedTaskIdsRef.current = nextCompletedTaskIds;
    verifiedTaskIdsRef.current = nextVerifiedTaskIds;
    setCompletedTaskIds(nextCompletedTaskIds);
    setVerifiedTaskIds(nextVerifiedTaskIds);

    try {
      const payload = {
        progress: newProgress,
        completedTasks: completedArr,
        verifiedTasks: verifiedArr,
      };

      if (notificationMeta) {
        payload.notificationMeta = notificationMeta;
      }

      const updateRes = await authFetch(`/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const updatePayload = await updateRes.json().catch(() => null);

      if (!updateRes.ok) {
        throw new Error(
          updatePayload?.message || "Failed to save project progress."
        );
      }

      if (
        updateRes.ok &&
        updatePayload?.data &&
        requestId === latestProgressMutationIdRef.current
      ) {
        syncProjectState(updatePayload.data);
      }
    } catch (error) {
      console.error("Failed to update project progress:", error);
      if (requestId === latestProgressMutationIdRef.current) {
        setProject((prev) =>
          prev
            ? {
              ...prev,
              progress: previousProgress,
              completedTasks: previousCompletedArr,
              verifiedTasks: previousVerifiedArr,
            }
            : prev
        );
        completedTaskIdsRef.current = previousCompletedTaskIds;
        verifiedTaskIdsRef.current = previousVerifiedTaskIds;
        setCompletedTaskIds(previousCompletedTaskIds);
        setVerifiedTaskIds(previousVerifiedTaskIds);
      }
      toast.error(error?.message || "Failed to update project progress.");
    }
  };

  // Chat & Conversation Logic
  const [conversationId, setConversationId] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const isChatLockedUntilPayment = useMemo(() => {
    return !hasUnlockedProjectChat(project);
  }, [project]);

  // 1. Ensure Conversation Exists
  useEffect(() => {
    if (!project?.id || !authFetch) return;
    if (isChatLockedUntilPayment) {
      setConversationId(null);
      return;
    }

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
  }, [project, authFetch, user, isChatLockedUntilPayment]);

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !authFetch) return;
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
          createdAt: m.createdAt,
          readAt: m.readAt,
          attachment: m.attachment,
          senderName: m.senderName,
        };
      });

      setMessages((prev) => {
        const pending = prev.filter((m) => m.pending);
        const backendSignatures = new Set(
          mapped.map(
            (m) => `${m.sender}:${m.text}:${m.attachment?.name || ""}`
          )
        );

        const stillPending = pending.filter((p) => {
          const signature = `${p.sender}:${p.text}:${p.attachment?.name || ""}`;
          return !backendSignatures.has(signature);
        });
        return [...mapped, ...stillPending];
      });
    } catch (e) {
      console.error("Fetch messages error:", e);
    }
  }, [conversationId, authFetch, user?.id]);

  // 2. Fetch Messages
  useEffect(() => {
    if (!conversationId || !authFetch) return;
    fetchMessages();
    // Poll every 5s for new messages (simple real-time)
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [conversationId, authFetch, fetchMessages]);

  const handleSendMessage = async () => {
    if (isChatLockedUntilPayment) {
      toast.error("Please complete the initial 20% payment to start messages.");
      return;
    }
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
        serviceKey = `CHAT:${project?.id || projectId}:${user.id}:${acceptedProposal.freelancerId
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
    if (isChatLockedUntilPayment) {
      toast.error("Please complete the initial 20% payment to start messages.");
      return;
    }
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
          serviceKey = `CHAT:${project?.id || projectId}:${user.id}:${acceptedProposal.freelancerId
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

  const handleDeliverableDecision = async (deliverableId, decision) => {
    if (!deliverableId) return;
    setReviewingDeliverableId(deliverableId);
    try {
      // Local state for now. Wire this to a Milestone/Deliverable API once available.
      await new Promise((resolve) => {
        setTimeout(resolve, 250);
      });
      setDeliverableReviews((prev) => ({
        ...prev,
        [deliverableId]: decision,
      }));
      toast.success(
        decision === "approved"
          ? "Deliverable approved. PM and freelancer can proceed."
          : "Revision requested. Team has been notified."
      );
    } finally {
      setReviewingDeliverableId(null);
    }
  };

  const handlePayDueInstallment = async () => {
    if (!project?.id || !dueInstallment) return;

    setIsProcessingInstallment(true);
    try {
      const paymentResult = await processProjectInstallmentPayment({
        authFetch,
        projectId: project.id,
        description: `${dueInstallment.label} for ${project.title || "project"}`,
      });

      toast.success(paymentResult?.message || "Payment completed successfully.");

      const refreshRes = await authFetch(`/projects/${project.id}`);
      const refreshPayload = await refreshRes.json().catch(() => null);
      if (refreshRes.ok && refreshPayload?.data) {
        setProject(refreshPayload.data);
      }
    } catch (error) {
      console.error("Failed to pay project installment:", error);
      toast.error(error?.message || "Failed to process payment");
    } finally {
      setIsProcessingInstallment(false);
    }
  };

  const handleSubmitFreelancerReview = async () => {
    if (!project?.id) return;

    if (!Number.isInteger(reviewRating) || reviewRating < 1 || reviewRating > 5) {
      toast.error("Please select a rating between 1 and 5 stars.");
      return;
    }

    const trimmedComment = reviewComment.trim();
    if (trimmedComment.length < 5) {
      toast.error("Please write at least 5 characters for your review.");
      return;
    }

    setIsSubmittingFreelancerReview(true);
    try {
      const response = await authFetch(`/projects/${project.id}/freelancer-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: reviewRating,
          comment: trimmedComment,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to submit freelancer review.");
      }

      if (payload?.data?.project) {
        syncProjectState(payload.data.project);
      }

      setReviewRating(0);
      setReviewComment("");
      setReviewDeferredState(false);
      toast.success(payload?.message || "Thanks for reviewing your freelancer.");
    } catch (error) {
      console.error("Failed to submit freelancer review:", error);
      toast.error(error?.message || "Failed to submit freelancer review.");
    } finally {
      setIsSubmittingFreelancerReview(false);
    }
  };

  const handleDeferFreelancerReview = () => {
    setReviewDeferredState(true);
    toast.success("No problem. You can review the freelancer later from this project page.");
  };

  const docs = useMemo(() => {
    const seenDocuments = new Set();

    return messages
      .filter((message) => message.attachment)
      .map((message) => ({
        ...message.attachment,
        createdAt:
          message.attachment?.createdAt ||
          message.createdAt ||
          message.timestamp?.toISOString?.() ||
          null,
        messageId: message.id,
        sender: message.sender,
      }))
      .filter((doc) => {
        const signature = doc.messageId || doc.url || `${doc.name}-${doc.createdAt || ""}`;
        if (seenDocuments.has(signature)) return false;
        seenDocuments.add(signature);
        return true;
      })
      .sort(
        (left, right) =>
          new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime(),
      );
  }, [messages]);

  const deliverableQueue = useMemo(() => {
    return docs.map((doc, index) => {
      const stableId =
        doc?.messageId ||
        doc?.url ||
        `${doc?.name || "deliverable"}-${doc?.createdAt || doc?.size || index}`;
      return {
        id: stableId,
        name: doc?.name || `Deliverable ${index + 1}`,
        url: doc?.url,
        size: doc?.size,
        status: deliverableReviews[stableId] || "pending",
      };
    });
  }, [docs, deliverableReviews]);

  const clientDocs = useMemo(
    () => docs.filter((doc) => doc.sender === "user"),
    [docs],
  );

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

  const paymentPlan = useMemo(() => {
    const rawPaymentPlan = project?.paymentPlan;

    if (!rawPaymentPlan) {
      return null;
    }

    if (typeof rawPaymentPlan === "string") {
      try {
        const parsed = JSON.parse(rawPaymentPlan);
        return parsed && typeof parsed === "object" ? parsed : null;
      } catch {
        return null;
      }
    }

    return typeof rawPaymentPlan === "object" ? rawPaymentPlan : null;
  }, [project?.paymentPlan]);

  const paymentPlanInstallments = useMemo(
    () =>
      Array.isArray(paymentPlan?.installments)
        ? paymentPlan.installments
        : [],
    [paymentPlan],
  );
  const sortedPaymentPlanInstallments = useMemo(
    () =>
      [...paymentPlanInstallments].sort((left, right) => {
        const gateDelta =
          Number(left?.dueAfterCompletedPhases || 0) -
          Number(right?.dueAfterCompletedPhases || 0);

        if (gateDelta !== 0) {
          return gateDelta;
        }

        return Number(left?.sequence || 0) - Number(right?.sequence || 0);
      }),
    [paymentPlanInstallments],
  );
  const phaseMilestoneInstallments = useMemo(
    () =>
      sortedPaymentPlanInstallments.filter((installment) => {
        const gate = Number(installment?.dueAfterCompletedPhases || 0);
        return Number.isFinite(gate) && gate > 0;
      }),
    [sortedPaymentPlanInstallments],
  );
  const dueInstallment = paymentPlan?.nextDueInstallment || null;
  const initialInstallment =
    paymentPlanInstallments.find(
      (installment) =>
        Number(installment?.sequence || 0) === 1 ||
        Number(installment?.dueAfterCompletedPhases || 0) === 0
    ) || null;
  const finalInstallment =
    sortedPaymentPlanInstallments[sortedPaymentPlanInstallments.length - 1] || null;
  const completionMilestoneInstallment =
    phaseMilestoneInstallments[phaseMilestoneInstallments.length - 1] ||
    finalInstallment;
  const areAllInstallmentsPaid = useMemo(
    () =>
      paymentPlanInstallments.length > 0 &&
      paymentPlanInstallments.every((installment) => {
        const amount = Number(installment?.amount || 0);
        return Boolean(installment?.isPaid) || amount <= 0;
      }),
    [paymentPlanInstallments],
  );
  const isInitialPaymentPaid = Boolean(initialInstallment?.isPaid);
  const isInitialPaymentDue = Number(dueInstallment?.sequence || 0) === 1;
  const isFinalInstallmentPaid =
    sortedPaymentPlanInstallments.length === 0 ||
    Boolean(
      paymentPlan?.isFullyPaid ||
      completionMilestoneInstallment?.isPaid ||
      (!dueInstallment && areAllInstallmentsPaid),
    );
  const phaseGateInstallmentsByPhase = useMemo(() => {
    const grouped = {};
    const installments = paymentPlanInstallments;

    installments.forEach((installment) => {
      const gate = Number(installment?.dueAfterCompletedPhases || 0);
      if (!Number.isFinite(gate) || gate <= 0) return;

      const key = String(gate);
      if (!Array.isArray(grouped[key])) {
        grouped[key] = [];
      }
      grouped[key].push(installment);
    });

    return grouped;
  }, [paymentPlanInstallments]);

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

  const freelancerChangeCount = Number(project?.freelancerChangeCount || 0);
  const remainingFreelancerChanges = Math.max(
    0,
    MAX_FREELANCER_CHANGE_REQUESTS - freelancerChangeCount
  );
  const freelancer = useMemo(() => {
    return project?.proposals?.find((p) => p.status === "ACCEPTED")?.freelancer;
  }, [project]);

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
      extractField("Service Type") ||
      extractField("Service") ||
      extractField("Website type") ||
      project?.title ||
      "Not specified";
    const teammateName =
      freelancer?.fullName ||
      extractField("Freelancer") ||
      "Not assigned";
    const timeline =
      extractField("Timeline") ||
      extractField("Launch Timeline") ||
      "Not set";
    const budget =
      extractField("Budget") ||
      (totalBudget > 0 ? formatINR(totalBudget) : "Not set");
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
    const featuresDeliverables =
      extractField("Features/Deliverables Included") ||
      extractField("Deliverables") ||
      extractField("Pages & Features") ||
      "";
    const deliverablesLabel = featuresDeliverables
      ? extractField("Features/Deliverables Included")
        ? "Features/Deliverables Included"
        : extractField("Deliverables")
          ? "Deliverables"
          : "Pages & Features"
      : "";
    const deliverablesItems = parseProjectDetailList(featuresDeliverables);

    const corePages = parseProjectDetailList(
      extractField("Core pages included") || extractField("Core pages"),
    );
    const additionalPages = parseProjectDetailList(
      extractField("Additional pages/features") ||
      extractField("Additional pages"),
    );
    const pagesField = extractField("Pages");
    const allPages = [...corePages, ...additionalPages];
    const pageSummary =
      pagesField || (allPages.length ? `${allPages.length} pages` : "Not specified");

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
      extractField("Business Name") ||
      extractField("Company Name") ||
      extractField("Brand Name") ||
      extractField("Client Name") ||
      "";

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
      teammateName,
      budget,
      timeline,
      overview,
      businessName,
      websiteDetails,
      deliverablesLabel,
      deliverablesItems,
      pageTags: allPages,
    };
  }, [freelancer, project, totalBudget]);

  const reviewDeferStorageKey = useMemo(
    () =>
      project?.id
        ? `project-freelancer-review-deferred:${project.id}`
        : "",
    [project?.id]
  );
  const existingFreelancerReview = project?.clientFreelancerReview || null;
  const isProjectCompleted = String(project?.status || "").toUpperCase() === "COMPLETED";
  const shouldCollectFreelancerReview = isProjectCompleted && Boolean(freelancer);
  const catalystDialogTitle = "Contact your Project Catalyst";
  const catalystDialogDescription = isFreelancerChangeRequest
    ? "Ask Catalyst to review a freelancer change request. The Project Manager reviews the request and assigns the replacement freelancer if approved."
    : "Reach out for project support, disputes, or anything that needs Project Manager attention.";
  const catalystDialogNoteLabel = isFreelancerChangeRequest
    ? "Reason for freelancer change"
    : "Add Note";
  const catalystDialogNotePlaceholder = isFreelancerChangeRequest
    ? "Explain what is not working with the current freelancer and why you want the Project Manager to replace them."
    : "Add a note...";
  const catalystDialogSubmitLabel = isFreelancerChangeRequest
    ? "Send change request"
    : "Submit";

  const setReviewDeferredState = useCallback(
    (isDeferred) => {
      setReviewPromptDeferred(isDeferred);

      if (!reviewDeferStorageKey || typeof window === "undefined") {
        return;
      }

      if (isDeferred) {
        window.localStorage.setItem(reviewDeferStorageKey, "1");
      } else {
        window.localStorage.removeItem(reviewDeferStorageKey);
      }
    },
    [reviewDeferStorageKey]
  );

  useEffect(() => {
    if (!reviewDeferStorageKey || typeof window === "undefined") {
      setReviewPromptDeferred(false);
      return;
    }

    setReviewPromptDeferred(
      window.localStorage.getItem(reviewDeferStorageKey) === "1"
    );
  }, [reviewDeferStorageKey]);

  useEffect(() => {
    if (!existingFreelancerReview) return;
    setReviewDeferredState(false);
  }, [existingFreelancerReview, setReviewDeferredState]);

  const shouldShowFreelancerReviewPrompt =
    shouldCollectFreelancerReview &&
    !existingFreelancerReview &&
    !reviewPromptDeferred;

  const shouldShowFreelancerReviewReminder =
    shouldCollectFreelancerReview &&
    !existingFreelancerReview &&
    reviewPromptDeferred;

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
    return getSopFromTitle(project?.title);
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
    const allTasks = activeSOP.tasks;

    return phases.map((phase) => {
      // Find tasks for this phase
      const phaseTasks = allTasks.filter((t) => t.phase === phase.id);
      const totalPhaseTasks = phaseTasks.length;

      // Calculate verified count for this phase
      const verifiedCount = phaseTasks.filter((t) =>
        verifiedTaskIds.has(`${t.phase}-${t.id}`)
      ).length;
      const completedCount = phaseTasks.filter((t) =>
        completedTaskIds.has(`${t.phase}-${t.id}`)
      ).length;

      const progress =
        totalPhaseTasks > 0
          ? Math.round((verifiedCount / totalPhaseTasks) * 100)
          : 0;

      let status = "pending";
      if (progress >= 100) status = "completed";
      else if (verifiedCount > 0 || completedCount > 0) status = "in-progress";

      return {
        ...phase,
        name: phase.name.replace(/\s*\(\s*Phase-\d+\s*\)/i, "").trim(),
        status,
        progress,
        index: phases.indexOf(phase),
      };
    });
  }, [activeSOP, completedTaskIds, verifiedTaskIds]);

  const allPhasesCompleted =
    derivedPhases.length > 0 &&
    derivedPhases.every((phase) => phase.status === "completed");
  const canMarkProjectCompleted =
    !isProjectCompleted &&
    allPhasesCompleted &&
    isFinalInstallmentPaid;
  const showLegacyCompletionPrompt =
    canMarkProjectCompleted && sortedPaymentPlanInstallments.length === 0;
  const projectCompletionMilestonePhaseId = completionMilestoneInstallment
    ? Number(
        completionMilestoneInstallment?.dueAfterCompletedPhases ||
          derivedPhases[derivedPhases.length - 1]?.id ||
          0,
      ) || null
    : derivedPhases[derivedPhases.length - 1]?.id ?? null;
  const showProjectCompletionMilestone =
    canMarkProjectCompleted &&
    sortedPaymentPlanInstallments.length > 0 &&
    projectCompletionMilestonePhaseId !== null;

  const verificationDueInstallment = useMemo(() => {
    const installments = Array.isArray(paymentPlan?.installments)
      ? paymentPlan.installments
      : [];
    const completedPhaseCount = derivedPhases.filter(
      (phase) => phase.status === "completed"
    ).length;

    let allPreviousPaid = true;
    for (const installment of installments) {
      const isPaid = Boolean(installment?.isPaid);
      const dueAfterCompletedPhases = Number(
        installment?.dueAfterCompletedPhases || 0
      );
      const phaseGateReached =
        Number.isFinite(dueAfterCompletedPhases) &&
        completedPhaseCount >= dueAfterCompletedPhases;
      const isDueNow = !isPaid && allPreviousPaid && phaseGateReached;

      if (isDueNow) {
        return installment;
      }

      allPreviousPaid = allPreviousPaid && isPaid;
    }

    return paymentPlan?.nextDueInstallment || null;
  }, [derivedPhases, paymentPlan]);

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

  const phaseOrderMap = useMemo(
    () => buildPhaseOrderMap(derivedPhases),
    [derivedPhases]
  );

  const verificationGatePaymentPlan = useMemo(
    () =>
      paymentPlan
        ? {
          ...paymentPlan,
          nextDueInstallment: verificationDueInstallment,
        }
        : {
          nextDueInstallment: verificationDueInstallment,
        },
    [paymentPlan, verificationDueInstallment]
  );

  // Group tasks by phase for display
  const tasksByPhase = useMemo(() => {
    // Group tasks by phase ID
    const grouped = {};
    derivedTasks.forEach((task) => {
      if (!grouped[task.phase]) grouped[task.phase] = [];
      grouped[task.phase].push(task);
    });

    const completedPhaseIds = derivedPhases
      .filter((phase) => phase.status === "completed")
      .map((phase) => phase.id);
    const completedTaskIdList = Array.from(completedTaskIds);
    const verifiedTaskIdList = Array.from(verifiedTaskIds);

    // Iterate sorted phases to build groups and calculate locks
    let isPrevPhaseComplete = true; // First phase is always unlocked

    return derivedPhases.map((phase) => {
      const tasks = grouped[phase.id] || [];
      const phaseOrder = getPhaseOrder(phase.id, phaseOrderMap);
      const isPaymentLocked = isPhaseOrderLockedByPayment({
        phaseOrder,
        paymentPlan: verificationGatePaymentPlan,
      });
      const isHistoricalLock = isCompletedPhaseLockedAfterAdvance({
        phaseId: phase.id,
        completedPhaseIds,
        phaseOrderMap,
        completedTaskIds: completedTaskIdList,
        verifiedTaskIds: verifiedTaskIdList,
      });
      const isPhaseSequenceLocked = !isPrevPhaseComplete;
      const isLocked =
        isPhaseSequenceLocked || isPaymentLocked || isHistoricalLock;

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
        isHistoricalLock,
        isPaymentLocked,
        lockReason: isHistoricalLock
          ? "This phase is locked because the next phase has already started."
          : isPaymentLocked
            ? `Complete ${verificationDueInstallment?.label || "the pending milestone payment"
            } before verifying tasks in later phases.`
            : isPhaseSequenceLocked
              ? "Complete the previous phase before changing tasks here."
              : null,
        lockedInstallment: isPaymentLocked ? verificationDueInstallment : null,
      };
    });
  }, [
    completedTaskIds,
    derivedTasks,
    derivedPhases,
    phaseOrderMap,
    verifiedTaskIds,
    verificationDueInstallment,
    verificationGatePaymentPlan,
  ]);

  const taskLockReasonByUniqueKey = useMemo(() => {
    const lockMap = {};

    tasksByPhase.forEach((phaseGroup) => {
      const lockReason = isProjectCompleted
        ? "This project is completed and tasks are now locked."
        : phaseGroup.lockReason;

      if (!lockReason) {
        return;
      }

      phaseGroup.tasks.forEach((task) => {
        lockMap[task.uniqueKey] = lockReason;
      });
    });

    return lockMap;
  }, [isProjectCompleted, tasksByPhase]);

  const getTaskLockReason = useCallback(
    (uniqueKey) => taskLockReasonByUniqueKey[uniqueKey] || null,
    [taskLockReasonByUniqueKey]
  );

  // Handle task click to toggle completion (just marks as checked, not verified)
  const handleTaskClick = async (e, uniqueKey) => {
    e.stopPropagation();
    e.preventDefault();

    const lockReason = getTaskLockReason(uniqueKey);
    if (lockReason) {
      toast.info(lockReason);
      return;
    }

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
    const lockReason = getTaskLockReason(uniqueKey);
    if (lockReason) {
      toast.info(lockReason);
      return;
    }
    if (verifyingTaskIds.has(uniqueKey)) return;

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
    _isCurrentlyVerified
  ) => {
    const lockReason = getTaskLockReason(uniqueKey);
    if (lockReason) {
      setVerifyConfirmOpen(false);
      setPendingVerifyTask(null);
      toast.info(lockReason);
      return;
    }

    if (verifyingTaskIds.has(uniqueKey)) {
      setVerifyConfirmOpen(false);
      setPendingVerifyTask(null);
      return;
    }

    setVerifyConfirmOpen(false);
    setPendingVerifyTask(null);
    setVerifyingTaskIds((prev) => {
      const next = new Set(prev);
      next.add(uniqueKey);
      return next;
    });

    // Compute new verified list synchronously BEFORE updating state
    const currentVerified = Array.from(verifiedTaskIdsRef.current);
    let newVerified;
    let isMarkingVerified = false;

    if (currentVerified.includes(uniqueKey)) {
      // Removing verification
      newVerified = currentVerified.filter((id) => id !== uniqueKey);
      isMarkingVerified = false;
    } else {
      const taskToVerify = derivedTasks.find((task) => task.uniqueKey === uniqueKey);
      const isPaymentLocked = isTaskPhaseLockedByPayment({
        phaseId: taskToVerify?.phase,
        phaseOrderMap,
        paymentPlan: verificationGatePaymentPlan,
      });

      if (isPaymentLocked) {
        const pendingPaymentLabel =
          verificationDueInstallment?.label || "the pending milestone payment";
        toast.error(
          `Pay ${pendingPaymentLabel} before verifying tasks in later phases.`
        );
        setVerifyingTaskIds((prev) => {
          const next = new Set(prev);
          next.delete(uniqueKey);
          return next;
        });
        return;
      }

      // Adding verification
      newVerified = [...currentVerified, uniqueKey];
      isMarkingVerified = true;
    }

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
    const currentCompleted = Array.from(completedTaskIdsRef.current);

    try {
      await updateProjectProgress(
        newProgress,
        currentCompleted,
        newVerified,
        notificationMeta
      );
    } finally {
      setVerifyingTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(uniqueKey);
        return next;
      });
    }
  };

  const handleMarkProjectCompleted = useCallback(async () => {
    if (!project?.id || !canMarkProjectCompleted || isCompletingProject) {
      return;
    }

    setIsCompletingProject(true);
    try {
      const response = await authFetch(`/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to mark project as completed.");
      }

      if (payload?.data) {
        syncProjectState(payload.data);
      }

      toast.success("Project marked as completed. Editing is now locked.");
    } catch (error) {
      toast.error(error?.message || "Failed to mark project as completed.");
    } finally {
      setIsCompletingProject(false);
    }
  }, [authFetch, canMarkProjectCompleted, isCompletingProject, project?.id, syncProjectState]);

  const pageTitle = projectDetailSnapshot.businessName || project?.title || "Project Dashboard";

  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-[#f1f5f9]">
        <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <ClientWorkspaceHeader
            profile={{
              avatar: user?.avatar,
              name: String(user?.fullName || user?.name || "Client").trim() || "Client",
            }}
            activeWorkspaceKey="projects"
            primaryActionLabel="Projects"
            primaryActionTo="/client/project"
          />
        </div>
        <ProjectDetailSkeleton />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background text-[#f1f5f9]">
        <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-5 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <ClientWorkspaceHeader
            profile={{
              avatar: user?.avatar,
              name: String(user?.fullName || user?.name || "Client").trim() || "Client",
            }}
            activeWorkspaceKey="projects"
            primaryActionLabel="Projects"
            primaryActionTo="/client/project"
          />

          <main className="flex-1 space-y-5 pb-10 pt-4 sm:space-y-6 sm:pb-12 sm:pt-6">
                        <div className="w-full max-w-full mx-auto space-y-6">
              <ClientProjectDetailHeader
                pageTitle={pageTitle}
                activeProjectManager={activeProjectManager}
                openCatalystDialog={openCatalystDialog}
                catalystRequestTypes={CATALYST_REQUEST_TYPES}
                project={project}
                projectId={projectId}
              />

              <BookAppointment
                isOpen={bookAppointmentOpen}
                onClose={() => setBookAppointmentOpen(false)}
                projectId={project?.id || projectId}
                projectTitle={project?.title}
              />
              {!isLoading && !project ? (
                <div className="rounded-lg border border-border/60 bg-accent/40 px-4 py-3 text-sm text-muted-foreground">
                  No project data found for this link. Showing sample progress so
                  you can preview the layout.
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
                <ClientProjectDetailMainColumn
                  projectDetailSnapshot={projectDetailSnapshot}
                  insetPanelClassName={projectInsetPanelClassName}
                  panelClassName={projectPanelClassName}
                  eyebrowClassName={projectSectionEyebrowClassName}
                  subheadingClassName={projectSectionSubheadingClassName}
                  overallProgress={overallProgress}
                  derivedPhases={derivedPhases}
                  derivedTasks={derivedTasks}
                  canMarkProjectCompleted={canMarkProjectCompleted}
                  showLegacyCompletionPrompt={showLegacyCompletionPrompt}
                  showProjectCompletionMilestone={showProjectCompletionMilestone}
                  projectCompletionMilestonePhaseId={projectCompletionMilestonePhaseId}
                  handleMarkProjectCompleted={handleMarkProjectCompleted}
                  isCompletingProject={isCompletingProject}
                  isInitialPaymentDue={isInitialPaymentDue}
                  dueInstallment={dueInstallment}
                  handlePayDueInstallment={handlePayDueInstallment}
                  isProcessingInstallment={isProcessingInstallment}
                  isInitialPaymentPaid={isInitialPaymentPaid}
                  initialInstallment={initialInstallment}
                  currentActivePhase={currentActivePhase}
                  tasksByPhase={tasksByPhase}
                  phaseGateInstallmentsByPhase={phaseGateInstallmentsByPhase}
                  getPhaseIcon={getPhaseIcon}
                  isProjectCompleted={isProjectCompleted}
                  handleTaskClick={handleTaskClick}
                  verifyingTaskIds={verifyingTaskIds}
                  promptVerifyTask={promptVerifyTask}
                  formatINR={formatINR}
                />
                <ClientProjectDetailSidebar
                  panelClassName={projectPanelClassName}
                  insetPanelClassName={projectInsetPanelClassName}
                  eyebrowClassName={projectSectionEyebrowClassName}
                  subheadingClassName={projectSectionSubheadingClassName}
                  freelancer={freelancer}
                  project={project}
                  messages={messages}
                  input={input}
                  setInput={setInput}
                  handleSendMessage={handleSendMessage}
                  fileInputRef={fileInputRef}
                  handleFileUpload={handleFileUpload}
                  isSending={isSending}
                  isChatLockedUntilPayment={isChatLockedUntilPayment}
                  clientDocs={clientDocs}
                  setAssetsDialogOpen={setAssetsDialogOpen}
                  formatAttachmentSize={formatAttachmentSize}
                  getProjectDocumentPresentation={getProjectDocumentPresentation}
                  formatProjectDocumentTimestamp={formatProjectDocumentTimestamp}
                  deliverableQueue={deliverableQueue}
                  reviewingDeliverableId={reviewingDeliverableId}
                  handleDeliverableDecision={handleDeliverableDecision}
                  totalBudget={totalBudget}
                  spentBudget={spentBudget}
                  remainingBudget={remainingBudget}
                  paymentPlan={verificationGatePaymentPlan}
                  dueInstallment={verificationDueInstallment}
                  isProcessingInstallment={isProcessingInstallment}
                  handlePayDueInstallment={handlePayDueInstallment}
                  shouldCollectFreelancerReview={shouldCollectFreelancerReview}
                  existingFreelancerReview={existingFreelancerReview}
                  shouldShowFreelancerReviewPrompt={shouldShowFreelancerReviewPrompt}
                  reviewRating={reviewRating}
                  setReviewRating={setReviewRating}
                  reviewComment={reviewComment}
                  setReviewComment={setReviewComment}
                  handleSubmitFreelancerReview={handleSubmitFreelancerReview}
                  isSubmittingFreelancerReview={isSubmittingFreelancerReview}
                  handleDeferFreelancerReview={handleDeferFreelancerReview}
                  shouldShowFreelancerReviewReminder={shouldShowFreelancerReviewReminder}
                  setReviewDeferredState={setReviewDeferredState}
                />
              </div>
            </div>

            <ClientDashboardFooter variant="workspace" />
          </main>
        </div>
      </div>
      <ClientProjectDetailDialogs
        verifyConfirmOpen={verifyConfirmOpen}
        setVerifyConfirmOpen={setVerifyConfirmOpen}
        pendingVerifyTask={pendingVerifyTask}
        setPendingVerifyTask={setPendingVerifyTask}
        handleVerifyTask={handleVerifyTask}
        reportOpen={reportOpen}
        setReportOpen={setReportOpen}
        isReporting={isReporting}
        reportDialogContentRef={reportDialogContentRef}
        catalystDialogTitle={catalystDialogTitle}
        catalystDialogDescription={catalystDialogDescription}
        activeProjectManager={activeProjectManager}
        isFreelancerChangeRequest={isFreelancerChangeRequest}
        handleCatalystRequestTypeChange={handleCatalystRequestTypeChange}
        catalystRequestTypes={CATALYST_REQUEST_TYPES}
        freelancer={freelancer}
        pendingFreelancerChangeRequest={pendingFreelancerChangeRequest}
        latestFreelancerChangeRequest={latestFreelancerChangeRequest}
        freelancerChangeCount={freelancerChangeCount}
        catalystDialogNoteLabel={catalystDialogNoteLabel}
        catalystDialogNotePlaceholder={catalystDialogNotePlaceholder}
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
        handleCatalystSubmit={handleCatalystSubmit}
        catalystDialogSubmitLabel={catalystDialogSubmitLabel}
        assetsDialogOpen={assetsDialogOpen}
        setAssetsDialogOpen={setAssetsDialogOpen}
        eyebrowClassName={projectSectionEyebrowClassName}
        clientDocs={clientDocs}
        formatAttachmentSize={formatAttachmentSize}
        getProjectDocumentPresentation={getProjectDocumentPresentation}
        formatProjectDocumentTimestamp={formatProjectDocumentTimestamp}
        insetPanelClassName={projectInsetPanelClassName}
        detailOpen={detailOpen}
        setDetailOpen={setDetailOpen}
        renderProjectDescription={renderProjectDescription}
      />

    </>
  );
};

const ClientProjectDetailPage = () => <ProjectDashboard />;

export default ClientProjectDetailPage;









