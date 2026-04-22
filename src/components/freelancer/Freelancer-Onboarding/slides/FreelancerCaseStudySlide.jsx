import { useRef } from "react";
import IndianRupee from "lucide-react/dist/esm/icons/indian-rupee";
import Link2 from "lucide-react/dist/esm/icons/link-2";
import Plus from "lucide-react/dist/esm/icons/plus";
import Upload from "lucide-react/dist/esm/icons/upload";
import X from "lucide-react/dist/esm/icons/x";

import { cn } from "@/shared/lib/utils";
import {
  ServiceInfoStepper,
  CustomSelect,
} from "./shared/ServiceInfoComponents";

const ROLE_OPTIONS = [
  { value: "full_execution", label: "Full execution" },
  { value: "partial_contribution", label: "Partial contribution" },
  { value: "team_project", label: "Team project" },
];

const TIMELINE_OPTIONS = [
  { value: "under_1_week", label: "Under 1 Week" },
  { value: "1_2_weeks", label: "1–2 Weeks" },
  { value: "2_4_weeks", label: "2–4 Weeks" },
  { value: "4_6_weeks", label: "4–6 Weeks" },
  { value: "6_8_weeks", label: "6–8 Weeks" },
  { value: "8_12_weeks", label: "8–12 Weeks" },
  { value: "12_plus_weeks", label: "12+ Weeks" },
];

const getCaseStudyLabel = (caseStudy = {}, index = 0) =>
  String(caseStudy?.title || "").trim() || `Project ${index + 1}`;

/* ──────────────────── File Upload Button ──────────────────── */

const FileUploadButton = ({ file, onChange }) => {
  const inputRef = useRef(null);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-card px-4 text-sm text-white/40 transition-colors hover:border-white/20"
      >
        <Upload className="h-4 w-4" />
        <span>{file ? file.name : "Upload file"}</span>
      </button>
      {file && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        onChange={(e) => {
          const selected = e.target.files?.[0] || null;
          onChange(selected);
          e.target.value = "";
        }}
        className="hidden"
      />
    </div>
  );
};

/* ──────────────────── Main Slide ──────────────────── */

const FreelancerCaseStudySlide = ({
  currentServiceName,
  caseStudyForm,
  caseStudies = [],
  activeCaseStudyId = "",
  activeCaseStudyIndex = 0,
  nicheOptions = [],
  onCaseStudyFieldChange,
  onAddCaseStudy,
  onRemoveCaseStudy,
  onActiveCaseStudyChange,
  onServiceStepChange,
}) => {
  const serviceName = currentServiceName || "Service";
  const resolvedCaseStudies = Array.isArray(caseStudies) ? caseStudies : [];
  const activeCaseStudyLabel =
    String(caseStudyForm?.title || "").trim() ||
    `Project ${Number.isInteger(activeCaseStudyIndex) ? activeCaseStudyIndex + 1 : 1}`;

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col items-center">
      <div className="w-full space-y-8">
        {/* Heading */}
        <div className="text-center">
          <h1 className="text-balance text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl lg:text-[3.1rem] lg:leading-[1.04]">
            <span>Tell Us About </span>
            <span className="text-primary">Your</span>
            <span> Previous </span>
            <span className="text-primary">Work</span>
          </h1>
        </div>

        {/* Stepper */}
        <div className="w-full">
          <ServiceInfoStepper
            activeStepId="caseStudy"
            onStepChange={onServiceStepChange}
          />
        </div>

        {/* Step Content */}
        <div className="w-full space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">
              Project Portfolio
            </h2>
            <p className="text-sm text-muted-foreground sm:text-base">
              We need some details to verify your identity. Please complete the
              form below.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                  Case Studies
                </p>
                <p className="text-xs leading-relaxed text-white/40">
                  Add multiple projects and switch between them while filling the details.
                </p>
              </div>

              <button
                type="button"
                onClick={onAddCaseStudy}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-4 text-sm font-semibold text-primary transition-colors hover:border-primary/40 hover:bg-primary/14"
              >
                <Plus className="h-4 w-4" />
                Add Case Study
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {resolvedCaseStudies.map((caseStudy, index) => {
                const isActive = caseStudy?.id === activeCaseStudyId;
                const label = getCaseStudyLabel(caseStudy, index);

                return (
                  <div
                    key={caseStudy?.id || `case-study-${index + 1}`}
                    className={cn(
                      "flex items-stretch overflow-hidden rounded-2xl border transition-colors",
                      isActive
                        ? "border-primary/40 bg-primary/10"
                        : "border-white/10 bg-card/60",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onActiveCaseStudyChange(caseStudy?.id)}
                      className="flex-1 px-4 py-3 text-left"
                    >
                      <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">
                        Project {index + 1}
                      </p>
                      <p
                        className={cn(
                          "mt-1 truncate text-sm font-medium",
                          isActive ? "text-white" : "text-white/75",
                        )}
                      >
                        {label}
                      </p>
                    </button>

                    {resolvedCaseStudies.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => onRemoveCaseStudy(caseStudy?.id)}
                        className="flex w-12 items-center justify-center border-l border-white/8 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
                        aria-label={`Remove ${label}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Project Header */}
          <h3 className="text-xl font-semibold text-white sm:text-2xl">
            {activeCaseStudyLabel}{" "}
            <span className="font-normal text-white">({serviceName})</span>
          </h3>

          <div className="space-y-6">
            {/* Case Study Title */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                Case Study Title
              </label>
              <input
                type="text"
                value={caseStudyForm.title}
                onChange={(e) =>
                  onCaseStudyFieldChange("title", e.target.value)
                }
                placeholder="e.g. E-commerce Platform Redesign"
                className="h-12 w-full rounded-xl border border-white/10 bg-card px-4 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              />
            </div>

            {/* Description */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                Description
              </label>
              <textarea
                value={caseStudyForm.description}
                onChange={(e) =>
                  onCaseStudyFieldChange("description", e.target.value)
                }
                placeholder="Briefly describe the project and its goals..."
                rows={4}
                className="w-full resize-none rounded-xl border border-white/10 bg-card px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              />
            </div>

            {/* Niche */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                Niche
              </label>
              <CustomSelect
                value={caseStudyForm.niche}
                onChange={(val) => onCaseStudyFieldChange("niche", val)}
                options={nicheOptions}
                placeholder="select niche"
                isSearchable
                searchPlaceholder="Search niches"
              />
            </div>

            {/* 3-column row: Project Link, Project File, Your Role */}
            <div className="grid gap-5 sm:grid-cols-3">
              {/* Project Link */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                  Project Link (Optional)
                </label>
                <div className="relative">
                  <Link2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <input
                    type="url"
                    value={caseStudyForm.projectLink}
                    onChange={(e) =>
                      onCaseStudyFieldChange("projectLink", e.target.value)
                    }
                    placeholder="https://..."
                    className="h-12 w-full rounded-xl border border-white/10 bg-card pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Project File */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                  Project File (Optional)
                </label>
                <FileUploadButton
                  file={caseStudyForm.projectFile}
                  onChange={(file) =>
                    onCaseStudyFieldChange("projectFile", file)
                  }
                />
              </div>

              {/* Your Role */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                  Your Role
                </label>
                <CustomSelect
                  value={caseStudyForm.role}
                  onChange={(val) => onCaseStudyFieldChange("role", val)}
                  options={ROLE_OPTIONS}
                  placeholder="Select role"
                />
              </div>
            </div>

            {/* 2-column row: Timeline, Budget */}
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Timeline */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                  Timeline
                </label>
                <CustomSelect
                  value={caseStudyForm.timeline}
                  onChange={(val) => onCaseStudyFieldChange("timeline", val)}
                  options={TIMELINE_OPTIONS}
                  placeholder="Select duration"
                />
              </div>

              {/* Budget */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                  Budget
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={caseStudyForm.budget}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      onCaseStudyFieldChange("budget", val);
                    }}
                    placeholder="e.g. 5000"
                    className="h-12 w-full rounded-xl border border-white/10 bg-card pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default FreelancerCaseStudySlide;
