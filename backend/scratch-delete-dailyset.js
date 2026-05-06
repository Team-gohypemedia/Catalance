import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.dailyQuestionSet.deleteMany({
    where: { dayKey: "2026-05-05" }
  });
  console.log("Deleted old daily set.");
}
main().finally(() => prisma.$disconnect());
