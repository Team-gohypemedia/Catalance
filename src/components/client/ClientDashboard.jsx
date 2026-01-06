"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Clock,
  Banknote,
  Send,
  Star,
  CheckCircle,
  ChevronRight,
  Zap,
  X,
  Trash2,
  MapPin,
  Loader2,
  User,
  Wallet,
  Eye,
  Search,
  Bell,
  Plus,
  Calendar,
  Flag,
  MessageCircle,
  TrendingUp,
  AlertTriangle,
  Users,
  ArrowRight,
  Edit2,
  ExternalLink,
  Sun,
  Moon,
  CreditCard,
  Bot,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Heart,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getSession } from "@/lib/auth-storage";
import {
  listFreelancers,
  fetchChatConversations,
  API_BASE_URL,
} from "@/lib/api-client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { SuspensionAlert } from "@/components/ui/suspension-alert";
import { ClientTopBar } from "@/components/client/ClientTopBar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

const buildUrl = (path) => `${API_BASE_URL}${path.replace(/^\/api/, "")}`;
const SAVED_PROPOSALS_KEY = "markify:savedProposals";
const SAVED_PROPOSAL_KEY = "markify:savedProposal";

const buildLocalProposalId = () =>
  `saved-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const getProposalSignature = (proposal = {}) => {
  const title = (proposal.projectTitle || proposal.title || "")
    .trim()
    .toLowerCase();
  const service = (proposal.serviceKey || proposal.service || "")
    .trim()
    .toLowerCase();
  const summary = (proposal.summary || proposal.content || "")
    .trim()
    .toLowerCase();
  if (!title && !service) {
    return `${title}::${service}::${summary.slice(0, 120)}`;
  }
  return `${title}::${service}`;
};

const normalizeSavedProposal = (proposal = {}) => {
  const next = { ...proposal };
  if (!next.id) {
    next.id = next.localId || buildLocalProposalId();
  }

  const text = next.content || next.summary || "";
  if (!next.timeline && text) {
    const timelineMatch = text.match(/Timeline[:\s\-\n\u2022]*([^\n]+)/i);
    if (timelineMatch) {
      next.timeline = timelineMatch[1]
        .trim()
        .replace(/\(with buffer\)/gi, "")
        .trim();
    }
  }
  // Always re-parse budget from text to handle 'k' suffix correctly
  if (text) {
    // Match budget with optional 'k' suffix for thousands
    const budgetMatch = text.match(
      /Budget[:\s\-\n\u2022]*(?:INR|Rs\.?|₹|ƒ,1)?\s*([\d,]+)\s*(k)?/i
    );
    if (budgetMatch) {
      let budgetValue = parseFloat(budgetMatch[1].replace(/,/g, ""));
      // If 'k' suffix found, multiply by 1000
      if (budgetMatch[2] && /k/i.test(budgetMatch[2])) {
        budgetValue = budgetValue * 1000;
      }
      next.budget = String(budgetValue);
    }
  }
  return next;
};

const resolveActiveProposalId = (proposals, preferredId, fallbackId) => {
  if (!Array.isArray(proposals) || proposals.length === 0) return null;
  if (
    preferredId &&
    proposals.some((proposal) => proposal.id === preferredId)
  ) {
    return preferredId;
  }
  if (fallbackId && proposals.some((proposal) => proposal.id === fallbackId)) {
    return fallbackId;
  }
  return proposals[0].id;
};

// Helper function to format budget as ₹X,XXX
const formatBudget = (budget) => {
  if (!budget || budget === "Not set") return "Not set";

  const budgetStr = String(budget).trim();

  // Check if original had 'k' or 'K' suffix for thousands BEFORE cleaning
  const hasKSuffix = /\d+\s*k$/i.test(budgetStr);

  // Extract digits from the budget string (remove currency symbols, 'k' suffix, etc.)
  const cleaned = budgetStr.replace(/[^\d.]/g, "");
  const numValue = parseFloat(cleaned);
  if (isNaN(numValue)) return budget; // Return original if can't parse

  const finalValue = hasKSuffix ? numValue * 1000 : numValue;

  return `₹${finalValue.toLocaleString("en-IN")}`;
};

const loadSavedProposalsFromStorage = () => {
  if (typeof window === "undefined") return { proposals: [], activeId: null };
  let proposals = [];
  const listRaw = window.localStorage.getItem(SAVED_PROPOSALS_KEY);
  const singleRaw = window.localStorage.getItem(SAVED_PROPOSAL_KEY);

  if (listRaw) {
    try {
      const parsed = JSON.parse(listRaw);
      if (Array.isArray(parsed)) proposals = parsed;
    } catch {
      // ignore parse errors
    }
  }

  if (singleRaw) {
    try {
      const parsed = JSON.parse(singleRaw);
      if (parsed && (parsed.content || parsed.summary || parsed.projectTitle)) {
        const signature = getProposalSignature(parsed);
        const exists = proposals.some(
          (item) => getProposalSignature(item) === signature
        );
        if (!exists) proposals = [...proposals, parsed];
      }
    } catch {
      // ignore parse errors
    }
  }

  const normalized = proposals.map(normalizeSavedProposal);
  let activeId = null;
  if (singleRaw) {
    try {
      const parsed = JSON.parse(singleRaw);
      const signature = getProposalSignature(parsed);
      const match =
        normalized.find((item) => item.id === parsed?.id) ||
        normalized.find((item) => getProposalSignature(item) === signature);
      activeId = match?.id || null;
    } catch {
      activeId = null;
    }
  }
  activeId = resolveActiveProposalId(normalized, activeId, null);

  return { proposals: normalized, activeId };
};

const persistSavedProposalsToStorage = (proposals, activeId) => {
  if (typeof window === "undefined") return;
  if (!Array.isArray(proposals) || proposals.length === 0) {
    window.localStorage.removeItem(SAVED_PROPOSALS_KEY);
    window.localStorage.removeItem(SAVED_PROPOSAL_KEY);
    return;
  }
  window.localStorage.setItem(SAVED_PROPOSALS_KEY, JSON.stringify(proposals));
  const active =
    proposals.find((proposal) => proposal.id === activeId) || proposals[0];
  if (active) {
    window.localStorage.setItem(SAVED_PROPOSAL_KEY, JSON.stringify(active));
  }
};

const generateGradient = (id) => {
  if (!id) return "bg-[#FFD700]";

  // Simple hash function to generate a consistent seed
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate two colors
  const c1 = Math.abs(hash % 360);
  const c2 = (c1 + 40) % 360; // Complementary-ish or adjacent

  return `linear-gradient(135deg, hsl(${c1}, 80%, 60%), hsl(${c2}, 80%, 50%))`;
};

// ==================== Stats Card Component ====================
const StatsCard = ({
  title,
  value,
  trend,
  trendType = "up",
  icon: Icon,
  accentColor = "primary",
}) => {
  const colors = {
    primary: "bg-primary/10",
    blue: "bg-blue-500/10",
    red: "bg-red-500/10",
    green: "bg-green-500/10",
  };

  return (
    <Card className="relative overflow-hidden group hover:shadow-md transition-shadow border-border/60">
      <div
        className={`absolute top-0 right-0 w-16 h-16 ${colors[accentColor]} rounded-bl-full -mr-2 -mt-2 transition-transform group-hover:scale-110`}
      />
      <CardContent className="p-6 relative z-10">
        <p className="text-muted-foreground text-sm font-medium mb-1">
          {title}
        </p>
        <h3 className="text-3xl tracking-tight">{value}</h3>
        {trend && (
          <p
            className={`text-xs mt-2 flex items-center font-bold ${
              trendType === "up"
                ? "text-green-600"
                : trendType === "warning"
                ? "text-orange-600"
                : "text-muted-foreground"
            }`}
          >
            {trendType === "up" && <TrendingUp className="w-3.5 h-3.5 mr-1" />}
            {trendType === "warning" && (
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
            )}
            {trend}
          </p>
        )}
        {Icon && (
          <div className="mt-3 flex -space-x-2 overflow-hidden">
            {/* Placeholder for stacked avatars if needed */}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ==================== Budget Chart Component ====================
const BudgetChart = ({ percentage, remaining, spent }) => {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold">Budget Utilization</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg
              className="w-full h-full transform -rotate-90"
              viewBox="0 0 36 36"
            >
              <path
                className="text-muted/20"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="text-primary"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeDasharray={`${percentage}, 100`}
                strokeWidth="3"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-xl font-bold">{percentage}%</span>
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="text-sm font-bold">
                ₹{remaining?.toLocaleString() || 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Spent</p>
              <p className="text-sm font-bold">
                ₹{spent?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ==================== Talent Item Component ====================
const TalentItem = ({ name, role, avatar, status = "online", onClick }) => {
  const statusColors = {
    online: "bg-green-500",
    away: "bg-yellow-500",
    offline: "bg-gray-300",
  };

  return (
    <li
      className="flex items-center gap-3 group cursor-pointer"
      onClick={onClick}
    >
      <div className="relative">
        <Avatar className="w-10 h-10">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback>{name?.charAt(0) || "?"}</AvatarFallback>
        </Avatar>
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 ${statusColors[status]} border-2 border-background rounded-full`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate">{name}</p>
        <p className="text-xs text-muted-foreground truncate">{role}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-primary group-hover:text-primary transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          onClick && onClick();
        }}
      >
        <MessageCircle className="w-4 h-4" />
      </Button>
    </li>
  );
};

// ==================== Main Dashboard Component ====================
const ClientDashboardContent = () => {
  const [sessionUser, setSessionUser] = useState(null);
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [freelancers, setFreelancers] = useState([]); // Chat freelancers
  const [suggestedFreelancers, setSuggestedFreelancers] = useState([]); // All freelancers for suggestions
  const [isLoading, setIsLoading] = useState(true);
  const [showSuspensionAlert, setShowSuspensionAlert] = useState(false);
  const [savedProposals, setSavedProposals] = useState([]);
  const [activeProposalId, setActiveProposalId] = useState(null);
  const [isSendingProposal, setIsSendingProposal] = useState(false);
  const [dismissedProjectIds, setDismissedProjectIds] = useState(() => {
    try {
      const stored = localStorage.getItem("markify:dismissedExpiredProposals");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });
  const [selectedFreelancer, setSelectedFreelancer] = useState(null);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [showViewProposal, setShowViewProposal] = useState(false);
  const [showEditProposal, setShowEditProposal] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    summary: "",
    budget: "",
    timeline: "",
  });
  const [viewFreelancer, setViewFreelancer] = useState(null);
  const [showFreelancerDetails, setShowFreelancerDetails] = useState(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [projectToPay, setProjectToPay] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Increase Budget Dialog State
  const [showIncreaseBudget, setShowIncreaseBudget] = useState(false);
  const [budgetProject, setBudgetProject] = useState(null);
  const [newBudget, setNewBudget] = useState("");
  const [isUpdatingBudget, setIsUpdatingBudget] = useState(false);

  // Budget Reminder Popup State (for login)
  const [showBudgetReminder, setShowBudgetReminder] = useState(false);
  const [oldPendingProjects, setOldPendingProjects] = useState([]);

  // Freelancer Selection Popup State
  const [showFreelancerSelect, setShowFreelancerSelect] = useState(false);
  const [showFreelancerProfile, setShowFreelancerProfile] = useState(false);
  const [viewingFreelancer, setViewingFreelancer] = useState(null);

  const savedProposal = useMemo(() => {
    if (!savedProposals.length) return null;
    return (
      savedProposals.find((proposal) => proposal.id === activeProposalId) ||
      savedProposals[0]
    );
  }, [savedProposals, activeProposalId]);

  // Load projects
  // Load session
  useEffect(() => {
    const session = getSession();
    setSessionUser(session?.user ?? null);
    if (session?.user?.status === "SUSPENDED") {
      setShowSuspensionAlert(true);
    }
  }, []);

  // Load saved proposal from localStorage
  useEffect(() => {
    const { proposals, activeId } = loadSavedProposalsFromStorage();
    setSavedProposals(proposals);
    setActiveProposalId(activeId);
    persistSavedProposalsToStorage(proposals, activeId);
  }, []);

  const persistSavedProposalState = (
    nextProposals,
    preferredActiveId = null
  ) => {
    const normalized = Array.isArray(nextProposals)
      ? nextProposals.map(normalizeSavedProposal)
      : [];
    const resolvedActiveId = resolveActiveProposalId(
      normalized,
      preferredActiveId,
      activeProposalId
    );
    setSavedProposals(normalized);
    setActiveProposalId(resolvedActiveId);
    persistSavedProposalsToStorage(normalized, resolvedActiveId);
    return resolvedActiveId;
  };

  // Load projects
  // Load projects function
  const loadProjects = async () => {
    if (!authFetch) return;
    try {
      setIsLoading(true);
      const response = await authFetch("/projects");
      const payload = await response.json().catch(() => null);
      const fetchedProjects = Array.isArray(payload?.data) ? payload.data : [];
      setProjects(fetchedProjects);

      // Check for projects with pending proposals > 24 hours (for budget reminder popup)
      const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
      const projectsWithOldPending = fetchedProjects.filter((p) => {
        if (p.status !== "OPEN") return false;
        const pendingProposals = (p.proposals || []).filter(
          (prop) => (prop.status || "").toUpperCase() === "PENDING"
        );
        return pendingProposals.some(
          (prop) => new Date(prop.createdAt).getTime() < twentyFourHoursAgo
        );
      });

      // Show budget reminder popup if there are old pending proposals
      if (projectsWithOldPending.length > 0) {
        setOldPendingProjects(projectsWithOldPending);
        // Only show on initial load (not on refresh after sending proposal)
        const hasShownToday = sessionStorage.getItem("budgetReminderShown");
        if (!hasShownToday) {
          setShowBudgetReminder(true);
          sessionStorage.setItem("budgetReminderShown", "true");
        }
      }

      // Check for projects awaiting payment (Auto-show popup)
      const pendingPaymentProject = fetchedProjects.find(
        (p) => p.status === "AWAITING_PAYMENT"
      );
      if (pendingPaymentProject) {
        setProjectToPay(pendingPaymentProject);
        setShowPaymentConfirm(true);
      }
    } catch (error) {
      console.error("Failed to load projects", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [authFetch]);

  // Load freelancers
  // Load freelancers (chat conversations)
  useEffect(() => {
    const loadChatFreelancers = async () => {
      try {
        const data = await fetchChatConversations();
        const chatFreelancers = (Array.isArray(data) ? data : [])
          .filter((c) => c.freelancer) // only show if freelancer details exist
          .map((c) => {
            const parts = (c.service || "").split(":");
            // Format: CHAT:PROJECT_ID:CLIENT_ID:FREELANCER_ID
            // If service key format matches, parts[1] is projectId.
            // Fallback to c.id if we can't parse (though ClientChat expects projectId)
            const projectId =
              parts.length >= 2 && parts[0] === "CHAT" ? parts[1] : null;

            return {
              ...c.freelancer,
              chatId: c.id,
              projectId: projectId, // Add projectId for navigation
              lastMessage: c.lastMessage,
              projectTitle: c.projectTitle,
            };
          })
          .slice(0, 3); // show top 3 recent chats

        if (chatFreelancers.length > 0) {
          setFreelancers(chatFreelancers);
        } else {
          setFreelancers([]);
        }
      } catch (error) {
        console.error("Failed to load chat freelancers", error);
        setFreelancers([]);
      }
    };
    loadChatFreelancers();
    loadChatFreelancers();
  }, []);

  // Load all freelancers for suggestions
  useEffect(() => {
    const loadAllFreelancers = async () => {
      try {
        const all = await listFreelancers();
        // Filter out suspended or invalid ones if needed
        // For now, just take top 6
        setSuggestedFreelancers(Array.isArray(all) ? all.slice(0, 6) : []);
      } catch (err) {
        console.error("Failed to load suggested freelancers:", err);
      }
    };
    loadAllFreelancers();
  }, []);

  // Sort projects by date (most recent first)
  const uniqueProjects = useMemo(() => {
    return [...projects].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [projects]);

  // Computed metrics
  const metrics = useMemo(() => {
    const projectsWithAccepted = uniqueProjects.filter((p) =>
      (p.proposals || []).some(
        (pr) => (pr.status || "").toUpperCase() === "ACCEPTED"
      )
    );

    // Use actual spent amount from projects, not full budget
    const actualSpent = projectsWithAccepted.reduce((acc, p) => {
      // If project has a 'spent' field, use it; otherwise use 50% of budget (upfront payment)
      const spent =
        p.spent !== undefined
          ? parseInt(p.spent) || 0
          : Math.round((parseInt(p.budget) || 0) * 0.5);
      return acc + spent;
    }, 0);

    const activeProjectsCount = uniqueProjects.filter((p) => {
      const status = (p.status || "").toUpperCase();
      // Only count projects where payment is done (IN_PROGRESS)
      // Exclude OPEN (proposals) and AWAITING_PAYMENT
      return status === "IN_PROGRESS";
    }).length;

    const totalBudget = uniqueProjects
      .filter((p) => {
        const status = (p.status || "").toUpperCase();
        const hasAcceptedProposal = (p.proposals || []).some(
          (pr) => (pr.status || "").toUpperCase() === "ACCEPTED"
        );

        // Only count budget for projects that are actually active/committed
        // Exclude purely "OPEN" projects (invites) that haven't been accepted yet
        return (
          status === "IN_PROGRESS" ||
          status === "AWAITING_PAYMENT" ||
          hasAcceptedProposal
        );
      })
      .reduce((acc, p) => acc + (parseInt(p.budget) || 0), 0);

    return {
      totalSpent: actualSpent,
      activeProjects: activeProjectsCount,
      totalBudget: totalBudget,
    };
  }, [uniqueProjects]);

  const budgetPercentage = useMemo(() => {
    if (!metrics.totalBudget) return 0;
    return Math.round((metrics.totalSpent / metrics.totalBudget) * 100);
  }, [metrics]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const firstName = sessionUser?.fullName?.split(" ")[0] || "User";

  // Map project status to display
  const getStatusBadge = (status) => {
    const s = (status || "").toUpperCase();
    if (s === "COMPLETED") return { label: "Completed", variant: "default" };
    if (s === "IN_PROGRESS") return { label: "On Track", variant: "success" };
    if (s === "OPEN") return { label: "Open", variant: "warning" };
    return { label: status || "Pending", variant: "secondary" };
  };

  // Send proposal to freelancer
  const sendProposalToFreelancer = async (freelancer) => {
    if (!savedProposal || !freelancer) return;

    try {
      setIsSendingProposal(true);

      // Create project from proposal
      const projectRes = await authFetch("/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: savedProposal.projectTitle || "New Project",
          description: savedProposal.summary || savedProposal.content || "",
          budget:
            parseInt(
              String(savedProposal.budget || "0").replace(/[^0-9]/g, "")
            ) || 0,
          timeline: savedProposal.timeline || "1 month",
          status: "OPEN",
        }),
      });

      if (!projectRes.ok) throw new Error("Failed to create project");
      const projectData = await projectRes.json();
      const project = projectData.data.project;

      // Send proposal to freelancer
      const proposalRes = await authFetch("/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          freelancerId: freelancer.id,
          amount:
            parseInt(
              String(savedProposal.budget || "0").replace(/[^0-9]/g, "")
            ) || 0,
          coverLetter: savedProposal.summary || savedProposal.content || "",
        }),
      });

      if (!proposalRes.ok) throw new Error("Failed to send proposal");

      toast.success(`Proposal sent to ${freelancer.fullName || "freelancer"}!`);

      // Refresh projects so the freelancer is immediately hidden from the list
      await loadProjects();

      // Keep the proposal so user can send to more freelancers
      // The freelancer just sent to will be filtered out from the list

      setShowSendConfirm(false);
      setSelectedFreelancer(null);
    } catch (error) {
      console.error("Failed to send proposal:", error);
      toast.error("Failed to send proposal. Please try again.");
    } finally {
      setIsSendingProposal(false);
    }
  };

  const handleSendClick = (freelancer) => {
    setSelectedFreelancer(freelancer);
    setShowSendConfirm(true);
  };

  const confirmSend = () => {
    if (selectedFreelancer) {
      sendProposalToFreelancer(selectedFreelancer);
    }
  };

  const handlePaymentClick = (project) => {
    setProjectToPay(project);
    setShowPaymentConfirm(true);
  };

  const processPayment = async () => {
    if (!projectToPay) return;
    setIsProcessingPayment(true);
    try {
      const res = await authFetch(`/projects/${projectToPay.id}/pay-upfront`, {
        method: "POST",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Payment failed");
      }

      toast.success("Payment processed successfully! Project is now active.");
      setShowPaymentConfirm(false);
      setProjectToPay(null);
      // Refresh projects to update status
      loadProjects();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error.message || "Failed to process payment");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleIncreaseBudgetClick = (project) => {
    setBudgetProject(project);
    setNewBudget(String(project.budget || ""));
    setShowIncreaseBudget(true);
  };

  const updateBudget = async () => {
    if (!budgetProject || !newBudget) return;

    const budgetValue = parseInt(newBudget.replace(/[^0-9]/g, ""));
    if (!budgetValue || budgetValue <= (budgetProject.budget || 0)) {
      toast.error("New budget must be higher than current budget");
      return;
    }

    setIsUpdatingBudget(true);
    try {
      // Update the project budget
      const res = await authFetch(`/projects/${budgetProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budget: budgetValue }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update budget");
      }

      // Check if any pending proposals are older than 48 hours
      const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000;
      const pendingProposals = (budgetProject.proposals || []).filter(
        (p) => (p.status || "").toUpperCase() === "PENDING"
      );

      // Separate old (>48hrs) and recent (<48hrs) proposals
      const oldProposals = pendingProposals.filter(
        (p) => new Date(p.createdAt).getTime() < fortyEightHoursAgo
      );
      const recentProposals = pendingProposals.filter(
        (p) => new Date(p.createdAt).getTime() >= fortyEightHoursAgo
      );

      let rejectedCount = 0;
      // Reject proposals older than 48 hours
      for (const proposal of oldProposals) {
        try {
          await authFetch(`/proposals/${proposal.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "REJECTED" }),
          });
          rejectedCount++;
        } catch (e) {
          console.error("Failed to reject old proposal:", e);
        }
      }

      // Update amount on recent pending proposals (under 48hrs) to reflect new budget
      for (const proposal of recentProposals) {
        try {
          await authFetch(`/proposals/${proposal.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: budgetValue }),
          });
        } catch (e) {
          console.error("Failed to update proposal amount:", e);
        }
      }

      // Always update saved proposals with new budget if they match this project
      const { proposals: storedProposals, activeId } =
        loadSavedProposalsFromStorage();
      if (storedProposals.length) {
        let updatedAny = false;
        const budgetRegex =
          /Budget[\s\n]*[-:]*[\s\n]*(?:INR|Rs\.?|₹|ƒ,1)?\s*[\d,]+/gi;
        const newBudgetText = `Budget\n- ƒ,1${budgetValue.toLocaleString()}`;
        const updatedProposals = storedProposals.map((proposal) => {
          const matchesId =
            proposal.projectId && proposal.projectId === budgetProject.id;
          const matchesTitle = proposal.projectTitle === budgetProject.title;
          if (!matchesId && !matchesTitle) return proposal;
          updatedAny = true;
          const next = {
            ...proposal,
            budget: `ƒ,1${budgetValue.toLocaleString()}`,
            updatedAt: new Date().toISOString(),
          };
          if (next.summary) {
            next.summary = next.summary.replace(budgetRegex, newBudgetText);
          }
          if (next.content) {
            next.content = next.content.replace(budgetRegex, newBudgetText);
          }
          return next;
        });

        if (updatedAny) {
          persistSavedProposalState(updatedProposals, activeId);
        }
      }
      // Show appropriate message based on whether proposals were rejected
      if (rejectedCount > 0) {
        toast.success(
          `Budget updated to ₹${budgetValue.toLocaleString()}! ${rejectedCount} expired proposal(s) removed. You can now send to new freelancers.`
        );
      } else {
        // Just updated budget (proposals are still pending, under 48hrs)
        toast.success(
          `Budget updated to ₹${budgetValue.toLocaleString()}! Freelancers will see the new amount.`
        );
      }

      setShowIncreaseBudget(false);
      setBudgetProject(null);
      setNewBudget("");
      loadProjects();
    } catch (error) {
      console.error("Budget update error:", error);
      toast.error(error.message || "Failed to update budget");
    } finally {
      setIsUpdatingBudget(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative h-full overflow-hidden bg-background">
      {/* Grid pattern background */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-30 dark:opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Top Bar */}
      <div className="sticky top-0 z-40 px-6 py-3 bg-background/85 backdrop-blur-xl border-b border-border/50">
        <ClientTopBar label="Dashboard" />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-10 z-10 relative">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column - Main Content */}
            <div className="flex-1 min-w-0 flex flex-col gap-8">
              {/* Welcome Section */}
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl md:text-4xl font-semibold mb-2">
                    {greeting}, {firstName}
                  </h1>
                  <p className="text-muted-foreground font-medium">
                    Here's what's happening in your Executive Control Room
                    today.
                  </p>
                </div>
                <div className="hidden sm:flex gap-2">
                  <Badge
                    variant="outline"
                    className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600 mr-1.5" />
                    System Operational
                  </Badge>
                </div>
              </div>

              {/* Stats Cards */}
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatsCard
                  title="Total Spent"
                  value={`₹${metrics.totalSpent.toLocaleString()}`}
                  trend="Invested so far"
                  trendType="neutral"
                  accentColor="primary"
                />
                <StatsCard
                  title="Active Projects"
                  value={String(metrics.activeProjects)}
                  trend="In progress & Open"
                  trendType="up"
                  accentColor="blue"
                />
                <StatsCard
                  title="Total Budget"
                  value={`₹${metrics.totalBudget.toLocaleString()}`}
                  trend="Allocated budget"
                  trendType="neutral"
                  accentColor="green" // Changed to green for budget
                />
              </div>

              {/* Saved Proposal Section - Show when proposal exists but no projects */}
              {savedProposal && (
                <div className="space-y-6">
                  {savedProposals.length > 1 && (
                    <div className="flex flex-wrap gap-2">
                      {savedProposals.map((proposal) => (
                        <Button
                          key={proposal.id}
                          size="sm"
                          variant={
                            proposal.id === savedProposal.id
                              ? "default"
                              : "outline"
                          }
                          onClick={() => {
                            setActiveProposalId(proposal.id);
                            persistSavedProposalsToStorage(
                              savedProposals,
                              proposal.id
                            );
                          }}
                        >
                          {proposal.projectTitle ||
                            proposal.service ||
                            "Proposal"}
                        </Button>
                      ))}
                    </div>
                  )}
                  {/* Proposal Preview */}
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                          <Send className="w-5 h-5 text-primary" />
                          {savedProposals.length > 1
                            ? "Your Saved Proposals"
                            : "Your Saved Proposal"}
                        </CardTitle>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-primary"
                            onClick={() => setShowViewProposal(true)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-primary"
                            onClick={() => {
                              setEditForm({
                                title: savedProposal.projectTitle || "",
                                summary:
                                  savedProposal.summary ||
                                  savedProposal.content ||
                                  "",
                                budget: savedProposal.budget || "",
                                timeline: savedProposal.timeline || "",
                              });
                              setShowEditProposal(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              localStorage.removeItem("markify:savedProposal");
                              persistSavedProposalState([]);
                              toast.success("Proposal deleted");
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <h4 className="font-semibold">
                          {savedProposal.projectTitle || "New Project"}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {savedProposal.summary ||
                            savedProposal.content ||
                            "No description"}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-2 text-sm">
                            <Badge variant="secondary">
                              Budget: {formatBudget(savedProposal.budget)}
                            </Badge>
                            <Badge variant="secondary">
                              Timeline: {savedProposal.timeline || "Not set"}
                            </Badge>
                          </div>
                          <Button
                            className="gap-2"
                            onClick={() => setShowFreelancerSelect(true)}
                          >
                            <Send className="w-4 h-4" />
                            Send
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Projects Needing Resend - Show OPEN projects where all proposals were rejected */}
              {(() => {
                const projectsNeedingResend = uniqueProjects
                  .filter((p) => {
                    if (p.status !== "OPEN") return false;
                    const proposals = p.proposals || [];
                    if (proposals.length === 0) return false;
                    // All proposals are rejected (none pending or accepted)
                    return !proposals.some((prop) =>
                      ["PENDING", "ACCEPTED"].includes(
                        (prop.status || "").toUpperCase()
                      )
                    );
                  })
                  .filter((p) => !dismissedProjectIds.includes(p.id));

                // Deduplicate by title - keep only the latest project for each title
                const latestProjectsNeedingResend = Object.values(
                  projectsNeedingResend.reduce((acc, project) => {
                    const currentStored = acc[project.title];
                    // If no project stored for this title, OR current project is newer than stored one
                    if (
                      !currentStored ||
                      new Date(project.createdAt) >
                        new Date(currentStored.createdAt)
                    ) {
                      acc[project.title] = project;
                    }
                    return acc;
                  }, {})
                ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by newest first

                if (latestProjectsNeedingResend.length === 0 || savedProposal)
                  return null;

                return (
                  <div className="space-y-6">
                    {latestProjectsNeedingResend.map((project) => (
                      <div key={project.id} className="space-y-6">
                        {/* Proposal Preview Card - Similar to Your Saved Proposal */}
                        <Card className="border-orange-500/20 bg-orange-500/5">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-orange-500" />
                                Proposal Expired - Resend Required
                              </CardTitle>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={async () => {
                                  // Delete all related projects with the same title from the database
                                  const relatedProjectIds = uniqueProjects
                                    .filter((p) => p.title === project.title)
                                    .map((p) => p.id);

                                  // Delete from database
                                  for (const projectId of relatedProjectIds) {
                                    try {
                                      await authFetch(
                                        `/projects/${projectId}`,
                                        {
                                          method: "DELETE",
                                        }
                                      );
                                    } catch (err) {
                                      console.error(
                                        `Failed to delete project ${projectId}:`,
                                        err
                                      );
                                    }
                                  }

                                  // Update local state immediately
                                  setDismissedProjectIds((prev) => [
                                    ...prev,
                                    ...relatedProjectIds,
                                  ]);

                                  // Refresh projects list
                                  loadProjects();

                                  toast.success(
                                    "Expired proposal removed permanently"
                                  );
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <h4 className="text-xl font-bold">
                                {project.title}
                              </h4>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {project.description ||
                                  "No description available."}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary">
                                  Budget: ₹
                                  {(project.budget || 0).toLocaleString()}
                                </Badge>
                                <Badge variant="secondary">
                                  Timeline: {project.timeline || "Not set"}
                                </Badge>
                              </div>
                              <div className="pt-4 border-t mt-4">
                                <p className="text-sm text-orange-500 mb-3">
                                  Your budget is low, please increase the
                                  budget.
                                </p>
                                <Button
                                  className="w-full gap-2"
                                  onClick={() => {
                                    // Create saved proposal from this project
                                    const newSavedProposal = {
                                      projectTitle: project.title,
                                      summary: project.description || "",
                                      budget: `ƒ,1${(
                                        project.budget || 0
                                      ).toLocaleString()}`,
                                      timeline: project.timeline || "1 month",
                                      projectId: project.id,
                                    };
                                    const normalized = normalizeSavedProposal({
                                      ...newSavedProposal,
                                      createdAt: new Date().toISOString(),
                                    });
                                    const signature =
                                      getProposalSignature(normalized);
                                    const existingIndex =
                                      savedProposals.findIndex(
                                        (proposal) =>
                                          getProposalSignature(proposal) ===
                                          signature
                                      );
                                    let nextProposals = [];
                                    let nextActiveId = normalized.id;
                                    if (existingIndex >= 0) {
                                      nextProposals = savedProposals.map(
                                        (proposal, idx) =>
                                          idx === existingIndex
                                            ? {
                                                ...proposal,
                                                ...normalized,
                                                id: proposal.id,
                                              }
                                            : proposal
                                      );
                                      nextActiveId =
                                        savedProposals[existingIndex]?.id ||
                                        normalized.id;
                                    } else {
                                      nextProposals = [
                                        ...savedProposals,
                                        normalized,
                                      ];
                                    }
                                    persistSavedProposalState(
                                      nextProposals,
                                      nextActiveId
                                    );
                                    // Open increase budget dialog
                                    handleIncreaseBudgetClick(project);
                                  }}
                                >
                                  <TrendingUp className="w-4 h-4" />
                                  Increase Budget & Resend
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Confirm Send Dialog */}
              <Dialog open={showSendConfirm} onOpenChange={setShowSendConfirm}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Send Proposal</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to send your proposal to{" "}
                      {selectedFreelancer?.fullName || selectedFreelancer?.name}
                      ?
                    </DialogDescription>
                  </DialogHeader>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="font-semibold">
                      {savedProposal?.projectTitle || "New Project"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Budget: {formatBudget(savedProposal?.budget)}
                    </p>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowSendConfirm(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={confirmSend} disabled={isSendingProposal}>
                      {isSendingProposal ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Send Proposal
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Payment Confirmation Dialog */}
              <Dialog
                open={showPaymentConfirm}
                onOpenChange={setShowPaymentConfirm}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Upfront Payment</DialogTitle>
                    <DialogDescription>
                      {(() => {
                        const budget = parseInt(projectToPay?.budget) || 0;
                        let percentage = "50%";
                        if (budget > 200000) percentage = "25%";
                        else if (budget >= 50000) percentage = "33%";
                        return `This project requires a ${percentage} upfront payment to begin. This amount will be held in escrow.`;
                      })()}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Project:</span>
                      <span className="font-medium">{projectToPay?.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Total Budget:
                      </span>
                      <span>
                        ₹{(projectToPay?.budget || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold text-lg">
                      {(() => {
                        const budget = parseInt(projectToPay?.budget) || 0;
                        let label = "Pay Now (50%)";
                        let divisor = 2;

                        if (budget > 200000) {
                          label = "Pay Now (25%)";
                          divisor = 4;
                        } else if (budget >= 50000) {
                          label = "Pay Now (33%)";
                          divisor = 3;
                        }

                        return (
                          <>
                            <span>{label}:</span>
                            <span className="text-primary">
                              ₹{Math.round(budget / divisor).toLocaleString()}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowPaymentConfirm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={processPayment}
                      disabled={isProcessingPayment}
                      className="gap-2"
                    >
                      {isProcessingPayment ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CreditCard className="w-4 h-4" />
                      )}
                      Confirm Payment
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Increase Budget Dialog */}
              <Dialog
                open={showIncreaseBudget}
                onOpenChange={setShowIncreaseBudget}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Increase Project Budget
                    </DialogTitle>
                    <DialogDescription>
                      Increase your budget to attract freelancers faster. Higher
                      budgets often get accepted sooner.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Project:</span>
                        <span className="font-medium">
                          {budgetProject?.title}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Current Budget:
                        </span>
                        <span className="font-medium">
                          ₹{(budgetProject?.budget || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Quick Increase Options */}
                    <div>
                      <label className="text-xs font-medium mb-2 block text-muted-foreground">
                        Quick Increase
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[10000, 20000, 30000, 50000, 80000].map((amount) => (
                          <Button
                            key={amount}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="bg-background hover:bg-primary/10 hover:text-primary hover:border-primary/50 text-xs h-7"
                            onClick={() => {
                              const current =
                                parseInt(budgetProject?.budget) || 0;
                              setNewBudget(String(current + amount));
                            }}
                          >
                            +{amount >= 1000 ? `${amount / 1000}k` : amount}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        New Budget (₹)
                      </label>
                      <Input
                        type="text"
                        value={newBudget}
                        onChange={(e) =>
                          setNewBudget(e.target.value.replace(/[^0-9]/g, ""))
                        }
                        placeholder="Enter new budget amount"
                        className="text-lg"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Must be higher than current budget
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowIncreaseBudget(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={updateBudget}
                      disabled={isUpdatingBudget}
                      className="gap-2"
                    >
                      {isUpdatingBudget ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <TrendingUp className="w-4 h-4" />
                      )}
                      Update Budget
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Budget Reminder Popup (shown on login) */}
              <Dialog
                open={showBudgetReminder}
                onOpenChange={setShowBudgetReminder}
              >
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-orange-500">
                      <AlertTriangle className="w-5 h-5" />
                      Budget Increase Recommended
                    </DialogTitle>
                    <DialogDescription>
                      Some of your proposals have been pending for over 24
                      hours. Consider increasing your budget to attract
                      freelancers faster.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 py-4 max-h-60 overflow-y-auto">
                    {oldPendingProjects.map((project) => (
                      <div
                        key={project.id}
                        className="p-3 bg-muted/50 rounded-lg flex items-center justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {project.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Budget: ₹{(project.budget || 0).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-primary text-primary hover:bg-primary/10 shrink-0"
                          onClick={() => {
                            setShowBudgetReminder(false);
                            handleIncreaseBudgetClick(project);
                          }}
                        >
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Increase
                        </Button>
                      </div>
                    ))}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowBudgetReminder(false)}
                    >
                      Remind Me Later
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Freelancer Selection Dialog */}
              <Dialog
                open={showFreelancerSelect}
                onOpenChange={setShowFreelancerSelect}
              >
                <DialogContent className="max-w-[95vw] w-[95vw] sm:max-w-[85vw] md:max-w-[80vw] lg:max-w-[75vw] h-[85vh] flex flex-col p-6">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                      <Send className="w-5 h-5 text-primary" />
                      Choose a Freelancer
                    </DialogTitle>
                    <DialogDescription>
                      Select a freelancer to send your proposal:{" "}
                      <span className="font-medium text-foreground">
                        {savedProposal?.projectTitle}
                      </span>
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto py-6 px-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {(() => {
                        const projectTitle =
                          savedProposal?.projectTitle?.trim();
                        const alreadyInvitedIds = new Set();

                        if (projectTitle) {
                          // Check all projects with same title for freelancers with PENDING proposals
                          projects.forEach((p) => {
                            if ((p.title || "").trim() === projectTitle) {
                              (p.proposals || []).forEach((prop) => {
                                // Only count PENDING proposals - REJECTED means we can resend
                                const status = (
                                  prop.status || ""
                                ).toUpperCase();
                                if (prop.freelancerId && status === "PENDING") {
                                  alreadyInvitedIds.add(prop.freelancerId);
                                }
                              });
                            }
                          });
                        }

                        const availableFreelancers =
                          suggestedFreelancers.filter(
                            (f) => !alreadyInvitedIds.has(f.id)
                          );

                        if (
                          availableFreelancers.length === 0 &&
                          suggestedFreelancers.length > 0
                        ) {
                          return (
                            <div className="col-span-full text-center py-8 text-muted-foreground">
                              <p>
                                All suggested freelancers have already been
                                invited for this project.
                              </p>
                            </div>
                          );
                        }

                        return availableFreelancers.length > 0 ? (
                          availableFreelancers.map((f) => {
                            // Pre-process freelancer data to handle JSON bio/about
                            const freelancer = { ...f };
                            const rawBio = freelancer.bio || freelancer.about;

                            if (
                              typeof rawBio === "string" &&
                              rawBio.trim().startsWith("{")
                            ) {
                              try {
                                const parsed = JSON.parse(rawBio);
                                // Merge parsed fields if top-level fields are missing
                                if (!freelancer.location && parsed.location)
                                  freelancer.location = parsed.location;
                                if (!freelancer.role && parsed.role)
                                  freelancer.role = parsed.role;
                                if (!freelancer.title && parsed.title)
                                  freelancer.role = parsed.title; // Fallback for title
                                if (!freelancer.rating && parsed.rating)
                                  freelancer.rating = parsed.rating;
                                if (
                                  (!freelancer.skills ||
                                    freelancer.skills.length === 0) &&
                                  parsed.skills
                                )
                                  freelancer.skills = parsed.skills;
                                if (!freelancer.hourlyRate && parsed.hourlyRate)
                                  freelancer.hourlyRate = parsed.hourlyRate;

                                // Set a clean bio description
                                freelancer.cleanBio =
                                  parsed.bio ||
                                  parsed.about ||
                                  parsed.description ||
                                  parsed.summary ||
                                  parsed.overview ||
                                  parsed.introduction ||
                                  parsed.profileSummary ||
                                  parsed.shortDescription ||
                                  (Array.isArray(parsed.services) &&
                                  parsed.services.length > 0
                                    ? `Experienced in ${parsed.services.join(
                                        ", "
                                      )}`
                                    : null) ||
                                  "No bio available.";
                              } catch (e) {
                                freelancer.cleanBio =
                                  "Overview available in profile.";
                              }
                            } else {
                              freelancer.cleanBio =
                                rawBio ||
                                "No bio available for this freelancer.";
                            }

                            return (
                              <div
                                key={freelancer.id}
                                className="relative flex flex-col items-center bg-card rounded-xl shadow-sm border border-border/40 overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer h-full min-h-[320px]"
                                onClick={() => {
                                  setViewingFreelancer(freelancer);
                                  setShowFreelancerProfile(true);
                                }}
                              >
                                {/* Dynamic Gradient Header */}
                                <div
                                  className="w-full h-32 flex items-center justify-center transition-all duration-500"
                                  style={{
                                    background: generateGradient(
                                      freelancer.id || freelancer.name
                                    ),
                                  }}
                                ></div>

                                {/* Avatar */}
                                <div className="absolute top-16">
                                  <div className="rounded-full">
                                    <Avatar className="w-28 h-28 bg-card">
                                      <AvatarImage
                                        src={freelancer.avatar}
                                        className="object-cover"
                                      />
                                      <AvatarFallback className="bg-primary/20 text-primary text-3xl font-bold">
                                        {(
                                          freelancer.fullName ||
                                          freelancer.name ||
                                          "F"
                                        ).charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                  </div>
                                </div>

                                {/* Body */}
                                <div className="mt-14 px-4 pb-6 w-full flex flex-col items-center text-center flex-1">
                                  <h3 className="text-2xl font-bold mt-2 text-foreground">
                                    {freelancer.fullName || freelancer.name}
                                  </h3>
                                  <p className="text-sm text-muted-foreground font-medium mb-5">
                                    {freelancer.role || "Freelancer"}
                                  </p>

                                  {/* Skills Row */}
                                  <div className="flex flex-wrap justify-center gap-2 mb-4 px-2 min-h-[40px]">
                                    {Array.isArray(freelancer.skills) &&
                                    freelancer.skills.length > 0 ? (
                                      freelancer.skills
                                        .slice(0, 3)
                                        .map((skill, idx) => (
                                          <Badge
                                            key={idx}
                                            variant="secondary"
                                            className="bg-primary/5 hover:bg-primary/10 text-primary border-primary/10 transition-colors"
                                          >
                                            {skill}
                                          </Badge>
                                        ))
                                    ) : (
                                      <span className="text-sm text-muted-foreground">
                                        No specific skills listed
                                      </span>
                                    )}
                                    {Array.isArray(freelancer.skills) &&
                                      freelancer.skills.length > 3 && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs text-muted-foreground border-dashed"
                                        >
                                          +{freelancer.skills.length - 3} more
                                        </Badge>
                                      )}
                                  </div>

                                  {/* Project Link with Hover Preview */}
                                  {(() => {
                                    let project = null;
                                    if (
                                      Array.isArray(
                                        freelancer.portfolioProjects
                                      ) &&
                                      freelancer.portfolioProjects.length > 0
                                    ) {
                                      project =
                                        freelancer.portfolioProjects.find(
                                          (p) => p.link || p.url
                                        );
                                    } else if (
                                      typeof freelancer.portfolio ===
                                        "string" &&
                                      freelancer.portfolio.startsWith("[")
                                    ) {
                                      try {
                                        const parsed = JSON.parse(
                                          freelancer.portfolio
                                        );
                                        if (Array.isArray(parsed))
                                          project = parsed.find(
                                            (p) => p.link || p.url
                                          );
                                      } catch (e) {}
                                    }

                                    if (
                                      project &&
                                      (project.link || project.url)
                                    ) {
                                      return (
                                        <div className="mb-6 flex flex-col items-center gap-2">
                                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Projects
                                          </p>
                                          <HoverCard>
                                            <HoverCardTrigger asChild>
                                              <a
                                                href={
                                                  project.link || project.url
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-medium max-w-[200px]"
                                                onClick={(e) =>
                                                  e.stopPropagation()
                                                }
                                              >
                                                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                                <span className="truncate">
                                                  {project.title ||
                                                    "View Project"}
                                                </span>
                                              </a>
                                            </HoverCardTrigger>
                                            <HoverCardContent
                                              className="w-64 p-0 overflow-hidden"
                                              align="center"
                                            >
                                              {project.image ||
                                              project.imageUrl ||
                                              project.thumbnail ? (
                                                <div className="w-full aspect-video bg-muted relative">
                                                  <img
                                                    src={
                                                      project.image ||
                                                      project.imageUrl ||
                                                      project.thumbnail
                                                    }
                                                    alt={
                                                      project.title ||
                                                      "Project preview"
                                                    }
                                                    className="w-full h-full object-cover"
                                                  />
                                                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                                    <p className="text-white text-xs font-bold truncate">
                                                      {project.title ||
                                                        "Project Preview"}
                                                    </p>
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="p-3">
                                                  <p className="font-semibold text-sm">
                                                    {project.title ||
                                                      "Project Link"}
                                                  </p>
                                                  <p className="text-xs text-muted-foreground break-all mt-1">
                                                    {project.link ||
                                                      project.url}
                                                  </p>
                                                </div>
                                              )}
                                            </HoverCardContent>
                                          </HoverCard>
                                        </div>
                                      );
                                    }
                                    return <div className="mb-6"></div>; // Spacer if no project
                                  })()}
                                  {/* Action Buttons */}
                                  <div className="flex gap-4 w-full px-4 mt-auto mb-6">
                                    <Button
                                      className="flex-1 bg-[#FFD700] hover:bg-[#F0C800] text-black font-bold rounded-full h-11 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSendClick(freelancer);
                                      }}
                                    >
                                      <Send className="w-4 h-4" />
                                      Send Proposal
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <Card className="col-span-full">
                            <CardContent className="p-8 text-center text-muted-foreground">
                              No freelancers available. Check back later!
                            </CardContent>
                          </Card>
                        );
                      })()}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowFreelancerSelect(false)}
                    >
                      Cancel
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Freelancer Profile Dialog */}
              <Dialog
                open={showFreelancerProfile}
                onOpenChange={setShowFreelancerProfile}
              >
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6">
                  {viewingFreelancer && (
                    <>
                      <DialogHeader>
                        <div className="flex items-start gap-4">
                          <Avatar className="w-16 h-16 border-2 border-primary/10">
                            <AvatarImage
                              src={viewingFreelancer.avatar}
                              alt={viewingFreelancer.fullName}
                            />
                            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                              {(
                                viewingFreelancer.fullName ||
                                viewingFreelancer.name
                              )?.charAt(0) || "F"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                              {viewingFreelancer.fullName ||
                                viewingFreelancer.name}
                              {viewingFreelancer.rating && (
                                <div className="flex items-center text-sm font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                  <Star className="w-3.5 h-3.5 mr-1 fill-current" />
                                  {viewingFreelancer.rating}
                                </div>
                              )}
                            </DialogTitle>
                            <DialogDescription className="text-base font-medium text-foreground/80 mt-1">
                              {viewingFreelancer.role || "Freelancer"}
                            </DialogDescription>

                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                              {viewingFreelancer.location && (
                                <span className="flex items-center">
                                  <MapPin className="w-3.5 h-3.5 mr-1" />
                                  {viewingFreelancer.location}
                                </span>
                              )}
                              {viewingFreelancer.hourlyRate && (
                                <span className="flex items-center">
                                  <Wallet className="w-3.5 h-3.5 mr-1" />
                                  {viewingFreelancer.hourlyRate}/hr
                                </span>
                              )}
                              {viewingFreelancer.experience && (
                                <span className="flex items-center">
                                  <Briefcase className="w-3.5 h-3.5 mr-1" />
                                  {viewingFreelancer.experience} Exp.
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Send Proposal Button Removed as per request */}
                        </div>
                      </DialogHeader>

                      <div className="flex-1 overflow-y-auto py-6 space-y-8 pr-2">
                        {/* Bio */}
                        <div>
                          <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" /> About
                          </h4>
                          <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                            {viewingFreelancer.cleanBio || "No bio available."}
                          </p>
                        </div>

                        {/* Skills */}
                        {Array.isArray(viewingFreelancer.skills) &&
                          viewingFreelancer.skills.length > 0 && (
                            <div>
                              <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-primary" /> Skills
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {viewingFreelancer.skills.map((skill, i) => (
                                  <Badge
                                    key={i}
                                    variant="secondary"
                                    className="px-3 py-1"
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Languages */}
                        {Array.isArray(viewingFreelancer.languages) &&
                          viewingFreelancer.languages.length > 0 && (
                            <div>
                              <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <MessageCircle className="w-5 h-5 text-primary" />{" "}
                                Languages
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {viewingFreelancer.languages.map((lang, i) => (
                                  <Badge
                                    key={i}
                                    variant="outline"
                                    className="px-3 py-1"
                                  >
                                    {lang}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Portfolio Projects */}
                        {(() => {
                          // Try to get projects from portfolioProjects array or parse portfolio string
                          let projects = [];
                          if (
                            Array.isArray(
                              viewingFreelancer.portfolioProjects
                            ) &&
                            viewingFreelancer.portfolioProjects.length > 0
                          ) {
                            projects = viewingFreelancer.portfolioProjects;
                          } else if (
                            typeof viewingFreelancer.portfolio === "string" &&
                            viewingFreelancer.portfolio.startsWith("[")
                          ) {
                            try {
                              projects = JSON.parse(
                                viewingFreelancer.portfolio
                              );
                            } catch (e) {}
                          } else if (
                            Array.isArray(viewingFreelancer.portfolio)
                          ) {
                            projects = viewingFreelancer.portfolio;
                          }

                          if (projects.length > 0) {
                            return (
                              <div>
                                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                  <Briefcase className="w-5 h-5 text-primary" />{" "}
                                  Portfolio Projects
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {projects.map((project, i) => (
                                    <Card
                                      key={i}
                                      className="overflow-hidden border-border/50 hover:border-primary/20 transition-all flex flex-col h-full group/card"
                                    >
                                      {(project.image ||
                                        project.imageUrl ||
                                        project.thumbnail) && (
                                        <div className="w-full h-28 bg-muted relative overflow-hidden">
                                          <img
                                            src={
                                              project.image ||
                                              project.imageUrl ||
                                              project.thumbnail
                                            }
                                            alt={project.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                                          />
                                        </div>
                                      )}
                                      <CardContent className="p-3 flex flex-col flex-1">
                                        <h5 className="font-bold text-sm mb-1 line-clamp-1">
                                          {project.title || `Project ${i + 1}`}
                                        </h5>
                                        {(project.description ||
                                          project.desc) && (
                                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2 flex-1">
                                            {project.description ||
                                              project.desc}
                                          </p>
                                        )}
                                        <div className="flex justify-between items-center mt-auto pt-1">
                                          <div className="flex gap-1.5">
                                            {project.techStack && (
                                              <Badge
                                                variant="secondary"
                                                className="text-[10px] h-4 px-1.5"
                                              >
                                                {project.techStack}
                                              </Badge>
                                            )}
                                          </div>
                                          {(project.link || project.url) && (
                                            <a
                                              href={project.link || project.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-[10px] text-primary flex items-center hover:underline font-medium"
                                            >
                                              View{" "}
                                              <ExternalLink className="w-2.5 h-2.5 ml-1" />
                                            </a>
                                          )}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setShowFreelancerProfile(false)}
                        >
                          Close
                        </Button>
                      </DialogFooter>
                    </>
                  )}
                </DialogContent>
              </Dialog>

              {/* View Proposal Dialog */}
              <Dialog
                open={showViewProposal}
                onOpenChange={setShowViewProposal}
              >
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      {savedProposal?.projectTitle || "Proposal Details"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-3">
                      <Badge variant="outline">
                        Budget: {formatBudget(savedProposal?.budget)}
                      </Badge>
                      <Badge variant="outline">
                        Timeline: {savedProposal?.timeline || "Not set"}
                      </Badge>
                    </div>
                    <div className="p-4 bg-muted rounded-lg max-h-[50vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      <h4 className="font-semibold mb-2 sticky top-0 bg-muted pb-2">
                        Project Summary
                      </h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {(() => {
                          // Get the content and replace any budget mentions with the current budget
                          let content =
                            savedProposal?.summary ||
                            savedProposal?.content ||
                            "No description available";
                          const currentBudget = formatBudget(
                            savedProposal?.budget
                          );
                          // Replace various budget formats with the current formatted budget
                          content = content.replace(
                            /Budget[\s\n]*[-:]*[\s\n]*(?:INR|Rs\.?|₹)?[\s]*[\d,]+k?/gi,
                            `Budget\n- ${currentBudget}`
                          );
                          return content;
                        })()}
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowViewProposal(false)}
                    >
                      Close
                    </Button>
                    <Button
                      onClick={() => {
                        setShowViewProposal(false);
                        setEditForm({
                          title: savedProposal?.projectTitle || "",
                          summary:
                            savedProposal?.summary ||
                            savedProposal?.content ||
                            "",
                          budget: savedProposal?.budget || "",
                          timeline: savedProposal?.timeline || "",
                        });
                        setShowEditProposal(true);
                      }}
                    >
                      <Edit2 className="w-4 h-4 mr-2" /> Edit
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Edit Proposal Dialog */}
              <Dialog
                open={showEditProposal}
                onOpenChange={setShowEditProposal}
              >
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Edit2 className="w-5 h-5" />
                      Edit Proposal
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-1">
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Project Title
                      </label>
                      <Input
                        value={editForm.title}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        placeholder="Project title"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Summary / Description
                      </label>
                      <Textarea
                        value={editForm.summary}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            summary: e.target.value,
                          }))
                        }
                        placeholder="Project description"
                        rows={6}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">
                          Budget
                        </label>
                        <Input
                          value={editForm.budget}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              budget: e.target.value,
                            }))
                          }
                          placeholder="e.g. ₹30,000"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">
                          Timeline
                        </label>
                        <Input
                          value={editForm.timeline}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              timeline: e.target.value,
                            }))
                          }
                          placeholder="e.g. 2 weeks"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowEditProposal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        if (!savedProposal) return;
                        const updated = {
                          ...savedProposal,
                          projectTitle: editForm.title,
                          summary: editForm.summary,
                          content: editForm.summary,
                          budget: editForm.budget,
                          timeline: editForm.timeline,
                          updatedAt: new Date().toISOString(),
                        };
                        const nextProposals = savedProposals.map((proposal) =>
                          proposal.id === savedProposal.id
                            ? normalizeSavedProposal({
                                ...proposal,
                                ...updated,
                              })
                            : proposal
                        );
                        persistSavedProposalState(
                          nextProposals,
                          savedProposal.id
                        );
                        setShowEditProposal(false);
                        toast.success("Proposal updated!");
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> Save Changes
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Freelancer Details Dialog */}
              <Dialog
                open={showFreelancerDetails}
                onOpenChange={setShowFreelancerDetails}
              >
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <DialogHeader>
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16 border-2 border-primary/20">
                        <AvatarImage
                          src={viewFreelancer?.avatar}
                          alt={viewFreelancer?.fullName || viewFreelancer?.name}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                          {(
                            viewFreelancer?.fullName || viewFreelancer?.name
                          )?.charAt(0) || "F"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <DialogTitle className="text-2xl font-bold">
                          {viewFreelancer?.fullName || viewFreelancer?.name}
                        </DialogTitle>
                        <p className="text-muted-foreground">
                          {viewFreelancer?.headline || "Freelancer"}
                        </p>
                      </div>
                    </div>
                  </DialogHeader>

                  <div className="space-y-6 py-4">
                    {/* Location Info */}
                    {viewFreelancer?.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Flag className="w-4 h-4" /> {viewFreelancer.location}
                      </div>
                    )}

                    {/* About / Bio */}
                    {viewFreelancer?.about && (
                      <div>
                        <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                          <User className="w-4 h-4 text-primary" /> About
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {viewFreelancer.about}
                        </p>
                      </div>
                    )}

                    {/* Skills */}
                    <div>
                      <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" /> Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(viewFreelancer?.skills) &&
                        viewFreelancer.skills.length > 0 ? (
                          viewFreelancer.skills.map((skill, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="px-3 py-1"
                            >
                              {skill}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No skills listed
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Services */}
                    {Array.isArray(viewFreelancer?.services) &&
                      viewFreelancer.services.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-primary" />{" "}
                            Services
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {viewFreelancer.services.map((service, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="px-3 py-1"
                              >
                                {service}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Work Experience */}
                    {Array.isArray(viewFreelancer?.workExperience) &&
                      viewFreelancer.workExperience.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-primary" /> Work
                            Experience
                          </h4>
                          <div className="space-y-4">
                            {viewFreelancer.workExperience.map((exp, idx) => (
                              <div
                                key={idx}
                                className="border-l-2 border-primary/20 pl-4 py-1"
                              >
                                <h5 className="font-semibold">{exp.title}</h5>
                                <p className="text-xs text-muted-foreground mb-1">
                                  {exp.period}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {exp.description}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Portfolio Projects */}
                    {Array.isArray(viewFreelancer?.portfolioProjects) &&
                      viewFreelancer.portfolioProjects.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                            <ExternalLink className="w-4 h-4 text-primary" />{" "}
                            Portfolio Projects
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {viewFreelancer.portfolioProjects.map(
                              (project, idx) => (
                                <a
                                  key={idx}
                                  href={project.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group block border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-all"
                                >
                                  <div className="aspect-video bg-muted relative">
                                    {project.image ? (
                                      <img
                                        src={project.image}
                                        alt={project.title}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                                        <ExternalLink className="w-8 h-8" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="p-3">
                                    <h5 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                                      {project.title || project.link}
                                    </h5>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {project.link}
                                    </p>
                                  </div>
                                </a>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </DialogContent>
              </Dialog>

              {/* Active Projects Table - Only show when projects exist */}
              {/* Active Projects Table - IN_PROGRESS & AWAITING_PAYMENT */}
              {(() => {
                const activeProjectsList = uniqueProjects.filter(
                  (p) =>
                    p.status === "IN_PROGRESS" ||
                    (p.status === "AWAITING_PAYMENT" &&
                      (p.proposals || []).some(
                        (pr) => (pr.status || "").toUpperCase() === "ACCEPTED"
                      ))
                );

                if (activeProjectsList.length === 0) return null;

                return (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold">Active Projects</h3>
                      <Button
                        variant="link"
                        className="text-primary p-0 h-auto font-semibold"
                        onClick={() => navigate("/client/project")}
                      >
                        View All <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>

                    <Card className="overflow-hidden border-border/60">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="text-xs font-semibold uppercase tracking-wider">
                              Project Name
                            </TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider">
                              Status
                            </TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider">
                              Freelancer
                            </TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider">
                              Budget
                            </TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">
                              Action
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activeProjectsList.slice(0, 5).map((project) => {
                            const statusInfo = getStatusBadge(project.status);
                            const acceptedProposal = (
                              project.proposals || []
                            ).find(
                              (p) =>
                                (p.status || "").toUpperCase() === "ACCEPTED"
                            );
                            return (
                              <TableRow
                                key={project.id}
                                className="group hover:bg-muted/50 transition-colors"
                              >
                                <TableCell>
                                  <div className="font-bold">
                                    {project.title}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(
                                      project.createdAt
                                    ).toLocaleDateString()}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      statusInfo.variant === "success"
                                        ? "default"
                                        : "secondary"
                                    }
                                    className={
                                      statusInfo.variant === "success"
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
                                        : ""
                                    }
                                  >
                                    {statusInfo.label}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {acceptedProposal?.freelancer && (
                                    <div className="flex items-center gap-2">
                                      <Avatar className="w-6 h-6">
                                        <AvatarFallback className="text-xs">
                                          {acceptedProposal.freelancer.fullName?.charAt(
                                            0
                                          ) || "F"}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-sm">
                                        {acceptedProposal.freelancer.fullName?.split(
                                          " "
                                        )[0] || "Freelancer"}
                                      </span>
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm font-medium">
                                    ₹{(project.budget || 0).toLocaleString()}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  {project.status === "AWAITING_PAYMENT" ? (
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-white h-8 w-full sm:w-auto text-xs sm:text-sm font-medium shadow-sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePaymentClick(project);
                                      }}
                                    >
                                      {(() => {
                                        const budget =
                                          parseInt(project.budget) || 0;
                                        if (budget > 200000) return "Pay 25%";
                                        if (budget >= 50000) return "Pay 33%";
                                        return "Pay 50%";
                                      })()}
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-muted-foreground hover:text-primary"
                                      onClick={() =>
                                        navigate(
                                          `/client/project/${project.id}`
                                        )
                                      }
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </Card>
                  </div>
                );
              })()}

              {/* Active Proposals Table - OPEN projects */}
              {(() => {
                const activeProposalsList = uniqueProjects.filter((p) => {
                  if (p.status !== "OPEN") return false;
                  // Only show if there's at least one pending or accepted proposal
                  return (p.proposals || []).some(
                    (prop) =>
                      ["PENDING", "ACCEPTED"].includes(
                        (prop.status || "").toUpperCase()
                      ) && !prop.deletedAt
                  );
                });

                if (activeProposalsList.length === 0) return null;

                return (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold">Active Proposals</h3>
                      <Button
                        variant="link"
                        className="text-primary p-0 h-auto font-semibold"
                        onClick={() => navigate("/client/proposal")}
                      >
                        View All <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>

                    <Card className="overflow-hidden border-border/60">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="text-xs font-semibold uppercase tracking-wider">
                              Project Name
                            </TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider">
                              Status
                            </TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider">
                              Freelancer
                            </TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider">
                              Budget
                            </TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">
                              Action
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activeProposalsList.slice(0, 5).map((project) => {
                            const statusInfo = getStatusBadge(project.status);
                            return (
                              <TableRow
                                key={project.id}
                                className="group hover:bg-muted/50 transition-colors"
                              >
                                <TableCell>
                                  <div className="font-bold">
                                    {project.title}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(
                                      project.createdAt
                                    ).toLocaleDateString()}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="secondary"
                                    className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800"
                                  >
                                    {statusInfo.label}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {(() => {
                                    const pendingProposals = (
                                      project.proposals || []
                                    )
                                      .filter(
                                        (p) =>
                                          (p.status || "").toUpperCase() ===
                                          "PENDING"
                                      )
                                      .sort(
                                        (a, b) =>
                                          new Date(b.createdAt) -
                                          new Date(a.createdAt)
                                      );

                                    // If multiple freelancers invited, show count
                                    if (pendingProposals.length > 1) {
                                      return (
                                        <div className="flex items-center gap-2 opacity-75">
                                          <div className="flex -space-x-2">
                                            {pendingProposals
                                              .slice(0, 3)
                                              .map((p, idx) => (
                                                <Avatar
                                                  key={idx}
                                                  className="w-6 h-6 border-2 border-background"
                                                >
                                                  <AvatarFallback className="text-xs">
                                                    {p.freelancer?.fullName?.charAt(
                                                      0
                                                    ) || "F"}
                                                  </AvatarFallback>
                                                </Avatar>
                                              ))}
                                          </div>
                                          <span className="text-sm italic">
                                            {pendingProposals.length} invited
                                          </span>
                                        </div>
                                      );
                                    }

                                    const pendingProposal = pendingProposals[0];
                                    if (pendingProposal?.freelancer) {
                                      return (
                                        <div className="flex items-center gap-2 opacity-75">
                                          <Avatar className="w-6 h-6 grayscale">
                                            <AvatarFallback className="text-xs">
                                              {pendingProposal.freelancer.fullName?.charAt(
                                                0
                                              ) || "F"}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="text-sm italic">
                                            Invited:{" "}
                                            {
                                              pendingProposal.freelancer.fullName?.split(
                                                " "
                                              )[0]
                                            }
                                          </span>
                                        </div>
                                      );
                                    }
                                    return (
                                      <span className="text-sm text-muted-foreground">
                                        Not assigned
                                      </span>
                                    );
                                  })()}
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm font-medium">
                                    ₹{(project.budget || 0).toLocaleString()}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  {(() => {
                                    // Check if any pending proposal is older than 24 hours
                                    const pendingProposals = (
                                      project.proposals || []
                                    ).filter(
                                      (p) =>
                                        (p.status || "").toUpperCase() ===
                                        "PENDING"
                                    );
                                    const twentyFourHoursAgo =
                                      Date.now() - 24 * 60 * 60 * 1000;
                                    const hasOldPendingProposal =
                                      pendingProposals.some(
                                        (p) =>
                                          new Date(p.createdAt).getTime() <
                                          twentyFourHoursAgo
                                      );

                                    // Only show Budget button if proposal is pending >24hrs, otherwise show nothing
                                    if (hasOldPendingProposal) {
                                      return (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-8 text-xs border-primary text-primary hover:bg-primary/10"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleIncreaseBudgetClick(project);
                                          }}
                                        >
                                          <TrendingUp className="w-3 h-3 mr-1" />
                                          Increase Budget
                                        </Button>
                                      );
                                    }
                                    return (
                                      <span className="text-xs text-muted-foreground">
                                        Waiting...
                                      </span>
                                    );
                                  })()}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </Card>
                  </div>
                );
              })()}
            </div>

            {/* Right Sidebar */}
            <div className="lg:w-[360px] flex-shrink-0 flex flex-col gap-6">
              {/* Action Center */}
              <Card className="bg-zinc-100 dark:bg-zinc-900/50 text-foreground border-border/50 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Zap className="w-5 h-5" /> Action Center
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <Button
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                    onClick={() => navigate("/service")}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Proposal
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full bg-background hover:bg-background/80 text-foreground border-border/10 shadow-sm"
                    onClick={() => navigate("/client/proposal")}
                  >
                    View Proposal
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full bg-background hover:bg-background/80 text-foreground border-border/10 shadow-sm"
                    onClick={() => navigate("/client/project")}
                  >
                    View Projects
                  </Button>
                </CardContent>
              </Card>

              {/* Talent Snapshot */}
              <Card className="border-border/60">
                <CardHeader className="pb-2 flex-row items-center justify-between">
                  <CardTitle className="text-lg font-bold">
                    Active Chat
                  </CardTitle>
                  <Button
                    variant="link"
                    className="text-primary p-0 h-auto text-sm font-semibold"
                    onClick={() => navigate("/client/messages")}
                  >
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-col gap-4">
                    {freelancers.length > 0 ? (
                      freelancers.map((f, idx) => (
                        <TalentItem
                          key={f.id || idx}
                          name={f.fullName || f.name || "Freelancer"}
                          role={
                            f.projectTitle ||
                            (Array.isArray(f.skills) && f.skills.length > 0
                              ? f.skills[0]
                              : "Freelancer")
                          }
                          avatar={f.avatar}
                          status={
                            idx === 0
                              ? "online"
                              : idx === 1
                              ? "away"
                              : "offline"
                          }
                          onClick={() =>
                            navigate(
                              `/client/messages?projectId=${f.projectId}`
                            )
                          }
                        />
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground italic py-4 text-center">
                        No active chats yet
                      </p>
                    )}
                  </ul>
                </CardContent>
              </Card>

              {/* Activity Timeline - Only show when projects exist */}
              {projects.length > 0 && (
                <Card className="border-border/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold">
                      Activity Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative pl-4 border-l-2 border-dashed border-border space-y-6">
                      {projects
                        .filter((p) =>
                          ["IN_PROGRESS", "COMPLETED"].includes(
                            (p.status || "").toUpperCase()
                          )
                        )
                        .slice(0, 2)
                        .map((project, idx) => (
                          <div
                            key={project.id}
                            className="relative cursor-pointer hover:bg-muted/50 transition-colors rounded-lg p-2 -ml-2"
                            onClick={() =>
                              navigate(`/client/project/${project.id}`)
                            }
                          >
                            <div
                              className={`absolute -left-[15px] top-3 h-3.5 w-3.5 rounded-full border-2 border-background ${
                                idx === 0
                                  ? "bg-primary"
                                  : "bg-muted-foreground/50"
                              }`}
                            />
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 ml-2">
                              <span className="text-xs font-bold text-muted-foreground w-16 flex-shrink-0">
                                {new Date(
                                  project.updatedAt || project.createdAt
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <p className="text-sm">
                                Project{" "}
                                <span className="text-primary font-medium hover:underline">
                                  {project.title}
                                </span>{" "}
                                SOP was updated.
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Suspension Alert */}
      <SuspensionAlert
        open={showSuspensionAlert}
        onOpenChange={setShowSuspensionAlert}
        suspendedAt={sessionUser?.suspendedAt}
      />
    </div>
  );
};

// ==================== Wrapper with Sidebar ====================
const ClientDashboard = () => {
  return (
    <RoleAwareSidebar>
      <ClientDashboardContent />
    </RoleAwareSidebar>
  );
};

export default ClientDashboard;
