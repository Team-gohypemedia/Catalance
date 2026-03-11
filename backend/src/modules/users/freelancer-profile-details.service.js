import { prisma } from "../../lib/prisma.js";
import { buildFreelancerProfileDetailsRecord } from "./freelancer-profile-details.mapper.js";

const asObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

export const syncFreelancerProfileDetailsProjection = async ({
  tx = prisma,
  userId,
  profileDetails = {},
  portfolioProjects = [],
  services = [],
}) => {
  if (!userId) {
    throw new Error("userId is required to sync Freelancer Profile Details");
  }

  const normalizedProfileDetails = asObject(profileDetails);
  const mainRecord = buildFreelancerProfileDetailsRecord({
    profileDetails: normalizedProfileDetails,
    fallbackServices: services,
    fallbackPortfolioProjects: portfolioProjects,
  });

  await tx.freelancerProfile.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  await tx.freelancerProfileDetails.upsert({
    where: { userId },
    update: mainRecord,
    create: {
      userId,
      ...mainRecord,
    },
  });
};
