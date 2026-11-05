import "dotenv/config";

const list = (v, fallback) =>
  (v || fallback)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5100,
  // Campus signs nobody in itself: it accepts the access tokens issued by the main Catalance backend,
  // so this must be the SAME value as JWT_SECRET in backend/.env.
  catalanceJwtSecret: process.env.CATALANCE_JWT_SECRET || "",
  corsOrigins: list(process.env.CAMPUS_CORS_ORIGIN, "http://localhost:5180"),
  openRouterKey: process.env.CAMPUS_OPENROUTER_API_KEY || "",
  aiModel: process.env.CAMPUS_AI_MODEL || "openai/gpt-4o-mini",
  hasDatabase: Boolean(process.env.CAMPUS_DATABASE_URL),
  // Razorpay hosted checkout for course fees (spec §5.1). Without the key pair only offline payment is offered.
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || "",
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
  // Transactional email (spec §12) via Resend. Without a key, emails are logged and skipped.
  resendApiKey: process.env.RESEND_API_KEY || "",
  emailFrom: process.env.CAMPUS_EMAIL_FROM || "Catalance Campus <campus@catalance.in>",
  // Public web URL, for links inside emails
  webUrl: (process.env.CAMPUS_WEB_URL || list(process.env.CAMPUS_CORS_ORIGIN, "http://localhost:5180")[0]).replace(/\/$/, ""),
  // Private assessment uploads (spec §15) in Cloudflare R2 (S3 API). All four are needed; without them uploads answer 503
  // and the web hides the upload control (links and text still work).
  r2: {
    accountId: process.env.R2_ACCOUNT_ID || "",
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    bucket: process.env.R2_BUCKET_NAME || "",
  },
  // Shared secret for the scheduler (POST/GET /api/cron/tick with Authorization: Bearer <CRON_SECRET>). Empty = cron disabled (503).
  cronSecret: process.env.CRON_SECRET || "",
};

if (!env.catalanceJwtSecret) {
  if (env.nodeEnv === "production") {
    throw new Error("CATALANCE_JWT_SECRET must be set in production (same value as the main backend's JWT_SECRET).");
  }
  env.catalanceJwtSecret = "campus-dev-secret-change-me";
  console.warn("[campus-api] CATALANCE_JWT_SECRET is not set; Catalance logins will not work until it matches backend JWT_SECRET.");
}
