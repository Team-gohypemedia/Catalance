import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import Check from "lucide-react/dist/esm/icons/check";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import X from "lucide-react/dist/esm/icons/x";
import Plus from "lucide-react/dist/esm/icons/plus";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Play from "lucide-react/dist/esm/icons/play";
import Image from "lucide-react/dist/esm/icons/image";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Tag from "lucide-react/dist/esm/icons/tag";
import LayoutGrid from "lucide-react/dist/esm/icons/layout-grid";
import Lock from "lucide-react/dist/esm/icons/lock";
import { toast } from "sonner";
import { resolveAvatarUrl } from "@/components/freelancer/Freelancer-Profile/freelancerProfileUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { API_BASE_URL } from "@/shared/lib/api-client";
import { cn } from "@/shared/lib/utils";
import {
  ONBOARDING_FIELD_LABEL_CLASS,
  ONBOARDING_SERVICE_SKIP_BUTTON_CLASS,
  ONBOARDING_PAGE_TITLE_CLASS,
} from "../typography";
import {
  deriveDraftSkillsAndTechnologies,
  getSubcategorySelectionKey,
  normalizeStringArray,
  syncDraftSubcategories,
} from "../service-details";
import CategoryMultiSelect from "./shared/CategoryComboSearch";
import {
  ServiceInfoStepper,
  CustomSelect,
  ServiceTitleTooltip,
} from "./shared/ServiceInfoComponents";
import { Button } from "@/components/ui/button";
import {
  applyServiceTemplate,
  DEFAULT_FREELANCER_ONBOARDING_CONTENT,
  resolveServiceInfoFields,
  resolveServicePricingFields,
  resolveServiceVisualFields,
} from "@/shared/lib/freelancer-onboarding-content";

/* ─────────────────────── Constants ─────────────────────── */

const SERVICE_TITLE_MAX = 80;

const EXPERIENCE_OPTIONS = [
  { value: "entry", label: "Entry Level (0–1 years)" },
  { value: "intermediate", label: "Intermediate (1–3 years)" },
  { value: "experienced", label: "Experienced (3–5 years)" },
  { value: "expert", label: "Expert (5–10 years)" },
  { value: "veteran", label: "Veteran (10+ years)" },
];

const MAX_IMAGES = 2;
const MAX_VIDEOS = 1;
const MAX_MEDIA_FILE_SIZE_BYTES = 4.5 * 1024 * 1024;

const toPositiveInteger = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const getConfiguredCategoryOptionValue = (option = {}) => {
  const explicitValue = String(option?.value || "").trim();
  if (explicitValue) return explicitValue;
  const id = toPositiveInteger(option?.subCategoryId || option?.id);
  return id ? `catalog:${id}` : "";
};

const normalizeConfiguredCategoryOption = (option = {}) => {
  const value = getConfiguredCategoryOptionValue(option);
  const id = toPositiveInteger(option?.subCategoryId || option?.id);
  const label = String(option?.label || option?.name || option?.title || value || "").trim();
  if (!value || !label) return null;
  return {
    ...option,
    id,
    subCategoryId: id,
    value,
    label,
  };
};

const buildStringSignature = (values = []) => normalizeStringArray(values).join("|");
const buildIntegerSignature = (values = []) =>
  Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((value) => toPositiveInteger(value))
        .filter(Boolean),
    ),
  )
    .sort((left, right) => left - right)
    .join("|");

const normalizeSkillMatchKey = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

/* ─────────────────────── Section Header ─────────────────────── */

const SectionHeader = ({
  number,
  icon: Icon,
  title,
  description,
  isCollapsible = false,
  isExpanded = false,
  onToggle = null,
  rightElement = null,
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
        {rightElement && <div className="shrink-0">{rightElement}</div>}
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-4 w-full">
      {content}
      {rightElement && <div className="shrink-0">{rightElement}</div>}
    </div>
  );
};
/* ─────────────────────── Media Upload Section ─────────────────────── */

const getMediaFile = (value) => {
  if (typeof File === "undefined") return null;
  if (value instanceof File) return value;
  return value?.file instanceof File ? value.file : null;
};

const getMediaUrl = (value) => {
  const rawUrl = String(value?.uploadedUrl || value?.url || value?.previewUrl || "").trim();
  return resolveAvatarUrl(rawUrl, { allowBlob: true });
};

const getMediaMimeType = (value) => {
  const file = getMediaFile(value);
  if (file?.type) return String(file.type).trim().toLowerCase();
  const mimeType = String(value?.mimeType || value?.type || "").trim().toLowerCase();
  if (mimeType) return mimeType;
  const remoteUrl = getMediaUrl(value);
  if (/\.(mp4|webm|mov|m4v|ogg)(?:[?#]|$)/i.test(remoteUrl)) return "video/mp4";
  if (/\.(png|jpe?g|gif|webp|avif|bmp|svg)(?:[?#]|$)/i.test(remoteUrl)) return "image/*";
  return "";
};

const isVideoMedia = (value) =>
  String(value?.kind || "").trim().toLowerCase() === "video" ||
  getMediaMimeType(value).startsWith("video/");

const getMediaItemId = (entry, index) => {
  const localFile = getMediaFile(entry);
  const explicitKey = String(entry?.key || "").trim();
  if (explicitKey) return explicitKey;
  const name = String(entry?.name || localFile?.name || "media").trim() || "media";
  const sourceStamp = localFile
    ? `${localFile.lastModified || "local"}-${localFile.size || 0}`
    : getMediaUrl(entry) || index;
  return `${name}-${sourceStamp}-${index}`;
};

const CompactMediaCard = ({ item, previewUrl, index, onRemove }) => (
  <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-black shadow-sm">
    {previewUrl ? (
      item.isVideo ? (
        <video src={previewUrl} className="h-full w-full object-contain" muted playsInline autoPlay loop preload="metadata" />
      ) : (
        <img src={previewUrl} alt={item.name} className="h-full w-full object-contain" />
      )
    ) : (
      <div className="flex h-full w-full items-center justify-center bg-card text-muted-foreground/50">
        {item.isVideo ? <Play className="h-5 w-5" /> : <Image className="h-5 w-5" />}
      </div>
    )}
    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_40%,rgba(0,0,0,0.5)_100%)] keep-white" />
    <button
      type="button"
      onClick={() => onRemove(item.id)}
      className="absolute right-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-background text-foreground border border-border hover:bg-muted shadow-md transition-all duration-200 hover:scale-105"
      aria-label={`Remove ${item.name}`}
    >
      <X className="h-3 w-3" />
    </button>
    {item.isVideo && (
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/60 bg-black/30 backdrop-blur-sm keep-white">
          <Play className="h-3 w-3 text-white keep-white" />
        </div>
      </div>
    )}
  </div>
);

const CompactUploadSlot = ({ onClick, isUploading, label = "Add More" }) => (
  <button
    type="button"
    onClick={onClick}
    className="group relative flex aspect-[4/3] w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border bg-muted/20 text-center transition-all duration-200 hover:border-primary/50 hover:bg-primary/5"
  >
    {isUploading ? (
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
    ) : (
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
        <Plus className="h-3.5 w-3.5" />
      </div>
    )}
    <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground">
      {isUploading ? "Uploading..." : label}
    </span>
  </button>
);

const CompactUploadArea = ({ files, onChange, onUploadFile, hasError = false }) => {
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const filesRef = useRef(Array.isArray(files) ? files : []);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!showDropdown) return;
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showDropdown]);

  useEffect(() => {
    filesRef.current = Array.isArray(files) ? files : [];
  }, [files]);

  const previewItems = useMemo(
    () =>
      files.map((entry, index) => {
        const localFile = getMediaFile(entry);
        const isVideo = isVideoMedia(entry);
        const remoteUrl = getMediaUrl(entry);
        return { id: getMediaItemId(entry, index), name: String(entry?.name || localFile?.name || "Media").trim(), isVideo, localFile, remoteUrl };
      }),
    [files],
  );

  const [previewUrls, setPreviewUrls] = useState({});

  useEffect(() => {
    if (typeof URL === "undefined") {
      setPreviewUrls(previewItems.reduce((acc, item) => { acc[item.id] = item.remoteUrl || ""; return acc; }, {}));
      return undefined;
    }
    const nextPreviewUrls = {};
    const objectUrls = [];
    for (const item of previewItems) {
      if (item.localFile) {
        const objectUrl = URL.createObjectURL(item.localFile);
        nextPreviewUrls[item.id] = objectUrl;
        objectUrls.push(objectUrl);
        continue;
      }
      nextPreviewUrls[item.id] = item.remoteUrl || "";
    }
    setPreviewUrls(nextPreviewUrls);
    return () => { objectUrls.forEach((url) => URL.revokeObjectURL(url)); };
  }, [previewItems]);

  const resolvedPreviewItems = useMemo(
    () => previewItems.map((item) => ({ ...item, previewUrl: String(previewUrls[item.id] || "").trim() })),
    [previewItems, previewUrls],
  );

  const imageCount = files.filter((f) => !isVideoMedia(f)).length;
  const videoCount = files.filter((f) => isVideoMedia(f)).length;
  const canAddImage = imageCount < MAX_IMAGES;
  const canAddVideo = videoCount < MAX_VIDEOS;
  const hasMedia = resolvedPreviewItems.length > 0;
  const totalCount = files.length;
  const maxTotal = MAX_IMAGES + MAX_VIDEOS;

  const openImagePicker = useCallback((e) => { if (e) e.stopPropagation(); imageInputRef.current?.click(); }, []);
  const openVideoPicker = useCallback((e) => { if (e) e.stopPropagation(); videoInputRef.current?.click(); }, []);

  const uploadSingleFile = useCallback(async (file) => {
    const toastId = toast.loading(`Uploading ${file.name}...`);
    try {
      const uploadedEntry = typeof onUploadFile === "function" ? await onUploadFile(file) : file;
      if (!uploadedEntry) throw new Error(`Upload for ${file.name} did not return a usable file.`);
      toast.success(`${file.name} uploaded`, { id: toastId });
      return uploadedEntry;
    } catch (error) {
      const message = `Failed to upload ${file.name}`;
      toast.error(message, { id: toastId });
      throw error instanceof Error ? error : new Error(message);
    }
  }, [onUploadFile]);

  const processFiles = useCallback(async (incoming) => {
    if (isUploading) return;
    const incomingFiles = Array.from(incoming || []);
    if (!incomingFiles.length) return;
    setUploadError("");
    const validFiles = [];
    let nextImageCount = imageCount;
    let nextVideoCount = videoCount;
    let hadUnsupportedType = false;
    let hadOversizedFile = false;
    for (const file of incomingFiles) {
      const fileType = String(file?.type || "").trim().toLowerCase();
      if (!fileType.startsWith("image/") && !fileType.startsWith("video/")) { hadUnsupportedType = true; continue; }
      if (Number(file?.size || 0) > MAX_MEDIA_FILE_SIZE_BYTES) { hadOversizedFile = true; continue; }
      if (fileType.startsWith("image/") && nextImageCount < MAX_IMAGES) { nextImageCount += 1; validFiles.push(file); continue; }
      if (fileType.startsWith("video/") && nextVideoCount < MAX_VIDEOS) { nextVideoCount += 1; validFiles.push(file); }
    }
    if (hadUnsupportedType) { const msg = "Only image or video files are allowed."; setUploadError(msg); toast.error(msg); }
    else if (hadOversizedFile) { const msg = "Each file must be 4.5MB or smaller."; setUploadError(msg); toast.error(msg); }
    else if (!validFiles.length) { const msg = `Max ${MAX_IMAGES} images + ${MAX_VIDEOS} video.`; setUploadError(msg); toast.error(msg); }
    if (!validFiles.length) return;
    setIsUploading(true);
    try {
      let nextFiles = [...filesRef.current];
      for (const file of validFiles) {
        const uploadedEntry = await uploadSingleFile(file);
        const entryWithFile = { ...uploadedEntry, file };
        nextFiles = [...nextFiles, entryWithFile];
        filesRef.current = nextFiles;
        onChange(nextFiles);
      }
    } catch {
      const message = "Something went wrong while uploading file(s).";
      setUploadError(message);
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  }, [imageCount, isUploading, onChange, uploadSingleFile, videoCount]);

  const removeFile = useCallback((id) => {
    const nextFiles = filesRef.current.filter((entry, index) => getMediaItemId(entry, index) !== id);
    filesRef.current = nextFiles;
    onChange(nextFiles);
  }, [onChange]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className={cn(ONBOARDING_FIELD_LABEL_CLASS, "text-foreground")}>Uploaded Media ({totalCount}/{maxTotal})</p>
      </div>

      {/* Empty State */}
      {!hasMedia ? (
        <div
          ref={dropdownRef}
          onClick={() => setShowDropdown((prev) => !prev)}
          className={cn(
            "group flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-all duration-300 cursor-pointer outline-none focus:ring-1 focus:ring-primary/20",
            hasError ? "border-destructive/40 bg-destructive/5" : "border-border bg-muted/20 hover:border-primary/40 hover:bg-primary/5",
          )}
        >
          <div className="relative">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl border transition-colors",
                "border-border bg-card text-muted-foreground group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:text-primary",
              )}
            >
              <Plus className="h-5 w-5" />
            </div>
            {showDropdown && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute top-[calc(100%+6px)] left-1/2 -translate-x-1/2 w-[180px] rounded-xl border border-border bg-card text-foreground shadow-lg p-1 z-50 flex flex-col"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(false);
                    openImagePicker();
                  }}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground cursor-pointer w-full transition-colors"
                >
                  <Image className="h-4 w-4 text-muted-foreground" />
                  <span>Upload Image</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(false);
                    openVideoPicker();
                  }}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground cursor-pointer w-full transition-colors"
                >
                  <Play className="h-4 w-4 text-muted-foreground" />
                  <span>Upload Video</span>
                </button>
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Upload images or video</p>
            <p className="text-xs text-muted-foreground mt-0.5">Upload 1 file to start, then add up to {MAX_IMAGES} images and {MAX_VIDEOS} video total.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {resolvedPreviewItems.map((item, index) => (
            <CompactMediaCard key={item.id} item={item} previewUrl={item.previewUrl} index={index} onRemove={removeFile} />
          ))}
          {totalCount < maxTotal && (
            <div
              ref={dropdownRef}
              onClick={() => setShowDropdown((prev) => !prev)}
              className="group relative flex aspect-[4/3] w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border bg-muted/20 text-center transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
            >
              {isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <div className="relative">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                    <Plus className="h-3.5 w-3.5" />
                  </div>
                  
                  {showDropdown && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-[calc(100%+4px)] left-1/2 -translate-x-1/2 w-[180px] rounded-xl border border-border bg-card text-foreground shadow-lg p-1 z-50 flex flex-col"
                    >
                      <button
                        type="button"
                        disabled={!canAddImage}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDropdown(false);
                          openImagePicker();
                        }}
                        className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none cursor-pointer w-full transition-colors"
                      >
                        <Image className="h-4 w-4 text-muted-foreground" />
                        <span>Upload Image ({imageCount}/{MAX_IMAGES})</span>
                      </button>
                      <button
                        type="button"
                        disabled={!canAddVideo}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDropdown(false);
                          openVideoPicker();
                        }}
                        className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none cursor-pointer w-full transition-colors"
                      >
                        <Play className="h-4 w-4 text-muted-foreground" />
                        <span>Upload Video ({videoCount}/{MAX_VIDEOS})</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
              <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground">
                {isUploading ? "Uploading..." : `Upload (${totalCount}/${maxTotal})`}
              </span>
            </div>
          )}
        </div>
      )}

      {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}

      <p className={cn("text-xs text-center", hasError ? "text-destructive/80" : "text-muted-foreground")}>
        Upload 1 file to start, then add up to {MAX_IMAGES} images and {MAX_VIDEOS} video total.
      </p>

      {/* Hidden File Inputs */}
      <input ref={imageInputRef} type="file" accept="image/*" multiple onChange={(e) => { void processFiles(e.target.files); e.target.value = ""; }} className="hidden" />
      <input ref={videoInputRef} type="file" accept="video/*" onChange={(e) => { void processFiles(e.target.files); e.target.value = ""; }} className="hidden" />
    </div>
  );
};

/* ─────────────────────── Main Combined Slide ─────────────────────── */

const FreelancerServiceQuickInfoSlide = ({
  currentServiceName,
  onboardingContent,
  // Service Info props
  serviceInfoFields = [],
  serviceDraft,
  serviceInfoForm,
  onServiceInfoFieldChange,
  onUpdateServiceDraft,
  serviceInfoValidationErrors = {},
  // Service Pricing props
  servicePricingFields = [],
  servicePricingForm,
  onServicePricingFieldChange,
  servicePricingValidationErrors = {},
  // Service Visuals props
  serviceVisualsForm,
  serviceVisualFields = [],
  onServiceVisualsFieldChange,
  onUploadServiceMediaFile,
  serviceVisualsValidationErrors = {},
  // Common
  onServiceStepChange,
  onSkipServices,
  continueButton,
  onContinue,
}) => {
  const serviceName = currentServiceName || "Service";
  const titleInputRef = useRef(null);

  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  /* ─── Content ─── */
  const serviceInfoContent = onboardingContent?.serviceInfo || DEFAULT_FREELANCER_ONBOARDING_CONTENT.serviceInfo;
  const pricingContent = onboardingContent?.servicePricing || DEFAULT_FREELANCER_ONBOARDING_CONTENT.servicePricing;
  const stepperSteps = onboardingContent?.stepper?.steps || DEFAULT_FREELANCER_ONBOARDING_CONTENT.stepper.steps;

  /* ─── Resolved fields ─── */
  const resolvedInfoFields = useMemo(() => {
    return Array.isArray(serviceInfoFields) && serviceInfoFields.length > 0
      ? serviceInfoFields
      : resolveServiceInfoFields(onboardingContent);
  }, [serviceInfoFields, onboardingContent]);
  const infoFieldMap = useMemo(() => {
    return Object.fromEntries(resolvedInfoFields.map((field) => [field.id, field]));
  }, [resolvedInfoFields]);

  const resolvedPricingFields = useMemo(() => {
    return Array.isArray(servicePricingFields) && servicePricingFields.length > 0
      ? servicePricingFields
      : resolveServicePricingFields(onboardingContent);
  }, [servicePricingFields, onboardingContent]);
  const pricingFieldMap = useMemo(() => {
    return Object.fromEntries(resolvedPricingFields.map((field) => [field.id, field]));
  }, [resolvedPricingFields]);

  /* ─── Category state ─── */
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [toolOptionsByCategory, setToolOptionsByCategory] = useState({});
  const [isToolsLoading, setIsToolsLoading] = useState(false);
  const [toolFetchError, setToolFetchError] = useState("");
  const toolOptionsCacheRef = useRef(new Map());
  const toolFetchRequestIdRef = useRef(0);

  /* ─── Title placeholder animation ─── */
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const placeholders = useMemo(() => {
    const templates = serviceInfoContent?.titlePlaceholders;
    const defaultTemplates = [
      `e.g. Build a modern ${serviceName} application`,
      `e.g. Professional ${serviceName} for your business`,
    ];
    return Array.isArray(templates) && templates.length > 0
      ? templates.map((t) => String(t || "").trim()).filter(Boolean)
      : defaultTemplates;
  }, [serviceInfoContent?.titlePlaceholders, serviceName]);

  useEffect(() => {
    let currentIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let isMounted = true;
    let timer;

    const tick = () => {
      if (!isMounted) return;
      const current = placeholders[currentIndex] || "";
      if (isDeleting) {
        charIndex = Math.max(0, charIndex - 1);
        setDisplayedPlaceholder(current.slice(0, charIndex));
        if (charIndex === 0) { isDeleting = false; currentIndex = (currentIndex + 1) % placeholders.length; }
        timer = setTimeout(tick, 30);
      } else {
        charIndex = Math.min(current.length, charIndex + 1);
        setDisplayedPlaceholder(current.slice(0, charIndex));
        if (charIndex === current.length) { isDeleting = true; timer = setTimeout(tick, 1800); }
        else { timer = setTimeout(tick, 50); }
      }
    };

    timer = setTimeout(tick, 500);
    return () => { isMounted = false; clearTimeout(timer); };
  }, [placeholders]);

  /* ─── Category loading ─── */
  const resolvedServiceId = toPositiveInteger(serviceDraft?.serviceId || null);
  const configuredCategoryOptions = useMemo(() => {
    const fields = resolvedInfoFields;
    const catField = fields.find((f) => f.id === "categories");
    return Array.isArray(catField?.options) && catField.options.length > 0
      ? catField.options.map(normalizeConfiguredCategoryOption).filter(Boolean)
      : [];
  }, [resolvedInfoFields]);

  const normalizedSubcategories = useMemo(
    () => (Array.isArray(serviceDraft?.subcategories) ? serviceDraft.subcategories : []),
    [serviceDraft?.subcategories],
  );
  const selectedCategoryKeys = useMemo(
    () => normalizedSubcategories.map((entry) => getSubcategorySelectionKey(entry)).filter(Boolean),
    [normalizedSubcategories],
  );
  const selectedCatalogCategoryIds = useMemo(
    () =>
      Array.from(
        new Set(
          normalizedSubcategories
            .map((entry) => toPositiveInteger(entry?.subCategoryId))
            .filter(Boolean),
        ),
      ),
    [normalizedSubcategories],
  );
  const allCategoryOptions = useMemo(
    () => (configuredCategoryOptions.length > 0 ? configuredCategoryOptions : categoryOptions),
    [categoryOptions, configuredCategoryOptions],
  );
  const activeSkillCategoryId = useMemo(() => {
    const requested = String(serviceDraft?.activeSkillCategory || "").trim();
    if (requested && normalizedSubcategories.some((entry) => entry.subCategoryKey === requested)) return requested;
    return normalizedSubcategories[0]?.subCategoryKey || "";
  }, [normalizedSubcategories, serviceDraft?.activeSkillCategory]);

  /* Validation errors */
  const titleError = String(serviceInfoValidationErrors.title || "").trim();
  const categoryError = String(serviceInfoValidationErrors.category || "").trim();
  const experienceError = String(serviceInfoValidationErrors.experience || "").trim();
  const mediaFilesError = String(serviceVisualsValidationErrors.mediaFiles || "").trim();

  const [expandedSections, setExpandedSections] = useState({
    2: false,
    3: false,
  });

  const hasAutoExpandedSec2 = useRef(false);
  const hasAutoExpandedSec3 = useRef(false);

  useEffect(() => {
    const isSec1Filled = 
      Boolean(serviceInfoForm.title?.trim()) &&
      Boolean(activeSkillCategoryId) &&
      normalizedSubcategories.length > 0 &&
      Boolean(servicePricingForm.description?.trim());

    if (isSec1Filled && !hasAutoExpandedSec2.current) {
      setExpandedSections((prev) => ({ ...prev, 2: true }));
      hasAutoExpandedSec2.current = true;
    }
  }, [
    serviceInfoForm.title,
    activeSkillCategoryId,
    normalizedSubcategories.length,
    servicePricingForm.description,
  ]);

  useEffect(() => {
    const isSec2Filled = 
      Boolean(serviceInfoForm.experience?.trim()) &&
      Boolean(servicePricingForm.priceRange?.trim());

    if (isSec2Filled && !hasAutoExpandedSec3.current) {
      setExpandedSections((prev) => ({ ...prev, 3: true }));
      hasAutoExpandedSec3.current = true;
    }
  }, [
    serviceInfoForm.experience,
    servicePricingForm.priceRange,
  ]);

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const sec2ErrorVal = String(servicePricingValidationErrors.priceRange || "").trim();

  useEffect(() => {
    const hasSec2Error = Boolean(experienceError || sec2ErrorVal);
    const hasSec3Error = Boolean(mediaFilesError);

    if (hasSec2Error || hasSec3Error) {
      setExpandedSections((prev) => ({
        2: hasSec2Error ? true : prev[2],
        3: hasSec3Error ? true : prev[3],
      }));
    }
  }, [
    experienceError,
    sec2ErrorVal,
    mediaFilesError,
  ]);

  useEffect(() => {
    if (configuredCategoryOptions.length > 0) { setCategoryOptions(configuredCategoryOptions); setIsCategoriesLoading(false); return undefined; }
    if (!resolvedServiceId) { setCategoryOptions([]); setIsCategoriesLoading(false); return undefined; }
    let cancelled = false;
    const fetchSubCategories = async () => {
      try {
        setIsCategoriesLoading(true);
        const response = await fetch(`${API_BASE_URL}/marketplace/filters/sub-categories?serviceId=${resolvedServiceId}`);
        if (!response.ok) throw new Error("Failed to fetch sub-categories");
        const payload = await response.json();
        const nextOptions = (Array.isArray(payload?.data) ? payload.data : [])
          .map((entry) => ({ value: getSubcategorySelectionKey({ subCategoryId: entry?.id }), label: String(entry?.name || "").trim(), isCustom: false, subCategoryId: entry?.id }))
          .filter((entry) => entry.value && entry.label);
        if (!cancelled) setCategoryOptions(nextOptions);
      } catch { if (!cancelled) setCategoryOptions([]); }
      finally { if (!cancelled) setIsCategoriesLoading(false); }
    };
    void fetchSubCategories();
    return () => { cancelled = true; };
  }, [configuredCategoryOptions, resolvedServiceId]);

  useEffect(() => {
    if (configuredCategoryOptions.length > 0) { setToolOptionsByCategory({}); setToolFetchError(""); setIsToolsLoading(false); return undefined; }
    const selectedIds = selectedCatalogCategoryIds;
    toolFetchRequestIdRef.current += 1;
    const requestId = toolFetchRequestIdRef.current;
    const abortController = new AbortController();
    if (!selectedIds.length) { setToolOptionsByCategory({}); setToolFetchError(""); setIsToolsLoading(false); return () => { abortController.abort(); }; }
    const cachedToolOptionsByCategory = {};
    const idsToFetch = [];
    selectedIds.forEach((subCategoryId) => {
      const cacheKey = String(subCategoryId);
      if (toolOptionsCacheRef.current.has(cacheKey)) { cachedToolOptionsByCategory[cacheKey] = toolOptionsCacheRef.current.get(cacheKey) || []; }
      else { idsToFetch.push(subCategoryId); }
    });
    setToolFetchError(""); setToolOptionsByCategory(cachedToolOptionsByCategory); setIsToolsLoading(idsToFetch.length > 0);
    if (!idsToFetch.length) return () => { abortController.abort(); };
    const fetchTools = async () => {
      const settledResults = await Promise.allSettled(
        idsToFetch.map(async (subCategoryId) => {
          const response = await fetch(`${API_BASE_URL}/marketplace/filters/tools?subCategoryId=${subCategoryId}`, { signal: abortController.signal });
          if (!response.ok) throw new Error("Failed to fetch tools");
          const payload = await response.json();
          const options = (Array.isArray(payload?.data) ? payload.data : []).map((entry) => ({ id: toPositiveInteger(entry?.id), subCategoryId, name: String(entry?.name || "").trim(), label: String(entry?.name || "").trim() })).filter((entry) => entry.id && entry.label);
          toolOptionsCacheRef.current.set(String(subCategoryId), options);
          return [String(subCategoryId), options];
        }),
      );
      if (abortController.signal.aborted || requestId !== toolFetchRequestIdRef.current) return;
      const nextToolOptions = { ...cachedToolOptionsByCategory };
      let hasAnySkills = Object.values(nextToolOptions).some((opts) => Array.isArray(opts) && opts.length > 0);
      let hadFailure = false;
      settledResults.forEach((result) => {
        if (result.status === "fulfilled") { const [key, opts] = result.value; nextToolOptions[key] = opts; if (Array.isArray(opts) && opts.length > 0) hasAnySkills = true; return; }
        if (result.reason?.name !== "AbortError") hadFailure = true;
      });
      setToolOptionsByCategory(nextToolOptions);
      setToolFetchError(hadFailure && !hasAnySkills ? "Unable to load skills right now." : "");
    };
    void fetchTools().finally(() => { if (!abortController.signal.aborted && requestId === toolFetchRequestIdRef.current) setIsToolsLoading(false); });
    return () => { abortController.abort(); };
  }, [configuredCategoryOptions, selectedCatalogCategoryIds]);

  /* ─── Category / Skill handlers ─── */
  const handleSelectedCategoriesChange = (nextValues) => {
    const normalizedNextValues = normalizeStringArray(nextValues);
    const optionByValue = new Map(allCategoryOptions.map((option) => [option.value, option]));
    onUpdateServiceDraft((draft) => {
      const existingSubcategories = Array.isArray(draft?.subcategories) ? draft.subcategories : [];
      const existingByKey = new Map(existingSubcategories.map((entry) => [getSubcategorySelectionKey(entry), entry]));
      const nextSubcategories = normalizedNextValues.map((value) => {
        const existingEntry = existingByKey.get(value);
        const configuredOption = optionByValue.get(value);
        let subCategoryId = toPositiveInteger(configuredOption?.subCategoryId || configuredOption?.id);
        if (!subCategoryId && value.startsWith("catalog:")) {
           subCategoryId = toPositiveInteger(value.replace("catalog:", ""));
        }
        return {
          subCategoryId,
          subCategoryKey: subCategoryId ? `catalog:${subCategoryId}` : value,
          label: configuredOption?.label || existingEntry?.label || value,
          isCustom: !subCategoryId,
          selectedToolIds: subCategoryId
            ? (Array.isArray(existingEntry?.selectedToolIds) ? existingEntry.selectedToolIds : [])
                .map(toPositiveInteger)
                .filter(Boolean)
            : [],
          customSkillNames: normalizeStringArray(existingEntry?.customSkillNames),
        };
      });
      return { ...draft, subcategories: nextSubcategories, activeSkillCategory: nextSubcategories.some((e) => e.subCategoryKey === draft?.activeSkillCategory) ? draft.activeSkillCategory : nextSubcategories[0]?.subCategoryKey || null };
    });
  };

  const handleSubcategorySkillChange = (subCategoryKey, nextSelection = {}) => {
    const normalizedToolIds = normalizeStringArray(
      Array.isArray(nextSelection?.selectedToolIds)
        ? nextSelection.selectedToolIds
        : [],
    )
      .map((value) => toPositiveInteger(value))
      .filter(Boolean);
    const normalizedCustomSkills = normalizeStringArray(
      Array.isArray(nextSelection?.customSkillNames)
        ? nextSelection.customSkillNames
        : [],
    );

    if (configuredCategoryOptions.length > 0) {
      onUpdateServiceDraft((draft) => ({
        ...draft,
        subcategories: (Array.isArray(draft.subcategories) ? draft.subcategories : []).map(
          (entry) =>
            entry?.subCategoryKey === subCategoryKey
              ? {
                  ...entry,
                  selectedToolIds: toPositiveInteger(entry?.subCategoryId) ? normalizedToolIds : [],
                  customSkillNames: normalizedCustomSkills,
                }
              : entry,
        ),
      }));
      return;
    }

    onUpdateServiceDraft((draft) => ({
      ...draft,
      subcategories: (Array.isArray(draft.subcategories) ? draft.subcategories : []).map(
        (entry) => {
          if (entry?.subCategoryKey !== subCategoryKey) {
            return entry;
          }

          return {
            ...entry,
            selectedToolIds: normalizedToolIds,
            customSkillNames: normalizedCustomSkills,
          };
        },
      ),
    }));
  };

  /* ─── Pricing render helpers ─── */
  const renderInputField = (field, value, error, onChange, { numeric = false } = {}) => (
    <div className="space-y-0">
      <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>{field.label}</label>
      <div className="relative">
        {field.prefix && (
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/50 text-sm">{field.prefix}</span>
        )}
        <input
          type="text"
          inputMode={numeric ? "numeric" : undefined}
          value={value}
          onChange={(event) => onChange(numeric ? event.target.value.replace(/\D/g, "") : event.target.value)}
          placeholder={field.placeholder || ""}
          className={cn(
            "h-10 w-full rounded-xl border bg-card px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 placeholder:font-normal [&::placeholder]:font-normal focus:ring-1",
            field.prefix ? "pl-7" : "",
            error ? "border-destructive/70 focus:border-destructive/60 focus:ring-destructive/20" : "border-border focus:border-primary/50 focus:ring-primary/20",
          )}
          aria-invalid={Boolean(error)}
        />
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col items-center mt-[10px] sm:mt-0">
      <div className="w-full space-y-8">
        {/* Page Title */}
        <div className="text-center">
          <h1 className={ONBOARDING_PAGE_TITLE_CLASS}>
            {(() => {
              const headingText = applyServiceTemplate(
                serviceInfoContent?.headingTitleTemplate || "Fill Your {serviceName} Service Info",
                serviceName,
              );
              const matchIdx = headingText.toLowerCase().lastIndexOf("service info");
              if (matchIdx >= 0) {
                const mainPart = headingText.slice(0, matchIdx);
                const highlightPart = headingText.slice(matchIdx);
                return (
                  <>
                    <span>{mainPart}</span>
                    <span className="text-primary">
                      {highlightPart}
                    </span>
                  </>
                );
              }
              return <span>{headingText}</span>;
            })()}
          </h1>
        </div>

        {/* Stepper — 3 tabs: Quick Info, Case Study, Preview */}
        <div className="mx-auto w-full max-w-3xl relative flex flex-col sm:flex-row items-center sm:justify-center gap-4 sm:gap-0">
          <ServiceInfoStepper
            activeStepId="quickInfo"
            onStepChange={onServiceStepChange}
          />
        </div>

        {/* Content */}
        <div className="mx-auto w-full max-w-3xl">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-10 space-y-6">
            
            {/* ━━━ Section 1: Tell clients what you offer ━━━ */}
            <div className="space-y-4">
              <SectionHeader
                number="1"
                icon={FileText}
                title="Tell clients what you offer"              />

              <div className="space-y-6 pt-2">
                {/* Service Title */}
                {infoFieldMap.title?.visible !== false && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <label className={ONBOARDING_FIELD_LABEL_CLASS} htmlFor="service-title-input">
                        {infoFieldMap.title?.label || "Service Title"}
                      </label>
                      <ServiceTitleTooltip message={serviceInfoContent?.serviceTitleTooltip} />
                    </div>
                    <div className="relative">
                      <input
                        ref={titleInputRef}
                        id="service-title-input"
                        type="text"
                        value={serviceInfoForm.title}
                        onChange={(event) => {
                          if (event.target.value.length <= SERVICE_TITLE_MAX) {
                            onServiceInfoFieldChange("title", event.target.value);
                          }
                        }}
                        placeholder={displayedPlaceholder}
                        className={cn(
                          "h-10 w-full rounded-xl border bg-card px-4 !pr-24 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 placeholder:font-normal [&::placeholder]:font-normal focus:ring-1",
                          titleError
                            ? "border-destructive/70 focus:border-destructive/60 focus:ring-destructive/20"
                            : "border-border focus:border-primary/50 focus:ring-primary/20",
                        )}
                        aria-invalid={Boolean(titleError)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/50">
                        {serviceInfoForm.title.length} / {SERVICE_TITLE_MAX} MAX
                      </span>
                    </div>
                    {titleError && <p className="mt-1 text-xs text-destructive">{titleError}</p>}
                  </div>
                )}

                {/* Select Category */}
                {infoFieldMap.categories?.visible !== false && (
                  <div className="space-y-1">
                    <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "block")}>
                      {infoFieldMap.categories?.label || "Select Skill"}
                    </label>
                    <CategoryMultiSelect
                      selected={selectedCategoryKeys}
                      onChange={handleSelectedCategoriesChange}
                      options={allCategoryOptions}
                      placeholder={isCategoriesLoading ? "Loading..." : infoFieldMap.categories?.placeholder || "Search or select a skill"}
                      searchPlaceholder={infoFieldMap.categories?.searchPlaceholder || "Search skills..."}
                      isLoading={isCategoriesLoading}
                      hasError={Boolean(categoryError)}
                      activeCategoryKey={activeSkillCategoryId}
                      onActiveCategoryChange={(value) =>
                        onUpdateServiceDraft((draft) => ({ ...draft, activeSkillCategory: value || null }))
                      }
                      selectedSubcategories={normalizedSubcategories}
                      toolOptionsByCategory={toolOptionsByCategory}
                      onSubcategorySkillChange={handleSubcategorySkillChange}
                      isToolsLoading={isToolsLoading}
                      toolFetchError={toolFetchError}
                    />
                    {categoryError && <p className="mt-1 text-xs text-destructive">{categoryError}</p>}
                  </div>
                )}

                {/* Service Description */}
                {pricingFieldMap.description?.visible !== false && (
                  <div className="space-y-1">
                    <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "block")}>
                      {pricingFieldMap.description?.label || "Service Description"}
                    </label>
                    <div className="relative">
                      <textarea
                        value={servicePricingForm.description}
                        onChange={(event) => onServicePricingFieldChange("description", event.target.value)}
                        placeholder={pricingFieldMap.description?.placeholder || "Describe what this service includes, the process, and what clients can expect..."}
                        rows={2}
                        className={cn(
                          "w-full resize-y h-[72px] min-h-[60px] rounded-xl border bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 placeholder:font-normal [&::placeholder]:font-normal focus:ring-1 pb-9 pr-14 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:!hidden",
                          (servicePricingValidationErrors.description || String(servicePricingForm.description || "").trim().split(/\s+/).filter(Boolean).length > 150)
                            ? "border-destructive/70 focus:border-destructive/60 focus:ring-destructive/20"
                            : "border-border focus:border-primary/50 focus:ring-primary/20",
                        )}
                      />
                      <span
                        className={cn(
                          "absolute right-3.5 bottom-3.5 text-[11px] font-normal transition-colors pointer-events-none",
                          String(servicePricingForm.description || "").trim().split(/\s+/).filter(Boolean).length > 150
                            ? "text-destructive"
                            : "text-black/20 dark:text-white/20",
                        )}
                      >
                        {String(servicePricingForm.description || "").trim().split(/\s+/).filter(Boolean).length} / 150 words
                      </span>
                    </div>
                    {servicePricingValidationErrors.description && (
                      <p className="mt-1 text-xs text-destructive">{servicePricingValidationErrors.description}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ━━━ Section 2: Set your price ━━━ */}
            <div className="space-y-4 pt-6 border-t border-border">
              <SectionHeader
                number="2"
                icon={Tag}
                title="Set your price"
                description="Provide the details of the service you will offer."
                isCollapsible
                isExpanded={expandedSections[2]}
                onToggle={() => toggleSection(2)}
              />

              <AnimatePresence initial={false}>
                {expandedSections[2] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, overflow: "hidden" }}
                    animate={{ height: "auto", opacity: 1, transitionEnd: { overflow: "visible" } }}
                    exit={{ height: 0, opacity: 0, overflow: "hidden" }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-4">
                      {/* Experience Level */}
                      {infoFieldMap.experience?.visible !== false && (
                        <div className="space-y-1">
                          <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
                            {infoFieldMap.experience?.label || "Experience Level"}
                          </label>
                          <CustomSelect
                            value={serviceInfoForm.experience}
                            onChange={(value) => onServiceInfoFieldChange("experience", value)}
                            options={infoFieldMap.experience?.options || EXPERIENCE_OPTIONS}
                            placeholder={infoFieldMap.experience?.placeholder || "Select experience level"}
                            hasError={Boolean(experienceError)}
                            className="h-10"
                          />
                          {experienceError && <p className="mt-1 text-xs text-destructive">{experienceError}</p>}
                        </div>
                      )}

                      {/* Starting Price */}
                      {pricingFieldMap.priceRange?.visible !== false &&
                        renderInputField(
                          { ...pricingFieldMap.priceRange, label: pricingFieldMap.priceRange?.label || "Starting Price (INR)", prefix: pricingFieldMap.priceRange?.prefix || "₹", placeholder: pricingFieldMap.priceRange?.placeholder || "Enter starting price" },
                          servicePricingForm.priceRange || "",
                          String(servicePricingValidationErrors.priceRange || "").trim(),
                          (value) => onServicePricingFieldChange("priceRange", value),
                          { numeric: true },
                        )
                      }

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ━━━ Section 3: Enhance your service ━━━ */}
            <div className="space-y-4 pt-6 border-t border-border">
              <SectionHeader
                number="3"
                icon={LayoutGrid}
                title="Enhance your service"
                description="Add media for better visibility and trust."
                isCollapsible
                isExpanded={expandedSections[3]}
                onToggle={() => toggleSection(3)}
              />

              <AnimatePresence initial={false}>
                {expandedSections[3] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, overflow: "hidden" }}
                    animate={{ height: "auto", opacity: 1, transitionEnd: { overflow: "visible" } }}
                    exit={{ height: 0, opacity: 0, overflow: "hidden" }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    <div className="space-y-4 pt-4">
                      <CompactUploadArea
                        files={serviceVisualsForm.mediaFiles}
                        onChange={(next) => onServiceVisualsFieldChange("mediaFiles", next)}
                        onUploadFile={onUploadServiceMediaFile}
                        hasError={Boolean(mediaFilesError)}
                      />
                      {mediaFilesError && <p className="text-xs text-destructive">{mediaFilesError}</p>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {/* Custom Footer Lock Text */}
          <div className="mt-8 mb-12 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              <span>You can review everything before publishing</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FreelancerServiceQuickInfoSlide;
