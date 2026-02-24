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
const NEON_POOLER_HOST_HINT = "-pooler.";
const DEFAULT_NEON_CONNECT_TIMEOUT_SECONDS = "15";
const DEFAULT_NEON_POOL_TIMEOUT_SECONDS = "30";
const DEFAULT_NEON_CONNECTION_LIMIT = "5";
const DEFAULT_TRANSIENT_RETRY_ATTEMPTS = 4;
const DEFAULT_TRANSIENT_RETRY_BASE_DELAY_MS = 600;
const RETRYABLE_CONNECTIVITY_CODES = new Set(["P1001", "P1017"]);
const WRITE_ACTIONS = new Set([
  "create",
  "createMany",
  "delete",
  "deleteMany",
  "executeRaw",
  "executeRawUnsafe",
  "update",
  "updateMany",
  "upsert"
]);

const transientRetryAttempts = Math.max(
  1,
  Number(process.env.PRISMA_TRANSIENT_RETRY_ATTEMPTS || DEFAULT_TRANSIENT_RETRY_ATTEMPTS)
);
const transientRetryBaseDelayMs = Math.max(
  100,
  Number(
    process.env.PRISMA_TRANSIENT_RETRY_BASE_DELAY_MS ||
      DEFAULT_TRANSIENT_RETRY_BASE_DELAY_MS
  )
);

const wait = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const isPoolerUrl = (urlValue) => {
  if (!urlValue) return false;
  try {
    const parsed = new URL(urlValue);
    return parsed.hostname.includes(NEON_POOLER_HOST_HINT);
  } catch {
    return false;
  }
};

const deriveNeonDirectUrl = (databaseUrl) => {
  if (!databaseUrl) {
    return undefined;
  }

  try {
    const parsed = new URL(databaseUrl);
    const isNeonHost = parsed.hostname.includes(NEON_HOST_HINT);
    const isPoolerHost = parsed.hostname.includes(NEON_POOLER_HOST_HINT);

    if (!isNeonHost || !isPoolerHost) {
      return undefined;
    }

    parsed.hostname = parsed.hostname.replace(NEON_POOLER_HOST_HINT, ".");
    parsed.searchParams.delete("pgbouncer");
    return parsed.toString();
  } catch {
    return undefined;
  }
};

const isPrismaConnectivityError = (error) => {
  if (!error) return false;

  const code = String(error.code || "").trim();
  if (RETRYABLE_CONNECTIVITY_CODES.has(code)) return true;

  const message = String(error.message || "").toLowerCase();
  return (
    message.includes("can't reach database server") ||
    message.includes("error in postgresql connection") ||
    message.includes("connection was forcibly closed") ||
    message.includes("server has closed the connection")
  );
};

const shouldRetryConnectivityError = ({ error, params, attempt }) => {
  if (!isPrismaConnectivityError(error)) {
    return false;
  }

  if (attempt >= transientRetryAttempts) {
    return false;
  }

  if (params?.runInTransaction) {
    return false;
  }

  const action = String(params?.action || "");
  const errorCode = String(error?.code || "");
  const isWrite = WRITE_ACTIONS.has(action);

  // For writes, only retry when Prisma couldn't reach DB at all.
  // This avoids re-running possibly committed writes on mid-flight drops.
  if (isWrite && errorCode !== "P1001") {
    return false;
  }

  return true;
};

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

    if (
      parsed.hostname.includes(NEON_POOLER_HOST_HINT) &&
      !parsed.searchParams.has("pgbouncer")
    ) {
      parsed.searchParams.set("pgbouncer", "true");
    }

    if (!parsed.searchParams.has("connection_limit")) {
      parsed.searchParams.set("connection_limit", DEFAULT_NEON_CONNECTION_LIMIT);
    }

    return parsed.toString();
  } catch {
    return databaseUrl;
  }
};

const databaseUrl = withNeonConnectionTuning(env.DATABASE_URL);
const configuredDirectDatabaseUrl = withNeonConnectionTuning(env.DIRECT_DATABASE_URL);
const derivedDirectDatabaseUrl = withNeonConnectionTuning(
  deriveNeonDirectUrl(env.DIRECT_DATABASE_URL || env.DATABASE_URL)
);
const directDatabaseUrl =
  configuredDirectDatabaseUrl && !isPoolerUrl(configuredDirectDatabaseUrl)
    ? configuredDirectDatabaseUrl
    : derivedDirectDatabaseUrl || configuredDirectDatabaseUrl;
const useDirectUrlFlag = ["1", "true", "yes", "on"].includes(
  String(process.env.PRISMA_USE_DIRECT_DATABASE_URL || "")
    .trim()
    .toLowerCase()
);

const shouldPreferDirectUrlInDev =
  env.NODE_ENV !== "production" &&
  Boolean(directDatabaseUrl) &&
  isPoolerUrl(databaseUrl) &&
  !isPoolerUrl(directDatabaseUrl);

const runtimeDatabaseUrl =
  (useDirectUrlFlag || shouldPreferDirectUrlInDev) && directDatabaseUrl
    ? directDatabaseUrl
    : databaseUrl;

if (shouldPreferDirectUrlInDev) {
  console.log(
    "[Prisma] Development runtime is using Neon direct endpoint to reduce pooler disconnects."
  );
}

const prismaDatasourceOptions = runtimeDatabaseUrl
  ? { db: { url: runtimeDatabaseUrl } }
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

if (globalForPrisma.__prisma && !globalForPrisma.__prismaConnectivityRetryAttached) {
  globalForPrisma.__prisma.$use(async (params, next) => {
    let attempt = 1;
    while (true) {
      try {
        return await next(params);
      } catch (error) {
        if (!shouldRetryConnectivityError({ error, params, attempt })) {
          throw error;
        }

        const retryDelayMs = transientRetryBaseDelayMs * attempt;
        const model = params?.model || "UnknownModel";
        const action = params?.action || "unknownAction";

        console.warn(
          `[Prisma] Transient DB connectivity error on ${model}.${action}. ` +
            `Retrying in ${retryDelayMs}ms (attempt ${attempt}/${transientRetryAttempts}).`
        );

        await wait(retryDelayMs);

        try {
          await globalForPrisma.__prisma.$connect();
        } catch {
          // Best-effort reconnect before retrying query.
        }

        attempt += 1;
      }
    }
  });
  globalForPrisma.__prismaConnectivityRetryAttached = true;
}

export const prisma = globalForPrisma.__prisma;
export { prismaInitError };
