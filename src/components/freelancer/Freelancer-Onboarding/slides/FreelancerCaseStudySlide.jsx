import { useRef } from "react";
import Link2 from "lucide-react/dist/esm/icons/link-2";
import Upload from "lucide-react/dist/esm/icons/upload";
import X from "lucide-react/dist/esm/icons/x";

import {
  ServiceInfoStepper,
  CustomSelect,
} from "./shared/ServiceInfoComponents";

const ROLE_OPTIONS = [
  { value: "solo", label: "Solo Developer / Designer" },
  { value: "lead", label: "Project Lead" },
  { value: "team_member", label: "Team Member" },
  { value: "consultant", label: "Consultant" },
  { value: "freelancer", label: "Freelancer" },
];

const TIMELINE_OPTIONS = [
  { value: "under_1_week", label: "Under 1 Week" },
  { value: "1_2_weeks", label: "1–2 Weeks" },
  { value: "2_4_weeks", label: "2–4 Weeks" },
  { value: "1_2_months", label: "1–2 Months" },
  { value: "2_3_months", label: "2–3 Months" },
  { value: "3_6_months", label: "3–6 Months" },
  { value: "6_plus_months", label: "6+ Months" },
];

const NICHE_OPTIONS = [
  { value: "ecommerce", label: "E-commerce" },
  { value: "saas", label: "SaaS" },
  { value: "healthcare", label: "Healthcare" },
  { value: "fintech", label: "Fintech" },
  { value: "education", label: "Education" },
  { value: "real_estate", label: "Real Estate" },
  { value: "food_beverage", label: "Food & Beverage" },
  { value: "travel", label: "Travel & Hospitality" },
  { value: "media", label: "Media & Entertainment" },
  { value: "nonprofit", label: "Non-profit" },
  { value: "other", label: "Other" },
];

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
  selectedServices,
  dbServices,
  caseStudyForm,
  onCaseStudyFieldChange,
}) => {
  const firstServiceId =
    Array.isArray(selectedServices) && selectedServices.length > 0
      ? selectedServices[0]
      : null;

  const firstService =
    firstServiceId && Array.isArray(dbServices)
      ? dbServices.find((s) => s.id === firstServiceId)
      : null;

  const serviceName = firstService?.name ?? "Service";

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col items-center">
      <div className="w-full space-y-8">
        {/* Heading */}
        <div className="text-center">
          <h1 className="text-balance text-3xl font-semibold italic tracking-[-0.04em] text-white sm:text-4xl lg:text-[3.1rem] lg:leading-[1.04]">
            <span>Tell Us About </span>
            <span className="text-primary">Your</span>
            <span> Previous </span>
            <span className="text-primary">Work</span>
          </h1>
        </div>

        {/* Stepper */}
        <div className="w-full">
          <ServiceInfoStepper activeStepId="caseStudy" />
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

          {/* Project Header */}
          <h3 className="text-xl font-semibold text-white sm:text-2xl">
            Project 1{" "}
            <span className="font-normal text-white/50">({serviceName})</span>
          </h3>

          <div className="space-y-6 rounded-2xl border border-white/8 bg-card/50 p-5 sm:p-7">
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

            {/* 3-column row: Project Link, Project File, Your Role */}
            <div className="grid gap-5 sm:grid-cols-3">
              {/* Project Link */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                  Project Link{" "}
                  <span className="normal-case font-normal text-white/35">
                    (Optional)
                  </span>
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
                  Project File{" "}
                  <span className="normal-case font-normal text-white/35">
                    (Optional)
                  </span>
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
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/40">
                    $
                  </span>
                  <input
                    type="text"
                    value={caseStudyForm.budget}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      onCaseStudyFieldChange("budget", val);
                    }}
                    placeholder="e.g. 5000"
                    className="h-12 w-full rounded-xl border border-white/10 bg-card pl-8 pr-4 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            {/* Niche */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                Niche
              </label>
              <CustomSelect
                value={caseStudyForm.niche}
                onChange={(val) => onCaseStudyFieldChange("niche", val)}
                options={NICHE_OPTIONS}
                placeholder="Select niche"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FreelancerCaseStudySlide;
