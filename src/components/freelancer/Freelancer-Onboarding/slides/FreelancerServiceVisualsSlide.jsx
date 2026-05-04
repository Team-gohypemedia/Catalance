import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import Plus from "lucide-react/dist/esm/icons/plus";
import X from "lucide-react/dist/esm/icons/x";
import Image from "lucide-react/dist/esm/icons/image";

import { cn } from "@/shared/lib/utils";
import { ONBOARDING_FIELD_LABEL_CLASS } from "../typography";
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
  String(value?.uploadedUrl || value?.url || "").trim();

const getMediaMimeType = (value) => {
  const file = getMediaFile(value);
  if (file?.type) {
    return String(file.type).trim().toLowerCase();
  }

  return String(value?.mimeType || value?.type || value?.contentType || "")
    .trim()
    .toLowerCase();
};

const isVideoMedia = (value) =>
  String(value?.kind || "").trim().toLowerCase() === "video" ||
  getMediaMimeType(value).startsWith("video/");

const getFileSizeInMb = (value = 0) =>
  `${(Number(value || 0) / (1024 * 1024)).toFixed(2)}MB`;

/* ──────────────────── Upload Area ──────────────────── */

const UploadArea = ({ files, onChange, hasError = false }) => {
  const inputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [uploadError, setUploadError] = useState("");

  const previewItems = useMemo(
    () =>
      files.map((entry, index) => {
        const localFile = getMediaFile(entry);
        const isVideo = isVideoMedia(entry);
        const remoteUrl = getMediaUrl(entry);
        const previewUrl = localFile ? URL.createObjectURL(localFile) : remoteUrl;

        return {
          id:
            String(entry?.key || "").trim() ||
            `${String(entry?.name || localFile?.name || "media")}-${index}`,
          name: String(entry?.name || localFile?.name || "Media").trim(),
          isVideo,
          previewUrl,
          revokePreviewUrl: localFile && previewUrl ? () => URL.revokeObjectURL(previewUrl) : null,
        };
      }),
    [files],
  );

  useEffect(
    () => () => {
      previewItems.forEach((item) => item.revokePreviewUrl?.());
    },
    [previewItems],
  );

  const imageCount = files.filter((file) => !isVideoMedia(file)).length;
  const videoCount = files.filter((file) => isVideoMedia(file)).length;
  const queuedImageCount = uploadQueue.filter((entry) => !entry.isVideo).length;
  const queuedVideoCount = uploadQueue.filter((entry) => entry.isVideo).length;
  const effectiveImageCount = imageCount + queuedImageCount;
  const effectiveVideoCount = videoCount + queuedVideoCount;

  const hasAnyImage = effectiveImageCount > 0;
  const hasAnyVideo = effectiveVideoCount > 0;
  const canAddImage = !hasAnyVideo && effectiveImageCount < MAX_IMAGES;
  const canAddVideo = !hasAnyImage && effectiveVideoCount < MAX_VIDEOS;
  const canAdd = canAddImage || canAddVideo;

  const acceptTypes = [
    ...(canAddImage ? ["image/*"] : []),
    ...(canAddVideo ? ["video/*"] : []),
  ].join(",");

  const uploadSingleFileWithProgress = useCallback((file) => {
    const queueId = `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`;
    const isVideo = String(file?.type || "").toLowerCase().startsWith("video/");

    setUploadQueue((current) => [
      ...current,
      {
        id: queueId,
        name: file.name,
        isVideo,
        size: file.size,
        progress: 0,
      },
    ]);

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onprogress = (event) => {
        if (!event.lengthComputable) {
          return;
        }
        const nextProgress = Math.min(
          100,
          Math.round((event.loaded / event.total) * 100),
        );
        setUploadQueue((current) =>
          current.map((entry) =>
            entry.id === queueId ? { ...entry, progress: nextProgress } : entry,
          ),
        );
      };
      reader.onload = () => {
        setUploadQueue((current) => current.filter((entry) => entry.id !== queueId));
        resolve(file);
      };
      reader.onerror = () => {
        setUploadQueue((current) => current.filter((entry) => entry.id !== queueId));
        reject(new Error(`Failed to upload ${file.name}`));
      };

      reader.readAsArrayBuffer(file);
    });
  }, []);

  const processFiles = useCallback(
    async (incoming) => {
      const incomingFiles = Array.from(incoming || []);
      if (!incomingFiles.length) {
        return;
      }

      setUploadError("");

      const selectedImages = incomingFiles.filter((file) =>
        String(file?.type || "").toLowerCase().startsWith("image/"),
      );
      const selectedVideos = incomingFiles.filter((file) =>
        String(file?.type || "").toLowerCase().startsWith("video/"),
      );
      const hasUnsupportedType =
        selectedImages.length + selectedVideos.length !== incomingFiles.length;

      if (hasUnsupportedType) {
        setUploadError("Only image or video files are allowed.");
      }

      const oversizedFiles = incomingFiles.filter(
        (file) => Number(file?.size || 0) > MAX_MEDIA_FILE_SIZE_BYTES,
      );
      if (oversizedFiles.length > 0) {
        setUploadError("Each file must be 5MB or smaller.");
      }

      let allowedImages = canAddImage ? selectedImages : [];
      let allowedVideos = canAddVideo ? selectedVideos : [];

      if (hasAnyVideo || hasAnyImage) {
        if (hasAnyVideo && selectedImages.length > 0) {
          setUploadError("You can upload only 1 video OR up to 2 images.");
        }
        if (hasAnyImage && selectedVideos.length > 0) {
          setUploadError("You can upload only 1 video OR up to 2 images.");
        }
      } else if (selectedImages.length > 0 && selectedVideos.length > 0) {
        setUploadError("Please choose either images or a single video.");
        return;
      }

      allowedImages = allowedImages.slice(
        0,
        Math.max(0, MAX_IMAGES - effectiveImageCount),
      );
      allowedVideos = allowedVideos.slice(
        0,
        Math.max(0, MAX_VIDEOS - effectiveVideoCount),
      );

      const validFiles = [...allowedImages, ...allowedVideos].filter(
        (file) => Number(file?.size || 0) <= MAX_MEDIA_FILE_SIZE_BYTES,
      );

      if (!validFiles.length) {
        return;
      }

      try {
        const uploadedFiles = [];
        // Keep upload updates deterministic per file.
        for (const file of validFiles) {
          const uploadedFile = await uploadSingleFileWithProgress(file);
          uploadedFiles.push(uploadedFile);
        }
        if (uploadedFiles.length > 0) {
          onChange([...files, ...uploadedFiles]);
        }
      } catch {
        setUploadError("Something went wrong while uploading file(s).");
      }
    },
    [
      canAddImage,
      canAddVideo,
      files,
      hasAnyImage,
      hasAnyVideo,
      onChange,
      effectiveImageCount,
      effectiveVideoCount,
      uploadSingleFileWithProgress,
    ],
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

  const removeFile = (index) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {/* Existing file previews */}
      {previewItems.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {previewItems.map((item, idx) => (
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
              ) : item.isVideo && item.previewUrl ? (
                <video
                  src={item.previewUrl}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-white/40">
                  <Image className="h-5 w-5" />
                  <span className="text-[10px]">Video</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {previewItems.length > 0 ? (
        <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          {previewItems.map((item) => (
            <div
              key={`uploaded-${item.id}`}
              className="text-xs text-white/75"
            >
              <span className="font-medium text-white">{item.name}</span>
              <span className="ml-2 text-emerald-400">100% uploaded</span>
            </div>
          ))}
        </div>
      ) : null}

      {uploadQueue.length > 0 && (
        <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
          {uploadQueue.map((entry) => {
            return (
              <div key={entry.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-white/80">{entry.name}</span>
                  <span className="shrink-0 text-primary">
                    {entry.progress}% uploaded
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-150"
                    style={{ width: `${entry.progress}%` }}
                  />
                </div>
                <p className="text-[11px] text-white/45">
                  Size: {getFileSizeInMb(entry.size)} / Max 5.00MB
                </p>
              </div>
            );
          })}
        </div>
      )}

      {uploadError ? (
        <p className="text-xs font-medium text-rose-300">{uploadError}</p>
      ) : null}

      {/* Drop zone */}
      {canAdd && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={() => setIsDragOver(false)}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 transition-colors",
            hasError
              ? "border-destructive/70 bg-destructive/5 hover:border-destructive/80"
              : isDragOver
              ? "border-primary/60 bg-primary/5"
              : "border-primary/30 bg-transparent hover:border-primary/50"
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
            <Plus className="h-5 w-5 text-primary" />
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
          <div>
            <h2 className={cn(ONBOARDING_SECTION_TITLE_CLASS, "text-white")}>
              Enhance Your Service
            </h2>
            <p className={cn(ONBOARDING_SECTION_DESCRIPTION_CLASS, "text-muted-foreground")}>
              Add media for better visibility.
            </p>
          </div>

          <div className="space-y-6 rounded-2xl border border-white/8 bg-card p-5 sm:p-7">
            {/* Upload Media */}
            <div className="space-y-0">
              <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
                Upload Media
              </label>
              <UploadArea
                files={serviceVisualsForm.mediaFiles}
                onChange={(next) =>
                  onServiceVisualsFieldChange("mediaFiles", next)
                }
                hasError={Boolean(mediaFilesError)}
              />
              {mediaFilesError ? (
                <p className="mt-1 text-sm text-destructive">{mediaFilesError}</p>
              ) : null}
              <div className="rounded-lg border border-white/12 bg-transparent px-3 py-2">
                <p className="text-xs font-normal leading-relaxed text-white/60">
                  Upload rule: 1 video OR up to 2 images (max 5MB each).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FreelancerServiceVisualsSlide;
