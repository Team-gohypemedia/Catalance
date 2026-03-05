import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const rows = await prisma.$queryRawUnsafe(
    `SELECT migration_name, finished_at FROM "_prisma_migrations" ORDER BY finished_at DESC`
);
console.log("=== _prisma_migrations (newest first) ===");
rows.forEach(r => console.log(r.migration_name.padEnd(70), '|', r.finished_at));

await prisma.$disconnect();
