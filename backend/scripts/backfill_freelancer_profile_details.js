import { prisma } from "../src/lib/prisma.js";
import {
  buildFreelancerProfileDetailsObject,
  mergeFreelancerProfileDetailsWithMarketplace
} from "../src/modules/users/freelancer-profile-details.mapper.js";
import { FREELANCER_PROFILE_DETAILS_SAFE_SELECT } from "../src/modules/users/freelancer-profile.select.js";
import { syncFreelancerProfileDetailsProjection } from "../src/modules/users/freelancer-profile-details.service.js";

const run = async () => {
  const profiles = await prisma.freelancerProfile.findMany({
    select: {
      userId: true,
      portfolioProjects: true,
      services: true,
      ...FREELANCER_PROFILE_DETAILS_SAFE_SELECT,
      user: {
        select: {
          marketplace: {
            select: {
              serviceKey: true,
              service: true,
              serviceDetails: true,
            },
          },
        },
      },
    },
  });

  let syncedCount = 0;

  for (const profile of profiles) {
    await syncFreelancerProfileDetailsProjection({
      userId: profile.userId,
      profileDetails: mergeFreelancerProfileDetailsWithMarketplace(
        buildFreelancerProfileDetailsObject(profile),
        profile.user?.marketplace
      ),
      portfolioProjects: Array.isArray(profile.portfolioProjects)
        ? profile.portfolioProjects
        : [],
      services: Array.isArray(profile.services) ? profile.services : [],
    });
    syncedCount += 1;
  }

  console.log(
    `[Freelancer Profile Details] Synced ${syncedCount} freelancer profile records.`
  );
};

run()
  .catch((error) => {
    console.error("[Freelancer Profile Details] Backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma?.$disconnect?.();
  });
