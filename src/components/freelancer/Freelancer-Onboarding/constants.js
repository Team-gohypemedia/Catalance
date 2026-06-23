const COMMON_START_SLIDES = [
  {
    id: "welcome",
    progressValue: 4,
    continueLabel: "Continue",
    footerMode: "hidden",
  },
  {
    id: "workPreference",
    progressValue: 8,
    continueLabel: "Continue",
    footerMode: "hidden",
  },
];

const BASIC_PROFILE_SLIDE = {
  id: "basicProfile",
  title: "Complete Your Profile",
  description: "Let's establish your professional presence",
  progressValue: 16,
  footerMode: "profileActions",
  countryOptions: ["India", "United States", "United Kingdom"],
  stateOptions: ["Maharashtra", "Karnataka", "Delhi NCR"],
  languageOptions: ["English", "Hindi", "Marathi", "Spanish"],
};

const SERVICES_SLIDE = {
  id: "services",
  title: "Tell Us What You Can Help Clients With.",
  description: "Select at least 1 service. You can choose as many as you want.",
  progressValue: 18,
  continueLabel: "Continue",
};

const SERVICE_SETUP_SLIDE = {
  id: "serviceSetup",
  title: "Let's Start Your Setup",
  progressValue: 22,
  continueLabel: "Continue",
};

const SERVICE_QUICK_INFO_SLIDE = {
  id: "quickInfo",
  title: "Fill Your Service Info",
  progressValue: 36,
  continueLabel: "Continue",
};

const CASE_STUDY_SLIDE = {
  id: "caseStudy",
  title: "Tell Us About Your Previous Work",
  progressValue: 54,
  continueLabel: "Continue",
};

const SERVICE_REVIEW_SLIDE = {
  id: "serviceReview",
  title: "Final Review Before Submission",
  progressValue: 92,
  continueLabel: "Continue",
};

const ACCEPT_IN_PROGRESS_PROJECTS_SLIDE = {
  id: "acceptInProgressProjects",
  title: "Do You Accept Ongoing Projects?",
  progressValue: 96,
  continueLabel: "Continue",
  footerMode: "hidden",
};

const COMMUNICATION_POLICY_SLIDE = {
  id: "communicationPolicy",
  title: "Freelancer Agreement & Terms And Conditions",
  progressValue: 100,
  continueLabel: "Agree & Continue",
};

const INDIVIDUAL_FLOW_SLIDES = [
  ...COMMON_START_SLIDES,
  {
    id: "individualProof",
    progressValue: 12,
    continueLabel: "Continue",
    footerMode: "hidden",
  },
  BASIC_PROFILE_SLIDE,
  SERVICES_SLIDE,
  SERVICE_QUICK_INFO_SLIDE,
  CASE_STUDY_SLIDE,
  SERVICE_REVIEW_SLIDE,
  ACCEPT_IN_PROGRESS_PROJECTS_SLIDE,
  COMMUNICATION_POLICY_SLIDE,
];

export const FREELANCER_ONBOARDING_SLIDES = INDIVIDUAL_FLOW_SLIDES;

export const getOnboardingSlides = () => FREELANCER_ONBOARDING_SLIDES;
