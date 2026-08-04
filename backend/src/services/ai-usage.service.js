import crypto from "crypto";
import { prisma, prismaInitError } from "../lib/prisma.js";
import { getCurrentRequest } from "../lib/request-context.js";

const DEFAULT_INR_EXCHANGE_RATE = 85;
const DEFAULT_PROMPT_COST_PER_TOKEN_USD = 0.0000025;
const DEFAULT_COMPLETION_COST_PER_TOKEN_USD = 0.00001;

const normalizeText = (value, maxLength = 255) => {
  const normalized = String(value || "").trim();
  if (!normalized) return null;
  if (normalized.length <= maxLength) return normalized;
  return normalized.slice(0, maxLength);
};

const normalizeInteger = (value, fallback = 0) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return fallback;
  return Math.max(0, Math.round(numericValue));
};

const normalizeNumber = (value, fallback = null) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return fallback;
  return numericValue;
};

const normalizeObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

const readHeader = (req, key) => {
  const value = req?.headers?.[key];
  if (Array.isArray(value)) {
    return normalizeText(value[0], 2048);
  }
  return normalizeText(value, 2048);
};

const buildGuestIdentifier = (req) => {
  const userAgent = normalizeText(req?.headers?.["user-agent"], 1000) || "";
  const forwardedFor = normalizeText(req?.headers?.["x-forwarded-for"], 1000) || "";
  const ipAddress = normalizeText(req?.ip, 255) || "";
  const seed = [userAgent, forwardedFor, ipAddress].filter(Boolean).join("|");

  if (!seed) return null;

  return crypto.createHash("sha256").update(seed).digest("hex").slice(0, 32);
};

const getBodySessionId = (req) => {
  const bodySessionId = normalizeText(req?.body?.sessionId, 191);
  if (bodySessionId) return bodySessionId;

  const paramSessionId = normalizeText(req?.params?.sessionId, 191);
  if (paramSessionId) return paramSessionId;

  return normalizeText(req?.query?.sessionId, 191);
};

export const buildAiUsageContext = (overrides = {}) => {
  const activeRequest = overrides.req || getCurrentRequest();
  const resolvedUserId =
    normalizeText(overrides.userId, 191) ||
    normalizeText(activeRequest?.user?.id, 191) ||
    normalizeText(activeRequest?.user?.sub, 191);
  const pagePath =
    normalizeText(overrides.pagePath, 1024) ||
    readHeader(activeRequest, "x-catalance-page-path") ||
    null;
  const pageUrl =
    normalizeText(overrides.pageUrl, 2048) ||
    readHeader(activeRequest, "x-catalance-page-url") ||
    null;
  const requestPath =
    normalizeText(overrides.requestPath, 1024) ||
    normalizeText(activeRequest?.originalUrl || activeRequest?.url, 1024) ||
    null;
  const featureKey =
    normalizeText(overrides.featureKey, 191) ||
    readHeader(activeRequest, "x-catalance-ai-feature") ||
    null;
  const guestSessionId =
    normalizeText(overrides.guestSessionId, 191) ||
    readHeader(activeRequest, "x-catalance-guest-session") ||
    getBodySessionId(activeRequest) ||
    null;
  const guestIdentifier =
    normalizeText(overrides.guestIdentifier, 191) ||
    buildGuestIdentifier(activeRequest) ||
    null;

  return {
    userId: resolvedUserId,
    projectId: normalizeText(overrides.projectId, 191) || null,
    pagePath,
    pageUrl,
    requestPath,
    routeKey:
      normalizeText(overrides.routeKey, 191) ||
      normalizeText(activeRequest?.route?.path, 191) ||
      null,
    featureKey,
    guestSessionId,
    guestIdentifier,
    visitorType:
      normalizeText(overrides.visitorType, 32) ||
      (resolvedUserId
        ? "authenticated"
        : activeRequest || guestSessionId || guestIdentifier
        ? "guest"
        : "system"),
    metadata: normalizeObject(overrides.metadata),
  };
};

export const estimateAiCostInRupees = ({
  promptTokens = 0,
  completionTokens = 0,
  exchangeRate = DEFAULT_INR_EXCHANGE_RATE,
} = {}) => {
  const normalizedPromptTokens = normalizeInteger(promptTokens, 0);
  const normalizedCompletionTokens = normalizeInteger(completionTokens, 0);
  const costUsd =
    normalizedPromptTokens * DEFAULT_PROMPT_COST_PER_TOKEN_USD +
    normalizedCompletionTokens * DEFAULT_COMPLETION_COST_PER_TOKEN_USD;

  return Number((costUsd * exchangeRate).toFixed(6));
};

export const recordAiUsageEvent = async ({
  context = null,
  provider = "openrouter",
  model = null,
  title = null,
  usage = null,
  responseStatus = "success",
  responseStatusCode = null,
  durationMs = null,
  costInRupees = null,
  metadata = {},
} = {}) => {
  if (!prisma || prismaInitError) {
    return null;
  }

  const resolvedContext = context || buildAiUsageContext();
  const promptTokens = normalizeInteger(usage?.prompt_tokens || usage?.promptTokens, 0);
  const completionTokens = normalizeInteger(
    usage?.completion_tokens || usage?.completionTokens,
    0
  );
  const totalTokens =
    normalizeInteger(usage?.total_tokens || usage?.totalTokens, 0) ||
    promptTokens + completionTokens;
  const resolvedCost =
    normalizeNumber(costInRupees) ??
    estimateAiCostInRupees({ promptTokens, completionTokens });

  const payload = {
    userId: resolvedContext?.userId || null,
    projectId: resolvedContext?.projectId || null,
    provider: normalizeText(provider, 64) || "openrouter",
    model: normalizeText(model, 191),
    title: normalizeText(title, 255),
    featureKey: normalizeText(resolvedContext?.featureKey, 191),
    requestPath: normalizeText(resolvedContext?.requestPath, 1024),
    pagePath: normalizeText(resolvedContext?.pagePath, 1024),
    pageUrl: normalizeText(resolvedContext?.pageUrl, 2048),
    routeKey: normalizeText(resolvedContext?.routeKey, 191),
    visitorType: normalizeText(resolvedContext?.visitorType, 32) || "guest",
    guestSessionId: normalizeText(resolvedContext?.guestSessionId, 191),
    guestIdentifier: normalizeText(resolvedContext?.guestIdentifier, 191),
    responseStatus: normalizeText(responseStatus, 32) || "success",
    responseStatusCode: normalizeInteger(responseStatusCode, 0) || null,
    durationMs: normalizeNumber(durationMs),
    promptTokens,
    completionTokens,
    totalTokens,
    costInRupees: resolvedCost,
    metadata: {
      ...normalizeObject(resolvedContext?.metadata),
      ...normalizeObject(metadata),
    },
  };

  return prisma.aIUsage.create({ data: payload });
};

export const recordAiUsageEventSafe = async (payload = {}) => {
  try {
    return await recordAiUsageEvent(payload);
  } catch (error) {
    console.error("[AIUsage] Failed to record usage event:", error?.message || error);
    return null;
  }
};
