import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Clearing all engagement sessions to allow retaking the quest...");
  const result = await prisma.engagementAnswerSession.deleteMany({});
  console.log(`Deleted ${result.count} session(s).`);
  
  // Also optionally reset the profile's lastCompletedDayKey so streaks don't get confused
  await prisma.engagementProfile.updateMany({
    data: {
      lastCompletedDayKey: null
    }
  });
  console.log("Reset profile streak trackers for testing.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
