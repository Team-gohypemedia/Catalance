import Plus from "lucide-react/dist/esm/icons/plus";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import Camera from "lucide-react/dist/esm/icons/camera";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { format, parse, isValid } from "date-fns";
import { cn } from "@/shared/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { DashboardHeader } from "@/components/layout/GlobalDashboardHeader";
import { RoleAwareSidebar } from "@/components/layout/RoleAwareSidebar";
import ProfileHeroCard from "@/components/features/freelancer/profile/ProfileHeroCard";
import ProfileSummaryCards from "@/components/features/freelancer/profile/ProfileSummaryCards";
import ProfileAboutCard from "@/components/features/freelancer/profile/ProfileAboutCard";
import ProfileOnboardingSnapshotCard from "@/components/features/freelancer/profile/ProfileOnboardingSnapshotCard";
import ServicesFromOnboardingCard from "@/components/features/freelancer/profile/ServicesFromOnboardingCard";
import FeaturedProjectsSection from "@/components/features/freelancer/profile/FeaturedProjectsSection";
import ProfileSidebarCards from "@/components/features/freelancer/profile/ProfileSidebarCards";
import ProfileSkillsCard from "@/components/features/freelancer/profile/ProfileSkillsCard";
import ProjectCoverMedia from "@/components/features/freelancer/profile/ProjectCoverMedia";
import { useAuth } from "@/shared/context/AuthContext";
import { useNotifications } from "@/shared/context/NotificationContext";
import {
  getServiceLabel,
  createServiceDetail,
} from "@/components/features/freelancer/onboarding/utils";
import { useNavigate } from "react-router-dom";

const getBioTextFromObject = (obj) => {
  if (!obj || typeof obj !== "object") return "";
  const textKeys = ["bio", "about", "description", "summary", "text"];
  for (const key of textKeys) {
    if (typeof obj[key] === "string" && obj[key].trim()) {
      return obj[key];
    }
  }
  const fallback = Object.values(obj).find(
    (value) => typeof value === "string" && value.trim()
  );
  return fallback || "";
};

const normalizeBioValue = (value) => {
  if (!value) return "";
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (
      trimmed.startsWith("{") &&
      trimmed.endsWith("}") &&
      trimmed.length > 2
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed === "string") {
          return parsed;
        }
        if (typeof parsed === "object" && parsed !== null) {
          return getBioTextFromObject(parsed);
        }
      } catch {
        // fall through and return the raw string
      }
    }
    if (
      trimmed.startsWith("[") &&
      trimmed.endsWith("]") &&
      trimmed.length > 2
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.join(" ").trim();
        }
      } catch {
        //
      }
    }
    return value;
  }
  if (typeof value === "object") {
    return getBioTextFromObject(value);
  }
  return String(value);
};

const TECH_TAG_ACRONYMS = new Set([
  "ai",
  "api",
  "cms",
  "crm",
  "css",
  "db",
  "erp",
  "gsc",
  "ml",
  "orm",
  "seo",
  "sql",
  "ui",
  "ux",
]);

const formatSkillLabel = (value) => {
  const raw = String(value ?? "")
    .replace(/[_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!raw) return "";

  return raw
    .split(" ")
    .map((token) => {
      const normalized = token.toLowerCase();
      if (TECH_TAG_ACRONYMS.has(normalized)) {
        return normalized.toUpperCase();
      }
      if (/^[a-z0-9]+$/i.test(token)) {
        return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
      }
      return token;
    })
    .join(" ");
};

const getSkillDedupKey = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const SKILL_NOISE_VALUES = new Set([
  "yes",
  "no",
  "open",
  "other",
  "not set",
  "individual",
  "agency",
  "part time",
  "part_time",
  "beginner",
  "intermediate",
  "advanced",
  "small",
  "medium",
  "large",
  "english",
  "hindi",
  "spanish",
  "french",
  "german",
  "chinese",
  "arabic",
  "bengali",
  "portuguese",
  "russian",
  "japanese",
  "punjabi",
  "telugu",
  "marathi",
  "tamil",
  "urdu",
  "gujarati",
  "kannada",
  "malayalam",
  "italian",
  "hype",
  "media",
  "student",
  "build",
  "commerce",
  "sites",
  "portfolio",
  "apps",
  "powered",
]);

const SKILL_NOISE_PATTERNS = [
  /\b(inr|usd|eur|lakh|lakhs|crore)\b/i,
  /\b(under|over|within|less than|more than)\b/i,
  /\b(hours?|weeks?|months?|years?)\b/i,
  /\b(price|pricing|budget|timeline|cost)\b/i,
  /^\d+(\s*-\s*\d+)?$/,
  /^\d+\s+\d+$/,
];

const isNoisySkillTag = (value) => {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return true;
  if (SKILL_NOISE_VALUES.has(normalized)) return true;
  return SKILL_NOISE_PATTERNS.some((pattern) => pattern.test(normalized));
};

const toUniqueSkillNames = (rawSkills = []) => {
  const deduped = new Map();

  (Array.isArray(rawSkills) ? rawSkills : []).forEach((entry) => {
    const source =
      typeof entry === "string"
        ? entry
        : typeof entry?.name === "string"
          ? entry.name
          : String(entry ?? "");
    const label = formatSkillLabel(source);
    if (!label) return;

    const key = getSkillDedupKey(label);
    if (!key || deduped.has(key)) return;
    deduped.set(key, label);
  });

  return Array.from(deduped.values());
};

const toUniqueSkillObjects = (rawSkills = []) =>
  toUniqueSkillNames(rawSkills)
    .filter((name) => !isNoisySkillTag(name))
    .map((name) => ({ name }));

const buildLocationFromIdentity = (identity = {}) => {
  if (!identity || typeof identity !== "object") return "";

  const city = String(identity.city || "").trim();
  const country = String(identity.country || "").trim();
  return [city, country].filter(Boolean).join(", ");
};

const resolveAvatarUrl = (value, { allowBlob = false } = {}) => {
  if (!value) return "";
  if (typeof value === "string") {
    const url = value.trim();
    if (!url) return "";
    if (!allowBlob && url.startsWith("blob:")) return "";
    return url;
  }
  if (typeof value === "object") {
    return resolveAvatarUrl(
      value.uploadedUrl || value.url || value.src || value.value || "",
      { allowBlob }
    );
  }
  return "";
};

const EXPERIENCE_VALUE_LABELS = {
  less_than_1: "Less than 1 year",
  "1_3": "1-3 years",
  "3_5": "3-5 years",
  "5_plus": "5+ years",
};

const ONBOARDING_ROLE_LABELS = {
  individual: "Individual Freelancer",
  agency: "Agency / Studio",
  part_time: "Part-Time Freelancer",
};

const HOURS_PER_WEEK_LABELS = {
  less_than_10: "Less than 10 hours/week",
  "10_20": "10-20 hours/week",
  "20_30": "20-30 hours/week",
  "30_plus": "30+ hours/week",
};

const normalizeValueLabel = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const normalized = raw.toLowerCase();
  const canonical = normalized
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (EXPERIENCE_VALUE_LABELS[canonical]) {
    return EXPERIENCE_VALUE_LABELS[canonical];
  }
  if (normalized === "yes") return "Yes";
  if (normalized === "no") return "No";
  if (normalized === "open") return "Open to all";

  return formatSkillLabel(raw);
};

const formatHoursPerWeekLabel = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const canonical = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (HOURS_PER_WEEK_LABELS[canonical]) {
    return HOURS_PER_WEEK_LABELS[canonical];
  }

  const normalized = normalizeValueLabel(raw);
  if (!normalized) return "";

  if (/^(\d+)\s+plus$/i.test(normalized)) {
    const [, hours] = normalized.match(/^(\d+)\s+plus$/i) || [];
    return hours ? `${hours}+ hours/week` : normalized;
  }

  if (/^\d+\s*-\s*\d+$/.test(normalized)) {
    return `${normalized} hours/week`;
  }

  if (/\bhours?\b/i.test(normalized)) {
    return normalized;
  }

  return normalized;
};

const normalizePresenceLink = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^[a-z]+:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return "";
  return `https://${raw}`;
};

const normalizeProjectLinkValue = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    return new URL(withProtocol).toString();
  } catch {
    return withProtocol;
  }
};

const hasTextValue = (value) => String(value || "").trim().length > 0;

const collectOnboardingPlatformLinks = (serviceDetailMap = {}) =>
  Object.values(serviceDetailMap)
    .flatMap((detail) => {
      if (!detail || typeof detail !== "object") return [];
      const links =
        detail.platformLinks && typeof detail.platformLinks === "object"
          ? detail.platformLinks
          : {};
      return Object.entries(links).map(([key, url]) => ({
        key: String(key || "").toLowerCase().trim(),
        url: normalizePresenceLink(url),
      }));
    })
    .filter((entry) => entry.url);

const isPortfolioLikeKey = (key = "") =>
  key.includes("portfolio") ||
  key.includes("website") ||
  key.includes("liveproject") ||
  key.includes("projectlink") ||
  key === "github";

const parseDelimitedValues = (value = "") =>
  String(value || "")
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean);

const toUniqueLabels = (values = []) =>
  toUniqueSkillNames(values.map((entry) => normalizeValueLabel(entry)));

const collectServiceSpecializations = (detail = {}) => {
  const collected = [];

  const groups =
    detail?.groups && typeof detail.groups === "object" ? detail.groups : {};
  Object.values(groups).forEach((entry) => {
    if (Array.isArray(entry)) {
      collected.push(...entry);
    }
  });

  const groupOther =
    detail?.groupOther && typeof detail.groupOther === "object"
      ? detail.groupOther
      : {};
  Object.values(groupOther).forEach((entry) => {
    if (Array.isArray(entry)) {
      collected.push(...entry);
      return;
    }
    if (typeof entry === "string") {
      collected.push(...parseDelimitedValues(entry));
    }
  });

  return toUniqueLabels(collected);
};

const splitExperienceTitle = (title = "") => {
  const raw = String(title || "");
  const separators = [" · ", " • ", " · ", " - "];

  for (const separator of separators) {
    if (raw.includes(separator)) {
      const [position, company] = raw.split(separator);
      return [String(position || "").trim(), String(company || "").trim()];
    }
  }

  return [raw.trim(), ""];
};

const splitExperiencePeriod = (period = "") => {
  const raw = String(period || "");
  const separators = [" – ", " – ", " - "];

  for (const separator of separators) {
    if (raw.includes(separator)) {
      const [from, to] = raw.split(separator);
      return [String(from || "").trim(), String(to || "").trim()];
    }
  }

  return [raw.trim(), ""];
};

const normalizeWorkExperienceEntries = (entries = []) =>
  (Array.isArray(entries) ? entries : [])
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const title = String(entry.title || "").trim();
      const period = String(entry.period || "").trim();
      const description = String(entry.description || "").trim();
      if (!title && !period && !description) return null;
      return { title, period, description };
    })
    .filter(Boolean);

const initialWorkForm = {
  company: "",
  position: "",
  from: "",
  to: "",
  description: "",
};

const createEmptyEducationEntry = () => ({
  school: "",
  degree: "",
  field: "",
  country: "",
  graduationYear: "",
});

const collectEducationEntriesFromProfileDetails = (details = {}) => {
  const profile = details && typeof details === "object" ? details : {};
  const identity =
    profile.identity && typeof profile.identity === "object"
      ? profile.identity
      : {};

  const candidateLists = [
    profile.education,
    profile.educationHistory,
    identity.education,
    identity.educationHistory,
  ].filter(Array.isArray);

  const normalized = candidateLists
    .flatMap((entries) => entries)
    .map((entry) => {
      if (!entry) return null;
      if (typeof entry === "string") {
        const school = String(entry).trim();
        if (!school) return null;
        return {
          school,
          degree: "",
          field: "",
          country: "",
          graduationYear: "",
        };
      }

      if (typeof entry !== "object") return null;

      const school = String(
        entry.school ||
        entry.institution ||
        entry.university ||
        entry.college ||
        entry.name ||
        ""
      ).trim();
      const degree = String(
        entry.degree || entry.qualification || entry.program || ""
      ).trim();
      const field = String(
        entry.field ||
        entry.specialization ||
        entry.stream ||
        entry.focus ||
        entry.subject ||
        ""
      ).trim();
      const country = String(entry.country || entry.location || "").trim();
      const graduationYear = String(
        entry.graduationYear || entry.endYear || entry.year || ""
      ).trim();

      if (!school && !degree && !field && !country && !graduationYear) {
        return null;
      }

      return { school, degree, field, country, graduationYear };
    })
    .filter(Boolean);

  return normalized.length > 0 ? normalized : [createEmptyEducationEntry()];
};

const normalizeEducationEntriesForSave = (entries = []) =>
  (Array.isArray(entries) ? entries : [])
    .map((entry) => ({
      school: String(entry?.school || "").trim(),
      degree: String(entry?.degree || "").trim(),
      field: String(entry?.field || "").trim(),
      country: String(entry?.country || "").trim(),
      graduationYear: String(entry?.graduationYear || "").trim(),
    }))
    .filter(
      (entry) =>
        entry.school ||
        entry.degree ||
        entry.field ||
        entry.country ||
        entry.graduationYear
    );

const createInitialFullProfileForm = () => ({
  professionalTitle: "",
  username: "",
  country: "",
  city: "",
  languages: "",
  otherLanguage: "",
  role: "",
  globalIndustryFocus: "",
  globalIndustryOther: "",
  hoursPerWeek: "",
  workingSchedule: "",
  startTimeline: "",
  missedDeadlines: "",
  delayHandling: "",
  deliveryPolicyAccepted: false,
  communicationPolicyAccepted: false,
  acceptInProgressProjects: "",
  termsAccepted: false,
  professionalBio: "",
  education: [createEmptyEducationEntry()],
});

const FreelancerProfile = () => {
  const navigate = useNavigate();
  const { user, authFetch } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const [modalType, setModalType] = useState(null);
  const [skills, setSkills] = useState([]); // [{ name }]
  const [workExperience, setWorkExperience] = useState([]); // {title, period, description}
  const [services, setServices] = useState([]); // string[]
  const [skillForm, setSkillForm] = useState({ name: "" });
  const [workForm, setWorkForm] = useState(initialWorkForm);
  const [editingIndex, setEditingIndex] = useState(null); // null = add, number = edit

  const [personal, setPersonal] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    experienceYears: "",
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
  const [newProjectImageFile, setNewProjectImageFile] = useState(null);
  const [newProjectImagePreview, setNewProjectImagePreview] = useState("");
  const [serviceProfileForm, setServiceProfileForm] = useState({
    serviceKey: "",
    serviceLabel: "",
    serviceDescription: "",
    coverImage: "",
  });
  const [savingServiceProfile, setSavingServiceProfile] = useState(false);
  const [uploadingServiceCover, setUploadingServiceCover] = useState(false);
  const [projectCoverUploadingIndex, setProjectCoverUploadingIndex] =
    useState(null);
  const [newProjectLoading, setNewProjectLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const projectPreviewAttemptRef = useRef(new Set());
  const [initialData, setInitialData] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fullProfileForm, setFullProfileForm] = useState(
    createInitialFullProfileForm
  );

  useEffect(() => {
    return () => {
      if (newProjectImagePreview && newProjectImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(newProjectImagePreview);
      }
    };
  }, [newProjectImagePreview]);

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
        let location = payload.personal?.location || "";
        if (location && location.endsWith(" 0")) {
          location = location.slice(0, -2);
        }

        return {
          ...payload,
          personal: {
            ...payload.personal,
            avatar: personalAvatar,
            location: location || identityLocation,
            headline: payload.personal?.headline || identityTitle || "",
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
          available:
            payload.status !== undefined ? payload.status === "ACTIVE" : true,
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
          available: false,
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
        setIsDirty(false);
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
          available: normalized.personal?.available ?? true,
        };

        const loadedPortfolio = {
          portfolioUrl: normalized.portfolio?.portfolioUrl || "",
          linkedinUrl: normalized.portfolio?.linkedinUrl || "",
          githubUrl: normalized.portfolio?.githubUrl || "",
          resume: normalized.portfolio?.resume || normalized.resume || "",
        };

        const loadedSkills = toUniqueSkillObjects(
          Array.isArray(normalized.skills) ? normalized.skills : []
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
            available: true,
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
          setIsDirty(false);
        }
      } finally {
        if (active) setProfileLoading(false);
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [user?.id, user?.email, authFetch, user?.fullName, user?.name]);

  useEffect(() => {
    if (!initialData) return;

    const currentData = {
      personal: {
        ...personal,
        // Ensure bio is normalized for comparison just in case
        bio: normalizeBioValue(personal.bio),
      },
      portfolio,
      skills,
      workExperience,
      services,
      portfolioProjects,
      profileDetails,
    };

    setIsDirty(JSON.stringify(currentData) !== JSON.stringify(initialData));
  }, [
    personal,
    portfolio,
    skills,
    workExperience,
    services,
    portfolioProjects,
    profileDetails,
    initialData,
  ]);

  // ----- Skills -----
  const addSkill = () => {
    const name = formatSkillLabel(skillForm.name);
    if (!name) return;
    if (isNoisySkillTag(name)) {
      toast.error("Please add a specific skill or technology.");
      return;
    }

    const nextKey = getSkillDedupKey(name);
    if (!nextKey) return;

    const exists = skills.some((entry) => {
      const currentName =
        typeof entry === "string" ? entry : entry?.name;
      return getSkillDedupKey(currentName) === nextKey;
    });
    if (exists) {
      toast.info("That skill is already in your tech stack.");
      setSkillForm({ name: "" });
      setModalType(null);
      return;
    }

    setSkills((prev) => [...prev, { name }]);
    setSkillForm({ name: "" });
    setModalType(null);
  };

  const deleteSkill = (index) => {
    setSkills((prev) => prev.filter((_, i) => i !== index));
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

    setWorkForm({
      company: company ?? "",
      position: position ?? "",
      from: from ?? "",
      to: to ?? "",
      description: item.description ?? "",
    });

    setEditingIndex(index);
    setModalType("work");
  };

  const saveExperience = () => {
    const { company, position, from, to, description } = workForm;

    if (!company.trim() || !position.trim() || !from.trim()) {
      toast.error("Please fill in Company, Position, and Start Date");
      return;
    }

    const toDate = to.trim() || "Present";

    const newItem = {
      title: `${position.trim()} · ${company.trim()}`,
      period: `${from.trim()} – ${toDate}`,
      description: description.trim(),
    };

    if (editingIndex !== null) {
      setWorkExperience((prev) =>
        prev.map((item, idx) => (idx === editingIndex ? newItem : item))
      );
    } else {
      setWorkExperience((prev) => [...prev, newItem]);
    }

    setWorkForm(initialWorkForm);
    setEditingIndex(null);
    setModalType(null);
  };

  // ----- Save to backend -----
  const handleSave = async (snapshot = null) => {
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
    let currentAvatarUrl = resolveAvatarUrl(currentPersonal.avatar);

    if (selectedFile) {
      setUploadingImage(true);
      try {
        const uploadData = new FormData();
        uploadData.append("file", selectedFile);

        const uploadRes = await authFetch("/upload", {
          method: "POST",
          body: uploadData,
        });

        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          throw new Error(err.message || "Image upload failed");
        }

        const data = await uploadRes.json();
        currentAvatarUrl = data.data.url;
      } catch (uploadErr) {
        setIsSaving(false);
        setUploadingImage(false);
        console.error("Image upload failed inside save:", uploadErr);
        toast.error("Failed to upload image. Profile not saved.");
        return false;
      } finally {
        setUploadingImage(false);
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

    const profileDetailsForSave = {
      ...existingProfileDetails,
      identity: {
        ...existingIdentity,
        professionalTitle: String(currentPersonal.headline || "").trim(),
        username: String(existingIdentity.username || "").trim(),
        ...(currentAvatarUrl ? { profilePhoto: currentAvatarUrl } : {}),
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
        avatar: currentAvatarUrl,
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
        toast.error("Save failed", {
          description: "Check backend logs for more details.",
        });
        return false;
      }

      toast.success("Profile saved", {
        description: "Your profile has been updated successfully.",
      });

      const newPersonal = { ...currentPersonal, avatar: currentAvatarUrl };
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
      setIsDirty(false);
      setSelectedFile(null);
      return true;
    } catch (error) {
      console.error("Save failed", error);
      toast.error("Save failed", {
        description: "Something went wrong. Check console for details.",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // ----- Personal Details Edit (Name, Headline, Phone, Location) -----
  const openEditPersonalModal = () => {
    setModalType("personal");
  };

  const handlePersonalChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPersonal((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePersonalUsernameChange = useCallback((event) => {
    const rawValue = String(event.target.value || "");
    const normalizedUsername = rawValue
      .replace(/^@+/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 30);

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
          username: normalizedUsername,
        },
      };
    });
  }, []);

  // ----- Image Upload Logic -----
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset input so same file can be selected again if needed
    e.target.value = "";

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Store file for later upload
    setSelectedFile(file);

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPersonal((prev) => ({ ...prev, avatar: objectUrl }));
  };

  // ----- Add Custom Service -----
  const [serviceForm, setServiceForm] = useState("");
  const addService = () => {
    const name = serviceForm.trim();
    if (name && !services.includes(name)) {
      setServices((prev) => [...prev, name]);
    }
    setServiceForm("");
    setModalType(null);
  };

  const openEditServiceProfileModal = (serviceKey) => {
    const serviceDetails =
      profileDetails?.serviceDetails &&
        typeof profileDetails.serviceDetails === "object"
        ? profileDetails.serviceDetails
        : {};
    const detail =
      serviceDetails?.[serviceKey] && typeof serviceDetails[serviceKey] === "object"
        ? serviceDetails[serviceKey]
        : {};

    setServiceProfileForm({
      serviceKey,
      serviceLabel: getServiceLabel(serviceKey),
      serviceDescription: String(
        detail?.serviceDescription || detail?.description || ""
      ).trim(),
      coverImage: resolveAvatarUrl(detail?.coverImage, { allowBlob: true }),
    });
    setModalType("onboardingService");
  };

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

    const nextServiceDetails = {
      ...existingServiceDetails,
      [serviceKey]: {
        ...createServiceDetail(),
        ...currentServiceDetail,
        serviceDescription: String(
          serviceProfileForm.serviceDescription || ""
        ).trim(),
        coverImage: String(serviceProfileForm.coverImage || "").trim(),
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
      const response = await authFetch("/auth/profile", {
        method: "PUT",
        body: JSON.stringify({
          profileDetails: nextProfileDetails,
          services: nextServices,
        }),
      });

      if (!response.ok) {
        const errPayload = await response
          .json()
          .catch(() => ({ message: "Failed to save service details" }));
        throw new Error(errPayload?.message || "Failed to save service details");
      }

      setProfileDetails(nextProfileDetails);
      setServices(nextServices);
      setInitialData((prev) =>
        prev
          ? {
            ...prev,
            services: nextServices,
            profileDetails: nextProfileDetails,
          }
          : prev
      );
      toast.success(`${getServiceLabel(serviceKey)} updated`);
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
    setNewProjectImageFile(null);
    setNewProjectImagePreview((prev) => {
      if (prev && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return "";
    });
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

  const handleProjectImageChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Project image must be less than 8MB");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setNewProjectImageFile(file);
    setNewProjectImagePreview((prev) => {
      if (prev && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return objectUrl;
    });
  };

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

  const handleUrlBlur = async () => {
    const rawUrl = String(newProjectUrl || "").trim();
    if (!rawUrl) return;

    let normalizedUrl = normalizeProjectLinkValue(rawUrl);
    if (!normalizedUrl) {
      toast.error("Enter a valid project URL");
      return;
    }

    const normalizedUrlKey = normalizedUrl.toLowerCase();
    const hasDuplicate = portfolioProjects.some(
      (project) =>
        normalizeProjectLinkValue(project?.link).toLowerCase() === normalizedUrlKey
    );

    if (hasDuplicate) {
      toast.error("Project already added");
      return;
    }

    setNewProjectLoading(true);

    try {
      let previewTitle = "";
      let previewImage = null;
      let previewDescription = "";

      const previewData = await fetchProjectPreview(normalizedUrl);
      if (previewData) {
        normalizedUrl = previewData.url || normalizedUrl;
        previewTitle = previewData.title || "";
        previewImage = previewData.image || null;
        previewDescription = String(previewData.description || "").trim();
      }

      if (newProjectImageFile) {
        try {
          const uploadData = new FormData();
          uploadData.append("file", newProjectImageFile);

          const uploadResponse = await authFetch("/upload/project-image", {
            method: "POST",
            body: uploadData,
          });

          if (uploadResponse.ok) {
            const uploadPayload = await uploadResponse.json();
            if (uploadPayload?.data?.url) {
              previewImage = uploadPayload.data.url;
            }
          } else {
            const errPayload = await uploadResponse
              .json()
              .catch(() => ({ message: "Failed to upload project image" }));
            throw new Error(
              errPayload?.message || "Failed to upload project image"
            );
          }
        } catch (error) {
          console.error("Project image upload failed:", error);
          toast.error("Failed to upload project image");
        }
      }

      const fallbackTitle =
        previewTitle ||
        normalizedUrl.replace(/^https?:\/\//, "").split("/")[0] ||
        "Project";

      setPortfolioProjects((prev) => [
        ...prev,
        {
          link: normalizedUrl,
          image: previewImage,
          title: fallbackTitle,
          description: previewDescription,
        },
      ]);

      toast.success("Project added!");
      resetProjectDraft();
      setModalType(null);
    } finally {
      setNewProjectLoading(false);
    }
  };

  const removeProject = (index) => {
    setPortfolioProjects((prev) => prev.filter((_, i) => i !== index));
  };

  const openFullProfileEditor = () => {
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
      acceptInProgressProjects: String(
        currentDetails.acceptInProgressProjects || ""
      ).trim(),
      termsAccepted: Boolean(currentDetails.termsAccepted),
      professionalBio: String(
        currentDetails.professionalBio || personal.bio || ""
      ).trim(),
      education: collectEducationEntriesFromProfileDetails(currentDetails),
    });

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
      acceptInProgressProjects: String(
        fullProfileForm.acceptInProgressProjects || ""
      ).trim(),
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
  const deliveryPolicyLabel = profileDetails?.deliveryPolicyAccepted
    ? "Accepted"
    : "Not set yet";
  const communicationPolicyLabel = profileDetails?.communicationPolicyAccepted
    ? "Accepted"
    : "Not set yet";
  const acceptInProgressProjectsLabel =
    normalizeValueLabel(profileDetails?.acceptInProgressProjects) || "Not set yet";
  const onboardingServiceDetailMap =
    profileDetails?.serviceDetails &&
      typeof profileDetails.serviceDetails === "object"
      ? profileDetails.serviceDetails
      : {};
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
  const displayLocation = personal.location || onboardingIdentityLocation || "";
  const displayBio =
    String(profileDetails?.professionalBio || "").trim() ||
    normalizeBioValue(personal.bio) ||
    "";
  const experienceYearsLabel = String(personal.experienceYears ?? "").trim();
  const showExperienceYears =
    Boolean(experienceYearsLabel) && experienceYearsLabel !== "0";
  const effectiveWorkExperience = workExperience;
  const displayPortfolioProjects = useMemo(
    () =>
      (Array.isArray(portfolioProjects) ? portfolioProjects : []).map(
        (project) => {
          const currentDescription = String(project?.description || "").trim();
          if (currentDescription) return project;

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

          if (!descriptionFromOnboarding) return project;

          return {
            ...project,
            description: descriptionFromOnboarding,
          };
        }
      ),
    [portfolioProjects, onboardingProjectDescriptionMap]
  );
  const serviceEntriesMissingDescription = onboardingServiceEntries.filter(
    ({ detail }) =>
      !hasTextValue(detail?.serviceDescription || detail?.description)
  ).length;
  const serviceEntriesMissingCover = onboardingServiceEntries.filter(
    ({ detail }) => !resolveAvatarUrl(detail?.coverImage)
  ).length;
  const serviceEntriesWithAnyProfileData = onboardingServiceEntries.filter(
    ({ detail }) => {
      const description = String(
        detail?.serviceDescription || detail?.description || ""
      ).trim();
      const coverImage = resolveAvatarUrl(detail?.coverImage);
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

  const availabilityMissingDetails = [];
  if (!hasTextValue(onboardingAvailability?.hoursPerWeek)) {
    availabilityMissingDetails.push("weekly hours");
  }
  if (!hasTextValue(onboardingAvailability?.workingSchedule)) {
    availabilityMissingDetails.push("working schedule");
  }
  if (!hasTextValue(onboardingAvailability?.startTimeline)) {
    availabilityMissingDetails.push("start timeline");
  }
  const availabilityCoverage =
    (3 - availabilityMissingDetails.length) / 3;

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

  const hasProfilePhoto = Boolean(resolveAvatarUrl(personal.avatar));
  const hasProfessionalTitle = hasTextValue(onboardingIdentity?.professionalTitle);
  const hasProfessionalBio = hasTextValue(
    profileDetails?.professionalBio || personal.bio
  );
  const hasCountry = hasTextValue(onboardingIdentity?.country);
  const hasCity = hasTextValue(onboardingIdentity?.city);
  const hasSelectedServices = onboardingServiceEntries.length > 0;
  const hasFeaturedProject = portfolioProjects.length > 0;
  const hasIndustryFocus = onboardingGlobalIndustry.length > 0;

  const profileCompletionCriteria = [
    { label: "Profile photo", score: hasProfilePhoto ? 1 : 0, weight: 8 },
    {
      label: "Professional title",
      score: hasProfessionalTitle ? 1 : 0,
      weight: 8,
    },
    {
      label: "Professional bio",
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

  if (!hasProfessionalTitle) {
    profileCompletionMissingDetails.push({
      label: "Professional title",
      detail: "Add your headline or role title.",
    });
  }

  if (!hasProfessionalBio) {
    profileCompletionMissingDetails.push({
      label: "Professional bio",
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
  const profileCompletionPercent = Math.round(
    Math.max(0, Math.min(100, profileCompletionRawScore))
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
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <DashboardHeader
          userName={user?.fullName || user?.name || personal.name}
          tabLabel="Profile"
          notifications={notifications}
          unreadCount={unreadCount}
          markAllAsRead={markAllAsRead}
          handleNotificationClick={handleDashboardHeaderNotificationClick}
        />
        <main className="flex-1 overflow-y-auto pb-20">
          <div className="w-full px-6 py-8">
            <div className="rounded-3xl border border-border/50 bg-card p-10">
              <div className="flex items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading your profile...</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <DashboardHeader
        userName={user?.fullName || user?.name || personal.name}
        tabLabel="Profile"
        notifications={notifications}
        unreadCount={unreadCount}
        markAllAsRead={markAllAsRead}
        handleNotificationClick={handleDashboardHeaderNotificationClick}
      />
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="w-full px-6 py-6 md:py-8">

          {/* ── Full-width hero ── */}
          <ProfileHeroCard
            fileInputRef={fileInputRef}
            personal={personal}
            setPersonal={setPersonal}
            initials={initials}
            uploadingImage={uploadingImage}
            handleImageUpload={handleImageUpload}
            displayHeadline={displayHeadline}
            displayLocation={displayLocation}
            onboardingIdentity={onboardingIdentity}
            onboardingLanguages={onboardingLanguages}
            openEditPersonalModal={openEditPersonalModal}
          />

          {/* ── Two-column grid ── */}
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">

            {/* ── Left: Main content ── */}
            <div className="min-w-0 space-y-5">
              <ProfileAboutCard
                bioText={displayBio}
                openEditPersonalModal={openEditPersonalModal}
              />

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
                openSkillModal={() => setModalType("skill")}
              />

              <ServicesFromOnboardingCard
                onboardingServiceEntries={onboardingServiceEntries}
                getServiceLabel={getServiceLabel}
                resolveAvatarUrl={resolveAvatarUrl}
                collectServiceSpecializations={collectServiceSpecializations}
                toUniqueLabels={toUniqueLabels}
                normalizeValueLabel={normalizeValueLabel}
                openEditServiceProfileModal={openEditServiceProfileModal}
              />

              <FeaturedProjectsSection
                portfolioProjects={displayPortfolioProjects}
                projectCoverUploadingIndex={projectCoverUploadingIndex}
                handleProjectCoverInputChange={handleProjectCoverInputChange}
                removeProject={removeProject}
                onAddProject={() => {
                  resetProjectDraft();
                  setModalType("addProject");
                }}
                onViewAllProjects={() => setModalType("viewAllProjects")}
              />
            </div>

            {/* ── Right: Sidebar ── */}
            <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">
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
                splitExperienceTitle={splitExperienceTitle}
                profileDetails={profileDetails}
                openFullProfileEditor={openFullProfileEditor}
              />
            </div>

          </div>
        </div>
      </main>
      {isDirty && (
        <div className="fixed bottom-6 right-6 z-40">
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2 shadow-lg"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSaving ? "Saving..." : "Update Profile"}
          </Button>
        </div>
      )}
      {/* Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm transition-all">
          <div
            className={`w-full rounded-2xl border border-border/70 bg-card/95 backdrop-blur p-6 shadow-2xl shadow-black/50 animate-in fade-in zoom-in-95 duration-200 ${modalType === "viewAllProjects"
              ? "max-w-[60%] h-[90vh] flex flex-col"
              : modalType === "fullProfile"
                ? "max-w-5xl max-h-[90vh] overflow-y-auto"
              : modalType === "personal"
                ? "max-w-2xl max-h-[90vh] overflow-y-auto"
              : modalType === "onboardingService"
                ? "max-w-2xl"
                : "max-w-md"
              }`}
          >
            {modalType === "skill" ? (
              <>
                <h1 className="text-lg font-semibold text-foreground">
                  Add Skill
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Give the skill a name so clients can quickly scan your
                  strengths.
                </p>
                <input
                  value={skillForm.name}
                  onChange={(event) =>
                    setSkillForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Skill name"
                  className="mt-4 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                />
                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="rounded-2xl border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground hover:bg-muted/40 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addSkill}
                    className="rounded-2xl bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-background hover:bg-primary/85 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </>
            ) : modalType === "service" ? (
              <>
                <h1 className="text-lg font-semibold text-foreground">
                  Add Custom Service
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Offer a specialized service not in the default list.
                </p>
                <input
                  value={serviceForm}
                  onChange={(event) => setServiceForm(event.target.value)}
                  placeholder="Service name (e.g. Rust Development)"
                  className="mt-4 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                />
                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="rounded-2xl border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground hover:bg-muted/40 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addService}
                    className="rounded-2xl bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-background hover:bg-primary/85 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </>
            ) : modalType === "onboardingService" ? (
              <>
                <h1 className="text-lg font-semibold text-foreground">
                  Edit Service Profile
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Update description and cover image for{" "}
                  <span className="text-foreground font-medium">
                    {serviceProfileForm.serviceLabel || "this service"}
                  </span>
                  .
                </p>
                <div className="mt-4 space-y-4">
                  <label className="block text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                    Service Description
                    <textarea
                      value={serviceProfileForm.serviceDescription}
                      onChange={(event) =>
                        setServiceProfileForm((prev) => ({
                          ...prev,
                          serviceDescription: event.target.value,
                        }))
                      }
                      rows={5}
                      placeholder="Describe what you deliver for this service."
                      className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                    />
                  </label>

                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                      Service Cover Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      className="mt-2 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-xl file:border file:border-border file:bg-card file:px-3 file:py-1 file:text-xs file:font-semibold file:text-foreground"
                      onChange={handleServiceCoverImageChange}
                    />
                    {serviceProfileForm.coverImage ? (
                      <div className="mt-3 overflow-hidden rounded-xl border border-border">
                        <img
                          src={serviceProfileForm.coverImage}
                          alt={`${serviceProfileForm.serviceLabel || "Service"} cover`}
                          className="h-44 w-full object-cover"
                        />
                        <div className="p-2 border-t border-border bg-background/60 flex justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              setServiceProfileForm((prev) => ({
                                ...prev,
                                coverImage: "",
                              }))
                            }
                            className="rounded-lg border border-border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:bg-muted/40 transition-colors"
                          >
                            Remove Cover
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="rounded-2xl border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground hover:bg-muted/40 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveOnboardingServiceProfile}
                    disabled={savingServiceProfile || uploadingServiceCover}
                    className="rounded-2xl bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-background hover:bg-primary/85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                  >
                    {(savingServiceProfile || uploadingServiceCover) && (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    )}
                    Save
                  </button>
                </div>
              </>
            ) : modalType === "addProject" ? (
              <>
                <h1 className="text-lg font-semibold text-foreground">
                  Add Project
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter a project URL to add it to your portfolio.
                </p>
                <input
                  value={newProjectUrl}
                  onChange={(e) => setNewProjectUrl(e.target.value)}
                  placeholder="https://yourproject.com"
                  className="mt-4 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleUrlBlur();
                    }
                  }}
                />
                <label className="mt-3 block text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                  Project Image (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-xl file:border file:border-border file:bg-card file:px-3 file:py-1 file:text-xs file:font-semibold file:text-foreground"
                  onChange={handleProjectImageChange}
                />
                {newProjectImagePreview ? (
                  <div className="mt-3 overflow-hidden rounded-xl border border-border">
                    <img
                      src={newProjectImagePreview}
                      alt="Project preview"
                      className="h-36 w-full object-cover"
                    />
                  </div>
                ) : null}
                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      resetProjectDraft();
                      setModalType(null);
                    }}
                    className="rounded-2xl border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground hover:bg-muted/40 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUrlBlur}
                    disabled={newProjectLoading || !newProjectUrl.trim()}
                    className="rounded-2xl bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-background hover:bg-primary/85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {newProjectLoading && (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    )}
                    Add
                  </button>
                </div>
              </>
            ) : modalType === "viewAllProjects" ? (
              <>
                <h1 className="text-lg font-semibold text-foreground">
                  All Projects
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {displayPortfolioProjects.length} project
                  {displayPortfolioProjects.length !== 1 ? "s" : ""} in your
                  portfolio
                </p>
                <div className="mt-4 flex-1 overflow-y-auto">
                  {displayPortfolioProjects.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {displayPortfolioProjects.map((project, idx) => (
                        <div
                          key={idx}
                          className="group flex flex-col p-3 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
                        >
                          <div className="w-full h-40 rounded-lg overflow-hidden bg-muted mb-2">
                            <ProjectCoverMedia
                              project={project}
                              containerClassName="h-full w-full"
                              imageClassName="h-full w-full object-cover"
                              fallbackTitleClassName="text-xl"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4
                              className="font-medium text-sm truncate"
                              title={project.title || project.link}
                            >
                              {project.title || "Project"}
                            </h4>
                            {project.description ? (
                              <p
                                className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed"
                                title={project.description}
                              >
                                {project.description}
                              </p>
                            ) : null}
                            <p
                              className="mt-1 text-xs text-muted-foreground truncate"
                              title={project.link}
                            >
                              {project.link}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {project.link ? (
                              <a
                                href={project.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-1 p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                                title="Visit Project"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Visit
                              </a>
                            ) : (
                              <span className="flex-1 flex items-center justify-center gap-1 p-1.5 rounded-lg bg-secondary/40 text-muted-foreground/60 text-xs cursor-not-allowed">
                                <ExternalLink className="w-3 h-3" />
                                No Link
                              </span>
                            )}
                            <label
                              htmlFor={`project-cover-modal-${idx}`}
                              className="flex items-center justify-center gap-1 p-1.5 rounded-lg bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors text-xs cursor-pointer"
                              title="Upload cover image"
                            >
                              {projectCoverUploadingIndex === idx ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Camera className="w-3 h-3" />
                              )}
                              Cover
                            </label>
                            <input
                              id={`project-cover-modal-${idx}`}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(event) =>
                                handleProjectCoverInputChange(idx, event)
                              }
                            />
                            <button
                              onClick={() => removeProject(idx)}
                              className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors"
                              title="Remove Project"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No projects added yet.</p>
                      <button
                        className="mt-2 text-primary text-sm hover:underline"
                        onClick={() => {
                          resetProjectDraft();
                          setModalType("addProject");
                        }}
                      >
                        Add your first project
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-5 flex justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary"
                    onClick={() => {
                      resetProjectDraft();
                      setModalType("addProject");
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Project
                  </Button>
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="rounded-2xl border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground hover:bg-muted/40 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : modalType === "portfolio" ? (
              <>
                <h1 className="text-lg font-semibold text-foreground">
                  Edit Online Presence
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Update your social and portfolio links.
                </p>
                <div className="mt-4 space-y-4">
                  <label className="block text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                    Portfolio Website
                    <input
                      value={portfolio.portfolioUrl}
                      onChange={(e) =>
                        setPortfolio((prev) => ({
                          ...prev,
                          portfolioUrl: e.target.value,
                        }))
                      }
                      placeholder="https://yourportfolio.com"
                      className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                    />
                  </label>
                  <label className="block text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                    LinkedIn URL
                    <input
                      value={portfolio.linkedinUrl}
                      onChange={(e) =>
                        setPortfolio((prev) => ({
                          ...prev,
                          linkedinUrl: e.target.value,
                        }))
                      }
                      placeholder="https://linkedin.com/..."
                      className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                    />
                  </label>
                  <label className="block text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                    GitHub URL (Optional)
                    <input
                      value={portfolio.githubUrl}
                      onChange={(e) =>
                        setPortfolio((prev) => ({
                          ...prev,
                          githubUrl: e.target.value,
                        }))
                      }
                      placeholder="https://github.com/..."
                      className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                    />
                  </label>
                </div>

                {/* Resume Upload Section */}
                <div className="mt-4 pt-4 border-t border-border">
                  <label className="block text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-2">
                    Resume / CV
                  </label>

                  <div className="flex items-center gap-3">
                    {/* Hidden File Input */}
                    <input
                      type="file"
                      id="resume-upload"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;

                        // Check size (5MB)
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error("File is too large (max 5MB)");
                          return;
                        }

                        const formData = new FormData();
                        formData.append("file", file);

                        const toastId = toast.loading("Uploading resume...");

                        try {
                          const res = await authFetch("/upload/resume", {
                            method: "POST",
                            body: formData,
                          });

                          if (!res.ok) {
                            const errorData = await res
                              .json()
                              .catch(() => ({}));
                            throw new Error(
                              errorData.message || "Upload failed"
                            );
                          }

                          const data = await res.json();
                          const resumeUrl = data.data.url;
                          const nextPortfolio = {
                            ...portfolio,
                            resume: resumeUrl,
                          };

                          setPortfolio(nextPortfolio);

                          try {
                            // Save resume URL to profile
                            const resumeEmail = personal.email || user?.email;
                            const saveRes = await authFetch("/profile", {
                              method: "POST",
                              body: JSON.stringify({
                                personal: { email: resumeEmail },
                                resume: resumeUrl,
                                portfolio: nextPortfolio,
                              }),
                            });

                            if (!saveRes.ok) {
                              throw new Error("Resume save failed");
                            }
                            console.log(
                              "[Resume] Saved to database successfully"
                            );
                          } catch (saveErr) {
                            console.error(saveErr);
                            toast.error(
                              "Resume uploaded, but failed to save profile",
                              { id: toastId }
                            );
                            return;
                          }

                          toast.success("Resume uploaded!", { id: toastId });
                        } catch (err) {
                          console.error(err);
                          toast.error("Failed to upload resume", {
                            id: toastId,
                          });
                        }

                        // Reset input
                        e.target.value = "";
                      }}
                    />

                    {/* Upload Button */}
                    <label
                      htmlFor="resume-upload"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/70 cursor-pointer transition-colors border border-border text-sm font-medium"
                    >
                      <Briefcase className="w-4 h-4" />
                      {portfolio.resume ? "Update Resume" : "Upload Resume"}
                    </label>

                    {/* View/Download Link if exists */}
                    {portfolio.resume && (
                      <a
                        href={portfolio.resume}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline truncate max-w-[200px]"
                        title={portfolio.resume}
                      >
                        View Current Resume
                      </a>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5 ml-1">
                    Accepts PDF, DOC, DOCX (Max 5MB)
                  </p>
                </div>

                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="rounded-2xl border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground hover:bg-muted/40 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </>
            ) : modalType === "fullProfile" ? (
              <>
                <div className="space-y-6">
                  <div>
                    <h1 className="text-xl font-semibold text-foreground">
                      Edit Full Profile
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Update your onboarding profile details and save directly to
                      database.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                    <h2 className="text-sm font-semibold text-foreground">
                      Identity
                    </h2>
                    <div className="mt-3 grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label
                          htmlFor="full-professional-title"
                          className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
                        >
                          Professional Title
                        </Label>
                        <Input
                          id="full-professional-title"
                          name="professionalTitle"
                          value={fullProfileForm.professionalTitle}
                          onChange={handleFullProfileFieldChange}
                          placeholder="e.g. Full Stack Developer"
                          className="h-10 bg-background/70"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="full-username"
                          className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
                        >
                          Username
                        </Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            @
                          </span>
                          <Input
                            id="full-username"
                            name="username"
                            value={fullProfileForm.username}
                            onChange={handleFullProfileFieldChange}
                            placeholder="username"
                            className="h-10 bg-background/70 pl-7"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="full-country"
                          className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
                        >
                          Country
                        </Label>
                        <Input
                          id="full-country"
                          name="country"
                          value={fullProfileForm.country}
                          onChange={handleFullProfileFieldChange}
                          placeholder="Country"
                          className="h-10 bg-background/70"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="full-city"
                          className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
                        >
                          City
                        </Label>
                        <Input
                          id="full-city"
                          name="city"
                          value={fullProfileForm.city}
                          onChange={handleFullProfileFieldChange}
                          placeholder="City"
                          className="h-10 bg-background/70"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label
                          htmlFor="full-languages"
                          className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
                        >
                          Languages
                        </Label>
                        <Input
                          id="full-languages"
                          name="languages"
                          value={fullProfileForm.languages}
                          onChange={handleFullProfileFieldChange}
                          placeholder="English, Hindi"
                          className="h-10 bg-background/70"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label
                          htmlFor="full-other-language"
                          className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
                        >
                          Other Language
                        </Label>
                        <Input
                          id="full-other-language"
                          name="otherLanguage"
                          value={fullProfileForm.otherLanguage}
                          onChange={handleFullProfileFieldChange}
                          placeholder="Optional additional language"
                          className="h-10 bg-background/70"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                    <h2 className="text-sm font-semibold text-foreground">
                      Work Preferences
                    </h2>
                    <div className="mt-3 grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label
                          htmlFor="full-role"
                          className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
                        >
                          Work Style
                        </Label>
                        <select
                          id="full-role"
                          name="role"
                          value={fullProfileForm.role}
                          onChange={handleFullProfileFieldChange}
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        >
                          <option value="">Select role</option>
                          <option value="individual">Individual Freelancer</option>
                          <option value="agency">Agency / Studio</option>
                          <option value="part_time">Part-Time Freelancer</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="full-hours"
                          className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
                        >
                          Weekly Availability
                        </Label>
                        <select
                          id="full-hours"
                          name="hoursPerWeek"
                          value={fullProfileForm.hoursPerWeek}
                          onChange={handleFullProfileFieldChange}
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        >
                          <option value="">Select availability</option>
                          <option value="less_than_10">
                            Less than 10 hours/week
                          </option>
                          <option value="10_20">10-20 hours/week</option>
                          <option value="20_30">20-30 hours/week</option>
                          <option value="30_plus">30+ hours/week</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="full-schedule"
                          className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
                        >
                          Working Schedule
                        </Label>
                        <Input
                          id="full-schedule"
                          name="workingSchedule"
                          value={fullProfileForm.workingSchedule}
                          onChange={handleFullProfileFieldChange}
                          placeholder="e.g. Weekdays"
                          className="h-10 bg-background/70"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="full-start-timeline"
                          className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
                        >
                          Start Timeline
                        </Label>
                        <Input
                          id="full-start-timeline"
                          name="startTimeline"
                          value={fullProfileForm.startTimeline}
                          onChange={handleFullProfileFieldChange}
                          placeholder="e.g. Immediate"
                          className="h-10 bg-background/70"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="full-missed-deadlines"
                          className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
                        >
                          Missed Deadlines
                        </Label>
                        <Input
                          id="full-missed-deadlines"
                          name="missedDeadlines"
                          value={fullProfileForm.missedDeadlines}
                          onChange={handleFullProfileFieldChange}
                          placeholder="e.g. Never"
                          className="h-10 bg-background/70"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="full-delay-handling"
                          className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
                        >
                          Delay Handling
                        </Label>
                        <Input
                          id="full-delay-handling"
                          name="delayHandling"
                          value={fullProfileForm.delayHandling}
                          onChange={handleFullProfileFieldChange}
                          placeholder="e.g. Communicate early"
                          className="h-10 bg-background/70"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                    <h2 className="text-sm font-semibold text-foreground">
                      Policies And Industry Focus
                    </h2>
                    <div className="mt-3 grid gap-4 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <Label
                          htmlFor="full-industry-focus"
                          className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
                        >
                          Industry Focus
                        </Label>
                        <Input
                          id="full-industry-focus"
                          name="globalIndustryFocus"
                          value={fullProfileForm.globalIndustryFocus}
                          onChange={handleFullProfileFieldChange}
                          placeholder="SaaS, Healthcare, Ecommerce"
                          className="h-10 bg-background/70"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label
                          htmlFor="full-accept-projects"
                          className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
                        >
                          Take Over In-Progress Projects
                        </Label>
                        <select
                          id="full-accept-projects"
                          name="acceptInProgressProjects"
                          value={fullProfileForm.acceptInProgressProjects}
                          onChange={handleFullProfileFieldChange}
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        >
                          <option value="">Select option</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                          <option value="open">Open to all</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/50 px-3 py-2.5">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Delivery Policy Accepted
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Confirms delivery terms.
                          </p>
                        </div>
                        <Switch
                          checked={Boolean(fullProfileForm.deliveryPolicyAccepted)}
                          onCheckedChange={(checked) =>
                            setFullProfileForm((prev) => ({
                              ...prev,
                              deliveryPolicyAccepted: checked,
                            }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/50 px-3 py-2.5">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Communication Policy Accepted
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Confirms communication terms.
                          </p>
                        </div>
                        <Switch
                          checked={Boolean(
                            fullProfileForm.communicationPolicyAccepted
                          )}
                          onCheckedChange={(checked) =>
                            setFullProfileForm((prev) => ({
                              ...prev,
                              communicationPolicyAccepted: checked,
                            }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/50 px-3 py-2.5 md:col-span-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Terms Accepted
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Confirms profile terms and conditions.
                          </p>
                        </div>
                        <Switch
                          checked={Boolean(fullProfileForm.termsAccepted)}
                          onCheckedChange={(checked) =>
                            setFullProfileForm((prev) => ({
                              ...prev,
                              termsAccepted: checked,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-sm font-semibold text-foreground">
                        Education
                      </h2>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addEducationEntry}
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        Add
                      </Button>
                    </div>

                    <div className="mt-3 space-y-3">
                      {(Array.isArray(fullProfileForm.education)
                        ? fullProfileForm.education
                        : []
                      ).map((entry, index) => (
                        <div
                          key={`education-row-${index}`}
                          className="rounded-lg border border-border/60 bg-background/50 p-3"
                        >
                          <div className="grid gap-3 md:grid-cols-2">
                            <Input
                              value={entry.school || ""}
                              onChange={(event) =>
                                handleEducationFieldChange(
                                  index,
                                  "school",
                                  event.target.value
                                )
                              }
                              placeholder="School / University"
                              className="h-10 bg-background/80"
                            />
                            <Input
                              value={entry.degree || ""}
                              onChange={(event) =>
                                handleEducationFieldChange(
                                  index,
                                  "degree",
                                  event.target.value
                                )
                              }
                              placeholder="Degree"
                              className="h-10 bg-background/80"
                            />
                            <Input
                              value={entry.field || ""}
                              onChange={(event) =>
                                handleEducationFieldChange(
                                  index,
                                  "field",
                                  event.target.value
                                )
                              }
                              placeholder="Field / Specialization"
                              className="h-10 bg-background/80"
                            />
                            <Input
                              value={entry.country || ""}
                              onChange={(event) =>
                                handleEducationFieldChange(
                                  index,
                                  "country",
                                  event.target.value
                                )
                              }
                              placeholder="Country"
                              className="h-10 bg-background/80"
                            />
                            <Input
                              value={entry.graduationYear || ""}
                              onChange={(event) =>
                                handleEducationFieldChange(
                                  index,
                                  "graduationYear",
                                  event.target.value
                                )
                              }
                              placeholder="Graduation Year"
                              className="h-10 bg-background/80 md:col-span-2"
                            />
                          </div>
                          {(Array.isArray(fullProfileForm.education)
                            ? fullProfileForm.education.length
                            : 0) > 1 ? (
                            <div className="mt-2 flex justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeEducationEntry(index)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                Remove
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                    <Label
                      htmlFor="full-professional-bio"
                      className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
                    >
                      Professional Bio
                    </Label>
                    <Textarea
                      id="full-professional-bio"
                      name="professionalBio"
                      value={fullProfileForm.professionalBio}
                      onChange={handleFullProfileFieldChange}
                      rows={5}
                      placeholder="Tell clients about your strengths, execution style, and outcomes..."
                      className="mt-2 min-h-[120px] resize-y bg-background/70"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-border/70 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setModalType(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={saveFullProfileEditor}
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              </>
            ) : modalType === "personal" ? (
              <>
                <div className="space-y-5">
                  <div>
                    <h1 className="text-xl font-semibold text-foreground">
                      Edit Personal Details
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Update your public profile information shown to clients.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <Label
                          htmlFor="freelancer-available-switch"
                          className="text-sm font-semibold tracking-normal"
                        >
                          Available for work
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Show that you are currently open to new projects.
                        </p>
                      </div>
                      <Switch
                        id="freelancer-available-switch"
                        checked={Boolean(personal.available)}
                        onCheckedChange={(checked) =>
                          setPersonal((prev) => ({ ...prev, available: checked }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="personal-headline" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Headline
                      </Label>
                      <Input
                        id="personal-headline"
                        name="headline"
                        value={personal.headline || ""}
                        onChange={handlePersonalChange}
                        placeholder="e.g. Full Stack Developer"
                        className="h-10 bg-background/70"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="personal-experience" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Years of Experience
                      </Label>
                      <Input
                        id="personal-experience"
                        name="experienceYears"
                        type="number"
                        min="0"
                        value={personal.experienceYears || ""}
                        onChange={handlePersonalChange}
                        placeholder="e.g. 5"
                        className="h-10 bg-background/70"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="personal-name" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Display Name
                      </Label>
                      <Input
                        id="personal-name"
                        name="name"
                        value={personal.name || ""}
                        onChange={handlePersonalChange}
                        placeholder="Your Name"
                        className="h-10 bg-background/70"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="personal-username" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Username
                      </Label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          @
                        </span>
                        <Input
                          id="personal-username"
                          value={String(onboardingIdentity?.username || "")}
                          onChange={handlePersonalUsernameChange}
                          placeholder="username"
                          className="h-10 bg-background/70 pl-7"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="personal-phone" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Phone
                      </Label>
                      <Input
                        id="personal-phone"
                        name="phone"
                        value={personal.phone || ""}
                        onChange={handlePersonalChange}
                        placeholder="+91..."
                        className="h-10 bg-background/70"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="personal-location" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Location
                      </Label>
                      <Input
                        id="personal-location"
                        name="location"
                        value={personal.location || ""}
                        onChange={handlePersonalChange}
                        placeholder="City, Country"
                        className="h-10 bg-background/70"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="personal-bio" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Bio / About Me
                    </Label>
                    <Textarea
                      id="personal-bio"
                      name="bio"
                      value={personal.bio || ""}
                      onChange={handlePersonalChange}
                      rows={6}
                      placeholder="Tell clients about your expertise, outcomes, and communication style..."
                      className="min-h-[140px] resize-y bg-background/70"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
                    <p className="text-xs text-muted-foreground">
                      Click <span className="font-medium text-foreground">Update Profile</span> to save all changes.
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setModalType(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setModalType(null)}
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-lg font-semibold text-foreground">
                  {editingIndex !== null
                    ? "Edit Work Experience"
                    : "Add Work Experience"}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Capture your role, timeline, and the impact you had.
                </p>

                <label className="mt-3 block text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                  Company
                  <input
                    value={workForm.company}
                    onChange={(event) =>
                      setWorkForm((prev) => ({
                        ...prev,
                        company: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                  />
                </label>

                <label className="mt-3 block text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                  Position
                  <input
                    value={workForm.position}
                    onChange={(event) =>
                      setWorkForm((prev) => ({
                        ...prev,
                        position: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                  />
                </label>

                <div className="mt-3 grid gap-6 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                      From
                    </span>
                    <Popover modal={true}>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal rounded-2xl border-border bg-background px-3 py-2 h-auto hover:bg-background",
                            !workForm.from && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {workForm.from ? (
                            workForm.from
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={(() => {
                            if (!workForm.from) return undefined;
                            const d = parse(
                              workForm.from,
                              "MMM yyyy",
                              new Date()
                            );
                            return isValid(d) ? d : undefined;
                          })()}
                          onSelect={(date) => {
                            if (date) {
                              setWorkForm((prev) => ({
                                ...prev,
                                from: format(date, "MMM yyyy"),
                              }));
                            }
                          }}
                          initialFocus
                          captionLayout="dropdown"
                          startMonth={new Date(1980, 0)}
                          endMonth={new Date(2030, 11)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                        To
                      </span>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="present"
                          checked={workForm.to === "Present"}
                          onCheckedChange={(checked) => {
                            setWorkForm((prev) => ({
                              ...prev,
                              to: checked ? "Present" : "",
                            }));
                          }}
                        />
                        <label
                          htmlFor="present"
                          className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-muted-foreground"
                        >
                          Present
                        </label>
                      </div>
                    </div>

                    <Popover modal={true}>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          disabled={workForm.to === "Present"}
                          className={cn(
                            "w-full justify-start text-left font-normal rounded-2xl border-border bg-background px-3 py-2 h-auto hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed",
                            !workForm.to && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {workForm.to === "Present" ? (
                            "Present"
                          ) : workForm.to ? (
                            workForm.to
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={(() => {
                            if (!workForm.to || workForm.to === "Present")
                              return undefined;
                            const d = parse(
                              workForm.to,
                              "MMM yyyy",
                              new Date()
                            );
                            return isValid(d) ? d : undefined;
                          })()}
                          onSelect={(date) => {
                            if (date) {
                              setWorkForm((prev) => ({
                                ...prev,
                                to: format(date, "MMM yyyy"),
                              }));
                            }
                          }}
                          initialFocus
                          captionLayout="dropdown"
                          startMonth={new Date(1980, 0)}
                          endMonth={new Date(2030, 11)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <label className="mt-3 block text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                  Description
                  <textarea
                    value={workForm.description}
                    onChange={(event) =>
                      setWorkForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    rows={3}
                    className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                  />
                </label>

                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setModalType(null);
                      setEditingIndex(null);
                      setWorkForm(initialWorkForm);
                    }}
                    className="rounded-2xl border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground hover:bg-muted/40 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveExperience}
                    className="rounded-2xl bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-background hover:bg-primary/85 transition-colors"
                  >
                    {editingIndex !== null ? "Update" : "Save"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const FreelancerProfileWrapper = () => {
  return (
    <RoleAwareSidebar>
      <FreelancerProfile />
    </RoleAwareSidebar>
  );
};

export default FreelancerProfileWrapper;
