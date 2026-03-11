import { prisma } from "../../lib/prisma.js";

const asObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

const asArray = (value) => (Array.isArray(value) ? value : []);

const toOptionalString = (value) => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized ? normalized : null;
};

const toStringArray = (value) =>
  asArray(value)
    .map((entry) => String(entry ?? "").trim())
    .filter(Boolean);

const buildPortfolioProjectsPayload = ({
  profileDetails = {},
  fallbackPortfolioProjects = [],
}) => {
  const profileProjects = asArray(profileDetails.portfolioProjects);
  if (profileProjects.length > 0) {
    return profileProjects;
  }

  return asArray(fallbackPortfolioProjects);
};

const buildMainRecord = ({
  profileDetails,
  fallbackServices = [],
  fallbackPortfolioProjects = [],
}) => {
  const identity = asObject(profileDetails.identity);
  const availability = asObject(profileDetails.availability);
  const reliability = asObject(profileDetails.reliability);

  return {
    profileDetails,
    profileRole: toOptionalString(profileDetails.role),
    professionalBio: toOptionalString(profileDetails.professionalBio),
    termsAccepted: Boolean(profileDetails.termsAccepted),
    deliveryPolicyAccepted: Boolean(profileDetails.deliveryPolicyAccepted),
    communicationPolicyAccepted: Boolean(profileDetails.communicationPolicyAccepted),
    acceptInProgressProjects: toOptionalString(profileDetails.acceptInProgressProjects),
    globalIndustryOther: toOptionalString(profileDetails.globalIndustryOther),
    city: toOptionalString(identity.city),
    country: toOptionalString(identity.country),
    username: toOptionalString(identity.username),
    githubUrl: toOptionalString(identity.githubUrl),
    languages: toStringArray(identity.languages),
    coverImage: toOptionalString(identity.coverImage),
    linkedinUrl: toOptionalString(identity.linkedinUrl),
    portfolioUrl: toOptionalString(identity.portfolioUrl),
    profilePhoto: toOptionalString(identity.profilePhoto),
    otherLanguage: toOptionalString(identity.otherLanguage),
    professionalTitle: toOptionalString(identity.professionalTitle),
    skills: toStringArray(profileDetails.skills),
    skillLevels: asObject(profileDetails.skillLevels),
    education: asArray(profileDetails.education),
    services: toStringArray(profileDetails.services).length
      ? toStringArray(profileDetails.services)
      : toStringArray(fallbackServices),
    serviceDetails: asObject(profileDetails.serviceDetails),
    portfolioProjects: buildPortfolioProjectsPayload({
      profileDetails,
      fallbackPortfolioProjects,
    }),
    globalIndustryFocus: toStringArray(profileDetails.globalIndustryFocus),
    availabilityHoursPerWeek: toOptionalString(availability.hoursPerWeek),
    availabilityStartTimeline: toOptionalString(availability.startTimeline),
    availabilityWorkingSchedule: toOptionalString(availability.workingSchedule),
    reliabilityDelayHandling: toOptionalString(reliability.delayHandling),
    reliabilityMissedDeadlines: toOptionalString(reliability.missedDeadlines),
  };
};

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
  const mainRecord = buildMainRecord({
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
