import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.resolve(
  __dirname,
  "../data/freelancer-onboarding-content.json",
);

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

export const loadFreelancerOnboardingContent = async () => {
  const rawConfig = await fs.readFile(CONFIG_PATH, "utf8");
  return parseConfigPayload(rawConfig);
};

export const saveFreelancerOnboardingContent = async (nextConfig) => {
  const payload = parseConfigPayload(JSON.stringify(nextConfig || {}));
  await fs.writeFile(CONFIG_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
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
