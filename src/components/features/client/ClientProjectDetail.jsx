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
import FileText from "lucide-react/dist/esm/icons/file-text";
import Check from "lucide-react/dist/esm/icons/check";
import CheckCheck from "lucide-react/dist/esm/icons/check-check";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import { ProjectNotepad } from "@/components/ui/notepad";
import BookAppointment from "@/components/features/appointments/BookAppointment";
import ClientDashboardFooter from "@/components/features/client/ClientDashboardFooter";
import { Input } from "@/components/ui/input";
import { RoleAwareSidebar } from "@/components/layout/RoleAwareSidebar";
import { ClientTopBar } from "@/components/features/client/ClientTopBar";
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
  const [date, setDate] = useState();
  const [time, setTime] = useState("");
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [availabilityManager, setAvailabilityManager] = useState(null);

  const [serverAvailableSlots, setServerAvailableSlots] = useState([]);
  const [deliverableReviews, setDeliverableReviews] = useState({});
  const [reviewingDeliverableId, setReviewingDeliverableId] = useState(null);
  const [isProcessingInstallment, setIsProcessingInstallment] = useState(false);
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

      if (
        updateRes.ok &&
        updatePayload?.data &&
        requestId === latestProgressMutationIdRef.current
      ) {
        syncProjectState(updatePayload.data);
      }
    } catch (error) {
      console.error("Failed to update project progress:", error);
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
    return messages.filter((m) => m.attachment).map((m) => m.attachment);
  }, [messages]);

  const deliverableQueue = useMemo(() => {
    return docs.map((doc, index) => {
      const stableId = `${doc?.url || doc?.name || "deliverable"}-${index}`;
      return {
        id: stableId,
        name: doc?.name || `Deliverable ${index + 1}`,
        url: doc?.url,
        size: doc?.size,
        status: deliverableReviews[stableId] || "pending",
      };
    });
  }, [docs, deliverableReviews]);

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
    return project?.paymentPlan && typeof project.paymentPlan === "object"
      ? project.paymentPlan
      : null;
  }, [project]);

  const dueInstallment = paymentPlan?.nextDueInstallment || null;
  const phaseGateInstallmentsByPhase = useMemo(() => {
    const grouped = {};
    const installments = Array.isArray(paymentPlan?.installments)
      ? paymentPlan.installments
      : [];

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
  }, [paymentPlan]);

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
        index: phases.indexOf(phase),
      };
    });
  }, [activeSOP, verifiedTaskIds]);

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
              {!isLoading && (
                <p className="text-xs text-muted-foreground">
                  {activeProjectManager
                    ? `Project Catalyst: ${activeProjectManager.fullName}`
                    : "Project Catalyst: Not assigned yet"}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() =>
                        openCatalystDialog(CATALYST_REQUEST_TYPES.GENERAL)
                      }
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
                        className="h-full rounded-full transition-all duration-300 bg-linear-to-r from-amber-500 via-yellow-400 to-amber-400"
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
                <CardContent className="pt-6">
                  <Accordion
                    type="single"
                    collapsible
                    defaultValue={currentActivePhase?.id}
                    className="w-full"
                  >
                    {tasksByPhase.map((phaseGroup) => {
                      const phaseInstallments =
                        phaseGateInstallmentsByPhase[String(phaseGroup.phaseId)] || [];
                      const shouldShowPhaseMilestones =
                        phaseGroup.phaseStatus === "completed" &&
                        phaseInstallments.length > 0;

                      return (
                        <React.Fragment key={phaseGroup.phaseId}>
                          <AccordionItem
                            value={phaseGroup.phaseId}
                            className="border-border/60"
                          >
                            <AccordionTrigger className="hover:no-underline py-3">
                              <div className="flex items-center gap-3 flex-1">
                                {getPhaseIcon(phaseGroup.phaseStatus)}
                                <div className="flex-1 text-left">
                                  <div className="font-semibold text-sm text-foreground">
                                    Phase {phaseGroup.phaseId}:{" "}
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
                                {phaseGroup.tasks.map((task) => {
                                  const isTaskVerificationPending =
                                    verifyingTaskIds.has(task.uniqueKey);

                                  return (
                                    <div
                                      key={task.uniqueKey}
                                      className={`flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-card transition-colors ${
                                        phaseGroup.isLocked
                                          ? "opacity-50 pointer-events-none bg-muted/50"
                                          : "hover:bg-accent/60 cursor-pointer"
                                      }`}
                                      onClick={(e) =>
                                        !phaseGroup.isLocked &&
                                        handleTaskClick(e, task.uniqueKey)
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
                                        {phaseGroup.isLocked && (
                                          <span className="ml-2 text-xs text-amber-500 font-medium no-underline inline-block">
                                            (Locked)
                                          </span>
                                        )}
                                      </span>
                                      {task.status === "completed" && (
                                        <Button
                                          size="sm"
                                          variant={
                                            task.verified ? "default" : "outline"
                                          }
                                          disabled={
                                            phaseGroup.isLocked ||
                                            isTaskVerificationPending
                                          }
                                          className={`h-7 px-3 text-xs transition-all ${
                                            task.verified
                                              ? "bg-emerald-500 hover:bg-emerald-600 text-white border-transparent"
                                              : "border-primary text-primary hover:bg-primary/10"
                                          }`}
                                          onClick={(e) =>
                                            !phaseGroup.isLocked &&
                                            promptVerifyTask(
                                              e,
                                              task.uniqueKey,
                                              task.title,
                                              task.verified
                                            )
                                          }
                                        >
                                          {isTaskVerificationPending ? (
                                            <>
                                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                              Saving
                                            </>
                                          ) : task.verified ? (
                                            "Verified"
                                          ) : (
                                            "Verify"
                                          )}
                                        </Button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          {shouldShowPhaseMilestones ? (
                            <div className="mt-4 space-y-3 border-b border-border/60 pb-4">
                              {phaseInstallments.map((installment) => {
                                const isDueNow = Boolean(installment?.isDue);
                                const isPaid = Boolean(installment?.isPaid);
                                const canPayInstallment =
                                  isDueNow &&
                                  dueInstallment?.sequence === installment.sequence;
                                const milestoneStatusLabel = isPaid
                                  ? "Paid"
                                  : isDueNow
                                  ? "Due now"
                                  : "Scheduled";

                                return (
                                  <div
                                    key={`installment-${phaseGroup.phaseId}-${installment.sequence}`}
                                    className={cn(
                                      "rounded-xl border px-3.5 py-2 transition-colors",
                                      isPaid
                                        ? "border-emerald-500/20 bg-accent/85"
                                        : isDueNow
                                        ? "border-emerald-500/30 bg-accent/90"
                                        : "border-border/60 bg-accent/65"
                                    )}
                                  >
                                    <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                                      <div className="flex items-start gap-2 sm:items-center">
                                        <div
                                          className={cn(
                                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                                            isPaid || isDueNow
                                              ? "border-emerald-500/30 bg-emerald-500/12 text-emerald-400"
                                              : "border-border/60 bg-background/70 text-muted-foreground"
                                          )}
                                        >
                                          <CreditCard className="h-3 w-3" />
                                        </div>
                                        <div className="min-w-0 flex-1 space-y-0">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                                              Payment Milestone
                                            </p>
                                          </div>
                                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                            <p className="text-sm font-semibold leading-tight text-foreground sm:text-[15px]">
                                              {installment.label}
                                            </p>
                                            <span className="inline-flex items-center rounded-full border border-border/50 bg-background/50 px-2 py-0 text-[10px] font-medium leading-5 text-muted-foreground">
                                              {installment.percentage}% of project budget
                                            </span>
                                          </div>
                                          <p className="pt-0.5 text-xs leading-snug text-muted-foreground sm:text-[13px]">
                                            {installment.dueLabel ||
                                              "This payment unlocks once the phase is fully completed."}
                                          </p>
                                        </div>
                                        <Badge
                                          variant={isDueNow ? "secondary" : "outline"}
                                          className={cn(
                                            "mt-0.5 shrink-0 self-start sm:mt-0 sm:self-center",
                                            isPaid
                                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                                              : isDueNow
                                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                                              : "border-border/60 bg-background/70 text-muted-foreground"
                                          )}
                                        >
                                          {milestoneStatusLabel}
                                        </Badge>
                                      </div>

                                      <div className="flex flex-col gap-1 sm:min-w-[118px] sm:border-l sm:border-border/50 sm:pl-3 sm:items-end">
                                        <div className="text-left sm:text-right">
                                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                            Amount
                                          </p>
                                          <p className="text-base font-semibold leading-tight text-foreground sm:text-[17px]">
                                            {formatINR(installment.amount || 0)}
                                          </p>
                                        </div>

                                        {canPayInstallment ? (
                                          <Button
                                            size="sm"
                                            className="h-7 w-fit px-2.5 text-[11px] sm:self-end"
                                            onClick={handlePayDueInstallment}
                                            disabled={isProcessingInstallment}
                                          >
                                            {isProcessingInstallment ? (
                                              <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                              <CreditCard className="h-3 w-3" />
                                            )}
                                            {isProcessingInstallment
                                              ? "Processing"
                                              : `Pay ${installment.percentage}%`}
                                          </Button>
                                        ) : null}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : null}
                        </React.Fragment>
                      );
                    })}
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
                                    className={`flex items-center gap-2 p-2 rounded-lg bg-background/20 hover:bg-background/30 transition-colors ${
                                      !isSelf
                                        ? "border border-border/50 bg-background/50"
                                        : ""
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
                <div className="border-t border-border/60 p-3 space-y-2">
                  {isChatLockedUntilPayment ? (
                    <div className="w-full rounded-md border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                      Pending your payment. Messages will start after the initial 20% payment.
                    </div>
                  ) : null}
                  <div className="flex gap-2">
                    <Input
                      placeholder={
                        isChatLockedUntilPayment
                          ? "Complete payment to unlock chat"
                          : "Type your message..."
                      }
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                      className="h-9 text-sm bg-muted border-border/60"
                      disabled={isChatLockedUntilPayment || isSending}
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      size="sm"
                      variant="outline"
                      className="h-9 w-9 p-0 border-border/60"
                      title="Upload document"
                      disabled={isChatLockedUntilPayment || isSending}
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
                      disabled={isChatLockedUntilPayment || isSending}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
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

              <Card className="border border-border/60 bg-card/80 shadow-sm backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-foreground">
                    Deliverables Approval
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Review freelancer submissions and approve or request revisions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {deliverableQueue.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No deliverables submitted yet. Uploaded project files will appear here.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {deliverableQueue.map((deliverable) => (
                        <div
                          key={deliverable.id}
                          className="rounded-lg border border-border/60 bg-background/30 p-3 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {deliverable.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {deliverable.size || "File"}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                deliverable.status === "approved"
                                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                                  : deliverable.status === "revision_requested"
                                  ? "border-amber-500/40 bg-amber-500/10 text-amber-500"
                                  : "border-border/60"
                              }
                            >
                              {deliverable.status === "approved"
                                ? "Approved"
                                : deliverable.status === "revision_requested"
                                ? "Revision Requested"
                                : "Pending Review"}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2">
                            {deliverable.url ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-xs"
                                asChild
                              >
                                <a href={deliverable.url} target="_blank" rel="noopener noreferrer">
                                  Open
                                </a>
                              </Button>
                            ) : null}
                            <Button
                              size="sm"
                              className="h-8 text-xs"
                              disabled={reviewingDeliverableId === deliverable.id}
                              onClick={() =>
                                handleDeliverableDecision(deliverable.id, "approved")
                              }
                            >
                              {reviewingDeliverableId === deliverable.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : null}
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs"
                              disabled={reviewingDeliverableId === deliverable.id}
                              onClick={() =>
                                handleDeliverableDecision(
                                  deliverable.id,
                                  "revision_requested"
                                )
                              }
                            >
                              Request Revisions
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
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
              <Card className="border border-border/60 bg-card/80 shadow-sm backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-foreground">
                    <CreditCard className="w-4 h-4" />
                    Payment Schedule
                  </CardTitle>
                  <CardDescription>
                    20% to start, 40% after phase 2, and the final 40% after phase 4.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Array.isArray(paymentPlan?.installments) && paymentPlan.installments.length > 0 ? (
                    <div className="space-y-2">
                      {paymentPlan.installments.map((installment) => (
                        <div
                          key={installment.sequence}
                          className="flex items-center justify-between rounded-lg border border-border/60 bg-background/50 px-3 py-3"
                        >
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {installment.label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {installment.percentage}% of project budget
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-foreground">
                              INR {Number(installment.amount || 0).toLocaleString()}
                            </p>
                            <Badge variant={installment.isDue ? "secondary" : "outline"}>
                              {installment.isPaid
                                ? "Paid"
                                : installment.isDue
                                ? "Due now"
                                : "Scheduled"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Payment schedule will appear once a proposal is accepted.
                    </p>
                  )}

                  {dueInstallment ? (
                    <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
                      <p className="text-sm font-semibold text-foreground">
                        Current payment due: {dueInstallment.label}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Pay {dueInstallment.percentage}% now to keep the project billing on schedule.
                      </p>
                      <Button
                        className="mt-3 w-full gap-2"
                        disabled={isProcessingInstallment}
                        onClick={handlePayDueInstallment}
                      >
                        {isProcessingInstallment ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CreditCard className="h-4 w-4" />
                        )}
                        {isProcessingInstallment
                          ? "Processing..."
                          : `Pay ${dueInstallment.percentage}%`}
                      </Button>
                    </div>
                  ) : paymentPlan?.isFullyPaid ? (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
                      All scheduled client payments are complete.
                    </div>
                  ) : paymentPlan ? (
                    <div className="rounded-lg border border-border/60 bg-background/50 p-3 text-sm text-muted-foreground">
                      No payment is due right now. The next installment will unlock automatically when its phase gate is complete.
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              {shouldCollectFreelancerReview ? (
                <Card className="border border-border/60 bg-card/80 shadow-sm backdrop-blur">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-foreground">
                      Freelancer Review
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {existingFreelancerReview
                        ? "Thanks for sharing your feedback for this completed project."
                        : "Project completed. Please rate your freelancer experience."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {existingFreelancerReview ? (
                      <>
                        <div className="flex items-center gap-1.5">
                          {Array.from({ length: 5 }).map((_, index) => {
                            const filled = index < Number(existingFreelancerReview.rating || 0);
                            return (
                              <Star
                                key={`reviewed-star-${index + 1}`}
                                className={cn(
                                  "h-4 w-4",
                                  filled
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-muted-foreground"
                                )}
                              />
                            );
                          })}
                          <span className="ml-1 text-xs text-muted-foreground">
                            {Number(existingFreelancerReview.rating || 0)} / 5
                          </span>
                        </div>
                        <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm text-foreground">
                          {existingFreelancerReview.comment}
                        </div>
                      </>
                    ) : shouldShowFreelancerReviewPrompt ? (
                      <>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Your rating
                          </p>
                          <div className="mt-2 flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, index) => {
                              const value = index + 1;
                              const selected = value <= reviewRating;

                              return (
                                <button
                                  key={`pending-review-star-${value}`}
                                  type="button"
                                  onClick={() => setReviewRating(value)}
                                  className="rounded p-0.5 transition-transform hover:scale-105"
                                  aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
                                >
                                  <Star
                                    className={cn(
                                      "h-5 w-5",
                                      selected
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-muted-foreground"
                                    )}
                                  />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Your feedback
                          </p>
                          <Textarea
                            className="mt-2"
                            rows={4}
                            placeholder="Share a quick feedback for the freelancer..."
                            value={reviewComment}
                            onChange={(event) => setReviewComment(event.target.value)}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            className="flex-1"
                            onClick={handleSubmitFreelancerReview}
                            disabled={isSubmittingFreelancerReview}
                          >
                            {isSubmittingFreelancerReview ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : null}
                            {isSubmittingFreelancerReview ? "Submitting" : "Submit Review"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleDeferFreelancerReview}
                            disabled={isSubmittingFreelancerReview}
                          >
                            Not now
                          </Button>
                        </div>
                      </>
                    ) : shouldShowFreelancerReviewReminder ? (
                      <div className="rounded-lg border border-border/60 bg-background/50 p-3">
                        <p className="text-sm font-semibold text-foreground">
                          Review pending
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          You can submit your freelancer review anytime from this project section.
                        </p>
                        <Button
                          className="mt-3 w-full"
                          variant="outline"
                          onClick={() => setReviewDeferredState(false)}
                        >
                          Review now
                        </Button>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ) : null}

            </div>
          </div>

          <ClientDashboardFooter variant="workspace" />
        </div>
      </div>

      {/* Verification Confirmation Dialog */}
      <Dialog open={verifyConfirmOpen} onOpenChange={setVerifyConfirmOpen}>
        <DialogContent disableScrollLock className="sm:max-w-md">
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

      <Dialog
        open={reportOpen}
        onOpenChange={(open) => {
          if (!isReporting) {
            setReportOpen(open);
          }
        }}
      >
        <DialogContent
          ref={reportDialogContentRef}
          className="sm:max-w-md max-h-[90vh] overflow-x-hidden overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>{catalystDialogTitle}</DialogTitle>
            <DialogDescription>{catalystDialogDescription}</DialogDescription>
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
                {isFreelancerChangeRequest
                  ? "No active Project Manager is assigned yet. Your request will be queued for review once the project manager is available."
                  : "No active project manager is assigned to this project yet."}
              </div>
            )}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Request type
              </p>
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/60 bg-background/40 p-1">
                <button
                  type="button"
                  onClick={() =>
                    handleCatalystRequestTypeChange(
                      CATALYST_REQUEST_TYPES.GENERAL
                    )
                  }
                  className={cn(
                    "rounded-lg px-3 py-2 text-left transition-colors",
                    !isFreelancerChangeRequest
                      ? "bg-accent text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  )}
                >
                  <span className="block text-sm font-semibold">
                    General support
                  </span>
                  <span className="mt-1 block text-xs">
                    Ask for help, raise an issue, or request PM support.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleCatalystRequestTypeChange(
                      CATALYST_REQUEST_TYPES.FREELANCER_CHANGE
                    )
                  }
                  className={cn(
                    "rounded-lg px-3 py-2 text-left transition-colors",
                    isFreelancerChangeRequest
                      ? "bg-accent text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  )}
                >
                  <span className="block text-sm font-semibold">
                    Change freelancer
                  </span>
                  <span className="mt-1 block text-xs">
                    Request PM review for a freelancer replacement.
                  </span>
                </button>
              </div>
            </div>
            {isFreelancerChangeRequest && (
              <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-3">
                <div className="flex items-start gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Reassignment Flow
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      The Project Catalyst collects your reason, then the Project
                      Manager reviews and handles the freelancer change.
                    </p>
                  </div>
                </div>
                {freelancer && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Current freelancer:{" "}
                    <span className="font-medium text-foreground">
                      {freelancer.fullName}
                    </span>
                  </p>
                )}
                {pendingFreelancerChangeRequest ? (
                  <div className="mt-3 rounded-md border border-amber-500/20 bg-amber-500/10 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-400">
                      Pending request
                    </p>
                    <p className="mt-2 text-sm text-foreground">
                      {pendingFreelancerChangeRequest.reason}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Project Catalyst has already shared this with the Project
                      Manager for review.
                    </p>
                  </div>
                ) : latestFreelancerChangeRequest ? (
                  <div className="mt-3 rounded-md border border-border/60 bg-background/40 p-3 text-sm text-muted-foreground">
                    Last request{" "}
                    {latestFreelancerChangeRequest.requestNumber ||
                      freelancerChangeCount}{" "}
                    was completed
                    {latestFreelancerChangeRequest.replacementFreelancerName
                      ? ` and reassigned to ${latestFreelancerChangeRequest.replacementFreelancerName}.`
                      : "."}
                  </div>
                ) : null}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                {catalystDialogNoteLabel}
              </label>
              <Textarea
                placeholder={catalystDialogNotePlaceholder}
                value={issueText}
                onChange={(e) => setIssueText(e.target.value)}
                className="subtle-scrollbar field-sizing-fixed min-h-32 max-h-56 resize-none overflow-y-auto whitespace-pre-wrap break-words pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-button]:h-0 [&::-webkit-scrollbar-button]:w-0"
              />
              {isFreelancerChangeRequest && (
                <p className="text-xs text-muted-foreground">
                  Share clear delivery, communication, or quality concerns so
                  the Project Manager has enough context to evaluate the change.
                </p>
              )}
            </div>
            {!isFreelancerChangeRequest && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">
                  Project Manager Availability
                </label>
                <div className="space-y-2">
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,9rem)]">
                    <Popover
                      open={datePopoverOpen}
                      onOpenChange={setDatePopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full min-w-0 justify-start rounded-xl border-border/70 bg-background/60 text-left font-normal",
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
                            {
                              before: new Date(
                                new Date().setHours(0, 0, 0, 0)
                              ),
                            },
                          ]}
                          className="rounded-md"
                        />
                      </PopoverContent>
                    </Popover>

                    <div className="min-w-0">
                      <Select
                        value={time || undefined}
                        onValueChange={setTime}
                        disabled={!date}
                      >
                        <SelectTrigger
                          className={cn(
                            "h-10 w-full rounded-xl border-border/70 bg-background/60 px-3 text-sm shadow-none",
                            !time && "text-muted-foreground"
                          )}
                        >
                          <SelectValue
                            placeholder={
                              date ? "Select time" : "Select date first"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="z-[80] rounded-xl border-border/70 bg-popover/95 backdrop-blur supports-[backdrop-filter]:bg-popover/90">
                          {effectiveTimeSlots.map((slot) => (
                            <SelectItem
                              key={slot}
                              value={slot}
                              className="cursor-pointer rounded-lg"
                            >
                              {slot}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {date && availableTimeSlots.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Manager has no configured slots for this date. Using
                      default working-hour options.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReportOpen(false)}
              disabled={isReporting}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleCatalystSubmit}
              disabled={isReporting || !issueText.trim()}
            >
              {isReporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending
                </>
              ) : (
                catalystDialogSubmitLabel
              )}
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







