/* eslint-disable no-irregular-whitespace */
import Camera from "lucide-react/dist/esm/icons/camera";
import Check from "lucide-react/dist/esm/icons/check";
import Edit2 from "lucide-react/dist/esm/icons/edit-2";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal";
import Plus from "lucide-react/dist/esm/icons/plus";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProfileImageCropDialog from "@/components/features/freelancer/onboarding/ProfileImageCropDialog";
import { useAuth } from "@/shared/context/AuthContext";
import { useNotifications } from "@/shared/context/NotificationContext";
import {
  getServiceLabel,
  createServiceDetail,
  getTechStackOptions,
} from "@/components/features/freelancer/onboarding/utils";
import {
  AVERAGE_PROJECT_PRICE_OPTIONS,
  EXPERIENCE_YEARS_OPTIONS,
  PROJECT_TIMELINE_OPTIONS,
  SERVICE_OPTIONS,
} from "@/components/features/freelancer/onboarding/constants";
import { useNavigate } from "react-router-dom";

import {
  EducationModalContent,
  FeaturedProjectsSection,
  FreelancerProfileLoadingState,
  FreelancerProfileModalHost,
  FreelancerProfilePageShell,
  FullProfileEditorModalContent,
  PersonalDetailsModalContent,
  ProfileHeroCard,
  ProfileOnboardingSnapshotCard,
  ProfileSidebarCards,
  ProfileSkillsCard,
  ProfileSummaryCards,
  ProjectCoverMedia,
  ServicesFromOnboardingCard,
  WorkExperienceModalContent,
  normalizeBioValue,
  formatSkillLabel,
  isNoisySkillTag,
  getSkillDedupKey,
  toUniqueSkillNames,
  toUniqueSkillObjects,
  buildSkillLevelsByKey,
  buildLocationFromIdentity,
  resolveAvatarUrl,
  normalizeValueLabel,
  ONBOARDING_ROLE_LABELS,
  formatHoursPerWeekLabel,
  normalizePresenceLink,
  normalizeProjectLinkValue,
  hasTextValue,
  collectOnboardingPlatformLinks,
  isPortfolioLikeKey,
  parseDelimitedValues,
  toUniqueLabels,
  collectServiceSpecializations,
  splitExperienceTitle,
  splitExperiencePeriod,
  normalizeWorkExperienceEntries,
  initialWorkForm,
  MONTH_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  LOCATION_TYPE_OPTIONS,
  YEAR_OPTIONS,
  parseMonthYearParts,
  buildMonthYearLabel,
  createEmptyEducationEntry,
  collectEducationEntriesFromProfileDetails,
  normalizeEducationEntriesForSave,
  createInitialFullProfileForm,
  PERSONAL_EDITOR_SECTIONS,
  FULL_PROFILE_EDITOR_SECTIONS,
  DEFAULT_SKILL_LEVEL,
  SKILL_LEVEL_OPTIONS,
  formatSkillLevelLabel,
  normalizeSkillLevel,
} from "@/components/freelancer/Freelancer-Profile";

const AVATAR_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
const PROFILE_PHOTO_PICK_MAX_BYTES = 20 * 1024 * 1024;
const CUSTOM_SERVICE_OPTION_VALUE = "__custom__";

const createInitialServiceForm = () => ({
  selectedServiceKey: "",
  customServiceName: "",
});

const createInitialSkillForm = () => ({
  name: "",
  level: DEFAULT_SKILL_LEVEL,
});

const normalizeServiceIdentity = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const parseLocationInput = (value = "") => {
  const parts = String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { city: "", country: "" };
  }

  if (parts.length === 1) {
    return { city: parts[0], country: "" };
  }

  return {
    city: parts[0],
    country: parts.slice(1).join(", "),
  };
};

const resolveCatalogServiceMatch = (value = "") => {
  const normalizedValue = normalizeServiceIdentity(value);
  if (!normalizedValue) return null;

  return (
    SERVICE_OPTIONS.find((option) =>
      [option.value, option.label].some(
        (candidate) => normalizeServiceIdentity(candidate) === normalizedValue
      )
    ) || null
  );
};

const normalizeServiceSkillTags = (values = []) =>
  toUniqueLabels(values).filter((entry) => !isNoisySkillTag(entry));

const normalizeProjectServiceKeys = (values = []) => {
  const candidates = Array.isArray(values) ? values : [values];
  const seen = new Set();

  return candidates.reduce((acc, value) => {
    const rawValue = String(value || "").trim();
    const normalizedValue = normalizeServiceIdentity(rawValue);
    if (!normalizedValue || seen.has(normalizedValue)) {
      return acc;
    }

    seen.add(normalizedValue);
    acc.push(rawValue);
    return acc;
  }, []);
};

const resolveProjectServiceKeys = (project = {}) =>
  normalizeProjectServiceKeys([
    ...(Array.isArray(project?.serviceKeys) ? project.serviceKeys : []),
    project?.serviceKey,
  ]);

const resolveProjectServiceLabels = (project = {}) =>
  resolveProjectServiceKeys(project).map((serviceKey) => getServiceLabel(serviceKey));

const formatFileSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};

const formatUtcOffsetLabel = (offsetMinutes) => {
  if (!Number.isFinite(offsetMinutes)) return "UTC";

  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = Math.floor(absoluteMinutes / 60);
  const minutes = absoluteMinutes % 60;

  return `UTC${sign}${hours}:${String(minutes).padStart(2, "0")}`;
};

const normalizeTimeZoneLabel = (value = "") => {
  const raw = String(value || "").trim();

  if (!raw) return "";
  if (raw === "Asia/Kolkata" || raw === "Asia/Calcutta") {
    return "IST (UTC+5:30)";
  }
  if (/^(utc|gmt)/i.test(raw) || raw.includes("(")) return raw;

  return raw.replace(/_/g, " ");
};

const getLocalTimeZoneLabel = () => {
  if (typeof Intl === "undefined") return "Local timezone";

  try {
    const now = new Date();
    const resolvedTimeZone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const offsetLabel = formatUtcOffsetLabel(-now.getTimezoneOffset());

    if (
      resolvedTimeZone === "Asia/Kolkata" ||
      resolvedTimeZone === "Asia/Calcutta"
    ) {
      return "IST (UTC+5:30)";
    }

    const shortLabel =
      new Intl.DateTimeFormat("en-US", { timeZoneName: "short" })
        .formatToParts(now)
        .find((part) => part.type === "timeZoneName")?.value || "";

    if (shortLabel && !/^(utc|gmt)/i.test(shortLabel)) {
      return `${shortLabel} (${offsetLabel})`;
    }

    return offsetLabel;
  } catch {
    return "Local timezone";
  }
};

const FreelancerProfile = () => {
  const navigate = useNavigate();
  const { user, authFetch } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const [modalType, setModalType] = useState(null);
  const [skills, setSkills] = useState([]); // [{ name }]
  const [workExperience, setWorkExperience] = useState([]); // {title, period, description}
  const [services, setServices] = useState([]); // string[]
  const [skillForm, setSkillForm] = useState(createInitialSkillForm);
  const [workForm, setWorkForm] = useState(initialWorkForm);
  const [editingIndex, setEditingIndex] = useState(null); // null = add, number = edit

  const [personal, setPersonal] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    headline: "",
    bio: "",
    experienceYears: "",
    avatar: "",
    coverImage: "",
    available: true,
    openToWork: true,
  });
  const [portfolio, setPortfolio] = useState({
    portfolioUrl: "",
    linkedinUrl: "",
    githubUrl: "",
    resume: "",
  });
  const [portfolioProjects, setPortfolioProjects] = useState([]); // [{ link, image, title }]
  const [profileDetails, setProfileDetails] = useState({});
  const [newProjectUrl, setNewProjectUrl] = useState("");
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [newProjectServiceKeys, setNewProjectServiceKeys] = useState([]);
  const [newProjectImageFile, setNewProjectImageFile] = useState(null);
  const [newProjectImagePreview, setNewProjectImagePreview] = useState("");
  const [isProjectCoverDragActive, setIsProjectCoverDragActive] = useState(false);
  const [editingProjectIndex, setEditingProjectIndex] = useState(null);
  const [serviceProfileForm, setServiceProfileForm] = useState({
    serviceKey: "",
    serviceLabel: "",
    experienceYears: "",
    serviceDescription: "",
    coverImage: "",
    averageProjectPrice: "",
    deliveryTime: "",
    skillsAndTechnologies: [],
  });
  const [serviceSkillInput, setServiceSkillInput] = useState("");
  const [savingServiceProfile, setSavingServiceProfile] = useState(false);
  const [uploadingServiceCover, setUploadingServiceCover] = useState(false);
  const [projectCoverUploadingIndex, setProjectCoverUploadingIndex] =
    useState(null);
  const [newProjectLoading, setNewProjectLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingCoverImage, setUploadingCoverImage] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedCoverFile, setSelectedCoverFile] = useState(null);
  const [pendingProfilePhotoFile, setPendingProfilePhotoFile] = useState(null);
  const [isProfileCropOpen, setIsProfileCropOpen] = useState(false);
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const resumeInputRef = useRef(null);
  const projectPreviewAttemptRef = useRef(new Set());
  const [initialData, setInitialData] = useState(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isAvailabilitySaving, setIsAvailabilitySaving] = useState(false);
  const [fullProfileForm, setFullProfileForm] = useState(
    createInitialFullProfileForm
  );
  const [, setPersonalEditorSection] = useState(
    PERSONAL_EDITOR_SECTIONS.ALL
  );
  const [fullProfileEditorSection, setFullProfileEditorSection] = useState(
    FULL_PROFILE_EDITOR_SECTIONS.ALL
  );

  useEffect(() => {
    return () => {
      if (newProjectImagePreview && newProjectImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(newProjectImagePreview);
      }
    };
  }, [newProjectImagePreview]);

  useEffect(() => {
    if (!modalType || typeof window === "undefined") return undefined;

    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPaddingRight = body.style.paddingRight;
    const previousHtmlOverflow = documentElement.style.overflow;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

    body.style.overflow = "hidden";
    documentElement.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = previousBodyOverflow;
      body.style.paddingRight = previousBodyPaddingRight;
      documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [modalType]);

  // Derive initials for avatar
  const initials =
    personal.name
      ?.trim()
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "KS";

  useEffect(() => {
    let active = true;

    const normalizeProfileData = (payload = {}) => {
      const identityAvatar = resolveAvatarUrl(
        payload.profileDetails?.identity?.profilePhoto,
        { allowBlob: true }
      );
      const identityCoverImage = resolveAvatarUrl(
        payload.profileDetails?.identity?.coverImage,
        { allowBlob: true }
      );
      const normalizedProfileDetails =
        payload.profileDetails && typeof payload.profileDetails === "object"
          ? payload.profileDetails
          : {};

      if (payload?.personal) {
        // Ensure portfolio object has resume even if API already structured data
        const existingPortfolio = payload.portfolio || {};
        const identityLocation = buildLocationFromIdentity(
          normalizedProfileDetails?.identity
        );
        const identityTitle = String(
          normalizedProfileDetails?.identity?.professionalTitle || ""
        ).trim();
        const personalAvatar =
          resolveAvatarUrl(payload.personal?.avatar) || identityAvatar;
        const personalCoverImage =
          resolveAvatarUrl(payload.personal?.coverImage, { allowBlob: true }) ||
          identityCoverImage;
        let location = payload.personal?.location || "";
        if (location && location.endsWith(" 0")) {
          location = location.slice(0, -2);
        }

        return {
          ...payload,
          personal: {
            ...payload.personal,
            avatar: personalAvatar,
            coverImage: personalCoverImage,
            location: location || identityLocation,
            headline: payload.personal?.headline || identityTitle || "",
            openToWork:
              payload.personal?.openToWork !== undefined
                ? Boolean(payload.personal.openToWork)
                : payload.personal?.available !== undefined
                  ? Boolean(payload.personal.available)
                  : true,
          },
          portfolio: {
            portfolioUrl: existingPortfolio.portfolioUrl || "",
            linkedinUrl: existingPortfolio.linkedinUrl || "",
            githubUrl: existingPortfolio.githubUrl || "",
            resume: existingPortfolio.resume || payload.resume || "",
          },
          profileDetails: normalizedProfileDetails,
        };
      }

      const identityLocation = buildLocationFromIdentity(
        payload.profileDetails?.identity
      );

      let rawLocation = payload.location ?? identityLocation ?? "";
      if (rawLocation && rawLocation.endsWith(" 0")) {
        rawLocation = rawLocation.slice(0, -2);
      }

      return {
        personal: {
          name: payload.fullName ?? payload.name ?? "",
          email: payload.email ?? "",
          phone: payload.phone ?? payload.phoneNumber ?? "",
          location: rawLocation,
          headline:
            payload.jobTitle ??
            payload.headline ??
            normalizedProfileDetails?.identity?.professionalTitle ??
            "",
          bio: payload.bio ?? "",
          experienceYears: payload.experienceYears ?? "",
          avatar: resolveAvatarUrl(payload.avatar) || identityAvatar,
          coverImage:
            resolveAvatarUrl(payload.coverImage, { allowBlob: true }) ||
            identityCoverImage,
          available:
            payload.available !== undefined
              ? Boolean(payload.available)
              : payload.status !== undefined
                ? payload.status === "ACTIVE"
                : true,
          openToWork:
            payload.openToWork !== undefined
              ? Boolean(payload.openToWork)
              : payload.available !== undefined
                ? Boolean(payload.available)
              : true,
          isVerified: Boolean(
            payload.personal?.isVerified ??
            payload.freelancerProfile?.isVerified ??
            payload.isVerified
          ),
        },
        skills: Array.isArray(payload.skills) ? payload.skills : [],
        workExperience: Array.isArray(payload.workExperience) ? payload.workExperience : [],
        services: Array.isArray(payload.services) ? payload.services : [],
        portfolio: {
          portfolioUrl: payload.portfolio ?? "",
          linkedinUrl: payload.linkedin ?? "",
          githubUrl: payload.github ?? "",
          resume: payload.resume ?? "",
        },
        portfolioProjects: payload.portfolioProjects ?? [],
        profileDetails: normalizedProfileDetails,
      };
    };

    const loadProfile = async () => {
      setProfileLoading(true);
      setSelectedFile(null);
      setSelectedCoverFile(null);

      if (!user) {
        if (!active) return;

        setPersonal({
          name: "",
          email: "",
          phone: "",
          location: "",
          headline: "",
          bio: "",
          experienceYears: "",
          avatar: "",
          coverImage: "",
          available: false,
          openToWork: false,
          isVerified: false,
        });
        setPortfolio({
          portfolioUrl: "",
          linkedinUrl: "",
          githubUrl: "",
          resume: "",
        });
        setPortfolioProjects([]);
        setProfileDetails({});
        setSkills([]);
        setWorkExperience([]);
        setServices([]);
        setInitialData(null);

        setProfileLoading(false);
        return;
      }

      try {
        let data = null;

        if (user?.email) {
          const response = await authFetch(
            `/profile?_t=${Date.now()}`
          );

          if (response.ok) {
            const payload = await response.json();
            data = payload?.data ?? null;
          } else {
            console.warn("Profile GET not ok:", response.status);
          }
        }

        if (!data) {
          const fallbackResponse = await authFetch("/auth/profile");
          if (fallbackResponse.ok) {
            const payload = await fallbackResponse.json();
            data = payload?.data ?? null;
          }
        }

        if (!data && user) {
          data = user;
        }

        if (!active || !data) return; // Prevent updating state if unmounted or no data

        const normalized = normalizeProfileData(data);

        // Debug logging
        console.log("[FreelancerProfile] Loaded data from API:", normalized);
        console.log(
          "[FreelancerProfile] Headline from API:",
          normalized.personal?.headline
        );

        // Update state with API data
        const loadedProfileDetails =
          normalized.profileDetails &&
            typeof normalized.profileDetails === "object"
            ? normalized.profileDetails
            : {};
        const identityFallbackLocation = buildLocationFromIdentity(
          loadedProfileDetails?.identity
        );
        const identityFallbackTitle = String(
          loadedProfileDetails?.identity?.professionalTitle || ""
        ).trim();
        const identityFallbackAvatar = resolveAvatarUrl(
          loadedProfileDetails?.identity?.profilePhoto,
          { allowBlob: true }
        );
        const identityFallbackCoverImage = resolveAvatarUrl(
          loadedProfileDetails?.identity?.coverImage,
          { allowBlob: true }
        );

        const loadedPersonal = {
          name: normalized.personal?.name ?? user?.fullName ?? user?.name ?? "",
          email: normalized.personal?.email ?? user?.email ?? "",
          phone: normalized.personal?.phone ?? "",
          location:
            normalized.personal?.location || identityFallbackLocation || "",
          headline:
            normalized.personal?.headline || identityFallbackTitle || "",
          bio: normalizeBioValue(normalized.personal?.bio || ""),
          experienceYears: normalized.personal?.experienceYears ?? "",
          avatar:
            resolveAvatarUrl(normalized.personal?.avatar, { allowBlob: true }) ||
            identityFallbackAvatar ||
            "",
          coverImage:
            resolveAvatarUrl(normalized.personal?.coverImage, {
              allowBlob: true,
            }) ||
            identityFallbackCoverImage ||
            "",
          available: normalized.personal?.available ?? true,
          openToWork:
            normalized.personal?.openToWork ?? normalized.personal?.available ?? true,
          isVerified:
            normalized.personal?.isVerified ??
            Boolean(user?.isVerified || user?.freelancerProfile?.isVerified),
        };

        const loadedServiceDetailMap =
          loadedProfileDetails?.serviceDetails &&
            typeof loadedProfileDetails.serviceDetails === "object"
            ? loadedProfileDetails.serviceDetails
            : {};
        const loadedOnboardingPlatformLinks = collectOnboardingPlatformLinks(
          loadedServiceDetailMap
        );
        const loadedFallbackPortfolioLink =
          loadedOnboardingPlatformLinks.find((entry) =>
            isPortfolioLikeKey(entry.key)
          )?.url || "";
        const loadedFallbackLinkedinLink =
          loadedOnboardingPlatformLinks.find((entry) =>
            entry.key.includes("linkedin")
          )?.url || "";
        const loadedFallbackGithubLink =
          loadedOnboardingPlatformLinks.find((entry) =>
            entry.key.includes("github")
          )?.url || "";

        const loadedPortfolio = {
          portfolioUrl:
            normalizePresenceLink(normalized.portfolio?.portfolioUrl) ||
            normalizePresenceLink(loadedProfileDetails?.identity?.portfolioUrl) ||
            loadedFallbackPortfolioLink ||
            "",
          linkedinUrl:
            normalizePresenceLink(normalized.portfolio?.linkedinUrl) ||
            normalizePresenceLink(loadedProfileDetails?.identity?.linkedinUrl) ||
            loadedFallbackLinkedinLink ||
            "",
          githubUrl:
            normalizePresenceLink(normalized.portfolio?.githubUrl) ||
            loadedFallbackGithubLink ||
            "",
          resume: normalized.portfolio?.resume || normalized.resume || "",
        };

        const loadedSkillLevels =
          loadedProfileDetails?.skillLevels &&
            typeof loadedProfileDetails.skillLevels === "object" &&
            !Array.isArray(loadedProfileDetails.skillLevels)
            ? loadedProfileDetails.skillLevels
            : {};
        const explicitSkillKeys = new Set(
          Object.keys(loadedSkillLevels)
            .map((entry) => getSkillDedupKey(entry))
            .filter(Boolean)
        );
        const hasExplicitSkillList = Object.prototype.hasOwnProperty.call(
          loadedProfileDetails,
          "skills"
        );
        const loadedSkillSource = hasExplicitSkillList
          ? Array.isArray(loadedProfileDetails.skills)
            ? loadedProfileDetails.skills
            : []
          : explicitSkillKeys.size > 0
            ? (Array.isArray(normalized.skills) ? normalized.skills : []).filter(
              (entry) => {
                const skillName =
                  typeof entry === "string" ? entry : entry?.name;
                return explicitSkillKeys.has(getSkillDedupKey(skillName));
              }
            )
            : Array.isArray(normalized.skills)
              ? normalized.skills
              : [];
        const loadedSkills = toUniqueSkillObjects(
          loadedSkillSource,
          loadedSkillLevels
        );

        setPersonal(loadedPersonal);
        setPortfolio(loadedPortfolio);
        setPortfolioProjects(normalized.portfolioProjects || []);
        setProfileDetails(loadedProfileDetails);
        setSkills(loadedSkills);
        setWorkExperience(normalizeWorkExperienceEntries(normalized.workExperience));

        const loadedServices = Array.isArray(normalized.services)
          ? normalized.services
          : [];
        setServices(loadedServices);

        setInitialData({
          personal: loadedPersonal,
          portfolio: loadedPortfolio,
          skills: loadedSkills,
          workExperience: normalizeWorkExperienceEntries(normalized.workExperience),
          services: loadedServices,
          portfolioProjects: normalized.portfolioProjects || [],
          profileDetails: loadedProfileDetails,
        });
      } catch (error) {
        console.error("Unable to load profile", error);
        toast.error("Failed to load profile data");
        if (active) {
          const fallbackPersonal = {
            name: user?.fullName ?? user?.name ?? "",
            email: user?.email ?? "",
            phone: "",
            location: "",
            headline: "",
            bio: "",
            experienceYears: "",
            avatar: resolveAvatarUrl(user?.avatar, { allowBlob: true }) || "",
            coverImage: "",
            available: true,
            openToWork: true,
            isVerified: Boolean(user?.isVerified || user?.freelancerProfile?.isVerified),
          };
          const fallbackPortfolio = {
            portfolioUrl: "",
            linkedinUrl: "",
            githubUrl: "",
            resume: "",
          };

          setPersonal(fallbackPersonal);
          setPortfolio(fallbackPortfolio);
          setPortfolioProjects([]);
          setProfileDetails({});
          setSkills([]);
          setWorkExperience([]);
          setServices([]);
          setInitialData({
            personal: fallbackPersonal,
            portfolio: fallbackPortfolio,
            skills: [],
            workExperience: [],
            services: [],
            portfolioProjects: [],
            profileDetails: {},
          });
  
        }
      } finally {
        if (active) setProfileLoading(false);
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [user, authFetch]);


  // ----- Skills -----
  const saveSkillsImmediately = async (nextSkills, previousSkills) => {
    const saved = await saveSectionChanges(
      { skills: nextSkills },
      { suppressSuccessToast: true }
    );

    if (!saved) {
      setSkills(previousSkills);
    }

    return saved;
  };

  const addSkill = async () => {
    if (isSaving) return;

    const name = formatSkillLabel(skillForm.name);
    if (!name) return;
    if (isNoisySkillTag(name)) {
      toast.error("Please add a specific skill or technology.");
      return;
    }

    const nextKey = getSkillDedupKey(name);
    if (!nextKey) return;

    const previousSkills = Array.isArray(skills) ? skills : [];
    const exists = previousSkills.some((entry) => {
      const currentName =
        typeof entry === "string" ? entry : entry?.name;
      return getSkillDedupKey(currentName) === nextKey;
    });
    if (exists) {
      toast.info("That skill is already in your tech stack.");
      setSkillForm(createInitialSkillForm());
      setModalType(null);
      return;
    }

    const normalizedLevel = normalizeSkillLevel(skillForm.level);
    const nextSkills = [...previousSkills, { name, level: normalizedLevel }];
    setSkills(nextSkills);
    setSkillForm(createInitialSkillForm());
    setModalType(null);
    await saveSkillsImmediately(nextSkills, previousSkills);
  };

  const deleteSkill = async (skillToRemove) => {
    if (isSaving) return;

    const previousSkills = Array.isArray(skills) ? skills : [];
    const isIndexInput = Number.isInteger(skillToRemove);
    const indexedEntry = isIndexInput ? previousSkills[skillToRemove] : null;
    const targetName = formatSkillLabel(
      typeof skillToRemove === "string"
        ? skillToRemove
        : isIndexInput
          ? typeof indexedEntry === "string"
            ? indexedEntry
            : indexedEntry?.name
          : skillToRemove?.name
    );
    const targetKey = getSkillDedupKey(targetName);

    let nextSkills = previousSkills;

    if (targetKey) {
      nextSkills = previousSkills.filter((entry) => {
        const entryName = typeof entry === "string" ? entry : entry?.name;
        return getSkillDedupKey(entryName) !== targetKey;
      });
    } else if (isIndexInput) {
      nextSkills = previousSkills.filter((_, rowIndex) => rowIndex !== skillToRemove);
    }

    if (nextSkills.length === previousSkills.length) {
      return;
    }

    setSkills(nextSkills);
    await saveSkillsImmediately(nextSkills, previousSkills);
  };

  const setSkillLevel = async (index, level) => {
    if (isSaving) return;

    const normalizedLevel = normalizeSkillLevel(level);
    const previousSkills = Array.isArray(skills) ? skills : [];
    const nextSkills = previousSkills.map((entry, rowIndex) => {
      if (rowIndex !== index) return entry;

      if (typeof entry === "string") {
        return {
          name: formatSkillLabel(entry),
          level: normalizedLevel,
        };
      }

      return {
        ...(entry && typeof entry === "object" ? entry : {}),
        name: formatSkillLabel(entry?.name || ""),
        level: normalizedLevel,
      };
    });

    setSkills(nextSkills);
    await saveSkillsImmediately(nextSkills, previousSkills);
  };

  // ----- Work Experience (add + edit) -----
  const openCreateExperienceModal = () => {
    setEditingIndex(null);
    setWorkForm(initialWorkForm);
    setModalType("work");
  };

  const openEditExperienceModal = (item, index) => {
    const [position, company] = splitExperienceTitle(item.title);
    const [from, to] = splitExperiencePeriod(item.period);
    const parsedFrom = parseMonthYearParts(from);
    const parsedTo = parseMonthYearParts(to);
    const isCurrentRole = String(to || "")
      .trim()
      .toLowerCase() === "present";

    setWorkForm({
      company: company ?? "",
      position: position ?? "",
      from: from ?? "",
      to: to ?? "",
      startMonth: parsedFrom.month,
      startYear: parsedFrom.year,
      endMonth: parsedTo.month,
      endYear: parsedTo.year,
      isCurrentRole,
      location: item?.location ?? "",
      locationType: item?.locationType ?? "",
      employmentType: item?.employmentType ?? "",
      companyWebsite: item?.companyWebsite ?? item?.website ?? "",
      linkedinUrl: item?.linkedinUrl ?? item?.linkedin ?? "",
      description: item.description ?? "",
    });

    setEditingIndex(index);
    setModalType("work");
  };

  const saveExperience = async () => {
    const {
      company,
      position,
      startMonth,
      startYear,
      endMonth,
      endYear,
      isCurrentRole,
      location,
      locationType,
      employmentType,
      companyWebsite,
      linkedinUrl,
      description,
    } = workForm;

    if (!company.trim() || !position.trim() || !startMonth || !startYear) {
      toast.error("Please fill in Title, Company, and Start Date");
      return;
    }

    if (!isCurrentRole && (!endMonth || !endYear)) {
      toast.error("Please select an end month and year or mark current role.");
      return;
    }

    const fromDate = buildMonthYearLabel(startMonth, startYear);
    const toDate = isCurrentRole
      ? "Present"
      : buildMonthYearLabel(endMonth, endYear);

    const newItem = {
      title: `${position.trim()} - ${company.trim()}`,
      period: toDate ? `${fromDate} - ${toDate}` : fromDate,
      description: description.trim(),
      from: fromDate,
      to: toDate,
      location: String(location || "").trim(),
      locationType: String(locationType || "").trim(),
      employmentType: String(employmentType || "").trim(),
      companyWebsite: normalizePresenceLink(companyWebsite),
      linkedinUrl: normalizePresenceLink(linkedinUrl),
    };

    const nextWorkExperience =
      editingIndex !== null
        ? workExperience.map((item, idx) =>
            idx === editingIndex ? newItem : item
          )
        : [...workExperience, newItem];

    setWorkExperience(nextWorkExperience);
    const saved = await handleSave({
      personal,
      portfolio,
      skills,
      workExperience: nextWorkExperience,
      services,
      portfolioProjects,
      profileDetails,
    });

    if (saved) {
      setWorkForm(initialWorkForm);
      setEditingIndex(null);
      setModalType(null);
    }
  };

  const removeExperience = async (index) => {
    const previousWorkExperience = Array.isArray(workExperience)
      ? workExperience
      : [];
    const nextWorkExperience = previousWorkExperience.filter(
      (_, rowIndex) => rowIndex !== index
    );

    setWorkExperience(nextWorkExperience);

    const saved = await handleSave({
      personal,
      portfolio,
      skills,
      workExperience: nextWorkExperience,
      services,
      portfolioProjects,
      profileDetails,
    });

    if (!saved) {
      setWorkExperience(previousWorkExperience);
    }
  };

  const openPortfolioModal = () => {
    setModalType("portfolio");
  };

  const buildProfileSnapshot = (overrides = {}) => ({
    personal: overrides.personal ?? personal,
    portfolio: overrides.portfolio ?? portfolio,
    skills: overrides.skills ?? skills,
    workExperience: overrides.workExperience ?? workExperience,
    services: overrides.services ?? services,
    portfolioProjects: overrides.portfolioProjects ?? portfolioProjects,
    profileDetails: overrides.profileDetails ?? profileDetails,
  });

  // ----- Save to backend -----
  const handleSave = async (snapshot = null, options = {}) => {
    const {
      avatarFileOverride = null,
      coverFileOverride = null,
      suppressSuccessToast = false,
    } = options || {};
    const currentPersonal = snapshot?.personal ?? personal;
    const currentPortfolio = snapshot?.portfolio ?? portfolio;
    const currentSkills = snapshot?.skills ?? skills;
    const currentWorkExperience = snapshot?.workExperience ?? workExperience;
    const currentServices = snapshot?.services ?? services;
    const currentPortfolioProjects =
      snapshot?.portfolioProjects ?? portfolioProjects;
    const currentProfileDetails = snapshot?.profileDetails ?? profileDetails;

    if (!currentPersonal.email) {
      toast.error("Cannot save profile", {
        description: "Missing email on your profile.",
      });
      return false;
    }

    setIsSaving(true);

    const skillsForApi = toUniqueSkillNames(currentSkills);
    const skillLevelsForApi = buildSkillLevelsByKey(currentSkills);
    let currentAvatarUrl = resolveAvatarUrl(currentPersonal.avatar);
    let currentCoverUrl = resolveAvatarUrl(currentPersonal.coverImage);
    const avatarFileToUpload = avatarFileOverride || selectedFile;
    const coverFileToUpload = coverFileOverride || selectedCoverFile;

    const uploadToR2 = async (file, endpoint, fallbackMessage) => {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const uploadRes = await authFetch(endpoint, {
        method: "POST",
        body: uploadData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes
          .json()
          .catch(() => ({ message: fallbackMessage }));
        throw new Error(err?.message || fallbackMessage);
      }

      const data = await uploadRes.json();
      const uploadedUrl = String(data?.data?.url || "").trim();
      if (!uploadedUrl) {
        throw new Error(`${fallbackMessage} (no URL returned)`);
      }
      return uploadedUrl;
    };

    if (avatarFileToUpload || coverFileToUpload) {
      setUploadingImage(Boolean(avatarFileToUpload));
      setUploadingCoverImage(Boolean(coverFileToUpload));
      try {
        const [nextAvatarUrl, nextCoverUrl] = await Promise.all([
          avatarFileToUpload
            ? uploadToR2(
              avatarFileToUpload,
              "/upload",
              "Failed to upload profile image"
            )
            : Promise.resolve(currentAvatarUrl),
          coverFileToUpload
            ? uploadToR2(
              coverFileToUpload,
              "/upload/profile-cover",
              "Failed to upload profile cover image"
            )
            : Promise.resolve(currentCoverUrl),
        ]);

        currentAvatarUrl = nextAvatarUrl;
        currentCoverUrl = nextCoverUrl;
      } catch (uploadErr) {
        setIsSaving(false);
        setUploadingImage(false);
        setUploadingCoverImage(false);
        console.error("Image upload failed inside save:", uploadErr);
        toast.error(uploadErr?.message || "Failed to upload image. Profile not saved.");
        return false;
      } finally {
        setUploadingImage(false);
        setUploadingCoverImage(false);
      }
    }

    const bioText = normalizeBioValue(currentPersonal.bio);
    const existingProfileDetails =
      currentProfileDetails && typeof currentProfileDetails === "object"
        ? currentProfileDetails
        : {};
    const existingIdentity =
      existingProfileDetails.identity &&
        typeof existingProfileDetails.identity === "object"
        ? existingProfileDetails.identity
        : {};
    const nextIdentityLocation = parseLocationInput(currentPersonal.location);

    const profileDetailsForSave = {
      ...existingProfileDetails,
      professionalBio: bioText,
      skills: skillsForApi,
      skillLevels: skillLevelsForApi,
      identity: {
        ...existingIdentity,
        city: nextIdentityLocation.city,
        country: nextIdentityLocation.country,
        professionalTitle: String(currentPersonal.headline || "").trim(),
        username: String(existingIdentity.username || "").trim(),
        portfolioUrl: String(currentPortfolio.portfolioUrl || "").trim(),
        linkedinUrl: String(currentPortfolio.linkedinUrl || "").trim(),
        githubUrl: String(currentPortfolio.githubUrl || "").trim(),
        profilePhoto: currentAvatarUrl || "",
        coverImage: currentCoverUrl || "",
      },
    };

    const payload = {
      personal: {
        name: currentPersonal.name,
        email: currentPersonal.email,
        phone: currentPersonal.phone,
        location: currentPersonal.location,
        headline: currentPersonal.headline,
        bio: bioText,
        experienceYears: currentPersonal.experienceYears,
        available: currentPersonal.available,
        ...(currentPersonal.openToWork !== undefined
          ? { openToWork: currentPersonal.openToWork }
          : {}),
        avatar: currentAvatarUrl,
        coverImage: currentCoverUrl,
      },
      bio: bioText,
      skills: skillsForApi,
      workExperience: currentWorkExperience,
      services: currentServices,
      portfolio: currentPortfolio,
      resume: currentPortfolio.resume,
      portfolioProjects: currentPortfolioProjects,
      profileDetails: profileDetailsForSave,
    };

    try {
      const response = await authFetch("/profile", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorPayload = await response
          .json()
          .catch(() => ({ message: `Request failed with status ${response.status}` }));
        toast.error("Save failed", {
          description:
            errorPayload?.message ||
            errorPayload?.error ||
            `Request failed with status ${response.status}.`,
        });
        return false;
      }

      if (!suppressSuccessToast) {
        toast.success("Profile saved", {
          description: "Your profile has been updated successfully.",
        });
      }

      const newPersonal = {
        ...currentPersonal,
        avatar: currentAvatarUrl,
        coverImage: currentCoverUrl,
      };
      setPersonal(newPersonal);
      setPortfolio(currentPortfolio);
      setSkills(currentSkills);
      setWorkExperience(currentWorkExperience);
      setServices(currentServices);
      setPortfolioProjects(currentPortfolioProjects);
      setProfileDetails(profileDetailsForSave);

      setInitialData({
        personal: newPersonal,
        portfolio: currentPortfolio,
        skills: currentSkills,
        workExperience: currentWorkExperience,
        services: currentServices,
        portfolioProjects: currentPortfolioProjects,
        profileDetails: profileDetailsForSave,
      });

      setSelectedFile(null);
      setSelectedCoverFile(null);
      return true;
    } catch (error) {
      console.error("Save failed", error);
      toast.error("Save failed", {
        description:
          error?.message || "Something went wrong. Check console for details.",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const saveSectionChanges = async (overrides = {}, options = {}) =>
    handleSave(
      {
        personal,
        portfolio,
        skills,
        workExperience,
        services,
        portfolioProjects,
        profileDetails,
        ...overrides,
      },
      options
    );

  const saveProjectsSection = async () => {
    await saveSectionChanges();
  };

  const savePersonalSection = async () => {
    const saved = await saveSectionChanges();
    if (saved) {
      setModalType(null);
    }
  };

  const savePortfolioSection = async () => {
    const saved = await saveSectionChanges();
    if (saved) {
      setModalType(null);
    }
  };

  const handleAvailabilityToggle = async () => {
    if (isAvailabilitySaving || isSaving || profileLoading) return;

    const previousAvailable = Boolean(personal.available);
    const previousOpenToWork =
      typeof personal.openToWork === "boolean"
        ? personal.openToWork
        : previousAvailable;
    const nextOpenToWork = !previousOpenToWork;
    const nextPersonal = {
      ...personal,
      available: nextOpenToWork,
      openToWork: nextOpenToWork,
    };

    setPersonal((prev) => ({
      ...prev,
      available: nextOpenToWork,
      openToWork: nextOpenToWork,
    }));
    setIsAvailabilitySaving(true);

    const saved = await handleSave(buildProfileSnapshot({ personal: nextPersonal }), {
      suppressSuccessToast: true,
    });

    if (!saved) {
      setPersonal((prev) => ({
        ...prev,
        available: previousAvailable,
        openToWork: previousOpenToWork,
      }));
      setIsAvailabilitySaving(false);
      return;
    }

    toast.success(
      `Profile set to ${nextOpenToWork ? "Open to Work" : "Offline"}`,
    );
    setIsAvailabilitySaving(false);
  };

  // ----- Personal Details Edit (Name, Headline, Phone, Location) -----
  const openEditPersonalModal = (section = PERSONAL_EDITOR_SECTIONS.ALL) => {
    setPersonalEditorSection(section);
    setModalType("personal");
  };

  const handlePersonalChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPersonal((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const updateProfileIdentityFields = useCallback((updates = {}) => {
    setProfileDetails((prev) => {
      const current =
        prev && typeof prev === "object" && !Array.isArray(prev) ? prev : {};
      const currentIdentity =
        current.identity &&
          typeof current.identity === "object" &&
          !Array.isArray(current.identity)
          ? current.identity
          : {};

      return {
        ...current,
        identity: {
          ...currentIdentity,
          ...updates,
        },
      };
    });
  }, []);

  const handlePersonalUsernameChange = useCallback((event) => {
    const rawValue = String(event.target.value || "");
    const normalizedUsername = rawValue
      .replace(/^@+/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 30);

    updateProfileIdentityFields({ username: normalizedUsername });
  }, [updateProfileIdentityFields]);

  const handlePersonalLanguagesChange = useCallback((event) => {
    const normalizedLanguages = toUniqueLabels(
      parseDelimitedValues(event.target.value)
    ).filter((entry) => String(entry || "").trim().toLowerCase() !== "other");

    updateProfileIdentityFields({ languages: normalizedLanguages });
  }, [updateProfileIdentityFields]);

  const handlePersonalOtherLanguageChange = useCallback((event) => {
    updateProfileIdentityFields({
      otherLanguage: String(event.target.value || ""),
    });
  }, [updateProfileIdentityFields]);

  const closeProfileCropDialog = useCallback(() => {
    setIsProfileCropOpen(false);
    setPendingProfilePhotoFile(null);
  }, []);

  const handleProfilePhotoSelect = (file) => {
    if (!(typeof File !== "undefined" && file instanceof File)) {
      return;
    }

    if (!String(file.type || "").startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    if (file.size > PROFILE_PHOTO_PICK_MAX_BYTES) {
      toast.error(
        `Selected image is ${formatFileSize(file.size)}. Please choose an image under ${formatFileSize(
          PROFILE_PHOTO_PICK_MAX_BYTES
        )} before cropping.`
      );
      return;
    }

    setPendingProfilePhotoFile(file);
    setIsProfileCropOpen(true);
  };

  const handleProfilePhotoCropped = async (croppedFile) => {
    if (!(typeof File !== "undefined" && croppedFile instanceof File)) {
      toast.error("Unable to process profile image.");
      return false;
    }

    if (croppedFile.size > AVATAR_UPLOAD_MAX_BYTES) {
      toast.error(
        `Cropped image is ${formatFileSize(croppedFile.size)}. Please crop tighter and try again.`
      );
      return false;
    }

    const objectUrl = URL.createObjectURL(croppedFile);
    const nextPersonal = {
      ...personal,
      avatar: objectUrl,
    };

    setPersonal((prev) => {
      if (prev.avatar && prev.avatar.startsWith("blob:")) {
        URL.revokeObjectURL(prev.avatar);
      }
      return {
        ...prev,
        avatar: objectUrl,
      };
    });

    const saved = await handleSave(buildProfileSnapshot({ personal: nextPersonal }), {
      avatarFileOverride: croppedFile,
      suppressSuccessToast: true,
    });

    if (!saved) {
      return false;
    }

    closeProfileCropDialog();
    toast.success("Profile image updated");
    return true;
  };

  // ----- Image Upload Logic -----
  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    handleProfilePhotoSelect(file);
  };

  const handleCoverImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Cover image must be less than 8MB");
      return;
    }

    setSelectedCoverFile(file);
    const objectUrl = URL.createObjectURL(file);
    const nextPersonal = {
      ...personal,
      coverImage: objectUrl,
    };
    setPersonal((prev) => {
      if (prev.coverImage && prev.coverImage.startsWith("blob:")) {
        URL.revokeObjectURL(prev.coverImage);
      }
      return {
        ...prev,
        coverImage: objectUrl,
      };
    });

    // Persist cover immediately so refresh keeps the latest image.
    void handleSave(buildProfileSnapshot({ personal: nextPersonal }), {
      coverFileOverride: file,
      suppressSuccessToast: true,
    }).then((saved) => {
      if (saved) {
        toast.success("Profile cover updated");
      }
    });
  };

  const handleResumeUpload = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;

      const allowedMimeTypes = new Set([
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]);
      const allowedExtensions = [".pdf", ".doc", ".docx"];
      const fileName = String(file.name || "").toLowerCase();
      const hasAllowedExtension = allowedExtensions.some((ext) =>
        fileName.endsWith(ext)
      );

      if (!allowedMimeTypes.has(file.type) && !hasAllowedExtension) {
        toast.error("Only PDF, DOC, and DOCX files are allowed");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Resume must be less than 5MB");
        return;
      }

      setUploadingResume(true);
      try {
        const uploadData = new FormData();
        uploadData.append("file", file);

        const response = await authFetch("/upload/resume", {
          method: "POST",
          body: uploadData,
        });

        if (!response.ok) {
          const payload = await response
            .json()
            .catch(() => ({ message: "Failed to upload resume" }));
          throw new Error(payload?.message || "Failed to upload resume");
        }

        const payload = await response.json();
        const resumeUrl = String(payload?.data?.url || "").trim();
        if (!resumeUrl) {
          throw new Error("Resume upload failed: missing URL");
        }

        setPortfolio((prev) => ({ ...prev, resume: resumeUrl }));
        setInitialData((prev) =>
          prev
            ? {
                ...prev,
                portfolio: {
                  ...(prev.portfolio || {}),
                  resume: resumeUrl,
                },
              }
            : prev
        );
        toast.success("Resume uploaded");
      } catch (error) {
        console.error("Resume upload failed:", error);
        toast.error(error?.message || "Failed to upload resume");
      } finally {
        setUploadingResume(false);
      }
    },
    [authFetch]
  );

  const removeCoverImage = async () => {
    const currentCoverImage = String(personal.coverImage || "").trim();
    const hasIdentityCoverImage = Boolean(
      String(profileDetails?.identity?.coverImage || "").trim()
    );

    if (!currentCoverImage && !hasIdentityCoverImage && !selectedCoverFile) {
      return;
    }

    if (currentCoverImage.startsWith("blob:")) {
      URL.revokeObjectURL(currentCoverImage);
    }

    const nextPersonal = {
      ...personal,
      coverImage: "",
    };
    const nextProfileDetails = {
      ...(profileDetails && typeof profileDetails === "object"
        ? profileDetails
        : {}),
      identity: {
        ...((profileDetails?.identity && typeof profileDetails.identity === "object")
          ? profileDetails.identity
          : {}),
        coverImage: "",
      },
    };

    setSelectedCoverFile(null);
    setPersonal(nextPersonal);
    setProfileDetails(nextProfileDetails);

    const saved = await handleSave(
      buildProfileSnapshot({
        personal: nextPersonal,
        profileDetails: nextProfileDetails,
      }),
      { suppressSuccessToast: true }
    );

    if (saved) {
      toast.success("Profile cover removed");
      return;
    }

    setPersonal(personal);
    setProfileDetails(profileDetails);
  };

  // ----- Add Custom Service -----
  const [serviceForm, setServiceForm] = useState(createInitialServiceForm);

  const openEditServiceProfileModal = useCallback((serviceKey) => {
    const serviceDetails =
      profileDetails?.serviceDetails &&
        typeof profileDetails.serviceDetails === "object"
        ? profileDetails.serviceDetails
        : {};
    const detail =
      serviceDetails?.[serviceKey] && typeof serviceDetails[serviceKey] === "object"
        ? serviceDetails[serviceKey]
        : {};
    const existingSkillsAndTechnologies = normalizeServiceSkillTags([
      ...(Array.isArray(detail?.skillsAndTechnologies)
        ? detail.skillsAndTechnologies
        : []),
      ...collectServiceSpecializations(detail),
      ...(Array.isArray(detail?.caseStudy?.techStack)
        ? detail.caseStudy.techStack
        : []),
    ]);

    setServiceProfileForm({
      serviceKey,
      serviceLabel: getServiceLabel(serviceKey),
      experienceYears: String(detail?.experienceYears || "").trim(),
      serviceDescription: String(
        detail?.serviceDescription || detail?.description || ""
      ).trim(),
      coverImage: resolveAvatarUrl(detail?.coverImage, { allowBlob: true }),
      averageProjectPrice: String(
        detail?.averageProjectPrice || detail?.averagePrice || ""
      ).trim(),
      deliveryTime: String(
        detail?.deliveryTime || detail?.deliveryDays || detail?.caseStudy?.timeline || ""
      ).trim(),

      skillsAndTechnologies: existingSkillsAndTechnologies,
    });
    setServiceSkillInput("");
    setModalType("onboardingService");
  }, [profileDetails]);

  const addServiceSkillTag = useCallback((rawValue) => {
    const parsedValues =
      typeof rawValue === "string" ? parseDelimitedValues(rawValue) : rawValue;
    const nextValues = normalizeServiceSkillTags(parsedValues);

    if (!nextValues.length) {
      return false;
    }

    setServiceProfileForm((prev) => ({
      ...prev,
      skillsAndTechnologies: normalizeServiceSkillTags([
        ...(Array.isArray(prev.skillsAndTechnologies)
          ? prev.skillsAndTechnologies
          : []),
        ...nextValues,
      ]),
    }));
    setServiceSkillInput("");
    return true;
  }, []);

  const removeServiceSkillTag = useCallback((tagToRemove) => {
    const tagKey = getSkillDedupKey(tagToRemove);
    setServiceProfileForm((prev) => ({
      ...prev,
      skillsAndTechnologies: (Array.isArray(prev.skillsAndTechnologies)
        ? prev.skillsAndTechnologies
        : []
      ).filter((entry) => getSkillDedupKey(entry) !== tagKey),
    }));
  }, []);

  const handleServiceCoverImageChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Cover image must be less than 8MB");
      return;
    }

    setUploadingServiceCover(true);
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const uploadResponse = await authFetch("/upload/project-image", {
        method: "POST",
        body: uploadData,
      });

      if (!uploadResponse.ok) {
        const errPayload = await uploadResponse
          .json()
          .catch(() => ({ message: "Failed to upload cover image" }));
        throw new Error(errPayload?.message || "Failed to upload cover image");
      }

      const uploadPayload = await uploadResponse.json();
      const uploadedUrl = String(uploadPayload?.data?.url || "").trim();
      if (!uploadedUrl) {
        throw new Error("Upload succeeded but no image URL was returned");
      }

      setServiceProfileForm((prev) => ({
        ...prev,
        coverImage: uploadedUrl,
      }));
      toast.success("Service cover image uploaded");
    } catch (error) {
      console.error("Service cover upload failed:", error);
      toast.error(error?.message || "Failed to upload service cover image");
    } finally {
      setUploadingServiceCover(false);
    }
  };

  const saveOnboardingServiceProfile = async () => {
    const serviceKey = String(serviceProfileForm.serviceKey || "").trim();
    if (!serviceKey) return;
    if (!String(serviceProfileForm.deliveryTime || "").trim()) {
      toast.error("Please select a delivery timeline for this service.");
      return;
    }

    const existingServiceDetails =
      profileDetails?.serviceDetails &&
        typeof profileDetails.serviceDetails === "object"
        ? profileDetails.serviceDetails
        : {};
    const currentServiceDetail =
      existingServiceDetails?.[serviceKey] &&
        typeof existingServiceDetails[serviceKey] === "object"
        ? existingServiceDetails[serviceKey]
        : {};
    const serviceAlreadyExists = Array.from(
      new Set([
        ...(Array.isArray(services) ? services : []),
        ...(Array.isArray(profileDetails?.services) ? profileDetails.services : []),
        ...Object.keys(existingServiceDetails),
      ])
    ).some(
      (existingServiceKey) =>
        normalizeServiceIdentity(existingServiceKey) ===
        normalizeServiceIdentity(serviceKey)
    );
    const nextServiceSkillTags = normalizeServiceSkillTags([
      ...(Array.isArray(serviceProfileForm.skillsAndTechnologies)
        ? serviceProfileForm.skillsAndTechnologies
        : []),
      ...parseDelimitedValues(serviceSkillInput),
    ]);

    const nextServiceDetails = {
      ...existingServiceDetails,
      [serviceKey]: {
        ...createServiceDetail(),
        ...currentServiceDetail,
        experienceYears: String(serviceProfileForm.experienceYears || "").trim(),
        serviceDescription: String(
          serviceProfileForm.serviceDescription || ""
        ).trim(),
        coverImage: String(serviceProfileForm.coverImage || "").trim(),
        averageProjectPrice: String(
          serviceProfileForm.averageProjectPrice || ""
        ).trim(),
        averagePrice: String(serviceProfileForm.averageProjectPrice || "").trim(),
        deliveryTime: String(serviceProfileForm.deliveryTime || "").trim(),

        skillsAndTechnologies: nextServiceSkillTags,
      },
    };

    const nextServices = Array.from(
      new Set([
        ...(Array.isArray(services) ? services : []),
        ...(Array.isArray(profileDetails?.services) ? profileDetails.services : []),
        ...Object.keys(nextServiceDetails),
      ])
    )
      .map((entry) => String(entry || "").trim())
      .filter(Boolean);

    const nextProfileDetails = {
      ...(profileDetails && typeof profileDetails === "object"
        ? profileDetails
        : {}),
      serviceDetails: nextServiceDetails,
      services: nextServices,
    };

    setSavingServiceProfile(true);
    try {
      const saved = await handleSave(
        buildProfileSnapshot({
          services: nextServices,
          profileDetails: nextProfileDetails,
        }),
        { suppressSuccessToast: true }
      );

      if (!saved) {
        throw new Error("Failed to save service details");
      }

      toast.success(
        `${getServiceLabel(serviceKey)} ${
          serviceAlreadyExists ? "updated" : "added"
        }`
      );
      setServiceSkillInput("");
      setModalType(null);
    } catch (error) {
      console.error("Failed to save onboarding service profile:", error);
      toast.error(error?.message || "Failed to save service details");
    } finally {
      setSavingServiceProfile(false);
    }
  };

  // ----- Portfolio Projects Logic -----
  const resetProjectDraft = () => {
    setNewProjectUrl("");
    setNewProjectTitle("");
    setNewProjectDescription("");
    setNewProjectServiceKeys([]);
    setNewProjectImageFile(null);
    setIsProjectCoverDragActive(false);
    setEditingProjectIndex(null);
    setNewProjectImagePreview((prev) => {
      if (prev && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return "";
    });
    setNewProjectLoading(false);
  };

  const openAddProjectModal = () => {
    resetProjectDraft();
    setModalType("addProject");
  };

  const openEditProject = (project, index) => {
    resetProjectDraft();
    setEditingProjectIndex(index);
    setNewProjectUrl(String(project?.link || "").trim());
    setNewProjectTitle(String(project?.title || "").trim());
    setNewProjectDescription(String(project?.description || "").trim());
    setNewProjectServiceKeys(resolveProjectServiceKeys(project));
    setNewProjectImagePreview(resolveAvatarUrl(project?.image, { allowBlob: true }) || "");
    setModalType("addProject");
  };

  const toggleProjectServiceSelection = (serviceKey) => {
    const resolvedServiceKey = String(serviceKey || "").trim();
    if (!resolvedServiceKey) return;

    setNewProjectServiceKeys((prev) => {
      const currentValues = normalizeProjectServiceKeys(prev);
      const normalizedTarget = normalizeServiceIdentity(resolvedServiceKey);
      const exists = currentValues.some(
        (entry) => normalizeServiceIdentity(entry) === normalizedTarget
      );

      if (exists) {
        return currentValues.filter(
          (entry) => normalizeServiceIdentity(entry) !== normalizedTarget
        );
      }

      return [...currentValues, resolvedServiceKey];
    });
  };

  const getProjectTitleFallback = (projectUrl = "") => {
    const normalizedUrl = normalizeProjectLinkValue(projectUrl);
    if (!normalizedUrl) return "Project";

    try {
      const parsed = new URL(normalizedUrl);
      return parsed.hostname.replace(/^www\./i, "") || "Project";
    } catch {
      return (
        normalizedUrl
          .replace(/^https?:\/\//i, "")
          .split("/")[0]
          .trim() || "Project"
      );
    }
  };

  const fetchProjectPreview = useCallback(
    async (projectUrl) => {
      const normalizedUrl = normalizeProjectLinkValue(projectUrl);
      if (!normalizedUrl) return null;

      try {
        const previewResponse = await authFetch("/upload/project-preview", {
          method: "POST",
          body: JSON.stringify({ url: normalizedUrl }),
          suppressToast: true,
        });

        if (!previewResponse.ok) return null;

        const payload = await previewResponse.json().catch(() => null);
        if (!payload?.success || !payload?.data) return null;

        return {
          url: payload.data.url || normalizedUrl,
          title: payload.data.title || "",
          image: payload.data.image || null,
          description: String(payload.data.description || "").trim(),
        };
      } catch (error) {
        console.warn("Project metadata fetch failed:", error);
        return null;
      }
    },
    [authFetch]
  );

  useEffect(() => {
    if (!user?.id || !portfolioProjects.length) return;

    const candidateLinks = Array.from(
      new Set(
        portfolioProjects
          .map((project) => {
            const normalizedLink = normalizeProjectLinkValue(project?.link);
            const hasCoverImage = Boolean(
              resolveAvatarUrl(project?.image, { allowBlob: true })
            );
            const hasDescription = Boolean(
              String(project?.description || "").trim()
            );
            if (!normalizedLink || (hasCoverImage && hasDescription)) return "";
            return normalizedLink;
          })
          .filter(Boolean)
      )
    ).filter(
      (link) => !projectPreviewAttemptRef.current.has(link.toLowerCase())
    );

    if (!candidateLinks.length) return;

    candidateLinks.forEach((link) =>
      projectPreviewAttemptRef.current.add(link.toLowerCase())
    );

    let cancelled = false;

    const backfillProjectPreviewImages = async () => {
      const previewEntries = await Promise.all(
        candidateLinks.map(async (link) => ({
          link,
          preview: await fetchProjectPreview(link),
        }))
      );

      if (cancelled) return;

      const updatesByLink = new Map(
        previewEntries
          .filter(
            ({ preview }) =>
              preview && (preview.image || preview.title || preview.description)
          )
          .map(({ link, preview }) => [link.toLowerCase(), preview])
      );

      if (!updatesByLink.size) return;

      setPortfolioProjects((prev) => {
        let hasChanges = false;

        const nextProjects = prev.map((project) => {
          const normalizedLink = normalizeProjectLinkValue(project?.link);
          if (!normalizedLink) return project;

          const preview = updatesByLink.get(normalizedLink.toLowerCase());
          if (!preview) return project;

          const currentImage = resolveAvatarUrl(project?.image, {
            allowBlob: true,
          });
          const currentTitle = String(project?.title || "").trim();
          const currentDescription = String(project?.description || "").trim();
          const nextImage = currentImage || String(preview.image || "").trim();
          const nextTitle = currentTitle || String(preview.title || "").trim();
          const nextDescription =
            currentDescription || String(preview.description || "").trim();

          if (
            nextImage === currentImage &&
            nextTitle === currentTitle &&
            nextDescription === currentDescription
          ) {
            return project;
          }

          hasChanges = true;
          return {
            ...project,
            image: nextImage || null,
            title: nextTitle || project?.title || "",
            description: nextDescription || "",
          };
        });

        return hasChanges ? nextProjects : prev;
      });
    };

    void backfillProjectPreviewImages();

    return () => {
      cancelled = true;
    };
  }, [portfolioProjects, user?.id, fetchProjectPreview]);

  const uploadProjectCoverImage = async (index, file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Project image must be less than 8MB");
      return;
    }

    setProjectCoverUploadingIndex(index);
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const uploadResponse = await authFetch("/upload/project-image", {
        method: "POST",
        body: uploadData,
      });

      if (!uploadResponse.ok) {
        const errPayload = await uploadResponse
          .json()
          .catch(() => ({ message: "Failed to upload project image" }));
        throw new Error(errPayload?.message || "Failed to upload project image");
      }

      const uploadPayload = await uploadResponse.json();
      const uploadedUrl = String(uploadPayload?.data?.url || "").trim();
      if (!uploadedUrl) {
        throw new Error("Invalid project image response");
      }

      setPortfolioProjects((prev) =>
        prev.map((project, projectIndex) =>
          projectIndex === index ? { ...project, image: uploadedUrl } : project
        )
      );
      toast.success("Project cover updated");
    } catch (error) {
      console.error("Project cover upload failed:", error);
      toast.error("Failed to upload project cover image");
    } finally {
      setProjectCoverUploadingIndex(null);
    }
  };

  const handleProjectCoverInputChange = (index, event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    uploadProjectCoverImage(index, file);
  };

  const handleNewProjectImageFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Project image must be less than 8MB");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setIsProjectCoverDragActive(false);
    setNewProjectImageFile(file);
    setNewProjectImagePreview((prev) => {
      if (prev && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return objectUrl;
    });
  };

  const handleNewProjectImageChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    handleNewProjectImageFile(file);
  };

  const handleNewProjectImageDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    setIsProjectCoverDragActive(false);
    if (!file) return;
    handleNewProjectImageFile(file);
  };

  const clearNewProjectImageDraft = () => {
    setIsProjectCoverDragActive(false);
    setNewProjectImageFile(null);
    setNewProjectImagePreview((prev) => {
      if (prev && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return "";
    });
  };

  const handleUrlBlur = async () => {
    const rawUrl = String(newProjectUrl || "").trim();
    if (!rawUrl) return;

    const normalizedUrl = normalizeProjectLinkValue(rawUrl);
    if (!normalizedUrl) {
      toast.error("Enter a valid project URL");
      return;
    }

    setNewProjectLoading(true);

    try {
      const previewData = await fetchProjectPreview(normalizedUrl);
      const resolvedUrl = normalizeProjectLinkValue(previewData?.url || normalizedUrl);
      const resolvedTitle = String(previewData?.title || "").trim();
      const resolvedDescription = String(previewData?.description || "").trim();
      const resolvedImage = resolveAvatarUrl(previewData?.image, {
        allowBlob: true,
      });

      setNewProjectUrl(resolvedUrl);
      setNewProjectTitle((prev) => {
        if (String(prev || "").trim()) return prev;
        return resolvedTitle || getProjectTitleFallback(resolvedUrl);
      });
      setNewProjectDescription((prev) => {
        if (String(prev || "").trim()) return prev;
        return resolvedDescription;
      });
      if (
        !newProjectImageFile &&
        !String(newProjectImagePreview || "").trim() &&
        resolvedImage
      ) {
        setNewProjectImagePreview(resolvedImage);
      }
    } catch (error) {
      console.warn("Project metadata fetch failed:", error);
    } finally {
      setNewProjectLoading(false);
    }
  };

  const handleAddProject = async () => {
    const isEditingProject = editingProjectIndex !== null;
    const currentProjects = Array.isArray(portfolioProjects) ? portfolioProjects : [];
    const rawUrl = String(newProjectUrl || "").trim();
    if (!rawUrl) {
      toast.error("Project URL is required");
      return;
    }

    let normalizedUrl = normalizeProjectLinkValue(rawUrl);
    if (!normalizedUrl) {
      toast.error("Enter a valid project URL");
      return;
    }

    const normalizedUrlKey = normalizedUrl.toLowerCase();
    const hasDuplicate = currentProjects.some(
      (project, index) =>
        index !== editingProjectIndex &&
        normalizeProjectLinkValue(project?.link).toLowerCase() === normalizedUrlKey
    );
    if (hasDuplicate) {
      toast.error("Project already added");
      return;
    }

    setNewProjectLoading(true);
    try {
      const previewData = await fetchProjectPreview(normalizedUrl);
      normalizedUrl = normalizeProjectLinkValue(previewData?.url || normalizedUrl);

      let projectImage = resolveAvatarUrl(newProjectImagePreview, {
        allowBlob: true,
      });
      if (newProjectImageFile) {
        const uploadData = new FormData();
        uploadData.append("file", newProjectImageFile);

        const uploadResponse = await authFetch("/upload/project-image", {
          method: "POST",
          body: uploadData,
        });

        if (!uploadResponse.ok) {
          const errPayload = await uploadResponse
            .json()
            .catch(() => ({ message: "Failed to upload project image" }));
          throw new Error(errPayload?.message || "Failed to upload project image");
        }

        const uploadPayload = await uploadResponse.json();
        const uploadedUrl = String(uploadPayload?.data?.url || "").trim();
        if (!uploadedUrl) {
          throw new Error("Invalid project image response");
        }
        projectImage = uploadedUrl;
      } else if (!projectImage) {
        projectImage = resolveAvatarUrl(previewData?.image, { allowBlob: true });
      }

      const finalTitle =
        String(newProjectTitle || previewData?.title || "").trim() ||
        getProjectTitleFallback(normalizedUrl);
      const finalDescription = String(
        newProjectDescription || previewData?.description || ""
      ).trim();

      const normalizedProjectServiceKeys = normalizeProjectServiceKeys(
        newProjectServiceKeys
      );
      const nextProject = {
        ...(isEditingProject ? currentProjects[editingProjectIndex] || {} : {}),
        link: normalizedUrl,
        image: projectImage || null,
        title: finalTitle,
        description: finalDescription,
        serviceKeys: normalizedProjectServiceKeys,
        serviceKey: normalizedProjectServiceKeys[0] || "",
      };
      const nextProjects = isEditingProject
        ? currentProjects.map((project, index) =>
          index === editingProjectIndex ? nextProject : project
        )
        : [...currentProjects, nextProject];
      const successMessage = isEditingProject ? "Project updated" : "Project added";

      const saved = await saveSectionChanges({
        portfolioProjects: nextProjects,
      });

      if (saved) {
        toast.success(successMessage);
        resetProjectDraft();
        setModalType(null);
        return;
      }

      setPortfolioProjects(nextProjects);
      toast.error(`${successMessage} locally. Click Save changes to persist.`);
    } catch (error) {
      console.error("Failed to save project:", error);
      toast.error(error?.message || "Failed to save project");
    } finally {
      setNewProjectLoading(false);
    }
  };

  const removeProject = (index) => {
    setPortfolioProjects((prev) => prev.filter((_, i) => i !== index));
  };

  const openFullProfileEditor = (section = FULL_PROFILE_EDITOR_SECTIONS.ALL) => {
    const currentDetails =
      profileDetails && typeof profileDetails === "object" ? profileDetails : {};
    const identity =
      currentDetails.identity && typeof currentDetails.identity === "object"
        ? currentDetails.identity
        : {};
    const availability =
      currentDetails.availability &&
        typeof currentDetails.availability === "object"
        ? currentDetails.availability
        : {};
    const reliability =
      currentDetails.reliability && typeof currentDetails.reliability === "object"
        ? currentDetails.reliability
        : {};

    if (section === FULL_PROFILE_EDITOR_SECTIONS.EDUCATION) {
      setFullProfileForm((prev) => ({
        ...prev,
        education: collectEducationEntriesFromProfileDetails(currentDetails),
      }));
      setFullProfileEditorSection(section);
      setModalType("education");
      return;
    }

    setFullProfileForm({
      professionalTitle: String(
        identity.professionalTitle || personal.headline || ""
      ).trim(),
      username: String(identity.username || "").trim(),
      country: String(identity.country || "").trim(),
      city: String(identity.city || "").trim(),
      languages: (Array.isArray(identity.languages) ? identity.languages : [])
        .map((entry) => String(entry || "").trim())
        .filter(Boolean)
        .join(", "),
      otherLanguage: String(identity.otherLanguage || "").trim(),
      role: String(currentDetails.role || "").trim(),
      globalIndustryFocus: (
        Array.isArray(currentDetails.globalIndustryFocus)
          ? currentDetails.globalIndustryFocus
          : []
      )
        .map((entry) => String(entry || "").trim())
        .filter(Boolean)
        .join(", "),
      globalIndustryOther: String(currentDetails.globalIndustryOther || "").trim(),
      hoursPerWeek: String(availability.hoursPerWeek || "").trim(),
      workingSchedule: String(availability.workingSchedule || "").trim(),
      startTimeline: String(availability.startTimeline || "").trim(),
      missedDeadlines: String(reliability.missedDeadlines || "").trim(),
      delayHandling: String(reliability.delayHandling || "").trim(),
      deliveryPolicyAccepted: Boolean(currentDetails.deliveryPolicyAccepted),
      communicationPolicyAccepted: Boolean(
        currentDetails.communicationPolicyAccepted
      ),
      acceptInProgressProjects:
        typeof currentDetails.acceptInProgressProjects === "boolean"
          ? currentDetails.acceptInProgressProjects
            ? "yes"
            : "no"
          : String(currentDetails.acceptInProgressProjects || "").trim(),
      termsAccepted: Boolean(currentDetails.termsAccepted),
      professionalBio: String(
        currentDetails.professionalBio || personal.bio || ""
      ).trim(),
      education: collectEducationEntriesFromProfileDetails(currentDetails),
    });

    setFullProfileEditorSection(section);
    setModalType("fullProfile");
  };

  const handleFullProfileFieldChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    setFullProfileForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  const handleEducationFieldChange = useCallback((index, field, value) => {
    setFullProfileForm((prev) => ({
      ...prev,
      education: (Array.isArray(prev.education) ? prev.education : []).map(
        (entry, rowIndex) =>
          rowIndex === index ? { ...entry, [field]: value } : entry
      ),
    }));
  }, []);

  const addEducationEntry = useCallback(() => {
    setFullProfileForm((prev) => ({
      ...prev,
      education: [
        ...(Array.isArray(prev.education) ? prev.education : []),
        createEmptyEducationEntry(),
      ],
    }));
  }, []);

  const removeEducationEntry = useCallback((index) => {
    setFullProfileForm((prev) => {
      const nextEducation = (Array.isArray(prev.education) ? prev.education : [])
        .filter((_, rowIndex) => rowIndex !== index);

      return {
        ...prev,
        education:
          nextEducation.length > 0
            ? nextEducation
            : [createEmptyEducationEntry()],
      };
    });
  }, []);

  const saveFullProfileEditor = async () => {
    const normalizedUsername = String(fullProfileForm.username || "")
      .replace(/^@+/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 30);

    const normalizedLanguages = toUniqueLabels(
      parseDelimitedValues(fullProfileForm.languages)
    );
    const normalizedIndustries = toUniqueLabels(
      parseDelimitedValues(fullProfileForm.globalIndustryFocus)
    );
    const normalizedEducation = normalizeEducationEntriesForSave(
      fullProfileForm.education
    );

    const currentDetails =
      profileDetails && typeof profileDetails === "object" ? profileDetails : {};
    const currentIdentity =
      currentDetails.identity && typeof currentDetails.identity === "object"
        ? currentDetails.identity
        : {};
    const currentAvailability =
      currentDetails.availability &&
        typeof currentDetails.availability === "object"
        ? currentDetails.availability
        : {};
    const currentReliability =
      currentDetails.reliability && typeof currentDetails.reliability === "object"
        ? currentDetails.reliability
        : {};

    const nextIdentity = {
      ...currentIdentity,
      professionalTitle: String(fullProfileForm.professionalTitle || "").trim(),
      username: normalizedUsername,
      country: String(fullProfileForm.country || "").trim(),
      city: String(fullProfileForm.city || "").trim(),
      languages: normalizedLanguages,
      otherLanguage: String(fullProfileForm.otherLanguage || "").trim(),
    };

    const nextProfileDetails = {
      ...currentDetails,
      identity: nextIdentity,
      role: String(fullProfileForm.role || "").trim(),
      globalIndustryFocus: normalizedIndustries,
      globalIndustryOther: String(fullProfileForm.globalIndustryOther || "").trim(),
      availability: {
        ...currentAvailability,
        hoursPerWeek: String(fullProfileForm.hoursPerWeek || "").trim(),
        workingSchedule: String(fullProfileForm.workingSchedule || "").trim(),
        startTimeline: String(fullProfileForm.startTimeline || "").trim(),
      },
      reliability: {
        ...currentReliability,
        missedDeadlines: String(fullProfileForm.missedDeadlines || "").trim(),
        delayHandling: String(fullProfileForm.delayHandling || "").trim(),
      },
      deliveryPolicyAccepted: Boolean(fullProfileForm.deliveryPolicyAccepted),
      communicationPolicyAccepted: Boolean(
        fullProfileForm.communicationPolicyAccepted
      ),
      acceptInProgressProjects: (() => {
        const normalizedValue = String(
          fullProfileForm.acceptInProgressProjects || "",
        )
          .trim()
          .toLowerCase();

        if (["yes", "true", "1"].includes(normalizedValue)) {
          return true;
        }
        if (["no", "false", "0"].includes(normalizedValue)) {
          return false;
        }

        return null;
      })(),
      termsAccepted: Boolean(fullProfileForm.termsAccepted),
      professionalBio: String(fullProfileForm.professionalBio || "").trim(),
      education: normalizedEducation,
    };

    const nextLocation = [nextIdentity.city, nextIdentity.country]
      .filter(Boolean)
      .join(", ");
    const nextPersonal = {
      ...personal,
      headline: nextIdentity.professionalTitle || personal.headline || "",
      bio: nextProfileDetails.professionalBio || personal.bio || "",
      location: nextLocation || personal.location || "",
    };

    const saved = await handleSave({
      personal: nextPersonal,
      portfolio,
      skills,
      workExperience,
      services,
      portfolioProjects,
      profileDetails: nextProfileDetails,
    });

    if (saved) {
      setModalType(null);
    }
  };

  const saveEducationSection = async () => {
    const normalizedEducation = normalizeEducationEntriesForSave(
      fullProfileForm.education
    );

    const currentDetails =
      profileDetails && typeof profileDetails === "object" ? profileDetails : {};
    const nextProfileDetails = {
      ...currentDetails,
      education: normalizedEducation,
    };

    const saved = await handleSave({
      personal,
      portfolio,
      skills,
      workExperience,
      services,
      portfolioProjects,
      profileDetails: nextProfileDetails,
    });

    if (saved) {
      setModalType(null);
    }
  };

  const onboardingIdentity =
    profileDetails?.identity && typeof profileDetails.identity === "object"
      ? profileDetails.identity
      : {};
  const onboardingServices = Array.from(
    new Set([
      ...(Array.isArray(profileDetails?.services) ? profileDetails.services : []),
      ...(Array.isArray(services) ? services : []),
    ])
  )
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  const onboardingGlobalIndustry = toUniqueLabels([
    ...(Array.isArray(profileDetails?.globalIndustryFocus)
      ? profileDetails.globalIndustryFocus
      : []),
    profileDetails?.globalIndustryOther || "",
  ]);
  const onboardingLanguages = toUniqueLabels([
    ...(Array.isArray(onboardingIdentity?.languages)
      ? onboardingIdentity.languages
      : []),
    onboardingIdentity?.otherLanguage || "",
  ]);
  const onboardingAvailability =
    profileDetails?.availability && typeof profileDetails.availability === "object"
      ? profileDetails.availability
      : {};
  const onboardingRole = String(profileDetails?.role || "").trim();
  const onboardingRoleLabel =
    ONBOARDING_ROLE_LABELS[onboardingRole] ||
    normalizeValueLabel(onboardingRole) ||
    "Not set yet";
  const onboardingHoursLabel =
    formatHoursPerWeekLabel(onboardingAvailability?.hoursPerWeek) || "Not set yet";
  const onboardingScheduleLabel =
    normalizeValueLabel(onboardingAvailability?.workingSchedule) ||
    "Not set yet";
  const onboardingStartTimelineLabel =
    normalizeValueLabel(onboardingAvailability?.startTimeline) || "Not set yet";
  const quickResponseTimeLabel =
    normalizeValueLabel(
      profileDetails?.responseTime ||
        profileDetails?.avgResponseTime ||
        onboardingAvailability?.responseTime
    ) || "Not set yet";
  const quickTimeZoneLabel = useMemo(() => {
    const storedTimeZone = normalizeTimeZoneLabel(
      onboardingAvailability?.timezone ||
        onboardingIdentity?.timezone ||
        profileDetails?.identity?.timezone
    );

    if (storedTimeZone) return storedTimeZone;

    const countryLabel = String(onboardingIdentity?.country || "")
      .trim()
      .toLowerCase();
    const locationLabel = [
      personal.location,
      onboardingIdentity?.location,
      profileDetails?.identity?.location,
    ]
      .map((value) => String(value || "").trim().toLowerCase())
      .filter(Boolean)
      .join(" ");

    if (countryLabel === "india" || locationLabel.includes("india")) {
      return "IST (UTC+5:30)";
    }

    return getLocalTimeZoneLabel();
  }, [
    onboardingAvailability?.timezone,
    onboardingIdentity?.country,
    onboardingIdentity?.location,
    onboardingIdentity?.timezone,
    personal.location,
    profileDetails?.identity?.location,
    profileDetails?.identity?.timezone,
  ]);
  const quickLanguagesLabel = onboardingLanguages.length
    ? onboardingLanguages.join(", ")
    : "Not set yet";
  const deliveryPolicyLabel = profileDetails?.deliveryPolicyAccepted
    ? "Accepted"
    : "Not set yet";
  const communicationPolicyLabel = profileDetails?.communicationPolicyAccepted
    ? "Accepted"
    : "Not set yet";
  const acceptInProgressProjectsLabel =
    normalizeValueLabel(profileDetails?.acceptInProgressProjects) || "Not set yet";
  const onboardingServiceDetailMap = useMemo(
    () =>
      profileDetails?.serviceDetails &&
        typeof profileDetails.serviceDetails === "object"
        ? profileDetails.serviceDetails
        : {},
    [profileDetails?.serviceDetails]
  );
  const onboardingPlatformLinks = collectOnboardingPlatformLinks(
    onboardingServiceDetailMap
  );
  const fallbackPortfolioLink =
    onboardingPlatformLinks.find((entry) => isPortfolioLikeKey(entry.key))?.url ||
    "";
  const fallbackLinkedinLink =
    onboardingPlatformLinks.find((entry) => entry.key.includes("linkedin"))?.url ||
    "";
  const fallbackGithubLink =
    onboardingPlatformLinks.find((entry) => entry.key.includes("github"))?.url ||
    "";
  const resolvedPortfolioLink =
    normalizePresenceLink(portfolio.portfolioUrl) ||
    normalizePresenceLink(onboardingIdentity?.portfolioUrl) ||
    fallbackPortfolioLink;
  const resolvedLinkedinLink =
    normalizePresenceLink(portfolio.linkedinUrl) ||
    normalizePresenceLink(onboardingIdentity?.linkedinUrl) ||
    fallbackLinkedinLink;
  const resolvedGithubLink =
    normalizePresenceLink(portfolio.githubUrl) || fallbackGithubLink;
  const resolvedResumeLink = normalizePresenceLink(portfolio.resume);
  const onboardingServiceEntries = Array.from(
    new Set([
      ...onboardingServices,
      ...Object.keys(onboardingServiceDetailMap),
    ])
  )
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .map((serviceKey) => ({
      serviceKey,
      detail: onboardingServiceDetailMap?.[serviceKey] || {},
    }));
  const linkableServiceOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...onboardingServiceEntries.map((entry) => entry?.serviceKey),
          ...(Array.isArray(services) ? services : []),
        ])
      )
        .map((value) => String(value || "").trim())
        .filter(Boolean)
        .map((serviceKey) => ({
          value: serviceKey,
          label: getServiceLabel(serviceKey),
        })),
    [onboardingServiceEntries, services]
  );
  const availableServiceOptions = useMemo(() => {
    const existingServiceKeys = new Set(
      Array.from(
        new Set([
          ...onboardingServiceEntries.map((entry) => entry?.serviceKey),
          ...(Array.isArray(services) ? services : []),
        ])
      )
        .map((serviceKey) => normalizeServiceIdentity(serviceKey))
        .filter(Boolean)
    );

    return SERVICE_OPTIONS.filter(
      (option) =>
        !existingServiceKeys.has(normalizeServiceIdentity(option.value))
    );
  }, [onboardingServiceEntries, services]);
  const openAddServiceModal = useCallback(() => {
    setServiceForm(createInitialServiceForm());
    setModalType("service");
  }, []);
  const addService = useCallback(() => {
    const selectedServiceKey = String(serviceForm.selectedServiceKey || "").trim();
    const customServiceName = String(serviceForm.customServiceName || "").trim();

    let nextServiceKey = "";
    if (
      selectedServiceKey &&
      selectedServiceKey !== CUSTOM_SERVICE_OPTION_VALUE
    ) {
      nextServiceKey = selectedServiceKey;
    } else if (customServiceName) {
      const matchedService = resolveCatalogServiceMatch(customServiceName);
      nextServiceKey = matchedService?.value || customServiceName;
    }

    if (!nextServiceKey) {
      toast.error("Choose a service or enter a custom service name");
      return;
    }

    const existingServiceKey = onboardingServiceEntries.find(
      (entry) =>
        normalizeServiceIdentity(entry?.serviceKey) ===
        normalizeServiceIdentity(nextServiceKey)
    )?.serviceKey;

    setServiceForm(createInitialServiceForm());

    if (existingServiceKey) {
      toast("Service already exists on your profile. Opening it for editing.");
      openEditServiceProfileModal(existingServiceKey);
      return;
    }

    openEditServiceProfileModal(nextServiceKey);
  }, [onboardingServiceEntries, openEditServiceProfileModal, serviceForm]);
  const serviceTechSuggestionOptions = useMemo(() => {
    const serviceKey = String(serviceProfileForm.serviceKey || "").trim();
    if (!serviceKey) {
      return [];
    }

    const selectedKeys = new Set(
      (Array.isArray(serviceProfileForm.skillsAndTechnologies)
        ? serviceProfileForm.skillsAndTechnologies
        : []
      ).map((entry) => getSkillDedupKey(entry))
    );

    return normalizeServiceSkillTags(getTechStackOptions(serviceKey))
      .filter((entry) => getSkillDedupKey(entry) !== getSkillDedupKey("Other"))
      .filter((entry) => !selectedKeys.has(getSkillDedupKey(entry)))
      .slice(0, 8);
  }, [serviceProfileForm.serviceKey, serviceProfileForm.skillsAndTechnologies]);
  const onboardingProjectDescriptionMap = useMemo(() => {
    const map = new Map();

    Object.values(onboardingServiceDetailMap).forEach((detail) => {
      const projects = Array.isArray(detail?.projects) ? detail.projects : [];
      projects.forEach((project) => {
        const description = String(project?.description || "").trim();
        if (!description) return;

        const projectLink = normalizeProjectLinkValue(
          project?.link || project?.url || ""
        );
        const projectTitle = String(project?.title || "")
          .trim()
          .toLowerCase();

        if (projectLink) {
          const linkKey = `link:${projectLink.toLowerCase()}`;
          if (!map.has(linkKey)) {
            map.set(linkKey, description);
          }
        }

        if (projectTitle) {
          const titleKey = `title:${projectTitle}`;
          if (!map.has(titleKey)) {
            map.set(titleKey, description);
          }
        }
      });
    });

    return map;
  }, [onboardingServiceDetailMap]);
  const onboardingIdentityLocation = buildLocationFromIdentity(onboardingIdentity);
  const displayHeadline =
    String(personal.headline || "").trim() ||
    String(onboardingIdentity?.professionalTitle || "").trim() ||
    "";
  const displayBio =
    String(profileDetails?.professionalBio || "").trim() ||
    normalizeBioValue(personal.bio) ||
    "";
  const displayLocation = personal.location || onboardingIdentityLocation || "";
  const effectiveWorkExperience = workExperience;
  const normalizedWorkExperience = normalizeWorkExperienceEntries(
    effectiveWorkExperience
  );
  const normalizedEducationEntries = collectEducationEntriesFromProfileDetails(
    profileDetails
  );
  const displayPortfolioProjects = useMemo(
    () =>
      (Array.isArray(portfolioProjects) ? portfolioProjects : []).map(
        (project) => {
          const projectServiceKeys = resolveProjectServiceKeys(project);
          const currentDescription = String(project?.description || "").trim();
          const projectLink = normalizeProjectLinkValue(project?.link || "");
          const projectTitle = String(project?.title || "")
            .trim()
            .toLowerCase();

          const descriptionFromOnboarding =
            (projectLink
              ? onboardingProjectDescriptionMap.get(
                `link:${projectLink.toLowerCase()}`
              )
              : "") ||
            (projectTitle
              ? onboardingProjectDescriptionMap.get(`title:${projectTitle}`)
              : "") ||
            "";

          return {
            ...project,
            serviceKeys: projectServiceKeys,
            serviceKey: projectServiceKeys[0] || String(project?.serviceKey || "").trim(),
            description: currentDescription || descriptionFromOnboarding,
          };
        }
      ),
    [portfolioProjects, onboardingProjectDescriptionMap]
  );
  const hasProjectChanges = useMemo(() => {
    const currentProjects = Array.isArray(portfolioProjects) ? portfolioProjects : [];
    const initialProjects = Array.isArray(initialData?.portfolioProjects)
      ? initialData.portfolioProjects
      : [];
    return JSON.stringify(currentProjects) !== JSON.stringify(initialProjects);
  }, [portfolioProjects, initialData?.portfolioProjects]);
  const isEditingProjectDraft = editingProjectIndex !== null;
  const serviceEntriesMissingDescription = onboardingServiceEntries.filter(
    ({ detail }) =>
      !hasTextValue(detail?.serviceDescription || detail?.description)
  ).length;
  const serviceEntriesMissingCover = onboardingServiceEntries.filter(
    ({ detail }) => !resolveAvatarUrl(detail?.coverImage, { allowBlob: true })
  ).length;
  const serviceEntriesWithAnyProfileData = onboardingServiceEntries.filter(
    ({ detail }) => {
      const description = String(
        detail?.serviceDescription || detail?.description || ""
      ).trim();
      const coverImage = resolveAvatarUrl(detail?.coverImage, { allowBlob: true });
      return Boolean(description || coverImage);
    }
  ).length;
  const serviceProfileCoverage = onboardingServiceEntries.length
    ? serviceEntriesWithAnyProfileData / onboardingServiceEntries.length
    : 0;

  const uniqueSkillCount = toUniqueSkillNames(
    skills.map((entry) => entry?.name || entry)
  ).length;
  const missingSkillCount = Math.max(0, 5 - uniqueSkillCount);
  const skillsCoverage = Math.min(uniqueSkillCount, 5) / 5;

  const profileLinkCandidates = [
    { label: "Portfolio", value: resolvedPortfolioLink },
    { label: "LinkedIn", value: resolvedLinkedinLink },
    { label: "GitHub", value: resolvedGithubLink },
  ];
  const availableProfileLinkLabels = profileLinkCandidates
    .filter((item) => Boolean(item.value))
    .map((item) => item.label);
  const missingProfileLinkLabels = profileLinkCandidates
    .filter((item) => !item.value)
    .map((item) => item.label);
  const missingProfileLinkCount = Math.max(0, 2 - availableProfileLinkLabels.length);
  const linkCoverage = Math.min(availableProfileLinkLabels.length, 2) / 2;
  const hasResumeUploaded = Boolean(resolvedResumeLink);
  const hasWorkExperienceEntries = normalizedWorkExperience.length > 0;
  const hasEducationEntries = normalizedEducationEntries.some((entry) => {
    if (!entry || typeof entry !== "object") return false;
    return (
      hasTextValue(entry.school) ||
      hasTextValue(entry.degree) ||
      hasTextValue(entry.field) ||
      hasTextValue(entry.country) ||
      hasTextValue(entry.startMonth) ||
      hasTextValue(entry.startYear) ||
      hasTextValue(entry.endMonth) ||
      hasTextValue(entry.endYear) ||
      hasTextValue(entry.graduationYear) ||
      hasTextValue(entry.grade) ||
      hasTextValue(entry.activities)
    );
  });

  // Treat weekly hours + start timeline as core availability requirements.
  // Working schedule remains optional and is shown as a helpful detail.
  const availabilityMissingDetails = [];
  if (!hasTextValue(onboardingAvailability?.hoursPerWeek)) {
    availabilityMissingDetails.push("weekly hours");
  }
  if (!hasTextValue(onboardingAvailability?.startTimeline)) {
    availabilityMissingDetails.push("start timeline");
  }
  const availabilityCoverage =
    (2 - availabilityMissingDetails.length) / 2;

  const policyMissingDetails = [];
  if (!profileDetails?.deliveryPolicyAccepted) {
    policyMissingDetails.push("delivery policy");
  }
  if (!profileDetails?.communicationPolicyAccepted) {
    policyMissingDetails.push("communication policy");
  }
  if (!hasTextValue(profileDetails?.acceptInProgressProjects)) {
    policyMissingDetails.push("in-progress project preference");
  }
  const policiesCoverage = (3 - policyMissingDetails.length) / 3;

  const profilePhotoUrl = resolveAvatarUrl(personal.avatar);
  const profileCoverUrl =
    resolveAvatarUrl(personal.coverImage, { allowBlob: true }) ||
    resolveAvatarUrl(onboardingIdentity?.coverImage, { allowBlob: true }) ||
    resolveAvatarUrl(profileDetails?.identity?.coverImage, { allowBlob: true });
  const headerProfile = useMemo(
    () => ({
      avatar: profilePhotoUrl || resolveAvatarUrl(user?.avatar),
      name: user?.fullName || user?.name || personal.name || "Freelancer",
      email: user?.email || personal.email || "",
      initial: initials,
      available: personal.available,
      openToWork:
        typeof personal.openToWork === "boolean"
          ? personal.openToWork
          : Boolean(personal.available),
      isVerified: Boolean(
        personal.isVerified ?? user?.isVerified ?? user?.freelancerProfile?.isVerified
      ),
    }),
    [
      initials,
      personal.available,
      personal.email,
      personal.name,
      personal.isVerified,
      personal.openToWork,
      profilePhotoUrl,
      user?.isVerified,
      user?.freelancerProfile?.isVerified,
      user?.avatar,
      user?.email,
      user?.fullName,
      user?.name,
    ]
  );
  const hasProfilePhoto = Boolean(profilePhotoUrl);
  // If a dedicated cover is missing, accept profile photo as fallback so users
  // are not blocked by an extra image requirement.
  const hasProfileCover = Boolean(profileCoverUrl || profilePhotoUrl);
  const hasProfessionalTitle = hasTextValue(onboardingIdentity?.professionalTitle);
  const hasProfessionalBio = hasTextValue(
    profileDetails?.professionalBio || personal.bio
  );
  const hasCountry = hasTextValue(onboardingIdentity?.country);
  const hasCity = hasTextValue(onboardingIdentity?.city);
  const hasSelectedServices = onboardingServiceEntries.length > 0;
  const isCustomServiceSelected =
    serviceForm.selectedServiceKey === CUSTOM_SERVICE_OPTION_VALUE;
  const canAddNewService = Boolean(
    (serviceForm.selectedServiceKey &&
      serviceForm.selectedServiceKey !== CUSTOM_SERVICE_OPTION_VALUE) ||
      String(serviceForm.customServiceName || "").trim()
  );

  const hasServiceAveragePrice = Boolean(
    String(serviceProfileForm.averageProjectPrice || "").trim()
  );
  const hasServiceSkills =
    (Array.isArray(serviceProfileForm.skillsAndTechnologies)
      ? serviceProfileForm.skillsAndTechnologies
      : []
    ).length > 0;
  const isDraftingNewService = Boolean(
    serviceProfileForm.serviceKey &&
    !onboardingServiceEntries.some(
      (entry) =>
        normalizeServiceIdentity(entry?.serviceKey) ===
        normalizeServiceIdentity(serviceProfileForm.serviceKey)
    )
  );
  const serviceProfileStatusLabel = !serviceProfileForm.serviceDescription
    ? "Add description"
    : !serviceProfileForm.coverImage
      ? "Add a cover image"
      : !hasServiceAveragePrice
        ? "Set average price"
          : !hasServiceSkills
            ? "Add skills & technologies"
            : "Ready to publish";
  const hasFeaturedProject = portfolioProjects.length > 0;
  const hasIndustryFocus = onboardingGlobalIndustry.length > 0;

  const profileCompletionCriteria = [
    { label: "Profile photo", score: hasProfilePhoto ? 1 : 0, weight: 4 },
    { label: "Profile cover", score: hasProfileCover ? 1 : 0, weight: 4 },
    {
      label: "Professional title",
      score: hasProfessionalTitle ? 1 : 0,
      weight: 8,
    },
    {
      label: "Professional Bio",
      score: hasProfessionalBio ? 1 : 0,
      weight: 10,
    },
    {
      label: "Location details",
      score: hasCountry && hasCity ? 1 : 0,
      weight: 8,
    },
    {
      label: "Services selected",
      score: hasSelectedServices ? 1 : 0,
      weight: 12,
    },
    {
      label: "Service description/cover",
      score: serviceProfileCoverage,
      weight: 10,
    },
    {
      label: "Skills and tech stack",
      score: skillsCoverage,
      weight: 10,
    },
    {
      label: "Availability setup",
      score: availabilityCoverage,
      weight: 8,
    },
    { label: "Profile links", score: linkCoverage, weight: 8 },
    {
      label: "Featured project",
      score: hasFeaturedProject ? 1 : 0,
      weight: 8,
    },
    {
      label: "Resume uploaded",
      score: hasResumeUploaded ? 1 : 0,
      weight: 6,
    },
    {
      label: "Work experience",
      score: hasWorkExperienceEntries ? 1 : 0,
      weight: 6,
    },
    {
      label: "Education history",
      score: hasEducationEntries ? 1 : 0,
      weight: 6,
    },
    {
      label: "Industry focus",
      score: hasIndustryFocus ? 1 : 0,
      weight: 5,
    },
    { label: "Policies accepted", score: policiesCoverage, weight: 5 },
  ];

  const profileCompletionMissingDetails = [];

  if (!hasProfilePhoto) {
    profileCompletionMissingDetails.push({
      label: "Profile photo",
      detail: "Upload a clear profile image.",
    });
  }

  if (!hasProfileCover) {
    profileCompletionMissingDetails.push({
      label: "Profile cover",
      detail: "Add a cover image to strengthen your profile header.",
    });
  }

  if (!hasProfessionalTitle) {
    profileCompletionMissingDetails.push({
      label: "Professional title",
      detail: "Add your headline or role title.",
    });
  }

  if (!hasProfessionalBio) {
    profileCompletionMissingDetails.push({
      label: "Professional Bio",
      detail: "Write a short bio that highlights your expertise.",
    });
  }

  if (!hasCountry || !hasCity) {
    const missingLocationParts = [];
    if (!hasCity) missingLocationParts.push("city");
    if (!hasCountry) missingLocationParts.push("country");
    profileCompletionMissingDetails.push({
      label: "Location details",
      detail: `Add your ${missingLocationParts.join(" and ")}.`,
    });
  }

  if (!hasSelectedServices) {
    profileCompletionMissingDetails.push({
      label: "Services selected",
      detail: "Select at least one service you offer.",
    });
  }

  if (hasSelectedServices && serviceProfileCoverage < 1) {
    const serviceDetailGaps = [];
    if (serviceEntriesMissingDescription > 0) {
      serviceDetailGaps.push(
        `${serviceEntriesMissingDescription} description${serviceEntriesMissingDescription === 1 ? "" : "s"}`
      );
    }
    if (serviceEntriesMissingCover > 0) {
      serviceDetailGaps.push(
        `${serviceEntriesMissingCover} cover image${serviceEntriesMissingCover === 1 ? "" : "s"}`
      );
    }
    profileCompletionMissingDetails.push({
      label: "Service description/cover",
      detail: `Complete ${serviceDetailGaps.join(" and ")} across your selected services.`,
    });
  }

  if (skillsCoverage < 1) {
    profileCompletionMissingDetails.push({
      label: "Skills and tech stack",
      detail:
        missingSkillCount > 0
          ? `Add ${missingSkillCount} more skill${missingSkillCount === 1 ? "" : "s"} (target: 5).`
          : "Add a clearer tech stack with up to 5 key skills.",
    });
  }

  if (availabilityMissingDetails.length > 0) {
    profileCompletionMissingDetails.push({
      label: "Availability setup",
      detail: `Add ${availabilityMissingDetails.join(", ")}.`,
    });
  }

  if (linkCoverage < 1) {
    const suggestedLinks = missingProfileLinkLabels.slice(0, 2).join(" or ");
    profileCompletionMissingDetails.push({
      label: "Profile links",
      detail: suggestedLinks
        ? `Add ${missingProfileLinkCount} more link${missingProfileLinkCount === 1 ? "" : "s"} (suggested: ${suggestedLinks}).`
        : `Add ${missingProfileLinkCount} more profile link${missingProfileLinkCount === 1 ? "" : "s"}.`,
    });
  }

  if (!hasFeaturedProject) {
    profileCompletionMissingDetails.push({
      label: "Featured project",
      detail: "Add at least one project to your portfolio.",
    });
  }

  if (!hasResumeUploaded) {
    profileCompletionMissingDetails.push({
      label: "Resume uploaded",
      detail: "Upload your resume so clients can quickly review your profile.",
    });
  }

  if (!hasWorkExperienceEntries) {
    profileCompletionMissingDetails.push({
      label: "Work experience",
      detail: "Add at least one work experience entry.",
    });
  }

  if (!hasEducationEntries) {
    profileCompletionMissingDetails.push({
      label: "Education history",
      detail: "Add your education details (school, degree, or year).",
    });
  }

  if (!hasIndustryFocus) {
    profileCompletionMissingDetails.push({
      label: "Industry focus",
      detail: "Select your global industry focus.",
    });
  }

  if (policyMissingDetails.length > 0) {
    profileCompletionMissingDetails.push({
      label: "Policies accepted",
      detail: `Review and complete: ${policyMissingDetails.join(", ")}.`,
    });
  }

  const profileCompletionRawScore = profileCompletionCriteria.reduce(
    (total, item) => total + item.score * item.weight,
    0
  );
  const profileCompletionTotalWeight = profileCompletionCriteria.reduce(
    (total, item) => total + item.weight,
    0
  );
  const profileCompletionPercent = Math.round(
    Math.max(
      0,
      Math.min(
        100,
        profileCompletionTotalWeight > 0
          ? (profileCompletionRawScore / profileCompletionTotalWeight) * 100
          : 0
      )
    )
  );
  const completedCompletionSections = profileCompletionCriteria.filter(
    (item) => item.score >= 0.999
  ).length;
  const partialCompletionSections = profileCompletionCriteria.filter(
    (item) => item.score > 0 && item.score < 0.999
  ).length;
  const profileCompletionMessage =
    profileCompletionPercent >= 90
      ? "Your profile is client-ready."
      : profileCompletionPercent >= 70
        ? "Almost there. Finish a few details to boost trust."
        : "Complete key sections to improve visibility.";
  const handleDashboardHeaderNotificationClick = (notification) => {
    if (!notification) return;
    markAsRead(notification.id);

    if (notification.type === "chat" && notification.data) {
      const service = notification.data.service || "";
      const parts = service.split(":");
      let projectId = notification.data.projectId;
      if (!projectId && parts.length >= 4 && parts[0] === "CHAT") {
        projectId = parts[1];
      }
      navigate(
        projectId
          ? `/freelancer/messages?projectId=${projectId}`
          : "/freelancer/messages"
      );
      return;
    }

    if (notification.type === "proposal") {
      navigate("/freelancer/proposals");
      return;
    }

    if (
      (notification.type === "meeting_scheduled" ||
        notification.type === "task_completed" ||
        notification.type === "task_verified" ||
        notification.type === "task_unverified") &&
      notification.data?.projectId
    ) {
      navigate(`/freelancer/project/${notification.data.projectId}`);
    }
  };

  if (profileLoading) {
    return (
      <FreelancerProfileLoadingState
        headerProfile={headerProfile}
        notifications={notifications}
        unreadCount={unreadCount}
        markAllAsRead={markAllAsRead}
        onNotificationClick={handleDashboardHeaderNotificationClick}
      />
    );
  }

  return (
    <>
      <FreelancerProfilePageShell
        headerProfile={headerProfile}
        notifications={notifications}
        unreadCount={unreadCount}
        markAllAsRead={markAllAsRead}
        onNotificationClick={handleDashboardHeaderNotificationClick}
      >
          <div className="w-full py-6 md:py-8">

          {/* ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ Full-width hero ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ */}
          <ProfileHeroCard
            fileInputRef={fileInputRef}
            coverInputRef={coverInputRef}
            resumeInputRef={resumeInputRef}
            personal={personal}
            setPersonal={setPersonal}
            initials={initials}
            uploadingImage={uploadingImage}
            uploadingCoverImage={uploadingCoverImage}
            uploadingResume={uploadingResume}
            handleImageUpload={handleImageUpload}
            handleCoverImageUpload={handleCoverImageUpload}
            handleResumeUpload={handleResumeUpload}
            removeCoverImage={removeCoverImage}
            coverImageUrl={profileCoverUrl}
            displayHeadline={displayHeadline}
            displayBio={displayBio}
            displayLocation={displayLocation}
            isVerified={Boolean(personal.isVerified)}
            onboardingIdentity={onboardingIdentity}
            onboardingLanguages={onboardingLanguages}
            openEditPersonalModal={openEditPersonalModal}
            openPortfolioModal={openPortfolioModal}
            onToggleAvailability={handleAvailabilityToggle}
            availabilitySaving={isAvailabilitySaving}
            profileLinks={{
              portfolio: resolvedPortfolioLink,
              linkedin: resolvedLinkedinLink,
              github: resolvedGithubLink,
              resume: resolvedResumeLink,
            }}
          />

          {/* ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ Two-column grid ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ */}
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">

            {/* ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ Left: Main content ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ */}
            <div className="min-w-0 space-y-5">
              <ProfileOnboardingSnapshotCard
                workModelLabel={onboardingRoleLabel}
                availabilityLabel={onboardingHoursLabel}
                scheduleLabel={onboardingScheduleLabel}
                startTimelineLabel={onboardingStartTimelineLabel}
                deliveryPolicyLabel={deliveryPolicyLabel}
                communicationPolicyLabel={communicationPolicyLabel}
                acceptInProgressProjectsLabel={acceptInProgressProjectsLabel}
                openFullProfileEditor={openFullProfileEditor}
              />

              <ProfileSkillsCard
                skills={skills}
                deleteSkill={deleteSkill}
                setSkillLevel={setSkillLevel}
                savingChanges={isSaving}
                openSkillModal={() => { setSkillForm(createInitialSkillForm()); setModalType("skill"); }}
              />

              <ServicesFromOnboardingCard
                onboardingServiceEntries={onboardingServiceEntries}
                portfolioProjects={displayPortfolioProjects}
                getServiceLabel={getServiceLabel}
                resolveAvatarUrl={resolveAvatarUrl}
                collectServiceSpecializations={collectServiceSpecializations}
                toUniqueLabels={toUniqueLabels}
                normalizeValueLabel={normalizeValueLabel}
                openEditServiceProfileModal={openEditServiceProfileModal}
                openAddServiceModal={openAddServiceModal}
              />

              <FeaturedProjectsSection
                portfolioProjects={displayPortfolioProjects}
                projectCoverUploadingIndex={projectCoverUploadingIndex}
                handleProjectCoverInputChange={handleProjectCoverInputChange}
                removeProject={removeProject}
                onEditProject={openEditProject}
                hasPendingChanges={hasProjectChanges}
                onAddProject={openAddProjectModal}
                onViewAllProjects={() => setModalType("viewAllProjects")}
              />
            </div>

            {/* ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ Right: Sidebar ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ */}
            <div className="space-y-5 lg:sticky lg:top-40 lg:self-start">
              <ProfileSummaryCards
                profileCompletionPercent={profileCompletionPercent}
                completedCompletionSections={completedCompletionSections}
                partialCompletionSections={partialCompletionSections}
                profileCompletionCriteriaLength={profileCompletionCriteria.length}
                profileCompletionMessage={profileCompletionMessage}
                profileCompletionMissingDetails={profileCompletionMissingDetails}
              />

              <ProfileSidebarCards
                openCreateExperienceModal={openCreateExperienceModal}
                effectiveWorkExperience={effectiveWorkExperience}
                workExperience={workExperience}
                openEditExperienceModal={openEditExperienceModal}
                removeExperience={removeExperience}
                splitExperienceTitle={splitExperienceTitle}
                profileDetails={profileDetails}
                openFullProfileEditor={openFullProfileEditor}
                quickDetails={{
                  availability: onboardingHoursLabel,
                  responseTime: quickResponseTimeLabel,
                  timezone: quickTimeZoneLabel,
                  languages: quickLanguagesLabel,
                }}
                normalizeValueLabel={normalizeValueLabel}
              />
            </div>

          </div>
          </div>
      </FreelancerProfilePageShell>
      {/* Modal */}
      <FreelancerProfileModalHost
        modalType={modalType}
        fullProfileEditorSection={fullProfileEditorSection}
      >
            {modalType === "skill" ? (
              <>
                <h1 className="text-lg font-semibold text-foreground">
                  Add Skill
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Give the skill a name and score it on a 1-10 scale so clients can scan your strengths faster.
                </p>
                <div className="mt-4 space-y-4">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-muted-foreground">
                      Skill name
                    </span>
                    <input
                      value={skillForm.name}
                      onChange={(event) =>
                        setSkillForm((prev) => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Skill name"
                      className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/70 focus:ring-2 focus:ring-primary/60"
                    />
                  </label>
                  <label className="block">
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-muted-foreground">
                        Skill level
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                        {formatSkillLevelLabel(skillForm.level)}
                      </span>
                    </div>
                    <Select
                      value={String(skillForm.level)}
                      onValueChange={(value) =>
                        setSkillForm((prev) => ({
                          ...prev,
                          level: normalizeSkillLevel(value),
                        }))
                      }
                    >
                      <SelectTrigger className="h-11 w-full rounded-xl border-border/70 bg-card/70 px-3 text-[15px] text-foreground shadow-none focus-visible:border-primary/70 focus-visible:ring-2 focus-visible:ring-primary/60">
                        <SelectValue placeholder="Choose a skill level" />
                      </SelectTrigger>
                      <SelectContent className="border-border/70 bg-background text-foreground">
                        {SKILL_LEVEL_OPTIONS.map((levelOption) => (
                          <SelectItem key={levelOption} value={String(levelOption)}>
                            Level {levelOption}/10
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>
                </div>
                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="rounded-2xl border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground transition-colors hover:bg-muted/40"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addSkill}
                    disabled={isSaving || !formatSkillLabel(skillForm.name)}
                    className="rounded-2xl bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-background transition-colors hover:bg-primary/85 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? "Saving..." : "Add"}
                  </button>
                </div>
              </>
            ) : modalType === "service" ? (
              <>
                <h1 className="text-lg font-semibold text-foreground">
                  Add New Service
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pick a service from the catalog or add a custom offer, then
                  fill in its profile details next.
                </p>
                <div className="mt-4 space-y-4">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-muted-foreground">
                      Service catalog
                    </span>
                    <Select
                      modal={false}
                      value={serviceForm.selectedServiceKey || undefined}
                      onValueChange={(value) =>
                        setServiceForm((prev) => ({
                          ...prev,
                          selectedServiceKey: value,
                        }))
                      }
                    >
                      <SelectTrigger className="h-11 w-full rounded-xl border-border/70 bg-card/70 px-3 text-[15px] text-foreground shadow-none focus-visible:border-primary/70 focus-visible:ring-2 focus-visible:ring-primary/60">
                        <SelectValue placeholder="Choose a predefined service" />
                      </SelectTrigger>
                      <SelectContent className="border-border/70 bg-background text-foreground">
                        {availableServiceOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                        <SelectItem value={CUSTOM_SERVICE_OPTION_VALUE}>
                          Custom service
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {availableServiceOptions.length > 0
                        ? "Choose from your remaining service catalog options."
                        : "All catalog services are already on your profile. Add a custom service below."}
                    </p>
                  </label>

                  {isCustomServiceSelected ? (
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-muted-foreground">
                        Custom service name
                      </span>
                      <input
                        value={serviceForm.customServiceName}
                        onChange={(event) =>
                          setServiceForm((prev) => ({
                            ...prev,
                            customServiceName: event.target.value,
                          }))
                        }
                        placeholder="Service name (e.g. Rust Development)"
                        className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                      />
                    </label>
                  ) : null}
                </div>
                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setServiceForm(createInitialServiceForm());
                      setModalType(null);
                    }}
                    className="rounded-2xl border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground hover:bg-muted/40 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addService}
                    disabled={!canAddNewService}
                    className="rounded-2xl bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-background transition-colors hover:bg-primary/85 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Continue
                  </button>
                </div>
              </>
            ) : modalType === "viewAllProjects" ? (
              <>
                <div className="border-b border-border/70 pb-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-xl font-semibold tracking-tight text-foreground">
                          All Featured Projects
                        </h1>
                        <span className="inline-flex items-center rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                          {displayPortfolioProjects.length}{" "}
                          {displayPortfolioProjects.length === 1 ? "project" : "projects"}
                        </span>
                        {hasProjectChanges ? (
                          <span className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300">
                            Unsaved changes
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        Manage every project in your profile portfolio.
                      </p>
                    </div>
                    <Button type="button" onClick={openAddProjectModal}>
                      <Plus className="h-4 w-4" />
                      Add project
                    </Button>
                  </div>
                </div>

                <div className="mt-4 flex-1 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {displayPortfolioProjects.length > 0 ? (
                    <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
                      {displayPortfolioProjects.map((project, idx) => {
                        const projectLink = normalizeProjectLinkValue(project?.link);
                        const projectHost = getProjectTitleFallback(projectLink || "");
                        const projectTitle = String(
                          project?.title || projectHost || "Project"
                        ).trim();
                        const projectDescription = String(
                          project?.description || ""
                        ).trim();
                        const projectServiceLabels = resolveProjectServiceLabels(project);
                        const visibleProjectServiceLabels = projectServiceLabels.slice(0, 2);
                        const hiddenProjectServiceLabelCount = Math.max(
                          0,
                          projectServiceLabels.length - visibleProjectServiceLabels.length
                        );

                        return (
                          <article
                            key={`project-modal-${projectLink || projectTitle}-${idx}`}
                            className="group overflow-hidden rounded-2xl border border-white/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))]"
                          >
                            <div className="relative h-40 overflow-hidden lg:h-44">
                              <ProjectCoverMedia
                                project={project}
                                containerClassName="h-full w-full"
                                imageClassName="h-full w-full object-cover"
                                fallbackTitleClassName="text-3xl"
                              />
                              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.08),rgba(2,6,23,0.52)_72%,rgba(7,7,10,0.86)_100%)]" />
                              <div className="absolute right-3 top-3 z-10">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      type="button"
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-background text-foreground opacity-0 shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all duration-200 translate-y-1 pointer-events-none group-hover:translate-y-0 group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 group-focus-within:pointer-events-auto focus-visible:translate-y-0 focus-visible:opacity-100 focus-visible:pointer-events-auto data-[state=open]:translate-y-0 data-[state=open]:opacity-100 data-[state=open]:pointer-events-auto hover:scale-105 hover:bg-background hover:text-primary"
                                      title="Project actions"
                                    >
                                      <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="w-44 border-white/10 bg-background text-foreground"
                                  >
                                    {projectLink ? (
                                      <DropdownMenuItem asChild>
                                        <a
                                          href={projectLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="cursor-pointer"
                                        >
                                          <ExternalLink className="h-3.5 w-3.5 text-primary" />
                                          Open project
                                        </a>
                                      </DropdownMenuItem>
                                    ) : null}
                                    <DropdownMenuItem onSelect={() => openEditProject(project, idx)}>
                                      <Edit2 className="h-3.5 w-3.5 text-primary" />
                                      Edit details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onSelect={(event) => {
                                        event.preventDefault();
                                        document
                                          .getElementById(`project-cover-modal-${idx}`)
                                          ?.click();
                                      }}
                                    >
                                      {projectCoverUploadingIndex === idx ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                                      ) : (
                                        <Camera className="h-3.5 w-3.5 text-primary" />
                                      )}
                                      Upload cover
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      variant="destructive"
                                      onSelect={() => removeProject(idx)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      Remove project
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              <input
                                id={`project-cover-modal-${idx}`}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(event) =>
                                  handleProjectCoverInputChange(idx, event)
                                }
                              />
                            </div>
                            <div className="space-y-2.5 px-4 pb-4 pt-3">
                              <div className="min-h-[3.5rem]">
                                <h2
                                  className="line-clamp-1 text-base font-semibold tracking-tight text-foreground"
                                  title={projectTitle}
                                >
                                  {projectTitle}
                                </h2>
                                {projectLink ? (
                                  <a
                                    href={projectLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-1 line-clamp-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/85 hover:underline"
                                    title={projectLink}
                                  >
                                    {projectHost}
                                  </a>
                                ) : (
                                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">
                                    Link not added
                                  </p>
                                )}
                              </div>
                              <p
                                className="min-h-[4rem] line-clamp-3 text-sm leading-6 text-white/68"
                                title={projectDescription || ""}
                              >
                                {projectDescription ||
                                  "Add a short project description so clients can quickly understand the scope and outcome."}
                              </p>
                              <div className="flex items-start justify-between gap-3 border-t border-white/6 pt-3">
                                <div className="flex flex-wrap gap-2">
                                  {visibleProjectServiceLabels.length ? (
                                    visibleProjectServiceLabels.map((label) => (
                                      <span
                                        key={`${projectTitle}-${label}`}
                                        className="inline-flex items-center rounded-full border border-white/6 bg-white/[0.045] px-2.5 py-1 text-[11px] font-medium text-white/65"
                                      >
                                        {label}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="inline-flex items-center rounded-full border border-white/6 bg-white/[0.045] px-2.5 py-1 text-[11px] font-medium text-white/65">
                                      Featured work
                                    </span>
                                  )}
                                  {hiddenProjectServiceLabelCount > 0 ? (
                                    <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                                      +{hiddenProjectServiceLabelCount} more
                                    </span>
                                  ) : null}
                                </div>
                                {projectLink ? (
                                  <a
                                    href={projectLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary transition-all duration-200 hover:bg-primary hover:text-primary-foreground"
                                  >
                                    Open
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.045] px-2.5 py-1.5 text-xs text-white/40">
                                    Link missing
                                  </span>
                                )}
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 bg-background/35 px-6 text-center">
                      <p className="text-base font-semibold text-foreground">
                        No projects yet
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Add your first project to start showcasing your work.
                      </p>
                      <Button
                        type="button"
                        className="mt-4"
                        onClick={openAddProjectModal}
                      >
                        <Plus className="h-4 w-4" />
                        Add project
                      </Button>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModalType(null)}
                  >
                    Close
                  </Button>
                  <Button
                    type="button"
                    onClick={saveProjectsSection}
                    disabled={isSaving || !hasProjectChanges}
                  >
                    {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    Save changes
                  </Button>
                </div>
              </>
            ) : modalType === "onboardingService" ? (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="space-y-1">
                  <div>
                    <h1 className="text-xl font-semibold text-foreground">
                      {isDraftingNewService
                        ? "Add Service Profile"
                        : "Edit Service Profile"}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Make this service stand out on your profile for{" "}
                      <span className="font-medium text-foreground">
                        {serviceProfileForm.serviceLabel || "this service"}
                      </span>
                      .
                    </p>
                  </div>
                </div>

                <div className="subtle-scrollbar mt-4 flex-1 space-y-4 overflow-y-auto pr-2">
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                    <label className="block space-y-1.5">
                      <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                        Experience
                      </span>
                      <select
                        value={serviceProfileForm.experienceYears || ""}
                        onChange={(event) =>
                          setServiceProfileForm((prev) => ({
                            ...prev,
                            experienceYears: event.target.value,
                          }))
                        }
                        className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/70 focus:ring-2 focus:ring-primary/60"
                      >
                        <option value="">Select experience range</option>
                        {serviceProfileForm.experienceYears &&
                        !EXPERIENCE_YEARS_OPTIONS.some(
                          (option) => option.value === serviceProfileForm.experienceYears
                        ) ? (
                          <option value={serviceProfileForm.experienceYears}>
                            {normalizeValueLabel(serviceProfileForm.experienceYears)}
                          </option>
                        ) : null}
                        {EXPERIENCE_YEARS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>


                    <label className="block space-y-1.5">
                      <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                        Delivery Timeline
                      </span>
                      <select
                        value={serviceProfileForm.deliveryTime || ""}
                        onChange={(event) =>
                          setServiceProfileForm((prev) => ({
                            ...prev,
                            deliveryTime: event.target.value,
                          }))
                        }
                        className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/70 focus:ring-2 focus:ring-primary/60"
                      >
                        <option value="">Select delivery timeline</option>
                        {serviceProfileForm.deliveryTime &&
                        !PROJECT_TIMELINE_OPTIONS.some(
                          (option) => option.value === serviceProfileForm.deliveryTime
                        ) ? (
                          <option value={serviceProfileForm.deliveryTime}>
                            {normalizeValueLabel(serviceProfileForm.deliveryTime)}
                          </option>
                        ) : null}
                        {PROJECT_TIMELINE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block space-y-1.5">
                      <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                        Avg Price
                      </span>
                      <select
                        value={serviceProfileForm.averageProjectPrice || ""}
                        onChange={(event) =>
                          setServiceProfileForm((prev) => ({
                            ...prev,
                            averageProjectPrice: event.target.value,
                          }))
                        }
                        className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/70 focus:ring-2 focus:ring-primary/60"
                      >
                        <option value="">Select average project price</option>
                        {serviceProfileForm.averageProjectPrice &&
                        !AVERAGE_PROJECT_PRICE_OPTIONS.some(
                          (option) =>
                            option.value === serviceProfileForm.averageProjectPrice
                        ) ? (
                          <option value={serviceProfileForm.averageProjectPrice}>
                            {normalizeValueLabel(
                              serviceProfileForm.averageProjectPrice
                            )}
                          </option>
                        ) : null}
                        {AVERAGE_PROJECT_PRICE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="rounded-md border border-border/70 bg-background/50 px-3 py-2.5 lg:row-span-2">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                        Profile Status
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {serviceProfileStatusLabel}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Description, cover, price, delivery timeline,
                        and skills complete the card.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                      Service Description
                    </span>
                    <textarea
                      value={serviceProfileForm.serviceDescription}
                      onChange={(event) =>
                        setServiceProfileForm((prev) => ({
                          ...prev,
                          serviceDescription: event.target.value,
                        }))
                      }
                      rows={4}
                      maxLength={500}
                      placeholder="Describe the outcomes, process, and what clients can expect."
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/70 focus:ring-2 focus:ring-primary/60"
                    />
                    <p className="text-right text-[11px] text-muted-foreground">
                      {String(serviceProfileForm.serviceDescription || "").length}/500
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="block text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                        Skills &amp; Technologies
                      </span>
                      <span className="text-xs text-muted-foreground">
                        These appear on the service card.
                      </span>
                    </div>

                    <div className="rounded-md border border-border/70 bg-background/50 p-3">
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          value={serviceSkillInput}
                          onChange={(event) => setServiceSkillInput(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === ",") {
                              event.preventDefault();
                              addServiceSkillTag(serviceSkillInput);
                            }
                          }}
                          placeholder="Add a skill, tool, or platform"
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/70 focus:ring-2 focus:ring-primary/60"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 shrink-0"
                          onClick={() => addServiceSkillTag(serviceSkillInput)}
                          disabled={!String(serviceSkillInput || "").trim()}
                        >
                          Add tag
                        </Button>
                      </div>

                      {serviceTechSuggestionOptions.length > 0 ? (
                        <div className="mt-3">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                            Suggested
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {serviceTechSuggestionOptions.map((tag) => (
                              <button
                                key={`service-tag-suggestion-${tag}`}
                                type="button"
                                onClick={() => addServiceSkillTag(tag)}
                                className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary/20"
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-3 min-h-[2.5rem] rounded-md border border-dashed border-border/70 bg-background/35 p-3">
                        {(Array.isArray(serviceProfileForm.skillsAndTechnologies)
                          ? serviceProfileForm.skillsAndTechnologies
                          : []
                        ).length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {serviceProfileForm.skillsAndTechnologies.map((tag) => (
                              <span
                                key={`service-tag-selected-${tag}`}
                                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] font-medium text-foreground"
                              >
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => removeServiceSkillTag(tag)}
                                  className="text-muted-foreground transition-colors hover:text-foreground"
                                  aria-label={`Remove ${tag}`}
                                >
                                  x
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            No skills or technologies added yet.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="block text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                      Service Cover Image
                    </span>
                    <div className="rounded-md border border-border/70 bg-background/50 p-3">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                          Recommended: 16:9 image, under 8MB.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploadingServiceCover}
                          onClick={() =>
                            document
                              .getElementById("onboarding-service-cover-input")
                              ?.click()
                          }
                        >
                          {uploadingServiceCover ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            "Upload image"
                          )}
                        </Button>
                        <input
                          id="onboarding-service-cover-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleServiceCoverImageChange}
                        />
                      </div>

                      {serviceProfileForm.coverImage ? (
                        <div className="group relative overflow-hidden rounded-md border border-border/70">
                          <img
                            src={serviceProfileForm.coverImage}
                            alt={`${serviceProfileForm.serviceLabel || "Service"} cover`}
                            className="h-32 w-full object-cover transition-transform duration-500 group-hover:scale-[1.02] sm:h-36"
                          />
                          <div className="absolute inset-x-0 bottom-0 flex justify-end bg-gradient-to-t from-black/45 to-transparent p-2">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                setServiceProfileForm((prev) => ({
                                  ...prev,
                                  coverImage: "",
                                }))
                              }
                            >
                              Remove cover
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-border/70 bg-background/35 text-xs text-muted-foreground sm:h-36">
                          No cover selected yet
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-border/70 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setServiceSkillInput("");
                      setModalType(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={saveOnboardingServiceProfile}
                    disabled={savingServiceProfile || uploadingServiceCover}
                  >
                    {(savingServiceProfile || uploadingServiceCover) && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}
                    {isDraftingNewService ? "Add service" : "Save changes"}
                  </Button>
                </div>
              </div>
            ) : modalType === "addProject" ? (
              <>
                <div className="border-b border-border/70 pb-2.5">
                  <span className="inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                    {isEditingProjectDraft ? "Update featured project" : "Create featured project"}
                  </span>
                  <div className="mt-2 max-w-[38rem]">
                    <h1 className="text-[1.55rem] font-semibold tracking-tight text-foreground">
                      {isEditingProjectDraft ? "Edit Project" : "Add Project"}
                    </h1>
                    <p className="mt-0.5 text-sm leading-5 text-muted-foreground">
                      {isEditingProjectDraft
                        ? "Refresh the link, summary, services, and cover."
                        : "Add a live URL, short summary, service mapping, and cover image."}
                    </p>
                  </div>
                </div>
                <div className="mt-2.5">
                  <section className="rounded-md border border-white/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] p-3">
                    <div className="mb-2">
                      <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-foreground/90">
                        Project Details
                      </h2>
                    </div>

                    <div className="space-y-2">
                      <label className="block">
                        <span className="mb-0.5 block text-sm font-medium text-muted-foreground">
                          Live URL*
                        </span>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <input
                            value={newProjectUrl}
                            onChange={(event) => setNewProjectUrl(event.target.value)}
                            onBlur={handleUrlBlur}
                            placeholder="https://yourproject.com"
                            className="h-9 w-full rounded-md border border-border/70 bg-card/70 px-3 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/70 focus:ring-2 focus:ring-primary/60"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="h-9 shrink-0"
                            onClick={handleUrlBlur}
                            disabled={newProjectLoading}
                          >
                            {newProjectLoading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : null}
                            Fetch details
                          </Button>
                        </div>
                      </label>

                      <label className="block">
                        <span className="mb-0.5 block text-sm font-medium text-muted-foreground">
                          Project title
                        </span>
                        <input
                          value={newProjectTitle}
                          onChange={(event) => setNewProjectTitle(event.target.value)}
                          placeholder="Enter project title"
                          className="h-9 w-full rounded-md border border-border/70 bg-card/70 px-3 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/70 focus:ring-2 focus:ring-primary/60"
                        />
                      </label>

                      <label className="block">
                        <div className="mb-0.5 flex items-center justify-between gap-3">
                          <span className="block text-sm font-medium text-muted-foreground">
                            Description
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {String(newProjectDescription || "").length}/320
                          </span>
                        </div>
                        <textarea
                          value={newProjectDescription}
                          onChange={(event) => setNewProjectDescription(event.target.value)}
                          rows={2}
                          maxLength={320}
                          placeholder="What this project does and the impact it created."
                          className="min-h-[68px] w-full rounded-md border border-border/70 bg-card/70 px-3 py-1.5 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/70 focus:ring-2 focus:ring-primary/60"
                        />
                      </label>

                      <div className="block">
                        <div className="mb-0.5 flex items-center justify-between gap-3">
                          <span className="block text-sm font-medium text-muted-foreground">
                            Link to services
                          </span>
                          {newProjectServiceKeys.length > 0 ? (
                            <button
                              type="button"
                              className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
                              onClick={() => setNewProjectServiceKeys([])}
                            >
                              Clear all
                            </button>
                          ) : null}
                        </div>
                        {linkableServiceOptions.length > 0 ? (
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                            {linkableServiceOptions.map((option) => {
                              const isSelected = newProjectServiceKeys.some(
                                (entry) =>
                                  normalizeServiceIdentity(entry) ===
                                  normalizeServiceIdentity(option.value)
                              );

                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  aria-pressed={isSelected}
                                  onClick={() =>
                                    toggleProjectServiceSelection(option.value)
                                  }
                                  className={`flex min-h-8 items-center justify-between gap-2 rounded-md border px-2.5 py-1 text-left text-[13px] transition-colors ${
                                    isSelected
                                      ? "border-primary/45 bg-primary/10 text-foreground"
                                      : "border-border/70 bg-card/70 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                                  }`}
                                >
                                  <span className="leading-4">{option.label}</span>
                                  <span
                                    className={`inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border transition-colors ${
                                      isSelected
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-white/12 bg-transparent text-transparent"
                                    }`}
                                  >
                                    <Check className="h-3 w-3" aria-hidden="true" />
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="rounded-md border border-dashed border-border/70 bg-card/40 px-3 py-3 text-sm text-muted-foreground">
                            Add services first, then you can link this project to one or more service cards.
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5 pt-0.5">
                        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <span className="block text-sm font-medium text-muted-foreground">
                              Project cover
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {newProjectImagePreview ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-9"
                                onClick={clearNewProjectImageDraft}
                              >
                                Remove
                              </Button>
                            ) : null}
                          </div>
                        </div>

                        <input
                          id="new-project-image-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleNewProjectImageChange}
                        />

                        <label
                          htmlFor="new-project-image-input"
                          role="button"
                          aria-label="Upload project cover"
                          tabIndex={0}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              document.getElementById("new-project-image-input")?.click();
                            }
                          }}
                          onDragOver={(event) => {
                            event.preventDefault();
                            if (event.dataTransfer) {
                              event.dataTransfer.dropEffect = "copy";
                            }
                            setIsProjectCoverDragActive(true);
                          }}
                          onDragLeave={(event) => {
                            if (event.currentTarget === event.target) {
                              setIsProjectCoverDragActive(false);
                            }
                          }}
                          onDrop={handleNewProjectImageDrop}
                          className={`block cursor-pointer overflow-hidden rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-primary/60 ${isProjectCoverDragActive ? "border-primary/60 bg-primary/10" : "border-white/8 bg-background/45"}`}
                        >
                          <div className="relative h-24 overflow-hidden bg-background/60 sm:h-28">
                            {newProjectImagePreview ? (
                              <>
                                <img
                                  src={newProjectImagePreview}
                                  alt="Project cover preview"
                                  className="h-full w-full object-cover"
                                />
                                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent px-3 py-2 text-xs font-medium text-white">
                                  Click or drag and drop to replace
                                </div>
                              </>
                            ) : (
                              <div className="pointer-events-none flex h-full flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.12),transparent_55%)] px-4 text-center">
                                <span className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/20 bg-primary/10">
                                  <Camera className="h-4 w-4 text-primary" />
                                </span>
                                <div>
                                  <p className="text-sm font-medium text-foreground">
                                    Click or drag and drop a cover image
                                  </p>
                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    PNG, JPG, or WebP up to 8MB
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </label>
                      </div>
                    </div>
                  </section>
                </div>
                <div className="mt-2.5 flex items-center justify-end gap-2.5 border-t border-border/70 pt-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetProjectDraft();
                      setModalType(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddProject}
                    disabled={newProjectLoading}
                  >
                    {newProjectLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : !isEditingProjectDraft ? (
                      <Plus className="h-3.5 w-3.5" />
                    ) : null}
                    {isEditingProjectDraft ? "Save changes" : "Add project"}
                  </Button>
                </div>
              </>
            ) : modalType === "portfolio" ? (
              <>
                <h1 className="text-lg font-semibold text-foreground">
                  Edit Professional Links
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Update your public links shown in the profile header.
                </p>

                <div className="mt-4 space-y-4">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-muted-foreground">
                      Portfolio URL
                    </span>
                    <input
                      value={portfolio.portfolioUrl || ""}
                      onChange={(event) =>
                        setPortfolio((prev) => ({
                          ...prev,
                          portfolioUrl: event.target.value,
                        }))
                      }
                      placeholder="https://yourportfolio.com"
                      className="h-11 w-full rounded-xl border border-border/70 bg-card/70 px-3 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/70 focus:ring-2 focus:ring-primary/60"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-muted-foreground">
                      LinkedIn URL
                    </span>
                    <input
                      value={portfolio.linkedinUrl || ""}
                      onChange={(event) =>
                        setPortfolio((prev) => ({
                          ...prev,
                          linkedinUrl: event.target.value,
                        }))
                      }
                      placeholder="https://linkedin.com/in/username"
                      className="h-11 w-full rounded-xl border border-border/70 bg-card/70 px-3 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/70 focus:ring-2 focus:ring-primary/60"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-muted-foreground">
                      GitHub URL
                    </span>
                    <input
                      value={portfolio.githubUrl || ""}
                      onChange={(event) =>
                        setPortfolio((prev) => ({
                          ...prev,
                          githubUrl: event.target.value,
                        }))
                      }
                      placeholder="https://github.com/username"
                      className="h-11 w-full rounded-xl border border-border/70 bg-card/70 px-3 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/70 focus:ring-2 focus:ring-primary/60"
                    />
                  </label>
                </div>

                <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-border/70 pt-4">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="rounded-2xl border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground hover:bg-muted/40 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={savePortfolioSection}
                    disabled={isSaving}
                    className="rounded-2xl bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-background hover:bg-primary/85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                  >
                    {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                    Save changes
                  </button>
                </div>
              </>
            ) : modalType === "fullProfile" ? (
              <FullProfileEditorModalContent
                fullProfileForm={fullProfileForm}
                section={fullProfileEditorSection}
                handleFullProfileFieldChange={handleFullProfileFieldChange}
                setFullProfileForm={setFullProfileForm}
                addEducationEntry={addEducationEntry}
                handleEducationFieldChange={handleEducationFieldChange}
                removeEducationEntry={removeEducationEntry}
                saveFullProfileEditor={saveFullProfileEditor}
                isSaving={isSaving}
                setModalType={setModalType}
              />
            ) : modalType === "education" ? (
              <EducationModalContent
                fullProfileForm={fullProfileForm}
                addEducationEntry={addEducationEntry}
                handleEducationFieldChange={handleEducationFieldChange}
                removeEducationEntry={removeEducationEntry}
                saveEducationSection={saveEducationSection}
                isSaving={isSaving}
                setModalType={setModalType}
                MONTH_OPTIONS={MONTH_OPTIONS}
                YEAR_OPTIONS={YEAR_OPTIONS}
              />
            ) : modalType === "personal" ? (
              <PersonalDetailsModalContent
                personal={personal}
                portfolio={portfolio}
                onboardingIdentity={onboardingIdentity}
                onboardingLanguages={onboardingLanguages}
                handlePersonalChange={handlePersonalChange}
                handlePersonalUsernameChange={handlePersonalUsernameChange}
                handlePersonalLanguagesChange={handlePersonalLanguagesChange}
                handlePersonalOtherLanguageChange={handlePersonalOtherLanguageChange}
                setPortfolio={setPortfolio}
                savePersonalSection={savePersonalSection}
                isSaving={isSaving}
                setModalType={setModalType}
              />
            ) : (
              <WorkExperienceModalContent
                editingIndex={editingIndex}
                workForm={workForm}
                setWorkForm={setWorkForm}
                buildMonthYearLabel={buildMonthYearLabel}
                MONTH_OPTIONS={MONTH_OPTIONS}
                YEAR_OPTIONS={YEAR_OPTIONS}
                EMPLOYMENT_TYPE_OPTIONS={EMPLOYMENT_TYPE_OPTIONS}
                LOCATION_TYPE_OPTIONS={LOCATION_TYPE_OPTIONS}
                initialWorkForm={initialWorkForm}
                saveExperience={saveExperience}
                isSaving={isSaving}
                setModalType={setModalType}
                setEditingIndex={setEditingIndex}
              />
            )}
      </FreelancerProfileModalHost>
      <ProfileImageCropDialog
        open={isProfileCropOpen}
        file={pendingProfilePhotoFile}
        maxUploadBytes={AVATAR_UPLOAD_MAX_BYTES}
        onApply={handleProfilePhotoCropped}
        onCancel={closeProfileCropDialog}
      />
    </>
  );
};

export default FreelancerProfile;

