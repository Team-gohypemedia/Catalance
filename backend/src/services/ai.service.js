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

  const digitsOnly = /^[\d\s,.-]+$/.test(trimmed);
  const hasSeparator = /[,\s]/.test(trimmed);
  const numberMatches = trimmed.match(/\d+/g) || [];
  if (!numberMatches.length) return { numbers: [], ambiguous: false };

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

  const validNumbers = optionsLength
    ? numbers.filter((value) => value <= optionsLength)
    : numbers;

  return { numbers: validNumbers, ambiguous };
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
5. Only after ALL questions are answered, proceed to proposal generation.

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
- Website Service: Ask ALL questions in order: requirement → objective → website_category → design_experience → website_type → [IF platform_based: platform_choice] OR [IF coded: coded_frontend → coded_backend → coded_cms → coded_database → coded_hosting] → page_count → launch_timeline → user_budget

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

STRICT PROPOSAL GENERATION RULE:
================================
**YOU MUST NOT OFFER TO GENERATE OR DISPLAY A PROPOSAL UNTIL:**
1. You have asked the user's name
2. You have asked ALL non-conditional questions for the service
3. You have asked ALL conditional questions WHERE the condition was met
4. The user has answered the budget question

If the user asks for a proposal before all questions are answered, politely explain you need a few more details first and ask the next question.

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

PHASE 3: PROPOSAL CONFIRMATION
================================
IMPORTANT: DO NOT generate the actual proposal text in the chat. The proposal is automatically generated and displayed in a sidebar panel.

After gathering ALL required information (name, service, requirements, timeline, budget), you should:
1. Summarize what you've understood from the conversation
2. Ask if they're ready to see their personalized proposal
3. Once they confirm, say something like "Great! Your proposal is now ready. You can view it in the proposal panel on the right."

WHAT NOT TO DO:
- Do NOT write out "PROJECT PROPOSAL" or similar formatted proposals in the chat
- Do NOT list out pricing, phases, or deliverables in your chat messages
- Do NOT generate structured proposal documents in the conversation

WHAT TO DO INSTEAD:
- Summarize the key points you've gathered
- Ask for confirmation that the details are correct
- Let them know their proposal is ready to view in the sidebar

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
- Only offer to generate the proposal after all required questions for the chosen service are answered (including budget or pricing level when applicable).
- Always confirm before generating the final proposal.
- EVERY response must follow a structured format with labeled lines.
- Do NOT use the words "Options" or "Option" when listing choices.
- If presenting choices, ALWAYS list them as numbered items (1., 2., 3., ...), each on its own line.
- Never inline choices in a sentence like "(Options include: ...)".

REMEMBER: Your #1 job is to make the client feel HEARD. Never make them repeat themselves, and NEVER assume information they did not provide!`;
};

// ============================================
// PROPOSAL EXTRACTION & GENERATION LOGIC
// ============================================

const PROPOSAL_FIELDS = [
  "clientName",
  "serviceName",
  "projectType",
  "requirements",
  "timeline",
  "budget",
  "additionalDetails",
  "pages",
  "technologies",
  "integrations"
];

/**
 * Extract proposal data from conversation history
 */
const extractProposalData = (conversationHistory, aiResponse, selectedServiceName = "") => {
  const allMessages = [...conversationHistory, { role: "assistant", content: aiResponse }];
  const fullConversation = allMessages.map(m => m.content).join("\n");

  const proposalData = {
    clientName: null,
    businessName: null,
    aboutBusiness: null,
    serviceName: selectedServiceName || null, // Use passed service name as default
    projectType: null,
    requirements: [],
    timeline: null,
    budget: null,
    pricingLevel: null,
    questionAnswers: [],
    additionalDetails: [],
    phases: [],
    pages: null,
    technologies: [],
    integrations: []
  };

  // Extract client name from USER messages only (avoid matching CATA)
  const userMessages = conversationHistory
    .filter(m => m.role === "user")
    .map(m => m.content)
    .join("\n");

  console.log("User Messages for Extraction:\n", userMessages);

  const namePatterns = [
    /(?:my name is|i'm|i am|call me|this is|name equals|name:)\s+([a-zA-Z\s]+)/i,
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)$/m, // "John Doe" types
    /(?:^|\s)([A-Z][a-z]+)\s+here/i
  ];
  for (const pattern of namePatterns) {
    const match = pattern.exec(userMessages);
    if (match) {
      const name = match[1].trim();
      // Basic validation: ignore if it looks like a sentence or is "Cata"
      if (name.length < 30 && name.toLowerCase() !== "cata" && !name.toLowerCase().includes("hello")) {
        console.log(`Name Pattern Match: ${pattern} -> ${name}`);
        proposalData.clientName = name;
        break;
      }
    }
  }

  // FALLBACK: Context-based name extraction
  // If name not found yet, look for when AI asks for name and user responds with a short answer
  if (!proposalData.clientName) {
    for (let i = 0; i < allMessages.length - 1; i++) {
      const msg = allMessages[i];
      const nextMsg = allMessages[i + 1];

      // Check if current message is AI asking about name
      if (msg.role === "assistant" && /what.*your name|may i know your name|what should i call you|your name|could you.*name/i.test(msg.content)) {
        if (nextMsg && nextMsg.role === "user") {
          const userResponse = nextMsg.content.trim();

          // Check for short response that looks like a name (1-3 words, starts with capital or is short)
          // Avoid matching sentences or numbers
          if (
            userResponse.length >= 2 &&
            userResponse.length <= 50 &&
            !/^\d+$/.test(userResponse) && // Not just numbers
            !/^(yes|no|ok|sure|fine|hello|hi|hey|okay|yeah|nope|yup)$/i.test(userResponse) && // Not common responses
            !userResponse.includes('.') && // Not a sentence
            !userResponse.includes('?') // Not a question
          ) {
            // Extract first word if response is longer, or use whole response
            const nameParts = userResponse.split(/\s+/).filter(p => /^[A-Za-z]+$/.test(p));
            if (nameParts.length > 0 && nameParts.length <= 4) {
              proposalData.clientName = nameParts.slice(0, 2).map(n => n.charAt(0).toUpperCase() + n.slice(1).toLowerCase()).join(' ');
              console.log(`Context-based name extraction: "${userResponse}" -> ${proposalData.clientName}`);
              break;
            }
          }
        }
      }
    }
  }

  // FALLBACK: Context-based business name extraction
  // Look for when AI asks about business/company name and user responds
  if (!proposalData.businessName) {
    for (let i = 0; i < allMessages.length - 1; i++) {
      const msg = allMessages[i];
      const nextMsg = allMessages[i + 1];

      // Check if current message is AI asking about business/company name
      if (msg.role === "assistant" && /business name|company name|name of your business|name of your company|what.*business.*called|what.*company.*called/i.test(msg.content)) {
        if (nextMsg && nextMsg.role === "user") {
          const userResponse = nextMsg.content.trim();

          // Accept reasonably short responses that look like business names
          if (
            userResponse.length >= 2 &&
            userResponse.length <= 100 &&
            !/^(yes|no|ok|sure|fine|hello|hi|hey|okay|yeah|nope|yup)$/i.test(userResponse) &&
            !userResponse.includes('?')
          ) {
            proposalData.businessName = userResponse;
            console.log(`Context-based business name extraction: "${userResponse}"`);
            break;
          }
        }
      }
    }
  }

  // FALLBACK: Context-based about business extraction
  // Look for when AI asks about what the business does and user responds
  if (!proposalData.aboutBusiness) {
    for (let i = 0; i < allMessages.length - 1; i++) {
      const msg = allMessages[i];
      const nextMsg = allMessages[i + 1];

      // Check if current message is AI asking about what the business does
      if (msg.role === "assistant" && /what.*business.*do|what does.*do|tell me about.*business|describe.*business|about your business|about your company|what.*company.*do/i.test(msg.content)) {
        if (nextMsg && nextMsg.role === "user") {
          const userResponse = nextMsg.content.trim();

          // Accept reasonably descriptive responses
          if (
            userResponse.length >= 5 &&
            userResponse.length <= 500 &&
            !/^(yes|no|ok|sure|fine|hello|hi|hey|okay|yeah|nope|yup)$/i.test(userResponse)
          ) {
            proposalData.aboutBusiness = userResponse;
            console.log(`Context-based about business extraction: "${userResponse}"`);
            break;
          }
        }
      }
    }
  }

  // Extract service type from conversation
  const servicePatterns = [
    /(?:want|need|looking for|interested in|help with)\s+(?:a|an)?\s*(website|app|mobile app|branding|seo|marketing|e-commerce|ecommerce|social media|lead generation|video|content)/gi,
    /(?:service[:\s]+)(website|app|branding|seo|marketing|e-commerce|social media)/gi,
    /(social media marketing|social media management|seo optimization|lead generation|video production|content writing)/gi,
    /(short[-\s]?news\s+app|news\s+app|mobile\s+app|web\s+app|saas|website)/gi
  ];
  for (const pattern of servicePatterns) {
    const match = pattern.exec(userMessages);
    if (match) {
      proposalData.serviceName = match[1].trim();
      break;
    }
  }

  // Extract project type/description

  const projectPatterns = [
    /(?:build|create|develop|make)\s+(?:a|an)?\s*(.+?)(?:\.|for|with|that)/gi,
    /(?:project|idea|concept)[:\s]+(.+?)(?:\.|$)/gim,
    /(?:objective|goal|purpose)\s*(?:is|:)?\s*(lead generation|brand awareness|engagement|traffic|sales|visibility)/gi,
    /(?:main\s+)?(?:objective|goal)[:\s]+(.*?)(?:\n|$)/gi
  ];
  for (const pattern of projectPatterns) {
    const match = pattern.exec(userMessages); // Changed to userMessages to avoid AI chatter
    if (match && match[1] && match[1].length > 5 && match[1].length < 200 && !/^\s*is\s+\d/i.test(match[1])) {
      proposalData.projectType = match[1].trim();
      break;
    }
  }
  // Fallback: use service name as project type if still null
  if (!proposalData.projectType && proposalData.serviceName) {
    proposalData.projectType = `${proposalData.serviceName} Project`;
  }

  // Extract budget logic with currency detection
  const budgetPatterns = [
    /(?:budget|spend|invest|pay)\s*(?:is|of|around|about|:)?\s*(?:(₹|rs\.?|inr|\$|usd|€|eur|£|gbp))?\s*([\d,]+(?:\s*(?:lakh|lac|k|L))?)\s*(?:(₹|rs\.?|inr|\$|usd|€|eur|£|gbp))?/gi,
    /(?:(₹|rs\.?|inr|\$|usd|€|eur|£|gbp))\s*([\d,]+(?:\s*(?:lakh|lac|k|L))?)/gi
  ];

  for (const pattern of budgetPatterns) {
    const match = pattern.exec(userMessages);
    if (match) {
      // match[2] or match[1] depending on which group captured the number
      // We need to match carefully based on the groups above.
      // Pattern 1: Group 1 (prefix), Group 2 (number), Group 3 (suffix)
      // Pattern 2: Group 1 (prefix), Group 2 (number)

      let amountStr = match[2] || match[1]; // simplified fallback logic might be risky, let's be precise

      // Let's re-run a more specific logic per pattern to be safe, or just improve the loop
      // Actually, let's simplify the extraction to finding the number and then looking around it for currency
    }
  }

  // Revised Budget Extraction
  const budgetRegex = /(?:budget|spend|invest|pay|price|cost).*?((?:₹|rs\.?|inr|\$|usd|€|eur|£|gbp)?\s*[\d,]+(?:\s*(?:lakh|lac|k|L))?(?:\s*(?:₹|rs\.?|inr|\$|usd|€|eur|£|gbp))?)/i;
  const match = budgetRegex.exec(userMessages);
  if (match) {
    const fullBudgetStr = match[1];
    let currency = "INR"; // Default
    let multiplier = 1;

    // Detect Currency
    if (/\$|usd/i.test(fullBudgetStr)) currency = "USD";
    else if (/€|eur/i.test(fullBudgetStr)) currency = "EUR";
    else if (/£|gbp/i.test(fullBudgetStr)) currency = "GBP";

    // Clean amount
    let amountStr = fullBudgetStr.replace(/[^0-9,.]/g, "");

    // Detect multipliers
    if (/lakh|lac|L/i.test(fullBudgetStr)) multiplier = 100000;
    else if (/k/i.test(fullBudgetStr)) multiplier = 1000;

    let amount = parseFloat(amountStr.replace(/,/g, ""));
    if (!isNaN(amount)) {
      proposalData.budget = amount * multiplier;
      proposalData.currency = currency;
    }
  }

  // FALLBACK: Context-based budget extraction
  // If budget not found yet, look for conversation patterns where AI asks about budget and user responds with a number
  if (!proposalData.budget) {
    for (let i = 0; i < allMessages.length - 1; i++) {
      const msg = allMessages[i];
      const nextMsg = allMessages[i + 1];

      // Check if current message is AI asking about budget
      if (msg.role === "assistant" && /budget|what is your budget|budget for this|budget range|investment/i.test(msg.content)) {
        // Check if next message is user response with a number
        if (nextMsg && nextMsg.role === "user") {
          const userResponse = nextMsg.content.trim();
          // Match standalone numbers (with optional currency symbols)
          const numMatch = userResponse.match(/^(₹|rs\.?|inr|\$|usd|€|eur|£|gbp)?\s*([\d,]+(?:\.\d+)?)\s*(lakh|lac|k|L|thousand)?\s*(₹|rs\.?|inr|\$|usd|€|eur|£|gbp)?$/i);
          if (numMatch) {
            let currency = "INR";
            let multiplier = 1;
            if (/\$|usd/i.test(userResponse)) currency = "USD";
            else if (/€|eur/i.test(userResponse)) currency = "EUR";
            else if (/£|gbp/i.test(userResponse)) currency = "GBP";

            if (/lakh|lac/i.test(userResponse)) multiplier = 100000;
            else if (/k|thousand/i.test(userResponse)) multiplier = 1000;

            const amount = parseFloat(numMatch[2].replace(/,/g, ""));
            if (!isNaN(amount) && amount > 0) {
              proposalData.budget = amount * multiplier;
              proposalData.currency = currency;
              break;
            }
          }
        }
      }
    }
  }

  const latestBudget = extractLatestBudgetFromBudgetQuestions(allMessages);
  if (latestBudget?.amount) {
    proposalData.budget = latestBudget.amount;
    proposalData.currency = latestBudget.currency;
  }

  // Extract pricing level for services that use budget tiers instead of numeric budgets
  const pricingLevelFromUser = extractPricingLevel(userMessages);
  if (pricingLevelFromUser) {
    proposalData.pricingLevel = pricingLevelFromUser;
  }

  if (!proposalData.pricingLevel) {
    for (let i = 0; i < allMessages.length - 1; i++) {
      const msg = allMessages[i];
      const nextMsg = allMessages[i + 1];

      if (
        msg.role === "assistant" &&
        PRICING_LEVEL_QUESTION_REGEX.test(msg.content)
      ) {
        if (nextMsg && nextMsg.role === "user") {
          const userResponse = nextMsg.content.trim();
          const directPricing = extractPricingLevel(userResponse, true);
          if (directPricing) {
            proposalData.pricingLevel = directPricing;
            break;
          }

          const optionMatch = userResponse.match(/^(\d+)\.?$/);
          if (optionMatch) {
            const optionNum = parseInt(optionMatch[1]);
            const optionRegex = new RegExp(`${optionNum}\\.\\s*([^\\n]+)`, "i");
            const foundOption = msg.content.match(optionRegex);
            if (foundOption) {
              const optionText = foundOption[1];
              const optionPricing = extractPricingLevel(optionText, true);
              proposalData.pricingLevel = optionPricing || optionText.trim();
              break;
            }
          }
        }
      }
    }
  }

  // Extract timeline
  const timelineFromUser = extractTimelineValue(userMessages);
  if (timelineFromUser) {
    proposalData.timeline = timelineFromUser;
  }

  // FALLBACK: Context-based timeline extraction
  // If timeline not found yet, look for when AI asks about timeline and user responds
  if (!proposalData.timeline) {
    for (let i = 0; i < allMessages.length - 1; i++) {
      const msg = allMessages[i];
      const nextMsg = allMessages[i + 1];

      // Check if current message is AI asking about timeline/duration
      if (msg.role === "assistant" && TIMELINE_QUESTION_REGEX.test(msg.content)) {
        if (nextMsg && nextMsg.role === "user") {
          const userResponse = nextMsg.content.trim();

          const directTimeline = extractTimelineValue(userResponse);
          if (directTimeline) {
            proposalData.timeline = directTimeline;
            break;
          }

          // Check if user selected a numbered option - try to extract timeline from AI's options
          const optionMatch = userResponse.match(/^(\d+)\.?$/);
          if (optionMatch) {
            // Look for numbered options in the AI's message
            const optionNum = parseInt(optionMatch[1]);
            const optionsText = msg.content;
            const optionRegex = new RegExp(`${optionNum}\\.\\s*([^\\n]+)`, "i");
            const foundOption = optionsText.match(optionRegex);
            if (foundOption) {
              const optionText = foundOption[1];
              const optionTimeline = extractTimelineValue(optionText);
              proposalData.timeline =
                optionTimeline ||
                optionText.replace(/^\*+|\*+$/g, "").trim();
              break;
            }
          }
        }
      }
    }
  }

  // Extract requirements/features mentioned
  const featureKeywords = [
    // Web/App features
    "map", "location", "push notification", "offline", "dark mode", "light mode",
    "payment", "booking", "search", "filter", "categories", "admin", "dashboard",
    "analytics", "seo", "responsive", "mobile", "android", "ios", "flutter",
    "react", "next.js", "api", "backend", "database", "authentication", "login",
    "signup", "user profile", "social sharing", "bookmark", "wishlist", "cart",
    // Social Media Marketing
    "instagram", "facebook", "linkedin", "youtube", "twitter", "tiktok",
    "brand awareness", "engagement", "lead generation", "content creation",
    "posting", "strategy", "organic", "followers", "reach", "impressions",
    // SEO
    "keywords", "backlinks", "ranking", "traffic", "visibility", "local seo",
    "technical seo", "content strategy", "on-page", "off-page",
    // General
    "branding", "logo", "identity", "marketing", "advertising", "campaign"
  ];

  // Extract pages
  const pagePatterns = [
    /(\d+(?:\s*[-–—]\s*\d*)?)\s*pages?/gi,
    /(?:approx|around|about)\s*(\d+)\s*pages?/gi,
    /(\d+)\s*to\s*(\d+)\s*pages?/gi
  ];
  for (const pattern of pagePatterns) {
    const match = pattern.exec(userMessages); // STRICT: User must say it
    if (match) {
      proposalData.pages = match[0].trim(); // Keep the whole string like "5 pages" or "10-15 pages"
      break;
    }
  }

  // Extract technologies
  const techKeywords = [
    "react", "next.js", "node.js", "python", "django", "flask", "php", "laravel",
    "wordpress", "shopify", "wix", "webflow", "flutter", "swift", "kotlin",
    "firebase", "supabase", "mongodb", "postgresql", "mysql", "aws", "azure",
    "vercel", "netlify", "tailwind", "bootstrap", "material ui", "shadcn"
  ];

  techKeywords.forEach(keyword => {
    // Use word boundary to avoid partial matches
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(userMessages)) { // STRICT: User must say it
      // capital case
      const properCase = keyword.charAt(0).toUpperCase() + keyword.slice(1);
      if (!proposalData.technologies.includes(properCase)) {
        proposalData.technologies.push(properCase);
      }
    }
  });

  // Extract integrations
  const integrationKeywords = [
    "stripe", "paypal", "razorpay", "payment gateway", "google maps", "mapbox",
    "sendgrid", "mailchimp", "twilio", "whatsapp", "slack", "discord",
    "crm", "hubspot", "salesforce", "analytics", "google analytics", "facebook pixel",
    "zapier", "calendly", "calendar"
  ];

  integrationKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(userMessages)) { // STRICT: User must say it
      const properCase = keyword.replace(/\b\w/g, l => l.toUpperCase());
      if (!proposalData.integrations.includes(properCase)) {
        proposalData.integrations.push(properCase);
      }
    }
  });

  const lowerConv = userMessages.toLowerCase(); // STRICT: User must say it
  featureKeywords.forEach(keyword => {
    if (lowerConv.includes(keyword)) {
      proposalData.requirements.push(keyword);
    }
  });

  // Calculate collected fields based on the selected service's question set
  const serviceDefinition = getServiceDefinition(
    selectedServiceName || proposalData.serviceName || ""
  );
  proposalData.questionAnswers = extractQuestionAnswers(
    conversationHistory,
    serviceDefinition
  );
  if (!proposalData.pricingLevel && Array.isArray(proposalData.questionAnswers)) {
    const pricingAnswer = proposalData.questionAnswers.find(
      (item) => item.id === "pricing_level"
    );
    if (pricingAnswer?.answer) {
      proposalData.pricingLevel = pricingAnswer.answer;
    }
  }
  const rawMinBudget = serviceDefinition?.budget?.min_required_amount;
  const parsedMinBudget = Number.isFinite(rawMinBudget)
    ? rawMinBudget
    : Number.parseFloat(rawMinBudget);
  const minBudget = Number.isFinite(parsedMinBudget) ? parsedMinBudget : null;
  const budgetStatus = evaluateBudgetStatus(allMessages, proposalData.budget, minBudget);
  if (budgetStatus.updatedBudget) {
    proposalData.budget = budgetStatus.updatedBudget;
    if (budgetStatus.updatedCurrency) {
      proposalData.currency = budgetStatus.updatedCurrency;
    }
  }
  proposalData.budgetStatus = budgetStatus;
  const serviceQuestionIds = new Set(
    Array.isArray(serviceDefinition?.questions)
      ? serviceDefinition.questions.map((q) => q.id)
      : []
  );
  const hasServiceDefinition = serviceQuestionIds.size > 0;

  const requiresBudget = hasServiceDefinition
    ? serviceQuestionIds.has("user_budget")
    : true;
  const requiresPricingLevel = hasServiceDefinition
    ? serviceQuestionIds.has("pricing_level") && !requiresBudget
    : false;
  const requiresTimeline = hasServiceDefinition
    ? ["timeline", "launch_timeline", "campaign_duration", "duration"].some((id) =>
      serviceQuestionIds.has(id)
    )
    : true;

  const requiredFields = [
    { key: "clientName", present: !!proposalData.clientName },
    { key: "serviceName", present: !!proposalData.serviceName },
    ...(requiresBudget
      ? [{ key: "budget", present: !!budgetStatus?.isConfirmed }]
      : []),
    ...(requiresPricingLevel
      ? [
        {
          key: "pricingLevel",
          present: !!proposalData.pricingLevel || !!proposalData.budget
        }
      ]
      : []),
    ...(requiresTimeline
      ? [{ key: "timeline", present: !!proposalData.timeline }]
      : [])
  ];

  const collectedCount = requiredFields.filter((field) => field.present).length;
  const hasEssentialFields =
    requiredFields.length > 0 &&
    requiredFields.every((field) => field.present);

  proposalData.progress = {
    collected: collectedCount,
    total: requiredFields.length,
    isComplete: hasEssentialFields
  };

  // DEBUG: Log extraction results
  console.log("================== PROPOSAL EXTRACTION DEBUG ==================");
  console.log("Client Name:", proposalData.clientName);
  console.log("Service Name:", proposalData.serviceName);
  console.log("Project Type:", proposalData.projectType);
  console.log("Requirements:", proposalData.requirements);
  console.log("Timeline:", proposalData.timeline);
  console.log("Budget:", proposalData.budget);
  console.log("Budget Confirmed:", proposalData.budgetStatus?.isConfirmed);
  console.log("Pricing Level:", proposalData.pricingLevel);
  console.log("Collected Count:", collectedCount);
  console.log("Is Complete:", proposalData.progress.isComplete);
  console.log("================================================================");

  // Attach debug info
  proposalData.debugInfo = {
    userMessages: userMessages.substring(0, 500),
    namePatternsMatches: namePatterns.map(p => {
      const m = p.exec(userMessages); // Re-exec unfortunately, or capture earlier
      return m ? m[1] : null;
    }),
    budgetStatus: proposalData.budgetStatus
  };

  return proposalData;
};

const buildProjectDetails = (proposalData, serviceDisplayName) => {
  const details = [];
  const labelSet = new Set();
  const answers = Array.isArray(proposalData.questionAnswers)
    ? proposalData.questionAnswers
    : [];
  const usedQuestionIds = new Set();
  const addDetail = (label, value) => {
    if (!value) return;
    const normalizedLabel = label.toLowerCase();
    if (labelSet.has(normalizedLabel)) return;
    details.push({ label, value });
    labelSet.add(normalizedLabel);
  };
  const addAnswerDetail = (label, ids) => {
    const match = getAnswerByIds(answers, ids);
    if (!match?.answer) return;
    addDetail(label, match.answer);
    usedQuestionIds.add(match.id);
  };

  const currencyCode = proposalData.currency || "INR";
  const formattedBudget = formatCurrencyValue(
    proposalData.budget,
    currencyCode
  );

  addDetail("Service", serviceDisplayName);
  const projectTypeAnswer = getAnswerByIds(answers, [
    "website_category",
    "project_type",
    "app_type",
    "service_type"
  ]);
  if (projectTypeAnswer?.answer) {
    addDetail("Project Type", projectTypeAnswer.answer);
    usedQuestionIds.add(projectTypeAnswer.id);
  } else {
    addDetail("Project Type", proposalData.projectType);
  }
  addDetail("Business", proposalData.businessName);
  addDetail("Business Summary", proposalData.aboutBusiness);

  addAnswerDetail("Website Requirement", ["requirement"]);
  addAnswerDetail("Primary Objective", ["objective"]);
  addAnswerDetail("Design Experience", ["design_experience"]);
  addAnswerDetail("Build Type", ["website_type"]);
  addAnswerDetail("Frontend Framework", ["coded_frontend"]);
  addAnswerDetail("Backend Technology", ["coded_backend"]);
  addAnswerDetail("CMS", ["coded_cms"]);
  addAnswerDetail("Database", ["coded_database"]);
  addAnswerDetail("Hosting", ["coded_hosting"]);

  const featureAnswer = getAnswerByIds(answers, [
    "website_features",
    "app_features",
    "features"
  ]);
  if (featureAnswer?.answer) {
    addDetail("Features", featureAnswer.answer);
    usedQuestionIds.add(featureAnswer.id);
  } else {
    const requirementsValue = formatListValue(
      Array.from(new Set(proposalData.requirements || []))
    );
    addDetail("Requirements", requirementsValue);
  }

  addAnswerDetail("Page Count", ["page_count"]);

  const technologiesValue = formatListValue(
    Array.from(new Set(proposalData.technologies || []))
  );
  addDetail("Technologies", technologiesValue);

  const integrationsValue = formatListValue(
    Array.from(new Set(proposalData.integrations || []))
  );
  addDetail("Integrations", integrationsValue);

  addDetail("Timeline", proposalData.timeline);
  if (formattedBudget) {
    addDetail("Budget", `${currencyCode} ${formattedBudget}`);
  } else {
    addDetail("Budget Level", proposalData.pricingLevel);
  }

  const skipQuestionIds = new Set([
    "user_budget",
    "pricing_level",
    "timeline",
    "launch_timeline",
    "campaign_duration",
    "duration",
    ...usedQuestionIds
  ]);

  const labelOverrides = {
    requirement: "Website Requirement",
    objective: "Primary Objective",
    website_category: "Website Type",
    design_experience: "Design Experience",
    website_type: "Build Type",
    coded_frontend: "Frontend Framework",
    coded_backend: "Backend Technology",
    coded_cms: "CMS",
    coded_database: "Database",
    coded_hosting: "Hosting",
    website_features: "Features",
    page_count: "Page Count",
    launch_timeline: "Launch Timeline",
    campaign_duration: "Campaign Duration",
    duration: "Duration"
  };

  answers.forEach((item) => {
    if (!item?.label || skipQuestionIds.has(item.id)) return;
    const label = labelOverrides[item.id] || item.label;
    addDetail(label, item.answer);
  });

  return details;
};

const buildObjectiveSummary = (proposalData, serviceDisplayName) => {
  const currencyCode = proposalData.currency || "INR";
  const formattedBudget = formatCurrencyValue(
    proposalData.budget,
    currencyCode
  );
  const answers = Array.isArray(proposalData.questionAnswers)
    ? proposalData.questionAnswers
    : [];
  const summaryParts = [];

  const requirementAnswer = getAnswerByIds(answers, ["requirement"]);
  const objectiveAnswer = getAnswerByIds(answers, ["objective"]);
  const typeAnswer = getAnswerByIds(answers, [
    "website_category",
    "project_type",
    "app_type",
    "service_type"
  ]);
  const designAnswer = getAnswerByIds(answers, ["design_experience"]);
  const buildAnswer = getAnswerByIds(answers, ["website_type"]);
  const frontendAnswer = getAnswerByIds(answers, ["coded_frontend"]);
  const backendAnswer = getAnswerByIds(answers, ["coded_backend"]);
  const cmsAnswer = getAnswerByIds(answers, ["coded_cms"]);
  const dbAnswer = getAnswerByIds(answers, ["coded_database"]);
  const hostingAnswer = getAnswerByIds(answers, ["coded_hosting"]);
  const featureAnswer = getAnswerByIds(answers, [
    "website_features",
    "app_features",
    "features"
  ]);
  const pageCountAnswer = getAnswerByIds(answers, ["page_count"]);

  let projectDescriptor =
    typeAnswer?.answer || proposalData.projectType || `${serviceDisplayName} project`;
  if (
    typeAnswer?.answer &&
    !/website|app|platform|system|service/i.test(typeAnswer.answer) &&
    /website/i.test(serviceDisplayName)
  ) {
    projectDescriptor = `${typeAnswer.answer} website`;
  }

  let requirementPrefix = "";
  if (requirementAnswer?.answer) {
    if (/new/i.test(requirementAnswer.answer)) requirementPrefix = "new";
    else if (/revamp|rebuild|redesign/i.test(requirementAnswer.answer)) {
      requirementPrefix = "revamped";
    } else {
      requirementPrefix = requirementAnswer.answer.toLowerCase();
    }
  }

  const headline = requirementPrefix
    ? `${requirementPrefix} ${projectDescriptor}`
    : projectDescriptor;
  const headlineSuffix = proposalData.businessName
    ? ` for ${proposalData.businessName}`
    : "";
  summaryParts.push(`Deliver a ${headline}${headlineSuffix}`);

  const scopeParts = [];
  const requirementsValue = featureAnswer?.answer
    ? featureAnswer.answer
    : formatListValue(Array.from(new Set(proposalData.requirements || [])));
  const technologiesValue = formatListValue(
    Array.from(new Set(proposalData.technologies || []))
  );
  const integrationsValue = formatListValue(
    Array.from(new Set(proposalData.integrations || []))
  );

  if (objectiveAnswer?.answer) {
    scopeParts.push(`goal: ${objectiveAnswer.answer}`);
  }
  if (requirementsValue) scopeParts.push(`features: ${requirementsValue}`);
  if (designAnswer?.answer) {
    scopeParts.push(`design: ${designAnswer.answer}`);
  }
  const buildParts = [
    buildAnswer?.answer,
    frontendAnswer?.answer,
    backendAnswer?.answer,
    cmsAnswer?.answer,
    dbAnswer?.answer,
    hostingAnswer?.answer
  ].filter(Boolean);
  if (buildParts.length) {
    scopeParts.push(`build: ${buildParts.join(", ")}`);
  }
  const pagesValue = proposalData.pages || pageCountAnswer?.answer;
  if (pagesValue) scopeParts.push(`pages: ${pagesValue}`);
  if (technologiesValue) scopeParts.push(`tech: ${technologiesValue}`);
  if (integrationsValue) scopeParts.push(`integrations: ${integrationsValue}`);
  if (proposalData.timeline) scopeParts.push(`timeline: ${proposalData.timeline}`);
  if (formattedBudget) {
    scopeParts.push(`budget: ${currencyCode} ${formattedBudget}`);
  } else if (proposalData.pricingLevel) {
    scopeParts.push(`budget level: ${proposalData.pricingLevel}`);
  }
  if (proposalData.aboutBusiness) {
    scopeParts.push(`business: ${proposalData.aboutBusiness}`);
  }

  if (scopeParts.length) {
    summaryParts.push(scopeParts.join(", "));
  }

  return `${summaryParts.join(". ")}.`;
};

/**
 * Generate phased proposal structure based on extracted data and SELECTED SERVICE
 */
const generateProposalStructure = (proposalData, serviceName = "") => {
  const { clientName, projectType, requirements, timeline, budget, pages, technologies, integrations } = proposalData;

  // Normalize the service name for matching
  const normalizedService = (serviceName || proposalData.serviceName || "").toLowerCase();

  // Service-specific phase definitions
  const SERVICE_PHASES = {
    // Branding Service
    branding: [
      {
        number: 1,
        name: "Discovery & Research",
        description: "Understanding your brand values, target audience, and market positioning.",
        deliverables: [
          "Brand audit & competitor analysis",
          "Target audience research",
          "Brand positioning strategy",
          "Mood board & creative direction"
        ],
        value: ["Clear brand direction", "Market differentiation", "Audience alignment"],
        estimatedCost: 10000,
        estimatedDuration: "1 week"
      },
      {
        number: 2,
        name: "Brand Identity Design",
        description: "Creating your complete visual identity system.",
        deliverables: [
          "Logo design (3 concepts + refinements)",
          "Color palette & typography system",
          "Brand guidelines document",
          "Social media kit",
          "Business card & letterhead design"
        ],
        value: ["Professional brand image", "Consistent identity", "Market-ready assets"],
        estimatedCost: 15000,
        estimatedDuration: "2 weeks"
      }
    ],

    // Website / UI-UX Service
    website: [
      {
        number: 1,
        name: "Discovery & Planning",
        description: "Understanding your requirements and planning the website structure.",
        deliverables: [
          "Requirements gathering",
          "Sitemap & information architecture",
          "Content strategy outline",
          "Technology recommendations"
        ],
        value: ["Clear project roadmap", "Structured approach", "Reduced revisions"],
        estimatedCost: 5000,
        estimatedDuration: "3-5 days"
      },
      {
        number: 2,
        name: "UI/UX Design",
        description: "Creating beautiful and functional designs.",
        deliverables: [
          "Wireframes for all pages",
          "High-fidelity UI designs",
          "Mobile responsive layouts",
          "Interactive prototype"
        ],
        value: ["User-friendly interface", "Modern aesthetics", "Conversion-optimized"],
        estimatedCost: 15000,
        estimatedDuration: "1-2 weeks"
      },
      {
        number: 3,
        name: "Development & Launch",
        description: "Building and deploying your website.",
        deliverables: [
          "Frontend development",
          "CMS integration",
          "SEO optimization",
          "Performance optimization",
          "Deployment & launch"
        ],
        value: ["Fast-loading website", "Easy content updates", "Search engine visibility"],
        estimatedCost: 15000,
        estimatedDuration: "2-3 weeks"
      }
    ],

    // App Development Service
    app: [
      {
        number: 1,
        name: "Planning & Architecture",
        description: "Defining the app structure and technical requirements.",
        deliverables: [
          "Feature specification document",
          "Technical architecture",
          "Database design",
          "API planning"
        ],
        value: ["Clear development roadmap", "Scalable foundation", "Reduced rework"],
        estimatedCost: 25000,
        estimatedDuration: "1-2 weeks"
      },
      {
        number: 2,
        name: "UI/UX Design",
        description: "Creating the app's visual design and user experience.",
        deliverables: [
          "User flow diagrams",
          "Wireframes",
          "High-fidelity app screens",
          "Dark & light mode designs",
          "Interactive prototype"
        ],
        value: ["Intuitive user experience", "Modern app design", "Design system"],
        estimatedCost: 40000,
        estimatedDuration: "2-3 weeks"
      },
      {
        number: 3,
        name: "App Development",
        description: "Building your mobile application.",
        deliverables: [
          "Cross-platform app (iOS & Android)",
          "Backend API development",
          "Database implementation",
          "Push notifications",
          "Third-party integrations"
        ],
        value: ["High-performance app", "Scalable backend", "Native-like experience"],
        estimatedCost: 300000,
        estimatedDuration: "8-12 weeks"
      },
      {
        number: 4,
        name: "Testing & Launch",
        description: "Quality assurance and app store deployment.",
        deliverables: [
          "Comprehensive testing",
          "Bug fixes & optimization",
          "App Store submission",
          "Play Store submission",
          "Launch support"
        ],
        value: ["Bug-free launch", "Store approval", "Smooth rollout"],
        estimatedCost: 35000,
        estimatedDuration: "1-2 weeks"
      }
    ],

    // SEO Service
    seo: [
      {
        number: 1,
        name: "SEO Audit & Strategy",
        description: "Comprehensive analysis and strategic planning.",
        deliverables: [
          "Technical SEO audit",
          "Keyword research",
          "Competitor analysis",
          "SEO strategy document"
        ],
        value: ["Clear SEO roadmap", "Targeted keywords", "Competitive edge"],
        estimatedCost: 10000,
        estimatedDuration: "1 week"
      },
      {
        number: 2,
        name: "On-Page Optimization",
        description: "Optimizing your website for search engines.",
        deliverables: [
          "Meta tags optimization",
          "Content optimization",
          "Schema markup",
          "Internal linking structure",
          "Page speed improvements"
        ],
        value: ["Better rankings", "Improved CTR", "Faster loading"],
        estimatedCost: 15000,
        estimatedDuration: "2 weeks"
      },
      {
        number: 3,
        name: "Off-Page & Ongoing",
        description: "Building authority and continuous improvement.",
        deliverables: [
          "Backlink building",
          "Local SEO optimization",
          "Monthly performance reports",
          "Ongoing optimizations"
        ],
        value: ["Domain authority", "Local visibility", "Sustained growth"],
        estimatedCost: 10000,
        estimatedDuration: "Ongoing (monthly)"
      }
    ],

    // Social Media Marketing
    social: [
      {
        number: 1,
        name: "Strategy & Setup",
        description: "Creating your social media strategy.",
        deliverables: [
          "Platform strategy",
          "Content calendar",
          "Profile optimization",
          "Brand voice guidelines"
        ],
        value: ["Clear direction", "Consistent posting", "Brand consistency"],
        estimatedCost: 8000,
        estimatedDuration: "1 week"
      },
      {
        number: 2,
        name: "Content Creation",
        description: "Creating engaging content for your platforms.",
        deliverables: [
          "20 social media posts/month",
          "Story designs",
          "Reel concepts & editing",
          "Caption writing"
        ],
        value: ["Engaging content", "Professional visuals", "Audience growth"],
        estimatedCost: 15000,
        estimatedDuration: "Ongoing (monthly)"
      }
    ],

    // E-commerce Service
    ecommerce: [
      {
        number: 1,
        name: "Store Planning",
        description: "Planning your online store structure.",
        deliverables: [
          "Store architecture",
          "Product categorization",
          "Payment gateway selection",
          "Shipping integration planning"
        ],
        value: ["Optimized store structure", "Clear product hierarchy", "Smooth checkout"],
        estimatedCost: 10000,
        estimatedDuration: "1 week"
      },
      {
        number: 2,
        name: "Store Design & Development",
        description: "Building your e-commerce store.",
        deliverables: [
          "Custom store design",
          "Product page optimization",
          "Cart & checkout flow",
          "Payment integration",
          "Inventory management"
        ],
        value: ["Beautiful store", "High conversion rate", "Easy management"],
        estimatedCost: 40000,
        estimatedDuration: "3-4 weeks"
      },
      {
        number: 3,
        name: "Launch & Optimization",
        description: "Launching and optimizing your store.",
        deliverables: [
          "Product upload assistance",
          "SEO for products",
          "Performance optimization",
          "Analytics setup"
        ],
        value: ["Ready to sell", "Search visibility", "Data-driven growth"],
        estimatedCost: 10000,
        estimatedDuration: "1 week"
      }
    ]
  };

  // Map service name to phase key
  const getServiceKey = (name) => {
    const lowered = name.toLowerCase();
    if (lowered.includes("brand") || lowered.includes("logo") || lowered.includes("identity")) return "branding";
    if (lowered.includes("website") || lowered.includes("ui") || lowered.includes("ux") || lowered.includes("web")) return "website";
    if (lowered.includes("app") || lowered.includes("mobile") || lowered.includes("ios") || lowered.includes("android")) return "app";
    if (lowered.includes("seo") || lowered.includes("search engine")) return "seo";
    if (lowered.includes("social") || lowered.includes("marketing") || lowered.includes("instagram") || lowered.includes("facebook")) return "social";
    if (lowered.includes("ecommerce") || lowered.includes("e-commerce") || lowered.includes("shop") || lowered.includes("store")) return "ecommerce";
    return "website"; // Default to website
  };

  const serviceKey = getServiceKey(normalizedService);
  const selectedPhases = SERVICE_PHASES[serviceKey] || SERVICE_PHASES.website;

  // Renumber phases
  const phases = selectedPhases.map((phase, idx) => ({
    ...phase,
    number: idx + 1
  }));

  // Calculate total cost from default phases
  let totalCost = phases.reduce((sum, phase) => sum + phase.estimatedCost, 0);

  // ADJUSTMENT: If user has a specific budget, scale phase costs to match it
  // This ensures the proposal respects their stated budget
  if (budget && budget > 0) {
    const scalingFactor = budget / totalCost;

    phases.forEach(phase => {
      phase.estimatedCost = Math.round(phase.estimatedCost * scalingFactor);
    });

    // Recalculate total to be exact (handling rounding errors)
    totalCost = phases.reduce((sum, phase) => sum + phase.estimatedCost, 0);

    // If there's a small difference due to rounding, adjust the last phase
    const undoDifference = budget - totalCost;
    if (undoDifference !== 0 && phases.length > 0) {
      phases[phases.length - 1].estimatedCost += undoDifference;
      totalCost = budget;
    }
  }

  // Build investment summary
  // Build investment summary - ONLY TOTAL now
  // We will ignore the breakdown in the summary array to satisfy the requirement:
  // "investment summary chnage it to total invenstment only and only show the final amount"
  const investmentSummary = [{ "component": "Total Project Investment", "cost": totalCost }];

  // Calculate total duration
  const getTotalDuration = () => {
    if (timeline) return timeline;
    if (serviceKey === "app") return "12-16 weeks";
    if (serviceKey === "ecommerce") return "5-6 weeks";
    if (serviceKey === "website") return "4-6 weeks";
    if (serviceKey === "branding") return "3 weeks";
    if (serviceKey === "seo") return "Ongoing";
    if (serviceKey === "social") return "Ongoing";
    return "4-6 weeks";
  };

  // Get service display name
  const getServiceDisplayName = () => {
    const names = {
      branding: "Branding & Identity",
      website: "Website Development",
      app: "App Development",
      seo: "SEO Services",
      social: "Social Media Marketing",
      ecommerce: "E-Commerce Store"
    };
    return names[serviceKey] || serviceName || "Digital Services";
  };

  const serviceDisplayName = getServiceDisplayName();
  const currencyCode = proposalData.currency || "INR";

  const projectDetails = buildProjectDetails(proposalData, serviceDisplayName);
  const objectiveSummary = buildObjectiveSummary(proposalData, serviceDisplayName);

  return {
    projectTitle: projectType || `${serviceDisplayName} Project`,
    clientName: clientName || "Valued Client",
    serviceName: serviceDisplayName,
    objective: objectiveSummary,
    phases: phases,
    investmentSummary: investmentSummary,
    totalInvestment: totalCost,
    currency: currencyCode, // Default to INR if not detected
    timeline: {
      total: getTotalDuration()
    },
    features: requirements,
    pages: pages || "TBD",
    technologies: technologies,
    integrations: integrations,
    projectDetails: projectDetails,
    generatedAt: new Date().toISOString(),
    debugInfo: proposalData.debugInfo
  };
};


/**
 * Check if AI response contains a proposal
 */
const containsProposal = (content) => {
  const proposalIndicators = [
    /PROJECT\s+PROPOSAL/i,
    /PROPOSAL/i,
    /Understanding\s+Your\s+Needs/i,
    /Scope\s+of\s+Work/i,
    /Investment:/i,
    /Recommended\s+Service/i
  ];
  return proposalIndicators.some(pattern => pattern.test(content));
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

  // Extract proposal data from conversation
  const allHistory = [...formattedHistory, ...formattedMessages];
  const proposalData = extractProposalData(allHistory, content, selectedServiceName);

  // Generate proposal structure when essential fields are collected
  let proposal = null;
  let proposalProgress = proposalData.progress;

  if (proposalData.progress.isComplete) {
    proposal = generateProposalStructure(proposalData, selectedServiceName);
    proposal.isComplete = true;
  }

  // DEBUG: Log API response
  console.log("================== API RESPONSE DEBUG ==================");
  console.log("Proposal exists:", !!proposal);
  console.log("isComplete:", proposalData.progress.isComplete);
  console.log("proposalProgress:", JSON.stringify(proposalProgress));
  console.log("=========================================================");

  return {
    success: true,
    message: stripMarkdownHeadings(content),
    usage: data.usage || null,
    proposal: proposal,
    proposalProgress: proposalProgress
  };
};

export const getServiceInfo = (serviceId) =>
  servicesData.services.find((service) => service.id === serviceId);

export const getAllServices = () => servicesData.services;

