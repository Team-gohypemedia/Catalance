export const FREELANCER_PROFILE_SAFE_SELECT = Object.freeze({
  userId: true,
  bio: true,
  skills: true,
  jobTitle: true,
  companyName: true,
  location: true,
  available: true,
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
  createdAt: true,
  updatedAt: true
});

export const FREELANCER_PROFILE_DETAILS_PROFILE_DETAILS_SELECT = Object.freeze({
  profileDetails: true
});

export const FREELANCER_PROFILE_WITH_PROFILE_DETAILS_SELECT = Object.freeze({
  ...FREELANCER_PROFILE_SAFE_SELECT,
  freelancerProfileDetails: {
    select: FREELANCER_PROFILE_DETAILS_PROFILE_DETAILS_SELECT
  }
});
