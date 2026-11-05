import app from "./app.js";
import { env } from "./lib/env.js";
import { prisma } from "./lib/prisma.js";

const server = app.listen(env.port, () => {
  console.log(`[campus-api] listening on http://localhost:${env.port} (${env.nodeEnv})`);
  if (!env.hasDatabase) console.warn("[campus-api] CAMPUS_DATABASE_URL is not set; DB-backed routes will fail.");
});

async function shutdown(signal) {
  console.log(`[campus-api] ${signal} received, shutting down`);
  server.close(async () => {
    await prisma.$disconnect().catch(() => {});
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
