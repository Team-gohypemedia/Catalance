"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Bell from "lucide-react/dist/esm/icons/bell";
import Clock3 from "lucide-react/dist/esm/icons/clock-3";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Layers3 from "lucide-react/dist/esm/icons/layers-3";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Send from "lucide-react/dist/esm/icons/send";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import UserRound from "lucide-react/dist/esm/icons/user-round";
import { useNavigate, useSearchParams } from "react-router-dom";
import ClientDashboardFooter from "@/components/features/client/ClientDashboardFooter";
import ClientWorkspaceHeader from "@/components/features/client/ClientWorkspaceHeader";
import FreelancerProfileDialog from "@/components/features/client/dashboard/FreelancerProfileDialog";
import FreelancerSelectionDialog from "@/components/features/client/dashboard/FreelancerSelectionDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/shared/context/AuthContext";
import { useNotifications } from "@/shared/context/NotificationContext";
import {
  getProposalSignature,
  getProposalStorageKeys,
  loadSavedProposalsFromStorage,
  persistSavedProposalsToStorage,
  resolveActiveProposalId,
} from "@/shared/lib/client-proposal-storage";
import { isFreelancerOpenToWork } from "@/shared/lib/freelancer-availability";
import { rankFreelancersForProposal } from "@/shared/lib/freelancer-matching";
import { listFreelancers } from "@/shared/lib/api-client";
import { openRazorpayCheckout } from "@/shared/lib/razorpay-checkout";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";

const MIN_FREELANCER_MATCH_SCORE = 50;
const PROPOSAL_BLOCKED_STATUSES = new Set(["pending", "accepted", "sent"]);
const CLOSED_PROJECT_STATUSES = new Set(["completed", "paused"]);
const DRAFT_PROJECT_STATUSES = new Set(["draft", "local_draft"]);

const statusColors = {
  draft: "border-sky-400/30 bg-sky-500/10 text-sky-200",
  accepted: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  sent: "border-blue-400/30 bg-blue-500/10 text-blue-200",
  pending: "border-amber-400/30 bg-amber-500/10 text-amber-200",
  rejected: "border-rose-400/30 bg-rose-500/10 text-rose-200",
};

const statusLabels = {
  draft: "Draft",
  accepted: "Accepted",
  sent: "Sent",
  pending: "Pending",
  rejected: "Rejected",
};

const proposalPanelClassName =
  "rounded-[24px] border border-[#1e293b] bg-[#303030]/40 backdrop-blur-[6px]";

const proposalCardStatusClasses = {
  draft: "border-white/10 bg-[#2f3135] text-[#d4d7dd]",
  accepted: "border-[#856715] bg-[#241c0b] text-[#f4c128]",
  sent: "border-[#856715] bg-[#241c0b] text-[#f4c128]",
  pending: "border-[#856715] bg-[#241c0b] text-[#f4c128]",
  rejected: "border-[#5b2a2a] bg-[#261617] text-[#f49e9e]",
};

const PROPOSAL_STACK_KEYS = [
  "projectStack",
  "project_stack",
  "projectTechStack",
  "project_tech_stack",
  "requiredTechStack",
  "required_tech_stack",
  "techStack",
  "tech_stack",
  "frontendFramework",
  "frontend_framework",
  "backendTechnology",
  "backend_technology",
  "database",
];

const PROPOSAL_STACK_TEXT_KEYS = [
  "projectTitle",
  "title",
  "projectNote",
  "project_note",
  "projectNotes",
  "project_notes",
  "projectRequirement",
  "project_requirement",
  "projectRequirements",
  "project_requirements",
  "requirements",
  "description",
  "summary",
  "content",
];

const STACK_DETECTION_PATTERNS = [
  { label: "Technical SEO", pattern: /\btechnical seo\b/i },
  { label: "Content SEO", pattern: /\bcontent seo\b/i },
  { label: "On-Page SEO", pattern: /\bon[\s-]?page seo\b/i },
  { label: "Off-Page SEO", pattern: /\boff[\s-]?page seo\b/i },
  { label: "Local SEO", pattern: /\blocal seo\b/i },
  { label: "Keyword Research", pattern: /\bkeyword research\b/i },
  { label: "Link Building", pattern: /\blink building\b/i },
  { label: "Google Search Console", pattern: /\bgoogle search console\b|\bgsc\b/i },
  { label: "Ahrefs", pattern: /\bahrefs\b/i },
  { label: "React.js", pattern: /\breact(?:\.js)?\b/i },
  { label: "Next.js", pattern: /\bnext(?:\.js)?\b/i },
  { label: "Node.js", pattern: /\bnode(?:\.js)?\b/i },
  { label: "TypeScript", pattern: /\btypescript\b|\bts\b/i },
  { label: "JavaScript", pattern: /\bjavascript\b|\bjs\b/i },
  { label: "PostgreSQL", pattern: /\bpostgres(?:ql)?\b/i },
  { label: "MySQL", pattern: /\bmysql\b/i },
  { label: "MongoDB", pattern: /\bmongo(?:db)?\b/i },
  { label: "Express.js", pattern: /\bexpress(?:\.js)?\b/i },
  { label: "Tailwind CSS", pattern: /\btailwind\b/i },
  { label: "Flutter", pattern: /\bflutter\b/i },
  { label: "React Native", pattern: /\breact native\b/i },
  { label: "Python", pattern: /\bpython\b|\bdjango\b|\bflask\b|\bfastapi\b/i },
  { label: "PHP", pattern: /\bphp\b|\blaravel\b/i },
  { label: "WordPress", pattern: /\bwordpress\b/i },
  { label: "Shopify", pattern: /\bshopify\b/i },
  { label: "Firebase", pattern: /\bfirebase\b/i },
  { label: "Supabase", pattern: /\bsupabase\b/i },
  { label: "AWS", pattern: /\baws\b|amazon web services/i },
  { label: "Vercel", pattern: /\bvercel\b/i },
  { label: "SEO", pattern: /\bseo\b|search engine optimization/i },
  { label: "Content Marketing", pattern: /\bcontent marketing\b|\bcontent strategy\b/i },
  { label: "Social Media", pattern: /\bsocial media\b|\bsmm\b/i },
  { label: "Google Ads", pattern: /\bgoogle ads\b|\bppc\b/i },
  { label: "Meta Ads", pattern: /\bmeta ads\b|\bfacebook ads\b|\binstagram ads\b/i },
  { label: "Branding", pattern: /\bbranding\b|brand identity/i },
];

const formatBudget = (value) => {
  if (!value) return "Not set";
  const numeric = Number.parseInt(String(value).replace(/[^0-9]/g, ""), 10);
  if (!Number.isFinite(numeric) || numeric <= 0) return String(value);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(numeric);
};

const parseProposalBudgetValue = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return 0;
  const numeric = Number.parseInt(raw.replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(numeric) ? numeric : 0;
};

const formatProposalDate = (value) => {
  if (!value) return "No date";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "No date";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getDisplayName = (user) =>
  user?.fullName || user?.name || user?.email?.split("@")[0] || "Client";

const getInitials = (value = "") => {
  const parts = String(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "C";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const normalizeSkillToken = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9#+.]/g, "");

const collectStringValues = (value) => {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value.flatMap((entry) => collectStringValues(entry));
  if (typeof value === "object") {
    return Object.values(value).flatMap((entry) => collectStringValues(entry));
  }
  if (typeof value === "string" || typeof value === "number") return [String(value)];
  return [];
};

const splitSkillValues = (value = "") =>
  String(value || "")
    .split(/,|\/|\||\+|;|&|\band\b/gi)
    .map((entry) => entry.trim())
    .filter(Boolean);

const collectFreelancerSkillTokens = (freelancer = {}) => {
  const tokenSet = new Set();
  const candidates = collectStringValues([
    freelancer?.matchedTechnologies,
    freelancer?.matchHighlights,
    freelancer?.skills,
    freelancer?.services,
    freelancer?.profileDetails?.services,
    freelancer?.profileDetails?.serviceDetails,
    freelancer?.freelancerProjects,
  ]);

  candidates.forEach((entry) => {
    splitSkillValues(entry).forEach((part) => {
      const normalized = normalizeSkillToken(part);
      if (normalized) tokenSet.add(normalized);
    });
  });

  return tokenSet;
};

const freelancerMatchesRequiredSkill = (requiredSkill, freelancerSkillTokens) => {
  const required = normalizeSkillToken(requiredSkill);
  if (!required) return false;
  if (freelancerSkillTokens.has(required)) return true;

  for (const token of freelancerSkillTokens) {
    if (!token || token.length < 3 || required.length < 3) continue;
    if (token.includes(required) || required.includes(token)) return true;
  }

  return false;
};

const extractProjectRequiredSkills = (proposal = {}) => {
  const skills = [];
  const seen = new Set();

  const pushSkill = (rawValue) => {
    const value = String(rawValue || "").trim();
    if (!value || value.length < 2) return;
    const key = normalizeSkillToken(value);
    if (!key || seen.has(key)) return;
    seen.add(key);
    skills.push(value);
  };

  PROPOSAL_STACK_KEYS.forEach((key) => {
    collectStringValues(proposal?.[key]).forEach((entry) => {
      splitSkillValues(entry).forEach(pushSkill);
    });
  });

  if (skills.length > 0) return skills.slice(0, 8);

  const searchText = PROPOSAL_STACK_TEXT_KEYS.map((key) => proposal?.[key])
    .filter(Boolean)
    .join(" ");

  STACK_DETECTION_PATTERNS.forEach(({ label, pattern }) => {
    if (pattern.test(searchText)) pushSkill(label);
  });

  return skills.slice(0, 8);
};

const hasFreelancerRole = (user = {}) => {
  const primaryRole = String(user?.role || "").toUpperCase();
  const roles = Array.isArray(user?.roles)
    ? user.roles.map((entry) => String(entry || "").toUpperCase())
    : [];
  return primaryRole === "FREELANCER" || roles.includes("FREELANCER");
};

const normalizeFreelancerCardData = (candidate = {}) => {
  const freelancer = { ...candidate };
  const rawBio = freelancer.bio || freelancer.about;

  if (typeof rawBio === "string" && rawBio.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(rawBio);
      if (!freelancer.location && parsed.location) freelancer.location = parsed.location;
      if (!freelancer.role && parsed.role) freelancer.role = parsed.role;
      if (!freelancer.title && parsed.title) freelancer.title = parsed.title;
      if (!freelancer.rating && parsed.rating) freelancer.rating = parsed.rating;
      if ((!freelancer.skills || freelancer.skills.length === 0) && parsed.skills) {
        freelancer.skills = parsed.skills;
      }
      if (!freelancer.hourlyRate && parsed.hourlyRate) {
        freelancer.hourlyRate = parsed.hourlyRate;
      }

      freelancer.cleanBio =
        parsed.bio ||
        parsed.about ||
        parsed.description ||
        parsed.summary ||
        parsed.overview ||
        parsed.introduction ||
        parsed.profileSummary ||
        parsed.shortDescription ||
        (Array.isArray(parsed.services) && parsed.services.length > 0
          ? `Experienced in ${parsed.services.join(", ")}`
          : null) ||
        "No bio available.";
    } catch {
      freelancer.cleanBio = "Overview available in profile.";
    }
  } else {
    freelancer.cleanBio = rawBio || "No bio available for this freelancer.";
  }

  return freelancer;
};

const formatRating = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "N/A";
  return numeric.toFixed(1);
};

const normalizeProposalRecord = (proposal) => proposal ?? {};

const isAssignedFreelancerName = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase();
  return Boolean(normalized) && normalized !== "not assigned";
};

const getProposalDraftGroupKey = (proposal = {}) => {
  const normalizedProposal = normalizeProposalRecord(proposal);

  if (normalizedProposal.projectId) {
    return `draft-project:${normalizedProposal.projectId}`;
  }

  if (normalizedProposal.draftSignature) {
    return `draft-signature:${normalizedProposal.draftSignature}`;
  }

  return `draft:${
    normalizedProposal.id ||
    normalizedProposal.title ||
    normalizedProposal.submittedDate ||
    "proposal"
  }`;
};

const getProposalInvitee = (proposal = {}) => {
  const normalizedProposal = normalizeProposalRecord(proposal);
  const name =
    normalizedProposal.recipientName ||
    normalizedProposal.freelancerName ||
    normalizedProposal.freelancer?.fullName ||
    normalizedProposal.freelancer?.name ||
    "";

  if (!isAssignedFreelancerName(name)) return null;

  const inviteeId =
    normalizedProposal.freelancerId ||
    normalizedProposal.recipientId ||
    normalizedProposal.freelancer?.id ||
    name.toLowerCase();

  return {
    id: String(inviteeId),
    name: String(name).trim(),
    avatar:
      normalizedProposal.avatar ||
      normalizedProposal.freelancer?.avatar ||
      "",
  };
};

const resolveProposalTitle = (proposal) => {
  const normalizedProposal = normalizeProposalRecord(proposal);

  return (
    normalizedProposal.projectTitle ||
    normalizedProposal.title ||
    normalizedProposal.service ||
    normalizedProposal.serviceKey ||
    "Proposal"
  );
};

const resolveProposalServiceLabel = (proposal) => {
  const normalizedProposal = normalizeProposalRecord(proposal);

  return (
    normalizedProposal.service ||
    normalizedProposal.serviceName ||
    normalizedProposal.serviceKey ||
    normalizedProposal.category ||
    "General"
  );
};

const ProposalContentRenderer = ({ content }) => {
  if (!content) {
    return <p className="text-sm text-muted-foreground">No content available.</p>;
  }

  return (
    <div className="space-y-2 text-sm leading-6 text-foreground">
      {content.split("\n").map((line, index) => {
        const trimmed = line.trim();

        if (trimmed.startsWith("##")) {
          return (
            <h3
              key={`heading-${index}`}
              className="pt-3 text-base font-semibold tracking-tight text-foreground"
            >
              {trimmed.replace(/^#+\s*/, "")}
            </h3>
          );
        }

        if (trimmed.startsWith("-")) {
          return (
            <div key={`bullet-${index}`} className="flex items-start gap-2">
              <span className="mt-1 text-primary">&bull;</span>
              <span>{trimmed.replace(/^-\s*/, "")}</span>
            </div>
          );
        }

        if (!trimmed) return <div key={`spacer-${index}`} className="h-2" />;
        return <p key={`copy-${index}`}>{trimmed}</p>;
      })}
    </div>
  );
};

const extractProposalDetails = (proposal) => {
  const normalizedProposal = normalizeProposalRecord(proposal);
  let budget =
    normalizedProposal.budget || normalizedProposal.project?.budget || "Not set";
  let delivery =
    normalizedProposal.timeline ||
    normalizedProposal.project?.timeline ||
    "Not set";

  if (delivery === "Not set" && normalizedProposal.content) {
    const timelineMatch = normalizedProposal.content.match(
      /Timeline[:\s-]*(.+?)(?:\n|$)/i,
    );
    if (timelineMatch) delivery = timelineMatch[1].trim();
  }

  return {
    budget: formatBudget(budget),
    delivery,
    requiresPayment: Boolean(normalizedProposal.requiresPayment),
    statusDisplay:
      normalizedProposal.requiresPayment
        ? "Awaiting Payment"
        : normalizedProposal.status === "draft"
          ? "Draft"
          : normalizedProposal.status === "rejected"
            ? "Rejected"
            : "Pending Review",
  };
};

const ProposalMetric = ({ icon: Icon, label, value, valueClassName }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      <Icon className="h-3.5 w-3.5 text-primary" />
      <span>{label}</span>
    </div>
    <div className={cn("mt-3 text-base font-semibold text-foreground", valueClassName)}>
      {value}
    </div>
  </div>
);

const ProposalSummaryItem = ({ label, value, valueClassName }) => (
  <div className="space-y-2">
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">
      {label}
    </p>
    <div className={cn("text-sm font-medium leading-6 text-white", valueClassName)}>
      {value}
    </div>
  </div>
);

const ProposalFreelancerAvatars = ({
  proposal,
  avatarClassName = "h-10 w-10",
  stackClassName,
  maxVisible = 4,
}) => {
  const sentFreelancers = Array.isArray(proposal?.sentFreelancers)
    ? proposal.sentFreelancers.filter(Boolean)
    : [];
  const fallbackAvatarName = isAssignedFreelancerName(proposal?.recipientName)
    ? proposal.recipientName
    : "Not assigned";
  const initials = getInitials(fallbackAvatarName);

  if (sentFreelancers.length > 0) {
    return (
      <div className={cn("flex items-center -space-x-3", stackClassName)}>
        {sentFreelancers.slice(0, maxVisible).map((freelancer) => (
          <Avatar
            key={freelancer.id}
            className={cn(
              avatarClassName,
              "border-2 border-[#2b2b2d]",
            )}
          >
            <AvatarImage src={freelancer.avatar} alt={freelancer.name} />
            <AvatarFallback className="bg-[#111214] text-xs font-bold text-primary">
              {getInitials(freelancer.name)}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
    );
  }

  return (
    <Avatar className={cn(avatarClassName, "border border-white/10")}>
      <AvatarImage src={proposal?.avatar} alt={fallbackAvatarName} />
      <AvatarFallback className="bg-[#111214] text-xs font-bold text-primary">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

const NotificationPopoverButton = ({
  notifications,
  unreadCount,
  onMarkAllAsRead,
  onNotificationClick,
}) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className="relative flex size-9 items-center justify-center rounded-full p-0 text-[#94a3b8] transition-colors hover:bg-transparent hover:text-white"
      >
        <Bell className="size-4.5" />
        {unreadCount > 0 ? (
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#ffc107]" />
        ) : null}
      </Button>
    </PopoverTrigger>
    <PopoverContent
      align="end"
      className="w-[22rem] border border-white/10 bg-[#171718] p-0 text-white shadow-[0_24px_70px_-36px_rgba(0,0,0,0.95)]"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h4 className="text-sm font-semibold">Notifications</h4>
        {unreadCount > 0 ? (
          <button
            type="button"
            className="text-xs font-medium text-primary transition hover:text-primary/80"
            onClick={onMarkAllAsRead}
          >
            Mark all as read
          </button>
        ) : null}
      </div>
      <ScrollArea className="h-72">
        {notifications.length === 0 ? (
          <div className="flex h-full min-h-52 flex-col items-center justify-center gap-2 px-6 text-center text-[#7e8392]">
            <Bell className="h-8 w-8 opacity-40" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-white/6">
            {notifications.slice(0, 20).map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => onNotificationClick(notification)}
                className={cn(
                  "flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-white/5",
                  !notification.read && "bg-primary/5",
                )}
              >
                <div
                  className={cn(
                    "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                    !notification.read ? "bg-primary" : "bg-white/15",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {notification.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#8f96a3]">
                    {notification.message}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </PopoverContent>
  </Popover>
);

const EmptyStateCard = ({ title, description }) => (
  <Card className={cn("shadow-none", proposalPanelClassName)}>
    <CardContent className="flex min-h-[260px] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div className="rounded-xl bg-[#ffc107]/10 p-3 text-[#ffc107]">
        <FileText className="h-6 w-6" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold tracking-tight text-[#f1f5f9]">{title}</h3>
        <p className="max-w-md text-sm leading-6 text-[#94a3b8]">{description}</p>
      </div>
    </CardContent>
  </Card>
);

const ProposalLoadingState = () => (
  <Card className={cn("shadow-none", proposalPanelClassName)}>
    <CardContent className="flex min-h-[260px] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <Skeleton className="h-12 w-12 rounded-xl bg-white/[0.08]" />
      <div className="space-y-3">
        <Skeleton className="mx-auto h-8 w-56 rounded-full bg-white/[0.08]" />
        <Skeleton className="mx-auto h-4 w-80 max-w-full rounded-full bg-white/[0.06]" />
        <Skeleton className="mx-auto h-4 w-64 max-w-full rounded-full bg-white/[0.06]" />
      </div>
    </CardContent>
  </Card>
);

const ProposalWorkspaceHintCard = ({ activeTab, hasProjectFilter }) => {
  const title =
    activeTab === "rejected" ? "Need a replacement proposal?" : "Submit a new proposal";
  const description = hasProjectFilter
    ? "This workspace is currently scoped to one project, so all related proposal movement will stay grouped here."
    : activeTab === "draft"
      ? "Accept a newly generated draft or build out a project brief to keep your proposal pipeline moving."
      : activeTab === "pending"
        ? "Open any proposal above to review scope details, continue the conversation, or complete payment approval."
        : "Use a rejected scope as a starting point, revise the brief, and send a stronger version back out.";

  return (
    <Card className={cn("shadow-none", proposalPanelClassName)}>
      <CardContent className="flex min-h-[220px] flex-col items-center justify-center gap-4 px-6 py-14 text-center">
        <div className="rounded-xl bg-[#ffc107]/10 p-3 text-[#ffc107]">
          <FileText className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h3 className="text-[1.85rem] font-semibold tracking-[-0.03em] text-[#f1f5f9]">
            {title}
          </h3>
          <p className="max-w-lg text-sm leading-6 text-[#94a3b8]">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
};

const ProposalRowCard = ({
  proposal,
  onDelete,
  onOpen,
  onPay,
  onSend,
  isPaying,
  isSending,
}) => {
  const details = extractProposalDetails(proposal);
  const isDraft = proposal.status === "draft";
  const canSendToFreelancers = isDraft && !proposal.requiresPayment && onSend;
  const showSecondaryAction = canSendToFreelancers || Boolean(proposal.requiresPayment && onPay);

  return (
    <Card className="overflow-hidden rounded-[2.9rem] border border-white/6 bg-[#2b2b2d] shadow-none transition duration-200 hover:border-white/10">
      <CardContent className="p-7 sm:p-8 lg:p-9">
        <div className="space-y-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-4">
              <div className="flex flex-wrap items-center gap-4 text-sm text-[#9a9ea8]">
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.24em]",
                    proposalCardStatusClasses[proposal.status] ||
                      proposalCardStatusClasses.pending,
                  )}
                >
                  {statusLabels[proposal.status] || "Pending"}
                </Badge>
                <span>{proposal.submittedDate}</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-[2rem] font-semibold tracking-[-0.04em] text-white sm:text-[2.2rem]">
                  {resolveProposalTitle(proposal)}
                </h3>
              </div>
            </div>

            {onDelete && !proposal.requiresPayment ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-full text-[#8d96a7] hover:bg-white/5 hover:text-white"
                onClick={() => onDelete(proposal)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>

          <div className="grid gap-6 border-t border-white/6 pt-7 lg:grid-cols-[1.25fr_1fr_1fr_auto] lg:items-center">
            <ProposalSummaryItem
              label="Freelancer"
              value={
                <ProposalFreelancerAvatars proposal={proposal} />
              }
            />
            <ProposalSummaryItem
              label="Agreed Amount"
              value={details.budget}
              valueClassName="text-[1.9rem] font-semibold tracking-[-0.03em] text-primary"
            />
            <ProposalSummaryItem
              label="Delivery"
              value={
                <span className="inline-flex items-center gap-2 text-lg font-semibold text-[#d8dbe2]">
                  <Clock3 className="h-4 w-4 text-[#97a1b2]" />
                  {details.delivery}
                </span>
              }
            />
            <div className="flex w-full flex-col gap-3 lg:w-[10.5rem] lg:items-end">
              <Button
                className="h-11 rounded-full bg-primary px-6 font-semibold text-[#141414] hover:bg-primary/90 lg:w-full"
                onClick={() => onOpen?.(proposal)}
              >
                View Details
              </Button>

              {showSecondaryAction ? (
                <div className="flex w-full flex-wrap gap-2 lg:justify-end">
                  {canSendToFreelancers ? (
                    <Button
                      className="h-11 rounded-full border border-white/10 bg-white/[0.03] px-6 font-semibold text-white hover:bg-white/[0.06] lg:w-full"
                      onClick={() => onSend?.(proposal)}
                      disabled={isSending}
                    >
                      {isSending ? (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-3.5 w-3.5" />
                      )}
                      {isSending ? "Sending..." : "Send"}
                    </Button>
                  ) : null}

                  {proposal.requiresPayment && onPay ? (
                    <Button
                      className="h-9 rounded-full bg-emerald-500 px-4 text-xs font-semibold text-black hover:bg-emerald-400"
                      onClick={() => onPay(proposal)}
                      disabled={isPaying}
                    >
                      {isPaying ? (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CreditCard className="mr-2 h-3.5 w-3.5" />
                      )}
                      {isPaying ? "Processing..." : "Approve & Pay"}
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const normalizeProposalStatus = (status = "") => {
  switch (String(status).toUpperCase()) {
    case "DRAFT":
      return "draft";
    case "ACCEPTED":
      return "accepted";
    case "REJECTED":
    case "DECLINED":
      return "rejected";
    case "PENDING":
      return "pending";
    default:
      return "sent";
  }
};

const mapApiProposal = (proposal) => {
  const normalizedProposal = normalizeProposalRecord(proposal);
  const freelancerName =
    normalizedProposal.freelancer?.fullName ||
    normalizedProposal.freelancer?.name ||
    normalizedProposal.freelancer?.email ||
    normalizedProposal.freelancerName ||
    "Freelancer";
  const freelancerAvatar =
    normalizedProposal.freelancer?.avatar || normalizedProposal.avatar || "";
  const projectStatus = String(normalizedProposal.project?.status || "").toUpperCase();
  const spentAmount = Number(normalizedProposal.project?.spent || 0);
  const requiresPayment =
    projectStatus === "AWAITING_PAYMENT" &&
    String(normalizedProposal.status || "").toUpperCase() === "ACCEPTED" &&
    spentAmount <= 0;

  return {
    id: normalizedProposal.id,
    title:
      normalizedProposal.project?.title || normalizedProposal.title || "Proposal",
    category:
      normalizedProposal.service ||
      normalizedProposal.project?.service ||
      normalizedProposal.project?.category ||
      normalizedProposal.category ||
      "General",
    service:
      normalizedProposal.service ||
      normalizedProposal.project?.service ||
      normalizedProposal.project?.category ||
      normalizedProposal.category ||
      "General",
    serviceKey:
      normalizedProposal.serviceKey ||
      normalizedProposal.project?.serviceKey ||
      normalizedProposal.project?.category ||
      normalizedProposal.category ||
      "",
    status: normalizeProposalStatus(normalizedProposal.status || "PENDING"),
    recipientName: freelancerName,
    recipientId: normalizedProposal.freelancer?.id || "FREELANCER",
    projectId: normalizedProposal.projectId || normalizedProposal.project?.id || null,
    freelancerId:
      normalizedProposal.freelancer?.id || normalizedProposal.freelancerId || null,
    submittedDate: formatProposalDate(
      normalizedProposal.updatedAt || normalizedProposal.createdAt,
    ),
    avatar: freelancerAvatar,
    summary:
      normalizedProposal.summary ||
      normalizedProposal.content ||
      normalizedProposal.description ||
      normalizedProposal.project?.description ||
      "",
    content:
      normalizedProposal.content ||
      normalizedProposal.description ||
      normalizedProposal.summary ||
      normalizedProposal.project?.description ||
      "",
    budget:
      normalizedProposal.budget ||
      normalizedProposal.amount ||
      normalizedProposal.project?.budget,
    timeline:
      normalizedProposal.timeline || normalizedProposal.project?.timeline,
    projectStatus,
    requiresPayment,
    createdAt: normalizedProposal.createdAt || null,
    updatedAt: normalizedProposal.updatedAt || normalizedProposal.createdAt || null,
    syncedProjectId:
      normalizedProposal.projectId || normalizedProposal.project?.id || null,
    proposalContext: normalizedProposal.proposalContext || null,
  };
};

const mapLocalDraftProposal = (proposal) => {
  const normalizedProposal = normalizeProposalRecord(proposal);

  return {
    id: normalizedProposal.id,
    title:
      normalizedProposal.projectTitle ||
      normalizedProposal.title ||
      normalizedProposal.service ||
      normalizedProposal.serviceKey ||
      "Proposal Draft",
    category:
      normalizedProposal.service || normalizedProposal.serviceKey || "General",
    service:
      normalizedProposal.service || normalizedProposal.serviceKey || "General",
    serviceKey:
      normalizedProposal.serviceKey || normalizedProposal.service || "",
    status: "draft",
    recipientName:
      normalizedProposal.recipientName ||
      normalizedProposal.preparedFor ||
      "Not assigned",
    recipientId: normalizedProposal.recipientId || "LOCAL_DRAFT",
    projectId:
      normalizedProposal.syncedProjectId || normalizedProposal.projectId || null,
    syncedProjectId:
      normalizedProposal.syncedProjectId || normalizedProposal.projectId || null,
    freelancerId: normalizedProposal.freelancerId || null,
    submittedDate: formatProposalDate(
      normalizedProposal.updatedAt ||
        normalizedProposal.createdAt ||
        new Date().toISOString(),
    ),
    avatar: normalizedProposal.avatar || "",
    summary: normalizedProposal.summary || normalizedProposal.content || "",
    content: normalizedProposal.summary || normalizedProposal.content || "",
    budget: normalizedProposal.budget || "",
    timeline: normalizedProposal.timeline || "",
    projectStatus: normalizedProposal.syncedProjectId ? "DRAFT" : "LOCAL_DRAFT",
    requiresPayment: false,
    isLocalDraft: true,
    draftSignature: getProposalSignature(normalizedProposal),
    createdAt: normalizedProposal.createdAt || null,
    updatedAt: normalizedProposal.updatedAt || normalizedProposal.createdAt || null,
    proposalContext: normalizedProposal.proposalContext || null,
    projectStack:
      normalizedProposal.projectStack ||
      normalizedProposal.project_stack ||
      normalizedProposal.requiredTechStack ||
      normalizedProposal.required_tech_stack ||
      null,
    techStack:
      normalizedProposal.techStack || normalizedProposal.tech_stack || null,
    requirements: normalizedProposal.requirements || null,
  };
};

const buildEditableProposalDraft = (proposal) => {
  const details = extractProposalDetails(proposal);

  return {
    title: resolveProposalTitle(proposal),
    service: resolveProposalServiceLabel(proposal),
    budget:
      proposal?.budget !== undefined && proposal?.budget !== null
        ? String(proposal.budget)
        : details.budget === "Not set"
          ? ""
          : String(details.budget),
    timeline:
      proposal?.timeline ||
      (details.delivery === "Not set" ? "" : details.delivery),
    content: proposal?.content || "",
  };
};

const getProposalMergeKey = (proposal) => {
  const normalizedProposal = normalizeProposalRecord(proposal);

  if (normalizedProposal.isLocalDraft) {
    if (normalizedProposal.projectId) {
      return `draft-project:${normalizedProposal.projectId}`;
    }
    return `draft:${normalizedProposal.draftSignature || normalizedProposal.id}`;
  }

  if (
    normalizedProposal.status === "draft" &&
    normalizedProposal.projectId &&
    !normalizedProposal.freelancerId
  ) {
    return `draft-project:${normalizedProposal.projectId}`;
  }

  if (normalizedProposal.id) return `proposal:${normalizedProposal.id}`;
  if (normalizedProposal.projectId && normalizedProposal.freelancerId) {
    return `proposal:${normalizedProposal.projectId}:${normalizedProposal.freelancerId}`;
  }

  return `proposal:${
    normalizedProposal.projectId ||
    normalizedProposal.title ||
    normalizedProposal.submittedDate
  }`;
};

const mergeProposalCollections = (remote = [], localDrafts = []) => {
  const merged = [];
  const seen = new Set();

  const pushUnique = (proposal) => {
    const key = getProposalMergeKey(proposal);
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(proposal);
  };

  remote.forEach(pushUnique);
  localDrafts.forEach(pushUnique);

  return merged;
};

const deleteLocalDraftProposal = (proposalId, userId) => {
  const storageKeys = getProposalStorageKeys(userId);
  const { proposals, activeId } = loadSavedProposalsFromStorage(userId);
  const remaining = proposals.filter((proposal) => proposal.id !== proposalId);
  const preferredActiveId = activeId === proposalId ? null : activeId;
  const nextActiveId = resolveActiveProposalId(remaining, preferredActiveId, null);

  persistSavedProposalsToStorage(remaining, nextActiveId, storageKeys);
};

const ClientProposalContent = () => {
  const { isAuthenticated, authFetch, user } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const [proposals, setProposals] = useState([]);
  const [activeProposal, setActiveProposal] = useState(null);
  const [isViewing, setIsViewing] = useState(false);
  const [isLoadingProposal, setIsLoadingProposal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("draft");
  const [isEditingProposal, setIsEditingProposal] = useState(false);
  const [editableProposalDraft, setEditableProposalDraft] = useState(() =>
    buildEditableProposalDraft(null),
  );
  const [processingPaymentProposalId, setProcessingPaymentProposalId] =
    useState(null);
  const [sendingProposalId, setSendingProposalId] = useState(null);
  const [hasHandledDeepLink, setHasHandledDeepLink] = useState(false);
  const [showFreelancerSelect, setShowFreelancerSelect] = useState(false);
  const [showFreelancerProfile, setShowFreelancerProfile] = useState(false);
  const [viewingFreelancer, setViewingFreelancer] = useState(null);
  const [freelancerSearch, setFreelancerSearch] = useState("");
  const [suggestedFreelancers, setSuggestedFreelancers] = useState([]);
  const [isFreelancersLoading, setIsFreelancersLoading] = useState(false);
  const [selectedProposalForSend, setSelectedProposalForSend] = useState(null);
  const freelancerPoolCacheRef = useRef({
    userId: null,
    loaded: false,
    data: [],
  });
  const freelancerPoolPromiseRef = useRef(null);

  const deepLinkProjectId = searchParams.get("projectId");
  const deepLinkTab = (searchParams.get("tab") || "").toLowerCase();
  const deepLinkAction = (searchParams.get("action") || "").toLowerCase();

  const handleNotificationClick = useCallback(
    (notification) => {
      markAsRead(notification.id);

      if (notification.type === "chat" && notification.data) {
        const service = notification.data.service || "";
        const parts = service.split(":");
        let projectId = notification.data.projectId;

        if (!projectId && parts.length >= 4 && parts[0] === "CHAT") {
          projectId = parts[1];
        }

        if (projectId) {
          navigate(`/client/messages?projectId=${projectId}`);
        } else {
          navigate("/client/messages");
        }
        return;
      }

      if (notification.type === "proposal") {
        navigate("/client/proposal");
        return;
      }

      if (
        (notification.type === "task_completed" ||
          notification.type === "task_verified" ||
          notification.type === "freelancer_change_resolved") &&
        notification.data?.projectId
      ) {
        navigate(`/client/project/${notification.data.projectId}`);
      }
    },
    [markAsRead, navigate],
  );

  const fetchProposals = useCallback(async () => {
    const { proposals: localSavedProposals } = loadSavedProposalsFromStorage(user?.id);
    const localDrafts = localSavedProposals.map(mapLocalDraftProposal);

    try {
      const response = await authFetch("/proposals?as=owner");
      const payload = await response.json().catch(() => null);
      const remote = Array.isArray(payload?.data) ? payload.data : [];
      const remoteNormalized = remote.map(mapApiProposal);

      const uniqueById = remoteNormalized.reduce(
        (acc, proposal) => {
          const key = proposal.id || `${proposal.projectId}-${proposal.freelancerId}`;
          if (!key || acc.seen.has(key)) return acc;
          acc.seen.add(key);
          acc.list.push(proposal);
          return acc;
        },
        { seen: new Set(), list: [] },
      ).list;

      setProposals(mergeProposalCollections(uniqueById, localDrafts));
    } catch (error) {
      console.error("Failed to load proposals from API:", error);
      setProposals(localDrafts);
    } finally {
      setIsLoading(false);
    }
  }, [authFetch, user?.id]);

  const fetchFreelancerPool = useCallback(async () => {
    if (!user?.id) return [];

    const currentCache = freelancerPoolCacheRef.current;
    if (currentCache.userId === user.id && currentCache.loaded) {
      return currentCache.data;
    }

    if (freelancerPoolPromiseRef.current) {
      return freelancerPoolPromiseRef.current;
    }

    freelancerPoolPromiseRef.current = (async () => {
      const [activeFreelancers, pendingFreelancers] = await Promise.all([
        listFreelancers({
          onboardingComplete: "true",
          status: "ACTIVE",
        }),
        listFreelancers({
          onboardingComplete: "true",
          status: "PENDING_APPROVAL",
        }),
      ]);

      const merged = [
        ...(Array.isArray(activeFreelancers) ? activeFreelancers : []),
        ...(Array.isArray(pendingFreelancers) ? pendingFreelancers : []),
      ];
      const uniqueById = merged.filter(
        (freelancer, index, collection) =>
          freelancer?.id &&
          collection.findIndex((item) => item?.id === freelancer.id) === index,
      );
      const normalized = uniqueById.filter(
        (freelancer) => freelancer?.id !== user.id && hasFreelancerRole(freelancer),
      );

      freelancerPoolCacheRef.current = {
        userId: user.id,
        loaded: true,
        data: normalized,
      };

      return normalized;
    })();

    try {
      return await freelancerPoolPromiseRef.current;
    } finally {
      freelancerPoolPromiseRef.current = null;
    }
  }, [user?.id]);

  const openFreelancerSelection = useCallback(
    (proposal) => {
      if (!proposal) return;
      setSelectedProposalForSend(proposal);
      const cache = freelancerPoolCacheRef.current;
      const hasCachedPool = cache.userId === user?.id && cache.loaded;
      setIsFreelancersLoading(!hasCachedPool);
      setShowFreelancerSelect(true);
    },
    [user?.id],
  );

  const updateProposalProjectReference = useCallback(
    (proposal, projectId, projectStatus = "OPEN") => {
      const now = new Date().toISOString();

      if (proposal?.isLocalDraft) {
        const storageKeys = getProposalStorageKeys(user?.id);
        const { proposals: savedProposals } = loadSavedProposalsFromStorage(user?.id);
        const updatedSavedProposals = savedProposals.map((savedProposal) =>
          savedProposal.id === proposal.id
            ? {
                ...savedProposal,
                ownerId: user?.id || savedProposal.ownerId || null,
                syncedProjectId: projectId,
                projectId,
                syncedAt: savedProposal.syncedAt || now,
              }
            : savedProposal,
        );

        persistSavedProposalsToStorage(updatedSavedProposals, proposal.id, storageKeys);
      }

      const patch = {
        projectId,
        syncedProjectId: projectId,
        projectStatus,
        updatedAt: now,
      };

      setProposals((current) =>
        current.map((entry) => (entry.id === proposal.id ? { ...entry, ...patch } : entry)),
      );
      setSelectedProposalForSend((current) =>
        current?.id === proposal.id ? { ...current, ...patch } : current,
      );
      setActiveProposal((current) =>
        current?.id === proposal.id ? { ...current, ...patch } : current,
      );
    },
    [user?.id],
  );

  useEffect(() => {
    setHasHandledDeepLink(false);
  }, [deepLinkProjectId, deepLinkTab, deepLinkAction]);

  useEffect(() => {
    setEditableProposalDraft(buildEditableProposalDraft(activeProposal));
    setIsEditingProposal(false);
  }, [activeProposal]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    const safeFetch = async () => {
      if (!isMounted) return;
      await fetchProposals();
    };

    safeFetch();
    const intervalId = window.setInterval(safeFetch, 6000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [fetchProposals, isAuthenticated]);

  useEffect(() => {
    freelancerPoolPromiseRef.current = null;

    if (!user?.id) {
      freelancerPoolCacheRef.current = {
        userId: null,
        loaded: false,
        data: [],
      };
      setSuggestedFreelancers([]);
      return;
    }

    if (freelancerPoolCacheRef.current.userId !== user.id) {
      freelancerPoolCacheRef.current = {
        userId: user.id,
        loaded: false,
        data: [],
      };
      setSuggestedFreelancers([]);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    void fetchFreelancerPool().catch((error) => {
      console.error("Failed to prefetch freelancers:", error);
    });
  }, [fetchFreelancerPool, user?.id]);

  useEffect(() => {
    if (!user?.id || !showFreelancerSelect) return;

    let isCurrentRequest = true;

    const hydrateFreelancers = async () => {
      const cache = freelancerPoolCacheRef.current;

      if (cache.userId === user.id && cache.loaded) {
        setSuggestedFreelancers(cache.data);
        setIsFreelancersLoading(false);
        return;
      }

      setIsFreelancersLoading(true);
      try {
        const pool = await fetchFreelancerPool();
        if (!isCurrentRequest) return;
        setSuggestedFreelancers(pool);
      } catch (error) {
        if (!isCurrentRequest) return;
        console.error("Failed to load suggested freelancers:", error);
        setSuggestedFreelancers([]);
      } finally {
        if (isCurrentRequest) setIsFreelancersLoading(false);
      }
    };

    void hydrateFreelancers();

    return () => {
      isCurrentRequest = false;
    };
  }, [fetchFreelancerPool, showFreelancerSelect, user?.id]);

  useEffect(() => {
    if (!showFreelancerSelect) {
      setFreelancerSearch("");
      setIsFreelancersLoading(false);
    }
  }, [showFreelancerSelect]);

  const handleDelete = useCallback(
    async (proposal) => {
      if (proposal?.isLocalDraft) {
        deleteLocalDraftProposal(proposal.id, user?.id);
        setProposals((prev) => prev.filter((item) => item.id !== proposal.id));
        setActiveProposal((current) => (current?.id === proposal.id ? null : current));
        setSelectedProposalForSend((current) =>
          current?.id === proposal.id ? null : current,
        );
        if (activeProposal?.id === proposal.id) setIsViewing(false);
        toast.success("Draft deleted.");
        return;
      }

      try {
        const response = await authFetch(`/proposals/${proposal.id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Unable to delete proposal.");
        setProposals((prev) => prev.filter((item) => item.id !== proposal.id));
        setActiveProposal((current) => (current?.id === proposal.id ? null : current));
        setSelectedProposalForSend((current) =>
          current?.id === proposal.id ? null : current,
        );
        if (activeProposal?.id === proposal.id) setIsViewing(false);
        toast.success("Proposal deleted.");
      } catch {
        toast.error("Unable to delete proposal right now.");
      }
    },
    [activeProposal?.id, authFetch, user?.id],
  );

  const handleApproveAndPay = useCallback(
    async (proposal) => {
      if (!proposal?.projectId) {
        toast.error("Project reference missing for this proposal.");
        return;
      }

      setProcessingPaymentProposalId(proposal.id);

      try {
        const orderRes = await authFetch(`/projects/${proposal.projectId}/pay-upfront/order`, {
          method: "POST",
        });
        const orderPayload = await orderRes.json().catch(() => null);

        if (!orderRes.ok) {
          if (orderRes.status === 503) {
            const fallbackRes = await authFetch(`/projects/${proposal.projectId}/pay-upfront`, {
              method: "POST",
            });
            const fallbackPayload = await fallbackRes.json().catch(() => null);
            if (!fallbackRes.ok) {
              throw new Error(fallbackPayload?.message || "Payment failed.");
            }
            toast.success(
              fallbackPayload?.data?.message ||
                "Payment completed. Project is now active.",
            );
            await fetchProposals();
            return;
          }

          throw new Error(orderPayload?.message || "Unable to start payment.");
        }

        const orderData = orderPayload?.data || {};
        const paymentProof = await openRazorpayCheckout({
          key: orderData.key,
          amountPaise: orderData.amountPaise,
          currency: orderData.currency || "INR",
          orderId: orderData.orderId,
          description: `Upfront payment for ${orderData.projectTitle || "project"}`,
          prefill: {
            email: user?.email || "",
            name: user?.fullName || "",
            contact: user?.phone || user?.phoneNumber || "",
          },
          notes: {
            projectId: orderData.projectId,
          },
        });

        const verifyRes = await authFetch(`/projects/${proposal.projectId}/pay-upfront/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paymentProof),
        });
        const verifyPayload = await verifyRes.json().catch(() => null);

        if (!verifyRes.ok) {
          throw new Error(verifyPayload?.message || "Payment verification failed.");
        }

        toast.success(
          verifyPayload?.data?.message || "Payment completed. Project is now active.",
        );
        await fetchProposals();
      } catch (error) {
        console.error("Failed to approve and pay:", error);
        toast.error(error?.message || "Payment failed. Please try again.");
      } finally {
        setProcessingPaymentProposalId(null);
      }
    },
    [authFetch, fetchProposals, user],
  );

  const handleOpenProposal = useCallback(
    async (proposal) => {
      setIsViewing(true);
      setActiveProposal(proposal);

      if (proposal?.isLocalDraft) return;
      if (proposal?.content && proposal?.budget) return;
      if (!proposal?.id) return;

      try {
        setIsLoadingProposal(true);
        const response = await authFetch(`/proposals/${proposal.id}`);
        const payload = await response.json().catch(() => null);
        const mapped = payload?.data ? mapApiProposal(payload.data) : null;
        if (mapped) {
          setActiveProposal(mapped);
          setProposals((prev) =>
            prev.map((item) => (item.id === mapped.id ? mapped : item)),
          );
        }
      } catch (error) {
        console.error("Failed to load details", error);
      } finally {
        setIsLoadingProposal(false);
      }
    },
    [authFetch],
  );

  const handleEditableProposalDraftChange = useCallback((field, value) => {
    setEditableProposalDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }, []);

  const handleSaveProposalChanges = useCallback(() => {
    if (!activeProposal) return;

    const nextTitle = String(editableProposalDraft.title || "").trim();
    const nextService = String(editableProposalDraft.service || "").trim();
    const nextBudget = String(editableProposalDraft.budget || "").trim();
    const nextTimeline = String(editableProposalDraft.timeline || "").trim();
    const nextContent = String(editableProposalDraft.content || "").trim();

    if (!nextTitle) {
      toast.error("Proposal title cannot be empty.");
      return;
    }

    if (!nextContent) {
      toast.error("Proposal content cannot be empty.");
      return;
    }

    const now = new Date().toISOString();
    const storageKeys = getProposalStorageKeys(user?.id);
    const { proposals: savedProposals, activeId } = loadSavedProposalsFromStorage(user?.id);
    const draftGroupKey = getProposalDraftGroupKey(activeProposal);

    const localDraftPayload = {
      id:
        activeProposal.isLocalDraft
          ? activeProposal.id
          : `saved-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      ownerId: user?.id || null,
      projectTitle: nextTitle,
      title: nextTitle,
      service: nextService || resolveProposalServiceLabel(activeProposal),
      serviceKey:
        nextService || activeProposal.serviceKey || resolveProposalServiceLabel(activeProposal),
      summary: nextContent,
      content: nextContent,
      budget: nextBudget,
      timeline: nextTimeline,
      recipientName: activeProposal.recipientName || "Not assigned",
      recipientId: activeProposal.recipientId || "LOCAL_DRAFT",
      freelancerId: activeProposal.freelancerId || null,
      avatar: activeProposal.avatar || "",
      projectId: activeProposal.projectId || activeProposal.syncedProjectId || null,
      syncedProjectId:
        activeProposal.syncedProjectId || activeProposal.projectId || null,
      syncedAt: activeProposal.syncedAt || null,
      proposalContext: activeProposal.proposalContext || null,
      createdAt: activeProposal.createdAt || now,
      updatedAt: now,
    };

    let nextActiveId = localDraftPayload.id;
    let hasMatchedSavedDraft = false;

    const updatedSavedProposals = savedProposals.map((savedProposal) => {
      const isSameDraft =
        savedProposal.id === activeProposal.id ||
        getProposalDraftGroupKey(savedProposal) === draftGroupKey;

      if (!isSameDraft) return savedProposal;

      hasMatchedSavedDraft = true;
      nextActiveId = savedProposal.id || localDraftPayload.id;

      return {
        ...savedProposal,
        ...localDraftPayload,
        id: savedProposal.id || localDraftPayload.id,
        createdAt: savedProposal.createdAt || localDraftPayload.createdAt,
      };
    });

    const nextSavedProposals = hasMatchedSavedDraft
      ? updatedSavedProposals
      : [...updatedSavedProposals, localDraftPayload];

    const resolvedActiveId = resolveActiveProposalId(
      nextSavedProposals,
      nextActiveId,
      activeId,
    );

    persistSavedProposalsToStorage(nextSavedProposals, resolvedActiveId, storageKeys);

    const savedDraftRecord =
      nextSavedProposals.find((proposal) => proposal.id === resolvedActiveId) ||
      nextSavedProposals.find(
        (proposal) => getProposalDraftGroupKey(proposal) === draftGroupKey,
      ) ||
      localDraftPayload;

    const mappedLocalDraft = mapLocalDraftProposal(savedDraftRecord);

    setProposals((current) => {
      let didReplaceLocalDraft = false;

      const next = current.map((entry) => {
        const isSameLocalDraft =
          entry.isLocalDraft && getProposalDraftGroupKey(entry) === draftGroupKey;

        if (!isSameLocalDraft) return entry;

        didReplaceLocalDraft = true;
        return {
          ...entry,
          ...mappedLocalDraft,
        };
      });

      if (!didReplaceLocalDraft) {
        next.push(mappedLocalDraft);
      }

      return next;
    });

    setSelectedProposalForSend((current) =>
      current && getProposalDraftGroupKey(current) === draftGroupKey
        ? {
            ...current,
            ...mappedLocalDraft,
            sentFreelancers: current.sentFreelancers,
          }
        : current,
    );

    setActiveProposal((current) =>
      current
        ? {
            ...current,
            ...mappedLocalDraft,
            sentFreelancers: current.sentFreelancers,
          }
        : current,
    );

    setIsEditingProposal(false);
    toast.success("Proposal updated.");
  }, [activeProposal, editableProposalDraft, user?.id]);

  const sendProposalToFreelancer = useCallback(
    async (freelancer) => {
      const proposal = selectedProposalForSend;
      if (!proposal || !freelancer) return;

      setSendingProposalId(proposal.id);

      try {
        const normalizedBudget = parseProposalBudgetValue(proposal.budget);
        const sourceProjectId = proposal?.syncedProjectId || proposal?.projectId || null;
        const currentProjectStatus = String(proposal?.projectStatus || "").toLowerCase();

        const hasExistingProposalForFreelancer = proposals.some((entry) => {
          if (!entry?.freelancerId || !entry?.projectId) return false;
          if (String(entry.projectId) !== String(sourceProjectId)) return false;
          if (String(entry.freelancerId) !== String(freelancer.id)) return false;
          return PROPOSAL_BLOCKED_STATUSES.has(String(entry.status || "").toLowerCase());
        });

        if (hasExistingProposalForFreelancer) {
          throw new Error("You already sent this proposal to this freelancer.");
        }

        if (CLOSED_PROJECT_STATUSES.has(currentProjectStatus)) {
          throw new Error("This project is already completed or paused.");
        }

        let project = sourceProjectId
          ? {
              id: sourceProjectId,
              status: proposal.projectStatus || "OPEN",
            }
          : null;

        if (sourceProjectId && DRAFT_PROJECT_STATUSES.has(currentProjectStatus)) {
          const publishRes = await authFetch(`/projects/${sourceProjectId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: resolveProposalTitle(proposal),
              description: proposal.summary || proposal.content || "",
              budget: normalizedBudget,
              timeline: proposal.timeline || "1 month",
              status: "OPEN",
            }),
          });

          const publishPayload = await publishRes.json().catch(() => null);
          if (!publishRes.ok) {
            throw new Error("Failed to publish project before sending proposal.");
          }

          project =
            publishPayload?.data?.project ||
            publishPayload?.data || {
              id: sourceProjectId,
              status: "OPEN",
            };
        }

        if (!project?.id) {
          const projectRes = await authFetch("/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: resolveProposalTitle(proposal),
              description: proposal.summary || proposal.content || "",
              budget: normalizedBudget,
              timeline: proposal.timeline || "1 month",
              status: "OPEN",
            }),
          });

          const projectPayload = await projectRes.json().catch(() => null);
          if (!projectRes.ok) {
            throw new Error(projectPayload?.message || "Failed to create project.");
          }

          project =
            projectPayload?.data?.project ||
            projectPayload?.data || {
              id: null,
              status: "OPEN",
            };
        }

        if (!project?.id) {
          throw new Error("Could not resolve project for this proposal.");
        }

        updateProposalProjectReference(
          proposal,
          project.id,
          String(project.status || "OPEN").toUpperCase(),
        );

        const proposalRes = await authFetch("/proposals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: project.id,
            freelancerId: freelancer.id,
            amount: normalizedBudget,
            coverLetter: proposal.summary || proposal.content || "",
          }),
        });

        const proposalPayload = await proposalRes.json().catch(() => null);
        if (!proposalRes.ok) {
          throw new Error(proposalPayload?.message || "Failed to send proposal.");
        }

        toast.success(
          proposalRes.status === 200
            ? `Proposal resent to ${freelancer.fullName || "freelancer"}!`
            : `Proposal sent to ${freelancer.fullName || "freelancer"}!`,
        );

        await fetchProposals();
      } catch (error) {
        console.error("Failed to send proposal:", error);
        toast.error(error?.message || "Failed to send proposal. Please try again.");
      } finally {
        setSendingProposalId(null);
      }
    },
    [
      authFetch,
      fetchProposals,
      proposals,
      selectedProposalForSend,
      updateProposalProjectReference,
    ],
  );

  const scopedProposals = useMemo(() => {
    if (!deepLinkProjectId) return proposals;
    return proposals.filter(
      (proposal) => String(proposal.projectId) === String(deepLinkProjectId),
    );
  }, [deepLinkProjectId, proposals]);

  const grouped = useMemo(
    () => {
      const acceptedProjectKeys = new Set(
        scopedProposals
          .filter((proposal) => proposal.status === "accepted" && proposal.projectId)
          .map((proposal) => String(proposal.projectId)),
      );
      const sentFreelancersByDraftKey = scopedProposals.reduce((acc, proposal) => {
        if (proposal.status === "draft") return acc;

        const draftKey = getProposalDraftGroupKey(proposal);
        const invitee = getProposalInvitee(proposal);
        if (!draftKey || !invitee) return acc;

        const current = acc.get(draftKey) || [];
        if (current.some((entry) => entry.id === invitee.id)) return acc;

        acc.set(draftKey, [...current, invitee]);
        return acc;
      }, new Map());

      const draftIndexes = new Map();
      const groupedBuckets = { draft: [], pending: [], rejected: [] };

      const pushDraftOnce = (proposal, options = {}) => {
        const draftKey = getProposalDraftGroupKey(proposal);
        const sentFreelancers = sentFreelancersByDraftKey.get(draftKey) || [];
        const nextDraft =
          sentFreelancers.length > 0
            ? { ...proposal, sentFreelancers }
            : proposal;

        if (draftIndexes.has(draftKey)) {
          if (options.preferSavedDraft) {
            groupedBuckets.draft[draftIndexes.get(draftKey)] = nextDraft;
          }
          return;
        }

        draftIndexes.set(draftKey, groupedBuckets.draft.length);
        groupedBuckets.draft.push(nextDraft);
      };

      scopedProposals.forEach((proposal) => {
        const projectKey = proposal.projectId ? String(proposal.projectId) : null;
        const hasAcceptedProposal = projectKey
          ? acceptedProjectKeys.has(projectKey)
          : false;

        if (proposal.status === "accepted") {
          if (proposal.requiresPayment) {
            groupedBuckets.pending.push(proposal);
          }
          return;
        }

        if (proposal.status === "draft") {
          if (!hasAcceptedProposal) {
            pushDraftOnce(proposal, { preferSavedDraft: true });
          }
          return;
        }

        if (proposal.status === "rejected") {
          groupedBuckets.rejected.push(proposal);
          return;
        }

        groupedBuckets.pending.push(proposal);

        if (!hasAcceptedProposal) {
          pushDraftOnce({
            ...proposal,
            status: "draft",
          });
        }
      });

      return groupedBuckets;
    },
    [scopedProposals],
  );

  const unassignedDraftCount = useMemo(
    () =>
      grouped.draft.filter(
        (proposal) => {
          if (Array.isArray(proposal.sentFreelancers) && proposal.sentFreelancers.length > 0) {
            return false;
          }

          return (
            !proposal.freelancerId ||
            !isAssignedFreelancerName(proposal.recipientName)
          );
        },
      ).length,
    [grouped.draft],
  );

  const proposalForFreelancerSelection = useMemo(() => {
    if (!selectedProposalForSend) return null;

    return {
      ...selectedProposalForSend,
      projectTitle: resolveProposalTitle(selectedProposalForSend),
      title: resolveProposalTitle(selectedProposalForSend),
      summary:
        selectedProposalForSend.summary || selectedProposalForSend.content || "",
      content:
        selectedProposalForSend.content || selectedProposalForSend.summary || "",
      service: resolveProposalServiceLabel(selectedProposalForSend),
      serviceKey:
        selectedProposalForSend.serviceKey ||
        resolveProposalServiceLabel(selectedProposalForSend),
      syncedProjectId:
        selectedProposalForSend.syncedProjectId ||
        selectedProposalForSend.projectId ||
        null,
      projectId:
        selectedProposalForSend.projectId ||
        selectedProposalForSend.syncedProjectId ||
        null,
    };
  }, [selectedProposalForSend]);

  const projectRequiredSkills = useMemo(() => {
    if (!showFreelancerSelect) return [];
    return extractProjectRequiredSkills(proposalForFreelancerSelection || {});
  }, [proposalForFreelancerSelection, showFreelancerSelect]);

  const rankedSuggestedFreelancers = useMemo(() => {
    if (!showFreelancerSelect) return [];
    if (!Array.isArray(suggestedFreelancers) || suggestedFreelancers.length === 0) {
      return [];
    }

    return rankFreelancersForProposal(
      suggestedFreelancers,
      proposalForFreelancerSelection,
    );
  }, [proposalForFreelancerSelection, showFreelancerSelect, suggestedFreelancers]);

  const freelancerSelectionData = useMemo(() => {
    if (!showFreelancerSelect) {
      return {
        totalRanked: 0,
        invitedCount: 0,
        available: [],
      };
    }

    const sourceProjectId =
      proposalForFreelancerSelection?.syncedProjectId ||
      proposalForFreelancerSelection?.projectId ||
      null;
    const alreadyInvitedIds = new Set();

    if (sourceProjectId) {
      proposals.forEach((proposal) => {
        if (String(proposal.projectId) !== String(sourceProjectId)) return;
        const status = String(proposal.status || "").toLowerCase();
        if (proposal.freelancerId && PROPOSAL_BLOCKED_STATUSES.has(status)) {
          alreadyInvitedIds.add(proposal.freelancerId);
        }
      });
    }

    const normalized = rankedSuggestedFreelancers.map((entry) =>
      normalizeFreelancerCardData(entry),
    );
    const matched = projectRequiredSkills.length
      ? normalized.filter((freelancer) => {
          const freelancerSkillTokens = collectFreelancerSkillTokens(freelancer);
          return projectRequiredSkills.some((requiredSkill) =>
            freelancerMatchesRequiredSkill(requiredSkill, freelancerSkillTokens),
          );
        })
      : normalized;

    const available = matched.filter((freelancer) => {
      if (alreadyInvitedIds.has(freelancer.id)) return false;
      if (!isFreelancerOpenToWork(freelancer)) return false;
      const matchScore = Number(freelancer?.matchScore);
      if (!Number.isFinite(matchScore)) return false;
      return Math.round(matchScore) >= MIN_FREELANCER_MATCH_SCORE;
    });

    return {
      totalRanked: matched.length,
      invitedCount: alreadyInvitedIds.size,
      available,
    };
  }, [
    projectRequiredSkills,
    proposalForFreelancerSelection?.projectId,
    proposalForFreelancerSelection?.syncedProjectId,
    proposals,
    rankedSuggestedFreelancers,
    showFreelancerSelect,
  ]);

  const filteredFreelancers = useMemo(() => {
    if (!showFreelancerSelect) return [];

    const query = String(freelancerSearch || "").trim().toLowerCase();
    if (!query) return freelancerSelectionData.available;

    return freelancerSelectionData.available.filter((freelancer) => {
      const searchable = [
        freelancer.fullName,
        freelancer.name,
        freelancer.role,
        freelancer.cleanBio,
        ...(Array.isArray(freelancer.skills) ? freelancer.skills : []),
        ...(Array.isArray(freelancer.matchHighlights) ? freelancer.matchHighlights : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [
    freelancerSearch,
    freelancerSelectionData.available,
    showFreelancerSelect,
  ]);

  const bestMatchFreelancerIds = useMemo(() => {
    const scoredFreelancers = freelancerSelectionData.available
      .map((freelancer) => {
        const score = Number.isFinite(Number(freelancer?.matchScore))
          ? Math.round(Number(freelancer.matchScore))
          : null;
        if (!freelancer?.id || score === null) return null;
        return { id: freelancer.id, score };
      })
      .filter(Boolean);

    if (scoredFreelancers.length === 0) return new Set();

    const topScore = scoredFreelancers.reduce(
      (maxScore, freelancer) => Math.max(maxScore, freelancer.score),
      Number.NEGATIVE_INFINITY,
    );

    if (!Number.isFinite(topScore) || topScore <= 0) return new Set();

    return new Set(
      scoredFreelancers
        .filter((freelancer) => freelancer.score === topScore)
        .map((freelancer) => freelancer.id),
    );
  }, [freelancerSelectionData.available]);

  useEffect(() => {
    if (!deepLinkProjectId || isLoading || hasHandledDeepLink) return;

    const relatedProposals = proposals.filter(
      (proposal) => String(proposal.projectId) === String(deepLinkProjectId),
    );

    if (!relatedProposals.length) {
      setHasHandledDeepLink(true);
      return;
    }

    const tabByStatus = (status) => {
      if (status === "draft") return "draft";
      if (status === "rejected") return "rejected";
      return "pending";
    };

    const validTabs = new Set(["draft", "pending", "rejected"]);
    const inferredTab = tabByStatus(relatedProposals[0]?.status);
    const targetTab = validTabs.has(deepLinkTab) ? deepLinkTab : inferredTab;
    setActiveTab(targetTab);

    if (deepLinkAction === "view") {
      const proposalForTab =
        relatedProposals.find((proposal) => tabByStatus(proposal.status) === targetTab) ||
        relatedProposals[0];

      if (proposalForTab) {
        handleOpenProposal(proposalForTab);
      }

      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("action");
      setSearchParams(nextParams, { replace: true });
    }

    setHasHandledDeepLink(true);
  }, [
    deepLinkAction,
    deepLinkProjectId,
    deepLinkTab,
    handleOpenProposal,
    hasHandledDeepLink,
    isLoading,
    proposals,
    searchParams,
    setSearchParams,
  ]);

  const tabCopy = {
    draft: {
      title: "Draft proposals",
      description: "Refine scope, review details, and send polished drafts to matched freelancers.",
      emptyTitle: "No draft proposals",
      emptyDescription:
        "Accepted proposal drafts will appear here until you send them to freelancers.",
    },
    pending: {
      title: "Pending approvals",
      description: "Track sent proposals, payment-required approvals, and live invites in one place.",
      emptyTitle: "No pending proposals",
      emptyDescription:
        "When a freelancer receives your proposal or a payment step is waiting, it will show here.",
    },
    rejected: {
      title: "Rejected proposals",
      description: "Keep visibility on declined proposals so you can revise the scope and resend later.",
      emptyTitle: "No rejected proposals",
      emptyDescription:
        "Rejected proposals will appear here if a freelancer turns down the current scope.",
    },
  };

  const currentTabItems = grouped[activeTab] || [];
  const currentTabMeta = tabCopy[activeTab] || tabCopy.draft;
  const headerDisplayName = getDisplayName(user);
  const activeProposalDetails = activeProposal ? extractProposalDetails(activeProposal) : null;

  return (
    <div className="min-h-screen bg-[#212121] text-[#f1f5f9]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1536px] flex-col px-4 pt-5 sm:px-6 lg:px-[40px] xl:w-[90%] xl:max-w-none">
        <ClientWorkspaceHeader
          profile={{
            avatar: user?.avatar,
            name: headerDisplayName,
            initial: getInitials(headerDisplayName),
          }}
          activeWorkspaceKey="proposals"
          unreadCount={unreadCount}
          notificationNode={
            <NotificationPopoverButton
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAllAsRead={markAllAsRead}
              onNotificationClick={handleNotificationClick}
            />
          }
        />

        <main className="flex-1 pb-12">
          <section className="mt-14 space-y-4">
            <div>
              <h1 className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-[-0.75px] text-[#f1f5f9]">
                Project Proposals
              </h1>
              <p className="mt-2 max-w-[34rem] text-sm text-[#94a3b8]">
                Manage your draft, pending, and rejected proposals. Keep your
                potential collaborations moving.
              </p>
            </div>

            <div className="flex min-h-7 flex-wrap items-center gap-3 text-sm text-[#94a3b8]">
              {deepLinkProjectId ? (
                <Badge
                  variant="outline"
                  className="rounded-full border-primary/20 bg-primary/10 px-4 py-1.5 text-primary"
                >
                  Filtered to the selected project
                </Badge>
              ) : null}
              {activeTab === "draft" && grouped.draft.length > 0 ? (
                <span>
                  {unassignedDraftCount} draft
                  {unassignedDraftCount === 1 ? "" : "s"} ready for freelancer outreach.
                </span>
              ) : null}
            </div>
          </section>

          <Tabs
            defaultValue="draft"
            value={activeTab}
            onValueChange={setActiveTab}
            className="mt-12 w-full space-y-8"
          >
            <TabsList className="inline-flex h-auto w-fit flex-wrap rounded-full border border-white/8 bg-[#262628] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              {[
                { value: "draft", label: "Draft" },
                { value: "pending", label: "Pending Approval" },
                { value: "rejected", label: "Rejected" },
              ].map((item) => (
                <TabsTrigger
                  key={item.value}
                  value={item.value}
                  className="h-11 rounded-full border border-transparent px-6 text-[0.95rem] font-semibold text-[#a3a6ad] shadow-none transition hover:text-white data-[state=active]:!border-[#ffc107]/70 data-[state=active]:!bg-[#ffc107] data-[state=active]:!text-[#141414] data-[state=active]:!shadow-none"
                >
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="draft" className="m-0">
              {isLoading ? (
                <ProposalLoadingState />
              ) : currentTabItems.length > 0 ? (
                <div className="space-y-6">
                  {currentTabItems.map((proposal) => (
                    <ProposalRowCard
                      key={proposal.id}
                      proposal={proposal}
                      onOpen={handleOpenProposal}
                      onDelete={handleDelete}
                      onSend={openFreelancerSelection}
                      isSending={sendingProposalId === proposal.id}
                    />
                  ))}
                </div>
              ) : (
                <EmptyStateCard
                  title={currentTabMeta.emptyTitle}
                  description={currentTabMeta.emptyDescription}
                />
              )}
            </TabsContent>

            <TabsContent value="pending" className="m-0">
              {isLoading ? (
                <ProposalLoadingState />
              ) : currentTabItems.length > 0 ? (
                <div className="space-y-6">
                  {currentTabItems.map((proposal) => (
                    <ProposalRowCard
                      key={proposal.id}
                      proposal={proposal}
                      onOpen={handleOpenProposal}
                      onDelete={handleDelete}
                      onPay={handleApproveAndPay}
                      isPaying={processingPaymentProposalId === proposal.id}
                    />
                  ))}
                  <ProposalWorkspaceHintCard
                    activeTab={activeTab}
                    hasProjectFilter={Boolean(deepLinkProjectId)}
                  />
                </div>
              ) : (
                <EmptyStateCard
                  title={currentTabMeta.emptyTitle}
                  description={currentTabMeta.emptyDescription}
                />
              )}
            </TabsContent>

            <TabsContent value="rejected" className="m-0">
              {isLoading ? (
                <ProposalLoadingState />
              ) : currentTabItems.length > 0 ? (
                <div className="space-y-6">
                  {currentTabItems.map((proposal) => (
                    <ProposalRowCard
                      key={proposal.id}
                      proposal={proposal}
                      onOpen={handleOpenProposal}
                      onDelete={handleDelete}
                    />
                  ))}
                  <ProposalWorkspaceHintCard
                    activeTab={activeTab}
                    hasProjectFilter={Boolean(deepLinkProjectId)}
                  />
                </div>
              ) : (
                <EmptyStateCard
                  title={currentTabMeta.emptyTitle}
                  description={currentTabMeta.emptyDescription}
                />
              )}
            </TabsContent>
          </Tabs>

          <ClientDashboardFooter variant="workspace" />
        </main>
      </div>

      <Dialog
        open={isViewing && Boolean(activeProposal)}
        onOpenChange={(open) => {
          setIsViewing(open);
          if (!open) setActiveProposal(null);
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-hidden border border-border/60 bg-[linear-gradient(180deg,rgba(12,12,14,0.98),rgba(18,18,24,0.98))] p-0 sm:max-w-[820px]">
          <div className="border-b border-white/10 px-6 py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  {activeProposal?.status === "draft" && isEditingProposal ? (
                    <>
                      <DialogTitle className="sr-only">Edit Proposal</DialogTitle>
                      <Input
                        value={editableProposalDraft.title}
                        onChange={(event) =>
                          handleEditableProposalDraftChange("title", event.target.value)
                        }
                        className="h-11 min-w-[16rem] border-white/10 bg-[#111214] text-xl font-semibold tracking-tight text-white placeholder:text-[#6f7785] focus-visible:border-[#ffc107]/45 focus-visible:ring-[#ffc107]/20 sm:min-w-[22rem]"
                        placeholder="Proposal title"
                      />
                    </>
                  ) : (
                    <DialogTitle className="text-2xl font-semibold tracking-tight text-foreground">
                      {activeProposal?.title || "Proposal"}
                    </DialogTitle>
                  )}
                  {activeProposal?.status ? (
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]",
                        statusColors[activeProposal.status] || statusColors.pending,
                      )}
                    >
                      {statusLabels[activeProposal.status] || activeProposal.status}
                    </Badge>
                  ) : null}
                </div>
                <DialogDescription className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  {activeProposal?.status === "draft"
                    ? "Review the draft, polish the scope, and send it to the right freelancer."
                    : "Review the proposal details, payment status, and delivery expectations."}
                </DialogDescription>
              </div>

              <Badge
                variant="outline"
                className="w-fit rounded-full border-white/10 bg-white/[0.04] px-3 py-1.5 text-muted-foreground"
              >
                {activeProposal?.submittedDate || "No date"}
              </Badge>
            </div>
          </div>

          <div className="space-y-6 overflow-y-auto px-6 py-6">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <ProposalMetric
                icon={FileText}
                label="Budget"
                value={
                  isEditingProposal ? (
                    <Input
                      value={editableProposalDraft.budget}
                      onChange={(event) =>
                        handleEditableProposalDraftChange("budget", event.target.value)
                      }
                      className="h-11 border-white/10 bg-[#111214] text-white placeholder:text-[#6f7785] focus-visible:border-[#ffc107]/45 focus-visible:ring-[#ffc107]/20"
                      placeholder="e.g. 40000"
                    />
                  ) : (
                    activeProposalDetails?.budget || "Not set"
                  )
                }
              />
              <ProposalMetric
                icon={Clock3}
                label="Timeline"
                value={
                  isEditingProposal ? (
                    <Input
                      value={editableProposalDraft.timeline}
                      onChange={(event) =>
                        handleEditableProposalDraftChange("timeline", event.target.value)
                      }
                      className="h-11 border-white/10 bg-[#111214] text-white placeholder:text-[#6f7785] focus-visible:border-[#ffc107]/45 focus-visible:ring-[#ffc107]/20"
                      placeholder="e.g. 3+ months"
                    />
                  ) : (
                    activeProposalDetails?.delivery || "Not set"
                  )
                }
              />
              <ProposalMetric
                icon={UserRound}
                label="Freelancer"
                value={
                  activeProposal ? (
                    <ProposalFreelancerAvatars
                      proposal={activeProposal}
                      avatarClassName="h-11 w-11"
                    />
                  ) : (
                    "Not assigned"
                  )
                }
              />
              <ProposalMetric
                icon={Layers3}
                label="Service"
                value={
                  isEditingProposal ? (
                    <Input
                      value={editableProposalDraft.service}
                      onChange={(event) =>
                        handleEditableProposalDraftChange("service", event.target.value)
                      }
                      className="h-11 border-white/10 bg-[#111214] text-white placeholder:text-[#6f7785] focus-visible:border-[#ffc107]/45 focus-visible:ring-[#ffc107]/20"
                      placeholder="Service"
                    />
                  ) : (
                    resolveProposalServiceLabel(activeProposal)
                  )
                }
              />
            </div>

            <Card className="border-border/60 bg-card/55">
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <h4 className="text-lg font-semibold tracking-tight text-foreground">
                      Proposal Details
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Full scope, delivery notes, and proposal narrative.
                    </p>
                  </div>

                  {activeProposal?.status === "draft" ? (
                    <div className="flex flex-wrap gap-2">
                      {isEditingProposal ? (
                        <>
                          <Button
                            variant="outline"
                            className="rounded-full border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]"
                            onClick={() => {
                              setEditableProposalDraft(buildEditableProposalDraft(activeProposal));
                              setIsEditingProposal(false);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            className="rounded-full bg-primary text-[#141414] hover:bg-primary/90"
                            onClick={handleSaveProposalChanges}
                          >
                            Save Changes
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          className="rounded-full border-primary/25 bg-primary/10 text-primary hover:bg-primary/15"
                          onClick={() => setIsEditingProposal(true)}
                        >
                          Edit Proposal
                        </Button>
                      )}
                    </div>
                  ) : null}
                </div>

                <div className="max-h-[48vh] overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-4">
                  {isLoadingProposal ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading details...
                    </div>
                  ) : isEditingProposal ? (
                    <Textarea
                      value={editableProposalDraft.content}
                      onChange={(event) =>
                        handleEditableProposalDraftChange("content", event.target.value)
                      }
                      className="min-h-[320px] border-white/10 bg-[#111214] text-white placeholder:text-[#6f7785] focus-visible:border-[#ffc107]/45 focus-visible:ring-[#ffc107]/20"
                      placeholder="Update the proposal content here..."
                    />
                  ) : (
                    <ProposalContentRenderer content={activeProposal?.content} />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="flex flex-col gap-3 border-t border-white/10 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-6 text-muted-foreground">
              Use the action buttons to continue the proposal lifecycle from here.
            </p>
            <div className="flex flex-wrap gap-2">
              {activeProposal?.status === "draft" && !activeProposal?.requiresPayment ? (
                <Button
                  variant="outline"
                  className="rounded-full border-primary/25 bg-primary/10 text-primary hover:bg-primary/15"
                  onClick={() => openFreelancerSelection(activeProposal)}
                  disabled={sendingProposalId === activeProposal?.id}
                >
                  {sendingProposalId === activeProposal?.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  {sendingProposalId === activeProposal?.id
                    ? "Sending..."
                    : "Send to Freelancers"}
                </Button>
              ) : null}

              {activeProposal?.requiresPayment ? (
                <Button
                  className="rounded-full bg-emerald-500 text-black hover:bg-emerald-400"
                  onClick={() => handleApproveAndPay(activeProposal)}
                  disabled={processingPaymentProposalId === activeProposal?.id}
                >
                  {processingPaymentProposalId === activeProposal?.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-4 w-4" />
                  )}
                  {processingPaymentProposalId === activeProposal?.id
                    ? "Processing..."
                    : "Approve & Pay"}
                </Button>
              ) : null}

              {activeProposal && !activeProposal.requiresPayment ? (
                <Button
                  variant="ghost"
                  className="rounded-full text-muted-foreground hover:bg-rose-500/10 hover:text-rose-300"
                  onClick={() => handleDelete(activeProposal)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              ) : null}
            </div>
          </DialogFooter>
        </DialogContent>
        </Dialog>

      <FreelancerSelectionDialog
        open={showFreelancerSelect}
        onOpenChange={setShowFreelancerSelect}
        savedProposal={proposalForFreelancerSelection}
        isLoadingFreelancers={isFreelancersLoading}
        isSendingProposal={Boolean(sendingProposalId)}
        freelancerSearch={freelancerSearch}
        onFreelancerSearchChange={setFreelancerSearch}
        filteredFreelancers={filteredFreelancers}
        freelancerSelectionData={freelancerSelectionData}
        bestMatchFreelancerIds={bestMatchFreelancerIds}
        projectRequiredSkills={projectRequiredSkills}
        onViewFreelancer={(freelancer) => {
          setViewingFreelancer(freelancer);
          setShowFreelancerProfile(true);
        }}
        onSendProposal={sendProposalToFreelancer}
        collectFreelancerSkillTokens={collectFreelancerSkillTokens}
        freelancerMatchesRequiredSkill={freelancerMatchesRequiredSkill}
        generateGradient={(id) => {
          if (!id) return "linear-gradient(135deg, #0f172a, #1d4ed8)";

          let hash = 0;
          for (let index = 0; index < id.length; index += 1) {
            hash = id.charCodeAt(index) + ((hash << 5) - hash);
          }

          const firstHue = Math.abs(hash % 360);
          const secondHue = (firstHue + 44) % 360;
          return `linear-gradient(135deg, hsl(${firstHue}, 78%, 58%), hsl(${secondHue}, 78%, 48%))`;
        }}
        formatRating={formatRating}
      />

      <FreelancerProfileDialog
        open={showFreelancerProfile}
        onOpenChange={setShowFreelancerProfile}
        viewingFreelancer={viewingFreelancer}
      />
    </div>
  );
};

const ClientProposal = () => <ClientProposalContent />;

export default ClientProposal;
