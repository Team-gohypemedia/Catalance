import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";
import { chatWithAI, generateProposalMarkdown } from "../services/ai.service.js";

const GREETING_ONLY_REGEX = /^(hi|hello|hey|yo|hola|good\s*(morning|afternoon|evening))[!.\s]*$/i;
const NAME_QUESTION_REGEX = /\bname\b/i;
const GREETING_SMALLTALK_REGEX =
    /\b(hi|hello|hey|yo|hola|namaste|salam|how are you|what'?s up|kya\s*hal|kaise\s*ho)\b/i;
const NAME_INTRO_REGEX = /\b(my name is|i am|i'm|this is)\b/i;
const CORRECTION_INTENT_REGEX =
    /\b(change|changed|update|updated|correct|correction|revise|replace|instead|not\s+.*\s+but)\b/i;
const EXTRACTION_CONFIDENCE_MIN = 0.7;
const EXTRACTION_CONFIDENCE_UPDATE_MIN = 0.86;
const FRIENDLY_BRIDGES = [
    "Awesome - thanks for sharing that.",
    "Great - this is super helpful.",
    "Perfect - we are making solid progress.",
    "Nice - got it clearly."
];

const isGreetingInsteadOfNameAnswer = (questionText = "", userText = "") => {
    if (!NAME_QUESTION_REGEX.test(questionText || "")) return false;
    const normalized = String(userText || "").toLowerCase().trim();
    if (!normalized) return false;
    if (!GREETING_SMALLTALK_REGEX.test(normalized)) return false;
    if (NAME_INTRO_REGEX.test(normalized)) return false;
    // Keep this fallback for short small-talk style replies.
    const wordCount = normalized.split(/\s+/).filter(Boolean).length;
    return wordCount <= 8;
};

const hasCorrectionIntent = (text = "") => CORRECTION_INTENT_REGEX.test(String(text || ""));

const buildFriendlyMessage = (mainText = "", bridgeText = "") => {
    const cleanMainText = String(mainText || "").trim();
    const cleanBridgeText = String(bridgeText || "").trim();
    if (!cleanMainText) return cleanBridgeText;
    if (!cleanBridgeText) return cleanMainText;
    return `${cleanBridgeText}\n\n${cleanMainText}`;
};

const pickFriendlyBridge = (seedText = "") => {
    const normalized = String(seedText || "");
    if (!normalized) return FRIENDLY_BRIDGES[0];
    const score = normalized
        .split("")
        .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return FRIENDLY_BRIDGES[Math.abs(score) % FRIENDLY_BRIDGES.length];
};

const extractFriendlyBridgeFromValidationMessage = (validationMessage = "", nextQuestionText = "") => {
    const cleanMessage = String(validationMessage || "")
        .replace(/\*\*/g, "")
        .replace(/\s+/g, " ")
        .trim();
    if (!cleanMessage) return "";

    const normalizedNextQuestion = normalizeTextToken(nextQuestionText);
    const firstSentence = cleanMessage
        .split(/(?<=[.!])\s+/)
        .map((part) => part.trim())
        .find(Boolean);

    if (!firstSentence) return "";

    const normalizedFirstSentence = normalizeTextToken(firstSentence);
    if (
        !normalizedFirstSentence ||
        normalizedFirstSentence.includes(normalizedNextQuestion) ||
        firstSentence.includes("?")
    ) {
        return "";
    }

    return firstSentence;
};

const findAnswerByQuestionPattern = (answersByQuestionText = {}, pattern) => {
    if (!answersByQuestionText || typeof answersByQuestionText !== "object") return null;
    for (const [questionText, answer] of Object.entries(answersByQuestionText)) {
        if (!pattern.test(String(questionText || ""))) continue;
        if (!hasAnswerValue(answer)) continue;
        return String(answer).trim();
    }
    return null;
};

const detectTechMentions = (text = "", detectors = []) =>
    detectors
        .filter(({ regex }) => regex.test(text))
        .map(({ label }) => label);

const uniqueList = (items = []) =>
    Array.from(new Set(items.filter(Boolean)));

const buildAppProposalHints = ({ history = [], answersByQuestionText = {} }) => {
    const userCorpus = (history || [])
        .filter((msg) => msg?.role === "user")
        .map((msg) => String(msg.content || ""))
        .join(" \n ");

    const mobileFromQuestion =
        findAnswerByQuestionPattern(answersByQuestionText, /preferred mobile app development approach|development approach|go with|flutter|react native|native android|native ios/i) ||
        findAnswerByQuestionPattern(answersByQuestionText, /tech stack|technologies/i);
    const backendFromQuestion =
        findAnswerByQuestionPattern(answersByQuestionText, /backend technology|backend stack|backend/i);
    const dashboardFromQuestion =
        findAnswerByQuestionPattern(answersByQuestionText, /admin dashboard|dashboard technology|dashboard/i);

    const mobileDetected = detectTechMentions(userCorpus, [
        { regex: /\bflutter\b/i, label: "Flutter" },
        { regex: /react\s*native/i, label: "React Native" },
        { regex: /\bnative\s*android\b|\bkotlin\b|\bjava\b/i, label: "Native Android (Kotlin/Java)" },
        { regex: /\bnative\s*ios\b|\bswift\b/i, label: "Native iOS (Swift)" }
    ]);

    const backendDetected = detectTechMentions(userCorpus, [
        { regex: /\bnode(?:\.?js)?\b/i, label: "Node.js" },
        { regex: /\bpython\b|\bdjango\b|\bflask\b|\bfastapi\b/i, label: "Python" },
        { regex: /\bphp\b|\blaravel\b/i, label: "PHP/Laravel" },
        { regex: /\bjava\b|\bspring\b/i, label: "Java/Spring" },
        { regex: /\bdotnet\b|\.net|c#/i, label: ".NET" }
    ]);

    const dashboardDetected = detectTechMentions(userCorpus, [
        { regex: /\breact(?:\.?js)?\b/i, label: "React.js" },
        { regex: /\bnext(?:\.?js)?\b/i, label: "Next.js" },
        { regex: /\bangular\b/i, label: "Angular" },
        { regex: /\bvue(?:\.?js)?\b/i, label: "Vue.js" }
    ]);

    const appType = findAnswerByQuestionPattern(
        answersByQuestionText,
        /which platform|android|ios|app available on|cross-?platform/i
    );
    const appFeatures = findAnswerByQuestionPattern(
        answersByQuestionText,
        /which features|features should your app include|deliverables/i
    );

    const platformRequirements = [];
    if (mobileFromQuestion || mobileDetected.length) {
        platformRequirements.push(
            `Mobile app: ${mobileFromQuestion || uniqueList(mobileDetected).join(", ")}`
        );
    }
    if (backendFromQuestion || backendDetected.length) {
        platformRequirements.push(
            `Backend: ${backendFromQuestion || uniqueList(backendDetected).join(", ")}`
        );
    }
    if (dashboardFromQuestion || dashboardDetected.length) {
        platformRequirements.push(
            `Dashboard/Admin panel: ${dashboardFromQuestion || uniqueList(dashboardDetected).join(", ")}`
        );
    }

    const hints = {
        appType: appType || null,
        appFeatures: appFeatures || null,
        mobileTechnology: mobileFromQuestion || uniqueList(mobileDetected).join(", ") || null,
        backendTechnology: backendFromQuestion || uniqueList(backendDetected).join(", ") || null,
        dashboardTechnology: dashboardFromQuestion || uniqueList(dashboardDetected).join(", ") || null,
        platformRequirements: platformRequirements.join(" | ") || null
    };

    return Object.values(hints).some(Boolean) ? hints : null;
};

const parseValidationResponse = (rawMessage) => {
    if (typeof rawMessage !== "string" || !rawMessage.trim()) {
        return null;
    }

    const raw = rawMessage.trim();
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    const extracted = firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace
        ? raw.substring(firstBrace, lastBrace + 1)
        : raw;

    const candidates = [
        extracted,
        extracted.replace(/\*\*/g, ""),
        extracted
            .replace(/^\s*```(?:json)?\s*/i, "")
            .replace(/\s*```\s*$/i, ""),
        raw,
        raw.replace(/\*\*/g, ""),
    ];

    for (const candidate of candidates) {
        const normalized = candidate
            .replace(/^\s*```(?:json)?\s*/i, "")
            .replace(/\s*```\s*$/i, "")
            .trim();

        if (!normalized.startsWith("{") || !normalized.endsWith("}")) {
            continue;
        }

        try {
            const parsed = JSON.parse(normalized);
            if (typeof parsed?.isValid === "boolean" && typeof parsed?.message === "string") {
                return parsed;
            }
        } catch {
            // Try next normalization candidate.
        }
    }

    const fallback = raw.replace(/\*\*/g, "");
    const isValidMatch = fallback.match(/"isValid"\s*:\s*(true|false)/i);
    const messageMatch = fallback.match(/"message"\s*:\s*"([\s\S]*?)"/i);
    if (!isValidMatch || !messageMatch) {
        return null;
    }

    return {
        isValid: isValidMatch[1].toLowerCase() === "true",
        message: messageMatch[1].replace(/\\"/g, "\""),
    };
};

const normalizeTextToken = (value = "") =>
    String(value || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

const hasAnswerValue = (value) => {
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) return value.some((item) => normalizeTextToken(item));
    return normalizeTextToken(value).length > 0;
};

const toComparableAnswer = (value) => {
    if (Array.isArray(value)) {
        return value.map((item) => normalizeTextToken(item)).filter(Boolean).sort().join(" | ");
    }

    const normalized = normalizeTextToken(value);
    if (!normalized) return "";

    return normalized
        .split(/,|\/|\band\b/gi)
        .map((part) => normalizeTextToken(part))
        .filter(Boolean)
        .sort()
        .join(" | ");
};

const findQuestionIndex = (questions = [], slugOrId = "") =>
    questions.findIndex(
        (q) => q?.slug === slugOrId || q?.id === slugOrId
    );

const extractAnswerTokens = (answerValue) => {
    if (Array.isArray(answerValue)) {
        return Array.from(
            new Set(
                answerValue
                    .map((item) => normalizeTextToken(item))
                    .filter(Boolean)
            )
        );
    }

    const normalized = normalizeTextToken(answerValue);
    if (!normalized) return [];

    const splitParts = normalized
        .split(/,|\/|\band\b/gi)
        .map((part) => normalizeTextToken(part))
        .filter(Boolean);

    if (!splitParts.includes(normalized)) {
        splitParts.push(normalized);
    }

    return Array.from(new Set(splitParts));
};

const matchesLogicRule = (answerValue, rule = {}) => {
    const condition = normalizeTextToken(rule.condition || "equals");
    const ruleValue = normalizeTextToken(rule.value || "");
    if (!ruleValue) return false;

    const tokens = extractAnswerTokens(answerValue);
    const joined = tokens.join(" ");

    if (condition === "equals") {
        return tokens.includes(ruleValue);
    }

    if (condition === "not_equals") {
        return !tokens.includes(ruleValue);
    }

    if (condition === "contains") {
        return tokens.some((token) => token.includes(ruleValue)) || joined.includes(ruleValue);
    }

    return false;
};

const resolveNextQuestionIndex = (questions = [], currentIndex = 0, answerValue = "") => {
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return currentIndex + 1;

    if (Array.isArray(currentQuestion.logic)) {
        for (const rule of currentQuestion.logic) {
            if (!matchesLogicRule(answerValue, rule)) continue;
            if (!rule?.nextQuestionSlug) continue;
            const targetIndex = findQuestionIndex(questions, rule.nextQuestionSlug);
            if (targetIndex !== -1) return targetIndex;
        }
    }

    if (currentQuestion.nextQuestionSlug) {
        const defaultTarget = findQuestionIndex(questions, currentQuestion.nextQuestionSlug);
        if (defaultTarget !== -1) return defaultTarget;
    }

    return currentIndex + 1;
};

const getAnswersBySlug = (sessionAnswers = {}, questions = []) => {
    const result = {};
    if (!sessionAnswers || typeof sessionAnswers !== "object") return result;

    if (sessionAnswers.bySlug && typeof sessionAnswers.bySlug === "object") {
        Object.assign(result, sessionAnswers.bySlug);
    }

    for (const question of questions) {
        if (!question?.slug) continue;
        if (hasAnswerValue(result[question.slug])) continue;

        if (hasAnswerValue(sessionAnswers[question.slug])) {
            result[question.slug] = sessionAnswers[question.slug];
            continue;
        }

        if (hasAnswerValue(sessionAnswers[question.text])) {
            result[question.slug] = sessionAnswers[question.text];
            continue;
        }

        if (
            sessionAnswers.byQuestionText &&
            typeof sessionAnswers.byQuestionText === "object" &&
            hasAnswerValue(sessionAnswers.byQuestionText[question.text])
        ) {
            result[question.slug] = sessionAnswers.byQuestionText[question.text];
        }
    }

    return result;
};

const buildPersistedAnswersPayload = (answersBySlug = {}, questions = []) => {
    const bySlug = {};
    const byQuestionText = {};

    for (const question of questions) {
        if (!question?.slug) continue;
        const value = answersBySlug[question.slug];
        if (!hasAnswerValue(value)) continue;
        bySlug[question.slug] = value;
        byQuestionText[question.text] = value;
    }

    return { bySlug, byQuestionText };
};

const getChangedAnswerDetails = (questions = [], previousAnswersBySlug = {}, nextAnswersBySlug = {}) => {
    const changes = [];
    for (let index = 0; index < questions.length; index += 1) {
        const question = questions[index];
        if (!question?.slug) continue;

        const previousValue = previousAnswersBySlug[question.slug];
        const nextValue = nextAnswersBySlug[question.slug];
        if (!hasAnswerValue(previousValue) || !hasAnswerValue(nextValue)) continue;
        if (toComparableAnswer(previousValue) === toComparableAnswer(nextValue)) continue;

        changes.push({
            index,
            slug: question.slug,
            previousValue,
            nextValue,
            hasFlowLogic:
                (Array.isArray(question.logic) && question.logic.length > 0) ||
                Boolean(question.nextQuestionSlug)
        });
    }
    return changes;
};

const getPossibleNextIndexes = (questions = [], index = 0) => {
    const nextIndexes = new Set();
    const question = questions[index];
    if (!question) return [];

    if (Array.isArray(question.logic)) {
        for (const rule of question.logic) {
            if (!rule?.nextQuestionSlug) continue;
            const targetIndex = findQuestionIndex(questions, rule.nextQuestionSlug);
            if (targetIndex !== -1) nextIndexes.add(targetIndex);
        }
    }

    if (question.nextQuestionSlug) {
        const defaultTarget = findQuestionIndex(questions, question.nextQuestionSlug);
        if (defaultTarget !== -1) nextIndexes.add(defaultTarget);
    }

    if (index + 1 < questions.length) {
        nextIndexes.add(index + 1);
    }

    return Array.from(nextIndexes);
};

const collectReachableIndexes = (questions = [], startIndex = -1) => {
    if (!Number.isInteger(startIndex) || startIndex < 0 || startIndex >= questions.length) {
        return new Set();
    }

    const visited = new Set();
    const queue = [startIndex];

    while (queue.length > 0) {
        const current = queue.shift();
        if (!Number.isInteger(current) || visited.has(current)) continue;
        visited.add(current);

        const nextIndexes = getPossibleNextIndexes(questions, current);
        for (const nextIndex of nextIndexes) {
            if (!visited.has(nextIndex)) {
                queue.push(nextIndex);
            }
        }
    }

    return visited;
};

const getDependentIndexesForChanges = (questions = [], changes = []) => {
    const dependentIndexes = new Set();

    for (const change of changes) {
        if (!change?.hasFlowLogic) continue;

        const previousBranchNext = resolveNextQuestionIndex(
            questions,
            change.index,
            change.previousValue
        );
        const nextBranchNext = resolveNextQuestionIndex(
            questions,
            change.index,
            change.nextValue
        );

        if (previousBranchNext === nextBranchNext) continue;

        const previousReachable = collectReachableIndexes(questions, previousBranchNext);
        const nextReachable = collectReachableIndexes(questions, nextBranchNext);

        for (const idx of previousReachable) {
            if (!nextReachable.has(idx) && idx > change.index) {
                dependentIndexes.add(idx);
            }
        }

        for (const idx of nextReachable) {
            if (!previousReachable.has(idx) && idx > change.index) {
                dependentIndexes.add(idx);
            }
        }
    }

    return Array.from(dependentIndexes).sort((a, b) => a - b);
};

const clearAnswersByIndexes = (answersBySlug = {}, questions = [], indexes = []) => {
    const nextAnswers = { ...(answersBySlug || {}) };
    for (const index of indexes) {
        const slug = questions[index]?.slug;
        if (!slug) continue;
        delete nextAnswers[slug];
    }
    return nextAnswers;
};

const applyExtractedAnswerUpdates = ({
    baseAnswersBySlug = {},
    existingAnswersBySlug = {},
    extractedAnswers = [],
    questionIndexBySlug = new Map(),
    questionSlugSet = new Set(),
    ignoreSlug = "",
    correctionIntent = false,
    logPrefix = "[Auto Capture]"
}) => {
    const nextAnswers = { ...(baseAnswersBySlug || {}) };
    const updatedSlugs = [];

    for (const extracted of extractedAnswers || []) {
        const slug = extracted?.slug;
        if (!slug || (questionSlugSet.size > 0 && !questionSlugSet.has(slug))) continue;
        if (ignoreSlug && slug === ignoreSlug) continue;
        if (!hasAnswerValue(extracted?.answer)) continue;

        const confidence = Number(extracted?.confidence);
        const normalizedConfidence = Number.isFinite(confidence) ? confidence : 0;
        const hasExistingAnswer = hasAnswerValue(existingAnswersBySlug[slug]);
        const minConfidence = hasExistingAnswer
            ? (correctionIntent ? EXTRACTION_CONFIDENCE_MIN : EXTRACTION_CONFIDENCE_UPDATE_MIN)
            : EXTRACTION_CONFIDENCE_MIN;

        if (normalizedConfidence < minConfidence) continue;

        if (
            hasExistingAnswer &&
            toComparableAnswer(existingAnswersBySlug[slug]) === toComparableAnswer(extracted.answer)
        ) {
            continue;
        }

        nextAnswers[slug] = extracted.answer;
        updatedSlugs.push(slug);

        const targetIndex = questionIndexBySlug.get(slug);
        if (Number.isInteger(targetIndex)) {
            console.log(
                `${logPrefix} Updated "${slug}" at step ${targetIndex} (confidence=${normalizedConfidence.toFixed(2)})`
            );
        }
    }

    return { answersBySlug: nextAnswers, updatedSlugs };
};

const findNextUnansweredStep = (questions = [], answersBySlug = {}) => {
    if (!Array.isArray(questions) || questions.length === 0) return 0;

    let step = 0;
    const visited = new Set();

    while (step < questions.length) {
        if (visited.has(step)) {
            break;
        }
        visited.add(step);

        const question = questions[step];
        const answer = question?.slug ? answersBySlug[question.slug] : undefined;

        if (!hasAnswerValue(answer)) {
            return step;
        }

        step = resolveNextQuestionIndex(questions, step, answer);
    }

    return questions.length;
};

const parseAnswerExtractionResponse = (rawMessage) => {
    if (typeof rawMessage !== "string" || !rawMessage.trim()) {
        return [];
    }

    const raw = rawMessage.trim();
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    const extracted = firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace
        ? raw.substring(firstBrace, lastBrace + 1)
        : raw;

    const candidates = [
        extracted,
        extracted.replace(/\*\*/g, ""),
        extracted
            .replace(/^\s*```(?:json)?\s*/i, "")
            .replace(/\s*```\s*$/i, ""),
        raw,
        raw.replace(/\*\*/g, "")
    ];

    for (const candidate of candidates) {
        const normalized = candidate
            .replace(/^\s*```(?:json)?\s*/i, "")
            .replace(/\s*```\s*$/i, "")
            .trim();

        if (!normalized.startsWith("{") || !normalized.endsWith("}")) {
            continue;
        }

        try {
            const parsed = JSON.parse(normalized);
            const rows = Array.isArray(parsed?.answers) ? parsed.answers : [];
            return rows
                .map((row) => ({
                    slug: row?.slug,
                    answer: row?.answer,
                    confidence: Number(row?.confidence)
                }))
                .filter((row) => row.slug && hasAnswerValue(row.answer));
        } catch {
            // Try next normalization candidate.
        }
    }

    return [];
};

const mergeExtractedAnswers = ({
    baseAnswers = {},
    extractedAnswers = [],
    validSlugs = new Set()
}) => {
    const merged = { ...(baseAnswers || {}) };

    for (const extracted of extractedAnswers || []) {
        const slug = extracted?.slug;
        if (!slug || (validSlugs.size > 0 && !validSlugs.has(slug))) continue;
        if (!hasAnswerValue(extracted?.answer)) continue;

        const confidence = Number(extracted?.confidence);
        const normalizedConfidence = Number.isFinite(confidence) ? confidence : 0;
        const existing = merged[slug];

        if (!hasAnswerValue(existing)) {
            if (normalizedConfidence >= 0.65) {
                merged[slug] = extracted.answer;
            }
            continue;
        }

        if (
            toComparableAnswer(existing) !== toComparableAnswer(extracted.answer) &&
            normalizedConfidence >= 0.92
        ) {
            merged[slug] = extracted.answer;
        }
    }

    return merged;
};

const buildQuestionAnswerCoverage = (questions = [], answersBySlug = {}) =>
    questions.map((question) => ({
        slug: question?.slug || "",
        question: question?.text || "",
        answer: hasAnswerValue(answersBySlug[question?.slug]) ? String(answersBySlug[question.slug]) : null
    }));

const extractAnswersFromMessage = async ({ serviceName = "", message = "", questions = [] }) => {
    if (!message || !Array.isArray(questions) || questions.length === 0) {
        return [];
    }

    const compactQuestions = questions.map((q) => ({
        slug: q.slug,
        question: q.text,
        type: q.type || "text",
        options: Array.isArray(q.options)
            ? q.options.map((opt) => ({
                value: typeof opt === "string" ? opt : (opt?.value ?? ""),
                label: typeof opt === "string" ? opt : (opt?.label ?? "")
            }))
            : []
    }));

    const extractorPrompt = `
You are extracting explicit answers from a single user message.

Service: ${serviceName}
User message: ${JSON.stringify(message)}
Questionnaire: ${JSON.stringify(compactQuestions)}

Rules:
- Return only answers that are explicitly present in the user message.
- Do not infer, assume, or guess.
- If a question is not clearly answered, skip it.
- Keep answers short and literal to what the user said.

Return only valid JSON in this format:
{
  "answers": [
    { "slug": "question_slug", "answer": "user answer", "confidence": 0.0 }
  ]
}
`;

    try {
        const extractionResponse = await chatWithAI(
            [{ role: "user", content: extractorPrompt }],
            [{ role: "system", content: "You are a JSON-only extractor. Output strict JSON only." }],
            "system_extractor"
        );

        if (!extractionResponse?.success) return [];
        return parseAnswerExtractionResponse(extractionResponse.message);
    } catch {
        return [];
    }
};

const extractAnswersFromConversation = async ({ serviceName = "", history = [], questions = [] }) => {
    if (!Array.isArray(history) || history.length === 0) return [];
    if (!Array.isArray(questions) || questions.length === 0) return [];

    const compactQuestions = questions.map((q) => ({
        slug: q.slug,
        question: q.text,
        type: q.type || "text",
        options: Array.isArray(q.options)
            ? q.options.map((opt) => ({
                value: typeof opt === "string" ? opt : (opt?.value ?? ""),
                label: typeof opt === "string" ? opt : (opt?.label ?? "")
            }))
            : []
    }));

    const transcript = history
        .filter((msg) => msg?.role && msg?.content)
        .map((msg) => `${String(msg.role).toUpperCase()}: ${String(msg.content)}`)
        .join("\n");

    const extractorPrompt = `
You are extracting questionnaire answers from a completed chat transcript.

Service: ${serviceName}
Questions: ${JSON.stringify(compactQuestions)}
Transcript:
${transcript}

Rules:
- Return answers only if explicitly provided by USER messages.
- If one user message answers multiple questions, return all matched questions.
- Do not infer missing answers.
- Prefer concise answer text.

Return strict JSON only:
{
  "answers": [
    { "slug": "question_slug", "answer": "answer text", "confidence": 0.0 }
  ]
}
`;

    try {
        const extractionResponse = await chatWithAI(
            [{ role: "user", content: extractorPrompt }],
            [{ role: "system", content: "You are a JSON-only extractor. Output strict JSON only." }],
            "system_extractor"
        );

        if (!extractionResponse?.success) return [];
        return parseAnswerExtractionResponse(extractionResponse.message);
    } catch {
        return [];
    }
};

// @desc    Start a new guest session with guided questions
// @route   POST /api/guest/start
// @access  Public
export const startGuestSession = asyncHandler(async (req, res) => {
    const { serviceId } = req.body; // Can be slug or ID

    if (!serviceId) {
        throw new AppError("Service ID is required", 400);
    }

    // 1. Find the Service and its Questions
    const service = await prisma.service.findFirst({
        where: {
            OR: [
                { slug: serviceId },
                { id: serviceId }
            ],
            active: true
        },
        include: {
            questions: {
                orderBy: { order: 'asc' }
            }
        }
    });

    if (!service) {
        throw new AppError("Service not found or inactive", 404);
    }

    const firstQuestion = service.questions[0]?.text || "How can I help you regarding this service?";
    const firstQuestionConfig = {
        type: service.questions[0]?.type || "text",
        options: service.questions[0]?.options || []
    };

    // 2. Create Session
    const session = await prisma.aiGuestSession.create({
        data: {
            serviceId: service.slug, // Store slug for consistency
            currentStep: 0,
            answers: {},
        },
    });

    // 3. Create Initial assistant message (The First Question)
    await prisma.aiGuestMessage.create({
        data: {
            sessionId: session.id,
            role: "assistant",
            content: firstQuestion,
        },
    });

    res.status(201).json({
        success: true,
        sessionId: session.id,
        message: firstQuestion,
        inputConfig: firstQuestionConfig,
        history: [{ role: "assistant", content: firstQuestion }]
    });
});

// @desc    Handle chat: Answer questions -> Generate Proposal
// @route   POST /api/guest/chat
// @access  Public
export const guestChat = asyncHandler(async (req, res) => {
    const { sessionId, message } = req.body;

    const incomingArray = Array.isArray(message)
        ? message.filter(Boolean).map(String)
        : [];
    const messageText = Array.isArray(message)
        ? incomingArray.join(", ")
        : (message ?? "");
    const trimmedMessageText = messageText.toString().trim();
    const safeMessageText = incomingArray.length ? incomingArray.join(", ") : trimmedMessageText;

    console.log(`\n--- [Guest Chat] Session: ${sessionId} ---`);
    console.log(`[User]: ${safeMessageText || message}`);

    if (!sessionId || (!trimmedMessageText && incomingArray.length === 0)) {
        throw new AppError("Session ID and message are required", 400);
    }

    // 1. Fetch Session
    const session = await prisma.aiGuestSession.findUnique({
        where: { id: sessionId },
        include: { messages: true },
    });

    if (!session) {
        throw new AppError("Session not found", 404);
    }

    // 2. Fetch Service Questions
    const service = await prisma.service.findUnique({
        where: { slug: session.serviceId },
        include: {
            questions: {
                orderBy: { order: 'asc' }
            }
        }
    });

    if (!service) {
        throw new AppError("Service context lost", 404);
    }

    const questions = service.questions;
    const currentStep = session.currentStep;
    const currentQuestion = questions[currentStep];
    const existingAnswersBySlug = getAnswersBySlug(session.answers || {}, questions);
    const correctionIntent = hasCorrectionIntent(safeMessageText);
    const questionIndexBySlug = new Map(
        questions
            .filter((q) => q?.slug)
            .map((q, index) => [q.slug, index])
    );
    const questionSlugSet = new Set(questions.map((q) => q.slug).filter(Boolean));
    let extractedAnswersForMessage = [];
    if (currentStep < questions.length) {
        extractedAnswersForMessage = await extractAnswersFromMessage({
            serviceName: service.name,
            message: safeMessageText,
            questions
        });
    }

    // 3. Save User Answer (Preliminary)
    // We will save it, but we might not advance step if invalid.

    // --- VALIDATION STEP ---
    let validationResult = null;
    let aiResponseContent = "";

    if (currentStep < questions.length) {
        const currentQuestionText = currentQuestion?.text || "";

        if (isGreetingInsteadOfNameAnswer(currentQuestionText, safeMessageText)) {
            validationResult = {
                isValid: false,
                status: "invalid_answer",
                message: "I am doing well, thanks. Please share your name so I can continue."
            };
            aiResponseContent = validationResult.message;
            console.log("[Validation Fallback]:", validationResult);
        } else {

        // Prepare context for the NEXT question if it exists
        const nextStepIndex = currentStep + 1;
        const nextQuestionText = (nextStepIndex < questions.length)
            ? questions[nextStepIndex].text
            : "This was the final question. I will now generate the proposal.";

        const validationPrompt = `
            You are a friendly, professional assistant guiding a user through a questionnaire for a "${service.name}" service.
            
            Current Question Asked: "${currentQuestionText}"
            User's Answer: "${safeMessageText}"
            
            Next Question in Script: "${nextQuestionText}"

            Task:
            1. Validate the user's answer to the Current Question.
            - If it's a greeting (hi, hello) but the question expects details -> INVALID.
            - If it's irrelevant/gibberish -> INVALID.
            - If the user is asking an informational side-question (e.g., "what is Flutter?", "which is best for me?") instead of directly answering the current question -> INFO_REQUEST.
            - Otherwise -> VALID.

            2. Generate a Response Message:
            - If INVALID: Politely ask for clarification or the specific details needed.
            - For name questions, ask for "name" only. Never ask for "full name" or "real full name".
            - If INFO_REQUEST: Give a brief helpful answer (1-2 short sentences), then ask the Current Question again so we can continue the flow.
            - If VALID: Acknowledge the answer briefly and enthusiastically, then ask the "Next Question in Script" naturally. 
              (Example: "That sounds great! Now, [Next Question]?")
              (If it's the final question, just say "Thanks! Let me put that together for you.")

            Return ONLY a raw JSON object (double quotes only) with this structure:
            {
                "isValid": boolean,
                "status": "valid_answer" | "invalid_answer" | "info_request",
                "message": string // The response to send to the user (error feedback OR next question transition)
            }
            Do not use markdown formatting, code fences, or bold text.
        `;

        // We use a separate AI call for validation. 
        const validationResponse = await chatWithAI(
            [{ role: "user", content: validationPrompt }],
            [{ role: "system", content: "You are a JSON-only API. Output strictly valid JSON." }],
            "system_validator"
        );

        if (validationResponse.success) {
            console.log(`[Validation Raw]:`, validationResponse.message);
            const parsedValidation = parseValidationResponse(validationResponse.message);
            if (parsedValidation) {
                validationResult = parsedValidation;
                aiResponseContent = parsedValidation.message;
                console.log(`[Validation Parsed]:`, parsedValidation);
            } else {
                console.warn("[Validation] Could not parse structured validator output");
            }
        } else {
            console.warn("[Validation] AI request failed");
        }
        }

        // If parsing fails, avoid advancing on obvious non-answers.
        if (!validationResult && GREETING_ONLY_REGEX.test(safeMessageText)) {
            validationResult = {
                isValid: false,
                message: "Please answer the question directly so I can continue.",
            };
        }

        if (!validationResult) {
            validationResult = { isValid: true, message: "" };
        }

        if (!validationResult.isValid) {
            if (validationResult.status === "info_request") {
                const normalizedResponse = (aiResponseContent || "").toLowerCase();
                const normalizedCurrentQuestion = (currentQuestionText || "").toLowerCase();
                if (
                    currentQuestionText &&
                    !normalizedResponse.includes(normalizedCurrentQuestion)
                ) {
                    aiResponseContent = `${aiResponseContent}\n\n${currentQuestionText}`;
                }
            }

            const correctionCapture = applyExtractedAnswerUpdates({
                baseAnswersBySlug: { ...existingAnswersBySlug },
                existingAnswersBySlug,
                extractedAnswers: extractedAnswersForMessage,
                questionIndexBySlug,
                questionSlugSet,
                ignoreSlug: currentQuestion?.slug,
                correctionIntent: true,
                logPrefix: "[Correction Capture]"
            });
            const correctionChanges = getChangedAnswerDetails(
                questions,
                existingAnswersBySlug,
                correctionCapture.answersBySlug
            );

            if (correctionChanges.length > 0) {
                let correctedAnswersBySlug = correctionCapture.answersBySlug;
                const dependentIndexes = getDependentIndexesForChanges(questions, correctionChanges);

                if (dependentIndexes.length > 0) {
                    correctedAnswersBySlug = clearAnswersByIndexes(
                        correctedAnswersBySlug,
                        questions,
                        dependentIndexes
                    );
                    const dependentSlugs = dependentIndexes
                        .map((index) => questions[index]?.slug)
                        .filter(Boolean)
                        .join(", ");
                    console.log(
                        `[Correction Flow] Cleared dependent answers after correction: ${dependentSlugs}`
                    );
                }

                const correctionNextStep = findNextUnansweredStep(questions, correctedAnswersBySlug);
                const correctedPayload = buildPersistedAnswersPayload(correctedAnswersBySlug, questions);

                await prisma.aiGuestSession.update({
                    where: { id: sessionId },
                    data: {
                        answers: correctedPayload,
                        currentStep: correctionNextStep
                    }
                });

                await prisma.aiGuestMessage.create({
                    data: {
                        sessionId,
                        role: "user",
                        content: safeMessageText,
                    },
                });

                const followQuestion = correctionNextStep < questions.length
                    ? questions[correctionNextStep].text
                    : "Thanks, I updated that. Let me generate your proposal now.";
                const correctionBridge = dependentIndexes.length > 0
                    ? "Got it - I updated your earlier answer and adjusted related steps."
                    : "Got it - I updated your earlier answer.";
                const correctionMessage = buildFriendlyMessage(followQuestion, correctionBridge);

                await prisma.aiGuestMessage.create({
                    data: {
                        sessionId,
                        role: "assistant",
                        content: correctionMessage,
                    },
                });

                const sessionReload = await prisma.aiGuestSession.findUnique({
                    where: { id: sessionId },
                    include: { messages: { orderBy: { createdAt: 'asc' } } },
                });

                const correctionInputConfig = correctionNextStep < questions.length
                    ? {
                        type: questions[correctionNextStep].type || "text",
                        options: questions[correctionNextStep].options || []
                    }
                    : { type: "text", options: [] };

                return res.json({
                    success: true,
                    message: correctionMessage,
                    inputConfig: correctionInputConfig,
                    history: sessionReload.messages.map(m => ({ role: m.role, content: m.content }))
                });
            }

            // INVALID ANSWER FLOW

            // 1. Save User's (Invalid) Message
            await prisma.aiGuestMessage.create({
                data: {
                    sessionId,
                    role: "user",
                    content: safeMessageText,
                },
            });

            // 2. Save Assistant's Feedback Message
            const feedbackMsg = aiResponseContent || "Could you please provide more specific details?";
            await prisma.aiGuestMessage.create({
                data: {
                    sessionId,
                    role: "assistant",
                    content: feedbackMsg,
                },
            });

            // 3. Return response WITHOUT incrementing step
            // Re-fetch messages including the new ones
            const sessionReload = await prisma.aiGuestSession.findUnique({
                where: { id: sessionId },
                include: { messages: { orderBy: { createdAt: 'asc' } } },
            });

            return res.json({
                success: true,
                message: feedbackMsg,
                history: sessionReload.messages.map(m => ({ role: m.role, content: m.content }))
            });
        }
    }
    // --- END VALIDATION STEP ---

    // 3. Save User Answer (Valid)
    await prisma.aiGuestMessage.create({
        data: {
            sessionId,
            role: "user",
            content: safeMessageText,
        },
    });

    let updatedAnswersBySlug = { ...existingAnswersBySlug };

    if (currentQuestion?.slug) {
        updatedAnswersBySlug[currentQuestion.slug] = safeMessageText;
    }

    let autoCapturedAnswerSlugs = [];
    if (currentStep < questions.length) {
        const autoCapture = applyExtractedAnswerUpdates({
            baseAnswersBySlug: updatedAnswersBySlug,
            existingAnswersBySlug,
            extractedAnswers: extractedAnswersForMessage,
            questionIndexBySlug,
            questionSlugSet,
            ignoreSlug: currentQuestion?.slug,
            correctionIntent,
            logPrefix: "[Auto Capture]"
        });
        updatedAnswersBySlug = autoCapture.answersBySlug;
        autoCapturedAnswerSlugs = autoCapture.updatedSlugs;
    }

    const changedAnswers = getChangedAnswerDetails(
        questions,
        existingAnswersBySlug,
        updatedAnswersBySlug
    );
    const dependentIndexes = getDependentIndexesForChanges(questions, changedAnswers);
    const dependentResetApplied = dependentIndexes.length > 0;

    if (dependentResetApplied) {
        updatedAnswersBySlug = clearAnswersByIndexes(updatedAnswersBySlug, questions, dependentIndexes);
        autoCapturedAnswerSlugs = [];
        const dependentSlugs = dependentIndexes
            .map((index) => questions[index]?.slug)
            .filter(Boolean)
            .join(", ");
        console.log(
            `[Flow Reset] Cleared dependent answers only: ${dependentSlugs}`
        );
    } else if (changedAnswers.length > 0) {
        console.log(
            `[Flow Update] Updated previous answers without dependent reset.`
        );
    }

    const nextStep = findNextUnansweredStep(questions, updatedAnswersBySlug);
    const persistedAnswers = buildPersistedAnswersPayload(updatedAnswersBySlug, questions);

    await prisma.aiGuestSession.update({
        where: { id: sessionId },
        data: {
            answers: persistedAnswers,
            currentStep: nextStep
        }
    });

    // 4. Determine Next Assistant Response
    let responseContent = "";
    let nextInputConfig = { type: "text", options: [] };

    if (nextStep < questions.length) {
        const nextQuestionText = questions[nextStep].text;
        const expectedImmediateNextStep = resolveNextQuestionIndex(
            questions,
            currentStep,
            currentQuestion?.slug ? updatedAnswersBySlug[currentQuestion.slug] : safeMessageText
        );

        const canUseAiTransition = Boolean(aiResponseContent)
            && autoCapturedAnswerSlugs.length === 0
            && !dependentResetApplied
            && nextStep === expectedImmediateNextStep;

        const fallbackBridge = autoCapturedAnswerSlugs.length > 0
            ? "Awesome - I have already captured some details from your previous message."
            : dependentResetApplied
                ? "Thanks for clarifying - I updated the related flow."
                : pickFriendlyBridge(nextQuestionText);
        const aiBridge = canUseAiTransition
            ? extractFriendlyBridgeFromValidationMessage(aiResponseContent, nextQuestionText)
            : "";
        responseContent = buildFriendlyMessage(nextQuestionText, aiBridge || fallbackBridge);

        // Configure next input
        nextInputConfig = {
            type: questions[nextStep].type || "text",
            options: questions[nextStep].options || []
        };
    } else {
        // CASE B: All questions answered -> Generate Proposal
        try {
            const proposalHistory = [
                ...session.messages.map((m) => ({ role: m.role, content: m.content })),
                { role: "user", content: safeMessageText }
            ];
            const allQuestionSlugs = new Set(questions.map((q) => q.slug).filter(Boolean));
            const extractedFromConversation = await extractAnswersFromConversation({
                serviceName: service.name,
                history: proposalHistory,
                questions
            });
            const proposalAnswersBySlug = mergeExtractedAnswers({
                baseAnswers: persistedAnswers.bySlug,
                extractedAnswers: extractedFromConversation,
                validSlugs: allQuestionSlugs
            });
            const proposalAnswersPayload = buildPersistedAnswersPayload(proposalAnswersBySlug, questions);

            if (extractedFromConversation.length > 0) {
                console.log(
                    `[Proposal Enrichment] merged ${extractedFromConversation.length} transcript-derived answer(s).`
                );
            }

            if (
                JSON.stringify(proposalAnswersPayload.bySlug) !==
                JSON.stringify(persistedAnswers.bySlug)
            ) {
                await prisma.aiGuestSession.update({
                    where: { id: sessionId },
                    data: { answers: proposalAnswersPayload }
                });
            }

            const proposalContext = {
                serviceName: service.name,
                serviceId: service.slug,
                questionnaireAnswers: proposalAnswersPayload.byQuestionText,
                questionnaireAnswersBySlug: proposalAnswersPayload.bySlug,
                serviceQuestionAnswers: buildQuestionAnswerCoverage(questions, proposalAnswersPayload.bySlug),
                capturedFields: Object.entries(proposalAnswersPayload.byQuestionText || {})
                    .filter(([, value]) => hasAnswerValue(value))
                    .map(([question, answer]) => ({
                        question,
                        answer: String(answer)
                    }))
            };
            const appHints = buildAppProposalHints({
                history: proposalHistory,
                answersByQuestionText: proposalAnswersPayload.byQuestionText
            });
            if (appHints) {
                proposalContext.appHints = appHints;
            }

            responseContent = await generateProposalMarkdown(
                proposalContext,
                proposalHistory,
                service.name
            );
        } catch (error) {
            console.error("[Proposal] Generation failed:", error?.message || error);
            responseContent = "I have collected your requirements, but I'm having trouble generating the proposal right now. Please sign up to connect with an expert.";
        }
        // No input config for final step (or maybe CTA in future)
    }

    // 5. Save Assistant Message
    console.log(`[Assistant]: ${responseContent}`);
    await prisma.aiGuestMessage.create({
        data: {
            sessionId,
            role: "assistant",
            content: responseContent,
        },
    });

    // Re-fetch messages for complete history or append manually
    const newHistory = [
        ...session.messages.map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: safeMessageText },
        { role: "assistant", content: responseContent }
    ];

    res.json({
        success: true,
        message: responseContent,
        inputConfig: nextInputConfig,
        history: newHistory
    });
});

// @desc    Get guest session history
// @route   GET /api/guest/history/:sessionId
// @access  Public
export const getGuestHistory = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    const session = await prisma.aiGuestSession.findUnique({
        where: { id: sessionId },
        include: {
            messages: {
                orderBy: { createdAt: 'asc' }
            }
        },
    });

    if (!session) {
        throw new AppError("Session not found", 404);
    }

    res.json({
        success: true,
        messages: session.messages,
    });
});
