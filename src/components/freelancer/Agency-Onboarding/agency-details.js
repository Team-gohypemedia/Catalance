import { normalizeStringArray } from "@/components/freelancer/Freelancer-Onboarding/service-details";

export const AGENCY_SLIDE_IDS = Object.freeze([
  "agencyOverview",
  "agencyTeam",
  "agencyOperations",
  "agencyTrust",
]);

export const AGENCY_TYPE_OPTIONS = [
  { value: "studio", label: "Studio" },
  { value: "agency", label: "Agency" },
  { value: "product_studio", label: "Product Studio" },
  { value: "growth_partner", label: "Growth Partner" },
  { value: "collective", label: "Collective" },
];

export const AGENCY_TEAM_SIZE_OPTIONS = [
  { value: "1_3", label: "1-3 people" },
  { value: "4_10", label: "4-10 people" },
  { value: "11_25", label: "11-25 people" },
  { value: "26_50", label: "26-50 people" },
  { value: "50_plus", label: "50+ people" },
];

export const AGENCY_CORE_ROLE_OPTIONS = [
  { value: "design", label: "Design" },
  { value: "development", label: "Development" },
  { value: "product_management", label: "Product Management" },
  { value: "qa", label: "QA / Testing" },
  { value: "branding", label: "Brand Strategy" },
  { value: "content", label: "Content / Copy" },
  { value: "marketing", label: "Marketing" },
  { value: "motion", label: "Motion / Video" },
];

export const AGENCY_RESPONSE_TIME_OPTIONS = [
  { value: "under_2_hours", label: "Under 2 hours" },
  { value: "same_day", label: "Same day" },
  { value: "within_24_hours", label: "Within 24 hours" },
  { value: "within_48_hours", label: "Within 48 hours" },
];

export const AGENCY_COLLABORATION_STYLE_OPTIONS = [
  { value: "async_first", label: "Async-first" },
  { value: "hybrid", label: "Hybrid" },
  { value: "meeting_heavy", label: "Meeting-heavy" },
  { value: "dedicated_pm", label: "Dedicated PM" },
];

export const AGENCY_TIMEZONE_OPTIONS = [
  { value: "same_timezone", label: "Same timezone" },
  { value: "within_3_hours", label: "Within 3 hours" },
  { value: "within_6_hours", label: "Within 6 hours" },
  { value: "global", label: "Global coverage" },
];

export const AGENCY_INDUSTRY_OPTIONS = [
  { value: "saas", label: "SaaS" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "fintech", label: "Fintech" },
  { value: "healthcare", label: "Healthcare" },
  { value: "edtech", label: "EdTech" },
  { value: "real_estate", label: "Real Estate" },
  { value: "logistics", label: "Logistics" },
  { value: "media", label: "Media / Entertainment" },
  { value: "ai", label: "AI / Automation" },
  { value: "b2b", label: "B2B Services" },
];

export const AGENCY_BUSINESS_REGISTRATION_OPTIONS = [
  { value: "registered", label: "Registered business" },
  { value: "in_progress", label: "Registration in progress" },
  { value: "not_registered", label: "Not registered yet" },
];

export const createInitialAgencyProfileForm = () => ({
  companyName: "",
  website: "",
  foundedYear: "",
  agencyType: "",
  tagline: "",
  teamSize: "",
  coreRoles: [],
  timezoneCoverage: "",
  responseTime: "",
  collaborationStyle: "",
  industries: [],
  businessRegistration: "",
  registrationId: "",
  certifications: "",
  ndaAvailable: false,
});

const normalizeFoundedYear = (value) =>
  String(value || "")
    .replace(/[^\d]/g, "")
    .slice(0, 4);

const buildAgencyOverviewValidationErrors = (form) => {
  const errors = {};
  const companyName = String(form?.companyName || "").trim();
  const agencyType = String(form?.agencyType || "").trim();
  const foundedYear = normalizeFoundedYear(form?.foundedYear);
  const rawFoundedYear = String(form?.foundedYear || "").trim();

  if (!companyName) {
    errors.companyName = "Please enter your agency name.";
  }

  if (!agencyType) {
    errors.agencyType = "Please select an agency type.";
  }

  if (rawFoundedYear && foundedYear.length !== 4) {
    errors.foundedYear = "Please enter a 4-digit founding year.";
  }

  return errors;
};

const buildAgencyTeamValidationErrors = (form) => {
  const errors = {};
  const teamSize = String(form?.teamSize || "").trim();
  const coreRoles = normalizeStringArray(form?.coreRoles);
  const timezoneCoverage = String(form?.timezoneCoverage || "").trim();

  if (!teamSize) {
    errors.teamSize = "Please choose your team size.";
  }

  if (!coreRoles.length) {
    errors.coreRoles = "Please select at least one core role.";
  }

  if (!timezoneCoverage) {
    errors.timezoneCoverage = "Please choose your timezone coverage.";
  }

  return errors;
};

const buildAgencyOperationsValidationErrors = (form) => {
  const errors = {};
  const responseTime = String(form?.responseTime || "").trim();
  const collaborationStyle = String(form?.collaborationStyle || "").trim();

  if (!responseTime) {
    errors.responseTime = "Please select your response time.";
  }

  if (!collaborationStyle) {
    errors.collaborationStyle = "Please choose a collaboration style.";
  }

  return errors;
};

const buildAgencyTrustValidationErrors = (form) => {
  const errors = {};
  const industries = normalizeStringArray(form?.industries);
  const businessRegistration = String(form?.businessRegistration || "").trim();

  if (!industries.length) {
    errors.industries = "Please select at least one industry.";
  }

  if (!businessRegistration) {
    errors.businessRegistration = "Please choose your registration status.";
  }

  return errors;
};

export const sanitizeAgencyProfileFormForDraft = (form = {}) => {
  const sourceForm = form && typeof form === "object" ? form : {};
  const initialForm = createInitialAgencyProfileForm();

  return {
    ...initialForm,
    companyName: String(sourceForm.companyName || "").trim(),
    website: String(sourceForm.website || "").trim(),
    foundedYear: normalizeFoundedYear(sourceForm.foundedYear),
    agencyType: String(sourceForm.agencyType || "").trim(),
    tagline: String(sourceForm.tagline || "").trim(),
    teamSize: String(sourceForm.teamSize || "").trim(),
    coreRoles: normalizeStringArray(sourceForm.coreRoles),
    timezoneCoverage: String(sourceForm.timezoneCoverage || "").trim(),
    responseTime: String(sourceForm.responseTime || "").trim(),
    collaborationStyle: String(sourceForm.collaborationStyle || "").trim(),
    industries: normalizeStringArray(sourceForm.industries),
    businessRegistration: String(sourceForm.businessRegistration || "").trim(),
    registrationId: String(sourceForm.registrationId || "").trim(),
    certifications: String(sourceForm.certifications || "").trim(),
    ndaAvailable: Boolean(sourceForm.ndaAvailable),
  };
};

export const getAgencyStepValidationErrors = (form = {}, stepId = "") => {
  const normalizedStepId = String(stepId || "").trim();
  const normalizedForm = sanitizeAgencyProfileFormForDraft(form);

  if (normalizedStepId === "agencyOverview") {
    return buildAgencyOverviewValidationErrors(normalizedForm);
  }

  if (normalizedStepId === "agencyTeam") {
    return buildAgencyTeamValidationErrors(normalizedForm);
  }

  if (normalizedStepId === "agencyOperations") {
    return buildAgencyOperationsValidationErrors(normalizedForm);
  }

  if (normalizedStepId === "agencyTrust") {
    return buildAgencyTrustValidationErrors(normalizedForm);
  }

  return {};
};

export const getAgencyStepValidationMessage = (form = {}, stepId = "") => {
  const errors = getAgencyStepValidationErrors(form, stepId);
  return Object.values(errors).find(Boolean) || "";
};
