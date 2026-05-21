import { env } from "../src/config/env.js";
import { seedServicePositiveKeywords } from "../src/data/service-positive-keywords.js";
import { prisma } from "../src/lib/prisma.js";
import { hashPassword } from "../src/modules/users/password.utils.js";
import { seedAdminAccount } from "../src/services/bootstrap.service.js";

const main = async () => {
  console.log(`Seeding database for ${env.NODE_ENV}...`);

  const defaultPasswordHash = await hashPassword("Password123!");

  const adminSeed = await seedAdminAccount();
  console.log("Admin user created:", adminSeed.admin.email);
  console.log(
    `Admin login ready: ${adminSeed.credentials.email} / ${adminSeed.credentials.password}`
  );

  const manager = await prisma.user.upsert({
    where: { email: "manager@example.com" },
    update: {},
    create: {
      email: "manager@example.com",
      fullName: "Sample Project Manager",
      passwordHash: defaultPasswordHash,
      role: "PROJECT_MANAGER",
    }
  });
  console.log("Project Manager account ready:", manager.email);

  const positiveKeywordSeedResult = await seedServicePositiveKeywords(prisma);
  console.log(
    `Service positive keywords ready: ${positiveKeywordSeedResult.seededCount} total entries across ${positiveKeywordSeedResult.matchedServiceCount} services.`,
  );
  if (positiveKeywordSeedResult.missingServiceNames.length > 0) {
    console.warn(
      `Services without a matching catalog row during seed: ${positiveKeywordSeedResult.missingServiceNames.join(", ")}`,
    );
  }

  console.log("Seed complete.");
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
