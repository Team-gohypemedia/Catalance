"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Send from "lucide-react/dist/esm/icons/send";
import Zap from "lucide-react/dist/esm/icons/zap";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Eye from "lucide-react/dist/esm/icons/eye";
import Plus from "lucide-react/dist/esm/icons/plus";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Edit2 from "lucide-react/dist/esm/icons/edit-2";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getSession } from "@/shared/lib/auth-storage";
import { rankFreelancersForProposal } from "@/shared/lib/freelancer-matching";
import { extractLabeledLineValue } from "@/shared/lib/labeled-fields";
import {
  listFreelancers,
  fetchChatConversations,
} from "@/shared/lib/api-client";
import { processProjectInstallmentPayment } from "@/shared/lib/project-payment";
import { formatINR, INR_PREFIX_PATTERN, normalizeINRText } from "@/shared/lib/currency";
import { isFreelancerOpenToWork } from "@/shared/lib/freelancer-availability";
import {
  getProposalStorageKeys,
  migrateProposalStorageNamespace,
} from "@/shared/lib/storage-keys";
import { toast } from "sonner";
import { useAuth } from "@/shared/context/AuthContext";
import { useNotifications } from "@/shared/context/NotificationContext";
import { SuspensionAlert } from "@/components/ui/suspension-alert";
import BookAppointment from "@/components/features/appointments/BookAppointment";
import ClientDashboardShell from "@/components/features/client/dashboard/ClientDashboardShell";
import {
  buildProjectCardModel,
  normalizeClientProjects,
} from "@/components/features/client/ClientProjects";
import { ClientTopBar } from "@/components/features/client/ClientTopBar";
import EditProposalDialog from "@/components/features/client/dashboard/EditProposalDialog";
import FreelancerProfileDialog from "@/components/features/client/dashboard/FreelancerProfileDialog";
import FreelancerSelectionDialog from "@/components/features/client/dashboard/FreelancerSelectionDialog";
import ViewProposalDialog from "@/components/features/client/dashboard/ViewProposalDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getSopFromTitle } from "@/shared/data/sopTemplates";
const MIN_FREELANCER_MATCH_SCORE = 50;
const PROPOSAL_BLOCKED_STATUSES = new Set(["PENDING", "ACCEPTED"]);
const CLOSED_PROJECT_STATUSES = new Set(["COMPLETED", "PAUSED"]);
const PROPOSAL_BUDGET_PATTERN = new RegExp(
  String.raw`Budget[:\s\-\n\u2022]*${INR_PREFIX_PATTERN.source}?\s*([\d,]+)\s*(k)?`,
  "i",
);
const STORED_BUDGET_LINE_PATTERN = new RegExp(
  String.raw`Budget[\s\n]*[-:]*[\s\n]*${INR_PREFIX_PATTERN.source}?\s*[\d,]+\s*(?:k)?`,
  "gi",
);

const buildLocalProposalId = () =>
  `saved-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeComparableText = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replace(/[_/\\-]+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const resolveProposalServiceValue = (proposal = {}) =>
  proposal.serviceKey ||
  proposal.service ||
  proposal.serviceName ||
  proposal.category ||
  proposal.project?.serviceKey ||
  proposal.project?.service ||
  proposal.project?.serviceName ||
  "";

const stripServiceNameFromStorageTitle = (projectTitle = "", serviceLabel = "") => {
  const normalizedProjectTitle = String(projectTitle || "").trim();
  const normalizedServiceLabel = String(serviceLabel || "").trim();

  if (!normalizedProjectTitle) return "";
  if (!normalizedServiceLabel) return normalizedProjectTitle;

  const titleParts = normalizedProjectTitle
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);

  if (titleParts.length === 2) {
    const normalizedService = normalizeComparableText(normalizedServiceLabel);

    if (normalizeComparableText(titleParts[0]) === normalizedService) {
      return titleParts[1];
    }

    if (normalizeComparableText(titleParts[1]) === normalizedService) {
      return titleParts[0];
    }
  }

  return normalizedProjectTitle;
};

const resolveProposalStorageTitle = (proposal = {}) => {
  const rawTitle =
    proposal.projectTitle ||
    proposal.title ||
    proposal.project?.title ||
    proposal.project?.name ||
    "";
  const serviceValue = resolveProposalServiceValue(proposal);

  return stripServiceNameFromStorageTitle(rawTitle, serviceValue) || rawTitle;
};

const resolveProposalProjectLink = (proposal = {}) =>
  String(
    proposal.syncedProjectId || proposal.projectId || proposal.project?.id || "",
  ).trim();

const mergeSavedProposalRecords = (current = {}, incoming = {}) => {
  const currentTimestamp = new Date(
    current.updatedAt || current.createdAt || 0,
  ).getTime();
  const incomingTimestamp = new Date(
    incoming.updatedAt || incoming.createdAt || 0,
  ).getTime();
  const preferIncoming = incomingTimestamp >= currentTimestamp;
  const preferred = preferIncoming ? incoming : current;
  const fallback = preferIncoming ? current : incoming;

  return {
    ...fallback,
    ...preferred,
    id: current.id || incoming.id || buildLocalProposalId(),
  };
};

const getProposalSignature = (proposal = {}) => {
  const title = normalizeComparableText(resolveProposalStorageTitle(proposal));
  const service = normalizeComparableText(resolveProposalServiceValue(proposal));
  const summary = normalizeComparableText(
    proposal.summary || proposal.content || proposal.description || "",
  );
  if (!title && !service) {
    return `${title}::${service}::${summary.slice(0, 160)}`;
  }
  return `${title}::${service}`;
};

const normalizeSavedProposal = (proposal = {}) => {
  const next = { ...proposal };
  if (!next.id) {
    next.id = next.localId || buildLocalProposalId();
  }

  if (typeof next.content === "string") {
    next.content = normalizeINRText(next.content);
  }
  if (typeof next.summary === "string") {
    next.summary = normalizeINRText(next.summary);
  }
  if (typeof next.budget === "string") {
    next.budget = normalizeINRText(next.budget);
  }

  const text = next.content || next.summary || "";
  if (text) {
    const extractedTimeline = extractLabeledLineValue(text, [
      "Timeline",
      "Launch Timeline",
    ]);
    if (extractedTimeline) {
      next.timeline = extractedTimeline
        .trim()
        .replace(/\(with buffer\)/gi, "")
        .trim();
    }
  }

  const hasExplicitBudget =
    next.budget !== undefined &&
    next.budget !== null &&
    String(next.budget).trim() !== "";

  // Only derive budget from text when an explicit value is missing.
  if (!hasExplicitBudget && text) {
    const budgetMatch = text.match(PROPOSAL_BUDGET_PATTERN);
    if (budgetMatch) {
      let budgetValue = parseFloat(budgetMatch[1].replace(/,/g, ""));
      if (budgetMatch[2] && /k/i.test(budgetMatch[2])) {
        budgetValue = budgetValue * 1000;
      }
      next.budget = String(budgetValue);
    }
  }
  return next;
};

const getProposalDedupKeys = (proposal = {}) => {
  const keys = [];
  const linkedProjectId = resolveProposalProjectLink(proposal);
  const signature = getProposalSignature(proposal);
  const summaryKey = normalizeComparableText(
    proposal.summary || proposal.content || proposal.description || "",
  );
  const serviceKey = normalizeComparableText(resolveProposalServiceValue(proposal));
  const budgetKey = normalizeComparableText(
    proposal.budget || proposal.amount || proposal.project?.budget || "",
  );

  if (proposal.id) {
    keys.push(`id:${String(proposal.id).trim()}`);
  }

  if (linkedProjectId) {
    keys.push(`project:${linkedProjectId}`);
  }

  if (signature && signature !== "::") {
    keys.push(`signature:${signature}`);
  }

  if (summaryKey) {
    keys.push(`summary:${serviceKey}::${budgetKey}::${summaryKey.slice(0, 160)}`);
  }

  return keys;
};

const dedupeSavedProposals = (proposals = []) => {
  const deduped = [];
  const keyToIndex = new Map();

  proposals
    .map(normalizeSavedProposal)
    .forEach((proposal) => {
      const proposalKeys = getProposalDedupKeys(proposal);
      let existingIndex = -1;

      for (const key of proposalKeys) {
        const matchIndex = keyToIndex.get(key);
        if (typeof matchIndex === "number") {
          existingIndex = matchIndex;
          break;
        }
      }

      if (existingIndex === -1) {
        const nextIndex = deduped.length;
        deduped.push(proposal);
        proposalKeys.forEach((key) => keyToIndex.set(key, nextIndex));
        return;
      }

      const mergedProposal = mergeSavedProposalRecords(
        deduped[existingIndex],
        proposal,
      );
      deduped[existingIndex] = mergedProposal;
      getProposalDedupKeys(mergedProposal).forEach((key) =>
        keyToIndex.set(key, existingIndex),
      );
    });

  return deduped;
};

const resolveProposalTitle = (proposal) => {
  if (!proposal) return "Proposal";
  return (
    proposal.projectTitle ||
    proposal.title ||
    proposal.service ||
    proposal.serviceKey ||
    "Proposal"
  );
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

// Helper function to format budget in INR without relying on pasted symbols.
const formatBudget = (budget) => {
  if (!budget || budget === "Not set") return "Not set";

  const budgetStr = normalizeINRText(String(budget).trim());
  const hasKSuffix = /\d+\s*k$/i.test(budgetStr);
  const cleaned = budgetStr.replace(/[^\d.]/g, "");
  const numValue = parseFloat(cleaned);
  if (isNaN(numValue)) return budgetStr;

  const finalValue = hasKSuffix ? numValue * 1000 : numValue;
  return formatINR(finalValue);
};

const parseProposalBudgetValue = (budget) => {
  const normalizedBudget = normalizeINRText(String(budget || "").trim());
  if (!normalizedBudget) return 0;

  const hasKSuffix = /\d+\s*k$/i.test(normalizedBudget);
  const numericValue = parseFloat(normalizedBudget.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(numericValue)) return 0;

  return Math.round(hasKSuffix ? numericValue * 1000 : numericValue);
};

const stripProposalMarkdown = (value = "") =>
  String(value || "")
    .replace(/```markdown\n?/gi, "")
    .replace(/```\n?/g, "")
    .trim();

const uniqueProposalItems = (items = []) => {
  const seen = new Set();
  const result = [];
  items.forEach((item) => {
    const normalized = String(item || "").trim();
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(normalized);
  });
  return result;
};

const parseProposalSections = (proposal = {}) => {
  const rawContent = proposal?.summary || proposal?.content || "";
  const cleanContent = stripProposalMarkdown(rawContent);
  const lines = cleanContent.split("\n");
  let overview = "";
  const objectives = [];
  const features = [];
  let currentSection = "";

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const lowerLine = trimmed.toLowerCase();

    if (/project overview:|overview:|summary:/.test(lowerLine)) {
      currentSection = "overview";
      const value = trimmed.split(":").slice(1).join(":").trim();
      if (value) overview = value;
      return;
    }

    if (/primary objectives:|objectives:|goals:/.test(lowerLine)) {
      currentSection = "objectives";
      return;
    }

    if (/features|deliverables|scope/.test(lowerLine)) {
      currentSection = "features";
      return;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const item = trimmed.replace(/^[-*]\s+/, "").trim();
      if (!item) return;
      if (currentSection === "objectives") {
        objectives.push(item);
      } else if (currentSection === "features") {
        features.push(item);
      }
      return;
    }

    if (currentSection === "overview") {
      overview = overview ? `${overview} ${trimmed}` : trimmed;
    }
  });

  if (!overview && cleanContent) {
    overview = cleanContent.slice(0, 220);
  }

  return {
    cleanContent,
    overview: overview.trim(),
    objectives: uniqueProposalItems(objectives),
    features: uniqueProposalItems(features),
  };
};

const resolveProposalServiceLabel = (proposal = {}) =>
  proposal?.service ||
  proposal?.serviceName ||
  proposal?.serviceKey ||
  "General";

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

const resolveProposalBusinessName = (proposal = {}) => {
  const proposalContext =
    proposal?.proposalContext && typeof proposal.proposalContext === "object"
      ? proposal.proposalContext
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
    proposal?.businessName,
    proposal?.companyName,
    proposal?.project?.businessName,
    proposal?.project?.companyName,
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
    extractLabeledValue(proposal?.content || proposal?.summary || "", [
      "Business Name",
      "Company Name",
      "Brand Name",
    ]),
  );
};

const formatProposalUpdatedAt = (proposal = {}) => {
  const timestamp = proposal?.updatedAt || proposal?.createdAt;
  if (!timestamp) return "Recently";
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return "Recently";
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const normalizeFreelancerCardData = (candidate = {}) => {
  const freelancer = { ...candidate };
  const rawBio = freelancer.bio || freelancer.about;

  if (typeof rawBio === "string" && rawBio.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(rawBio);
      if (!freelancer.location && parsed.location) freelancer.location = parsed.location;
      if (!freelancer.role && parsed.role) freelancer.role = parsed.role;
      if (!freelancer.title && parsed.title) freelancer.role = parsed.title;
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
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return "N/A";
  return num.toFixed(1);
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

const normalizeSkillToken = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9#+.]/g, "");

const collectStringValues = (value) => {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectStringValues(item));
  }
  if (typeof value === "object") {
    return Object.values(value).flatMap((item) => collectStringValues(item));
  }
  if (typeof value === "string" || typeof value === "number") {
    return [String(value)];
  }
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
  const collected = [];
  const seen = new Set();

  const pushSkill = (rawValue) => {
    const value = String(rawValue || "").trim();
    if (!value || value.length < 2) return;
    const key = normalizeSkillToken(value);
    if (!key || seen.has(key)) return;
    seen.add(key);
    collected.push(value);
  };

  PROPOSAL_STACK_KEYS.forEach((key) => {
    collectStringValues(proposal?.[key]).forEach((entry) => {
      splitSkillValues(entry).forEach(pushSkill);
    });
  });

  if (collected.length > 0) {
    return collected.slice(0, 8);
  }

  const searchText = PROPOSAL_STACK_TEXT_KEYS.map((key) => proposal?.[key])
    .filter(Boolean)
    .join(" ");

  STACK_DETECTION_PATTERNS.forEach(({ label, pattern }) => {
    if (pattern.test(searchText)) {
      pushSkill(label);
    }
  });

  return collected.slice(0, 8);
};

const readSavedProposalsFromKeys = (listKey, singleKey) => {
  let proposals = [];
  const listRaw = window.localStorage.getItem(listKey);
  const singleRaw = window.localStorage.getItem(singleKey);

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
          (item) => getProposalSignature(item) === signature,
        );
        if (!exists) proposals = [...proposals, parsed];
      }
    } catch {
      // ignore parse errors
    }
  }

  const normalized = dedupeSavedProposals(proposals);
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

const mergeProposalsBySignature = (base = [], incoming = []) => {
  return dedupeSavedProposals([...base, ...incoming]);
};

const loadSavedProposalsFromStorage = (userId) => {
  if (typeof window === "undefined") return { proposals: [], activeId: null };

  migrateProposalStorageNamespace();
  if (userId) {
    migrateProposalStorageNamespace(userId);
  }

  const storageKeys = getProposalStorageKeys(userId);
  const legacyKeys = getProposalStorageKeys();

  let { proposals, activeId } = readSavedProposalsFromKeys(
    storageKeys.listKey,
    storageKeys.singleKey,
  );

  if (userId && legacyKeys.listKey !== storageKeys.listKey) {
    const legacy = readSavedProposalsFromKeys(
      legacyKeys.listKey,
      legacyKeys.singleKey,
    );
    if (legacy.proposals.length) {
      const legacyWithOwner = legacy.proposals.map((proposal) => ({
        ...proposal,
        ownerId: userId,
      }));
      const merged = mergeProposalsBySignature(proposals, legacyWithOwner);
      const nextActiveId = resolveActiveProposalId(
        merged,
        activeId,
        legacy.activeId,
      );
      persistSavedProposalsToStorage(merged, nextActiveId, storageKeys);
      window.localStorage.removeItem(legacyKeys.listKey);
      window.localStorage.removeItem(legacyKeys.singleKey);
      proposals = merged;
      activeId = nextActiveId;
    }
  }

  const dedupedProposals = dedupeSavedProposals(proposals);
  const nextActiveId = resolveActiveProposalId(
    dedupedProposals,
    activeId,
    null,
  );

  if (
    dedupedProposals.length !== proposals.length ||
    nextActiveId !== activeId
  ) {
    persistSavedProposalsToStorage(dedupedProposals, nextActiveId, storageKeys);
  }

  return { proposals: dedupedProposals, activeId: nextActiveId };
};

const persistSavedProposalsToStorage = (proposals, activeId, storageKeys) => {
  if (typeof window === "undefined") return;
  const keys = storageKeys || getProposalStorageKeys();
  if (!Array.isArray(proposals) || proposals.length === 0) {
    window.localStorage.removeItem(keys.listKey);
    window.localStorage.removeItem(keys.singleKey);
    return;
  }
  const normalized = dedupeSavedProposals(proposals);
  window.localStorage.setItem(keys.listKey, JSON.stringify(normalized));
  const active =
    normalized.find((proposal) => proposal.id === activeId) || normalized[0];
  if (active) {
    window.localStorage.setItem(keys.singleKey, JSON.stringify(active));
  }
};

const persistActiveProposalSelection = (proposals, activeId, storageKeys) => {
  if (typeof window === "undefined") return;
  const keys = storageKeys || getProposalStorageKeys();
  if (!Array.isArray(proposals) || proposals.length === 0) {
    window.localStorage.removeItem(keys.singleKey);
    return;
  }

  const active =
    proposals.find((proposal) => proposal.id === activeId) || proposals[0];
  if (active) {
    window.localStorage.setItem(keys.singleKey, JSON.stringify(active));
  }
};

const hasFreelancerRole = (user = {}) => {
  const primaryRole = String(user?.role || "").toUpperCase();
  const roles = Array.isArray(user?.roles)
    ? user.roles.map((entry) => String(entry || "").toUpperCase())
    : [];
  return primaryRole === "FREELANCER" || roles.includes("FREELANCER");
};

const isDraftProjectStatus = (status) =>
  String(status || "").toUpperCase() === "DRAFT";

const shouldHydrateProjectProposal = (project = {}) => {
  const status = String(project?.status || "").toUpperCase();
  if (CLOSED_PROJECT_STATUSES.has(status)) return false;
  return isDraftProjectStatus(status);
};

const mapProjectToSavedProposal = (project = {}) =>
  normalizeSavedProposal({
    id: `project-${project.id}`,
    projectId: project.id,
    syncedProjectId: project.id,
    projectTitle: project.title || "Proposal",
    summary: project.description || "",
    content: project.description || "",
    budget: project.budget || "",
    timeline: project.timeline || "",
    createdAt: project.createdAt || new Date().toISOString(),
    updatedAt: project.updatedAt || project.createdAt || new Date().toISOString()
  });

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
    <Card className="relative overflow-hidden rounded-xl group hover:shadow-md transition-shadow border-border/60">
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
            className={`text-xs mt-2 flex items-center font-bold ${trendType === "up"
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
          <div className="mt-3 flex -space-x-2 overflow-hidden" />
        )}
      </CardContent>
    </Card>
  );
};

const TalentItem = ({ name, role, avatar, status = "online", onClick }) => {
  const statusColors = {
    online: "bg-green-500",
    away: "bg-yellow-500",
    offline: "bg-gray-300",
  };

  return (
    <li className="flex items-center gap-3 group cursor-pointer" onClick={onClick}>
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
        onClick={(event) => {
          event.stopPropagation();
          onClick && onClick();
        }}
      >
        <MessageCircle className="w-4 h-4" />
      </Button>
    </li>
  );
};

const DASHBOARD_APPOINTMENT_SLOTS = [
  "10:00 AM",
  "12:30 PM",
  "03:00 PM",
  "05:00 PM",
];

const formatDashboardDate = (
  value,
  options = { weekday: "long", month: "short", day: "numeric" },
) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return "Today";
  }

  return new Intl.DateTimeFormat("en-US", options).format(date);
};

const formatDashboardRelativeTime = (value) => {
  if (!value) return "Just now";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / (60 * 1000)));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return "Yesterday";
  }

  return `${diffDays}d ago`;
};

const RUNNING_PROJECT_PROGRESS_BY_STATUS = Object.freeze({
  DRAFT: 14,
  OPEN: 24,
  AWAITING_PAYMENT: 76,
  IN_PROGRESS: 45,
  COMPLETED: 100,
});

const getRunningProjectStatusMeta = (status) => {
  const normalizedStatus = String(status || "").toUpperCase();

  if (normalizedStatus === "COMPLETED") {
    return { label: "Completed", tone: "success" };
  }

  if (normalizedStatus === "IN_PROGRESS") {
    return { label: "In Progress", tone: "warning" };
  }

  if (normalizedStatus === "AWAITING_PAYMENT") {
    return { label: "Payment Due", tone: "warning" };
  }

  if (normalizedStatus === "OPEN") {
    return { label: "Open", tone: "slate" };
  }

  if (normalizedStatus === "DRAFT") {
    return { label: "Draft", tone: "slate" };
  }

  return {
    label:
      String(status || "Pending")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase()),
    tone: "slate",
  };
};

const resolveRunningProjectProgress = (project = {}) => {
  const explicitProgress = Number(project?.progress);
  if (Number.isFinite(explicitProgress) && explicitProgress > 0) {
    return Math.max(0, Math.min(100, Math.round(explicitProgress)));
  }

  const normalizedStatus = String(project?.status || "").toUpperCase();
  return RUNNING_PROJECT_PROGRESS_BY_STATUS[normalizedStatus] ?? 18;
};

const resolveRunningProjectDateMeta = (project = {}, acceptedProposal = null) => {
  const deadlineCandidates = [
    project?.deadline,
    project?.dueDate,
    project?.targetDate,
    acceptedProposal?.deadline,
  ];

  for (const candidate of deadlineCandidates) {
    if (!candidate) continue;
    const parsedDate = new Date(candidate);
    if (Number.isNaN(parsedDate.getTime())) continue;

    return {
      label: "Deadline",
      value: formatDashboardDate(parsedDate, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };
  }

  const timeline = String(project?.timeline || acceptedProposal?.timeline || "").trim();
  if (timeline) {
    return { label: "Timeline", value: timeline };
  }

  return { label: "Timeline", value: "To be finalized" };
};

const buildRunningProjectMilestones = ({
  status,
  hasAcceptedProposal = false,
  pendingCount = 0,
  hasPaymentDue = false,
}) => {
  const normalizedStatus = String(status || "").toUpperCase();

  if (normalizedStatus === "COMPLETED") {
    return [
      { label: "Proposal Accepted", state: "complete" },
      { label: "Freelancer Started", state: "complete" },
      { label: "Payment Received", state: "complete" },
    ];
  }

  if (normalizedStatus === "AWAITING_PAYMENT" || hasPaymentDue) {
    return [
      {
        label: hasAcceptedProposal ? "Freelancer Assigned" : "Proposal Accepted",
        state: "complete",
      },
      { label: "Work Delivered", state: "complete" },
      { label: "Release Payment", state: "current" },
    ];
  }

  if (normalizedStatus === "IN_PROGRESS") {
    return [
      {
        label: hasAcceptedProposal ? "Freelancer Assigned" : "Proposal Accepted",
        state: "complete",
      },
      { label: "Work in Progress", state: "current" },
      { label: "Final Handover", state: "pending" },
    ];
  }

  if (normalizedStatus === "OPEN") {
    return [
      { label: "Brief Published", state: "complete" },
      {
        label:
          pendingCount > 0
            ? `${pendingCount} Pending Proposal${pendingCount > 1 ? "s" : ""}`
            : "Awaiting Proposals",
        state: "current",
      },
      { label: "Freelancer Assignment", state: "pending" },
    ];
  }

  return [
    { label: "Brief Started", state: "complete" },
    { label: "Scope Review", state: "current" },
    { label: "Invite Freelancers", state: "pending" },
  ];
};

const getChatMessagePreview = (message) => {
  if (typeof message === "string") {
    return message.trim();
  }

  if (typeof message === "number") {
    return String(message);
  }

  if (!message || typeof message !== "object") {
    return "";
  }

  if (typeof message.content === "string" && message.content.trim()) {
    return message.content.trim();
  }

  const attachmentName =
    typeof message.attachment?.name === "string" ? message.attachment.name.trim() : "";
  if (attachmentName) {
    return `Attachment: ${attachmentName}`;
  }

  if (message.attachment) {
    return "Sent an attachment";
  }

  if (typeof message.senderName === "string" && message.senderName.trim()) {
    return `Message from ${message.senderName.trim()}`;
  }

  return "";
};

const getProjectAcceptedProposal = (project = {}) =>
  Array.isArray(project?.proposals)
    ? project.proposals.find(
        (proposal) => String(proposal?.status || "").toUpperCase() === "ACCEPTED",
      )
    : null;

const getProjectPendingProposals = (project = {}) =>
  Array.isArray(project?.proposals)
    ? project.proposals
        .filter(
          (proposal) => String(proposal?.status || "").toUpperCase() === "PENDING",
        )
        .sort(
          (left, right) =>
            new Date(right?.createdAt || 0).getTime() -
            new Date(left?.createdAt || 0).getTime(),
        )
    : [];

const getFirstNonEmptyText = (...values) => {
  for (const value of values.flat()) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }

  return "";
};

const extractLabeledValue = (value = "", labels = []) =>
  extractLabeledLineValue(value, labels);

const toTaskIdArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item || "").trim()).filter(Boolean);
      }
    } catch {
      return [];
    }
  }

  return [];
};

const toDisplayTitleCase = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/(^|[\s/-])([a-z])/g, (match, prefix, char) => `${prefix}${char.toUpperCase()}`);

const hasProjectPaymentDue = (project = {}) =>
  Boolean(project?.paymentPlan?.nextDueInstallment);

const getFirstProjectInstallment = (project = {}) =>
  Array.isArray(project?.paymentPlan?.installments)
    ? project.paymentPlan.installments[0] || null
    : null;

const isProjectProgressEligible = (project = {}) => {
  const normalizedStatus = String(project?.status || "").toUpperCase();
  const ongoingStatuses = new Set([
    "AWAITING_PAYMENT",
    "IN_PROGRESS",
    "ONGOING",
    "ACTIVE",
    "IN_REVIEW",
    "ON_HOLD",
    "PAUSED",
  ]);

  if (ongoingStatuses.has(normalizedStatus)) {
    return true;
  }

  return false;
};

const hasUnlockedProjectProgress = (project = {}) => {
  const normalizedStatus = String(project?.status || "").toUpperCase();
  if (normalizedStatus === "IN_PROGRESS" || normalizedStatus === "COMPLETED") {
    return true;
  }

  const firstInstallment = getFirstProjectInstallment(project);
  if (!firstInstallment) {
    return false;
  }

  if (firstInstallment.isPaid) {
    return true;
  }

  const firstInstallmentAmount = Number(firstInstallment.amount || 0);
  const paidAmount = Number(project?.paymentPlan?.paidAmount ?? project?.spent ?? 0);
  return firstInstallmentAmount > 0 && paidAmount >= firstInstallmentAmount;
};

const resolveProjectBusinessName = (project = {}) => {
  const acceptedProposal = getProjectAcceptedProposal(project);

  return getFirstNonEmptyText(
    project?.businessName,
    project?.companyName,
    acceptedProposal?.businessName,
    acceptedProposal?.companyName,
    extractLabeledValue(project?.description || "", [
      "Business Name",
      "Company Name",
      "Brand Name",
    ]),
    extractLabeledValue(acceptedProposal?.coverLetter || "", [
      "Business Name",
      "Company Name",
      "Brand Name",
    ]),
  );
};

const hasStalePendingProposal = (project = {}) => {
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
  return getProjectPendingProposals(project).some(
    (proposal) => new Date(proposal?.createdAt || 0).getTime() < twentyFourHoursAgo,
  );
};

// ==================== Main Dashboard Component ====================
const ClientDashboardContent = () => {
  const [sessionUser, setSessionUser] = useState(null);
  const { authFetch } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const navigate = useNavigate();
  const storageKeys = useMemo(
    () => getProposalStorageKeys(sessionUser?.id),
    [sessionUser?.id],
  );
  const [projects, setProjects] = useState([]);
  const [freelancers, setFreelancers] = useState([]); // Chat freelancers
  const [suggestedFreelancers, setSuggestedFreelancers] = useState([]); // All freelancers for suggestions
  const [, setIsLoading] = useState(true);
  const [showSuspensionAlert, setShowSuspensionAlert] = useState(false);
  const [savedProposals, setSavedProposals] = useState([]);
  const [activeProposalId, setActiveProposalId] = useState(null);
  const [isSendingProposal, setIsSendingProposal] = useState(false);
  const [sendingFreelancerId, setSendingFreelancerId] = useState(null);
  const [isSyncingDrafts, setIsSyncingDrafts] = useState(false);
  const [showViewProposal, setShowViewProposal] = useState(false);
  const [showEditProposal, setShowEditProposal] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    summary: "",
    budget: "",
    timeline: "",
  }); const [projectToPay, setProjectToPay] = useState(null);
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
  const [freelancerSearch, setFreelancerSearch] = useState("");
  const [isFreelancersLoading, setIsFreelancersLoading] = useState(false);
  const [bookAppointmentOpen, setBookAppointmentOpen] = useState(false);
  const [selectedAppointmentTime, setSelectedAppointmentTime] = useState(
    DASHBOARD_APPOINTMENT_SLOTS[2],
  );
  const freelancerPoolCacheRef = useRef({
    userId: null,
    loaded: false,
    data: [],
  });
  const freelancerPoolPromiseRef = useRef(null);

  const savedProposal = useMemo(() => {
    if (!savedProposals.length) return null;
    return (
      savedProposals.find((proposal) => proposal.id === activeProposalId) ||
      savedProposals[0]
    );
  }, [savedProposals, activeProposalId]);

  const parsedSavedProposal = useMemo(
    () => parseProposalSections(savedProposal || {}),
    [savedProposal],
  );

  const projectRequiredSkills = useMemo(() => {
    if (!showFreelancerSelect) return [];
    return extractProjectRequiredSkills(savedProposal || {});
  }, [showFreelancerSelect, savedProposal]);

  const fetchFreelancerPool = useCallback(async () => {
    if (!sessionUser?.id) return [];

    const currentCache = freelancerPoolCacheRef.current;
    if (currentCache.userId === sessionUser.id && currentCache.loaded) {
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

      const merged = [...(activeFreelancers || []), ...(pendingFreelancers || [])];
      const uniqueById = merged.filter(
        (freelancer, index, self) =>
          freelancer?.id &&
          self.findIndex((item) => item?.id === freelancer.id) === index,
      );
      const normalized = uniqueById.filter(
        (freelancer) =>
          freelancer?.id !== sessionUser.id && hasFreelancerRole(freelancer),
      );

      freelancerPoolCacheRef.current = {
        userId: sessionUser.id,
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
  }, [sessionUser?.id]);

  const primeFreelancerPool = useCallback(() => {
    if (!sessionUser?.id) return;
    void fetchFreelancerPool().catch((error) => {
      console.error("Failed to prefetch freelancers:", error);
    });
  }, [sessionUser?.id, fetchFreelancerPool]);

  const openFreelancerSelection = useCallback(() => {
    const cache = freelancerPoolCacheRef.current;
    const hasCachedPool = cache.userId === sessionUser?.id && cache.loaded;
    setIsFreelancersLoading(!hasCachedPool);
    setShowFreelancerSelect(true);
  }, [sessionUser?.id]);

  const rankedSuggestedFreelancers = useMemo(() => {
    if (!showFreelancerSelect) return [];
    if (!Array.isArray(suggestedFreelancers) || suggestedFreelancers.length === 0) {
      return [];
    }
    return rankFreelancersForProposal(suggestedFreelancers, savedProposal);
  }, [showFreelancerSelect, suggestedFreelancers, savedProposal]);

  const freelancerSelectionData = useMemo(() => {
    if (!showFreelancerSelect) {
      return {
        totalRanked: 0,
        invitedCount: 0,
        available: [],
      };
    }

    const sourceProjectId =
      savedProposal?.syncedProjectId || savedProposal?.projectId || null;
    const alreadyInvitedIds = new Set();

    if (sourceProjectId) {
      const currentProject = projects.find((project) => project?.id === sourceProjectId);
      (currentProject?.proposals || []).forEach((proposal) => {
        const status = String(proposal?.status || "").toUpperCase();
        if (
          proposal?.freelancerId &&
          PROPOSAL_BLOCKED_STATUSES.has(status)
        ) {
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
    showFreelancerSelect,
    rankedSuggestedFreelancers,
    projectRequiredSkills,
    savedProposal?.syncedProjectId,
    savedProposal?.projectId,
    projects,
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
        ...(Array.isArray(freelancer.matchHighlights)
          ? freelancer.matchHighlights
          : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [showFreelancerSelect, freelancerSelectionData.available, freelancerSearch]);

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
    if (!showFreelancerSelect) {
      setFreelancerSearch("");
      setIsFreelancersLoading(false);
    }
  }, [showFreelancerSelect]);

  useEffect(() => {
    freelancerPoolPromiseRef.current = null;

    if (!sessionUser?.id) {
      freelancerPoolCacheRef.current = {
        userId: null,
        loaded: false,
        data: [],
      };
      setSuggestedFreelancers([]);
      return;
    }

    if (freelancerPoolCacheRef.current.userId !== sessionUser.id) {
      freelancerPoolCacheRef.current = {
        userId: sessionUser.id,
        loaded: false,
        data: [],
      };
      setSuggestedFreelancers([]);
    }
  }, [sessionUser?.id]);

  useEffect(() => {
    if (!sessionUser?.id) return;
    primeFreelancerPool();
  }, [sessionUser?.id, primeFreelancerPool]);

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
    const { proposals, activeId } = loadSavedProposalsFromStorage(
      sessionUser?.id,
    );
    setSavedProposals(proposals);
    setActiveProposalId(activeId);
    persistSavedProposalsToStorage(proposals, activeId, storageKeys);
  }, [sessionUser?.id, storageKeys]);

  const persistSavedProposalState = useCallback(
    (nextProposals, preferredActiveId = null) => {
      const normalized = Array.isArray(nextProposals)
        ? dedupeSavedProposals(nextProposals)
        : [];
      const resolvedActiveId = resolveActiveProposalId(
        normalized,
        preferredActiveId,
        activeProposalId,
      );
      setSavedProposals(normalized);
      setActiveProposalId(resolvedActiveId);
      persistSavedProposalsToStorage(normalized, resolvedActiveId, storageKeys);
      return resolvedActiveId;
    },
    [activeProposalId, storageKeys],
  );

  useEffect(() => {
    if (!authFetch || !sessionUser?.id || sessionUser?.role !== "CLIENT")
      return;
    if (isSyncingDrafts) return;

    const unsynced = savedProposals.filter(
      (proposal) => !proposal?.syncedProjectId,
    );
    if (unsynced.length === 0) return;

    const syncDrafts = async () => {
      setIsSyncingDrafts(true);
      const now = new Date().toISOString();
      try {
        const results = await Promise.all(
          unsynced.map(async (proposal) => {
            try {
              const response = await authFetch("/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  title: resolveProposalTitle(proposal),
                  description:
                    proposal.summary || proposal.content || "Proposal draft",
                  budget:
                    parseInt(
                      String(proposal.budget || "0").replace(/[^0-9]/g, ""),
                    ) || 0,
                  status: "DRAFT",
                }),
                suppressToast: true,
              });

              if (!response.ok) {
                return { id: proposal.id, projectId: null };
              }

              const payload = await response.json().catch(() => null);
              const projectId = payload?.data?.project?.id || null;
              return { id: proposal.id, projectId };
            } catch (error) {
              console.error("Failed to sync proposal draft:", error);
              return { id: proposal.id, projectId: null };
            }
          }),
        );

        const updated = savedProposals.map((proposal) => {
          const match = results.find((item) => item.id === proposal.id);
          if (match?.projectId) {
            return {
              ...proposal,
              ownerId: sessionUser.id,
              syncedProjectId: match.projectId,
              syncedAt: now,
            };
          }
          return proposal;
        });

        persistSavedProposalState(updated, activeProposalId);
      } finally {
        setIsSyncingDrafts(false);
      }
    };

    syncDrafts();
  }, [
    authFetch,
    sessionUser?.id,
    sessionUser?.role,
    savedProposals,
    activeProposalId,
    isSyncingDrafts,
    persistSavedProposalState,
  ]);

  // Load projects
  // Load projects function
  const loadProjects = useCallback(async () => {
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
          (prop) => (prop.status || "").toUpperCase() === "PENDING",
        );
        return pendingProposals.some(
          (prop) => new Date(prop.createdAt).getTime() < twentyFourHoursAgo,
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
    } catch (error) {
      console.error("Failed to load projects", error);
    } finally {
      setIsLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (!Array.isArray(projects) || projects.length === 0) return;

    const projectStatusById = new Map(
      projects
        .filter((project) => project?.id)
        .map((project) => [
          String(project.id),
          String(project.status || "").toUpperCase(),
        ]),
    );

    const visibleDraftProposals = savedProposals.filter((proposal) => {
      const linkedProjectId = proposal?.syncedProjectId || proposal?.projectId;
      if (!linkedProjectId) return true;
      const linkedStatus = projectStatusById.get(String(linkedProjectId));
      if (!linkedStatus) return true;
      return isDraftProjectStatus(linkedStatus);
    });

    if (visibleDraftProposals.length !== savedProposals.length) {
      const preferredActiveId = visibleDraftProposals.some(
        (proposal) => proposal.id === activeProposalId,
      )
        ? activeProposalId
        : visibleDraftProposals[0]?.id || null;
      persistSavedProposalState(visibleDraftProposals, preferredActiveId);
      return;
    }

    const projectDerivedProposals = projects
      .filter((project) => shouldHydrateProjectProposal(project))
      .map((project) => mapProjectToSavedProposal(project));

    if (projectDerivedProposals.length === 0) return;

    const merged = mergeProposalsBySignature(
      savedProposals,
      projectDerivedProposals,
    );

    if (merged.length === savedProposals.length) return;

    persistSavedProposalState(merged, activeProposalId);
  }, [projects, savedProposals, activeProposalId, persistSavedProposalState]);

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
              lastMessage: getChatMessagePreview(c.lastMessage),
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
  }, []);

  // Hydrate freelancer suggestions when dialog opens.
  useEffect(() => {
    if (!sessionUser?.id || !showFreelancerSelect) return;
    let isCurrentRequest = true;

    const hydrateFreelancers = async () => {
      const cache = freelancerPoolCacheRef.current;

      if (cache.userId === sessionUser.id && cache.loaded) {
        setSuggestedFreelancers(cache.data);
        setIsFreelancersLoading(false);
        return;
      }

      setIsFreelancersLoading(true);
      try {
        const pool = await fetchFreelancerPool();
        if (!isCurrentRequest) return;
        setSuggestedFreelancers(pool);
      } catch (err) {
        if (!isCurrentRequest) return;
        console.error("Failed to load suggested freelancers:", err);
        setSuggestedFreelancers([]);
      } finally {
        if (isCurrentRequest) {
          setIsFreelancersLoading(false);
        }
      }
    };

    void hydrateFreelancers();

    return () => {
      isCurrentRequest = false;
    };
  }, [sessionUser?.id, showFreelancerSelect, fetchFreelancerPool]);

  // Sort projects by date (most recent first)
  const uniqueProjects = useMemo(() => {
    return [...projects].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
  }, [projects]);

  // Computed metrics
  const metrics = useMemo(() => {
    const projectsWithAccepted = uniqueProjects.filter((p) =>
      (p.proposals || []).some(
        (pr) => (pr.status || "").toUpperCase() === "ACCEPTED",
      ),
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
          (pr) => (pr.status || "").toUpperCase() === "ACCEPTED",
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

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const firstName = sessionUser?.fullName?.split(" ")[0] || "User";
  const renderLegacyDashboard = sessionUser?.id === "__legacy_dashboard__";

  const openEditProposal = useCallback(() => {
    if (!savedProposal) return;
    setEditForm({
      title: resolveProposalTitle(savedProposal),
      summary: savedProposal.summary || savedProposal.content || "",
      budget: savedProposal.budget || "",
      timeline: savedProposal.timeline || "",
    });
    setShowViewProposal(false);
    setShowEditProposal(true);
  }, [savedProposal]);

  const saveProposalChanges = useCallback(async () => {
    if (!savedProposal?.id) return;

    const nextTitle = editForm.title.trim() || resolveProposalTitle(savedProposal);
    const nextSummary = editForm.summary.trim();
    const nextBudget = editForm.budget.trim();
    const nextTimeline = editForm.timeline.trim();
    const nextDescription =
      nextSummary || savedProposal.summary || savedProposal.content || "";
    const nextBudgetValue = parseProposalBudgetValue(
      nextBudget || savedProposal.budget || "",
    );
    const linkedProjectId =
      savedProposal?.syncedProjectId || savedProposal?.projectId || null;
    const updatedAt = new Date().toISOString();

    const updatedProposals = savedProposals.map((proposal) =>
      proposal.id === savedProposal.id
        ? {
            ...proposal,
            projectTitle: nextTitle,
            title: nextTitle,
            summary: nextDescription,
            content: nextDescription,
            budget: nextBudget || proposal.budget || "",
            timeline: nextTimeline || proposal.timeline || "",
            updatedAt,
          }
        : proposal,
    );

    persistSavedProposalState(updatedProposals, savedProposal.id);
    setProjects((currentProjects) =>
      linkedProjectId
        ? currentProjects.map((project) =>
            String(project?.id) === String(linkedProjectId)
              ? {
                  ...project,
                  title: nextTitle,
                  description: nextDescription,
                  budget: nextBudgetValue,
                  updatedAt,
                }
              : project,
          )
        : currentProjects,
    );

    if (linkedProjectId && authFetch) {
      try {
        const response = await authFetch(`/projects/${linkedProjectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: nextTitle,
            description: nextDescription,
            budget: nextBudgetValue,
          }),
        });

        if (!response.ok) {
          throw new Error(`Project update failed with status ${response.status}`);
        }

        const payload = await response.json().catch(() => null);
        const updatedProject = payload?.data;
        if (updatedProject?.id) {
          setProjects((currentProjects) =>
            currentProjects.map((project) =>
              String(project?.id) === String(updatedProject.id)
                ? { ...project, ...updatedProject }
                : project,
            ),
          );
        }
      } catch (error) {
        console.error("Failed to sync proposal changes to project:", error);
        toast.error("Proposal saved locally, but project sync failed.");
        setShowEditProposal(false);
        return;
      }
    }

    setShowEditProposal(false);
    toast.success("Proposal updated");
  }, [
    authFetch,
    editForm,
    persistSavedProposalState,
    savedProposal,
    savedProposals,
  ]);

  // Map project status to display
  const getStatusBadge = useCallback((status) => {
    const s = (status || "").toUpperCase();
    if (s === "COMPLETED") return { label: "Completed", variant: "default" };
    if (s === "IN_PROGRESS") return { label: "On Track", variant: "success" };
    if (s === "OPEN") return { label: "Open", variant: "warning" };
    return { label: status || "Pending", variant: "secondary" };
  }, []);

  // Send proposal to freelancer
  const sendProposalToFreelancer = async (freelancer) => {
    if (!savedProposal || !freelancer) return;

    try {
      setIsSendingProposal(true);
      setSendingFreelancerId(freelancer.id);

      const normalizedBudget =
        parseInt(String(savedProposal.budget || "0").replace(/[^0-9]/g, "")) ||
        0;
      const sourceProjectId =
        savedProposal?.syncedProjectId || savedProposal?.projectId || null;
      let project =
        sourceProjectId && Array.isArray(projects)
          ? projects.find(
            (entry) => String(entry?.id) === String(sourceProjectId),
          )
          : null;

      if (project) {
        const projectStatus = String(project.status || "").toUpperCase();
        if (CLOSED_PROJECT_STATUSES.has(projectStatus)) {
          throw new Error("This project is already completed or paused.");
        }

        const hasExistingProposalForFreelancer = Array.isArray(project.proposals)
          ? project.proposals.some((proposal) => {
            const proposalStatus = String(proposal?.status || "").toUpperCase();
            return (
              String(proposal?.freelancerId) === String(freelancer.id) &&
              PROPOSAL_BLOCKED_STATUSES.has(proposalStatus)
            );
          })
          : false;

        if (hasExistingProposalForFreelancer) {
          throw new Error("You already sent this proposal to this freelancer.");
        }

        if (projectStatus === "DRAFT") {
          const publishRes = await authFetch(`/projects/${project.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: resolveProposalTitle(savedProposal),
              description: savedProposal.summary || savedProposal.content || "",
              budget: normalizedBudget,
              timeline: savedProposal.timeline || "1 month",
              status: "OPEN",
            }),
          });

          if (!publishRes.ok) {
            throw new Error("Failed to publish project before sending proposal.");
          }

          const publishPayload = await publishRes.json().catch(() => null);
          project = publishPayload?.data
            ? { ...project, ...publishPayload.data }
            : {
              ...project,
              title: resolveProposalTitle(savedProposal),
              description: savedProposal.summary || savedProposal.content || "",
              budget: normalizedBudget,
              timeline: savedProposal.timeline || "1 month",
              status: "OPEN",
            };
        }
      } else {
        // Create a project only when this proposal has no synced project yet.
        const projectRes = await authFetch("/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: resolveProposalTitle(savedProposal),
            description: savedProposal.summary || savedProposal.content || "",
            budget: normalizedBudget,
            timeline: savedProposal.timeline || "1 month",
            status: "OPEN",
          }),
        });

        if (!projectRes.ok) throw new Error("Failed to create project");
        const projectData = await projectRes.json().catch(() => null);
        project = projectData?.data?.project || null;
      }

      if (!project?.id) {
        throw new Error("Could not resolve project for this proposal.");
      }

      if (savedProposal?.id) {
        const now = new Date().toISOString();
        const updated = savedProposals.map((proposal) =>
          proposal.id === savedProposal.id
            ? {
              ...proposal,
              ownerId: sessionUser?.id || proposal.ownerId || null,
              syncedProjectId: project.id,
              syncedAt: proposal.syncedAt || now,
            }
            : proposal,
        );
        persistSavedProposalState(updated, savedProposal.id);
      }

      // Send proposal to freelancer
      const proposalRes = await authFetch("/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          freelancerId: freelancer.id,
          amount: normalizedBudget,
          coverLetter: savedProposal.summary || savedProposal.content || "",
        }),
      });

      const proposalPayload = await proposalRes.json().catch(() => null);
      if (!proposalRes.ok) {
        throw new Error(proposalPayload?.message || "Failed to send proposal");
      }

      toast.success(
        proposalRes.status === 200
          ? `Proposal resent to ${freelancer.fullName || "freelancer"}!`
          : `Proposal sent to ${freelancer.fullName || "freelancer"}!`,
      );

      // Refresh projects so the freelancer is immediately hidden from the list
      await loadProjects();

      // Keep the proposal so user can send to more freelancers
      // The freelancer just sent to will be filtered out from the list

    } catch (error) {
      console.error("Failed to send proposal:", error);
      toast.error(error?.message || "Failed to send proposal. Please try again.");
    } finally {
      setIsSendingProposal(false);
      setSendingFreelancerId(null);
    }
  };

  const handlePaymentClick = useCallback(async (project) => {
    if (!project?.id) return;

    setProjectToPay(project);
    setIsProcessingPayment(true);
    try {
      const paymentResult = await processProjectInstallmentPayment({
        authFetch,
        projectId: project.id,
        prefill: {
          email: sessionUser?.email || "",
          name: sessionUser?.fullName || "",
          contact: sessionUser?.phone || sessionUser?.phoneNumber || "",
        },
        description: `${project?.paymentPlan?.nextDueInstallment?.label || "Project payment"
          } for ${project?.title || "project"}`,
      });

      toast.success(
        paymentResult?.message ||
        "Payment processed successfully! Project billing has been updated."
      );
      await loadProjects();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error?.message || "Failed to process payment");
    } finally {
      setIsProcessingPayment(false);
      setProjectToPay(null);
    }
  }, [authFetch, loadProjects, sessionUser?.email, sessionUser?.fullName, sessionUser?.phone, sessionUser?.phoneNumber]);

  const handleIncreaseBudgetClick = useCallback((project) => {
    setBudgetProject(project);
    setNewBudget(String(project.budget || ""));
    setShowIncreaseBudget(true);
  }, []);

  const handleIncreaseBudgetDialogChange = useCallback((open) => {
    setShowIncreaseBudget(open);
    if (!open) {
      setBudgetProject(null);
      setNewBudget("");
    }
  }, []);

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
        (p) => (p.status || "").toUpperCase() === "PENDING",
      );

      // Separate old (>48hrs) and recent (<48hrs) proposals
      const oldProposals = pendingProposals.filter(
        (p) => new Date(p.createdAt).getTime() < fortyEightHoursAgo,
      );
      const recentProposals = pendingProposals.filter(
        (p) => new Date(p.createdAt).getTime() >= fortyEightHoursAgo,
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
        const newBudgetText = `Budget\n- ${formatINR(budgetValue)}`;
        const updatedProposals = storedProposals.map((proposal) => {
          const matchesId =
            proposal.projectId && proposal.projectId === budgetProject.id;
          const matchesTitle = proposal.projectTitle === budgetProject.title;
          if (!matchesId && !matchesTitle) return proposal;
          updatedAny = true;
          const next = {
            ...proposal,
            budget: formatINR(budgetValue),
            updatedAt: new Date().toISOString(),
          };
          if (next.summary) {
            next.summary = normalizeINRText(next.summary).replace(
              STORED_BUDGET_LINE_PATTERN,
              newBudgetText,
            );
          }
          if (next.content) {
            next.content = normalizeINRText(next.content).replace(
              STORED_BUDGET_LINE_PATTERN,
              newBudgetText,
            );
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
          `Budget updated to ${formatINR(budgetValue)}! ${rejectedCount} expired proposal(s) removed. You can now send to new freelancers.`,
        );
      } else {
        // Just updated budget (proposals are still pending, under 48hrs)
        toast.success(
          `Budget updated to ${formatINR(budgetValue)}! Freelancers will see ${formatINR(Math.round(budgetValue * 0.7))} after the 30% platform margin.`,
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

  const handleSiteNav = useCallback(
    (key) => {
      const routes = {
        home: "/",
        marketplace: "/marketplace",
        service: "/service",
        contact: "/contact",
      };

      navigate(routes[key] || "/");
    },
    [navigate],
  );

  const handleDashboardNav = useCallback(
    (key) => {
      const routes = {
        dashboard: "/client",
        proposals: "/client/proposal",
        projects: "/client/project",
        messages: "/client/messages",
        payments: "/client/payments",
        freelancers: "/marketplace",
      };

      navigate(routes[key] || "/client");
    },
    [navigate],
  );

  const handleOpenNotifications = useCallback(() => {
    navigate("/client/messages");
  }, [navigate]);

  const handleOpenQuickProject = useCallback(() => {
    navigate("/service");
  }, [navigate]);

  const handleOpenHireFreelancer = useCallback(() => {
    navigate("/marketplace");
  }, [navigate]);

  const handleOpenViewProposals = useCallback(() => {
    if (savedProposal) {
      setShowViewProposal(true);
      return;
    }

    navigate("/client/proposal");
  }, [navigate, savedProposal]);

  const handleOpenViewProjects = useCallback(() => {
    navigate("/client/project");
  }, [navigate]);

  const handleOpenMessenger = useCallback(() => {
    navigate("/client/messages");
  }, [navigate]);

  const profile = useMemo(
    () => ({
      name: sessionUser?.fullName || sessionUser?.name || "Client",
      avatar: sessionUser?.avatar || "",
      initial:
        (sessionUser?.fullName || sessionUser?.name || sessionUser?.email || "C")
          .charAt(0)
          .toUpperCase(),
    }),
    [sessionUser?.avatar, sessionUser?.email, sessionUser?.fullName, sessionUser?.name],
  );

  const hero = useMemo(
    () => ({
      greeting,
      firstName,
      description: "Here's a quick overview of your workspace today.",
      dateLabel: formatDashboardDate(new Date(), {
        weekday: "long",
        month: "short",
        day: "numeric",
      }).toUpperCase(),
    }),
    [firstName, greeting],
  );

  const pendingFreelancerRequests = useMemo(
    () =>
      uniqueProjects.reduce(
        (count, project) => count + getProjectPendingProposals(project).length,
        0,
      ),
    [getProjectPendingProposals, uniqueProjects],
  );

  const actionRequiredCount = useMemo(
    () =>
      uniqueProjects.reduce(
        (count, project) =>
          count + (hasProjectPaymentDue(project) || hasStalePendingProposal(project) ? 1 : 0),
        0,
      ),
    [hasProjectPaymentDue, hasStalePendingProposal, uniqueProjects],
  );

  const dashboardMetricCards = useMemo(
    () => [
      {
        title: "ACTIVE PROJECTS",
        value: String(uniqueProjects.filter((p) => {
          const status = String(p.status || "").toUpperCase();
          return status === "IN_PROGRESS" || status === "AWAITING_PAYMENT";
        }).length).padStart(2, "0"),
        iconKey: "projects",
      },
      {
        title: "PENDING PROPOSALS",
        value: String(pendingFreelancerRequests).padStart(2, "0"),
        detail: pendingFreelancerRequests === 1 ? "New Request" : "New Requests",
        iconKey: "proposals",
      },
      {
        title: "COMPLETED PROJECTS",
        value: String(
          uniqueProjects.filter(
            (project) => String(project.status || "").toUpperCase() === "COMPLETED",
          ).length,
        ).padStart(2, "0"),
        iconKey: "projects",
      },
      {
        title: "PENDING PAYMENTS",
        value: formatINR(uniqueProjects.reduce((total, project) => {
          const status = String(project.status || "").toUpperCase();
          if (status === "AWAITING_PAYMENT" && project.paymentPlan?.nextDueInstallment) {
            const amount = Math.round((parseInt(project.budget) || 0) * (project.paymentPlan.nextDueInstallment.percentage / 100));
            return total + amount;
          }
          return total;
        }, 0)),
        iconKey: "payments",
      },
    ],
    [pendingFreelancerRequests, uniqueProjects],
  );

  const draftProposalRows = useMemo(() => {
    const toneCycle = ["amber", "blue", "green", "violet"];

    return dedupeSavedProposals(savedProposals).slice(0, 4).map((proposal, index) => ({
      id: proposal.id,
      title:
        toDisplayTitleCase(resolveProposalBusinessName(proposal)) ||
        resolveProposalTitle(proposal),
      tag: resolveProposalServiceLabel(proposal).toUpperCase(),
      tagTone: toneCycle[index % toneCycle.length],
      budget: formatBudget(proposal.budget),
      updatedAt: formatProposalUpdatedAt(proposal),
      onView: () => {
        setActiveProposalId(proposal.id);
        persistActiveProposalSelection(savedProposals, proposal.id, storageKeys);
        setShowViewProposal(true);
      },
      onDelete: () => {
        const remaining = savedProposals.filter((entry) => entry.id !== proposal.id);
        const nextActiveId = remaining[0]?.id || null;

        if (!remaining.length && storageKeys?.singleKey) {
          localStorage.removeItem(storageKeys.singleKey);
        }

        persistSavedProposalState(remaining, nextActiveId);
        toast.success("Proposal deleted");
      },
    }));
  }, [
    formatBudget,
    formatProposalUpdatedAt,
    persistActiveProposalSelection,
    persistSavedProposalState,
    resolveProposalServiceLabel,
    savedProposals,
    storageKeys,
  ]);

  const interestedFreelancerRows = useMemo(() => {
    const source = Array.isArray(freelancers) && freelancers.length > 0
      ? freelancers
      : suggestedFreelancers;

    return source.slice(0, 3).map((freelancer, index) => {
      const displayName =
        freelancer?.fullName || freelancer?.name || `Freelancer ${index + 1}`;
      const numericRate =
        Number(
          freelancer?.dailyRate ||
            freelancer?.ratePerDay ||
            freelancer?.hourlyRate ||
            freelancer?.rate ||
            0,
        ) || 0;
      const rating =
        Number(freelancer?.rating || freelancer?.averageRating || freelancer?.avgRating || 4.8) ||
        4.8;
      const projectsCount =
        Number(
          freelancer?.completedProjects ||
            freelancer?.projectsCompleted ||
            freelancer?.projectsCount ||
            0,
        ) || 0;

      return {
        id: freelancer?.id || freelancer?.chatId || `freelancer-${index}`,
        name: displayName,
        initial: displayName.charAt(0).toUpperCase(),
        avatar: freelancer?.avatar || "",
        role:
          freelancer?.professionalTitle ||
          freelancer?.headline ||
          freelancer?.projectTitle ||
          (Array.isArray(freelancer?.skills) && freelancer.skills.length > 0
            ? freelancer.skills[0]
            : "Creative specialist"),
        rating: rating.toFixed(1),
        projectsLabel: `${projectsCount} ${projectsCount === 1 ? "Project" : "Projects"}`,
        rateLabel: numericRate > 0 ? formatINR(numericRate) : "Available",
        rateSuffix: numericRate > 0 ? "/day" : "",
        onView: () => navigate("/marketplace"),
        onMessage: () =>
          navigate(
            freelancer?.projectId
              ? `/client/messages?projectId=${encodeURIComponent(freelancer.projectId)}`
              : "/client/messages",
          ),
      };
    });
  }, [freelancers, navigate, suggestedFreelancers]);

  const progressProjects = useMemo(() => {
    const clampProgress = (value) => {
      const numericValue = Number(value);
      if (!Number.isFinite(numericValue)) return 0;
      return Math.max(0, Math.min(100, Math.round(numericValue)));
    };

    const resolvePhaseSummary = (phaseLike, fallbackLabel = "Upcoming") => {
      const explicitSummary = [
        phaseLike?.subLabel,
        phaseLike?.subtitle,
        phaseLike?.detail,
        phaseLike?.description,
        phaseLike?.summary,
      ].find((value) => typeof value === "string" && value.trim());

      if (explicitSummary) {
        return explicitSummary.trim();
      }

      const totalTasks = Math.max(0, Number(phaseLike?.totalTasks || phaseLike?.taskCount || 0));
      const completedTasks = Math.max(
        0,
        Number(
          phaseLike?.verifiedTasks ?? phaseLike?.completedTasks ?? phaseLike?.doneTasks ?? 0,
        ),
      );

      if (totalTasks > 0) {
        return `${Math.min(completedTasks, totalTasks)}/${totalTasks} tasks done`;
      }

      return fallbackLabel;
    };

    const buildDefaultPhases = (count = 4) =>
      Array.from({ length: Math.max(1, count) }, (_, index) => ({
        label: `Phase ${index + 1}`,
        value: Math.round(((index + 1) / Math.max(count, 1)) * 100),
      }));

    const buildProjectPhaseSteps = (project) => {
      const sop = getSopFromTitle(project?.title || "");
      const verifiedTaskIds = new Set(toTaskIdArray(project?.verifiedTasks));
      const completedTaskIds = new Set(toTaskIdArray(project?.completedTasks));

      return (Array.isArray(sop?.phases) ? sop.phases : []).map((phase) => {
        const phaseTasks = Array.isArray(sop?.tasks)
          ? sop.tasks.filter((task) => String(task?.phase) === String(phase?.id))
          : [];

        return phaseTasks.map((task, taskIndex) => {
          const taskKey = `${task.phase}-${task.id}`;
          const isVerified = verifiedTaskIds.has(taskKey);
          const isCompleted = completedTaskIds.has(taskKey);

          return {
            id: taskKey,
            sequence: taskIndex + 1,
            title: task?.title || `Step ${taskIndex + 1}`,
            state: isVerified ? "completed" : isCompleted ? "in_progress" : "pending",
          };
        });
      });
    };

    const buildProjectPhases = (project) => {
      const phaseSteps = buildProjectPhaseSteps(project);
      const paymentPlanPhases = Array.isArray(project?.paymentPlan?.phases)
        ? project.paymentPlan.phases
        : [];

      if (Array.isArray(project?.phases) && project.phases.length > 0) {
        return project.phases.map((phase, index) => ({
          label: phase.label || phase.name || `Phase ${index + 1}`,
          value: clampProgress(phase.progress ?? phase.value),
          subLabel: resolvePhaseSummary(paymentPlanPhases[index] || phase),
          steps: phaseSteps[index] || [],
        }));
      }

      if (paymentPlanPhases.length > 0) {
        let completedBefore = 0;

        return paymentPlanPhases.map((phase, index) => {
          const totalTasks = Math.max(0, Number(phase?.totalTasks || 0));
          const verifiedTasks = Math.max(0, Number(phase?.verifiedTasks || 0));
          const phaseCompletion =
            totalTasks > 0 ? Math.min(verifiedTasks / totalTasks, 1) : phase?.isComplete ? 1 : 0;
          const value = Math.round(
            ((completedBefore + phaseCompletion) / paymentPlanPhases.length) * 100,
          );

          if (phase?.isComplete) {
            completedBefore += 1;
          }

          return {
            label: phase?.name || `Phase ${index + 1}`,
            value,
            subLabel: resolvePhaseSummary(phase, phase?.isComplete ? "Completed" : "Pending"),
            steps: phaseSteps[index] || [],
          };
        });
      }

      if (Array.isArray(project?.milestones) && project.milestones.length > 0) {
        let completedBefore = 0;

        return project.milestones.map((milestone, index) => {
          const isCompleted =
            milestone?.completed ||
            String(milestone?.status || "").toUpperCase() === "COMPLETED";
          const milestoneProgress = isCompleted ? 1 : clampProgress(milestone?.progress) / 100;
          const value = Math.round(
            ((completedBefore + milestoneProgress) / project.milestones.length) * 100,
          );

          if (isCompleted) {
            completedBefore += 1;
          }

          return {
            label: milestone?.label || milestone?.name || `Phase ${index + 1}`,
            value,
            subLabel: isCompleted
              ? "Completed"
              : clampProgress(milestone?.progress) > 0
                ? `${clampProgress(milestone?.progress)}% complete`
                : "Pending",
            steps: phaseSteps[index] || [],
          };
        });
      }

      return buildDefaultPhases(Number(project?.phaseCount) || 4).map((phase, index) => ({
        ...phase,
        steps: phaseSteps[index] || [],
      }));
    };

    const resolveCurrentProgress = (project, phases, normalizedStatus) => {
      const explicitProgress = clampProgress(
        project?.progress ?? project?.completionPercentage ?? project?.milestoneProgress,
      );

      if (explicitProgress > 0 || normalizedStatus === "COMPLETED") {
        return normalizedStatus === "COMPLETED" ? 100 : explicitProgress;
      }

      const paymentPlanPhases = Array.isArray(project?.paymentPlan?.phases)
        ? project.paymentPlan.phases
        : [];
      if (paymentPlanPhases.length > 0) {
        const firstIncompleteIndex = paymentPlanPhases.findIndex((phase) => !phase?.isComplete);
        if (firstIncompleteIndex === -1) return 100;

        const currentPhase = paymentPlanPhases[firstIncompleteIndex];
        const totalTasks = Math.max(0, Number(currentPhase?.totalTasks || 0));
        const verifiedTasks = Math.max(0, Number(currentPhase?.verifiedTasks || 0));
        const phaseCompletion = totalTasks > 0 ? Math.min(verifiedTasks / totalTasks, 1) : 0;

        return clampProgress(
          ((firstIncompleteIndex + phaseCompletion) / paymentPlanPhases.length) * 100,
        );
      }

      if (Array.isArray(project?.milestones) && project.milestones.length > 0) {
        const currentMilestoneIndex = project.milestones.findIndex((milestone) => {
          const status = String(milestone?.status || "").toUpperCase();
          return !(milestone?.completed || status === "COMPLETED");
        });

        if (currentMilestoneIndex === -1) return 100;

        const currentMilestone = project.milestones[currentMilestoneIndex];
        const milestoneProgress = clampProgress(currentMilestone?.progress) / 100;

        return clampProgress(
          ((currentMilestoneIndex + milestoneProgress) / project.milestones.length) * 100,
        );
      }

      if (Number.isFinite(project?.currentPhaseIndex) && phases.length > 0) {
        const phaseIndex = Math.min(project.currentPhaseIndex, phases.length - 1);
        return clampProgress(phases[phaseIndex]?.value);
      }

      const statusProgressMap = {
        DRAFT: 8,
        OPEN: 20,
        AWAITING_PAYMENT: 40,
        IN_PROGRESS: 55,
        COMPLETED: 100,
      };

      return statusProgressMap[normalizedStatus] ?? clampProgress(phases[phases.length - 1]?.value);
    };

    const determineHighlightIndex = (project, phases, normalizedStatus, currentProgress) => {
      if (Number.isFinite(project?.currentPhaseIndex) && project.currentPhaseIndex >= 0) {
        return Math.min(project.currentPhaseIndex, phases.length - 1);
      }

      const paymentPlanPhases = Array.isArray(project?.paymentPlan?.phases)
        ? project.paymentPlan.phases
        : [];
      if (paymentPlanPhases.length > 0) {
        const firstIncompleteIndex = paymentPlanPhases.findIndex((phase) => !phase?.isComplete);
        return firstIncompleteIndex === -1
          ? paymentPlanPhases.length - 1
          : firstIncompleteIndex;
      }

      if (Array.isArray(project?.milestones) && project.milestones.length > 0) {
        const currentMilestoneIndex = project.milestones.findIndex((milestone) => {
          const status = String(milestone?.status || "").toUpperCase();
          return !(milestone?.completed || status === "COMPLETED");
        });
        return currentMilestoneIndex === -1
          ? project.milestones.length - 1
          : currentMilestoneIndex;
      }

      const fallbackStatusIndexMap = {
        DRAFT: 0,
        OPEN: 1,
        AWAITING_PAYMENT: 2,
        IN_PROGRESS: 2,
      };
      if (normalizedStatus === "COMPLETED" || currentProgress >= 100) {
        return phases.length - 1;
      }

      if (fallbackStatusIndexMap[normalizedStatus] !== undefined) {
        return Math.min(fallbackStatusIndexMap[normalizedStatus], phases.length - 1);
      }

      const phaseStep = 100 / Math.max(phases.length, 1);
      return Math.min(Math.floor(currentProgress / phaseStep), phases.length - 1);
    };

    const buildFallbackSubLabel = (phaseIndex, currentPhaseIndex) => {
      if (phaseIndex < currentPhaseIndex) return "Completed";
      if (phaseIndex === currentPhaseIndex) return "Current phase";
      return "Upcoming";
    };

    return uniqueProjects
      .filter(isProjectProgressEligible)
      .map((project, index) => {
        const normalizedStatus = String(project?.status || "").toUpperCase();
        const firstInstallment = getFirstProjectInstallment(project);
        const isProgressUnlocked = hasUnlockedProjectProgress(project);
        const basePhases = buildProjectPhases(project);
        const currentProgress = resolveCurrentProgress(project, basePhases, normalizedStatus);
        const highlightIndex = determineHighlightIndex(
          project,
          basePhases,
          normalizedStatus,
          currentProgress,
        );
        const phases = basePhases.map((phase, phaseIndex) => ({
          ...phase,
          value: phaseIndex === highlightIndex ? currentProgress : phase.value,
          subLabel: phase.subLabel || buildFallbackSubLabel(phaseIndex, highlightIndex),
          steps: Array.isArray(phase.steps)
            ? phase.steps.map((step, stepIndex, collection) => {
                const firstPendingIndex = collection.findIndex(
                  (entry) => entry?.state !== "completed",
                );

                return {
                  ...step,
                  state:
                    phaseIndex === highlightIndex &&
                    step.state === "pending" &&
                    firstPendingIndex === stepIndex
                      ? "current"
                      : step.state,
                };
              })
            : [],
        }));
        const pendingCount = getProjectPendingProposals(project).length;

        let calloutDetail = "Workspace active";
        if (pendingCount > 0) {
          calloutDetail = `${pendingCount} task${pendingCount > 1 ? "s" : ""} pending`;
        } else if (project?.nextMilestone) {
          calloutDetail = project.nextMilestone;
        } else if (project?.currentTask) {
          calloutDetail = project.currentTask;
        }

        return {
          id: project.id || `progress-${index}`,
          status: normalizedStatus,
          progressCategory: currentProgress >= 100 ? "completed" : "ongoing",
          label:
            toDisplayTitleCase(resolveProjectBusinessName(project)) ||
            project.title ||
            `Project ${index + 1}`,
          calloutLabel: phases[highlightIndex]?.label || `Phase ${highlightIndex + 1}`,
          calloutValue: `${currentProgress}%`,
          calloutDetail,
          highlightIndex,
          currentPhaseIndex: highlightIndex,
          progressValue: currentProgress,
          isProgressUnlocked,
          isProgressLocked: !isProgressUnlocked,
          lockedPaymentLabel:
            firstInstallment?.label || "Initial project payment",
          lockedPaymentValue:
            Number(firstInstallment?.amount || 0) > 0
              ? formatINR(Number(firstInstallment.amount || 0))
              : "",
          lockedDescription:
            firstInstallment?.label
              ? `${firstInstallment.label} must be paid before the project progress graph appears.`
              : "The project progress graph will appear after the initial project amount is paid.",
          phases,
        };
      })
      .filter((project) => project.progressCategory === "ongoing")
      .slice(0, 3);
  }, [uniqueProjects]);

  const recentActivities = useMemo(() => {
    const fromNotifications = Array.isArray(notifications)
      ? notifications.slice(0, 4).map((notification, index) => {
          const type = String(notification?.type || "").toLowerCase();
          const createdAt = notification?.createdAt || notification?.updatedAt;

          if (type === "chat") {
            const projectId = notification?.data?.projectId;
            return {
              id: notification?.id || `notification-chat-${index}`,
              iconKey: "message",
              tone: "amber",
              title: notification?.title || "New Message",
              subtitle:
                notification?.message ||
                notification?.data?.projectTitle ||
                "A freelancer sent you a new message.",
              timeLabel: formatDashboardRelativeTime(createdAt),
              onClick: () =>
                navigate(
                  projectId
                    ? `/client/messages?projectId=${encodeURIComponent(projectId)}`
                    : "/client/messages",
                ),
            };
          }

          if (type === "proposal") {
            const proposalStatus = String(notification?.data?.status || "").toUpperCase();
            return {
              id: notification?.id || `notification-proposal-${index}`,
              iconKey: "proposal",
              tone: "green",
              title: notification?.title || "Proposal Update",
              subtitle: notification?.message || "Your proposal workflow has a new update.",
              timeLabel: formatDashboardRelativeTime(createdAt),
              onClick: () =>
                navigate(
                  proposalStatus === "ACCEPTED" && notification?.data?.projectId
                    ? "/client/project"
                    : "/client/proposal",
                ),
            };
          }

          if (
            type === "task_completed" ||
            type === "task_verified" ||
            type === "freelancer_change_resolved"
          ) {
            const projectId = notification?.data?.projectId;
            return {
              id: notification?.id || `notification-project-${index}`,
              iconKey: "milestone",
              tone: "violet",
              title: notification?.title || "Milestone Completed",
              subtitle: notification?.message || "A project milestone has been completed.",
              timeLabel: formatDashboardRelativeTime(createdAt),
              onClick: () =>
                navigate(
                  projectId
                    ? `/client/project/${encodeURIComponent(projectId)}`
                    : "/client/project",
                ),
            };
          }

          return {
            id: notification?.id || `notification-general-${index}`,
            iconKey: "project",
            tone: "blue",
            title: notification?.title || "Workspace Update",
            subtitle: notification?.message || "Catalance updated your workspace.",
            timeLabel: formatDashboardRelativeTime(createdAt),
            onClick: () => navigate("/client/project"),
          };
        })
      : [];

    if (fromNotifications.length > 0) {
      return fromNotifications;
    }

    const fallback = [];
    const latestProject = uniqueProjects[0];
    const latestAcceptedProject = uniqueProjects.find((project) =>
      Boolean(getProjectAcceptedProposal(project)),
    );
    const latestCompletedProject = uniqueProjects.find(
      (project) => String(project?.status || "").toUpperCase() === "COMPLETED",
    );
    const latestChat = freelancers[0];

    if (latestProject) {
      fallback.push({
        id: `activity-project-${latestProject.id}`,
        iconKey: "project",
        tone: "blue",
        title: "Project Updated",
        subtitle: latestProject.title || "A project was updated.",
        timeLabel: formatDashboardRelativeTime(
          latestProject.updatedAt || latestProject.createdAt,
        ),
        onClick: () => navigate(`/client/project/${encodeURIComponent(latestProject.id)}`),
      });
    }

    if (latestChat) {
      fallback.push({
        id: `activity-chat-${latestChat.chatId || latestChat.id}`,
        iconKey: "message",
        tone: "amber",
        title: "New Message",
        subtitle:
          latestChat.projectTitle ||
          getChatMessagePreview(latestChat.lastMessage) ||
          `From ${latestChat.fullName || latestChat.name || "Freelancer"}`,
        timeLabel: "Live",
        onClick: () =>
          navigate(
            latestChat.projectId
              ? `/client/messages?projectId=${encodeURIComponent(latestChat.projectId)}`
              : "/client/messages",
          ),
      });
    }

    if (savedProposal) {
      fallback.push({
        id: `activity-draft-${savedProposal.id}`,
        iconKey: "success",
        tone: "green",
        title: "Proposal Ready",
        subtitle: resolveProposalTitle(savedProposal),
        timeLabel: formatDashboardRelativeTime(savedProposal.updatedAt || savedProposal.createdAt),
        onClick: () => setShowViewProposal(true),
      });
    }

    if (latestAcceptedProject || latestCompletedProject) {
      const project = latestAcceptedProject || latestCompletedProject;
      fallback.push({
        id: `activity-success-${project.id}`,
        iconKey: "milestone",
        tone: "violet",
        title:
          String(project?.status || "").toUpperCase() === "COMPLETED"
            ? "Milestone Completed"
            : "Proposal Accepted",
        subtitle: project.title || "Project progress moved forward.",
        timeLabel: formatDashboardRelativeTime(project.updatedAt || project.createdAt),
        onClick: () => navigate(`/client/project/${encodeURIComponent(project.id)}`),
      });
    }

    if (fallback.length === 0) {
      fallback.push({
        id: "activity-empty",
        iconKey: "project",
        tone: "blue",
        title: "Workspace ready",
        subtitle: "Start a proposal to populate your dashboard activity feed.",
        timeLabel: "Now",
        onClick: () => navigate("/service"),
      });
    }

    return fallback.slice(0, 4);
  }, [freelancers, navigate, notifications, savedProposal, uniqueProjects]);

  const showcaseItems = useMemo(() => {
    return normalizeClientProjects(uniqueProjects)
      .map((project) => buildProjectCardModel(project))
      .filter((project) => project.statusMeta.label !== "Completed")
      .slice(0, 3);
  }, [uniqueProjects]);

  const activeChats = useMemo(
    () =>
      freelancers.slice(0, 2).map((freelancer, index) => ({
        id: freelancer?.chatId || freelancer?.id || `chat-${index}`,
        name: freelancer?.fullName || freelancer?.name || "Freelancer",
        initial:
          (freelancer?.fullName || freelancer?.name || "F").charAt(0).toUpperCase(),
        avatar: freelancer?.avatar || "",
        subtitle:
          freelancer?.projectTitle ||
          (Array.isArray(freelancer?.skills) && freelancer.skills.length > 0
            ? freelancer.skills[0]
            : "Active conversation"),
        message: getChatMessagePreview(freelancer?.lastMessage),
        isOnline: index === 0,
        onClick: () =>
          navigate(
            freelancer?.projectId
              ? `/client/messages?projectId=${encodeURIComponent(freelancer.projectId)}`
              : "/client/messages",
          ),
      })),
    [freelancers, navigate],
  );

  const appointmentProject = useMemo(
    () =>
      uniqueProjects.find((project) => {
        const status = String(project?.status || "").toUpperCase();
        return ["IN_PROGRESS", "AWAITING_PAYMENT", "OPEN"].includes(status);
      }) || null,
    [uniqueProjects],
  );

  const appointmentManager = useMemo(() => {
    const manager = appointmentProject?.manager;
    if (
      manager?.role === "PROJECT_MANAGER" &&
      String(manager?.status || "").toUpperCase() === "ACTIVE"
    ) {
      return manager;
    }
    return manager || null;
  }, [appointmentProject?.manager]);

  const appointmentCard = useMemo(
    () => ({
      managerName: appointmentManager?.fullName || "Project Catalyst",
      managerStatus: appointmentManager ? "Available Today" : "Available on request",
      avatar: appointmentManager?.avatar || "",
      initial:
        (appointmentManager?.fullName || "P").charAt(0).toUpperCase(),
      dateLabel: formatDashboardDate(new Date()),
      slots: DASHBOARD_APPOINTMENT_SLOTS,
      projectTitle: appointmentProject?.title || null,
      onBook: () => setBookAppointmentOpen(true),
    }),
    [appointmentManager, appointmentProject?.title],
  );

  return (
    <>
      <ClientDashboardShell
        profile={profile}
        metrics={dashboardMetricCards}
        showcaseItems={showcaseItems}
        recentActivities={recentActivities}
        hero={hero}
        unreadCount={unreadCount}
        draftProposalRows={draftProposalRows}
        interestedFreelancers={interestedFreelancerRows}
        interestedFreelancersCount={Math.max(
          interestedFreelancerRows.length,
          Array.isArray(freelancers) ? freelancers.length : 0,
        )}
        progressProjects={progressProjects}
        onSiteNav={handleSiteNav}
        onDashboardNav={handleDashboardNav}
        onOpenNotifications={handleOpenNotifications}
        onOpenProfile={() => navigate("/client/profile")}
        onOpenQuickProject={handleOpenQuickProject}
        onOpenViewProposals={handleOpenViewProposals}
        onOpenViewProjects={handleOpenViewProjects}
        onOpenHireFreelancer={handleOpenHireFreelancer}
        onPayRunningProject={handlePaymentClick}
        runningProjectProcessingId={isProcessingPayment ? projectToPay?.id : null}
        onViewProject={(projectId) => navigate(`/client/project/${encodeURIComponent(projectId)}`)}
      />
      {renderLegacyDashboard && (
      <div className="flex-1 flex flex-col relative h-full overflow-hidden bg-background transition-colors duration-300">
      <ClientTopBar label="Dashboard" />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 z-10 relative scroll-smooth">
        <div className="max-w-400 mx-auto">
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
                    Here&apos;s what&apos;s happening in your Executive Control Room
                    today.
                  </p>
                </div>
              </div>

              {/* Stats Cards */}
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatsCard
                  title="Total Spent"
                  value={formatINR(metrics.totalSpent)}
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
                  value={formatINR(metrics.totalBudget)}
                  trend="Allocated budget"
                  trendType="neutral"
                  accentColor="green" // Changed to green for budget
                />
              </div>

              {/* Saved Proposal Workspace */}
              {savedProposal && (
                <Card className="border-primary/25 bg-linear-to-br from-primary/10 via-background to-background">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                          <Send className="w-5 h-5 text-primary" />
                          Proposal Workspace
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Review, compare, and send the right proposal faster.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => setShowViewProposal(true)}
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={openEditProposal}
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            const remaining = savedProposals.filter(
                              (proposal) => proposal.id !== savedProposal.id,
                            );
                            const nextActiveId = remaining[0]?.id || null;
                            if (!remaining.length && storageKeys?.singleKey) {
                              localStorage.removeItem(storageKeys.singleKey);
                            }
                            persistSavedProposalState(remaining, nextActiveId);
                            toast.success("Proposal deleted");
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                      <div className="xl:col-span-4 space-y-3">
                        <div className="rounded-lg border border-border/70 bg-background/70 px-3 py-2.5">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                            Saved Proposals
                          </p>
                          <p className="text-sm font-medium mt-1">
                            {savedProposals.length} draft
                            {savedProposals.length > 1 ? "s" : ""} available
                          </p>
                        </div>
                        <div className="max-h-105 overflow-y-auto pr-2 space-y-2 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
                          {savedProposals.map((proposal) => {
                            const isActive = proposal.id === savedProposal.id;
                            return (
                              <button
                                type="button"
                                key={proposal.id}
                                onClick={() => {
                                  if (proposal.id === savedProposal.id) return;
                                  setActiveProposalId(proposal.id);
                                  persistActiveProposalSelection(
                                    savedProposals,
                                    proposal.id,
                                    storageKeys,
                                  );
                                }}
                                className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${isActive
                                  ? "border-primary/50 bg-primary/10"
                                  : "border-border/70 bg-background/70 hover:bg-background"
                                  }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-semibold line-clamp-2">
                                    {resolveProposalTitle(proposal)}
                                  </p>
                                  {isActive && (
                                    <Badge className="bg-primary text-primary-foreground text-[10px] uppercase tracking-wide">
                                      Active
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {resolveProposalServiceLabel(proposal)}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  <Badge variant="outline" className="text-[11px]">
                                    {formatBudget(proposal.budget)}
                                  </Badge>
                                  <Badge variant="outline" className="text-[11px]">
                                    {proposal.timeline || "Timeline not set"}
                                  </Badge>
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-2">
                                  Updated {formatProposalUpdatedAt(proposal)}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="xl:col-span-8 space-y-3">
                        <div className="rounded-xl border border-border/70 bg-background/70 p-4 space-y-2">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h4 className="text-base md:text-lg font-semibold">
                              {resolveProposalTitle(savedProposal)}
                            </h4>
                            <Badge variant="secondary" className="text-xs">
                              {resolveProposalServiceLabel(savedProposal)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {parsedSavedProposal.overview ||
                              parsedSavedProposal.cleanContent ||
                              "No description added yet."}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="rounded-lg border border-border/70 bg-background/70 p-3">
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                              Budget
                            </p>
                            <p className="text-sm font-semibold mt-1">
                              {formatBudget(savedProposal.budget)}
                            </p>
                          </div>
                          <div className="rounded-lg border border-border/70 bg-background/70 p-3">
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                              Timeline
                            </p>
                            <p className="text-sm font-semibold mt-1">
                              {savedProposal.timeline || "Not set"}
                            </p>
                          </div>
                          <div className="rounded-lg border border-border/70 bg-background/70 p-3">
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                              Last Updated
                            </p>
                            <p className="text-sm font-semibold mt-1">
                              {formatProposalUpdatedAt(savedProposal)}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="rounded-lg border border-border/70 bg-background/70 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                              Objectives
                            </p>
                            {parsedSavedProposal.objectives.length > 0 ? (
                              <ul className="space-y-1.5">
                                {parsedSavedProposal.objectives
                                  .slice(0, 4)
                                  .map((objective, index) => (
                                    <li
                                      key={`${objective}-${index}`}
                                      className="text-sm text-foreground/90 leading-snug"
                                    >
                                      {objective}
                                    </li>
                                  ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No objectives extracted yet.
                              </p>
                            )}
                          </div>

                          <div className="rounded-lg border border-border/70 bg-background/70 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                              Key Features
                            </p>
                            {parsedSavedProposal.features.length > 0 ? (
                              <ul className="space-y-1.5">
                                {parsedSavedProposal.features
                                  .slice(0, 4)
                                  .map((feature, index) => (
                                    <li
                                      key={`${feature}-${index}`}
                                      className="text-sm text-foreground/90 leading-snug"
                                    >
                                      {feature}
                                    </li>
                                  ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No features extracted yet.
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <Button
                            className="gap-2"
                            onMouseEnter={primeFreelancerPool}
                            onFocus={primeFreelancerPool}
                            onClick={openFreelancerSelection}
                            disabled={isSendingProposal}
                          >
                            {isSendingProposal ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                            {isSendingProposal ? "Sending..." : "Send Proposal To Freelancer"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Active Projects Table - Only show when projects exist */}
              {/* Active Projects Table - IN_PROGRESS & AWAITING_PAYMENT */}
              {(() => {
                const activeProjectsList = uniqueProjects.filter(
                  (p) =>
                    p.status === "IN_PROGRESS" ||
                    (p.status === "AWAITING_PAYMENT" &&
                      (p.proposals || []).some(
                        (pr) => (pr.status || "").toUpperCase() === "ACCEPTED",
                      )),
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
                                (p.status || "").toUpperCase() === "ACCEPTED",
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
                                      project.createdAt,
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
                                            0,
                                          ) || "F"}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-sm">
                                        {acceptedProposal.freelancer.fullName?.split(
                                          " ",
                                        )[0] || "Freelancer"}
                                      </span>
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm font-medium">
                                    {formatINR(project.budget || 0)}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  {project.paymentPlan?.nextDueInstallment ? (
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-white h-8 w-full sm:w-auto text-xs sm:text-sm font-medium shadow-sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePaymentClick(project);
                                      }}
                                    >
                                      {isProcessingPayment && projectToPay?.id === project.id ? "Processing..." : `Pay ${project.paymentPlan.nextDueInstallment.percentage}%`}
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-muted-foreground hover:text-primary"
                                      onClick={() =>
                                        navigate(
                                          `/client/project/${project.id}`,
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
                        (prop.status || "").toUpperCase(),
                      ) && !prop.deletedAt,
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
                                      project.createdAt,
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
                                          "PENDING",
                                      )
                                      .sort(
                                        (a, b) =>
                                          new Date(b.createdAt) -
                                          new Date(a.createdAt),
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
                                                      0,
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
                                                0,
                                              ) || "F"}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="text-sm italic">
                                            Invited:{" "}
                                            {
                                              pendingProposal.freelancer.fullName?.split(
                                                " ",
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
                                    {formatINR(project.budget || 0)}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  {(() => {
                                    // Compute available actions for this proposal row
                                    const pendingProposals = (
                                      project.proposals || []
                                    ).filter(
                                      (p) =>
                                        (p.status || "").toUpperCase() ===
                                        "PENDING",
                                    );
                                    const hasAnyProposalAction =
                                      pendingProposals.length > 0 ||
                                      (project.proposals || []).some(
                                        (p) =>
                                          (p.status || "").toUpperCase() ===
                                          "ACCEPTED",
                                      );
                                    const twentyFourHoursAgo =
                                      Date.now() - 24 * 60 * 60 * 1000;
                                    const hasOldPendingProposal =
                                      pendingProposals.some(
                                        (p) =>
                                          new Date(p.createdAt).getTime() <
                                          twentyFourHoursAgo,
                                      );

                                    if (!hasAnyProposalAction) {
                                      return (
                                        <span className="text-xs text-muted-foreground">
                                          No action
                                        </span>
                                      );
                                    }

                                    // Keep budget escalation for stale pending invites
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
                                      <Button
                                        size="sm"
                                        className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(
                                            `/client/proposal?projectId=${encodeURIComponent(project.id)}&tab=pending&action=view`,
                                          );
                                        }}
                                      >
                                        Take Action
                                      </Button>
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
            <div className="lg:w-90 shrink-0 flex flex-col gap-6">
              {/* Action Center */}
              <Card className="rounded-xl bg-zinc-100 dark:bg-zinc-900/50 text-foreground border-border/50 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Zap className="w-5 h-5" /> Action Center
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <Button
                    className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                    onClick={() => navigate("/service")}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Proposal
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full rounded-xl bg-background hover:bg-background/80 text-foreground border-border/10 shadow-sm"
                    onClick={() => navigate("/client/proposal")}
                  >
                    View Proposal
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl bg-background hover:bg-background/80 text-foreground border-border/10 shadow-sm"
                    onClick={() => navigate("/client/project")}
                  >
                    View Projects
                  </Button>
                </CardContent>
              </Card>

              {/* Talent Snapshot */}
              <Card className="rounded-xl border-border/60">
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
                              `/client/messages?projectId=${f.projectId}`,
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
                            (p.status || "").toUpperCase(),
                          ),
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
                              className={`absolute -left-3.75 top-3 h-3.5 w-3.5 rounded-full border-2 border-background ${idx === 0
                                ? "bg-primary"
                                : "bg-muted-foreground/50"
                                }`}
                            />
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 ml-2">
                              <span className="text-xs font-bold text-muted-foreground w-16 shrink-0">
                                {new Date(
                                  project.updatedAt || project.createdAt,
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
      </div>
      )}

      <ViewProposalDialog
        open={showViewProposal}
        onOpenChange={setShowViewProposal}
        savedProposal={savedProposal}
        resolveProposalTitle={resolveProposalTitle}
        formatBudget={formatBudget}
        onEditProposal={openEditProposal}
      />

      <EditProposalDialog
        open={showEditProposal}
        onOpenChange={setShowEditProposal}
        editForm={editForm}
        setEditForm={setEditForm}
        onSaveChanges={saveProposalChanges}
      />

      <Dialog
        open={showIncreaseBudget}
        onOpenChange={handleIncreaseBudgetDialogChange}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Increase Budget</DialogTitle>
            <DialogDescription>
              Update the budget for {budgetProject?.title || "this project"} so
              freelancers see the latest amount after the 30% platform margin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                Current Budget
              </p>
              <p className="mt-1 text-lg font-semibold">
                {formatINR(budgetProject?.budget || 0)}
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="dashboard-budget-input" className="text-sm font-medium">
                New Budget
              </label>
              <Input
                id="dashboard-budget-input"
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
                placeholder="e.g. 60000 or INR 60,000"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleIncreaseBudgetDialogChange(false)}
            >
              Cancel
            </Button>
            <Button onClick={updateBudget} disabled={isUpdatingBudget}>
              {isUpdatingBudget ? "Updating..." : "Update Budget"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBudgetReminder} onOpenChange={setShowBudgetReminder}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Pending proposals need attention</DialogTitle>
            <DialogDescription>
              Some invited freelancers have not responded for more than 24 hours.
              You can review them or increase the budget to improve conversion.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {oldPendingProjects.slice(0, 3).map((project) => (
              <div
                key={project.id}
                className="rounded-lg border border-border/70 bg-background/70 p-3"
              >
                <p className="font-medium">{project.title}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Current budget: {formatINR(project.budget || 0)}
                </p>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBudgetReminder(false)}>
              Later
            </Button>
            <Button
              onClick={() => {
                setShowBudgetReminder(false);
                navigate("/client/proposal");
              }}
            >
              Review proposals
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BookAppointment
        isOpen={bookAppointmentOpen}
        onClose={() => setBookAppointmentOpen(false)}
        projectId={appointmentProject?.id || null}
        projectTitle={appointmentProject?.title || null}
      />

      {/* Freelancer Selection Dialog */}
      <FreelancerSelectionDialog
        open={showFreelancerSelect}
        onOpenChange={setShowFreelancerSelect}
        savedProposal={savedProposal}
        isLoadingFreelancers={isFreelancersLoading}
        isSendingProposal={isSendingProposal}
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
        onSendProposal={(freelancer) => {
          setShowFreelancerSelect(false);
          sendProposalToFreelancer(freelancer);
        }}
        collectFreelancerSkillTokens={collectFreelancerSkillTokens}
        freelancerMatchesRequiredSkill={freelancerMatchesRequiredSkill}
        generateGradient={generateGradient}
        formatRating={formatRating}
      />

      {/* Freelancer Profile Dialog */}
      <FreelancerProfileDialog
        open={showFreelancerProfile}
        onOpenChange={setShowFreelancerProfile}
        viewingFreelancer={viewingFreelancer}
      />

      {/* Suspension Alert */}
      <SuspensionAlert
        open={showSuspensionAlert}
        onOpenChange={setShowSuspensionAlert}
        suspendedAt={sessionUser?.suspendedAt}
      />
    </>
  );
};

const ClientDashboard = () => <ClientDashboardContent />;

export default ClientDashboard;
