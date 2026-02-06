import { useState, useRef, useEffect, Fragment } from "react";
import { useLocation } from "react-router-dom";
import { API_BASE_URL } from "@/shared/lib/api-client";
import { useAuth } from "@/shared/context/AuthContext";
import { cn } from "@/shared/lib/utils";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import ArrowUp from "lucide-react/dist/esm/icons/arrow-up";
import Square from "lucide-react/dist/esm/icons/square";
import Plus from "lucide-react/dist/esm/icons/plus";
import Brain from "lucide-react/dist/esm/icons/brain";
import Bot from "lucide-react/dist/esm/icons/bot";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Mic from "lucide-react/dist/esm/icons/mic";
import { ProposalSidebar } from "@/components/features/ai/elements/proposal-sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import X from "lucide-react/dist/esm/icons/x";
import { toast } from "sonner";
import {
  Confirmation,
  ConfirmationAccepted,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRejected,
  ConfirmationRequest,
  ConfirmationTitle,
} from "@/components/ai-elements/confirmation";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageResponseTyping,
} from "@/components/ai-elements/message";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Plan,
  PlanAction,
  PlanContent,
  PlanHeader,
  PlanTitle,
  PlanTrigger,
} from "@/components/ai-elements/plan";

const DEFAULT_API_BASE = "http://localhost:5000/api";
const API_ROOT = API_BASE_URL || DEFAULT_API_BASE;
const API_URL = `${API_ROOT}/ai`;
const PROPOSAL_CONTEXT_KEY = "proposal_context";
const PROPOSAL_CONTENT_KEY = "proposal_content";
const CHAT_HISTORY_KEY = "chat_history";
const PROPOSAL_APPROVAL_MESSAGE =
  "You're all set to generate the proposal. Please confirm below.";

const WEBSITE_REQUIREMENT_OPTIONS = [
  "New website",
  "Revamping existing website",
];
const WEBSITE_OBJECTIVE_OPTIONS = [
  "Generating leads",
  "Selling products or services online",
  "Building brand credibility",
  "Showcasing work or portfolio",
];
const WEBSITE_TYPE_OPTIONS = [
  "E-commerce",
  "Informational / Corporate",
  "Portfolio / Personal Brand",
  "Blog / News / Magazine",
  "SaaS / Software",
  "Landing Page (Single Product)",
  "Restaurant / Cafe",
  "Real Estate",
  "Education / Courses",
  "Healthcare / Clinic",
  "Nonprofit / NGO",
  "Community Forum / Membership",
  "Marketplace / Multi-vendor",
  "Booking (Hotel / Salon / Travel)",
];
const DESIGN_EXPERIENCE_OPTIONS = [
  "Clean and simple design",
  "Premium and modern UI",
  "Interactive or 3D-based design",
];
const BUILD_TYPE_OPTIONS = ["Platform-based website", "Coded website"];
const PLATFORM_OPTIONS = [
  "WordPress",
  "Shopify",
  "WooCommerce (WordPress)",
  "Webflow",
  "Wix",
  "Squarespace",
  "Framer",
  "Magento / Adobe Commerce",
  "BigCommerce",
  "Bubble (No-code)",
  "Other (Specify)",
];
const FRONTEND_FRAMEWORK_OPTIONS = [
  "Next.js (React)",
  "React (SPA)",
  "Nuxt (Vue)",
  "Vue (SPA)",
  "Angular",
  "SvelteKit",
  "Remix (React)",
  "Gatsby (React)",
  "Astro",
  "Qwik",
  "SolidJS",
  "HTML/CSS/JS (Custom)",
];
const BACKEND_TECHNOLOGY_OPTIONS = [
  "Node.js (Express)",
  "Node.js (NestJS)",
  "Laravel (PHP)",
  "Django (Python)",
  "FastAPI (Python)",
  "Ruby on Rails",
  ".NET (C#)",
  "Spring Boot (Java)",
  "Node.js (Fastify)",
  "Go (Gin)",
  "Phoenix (Elixir)",
  "Rust (Actix)",
  "Serverless Functions",
  "No custom backend (Frontend + APIs only)",
];
const DATABASE_OPTIONS = [
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Firebase / Firestore",
  "Supabase",
  "SQLite",
  "MariaDB",
  "Redis",
  "DynamoDB",
  "CockroachDB",
  "No database needed",
];
const HOSTING_OPTIONS = [
  "Vercel",
  "Netlify",
  "AWS",
  "DigitalOcean",
  "Firebase Hosting",
  "Shared Hosting / cPanel",
  "Render",
  "Fly.io",
  "Railway",
  "Heroku",
  "Google Cloud",
  "Azure",
  "Cloudflare Pages",
  "Other (Specify)",
];
const PAGE_COUNT_OPTIONS = ["1-5 pages", "6-10 pages", "More than 10 pages"];

const toStorageKeyPart = (value) => {
  if (typeof value !== "string") return "general";
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "general";
};

const sanitizeAssistantContent = (content = "") => {
  if (typeof content !== "string") return "";
  const lines = content
    .split("\n")
    .map((line) =>
      line.replace(/^\s*(?:-|\*)?\s*(?:your\s+)?options are\s*:?\s*/i, ""),
    )
    .filter(
      (line) =>
        !/^\s*(?:-|\*)?\s*if you don't see what you need, kindly type it below\.?\s*$/i.test(
          line,
        ),
    );

  return lines
    .join("\n")
    .replace(/\s*\[blocked\]\s*/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
};

const buildConversationHistory = (history) =>
  history
    .filter((msg) => msg && msg.content && !msg.isError)
    .map(({ role, content }) => ({ role, content }));

const normalizeServiceLabel = (value = "") =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const tokenizeServiceLabel = (value = "") =>
  normalizeServiceLabel(value).split(/\s+/).filter(Boolean);

const normalizeTextForMatch = (value = "") =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const parseQuantityValue = (text = "") => {
  if (typeof text !== "string") return null;
  const matches = text.match(/\d+/g);
  if (!matches || matches.length === 0) return null;
  const values = matches
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isFinite(value));
  if (!values.length) return null;
  return Math.max(...values);
};

const findLatestAnswerForQuestion = (messages = [], questionText = "") => {
  if (!Array.isArray(messages) || messages.length < 2) return null;
  const target = normalizeTextForMatch(questionText);
  if (!target) return null;

  for (let i = messages.length - 1; i >= 1; i -= 1) {
    const userMessage = messages[i];
    const assistantMessage = messages[i - 1];
    if (assistantMessage?.role !== "assistant" || userMessage?.role !== "user")
      continue;
    const assistantText =
      typeof assistantMessage.content === "string"
        ? assistantMessage.content
        : "";
    if (!assistantText) continue;
    const normalizedAssistant = normalizeTextForMatch(assistantText);
    if (normalizedAssistant.includes(target)) {
      return typeof userMessage.content === "string"
        ? userMessage.content
        : "";
    }
  }

  return null;
};

const findMatchingService = (
  services = [],
  serviceName = "",
  serviceId = "",
) => {
  if (!Array.isArray(services) || services.length === 0) return null;
  const lookup = [serviceName, serviceId].filter(Boolean).join(" ").trim();
  if (!lookup) return null;

  const normalized = normalizeServiceLabel(lookup);
  let bestMatch = null;
  let bestScore = 0;

  services.forEach((service) => {
    const nameNormalized = normalizeServiceLabel(service?.name || "");
    const idNormalized = normalizeServiceLabel(service?.id || "");
    let score = 0;

    if (nameNormalized === normalized || idNormalized === normalized)
      score += 5;
    if (
      nameNormalized &&
      (nameNormalized.includes(normalized) ||
        normalized.includes(nameNormalized))
    ) {
      score += 3;
    }
    if (
      idNormalized &&
      (idNormalized.includes(normalized) || normalized.includes(idNormalized))
    ) {
      score += 2;
    }

    const candidateTokens = new Set(
      tokenizeServiceLabel(`${service?.name || ""} ${service?.id || ""}`),
    );
    tokenizeServiceLabel(lookup).forEach((token) => {
      if (candidateTokens.has(token)) score += 1;
    });

    if (score > bestScore) {
      bestScore = score;
      bestMatch = service;
    }
  });

  return bestScore > 0 ? bestMatch : null;
};

const parseBudgetValue = (text = "") => {
  if (typeof text !== "string") return null;
  const budgetRegex =
    /(?:\u20B9|rs\.?|inr|\$|usd|eur|gbp)?\s*([\d,]+(?:\.\d+)?)\s*(lakh|lac|l|k|thousand)?/gi;
  const matches = Array.from(text.matchAll(budgetRegex));
  if (!matches.length) return null;

  const values = matches
    .map((match) => {
      const amount = Number.parseFloat(match[1].replace(/,/g, ""));
      if (!Number.isFinite(amount)) return null;

      let multiplier = 1;
      if (/lakh|lac|l/i.test(match[2] || "")) multiplier = 100000;
      else if (/k|thousand/i.test(match[2] || "")) multiplier = 1000;

      return amount * multiplier;
    })
    .filter((value) => Number.isFinite(value));

  if (!values.length) return null;
  return Math.max(...values);
};


const getStoredJson = (key, fallback) => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.error(`Failed to read ${key}:`, error);
    return fallback;
  }
};

const setStoredJson = (key, value) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to write ${key}:`, error);
  }
};

const createEmptyProposalContext = (serviceName = "") => ({
  clientName: "",
  companyName: "",
  companyBackground: "",
  websiteRequirement: "",
  objectives: [],
  websiteType: "",
  designExperience: "",
  buildType: "",
  platformPreference: "",
  frontendFramework: "",
  backendTechnology: "",
  database: "",
  hosting: "",
  pageCount: "",
  requirements: [],
  scope: {
    features: [],
    deliverables: [],
  },
  timeline: "",
  budget: "",
  constraints: [],
  preferences: [],
  contactInfo: {
    email: "",
    phone: "",
  },
  notes: "",
  serviceName: serviceName || "",
});

const normalizeList = (items) =>
  Array.isArray(items)
    ? items
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean)
    : [];

const mergeLists = (baseList, nextList) => {
  const base = normalizeList(baseList);
  const next = normalizeList(nextList);
  const seen = new Set(base.map((item) => item.toLowerCase()));
  const merged = [...base];
  next.forEach((item) => {
    const key = item.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(item);
    }
  });
  return merged;
};

const mergeText = (base, next) => {
  const normalized = typeof next === "string" ? next.trim() : "";
  return normalized ? normalized : base;
};

const mergeProposalContext = (baseContext, update) => {
  const base = baseContext || createEmptyProposalContext();
  const next = update || {};

  return {
    ...base,
    clientName: mergeText(base.clientName, next.clientName),
    companyName: mergeText(base.companyName, next.companyName),
    companyBackground: mergeText(
      base.companyBackground,
      next.companyBackground,
    ),
    websiteRequirement: mergeText(
      base.websiteRequirement,
      next.websiteRequirement,
    ),
    objectives: mergeLists(base.objectives, next.objectives),
    websiteType: mergeText(base.websiteType, next.websiteType),
    designExperience: mergeText(base.designExperience, next.designExperience),
    buildType: mergeText(base.buildType, next.buildType),
    platformPreference: mergeText(
      base.platformPreference,
      next.platformPreference,
    ),
    frontendFramework: mergeText(
      base.frontendFramework,
      next.frontendFramework,
    ),
    backendTechnology: mergeText(
      base.backendTechnology,
      next.backendTechnology,
    ),
    database: mergeText(base.database, next.database),
    hosting: mergeText(base.hosting, next.hosting),
    pageCount: mergeText(base.pageCount, next.pageCount),
    requirements: mergeLists(base.requirements, next.requirements),
    timeline: mergeText(base.timeline, next.timeline),
    budget: mergeText(base.budget, next.budget),
    constraints: mergeLists(base.constraints, next.constraints),
    preferences: mergeLists(base.preferences, next.preferences),
    notes: mergeText(base.notes, next.notes),
    serviceName: mergeText(base.serviceName, next.serviceName),
    scope: {
      features: mergeLists(base.scope?.features, next.scope?.features),
      deliverables: mergeLists(
        base.scope?.deliverables,
        next.scope?.deliverables,
      ),
    },
    contactInfo: {
      email: mergeText(base.contactInfo?.email, next.contactInfo?.email),
      phone: mergeText(base.contactInfo?.phone, next.contactInfo?.phone),
    },
  };
};

const getLastAssistantMessage = (history) => {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const msg = history[i];
    if (msg?.role === "assistant" && msg?.content) {
      return msg.content;
    }
  }
  return "";
};

const parseNumberedOptions = (assistantText = "") => {
  const options = new Map();
  assistantText.split("\n").forEach((line) => {
    const match = line.match(/^\s*(\d+)[.)]\s*(.+)$/);
    if (match) {
      options.set(Number(match[1]), match[2].trim());
    }
  });
  return options;
};

const parseSelectionsFromText = (text, options) => {
  const selections = new Set();
  const rawText = typeof text === "string" ? text : "";
  const maxOption = options?.size || 0;

  if (maxOption) {
    const rangeRegex = /(\d+)\s*(?:-|to)\s*(\d+)/gi;
    let rangeMatch = null;
    while ((rangeMatch = rangeRegex.exec(rawText)) !== null) {
      const start = Number.parseInt(rangeMatch[1], 10);
      const end = Number.parseInt(rangeMatch[2], 10);
      if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
      const min = Math.min(start, end);
      const max = Math.max(start, end);
      if (min < 1 || max > maxOption) continue;
      for (let i = min; i <= max; i += 1) {
        const option = options.get(i);
        if (option) selections.add(option);
      }
    }
  }

  const numbers = rawText.match(/\b\d+\b/g) || [];
  numbers.forEach((value) => {
    const option = options.get(Number(value));
    if (option) selections.add(option);
  });

  if (options.size > 0) {
    const lowered = rawText.toLowerCase();
    if (/\ball\b/i.test(lowered)) {
      options.forEach((option) => {
        selections.add(option);
      });
      return Array.from(selections);
    }
    options.forEach((option) => {
      if (lowered.includes(option.toLowerCase())) {
        selections.add(option);
      }
    });
  }

  return Array.from(selections);
};

const extractListItems = (text) => {
  const lines = text.split("\n").map((line) => line.trim());
  const bullets = lines
    .map((line) => line.match(/^[-*]\s+(.*)$/))
    .filter(Boolean)
    .map((match) => match[1].trim())
    .filter(Boolean);
  return bullets;
};

const splitMultiSelectItems = (text = "") => {
  if (typeof text !== "string") return [];
  const listItems = extractListItems(text);
  if (listItems.length) return listItems;
  const normalized = text.replace(/\band\b/gi, ",");
  const items = normalized
    .split(",")
    .flatMap((item) => item.split(/[;\/\n]/))
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 1 ? items : [];
};

const extractPlanPayload = (content = "") => {
  if (typeof content !== "string") return null;
  const lines = content.split("\n").map((line) => line.trim());
  if (!lines.length) return null;

  const headerMatch = lines[0].match(/^plan\s*:?\s*(.*)$/i);
  if (!headerMatch) return null;

  const title = headerMatch[1]?.trim() || "Plan";
  const items = [];
  const remainder = [];

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line) continue;
    const bulletMatch = line.match(/^[-*]\s+(.*)$/);
    const numberedMatch = line.match(/^\d+[.)]\s+(.*)$/);
    if (bulletMatch) {
      items.push(bulletMatch[1].trim());
    } else if (numberedMatch) {
      items.push(numberedMatch[1].trim());
    } else {
      remainder.push(line);
    }
  }

  if (!items.length) return null;

  return {
    title,
    items,
    remainder: remainder.join("\n").trim(),
  };
};

const extractTimeline = (text) => {
  const match = text.match(
    /\b\d+\s*(?:-\s*\d+\s*)?(?:day|week|month|hour|year)s?\b/i,
  );
  if (match) return match[0].replace(/\s+/g, " ").trim();
  if (/asap|urgent|immediately/i.test(text)) return "ASAP";
  if (/flexible|no rush|whenever/i.test(text)) return "Flexible";
  return "";
};

const extractEmail = (text) => {
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0] : "";
};

const extractPhone = (text) => {
  const match = text.match(/\+?\d[\d\s()-]{6,}\d/);
  return match ? match[0].trim() : "";
};

const extractPreferenceStatements = (text) => {
  const statements = text
    .split(/[.!?]/)
    .map((part) => part.trim())
    .filter(Boolean);

  const preferences = statements.filter((statement) =>
    /\bprefer|would like|nice to have|should\b/i.test(statement),
  );
  const constraints = statements.filter((statement) =>
    /\bmust|must not|avoid|don't|do not|cannot|can't|no\b/i.test(statement),
  );

  return { preferences, constraints };
};

const toNumberedList = (items = []) =>
  items.map((item, index) => `${index + 1}. ${item}`).join("\n");

const createMissingField = ({
  id,
  label,
  question,
  options = [],
  allowCustom = false,
}) => ({
  id,
  label,
  question,
  options,
  allowCustom,
});

const buildOptionsMap = (options = []) => {
  const map = new Map();
  options.forEach((option, index) => {
    map.set(index + 1, option);
  });
  return map;
};

const parseSelectionsFromOptions = (text, options = []) =>
  parseSelectionsFromText(text, buildOptionsMap(options));

const extractCombinedItems = (text) => splitMultiSelectItems(text);

const getSingleSelection = (text, options = []) => {
  const trimmed = text.trim();
  const selections = options.length
    ? parseSelectionsFromOptions(trimmed, options)
    : [];
  return selections.length ? selections[0] : trimmed;
};

const isNumericChoiceToken = (value = "") =>
  /^\d+(?:\s*(?:-|to)\s*\d+)?$/i.test(String(value).trim());

const getMultiSelection = (text, options = []) => {
  const trimmed = text.trim();
  const selections = options.length
    ? parseSelectionsFromOptions(trimmed, options)
    : [];
  const combinedItems = extractCombinedItems(trimmed);
  const customItems = combinedItems.filter(
    (item) => !isNumericChoiceToken(item),
  );
  const merged = mergeLists(selections, customItems);
  if (merged.length) return merged;
  return trimmed ? [trimmed] : [];
};

const KEYBOARD_MASH_PATTERNS = [
  "qwertyuiop",
  "poiuytrewq",
  "asdfghjkl",
  "lkjhgfdsa",
  "zxcvbnm",
  "mnbvcxz",
];

const isKeyboardMash = (text = "") => {
  if (typeof text !== "string") return false;
  const normalized = text.toLowerCase().replace(/[^a-z]/g, "");
  if (normalized.length < 5) return false;

  return KEYBOARD_MASH_PATTERNS.some((pattern) => {
    for (let i = 0; i <= pattern.length - 5; i += 1) {
      const slice = pattern.slice(i, i + 5);
      if (normalized.includes(slice)) return true;
    }
    return false;
  });
};

const isLowSignalText = (text = "", { minLength = 2 } = {}) => {
  if (typeof text !== "string") return true;
  const trimmed = text.trim();
  if (!trimmed) return true;
  const normalized = trimmed.replace(/\s+/g, "");
  if (normalized.length < minLength) return true;
  if (/^[^a-z0-9]+$/i.test(normalized)) return true;
  if (isKeyboardMash(trimmed)) return true;

  const alnum = normalized.replace(/[^a-z0-9]/gi, "");
  if (alnum.length >= 3) {
    const uniqueChars = new Set(alnum.toLowerCase());
    if (uniqueChars.size <= 1) return true;
  }

  const lettersOnly = normalized.replace(/[^a-z]/gi, "");
  if (!/\s/.test(trimmed) && lettersOnly.length >= 10) {
    const vowelCount = (lettersOnly.match(/[aeiou]/gi) || []).length;
    if (vowelCount / lettersOnly.length < 0.2) return true;
  }

  return false;
};

const isValidPersonName = (value = "") => {
  const trimmed = value.trim();
  if (trimmed.length < 2) return false;
  if (/\d/.test(trimmed)) return false;
  if (!/[\p{L}]/u.test(trimmed)) return false;
  if (/[^'\-\s.\p{L}]/u.test(trimmed)) return false;
  return true;
};

const isValidCompanyName = (value = "") => {
  const trimmed = value.trim();
  if (trimmed.length < 2) return false;
  if (!/[\p{L}]/u.test(trimmed)) return false;
  if (/[^'&\-\s.,\/\p{L}0-9]/u.test(trimmed)) return false;
  return true;
};

const getMinimumAnswerLength = (field) => {
  const questionText = `${field?.question || ""}`.toLowerCase();
  if (field?.id === "clientName" || /your name\??$/.test(questionText)) {
    return 2;
  }
  if (
    (field?.id === "companyName" || /company|business/.test(questionText)) &&
    /name/.test(questionText)
  ) {
    return 2;
  }
  if (/briefly|detail|requirements|about|tell me|describe/.test(questionText)) {
    return 5;
  }
  return 3;
};

const buildClarificationMessage = (field, { isBudget = false } = {}) => {
  const questionText = field?.question || "Could you share that again?";
  const lines = [];

  if (isBudget) {
    lines.push("No worries - a quick budget ballpark will help me continue.");
  } else {
    lines.push("Quick check - I want to make sure I get this right.");
  }

  lines.push("");
  lines.push(questionText);

  if (field?.options?.length) {
    lines.push("");
    lines.push(toNumberedList(field.options));
    lines.push("");
    lines.push("Pick any that fit - multiple is fine.");
    if (field.allowCustom) {
      lines.push("If none fit, just type your own.");
    }
    return lines.join("\n");
  }

  lines.push("");
  if (isBudget) {
    lines.push("A simple number works great (for example: 50,000).");
  } else {
    lines.push("A few words is perfect.");
  }

  return lines.join("\n");
};

const validateMissingFieldAnswer = (field, text) => {
  if (!field || typeof text !== "string") return { valid: true };
  const trimmed = text.trim();
  if (!trimmed) {
    return { valid: false, message: buildClarificationMessage(field) };
  }

  if (field.id === "clientName") {
    if (!isValidPersonName(trimmed)) {
      return { valid: false, message: buildClarificationMessage(field) };
    }
    return { valid: true };
  }

  if (field.id === "companyName") {
    if (!isValidCompanyName(trimmed)) {
      return { valid: false, message: buildClarificationMessage(field) };
    }
    return { valid: true };
  }

  if (field.id === "companyBackground") {
    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
    if (
      (wordCount < 2 && trimmed.length < 10) ||
      isLowSignalText(trimmed, { minLength: 5 })
    ) {
      return { valid: false, message: buildClarificationMessage(field) };
    }
    return { valid: true };
  }

  if (field.id === "budget") {
    if (!parseBudgetValue(trimmed)) {
      return {
        valid: false,
        message: buildClarificationMessage(field, { isBudget: true }),
      };
    }
    return { valid: true };
  }

  const minLength = getMinimumAnswerLength(field);

  if (field.options?.length) {
    const selections = parseSelectionsFromOptions(trimmed, field.options);
    if (selections.length) return { valid: true };

    if (
      field.allowCustom &&
      !isLowSignalText(trimmed, { minLength })
    ) {
      return { valid: true };
    }

    return { valid: false, message: buildClarificationMessage(field) };
  }

  if (field.id === "objectives") {
    const selections = getMultiSelection(trimmed, field.options || []);
    const validSelections = selections.filter(
      (item) => !isLowSignalText(item, { minLength: 3 }),
    );
    if (validSelections.length) return { valid: true };
    return { valid: false, message: buildClarificationMessage(field) };
  }

  if (field.id === "features" || field.id === "requirements") {
    const selections = getMultiSelection(trimmed);
    const validSelections = selections.filter(
      (item) => !isLowSignalText(item, { minLength: 3 }),
    );
    if (validSelections.length) return { valid: true };
    return { valid: false, message: buildClarificationMessage(field) };
  }

  if (isLowSignalText(trimmed, { minLength })) {
    return { valid: false, message: buildClarificationMessage(field) };
  }

  return { valid: true };
};

const appendSpeechTranscript = (baseText, finalText, interimText) => {
  const base = typeof baseText === "string" ? baseText : "";
  const finalValue = typeof finalText === "string" ? finalText.trim() : "";
  const interimValue =
    typeof interimText === "string" ? interimText.trim() : "";
  const suffix = [finalValue, interimValue].filter(Boolean).join(" ").trim();

  if (!suffix) return base;
  if (!base.trim()) return suffix;

  const needsSpace = /\s$/.test(base);
  return `${base}${needsSpace ? "" : " "}${suffix}`;
};

const applyMissingFieldAnswer = (field, text) => {
  if (!field || typeof text !== "string") return {};
  const trimmed = text.trim();
  if (!trimmed) return {};

  switch (field.id) {
    case "clientName":
      return { clientName: trimmed };
    case "companyName":
      return { companyName: trimmed };
    case "companyBackground":
      return { companyBackground: trimmed };
    case "websiteRequirement":
      return { websiteRequirement: getSingleSelection(trimmed, field.options) };
    case "objectives": {
      const objectives = getMultiSelection(trimmed, field.options);
      return objectives.length ? { objectives } : {};
    }
    case "websiteType":
      return { websiteType: getSingleSelection(trimmed, field.options) };
    case "designExperience":
      return { designExperience: getSingleSelection(trimmed, field.options) };
    case "buildType":
      return { buildType: getSingleSelection(trimmed, field.options) };
    case "platformPreference":
      return { platformPreference: getSingleSelection(trimmed, field.options) };
    case "frontendFramework":
      return { frontendFramework: getSingleSelection(trimmed, field.options) };
    case "backendTechnology":
      return { backendTechnology: getSingleSelection(trimmed, field.options) };
    case "database":
      return { database: getSingleSelection(trimmed, field.options) };
    case "hosting":
      return { hosting: getSingleSelection(trimmed, field.options) };
    case "features": {
      const features = getMultiSelection(trimmed);
      return features.length ? { scope: { features } } : {};
    }
    case "requirements": {
      const requirements = getMultiSelection(trimmed);
      return requirements.length ? { requirements } : {};
    }
    case "timeline":
      return { timeline: trimmed };
    case "budget":
      return { budget: trimmed };
    default:
      return {};
  }
};

const isMissingFieldPromptMessage = (assistantText = "", missingFields = []) => {
  if (typeof assistantText !== "string") return false;
  const trimmed = assistantText.trim();
  if (!trimmed) return false;
  const lines = trimmed
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return (missingFields || []).some((field) => {
    const question =
      typeof field?.question === "string" ? field.question.trim() : "";
    if (!question) return false;
    return lines.some(
      (line) => line === question || line.startsWith(question),
    );
  });
};

const LLM_HANDLED_FIELD_IDS = new Set(["clientName", "companyName"]);

const isLocalMissingField = (field) =>
  field && !LLM_HANDLED_FIELD_IDS.has(field.id);

const hasLlmMissingFields = (missingFields = []) =>
  (missingFields || []).some(
    (field) => field && LLM_HANDLED_FIELD_IDS.has(field.id),
  );

const getNextLocalMissingField = (missingFields = []) => {
  if (hasLlmMissingFields(missingFields)) return null;
  return (missingFields || []).find(isLocalMissingField) || null;
};

const getPromptedMissingField = (assistantText = "", missingFields = []) =>
  (missingFields || []).find((field) =>
    isMissingFieldPromptMessage(assistantText, [field]),
  ) || null;

const buildMissingFieldPrompt = (field) => {
  if (!field) return PROPOSAL_APPROVAL_MESSAGE;
  const lines = [field.question];
  if (field.options?.length) {
    lines.push("", toNumberedList(field.options));
    // Instruction moved to input placeholder
    // if (field.allowCustom) {
    //   lines.push("If you don't see what you need, kindly type it below.");
    // }
  }
  return lines.filter(Boolean).join("\n");
};

const isWebsiteService = (serviceName = "", serviceId = "") => {
  const combined = `${serviceId} ${serviceName}`.toLowerCase();
  return (
    combined.includes("website") ||
    combined.includes("web-development") ||
    combined.includes("web ")
  );
};

const isPlatformBuild = (buildType = "") =>
  /platform|no-code|nocode/i.test(buildType) && !/coded/i.test(buildType);

const getMissingProposalFields = (context, serviceName, serviceId) => {
  const missing = [];
  if (!context || typeof context !== "object") {
    return [
      createMissingField({
        id: "clientName",
        label: "Your name",
        question: "May I know your name?",
      }),
    ];
  }

  const hasText = (value) =>
    typeof value === "string" && value.trim().length > 0;
  const hasList = (value) => Array.isArray(value) && value.length > 0;
  const hasScope =
    hasList(context.scope?.features) ||
    hasList(context.scope?.deliverables) ||
    hasList(context.requirements);

  if (!hasText(context.clientName)) {
    missing.push(
      createMissingField({
        id: "clientName",
        label: "Your name",
        question: "May I know your name?",
      }),
    );
  }
  if (!hasText(context.companyName)) {
    missing.push(
      createMissingField({
        id: "companyName",
        label: "Business name",
        question: "What is your business or company name?",
      }),
    );
  }
  if (!hasText(context.companyBackground)) {
    missing.push(
      createMissingField({
        id: "companyBackground",
        label: "What the business does",
        question: "Could you briefly tell me what your business does?",
      }),
    );
  }

  if (isWebsiteService(serviceName, serviceId)) {
    if (!hasText(context.websiteRequirement)) {
      missing.push(
        createMissingField({
          id: "websiteRequirement",
          label: "Website requirement",
          question: "What best describes your website requirement?",
          options: WEBSITE_REQUIREMENT_OPTIONS,
          allowCustom: true,
        }),
      );
    }
    if (!hasList(context.objectives)) {
      missing.push(
        createMissingField({
          id: "objectives",
          label: "Primary objectives",
          question:
            "What is the primary objective of your website? (Select all that apply)",
          options: WEBSITE_OBJECTIVE_OPTIONS,
          allowCustom: true,
        }),
      );
    }
    if (!hasText(context.websiteType)) {
      missing.push(
        createMissingField({
          id: "websiteType",
          label: "Website type",
          question: "What kind of website are you looking for?",
          options: WEBSITE_TYPE_OPTIONS,
          allowCustom: true,
        }),
      );
    }
    if (!hasText(context.designExperience)) {
      missing.push(
        createMissingField({
          id: "designExperience",
          label: "Design experience",
          question: "What type of design experience are you looking for?",
          options: DESIGN_EXPERIENCE_OPTIONS,
          allowCustom: true,
        }),
      );
    }
    if (!hasText(context.buildType)) {
      missing.push(
        createMissingField({
          id: "buildType",
          label: "Build type",
          question: "How do you want the website built?",
          options: BUILD_TYPE_OPTIONS,
          allowCustom: true,
        }),
      );
    }
    const platformBuild = isPlatformBuild(context.buildType);
    if (platformBuild) {
      if (!hasText(context.platformPreference)) {
        missing.push(
          createMissingField({
            id: "platformPreference",
            label: "Platform",
            question: "Which platform would you like to use?",
            options: PLATFORM_OPTIONS,
            allowCustom: true,
          }),
        );
      }
    } else {
      if (!hasText(context.frontendFramework)) {
        missing.push(
          createMissingField({
            id: "frontendFramework",
            label: "Frontend framework",
            question: "Which frontend framework do you prefer?",
            options: FRONTEND_FRAMEWORK_OPTIONS,
            allowCustom: true,
          }),
        );
      }
      if (!hasText(context.backendTechnology)) {
        missing.push(
          createMissingField({
            id: "backendTechnology",
            label: "Backend technology",
            question: "Which backend technology would you like to use?",
            options: BACKEND_TECHNOLOGY_OPTIONS,
            allowCustom: true,
          }),
        );
      }
      if (!hasText(context.database)) {
        missing.push(
          createMissingField({
            id: "database",
            label: "Database",
            question: "Which database would you prefer?",
            options: DATABASE_OPTIONS,
            allowCustom: true,
          }),
        );
      }
      if (!hasText(context.hosting)) {
        missing.push(
          createMissingField({
            id: "hosting",
            label: "Hosting",
            question: "Where would you like to host the website?",
            options: HOSTING_OPTIONS,
            allowCustom: true,
          }),
        );
      }
    }
    if (!hasList(context.scope?.features)) {
      missing.push(
        createMissingField({
          id: "features",
          label: "Feature list",
          question:
            "Which features do you want on your website? You can list all that apply.",
        }),
      );
    }
  }

  if (!hasText(context.timeline)) {
    missing.push(
      createMissingField({
        id: "timeline",
        label: "Launch timeline",
        question: "When would you like to launch the website?",
        options: [
          "Within 2-4 weeks",
          "Within 1-2 months",
          "The timeline is flexible",
        ],
        allowCustom: true,
      }),
    );
  }

  if (!hasText(context.budget)) {
    missing.push(
      createMissingField({
        id: "budget",
        label: "Budget",
        question: "What is your budget for this project?",
      }),
    );
  }

  return missing;
};

const formatMissingFieldsMessage = (missing) => {
  if (!missing.length) return PROPOSAL_APPROVAL_MESSAGE;
  return buildMissingFieldPrompt(missing[0]);
};

const isProposalApprovalPrompt = (assistantText = "") => {
  if (typeof assistantText !== "string") return false;
  const hasGenerate =
    /\b(generate|generating|create|creating|make|making|build|building|draft|drafting|prepare|preparing|write|writing)\b\s+(?:a|your|the)?\s*proposal\b/i.test(
      assistantText,
    );
  const hasPromptCue =
    /(confirm|ready|proceed|say|type|approve|would you like|do you want|shall i)/i.test(
      assistantText,
    );
  return hasGenerate && hasPromptCue;
};

const isProposalConfirmation = (text, assistantText) => {
  const trimmed = text.trim();
  if (!trimmed) return false;

  const explicitRequestPatterns = [
    /\b(generate|create|make|build|draft|update|revise|edit|regenerate)\b.*\bproposal\b/i,
    /\bproposal\b.*\b(generate|create|make|build|draft|update|revise|edit|regenerate)\b/i,
    /\bgo ahead\b/i,
    /\bready\b.*\bproposal\b/i,
  ];

  if (explicitRequestPatterns.some((pattern) => pattern.test(trimmed))) {
    return true;
  }

  const simpleYes = /^(yes|y|yeah|yep|sure|ok|okay|ready|proceed)\b/i.test(
    trimmed,
  );
  const prompted =
    isProposalApprovalPrompt(assistantText || "") ||
    /project summary|if everything looks good|finalize and send|ready to (see|view|generate).*proposal|generate (a |your |the )?proposal|proposal ready|confirm below|would you like me to generate a proposal|prepare a proposal|proceed with (generating|creating|preparing).*\bproposal/i.test(
      assistantText || "",
    );

  return simpleYes && prompted;
};

const isSimpleYes = (text = "") =>
  /^(yes|y|yeah|yep|sure|ok|okay|ready|proceed)\b/i.test(text.trim());

const isBudgetGateMessage = (text = "") => {
  if (typeof text !== "string") return false;
  return /what is your budget|budget.*below|below.*minimum|min(?:imum)? (?:budget|requirement)|increase your budget|could you increase your budget|quality of work may vary|proceed with this amount/i.test(
    text,
  );
};

const isBudgetQuestionPrompt = (text = "") => {
  if (typeof text !== "string") return false;
  return /what is your budget|budget for this project|monthly budget|budget do you have in mind/i.test(
    text,
  );
};

const getProposalPromptMessage = (missingFields) =>
  formatMissingFieldsMessage(missingFields || []);

const normalizeProposalPromptMessages = (history, missingFields) => {
  if (!Array.isArray(history)) return history;
  return history.map((message) => {
    if (
      message?.role === "assistant" &&
      typeof message.content === "string" &&
      isProposalApprovalPrompt(message.content)
    ) {
      return { ...message, content: getProposalPromptMessage(missingFields) };
    }
    return message;
  });
};

const extractProposalUpdate = ({ userText, assistantText, serviceName }) => {
  const update = {};
  const trimmed = userText.trim();
  if (!trimmed) return update;

  if (serviceName) {
    update.serviceName = serviceName;
  }

  const assistantLower = (assistantText || "").toLowerCase();
  const options = parseNumberedOptions(assistantText || "");
  const selections = parseSelectionsFromText(trimmed, options);
  const combinedItems = extractCombinedItems(trimmed);
  const mergedSelections = mergeLists(
    selections,
    combinedItems.filter((item) => !isNumericChoiceToken(item)),
  );

  if (
    /name\?/i.test(assistantLower) &&
    !/business|company/i.test(assistantLower)
  ) {
    update.clientName = trimmed;
  } else if (/business|company name/i.test(assistantLower)) {
    update.companyName = trimmed;
  } else if (
    /what.*business|describe.*business|about your business|tell me.*business|about your company|tell me.*company|what.*company.*do|what.*do you do|what.*does.*do|what.*does/i.test(
      assistantLower,
    )
  ) {
    update.companyBackground = trimmed;
  }

  if (
    /website requirement|best describes.*website requirement/i.test(
      assistantLower,
    )
  ) {
    update.websiteRequirement = selections.length ? selections[0] : trimmed;
  }

  if (/primary objective|primary objectives/i.test(assistantLower)) {
    const objectives = mergedSelections;
    if (objectives.length) {
      update.objectives = objectives;
    } else if (trimmed) {
      update.objectives = [trimmed];
    }
  }

  if (/kind of website|website are you looking for/i.test(assistantLower)) {
    update.websiteType = selections.length ? selections[0] : trimmed;
  }

  if (
    /design experience|design style|design preference/i.test(assistantLower)
  ) {
    update.designExperience = selections.length ? selections[0] : trimmed;
  }

  if (
    /how do you want the website built|build.*website/i.test(assistantLower)
  ) {
    update.buildType = selections.length ? selections[0] : trimmed;
  }

  if (/which platform|platform would you like to use/i.test(assistantLower)) {
    update.platformPreference = selections.length ? selections[0] : trimmed;
  }

  if (
    /frontend framework|frontend tech|frontend technology/i.test(assistantLower)
  ) {
    update.frontendFramework = selections.length ? selections[0] : trimmed;
  }

  if (
    /backend technology|backend tech|backend framework/i.test(assistantLower)
  ) {
    update.backendTechnology = selections.length ? selections[0] : trimmed;
  }

  if (/which database|database would you prefer/i.test(assistantLower)) {
    update.database = selections.length ? selections[0] : trimmed;
  }

  if (
    /host the website|hosting platform|where would you like to host/i.test(
      assistantLower,
    )
  ) {
    update.hosting = selections.length ? selections[0] : trimmed;
  }

  if (
    /features|functionality|functionalities|modules|scope/i.test(assistantLower)
  ) {
    const features = mergedSelections;
    if (features.length) {
      update.scope = { features };
    }
  }

  if (
    !update.scope?.features?.length &&
    /features|include|need|requirements/i.test(trimmed)
  ) {
    const features = mergedSelections.length
      ? mergedSelections
      : combinedItems.length
        ? combinedItems
        : selections;
    if (features.length) {
      update.scope = { features };
    }
  }

  if (/deliverables?/i.test(assistantLower)) {
    const deliverables = mergedSelections;
    if (deliverables.length) {
      update.scope = { ...(update.scope || {}), deliverables };
    }
  }

  if (
    /timeline|deadline|launch|delivery|duration|how soon/i.test(
      assistantLower,
    ) ||
    /timeline|deadline|launch/i.test(trimmed)
  ) {
    update.timeline = extractTimeline(trimmed) || trimmed;
  }

  if (
    /budget|investment|cost|price/i.test(assistantLower) ||
    /budget|cost|price/i.test(trimmed)
  ) {
    update.budget = trimmed;
  }

  if (
    /need|looking for|require|goal|objective|pain|problem/i.test(trimmed) &&
    !update.scope?.features?.length
  ) {
    const requirements = combinedItems.length ? combinedItems : [trimmed];
    update.requirements = requirements;
  }

  const { preferences, constraints } = extractPreferenceStatements(trimmed);
  if (preferences.length) update.preferences = preferences;
  if (constraints.length) update.constraints = constraints;

  const email = extractEmail(trimmed);
  const phone = extractPhone(trimmed);
  if (email || phone) {
    update.contactInfo = {
      email,
      phone,
    };
  }

  if (/note|important|remember|please make sure/i.test(trimmed)) {
    update.notes = trimmed;
  }

  return update;
};

import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

// Initialize PDF.js worker
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

function AIChat({
  prefill: _prefill = "",
  embedded = false,
  serviceName: propServiceName,
  serviceId: propServiceId,
  onProposalChange,
}) {
  const location = useLocation();
  const { user } = useAuth();
  const serviceName = propServiceName || location.state?.serviceName || "";
  const serviceId = propServiceId || location.state?.serviceId || "";
  const userKey = toStorageKeyPart(user?.id || user?.email || "guest");
  const serviceKey = toStorageKeyPart(serviceId || serviceName);
  const chatHistoryKey = `${CHAT_HISTORY_KEY}:${userKey}:${serviceKey}`;
  const proposalContextKey = `${PROPOSAL_CONTEXT_KEY}:${userKey}:${serviceKey}`;
  const proposalContentKey = `${PROPOSAL_CONTENT_KEY}:${userKey}:${serviceKey}`;

  const getWelcomeMessage = (isNewChat = false) => {
    const workLabel = serviceName ? `${serviceName.toLowerCase()} work` : "project";
    const intro = `Hello! I’m CATA, here to match you with the most suitable freelancer for your ${workLabel}.`;
    const nameQuestion = "May I know your name?";

    return isNewChat
      ? [intro, nameQuestion].join("\n")
      : `${intro}\n${nameQuestion}`;
  };

  const [messages, setMessages] = useState(() => {
    const initialMsg = { role: "assistant", content: getWelcomeMessage(false) };
    if (typeof window === "undefined") return [initialMsg];

    try {
      const saved = getStoredJson(chatHistoryKey, null);

      // Clean up legacy instruction text from saved history
      if (Array.isArray(saved)) {
        saved.forEach((msg) => {
          if (msg.role === "assistant" && typeof msg.content === "string") {
            msg.content = sanitizeAssistantContent(msg.content);
          }
        });
      }

      return Array.isArray(saved) && saved.length > 0 ? saved : [initialMsg];
    } catch (e) {
      console.error("Failed to load chat history:", e);
      return [initialMsg];
    }
  });

  const [activeChatHistoryKey, setActiveChatHistoryKey] =
    useState(chatHistoryKey);
  const [activeProposalContextKey, setActiveProposalContextKey] =
    useState(proposalContextKey);
  const [activeProposalContentKey, setActiveProposalContentKey] =
    useState(proposalContentKey);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  // Persist chat history to localStorage (scoped to the loaded service + user key).
  useEffect(() => {
    if (isHistoryLoading || !activeChatHistoryKey) return;
    setStoredJson(activeChatHistoryKey, buildConversationHistory(messages));
  }, [messages, activeChatHistoryKey, isHistoryLoading]);

  const [input, setInput] = useState("");
  const [activeFiles, setActiveFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState([]);

  const [proposal, setProposal] = useState("");
  const [proposalContext, setProposalContext] = useState(() => {
    const emptyContext = createEmptyProposalContext(serviceName);
    const saved = getStoredJson(proposalContextKey, null);
    return saved ? mergeProposalContext(emptyContext, saved) : emptyContext;
  });
  const [pendingMissingField, setPendingMissingField] = useState(null);
  const [pendingProposal, setPendingProposal] = useState(null);
  const [proposalApproval, setProposalApproval] = useState(null);
  const [proposalApprovalState, setProposalApprovalState] =
    useState("input-available");
  const [proposalApprovalAnchor, setProposalApprovalAnchor] = useState(null);
  const [hasRequestedProposal, setHasRequestedProposal] = useState(false);

  const [showProposal, setShowProposal] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceStarting, setIsVoiceStarting] = useState(false);
  const [isBraveBrowser, setIsBraveBrowser] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isSecureContext, setIsSecureContext] = useState(true);
  const [showThinking, setShowThinking] = useState(false);
  const textareaRef = useRef(null);
  const animatedMessagesRef = useRef(new Set());
  const initialHistoryCountRef = useRef(0);
  const lastMessage = messages[messages.length - 1];
  const lastAssistantContent =
    lastMessage?.role === "assistant" && typeof lastMessage.content === "string"
      ? lastMessage.content
      : "";
  const lastAssistantHasQuestion = lastAssistantContent
    ? lastAssistantContent.split("\n").some((line) => line.trim().endsWith("?"))
    : false;
  const lastAssistantHasOptions = lastAssistantContent
    ? parseNumberedOptions(lastAssistantContent).size > 0 ||
    extractListItems(lastAssistantContent).length > 0
    : false;
  const showServicePlaceholder =
    lastMessage?.role === "assistant" &&
    ((pendingMissingField &&
      (pendingMissingField.allowCustom ||
        pendingMissingField.options?.length)) ||
      (lastAssistantHasQuestion && lastAssistantHasOptions));
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const voiceStartLockRef = useRef(false);
  const voiceReleaseTimeoutRef = useRef(null);
  const speechBaseInputRef = useRef("");
  const speechFinalRef = useRef("");
  const thinkingTimerRef = useRef(null);
  const thinkingStartRef = useRef(0);
  const proposalContextRef = useRef(proposalContext);
  const pendingMissingFieldRef = useRef(pendingMissingField);

  const focusInput = () => {
    // Try using ref first
    if (textareaRef.current) {
      textareaRef.current.focus();
      return;
    }
    // Fallback to querySelector
    const textarea = document.querySelector("textarea[placeholder]");
    if (textarea) {
      textarea.focus();
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const secureContext =
      typeof window.isSecureContext === "boolean"
        ? window.isSecureContext
        : true;
    setIsSecureContext(secureContext);
    if (!secureContext) {
      setIsSpeechSupported(false);
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = navigator.language || "en-US";

    recognition.onstart = () => {
      setIsVoiceStarting(false);
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript || "";
        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        speechFinalRef.current = [speechFinalRef.current, finalTranscript]
          .filter(Boolean)
          .join(" ")
          .trim();
      }

      setInput(
        appendSpeechTranscript(
          speechBaseInputRef.current,
          speechFinalRef.current,
          interimTranscript,
        ),
      );
    };

    recognition.onerror = (event) => {
      console.log("[Voice] Error event:", event?.error, event);
      setIsRecording(false);
      setIsVoiceStarting(false);
      const error = event?.error;
      if (error === "not-allowed" || error === "service-not-allowed") {
        toast.error("Microphone access is blocked. Please allow microphone access in your browser settings.");
        return;
      }
      if (error === "audio-capture") {
        toast.error("No microphone detected. Please connect a microphone and try again.");
        return;
      }
      if (error === "network") {
        console.log("[Voice] Network error detected. Attempting workaround...");
        // Network errors can occur due to Chrome's Web Speech API bugs
        // Workaround: Recreate the recognition instance
        try {
          recognition.abort();
        } catch {
          // Ignore abort errors
        }

        // Auto-retry once by recreating the recognition instance
        if (!recognition._networkRetried) {
          recognition._networkRetried = true;
          voiceReleaseTimeoutRef.current = setTimeout(() => {
            console.log("[Voice] Retrying with fresh instance...");
            voiceStartLockRef.current = false;
            setIsVoiceStarting(false);
            setIsRecording(false);

            // Recreate SpeechRecognition instance (workaround for Chrome bug)
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
              const newRecognition = new SpeechRecognition();
              newRecognition.continuous = true;
              newRecognition.interimResults = true;
              newRecognition.maxAlternatives = 1;
              newRecognition.lang = navigator.language || "en-US";

              // Copy event handlers to new instance
              newRecognition.onstart = recognition.onstart;
              newRecognition.onresult = recognition.onresult;
              newRecognition.onerror = recognition.onerror;
              newRecognition.onend = recognition.onend;
              newRecognition._networkRetried = false;

              recognitionRef.current = newRecognition;

              // Attempt to start the new instance
              try {
                speechBaseInputRef.current = input;
                speechFinalRef.current = "";
                voiceStartLockRef.current = true;
                setIsVoiceStarting(true);
                newRecognition.start();
              } catch (e) {
                console.error("[Voice] Retry failed:", e);
                toast.error("Voice input is unavailable right now. This may be due to your browser, network, or extensions blocking the feature.");
              }
            }
          }, 1500);
          return;
        }
        recognition._networkRetried = false;
        toast.error("Voice input is unavailable. Please try using a different browser (Edge recommended) or check if browser extensions are blocking this feature.");
        return;
      }
      if (error === "aborted") {
        // User or system aborted - no error message needed
        console.log("[Voice] Recognition aborted");
        return;
      }
      if (error === "no-speech") {
        toast.info("No speech detected. Please try again and speak clearly.");
        return;
      }
      // Unknown error
      console.error("[Voice] Unknown error:", error);
      try {
        recognition.abort();
      } catch {
        // Ignore abort errors to avoid masking the original issue.
      }
      if (voiceReleaseTimeoutRef.current) {
        clearTimeout(voiceReleaseTimeoutRef.current);
      }
      voiceReleaseTimeoutRef.current = setTimeout(() => {
        voiceStartLockRef.current = false;
        setIsVoiceStarting(false);
      }, 500);
    };

    recognition.onend = () => {
      if (voiceReleaseTimeoutRef.current) {
        clearTimeout(voiceReleaseTimeoutRef.current);
        voiceReleaseTimeoutRef.current = null;
      }
      voiceStartLockRef.current = false;
      setIsRecording(false);
      setIsVoiceStarting(false);
      setInput(
        appendSpeechTranscript(
          speechBaseInputRef.current,
          speechFinalRef.current,
          "",
        ),
      );
    };

    recognitionRef.current = recognition;
    setIsSpeechSupported(true);

    return () => {
      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.stop();
      recognitionRef.current = null;
      if (voiceReleaseTimeoutRef.current) {
        clearTimeout(voiceReleaseTimeoutRef.current);
        voiceReleaseTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const minDurationMs = 400;
    if (isLoading) {
      thinkingStartRef.current = Date.now();
      setShowThinking(true);
      return;
    }

    if (!showThinking) return;
    const elapsed = Date.now() - (thinkingStartRef.current || 0);
    const remaining = Math.max(0, minDurationMs - elapsed);

    if (thinkingTimerRef.current) {
      clearTimeout(thinkingTimerRef.current);
    }

    thinkingTimerRef.current = setTimeout(() => {
      setShowThinking(false);
      thinkingTimerRef.current = null;
    }, remaining);

    return () => {
      if (thinkingTimerRef.current) {
        clearTimeout(thinkingTimerRef.current);
        thinkingTimerRef.current = null;
      }
    };
  }, [isLoading, showThinking]);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    let cancelled = false;
    const braveCheck = navigator.brave?.isBrave?.();
    if (braveCheck && typeof braveCheck.then === "function") {
      braveCheck
        .then((isBrave) => {
          if (!cancelled) {
            setIsBraveBrowser(Boolean(isBrave));
          }
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    proposalContextRef.current = proposalContext;
    setStoredJson(activeProposalContextKey, proposalContext);
  }, [proposalContext, activeProposalContextKey]);

  useEffect(() => {
    pendingMissingFieldRef.current = pendingMissingField;
  }, [pendingMissingField]);

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      setIsHistoryLoading(true);
      await Promise.resolve();

      const emptyContext = createEmptyProposalContext(serviceName);
      const savedContext = getStoredJson(proposalContextKey, null);
      const nextContext = savedContext
        ? mergeProposalContext(emptyContext, savedContext)
        : emptyContext;
      const missingFields = getMissingProposalFields(
        nextContext,
        serviceName,
        serviceId,
      );

      const savedHistory = getStoredJson(chatHistoryKey, null);
      const missingFieldsForHistory = getMissingProposalFields(
        nextContext,
        serviceName,
        serviceId,
      );
      const normalizedHistory = normalizeProposalPromptMessages(
        savedHistory,
        missingFieldsForHistory,
      );
      const nextMessages =
        Array.isArray(normalizedHistory) && normalizedHistory.length > 0
          ? normalizedHistory
          : [{ role: "assistant", content: getWelcomeMessage(true) }];

      if (cancelled) return;

      setProposalContext(nextContext);
      setMessages(nextMessages);
      initialHistoryCountRef.current = nextMessages.length;
      animatedMessagesRef.current = new Set();
      const lastAssistant = getLastAssistantMessage(nextMessages);
      const promptedField = getPromptedMissingField(
        lastAssistant,
        missingFieldsForHistory,
      );
      setPendingMissingField(
        promptedField && isLocalMissingField(promptedField)
          ? promptedField
          : null,
      );
      setActiveChatHistoryKey(chatHistoryKey);
      setActiveProposalContextKey(proposalContextKey);
      setActiveProposalContentKey(proposalContentKey);

      // Load persisted proposal content
      const savedProposal = getStoredJson(proposalContentKey, "");
      setProposal(savedProposal || "");

      setShowProposal(false);
      clearProposalApproval();
      setIsHistoryLoading(false);
    };

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [chatHistoryKey, proposalContextKey, serviceName]);

  useEffect(() => {
    if (!serviceName || isHistoryLoading) return;
    setProposalContext((prev) => mergeProposalContext(prev, { serviceName }));
  }, [serviceName, isHistoryLoading]);

  // Notify parent when proposal visibility changes
  useEffect(() => {
    if (onProposalChange) {
      onProposalChange(showProposal);
    }
  }, [showProposal, onProposalChange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      focusInput();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/services`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setServices(data.services || []);
        }
      })
      .catch((err) => console.error("Failed to fetch services:", err));
  }, []);

  const extractTextFromPdf = async (file) => {
    console.log("Starting PDF extraction for:", file.name);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Filter out empty items
        const items = textContent.items.filter(
          (item) => item.str.trim().length > 0,
        );

        // Sort items by Y (descending) then X (ascending) to handle layout
        // PDF coordinates: (0,0) is bottom-left usually, so higher Y is higher up on page.
        items.sort((a, b) => {
          const yDiff = b.transform[5] - a.transform[5]; // Compare Y
          if (Math.abs(yDiff) > 5) {
            // If Y difference is significant
            return yDiff; // Sort by Y
          }
          return a.transform[4] - b.transform[4]; // Else sort by X
        });

        let pageText = "";
        let lastY = null;

        items.forEach((item) => {
          const y = item.transform[5];
          const text = item.str;

          if (lastY !== null && Math.abs(y - lastY) > 5) {
            // New line detected (significant Y change)
            pageText += "\n" + text;
          } else {
            // Same line (or close enough) - add space if not first item
            pageText += (pageText ? " " : "") + text;
          }
          lastY = y;
        });

        fullText += pageText + "\n\n";
      }
      console.log("PDF extraction complete. Length:", fullText.length);
      return fullText;
    } catch (err) {
      console.error("PDF Extraction Error:", err);
      throw err;
    }
  };

  const extractTextFromDocx = async (file) => {
    console.log("Starting DOCX extraction for:", file.name);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      console.log("DOCX extraction complete. Length:", result.value.length);
      return result.value;
    } catch (err) {
      console.error("DOCX Extraction Error:", err);
      throw err;
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setIsProcessingFile(true);
    const newFiles = [];

    for (const file of files) {
      console.log("Processing file:", file.name, file.type);
      let extractedText = "";

      try {
        if (file.type === "application/pdf") {
          extractedText = await extractTextFromPdf(file);
        } else if (
          file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
          file.name.endsWith(".docx")
        ) {
          extractedText = await extractTextFromDocx(file);
        } else if (file.type === "text/plain") {
          extractedText = await file.text();
        } else {
          console.warn("Unsupported file type:", file.type);
          toast.error(`Unsupported file type: ${file.name}`);
          continue;
        }

        if (extractedText.trim()) {
          const structuredContent = [
            `### Document Content: ${file.name}`,
            "---",
            extractedText.trim(),
            "---",
            `\n(System Note: Please analyze the document content above and extract key details.)`,
          ].join("\n");

          newFiles.push({
            id: Date.now() + Math.random(),
            name: file.name,
            type: file.type.includes("pdf")
              ? "PDF"
              : file.type.includes("word")
                ? "DOCX"
                : "TXT",
            content: structuredContent,
          });
        } else {
          toast.warning(`Could not extract text from: ${file.name}`);
        }
      } catch (error) {
        console.error("File extraction error:", error);
        toast.error(`Failed to read: ${file.name}`);
      }
    }

    if (newFiles.length > 0) {
      setActiveFiles((prev) => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} document(s) attached`);
      setTimeout(focusInput, 100);
    }

    setIsProcessingFile(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (fileId) => {
    setActiveFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const startVoiceInput = () => {
    if (!recognitionRef.current) {
      toast.error("Voice input isn't supported in this browser.");
      return;
    }

    if (isBraveBrowser) {
      toast.error("Voice input isn't supported in Brave due to privacy restrictions.");
      return;
    }

    if (isRecording || isVoiceStarting || voiceStartLockRef.current) {
      return;
    }

    speechBaseInputRef.current = input;
    speechFinalRef.current = "";

    try {
      voiceStartLockRef.current = true;
      setIsVoiceStarting(true);
      recognitionRef.current.start();
    } catch (error) {
      console.error("Voice input start error:", error);
      const isInvalidState =
        error?.name === "InvalidStateError" ||
        /already started/i.test(error?.message || "");
      if (isInvalidState) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore abort errors to avoid masking the original issue.
        }
      }
      toast.error("Unable to start voice input.");
      voiceStartLockRef.current = false;
      setIsRecording(false);
      setIsVoiceStarting(false);
    }
  };

  const stopVoiceInput = () => {
    if (!recognitionRef.current) return;
    setIsVoiceStarting(false);
    recognitionRef.current.stop();
    setIsRecording(false);
  };

  const toggleVoiceInput = () => {
    if (isRecording) {
      stopVoiceInput();
      return;
    }
    startVoiceInput();
  };

  const clearProposalApproval = () => {
    setPendingProposal(null);
    setProposalApproval(null);
    setProposalApprovalState("input-available");
    setProposalApprovalAnchor(null);
  };

  const requestProposalApproval = (context, history, anchorIndex = null) => {
    if (!context || !history?.length) return;
    setPendingProposal({ context, history });
    setProposalApproval({ id: `proposal-${Date.now()}` });
    setProposalApprovalState("approval-requested");
    const resolvedAnchor =
      typeof anchorIndex === "number"
        ? anchorIndex
        : Math.max(messages.length - 1, 0);
    setProposalApprovalAnchor(Math.max(resolvedAnchor, 0));
    setHasRequestedProposal(true);
  };

  const generateProposal = async (context, history, retryText = "") => {
    if (!context || !history?.length) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I don't have your project details yet. Please share your requirements, timeline, budget, and any constraints, and I'll take it from there.",
        },
      ]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/proposal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalContext: context,
          chatHistory: history,
          serviceName,
        }),
      });

      const data = await response.json();

      if (data?.success && data.proposal) {
        const proposalText =
          typeof data.proposal === "string" ? data.proposal.trim() : "";
        if (!proposalText) {
          throw new Error("Empty proposal response");
        }
        setProposal(proposalText);
        setStoredJson(activeProposalContentKey, proposalText);
        setShowProposal(true);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Your proposal is ready. Open the proposal panel to review it.",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "I couldn't generate the proposal yet. Please try again.",
            isError: true,
            retryText,
          },
        ]);
      }
    } catch (error) {
      console.error("Proposal error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Proposal generation failed. Please try again.",
          isError: true,
          retryText,
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        focusInput();
      }, 300);
    }
  };

  const handleApproveProposal = async () => {
    if (!pendingProposal) return;
    setProposalApproval((prev) => (prev ? { ...prev, approved: true } : null));
    setProposalApprovalState("approval-responded");
    await generateProposal(
      pendingProposal.context,
      pendingProposal.history,
      "Generate proposal",
    );
    setPendingProposal(null);
  };

  const handleRejectProposal = () => {
    if (!proposalApproval) return;
    setProposalApproval((prev) => (prev ? { ...prev, approved: false } : prev));
    setProposalApprovalState("approval-responded");
    setPendingProposal(null);

    // Show rejection briefly, then dismiss and add friendly message
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "No problem! Let me know when you're ready to generate the proposal, or if you'd like to make any changes.",
        },
      ]);
      clearProposalApproval();
    }, 1500);
  };

  const sendMessage = async (messageText, options = {}) => {
    const { skipUserAppend = false } = options;
    const text = typeof messageText === "string" ? messageText : input;
    if (!text.trim() || isLoading || isHistoryLoading) return;

    if (isRecording) {
      stopVoiceInput();
    }

    if (proposalApprovalState === "approval-requested") {
      clearProposalApproval();
    }

    const lastAssistantMessage = getLastAssistantMessage(messages);
    const askedBudget = isBudgetQuestionPrompt(lastAssistantMessage);
    const baseAnchorIndex = Math.max(
      skipUserAppend ? messages.length - 1 : messages.length,
      0,
    );
    const assistantAnchorIndex = Math.max(
      messages.length + (skipUserAppend ? 0 : 1),
      0,
    );
    const budgetGateActive = isBudgetGateMessage(lastAssistantMessage);
    let nextContext = proposalContextRef.current;
    let nextHistory = buildConversationHistory(messages);
    let contextUpdate = {};
    let parsedBudgetAmount = null;
    let hasBudgetSignal = false;

    if (!skipUserAppend) {
      const userMessage = { role: "user", content: text };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setActiveFiles([]); // Clear all active files after sending

      const pendingField = pendingMissingFieldRef.current;
      if (pendingField) {
        const validation = validateMissingFieldAnswer(pendingField, text);
        if (!validation.valid) {
          const nextHistoryLocal = [
            ...buildConversationHistory(messages),
            userMessage,
          ];
          setStoredJson(activeChatHistoryKey, nextHistoryLocal);
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: validation.message || buildMissingFieldPrompt(pendingField),
            },
          ]);
          return;
        }
      }

      contextUpdate = extractProposalUpdate({
        userText: text,
        assistantText: lastAssistantMessage,
        serviceName,
      });
      parsedBudgetAmount = parseBudgetValue(text);
      hasBudgetSignal =
        parsedBudgetAmount !== null ||
        /budget|cost|price|investment/i.test(text) ||
        /\d+\s*[kKlL]\b/.test(text) ||
        /\b(lakh|lac|thousand)\b/i.test(text) ||
        /\b\d{4,}\b/.test(text) ||
        /\b\d{1,3}(?:,\d{3})+\b/.test(text);
      if (
        !contextUpdate.budget &&
        hasRequestedProposal &&
        parsedBudgetAmount &&
        hasBudgetSignal
      ) {
        contextUpdate = { ...contextUpdate, budget: text };
      }
      nextContext = mergeProposalContext(
        proposalContextRef.current,
        contextUpdate,
      );
      const pendingUpdate = pendingField
        ? applyMissingFieldAnswer(pendingField, text)
        : {};
      if (Object.keys(pendingUpdate).length > 0) {
        nextContext = mergeProposalContext(nextContext, pendingUpdate);
        setPendingMissingField(null);
      }
      setProposalContext(nextContext);
      setStoredJson(activeProposalContextKey, nextContext);

      nextHistory = [...buildConversationHistory(messages), userMessage];
      setStoredJson(activeChatHistoryKey, nextHistory);
    }

    const wasMissingPrompt = Boolean(pendingMissingFieldRef.current);
    const missingFieldsNow = getMissingProposalFields(
      nextContext,
      serviceName,
      serviceId,
    );
    const nextLocalMissingField = getNextLocalMissingField(missingFieldsNow);

    if (wasMissingPrompt) {
      if (nextLocalMissingField) {
        setPendingMissingField(nextLocalMissingField);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: getProposalPromptMessage([nextLocalMissingField]),
          },
        ]);
        return;
      }

      setPendingMissingField(null);
      // Continue to backend response before showing proposal confirmation.
    }

    const shouldGenerateProposal =
      !skipUserAppend && isProposalConfirmation(text, lastAssistantMessage);

    if (
      !skipUserAppend &&
      !budgetGateActive &&
      missingFieldsNow.length === 0 &&
      isSimpleYes(text) &&
      /(proposal|summary|finalize|generate|prepare)/i.test(
        lastAssistantMessage || "",
      )
    ) {
      const storedContext = getStoredJson(activeProposalContextKey, nextContext);
      const storedHistory = getStoredJson(activeChatHistoryKey, nextHistory);
      requestProposalApproval(storedContext, storedHistory, baseAnchorIndex);
      return;
    }

    if (shouldGenerateProposal && !budgetGateActive) {
      const storedContext = getStoredJson(
        activeProposalContextKey,
        nextContext,
      );
      const storedHistory = getStoredJson(activeChatHistoryKey, nextHistory);
      const missingFields = getMissingProposalFields(
        storedContext,
        serviceName,
        serviceId,
      );

      const nextLocalMissing = getNextLocalMissingField(missingFields);
      if (nextLocalMissing || storedHistory.length === 0) {
        if (nextLocalMissing) {
          setPendingMissingField(nextLocalMissing);
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: getProposalPromptMessage([nextLocalMissing]),
            },
          ]);
          return;
        }
        return;
      }

      setPendingMissingField(null);
      requestProposalApproval(storedContext, storedHistory, baseAnchorIndex);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationHistory: buildConversationHistory(messages),
          serviceName,
        }),
      });

      const data = await response.json();

      if (data?.success && data.message) {
        const assistantText = sanitizeAssistantContent(data.message);
        // NOTE: Budget validation is handled server-side (backend/ai.service.js).
        // Do not add client-side budget overrides here.
        const storedContext = getStoredJson(
          activeProposalContextKey,
          proposalContextRef.current,
        );
        const storedHistory = getStoredJson(
          activeChatHistoryKey,
          buildConversationHistory(messages),
        );

        if (isBudgetGateMessage(assistantText)) {
          clearProposalApproval();
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: assistantText },
          ]);
          return;
        }

        const isApprovalPrompt = isProposalApprovalPrompt(assistantText);
        const isSummaryPrompt =
          /project summary|if everything looks good|finalize and send|would you like me to proceed|all the details.*proposal|i'?ll proceed with generating|please hold on|prepare (it|the proposal)|proposal (is|will be) (now )?(finalized|ready)/i.test(
            assistantText,
          );
        if (isApprovalPrompt || isSummaryPrompt) {
          const missingFields = getMissingProposalFields(
            storedContext,
            serviceName,
            serviceId,
          );
          const canApprove =
            missingFields.length === 0 && storedHistory.length > 0;
          if (canApprove) {
            setPendingMissingField(null);
            requestProposalApproval(
              storedContext,
              storedHistory,
              baseAnchorIndex,
            );
            // Don't add any message - the Confirmation component handles the UI
          } else if (missingFields.length > 0) {
            const nextLocalMissing = getNextLocalMissingField(missingFields);
            if (nextLocalMissing) {
              setPendingMissingField(nextLocalMissing);
              setMessages((prev) => [
                ...prev,
                {
                  role: "assistant",
                  content: getProposalPromptMessage([nextLocalMissing]),
                },
              ]);
            }
          }
        } else {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: assistantText },
          ]);

          if (
            askedBudget &&
            missingFieldsNow.length === 0 &&
            !hasRequestedProposal &&
            !proposalApproval
          ) {
            requestProposalApproval(
              storedContext,
              storedHistory,
              assistantAnchorIndex,
            );
          }
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, I encountered an error. Please try again.",
            isError: true,
            retryText: text,
          },
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Connection error. Please check if the server is running.",
          isError: true,
          retryText: text,
        },
      ]);
    } finally {
      setIsLoading(false);
      // Re-focus textarea after response
      setTimeout(() => {
        focusInput();
      }, 300);
    }
  };

  const handleQuickAction = (action) => {
    setInput(action);
    setTimeout(() => focusInput(), 50);
  };

  const handleRetry = (retryText) => {
    if (!retryText || isLoading || isHistoryLoading) return;
    sendMessage(retryText, { skipUserAppend: true });
  };

  const resetProposalData = ({ resetMessages = false } = {}) => {
    if (isRecording) {
      stopVoiceInput();
    }
    const emptyContext = createEmptyProposalContext(serviceName);
    setProposal("");
    setShowProposal(false);
    clearProposalApproval();
    setPendingMissingField(null);
    setHasRequestedProposal(false);
    setProposalContext(emptyContext);
    proposalContextRef.current = emptyContext;
    setInput("");
    setActiveFiles([]);

    if (resetMessages) {
      setMessages([{ role: "assistant", content: getWelcomeMessage(true) }]);
      initialHistoryCountRef.current = 1;
      animatedMessagesRef.current = new Set();
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem(activeProposalContextKey);
      localStorage.removeItem(activeChatHistoryKey);
      localStorage.removeItem(activeProposalContentKey);
    }
  };

  const startNewChat = () => {
    resetProposalData({ resetMessages: true });
    setTimeout(() => focusInput(), 50);
  };

  const handleResetProposalData = () => {
    resetProposalData({ resetMessages: true });
    toast.success("Proposal data reset.");
    setTimeout(() => focusInput(), 50);
  };

  const handleSubmit = ({ text }) => {
    sendMessage(text);
  };

  const voiceButtonDisabled =
    !isSecureContext ||
    isBraveBrowser ||
    !isSpeechSupported ||
    isVoiceStarting ||
    (!isRecording && (isProcessingFile || isHistoryLoading || isLoading));
  const voiceButtonLabel = !isSecureContext
    ? "Voice input requires HTTPS (secure context)"
    : isBraveBrowser
      ? "Voice input isn't supported in Brave (privacy restrictions)"
    : !isSpeechSupported
      ? "Voice input isn't supported in this browser"
      : isVoiceStarting
        ? "Starting voice input..."
        : isRecording
          ? "Stop voice input"
          : "Start voice input";

  return (
    <div className={`text-foreground ${embedded ? "h-full w-full" : ""}`}>
      <div
        className={`flex ${embedded ? "h-full w-full" : "h-screen"} bg-background font-sans relative overflow-hidden`}
      >
        {/* Main Chat Area */}
        <main
          className={`flex flex-col transition-all duration-300 ${showProposal && embedded ? "w-1/2" : "flex-1"}`}
        >
          {/* Modern Header */}
          <header
            className={cn(
              "relative px-6 py-4 border-b border-border/50 bg-background/80 backdrop-blur-xl flex justify-between items-center",
              embedded && "pr-12 sm:pr-14",
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
                <Bot className="size-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold flex items-center gap-2">
                  CATA
                  <span className="px-2 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded-full">
                    AI
                  </span>
                </h1>
                <p className="text-xs text-muted-foreground">
                  {serviceName
                    ? `Service: ${serviceName}`
                    : "Your digital services consultant"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Show View Proposal button when a proposal exists */}
              {proposal && !showProposal && (
                <button
                  onClick={() => setShowProposal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-medium transition-colors border border-primary/20"
                >
                  <FileText className="size-4" />
                  <span className="hidden sm:inline">View Proposal</span>
                </button>
              )}

              {/* New Chat button */}
              <button
                onClick={startNewChat}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-sm font-medium transition-colors border border-zinc-700"
                title="Start a new conversation"
              >
                <Plus className="size-4" />
                <span className="hidden sm:inline">New Chat</span>
              </button>
            </div>
            {/* Header Content End */}
          </header>

          {/* Messages Area */}
          <Conversation className="flex-1 [scrollbar-width:thin] [scrollbar-color:var(--primary)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary [&::-webkit-scrollbar-track]:bg-transparent">
            <ConversationContent className="px-6 py-8 flex flex-col gap-6">
              {isHistoryLoading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                  <span className="loading loading-spinner text-primary" />
                  <span>
                    Loading {serviceName ? `${serviceName} chat` : "chat"}...
                  </span>
                </div>
              ) : (
                <>
                  {messages.map((msg, index) => {
                    const messageText =
                      typeof msg.content === "string" ? msg.content : "";
                    const planPayload =
                      msg.role === "assistant"
                        ? extractPlanPayload(messageText)
                        : null;
                    const planRemainder = planPayload?.remainder || "";
                    const userLines = messageText.split("\n");
                    const messageSignature = `${msg.role}-${index}-${messageText}`;
                    const shouldAnimate =
                      msg.role === "assistant" &&
                      index === messages.length - 1 &&
                      index >= initialHistoryCountRef.current &&
                      !animatedMessagesRef.current.has(messageSignature) &&
                      !isHistoryLoading;
                    const handleTypingComplete = () => {
                      animatedMessagesRef.current.add(messageSignature);
                    };

                    return (
                      <Fragment key={`msg-${index}`}>
                        <Message from={msg.role} className="animate-fade-in">
                          {msg.role !== "user" && (
                            <span className="text-xs font-medium px-1 text-muted-foreground">
                              CATA
                            </span>
                          )}
                          <MessageContent
                            className={cn(
                              "max-w-[85%] p-4 rounded-2xl leading-relaxed text-[15px]",
                              "group-[.is-assistant]:bg-transparent group-[.is-assistant]:border-0 group-[.is-assistant]:p-0 group-[.is-assistant]:rounded-none group-[.is-assistant]:max-w-full",
                              "group-[.is-user]:bg-gradient-to-br group-[.is-user]:from-primary group-[.is-user]:to-primary/80 group-[.is-user]:text-primary-foreground group-[.is-user]:rounded-2xl group-[.is-user]:rounded-tr-none group-[.is-user]:px-3 group-[.is-user]:py-2 group-[.is-user]:shadow-lg group-[.is-user]:shadow-primary/20",
                            )}
                          >
                            {msg.role === "assistant" ? (
                              planPayload ? (
                                <div className="space-y-3">
                                  {planRemainder ? (
                                    <MessageResponseTyping
                                      isEnabled={shouldAnimate}
                                      onComplete={handleTypingComplete}
                                    >
                                      {planRemainder}
                                    </MessageResponseTyping>
                                  ) : null}
                                  <Plan defaultOpen>
                                    <PlanHeader className="items-center">
                                      <PlanTitle>{planPayload.title}</PlanTitle>
                                      <PlanAction>
                                        <PlanTrigger />
                                      </PlanAction>
                                    </PlanHeader>
                                    <PlanContent>
                                      <ol className="list-decimal space-y-2 pl-5 text-sm text-foreground">
                                        {planPayload.items.map(
                                          (item, itemIndex) => (
                                            <li key={`${item}-${itemIndex}`}>
                                              {item}
                                            </li>
                                          ),
                                        )}
                                      </ol>
                                    </PlanContent>
                                  </Plan>
                                </div>
                              ) : (
                                <MessageResponseTyping
                                  isEnabled={shouldAnimate}
                                  onComplete={handleTypingComplete}
                                >
                                  {messageText}
                                </MessageResponseTyping>
                              )
                            ) : (
                              userLines.map((line, lineIndex) => (
                                <p
                                  key={lineIndex}
                                  className={`${line ? "mb-2 last:mb-0" : "h-2"}`}
                                >
                                  {line}
                                </p>
                              ))
                            )}
                            {msg.isError && msg.retryText && (
                              <div className="mt-3 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleRetry(msg.retryText)}
                                  disabled={isLoading || isHistoryLoading}
                                  className="inline-flex items-center rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:border-primary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Retry
                                </button>
                              </div>
                            )}
                          </MessageContent>
                        </Message>
                        {proposalApproval &&
                          proposalApprovalAnchor === index && (
                            <div className="flex flex-col items-start animate-fade-in">
                              <Confirmation
                                approval={proposalApproval}
                                state={proposalApprovalState}
                                className="max-w-[85%] border-border/50 bg-card/70"
                              >
                                <ConfirmationRequest>
                                  <ConfirmationTitle>
                                    Generate the proposal now?
                                  </ConfirmationTitle>
                                </ConfirmationRequest>
                                <ConfirmationAccepted>
                                  <ConfirmationTitle>
                                    Approval received. Generating your
                                    proposal...
                                  </ConfirmationTitle>
                                </ConfirmationAccepted>
                                <ConfirmationRejected>
                                  <ConfirmationTitle>
                                    Proposal generation canceled.
                                  </ConfirmationTitle>
                                </ConfirmationRejected>
                                <ConfirmationActions>
                                  <ConfirmationAction
                                    onClick={handleApproveProposal}
                                    disabled={isLoading}
                                  >
                                    Generate
                                  </ConfirmationAction>
                                  <ConfirmationAction
                                    variant="secondary"
                                    onClick={handleRejectProposal}
                                    disabled={isLoading}
                                  >
                                    Not yet
                                  </ConfirmationAction>
                                </ConfirmationActions>
                              </Confirmation>
                            </div>
                          )}
                      </Fragment>
                    );
                  })}

                  {/* Loading State */}
                  {((isLoading && showThinking) || isProcessingFile) && (
                    <div className="flex flex-col items-start animate-fade-in">
                      <span className="text-xs font-medium mb-1.5 px-1 text-muted-foreground">
                        CATA
                      </span>
                      <div className="bg-transparent border-0 rounded-none p-0">
                        <div className="relative flex items-center gap-2">
                          {isProcessingFile ? (
                            <>
                              <FileText className="size-4 animate-pulse text-primary" />
                              <span className="text-sm font-medium">
                                Reading document...
                              </span>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Brain className="size-4 animate-pulse" />
                                <span className="text-sm font-medium">
                                  Thinking...
                                </span>
                              </div>
                              <div
                                className="absolute inset-0 flex items-center gap-2 text-black"
                                style={{
                                  maskImage:
                                    "linear-gradient(110deg, transparent 30%, white 45%, white 55%, transparent 70%)",
                                  WebkitMaskImage:
                                    "linear-gradient(110deg, transparent 30%, white 45%, white 55%, transparent 70%)",
                                  maskSize: "250% 100%",
                                  WebkitMaskSize: "250% 100%",
                                  animation: "mask-shimmer 2s linear infinite",
                                  WebkitAnimation:
                                    "mask-shimmer 2s linear infinite",
                                }}
                              >
                                <Brain className="size-4" />
                                <span className="text-sm font-medium">
                                  Thinking...
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          {/* Input Area */}
          <div className="border-t border-border/50 bg-background/80 backdrop-blur-xl">
            {/* Hidden Input for File Upload - Moved outside PromptInput to avoid conflicts */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              multiple
              disabled={isLoading || isProcessingFile || isHistoryLoading}
              onChange={handleFileUpload}
            />
            <div className="px-6 py-4">
              {/* Quick Action Chips Removed */}

              {/* File Chips - Left aligned above input */}
              {activeFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-start mb-2">
                  {activeFiles.map((file) => (
                    <div
                      key={file.id}
                      className="py-1 px-2 rounded-md bg-[#252525] border border-white/5 flex items-center gap-1.5 group animate-in slide-in-from-bottom-2 fade-in duration-300"
                    >
                      <div className="h-4 w-4 rounded-[3px] bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-500 shrink-0">
                        <FileText className="size-2.5" />
                      </div>
                      <div className="flex flex-col min-w-0 max-w-[120px]">
                        <span className="text-[9px] font-semibold text-white/90 truncate uppercase tracking-widest leading-none pt-0.5">
                          {file.name}
                        </span>
                      </div>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="ml-0.5 p-0.5 rounded-sm hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                      >
                        <X className="size-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <PromptInput
                onSubmit={handleSubmit}
                className="relative border border-white/10 rounded-2xl bg-[#1a1a1a] shadow-lg focus-within:border-primary transition-all duration-300 overflow-hidden [&>[data-slot=input-group]]:!border-none"
              >
                <PromptInputTextarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit({ text: input });
                    }
                  }}
                  placeholder={
                    showServicePlaceholder
                      ? "If you don't see what you need, kindly type it below."
                      : "Ask anything"
                  }
                  disabled={isLoading || isProcessingFile || isHistoryLoading}
                  readOnly={isRecording}
                  autoFocus
                  className="w-full !bg-transparent !border-none !text-white text-base !px-4 !py-3 !min-h-[50px] !max-h-[200px] resize-none !box-border !break-all !whitespace-pre-wrap !overflow-x-hidden [field-sizing:content] focus:!ring-0 placeholder:!text-white/20 font-light"
                />

                <PromptInputFooter className="px-3 pb-3 flex items-center justify-between">
                  <PromptInputTools className="flex items-center gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="p-2 h-9 w-9 shrink-0 rounded-lg border-none cursor-pointer flex items-center justify-center text-white/40 hover:bg-white/5 hover:text-white transition-colors"
                          title="Add attachment"
                          disabled={
                            isLoading || isProcessingFile || isHistoryLoading
                          }
                        >
                          <Plus className="size-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="w-[200px] bg-[#1a1a1a] border-white/10 text-white"
                      >
                        <DropdownMenuItem
                          onClick={() => {
                            fileInputRef.current?.click();
                          }}
                          className="cursor-pointer hover:bg-white/5 focus:bg-white/5 focus:text-white"
                        >
                          <FileText className="mr-2 size-4 text-white/60" />
                          <span>Upload Document</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </PromptInputTools>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleVoiceInput}
                      disabled={voiceButtonDisabled}
                      title={voiceButtonLabel}
                      aria-label={voiceButtonLabel}
                      aria-pressed={isRecording}
                      className={cn(
                        "h-9 w-9 shrink-0 rounded-lg border-none cursor-pointer flex items-center justify-center transition-all",
                        isRecording
                          ? "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
                          : "text-white/40 hover:bg-white/5 hover:text-white",
                        voiceButtonDisabled &&
                        "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-white/40",
                      )}
                    >
                      <Mic className="size-5" />
                    </button>
                    <button
                      type="submit"
                      disabled={
                        (!isLoading &&
                          !input.trim() &&
                          activeFiles.length === 0) ||
                        isProcessingFile ||
                        isHistoryLoading ||
                        isRecording
                      }
                      className="h-9 w-9 shrink-0 rounded-lg border-none cursor-pointer flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
                    >
                      {isLoading ? (
                        <Square className="size-3.5 fill-current" />
                      ) : (
                        <ArrowUp className="size-5" />
                      )}
                    </button>
                  </div>
                </PromptInputFooter>
              </PromptInput>
              <p className="text-center text-xs text-muted-foreground/60 mt-3">
                CATA can make mistakes. Consider checking important information.
              </p>
            </div>
          </div>
        </main>

        {/* Proposal Panel - Side by side with chat when embedded */}
        {embedded && showProposal && (
          <div className="w-1/2 h-full border-l border-white/10 bg-zinc-950 flex flex-col animate-in slide-in-from-right duration-300">
            <ProposalSidebar
              proposal={proposal}
              isOpen={true}
              onClose={() => setShowProposal(false)}
              embedded={embedded}
              inline={true}
              services={services}
            />
          </div>
        )}

        {/* Proposal Sidebar - Fixed overlay for non-embedded mode */}
        {!embedded && (
          <ProposalSidebar
            proposal={proposal}
            isOpen={showProposal}
            onClose={() => setShowProposal(false)}
            embedded={false}
            services={services}
          />
        )}
      </div>
    </div>
  );
}

export default AIChat;

