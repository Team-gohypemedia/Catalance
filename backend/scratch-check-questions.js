import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const dailySet = await prisma.dailyQuestionSet.findFirst({
    where: { dayKey: "2026-05-05" }
  });
  console.log("Daily Set:", dailySet);

  if (dailySet) {
    const qs = await prisma.engagementQuestion.findMany({
      where: { id: { in: dailySet.questionIds } }
    });
    console.log("Questions found:", qs.length);
  }
}
main().finally(() => prisma.$disconnect());
