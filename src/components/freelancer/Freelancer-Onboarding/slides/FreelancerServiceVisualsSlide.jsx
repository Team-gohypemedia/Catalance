import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import Plus from "lucide-react/dist/esm/icons/plus";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Play from "lucide-react/dist/esm/icons/play";
import Image from "lucide-react/dist/esm/icons/image";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import { toast } from "sonner";
import { resolveAvatarUrl } from "@/components/freelancer/Freelancer-Profile/freelancerProfileUtils";

import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DEFAULT_FREELANCER_ONBOARDING_CONTENT,
  resolveServiceVisualFields,
} from "@/shared/lib/freelancer-onboarding-content";
import {
  ONBOARDING_FIELD_LABEL_CLASS,
  ONBOARDING_SERVICE_SKIP_BUTTON_CLASS,
} from "../typography";
import { ServiceInfoStepper, CustomSelect } from "./shared/ServiceInfoComponents";

const ONBOARDING_PAGE_TITLE_CLASS =
  "text-balance text-[34px] font-semibold leading-[1.08] tracking-[-0.04em] sm:text-[40px]";
const ONBOARDING_SECTION_TITLE_CLASS = "text-2xl font-medium leading-tight tracking-[-0.02em]";
const ONBOARDING_SECTION_DESCRIPTION_CLASS = "text-base font-normal leading-7";

const MAX_IMAGES = 2;
const MAX_VIDEOS = 1;
const MAX_MEDIA_FILE_SIZE_BYTES = 4.5 * 1024 * 1024;

const getMediaFile = (value) => {
  if (typeof File === "undefined") return null;
  if (value instanceof File) return value;
  return value?.file instanceof File ? value.file : null;
};

const getMediaUrl = (value) => {
  const rawUrl = String(
    value?.uploadedUrl ||
      value?.url ||
      value?.previewUrl ||
      value?.mediaUrl ||
      value?.src ||
      value?.value ||
      "",
  ).trim();
  return resolveAvatarUrl(rawUrl, { allowBlob: true });
};

const getMediaMimeType = (value) => {
  const file = getMediaFile(value);
  if (file?.type) {
    return String(file.type).trim().toLowerCase();
  }

  const mimeType = String(
    value?.mimeType || value?.type || value?.contentType || "",
  )
    .trim()
    .toLowerCase();

  if (mimeType) {
    return mimeType;
  }

  const remoteUrl = getMediaUrl(value);
  if (/\.(mp4|webm|mov|m4v|ogg)(?:[?#]|$)/i.test(remoteUrl)) {
    return "video/mp4";
  }

  if (/\.(png|jpe?g|gif|webp|avif|bmp|svg)(?:[?#]|$)/i.test(remoteUrl)) {
    return "image/*";
  }

  return "";
};

const isVideoMedia = (value) =>
  String(value?.kind || "").trim().toLowerCase() === "video" ||
  getMediaMimeType(value).startsWith("video/");

/* ──────────────────── Upload Area ──────────────────── */

const getMediaItemId = (entry, index) => {
  const localFile = getMediaFile(entry);
  const explicitKey = String(entry?.key || "").trim();
  if (explicitKey) {
    return explicitKey;
  }

  const name = String(entry?.name || localFile?.name || "media").trim() || "media";
  const sourceStamp = localFile
    ? `${localFile.lastModified || "local"}-${localFile.size || 0}`
    : getMediaUrl(entry) || index;

  return `${name}-${sourceStamp}-${index}`;
};

const MediaPreviewBadge = ({ icon: Icon, label, className = "" }) => (
  <div
    className={cn(
      "inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/60 px-2.5 py-1 text-[10px] font-medium text-white/86 backdrop-blur-md keep-white",
      className,
    )}
  >
    <Icon className="h-3 w-3" />
    <span>{label}</span>
  </div>
);

/* ─── Upload Slot (empty placeholder for adding media) ─── */

const UploadSlot = ({ onClick, isUploading, label = "Add" }) => (
  <button
    type="button"
    onClick={onClick}
    className="group relative flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/30 text-center transition-all duration-200 hover:border-primary/50 hover:bg-primary/5"
  >
    {isUploading ? (
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    ) : (
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
        <Plus className="h-4 w-4" />
      </div>
    )}
    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
      {isUploading ? "Uploading..." : label}
    </span>
  </button>
);

/* ─── Media Thumbnail Card ─── */

const MediaCard = ({ item, previewUrl, index, onRemove }) => (
  <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-black shadow-sm transition-all duration-200 hover:shadow-md dark-card">
    {previewUrl ? (
      item.isVideo ? (
        <video
          src={previewUrl}
          className="h-full w-full object-cover"
          muted
          playsInline
          autoPlay
          loop
          preload="metadata"
        />
      ) : (
        <img
          src={previewUrl}
          alt={item.name}
          className="h-full w-full object-cover"
        />
      )
    ) : (
      <div className="flex h-full w-full items-center justify-center bg-card text-muted-foreground/50">
        {item.isVideo ? <Play className="h-6 w-6" /> : <Image className="h-6 w-6" />}
      </div>
    )}

    {/* Gradient overlay */}
    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_40%,rgba(0,0,0,0.5)_100%)] keep-white" />

    {/* Index badge */}
    <div className="absolute left-2 top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-black/50 px-1.5 text-[10px] font-semibold text-white backdrop-blur-sm keep-white">
      {index + 1}
    </div>

    {/* Type badge */}
    <MediaPreviewBadge
      icon={item.isVideo ? Play : Image}
      label={item.isVideo ? "Video" : "Image"}
      className="absolute bottom-2 left-2"
    />

    {/* Remove button (always visible, using theme colors for contrast) */}
    <button
      type="button"
      onClick={() => onRemove(item.id)}
      className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md transition-all duration-200 hover:scale-105 hover:bg-destructive/90"
      aria-label={`Remove ${item.name}`}
    >
      <Trash2 className="h-4 w-4" />
    </button>

    {/* Play button overlay for videos */}
    {item.isVideo ? (
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-black/30 backdrop-blur-sm keep-white">
          <Play className="h-4 w-4 text-white keep-white" />
        </div>
      </div>
    ) : null}
  </div>
);

/* ──────────────────── Upload Area ──────────────────── */

const UploadArea = ({
  files,
  onChange,
  onUploadFile,
  hasError = false,
  uploadRuleWithMedia,
  uploadRuleEmpty,
}) => {
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const anyInputRef = useRef(null);
  const filesRef = useRef(Array.isArray(files) ? files : []);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [showUploadOptions, setShowUploadOptions] = useState(false);

  useEffect(() => {
    filesRef.current = Array.isArray(files) ? files : [];
  }, [files]);

  const previewItems = useMemo(
    () =>
      files.map((entry, index) => {
        const localFile = getMediaFile(entry);
        const isVideo = isVideoMedia(entry);
        const remoteUrl = getMediaUrl(entry);

        return {
          id: getMediaItemId(entry, index),
          name: String(entry?.name || localFile?.name || "Media").trim(),
          isVideo,
          localFile,
          remoteUrl,
        };
      }),
    [files],
  );

  const [previewUrls, setPreviewUrls] = useState({});

  useEffect(() => {
    if (typeof URL === "undefined") {
      setPreviewUrls(
        previewItems.reduce((accumulator, item) => {
          accumulator[item.id] = item.remoteUrl || "";
          return accumulator;
        }, {}),
      );
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

    return () => {
      objectUrls.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
    };
  }, [previewItems]);

  const resolvedPreviewItems = useMemo(
    () =>
      previewItems.map((item) => ({
        ...item,
        previewUrl: String(previewUrls[item.id] || "").trim(),
      })),
    [previewItems, previewUrls],
  );

  const hasMedia = resolvedPreviewItems.length > 0;
  const imageCount = files.filter((file) => !isVideoMedia(file)).length;
  const videoCount = files.filter((file) => isVideoMedia(file)).length;
  const canAddImage = imageCount < MAX_IMAGES;
  const canAddVideo = videoCount < MAX_VIDEOS;
  const totalCount = files.length;
  const maxTotal = MAX_IMAGES + MAX_VIDEOS;

  const openImagePicker = useCallback((e) => {
    if (e) e.stopPropagation();
    imageInputRef.current?.click();
    setShowUploadOptions(false);
  }, []);

  const openVideoPicker = useCallback((e) => {
    if (e) e.stopPropagation();
    videoInputRef.current?.click();
    setShowUploadOptions(false);
  }, []);

  const openAnyPicker = useCallback((e) => {
    if (e) e.stopPropagation();
    anyInputRef.current?.click();
  }, []);

  const uploadSingleFile = useCallback(
    async (file) => {
      const toastId = toast.loading(`Uploading ${file.name}...`);

      try {
        const uploadedEntry =
          typeof onUploadFile === "function"
            ? await onUploadFile(file)
            : file;

        if (!uploadedEntry) {
          throw new Error(`Upload for ${file.name} did not return a usable file.`);
        }

        toast.success(`${file.name} uploaded`, { id: toastId });
        return uploadedEntry;
      } catch (error) {
        const message = `Failed to upload ${file.name}`;
        toast.error(message, { id: toastId });
        throw error instanceof Error ? error : new Error(message);
      }
    },
    [onUploadFile],
  );

  const processFiles = useCallback(
    async (incoming) => {
      if (isUploading) {
        return;
      }

      const incomingFiles = Array.from(incoming || []);
      if (!incomingFiles.length) {
        return;
      }

      setUploadError("");

      const validFiles = [];
      let nextImageCount = imageCount;
      let nextVideoCount = videoCount;
      let hadUnsupportedType = false;
      let hadOversizedFile = false;

      for (const file of incomingFiles) {
        const fileType = String(file?.type || "").trim().toLowerCase();
        if (!fileType.startsWith("image/") && !fileType.startsWith("video/")) {
          hadUnsupportedType = true;
          continue;
        }

        if (Number(file?.size || 0) > MAX_MEDIA_FILE_SIZE_BYTES) {
          hadOversizedFile = true;
          continue;
        }

        if (fileType.startsWith("image/") && nextImageCount < MAX_IMAGES) {
          nextImageCount += 1;
          validFiles.push(file);
          continue;
        }

        if (fileType.startsWith("video/") && nextVideoCount < MAX_VIDEOS) {
          nextVideoCount += 1;
          validFiles.push(file);
        }
      }

      if (hadUnsupportedType) {
        const msg = "Only image or video files are allowed.";
        setUploadError(msg);
        toast.error(msg);
      } else if (hadOversizedFile) {
        const msg = "Each file must be 4.5MB or smaller.";
        setUploadError(msg);
        toast.error(msg);
      } else if (!validFiles.length) {
        const msg = `Please add up to ${MAX_IMAGES} images and ${MAX_VIDEOS} video.`;
        setUploadError(msg);
        toast.error(msg);
      }

      if (!validFiles.length) {
        return;
      }

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
    },
    [
      imageCount,
      isUploading,
      onChange,
      uploadSingleFile,
      videoCount,
    ],
  );

  const removeFile = useCallback(
    (id) => {
      const nextFiles = filesRef.current.filter(
        (entry, index) => getMediaItemId(entry, index) !== id,
      );
      filesRef.current = nextFiles;
      onChange(nextFiles);
    },
    [onChange],
  );

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    void processFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  return (
    <div
      className="space-y-4"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragOver(false)}
    >
      {/* ─── Header: Title + Upload Type Buttons ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <p className={cn(ONBOARDING_FIELD_LABEL_CLASS, "text-foreground")}>
            Upload Media
          </p>
          <p className={cn("text-sm", hasError ? "text-destructive/80" : "text-muted-foreground")}>
            {totalCount}/{maxTotal} files uploaded &bull; {imageCount}/{MAX_IMAGES} images &bull; {videoCount}/{MAX_VIDEOS} video
          </p>
        </div>
      </div>

      {/* ─── Media Grid ─── */}
      {!hasMedia ? (
        /* Empty state: Large drop zone */
        <div className="relative flex justify-center">
          <button
            type="button"
            onClick={() => setShowUploadOptions(!showUploadOptions)}
            className={cn(
              "group flex w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all duration-300",
              isDragOver
                ? "border-primary bg-primary/5"
                : showUploadOptions
                  ? "border-primary/40 bg-primary/5"
                  : hasError
                    ? "border-destructive/40 bg-destructive/5 hover:border-destructive/60"
                    : "border-border bg-muted/20 hover:border-primary/40 hover:bg-primary/5",
            )}
          >
            <div className={cn(
              "flex h-14 w-14 items-center justify-center rounded-2xl border transition-colors",
              isDragOver || showUploadOptions
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:text-primary",
            )}>
              <Plus className={cn("h-6 w-6 transition-transform duration-200", showUploadOptions ? "rotate-45" : "")} />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">
                Upload images or video
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                Drag & drop or click to browse. Max {MAX_IMAGES} images + {MAX_VIDEOS} video.
              </p>
            </div>
          </button>
          
          {showUploadOptions && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex w-48 flex-col gap-1 p-2 bg-card border border-border/80 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] animate-in fade-in zoom-in-95 duration-200 dark-card">
              {canAddImage && (
                <button
                  type="button"
                  onClick={openImagePicker}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-all duration-200 hover:bg-muted"
                >
                  <Image className="h-4 w-4 text-muted-foreground" />
                  <span>Image ad</span>
                </button>
              )}
              {canAddVideo && (
                <button
                  type="button"
                  onClick={openVideoPicker}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-all duration-200 hover:bg-muted"
                >
                  <Play className="h-4 w-4 text-muted-foreground" />
                  <span>Video ad</span>
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Media grid with thumbnails */
        <div className={cn(
          "grid gap-3 transition-opacity",
          isDragOver ? "opacity-70" : "opacity-100",
          resolvedPreviewItems.length === 1
            ? "grid-cols-2 sm:grid-cols-3"
            : resolvedPreviewItems.length === 2
              ? "grid-cols-2 sm:grid-cols-3"
              : "grid-cols-2 sm:grid-cols-3",
        )}>
          {resolvedPreviewItems.map((item, index) => (
            <MediaCard
              key={item.id}
              item={item}
              previewUrl={item.previewUrl}
              index={index}
              onRemove={removeFile}
            />
          ))}

          {/* Add more slots */}
          {totalCount < maxTotal && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="group relative flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/30 text-center transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                >
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                      <Plus className="h-4 w-4" />
                    </div>
                  )}
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
                    {isUploading ? "Uploading..." : `Upload (${totalCount}/${maxTotal})`}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56 rounded-xl border-border bg-card text-foreground shadow-lg">
                <DropdownMenuItem
                  disabled={!canAddImage}
                  onClick={openImagePicker}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium cursor-pointer hover:bg-accent focus:bg-accent disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Image className="h-4 w-4 text-muted-foreground" />
                  <span>Upload Image ({imageCount}/{MAX_IMAGES})</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!canAddVideo}
                  onClick={openVideoPicker}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium cursor-pointer hover:bg-accent focus:bg-accent disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Play className="h-4 w-4 text-muted-foreground" />
                  <span>Upload Video ({videoCount}/{MAX_VIDEOS})</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      {/* ─── Upload Rules ─── */}
      <div
        className={cn(
          "rounded-xl border bg-transparent px-4 py-2.5",
          hasError ? "border-destructive/30" : "border-border",
        )}
      >
          <p className={cn("text-xs font-normal leading-relaxed", hasError ? "text-destructive/80" : "text-muted-foreground")}>
          {hasMedia
            ? uploadRuleWithMedia
            : uploadRuleEmpty}
        </p>
      </div>

      {/* ─── Error Message ─── */}
      {uploadError ? (
        <p className="px-1 text-sm font-medium text-rose-300">{uploadError}</p>
      ) : null}

      {/* ─── Hidden File Inputs ─── */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          void processFiles(e.target.files);
          e.target.value = "";
          e.target.blur();
        }}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={(e) => {
          void processFiles(e.target.files);
          e.target.value = "";
          e.target.blur();
        }}
        className="hidden"
      />
      <input
        ref={anyInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={(e) => {
          void processFiles(e.target.files);
          e.target.value = "";
          e.target.blur();
        }}
        className="hidden"
      />
    </div>
  );
};

/* ──────────────────── Main Slide ──────────────────── */

const FreelancerServiceVisualsSlide = ({
  onboardingContent,
  serviceVisualsForm,
  serviceVisualFields = [],
  onServiceVisualsFieldChange,
  onServiceStepChange,
  onUploadServiceMediaFile,
  onSkipServices,
  serviceVisualsValidationErrors = {},
  continueButton,
}) => {
  const visualsContent =
    onboardingContent?.serviceVisuals ||
    DEFAULT_FREELANCER_ONBOARDING_CONTENT.serviceVisuals;
  const stepperSteps =
    onboardingContent?.stepper?.steps ||
    DEFAULT_FREELANCER_ONBOARDING_CONTENT.stepper.steps;
  const resolvedFields =
    Array.isArray(serviceVisualFields) && serviceVisualFields.length > 0
      ? serviceVisualFields
      : resolveServiceVisualFields(onboardingContent);
  const mediaFilesError = String(serviceVisualsValidationErrors.mediaFiles || "").trim();
  const customVisualFields = resolvedFields.filter(
    (field) => field?.id !== "mediaFiles" && field?.visible !== false,
  );

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col items-center">
      <div className="w-full space-y-8">
        {/* Heading */}
        <div className="text-center">
          <h1 className={ONBOARDING_PAGE_TITLE_CLASS}>
            {visualsContent?.headingTitle || "Add Media"}
          </h1>
        </div>

        {/* Stepper */}
        <div className="mx-auto w-full max-w-3xl">
          <ServiceInfoStepper
            activeStepId="visuals"
            onStepChange={onServiceStepChange}
            steps={stepperSteps}
          />
        </div>

        {/* Step Content */}
        <div className="mx-auto w-full max-w-3xl space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h2 className={cn(ONBOARDING_SECTION_TITLE_CLASS, "text-foreground")}>
                {visualsContent?.sectionTitle || "Enhance Your Service"}
              </h2>
              <p className={cn(ONBOARDING_SECTION_DESCRIPTION_CLASS, "text-muted-foreground")}>
                {visualsContent?.sectionDescription ||
                  "Add media for better visibility."}
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onSkipServices?.()}
              className={cn(
                ONBOARDING_SERVICE_SKIP_BUTTON_CLASS,
                "self-start px-3 py-2 text-sm sm:px-6 sm:py-0 sm:text-base",
              )}
            >
              Skip
            </Button>
          </div>

          <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <UploadArea
              files={serviceVisualsForm.mediaFiles}
              onChange={(next) =>
                onServiceVisualsFieldChange("mediaFiles", next)
              }
              onUploadFile={onUploadServiceMediaFile}
              hasError={Boolean(mediaFilesError)}
              uploadRuleWithMedia={
                visualsContent?.uploadRuleWithMedia ||
                DEFAULT_FREELANCER_ONBOARDING_CONTENT.serviceVisuals.uploadRuleWithMedia
              }
              uploadRuleEmpty={
                visualsContent?.uploadRuleEmpty ||
                DEFAULT_FREELANCER_ONBOARDING_CONTENT.serviceVisuals.uploadRuleEmpty
              }
            />
            {mediaFilesError ? (
              <p className="text-sm text-destructive">{mediaFilesError}</p>
            ) : null}
          </div>

          {customVisualFields.length > 0 ? (
            <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
              {customVisualFields.map((field) => {
                const value = serviceVisualsForm?.customFields?.serviceVisuals?.[field.id] ?? "";
                const error = String(serviceVisualsValidationErrors[field.id] || "").trim();

                if (field.type === "textarea") {
                  return (
                    <div key={field.id} className="space-y-2">
                      <label className="block text-sm font-medium text-foreground">
                        {field.label}
                      </label>
                      <textarea
                        value={value}
                        onChange={(event) =>
                          onServiceVisualsFieldChange(field.id, event.target.value)
                        }
                        placeholder={field.placeholder || ""}
                        rows={4}
                        className={cn(
                          "w-full resize-none rounded-xl border bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 placeholder:font-normal [&::placeholder]:font-normal focus:ring-1",
                          error
                            ? "border-destructive/70 focus:border-destructive/60 focus:ring-destructive/20"
                            : "border-border focus:border-primary/50 focus:ring-primary/20",
                        )}
                      />
                      {error ? <p className="text-sm text-destructive">{error}</p> : null}
                    </div>
                  );
                }

                if (field.type === "select") {
                  return (
                    <div key={field.id} className="space-y-2">
                      <label className="block text-sm font-medium text-foreground">
                        {field.label}
                      </label>
                      <CustomSelect
                        value={value}
                        onChange={(nextValue) =>
                          onServiceVisualsFieldChange(field.id, nextValue)
                        }
                        options={field.options || []}
                        placeholder={field.placeholder || "Select option"}
                        isSearchable={Boolean(field.searchPlaceholder)}
                        searchPlaceholder={field.searchPlaceholder || "Search"}
                        hasError={Boolean(error)}
                        className="h-10"
                      />
                      {error ? <p className="text-sm text-destructive">{error}</p> : null}
                    </div>
                  );
                }

                return (
                  <div key={field.id} className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(event) =>
                        onServiceVisualsFieldChange(field.id, event.target.value)
                      }
                      placeholder={field.placeholder || ""}
                      className={cn(
                        "h-10 w-full rounded-xl border bg-card px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 placeholder:font-normal [&::placeholder]:font-normal focus:ring-1",
                        error
                          ? "border-destructive/70 focus:border-destructive/60 focus:ring-destructive/20"
                          : "border-border focus:border-primary/50 focus:ring-primary/20",
                      )}
                    />
                    {error ? <p className="text-sm text-destructive">{error}</p> : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {continueButton}
    </section>
  );
};

export default FreelancerServiceVisualsSlide;
