import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Sparkle from "lucide-react/dist/esm/icons/sparkle";
import Upload from "lucide-react/dist/esm/icons/upload";
import X from "lucide-react/dist/esm/icons/x";
import gsap from "gsap";

export default function AiAutofillModal({
  isOpen,
  onClose,
  onFileSelect,
  isProcessing = false,
}) {
  const backdropRef = useRef(null);
  const modalRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (backdropRef.current && modalRef.current) {
      gsap.fromTo(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: "power2.out" }
      );

      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.92, y: 20 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.45,
          ease: "power3.out",
        }
      );
    }
  }, [isOpen]);

  const handleClose = () => {
    if (modalRef.current && backdropRef.current) {
      gsap.to(modalRef.current, {
        opacity: 0,
        scale: 0.94,
        y: 12,
        duration: 0.2,
        ease: "power2.in",
      });
      gsap.to(backdropRef.current, {
        opacity: 0,
        duration: 0.2,
        ease: "power2.in",
        onComplete: onClose,
      });
    } else {
      onClose();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      onClose();
    }
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileSelect(file);
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal((
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[9990] flex items-center justify-center bg-transparent backdrop-blur-[2px] p-4 sm:p-6"
      onClick={(e) => {
        if (e.target === backdropRef.current) handleClose();
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-lg sm:max-w-[560px] overflow-hidden rounded-[24px] border border-border bg-card p-8 sm:p-10 shadow-[0_28px_80px_rgba(0,0,0,0.18)] text-foreground"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Sparkle Icon */}
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkle className="h-7 w-7" />
          </div>

          <h3 className="text-2xl font-bold text-foreground sm:text-[26px]">
            Autofill with <span className="text-primary">Resume</span>
          </h3>

          <p className="mt-2 text-sm text-muted-foreground max-w-md leading-relaxed">
            Upload your CV or resume to quickly autofill your profile details in seconds.
          </p>

          {/* Spacious Dropzone Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`mt-7 w-full cursor-pointer rounded-[18px] border border-dashed py-9 px-6 sm:py-11 sm:px-8 transition-all duration-200 ${
              isDragOver
                ? "border-primary bg-primary/10 scale-[1.01]"
                : "border-primary/40 bg-primary/5 hover:border-primary/80 hover:bg-primary/10"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              disabled={isProcessing}
              onChange={handleFileChange}
            />

            <div className="flex flex-col items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Drag and drop your CV here, or browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF or DOCX (Max 5MB)
                </p>
              </div>

              <span className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 mt-1.5">
                Browse Resume
              </span>
            </div>
          </div>

          {/* Skip Button */}
          <button
            type="button"
            onClick={handleClose}
            className="mt-6 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip and fill manually
          </button>
        </div>
      </div>
    </div>
  ), document.body);
}
