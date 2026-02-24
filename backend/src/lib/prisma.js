import { PrismaClient } from "@prisma/client";
import { env } from "../config/env.js";

const globalForPrisma = globalThis;
const queryLogFlag = String(process.env.PRISMA_LOG_QUERIES || "")
  .trim()
  .toLowerCase();
const isQueryLoggingEnabled =
  queryLogFlag === "1" || queryLogFlag === "true" || queryLogFlag === "yes";
const prismaLogLevels =
  env.NODE_ENV === "development"
    ? isQueryLoggingEnabled
      ? ["query", "warn", "error"]
      : ["warn", "error"]
    : ["error"];

const NEON_HOST_HINT = "neon.tech";
const DEFAULT_NEON_CONNECT_TIMEOUT_SECONDS = "15";
const DEFAULT_NEON_POOL_TIMEOUT_SECONDS = "30";

const withNeonConnectionTuning = (databaseUrl) => {
  if (!databaseUrl) {
    return databaseUrl;
  }

  try {
    const parsed = new URL(databaseUrl);
    const isNeonHost = parsed.hostname.includes(NEON_HOST_HINT);

    if (!isNeonHost) {
      return databaseUrl;
    }

    if (!parsed.searchParams.has("connect_timeout")) {
      parsed.searchParams.set(
        "connect_timeout",
        DEFAULT_NEON_CONNECT_TIMEOUT_SECONDS
      );
    }

    if (!parsed.searchParams.has("pool_timeout")) {
      parsed.searchParams.set(
        "pool_timeout",
        DEFAULT_NEON_POOL_TIMEOUT_SECONDS
      );
    }

    return parsed.toString();
  } catch {
    return databaseUrl;
  }
};

const databaseUrl = withNeonConnectionTuning(env.DATABASE_URL);
const prismaDatasourceOptions = databaseUrl
  ? { db: { url: databaseUrl } }
  : undefined;

let prismaInitError = null;

if (!globalForPrisma.__prisma) {
  try {
    globalForPrisma.__prisma = new PrismaClient({
      datasources: prismaDatasourceOptions,
      log: prismaLogLevels
    });
  } catch (error) {
    // Capture initialization errors (e.g. missing generated client on Vercel)
    console.error("Prisma client initialization failed:", error);
    prismaInitError = error;
    globalForPrisma.__prisma = null;
  }
}

export const prisma = globalForPrisma.__prisma;
export { prismaInitError };
