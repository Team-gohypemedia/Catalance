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
  const detailColumns = { ...mainRecord };
  delete detailColumns.skills;
  delete detailColumns.services;
  delete detailColumns.portfolioProjects;

  await tx.freelancerProfile.upsert({
    where: { userId },
    update: detailColumns,
    create: {
      userId,
      ...detailColumns,
    },
  });
};
