import { useState, useCallback, useRef } from "react";
import Plus from "lucide-react/dist/esm/icons/plus";
import X from "lucide-react/dist/esm/icons/x";
import Image from "lucide-react/dist/esm/icons/image";

import { cn } from "@/shared/lib/utils";
import { ServiceInfoStepper } from "./shared/ServiceInfoComponents";

const MAX_KEYWORDS = 5;
const MAX_IMAGES = 2;
const MAX_VIDEOS = 1;

/* ──────────────────── Keyword Input ──────────────────── */

const KeywordInput = ({ keywords, onChange }) => {
  const [inputValue, setInputValue] = useState("");

  const addKeywords = useCallback(
    (raw) => {
      const newTags = raw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .filter((t) => !keywords.includes(t));

      if (newTags.length === 0) return;

      const merged = [...keywords, ...newTags].slice(0, MAX_KEYWORDS);
      onChange(merged);
      setInputValue("");
    },
    [keywords, onChange]
  );

  const removeKeyword = (keyword) => {
    onChange(keywords.filter((k) => k !== keyword));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addKeywords(inputValue);
    }
    if (e.key === "Backspace" && !inputValue && keywords.length > 0) {
      removeKeyword(keywords[keywords.length - 1]);
    }
  };

  return (
    <div className="flex min-h-[3rem] w-full flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-card px-4 py-2.5 transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
      {keywords.map((kw) => (
        <span
          key={kw}
          className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-medium text-white"
        >
          {kw}
          <button
            type="button"
            onClick={() => removeKeyword(kw)}
            className="text-white/50 transition-colors hover:text-white"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (inputValue.trim()) addKeywords(inputValue);
        }}
        disabled={keywords.length >= MAX_KEYWORDS}
        placeholder={keywords.length === 0 ? "Add relevant keywords" : ""}
        className="min-w-[120px] flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40 disabled:cursor-not-allowed"
      />
    </div>
  );
};

/* ──────────────────── Upload Area ──────────────────── */

const UploadArea = ({ files, onChange }) => {
  const inputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const imageCount = files.filter((f) =>
    f.type.startsWith("image/")
  ).length;
  const videoCount = files.filter((f) =>
    f.type.startsWith("video/")
  ).length;

  const canAddImage = imageCount < MAX_IMAGES;
  const canAddVideo = videoCount < MAX_VIDEOS;
  const canAdd = canAddImage || canAddVideo;

  const acceptTypes = [
    ...(canAddImage ? ["image/*"] : []),
    ...(canAddVideo ? ["video/*"] : []),
  ].join(",");

  const processFiles = useCallback(
    (incoming) => {
      const valid = Array.from(incoming).filter((file) => {
        if (file.type.startsWith("image/") && imageCount < MAX_IMAGES) return true;
        if (file.type.startsWith("video/") && videoCount < MAX_VIDEOS) return true;
        return false;
      });

      if (valid.length > 0) {
        onChange([...files, ...valid]);
      }
    },
    [files, imageCount, videoCount, onChange]
  );

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    processFiles(e.dataTransfer.files);
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
      {files.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {files.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              className="group relative h-24 w-24 overflow-hidden rounded-xl border border-white/10 bg-card"
            >
              {file.type.startsWith("image/") ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="h-full w-full object-cover"
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
            isDragOver
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
          processFiles(e.target.files);
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
}) => {
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col items-center">
      <div className="w-full space-y-8">
        {/* Heading */}
        <div className="text-center">
          <h1 className="text-balance text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl lg:text-[3.1rem] lg:leading-[1.04]">
            <span>Add </span>
            <span className="text-primary">Keywords &amp; Media</span>
          </h1>
        </div>

        {/* Stepper */}
        <div className="w-full">
          <ServiceInfoStepper activeStepId="visuals" />
        </div>

        {/* Step Content */}
        <div className="w-full space-y-7">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">
              Enhance Your Service
            </h2>
            <p className="text-sm text-muted-foreground sm:text-base">
              Add relevant keywords and media for better visibility.
            </p>
          </div>

          <div className="space-y-6 rounded-2xl border border-white/8 bg-card/50 p-5 sm:p-7">
            {/* Positive Keyword */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                Positive Keyword
              </label>
              <KeywordInput
                keywords={serviceVisualsForm.keywords}
                onChange={(next) =>
                  onServiceVisualsFieldChange("keywords", next)
                }
              />
              <p className="text-xs leading-relaxed text-white/35">
                Enter up to 5 positive keywords to improve search visibility of
                your service, separating each with a comma.
              </p>
            </div>

            {/* Upload Media */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                Upload Media
              </label>
              <UploadArea
                files={serviceVisualsForm.mediaFiles}
                onChange={(next) =>
                  onServiceVisualsFieldChange("mediaFiles", next)
                }
              />
              <p className="text-xs leading-relaxed text-white/35">
                Upload 1 video or 2 image for service onboarding.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FreelancerServiceVisualsSlide;
