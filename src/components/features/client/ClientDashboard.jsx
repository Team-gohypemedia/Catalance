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
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import { useNavigate } from "react-router-dom";
import { RoleAwareSidebar } from "@/components/layout/RoleAwareSidebar";
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
import {
  listFreelancers,
  fetchChatConversations,
  API_BASE_URL,
} from "@/shared/lib/api-client";
import { toast } from "sonner";
import { useAuth } from "@/shared/context/AuthContext";
import { SuspensionAlert } from "@/components/ui/suspension-alert";
import { ClientTopBar } from "@/components/features/client/ClientTopBar";
import FreelancerDetailsDialog from "@/components/features/client/dashboard/FreelancerDetailsDialog";
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

const buildUrl = (path) => `${API_BASE_URL}${path.replace(/^\/api/, "")}`;
const getProposalStorageKeys = (userId) => {
  const suffix = userId ? `:${userId}` : "";
  return {
    listKey: `markify:savedProposals${suffix}`,
    singleKey: `markify:savedProposal${suffix}`,
    syncedKey: `markify:savedProposalSynced${suffix}`,
  };
};

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
      /Budget[:\s\-\n\u2022]*(?:INR|Rs\.?|₹|ƒ,1)?\s*([\d,]+)\s*(k)?/i,
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

const mergeProposalsBySignature = (base = [], incoming = []) => {
  const merged = [...base];
  incoming.forEach((proposal) => {
    const signature = getProposalSignature(proposal);
    const exists = merged.some(
      (item) => getProposalSignature(item) === signature,
    );
    if (!exists) {
      merged.push(proposal);
    }
  });
  return merged;
};

const loadSavedProposalsFromStorage = (userId) => {
  if (typeof window === "undefined") return { proposals: [], activeId: null };

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

  return { proposals, activeId };
};

const persistSavedProposalsToStorage = (proposals, activeId, storageKeys) => {
  if (typeof window === "undefined") return;
  const keys = storageKeys || getProposalStorageKeys();
  if (!Array.isArray(proposals) || proposals.length === 0) {
    window.localStorage.removeItem(keys.listKey);
    window.localStorage.removeItem(keys.singleKey);
    return;
  }
  window.localStorage.setItem(keys.listKey, JSON.stringify(proposals));
  const active =
    proposals.find((proposal) => proposal.id === activeId) || proposals[0];
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

const shouldHydrateProjectProposal = (project = {}) => {
  const status = String(project?.status || "").toUpperCase();
  const hasProposals =
    Array.isArray(project?.proposals) && project.proposals.length > 0;
  return status === "DRAFT" || hasProposals;
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
  const storageKeys = useMemo(
    () => getProposalStorageKeys(sessionUser?.id),
    [sessionUser?.id],
  );
  const [projects, setProjects] = useState([]);
  const [freelancers, setFreelancers] = useState([]); // Chat freelancers
  const [suggestedFreelancers, setSuggestedFreelancers] = useState([]); // All freelancers for suggestions
  const [isLoading, setIsLoading] = useState(true);
  const [showSuspensionAlert, setShowSuspensionAlert] = useState(false);
  const [savedProposals, setSavedProposals] = useState([]);
  const [activeProposalId, setActiveProposalId] = useState(null);
  const [isSendingProposal, setIsSendingProposal] = useState(false);
  const [isSyncingDrafts, setIsSyncingDrafts] = useState(false);
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
  const [freelancerSearch, setFreelancerSearch] = useState("");
  const [isFreelancersLoading, setIsFreelancersLoading] = useState(false);
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
        if (proposal?.freelancerId && status === "PENDING") {
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

    const available = matched.filter(
      (freelancer) => !alreadyInvitedIds.has(freelancer.id),
    );

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

  const persistSavedProposalState = (
    nextProposals,
    preferredActiveId = null,
  ) => {
    const normalized = Array.isArray(nextProposals)
      ? nextProposals.map(normalizeSavedProposal)
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
  };

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
  ]);

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

      // Check for projects awaiting payment (Auto-show popup)
      const pendingPaymentProject = fetchedProjects.find(
        (p) => p.status === "AWAITING_PAYMENT",
      );
      if (pendingPaymentProject) {
        setProjectToPay(pendingPaymentProject);
        // Only show if not already dismissed in this session
        const hasDismissedPayment = sessionStorage.getItem(
          `dismissedPayment_${pendingPaymentProject.id}`,
        );
        if (!hasDismissedPayment) {
          setShowPaymentConfirm(true);
        }
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

  useEffect(() => {
    if (!Array.isArray(projects) || projects.length === 0) return;

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
  }, [projects, savedProposals, activeProposalId]);

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
          title: resolveProposalTitle(savedProposal),
          description: savedProposal.summary || savedProposal.content || "",
          budget:
            parseInt(
              String(savedProposal.budget || "0").replace(/[^0-9]/g, ""),
            ) || 0,
          timeline: savedProposal.timeline || "1 month",
          status: "OPEN",
        }),
      });

      if (!projectRes.ok) throw new Error("Failed to create project");
      const projectData = await projectRes.json();
      const project = projectData.data.project;
      if (project?.id && savedProposal?.id) {
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
          amount:
            parseInt(
              String(savedProposal.budget || "0").replace(/[^0-9]/g, ""),
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
          `Budget updated to ₹${budgetValue.toLocaleString()}! ${rejectedCount} expired proposal(s) removed. You can now send to new freelancers.`,
        );
      } else {
        // Just updated budget (proposals are still pending, under 48hrs)
        toast.success(
          `Budget updated to ₹${budgetValue.toLocaleString()}! Freelancers will see the new amount.`,
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
    <div className="flex-1 flex flex-col relative h-full overflow-hidden bg-background transition-colors duration-300">
      <ClientTopBar label="Dashboard" />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 z-10 relative scroll-smooth">
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

              {/* Saved Proposal Workspace */}
              {savedProposal && (
                <Card className="border-primary/25 bg-gradient-to-br from-primary/10 via-background to-background">
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
                        <div className="max-h-[420px] overflow-y-auto pr-2 space-y-2 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
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
                                className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${
                                  isActive
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
                          >
                            <Send className="w-4 h-4" />
                            Send Proposal To Freelancer
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
                        (prop.status || "").toUpperCase(),
                      ),
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
                  }, {}),
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

                                  // Archive (soft delete) in database to persist across devices
                                  for (const projectId of relatedProjectIds) {
                                    try {
                                      await authFetch(
                                        `/projects/${projectId}`,
                                        {
                                          method: "PATCH",
                                          headers: {
                                            "Content-Type": "application/json",
                                          },
                                          body: JSON.stringify({
                                            status: "ARCHIVED",
                                          }),
                                        },
                                      );
                                    } catch (err) {
                                      console.error(
                                        `Failed to archive project ${projectId}:`,
                                        err,
                                      );
                                    }
                                  }

                                  // Update local list of dismissed IDs
                                  const newDismissed = [
                                    ...dismissedProjectIds,
                                    ...relatedProjectIds,
                                  ];
                                  setDismissedProjectIds(newDismissed);
                                  localStorage.setItem(
                                    "markify:dismissedExpiredProposals",
                                    JSON.stringify(newDismissed),
                                  );

                                  // Refresh projects list
                                  loadProjects();

                                  toast.success(
                                    "Expired proposal removed permanently",
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
                                          signature,
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
                                            : proposal,
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
                                      nextActiveId,
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
                      {resolveProposalTitle(savedProposal)}
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
                      onClick={() => {
                        setShowPaymentConfirm(false);
                        if (projectToPay) {
                          sessionStorage.setItem(
                            `dismissedPayment_${projectToPay.id}`,
                            "true",
                          );
                        }
                      }}
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

              <FreelancerSelectionDialog
                open={showFreelancerSelect}
                onOpenChange={setShowFreelancerSelect}
                savedProposal={savedProposal}
                isLoadingFreelancers={isFreelancersLoading}
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
                onSendProposal={handleSendClick}
                collectFreelancerSkillTokens={collectFreelancerSkillTokens}
                freelancerMatchesRequiredSkill={freelancerMatchesRequiredSkill}
                generateGradient={generateGradient}
                formatRating={formatRating}
              />

              <FreelancerProfileDialog
                open={showFreelancerProfile}
                onOpenChange={setShowFreelancerProfile}
                viewingFreelancer={viewingFreelancer}
              />

              <ViewProposalDialog
                open={showViewProposal}
                onOpenChange={setShowViewProposal}
                savedProposal={savedProposal}
                resolveProposalTitle={resolveProposalTitle}
                formatBudget={formatBudget}
                onEditProposal={() => {
                  setShowViewProposal(false);
                  setEditForm({
                    title: savedProposal?.projectTitle || "",
                    summary: savedProposal?.summary || savedProposal?.content || "",
                    budget: savedProposal?.budget || "",
                    timeline: savedProposal?.timeline || "",
                  });
                  setShowEditProposal(true);
                }}
              />

              <EditProposalDialog
                open={showEditProposal}
                onOpenChange={setShowEditProposal}
                editForm={editForm}
                setEditForm={setEditForm}
                onSaveChanges={() => {
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
                      : proposal,
                  );
                  persistSavedProposalState(nextProposals, savedProposal.id);
                  setShowEditProposal(false);
                  toast.success("Proposal updated!");
                }}
              />

              <FreelancerDetailsDialog
                open={showFreelancerDetails}
                onOpenChange={setShowFreelancerDetails}
                viewFreelancer={viewFreelancer}
              />
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
                                        "PENDING",
                                    );
                                    const twentyFourHoursAgo =
                                      Date.now() - 24 * 60 * 60 * 1000;
                                    const hasOldPendingProposal =
                                      pendingProposals.some(
                                        (p) =>
                                          new Date(p.createdAt).getTime() <
                                          twentyFourHoursAgo,
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
                              className={`absolute -left-[15px] top-3 h-3.5 w-3.5 rounded-full border-2 border-background ${
                                idx === 0
                                  ? "bg-primary"
                                  : "bg-muted-foreground/50"
                              }`}
                            />
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 ml-2">
                              <span className="text-xs font-bold text-muted-foreground w-16 flex-shrink-0">
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



