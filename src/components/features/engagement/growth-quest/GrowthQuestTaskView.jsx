import React, { useRef, useState } from "react";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import UploadCloud from "lucide-react/dist/esm/icons/upload-cloud";
import File from "lucide-react/dist/esm/icons/file";
import Image from "lucide-react/dist/esm/icons/image";
import Video from "lucide-react/dist/esm/icons/video";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Code from "lucide-react/dist/esm/icons/code";
import X from "lucide-react/dist/esm/icons/x";
import { cn } from "@/shared/lib/utils";
import {
  CARD_CLASS,
  EYEBROW_CLASS,
  LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
  SUBTLE_CARD_CLASS,
} from "./shared";

const GrowthQuestTaskView = ({
  question,
  selectedFiles,
  onFilesSelect,
  onSubmit,
  submitting,
  canSubmit,
  error,
}) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  if (!question) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelect([...(selectedFiles || []), ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelect([...(selectedFiles || []), ...Array.from(e.target.files)]);
    }
  };

  const handleRemoveFile = (indexToRemove) => {
    const newFiles = (selectedFiles || []).filter((_, i) => i !== indexToRemove);
    onFilesSelect(newFiles);
  };

  const handleTypeSelect = (acceptType) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = acceptType;
      fileInputRef.current.click();
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className={cn(CARD_CLASS, "p-6 sm:p-8")}>
        <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className={EYEBROW_CLASS}>Daily Growth Quest</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              Today's Task
            </h2>
          </div>
          <div className={cn(SUBTLE_CARD_CLASS, "px-4 py-3")}>
            <p className={LABEL_CLASS}>Task Focus</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {question.focusReason || question.skillTag || question.categoryLabel || "Skill Building"}
            </p>
          </div>
        </div>

        <div className="mt-10">
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6 sm:p-10">
            <div className="absolute right-0 top-0 p-8 opacity-5">
              <Sparkles className="size-32" />
            </div>

            <p className="relative z-10 text-xl font-semibold leading-relaxed text-foreground mb-8">
              {question.questionText}
            </p>

            <div className="relative z-10 mt-8">
              <div
                className={cn(
                  "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-all",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="rounded-full bg-white/5 p-4 mb-4">
                  <UploadCloud className="size-8 text-muted-foreground" />
                </div>
                <h3 className="mb-1 text-lg font-medium text-foreground">
                  Upload your work
                </h3>
                <p className="mb-6 text-sm text-muted-foreground max-w-sm">
                  Select the type of file you want to upload:
                </p>
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleTypeSelect("image/*")}
                    className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
                  >
                    <Image className="size-4" /> Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeSelect("video/*")}
                    className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
                  >
                    <Video className="size-4" /> Video
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeSelect(".pdf,.doc,.docx,.xls,.xlsx,.txt")}
                    className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
                  >
                    <FileText className="size-4" /> Document
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeSelect(".js,.jsx,.ts,.tsx,.html,.css,.json,.py,.zip")}
                    className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
                  >
                    <Code className="size-4" /> Code
                  </button>
                </div>
              </div>

              {selectedFiles && selectedFiles.length > 0 && (
                <div className="mt-6 flex flex-col gap-3">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Attached Files ({selectedFiles.length})</h4>
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-4">
                        <div className="rounded-lg bg-primary/10 p-3 text-primary">
                          <File className="size-6" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground truncate max-w-[200px] sm:max-w-md">
                            {file.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                        title="Remove file"
                      >
                        <X className="size-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-[6px] border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-white/[0.08] pt-5 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit || submitting}
            className={PRIMARY_BUTTON_CLASS}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Submitting
              </>
            ) : (
              "Submit Task"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GrowthQuestTaskView;
