import { startTransition, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import ProfileImageCropDialog from "@/components/common/ProfileImageCropDialog";
import Loader from "@/components/common/Loader";
import { DarkGradientBg } from "@/components/elegant-dark-pattern";
import {
  DEFAULT_BASIC_PROFILE_FIELDS,
  resolveBasicProfileFields,
  resolveCaseStudyFields,
  resolveServiceInfoFields,
  resolveServicePricingFields,
} from "@/shared/lib/freelancer-onboarding-content";
import {
  API_BASE_URL,
  fetchStatesByCountry,
  listFreelancers,
  updateProfile,
} from "@/shared/lib/api-client";
import { useAuth } from "@/shared/context/AuthContext";
import {
  ONBOARDING_FOOTER_PRIMARY_BUTTON_CLASS,
  ONBOARDING_FOOTER_SECONDARY_BUTTON_CLASS,
} from "./typography";
import {
  COUNTRY_OPTIONS,
  LANGUAGE_OPTIONS,
  resolveStateOptionsForCountry,
} from "@/components/features/freelancer/onboarding/constants";
import { normalizeUsernameInput } from "@/components/features/freelancer/onboarding/utils";
import {
  FREELANCER_DASHBOARD_PATH,
} from "@/shared/lib/dashboard-preference";
import {
  createEmptyServiceCaseStudy,
  createEmptyServiceDraft,
  deriveDraftSkillsAndTechnologies,
  MAX_ONBOARDING_CASE_STUDIES,
  getServiceStepValidationErrors,
  getServiceStepValidationMessage,
  getServiceCatalogMeta,
  normalizeServiceDraft,
  normalizeStringArray as normalizeDraftSkillList,
  resolveServiceCatalogEntry,
  resolveServiceKey,
  serializeServiceDraft,
} from "@/components/freelancer/Freelancer-Onboarding/service-details";
import {
  createInitialAgencyProfileForm,
  getAgencyStepValidationErrors,
  getAgencyStepValidationMessage,
  sanitizeAgencyProfileFormForDraft,
  AGENCY_SLIDE_IDS,
} from "./agency-details";
import { getOnboardingSlides as getOnboardingSlideSet } from "./constants";
const FreelancerWelcomeSlide = lazy(() => import("@/components/freelancer/Freelancer-Onboarding/slides/FreelancerWelcomeSlide"));
const FreelancerWorkPreferenceSlide = lazy(() => import("@/components/freelancer/Freelancer-Onboarding/slides/FreelancerWorkPreferenceSlide"));
const FreelancerIndividualProofSlide = lazy(() => import("@/components/freelancer/Freelancer-Onboarding/slides/FreelancerIndividualProofSlide"));
const AgencyOverviewSlide = lazy(() => import("./slides/AgencyOverviewSlide"));
const AgencyTeamSlide = lazy(() => import("./slides/AgencyTeamSlide"));
const AgencyOperationsSlide = lazy(() => import("./slides/AgencyOperationsSlide"));
const AgencyTrustSlide = lazy(() => import("./slides/AgencyTrustSlide"));
const FreelancerBasicProfileSlide = lazy(() => import("@/components/freelancer/Freelancer-Onboarding/slides/FreelancerBasicProfileSlide"));
const FreelancerServicesSlide = lazy(() => import("@/components/freelancer/Freelancer-Onboarding/slides/FreelancerServicesSlide"));
const FreelancerServiceSetupSlide = lazy(() => import("@/components/freelancer/Freelancer-Onboarding/slides/FreelancerServiceSetupSlide"));
const FreelancerServiceInfoSlide = lazy(() => import("@/components/freelancer/Freelancer-Onboarding/slides/FreelancerServiceInfoSlide"));
const FreelancerServicePricingSlide = lazy(() => import("@/components/freelancer/Freelancer-Onboarding/slides/FreelancerServicePricingSlide"));
const FreelancerServiceVisualsSlide = lazy(() => import("@/components/freelancer/Freelancer-Onboarding/slides/FreelancerServiceVisualsSlide"));
const FreelancerCaseStudySlide = lazy(() => import("@/components/freelancer/Freelancer-Onboarding/slides/FreelancerCaseStudySlide"));
const AgencyServiceReviewSlide = lazy(() => import("./slides/AgencyServiceReviewSlide"));
const FreelancerAcceptInProgressProjectsSlide = lazy(() => import("@/components/freelancer/Freelancer-Onboarding/slides/FreelancerAcceptInProgressProjectsSlide"));
const FreelancerDeliveryPolicySlide = lazy(() => import("@/components/freelancer/Freelancer-Onboarding/slides/FreelancerDeliveryPolicySlide"));
const FreelancerCommunicationPolicySlide = lazy(() => import("@/components/freelancer/Freelancer-Onboarding/slides/FreelancerCommunicationPolicySlide"));
import { useOnboardingTheme } from "../Freelancer-Onboarding/useOnboardingTheme";

const slideRegistry = {
  welcome: FreelancerWelcomeSlide,
  workPreference: FreelancerWorkPreferenceSlide,
  individualProof: FreelancerIndividualProofSlide,
  agencyOverview: AgencyOverviewSlide,
  agencyTeam: AgencyTeamSlide,
  agencyOperations: AgencyOperationsSlide,
  agencyTrust: AgencyTrustSlide,
  basicProfile: FreelancerBasicProfileSlide,
  services: FreelancerServicesSlide,
  serviceSetup: FreelancerServiceSetupSlide,
  serviceInfo: FreelancerServiceInfoSlide,
  servicePricing: FreelancerServicePricingSlide,
  serviceVisuals: FreelancerServiceVisualsSlide,
  caseStudy: FreelancerCaseStudySlide,
  serviceReview: AgencyServiceReviewSlide,
  acceptInProgressProjects: FreelancerAcceptInProgressProjectsSlide,
  deliveryPolicy: FreelancerDeliveryPolicySlide,
  communicationPolicy: FreelancerCommunicationPolicySlide,
};

const AVATAR_UPLOAD_MAX_BYTES = 4.5 * 1024 * 1024;
const RESUME_UPLOAD_MAX_BYTES = 4.5 * 1024 * 1024;
const RESUME_AUTOFILL_CONFIDENCE_THRESHOLD = 0.9;
const MIN_USERNAME_LENGTH = 3;
const RESUME_UPLOAD_ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const RESUME_UPLOAD_ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];
const SYSTEM_BASIC_PROFILE_FIELD_IDS = new Set(
  DEFAULT_BASIC_PROFILE_FIELDS.map((field) => field.id),
);
const BASIC_PROFILE_FIELD_ORDER = [
  "fullName",
  "username",
  "professionalBio",
  "country",
  "state",
  "languages",
];

const createInitialBasicProfileForm = () => ({
  fullName: "",
  username: "",
  professionalBio: "",
  country: "India",
  state: "",
  languages: [],
  profilePhoto: null,
  resume: null,
});

const createInitialResumeAutofillState = () => ({
  tone: "muted",
  message: "",
});

const getBasicProfileFieldValue = (form, fieldId) => {
  const normalizedFieldId = String(fieldId || "").trim();
  if (!normalizedFieldId) {
    return "";
  }

  if (SYSTEM_BASIC_PROFILE_FIELD_IDS.has(normalizedFieldId)) {
    return form?.[normalizedFieldId];
  }

  return "";
};

const hasAutofillableFieldValue = (value) => {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return Boolean(String(value ?? "").trim());
};

const isCaseStudyEffectivelyEmpty = (caseStudy = {}) =>
  ![
    caseStudy?.title,
    caseStudy?.description,
    caseStudy?.projectLink,
    caseStudy?.role,
    caseStudy?.timeline,
    caseStudy?.budget,
    caseStudy?.niche,
  ].some((value) => hasAutofillableFieldValue(value));

const findMatchingOptionValue = (options = [], candidate) => {
  const normalizedCandidate = String(candidate || "").trim().toLowerCase();
  if (!normalizedCandidate) {
    return "";
  }

  const matchingOption = options.find((option) => {
    const value = String(option?.value || "").trim().toLowerCase();
    const label = String(option?.label || option?.value || "").trim().toLowerCase();
    return value === normalizedCandidate || label === normalizedCandidate;
  });

  return matchingOption?.value || "";
};

const normalizeConfidenceValue = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.min(Math.max(numericValue, 0), 1);
};

const normalizeResumeAutofillFieldOptions = ({
  field,
  countryOptions,
  stateOptions,
  languageOptions,
}) => {
  if (field.dataSource === "countryOptions") {
    return countryOptions.map((option) => ({ value: option, label: option }));
  }

  if (field.dataSource === "stateOptions") {
    return stateOptions.map((option) => ({ value: option, label: option }));
  }

  if (field.dataSource === "languageOptions") {
    return languageOptions.map((option) => ({
      value: option.value,
      label: option.label,
    }));
  }

  return Array.isArray(field.options) ? field.options : [];
};

const extractProfilePhotoUrl = (value) => {
  if (!value) return "";
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "object") {
    return String(value.uploadedUrl || value.url || "").trim();
  }
  return "";
};

const extractProfilePhotoFile = (value) =>
  typeof File !== "undefined" && value?.file instanceof File ? value.file : null;

const buildRemoteProfilePhoto = (url, name = "Profile Photo") => {
  const normalizedUrl = String(url || "").trim();
  if (!normalizedUrl) return null;
  return {
    name,
    url: normalizedUrl,
    uploadedUrl: normalizedUrl,
    file: null,
  };
};

const extractResumeUrl = (value) => {
  if (!value) return "";
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "object") {
    return String(value.uploadedUrl || value.url || "").trim();
  }
  return "";
};

const extractResumeFile = (value) =>
  typeof File !== "undefined" && value?.file instanceof File ? value.file : null;

const buildRemoteResumeFile = (url, name = "Resume") => {
  const normalizedUrl = String(url || "").trim();
  if (!normalizedUrl) return null;
  return {
    name,
    url: normalizedUrl,
    uploadedUrl: normalizedUrl,
    file: null,
  };
};

const extractServiceMediaUrl = (value) => {
  if (!value) return "";
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "object") {
    return String(value.uploadedUrl || value.url || "").trim();
  }
  return "";
};

const extractServiceMediaFile = (value) => {
  if (typeof File === "undefined") return null;
  if (value instanceof File) return value;
  return value?.file instanceof File ? value.file : null;
};

const isServiceMediaVideo = (value) => {
  const normalizedKind = String(value?.kind || "").trim().toLowerCase();
  if (normalizedKind === "video") {
    return true;
  }

  const file = extractServiceMediaFile(value);
  if (file?.type) {
    return String(file.type).trim().toLowerCase().startsWith("video/");
  }

  return String(value?.mimeType || value?.type || value?.contentType || "")
    .trim()
    .toLowerCase()
    .startsWith("video/");
};

const buildRemoteServiceMedia = (value, index = 0) => {
  const uploadedUrl = extractServiceMediaUrl(value);
  if (!uploadedUrl) return null;

  const mimeType = String(
    value?.mimeType || value?.type || value?.contentType || "",
  )
    .trim()
    .toLowerCase();
  const kind =
    String(value?.kind || "").trim().toLowerCase() ||
    (mimeType.startsWith("video/") ? "video" : "image");

  return {
    name:
      String(value?.name || "").trim() ||
      `${kind === "video" ? "Video" : "Image"} ${index + 1}`,
    url: uploadedUrl,
    uploadedUrl,
    key: String(value?.key || "").trim(),
    kind,
    mimeType: mimeType || (kind === "video" ? "video/mp4" : "image/jpeg"),
    size:
      Number.isFinite(Number(value?.size)) && Number(value.size) > 0
        ? Number(value.size)
        : null,
    file: null,
  };
};

const buildPersistedServiceMedia = (value, index = 0) => {
  const remoteMedia = buildRemoteServiceMedia(value, index);
  if (!remoteMedia) return null;

  return {
    url: remoteMedia.uploadedUrl,
    key: remoteMedia.key || null,
    name: remoteMedia.name || null,
    kind: remoteMedia.kind,
    mimeType: remoteMedia.mimeType || null,
    size: remoteMedia.size ?? null,
  };
};

const extractCaseStudyFileUrl = (value) => {
  if (!value) return "";
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "object") {
    return String(value.uploadedUrl || value.url || "").trim();
  }
  return "";
};

const extractCaseStudyFile = (value) => {
  if (typeof File === "undefined") return null;
  if (value instanceof File) return value;
  return value?.file instanceof File ? value.file : null;
};

const buildRemoteCaseStudyFile = (value) => {
  const uploadedUrl = extractCaseStudyFileUrl(value);
  if (!uploadedUrl) {
    return null;
  }

  return {
    name: String(value?.name || "Project File").trim() || "Project File",
    url: uploadedUrl,
    uploadedUrl,
    key: String(value?.key || "").trim() || null,
    type: String(value?.type || value?.mimeType || "").trim() || null,
    size:
      Number.isFinite(Number(value?.size)) && Number(value.size) > 0
        ? Number(value.size)
        : null,
    file: null,
  };
};

const isBlobUrl = (value = "") => String(value || "").startsWith("blob:");

const revokeObjectUrlIfNeeded = (value) => {
  if (isBlobUrl(value)) {
    URL.revokeObjectURL(value);
  }
};

const buildLocationLabel = ({ state, country }) =>
  [String(state || "").trim(), String(country || "").trim()]
    .filter(Boolean)
    .join(", ");

const ONBOARDING_DRAFT_STORAGE_VERSION = 2;
const ONBOARDING_DRAFT_STORAGE_PREFIX = "catalance.agency-onboarding";

const buildOnboardingDraftStorageKey = (userId) => {
  const normalizedUserId = String(userId || "").trim();
  return normalizedUserId
    ? `${ONBOARDING_DRAFT_STORAGE_PREFIX}.${normalizedUserId}`
    : "";
};

const readStoredOnboardingDraft = (storageKey) => {
  if (!storageKey || typeof window === "undefined") {
    return null;
  }

  try {
    const rawDraft = window.localStorage.getItem(storageKey);
    if (!rawDraft) {
      return null;
    }

    const parsedDraft = JSON.parse(rawDraft);
    return parsedDraft && typeof parsedDraft === "object" ? parsedDraft : null;
  } catch (error) {
    console.error("Failed to read onboarding draft:", error);
    window.localStorage.removeItem(storageKey);
    return null;
  }
};

const writeStoredOnboardingDraft = (storageKey, draft) => {
  if (!storageKey || typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(draft));
  } catch (error) {
    console.error("Failed to write onboarding draft:", error);
  }
};

const clearStoredOnboardingDraft = (storageKey) => {
  if (!storageKey || typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(storageKey);
};

const clampSlideIndex = (value, totalSlides) => {
  const parsedValue = Number(value);
  if (!Number.isInteger(parsedValue)) {
    return 0;
  }

  return Math.min(Math.max(parsedValue, 0), Math.max(totalSlides - 1, 0));
};

const clampServiceIndex = (value, serviceCount) => {
  const parsedValue = Number(value);
  if (!Number.isInteger(parsedValue) || serviceCount <= 0) {
    return 0;
  }

  return Math.min(Math.max(parsedValue, 0), serviceCount - 1);
};

const toPersistableProfilePhoto = (value) => {
  const photoUrl = extractProfilePhotoUrl(value);
  if (!photoUrl || isBlobUrl(photoUrl)) {
    return null;
  }

  return buildRemoteProfilePhoto(photoUrl, value?.name || "Profile Photo");
};

const toPersistableResumeFile = (value) => {
  const resumeUrl = extractResumeUrl(value);
  if (!resumeUrl || isBlobUrl(resumeUrl)) {
    return null;
  }

  return buildRemoteResumeFile(resumeUrl, value?.name || "Resume");
};

const toPersistableServiceMedia = (value, index = 0) => {
  const mediaUrl = extractServiceMediaUrl(value);
  if (!mediaUrl || isBlobUrl(mediaUrl)) {
    return null;
  }

  return buildRemoteServiceMedia(value, index);
};

const toPersistableCaseStudyFile = (value) => {
  const fileUrl = extractCaseStudyFileUrl(value);
  if (!fileUrl || isBlobUrl(fileUrl)) {
    return null;
  }

  return buildRemoteCaseStudyFile(value);
};

const sanitizeBasicProfileFormForDraft = (form) => {
  const sourceForm = form && typeof form === "object" ? form : {};
  const initialForm = createInitialBasicProfileForm();

  return {
    ...initialForm,
    fullName: String(sourceForm.fullName || "").trim(),
    username: normalizeUsernameInput(sourceForm.username || ""),
    professionalBio: String(sourceForm.professionalBio || "").trim(),
    country: String(sourceForm.country || initialForm.country || "India").trim(),
    state: String(sourceForm.state || "").trim(),
    languages: normalizeStringArray(sourceForm.languages),
    profilePhoto: toPersistableProfilePhoto(sourceForm.profilePhoto),
    resume: toPersistableResumeFile(sourceForm.resume),
  };
};

const resolveBasicProfileFullName = (user = {}) => {
  const profileDetails =
    user?.profileDetails && typeof user.profileDetails === "object"
      ? user.profileDetails
      : {};
  const identity =
    profileDetails.identity && typeof profileDetails.identity === "object"
      ? profileDetails.identity
      : {};

  return String(
    identity.fullName ||
      profileDetails.fullName ||
      user?.fullName ||
      user?.name ||
      "",
  ).trim();
};

const sanitizeServiceDraftForStorage = (
  draft,
  { serviceKey = "", serviceId = null } = {},
) => {
  const normalizedDraft = normalizeServiceDraft(draft, {
    serviceKey,
    serviceId,
  });
  const normalizedCaseStudies = Array.isArray(normalizedDraft.caseStudies)
    ? normalizedDraft.caseStudies.map((caseStudy) => ({
        ...caseStudy,
        projectFile: toPersistableCaseStudyFile(caseStudy?.projectFile),
      }))
    : [];
  const activeCaseStudyId = normalizedCaseStudies.some(
    (caseStudy) => caseStudy.id === normalizedDraft.activeCaseStudyId,
  )
    ? normalizedDraft.activeCaseStudyId
    : normalizedCaseStudies[0]?.id || null;

  return {
    ...normalizedDraft,
    coverImage: isBlobUrl(normalizedDraft.coverImage)
      ? ""
      : normalizedDraft.coverImage,
    mediaFiles: normalizedDraft.mediaFiles
      .map((value, index) => toPersistableServiceMedia(value, index))
      .filter(Boolean),
    caseStudies: normalizedCaseStudies,
    activeCaseStudyId,
    caseStudy: normalizedCaseStudies[0] || null,
  };
};

const buildOnboardingDraftSnapshot = ({
  currentSlideIndex,
  totalSlides,
  selectedWorkPreference,
  basicProfileForm,
  agencyProfileForm,
  selectedServices,
  serviceDraftsByKey,
  currentServiceIndex,
  acceptInProgressProjectsValue,
  deliveryPolicyAccepted,
  communicationPolicyAccepted,
  dbServices,
}) => {
  const normalizedSelectedServices = normalizeDraftSkillList(
    selectedServices.map((serviceKey) => resolveServiceKey(dbServices, serviceKey)),
  );

  return {
    version: ONBOARDING_DRAFT_STORAGE_VERSION,
    savedAt: new Date().toISOString(),
    currentSlideIndex: clampSlideIndex(currentSlideIndex, totalSlides),
    selectedWorkPreference:
      String(selectedWorkPreference || "").trim(),
    basicProfileForm: sanitizeBasicProfileFormForDraft(basicProfileForm),
    agencyProfileForm: sanitizeAgencyProfileFormForDraft(agencyProfileForm),
    selectedServices: normalizedSelectedServices,
    serviceDraftsByKey: Object.fromEntries(
      normalizedSelectedServices.map((serviceKey) => {
        const serviceMeta = getServiceCatalogMeta(dbServices, serviceKey);
        return [
          serviceKey,
          sanitizeServiceDraftForStorage(serviceDraftsByKey?.[serviceKey], {
            serviceKey,
            serviceId: serviceMeta.serviceId,
          }),
        ];
      }),
    ),
    currentServiceIndex: clampServiceIndex(
      currentServiceIndex,
      normalizedSelectedServices.length,
    ),
    acceptInProgressProjectsValue:
      parseBooleanChoice(acceptInProgressProjectsValue),
    deliveryPolicyAccepted: parseBooleanChoice(deliveryPolicyAccepted) ?? false,
    communicationPolicyAccepted:
      parseBooleanChoice(communicationPolicyAccepted) ?? false,
  };
};

const USERNAME_AVAILABILITY_ERROR = "That username is already taken.";
const USERNAME_CHECK_ERROR = "Unable to verify username right now.";
const SERVICE_EXPERIENCE_STORAGE_LABELS = {
  entry: "Entry 0–1 years",
  intermediate: "Intermediate 1–3 years",
  experienced: "Experienced 3–5 years",
  expert: "Expert 5–10 years",
  veteran: "Veteran 10+ years",
};


const DELIVERY_TIMELINE_STORAGE_LABELS = {
  "1_week": "1 Week",
  "2_weeks": "2 Weeks",
  "3_weeks": "3 Weeks",
  "4_weeks": "4 Weeks",
  "6_weeks": "6 Weeks",
  "8_weeks": "8 Weeks",
  "12_weeks": "12 Weeks",
  ongoing: "Ongoing / Retainer",
};



const findStorageKeyByLabel = (map, label) =>
  Object.entries(map).find(([, value]) => value === String(label || "").trim())?.[0] || "";

const resolveStoredSelectKey = (map, value) => {
  const normalizedValue = String(value || "").trim();
  if (!normalizedValue) {
    return "";
  }

  if (Object.prototype.hasOwnProperty.call(map, normalizedValue)) {
    return normalizedValue;
  }

  return findStorageKeyByLabel(map, normalizedValue) || normalizedValue;
};

const normalizeStringArray = (values) => {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  );
};

const parseBooleanChoice = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
    return null;
  }

  const normalizedValue = String(value || "").trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(normalizedValue)) {
    return true;
  }
  if (["false", "0", "no", "n"].includes(normalizedValue)) {
    return false;
  }

  return null;
};

const normalizeSubcategorySkillMap = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce((accumulator, [subcategoryId, skills]) => {
    const normalizedSubcategoryId = String(subcategoryId || "").trim();
    if (!normalizedSubcategoryId) {
      return accumulator;
    }

    const normalizedSkills = normalizeStringArray(skills);
    if (normalizedSkills.length > 0) {
      accumulator[normalizedSubcategoryId] = normalizedSkills;
    }

    return accumulator;
  }, {});
};

let cachedMarketplaceServices = [];
let marketplaceServicesRequest = null;
let cachedMarketplaceNiches = [];
let marketplaceNichesRequest = null;
const cachedPositiveKeywordsByServiceId = {};

const fetchMarketplaceServices = async () => {
  if (cachedMarketplaceServices.length) {
    return cachedMarketplaceServices;
  }

  if (!marketplaceServicesRequest) {
    marketplaceServicesRequest = fetch(`${API_BASE_URL}/marketplace/filters/services`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch services");
        }

        const payload = await response.json();
        const services = Array.isArray(payload?.data)
          ? payload.data.slice().sort((a, b) => a.id - b.id)
          : [];

        cachedMarketplaceServices = services;
        return services;
      })
      .finally(() => {
        marketplaceServicesRequest = null;
      });
  }

  return marketplaceServicesRequest;
};

const fetchMarketplaceNiches = async () => {
  if (cachedMarketplaceNiches.length) {
    return cachedMarketplaceNiches;
  }

  if (!marketplaceNichesRequest) {
    marketplaceNichesRequest = fetch(`${API_BASE_URL}/marketplace/filters/niches`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch niches");
        }

        const payload = await response.json();
        const niches = Array.isArray(payload?.data)
          ? payload.data
              .map((entry) => ({
                value: String(entry?.name || "").trim(),
                label: String(entry?.label || entry?.name || "").trim(),
              }))
              .filter((entry) => entry.value && entry.label)
          : [];

        cachedMarketplaceNiches = niches;
        return niches;
      })
      .finally(() => {
        marketplaceNichesRequest = null;
      });
  }

  return marketplaceNichesRequest;
};

const fetchServicePositiveKeywords = async (serviceId) => {
  if (!serviceId) return [];
  if (cachedPositiveKeywordsByServiceId[serviceId]) {
    return cachedPositiveKeywordsByServiceId[serviceId];
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/marketplace/filters/keywords?serviceId=${serviceId}`,
    );
    if (!response.ok) return [];
    const payload = await response.json();
    const keywords = Array.isArray(payload?.data)
      ? payload.data.map((entry) => String(entry?.name || "").trim()).filter(Boolean)
      : [];
    cachedPositiveKeywordsByServiceId[serviceId] = keywords;
    return keywords;
  } catch {
    return [];
  }
};

const getBasicProfileFieldError = (field, form) => {
  switch (field) {
    case "fullName":
      return String(form.fullName || "").trim()
        ? ""
        : "Please enter your full name.";
    case "username": {
      const username = normalizeUsernameInput(form.username);

      if (!username) {
        return "Please enter a username.";
      }
      if (username.length < MIN_USERNAME_LENGTH) {
        return `Username must be at least ${MIN_USERNAME_LENGTH} characters long.`;
      }
      if (!/^[a-z0-9]+$/.test(username)) {
        return "Username can only contain letters and numbers.";
      }
      return "";
    }
    case "professionalBio":
      return String(form.professionalBio || "").trim()
        ? ""
        : "Please enter your professional bio.";
    case "country":
      return String(form.country || "").trim() ? "" : "Please select your country.";
    case "state":
      return String(form.state || "").trim()
        ? ""
        : "Please select or enter your state / province.";
    case "languages":
      return Array.isArray(form.languages) && form.languages.length > 0
        ? ""
        : "Please select at least one language.";
    default:
      return "";
  }
};

const buildBasicProfileValidationErrors = (form) =>
  BASIC_PROFILE_FIELD_ORDER.reduce((errors, field) => {
    const fieldError = getBasicProfileFieldError(field, form);

    if (fieldError) {
      errors[field] = fieldError;
    }

    return errors;
  }, {});

const getFirstBasicProfileError = (errors) =>
  BASIC_PROFILE_FIELD_ORDER.map((field) => errors[field]).find(Boolean) || "";

const AgencyOnboardingShell = ({
  embedded = false,
  onExitAgencyFlow = null,
  onResetOnboarding = null,
} = {}) => {
  const navigate = useNavigate();
  const { stepId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { authFetch, refreshUser, user } = useAuth();
  const usernameCheckRequestRef = useRef(0);
  const onboardingScrollContainerRef = useRef(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedWorkPreference, setSelectedWorkPreference] = useState("agency");
  const [basicProfileForm, setBasicProfileForm] = useState(
    createInitialBasicProfileForm(),
  );
  const [agencyProfileForm, setAgencyProfileForm] = useState(
    createInitialAgencyProfileForm(),
  );
  const [selectedServices, setSelectedServices] = useState([]);
  const [serviceDraftsByKey, setServiceDraftsByKey] = useState({});
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0);
  const [acceptInProgressProjectsValue, setAcceptInProgressProjectsValue] =
    useState(null);
  const [deliveryPolicyAccepted, setDeliveryPolicyAccepted] = useState(false);
  const [communicationPolicyReady, setCommunicationPolicyReady] = useState(false);
  const [communicationPolicyAccepted, setCommunicationPolicyAccepted] =
    useState(false);
  const [dbServices, setDbServices] = useState(cachedMarketplaceServices);
  const [dbNiches, setDbNiches] = useState(cachedMarketplaceNiches);
  const [suggestedKeywords, setSuggestedKeywords] = useState([]);
  const [isSuggestedKeywordsLoading, setIsSuggestedKeywordsLoading] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [, setProfileError] = useState("");
  const [basicProfileErrors, setBasicProfileErrors] = useState({});
  const [agencyValidationErrorsByStep, setAgencyValidationErrorsByStep] =
    useState({});
  const [serviceValidationErrorsByStep, setServiceValidationErrorsByStep] =
    useState({});
  const [stateOptions, setStateOptions] = useState([]);
  const [isStateOptionsLoading, setIsStateOptionsLoading] = useState(false);
  const [pendingProfilePhotoFile, setPendingProfilePhotoFile] = useState(null);
  const [isProfileCropOpen, setIsProfileCropOpen] = useState(false);
  const [hasHydratedFromUser, setHasHydratedFromUser] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState("idle");
  const [isResumeAutofillRunning, setIsResumeAutofillRunning] = useState(false);
  const [resumeAutofillState, setResumeAutofillState] = useState(
    createInitialResumeAutofillState(),
  );
  const [resumeUploadRequestId, setResumeUploadRequestId] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isResettingOnboarding, setIsResettingOnboarding] = useState(false);
  const shouldUseEmbeddedExit =
    embedded && typeof onExitAgencyFlow === "function";
  const shouldUseEmbeddedReset =
    embedded && typeof onResetOnboarding === "function";
  const countryOptions = COUNTRY_OPTIONS;
  const languageOptions = LANGUAGE_OPTIONS.filter(
    (option) => option.value !== "Other",
  );
  const currentUsername = normalizeUsernameInput(
    user?.profileDetails?.identity?.username ||
      user?.profileDetails?.username ||
      user?.username ||
      "",
  );
  const onboardingDraftStorageKey = useMemo(
    () => buildOnboardingDraftStorageKey(user?.id),
    [user?.id],
  );

  useOnboardingTheme();

  const onboardingSlides = useMemo(
    () => getOnboardingSlideSet(selectedWorkPreference),
    [selectedWorkPreference],
  );

  // Sync URL -> State (useLayoutEffect prevents flicker on browser back button)
  useLayoutEffect(() => {
    if (!onboardingSlides || onboardingSlides.length === 0) return;
    
    let targetSlideIndex = 0;
    if (stepId) {
      const idx = onboardingSlides.findIndex(s => s.id === stepId);
      if (idx >= 0) targetSlideIndex = idx;
    }
    
    let targetServiceIndex = parseInt(searchParams.get("serviceIndex"), 10);
    if (Number.isNaN(targetServiceIndex)) targetServiceIndex = 0;

    setCurrentSlideIndex(prev => prev !== targetSlideIndex ? targetSlideIndex : prev);
    setCurrentServiceIndex(prev => prev !== targetServiceIndex ? targetServiceIndex : prev);
  }, [stepId, searchParams, onboardingSlides]);

  const navigateToSlideIndex = useCallback((index, sIndex = null) => {
    const slide = onboardingSlides[index];
    if (slide) {
      setCurrentSlideIndex(index);
      if (sIndex !== null && sIndex >= 0) {
        setCurrentServiceIndex(sIndex);
      }
      const url = `/agency/onboarding/${slide.id}${sIndex !== null && sIndex > 0 ? `?serviceIndex=${sIndex}` : ""}`;
      navigate(url);
    }
  }, [navigate, onboardingSlides]);

  const totalSlides = onboardingSlides.length;
  const currentSlide =
    onboardingSlides[currentSlideIndex] || onboardingSlides[0];
  const ActiveSlide = slideRegistry[currentSlide.id];
  const basicProfileFields = useMemo(() => resolveBasicProfileFields(), []);
  const globalServiceInfoFields = useMemo(() => resolveServiceInfoFields(), []);
  const globalServicePricingFields = useMemo(
    () => resolveServicePricingFields(),
    [],
  );
  const globalCaseStudyFields = useMemo(() => resolveCaseStudyFields(), []);
  const progressValue =
    currentSlide.progressValue ??
    ((currentSlideIndex + 1) / Math.max(totalSlides, 1)) * 100;
  const isFirstSlide = currentSlideIndex === 0;
  const isWorkPreferenceSlide = currentSlide.id === "workPreference";
  const isAgencySectionSlide = AGENCY_SLIDE_IDS.includes(currentSlide.id);
  const isServicesSlide = currentSlide.id === "services";
  const isServiceInfoSlide = currentSlide.id === "serviceInfo";
  const isServicePricingSlide = currentSlide.id === "servicePricing";
  const isServiceVisualsSlide = currentSlide.id === "serviceVisuals";
  const isCaseStudySlide = currentSlide.id === "caseStudy";
  const isServiceReviewSlide = currentSlide.id === "serviceReview";
  const isServiceSectionSlide =
    currentSlide.id === "serviceSetup" ||
    isServiceInfoSlide ||
    isServicePricingSlide ||
    isServiceVisualsSlide ||
    isCaseStudySlide ||
    isServiceReviewSlide;
  const isAcceptInProgressProjectsSlide =
    currentSlide.id === "acceptInProgressProjects";
  const isDeliveryPolicySlide = currentSlide.id === "deliveryPolicy";
  const isCommunicationPolicySlide = currentSlide.id === "communicationPolicy";
  const isProfileActionFooter = currentSlide.footerMode === "profileActions";
  const isFooterHidden = currentSlide.footerMode === "hidden";
  const isBaseContinueDisabled = isWorkPreferenceSlide
    ? !selectedWorkPreference
    : isServicesSlide
      ? selectedServices.length === 0
      : isAcceptInProgressProjectsSlide
        ? typeof acceptInProgressProjectsValue !== "boolean"
      : isDeliveryPolicySlide
        ? !deliveryPolicyAccepted
      : isCommunicationPolicySlide
        ? !communicationPolicyReady
      : false;
  const serviceSetupSlideIndex = onboardingSlides.findIndex(
    (slide) => slide.id === "serviceSetup",
  );
  const serviceInfoSlideIndex = onboardingSlides.findIndex(
    (slide) => slide.id === "serviceInfo",
  );
  const serviceReviewSlideIndex = onboardingSlides.findIndex(
    (slide) => slide.id === "serviceReview",
  );
  const servicePricingSlideIndex = onboardingSlides.findIndex(
    (slide) => slide.id === "servicePricing",
  );
  const serviceVisualsSlideIndex = onboardingSlides.findIndex(
    (slide) => slide.id === "serviceVisuals",
  );
  const caseStudySlideIndex = onboardingSlides.findIndex(
    (slide) => slide.id === "caseStudy",
  );
  const acceptInProgressProjectsSlideIndex =
    onboardingSlides.findIndex(
      (slide) => slide.id === "acceptInProgressProjects",
    );
  const deliveryPolicySlideIndex = onboardingSlides.findIndex(
    (slide) => slide.id === "deliveryPolicy",
  );
  const communicationPolicySlideIndex = onboardingSlides.findIndex(
    (slide) => slide.id === "communicationPolicy",
  );
  const currentServiceKey = selectedServices[currentServiceIndex] || "";
  const currentService = resolveServiceCatalogEntry(dbServices, currentServiceKey);
  const currentServiceName = String(
    currentService?.name || currentService?.label || "Service",
  ).trim() || "Service";
  const currentServiceDraft = currentServiceKey
    ? normalizeServiceDraft(serviceDraftsByKey[currentServiceKey], {
        serviceKey: currentServiceKey,
        serviceId: currentService?.id,
      })
    : createEmptyServiceDraft();

  useEffect(() => {
    if (currentSlide.id !== "services") {
      return;
    }

    const container = onboardingScrollContainerRef.current;
    if (!container) {
      return;
    }

    container.scrollTop = 0;
  }, [currentSlide.id]);

  useEffect(() => {
    if (!user || hasHydratedFromUser) {
      return;
    }

    const storedDraft = readStoredOnboardingDraft(onboardingDraftStorageKey);
    if (storedDraft) {
      const storedWorkPreference = "agency";
      const storedSlides = getOnboardingSlideSet(storedWorkPreference);
      const nextServices = normalizeDraftSkillList(
        (Array.isArray(storedDraft.selectedServices)
          ? storedDraft.selectedServices
          : []
        ).map((serviceKey) => resolveServiceKey(dbServices, serviceKey)),
      );

      navigateToSlideIndex(
        clampSlideIndex(storedDraft.currentSlideIndex, storedSlides.length),
      );
      setSelectedWorkPreference(storedWorkPreference);
      const storedBasicProfileForm = sanitizeBasicProfileFormForDraft(
        storedDraft.basicProfileForm,
      );
      setBasicProfileForm({
        ...storedBasicProfileForm,
        fullName: storedBasicProfileForm.fullName || resolveBasicProfileFullName(user),
      });
      setAgencyProfileForm(
        sanitizeAgencyProfileFormForDraft(storedDraft.agencyProfileForm),
      );
      setSelectedServices(nextServices);
      setServiceDraftsByKey(() =>
        Object.fromEntries(
          nextServices.map((serviceKey) => {
            const serviceMeta = getServiceCatalogMeta(dbServices, serviceKey);
            return [
              serviceKey,
              sanitizeServiceDraftForStorage(
                storedDraft.serviceDraftsByKey?.[serviceKey],
                {
                  serviceKey,
                  serviceId: serviceMeta.serviceId,
                },
              ),
            ];
          }),
        ),
      );
      setCurrentServiceIndex(
        clampServiceIndex(storedDraft.currentServiceIndex, nextServices.length),
      );
      setAcceptInProgressProjectsValue(
        parseBooleanChoice(storedDraft.acceptInProgressProjectsValue),
      );
      setDeliveryPolicyAccepted(
        parseBooleanChoice(storedDraft.deliveryPolicyAccepted) ?? false,
      );
      setCommunicationPolicyAccepted(
        parseBooleanChoice(storedDraft.communicationPolicyAccepted) ?? false,
      );
      setHasHydratedFromUser(true);
      return;
    }

    const profileDetails =
      user.profileDetails && typeof user.profileDetails === "object"
        ? user.profileDetails
        : {};
    const identity =
      profileDetails.identity && typeof profileDetails.identity === "object"
        ? profileDetails.identity
        : {};
    const currentLanguages = Array.isArray(identity.languages)
      ? identity.languages
      : [];
    const existingPhoto =
      identity.profilePhoto || user.avatar || user.profilePhoto || "";
    const existingResume =
      user?.resume || user?.portfolio?.resume || profileDetails?.resume || "";
    const existingAgencyDetails =
      profileDetails.agencyDetails && typeof profileDetails.agencyDetails === "object"
        ? profileDetails.agencyDetails
        : {};
    const normalizedServiceDetails =
      profileDetails.serviceDetails && typeof profileDetails.serviceDetails === "object"
        ? profileDetails.serviceDetails
        : {};
    const nextServices = normalizeDraftSkillList(
      (
        Array.isArray(profileDetails.services) && profileDetails.services.length > 0
          ? profileDetails.services
          : Array.isArray(user.services)
            ? user.services
            : Object.keys(normalizedServiceDetails)
      ).map((serviceKey) => resolveServiceKey(dbServices, serviceKey)),
    );
    const hasCanonicalServiceDetails =
      Number(profileDetails.profileDetailsVersion) >= 2 &&
      Object.keys(normalizedServiceDetails).length > 0;
    const legacySubcategorySkills = normalizeSubcategorySkillMap(
      profileDetails?.serviceSubcategorySkills,
    );
    const legacySubcategoryIds = Object.keys(legacySubcategorySkills)
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0);
    const legacyCategoryLabels = String(user?.serviceCategory || "")
      .split(",")
      .map((value) => String(value || "").trim())
      .filter(Boolean);
    const legacySkills = normalizeStringArray(
      Array.isArray(user?.skills) ? user.skills : [],
    );
    const hydratedAcceptInProgressProjects = parseBooleanChoice(
      profileDetails.acceptInProgressProjects ??
        user?.acceptInProgressProjects,
    );
    const hydratedDeliveryPolicyAccepted = parseBooleanChoice(
      profileDetails.deliveryPolicyAccepted ?? user?.deliveryPolicyAccepted,
    );
    const hydratedCommunicationPolicyAccepted = parseBooleanChoice(
      profileDetails.communicationPolicyAccepted ??
        user?.communicationPolicyAccepted,
    );

    setBasicProfileForm((currentForm) => ({
      ...currentForm,
      fullName: resolveBasicProfileFullName(user) || currentForm.fullName,
      username: normalizeUsernameInput(
        identity.username || user.username || currentForm.username,
      ),
      professionalBio: String(
        profileDetails.professionalBio || user.professionalBio || user.bio || "",
      ).trim(),
      country: String(identity.country || currentForm.country || "India").trim(),
      state: String(identity.city || user.city || "").trim(),
      languages: currentLanguages.filter(Boolean),
      profilePhoto:
        buildRemoteProfilePhoto(existingPhoto) || currentForm.profilePhoto,
      resume: buildRemoteResumeFile(existingResume) || currentForm.resume,
    }));
    setAgencyProfileForm(
      sanitizeAgencyProfileFormForDraft({
        ...existingAgencyDetails,
        companyName:
          existingAgencyDetails.companyName ||
          profileDetails.companyName ||
          profileDetails.businessName ||
          "",
      }),
    );
    setSelectedWorkPreference("agency");
    setAcceptInProgressProjectsValue(hydratedAcceptInProgressProjects);
    setDeliveryPolicyAccepted(hydratedDeliveryPolicyAccepted ?? false);
    setCommunicationPolicyAccepted(hydratedCommunicationPolicyAccepted ?? false);
    setSelectedServices(nextServices);
    setServiceDraftsByKey(() => {
      const nextDraftEntries = nextServices.map((serviceKey, index) => {
        const serviceMeta = getServiceCatalogMeta(dbServices, serviceKey);
        const detail = normalizeServiceDraft(normalizedServiceDetails?.[serviceKey], {
          serviceKey,
          serviceId: serviceMeta.serviceId,
        });

        detail.experience = resolveStoredSelectKey(
          SERVICE_EXPERIENCE_STORAGE_LABELS,
          detail.experience,
        );

        detail.deliveryTimeline = resolveStoredSelectKey(
          DELIVERY_TIMELINE_STORAGE_LABELS,
          detail.deliveryTimeline,
        );
        detail.priceRange = String(detail.priceRange || "").trim();

        if (index === 0) {
          if (!detail.title) {
            detail.title = String(user?.serviceTitle || "").trim();
          }
          if (!detail.experience) {
            detail.experience = resolveStoredSelectKey(
              SERVICE_EXPERIENCE_STORAGE_LABELS,
              user?.serviceExperience,
            );
          }

          if (!detail.description) {
            detail.description = String(user?.serviceDescription || "").trim();
          }
          if (!detail.deliveryTimeline) {
            detail.deliveryTimeline = resolveStoredSelectKey(
              DELIVERY_TIMELINE_STORAGE_LABELS,
              user?.deliveryTimeline,
            );
          }
          if (!detail.priceRange) {
            detail.priceRange = String(user?.startingPrice || "").trim();
          }
          if (!detail.keywords.length && Array.isArray(user?.serviceKeywords)) {
            detail.keywords = normalizeStringArray(user.serviceKeywords);
          }
          if (!detail.mediaFiles.length && Array.isArray(user?.serviceMedia)) {
            detail.mediaFiles = user.serviceMedia
              .map((entry, mediaIndex) => buildRemoteServiceMedia(entry, mediaIndex))
              .filter(Boolean);
          }
        }

        if (!hasCanonicalServiceDetails && index === 0) {
          if (!detail.skillsAndTechnologies.length && legacySkills.length > 0) {
            detail.skillsAndTechnologies = legacySkills;
          }

          if (!detail.subcategories.length && legacySubcategoryIds.length > 0) {
            detail.subcategories = legacySubcategoryIds.map((subCategoryId) => ({
              subCategoryId,
              selectedToolIds: [],
              customSkillNames: normalizeStringArray(
                legacySubcategorySkills[String(subCategoryId)],
              ),
            }));
          }

          if (!detail.pendingCategoryLabels.length && legacyCategoryLabels.length > 0) {
            detail.pendingCategoryLabels = legacyCategoryLabels;
          }

          const legacyActiveCategory = Number(profileDetails?.serviceActiveSkillCategory);
          if (
            Number.isInteger(legacyActiveCategory) &&
            detail.subcategories.some(
              (entry) => entry.subCategoryId === legacyActiveCategory,
            )
          ) {
            detail.activeSkillCategory = legacyActiveCategory;
          }
        }

        if (!detail.activeSkillCategory && detail.subcategories.length > 0) {
          detail.activeSkillCategory = detail.subcategories[0].subCategoryId;
        }

        return [serviceKey, detail];
      });

      return Object.fromEntries(nextDraftEntries);
    });
    setCurrentServiceIndex(0);
    setHasHydratedFromUser(true);
  }, [dbServices, hasHydratedFromUser, onboardingDraftStorageKey, totalSlides, user]);

  useEffect(() => {
    if (dbServices.length) {
      return undefined;
    }

    let isCancelled = false;

    fetchMarketplaceServices()
      .then((services) => {
        if (!isCancelled) {
          setDbServices(services);
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          console.error("Failed to preload marketplace services:", error);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [dbServices.length]);

  useEffect(() => {
    if (dbNiches.length) {
      return undefined;
    }

    let isCancelled = false;

    fetchMarketplaceNiches()
      .then((niches) => {
        if (!isCancelled) {
          setDbNiches(niches);
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          console.error("Failed to preload marketplace niches:", error);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [dbNiches.length]);

  useEffect(() => {
    setCurrentServiceIndex((currentIndex) => {
      if (selectedServices.length === 0) {
        return 0;
      }

      return Math.min(currentIndex, selectedServices.length - 1);
    });

    setServiceDraftsByKey((currentDrafts) => {
      const nextDrafts = {};
      let hasChanges = false;

      selectedServices.forEach((serviceKey) => {
        const serviceMeta = getServiceCatalogMeta(dbServices, serviceKey);
        const currentDraft = normalizeServiceDraft(currentDrafts[serviceKey], {
          serviceKey,
          serviceId: serviceMeta.serviceId,
        });
        const nextDraft = {
          ...currentDraft,
          serviceId: serviceMeta.serviceId || currentDraft.serviceId,
        };

        nextDrafts[serviceKey] = nextDraft;

        if (!Object.prototype.hasOwnProperty.call(currentDrafts, serviceKey)) {
          hasChanges = true;
          return;
        }

        if ((currentDraft.serviceId || null) !== (nextDraft.serviceId || null)) {
          hasChanges = true;
        }
      });

      if (
        !hasChanges &&
        Object.keys(currentDrafts).length === Object.keys(nextDrafts).length
      ) {
        return currentDrafts;
      }

      return nextDrafts;
    });
  }, [dbServices, selectedServices]);

  useEffect(() => {
    const selectedServiceIds = normalizeDraftSkillList(selectedServices)
      .map((serviceKey) => getServiceCatalogMeta(dbServices, serviceKey).serviceId)
      .filter((serviceId) => Number.isInteger(serviceId) && serviceId > 0);

    if (!selectedServiceIds.length) {
      return;
    }

    void Promise.all(
      selectedServiceIds.map((serviceId) => fetchServicePositiveKeywords(serviceId)),
    );
  }, [dbServices, selectedServices]);

  useEffect(() => {
    const serviceId = currentService?.id;
    if (!serviceId) {
      setSuggestedKeywords([]);
      setIsSuggestedKeywordsLoading(false);
      return;
    }

    let cancelled = false;
    setIsSuggestedKeywordsLoading(true);
    fetchServicePositiveKeywords(serviceId)
      .then((keywords) => {
        if (!cancelled) {
          startTransition(() => {
            setSuggestedKeywords(keywords);
          });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsSuggestedKeywordsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentService?.id]);

  useEffect(() => {
    if (!hasHydratedFromUser || !onboardingDraftStorageKey) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      writeStoredOnboardingDraft(
        onboardingDraftStorageKey,
        buildOnboardingDraftSnapshot({
          currentSlideIndex,
          totalSlides,
          selectedWorkPreference,
          basicProfileForm,
          agencyProfileForm,
          selectedServices,
          serviceDraftsByKey,
          currentServiceIndex,
          acceptInProgressProjectsValue,
          deliveryPolicyAccepted,
          communicationPolicyAccepted,
          dbServices,
        }),
      );
    }, 150);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    acceptInProgressProjectsValue,
    basicProfileForm,
    agencyProfileForm,
    communicationPolicyAccepted,
    currentServiceIndex,
    currentSlideIndex,
    dbServices,
    deliveryPolicyAccepted,
    hasHydratedFromUser,
    onboardingDraftStorageKey,
    selectedServices,
    selectedWorkPreference,
    serviceDraftsByKey,
    totalSlides,
  ]);

  useEffect(() => {
    const currentPhotoUrl = extractProfilePhotoUrl(basicProfileForm.profilePhoto);
    return () => {
      revokeObjectUrlIfNeeded(currentPhotoUrl);
    };
  }, [basicProfileForm.profilePhoto]);

  useEffect(() => {
    const selectedCountry = String(basicProfileForm.country || "").trim();
    if (!selectedCountry) {
      setStateOptions([]);
      setIsStateOptionsLoading(false);
      return;
    }

    let isCancelled = false;
    const fallbackStates = resolveStateOptionsForCountry(selectedCountry);
    setStateOptions(fallbackStates);
    setIsStateOptionsLoading(fallbackStates.length === 0);

    fetchStatesByCountry(selectedCountry)
      .then((response) => {
        if (isCancelled) return;

        const nextStates = resolveStateOptionsForCountry(
          selectedCountry,
          response?.states,
        );
        setStateOptions(nextStates);

        setBasicProfileForm((currentForm) => {
          if (!currentForm.state || !nextStates.length) {
            return currentForm;
          }

          return nextStates.includes(currentForm.state)
            ? currentForm
            : { ...currentForm, state: "" };
        });
      })
      .catch((error) => {
        if (isCancelled) return;
        console.error("Failed to fetch states for country:", error);
        setStateOptions(resolveStateOptionsForCountry(selectedCountry));
      })
      .finally(() => {
        if (!isCancelled) {
          setIsStateOptionsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [basicProfileForm.country]);

  const syncUsernameErrorState = useCallback((message = "", usernameValue = "") => {
    setBasicProfileErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      const localUsernameError = getBasicProfileFieldError("username", {
        username: usernameValue,
      });

      if (message) {
        nextErrors.username = message;
        return nextErrors;
      }

      if (localUsernameError) {
        nextErrors.username = localUsernameError;
        return nextErrors;
      }

      delete nextErrors.username;
      return nextErrors;
    });
  }, []);

  const checkUsernameAvailability = useCallback(async (value) => {
    const normalizedUsername = normalizeUsernameInput(value ?? basicProfileForm.username);
    const localUsernameError = getBasicProfileFieldError("username", {
      username: normalizedUsername,
    });

    if (!normalizedUsername || localUsernameError) {
      setUsernameStatus("idle");
      return "idle";
    }

    if (currentUsername && currentUsername === normalizedUsername) {
      setUsernameStatus("available");
      syncUsernameErrorState("", normalizedUsername);
      return "available";
    }

    const requestId = usernameCheckRequestRef.current + 1;
    usernameCheckRequestRef.current = requestId;
    setUsernameStatus("checking");

    try {
      const freelancers = await listFreelancers();
      if (usernameCheckRequestRef.current !== requestId) {
        return "stale";
      }

      const isTaken =
        Array.isArray(freelancers) &&
        freelancers.some((freelancer) => {
          const existingUsername = normalizeUsernameInput(
            freelancer?.profileDetails?.identity?.username ||
              freelancer?.profileDetails?.username ||
              freelancer?.username ||
              "",
          );

          return existingUsername === normalizedUsername;
        });

      if (isTaken) {
        setUsernameStatus("unavailable");
        syncUsernameErrorState(USERNAME_AVAILABILITY_ERROR, normalizedUsername);
        return "unavailable";
      }

      setUsernameStatus("available");
      syncUsernameErrorState("", normalizedUsername);
      return "available";
    } catch (error) {
      if (usernameCheckRequestRef.current !== requestId) {
        return "stale";
      }

      console.error("Failed to check username availability:", error);
      setUsernameStatus("error");
      // Don't set a form validation error for network failures — the check is advisory.
      // The server will validate uniqueness on submit.
      return "error";
    }
  }, [basicProfileForm.username, currentUsername, syncUsernameErrorState]);

  useEffect(() => {
    const normalizedUsername = normalizeUsernameInput(basicProfileForm.username);
    const localUsernameError = getBasicProfileFieldError("username", {
      username: normalizedUsername,
    });

    if (!normalizedUsername || localUsernameError) {
      setUsernameStatus("idle");
      return undefined;
    }

    if (currentUsername && currentUsername === normalizedUsername) {
      setUsernameStatus("available");
      syncUsernameErrorState("", normalizedUsername);
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      void checkUsernameAvailability(normalizedUsername);
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [basicProfileForm.username, currentUsername, checkUsernameAvailability, syncUsernameErrorState]);

  const updateCurrentServiceDraft = useCallback((updater) => {
    if (!currentServiceKey) {
      return;
    }

    setServiceDraftsByKey((currentDrafts) => {
      const baseDraft = normalizeServiceDraft(currentDrafts[currentServiceKey], {
        serviceKey: currentServiceKey,
        serviceId: currentService?.id,
      });
      const nextDraftValue =
        typeof updater === "function" ? updater(baseDraft) : updater;
      const nextDraft = normalizeServiceDraft(nextDraftValue, {
        serviceKey: currentServiceKey,
        serviceId: currentService?.id,
      });

      return {
        ...currentDrafts,
        [currentServiceKey]: nextDraft,
      };
    });
  }, [currentService?.id, currentServiceKey]);

  const currentServiceInfoForm = useMemo(
    () => ({
      title: currentServiceDraft.title,
      experience: currentServiceDraft.experience,
    }),
    [currentServiceDraft.experience, currentServiceDraft.title],
  );

  const currentServicePricingForm = useMemo(
    () => ({
      description: currentServiceDraft.description,
      deliveryTimeline: currentServiceDraft.deliveryTimeline,
      priceRange: currentServiceDraft.priceRange,
    }),
    [
      currentServiceDraft.deliveryTimeline,
      currentServiceDraft.description,
      currentServiceDraft.priceRange,
    ],
  );

  const currentServiceVisualsForm = useMemo(
    () => ({
      keywords: Array.isArray(currentServiceDraft.keywords)
        ? currentServiceDraft.keywords
        : [],
      mediaFiles: Array.isArray(currentServiceDraft.mediaFiles)
        ? currentServiceDraft.mediaFiles
        : [],
    }),
    [currentServiceDraft.keywords, currentServiceDraft.mediaFiles],
  );

  const {
    currentServiceCaseStudies,
    currentActiveCaseStudy,
    currentActiveCaseStudyId,
    currentActiveCaseStudyIndex,
  } = useMemo(() => {
    const caseStudies = Array.isArray(currentServiceDraft.caseStudies)
      ? currentServiceDraft.caseStudies
      : [];
    const activeCaseStudyId = String(
      currentServiceDraft.activeCaseStudyId || "",
    ).trim();
    const activeCaseStudyIndex = caseStudies.findIndex(
      (caseStudy) => String(caseStudy?.id || "").trim() === activeCaseStudyId,
    );
    const resolvedActiveCaseStudyIndex =
      activeCaseStudyIndex >= 0 ? activeCaseStudyIndex : 0;
    const resolvedActiveCaseStudy =
      caseStudies[resolvedActiveCaseStudyIndex] || createEmptyServiceCaseStudy();

    return {
      currentServiceCaseStudies:
        caseStudies.length > 0 ? caseStudies : [resolvedActiveCaseStudy],
      currentActiveCaseStudy: resolvedActiveCaseStudy,
      currentActiveCaseStudyId: String(resolvedActiveCaseStudy?.id || "").trim(),
      currentActiveCaseStudyIndex: resolvedActiveCaseStudyIndex,
    };
  }, [currentServiceDraft.activeCaseStudyId, currentServiceDraft.caseStudies]);

  const currentCaseStudyForm = useMemo(
    () => ({
      id: String(currentActiveCaseStudy?.id || "").trim(),
      title: String(currentActiveCaseStudy?.title ?? ""),
      description: String(currentActiveCaseStudy?.description ?? ""),
      projectLink: String(currentActiveCaseStudy?.projectLink || "").trim(),
      projectFile: currentActiveCaseStudy?.projectFile || null,
      previewImage: currentActiveCaseStudy?.previewImage || null,
      role: String(currentActiveCaseStudy?.role || "").trim(),
      timeline: String(currentActiveCaseStudy?.timeline || "").trim(),
      budget: String(currentActiveCaseStudy?.budget || "").trim(),
      niche: String(currentActiveCaseStudy?.niche || "").trim(),
    }),
    [currentActiveCaseStudy],
  );

  const isServiceInfoIncomplete = useMemo(() => {
    const hasTitle = String(currentServiceInfoForm?.title || "").trim().length > 0;
    const hasExperience =
      String(currentServiceInfoForm?.experience || "").trim().length > 0;
    const subcategories = Array.isArray(currentServiceDraft?.subcategories)
      ? currentServiceDraft.subcategories
      : [];
    const hasCategory = subcategories.length > 0;
    const hasSubcategorySkillSelection = subcategories.some((entry) => {
      const hasSelectedTool =
        Array.isArray(entry?.selectedToolIds) && entry.selectedToolIds.length > 0;
      const hasCustomSkill =
        Array.isArray(entry?.customSkillNames) &&
        entry.customSkillNames.some((value) => String(value || "").trim().length > 0);
      return hasSelectedTool || hasCustomSkill;
    });
    const hasLegacySkills =
      Array.isArray(currentServiceDraft?.skillsAndTechnologies) &&
      currentServiceDraft.skillsAndTechnologies.some(
        (value) => String(value || "").trim().length > 0,
      );
    const hasSkills = hasSubcategorySkillSelection || hasLegacySkills;

    return !(hasTitle && hasExperience && hasCategory && hasSkills);
  }, [
    currentServiceDraft?.skillsAndTechnologies,
    currentServiceDraft?.subcategories,
    currentServiceInfoForm?.experience,
    currentServiceInfoForm?.title,
  ]);

  const isServicePricingIncomplete = useMemo(() => {
    const hasDescription =
      String(currentServicePricingForm?.description || "").trim().length > 0;
    const hasDeliveryTimeline =
      String(currentServicePricingForm?.deliveryTimeline || "").trim().length > 0;
    const hasPrice = Number(currentServicePricingForm?.priceRange || 0) > 0;

    return !(hasDescription && hasDeliveryTimeline && hasPrice);
  }, [
    currentServicePricingForm?.deliveryTimeline,
    currentServicePricingForm?.description,
    currentServicePricingForm?.priceRange,
  ]);

  const isServiceVisualsIncomplete = useMemo(() => {
    const mediaFiles = Array.isArray(currentServiceVisualsForm?.mediaFiles)
      ? currentServiceVisualsForm.mediaFiles
      : [];
    const videoCount = mediaFiles.filter((entry) => isServiceMediaVideo(entry)).length;
    const imageCount = Math.max(0, mediaFiles.length - videoCount);
    const hasValidUpload =
      (videoCount === 1 && imageCount === 0) ||
      (imageCount === 2 && videoCount === 0);

    return !hasValidUpload;
  }, [currentServiceVisualsForm?.mediaFiles]);

  const isCaseStudyIncomplete = useMemo(() => {
    const hasTitle = String(currentCaseStudyForm?.title || "").trim().length > 0;
    const hasDescription =
      String(currentCaseStudyForm?.description || "").trim().length > 0;
    const hasNiche = String(currentCaseStudyForm?.niche || "").trim().length > 0;
    const hasRole = String(currentCaseStudyForm?.role || "").trim().length > 0;
    const hasTimeline =
      String(currentCaseStudyForm?.timeline || "").trim().length > 0;
    const hasBudget = Number(currentCaseStudyForm?.budget || 0) > 0;
    const hasProjectProof =
      String(currentCaseStudyForm?.projectLink || "").trim().length > 0 ||
      Boolean(currentCaseStudyForm?.projectFile);

    return !(
      hasTitle &&
      hasDescription &&
      hasNiche &&
      hasRole &&
      hasTimeline &&
      hasBudget &&
      hasProjectProof
    );
  }, [
    currentCaseStudyForm?.budget,
    currentCaseStudyForm?.description,
    currentCaseStudyForm?.niche,
    currentCaseStudyForm?.projectFile,
    currentCaseStudyForm?.projectLink,
    currentCaseStudyForm?.role,
    currentCaseStudyForm?.timeline,
    currentCaseStudyForm?.title,
  ]);

  const isContinueDisabled = isBaseContinueDisabled;

  const syncBasicProfileValidationErrors = (validationErrors) => {
    setBasicProfileErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };

      BASIC_PROFILE_FIELD_ORDER.forEach((field) => {
        delete nextErrors[field];
      });

      return { ...nextErrors, ...validationErrors };
    });
  };

  const syncBasicProfileFieldError = (field, nextForm) => {
    setBasicProfileErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      const fieldsToValidate = [field];

      if (field === "country" && currentErrors.state) {
        fieldsToValidate.push("state");
      }

      fieldsToValidate.forEach((fieldName) => {
        const fieldError = getBasicProfileFieldError(fieldName, nextForm);

        if (fieldError) {
          nextErrors[fieldName] = fieldError;
        } else {
          delete nextErrors[fieldName];
        }
      });

      return nextErrors;
    });
  };

  const uploadProfilePhoto = async (file) => {
    const uploadData = new FormData();
    uploadData.append("file", file);

    const response = await authFetch("/upload", {
      method: "POST",
      body: uploadData,
    });

    if (!response.ok) {
      const payload = await response
        .json()
        .catch(() => ({ message: "Failed to upload profile image." }));
      throw new Error(
        payload?.error?.message || payload?.message || "Failed to upload profile image.",
      );
    }

    const payload = await response.json().catch(() => ({}));
    const uploadedUrl = String(payload?.data?.url || "").trim();

    if (!uploadedUrl) {
      throw new Error("Image upload completed without a usable URL.");
    }

    return uploadedUrl;
  };

  const uploadResumeFile = async (file) => {
    const uploadData = new FormData();
    uploadData.append("file", file);

    const response = await authFetch("/upload/resume", {
      method: "POST",
      body: uploadData,
    });

    if (!response.ok) {
      const payload = await response
        .json()
        .catch(() => ({ message: "Failed to upload resume." }));
      throw new Error(
        payload?.error?.message || payload?.message || "Failed to upload resume.",
      );
    }

    const payload = await response.json().catch(() => ({}));
    const uploadedUrl = String(payload?.data?.url || payload?.url || "").trim();

    if (!uploadedUrl) {
      throw new Error("Resume upload completed without a usable URL.");
    }

    return uploadedUrl;
  };

  const buildResumeAutofillFieldPayload = () =>
    basicProfileFields
      .filter((field) => field?.visible !== false)
      .map((field) => ({
        id: field.id,
        label: field.label,
        type: field.type,
        required: Boolean(field.required),
        options:
          field.id === "state"
            ? []
            : normalizeResumeAutofillFieldOptions({
                field,
                countryOptions,
                stateOptions,
                languageOptions,
              }),
      }));

  const buildSectionAutofillFieldPayload = (fields = [], nicheOptions = dbNiches) =>
    (Array.isArray(fields) ? fields : [])
      .filter((field) => field?.visible !== false)
      .map((field) => ({
        id: field.id,
        label: field.label,
        type: field.type,
        required: Boolean(field.required),
        options:
          field.id === "niche"
            ? nicheOptions
            : Array.isArray(field.options)
              ? field.options
              : [],
      }));

  const buildResumeAutofillSchemaPayload = (nicheOptions = dbNiches) => ({
    basicProfile: buildResumeAutofillFieldPayload(),
    serviceInfo: buildSectionAutofillFieldPayload(globalServiceInfoFields, nicheOptions),
    servicePricing: buildSectionAutofillFieldPayload(globalServicePricingFields, nicheOptions),
    caseStudy: buildSectionAutofillFieldPayload(globalCaseStudyFields, nicheOptions),
  });

  const applyResumeAutofillSuggestions = (suggestions = []) => {
    const fieldMap = new Map(basicProfileFields.map((field) => [field.id, field]));
    const fieldOrder = new Map(
      basicProfileFields.map((field, index) => [field.id, index]),
    );
    const normalizedSuggestions = (Array.isArray(suggestions) ? suggestions : []).toSorted(
      (left, right) =>
        (fieldOrder.get(String(left?.fieldId || "").trim()) ?? Number.MAX_SAFE_INTEGER) -
        (fieldOrder.get(String(right?.fieldId || "").trim()) ?? Number.MAX_SAFE_INTEGER),
    );
    let nextForm = { ...basicProfileForm };
    let appliedCount = 0;

    normalizedSuggestions.forEach((suggestion) => {
      const fieldId = String(suggestion?.fieldId || "").trim();
      const confidence = Number(suggestion?.confidence);
      const schemaField = fieldMap.get(fieldId);

      if (
        !schemaField ||
        !Number.isFinite(confidence) ||
        confidence < RESUME_AUTOFILL_CONFIDENCE_THRESHOLD ||
        fieldId === "username" ||
        fieldId === "profilePhoto" ||
        fieldId === "resume"
      ) {
        return;
      }

      const currentValue = getBasicProfileFieldValue(nextForm, fieldId);
      if (hasAutofillableFieldValue(currentValue)) {
        return;
      }

      const resolvedOptions = normalizeResumeAutofillFieldOptions({
        field: schemaField,
        countryOptions,
        stateOptions:
          schemaField.id === "state" && nextForm.country
            ? resolveStateOptionsForCountry(nextForm.country)
            : stateOptions,
        languageOptions,
      });

      let nextValue = suggestion?.value;
      if (schemaField.type === "multiselect") {
        const rawValues = Array.isArray(nextValue) ? nextValue : [nextValue];
        nextValue = Array.from(
          new Set(
            rawValues
              .map((value) => findMatchingOptionValue(resolvedOptions, value))
              .filter(Boolean),
          ),
        );
      } else if (schemaField.type === "select") {
        nextValue = findMatchingOptionValue(resolvedOptions, nextValue);
      } else {
        nextValue = String(nextValue || "").trim();
      }

      if (!hasAutofillableFieldValue(nextValue)) {
        return;
      }

      if (SYSTEM_BASIC_PROFILE_FIELD_IDS.has(fieldId)) {
        nextForm =
          fieldId === "country"
            ? { ...nextForm, country: nextValue, state: "" }
            : { ...nextForm, [fieldId]: nextValue };
        appliedCount += 1;
      }
    });

    if (!appliedCount) {
      return 0;
    }

    startTransition(() => {
      setBasicProfileForm(nextForm);
      syncBasicProfileValidationErrors(buildBasicProfileValidationErrors(nextForm));
    });

    return appliedCount;
  };

  const applyServiceAutofillSuggestions = ({
    suggestions = [],
    availableServices = [],
    availableNiches = [],
  }) => {
    const serviceInfoFieldMap = new Map(
      globalServiceInfoFields.map((field) => [field.id, field]),
    );
    const servicePricingFieldMap = new Map(
      globalServicePricingFields.map((field) => [field.id, field]),
    );
    const caseStudyFieldMap = new Map(
      globalCaseStudyFields.map((field) => [field.id, field]),
    );
    const nicheOptions = Array.isArray(availableNiches) ? availableNiches : [];
    const normalizedSuggestions = Array.isArray(suggestions) ? suggestions : [];
    const nextSelectedServices = [...selectedServices];
    const selectedServiceSet = new Set(nextSelectedServices);
    const nextDrafts = { ...serviceDraftsByKey };
    let appliedCount = 0;
    let addedServicesCount = 0;

    normalizedSuggestions.forEach((suggestion) => {
      const serviceConfidence = normalizeConfidenceValue(suggestion?.confidence);
      if (serviceConfidence < RESUME_AUTOFILL_CONFIDENCE_THRESHOLD) {
        return;
      }

      const resolvedServiceKey = resolveServiceKey(
        availableServices,
        suggestion?.serviceKey || suggestion?.serviceName,
      );
      if (!resolvedServiceKey) {
        return;
      }

      const serviceMeta = getServiceCatalogMeta(availableServices, resolvedServiceKey);
      let draft = normalizeServiceDraft(nextDrafts[resolvedServiceKey], {
        serviceKey: resolvedServiceKey,
        serviceId: serviceMeta.serviceId,
      });

      if (!selectedServiceSet.has(resolvedServiceKey)) {
        nextSelectedServices.push(resolvedServiceKey);
        selectedServiceSet.add(resolvedServiceKey);
        addedServicesCount += 1;
      }

      const titleConfidence = normalizeConfidenceValue(suggestion?.serviceInfo?.title?.confidence);
      if (
        !hasAutofillableFieldValue(draft.title) &&
        titleConfidence >= RESUME_AUTOFILL_CONFIDENCE_THRESHOLD
      ) {
        draft.title = String(suggestion?.serviceInfo?.title?.value || "").trim();
        if (draft.title) {
          appliedCount += 1;
        }
      }

      const experienceOptions = serviceInfoFieldMap.get("experience")?.options || [];
      const experienceConfidence = normalizeConfidenceValue(
        suggestion?.serviceInfo?.experience?.confidence,
      );
      if (
        !hasAutofillableFieldValue(draft.experience) &&
        experienceConfidence >= RESUME_AUTOFILL_CONFIDENCE_THRESHOLD
      ) {
        const nextExperience = findMatchingOptionValue(
          experienceOptions,
          suggestion?.serviceInfo?.experience?.value,
        );
        if (nextExperience) {
          draft.experience = nextExperience;
          appliedCount += 1;
        }
      }

      if (
        (!Array.isArray(draft.subcategories) || draft.subcategories.length === 0) &&
        Array.isArray(suggestion?.serviceInfo?.categories) &&
        suggestion.serviceInfo.categories.length > 0
      ) {
        const nextSubcategories = suggestion.serviceInfo.categories
          .map((entry) => {
            const subCategoryId = Number(entry?.subCategoryId);
            const label = String(entry?.subCategoryName || "").trim();
            const customSkillNames = normalizeDraftSkillList(entry?.customSkillNames || []);
            if (!subCategoryId && !label) {
              return null;
            }

            return {
              subCategoryId: Number.isInteger(subCategoryId) && subCategoryId > 0 ? subCategoryId : null,
              subCategoryKey:
                Number.isInteger(subCategoryId) && subCategoryId > 0
                  ? `catalog:${subCategoryId}`
                  : label.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
              label,
              isCustom: !(Number.isInteger(subCategoryId) && subCategoryId > 0),
              selectedToolIds: [],
              customSkillNames,
            };
          })
          .filter(Boolean);

        if (nextSubcategories.length > 0) {
          draft.subcategories = nextSubcategories;
          draft.activeSkillCategory = nextSubcategories[0].subCategoryKey || null;
          draft.skillsAndTechnologies = normalizeDraftSkillList(
            nextSubcategories.flatMap((entry) => entry.customSkillNames || []),
          );
          appliedCount += 1;
        }
      }

      const descriptionConfidence = normalizeConfidenceValue(
        suggestion?.servicePricing?.description?.confidence,
      );
      if (
        !hasAutofillableFieldValue(draft.description) &&
        descriptionConfidence >= RESUME_AUTOFILL_CONFIDENCE_THRESHOLD
      ) {
        draft.description = String(suggestion?.servicePricing?.description?.value || "").trim();
        if (draft.description) {
          appliedCount += 1;
        }
      }

      const deliveryOptions = servicePricingFieldMap.get("deliveryTimeline")?.options || [];
      const deliveryConfidence = normalizeConfidenceValue(
        suggestion?.servicePricing?.deliveryTimeline?.confidence,
      );
      if (
        !hasAutofillableFieldValue(draft.deliveryTimeline) &&
        deliveryConfidence >= RESUME_AUTOFILL_CONFIDENCE_THRESHOLD
      ) {
        const nextDeliveryTimeline = findMatchingOptionValue(
          deliveryOptions,
          suggestion?.servicePricing?.deliveryTimeline?.value,
        );
        if (nextDeliveryTimeline) {
          draft.deliveryTimeline = nextDeliveryTimeline;
          appliedCount += 1;
        }
      }

      const priceConfidence = normalizeConfidenceValue(
        suggestion?.servicePricing?.priceRange?.confidence,
      );
      if (
        !hasAutofillableFieldValue(draft.priceRange) &&
        priceConfidence >= RESUME_AUTOFILL_CONFIDENCE_THRESHOLD
      ) {
        const nextPriceRange = String(
          suggestion?.servicePricing?.priceRange?.value || "",
        ).trim();
        if (nextPriceRange) {
          draft.priceRange = nextPriceRange;
          appliedCount += 1;
        }
      }

      const keywordConfidence = normalizeConfidenceValue(
        suggestion?.visuals?.keywords?.confidence,
      );
      if (
        (!Array.isArray(draft.keywords) || draft.keywords.length === 0) &&
        keywordConfidence >= RESUME_AUTOFILL_CONFIDENCE_THRESHOLD
      ) {
        const nextKeywords = normalizeDraftSkillList(
          suggestion?.visuals?.keywords?.value || [],
        );
        if (nextKeywords.length > 0) {
          draft.keywords = nextKeywords;
          appliedCount += 1;
        }
      }

      const caseStudies = Array.isArray(draft.caseStudies) && draft.caseStudies.length > 0
        ? [...draft.caseStudies]
        : [createEmptyServiceCaseStudy()];
      const activeCaseStudyIndex = caseStudies.findIndex(
        (entry) => String(entry?.id || "").trim() === String(draft.activeCaseStudyId || "").trim(),
      );
      const targetCaseStudyIndex = activeCaseStudyIndex >= 0 ? activeCaseStudyIndex : 0;
      const targetCaseStudy = caseStudies[targetCaseStudyIndex] || createEmptyServiceCaseStudy();

      if (isCaseStudyEffectivelyEmpty(targetCaseStudy)) {
        const nextCaseStudy = { ...targetCaseStudy };
        let didApplyCaseStudyField = false;

        const caseStudyTitleConfidence = normalizeConfidenceValue(
          suggestion?.caseStudy?.title?.confidence,
        );
        if (caseStudyTitleConfidence >= RESUME_AUTOFILL_CONFIDENCE_THRESHOLD) {
          const nextTitle = String(suggestion?.caseStudy?.title?.value || "").trim();
          if (nextTitle) {
            nextCaseStudy.title = nextTitle;
            didApplyCaseStudyField = true;
          }
        }

        const caseStudyDescriptionConfidence = normalizeConfidenceValue(
          suggestion?.caseStudy?.description?.confidence,
        );
        if (caseStudyDescriptionConfidence >= RESUME_AUTOFILL_CONFIDENCE_THRESHOLD) {
          const nextDescription = String(
            suggestion?.caseStudy?.description?.value || "",
          ).trim();
          if (nextDescription) {
            nextCaseStudy.description = nextDescription;
            didApplyCaseStudyField = true;
          }
        }

        const projectLinkConfidence = normalizeConfidenceValue(
          suggestion?.caseStudy?.projectLink?.confidence,
        );
        if (projectLinkConfidence >= RESUME_AUTOFILL_CONFIDENCE_THRESHOLD) {
          const nextProjectLink = String(
            suggestion?.caseStudy?.projectLink?.value || "",
          ).trim();
          if (nextProjectLink) {
            nextCaseStudy.projectLink = nextProjectLink;
            didApplyCaseStudyField = true;
          }
        }

        const roleOptions = caseStudyFieldMap.get("role")?.options || [];
        const roleConfidence = normalizeConfidenceValue(
          suggestion?.caseStudy?.role?.confidence,
        );
        if (roleConfidence >= RESUME_AUTOFILL_CONFIDENCE_THRESHOLD) {
          const nextRole = findMatchingOptionValue(roleOptions, suggestion?.caseStudy?.role?.value);
          if (nextRole) {
            nextCaseStudy.role = nextRole;
            didApplyCaseStudyField = true;
          }
        }

        const timelineOptions = caseStudyFieldMap.get("timeline")?.options || [];
        const timelineConfidence = normalizeConfidenceValue(
          suggestion?.caseStudy?.timeline?.confidence,
        );
        if (timelineConfidence >= RESUME_AUTOFILL_CONFIDENCE_THRESHOLD) {
          const nextTimeline = findMatchingOptionValue(
            timelineOptions,
            suggestion?.caseStudy?.timeline?.value,
          );
          if (nextTimeline) {
            nextCaseStudy.timeline = nextTimeline;
            didApplyCaseStudyField = true;
          }
        }

        const budgetConfidence = normalizeConfidenceValue(
          suggestion?.caseStudy?.budget?.confidence,
        );
        if (budgetConfidence >= RESUME_AUTOFILL_CONFIDENCE_THRESHOLD) {
          const nextBudget = String(suggestion?.caseStudy?.budget?.value || "").trim();
          if (nextBudget) {
            nextCaseStudy.budget = nextBudget;
            didApplyCaseStudyField = true;
          }
        }

        const nicheConfidence = normalizeConfidenceValue(
          suggestion?.caseStudy?.niche?.confidence,
        );
        if (nicheConfidence >= RESUME_AUTOFILL_CONFIDENCE_THRESHOLD) {
          const nextNiche = findMatchingOptionValue(
            nicheOptions,
            suggestion?.caseStudy?.niche?.value,
          );
          if (nextNiche) {
            nextCaseStudy.niche = nextNiche;
            didApplyCaseStudyField = true;
          }
        }

        if (didApplyCaseStudyField) {
          caseStudies[targetCaseStudyIndex] = nextCaseStudy;
          draft.caseStudies = caseStudies;
          draft.caseStudy = caseStudies[0];
          draft.activeCaseStudyId =
            String(draft.activeCaseStudyId || caseStudies[targetCaseStudyIndex]?.id || "").trim() ||
            caseStudies[targetCaseStudyIndex]?.id ||
            draft.activeCaseStudyId;
          appliedCount += 1;
        }
      }

      nextDrafts[resolvedServiceKey] = normalizeServiceDraft(draft, {
        serviceKey: resolvedServiceKey,
        serviceId: serviceMeta.serviceId,
      });
    });

    if (!appliedCount && !addedServicesCount) {
      return { appliedCount: 0, addedServicesCount: 0 };
    }

    startTransition(() => {
      setSelectedServices(nextSelectedServices);
      setServiceDraftsByKey(nextDrafts);
    });

    return { appliedCount, addedServicesCount };
  };

  const autofillBasicProfileFromResume = async (file) => {
    setIsResumeAutofillRunning(true);
    setResumeAutofillState({
      tone: "muted",
      message: "AI is reading your CV and checking high-confidence profile fields.",
    });

    try {
      const [availableServices, availableNiches] = await Promise.all([
        ensureMarketplaceServicesLoaded(),
        ensureMarketplaceNichesLoaded(),
      ]);
      const payload = new FormData();
      payload.append("file", file);
      payload.append(
        "schema",
        JSON.stringify(buildResumeAutofillSchemaPayload(availableNiches)),
      );

      const response = await authFetch("/profile/resume-autofill", {
        method: "POST",
        body: payload,
      });

      if (!response.ok) {
        const errorPayload = await response
          .json()
          .catch(() => ({ message: "Could not analyze the uploaded CV." }));
        throw new Error(
          errorPayload?.error?.message ||
            errorPayload?.message ||
            "Could not analyze the uploaded CV.",
        );
      }

      const data = await response.json().catch(() => ({}));
      const basicProfileSuggestions = Array.isArray(data?.data?.basicProfileFields)
        ? data.data.basicProfileFields
        : [];
      const serviceSuggestions = Array.isArray(data?.data?.suggestedServices)
        ? data.data.suggestedServices
        : [];
      const basicProfileAppliedCount = applyResumeAutofillSuggestions(
        basicProfileSuggestions,
      );
      const serviceAutofillSummary = applyServiceAutofillSuggestions({
        suggestions: serviceSuggestions,
        availableServices,
        availableNiches,
      });
      const totalAppliedCount =
        basicProfileAppliedCount + Number(serviceAutofillSummary?.appliedCount || 0);
      const addedServicesCount = Number(serviceAutofillSummary?.addedServicesCount || 0);

      if (totalAppliedCount > 0 || addedServicesCount > 0) {
        setResumeAutofillState({
          tone: "success",
          message:
            `AI filled ${totalAppliedCount} field${totalAppliedCount === 1 ? "" : "s"} with 90%+ confidence` +
            (addedServicesCount > 0
              ? ` and added ${addedServicesCount} service${addedServicesCount === 1 ? "" : "s"} from your CV.`
              : ".") +
            " Review them before continuing.",
        });
        return;
      }

      setResumeAutofillState({
        tone: "muted",
        message: "AI reviewed the CV but did not find any 90%+ confidence fields to fill automatically.",
      });
    } catch (error) {
      console.error("Resume autofill failed:", error);
      setResumeAutofillState({
        tone: "error",
        message: error?.message || "Could not analyze the uploaded CV.",
      });
    } finally {
      setIsResumeAutofillRunning(false);
    }
  };

  const uploadServiceMediaFile = async (file) => {
    const uploadData = new FormData();
    uploadData.append("file", file);

    const response = await authFetch("/upload/service-media", {
      method: "POST",
      body: uploadData,
    });

    if (!response.ok) {
      const payload = await response
        .json()
        .catch(() => ({ message: "Failed to upload service media." }));
      throw new Error(
        payload?.error?.message || payload?.message || "Failed to upload service media.",
      );
    }

    const payload = await response.json().catch(() => ({}));
    const uploadedUrl = String(payload?.data?.url || "").trim();

    if (!uploadedUrl) {
      throw new Error("Service media upload completed without a usable URL.");
    }

    const mimeType = String(
      payload?.data?.mimeType || file?.type || "",
    )
      .trim()
      .toLowerCase();

    return {
      url: uploadedUrl,
      key: String(payload?.data?.key || "").trim() || null,
      name: String(payload?.data?.name || file?.name || "").trim() || null,
      kind:
        String(payload?.data?.kind || "").trim().toLowerCase() ||
        (mimeType.startsWith("video/") ? "video" : "image"),
      mimeType: mimeType || null,
      size:
        Number.isFinite(Number(payload?.data?.size)) && Number(payload.data.size) > 0
          ? Number(payload.data.size)
          : Number.isFinite(Number(file?.size)) && Number(file.size) > 0
            ? Number(file.size)
            : null,
    };
  };

  const persistServiceMediaEntries = async (entries = []) => {
    if (!Array.isArray(entries) || entries.length === 0) {
      return [];
    }

    const resolvedEntries = await Promise.all(
      entries.slice(0, 3).map(async (entry, index) => {
        const localFile = extractServiceMediaFile(entry);
        if (localFile) {
          return uploadServiceMediaFile(localFile);
        }

        return buildPersistedServiceMedia(entry, index);
      }),
    );

    return resolvedEntries.filter(Boolean);
  };

  const validateBasicProfileBeforeContinue = async () => {
    const validationErrors = buildBasicProfileValidationErrors(basicProfileForm);
    const firstValidationError = getFirstBasicProfileError(validationErrors);

    syncBasicProfileValidationErrors(validationErrors);

    if (firstValidationError) {
      setProfileError(firstValidationError);
      throw new Error(firstValidationError);
    }

    const usernameAvailability = await checkUsernameAvailability(
      basicProfileForm.username,
    );

    if (usernameAvailability === "checking" || usernameAvailability === "stale") {
      throw new Error("Checking username availability. Please try again.");
    }
    if (usernameAvailability === "unavailable") {
      setProfileError(USERNAME_AVAILABILITY_ERROR);
      throw new Error(USERNAME_AVAILABILITY_ERROR);
    }
    if (usernameAvailability === "error") {
      setProfileError(USERNAME_CHECK_ERROR);
      throw new Error(USERNAME_CHECK_ERROR);
    }
  };

  const uploadCaseStudyProjectFile = async (file) => {
    const uploadData = new FormData();
    uploadData.append("file", file);

    const response = await authFetch("/upload/chat", {
      method: "POST",
      body: uploadData,
    });

    if (!response.ok) {
      const payload = await response
        .json()
        .catch(() => ({ message: "Failed to upload project file." }));
      throw new Error(
        payload?.error?.message || payload?.message || "Failed to upload project file.",
      );
    }

    const payload = await response.json().catch(() => ({}));
    const uploadedUrl = String(payload?.data?.url || payload?.url || "").trim();

    if (!uploadedUrl) {
      throw new Error("Project file upload completed without a usable URL.");
    }

    return {
      name: String(payload?.data?.name || file?.name || "Project File").trim(),
      url: uploadedUrl,
      key: String(payload?.data?.key || "").trim() || null,
      type: String(payload?.data?.type || file?.type || "").trim() || null,
      size:
        Number.isFinite(Number(payload?.data?.size)) && Number(payload.data.size) > 0
          ? Number(payload.data.size)
          : Number.isFinite(Number(file?.size)) && Number(file.size) > 0
            ? Number(file.size)
            : null,
    };
  };

  const persistCaseStudyProjectFile = async (value) => {
    const localFile = extractCaseStudyFile(value);
    if (localFile) {
      return uploadCaseStudyProjectFile(localFile);
    }

    return buildRemoteCaseStudyFile(value);
  };

  const persistServiceDraftUploads = async (serviceKey, draft) => {
    const serviceMeta = getServiceCatalogMeta(dbServices, serviceKey);
    const normalizedDraft = normalizeServiceDraft(draft, {
      serviceKey,
      serviceId: serviceMeta.serviceId,
    });
    const [mediaFiles, caseStudies] = await Promise.all([
      persistServiceMediaEntries(normalizedDraft.mediaFiles),
      Promise.all(
        normalizedDraft.caseStudies.map(async (caseStudy) => ({
          ...caseStudy,
          projectFile:
            (await persistCaseStudyProjectFile(caseStudy?.projectFile)) || null,
          previewImage:
            (await persistCaseStudyProjectFile(caseStudy?.previewImage)) || null,
        })),
      ),
    ]);
    const activeCaseStudyId = caseStudies.some(
      (caseStudy) => caseStudy.id === normalizedDraft.activeCaseStudyId,
    )
      ? normalizedDraft.activeCaseStudyId
      : caseStudies[0]?.id || null;

    return normalizeServiceDraft(
      {
        ...normalizedDraft,
        mediaFiles,
        caseStudies,
        activeCaseStudyId,
        caseStudy: caseStudies[0] || null,
      },
      {
        serviceKey,
        serviceId: serviceMeta.serviceId,
      },
    );
  };

  const persistOnboardingProfile = async ({
    markComplete = false,
    deliveryPolicyAcceptedOverride,
    communicationPolicyAcceptedOverride,
  } = {}) => {
    if (!user?.id) {
      throw new Error("You need to be logged in to save your freelancer profile.");
    }

    await validateBasicProfileBeforeContinue();

    const orderedSelectedServices = normalizeDraftSkillList(
      selectedServices.map((serviceKey) => resolveServiceKey(dbServices, serviceKey)),
    );

    if (!orderedSelectedServices.length) {
      throw new Error("Please select at least one service.");
    }

    const localProfilePhotoFile = extractProfilePhotoFile(basicProfileForm.profilePhoto);
    const initialAvatarUrl = extractProfilePhotoUrl(basicProfileForm.profilePhoto);
    const localResumeFile = extractResumeFile(basicProfileForm.resume);
    const initialResumeUrl = extractResumeUrl(basicProfileForm.resume);
    const resolvedFullName = String(basicProfileForm.fullName || "").trim();
    const [resolvedAvatarUrl, resolvedResumeUrl, persistedServices] = await Promise.all([
      localProfilePhotoFile
        ? uploadProfilePhoto(localProfilePhotoFile)
        : Promise.resolve(initialAvatarUrl),
      localResumeFile
        ? uploadResumeFile(localResumeFile)
        : Promise.resolve(initialResumeUrl),
      Promise.all(
        orderedSelectedServices.map(async (serviceKey) => {
          const persistedDraft = await persistServiceDraftUploads(
            serviceKey,
            serviceDraftsByKey[serviceKey],
          );
          const serviceMeta = getServiceCatalogMeta(dbServices, serviceKey);
          const serializedDetail = serializeServiceDraft({
            draft: {
              ...persistedDraft,
              skillsAndTechnologies: deriveDraftSkillsAndTechnologies(persistedDraft, {}),
            },
            serviceId: serviceMeta.serviceId,
            experienceLabelsByKey: SERVICE_EXPERIENCE_STORAGE_LABELS,
            deliveryLabelsByKey: DELIVERY_TIMELINE_STORAGE_LABELS,
          });

          return [serviceKey, { persistedDraft, serializedDetail }];
        }),
      ),
    ]);

    const currentProfileDetails =
      user?.profileDetails && typeof user.profileDetails === "object"
        ? user.profileDetails
        : {};
    const currentIdentity =
      currentProfileDetails.identity &&
      typeof currentProfileDetails.identity === "object"
        ? currentProfileDetails.identity
        : {};
    const resolvedAcceptInProgressProjectsValue =
      parseBooleanChoice(acceptInProgressProjectsValue) ??
      parseBooleanChoice(currentProfileDetails.acceptInProgressProjects);
    const resolvedDeliveryPolicyAccepted =
      parseBooleanChoice(deliveryPolicyAcceptedOverride) ??
      parseBooleanChoice(deliveryPolicyAccepted) ??
      parseBooleanChoice(currentProfileDetails.deliveryPolicyAccepted);
    const resolvedCommunicationPolicyAccepted =
      parseBooleanChoice(communicationPolicyAcceptedOverride) ??
      parseBooleanChoice(communicationPolicyAccepted) ??
      parseBooleanChoice(currentProfileDetails.communicationPolicyAccepted);
    const normalizedAgencyProfile =
      sanitizeAgencyProfileFormForDraft(agencyProfileForm);
    const isAgencyRole =
      String(selectedWorkPreference || "").trim() === "agency";
    const nextServiceDetails = Object.fromEntries(
      persistedServices.map(([serviceKey, value]) => [serviceKey, value.serializedDetail]),
    );
    const profileDetails = {
      ...currentProfileDetails,
      profileDetailsVersion: 3,
      role: selectedWorkPreference || "agency",
      fullName: resolvedFullName,
      professionalBio: basicProfileForm.professionalBio.trim(),
      services: orderedSelectedServices,
      serviceDetails: nextServiceDetails,
      ...(isAgencyRole
        ? {
            companyName: normalizedAgencyProfile.companyName,
            businessName: normalizedAgencyProfile.companyName,
            agencyDetails: normalizedAgencyProfile,
          }
        : {}),
      acceptInProgressProjects:
        typeof resolvedAcceptInProgressProjectsValue === "boolean"
          ? resolvedAcceptInProgressProjectsValue
          : null,
      deliveryPolicyAccepted:
        typeof resolvedDeliveryPolicyAccepted === "boolean"
          ? resolvedDeliveryPolicyAccepted
          : null,
      communicationPolicyAccepted:
        typeof resolvedCommunicationPolicyAccepted === "boolean"
          ? resolvedCommunicationPolicyAccepted
          : null,
      identity: {
        ...currentIdentity,
        fullName: resolvedFullName,
        username: normalizeUsernameInput(basicProfileForm.username),
        country: basicProfileForm.country.trim(),
        city: basicProfileForm.state.trim(),
        languages: Array.isArray(basicProfileForm.languages)
          ? basicProfileForm.languages.filter(Boolean)
          : [],
        profilePhoto:
          resolvedAvatarUrl ||
          extractProfilePhotoUrl(basicProfileForm.profilePhoto) ||
          currentIdentity.profilePhoto ||
          null,
      },
    };

    if (!isAgencyRole) {
      delete profileDetails.companyName;
      delete profileDetails.businessName;
      delete profileDetails.agencyDetails;
    }

    delete profileDetails.serviceSubcategorySkills;
    delete profileDetails.serviceActiveSkillCategory;

    const updatePayload = {
      fullName: resolvedFullName,
      profileDetails,
      bio: basicProfileForm.professionalBio.trim(),
      professionalBio: basicProfileForm.professionalBio.trim(),
      location: buildLocationLabel({
        state: basicProfileForm.state.trim(),
        country: basicProfileForm.country.trim(),
      }),
      resume: resolvedResumeUrl || null,
    };

    if (isAgencyRole) {
      updatePayload.companyName = normalizedAgencyProfile.companyName || null;
      updatePayload.businessName = normalizedAgencyProfile.companyName || null;
    }

    if (resolvedAvatarUrl) {
      updatePayload.avatar = resolvedAvatarUrl;
    }

    if (typeof resolvedAcceptInProgressProjectsValue === "boolean") {
      updatePayload.acceptInProgressProjects =
        resolvedAcceptInProgressProjectsValue;
    }

    if (markComplete) {
      updatePayload.onboardingComplete = true;
    }

    await updateProfile(updatePayload);

    if (resolvedAvatarUrl && localProfilePhotoFile) {
      setBasicProfileForm((currentForm) => ({
        ...currentForm,
        profilePhoto: buildRemoteProfilePhoto(resolvedAvatarUrl, localProfilePhotoFile.name),
      }));
    }

    if (localResumeFile) {
      setBasicProfileForm((currentForm) => ({
        ...currentForm,
        resume: buildRemoteResumeFile(resolvedResumeUrl, localResumeFile.name),
      }));
    }

    setServiceDraftsByKey((currentDrafts) =>
      persistedServices.reduce((accumulator, [serviceKey, value]) => {
        accumulator[serviceKey] = normalizeServiceDraft(
          {
            ...currentDrafts[serviceKey],
            ...value.persistedDraft,
            skillsAndTechnologies: value.serializedDetail.skillsAndTechnologies,
          },
          {
            serviceKey,
            serviceId: value.serializedDetail.serviceId,
          },
        );
        return accumulator;
      }, { ...currentDrafts }),
    );
  };

  const ensureMarketplaceServicesLoaded = useCallback(async () => {
    if (dbServices.length) {
      return dbServices;
    }

    const services = await fetchMarketplaceServices();
    setDbServices(services);
    return services;
  }, [dbServices]);

  const ensureMarketplaceNichesLoaded = useCallback(async () => {
    if (dbNiches.length) {
      return dbNiches;
    }

    const niches = await fetchMarketplaceNiches();
    setDbNiches(niches);
    return niches;
  }, [dbNiches]);

  const submitOnboardingAndNavigate = ({
    deliveryPolicyAcceptedOverride,
    communicationPolicyAcceptedOverride,
  } = {}) => {
    setIsProfileSaving(true);
    setProfileError("");

    persistOnboardingProfile({
      markComplete: true,
      deliveryPolicyAcceptedOverride,
      communicationPolicyAcceptedOverride,
    })
      .then(async () => {
        clearStoredOnboardingDraft(onboardingDraftStorageKey);
        await refreshUser();
        toast.success(
          String(selectedWorkPreference || "").trim() === "agency"
            ? "Agency onboarding saved."
            : "Freelancer onboarding saved.",
        );
        navigate(FREELANCER_DASHBOARD_PATH);
      })
      .catch((error) => {
        const fallbackMessage =
          String(selectedWorkPreference || "").trim() === "agency"
            ? "Failed to save agency onboarding."
            : "Failed to save freelancer onboarding.";
        setProfileError(error?.message || fallbackMessage);
        toast.error(error?.message || fallbackMessage);
      })
      .finally(() => {
        setIsProfileSaving(false);
      });
  };

  const handleSkipServicesSection = () => {
    if (isProfileSaving || !isServiceSectionSlide) {
      return;
    }

    if (acceptInProgressProjectsSlideIndex >= 0) {
      navigateToSlideIndex(acceptInProgressProjectsSlideIndex);
      return;
    }

    if (deliveryPolicySlideIndex >= 0) {
      navigateToSlideIndex(deliveryPolicySlideIndex);
      return;
    }

    if (communicationPolicySlideIndex >= 0) {
      navigateToSlideIndex(communicationPolicySlideIndex);
      return;
    }

    submitOnboardingAndNavigate();
  };

  const handleBack = () => {
    if (typeof document !== "undefined") {
      document.activeElement?.blur();
    }
    if (currentSlide.id === "serviceSetup" && currentServiceIndex > 0) {
      setCurrentServiceIndex((currentIndex) => Math.max(currentIndex - 1, 0));
      navigateToSlideIndex(serviceReviewSlideIndex, currentServiceIndex - 1);
      return;
    }

    if (isFirstSlide) {
      if (shouldUseEmbeddedExit) {
        onExitAgencyFlow();
        return;
      }

      navigate(FREELANCER_DASHBOARD_PATH, { replace: true });
      return;
    }

    navigateToSlideIndex(Math.max(currentSlideIndex - 1, 0), currentServiceIndex);
  };

  const clearServiceStepValidationErrors = useCallback((stepId) => {
    const normalizedStepId = String(stepId || "").trim();
    if (!normalizedStepId) {
      return;
    }

    setServiceValidationErrorsByStep((currentErrors) => {
      if (!currentErrors[normalizedStepId]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[normalizedStepId];
      return nextErrors;
    });
  }, []);

  const clearAgencyStepValidationErrors = useCallback((stepId) => {
    const normalizedStepId = String(stepId || "").trim();
    if (!normalizedStepId) {
      return;
    }

    setAgencyValidationErrorsByStep((currentErrors) => {
      if (!currentErrors[normalizedStepId]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[normalizedStepId];
      return nextErrors;
    });
  }, []);

  const validateAgencyStepBeforeContinue = useCallback(
    (stepId = currentSlide.id) => {
      const validationErrors = getAgencyStepValidationErrors(
        agencyProfileForm,
        stepId,
      );
      const validationMessage = getAgencyStepValidationMessage(
        agencyProfileForm,
        stepId,
      );

      if (validationMessage) {
        const normalizedStepId = String(stepId || "").trim();
        if (normalizedStepId) {
          setAgencyValidationErrorsByStep((currentErrors) => ({
            ...currentErrors,
            [normalizedStepId]: validationErrors,
          }));
        }
        toast.error(validationMessage);
        return false;
      }

      clearAgencyStepValidationErrors(stepId);
      return true;
    },
    [agencyProfileForm, clearAgencyStepValidationErrors, currentSlide.id],
  );

  const validateServiceStepBeforeContinue = useCallback(
    (stepId = currentSlide.id) => {
      const validationErrors = getServiceStepValidationErrors(
        currentServiceDraft,
        stepId,
      );
      const validationMessage = getServiceStepValidationMessage(
        currentServiceDraft,
        stepId,
      );

      if (validationMessage) {
        const normalizedStepId = String(stepId || "").trim();
        if (normalizedStepId) {
          setServiceValidationErrorsByStep((currentErrors) => ({
            ...currentErrors,
            [normalizedStepId]: validationErrors,
          }));
        }
        toast.error(validationMessage);
        return false;
      }

      clearServiceStepValidationErrors(stepId);
      return true;
    },
    [clearServiceStepValidationErrors, currentServiceDraft, currentSlide.id],
  );

  const handleContinue = () => {
    if (isContinueDisabled) {
      return;
    }

    if (isAgencySectionSlide && !validateAgencyStepBeforeContinue()) {
      return;
    }

    if (isServiceSectionSlide && !validateServiceStepBeforeContinue()) {
      return;
    }

    if (currentSlide.id === "serviceReview") {
      if (currentServiceIndex < selectedServices.length - 1) {
        setCurrentServiceIndex((currentIndex) =>
          Math.min(currentIndex + 1, selectedServices.length - 1),
        );
        navigateToSlideIndex(serviceSetupSlideIndex, currentServiceIndex + 1);
        return;
      }

      if (acceptInProgressProjectsSlideIndex >= 0) {
        navigateToSlideIndex(acceptInProgressProjectsSlideIndex);
        return;
      }

      submitOnboardingAndNavigate();
      return;
    }

    if (currentSlide.id === "acceptInProgressProjects") {
      if (deliveryPolicySlideIndex >= 0) {
        navigateToSlideIndex(deliveryPolicySlideIndex);
        return;
      }

      submitOnboardingAndNavigate();
      return;
    }

    if (currentSlide.id === "deliveryPolicy") {
      if (communicationPolicySlideIndex >= 0) {
        navigateToSlideIndex(communicationPolicySlideIndex);
        return;
      }

      submitOnboardingAndNavigate();
      return;
    }

    if (currentSlide.id === "communicationPolicy") {
      submitOnboardingAndNavigate({
        deliveryPolicyAcceptedOverride: true,
        communicationPolicyAcceptedOverride: true,
      });
      return;
    }

    navigateToSlideIndex(
      Math.min(currentSlideIndex + 1, totalSlides - 1),
      currentServiceIndex
    );
  };

  const handleDeliveryPolicyAgree = () => {
    if (isProfileSaving) {
      return;
    }

    setDeliveryPolicyAccepted(true);

    if (communicationPolicySlideIndex >= 0) {
      navigateToSlideIndex(communicationPolicySlideIndex);
      return;
    }

    submitOnboardingAndNavigate({ deliveryPolicyAcceptedOverride: true });
  };

  const handleCommunicationPolicyAgree = () => {
    if (isProfileSaving) {
      return;
    }

    setCommunicationPolicyAccepted(true);
    submitOnboardingAndNavigate({
      deliveryPolicyAcceptedOverride: true,
      communicationPolicyAcceptedOverride: true,
    });
  };

  const handleWorkPreferenceSelect = (nextValue) => {
    setSelectedWorkPreference(nextValue);

    if (isWorkPreferenceSlide) {
      navigateToSlideIndex(
        Math.min(
          currentSlideIndex + 1,
          Math.max(getOnboardingSlideSet(nextValue).length - 1, 0)
        )
      );
    }
  };

  const handleAcceptInProgressProjectsSelect = (nextValue) => {
    if (isProfileSaving) {
      return;
    }

    const normalizedValue = parseBooleanChoice(nextValue);
    if (typeof normalizedValue !== "boolean") {
      return;
    }

    setAcceptInProgressProjectsValue(normalizedValue);

    if (deliveryPolicySlideIndex >= 0) {
      navigateToSlideIndex(deliveryPolicySlideIndex);
      return;
    }

    submitOnboardingAndNavigate();
  };

  const handleServiceStepChange = useCallback(
    (nextStepId) => {
      if (isProfileSaving || !currentServiceKey) {
        return;
      }

      const currentServiceStepOrder =
        currentSlide.id === "serviceInfo"
          ? 0
          : currentSlide.id === "servicePricing"
            ? 1
            : currentSlide.id === "serviceVisuals"
              ? 2
              : currentSlide.id === "caseStudy"
                ? 3
                : currentSlide.id === "serviceReview"
                  ? 4
                  : -1;
      const nextServiceStepOrder =
        nextStepId === "overview"
          ? 0
          : nextStepId === "pricing"
            ? 1
            : nextStepId === "visuals"
              ? 2
              : nextStepId === "caseStudy"
                ? 3
                : nextStepId === "preview"
                  ? 4
                  : -1;
      let maxUnlockedServiceStepOrder = 0;
      if (!isServiceInfoIncomplete) {
        maxUnlockedServiceStepOrder = 1;
      }
      if (!isServicePricingIncomplete) {
        maxUnlockedServiceStepOrder = 2;
      }
      if (!isServiceVisualsIncomplete) {
        maxUnlockedServiceStepOrder = 3;
      }
      if (!isCaseStudyIncomplete) {
        maxUnlockedServiceStepOrder = 4;
      }

      if (
        currentServiceStepOrder < 0 ||
        nextServiceStepOrder < 0 ||
        nextServiceStepOrder > maxUnlockedServiceStepOrder
      ) {
        if (nextServiceStepOrder > maxUnlockedServiceStepOrder) {
          validateServiceStepBeforeContinue();
        }
        return;
      }

      const nextSlideIndex =
        nextStepId === "overview"
          ? serviceInfoSlideIndex
          : nextStepId === "pricing"
            ? servicePricingSlideIndex
            : nextStepId === "visuals"
              ? serviceVisualsSlideIndex
              : nextStepId === "caseStudy"
                ? caseStudySlideIndex
                : nextStepId === "preview"
                  ? serviceReviewSlideIndex
                  : -1;

      if (
        !Number.isInteger(nextSlideIndex) ||
        nextSlideIndex < 0 ||
        nextSlideIndex === currentSlideIndex
      ) {
        return;
      }

      navigateToSlideIndex(nextSlideIndex, currentServiceIndex);
    },
    [
      caseStudySlideIndex,
      currentServiceKey,
      currentSlideIndex,
      isCaseStudyIncomplete,
      isProfileSaving,
      isServiceInfoIncomplete,
      isServicePricingIncomplete,
      isServiceVisualsIncomplete,
      validateServiceStepBeforeContinue,
      serviceInfoSlideIndex,
      servicePricingSlideIndex,
      serviceReviewSlideIndex,
      serviceVisualsSlideIndex,
      currentSlide.id,
    ],
  );

  const handleServiceInfoFieldChange = useCallback(
    (field, value) => {
      clearServiceStepValidationErrors("serviceInfo");
      updateCurrentServiceDraft((draft) => ({
        ...draft,
        [field]: value,
      }));
    },
    [clearServiceStepValidationErrors, updateCurrentServiceDraft],
  );

  const handleServiceInfoDraftUpdate = useCallback(
    (updater) => {
      clearServiceStepValidationErrors("serviceInfo");
      updateCurrentServiceDraft(updater);
    },
    [clearServiceStepValidationErrors, updateCurrentServiceDraft],
  );

  const handleServicePricingFieldChange = useCallback(
    (field, value) => {
      clearServiceStepValidationErrors("servicePricing");
      updateCurrentServiceDraft((draft) => ({
        ...draft,
        [field]: value,
      }));
    },
    [clearServiceStepValidationErrors, updateCurrentServiceDraft],
  );

  const handleServiceVisualsFieldChange = useCallback(
    (field, value) => {
      clearServiceStepValidationErrors("serviceVisuals");
      updateCurrentServiceDraft((draft) => ({
        ...draft,
        [field]: value,
      }));
    },
    [clearServiceStepValidationErrors, updateCurrentServiceDraft],
  );

  const handleCaseStudyFieldChange = useCallback(
    (field, value) => {
      clearServiceStepValidationErrors("caseStudy");
      updateCurrentServiceDraft((draft) => {
        const caseStudies = Array.isArray(draft.caseStudies) ? draft.caseStudies : [];
        const activeCaseStudyId = String(draft.activeCaseStudyId || "").trim();

        return {
          ...draft,
          caseStudies: caseStudies.map((caseStudy) =>
            String(caseStudy?.id || "").trim() === activeCaseStudyId
              ? {
                  ...caseStudy,
                  [field]: value,
                }
              : caseStudy,
          ),
        };
      });
    },
    [clearServiceStepValidationErrors, updateCurrentServiceDraft],
  );

  const handleAddCaseStudy = useCallback(() => {
    clearServiceStepValidationErrors("caseStudy");
    updateCurrentServiceDraft((draft) => {
      const caseStudies = Array.isArray(draft.caseStudies) ? draft.caseStudies : [];

      if (caseStudies.length >= MAX_ONBOARDING_CASE_STUDIES) {
        return draft;
      }

      const nextCaseStudy = createEmptyServiceCaseStudy();

      return {
        ...draft,
        caseStudies: [...caseStudies, nextCaseStudy],
        activeCaseStudyId: nextCaseStudy.id,
      };
    });
  }, [clearServiceStepValidationErrors, updateCurrentServiceDraft]);

  const handleRemoveCaseStudy = useCallback(
    (caseStudyId) => {
      clearServiceStepValidationErrors("caseStudy");
      const normalizedCaseStudyId = String(caseStudyId || "").trim();
      if (!normalizedCaseStudyId) {
        return;
      }

      updateCurrentServiceDraft((draft) => {
        const remainingCaseStudies = draft.caseStudies.filter(
          (caseStudy) => caseStudy.id !== normalizedCaseStudyId,
        );

        if (!remainingCaseStudies.length) {
          const replacementCaseStudy = createEmptyServiceCaseStudy();

          return {
            ...draft,
            caseStudies: [replacementCaseStudy],
            activeCaseStudyId: replacementCaseStudy.id,
          };
        }

        const nextActiveCaseStudyId =
          draft.activeCaseStudyId === normalizedCaseStudyId
            ? remainingCaseStudies[0]?.id || null
            : draft.activeCaseStudyId;

        return {
          ...draft,
          caseStudies: remainingCaseStudies,
          activeCaseStudyId: nextActiveCaseStudyId,
        };
      });
    },
    [clearServiceStepValidationErrors, updateCurrentServiceDraft],
  );

  const handleActiveCaseStudyChange = useCallback(
    (caseStudyId) => {
      clearServiceStepValidationErrors("caseStudy");
      const normalizedCaseStudyId = String(caseStudyId || "").trim();
      if (!normalizedCaseStudyId) {
        return;
      }

      updateCurrentServiceDraft((draft) => ({
        ...draft,
        activeCaseStudyId: normalizedCaseStudyId,
      }));
    },
    [clearServiceStepValidationErrors, updateCurrentServiceDraft],
  );

  const handleBasicProfileFieldChange = (field, value) => {
    const normalizedValue =
      field === "username"
        ? normalizeUsernameInput(value)
        : value;
    const nextForm = {
      ...basicProfileForm,
      ...(field === "country"
        ? { country: normalizedValue, state: "" }
        : { [field]: normalizedValue }),
    };

    setProfileError("");
    setBasicProfileForm(nextForm);
    syncBasicProfileFieldError(field, nextForm);

    if (field === "username") {
      usernameCheckRequestRef.current += 1;
      setUsernameStatus("idle");
    }
  };

  const handleUsernameBlur = () => {
    void checkUsernameAvailability(basicProfileForm.username);
  };

  const handleServiceToggle = (serviceId) => {
    const normalizedServiceKey = resolveServiceKey(dbServices, serviceId);
    if (!normalizedServiceKey) {
      return;
    }

    setProfileError("");
    setSelectedServices((current) =>
      current.includes(normalizedServiceKey)
        ? current.filter((serviceKey) => serviceKey !== normalizedServiceKey)
        : [...current, normalizedServiceKey]
    );
  };

  const handleProfilePhotoSelect = (file) => {
    if (!(typeof File !== "undefined" && file instanceof File)) {
      return;
    }

    if (!String(file.type || "").startsWith("image/")) {
      const message = "Please select a valid image file.";
      setProfileError(message);
      setBasicProfileErrors((currentErrors) => ({
        ...currentErrors,
        profilePhoto: message,
      }));
      toast.error(message);
      return;
    }

    if (file.size > AVATAR_UPLOAD_MAX_BYTES) {
      const message = "Agency logo must be 4.5MB or smaller.";
      setProfileError(message);
      setBasicProfileErrors((currentErrors) => ({
        ...currentErrors,
        profilePhoto: message,
      }));
      toast.error(message);
      return;
    }

    setBasicProfileErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors.profilePhoto;
      return nextErrors;
    });
    setPendingProfilePhotoFile(file);
    setIsProfileCropOpen(true);
  };

  const handleProfilePhotoCropped = async (croppedFile) => {
    const nextPreviewUrl = URL.createObjectURL(croppedFile);
    const previousPreviewUrl = extractProfilePhotoUrl(basicProfileForm.profilePhoto);

    revokeObjectUrlIfNeeded(previousPreviewUrl);
    setBasicProfileForm((currentForm) => ({
      ...currentForm,
      profilePhoto: {
        name: croppedFile.name,
        url: nextPreviewUrl,
        file: croppedFile,
      },
    }));
    setProfileError("");
    setBasicProfileErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors.profilePhoto;
      return nextErrors;
    });
    setPendingProfilePhotoFile(null);
    setIsProfileCropOpen(false);
    return true;
  };

  const handleProfilePhotoRemove = () => {
    const previousPreviewUrl = extractProfilePhotoUrl(basicProfileForm.profilePhoto);
    revokeObjectUrlIfNeeded(previousPreviewUrl);

    setBasicProfileForm((currentForm) => ({
      ...currentForm,
      profilePhoto: null,
    }));
    setProfileError("");
    setBasicProfileErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors.profilePhoto;
      return nextErrors;
    });
  };

  const handleResumeSelect = (file) => {
    if (!(typeof File !== "undefined" && file instanceof File)) {
      return;
    }

    const normalizedName = String(file.name || "").trim().toLowerCase();
    const hasAllowedExtension = RESUME_UPLOAD_ALLOWED_EXTENSIONS.some((extension) =>
      normalizedName.endsWith(extension),
    );

    if (!RESUME_UPLOAD_ALLOWED_MIME_TYPES.has(file.type) && !hasAllowedExtension) {
      const message = "Please select a PDF, DOC, or DOCX file.";
      setProfileError(message);
      setBasicProfileErrors((currentErrors) => ({
        ...currentErrors,
        resume: message,
      }));
      toast.error(message);
      return;
    }

    if (file.size > RESUME_UPLOAD_MAX_BYTES) {
      const message = "Resume must be 4.5MB or smaller.";
      setProfileError(message);
      setBasicProfileErrors((currentErrors) => ({
        ...currentErrors,
        resume: message,
      }));
      toast.error(message);
      return;
    }

    setBasicProfileForm((currentForm) => ({
      ...currentForm,
      resume: {
        name: file.name,
        file,
      },
    }));
    setResumeAutofillState(createInitialResumeAutofillState());
    setProfileError("");
    setBasicProfileErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors.resume;
      return nextErrors;
    });
    void autofillBasicProfileFromResume(file);
  };

  const handleResumeRemove = () => {
    setBasicProfileForm((currentForm) => ({
      ...currentForm,
      resume: null,
    }));
    setIsResumeAutofillRunning(false);
    setResumeAutofillState(createInitialResumeAutofillState());
    setProfileError("");
    setBasicProfileErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors.resume;
      return nextErrors;
    });
  };

  const closeProfileCropDialog = () => {
    setPendingProfilePhotoFile(null);
    setIsProfileCropOpen(false);
  };

  const handleBasicProfileNext = async () => {
    setProfileError("");
    if (currentSlide.id !== "basicProfile") {
      navigateToSlideIndex(Math.min(currentSlideIndex + 1, totalSlides - 1));
      return;
    }

    setIsProfileSaving(true);
    try {
      await validateBasicProfileBeforeContinue();
      await ensureMarketplaceServicesLoaded();
      navigateToSlideIndex(Math.min(currentSlideIndex + 1, totalSlides - 1));
    } catch (error) {
      setProfileError(error?.message || "Please complete your basic profile.");
      toast.error(error?.message || "Please complete your basic profile.");
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleAgencyFieldChange = useCallback(
    (field, value) => {
      clearAgencyStepValidationErrors(currentSlide.id);
      setAgencyProfileForm((currentForm) => ({
        ...currentForm,
        [field]: value,
      }));
    },
    [clearAgencyStepValidationErrors, currentSlide.id],
  );

  const resetOnboardingLocally = useCallback(() => {
    const currentPhotoUrl = extractProfilePhotoUrl(basicProfileForm.profilePhoto);

    revokeObjectUrlIfNeeded(currentPhotoUrl);
    usernameCheckRequestRef.current += 1;

    navigateToSlideIndex(0);
    setSelectedWorkPreference("agency");
    setBasicProfileForm(createInitialBasicProfileForm());
    setAgencyProfileForm(createInitialAgencyProfileForm());
    setSelectedServices([]);
    setServiceDraftsByKey({});
    setCurrentServiceIndex(0);
    setAcceptInProgressProjectsValue(null);
    setDeliveryPolicyAccepted(false);
    setCommunicationPolicyReady(false);
    setCommunicationPolicyAccepted(false);
    setProfileError("");
    setBasicProfileErrors({});
    setStateOptions([]);
    setIsStateOptionsLoading(false);
    setPendingProfilePhotoFile(null);
    setIsProfileCropOpen(false);
    setUsernameStatus("idle");
    setIsResumeAutofillRunning(false);
    setResumeAutofillState(createInitialResumeAutofillState());
    setAgencyValidationErrorsByStep({});
    setServiceValidationErrorsByStep({});
  }, [basicProfileForm.profilePhoto]);

  const handleResetOnboarding = useCallback(async () => {
    if (isResettingOnboarding) {
      return;
    }

    if (shouldUseEmbeddedReset) {
      setIsSettingsOpen(false);
      onResetOnboarding();
      return;
    }

    setIsResettingOnboarding(true);
    setIsSettingsOpen(false);
    resetOnboardingLocally();

    try {
      if (user?.id) {
        await updateProfile({ onboardingComplete: false });
        await refreshUser();
      }

      toast.success("Onboarding has been reset.");
    } catch (error) {
      console.error("Failed to sync onboarding reset:", error);
      toast.error("Onboarding reset locally, but account sync failed.");
    } finally {
      setIsResettingOnboarding(false);
      if (shouldUseEmbeddedExit) {
        onExitAgencyFlow();
      }
    }
  }, [
    isResettingOnboarding,
    onExitAgencyFlow,
    refreshUser,
    resetOnboardingLocally,
    shouldUseEmbeddedExit,
    shouldUseEmbeddedReset,
    onResetOnboarding,
    user?.id,
  ]);

  const footerPrimaryAction = isProfileActionFooter
    ? handleBasicProfileNext
    : isDeliveryPolicySlide
      ? handleDeliveryPolicyAgree
      : isCommunicationPolicySlide
        ? handleCommunicationPolicyAgree
      : handleContinue;
  const footerPrimaryLabel = isProfileActionFooter
    ? "Continue"
    : currentSlide.id === "serviceReview" &&
        currentServiceIndex < selectedServices.length - 1
      ? "Next Service"
      : currentSlide.continueLabel || "Continue";
  const footerPrimaryDisabled = isProfileActionFooter
    ? isProfileSaving
    : isDeliveryPolicySlide
      ? isProfileSaving
      : isContinueDisabled || isProfileSaving;
  const serviceInfoValidationErrors =
    serviceValidationErrorsByStep.serviceInfo || {};
  const servicePricingValidationErrors =
    serviceValidationErrorsByStep.servicePricing || {};
  const serviceVisualsValidationErrors =
    serviceValidationErrorsByStep.serviceVisuals || {};
  const caseStudyValidationErrors = serviceValidationErrorsByStep.caseStudy || {};
  const agencyValidationErrors =
    agencyValidationErrorsByStep[currentSlide.id] || {};

  return (
    <DarkGradientBg className="text-[#f1f5f9]">
      <main className="fixed inset-0 flex flex-col overflow-hidden bg-transparent z-10">
      <header className="relative z-20 shrink-0 border-b border-white/8 bg-card">
        <div
          className="absolute left-0 top-0 h-1 bg-[var(--primary)] transition-all duration-300"
          style={{ width: `${progressValue}%` }}
        />
        <div className="relative flex items-center justify-between px-4 py-4 sm:px-6">
          {isFirstSlide ? (
            shouldUseEmbeddedExit ? (
              <Button
                type="button"
                variant="secondary"
                size="icon-lg"
                className="rounded-full border border-white/10 bg-card text-foreground shadow-none hover:bg-accent/10"
                onClick={onExitAgencyFlow}
                aria-label="Go back"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                asChild
                variant="secondary"
                className="h-10 rounded-full border border-white/10 bg-card px-4 text-base font-normal text-foreground shadow-none hover:bg-accent/10"
              >
                <Link to={FREELANCER_DASHBOARD_PATH} replace>
                  <ChevronLeft className="h-4 w-4" />
                  Back to dashboard
                </Link>
              </Button>
            )
          ) : (
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={handleBack}
                className="h-10 w-10 rounded-full border border-white/10 bg-card text-foreground shadow-none hover:bg-accent/10"
                aria-label="Back to dashboard"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
          )}
        </div>
      </header>

      <div
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const target = e.target;
            if (!target) return;
            const tagName = target.tagName.toUpperCase();
            if (tagName === "TEXTAREA" || target.disabled) {
              return;
            }

            // Check if there is any open dropdown, menu, dialog, or popover overlay
            const hasOpenOverlay = (() => {
              if (
                document.querySelector("[role='listbox']") ||
                document.querySelector("[role='menu']") ||
                document.querySelector("[data-radix-popper-content-wrapper]") ||
                document.querySelector("[data-onboarding-popup='true']")
              ) {
                return true;
              }
              const dialogs = document.querySelectorAll("[role='dialog']");
              for (const el of dialogs) {
                const state = el.getAttribute("data-state");
                if (state === "open") return true;
                if (state === "closed") continue;
                if (el.getAttribute("aria-hidden") === "true") continue;
                const style = window.getComputedStyle(el);
                if (style.display !== "none" && style.visibility !== "hidden") {
                  return true;
                }
              }
              return false;
            })();
            if (hasOpenOverlay) {
              return;
            }

            if (tagName === "BUTTON") {
              const btnText = String(target.textContent || "").trim().toLowerCase();
              const ariaLabel = String(target.getAttribute("aria-label") || "").toLowerCase();
              
              // Prevent navigation if the focused button has an explicit navigation/removal action
              const isBackBtn = btnText.includes("back") || ariaLabel.includes("back") || target.querySelector(".lucide-chevron-left");
              const isSkipBtn = btnText.includes("skip") || ariaLabel.includes("skip");
              const isResetBtn = btnText.includes("reset") || ariaLabel.includes("reset");
              const isRemoveBtn = btnText.includes("remove") || ariaLabel.includes("remove") || target.querySelector(".lucide-x") || target.title?.toLowerCase().includes("remove") || target.ariaLabel?.toLowerCase().includes("remove");
              
              if (isBackBtn || isSkipBtn || isResetBtn || isRemoveBtn) {
                return;
              }
              
              // Let browser's native click behavior on primary continue buttons run without double triggering
              const isPrimaryBtn = target.getAttribute("type") === "submit" || btnText.includes("continue") || btnText.includes("next");
              if (isPrimaryBtn) {
                return;
              }
            }

            if (tagName === "INPUT") {
              const type = (target.type || "").toLowerCase();
              if (["checkbox", "radio", "file", "submit", "button"].includes(type)) {
                return;
              }
            }

            e.preventDefault();
            if (footerPrimaryAction && !footerPrimaryDisabled) {
              footerPrimaryAction();
            }
          }
        }}
        className="contents"
      >
        <section
          ref={onboardingScrollContainerRef}
          className="subtle-scrollbar relative min-h-0 flex-1 overflow-y-auto"
        >
          <div className="min-h-full px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12 pb-24">
            <Suspense fallback={<Loader className="flex-1 my-12" />}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="w-full"
                >
                  <ActiveSlide
                  slide={currentSlide}
                  selectedWorkPreference={selectedWorkPreference}
                  onSelectWorkPreference={handleWorkPreferenceSelect}
                  basicProfileForm={basicProfileForm}
                  onBasicProfileFieldChange={handleBasicProfileFieldChange}
                  onUsernameBlur={handleUsernameBlur}
                  basicProfileErrors={basicProfileErrors}
                  usernameStatus={usernameStatus}
                  countryOptions={countryOptions}
                  stateOptions={stateOptions}
                  languageOptions={languageOptions}
                  isStateOptionsLoading={isStateOptionsLoading}
                  profilePhotoPreviewUrl={extractProfilePhotoUrl(
                    basicProfileForm.profilePhoto,
                  )}
                  onProfilePhotoSelect={handleProfilePhotoSelect}
                  onProfilePhotoRemove={handleProfilePhotoRemove}
                  resumeFile={basicProfileForm.resume}
                  onResumeSelect={handleResumeSelect}
                  onResumeRemove={handleResumeRemove}
                  isResumeAutofillRunning={isResumeAutofillRunning}
                  resumeAutofillTone={resumeAutofillState.tone}
                  resumeAutofillMessage={resumeAutofillState.message}
                  resumeUploadRequestId={resumeUploadRequestId}
                  agencyProfileForm={agencyProfileForm}
                  onAgencyFieldChange={handleAgencyFieldChange}
                  agencyValidationErrors={agencyValidationErrors}
                  selectedServices={selectedServices}
                  onToggleService={handleServiceToggle}
                  dbServices={dbServices}
                  currentServiceKey={currentServiceKey}
                  currentService={currentService}
                  currentServiceName={currentServiceName}
                  currentServiceIndex={currentServiceIndex}
                  totalSelectedServices={selectedServices.length}
                  serviceDraft={currentServiceDraft}
                  onServiceStepChange={handleServiceStepChange}
                  onUpdateServiceDraft={handleServiceInfoDraftUpdate}
                  serviceInfoForm={currentServiceInfoForm}
                  onServiceInfoFieldChange={handleServiceInfoFieldChange}
                  serviceInfoValidationErrors={serviceInfoValidationErrors}
                  servicePricingForm={currentServicePricingForm}
                  onServicePricingFieldChange={handleServicePricingFieldChange}
                  servicePricingValidationErrors={servicePricingValidationErrors}
                  serviceVisualsForm={currentServiceVisualsForm}
                  suggestedKeywords={suggestedKeywords}
                  isSuggestedKeywordsLoading={isSuggestedKeywordsLoading}
                  onServiceVisualsFieldChange={handleServiceVisualsFieldChange}
                  serviceVisualsValidationErrors={serviceVisualsValidationErrors}
                  caseStudyForm={currentCaseStudyForm}
                  caseStudies={currentServiceCaseStudies}
                  activeCaseStudyId={currentActiveCaseStudyId}
                  activeCaseStudyIndex={currentActiveCaseStudyIndex}
                  nicheOptions={dbNiches}
                  onCaseStudyFieldChange={handleCaseStudyFieldChange}
                  onAddCaseStudy={handleAddCaseStudy}
                  onRemoveCaseStudy={handleRemoveCaseStudy}
                  onActiveCaseStudyChange={handleActiveCaseStudyChange}
                  onUploadMediaFile={uploadServiceMediaFile}
                  caseStudyValidationErrors={caseStudyValidationErrors}
                  acceptInProgressProjectsValue={acceptInProgressProjectsValue}
                  onAcceptInProgressProjectsChange={handleAcceptInProgressProjectsSelect}
                  onCommunicationPolicyReadinessChange={(isReady) =>
                    setCommunicationPolicyReady(Boolean(isReady))
                  }
                  isProfileSaving={isProfileSaving}
                  user={user}
                  onSkipServices={handleSkipServicesSection}
                />
                </motion.div>
              </AnimatePresence>
            </Suspense>

          </div>
        </section>
      </div>

      {isFooterHidden ? null : (
        <footer className="relative z-20 shrink-0 border-t border-white/8 bg-card px-4 py-4 sm:px-6 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
          <div className="mx-auto max-w-6xl grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div />

            <Button
              type="button"
              size="lg"
              onClick={footerPrimaryAction}
              disabled={footerPrimaryDisabled}
              className={ONBOARDING_FOOTER_PRIMARY_BUTTON_CLASS}
            >
              {footerPrimaryLabel}
            </Button>

            {isProfileActionFooter ? (
              <div />
            ) : (
              <div className="flex justify-end">
                {isServiceSectionSlide && currentSlide.id !== "serviceSetup" && currentSlide.id !== "serviceInfo" ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={handleSkipServicesSection}
                    disabled={isProfileSaving}
                    className={ONBOARDING_FOOTER_SECONDARY_BUTTON_CLASS}
                  >
                    Skip
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        </footer>
      )}
      <ProfileImageCropDialog
        open={isProfileCropOpen}
        file={pendingProfilePhotoFile}
        maxUploadBytes={AVATAR_UPLOAD_MAX_BYTES}
        onApply={handleProfilePhotoCropped}
        onCancel={closeProfileCropDialog}
      />
      </main>
    </DarkGradientBg>
  );
};

export default AgencyOnboardingShell;
