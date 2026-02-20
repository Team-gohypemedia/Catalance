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

let prismaInitError = null;

if (!globalForPrisma.__prisma) {
  try {
    globalForPrisma.__prisma = new PrismaClient({
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
