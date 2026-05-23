import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import Plus from "lucide-react/dist/esm/icons/plus";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Play from "lucide-react/dist/esm/icons/play";
import Image from "lucide-react/dist/esm/icons/image";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import {
  ONBOARDING_FIELD_LABEL_CLASS,
  ONBOARDING_SERVICE_SKIP_BUTTON_CLASS,
} from "../typography";
import { ServiceInfoStepper } from "./shared/ServiceInfoComponents";

const ONBOARDING_PAGE_TITLE_CLASS =
  "text-balance text-[34px] font-semibold leading-[1.08] tracking-[-0.04em] sm:text-[40px]";
const ONBOARDING_SECTION_TITLE_CLASS = "text-2xl font-medium leading-tight tracking-[-0.02em]";
const ONBOARDING_SECTION_DESCRIPTION_CLASS = "text-base font-normal leading-7";

const MAX_IMAGES = 2;
const MAX_VIDEOS = 1;
const MAX_MEDIA_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const getMediaFile = (value) => {
  if (typeof File === "undefined") return null;
  if (value instanceof File) return value;
  return value?.file instanceof File ? value.file : null;
};

const getMediaUrl = (value) =>
  String(
    value?.uploadedUrl ||
      value?.url ||
      value?.previewUrl ||
      value?.mediaUrl ||
      value?.src ||
      value?.value ||
      "",
  ).trim();

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

const MediaHeroPreview = ({ item, previewUrl, onUpload }) => {
  if (!item) {
    return (
      <button
        type="button"
        onClick={onUpload}
        className={cn(
          "group flex h-[240px] w-full items-center justify-center rounded-[28px] border border-dashed border-border bg-muted/40 px-4 text-left transition-colors hover:border-primary/45 hover:bg-primary/5 sm:h-[280px] lg:h-[320px]",
        )}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-primary">
            <Plus className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">Upload your first file</p>
            <p className="text-sm leading-6 text-muted-foreground">
              Click to choose one image or video, or drag it here.
            </p>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="group relative aspect-[16/9] w-full overflow-hidden rounded-[28px] border border-border bg-black shadow-[0_20px_80px_rgba(0,0,0,0.42)] dark-card">
      {item.isVideo ? (
        previewUrl ? (
          <video
            key={previewUrl}
            src={previewUrl}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            muted
            playsInline
            autoPlay
            loop
            controls
            preload="metadata"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_30%,rgba(37,99,235,0.18),transparent_34%),linear-gradient(135deg,#090909,#141414_60%,#0f0f0f)] text-muted-foreground/80">
            <div className="flex flex-col items-center gap-3">
              <Play className="h-8 w-8" />
              <span className="text-sm font-medium">Video preview unavailable</span>
            </div>
          </div>
        )
      ) : previewUrl ? (
        <img
          src={previewUrl}
          alt={item.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_30%,rgba(var(--brand-rgb),0.12),transparent_32%),linear-gradient(135deg,#090909,#141414_60%,#0f0f0f)] text-muted-foreground/80">
          <div className="flex flex-col items-center gap-3">
            <Image className="h-8 w-8" />
            <span className="text-sm font-medium">Image preview unavailable</span>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05)_0%,rgba(0,0,0,0.12)_58%,rgba(0,0,0,0.56)_100%)]" />
      <div className="pointer-events-none absolute bottom-4 right-4">
        <MediaPreviewBadge
          icon={item.isVideo ? Play : Image}
          label={item.isVideo ? "Video" : "Image"}
        />
      </div>
    </div>
  );
};

const MediaThumbnail = ({ item, previewUrl, index, isActive, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(index)}
    className={cn(
      "group relative aspect-[3/4] overflow-hidden rounded-2xl border bg-muted text-left transition-all duration-200 dark-card",
      isActive
        ? "border-primary/80 shadow-[0_0_0_1px_rgba(var(--brand-rgb),0.35),0_16px_40px_rgba(0,0,0,0.28)]"
        : "border-border hover:border-primary/40",
    )}
  >
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
        <Image className="h-5 w-5" />
      </div>
    )}

    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.12)_60%,rgba(0,0,0,0.72)_100%)]" />

    {item.isVideo ? (
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/80 bg-black/30 backdrop-blur-sm keep-white">
          <Play className="h-4 w-4 text-white keep-white" />
        </div>
      </div>
    ) : null}

    <div className="absolute left-2 top-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-white/10 bg-black/55 px-2 text-[10px] font-semibold text-white/85 backdrop-blur-md keep-white">
      {index + 1}
    </div>

    <MediaPreviewBadge
      icon={item.isVideo ? Play : Image}
      label={item.isVideo ? "Video" : "Image"}
      className="absolute bottom-2 left-2"
    />

    {isActive ? (
      <div className="absolute inset-0 rounded-2xl ring-2 ring-primary/80" />
    ) : null}
  </button>
);

const UploadArea = ({ files, onChange, onUploadFile, hasError = false }) => {
  const inputRef = useRef(null);
  const filesRef = useRef(Array.isArray(files) ? files : []);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);

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

  useEffect(() => {
    setActivePreviewIndex((currentIndex) => {
      if (resolvedPreviewItems.length === 0) {
        return 0;
      }

      return Math.min(currentIndex, resolvedPreviewItems.length - 1);
    });
  }, [resolvedPreviewItems.length]);

  const activePreview = resolvedPreviewItems[activePreviewIndex] || null;
  const hasMedia = resolvedPreviewItems.length > 0;
  const imageCount = files.filter((file) => !isVideoMedia(file)).length;
  const videoCount = files.filter((file) => isVideoMedia(file)).length;
  const canAddImage = imageCount < MAX_IMAGES;
  const canAddVideo = videoCount < MAX_VIDEOS;
  const canAdd = canAddImage || canAddVideo;

  const acceptTypes = [
    ...(canAddImage ? ["image/*"] : []),
    ...(canAddVideo ? ["video/*"] : []),
  ].join(",");

  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
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
        setUploadError("Only image or video files are allowed.");
      } else if (hadOversizedFile) {
        setUploadError("Each file must be 5MB or smaller.");
      } else if (!validFiles.length) {
        setUploadError("Please add up to 2 images and 1 video.");
      }

      if (!validFiles.length) {
        return;
      }

      setIsUploading(true);
      try {
        let nextFiles = [...filesRef.current];

        for (const file of validFiles) {
          const uploadedEntry = await uploadSingleFile(file);
          nextFiles = [...nextFiles, uploadedEntry];
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

  const currentPreviewLabel = hasMedia
    ? `${activePreviewIndex + 1} of ${resolvedPreviewItems.length}`
    : "";

  return (
    <div
      className="space-y-3"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragOver(false)}
    >
      <div className={cn("space-y-4 transition-opacity", isDragOver ? "opacity-95" : "opacity-100")}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className={cn(ONBOARDING_FIELD_LABEL_CLASS, "text-foreground")}>
              Upload Media
            </p>
            <p className={cn("text-sm", hasError ? "text-destructive/80" : "text-muted-foreground")}>
              Add one image or video to create the primary preview.
            </p>
          </div>

          {activePreview ? (
            <button
              type="button"
              onClick={() => removeFile(activePreview.id)}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-transparent px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-border/80 hover:bg-muted"
            >
              <Trash2 className="h-4 w-4" />
              <span>Remove</span>
            </button>
          ) : hasMedia && canAdd ? (
            <button
              type="button"
              onClick={openFilePicker}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-transparent px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-border/80 hover:bg-muted"
            >
              <Plus className="h-4 w-4" />
              <span>Add another</span>
            </button>
          ) : null}
        </div>

        {!hasMedia ? (
          <div className="space-y-3">
            <MediaHeroPreview
              item={activePreview}
              previewUrl={activePreview?.previewUrl}
              onUpload={openFilePicker}
            />
          </div>
        ) : (
          <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <MediaHeroPreview
              item={activePreview}
              previewUrl={activePreview?.previewUrl}
              onUpload={openFilePicker}
            />

            <div className="flex h-full min-w-0 flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-2xl font-semibold tracking-[-0.04em] text-foreground">
                    {currentPreviewLabel}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Images: {imageCount} &bull; Video: {videoCount}
                  </p>
                </div>
              </div>

              <div className="h-px w-full bg-border" />

              <div className="relative">
                <div className="grid grid-cols-3 gap-3">
                  {resolvedPreviewItems.map((item, index) => (
                    <MediaThumbnail
                      key={item.id}
                      item={item}
                      previewUrl={item.previewUrl}
                      index={index}
                      isActive={index === activePreviewIndex}
                      onSelect={setActivePreviewIndex}
                    />
                  ))}

                  {canAdd ? (
                    <button
                      type="button"
                      onClick={openFilePicker}
                      className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-dashed border-border bg-muted/40 transition-colors hover:border-primary/45 hover:bg-primary/5"
                    >
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                        {isUploading ? (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        ) : (
                          <Plus className="h-5 w-5 text-primary" />
                        )}
                        <span className="text-xs font-medium">
                          {isUploading ? "Uploading" : "Add another"}
                        </span>
                      </div>
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}

        <div
          className={cn(
            "rounded-xl border bg-transparent px-4 py-2.5",
            hasError ? "border-destructive/30" : "border-border",
          )}
        >
          <p className={cn("text-xs font-normal leading-relaxed", hasError ? "text-destructive/80" : "text-muted-foreground")}>
            {hasMedia
              ? "Upload rule: up to 2 images and 1 video (max 5MB each)."
              : "Upload rule: add one file to start, then add up to 2 images and 1 video total."}
          </p>
        </div>
      </div>

      {uploadError ? (
        <p className="px-1 text-sm font-medium text-rose-300">{uploadError}</p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept={acceptTypes}
        multiple
        onChange={(e) => {
          void processFiles(e.target.files);
          e.target.value = "";
        }}
        className="hidden"
      />
    </div>
  );
};

/* ──────────────────── Main Slide ──────────────────── */

const FreelancerServiceVisualsSlide = ({
  serviceVisualsForm,
  onServiceVisualsFieldChange,
  onServiceStepChange,
  onUploadServiceMediaFile,
  onSkipServices,
  serviceVisualsValidationErrors = {},
}) => {
  const mediaFilesError = String(serviceVisualsValidationErrors.mediaFiles || "").trim();

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col items-center">
      <div className="w-full space-y-8">
        {/* Heading */}
        <div className="text-center">
          <h1 className={ONBOARDING_PAGE_TITLE_CLASS}>
            <span>Add </span>
            <span className="text-primary">Media</span>
          </h1>
        </div>

        {/* Stepper */}
        <div className="w-full">
          <ServiceInfoStepper
            activeStepId="visuals"
            onStepChange={onServiceStepChange}
          />
        </div>

        {/* Step Content */}
        <div className="w-full space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h2 className={cn(ONBOARDING_SECTION_TITLE_CLASS, "text-foreground")}>
                Enhance Your Service
              </h2>
              <p className={cn(ONBOARDING_SECTION_DESCRIPTION_CLASS, "text-muted-foreground")}>
                Add media for better visibility.
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

          <div className="space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-5">
            <UploadArea
              files={serviceVisualsForm.mediaFiles}
              onChange={(next) =>
                onServiceVisualsFieldChange("mediaFiles", next)
              }
              onUploadFile={onUploadServiceMediaFile}
              hasError={Boolean(mediaFilesError)}
            />
            {mediaFilesError ? (
              <p className="text-sm text-destructive">{mediaFilesError}</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FreelancerServiceVisualsSlide;
