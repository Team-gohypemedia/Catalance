export const FREELANCER_PROFILE_SAFE_SELECT = Object.freeze({
  userId: true,
  bio: true,
  skills: true,
  jobTitle: true,
  companyName: true,
  location: true,
  available: true,
  openToWork: true,
  isVerified: true,
  rating: true,
  reviewCount: true,
  experienceYears: true,
  workExperience: true,
  services: true,
  portfolio: true,
  linkedin: true,
  github: true,
  portfolioProjects: true,
  resume: true,
  serviceTitle: true,
  serviceCategory: true,
  serviceExperience: true,
  serviceComplexity: true,
  serviceDescription: true,
  deliveryTimeline: true,
  startingPrice: true,
  serviceKeywords: true,
  serviceMedia: true,
  createdAt: true,
  updatedAt: true
});

export const FREELANCER_PROFILE_DETAILS_SAFE_SELECT = Object.freeze({
  profileDetails: true,
  profileRole: true,
  professionalBio: true,
  deliveryPolicyAccepted: true,
  communicationPolicyAccepted: true,
  acceptInProgressProjects: true,
  city: true,
  country: true,
  username: true,
  languages: true,
  profilePhoto: true,
  skills: true,
  services: true,
  serviceDetails: true,
  portfolioProjects: true
});

export const FREELANCER_PROFILE_WITH_PROFILE_DETAILS_SELECT = Object.freeze({
  ...FREELANCER_PROFILE_SAFE_SELECT,
  ...FREELANCER_PROFILE_DETAILS_SAFE_SELECT
});
