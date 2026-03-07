"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import Crop from "lucide-react/dist/esm/icons/crop";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Move from "lucide-react/dist/esm/icons/move";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const MIN_CROP_SIZE = 88;
const OUTPUT_SIZES = [1024, 896, 768, 640, 512, 384];
const OUTPUT_QUALITIES = [0.92, 0.85, 0.78, 0.7, 0.62];

const HANDLE_CURSOR = {
  nw: "cursor-nwse-resize",
  ne: "cursor-nesw-resize",
  se: "cursor-nwse-resize",
  sw: "cursor-nesw-resize",
  n: "cursor-ns-resize",
  e: "cursor-ew-resize",
  s: "cursor-ns-resize",
  w: "cursor-ew-resize",
};

const HANDLE_POSITIONS = {
  nw: "left-0 top-0 -translate-x-1/2 -translate-y-1/2",
  ne: "right-0 top-0 translate-x-1/2 -translate-y-1/2",
  se: "right-0 bottom-0 translate-x-1/2 translate-y-1/2",
  sw: "left-0 bottom-0 -translate-x-1/2 translate-y-1/2",
  n: "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2",
  e: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2",
  s: "left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2",
  w: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2",
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const formatFileSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${
    units[exponent]
  }`;
};

const canvasToBlob = (canvas, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to process cropped image."));
      },
      "image/jpeg",
      quality
    );
  });

const getFileStem = (name) => {
  const safeName = String(name || "profile-photo").trim();
  return safeName.replace(/\.[^/.]+$/, "") || "profile-photo";
};

const getMaxCropSize = (layout) =>
  Math.max(0, Math.min(layout.width, layout.height));

const getMinCropSize = (layout) =>
  Math.min(MIN_CROP_SIZE, getMaxCropSize(layout));

const clampCropToLayout = (crop, layout) => {
  const minSize = getMinCropSize(layout);
  const maxSize = getMaxCropSize(layout);
  const size = clamp(crop.size, minSize, maxSize);

  return {
    size,
    x: clamp(crop.x, layout.left, layout.right - size),
    y: clamp(crop.y, layout.top, layout.bottom - size),
  };
};

const createInitialCrop = (layout) => {
  const maxSize = getMaxCropSize(layout);
  const minSize = getMinCropSize(layout);
  const size = clamp(maxSize * 0.62, minSize, maxSize);

  return {
    x: layout.left + (layout.width - size) / 2,
    y: layout.top + (layout.height - size) / 2,
    size,
  };
};

const scaleCropBetweenLayouts = (crop, previousLayout, nextLayout) => {
  if (!previousLayout) return createInitialCrop(nextLayout);

  const scale = nextLayout.width / previousLayout.width;
  const nextCrop = {
    x: nextLayout.left + (crop.x - previousLayout.left) * scale,
    y: nextLayout.top + (crop.y - previousLayout.top) * scale,
    size: crop.size * scale,
  };

  return clampCropToLayout(nextCrop, nextLayout);
};

const buildNextCrop = (mode, crop, deltaX, deltaY, layout) => {
  const minSize = getMinCropSize(layout);
  const right = crop.x + crop.size;
  const bottom = crop.y + crop.size;
  const centerX = crop.x + crop.size / 2;
  const centerY = crop.y + crop.size / 2;

  switch (mode) {
    case "move":
      return clampCropToLayout(
        {
          x: crop.x + deltaX,
          y: crop.y + deltaY,
          size: crop.size,
        },
        layout
      );
    case "se": {
      const size = clamp(
        crop.size + Math.max(deltaX, deltaY),
        minSize,
        Math.min(layout.right - crop.x, layout.bottom - crop.y)
      );
      return { x: crop.x, y: crop.y, size };
    }
    case "nw": {
      const size = clamp(
        crop.size - Math.max(deltaX, deltaY),
        minSize,
        Math.min(right - layout.left, bottom - layout.top)
      );
      return { x: right - size, y: bottom - size, size };
    }
    case "ne": {
      const size = clamp(
        crop.size + Math.max(deltaX, -deltaY),
        minSize,
        Math.min(layout.right - crop.x, bottom - layout.top)
      );
      return { x: crop.x, y: bottom - size, size };
    }
    case "sw": {
      const size = clamp(
        crop.size + Math.max(-deltaX, deltaY),
        minSize,
        Math.min(right - layout.left, layout.bottom - crop.y)
      );
      return { x: right - size, y: crop.y, size };
    }
    case "n": {
      const size = clamp(
        crop.size - deltaY,
        minSize,
        Math.min(
          bottom - layout.top,
          2 * Math.min(centerX - layout.left, layout.right - centerX)
        )
      );
      return clampCropToLayout(
        {
          x: centerX - size / 2,
          y: bottom - size,
          size,
        },
        layout
      );
    }
    case "s": {
      const size = clamp(
        crop.size + deltaY,
        minSize,
        Math.min(
          layout.bottom - crop.y,
          2 * Math.min(centerX - layout.left, layout.right - centerX)
        )
      );
      return clampCropToLayout(
        {
          x: centerX - size / 2,
          y: crop.y,
          size,
        },
        layout
      );
    }
    case "e": {
      const size = clamp(
        crop.size + deltaX,
        minSize,
        Math.min(
          layout.right - crop.x,
          2 * Math.min(centerY - layout.top, layout.bottom - centerY)
        )
      );
      return clampCropToLayout(
        {
          x: crop.x,
          y: centerY - size / 2,
          size,
        },
        layout
      );
    }
    case "w": {
      const size = clamp(
        crop.size - deltaX,
        minSize,
        Math.min(
          right - layout.left,
          2 * Math.min(centerY - layout.top, layout.bottom - centerY)
        )
      );
      return clampCropToLayout(
        {
          x: right - size,
          y: centerY - size / 2,
          size,
        },
        layout
      );
    }
    default:
      return crop;
  }
};

const buildCroppedBlob = async ({
  imageElement,
  crop,
  imageLayout,
  maxUploadBytes,
}) => {
  const sourceX = (crop.x - imageLayout.left) / imageLayout.scale;
  const sourceY = (crop.y - imageLayout.top) / imageLayout.scale;
  const sourceSize = crop.size / imageLayout.scale;

  let fallbackBlob = null;

  for (const outputSize of OUTPUT_SIZES) {
    const edge = Math.max(1, Math.min(outputSize, Math.round(sourceSize)));
    const canvas = document.createElement("canvas");
    canvas.width = edge;
    canvas.height = edge;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not initialize image processing.");
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(
      imageElement,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      edge,
      edge
    );

    for (const quality of OUTPUT_QUALITIES) {
      const blob = await canvasToBlob(canvas, quality);
      fallbackBlob = blob;

      if (blob.size <= maxUploadBytes) {
        return blob;
      }
    }
  }

  if (fallbackBlob) {
    return fallbackBlob;
  }

  throw new Error("Unable to generate cropped image.");
};

export default function ProfileImageCropDialog({
  open,
  file,
  maxUploadBytes,
  onApply,
  onCancel,
}) {
  const stageRef = useRef(null);
  const previewImageRef = useRef(null);
  const previousLayoutRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [imageMeta, setImageMeta] = useState({ width: 0, height: 0 });
  const [stageSize, setStageSize] = useState(0);
  const [crop, setCrop] = useState(null);
  const [dragState, setDragState] = useState(null);
  const [error, setError] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (!open || !file) {
      setPreviewUrl("");
      setImageMeta({ width: 0, height: 0 });
      setStageSize(0);
      setCrop(null);
      setDragState(null);
      setError("");
      setIsApplying(false);
      previousLayoutRef.current = null;
      return;
    }

    const nextUrl = URL.createObjectURL(file);

    setPreviewUrl(nextUrl);
    setImageMeta({ width: 0, height: 0 });
    setCrop(null);
    setDragState(null);
    setError("");
    setIsApplying(false);
    previousLayoutRef.current = null;

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [file, open]);

  useEffect(() => {
    if (!open) return undefined;

    const measureStage = () => {
      const nextSize = Math.round(
        stageRef.current?.getBoundingClientRect?.().width || 0
      );
      if (nextSize > 0) {
        setStageSize(nextSize);
      }
    };

    const frame = window.requestAnimationFrame(measureStage);
    const observer =
      typeof ResizeObserver !== "undefined" && stageRef.current
        ? new ResizeObserver(measureStage)
        : null;

    if (observer && stageRef.current) {
      observer.observe(stageRef.current);
    }

    window.addEventListener("resize", measureStage);

    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", measureStage);
    };
  }, [open, previewUrl]);

  const imageLayout = useMemo(() => {
    if (!stageSize || !imageMeta.width || !imageMeta.height) return null;

    const scale = Math.min(stageSize / imageMeta.width, stageSize / imageMeta.height);
    const width = imageMeta.width * scale;
    const height = imageMeta.height * scale;
    const left = (stageSize - width) / 2;
    const top = (stageSize - height) / 2;

    return {
      scale,
      width,
      height,
      left,
      top,
      right: left + width,
      bottom: top + height,
    };
  }, [imageMeta.height, imageMeta.width, stageSize]);

  useEffect(() => {
    if (!imageLayout) return;

    setCrop((previousCrop) =>
      previousCrop
        ? scaleCropBetweenLayouts(previousCrop, previousLayoutRef.current, imageLayout)
        : createInitialCrop(imageLayout)
    );
    previousLayoutRef.current = imageLayout;
  }, [imageLayout]);

  useEffect(() => {
    if (!dragState || !imageLayout) return undefined;

    const handlePointerMove = (event) => {
      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;
      setCrop(buildNextCrop(dragState.mode, dragState.crop, deltaX, deltaY, imageLayout));
    };

    const stopDragging = () => {
      setDragState(null);
    };

    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);

    return () => {
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, [dragState, imageLayout]);

  const handleDragStart = (mode) => (event) => {
    if (!crop || isApplying) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    setDragState({
      mode,
      crop,
      startX: event.clientX,
      startY: event.clientY,
    });
  };

  const handleImageLoad = (event) => {
    const image = event.currentTarget;
    setImageMeta({
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
    });
    setError("");
  };

  const canApply = Boolean(
    previewUrl &&
      crop &&
      imageLayout &&
      imageMeta.width &&
      imageMeta.height &&
      !isApplying
  );

  const handleApply = async () => {
    if (!canApply || !previewImageRef.current) return;

    setError("");
    setIsApplying(true);

    try {
      const blob = await buildCroppedBlob({
        imageElement: previewImageRef.current,
        crop,
        imageLayout,
        maxUploadBytes,
      });

      if (blob.size > maxUploadBytes) {
        throw new Error(
          `Processed image is ${formatFileSize(
            blob.size
          )}. Please crop tighter or choose a different photo.`
        );
      }

      const croppedFile = new File([blob], `${getFileStem(file?.name)}-avatar.jpg`, {
        type: "image/jpeg",
      });

      await Promise.resolve(onApply(croppedFile));
    } catch (applyError) {
      setError(applyError?.message || "Failed to crop image.");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isApplying) {
          onCancel();
        }
      }}
    >
      <DialogContent
        showCloseButton={!isApplying}
        className="max-w-3xl gap-0 overflow-hidden border-border/70 p-0 sm:max-w-3xl"
      >
        <div className="space-y-6 p-6 sm:p-7">
          <DialogHeader className="text-left">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
              <Crop className="h-3.5 w-3.5" />
              Profile photo
            </div>
            <DialogTitle className="text-2xl tracking-tight">
              Crop Profile Photo
            </DialogTitle>
            <DialogDescription className="max-w-xl leading-6">
              Drag the square to reposition it. Use the corners or edges to resize before saving.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-3xl border border-border/60 bg-muted/20 p-4 sm:p-5">
            <div
              ref={stageRef}
              className="relative mx-auto aspect-square w-full max-w-[520px] overflow-hidden rounded-[28px] border border-border/60 bg-black/90"
            >
              {previewUrl ? (
                <>
                  <img
                    ref={previewImageRef}
                    src={previewUrl}
                    alt="Selected profile"
                    draggable={false}
                    onLoad={handleImageLoad}
                    onError={() => setError("Failed to load image.")}
                    className={imageLayout ? "pointer-events-none absolute select-none" : "h-full w-full select-none object-contain"}
                    style={
                      imageLayout
                        ? {
                            width: `${imageLayout.width}px`,
                            height: `${imageLayout.height}px`,
                            left: `${imageLayout.left}px`,
                            top: `${imageLayout.top}px`,
                          }
                        : undefined
                    }
                  />

                  {!imageLayout ? (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30 text-sm text-white/75">
                      Loading image...
                    </div>
                  ) : null}

                  {crop && imageLayout ? (
                    <div
                      className="absolute border-2 border-white shadow-[0_0_0_9999px_rgba(2,6,23,0.62)] touch-none"
                      style={{
                        width: `${crop.size}px`,
                        height: `${crop.size}px`,
                        left: `${crop.x}px`,
                        top: `${crop.y}px`,
                      }}
                    >
                      <button
                        type="button"
                        aria-label="Move crop area"
                        className="absolute inset-0 flex cursor-move items-center justify-center bg-transparent"
                        onPointerDown={handleDragStart("move")}
                      >
                        <div className="pointer-events-none grid h-full w-full grid-cols-3 grid-rows-3">
                          {Array.from({ length: 9 }).map((_, index) => (
                            <span
                              key={index}
                              className="border border-white/18"
                            />
                          ))}
                        </div>
                        <span className="pointer-events-none absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-medium text-white">
                          <Move className="h-3.5 w-3.5" />
                          Drag
                        </span>
                      </button>

                      {Object.keys(HANDLE_POSITIONS).map((handle) => (
                        <button
                          key={handle}
                          type="button"
                          aria-label={`Resize crop ${handle}`}
                          className={`absolute ${HANDLE_POSITIONS[handle]} ${HANDLE_CURSOR[handle]} h-4 w-4 rounded-full border-2 border-background bg-primary shadow-sm`}
                          onPointerDown={handleDragStart(handle)}
                        />
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
                  Select an image to start cropping.
                </div>
              )}
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isApplying}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleApply}
              disabled={!canApply}
            >
              {isApplying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Use Cropped Photo"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

ProfileImageCropDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  file: PropTypes.any,
  maxUploadBytes: PropTypes.number,
  onApply: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

ProfileImageCropDialog.defaultProps = {
  file: null,
  maxUploadBytes: 5 * 1024 * 1024,
};
