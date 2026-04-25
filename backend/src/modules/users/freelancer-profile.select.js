export const FREELANCER_PROFILE_SAFE_SELECT = Object.freeze({
  userId: true,
  companyName: true,
  openToWork: true,
  isVerified: true,
  rating: true,
  reviewCount: true,
  experienceYears: true,
  workExperience: true,
  services: true,
  resume: true,
  serviceTitle: true,
  serviceCategory: true,
  serviceExperience: true,
  serviceDescription: true,
  deliveryTimeline: true,
  startingPrice: true,
  serviceKeywords: true,
  serviceMedia: true,
  coverImage: true,
  socialMediaLinks: true,
  createdAt: true,
  updatedAt: true
});

export const FREELANCER_PROFILE_DETAILS_SAFE_SELECT = Object.freeze({
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
  services: true,
  serviceDetails: true,
});

export const FREELANCER_PROFILE_WITH_PROFILE_DETAILS_SELECT = Object.freeze({
  ...FREELANCER_PROFILE_SAFE_SELECT,
  ...FREELANCER_PROFILE_DETAILS_SAFE_SELECT
});
