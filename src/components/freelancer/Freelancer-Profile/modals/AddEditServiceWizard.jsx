import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Camera from "lucide-react/dist/esm/icons/camera";
import Check from "lucide-react/dist/esm/icons/check";
import Link2 from "lucide-react/dist/esm/icons/link-2";
import Plus from "lucide-react/dist/esm/icons/plus";
import Upload from "lucide-react/dist/esm/icons/upload";
import X from "lucide-react/dist/esm/icons/x";
import IndianRupee from "lucide-react/dist/esm/icons/indian-rupee";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ImageIcon from "lucide-react/dist/esm/icons/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { API_BASE_URL } from "@/shared/lib/api-client";

import {
  SERVICE_INFO_STEPS,
  ServiceInfoStepper,
  CustomSelect,
} from "../../Freelancer-Onboarding/slides/shared/ServiceInfoComponents";

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
  { value: "0-1", label: "Beginner (0-1 yrs)" },
  { value: "1-3", label: "Intermediate (1-3 yrs)" },
  { value: "3-5", label: "Expert (3-5 yrs)" },
  { value: "5+", label: "Master (5+ yrs)" },
];

const SERVICE_TITLE_MAX = 80;
const WIZARD_DROPDOWN_BOTTOM_OFFSET = 132;
const MAX_KEYWORDS = 5;
const MAX_IMAGES = 2;
const MAX_VIDEOS = 1;
const PROFILE_SERVICE_INFO_STEPS = SERVICE_INFO_STEPS.filter(
  (step) => step.id !== "preview"
);

const ROLE_OPTIONS = [
  { value: "full_execution", label: "Full execution" },
  { value: "partial_contribution", label: "Partial contribution" },
  { value: "team_project", label: "Team project" },
];

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
  const [activeStepId, setActiveStepId] = useState("overview");
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
    // Try to find in fetched marketplace services first (for real IDs)
    const normalizedKey = String(serviceKey || "").trim().toLowerCase().replace(/_/g, " ");
    const mService = marketplaceServices.find(s => 
      String(s.name || "").trim().toLowerCase() === normalizedKey
    );
    if (mService) return mService.id;

    // Fallback to prop-based catalog
    const service = servicesCatalog.find(s => 
      s.key === serviceKey || s.value === serviceKey || s.id === serviceKey
    );
    return service?.id || null;
  }, [serviceKey, servicesCatalog, marketplaceServices]);

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

  // Fetch tools for selected sub-categories
  useEffect(() => {
    const selectedCatalogIds = (serviceProfileForm.subcategories || [])
      .map(s => s.subCategoryId)
      .filter(Boolean);

    if (!selectedCatalogIds.length) {
      setToolOptionsByCategory({});
      return;
    }

    const fetchTools = async () => {
      setIsToolsLoading(true);
      try {
        const toolEntries = await Promise.all(
          selectedCatalogIds.map(async (id) => {
            const response = await fetch(`${API_BASE_URL}/marketplace/filters/tools?subCategoryId=${id}`);
            if (response.ok) {
              const payload = await response.json();
              return [String(id), payload?.data || []];
            }
            return [String(id), []];
          })
        );
        setToolOptionsByCategory(Object.fromEntries(toolEntries));
      } catch (error) {
        console.error("Failed to fetch tools:", error);
      } finally {
        setIsToolsLoading(false);
      }
    };
    fetchTools();
  }, [serviceProfileForm.subcategories]);

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
  const steps = ["overview", "pricing", "visuals", "caseStudy"];
  const currentStepIndex = steps.indexOf(activeStepId);

  const handleNext = () => {
    if (activeStepId === "overview") {
      if (!serviceProfileForm.serviceLabel?.trim()) {
        toast.error("Please enter a service title.");
        return;
      }
      if (!serviceProfileForm.skillsAndTechnologies?.length) {
        toast.error("Please add at least one skill or technology.");
        return;
      }
    } else if (activeStepId === "pricing") {
      if (!serviceProfileForm.serviceDescription || serviceProfileForm.serviceDescription.length < 50) {
        toast.error("Description must be at least 50 characters.");
        return;
      }
      if (!serviceProfileForm.deliveryTime) {
        toast.error("Please select a delivery timeline.");
        return;
      }
    }

    if (currentStepIndex < steps.length - 1) {
      setActiveStepId(steps[currentStepIndex + 1]);
    } else {
      onSave(); // Last step
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setActiveStepId(steps[currentStepIndex - 1]);
    }
  };

  const serviceLabel = String(serviceProfileForm.serviceLabel || "").trim() || "Service";
  const serviceTitleLength = String(serviceProfileForm.serviceLabel || "").length;

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

  const handleActiveSubcategoryChange = useCallback(
    (field, values) => {
      setServiceProfileForm((prev) => ({
        ...prev,
        subcategories: (Array.isArray(prev.subcategories) ? prev.subcategories : []).map(
          (subcategory) =>
            subcategory.subCategoryKey === activeSkillCategoryId
              ? { ...subcategory, [field]: values }
              : subcategory
        ),
      }));
    },
    [activeSkillCategoryId, setServiceProfileForm]
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
      const nextCaseStudy = createWizardCaseStudy();
      const nextCaseStudies = [
        ...normalizeWizardCaseStudies(prev),
        nextCaseStudy,
      ];

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
  const keywordTags = Array.isArray(serviceProfileForm.keywords)
    ? serviceProfileForm.keywords
    : [];
  return (
    <div className="flex h-full min-h-0 flex-col bg-gradient-to-br from-background via-background/95 to-background/90 rounded-2xl overflow-hidden">
      {/* Header with Glassmorphism */}
      <div className="flex-none mb-6 flex items-center justify-between border-b border-white/5 pt-8 pb-4 px-8 bg-white/[0.01] backdrop-blur-sm rounded-t-2xl">
        <div className="flex items-center gap-4">
           <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
              {activeStepId === "overview" && <Check className="h-6 w-6" />}
              {activeStepId === "pricing" && <IndianRupee className="h-6 w-6" />}
              {activeStepId === "visuals" && <Camera className="h-6 w-6" />}
              {activeStepId === "caseStudy" && <Plus className="h-6 w-6" />}
           </div>
           <div>
             <div className="flex items-center gap-2">
               <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                 {isDraftingNewService ? "New Service Setup" : "Editing Service"}
               </span>
               <div className="h-1 w-1 rounded-full bg-white/20" />
               <span className="text-[10px] uppercase font-bold tracking-widest text-white/30">Step {currentStepIndex + 1} of {steps.length}</span>
             </div>
             <h1 className="mt-1 text-2xl font-bold tracking-tight text-white drop-shadow-sm">
               {serviceLabel}
             </h1>
           </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full hover:bg-white/5 text-white/30 hover:text-white transition-colors">
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Stepper Implementation */}
      <div className="flex-none mb-8 px-6">
        <ServiceInfoStepper
          activeStepId={activeStepId}
          steps={PROFILE_SERVICE_INFO_STEPS}
          onStepChange={(id) => {
             // Allow jumping back, but maybe not forward without validation?
             // For simplicity, let's allow it for now if they are editing.
             setActiveStepId(id);
          }}
        />
      </div>

      {/* Main Content Area with Animated Transitions */}
      <div className="subtle-scrollbar flex-1 min-h-0 overflow-y-auto px-6 pb-6 pr-3 custom-wizard-content">
        
        {/* STEP 1: OVERVIEW */}
        {activeStepId === "overview" && (
          <div className="space-y-7 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                Add service info
              </h2>
              <p className="text-sm text-muted-foreground sm:text-base">
                Provide the details of the service you will offer.
              </p>
            </div>

            <div className="space-y-6 rounded-2xl border border-white/8 bg-card p-5 sm:p-7">
              <div className="space-y-6">
                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                    Service Title
                  </label>
                  <div className="group relative">
                    <input
                      type="text"
                      value={serviceProfileForm.serviceLabel || ""}
                      onChange={(event) => {
                        const nextValue = event.target.value.slice(0, SERVICE_TITLE_MAX);
                        setServiceProfileForm((prev) => ({
                          ...prev,
                          serviceLabel: nextValue,
                        }));
                      }}
                      placeholder="I will do something I'm really good at"
                      className="h-12 w-full rounded-xl border border-white/10 bg-card px-4 pr-24 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/30">
                      {serviceTitleLength} / {SERVICE_TITLE_MAX} MAX
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                    Select Category
                  </label>
                  <CategoryMultiSelect
                    selected={selectedCategoryKeys}
                    options={allCategoryOptions}
                    isLoading={isCategoriesLoading}
                    onChange={handleSelectedCategoriesChange}
                  />
                </div>

                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                    Skills
                  </label>
                  
                  {selectedSubcategories.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/12 bg-card px-4 py-3 text-sm text-muted-foreground">
                      Select at least one sub-category to add skills.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedSubcategories.length > 1 && (
                        <div className="flex flex-wrap gap-2">
                           {selectedSubcategories.map(sub => (
                             <button
                               key={sub.subCategoryKey}
                               type="button"
                               onClick={() => setServiceProfileForm(prev => ({...prev, activeSkillCategory: sub.subCategoryKey}))}
                               className={cn(
                                 "rounded-full border px-4 py-2 text-xs font-semibold transition-all",
                                 activeSkillCategoryId === sub.subCategoryKey
                                   ? "bg-primary/20 border-primary text-primary"
                                   : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                               )}
                             >
                               {sub.label}
                             </button>
                           ))}
                        </div>
                      )}

                      <div className="rounded-xl border border-white/8 bg-card/60 p-3 sm:p-4">
                         <p className="mb-1 text-xs font-medium uppercase tracking-[0.12em] text-white/55">
                           Adding Skills To{" "}
                           <span className="text-primary">
                             {activeSubcategory?.label || "Selected sub-category"}
                           </span>
                         </p>
                         <p className="mb-3 text-xs text-white/45">
                           Choose tools from the selected sub-category or add your own.
                         </p>
                         <TechnologiesInput
                           toolOptions={activeCategoryToolOptions}
                           selectedToolIds={activeSubcategory?.selectedToolIds || []}
                           customSkillNames={activeSubcategory?.customSkillNames || []}
                           isLoading={isToolsLoading}
                           onChange={handleActiveSubcategoryChange}
                         />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                    Experience
                  </label>
                  <CustomSelect
                    value={serviceProfileForm.experienceYears}
                    onChange={(value) =>
                      setServiceProfileForm((prev) => ({
                        ...prev,
                        experienceYears: value,
                      }))
                    }
                    options={EXPERIENCE_OPTIONS}
                    placeholder="Select experience level"
                    viewportBottomOffset={WIZARD_DROPDOWN_BOTTOM_OFFSET}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PRICING */}
        {activeStepId === "pricing" && (
          <div className="space-y-7 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                Set Your Price
              </h2>
              <p className="text-sm text-muted-foreground sm:text-base">
                Provide the details of the service you will offer.
              </p>
            </div>

            <div className="space-y-6 rounded-2xl border border-white/8 bg-card p-5 sm:p-7">
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                  Service Description
                </label>
                <textarea
                  value={serviceProfileForm.serviceDescription || ""}
                  onChange={(e) =>
                    setServiceProfileForm((prev) => ({
                      ...prev,
                      serviceDescription: e.target.value,
                    }))
                  }
                  placeholder="Description..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/10 bg-card px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                  maxLength={500}
                />
              </div>

              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                  Delivery Timeline
                </label>
                <CustomSelect
                  value={serviceProfileForm.deliveryTime}
                  onChange={(val) =>
                    setServiceProfileForm((prev) => ({
                      ...prev,
                      deliveryTime: val,
                    }))
                  }
                  options={DELIVERY_TIMELINE_OPTIONS}
                  placeholder="Select delivery time"
                  viewportBottomOffset={WIZARD_DROPDOWN_BOTTOM_OFFSET}
                />
              </div>

              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                  Starting Price
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-white/40">
                    ₹
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={serviceProfileForm.averageProjectPrice || ""}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, "");
                      setServiceProfileForm((prev) => ({
                        ...prev,
                        averageProjectPrice: digitsOnly,
                      }));
                    }}
                    placeholder="Enter starting price"
                    className="w-full rounded-xl border border-white/10 bg-card py-3 pl-8 pr-4 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: VISUALS */}
        {activeStepId === "visuals" && (
          <div className="space-y-7 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                Enhance Your Service
              </h2>
              <p className="text-sm text-muted-foreground sm:text-base">
                Add relevant keywords and media for better visibility.
              </p>
            </div>

            <div className="space-y-6 rounded-2xl border border-white/8 bg-card p-5 sm:p-7">
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                  Positive Keywords
                </label>
                <KeywordInput
                  keywords={keywordTags}
                  suggestions={serviceTechSuggestionOptions}
                  serviceName={serviceLabel}
                  onChange={(nextKeywords) =>
                    setServiceProfileForm((prev) => ({
                      ...prev,
                      keywords: nextKeywords,
                    }))
                  }
                />
                <p className="text-xs leading-relaxed text-white/35">
                  Enter up to 5 positive keywords to improve search visibility of
                  your service, separating each with a comma.
                </p>
              </div>

              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                  Upload Media
                </label>
                <ServiceMediaUploadArea
                  files={mediaFiles}
                  coverImage={serviceProfileForm.coverImage}
                  uploading={uploadingServiceCover}
                  onChange={(nextFiles) =>
                    setServiceProfileForm((prev) => ({
                      ...prev,
                      mediaFiles: nextFiles,
                    }))
                  }
                  onFilesAdded={(incomingFiles) => {
                    const firstImage = incomingFiles.find((file) =>
                      file.type?.startsWith("image/")
                    );
                    if (firstImage && typeof onCoverChange === "function") {
                      void onCoverChange({ target: { files: [firstImage], value: "" } });
                      return incomingFiles.filter((file) => file !== firstImage);
                    }
                    return incomingFiles;
                  }}
                  onRemoveCover={() =>
                    setServiceProfileForm((prev) => ({
                      ...prev,
                      coverImage: "",
                    }))
                  }
                />
                <p className="text-xs leading-relaxed text-white/35">
                  Upload 1 video or 2 image for service onboarding.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: CASE STUDY */}
        {activeStepId === "caseStudy" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                Project Portfolio
              </h2>
              <p className="text-sm text-muted-foreground sm:text-base">
                We need some details to verify your identity. Please complete the
                form below.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                    Case Studies
                  </p>
                  <p className="text-xs leading-relaxed text-white/40">
                    Add multiple projects and switch between them while filling the details.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddCaseStudy}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-4 text-sm font-semibold text-primary transition-colors hover:border-primary/40 hover:bg-primary/14"
                >
                  <Plus className="h-4 w-4" />
                  Add Case Study
                </button>
              </div>

              {caseStudies.length > 1 ? (
                <div className="flex flex-wrap gap-2">
                  {caseStudies.map((caseStudy, index) => (
                    <button
                      key={caseStudy.id}
                      type="button"
                      onClick={() =>
                        setServiceProfileForm((prev) => ({
                          ...prev,
                          caseStudy,
                          activeCaseStudyId: caseStudy.id,
                        }))
                      }
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                        activeCaseStudy?.id === caseStudy.id
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-white/10 bg-white/5 text-white/45 hover:text-white"
                      )}
                    >
                      {String(caseStudy.title || "").trim() || `Project ${index + 1}`}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <h3 className="text-xl font-semibold text-white sm:text-2xl">
              {String(activeCaseStudy?.title || "").trim() ||
                `Project ${activeCaseStudyIndex + 1}`}
            </h3>

            <div className="space-y-6">
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                  Case Study Title
                </label>
                <input
                  type="text"
                  value={activeCaseStudy?.title || ""}
                  onChange={(e) => updateCaseStudy("title", e.target.value)}
                  placeholder="e.g. E-commerce Platform Redesign"
                  className="h-12 w-full rounded-xl border border-white/10 bg-card px-4 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                  Description
                </label>
                <textarea
                  value={activeCaseStudy?.description || ""}
                  onChange={(e) => updateCaseStudy("description", e.target.value)}
                  placeholder="Briefly describe the project and its goals..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/10 bg-card px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                  Niche
                </label>
                <CustomSelect
                  value={activeCaseStudy?.niche}
                  onChange={(val) => updateCaseStudy("niche", val)}
                  options={nicheOptions}
                  placeholder={isLoadingNiches ? "Loading niches..." : "select niche"}
                  isSearchable
                  searchPlaceholder="Search niches"
                  viewportBottomOffset={WIZARD_DROPDOWN_BOTTOM_OFFSET}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                    Project Link (Optional)
                  </label>
                  <div className="relative">
                    <Link2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <input
                      type="url"
                      value={activeCaseStudy?.projectLink || ""}
                      onChange={(e) => updateCaseStudy("projectLink", e.target.value)}
                      placeholder="https://..."
                      className="h-12 w-full rounded-xl border border-white/10 bg-card pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                    Project File (Optional)
                  </label>
                  <FileUploadButton
                    file={activeCaseStudy?.projectFile}
                    onChange={(file) => updateCaseStudy("projectFile", file)}
                  />
                </div>

                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                    Your Role
                  </label>
                  <CustomSelect
                    value={activeCaseStudy?.role}
                    onChange={(val) => updateCaseStudy("role", val)}
                    options={ROLE_OPTIONS}
                    placeholder="Select role"
                    viewportBottomOffset={WIZARD_DROPDOWN_BOTTOM_OFFSET}
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                    Timeline
                  </label>
                  <CustomSelect
                    value={activeCaseStudy?.timeline}
                    onChange={(val) => updateCaseStudy("timeline", val)}
                    options={PROJECT_TIMELINE_OPTIONS}
                    placeholder="Select duration"
                    viewportBottomOffset={WIZARD_DROPDOWN_BOTTOM_OFFSET}
                  />
                </div>

                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                    Budget
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <input
                      type="text"
                      value={activeCaseStudy?.budget || ""}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, "");
                        updateCaseStudy("budget", value);
                      }}
                      placeholder="e.g. 5000"
                      className="h-12 w-full rounded-xl border border-white/10 bg-card pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Footer Nav with Polished Glass Button */}
      <div className="flex-none mt-4 flex items-center justify-between border-t border-white/5 pt-8 pb-4 px-8 bg-white/[0.01] backdrop-blur-sm rounded-b-2xl">
        <Button variant="ghost" onClick={onCancel} className="rounded-2xl h-14 px-8 text-[15px] font-semibold text-white/40 hover:bg-white/5 hover:text-white transition-all transform active:scale-95">
          Cancel
        </Button>
        <div className="flex gap-4">
          {currentStepIndex > 0 && (
            <Button variant="outline" onClick={handleBack} className="rounded-2xl h-14 px-8 border-white/10 bg-white/[0.02] font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-all transform active:scale-95">
              Back
            </Button>
          )}
          <Button 
            onClick={handleNext} 
            disabled={savingServiceProfile || uploadingServiceCover}
            className="rounded-2xl h-14 px-10 bg-primary text-white font-bold text-base shadow-[0_10px_30px_-10px_rgba(var(--primary),0.5)] transition-all transform hover:translate-y-[-2px] active:translate-y-[1px] disabled:opacity-50 disabled:translate-y-0"
          >
            {savingServiceProfile ? (
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin" /> 
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>{currentStepIndex === steps.length - 1 ? (isDraftingNewService ? "Publish Service" : "Save Changes") : "Continue"}</span>
                {currentStepIndex < steps.length - 1 && <Plus className="h-4 w-4 ml-1 opacity-60" />}
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
           background: transparent;
         }
         .custom-wizard-content::-webkit-scrollbar-thumb {
           background: rgba(255, 255, 255, 0.05);
           border-radius: 20px;
         }
         .custom-textarea {
           transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
         }
         .custom-textarea:focus {
           background: rgba(255, 255, 255, 0.04);
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
      <div className="flex min-h-[3rem] w-full flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-card px-4 py-2.5 transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
        {keywords.map((keyword) => (
          <span
            key={keyword}
            className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-medium text-white"
          >
            {keyword}
            <button
              type="button"
              onClick={() =>
                onChange(keywords.filter((entry) => entry !== keyword))
              }
              className="text-white/50 transition-colors hover:text-white"
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
          className="min-w-[120px] flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40 disabled:cursor-not-allowed"
        />
      </div>

      {(isLoading || previewSuggestions.length > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.16em] text-white/35">
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
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-card shadow-xl">
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
                  : "text-white/70 hover:bg-white/5 hover:text-white"
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
  coverImage = "",
  uploading = false,
  onChange,
  onFilesAdded,
  onRemoveCover,
}) => {
  const inputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const previewItems = useMemo(() => {
    const items = [];
    const resolvedCover = String(coverImage || "").trim();

    if (resolvedCover) {
      items.push({
        id: "cover-image",
        name: "Cover image",
        previewUrl: resolvedCover,
        isVideo: false,
        isCover: true,
      });
    }

    files.forEach((entry, index) => {
      const localFile = getMediaFile(entry);
      const isVideo = isVideoMedia(entry);
      const remoteUrl = getMediaUrl(entry);
      const previewUrl =
        !isVideo && localFile && typeof URL !== "undefined"
          ? URL.createObjectURL(localFile)
          : !isVideo
            ? remoteUrl
            : "";

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
  }, [coverImage, files]);

  useEffect(
    () => () => {
      previewItems.forEach((item) => item.revokePreviewUrl?.());
    },
    [previewItems]
  );

  const imageCount =
    files.filter((file) => !isVideoMedia(file)).length +
    (String(coverImage || "").trim() ? 1 : 0);
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
      const valid = Array.from(incoming || []).filter((file) => {
        if (file.type.startsWith("image/") && nextImageCount < MAX_IMAGES) {
          nextImageCount += 1;
          return true;
        }
        if (file.type.startsWith("video/") && nextVideoCount < MAX_VIDEOS) {
          nextVideoCount += 1;
          return true;
        }
        return false;
      });

      if (!valid.length) return;

      const filesToKeep = onFilesAdded?.(valid) || valid;
      onChange([...files, ...filesToKeep]);
    },
    [files, imageCount, onChange, onFilesAdded, videoCount]
  );

  const removeFile = (item) => {
    if (item.isCover) {
      onRemoveCover?.();
      return;
    }

    onChange(files.filter((_, index) => index !== item.fileIndex));
  };

  return (
    <div className="space-y-3">
      {previewItems.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {previewItems.map((item) => (
            <div
              key={item.id}
              className="group relative h-24 w-24 overflow-hidden rounded-xl border border-white/10 bg-card"
            >
              {!item.isVideo && item.previewUrl ? (
                <img
                  src={item.previewUrl}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-white/40">
                  <ImageIcon className="h-5 w-5" />
                  <span className="text-[10px]">Video</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeFile(item)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
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
            "flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 transition-colors",
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
          <span className="text-sm font-medium text-white/70">
            Upload Image or Video
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
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-card px-4 text-sm text-white/40 transition-colors hover:border-white/20"
      >
        <Upload className="h-4 w-4" />
        <span className="truncate">{fileName || "Upload file"}</span>
      </button>
      {file ? (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
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
          "flex h-12 w-full items-center justify-between rounded-xl border bg-card px-4 text-sm transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/20",
          selectedOptions.length > 0
            ? "border-primary/25 text-white"
            : "border-white/10 text-white/40"
        )}
      >
        <span className="truncate text-left">{summaryText}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            selectedOptions.length > 0 ? "text-primary" : "text-white/40",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-white/10 bg-card shadow-xl shadow-black/40 animate-in fade-in zoom-in-95 duration-200">
          <div className="max-h-56 overflow-y-auto p-2">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-white/40">
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
                      "flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                      isSelected
                        ? "border-primary/30 bg-primary/12 text-primary"
                        : "border-transparent text-white/80 hover:border-white/8 hover:bg-white/5"
                    )}
                  >
                    <span className="font-medium">{option.label}</span>
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
                        <Check className="h-3.5 w-3.5" />
                        Selected
                      </span>
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
          className="h-12 rounded-xl border-white/10 bg-card px-4 text-sm text-white placeholder:text-white/40 focus:border-primary/50"
        />
        <Button
          type="button"
          onClick={addCustom}
          variant="secondary"
          className="h-12 rounded-xl px-6"
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
                isSelected ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-white/50 hover:border-white/20 hover:text-white"
              )}
            >
              {toolName}
            </button>
          );
        })}
        {isLoading ? (
          <p className="text-[10px] text-white/20">Syncing tools...</p>
        ) : toolOptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No preset skills found. Add a custom skill above.
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-white/5 pt-3">
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
