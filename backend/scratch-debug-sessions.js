const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const sessions = await prisma.engagementAnswerSession.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, userId: true, dayKey: true, accuracy: true, idempotencyKey: true }
  });
  console.log(sessions);
}
main().finally(() => prisma.$disconnect());
