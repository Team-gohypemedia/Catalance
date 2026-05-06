import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Deleting existing engagement questions...");
  await prisma.engagementQuestion.deleteMany({});
  console.log("Deleted. Now seed the DB by calling the seed endpoint via the frontend or let the app do it.");
  
  // Actually, we can just call the service here
  const { ensureFallbackQuestionBank } = await import('./src/modules/engagement/services/question-bank.service.js');
  const result = await ensureFallbackQuestionBank(prisma);
  console.log("Re-seeded questions:", result);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
