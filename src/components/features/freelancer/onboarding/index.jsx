
"use client";

import React, { useMemo, useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { cn } from "@/shared/lib/utils";
import {
    API_BASE_URL,
    signup,
    verifyOtp,
    updateProfile,
    listFreelancers,
    fetchStatesByCountry,
} from "@/shared/lib/api-client";
import { useAuth } from "@/shared/context/AuthContext";
import { GradientBackground } from "@/components/paper-design-shader-background";

// ── Local module imports ──────────────────────────────────────────────
import {
    SERVICE_OPTIONS,
    CASE_STUDY_FIELDS,
    HOURS_PER_WEEK_OPTIONS,
    WORKING_SCHEDULE_OPTIONS,
    START_TIMELINE_OPTIONS,
    DEADLINE_HISTORY_OPTIONS,
    DELAY_HANDLING_OPTIONS,
    INDUSTRY_NICHE_OPTIONS,
    STATE_OPTIONS_CACHE,
} from "./constants";

import {
    isValidUsername,
    isValidUrl,
    getServiceLabel,
    getServiceGroups,
    createServiceDetail,
    toQuestionTitle,
    normalizeCustomTools,
    parseCustomTools,
} from "./utils";
import {
    getFreelancerOnboardingStorageKeys,
    LEGACY_FREELANCER_ONBOARDING_STORAGE_KEYS,
} from "./storage";

// Step components
import {
    ProfileBasicsStep,
    ProfessionalTitleStep,
    UsernameStep,
    CountryStep,
    CityStep,
    ProfilePhotoStep,
    LanguagesStep,
    LinkedinStep,
    PortfolioStep,
    RoleStep,
    WelcomeStep,
    StatsStep,
    PricingStrategyStep,
    PortfolioImportanceStep,
    ServiceTransitionStep,
} from "./ProfileSteps";

import {
    ServicesStep,
    ServiceExperienceStep,
    ServiceLevelStep,
    ServiceProjectsStep,
    ServiceCaseFieldStep,
    ServiceSampleWorkStep,
    ServiceSampleUploadStep,
    ServiceAveragePriceStep,
    ServiceGroupStep,
    ServiceIndustryFocusStep,
    ServiceNichesStep,
    ServiceIndustryOnlyStep,
    ServiceComplexityStep,
    ServiceProjectDetailsStep,
    GlobalNicheStep,
} from "./ServiceSteps";

import {
    SingleSelectStep,
    DeliveryPolicyStep,
    CommunicationPolicyStep,
    AcceptInProgressProjectsStep,
    BioStep,
    OtpVerificationStep,
} from "./PolicySteps";
import ProfileImageCropDialog from "./ProfileImageCropDialog";

const ONBOARDING_SKILL_BLOCKLIST = new Set([
    "yes",
    "no",
    "open",
    "other",
    "not set",
    "individual",
    "agency",
    "part_time",
    "part time",
    "beginner",
    "intermediate",
    "advanced",
    "small",
    "medium",
    "large",
]);

const TECH_GROUP_KEY_PATTERN =
    /(tech|tool|stack|platform|framework|library|integration|crm|tracking|database)/i;

const SKILL_ACRONYMS = new Set([
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
            if (SKILL_ACRONYMS.has(normalized)) {
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

const addSkillValue = (targetMap, value) => {
    const label = formatSkillLabel(value);
    if (!label) return;

    const normalized = label.toLowerCase();
    if (ONBOARDING_SKILL_BLOCKLIST.has(normalized)) return;
    if (ONBOARDING_SKILL_BLOCKLIST.has(normalized.replace(/\s+/g, "_"))) return;

    const key = getSkillDedupKey(label);
    if (!key) return;
    if (!targetMap.has(key)) {
        targetMap.set(key, label);
    }
};

const addSkillValues = (targetMap, values) => {
    if (!Array.isArray(values)) return;
    values.forEach((value) => addSkillValue(targetMap, value));
};

const collectTechGroupValues = (groups = {}) => {
    return Object.entries(groups || {}).flatMap(([groupKey, entry]) => {
        if (!TECH_GROUP_KEY_PATTERN.test(String(groupKey || ""))) {
            return [];
        }

        if (Array.isArray(entry)) {
            return entry;
        }

        if (typeof entry === "string") {
            return parseCustomTools(entry);
        }

        return [];
    });
};

const normalizeProjectLink = (value = "") => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    return `https://${raw}`;
};

const buildLocationLabel = ({ city, country }) =>
    [String(city || "").trim(), String(country || "").trim()]
        .filter(Boolean)
        .join(", ");

const extractProfilePhotoFile = (profilePhoto) => {
    if (!profilePhoto || typeof profilePhoto !== "object") return null;
    return typeof File !== "undefined" && profilePhoto.file instanceof File
        ? profilePhoto.file
        : null;
};

const extractProfilePhotoUrl = (profilePhoto) => {
    if (!profilePhoto) return "";

    if (typeof profilePhoto === "string") {
        return profilePhoto.trim();
    }

    if (typeof profilePhoto === "object") {
        const raw =
            profilePhoto.uploadedUrl ||
            profilePhoto.url ||
            profilePhoto.src ||
            profilePhoto.value ||
            "";
        return String(raw || "").trim();
    }

    return "";
};

const normalizeAvatarUrl = (value) => {
    const url = String(value || "").trim();
    if (!url || url.startsWith("blob:")) return "";
    return url;
};

const AVATAR_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
const PROFILE_PHOTO_PICK_MAX_BYTES = 20 * 1024 * 1024;

const formatFileSize = (bytes) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const exponent = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        units.length - 1,
    );
    const value = bytes / 1024 ** exponent;
    return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};

const createInitialOnboardingFormData = () => ({
    professionalTitle: "",
    username: "",
    country: "",
    city: "",
    profilePhoto: null,
    languages: [],
    otherLanguage: "",
    linkedinUrl: "",
    portfolioUrl: "",
    role: "",
    globalIndustryFocus: [],
    globalIndustryOther: "",
    selectedServices: [],
    serviceDetails: {},
    deliveryPolicyAccepted: false,
    hoursPerWeek: "",
    workingSchedule: "",
    startTimeline: "",
    missedDeadlines: "",
    delayHandling: "",
    communicationPolicyAccepted: false,
    acceptInProgressProjects: "",
    termsAccepted: false,
    professionalBio: "",
    fullName: "",
    email: "",
    password: "",
});

const buildPortfolioProjectsFromServiceDetails = (serviceDetails = {}) => {
    const projectMap = new Map();

    Object.entries(serviceDetails || {}).forEach(([serviceKey, detail]) => {
        const projects = Array.isArray(detail?.projects) ? detail.projects : [];
        const serviceLabel = getServiceLabel(serviceKey);

        projects.forEach((project, index) => {
            const title = String(project?.title || "").trim();
            const description = String(project?.description || "").trim();
            const link = normalizeProjectLink(project?.link || project?.url || "");

            if (!title && !description && !link) return;

            const dedupKey = link
                ? link.toLowerCase()
                : `${serviceKey}:${title.toLowerCase()}:${index}`;

            if (projectMap.has(dedupKey)) return;

            projectMap.set(dedupKey, {
                title: title || `${serviceLabel} Project`,
                link,
                image: null,
                description,
                service: serviceLabel,
                tags: Array.isArray(project?.tags) ? project.tags : [],
                techStack: Array.isArray(project?.techStack) ? project.techStack : [],
                timeline: project?.timeline || "",
                budget: project?.budget || "",
            });
        });
    });

    return Array.from(projectMap.values()).slice(0, 24);
};

const buildOnboardingSkills = ({
    identity,
    serviceDetails,
}) => {
    const skills = new Map();

    addSkillValue(skills, identity?.professionalTitle);

    Object.values(serviceDetails || {}).forEach((detail) => {
        if (!detail || typeof detail !== "object") return;

        addSkillValues(skills, collectTechGroupValues(detail?.groups));
        addSkillValues(skills, collectTechGroupValues(detail?.groupOther));

        const caseStudy = detail?.caseStudy || {};
        addSkillValues(skills, caseStudy.techStack);
        addSkillValues(skills, parseCustomTools(caseStudy.techStackOther || ""));

        const projects = Array.isArray(detail?.projects) ? detail.projects : [];
        projects.forEach((project) => {
            if (!project || typeof project !== "object") return;
            addSkillValues(skills, project.techStack);
        });
    });

    return Array.from(skills.values()).slice(0, 80);
};

// ======================================================================
// MAIN ORCHESTRATOR
// ======================================================================

const FreelancerMultiStepForm = () => {
    const navigate = useNavigate();
    const { login: setAuthSession, user, refreshUser, authFetch } = useAuth();

    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [stepError, setStepError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [otp, setOtp] = useState("");
    const [usernameStatus, setUsernameStatus] = useState("idle");
    const usernameCheckRef = useRef(0);
    const usernameDebounceRef = useRef(null);
    const [techStackOtherDrafts, setTechStackOtherDrafts] = useState({});
    const [groupOtherDrafts, setGroupOtherDrafts] = useState({});
    const [pendingProfilePhotoFile, setPendingProfilePhotoFile] = useState(null);
    const [isProfileCropOpen, setIsProfileCropOpen] = useState(false);
    const [stateOptions, setStateOptions] = useState([]);
    const [isStateOptionsLoading, setIsStateOptionsLoading] = useState(false);

    const [formData, setFormData] = useState(() => createInitialOnboardingFormData());

    const advanceTimerRef = useRef(null);
    const queuedStepKeyRef = useRef("");
    const [pendingAdvance, setPendingAdvance] = useState(false);

    const uploadOnboardingAvatar = useCallback(
        async (file, accessToken = null) => {
            if (typeof File === "undefined" || !(file instanceof File)) return "";

            const uploadData = new FormData();
            uploadData.append("file", file);

            let response;
            if (accessToken) {
                response = await fetch(`${API_BASE_URL}/upload`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: uploadData,
                });
            } else {
                response = await authFetch("/upload", {
                    method: "POST",
                    body: uploadData,
                });
            }

            if (!response.ok) {
                let message = "Failed to upload profile image.";
                try {
                    const payload = await response.json();
                    message = payload?.error?.message || payload?.message || message;
                } catch {
                    // keep default message
                }
                throw new Error(message);
            }

            const payload = await response.json().catch(() => ({}));
            return String(payload?.data?.url || "").trim();
        },
        [authFetch],
    );

    // ── Steps sequence ──────────────────────────────────────────────────
    const steps = useMemo(() => {
        const sequence = [];
        // DEBUG LOG TO TRACE STATE
        // console.log("Generating steps with formData:", JSON.stringify(formData.serviceDetails, null, 2));

        sequence.push({ key: "welcome", type: "welcome" });
        sequence.push({ key: "role", type: "role" });
        sequence.push({ key: "stats", type: "stats" });
        sequence.push({ key: "profile-basics", type: "profileBasics" });
        sequence.push({ key: "services", type: "services" });
        sequence.push({ key: "niche-preference", type: "nichePreference" });

        formData.selectedServices.forEach((serviceKey, index) => {
            if (index > 0) {
                sequence.push({ key: `svc-transition-${index}`, type: "serviceTransition" });
            }

            sequence.push({ key: `svc-${serviceKey}-experience`, type: "serviceExperience", serviceKey });

            getServiceGroups(serviceKey).forEach((group) => {
                sequence.push({
                    key: `svc-${serviceKey}-group-${group.id}`,
                    type: "serviceGroup",
                    serviceKey,
                    groupId: group.id,
                });
            });

            sequence.push({ key: `svc-${serviceKey}-pricing-strategy`, type: "pricingStrategy", serviceKey });

            sequence.push({ key: `svc-${serviceKey}-avg-price`, type: "serviceAveragePrice", serviceKey });
            sequence.push({ key: `svc-${serviceKey}-complexity`, type: "serviceComplexity", serviceKey });
            sequence.push({ key: `svc-${serviceKey}-portfolio-importance`, type: "portfolioImportance", serviceKey });

            sequence.push({ key: `svc-${serviceKey}-projects`, type: "serviceProjects", serviceKey });

            const detail = formData.serviceDetails?.[serviceKey];
            if (detail?.hasPreviousProjects === "yes") {
                // Ensure at least one project exists to generate the step
                const projects = detail.projects && detail.projects.length > 0 ? detail.projects : [{}];
                projects.forEach((_, pIndex) => {
                    sequence.push({
                        key: `svc-${serviceKey}-project-${pIndex}`,
                        type: "serviceProjectDetails",
                        serviceKey,
                        projectIndex: pIndex,
                        totalProjects: projects.length
                    });
                });
            }

            if (detail?.hasPreviousProjects === "no") {
                sequence.push({ key: `svc-${serviceKey}-sample-work`, type: "serviceSampleWork", serviceKey });
                if (detail?.hasSampleWork === "yes") {
                    sequence.push({ key: `svc-${serviceKey}-sample-upload`, type: "serviceSampleUpload", serviceKey });
                }
            }







            // Verify state for debugging
            // console.log(`Service: ${serviceKey}, hasPreviousProjects: ${detail?.hasPreviousProjects}`);


        });

        sequence.push({ key: "hours", type: "hours" });

        sequence.push({ key: "start-timeline", type: "startTimeline" });
        sequence.push({ key: "accept-in-progress", type: "acceptInProgressProjects" });
        sequence.push({ key: "delivery-policy", type: "deliveryPolicy" });
        sequence.push({ key: "communication-policy", type: "communicationPolicy" });

        return sequence;
    }, [formData]);

    const totalSteps = steps.length;
    const currentStep = steps[currentStepIndex];
    const onboardingStorageKeys = useMemo(
        () => getFreelancerOnboardingStorageKeys(user),
        [user?.id, user?.email],
    );

    const [isLoaded, setIsLoaded] = useState(false);

    // ── Persistence ─────────────────────────────────────────────────────
    useEffect(() => {
        setIsLoaded(false);

        const savedData = localStorage.getItem(onboardingStorageKeys.dataKey);
        const savedStep = localStorage.getItem(onboardingStorageKeys.stepKey);

        // Clear legacy global draft keys to prevent cross-account leakage.
        localStorage.removeItem(LEGACY_FREELANCER_ONBOARDING_STORAGE_KEYS.dataKey);
        localStorage.removeItem(LEGACY_FREELANCER_ONBOARDING_STORAGE_KEYS.stepKey);

        let nextFormData = createInitialOnboardingFormData();
        let nextStepIndex = 0;

        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (parsed && typeof parsed === "object") {
                    nextFormData = {
                        ...nextFormData,
                        ...parsed,
                    };
                }
            } catch (e) {
                console.error("Failed to parse saved form data", e);
            }
        }

        if (savedStep) {
            const parsedStep = parseInt(savedStep, 10);
            if (Number.isFinite(parsedStep) && parsedStep >= 0) {
                nextStepIndex = parsedStep;
            }
        }

        setFormData(nextFormData);
        setCurrentStepIndex(nextStepIndex);
        setIsLoaded(true);
    }, [onboardingStorageKeys.dataKey, onboardingStorageKeys.stepKey]);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(onboardingStorageKeys.dataKey, JSON.stringify(formData));
            localStorage.setItem(onboardingStorageKeys.stepKey, currentStepIndex.toString());
        }
    }, [formData, currentStepIndex, isLoaded, onboardingStorageKeys.dataKey, onboardingStorageKeys.stepKey]);

    useEffect(() => {
        if (!isLoaded) return;
        if (!steps.length) return;
        if (currentStepIndex >= steps.length) {
            setCurrentStepIndex(steps.length - 1);
        }
    }, [steps.length, currentStepIndex, isLoaded]);

    // ── Browser back button ─────────────────────────────────────────────
    useEffect(() => {
        if (currentStepIndex === 0) {
            window.history.replaceState({ step: 0 }, "");
        }

        const handlePopState = (event) => {
            if (currentStepIndex > 0) {
                event.preventDefault();
                window.history.pushState({ step: currentStepIndex - 1 }, "");
                setCurrentStepIndex((prev) => Math.max(0, prev - 1));
                setStepError("");
            }
        };

        window.addEventListener("popstate", handlePopState);
        return () => {
            window.removeEventListener("popstate", handlePopState);
        };
    }, [currentStepIndex]);

    useEffect(() => {
        if (currentStepIndex > 0) {
            window.history.pushState({ step: currentStepIndex }, "");
        }
    }, [currentStepIndex]);

    // ── Auto-init service details ───────────────────────────────────────
    useEffect(() => {
        if (formData.selectedServices.length === 0) return;
        setFormData((prev) => {
            const nextDetails = { ...prev.serviceDetails };
            let changed = false;

            prev.selectedServices.forEach((serviceKey) => {
                if (!nextDetails[serviceKey]) {
                    nextDetails[serviceKey] = createServiceDetail();
                    changed = true;
                }
            });

            return changed ? { ...prev, serviceDetails: nextDetails } : prev;
        });
    }, [formData.selectedServices]);

    // ── Country → State fetch ───────────────────────────────────────────
    useEffect(() => {
        let isCancelled = false;
        const countryName = String(formData.country || "").trim();

        if (!countryName) {
            setStateOptions([]);
            setIsStateOptionsLoading(false);
            return () => {
                isCancelled = true;
            };
        }

        const cachedStates = STATE_OPTIONS_CACHE.get(countryName);
        if (STATE_OPTIONS_CACHE.has(countryName)) {
            setStateOptions(cachedStates);
            setIsStateOptionsLoading(false);
            return () => {
                isCancelled = true;
            };
        }

        setIsStateOptionsLoading(true);

        void fetchStatesByCountry(countryName)
            .then((response) => {
                const nextStates = Array.isArray(response?.states)
                    ? response.states
                        .map((state) => String(state || "").trim())
                        .filter(Boolean)
                        .sort((a, b) => a.localeCompare(b))
                    : [];

                STATE_OPTIONS_CACHE.set(countryName, nextStates);

                if (isCancelled) return;
                setStateOptions(nextStates);
            })
            .catch((error) => {
                console.error("Failed to load state options:", error);
                if (isCancelled) return;
                setStateOptions([]);
            })
            .finally(() => {
                if (isCancelled) return;
                setIsStateOptionsLoading(false);
            });

        return () => {
            isCancelled = true;
        };
    }, [formData.country]);

    // ── OTP auto-submit ─────────────────────────────────────────────────
    useEffect(() => {
        if (!isVerifying) return;
        if (otp.length === 6 && !isSubmitting) {
            handleVerifyOtp();
        }
    }, [otp, isVerifying, isSubmitting]);

    // ── Advance queue effect ────────────────────────────────────────────
    useEffect(() => {
        if (!pendingAdvance) return;
        setPendingAdvance(false);

        if (!currentStep) return;
        if (queuedStepKeyRef.current && queuedStepKeyRef.current !== currentStep.key) {
            return;
        }
        queuedStepKeyRef.current = "";
        const validation = validateStep(currentStep, formData);
        if (validation) {
            setStepError(validation);
            toast.error(validation);
            return;
        }

        if (currentStepIndex >= totalSteps - 1) {
            handleSubmit();
            return;
        }

        setCurrentStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
        setStepError("");
    }, [pendingAdvance, currentStep, currentStepIndex, totalSteps, formData]);

    useEffect(() => () => {
        if (advanceTimerRef.current) {
            clearTimeout(advanceTimerRef.current);
        }
    }, []);

    // ── Helpers ─────────────────────────────────────────────────────────
    const queueAdvance = (delay = 0) => {
        if (advanceTimerRef.current) {
            clearTimeout(advanceTimerRef.current);
        }
        queuedStepKeyRef.current = currentStep?.key || "";
        advanceTimerRef.current = setTimeout(() => {
            setPendingAdvance(true);
        }, delay);
    };

    const checkUsernameAvailability = async (value = formData.username) => {
        const normalized = value.trim();

        if (!normalized) {
            setUsernameStatus("idle");
            return;
        }

        if (normalized.length < 3) {
            setUsernameStatus("too_short");
            return;
        }

        if (!isValidUsername(normalized)) {
            setUsernameStatus("invalid");
            return;
        }

        const currentUsername =
            (user?.profileDetails?.identity?.username ||
                user?.profileDetails?.username ||
                user?.username ||
                "")
                .trim()
                .toLowerCase();

        if (currentUsername && currentUsername === normalized.toLowerCase()) {
            setUsernameStatus("available");
            return;
        }

        const requestId = usernameCheckRef.current + 1;
        usernameCheckRef.current = requestId;
        setUsernameStatus("checking");

        try {
            const freelancers = await listFreelancers();
            if (usernameCheckRef.current !== requestId) return;

            const isTaken = Array.isArray(freelancers) && freelancers.some((freelancer) => {
                const existing =
                    freelancer?.profileDetails?.identity?.username ||
                    freelancer?.profileDetails?.username ||
                    freelancer?.username ||
                    "";
                return existing.trim().toLowerCase() === normalized.toLowerCase();
            });

            setUsernameStatus(isTaken ? "unavailable" : "available");
        } catch (error) {
            if (usernameCheckRef.current !== requestId) return;
            console.error("Failed to check username availability:", error);
            setUsernameStatus("error");
        }
    };

    const debouncedUsernameCheck = useCallback((value) => {
        if (usernameDebounceRef.current) {
            clearTimeout(usernameDebounceRef.current);
        }
        usernameDebounceRef.current = setTimeout(() => {
            checkUsernameAvailability(value);
        }, 500);
    }, [user]);

    useEffect(() => () => {
        if (usernameDebounceRef.current) {
            clearTimeout(usernameDebounceRef.current);
        }
    }, []);

    const handleBack = () => {
        if (advanceTimerRef.current) {
            clearTimeout(advanceTimerRef.current);
        }
        queuedStepKeyRef.current = "";
        if (currentStepIndex > 0) {
            setCurrentStepIndex((prev) => prev - 1);
            setStepError("");
        }
    };

    const updateFormField = (field, value, advanceDelay = null) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (stepError) setStepError("");
        if (advanceDelay !== null) queueAdvance(advanceDelay);
    };

    const setProfilePhoto = useCallback((nextPhoto) => {
        setFormData((prev) => {
            const previousUrl = extractProfilePhotoUrl(prev.profilePhoto);
            const nextUrl = extractProfilePhotoUrl(nextPhoto);

            if (
                previousUrl.startsWith("blob:") &&
                previousUrl &&
                previousUrl !== nextUrl
            ) {
                URL.revokeObjectURL(previousUrl);
            }

            return {
                ...prev,
                profilePhoto: nextPhoto,
            };
        });

        setStepError((previousError) => (previousError ? "" : previousError));
    }, []);

    const clearProfilePhoto = useCallback(() => {
        setProfilePhoto(null);
    }, [setProfilePhoto]);

    const closeProfileCropDialog = useCallback(() => {
        setIsProfileCropOpen(false);
        setPendingProfilePhotoFile(null);
    }, []);

    const handleProfilePhotoSelect = useCallback((file) => {
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
                    PROFILE_PHOTO_PICK_MAX_BYTES,
                )} before cropping.`,
            );
            return;
        }

        setPendingProfilePhotoFile(file);
        setIsProfileCropOpen(true);
    }, []);

    const handleProfilePhotoCropped = useCallback((croppedFile) => {
        if (!(typeof File !== "undefined" && croppedFile instanceof File)) {
            toast.error("Unable to process profile image.");
            return;
        }

        if (croppedFile.size > AVATAR_UPLOAD_MAX_BYTES) {
            toast.error(
                `Cropped image is ${formatFileSize(croppedFile.size)}. Please crop tighter and try again.`,
            );
            return;
        }

        const nextPhoto = {
            name: croppedFile.name,
            url: URL.createObjectURL(croppedFile),
            file: croppedFile,
        };
        setProfilePhoto(nextPhoto);
        closeProfileCropDialog();
    }, [closeProfileCropDialog, setProfilePhoto]);

    const clearOnboardingDraftStorage = useCallback(() => {
        localStorage.removeItem(onboardingStorageKeys.dataKey);
        localStorage.removeItem(onboardingStorageKeys.stepKey);
    }, [onboardingStorageKeys.dataKey, onboardingStorageKeys.stepKey]);

    const handleCountryChange = (country, advanceDelay = null) => {
        setFormData((prev) => {
            if (prev.country === country) return prev;
            return {
                ...prev,
                country,
                city: "",
            };
        });
        if (stepError) setStepError("");
        if (advanceDelay !== null) queueAdvance(advanceDelay);
    };

    const updateServiceField = (serviceKey, field, value, advanceDelay = null) => {
        setFormData((prev) => {
            const details = prev.serviceDetails?.[serviceKey] || createServiceDetail();
            return {
                ...prev,
                serviceDetails: {
                    ...prev.serviceDetails,
                    [serviceKey]: {
                        ...details,
                        [field]: value,
                    },
                },
            };
        });
        if (stepError) setStepError("");
        if (advanceDelay !== null) queueAdvance(advanceDelay);
    };

    const updateServiceCaseField = (serviceKey, field, value, advanceDelay = null) => {
        setFormData((prev) => {
            const details = prev.serviceDetails?.[serviceKey] || createServiceDetail();
            return {
                ...prev,
                serviceDetails: {
                    ...prev.serviceDetails,
                    [serviceKey]: {
                        ...details,
                        caseStudy: {
                            ...(details.caseStudy || {}),
                            [field]: value,
                        },
                    },
                },
            };
        });
        if (stepError) setStepError("");
        if (advanceDelay !== null) queueAdvance(advanceDelay);
    };

    const hasMultipleChoices = (options = []) => Array.isArray(options) && options.length > 1;
    const hasSingleChoice = (options = []) => Array.isArray(options) && options.length === 1;

    const toggleServiceSelection = (serviceKey) => {
        const current = formData.selectedServices;
        const exists = current.includes(serviceKey);

        const next = exists
            ? current.filter((item) => item !== serviceKey)
            : [...current, serviceKey];

        setFormData((prev) => ({ ...prev, selectedServices: next }));

        if (hasSingleChoice(SERVICE_OPTIONS) && !exists && next.length > 0) {
            queueAdvance(0);
        }
    };

    // ── Validation ──────────────────────────────────────────────────────
    const validateStep = (step, data) => {
        if (!step) return "";

        const detail = step.serviceKey ? data.serviceDetails?.[step.serviceKey] : null;

        switch (step.type) {
            case "profileBasics":
                if (!data.professionalTitle.trim()) return "Please enter your profession title.";
                if (!data.username.trim()) return "Please enter a username.";
                if (!isValidUsername(data.username)) {
                    return "Username must be 3-20 characters and only letters, numbers, or underscores.";
                }
                if (usernameStatus === "checking") return "Checking username availability...";
                if (usernameStatus === "unavailable") return "That username is already taken.";
                if (usernameStatus === "too_short") return "Username must be at least 3 characters.";
                if (usernameStatus === "invalid") return "Only letters, numbers, and underscores allowed.";
                if (usernameStatus === "error") return "Unable to verify username. Please try again.";
                if (usernameStatus !== "available") return "Please check username availability.";
                if (!data.country) return "Please select your country.";
                if (!data.city.trim()) return "Please select your state.";
                if (!data.profilePhoto) return "Please upload a profile photo.";
                if (
                    extractProfilePhotoFile(data.profilePhoto)?.size >
                    AVATAR_UPLOAD_MAX_BYTES
                ) {
                    return "Profile image must be 5MB or smaller. Please crop or choose another image.";
                }
                if (!data.languages.length) return "Please select at least one language.";
                if (data.languages.includes("Other") && !data.otherLanguage.trim()) {
                    return "Please specify your other language.";
                }
                if (data.linkedinUrl.trim() && !isValidUrl(data.linkedinUrl.trim())) {
                    return "Please enter a valid LinkedIn profile URL.";
                }
                if (data.portfolioUrl.trim() && !isValidUrl(data.portfolioUrl.trim())) {
                    return "Please enter a valid portfolio or website URL.";
                }
                return "";
            case "professionalTitle":
                return data.professionalTitle.trim() ? "" : "Please enter your profession title.";
            case "username":
                if (!data.username.trim()) return "Please enter a username.";
                if (!isValidUsername(data.username)) {
                    return "Username must be 3-20 characters and only letters, numbers, or underscores.";
                }
                if (usernameStatus === "checking") return "Checking username availability...";
                if (usernameStatus === "unavailable") return "That username is already taken.";
                if (usernameStatus === "too_short") return "Username must be at least 3 characters.";
                if (usernameStatus === "invalid") return "Only letters, numbers, and underscores allowed.";
                if (usernameStatus === "error") return "Unable to verify username. Please try again.";
                if (usernameStatus !== "available") return "Please check username availability.";
                return "";
            case "country":
                return data.country ? "" : "Please select your country.";
            case "city":
                return data.city.trim() ? "" : "Please select your state.";
            case "profilePhoto":
                if (!data.profilePhoto) return "Please upload a profile photo.";
                if (
                    extractProfilePhotoFile(data.profilePhoto)?.size >
                    AVATAR_UPLOAD_MAX_BYTES
                ) {
                    return "Profile image must be 5MB or smaller. Please crop or choose another image.";
                }
                return "";
            case "languages":
                if (!data.languages.length) return "Please select at least one language.";
                if (data.languages.includes("Other") && !data.otherLanguage.trim()) {
                    return "Please specify your other language.";
                }
                return "";
            case "linkedin":
                return data.linkedinUrl.trim() && !isValidUrl(data.linkedinUrl.trim())
                    ? "Please enter a valid LinkedIn profile URL."
                    : "";
            case "portfolio":
                return data.portfolioUrl.trim() && !isValidUrl(data.portfolioUrl.trim())
                    ? "Please enter a valid portfolio or website URL."
                    : "";
            case "role":
                return data.role ? "" : "Please select how you want to work on Catalance.";
            case "nichePreference":
                if (!data.globalIndustryFocus.length) return "Please select at least one industry/niche.";
                if (data.globalIndustryFocus.includes("Other") && !data.globalIndustryOther.trim()) {
                    return "Please specify your other niche.";
                }
                return "";
            case "services":
                return data.selectedServices.length > 0 ? "" : "Please select at least one service.";
            case "serviceExperience":
                return detail?.experienceYears ? "" : "Please select your experience for this service.";
            case "serviceLevel":
                return detail?.workingLevel ? "" : "Please select your working level.";
            case "serviceProjects":
                return detail?.hasPreviousProjects ? "" : "Please select an option.";
            case "serviceProjectDetails": {
                const projects = detail?.projects || [];
                const project = projects[step.projectIndex];
                if (!project) return "Please fill out project details.";

                if (!project.title?.trim()) return "Please enter project title.";
                if (!project.description?.trim()) return "Please enter project description.";
                if (!project.role) return "Please select your role.";
                if (!project.timeline) return "Please select timeline.";
                if (!project.budget) return "Please select budget.";
                if (!project.techStack?.length) return "Please select tech stack.";

                return "";
            }
            case "serviceSampleWork":
                return detail?.hasSampleWork ? "" : "Please select an option.";
            case "serviceSampleUpload":
                return detail?.sampleWork ? "" : "Please upload a sample or practice work.";
            case "serviceAveragePrice": {
                return detail?.averageProjectPrice ? "" : "Please select an average project price range.";
            }
            case "serviceGroup": {
                const groups = detail?.groups || {};
                const selections = Array.isArray(groups[step.groupId]) ? groups[step.groupId] : [];
                const group = getServiceGroups(step.serviceKey).find((entry) => entry.id === step.groupId);
                const minSelections = group?.min || 1;
                const optionValues = Array.isArray(group?.options)
                    ? group.options
                        .map((option) => {
                            if (typeof option === "string") return option;
                            const value = option?.value ?? option?.label;
                            return typeof value === "string" ? value : "";
                        })
                        .map((value) => value.trim())
                        .filter(Boolean)
                    : [];

                const otherOptionValue = optionValues.find((value) => value.toLowerCase() === "other") || null;
                const otherSelected = Boolean(otherOptionValue && selections.includes(otherOptionValue));
                const customValues = otherSelected
                    ? normalizeCustomTools(parseCustomTools(detail?.groupOther?.[step.groupId] || ""))
                    : [];

                if (otherSelected && customValues.length === 0) {
                    return "Please add at least one custom option.";
                }

                const selectedWithoutOther = otherOptionValue
                    ? selections.filter((value) => value !== otherOptionValue)
                    : selections;
                const totalSelections = selectedWithoutOther.length + customValues.length;

                return totalSelections >= minSelections
                    ? ""
                    : `Please select at least ${minSelections} option${minSelections > 1 ? "s" : ""}.`;
            }
            case "serviceIndustryFocus":
                return detail?.industryFocus ? "" : "Please select an option.";
            case "serviceNiches":
                if (!detail?.niches?.length) return "Please select at least one niche.";
                if (detail.niches.includes("Other") && !detail.otherNiche.trim()) {
                    return "Please specify your other niche.";
                }
                return "";
            case "serviceIndustryOnly":
                return detail?.preferOnlyIndustries ? "" : "Please select an option.";
            case "serviceComplexity":
                return detail?.projectComplexity ? "" : "Please select a complexity level.";
            case "deliveryPolicy":
                return data.deliveryPolicyAccepted ? "" : "Please accept the delivery and revision policy.";
            case "hours":
                return data.hoursPerWeek ? "" : "Please select weekly availability.";
            case "workingSchedule":
                return data.workingSchedule ? "" : "Please select a working schedule.";
            case "startTimeline":
                return data.startTimeline ? "" : "Please select when you can start.";
            case "missedDeadlines":
                return data.missedDeadlines ? "" : "Please select your deadline history.";
            case "delayHandling":
                return data.delayHandling ? "" : "Please select how you handle delays.";
            case "communicationPolicy":
                return data.communicationPolicyAccepted ? "" : "Please accept the communication policy.";
            case "acceptInProgressProjects":
                return data.acceptInProgressProjects ? "" : "Please select an option.";
            case "bio":
                if (!data.professionalBio.trim()) return "Please write a short professional bio.";
                return data.termsAccepted ? "" : "Please agree to the terms and conditions.";
            default:
                return "";
        }
    };

    // ── Submit ──────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (isSubmitting) return;

        const validation = validateStep(currentStep, formData);
        if (validation) {
            setStepError(validation);
            toast.error(validation);
            return;
        }

        setIsSubmitting(true);
        setStepError("");

        try {
            const profilePhotoFile = extractProfilePhotoFile(formData.profilePhoto);
            const profilePhotoPreviewUrl = extractProfilePhotoUrl(formData.profilePhoto);
            if (profilePhotoFile && profilePhotoFile.size > AVATAR_UPLOAD_MAX_BYTES) {
                throw new Error(
                    "Profile image must be 5MB or smaller. Please crop or choose another image.",
                );
            }
            const hasBlobOnlyProfilePhoto =
                profilePhotoPreviewUrl.startsWith("blob:") && !profilePhotoFile;
            if (hasBlobOnlyProfilePhoto) {
                throw new Error("Please re-upload your profile photo before submitting.");
            }
            let resolvedAvatarUrl = normalizeAvatarUrl(profilePhotoPreviewUrl);

            if (user && profilePhotoFile) {
                const uploadedAvatarUrl = await uploadOnboardingAvatar(profilePhotoFile);
                if (uploadedAvatarUrl) {
                    resolvedAvatarUrl = uploadedAvatarUrl;
                }
            }

            const identity = {
                professionalTitle: formData.professionalTitle,
                username: formData.username,
                country: formData.country,
                city: formData.city,
                profilePhoto: resolvedAvatarUrl || null,
                languages: formData.languages,
                otherLanguage: formData.otherLanguage,
                linkedinUrl: formData.linkedinUrl,
                portfolioUrl: formData.portfolioUrl,
            };

            const onboardingSkills = buildOnboardingSkills({
                identity,
                role: formData.role,
                services: formData.selectedServices,
                serviceDetails: formData.serviceDetails,
                globalIndustryFocus: formData.globalIndustryFocus,
                globalIndustryOther: formData.globalIndustryOther,
                professionalBio: formData.professionalBio,
            });
            const onboardingPortfolioProjects = buildPortfolioProjectsFromServiceDetails(
                formData.serviceDetails,
            );
            const onboardingLocation = buildLocationLabel({
                city: formData.city,
                country: formData.country,
            });

            const freelancerProfile = {
                identity,
                role: formData.role,
                services: formData.selectedServices,
                globalIndustryFocus: formData.globalIndustryFocus,
                globalIndustryOther: formData.globalIndustryOther,
                serviceDetails: formData.serviceDetails,
                skills: onboardingSkills,
                portfolioProjects: onboardingPortfolioProjects,
                availability: {
                    hoursPerWeek: formData.hoursPerWeek,
                    workingSchedule: formData.workingSchedule,
                    startTimeline: formData.startTimeline,
                },
                reliability: {
                    missedDeadlines: formData.missedDeadlines,
                    delayHandling: formData.delayHandling,
                },
                deliveryPolicyAccepted: formData.deliveryPolicyAccepted,
                communicationPolicyAccepted: formData.communicationPolicyAccepted,
                acceptInProgressProjects: formData.acceptInProgressProjects,
                termsAccepted: formData.termsAccepted,
                professionalBio: formData.professionalBio,
            };

            if (user) {
                const updatePayload = {
                    profileDetails: freelancerProfile,
                    skills: onboardingSkills,
                    portfolioProjects: onboardingPortfolioProjects,
                    location: onboardingLocation,
                    bio: formData.professionalBio,
                    linkedin: formData.linkedinUrl,
                    portfolio: formData.portfolioUrl,
                    onboardingComplete: true,
                };

                if (resolvedAvatarUrl) {
                    updatePayload.avatar = resolvedAvatarUrl;
                }

                await updateProfile(updatePayload);

                await refreshUser();
                clearOnboardingDraftStorage();

                toast.success("Profile completed successfully!");
                navigate("/freelancer", { replace: true });
                return;
            }

            if (!formData.fullName.trim() || !formData.email.trim() || !formData.password.trim()) {
                toast.error("Please sign up or log in before completing onboarding.");
                setIsSubmitting(false);
                return;
            }

            const authPayload = await signup({
                fullName: formData.fullName.trim(),
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                role: "FREELANCER",
                freelancerProfile,
                skills: onboardingSkills,
                portfolioProjects: onboardingPortfolioProjects,
                location: onboardingLocation,
                onboardingComplete: true,
                portfolio: formData.portfolioUrl,
                linkedin: formData.linkedinUrl,
                bio: formData.professionalBio,
                avatar: resolvedAvatarUrl || undefined,
            });

            if (!authPayload?.accessToken) {
                setIsVerifying(true);
                setIsSubmitting(false);
                if (authPayload?.emailDelivery === "not_sent") {
                    toast.warning(
                        "Verification email could not be delivered. Use the OTP from backend logs in development."
                    );
                } else {
                    toast.success("Verification code sent to your email!");
                }
                return;
            }

            setAuthSession(authPayload?.user, authPayload?.accessToken);
            clearOnboardingDraftStorage();

            toast.success("Your freelancer account has been created.");
            navigate("/freelancer", { replace: true });
        } catch (error) {
            const message = error?.message || "Unable to complete setup right now.";
            setStepError(message);
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length < 6) {
            toast.error("Please enter a valid verification code");
            return;
        }

        setIsSubmitting(true);
        try {
            const normalizedEmail = formData.email.trim().toLowerCase();
            const authPayload = await verifyOtp({ email: normalizedEmail, otp });

            setAuthSession(authPayload?.user, authPayload?.accessToken);

            const verifiedAccessToken = authPayload?.accessToken;
            const profilePhotoFile = extractProfilePhotoFile(formData.profilePhoto);
            if (profilePhotoFile && profilePhotoFile.size > AVATAR_UPLOAD_MAX_BYTES) {
                throw new Error(
                    "Profile image must be 5MB or smaller. Please crop or choose another image.",
                );
            }
            if (verifiedAccessToken && profilePhotoFile) {
                try {
                    const uploadedAvatarUrl = await uploadOnboardingAvatar(
                        profilePhotoFile,
                        verifiedAccessToken,
                    );
                    if (uploadedAvatarUrl) {
                        const saveAvatarResponse = await fetch(`${API_BASE_URL}/auth/profile`, {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${verifiedAccessToken}`,
                            },
                            body: JSON.stringify({ avatar: uploadedAvatarUrl }),
                        });
                        if (!saveAvatarResponse.ok) {
                            throw new Error("Profile image upload succeeded but profile update failed.");
                        }
                    }
                } catch (uploadError) {
                    console.error("Unable to persist onboarding profile image:", uploadError);
                    toast.warning("Account verified, but profile image could not be saved.");
                }
            }

            clearOnboardingDraftStorage();

            toast.success("Account verified and created successfully!");
            navigate("/freelancer", { replace: true });
        } catch (error) {
            toast.error(error.message || "Invalid verification code");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Render helpers ──────────────────────────────────────────────────
    const renderServiceMeta = (serviceKey) => {
        const totalServices = formData.selectedServices.length;
        if (totalServices <= 1) return "";

        const index = formData.selectedServices.indexOf(serviceKey);
        if (index === -1) return "";

        const label = getServiceLabel(serviceKey);
        return `${index + 1} of ${totalServices}: ${label}`;
    };



    const renderContinueButton = (step = currentStep, { show = true } = {}) => {
        if (!show) return null;
        const validation = validateStep(step, formData);
        const disabled = Boolean(validation);

        const footer = (
            <div className="fixed inset-x-0 bottom-0 z-40 pointer-events-none">
                <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-zinc-950/95 to-transparent" />
                <div className="relative mx-auto max-w-4xl px-6 pt-4 sm:pt-6 pb-4 sm:pb-6 flex justify-center">
                    <button
                        type="button"
                        onClick={() => queueAdvance(0)}
                        disabled={disabled}
                        className={cn(
                            "pointer-events-auto min-w-[180px] px-8 py-3 rounded-xl font-semibold transition-all",
                            disabled
                                ? "bg-transparent border border-white/10 text-white/40 cursor-not-allowed"
                                : "bg-primary border border-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20"
                        )}
                    >
                        Continue
                    </button>
                </div>
            </div>
        );

        if (typeof document === "undefined") return footer;
        return createPortal(footer, document.body);
    };

    // ── Shared props ────────────────────────────────────────────────────
    const sharedProps = {
        formData,
        updateFormField,
        updateServiceField,
        updateServiceCaseField,
        queueAdvance,
        hasMultipleChoices,
        hasSingleChoice,
        parseCustomTools,
        normalizeCustomTools,
        renderContinueButton,
        renderServiceMeta,
        currentStep,
    };

    // ── Step router ─────────────────────────────────────────────────────
    const renderCurrentStep = () => {
        if (isVerifying) return <OtpVerificationStep formData={formData} otp={otp} setOtp={setOtp} isSubmitting={isSubmitting} />;
        if (!currentStep) return null;

        switch (currentStep.type) {
            case "welcome":
                return <WelcomeStep {...sharedProps} />;
            case "stats":
                return <StatsStep {...sharedProps} />;
            case "pricingStrategy":
                return <PricingStrategyStep {...sharedProps} />;
            case "profileBasics":
                return (
                    <ProfileBasicsStep
                        {...sharedProps}
                        onProfilePhotoSelect={handleProfilePhotoSelect}
                        clearProfilePhoto={clearProfilePhoto}
                        handleCountryChange={handleCountryChange}
                        usernameStatus={usernameStatus}
                        debouncedUsernameCheck={debouncedUsernameCheck}
                        usernameDebounceRef={usernameDebounceRef}
                        checkUsernameAvailability={checkUsernameAvailability}
                        stateOptions={stateOptions}
                        isStateOptionsLoading={isStateOptionsLoading}
                    />
                );
            case "professionalTitle":
                return <ProfessionalTitleStep {...sharedProps} />;
            case "username":
                return (
                    <UsernameStep
                        {...sharedProps}
                        usernameStatus={usernameStatus}
                        debouncedUsernameCheck={debouncedUsernameCheck}
                        usernameDebounceRef={usernameDebounceRef}
                        checkUsernameAvailability={checkUsernameAvailability}
                    />
                );
            case "country":
                return <CountryStep formData={formData} handleCountryChange={handleCountryChange} />;
            case "city":
                return (
                    <CityStep
                        {...sharedProps}
                        stateOptions={stateOptions}
                        isStateOptionsLoading={isStateOptionsLoading}
                    />
                );
            case "profilePhoto":
                return (
                    <ProfilePhotoStep
                        {...sharedProps}
                        onProfilePhotoSelect={handleProfilePhotoSelect}
                        clearProfilePhoto={clearProfilePhoto}
                    />
                );
            case "languages":
                return <LanguagesStep {...sharedProps} />;
            case "linkedin":
                return <LinkedinStep {...sharedProps} />;
            case "portfolio":
                return <PortfolioStep {...sharedProps} />;
            case "role":
                return <RoleStep formData={formData} updateFormField={updateFormField} />;
            case "nichePreference":
                return (
                    <GlobalNicheStep
                        formData={formData}
                        updateFormField={updateFormField}
                        renderContinueButton={renderContinueButton}
                        currentStep={currentStep}
                        hasMultipleChoices={hasMultipleChoices}
                        hasSingleChoice={hasSingleChoice}
                        queueAdvance={queueAdvance}
                    />
                );
            case "services":
                return (
                    <ServicesStep
                        {...sharedProps}
                        toggleServiceSelection={toggleServiceSelection}
                    />
                );
            case "serviceExperience":
                return <ServiceExperienceStep {...sharedProps} serviceKey={currentStep.serviceKey} />;
            case "serviceProjects":
                return <ServiceProjectsStep {...sharedProps} serviceKey={currentStep.serviceKey} />;
            case "serviceProjectDetails":
                return (
                    <ServiceProjectDetailsStep
                        {...sharedProps}
                        serviceKey={currentStep.serviceKey}
                        projectIndex={currentStep.projectIndex}
                        totalProjects={currentStep.totalProjects}
                    />
                );
            case "serviceSampleWork":
                return <ServiceSampleWorkStep {...sharedProps} serviceKey={currentStep.serviceKey} />;
            case "serviceSampleUpload":
                return <ServiceSampleUploadStep {...sharedProps} serviceKey={currentStep.serviceKey} />;
            case "serviceGroup":
                return (
                    <ServiceGroupStep
                        {...sharedProps}
                        serviceKey={currentStep.serviceKey}
                        groupId={currentStep.groupId}
                        groupOtherDrafts={groupOtherDrafts}
                        setGroupOtherDrafts={setGroupOtherDrafts}
                    />
                );
            case "serviceAveragePrice":
                return <ServiceAveragePriceStep {...sharedProps} serviceKey={currentStep.serviceKey} />;
            case "serviceIndustryFocus":
                return <ServiceIndustryFocusStep {...sharedProps} serviceKey={currentStep.serviceKey} />;
            case "serviceNiches":
                return <ServiceNichesStep {...sharedProps} serviceKey={currentStep.serviceKey} />;
            case "serviceIndustryOnly":
                return <ServiceIndustryOnlyStep {...sharedProps} serviceKey={currentStep.serviceKey} />;
            case "serviceComplexity":
                return <ServiceComplexityStep {...sharedProps} serviceKey={currentStep.serviceKey} />;
            case "portfolioImportance":
                return <PortfolioImportanceStep {...sharedProps} />;
            case "serviceTransition":
                return <ServiceTransitionStep {...sharedProps} />;
            case "deliveryPolicy":
                return <DeliveryPolicyStep formData={formData} updateFormField={updateFormField} />;
            case "hours":
                return (
                    <SingleSelectStep
                        title="How Many Hours Can You Dedicate Weekly?"
                        options={HOURS_PER_WEEK_OPTIONS}
                        value={formData.hoursPerWeek}
                        onSelect={(value) => updateFormField("hoursPerWeek", value, 0)}
                    />
                );
            case "workingSchedule":
                return (
                    <SingleSelectStep
                        title="Preferred Working Schedule"
                        options={WORKING_SCHEDULE_OPTIONS}
                        value={formData.workingSchedule}
                        onSelect={(value) => updateFormField("workingSchedule", value, 0)}
                    />
                );
            case "startTimeline":
                return (
                    <SingleSelectStep
                        title="When Can You Usually Start A New Project?"
                        options={START_TIMELINE_OPTIONS}
                        value={formData.startTimeline}
                        onSelect={(value) => updateFormField("startTimeline", value, 0)}
                    />
                );
            case "missedDeadlines":
                return (
                    <SingleSelectStep
                        title="Have You Ever Missed A Project Deadline?"
                        options={DEADLINE_HISTORY_OPTIONS}
                        value={formData.missedDeadlines}
                        onSelect={(value) => updateFormField("missedDeadlines", value, 0)}
                    />
                );
            case "delayHandling":
                return (
                    <SingleSelectStep
                        title="How Do You Handle Project Delays Or Blockers?"
                        options={DELAY_HANDLING_OPTIONS}
                        value={formData.delayHandling}
                        onSelect={(value) => updateFormField("delayHandling", value, 0)}
                    />
                );
            case "communicationPolicy":
                return <CommunicationPolicyStep formData={formData} updateFormField={updateFormField} />;
            case "acceptInProgressProjects":
                return <AcceptInProgressProjectsStep formData={formData} updateFormField={updateFormField} />;
            case "bio":
                return <BioStep {...sharedProps} />;
            default:
                return null;
        }
    };

    // ── Layout ──────────────────────────────────────────────────────────
    if (!isLoaded) return null;

    return (
        <div className="h-screen w-full bg-zinc-950 text-white relative overflow-hidden flex flex-col font-sans selection:bg-primary/30">
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute inset-0 opacity-40 blur-3xl scale-110">
                    <GradientBackground />
                </div>
                <div className="absolute inset-0 bg-black/10 z-[1]" />
            </div>

            <div className="relative z-10 flex flex-col h-full">
                <div className="relative z-50 bg-transparent border-b border-white/5 shrink-0">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/5 w-full">
                        <div
                            className="h-full bg-primary transition-all duration-300 ease-out shadow-[0_0_10px_rgba(253,224,71,0.5)]"
                            style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
                        />
                    </div>

                    <div className="w-full px-6 h-16 relative flex items-center justify-center">
                        {currentStepIndex > 0 && (
                            <button
                                onClick={handleBack}
                                className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-transparent border border-white/10 hover:bg-white/5 text-white transition-all backdrop-blur-md z-20 group"
                            >
                                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                            </button>
                        )}

                        <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">
                            Step {currentStepIndex + 1} of {totalSteps}
                        </span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto w-full custom-scrollbar relative">
                    <div className={cn(
                        "mx-auto px-6 py-8 pb-36 min-h-full flex flex-col",
                        currentStep?.key === "niche-preference" ? "max-w-7xl" : "max-w-4xl"
                    )}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={isVerifying ? "verify" : currentStep?.key}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="w-full my-auto"
                            >
                                {renderCurrentStep()}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>


            </div>
            <ProfileImageCropDialog
                open={isProfileCropOpen}
                file={pendingProfilePhotoFile}
                maxUploadBytes={AVATAR_UPLOAD_MAX_BYTES}
                onApply={handleProfilePhotoCropped}
                onCancel={closeProfileCropDialog}
            />
        </div>
    );
};

export default FreelancerMultiStepForm;
