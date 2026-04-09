import { prisma } from "./prisma.js";

const ACTIVE_PROJECT_STATUSES = ["COMPLETED", "PAUSED", "DRAFT"];
const OPEN_TO_WORK_MIN_ACTIVE_PROJECT_COUNT = 5;

const normalizeFreelancerId = (freelancerId) => String(freelancerId || "").trim();

const collectActiveProjectCounts = async () => {
  const activeProjects = await prisma.project.findMany({
    where: {
      status: { notIn: ACTIVE_PROJECT_STATUSES },
      proposals: {
        some: {
          status: "ACCEPTED",
        },
      },
    },
    select: {
      proposals: {
        where: { status: "ACCEPTED" },
        select: { freelancerId: true },
      },
    },
  });

  const activeProjectCounts = new Map();

  for (const project of activeProjects) {
    const freelancerIds = new Set(
      (project.proposals || [])
        .map((proposal) => normalizeFreelancerId(proposal.freelancerId))
        .filter(Boolean)
    );

    for (const freelancerId of freelancerIds) {
      activeProjectCounts.set(
        freelancerId,
        (activeProjectCounts.get(freelancerId) || 0) + 1
      );
    }
  }

  return activeProjectCounts;
};

export const syncFreelancerOpenToWorkStatus = async (freelancerId) => {
  const targetFreelancerId = normalizeFreelancerId(freelancerId);
  if (!targetFreelancerId) {
    return null;
  }

  const activeProjectCount = await prisma.project.count({
    where: {
      status: { notIn: ACTIVE_PROJECT_STATUSES },
      proposals: {
        some: {
          status: "ACCEPTED",
          freelancerId: targetFreelancerId,
        },
      },
    },
  });

  const shouldBeOpenToWork =
    activeProjectCount < OPEN_TO_WORK_MIN_ACTIVE_PROJECT_COUNT;

  const existingProfile = await prisma.freelancerProfile.findUnique({
    where: { userId: targetFreelancerId },
    select: { userId: true, openToWork: true },
  });

  if (existingProfile?.openToWork === shouldBeOpenToWork) {
    return {
      activeProjectCount,
      openToWork: shouldBeOpenToWork,
      updated: false,
    };
  }

  await prisma.freelancerProfile.upsert({
    where: { userId: targetFreelancerId },
    update: { openToWork: shouldBeOpenToWork },
    create: {
      userId: targetFreelancerId,
      openToWork: shouldBeOpenToWork,
    },
  });

  return {
    activeProjectCount,
    openToWork: shouldBeOpenToWork,
    updated: true,
  };
};

export const reconcileFreelancerOpenToWorkStatuses = async () => {
  const activeProjectCounts = await collectActiveProjectCounts();
  const freelancerUsers = await prisma.user.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { role: "FREELANCER" },
        { roles: { has: "FREELANCER" } },
      ],
    },
    select: {
      id: true,
      freelancerProfile: {
        select: { userId: true, openToWork: true },
      },
    },
  });

  let checkedCount = 0;
  let updatedCount = 0;

  for (const user of freelancerUsers) {
    checkedCount += 1;

    const activeProjectCount = activeProjectCounts.get(user.id) || 0;
    const shouldBeOpenToWork =
      activeProjectCount < OPEN_TO_WORK_MIN_ACTIVE_PROJECT_COUNT;
    const profile = user.freelancerProfile;

    if (profile) {
      if (profile.openToWork === shouldBeOpenToWork) {
        continue;
      }

      await prisma.freelancerProfile.update({
        where: { userId: user.id },
        data: { openToWork: shouldBeOpenToWork },
      });
      updatedCount += 1;
      continue;
    }

    if (!shouldBeOpenToWork) {
      await prisma.freelancerProfile.upsert({
        where: { userId: user.id },
        update: { openToWork: false },
        create: { userId: user.id, openToWork: false },
      });
      updatedCount += 1;
    }
  }

  return {
    checkedCount,
    updatedCount,
    activeFreelancerCount: activeProjectCounts.size,
  };
};