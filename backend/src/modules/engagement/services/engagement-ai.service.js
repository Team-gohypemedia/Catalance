import { env } from "../../../config/env.js";
import { AppError } from "../../../utils/app-error.js";
import { engagementRules } from "../config/engagement-rules.config.js";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL =
  env.OPENROUTER_MODEL || process.env.OPENROUTER_MODEL || "openai/gpt-5.1";
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

const CATEGORY_LABELS = Object.freeze({
  CLIENT_COMMUNICATION: "Client communication",
  SCOPE_MANAGEMENT: "Scope management",
  DELIVERY: "Delivery and deadlines",
  QUALITY_CONTROL: "Quality control",
  PLATFORM_RULES: "Platform rules",
  BUSINESS_BASICS: "Business basics",
});

const normalizeText = (value) => String(value || "").trim();

const shouldRetryWithFallbackModel = (statusCode, errorMessage = "") =>
  statusCode === 402 ||
  statusCode === 404 ||
  statusCode === 429 ||
  statusCode >= 500 ||
  OPENROUTER_FALLBACK_ERROR_REGEX.test(errorMessage);

const extractTextResponse = (data) =>
  normalizeText(
    data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.text ||
      data?.message ||
      ""
  );

const extractFirstJsonBlock = (content) => {
  const normalized = normalizeText(content);
  if (!normalized) {
    throw new AppError("AI returned an empty response.", 502);
  }

  try {
    return JSON.parse(normalized);
  } catch {
    const fencedMatch = normalized.match(/```json\s*([\s\S]*?)```/i);
    if (fencedMatch?.[1]) {
      return JSON.parse(fencedMatch[1].trim());
    }

    const objectMatch = normalized.match(/\{[\s\S]*\}$/);
    if (objectMatch?.[0]) {
      return JSON.parse(objectMatch[0]);
    }

    throw new AppError("AI returned invalid JSON for engagement generation.", 502);
  }
};

const requestOpenRouterJson = async ({
  title,
  systemPrompt,
  userPrompt,
  temperature = 0.4,
  maxTokens = 1800,
}) => {
  const apiKey = env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new AppError("OpenRouter API key not configured.", 500);
  }

  const modelsToTry = [DEFAULT_MODEL];
  if (FALLBACK_MODEL && !modelsToTry.includes(FALLBACK_MODEL)) {
    modelsToTry.push(FALLBACK_MODEL);
  }

  for (let index = 0; index < modelsToTry.length; index += 1) {
    const model = modelsToTry[index];
    const hasFallback = index < modelsToTry.length - 1;
    let response;
    let data = null;

    try {
      response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": DEFAULT_REFERER,
          "X-Title": title,
        },
        body: JSON.stringify({
          model,
          temperature,
          max_tokens: maxTokens,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
        }),
      });
      data = await response.json().catch(() => null);
    } catch (error) {
      throw new AppError("OpenRouter network error during engagement generation.", 502, {
        cause: error?.message || "Network request failed",
        provider: "openrouter",
        model,
      });
    }

    if (response.ok) {
      return extractFirstJsonBlock(extractTextResponse(data));
    }

    const errorMessage = normalizeText(data?.error?.message || "OpenRouter request failed.");
    const isAuthError =
      response.status === 401 ||
      response.status === 403 ||
      OPENROUTER_AUTH_ERROR_REGEX.test(errorMessage);

    if (isAuthError) {
      throw new AppError("OpenRouter authentication failed.", 502, {
        provider: "openrouter",
        providerStatus: response.status,
        model,
      });
    }

    if (hasFallback && shouldRetryWithFallbackModel(response.status, errorMessage)) {
      continue;
    }

    throw new AppError(errorMessage || "OpenRouter request failed.", 502, {
      provider: "openrouter",
      providerStatus: response.status,
      model,
    });
  }

  throw new AppError("OpenRouter request failed.", 502);
};

const buildCategoryReference = () =>
  engagementRules.categories
    .map((category) => `${category}: ${CATEGORY_LABELS[category] || category}`)
    .join("\n");

const normalizeQuestionOptionSet = (options = []) =>
  (Array.isArray(options) ? options : [])
    .slice(0, 4)
    .map((option, index) => ({
      id: ["A", "B", "C", "D"][index] || String.fromCharCode(65 + index),
      text: normalizeText(option?.text || option),
    }))
    .filter((option) => option.text);

const normalizeQuestionPayload = (question = {}, fallback = {}) => {
  const normalizedOptions = normalizeQuestionOptionSet(question.options);
  return {
    questionText: normalizeText(question.questionText || fallback.questionText),
    type: normalizeText(question.type || fallback.type || "MCQ").toUpperCase(),
    category: normalizeText(question.category || fallback.category).toUpperCase(),
    skillTag: normalizeText(question.skillTag || fallback.skillTag || "engagement_ai"),
    difficulty: normalizeText(question.difficulty || fallback.difficulty || "BEGINNER").toUpperCase(),
    options: normalizedOptions,
    correctOptionId: normalizeText(question.correctOptionId || fallback.correctOptionId || "A").toUpperCase(),
    explanation: normalizeText(question.explanation || fallback.explanation),
    focusReason: normalizeText(question.focusReason || fallback.focusReason),
  };
};

export const generateCommonAiQuestionSet = async ({
  dayKey,
  freelancerContext = {},
  recentQuestionTexts = [],
}) => {
  const systemPrompt = `
You are an AI upskilling coach for freelancers.
Return only JSON.
Every question must be safe, practical, professional, and suitable for freelancers.
Only create MCQ, TRUE_FALSE, or SCENARIO_MCQ questions.
Do not use sensitive, private, or offensive content.
Each question needs a clear correct answer and a short explanation that teaches the concept.
Do NOT generate generic client communication questions.
Do NOT focus mainly on freelancing business, negotiation, platform rules, or scope management unless the profile is clearly about those topics.
Focus on practical skill improvement tied to the freelancer's actual service.
If the profile is unclear, choose the most likely service area and use beginner-level practical fundamentals.
Set skillTag to the specific skill area being tested (human-readable).
Set focusReason to the inferred service area.
Category is for internal tagging only; do not use it to choose content.
`;

  const userPrompt = `
Generate exactly 5 daily questions for one freelancer for UTC day ${dayKey}.

Freelancer profile and performance context:
${JSON.stringify(freelancerContext, null, 2)}

Requirements:
- Return exactly 5 questions.
- The question content must match the freelancer's service domain, role, skill keywords, and experience level.
- Use realistic scenarios from the freelancer's actual work, not generic platform-only prompts.
- Do NOT generate client communication or freelancing-business questions unless the service area clearly requires it.
- Add a short focusReason that states the inferred service area (e.g., "Service area: Web Development").
- Use skillTag to state the specific skill area being tested (e.g., "Responsive layout", "Node performance", "Color grading").
- Avoid repeating any of these recent question texts:
${recentQuestionTexts.slice(0, 18).map((text, index) => `${index + 1}. ${text}`).join("\n") || "None"}
- Each MCQ or SCENARIO_MCQ should have exactly 4 options.
- TRUE_FALSE must still return 2 options.
- correctOptionId must match one option id.
- Set category to the closest internal tag, but do not let it drive the question content.

JSON shape:
{
  "questions": [
    {
      "questionText": "string",
      "type": "MCQ",
      "category": "CLIENT_COMMUNICATION",
      "skillTag": "specific skill area",
      "difficulty": "BEGINNER",
      "options": [{"id":"A","text":"..."},{"id":"B","text":"..."},{"id":"C","text":"..."},{"id":"D","text":"..."}],
      "correctOptionId": "A",
      "explanation": "string",
      "focusReason": "Service area: ..."
    }
  ]
}
`;

  const payload = await requestOpenRouterJson({
    title: "Catalance Engagement Common Questions",
    systemPrompt,
    userPrompt,
    temperature: 0.5,
    maxTokens: 2400,
  });

  const questions = Array.isArray(payload?.questions) ? payload.questions : [];
  return questions.map((question, index) =>
    normalizeQuestionPayload(question, {
      type: "MCQ",
      category:
        freelancerContext?.recommendedTopic ||
        freelancerContext?.weakTopics?.[0] ||
        "CLIENT_COMMUNICATION",
      difficulty: freelancerContext?.difficulty || "BEGINNER",
      skillTag: `ai_common_${index + 1}`,
      focusReason:
        freelancerContext?.serviceTitle ||
        freelancerContext?.serviceCategory ||
        freelancerContext?.services?.[0] ||
        "Profile-based Growth Quest practice",
    })
  );
};

export const generatePersonalizedAiQuestion = async ({
  dayKey,
  freelancerContext,
  recentQuestionTexts = [],
}) => {
  const systemPrompt = `
You are an AI upskilling coach for freelancers.
Return only JSON.
The question must be practical, professional, and aligned to the freelancer's actual service skill.
Only create MCQ or SCENARIO_MCQ with exactly 4 options.
Do not ask private or sensitive questions.
Do NOT generate generic client communication questions.
Do NOT focus mainly on freelancing business, negotiation, platform rules, or scope management unless the profile is clearly about those topics.
Focus on practical skill improvement tied to the freelancer's actual service.
Set skillTag to the specific skill area being tested (human-readable).
Set focusReason to the inferred service area.
Category is for internal tagging only; do not use it to choose content.
`;

  const userPrompt = `
Generate exactly 1 personalized freelancer question for UTC day ${dayKey}.

Freelancer context:
${JSON.stringify(freelancerContext, null, 2)}

Avoid repeating these recent personalized question texts:
${recentQuestionTexts.slice(0, 12).map((text, index) => `${index + 1}. ${text}`).join("\n") || "None"}

Requirements:
- Match the freelancer's current learning level.
- Focus on a weak area or recommended next topic when it relates to actual service skill.
- Make the question practical and scenario-based when possible.
- Use the freelancer's own service domain, service title, keywords, and recent weak spots so the scenario feels written for that freelancer only.
- Keep it answerable with one best option.
- Do NOT generate client communication or freelancing-business questions unless the service area clearly requires it.
- Add a short focusReason that states the inferred service area (e.g., "Service area: Web Development").
- Use skillTag to state the specific skill area being tested (e.g., "React state", "Copywriting tone").
- Set category to the closest internal tag, but do not let it drive the question content.

JSON shape:
{
  "question": {
    "questionText": "string",
    "type": "SCENARIO_MCQ",
    "category": "SCOPE_MANAGEMENT",
    "skillTag": "specific skill area",
    "difficulty": "INTERMEDIATE",
    "options": [{"id":"A","text":"..."},{"id":"B","text":"..."},{"id":"C","text":"..."},{"id":"D","text":"..."}],
    "correctOptionId": "A",
    "explanation": "string",
    "focusReason": "Service area: ..."
  }
}
`;

  const payload = await requestOpenRouterJson({
    title: "Catalance Engagement Personalized Question",
    systemPrompt,
    userPrompt,
    temperature: 0.45,
    maxTokens: 1400,
  });

  return normalizeQuestionPayload(payload?.question, {
    type: "SCENARIO_MCQ",
    category: freelancerContext?.recommendedTopic || "CLIENT_COMMUNICATION",
    difficulty: freelancerContext?.difficulty || "BEGINNER",
    skillTag: "ai_personalized",
    focusReason: "Tailored to the freelancer's recent Growth Quest progress.",
  });
};
