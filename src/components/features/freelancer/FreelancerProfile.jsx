import Plus from "lucide-react/dist/esm/icons/plus";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import Edit2 from "lucide-react/dist/esm/icons/edit-2";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import X from "lucide-react/dist/esm/icons/x";
import Camera from "lucide-react/dist/esm/icons/camera";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import User from "lucide-react/dist/esm/icons/user";
import Rocket from "lucide-react/dist/esm/icons/rocket";
import Cpu from "lucide-react/dist/esm/icons/cpu";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import Github from "lucide-react/dist/esm/icons/github";
import Linkedin from "lucide-react/dist/esm/icons/linkedin";
import Globe from "lucide-react/dist/esm/icons/globe";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import FileText from "lucide-react/dist/esm/icons/file-text";
import { useEffect, useState, useRef, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, parse, isValid } from "date-fns";
import { cn } from "@/shared/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { FreelancerTopBar } from "@/components/features/freelancer/FreelancerTopBar";
import { RoleAwareSidebar } from "@/components/layout/RoleAwareSidebar";
import { useAuth } from "@/shared/context/AuthContext";
import {
  getServiceLabel,
  createServiceDetail,
} from "@/components/features/freelancer/onboarding/utils";
import { getFreelancerOnboardingStorageKeys } from "@/components/features/freelancer/onboarding/storage";
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

const ONBOARDING_ROLE_LABELS = {
  individual: "Individual Freelancer",
  agency: "Agency / Studio",
  part_time: "Part-Time Freelancer",
};

const EXPERIENCE_VALUE_LABELS = {
  less_than_1: "Less than 1 year",
  "1_3": "1-3 years",
  "3_5": "3-5 years",
  "5_plus": "5+ years",
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
  const separators = [" · ", " • ", " Â· ", " - "];

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
  const separators = [" – ", " â€“ ", " - "];

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

const gradients = [
  "bg-linear-to-r from-pink-500 via-purple-500 to-indigo-500",
  "bg-linear-to-r from-cyan-500 via-blue-500 to-indigo-500",
  "bg-linear-to-r from-rose-500 via-orange-500 to-yellow-500",
  "bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500",
  "bg-linear-to-r from-violet-600 via-purple-500 to-fuchsia-500",
  "bg-linear-to-r from-blue-400 via-indigo-500 to-purple-500",
  "bg-linear-to-r from-fuchsia-500 via-pink-500 to-rose-500",
  "bg-linear-to-r from-orange-400 via-red-500 to-rose-500",
];

const FreelancerProfile = () => {
  const navigate = useNavigate();
  const { user, authFetch } = useAuth();
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
  const [projectCoverUploadingIndex, setProjectCoverUploadingIndex] =
    useState(null);
  const [newProjectLoading, setNewProjectLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [initialData, setInitialData] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Random gradient for banner
  const randomGradient = useMemo(() => {
    return gradients[Math.floor(Math.random() * gradients.length)];
  }, []);
  const onboardingStorageKeys = useMemo(
    () => getFreelancerOnboardingStorageKeys(user),
    [user?.id, user?.email]
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
    };

    setIsDirty(JSON.stringify(currentData) !== JSON.stringify(initialData));
  }, [
    personal,
    portfolio,
    skills,
    workExperience,
    services,
    portfolioProjects,
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

  const deleteExperience = (index) => {
    setWorkExperience((prev) => prev.filter((_, i) => i !== index));
  };

  // ----- Save to backend -----
  const handleSave = async () => {
    if (!personal.email) {
      toast.error("Cannot save profile", {
        description: "Missing email on your profile.",
      });
      return;
    }

    setIsSaving(true);

    // Validation removed as per user request
    // const isDeveloper = services.some(s => ...);
    // if (isDeveloper && !portfolio.githubUrl?.trim()) ...

    const skillsForApi = toUniqueSkillNames(skills);

    // Check if we need to upload an image first
    let currentAvatarUrl = resolveAvatarUrl(personal.avatar);

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
        console.log("New Avatar URL from upload:", currentAvatarUrl);
      } catch (uploadErr) {
        setIsSaving(false);
        setUploadingImage(false);
        console.error("Image upload failed inside save:", uploadErr);
        toast.error("Failed to upload image. Profile not saved.");
        return;
      } finally {
        setUploadingImage(false);
      }
    }

    const bioText = normalizeBioValue(personal.bio);

    const payload = {
      personal: {
        name: personal.name,
        email: personal.email,
        phone: personal.phone,
        location: personal.location,
        headline: personal.headline,
        bio: bioText,
        experienceYears: personal.experienceYears,
        available: personal.available,
        avatar: currentAvatarUrl, // Use the new real URL or existing
      },
      bio: bioText,
      skills: skillsForApi,
      workExperience,
      services,
      portfolio, // Add portfolio to payload
      resume: portfolio.resume, // Make sure resume is saved at top level if needed
      portfolioProjects, // Add portfolioProjects to payload
    };

    console.log("Saving profile payload:", payload);

    try {
      const response = await authFetch("/profile", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        toast.error("Save failed", {
          description: "Check backend logs for more details.",
        });
        return; // Finally block will handle setIsSaving(false)
      }

      toast.success("Profile saved", {
        description: "Your profile has been updated successfully.",
      });

      // Update local state to reflect saved changes (esp if avatar changed)
      const newPersonal = { ...personal, avatar: currentAvatarUrl };
      setPersonal((prev) => ({ ...prev, avatar: currentAvatarUrl }));

      setInitialData({
        personal: newPersonal,
        portfolio,
        skills,
        workExperience,
        services,
        portfolioProjects,
      });
      setIsDirty(false);
      setSelectedFile(null);
    } catch (error) {
      console.error("Save failed", error);
      toast.error("Save failed", {
        description: "Something went wrong. Check console for details.",
      });
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

    let normalizedUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const hasDuplicate = portfolioProjects.some(
      (project) =>
        String(project?.link || "").trim().toLowerCase() ===
        normalizedUrl.toLowerCase()
    );

    if (hasDuplicate) {
      toast.error("Project already added");
      return;
    }

    setNewProjectLoading(true);

    try {
      let previewTitle = "";
      let previewImage = null;

      try {
        const previewResponse = await authFetch("/upload/project-preview", {
          method: "POST",
          body: JSON.stringify({ url: normalizedUrl }),
        });

        if (previewResponse.ok) {
          const payload = await previewResponse.json();
          if (payload?.success && payload?.data) {
            normalizedUrl = payload.data.url || normalizedUrl;
            previewTitle = payload.data.title || "";
            previewImage = payload.data.image || null;
          }
        }
      } catch (error) {
        console.warn("Project metadata fetch failed:", error);
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
    const identity =
      profileDetails?.identity && typeof profileDetails.identity === "object"
        ? profileDetails.identity
        : {};
    const availability =
      profileDetails?.availability && typeof profileDetails.availability === "object"
        ? profileDetails.availability
        : {};
    const reliability =
      profileDetails?.reliability && typeof profileDetails.reliability === "object"
        ? profileDetails.reliability
        : {};
    const rawServiceDetails =
      profileDetails?.serviceDetails &&
      typeof profileDetails.serviceDetails === "object"
        ? profileDetails.serviceDetails
        : {};

    const selectedServices = Array.from(
      new Set([
        ...(Array.isArray(profileDetails?.services) ? profileDetails.services : []),
        ...(Array.isArray(services) ? services : []),
      ])
    )
      .map((entry) => String(entry || "").trim())
      .filter(Boolean);

    const serviceDetailsDraft = selectedServices.reduce((acc, serviceKey) => {
      const fallback = createServiceDetail();
      const current =
        rawServiceDetails?.[serviceKey] &&
        typeof rawServiceDetails[serviceKey] === "object"
          ? rawServiceDetails[serviceKey]
          : {};

      acc[serviceKey] = {
        ...fallback,
        ...current,
        caseStudy: {
          ...fallback.caseStudy,
          ...(current?.caseStudy && typeof current.caseStudy === "object"
            ? current.caseStudy
            : {}),
        },
        groups:
          current?.groups && typeof current.groups === "object"
            ? current.groups
            : {},
        groupOther:
          current?.groupOther && typeof current.groupOther === "object"
            ? current.groupOther
            : {},
        projects: Array.isArray(current?.projects) ? current.projects : [],
      };

      return acc;
    }, {});

    const profilePhotoUrl =
      resolveAvatarUrl(identity?.profilePhoto, { allowBlob: true }) ||
      resolveAvatarUrl(personal.avatar, { allowBlob: true });

    const onboardingDraft = {
      professionalTitle: String(
        identity?.professionalTitle || personal.headline || ""
      ).trim(),
      username: String(identity?.username || "").trim(),
      country: String(identity?.country || "").trim(),
      city: String(identity?.city || "").trim(),
      profilePhoto: profilePhotoUrl
        ? {
            url: profilePhotoUrl,
            uploadedUrl: profilePhotoUrl,
            name: "profile-photo",
          }
        : null,
      languages: Array.isArray(identity?.languages) ? identity.languages : [],
      otherLanguage: String(identity?.otherLanguage || "").trim(),
      linkedinUrl: String(
        identity?.linkedinUrl || portfolio.linkedinUrl || ""
      ).trim(),
      portfolioUrl: String(
        identity?.portfolioUrl || portfolio.portfolioUrl || ""
      ).trim(),
      role: String(profileDetails?.role || "").trim(),
      globalIndustryFocus: Array.isArray(profileDetails?.globalIndustryFocus)
        ? profileDetails.globalIndustryFocus
        : [],
      globalIndustryOther: String(profileDetails?.globalIndustryOther || "").trim(),
      selectedServices,
      serviceDetails: serviceDetailsDraft,
      deliveryPolicyAccepted: Boolean(profileDetails?.deliveryPolicyAccepted),
      hoursPerWeek: String(availability?.hoursPerWeek || "").trim(),
      workingSchedule: String(availability?.workingSchedule || "").trim(),
      startTimeline: String(availability?.startTimeline || "").trim(),
      missedDeadlines: String(reliability?.missedDeadlines || "").trim(),
      delayHandling: String(reliability?.delayHandling || "").trim(),
      communicationPolicyAccepted: Boolean(
        profileDetails?.communicationPolicyAccepted
      ),
      acceptInProgressProjects: String(
        profileDetails?.acceptInProgressProjects || ""
      ).trim(),
      termsAccepted: Boolean(profileDetails?.termsAccepted),
      professionalBio: String(
        profileDetails?.professionalBio || personal.bio || ""
      ).trim(),
      fullName: String(personal.name || user?.fullName || "").trim(),
      email: String(personal.email || user?.email || "").trim(),
      password: "",
    };

    localStorage.setItem(
      onboardingStorageKeys.dataKey,
      JSON.stringify(onboardingDraft)
    );
    localStorage.setItem(onboardingStorageKeys.stepKey, "0");
    navigate("/freelancer/onboarding?mode=edit");
  };

  const onboardingIdentity =
    profileDetails?.identity && typeof profileDetails.identity === "object"
      ? profileDetails.identity
      : {};
  const onboardingRole = String(profileDetails?.role || "").trim();
  const onboardingRoleLabel =
    ONBOARDING_ROLE_LABELS[onboardingRole] ||
    normalizeValueLabel(onboardingRole) ||
    "Not set";
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
  const onboardingReliability =
    profileDetails?.reliability && typeof profileDetails.reliability === "object"
      ? profileDetails.reliability
      : {};
  const onboardingServiceDetailMap =
    profileDetails?.serviceDetails &&
      typeof profileDetails.serviceDetails === "object"
      ? profileDetails.serviceDetails
      : {};
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
  const onboardingIdentityLocation = buildLocationFromIdentity(onboardingIdentity);
  const displayHeadline =
    String(onboardingIdentity?.professionalTitle || "").trim() ||
    personal.headline ||
    "Senior Full Stack Developer";
  const displayLocation = onboardingIdentityLocation || personal.location || "";
  const experienceYearsLabel = String(personal.experienceYears ?? "").trim();
  const showExperienceYears =
    Boolean(experienceYearsLabel) && experienceYearsLabel !== "0";
  const onboardingDerivedWorkExperience = normalizeWorkExperienceEntries(
    onboardingServiceEntries.map(({ serviceKey, detail }) => {
      const serviceTitle = getServiceLabel(serviceKey);
      const experience = normalizeValueLabel(detail?.experienceYears);
      const level = normalizeValueLabel(detail?.workingLevel);
      const complexity = normalizeValueLabel(detail?.projectComplexity);
      const projectCount = Array.isArray(detail?.projects) ? detail.projects.length : 0;

      const meta = [
        level ? `Level: ${level}` : "",
        complexity ? `Complexity: ${complexity}` : "",
        projectCount ? `${projectCount} onboarding project${projectCount > 1 ? "s" : ""}` : "",
      ]
        .filter(Boolean)
        .join(" | ");

      if (!experience && !meta) return null;

      return {
        title: `${serviceTitle} · Onboarding`,
        period: experience || "Experience shared in onboarding",
        description: meta,
      };
    })
  );
  const effectiveWorkExperience = workExperience.length
    ? workExperience
    : onboardingDerivedWorkExperience;

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-20">
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
          <FreelancerTopBar label="Profile" />
          <div className="rounded-3xl border border-border/50 bg-card p-10">
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading your profile...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <FreelancerTopBar label="Profile" />

        {/* Header Card */}
        <div className="relative rounded-3xl overflow-hidden bg-card border border-border/50 shadow-sm group/header">
          {/* Gradient Banner */}
          <div className={`h-44 relative ${randomGradient}`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
          </div>

          <div className="px-8 pb-10 flex flex-col md:flex-row items-end gap-6 -mt-20 relative z-10">
            {/* Avatar */}
            <div
              className="relative group/avatar cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-32 h-32 md:w-36 md:h-36 rounded-3xl shadow-xl">
                <div className="w-full h-full rounded-[18px] overflow-hidden bg-muted relative">
                  {personal.avatar ? (
                    <img
                      src={personal.avatar}
                      alt={personal.name}
                      className="w-full h-full object-cover"
                      onError={() =>
                        setPersonal((prev) =>
                          prev.avatar ? { ...prev, avatar: "" } : prev
                        )
                      }
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary text-3xl font-bold text-secondary-foreground">
                      {initials}
                    </div>
                  )}
                  {/* Upload Overlay */}
                  <div
                    className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${uploadingImage
                      ? "opacity-100"
                      : "opacity-0 group-hover/avatar:opacity-100"
                      }`}
                  >
                    {uploadingImage ? (
                      <Loader2 className="animate-spin text-white" />
                    ) : (
                      <Camera className="text-white" />
                    )}
                  </div>
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />

              {/* Verified Badge / Available */}
              {personal.available && (
                <div
                  className="absolute bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full border-4 border-card"
                  title="Available for work"
                >
                  <div className="w-2.5 h-2.5 bg-white rounded-full" />
                </div>
              )}
            </div>

            {/* Info */}
            {/* Info */}
            <div className="flex-1 flex flex-col md:flex-row items-end justify-between gap-4 md:mb-1">
              <div className="flex flex-col gap-1 text-center md:text-left w-full md:w-auto">
                {/* Name & Badge */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                    {personal.name || "Your Name"}
                  </h1>
                  {personal.available && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold tracking-wide border border-emerald-500/30">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      AVAILABLE FOR WORK
                    </span>
                  )}
                </div>

                <p className="text-lg text-gray-300 font-medium">
                  {displayHeadline}
                </p>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-400 mt-1">
                  {displayLocation && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{displayLocation}</span>
                    </div>
                  )}
                  {/* Experience as a dot-separated item or just next to it? Image didn't show exp clearly but keeping it if needed. */}
                  {showExperienceYears && (
                    <>
                      <span className="hidden md:inline">•</span>
                      <span>{experienceYearsLabel} Years Exp.</span>
                    </>
                  )}
                </div>
              </div>

              {/* Socials & Actions */}
              <div className="flex items-center gap-3">
                {portfolio.githubUrl && (
                  <a
                    href={portfolio.githubUrl}
                    target="_blank"
                    className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all rounded-xl border border-white/10"
                    rel="noreferrer"
                  >
                    <Github className="w-5 h-5" />
                  </a>
                )}
                {portfolio.linkedinUrl && (
                  <a
                    href={portfolio.linkedinUrl}
                    target="_blank"
                    className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all rounded-xl border border-white/10"
                    rel="noreferrer"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
                {portfolio.portfolioUrl && (
                  <a
                    href={portfolio.portfolioUrl}
                    target="_blank"
                    className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all rounded-xl border border-white/10"
                    rel="noreferrer"
                  >
                    <Globe className="w-5 h-5" />
                  </a>
                )}
                {portfolio.resume && (
                  <a
                    href={portfolio.resume}
                    target="_blank"
                    className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all rounded-xl border border-white/10"
                    rel="noreferrer"
                    title="View Resume"
                  >
                    <FileText className="w-5 h-5" />
                  </a>
                )}
                {/* Edit Skills/Socials Modal Trigger - keeping functionality */}
                <button
                  onClick={() => setModalType("portfolio")}
                  className="p-2.5 text-primary hover:bg-primary/10 rounded-xl transition-colors border border-transparent hover:border-primary/20"
                  title="Add/Edit Social Links"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Save Button */}
            {isDirty && (
              <Button
                variant="default"
                size="sm"
                className="absolute top-4 right-14 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/20 transition-all font-semibold shadow-lg animate-in fade-in zoom-in duration-300"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {isSaving ? "Saving..." : "Save Profile"}
              </Button>
            )}

            {/* Edit Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10"
              onClick={openEditPersonalModal}
            >
              <Edit2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 space-y-6">
            <Card className="p-6 md:p-7 space-y-4 relative group">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <span className="text-primary">
                    <User className="w-5 h-5" />
                  </span>
                  About And Intro
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={openEditPersonalModal}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {profileDetails?.professionalBio ||
                  personal.bio ||
                  personal.headline ||
                  "Complete onboarding to add your professional summary."}
              </p>
            </Card>

            <Card className="p-6 md:p-7 space-y-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <span className="text-primary">
                    <Briefcase className="w-5 h-5" />
                  </span>
                  Onboarding Snapshot
                </h3>
                <Button variant="outline" size="sm" onClick={openFullProfileEditor}>
                  Edit All Details
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border/60 bg-secondary/20 p-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    Work Model
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {onboardingRoleLabel}
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-secondary/20 p-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    Availability
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {normalizeValueLabel(onboardingAvailability.hoursPerWeek) ||
                      "Not set"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {normalizeValueLabel(onboardingAvailability.workingSchedule) ||
                      "Schedule not set"}
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-secondary/20 p-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    Start Timeline
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {normalizeValueLabel(onboardingAvailability.startTimeline) ||
                      "Not set"}
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-secondary/20 p-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    Reliability
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {normalizeValueLabel(onboardingReliability.missedDeadlines) ||
                      "Not set"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {normalizeValueLabel(onboardingReliability.delayHandling) ||
                      "Delay handling not set"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium border border-border/50">
                  Delivery Policy:{" "}
                  {profileDetails?.deliveryPolicyAccepted ? "Accepted" : "Not set"}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium border border-border/50">
                  Communication Policy:{" "}
                  {profileDetails?.communicationPolicyAccepted
                    ? "Accepted"
                    : "Not set"}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium border border-border/50">
                  Accept In-Progress Projects:{" "}
                  {normalizeValueLabel(profileDetails?.acceptInProgressProjects) ||
                    "Not set"}
                </span>
              </div>
            </Card>

            <Card className="p-6 md:p-7 space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                <span className="text-primary">
                  <Cpu className="w-5 h-5" />
                </span>
                Services From Onboarding
              </h3>

              {onboardingServiceEntries.length > 0 ? (
                <div className="space-y-3">
                  {onboardingServiceEntries.map(({ serviceKey, detail }) => {
                    const serviceTitle = getServiceLabel(serviceKey);
                    const specializationTags = collectServiceSpecializations(detail);
                    const nicheTags = toUniqueLabels([
                      ...(Array.isArray(detail?.niches) ? detail.niches : []),
                      detail?.otherNiche || "",
                    ]);
                    const projectList = Array.isArray(detail?.projects)
                      ? detail.projects
                      : [];

                    return (
                      <div
                        key={serviceKey}
                        className="rounded-xl border border-border/70 bg-secondary/20 p-4 space-y-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-foreground">
                            {serviceTitle}
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            {normalizeValueLabel(detail?.experienceYears) ||
                              "Experience not set"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <p>
                            Level:{" "}
                            <span className="text-foreground">
                              {normalizeValueLabel(detail?.workingLevel) ||
                                "Not set"}
                            </span>
                          </p>
                          <p>
                            Complexity:{" "}
                            <span className="text-foreground">
                              {normalizeValueLabel(detail?.projectComplexity) ||
                                "Not set"}
                            </span>
                          </p>
                          <p>
                            Avg Project Price:{" "}
                            <span className="text-foreground">
                              {normalizeValueLabel(detail?.averageProjectPrice) ||
                                "Not set"}
                            </span>
                          </p>
                          <p>
                            Industry Focus:{" "}
                            <span className="text-foreground">
                              {normalizeValueLabel(detail?.industryFocus) ||
                                "Not set"}
                            </span>
                          </p>
                        </div>

                        {nicheTags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {nicheTags.map((tag) => (
                              <span
                                key={`${serviceKey}-niche-${tag}`}
                                className="px-2 py-0.5 rounded-md bg-background border border-border/60 text-xs text-foreground"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {specializationTags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {specializationTags.map((tag) => (
                              <span
                                key={`${serviceKey}-spec-${tag}`}
                                className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-xs text-primary"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {projectList.length > 0 && (
                          <div className="rounded-lg border border-border/60 bg-background/70 p-3 space-y-2">
                            <p className="text-xs font-medium text-foreground">
                              Projects Added In Onboarding
                            </p>
                            <div className="space-y-1.5">
                              {projectList.map((project, index) => (
                                <div
                                  key={`${serviceKey}-project-${index}`}
                                  className="text-xs text-muted-foreground"
                                >
                                  <span className="text-foreground font-medium">
                                    {project?.title || "Project"}
                                  </span>
                                  {project?.timeline
                                    ? ` | ${normalizeValueLabel(project.timeline)}`
                                    : ""}
                                  {project?.budget
                                    ? ` | ${normalizeValueLabel(project.budget)}`
                                    : ""}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No service data from onboarding yet.
                </p>
              )}
            </Card>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <span className="text-primary">
                    <Rocket className="w-5 h-5" />
                  </span>
                  Featured Projects
                </h3>
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary flex items-center gap-1"
                    onClick={() => {
                      resetProjectDraft();
                      setModalType("addProject");
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    Add Project
                  </Button>
                  <button
                    className="text-primary text-sm font-medium hover:underline"
                    onClick={() => setModalType("viewAllProjects")}
                  >
                    View All
                  </button>
                </div>
              </div>

              {portfolioProjects.length > 0 ? (
                <div className="relative px-12">
                  <Carousel
                    opts={{
                      align: "start",
                      loop: true,
                    }}
                    className="w-full"
                  >
                    <CarouselContent className="-ml-4">
                      {portfolioProjects.map((project, idx) => (
                        <CarouselItem key={idx} className="pl-4 md:basis-1/2">
                          <div className="group relative rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all h-full">
                            <div className="aspect-video bg-muted relative overflow-hidden">
                              {project.image ? (
                                <img
                                  src={project.image}
                                  alt={project.title}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl bg-secondary/30">
                                  PRJ
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                {project.link ? (
                                  <a
                                    href={project.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-white rounded-full text-black hover:scale-110 transition-transform"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                ) : (
                                  <span className="p-2 bg-white/70 rounded-full text-black/60 cursor-not-allowed">
                                    <ExternalLink className="w-4 h-4" />
                                  </span>
                                )}
                                <label
                                  htmlFor={`project-cover-main-${idx}`}
                                  className="p-2 bg-white rounded-full text-black hover:scale-110 transition-transform cursor-pointer"
                                  title="Upload cover image"
                                >
                                  {projectCoverUploadingIndex === idx ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Camera className="w-4 h-4" />
                                  )}
                                </label>
                                <input
                                  id={`project-cover-main-${idx}`}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(event) =>
                                    handleProjectCoverInputChange(idx, event)
                                  }
                                />
                                <button
                                  onClick={() => removeProject(idx)}
                                  className="p-2 bg-destructive text-white rounded-full hover:scale-110 transition-transform"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="p-3 flex items-center justify-between gap-3">
                              <h4
                                className="font-semibold truncate text-sm flex-1"
                                title={project.title || project.link}
                              >
                                {project.title || "Project"}
                              </h4>
                              {project.link ? (
                                <a
                                  href={project.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                                  title="Visit Project"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              ) : (
                                <span className="flex items-center justify-center p-2 rounded-lg bg-secondary/40 text-muted-foreground/60 cursor-not-allowed">
                                  <ExternalLink className="w-4 h-4" />
                                </span>
                              )}
                            </div>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="-left-4" />
                    <CarouselNext className="-right-4" />
                  </Carousel>
                </div>
              ) : (
                <div className="aspect-video rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center p-4 text-center hover:bg-secondary/10 transition-colors">
                  <p className="text-muted-foreground text-sm">
                    No projects added yet. Click "Add Project" to get started.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="xl:col-span-4 space-y-6">
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <span className="text-primary">
                    <MapPin className="w-5 h-5" />
                  </span>
                  Identity Details
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={openEditPersonalModal}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Username:{" "}
                  <span className="text-foreground">
                    {onboardingIdentity?.username || "Not set"}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Professional Title:{" "}
                  <span className="text-foreground">
                    {onboardingIdentity?.professionalTitle ||
                      personal.headline ||
                      "Not set"}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Country:{" "}
                  <span className="text-foreground">
                    {onboardingIdentity?.country || "Not set"}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  State/City:{" "}
                  <span className="text-foreground">
                    {onboardingIdentity?.city || "Not set"}
                  </span>
                </p>
              </div>

              {onboardingLanguages.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {onboardingLanguages.map((language) => (
                    <span
                      key={`language-${language}`}
                      className="px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium border border-border/50"
                    >
                      {language}
                    </span>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <span className="text-primary">
                    <Cpu className="w-5 h-5" />
                  </span>
                  Skills And Tech Stack
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setModalType("skill")}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.length > 0 ? (
                  skills.map((s, i) => (
                    <div key={i} className="group relative">
                      <span className="px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium border border-border/50 cursor-default block">
                        {s.name}
                      </span>
                      <Trash2
                        className="w-3 h-3 absolute -top-1 -right-1 text-destructive opacity-0 group-hover:opacity-100 cursor-pointer bg-card rounded-full"
                        onClick={() => deleteSkill(i)}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No skills added.
                  </p>
                )}
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <span className="text-primary">
                    <Globe className="w-5 h-5" />
                  </span>
                  Industry And Presence
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setModalType("portfolio")}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>

              {onboardingGlobalIndustry.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {onboardingGlobalIndustry.map((industry) => (
                    <span
                      key={`industry-${industry}`}
                      className="px-2 py-0.5 rounded-md bg-background border border-border/60 text-xs text-foreground"
                    >
                      {industry}
                    </span>
                  ))}
                </div>
              )}

              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Portfolio:{" "}
                  <span className="text-foreground break-all">
                    {portfolio.portfolioUrl ||
                      onboardingIdentity?.portfolioUrl ||
                      "Not set"}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  LinkedIn:{" "}
                  <span className="text-foreground break-all">
                    {portfolio.linkedinUrl ||
                      onboardingIdentity?.linkedinUrl ||
                      "Not set"}
                  </span>
                </p>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <span className="text-primary">
                    <Briefcase className="w-5 h-5" />
                  </span>
                  Work Experience
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={openCreateExperienceModal}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="relative border-l border-border ml-3.5 space-y-8 py-2">
                {effectiveWorkExperience.length > 0 ? (
                  effectiveWorkExperience.map((exp, i) => {
                    const [position, company] = splitExperienceTitle(exp.title);
                    return (
                      <div
                        key={i}
                        className={`relative pl-8 group ${workExperience.length > 0 ? "cursor-pointer" : "cursor-default"}`}
                        onClick={() => {
                          if (workExperience.length > 0) {
                            openEditExperienceModal(exp, i);
                          }
                        }}
                      >
                        <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-primary bg-background group-hover:bg-primary transition-colors" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary mb-0.5 block">
                          {exp.period || "Date N/A"}
                        </span>
                        <h4 className="font-bold text-foreground leading-tight">
                          {position || "Position"}
                        </h4>
                        <p className="text-xs text-muted-foreground font-medium mb-1">
                          {company || "Company"}
                        </p>
                        {exp.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="pl-6 text-sm text-muted-foreground">
                    No experience added.
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm transition-all">
          <div
            className={`w-full rounded-2xl border border-border/70 bg-card/95 backdrop-blur p-6 shadow-2xl shadow-black/50 animate-in fade-in zoom-in-95 duration-200 ${modalType === "viewAllProjects"
              ? "max-w-[60%] h-[90vh] flex flex-col"
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
                  {portfolioProjects.length} project
                  {portfolioProjects.length !== 1 ? "s" : ""} in your portfolio
                </p>
                <div className="mt-4 flex-1 overflow-y-auto">
                  {portfolioProjects.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {portfolioProjects.map((project, idx) => (
                        <div
                          key={idx}
                          className="group flex flex-col p-3 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
                        >
                          <div className="w-full h-40 rounded-lg overflow-hidden bg-muted mb-2">
                            {project.image ? (
                              <img
                                src={project.image}
                                alt={project.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl bg-secondary/50">
                                💻
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4
                              className="font-medium text-sm truncate"
                              title={project.title || project.link}
                            >
                              {project.title || "Project"}
                            </h4>
                            <p
                              className="text-xs text-muted-foreground truncate"
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
            ) : modalType === "personal" ? (
              <>
                <h1 className="text-lg font-semibold text-foreground">
                  Edit Personal Details
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Update your public profile information.
                </p>

                <div className="mt-4 space-y-4">
                  <label className="flex items-center justify-between p-3 rounded-2xl border border-border bg-secondary/50 cursor-pointer hover:bg-secondary/70 transition-colors">
                    <span className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                      Available for work
                    </span>
                    <input
                      type="checkbox"
                      name="available"
                      checked={personal.available || false}
                      onChange={handlePersonalChange}
                      className="w-5 h-5 accent-primary rounded cursor-pointer"
                    />
                  </label>

                  <label className="mt-3 block text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                    Headline
                    <input
                      name="headline"
                      value={personal.headline || ""}
                      onChange={handlePersonalChange}
                      placeholder="e.g. Full Stack Developer"
                      className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                    />
                  </label>

                  <label className="mt-3 block text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                    Years of Experience
                    <input
                      name="experienceYears"
                      type="number"
                      value={personal.experienceYears || ""}
                      onChange={handlePersonalChange}
                      placeholder="e.g. 5"
                      className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                    />
                  </label>

                  <label className="block text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                    Display Name
                    <input
                      name="name"
                      value={personal.name || ""}
                      onChange={handlePersonalChange}
                      placeholder="Your Name"
                      className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                      Phone
                      <input
                        name="phone"
                        value={personal.phone || ""}
                        onChange={handlePersonalChange}
                        placeholder="+91..."
                        className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                      />
                    </label>
                    <label className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                      Location
                      <input
                        name="location"
                        value={personal.location || ""}
                        onChange={handlePersonalChange}
                        placeholder="City, Country"
                        className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                      />
                    </label>
                  </div>

                  <label className="block text-[11px] uppercase tracking-[0.3em] text-muted-foreground mt-4">
                    Bio / About Me
                    <textarea
                      name="bio"
                      value={personal.bio || ""}
                      onChange={handlePersonalChange}
                      rows={4}
                      placeholder="Tell us about yourself..."
                      className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                    />
                  </label>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="rounded-2xl border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground hover:bg-muted/40 transition-colors"
                  >
                    Done
                  </button>
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
