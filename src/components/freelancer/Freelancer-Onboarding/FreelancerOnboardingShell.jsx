import { useCallback, useEffect, useRef, useState } from "react";
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
};

const AVATAR_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
const MIN_USERNAME_LENGTH = 3;
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

const flattenSubcategorySkillMap = (skillMap) =>
  normalizeStringArray(
    Object.values(skillMap || {}).flatMap((skills) =>
      Array.isArray(skills) ? skills : [],
    ),
  );

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
  const [dbServices, setDbServices] = useState(cachedMarketplaceServices);
  const [dbNiches, setDbNiches] = useState(cachedMarketplaceNiches);
  const [serviceInfoForm, setServiceInfoForm] = useState({
    title: "",
    category: [],
    categoryLabel: [],
    technologies: [],
    subcategorySkills: {},
    activeSkillCategory: "",
    experience: "",
    complexity: "",
  });
  const [servicePricingForm, setServicePricingForm] = useState({
    description: "",
    deliveryTimeline: "",
    priceRange: "",
  });
  const [serviceVisualsForm, setServiceVisualsForm] = useState({
    keywords: [],
    mediaFiles: [],
  });
  const [caseStudyForm, setCaseStudyForm] = useState({
    title: "",
    description: "",
    projectLink: "",
    projectFile: null,
    role: "",
    timeline: "",
    budget: "",
    niche: "",
  });
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

  const totalSlides = FREELANCER_ONBOARDING_SLIDES.length;
  const currentSlide =
    FREELANCER_ONBOARDING_SLIDES[currentSlideIndex] ||
    FREELANCER_ONBOARDING_SLIDES[0];
  const ActiveSlide = slideRegistry[currentSlide.id];
  const progressValue =
    currentSlide.progressValue ??
    ((currentSlideIndex + 1) / Math.max(totalSlides, 1)) * 100;
  const isFirstSlide = currentSlideIndex === 0;
  const isLastSlide = currentSlideIndex >= totalSlides - 1;
  const isWorkPreferenceSlide = currentSlide.id === "workPreference";
  const isServicesSlide = currentSlide.id === "services";
  const isProfileActionFooter = currentSlide.footerMode === "profileActions";
  const isContinueDisabled = isWorkPreferenceSlide
    ? selectedWorkPreference !== "individual"
    : isServicesSlide
      ? selectedServices.length === 0
      : false;

  useEffect(() => {
    if (!user || hasHydratedFromUser) {
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
    const nextServices = Array.isArray(profileDetails.services)
      ? profileDetails.services
      : Array.isArray(user.services)
        ? user.services
        : [];

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
    }));
    setSelectedWorkPreference(
      String(profileDetails.role || selectedWorkPreference || "individual").trim(),
    );
    setSelectedServices(nextServices);
    setServiceInfoForm((currentForm) => {
      const normalizedCategory = Array.isArray(currentForm.category)
        ? currentForm.category
            .map((value) => String(value || "").trim())
            .filter(Boolean)
        : String(currentForm.category || "").trim()
          ? [String(currentForm.category).trim()]
          : [];

      const normalizedCategoryLabel = String(user?.serviceCategory || "").trim()
        ? String(user.serviceCategory)
            .split(",")
            .map((value) => String(value || "").trim())
            .filter(Boolean)
        : Array.isArray(currentForm.categoryLabel)
          ? currentForm.categoryLabel
              .map((value) => String(value || "").trim())
              .filter(Boolean)
          : String(currentForm.categoryLabel || "").trim()
            ? [String(currentForm.categoryLabel).trim()]
            : [];

      const normalizedSubcategorySkills = normalizeSubcategorySkillMap(
        profileDetails?.serviceSubcategorySkills,
      );
      const mappedSkills = flattenSubcategorySkillMap(normalizedSubcategorySkills);

      const normalizedTechnologies = normalizeStringArray(
        Array.isArray(user?.skills)
          ? user.skills
          : mappedSkills.length > 0
            ? mappedSkills
            : currentForm.technologies,
      );

      const nextSubcategorySkills =
        Object.keys(normalizedSubcategorySkills).length > 0
          ? normalizedSubcategorySkills
          : normalizedTechnologies.length > 0 && normalizedCategory.length > 0
            ? { [normalizedCategory[0]]: normalizedTechnologies }
            : {};

      const preferredActiveCategory = String(
        profileDetails?.serviceActiveSkillCategory || currentForm.activeSkillCategory || "",
      ).trim();
      const nextActiveCategory = normalizedCategory.includes(preferredActiveCategory)
        ? preferredActiveCategory
        : normalizedCategory[0] || "";

      return {
        ...currentForm,
        title: String(user?.serviceTitle || currentForm.title || "").trim(),
        category: normalizedCategory,
        categoryLabel: normalizedCategoryLabel,
        technologies: normalizedTechnologies,
        subcategorySkills: nextSubcategorySkills,
        activeSkillCategory: nextActiveCategory,
        experience:
          findStorageKeyByLabel(
            SERVICE_EXPERIENCE_STORAGE_LABELS,
            user?.serviceExperience,
          ) || currentForm.experience,
        complexity:
          findStorageKeyByLabel(
            PROJECT_COMPLEXITY_STORAGE_LABELS,
            user?.projectComplexity,
          ) || currentForm.complexity,
      };
    });
    setServicePricingForm((currentForm) => ({
      ...currentForm,
      description: String(
        user?.serviceDescription || currentForm.description || "",
      ).trim(),
      deliveryTimeline:
        findStorageKeyByLabel(
          DELIVERY_TIMELINE_STORAGE_LABELS,
          user?.deliveryTimeline,
        ) || currentForm.deliveryTimeline,
      priceRange:
        findStorageKeyByLabel(
          STARTING_PRICE_STORAGE_LABELS,
          user?.startingPrice,
        ) || currentForm.priceRange,
    }));
    setServiceVisualsForm((currentForm) => ({
      ...currentForm,
      keywords: Array.isArray(user?.serviceKeywords)
        ? user.serviceKeywords.filter(Boolean)
        : currentForm.keywords,
      mediaFiles: Array.isArray(user?.serviceMedia)
        ? user.serviceMedia
            .map((entry, index) => buildRemoteServiceMedia(entry, index))
            .filter(Boolean)
        : currentForm.mediaFiles,
    }));
    setHasHydratedFromUser(true);
  }, [hasHydratedFromUser, selectedWorkPreference, user]);

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

  const buildMergedProfileDetails = (resolvedAvatarUrl = "") => {
    const currentProfileDetails =
      user?.profileDetails && typeof user.profileDetails === "object"
        ? user.profileDetails
        : {};
    const currentIdentity =
      currentProfileDetails.identity &&
      typeof currentProfileDetails.identity === "object"
        ? currentProfileDetails.identity
        : {};
    const mergedServices =
      selectedServices.length > 0
        ? selectedServices
        : Array.isArray(currentProfileDetails.services)
          ? currentProfileDetails.services
          : [];
    const subcategorySkills = normalizeSubcategorySkillMap(
      serviceInfoForm.subcategorySkills,
    );
    const activeSkillCategory = String(
      serviceInfoForm.activeSkillCategory || "",
    ).trim();
    const nextProfileDetails = {
      ...currentProfileDetails,
      role: selectedWorkPreference || currentProfileDetails.role || "individual",
      professionalBio: basicProfileForm.professionalBio.trim(),
      services: mergedServices,
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

    if (Object.keys(subcategorySkills).length > 0) {
      nextProfileDetails.serviceSubcategorySkills = subcategorySkills;
    } else {
      delete nextProfileDetails.serviceSubcategorySkills;
    }

    if (
      activeSkillCategory &&
      Object.prototype.hasOwnProperty.call(subcategorySkills, activeSkillCategory)
    ) {
      nextProfileDetails.serviceActiveSkillCategory = activeSkillCategory;
    } else {
      delete nextProfileDetails.serviceActiveSkillCategory;
    }

    return nextProfileDetails;
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

  const persistOnboardingProfile = async ({ markComplete = false } = {}) => {
    if (!user?.id) {
      throw new Error("You need to be logged in to save your freelancer profile.");
    }

    await validateBasicProfileBeforeContinue();

    const professionalBio = basicProfileForm.professionalBio.trim();
    const country = basicProfileForm.country.trim();
    const state = basicProfileForm.state.trim();
    const serviceTitle = String(serviceInfoForm.title || "").trim();
    const serviceCategory = (
      Array.isArray(serviceInfoForm.categoryLabel)
        ? serviceInfoForm.categoryLabel
        : String(serviceInfoForm.categoryLabel || "")
            .split(",")
    )
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .join(", ");
    const serviceExperience =
      SERVICE_EXPERIENCE_STORAGE_LABELS[serviceInfoForm.experience] || null;
    const projectComplexity =
      PROJECT_COMPLEXITY_STORAGE_LABELS[serviceInfoForm.complexity] || null;
    const normalizedSubcategorySkills = normalizeSubcategorySkillMap(
      serviceInfoForm.subcategorySkills,
    );
    const flattenedSubcategorySkills = flattenSubcategorySkillMap(
      normalizedSubcategorySkills,
    );
    const fallbackTechnologies = normalizeStringArray(serviceInfoForm.technologies);
    const persistedSkills =
      flattenedSubcategorySkills.length > 0
        ? flattenedSubcategorySkills
        : fallbackTechnologies;
    const serviceDescription = String(
      servicePricingForm.description || "",
    ).trim();
    const deliveryTimeline =
      DELIVERY_TIMELINE_STORAGE_LABELS[servicePricingForm.deliveryTimeline] || null;
    const startingPrice =
      STARTING_PRICE_STORAGE_LABELS[servicePricingForm.priceRange] || null;
    const serviceKeywords = Array.isArray(serviceVisualsForm.keywords)
      ? serviceVisualsForm.keywords.filter(Boolean).slice(0, 5)
      : [];

    const localProfilePhotoFile = extractProfilePhotoFile(basicProfileForm.profilePhoto);
    const initialAvatarUrl = extractProfilePhotoUrl(basicProfileForm.profilePhoto);
    const [resolvedAvatarUrl, serviceMedia] = await Promise.all([
      localProfilePhotoFile
        ? uploadProfilePhoto(localProfilePhotoFile)
        : Promise.resolve(initialAvatarUrl),
      persistServiceMediaEntries(serviceVisualsForm.mediaFiles),
    ]);

    const profileDetails = buildMergedProfileDetails(resolvedAvatarUrl);
    const updatePayload = {
      profileDetails,
      bio: professionalBio,
      location: buildLocationLabel({ state, country }),
      services:
        selectedServices.length > 0
          ? selectedServices
          : Array.isArray(profileDetails.services)
            ? profileDetails.services
            : [],
      skills: persistedSkills,
      serviceTitle: serviceTitle || null,
      serviceCategory: serviceCategory || null,
      serviceExperience,
      projectComplexity,
      serviceDescription: serviceDescription || null,
      deliveryTimeline,
      startingPrice,
      serviceKeywords,
      serviceMedia,
    };

    if (resolvedAvatarUrl) {
      updatePayload.avatar = resolvedAvatarUrl;
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

    if (serviceMedia.length > 0 || serviceVisualsForm.mediaFiles.length > 0) {
      setServiceVisualsForm((currentForm) => ({
        ...currentForm,
        mediaFiles: serviceMedia
          .map((entry, index) => buildRemoteServiceMedia(entry, index))
          .filter(Boolean),
      }));
    }
  };

  const ensureMarketplaceServicesLoaded = useCallback(async () => {
    if (dbServices.length) {
      return dbServices;
    }

    const services = await fetchMarketplaceServices();
    setDbServices(services);
    return services;
  }, [dbServices]);

  const handleBack = () => {
    if (isFirstSlide) {
      return;
    }

    setCurrentSlideIndex((currentIndex) => Math.max(currentIndex - 1, 0));
  };

  const handleContinue = () => {
    if (isContinueDisabled) {
      return;
    }

    if (isLastSlide) {
      setIsProfileSaving(true);
      setProfileError("");

      persistOnboardingProfile({ markComplete: true })
        .then(async () => {
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
      return;
    }

    setCurrentSlideIndex((currentIndex) =>
      Math.min(currentIndex + 1, totalSlides - 1)
    );
  };

  const handleWorkPreferenceSelect = (nextValue) => {
    setSelectedWorkPreference(nextValue);

    if (nextValue === "individual" && isWorkPreferenceSlide) {
      setCurrentSlideIndex((currentIndex) =>
        Math.min(currentIndex + 1, totalSlides - 1)
      );
    }
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
    setProfileError("");
    setSelectedServices((current) =>
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId]
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

  const closeProfileCropDialog = () => {
    setPendingProfilePhotoFile(null);
    setIsProfileCropOpen(false);
  };

  const handleBasicProfileSkip = () => {
    navigate("/freelancer");
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
    : handleContinue;
  const footerPrimaryLabel = isProfileActionFooter
    ? "Continue"
    : currentSlide.continueLabel || "Continue";
  const footerPrimaryDisabled = isProfileActionFooter
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
                selectedServices={selectedServices}
                onToggleService={handleServiceToggle}
                dbServices={dbServices}
                serviceInfoForm={serviceInfoForm}
                onServiceInfoFieldChange={(field, value) =>
                  setServiceInfoForm((prev) => ({ ...prev, [field]: value }))
                }
                servicePricingForm={servicePricingForm}
                onServicePricingFieldChange={(field, value) =>
                  setServicePricingForm((prev) => ({ ...prev, [field]: value }))
                }
                serviceVisualsForm={serviceVisualsForm}
                onServiceVisualsFieldChange={(field, value) =>
                  setServiceVisualsForm((prev) => ({ ...prev, [field]: value }))
                }
                caseStudyForm={caseStudyForm}
                nicheOptions={dbNiches}
                onCaseStudyFieldChange={(field, value) =>
                  setCaseStudyForm((prev) => ({ ...prev, [field]: value }))
                }
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <footer className="relative z-20 shrink-0 border-t border-white/8 bg-card px-4 py-4 sm:px-6">
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div />

          <Button
            type="button"
            size="lg"
            onClick={footerPrimaryAction}
            disabled={footerPrimaryDisabled}
            className="px-10"
          >
            {footerPrimaryLabel}
          </Button>

          {isProfileActionFooter ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleBasicProfileSkip}
              className="justify-self-end bg-card px-10 text-base font-medium text-white hover:bg-accent/10"
            >
              Skip for now
            </Button>
          ) : (
            <div />
          )}
        </div>
      </footer>
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
