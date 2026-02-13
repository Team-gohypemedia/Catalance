import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { env } from "../config/env.js";
import { prisma, prismaInitError } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FILE_SERVICE_CATALOG_PATH = join(__dirname, "../data/servicesComplete.json");
const SERVICE_CATALOG_KEY = "services_complete_nested";
const SERVICE_CATALOG_CACHE_TTL_MS = 60 * 1000;
let servicesCatalogLastSyncAt = 0;
let servicesCatalogSyncPromise = null;
let servicesCatalogLoadWarned = false;

const rawServicesData = readFileSync(
  FILE_SERVICE_CATALOG_PATH,
  "utf-8"
);
// Strip BOM/control chars and leading whitespace before JSON.parse
const fileServicesData = JSON.parse(
  rawServicesData.replace(/^[\u0000-\u001F\uFEFF]+/, "").trimStart()
);
let servicesData = fileServicesData;

const denormalizeCollection = (node) => {
  if (Array.isArray(node)) return node;
  if (!node || typeof node !== "object") return [];

  const byId = node.byId && typeof node.byId === "object" ? node.byId : {};
  const allIds = Array.isArray(node.allIds) ? node.allIds : Object.keys(byId);
  return allIds
    .map((id) => byId[id])
    .filter(Boolean);
};

const normalizeServiceShape = (service = {}) => ({
  ...service,
  questions: denormalizeCollection(service.questions).map((question = {}) => ({
    ...question,
    options: denormalizeCollection(question.options)
  }))
});

const normalizeCatalogPayload = (payload, schemaVersion, currency) => {
  if (!payload || typeof payload !== "object") return null;

  const rawServices = denormalizeCollection(payload.services);
  const services = rawServices.map((service) => normalizeServiceShape(service));
  if (services.length === 0) return null;

  return {
    schema_version:
      payload?.meta?.schemaVersion ||
      payload?.schema_version ||
      schemaVersion ||
      null,
    currency: payload?.meta?.currency || payload?.currency || currency || null,
    global_rules: payload?.globalRules || payload?.global_rules || {},
    services
  };
};

const loadServiceCatalogFromDb = async () => {
  if (!prisma || prismaInitError) return null;

  try {
    // OLD: Fetch JSON blob
    // const catalog = await prisma.serviceCatalog.findUnique({ ... });

    // NEW: Fetch from Relational Tables
    const services = await prisma.service.findMany({
      where: { active: true },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!services || services.length === 0) return null;

    // Transform to expected structure for AI logic
    // The internal logic expects { services: [ { id, name, questions: [ { id, question, options } ] } ] }

    // We assume currency/schemaVersion defaults for now or fetch from a config if needed.
    // The previous JSON had currency in root, now it's on service level, but usually consistent.
    const currency = services[0]?.currency || "INR";

    const formattedServices = services.map(s => ({
      id: s.slug,
      name: s.name,
      description: s.description,
      min_budget: s.minBudget, // internal logic might use this
      currency: s.currency,
      questions: s.questions.map(q => ({
        id: q.slug,
        question: q.text,
        type: q.type,
        options: q.options || [],
        required: q.required
      }))
    }));

    return {
      schema_version: "1.0",
      currency: currency,
      global_rules: {}, // global rules were in JSON, we might need to migrate them to a Config table later, for now empty or hardcoded if critical
      services: formattedServices
    };

  } catch (error) {
    if (!servicesCatalogLoadWarned) {
      console.warn(
        `[AI] Failed to load service catalog from DB. Falling back to file: ${error?.message || error}`
      );
      servicesCatalogLoadWarned = true;
    }
    return null;
  }
};

const ensureServicesCatalogLoaded = async (force = false) => {
  const now = Date.now();
  if (
    !force &&
    servicesCatalogLastSyncAt > 0 &&
    now - servicesCatalogLastSyncAt < SERVICE_CATALOG_CACHE_TTL_MS
  ) {
    return servicesData;
  }

  if (servicesCatalogSyncPromise) {
    return servicesCatalogSyncPromise;
  }

  servicesCatalogSyncPromise = (async () => {
    const dbCatalog = await loadServiceCatalogFromDb();
    if (dbCatalog?.services?.length) {
      servicesData = dbCatalog;
    } else {
      // Fallback to file if DB fails or empty (though we migrated)
      // We keep 'servicesData' as initialized from file at top of script
      console.log("Using file-based catalog as fallback or initial state.");
    }
    servicesCatalogLastSyncAt = Date.now();
    return servicesData;
  })();

  try {
    return await servicesCatalogSyncPromise;
  } finally {
    servicesCatalogSyncPromise = null;
  }
};

void ensureServicesCatalogLoaded(true);

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL =
  env.OPENROUTER_MODEL || process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
const FALLBACK_MODEL =
  env.OPENROUTER_MODEL_FALLBACK ||
  process.env.OPENROUTER_MODEL_FALLBACK ||
  "";
const DEFAULT_REFERER =
  process.env.FRONTEND_URL || env.CORS_ORIGIN || "http://localhost:5173";

const OPENROUTER_AUTH_ERROR_REGEX =
  /user not found|invalid api key|unauthorized|forbidden|invalid token/i;
const OPENROUTER_FALLBACK_ERROR_REGEX =
  /model|quota|credit|payment|insufficient|not available|unavailable|not found|unsupported|overloaded|rate limit/i;

const stripMarkdownHeadings = (text = "") => text;

const stripBlockedMarker = (text = "") => {
  if (typeof text !== "string") return text;
  return text
    .replace(/[ \t]*\[blocked\][ \t]*/gi, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const buildOpenRouterAuthError = (providerStatus, model) =>
  new AppError(
    "OpenRouter authentication failed. Verify OPENROUTER_API_KEY in your deployment environment (e.g. Vercel Project Settings -> Environment Variables).",
    502,
    {
      provider: "openrouter",
      providerStatus,
      model
    }
  );

const shouldRetryWithFallbackModel = (statusCode, errorMessage = "") =>
  statusCode === 402 ||
  statusCode === 404 ||
  statusCode === 429 ||
  statusCode >= 500 ||
  OPENROUTER_FALLBACK_ERROR_REGEX.test(errorMessage);

const requestOpenRouterCompletion = async ({
  apiKey,
  title,
  messages,
  temperature,
  maxTokens
}) => {
  const modelsToTry = [DEFAULT_MODEL];
  if (FALLBACK_MODEL && !modelsToTry.includes(FALLBACK_MODEL)) {
    modelsToTry.push(FALLBACK_MODEL);
  }

  for (let index = 0; index < modelsToTry.length; index += 1) {
    const model = modelsToTry[index];
    const hasFallback = index < modelsToTry.length - 1;
    let response;

    try {
      response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": DEFAULT_REFERER,
          "X-Title": title
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens
        })
      });
    } catch (error) {
      throw new AppError("AI provider network error. Please try again.", 502, {
        provider: "openrouter",
        model,
        cause: error?.message || "Network request failed"
      });
    }

    const data = await response.json().catch(() => null);

    if (response.ok) {
      if (!data) {
        throw new AppError("AI API returned an invalid response", 502, {
          provider: "openrouter",
          model
        });
      }

      return { data, model };
    }

    const errorMessage = data?.error?.message || "AI API request failed";
    const isAuthError =
      response.status === 401 ||
      response.status === 403 ||
      OPENROUTER_AUTH_ERROR_REGEX.test(errorMessage);

    if (isAuthError) {
      throw buildOpenRouterAuthError(response.status, model);
    }

    if (hasFallback && shouldRetryWithFallbackModel(response.status, errorMessage)) {
      const fallbackModel = modelsToTry[index + 1];
      console.warn(
        `[AI] OpenRouter request failed for model "${model}" with status ${response.status}: ${errorMessage}. Retrying with fallback model "${fallbackModel}".`
      );
      continue;
    }

    throw new AppError(errorMessage, 502, {
      provider: "openrouter",
      providerStatus: response.status,
      model
    });
  }

  throw new AppError("AI API request failed", 502, {
    provider: "openrouter"
  });
};

const formatWebsiteTypeLabel = (value = "") =>
  value
    .split("_")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ""))
    .join(" ");

const buildWebsiteTypeReference = () => {
  const websiteService = servicesData.services.find(
    (service) => service.id === "website_uiux"
  );
  const websiteTypes = Array.isArray(websiteService?.website_types)
    ? websiteService.website_types
    : [];

  if (websiteTypes.length === 0) {
    return "";
  }

  const typeLines = websiteTypes.map((entry) => {
    const label = formatWebsiteTypeLabel(entry.type || "");
    const pages = Array.isArray(entry.pages) ? entry.pages.join(", ") : "";
    return `- ${entry.type} (${label}): ${pages}`;
  });

  const universalPages = Array.isArray(websiteService?.universal_pages)
    ? websiteService.universal_pages
    : [];
  const universalLine = universalPages.length
    ? `Universal pages (add when relevant): ${universalPages.join(", ")}`
    : "";

  return [
    "WEBSITE TYPE REFERENCE (use only for Web Development service):",
    ...typeLines,
    universalLine
  ]
    .filter(Boolean)
    .join("\n");
};

const normalizeServiceText = (value = "") =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const tokenizeServiceText = (value = "") =>
  normalizeServiceText(value)
    .split(/\s+/)
    .filter(Boolean);

const getServiceDefinition = (serviceName = "") => {
  const normalized = normalizeServiceText(serviceName);
  if (!normalized) return null;

  let bestMatch = null;
  let bestScore = 0;

  for (const service of servicesData.services || []) {
    const nameNormalized = normalizeServiceText(service.name || "");
    const idNormalized = normalizeServiceText(service.id || "");
    let score = 0;

    if (nameNormalized === normalized || idNormalized === normalized) score += 5;
    if (nameNormalized && (nameNormalized.includes(normalized) || normalized.includes(nameNormalized))) {
      score += 3;
    }
    if (idNormalized && (idNormalized.includes(normalized) || normalized.includes(idNormalized))) {
      score += 2;
    }

    const candidateTokens = new Set(
      tokenizeServiceText(`${service.name || ""} ${service.id || ""}`)
    );
    for (const token of tokenizeServiceText(serviceName)) {
      if (candidateTokens.has(token)) score += 1;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = service;
    }
  }

  return bestScore > 0 ? bestMatch : null;
};

const RANGE_SEPARATOR_PATTERN = "[-–—]";
const TIME_RANGE_REGEX = new RegExp(
  `\\d+(?:\\s*${RANGE_SEPARATOR_PATTERN}\\s*\\d+)?\\s*(?:second|minute|hour|day|week|month)s?`,
  "i"
);
const TIMELINE_QUESTION_REGEX =
  /timeline|when.*launch|deadline|how soon|when.*need|when would you like|how long|duration|campaign|turnaround/i;
const PRICING_LEVEL_QUESTION_REGEX =
  /pricing level|budget level|pricing tier|budget tier|level best matches/i;

const extractTimelineValue = (text = "") => {
  if (typeof text !== "string") return null;
  const durationMatch = text.match(TIME_RANGE_REGEX);
  if (durationMatch) {
    return durationMatch[0].replace(/\s+/g, " ").trim();
  }
  if (/asap|urgent|immediately|as soon as possible/i.test(text)) return "ASAP";
  if (/flexible|no rush|whenever/i.test(text)) return "Flexible";

  const keywordMatch = text.match(
    /short[-\s]?term|medium[-\s]?term|long[-\s]?term|standard timeline|fast turnaround|ongoing/i
  );
  if (keywordMatch) {
    return keywordMatch[0].replace(/\s+/g, " ").trim();
  }
  return null;
};

const extractPricingLevel = (text = "", allowShort = false) => {
  if (typeof text !== "string") return null;
  const fullMatch = text.match(
    /\b(entry level|growth level|enterprise level|premium level)\b/i
  );
  if (fullMatch) {
    const normalized = fullMatch[1].replace(/\s+/g, " ").toLowerCase();
    return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`;
  }

  if (allowShort) {
    const shortMatch = text.match(/\b(entry|growth|enterprise|premium)\b/i);
    if (shortMatch) {
      const normalized = shortMatch[1].toLowerCase();
      return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)} level`;
    }
  }
  return null;
};

const formatCurrencyValue = (amount, currencyCode = "INR") => {
  if (typeof amount !== "number" || Number.isNaN(amount)) return null;
  const localeMap = {
    USD: "en-US",
    EUR: "de-DE",
    GBP: "en-GB",
    INR: "en-IN"
  };
  const locale = localeMap[currencyCode] || "en-US";
  return amount.toLocaleString(locale);
};

const normalizeQuestionText = (value = "") =>
  normalizeServiceText(value).replace(/\s+/g, " ").trim();

const QUESTION_STOPWORDS = new Set([
  "what",
  "which",
  "how",
  "when",
  "where",
  "why",
  "do",
  "does",
  "is",
  "are",
  "can",
  "could",
  "would",
  "should",
  "you",
  "your",
  "the",
  "a",
  "an",
  "to",
  "for",
  "of",
  "in",
  "on",
  "with",
  "like",
  "need",
  "want",
  "prefer",
  "please"
]);

const extractAssistantQuestionLine = (assistantText = "") => {
  if (typeof assistantText !== "string") return null;
  const lines = assistantText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (let i = lines.length - 1; i >= 0; i -= 1) {
    if (lines[i].includes("?")) return lines[i];
  }

  for (let i = lines.length - 1; i >= 0; i -= 1) {
    if (/^(what|which|how|when|where|why|do|does|is|are|can|could|would|should)\b/i.test(lines[i])) {
      return lines[i];
    }
  }

  return null;
};

const tokensForMatch = (value = "") =>
  normalizeQuestionText(value)
    .split(" ")
    .filter((token) => {
      if (!token) return false;
      if (/^\d+$/.test(token)) return true;
      return token.length > 2 && !QUESTION_STOPWORDS.has(token);
    });

const getQuestionMatchScore = (assistantQuestion = "", questionText = "") => {
  const assistantNormalized = normalizeQuestionText(assistantQuestion);
  const questionNormalized = normalizeQuestionText(questionText);
  if (!assistantNormalized || !questionNormalized) return 0;

  if (
    assistantNormalized.includes(questionNormalized) ||
    questionNormalized.includes(assistantNormalized)
  ) {
    return 1;
  }

  const questionTokens = tokensForMatch(questionNormalized);
  if (!questionTokens.length) return 0;
  const assistantTokens = new Set(tokensForMatch(assistantNormalized));

  let hits = 0;
  for (const token of questionTokens) {
    if (assistantTokens.has(token)) hits += 1;
  }
  return hits / questionTokens.length;
};

const findLastIndex = (items = [], predicate) => {
  if (!Array.isArray(items)) return -1;
  for (let i = items.length - 1; i >= 0; i -= 1) {
    if (predicate(items[i], i)) return i;
  }
  return -1;
};

const findBestQuestionMatch = (assistantQuestion, questions, usedQuestionIds) => {
  let bestMatch = null;
  let bestScore = 0;

  for (const question of questions || []) {
    if (!question?.id || usedQuestionIds.has(question.id)) continue;
    const score = getQuestionMatchScore(assistantQuestion, question.question || "");
    if (score > bestScore) {
      bestScore = score;
      bestMatch = question;
    }
  }

  return bestScore >= 0.6 ? bestMatch : null;
};

const KEYBOARD_MASH_PATTERNS = [
  "qwertyuiop",
  "poiuytrewq",
  "asdfghjkl",
  "lkjhgfdsa",
  "zxcvbnm",
  "mnbvcxz"
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

const getMinimumAnswerLength = (question = {}, assistantQuestionLine = "") => {
  const questionText = `${question?.question || ""} ${assistantQuestionLine || ""}`;
  if (/name\??$/i.test(questionText.trim()) || /your name/i.test(questionText)) {
    return 2;
  }
  if (/business|company/i.test(questionText) && /name/i.test(questionText)) {
    return 2;
  }
  if (/describe|briefly|detail|requirements|about|tell me/i.test(questionText)) {
    return 5;
  }
  return 3;
};

const getUsedQuestionIds = (conversationHistory = [], serviceDefinition) => {
  if (!Array.isArray(serviceDefinition?.questions)) return new Set();
  const used = new Set();
  for (let i = 0; i < conversationHistory.length - 1; i += 1) {
    const msg = conversationHistory[i];
    const nextMsg = conversationHistory[i + 1];
    if (msg?.role !== "assistant" || nextMsg?.role !== "user") continue;
    const assistantQuestion = extractAssistantQuestionLine(msg.content || "");
    if (!assistantQuestion) continue;
    const matched = findBestQuestionMatch(
      assistantQuestion,
      serviceDefinition.questions,
      used
    );
    if (matched?.id) used.add(matched.id);
  }
  return used;
};

const hasValidOptionSelection = (text = "", options = [], question = {}) => {
  if (!Array.isArray(options) || options.length === 0) return false;
  const trimmed = String(text || "").trim();
  if (!trimmed) return false;

  const { numbers } = parseNumericSelections(trimmed, options.length);
  if (numbers.length) return true;
  if (findOptionLabelMatch(options, trimmed, question)) return true;

  const items = splitMultiSelectItems(trimmed);
  const labels = matchOptionLabelsFromItems(options, items).filter(
    (item) => !isNumericChoiceToken(item)
  );
  return labels.length > 0;
};

const buildClarificationMessage = ({
  questionText = "",
  options = [],
  isBudget = false
}) => {
  if (isBudget) {
    return "What is your budget for this project?";
  }

  const resolvedQuestion = questionText || "Could you share that again?";
  const lines = [];

  lines.push("Quick check - I want to make sure I get this right.");

  lines.push("");
  lines.push(`**${resolvedQuestion}**`);

  if (options.length) {
    lines.push("");
    options.forEach((option, index) => {
      const label = option?.label || "";
      if (!label) return;
      lines.push(`${index + 1}. ${label}`);
    });
    lines.push("");
    lines.push("Pick any that fit - multiple is fine.");
    lines.push("If none fit, just type your own.");
  } else {
    lines.push("");
    lines.push("A few words is perfect.");
  }

  return lines.join("\n");
};

const hasNumberedOptionsInText = (text = "") =>
  /(^|\n)\s*\d+\s*[\.)]\s+\S+/m.test(text || "");

const extractBulletItems = (text = "") => {
  if (typeof text !== "string") return [];
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^[-•]/.test(line) || /^\d+\./.test(line))
    .map((line) => line.replace(/^[-•]\s*/, "").replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);
};

const splitCommaOutsideParens = (value = "") => {
  if (typeof value !== "string") return [];
  const items = [];
  let current = "";
  let depth = 0;

  for (const char of value) {
    if (char === "(") depth += 1;
    if (char === ")" && depth > 0) depth -= 1;

    if (char === "," && depth === 0) {
      if (current.trim()) items.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  if (current.trim()) items.push(current.trim());
  return items;
};

const splitMultiSelectItems = (text = "") => {
  if (typeof text !== "string") return [];
  const bulletItems = extractBulletItems(text);
  if (bulletItems.length) return bulletItems;

  const normalized = text.replace(/\band\b/gi, ",");
  const commaItems = splitCommaOutsideParens(normalized);
  const items = [];

  commaItems.forEach((chunk) => {
    chunk
      .split(/[;\/\n]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => items.push(item));
  });

  return items;
};

const normalizeFeatureList = (value, fallback = []) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return splitCommaOutsideParens(value)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (Array.isArray(fallback)) {
    return fallback.map((item) => String(item).trim()).filter(Boolean);
  }
  return [];
};

const matchOptionLabelsFromItems = (options = [], items = []) => {
  if (!Array.isArray(options) || !Array.isArray(items)) return [];
  const matched = [];

  items.forEach((item) => {
    const normalizedItem = normalizeQuestionText(item);
    if (!normalizedItem) return;

    const optionMatch = options.find((option) => {
      const normalizedLabel = normalizeQuestionText(option.label || "");
      if (!normalizedLabel) return false;
      return (
        normalizedLabel.includes(normalizedItem) ||
        normalizedItem.includes(normalizedLabel)
      );
    });
    if (optionMatch?.label) {
      matched.push(optionMatch.label);
    } else {
      matched.push(item);
    }
  });

  return Array.from(new Set(matched));
};

const isNumericChoiceToken = (value = "") =>
  /^\d+(?:\s*(?:-|to)\s*\d+)?$/i.test(String(value).trim());

const isLikelyOptionSelectionReply = (value = "") => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return false;

  // Common menu-style numeric replies: "1", "2.", "1,3", "2 and 4", "1-3"
  if (/^\d{1,2}(?:\s*[.)])?$/.test(trimmed)) return true;
  if (
    /^\d{1,2}(?:\s*(?:,|\/|&|and|or|-|to)\s*\d{1,2})+(?:\s*[.)])?$/i.test(
      trimmed
    )
  ) {
    return true;
  }

  return false;
};

const parseNumericSelections = (text = "", optionsLength = 0) => {
  const trimmed = text.trim();
  if (!trimmed) return { numbers: [], ambiguous: false };

  const rangeNumbers = [];
  const rangeRegex = /(\d+)\s*(?:-|to)\s*(\d+)/gi;
  let rangeMatch = null;
  while ((rangeMatch = rangeRegex.exec(trimmed)) !== null) {
    const start = Number.parseInt(rangeMatch[1], 10);
    const end = Number.parseInt(rangeMatch[2], 10);
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    const min = Math.min(start, end);
    const max = Math.max(start, end);
    if (optionsLength && (min < 1 || max > optionsLength)) continue;
    for (let i = min; i <= max; i += 1) {
      rangeNumbers.push(i);
    }
  }

  const digitsOnly = /^[\d\s,.-]+$/.test(trimmed);
  const hasSeparator = /[,\s]/.test(trimmed);
  const numberMatches = trimmed.match(/\b\d+\b/g) || [];
  if (!numberMatches.length && rangeNumbers.length === 0) {
    return { numbers: [], ambiguous: false };
  }

  let numbers = [];
  let ambiguous = false;

  if (numberMatches.length === 1 && digitsOnly && !hasSeparator && numberMatches[0].length > 1) {
    numbers = numberMatches[0]
      .split("")
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => Number.isFinite(value) && value > 0);
    ambiguous = true;
  } else {
    numbers = numberMatches
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => Number.isFinite(value) && value > 0);
  }

  if (rangeNumbers.length) {
    numbers = numbers.concat(rangeNumbers);
    ambiguous = false;
  }

  const validNumbers = optionsLength
    ? numbers.filter((value) => value <= optionsLength)
    : numbers;

  return { numbers: Array.from(new Set(validNumbers)), ambiguous };
};

const parseBudgetFromText = (text = "") => {
  if (typeof text !== "string") return null;
  const budgetRegex = /(?:(₹|rs\.?|inr|\$|usd|€|eur|£|gbp))?\s*([\d,]+(?:\.\d+)?)\s*(lakh|lac|k|L|thousand)?\s*(₹|rs\.?|inr|\$|usd|€|eur|£|gbp)?/i;
  const match = budgetRegex.exec(text);
  if (!match) return null;

  const currencyToken = match[1] || match[4] || "";
  let currency = "INR";
  if (/\$|usd/i.test(currencyToken)) currency = "USD";
  else if (/€|eur/i.test(currencyToken)) currency = "EUR";
  else if (/£|gbp/i.test(currencyToken)) currency = "GBP";

  let multiplier = 1;
  if (/lakh|lac/i.test(match[3] || "")) multiplier = 100000;
  else if (/k|thousand/i.test(match[3] || "")) multiplier = 1000;

  const amount = Number.parseFloat(match[2].replace(/,/g, ""));
  if (!Number.isFinite(amount)) return null;

  return { amount: amount * multiplier, currency };
};

const BUDGET_QUESTION_REGEX = /budget|investment|price|cost|spend|how much/i;
const hasBudgetSignal = (text = "") => {
  if (!text) return false;
  if (BUDGET_QUESTION_REGEX.test(text)) return true;
  if (/(₹|rs\.?|inr|\$|usd|€|eur|£|gbp)/i.test(text)) return true;
  if (/\b(lakh|lac|thousand|k)\b/i.test(text)) return true;
  return false;
};

const BUDGET_WARNING_REGEX =
  /budget.*below|below.*minimum|required.*minimum|minimum required/i;
const BUDGET_CANNOT_INCREASE_REGEX =
  /can't increase|cannot increase|can't go higher|cannot go higher|can't raise|cannot raise|can't stretch|cannot stretch|budget (is )?(fixed|tight|limited)|no (extra|more) budget|not possible to increase|can't exceed|cannot exceed|not flexible|no flexibility|can't add|cannot add/i;
const BUDGET_NEGATIVE_ONLY_REGEX =
  /^(no|nope|nah|not really|can't|cannot|unfortunately no)$/i;
const BUDGET_INCREASE_REQUEST_REGEX =
  /increase|raise|at least|minimum|below.*minimum|below the minimum|start(?:ing)?(?: line| budget)?|start(?:ing)? at|stretch|nudge|doable|can you (?:nudge|stretch)|would that be doable/i;
const BUDGET_CANONICAL_QUESTION = "What is your budget for this project?";
const BUDGET_PROMPT_HELPER_REGEX =
  /quick\s+\*{0,2}budget|budget ballpark|simple number works|for example:\s*\d[\d,]*/i;
const BUDGET_PROMPT_WARNING_REGEX =
  /minimum|required|below|increase|quality|continue with this budget|not able to increase/i;
const BUDGET_ACCEPTED_REGEX =
  /\bbudget\b.*\b(noted|recorded|captured|confirmed|locked)\b|all set\b|i(?:'|\u2019)?ve noted/i;
const BUDGET_LIMITATIONS_ACCEPTED_REGEX =
  /scope,\s*features,\s*and\s*quality.*may be limited.*industry standards|budget is noted.*may be limited/i;
const formatInr = (value) => {
  if (!Number.isFinite(value)) return "";
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
};

const normalizeBudgetPromptMessage = (text = "") => {
  if (typeof text !== "string") return "";
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (trimmed === BUDGET_CANONICAL_QUESTION) return trimmed;

  const hasBudgetQuestion = /budget/i.test(trimmed) && /\?/.test(trimmed);
  if (!hasBudgetQuestion) return trimmed;
  if (BUDGET_PROMPT_WARNING_REGEX.test(trimmed)) return trimmed;

  if (
    BUDGET_PROMPT_HELPER_REGEX.test(trimmed) ||
    /\b(what(?:'s| is)\s+your\s+budget|share\s+your\s+budget)\b/i.test(trimmed)
  ) {
    return BUDGET_CANONICAL_QUESTION;
  }

  return trimmed;
};

const applyDynamicEmphasis = (text = "") => {
  if (typeof text !== "string") return "";
  if (text.trim() === BUDGET_CANONICAL_QUESTION) return BUDGET_CANONICAL_QUESTION;
  if (/\*\*.+?\*\*/.test(text)) return text;

  let updated = text;
  updated = updated.replace(/(₹\s?[\d,]+(?:\.\d+)?)/g, "**$1**");
  updated = updated.replace(/\b(\d+\s*(?:day|days|week|weeks|month|months|year|years))\b/gi, "**$1**");
  updated = updated.replace(
    /\b(Budget|Timeline|Requirements|Objectives|Deliverables|Features|Question|Next Steps|Summary)\b/gi,
    "**$1**"
  );

  if (/\*\*.+?\*\*/.test(updated)) return updated;

  const lines = updated.split("\n");
  let emphasized = false;
  const nextLines = lines.map((line) => {
    if (emphasized) return line;
    const headingMatch = line.match(/^(#{1,6}\s+)(.+)$/);
    if (headingMatch) {
      const [, prefix, content] = headingMatch;
      const phraseMatch = content.match(/^([^.!?:\n]{1,40})([.!?:].*)?$/);
      if (phraseMatch) {
        const phrase = phraseMatch[1].trim();
        const rest = phraseMatch[2] || content.slice(phrase.length);
        emphasized = true;
        return `${prefix}**${phrase}**${rest}`;
      }
      emphasized = true;
      return `${prefix}**${content.trim()}**`;
    }
    return line;
  });

  if (emphasized) return nextLines.join("\n");

  return updated.replace(
    /^(\s*)([^.!?:\n]{1,40})([.!?:])?/m,
    (_match, leading, phrase, punctuation = "") =>
      `${leading}**${phrase.trim()}**${punctuation}`
  );
};

const formatBudgetUnit = (unit = "") =>
  unit ? unit.replace(/_/g, " ").trim() : "";

const formatBudgetUnitLabel = (service = null) => {
  const budget = service?.budget || {};
  const cleaned = formatBudgetUnit(budget.unit || "");
  if (!cleaned) return "";

  // Project-scoped services should use plain "project budget" wording.
  if (/^project$/i.test(cleaned) || /^per\s+project$/i.test(cleaned)) {
    return "";
  }

  if (/month/i.test(cleaned)) return "per month";
  if (/week/i.test(cleaned)) return "per week";
  if (/year/i.test(cleaned)) return "per year";

  if (budget.pricing_model === "per_deliverable") {
    const quantityLabel = formatBudgetUnit(budget.quantity_unit_label || "");
    if (quantityLabel) {
      return `per ${quantityLabel.toLowerCase()}`;
    }
  }

  if (/^per\s+/i.test(cleaned)) {
    return cleaned.toLowerCase();
  }

  return `per ${cleaned.toLowerCase()}`;
};

const getServiceLabel = (service) => {
  const id = `${service?.id || ""}`.toLowerCase();
  if (id === "website_uiux" || id === "website_ui_ux") {
    return "Web Development";
  }

  const name = service?.name || "";
  if (!name) return "this service";
  const cleaned = name.split("(")[0].trim();
  return cleaned || name.trim() || "this service";
};

const hashStringToIndex = (value = "", modulo = 1) => {
  if (!modulo || modulo <= 1) return 0;
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % modulo;
  }
  return hash % modulo;
};

const buildBudgetBelowMinimumMessage = (
  service,
  enteredBudgetFormatted,
  minFormatted,
  unitLabel
) => {
  const serviceLabel = getServiceLabel(service);
  const unitSuffix = unitLabel ? ` ${unitLabel}` : "";
  return [
    `The amount you provided (**${enteredBudgetFormatted}${unitSuffix}**) is below the standard minimum requirement for **${serviceLabel}**.`,
    `The standard minimum amount is **${minFormatted}${unitSuffix}**.`,
    `Could you increase your budget to at least **${minFormatted}${unitSuffix}**?`
  ].join("\n");
};

const buildBudgetIncreaseFollowupMessage = () => {
  return "Please share the updated amount you'd like to proceed with.";
};

const buildBudgetAcceptedWithLimitationsMessage = (
  service,
  budgetFormatted,
  unitLabel
) => {
  const serviceLabel = getServiceLabel(service);
  const unitSuffix = unitLabel ? ` ${unitLabel}` : "";
  return [
    `All set - the **budget is noted** at **${budgetFormatted}${unitSuffix}** for **${serviceLabel}**.`,
    "With this budget, the scope, features, and quality of work may be limited and may not fully meet industry standards.",
    "I'll continue with the next step."
  ].join("\n");
};

const buildBudgetAcceptedMessage = (service, budgetFormatted, unitLabel) => {
  const serviceLabel = getServiceLabel(service);
  const unitSuffix = unitLabel ? ` ${unitLabel}` : "";
  const templates = [
    `All set - the **budget is noted** at **${budgetFormatted}${unitSuffix}** for **${serviceLabel}**.`,
    `Great - **budget noted** at **${budgetFormatted}${unitSuffix}** for **${serviceLabel}**.`,
    `Perfect - **budget confirmed** at **${budgetFormatted}${unitSuffix}** for **${serviceLabel}**.`
  ];
  const index = hashStringToIndex(`${service?.id || serviceLabel}-${budgetFormatted}`, templates.length);
  return templates[index];
};

const isBudgetPromptText = (text = "") =>
  BUDGET_QUESTION_REGEX.test(text) ||
  BUDGET_WARNING_REGEX.test(text) ||
  BUDGET_INCREASE_REQUEST_REGEX.test(text) ||
  /starting budget|start at|stretch the budget|nudge it/i.test(text);

const AFFIRMATIVE_ONLY_REGEX =
  /^(yes|y|yeah|yep|sure|ok|okay|yup|alright|all right|can do|doable|works|sounds good|please do|go ahead)$/i;

const isAffirmativeResponse = (text = "") =>
  AFFIRMATIVE_ONLY_REGEX.test((text || "").trim());

const isBudgetValueText = (text = "", prevAssistantText = "") => {
  const parsed = parseBudgetFromText(text || "");
  if (!parsed?.amount) return false;
  if (hasBudgetSignal(text || "")) return true;
  if (prevAssistantText && isBudgetPromptText(prevAssistantText)) return true;
  return false;
};

const getUserBudgetsFromHistory = (history = [], { startIndex = 0 } = {}) => {
  const start = Math.max(0, startIndex);
  const budgets = [];

  for (let i = start; i < history.length; i += 1) {
    const msg = history[i];
    if (!msg || msg.role === "assistant") continue;
    const parsed = parseBudgetFromText(msg.content || "");
    if (!parsed?.amount) continue;

    const prevMsg = history[i - 1];
    const isBudgetReply =
      prevMsg?.role === "assistant" && isBudgetPromptText(prevMsg.content || "");
    const budgetSignal = hasBudgetSignal(msg.content || "");
    const explicitBudgetToken =
      /(â‚¹|rs\.?|inr|\$|usd|â‚¬|eur|Â£|gbp|\b(?:lakh|lac|thousand|k)\b)/i.test(
        msg.content || ""
      );
    const temporalOnly =
      /\b(day|days|week|weeks|month|months|year|years|timeline|deadline|launch|duration)\b/i.test(
        msg.content || ""
      );

    if (isLikelyOptionSelectionReply(msg.content || "") && !budgetSignal) {
      continue;
    }
    if (!budgetSignal && temporalOnly && !explicitBudgetToken) {
      continue;
    }
    if (!budgetSignal && !isBudgetReply) {
      continue;
    }

    budgets.push({ ...parsed, index: i, text: msg.content || "" });
  }

  return budgets;
};

const getLatestUserBudgetFromHistory = (history = [], { startIndex = 0 } = {}) => {
  const budgets = getUserBudgetsFromHistory(history, { startIndex });
  return budgets.length ? budgets[budgets.length - 1] : null;
};

const findLatestBudgetPromptIndex = (history = []) => {
  let index = -1;
  history.forEach((msg, i) => {
    if (msg?.role === "assistant" && isBudgetPromptText(msg.content || "")) {
      index = i;
    }
  });
  return index;
};

const getLastAssistantMessage = (history = []) => {
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    if (msg?.role === "assistant") return msg;
  }
  return null;
};

const getLastUserMessageWithIndex = (history = []) => {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const msg = history[i];
    if (msg?.role !== "assistant") {
      return { index: i, content: msg?.content || "" };
    }
  }
  return null;
};

const hasAssistantMessageAfterIndex = (
  history = [],
  startIndex = -1,
  matcher = /.*/
) => {
  const isRegex = matcher instanceof RegExp;
  for (let i = Math.max(0, startIndex + 1); i < history.length; i += 1) {
    const msg = history[i];
    if (msg?.role !== "assistant") continue;
    const content = msg.content || "";
    const matched = isRegex
      ? matcher.test(content)
      : typeof matcher === "function"
        ? Boolean(matcher(content, msg, i))
        : false;
    if (matched) return true;
  }
  return false;
};

const userCannotIncreaseBudget = (text = "", history = []) => {
  if (!text) return false;
  if (isAffirmativeResponse(text)) return false;
  if (BUDGET_CANNOT_INCREASE_REGEX.test(text)) return true;

  if (BUDGET_NEGATIVE_ONLY_REGEX.test(text)) {
    const lastAssistant = getLastAssistantMessage(history);
    if (lastAssistant && BUDGET_INCREASE_REQUEST_REGEX.test(lastAssistant.content || "")) {
      return true;
    }
  }

  const lastAssistant = getLastAssistantMessage(history);
  if (lastAssistant && BUDGET_INCREASE_REQUEST_REGEX.test(lastAssistant.content || "")) {
    if (!isBudgetValueText(text, lastAssistant.content || "")) {
      return true;
    }
  }

  return false;
};

const findBudgetWarningIndex = (history = []) => {
  let warningIndex = -1;
  history.forEach((msg, index) => {
    if (msg?.role === "assistant" && BUDGET_WARNING_REGEX.test(msg.content || "")) {
      warningIndex = index;
    }
  });
  return warningIndex;
};

const findBudgetLimitationsAcceptedIndex = (history = []) => {
  let acceptedIndex = -1;
  history.forEach((msg, index) => {
    if (
      msg?.role === "assistant" &&
      BUDGET_LIMITATIONS_ACCEPTED_REGEX.test(msg.content || "")
    ) {
      acceptedIndex = index;
    }
  });
  return acceptedIndex;
};

const buildBudgetOverrideMessage = ({
  conversationHistory = [],
  messages = [],
  selectedServiceName = ""
}) => {
  const service = getServiceDefinition(selectedServiceName);
  const minBudget = Number(service?.budget?.min_required_amount);
  if (!Number.isFinite(minBudget) || minBudget <= 0) return null;

  const history = [...conversationHistory, ...messages];
  const latestBudgetPromptIndex = findLatestBudgetPromptIndex(history);
  if (latestBudgetPromptIndex < 0) return null;

  const allBudgets = getUserBudgetsFromHistory(history);
  const latestBudget = allBudgets.length
    ? allBudgets[allBudgets.length - 1]
    : null;
  if (!latestBudget?.amount || !Number.isFinite(latestBudget.amount)) return null;

  const warningIndex = findBudgetWarningIndex(history);
  const limitationsAcceptedIndex = findBudgetLimitationsAcceptedIndex(history);
  if (limitationsAcceptedIndex >= 0) {
    return null;
  }

  const latestUser = getLastUserMessageWithIndex(history);
  const lastAssistant = getLastAssistantMessage(history);
  const unitLabel = formatBudgetUnitLabel(service);
  const enteredBudgetFormatted = formatInr(latestBudget.amount);

  if (latestBudget.amount >= minBudget) {
    if (
      latestUser &&
      latestUser.index === latestBudget.index &&
      !hasAssistantMessageAfterIndex(history, latestBudget.index, BUDGET_ACCEPTED_REGEX)
    ) {
      return buildBudgetAcceptedMessage(service, enteredBudgetFormatted, unitLabel);
    }
    return null;
  }

  if (warningIndex < 0) {
    const minFormatted = formatInr(minBudget);
    return buildBudgetBelowMinimumMessage(
      service,
      enteredBudgetFormatted,
      minFormatted,
      unitLabel
    );
  }

  if (!latestUser || latestUser.index <= warningIndex) {
    return null;
  }

  if (
    lastAssistant &&
    BUDGET_INCREASE_REQUEST_REGEX.test(lastAssistant.content || "") &&
    isAffirmativeResponse(latestUser.content || "") &&
    !isBudgetValueText(latestUser.content || "", lastAssistant.content || "")
  ) {
    return buildBudgetIncreaseFollowupMessage();
  }

  const lowBudgetsAfterWarning = allBudgets.filter(
    (entry) => entry.index > warningIndex && entry.amount < minBudget
  );
  const repeatedSameLowBudget =
    lowBudgetsAfterWarning.length >= 2 &&
    Math.round(
      lowBudgetsAfterWarning[lowBudgetsAfterWarning.length - 1]?.amount || 0
    ) ===
    Math.round(
      lowBudgetsAfterWarning[lowBudgetsAfterWarning.length - 2]?.amount || 0
    );

  const shouldAcceptWithLimitations =
    userCannotIncreaseBudget(latestUser.content || "", history) ||
    repeatedSameLowBudget ||
    (latestBudget.index > warningIndex && lowBudgetsAfterWarning.length >= 1);

  if (shouldAcceptWithLimitations) {
    if (
      hasAssistantMessageAfterIndex(
        history,
        warningIndex,
        BUDGET_LIMITATIONS_ACCEPTED_REGEX
      )
    ) {
      return null;
    }
    return buildBudgetAcceptedWithLimitationsMessage(
      service,
      enteredBudgetFormatted,
      unitLabel
    );
  }

  return null;
};

const sanitizeBudgetHallucination = ({
  assistantText = "",
  conversationHistory = [],
  messages = [],
  selectedServiceName = ""
}) => {
  if (!assistantText) return assistantText;
  const service = getServiceDefinition(selectedServiceName);
  const minBudget = Number(service?.budget?.min_required_amount);
  if (!Number.isFinite(minBudget) || minBudget <= 0) return assistantText;

  const history = [...conversationHistory, ...messages];
  const latestBudget = getLatestUserBudgetFromHistory(history);
  if (!latestBudget?.amount || latestBudget.amount < minBudget) return assistantText;

  const hasWarning =
    /\bbelow\b/i.test(assistantText) ||
    BUDGET_INCREASE_REQUEST_REGEX.test(assistantText) ||
    /quality.*vary|can(?:not|'?t) proceed|minimum.*(?:budget|requirement)/i.test(
      assistantText
    );
  if (!hasWarning) return assistantText;

  const unitLabel = formatBudgetUnitLabel(service);
  const formatted = formatInr(latestBudget.amount);
  return buildBudgetAcceptedMessage(service, formatted, unitLabel);
};

const deriveOptionsFromAssistant = (assistantText = "") => {
  const items = extractBulletItems(assistantText);
  if (!items.length) return [];
  return items.map((label) => ({ label }));
};

const buildUserInputGuardMessage = ({
  conversationHistory = [],
  messages = [],
  selectedServiceName = ""
}) => {
  const history = [...conversationHistory, ...messages];
  const lastUserIndex = findLastIndex(
    history,
    (msg) => msg?.role === "user" && msg.content
  );
  if (lastUserIndex < 0) return null;

  const lastAssistantIndex = findLastIndex(
    history.slice(0, lastUserIndex),
    (msg) => msg?.role === "assistant" && msg.content
  );
  if (lastAssistantIndex < 0) return null;

  const lastAssistant = history[lastAssistantIndex];
  const assistantText = lastAssistant?.content || "";
  const assistantQuestionLine = extractAssistantQuestionLine(assistantText);
  if (!assistantQuestionLine) return null;

  const serviceDefinition = getServiceDefinition(selectedServiceName);
  const usedQuestionIds = serviceDefinition
    ? getUsedQuestionIds(history.slice(0, lastAssistantIndex + 1), serviceDefinition)
    : new Set();
  const matchedQuestion = serviceDefinition?.questions?.length
    ? findBestQuestionMatch(
      assistantQuestionLine,
      serviceDefinition.questions,
      usedQuestionIds
    )
    : null;

  const questionText = matchedQuestion?.question || assistantQuestionLine;
  const derivedOptions = matchedQuestion?.options?.length
    ? matchedQuestion.options
    : deriveOptionsFromAssistant(assistantText);
  const options = Array.isArray(derivedOptions) ? derivedOptions : [];
  const userText = history[lastUserIndex]?.content || "";
  const hasNumberedOptions =
    options.length > 0 || hasNumberedOptionsInText(assistantText);
  const numericSelection =
    parseNumericSelections(userText, options.length).numbers.length > 0 ||
    isNumericChoiceToken(userText);

  const isBudgetQuestion =
    matchedQuestion?.id === "user_budget" ||
    isBudgetPromptText(assistantText) ||
    BUDGET_QUESTION_REGEX.test(questionText || "");

  if (isBudgetQuestion) {
    const parsed = parseBudgetFromText(userText);
    const budgetSignal = hasBudgetSignal(userText);
    const assistantAskedIncrease = BUDGET_INCREASE_REQUEST_REGEX.test(
      assistantText
    );

    if (assistantAskedIncrease) {
      if (userCannotIncreaseBudget(userText, history)) {
        return null;
      }
      if (isAffirmativeResponse(userText)) {
        return null;
      }
    }

    if (
      !parsed?.amount ||
      (!budgetSignal && isLikelyOptionSelectionReply(userText))
    ) {
      return buildClarificationMessage({
        questionText: "What is your budget for this project?",
        options: [],
        isBudget: true
      });
    }
    return null;
  }

  if (/\bname\b/i.test(questionText || "")) {
    return null;
  }

  if (hasNumberedOptions && numericSelection) {
    return null;
  }

  const minLength = getMinimumAnswerLength(matchedQuestion, assistantQuestionLine);
  if (isLowSignalText(userText, { minLength })) {
    return buildClarificationMessage({
      questionText,
      options,
      isBudget: false
    });
  }

  if (options.length) {
    const hasSelection = hasValidOptionSelection(userText, options, matchedQuestion);
    if (!hasSelection && userText.trim().length <= 4) {
      return buildClarificationMessage({
        questionText,
        options,
        isBudget: false
      });
    }
  }

  return null;
};
const PROPOSAL_CONFIRMATION_QUESTION_REGEX =
  /ready to (see|view).*proposal|see (your )?personalized proposal|view (your )?personalized proposal|show (me|us) (the )?proposal/i;
const PROPOSAL_CONFIRMATION_RESPONSE_REGEX =
  /^(yes|y|yeah|yep|sure|ok|okay|ready|go ahead|proceed|show me|show it|view it|let's do it|sounds good|please do|confirm)\b/i;

const isProposalConfirmed = (conversationHistory = []) => {
  for (let i = 0; i < conversationHistory.length - 1; i++) {
    const msg = conversationHistory[i];
    const nextMsg = conversationHistory[i + 1];
    if (msg?.role !== "assistant") continue;
    if (!PROPOSAL_CONFIRMATION_QUESTION_REGEX.test(msg.content || "")) continue;
    if (nextMsg?.role !== "user") continue;
    const response = (nextMsg.content || "").trim();
    if (PROPOSAL_CONFIRMATION_RESPONSE_REGEX.test(response)) return true;
  }
  return false;
};

const findOptionLabelMatch = (options = [], userText = "", question = {}) => {
  const normalizedUser = normalizeQuestionText(userText);
  if (!normalizedUser) return null;

  if (/^(none|no|nope|not applicable|n a)$/i.test(normalizedUser)) {
    const fallback = options.find((option) => {
      const normalizedLabel = normalizeQuestionText(option.label || "");
      return normalizedLabel.startsWith("no") || normalizedLabel.includes("no ");
    });
    if (fallback?.label) return fallback.label;
  }

  if (question?.id === "page_count") {
    if (/[>+]/.test(userText) || /more than|over|above|greater than/i.test(normalizedUser)) {
      const moreThan = options.find((option) =>
        /more than|over|above|greater/i.test(
          normalizeQuestionText(option.label || "")
        )
      );
      if (moreThan?.label) return moreThan.label;
    }
  }

  let bestLabel = null;
  let bestScore = 0;
  const userTokens = tokensForMatch(normalizedUser);

  for (const option of options) {
    const label = option?.label;
    if (!label) continue;
    const normalizedLabel = normalizeQuestionText(label);
    if (!normalizedLabel) continue;

    if (
      normalizedLabel.includes(normalizedUser) ||
      normalizedUser.includes(normalizedLabel)
    ) {
      return label;
    }

    const optionTokens = tokensForMatch(normalizedLabel);
    if (!optionTokens.length) continue;

    let hits = 0;
    for (const token of optionTokens) {
      if (userTokens.includes(token)) hits += 1;
    }
    const score = hits / optionTokens.length;
    if (score > bestScore) {
      bestScore = score;
      bestLabel = label;
    }
  }

  return bestScore >= 0.6 ? bestLabel : null;
};

const resolveOptionAnswer = (question, assistantText, userText, summaryText = "") => {
  const trimmed = (userText || "").trim();
  if (!trimmed) return null;

  const options = Array.isArray(question?.options) ? question.options : [];
  const isMultiSelect = question?.type === "multi_select";

  if (options.length) {
    if (isMultiSelect) {
      const { numbers, ambiguous } = parseNumericSelections(trimmed, options.length);
      const numericLabels = numbers
        .map((value) => options[value - 1]?.label)
        .filter(Boolean);
      const uniqueNumericLabels = Array.from(new Set(numericLabels));

      const userItems = splitMultiSelectItems(trimmed);
      const userLabels = matchOptionLabelsFromItems(options, userItems).filter(
        (item) => !isNumericChoiceToken(item)
      );

      const labelMatch = findOptionLabelMatch(options, trimmed, question);

      const summaryItems = extractBulletItems(summaryText);
      const summaryLabels = matchOptionLabelsFromItems(options, summaryItems).filter(
        (item) => !isNumericChoiceToken(item)
      );

      const combined = [];
      const pushUnique = (value) => {
        if (!value) return;
        if (!combined.includes(value)) combined.push(value);
      };

      userLabels.forEach(pushUnique);
      if (!ambiguous || !summaryText) {
        uniqueNumericLabels.forEach(pushUnique);
      }
      summaryLabels.forEach(pushUnique);
      if (labelMatch) pushUnique(labelMatch);

      if (combined.length) return combined.join(", ");

      if (uniqueNumericLabels.length) {
        return uniqueNumericLabels.join(", ");
      }
    } else {
      const { numbers } = parseNumericSelections(trimmed, options.length);
      if (numbers.length === 1 && numbers[0] <= options.length) {
        const label = options[numbers[0] - 1]?.label;
        if (label) return label;
      }

      const labelMatch = findOptionLabelMatch(options, trimmed, question);
      if (labelMatch) return labelMatch;
    }
  }

  const optionMatch = trimmed.match(/^(\d+)\.?$/);
  if (optionMatch) {
    const optionNum = Number.parseInt(optionMatch[1], 10);
    const optionRegex = new RegExp(`${optionNum}\\.\\s*([^\\n]+)`, "i");
    const foundOption = (assistantText || "").match(optionRegex);
    if (foundOption) return foundOption[1].trim();
  }

  return trimmed;
};

const extractQuestionAnswers = (conversationHistory, serviceDefinition) => {
  if (!Array.isArray(serviceDefinition?.questions)) return [];
  const answers = [];
  const usedQuestionIds = new Set();

  for (let i = 0; i < conversationHistory.length - 1; i++) {
    const msg = conversationHistory[i];
    const nextMsg = conversationHistory[i + 1];

    if (msg.role !== "assistant" || nextMsg.role !== "user") continue;
    const assistantText = msg.content || "";
    const userText = nextMsg.content || "";
    const summaryText =
      conversationHistory[i + 2]?.role === "assistant"
        ? conversationHistory[i + 2].content
        : "";
    const assistantQuestion = extractAssistantQuestionLine(assistantText);
    if (!assistantQuestion) continue;

    const matchedQuestion = findBestQuestionMatch(
      assistantQuestion,
      serviceDefinition.questions,
      usedQuestionIds
    );
    if (!matchedQuestion) continue;

    const resolvedAnswer = resolveOptionAnswer(
      matchedQuestion,
      assistantText,
      userText,
      summaryText
    );
    if (resolvedAnswer) {
      answers.push({
        id: matchedQuestion.id,
        label: matchedQuestion.question || "Question",
        answer: resolvedAnswer
      });
      usedQuestionIds.add(matchedQuestion.id);
    }
  }

  return answers;
};

const formatListValue = (items = []) =>
  items
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .join(", ");

const getAnswerByIds = (answers = [], ids = []) => {
  if (!Array.isArray(answers)) return null;
  for (const id of ids) {
    const match = answers.find((item) => item.id === id && item.answer);
    if (match) return match;
  }
  return null;
};

/**
 * Build comprehensive technical expertise context for CATA
 * This knowledge base allows CATA to provide informed, expert-level recommendations
 */
const buildTechnicalExpertise = () => {
  return `
**YOUR TECHNICAL EXPERTISE (Use this knowledge to provide informed recommendations)**
======================================================================================

You possess deep technical knowledge across all digital services. Draw from this expertise naturally in conversations to provide value, suggest best practices, and help clients make informed decisions. Don't recite this information - use it intelligently based on context.

WEBSITE & UI/UX DEVELOPMENT EXPERTISE:
--------------------------------------
Performance Best Practices (Vercel/React Standards):
- Bundle optimization: Recommend code splitting, dynamic imports for heavy components, avoiding barrel file imports
- Core Web Vitals: Explain importance of LCP, FID, CLS for SEO and user experience
- Loading strategies: Suggest lazy loading, image optimization, preloading critical resources
- Caching: Recommend appropriate caching strategies (CDN, browser, API)
- Modern frameworks: Knowledgeable about React, Next.js, Vite, and their trade-offs

Design Principles:
- Responsive design: Mobile-first approach, breakpoint strategy
- Accessibility: WCAG compliance, keyboard navigation, screen reader support
- Visual hierarchy: Typography, spacing, color contrast
- Micro-interactions: Subtle animations for feedback, hover states, transitions
- Dark/light modes: Theming considerations and implementation

Technology Recommendations:
- Static sites: Recommend for content-heavy, SEO-focused sites (blogs, portfolios)
- SSR/SSG: Explain trade-offs for different use cases
- Headless CMS: Suggest Sanity, Contentful, Strapi based on needs
- Hosting: Vercel, Netlify, AWS considerations

APP DEVELOPMENT EXPERTISE:
--------------------------
Platform Strategy:
- Cross-platform: React Native, Flutter - cost-effective, single codebase
- Native: iOS Swift/SwiftUI, Android Kotlin - best performance, platform features
- PWA: Progressive Web Apps for simple mobile needs without app store

Architecture Best Practices:
- State management: Redux, Zustand, Context API based on complexity
- Offline-first: Local storage, sync strategies for unreliable networks
- Push notifications: Firebase, OneSignal implementation
- API design: RESTful vs GraphQL based on data needs
- Security: Authentication flows, data encryption, secure storage

Performance:
- App size optimization, lazy loading screens
- Image caching, network request optimization
- Battery and memory considerations

BRANDING & IDENTITY EXPERTISE:
------------------------------
Brand Strategy:
- Brand positioning and differentiation
- Target audience definition and personas
- Competitive analysis and market positioning
- Brand voice and messaging framework

Visual Identity:
- Logo design principles (scalability, versatility, memorability)
- Color psychology and palette selection
- Typography pairing and hierarchy
- Brand guidelines documentation

Deliverables Knowledge:
- Logo variations (primary, secondary, icon, wordmark)
- Brand collateral (business cards, letterheads, presentations)
- Digital assets (social media kits, email signatures)
- Brand style guides

SEO EXPERTISE:
--------------
Technical SEO:
- Site architecture and crawlability
- Core Web Vitals optimization
- Schema markup and structured data
- XML sitemaps and robots.txt
- Mobile-first indexing requirements

Content Strategy:
- Keyword research and intent mapping
- Content clusters and pillar pages
- E-E-A-T (Experience, Expertise, Authority, Trust)
- Internal linking strategies

Local SEO:
- Google Business Profile optimization
- Local citations and NAP consistency
- Review management strategies

DIGITAL MARKETING EXPERTISE:
----------------------------
Social Media Marketing:
- Platform-specific strategies (Instagram, LinkedIn, Twitter, Facebook)
- Content calendars and posting schedules
- Engagement tactics and community building
- Influencer collaboration strategies
- Analytics and performance tracking

Paid Advertising:
- Google Ads: Search, Display, Shopping campaigns
- Meta Ads: Audience targeting, lookalike audiences, retargeting
- LinkedIn Ads: B2B targeting strategies
- Budget allocation and ROAS optimization
- A/B testing methodologies

Email Marketing:
- List building and segmentation
- Automation workflows (welcome, nurture, re-engagement)
- Deliverability best practices
- A/B testing subject lines, content

E-COMMERCE EXPERTISE:
---------------------
Platform Knowledge:
- Shopify: Best for most SMBs, extensive apps ecosystem
- WooCommerce: WordPress integration, customizable
- Custom solutions: When to recommend headless commerce

Conversion Optimization:
- Checkout flow optimization
- Product page best practices
- Cart abandonment strategies
- Trust signals and social proof

Operations:
- Inventory management integration
- Payment gateway options
- Shipping and fulfillment setup
- Tax and compliance considerations

VIDEO & CREATIVE PRODUCTION EXPERTISE:
--------------------------------------
Video Production:
- Pre-production planning (scripting, storyboarding)
- Production quality considerations
- Post-production workflows
- Distribution strategy

CGI & 3D:
- Product visualization use cases
- Architectural rendering
- Motion graphics and animation
- AR/VR considerations

**ADAPTIVE CONSULTATION PRINCIPLES**
====================================
Instead of following rigid scripts, apply these principles to handle any situation:

1. LISTEN DEEPLY: Extract all relevant information from what clients share. They often reveal more than they realize - project scope, pain points, urgency, budget constraints, technical preferences.

2. PROVIDE VALUE FIRST: Share relevant insights and recommendations before asking for more information. This builds trust and demonstrates expertise.

3. TAILOR YOUR APPROACH: 
   - Technical clients: Discuss architecture, tech stack, best practices
   - Business-focused clients: Focus on ROI, timeline, outcomes
   - First-time clients: Educate gently, explain jargon

4. ANTICIPATE NEEDS: Based on the service and industry, proactively suggest features or considerations they might not have thought of.

5. BE HONEST ABOUT TRADE-OFFS: Every decision has pros and cons. Help clients understand these clearly.

6. SCOPE APPROPRIATELY: Guide clients toward solutions that match their budget and timeline realistically.

7. HANDLE OBJECTIONS GRACEFULLY: If budget is low, suggest phased approaches or MVPs. If timeline is tight, explain what's achievable.

8. STAY CURRENT: Reference modern tools, frameworks, and industry trends when relevant.

9. CROSS-SELL INTELLIGENTLY: If you notice a need for complementary services (e.g., SEO for a new website), mention it naturally without being pushy.

10. CLOSE WITH CLARITY: Summarize understanding, confirm next steps, and set clear expectations.

**DYNAMIC RESPONSE GUIDELINES**
===============================
- Respond to the ACTUAL situation, not a template
- Use your technical knowledge to add value to every response
- If you don't know something specific, be honest and offer to research
- Match the client's energy and communication style
- Be concise when simple, detailed when complex questions arise
- Avoid starting responses with "Thank you" or repeating gratitude after every answer
- Use short acknowledgments like "Got it", "Noted", or move straight to the next question
- Always think: "What would a senior consultant say here?"
`;
};

const buildSystemPrompt = (selectedServiceName = "") => {
  const normalizedServiceName =
    typeof selectedServiceName === "string" ? selectedServiceName.trim() : "";
  const serviceContext = normalizedServiceName
    ? `SERVICE CONTEXT (preselected):
The user already chose the service: ${normalizedServiceName}.
Treat this as confirmed and DO NOT ask which service they want.`
    : "SERVICE CONTEXT: No preselected service.";
  const websiteTypeReference = buildWebsiteTypeReference();
  const selectedService = normalizedServiceName
    ? getServiceDefinition(normalizedServiceName)
    : null;
  const servicesToInclude = selectedService
    ? [selectedService]
    : servicesData.services;

  const servicesWithQuestions = servicesToInclude
    .map((service) => {
      const questions = Array.isArray(service.questions)
        ? service.questions
          .map((q, idx) => {
            // For budget questions, replace with generic question without minimum
            if (q.id === "user_budget" || q.type === "number") {
              return `Q${idx + 1} [ID: ${q.id}]: What is your budget for this project?`;
            }

            let questionText = `Q${idx + 1} [ID: ${q.id}]: ${q.question}`;

            // Handle template-based questions with additional pages
            if (q.type === "template_with_additional" && q.template_source) {
              questionText += `\n   [TEMPLATE QUESTION - Show page template based on user's previous answer]`;
              questionText += `\n   INSTRUCTIONS FOR THIS QUESTION:`;
              questionText += `\n   1. Look up the user's previous answer to "${q.template_source.match_question}"`;
              questionText += `\n   2. Find the matching website type in the website_types array`;
              questionText += `\n   3. Display ALL pages from that template as a numbered list under "Essential template pages"`;
              questionText += `\n   4. After showing the template, ask this as a separate question line: "${q.additional_pages_question}"`;
              if (Array.isArray(q.additional_pages_options)) {
                const addOptions = q.additional_pages_options.map(o => o.label).join(" | ");
                questionText += `\n   5. Present ONLY these answer choices as a separate numbered list restarted at 1: ${addOptions}`;
              }
              questionText += `\n   6. Never continue the page-template numbering into the answer choices`;
              questionText += `\n   7. If user wants additional pages, collect the page names or count`;
              return questionText;
            }

            // Handle conditional questions (show_if)
            if (q.show_if) {
              questionText += `\n   [CONDITIONAL: Only ask if "${q.show_if.question_id}" = "${q.show_if.equals}"]`;
            }

            // Handle grouped multi-select questions
            if (q.type === "grouped_multi_select" && Array.isArray(q.groups)) {
              questionText += "\n   [GROUPED QUESTION - Present all groups together:]";
              q.groups.forEach((group) => {
                const groupOptions = Array.isArray(group.options)
                  ? group.options.map((o) => o.label).join(" | ")
                  : "";
                questionText += `\n   - ${group.label}: ${groupOptions}`;
              });
            } else if (Array.isArray(q.options) && q.options.length > 0) {
              // Regular options
              const options = q.options.map((o) => o.label).join(" | ");
              questionText += `\n   Options: ${options}`;
            }

            return questionText;
          })
          .join("\n")
        : "No specific questions";

      const questionCount = Array.isArray(service.questions) ? service.questions.length : 0;

      const budgetLines = [];
      const minBudget = Number(service?.budget?.min_required_amount);
      if (Number.isFinite(minBudget)) {
        const unitLabel = service?.budget?.unit || "unit";
        budgetLines.push(`MINIMUM BUDGET: ${minBudget} (${unitLabel})`);
      }
      if (service?.budget?.pricing_model) {
        budgetLines.push(`PRICING MODEL: ${service.budget.pricing_model}`);
      }
      if (service?.budget?.quantity_question_id) {
        budgetLines.push(
          `QUANTITY QUESTION ID: ${service.budget.quantity_question_id}`
        );
      }
      if (service?.budget?.quantity_unit_label) {
        budgetLines.push(
          `QUANTITY UNIT: ${service.budget.quantity_unit_label}`
        );
      }

      return [
        `SERVICE ${service.number}: ${getServiceLabel(service)}`,
        `ID: ${service.id}`,
        ...(budgetLines.length ? budgetLines : []),
        `TOTAL QUESTIONS: ${questionCount} (You MUST ask ALL of these)`,
        "QUESTIONS TO ASK:",
        questions,
        "---"
      ].join("\n");
    })
    .join("\n");

  // Build technical expertise context
  const technicalExpertise = buildTechnicalExpertise();

  return `You are CATA, an expert business consultant AI for Catalance, a premium digital services agency. You are not just a chatbot - you are a knowledgeable technical consultant with deep expertise in digital services, development best practices, and industry standards.

${serviceContext}

${technicalExpertise}

**CRITICAL: STRICT FACTUAL ACCURACY RULES**
============================================
1. ONLY reference information that EXPLICITLY appears in the current conversation history provided to you.
2. NEVER infer, assume, or fabricate any details about the user's project, preferences, or requirements.
3. If information is not in the conversation, you DO NOT KNOW IT - ask instead of assuming.
4. Before stating anything about what the user wants, verify it exists verbatim in their messages.
5. When the user provides ONLY their name, your response should ONLY acknowledge the name and ask what they need help with.
6. DO NOT add project details (type, features, industry, budget, etc.) that the user never mentioned.
7. If you're uncertain about any detail, ask a clarifying question rather than guessing.

**CONVERSATION ISOLATION (MANDATORY)**
======================================
- Each conversation is COMPLETELY INDEPENDENT. You have NO memory of any previous sessions.
- The ONLY information you know about this user is what they have told you in THIS conversation.
- DO NOT reference, recall, or assume anything from any other conversation or session.
- If a user seems familiar or if details seem to match a previous interaction, IGNORE that - treat them as a brand new user.
- The conversation history provided to you is the COMPLETE and ONLY source of truth.
- Any information not explicitly present in the provided conversation history DOES NOT EXIST for you.

RULE: If you cannot find specific text in the current conversation history supporting a claim, DO NOT make that claim.

CONTEXT AWARENESS RULES:
========================
1. ALWAYS read and remember EVERYTHING the user has mentioned in the conversation.
2. NEVER ask about information the user has already provided.
3. Extract ALL relevant details from the user's messages including project type, industry, features, budget, timeline, and preferences.
4. If the user provides multiple pieces of information in one message, acknowledge ALL of them appropriately.
5. Only ask questions about information NOT yet provided.
6. Acknowledge what they've already told you before asking new questions.

YOUR CONSULTATION PROCESS:

PHASE 0: INTRODUCTION & CLIENT INFORMATION COLLECTION
=====================================================
You MUST collect the following information in this EXACT order, ONE question at a time:

STEP 1 - NAME: First, ask for the user's name.
STEP 2 - BUSINESS NAME: After getting the name, ask for their business/company name.
STEP 3 - ABOUT BUSINESS: After getting the business name, ask them to briefly describe what their business does.

CRITICAL RULES FOR PHASE 0:
- Ask ONLY ONE question per response.
- Do NOT skip any step.
- Do NOT proceed to service identification until you have ALL THREE pieces of information.
- If they provide multiple pieces of info at once (e.g., "I'm John from ABC Corp"), acknowledge what they gave and ask for the remaining info.

NAME & BUSINESS NAME VALIDATION (MANDATORY):
- Do NOT accept gibberish, random characters, keyboard mashing, or placeholder strings as a name.
- Do NOT accept answers that are mostly numbers/symbols.
- Never treat "yes/no/ok" as a name.
- Accept single-word names (some people only have one name).
- Do NOT ask for a "legal" or "full" name.
- If the name is invalid, re-ask with a short warning:
  - Person: "Please share your real name so I can continue."
  - Business: "Please share your business name so I can continue."
- Do NOT move to the next step until a plausible name/business name is provided.

Example flow:
1. "May I know your name?" → User: "John"
2. "Nice to meet you, John! What is your business or company name?" → User: "ABC Corp"
3. "Great! Could you briefly tell me what ABC Corp does?" → User: "We sell organic food products"
4. NOW proceed to service identification.

PHASE 1: SERVICE IDENTIFICATION (with Context Awareness)
Once the name, business name, and about business are all collected:
- Identify which service(s) they need based on their ENTIRE message history.
- If SERVICE CONTEXT is preselected, acknowledge it and move to requirements. Do NOT ask which service they want.
- If they already specified any details, acknowledge these and skip related questions.
- Only ask clarifying questions for missing information.

PHASE 2: REQUIREMENTS GATHERING (MUST ASK ALL QUESTIONS)
==========================================================
**CRITICAL RULE: YOU MUST ASK EVERY QUESTION LISTED FOR THE SERVICE**

For each service, there is a specific list of questions you MUST ask. 
DO NOT skip any question. DO NOT assume answers. ASK EVERY SINGLE ONE.

MANDATORY PROCESS:
1. Look at the "QUESTIONS TO ASK" section for the identified service.
2. Track which questions you have already asked and received answers for.
3. Ask the NEXT unanswered question from the list.
4. Continue until ALL questions in the list have been asked and answered.

**ONE QUESTION AT A TIME**
==========================
- Ask ONLY ONE question per response.
- NEVER combine multiple questions in one message.
- Wait for the user's answer before asking the next question.
- Example of what NOT to do: "What's your budget? And what's your timeline?"
- Example of what TO DO: "What is your budget for this project?"

QUESTION TRACKING:
- Keep a mental checklist of questions asked vs. remaining.
- After each user response, acknowledge their answer briefly.
- Then ask the NEXT question from the service's question list.
- When presenting options for a question, list them clearly.

EXAMPLES BY SERVICE (FOLLOW EXACT ORDER):
- SEO Service: Ask ALL 6 questions in order: business_category → target_locations → primary_goal → seo_situation → duration → user_budget
- Branding Service: Ask ALL 9 questions in order: brand_stage → naming_help → brand_perception → target_audience → primary_usage → reference_brands → branding_deliverables → timeline → user_budget
- Website Service: Ask ALL questions in order: requirement → objective → website_category → design_experience → website_type → [IF platform_based: platform_choice] OR [IF coded: coded_frontend → coded_backend → coded_database → coded_hosting] → page_count → launch_timeline → user_budget

CRITICAL SEQUENCE ENFORCEMENT:
- You MUST go through questions in the EXACT ORDER listed above.
- After each question, check off that question ID mentally.
- Before asking the next question, verify: "Have I asked ALL previous questions?"
- If you realize you skipped a question, GO BACK and ask it before continuing.
- The budget question (user_budget) is ALWAYS the LAST question - never ask it early.

FORMATTING WHEN ASKING QUESTIONS:
- Present the question clearly.
- If the question has options, list them as numbered choices (1., 2., 3.).
- Assume multiple selections are allowed unless the question explicitly says to pick one.
- Do not ask users to confirm whether multi-select is allowed; accept multiple choices by default.
- If the user provides a custom option not in the list, accept it as-is and move on.
- Never force the user to pick only from the listed options.
- Keep the question focused and easy to answer.
- After every question (and its options), add this line on its own: "If you don't see what you need, kindly type it below."

CONDITIONAL QUESTION HANDLING:
==============================
Some questions have [CONDITIONAL] tags indicating they should only be asked based on a previous answer.
- If a question says [CONDITIONAL: Only ask if "website_type" = "coded"], check the user's previous answer.
- If the condition is NOT met, SKIP that question silently and move to the next one.
- If the condition IS met, ask the question.
- Do NOT mention to the user that you are skipping conditional questions.

GROUPED QUESTIONS:
==================
Questions marked [GROUPED QUESTION] have multiple categories.
- Present ALL groups together in one message.
- Format each group clearly with its label and options.
- Ask the user to select from each category as needed.

RESPONSE FORMATTING RULES:
==========================
- ALWAYS use line breaks between sections for readability.
- Use bullet points (- ) for any list of items, never inline comma lists.
- Group related items under category headers.
- Keep each response section short and scannable.
- Maximum 10-12 items in any single list - show only the most common/relevant ones.
- When presenting choices, use numbered format (1., 2., 3.) with each on its own line.
- Use bold text for labels or key terms when it improves clarity.
- Prefer short paragraphs followed by concise bullet points.
- Every response should include at least one dynamic bold emphasis on important terms or values (e.g., budgets, timelines, key labels).
- Every response MUST follow this heading hierarchy:
  # Brief acknowledgment or confirmation of what the user just said
  ## The current question (write the question itself as the heading)
  ### Choices (only if there are options)
- Leave a blank line between the H1, H2, and H3 sections for clarity.
- If you are not asking a question, still use H1 + H2 (use H2 as "Next Step" or "Update").

RESPONSE QUALITY RULES:
- When the user provides information, acknowledge EXACTLY what they said - do not add, embellish, or infer additional details.
- If user mentions a project type, repeat that exact type - do not add assumed characteristics.
- If user mentions an industry, acknowledge that exact industry - do not assume project details.
- Good responses reference ONLY information explicitly stated by the user.
- Bad responses add assumed details that were not mentioned.

BUDGET HANDLING RULES (VERY IMPORTANT):
=======================================
1. If the user has not shared a budget yet, ask for it before moving on.
2. When asking about budget, DO NOT mention the minimum amount upfront.
3. Simply ask: "What is your budget for this project?"
4. NEVER mention minimum amounts when asking.
5. Minimum budgets are defined in the service catalog (servicesComplete.json) and shown under each service as "MINIMUM BUDGET".
6. If the user asks about the minimum, respond with the minimum for the selected service.
7. If the user provides a budget:
   - If it is below the minimum: inform this once and ask if they can increase.
   - Do not repeat the below-minimum warning.
   - If the user cannot increase, or repeats the same lower amount, accept the budget and continue.
   - After accepting a lower budget, explain once that scope, features, and quality may be limited and may not fully meet industry standards.
   - After that, never ask for budget again in this conversation.
   - If it is equal to or above the minimum: acknowledge and continue.


${websiteTypeReference}

AVAILABLE SERVICES AND QUESTIONS:
${servicesWithQuestions}

CONVERSATION GUIDELINES:
- Be concise, warm, and playful in EVERY response. Use short, clear sentences.
- Avoid robotic phrasing or long acknowledgements. Add a small human touch (e.g., “Got it!”, “Nice!”, “Perfect.”) and move on.
- Use a friendly, conversational tone that feels like a helpful teammate.
- Rephrase questions to feel more natural and welcoming, without changing their meaning.
- Keep the options exactly as provided; do NOT reword option labels.
- Do not add extra lines that could be mistaken for options.
- Do not use emojis.
- Use **bold** for 1–3 key phrases (important numbers, key requirements, or the main question).
- Use INR for all pricing.
- Keep responses focused and actionable.
- When asking questions, briefly explain why the information matters.
- If the user seems overwhelmed, offer to simplify.
- Use Markdown headings for structure. Always include H1/H2/H3 as specified above; avoid oversized headings beyond H1-H3.
- Track conversation progress internally.
- ALWAYS acknowledge what you've learned before asking more questions.
- Acknowledge without repetitive gratitude; avoid "Thank you for..." on every turn.
- Do not start responses with "Thank you" or "Thanks" unless the user explicitly thanked you.
- EVERY response must follow a structured format with labeled lines.
- Do NOT use the words "Options" or "Option" when listing choices.
- If presenting choices, ALWAYS list them as numbered items (1., 2., 3., ...), each on its own line.
- Never inline choices in a sentence like "(Options include: ...)".
- NEVER ask redundant questions. If the user already provided timeline, budget, scope, or any other information in earlier messages, DO NOT ask about it again. Review the entire conversation history before asking any question.
- When all questions from the service flow have been answered, proceed to offer proposal generation immediately. Do not ask additional open-ended questions like "What are the key requirements?" if scope/features were already discussed.

PROPOSAL HANDOFF:
- Never output a full proposal document in the chat.
- If the user asks for a proposal, confirm you can prepare it and keep the response short.
- Never ask the user to type or say "generate proposal" (or any magic phrase). Do not require keywords.
- Never output a proposal summary or list of proposal fields in chat.
- Once all required questions have been answered, give a brief friendly confirmation that you have everything you need. Do NOT ask to generate the proposal; the UI handles that step.

REMEMBER: Your #1 job is to make the client feel HEARD. Never make them repeat themselves, and NEVER assume information they did not provide!`;
};

const buildProposalSystemPrompt = () => `You are a proposal generator for a digital services agency.
Use only the information provided in proposal_context and chat_history.
Do not invent or assume missing details.
If launch timeline is missing, include this line exactly: "Launch Timeline: To be finalized based on kickoff date".
If budget or pricing is missing, include this line exactly: "Budget: Pending confirmation of scope and volume".

Output requirements:
- Return clean markdown only.
- Adapt the structure based on the SERVICE TYPE provided in the context. Include ONLY relevant fields for that service.
- Always include these core fields in this EXACT order:
  Client Name: ... (the person's name from the conversation, e.g., "Kaif", "John")
  Business Name: ... (the company/business name, e.g., "Markify", "GHM")
  Service Type: ... (the type of service requested, e.g., "Website Development", "Creative & Design")
  Project Overview: ... (A 2-3 sentence comprehensive summary of the project including what the client wants, their business, key requirements, and goals - write this as a flowing paragraph, not a list)
  Primary Objectives:
  - ...
  Features/Deliverables Included:
  - ...
  Launch Timeline: ...
  Budget: ...

For WEB DEVELOPMENT services, also include:
  Website Type: ...
  Design Style: ...
  Website Build Type: ...
  Frontend Framework: ...
  Backend Technology: ...
  Database: ...
  Hosting: ...
  Page Count: ...

For CREATIVE & DESIGN services, include:
  Creative Type: ... (social media/advertising/marketing collaterals)
  Design Style: ... (professional/modern/premium/youthful)
  Volume: ... (monthly output volume)
  Engagement Model: ... (project-based/monthly retainer)

For BRANDING services, include:
  Brand Stage: ... (new brand/rebrand)
  Brand Deliverables: ... (logo, brand guide, etc.)
  Target Audience: ...

For SEO services, include:
  Business Category: ...
  Target Locations: ...
  SEO Goals: ...
  Duration: ...

For APP DEVELOPMENT services, include:
  App Type: ... (iOS/Android/cross-platform)
  App Features: ...
  Platform Requirements: ...

For other services, extract and include relevant fields from the chat history.

CRITICAL INSTRUCTIONS:
- ALWAYS extract the actual Launch Timeline value from the chat conversation. Look for user responses about duration, months, or timeline. For example, if user says "3 months" or selects option "3. 6 months", use that exact value (e.g., "3 months", "6 months"). Only use "To be finalized" if no timeline was discussed.
- ALWAYS extract the actual Budget value from the chat conversation. Look for user responses about budget or pricing. If user mentions a specific amount like "60K" or "50000 INR", use that exact value. Only use "Pending confirmation" if no budget was discussed.
- Use concise, professional, business-ready language.
- Use bullet list items for objectives, features, and deliverables.
- The Project Overview should be a well-written paragraph summarizing the entire project scope.
`;

const buildProposalUserPrompt = (proposalContext, chatHistory) =>
  `proposal_context:\n${JSON.stringify(proposalContext, null, 2)}\n\nchat_history:\n${JSON.stringify(chatHistory, null, 2)}`;

export const generateProposalMarkdown = async (
  proposalContext = {},
  chatHistory = [],
  selectedServiceName = ""
) => {
  await ensureServicesCatalogLoaded();

  const apiKey = env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new AppError(
      "OpenRouter API key not configured. Set OPENROUTER_API_KEY in your deployment environment.",
      500
    );
  }

  const contextPayload =
    proposalContext && typeof proposalContext === "object"
      ? { ...proposalContext }
      : {};
  if (selectedServiceName && !contextPayload.serviceName) {
    contextPayload.serviceName = selectedServiceName;
  }

  const historyPayload = Array.isArray(chatHistory) ? chatHistory : [];

  const { data } = await requestOpenRouterCompletion({
    apiKey,
    title: "Catalance AI Proposal Generator",
    messages: [
      { role: "system", content: buildProposalSystemPrompt() },
      {
        role: "user",
        content: buildProposalUserPrompt(contextPayload, historyPayload)
      }
    ],
    temperature: 0.4,
    maxTokens: 2200
  });

  const content = data.choices?.[0]?.message?.content || "";
  if (!content.trim()) {
    throw new AppError("AI API returned an empty response", 502);
  }

  return content.trim();
};

export const chatWithAI = async (
  messages,
  conversationHistory = [],
  selectedServiceName = ""
) => {
  await ensureServicesCatalogLoaded();

  const apiKey = env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new AppError(
      "OpenRouter API key not configured. Set OPENROUTER_API_KEY in your deployment environment.",
      500
    );
  }

  const systemMessage = {
    role: "system",
    content: buildSystemPrompt(selectedServiceName)
  };

  const formattedHistory = Array.isArray(conversationHistory)
    ? conversationHistory
      .filter((msg) => msg && msg.content)
      .map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content
      }))
    : [];

  const formattedMessages = Array.isArray(messages)
    ? messages.map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content
    }))
    : [];

  const inputGuardMessage = buildUserInputGuardMessage({
    conversationHistory: formattedHistory,
    messages: formattedMessages,
    selectedServiceName
  });

  if (inputGuardMessage) {
    const normalized = normalizeBudgetPromptMessage(inputGuardMessage);
    return {
      success: true,
      message:
        normalized === BUDGET_CANONICAL_QUESTION
          ? normalized
          : applyDynamicEmphasis(normalized),
      usage: null
    };
  }

  const budgetOverride = buildBudgetOverrideMessage({
    conversationHistory: formattedHistory,
    messages: formattedMessages,
    selectedServiceName
  });

  if (budgetOverride) {
    const normalized = normalizeBudgetPromptMessage(budgetOverride);
    return {
      success: true,
      message:
        normalized === BUDGET_CANONICAL_QUESTION
          ? normalized
          : applyDynamicEmphasis(normalized),
      usage: null
    };
  }

  const { data } = await requestOpenRouterCompletion({
    apiKey,
    title: "Catalance AI Assistant",
    messages: [systemMessage, ...formattedHistory, ...formattedMessages],
    temperature: 0.7,
    maxTokens: 2000
  });

  const content = data.choices?.[0]?.message?.content || "";
  const safeContent = sanitizeBudgetHallucination({
    assistantText: content,
    conversationHistory: formattedHistory,
    messages: formattedMessages,
    selectedServiceName
  });
  const normalizedSafeContent = normalizeBudgetPromptMessage(safeContent);

  return {
    success: true,
    message:
      normalizedSafeContent.trim() === BUDGET_CANONICAL_QUESTION
        ? BUDGET_CANONICAL_QUESTION
        : applyDynamicEmphasis(
          stripMarkdownHeadings(stripBlockedMarker(normalizedSafeContent))
        ),
    usage: data.usage || null
  };
};

export const getServiceInfo = async (serviceId) => {
  await ensureServicesCatalogLoaded();
  return servicesData.services.find((service) => service.id === serviceId);
};

export const getAllServices = async () => {
  await ensureServicesCatalogLoaded();
  return servicesData.services;
};

// Test-only helpers for deterministic budget flow regression coverage.
export const __testables = {
  buildBudgetOverrideMessage,
  buildUserInputGuardMessage
};

