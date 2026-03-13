import { env } from "../config/env.js";

const globalForPrisma = globalThis;
const PRISMA_FALLBACK = Object.freeze({
  PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {},
  TransactionIsolationLevel: {
    Serializable: "Serializable"
  }
});
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
const DEFAULT_NEON_CONNECT_TIMEOUT_SECONDS = "30";
const DEFAULT_NEON_POOL_TIMEOUT_SECONDS = "60";
const DEFAULT_NEON_CONNECTION_LIMIT = "5";
const DEFAULT_NEON_KEEPALIVE_IDLE = "10";
const DEFAULT_TRANSIENT_RETRY_ATTEMPTS = 5;
const DEFAULT_TRANSIENT_RETRY_BASE_DELAY_MS = 1000;
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
const USER_QUERY_ACTIONS_WITH_ROW_RESULT = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "create",
  "update",
  "upsert",
  "delete"
]);
const USER_SAFE_DEFAULT_SELECT = Object.freeze({
  id: true,
  email: true,
  fullName: true,
  phoneNumber: true,
  passwordHash: true,
  role: true,
  roles: true,
  status: true,
  resetPasswordToken: true,
  resetPasswordExpires: true,
  fcmToken: true,
  otpCode: true,
  otpExpires: true,
  onboardingComplete: true,
  isVerified: true,
  suspendedAt: true,
  phone: true,
  avatar: true,
  createdAt: true,
  updatedAt: true
});

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);

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
    message.includes("server has closed the connection") ||
    message.includes("10054") ||
    message.includes("connectionreset") ||
    message.includes("broken pipe")
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

    if (!parsed.searchParams.has("keepalives_idle")) {
      parsed.searchParams.set("keepalives_idle", DEFAULT_NEON_KEEPALIVE_IDLE);
    }

    // Add statement_timeout to prevent long-running queries from hanging the pool
    if (!parsed.searchParams.has("statement_timeout")) {
      parsed.searchParams.set("statement_timeout", "120000"); // 2 minutes
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

const createUserProjectionExtension = () => ({
  query: {
    user: {
      async $allOperations({ operation, args, query }) {
        if (!USER_QUERY_ACTIONS_WITH_ROW_RESULT.has(String(operation || ""))) {
          return query(args);
        }

        const hasExplicitProjection =
          hasOwn(args, "select") || hasOwn(args, "include");
        const nextArgs = hasExplicitProjection
          ? args
          : {
            ...(args || {}),
            select: USER_SAFE_DEFAULT_SELECT
          };

        return query(nextArgs);
      }
    }
  }
});

const createConnectivityRetryExtension = (prismaClient) => ({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        let attempt = 1;

        while (true) {
          try {
            return await query(args);
          } catch (error) {
            const params = { action: operation, model };
            if (!shouldRetryConnectivityError({ error, params, attempt })) {
              throw error;
            }

            const retryDelayMs = transientRetryBaseDelayMs * attempt;
            const modelName = model || "UnknownModel";
            const action = operation || "unknownAction";

            console.warn(
              `[Prisma] Transient DB connectivity error on ${modelName}.${action}. ` +
                `Retrying in ${retryDelayMs}ms (attempt ${attempt}/${transientRetryAttempts}).`
            );

            await wait(retryDelayMs);

            try {
              await prismaClient.$connect();
            } catch {
              // Best-effort reconnect before retrying query.
            }

            attempt += 1;
          }
        }
      }
    }
  }
});

let prismaInitError = null;
let PrismaClient = null;
let Prisma = PRISMA_FALLBACK;

try {
  const prismaModule = await import("@prisma/client");
  PrismaClient = prismaModule.PrismaClient;
  Prisma = prismaModule.Prisma || PRISMA_FALLBACK;
} catch (error) {
  console.error("Failed to load @prisma/client:", error);
  prismaInitError = error;
}

if (!globalForPrisma.__prisma && PrismaClient) {
  try {
    const prismaClient = new PrismaClient({
      datasources: prismaDatasourceOptions,
      log: prismaLogLevels
    });

    globalForPrisma.__prismaBase = prismaClient;
    globalForPrisma.__prisma = prismaClient
      .$extends(createUserProjectionExtension())
      .$extends(createConnectivityRetryExtension(prismaClient));
  } catch (error) {
    // Capture initialization errors (e.g. missing generated client on Vercel)
    console.error("Prisma client initialization failed:", error);
    prismaInitError = prismaInitError || error;
    globalForPrisma.__prismaBase = null;
    globalForPrisma.__prisma = null;
  }
}

export const prisma = globalForPrisma.__prisma;
export { Prisma, prismaInitError };
