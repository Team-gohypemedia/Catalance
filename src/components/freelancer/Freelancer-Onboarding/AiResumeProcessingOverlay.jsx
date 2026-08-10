import React, { useState, useEffect } from "react";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import FileText from "lucide-react/dist/esm/icons/file-text";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import cataLogo from "@/assets/logos/logo.svg";

const AI_STEPS = [
  {
    id: 1,
    title: "Reading Document Text",
    description: "Extracting readable text and structure from your resume file...",
  },
  {
    id: 2,
    title: "Analyzing Experience & Bio",
    description: "Cata AI is parsing work history, summary, and skills...",
  },
  {
    id: 3,
    title: "Matching Service Catalog",
    description: "Identifying matching service niches and pricing capabilities...",
  },
  {
    id: 4,
    title: "Finalizing Profile Autofill",
    description: "Applying high-confidence data directly to your profile fields...",
  },
];

export default function AiResumeProcessingOverlay({ isOpen, fileName = "" }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(15);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      setProgressPercent(15);
      return;
    }

    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < AI_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 2800);

    const progressInterval = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev < 92) {
          return Math.min(92, prev + Math.floor(Math.random() * 8) + 3);
        }
        return prev;
      });
    }, 350);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStep = AI_STEPS[currentStepIndex];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/30 backdrop-blur-md p-4 transition-all duration-300 animate-in fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-orange-100 bg-white/95 p-8 shadow-[0_20px_50px_rgba(234,88,12,0.12)] text-slate-900">
        {/* Soft Ambient Warm Glows */}
        <div className="absolute -left-20 -top-20 h-52 w-52 rounded-full bg-orange-100/60 blur-3xl pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 h-52 w-52 rounded-full bg-amber-100/60 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Catalance Logo & Cata AI Avatar */}
          <div className="relative mb-4 flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-orange-400 to-amber-400 opacity-20 blur-sm animate-pulse" />
            <div className="relative flex h-full w-full items-center justify-center rounded-2xl border border-orange-200/80 bg-white p-3.5 shadow-md shadow-orange-500/10">
              <img
                src={cataLogo}
                alt="Catalance Logo"
                className="h-11 w-11 object-contain"
              />
            </div>
            {/* Sparkles Floating Badge */}
            <span className="absolute -top-1 -right-1 flex h-6.5 w-6.5 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md ring-2 ring-white">
              <Sparkles className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '6s' }} />
            </span>
          </div>

          {/* Cata AI Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1 text-xs font-semibold text-orange-600 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-orange-500 animate-pulse" />
            <span>Cata AI Engine</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Autofilling Your Profile
          </h2>

          {fileName && (
            <p className="mt-1.5 flex items-center justify-center gap-1.5 text-xs text-slate-500">
              <FileText className="h-3.5 w-3.5 text-orange-500 shrink-0" />
              <span className="truncate max-w-[280px] font-medium text-slate-700">
                {fileName}
              </span>
            </p>
          )}

          {/* Progress Bar */}
          <div className="mt-6 w-full">
            <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-2">
              <span className="font-semibold text-slate-800">{currentStep.title}</span>
              <span className="text-orange-600 font-bold font-mono">{progressPercent}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200/80 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300 ease-out rounded-full shadow-sm"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Active Step Info Banner (Clean Light Theme) */}
          <div className="mt-5 w-full rounded-2xl border border-orange-200/80 bg-orange-50/70 p-4 text-left shadow-sm">
            <div className="flex items-start gap-3.5">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {currentStep.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                  {currentStep.description}
                </p>
              </div>
            </div>
          </div>

          {/* Step Timeline */}
          <div className="mt-5 w-full space-y-2">
            {AI_STEPS.map((step, idx) => {
              const isDone = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div
                  key={step.id}
                  className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-xs transition-all duration-200 ${
                    isCurrent
                      ? "bg-orange-50 border border-orange-200 text-orange-950 shadow-sm"
                      : isDone
                      ? "bg-slate-50 border border-slate-100 text-slate-700"
                      : "text-slate-400 border border-transparent opacity-60"
                  }`}
                >
                  <span className="flex items-center gap-2.5 font-medium">
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : isCurrent ? (
                      <span className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
                      </span>
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-slate-300 shrink-0" />
                    )}
                    {step.title}
                  </span>
                  <span className="text-[10px] font-mono font-semibold tracking-wider uppercase">
                    {isDone ? (
                      <span className="text-emerald-600 font-bold">Done</span>
                    ) : isCurrent ? (
                      <span className="text-orange-600 font-bold animate-pulse">Processing</span>
                    ) : (
                      "Waiting"
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="mt-5 text-[11px] text-slate-500">
            Cata AI is processing your document. Please keep this window open.
          </p>
        </div>
      </div>
    </div>
  );
}
