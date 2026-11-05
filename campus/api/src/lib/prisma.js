import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__campusPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    // serverless Postgres (Neon) adds latency per query; give interactive transactions room
    transactionOptions: { maxWait: 10000, timeout: 20000 },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.__campusPrisma = prisma;

export default prisma;
