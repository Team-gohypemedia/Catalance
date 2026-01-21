import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const servicesData = JSON.parse(
  readFileSync(join(__dirname, "../data/servicesComplete.json"), "utf-8")
);

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
const DEFAULT_REFERER = process.env.FRONTEND_URL || "http://localhost:5173";

const stripMarkdownHeadings = (text = "") =>
  text.replace(/^\s*#{1,6}\s+/gm, "");

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
    "WEBSITE TYPE REFERENCE (use only for Website / UI-UX service):",
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
    for (let i = min; i <= max; i += 1) {
      rangeNumbers.push(i);
    }
  }

  const digitsOnly = /^[\d\s,.-]+$/.test(trimmed);
  const hasSeparator = /[,\s]/.test(trimmed);
  const numberMatches = trimmed.match(/\d+/g) || [];
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

const BUDGET_WARNING_REGEX =
  /budget.*below|below.*minimum|required.*minimum|minimum required/i;
const BUDGET_PROCEED_REGEX =
  /proceed|go ahead|continue|move forward|use current|current budget|same budget|stick with|okay with|fine with|works with|keep it/i;
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

const extractLatestBudgetFromBudgetQuestions = (conversationHistory = []) => {
  let latest = null;
  const budgetQuestionRegex = /budget|investment|how much|price|cost/i;

  for (let i = 0; i < conversationHistory.length - 1; i++) {
    const msg = conversationHistory[i];
    const nextMsg = conversationHistory[i + 1];
    if (msg?.role !== "assistant" || !budgetQuestionRegex.test(msg.content || "")) {
      continue;
    }
    if (nextMsg?.role !== "user") continue;
    const parsed = parseBudgetFromText(nextMsg.content || "");
    if (parsed?.amount) {
      latest = parsed;
    }
  }

  return latest;
};

const evaluateBudgetStatus = (conversationHistory, budgetAmount, minBudget) => {
  const status = {
    minBudget,
    isBelowMinimum: false,
    isConfirmed: false,
    updatedBudget: null,
    updatedCurrency: null
  };

  if (!minBudget || !Number.isFinite(minBudget)) {
    status.isConfirmed = !!budgetAmount;
    return status;
  }

  if (!budgetAmount || !Number.isFinite(budgetAmount)) {
    return status;
  }

  if (budgetAmount >= minBudget) {
    status.isConfirmed = true;
    return status;
  }

  status.isBelowMinimum = true;

  let warningIndex = -1;
  conversationHistory.forEach((msg, index) => {
    if (msg?.role === "assistant" && BUDGET_WARNING_REGEX.test(msg.content || "")) {
      warningIndex = index;
    }
  });

  if (warningIndex < 0) return status;

  for (let i = warningIndex + 1; i < conversationHistory.length; i++) {
    const msg = conversationHistory[i];
    if (msg?.role !== "user") continue;
    const text = msg.content || "";
    const parsed = parseBudgetFromText(text);

    if (parsed?.amount) {
      if (parsed.amount >= minBudget) {
        status.isConfirmed = true;
        status.updatedBudget = parsed.amount;
        status.updatedCurrency = parsed.currency;
        status.isBelowMinimum = false;
        return status;
      }
      if (BUDGET_PROCEED_REGEX.test(text)) {
        status.isConfirmed = true;
        status.updatedBudget = parsed.amount;
        status.updatedCurrency = parsed.currency;
        return status;
      }
    } else if (BUDGET_PROCEED_REGEX.test(text)) {
      status.isConfirmed = true;
      return status;
    }
  }

  return status;
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
      if (uniqueNumericLabels.length) {
        if (!ambiguous || !summaryText) {
          return uniqueNumericLabels.join(", ");
        }
      }

      const userItems = splitMultiSelectItems(trimmed);
      const userLabels = matchOptionLabelsFromItems(options, userItems);
      if (userLabels.length) return userLabels.join(", ");

      const labelMatch = findOptionLabelMatch(options, trimmed, question);
      if (labelMatch) return labelMatch;

      const summaryItems = extractBulletItems(summaryText);
      const summaryLabels = matchOptionLabelsFromItems(options, summaryItems);
      if (summaryLabels.length) return summaryLabels.join(", ");

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

      return [
        `SERVICE ${service.number}: ${service.name}`,
        `ID: ${service.id}`,
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

RESPONSE QUALITY RULES:
- When the user provides information, acknowledge EXACTLY what they said - do not add, embellish, or infer additional details.
- If user mentions a project type, repeat that exact type - do not add assumed characteristics.
- If user mentions an industry, acknowledge that exact industry - do not assume project details.
- Good responses reference ONLY information explicitly stated by the user.
- Bad responses add assumed details that were not mentioned.

BUDGET HANDLING RULES (VERY IMPORTANT):
=======================================
1. If the user has not shared a budget yet, ask for it before moving on.
2. Set MIN_BUDGET to the minimum required for the selected service using the list below.
3. When asking about budget, DO NOT mention the minimum amount upfront.
4. Simply ask: "What is your budget for this project?" or "What budget do you have in mind for this?"
5. NEVER mention minimum amounts when asking.
6. ONLY AFTER the user gives their budget amount, compare it to MIN_BUDGET:
   - If the budget is EQUAL TO OR GREATER than MIN_BUDGET: Confirm it meets the minimum and continue to the next step.
   - If the budget is LOWER than MIN_BUDGET: Politely inform them that their amount is below the minimum required and ask if they can increase it.
   - If the user insists on proceeding with a lower budget after being informed: Explain you can continue but the quality may not be good due to the limited budget, then ask if they want to proceed with the current budget or increase it.
7. Use a friendly tone when informing about low budget.
8. NEVER reject the client outright - always offer to discuss or find alternatives.

Minimum budgets for reference (DO NOT mention to user unless they provide a lower amount):
- Branding: ₹25,000/project
- Website/UI-UX: ₹25,000/project
- SEO: ₹10,000/month
- Social Media Marketing: ₹10,000/month
- Paid Advertising: ₹25,000/month ad spend
- App Development: ₹1,00,000/project
- Software Development: ₹1,00,000/project
- Lead Generation: ₹15,000/month
- Influencer Marketing: ₹25,000/campaign
- Email Marketing: ₹10,000/month
- Video Production: ₹2,000/video
- CGI Videos: ₹25,000/project
- 3D Modeling: ₹1,00,000/project
- E-commerce Setup: ₹50,000/project

${websiteTypeReference}

AVAILABLE SERVICES AND QUESTIONS:
${servicesWithQuestions}

CONVERSATION GUIDELINES:
- Be warm, professional, and consultative.
- Use INR for all pricing.
- Keep responses focused and actionable.
- When asking questions, briefly explain why the information matters.
- If the user seems overwhelmed, offer to simplify.
- Do not use Markdown headings or bold. Avoid lines that start with # (including ##).
- Track conversation progress internally.
- ALWAYS acknowledge what you've learned before asking more questions.
- Acknowledge without repetitive gratitude; avoid "Thank you for..." on every turn.
- Do not start responses with "Thank you" or "Thanks" unless the user explicitly thanked you.
- EVERY response must follow a structured format with labeled lines.
- Do NOT use the words "Options" or "Option" when listing choices.
- If presenting choices, ALWAYS list them as numbered items (1., 2., 3., ...), each on its own line.
- Never inline choices in a sentence like "(Options include: ...)".

PROPOSAL HANDOFF:
- Never output a full proposal document in the chat.
- If the user asks for a proposal, say you can generate it and ask if they want you to proceed.
- Never ask the user to type or say "generate proposal" (or any magic phrase). Do not require keywords; ask for a simple confirmation instead.
- Never output a proposal summary or list of proposal fields in chat; keep it to a short proceed question.

REMEMBER: Your #1 job is to make the client feel HEARD. Never make them repeat themselves, and NEVER assume information they did not provide!`;
};

const buildProposalSystemPrompt = () => `You are a proposal generator for a digital services agency.
Use only the information provided in proposal_context and chat_history.
Do not invent or assume missing details.
If launch timeline is missing, include this line exactly: "Launch Timeline: To be finalized based on kickoff date".
If budget or pricing is missing, include this line exactly: "Budget: Pending confirmation of scope and volume".

Output requirements:
- Return clean markdown only.
- Use this exact structure (omit any field you truly do not have, except Launch Timeline and Budget must always appear):
  # Proposal Summary
  Business Name: ...
  Website Requirement: ...
  Primary Objectives:
  - ...
  Website Type: ...
  Design Experience: ...
  Website Build Type: ...
  Frontend Framework: ...
  Backend Technology: ...
  Database: ...
  Hosting: ...
  Features Included:
  - ...
  Page Count: ...
  Launch Timeline: ...
  Budget: ...
- Use concise, professional, business-ready language.
- Use bullet list items for Primary Objectives and Features Included.
`;

const buildProposalUserPrompt = (proposalContext, chatHistory) =>
  `proposal_context:\n${JSON.stringify(proposalContext, null, 2)}\n\nchat_history:\n${JSON.stringify(chatHistory, null, 2)}`;

export const generateProposalMarkdown = async (
  proposalContext = {},
  chatHistory = [],
  selectedServiceName = ""
) => {
  const apiKey = env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new AppError("OpenRouter API key not configured", 500);
  }

  const contextPayload =
    proposalContext && typeof proposalContext === "object"
      ? { ...proposalContext }
      : {};
  if (selectedServiceName && !contextPayload.serviceName) {
    contextPayload.serviceName = selectedServiceName;
  }

  const historyPayload = Array.isArray(chatHistory) ? chatHistory : [];

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": DEFAULT_REFERER,
      "X-Title": "Catalance AI Proposal Generator"
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: buildProposalSystemPrompt() },
        { role: "user", content: buildProposalUserPrompt(contextPayload, historyPayload) }
      ],
      temperature: 0.4,
      max_tokens: 2200
    })
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage = data?.error?.message || "AI API request failed";
    const isAuthError =
      response.status === 401 ||
      response.status === 403 ||
      /user not found|invalid api key|unauthorized/i.test(errorMessage);

    if (isAuthError) {
      throw new AppError(
        "OpenRouter authentication failed. Verify OPENROUTER_API_KEY in your .env.",
        502
      );
    }

    throw new AppError(errorMessage, 502);
  }

  if (!data) {
    throw new AppError("AI API returned an invalid response", 502);
  }

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
  const apiKey = env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new AppError("OpenRouter API key not configured", 500);
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

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": DEFAULT_REFERER,
      "X-Title": "Catalance AI Assistant"
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [systemMessage, ...formattedHistory, ...formattedMessages],
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage = data?.error?.message || "AI API request failed";
    const isAuthError =
      response.status === 401 ||
      response.status === 403 ||
      /user not found|invalid api key|unauthorized/i.test(errorMessage);

    if (isAuthError) {
      throw new AppError(
        "OpenRouter authentication failed. Verify OPENROUTER_API_KEY in your .env.",
        502
      );
    }

    throw new AppError(errorMessage, 502);
  }

  if (!data) {
    throw new AppError("AI API returned an invalid response", 502);
  }

  const content = data.choices?.[0]?.message?.content || "";

  return {
    success: true,
    message: stripMarkdownHeadings(content),
    usage: data.usage || null
  };
};

export const getServiceInfo = (serviceId) =>
  servicesData.services.find((service) => service.id === serviceId);

export const getAllServices = () => servicesData.services;



