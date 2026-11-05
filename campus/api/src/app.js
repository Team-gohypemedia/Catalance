import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./lib/env.js";
import { errorHandler, notFound } from "./lib/errors.js";

import authRoutes from "./routes/auth.js";
import meRoutes from "./routes/me.js";
import publicRoutes from "./routes/public.js";
import trackRoutes from "./routes/tracks.js";
import courseRoutes from "./routes/courses.js";
import lessonRoutes from "./routes/lessons.js";
import dashboardRoutes from "./routes/dashboard.js";
import tutorRoutes from "./routes/tutor.js";
import ladderRoutes from "./routes/ladder.js";
import gigRoutes from "./routes/gigs.js";
import walletRoutes from "./routes/wallet.js";
import leaderboardRoutes from "./routes/leaderboard.js";
import collegeRoutes from "./routes/colleges.js";
import portfolioRoutes from "./routes/portfolio.js";
import passportRoutes from "./routes/passport.js";
import threadRoutes from "./routes/threads.js";
import mentorRoutes from "./routes/mentors.js";
import bookingRoutes from "./routes/bookings.js";
import cohortRoutes from "./routes/cohorts.js";
import notificationRoutes from "./routes/notifications.js";
import mentorStudioRoutes from "./routes/mentor-studio.js";
import adminRoutes from "./routes/admin.js";
import catalogRoutes from "./routes/catalog.js";
import assessmentsRoutes from "./routes/assessments.js";
import paymentsRoutes from "./routes/payments.js";
import projectsRoutes from "./routes/projects.js";
import platformRoutes from "./routes/platform.js";
import supportRoutes from "./routes/support.js";
import opsRoutes from "./routes/ops.js";
import cronRoutes from "./routes/cron.js";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(helmet());
  app.use(
    cors({
      origin(origin, cb) {
        // allow same-origin / server-to-server calls (no Origin header) and configured origins
        if (!origin || env.corsOrigins.includes("*") || env.corsOrigins.includes(origin)) return cb(null, true);
        return cb(null, false);
      },
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      maxAge: 86400,
    }),
  );
  app.use(compression());
  // Payment webhooks need the exact raw body for signature checks (req.body is a Buffer there); json() skips parsed bodies.
  app.use("/api/webhooks", express.raw({ type: "*/*", limit: "1mb" }));
  app.use(express.json({ limit: "1mb" }));
  if (env.nodeEnv !== "test") app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

  app.use(
    "/api/auth",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 50,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      message: { error: { message: "Too many attempts. Please wait a few minutes and try again." } },
    }),
  );

  // Sensitive writes (spec §15/§17): payments, assessment submits, offer responses, support, consents, withdrawals.
  // Keyed per session token (else IP) so a whole college behind one NAT isn't throttled together. POST only.
  const sensitiveLimit = (limit, windowMinutes, message) =>
    rateLimit({
      windowMs: windowMinutes * 60 * 1000,
      limit,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      skip: (req) => req.method !== "POST",
      keyGenerator: (req) => (req.headers.authorization || "").slice(-48) || req.ip,
      message: { error: { message } },
    });
  app.use(
    ["/api/courses/:id/checkout", "/api/orders/:id/razorpay/verify", "/api/orders/:id/offline-reference"],
    sensitiveLimit(20, 15, "Too many payment attempts. Please wait a few minutes and try again."),
  );
  app.use(
    ["/api/attempts/:id/submit", "/api/attempts/:id/appeal", "/api/me/offers/:id/accept", "/api/me/offers/:id/decline", "/api/me/offers/:id/deliveries"],
    sensitiveLimit(30, 15, "Too many submissions. Please wait a few minutes and try again."),
  );
  app.use(["/api/support/tickets", "/api/me/consents"], sensitiveLimit(30, 60, "Too many requests. Please wait a little and try again."));
  app.use("/api/wallet/withdraw", sensitiveLimit(5, 60, "Too many withdrawal requests. Please try again in an hour."));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "catalance-campus-api", time: new Date().toISOString(), database: env.hasDatabase ? "configured" : "missing" });
  });

  // static paths are registered inside each router before parameterized ones (e.g. /api/colleges/search)
  for (const router of [
    authRoutes,
    meRoutes,
    publicRoutes,
    trackRoutes,
    courseRoutes,
    lessonRoutes,
    dashboardRoutes,
    tutorRoutes,
    ladderRoutes,
    gigRoutes,
    walletRoutes,
    leaderboardRoutes,
    collegeRoutes,
    portfolioRoutes,
    passportRoutes,
    threadRoutes,
    mentorRoutes,
    bookingRoutes,
    cohortRoutes,
    notificationRoutes,
    mentorStudioRoutes,
    adminRoutes,
    catalogRoutes,
    assessmentsRoutes,
    paymentsRoutes,
    projectsRoutes,
    platformRoutes,
    supportRoutes,
    opsRoutes,
    cronRoutes,
  ]) {
    app.use(router);
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

const app = createApp();
export default app;
