import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";
import { env } from "../config/env.js";
import {
    chatWithAI,
    formatCurrencyValue,
    generateProposalMarkdown,
    parseBudgetFromText,
} from "../services/ai.service.js";

const GREETING_ONLY_REGEX = /^(hi|hello|hey|yo|hola|good\s*(morning|afternoon|evening))[!.\s]*$/i;
const NAME_QUESTION_REGEX = /\bname\b/i;
const GREETING_SMALLTALK_REGEX =
    /\b(hi|hello|hey|yo|hola|namaste|salam|how are you|what'?s up|kya\s*hal|kaise\s*ho)\b/i;
const NAME_INTRO_REGEX = /\b(my name is|i am|i'm|this is)\b/i;
const CORRECTION_INTENT_REGEX =
    /\b(change|changed|update|updated|correct|correction|revise|replace|instead|not\s+.*\s+but|it'?s?\s+my\s+(brand|company|business)\s+name|this\s+is\s+my\s+(brand|company|business)\s+name|that'?s?\s+my\s+(brand|company|business)\s+name|not\s+my\s+name)\b/i;
const CONTEXT_SUGGESTION_REGEX =
    /\b(suggest|suggestion|recommend|recommended|best|which is better|according to|as per|based on|shared earlier|from earlier|my startup|my case|possible|is it possible|can we build|can this be built|feasible|not sure|confused|difference|explain)\b/i;
const AGENT_IDENTITY_REGEX =
    /\b(what(?:'s| is)\s+your\s+name|your\s+name\??|who\s+are\s+you|are\s+you\s+(?:an?\s+)?(?:ai|bot|human))\b/i;
const GRATITUDE_REGEX = /\b(thanks|thank you|thx|ty)\b/i;
const ATTACHMENT_REFERENCE_REGEX = /\b(pdf|document|doc|file|attachment|uploaded|upload|proposal|brochure|resume|deck|sheet)\b/i;
const URL_REFERENCE_REGEX = /\b(url|link|website|site|webpage|page|reference)\b/i;
const EXTRACTION_CONFIDENCE_MIN = 0.7;
const EXTRACTION_CONFIDENCE_UPDATE_MIN = 0.86;
const FRIENDLY_BRIDGES = [
    "Thanks for sharing that.",
    "Great, this helps a lot.",
    "Perfect, we are moving forward well.",
    "Nice, I noted that."
];
const ATTACHMENT_TOKEN_REGEX = /^\[\[ATTACHMENT\]\]([^|]+)\|([^|]+)\|([^|]*)\|(\d+)$/;
const URL_TOKEN_REGEX = /^\[\[URL\]\]([^|]+)\|([^|]*)$/;
const MAX_ATTACHMENT_ANALYSIS_COUNT = 3;
const MAX_SINGLE_ATTACHMENT_TEXT_CHARS = 4000;
const MAX_ATTACHMENT_CONTEXT_CHARS = 9000;
const MAX_URL_ANALYSIS_COUNT = 2;
const MAX_URL_CONTEXT_CHARS = 5000;
const MAX_VISION_IMAGE_BYTES = 4 * 1024 * 1024;
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const METADATA_USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const IMAGE_FILE_REGEX = /\.(png|jpe?g|gif|webp|bmp|svg)$/i;
const PDF_FILE_REGEX = /\.pdf$/i;
const DOCX_FILE_REGEX = /\.docx$/i;
const TEXT_FILE_REGEX = /\.(txt|md|csv|json|xml|yaml|yml)$/i;
const URL_CANDIDATE_REGEX = /(?:https?:\/\/|www\.)[^\s<>"']+/gi;
let pdfJsModulePromise = null;
let mammothModulePromise = null;

const getTimingNow = () =>
    typeof performance !== "undefined" && typeof performance.now === "function"
        ? performance.now()
        : Date.now();

const roundTimingMs = (value = 0) => {
    const numericValue = Number(value || 0);
    if (!Number.isFinite(numericValue)) return 0;
    return Math.max(0, Math.round(numericValue * 10) / 10);
};

const createRequestTimingTracker = (scope = "guest_chat") => {
    const startedAt = getTimingNow();
    const steps = [];
    let stepIndex = 0;

    const pushStep = (key = "", meta = {}, stepStartedAt = startedAt, stepEndedAt = getTimingNow()) => {
        const {
            label = key,
            category = "server",
            detail = "",
            status = "ok",
            extra = {},
        } = meta || {};

        const normalizedExtra = extra && typeof extra === "object" && !Array.isArray(extra)
            ? extra
            : {};

        steps.push({
            index: stepIndex,
            key: String(key || "").trim() || `step_${stepIndex + 1}`,
            label: String(label || key || "").trim() || `Step ${stepIndex + 1}`,
            category: String(category || "server").trim() || "server",
            detail: String(detail || "").trim(),
            status: String(status || "ok").trim() || "ok",
            durationMs: roundTimingMs(stepEndedAt - stepStartedAt),
            startOffsetMs: roundTimingMs(stepStartedAt - startedAt),
            endOffsetMs: roundTimingMs(stepEndedAt - startedAt),
            ...normalizedExtra,
        });
        stepIndex += 1;
    };

    return {
        async measure(key, work, meta = {}) {
            const stepStartedAt = getTimingNow();
            try {
                const result = await work();
                const extractedExtra =
                    typeof meta?.extractMeta === "function" ? meta.extractMeta(result) : null;
                pushStep(
                    key,
                    {
                        ...meta,
                        extra: {
                            ...(meta?.extra && typeof meta.extra === "object" ? meta.extra : {}),
                            ...(extractedExtra && typeof extractedExtra === "object" ? extractedExtra : {}),
                        },
                    },
                    stepStartedAt,
                    getTimingNow(),
                );
                return result;
            } catch (error) {
                pushStep(
                    key,
                    {
                        ...meta,
                        status: "error",
                        extra: {
                            ...(meta?.extra && typeof meta.extra === "object" ? meta.extra : {}),
                            error: error?.message || String(error),
                        },
                    },
                    stepStartedAt,
                    getTimingNow(),
                );
                throw error;
            }
        },
        mark(key, meta = {}, stepStartedAt = null) {
            const startAt = stepStartedAt !== null
                && stepStartedAt !== undefined
                && Number.isFinite(Number(stepStartedAt))
                ? Number(stepStartedAt)
                : getTimingNow();
            pushStep(key, meta, startAt, getTimingNow());
        },
        build(extra = {}) {
            return {
                scope,
                totalDurationMs: roundTimingMs(getTimingNow() - startedAt),
                stepCount: steps.length,
                steps,
                ...(extra && typeof extra === "object" && !Array.isArray(extra) ? extra : {}),
            };
        },
    };
};

const formatTimingValueForLog = (value = 0) => {
    const safeValue = roundTimingMs(value);
    if (safeValue < 1000) return `${safeValue}ms`;
    if (safeValue < 10000) return `${(safeValue / 1000).toFixed(1)}s`;
    return `${Math.round(safeValue / 1000)}s`;
};

const buildTimingTerminalLines = (timingMeta = {}, context = {}) => {
    const routeLabel = String(context?.routeLabel || timingMeta?.scope || "timing").trim();
    const requestLabel = String(context?.requestLabel || "").trim();
    const steps = Array.isArray(timingMeta?.steps) ? timingMeta.steps : [];

    const headerParts = [
        `[Timing][${routeLabel}]`,
        requestLabel ? requestLabel : "",
        `total=${formatTimingValueForLog(timingMeta?.totalDurationMs || 0)}`,
        `steps=${steps.length}`,
    ].filter(Boolean);

    const lines = [headerParts.join(" ")];

    steps.forEach((step, index) => {
        const aiMeta = [
            step?.aiTask ? `task=${step.aiTask}` : "",
            step?.aiModel ? `model=${step.aiModel}` : "",
            Number.isFinite(Number(step?.aiProviderDurationMs)) && Number(step.aiProviderDurationMs) > 0
                ? `provider=${formatTimingValueForLog(step.aiProviderDurationMs)}`
                : "",
            Number.isFinite(Number(step?.aiTotalTokens)) && Number(step.aiTotalTokens) > 0
                ? `tokens=${step.aiTotalTokens}`
                : "",
            step?.status && step.status !== "ok" ? `status=${step.status}` : "",
        ].filter(Boolean).join(" | ");

        const detailSuffix = step?.detail ? ` - ${step.detail}` : "";
        const aiSuffix = aiMeta ? ` | ${aiMeta}` : "";
        lines.push(
            `  ${index + 1}. ${String(step?.label || step?.key || `step_${index + 1}`)} ` +
            `[${String(step?.category || "server")}] ${formatTimingValueForLog(step?.durationMs || 0)}` +
            `${detailSuffix}${aiSuffix}`
        );
    });

    return lines;
};

const logTimingMetaToTerminal = (timingMeta = {}, context = {}) => {
    const lines = buildTimingTerminalLines(timingMeta, context);
    lines.forEach((line) => console.log(line));
};

const attachTimingMetaToResponse = (res, tracker, context = {}) => {
    const originalJson = res.json.bind(res);
    res.json = (payload) => {
        if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
            return originalJson(payload);
        }

        const timingMeta = payload.timingMeta || tracker.build();
        logTimingMetaToTerminal(timingMeta, context);

        return originalJson({
            ...payload,
            timingMeta,
        });
    };
};

const extractAiTimingMeta = (response = {}) => {
    const responseMeta = response?.meta;
    const usage = response?.usage;
    if (!responseMeta || typeof responseMeta !== "object") return {};

    return {
        aiTask: responseMeta.task || "",
        aiMode: responseMeta.mode || "",
        aiProvider: responseMeta.provider || "",
        aiModel: responseMeta.model || "",
        aiProfile: responseMeta.title || "",
        aiInternalTask: Boolean(responseMeta.internalTask),
        aiProviderDurationMs: roundTimingMs(responseMeta.providerDurationMs),
        aiAttemptCount: Number.isFinite(Number(responseMeta.attemptCount))
            ? Number(responseMeta.attemptCount)
            : 0,
        aiPromptTokens: Number.isFinite(Number(usage?.prompt_tokens))
            ? Number(usage.prompt_tokens)
            : undefined,
        aiCompletionTokens: Number.isFinite(Number(usage?.completion_tokens))
            ? Number(usage.completion_tokens)
            : undefined,
        aiTotalTokens: Number.isFinite(Number(usage?.total_tokens))
            ? Number(usage.total_tokens)
            : undefined,
    };
};

const runTrackedAiCall = async ({
    timingTracker = null,
    key = "ai_call",
    label = "AI call",
    detail = "",
    messages = [],
    conversationHistory = [],
    selectedServiceName = "",
}) => {
    const run = () => chatWithAI(messages, conversationHistory, selectedServiceName);

    const normalizedTaskName = String(selectedServiceName || "").trim();
    const shouldUseCache = INTERNAL_AI_CACHEABLE_TASKS.has(normalizedTaskName);
    const cacheKey = shouldUseCache
        ? buildInternalAiCacheKey({ selectedServiceName: normalizedTaskName, messages, conversationHistory })
        : "";

    if (cacheKey) {
        const cachedResult = getCachedInternalAiResult(cacheKey);
        if (cachedResult) {
            timingTracker?.mark(`${key}_cache_hit`, {
                label: `${label} (cache)`,
                category: "cache",
                detail: `Reusing cached result for ${String(label || "AI call").trim().toLowerCase()}.`,
                extra: {
                    cacheHit: true,
                    ...extractAiTimingMeta(cachedResult),
                },
            });
            return cachedResult;
        }

        if (internalAiInFlight.has(cacheKey)) {
            const inFlightResult = await internalAiInFlight.get(cacheKey);
            timingTracker?.mark(`${key}_shared_hit`, {
                label: `${label} (shared)`,
                category: "cache",
                detail: `Reusing in-flight result for ${String(label || "AI call").trim().toLowerCase()}.`,
                extra: {
                    cacheHit: true,
                    sharedInFlight: true,
                    ...extractAiTimingMeta(inFlightResult),
                },
            });
            return cloneJsonLikeValue(inFlightResult);
        }
    }

    if (!timingTracker) {
        const directResult = await run();
        if (cacheKey && directResult?.success) {
            setCachedInternalAiResult(cacheKey, directResult);
        }
        return directResult;
    }

    const executeMeasured = () => timingTracker.measure(
        key,
        run,
        {
            label,
            category: "ai",
            detail,
            extractMeta: extractAiTimingMeta,
        },
    );

    if (!cacheKey) {
        return executeMeasured();
    }

    const taskPromise = (async () => {
        const response = await executeMeasured();
        if (response?.success) {
            setCachedInternalAiResult(cacheKey, response);
        }
        return response;
    })();

    internalAiInFlight.set(cacheKey, taskPromise);

    try {
        return await taskPromise;
    } finally {
        internalAiInFlight.delete(cacheKey);
    }
};

const SERVICE_CONTEXT_CACHE_TTL_MS = 10 * 60 * 1000;
const INTERNAL_AI_CACHE_TTL_MS = 5 * 60 * 1000;
const INTERNAL_AI_CACHE_MAX_ENTRIES = 400;
const SERVICE_QUESTIONS_INCLUDE = Object.freeze({
    questions: {
        orderBy: { order: "asc" }
    }
});
const buildGuestSessionCoreSelect = () => ({
    id: true,
    serviceId: true,
    currentStep: true,
    answers: true,
    messages: {
        orderBy: { createdAt: "asc" },
        select: {
            role: true,
            content: true,
            createdAt: true,
        }
    }
});
const serviceContextCache = new Map();
const serviceContextInFlight = new Map();
const internalAiResultCache = new Map();
const internalAiInFlight = new Map();

const cloneJsonLikeValue = (value) => {
    if (value === null || value === undefined) return value;
    if (typeof structuredClone === "function") {
        try {
            return structuredClone(value);
        } catch {
            // Fall through to a best-effort JSON clone.
        }
    }

    try {
        return JSON.parse(JSON.stringify(value));
    } catch {
        return value;
    }
};

const INTERNAL_AI_CACHEABLE_TASKS = new Set([
    "system_extractor",
    "system_validator",
    "system_runtime_options",
    "system_evaluator",
    "system_question_writer",
]);

const buildInternalAiCacheKey = ({
    selectedServiceName = "",
    messages = [],
    conversationHistory = [],
}) => JSON.stringify({
    selectedServiceName: String(selectedServiceName || "").trim(),
    messages: Array.isArray(messages) ? messages : [],
    conversationHistory: Array.isArray(conversationHistory) ? conversationHistory : [],
});

const pruneInternalAiCache = () => {
    const now = Date.now();

    for (const [cacheKey, entry] of internalAiResultCache.entries()) {
        if (!entry || entry.expiresAt <= now) {
            internalAiResultCache.delete(cacheKey);
        }
    }

    if (internalAiResultCache.size <= INTERNAL_AI_CACHE_MAX_ENTRIES) {
        return;
    }

    const entriesByCreatedAt = Array.from(internalAiResultCache.entries())
        .sort(([, left], [, right]) => Number(left?.createdAt || 0) - Number(right?.createdAt || 0));

    while (internalAiResultCache.size > INTERNAL_AI_CACHE_MAX_ENTRIES && entriesByCreatedAt.length > 0) {
        const [cacheKey] = entriesByCreatedAt.shift();
        internalAiResultCache.delete(cacheKey);
    }
};

const getCachedInternalAiResult = (cacheKey = "") => {
    if (!cacheKey) return null;
    const entry = internalAiResultCache.get(cacheKey);
    if (!entry) return null;

    if (entry.expiresAt <= Date.now()) {
        internalAiResultCache.delete(cacheKey);
        return null;
    }

    return cloneJsonLikeValue(entry.value);
};

const setCachedInternalAiResult = (cacheKey = "", value = null) => {
    if (!cacheKey || !value) return;

    internalAiResultCache.set(cacheKey, {
        value: cloneJsonLikeValue(value),
        createdAt: Date.now(),
        expiresAt: Date.now() + INTERNAL_AI_CACHE_TTL_MS,
    });
    pruneInternalAiCache();
};

const cloneServiceRecord = (service = null) => {
    if (!service || typeof service !== "object") return service;

    return {
        ...service,
        questions: Array.isArray(service.questions)
            ? service.questions.map((question) => ({
                ...question,
                options: cloneJsonLikeValue(question?.options),
                logic: cloneJsonLikeValue(question?.logic),
            }))
            : [],
    };
};

const buildServiceContextCacheKey = ({
    identifier = "",
    lookup = "slug_or_id",
    activeOnly = false,
}) =>
    `${activeOnly ? "active" : "any"}:${lookup}:${String(identifier || "").trim().toLowerCase()}`;

const getCachedServiceRecord = (cacheKey = "") => {
    const entry = serviceContextCache.get(cacheKey);
    if (!entry) return null;

    if (entry.expiresAt <= Date.now()) {
        serviceContextCache.delete(cacheKey);
        return null;
    }

    return cloneServiceRecord(entry.value);
};

const setCachedServiceRecord = (service = null, { activeOnly = false } = {}) => {
    if (!service?.id || !service?.slug) return;

    const cachedValue = cloneServiceRecord(service);
    const expiresAt = Date.now() + SERVICE_CONTEXT_CACHE_TTL_MS;
    const identifiers = [service.id, service.slug]
        .map((value) => String(value || "").trim())
        .filter(Boolean);

    identifiers.forEach((identifier) => {
        serviceContextCache.set(
            buildServiceContextCacheKey({
                identifier,
                lookup: "slug_or_id",
                activeOnly,
            }),
            { value: cachedValue, expiresAt }
        );
    });

    serviceContextCache.set(
        buildServiceContextCacheKey({
            identifier: service.slug,
            lookup: "slug",
            activeOnly,
        }),
        { value: cachedValue, expiresAt }
    );
};

const getServiceWithOrderedQuestions = async ({
    identifier = "",
    lookup = "slug_or_id",
    activeOnly = false,
} = {}) => {
    const normalizedIdentifier = String(identifier || "").trim();
    if (!normalizedIdentifier) return null;

    const cacheKey = buildServiceContextCacheKey({
        identifier: normalizedIdentifier,
        lookup,
        activeOnly,
    });
    const cached = getCachedServiceRecord(cacheKey);
    if (cached) return cached;

    const inFlight = serviceContextInFlight.get(cacheKey);
    if (inFlight) {
        const sharedResult = await inFlight;
        return cloneServiceRecord(sharedResult);
    }

    const loadPromise = (async () => {
        const whereClause =
            lookup === "slug"
                ? {
                    slug: normalizedIdentifier,
                    ...(activeOnly ? { active: true } : {}),
                }
                : {
                    OR: [
                        { slug: normalizedIdentifier },
                        { id: normalizedIdentifier }
                    ],
                    ...(activeOnly ? { active: true } : {}),
                };

        const service = await prisma.service.findFirst({
            where: whereClause,
            include: SERVICE_QUESTIONS_INCLUDE,
        });

        if (service) {
            setCachedServiceRecord(service, { activeOnly: false });
            if (service.active) {
                setCachedServiceRecord(service, { activeOnly: true });
            }
        }

        return service ? cloneServiceRecord(service) : null;
    })();

    serviceContextInFlight.set(cacheKey, loadPromise);

    try {
        return await loadPromise;
    } finally {
        serviceContextInFlight.delete(cacheKey);
    }
};

const safeDecodeURIComponent = (value = "") => {
    try {
        return decodeURIComponent(value);
    } catch {
        return String(value || "");
    }
};

const countLikelyMojibakeArtifacts = (value = "") =>
    (String(value || "").match(/Ã.|â.|Â|�/g) || []).length;

const normalizeAttachmentDisplayText = (value = "") => {
    const source = String(value || "").trim();
    if (!source) return "";

    const candidates = [source];
    if (countLikelyMojibakeArtifacts(source) > 0) {
        try {
            const repaired = Buffer.from(source, "latin1").toString("utf8").trim();
            if (repaired) {
                candidates.push(repaired);
            }
        } catch {
            // Keep the original string if repair fails.
        }
    }

    return candidates
        .map((text) => ({
            text,
            artifactCount: countLikelyMojibakeArtifacts(text),
            length: text.length
        }))
        .sort((a, b) => a.artifactCount - b.artifactCount || b.length - a.length)[0]?.text || source;
};

const parseJsonObjectFromRaw = (raw = "") => {
    const source = String(raw || "").trim();
    if (!source) return null;

    const firstBrace = source.indexOf("{");
    const lastBrace = source.lastIndexOf("}");
    const extracted = firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace
        ? source.slice(firstBrace, lastBrace + 1)
        : source;

    const candidates = [
        extracted,
        extracted.replace(/\*\*/g, ""),
        extracted.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim(),
    ];

    for (const candidate of candidates) {
        if (!candidate.startsWith("{") || !candidate.endsWith("}")) continue;
        try {
            const parsed = JSON.parse(candidate);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                return parsed;
            }
        } catch {
            // Try next normalization candidate.
        }
    }

    return null;
};

const trimLikelyUrlTrailingPunctuation = (value = "") => {
    const attempts = [];
    let current = String(value || "").trim();
    if (!current) return attempts;
    attempts.push(current);
    while (/[),.;!?]$/.test(current)) {
        current = current.slice(0, -1).trim();
        if (!current) break;
        attempts.push(current);
    }
    return attempts;
};

const isPrivateIpv4Hostname = (hostname = "") =>
    /^(10|127)\.\d{1,3}\.\d{1,3}\.\d{1,3}$/i.test(hostname)
    || /^192\.168\.\d{1,3}\.\d{1,3}$/i.test(hostname)
    || /^169\.254\.\d{1,3}\.\d{1,3}$/i.test(hostname)
    || /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/i.test(hostname);

const isBlockedSharedUrlHost = (hostname = "") => {
    const normalizedHostname = String(hostname || "").trim().toLowerCase();
    if (!normalizedHostname) return true;
    if (env.NODE_ENV !== "production") return false;
    return normalizedHostname === "localhost"
        || normalizedHostname === "0.0.0.0"
        || normalizedHostname === "::1"
        || normalizedHostname.endsWith(".local")
        || isPrivateIpv4Hostname(normalizedHostname);
};

const normalizeSharedUrl = (value = "") => {
    const attempts = trimLikelyUrlTrailingPunctuation(value);
    for (const source of attempts) {
        const withProtocol = /^https?:\/\//i.test(source) ? source : `https://${source}`;

        try {
            const parsed = new URL(withProtocol);
            if (!["http:", "https:"].includes(parsed.protocol)) continue;
            if (isBlockedSharedUrlHost(parsed.hostname)) continue;
            return parsed.toString();
        } catch {
            // Try the next normalized candidate.
        }
    }
    return "";
};

const buildSharedUrlLabel = (value = "") => {
    try {
        const parsed = new URL(value);
        const hostname = parsed.hostname.replace(/^www\./i, "");
        const path = parsed.pathname && parsed.pathname !== "/"
            ? parsed.pathname.replace(/\/$/, "")
            : "";
        return `${hostname}${path}` || hostname || value;
    } catch {
        return String(value || "").trim() || "Shared URL";
    }
};

const parseUrlToken = (line = "") => {
    const match = String(line || "").trim().match(URL_TOKEN_REGEX);
    if (!match) return null;

    const normalizedUrl = normalizeSharedUrl(safeDecodeURIComponent(match[1] || ""));
    if (!normalizedUrl) return null;

    const providedLabel = normalizeAttachmentDisplayText(safeDecodeURIComponent(match[2] || ""));
    return {
        url: normalizedUrl,
        label: providedLabel || buildSharedUrlLabel(normalizedUrl),
    };
};

const dedupeSharedUrls = (entries = []) => {
    const seen = new Set();
    const rows = [];

    for (const entry of Array.isArray(entries) ? entries : []) {
        const normalizedUrl = normalizeSharedUrl(entry?.url || "");
        if (!normalizedUrl || seen.has(normalizedUrl)) continue;
        seen.add(normalizedUrl);
        rows.push({
            url: normalizedUrl,
            label: normalizeAttachmentDisplayText(entry?.label || "") || buildSharedUrlLabel(normalizedUrl),
        });
    }

    return rows;
};

const extractUrlsFromPlainText = (messageText = "") => {
    const extracted = [];
    const strippedText = String(messageText || "")
        .replace(/\r/g, "")
        .split("\n")
        .map((line) => line.replace(URL_CANDIDATE_REGEX, (match) => {
            const normalizedUrl = normalizeSharedUrl(match);
            if (!normalizedUrl) return match;
            extracted.push({
                url: normalizedUrl,
                label: buildSharedUrlLabel(normalizedUrl),
            });
            return " ";
        }))
        .map((line) => line.replace(/\s{2,}/g, " ").trim())
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

    return {
        plainText: strippedText,
        urls: dedupeSharedUrls(extracted),
    };
};

const parseAttachmentTokensFromMessage = (messageText = "") => {
    const lines = String(messageText || "").replace(/\r/g, "").split("\n");
    const attachments = [];
    const urls = [];
    const plainLines = [];

    for (const rawLine of lines) {
        const line = String(rawLine || "").trim();
        const match = line.match(ATTACHMENT_TOKEN_REGEX);
        if (!match) {
            const parsedUrl = parseUrlToken(line);
            if (parsedUrl) {
                urls.push(parsedUrl);
                continue;
            }
            plainLines.push(rawLine);
            continue;
        }

        const name = normalizeAttachmentDisplayText(safeDecodeURIComponent(match[1] || "")) || "Attachment";
        const url = safeDecodeURIComponent(match[2] || "");
        const type = safeDecodeURIComponent(match[3] || "");
        const size = Number.parseInt(match[4] || "0", 10);

        if (!url) continue;
        attachments.push({
            name,
            url,
            type,
            size: Number.isFinite(size) ? size : 0,
        });
    }

    const extractedUrls = extractUrlsFromPlainText(plainLines.join("\n"));

    return {
        plainText: extractedUrls.plainText,
        attachments,
        urls: dedupeSharedUrls([...urls, ...extractedUrls.urls]),
    };
};

const getMostRecentAttachmentsFromMessages = (messages = []) => {
    if (!Array.isArray(messages) || messages.length === 0) return [];

    for (let idx = messages.length - 1; idx >= 0; idx -= 1) {
        const message = messages[idx];
        if (String(message?.role || "").toLowerCase() !== "user") continue;
        const parsed = parseAttachmentTokensFromMessage(String(message?.content || ""));
        if (parsed.attachments.length > 0) {
            return parsed.attachments;
        }
    }

    return [];
};

const getMostRecentUrlsFromMessages = (messages = []) => {
    if (!Array.isArray(messages) || messages.length === 0) return [];

    for (let idx = messages.length - 1; idx >= 0; idx -= 1) {
        const message = messages[idx];
        if (String(message?.role || "").toLowerCase() !== "user") continue;
        const parsed = parseAttachmentTokensFromMessage(String(message?.content || ""));
        if (parsed.urls.length > 0) {
            return parsed.urls;
        }
    }

    return [];
};

const toChronologicalGuestHistory = (messages = []) =>
    [...(Array.isArray(messages) ? messages : [])]
        .filter(Boolean)
        .sort((a, b) => {
            const aTime = new Date(a?.createdAt || 0).getTime();
            const bTime = new Date(b?.createdAt || 0).getTime();

            if (Number.isFinite(aTime) && Number.isFinite(bTime) && aTime !== bTime) {
                return aTime - bTime;
            }

            return 0;
        })
        .map((message) => ({
            role: message.role,
            content: message.content,
        }));

const clipAttachmentText = (text = "", limit = MAX_SINGLE_ATTACHMENT_TEXT_CHARS) =>
    String(text || "")
        .split("\0")
        .join(" ")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
        .slice(0, Math.max(0, limit));

const decodeBasicHtmlEntities = (value = "") =>
    String(value || "")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">");

const extractMetaContentFromHtml = (html = "", key = "") => {
    const escapedKey = String(key || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!escapedKey) return "";
    const regex = new RegExp(
        `<meta[^>]+(?:property|name)=["']${escapedKey}["'][^>]+content=["']([^"']+)["']|` +
        `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escapedKey}["']`,
        "i"
    );
    const match = String(html || "").match(regex);
    return decodeBasicHtmlEntities(match ? String(match[1] || match[2] || "").trim() : "");
};

const extractHeadingFromHtml = (html = "", tag = "h1") => {
    const match = String(html || "").match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
    if (!match) return "";
    return clipAttachmentText(
        decodeBasicHtmlEntities(
            String(match[1] || "")
                .replace(/<[^>]+>/g, " ")
                .replace(/\s+/g, " ")
                .trim()
        ),
        220
    );
};

const extractReadableTextFromHtml = (html = "") =>
    clipAttachmentText(
        decodeBasicHtmlEntities(
            String(html || "")
                .replace(/<script[\s\S]*?<\/script>/gi, " ")
                .replace(/<style[\s\S]*?<\/style>/gi, " ")
                .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
                .replace(/<!--[\s\S]*?-->/g, " ")
                .replace(/<br\s*\/?>/gi, "\n")
                .replace(/<\/(p|div|section|article|main|header|footer|li|h1|h2|h3)>/gi, "\n")
                .replace(/<[^>]+>/g, " ")
                .replace(/[ \t]+\n/g, "\n")
                .replace(/\n{3,}/g, "\n\n")
                .replace(/[ \t]{2,}/g, " ")
                .trim()
        ),
        1600
    );

const extractUrlContext = async ({ urlEntry = {}, index = 0 }) => {
    const normalizedUrl = normalizeSharedUrl(urlEntry?.url || "");
    const descriptorLabel = normalizeAttachmentDisplayText(urlEntry?.label || "") || buildSharedUrlLabel(normalizedUrl || urlEntry?.url || "");
    const descriptor = `[Shared URL ${index + 1}] ${descriptorLabel}`;

    if (!normalizedUrl) {
        return {
            descriptor,
            extractedContext: "URL shared, but it is not a supported public HTTP/HTTPS link.",
            summary: `I received the URL for ${descriptorLabel}, but I could not open it as a public website.`,
        };
    }

    try {
        const response = await fetch(normalizedUrl, {
            headers: {
                "User-Agent": METADATA_USER_AGENT,
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5",
            },
            signal: AbortSignal.timeout(15000),
        });

        const contentType = String(response.headers.get("content-type") || "").toLowerCase();
        const body = await response.text().catch(() => "");

        if (!body.trim()) {
            return {
                descriptor,
                extractedContext: "URL shared, but the page returned no readable content.",
                summary: `I opened ${descriptorLabel}, but it did not return readable content.`,
            };
        }

        const title = extractMetaContentFromHtml(body, "og:title")
            || extractMetaContentFromHtml(body, "twitter:title")
            || decodeBasicHtmlEntities((body.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "").trim());
        const description = extractMetaContentFromHtml(body, "og:description")
            || extractMetaContentFromHtml(body, "twitter:description")
            || extractMetaContentFromHtml(body, "description");
        const heading = extractHeadingFromHtml(body, "h1");
        const visibleText = extractReadableTextFromHtml(body);

        const extractedContext = [
            `URL: ${normalizedUrl}`,
            title ? `Page title: ${title}` : "",
            description ? `Meta description: ${description}` : "",
            heading ? `Main heading: ${heading}` : "",
            visibleText ? `Visible text excerpt:\n${visibleText}` : "",
            !/html|text\//i.test(contentType) ? `Detected content type: ${contentType || "unknown"}` : "",
        ]
            .filter(Boolean)
            .join("\n");

        const summaryText = description || heading || visibleText || title;

        return {
            descriptor,
            extractedContext: extractedContext || "URL shared, but only minimal metadata was available.",
            summary: summaryText
                ? `I checked ${descriptorLabel}. ${clipAttachmentText(summaryText, 220)}`
                : `I checked ${descriptorLabel}, but the site exposed only limited metadata.`,
        };
    } catch (error) {
        return {
            descriptor,
            extractedContext: `URL shared, but the page could not be read automatically. Reason: ${error?.message || "Unknown error"}`,
            summary: `I received ${descriptorLabel}, but I could not read the page automatically yet.`,
        };
    }
};

const buildUrlContextBlock = async ({ urls = [] }) => {
    if (!Array.isArray(urls) || urls.length === 0) {
        return { contextText: "", insightNote: "" };
    }

    const limitedUrls = urls.slice(0, MAX_URL_ANALYSIS_COUNT);
    const insights = [];
    for (let index = 0; index < limitedUrls.length; index += 1) {
        insights.push(await extractUrlContext({ urlEntry: limitedUrls[index], index }));
    }

    return {
        contextText: clipAttachmentText(
            insights
                .map((insight) => `${insight.descriptor}\n${insight.extractedContext}`.trim())
                .join("\n\n"),
            MAX_URL_CONTEXT_CHARS
        ),
        insightNote: insights
            .map((insight) => String(insight?.summary || "").trim())
            .filter(Boolean)
            .slice(0, 1)
            .join(" "),
    };
};

const isImageAttachment = (attachment = {}) =>
    String(attachment?.type || "").startsWith("image/")
    || IMAGE_FILE_REGEX.test(String(attachment?.name || ""))
    || IMAGE_FILE_REGEX.test(String(attachment?.url || ""));

const isPdfAttachment = (attachment = {}) =>
    String(attachment?.type || "").toLowerCase() === "application/pdf"
    || PDF_FILE_REGEX.test(String(attachment?.name || ""))
    || PDF_FILE_REGEX.test(String(attachment?.url || ""));

const isDocxAttachment = (attachment = {}) =>
    String(attachment?.type || "").toLowerCase() === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    || DOCX_FILE_REGEX.test(String(attachment?.name || ""))
    || DOCX_FILE_REGEX.test(String(attachment?.url || ""));

const isTextAttachment = (attachment = {}) =>
    String(attachment?.type || "").toLowerCase() === "text/plain"
    || TEXT_FILE_REGEX.test(String(attachment?.name || ""))
    || TEXT_FILE_REGEX.test(String(attachment?.url || ""));

const loadPdfJs = async () => {
    if (!pdfJsModulePromise) {
        pdfJsModulePromise = import("pdfjs-dist/legacy/build/pdf.mjs");
    }
    return pdfJsModulePromise;
};

const loadMammoth = async () => {
    if (!mammothModulePromise) {
        mammothModulePromise = import("mammoth");
    }
    return mammothModulePromise;
};

const fetchAttachmentResponse = async (url) => {
    const response = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch attachment (${response.status})`);
    }
    return response;
};

const extractPdfContextFromBuffer = async (buffer) => {
    const pdfJs = await loadPdfJs();
    const loadingTask = pdfJs.getDocument({ data: new Uint8Array(buffer) });
    const pdf = await loadingTask.promise;
    let extracted = "";
    const metadata = await pdf.getMetadata().catch(() => null);
    const info = metadata?.info || {};
    const metadataMap = metadata?.metadata;
    const title = normalizeAttachmentDisplayText(
        metadataMap?.get?.("dc:title")
        || metadataMap?.get?.("pdf:Title")
        || info.Title
        || ""
    );
    const subject = normalizeAttachmentDisplayText(info.Subject || "");
    const keywords = normalizeAttachmentDisplayText(info.Keywords || "");

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = (textContent.items || [])
            .map((item) => String(item?.str || "").trim())
            .filter(Boolean)
            .join(" ");

        if (!pageText) continue;
        extracted = `${extracted}\n${pageText}`.trim();
        if (extracted.length >= MAX_SINGLE_ATTACHMENT_TEXT_CHARS) break;
    }

    const contextParts = [];
    if (title) contextParts.push(`Document title: ${title}`);
    if (subject) contextParts.push(`Document subject: ${subject}`);
    if (keywords) contextParts.push(`Document keywords: ${keywords}`);
    if (pdf.numPages) contextParts.push(`Page count: ${pdf.numPages}`);
    if (extracted) contextParts.push(`Extracted text:\n${extracted}`);

    return clipAttachmentText(contextParts.join("\n"));
};

const extractDocxTextFromBuffer = async (buffer) => {
    const mammothModule = await loadMammoth();
    const result = await mammothModule.extractRawText({ buffer });
    return clipAttachmentText(result?.value || "");
};

const analyzeImageAttachmentWithVision = async ({ url = "", name = "", type = "" }) => {
    const apiKey = env.OPENROUTER_API_KEY?.trim();
    if (!apiKey || !url) return "";

    const model = env.OPENROUTER_MODEL || "openai/gpt-4o";
    const referer = env.FRONTEND_URL || env.CORS_ORIGIN || "http://localhost:5173";
    const prompt = [
        "Analyze this uploaded image for project-requirement discovery.",
        `File name: ${name || "image"}`,
        'Return strict JSON: {"summary":"", "visibleText":"", "possibleBrandName":"", "designCues":[]}.',
        "Keep it concise and practical.",
    ].join(" ");

    try {
        const attachmentResponse = await fetchAttachmentResponse(url);
        const imageMimeTypeFromResponse = String(attachmentResponse.headers.get("content-type") || "")
            .split(";")[0]
            .trim()
            .toLowerCase();
        const imageMimeType = imageMimeTypeFromResponse || String(type || "image/png").toLowerCase();
        const imageBuffer = Buffer.from(await attachmentResponse.arrayBuffer());

        if (imageBuffer.length === 0) return "";
        if (imageBuffer.length > MAX_VISION_IMAGE_BYTES) {
            console.warn(
                `[Attachment Vision] Skipped "${name}" because image is larger than ${MAX_VISION_IMAGE_BYTES} bytes.`
            );
            return "";
        }

        // OpenRouter cannot fetch localhost URLs from its cloud infra.
        // Send the image as a data URL payload instead.
        const imageDataUrl = `data:${imageMimeType};base64,${imageBuffer.toString("base64")}`;

        const response = await fetch(OPENROUTER_API_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": referer,
                "X-Title": "Catalance Guest Attachment Analyzer",
            },
            body: JSON.stringify({
                model,
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            { type: "image_url", image_url: { url: imageDataUrl } },
                        ],
                    },
                ],
                temperature: 0.2,
                max_tokens: 260,
            }),
            signal: AbortSignal.timeout(25000),
        });

        const data = await response.json().catch(() => null);
        if (!response.ok) {
            console.warn(
                `[Attachment Vision] OpenRouter vision failed (${response.status}): ${data?.error?.message || data?.message || "Unknown error"}`
            );
            return "";
        }

        const rawContentValue = data?.choices?.[0]?.message?.content;
        const rawContent = typeof rawContentValue === "string"
            ? rawContentValue
            : Array.isArray(rawContentValue)
                ? rawContentValue.map((part) => part?.text || "").join("\n").trim()
                : "";
        const parsed = parseJsonObjectFromRaw(rawContent);
        if (parsed) {
            const summary = clipAttachmentText(parsed.summary || "", 500);
            const visibleText = clipAttachmentText(parsed.visibleText || "", 220);
            const possibleBrandName = clipAttachmentText(parsed.possibleBrandName || "", 120);
            const designCues = Array.isArray(parsed.designCues)
                ? parsed.designCues.map((cue) => clipAttachmentText(cue || "", 60)).filter(Boolean).slice(0, 6)
                : [];

            return [
                summary ? `Summary: ${summary}` : "",
                visibleText ? `Visible text: ${visibleText}` : "",
                possibleBrandName ? `Possible brand/company name: ${possibleBrandName}` : "",
                designCues.length > 0 ? `Design cues: ${designCues.join(", ")}` : "",
            ]
                .filter(Boolean)
                .join("\n");
        }

        return clipAttachmentText(rawContent, 600);
    } catch {
        return "";
    }
};

const extractAttachmentContext = async ({ attachment = {}, index = 0 }) => {
    const name = normalizeAttachmentDisplayText(
        String(attachment.name || `Attachment ${index + 1}`).trim()
    );
    const type = String(attachment.type || "").trim();
    const descriptor = `[Attachment ${index + 1}] ${name}${type ? ` (${type})` : ""}`;

    try {
        if (isImageAttachment(attachment)) {
            const visionSummary = await analyzeImageAttachmentWithVision({
                url: attachment.url,
                name,
                type,
            });

            return {
                descriptor,
                extractedContext: visionSummary
                    ? `Image analysis:\n${visionSummary}`
                    : "Image uploaded. Could not extract image details automatically.",
            };
        }

        if (isTextAttachment(attachment)) {
            const response = await fetchAttachmentResponse(attachment.url);
            const text = clipAttachmentText(await response.text());
            if (!text) {
                return {
                    descriptor,
                    extractedContext: "Text file uploaded, but no readable text was found.",
                };
            }
            return {
                descriptor,
                extractedContext: `Extracted text:\n${text}`,
            };
        }

        if (isPdfAttachment(attachment) || isDocxAttachment(attachment)) {
            const response = await fetchAttachmentResponse(attachment.url);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            let extractedDocumentContext = "";
            if (isPdfAttachment(attachment)) {
                extractedDocumentContext = await extractPdfContextFromBuffer(buffer);
            } else {
                const text = clipAttachmentText(await extractDocxTextFromBuffer(buffer));
                extractedDocumentContext = text ? `Extracted text:\n${text}` : "";
            }

            if (!extractedDocumentContext) {
                return {
                    descriptor,
                    extractedContext: "Document uploaded, but no readable text was extracted.",
                };
            }
            return {
                descriptor,
                extractedContext: extractedDocumentContext,
            };
        }
    } catch (error) {
        console.warn(`[Attachment Analysis] Failed for "${name}":`, error?.message || error);
        return {
            descriptor,
            extractedContext: "Attachment uploaded, but extraction failed.",
        };
    }

    return {
        descriptor,
        extractedContext: "Attachment uploaded. This file type is not currently extractable.",
    };
};

const buildAttachmentContextBlock = async ({ attachments = [] }) => {
    if (!Array.isArray(attachments) || attachments.length === 0) {
        return "";
    }

    const limitedAttachments = attachments.slice(0, MAX_ATTACHMENT_ANALYSIS_COUNT);
    const contextItems = [];
    for (let idx = 0; idx < limitedAttachments.length; idx += 1) {
        const insight = await extractAttachmentContext({
            attachment: limitedAttachments[idx],
            index: idx,
        });
        if (!insight) continue;

        contextItems.push(`${insight.descriptor}\n${insight.extractedContext}`.trim());
    }

    return clipAttachmentText(contextItems.join("\n\n"), MAX_ATTACHMENT_CONTEXT_CHARS);
};

const inferAnswerFromAttachmentContext = async ({
    currentQuestionText = "",
    userMessageText = "",
    attachmentContextText = "",
    serviceName = "",
    timingTracker = null,
}) => {
    if (!attachmentContextText.trim()) return "";
    if (NAME_QUESTION_REGEX.test(currentQuestionText || "") && !String(userMessageText || "").trim()) {
        return "";
    }

    const inferPrompt = `
You are extracting a direct questionnaire answer from uploaded file context.

Service: "${serviceName}"
Current question: "${currentQuestionText}"
User direct text answer: "${userMessageText}"

Extracted attachment context:
${attachmentContextText}

Task:
1) Decide if attachment context provides a direct answer to the current question.
2) If yes, provide a short final answer text.
3) If no, return empty answer.

Rules:
- For person-name questions, do not infer a personal name from a logo/image.
- For brand/company questions, you may infer a brand name when clearly visible in file content.
- Keep answer concise and specific.

Return JSON only:
{
  "hasAnswer": boolean,
  "answer": string,
  "confidence": number
}
`;

    try {
        const response = await runTrackedAiCall({
            timingTracker,
            key: "attachment_answer_inference_ai",
            label: "Infer answer from attachment",
            detail: "Trying to answer the current question from uploaded file context.",
            messages: [{ role: "user", content: inferPrompt }],
            conversationHistory: [{ role: "system", content: "You are a JSON-only extractor. Return valid JSON only." }],
            selectedServiceName: "system_extractor",
        });
        if (!response?.success) return "";

        const parsed = parseJsonObjectFromRaw(response.message);
        if (!parsed || parsed.hasAnswer !== true) return "";

        const answer = clipAttachmentText(parsed.answer || "", 180);
        const confidence = Number(parsed.confidence || 0);
        if (!answer) return "";
        if (Number.isFinite(confidence) && confidence < 0.58) return "";

        return answer;
    } catch {
        return "";
    }
};

const buildAttachmentInsightForUser = ({
    attachments = [],
    attachmentContextText = "",
}) => {
    if (!Array.isArray(attachments) || attachments.length === 0) return "";
    const context = clipAttachmentText(attachmentContextText, 650);
    const fileNames = attachments
        .map((file) => normalizeAttachmentDisplayText(file?.name || ""))
        .filter(Boolean)
        .slice(0, 2);
    const fileLabel = fileNames.length > 0 ? fileNames.join(", ") : "your uploaded file";
    const containsPdf = attachments.some((file) => isPdfAttachment(file));

    if (!context) {
        return `I received ${fileLabel}. I will use it if I can pull out useful details from it.`;
    }

    const lines = context
        .split("\n")
        .map((line) => normalizeAttachmentDisplayText(String(line || "").trim()))
        .filter(Boolean);

    const pickByPrefix = (prefix) =>
        lines.find((line) => line.toLowerCase().startsWith(prefix.toLowerCase()));

    const cleanLineValue = (line = "", prefixRegex = /^/) =>
        normalizeAttachmentDisplayText(String(line || "").replace(prefixRegex, "").trim());

    const summaryLine = pickByPrefix("Summary:");
    const visibleTextLine = pickByPrefix("Visible text:");
    const possibleBrandLine = pickByPrefix("Possible brand/company name:");
    const designCuesLine = pickByPrefix("Design cues:");
    const extractedTextLine = pickByPrefix("Extracted text:");
    const titleLine = pickByPrefix("Document title:");
    const subjectLine = pickByPrefix("Document subject:");
    const keywordsLine = pickByPrefix("Document keywords:");
    const pageCountLine = pickByPrefix("Page count:");

    const hasUnreadableDocument = lines.some((line) =>
        /document uploaded, but no readable text was extracted\./i.test(line)
    );
    const hasUnreadableTextFile = lines.some((line) =>
        /text file uploaded, but no readable text was found\./i.test(line)
    );
    const hasImageExtractionFailure = lines.some((line) =>
        /image uploaded\. could not extract image details automatically\./i.test(line)
    );
    const hasExtractionFailure = lines.some((line) =>
        /attachment uploaded, but extraction failed\./i.test(line)
    );
    const hasUnsupportedType = lines.some((line) =>
        /attachment uploaded\. this file type is not currently extractable\./i.test(line)
    );

    if (hasUnreadableDocument) {
        return containsPdf
            ? `I received ${fileLabel}, but I could not reliably read text from it yet. It may be a scanned or image-based PDF. If you upload a text-based copy or clear screenshots of the key pages, I can use that more accurately.`
            : `I received ${fileLabel}, but I could not reliably read enough text from it to use it yet. If you upload a clearer copy, I can try again.`;
    }

    if (hasUnreadableTextFile) {
        return `I received ${fileLabel}, but it did not contain readable text that I could use yet.`;
    }

    if (hasImageExtractionFailure) {
        return `I received ${fileLabel}, but I could not clearly read the important details from it. If you upload a sharper image or a closer view of the key section, I can try again.`;
    }

    if (hasExtractionFailure) {
        return `I received ${fileLabel}, but something went wrong while reading it. Please try uploading it again.`;
    }

    if (hasUnsupportedType) {
        return `I received ${fileLabel}. I can work best with PDFs, DOCX files, text files, and images right now.`;
    }

    const title = cleanLineValue(titleLine, /^Document title:\s*/i);
    const subject = cleanLineValue(subjectLine, /^Document subject:\s*/i);
    const keywords = cleanLineValue(keywordsLine, /^Document keywords:\s*/i);
    const pageCount = cleanLineValue(pageCountLine, /^Page count:\s*/i);
    const possibleBrand = cleanLineValue(possibleBrandLine, /^Possible brand\/company name:\s*/i);
    const visibleText = cleanLineValue(visibleTextLine, /^Visible text:\s*/i);
    const summary = cleanLineValue(summaryLine, /^Summary:\s*/i);
    const designCues = cleanLineValue(designCuesLine, /^Design cues:\s*/i);
    const extractedText = clipAttachmentText(
        String(context.split(/Extracted text:\s*/i)[1] || "")
            .replace(/\s+/g, " ")
            .trim(),
        180
    );
    const hasExtractedBodyText = /Extracted text:\s*\S+/s.test(context);
    const hasReadableDocumentContent = Boolean(
        possibleBrand
        || visibleText
        || summary
        || designCues
        || subject
        || keywords
        || hasExtractedBodyText
    );

    if (!hasReadableDocumentContent && (title || pageCount)) {
        const basicSummary = [
            title,
            pageCount ? `${pageCount} pages` : ""
        ]
            .filter(Boolean)
            .join(" - ");
        return `File summary: ${basicSummary || "basic document details detected."}`;
    }

    let summaryText = summary
        || extractedText
        || visibleText
        || subject
        || keywords
        || designCues
        || title;

    if (possibleBrand && summaryText && !containsNormalizedText(summaryText, possibleBrand)) {
        summaryText = `${possibleBrand}. ${summaryText}`;
    }

    if (!summaryText && pageCount) {
        summaryText = `${pageCount} pages`;
    }

    if (!summaryText) {
        return `File summary: ${fileLabel}`;
    }

    return `File summary: ${clipAttachmentText(summaryText, 260)}`;
};

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

const buildServiceAwareOpeningMessage = (serviceName = "") => {
    const normalizedServiceName = String(serviceName || "").trim().toLowerCase();
    const scopeLabel = normalizedServiceName
        ? `your ${normalizedServiceName} requirement`
        : "your requirement";

    return `Hello! I'm CATA, here to help with ${scopeLabel}.\nI'd love to learn a little about you first.\nMay I know your name?`;
};

const hasCorrectionIntent = (text = "") => CORRECTION_INTENT_REGEX.test(String(text || ""));
const isContextSuggestionRequest = (text = "") => CONTEXT_SUGGESTION_REGEX.test(String(text || ""));

const RUNTIME_OPTIONS_STATE_KEY = "runtimeOptionsByQuestionSlug";
const ACTIVE_SERVICE_STARTED_AT_KEY = "activeServiceStartedAt";
const PROPOSAL_GENERATED_AT_KEY = "proposalGeneratedAt";
const PENDING_PROPOSAL_STATE_KEY = "pendingProposalState";
const OPTION_QUESTION_TYPES = new Set([
    "single option",
    "multi option",
    "multi select",
    "grouped multi select",
    "single select"
]);

const getAnswersUiState = (answers = {}) =>
    answers?.uiState && typeof answers.uiState === "object" && !Array.isArray(answers.uiState)
        ? answers.uiState
        : {};

const mergeAnswersUiState = (answers = {}, updates = {}) => {
    const nextAnswers =
        answers && typeof answers === "object" && !Array.isArray(answers)
            ? { ...answers }
            : {};
    const nextUiState = { ...getAnswersUiState(nextAnswers) };

    for (const [key, value] of Object.entries(updates || {})) {
        if (value === undefined || value === null || value === "") {
            delete nextUiState[key];
        } else {
            nextUiState[key] = value;
        }
    }

    if (Object.keys(nextUiState).length > 0) {
        nextAnswers.uiState = nextUiState;
    } else {
        delete nextAnswers.uiState;
    }

    return nextAnswers;
};

const getActiveServiceStartedAt = (answers = {}) => {
    const rawValue = getAnswersUiState(answers)?.[ACTIVE_SERVICE_STARTED_AT_KEY];
    const parsed = new Date(rawValue || "").getTime();
    return Number.isFinite(parsed) ? new Date(parsed).toISOString() : "";
};

const hasGeneratedProposal = (answers = {}) =>
    Boolean(getAnswersUiState(answers)?.[PROPOSAL_GENERATED_AT_KEY]);

const getPendingProposalState = (answers = {}) => {
    const pendingState = getAnswersUiState(answers)?.[PENDING_PROPOSAL_STATE_KEY];
    return pendingState && typeof pendingState === "object" && !Array.isArray(pendingState)
        ? pendingState
        : null;
};

const getServiceScopedMessages = (messages = [], activeServiceStartedAt = "") => {
    if (!Array.isArray(messages) || messages.length === 0) return [];

    const boundary = new Date(activeServiceStartedAt || "").getTime();
    if (!Number.isFinite(boundary)) return messages;

    const filtered = messages.filter((message) => {
        const createdAtTime = new Date(message?.createdAt || 0).getTime();
        return Number.isFinite(createdAtTime) && createdAtTime >= boundary;
    });

    return filtered.length > 0 ? filtered : messages;
};

const getMostRecentMessageContentByRole = (messages = [], role = "") => {
    const normalizedRole = String(role || "").trim().toLowerCase();
    if (!normalizedRole || !Array.isArray(messages) || messages.length === 0) return "";

    for (let index = messages.length - 1; index >= 0; index -= 1) {
        const message = messages[index];
        if (String(message?.role || "").trim().toLowerCase() !== normalizedRole) continue;
        const content = String(message?.content || "").trim();
        if (content) return content;
    }

    return "";
};

const buildLockedServiceReply = ({ currentServiceName = "", targetServiceName = "" }) => {
    const currentLabel = String(currentServiceName || "this service").trim() || "this service";
    const targetLabel = String(targetServiceName || "That").trim() || "That";
    return `${targetLabel} is a different service from the current ${currentLabel} service. This chat will stay on ${currentLabel}.`;
};

const BUDGET_QUESTION_HINT_REGEX = /\b(budget|investment|price|cost|spend)\b/i;

const isBudgetQuestion = (question = {}) =>
    BUDGET_QUESTION_HINT_REGEX.test(
        `${question?.slug || ""} ${question?.text || ""} ${question?.subtitle || ""}`.trim()
    );

const formatServiceBudgetAmount = (amount, currencyCode = "INR") => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return "";
    const normalizedCurrency = String(currencyCode || "INR").trim().toUpperCase() || "INR";
    const formattedValue = formatCurrencyValue(numericAmount, normalizedCurrency);
    return formattedValue ? `${normalizedCurrency} ${formattedValue}` : `${normalizedCurrency} ${numericAmount}`;
};

const extractParsedBudgetFromAnswerText = (answerText = "") => {
    const rawText = String(answerText || "").trim();
    if (!rawText) return null;

    const directParse = parseBudgetFromText(rawText);
    if (directParse?.amount && Number.isFinite(directParse.amount)) {
        return directParse;
    }

    const budgetCandidates = rawText.match(
        /(?:rs\.?|inr|usd|eur|gbp)?\s*[\d,]+(?:\.\d+)?\s*(?:lakh|lac|k|thousand)?\s*(?:rs\.?|inr|usd|eur|gbp)?/gi
    ) || [];

    for (const candidate of budgetCandidates) {
        const parsedCandidate = parseBudgetFromText(String(candidate || "").trim());
        if (parsedCandidate?.amount && Number.isFinite(parsedCandidate.amount)) {
            return parsedCandidate;
        }
    }

    return null;
};

const getBudgetMinimumValidationResult = ({
    question = {},
    service = {},
    answerText = "",
}) => {
    if (!isBudgetQuestion(question)) return null;

    const minBudget = Number(service?.minBudget || 0);
    if (!Number.isFinite(minBudget) || minBudget <= 0) return null;

    const parsedBudget = extractParsedBudgetFromAnswerText(answerText);
    if (!parsedBudget?.amount || !Number.isFinite(parsedBudget.amount)) return null;
    if (parsedBudget.amount >= minBudget) return null;

    const currency = String(service?.currency || parsedBudget.currency || "INR").trim().toUpperCase() || "INR";
    const enteredBudget = formatServiceBudgetAmount(parsedBudget.amount, currency);
    const minimumBudget = formatServiceBudgetAmount(minBudget, currency);
    const serviceLabel = String(service?.name || "this service").trim() || "this service";

    return {
        isValid: false,
        status: "invalid_answer",
        message: `The budget you shared (${enteredBudget}) is below the minimum for ${serviceLabel}. Please increase your budget to at least ${minimumBudget} and share the updated amount.`,
        normalizedAnswer: "",
    };
};

const buildSupplementalBudgetExtractions = ({
    message = "",
    questions = [],
    currentQuestion = null,
}) => {
    const rawMessage = String(message || "").trim();
    if (!rawMessage) return [];
    if (isBudgetQuestion(currentQuestion)) return [];
    if (!BUDGET_QUESTION_HINT_REGEX.test(rawMessage)) return [];

    const parsedBudget = extractParsedBudgetFromAnswerText(rawMessage);
    if (!parsedBudget?.amount || !Number.isFinite(parsedBudget.amount)) return [];

    const budgetQuestion = (Array.isArray(questions) ? questions : []).find((question) =>
        isBudgetQuestion(question)
    );
    if (!budgetQuestion?.slug) return [];

    return [{
        slug: budgetQuestion.slug,
        answer: rawMessage,
        confidence: 0.99,
    }];
};

const findExtractedBudgetMinimumViolation = ({
    extractedAnswers = [],
    questionsBySlug = new Map(),
    service = {},
}) => {
    for (const extractedAnswer of Array.isArray(extractedAnswers) ? extractedAnswers : []) {
        const slug = String(extractedAnswer?.slug || "").trim();
        if (!slug) continue;

        const question = questionsBySlug.get(slug);
        const validation = getBudgetMinimumValidationResult({
            question,
            service,
            answerText: extractedAnswer?.answer || "",
        });
        if (validation) {
            return { extractedAnswer, question, validation };
        }
    }

    return null;
};

const getPostProposalBudgetFollowupAction = ({
    userMessage = "",
    service = {},
    questions = [],
    existingAnswersBySlug = {},
    runtimeOptionsByQuestionSlug = {}
}) => {
    const budgetExtractions = buildSupplementalBudgetExtractions({
        message: userMessage,
        questions,
        currentQuestion: null
    });
    if (budgetExtractions.length === 0) return null;

    const questionsBySlug = new Map(
        (Array.isArray(questions) ? questions : [])
            .filter((question) => question?.slug)
            .map((question) => [question.slug, question])
    );
    const budgetViolation = findExtractedBudgetMinimumViolation({
        extractedAnswers: budgetExtractions,
        questionsBySlug,
        service
    });
    if (budgetViolation) {
        return {
            blockedMessage: budgetViolation.validation.message,
            proposedAnswersBySlug: null,
            reply: ""
        };
    }

    const validSlugs = new Set(
        (Array.isArray(questions) ? questions : [])
            .map((question) => question?.slug)
            .filter(Boolean)
    );
    const proposedAnswersBySlug = mergeExtractedAnswers({
        baseAnswers: existingAnswersBySlug,
        extractedAnswers: budgetExtractions,
        validSlugs,
        questionsBySlug,
        runtimeOptionsByQuestionSlug,
        service
    });
    const budgetChange = getChangedAnswerDetails(
        questions,
        existingAnswersBySlug,
        proposedAnswersBySlug
    ).find((change) => questionsBySlug.get(change?.slug) && isBudgetQuestion(questionsBySlug.get(change.slug)));
    if (!budgetChange) return null;

    const parsedBudget = extractParsedBudgetFromAnswerText(
        proposedAnswersBySlug[budgetChange.slug] || budgetChange.nextValue || ""
    );
    const formattedBudget = parsedBudget?.amount
        ? formatServiceBudgetAmount(parsedBudget.amount, service?.currency || parsedBudget.currency || "INR")
        : String(proposedAnswersBySlug[budgetChange.slug] || budgetChange.nextValue || "").trim();
    const serviceLabel = String(service?.name || "current").trim() || "current";

    return {
        blockedMessage: "",
        proposedAnswersBySlug,
        reply: `I can regenerate your ${serviceLabel} proposal with the budget updated to ${formattedBudget}.`
    };
};

const findBudgetMinimumViolationChange = ({
    changes = [],
    questions = [],
    service = {},
}) => {
    for (const change of Array.isArray(changes) ? changes : []) {
        const question = questions?.[change?.index];
        const validation = getBudgetMinimumValidationResult({
            question,
            service,
            answerText: change?.nextValue || "",
        });
        if (validation) {
            return { change, validation };
        }
    }

    return null;
};

const normalizeOptionComparableText = (value = "") =>
    String(value || "")
        .toLowerCase()
        .replace(/\*\*/g, "")
        .replace(/[`_]/g, " ")
        .replace(/[\u2013\u2014]/g, "-")
        .replace(/\s*-\s*/g, "-")
        .replace(/[^a-z0-9\s+-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const normalizeTextToken = (value = "") =>
    String(value || "")
        .toLowerCase()
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const uniqueTextValues = (values = []) =>
    Array.from(
        new Set(
            (Array.isArray(values) ? values : [])
                .map((value) => String(value || "").trim())
                .filter(Boolean)
        )
    );

const splitAdminDirectiveList = (value = "") => {
    const source = String(value || "").trim();
    if (!source) return [];
    const splitter = source.includes("|")
        ? /\s*\|\s*/g
        : /\s*(?:;|,)\s*/g;
    return uniqueTextValues(source.split(splitter));
};

const dedupeAdminOptionMappings = (mappings = []) => {
    const seen = new Set();
    const deduped = [];

    for (const entry of Array.isArray(mappings) ? mappings : []) {
        const source = String(entry?.source || "").trim();
        const target = String(entry?.target || "").trim();
        if (!source || !target) continue;

        const key = `${normalizeTextToken(source)}=>${normalizeTextToken(target)}`;
        if (!key || seen.has(key)) continue;
        seen.add(key);
        deduped.push({ source, target });
    }

    return deduped;
};

const parseAdminOptionMappings = (value = "") => {
    const source = String(value || "").trim();
    if (!source) return [];

    const rawEntries = (source.includes("|") ? source.split("|") : source.split(";"))
        .map((entry) => String(entry || "").trim())
        .filter(Boolean);

    return dedupeAdminOptionMappings(
        rawEntries.map((entry) => {
            const match = entry.match(/^(.+?)(?:=>|->)(.+)$/);
            if (!match) return null;
            return {
                source: String(match[1] || "").trim(),
                target: String(match[2] || "").trim(),
            };
        }).filter(Boolean)
    );
};

const parseAdminControlText = (value = "") => {
    const lines = String(value || "").replace(/\r/g, "").split("\n");
    const contextLines = [];
    const prioritizeOptions = [];
    const responseRules = [];
    const validationRules = [];
    const optionMappings = [];
    let recommendedOption = "";

    for (const rawLine of lines) {
        const line = String(rawLine || "").trim();
        if (!line) continue;

        const match = line.match(/^@?([a-z][a-z0-9_ -]{1,40})\s*:\s*(.+)$/i);
        if (!match) {
            contextLines.push(line);
            continue;
        }

        const key = normalizeTextToken(match[1]).replace(/\s+/g, "_");
        const directiveValue = String(match[2] || "").trim();
        if (!directiveValue) continue;

        if ([
            "prioritize",
            "priority",
            "prioritize_options",
            "priority_options",
            "options_priority",
        ].includes(key)) {
            prioritizeOptions.push(...splitAdminDirectiveList(directiveValue));
            continue;
        }

        if ([
            "recommend",
            "recommended",
            "recommend_option",
            "recommended_option",
            "preferred_option",
            "prefer",
        ].includes(key)) {
            recommendedOption = splitAdminDirectiveList(directiveValue)[0] || directiveValue;
            continue;
        }

        if ([
            "reply",
            "response",
            "reply_rule",
            "response_rule",
            "tone",
            "assistant",
        ].includes(key)) {
            responseRules.push(directiveValue);
            continue;
        }

        if ([
            "validate",
            "validation",
            "input",
            "user_input",
            "accept",
            "acceptance",
        ].includes(key)) {
            validationRules.push(directiveValue);
            continue;
        }

        if ([
            "map",
            "alias",
            "aliases",
            "option_map",
            "accept_map",
        ].includes(key)) {
            optionMappings.push(...parseAdminOptionMappings(directiveValue));
            continue;
        }

        contextLines.push(line);
    }

    return {
        rawText: String(value || "").trim(),
        contextText: contextLines.join("\n").trim(),
        prioritizeOptions: uniqueTextValues(prioritizeOptions),
        recommendedOption: String(recommendedOption || "").trim(),
        responseRules: uniqueTextValues(responseRules),
        validationRules: uniqueTextValues(validationRules),
        optionMappings: dedupeAdminOptionMappings(optionMappings),
    };
};

const mergeAdminControls = (...controlSets) => {
    const controls = (Array.isArray(controlSets) ? controlSets : [])
        .filter((entry) => entry && typeof entry === "object");

    const contextLines = controls
        .flatMap((entry) => String(entry?.contextText || "").replace(/\r/g, "").split("\n"))
        .map((line) => String(line || "").trim())
        .filter(Boolean);

    return {
        rawText: uniqueTextValues(controls.map((entry) => entry?.rawText || "")).join("\n"),
        contextText: uniqueTextValues(contextLines).join("\n"),
        prioritizeOptions: uniqueTextValues(
            controls.flatMap((entry) => Array.isArray(entry?.prioritizeOptions) ? entry.prioritizeOptions : [])
        ),
        recommendedOption: controls
            .map((entry) => String(entry?.recommendedOption || "").trim())
            .find(Boolean) || "",
        responseRules: uniqueTextValues(
            controls.flatMap((entry) => Array.isArray(entry?.responseRules) ? entry.responseRules : [])
        ),
        validationRules: uniqueTextValues(
            controls.flatMap((entry) => Array.isArray(entry?.validationRules) ? entry.validationRules : [])
        ),
        optionMappings: dedupeAdminOptionMappings(
            controls.flatMap((entry) => Array.isArray(entry?.optionMappings) ? entry.optionMappings : [])
        ),
    };
};

const getQuestionAdminControls = (question = {}, servicePrompt = "") =>
    mergeAdminControls(
        parseAdminControlText(question?.subtitle || ""),
        parseAdminControlText(servicePrompt || "")
    );

const buildAdminControlSummaryText = (controls = {}) => {
    const parts = [];
    const contextText = String(controls?.contextText || "").replace(/\s+/g, " ").trim();
    if (contextText) parts.push(contextText);
    if (Array.isArray(controls?.prioritizeOptions) && controls.prioritizeOptions.length > 0) {
        parts.push(`prioritize ${controls.prioritizeOptions.join(", ")}`);
    }
    if (controls?.recommendedOption) {
        parts.push(`prefer ${controls.recommendedOption}`);
    }
    if (Array.isArray(controls?.validationRules) && controls.validationRules.length > 0) {
        parts.push(...controls.validationRules);
    }
    if (Array.isArray(controls?.optionMappings) && controls.optionMappings.length > 0) {
        parts.push(
            `map ${controls.optionMappings.map((entry) => `${entry.source} -> ${entry.target}`).join(", ")}`
        );
    }
    if (Array.isArray(controls?.responseRules) && controls.responseRules.length > 0) {
        parts.push(...controls.responseRules);
    }
    return parts.join(" | ").trim();
};

const buildAdminPromptSection = (
    controls = {},
    title = "Admin Controls",
    {
        maxResponseRules = 4,
        maxValidationRules = 4,
        maxMappings = 4,
        contextLimit = 220,
    } = {},
) => {
    const rows = [];
    const contextText = clipContextSnippet(String(controls?.contextText || "").trim(), contextLimit);
    if (contextText) {
        rows.push(`- Context: ${contextText.replace(/\n+/g, " | ")}`);
    }
    if (Array.isArray(controls?.prioritizeOptions) && controls.prioritizeOptions.length > 0) {
        rows.push(`- Prioritize options in this order when they fit: ${controls.prioritizeOptions.join(" | ")}`);
    }
    if (controls?.recommendedOption) {
        rows.push(`- Preferred option when making a recommendation: ${controls.recommendedOption}`);
    }
    if (Array.isArray(controls?.responseRules) && controls.responseRules.length > 0) {
        for (const rule of controls.responseRules.slice(0, maxResponseRules)) {
            rows.push(`- Response rule: ${rule}`);
        }
    }
    if (Array.isArray(controls?.validationRules) && controls.validationRules.length > 0) {
        for (const rule of controls.validationRules.slice(0, maxValidationRules)) {
            rows.push(`- Validation rule: ${rule}`);
        }
    }
    if (Array.isArray(controls?.optionMappings) && controls.optionMappings.length > 0) {
        for (const mapping of controls.optionMappings.slice(0, maxMappings)) {
            rows.push(`- Option mapping alias: "${mapping.source}" => "${mapping.target}"`);
        }
    }

    return `${title}:\n${rows.length > 0 ? rows.join("\n") : "- None"}`;
};

const normalizeOptionObject = (option = {}, { fallbackLabel = "", fallbackValue = "" } = {}) => {
    const rawLabel = typeof option === "string"
        ? option
        : (option?.label || option?.displayLabel || option?.text || option?.canonicalLabel || option?.value || fallbackLabel || "");
    const rawValue = typeof option === "string"
        ? option
        : (option?.value || option?.canonicalValue || option?.label || option?.displayLabel || fallbackValue || rawLabel || "");
    const label = String(rawLabel || "").trim();
    const value = String(rawValue || "").trim();
    if (!label && !value) return null;

    const canonicalValue = String(option?.canonicalValue || value || label).trim();
    const canonicalLabel = String(option?.canonicalLabel || label || value).trim();
    const aliases = uniqueTextValues([
        label,
        value,
        canonicalLabel,
        canonicalValue,
        ...(Array.isArray(option?.aliases) ? option.aliases : [])
    ]);

    return {
        label: label || canonicalLabel || canonicalValue,
        value: canonicalValue || value || label,
        canonicalLabel: canonicalLabel || label || value,
        canonicalValue: canonicalValue || value || label,
        aliases,
        requiresFollowup: Boolean(option?.requiresFollowup),
    };
};

const getAdminComparableTokensForOption = (option = {}) =>
    uniqueTextValues([
        option?.label,
        option?.value,
        option?.canonicalLabel,
        option?.canonicalValue,
        ...(Array.isArray(option?.aliases) ? option.aliases : []),
    ])
        .map((entry) => normalizeTextToken(entry))
        .filter(Boolean);

const optionMatchesAdminTokenExactly = (option = {}, token = "") => {
    const normalizedToken = normalizeTextToken(token);
    if (!normalizedToken) return false;
    return getAdminComparableTokensForOption(option).some((alias) => alias === normalizedToken);
};

const findOptionIndexByAdminToken = (options = [], token = "") => {
    const normalizedToken = normalizeTextToken(token);
    if (!normalizedToken) return -1;

    const exactIndex = (Array.isArray(options) ? options : []).findIndex((option) =>
        getAdminComparableTokensForOption(option).some((alias) => alias === normalizedToken)
    );
    if (exactIndex >= 0) return exactIndex;

    return (Array.isArray(options) ? options : []).findIndex((option) =>
        getAdminComparableTokensForOption(option).some((alias) =>
            alias.includes(normalizedToken) || normalizedToken.includes(alias)
        )
    );
};

const applyAdminControlsToOptions = (options = [], controls = {}) => {
    const normalizedOptions = (Array.isArray(options) ? options : [])
        .map((option) => normalizeOptionObject(option))
        .filter(Boolean)
        .map((option) => {
            const mappedAliases = (Array.isArray(controls?.optionMappings) ? controls.optionMappings : [])
                .filter((entry) => optionMatchesAdminTokenExactly(option, entry?.target || ""))
                .map((entry) => entry.source);

            if (mappedAliases.length === 0) return option;

            return normalizeOptionObject({
                ...option,
                aliases: uniqueTextValues([...(option.aliases || []), ...mappedAliases]),
            });
        });

    const orderedTokens = uniqueTextValues([
        controls?.recommendedOption || "",
        ...(Array.isArray(controls?.prioritizeOptions) ? controls.prioritizeOptions : []),
    ]);

    if (orderedTokens.length === 0) {
        return normalizedOptions;
    }

    const remaining = [...normalizedOptions];
    const prioritized = [];

    for (const token of orderedTokens) {
        const index = findOptionIndexByAdminToken(remaining, token);
        if (index < 0) continue;
        prioritized.push(remaining.splice(index, 1)[0]);
    }

    return [...prioritized, ...remaining];
};

const getRuntimeOptionsByQuestionSlug = (sessionAnswers = {}) => {
    const runtimeOptions =
        sessionAnswers?.uiState?.[RUNTIME_OPTIONS_STATE_KEY];

    if (!runtimeOptions || typeof runtimeOptions !== "object" || Array.isArray(runtimeOptions)) {
        return {};
    }

    return Object.entries(runtimeOptions).reduce((acc, [slug, options]) => {
        if (!slug || !Array.isArray(options) || options.length === 0) return acc;
        const normalized = options
            .map((option) => normalizeOptionObject(option))
            .filter(Boolean);
        if (normalized.length > 0) {
            acc[slug] = normalized;
        }
        return acc;
    }, {});
};

const getCanonicalQuestionOptions = (question = {}, controls = null) => {
    if (!Array.isArray(question?.options)) return [];
    const adminControls = controls && typeof controls === "object"
        ? controls
        : getQuestionAdminControls(question);
    return applyAdminControlsToOptions(question.options, adminControls);
};

const mergeUniqueOptionsByValue = (...optionLists) => {
    const seen = new Set();
    const merged = [];

    for (const optionList of optionLists) {
        for (const option of optionList || []) {
            const normalized = normalizeOptionObject(option);
            if (!normalized) continue;
            const key = normalizeTextToken(
                normalized.canonicalValue || normalized.value || normalized.label
            );
            if (!key || seen.has(key)) continue;
            seen.add(key);
            merged.push(normalized);
        }
    }

    return merged;
};

const getDisplayedQuestionOptions = (question = {}, runtimeOptionsByQuestionSlug = {}) => {
    const adminControls = getQuestionAdminControls(question);
    const runtimeOptions = question?.slug
        ? runtimeOptionsByQuestionSlug?.[question.slug]
        : null;
    const normalizedRuntimeOptions = Array.isArray(runtimeOptions)
        ? runtimeOptions.map((option) => normalizeOptionObject(option)).filter(Boolean)
        : [];

    if (normalizedRuntimeOptions.length > 0) {
        return applyAdminControlsToOptions(normalizedRuntimeOptions, adminControls);
    }

    return getCanonicalQuestionOptions(question, adminControls);
};

const getAcceptedQuestionOptions = (question = {}, runtimeOptionsByQuestionSlug = {}) =>
    mergeUniqueOptionsByValue(
        getDisplayedQuestionOptions(question, runtimeOptionsByQuestionSlug),
        getCanonicalQuestionOptions(question)
    );

const getQuestionOptionLabels = (question = {}, runtimeOptionsByQuestionSlug = {}) =>
    getDisplayedQuestionOptions(question, runtimeOptionsByQuestionSlug)
        .map((option) => String(option?.label || option?.value || "").trim())
        .filter(Boolean);

const extractComparableAnswerTokens = (answerValue = "") => {
    if (Array.isArray(answerValue)) {
        return Array.from(
            new Set(
                answerValue
                    .map((item) => normalizeOptionComparableText(item))
                    .filter(Boolean)
            )
        );
    }

    const normalized = normalizeOptionComparableText(answerValue);
    if (!normalized) return [];

    const splitParts = normalized
        .split(/,|\/|\band\b/gi)
        .map((part) => normalizeOptionComparableText(part))
        .filter(Boolean);

    if (!splitParts.includes(normalized)) {
        splitParts.push(normalized);
    }

    return Array.from(new Set(splitParts));
};

const getComparableOptionAliases = (option = {}) =>
    uniqueTextValues(
        [option?.label, option?.value, option?.canonicalLabel, option?.canonicalValue, ...(option?.aliases || [])]
            .map((value) => normalizeOptionComparableText(value))
            .filter(Boolean)
    );

const HELPER_OPTION_TRIGGER_REGEX = /\b(not sure|other|suggest|recommend|advice|help)\b/i;
const BINARY_RECOMMENDATION_ANSWER_REGEX = /^(yes|no)$/i;

const normalizeAdviceVisibleOptions = (currentOptions = [], currentQuestion = null) => {
    const requestOptions = (Array.isArray(currentOptions) ? currentOptions : [])
        .map((optionEntry) => normalizeOptionObject(optionEntry, {
            fallbackLabel: optionEntry && typeof optionEntry === "object" ? optionEntry.text || "" : "",
            fallbackValue: optionEntry && typeof optionEntry === "object" ? optionEntry.text || "" : "",
        }))
        .filter(Boolean);

    if (requestOptions.length > 0) {
        return requestOptions;
    }

    return currentQuestion
        ? getDisplayedQuestionOptions(currentQuestion, {})
        : [];
};

const getPreferredAdviceOptionLabel = (visibleOptionObjects = [], adviceAdminControls = {}) => {
    const normalizedOptions = Array.isArray(visibleOptionObjects) ? visibleOptionObjects : [];
    if (normalizedOptions.length === 0) return "";

    const inlineRecommendedOption = normalizedOptions.find((option) =>
        /\brecommend(?:ed)?\b/i.test(String(option?.label || option?.value || ""))
    );
    if (inlineRecommendedOption) {
        return String(
            inlineRecommendedOption?.label
            || inlineRecommendedOption?.value
            || inlineRecommendedOption?.canonicalLabel
            || inlineRecommendedOption?.canonicalValue
            || ""
        ).trim();
    }

    const adminPreferredIndex = findOptionIndexByAdminToken(
        normalizedOptions,
        adviceAdminControls.recommendedOption || adviceAdminControls.prioritizeOptions?.[0] || ""
    );
    if (adminPreferredIndex >= 0) {
        return String(
            normalizedOptions[adminPreferredIndex]?.label
            || normalizedOptions[adminPreferredIndex]?.value
            || normalizedOptions[adminPreferredIndex]?.canonicalLabel
            || normalizedOptions[adminPreferredIndex]?.canonicalValue
            || ""
        ).trim();
    }

    const firstConcreteOption = normalizedOptions.find((option) =>
        !HELPER_OPTION_TRIGGER_REGEX.test(String(option?.label || option?.value || ""))
    );

    return String(
        firstConcreteOption?.label
        || firstConcreteOption?.value
        || firstConcreteOption?.canonicalLabel
        || firstConcreteOption?.canonicalValue
        || ""
    ).trim();
};

const resolveAdviceRecommendedAnswer = ({
    payload = {},
    visibleOptionObjects = [],
    fallbackRecommendedAnswer = "",
}) => {
    const requestedAnswer = String(payload?.recommendedAnswer || "").trim();
    const noticeText = String(payload?.notice || "").trim();
    const normalizedVisibleOptions = Array.isArray(visibleOptionObjects) ? visibleOptionObjects : [];

    if (normalizedVisibleOptions.length > 0) {
        const optionMatch =
            findMatchingOptionsFromText(requestedAnswer, normalizedVisibleOptions)[0]
            || findMatchingOptionsFromText(noticeText, normalizedVisibleOptions)[0]
            || findMatchingOptionsFromText(fallbackRecommendedAnswer, normalizedVisibleOptions)[0];

        if (optionMatch) {
            return String(
                optionMatch?.label
                || optionMatch?.value
                || optionMatch?.canonicalLabel
                || optionMatch?.canonicalValue
                || ""
            ).trim();
        }
    }

    return requestedAnswer || String(fallbackRecommendedAnswer || "").trim();
};

const normalizeGuestAdvicePayload = ({
    payload = {},
    isRecommendationMode = false,
    visibleOptionObjects = [],
    fallbackRecommendedAnswer = "",
}) => {
    const rawNotice = String(payload?.notice || "").trim();
    const rawPlaceholder = String(payload?.placeholder || "").trim();

    if (!isRecommendationMode) {
        return {
            notice: rawNotice,
            placeholder: rawPlaceholder,
            recommendedAnswer: "",
        };
    }

    const recommendedAnswer = resolveAdviceRecommendedAnswer({
        payload,
        visibleOptionObjects,
        fallbackRecommendedAnswer,
    });
    const notice = rawNotice || (recommendedAnswer ? `Recommended: ${recommendedAnswer}.` : "");
    const placeholder = rawPlaceholder || (recommendedAnswer ? `e.g. ${recommendedAnswer}` : "e.g. go with the recommended direction");

    if (!BINARY_RECOMMENDATION_ANSWER_REGEX.test(recommendedAnswer)) {
        return {
            notice,
            placeholder,
            recommendedAnswer,
        };
    }

    const compactReason = notice
        .replace(/^recommended:\s*/i, "")
        .replace(/^(yes|no)\b[:.!-\s]*/i, "")
        .trim();
    const positiveBinary = normalizeTextToken(recommendedAnswer) === "yes";

    return {
        notice: `Recommended direction: ${compactReason || (positiveBinary
            ? "This fits the stronger path for the project right now."
            : "This keeps the first version focused on the core project flow.")}`,
        placeholder: rawPlaceholder && !/^e\.g\.\s*(yes|no)\s*$/i.test(rawPlaceholder)
            ? rawPlaceholder
            : (positiveBinary
                ? "e.g. go ahead with the recommended direction"
                : "e.g. skip this in the first version"),
        recommendedAnswer,
    };
};

const comparablePhraseContainsWholeWords = (source = "", target = "") => {
    const sourceWords = normalizeOptionComparableText(source).split(/\s+/).filter(Boolean);
    const targetWords = normalizeOptionComparableText(target).split(/\s+/).filter(Boolean);

    if (sourceWords.length === 0 || targetWords.length === 0) return false;
    if (targetWords.length > sourceWords.length) return false;

    for (let start = 0; start <= sourceWords.length - targetWords.length; start += 1) {
        let matched = true;
        for (let offset = 0; offset < targetWords.length; offset += 1) {
            if (sourceWords[start + offset] !== targetWords[offset]) {
                matched = false;
                break;
            }
        }
        if (matched) return true;
    }

    return false;
};

const findMatchingOptionsFromText = (answerValue = "", options = []) => {
    const answerTokens = extractComparableAnswerTokens(answerValue);
    if (answerTokens.length === 0) return [];

    const matches = [];
    const seen = new Set();

    for (const token of answerTokens) {
        const isPureNumber = /^\d+$/.test(token);
        
        const matchedOption = (options || []).find((option) => {
            const aliases = getComparableOptionAliases(option);
            return aliases.some((alias) => {
                if (token === alias) return true;
                if (isPureNumber) return false;
                return (
                    comparablePhraseContainsWholeWords(token, alias) ||
                    comparablePhraseContainsWholeWords(alias, token)
                );
            });
        });

        if (!matchedOption) continue;

        const key = normalizeTextToken(
            matchedOption?.canonicalValue || matchedOption?.value || matchedOption?.label
        );
        if (!key || seen.has(key)) continue;
        seen.add(key);
        matches.push(matchedOption);
    }

    return matches;
};

const buildQuestionDisplayAnswer = (question = {}, answerValue = "", runtimeOptionsByQuestionSlug = {}) => {
    if (!question || !hasAnswerValue(answerValue)) return "";

    const questionType = normalizeTextToken(question?.type || "input");
    if (!OPTION_QUESTION_TYPES.has(questionType)) {
        return Array.isArray(answerValue)
            ? answerValue.map((item) => String(item || "").trim()).filter(Boolean).join(", ")
            : String(answerValue || "").trim();
    }

    const matchedOptions = findMatchingOptionsFromText(
        answerValue,
        getAcceptedQuestionOptions(question, runtimeOptionsByQuestionSlug)
    );

    if (matchedOptions.length === 0) {
        return Array.isArray(answerValue)
            ? answerValue.map((item) => String(item || "").trim()).filter(Boolean).join(", ")
            : String(answerValue || "").trim();
    }

    return matchedOptions
        .map((option) => option.label || option.canonicalLabel || option.value)
        .filter(Boolean)
        .join(", ");
};

const normalizeAnswerForQuestion = (question = {}, answerValue = "", runtimeOptionsByQuestionSlug = {}) => {
    if (!question || !hasAnswerValue(answerValue)) {
        return Array.isArray(answerValue)
            ? answerValue.map((item) => String(item || "").trim()).filter(Boolean).join(", ")
            : String(answerValue || "").trim();
    }

    const questionType = normalizeTextToken(question?.type || "input");
    if (!OPTION_QUESTION_TYPES.has(questionType)) {
        return Array.isArray(answerValue)
            ? answerValue.map((item) => String(item || "").trim()).filter(Boolean).join(", ")
            : String(answerValue || "").trim();
    }

    const matchedOptions = findMatchingOptionsFromText(
        answerValue,
        getAcceptedQuestionOptions(question, runtimeOptionsByQuestionSlug)
    );

    if (matchedOptions.length === 0) {
        return Array.isArray(answerValue)
            ? answerValue.map((item) => String(item || "").trim()).filter(Boolean).join(", ")
            : String(answerValue || "").trim();
    }

    return matchedOptions
        .map((option) => option.value || option.canonicalValue || option.label)
        .filter(Boolean)
        .join(", ");
};

const hasDirectOptionAnswer = (message = "", question = {}, runtimeOptionsByQuestionSlug = {}) => {
    const normalizedMessage = normalizeTextToken(message);
    if (!normalizedMessage) return false;

    const acceptedOptions = getAcceptedQuestionOptions(question, runtimeOptionsByQuestionSlug);
    if (acceptedOptions.length === 0) return false;

    return acceptedOptions.some((option) =>
        getComparableOptionAliases(option).some((alias) => {
            const normalizedAlias = normalizeTextToken(alias);
            if (!normalizedAlias) return false;
            return (
                normalizedMessage.includes(normalizedAlias) ||
                normalizedAlias.includes(normalizedMessage)
            );
        })
    );
};

const countOptionLabelsMentioned = (message = "", question = {}, runtimeOptionsByQuestionSlug = {}) => {
    const normalizedMessage = normalizeTextToken(message);
    if (!normalizedMessage) return 0;

    return getQuestionOptionLabels(question, runtimeOptionsByQuestionSlug).reduce((count, label) => {
        const normalizedLabel = normalizeTextToken(label);
        if (!normalizedLabel) return count;
        return normalizedMessage.includes(normalizedLabel) ? count + 1 : count;
    }, 0);
};

const stripExistingOptionLines = (message = "", optionLabels = []) => {
    const normalizedOptionLabels = optionLabels
        .map((label) => normalizeTextToken(label))
        .filter(Boolean);

    if (normalizedOptionLabels.length === 0) {
        return String(message || "").trim();
    }

    const lines = String(message || "").split("\n");
    const keptLines = lines.filter((line) => {
        const trimmed = String(line || "").trim();
        if (!trimmed) return true;
        const withoutPrefix = trimmed.replace(/^(\d+\.\s*|[-*]\s*)/, "");
        const normalizedLine = normalizeTextToken(withoutPrefix);
        if (!normalizedLine) return true;
        return !normalizedOptionLabels.includes(normalizedLine);
    });

    return keptLines
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
};

const buildFriendlyMessage = (mainText = "", bridgeText = "") => {
    const cleanMainText = String(mainText || "").trim();
    const cleanBridgeText = String(bridgeText || "").trim();
    if (!cleanMainText) return cleanBridgeText;
    if (!cleanBridgeText) return cleanMainText;
    return `${cleanBridgeText}\n\n${cleanMainText}`;
};

const combineInlineMessages = (...parts) =>
    parts
        .map((part) => String(part || "").trim())
        .filter(Boolean)
        .join(" ");

const stripNameNotedRecap = (message = "") => {
    let cleaned = String(message || "");
    if (!cleaned.trim()) return "";

    const recapPatterns = [
        /\bi(?:'|\u2019)?ve\s+(?:got|noted)\s+your\s+name\b[^.?!\n]*[.?!]?/gi,
        /\bgot\s+your\s+name\s+noted\b[^.?!\n]*[.?!]?/gi,
        /\b(?:so\s+far,\s*)?i\s+know\s+your\s+name\s+is\b[^.?!\n]*\b(?:and|&)\s+your\s+(?:brand|company)\s+is\b[^.?!\n]*[.?!]?/gi,
        /\b(?:so\s+far,\s*)?(?:i|we)\s+(?:have|got|noted|captured|recorded|saved|collected)\s+your\s+name\b[^.?!\n]*\b(?:and|&)\s+your\s+(?:brand|company)\b[^.?!\n]*[.?!]?/gi
    ];

    for (const pattern of recapPatterns) {
        cleaned = cleaned.replace(pattern, " ");
    }

    const isNameBrandRecapSentence = (sentence = "") => {
        const text = String(sentence || "").toLowerCase();
        const hasName = /\byour\s+name\b/.test(text);
        const hasBrand =
            /\byour\s+(?:brand|company)\b/.test(text) ||
            /\byour\s+(?:brand|company)\s+name\b/.test(text) ||
            /\byour\s+company\s+or\s+brand\b/.test(text);
        if (!hasName || !hasBrand) return false;

        const firstPersonRecap =
            /\b(i|we)\b/.test(text) &&
            /\b(have|got|know|noted|captured|recorded|saved|collected)\b/.test(text);
        const sharedRecap = /\byou\S*\s+shared\b/.test(text);
        const soFarRecap = /\bso\s+far\b/.test(text);

        return firstPersonRecap || sharedRecap || soFarRecap;
    };

    const parts = cleaned.split(/((?<=[.?!])(?:[ \t]*\n+[ \t]*|[ \t]+))/);
    let result = "";
    for (let i = 0; i < parts.length; i += 2) {
        const sentence = parts[i] || "";
        const whitespace = parts[i+1] || "";
        if (!isNameBrandRecapSentence(sentence)) {
            result += sentence + whitespace;
        } else if (whitespace.includes("\n")) {
            result += whitespace.replace(/[ \t]/g, "");
        }
    }
    cleaned = result;

    return cleaned
        .replace(/[ \t]{2,}/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/^[ \t]+/gm, "")
        .trim();
};

const containsNormalizedText = (source = "", snippet = "") => {
    const normalizedSource = normalizeTextToken(source);
    const normalizedSnippet = normalizeTextToken(snippet);
    if (!normalizedSource || !normalizedSnippet) return false;
    return normalizedSource.includes(normalizedSnippet);
};

const pickFriendlyBridge = (seedText = "") => {
    const normalized = String(seedText || "");
    if (!normalized) return FRIENDLY_BRIDGES[0];
    const score = normalized
        .split("")
        .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return FRIENDLY_BRIDGES[Math.abs(score) % FRIENDLY_BRIDGES.length];
};

const buildPersonalizedQuestionBridge = ({
    nextQuestionText = "",
    answersByQuestionText = {},
    serviceName = ""
}) => {
    const normalizedQuestion = normalizeTextToken(nextQuestionText);
    const defaultBridge = pickFriendlyBridge(nextQuestionText);

    const clientName = findAnswerByQuestionPattern(
        answersByQuestionText,
        /\b(name)\b/i
    );
    const businessName = findAnswerByQuestionPattern(
        answersByQuestionText,
        /\b(business|company)\b.*\bname\b/i
    );
    const projectIdea = findAnswerByQuestionPattern(
        answersByQuestionText,
        /\b(describe|requirements|idea|overview|briefly)\b/i
    );
    const appType = findAnswerByQuestionPattern(
        answersByQuestionText,
        /\b(type of mobile app|app type|what type)\b/i
    );
    const platform = findAnswerByQuestionPattern(
        answersByQuestionText,
        /\b(platform|android|ios)\b/i
    );
    const features = findAnswerByQuestionPattern(
        answersByQuestionText,
        /\b(features)\b/i
    );
    const roles = findAnswerByQuestionPattern(
        answersByQuestionText,
        /\b(who will use|user roles|users)\b/i
    );
    const design = findAnswerByQuestionPattern(
        answersByQuestionText,
        /\b(design style)\b/i
    );
    const branding = findAnswerByQuestionPattern(
        answersByQuestionText,
        /\b(branding assets|logo|brand colors)\b/i
    );
    const framework = findAnswerByQuestionPattern(
        answersByQuestionText,
        /\b(preferred mobile app development approach|development approach|framework|flutter|react native|native)\b/i
    );
    const backend = findAnswerByQuestionPattern(
        answersByQuestionText,
        /\b(backend technology|backend stack|backend)\b/i
    );
    const timeline = findAnswerByQuestionPattern(
        answersByQuestionText,
        /\b(timeline|completed|delivery)\b/i
    );

    const firstName = clientName ? String(clientName).trim().split(/\s+/)[0] : "";
    const userPrefix = firstName ? `${firstName}, ` : "";
    const projectLabel =
        businessName || appType || serviceName || "your project";

    if (/which platform|android|ios/.test(normalizedQuestion)) {
        if (framework) return `${userPrefix}since you prefer ${framework}, let's lock the platform that fits best.`;
        return `${userPrefix}for ${projectLabel}, let's finalize the target platform next.`;
    }

    if (/which features|features should|deliverables included/.test(normalizedQuestion)) {
        if (projectIdea) return `${userPrefix}great direction so far - now let's shortlist the core MVP features.`;
        return `${userPrefix}let's map the key features that make ${projectLabel} useful from day one.`;
    }

    if (/who will use|user roles|users/.test(normalizedQuestion)) {
        if (features) return `${userPrefix}to shape the right flows, let's confirm exactly who will use the app.`;
        return `${userPrefix}this will help us keep scope clean for ${projectLabel}.`;
    }

    if (/design style/.test(normalizedQuestion)) {
        if (roles) return `${userPrefix}nice - with ${roles} in mind, let's set the design direction.`;
        return `${userPrefix}let's give ${projectLabel} the right visual feel.`;
    }

    if (/branding assets|logo|brand colors/.test(normalizedQuestion)) {
        if (design) return `${userPrefix}great choice on design style - this helps us align branding quickly.`;
        return `${userPrefix}this helps us keep the UI consistent from the start.`;
    }

    if (/familiar with mobile app technologies/.test(normalizedQuestion)) {
        if (framework || backend) return `${userPrefix}great progress - I already noted parts of your stack.`;
        return `${userPrefix}this helps us pick the most practical build path.`;
    }

    if (/preferred mobile app development approach|development approach/.test(normalizedQuestion)) {
        if (platform) return `${userPrefix}since you're targeting ${platform}, let's confirm the development approach.`;
        return `${userPrefix}this will define speed, maintainability, and budget fit.`;
    }

    if (/backend technology|backend stack/.test(normalizedQuestion)) {
        if (framework) return `${userPrefix}perfect - now let's pair the backend with ${framework}.`;
        return `${userPrefix}this helps us plan scalability and integrations properly.`;
    }

    if (/expected number of users|after launch/.test(normalizedQuestion)) {
        if (backend) return `${userPrefix}awesome - with ${backend} in mind, let's estimate scale targets.`;
        return `${userPrefix}this helps us design architecture that won't break as you grow.`;
    }

    if (/when do you want|timeline|completed/.test(normalizedQuestion)) {
        if (features) return `${userPrefix}great feature set - now let's align a realistic timeline.`;
        return `${userPrefix}this helps us plan phases and milestones clearly.`;
    }

    if (/estimated budget|budget/.test(normalizedQuestion)) {
        if (timeline) return `${userPrefix}nice - with ${timeline} timeline, let's lock a workable budget range.`;
        return `${userPrefix}this helps us keep scope and delivery realistic.`;
    }

    if (/additional requirements|notes/.test(normalizedQuestion)) {
        if (businessName) return `${userPrefix}we're almost done for ${businessName} - anything else you want to add?`;
        return `${userPrefix}last step - share any extra requirements if needed.`;
    }

    if (branding) {
        return `${userPrefix}${defaultBridge} I have noted your branding details too.`;
    }

    return defaultBridge;
};

const buildProgressBridge = ({ nextStep = 0, totalQuestions = 0 }) => {
    if (!totalQuestions || totalQuestions < 5) return "";
    const answeredCount = Math.max(0, Math.min(nextStep, totalQuestions));
    const ratio = answeredCount / totalQuestions;
    if (ratio >= 0.85) return "We are almost done.";
    if (ratio >= 0.55) return "Great pace - we are past the halfway point.";
    if (ratio >= 0.3) return "Nice progress - your scope is getting clear.";
    return "";
};

const buildAgentSideReply = ({ userMessage = "", answersByQuestionText = {} }) => {
    const normalizedUserMessage = normalizeTextToken(userMessage);
    if (!normalizedUserMessage) return "";

    const clientName = findAnswerByQuestionPattern(
        answersByQuestionText,
        /\b(name)\b/i
    );
    const firstName = clientName ? String(clientName).trim().split(/\s+/)[0] : "";
    const userPrefix = firstName ? `${firstName}, ` : "";

    if (AGENT_IDENTITY_REGEX.test(normalizedUserMessage)) {
        return `${userPrefix}I am your Catalance AI planning partner, and I will guide you until the proposal is ready.`;
    }

    if (GRATITUDE_REGEX.test(normalizedUserMessage)) {
        return `${userPrefix}glad to help.`;
    }

    return "";
};

const buildQuickReplyHint = (question = {}, runtimeOptionsByQuestionSlug = {}) => {
    const optionLabels = getQuestionOptionLabels(question, runtimeOptionsByQuestionSlug);
    if (optionLabels.length === 0 || optionLabels.length > 6) return "";
    return `Quick reply options: ${optionLabels.join(" | ")}`;
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

const hasAnswerValue = (value) => {
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) return value.some((item) => normalizeTextToken(item));
    return normalizeTextToken(value).length > 0;
};

const toComparableAnswer = (value) => {
    const stripParens = (str) => String(str).replace(/\([^)]*\)/g, "").trim();

    if (Array.isArray(value)) {
        return value
            .map((item) => stripParens(normalizeTextToken(item)))
            .filter(Boolean)
            .sort()
            .join(" | ");
    }

    const normalized = stripParens(normalizeTextToken(value));
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

const doesExtractedAnswerFitQuestion = (question = {}, answerValue = "", runtimeOptionsByQuestionSlug = {}) => {
    if (!question || !hasAnswerValue(answerValue)) return false;

    const questionType = normalizeTextToken(question?.type || "input");
    const optionLabels = getAcceptedQuestionOptions(question, runtimeOptionsByQuestionSlug);

    if (!OPTION_QUESTION_TYPES.has(questionType) || optionLabels.length === 0) {
        return true;
    }

    return findMatchingOptionsFromText(answerValue, optionLabels).length > 0;
};

const getQuestionIdentityType = (question = {}) => {
    const content = [
        question?.slug || "",
        question?.id || "",
        question?.text || "",
        question?.subtitle || "",
    ]
        .join(" ")
        .toLowerCase();

    if (
        /\b(company|brand|business|project)\s+name\b/.test(content)
        || /\b(company_name|brand_name|business_name|project_name)\b/.test(content)
    ) {
        return "business_name";
    }

    if (
        /\b(client|contact|full|first|your|person(?:al)?)\s+name\b/.test(content)
        || /\b(may i know your name|what(?:'s| is) your name|your name)\b/.test(content)
        || /\b(client_name|full_name|first_name|contact_name|q_client_full_name)\b/.test(content)
    ) {
        return "person_name";
    }

    return "other";
};

const SIMPLE_OPTION_SELECTION_REGEX = /^(?:(?:go with|pick|choose|select)\s+)?(?:option\s*)?(\d+)$/i;
const SIMPLE_PERSON_NAME_PREFIX_REGEX = /^(?:my name is|name is|i am|i'm|im|this is)\s+/i;
const SIMPLE_BUSINESS_NAME_PREFIX_REGEX = /^(?:(?:my|our)\s+(?:brand|business|company|project)\s+name\s+is|(?:brand|business|company|project)\s+name\s+is|(?:my|our)\s+(?:brand|business|company|project)\s+is|it'?s)\s+/i;
const ATOMIC_ANSWER_SEPARATOR_REGEX = /[,;\n:]/;
const PERSON_NAME_TOKEN_REGEX = /^[a-z][a-z'.-]*$/i;
const BUSINESS_NAME_TOKEN_REGEX = /^[a-z0-9][a-z0-9&'.-]*$/i;
const BUSINESS_NAME_EXTRA_DETAIL_REGEX = /\b(i|we|our|my|brand|business|company|project|service|services|offer|provide|need|requirements?|budget|timeline|website|app|content|machine|process)\b/i;
const SIMPLE_CONFIRMATION_NO_REGEX = /^(?:no|nope|nah|nothing else|nothing more|that's all|thats all|all good|no thanks|no thank you)$/i;
const SIMPLE_CONFIRMATION_YES_REGEX = /^(?:yes|yeah|yep|sure|okay|ok|go ahead|continue|generate|please generate|yes generate)$/i;

const stripAtomicAnswerPrefix = (message = "", identityType = "other") => {
    const rawMessage = String(message || "").trim();
    if (!rawMessage) return "";

    if (identityType === "person_name") {
        return rawMessage.replace(SIMPLE_PERSON_NAME_PREFIX_REGEX, "").trim();
    }

    if (identityType === "business_name") {
        return rawMessage.replace(SIMPLE_BUSINESS_NAME_PREFIX_REGEX, "").trim();
    }

    return rawMessage;
};

const looksLikeSingleOptionSelection = (message = "", question = {}, runtimeOptionsByQuestionSlug = {}) => {
    const rawMessage = String(message || "").trim();
    if (!rawMessage) return false;
    if (ATOMIC_ANSWER_SEPARATOR_REGEX.test(rawMessage)) return false;

    const displayedOptions = getQuestionOptionLabels(question, runtimeOptionsByQuestionSlug);
    if (displayedOptions.length === 0) return false;

    const numericMatch = rawMessage.match(SIMPLE_OPTION_SELECTION_REGEX);
    if (numericMatch) {
        const selectedIndex = Number.parseInt(numericMatch[1], 10);
        return Number.isInteger(selectedIndex) && selectedIndex >= 1 && selectedIndex <= displayedOptions.length;
    }

    const matchedOptions = findMatchingOptionsFromText(
        rawMessage,
        getAcceptedQuestionOptions(question, runtimeOptionsByQuestionSlug)
    );
    if (matchedOptions.length !== 1) return false;
    if (countOptionLabelsMentioned(rawMessage, question, runtimeOptionsByQuestionSlug) > 1) return false;

    const normalizedMessage = normalizeTextToken(rawMessage);
    if (!normalizedMessage) return false;

    return matchedOptions.some((option) =>
        getComparableOptionAliases(option).some((alias) => {
            const normalizedAlias = normalizeTextToken(alias);
            return normalizedAlias && normalizedMessage === normalizedAlias;
        })
    );
};

const looksLikeAtomicNameAnswer = (message = "", identityType = "other") => {
    const stripped = stripAtomicAnswerPrefix(message, identityType)
        .replace(/[.!?]+$/g, "")
        .trim();
    if (!stripped) return false;
    if (ATOMIC_ANSWER_SEPARATOR_REGEX.test(stripped)) return false;

    const normalized = normalizeTextToken(stripped);
    if (!normalized || GREETING_SMALLTALK_REGEX.test(normalized)) return false;

    const tokens = stripped.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return false;

    if (identityType === "person_name") {
        return tokens.length <= 3 && tokens.every((token) => PERSON_NAME_TOKEN_REGEX.test(token));
    }

    if (identityType === "business_name") {
        return (
            tokens.length <= 3
            && !BUSINESS_NAME_EXTRA_DETAIL_REGEX.test(normalized)
            && tokens.every((token) => BUSINESS_NAME_TOKEN_REGEX.test(token))
        );
    }

    return false;
};

const shouldSkipMessageAnswerExtraction = ({
    message = "",
    currentQuestion = null,
    runtimeOptionsByQuestionSlug = {},
    hasAttachmentContext = false,
    hasUrlContext = false,
    correctionIntent = false,
} = {}) => {
    const rawMessage = String(message || "").trim();
    if (!rawMessage || !currentQuestion) return false;
    if (hasAttachmentContext || hasUrlContext || correctionIntent) return false;
    if (rawMessage.length > 80) return false;

    const questionType = normalizeTextToken(currentQuestion?.type || "input");
    if (
        OPTION_QUESTION_TYPES.has(questionType)
        && looksLikeSingleOptionSelection(rawMessage, currentQuestion, runtimeOptionsByQuestionSlug)
    ) {
        return true;
    }

    const identityType = getQuestionIdentityType(currentQuestion);
    if (identityType === "person_name" || identityType === "business_name") {
        return looksLikeAtomicNameAnswer(rawMessage, identityType);
    }

    return false;
};

const isProposalConfirmationQuestion = (question = {}) => {
    const combinedText = [
        question?.slug || "",
        question?.id || "",
        question?.text || "",
        question?.subtitle || "",
    ]
        .join(" ")
        .toLowerCase();

    return /\bconfirmation\b/.test(combinedText)
        || /\banything else\b/.test(combinedText)
        || /\bbefore i generate\b/.test(combinedText)
        || /\bgenerate the proposal\b/.test(combinedText);
};

const buildLocalValidationAckMessage = (question = {}, normalizedAnswer = "") => {
    const identityType = getQuestionIdentityType(question);
    const questionType = normalizeTextToken(question?.type || "input");
    const answerText = String(normalizedAnswer || "").trim();

    if (isProposalConfirmationQuestion(question)) {
        return SIMPLE_CONFIRMATION_NO_REGEX.test(answerText)
            ? "Perfect — I’ll generate the proposal based on what you shared."
            : "Great — I’ll include that while I put the proposal together.";
    }

    if (OPTION_QUESTION_TYPES.has(questionType)) {
        return "Got it.";
    }

    if (identityType === "person_name") {
        return `Thanks, ${answerText || "there"}!`;
    }

    if (identityType === "business_name") {
        return "Thanks!";
    }

    return pickFriendlyBridge(question?.text || answerText || "response");
};

const getFastLocalValidationResult = ({
    question = null,
    userMessage = "",
    runtimeOptionsByQuestionSlug = {},
    hasAttachmentContext = false,
    hasUrlContext = false,
    correctionIntent = false,
}) => {
    const rawMessage = String(userMessage || "").trim();
    if (!question || !rawMessage) return null;
    if (hasAttachmentContext || hasUrlContext || correctionIntent) return null;

    const questionType = normalizeTextToken(question?.type || "input");
    if (
        OPTION_QUESTION_TYPES.has(questionType)
        && looksLikeSingleOptionSelection(rawMessage, question, runtimeOptionsByQuestionSlug)
    ) {
        const normalizedAnswer = normalizeAnswerForQuestion(question, rawMessage, runtimeOptionsByQuestionSlug);
        if (!normalizedAnswer) return null;
        return {
            isValid: true,
            status: "valid_answer",
            message: buildLocalValidationAckMessage(question, normalizedAnswer),
            normalizedAnswer,
        };
    }

    const identityType = getQuestionIdentityType(question);
    if (identityType === "person_name" || identityType === "business_name") {
        if (!looksLikeAtomicNameAnswer(rawMessage, identityType)) {
            return null;
        }

        const normalizedAnswer = stripAtomicAnswerPrefix(rawMessage, identityType)
            .replace(/[.!?]+$/g, "")
            .trim();
        if (!normalizedAnswer) return null;

        return {
            isValid: true,
            status: "valid_answer",
            message: buildLocalValidationAckMessage(question, normalizedAnswer),
            normalizedAnswer,
        };
    }

    if (isProposalConfirmationQuestion(question)) {
        const normalizedAnswer = normalizeTextToken(rawMessage);
        if (SIMPLE_CONFIRMATION_NO_REGEX.test(rawMessage) || SIMPLE_CONFIRMATION_YES_REGEX.test(rawMessage)) {
            return {
                isValid: true,
                status: "valid_answer",
                message: buildLocalValidationAckMessage(question, normalizedAnswer),
                normalizedAnswer: rawMessage,
            };
        }
    }

    return null;
};

const RESERVED_PLATFORM_BRAND_NAMES = ["Catalance"];
const WELL_KNOWN_COMPANY_BRAND_NAMES = [
    "Google",
    "Apple",
    "Microsoft",
    "Amazon",
    "Meta",
    "Facebook",
    "Instagram",
    "WhatsApp",
    "Netflix",
    "Spotify",
    "Uber",
    "Airbnb",
    "Tesla",
    "NVIDIA",
    "OpenAI",
    "Spinny",
    "Tata",
    "Reliance",
    "Infosys",
    "Wipro",
    "Zoho",
    "Flipkart",
    "Myntra",
    "Zomato",
    "Swiggy",
    "Paytm",
    "PhonePe",
    "Mahindra",
    "Adani",
];
const BUSINESS_ENTITY_SUFFIX_REGEX = /\b(incorporated|inc|llc|ltd|limited|private|pvt|corp|corporation|company|co|plc)\b/g;
const BRAND_AFFILIATION_DENIAL_REGEX = /^(?:no|nope|nah|not really|i am not|i'm not|im not|we are not|we're not|not part of the team|not with them|not affiliated|just inspired by|similar to)\b/;
const BRAND_ROLE_KEYWORD_REGEX = /\b(founder|co founder|cofounder|owner|ceo|cto|cfo|coo|cmo|manager|lead|head|director|developer|designer|engineer|marketer|marketing|sales|operations|operator|product|consultant|strategist|producer|analyst|employee|intern|partner|recruiter)\b/;
const BRAND_ROLE_ACTION_REGEX = /\b(i|we)\s+(run|lead|manage|handle|own|founded|founded it|co founded|cofounded|operate)\b/;
const BRAND_AFFILIATION_ONLY_REGEX = /\b(i am|i'm|im|we are|we're|part of the team|with the team|from the team|on the team|i work there|we work there|i work at|we work at|i work for|we work for|i am with|i'm with|we are with|we're with)\b/;
const BRAND_AFFILIATION_ACK_REGEX = /^(?:yes|yeah|yep|yup|sure|okay|ok|correct|right)\b/;

const normalizeBrandCandidate = (value = "") =>
    String(value || "")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^\w\s]/g, " ")
        .replace(BUSINESS_ENTITY_SUFFIX_REGEX, " ")
        .replace(/\s+/g, " ")
        .trim();

const BRAND_MATCHERS = WELL_KNOWN_COMPANY_BRAND_NAMES
    .map((canonicalName) => ({
        canonicalName,
        key: normalizeBrandCandidate(canonicalName),
    }))
    .sort((left, right) => right.key.length - left.key.length);

const RESERVED_BRAND_MATCHERS = RESERVED_PLATFORM_BRAND_NAMES
    .map((canonicalName) => ({
        canonicalName,
        key: normalizeBrandCandidate(canonicalName),
    }))
    .sort((left, right) => right.key.length - left.key.length);

const containsWholeBrandCandidate = (normalizedMessage = "", brandKey = "") =>
    Boolean(
        normalizedMessage
        && brandKey
        && (
            normalizedMessage === brandKey
            || normalizedMessage.startsWith(`${brandKey} `)
            || normalizedMessage.endsWith(` ${brandKey}`)
            || normalizedMessage.includes(` ${brandKey} `)
        )
    );

const findReservedPlatformBrandMatch = (value = "") => {
    const normalizedMessage = normalizeBrandCandidate(value);
    if (!normalizedMessage) return null;
    return RESERVED_BRAND_MATCHERS.find(({ key }) => containsWholeBrandCandidate(normalizedMessage, key)) || null;
};

const findKnownEstablishedBrandMatch = (value = "") => {
    const normalizedMessage = normalizeBrandCandidate(value);
    if (!normalizedMessage) return null;
    return BRAND_MATCHERS.find(({ key }) => containsWholeBrandCandidate(normalizedMessage, key)) || null;
};

const parseKnownBrandAffiliationResponse = (value = "") => {
    const normalized = normalizeTextToken(value);
    if (!normalized) return "needs_more_detail";
    if (BRAND_AFFILIATION_DENIAL_REGEX.test(normalized)) return "denied";
    if (
        BRAND_ROLE_KEYWORD_REGEX.test(normalized)
        || BRAND_ROLE_ACTION_REGEX.test(normalized)
        || /\bmy role is\b/.test(normalized)
    ) {
        return "confirmed";
    }
    if (
        BRAND_AFFILIATION_ONLY_REGEX.test(normalized)
        || BRAND_AFFILIATION_ACK_REGEX.test(normalized)
    ) {
        return "needs_more_detail";
    }
    return "needs_more_detail";
};

const looksLikeStandaloneBusinessName = (value = "") => {
    const trimmed = String(value || "").trim();
    const normalized = normalizeTextToken(trimmed);
    if (!trimmed || !normalized) return false;
    if (trimmed.length > 80 || normalized.split(" ").length > 6) return false;
    if (/[?]/.test(trimmed)) return false;
    if (
        BRAND_AFFILIATION_DENIAL_REGEX.test(normalized)
        || BRAND_AFFILIATION_ONLY_REGEX.test(normalized)
        || BRAND_AFFILIATION_ACK_REGEX.test(normalized)
        || BRAND_ROLE_KEYWORD_REGEX.test(normalized)
        || BRAND_ROLE_ACTION_REGEX.test(normalized)
    ) {
        return false;
    }
    return /[a-z]/i.test(trimmed);
};

const getBusinessNameValidationGuardAction = ({
    question = {},
    userMessage = "",
    pendingState = null,
} = {}) => {
    if (getQuestionIdentityType(question) !== "business_name") {
        return { type: "none", brandName: "" };
    }

    const trimmedMessage = String(userMessage || "").trim();
    const pendingBrandName = String(pendingState?.brandName || "").trim();
    const pendingQuestionSlug = String(pendingState?.questionSlug || "").trim();

    if (pendingBrandName && pendingQuestionSlug && pendingQuestionSlug === String(question?.slug || "").trim()) {
        if (looksLikeStandaloneBusinessName(trimmedMessage)) {
            return {
                type: "restart_with_new_brand_name",
                brandName: pendingBrandName,
                replacementBrandName: trimmedMessage,
            };
        }

        const affiliationStatus = parseKnownBrandAffiliationResponse(trimmedMessage);
        if (affiliationStatus === "confirmed") {
            return { type: "accept_pending_brand", brandName: pendingBrandName };
        }
        if (affiliationStatus === "denied") {
            return { type: "deny_pending_brand", brandName: pendingBrandName };
        }
        return { type: "ask_pending_brand_role", brandName: pendingBrandName };
    }

    const reservedBrandMatch = findReservedPlatformBrandMatch(trimmedMessage);
    if (reservedBrandMatch) {
        return {
            type: "reserved_platform_brand",
            brandName: reservedBrandMatch.canonicalName,
        };
    }

    const knownBrandMatch = findKnownEstablishedBrandMatch(trimmedMessage);
    if (!knownBrandMatch) {
        return { type: "none", brandName: "" };
    }

    if (parseKnownBrandAffiliationResponse(trimmedMessage) === "confirmed") {
        return {
            type: "accept_known_brand",
            brandName: knownBrandMatch.canonicalName,
        };
    }

    return {
        type: "ask_known_brand_affiliation",
        brandName: knownBrandMatch.canonicalName,
    };
};

const normalizeSessionPrefillName = (value = "") =>
    String(value || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 120)
        .trim();

const normalizeSharedSessionStartValue = (value = "", maxLength = 600) =>
    String(value || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, maxLength)
        .trim();

const getQuestionSharedStartType = (question = {}) => {
    const identityType = getQuestionIdentityType(question);
    if (identityType !== "other") return identityType;

    const content = [
        question?.slug || "",
        question?.id || "",
        question?.text || "",
        question?.subtitle || "",
    ]
        .join(" ")
        .toLowerCase();

    if (
        (
            /\b(brand|business|company)\b/.test(content)
            && /\b(brief|overview|summary|description|about|offer)\b/.test(content)
        )
        || /\b(brand_brief|business_brief|company_brief|brand_description|business_description|company_description|brand_overview|business_overview|company_overview|about_business|about_company|business_info|company_info|what_you_offer)\b/.test(content)
    ) {
        return "business_summary";
    }

    if (
        /\b(website|url|link)\b/.test(content)
        && /\b(current|existing|business|brand|company|reference|site|website|url|link)\b/.test(content)
    ) {
        return "website_url";
    }

    return "other";
};

const normalizeSharedSessionAnswers = (sharedAnswers = {}) => {
    if (!sharedAnswers || typeof sharedAnswers !== "object" || Array.isArray(sharedAnswers)) {
        return {};
    }

    const nextSharedAnswers = {};
    const personName = normalizeSessionPrefillName(
        sharedAnswers.personName || sharedAnswers.person_name || ""
    );
    const businessName = normalizeSharedSessionStartValue(
        sharedAnswers.businessName || sharedAnswers.business_name || "",
        160
    );
    const businessSummary = normalizeSharedSessionStartValue(
        sharedAnswers.businessSummary || sharedAnswers.business_summary || "",
        600
    );
    const websiteUrl = normalizeSharedSessionStartValue(
        sharedAnswers.websiteUrl || sharedAnswers.website_url || "",
        400
    );

    if (personName) nextSharedAnswers.personName = personName;
    if (businessName) nextSharedAnswers.businessName = businessName;
    if (businessSummary) nextSharedAnswers.businessSummary = businessSummary;
    if (websiteUrl) nextSharedAnswers.websiteUrl = websiteUrl;

    return nextSharedAnswers;
};

const buildSharedSessionAnswers = ({
    questions = [],
    sessionAnswers = {},
} = {}) => {
    const answersBySlug = getAnswersBySlug(sessionAnswers, questions);
    const sharedAnswers = {};

    for (const question of questions) {
        if (!question?.slug) continue;
        const answerValue = answersBySlug[question.slug];
        if (!hasAnswerValue(answerValue)) continue;

        const sharedStartType = getQuestionSharedStartType(question);
        if (sharedStartType === "person_name" && !sharedAnswers.personName) {
            const normalizedName = normalizeSessionPrefillName(answerValue);
            if (normalizedName) sharedAnswers.personName = normalizedName;
            continue;
        }

        if (sharedStartType === "business_name" && !sharedAnswers.businessName) {
            const normalizedBusinessName = normalizeSharedSessionStartValue(answerValue, 160);
            if (normalizedBusinessName) sharedAnswers.businessName = normalizedBusinessName;
            continue;
        }

        if (sharedStartType === "business_summary" && !sharedAnswers.businessSummary) {
            const normalizedBusinessSummary = normalizeSharedSessionStartValue(answerValue, 600);
            if (normalizedBusinessSummary) sharedAnswers.businessSummary = normalizedBusinessSummary;
            continue;
        }

        if (sharedStartType === "website_url" && !sharedAnswers.websiteUrl) {
            const normalizedWebsiteUrl = normalizeSharedSessionStartValue(answerValue, 400);
            if (normalizedWebsiteUrl) sharedAnswers.websiteUrl = normalizedWebsiteUrl;
        }
    }

    return sharedAnswers;
};

const buildSessionStartPrefill = ({
    questions = [],
    prefillName = "",
    sharedAnswers = {},
} = {}) => {
    if (!Array.isArray(questions) || questions.length === 0) {
        return {
            answersBySlug: {},
            acknowledgedQuestion: null,
            acknowledgedAnswer: ""
        };
    }

    const normalizedSharedAnswers = normalizeSharedSessionAnswers(sharedAnswers);
    const normalizedName = normalizedSharedAnswers.personName || normalizeSessionPrefillName(prefillName);
    const answersBySlug = {};
    let acknowledgedQuestion = null;
    let acknowledgedAnswer = "";
    let consumedBusinessSummary = false;
    let consumedWebsiteUrl = false;

    for (const question of questions) {
        if (!question?.slug) continue;

        const sharedStartType = getQuestionSharedStartType(question);
        let answerValue = "";

        if (sharedStartType === "person_name") {
            answerValue = normalizedName;
        } else if (sharedStartType === "business_name") {
            answerValue = normalizedSharedAnswers.businessName || "";
        } else if (sharedStartType === "business_summary" && !consumedBusinessSummary) {
            answerValue = normalizedSharedAnswers.businessSummary || "";
        } else if (sharedStartType === "website_url" && !consumedWebsiteUrl) {
            answerValue = normalizedSharedAnswers.websiteUrl || "";
        }

        if (!hasAnswerValue(answerValue)) continue;
        answersBySlug[question.slug] = answerValue;

        if (!acknowledgedQuestion && sharedStartType === "person_name") {
            acknowledgedQuestion = question;
            acknowledgedAnswer = answerValue;
        }

        if (sharedStartType === "business_summary") {
            consumedBusinessSummary = true;
        }

        if (sharedStartType === "website_url") {
            consumedWebsiteUrl = true;
        }
    }

    return {
        answersBySlug,
        acknowledgedQuestion,
        acknowledgedAnswer
    };
};

const buildSessionStartPrefillBridge = ({
    acknowledgedQuestion = null,
    acknowledgedAnswer = ""
} = {}) => {
    if (getQuestionIdentityType(acknowledgedQuestion) !== "person_name") return "";
    if (!hasAnswerValue(acknowledgedAnswer)) return "";

    const firstName = String(acknowledgedAnswer).trim().split(/\s+/)[0];
    return firstName ? `Nice to meet you, ${firstName}.` : "";
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

const buildPersistedAnswersPayload = (answersBySlug = {}, questions = [], {
    runtimeOptionsByQuestionSlug = {},
    existingPayload = {}
} = {}) => {
    const bySlug = {};
    const byQuestionText = {};

    for (const question of questions) {
        if (!question?.slug) continue;
        const value = answersBySlug[question.slug];
        if (!hasAnswerValue(value)) continue;
        bySlug[question.slug] = value;
        byQuestionText[question.text] = buildQuestionDisplayAnswer(
            question,
            value,
            runtimeOptionsByQuestionSlug
        ) || value;
    }

    const payload = { bySlug, byQuestionText };
    const existingUiState =
        existingPayload?.uiState && typeof existingPayload.uiState === "object" && !Array.isArray(existingPayload.uiState)
            ? { ...existingPayload.uiState }
            : {};
    const normalizedRuntimeOptions = getRuntimeOptionsByQuestionSlug({
        uiState: { [RUNTIME_OPTIONS_STATE_KEY]: runtimeOptionsByQuestionSlug }
    });

    if (Object.keys(normalizedRuntimeOptions).length > 0) {
        existingUiState[RUNTIME_OPTIONS_STATE_KEY] = normalizedRuntimeOptions;
    } else {
        delete existingUiState[RUNTIME_OPTIONS_STATE_KEY];
    }

    if (Object.keys(existingUiState).length > 0) {
        payload.uiState = existingUiState;
    }

    return payload;
};

const getAnswerBySlugPattern = (answersBySlug = {}, pattern) => {
    if (!answersBySlug || typeof answersBySlug !== "object") return "";
    for (const [slug, value] of Object.entries(answersBySlug)) {
        if (!pattern.test(slug)) continue;
        if (!hasAnswerValue(value)) continue;
        return String(value || "");
    }
    return "";
};

const pickOptionLabelByPatterns = (optionLabels = [], patterns = []) => {
    if (!Array.isArray(optionLabels) || optionLabels.length === 0) return "";
    for (const pattern of patterns) {
        const found = optionLabels.find((label) => pattern.test(normalizeTextToken(label)));
        if (found) return found;
    }
    return "";
};

const buildContextualSuggestionMessage = ({
    question = {},
    answersBySlug = {},
    serviceName = "",
    servicePrompt = "",
    runtimeOptionsByQuestionSlug = {}
}) => {
    const questionText = String(question?.text || "Could you please confirm this?");
    const optionLabels = getQuestionOptionLabels(question, runtimeOptionsByQuestionSlug);
    const adminControls = getQuestionAdminControls(question, servicePrompt);
    const normalizedQuestion = normalizeTextToken(questionText);
    const combinedContext = Object.values(answersBySlug || {})
        .map((value) => String(value || ""))
        .join(" ");
    const normalizedContext = normalizeTextToken(combinedContext);
    const questionWithOptions = formatQuestionWithOptions(question, runtimeOptionsByQuestionSlug);

    if (optionLabels.length === 0) {
        return [
            `Good question. This helps me plan your ${serviceName || "project"} better.`,
            "Once you share this, I can guide you more clearly.",
            `Please share this so we can continue:\n${questionText}`
        ].join("\n\n");
    }

    let recommendation = "";
    let reason = "";
    const adminPreferredOption = applyAdminControlsToOptions(
        getDisplayedQuestionOptions(question, runtimeOptionsByQuestionSlug),
        adminControls
    )[0]?.label || "";

    if (adminPreferredOption) {
        recommendation = adminPreferredOption;
        reason = "because this aligns with the admin-configured preferred flow for this question.";
    }

    if (!recommendation && /platform|android|ios/.test(normalizedQuestion)) {
        const frameworkAnswer = normalizeTextToken(
            getAnswerBySlugPattern(
                answersBySlug,
                /(dev_framework|mobile|frontend|tech_stack|approach)/i
            )
        );

        if (/flutter|react native|cross/.test(frameworkAnswer)) {
            recommendation = pickOptionLabelByPatterns(optionLabels, [/both|cross|android.*ios|ios.*android/]);
            reason = "because cross-platform development aligns well with your selected stack.";
        } else if (/kotlin|java|android/.test(frameworkAnswer)) {
            recommendation = pickOptionLabelByPatterns(optionLabels, [/android/]);
            reason = "because your stack points toward Android-focused development.";
        } else if (/swift|ios/.test(frameworkAnswer)) {
            recommendation = pickOptionLabelByPatterns(optionLabels, [/ios/]);
            reason = "because your stack points toward iOS-focused development.";
        } else {
            recommendation = pickOptionLabelByPatterns(optionLabels, [/both|cross|android.*ios|ios.*android/]) || optionLabels[0];
            reason = "to maximize reach during early growth.";
        }
    } else if (!recommendation && /who will use|user role|users/.test(normalizedQuestion)) {
        if (/vendor|seller|marketplace|multi/.test(normalizedContext)) {
            recommendation = pickOptionLabelByPatterns(optionLabels, [/vendor|seller|marketplace/]);
            reason = "because your app flow includes listing and transactions between users.";
        } else if (/admin|dashboard|panel|manage/.test(normalizedContext)) {
            recommendation = pickOptionLabelByPatterns(optionLabels, [/admin|manager/]);
            reason = "because you mentioned admin-side operations earlier.";
        } else {
            recommendation = pickOptionLabelByPatterns(optionLabels, [/customer/]) || optionLabels[0];
            reason = "to keep MVP scope focused and faster to launch.";
        }
    } else if (!recommendation && /design style|branding|look/.test(normalizedQuestion)) {
        recommendation = optionLabels[0];
        reason = "as a safe starting point based on typical startup MVP launches.";
    } else if (!recommendation && /budget/.test(normalizedQuestion)) {
        return `I can suggest a realistic range, but I still need your final budget to continue.\n\n${questionText}`;
    } else if (!recommendation) {
        recommendation = optionLabels[0];
        reason = "based on the details you've already shared.";
    }

    if (!recommendation) {
        recommendation = optionLabels[0];
    }

    const alternatives = optionLabels
        .filter((label) => normalizeTextToken(label) !== normalizeTextToken(recommendation))
        .slice(0, 2);
    const alternativesLine = alternatives.length > 0
        ? `If that does not fit, you can choose ${alternatives.join(" or ")}.`
        : "";

    return [
        "Good question.",
        `I recommend **${recommendation}** ${reason}`,
        alternativesLine,
        "Quick tip:",
        "- Pick the option that best matches your first launch goal.",
        "- If you are not sure, choose the closest one and we can adjust next.",
        "Please choose one option so we can continue:",
        questionWithOptions
    ]
        .filter(Boolean)
        .join("\n\n")
        .trim();
};

const parseMessageFieldFromJson = (rawMessage = "") => {
    if (typeof rawMessage !== "string" || !rawMessage.trim()) {
        return "";
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
            if (typeof parsed?.message === "string" && parsed.message.trim()) {
                return parsed.message.trim();
            }
        } catch {
            // Try next normalization candidate.
        }
    }

    const fallbackMatch = raw.match(/"message"\s*:\s*"([\s\S]*?)"/i);
    if (!fallbackMatch) return "";
    return fallbackMatch[1].replace(/\\"/g, "\"").trim();
};

const clipContextSnippet = (value = "", limit = 160) => {
    const normalized = String(value || "").replace(/\s+/g, " ").trim();
    if (!normalized) return "";
    if (normalized.length <= limit) return normalized;
    return `${normalized.slice(0, Math.max(0, limit - 3)).trimEnd()}...`;
};

const buildAnswersContextLines = (
    answersByQuestionText = {},
    {
        maxItems = 8,
        questionLimit = 90,
        answerLimit = 140,
    } = {},
) =>
    Object.entries(answersByQuestionText || {})
        .filter(([, value]) => hasAnswerValue(value))
        .map(([question, answer]) => `- ${clipContextSnippet(question, questionLimit)}: ${clipContextSnippet(answer, answerLimit)}`)
        .slice(0, maxItems)
        .join("\n");

const stringifyAnswerForContext = (value) => {
    if (Array.isArray(value)) {
        return value
            .map((item) => String(item || "").trim())
            .filter(Boolean)
            .join(", ");
    }
    return String(value || "").trim();
};

const buildSavedResponseContextLines = (
    answersBySlug = {},
    questions = [],
    runtimeOptionsByQuestionSlug = {},
    {
        maxItems = 8,
        questionLimit = 90,
        answerLimit = 140,
        subtitleLimit = 80,
    } = {},
) =>
    (Array.isArray(questions) ? questions : [])
        .filter((question) => question?.saveResponse && question?.slug)
        .map((question) => {
            const answerValue = answersBySlug?.[question.slug];
            if (!hasAnswerValue(answerValue)) return null;
            const answerText = buildQuestionDisplayAnswer(
                question,
                answerValue,
                runtimeOptionsByQuestionSlug
            ) || stringifyAnswerForContext(answerValue);
            if (!answerText) return null;
            const clippedAnswerText = clipContextSnippet(answerText, answerLimit);
            const subtitle = buildAdminControlSummaryText(getQuestionAdminControls(question));
            return subtitle
                ? `- ${clipContextSnippet(question.text, questionLimit)}: ${clippedAnswerText} (intent: ${clipContextSnippet(subtitle, subtitleLimit)})`
                : `- ${clipContextSnippet(question.text, questionLimit)}: ${clippedAnswerText}`;
        })
        .filter(Boolean)
        .slice(0, maxItems)
        .join("\n");

const buildQuestionSubtitleMapLines = (
    questions = [],
    {
        maxItems = 12,
        subtitleLimit = 90,
    } = {},
) =>
    (Array.isArray(questions) ? questions : [])
        .map((question) => {
            const slug = String(question?.slug || "").trim();
            const subtitle = buildAdminControlSummaryText(getQuestionAdminControls(question));
            if (!slug || !subtitle) return null;
            return `- ${slug}: ${clipContextSnippet(subtitle, subtitleLimit)}`;
        })
        .filter(Boolean)
        .slice(0, maxItems)
        .join("\n");

const extractFirstSentence = (value = "") => {
    const source = String(value || "").replace(/\s+/g, " ").trim();
    if (!source) return "";
    const chunks = source.split(/(?<=[.!?])\s+/).map((chunk) => chunk.trim()).filter(Boolean);
    return chunks[0] || source;
};

const clipSentence = (value = "", limit = 180) => {
    const source = String(value || "").replace(/\s+/g, " ").trim();
    if (!source) return "";
    if (source.length <= limit) return source;
    return `${source.slice(0, Math.max(0, limit - 1)).trimEnd()}...`;
};

const normalizeGuidanceSentence = (value = "") => {
    const cleaned = String(value || "").trim();
    if (!cleaned) return "";
    const withoutMarkdown = cleaned.replace(/\*\*/g, "");
    const normalizedLead = withoutMarkdown
        .replace(/^based on what you shared,\s*/i, "")
        .replace(/^from your earlier inputs,\s*/i, "")
        .replace(/^for this question,\s*/i, "")
        .replace(/^(i suggest|suggest)\s+/i, "I recommend ")
        .replace(/[ \t]{2,}/g, " ")
        .trim();
    if (!normalizedLead) return "";
    if (!/^[a-z]/.test(normalizedLead)) return normalizedLead;
    return `${normalizedLead.charAt(0).toUpperCase()}${normalizedLead.slice(1)}`;
};

const stripInlineOptionListTail = (value = "") => {
    const source = String(value || "").trim();
    if (!source) return "";

    const firstOptionIndex = source.search(/\b1\.\s+\S/);
    if (firstOptionIndex === -1) return source;

    const optionTail = source.slice(firstOptionIndex);
    const optionTokenCount = (optionTail.match(/\b\d+\.\s+\S/g) || []).length;
    if (optionTokenCount < 2) return source;

    return source
        .slice(0, firstOptionIndex)
        .replace(/[,:;\-]\s*$/, "")
        .trim();
};

const buildRecentAnswerContextSnippet = ({
    answersBySlug = {},
    questions = [],
    excludeSlug = "",
    runtimeOptionsByQuestionSlug = {}
}) => {
    const answeredRows = (Array.isArray(questions) ? questions : [])
        .filter((question) => question?.slug && question.slug !== excludeSlug)
        .map((question) => {
            const value = answersBySlug?.[question.slug];
            if (!hasAnswerValue(value)) return null;
            return {
                question: String(question.text || "").trim(),
                answer: buildQuestionDisplayAnswer(
                    question,
                    value,
                    runtimeOptionsByQuestionSlug
                ) || stringifyAnswerForContext(value)
            };
        })
        .filter(Boolean)
        .slice(-2);

    if (answeredRows.length === 0) return "";
    return answeredRows
        .map((row) => `${row.question}: ${row.answer}`)
        .join(" | ");
};

const extractCurrentRecommendationLine = (text = "") => {
    const lines = String(text || "")
        .replace(/\r/g, "\n")
        .split("\n")
        .map((line) => String(line || "").replace(/\*\*/g, "").trim())
        .filter(Boolean);

    const preferred = lines.find((line) => /\bi suggest\b|\brecommend\b/i.test(line));
    return preferred || "";
};

const parsePostFifthMessageFields = (rawMessage = "") => {
    if (typeof rawMessage !== "string" || !rawMessage.trim()) return null;

    const parsed = parseJsonObjectFromRaw(rawMessage);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return null;
    }

    const pickText = (...keys) => {
        for (const key of keys) {
            const value = parsed?.[key];
            if (typeof value !== "string") continue;
            const cleaned = value.trim();
            if (cleaned) return cleaned;
        }
        return "";
    };

    return {
        ack: pickText("ack", "acknowledgement"),
        previousSuggestion: pickText("previousSuggestion", "previous_context_suggestion", "previous"),
        currentRecommendation: pickText("currentRecommendation", "current_question_recommendation", "recommendation"),
        questionLead: pickText("questionLead", "question", "nextQuestionPrompt")
    };
};

const buildOptionLabelsText = (question = {}, runtimeOptionsByQuestionSlug = {}) => {
    const labels = getQuestionOptionLabels(question, runtimeOptionsByQuestionSlug);
    if (labels.length === 0) return "No predefined options.";
    return labels.map((label, index) => `${index + 1}. ${label}`).join("\n");
};

const formatQuestionWithOptions = (question = {}, runtimeOptionsByQuestionSlug = {}) => {
    const questionText = String(question?.text || "").trim();
    const optionsText = buildOptionLabelsText(question, runtimeOptionsByQuestionSlug);
    const hasOptions = getQuestionOptionLabels(question, runtimeOptionsByQuestionSlug).length > 0;
    if (!questionText) return "";
    if (!hasOptions) return questionText;
    return `${questionText}\n${optionsText}`;
};

const hasNumberedOptionsInMessage = (value = "") =>
    /\n\s*1\.\s+\S+/.test(String(value || ""));

const shouldAppendQuestionBlockForInfoRequest = ({
    assistantMessage = "",
    question = {},
    runtimeOptionsByQuestionSlug = {}
}) => {
    const message = String(assistantMessage || "").trim();
    if (!message) return true;

    const hasOptions = getQuestionOptionLabels(question, runtimeOptionsByQuestionSlug).length > 0;
    if (hasOptions) {
        if (hasNumberedOptionsInMessage(message)) return false;
        if (countOptionLabelsMentioned(message, question, runtimeOptionsByQuestionSlug) >= 2) return false;
        return true;
    }

    return !/[?؟]/.test(message);
};

const isCatchAllOption = (option = {}) =>
    /\b(other|not sure|unsure|something else|custom)\b/i.test(
        `${option?.label || ""} ${option?.canonicalLabel || ""} ${option?.value || ""} ${option?.canonicalValue || ""}`.trim()
    );

const buildRuntimeOptionSelectionPrompt = ({
    serviceName = "",
    servicePrompt = "",
    question = {},
    answersByQuestionText = {},
    answersBySlug = {},
    allQuestions = []
}) => {
    const adminControls = getQuestionAdminControls(question, servicePrompt);
    const canonicalOptions = getCanonicalQuestionOptions(question, adminControls).map((option) => ({
        value: option.value,
        label: option.canonicalLabel || option.label,
    }));
    const answersContext = buildAnswersContextLines(answersByQuestionText, {
        maxItems: 4,
        questionLimit: 70,
        answerLimit: 90,
    });
    const savedResponseContext = buildSavedResponseContextLines(
        answersBySlug,
        allQuestions,
        {},
        {
            maxItems: 4,
            questionLimit: 70,
            answerLimit: 90,
            subtitleLimit: 60,
        }
    );
    const questionContext = clipContextSnippet(buildAdminControlSummaryText(adminControls), 120);

    return `
You are selecting the best UI options for one questionnaire step.

Service: ${JSON.stringify(serviceName)}
Question: ${JSON.stringify(String(question?.text || ""))}
Question type: ${JSON.stringify(String(question?.type || "input"))}
Question context: ${JSON.stringify(questionContext || "none")}
Confirmed user context:
${answersContext || "- none yet"}

Saved AI memory:
${savedResponseContext || "- none yet"}

${buildAdminPromptSection(adminControls, "Admin Controls (highest priority when relevant)", {
        maxResponseRules: 3,
        maxValidationRules: 3,
        maxMappings: 3,
        contextLimit: 140,
    })}

Canonical option pool:
${JSON.stringify(canonicalOptions)}

Task:
1. Select the most relevant options to show right now for this user.
2. You may reorder and relabel options for clarity.
3. You must keep each "value" exactly from the canonical option pool.
4. Do not invent new values.
5. Prefer 2 to 5 options for single-select questions and 3 to 6 for multi-select questions.
6. If the pool includes "Other" or "Not sure", keep it when it could help.
7. Avoid options that are clearly irrelevant based on the confirmed context.
8. Keep labels short, user-facing, and natural.
9. If context is weak, keep the broadest sensible choices instead of over-filtering.
10. If Admin Controls define option priority or a preferred recommendation, keep those options visible and place them first whenever they still fit the user context.
11. If Admin Controls define mapping aliases, treat those aliases as valid clues for which option matters.

Return strict JSON only:
{
  "options": [
    { "value": "canonical_value", "label": "User-facing label" }
  ]
}
`;
};

const generateRuntimeOptionsForQuestion = async ({
    serviceName = "",
    servicePrompt = "",
    question = {},
    answersByQuestionText = {},
    answersBySlug = {},
    allQuestions = [],
    timingTracker = null,
}) => {
    const questionType = normalizeTextToken(question?.type || "input");
    const adminControls = getQuestionAdminControls(question, servicePrompt);
    const canonicalOptions = getCanonicalQuestionOptions(question, adminControls);
    if (!OPTION_QUESTION_TYPES.has(questionType) || canonicalOptions.length === 0) {
        return [];
    }

    if (canonicalOptions.length <= 4) {
        return canonicalOptions;
    }

    const prompt = buildRuntimeOptionSelectionPrompt({
        serviceName,
        servicePrompt,
        question,
        answersByQuestionText,
        answersBySlug,
        allQuestions
    });

    try {
        const response = await runTrackedAiCall({
            timingTracker,
            key: "runtime_option_selection_ai",
            label: "Select runtime options",
            detail: `Choosing visible options for "${String(question?.slug || question?.text || "question").trim()}".`,
            messages: [{ role: "user", content: prompt }],
            conversationHistory: [{ role: "system", content: "You are a JSON-only assistant. Return strict JSON only." }],
            selectedServiceName: "system_runtime_options",
        });

        if (!response?.success) {
            return canonicalOptions;
        }

        const parsed = parseJsonObjectFromRaw(response.message);
        const rows = Array.isArray(parsed?.options) ? parsed.options : [];
        if (rows.length === 0) {
            return canonicalOptions;
        }

        const canonicalByValue = canonicalOptions.reduce((acc, option) => {
            const key = normalizeTextToken(option.value || option.canonicalValue || option.label);
            if (key) acc[key] = option;
            return acc;
        }, {});

        const selectedOptions = rows
            .map((row) => {
                const canonical = canonicalByValue[normalizeTextToken(row?.value || "")];
                if (!canonical) return null;
                return normalizeOptionObject({
                    value: canonical.value,
                    canonicalValue: canonical.value,
                    canonicalLabel: canonical.canonicalLabel || canonical.label,
                    label: String(row?.label || canonical.label || canonical.canonicalLabel || canonical.value).trim(),
                    aliases: [
                        canonical.label,
                        canonical.canonicalLabel,
                        canonical.value,
                        row?.label
                    ]
                });
            })
            .filter(Boolean);

        const merged = mergeUniqueOptionsByValue(selectedOptions);
        const catchAllOptions = canonicalOptions.filter((option) => isCatchAllOption(option));
        const finalOptions = applyAdminControlsToOptions(
            mergeUniqueOptionsByValue(merged, catchAllOptions),
            adminControls
        );

        if (finalOptions.length === 0) {
            return canonicalOptions;
        }

        return finalOptions;
    } catch (error) {
        console.warn("[Runtime Options] Falling back to canonical options:", error?.message || error);
        return canonicalOptions;
    }
};

const buildAiGuidedQuestionMessage = async ({
    serviceName = "",
    servicePrompt = "",
    userLastMessage = "",
    currentQuestion = {},
    nextQuestion = {},
    answersByQuestionText = {},
    answersBySlug = {},
    allQuestions = [],
    runtimeOptionsByQuestionSlug = {},
    sideReply = "",
    bridgeSegments = [],
    isInitial = false,
    timingTracker = null,
}) => {
    const nextQuestionText = String(nextQuestion?.text || "").trim();
    if (!nextQuestionText) return "";

    const currentQuestionAdminControls = getQuestionAdminControls(currentQuestion, servicePrompt);
    const nextQuestionAdminControls = getQuestionAdminControls(nextQuestion, servicePrompt);
    const optionLabelsText = buildOptionLabelsText(nextQuestion, runtimeOptionsByQuestionSlug);
    const hasOptions = getQuestionOptionLabels(nextQuestion, runtimeOptionsByQuestionSlug).length > 0;
    const answeredCount = Object.values(answersBySlug || {}).filter((value) => hasAnswerValue(value)).length;
    const isPostFifthAckSuggestionMode = !isInitial && answeredCount >= 5;
    const nextQuestionIndex = nextQuestion?.slug
        ? findQuestionIndex(allQuestions, nextQuestion.slug)
        : -1;
    const isOpeningIntakeQuestion =
        Number.isInteger(nextQuestionIndex) && nextQuestionIndex >= 0 && nextQuestionIndex < 3;
    const answersContext = buildAnswersContextLines(answersByQuestionText, {
        maxItems: 6,
        questionLimit: 75,
        answerLimit: 100,
    });
    const savedResponseContext = buildSavedResponseContextLines(
        answersBySlug,
        allQuestions,
        runtimeOptionsByQuestionSlug,
        {
            maxItems: 5,
            questionLimit: 75,
            answerLimit: 100,
            subtitleLimit: 60,
        }
    );
    const subtitleMapContext = buildQuestionSubtitleMapLines(allQuestions, {
        maxItems: isOpeningIntakeQuestion ? 4 : 6,
        subtitleLimit: 70,
    });
    const currentQuestionSubtitle = clipContextSnippet(buildAdminControlSummaryText(currentQuestionAdminControls), 120);
    const nextQuestionSubtitle = clipContextSnippet(buildAdminControlSummaryText(nextQuestionAdminControls), 120);
    const serviceInstructionText = clipContextSnippet(
        parseAdminControlText(servicePrompt || "").contextText || "None",
        160
    );
    const guidanceHints = bridgeSegments
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .reduce((acc, segment) => {
            const normalized = segment.toLowerCase().replace(/\s+/g, " ").trim();
            if (!normalized || acc.seen.has(normalized)) return acc;
            acc.seen.add(normalized);
            acc.rows.push(segment);
            return acc;
        }, { seen: new Set(), rows: [] }).rows
        .slice(0, isPostFifthAckSuggestionMode ? 2 : 4)
        .join(" | ");

    const startTaskBlock = `
Task:
1) Start with one short warm welcome sentence.
2) Add one short friendly bridge sentence that feels human and personal.
3) Ask the required first question naturally (rephrase it; do not copy it verbatim).
4) Do NOT give suggestions, recommendations, best practices, feature ideas, or strategic advice.
5) If options exist, show them as numbered list using exact labels.
`;

    const openingIntakeTaskBlock = `
Task:
1) Briefly acknowledge the user's last answer in one natural sentence.
2) Add one short warm bridge sentence that feels friendly and personalized.
3) Ask the required next question naturally.
4) Do NOT give suggestions, recommendations, best practices, feature ideas, or strategic advice.
5) If options exist, show them as numbered list using the exact labels provided.
`;

    const followupTaskBlock = isOpeningIntakeQuestion
        ? openingIntakeTaskBlock
        : isPostFifthAckSuggestionMode
        ? `
Task:
1) Act like a human expert casually chatting with a client.
2) Acknowledge the user's last answer in 1-2 natural sentences.
3) Give one informative previous-context suggestion that feels personal by referencing one or two earlier confirmed answers or goals.
4) Give one informative, neutral guidance line for the required next question based on its context.
5) If options exist, explain what kind of choice matters here, but do NOT present any option as the best or recommended one unless the user explicitly asks for a recommendation.
6) Ask the required next question naturally (rephrase it; do not copy it verbatim).
7) If options exist, show them as numbered list using the exact labels provided.
`
        : `
Task:
1) Act like a human expert casually chatting with a client.
2) Enthusiastically acknowledge their last answer in 2-3 sentences.
3) Explain with 1-2 concrete reasons why their choice is a strong fit for their project.
4) If options exist, give thoughtful but neutral guidance for this next question and explain it with a practical reason, benefit, or tradeoff.
5) Do NOT tell the user which option is best, which one people should lean toward, or which option you recommend unless the user explicitly asks for a recommendation.
6) If user seems unsure/confused, add helpful guidance before asking.
7) Ask the required next question naturally (rephrase it; do not copy it verbatim).
8) If options exist, show them as numbered list using the exact labels provided.
`;

    const responseLengthRule = isOpeningIntakeQuestion
        ? "- Keep the full response under 50 words. Use up to two short lead-in sentences before the question: one acknowledgement or warm opener, plus one short bridge sentence."
        : isPostFifthAckSuggestionMode
        ? "- Keep it concise in post-question-5 mode and under 150 words total."
        : "- Keep the full response under 150 words total while staying natural and conversational.";

    const postFifthRuleBlock = isPostFifthAckSuggestionMode
        ? `
- This is post-question-5 mode: avoid duplicate acknowledgements/suggestions.
- Keep exactly one acknowledgement + one previous-context suggestion + one current-question recommendation before asking the question.
- Use current_question_context and next_question_context to shape these two suggestion lines.
- Make the previous-context line feel personal: reference one or two earlier confirmed answers, goals, constraints, or preferences in natural language.
- Keep the previous-context line generic across all services. Do NOT assume this is web development unless the user's earlier answers explicitly say so.
- If the latest answer seems inconsistent with earlier answers, handle it softly with phrases like "if that direction is still right" or "based on what you shared earlier" instead of saying the user is wrong.
- Make both suggestion lines informative: each should include one concrete reason, likely benefit, or practical tradeoff tied to the user's context.
- Keep the current-question line neutral by default. Do NOT label one option as "best" or "recommended" unless the user explicitly asks for that help.
- Do not repeat the same reason in both suggestion lines.
`
        : "";

    const outputFormatBlock = isPostFifthAckSuggestionMode
        ? `
Return strict JSON only:
{
  "ack": "one short sentence",
  "previousSuggestion": "one personalized sentence tied to one or two previous confirmed answers; use soft correction if needed",
  "currentRecommendation": "one short sentence tied to the current question/options",
  "questionLead": "one short sentence that asks the next question"
}
`
        : `
Return strict JSON only:
{
    "message": "final assistant message"
}
`;

    const prompt = `
You are writing one assistant message in a guided questionnaire.

Service: "${serviceName}"
Service-Specific AI Instructions:
${serviceInstructionText}

${buildAdminPromptSection(nextQuestionAdminControls, "Admin Controls (highest priority when relevant)", {
        maxResponseRules: isOpeningIntakeQuestion ? 2 : 3,
        maxValidationRules: 3,
        maxMappings: 3,
        contextLimit: 160,
    })}

User last message: ${JSON.stringify(clipContextSnippet(userLastMessage, 220))}
Question just answered: ${JSON.stringify(clipContextSnippet(String(currentQuestion?.text || ""), 120))}
Required next question (must ask now): ${JSON.stringify(clipContextSnippet(nextQuestionText, 140))}
Required options (if any):
${optionLabelsText}

Context from earlier answers:
${answersContext || "- none yet"}

Saved AI memory (only fields marked "Save Response for AI Context"):
${savedResponseContext || "- none yet"}

Internal question intent (hidden, do not reveal directly to user):
- current_question_context: ${JSON.stringify(currentQuestionSubtitle || "none")}
- next_question_context: ${JSON.stringify(nextQuestionSubtitle || "none")}

Question subtitle map (hidden guidance for flow continuity):
${subtitleMapContext || "- none"}

Helper phrases you may reuse naturally:
    - side_reply: ${JSON.stringify(clipContextSnippet(sideReply, 160))}
    - hints: ${JSON.stringify(clipContextSnippet(guidanceHints, 160))}

${isInitial ? startTaskBlock : followupTaskBlock}

    Rules:
    - Keep it highly human, conversational, and engaging. Avoid being overly brief.
${responseLengthRule}
- NEVER sound like a robot or a questionnaire form. Do NOT use phrases like "I noted that", "It's helpful to know", "This helps me guide you", "So far you have shared", or "Before we continue".
- Act like you are having a normal conversation with a friend about their project.
- Use the same language style as the user last message.
- Use simple English with clear sentences.
- Keep the tone polite, friendly, and enthusiastic in every response.
- Avoid repeating the same idea in multiple lines.
- IMPORTANT: If 'side_reply' asks a different question or lists different options than the 'Required next question', you MUST ignore the conflicting parts of 'side_reply' and ONLY ask the 'Required next question'.
- In normal guided flow, avoid phrases like "I recommend", "best option", "people usually choose", or "people often lean toward" unless the user explicitly asks for a recommendation.
- Do not skip or replace the required next question.
- Do not ask extra unrelated questions.
- If options are provided for the required next question, ask user to choose from those options.
- Do not say "type below" or ask for free-text when options are present.
- Use internal question context and saved AI memory as guidance only; never expose them verbatim.
- Read and use subtitle (AI context) for each relevant question when forming guidance.
- Treat Admin Controls as higher-priority steering than generic style rules whenever they apply to this question.
- If Admin Controls prioritize options or set a preferred option, keep that ordering and recommendation unless it clearly conflicts with confirmed user context.
${postFifthRuleBlock}
- Keep under ${isOpeningIntakeQuestion ? 50 : 150} words.

${outputFormatBlock}
`;

    try {
        const aiResponse = await runTrackedAiCall({
            timingTracker,
            key: "question_writer_ai",
            label: "Write guided question reply",
            detail: `Writing the next assistant message for "${String(nextQuestion?.slug || nextQuestionText || "question").trim()}".`,
            messages: [{ role: "user", content: prompt }],
            conversationHistory: [{ role: "system", content: "You are a JSON-only writing assistant. Return strict JSON only." }],
            selectedServiceName: "system_question_writer",
        });

        if (!aiResponse?.success) return "";

        if (isPostFifthAckSuggestionMode) {
            const structured = parsePostFifthMessageFields(aiResponse.message) || {};
            const fallbackMessage = parseMessageFieldFromJson(aiResponse.message);
            const fallbackRecentContext = clipSentence(
                buildRecentAnswerContextSnippet({
                    answersBySlug,
                    questions: allQuestions,
                    excludeSlug: currentQuestion?.slug,
                    runtimeOptionsByQuestionSlug
                }),
                170
            );
            const contextualSuggestionDraft = buildContextualSuggestionMessage({
                question: nextQuestion,
                answersBySlug,
                serviceName,
                servicePrompt,
                runtimeOptionsByQuestionSlug
            });
            const contextualRecommendation = extractCurrentRecommendationLine(contextualSuggestionDraft);

            const ack = clipSentence(
                structured.ack
                || extractFirstSentence(fallbackMessage)
                || "Great, thanks for sharing that.",
                170
            );
            const previousSuggestionRaw = structured.previousSuggestion
                || (fallbackRecentContext
                    ? `based on what you shared earlier about ${fallbackRecentContext}, this next choice should stay aligned with that direction.`
                    : "based on what you've already shared, this next choice should stay consistent with your direction.");
            const previousSuggestion = clipSentence(
                normalizeGuidanceSentence(previousSuggestionRaw),
                190
            );
            const currentRecommendationRaw = structured.currentRecommendation
                || contextualRecommendation
                || (nextQuestionSubtitle
                    ? `use this context: ${nextQuestionSubtitle}`
                    : "choose the option that best matches your first-launch goal.");
            const currentRecommendation = clipSentence(
                normalizeGuidanceSentence(currentRecommendationRaw),
                190
            );
            const strippedQuestionLead = stripExistingOptionLines(
                stripInlineOptionListTail(structured.questionLead || nextQuestionText),
                getQuestionOptionLabels(nextQuestion, runtimeOptionsByQuestionSlug)
            );
            const questionLead = clipSentence(
                strippedQuestionLead || nextQuestionText,
                180
            );

            const uniqueSegments = [];
            const seen = new Set();
            for (const segment of [ack, previousSuggestion, currentRecommendation, questionLead]) {
                const normalized = normalizeTextToken(segment);
                if (!normalized || seen.has(normalized)) continue;
                seen.add(normalized);
                uniqueSegments.push(segment);
            }

            let postFifthMessage = uniqueSegments.join("\n").trim();

            if (hasOptions && !hasNumberedOptionsInMessage(postFifthMessage)) {
                postFifthMessage = `${postFifthMessage}\n\n${optionLabelsText}`;
            }

            return postFifthMessage;
        }

        const parsedMessage = parseMessageFieldFromJson(aiResponse.message);
        if (!parsedMessage) {
            console.error("[buildAiGuidedQuestionMessage] AI Response gave empty or invalid parsed message.", aiResponse);
            return "";
        }

        // We removed the strict question mark test because the AI might naturally end with a colon like "Please choose an option below:"

        if (hasOptions) {
            const optionLabels = getQuestionOptionLabels(nextQuestion, runtimeOptionsByQuestionSlug);
            const normalizedParsedMessage = stripInlineOptionListTail(parsedMessage);
            if (!hasNumberedOptionsInMessage(normalizedParsedMessage)) {
                const cleanedMessage = stripExistingOptionLines(normalizedParsedMessage, optionLabels);
                return `${cleanedMessage} \n\n${optionLabelsText} `;
            }

            return normalizedParsedMessage;
        }

        return parsedMessage;
    } catch (e) {
        console.error("[buildAiGuidedQuestionMessage] Fatal error:", e);
        return "";
    }
};

const getBusinessNameGuardScenarioConfig = ({ scenario = "", brandName = "" } = {}) => {
    const cleanBrandName = String(brandName || "").trim();

    switch (scenario) {
        case "reserved_platform_brand":
            return {
                scenarioLabel: "reserved platform brand redirect",
                requiredFollowupQuestion: "Could you share your project or brand name?",
                scenarioInstructions: cleanBrandName
                    ? `${cleanBrandName} is already in use on this platform, so redirect the user to share their own project or brand name.`
                    : "The submitted brand name is already in use on this platform, so redirect the user to share their own project or brand name.",
                fallbackMessage: buildFriendlyMessage(
                    "Could you share your project or brand name?",
                    cleanBrandName
                        ? `${cleanBrandName} is already in use here.`
                        : "That name is already in use here."
                ),
            };
        case "ask_known_brand_affiliation":
            return {
                scenarioLabel: "known brand affiliation check",
                requiredFollowupQuestion: "Are you part of the team? What's your role there?",
                scenarioInstructions: cleanBrandName
                    ? `The user mentioned the known company ${cleanBrandName}. Respond naturally and verify whether they are part of that team, then ask their role there.`
                    : "The user mentioned a known company name. Respond naturally and verify whether they are part of that team, then ask their role there.",
                fallbackMessage: buildFriendlyMessage(
                    "Are you part of the team? What's your role there?",
                    cleanBrandName
                        ? `${cleanBrandName} is a well-known company.`
                        : "That sounds like a well-known company."
                ),
            };
        case "ask_pending_brand_role":
            return {
                scenarioLabel: "known brand role clarification",
                requiredFollowupQuestion: "What's your role there?",
                scenarioInstructions: cleanBrandName
                    ? `The user already confirmed they may be connected to ${cleanBrandName}, but their role is still unclear. Ask specifically for their role there.`
                    : "The user may be connected to a known company, but their role is still unclear. Ask specifically for their role there.",
                fallbackMessage: buildFriendlyMessage(
                    "What's your role there?",
                    "Got it."
                ),
            };
        case "deny_pending_brand":
            return {
                scenarioLabel: "known brand ownership denied redirect",
                requiredFollowupQuestion: "Could you share your project or brand name?",
                scenarioInstructions: cleanBrandName
                    ? `The user is not part of ${cleanBrandName}, so redirect them to share the project or brand name they actually want to use.`
                    : "The user is not part of the mentioned company, so redirect them to share the project or brand name they actually want to use.",
                fallbackMessage: buildFriendlyMessage(
                    "Could you share your project or brand name?",
                    "Understood."
                ),
            };
        default:
            return {
                scenarioLabel: "brand name clarification",
                requiredFollowupQuestion: "Could you share your project or brand name?",
                scenarioInstructions: "Ask a short follow-up that keeps the intake moving.",
                fallbackMessage: "Could you share your project or brand name?",
            };
    }
};

const buildBusinessNameGuardPrompt = ({
    serviceName = "",
    servicePrompt = "",
    scenario = "",
    brandName = "",
    userLastMessage = "",
    currentQuestion = {},
    answersByQuestionText = {},
    answersBySlug = {},
    allQuestions = [],
    runtimeOptionsByQuestionSlug = {},
    lastAssistantMessage = "",
} = {}) => {
    const scenarioConfig = getBusinessNameGuardScenarioConfig({ scenario, brandName });
    const answersContext = buildAnswersContextLines(answersByQuestionText);
    const savedResponseContext = buildSavedResponseContextLines(
        answersBySlug,
        allQuestions,
        runtimeOptionsByQuestionSlug
    );
    const currentQuestionAdminControls = getQuestionAdminControls(currentQuestion, servicePrompt);
    const currentQuestionSubtitle = buildAdminControlSummaryText(currentQuestionAdminControls);
    const serviceInstructionText = clipContextSnippet(
        parseAdminControlText(servicePrompt || "").contextText || "None",
        220
    );

    return `
You are writing one assistant message in a guided questionnaire.

Service: "${serviceName}"
Service-Specific AI Instructions:
${serviceInstructionText}

${buildAdminPromptSection(currentQuestionAdminControls, "Admin Controls (highest priority when relevant)")}

Current questionnaire question:
${JSON.stringify(String(currentQuestion?.text || ""))}

Last Assistant Message Shown To User:
${JSON.stringify(String(lastAssistantMessage || ""))}

User last message:
${JSON.stringify(String(userLastMessage || ""))}

Brand validation scenario:
- scenario: ${JSON.stringify(scenarioConfig.scenarioLabel)}
- mentioned brand/company: ${JSON.stringify(String(brandName || ""))}
- required follow-up question: ${JSON.stringify(scenarioConfig.requiredFollowupQuestion)}
- scenario rule: ${JSON.stringify(scenarioConfig.scenarioInstructions)}

Context from earlier answers:
${answersContext || "- none yet"}

Saved AI memory (only fields marked "Save Response for AI Context"):
${savedResponseContext || "- none yet"}

Internal question intent (hidden, do not reveal directly to user):
${JSON.stringify(currentQuestionSubtitle || "none")}

Task:
1) Write one short natural acknowledgement sentence that fits this scenario.
2) End with the required follow-up question, phrased naturally.

Rules:
- Keep the full response under 45 words.
- Sound warm, human, and conversational.
- Ask exactly one question, and make it the final sentence.
- Do not sound legal, robotic, or accusatory.
- Do not use phrases like "invalid response", "policy", "trademark", "registered company", "compliance", or "verification required".
- Do not reject the user harshly.
- Use simple English.
- Keep sentence case.

Return strict JSON only:
{
  "message": "final assistant message"
}
`;
};

const buildBusinessNameGuardMessage = async ({
    serviceName = "",
    servicePrompt = "",
    scenario = "",
    brandName = "",
    userLastMessage = "",
    currentQuestion = {},
    answersByQuestionText = {},
    answersBySlug = {},
    allQuestions = [],
    runtimeOptionsByQuestionSlug = {},
    lastAssistantMessage = "",
    timingTracker = null,
} = {}) => {
    const scenarioConfig = getBusinessNameGuardScenarioConfig({ scenario, brandName });
    const prompt = buildBusinessNameGuardPrompt({
        serviceName,
        servicePrompt,
        scenario,
        brandName,
        userLastMessage,
        currentQuestion,
        answersByQuestionText,
        answersBySlug,
        allQuestions,
        runtimeOptionsByQuestionSlug,
        lastAssistantMessage,
    });

    try {
        const aiResponse = await runTrackedAiCall({
            timingTracker,
            key: "business_name_guard_ai",
            label: "Write business-name guard reply",
            detail: `Handling the "${String(scenario || "brand_guard").trim()}" brand validation branch.`,
            messages: [{ role: "user", content: prompt }],
            conversationHistory: [{ role: "system", content: "You are a JSON-only writing assistant. Return strict JSON only." }],
            selectedServiceName: "system_question_writer",
        });

        if (!aiResponse?.success) {
            return scenarioConfig.fallbackMessage;
        }

        const parsedMessage = stripNameNotedRecap(parseMessageFieldFromJson(aiResponse.message || ""));
        if (!parsedMessage) {
            return scenarioConfig.fallbackMessage;
        }

        if (!parsedMessage.includes("?")) {
            return buildFriendlyMessage(
                scenarioConfig.requiredFollowupQuestion,
                parsedMessage
            );
        }

        return parsedMessage;
    } catch (error) {
        console.error("[buildBusinessNameGuardMessage] Fatal error:", error);
        return scenarioConfig.fallbackMessage;
    }
};

const checkMeaningfulChangeWithAI = async ({
    questionText,
    oldAnswer,
    newAnswer,
    timingTracker = null,
}) => {
    const prompt = `
You are an AI assistant helping a user build a project. The user had previously answered this question:
Question: "${questionText}"
Old Answer: "${oldAnswer}"

Based on the latest conversation, we naturally extracted a new answer for that question:
New Answer: "${newAnswer}"

Decide if the new answer represents a genuine, disruptive change of mind (e.g., they specifically chose "WordPress" earlier, but now want "Shopify", and they actively decided to switch paths).

CRITICAL EXCEPTIONS that are NOT considered a "meaningful change of mind" (return is_meaningful_change: false):
1. If the Old Answer implies the user was "Not sure", "Undecided", "Suggest best option", "I don't know", etc., and the New Answer is a concrete choice they just made based on our advice. This is a natural progression, NOT a change of mind!
2. If the New Answer is just a trivial rewording, elaboration, or synonymous expression of their Old Answer.

If it IS a genuine change, write a friendly confirmation message asking if they want to update their answer. Ask it conversationally ("I noticed you mentioned... Should we switch your choice to...?"). Do not force them to reply "Yes" or "No" in the text.

Return ONLY strict valid JSON in this exact format:
{
  "is_meaningful_change": boolean,
  "confirmation_message": "string (or empty if false)"
}
`;

    try {
        const evalResponse = await runTrackedAiCall({
            timingTracker,
            key: "meaningful_change_evaluator_ai",
            label: "Evaluate answer change",
            detail: `Checking whether "${String(questionText || "question").trim()}" changed meaningfully.`,
            messages: [{ role: "user", content: prompt }],
            conversationHistory: [{ role: "system", content: "You are a strict JSON-only evaluator. Output valid JSON." }],
            selectedServiceName: "system_evaluator",
        });
        if (evalResponse?.success) {
            const rawMsg = evalResponse.message.replace(/```(?:json)?|```/g, "").trim();
            const firstBrace = rawMsg.indexOf('{');
            const lastBrace = rawMsg.lastIndexOf('}');
            const cleanJson = (firstBrace >= 0 && lastBrace >= firstBrace) 
                ? rawMsg.substring(firstBrace, lastBrace + 1)
                : rawMsg;
            const parsed = JSON.parse(cleanJson.replace(/\*\*/g, ""));
            return {
                isMeaningful: !!parsed.is_meaningful_change,
                confirmMessage: parsed.confirmation_message || ""
            };
        }
    } catch (e) {
        console.error("[checkMeaningfulChangeWithAI] Failed:", e);
    }
    
    // Fallback
    return {
        isMeaningful: true,
        confirmMessage: `Are you sure you want to update your answer for "${questionText}" to "${newAnswer}"?`
    };
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

const getSemanticDependentIndexesForChanges = (
    questions = [],
    changes = [],
    answersBySlug = {},
) => {
    const dependentIndexes = new Set();

    for (const change of changes) {
        const changedQuestion = questions[change?.index];
        if (!changedQuestion) continue;

        const changedIdentity = getQuestionIdentityType(changedQuestion);
        if (changedIdentity !== "person_name") continue;

        const nextComparableAnswer = toComparableAnswer(change?.nextValue);
        if (!nextComparableAnswer) continue;

        for (let index = change.index + 1; index < questions.length; index += 1) {
            const question = questions[index];
            if (!question?.slug) continue;
            if (getQuestionIdentityType(question) !== "business_name") continue;

            const candidateAnswer = answersBySlug[question.slug];
            if (!hasAnswerValue(candidateAnswer)) continue;

            if (toComparableAnswer(candidateAnswer) === nextComparableAnswer) {
                dependentIndexes.add(index);
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

const clearRuntimeOptionsByIndexes = (runtimeOptionsByQuestionSlug = {}, questions = [], indexes = []) => {
    const nextRuntimeOptions = { ...(runtimeOptionsByQuestionSlug || {}) };
    for (const index of indexes) {
        const slug = questions[index]?.slug;
        if (!slug) continue;
        delete nextRuntimeOptions[slug];
    }
    return nextRuntimeOptions;
};

const applyExtractedAnswerUpdates = ({
    baseAnswersBySlug = {},
    existingAnswersBySlug = {},
    extractedAnswers = [],
    questionIndexBySlug = new Map(),
    questionsBySlug = new Map(),
    questionSlugSet = new Set(),
    runtimeOptionsByQuestionSlug = {},
    currentStep = -1,
    currentQuestion = null,
    ignoreSlug = "",
    correctionIntent = false,
    logPrefix = "[Auto Capture]"
}) => {
    const nextAnswers = { ...(baseAnswersBySlug || {}) };
    const updatedSlugs = [];
    const currentQuestionIdentity = getQuestionIdentityType(currentQuestion);

    for (const extracted of extractedAnswers || []) {
        const slug = extracted?.slug;
        if (!slug || (questionSlugSet.size > 0 && !questionSlugSet.has(slug))) continue;
        if (ignoreSlug && slug === ignoreSlug) continue;
        if (!hasAnswerValue(extracted?.answer)) continue;

        const targetIndex = questionIndexBySlug.get(slug);
        const targetQuestion = questionsBySlug.get(slug);
        if (targetQuestion && !doesExtractedAnswerFitQuestion(targetQuestion, extracted.answer, runtimeOptionsByQuestionSlug)) {
            continue;
        }

        const targetQuestionIdentity = getQuestionIdentityType(targetQuestion);
        if (
            !correctionIntent
            && Number.isInteger(currentStep)
            && currentStep >= 0
            && Number.isInteger(targetIndex)
            && targetIndex < currentStep
            && currentQuestionIdentity === "business_name"
            && targetQuestionIdentity === "person_name"
        ) {
            continue;
        }

        const normalizedExtractedAnswer = targetQuestion
            ? normalizeAnswerForQuestion(targetQuestion, extracted.answer, runtimeOptionsByQuestionSlug)
            : extracted.answer;

        const confidence = Number(extracted?.confidence);
        const normalizedConfidence = Number.isFinite(confidence) ? confidence : 0;
        const hasExistingAnswer = hasAnswerValue(existingAnswersBySlug[slug]);
        let minConfidence = hasExistingAnswer
            ? (correctionIntent ? EXTRACTION_CONFIDENCE_MIN : EXTRACTION_CONFIDENCE_UPDATE_MIN)
            : EXTRACTION_CONFIDENCE_MIN;

        if (Number.isInteger(currentStep) && currentStep >= 0 && Number.isInteger(targetIndex)) {
            if (targetIndex > currentStep + 1) {
                minConfidence = Math.max(minConfidence, 0.93);
            } else if (targetIndex > currentStep) {
                minConfidence = Math.max(minConfidence, 0.90);
            }
        }

        if (normalizedConfidence < minConfidence) continue;

        if (
            hasExistingAnswer &&
            toComparableAnswer(existingAnswersBySlug[slug]) === toComparableAnswer(normalizedExtractedAnswer)
        ) {
            continue;
        }

        nextAnswers[slug] = normalizedExtractedAnswer;
        updatedSlugs.push(slug);

        if (Number.isInteger(targetIndex)) {
            console.log(
                `${logPrefix} Updated "${slug}" at step ${targetIndex} (confidence = ${normalizedConfidence.toFixed(2)})`
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
            .replace(/^\s*```(?: json) ?\s */i, "")
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
    validSlugs = new Set(),
    questionsBySlug = new Map(),
    runtimeOptionsByQuestionSlug = {},
    service = {}
}) => {
    const merged = { ...(baseAnswers || {}) };

    for (const extracted of extractedAnswers || []) {
        const slug = extracted?.slug;
        if (!slug || (validSlugs.size > 0 && !validSlugs.has(slug))) continue;
        if (!hasAnswerValue(extracted?.answer)) continue;

        const question = questionsBySlug.get(slug);
        const blockedByBudgetMinimum = getBudgetMinimumValidationResult({
            question,
            service,
            answerText: extracted.answer,
        });
        if (blockedByBudgetMinimum) {
            continue;
        }

        const normalizedExtractedAnswer = question
            ? normalizeAnswerForQuestion(question, extracted.answer, runtimeOptionsByQuestionSlug)
            : extracted.answer;

        const confidence = Number(extracted?.confidence);
        const normalizedConfidence = Number.isFinite(confidence) ? confidence : 0;
        const existing = merged[slug];

        if (!hasAnswerValue(existing)) {
            if (normalizedConfidence >= 0.65) {
                merged[slug] = normalizedExtractedAnswer;
            }
            continue;
        }

        if (
            toComparableAnswer(existing) !== toComparableAnswer(normalizedExtractedAnswer) &&
            normalizedConfidence >= 0.92
        ) {
            merged[slug] = normalizedExtractedAnswer;
        }
    }

    return merged;
};

const buildQuestionAnswerCoverage = (questions = [], answersBySlug = {}, runtimeOptionsByQuestionSlug = {}) =>
    questions.map((question) => ({
        slug: question?.slug || "",
        question: question?.text || "",
        answer: hasAnswerValue(answersBySlug[question?.slug])
            ? (buildQuestionDisplayAnswer(question, answersBySlug[question.slug], runtimeOptionsByQuestionSlug) || String(answersBySlug[question.slug]))
            : null
    }));

const extractAnswersFromMessage = async ({
    serviceName = "",
    message = "",
    questions = [],
    timingTracker = null,
}) => {
    if (!message || !Array.isArray(questions) || questions.length === 0) {
        return [];
    }

    const compactQuestions = questions.map((q) => ({
        slug: q.slug,
        question: q.text,
        type: q.type || "text",
        subtitle: buildAdminControlSummaryText(getQuestionAdminControls(q)),
        saveResponse: Boolean(q?.saveResponse),
        options: getCanonicalQuestionOptions(q).map((opt) => ({
            value: opt?.value ?? "",
            label: opt?.label ?? "",
            aliases: Array.isArray(opt?.aliases) ? opt.aliases : [],
        }))
    }));

    const extractorPrompt = `
You are extracting questionnaire answers from a single user message.

Service: ${serviceName}
User message: ${JSON.stringify(message)}
Questionnaire: ${JSON.stringify(compactQuestions)}

Rules:
- Return answers that are explicitly stated or clearly implied by the user's message.
- For option-based questions, if the user's meaning clearly matches one option, return that exact option label as the answer.
- Use any provided option aliases when they clearly map the user's wording to an option.
- If a question is not clearly answered, skip it.
- Do not force a match when multiple options seem plausible.
- Keep free-text answers short and close to what the user said.
- Never map a company/brand/business name to a personal/client/contact name question, and never map a personal name to a company/brand/business name question, unless the user explicitly labels both in the same message.
- You may mark later questions as answered if this single message clearly answers them.
- Use higher confidence only when the answer is clear enough that the question can be safely skipped.
- If the message clearly answers the immediate next question, confidence should usually be 0.90 or higher.
- If the message clearly answers a later future question, confidence should usually be 0.93 or higher.
- Use each question's subtitle as intent guidance only.

Return only valid JSON in this format:
{
  "answers": [
    { "slug": "question_slug", "answer": "user answer", "confidence": 0.0 }
  ]
}
`;

    try {
        const extractionResponse = await runTrackedAiCall({
            timingTracker,
            key: "message_answer_extraction_ai",
            label: "Extract answers from message",
            detail: "Scanning the latest user message for current and future questionnaire answers.",
            messages: [{ role: "user", content: extractorPrompt }],
            conversationHistory: [{ role: "system", content: "You are a JSON-only extractor. Output strict JSON only." }],
            selectedServiceName: "system_extractor",
        });

        if (!extractionResponse?.success) return [];
        return parseAnswerExtractionResponse(extractionResponse.message);
    } catch {
        return [];
    }
};

const extractAnswersFromConversation = async ({
    serviceName = "",
    history = [],
    questions = [],
    timingTracker = null,
}) => {
    if (!Array.isArray(history) || history.length === 0) return [];
    if (!Array.isArray(questions) || questions.length === 0) return [];

    const compactQuestions = questions.map((q) => ({
        slug: q.slug,
        question: q.text,
        type: q.type || "text",
        subtitle: buildAdminControlSummaryText(getQuestionAdminControls(q)),
        saveResponse: Boolean(q?.saveResponse),
        options: getCanonicalQuestionOptions(q).map((opt) => ({
            value: opt?.value ?? "",
            label: opt?.label ?? "",
            aliases: Array.isArray(opt?.aliases) ? opt.aliases : [],
        }))
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
- Return answers only from USER messages.
- If one user message answers multiple questions, return all matched questions.
- For option-based questions, if the user's wording clearly maps to one option, return that exact option label.
- Use any provided option aliases when they clearly map the user's wording to an option.
- You may use semantic understanding to match a user's wording to the correct question or option when it is clearly implied.
- Do not force uncertain matches.
- Prefer concise answer text.
- Use confidence 0.90+ only for clear, reliable matches and 0.93+ for strong future-question matches.
- Use each question's subtitle as intent guidance only.

Return strict JSON only:
{
  "answers": [
    { "slug": "question_slug", "answer": "answer text", "confidence": 0.0 }
  ]
}
`;

    try {
        const extractionResponse = await runTrackedAiCall({
            timingTracker,
            key: "conversation_answer_extraction_ai",
            label: "Extract answers from transcript",
            detail: "Scanning the whole service transcript before proposal generation.",
            messages: [{ role: "user", content: extractorPrompt }],
            conversationHistory: [{ role: "system", content: "You are a JSON-only extractor. Output strict JSON only." }],
            selectedServiceName: "system_extractor",
        });

        if (!extractionResponse?.success) return [];
        return parseAnswerExtractionResponse(extractionResponse.message);
    } catch {
        return [];
    }
};

const determineConfirmationIntent = async ({
    assistantPrompt = "",
    userMessage = "",
    timingTracker = null,
}) => {
    const normalized = String(userMessage || "").toLowerCase();
    if (/\b(yes|yeah|yep|sure|okay|ok|go ahead|continue|start)\b/.test(normalized)) return "yes";
    if (/\b(no|nope|stop|cancel|not now|don't|do not)\b/.test(normalized)) return "no";

    const intentObj = await runTrackedAiCall({
        timingTracker,
        key: "confirmation_intent_ai",
        label: "Classify confirmation intent",
        detail: "Determining whether the user confirmed, rejected, or sidestepped a yes/no prompt.",
        messages: [
            { role: "system", content: "You extract intent from user confirmation responses." },
            { role: "user", content: `The assistant asked: "${assistantPrompt}"\nThe user replied: "${userMessage}"\nDoes the user confirm the request (YES), reject it (NO), or say something unrelated (UNKNOWN)? Return ONLY JSON: {"intent": "yes" | "no" | "unknown"}` }
        ],
        conversationHistory: [{ role: "system", content: "You are a JSON-only API. Output strictly valid JSON." }],
        selectedServiceName: "system_validator",
    });

    if (intentObj.success) {
        const parsed = parseJsonObjectFromRaw(intentObj.message);
        const intent = String(parsed?.intent || "").toLowerCase().trim();
        if (intent === "yes" || intent === "no" || intent === "unknown") {
            return intent;
        }
    }

    return "unknown";
};

const analyzePostProposalFollowup = async ({
    currentService = {},
    userMessage = "",
    activeServices = [],
    timingTracker = null,
}) => {
    const cleanUserMessage = String(userMessage || "").trim();
    if (!cleanUserMessage) {
        return {
            action: "reply_only",
            targetServiceSlug: "",
            targetServiceName: "",
            reply: "I already shared the current proposal. If you want another proposal for this service, tell me and I will confirm before generating it."
        };
    }

    const availableServices = (Array.isArray(activeServices) ? activeServices : [])
        .map((service) => ({
            slug: String(service?.slug || "").trim(),
            name: String(service?.name || "").trim(),
        }))
        .filter((service) => service.slug && service.name);

    const prompt = `
You are classifying a follow-up message that arrived AFTER a proposal was already generated.

Current Service:
${JSON.stringify({ slug: currentService?.slug || "", name: currentService?.name || "" })}

Available Services:
${JSON.stringify(availableServices)}

User Message:
"${cleanUserMessage}"

Rules:
- If the user wants another proposal/update/regeneration for the CURRENT service, set action to "regenerate_current".
- If the user wants a proposal for a DIFFERENT service from the available list, set action to "different_service" and return the exact targetServiceSlug/targetServiceName from the list.
- If the message is only a general follow-up or clarification and is NOT asking to create/start another proposal, set action to "reply_only".
- If the user mentions a different service, the reply should clearly say it is a different service from the current one and that this chat will stay on the current selected service.
- Never say the proposal is already being generated.
- Keep reply short, clear, and conversational.

Return strict JSON only:
{
  "action": "reply_only" | "regenerate_current" | "different_service",
  "targetServiceSlug": string,
  "targetServiceName": string,
  "reply": string
}
`;

    try {
        const aiResponse = await runTrackedAiCall({
            timingTracker,
            key: "post_proposal_followup_ai",
            label: "Classify post-proposal follow-up",
            detail: "Deciding whether the new message is a regenerate, service switch, or simple follow-up.",
            messages: [{ role: "user", content: prompt }],
            conversationHistory: [{ role: "system", content: "You are a JSON-only classifier. Output strict JSON only." }],
            selectedServiceName: "system_validator",
        });

        if (!aiResponse?.success) {
            throw new Error("AI follow-up classification failed");
        }

        const parsed = parseJsonObjectFromRaw(aiResponse.message);
        const action = String(parsed?.action || "").trim().toLowerCase();
        const targetServiceSlug = String(parsed?.targetServiceSlug || "").trim();
        const targetServiceName = String(parsed?.targetServiceName || "").trim();
        const reply = String(parsed?.reply || "").trim();
        const validAction = ["reply_only", "regenerate_current", "different_service"].includes(action)
            ? action
            : "reply_only";

        const matchedService = availableServices.find((service) => service.slug === targetServiceSlug)
            || availableServices.find((service) => normalizeTextToken(service.name) === normalizeTextToken(targetServiceName));

        if (validAction === "different_service" && matchedService) {
            return {
                action: "different_service",
                targetServiceSlug: matchedService.slug,
                targetServiceName: matchedService.name,
                reply: buildLockedServiceReply({
                    currentServiceName: currentService?.name || "current service",
                    targetServiceName: matchedService.name,
                })
            };
        }

        if (validAction === "regenerate_current") {
            return {
                action: "regenerate_current",
                targetServiceSlug: String(currentService?.slug || "").trim(),
                targetServiceName: String(currentService?.name || "").trim(),
                reply: reply || `I can prepare a fresh ${currentService?.name || "service"} proposal based on your latest message.`
            };
        }

        return {
            action: "reply_only",
            targetServiceSlug: "",
            targetServiceName: "",
            reply: reply || "I already shared the current proposal. If you want another proposal for this service, tell me and I will confirm before generating it."
        };
    } catch {
        return {
            action: "reply_only",
            targetServiceSlug: "",
            targetServiceName: "",
            reply: "I already shared the current proposal. If you want another proposal for this service, tell me and I will confirm before generating it."
        };
    }
};

const buildCurrentQuestionValidationPrompt = ({
    serviceName = "",
    servicePrompt = "",
    currentQuestionText = "",
    currentQuestionOptions = [],
    currentQuestionNumberedOptions = [],
    currentQuestionCanonicalOptions = [],
    knownContextByQuestion = {},
    savedResponseContext = "",
    currentQuestionSubtitle = "",
    userMessageText = "",
    attachmentContextText = "",
    urlContextText = "",
    attachmentInferredAnswer = "",
    lastAssistantMessage = "",
    validationResponseRules = "",
}) => {
    const adminControls = mergeAdminControls(
        parseAdminControlText(currentQuestionSubtitle || ""),
        parseAdminControlText(servicePrompt || "")
    );
    const currentQuestionContext = buildAdminControlSummaryText(adminControls);
    const answersContext = buildAnswersContextLines(knownContextByQuestion, {
        maxItems: 5,
        questionLimit: 70,
        answerLimit: 90,
    });
    const visibleOptions = Array.isArray(currentQuestionOptions) ? currentQuestionOptions : [];
    const numberedOptions = Array.isArray(currentQuestionNumberedOptions) ? currentQuestionNumberedOptions : [];
    const canonicalOptions = Array.isArray(currentQuestionCanonicalOptions) ? currentQuestionCanonicalOptions : [];
    const adminInstructionText = clipContextSnippet(
        parseAdminControlText(servicePrompt || "").contextText || "None",
        160
    );
    const savedMemoryText = savedResponseContext
        ? clipContextSnippet(savedResponseContext, 500)
        : "- none yet";
    const clippedLastAssistantMessage = clipContextSnippet(lastAssistantMessage || "None", 220);

    return `
You are validating one answer in a guided questionnaire for the "${serviceName}" service.

Service instructions:
${adminInstructionText}

${buildAdminPromptSection(adminControls, "Admin Controls (highest priority when relevant)", {
        maxResponseRules: 3,
        maxValidationRules: 4,
        maxMappings: 3,
        contextLimit: 160,
    })}

Current question: ${JSON.stringify(currentQuestionText)}
Visible numbered options: ${JSON.stringify(numberedOptions)}
Canonical option pool: ${JSON.stringify(canonicalOptions)}
Earlier confirmed answers:
${answersContext || "- none yet"}
Saved AI memory:
${savedMemoryText}
Hidden current-question intent:
${JSON.stringify(clipContextSnippet(currentQuestionContext || "none", 140))}
Last Assistant Message Shown To User:
${JSON.stringify(clippedLastAssistantMessage)}
User answer:
${JSON.stringify(userMessageText || "")}
Attachment context:
${attachmentContextText ? JSON.stringify(clipContextSnippet(attachmentContextText, 700)) : '"None"'}
URL context:
${urlContextText ? JSON.stringify(clipContextSnippet(urlContextText, 500)) : '"None"'}
Attachment-inferred answer:
${JSON.stringify(attachmentInferredAnswer || "")}

Validation rules:
- Greeting only, gibberish, or irrelevant text when details are needed => INVALID.
- Direct side-question, confusion, advice request, "not sure", or "other" => INFO_REQUEST.
- If direct text is empty but attachment/URL context clearly answers the question => VALID.
- If the reply clearly chooses by option number, map it using the visible numbered options.
- Do not mistake descriptive numbers like "1 month" or "10 pages" for option numbers unless the user is clearly choosing by number.
- If the assistant clearly recommended exactly one visible option and the user now gives brief agreement or approval instead of repeating it, treat that as VALID.
- In that case, set "normalizedAnswer" to the exact recommended option label or value from the visible or canonical option pool.
- If the user names a different option, follow the latest user intent.
- For business/brand-name questions, "Catalance" or direct variants => INVALID and ask for their own project or brand name.
- Other well-known company names are not auto-invalid. Do NOT automatically reject them. If team affiliation/role is already clear, they may be VALID; otherwise ask whether they are part of that team and what their role is.
- If the answer logically implies one option (example: "Elementor" implies WordPress), accept it as VALID.
- If the user asks for an unsupported platform/tool that conflicts with all available options, return INFO_REQUEST and explain the supported direction briefly.
- Do not force literal option matching when the user's meaning is already clear.
- Custom direct answers can still be VALID even if off-menu. Preserve the user's exact value in normalizedAnswer when it still answers the question.
- Use visible options as the shown menu and canonical option pool as extra acceptable matches.
- Honor admin alias/mapping rules when the meaning is clear.
- Only re-list visible options if needed for guidance.

Response rules:
${validationResponseRules}
- Use hidden intent and saved memory only as guidance. Never expose those labels directly.

Return strict JSON only:
{
  "isValid": boolean,
  "status": "valid_answer" | "invalid_answer" | "info_request",
  "message": string,
  "normalizedAnswer": string
}
Do not use markdown, code fences, or bold text.
`;
};

const buildServiceStartState = async ({
    service,
    existingPayload = {},
    prefilledAnswersBySlug = {},
    startContext = {},
    timingTracker = null,
}) => {
    let initialAnswersBySlug = Object.entries(prefilledAnswersBySlug || {}).reduce((acc, [slug, value]) => {
        if (slug && hasAnswerValue(value)) {
            acc[slug] = value;
        }
        return acc;
    }, {});
    let activeStartContext = startContext;
    let currentStep = findNextUnansweredStep(service.questions, initialAnswersBySlug);

    // Avoid auto-completing an entire questionnaire before the first visible message.
    if (currentStep >= service.questions.length && Object.keys(initialAnswersBySlug).length > 0) {
        initialAnswersBySlug = {};
        activeStartContext = {};
        currentStep = 0;
    }

    const firstQuestionDefinition = service?.questions?.[currentStep];
    const runtimeOptionsByQuestionSlug = {};
    let answersPayload = buildPersistedAnswersPayload(
        initialAnswersBySlug,
        service.questions,
        { existingPayload }
    );

    if (firstQuestionDefinition?.slug) {
        const runtimeOptions = await generateRuntimeOptionsForQuestion({
            serviceName: service.name,
            servicePrompt: service.aiPrompt || "",
            question: firstQuestionDefinition,
            answersByQuestionText: answersPayload.byQuestionText,
            answersBySlug: answersPayload.bySlug,
            allQuestions: service.questions,
            timingTracker,
        });
        if (runtimeOptions.length > 0) {
            runtimeOptionsByQuestionSlug[firstQuestionDefinition.slug] = runtimeOptions;
        }
        answersPayload = buildPersistedAnswersPayload(
            initialAnswersBySlug,
            service.questions,
            {
                runtimeOptionsByQuestionSlug,
                existingPayload
            }
        );
    }

    const firstQuestionConfig = {
        type: firstQuestionDefinition?.type || "text",
        options: getDisplayedQuestionOptions(firstQuestionDefinition, runtimeOptionsByQuestionSlug)
    };
    const startPrefillBridge = buildSessionStartPrefillBridge(activeStartContext);
    const aiFirstQuestion = firstQuestionDefinition
        ? await buildAiGuidedQuestionMessage({
            serviceName: service.name,
            servicePrompt: service.aiPrompt || "",
            userLastMessage: startPrefillBridge ? String(activeStartContext?.acknowledgedAnswer || "") : "",
            currentQuestion: startPrefillBridge ? activeStartContext?.acknowledgedQuestion || {} : {},
            nextQuestion: firstQuestionDefinition,
            answersByQuestionText: answersPayload.byQuestionText,
            answersBySlug: answersPayload.bySlug,
            allQuestions: service.questions,
            runtimeOptionsByQuestionSlug,
            sideReply: "",
            bridgeSegments: startPrefillBridge ? [startPrefillBridge] : [],
            isInitial: !startPrefillBridge,
            timingTracker,
        })
        : "";
    const isNameFirstQuestion = NAME_QUESTION_REGEX.test(String(firstQuestionDefinition?.text || ""));
    const firstQuestionFallbackPrompt = firstQuestionDefinition
        ? (
            getQuestionOptionLabels(firstQuestionDefinition, runtimeOptionsByQuestionSlug).length > 0
                ? formatQuestionWithOptions(firstQuestionDefinition, runtimeOptionsByQuestionSlug)
                : (firstQuestionDefinition.text || "How can I help you regarding this service?")
        )
        : `How can I help you regarding ${service?.name || "this service"}?`;
    const firstQuestion = aiFirstQuestion
        || (startPrefillBridge
            ? buildFriendlyMessage(
                firstQuestionFallbackPrompt,
                combineInlineMessages(
                    startPrefillBridge,
                    buildPersonalizedQuestionBridge({
                        nextQuestionText: firstQuestionDefinition?.text || "",
                        answersByQuestionText: answersPayload.byQuestionText,
                        serviceName: service.name
                    })
                )
            )
            : (isNameFirstQuestion
                ? buildServiceAwareOpeningMessage(service.name)
                : firstQuestionFallbackPrompt));

    return {
        answersPayload,
        firstQuestion,
        firstQuestionConfig,
        runtimeOptionsByQuestionSlug,
        currentStep
    };
};

const generateProposalResponseForSession = async ({
    sessionId,
    session,
    service,
    questions,
    runtimeOptionsByQuestionSlug = {},
    persistedAnswers,
    userMessageForReasoning = "",
    userMessageText = "",
    timingTracker = null,
}) => {
    // Reload messages fresh from DB so we have the full conversation history.
    const freshSession = timingTracker
        ? await timingTracker.measure(
            "proposal_reload_session",
            () => prisma.aiGuestSession.findUnique({
                where: { id: sessionId },
                select: buildGuestSessionCoreSelect()
            }),
            {
                label: "Reload proposal session",
                category: "db",
                detail: "Reloading messages before proposal generation.",
            },
        )
        : await prisma.aiGuestSession.findUnique({
            where: { id: sessionId },
            select: buildGuestSessionCoreSelect()
        });

    const scopedMessages = getServiceScopedMessages(
        freshSession?.messages || session.messages,
        getActiveServiceStartedAt(session?.answers || {})
    );
    const proposalHistory = [
        ...scopedMessages.map((message) => ({ role: message.role, content: message.content })),
        ...((userMessageForReasoning || userMessageText)
            ? [{ role: "user", content: userMessageForReasoning || userMessageText }]
            : [])
    ];
    const questionsBySlug = new Map(
        (questions || [])
            .filter((question) => question?.slug)
            .map((question) => [question.slug, question])
    );
    const allQuestionSlugs = new Set((questions || []).map((question) => question.slug).filter(Boolean));
    const extractedFromConversation = await extractAnswersFromConversation({
        serviceName: service.name,
        history: proposalHistory,
        questions,
        timingTracker,
    });
    const proposalAnswersBySlug = mergeExtractedAnswers({
        baseAnswers: persistedAnswers.bySlug,
        extractedAnswers: extractedFromConversation,
        validSlugs: allQuestionSlugs,
        questionsBySlug,
        runtimeOptionsByQuestionSlug,
        service
    });
    const proposalAnswersPayload = buildPersistedAnswersPayload(proposalAnswersBySlug, questions, {
        runtimeOptionsByQuestionSlug,
        existingPayload: session.answers || {}
    });

    if (extractedFromConversation.length > 0) {
        console.log(
            `[Proposal Enrichment] merged ${extractedFromConversation.length} transcript-derived answer(s).`
        );
    }

    const proposalContext = {
        serviceName: service.name,
        serviceId: service.slug,
        proposalStructure: service.proposalStructure || "",
        proposalPrompt: service.proposalPrompt || "",
        questionnaireAnswers: proposalAnswersPayload.byQuestionText,
        questionnaireAnswersBySlug: proposalAnswersPayload.bySlug,
        serviceQuestionAnswers: buildQuestionAnswerCoverage(
            questions,
            proposalAnswersPayload.bySlug,
            runtimeOptionsByQuestionSlug
        ),
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

    const responseContent = timingTracker
        ? await timingTracker.measure(
            "proposal_markdown_generation",
            () => generateProposalMarkdown(
                proposalContext,
                proposalHistory,
                service.name,
                service.aiPrompt || "",
                {
                    proposalStructure: service.proposalStructure || "",
                    proposalPrompt: service.proposalPrompt || ""
                }
            ),
            {
                label: "Generate proposal markdown",
                category: "ai",
                detail: "Producing the final proposal document.",
            },
        )
        : await generateProposalMarkdown(
            proposalContext,
            proposalHistory,
            service.name,
            service.aiPrompt || "",
            {
                proposalStructure: service.proposalStructure || "",
                proposalPrompt: service.proposalPrompt || ""
            }
        );

    const nextAnswers = mergeAnswersUiState(
        proposalAnswersPayload,
        {
            [PROPOSAL_GENERATED_AT_KEY]: new Date().toISOString(),
            [PENDING_PROPOSAL_STATE_KEY]: null
        }
    );

    if (
        JSON.stringify(nextAnswers) !== JSON.stringify(session.answers || {})
    ) {
        if (timingTracker) {
            await timingTracker.measure(
                "proposal_answers_update",
                () => prisma.aiGuestSession.update({
                    where: { id: sessionId },
                    data: { answers: nextAnswers }
                }),
                {
                    label: "Save proposal answers",
                    category: "db",
                    detail: "Persisting enriched answers after proposal generation.",
                },
            );
        } else {
            await prisma.aiGuestSession.update({
                where: { id: sessionId },
                data: { answers: nextAnswers }
            });
        }
    }

    return responseContent;
};

// @desc    Start a new guest session with guided questions
// @route   POST /api/guest/start
// @access  Public
export const startGuestSession = asyncHandler(async (req, res) => {
    const requestTimingTracker = createRequestTimingTracker("guest_start");
    attachTimingMetaToResponse(res, requestTimingTracker, {
        routeLabel: "/guest/start",
        requestLabel: `service=${String(req.body?.serviceId || "").trim() || "unknown"}`,
    });
    const { serviceId, prefillName = "", sharedAnswers = {} } = req.body; // Can be slug or ID

    if (!serviceId) {
        throw new AppError("Service ID is required", 400);
    }

    // 1. Find the Service and its Questions
    const service = await requestTimingTracker.measure(
        "load_selected_service",
        () => getServiceWithOrderedQuestions({
            identifier: serviceId,
            lookup: "slug_or_id",
            activeOnly: true,
        }),
        {
            label: "Load selected service",
            category: "db",
            detail: "Fetching the chosen service and its question set.",
        },
    );

    if (!service) {
        throw new AppError("Service not found or inactive", 404);
    }

    const startedAt = new Date().toISOString();
    const sessionStartPrefill = buildSessionStartPrefill({
        questions: service.questions,
        prefillName,
        sharedAnswers,
    });
    const {
        answersPayload,
        firstQuestion,
        firstQuestionConfig,
        currentStep,
    } = await requestTimingTracker.measure(
        "build_start_state",
        () => buildServiceStartState({
            service,
            prefilledAnswersBySlug: sessionStartPrefill.answersBySlug,
            startContext: sessionStartPrefill,
            existingPayload: {
                uiState: {
                    [ACTIVE_SERVICE_STARTED_AT_KEY]: startedAt
                }
            },
            timingTracker: requestTimingTracker,
        }),
        {
            label: "Build starting chat state",
            category: "logic",
            detail: "Preparing the first question, prefill bridge, and runtime options.",
        },
    );

    // 2. Create Session
    const session = await requestTimingTracker.measure(
        "create_guest_session",
        () => prisma.aiGuestSession.create({
            data: {
                serviceId: service.slug, // Store slug for consistency
                currentStep,
                answers: answersPayload,
            },
        }),
        {
            label: "Create guest session",
            category: "db",
            detail: "Saving the new guest session row.",
        },
    );

    // 3. Create Initial assistant message (The First Question)
    await requestTimingTracker.measure(
        "save_first_assistant_message",
        () => prisma.aiGuestMessage.create({
            data: {
                sessionId: session.id,
                role: "assistant",
                content: firstQuestion,
            },
        }),
        {
            label: "Save first assistant message",
            category: "db",
            detail: "Persisting the first visible assistant question.",
        },
    );

    res.status(201).json({
        success: true,
        sessionId: session.id,
        message: firstQuestion,
        inputConfig: firstQuestionConfig,
        history: [{ role: "assistant", content: firstQuestion }],
        sharedAnswers: buildSharedSessionAnswers({
            questions: service.questions,
            sessionAnswers: answersPayload,
        }),
    });
});

// @desc    Handle chat: Answer questions -> Generate Proposal
// @route   POST /api/guest/chat
// @access  Public
export const guestChat = asyncHandler(async (req, res) => {
    const requestTimingTracker = createRequestTimingTracker("guest_chat");
    attachTimingMetaToResponse(res, requestTimingTracker, {
        routeLabel: "/guest/chat",
        requestLabel: `session=${String(req.body?.sessionId || "").trim() || "unknown"}`,
    });
    const { sessionId, message } = req.body;

    const incomingArray = Array.isArray(message)
        ? message.filter(Boolean).map(String)
        : [];
    const messageText = Array.isArray(message)
        ? incomingArray.join(", ")
        : (message ?? "");
    const parsedIncomingMessage = parseAttachmentTokensFromMessage(messageText);
    const trimmedMessageText = parsedIncomingMessage.plainText.toString().trim();
    const safeMessageText = messageText.toString().trim();
    const persistedUserMessageContent = safeMessageText || trimmedMessageText;
    const uploadedAttachments = parsedIncomingMessage.attachments;
    const sharedUrls = parsedIncomingMessage.urls;

    console.log(`\n--- [Guest Chat] Session: ${sessionId} ---`);
    console.log(`[User]: ${safeMessageText || message}`);

    if (!sessionId || (!trimmedMessageText && incomingArray.length === 0 && uploadedAttachments.length === 0 && sharedUrls.length === 0)) {
        throw new AppError("Session ID and message are required", 400);
    }

    // 1. Fetch Session
    const session = await requestTimingTracker.measure(
        "load_guest_session",
        () => prisma.aiGuestSession.findUnique({
            where: { id: sessionId },
            select: buildGuestSessionCoreSelect(),
        }),
        {
            label: "Load guest session",
            category: "db",
            detail: "Loading the session and its message history.",
        },
    );

    if (!session) {
        throw new AppError("Session not found", 404);
    }

    // 2. Fetch Service Questions
    const service = await requestTimingTracker.measure(
        "load_service_context",
        () => getServiceWithOrderedQuestions({
            identifier: session.serviceId,
            lookup: "slug",
            activeOnly: false,
        }),
        {
            label: "Load service context",
            category: "db",
            detail: "Loading the active service definition and ordered questions.",
        },
    );

    if (!service) {
        throw new AppError("Service context lost", 404);
    }

    const questions = service.questions;
    const currentStep = session.currentStep;
    const currentQuestion = questions[currentStep];
    const sessionRuntimeOptionsByQuestionSlug = getRuntimeOptionsByQuestionSlug(session.answers || {});

    // --- CONFIRMATION INTERCEPT ---
    if (session.answers && session.answers.pendingCorrectionState) {
        // We are waiting for a Yes/No answer regarding the proposed update
        const intent = await determineConfirmationIntent({
            assistantPrompt: "Are you sure you want to update your answer?",
            userMessage: trimmedMessageText,
            timingTracker: requestTimingTracker,
        });

        const persistedUserMessageContent = uploadedAttachments.length > 0 && !trimmedMessageText
            ? "[Uploaded Attachments]"
            : trimmedMessageText;

        await prisma.aiGuestMessage.create({
            data: { sessionId, role: "user", content: persistedUserMessageContent }
        });

        if (intent === "unknown") {
            const unknownMsg = "I didn't quite catch that. Do you want me to update your previous answer? (Yes / No)";
            await prisma.aiGuestMessage.create({ data: { sessionId, role: "assistant", content: unknownMsg } });
            const sessionReload = await prisma.aiGuestSession.findUnique({ where: { id: sessionId }, include: { messages: { orderBy: { createdAt: 'asc' } } } });
            return res.json({
                success: true, message: unknownMsg,
                inputConfig: { type: "text", options: ["Yes", "No"] },
                history: sessionReload.messages.map(m => ({ role: m.role, content: m.content }))
            });
        }

        if (intent === "no") {
            const nextAnswers = { ...session.answers };
            delete nextAnswers.pendingCorrectionState;
            await prisma.aiGuestSession.update({ where: { id: sessionId }, data: { answers: nextAnswers } });
            
            const cancelMsg = "No problem, I'll keep your original answer.";
            const followQuestionBlock = formatQuestionWithOptions(currentQuestion, sessionRuntimeOptionsByQuestionSlug);
            const fullCancelMsg = `${cancelMsg}\n\n${followQuestionBlock}`;
            await prisma.aiGuestMessage.create({ data: { sessionId, role: "assistant", content: fullCancelMsg } });
            const sessionReload = await prisma.aiGuestSession.findUnique({ where: { id: sessionId }, include: { messages: { orderBy: { createdAt: 'asc' } } } });
            return res.json({
                success: true, message: fullCancelMsg,
                inputConfig: { type: currentQuestion?.type || "text", options: getDisplayedQuestionOptions(currentQuestion, sessionRuntimeOptionsByQuestionSlug) },
                history: sessionReload.messages.map(m => ({ role: m.role, content: m.content }))
            });
        }

        // intent === "yes"
        const state = session.answers.pendingCorrectionState;
        let correctedAnswersBySlug = {
            ...(state?.proposedAnswersBySlug && typeof state.proposedAnswersBySlug === "object"
                ? state.proposedAnswersBySlug
                : {})
        };
        let correctionChanges = Array.isArray(state?.changes) ? state.changes : [];
        let correctionGuardMessage = "";

        const budgetCorrectionViolation = findBudgetMinimumViolationChange({
            changes: correctionChanges,
            questions,
            service,
        });
        if (budgetCorrectionViolation) {
            correctedAnswersBySlug[budgetCorrectionViolation.change.slug] =
                budgetCorrectionViolation.change.previousValue;
            correctionChanges = correctionChanges.filter((change) =>
                change?.slug !== budgetCorrectionViolation.change.slug
                || change?.index !== budgetCorrectionViolation.change.index
            );
            correctionGuardMessage = `${budgetCorrectionViolation.validation.message} I'll keep your earlier budget for now.`;
        }

        if (correctionChanges.length === 0) {
            const nextAnswers = { ...(session.answers || {}) };
            delete nextAnswers.pendingCorrectionState;
            await prisma.aiGuestSession.update({ where: { id: sessionId }, data: { answers: nextAnswers } });

            const followQuestionBlock = currentQuestion
                ? formatQuestionWithOptions(currentQuestion, sessionRuntimeOptionsByQuestionSlug)
                : "";
            const blockedCorrectionMessage = [correctionGuardMessage, followQuestionBlock]
                .filter(Boolean)
                .join("\n\n")
                .trim();
            await prisma.aiGuestMessage.create({ data: { sessionId, role: "assistant", content: blockedCorrectionMessage } });
            const sessionReload = await prisma.aiGuestSession.findUnique({ where: { id: sessionId }, include: { messages: { orderBy: { createdAt: 'asc' } } } });
            return res.json({
                success: true,
                message: blockedCorrectionMessage,
                inputConfig: currentQuestion
                    ? { type: currentQuestion?.type || "text", options: getDisplayedQuestionOptions(currentQuestion, sessionRuntimeOptionsByQuestionSlug) }
                    : { type: "text", options: [] },
                history: sessionReload.messages.map(m => ({ role: m.role, content: m.content }))
            });
        }
        
        let correctedRuntimeOptionsByQuestionSlug = { ...sessionRuntimeOptionsByQuestionSlug };
        const dependentIndexes = Array.from(
            new Set([
                ...getDependentIndexesForChanges(questions, correctionChanges),
                ...getSemanticDependentIndexesForChanges(
                    questions,
                    correctionChanges,
                    correctedAnswersBySlug,
                ),
            ]),
        ).sort((a, b) => a - b);
        if (dependentIndexes.length > 0) {
            correctedAnswersBySlug = clearAnswersByIndexes(correctedAnswersBySlug, questions, dependentIndexes);
            correctedRuntimeOptionsByQuestionSlug = clearRuntimeOptionsByIndexes(correctedRuntimeOptionsByQuestionSlug, questions, dependentIndexes);
        }
        
        const correctionNextStep = findNextUnansweredStep(questions, correctedAnswersBySlug);
        let correctedPayload = buildPersistedAnswersPayload(correctedAnswersBySlug, questions, {
            runtimeOptionsByQuestionSlug: correctedRuntimeOptionsByQuestionSlug,
            existingPayload: session.answers || {}
        });
        
        if (correctionNextStep < questions.length) {
            const correctionNextQuestion = questions[correctionNextStep];
            const runtimeOptions = await generateRuntimeOptionsForQuestion({
                serviceName: service.name,
                servicePrompt: service.aiPrompt || "",
                question: correctionNextQuestion,
                answersByQuestionText: correctedPayload.byQuestionText,
                answersBySlug: correctedAnswersBySlug,
                allQuestions: questions,
                timingTracker: requestTimingTracker,
            });
            if (correctionNextQuestion?.slug && runtimeOptions.length > 0) {
                correctedRuntimeOptionsByQuestionSlug[correctionNextQuestion.slug] = runtimeOptions;
            }
            correctedPayload = buildPersistedAnswersPayload(correctedAnswersBySlug, questions, {
                runtimeOptionsByQuestionSlug: correctedRuntimeOptionsByQuestionSlug, existingPayload: session.answers || {}
            });
        }

        // Implicitly drops pendingCorrectionState since we rebuild it from scratch
        await prisma.aiGuestSession.update({
            where: { id: sessionId },
            data: { answers: correctedPayload, currentStep: correctionNextStep }
        });

        const followQuestionText = correctionNextStep < questions.length 
            ? formatQuestionWithOptions(questions[correctionNextStep], correctedRuntimeOptionsByQuestionSlug) 
            : "Thanks, I updated that. Let me generate your proposal now.";
        const correctionBridgeCore = dependentIndexes.length > 0 ? `All set. I updated your earlier answer and adjusted related steps.` : `All set. I updated your earlier answer.`;
        const correctionMessage = [correctionGuardMessage, buildFriendlyMessage(followQuestionText, correctionBridgeCore)]
            .filter(Boolean)
            .join("\n\n")
            .trim();

        await prisma.aiGuestMessage.create({ data: { sessionId, role: "assistant", content: correctionMessage } });
        const sessionReload = await prisma.aiGuestSession.findUnique({ where: { id: sessionId }, include: { messages: { orderBy: { createdAt: 'asc' } } } });
        return res.json({
            success: true, message: correctionMessage,
            inputConfig: correctionNextStep < questions.length ? { type: questions[correctionNextStep].type || "text", options: getDisplayedQuestionOptions(questions[correctionNextStep], correctedRuntimeOptionsByQuestionSlug) } : { type: "text", options: [] },
            history: sessionReload.messages.map(m => ({ role: m.role, content: m.content }))
        });
    }
    // --- END CONFIRMATION INTERCEPT ---

    const pendingProposalState = getPendingProposalState(session.answers || {});
    if (pendingProposalState) {
        if (pendingProposalState.action !== "regenerate_current") {
            const nextAnswers = mergeAnswersUiState(session.answers || {}, {
                [PENDING_PROPOSAL_STATE_KEY]: null
            });
            await prisma.aiGuestMessage.create({
                data: { sessionId, role: "user", content: persistedUserMessageContent }
            });
            await prisma.aiGuestSession.update({ where: { id: sessionId }, data: { answers: nextAnswers } });

            const lockedServiceMsg = `${buildLockedServiceReply({
                currentServiceName: service.name,
                targetServiceName: pendingProposalState.targetServiceName || "That",
            })} If you want another ${service.name} proposal, tell me and I will confirm before generating it.`;
            await prisma.aiGuestMessage.create({ data: { sessionId, role: "assistant", content: lockedServiceMsg } });
            const sessionReload = await prisma.aiGuestSession.findUnique({ where: { id: sessionId }, include: { messages: { orderBy: { createdAt: "asc" } } } });
            return res.json({
                success: true,
                message: lockedServiceMsg,
                inputConfig: { type: "text", options: [] },
                history: sessionReload.messages.map((message) => ({ role: message.role, content: message.content })),
                serviceMeta: { serviceId: service.slug, serviceName: service.name }
            });
        }

        const targetServiceName = pendingProposalState.targetServiceName || service.name;
        const confirmationPrompt = `Do you want me to generate a new ${targetServiceName} proposal now?`;
        const intent = await determineConfirmationIntent({
            assistantPrompt: confirmationPrompt,
            userMessage: trimmedMessageText,
            timingTracker: requestTimingTracker,
        });

        await prisma.aiGuestMessage.create({
            data: { sessionId, role: "user", content: persistedUserMessageContent }
        });

        if (intent === "unknown") {
            const unknownMsg = `${confirmationPrompt} (Yes / No)`;
            await prisma.aiGuestMessage.create({ data: { sessionId, role: "assistant", content: unknownMsg } });
            const sessionReload = await prisma.aiGuestSession.findUnique({ where: { id: sessionId }, include: { messages: { orderBy: { createdAt: "asc" } } } });
            return res.json({
                success: true,
                message: unknownMsg,
                inputConfig: { type: "text", options: ["Yes", "No"] },
                history: sessionReload.messages.map((message) => ({ role: message.role, content: message.content })),
                serviceMeta: { serviceId: service.slug, serviceName: service.name }
            });
        }

        if (intent === "no") {
            const nextAnswers = mergeAnswersUiState(session.answers || {}, {
                [PENDING_PROPOSAL_STATE_KEY]: null
            });
            await prisma.aiGuestSession.update({ where: { id: sessionId }, data: { answers: nextAnswers } });

            const cancelMsg = "Alright, I will not generate a new proposal automatically. If you want another one for this service later, tell me and I will confirm first.";
            await prisma.aiGuestMessage.create({ data: { sessionId, role: "assistant", content: cancelMsg } });
            const sessionReload = await prisma.aiGuestSession.findUnique({ where: { id: sessionId }, include: { messages: { orderBy: { createdAt: "asc" } } } });
            return res.json({
                success: true,
                message: cancelMsg,
                inputConfig: { type: "text", options: [] },
                history: sessionReload.messages.map((message) => ({ role: message.role, content: message.content })),
                serviceMeta: { serviceId: service.slug, serviceName: service.name }
            });
        }

        const proposedAnswersBySlug =
            pendingProposalState?.proposedAnswersBySlug
            && typeof pendingProposalState.proposedAnswersBySlug === "object"
                ? pendingProposalState.proposedAnswersBySlug
                : null;
        const answersForRegeneration = proposedAnswersBySlug
            ? buildPersistedAnswersPayload(
                proposedAnswersBySlug,
                questions,
                {
                    runtimeOptionsByQuestionSlug: sessionRuntimeOptionsByQuestionSlug,
                    existingPayload: session.answers || {}
                }
            )
            : (session.answers || {});
        const nextAnswers = mergeAnswersUiState(answersForRegeneration, {
            [PENDING_PROPOSAL_STATE_KEY]: null
        });
        await prisma.aiGuestSession.update({ where: { id: sessionId }, data: { answers: nextAnswers } });

        const regeneratedProposal = await generateProposalResponseForSession({
            sessionId,
            session: {
                ...session,
                answers: nextAnswers
            },
            service,
            questions,
            runtimeOptionsByQuestionSlug: sessionRuntimeOptionsByQuestionSlug,
            persistedAnswers: buildPersistedAnswersPayload(
                getAnswersBySlug(nextAnswers, questions),
                questions,
                {
                    runtimeOptionsByQuestionSlug: sessionRuntimeOptionsByQuestionSlug,
                    existingPayload: nextAnswers
                }
            ),
            userMessageForReasoning: "",
            userMessageText: "",
            timingTracker: requestTimingTracker,
        });

        console.log(`[Assistant]: ${regeneratedProposal}`);
        await prisma.aiGuestMessage.create({
            data: { sessionId, role: "assistant", content: regeneratedProposal }
        });
        const sessionReload = await prisma.aiGuestSession.findUnique({ where: { id: sessionId }, include: { messages: { orderBy: { createdAt: "asc" } } } });
        return res.json({
            success: true,
            message: regeneratedProposal,
            inputConfig: { type: "text", options: [] },
            history: sessionReload.messages.map((message) => ({ role: message.role, content: message.content })),
            serviceMeta: { serviceId: service.slug, serviceName: service.name },
            sharedAnswers: buildSharedSessionAnswers({
                questions,
                sessionAnswers: sessionReload.answers || session.answers || {},
            }),
        });
    }

    if (currentStep >= questions.length && hasGeneratedProposal(session.answers || {})) {
        await prisma.aiGuestMessage.create({
            data: { sessionId, role: "user", content: persistedUserMessageContent }
        });

        const activeServices = await requestTimingTracker.measure(
            "load_active_services",
            () => prisma.service.findMany({
                where: { active: true },
                select: {
                    slug: true,
                    name: true
                }
            }),
            {
                label: "Load active services",
                category: "db",
                detail: "Needed for post-proposal follow-up classification.",
            },
        );
        const followupPlan = await analyzePostProposalFollowup({
            currentService: service,
            userMessage: trimmedMessageText,
            activeServices,
            timingTracker: requestTimingTracker,
        });

        let responseMessage = followupPlan.reply || `I already shared the current ${service.name} proposal. If you want another proposal for this service, tell me and I will confirm before generating it.`;
        let nextInputConfig = { type: "text", options: [] };
        let nextAnswers = session.answers || {};

        if (followupPlan.action === "regenerate_current") {
            const existingAnswersBySlug = getAnswersBySlug(session.answers || {}, questions);
            const postProposalBudgetAction = getPostProposalBudgetFollowupAction({
                userMessage: trimmedMessageText,
                service,
                questions,
                existingAnswersBySlug,
                runtimeOptionsByQuestionSlug: sessionRuntimeOptionsByQuestionSlug
            });

            if (postProposalBudgetAction?.blockedMessage) {
                responseMessage = `${postProposalBudgetAction.blockedMessage} If you still want another proposal, keep the budget at least ${formatServiceBudgetAmount(service.minBudget, service.currency || "INR")} and tell me when you are ready.`;
                nextInputConfig = { type: "text", options: [] };
            } else {
                nextAnswers = mergeAnswersUiState(nextAnswers, {
                    [PENDING_PROPOSAL_STATE_KEY]: {
                        action: "regenerate_current",
                        targetServiceSlug: service.slug,
                        targetServiceName: service.name,
                        sourceMessage: trimmedMessageText,
                        proposedAnswersBySlug: postProposalBudgetAction?.proposedAnswersBySlug || null
                    }
                });
                await prisma.aiGuestSession.update({ where: { id: sessionId }, data: { answers: nextAnswers } });
                responseMessage = postProposalBudgetAction?.reply || responseMessage;
                responseMessage = `${responseMessage}\n\nDo you want me to generate a new ${service.name} proposal now?`;
                nextInputConfig = { type: "text", options: ["Yes", "No"] };
            }
        }

        console.log(`[Assistant]: ${responseMessage}`);
        await prisma.aiGuestMessage.create({
            data: { sessionId, role: "assistant", content: responseMessage }
        });
        const sessionReload = await prisma.aiGuestSession.findUnique({ where: { id: sessionId }, include: { messages: { orderBy: { createdAt: "asc" } } } });
        return res.json({
            success: true,
            message: responseMessage,
            inputConfig: nextInputConfig,
            history: sessionReload.messages.map((message) => ({ role: message.role, content: message.content })),
            serviceMeta: { serviceId: service.slug, serviceName: service.name },
            sharedAnswers: buildSharedSessionAnswers({
                questions,
                sessionAnswers: nextAnswers,
            }),
        });
    }

    let userMessageText = trimmedMessageText;

    const rememberedAttachments = uploadedAttachments.length > 0
        ? []
        : getMostRecentAttachmentsFromMessages(session.messages);
    const rememberedUrls = sharedUrls.length > 0
        ? []
        : getMostRecentUrlsFromMessages(session.messages);
    const activeAttachments = uploadedAttachments.length > 0
        ? uploadedAttachments
        : rememberedAttachments;
    const activeUrls = sharedUrls.length > 0
        ? sharedUrls
        : rememberedUrls;
    const isReferencingStoredAttachment = uploadedAttachments.length === 0
        && activeAttachments.length > 0
        && ATTACHMENT_REFERENCE_REGEX.test(`${userMessageText} ${safeMessageText}`.trim());
    const isReferencingStoredUrl = sharedUrls.length === 0
        && activeUrls.length > 0
        && URL_REFERENCE_REGEX.test(`${userMessageText} ${safeMessageText}`.trim());

    let attachmentContextText = "";
    let attachmentInferredAnswer = "";
    let attachmentInsightNote = "";
    let urlContextText = "";
    let urlInsightNote = "";
        if (activeAttachments.length > 0) {
            attachmentContextText = await requestTimingTracker.measure(
                "attachment_context_build",
                () => buildAttachmentContextBlock({
                    attachments: activeAttachments,
                }),
                {
                    label: "Analyze attachments",
                    category: "io",
                    detail: `Extracting context from ${activeAttachments.length} uploaded attachment(s).`,
                },
            );
            if (uploadedAttachments.length > 0 || isReferencingStoredAttachment) {
                attachmentInsightNote = buildAttachmentInsightForUser({
                    attachments: activeAttachments,
                attachmentContextText,
            });
        }
        if (attachmentInsightNote) {
            console.log(`[Attachment Insight] ${attachmentInsightNote}`);
        }

        attachmentInferredAnswer = await inferAnswerFromAttachmentContext({
            currentQuestionText: currentQuestion?.text || "",
            userMessageText,
            attachmentContextText,
            serviceName: service.name,
            timingTracker: requestTimingTracker,
        });

        if (!normalizeTextToken(userMessageText) && normalizeTextToken(attachmentInferredAnswer)) {
            userMessageText = attachmentInferredAnswer;
            console.log(
                `[Attachment Inference] inferred answer for "${currentQuestion?.slug || "current-question"}": "${userMessageText}"`
            );
        }
    }

    if (activeUrls.length > 0 && (sharedUrls.length > 0 || isReferencingStoredUrl)) {
            const urlContext = await requestTimingTracker.measure(
                "url_context_build",
                () => buildUrlContextBlock({ urls: activeUrls }),
                {
                    label: "Analyze shared URLs",
                    category: "io",
                    detail: `Reading ${activeUrls.length} shared URL reference(s).`,
                },
            );
            urlContextText = urlContext.contextText;
            urlInsightNote = urlContext.insightNote;
            if (urlInsightNote) {
            console.log(`[URL Insight] ${urlInsightNote}`);
        }
    }

    const userMessageForReasoning = [
        userMessageText,
        attachmentContextText
            ? `Attachment context from uploaded files:\n${attachmentContextText}`
            : "",
        urlContextText
            ? `Website context from shared URLs:\n${urlContextText}`
            : "",
    ]
        .filter(Boolean)
        .join("\n\n")
        .trim();

    const existingAnswersBySlug = getAnswersBySlug(session.answers || {}, questions);
    const existingAnswersPayload = buildPersistedAnswersPayload(
        existingAnswersBySlug,
        questions,
        {
            runtimeOptionsByQuestionSlug: sessionRuntimeOptionsByQuestionSlug,
            existingPayload: session.answers || {}
        }
    );
    const correctionIntent = hasCorrectionIntent(userMessageText);
    const questionIndexBySlug = new Map(
        questions
            .filter((q) => q?.slug)
            .map((q, index) => [q.slug, index])
    );
    const questionsBySlug = new Map(
        questions
            .filter((q) => q?.slug)
            .map((q) => [q.slug, q])
    );
    const questionSlugSet = new Set(questions.map((q) => q.slug).filter(Boolean));
    let extractedAnswersForMessage = [];
    let extractedAnswersForMessagePromise = Promise.resolve([]);
    if (currentStep < questions.length) {
        const skipMessageAnswerExtraction = shouldSkipMessageAnswerExtraction({
            message: userMessageText,
            currentQuestion,
            runtimeOptionsByQuestionSlug: sessionRuntimeOptionsByQuestionSlug,
            hasAttachmentContext: Boolean(attachmentContextText),
            hasUrlContext: Boolean(urlContextText),
            correctionIntent,
        });

        if (skipMessageAnswerExtraction) {
            requestTimingTracker.mark("message_answer_extraction_skip", {
                label: "Skip answer extraction",
                category: "logic",
                detail: `Skipping extractor for an obvious single-field reply to "${String(currentQuestion?.slug || currentQuestion?.text || "current_question").trim()}".`,
            });
        } else {
            extractedAnswersForMessagePromise = extractAnswersFromMessage({
                serviceName: service.name,
                message: userMessageForReasoning || userMessageText,
                questions,
                timingTracker: requestTimingTracker,
            });
        }
    }
    let lateBudgetMinimumViolation = null;


    // --- VALIDATION STEP ---
    let validationResult = null;
    let aiResponseContent = "";

    if (currentStep < questions.length) {
        const pendingBrandOwnershipState =
            session.answers?.pendingBrandOwnershipState
            && typeof session.answers.pendingBrandOwnershipState === "object"
                ? session.answers.pendingBrandOwnershipState
                : null;
        const currentQuestionText = currentQuestion?.text || "";
        const currentQuestionOptions = getQuestionOptionLabels(
            currentQuestion,
            sessionRuntimeOptionsByQuestionSlug
        );
        const currentQuestionNumberedOptions = currentQuestionOptions
            .map((optionLabel, index) => `${index + 1}. ${optionLabel}`);
        const currentQuestionCanonicalOptions = getCanonicalQuestionOptions(currentQuestion)
            .map((option) => option.canonicalLabel || option.label || option.value)
            .filter(Boolean);
        const currentQuestionSubtitle = String(currentQuestion?.subtitle || "").trim();
        const isOpeningIntakeStep = currentStep >= 0 && currentStep < 3;
        const knownContextByQuestion = existingAnswersPayload.byQuestionText;
        const savedResponseContext = buildSavedResponseContextLines(
            existingAnswersBySlug,
            questions,
            sessionRuntimeOptionsByQuestionSlug
        );
        const lastAssistantMessage = getMostRecentMessageContentByRole(session.messages, "assistant");

        const validationResponseRules = isOpeningIntakeStep
            ? `
            - This is one of the first three questions.
            - Keep the full response under 50 words.
            - Use up to two short lead-in sentences.
            - Do not give best practices, feature ideas, or strategy advice.
            - If VALID: acknowledge briefly and stop. Do not ask any question.
            - If INVALID: be warm, then re-ask the current question naturally.
            - If INFO_REQUEST, "not sure", or "other": answer briefly, give a short tailored recommendation, then ask the current question again.
            - For name questions, ask for "name" only, never "full name".
            - If the user sends only a greeting while name is asked, respond warmly and ask their name naturally.
            `
            : `
            - For name questions, ask for "name" only, never "full name".
            - If the user sends only a greeting while name is asked, respond warmly and ask their name naturally.
            - Do not sound corrective or robotic. Avoid phrases like "invalid response", "wrong answer", or "still need".
            - If INFO_REQUEST, "not sure", or "other": answer clearly in 2-4 short sentences, give a tailored recommendation, then ask the current question again. If the question has visible options, include them as a numbered list.
            - If VALID: acknowledge naturally with a short useful bridge tied to their answer or context. Do not ask any question. If this is the final question, just thank them and say you will put it together.
            - If INVALID: be warm, explain briefly, and re-ask the current question.
            - If the question has options, you may re-list them as guidance, but do not imply custom answers are forbidden unless the question explicitly requires fixed options.
            - Keep the full response under 100 words.
            `;
        const minimumBudgetValidationRule = Number(service?.minBudget || 0) > 0
            ? `
            - If the user introduces or updates any project budget below ${formatServiceBudgetAmount(service.minBudget, service.currency || "INR")} for this service, treat it as INVALID.
            - In that case, tell them to increase the budget to at least ${formatServiceBudgetAmount(service.minBudget, service.currency || "INR")}.
            - Do NOT say you will note, save, or proceed with the lower budget.
            `
            : "";

        if (service.aiPrompt) {
            console.log(`\n--- [AI Context Loaded] ---\nService: ${service.name}\nPrompt: ${service.aiPrompt}\n---------------------------\n`);
        }

        const businessNameGuardAction = getBusinessNameValidationGuardAction({
            question: currentQuestion,
            userMessage: userMessageText,
            pendingState: pendingBrandOwnershipState,
        });

        if (businessNameGuardAction.type === "reserved_platform_brand") {
            const nextAnswers = { ...(session.answers || {}) };
            delete nextAnswers.pendingBrandOwnershipState;

            const reservedBrandMessage = await buildBusinessNameGuardMessage({
                serviceName: service.name,
                servicePrompt: service.aiPrompt || "",
                scenario: "reserved_platform_brand",
                brandName: businessNameGuardAction.brandName,
                userLastMessage: userMessageText,
                currentQuestion,
                answersByQuestionText: knownContextByQuestion,
                answersBySlug: existingAnswersBySlug,
                allQuestions: questions,
                runtimeOptionsByQuestionSlug: sessionRuntimeOptionsByQuestionSlug,
                lastAssistantMessage,
                timingTracker: requestTimingTracker,
            });

            await prisma.aiGuestMessage.create({
                data: {
                    sessionId,
                    role: "user",
                    content: persistedUserMessageContent,
                },
            });
            await prisma.aiGuestSession.update({
                where: { id: sessionId },
                data: { answers: nextAnswers },
            });
            await prisma.aiGuestMessage.create({
                data: {
                    sessionId,
                    role: "assistant",
                    content: reservedBrandMessage,
                },
            });

            const sessionReload = await prisma.aiGuestSession.findUnique({
                where: { id: sessionId },
                include: { messages: { orderBy: { createdAt: "asc" } } },
            });

            return res.json({
                success: true,
                message: reservedBrandMessage,
                inputConfig: {
                    type: currentQuestion?.type || "text",
                    options: getDisplayedQuestionOptions(
                        currentQuestion,
                        sessionRuntimeOptionsByQuestionSlug
                    )
                },
                history: sessionReload.messages.map((message) => ({ role: message.role, content: message.content })),
            });
        }

        if (businessNameGuardAction.type === "ask_known_brand_affiliation") {
            const nextAnswers = { ...(session.answers || {}) };
            nextAnswers.pendingBrandOwnershipState = {
                questionSlug: currentQuestion?.slug || "",
                brandName: businessNameGuardAction.brandName,
            };

            const followupMessage = await buildBusinessNameGuardMessage({
                serviceName: service.name,
                servicePrompt: service.aiPrompt || "",
                scenario: "ask_known_brand_affiliation",
                brandName: businessNameGuardAction.brandName,
                userLastMessage: userMessageText,
                currentQuestion,
                answersByQuestionText: knownContextByQuestion,
                answersBySlug: existingAnswersBySlug,
                allQuestions: questions,
                runtimeOptionsByQuestionSlug: sessionRuntimeOptionsByQuestionSlug,
                lastAssistantMessage,
                timingTracker: requestTimingTracker,
            });

            await prisma.aiGuestMessage.create({
                data: {
                    sessionId,
                    role: "user",
                    content: persistedUserMessageContent,
                },
            });
            await prisma.aiGuestSession.update({
                where: { id: sessionId },
                data: { answers: nextAnswers },
            });
            await prisma.aiGuestMessage.create({
                data: {
                    sessionId,
                    role: "assistant",
                    content: followupMessage,
                },
            });

            const sessionReload = await prisma.aiGuestSession.findUnique({
                where: { id: sessionId },
                include: { messages: { orderBy: { createdAt: "asc" } } },
            });

            return res.json({
                success: true,
                message: followupMessage,
                inputConfig: {
                    type: currentQuestion?.type || "text",
                    options: getDisplayedQuestionOptions(
                        currentQuestion,
                        sessionRuntimeOptionsByQuestionSlug
                    )
                },
                history: sessionReload.messages.map((message) => ({ role: message.role, content: message.content })),
            });
        }

        if (businessNameGuardAction.type === "ask_pending_brand_role") {
            const followupMessage = await buildBusinessNameGuardMessage({
                serviceName: service.name,
                servicePrompt: service.aiPrompt || "",
                scenario: "ask_pending_brand_role",
                brandName: businessNameGuardAction.brandName,
                userLastMessage: userMessageText,
                currentQuestion,
                answersByQuestionText: knownContextByQuestion,
                answersBySlug: existingAnswersBySlug,
                allQuestions: questions,
                runtimeOptionsByQuestionSlug: sessionRuntimeOptionsByQuestionSlug,
                lastAssistantMessage,
                timingTracker: requestTimingTracker,
            });

            await prisma.aiGuestMessage.create({
                data: {
                    sessionId,
                    role: "user",
                    content: persistedUserMessageContent,
                },
            });
            await prisma.aiGuestMessage.create({
                data: {
                    sessionId,
                    role: "assistant",
                    content: followupMessage,
                },
            });

            const sessionReload = await prisma.aiGuestSession.findUnique({
                where: { id: sessionId },
                include: { messages: { orderBy: { createdAt: "asc" } } },
            });

            return res.json({
                success: true,
                message: followupMessage,
                inputConfig: {
                    type: currentQuestion?.type || "text",
                    options: getDisplayedQuestionOptions(
                        currentQuestion,
                        sessionRuntimeOptionsByQuestionSlug
                    )
                },
                history: sessionReload.messages.map((message) => ({ role: message.role, content: message.content })),
            });
        }

        if (businessNameGuardAction.type === "deny_pending_brand") {
            const nextAnswers = { ...(session.answers || {}) };
            delete nextAnswers.pendingBrandOwnershipState;

            const followupMessage = await buildBusinessNameGuardMessage({
                serviceName: service.name,
                servicePrompt: service.aiPrompt || "",
                scenario: "deny_pending_brand",
                brandName: businessNameGuardAction.brandName,
                userLastMessage: userMessageText,
                currentQuestion,
                answersByQuestionText: knownContextByQuestion,
                answersBySlug: existingAnswersBySlug,
                allQuestions: questions,
                runtimeOptionsByQuestionSlug: sessionRuntimeOptionsByQuestionSlug,
                lastAssistantMessage,
                timingTracker: requestTimingTracker,
            });

            await prisma.aiGuestMessage.create({
                data: {
                    sessionId,
                    role: "user",
                    content: persistedUserMessageContent,
                },
            });
            await prisma.aiGuestSession.update({
                where: { id: sessionId },
                data: { answers: nextAnswers },
            });
            await prisma.aiGuestMessage.create({
                data: {
                    sessionId,
                    role: "assistant",
                    content: followupMessage,
                },
            });

            const sessionReload = await prisma.aiGuestSession.findUnique({
                where: { id: sessionId },
                include: { messages: { orderBy: { createdAt: "asc" } } },
            });

            return res.json({
                success: true,
                message: followupMessage,
                inputConfig: {
                    type: currentQuestion?.type || "text",
                    options: getDisplayedQuestionOptions(
                        currentQuestion,
                        sessionRuntimeOptionsByQuestionSlug
                    )
                },
                history: sessionReload.messages.map((message) => ({ role: message.role, content: message.content })),
            });
        }

        if (businessNameGuardAction.type === "restart_with_new_brand_name") {
            userMessageText = businessNameGuardAction.replacementBrandName || userMessageText;
            session.answers = { ...(session.answers || {}) };
            delete session.answers.pendingBrandOwnershipState;
        } else if (businessNameGuardAction.type === "accept_pending_brand") {
            validationResult = {
                isValid: true,
                status: "valid_answer",
                message: "Thanks for clarifying.",
                normalizedAnswer: businessNameGuardAction.brandName,
            };
            aiResponseContent = validationResult.message;
            session.answers = { ...(session.answers || {}) };
            delete session.answers.pendingBrandOwnershipState;
        } else if (businessNameGuardAction.type === "accept_known_brand") {
            validationResult = {
                isValid: true,
                status: "valid_answer",
                message: "Thanks for sharing that.",
                normalizedAnswer: businessNameGuardAction.brandName,
            };
            aiResponseContent = validationResult.message;
        }

        if (!validationResult) {
            const fastLocalValidation = getFastLocalValidationResult({
                question: currentQuestion,
                userMessage: userMessageText,
                runtimeOptionsByQuestionSlug: sessionRuntimeOptionsByQuestionSlug,
                hasAttachmentContext: Boolean(attachmentContextText),
                hasUrlContext: Boolean(urlContextText),
                correctionIntent,
            });

            if (fastLocalValidation) {
                validationResult = fastLocalValidation;
                aiResponseContent = fastLocalValidation.message;
                requestTimingTracker.mark("current_answer_validation_fast_path", {
                    label: "Validate current answer (fast path)",
                    category: "logic",
                    detail: `Accepted an obvious reply for "${String(currentQuestion?.slug || currentQuestionText || "current_question").trim()}" without an AI validator call.`,
                    extra: {
                        fastPath: true,
                    },
                });
            }
        }

        if (!validationResult) {
            const validationPrompt = buildCurrentQuestionValidationPrompt({
                serviceName: service.name,
                servicePrompt: service.aiPrompt || "",
                currentQuestionText,
                currentQuestionOptions,
                currentQuestionNumberedOptions,
                currentQuestionCanonicalOptions,
                knownContextByQuestion,
                savedResponseContext,
                currentQuestionSubtitle,
                userMessageText,
                attachmentContextText,
                urlContextText,
                attachmentInferredAnswer,
                lastAssistantMessage,
                validationResponseRules: `${validationResponseRules}\n${minimumBudgetValidationRule}`.trim(),
            });

            // We use a separate AI call for validation.
            const validationResponse = await runTrackedAiCall({
                timingTracker: requestTimingTracker,
                key: "current_answer_validation_ai",
                label: "Validate current answer",
                detail: `Checking whether the reply answers "${String(currentQuestion?.slug || currentQuestionText || "current_question").trim()}".`,
                messages: [{ role: "user", content: validationPrompt }],
                conversationHistory: [{ role: "system", content: "You are a JSON-only API. Output strictly valid JSON." }],
                selectedServiceName: "system_validator",
            });

            if (validationResponse.success) {
                console.log(`[Validation Raw]:`, validationResponse.message);
                const parsedValidation = parseValidationResponse(validationResponse.message);
                if (parsedValidation) {
                    validationResult = parsedValidation;
                    aiResponseContent = parsedValidation.message;

                    // If validator derived a concrete answer from attachment context, use it
                    // so the questionnaire step advances instead of re-asking the same question.
                    const normalizedAnswerFromValidation = clipAttachmentText(
                        parsedValidation?.normalizedAnswer || "",
                        180
                    );
                    if (
                        validationResult.isValid &&
                        !normalizeTextToken(userMessageText) &&
                        normalizeTextToken(normalizedAnswerFromValidation)
                    ) {
                        userMessageText = normalizedAnswerFromValidation;
                        attachmentInferredAnswer = normalizedAnswerFromValidation;
                        console.log(
                            `[Validation Normalized Answer] using "${userMessageText}" for "${currentQuestion?.slug || "current-question"}"`
                        );
                    }

                    console.log(`[Validation Parsed]:`, parsedValidation);
                } else {
                    console.warn("[Validation] Could not parse structured validator output");
                }
            } else {
                console.warn("[Validation] AI request failed");
            }
        }

        if (!validationResult) {
            const aiReaskCurrentQuestion = await buildAiGuidedQuestionMessage({
                serviceName: service.name,
                servicePrompt: service.aiPrompt || "",
                userLastMessage: userMessageText,
                currentQuestion,
                nextQuestion: currentQuestion,
                answersByQuestionText: knownContextByQuestion,
                answersBySlug: existingAnswersBySlug,
                allQuestions: questions,
                runtimeOptionsByQuestionSlug: sessionRuntimeOptionsByQuestionSlug,
                sideReply: "",
                bridgeSegments: [],
                isInitial: false,
                timingTracker: requestTimingTracker,
            });
            validationResult = {
                isValid: false,
                status: "invalid_answer",
                message: aiReaskCurrentQuestion || formatQuestionWithOptions(currentQuestion, sessionRuntimeOptionsByQuestionSlug),
            };
            aiResponseContent = validationResult.message;
            console.log("[Validation Parse Fallback]:", validationResult);
        }

        if (currentStep < questions.length) {
            extractedAnswersForMessage = await extractedAnswersForMessagePromise;
            const supplementalBudgetExtractions = buildSupplementalBudgetExtractions({
                message: userMessageForReasoning || userMessageText,
                questions,
                currentQuestion,
            });
            if (supplementalBudgetExtractions.length > 0) {
                const existingExtractedSlugs = new Set(
                    extractedAnswersForMessage
                        .map((entry) => String(entry?.slug || "").trim())
                        .filter(Boolean)
                );
                supplementalBudgetExtractions.forEach((entry) => {
                    if (!existingExtractedSlugs.has(entry.slug)) {
                        extractedAnswersForMessage.push(entry);
                    }
                });
            }
        }

        lateBudgetMinimumViolation = !isBudgetQuestion(currentQuestion)
            ? findExtractedBudgetMinimumViolation({
                extractedAnswers: extractedAnswersForMessage,
                questionsBySlug,
                service,
            })
            : null;

        if (lateBudgetMinimumViolation) {
            validationResult = lateBudgetMinimumViolation.validation;
            aiResponseContent = lateBudgetMinimumViolation.validation.message;
            console.log("[Late Budget Minimum Validation]:", lateBudgetMinimumViolation.validation);
        }

        if (validationResult.isValid) {
            const minimumBudgetValidation = getBudgetMinimumValidationResult({
                question: currentQuestion,
                service,
                answerText:
                    validationResult?.normalizedAnswer
                    || attachmentInferredAnswer
                    || userMessageText
            });

            if (minimumBudgetValidation) {
                validationResult = minimumBudgetValidation;
                aiResponseContent = minimumBudgetValidation.message;
                console.log("[Budget Minimum Validation]:", minimumBudgetValidation);
            }
        }

        if (!validationResult.isValid) {
            if (validationResult.status === "info_request") {
                const questionBlock = formatQuestionWithOptions(currentQuestion, sessionRuntimeOptionsByQuestionSlug);
                if (
                    questionBlock &&
                    shouldAppendQuestionBlockForInfoRequest({
                        assistantMessage: aiResponseContent,
                        question: currentQuestion,
                        runtimeOptionsByQuestionSlug: sessionRuntimeOptionsByQuestionSlug
                    })
                ) {
                    aiResponseContent = `${aiResponseContent}\n\n${questionBlock}`;
                }
            }

            let activeCorrectionChange = null;
            let activeCorrectionConfirmMsg = "";
            let correctionCapture = {
                answersBySlug: { ...existingAnswersBySlug },
                updatedSlugs: []
            };
            let correctionChanges = [];

            if (!lateBudgetMinimumViolation) {
                correctionCapture = applyExtractedAnswerUpdates({
                    baseAnswersBySlug: { ...existingAnswersBySlug },
                    existingAnswersBySlug,
                    extractedAnswers: extractedAnswersForMessage,
                    questionIndexBySlug,
                    questionsBySlug,
                    questionSlugSet,
                    runtimeOptionsByQuestionSlug: sessionRuntimeOptionsByQuestionSlug,
                    currentStep,
                    currentQuestion,
                    ignoreSlug: currentQuestion?.slug,
                    correctionIntent: true,
                    logPrefix: "[Correction Capture]"
                });
                correctionChanges = getChangedAnswerDetails(
                    questions,
                    existingAnswersBySlug,
                    correctionCapture.answersBySlug
                );

                if (correctionChanges.length > 0) {
                    for (const change of correctionChanges) {
                        const rawQText = questions[change.index]?.text || "an earlier question";
                        const qText = rawQText.split('\n').filter(Boolean).pop().trim();
                        const evalResult = await checkMeaningfulChangeWithAI({
                            questionText: qText,
                            oldAnswer: change.previousValue,
                            newAnswer: change.nextValue,
                            timingTracker: requestTimingTracker,
                        });
                        if (evalResult.isMeaningful) {
                            activeCorrectionChange = change;
                            activeCorrectionConfirmMsg = evalResult.confirmMessage || `I noticed a change for "${qText}". Do you want to update it to "${change.nextValue}"?`;
                            break;
                        }
                    }
                }
            }

            if (activeCorrectionChange) {
                // Feature 3: Pause and ask for confirmation before applying past question updates
                const change = activeCorrectionChange;
                
                // Save pending corrections state 
                const nextAnswers = { ...(session.answers || {}) };
                nextAnswers.pendingCorrectionState = {
                    proposedAnswersBySlug: correctionCapture.answersBySlug,
                    changes: correctionChanges
                };
                
                await prisma.aiGuestSession.update({
                    where: { id: sessionId },
                    data: { answers: nextAnswers }
                });
                
                await prisma.aiGuestMessage.create({
                    data: { sessionId, role: "user", content: persistedUserMessageContent }
                });

                const confirmMsg = activeCorrectionConfirmMsg;
                await prisma.aiGuestMessage.create({
                    data: { sessionId, role: "assistant", content: confirmMsg }
                });

                const sessionReload = await prisma.aiGuestSession.findUnique({
                    where: { id: sessionId },
                    include: { messages: { orderBy: { createdAt: 'asc' } } }
                });

                return res.json({
                    success: true,
                    message: confirmMsg,
                    inputConfig: { type: "text", options: ["Yes", "No"] },
                    history: sessionReload.messages.map(m => ({ role: m.role, content: m.content }))
                });
            }


            let invalidFlowAnswersBySlug = existingAnswersBySlug;
            let capturedFutureNote = "";

            if (correctionCapture.updatedSlugs.length > 0) {
                invalidFlowAnswersBySlug = correctionCapture.answersBySlug;
                const capturedPayload = buildPersistedAnswersPayload(
                    invalidFlowAnswersBySlug,
                    questions,
                    {
                        runtimeOptionsByQuestionSlug: sessionRuntimeOptionsByQuestionSlug,
                        existingPayload: session.answers || {}
                    }
                );

                await prisma.aiGuestSession.update({
                    where: { id: sessionId },
                    data: {
                        answers: capturedPayload,
                        // Keep user on the same required step even after pre-capturing future answers.
                        currentStep
                    }
                });

                console.log(
                    `[Future Capture] Stored future answer(s) while waiting for current step: ${correctionCapture.updatedSlugs.join(", ")}`
                );
                capturedFutureNote = "";
            }

            // INVALID ANSWER FLOW

            // 1. Save User's (Invalid) Message
            await prisma.aiGuestMessage.create({
                data: {
                    sessionId,
                    role: "user",
                    content: persistedUserMessageContent,
                },
            });

            // 2. Save Assistant's Feedback Message
            const fallbackFeedbackFromAi = aiResponseContent
                ? ""
                : await buildAiGuidedQuestionMessage({
                    serviceName: service.name,
                    servicePrompt: service.aiPrompt || "",
                    userLastMessage: userMessageText,
                    currentQuestion,
                    nextQuestion: currentQuestion,
                    answersByQuestionText: buildPersistedAnswersPayload(invalidFlowAnswersBySlug, questions, {
                        runtimeOptionsByQuestionSlug: sessionRuntimeOptionsByQuestionSlug,
                        existingPayload: session.answers || {}
                    }).byQuestionText,
                    answersBySlug: invalidFlowAnswersBySlug,
                    allQuestions: questions,
                    runtimeOptionsByQuestionSlug: sessionRuntimeOptionsByQuestionSlug,
                    sideReply: "",
                    bridgeSegments: [],
                    isInitial: false,
                    timingTracker: requestTimingTracker,
                });
            const feedbackCore = aiResponseContent || fallbackFeedbackFromAi || formatQuestionWithOptions(
                currentQuestion,
                sessionRuntimeOptionsByQuestionSlug
            );
            const sideReply = buildAgentSideReply({
                userMessage: userMessageText,
                answersByQuestionText: buildPersistedAnswersPayload(invalidFlowAnswersBySlug, questions, {
                    runtimeOptionsByQuestionSlug: sessionRuntimeOptionsByQuestionSlug,
                    existingPayload: session.answers || {}
                }).byQuestionText
            });
            const quickReplyHint = hasNumberedOptionsInMessage(feedbackCore)
                || countOptionLabelsMentioned(feedbackCore, currentQuestion, sessionRuntimeOptionsByQuestionSlug) >= 2
                ? ""
                : buildQuickReplyHint(currentQuestion, sessionRuntimeOptionsByQuestionSlug);
            const feedbackMsg = stripNameNotedRecap(
                [sideReply, capturedFutureNote, attachmentInsightNote, urlInsightNote, feedbackCore, quickReplyHint]
                    .map((part) => String(part || "").trim())
                    .filter(Boolean)
                    .join("\n\n")
            );
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
                inputConfig: {
                    type: currentQuestion?.type || "text",
                    options: getDisplayedQuestionOptions(
                        currentQuestion,
                        sessionRuntimeOptionsByQuestionSlug
                    )
                },
                history: sessionReload.messages.map(m => ({ role: m.role, content: m.content }))
            });
        }
    }
    // --- END VALIDATION STEP ---

    // 3. Save User Answer (Valid)
    const createdUserMessage = await requestTimingTracker.measure(
        "save_user_message",
        () => prisma.aiGuestMessage.create({
            data: {
                sessionId,
                role: "user",
                content: persistedUserMessageContent,
            },
        }),
        {
            label: "Save user message",
            category: "db",
            detail: "Persisting the current user turn.",
        },
    );

    let updatedAnswersBySlug = { ...existingAnswersBySlug };
    let nextRuntimeOptionsByQuestionSlug = { ...sessionRuntimeOptionsByQuestionSlug };
    const normalizedCurrentAnswer = currentQuestion
        ? normalizeAnswerForQuestion(
            currentQuestion,
            validationResult?.normalizedAnswer || attachmentInferredAnswer || userMessageText,
            sessionRuntimeOptionsByQuestionSlug
        )
        : userMessageText;

    if (currentQuestion?.slug) {
        updatedAnswersBySlug[currentQuestion.slug] = normalizedCurrentAnswer;
    }

    let autoCapturedAnswerSlugs = [];
    if (currentStep < questions.length) {
        const autoCapture = applyExtractedAnswerUpdates({
            baseAnswersBySlug: updatedAnswersBySlug,
            existingAnswersBySlug,
            extractedAnswers: extractedAnswersForMessage,
            questionIndexBySlug,
            questionsBySlug,
            questionSlugSet,
            runtimeOptionsByQuestionSlug: nextRuntimeOptionsByQuestionSlug,
            currentStep,
            currentQuestion,
            ignoreSlug: currentQuestion?.slug,
            correctionIntent,
            logPrefix: "[Auto Capture]"
        });
        updatedAnswersBySlug = autoCapture.answersBySlug;
        autoCapturedAnswerSlugs = autoCapture.updatedSlugs;
    }

    let changedAnswers = getChangedAnswerDetails(
        questions,
        existingAnswersBySlug,
        updatedAnswersBySlug
    );

    let budgetMinimumGuardMessage = "";
    let pastChanges = changedAnswers.filter(c => c.index < currentStep);
    const budgetPastChangeViolation = findBudgetMinimumViolationChange({
        changes: pastChanges,
        questions,
        service,
    });

    if (budgetPastChangeViolation) {
        updatedAnswersBySlug[budgetPastChangeViolation.change.slug] =
            budgetPastChangeViolation.change.previousValue;
        changedAnswers = getChangedAnswerDetails(
            questions,
            existingAnswersBySlug,
            updatedAnswersBySlug
        );
        pastChanges = changedAnswers.filter(c => c.index < currentStep);
        budgetMinimumGuardMessage = `${budgetPastChangeViolation.validation.message} I'll keep your earlier budget for now.`;
        console.log("[Budget Past Change Blocked]:", budgetPastChangeViolation.validation);
    }

    let activePastChange = null;
    let activePastConfirmMsg = "";

    if (pastChanges.length > 0) {
        for (const change of pastChanges) {
            const rawQText = questions[change.index]?.text || "an earlier question";
            const qText = rawQText.split('\n').filter(Boolean).pop().trim();
            const evalResult = await checkMeaningfulChangeWithAI({
                questionText: qText,
                oldAnswer: change.previousValue,
                newAnswer: change.nextValue,
                timingTracker: requestTimingTracker,
            });
            if (evalResult.isMeaningful) {
                activePastChange = change;
                activePastConfirmMsg = evalResult.confirmMessage || `I noticed a change for "${qText}". Do you want to update it to "${change.nextValue}"?`;
                break;
            }
        }
    }

    if (activePastChange) {
        // Feature 3: Pause to confirm a past answer update, even if the current answer is valid
        const change = activePastChange;

        // Revert the past changes from the current save so they remain pending
        const safeUpdatedAnswersBySlug = { ...updatedAnswersBySlug };
        for (const pc of pastChanges) {
            safeUpdatedAnswersBySlug[pc.slug] = pc.previousValue;
        }

        const nextStep = findNextUnansweredStep(questions, safeUpdatedAnswersBySlug);
        let persistedAnswers = buildPersistedAnswersPayload(safeUpdatedAnswersBySlug, questions, {
            runtimeOptionsByQuestionSlug: nextRuntimeOptionsByQuestionSlug,
            existingPayload: session.answers || {}
        });

        // Save pending corrections state 
        persistedAnswers.pendingCorrectionState = {
            proposedAnswersBySlug: updatedAnswersBySlug, // This has both the current answer AND the past change
            changes: pastChanges
        };

        await prisma.aiGuestSession.update({
            where: { id: sessionId },
            data: { answers: persistedAnswers, currentStep: nextStep }
        });

        const confirmMsg = [budgetMinimumGuardMessage, activePastConfirmMsg]
            .filter(Boolean)
            .join("\n\n")
            .trim();
        await prisma.aiGuestMessage.create({
            data: { sessionId, role: "assistant", content: confirmMsg }
        });

        const sessionReload = await prisma.aiGuestSession.findUnique({
            where: { id: sessionId },
            include: { messages: { orderBy: { createdAt: 'asc' } } }
        });

        return res.json({
            success: true,
            message: confirmMsg,
            inputConfig: { type: "text", options: ["Yes", "No"] },
            history: sessionReload.messages.map(m => ({ role: m.role, content: m.content }))
        });
    }
    const dependentIndexes = getDependentIndexesForChanges(questions, changedAnswers);
    const dependentResetApplied = dependentIndexes.length > 0;

    if (dependentResetApplied) {
        updatedAnswersBySlug = clearAnswersByIndexes(updatedAnswersBySlug, questions, dependentIndexes);
        nextRuntimeOptionsByQuestionSlug = clearRuntimeOptionsByIndexes(
            nextRuntimeOptionsByQuestionSlug,
            questions,
            dependentIndexes
        );
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
    let persistedAnswers = buildPersistedAnswersPayload(updatedAnswersBySlug, questions, {
        runtimeOptionsByQuestionSlug: nextRuntimeOptionsByQuestionSlug,
        existingPayload: session.answers || {}
    });

    if (nextStep < questions.length) {
        const runtimeOptions = await generateRuntimeOptionsForQuestion({
            serviceName: service.name,
            servicePrompt: service.aiPrompt || "",
            question: questions[nextStep],
            answersByQuestionText: persistedAnswers.byQuestionText,
            answersBySlug: updatedAnswersBySlug,
            allQuestions: questions,
            timingTracker: requestTimingTracker,
        });
        if (questions[nextStep]?.slug && runtimeOptions.length > 0) {
            nextRuntimeOptionsByQuestionSlug[questions[nextStep].slug] = runtimeOptions;
        }
        persistedAnswers = buildPersistedAnswersPayload(updatedAnswersBySlug, questions, {
            runtimeOptionsByQuestionSlug: nextRuntimeOptionsByQuestionSlug,
            existingPayload: session.answers || {}
        });
    }

    await requestTimingTracker.measure(
        "save_session_state",
        () => prisma.aiGuestSession.update({
            where: { id: sessionId },
            data: {
                answers: persistedAnswers,
                currentStep: nextStep
            }
        }),
        {
            label: "Save session state",
            category: "db",
            detail: "Persisting updated answers and the next step index.",
        },
    );

    // 4. Determine Next Assistant Response
    let responseContent = "";
    let nextInputConfig = { type: "text", options: [] };

    if (nextStep < questions.length) {
        const nextQuestion = questions[nextStep];
        const nextQuestionText = nextQuestion.text;
        const expectedImmediateNextStep = resolveNextQuestionIndex(
            questions,
            currentStep,
            currentQuestion?.slug ? updatedAnswersBySlug[currentQuestion.slug] : userMessageText
        );

        const canUseAiTransition = Boolean(aiResponseContent)
            && autoCapturedAnswerSlugs.length === 0
            && !dependentResetApplied
            && nextStep === expectedImmediateNextStep;

        const sideReply = buildAgentSideReply({
            userMessage: userMessageText,
            answersByQuestionText: persistedAnswers.byQuestionText
        });
        const personalizedBridge = buildPersonalizedQuestionBridge({
            nextQuestionText,
            answersByQuestionText: persistedAnswers.byQuestionText,
            serviceName: service.name
        });
        const aiBridge = canUseAiTransition
            ? extractFriendlyBridgeFromValidationMessage(aiResponseContent, nextQuestionText)
            : "";
        const bridgeSegments = [];

        if (aiBridge) {
            bridgeSegments.push(aiBridge);
            if (!containsNormalizedText(aiBridge, personalizedBridge)) {
                bridgeSegments.push(personalizedBridge);
            }
        } else {
            bridgeSegments.push(personalizedBridge);
        }

        if (attachmentInsightNote) {
            const alreadyIncluded = bridgeSegments.some((segment) =>
                containsNormalizedText(segment, attachmentInsightNote)
            );
            if (!alreadyIncluded) {
                bridgeSegments.unshift(attachmentInsightNote);
            }
        }

        if (urlInsightNote) {
            const alreadyIncluded = bridgeSegments.some((segment) =>
                containsNormalizedText(segment, urlInsightNote)
            );
            if (!alreadyIncluded) {
                bridgeSegments.unshift(urlInsightNote);
            }
        }

        if (autoCapturedAnswerSlugs.length > 0) {
            bridgeSegments.push("I have already captured some details from your previous message.");
        }

        if (dependentResetApplied) {
            bridgeSegments.push("I updated related answers so this flow stays consistent.");
        }

        const progressBridge = buildProgressBridge({
            nextStep,
            totalQuestions: questions.length
        });
        if (progressBridge) {
            bridgeSegments.push(progressBridge);
        }

        const aiGuidedQuestionMessage = await buildAiGuidedQuestionMessage({
            serviceName: service.name,
            servicePrompt: service.aiPrompt || "",
            userLastMessage: userMessageText,
            currentQuestion,
            nextQuestion,
            answersByQuestionText: persistedAnswers.byQuestionText,
            answersBySlug: persistedAnswers.bySlug,
            allQuestions: questions,
            runtimeOptionsByQuestionSlug: nextRuntimeOptionsByQuestionSlug,
            sideReply,
            bridgeSegments,
            timingTracker: requestTimingTracker,
        });

        if (aiGuidedQuestionMessage) {
            responseContent = aiGuidedQuestionMessage;
        } else {
            const combinedBridge = combineInlineMessages(...bridgeSegments);
            const fallbackQuestionPrompt = getQuestionOptionLabels(nextQuestion, nextRuntimeOptionsByQuestionSlug).length > 0
                ? formatQuestionWithOptions(nextQuestion, nextRuntimeOptionsByQuestionSlug)
                : nextQuestionText;
            const questionMessage = buildFriendlyMessage(fallbackQuestionPrompt, combinedBridge);
            responseContent = sideReply
                ? buildFriendlyMessage(questionMessage, sideReply)
                : questionMessage;
        }

        // Configure next input
        nextInputConfig = {
            type: nextQuestion.type || "text",
            options: getDisplayedQuestionOptions(nextQuestion, nextRuntimeOptionsByQuestionSlug)
        };
    } else {
        // CASE B: All questions answered -> Generate Proposal
        try {
            responseContent = await generateProposalResponseForSession({
                sessionId,
                session,
                service,
                questions,
                runtimeOptionsByQuestionSlug: nextRuntimeOptionsByQuestionSlug,
                persistedAnswers,
                userMessageForReasoning,
                userMessageText,
                timingTracker: requestTimingTracker,
            });
        } catch (error) {
            console.error("[Proposal] Generation failed:", error?.message || error);
            responseContent = "I have saved your requirements, but I cannot generate the proposal right now. Please sign up and connect with an expert.";
        }
        // No input config for final step (or maybe CTA in future)
    }

    if (budgetMinimumGuardMessage) {
        responseContent = buildFriendlyMessage(responseContent, budgetMinimumGuardMessage);
    }

    responseContent = stripNameNotedRecap(responseContent);

    // 5. Save Assistant Message
    console.log(`[Assistant]: ${responseContent}`);
    const createdAssistantMessage = await requestTimingTracker.measure(
        "save_assistant_message",
        () => prisma.aiGuestMessage.create({
            data: {
                sessionId,
                role: "assistant",
                content: responseContent,
            },
        }),
        {
            label: "Save assistant message",
            category: "db",
            detail: "Persisting the assistant response.",
        },
    );

    // Re-fetch messages for complete history or append manually
    const newHistory = toChronologicalGuestHistory([
        ...session.messages,
        createdUserMessage,
        createdAssistantMessage,
    ]);

    res.json({
        success: true,
        message: responseContent,
        inputConfig: nextInputConfig,
        history: newHistory,
        serviceMeta: { serviceId: service.slug, serviceName: service.name },
        sharedAnswers: buildSharedSessionAnswers({
            questions,
            sessionAnswers: persistedAnswers,
        }),
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

    const runtimeOptionsByQuestionSlug = getRuntimeOptionsByQuestionSlug(session.answers || {});
    let inputConfig = { type: "text", options: [] };

    if (Number.isInteger(session.currentStep) && session.currentStep >= 0) {
        const service = await getServiceWithOrderedQuestions({
            identifier: session.serviceId,
            lookup: "slug",
            activeOnly: false,
        });

        const currentQuestion = service?.questions?.[session.currentStep];
        if (currentQuestion) {
            inputConfig = {
                type: currentQuestion.type || "text",
                options: getDisplayedQuestionOptions(currentQuestion, runtimeOptionsByQuestionSlug)
            };
        }
    }

    res.json({
        success: true,
        messages: session.messages,
        inputConfig,
    });
});

// @desc    Get ad-hoc advice for a specific option and context
// @route   POST /api/guest/advice
// @access  Public
export const getGuestAdvice = asyncHandler(async (req, res) => {
    const {
        sessionId,
        serviceId,
        option,
        context,
        currentQuestion,
        assistantContext,
        currentOptions,
        mode
    } = req.body;

    const isAutoRecommendationMode = /auto_question_recommendation/i.test(String(mode || ""));
    const isManualRecommendationTrigger = /\b(not sure|other|suggest|recommend|advice|help)\b/i.test(
        String(option || "")
    );
    const isRecommendationMode = isAutoRecommendationMode || isManualRecommendationTrigger;

    let session = null;
    if (sessionId) {
        session = await prisma.aiGuestSession.findUnique({
            where: { id: sessionId },
            select: buildGuestSessionCoreSelect()
        });
    }

    const resolvedServiceId = session?.serviceId || serviceId;
    let service = null;
    if (resolvedServiceId) {
        service = await getServiceWithOrderedQuestions({
            identifier: resolvedServiceId,
            lookup: "slug_or_id",
            activeOnly: false,
        });
    }

    const resolvedCurrentQuestion =
        Array.isArray(service?.questions)
            ? service.questions.find((entry) => String(entry?.text || "").trim() === String(currentQuestion || "").trim())
                || service.questions[Number.isInteger(session?.currentStep) ? session.currentStep : -1]
                || null
            : null;
    const adviceAdminControls = getQuestionAdminControls(resolvedCurrentQuestion, service?.aiPrompt || "");
    const adviceQuestionContext =
        buildAdminControlSummaryText(adviceAdminControls)
        || String(assistantContext || "").trim();

    const answersByQuestionText =
        session?.answers?.byQuestionText && typeof session.answers.byQuestionText === "object"
            ? session.answers.byQuestionText
            : {};

    const confirmedAnswersContext = Object.entries(answersByQuestionText)
        .filter(([, value]) => {
            if (Array.isArray(value)) return value.length > 0;
            if (value && typeof value === "object") return Object.keys(value).length > 0;
            return String(value ?? "").trim().length > 0;
        })
        .slice(-8)
        .map(([questionText, value]) => {
            const renderedValue = Array.isArray(value)
                ? value.join(", ")
                : value && typeof value === "object"
                ? JSON.stringify(value)
                : String(value ?? "").trim();
            return `- ${questionText}: ${renderedValue}`;
        })
        .join("\n");

    const visibleOptionObjects = normalizeAdviceVisibleOptions(currentOptions, resolvedCurrentQuestion);
    const visibleOptions = visibleOptionObjects
        .map((optionEntry) => String(
            optionEntry?.label
            || optionEntry?.value
            || optionEntry?.canonicalLabel
            || optionEntry?.canonicalValue
            || ""
        ).trim())
        .filter(Boolean);
    const fallbackRecommendedAnswer = isRecommendationMode
        ? getPreferredAdviceOptionLabel(visibleOptionObjects, adviceAdminControls)
        : "";

    const recentSessionContext = Array.isArray(session?.messages)
        ? session.messages
            .slice(-6)
            .map((message) => `${message.role}: ${String(message.content || "").trim()}`)
            .filter(Boolean)
            .join("\n")
        : "";

    const minimumBudgetText = Number(service?.minBudget || 0) > 0
        ? formatServiceBudgetAmount(service.minBudget, service.currency || "INR")
        : "";

    const taskBlock = isRecommendationMode
        ? `
Task:
The helper needs to give a recommendation for the CURRENT question.
Analyze the full flow using the current question, assistant context, visible options, confirmed answers, and recent session messages.
Give a VERY SHORT, highly personalized recommendation (1-2 sentences maximum).
Do NOT ask the user for more information.
Do NOT give neutral guidance.
Do NOT say "tell me", "share", "what feels comfortable", "what sounds best", "you can mention", or anything similar.
Your notice MUST directly recommend the best answer for this user right now.
You MUST also set "recommendedAnswer" to the exact final answer the user can send.
If visible options exist, choose exactly ONE option from the visible options and set "recommendedAnswer" to that exact option text.
If the best answer is a binary yes/no choice, keep "recommendedAnswer" as the exact option but do NOT write a bare "Yes" or "No" in the notice or placeholder. Phrase the recommendation as a direct direction with one short reason.
If this is a timeline question without fixed options, recommend one concrete timeline the user can send directly.
If this is a budget question without fixed options, recommend one concrete budget figure or a narrow range the user can send directly.
${minimumBudgetText ? `Never recommend a budget below ${minimumBudgetText}.` : ""}
After the recommendation, add one short reason tied to their project.
The placeholder must start with "e.g. " and should hint at the recommended final answer naturally.
`
        : `
Task:
The user clicked "${option || 'Not sure'}" and needs a quick hint on what to type next.
Provide a VERY SHORT, highly personalized helper message (1-2 sentences maximum).
It MUST be written directly to the user in a conversational tone. Use the current question, assistant context, confirmed answers, and recent chat details naturally.
Do not write a long paragraph of advice. Give a quick guide with 2-3 short, concrete examples of what they could tell you next.
Also, provide a short placeholder text (starting with "e.g. ") that acts as a hint in a text input box.
`;

    const advicePrompt = `
You are a friendly, conversational AI assistant directly helping a user fill out a questionnaire for their "${service?.name || serviceId || 'digital'}" project.

Service-Specific AI Instructions:
${parseAdminControlText(service?.aiPrompt || "").contextText || "None"}

Current Question: "${currentQuestion || ''}"
Current Question Context: "${adviceQuestionContext || ''}"
User Trigger / Selected Option: "${option || 'Not sure'}"
Visible Options: ${visibleOptions.length > 0 ? visibleOptions.join(" | ") : "None"}
Service Minimum Budget: ${minimumBudgetText || "None"}
Recent User Chat Context: "${context || ''}"

Confirmed Answers So Far:
${confirmedAnswersContext || "- none yet"}

Recent Session Messages:
${recentSessionContext || "- none yet"}

${buildAdminPromptSection(adviceAdminControls, "Admin Controls (highest priority when relevant)")}

${taskBlock}

- Treat Admin Controls as higher-priority steering than generic phrasing when they apply.
- If Admin Controls set a preferred option or option priority, follow that when it still fits the user's known context.

Return ONLY a raw JSON object (with double quotes) with this structure:
{
    "notice": string,
    "placeholder": string,
    "recommendedAnswer": string
}
When this is not a recommendation request, set "recommendedAnswer" to an empty string.
Do not use markdown formatting, code fences, or bold text.`;

    try {
        const adviceResponse = await chatWithAI(
            [{ role: "user", content: advicePrompt }],
            [{ role: "system", content: "You are a JSON-only API. Output strictly valid JSON." }],
            "system_validator"
        );

        if (adviceResponse.success) {
            const parsed = parseJsonObjectFromRaw(adviceResponse.message || "") || {};
            const normalizedPayload = normalizeGuestAdvicePayload({
                payload: parsed,
                isRecommendationMode,
                visibleOptionObjects,
                fallbackRecommendedAnswer,
            });
            return res.json({
                success: true,
                notice: normalizedPayload.notice,
                placeholder: normalizedPayload.placeholder,
                recommendedAnswer: normalizedPayload.recommendedAnswer,
            });
        }
    } catch (e) {
        console.warn("Failed to generate guest advice", e);
    }

    const fallbackPayload = isRecommendationMode
        ? normalizeGuestAdvicePayload({
            payload: {
                notice: fallbackRecommendedAnswer
                    ? `Recommended: ${fallbackRecommendedAnswer}. This matches the preferred flow for this question.`
                    : "Recommended direction: use the strongest fit for this step based on your project direction.",
                placeholder: fallbackRecommendedAnswer
                    ? `e.g. ${fallbackRecommendedAnswer}`
                    : "e.g. go with the recommended direction",
                recommendedAnswer: fallbackRecommendedAnswer,
            },
            isRecommendationMode: true,
            visibleOptionObjects,
            fallbackRecommendedAnswer,
        })
        : {
            notice: `Got it. Tell me what you have in mind for ${option || 'this'}.`,
            placeholder: "Tell me a bit more...",
            recommendedAnswer: "",
        };

    res.json({
        success: true,
        notice: fallbackPayload.notice,
        placeholder: fallbackPayload.placeholder,
        recommendedAnswer: fallbackPayload.recommendedAnswer,
    });
});

export const __testables = {
    applyAdminControlsToOptions,
    applyExtractedAnswerUpdates,
    buildAdminControlSummaryText,
    buildBusinessNameGuardPrompt,
    buildCurrentQuestionValidationPrompt,
    buildSessionStartPrefill,
    buildSupplementalBudgetExtractions,
    buildLockedServiceReply,
    buildPersistedAnswersPayload,
    buildQuestionDisplayAnswer,
    findExtractedBudgetMinimumViolation,
    findBudgetMinimumViolationChange,
    getBusinessNameValidationGuardAction,
    normalizeAdviceVisibleOptions,
    normalizeGuestAdvicePayload,
    getPostProposalBudgetFollowupAction,
    getDisplayedQuestionOptions,
    getBudgetMinimumValidationResult,
    getQuestionAdminControls,
    getSemanticDependentIndexesForChanges,
    getQuestionIdentityType,
    getMostRecentMessageContentByRole,
    getServiceScopedMessages,
    isBudgetQuestion,
    getRuntimeOptionsByQuestionSlug,
    mergeExtractedAnswers,
    normalizeAnswerForQuestion,
    parseKnownBrandAffiliationResponse,
    parseAdminControlText,
    shouldSkipMessageAnswerExtraction,
    toChronologicalGuestHistory,
};
