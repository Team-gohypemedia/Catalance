import React, { useState, useEffect, useRef } from "react";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import FileText from "lucide-react/dist/esm/icons/file-text";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import User from "lucide-react/dist/esm/icons/user";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import Code from "lucide-react/dist/esm/icons/code";
import gsap from "gsap";

const SCAN_PHASES = [
  { label: "Scanning text structure...", icon: FileText },
  { label: "Extracting work experience...", icon: Briefcase },
  { label: "Identifying core skills & tools...", icon: Code },
  { label: "Populating profile fields...", icon: User },
];

export default function AiResumeProcessingOverlay({ isOpen, fileName = "" }) {
  const [progressPercent, setProgressPercent] = useState(15);
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);

  const backdropRef = useRef(null);
  const modalRef = useRef(null);
  const scanLineRef = useRef(null);
  const scanTrailRef = useRef(null);
  const docCardRef = useRef(null);
  const progressBarRef = useRef(null);

  // GSAP Laser Scan Animation & Modal Entrance
  useEffect(() => {
    if (!isOpen) {
      setProgressPercent(15);
      setActivePhaseIndex(0);
      return;
    }

    // Modal Entrance
    if (backdropRef.current && modalRef.current) {
      gsap.fromTo(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: "power2.out" }
      );

      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.9, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: "back.out(1.5)" }
      );
    }

    // Continuous Laser Scanning Beam
    if (scanLineRef.current && scanTrailRef.current) {
      const scanTl = gsap.timeline({ repeat: -1, yoyo: true });
      scanTl.fromTo(
        [scanLineRef.current, scanTrailRef.current],
        { top: "0%" },
        {
          top: "92%",
          duration: 1.6,
          ease: "power1.inOut",
        }
      );
    }

    // Subtle document breathing tilt
    if (docCardRef.current) {
      gsap.to(docCardRef.current, {
        boxShadow: "0 15px 45px rgba(234, 88, 12, 0.25)",
        duration: 1.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }

    // Phase Switcher
    const phaseInterval = setInterval(() => {
      setActivePhaseIndex((prev) => (prev < SCAN_PHASES.length - 1 ? prev + 1 : prev));
    }, 2400);

    // Progress counter
    const progressInterval = setInterval(() => {
      setProgressPercent((prev) => (prev < 94 ? Math.min(94, prev + Math.floor(Math.random() * 6) + 3) : prev));
    }, 300);

    return () => {
      clearInterval(phaseInterval);
      clearInterval(progressInterval);
    };
  }, [isOpen]);

  // Smooth Progress Bar Width
  useEffect(() => {
    if (progressBarRef.current) {
      gsap.to(progressBarRef.current, {
        width: `${progressPercent}%`,
        duration: 0.35,
        ease: "power1.out",
      });
    }
  }, [progressPercent]);

  if (!isOpen) return null;

  const currentPhase = SCAN_PHASES[activePhaseIndex];
  const CurrentPhaseIcon = currentPhase.icon;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-transparent backdrop-blur-[3px] p-4 sm:p-6"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-md overflow-hidden rounded-[26px] border border-border bg-card p-6 sm:p-8 shadow-[0_28px_80px_rgba(0,0,0,0.2)] text-foreground flex flex-col items-center text-center"
      >
        {/* Soft Ambient Warm Glow */}
        <div className="absolute -left-16 -top-16 h-44 w-44 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
        <div className="absolute -right-16 -bottom-16 h-44 w-44 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        {/* AI Scanner Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary mb-4">
          <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
          <span>AI Document Optical Scanner</span>
        </div>

        {/* Document Scanning Animation Graphic */}
        <div
          ref={docCardRef}
          className="relative w-48 h-60 sm:w-52 sm:h-64 rounded-2xl border border-primary/40 bg-gradient-to-b from-card via-card to-primary/5 p-4 shadow-lg overflow-hidden flex flex-col justify-between my-2"
        >
          {/* Laser Scanning Beam Line */}
          <div
            ref={scanLineRef}
            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_18px_rgba(234,88,12,0.9)] z-20 pointer-events-none"
            style={{ top: "0%" }}
          />

          {/* Laser Glow Trail */}
          <div
            ref={scanTrailRef}
            className="absolute left-0 right-0 h-14 bg-gradient-to-b from-primary/20 via-primary/5 to-transparent z-10 pointer-events-none"
            style={{ top: "0%" }}
          />

          {/* Document Header Skeleton */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                <User className="h-3.5 w-3.5" />
              </div>
              <div className="space-y-1 w-full text-left">
                <div className="h-2.5 w-3/4 rounded-full bg-foreground/30 animate-pulse" />
                <div className="h-2 w-1/2 rounded-full bg-muted-foreground/30" />
              </div>
            </div>
            <div className="h-px w-full bg-border/80 my-2" />
          </div>

          {/* Document Body Skeleton (Experience & Skills) */}
          <div className="space-y-2 text-left">
            <div className="flex items-center justify-between">
              <div className="h-2 w-16 rounded-full bg-primary/50 font-semibold" />
              <div className="h-1.5 w-8 rounded-full bg-emerald-500/60" />
            </div>
            <div className="h-2 w-full rounded-full bg-muted-foreground/20" />
            <div className="h-2 w-5/6 rounded-full bg-muted-foreground/20" />
            
            <div className="pt-2 flex flex-wrap gap-1.5">
              <span className="h-4 px-2 rounded-full bg-primary/15 border border-primary/30 flex items-center text-[9px] font-bold text-primary">
                React
              </span>
              <span className="h-4 px-2 rounded-full bg-primary/15 border border-primary/30 flex items-center text-[9px] font-bold text-primary">
                Node.js
              </span>
              <span className="h-4 px-2 rounded-full bg-primary/15 border border-primary/30 flex items-center text-[9px] font-bold text-primary">
                AI / ML
              </span>
            </div>
          </div>

          {/* Document Footer Lines */}
          <div className="space-y-1 text-left pt-2 border-t border-border/60">
            <div className="h-2 w-4/5 rounded-full bg-muted-foreground/20" />
            <div className="h-2 w-2/3 rounded-full bg-muted-foreground/20" />
          </div>
        </div>

        {/* File Name & Active Phase */}
        <div className="mt-4 w-full">
          <h4 className="text-base font-bold text-foreground">
            Scanning Document
          </h4>
          {fileName && (
            <p className="mt-0.5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="truncate max-w-[240px] font-medium text-foreground">
                {fileName}
              </span>
            </p>
          )}

          {/* Active Phase Status Pill */}
          <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-primary/10 border border-primary/20 py-2 px-3 text-xs font-semibold text-primary">
            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 text-primary" />
            <span>{currentPhase.label}</span>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 w-full">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-1.5">
              <span>Extracting Data</span>
              <span className="font-mono font-bold text-primary">{progressPercent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted border border-border p-0.5">
              <div
                ref={progressBarRef}
                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
