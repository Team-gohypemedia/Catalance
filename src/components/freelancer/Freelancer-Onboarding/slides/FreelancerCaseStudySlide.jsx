import { useRef } from "react";
import IndianRupee from "lucide-react/dist/esm/icons/indian-rupee";
import Link2 from "lucide-react/dist/esm/icons/link-2";
import Plus from "lucide-react/dist/esm/icons/plus";
import Upload from "lucide-react/dist/esm/icons/upload";
import X from "lucide-react/dist/esm/icons/x";

import { cn } from "@/shared/lib/utils";
import { ONBOARDING_FIELD_LABEL_CLASS } from "../typography";
import {
  ServiceInfoStepper,
  CustomSelect,
} from "./shared/ServiceInfoComponents";

const ONBOARDING_PAGE_TITLE_CLASS =
  "text-balance text-[34px] font-semibold leading-[1.08] tracking-[-0.04em] sm:text-[40px]";
const ONBOARDING_SECTION_TITLE_CLASS = "text-2xl font-medium leading-tight tracking-[-0.02em]";
const ONBOARDING_SECTION_DESCRIPTION_CLASS = "text-base font-normal leading-7";

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
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-card px-4 !text-[14px] !leading-5 text-white/20 transition-colors hover:border-white/20"
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
  activeCaseStudyIndex = 0,
  nicheOptions = [],
  onCaseStudyFieldChange,
  onAddCaseStudy,
  onServiceStepChange,
}) => {
  const serviceName = currentServiceName || "Service";
  const activeCaseStudyLabel =
    String(caseStudyForm?.title || "").trim() ||
    `Project ${Number.isInteger(activeCaseStudyIndex) ? activeCaseStudyIndex + 1 : 1}`;

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col items-center">
      <div className="w-full space-y-8">
        {/* Heading */}
        <div className="text-center">
          <h1 className={ONBOARDING_PAGE_TITLE_CLASS}>
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
        <div className="w-full space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className={cn(ONBOARDING_SECTION_TITLE_CLASS, "text-white")}>
                Project Portfolio
              </h2>
              <p className={cn(ONBOARDING_SECTION_DESCRIPTION_CLASS, "text-muted-foreground")}>
                We need some details to verify your identity. Please complete the
                form below.
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

          {/* Project Header */}
          <h3 className={cn(ONBOARDING_SECTION_TITLE_CLASS, "text-white")}>
            {activeCaseStudyLabel}
          </h3>

          <div className="space-y-6">
            {/* Case Study Title */}
            <div className="space-y-0">
              <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
                Case Study Title
              </label>
              <input
                type="text"
                value={caseStudyForm.title}
                onChange={(e) =>
                  onCaseStudyFieldChange("title", e.target.value)
                }
                placeholder="e.g. E-commerce Platform Redesign"
                className="h-12 w-full rounded-xl border border-white/10 bg-card px-4 !text-[14px] !leading-5 text-white outline-none transition-colors placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              />
            </div>

            {/* Description */}
            <div className="space-y-0">
              <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
                Description
              </label>
              <textarea
                value={caseStudyForm.description}
                onChange={(e) =>
                  onCaseStudyFieldChange("description", e.target.value)
                }
                placeholder="Briefly describe the project and its goals..."
                rows={4}
                className="w-full resize-none rounded-xl border border-white/10 bg-card px-4 py-3 !text-[14px] !leading-5 text-white outline-none transition-colors placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              />
            </div>

            {/* Niche */}
            <div className="space-y-0">
              <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
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
              <div className="space-y-0">
                <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
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
                    className="h-12 w-full rounded-xl border border-white/10 bg-card pl-10 pr-4 !text-[14px] !leading-5 text-white outline-none transition-colors placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Project File */}
              <div className="space-y-0">
                <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
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
              <div className="space-y-0">
                <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
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
              <div className="space-y-0">
                <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
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
              <div className="space-y-0">
                <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
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
                    className="h-12 w-full rounded-xl border border-white/10 bg-card pl-10 pr-4 !text-[14px] !leading-5 text-white outline-none transition-colors placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
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
