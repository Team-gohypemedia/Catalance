import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Check from "lucide-react/dist/esm/icons/check";
import Link2 from "lucide-react/dist/esm/icons/link-2";
import Plus from "lucide-react/dist/esm/icons/plus";
import Upload from "lucide-react/dist/esm/icons/upload";
import X from "lucide-react/dist/esm/icons/x";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import IndianRupee from "lucide-react/dist/esm/icons/indian-rupee";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ImageIcon from "lucide-react/dist/esm/icons/image";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Tag from "lucide-react/dist/esm/icons/tag";
import LayoutGrid from "lucide-react/dist/esm/icons/layout-grid";
import Lock from "lucide-react/dist/esm/icons/lock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { API_BASE_URL } from "@/shared/lib/api-client";
import {
  MAX_ONBOARDING_CASE_STUDIES,
  isServiceVisualsUploadValid,
} from "../../Freelancer-Onboarding/service-details";

import {
  CustomSelect,
  ServiceTitleTooltip,
} from "../../Freelancer-Onboarding/slides/shared/ServiceInfoComponents";

const SectionHeader = ({
  number,
  icon: Icon,
  title,
  description,
  isCollapsible = false,
  isExpanded = false,
  onToggle = null,
}) => {
  const content = (
    <div className="flex items-center justify-between gap-3 w-full min-w-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground">
            {number}. {title}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{description}</p>
        </div>
      </div>
      {isCollapsible && (
        <div className="flex h-8 items-center shrink-0">
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground/60 transition-transform duration-200",
              isExpanded ? "rotate-180" : ""
            )}
          />
        </div>
      )}
    </div>
  );

  if (isCollapsible) {
    return (
      <div className="flex items-start justify-between gap-4 w-full">
        <button
          type="button"
          onClick={onToggle}
          className="flex flex-1 items-start text-left cursor-pointer group/header select-none rounded-xl p-2 -m-2 hover:bg-muted/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        >
          {content}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-4 w-full">
      {content}
    </div>
  );
};

const PROJECT_TIMELINE_OPTIONS = [
  { value: "under_1_week", label: "Under 1 Week" },
  { value: "1_2_weeks", label: "1–2 Weeks" },
  { value: "2_4_weeks", label: "2–4 Weeks" },
  { value: "4_6_weeks", label: "4–6 Weeks" },
  { value: "6_8_weeks", label: "6–8 Weeks" },
  { value: "8_12_weeks", label: "8–12 Weeks" },
  { value: "12_plus_weeks", label: "12+ Weeks" },
];

const DELIVERY_TIMELINE_OPTIONS = [
  { value: "1_week", label: "1 Week" },
  { value: "2_weeks", label: "2 Weeks" },
  { value: "3_weeks", label: "3 Weeks" },
  { value: "4_weeks", label: "4 Weeks" },
  { value: "6_weeks", label: "6 Weeks" },
  { value: "8_weeks", label: "8 Weeks" },
  { value: "12_weeks", label: "12 Weeks" },
  { value: "ongoing", label: "Ongoing / Retainer" },
];

const EXPERIENCE_OPTIONS = [
  { value: "entry", label: "Entry Level (0–1 years)" },
  { value: "intermediate", label: "Intermediate (1–3 years)" },
  { value: "experienced", label: "Experienced (3–5 years)" },
  { value: "expert", label: "Expert (5–10 years)" },
  { value: "veteran", label: "Veteran (10+ years)" },
];

const SERVICE_TITLE_MAX = 80;
const WIZARD_DROPDOWN_BOTTOM_OFFSET = 132;
const MAX_KEYWORDS = 5;
const MAX_IMAGES = 2;
const MAX_VIDEOS = 1;
const MAX_MEDIA_FILE_SIZE_BYTES = 4.5 * 1024 * 1024;

const ROLE_OPTIONS = [
  { value: "full_execution", label: "Full execution" },
  { value: "partial_contribution", label: "Partial contribution" },
  { value: "team_project", label: "Team project" },
];

const normalizeServiceLookupToken = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const toServiceHeadingLabel = (value = "") =>
  String(value || "")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const normalizeKeywordValue = (value = "") =>
  String(value || "").trim().toLowerCase();

const getMediaFile = (value) => {
  if (typeof File === "undefined") return null;
  if (value instanceof File) return value;
  return value?.file instanceof File ? value.file : null;
};

const getMediaUrl = (value) =>
  String(value?.uploadedUrl || value?.url || value?.src || "").trim();

const getMediaMimeType = (value) => {
  const file = getMediaFile(value);
  if (file?.type) return String(file.type).trim().toLowerCase();

  return String(value?.mimeType || value?.type || value?.contentType || "")
    .trim()
    .toLowerCase();
};

const isVideoMedia = (value) =>
  String(value?.kind || "").trim().toLowerCase() === "video" ||
  getMediaMimeType(value).startsWith("video/");

const createWizardCaseStudy = () => ({
  id: `case-study-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: "",
  description: "",
  projectLink: "",
  projectFile: null,
  role: "",
  timeline: "",
  budget: "",
  niche: "",
});

const normalizeWizardCaseStudies = (form = {}) => {
  const rawCaseStudies =
    Array.isArray(form.caseStudies) && form.caseStudies.length > 0
      ? form.caseStudies
      : form.caseStudy && typeof form.caseStudy === "object"
        ? [form.caseStudy]
        : [];

  const normalized = rawCaseStudies.map((caseStudy, index) => ({
    title: "",
    description: "",
    projectLink: "",
    projectFile: null,
    role: "",
    timeline: "",
    budget: "",
    niche: "",
    ...(caseStudy || {}),
    id: String(caseStudy?.id || "").trim() || `case-study-${index + 1}`,
  }));

  return normalized.length > 0
    ? normalized
    : [{ ...createWizardCaseStudy(), id: "case-study-1" }];
};

const AddEditServiceWizard = ({
  serviceProfileForm,
  setServiceProfileForm,
  onSave,
  onCancel,
  isDraftingNewService,
  uploadingServiceCover,
  savingServiceProfile,
  serviceTechSuggestionOptions = [],
  serviceSkillInput,
  setServiceSkillInput,
  addServiceSkillTag,
  removeServiceSkillTag,
  onCoverChange,
  servicesCatalog = [], // Pass from parent to resolve serviceId
}) => {
  const [activeStepId, setActiveStepId] = useState("quickInfo");
  const [expandedSections, setExpandedSections] = useState({
    2: false,
    3: false,
  });
  const hasAutoExpandedSec2 = useRef(false);
  const hasAutoExpandedSec3 = useRef(false);

  const [nicheOptions, setNicheOptions] = useState([]);
  const [isLoadingNiches, setIsLoadingNiches] = useState(false);
  
  // Category & Skill specific state
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [toolOptionsByCategory, setToolOptionsByCategory] = useState({});
  const [isToolsLoading, setIsToolsLoading] = useState(false);

  const serviceKey = serviceProfileForm.serviceKey;
  const [marketplaceServices, setMarketplaceServices] = useState([]);
  const [isServicesLoading, setIsServicesLoading] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      setIsServicesLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/marketplace/filters/services`);
        if (response.ok) {
          const payload = await response.json();
          setMarketplaceServices(payload?.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch services:", error);
      } finally {
        setIsServicesLoading(false);
      }
    };
    fetchServices();
  }, []);

  const resolvedServiceId = useMemo(() => {
    if (serviceProfileForm?.serviceId) return serviceProfileForm.serviceId;
    const normalizedKey = normalizeServiceLookupToken(serviceKey);
    if (!normalizedKey) return null;

    // Handle common mismatches between service keys
    const lookupKey = normalizedKey === 'website_development' ? 'web_development' : normalizedKey;

    // Match against marketplace service key/name/label/id variants.
    const mService = marketplaceServices.find((service) => {
      const candidates = [service?.key, service?.name, service?.label, service?.id];
      return candidates.some(
        (candidate) => normalizeServiceLookupToken(candidate) === lookupKey
      );
    });
    if (mService) return mService.id;

    // Fallback to prop-based catalog
    const service = servicesCatalog.find((entry) => {
      const candidates = [entry?.key, entry?.value, entry?.id, entry?.label, entry?.name];
      return candidates.some(
        (candidate) => normalizeServiceLookupToken(candidate) === lookupKey
      );
    });
    return service?.id || null;
  }, [serviceKey, servicesCatalog, marketplaceServices, serviceProfileForm?.serviceId]);

  const selectedSubcategories = useMemo(
    () =>
      Array.isArray(serviceProfileForm.subcategories)
        ? serviceProfileForm.subcategories
        : [],
    [serviceProfileForm.subcategories]
  );

  const selectedCategoryKeys = useMemo(
    () =>
      selectedSubcategories
        .map((subcategory) => String(subcategory?.subCategoryKey || "").trim())
        .filter(Boolean),
    [selectedSubcategories]
  );

  const allCategoryOptions = useMemo(() => {
    const seen = new Set();
    return [
      ...categoryOptions,
      ...selectedSubcategories.map((subcategory) => ({
        value: String(subcategory?.subCategoryKey || "").trim(),
        label: String(subcategory?.label || subcategory?.name || "").trim(),
      })),
    ].filter((option) => {
      const value = String(option?.value || "").trim();
      const label = String(option?.label || "").trim();
      if (!value || !label || seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }, [categoryOptions, selectedSubcategories]);

  const activeSkillCategoryId =
    serviceProfileForm.activeSkillCategory || selectedCategoryKeys[0] || null;

  // Fetch Sub-Categories
  useEffect(() => {
    if (!resolvedServiceId) {
      setCategoryOptions([]);
      return;
    }
    
    const fetchSubCategories = async () => {
      setIsCategoriesLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/marketplace/filters/sub-categories?serviceId=${resolvedServiceId}`);
        if (response.ok) {
          const payload = await response.json();
          const options = (Array.isArray(payload?.data) ? payload.data : [])
            .map((entry) => ({
              value: `catalog:${entry.id}`,
              label: String(entry.name || "").trim(),
            }));
          setCategoryOptions(options);
        }
      } catch (error) {
        console.error("Failed to fetch sub-categories:", error);
      } finally {
        setIsCategoriesLoading(false);
      }
    };
    fetchSubCategories();
  }, [resolvedServiceId]);

  // Cache for fetched tools to avoid redundant requests
  const fetchedToolsCache = useRef({});

  // Fetch tools for all available sub-categories
  useEffect(() => {
    const catalogIds = allCategoryOptions
      .map(option => {
        const match = String(option.value || "").match(/^catalog:(\d+)$/);
        return match ? match[1] : null;
      })
      .filter(Boolean);

    const selectedCatalogIds = (serviceProfileForm.subcategories || [])
      .map(s => s.subCategoryId)
      .filter(Boolean);

    const allIds = [...new Set([...catalogIds, ...selectedCatalogIds])].map(String);
    const idsToFetch = allIds.filter(id => !fetchedToolsCache.current[id]);

    if (!idsToFetch.length) {
      if (allIds.length > 0) {
        // Just update state from cache if needed, but toolOptionsByCategory already has them
        setToolOptionsByCategory(prev => ({ ...prev, ...fetchedToolsCache.current }));
      }
      return;
    }

    const fetchTools = async () => {
      setIsToolsLoading(true);
      try {
        const toolEntries = await Promise.all(
          idsToFetch.map(async (id) => {
            const response = await fetch(`${API_BASE_URL}/marketplace/filters/tools?subCategoryId=${id}`);
            if (response.ok) {
              const payload = await response.json();
              return [id, payload?.data || []];
            }
            return [id, []];
          })
        );
        
        const newTools = Object.fromEntries(toolEntries);
        fetchedToolsCache.current = { ...fetchedToolsCache.current, ...newTools };
        
        setToolOptionsByCategory(prev => ({
          ...prev,
          ...newTools
        }));
      } catch (error) {
        console.error("Failed to fetch tools:", error);
      } finally {
        setIsToolsLoading(false);
      }
    };
    fetchTools();
  }, [allCategoryOptions, serviceProfileForm.subcategories]);

  // Derived active subcategory data
  const activeSubcategory = selectedSubcategories.find(
    s => s.subCategoryKey === activeSkillCategoryId
  ) || null;

  const activeCategoryToolOptions = useMemo(() => {
    const id = activeSubcategory?.subCategoryId;
    return id ? (toolOptionsByCategory[String(id)] || []) : [];
  }, [activeSubcategory, toolOptionsByCategory]);

  const caseStudies = useMemo(
    () => normalizeWizardCaseStudies(serviceProfileForm),
    [serviceProfileForm.caseStudies, serviceProfileForm.caseStudy]
  );
  const activeCaseStudyId =
    serviceProfileForm.activeCaseStudyId || caseStudies[0]?.id || "case-study-1";
  const activeCaseStudyIndex = Math.max(
    0,
    caseStudies.findIndex((caseStudy) => caseStudy.id === activeCaseStudyId)
  );
  const activeCaseStudy = caseStudies[activeCaseStudyIndex] || caseStudies[0];

  // Derive flat skills array for validation/persistence
  useEffect(() => {
    const toolNameById = new Map();
    Object.values(toolOptionsByCategory).forEach(options => {
      (options || []).forEach(o => toolNameById.set(o.id, o.name));
    });

    const derived = [];
    selectedSubcategories.forEach(sub => {
      (sub.selectedToolIds || []).forEach(id => {
        const name = toolNameById.get(id);
        if (name) derived.push(name);
      });
      derived.push(...(sub.customSkillNames || []));
    });

    // Only update if different to avoid infinite loop
    const current = (serviceProfileForm.skillsAndTechnologies || []).join('|');
    const next = [...new Set(derived)].join('|');
    
    if (current !== next) {
      setServiceProfileForm(prev => ({
        ...prev,
        skillsAndTechnologies: [...new Set(derived)]
      }));
    }
  }, [selectedSubcategories, toolOptionsByCategory]);

  // Fetch Niches
  useEffect(() => {
    const fetchNiches = async () => {
      setIsLoadingNiches(true);
      try {
        const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || "https://catalance-api.vercel.app/api";
        const response = await fetch(`${baseUrl}/marketplace/filters/niches`);
        if (response.ok) {
          const payload = await response.json();
          const niches = Array.isArray(payload?.data)
            ? payload.data
                .map((entry) => ({
                  value: String(entry?.name || entry?.value || "").trim(),
                  label: String(entry?.label || entry?.name || "").trim(),
                }))
                .filter((entry) => entry.value && entry.label)
            : [];
          setNicheOptions(niches);
        }
      } catch (error) {
        console.error("Failed to fetch niches:", error);
      } finally {
        setIsLoadingNiches(false);
      }
    };
    fetchNiches();
  }, []);

  // Step Nav
  const steps = ["quickInfo"];
  const currentStepIndex = steps.indexOf(activeStepId);

  const hasServiceInfoSelection = useMemo(() => {
    const subcategories = Array.isArray(serviceProfileForm.subcategories)
      ? serviceProfileForm.subcategories
      : [];

    const hasSubcategorySkillSelection = subcategories.some((entry) => {
      const hasSelectedTool =
        Array.isArray(entry?.selectedToolIds) && entry.selectedToolIds.length > 0;
      const hasCustomSkill =
        Array.isArray(entry?.customSkillNames) &&
        entry.customSkillNames.some((value) => String(value || "").trim().length > 0);

      return hasSelectedTool || hasCustomSkill;
    });
    const hasLegacySkills =
      Array.isArray(serviceProfileForm.skillsAndTechnologies) &&
      serviceProfileForm.skillsAndTechnologies.some(
        (value) => String(value || "").trim().length > 0,
      );

    return hasSubcategorySkillSelection || hasLegacySkills;
  }, [serviceProfileForm.skillsAndTechnologies, serviceProfileForm.subcategories]);

  const validateQuickInfoSection1 = () => {
    if (!String(serviceProfileForm.title || "").trim()) {
      toast.error("Please enter a service title.");
      return false;
    }
    if (
      !Array.isArray(serviceProfileForm.subcategories) ||
      serviceProfileForm.subcategories.length === 0
    ) {
      toast.error("Please select a category.");
      return false;
    }
    if (!hasServiceInfoSelection) {
      toast.error("Please add at least one skill or technology.");
      return false;
    }
    if (!String(serviceProfileForm.description || "").trim()) {
      toast.error("Please add a service description.");
      return false;
    }
    return true;
  };

  const validateQuickInfoSection2 = () => {
    if (!String(serviceProfileForm.experience || "").trim()) {
      toast.error("Please select your experience level.");
      return false;
    }
    if (!String(serviceProfileForm.priceRange || "").trim()) {
      toast.error("Please set a service price.");
      return false;
    }
    return true;
  };

  const validateQuickInfoSection3 = () => {
    const mediaFiles = Array.isArray(serviceProfileForm.mediaFiles)
      ? serviceProfileForm.mediaFiles
      : [];
    if (!isServiceVisualsUploadValid(mediaFiles)) {
      toast.error("Please add up to 2 images and 1 video before continuing.");
      return false;
    }
    return true;
  };

  // Auto-expand sections logic
  useEffect(() => {
    if (activeStepId !== "quickInfo") return;

    if (
      !hasAutoExpandedSec2.current &&
      String(serviceProfileForm.title || "").trim() &&
      hasServiceInfoSelection &&
      String(serviceProfileForm.description || "").trim()
    ) {
      setExpandedSections((prev) => ({ ...prev, 2: true }));
      hasAutoExpandedSec2.current = true;
    }

    if (
      !hasAutoExpandedSec3.current &&
      hasAutoExpandedSec2.current &&
      String(serviceProfileForm.experience || "").trim() &&
      String(serviceProfileForm.priceRange || "").trim()
    ) {
      setExpandedSections((prev) => ({ ...prev, 3: true }));
      hasAutoExpandedSec3.current = true;
    }
  }, [
    activeStepId,
    serviceProfileForm.title,
    hasServiceInfoSelection,
    serviceProfileForm.description,
    serviceProfileForm.experience,
    serviceProfileForm.priceRange,
  ]);

  const handleNext = () => {
    if (activeStepId === "quickInfo") {
      if (!validateQuickInfoSection1()) return;
      if (!validateQuickInfoSection2()) return;
      if (!validateQuickInfoSection3()) return;
    } else if (activeStepId === "caseStudy") {
      if (!String(activeCaseStudy.title || "").trim()) {
        toast.error("Please enter a case study title.");
        return;
      }
      if (!String(activeCaseStudy.description || "").trim()) {
        toast.error("Please add a case study description.");
        return;
      }
      if (!String(activeCaseStudy.niche || "").trim()) {
        toast.error("Please select a niche.");
        return;
      }
      if (!String(activeCaseStudy.role || "").trim()) {
        toast.error("Please enter your role.");
        return;
      }
      if (!String(activeCaseStudy.timeline || "").trim()) {
        toast.error("Please select a timeline.");
        return;
      }
      if (!String(activeCaseStudy.budget || "").trim()) {
        toast.error("Please set a budget.");
        return;
      }
    }

    if (currentStepIndex < steps.length - 1) {
      setActiveStepId(steps[currentStepIndex + 1]);
    } else {
      onSave(serviceProfileForm); // Last step
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setActiveStepId(steps[currentStepIndex - 1]);
    }
  };

  const headerServiceLabel = useMemo(() => {
    const normalizedKey = normalizeServiceLookupToken(serviceProfileForm.serviceKey);
    if (!normalizedKey) return "Service";

    const matchedMarketplaceService = marketplaceServices.find((service) => {
      const candidates = [service?.key, service?.name, service?.label, service?.id];
      return candidates.some(
        (candidate) => normalizeServiceLookupToken(candidate) === normalizedKey
      );
    });

    if (matchedMarketplaceService) {
      return String(
        matchedMarketplaceService?.name || matchedMarketplaceService?.label || ""
      ).trim() || "Service";
    }

    const matchedCatalogService = servicesCatalog.find((service) => {
      const candidates = [service?.key, service?.value, service?.id, service?.name, service?.label];
      return candidates.some(
        (candidate) => normalizeServiceLookupToken(candidate) === normalizedKey
      );
    });

    if (matchedCatalogService) {
      return String(matchedCatalogService?.label || matchedCatalogService?.name || "").trim() || "Service";
    }

    return toServiceHeadingLabel(serviceProfileForm.serviceKey) || "Service";
  }, [serviceProfileForm.serviceKey, marketplaceServices, servicesCatalog]);
  const serviceTitleLength = String(serviceProfileForm.title || "").length;

  const handleSelectedCategoriesChange = useCallback(
    (nextKeys) => {
      setServiceProfileForm((prev) => {
        const existingSubcategories = Array.isArray(prev.subcategories)
          ? prev.subcategories
          : [];
        const nextSubcategories = nextKeys.map((key) => {
          const existing = existingSubcategories.find(
            (subcategory) => subcategory.subCategoryKey === key
          );
          if (existing) return existing;

          const catalogIdMatch = String(key || "").match(/^catalog:(\d+)$/);
          const subCategoryId = catalogIdMatch ? Number(catalogIdMatch[1]) : null;
          const label =
            allCategoryOptions.find((option) => option.value === key)?.label ||
            "Custom Sub-category";

          return {
            subCategoryId,
            subCategoryKey: key,
            label,
            isCustom: !subCategoryId,
            selectedToolIds: [],
            customSkillNames: [],
          };
        });

        return {
          ...prev,
          subcategories: nextSubcategories,
          activeSkillCategory: nextSubcategories.some(
            (subcategory) => subcategory.subCategoryKey === prev.activeSkillCategory
          )
            ? prev.activeSkillCategory
            : nextSubcategories[0]?.subCategoryKey || null,
        };
      });
    },
    [allCategoryOptions, setServiceProfileForm]
  );

  const handleSubcategorySkillChange = useCallback(
    (subcategoryKey, field, values) => {
      setServiceProfileForm((prev) => ({
        ...prev,
        subcategories: (Array.isArray(prev.subcategories) ? prev.subcategories : []).map(
          (subcategory) =>
            subcategory.subCategoryKey === subcategoryKey
              ? { ...subcategory, [field]: values }
              : subcategory
        ),
      }));
    },
    [setServiceProfileForm]
  );
  const updateCaseStudy = useCallback((field, value) => {
    setServiceProfileForm((prev) => {
      const normalizedCaseStudies = normalizeWizardCaseStudies(prev);
      const targetId =
        prev.activeCaseStudyId || normalizedCaseStudies[0]?.id || "case-study-1";
      const nextCaseStudies = normalizedCaseStudies.map((caseStudy) =>
        caseStudy.id === targetId ? { ...caseStudy, [field]: value } : caseStudy
      );
      const nextActiveCaseStudy =
        nextCaseStudies.find((caseStudy) => caseStudy.id === targetId) ||
        nextCaseStudies[0];

      return {
        ...prev,
        caseStudies: nextCaseStudies,
        caseStudy: nextActiveCaseStudy,
        activeCaseStudyId: nextActiveCaseStudy?.id || targetId,
      };
    });
  }, [setServiceProfileForm]);

  const handleAddCaseStudy = useCallback(() => {
    setServiceProfileForm((prev) => {
      const currentCaseStudies = normalizeWizardCaseStudies(prev);
      if (currentCaseStudies.length >= MAX_ONBOARDING_CASE_STUDIES) {
        toast.error("You can add up to 5 case studies.");
        return prev;
      }

      const nextCaseStudy = createWizardCaseStudy();
      const nextCaseStudies = [...currentCaseStudies, nextCaseStudy];

      return {
        ...prev,
        caseStudies: nextCaseStudies,
        caseStudy: nextCaseStudy,
        activeCaseStudyId: nextCaseStudy.id,
      };
    });
  }, [setServiceProfileForm]);

  const mediaFiles = Array.isArray(serviceProfileForm.mediaFiles)
    ? serviceProfileForm.mediaFiles
    : [];
  return (
    <div
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          const activeTag = document.activeElement?.tagName?.toLowerCase();
          if (activeTag === "textarea" || activeTag === "button") {
            return;
          }
          if (!savingServiceProfile && !uploadingServiceCover) {
            e.preventDefault();
            handleNext();
          }
        }
      }}
      className="flex h-full min-h-0 flex-col bg-gradient-to-br from-background via-background/95 to-background/90 rounded-2xl overflow-hidden"
    >
      {/* Header with Glassmorphism */}
      <div className="flex-none mb-4 sm:mb-6 h-16 sm:h-20 border-b border-border px-4 sm:px-8 bg-card backdrop-blur-sm rounded-t-2xl">
        <div className="flex h-full items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={currentStepIndex > 0 ? handleBack : onCancel}
            className="shrink-0 rounded-full border border-muted-foreground/30 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label={currentStepIndex > 0 ? "Go to previous step" : "Close wizard"}
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>

          <div className="flex-1 min-w-0 text-center flex flex-col items-center justify-center">
            <div className="flex items-center justify-center">
              <span className="inline-flex items-center justify-center text-center rounded-full border border-border bg-card px-2 py-0.5 text-[8px] sm:text-[9px] font-medium uppercase tracking-wider text-foreground">
                {isDraftingNewService ? "New Service Setup" : "Editing Service"}
              </span>
            </div>
            <h1 className="mt-0.5 sm:mt-1 text-base sm:text-2xl font-bold tracking-tight text-foreground drop-shadow-sm truncate w-full px-1" title={headerServiceLabel}>
              {headerServiceLabel}
            </h1>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="shrink-0 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close wizard"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
        </div>
      </div>

      {/* Main Content Area with Animated Transitions */}
      <div className="subtle-scrollbar flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6 pr-3 custom-wizard-content">
        
        {/* STEP 1: QUICK INFO (COMBINED) */}
        {activeStepId === "quickInfo" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-12">
            {/* Section 1: Tell clients what you offer */}
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-7 shadow-sm">
              <SectionHeader
                number={1}
                icon={FileText}
                title="Tell clients what you offer"
                description="Your service title and skills"
              />
              
              <div className="mt-6 space-y-6">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <label
                      className="text-xs font-bold uppercase tracking-[0.16em] text-foreground"
                      htmlFor="service-title-input"
                    >
                      Service Title
                    </label>
                    <ServiceTitleTooltip ariaLabel="What should I enter in Service Title?" />
                  </div>
                  <div className="group relative">
                    <input
                      id="service-title-input"
                      type="text"
                      value={serviceProfileForm.title || ""}
                      onChange={(event) => {
                        const nextValue = event.target.value.slice(0, SERVICE_TITLE_MAX);
                        setServiceProfileForm((prev) => ({
                          ...prev,
                          title: nextValue,
                          serviceLabel: nextValue,
                        }));
                      }}
                      placeholder="I will do something I'm really good at"
                      className="h-10 w-full rounded-xl border border-border bg-card px-4 pr-24 !text-[14px] !leading-5 text-foreground outline-none transition-colors placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground placeholder:opacity-50 [&::placeholder]:opacity-50 [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-foreground/30">
                      {serviceTitleLength} / {SERVICE_TITLE_MAX} MAX
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-[0.16em] text-foreground">
                    Select Skill
                  </label>
                  <CategorySkillBrowser
                    categories={allCategoryOptions}
                    selectedCategoryKeys={selectedCategoryKeys}
                    selectedSubcategories={selectedSubcategories}
                    activeCategoryKey={activeSkillCategoryId}
                    toolOptionsByCategory={toolOptionsByCategory}
                    isCategoriesLoading={isCategoriesLoading}
                    isToolsLoading={isToolsLoading}
                    onCategoriesChange={handleSelectedCategoriesChange}
                    onActiveCategoryChange={(value) =>
                      setServiceProfileForm((prev) => ({
                        ...prev,
                        activeSkillCategory: value,
                      }))
                    }
                    onSkillChange={handleSubcategorySkillChange}
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-[0.16em] text-foreground">
                    Service Description
                  </label>
                  <textarea
                    value={serviceProfileForm.description || ""}
                    onChange={(e) =>
                      setServiceProfileForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                        serviceDescription: e.target.value,
                      }))
                    }
                    placeholder="Description..."
                    rows={4}
                    className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 !text-[14px] !leading-5 text-foreground outline-none transition-colors placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground placeholder:opacity-50 [&::placeholder]:opacity-50 [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 custom-textarea"
                    maxLength={500}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Set your price */}
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-7 shadow-sm overflow-hidden">
              <SectionHeader
                number={2}
                icon={Tag}
                title="Set your price"
                description="Experience and pricing"
                isCollapsible
                isExpanded={expandedSections[2]}
                onToggle={() =>
                  setExpandedSections((prev) => ({ ...prev, 2: !prev[2] }))
                }
              />

              <AnimatePresence initial={false}>
                {expandedSections[2] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="mt-6 space-y-6 pt-1">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-2.5">
                          <label className="text-xs font-bold uppercase tracking-[0.16em] text-foreground">
                            Experience
                          </label>
                          <CustomSelect
                            value={serviceProfileForm.experience}
                            onChange={(value) =>
                              setServiceProfileForm((prev) => ({
                                ...prev,
                                experience: value,
                                experienceYears: value,
                              }))
                            }
                            options={EXPERIENCE_OPTIONS}
                            placeholder="Select experience level"
                            viewportBottomOffset={WIZARD_DROPDOWN_BOTTOM_OFFSET}
                            className="h-10"
                          />
                        </div>

                        <div className="space-y-2.5">
                          <label className="text-xs font-bold uppercase tracking-[0.16em] text-foreground">
                            Starting Price
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-foreground/40">
                              ₹
                            </span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={serviceProfileForm.priceRange || ""}
                              onChange={(e) => {
                                const digitsOnly = e.target.value.replace(/\D/g, "");
                                setServiceProfileForm((prev) => ({
                                  ...prev,
                                  priceRange: digitsOnly,
                                  averageProjectPrice: digitsOnly,
                                  averagePrice: digitsOnly,
                                }));
                              }}
                              placeholder="Enter starting price"
                              className="h-10 w-full rounded-xl border border-border bg-card pl-8 pr-4 !text-[14px] !leading-5 text-foreground outline-none transition-colors placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground placeholder:opacity-50 [&::placeholder]:opacity-50 [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                            />
                          </div>
                        </div>


                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Section 3: Enhance your service */}
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-7 shadow-sm overflow-hidden">
              <SectionHeader
                number={3}
                icon={LayoutGrid}
                title="Enhance your service"
                description="Upload images or videos"
                isCollapsible
                isExpanded={expandedSections[3]}
                onToggle={() =>
                  setExpandedSections((prev) => ({ ...prev, 3: !prev[3] }))
                }
              />

              <AnimatePresence initial={false}>
                {expandedSections[3] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="mt-6 pt-1">
                      <div className="space-y-2.5">
                        <label className="text-xs font-bold uppercase tracking-[0.16em] text-foreground">
                          Upload Media
                        </label>
                        <ServiceMediaUploadArea
                          files={mediaFiles}
                          uploading={uploadingServiceCover}
                          onChange={(nextFiles) =>
                            setServiceProfileForm((prev) => ({
                              ...prev,
                              mediaFiles: nextFiles,
                            }))
                          }
                        />
                        <p className="text-xs leading-relaxed text-foreground/35">
                          Upload up to 2 images and 1 video (max 5MB each).
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="flex items-center justify-center gap-2 pt-6 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              <span>You can review everything before publishing</span>
            </div>
          </div>
        )}



      </div>

      {/* Footer Nav with Polished Glass Button */}
      <div className="flex-none mt-2 flex h-20 items-center justify-center border-t border-border px-8 bg-card backdrop-blur-sm rounded-b-2xl">
        <div className="flex gap-4">
          <Button 
            onClick={handleNext} 
            disabled={savingServiceProfile || uploadingServiceCover}
          >
            {savingServiceProfile ? (
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin" /> 
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>{currentStepIndex === steps.length - 1 ? (isDraftingNewService ? "Publish Service" : "Save Changes") : "Continue"}</span>
              </div>
            )}
          </Button>
        </div>
      </div>

      <style jsx>{`
         .custom-wizard-content::-webkit-scrollbar {
           width: 4px;
         }
         .custom-wizard-content::-webkit-scrollbar-track {
           background: #FAF6F0 !important;
         }
         .custom-wizard-content::-webkit-scrollbar-thumb {
           background: #D9692A !important;
           border: 1px solid #FAF6F0 !important;
           border-radius: 20px;
           background-clip: padding-box;
         }
         .custom-textarea {
           transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
         }
         .custom-textarea:focus {
           background: #FFFFFF;
         }
      `}</style>
    </div>
  );
};

// --- HELPERS ---
const toPositiveInteger = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

// --- SUB-COMPONENTS FROM ONBOARDING ---

const KeywordInput = ({
  keywords = [],
  onChange,
  suggestions = [],
  serviceName = "",
  isLoading = false,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const normalizedSelectedKeywords = useMemo(
    () => new Set(keywords.map((keyword) => normalizeKeywordValue(keyword))),
    [keywords]
  );
  const trimmedInputValue = inputValue.trim();
  const normalizedInputValue = normalizeKeywordValue(trimmedInputValue);

  const filteredSuggestions = useMemo(() => {
    const availableSuggestions = suggestions.filter(
      (suggestion) =>
        !normalizedSelectedKeywords.has(normalizeKeywordValue(suggestion))
    );

    if (!normalizedInputValue) {
      return availableSuggestions.slice(0, 8);
    }

    return availableSuggestions
      .filter((suggestion) => {
        const normalizedSuggestion = normalizeKeywordValue(suggestion);
        return (
          normalizedSuggestion.includes(normalizedInputValue) ||
          normalizedSuggestion
            .split(/\s+/)
            .some((token) => token.startsWith(normalizedInputValue))
        );
      })
      .slice(0, 8);
  }, [normalizedInputValue, normalizedSelectedKeywords, suggestions]);

  const canAddTypedValue =
    Boolean(trimmedInputValue) &&
    !trimmedInputValue.includes(",") &&
    !normalizedSelectedKeywords.has(normalizedInputValue);

  const dropdownItems = useMemo(() => {
    const nextItems = [];
    const hasExactSuggestionMatch = filteredSuggestions.some(
      (suggestion) => normalizeKeywordValue(suggestion) === normalizedInputValue
    );

    if (canAddTypedValue && !hasExactSuggestionMatch) {
      nextItems.push({
        id: `custom-${normalizedInputValue}`,
        label: `Add "${trimmedInputValue}"`,
        value: trimmedInputValue,
      });
    }

    filteredSuggestions.forEach((suggestion) => {
      nextItems.push({
        id: `suggestion-${normalizeKeywordValue(suggestion)}`,
        label: suggestion,
        value: suggestion,
      });
    });

    return nextItems;
  }, [
    canAddTypedValue,
    filteredSuggestions,
    normalizedInputValue,
    trimmedInputValue,
  ]);

  const previewSuggestions = useMemo(
    () =>
      suggestions
        .filter(
          (suggestion) =>
            !normalizedSelectedKeywords.has(normalizeKeywordValue(suggestion))
        )
        .slice(0, 6),
    [normalizedSelectedKeywords, suggestions]
  );

  const showDropdown =
    isFocused && dropdownItems.length > 0 && keywords.length < MAX_KEYWORDS;

  const addKeywords = useCallback(
    (raw) => {
      const existingKeywords = new Set(
        keywords.map((keyword) => normalizeKeywordValue(keyword))
      );
      const newTags = raw
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .filter((tag) => !existingKeywords.has(normalizeKeywordValue(tag)));

      if (!newTags.length) return;

      onChange([...keywords, ...newTags].slice(0, MAX_KEYWORDS));
      setInputValue("");
      setHighlightedIndex(-1);
    },
    [keywords, onChange]
  );

  const selectSuggestion = useCallback(
    (value) => {
      if (keywords.length >= MAX_KEYWORDS) return;
      if (normalizedSelectedKeywords.has(normalizeKeywordValue(value))) return;
      onChange([...keywords, value].slice(0, MAX_KEYWORDS));
      setInputValue("");
      setHighlightedIndex(-1);
      inputRef.current?.focus();
    },
    [keywords, normalizedSelectedKeywords, onChange]
  );

  const handleKeyDown = (event) => {
    if (showDropdown) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlightedIndex((prev) =>
          prev < dropdownItems.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : dropdownItems.length - 1
        );
        return;
      }
      if (
        (event.key === "Enter" || event.key === "Tab") &&
        highlightedIndex >= 0 &&
        highlightedIndex < dropdownItems.length
      ) {
        event.preventDefault();
        selectSuggestion(dropdownItems[highlightedIndex].value);
        return;
      }
    }

    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addKeywords(inputValue);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex min-h-[3rem] w-full flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
        {keywords.map((keyword) => (
          <span
            key={keyword}
            className="flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-foreground"
          >
            {keyword}
            <button
              type="button"
              onClick={() =>
                onChange(keywords.filter((entry) => entry !== keyword))
              }
              className="text-foreground/50 transition-colors hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(event) => {
            setInputValue(event.target.value);
            setHighlightedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setTimeout(() => {
              if (inputValue.trim()) addKeywords(inputValue);
            }, 150);
          }}
          disabled={keywords.length >= MAX_KEYWORDS}
          placeholder={keywords.length === 0 ? "Add relevant keywords" : ""}
          className="min-w-[120px] flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/40 disabled:cursor-not-allowed"
        />
      </div>

      {(isLoading || previewSuggestions.length > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.16em] text-foreground/35">
            {isLoading
              ? "Loading keyword suggestions..."
              : `Suggested for ${serviceName || "this service"}`}
          </span>
          {!isLoading &&
            previewSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectSuggestion(suggestion);
                }}
                className="rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-medium text-primary transition-colors hover:border-primary/35 hover:bg-primary/14"
              >
                {suggestion}
              </button>
            ))}
        </div>
      )}

      {showDropdown && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-card shadow-xl">
          {dropdownItems.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                selectSuggestion(item.value);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={cn(
                "flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors",
                index === highlightedIndex
                  ? "bg-primary/15 text-primary"
                  : "text-foreground/70 hover:bg-muted hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ServiceMediaUploadArea = ({
  files = [],
  uploading = false,
  onChange,
}) => {
  const inputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const previewItems = useMemo(() => {
    const items = [];

    files.forEach((entry, index) => {
      const localFile = getMediaFile(entry);
      const isVideo = isVideoMedia(entry);
      const remoteUrl = getMediaUrl(entry);
      const previewUrl =
        localFile && typeof URL !== "undefined"
          ? URL.createObjectURL(localFile)
          : remoteUrl;

      items.push({
        id:
          String(entry?.key || "").trim() ||
          `${String(entry?.name || localFile?.name || "media")}-${index}`,
        name: String(entry?.name || localFile?.name || "Media").trim(),
        isVideo,
        previewUrl,
        fileIndex: index,
        revokePreviewUrl:
          localFile && previewUrl ? () => URL.revokeObjectURL(previewUrl) : null,
      });
    });

    return items;
  }, [files]);

  useEffect(
    () => () => {
      previewItems.forEach((item) => item.revokePreviewUrl?.());
    },
    [previewItems]
  );

  const imageCount = files.filter((file) => !isVideoMedia(file)).length;
  const videoCount = files.filter((file) => isVideoMedia(file)).length;
  const canAddImage = imageCount < MAX_IMAGES;
  const canAddVideo = videoCount < MAX_VIDEOS;
  const canAdd = canAddImage || canAddVideo;
  const acceptTypes = [
    ...(canAddImage ? ["image/*"] : []),
    ...(canAddVideo ? ["video/*"] : []),
  ].join(",");

  const processFiles = useCallback(
    (incoming) => {
      let nextImageCount = imageCount;
      let nextVideoCount = videoCount;
      let hadUnsupportedType = false;
      let hadOversizedFile = false;
      const valid = [];

      Array.from(incoming || []).forEach((file) => {
        const fileType = String(file?.type || "").trim().toLowerCase();
        if (!fileType.startsWith("image/") && !fileType.startsWith("video/")) {
          hadUnsupportedType = true;
          return;
        }

        if (Number(file?.size || 0) > MAX_MEDIA_FILE_SIZE_BYTES) {
          hadOversizedFile = true;
          return;
        }

        if (fileType.startsWith("image/") && nextImageCount < MAX_IMAGES) {
          nextImageCount += 1;
          valid.push(file);
          return;
        }

        if (fileType.startsWith("video/") && nextVideoCount < MAX_VIDEOS) {
          nextVideoCount += 1;
          valid.push(file);
        }
      });

      if (hadUnsupportedType) {
        toast.error("Only image or video files are allowed.");
      } else if (hadOversizedFile) {
        toast.error("Each file must be 4.5MB or smaller.");
      } else if (!valid.length) {
        toast.error("Please add up to 2 images and 1 video.");
      }

      if (!valid.length) return;

      onChange([...files, ...valid]);
    },
    [files, imageCount, onChange, videoCount]
  );

  const removeFile = (item) => {
    onChange(files.filter((_, index) => index !== item.fileIndex));
  };

  return (
    <div className="space-y-3">
      {previewItems.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {previewItems.map((item) => (
            <div
              key={item.id}
              className="group relative h-24 w-24 overflow-hidden rounded-xl border border-border bg-card"
            >
              {item.isVideo && item.previewUrl ? (
                <video
                  src={item.previewUrl}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                  autoPlay
                  loop
                  controls
                  preload="metadata"
                />
              ) : !item.isVideo && item.previewUrl ? (
                <img
                  src={item.previewUrl}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-foreground/40">
                  <ImageIcon className="h-5 w-5" />
                  <span className="text-[10px]">{item.isVideo ? "Video" : "Image"}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeFile(item)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-foreground opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {canAdd && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragOver(false);
            processFiles(event.dataTransfer.files);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 transition-colors",
            isDragOver
              ? "border-primary/60 bg-primary/5"
              : "border-primary/30 bg-transparent hover:border-primary/50"
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <Plus className="h-5 w-5 text-primary" />
            )}
          </div>
          <span className="text-sm font-medium text-foreground/70">
            Upload Media
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={acceptTypes}
        multiple
        onChange={(event) => {
          processFiles(event.target.files);
          event.target.value = "";
        }}
        className="hidden"
      />
    </div>
  );
};

const FileUploadButton = ({ file, onChange }) => {
  const inputRef = useRef(null);
  const fileName = String(file?.name || file?.fileName || "").trim();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm text-foreground/40 transition-colors hover:border-white/20"
      >
        <Upload className="h-4 w-4" />
        <span className="truncate">{fileName || "Upload file"}</span>
      </button>
      {file ? (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        onChange={(event) => {
          const selected = event.target.files?.[0] || null;
          onChange(selected);
          event.target.value = "";
        }}
        className="hidden"
      />
    </div>
  );
};

const CategorySkillBrowser = ({
  categories = [],
  selectedCategoryKeys = [],
  selectedSubcategories = [],
  activeCategoryKey,
  toolOptionsByCategory = {},
  isCategoriesLoading = false,
  isToolsLoading = false,
  onCategoriesChange,
  onActiveCategoryChange,
  onSkillChange,
}) => {
  const [isBrowseOpen, setIsBrowseOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [categoryQuery, setCategoryQuery] = useState("");
  const [requestingType, setRequestingType] = useState("");
  const [pendingToolToAdd, setPendingToolToAdd] = useState(null);
  const browserRef = useRef(null);

  const selectedSet = useMemo(
    () => new Set((Array.isArray(selectedCategoryKeys) ? selectedCategoryKeys : []).map(String)),
    [selectedCategoryKeys]
  );

  const selectedByKey = useMemo(() => {
    const map = new Map();
    (Array.isArray(selectedSubcategories) ? selectedSubcategories : []).forEach((entry) => {
      const key = String(entry?.subCategoryKey || "").trim();
      if (key) map.set(key, entry);
    });
    return map;
  }, [selectedSubcategories]);

  const activeKey = activeCategoryKey || selectedCategoryKeys[0] || "";
  const activeCategory =
    categories.find((category) => String(category.value) === String(activeKey)) ||
    categories.find((category) => selectedSet.has(String(category.value))) ||
    null;
  const activeSubcategory = activeCategory
    ? selectedByKey.get(String(activeCategory.value)) || null
    : null;

  const getToolOptionsForCategory = useCallback(
    (categoryKey) => {
      const subcategory = selectedByKey.get(String(categoryKey));
      let subcategoryId = subcategory?.subCategoryId;
      
      if (!subcategoryId) {
        const match = String(categoryKey || "").match(/^catalog:(\d+)$/);
        subcategoryId = match ? match[1] : null;
      }
      
      return subcategoryId ? toolOptionsByCategory[String(subcategoryId)] || [] : [];
    },
    [selectedByKey, toolOptionsByCategory]
  );

  const normalizedQuery = String(query || "").trim().toLowerCase();
  const normalizedCategoryQuery = String(categoryQuery || "").trim().toLowerCase();

  const visibleCategories = useMemo(() => {
    return categories.filter((category) => {
      const label = String(category?.label || "").toLowerCase();
      const categoryMatches = !normalizedCategoryQuery || label.includes(normalizedCategoryQuery);
      return categoryMatches;
    });
  }, [categories, normalizedCategoryQuery]);

  const activeToolOptions = activeCategory
    ? getToolOptionsForCategory(activeCategory.value)
    : [];
  const selectedToolIds = Array.isArray(activeSubcategory?.selectedToolIds)
    ? activeSubcategory.selectedToolIds
    : [];
  const customSkillNames = Array.isArray(activeSubcategory?.customSkillNames)
    ? activeSubcategory.customSkillNames
    : [];
  const selectedToolSet = new Set(selectedToolIds.map(String));

  const visibleTools = useMemo(() => {
    if (!normalizedCategoryQuery) return activeToolOptions;
    return activeToolOptions.filter((tool) =>
      String(tool?.name || tool?.label || "").toLowerCase().includes(normalizedCategoryQuery)
    );
  }, [activeToolOptions, normalizedCategoryQuery]);

  const searchResults = useMemo(() => {
    if (!normalizedQuery) return { categories: [], skills: [] };
    const matchedCategories = categories.filter((category) =>
      String(category?.label || "").toLowerCase().includes(normalizedQuery)
    );
    const matchedSkills = [];
    categories.forEach((category) => {
      const categoryKey = String(category.value);
      getToolOptionsForCategory(categoryKey).forEach((tool) => {
        const label = String(tool?.name || tool?.label || "").trim();
        if (label.toLowerCase().includes(normalizedQuery)) {
          matchedSkills.push({ tool, categoryKey, categoryLabel: category?.label || "Category" });
        }
      });
    });
    return { categories: matchedCategories, skills: matchedSkills };
  }, [categories, getToolOptionsForCategory, normalizedQuery]);

  const hasSearchResults = searchResults.categories.length > 0 || searchResults.skills.length > 0;
  const totalSelectedSkills = selectedSubcategories.reduce((count, subcategory) => {
    const toolCount = Array.isArray(subcategory?.selectedToolIds) ? subcategory.selectedToolIds.length : 0;
    const customCount = Array.isArray(subcategory?.customSkillNames) ? subcategory.customSkillNames.length : 0;
    return count + toolCount + customCount;
  }, 0);

  useEffect(() => {
    if (!isBrowseOpen && !isSearchOpen) return undefined;
    const handleClickOutside = (event) => {
      if (browserRef.current && !browserRef.current.contains(event.target)) {
        setIsBrowseOpen(false);
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isBrowseOpen, isSearchOpen]);

  const ensureCategorySelected = (categoryKey) => {
    if (!categoryKey) return;
    if (!selectedSet.has(String(categoryKey))) {
      onCategoriesChange([...selectedCategoryKeys, categoryKey]);
    }
    onActiveCategoryChange(categoryKey);
  };

  const toggleCategory = (category) => {
    const key = String(category.value);
    const nextKeys = selectedSet.has(key)
      ? selectedCategoryKeys.filter((value) => String(value) !== key)
      : [...selectedCategoryKeys, key];
    onCategoriesChange(nextKeys);
    if (!selectedSet.has(key)) {
      onActiveCategoryChange(key);
    }
  };

  const toggleToolForCategory = (categoryKey, tool) => {
    const subcategory = selectedByKey.get(String(categoryKey));
    if (!subcategory) return;
    const currentIds = Array.isArray(subcategory.selectedToolIds) ? subcategory.selectedToolIds : [];
    const id = tool.id;
    const exists = currentIds.some((value) => String(value) === String(id));
    const nextIds = exists
      ? currentIds.filter((value) => String(value) !== String(id))
      : [...currentIds, id];
    onSkillChange(subcategory.subCategoryKey, "selectedToolIds", nextIds);
  };

  useEffect(() => {
    if (pendingToolToAdd) {
      const { categoryKey, tool } = pendingToolToAdd;
      const subcategory = selectedByKey.get(String(categoryKey));
      if (subcategory) {
        // Check if the tool is already added to avoid toggling it OFF if they double clicked
        const currentIds = Array.isArray(subcategory.selectedToolIds) ? subcategory.selectedToolIds : [];
        if (!currentIds.some((value) => String(value) === String(tool.id))) {
          onSkillChange(subcategory.subCategoryKey, "selectedToolIds", [...currentIds, tool.id]);
        }
        setPendingToolToAdd(null);
      }
    }
  }, [selectedByKey, pendingToolToAdd, onSkillChange]);

  const toggleTool = (tool) => {
    if (!activeSubcategory) return;
    toggleToolForCategory(activeSubcategory.subCategoryKey, tool);
  };

  const addLocalCategory = (value) => {
    const label = String(value || "").trim();
    if (!label) return;
    const existing = categories.find(
      (category) => String(category.label || "").trim().toLowerCase() === label.toLowerCase()
    );
    const key = existing ? String(existing.value) : label;
    if (!selectedSet.has(key)) {
      onCategoriesChange([...selectedCategoryKeys, key]);
    }
    onActiveCategoryChange(key);
  };

  const addLocalSkill = (value) => {
    const label = String(value || "").trim();
    if (!label) return;
    const targetKey = activeCategory?.value || selectedCategoryKeys[0] || categories[0]?.value;
    if (!targetKey) {
      toast.error("No categories available for this service.");
      return;
    }
    if (!selectedSet.has(String(targetKey))) {
      ensureCategorySelected(targetKey);
    }
    const subcategory = selectedByKey.get(String(targetKey));
    const currentCustom = Array.isArray(subcategory?.customSkillNames) ? subcategory.customSkillNames : [];
    const exists = currentCustom.some((skill) => String(skill).toLowerCase() === label.toLowerCase());
    if (!exists && subcategory) {
      onSkillChange(subcategory.subCategoryKey, "customSkillNames", [...currentCustom, label]);
    }
  };

  const requestMissingOption = async (requestedType) => {
    const requestName = String(query || "").trim();
    if (!requestName || requestingType) return;

    setRequestingType(requestedType);
    try {
      await fetch(`${API_BASE_URL}/user-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request: requestName, requestedType }),
      });
      if (requestedType === "category") {
        addLocalCategory(requestName);
      } else {
        addLocalSkill(requestName);
      }
      toast.success(`${requestName} saved locally and sent for admin review.`);
      setQuery("");
      setIsSearchOpen(false);
    } catch (error) {
      if (requestedType === "category") {
        addLocalCategory(requestName);
      } else {
        addLocalSkill(requestName);
      }
      toast.success(`${requestName} saved locally. Admin request can sync later.`);
      setQuery("");
      setIsSearchOpen(false);
    } finally {
      setRequestingType("");
    }
  };

  const removeCustomSkill = (skill) => {
    if (!activeSubcategory) return;
    onSkillChange(
      activeSubcategory.subCategoryKey,
      "customSkillNames",
      customSkillNames.filter((entry) => entry !== skill)
    );
  };

  const selectedCategoryItems = useMemo(() => {
    return selectedCategoryKeys
      .map((categoryKey) => {
        const category = categories.find((entry) => String(entry.value) === String(categoryKey));
        const subcategory = selectedByKey.get(String(categoryKey));
        return {
          key: String(categoryKey),
          label: category?.label || subcategory?.label || subcategory?.name || String(categoryKey),
        };
      })
      .filter((entry) => entry.key && entry.label);
  }, [categories, selectedByKey, selectedCategoryKeys]);

  const selectedSkillItems = useMemo(() => {
    const items = [];
    selectedSubcategories.forEach((subcategory) => {
      const categoryKey = String(subcategory?.subCategoryKey || "");
      const toolOptions = getToolOptionsForCategory(categoryKey);
      const toolById = new Map(
        toolOptions.map((tool) => [String(tool.id), String(tool.name || tool.label || "Skill")])
      );

      (Array.isArray(subcategory?.selectedToolIds) ? subcategory.selectedToolIds : []).forEach((id) => {
        items.push({
          id: `${categoryKey}:tool:${id}`,
          categoryKey,
          type: "tool",
          value: id,
          label: toolById.get(String(id)) || "Skill",
        });
      });

      (Array.isArray(subcategory?.customSkillNames) ? subcategory.customSkillNames : []).forEach((skill) => {
        const label = String(skill || "").trim();
        if (!label) return;
        items.push({
          id: `${categoryKey}:custom:${label.toLowerCase()}`,
          categoryKey,
          type: "custom",
          value: label,
          label,
        });
      });
    });
    return items;
  }, [getToolOptionsForCategory, selectedSubcategories]);

  const removeCategory = (categoryKey) => {
    onCategoriesChange(selectedCategoryKeys.filter((value) => String(value) !== String(categoryKey)));
  };

  const removeSkillItem = (item) => {
    const subcategory = selectedByKey.get(String(item.categoryKey));
    if (!subcategory) return;

    if (item.type === "tool") {
      const currentIds = Array.isArray(subcategory.selectedToolIds) ? subcategory.selectedToolIds : [];
      onSkillChange(
        subcategory.subCategoryKey,
        "selectedToolIds",
        currentIds.filter((value) => String(value) !== String(item.value))
      );
      return;
    }

    const currentCustom = Array.isArray(subcategory.customSkillNames) ? subcategory.customSkillNames : [];
    onSkillChange(
      subcategory.subCategoryKey,
      "customSkillNames",
      currentCustom.filter((value) => String(value).toLowerCase() !== String(item.value).toLowerCase())
    );
  };

  const summaryText = "Search here";

  return (
    <div ref={browserRef} className="relative">
      <div
        className={cn(
          "flex h-12 w-full overflow-hidden rounded-[18px] border bg-card transition-colors",
          isBrowseOpen || isSearchOpen ? "border-primary/55 shadow-sm" : "border-border"
        )}
      >
        <input
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsBrowseOpen(false);
            setIsSearchOpen(event.target.value.trim().length > 0);
          }}
          onFocus={() => query.trim() && setIsSearchOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && query.trim()) {
              event.preventDefault();
              if (!hasSearchResults) void requestMissingOption(activeCategory ? "skill" : "category");
            }
          }}
          placeholder={summaryText}
          className="min-w-0 flex-1 bg-transparent px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={() => {
            setIsBrowseOpen((value) => !value);
            setIsSearchOpen(false);
            setQuery("");
          }}
          className="flex h-full shrink-0 items-center gap-2 border-l border-border px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted/60"
        >
          Browse
          <ChevronDown className={cn("h-4 w-4 transition-transform", isBrowseOpen && "rotate-180")} />
        </button>
      </div>

      {isCategoriesLoading || isToolsLoading ? (
        <div className="mt-3 space-y-5">
          <div className="flex flex-wrap gap-2">
            <div className="h-10 w-28 animate-pulse rounded-lg bg-muted/60" />
            <div className="h-10 w-24 animate-pulse rounded-lg bg-muted/60" />
            <div className="h-10 w-32 animate-pulse rounded-lg bg-muted/60" />
          </div>
          <div className="space-y-3">
            <p className="h-4 w-16 animate-pulse rounded bg-muted/60" />
            <div className="flex flex-wrap gap-2">
              <div className="h-10 w-24 animate-pulse rounded-lg bg-muted/60" />
              <div className="h-10 w-20 animate-pulse rounded-lg bg-muted/60" />
            </div>
          </div>
        </div>
      ) : (selectedCategoryItems.length > 0 || selectedSkillItems.length > 0) ? (
        <div className="mt-3 space-y-5">
          {selectedCategoryItems.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedCategoryItems.map((category) => (
                <span
                  key={category.key}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground"
                >
                  {category.label}
                  <button
                    type="button"
                    onClick={() => removeCategory(category.key)}
                    className="inline-flex size-5 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
                    aria-label={`Remove ${category.label}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          {selectedSkillItems.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-foreground">
                Skills
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedSkillItems.map((skill) => (
                  <span
                    key={skill.id}
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground"
                  >
                    {skill.label}
                    <button
                      type="button"
                      onClick={() => removeSkillItem(skill)}
                      className="inline-flex size-5 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
                      aria-label={`Remove ${skill.label}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {isSearchOpen && query.trim() ? (
        <div className="mt-2 max-h-80 overflow-y-auto rounded-2xl border border-border bg-card shadow-sm subtle-scrollbar">
          {!hasSearchResults ? (
            <div className="space-y-3 px-4 py-3">
              <p className="text-sm text-muted-foreground">No matching category or skill found.</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    void requestMissingOption("category");
                  }}
                  disabled={Boolean(requestingType)}
                  className="rounded-md border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-60"
                >
                  {requestingType === "category" ? "Sending..." : `Request category "${query.trim()}"`}
                </button>
                <button
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    void requestMissingOption("skill");
                  }}
                  disabled={Boolean(requestingType)}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                >
                  {requestingType === "skill" ? "Sending..." : `Request skill "${query.trim()}"`}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-2">
              {searchResults.categories.length > 0 ? (
                <div>
                  <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-foreground">Categories</p>
                  {searchResults.categories.map((category) => {
                    const key = String(category.value);
                    const isSelected = selectedSet.has(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          ensureCategorySelected(key);
                          setQuery("");
                          setIsSearchOpen(false);
                        }}
                        className="grid min-h-11 w-full grid-cols-[2rem_minmax(0,1fr)_minmax(8rem,0.55fr)] items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-muted/70"
                      >
                        <span className={cn("h-5 w-5 rounded border", isSelected ? "border-primary bg-primary" : "border-border")} />
                        <span className="truncate text-base font-semibold">{category.label}</span>
                        <span className="truncate text-right text-sm text-foreground">{category.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
              {searchResults.skills.length > 0 ? (
                <div>
                  <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-foreground">Skills</p>
                  {searchResults.skills.map(({ tool, categoryKey, categoryLabel }) => (
                    <button
                      key={`${categoryKey}-${tool.id}`}
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        if (!selectedSet.has(categoryKey)) {
                          ensureCategorySelected(categoryKey);
                          setPendingToolToAdd({ categoryKey, tool });
                        } else {
                          toggleToolForCategory(categoryKey, tool);
                        }
                        setQuery("");
                        setIsSearchOpen(false);
                      }}
                      className="grid min-h-11 w-full grid-cols-[2rem_minmax(0,1fr)_minmax(8rem,0.55fr)] items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-muted/70"
                    >
                      <span className="h-5 w-5 rounded border border-border" />
                      <span className="truncate text-base font-semibold">{tool.name || tool.label}</span>
                      <span className="truncate text-right text-sm text-foreground">{categoryLabel}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : null}

      {isBrowseOpen ? (
        <div className="mt-2 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-3">
            <Input
              value={categoryQuery}
              onChange={(event) => setCategoryQuery(event.target.value)}
              placeholder="Search categories..."
              className="h-10 rounded-xl border-border bg-background px-4 text-sm"
            />
          </div>

          <div className="grid min-h-[19rem] grid-cols-1 md:grid-cols-[minmax(15rem,0.95fr)_minmax(0,1.35fr)]">
            <div className="border-b border-border md:border-b-0 md:border-r">
              <div className="flex h-10 items-center justify-between border-b border-border px-4">
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground">Categories</span>
                <span className="text-xs text-foreground/70">{totalSelectedSkills} selected</span>
              </div>
              <div className="max-h-[16.5rem] overflow-y-auto subtle-scrollbar p-2">
                {isCategoriesLoading ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Loading categories...</div>
                ) : visibleCategories.length ? (
                  visibleCategories.map((category) => {
                    const key = String(category.value);
                    const isSelected = selectedSet.has(key);
                    const isActive = String(activeCategory?.value || "") === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          if (isSelected) onActiveCategoryChange(key);
                          else toggleCategory(category);
                        }}
                        onMouseEnter={() => isSelected && onActiveCategoryChange(key)}
                        className={cn(
                          "flex min-h-10 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                          isActive ? "bg-primary/12 text-foreground" : "text-foreground/85 hover:bg-muted/70",
                          isSelected && "font-semibold"
                        )}
                      >
                        <span className="min-w-0 truncate">{category.label}</span>
                        {isSelected ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3 py-2 text-sm text-muted-foreground">No categories found.</div>
                )}
              </div>
            </div>

            <div className="flex min-h-[16.5rem] flex-col p-4">
              {!activeCategory ? (
                <div className="flex flex-1 items-center justify-center text-center text-sm text-foreground">Select a category to manage its skills.</div>
              ) : !selectedSet.has(String(activeCategory.value)) ? (
                <div className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">Select {activeCategory.label} to add skills.</div>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{activeCategory.label}</p>
                    <p className="text-xs text-muted-foreground">Choose preset skills or type in the search field to request a custom skill.</p>
                  </div>

                  <div className="flex min-h-0 flex-1 flex-wrap content-start gap-2 overflow-y-auto subtle-scrollbar pr-1">
                    {visibleTools.map((tool) => {
                      const isSelected = selectedToolSet.has(String(tool.id));
                      const label = String(tool.name || tool.label || "Skill").trim();
                      return (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() => toggleTool(tool)}
                          className={cn(
                            "inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm transition-colors",
                            isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:border-primary/50"
                          )}
                        >
                          {isSelected ? <Check className="h-3.5 w-3.5" /> : null}
                          {label}
                        </button>
                      );
                    })}
                    {isToolsLoading ? (
                      <span className="text-sm text-muted-foreground">Loading skills...</span>
                    ) : visibleTools.length === 0 ? (
                      <span className="text-sm text-muted-foreground">No preset skills found.</span>
                    ) : null}
                  </div>

                  {(selectedToolIds.length > 0 || customSkillNames.length > 0) ? (
                    <div className="border-t border-border pt-3">
                      <div className="flex flex-wrap gap-2">
                        {selectedToolIds.map((id) => {
                          const tool = activeToolOptions.find((entry) => String(entry.id) === String(id));
                          return (
                            <span key={id} className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                              {tool?.name || tool?.label || "Skill"}
                              <button type="button" onClick={() => toggleTool({ id })}><X className="h-3 w-3" /></button>
                            </span>
                          );
                        })}
                        {customSkillNames.map((skill) => (
                          <span key={skill} className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                            {skill}
                            <button type="button" onClick={() => removeCustomSkill(skill)}><X className="h-3 w-3" /></button>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
const CategoryMultiSelect = ({
  options = [],
  selected = [],
  onChange,
  isLoading,
  placeholder = "Select sub-categories",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedSet = useMemo(
    () => new Set((Array.isArray(selected) ? selected : []).map((value) => String(value))),
    [selected]
  );
  const selectedOptions = useMemo(
    () => options.filter((option) => selectedSet.has(String(option.value))),
    [options, selectedSet]
  );
  const summaryText = useMemo(() => {
    if (isLoading) {
      return "Loading...";
    }

    if (selectedOptions.length === 0) {
      return placeholder;
    }

    if (selectedOptions.length <= 2) {
      return selectedOptions.map((option) => option.label).join(", ");
    }

    return `${selectedOptions
      .slice(0, 2)
      .map((option) => option.label)
      .join(", ")} +${selectedOptions.length - 2} more`;
  }, [isLoading, placeholder, selectedOptions]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-xl border bg-card px-4 text-sm transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/20",
          selectedOptions.length > 0
            ? "border-primary/25 text-foreground"
            : "border-border text-foreground/40"
        )}
      >
        <span className="truncate text-left">{summaryText}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            selectedOptions.length > 0 ? "text-primary" : "text-foreground/40",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {selectedOptions.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                onChange(
                  selected.filter((value) => String(value) !== String(option.value))
                )
              }
              className="inline-flex items-center gap-2 rounded-full border border-primary/45 bg-primary/12 px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/18"
            >
              <span>{option.label}</span>
              <X className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      ) : null}

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-card shadow-xl shadow-black/40 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex max-h-56 flex-col gap-1 overflow-y-auto p-2">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-foreground/40">
                {isLoading ? "Loading sub-categories..." : "No sub-categories available"}
              </div>
            ) : (
              options.map(option => {
                const isSelected = selectedSet.has(String(option.value));

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        onChange(selected.filter((value) => String(value) !== String(option.value)));
                      } else {
                        onChange([...selected, option.value]);
                      }
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                      isSelected
                        ? "border-primary/60 bg-primary text-black shadow-[0_0_0_1px_rgba(255,199,0,0.25)]"
                        : "border-transparent text-foreground/80 hover:border-border hover:bg-muted"
                    )}
                  >
                    <span className="min-w-0 truncate font-medium">{option.label}</span>
                    {isSelected ? (
                      <Check className="ml-1 h-4 w-4 shrink-0 text-black" />
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const TechnologiesInput = ({ toolOptions, selectedToolIds, customSkillNames, onChange, isLoading }) => {
  const [query, setQuery] = useState("");

  const addCustom = () => {
    if (!query.trim()) return;
    if (customSkillNames.includes(query.trim())) return;
    onChange('customSkillNames', [...customSkillNames, query.trim()]);
    setQuery("");
  };

  const toggleTool = (id) => {
    if (selectedToolIds.includes(id)) {
      onChange('selectedToolIds', selectedToolIds.filter(v => v !== id));
    } else {
      onChange('selectedToolIds', [...selectedToolIds, id]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustom())}
          placeholder="Add custom skill..."
          className="h-10 rounded-xl border-border bg-card px-4 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary/50"
        />
        <Button
          type="button"
          onClick={addCustom}
          variant="secondary"
          className="h-10 rounded-xl px-6"
        >
          Add
        </Button>
      </div>

      <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto subtle-scrollbar pr-2">
        {toolOptions.map(tool => {
          const isSelected = selectedToolIds.includes(tool.id);
          const toolName = String(tool.name || tool.label || "").trim();
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => toggleTool(tool.id)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-xs font-medium transition-all",
                isSelected ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground/50 hover:border-white/20 hover:text-foreground"
              )}
            >
              {toolName}
            </button>
          );
        })}
        {isLoading ? (
          <p className="text-[10px] text-foreground/20">Syncing tools...</p>
        ) : toolOptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No preset skills found. Add a custom skill above.
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border pt-3">
        {selectedToolIds.map(id => {
          const tool = toolOptions.find(o => o.id === id);
          const name = tool?.name || tool?.label || "Tool";
          return (
             <span key={id} className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
               {name}
               <button type="button" onClick={() => toggleTool(id)}>
                 <X className="h-3 w-3 opacity-60 hover:opacity-100" />
               </button>
             </span>
          );
        })}
        {customSkillNames.map(name => (
           <span key={name} className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
             {name}
             <button type="button" onClick={() => onChange('customSkillNames', customSkillNames.filter(n => n !== name))}>
               <X className="h-3 w-3 opacity-60 hover:opacity-100" />
             </button>
           </span>
        ))}
      </div>
    </div>
  );
};

export default AddEditServiceWizard;

