import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { createServer } from "http";
import { env, envInitError } from "./config/env.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { notFoundHandler } from "./middlewares/not-found.js";
import { apiRouter } from "./routes/index.js";
import { prisma, prismaInitError } from "./lib/prisma.js";
import { initSocket } from "./lib/socket.js";
import { startCronJobs } from "./services/cron.service.js";

const runningInVercel = process.env.VERCEL === "1";
const cronEnabledFlag = String(process.env.ENABLE_CRON_JOBS ?? "true")
  .trim()
  .toLowerCase();
const cronJobsEnabled = !["0", "false", "no", "off"].includes(cronEnabledFlag);
const dbConnectRetryMs = Number(process.env.DB_CONNECT_RETRY_MS || 30000);
export const createApp = () => {
  const app = express();

  const normalizeOrigin = (value = "") => value.trim().replace(/\/$/, "");
  const splitOrigins = (value = "") =>
    value
      .split(",")
      .map(normalizeOrigin)
      .filter(Boolean);

  const defaultOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://localhost:5173",
    "https://freelancer-self.vercel.app",
    "https://catalance.in"
  ];

  const configuredOrigins = [
    ...splitOrigins(env.CORS_ORIGIN || ""),
    normalizeOrigin(env.LOCAL_CORS_ORIGIN || ""),
    normalizeOrigin(env.VERCEL_CORS_ORIGIN || ""),
    ...defaultOrigins
  ]
    .filter(Boolean)
    .filter((value, index, self) => self.indexOf(value) === index);

  const allowAllOrigins =
    configuredOrigins.length === 0 || configuredOrigins.includes("*");

  const corsOptions = allowAllOrigins
    ? { origin: true, credentials: true }
    : {
      credentials: true,
      origin: (origin, callback) => {
        // In Vercel, fail-safe: if we cannot match, allow the requesting origin
        // to avoid mismatched Access-Control-Allow-Origin in serverless context.
        if (!origin) {
          return callback(null, true);
        }

        const normalized = normalizeOrigin(origin);
        const isAllowed = configuredOrigins.includes(normalized);

        if (isAllowed) {
          return callback(null, true);
        }

        // Fallback for misconfigured envs on Vercel: allow the incoming origin.
        if (runningInVercel) {
          return callback(null, true);
        }

        return callback(
          new Error(`Origin ${origin} is not allowed by CORS policy.`),
          false
        );
      }
    };

  // Handle CORS preflight (OPTIONS) explicitly so Vercel returns a
  // 204 with the correct headers instead of a 404.
  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  if (envInitError || prismaInitError) {
    app.use((_req, res) => {
      if (envInitError) {
        res.status(500).json({
          error: "Server configuration error",
          message:
            "Missing or invalid environment variables. Check server logs for details."
        });
        return;
      }

      res.status(500).json({
        error: "Database configuration error",
        message:
          "Prisma Client failed to initialize. Make sure `prisma generate` runs during the build (see https://pris.ly/d/vercel-build)."
      });
    });

    return app;
  }

  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

const app = createApp();

if (envInitError) {
  console.error("Environment validation failed:", envInitError);

  if (!runningInVercel) {
    console.error("Exiting due to invalid environment configuration.");
    process.exit(1);
  }
}

if (prismaInitError) {
  console.error("Prisma initialization failed:", prismaInitError);

  if (!runningInVercel) {
    console.error("Exiting due to Prisma client initialization failure.");
    process.exit(1);
  }
}

if (!runningInVercel) {
  const httpServer = createServer(app);
  const io = initSocket(httpServer);

  const server = httpServer.listen(env.PORT, () => {
    console.log(`API server ready on http://localhost:${env.PORT}`);

    let cronStarted = false;

    const connectDatabaseAndInitialize = async () => {
      try {
        await prisma.$connect();
        console.log("Database connected successfully");

        if (cronJobsEnabled && !cronStarted) {
          startCronJobs();
          cronStarted = true;
        }

        if (!cronJobsEnabled) {
          console.log("Cron jobs are disabled (ENABLE_CRON_JOBS=false).");
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        console.error("Database connection failed:", message);

        if (cronJobsEnabled) {
          console.warn(
            `[Startup] Retrying database connection in ${Math.round(
              dbConnectRetryMs / 1000
            )}s...`
          );
          setTimeout(() => {
            void connectDatabaseAndInitialize();
          }, dbConnectRetryMs);
        }
      }
    };

    void connectDatabaseAndInitialize();
  });

  server.on("error", (error) => {
    if (error && error.code === "EADDRINUSE") {
      console.error(
        `Port ${env.PORT} is already in use. Make sure another backend instance is not running or change the PORT in your environment.`
      );
    } else {
      console.error("Server error:", error);
    }
    process.exit(1);
  });

  const gracefulShutdown = async () => {
    console.log("Shutting down server...");
    server.close();
    if (io && typeof io.close === "function") {
      io.close();
    }
    if (prisma && typeof prisma.$disconnect === "function") {
      try {
        await prisma.$disconnect();
      } catch (error) {
        console.warn("Error disconnecting Prisma client:", error);
      }
    }
    process.exit(0);
  };

  process.on("SIGINT", gracefulShutdown);
  process.on("SIGTERM", gracefulShutdown);
}

export default app;
