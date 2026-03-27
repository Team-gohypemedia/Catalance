"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Bell from "lucide-react/dist/esm/icons/bell";
import Clock3 from "lucide-react/dist/esm/icons/clock-3";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Layers3 from "lucide-react/dist/esm/icons/layers-3";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Pencil from "lucide-react/dist/esm/icons/pencil";
import Send from "lucide-react/dist/esm/icons/send";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import UserRound from "lucide-react/dist/esm/icons/user-round";
import { useNavigate, useSearchParams } from "react-router-dom";
import ClientDashboardFooter from "@/components/features/client/ClientDashboardFooter";
import ClientPageHeader from "@/components/features/client/ClientPageHeader";
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
  DialogHeader,
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
import { extractLabeledLineValue } from "@/shared/lib/labeled-fields";
import { openRazorpayCheckout } from "@/shared/lib/razorpay-checkout";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";

const MIN_FREELANCER_MATCH_SCORE = 50;
const PROPOSAL_BLOCKED_STATUSES = new Set(["pending", "accepted", "sent"]);
const CLOSED_PROJECT_STATUSES = new Set(["completed", "paused"]);
const DRAFT_PROJECT_STATUSES = new Set(["draft", "local_draft"]);
const HIDDEN_REJECTION_REASON_KEYS = new Set(["system_awarded_to_another"]);

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

const getFirstNonEmptyText = (...values) => {
  for (const value of values.flat()) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }

  return "";
};

const extractProposalLabeledValue = (value = "", labels = []) =>
  extractLabeledLineValue(value, labels);

const extractProposalQuestionAnswer = (answers = {}, patterns = []) => {
  if (!answers || typeof answers !== "object") return "";

  for (const [question, answer] of Object.entries(answers)) {
    const normalizedQuestion = String(question || "").trim();
    if (!normalizedQuestion) continue;

    const isMatch = patterns.some((pattern) => pattern.test(normalizedQuestion));
    if (!isMatch) continue;

    const extracted = collectStringValues(answer)
      .map((value) => String(value || "").trim())
      .find(Boolean);

    if (extracted) return extracted;
  }

  return "";
};

const normalizeComparableText = (value = "") =>
  String(value || "").trim().toLowerCase();

const toDisplayTitleCase = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/(^|[\s/-])([a-z])/g, (match, prefix, char) => `${prefix}${char.toUpperCase()}`);

const stripServiceNameFromProjectTitle = (projectTitle = "", serviceLabel = "") => {
  const normalizedProjectTitle = String(projectTitle || "").trim();
  const normalizedServiceLabel = String(serviceLabel || "").trim();

  if (!normalizedProjectTitle) return "";
  if (!normalizedServiceLabel) return normalizedProjectTitle;

  const titleParts = normalizedProjectTitle
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);

  if (titleParts.length === 2) {
    if (normalizeComparableText(titleParts[0]) === normalizeComparableText(normalizedServiceLabel)) {
      return titleParts[1];
    }

    if (normalizeComparableText(titleParts[1]) === normalizeComparableText(normalizedServiceLabel)) {
      return titleParts[0];
    }
  }

  return normalizedProjectTitle;
};

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
    proposalId: normalizedProposal.id || null,
    status: normalizeProposalStatus(normalizedProposal.status || "PENDING"),
    submittedDate: formatProposalDate(
      normalizedProposal.updatedAt || normalizedProposal.createdAt,
    ),
    avatar:
      normalizedProposal.avatar ||
      normalizedProposal.freelancer?.avatar ||
      "",
    rejectionReason: normalizedProposal.rejectionReason || null,
    rejectionReasonKey: normalizedProposal.rejectionReasonKey || null,
  };
};

const getProposalFreelancerRecipients = (proposal = {}) => {
  const sentFreelancers = Array.isArray(proposal?.sentFreelancers)
    ? proposal.sentFreelancers.filter(Boolean)
    : [];

  if (sentFreelancers.length > 0) {
    return sentFreelancers;
  }

  const invitee = getProposalInvitee(proposal);
  return invitee ? [invitee] : [];
};

const canUnsendProposalInvitee = (invitee = {}) => {
  const status = String(invitee?.status || "").toLowerCase();
  return Boolean(invitee?.proposalId) && status !== "accepted" && status !== "rejected";
};

const shouldHideRejectedProposal = (proposal = {}) =>
  HIDDEN_REJECTION_REASON_KEYS.has(
    String(proposal?.rejectionReasonKey || "").trim().toLowerCase(),
  );

const mergeInviteeCollections = (current = [], incoming = []) => {
  const merged = Array.isArray(current) ? [...current] : [];

  (Array.isArray(incoming) ? incoming : []).forEach((invitee) => {
    if (!invitee) return;
    if (merged.some((entry) => entry?.id === invitee.id)) return;
    merged.push(invitee);
  });

  return merged;
};

const resolveProposalServiceLabel = (proposal) => {
  const normalizedProposal = normalizeProposalRecord(proposal);
  const proposalContext =
    normalizedProposal.proposalContext &&
    typeof normalizedProposal.proposalContext === "object"
      ? normalizedProposal.proposalContext
      : {};
  const questionnaireAnswersBySlug =
    proposalContext.questionnaireAnswersBySlug &&
    typeof proposalContext.questionnaireAnswersBySlug === "object"
      ? proposalContext.questionnaireAnswersBySlug
      : {};
  const questionnaireAnswers =
    proposalContext.questionnaireAnswers &&
    typeof proposalContext.questionnaireAnswers === "object"
      ? proposalContext.questionnaireAnswers
      : {};
  const contentServiceType = extractProposalLabeledValue(
    normalizedProposal.content || normalizedProposal.summary || "",
    ["Service Type", "Service", "Category"],
  );
  const questionnaireServiceType = getFirstNonEmptyText(
    proposalContext.serviceName,
    proposalContext.serviceType,
    extractProposalQuestionAnswer(questionnaireAnswersBySlug, [
      /service[-_\s]?type/i,
      /service[-_\s]?name/i,
      /^service$/i,
      /^category$/i,
    ]),
    extractProposalQuestionAnswer(questionnaireAnswers, [
      /service type/i,
      /service name/i,
      /category/i,
    ]),
  );

  return (
    contentServiceType ||
    questionnaireServiceType ||
    normalizedProposal.service ||
    normalizedProposal.serviceName ||
    normalizedProposal.serviceKey ||
    normalizedProposal.category ||
    normalizedProposal.project?.service ||
    normalizedProposal.project?.serviceName ||
    "General"
  );
};

const resolveProposalBusinessName = (proposal) => {
  const normalizedProposal = normalizeProposalRecord(proposal);
  const proposalContext =
    normalizedProposal.proposalContext &&
    typeof normalizedProposal.proposalContext === "object"
      ? normalizedProposal.proposalContext
      : {};
  const questionnaireAnswersBySlug =
    proposalContext.questionnaireAnswersBySlug &&
    typeof proposalContext.questionnaireAnswersBySlug === "object"
      ? proposalContext.questionnaireAnswersBySlug
      : {};
  const questionnaireAnswers =
    proposalContext.questionnaireAnswers &&
    typeof proposalContext.questionnaireAnswers === "object"
      ? proposalContext.questionnaireAnswers
      : {};

  return getFirstNonEmptyText(
    proposalContext.businessName,
    proposalContext.companyName,
    normalizedProposal.businessName,
    normalizedProposal.companyName,
    extractProposalQuestionAnswer(questionnaireAnswersBySlug, [
      /business[-_\s]?name/i,
      /company[-_\s]?name/i,
      /brand[-_\s]?name/i,
    ]),
    extractProposalQuestionAnswer(questionnaireAnswers, [
      /business name/i,
      /company name/i,
      /brand name/i,
    ]),
    extractProposalLabeledValue(normalizedProposal.content || normalizedProposal.summary || "", [
      "Business Name",
      "Company Name",
      "Brand Name",
    ]),
  );
};

const resolveProposalProjectName = (proposal) => {
  const normalizedProposal = normalizeProposalRecord(proposal);
  const proposalContext =
    normalizedProposal.proposalContext &&
    typeof normalizedProposal.proposalContext === "object"
      ? normalizedProposal.proposalContext
      : {};
  const questionnaireAnswersBySlug =
    proposalContext.questionnaireAnswersBySlug &&
    typeof proposalContext.questionnaireAnswersBySlug === "object"
      ? proposalContext.questionnaireAnswersBySlug
      : {};
  const questionnaireAnswers =
    proposalContext.questionnaireAnswers &&
    typeof proposalContext.questionnaireAnswers === "object"
      ? proposalContext.questionnaireAnswers
      : {};
  const serviceLabel = resolveProposalServiceLabel(normalizedProposal);
  const businessNameFallback = resolveProposalBusinessName(normalizedProposal);
  const contentProjectName = extractProposalLabeledValue(
    normalizedProposal.content || normalizedProposal.summary || "",
    ["Project Name", "Project Title", "Project"],
  );
  const questionnaireProjectName = getFirstNonEmptyText(
    proposalContext.projectTitle,
    proposalContext.projectName,
    extractProposalQuestionAnswer(questionnaireAnswersBySlug, [
      /project[-_\s]?name/i,
      /project[-_\s]?title/i,
      /^title$/i,
    ]),
    extractProposalQuestionAnswer(questionnaireAnswers, [
      /project name/i,
      /project title/i,
    ]),
  );
  const projectTitle = getFirstNonEmptyText(
    normalizedProposal.project?.title,
    normalizedProposal.project?.name,
    normalizedProposal.projectTitle,
    normalizedProposal.projectName,
    questionnaireProjectName,
    contentProjectName,
    businessNameFallback,
    normalizedProposal.title,
  );
  const cleanedProjectTitle = stripServiceNameFromProjectTitle(projectTitle, serviceLabel);

  if (
    cleanedProjectTitle &&
    normalizeComparableText(cleanedProjectTitle) !== normalizeComparableText(serviceLabel)
  ) {
    return cleanedProjectTitle;
  }

  if (
    businessNameFallback &&
    normalizeComparableText(businessNameFallback) !== normalizeComparableText(serviceLabel)
  ) {
    return businessNameFallback;
  }

  return cleanedProjectTitle || serviceLabel || "Proposal";
};

const resolveProposalTitle = (proposal) => resolveProposalProjectName(proposal);

const PROPOSAL_NARRATIVE_SECTION_ALIASES = Object.freeze({
  overview: [
    "project overview",
    "overview",
    "project summary",
    "solution overview",
  ],
  objectives: [
    "primary objectives",
    "objectives",
    "project objectives",
    "goals",
  ],
  deliverables: [
    "deliverables",
    "deliverables included",
    "features/deliverables included",
    "features included",
    "scope",
    "scope of work",
  ],
  techStack: [
    "tech stack",
    "technical stack",
    "technology stack",
    "stack",
  ],
  notes: [
    "delivery notes",
    "notes",
    "additional notes",
    "implementation notes",
    "handover notes",
  ],
});

const PROPOSAL_METADATA_LABELS = new Set([
  "client name",
  "business name",
  "company name",
  "brand name",
  "service type",
  "service",
  "category",
  "timeline",
  "budget",
  "project name",
  "project title",
  "project",
]);

const normalizeProposalSectionLabel = (value = "") =>
  normalizeComparableText(String(value || "").replace(/^#+\s*/, "").replace(/[:：]\s*$/, ""));

const normalizeProposalListItem = (value = "") =>
  String(value || "")
    .replace(/^(?:[-*•]+|\d+[.)])\s*/, "")
    .replace(/\s+/g, " ")
    .trim();

const dedupeProposalTextItems = (values = []) => {
  const seen = new Set();
  const items = [];

  values.forEach((value) => {
    const normalized = normalizeProposalListItem(value);
    const key = normalizeComparableText(normalized);
    if (!normalized || !key || seen.has(key)) return;
    seen.add(key);
    items.push(normalized);
  });

  return items;
};

const parseProposalEditableList = (value = "", options = {}) => {
  const { splitCommas = false } = options;
  const source = String(value || "");
  if (!source.trim()) return [];

  const normalizedSource = splitCommas ? source.replace(/,\s*/g, "\n") : source;
  return dedupeProposalTextItems(
    normalizedSource
      .split(/\r?\n|[•]/)
      .map((entry) => normalizeProposalListItem(entry))
      .filter(Boolean),
  );
};

const serializeProposalEditableList = (values = []) =>
  dedupeProposalTextItems(values).join("\n");

const resolveProposalNarrativeSectionKey = (label = "") => {
  const normalizedLabel = normalizeProposalSectionLabel(label);

  return (
    Object.entries(PROPOSAL_NARRATIVE_SECTION_ALIASES).find(([, aliases]) =>
      aliases.some((alias) => normalizeComparableText(alias) === normalizedLabel),
    )?.[0] || null
  );
};

const compactProposalSectionText = (lines = []) =>
  String(
    (Array.isArray(lines) ? lines : [])
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  );

const parseProposalNarrativeSections = (content = "") => {
  const sections = {
    intro: [],
    overview: [],
    objectives: [],
    deliverables: [],
    techStack: [],
    notes: [],
  };
  let activeSectionKey = null;

  String(content || "")
    .split(/\r?\n/)
    .forEach((rawLine) => {
      const trimmedLine = rawLine.trim();

      if (!trimmedLine) {
        if (activeSectionKey) {
          const targetSection = sections[activeSectionKey];
          if (targetSection[targetSection.length - 1] !== "") {
            targetSection.push("");
          }
        }
        return;
      }

      const markdownHeadingMatch = trimmedLine.match(/^#{1,6}\s*(.+)$/);
      const labeledLineMatch = trimmedLine.match(/^([A-Za-z][A-Za-z\s/&()'-]{2,60})\s*:\s*(.*)$/);
      const detectedLabel = markdownHeadingMatch?.[1] || labeledLineMatch?.[1] || "";
      const sectionKey = resolveProposalNarrativeSectionKey(detectedLabel);

      if (sectionKey) {
        activeSectionKey = sectionKey;
        const inlineValue = labeledLineMatch?.[2]?.trim();
        if (inlineValue) {
          sections[sectionKey].push(inlineValue);
        }
        return;
      }

      if (
        labeledLineMatch &&
        PROPOSAL_METADATA_LABELS.has(normalizeProposalSectionLabel(labeledLineMatch[1]))
      ) {
        activeSectionKey = null;
        return;
      }

      if (activeSectionKey) {
        sections[activeSectionKey].push(trimmedLine);
        return;
      }

      sections.intro.push(trimmedLine);
    });

  return sections;
};

const buildProposalStructuredData = (proposal, clientNameFallback = "Client") => {
  const normalizedProposal = normalizeProposalRecord(proposal);
  const proposalContext =
    normalizedProposal.proposalContext &&
    typeof normalizedProposal.proposalContext === "object"
      ? normalizedProposal.proposalContext
      : {};
  const questionnaireAnswersBySlug =
    proposalContext.questionnaireAnswersBySlug &&
    typeof proposalContext.questionnaireAnswersBySlug === "object"
      ? proposalContext.questionnaireAnswersBySlug
      : {};
  const questionnaireAnswers =
    proposalContext.questionnaireAnswers &&
    typeof proposalContext.questionnaireAnswers === "object"
      ? proposalContext.questionnaireAnswers
      : {};
  const content = normalizedProposal.content || normalizedProposal.summary || "";
  const narrativeSections = parseProposalNarrativeSections(content);
  const extractedBudget =
    normalizedProposal.budget !== undefined && normalizedProposal.budget !== null
      ? String(normalizedProposal.budget)
      : "";
  const extractedTimelineFromContent = extractProposalLabeledValue(content, [
    "Timeline",
    "Launch Timeline",
    "Delivery",
    "Deadline",
  ]);
  const extractedTimeline = getFirstNonEmptyText(
    extractedTimelineFromContent,
    proposalContext.timeline,
    proposalContext.launchTimeline,
    normalizedProposal.timeline,
    extractProposalQuestionAnswer(questionnaireAnswersBySlug, [
      /launch[-_\s]?timeline/i,
      /timeline/i,
      /delivery/i,
      /deadline/i,
    ]),
    extractProposalQuestionAnswer(questionnaireAnswers, [
      /launch timeline/i,
      /timeline/i,
      /delivery/i,
      /deadline/i,
    ]),
  );

  const objectives = dedupeProposalTextItems([
    ...parseProposalEditableList(compactProposalSectionText(narrativeSections.objectives)),
    ...parseProposalEditableList(
      extractProposalQuestionAnswer(questionnaireAnswersBySlug, [
        /objective/i,
        /goal/i,
      ]),
    ),
    ...parseProposalEditableList(
      extractProposalQuestionAnswer(questionnaireAnswers, [/objective/i, /goal/i]),
    ),
  ]);

  const deliverables = dedupeProposalTextItems([
    ...parseProposalEditableList(compactProposalSectionText(narrativeSections.deliverables)),
    ...parseProposalEditableList(
      extractProposalQuestionAnswer(questionnaireAnswersBySlug, [
        /deliverables?/i,
        /features?/i,
        /scope/i,
      ]),
    ),
    ...parseProposalEditableList(
      extractProposalQuestionAnswer(questionnaireAnswers, [
        /deliverables?/i,
        /features?/i,
        /scope/i,
      ]),
    ),
  ]);

  const techStack = dedupeProposalTextItems([
    ...parseProposalEditableList(compactProposalSectionText(narrativeSections.techStack), {
      splitCommas: true,
    }),
    ...extractProjectRequiredSkills(normalizedProposal),
  ]);

  const overview = getFirstNonEmptyText(
    compactProposalSectionText(narrativeSections.overview),
    compactProposalSectionText(narrativeSections.intro),
    extractProposalQuestionAnswer(questionnaireAnswersBySlug, [
      /project[-_\s]?(overview|summary|description)/i,
      /overview/i,
      /project brief/i,
    ]),
    extractProposalQuestionAnswer(questionnaireAnswers, [
      /project overview/i,
      /project summary/i,
      /project description/i,
      /overview/i,
    ]),
    content,
  );

  const notes = getFirstNonEmptyText(
    compactProposalSectionText(narrativeSections.notes),
    extractProposalQuestionAnswer(questionnaireAnswersBySlug, [
      /delivery[-_\s]?notes?/i,
      /notes?/i,
      /special instructions/i,
    ]),
    extractProposalQuestionAnswer(questionnaireAnswers, [
      /delivery notes/i,
      /notes?/i,
      /special instructions/i,
    ]),
  );

  return {
    title: resolveProposalTitle(normalizedProposal),
    businessName: resolveProposalBusinessName(normalizedProposal),
    clientName: getFirstNonEmptyText(
      normalizedProposal.clientName,
      proposalContext.clientName,
      extractProposalQuestionAnswer(questionnaireAnswersBySlug, [
        /client[-_\s]?name/i,
        /owner[-_\s]?name/i,
      ]),
      extractProposalQuestionAnswer(questionnaireAnswers, [
        /client name/i,
        /owner name/i,
      ]),
      clientNameFallback,
    ),
    service: resolveProposalServiceLabel(normalizedProposal),
    budget: extractedBudget,
    timeline: extractedTimeline,
    projectOverview: overview,
    objectives,
    objectivesText: serializeProposalEditableList(objectives),
    deliverables,
    deliverablesText: serializeProposalEditableList(deliverables),
    techStack,
    techStackText: serializeProposalEditableList(techStack),
    notes,
    content,
  };
};

const buildProposalContentFromDraft = (draft = {}) => {
  const objectives = parseProposalEditableList(draft.objectivesText);
  const deliverables = parseProposalEditableList(draft.deliverablesText);
  const techStack = parseProposalEditableList(draft.techStackText, { splitCommas: true });
  const sections = [];

  const pushSection = (label, value) => {
    const cleanedValue = String(value || "").trim();
    if (!cleanedValue) return;
    sections.push(`${label}: ${cleanedValue}`);
  };

  pushSection("Client Name", draft.clientName);
  pushSection("Business Name", draft.businessName);
  pushSection("Service Type", draft.service);
  pushSection("Timeline", draft.timeline);
  pushSection("Budget", draft.budget);

  const overview = String(draft.projectOverview || "").trim();
  if (overview) {
    sections.push("");
    sections.push("Project Overview:");
    sections.push(overview);
  }

  if (objectives.length > 0) {
    sections.push("");
    sections.push("Primary Objectives:");
    objectives.forEach((item) => sections.push(`- ${item}`));
  }

  if (deliverables.length > 0) {
    sections.push("");
    sections.push("Deliverables Included:");
    deliverables.forEach((item) => sections.push(`- ${item}`));
  }

  if (techStack.length > 0) {
    sections.push("");
    sections.push(`Tech Stack: ${techStack.join(", ")}`);
  }

  const notes = String(draft.notes || "").trim();
  if (notes) {
    sections.push("");
    sections.push("Delivery Notes:");
    sections.push(notes);
  }

  return sections.join("\n").trim();
};

const buildUpdatedProposalContext = (currentContext = null, draft = {}, clientNameFallback = "Client") => {
  const nextContext =
    currentContext && typeof currentContext === "object" ? { ...currentContext } : {};

  nextContext.projectTitle = String(draft.title || "").trim();
  nextContext.projectName = String(draft.title || "").trim();
  nextContext.businessName = String(draft.businessName || "").trim();
  nextContext.companyName = String(draft.businessName || "").trim();
  nextContext.clientName = String(draft.clientName || "").trim() || clientNameFallback;
  nextContext.serviceName = String(draft.service || "").trim();
  nextContext.serviceType = String(draft.service || "").trim();
  nextContext.timeline = String(draft.timeline || "").trim();

  return nextContext;
};

const ProposalSectionCard = ({ title, description, children, className }) => (
  <Card className={cn("border-border/60 bg-background/35 shadow-none", className)}>
    <CardContent className="space-y-4 p-5 sm:p-6">
      <div className="space-y-1">
        <h4 className="text-base font-semibold tracking-tight text-white">{title}</h4>
        {description ? (
          <p className="text-sm leading-6 text-[#94a3b8]">{description}</p>
        ) : null}
      </div>
      {children}
    </CardContent>
  </Card>
);

const ProposalStructuredList = ({ items, emptyMessage = "No items added yet." }) => {
  if (!Array.isArray(items) || items.length === 0) {
    return <p className="text-sm leading-6 text-[#94a3b8]">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={`${item}-${index}`}
          className="flex items-start gap-3 rounded-2xl border border-white/8 bg-background/40 px-4 py-3"
        >
          <span className="mt-0.5 text-xs font-semibold text-[#ffc107]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <p className="text-sm leading-6 text-white">{item}</p>
        </div>
      ))}
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
    const extractedTimeline = extractProposalLabeledValue(
      normalizedProposal.content,
      ["Timeline", "Launch Timeline"],
    );
    if (extractedTimeline) delivery = extractedTimeline;
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
  <div className="rounded-2xl border border-border/60 bg-background/35 p-4">
    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      <Icon className="h-3.5 w-3.5 text-primary" />
      <span>{label}</span>
    </div>
    <div className={cn("mt-3 text-base font-semibold text-foreground", valueClassName)}>
      {value}
    </div>
  </div>
);

const ProposalSummaryItem = ({ label, value, valueClassName, className, bordered = true }) => (
  <div
    className={cn(
      "space-y-2",
      bordered && "border-b border-white/8 pb-3 last:border-b-0 last:pb-0",
      className,
    )}
  >
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
  maxVisible = 5,
}) => {
  const sentFreelancers = Array.isArray(proposal?.sentFreelancers)
    ? proposal.sentFreelancers.filter(Boolean)
    : [];
  const fallbackAvatarName = isAssignedFreelancerName(proposal?.recipientName)
    ? proposal.recipientName
    : "Not assigned";
  const initials = getInitials(fallbackAvatarName);
  const additionalCount = Math.max(sentFreelancers.length - maxVisible, 0);

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
        {additionalCount > 0 ? (
          <div
            className={cn(
              "flex items-center justify-center rounded-full border-2 border-[#2b2b2d] bg-[#171718] text-[11px] font-semibold text-white",
              avatarClassName,
            )}
          >
            +{additionalCount}
          </div>
        ) : null}
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

const ProposalRowCard = ({
  proposal,
  onDelete,
  onOpen,
  onPay,
  onSend,
  onViewFreelancers,
  isPaying,
  isSending,
}) => {
  const details = extractProposalDetails(proposal);
  const isDraft = proposal.status === "draft";
  const canSendToFreelancers = isDraft && !proposal.requiresPayment && onSend;
  const showSecondaryAction = canSendToFreelancers || Boolean(proposal.requiresPayment && onPay);
  const businessName = resolveProposalBusinessName(proposal);
  const displayBusinessName = businessName ? toDisplayTitleCase(businessName) : "";
  const projectName = resolveProposalProjectName(proposal);
  const serviceLabel = resolveProposalServiceLabel(proposal);
  const cardTitle = projectName || displayBusinessName || serviceLabel || "Proposal";
  const useBusinessNameTitle =
    Boolean(displayBusinessName) &&
    normalizeComparableText(cardTitle) === normalizeComparableText(displayBusinessName);
  const showServiceLabel =
    Boolean(serviceLabel) &&
    normalizeComparableText(serviceLabel) !== normalizeComparableText(cardTitle);
  const freelancerRecipients = getProposalFreelancerRecipients(proposal);
  const canViewFreelancerDetails =
    freelancerRecipients.length > 0 && Boolean(onViewFreelancers);
  const canDeleteProposal =
    Boolean(onDelete) && !proposal.requiresPayment && !proposal.isGroupedPending;
  const rejectionReasonText = shouldHideRejectedProposal(proposal)
    ? ""
    : getFirstNonEmptyText(proposal.rejectionReason);
  const showRightSideRejectionReason =
    proposal.status === "rejected" && Boolean(rejectionReasonText);

  return (
    <Card className="overflow-hidden rounded-[2.9rem] border border-white/6 bg-[#2b2b2d] shadow-none transition duration-200 hover:border-white/10">
      <CardContent className="p-7 sm:p-8 lg:p-9">
        <div className="space-y-2">
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
                <h3
                  className={cn(
                    "text-[2rem] font-semibold tracking-[-0.04em] text-white sm:text-[2.2rem]",
                    useBusinessNameTitle && "capitalize",
                  )}
                >
                  {cardTitle}
                </h3>
                {showServiceLabel ? (
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#8d96a7]">
                    {serviceLabel}
                  </p>
                ) : null}
              </div>
            </div>

            {showRightSideRejectionReason || canDeleteProposal ? (
              <div className="flex shrink-0 flex-col items-end gap-3">
                {canDeleteProposal ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full text-[#8d96a7] hover:bg-white/5 hover:text-white"
                    onClick={() => onDelete(proposal)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}

                {showRightSideRejectionReason ? (
                  <div className="max-w-[16rem] bg-transparent px-3 py-2 text-right">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-rose-300/75">
                      Freelancer response
                    </p>
                    <p
                      className="mt-0.5 truncate text-xs font-medium text-rose-200"
                      title={rejectionReasonText}
                    >
                      {rejectionReasonText}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="grid gap-6 border-t border-white/6 pt-6 lg:grid-cols-[1.25fr_1fr_1fr_auto] lg:items-start">
            <ProposalSummaryItem
              bordered={false}
              label="Proposal Sent To"
              value={
                <div className="flex flex-col items-start gap-2.5">
                  <ProposalFreelancerAvatars proposal={proposal} />
                  {canViewFreelancerDetails ? (
                    <button
                      type="button"
                      className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary transition hover:text-primary/80"
                      onClick={() => onViewFreelancers?.(proposal)}
                    >
                      View details
                    </button>
                  ) : null}
                </div>
              }
            />
            <ProposalSummaryItem
              bordered={false}
              label="Budget"
              value={details.budget}
              valueClassName="text-[1.9rem] font-semibold tracking-[-0.03em] text-primary"
            />
            <ProposalSummaryItem
              bordered={false}
              label="Timeline"
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
                <FileText className="mr-2 h-3.5 w-3.5" />
                View Details
              </Button>

              {showSecondaryAction ? (
                <div className="flex w-full flex-col gap-2 lg:justify-end">
                  {canSendToFreelancers ? (
                    <Button
                      className="h-11 w-full rounded-full border border-white/10 bg-white/[0.03] px-6 font-semibold text-white hover:bg-white/[0.06]"
                      onClick={() => onSend?.(proposal)}
                      disabled={isSending}
                    >
                      {isSending ? (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-3.5 w-3.5" />
                      )}
                      {isSending ? "Sending Proposal..." : "Send Proposal"}
                    </Button>
                  ) : null}

                  {proposal.requiresPayment && onPay ? (
                    <Button
                      className="h-9 w-full rounded-full bg-emerald-500 px-4 text-xs font-semibold text-black hover:bg-emerald-400"
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

const ProposalFreelancerDetailsDialog = ({
  proposal,
  open,
  onOpenChange,
  onUnsend,
  unsendingProposalId,
}) => {
  const recipients = useMemo(
    () => getProposalFreelancerRecipients(proposal),
    [proposal],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-[52rem] flex-col overflow-hidden border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,20,0.98),rgba(23,23,25,0.98))] p-0 text-white">
        <div className="flex-shrink-0 border-b border-white/10 px-6 py-5">
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="text-xl font-semibold tracking-tight text-white">
              Freelancer details
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-[#94a3b8]">
              {recipients.length > 1
                ? `${recipients.length} freelancers have received this proposal for ${
                    resolveProposalTitle(proposal) || "this project"
                  }.`
                : `Review who received this proposal for ${
                    resolveProposalTitle(proposal) || "this project"
                  }.`}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {recipients.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {recipients.map((invitee) => {
                const status = String(invitee?.status || "").toLowerCase();
                const canUnsend = canUnsendProposalInvitee(invitee);
                const isUnsending = unsendingProposalId === invitee?.proposalId;

                return (
                  <div
                    key={invitee?.proposalId || invitee?.id}
                    className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-white/15 hover:bg-white/[0.05]"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-11 w-11 shrink-0 border border-white/10">
                        <AvatarImage src={invitee?.avatar} alt={invitee?.name} />
                        <AvatarFallback className="bg-[#111214] text-sm font-bold text-primary">
                          {getInitials(invitee?.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {invitee?.name || "Freelancer"}
                        </p>
                        <p className="mt-0.5 text-xs text-[#94a3b8]">
                          Sent {invitee?.submittedDate || "recently"}
                        </p>
                      </div>

                      <Badge
                        variant="outline"
                        className={cn(
                          "shrink-0 rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em]",
                          proposalCardStatusClasses[status] || proposalCardStatusClasses.pending,
                        )}
                      >
                        {statusLabels[status] || "Pending"}
                      </Badge>
                    </div>

                    {invitee.rejectionReason && status === "rejected" ? (
                      <div className="rounded-xl border border-rose-500/20 bg-[linear-gradient(145deg,rgba(244,63,94,0.14),rgba(244,63,94,0.04))] px-3.5 py-3">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-rose-300/85">
                          Freelancer response
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-rose-100">
                          {invitee.rejectionReason}
                        </p>
                      </div>
                    ) : canUnsend ? (
                      <Button
                        className="h-8 w-full rounded-full bg-white px-4 text-xs font-semibold text-[#141414] hover:bg-white/90"
                        onClick={() => onUnsend?.(invitee)}
                        disabled={isUnsending}
                      >
                        {isUnsending ? (
                          <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="mr-1.5 h-3 w-3" />
                        )}
                        {isUnsending ? "Unsending..." : "Unsend Proposal"}
                      </Button>
                    ) : (
                      <p className="text-center text-[11px] text-[#7f8795]">
                        Invite can no longer be unsent
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.02] px-5 py-8 text-center">
              <p className="text-sm text-[#94a3b8]">
                No freelancers have been linked to this proposal yet.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
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
  const projectTitle = resolveProposalProjectName(normalizedProposal);
  const serviceLabel = resolveProposalServiceLabel(normalizedProposal);
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
    projectTitle,
    title: projectTitle || "Proposal",
    category: serviceLabel,
    service: serviceLabel,
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
    rejectionReason: normalizedProposal.rejectionReason || null,
    rejectionReasonKey: normalizedProposal.rejectionReasonKey || null,
  };
};

const mapLocalDraftProposal = (proposal) => {
  const normalizedProposal = normalizeProposalRecord(proposal);
  const projectTitle = resolveProposalProjectName(normalizedProposal);
  const serviceLabel = resolveProposalServiceLabel(normalizedProposal);

  return {
    id: normalizedProposal.id,
    projectTitle,
    title: projectTitle || "Proposal Draft",
    category: serviceLabel,
    service: serviceLabel,
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

const buildEditableProposalDraft = (proposal, clientNameFallback = "Client") => {
  if (!proposal) {
    return {
      title: "",
      businessName: "",
      clientName: clientNameFallback,
      service: "",
      budget: "",
      timeline: "",
      projectOverview: "",
      objectivesText: "",
      deliverablesText: "",
      techStackText: "",
      notes: "",
      content: "",
    };
  }

  const details = extractProposalDetails(proposal);
  const structuredDraft = buildProposalStructuredData(proposal, clientNameFallback);

  return {
    title: structuredDraft.title,
    businessName: structuredDraft.businessName,
    clientName: structuredDraft.clientName,
    service: structuredDraft.service,
    budget:
      proposal?.budget !== undefined && proposal?.budget !== null
        ? String(proposal.budget)
        : details.budget === "Not set"
          ? ""
          : String(details.budget),
    timeline:
      structuredDraft.timeline ||
      (details.delivery === "Not set" ? "" : details.delivery),
    projectOverview: structuredDraft.projectOverview,
    objectivesText: structuredDraft.objectivesText,
    deliverablesText: structuredDraft.deliverablesText,
    techStackText: structuredDraft.techStackText,
    notes: structuredDraft.notes,
    content: proposal?.content || structuredDraft.content || "",
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
  const [isSavingProposal, setIsSavingProposal] = useState(false);
  const [editableProposalDraft, setEditableProposalDraft] = useState(() =>
    buildEditableProposalDraft(null),
  );
  const [processingPaymentProposalId, setProcessingPaymentProposalId] =
    useState(null);
  const [sendingProposalId, setSendingProposalId] = useState(null);
  const [sendingFreelancerId, setSendingFreelancerId] = useState(null);
  const [unsendingProposalId, setUnsendingProposalId] = useState(null);
  const [hasHandledDeepLink, setHasHandledDeepLink] = useState(false);
  const [showFreelancerSelect, setShowFreelancerSelect] = useState(false);
  const [showFreelancerProfile, setShowFreelancerProfile] = useState(false);
  const [viewingFreelancer, setViewingFreelancer] = useState(null);
  const [freelancerDetailsProposal, setFreelancerDetailsProposal] = useState(null);
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
        const proposalStatus = String(notification.data?.status || "").toUpperCase();
        if (proposalStatus === "ACCEPTED" && notification.data?.projectId) {
          navigate("/client/project");
          return;
        }

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
    if (deepLinkProjectId) return;
    const validTabs = new Set(["draft", "pending", "rejected"]);
    if (validTabs.has(deepLinkTab)) {
      setActiveTab(deepLinkTab);
    }
  }, [deepLinkTab, deepLinkProjectId]);

  useEffect(() => {
    setEditableProposalDraft(buildEditableProposalDraft(activeProposal, getDisplayName(user)));
    setIsEditingProposal(false);
  }, [activeProposal, user]);

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

  const handleOpenFreelancerDetails = useCallback((proposal) => {
    if (!proposal) return;
    setFreelancerDetailsProposal(proposal);
  }, []);

  const handleUnsendProposalFromFreelancer = useCallback(
    async (invitee) => {
      if (!invitee?.proposalId) {
        toast.error("This proposal cannot be unsent right now.");
        return;
      }

      setUnsendingProposalId(invitee.proposalId);

      try {
        const response = await authFetch(`/proposals/${invitee.proposalId}`, {
          method: "DELETE",
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.message || "Unable to unsend proposal.");
        }

        if (activeProposal?.id === invitee.proposalId) {
          setActiveProposal(null);
          setIsViewing(false);
        }

        setFreelancerDetailsProposal(null);
        toast.success(`Proposal unsent from ${invitee.name || "freelancer"}.`);
        await fetchProposals();
      } catch (error) {
        console.error("Failed to unsend proposal:", error);
        toast.error(error?.message || "Unable to unsend proposal right now.");
      } finally {
        setUnsendingProposalId(null);
      }
    },
    [activeProposal?.id, authFetch, fetchProposals],
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

  const handleSaveProposalChanges = useCallback(async () => {
    if (!activeProposal || isSavingProposal) return;

    const clientNameFallback = getDisplayName(user);
    const nextTitle = String(editableProposalDraft.title || "").trim();
    const nextBusinessName = String(editableProposalDraft.businessName || "").trim();
    const nextClientName =
      String(editableProposalDraft.clientName || "").trim() || clientNameFallback;
    const nextService = String(editableProposalDraft.service || "").trim();
    const nextBudget = String(editableProposalDraft.budget || "").trim();
    const nextTimeline = String(editableProposalDraft.timeline || "").trim();
    const nextProjectOverview = String(editableProposalDraft.projectOverview || "").trim();
    const nextObjectives = parseProposalEditableList(editableProposalDraft.objectivesText);
    const nextDeliverables = parseProposalEditableList(editableProposalDraft.deliverablesText);
    const nextTechStack = parseProposalEditableList(editableProposalDraft.techStackText, {
      splitCommas: true,
    });
    const nextNotes = String(editableProposalDraft.notes || "").trim();
    const nextContent = buildProposalContentFromDraft({
      ...editableProposalDraft,
      clientName: nextClientName,
    });

    if (!nextTitle) {
      toast.error("Proposal title cannot be empty.");
      return;
    }

    if (!nextProjectOverview && !nextObjectives.length && !nextDeliverables.length) {
      toast.error("Add an overview, objectives, or deliverables before saving.");
      return;
    }

    setIsSavingProposal(true);

    try {
      const now = new Date().toISOString();
      const storageKeys = getProposalStorageKeys(user?.id);
      const { proposals: savedProposals, activeId } = loadSavedProposalsFromStorage(user?.id);
      const draftGroupKey = getProposalDraftGroupKey(activeProposal);
      const nextProposalContext = buildUpdatedProposalContext(
        activeProposal.proposalContext,
        {
          ...editableProposalDraft,
          clientName: nextClientName,
        },
        clientNameFallback,
      );
      const localDraftPayload = {
        id:
          activeProposal.isLocalDraft
            ? activeProposal.id
            : `saved-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        ownerId: user?.id || null,
        projectTitle: nextTitle,
        title: nextTitle,
        businessName: nextBusinessName,
        clientName: nextClientName,
        service: nextService || resolveProposalServiceLabel(activeProposal),
        serviceKey:
          nextService || activeProposal.serviceKey || resolveProposalServiceLabel(activeProposal),
        summary: nextContent,
        content: nextContent,
        proposalContent: nextContent,
        projectOverview: nextProjectOverview,
        objectives: nextObjectives,
        deliverables: nextDeliverables,
        techStack: nextTechStack,
        notes: nextNotes,
        budget: nextBudget,
        timeline: nextTimeline,
        recipientName: activeProposal.recipientName || "Not assigned",
        recipientId: activeProposal.recipientId || "LOCAL_DRAFT",
        freelancerId: activeProposal.freelancerId || null,
        avatar: activeProposal.avatar || "",
        projectId: activeProposal.projectId || activeProposal.syncedProjectId || null,
        syncedProjectId: activeProposal.syncedProjectId || activeProposal.projectId || null,
        syncedAt: activeProposal.syncedAt || null,
        proposalContext: nextProposalContext,
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
        let didReplaceDraft = false;

        const next = current.map((entry) => {
          const isSameDraft =
            getProposalDraftGroupKey(entry) === draftGroupKey &&
            (entry.isLocalDraft || entry.status === "draft");

          if (!isSameDraft) return entry;

          didReplaceDraft = true;
          return {
            ...entry,
            ...mappedLocalDraft,
          };
        });

        if (!didReplaceDraft) {
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

      const linkedProjectId =
        activeProposal?.syncedProjectId || activeProposal?.projectId || null;
      const nextBudgetValue = parseProposalBudgetValue(nextBudget);
      const syncTasks = [];

      if (linkedProjectId) {
        syncTasks.push(
          (async () => {
            const response = await authFetch(`/projects/${linkedProjectId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: nextTitle,
                description: nextContent,
                proposalContent: nextContent,
                ...(nextBudget ? { budget: nextBudgetValue } : {}),
                serviceKey:
                  activeProposal.serviceKey || resolveProposalServiceLabel(activeProposal),
              }),
            });
            const payload = await response.json().catch(() => null);
            if (!response.ok) {
              throw new Error(payload?.message || "Failed to sync project details.");
            }
            return payload?.data || null;
          })(),
        );
      }

      if (!activeProposal?.isLocalDraft && activeProposal?.id) {
        syncTasks.push(
          (async () => {
            const response = await authFetch(`/proposals/${activeProposal.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                coverLetter: nextContent,
                ...(nextBudget ? { amount: nextBudgetValue } : {}),
              }),
            });
            const payload = await response.json().catch(() => null);
            if (!response.ok) {
              throw new Error(payload?.message || "Failed to sync proposal details.");
            }
            return payload?.data ? mapApiProposal(payload.data) : null;
          })(),
        );
      }

      let hasSyncFailure = false;
      if (syncTasks.length > 0) {
        const syncResults = await Promise.allSettled(syncTasks);
        hasSyncFailure = syncResults.some((result) => result.status === "rejected");
      }

      setIsEditingProposal(false);
      await fetchProposals();

      if (hasSyncFailure) {
        toast.error("Proposal saved locally, but some database updates failed.");
        return;
      }

      toast.success("Proposal updated.");
    } catch (error) {
      console.error("Failed to save proposal changes:", error);
      toast.error(error?.message || "Failed to save proposal changes.");
    } finally {
      setIsSavingProposal(false);
    }
  }, [activeProposal, authFetch, editableProposalDraft, fetchProposals, isSavingProposal, user]);

  const sendProposalToFreelancer = useCallback(
    async (freelancer) => {
      const proposal = selectedProposalForSend;
      if (!proposal || !freelancer) return;

      setSendingProposalId(proposal.id);
      setSendingFreelancerId(freelancer.id);

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
              proposalContent:
                proposal.proposalContent
                || proposal.content
                || proposal.summary
                || "",
              budget: normalizedBudget,
              timeline: proposal.timeline || "1 month",
              serviceKey:
                proposal.serviceKey || resolveProposalServiceLabel(proposal),
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
              proposalContent:
                proposal.proposalContent
                || proposal.content
                || proposal.summary
                || "",
              budget: normalizedBudget,
              timeline: proposal.timeline || "1 month",
              serviceKey:
                proposal.serviceKey || resolveProposalServiceLabel(proposal),
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
        setSendingFreelancerId(null);
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
      const pendingIndexes = new Map();
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

      const pushPendingOnce = (proposal) => {
        const draftKey = getProposalDraftGroupKey(proposal);
        const sentFreelancers = sentFreelancersByDraftKey.get(draftKey) || [];
        const hasPendingInvite = sentFreelancers.some(
          (invitee) => String(invitee?.status || "").toLowerCase() === "pending",
        );
        const nextPending =
          sentFreelancers.length > 0
            ? {
                ...proposal,
                sentFreelancers,
                status: hasPendingInvite ? "pending" : proposal.status,
                isGroupedPending: sentFreelancers.length > 1,
              }
            : proposal;

        if (pendingIndexes.has(draftKey)) {
          const currentIndex = pendingIndexes.get(draftKey);
          const currentProposal = groupedBuckets.pending[currentIndex];
          const mergedInvitees = mergeInviteeCollections(
            currentProposal?.sentFreelancers,
            nextPending.sentFreelancers,
          );
          const status =
            currentProposal?.status === "pending" || nextPending.status === "pending"
              ? "pending"
              : currentProposal?.status || nextPending.status;

          groupedBuckets.pending[currentIndex] = {
            ...(currentProposal?.status === "pending" ? currentProposal : nextPending),
            sentFreelancers: mergedInvitees,
            status,
            isGroupedPending: mergedInvitees.length > 1,
          };
          return;
        }

        pendingIndexes.set(draftKey, groupedBuckets.pending.length);
        groupedBuckets.pending.push(nextPending);
      };

      scopedProposals.forEach((proposal) => {
        const projectKey = proposal.projectId ? String(proposal.projectId) : null;
        const hasAcceptedProposal = projectKey
          ? acceptedProjectKeys.has(projectKey)
          : false;

        if (proposal.status === "accepted") {
          return;
        }

        if (proposal.status === "draft") {
          if (!hasAcceptedProposal) {
            pushDraftOnce(proposal, { preferSavedDraft: true });
          }
          return;
        }

        if (proposal.status === "rejected") {
          if (!shouldHideRejectedProposal(proposal)) {
            groupedBuckets.rejected.push(proposal);
          }
          return;
        }

        pushPendingOnce(proposal);

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
    const skillMatched = projectRequiredSkills.length
      ? normalized.filter((freelancer) => {
          const freelancerSkillTokens = collectFreelancerSkillTokens(freelancer);
          return projectRequiredSkills.some((requiredSkill) =>
            freelancerMatchesRequiredSkill(requiredSkill, freelancerSkillTokens),
          );
        })
      : normalized;

    const matched =
      projectRequiredSkills.length && skillMatched.length >= 3
        ? skillMatched
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
  const activeProposalStructuredData = activeProposal
    ? buildProposalStructuredData(activeProposal, headerDisplayName)
    : null;
  const canEditActiveProposal = useMemo(() => {
    const normalizedStatus = normalizeProposalStatus(activeProposal?.status || "");
    return (
      Boolean(activeProposal) &&
      !activeProposal?.requiresPayment &&
      (normalizedStatus === "draft" || normalizedStatus === "pending" || normalizedStatus === "sent")
    );
  }, [activeProposal]);
  const proposalModalTitle = useMemo(() => {
    const baseTitle = resolveProposalTitle(activeProposal) || "Proposal";
    if (!isEditingProposal) return baseTitle;
    return String(editableProposalDraft.title || "").trim() || baseTitle;
  }, [activeProposal, editableProposalDraft.title, isEditingProposal]);
  const handleCancelProposalEditing = useCallback(() => {
    if (!activeProposal) {
      setIsEditingProposal(false);
      return;
    }

    setEditableProposalDraft(buildEditableProposalDraft(activeProposal, headerDisplayName));
    setIsEditingProposal(false);
  }, [activeProposal, headerDisplayName]);

  return (
    <div className="min-h-screen bg-background text-[#f1f5f9]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1536px] flex-col px-4 sm:px-6 lg:px-[40px] xl:w-[85%] xl:max-w-none">
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
          <Tabs
            defaultValue="draft"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full space-y-8"
          >
            <ClientPageHeader
              title="Project Proposals"
              description="Manage your draft, pending, and rejected proposals. Keep your potential collaborations moving."
              actions={
                <TabsList className="inline-flex h-auto w-full max-w-[24rem] flex-nowrap items-stretch justify-between gap-1 rounded-[32px] border border-border bg-background p-1 shadow-none sm:w-auto sm:max-w-none sm:gap-2 sm:p-1.5">
                  {[
                    { value: "draft", label: "Draft" },
                    { value: "pending", label: "Pending Approval" },
                    { value: "rejected", label: "Rejected" },
                  ].map((item) => (
                    <TabsTrigger
                      key={item.value}
                      value={item.value}
                      className={cn(
                        "h-10 min-w-[4.75rem] flex-none rounded-full border border-transparent text-center text-[0.72rem] font-semibold text-muted-foreground shadow-none transition hover:text-foreground sm:h-11 sm:min-w-0 sm:flex-none sm:px-5 sm:text-[0.95rem] sm:leading-normal sm:tracking-normal sm:whitespace-nowrap data-[state=active]:!border-primary/70 data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:!shadow-none",
                        item.value === "pending"
                          ? "max-w-[6.5rem] whitespace-normal px-2 py-1 leading-[1.02] tracking-[-0.01em] sm:max-w-none sm:py-0"
                          : "whitespace-nowrap px-4 leading-none tracking-[-0.01em]",
                      )}
                    >
                      {item.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              }
            />

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
                      onViewFreelancers={handleOpenFreelancerDetails}
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
                      onViewFreelancers={handleOpenFreelancerDetails}
                      isPaying={processingPaymentProposalId === proposal.id}
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
                      onViewFreelancers={handleOpenFreelancerDetails}
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
          </Tabs>

        </main>

        <ClientDashboardFooter variant="workspace" />
      </div>

      <ProposalFreelancerDetailsDialog
        proposal={freelancerDetailsProposal}
        open={Boolean(freelancerDetailsProposal)}
        onOpenChange={(open) => {
          if (!open) setFreelancerDetailsProposal(null);
        }}
        onUnsend={handleUnsendProposalFromFreelancer}
        unsendingProposalId={unsendingProposalId}
      />

      <Dialog
        open={isViewing && Boolean(activeProposal)}
        onOpenChange={(open) => {
          setIsViewing(open);
          if (!open) {
            setIsEditingProposal(false);
            setActiveProposal(null);
          }
        }}
      >
        <DialogContent className="flex max-h-[92vh] w-[min(92vw,820px)] flex-col overflow-hidden border border-border/60 bg-accent p-0 sm:max-w-[820px] [&>button]:right-5 [&>button]:top-5 [&>button]:z-10 [&>button]:rounded-full [&>button]:border [&>button]:border-white/10 [&>button]:bg-background/60 [&>button]:p-1.5 [&>button]:opacity-100 [&>button]:transition-colors [&>button:hover]:bg-background/80 [&>button:hover]:text-white [&>button_svg]:h-4 [&>button_svg]:w-4">
          <div className="shrink-0 border-b border-white/10 px-6 py-5">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <DialogTitle className="text-2xl font-semibold tracking-tight text-foreground">
                      {proposalModalTitle}
                    </DialogTitle>
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

                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <Badge
                      variant="outline"
                      className="h-9 w-fit rounded-full border-white/10 bg-background/40 px-3.5 text-[#a6adbb]"
                    >
                      {activeProposal?.submittedDate || "No date"}
                    </Badge>
                    <span className="text-xs uppercase tracking-[0.18em] text-[#64748b]">
                      Last updated
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pr-10 sm:justify-end sm:pr-12">
                  {canEditActiveProposal ? (
                    isEditingProposal ? (
                      <>
                        <Button
                          variant="outline"
                          className="h-11 rounded-full border-white/10 bg-background/30 px-5 text-white hover:bg-background/50"
                          onClick={handleCancelProposalEditing}
                          disabled={isSavingProposal}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="h-11 rounded-full bg-primary px-5 text-[#141414] hover:bg-primary/90"
                          onClick={handleSaveProposalChanges}
                          disabled={isSavingProposal}
                        >
                          {isSavingProposal ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          {isSavingProposal ? "Saving..." : "Save Changes"}
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        className="h-11 rounded-full border-primary/25 bg-primary/10 px-5 text-primary hover:bg-primary/15"
                        onClick={() => setIsEditingProposal(true)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Proposal
                      </Button>
                    )
                  ) : null}
                </div>
              </div>

              <DialogDescription className="max-w-2xl text-sm leading-6 text-muted-foreground">
                {activeProposal?.status === "draft"
                  ? "Review the draft, polish the scope, and send it to the right freelancer."
                  : canEditActiveProposal
                    ? "Review the proposal details and update the scope while the freelancer decision is still pending."
                    : "Review the proposal details, payment status, and delivery expectations."}
              </DialogDescription>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 [scrollbar-color:rgba(255,255,255,0.18)_transparent] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-2">
            <div className="space-y-8 pb-2">
              <section className="space-y-3">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#64748b]">
                    01 Project Summary
                  </p>
                  <h3 className="text-lg font-semibold tracking-tight text-white">
                    Start with the essentials
                  </h3>
                  <p className="text-sm leading-6 text-[#94a3b8]">
                    Review the project name, client details, service, and budget before diving
                    into the full scope.
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <ProposalMetric
                    icon={FileText}
                    label="Project Name"
                    value={
                      isEditingProposal ? (
                        <Input
                          value={editableProposalDraft.title}
                          onChange={(event) =>
                            handleEditableProposalDraftChange("title", event.target.value)
                          }
                          className="h-11 border-white/10 bg-background/60 text-white placeholder:text-[#6f7785] focus-visible:border-[#ffc107]/45 focus-visible:ring-[#ffc107]/20"
                          placeholder="Project name"
                        />
                      ) : (
                        resolveProposalTitle(activeProposal) || "Not set"
                      )
                    }
                  />
                  <ProposalMetric
                    icon={UserRound}
                    label="Client Name"
                    value={
                      isEditingProposal ? (
                        <Input
                          value={editableProposalDraft.clientName}
                          onChange={(event) =>
                            handleEditableProposalDraftChange("clientName", event.target.value)
                          }
                          className="h-11 border-white/10 bg-background/60 text-white placeholder:text-[#6f7785] focus-visible:border-[#ffc107]/45 focus-visible:ring-[#ffc107]/20"
                          placeholder="Client name"
                        />
                      ) : (
                        activeProposalStructuredData?.clientName || headerDisplayName
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
                          className="h-11 border-white/10 bg-background/60 text-white placeholder:text-[#6f7785] focus-visible:border-[#ffc107]/45 focus-visible:ring-[#ffc107]/20"
                          placeholder="Service"
                        />
                      ) : (
                        resolveProposalServiceLabel(activeProposal)
                      )
                    }
                  />
                  <ProposalMetric
                    icon={CreditCard}
                    label="Budget"
                    value={
                      isEditingProposal ? (
                        <Input
                          value={editableProposalDraft.budget}
                          onChange={(event) =>
                            handleEditableProposalDraftChange("budget", event.target.value)
                          }
                          className="h-11 border-white/10 bg-background/60 text-white placeholder:text-[#6f7785] focus-visible:border-[#ffc107]/45 focus-visible:ring-[#ffc107]/20"
                          placeholder="e.g. 40000"
                        />
                      ) : (
                        activeProposalDetails?.budget || "Not set"
                      )
                    }
                  />
                </div>
              </section>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.95fr)]">
                <section className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#64748b]">
                      02 Project Scope
                    </p>
                    <h3 className="text-lg font-semibold tracking-tight text-white">
                      What the project includes
                    </h3>
                  </div>
                  <ProposalSectionCard
                    title="Project Overview"
                    description="A clean summary of the project direction and business context."
                  >
                    {isLoadingProposal ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading details...
                      </div>
                    ) : isEditingProposal ? (
                      <Textarea
                        value={editableProposalDraft.projectOverview}
                        onChange={(event) =>
                          handleEditableProposalDraftChange("projectOverview", event.target.value)
                        }
                        className="min-h-[180px] border-white/10 bg-background/60 text-white placeholder:text-[#6f7785] focus-visible:border-[#ffc107]/45 focus-visible:ring-[#ffc107]/20"
                        placeholder="Summarize the project, business context, and intended outcome."
                      />
                    ) : (
                      <p className="text-sm leading-7 text-white">
                        {activeProposalStructuredData?.projectOverview || "No overview added yet."}
                      </p>
                    )}
                  </ProposalSectionCard>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <ProposalSectionCard
                      title="Primary Objectives"
                      description="Key goals this proposal is meant to deliver."
                      className="h-full"
                    >
                      {isEditingProposal ? (
                        <Textarea
                          value={editableProposalDraft.objectivesText}
                          onChange={(event) =>
                            handleEditableProposalDraftChange("objectivesText", event.target.value)
                          }
                          className="min-h-[220px] border-white/10 bg-background/60 text-white placeholder:text-[#6f7785] focus-visible:border-[#ffc107]/45 focus-visible:ring-[#ffc107]/20"
                          placeholder={"One objective per line\nExample: Launch MVP for internal testing"}
                        />
                      ) : (
                        <ProposalStructuredList
                          items={activeProposalStructuredData?.objectives || []}
                          emptyMessage="No objectives added yet."
                        />
                      )}
                    </ProposalSectionCard>

                    <ProposalSectionCard
                      title="Deliverables"
                      description="The concrete scope and outputs expected from this proposal."
                      className="h-full"
                    >
                      {isEditingProposal ? (
                        <Textarea
                          value={editableProposalDraft.deliverablesText}
                          onChange={(event) =>
                            handleEditableProposalDraftChange("deliverablesText", event.target.value)
                          }
                          className="min-h-[220px] border-white/10 bg-background/60 text-white placeholder:text-[#6f7785] focus-visible:border-[#ffc107]/45 focus-visible:ring-[#ffc107]/20"
                          placeholder={"One deliverable per line\nExample: Admin dashboard with analytics"}
                        />
                      ) : (
                        <ProposalStructuredList
                          items={activeProposalStructuredData?.deliverables || []}
                          emptyMessage="No deliverables added yet."
                        />
                      )}
                    </ProposalSectionCard>
                  </div>
                </section>

                <section className="space-y-4 xl:sticky xl:top-0">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#64748b]">
                      03 Technical And Delivery
                    </p>
                    <h3 className="text-lg font-semibold tracking-tight text-white">
                      Supporting details
                    </h3>
                  </div>
                  <ProposalSectionCard
                    title={isEditingProposal ? "Delivery Details" : "Project Details"}
                    description={
                      isEditingProposal
                        ? "Update the timeline and review the current proposal status."
                        : "Keep track of the delivery window and proposal state."
                    }
                  >
                    {isEditingProposal ? (
                      <div className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2 sm:col-span-2">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                              Timeline
                            </p>
                            <Input
                              value={editableProposalDraft.timeline}
                              onChange={(event) =>
                                handleEditableProposalDraftChange("timeline", event.target.value)
                              }
                              className="h-11 border-white/10 bg-background/60 text-white placeholder:text-[#6f7785] focus-visible:border-[#ffc107]/45 focus-visible:ring-[#ffc107]/20"
                              placeholder="e.g. 3+ months"
                            />
                          </div>
                        </div>
                        <div className="grid gap-4 border-t border-white/8 pt-4 sm:grid-cols-2">
                          <ProposalSummaryItem
                            label="Current Status"
                            value={activeProposalDetails?.statusDisplay || "Draft"}
                          />
                          <ProposalSummaryItem
                            label="Last Updated"
                            value={activeProposal?.submittedDate || "No date"}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                        <ProposalSummaryItem
                          label="Project Name"
                          value={resolveProposalTitle(activeProposal) || "Not set"}
                        />
                        <ProposalSummaryItem
                          label="Timeline"
                          value={activeProposalDetails?.delivery || "Not set"}
                        />
                        <ProposalSummaryItem
                          label="Current Status"
                          value={activeProposalDetails?.statusDisplay || "Draft"}
                        />
                        <ProposalSummaryItem
                          label="Last Updated"
                          value={activeProposal?.submittedDate || "No date"}
                        />
                      </div>
                    )}
                  </ProposalSectionCard>

                  <ProposalSectionCard
                    title="Tech Stack"
                    description="Preferred platforms, frameworks, and tools."
                  >
                    {isEditingProposal ? (
                      <Textarea
                        value={editableProposalDraft.techStackText}
                        onChange={(event) =>
                          handleEditableProposalDraftChange("techStackText", event.target.value)
                        }
                        className="min-h-[160px] border-white/10 bg-background/60 text-white placeholder:text-[#6f7785] focus-visible:border-[#ffc107]/45 focus-visible:ring-[#ffc107]/20"
                        placeholder={"One technology per line\nExample: Next.js"}
                      />
                    ) : Array.isArray(activeProposalStructuredData?.techStack) &&
                      activeProposalStructuredData.techStack.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {activeProposalStructuredData.techStack.map((item) => (
                          <Badge
                            key={item}
                            variant="outline"
                            className="rounded-full border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
                          >
                            {item}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm leading-6 text-[#94a3b8]">
                        No tech stack added yet.
                      </p>
                    )}
                  </ProposalSectionCard>

                  <ProposalSectionCard
                    title="Delivery Notes"
                    description="Extra constraints, assumptions, or handover expectations."
                  >
                    {isEditingProposal ? (
                      <Textarea
                        value={editableProposalDraft.notes}
                        onChange={(event) =>
                          handleEditableProposalDraftChange("notes", event.target.value)
                        }
                        className="min-h-[180px] border-white/10 bg-background/60 text-white placeholder:text-[#6f7785] focus-visible:border-[#ffc107]/45 focus-visible:ring-[#ffc107]/20"
                        placeholder="Add any assumptions, dependencies, or special notes."
                      />
                    ) : (
                      <p className="text-sm leading-7 text-white">
                        {activeProposalStructuredData?.notes || "No delivery notes added yet."}
                      </p>
                    )}
                  </ProposalSectionCard>
                </section>
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 flex flex-col gap-4 border-t border-white/10 bg-accent/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-6 text-muted-foreground">
              Use the action buttons to continue the proposal lifecycle from here.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {activeProposal?.status === "draft" && !activeProposal?.requiresPayment ? (
                <Button
                  variant="outline"
                  className="h-11 rounded-full border-primary/25 bg-primary/10 px-5 text-primary hover:bg-primary/15"
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

              {activeProposal &&
              !activeProposal.requiresPayment &&
              !activeProposal.isGroupedPending ? (
                <Button
                  variant="ghost"
                  className="h-11 rounded-full px-3 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-300"
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
        isSendingProposal={
          sendingProposalId === (proposalForFreelancerSelection?.id ?? null)
        }
        sendingFreelancerId={sendingFreelancerId}
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
