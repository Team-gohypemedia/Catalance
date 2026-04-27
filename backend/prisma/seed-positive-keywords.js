import { PrismaClient } from "@prisma/client";
import { seedServicePositiveKeywords } from "../src/data/service-positive-keywords.js";

const prisma = new PrismaClient();

async function main() {
  const result = await seedServicePositiveKeywords(prisma);

  console.log(
    `Seeded ${result.seededCount} positive keywords across ${result.matchedServiceCount} services.`,
  );

  if (result.missingServiceNames.length > 0) {
    console.warn(
      `Skipped missing services: ${result.missingServiceNames.join(", ")}`,
    );
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
