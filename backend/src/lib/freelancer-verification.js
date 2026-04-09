import { prisma } from './prisma.js';

export const markFreelancerVerifiedAfterProjectCompletion = async (freelancerId) => {
  const targetFreelancerId = String(freelancerId || '').trim();
  if (!targetFreelancerId) {
    return false;
  }

  const existingProfile = await prisma.freelancerProfile.findUnique({
    where: { userId: targetFreelancerId },
    select: { userId: true, isVerified: true },
  });

  if (existingProfile?.isVerified) {
    return false;
  }

  if (existingProfile) {
    await prisma.freelancerProfile.update({
      where: { userId: targetFreelancerId },
      data: { isVerified: true },
    });
    return true;
  }

  await prisma.freelancerProfile.create({
    data: {
      userId: targetFreelancerId,
      isVerified: true,
    },
  });

  return true;
};