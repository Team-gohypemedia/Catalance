import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import Settings from "lucide-react/dist/esm/icons/settings";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import ProfileImageCropDialog from "@/components/common/ProfileImageCropDialog";
import {
  API_BASE_URL,
  fetchStatesByCountry,
  listFreelancers,
  updateProfile,
} from "@/shared/lib/api-client";
import { useAuth } from "@/shared/context/AuthContext";
import {
  COUNTRY_OPTIONS,
  LANGUAGE_OPTIONS,
} from "@/components/features/freelancer/onboarding/constants";
import { normalizeUsernameInput } from "@/components/features/freelancer/onboarding/utils";
import {
  createEmptyServiceDraft,
  deriveDraftSkillsAndTechnologies,
  getServiceCatalogMeta,
  normalizeServiceDraft,
  normalizeStringArray as normalizeDraftSkillList,
  resolveServiceCatalogEntry,
  resolveServiceKey,
  serializeServiceDraft,
} from "./service-details";

import { FREELANCER_ONBOARDING_SLIDES } from "./constants";
import FreelancerWelcomeSlide from "./slides/FreelancerWelcomeSlide";
import FreelancerWorkPreferenceSlide from "./slides/FreelancerWorkPreferenceSlide";
import FreelancerIndividualProofSlide from "./slides/FreelancerIndividualProofSlide";
import FreelancerBasicProfileSlide from "./slides/FreelancerBasicProfileSlide";
import FreelancerServicesSlide from "./slides/FreelancerServicesSlide";
import FreelancerServiceSetupSlide from "./slides/FreelancerServiceSetupSlide";
import FreelancerServiceInfoSlide from "./slides/FreelancerServiceInfoSlide";
import FreelancerServicePricingSlide from "./slides/FreelancerServicePricingSlide";
import FreelancerServiceVisualsSlide from "./slides/FreelancerServiceVisualsSlide";
import FreelancerCaseStudySlide from "./slides/FreelancerCaseStudySlide";
import FreelancerServiceReviewSlide from "./slides/FreelancerServiceReviewSlide";
import FreelancerAcceptInProgressProjectsSlide from "./slides/FreelancerAcceptInProgressProjectsSlide";
import FreelancerDeliveryPolicySlide from "./slides/FreelancerDeliveryPolicySlide";
import FreelancerCommunicationPolicySlide from "./slides/FreelancerCommunicationPolicySlide";

const slideRegistry = {
  welcome: FreelancerWelcomeSlide,
  workPreference: FreelancerWorkPreferenceSlide,
  individualProof: FreelancerIndividualProofSlide,
  basicProfile: FreelancerBasicProfileSlide,
  services: FreelancerServicesSlide,
  serviceSetup: FreelancerServiceSetupSlide,
  serviceInfo: FreelancerServiceInfoSlide,
  servicePricing: FreelancerServicePricingSlide,
  serviceVisuals: FreelancerServiceVisualsSlide,
  caseStudy: FreelancerCaseStudySlide,
  serviceReview: FreelancerServiceReviewSlide,
  acceptInProgressProjects: FreelancerAcceptInProgressProjectsSlide,
  deliveryPolicy: FreelancerDeliveryPolicySlide,
  communicationPolicy: FreelancerCommunicationPolicySlide,
};

const AVATAR_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
const RESUME_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
const MIN_USERNAME_LENGTH = 3;
const RESUME_UPLOAD_ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const RESUME_UPLOAD_ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];
const BASIC_PROFILE_FIELD_ORDER = [
  "username",
  "professionalBio",
  "country",
  "state",
  "languages",
];

const createInitialBasicProfileForm = () => ({
  username: "",
  professionalBio: "",
  country: "India",
  state: "",
  languages: [],
  profilePhoto: null,
  resume: null,
});

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

const ONBOARDING_DRAFT_STORAGE_VERSION = 1;
const ONBOARDING_DRAFT_STORAGE_PREFIX = "catalance.freelancer-onboarding";

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
    username: normalizeUsernameInput(sourceForm.username || ""),
    professionalBio: String(sourceForm.professionalBio || "").trim(),
    country: String(sourceForm.country || initialForm.country || "India").trim(),
    state: String(sourceForm.state || "").trim(),
    languages: normalizeStringArray(sourceForm.languages),
    profilePhoto: toPersistableProfilePhoto(sourceForm.profilePhoto),
    resume: toPersistableResumeFile(sourceForm.resume),
  };
};

const sanitizeServiceDraftForStorage = (
  draft,
  { serviceKey = "", serviceId = null } = {},
) => {
  const normalizedDraft = normalizeServiceDraft(draft, {
    serviceKey,
    serviceId,
  });
  const normalizedCaseStudy =
    normalizedDraft.caseStudy && typeof normalizedDraft.caseStudy === "object"
      ? normalizedDraft.caseStudy
      : {};

  return {
    ...normalizedDraft,
    coverImage: isBlobUrl(normalizedDraft.coverImage)
      ? ""
      : normalizedDraft.coverImage,
    mediaFiles: normalizedDraft.mediaFiles
      .map((value, index) => toPersistableServiceMedia(value, index))
      .filter(Boolean),
    caseStudy: {
      ...normalizedCaseStudy,
      projectFile: toPersistableCaseStudyFile(normalizedCaseStudy.projectFile),
    },
  };
};

const buildOnboardingDraftSnapshot = ({
  currentSlideIndex,
  totalSlides,
  selectedWorkPreference,
  basicProfileForm,
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
      String(selectedWorkPreference || "").trim() || "individual",
    basicProfileForm: sanitizeBasicProfileFormForDraft(basicProfileForm),
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

const PROJECT_COMPLEXITY_STORAGE_LABELS = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  expert: "Expert",
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

const STARTING_PRICE_STORAGE_LABELS = {
  under_5k: "Under ₹5,000",
  "5k_10k": "₹5,000 – ₹10,000",
  "5k_15k": "₹5,000 – ₹15,000",
  "15k_20k": "₹15,000 – ₹20,000",
  "15k_30k": "₹15,000 – ₹30,000",
  "30k_40k": "₹30,000 – ₹40,000",
  "30k_50k": "₹30,000 – ₹50,000",
  "50k_75k": "₹50,000 – ₹75,000",
  "50k_1l": "₹50,000 – ₹1,00,000",
  "1l_2l": "₹1,00,000 – ₹2,00,000",
  "1l_3l": "₹1,00,000 – ₹3,00,000",
  "3l_plus": "₹3,00,000+",
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

const getBasicProfileFieldError = (field, form) => {
  switch (field) {
    case "username": {
      const username = normalizeUsernameInput(form.username);

      if (!username) {
        return "Please enter a username.";
      }
      if (username.length < MIN_USERNAME_LENGTH) {
        return `Username must be at least ${MIN_USERNAME_LENGTH} characters long.`;
      }
      if (!/[a-z]/.test(username) || !/\d/.test(username)) {
        return "Username must include at least one letter and one number.";
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

const FreelancerOnboardingShell = () => {
  const navigate = useNavigate();
  const { authFetch, refreshUser, user } = useAuth();
  const usernameCheckRequestRef = useRef(0);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedWorkPreference, setSelectedWorkPreference] = useState("");
  const [basicProfileForm, setBasicProfileForm] = useState(
    createInitialBasicProfileForm(),
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
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [, setProfileError] = useState("");
  const [basicProfileErrors, setBasicProfileErrors] = useState({});
  const [stateOptions, setStateOptions] = useState([]);
  const [isStateOptionsLoading, setIsStateOptionsLoading] = useState(false);
  const [pendingProfilePhotoFile, setPendingProfilePhotoFile] = useState(null);
  const [isProfileCropOpen, setIsProfileCropOpen] = useState(false);
  const [hasHydratedFromUser, setHasHydratedFromUser] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState("idle");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isResettingOnboarding, setIsResettingOnboarding] = useState(false);
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

  const totalSlides = FREELANCER_ONBOARDING_SLIDES.length;
  const currentSlide =
    FREELANCER_ONBOARDING_SLIDES[currentSlideIndex] ||
    FREELANCER_ONBOARDING_SLIDES[0];
  const ActiveSlide = slideRegistry[currentSlide.id];
  const progressValue =
    currentSlide.progressValue ??
    ((currentSlideIndex + 1) / Math.max(totalSlides, 1)) * 100;
  const isFirstSlide = currentSlideIndex === 0;
  const isWorkPreferenceSlide = currentSlide.id === "workPreference";
  const isServicesSlide = currentSlide.id === "services";
  const isServiceInfoSlide = currentSlide.id === "serviceInfo";
  const isServicePricingSlide = currentSlide.id === "servicePricing";
  const isServiceVisualsSlide = currentSlide.id === "serviceVisuals";
  const isCaseStudySlide = currentSlide.id === "caseStudy";
  const isServiceReviewSlide = currentSlide.id === "serviceReview";
  const isAcceptInProgressProjectsSlide =
    currentSlide.id === "acceptInProgressProjects";
  const isDeliveryPolicySlide = currentSlide.id === "deliveryPolicy";
  const isCommunicationPolicySlide = currentSlide.id === "communicationPolicy";
  const isProfileActionFooter = currentSlide.footerMode === "profileActions";
  const isFooterHidden = currentSlide.footerMode === "hidden";
  const isContinueDisabled = isWorkPreferenceSlide
    ? selectedWorkPreference !== "individual"
    : isServicesSlide
      ? selectedServices.length === 0
      : isAcceptInProgressProjectsSlide
        ? typeof acceptInProgressProjectsValue !== "boolean"
      : isDeliveryPolicySlide
        ? !deliveryPolicyAccepted
      : isCommunicationPolicySlide
        ? !communicationPolicyReady
      : false;
  const serviceSetupSlideIndex = FREELANCER_ONBOARDING_SLIDES.findIndex(
    (slide) => slide.id === "serviceSetup",
  );
  const serviceInfoSlideIndex = FREELANCER_ONBOARDING_SLIDES.findIndex(
    (slide) => slide.id === "serviceInfo",
  );
  const serviceReviewSlideIndex = FREELANCER_ONBOARDING_SLIDES.findIndex(
    (slide) => slide.id === "serviceReview",
  );
  const servicePricingSlideIndex = FREELANCER_ONBOARDING_SLIDES.findIndex(
    (slide) => slide.id === "servicePricing",
  );
  const serviceVisualsSlideIndex = FREELANCER_ONBOARDING_SLIDES.findIndex(
    (slide) => slide.id === "serviceVisuals",
  );
  const caseStudySlideIndex = FREELANCER_ONBOARDING_SLIDES.findIndex(
    (slide) => slide.id === "caseStudy",
  );
  const acceptInProgressProjectsSlideIndex =
    FREELANCER_ONBOARDING_SLIDES.findIndex(
      (slide) => slide.id === "acceptInProgressProjects",
    );
  const deliveryPolicySlideIndex = FREELANCER_ONBOARDING_SLIDES.findIndex(
    (slide) => slide.id === "deliveryPolicy",
  );
  const communicationPolicySlideIndex = FREELANCER_ONBOARDING_SLIDES.findIndex(
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
    if (!user || hasHydratedFromUser) {
      return;
    }

    const storedDraft = readStoredOnboardingDraft(onboardingDraftStorageKey);
    if (storedDraft) {
      const nextServices = normalizeDraftSkillList(
        (Array.isArray(storedDraft.selectedServices)
          ? storedDraft.selectedServices
          : []
        ).map((serviceKey) => resolveServiceKey(dbServices, serviceKey)),
      );

      setCurrentSlideIndex(
        clampSlideIndex(storedDraft.currentSlideIndex, totalSlides),
      );
      setSelectedWorkPreference(
        String(storedDraft.selectedWorkPreference || "individual").trim() ||
          "individual",
      );
      setBasicProfileForm(
        sanitizeBasicProfileFormForDraft(storedDraft.basicProfileForm),
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
    setSelectedWorkPreference(
      String(profileDetails.role || "individual").trim(),
    );
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
        detail.complexity = resolveStoredSelectKey(
          PROJECT_COMPLEXITY_STORAGE_LABELS,
          detail.complexity,
        );
        detail.deliveryTimeline = resolveStoredSelectKey(
          DELIVERY_TIMELINE_STORAGE_LABELS,
          detail.deliveryTimeline,
        );
        detail.priceRange = resolveStoredSelectKey(
          STARTING_PRICE_STORAGE_LABELS,
          detail.priceRange,
        );

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
          if (!detail.complexity) {
            detail.complexity = resolveStoredSelectKey(
              PROJECT_COMPLEXITY_STORAGE_LABELS,
              user?.serviceComplexity || user?.projectComplexity,
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
            detail.priceRange = resolveStoredSelectKey(
              STARTING_PRICE_STORAGE_LABELS,
              user?.startingPrice,
            );
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
    setIsStateOptionsLoading(true);

    fetchStatesByCountry(selectedCountry)
      .then((response) => {
        if (isCancelled) return;

        const nextStates = Array.isArray(response?.states)
          ? response.states.filter(Boolean)
          : [];
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
        setStateOptions([]);
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
      syncUsernameErrorState(USERNAME_CHECK_ERROR, normalizedUsername);
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
      complexity: currentServiceDraft.complexity,
    }),
    [currentServiceDraft.complexity, currentServiceDraft.experience, currentServiceDraft.title],
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

  const currentCaseStudyForm = useMemo(
    () => ({
      title: String(currentServiceDraft.caseStudy?.title ?? ""),
      description: String(currentServiceDraft.caseStudy?.description ?? ""),
      projectLink: String(currentServiceDraft.caseStudy?.projectLink || "").trim(),
      projectFile: currentServiceDraft.caseStudy?.projectFile || null,
      role: String(currentServiceDraft.caseStudy?.role || "").trim(),
      timeline: String(currentServiceDraft.caseStudy?.timeline || "").trim(),
      budget: String(currentServiceDraft.caseStudy?.budget || "").trim(),
      niche: String(currentServiceDraft.caseStudy?.niche || "").trim(),
    }),
    [currentServiceDraft.caseStudy],
  );

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
    const [mediaFiles, projectFile] = await Promise.all([
      persistServiceMediaEntries(normalizedDraft.mediaFiles),
      persistCaseStudyProjectFile(normalizedDraft.caseStudy?.projectFile),
    ]);

    return normalizeServiceDraft(
      {
        ...normalizedDraft,
        mediaFiles,
        caseStudy: normalizedDraft.caseStudy
          ? {
              ...normalizedDraft.caseStudy,
              projectFile: projectFile || null,
            }
          : null,
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
            complexityLabelsByKey: PROJECT_COMPLEXITY_STORAGE_LABELS,
            deliveryLabelsByKey: DELIVERY_TIMELINE_STORAGE_LABELS,
            priceLabelsByKey: STARTING_PRICE_STORAGE_LABELS,
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
    const nextServiceDetails = Object.fromEntries(
      persistedServices.map(([serviceKey, value]) => [serviceKey, value.serializedDetail]),
    );
    const profileDetails = {
      ...currentProfileDetails,
      profileDetailsVersion: 2,
      role: selectedWorkPreference || currentProfileDetails.role || "individual",
      professionalBio: basicProfileForm.professionalBio.trim(),
      services: orderedSelectedServices,
      serviceDetails: nextServiceDetails,
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

    delete profileDetails.serviceSubcategorySkills;
    delete profileDetails.serviceActiveSkillCategory;

    const updatePayload = {
      profileDetails,
      bio: basicProfileForm.professionalBio.trim(),
      professionalBio: basicProfileForm.professionalBio.trim(),
      location: buildLocationLabel({
        state: basicProfileForm.state.trim(),
        country: basicProfileForm.country.trim(),
      }),
      resume: resolvedResumeUrl || null,
    };

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
        toast.success("Freelancer onboarding saved.");
        navigate("/freelancer");
      })
      .catch((error) => {
        setProfileError(error?.message || "Failed to save freelancer onboarding.");
        toast.error(error?.message || "Failed to save freelancer onboarding.");
      })
      .finally(() => {
        setIsProfileSaving(false);
      });
  };

  const handleBack = () => {
    if (currentSlide.id === "serviceSetup" && currentServiceIndex > 0) {
      setCurrentServiceIndex((currentIndex) => Math.max(currentIndex - 1, 0));
      setCurrentSlideIndex(serviceReviewSlideIndex);
      return;
    }

    if (isFirstSlide) {
      return;
    }

    setCurrentSlideIndex((currentIndex) => Math.max(currentIndex - 1, 0));
  };

  const handleContinue = () => {
    if (isContinueDisabled) {
      return;
    }

    if (currentSlide.id === "serviceReview") {
      if (currentServiceIndex < selectedServices.length - 1) {
        setCurrentServiceIndex((currentIndex) =>
          Math.min(currentIndex + 1, selectedServices.length - 1),
        );
        setCurrentSlideIndex(serviceSetupSlideIndex);
        return;
      }

      if (acceptInProgressProjectsSlideIndex >= 0) {
        setCurrentSlideIndex(acceptInProgressProjectsSlideIndex);
        return;
      }

      submitOnboardingAndNavigate();
      return;
    }

    if (currentSlide.id === "acceptInProgressProjects") {
      if (deliveryPolicySlideIndex >= 0) {
        setCurrentSlideIndex(deliveryPolicySlideIndex);
        return;
      }

      submitOnboardingAndNavigate();
      return;
    }

    if (currentSlide.id === "deliveryPolicy") {
      if (communicationPolicySlideIndex >= 0) {
        setCurrentSlideIndex(communicationPolicySlideIndex);
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

    setCurrentSlideIndex((currentIndex) =>
      Math.min(currentIndex + 1, totalSlides - 1)
    );
  };

  const handleDeliveryPolicyAgree = () => {
    if (isProfileSaving) {
      return;
    }

    setDeliveryPolicyAccepted(true);

    if (communicationPolicySlideIndex >= 0) {
      setCurrentSlideIndex(communicationPolicySlideIndex);
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

    if (nextValue === "individual" && isWorkPreferenceSlide) {
      setCurrentSlideIndex((currentIndex) =>
        Math.min(currentIndex + 1, totalSlides - 1)
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
      setCurrentSlideIndex(deliveryPolicySlideIndex);
      return;
    }

    submitOnboardingAndNavigate();
  };

  const handleServiceStepChange = useCallback(
    (nextStepId) => {
      if (isProfileSaving || !currentServiceKey) {
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

      setCurrentSlideIndex(nextSlideIndex);
    },
    [
      caseStudySlideIndex,
      currentServiceKey,
      currentSlideIndex,
      isProfileSaving,
      serviceInfoSlideIndex,
      servicePricingSlideIndex,
      serviceReviewSlideIndex,
      serviceVisualsSlideIndex,
    ],
  );

  const handleServiceInfoSkip = () => {
    if (isProfileSaving) {
      return;
    }

    if (servicePricingSlideIndex >= 0) {
      setCurrentSlideIndex(servicePricingSlideIndex);
      return;
    }

    setCurrentSlideIndex((currentIndex) =>
      Math.min(currentIndex + 1, totalSlides - 1),
    );
  };

  const handleServicePricingSkip = () => {
    if (isProfileSaving) {
      return;
    }

    if (serviceVisualsSlideIndex >= 0) {
      setCurrentSlideIndex(serviceVisualsSlideIndex);
      return;
    }

    setCurrentSlideIndex((currentIndex) =>
      Math.min(currentIndex + 1, totalSlides - 1),
    );
  };

  const handleServiceVisualsSkip = () => {
    if (isProfileSaving) {
      return;
    }

    if (caseStudySlideIndex >= 0) {
      setCurrentSlideIndex(caseStudySlideIndex);
      return;
    }

    setCurrentSlideIndex((currentIndex) =>
      Math.min(currentIndex + 1, totalSlides - 1),
    );
  };

  const handleCaseStudySkip = () => {
    if (isProfileSaving) {
      return;
    }

    if (serviceReviewSlideIndex >= 0) {
      setCurrentSlideIndex(serviceReviewSlideIndex);
      return;
    }

    setCurrentSlideIndex((currentIndex) =>
      Math.min(currentIndex + 1, totalSlides - 1),
    );
  };

  const handleServiceReviewSkip = () => {
    if (isProfileSaving) {
      return;
    }

    if (acceptInProgressProjectsSlideIndex >= 0) {
      setCurrentSlideIndex(acceptInProgressProjectsSlideIndex);
      return;
    }

    setCurrentSlideIndex((currentIndex) =>
      Math.min(currentIndex + 1, totalSlides - 1),
    );
  };

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
      const message = "Profile image must be 5MB or smaller.";
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
      const message = "Resume must be 5MB or smaller.";
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
    setProfileError("");
    setBasicProfileErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors.resume;
      return nextErrors;
    });
  };

  const handleResumeRemove = () => {
    setBasicProfileForm((currentForm) => ({
      ...currentForm,
      resume: null,
    }));
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
      setCurrentSlideIndex((currentIndex) =>
        Math.min(currentIndex + 1, totalSlides - 1),
      );
      return;
    }

    setIsProfileSaving(true);
    try {
      await validateBasicProfileBeforeContinue();
      await ensureMarketplaceServicesLoaded();
      setCurrentSlideIndex((currentIndex) =>
        Math.min(currentIndex + 1, totalSlides - 1),
      );
    } catch (error) {
      setProfileError(error?.message || "Please complete your basic profile.");
      toast.error(error?.message || "Please complete your basic profile.");
    } finally {
      setIsProfileSaving(false);
    }
  };

  const resetOnboardingLocally = useCallback(() => {
    const currentPhotoUrl = extractProfilePhotoUrl(basicProfileForm.profilePhoto);

    revokeObjectUrlIfNeeded(currentPhotoUrl);
    usernameCheckRequestRef.current += 1;

    setCurrentSlideIndex(0);
    setSelectedWorkPreference("");
    setBasicProfileForm(createInitialBasicProfileForm());
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
  }, [basicProfileForm.profilePhoto]);

  const handleResetOnboarding = useCallback(async () => {
    if (isResettingOnboarding) {
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
    }
  }, [isResettingOnboarding, refreshUser, resetOnboardingLocally, user?.id]);

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

  return (
    <main className="relative flex h-screen min-h-screen flex-col overflow-hidden bg-background text-[#f1f5f9] h-[100dvh]">
      <header className="relative z-20 shrink-0 border-b border-white/8 bg-card">
        <div
          className="absolute left-0 top-0 h-1 bg-[#facc15] transition-all duration-300"
          style={{ width: `${progressValue}%` }}
        />
        <div className="relative flex items-center justify-between px-4 py-4 sm:px-6">
          {isFirstSlide ? (
            <Button
              asChild
              variant="secondary"
              className="h-10 rounded-full border border-white/10 bg-card px-4 text-sm font-semibold text-foreground shadow-none hover:bg-accent/10"
            >
              <Link to="/freelancer">
                <ChevronLeft className="h-4 w-4" />
                Back to dashboard
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={handleBack}
              className="h-10 w-10 rounded-full border border-white/10 bg-card text-foreground shadow-none hover:bg-accent/10"
              aria-label={`Go back to slide ${currentSlideIndex}`}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}

          <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-10 w-10 rounded-full border border-white/10 bg-card text-foreground shadow-none hover:bg-accent/10"
                aria-label={`Onboarding settings for slide ${currentSlideIndex + 1} of ${totalSlides}`}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[92vw] border-white/10 bg-card p-0 text-foreground sm:max-w-sm"
            >
              <SheetHeader className="border-b border-white/10 px-5 py-4 text-left">
                <SheetTitle className="text-white">Onboarding settings</SheetTitle>
                <SheetDescription className="text-white/60">
                  Manage the current onboarding session.
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 px-5 py-5">
                <div className="rounded-2xl border border-white/10 bg-background/40 p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                    Current progress
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    Slide {currentSlideIndex + 1} of {totalSlides}
                  </p>
                  <p className="mt-1 text-sm text-white/60">
                    {currentSlide.title || "Freelancer onboarding"}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleResetOnboarding}
                  disabled={isResettingOnboarding || isProfileSaving}
                  className="h-auto w-full justify-start rounded-2xl px-4 py-3 text-left"
                >
                  Reset onboarding
                </Button>

                <p className="text-sm leading-6 text-white/55">
                  This restarts the onboarding flow from the first slide and clears
                  the current in-progress form values in this session.
                </p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <section className="subtle-scrollbar relative min-h-0 flex-1 overflow-y-auto">
        <div className="min-h-full px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
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
                onUpdateServiceDraft={updateCurrentServiceDraft}
                serviceInfoForm={currentServiceInfoForm}
                onServiceInfoFieldChange={(field, value) =>
                  updateCurrentServiceDraft((draft) => ({
                    ...draft,
                    [field]: value,
                  }))
                }
                servicePricingForm={currentServicePricingForm}
                onServicePricingFieldChange={(field, value) =>
                  updateCurrentServiceDraft((draft) => ({
                    ...draft,
                    [field === "description" ? "description" : field]: value,
                  }))
                }
                serviceVisualsForm={currentServiceVisualsForm}
                onServiceVisualsFieldChange={(field, value) =>
                  updateCurrentServiceDraft((draft) => ({
                    ...draft,
                    [field]: value,
                  }))
                }
                caseStudyForm={currentCaseStudyForm}
                nicheOptions={dbNiches}
                onCaseStudyFieldChange={(field, value) =>
                  updateCurrentServiceDraft((draft) => ({
                    ...draft,
                    caseStudy: {
                      ...(draft.caseStudy || {}),
                      [field]: value,
                    },
                  }))
                }
                acceptInProgressProjectsValue={acceptInProgressProjectsValue}
                onAcceptInProgressProjectsChange={handleAcceptInProgressProjectsSelect}
                onCommunicationPolicyReadinessChange={(isReady) =>
                  setCommunicationPolicyReady(Boolean(isReady))
                }
                isProfileSaving={isProfileSaving}
                user={user}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {isFooterHidden ? null : (
        <footer className="relative z-20 shrink-0 border-t border-white/8 bg-card px-4 py-4 sm:px-6">
          <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div />

            <Button
              type="button"
              size="lg"
              onClick={footerPrimaryAction}
              disabled={footerPrimaryDisabled}
              className="h-11 px-10"
            >
              {footerPrimaryLabel}
            </Button>

            {isProfileActionFooter ? (
              <div />
            ) : isServiceInfoSlide ? (
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={handleServiceInfoSkip}
                disabled={isProfileSaving}
                className="h-11 justify-self-end bg-card px-10 text-base font-medium text-white hover:bg-accent/10"
              >
                Skip
              </Button>
            ) : isServicePricingSlide ? (
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={handleServicePricingSkip}
                disabled={isProfileSaving}
                className="h-11 justify-self-end bg-card px-10 text-base font-medium text-white hover:bg-accent/10"
              >
                Skip
              </Button>
            ) : isServiceVisualsSlide ? (
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={handleServiceVisualsSkip}
                disabled={isProfileSaving}
                className="h-11 justify-self-end bg-card px-10 text-base font-medium text-white hover:bg-accent/10"
              >
                Skip
              </Button>
            ) : isCaseStudySlide ? (
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={handleCaseStudySkip}
                disabled={isProfileSaving}
                className="h-11 justify-self-end bg-card px-10 text-base font-medium text-white hover:bg-accent/10"
              >
                Skip
              </Button>
            ) : isServiceReviewSlide ? (
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={handleServiceReviewSkip}
                disabled={isProfileSaving}
                className="h-11 justify-self-end bg-card px-10 text-base font-medium text-white hover:bg-accent/10"
              >
                Skip
              </Button>
            ) : (
              <div />
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
  );
};

export default FreelancerOnboardingShell;
