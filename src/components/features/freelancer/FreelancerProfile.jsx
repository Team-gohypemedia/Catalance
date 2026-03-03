import Camera from "lucide-react/dist/esm/icons/camera";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Plus from "lucide-react/dist/esm/icons/plus";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/layout/GlobalDashboardHeader";
import { RoleAwareSidebar } from "@/components/layout/RoleAwareSidebar";
import ProfileHeroCard from "@/components/features/freelancer/profile/ProfileHeroCard";
import ProfileSummaryCards from "@/components/features/freelancer/profile/ProfileSummaryCards";
import ProfileOnboardingSnapshotCard from "@/components/features/freelancer/profile/ProfileOnboardingSnapshotCard";
import ServicesFromOnboardingCard from "@/components/features/freelancer/profile/ServicesFromOnboardingCard";
import FeaturedProjectsSection from "@/components/features/freelancer/profile/FeaturedProjectsSection";
import ProjectCoverMedia from "@/components/features/freelancer/profile/ProjectCoverMedia";
import ProfileSidebarCards from "@/components/features/freelancer/profile/ProfileSidebarCards";
import ProfileSkillsCard from "@/components/features/freelancer/profile/ProfileSkillsCard";
import FullProfileEditorModalContent from "@/components/features/freelancer/profile/modals/FullProfileEditorModalContent";
import PersonalDetailsModalContent from "@/components/features/freelancer/profile/modals/PersonalDetailsModalContent";
import WorkExperienceModalContent from "@/components/features/freelancer/profile/modals/WorkExperienceModalContent";
import EducationModalContent from "@/components/features/freelancer/profile/modals/EducationModalContent";
import { useAuth } from "@/shared/context/AuthContext";
import { useNotifications } from "@/shared/context/NotificationContext";
import {
  getServiceLabel,
  createServiceDetail,
} from "@/components/features/freelancer/onboarding/utils";
import { EXPERIENCE_YEARS_OPTIONS } from "@/components/features/freelancer/onboarding/constants";
import { useNavigate } from "react-router-dom";

import {
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
  normalizeSkillLevel,
} from "@/components/features/freelancer/profile/freelancerProfileUtils";

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
    headline: "",
    bio: "",
    experienceYears: "",
    avatar: "",
    coverImage: "",
    available: true,
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
  const [newProjectImageFile, setNewProjectImageFile] = useState(null);
  const [newProjectImagePreview, setNewProjectImagePreview] = useState("");
  const [serviceProfileForm, setServiceProfileForm] = useState({
    serviceKey: "",
    serviceLabel: "",
    experienceYears: "",
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
  const [uploadingCoverImage, setUploadingCoverImage] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedCoverFile, setSelectedCoverFile] = useState(null);
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const resumeInputRef = useRef(null);
  const projectPreviewAttemptRef = useRef(new Set());
  const [initialData, setInitialData] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fullProfileForm, setFullProfileForm] = useState(
    createInitialFullProfileForm
  );
  const [, setPersonalEditorSection] = useState(
    PERSONAL_EDITOR_SECTIONS.ALL
  );
  const [, setFullProfileEditorSection] = useState(
    FULL_PROFILE_EDITOR_SECTIONS.ALL
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

        const loadedSkills = toUniqueSkillObjects(
          Array.isArray(normalized.skills) ? normalized.skills : [],
          loadedProfileDetails?.skillLevels
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

    setSkills((prev) => [...prev, { name, level: "Intermediate" }]);
    setSkillForm({ name: "" });
    setModalType(null);
  };

  const deleteSkill = (index) => {
    setSkills((prev) => prev.filter((_, i) => i !== index));
  };

  const setSkillLevel = useCallback((index, level) => {
    const normalizedLevel = normalizeSkillLevel(level);
    setSkills((prev) =>
      (Array.isArray(prev) ? prev : []).map((entry, rowIndex) => {
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
      })
    );
  }, []);

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

    const profileDetailsForSave = {
      ...existingProfileDetails,
      professionalBio: bioText,
      skillLevels: skillLevelsForApi,
      identity: {
        ...existingIdentity,
        professionalTitle: String(currentPersonal.headline || "").trim(),
        username: String(existingIdentity.username || "").trim(),
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
      setIsDirty(false);
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

  const saveSectionChanges = async (overrides = {}) =>
    handleSave({
      personal,
      portfolio,
      skills,
      workExperience,
      services,
      portfolioProjects,
      profileDetails,
      ...overrides,
    });

  const saveSkillsSection = async () => {
    await saveSectionChanges();
  };

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

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Store file for later upload
    setSelectedFile(file);

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
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

    // Persist avatar immediately so page refresh does not revert to the old image.
    void handleSave(buildProfileSnapshot({ personal: nextPersonal }), {
      avatarFileOverride: file,
      suppressSuccessToast: true,
    }).then((saved) => {
      if (saved) {
        toast.success("Profile image updated");
      }
    });
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

  const removeCoverImage = useCallback(() => {
    setSelectedCoverFile(null);
    setPersonal((prev) =>
      prev.coverImage ? { ...prev, coverImage: "" } : prev
    );
  }, []);

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
      experienceYears: String(detail?.experienceYears || "").trim(),
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
        experienceYears: String(serviceProfileForm.experienceYears || "").trim(),
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
    setNewProjectTitle("");
    setNewProjectDescription("");
    setNewProjectImageFile(null);
    setNewProjectImagePreview((prev) => {
      if (prev && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return "";
    });
    setNewProjectLoading(false);
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

  const handleNewProjectImageChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
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
    setNewProjectImageFile(file);
    setNewProjectImagePreview((prev) => {
      if (prev && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return objectUrl;
    });
  };

  const clearNewProjectImageDraft = () => {
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
    const hasDuplicate = (Array.isArray(portfolioProjects) ? portfolioProjects : []).some(
      (project) =>
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

      const nextProjects = [
        ...(Array.isArray(portfolioProjects) ? portfolioProjects : []),
        {
          link: normalizedUrl,
          image: projectImage || null,
          title: finalTitle,
          description: finalDescription,
        },
      ];

      const saved = await saveSectionChanges({
        portfolioProjects: nextProjects,
      });

      if (saved) {
        toast.success("Project added");
        resetProjectDraft();
        setModalType(null);
        return;
      }

      setPortfolioProjects(nextProjects);
      toast.error("Project added locally. Click Save changes to persist.");
    } catch (error) {
      console.error("Failed to add project:", error);
      toast.error(error?.message || "Failed to add project");
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
      acceptInProgressProjects: String(
        currentDetails.acceptInProgressProjects || ""
      ).trim(),
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
  const hasProjectChanges = useMemo(() => {
    const currentProjects = Array.isArray(portfolioProjects) ? portfolioProjects : [];
    const initialProjects = Array.isArray(initialData?.portfolioProjects)
      ? initialData.portfolioProjects
      : [];
    return JSON.stringify(currentProjects) !== JSON.stringify(initialProjects);
  }, [portfolioProjects, initialData?.portfolioProjects]);
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
    resolveAvatarUrl(personal.coverImage) ||
    resolveAvatarUrl(onboardingIdentity?.coverImage) ||
    resolveAvatarUrl(profileDetails?.identity?.coverImage);
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

          {/* â”€â”€ Full-width hero â”€â”€ */}
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
            displayHeadline={displayHeadline}
            displayBio={displayBio}
            displayLocation={displayLocation}
            onboardingIdentity={onboardingIdentity}
            onboardingLanguages={onboardingLanguages}
            openEditPersonalModal={openEditPersonalModal}
            openPortfolioModal={openPortfolioModal}
            profileLinks={{
              portfolio: resolvedPortfolioLink,
              linkedin: resolvedLinkedinLink,
              github: resolvedGithubLink,
              resume: resolvedResumeLink,
            }}
          />

          {/* â”€â”€ Two-column grid â”€â”€ */}
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">

            {/* â”€â”€ Left: Main content â”€â”€ */}
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
                onSaveChanges={saveSkillsSection}
                savingChanges={isSaving}
                hasPendingChanges={isDirty}
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
                hasPendingChanges={hasProjectChanges}
                onAddProject={() => {
                  resetProjectDraft();
                  setModalType("addProject");
                }}
                onViewAllProjects={() => setModalType("viewAllProjects")}
              />
            </div>

            {/* â”€â”€ Right: Sidebar â”€â”€ */}
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
                removeExperience={removeExperience}
                splitExperienceTitle={splitExperienceTitle}
                profileDetails={profileDetails}
                openFullProfileEditor={openFullProfileEditor}
              />
            </div>

          </div>
        </div>
      </main>
      {/* Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm transition-all">
          <div
            className={`w-full rounded-2xl border border-border/70 bg-card/95 backdrop-blur p-6 shadow-2xl shadow-black/50 animate-in fade-in zoom-in-95 duration-200 ${modalType === "viewAllProjects"
              ? "max-w-6xl h-[90vh] flex flex-col"
              : modalType === "fullProfile"
                ? "max-w-5xl max-h-[90vh] overflow-y-auto"
              : modalType === "education"
                ? "max-w-4xl max-h-[90vh] overflow-y-auto"
              : modalType === "personal"
                ? "max-w-2xl max-h-[90vh] overflow-y-auto"
              : modalType === "onboardingService"
                ? "max-w-2xl"
              : modalType === "work"
                ? "max-w-2xl max-h-[90vh] overflow-y-auto"
              : modalType === "portfolio"
                ? "max-w-2xl max-h-[90vh] overflow-y-auto"
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
            ) : modalType === "viewAllProjects" ? (
              <>
                <div className="flex items-start justify-between gap-4 border-b border-border/70 pb-4">
                  <div>
                    <h1 className="text-xl font-semibold text-foreground">
                      All Featured Projects
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Manage every project in your profile portfolio.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      resetProjectDraft();
                      setModalType("addProject");
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Add project
                  </Button>
                </div>

                <div className="mt-4 flex-1 overflow-y-auto pr-1">
                  {displayPortfolioProjects.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {displayPortfolioProjects.map((project, idx) => {
                        const projectLink = normalizeProjectLinkValue(project?.link);
                        const projectHost = getProjectTitleFallback(projectLink || "");
                        const projectTitle = String(
                          project?.title || projectHost || "Project"
                        ).trim();
                        const projectDescription = String(
                          project?.description || ""
                        ).trim();

                        return (
                          <article
                            key={`project-modal-${projectLink || projectTitle}-${idx}`}
                            className="overflow-hidden rounded-xl border border-border/70 bg-background/50"
                          >
                            <div className="relative aspect-[16/9] overflow-hidden">
                              <ProjectCoverMedia
                                project={project}
                                containerClassName="h-full w-full"
                                imageClassName="h-full w-full object-cover"
                                fallbackTitleClassName="text-3xl"
                              />
                              <div className="absolute right-2 top-2 z-10 flex items-center gap-1.5 rounded-full border border-white/25 bg-black/45 p-1.5 backdrop-blur-sm">
                                {projectLink ? (
                                  <a
                                    href={projectLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105"
                                    title="Open project"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                ) : null}
                                <label
                                  htmlFor={`project-cover-modal-${idx}`}
                                  className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105"
                                  title="Upload cover image"
                                >
                                  {projectCoverUploadingIndex === idx ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Camera className="h-3.5 w-3.5" />
                                  )}
                                </label>
                                <button
                                  type="button"
                                  onClick={() => removeProject(idx)}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-white transition-transform hover:scale-105"
                                  title="Remove project"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
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
                            <div className="space-y-2 p-3">
                              <h2
                                className="line-clamp-1 text-sm font-semibold text-foreground"
                                title={projectTitle}
                              >
                                {projectTitle}
                              </h2>
                              {projectLink ? (
                                <a
                                  href={projectLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="line-clamp-1 text-xs text-primary hover:underline"
                                  title={projectLink}
                                >
                                  {projectHost}
                                </a>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  No live link provided
                                </p>
                              )}
                              {projectDescription ? (
                                <p
                                  className="line-clamp-3 text-xs leading-relaxed text-muted-foreground"
                                  title={projectDescription}
                                >
                                  {projectDescription}
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  Add a short project description for better trust.
                                </p>
                              )}
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
                        onClick={() => {
                          resetProjectDraft();
                          setModalType("addProject");
                        }}
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
              <>
                <div className="space-y-1">
                  <div>
                    <h1 className="text-xl font-semibold text-foreground">
                      Edit Service Profile
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

                <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
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

                  <div className="rounded-md border border-border/70 bg-background/50 px-3 py-2.5">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      Profile Status
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {serviceProfileForm.serviceDescription
                        ? serviceProfileForm.coverImage
                          ? "Ready to publish"
                          : "Add a cover image"
                        : "Add description"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Description + cover improves trust.
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5">
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
                    rows={5}
                    maxLength={500}
                    placeholder="Describe the outcomes, process, and what clients can expect."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/70 focus:ring-2 focus:ring-primary/60"
                  />
                  <p className="text-right text-[11px] text-muted-foreground">
                    {String(serviceProfileForm.serviceDescription || "").length}/500
                  </p>
                </div>

                <div className="mt-4 space-y-2">
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
                          className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
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
                      <div className="flex h-44 items-center justify-center rounded-md border border-dashed border-border/70 bg-background/35 text-xs text-muted-foreground">
                        No cover selected yet
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-border/70 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModalType(null)}
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
                    Save changes
                  </Button>
                </div>
              </>
            ) : modalType === "addProject" ? (
              <>
                <h1 className="text-lg font-semibold text-foreground">
                  Add Project
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add a live link, then optional details to showcase your work.
                </p>
                <div className="mt-4 space-y-4">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-muted-foreground">
                      Live URL*
                    </span>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        value={newProjectUrl}
                        onChange={(event) => setNewProjectUrl(event.target.value)}
                        onBlur={handleUrlBlur}
                        placeholder="https://yourproject.com"
                        className="h-11 w-full rounded-xl border border-border/70 bg-card/70 px-3 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/70 focus:ring-2 focus:ring-primary/60"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 shrink-0"
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
                    <span className="mb-1.5 block text-sm font-medium text-muted-foreground">
                      Project title
                    </span>
                    <input
                      value={newProjectTitle}
                      onChange={(event) => setNewProjectTitle(event.target.value)}
                      placeholder="Ex: Markify"
                      className="h-11 w-full rounded-xl border border-border/70 bg-card/70 px-3 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/70 focus:ring-2 focus:ring-primary/60"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-muted-foreground">
                      Description
                    </span>
                    <textarea
                      value={newProjectDescription}
                      onChange={(event) => setNewProjectDescription(event.target.value)}
                      rows={4}
                      maxLength={320}
                      placeholder="What this project does and the impact it created."
                      className="w-full rounded-xl border border-border/70 bg-card/70 px-3 py-2.5 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/70 focus:ring-2 focus:ring-primary/60"
                    />
                    <p className="mt-1 text-right text-xs text-muted-foreground">
                      {String(newProjectDescription || "").length}/320
                    </p>
                  </label>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Cover image (optional)
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            document.getElementById("new-project-image-input")?.click()
                          }
                        >
                          Upload image
                        </Button>
                        {newProjectImagePreview ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
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
                    {newProjectImagePreview ? (
                      <div className="overflow-hidden rounded-xl border border-border/70">
                        <img
                          src={newProjectImagePreview}
                          alt="Project preview"
                          className="h-44 w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-border/70 bg-background/35 text-sm text-muted-foreground">
                        No cover selected
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-border/70 pt-4">
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
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    Add project
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
                handlePersonalChange={handlePersonalChange}
                handlePersonalUsernameChange={handlePersonalUsernameChange}
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

