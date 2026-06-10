import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { prisma } from "../lib/prisma.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.resolve(
  __dirname,
  "../data/freelancer-onboarding-content.json",
);
const CONFIG_RECORD_ID = "freelancer-onboarding-content";

const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const deepMerge = (base, override) => {
  if (Array.isArray(base)) {
    return Array.isArray(override) ? override : base;
  }

  if (!isPlainObject(base)) {
    return override === undefined ? base : override;
  }

  const result = { ...base };
  const source = isPlainObject(override) ? override : {};

  Object.keys(source).forEach((key) => {
    const baseValue = base[key];
    const overrideValue = source[key];

    if (Array.isArray(baseValue)) {
      result[key] = Array.isArray(overrideValue) ? overrideValue : baseValue;
      return;
    }

    if (isPlainObject(baseValue)) {
      result[key] = deepMerge(baseValue, overrideValue);
      return;
    }

    result[key] = overrideValue === undefined ? baseValue : overrideValue;
  });

  return result;
};

const parseConfigPayload = (rawValue) => {
  const parsed = JSON.parse(String(rawValue || "{}"));
  const global = isPlainObject(parsed?.global) ? parsed.global : {};
  const services = isPlainObject(parsed?.services) ? parsed.services : {};

  return { global, services };
};

const loadFallbackContent = async () => {
  const rawConfig = await fs.readFile(CONFIG_PATH, "utf8");
  return parseConfigPayload(rawConfig);
};

const writeFallbackContent = async (payload) => {
  await fs.writeFile(CONFIG_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
};

const upsertStoredContent = async (payload) =>
  prisma.freelancerOnboardingContent.upsert({
    where: { id: CONFIG_RECORD_ID },
    create: {
      id: CONFIG_RECORD_ID,
      content: payload,
    },
    update: {
      content: payload,
    },
  });

export const loadFreelancerOnboardingContent = async () => {
  try {
    const storedContent = await prisma.freelancerOnboardingContent.findUnique({
      where: { id: CONFIG_RECORD_ID },
    });

    if (isPlainObject(storedContent?.content)) {
      return parseConfigPayload(JSON.stringify(storedContent.content));
    }
  } catch (error) {
    console.warn(
      "[freelancerOnboardingContent] Falling back to file config:",
      error?.message || error,
    );
  }

  const fallbackContent = await loadFallbackContent();
  try {
    await upsertStoredContent(fallbackContent);
  } catch (error) {
    console.warn(
      "[freelancerOnboardingContent] Could not seed DB from fallback config:",
      error?.message || error,
    );
  }
  return fallbackContent;
};

export const saveFreelancerOnboardingContent = async (nextConfig) => {
  const payload = parseConfigPayload(JSON.stringify(nextConfig || {}));
  try {
    await upsertStoredContent(payload);
  } catch (error) {
    if (String(process.env.VERCEL || "").trim()) {
      throw error;
    }

    await writeFallbackContent(payload);
  }
  return payload;
};

export const getFreelancerOnboardingContentForService = async (serviceKey = "") => {
  const config = await loadFreelancerOnboardingContent();
  const normalizedServiceKey = String(serviceKey || "").trim().toLowerCase();
  const serviceOverride = normalizedServiceKey
    ? config.services?.[normalizedServiceKey]
    : null;

  return deepMerge(config.global || {}, serviceOverride || {});
};
