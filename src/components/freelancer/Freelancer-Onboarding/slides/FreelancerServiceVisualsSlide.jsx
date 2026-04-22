import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import Plus from "lucide-react/dist/esm/icons/plus";
import X from "lucide-react/dist/esm/icons/x";
import Image from "lucide-react/dist/esm/icons/image";

import { cn } from "@/shared/lib/utils";
import { ServiceInfoStepper } from "./shared/ServiceInfoComponents";

const MAX_KEYWORDS = 5;
const MAX_IMAGES = 2;
const MAX_VIDEOS = 1;

const normalizeKeywordValue = (value = "") =>
  String(value || "").trim().toLowerCase();

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

/* ──────────────────── Keyword Input ──────────────────── */

const KeywordInput = ({
  keywords,
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
    [keywords],
  );
  const trimmedInputValue = inputValue.trim();
  const normalizedInputValue = normalizeKeywordValue(trimmedInputValue);

  const filteredSuggestions = useMemo(() => {
    const availableSuggestions = suggestions.filter(
      (suggestion) =>
        !normalizedSelectedKeywords.has(normalizeKeywordValue(suggestion)),
    );

    if (!normalizedInputValue) {
      return availableSuggestions.slice(0, 8);
    }

    return availableSuggestions
      .filter((suggestion) => {
        const normalizedSuggestion = normalizeKeywordValue(suggestion);
        if (normalizedSuggestion.includes(normalizedInputValue)) {
          return true;
        }

        return normalizedSuggestion
          .split(/\s+/)
          .some((token) => token.startsWith(normalizedInputValue));
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
      (suggestion) =>
        normalizeKeywordValue(suggestion) === normalizedInputValue,
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
    () => suggestions
      .filter(
        (suggestion) =>
          !normalizedSelectedKeywords.has(normalizeKeywordValue(suggestion)),
      )
      .slice(0, 6),
    [normalizedSelectedKeywords, suggestions],
  );

  const showDropdown =
    isFocused && dropdownItems.length > 0 && keywords.length < MAX_KEYWORDS;

  const addKeywords = useCallback(
    (raw) => {
      const existingKeywords = new Set(
        keywords.map((keyword) => normalizeKeywordValue(keyword)),
      );
      const newTags = raw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .filter((t) => !existingKeywords.has(normalizeKeywordValue(t)));

      if (newTags.length === 0) return;

      const merged = [...keywords, ...newTags].slice(0, MAX_KEYWORDS);
      onChange(merged);
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
    [keywords, normalizedSelectedKeywords, onChange],
  );

  const removeKeyword = (keyword) => {
    onChange(keywords.filter((k) => k !== keyword));
  };

  const handleKeyDown = (e) => {
    if (showDropdown) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < dropdownItems.length - 1 ? prev + 1 : 0,
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : dropdownItems.length - 1,
        );
        return;
      }
      if (
        (e.key === "Enter" || e.key === "Tab") &&
        highlightedIndex >= 0 &&
        highlightedIndex < dropdownItems.length
      ) {
        e.preventDefault();
        selectSuggestion(dropdownItems[highlightedIndex].value);
        return;
      }
    }

    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addKeywords(inputValue);
    }

    if (e.key === "Escape" && showDropdown) {
      e.preventDefault();
      setHighlightedIndex(-1);
      inputRef.current?.blur();
    }
  };

  useEffect(() => {
    if (!showDropdown || highlightedIndex < dropdownItems.length) {
      return;
    }

    setHighlightedIndex(dropdownItems.length > 0 ? 0 : -1);
  }, [dropdownItems.length, highlightedIndex, showDropdown]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
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
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setHighlightedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Delay to allow click on suggestion
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
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectSuggestion(suggestion);
                }}
                className="rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-medium text-primary transition-colors hover:border-primary/35 hover:bg-primary/14"
              >
                {suggestion}
              </button>
            ))}
        </div>
      )}

      {/* Autocomplete dropdown */}
      {showDropdown && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-card shadow-xl">
          {dropdownItems.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                selectSuggestion(item.value);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={cn(
                "flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors",
                index === highlightedIndex
                  ? "bg-primary/15 text-primary"
                  : "text-white/70 hover:bg-white/5 hover:text-white",
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

/* ──────────────────── Upload Area ──────────────────── */

const UploadArea = ({ files, onChange }) => {
  const inputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const previewItems = useMemo(
    () =>
      files.map((entry, index) => {
        const localFile = getMediaFile(entry);
        const isVideo = isVideoMedia(entry);
        const remoteUrl = getMediaUrl(entry);
        const previewUrl =
          !isVideo && localFile
            ? URL.createObjectURL(localFile)
            : !isVideo
              ? remoteUrl
              : "";

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
      const valid = Array.from(incoming).filter((file) => {
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
  onServiceStepChange,
  suggestedKeywords,
  isSuggestedKeywordsLoading,
  currentServiceName,
}) => {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col items-center">
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
          <ServiceInfoStepper
            activeStepId="visuals"
            onStepChange={onServiceStepChange}
          />
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
                Positive Keywords
              </label>
              <KeywordInput
                keywords={serviceVisualsForm.keywords}
                suggestions={suggestedKeywords}
                serviceName={currentServiceName}
                isLoading={isSuggestedKeywordsLoading}
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
