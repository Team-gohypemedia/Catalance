import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const PREVIEW_SIZE = 320;
const OUTPUT_SIZES = [1024, 896, 768, 640, 512];
const OUTPUT_QUALITIES = [0.92, 0.85, 0.78, 0.7, 0.62, 0.55];
const DEFAULT_TARGET_MAX_BYTES = 4.5 * 1024 * 1024;

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

const loadImageFromUrl = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image."));
    image.src = url;
  });

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

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getFileStem = (name) => {
  const safeName = String(name || "profile-image").trim();
  return safeName.replace(/\.[^/.]+$/, "") || "profile-image";
};

const buildCroppedBlob = async ({
  imageElement,
  naturalWidth,
  naturalHeight,
  baseScale,
  zoom,
  offsetX,
  offsetY,
  targetMaxBytes,
}) => {
  const scale = baseScale * zoom;
  const cropWidthInSource = PREVIEW_SIZE / scale;
  const cropHeightInSource = PREVIEW_SIZE / scale;

  let sourceX =
    naturalWidth / 2 - cropWidthInSource / 2 - offsetX / scale;
  let sourceY =
    naturalHeight / 2 - cropHeightInSource / 2 - offsetY / scale;

  sourceX = clamp(sourceX, 0, Math.max(0, naturalWidth - cropWidthInSource));
  sourceY = clamp(sourceY, 0, Math.max(0, naturalHeight - cropHeightInSource));

  let fallbackBlob = null;

  for (const outputSize of OUTPUT_SIZES) {
    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not initialize image processing.");
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      imageElement,
      sourceX,
      sourceY,
      cropWidthInSource,
      cropHeightInSource,
      0,
      0,
      outputSize,
      outputSize
    );

    for (const quality of OUTPUT_QUALITIES) {
      const blob = await canvasToBlob(canvas, quality);
      fallbackBlob = blob;
      if (blob.size <= targetMaxBytes) {
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
  const [previewUrl, setPreviewUrl] = useState("");
  const [imageElement, setImageElement] = useState(null);
  const [imageMeta, setImageMeta] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [error, setError] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (!open || !file) {
      setPreviewUrl("");
      setImageElement(null);
      setImageMeta({ width: 0, height: 0 });
      setZoom(1);
      setOffsetX(0);
      setOffsetY(0);
      setError("");
      setIsApplying(false);
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    let isActive = true;

    setPreviewUrl(nextUrl);
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
    setError("");
    setIsApplying(false);

    loadImageFromUrl(nextUrl)
      .then((image) => {
        if (!isActive) return;
        setImageElement(image);
        setImageMeta({
          width: image.naturalWidth || image.width,
          height: image.naturalHeight || image.height,
        });
      })
      .catch((loadError) => {
        if (!isActive) return;
        setError(loadError?.message || "Failed to load image.");
      });

    return () => {
      isActive = false;
      URL.revokeObjectURL(nextUrl);
    };
  }, [open, file]);

  const baseScale = useMemo(() => {
    if (!imageMeta.width || !imageMeta.height) return 1;
    return Math.max(
      PREVIEW_SIZE / imageMeta.width,
      PREVIEW_SIZE / imageMeta.height
    );
  }, [imageMeta.height, imageMeta.width]);

  const displayedWidth = imageMeta.width * baseScale * zoom;
  const displayedHeight = imageMeta.height * baseScale * zoom;

  const maxOffsetX = Math.max(0, (displayedWidth - PREVIEW_SIZE) / 2);
  const maxOffsetY = Math.max(0, (displayedHeight - PREVIEW_SIZE) / 2);

  useEffect(() => {
    setOffsetX((prev) => clamp(prev, -maxOffsetX, maxOffsetX));
  }, [maxOffsetX]);

  useEffect(() => {
    setOffsetY((prev) => clamp(prev, -maxOffsetY, maxOffsetY));
  }, [maxOffsetY]);

  const handleApply = async () => {
    if (!file || !imageElement || !imageMeta.width || !imageMeta.height) {
      setError("Select a valid image first.");
      return;
    }

    setError("");
    setIsApplying(true);

    try {
      const blob = await buildCroppedBlob({
        imageElement,
        naturalWidth: imageMeta.width,
        naturalHeight: imageMeta.height,
        baseScale,
        zoom,
        offsetX,
        offsetY,
        targetMaxBytes: Math.min(maxUploadBytes, DEFAULT_TARGET_MAX_BYTES),
      });

      if (blob.size > maxUploadBytes) {
        throw new Error(
          `Processed image is ${formatFileSize(
            blob.size
          )}. Please crop tighter or choose a different photo.`
        );
      }

      const stem = getFileStem(file.name);
      const croppedFile = new File([blob], `${stem}-avatar.jpg`, {
        type: "image/jpeg",
      });

      onApply(croppedFile);
    } catch (applyError) {
      setError(applyError?.message || "Failed to crop image.");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent className="max-w-2xl border-white/10 bg-zinc-950 text-white">
        <DialogHeader>
          <DialogTitle>Crop Profile Photo</DialogTitle>
          <DialogDescription className="text-white/60">
            Keep your face centered. Final image is optimized for upload (max{" "}
            {formatFileSize(maxUploadBytes)}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="mx-auto relative h-[320px] w-[320px] overflow-hidden rounded-2xl border border-white/15 bg-black">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Crop preview"
                className="absolute select-none"
                draggable={false}
                style={{
                  width: `${displayedWidth}px`,
                  height: `${displayedHeight}px`,
                  left: `calc(50% + ${offsetX}px)`,
                  top: `calc(50% + ${offsetY}px)`,
                  transform: "translate(-50%, -50%)",
                  objectFit: "cover",
                }}
              />
            ) : null}
            <div className="pointer-events-none absolute inset-0 border border-primary/70" />
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-white/70">Zoom</Label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-white/70">Horizontal</Label>
              <input
                type="range"
                min={-maxOffsetX}
                max={maxOffsetX}
                step="1"
                value={offsetX}
                onChange={(event) => setOffsetX(Number(event.target.value))}
                disabled={maxOffsetX === 0}
                className="w-full"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-white/70">Vertical</Label>
              <input
                type="range"
                min={-maxOffsetY}
                max={maxOffsetY}
                step="1"
                value={offsetY}
                onChange={(event) => setOffsetY(Number(event.target.value))}
                disabled={maxOffsetY === 0}
                className="w-full"
              />
            </div>
          </div>

          <p className="text-xs text-white/55">
            Original: {formatFileSize(file?.size || 0)}
          </p>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
        </div>

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleApply} disabled={isApplying}>
            {isApplying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Crop and Use Photo"
            )}
          </Button>
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
