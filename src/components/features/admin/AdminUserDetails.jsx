import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { AdminTopBar } from "./AdminTopBar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/shared/context/AuthContext";
import { Button } from "@/components/ui/button";
import User from "lucide-react/dist/esm/icons/user";
import Mail from "lucide-react/dist/esm/icons/mail";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Phone from "lucide-react/dist/esm/icons/phone";
import Wrench from "lucide-react/dist/esm/icons/wrench";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import Award from "lucide-react/dist/esm/icons/award";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import FileText from "lucide-react/dist/esm/icons/file-text";
import IndianRupee from "lucide-react/dist/esm/icons/indian-rupee";
import FolderOpen from "lucide-react/dist/esm/icons/folder-open";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up";
import Bot from "lucide-react/dist/esm/icons/bot";
import Check from "lucide-react/dist/esm/icons/check";
import X from "lucide-react/dist/esm/icons/x";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import ListChecks from "lucide-react/dist/esm/icons/list-checks";

const isPlainObject = (value) => value && typeof value === "object" && !Array.isArray(value);
const isPrimitiveValue = (value) =>
  value === null || value === undefined || ["string", "number", "boolean"].includes(typeof value);

const hasDisplayValue = (value) => {
  if (Array.isArray(value)) return value.length > 0;
  if (isPlainObject(value)) return Object.keys(value).length > 0;
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  return true;
};

const toDisplayLabel = (value = "") =>
  String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatPrimitiveValue = (value) => {
  if (value === null || value === undefined) return "Not set";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  const asString = String(value);
  return asString.trim() ? asString : "Not set";
};

const getObjectSummary = (value = {}) => {
  const candidates = [
    "title",
    "name",
    "label",
    "serviceTitle",
    "role",
    "company",
    "niche",
    "timeline",
    "budget",
  ];

  for (const key of candidates) {
    const candidateValue = value?.[key];
    if (typeof candidateValue === "string" && candidateValue.trim()) return candidateValue.trim();
  }

  if (typeof value?.id === "string" && value.id.trim()) return value.id.trim();

  return "";
};

const normalizeUrl = (value) => {
  if (!value || typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
};

const pickFirstValue = (...values) => values.find((value) => hasDisplayValue(value));

const normalizeCaseStudies = (detail = {}) => {
  const caseStudies = Array.isArray(detail.caseStudies)
    ? detail.caseStudies
    : detail.caseStudy
      ? [detail.caseStudy]
      : [];

  return caseStudies
    .filter((entry) => isPlainObject(entry))
    .map((entry) => ({
      title: String(entry.title || entry.name || "").trim(),
      description: String(entry.description || "").trim(),
      niche: String(entry.niche || "").trim(),
      role: String(entry.role || "").trim(),
      timeline: String(entry.timeline || "").trim(),
      budget: String(entry.budget || "").trim(),
      link: normalizeUrl(entry.projectLink || entry.link || entry.url || ""),
      image: normalizeUrl(entry.coverImage || entry.image || entry.fileUrl || entry?.file?.url || ""),
    }))
    .filter((entry) => hasDisplayValue(entry.title) || hasDisplayValue(entry.description));
};

const normalizeMediaEntries = (detail = {}) => {
  const rawMedia = Array.isArray(detail.media)
    ? detail.media
    : detail.media
      ? [detail.media]
      : detail.coverImage
        ? [{ url: detail.coverImage, name: "Cover image" }]
        : [];

  return rawMedia
    .filter((entry) => isPlainObject(entry))
    .map((entry) => ({
      name: String(entry.name || entry.fileName || entry.title || "Media").trim(),
      url: normalizeUrl(entry.url || entry.fileUrl || entry.coverImage || entry.path || ""),
      mimeType: String(entry.mimeType || entry.type || "").trim(),
      size: entry.size,
    }))
    .filter((entry) => hasDisplayValue(entry.url));
};

const normalizeSubcategories = (detail = {}) => {
  const subcategories = Array.isArray(detail.subcategories) ? detail.subcategories : [];
  return subcategories
    .map((entry) => {
      if (typeof entry === "string") return entry;
      if (!isPlainObject(entry)) return "";
      return String(entry.label || entry.name || entry.subCategoryName || "").trim();
    })
    .filter((entry) => entry);
};

const normalizeSkills = (detail = {}) => {
  const skills = Array.isArray(detail.skillsAndTechnologies)
    ? detail.skillsAndTechnologies
    : Array.isArray(detail.skills)
      ? detail.skills
      : [];
  return skills.filter((entry) => typeof entry === "string" && entry.trim());
};

const getAdditionalDetailEntries = (detail = {}) => {
  const hiddenKeys = new Set([
    "serviceKey",
    "serviceId",
    "serviceID",
    "activeCaseStudyId",
    "caseStudyId",
    "caseStudyID",
    "caseStudy",
    "caseStudies",
    "subcategories",
    "skillsAndTechnologies",
    "skills",
    "title",
    "serviceTitle",
    "serviceDescription",
    "description",
    "deliveryTime",
    "deliveryTimeline",
    "experienceYears",
    "experience",
    "averageProjectPrice",
    "averagePrice",
    "priceRange",
    "media",
    "coverImage",
  ]);

  return Object.entries(detail).filter(
    ([key, value]) => !hiddenKeys.has(key) && hasDisplayValue(value)
  );
};

function renderDetailValue(value) {
  if (Array.isArray(value)) {
    if (!value.length) return "Not set";
    const allPrimitive = value.every(isPrimitiveValue);
    if (allPrimitive) return value.map(formatPrimitiveValue).join(", ");

    return (
      <div className="space-y-3">
        {value.map((entry, index) => {
          if (!isPlainObject(entry)) {
            return (
              <p key={index} className="text-sm break-words">
                {formatPrimitiveValue(entry)}
              </p>
            );
          }

          const summary = getObjectSummary(entry);
          return (
            <div key={index} className="rounded-md border bg-muted/10 p-3">
              {summary ? <p className="text-sm font-medium mb-2">{summary}</p> : null}
              {renderKeyValuePairs(entry)}
            </div>
          );
        })}
      </div>
    );
  }

  if (isPlainObject(value)) {
    return renderKeyValuePairs(value) || "Not set";
  }

  return formatPrimitiveValue(value);
}

function renderKeyValuePairs(value) {
  const entries = Object.entries(value || {}).filter(([, entryValue]) => hasDisplayValue(entryValue));
  if (!entries.length) return null;

  return (
    <div className="grid gap-2 md:grid-cols-2">
      {entries.map(([entryKey, entryValue]) => (
        <div key={entryKey}>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {toDisplayLabel(entryKey)}
          </p>
          <p className="mt-1 text-sm break-words">
            {renderDetailValue(entryValue)}
          </p>
        </div>
      ))}
    </div>
  );
}

const FreelancerOnboardingTrackingCard = ({ userData }) => {
  const [expandedSteps, setExpandedSteps] = useState({});
  const [expandAll, setExpandAll] = useState(false);

  const fp = userData?.freelancerProfile || {};
  const pd = userData?.profileDetails || fp?.serviceDetails?.__profileDetails || {};
  const progressObj = pd.onboardingProgress || fp?.serviceDetails?.__profileDetails?.onboardingProgress || fp?.serviceDetails?.onboardingProgress || {};

  const isComplete = Boolean(userData?.onboardingComplete || progressObj?.isCompleted);
  const currentStep = progressObj.currentStep || (isComplete ? "completed" : "welcome");
  const currentStepTitle = progressObj.currentStepTitle || currentStep;
  const percentage = isComplete ? 100 : (Number(progressObj.progressPercentage) || (currentStep === "welcome" ? 10 : 35));
  const lastActive = progressObj.lastActiveAt || fp.updatedAt || userData?.updatedAt;

  // AI Resume usage check
  const usedAiResume = Boolean(
    progressObj?.usedAiResume ||
    progressObj?.aiResumeDetails?.used ||
    pd?.usedAiResume ||
    pd?.aiResumeDetails?.used ||
    fp?.usedAiResume
  );
  const aiResumeDetails = progressObj?.aiResumeDetails || pd?.aiResumeDetails || {};

  const aiAutofilledIds = new Set(
    aiResumeDetails?.aiAutofilledFieldIds ||
    progressObj?.aiResumeDetails?.aiAutofilledFieldIds ||
    pd?.aiResumeDetails?.aiAutofilledFieldIds ||
    (usedAiResume ? ["fullName", "professionalBio", "country", "state", "languages", "skills", "services"] : [])
  );
  const aiAutofilledLabels = aiResumeDetails?.aiAutofilledFieldLabels || (usedAiResume ? ["Full Name", "Professional Bio", "Country & State", "Languages", "Primary Skills", "Marketplace Services"] : []);

  const draft = pd.onboardingDraft || {};
  const bpf = draft.basicProfileForm || {};

  // Extract field values
  const workPref = draft.selectedWorkPreference || fp?.workPreference || pd?.workPreference || fp?.serviceDetails?.workPreference || progressObj?.stageStats?.workPreference?.value || "";
  const fullName = bpf.fullName || userData?.fullName || pd?.fullName || "";
  const headline = bpf.headline || fp?.headline || pd?.headline || userData?.headline || "";
  const bio = bpf.professionalBio || bpf.bio || fp?.bio || pd?.bio || userData?.professionalBio || "";
  const city = bpf.city || fp?.location || pd?.city || pd?.identity?.city || userData?.city || "";
  const experience = bpf.experience || fp?.experienceLevel || pd?.experienceLevel || (userData?.experienceYears ? `${userData.experienceYears} Years` : "");
  const hourlyRate = bpf.hourlyRate || fp?.hourlyRate || pd?.hourlyRate || "";
  const skills = (Array.isArray(bpf.skills) && bpf.skills.length > 0) ? bpf.skills : (fp?.skills || pd?.skills || userData?.skills || []);
  const resume = bpf.resumeUrl || bpf.resume || fp?.resume || pd?.resume || userData?.resume || "";
  const services = (Array.isArray(draft.selectedServices) && draft.selectedServices.length > 0)
    ? draft.selectedServices
    : (Array.isArray(fp?.services) && fp.services.length > 0)
      ? fp.services
      : (Array.isArray(pd?.services) && pd.services.length > 0)
        ? pd.services
        : (Array.isArray(userData?.services) && userData.services.length > 0)
          ? userData.services
          : (progressObj?.stageStats?.services?.selectedServices || []);
  const serviceDetailsMap = draft.serviceDraftsByKey || pd?.serviceDetails || fp?.serviceDetails || {};
  const serviceEntries = Object.entries(serviceDetailsMap || {}).map(([key, val]) => ({
    key,
    ...val,
  })).filter(s => s && typeof s === "object");

  const hasConfiguredServices = serviceEntries.length > 0;
  const hasServiceTitle = serviceEntries.some(s => Boolean(s.title || s.serviceTitle)) || Boolean(fp?.serviceTitle || userData?.serviceTitle);
  const hasServiceDesc = serviceEntries.some(s => Boolean(s.description || s.serviceDescription)) || Boolean(fp?.serviceDescription || userData?.serviceDescription);
  const hasServicePrice = serviceEntries.some(s => Boolean(s.startingPrice || s.price || s.startingPriceRate)) || Boolean(fp?.startingPrice || userData?.startingPrice);
  const hasDeliveryTimeline = serviceEntries.some(s => Boolean(s.deliveryTimeline)) || Boolean(fp?.deliveryTimeline || userData?.deliveryTimeline);

  const allCaseStudies = [
    ...(serviceEntries.flatMap(s => s?.caseStudies || (s?.caseStudy ? [s.caseStudy] : []))),
    ...(Array.isArray(fp?.portfolio) ? fp.portfolio : []),
    ...(Array.isArray(pd?.portfolioProjects) ? pd.portfolioProjects : []),
    ...(Array.isArray(fp?.portfolioProjects) ? fp.portfolioProjects : []),
    ...(Array.isArray(userData?.portfolioProjects) ? userData.portfolioProjects : [])
  ].filter(c => c && typeof c === "object" && (c.title || c.name || c.description || c.projectLink || c.link));

  const acceptInProgress = draft.acceptInProgressProjectsValue ?? fp?.acceptInProgressProjects ?? pd?.acceptInProgressProjects ?? userData?.acceptInProgressProjects;
  const deliveryPolicy = draft.deliveryPolicyAccepted ?? pd?.deliveryPolicyAccepted ?? (isComplete ? true : false);
  const commPolicy = draft.communicationPolicyAccepted ?? pd?.communicationPolicyAccepted ?? (isComplete ? true : false);

  const steps = [
    {
      id: "welcome",
      stepNum: 1,
      title: "Welcome & Intro",
      path: "/freelancer/onboarding/welcome",
      fields: [
        { id: "welcome", label: "Welcome Overview & Intro", isFilled: true, value: "Viewed Intro", isAiAutofilled: false }
      ]
    },
    {
      id: "workPreference",
      stepNum: 2,
      title: "Work Preference",
      path: "/freelancer/onboarding/workPreference",
      fields: [
        { id: "workPreference", label: "Selected Work Preference", isFilled: Boolean(workPref), value: workPref || "Not selected yet", isAiAutofilled: false }
      ]
    },
    {
      id: "basicProfile",
      stepNum: 3,
      title: "Basic Profile",
      path: "/freelancer/onboarding/basicProfile",
      fields: [
        { id: "fullName", label: "Full Name", isFilled: Boolean(fullName), value: fullName || "Missing", isAiAutofilled: usedAiResume && (aiAutofilledIds.has("fullName") || Boolean(fullName)) },
        { id: "headline", label: "Professional Title / Headline", isFilled: Boolean(headline), value: headline || "Missing", isAiAutofilled: usedAiResume && (aiAutofilledIds.has("headline") || Boolean(headline)) },
        { id: "professionalBio", label: "Professional Bio / Summary", isFilled: Boolean(bio), value: bio ? (bio.length > 60 ? bio.slice(0, 60) + "..." : bio) : "Missing", isAiAutofilled: usedAiResume && (aiAutofilledIds.has("professionalBio") || aiAutofilledIds.has("bio") || Boolean(bio)) },
        { id: "country", label: "City / Location", isFilled: Boolean(city), value: city || "Missing", isAiAutofilled: usedAiResume && (aiAutofilledIds.has("country") || aiAutofilledIds.has("state") || Boolean(city)) },
        { id: "experience", label: "Experience Level", isFilled: Boolean(experience), value: experience || "Missing", isAiAutofilled: usedAiResume && aiAutofilledIds.has("experience") },
        { id: "hourlyRate", label: "Hourly Rate", isFilled: Boolean(hourlyRate), value: hourlyRate ? `₹${hourlyRate}/hr` : "Missing", isAiAutofilled: usedAiResume && aiAutofilledIds.has("hourlyRate") },
        { id: "skills", label: "Primary Skills", isFilled: Array.isArray(skills) && skills.length > 0, value: Array.isArray(skills) && skills.length > 0 ? `${skills.length} skills (${skills.slice(0, 3).join(", ")})` : "Missing", isAiAutofilled: usedAiResume && (aiAutofilledIds.has("skills") || (Array.isArray(skills) && skills.length > 0)) },
        { id: "resume", label: "CV / Resume Document", isFilled: Boolean(resume), value: resume ? "Uploaded Resume" : "Missing", isAiAutofilled: false },
      ]
    },
    {
      id: "services",
      stepNum: 4,
      title: "Services Selection",
      path: "/freelancer/onboarding/services",
      fields: [
        { id: "services", label: "Marketplace Services", isFilled: Array.isArray(services) && services.length > 0, value: Array.isArray(services) && services.length > 0 ? `${services.length} service(s): ${services.join(", ")}` : "No services selected", isAiAutofilled: usedAiResume && (aiAutofilledIds.has("services") || (Array.isArray(services) && services.length > 0)) }
      ]
    },
    {
      id: "quickInfo",
      stepNum: 5,
      title: "Service Setup & Quick Info",
      path: "/freelancer/onboarding/quickInfo",
      fields: [
        {
          id: "serviceTitle",
          label: "Service Specialization / Title",
          isFilled: hasServiceTitle || hasConfiguredServices,
          value: hasConfiguredServices
            ? `${serviceEntries.length} service(s) configured (${serviceEntries.map(s => s.title || s.key).slice(0, 3).join(", ")})`
            : fp?.serviceTitle || userData?.serviceTitle || "Missing",
          isAiAutofilled: usedAiResume && aiAutofilledIds.has("serviceTitle")
        },
        {
          id: "serviceDescription",
          label: "Service Overview & Scope",
          isFilled: hasServiceDesc,
          value: hasServiceDesc
            ? `${serviceEntries.filter(s => s.description || s.serviceDescription).length}/${serviceEntries.length || 1} services have scope overview`
            : fp?.serviceDescription ? (fp.serviceDescription.length > 40 ? fp.serviceDescription.slice(0, 40) + "..." : fp.serviceDescription) : "Missing",
          isAiAutofilled: usedAiResume && aiAutofilledIds.has("serviceDescription")
        },
        {
          id: "startingPrice",
          label: "Starting Price Rate",
          isFilled: hasServicePrice,
          value: hasServicePrice
            ? `${serviceEntries.filter(s => s.startingPrice || s.price).length}/${serviceEntries.length || 1} services priced`
            : (fp?.startingPrice || userData?.startingPrice) ? `₹${fp?.startingPrice || userData?.startingPrice}` : "Missing",
          isAiAutofilled: usedAiResume && aiAutofilledIds.has("startingPrice")
        },
        {
          id: "deliveryTimeline",
          label: "Delivery Timeline",
          isFilled: hasDeliveryTimeline,
          value: hasDeliveryTimeline
            ? `${serviceEntries.filter(s => s.deliveryTimeline).length}/${serviceEntries.length || 1} timelines set`
            : fp?.deliveryTimeline || userData?.deliveryTimeline || "Missing",
          isAiAutofilled: usedAiResume && aiAutofilledIds.has("deliveryTimeline")
        },
      ]
    },
    {
      id: "caseStudy",
      stepNum: 6,
      title: "Case Study & Portfolio",
      path: "/freelancer/onboarding/caseStudy",
      fields: [
        {
          id: "caseStudyTitle",
          label: "Case Study Title",
          isFilled: allCaseStudies.length > 0,
          value: allCaseStudies.length > 0
            ? `${allCaseStudies.length} case study project(s): ${allCaseStudies.map(c => c.title || c.name || "Untitled").filter(Boolean).slice(0, 2).join(", ")}`
            : "Missing",
          isAiAutofilled: usedAiResume && aiAutofilledIds.has("caseStudyTitle")
        },
        {
          id: "caseStudyOverview",
          label: "Case Study Overview",
          isFilled: allCaseStudies.some(c => Boolean(c.description || c.overview)),
          value: allCaseStudies.some(c => Boolean(c.description || c.overview)) ? "Overview provided" : "Missing",
          isAiAutofilled: usedAiResume && aiAutofilledIds.has("caseStudyOverview")
        },
        {
          id: "caseStudyMedia",
          label: "Case Study Media & Links",
          isFilled: allCaseStudies.some(c => Boolean(c.projectLink || c.link || c.media?.length || c.images?.length)),
          value: allCaseStudies.some(c => Boolean(c.projectLink || c.link || c.media?.length || c.images?.length)) ? "Assets/Links attached" : "Missing",
          isAiAutofilled: false
        },
      ]
    },
    {
      id: "acceptInProgressProjects",
      stepNum: 7,
      title: "Work Availability",
      path: "/freelancer/onboarding/acceptInProgressProjects",
      fields: [
        { id: "acceptInProgressProjects", label: "Accept In-Progress Projects", isFilled: typeof acceptInProgress === "boolean" || Boolean(acceptInProgress), value: acceptInProgress === true ? "Yes (Available for active work)" : acceptInProgress === false ? "No (Only new projects)" : "Not answered", isAiAutofilled: false }
      ]
    },
    {
      id: "deliveryPolicy",
      stepNum: 8,
      title: "Policies & Terms",
      path: "/freelancer/onboarding/deliveryPolicy",
      fields: [
        { id: "deliveryPolicy", label: "Delivery Terms & Policy", isFilled: Boolean(deliveryPolicy), value: deliveryPolicy ? "Accepted" : "Not accepted", isAiAutofilled: false },
        { id: "communicationPolicy", label: "Communication Guidelines", isFilled: Boolean(commPolicy), value: commPolicy ? "Accepted" : "Not accepted", isAiAutofilled: false },
      ]
    }
  ];

  const ONBOARDING_FLOW_STEPS = steps.map(s => ({ id: s.id, title: s.title, path: s.path }));
  const activeStepIndex = isComplete
    ? ONBOARDING_FLOW_STEPS.length
    : ONBOARDING_FLOW_STEPS.findIndex((s) => s.id === currentStep);

  let grandTotalFields = 0;
  let grandFilledFields = 0;
  steps.forEach((step) => {
    step.filledCount = step.fields.filter((f) => f.isFilled).length;
    step.totalCount = step.fields.length;
    grandTotalFields += step.totalCount;
    grandFilledFields += step.filledCount;
  });

  const grandPercentage = Math.round((grandFilledFields / Math.max(grandTotalFields, 1)) * 100);

  const toggleStep = (id) => {
    setExpandedSteps((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleAll = () => {
    const nextState = !expandAll;
    setExpandAll(nextState);
    const updated = {};
    steps.forEach((s) => { updated[s.id] = nextState; });
    setExpandedSteps(updated);
  };

  return (
    <div className="bg-card p-6 rounded-xl border shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Real-Time Onboarding Journey & Customer Behavior</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track drop-off stage, auto-saved progress, and field completion for each onboarding step
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {usedAiResume && (
            <Badge variant="outline" className="px-3 py-1 text-xs font-semibold border-purple-300 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 flex items-center gap-1.5">
              <Bot className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              AI Resume Used
            </Badge>
          )}
          <Badge
            variant="outline"
            className={`px-3 py-1 text-xs font-semibold ${
              isComplete
                ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
            }`}
          >
            {isComplete ? "Onboarding Completed" : `Backed Off at: ${currentStepTitle}`}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleAll}
            className="text-xs h-8 gap-1.5"
          >
            <ListChecks className="h-3.5 w-3.5 text-primary" />
            {expandAll ? "Collapse All Details" : "View Field Details"}
          </Button>
        </div>
      </div>

      {/* AI Resume Banner */}
      {usedAiResume && (
        <div className="p-3.5 rounded-lg border border-purple-200 bg-purple-50/50 dark:bg-purple-950/20 text-xs space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 mt-0.5 sm:mt-0">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                  AI Resume Autofill Feature Used
                </p>
                <p className="text-[11px] text-purple-700 dark:text-purple-300 mt-0.5">
                  The freelancer uploaded their CV/Resume to automatically populate basic profile & service options using AI extraction.
                  {aiResumeDetails?.fileName ? ` File: ${aiResumeDetails.fileName}` : ""}
                  {aiResumeDetails?.totalAppliedCount ? ` • ${aiResumeDetails.totalAppliedCount} fields auto-filled` : ""}
                </p>
              </div>
            </div>
            {aiResumeDetails?.timestamp && (
              <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 whitespace-nowrap">
                Parsed: {new Date(aiResumeDetails.timestamp).toLocaleDateString("en-IN")}
              </span>
            )}
          </div>

          {/* AI Autofilled field pills */}
          {aiAutofilledLabels.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-purple-200/60 dark:border-purple-900/40">
              <span className="text-[10px] font-semibold text-purple-900 dark:text-purple-200">Autofilled Fields:</span>
              {aiAutofilledLabels.map((lbl, lIdx) => (
                <Badge key={lIdx} variant="secondary" className="text-[9px] px-2 py-0.5 bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border-purple-200">
                  ✨ {lbl}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Progress & Stat Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-muted/30 p-3.5 rounded-lg border">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Overall Completion</p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-xl font-bold text-foreground font-mono">{percentage}%</p>
            <span className="text-[11px] text-muted-foreground">Step {Math.min(activeStepIndex + 1, 8)} of 8</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mt-2">
            <div
              className={`h-full transition-all duration-500 ${isComplete ? "bg-emerald-500" : percentage > 50 ? "bg-blue-500" : "bg-amber-500"}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        <div className="bg-muted/30 p-3.5 rounded-lg border">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Form Fields Completed</p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-xl font-bold text-foreground font-mono">{grandFilledFields} <span className="text-xs font-normal text-muted-foreground">/ {grandTotalFields} fields</span></p>
            <span className="text-[11px] font-semibold text-primary font-mono">{grandPercentage}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mt-2">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${grandPercentage}%` }}
            />
          </div>
        </div>

        <div className="bg-muted/30 p-3.5 rounded-lg border">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Drop-off Stage</p>
          <p className="text-sm font-semibold text-foreground truncate mt-1">
            {isComplete ? "Fully Completed" : currentStepTitle}
          </p>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium truncate mt-1">
            {isComplete ? "No drop-off detected" : `User stopped at step ${activeStepIndex + 1}`}
          </p>
        </div>

        <div className="bg-muted/30 p-3.5 rounded-lg border">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">AI Resume Status</p>
          <p className="text-sm font-semibold text-foreground mt-1 flex items-center gap-1.5">
            {usedAiResume ? (
              <span className="text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1">
                <Bot className="h-3.5 w-3.5" /> AI Autofill Used
              </span>
            ) : (
              <span className="text-muted-foreground">Manual Entry</span>
            )}
          </p>
          {lastActive && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Active: {new Date(lastActive).toLocaleDateString("en-IN")}
            </p>
          )}
        </div>
      </div>

      {/* 8-Stage Timeline Grid with Field Breakdown */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Stage-by-Stage Onboarding Breakdown & Auto-Save Telemetry
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, idx) => {
            const isPassed = isComplete || (activeStepIndex >= 0 && idx < activeStepIndex);
            const isCurrent = !isComplete && (activeStepIndex === idx || (activeStepIndex === -1 && idx === 0));
            const isOpen = expandedSteps[step.id] || expandAll;
            const stepPercentage = Math.round((step.filledCount / step.totalCount) * 100);

            return (
              <div
                key={step.id}
                className={`p-3.5 rounded-lg border text-xs transition-all flex flex-col justify-between ${
                  isCurrent
                    ? "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20 ring-1 ring-amber-400"
                    : isPassed
                      ? "border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/10"
                      : "border-muted bg-muted/20 opacity-80"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="font-mono text-[10px] font-bold text-muted-foreground">Step {idx + 1}</span>
                    {isPassed ? (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-emerald-300 text-emerald-600 bg-emerald-50">
                        Passed
                      </Badge>
                    ) : isCurrent ? (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-400 text-amber-700 bg-amber-50 font-bold animate-pulse">
                        Backed Off Here
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-muted-foreground">
                        Pending
                      </Badge>
                    )}
                  </div>

                  <p className="font-semibold text-foreground truncate">{step.title}</p>
                  <p className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">{step.path}</p>

                  {/* Form Field Count & Completion Bar */}
                  <div className="mt-2.5 pt-2 border-t border-muted/60 space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-muted-foreground">Fields Filled:</span>
                      <span className={`font-mono font-bold ${step.filledCount === step.totalCount ? "text-emerald-600" : step.filledCount > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                        {step.filledCount}/{step.totalCount} ({stepPercentage}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full transition-all ${step.filledCount === step.totalCount ? "bg-emerald-500" : "bg-amber-500"}`}
                        style={{ width: `${stepPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Toggle details button */}
                <div className="mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleStep(step.id)}
                    className="w-full text-[11px] h-7 justify-between px-2 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  >
                    <span>{isOpen ? "Hide Form Fields" : "View Form Fields"}</span>
                    {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </Button>

                      {isOpen && (
                        <div className="mt-2 space-y-1.5 pt-2 border-t text-[11px]">
                          {step.fields.map((f, fIdx) => (
                            <div key={fIdx} className="p-1.5 rounded bg-card border flex items-start justify-between gap-1.5">
                              <div className="flex items-start gap-1.5 min-w-0 flex-1">
                                {f.isFilled ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                ) : (
                                  <X className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-foreground truncate">{f.label}</p>
                                  <p className={`text-[10px] truncate ${f.isFilled ? "text-muted-foreground font-mono" : "text-amber-600 italic"}`}>
                                    {f.value}
                                  </p>
                                </div>
                              </div>
                              {f.isFilled && f.isAiAutofilled && (
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 border-purple-300 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 font-medium flex items-center gap-1 shrink-0 mt-0.5">
                                  <Bot className="h-2.5 w-2.5" /> AI Filled
                                </Badge>
                              )}
                            </div>
                          ))}

                          {/* Per-service breakdown for Step 5 */}
                          {step.id === "quickInfo" && serviceEntries.length > 0 && (
                            <div className="mt-2 pt-2 border-t space-y-1.5">
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Per-Service Setup:</p>
                              {serviceEntries.map((srv, sIdx) => (
                                <div key={sIdx} className="p-1.5 rounded bg-muted/40 border text-[10px] space-y-0.5">
                                  <div className="flex items-center justify-between font-bold text-foreground">
                                    <span className="capitalize">{srv.title || srv.key.replace(/_/g, " ")}</span>
                                    {srv.startingPrice && <span className="text-emerald-600 font-mono">₹{srv.startingPrice}</span>}
                                  </div>
                                  {srv.description && <p className="text-muted-foreground line-clamp-2 italic">{srv.description}</p>}
                                  {srv.deliveryTimeline && <p className="text-muted-foreground font-mono">Timeline: {srv.deliveryTimeline}</p>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const AdminUserDetails = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/admin/users/${userId}`);
      const result = await res.json();
      if (result?.data) {
        setData(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch user details:", err);
      setError("Failed to load user details");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${(amount || 0).toLocaleString("en-IN")}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const parseBio = (bio) => {
    if (!bio) return null;
    try {
      const parsed = JSON.parse(bio);
      return isPlainObject(parsed) ? parsed : { bio };
    } catch {
      return { bio };
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
     return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </AdminLayout>
    );
  }

  if (!data) return null;

  const bioData = parseBio(data.user.bio);
  const profileDetails = isPlainObject(data.user.profileDetails) ? data.user.profileDetails : {};
  const identity = isPlainObject(profileDetails.identity) ? profileDetails.identity : {};
  const availability = isPlainObject(profileDetails.availability) ? profileDetails.availability : {};
  const reliability = isPlainObject(profileDetails.reliability) ? profileDetails.reliability : {};
  const isFreelancer = data.user.role === "FREELANCER";
  const headline =
    data.user.professionalTitle ||
    bioData?.headline ||
    identity.professionalTitle ||
    null;
  const phone = data.user.phone || data.user.phoneNumber || bioData?.phone || null;
  const location =
    data.user.location ||
    bioData?.location ||
    [identity.city, identity.country].filter(Boolean).join(", ");
  const services = Array.isArray(data.user.services)
    ? data.user.services
    : Array.isArray(profileDetails.services)
      ? profileDetails.services
      : Array.isArray(bioData?.services)
        ? bioData.services
        : [];
  const skills = Array.isArray(data.user.skills)
    ? data.user.skills
    : Array.isArray(profileDetails.skills)
      ? profileDetails.skills
      : [];
  const portfolioProjects = Array.isArray(data.user.portfolioProjects)
    ? data.user.portfolioProjects
    : Array.isArray(profileDetails.portfolioProjects)
      ? profileDetails.portfolioProjects
      : [];
  const workExperience = Array.isArray(profileDetails.workExperience)
    ? profileDetails.workExperience
    : Array.isArray(bioData?.workExperience)
      ? bioData.workExperience
      : [];
  const education = Array.isArray(profileDetails.education) ? profileDetails.education : [];
  const serviceDetails = isPlainObject(data.user.serviceDetails)
    ? data.user.serviceDetails
    : isPlainObject(profileDetails.serviceDetails)
      ? profileDetails.serviceDetails
      : {};
  const portfolioLink = data.user.portfolio || identity.portfolioUrl || bioData?.portfolioUrl || null;
  const linkedinLink = data.user.linkedin || identity.linkedinUrl || bioData?.linkedinUrl || null;
  const githubLink = data.user.github || identity.githubUrl || bioData?.githubUrl || null;
  const aboutText =
    profileDetails.professionalBio ||
    data.user.bio ||
    bioData?.bio ||
    null;
  const detailSections = Object.entries(serviceDetails).filter(([, detail]) => isPlainObject(detail));
  const stats = data.stats || {};
  const projects = data.projects || [];
  const proposals = data.proposals || [];
  const isClient = data.user.role === "CLIENT";
  const hasSidebarContent = 
    Boolean(portfolioLink || linkedinLink || githubLink) ||
    Boolean(isFreelancer && (availability.hoursPerWeek || availability.startTimeline || availability.workingSchedule || typeof profileDetails.acceptInProgressProjects === "boolean")) ||
    Boolean(isFreelancer && (reliability.delayHandling || reliability.missedDeadlines)) ||
    Boolean(isFreelancer && education.length > 0);

  return (
    <AdminLayout>
      <div className="relative flex flex-col gap-6 p-6">
        <AdminTopBar label="User Details" />
        
        {/* Back button and Header Card */}
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 pl-0 hover:pl-2 transition-all">
              <ArrowLeft className="h-4 w-4" /> Back to Users
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                <User className="h-10 w-10 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-1.5">
                  <h1 className="text-2xl font-bold tracking-tight">{data.user.fullName}</h1>
                  <Badge variant={data.user.role === "CLIENT" ? "default" : "secondary"} className="uppercase font-semibold tracking-wider text-[10px] px-2 py-0.5">
                    {data.user.role}
                  </Badge>
                  <Badge variant={data.user.status === "ACTIVE" ? "outline" : "destructive"} className="text-[10px] px-2 py-0.5">
                    {data.user.status}
                  </Badge>
                </div>
                
                {headline && (
                  <p className="text-muted-foreground text-sm font-medium mb-2">{headline}</p>
                )}
                
                <div className="flex items-center gap-x-4 gap-y-1 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {data.user.email}
                  </span>
                  {phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {phone}
                    </span>
                  )}
                  {location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Joined {formatDate(data.user.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Section */}
        {Object.keys(stats).length > 0 && (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
            {isClient ? (
              <>
                <div className="bg-card p-4 rounded-xl border shadow-sm">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Projects</p>
                  <p className="text-xl font-bold flex items-center gap-1.5 text-card-foreground">
                    <Briefcase className="h-4.5 w-4.5 text-primary" />
                    {stats.totalProjects ?? 0}
                  </p>
                </div>
                <div className="bg-card p-4 rounded-xl border shadow-sm">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Active Projects</p>
                  <p className="text-xl font-bold flex items-center gap-1.5 text-amber-500">
                    <FolderOpen className="h-4.5 w-4.5" />
                    {stats.activeProjects ?? 0}
                  </p>
                </div>
                <div className="bg-card p-4 rounded-xl border shadow-sm">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Completed Projects</p>
                  <p className="text-xl font-bold flex items-center gap-1.5 text-green-500">
                    <CheckCircle className="h-4.5 w-4.5" />
                    {stats.completedProjects ?? 0}
                  </p>
                </div>
                <div className="bg-card p-4 rounded-xl border shadow-sm">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Budget Spent</p>
                  <p className="text-xl font-bold flex items-center gap-1.5 text-card-foreground">
                    <IndianRupee className="h-4.5 w-4.5 text-primary" />
                    {formatCurrency(stats.totalSpent ?? 0)}
                  </p>
                </div>
                <div className="bg-card p-4 rounded-xl border shadow-sm col-span-2 md:col-span-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Remaining Budget</p>
                  <p className="text-xl font-bold flex items-center gap-1.5 text-card-foreground">
                    <IndianRupee className="h-4.5 w-4.5 text-primary" />
                    {formatCurrency(stats.moneyRemaining ?? 0)}
                  </p>
                </div>
              </>
            ) : isFreelancer ? (
              <>
                <div className="bg-card p-4 rounded-xl border shadow-sm">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Proposals</p>
                  <p className="text-xl font-bold flex items-center gap-1.5 text-card-foreground">
                    <FileText className="h-4.5 w-4.5 text-primary" />
                    {stats.totalProposals ?? 0}
                  </p>
                </div>
                <div className="bg-card p-4 rounded-xl border shadow-sm">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Accepted Proposals</p>
                  <p className="text-xl font-bold flex items-center gap-1.5 text-green-500">
                    <CheckCircle className="h-4.5 w-4.5" />
                    {stats.acceptedProposals ?? 0}
                  </p>
                </div>
                <div className="bg-card p-4 rounded-xl border shadow-sm">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Active Projects</p>
                  <p className="text-xl font-bold flex items-center gap-1.5 text-amber-500">
                    <FolderOpen className="h-4.5 w-4.5" />
                    {stats.activeProjects ?? 0}
                  </p>
                </div>
                <div className="bg-card p-4 rounded-xl border shadow-sm">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Earnings</p>
                  <p className="text-xl font-bold flex items-center gap-1.5 text-card-foreground">
                    <IndianRupee className="h-4.5 w-4.5 text-primary" />
                    {formatCurrency(stats.totalEarnings ?? 0)}
                  </p>
                </div>
                <div className="bg-card p-4 rounded-xl border shadow-sm col-span-2 md:col-span-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Pending Amount</p>
                  <p className="text-xl font-bold flex items-center gap-1.5 text-card-foreground">
                    <IndianRupee className="h-4.5 w-4.5 text-primary" />
                    {formatCurrency(stats.pendingAmount ?? 0)}
                  </p>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* Real-Time Freelancer Onboarding & Customer Behavior Analytics Card */}
        {isFreelancer && <FreelancerOnboardingTrackingCard userData={data?.user} />}

        {/* Main Content Area */}
        <div className={hasSidebarContent ? "grid gap-6 lg:grid-cols-3" : "space-y-6"}>
          {/* Left Column (Main Info) */}
          <div className={hasSidebarContent ? "lg:col-span-2 space-y-6" : "space-y-6"}>
            {/* Client's Projects */}
            {isClient && projects.length > 0 && (
              <div className="bg-card p-6 rounded-xl border shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Projects Owned</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b text-muted-foreground font-medium">
                        <th className="py-2.5">Project Title</th>
                        <th className="py-2.5">Status</th>
                        <th className="py-2.5">Budget</th>
                        <th className="py-2.5">Spent</th>
                        <th className="py-2.5">Proposals</th>
                        <th className="py-2.5">Created At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {projects.map((project) => (
                        <tr 
                          key={project.id} 
                          className="hover:bg-muted/30 cursor-pointer transition-colors"
                          onClick={() => navigate(`/admin/projects/${project.id}`)}
                        >
                          <td className="py-3 font-medium text-primary hover:underline max-w-[200px] truncate">{project.title}</td>
                          <td className="py-3">
                            <Badge variant={project.status === "COMPLETED" ? "outline" : project.status === "IN_PROGRESS" ? "secondary" : "default"} className="text-[10px] px-2 py-0.5">
                              {project.status}
                            </Badge>
                          </td>
                          <td className="py-3">{formatCurrency(project.budget)}</td>
                          <td className="py-3 text-muted-foreground">{formatCurrency(project.spent)}</td>
                          <td className="py-3 text-center">{project.proposals?.length ?? 0}</td>
                          <td className="py-3 text-muted-foreground text-xs">{formatDate(project.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Freelancer's Proposals */}
            {isFreelancer && proposals.length > 0 && (
              <div className="bg-card p-6 rounded-xl border shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Proposals Submitted</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b text-muted-foreground font-medium">
                        <th className="py-2.5">Project Title</th>
                        <th className="py-2.5">Proposal Status</th>
                        <th className="py-2.5">Amount</th>
                        <th className="py-2.5">Project Budget</th>
                        <th className="py-2.5">Project Status</th>
                        <th className="py-2.5">Date Submitted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {proposals.map((proposal) => (
                        <tr 
                          key={proposal.id} 
                          className="hover:bg-muted/30 cursor-pointer transition-colors"
                          onClick={() => navigate(`/admin/projects/${proposal.project?.id}`)}
                        >
                          <td className="py-3 font-medium text-primary hover:underline max-w-[200px] truncate">
                            {proposal.project?.title || "Unknown Project"}
                          </td>
                          <td className="py-3">
                            <Badge variant={proposal.status === "ACCEPTED" ? "outline" : proposal.status === "PENDING" ? "secondary" : "destructive"} className="text-[10px] px-2 py-0.5">
                              {proposal.status}
                            </Badge>
                          </td>
                          <td className="py-3 font-medium">{formatCurrency(proposal.amount)}</td>
                          <td className="py-3 text-muted-foreground">{formatCurrency(proposal.project?.budget ?? 0)}</td>
                          <td className="py-3">
                            <Badge variant="ghost" className="text-[10px] px-2 py-0.5 uppercase">
                              {proposal.project?.status || "-"}
                            </Badge>
                          </td>
                          <td className="py-3 text-muted-foreground text-xs">{formatDate(proposal.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Services */}
            {services.length > 0 && (
              <div className="bg-card p-6 rounded-xl border shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Wrench className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Services Offered</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {services.map((service, idx) => (
                    <Badge key={idx} variant="secondary" className="font-normal px-2.5 py-1">
                      {toDisplayLabel(service)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {isFreelancer && skills.length > 0 && (
              <div className="bg-card p-6 rounded-xl border shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Skills & Technologies</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, idx) => (
                    <Badge key={idx} variant="outline" className="text-sm px-3 py-1">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Work Experience */}
            {isFreelancer && workExperience.length > 0 && (
              <div className="bg-card p-6 rounded-xl border shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Work Experience</h2>
                </div>
                <div className="space-y-4">
                  {workExperience.map((exp, idx) => (
                    <div key={idx} className="border-l-2 border-primary/20 pl-4 py-1 relative">
                      <div className="absolute -left-[5px] top-2.5 h-2 w-2 rounded-full bg-primary" />
                      <div className="flex justify-between items-start mb-1 flex-wrap gap-2">
                        <div>
                          <span className="font-semibold text-base">{exp.title || exp.role || 'Experience'}</span>
                          {exp.company && (
                            <span className="text-muted-foreground block text-sm">{exp.company}</span>
                          )}
                        </div>
                        {exp.period && (
                          <Badge variant="secondary" className="text-xs">{exp.period}</Badge>
                        )}
                      </div>
                      {exp.description && (
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Featured Projects */}
            {isFreelancer && portfolioProjects.length > 0 && (
              <div className="bg-card p-6 rounded-xl border shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Featured Projects</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {portfolioProjects.map((project, idx) => (
                    <div key={idx} className="group relative rounded-xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all">
                      <a 
                        href={project.link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="block aspect-video w-full bg-muted/50 relative group-hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        {project.image ? (
                          <img src={project.image} alt="Preview" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm bg-secondary/30 text-muted-foreground">No Image Preview</div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px]">
                          <div className="bg-background/90 text-foreground px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium transform translate-y-2 group-hover:translate-y-0 transition-transform">
                            <ExternalLink className="w-4 h-4" />
                            Visit Site
                          </div>
                        </div>
                      </a>
                      <div className="p-4 border-t">
                        <a href={project.link} target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-primary transition-colors truncate block text-base mb-1">
                          {project.title || project.link.replace(/^https?:\/\//, '')}
                        </a>
                        <p className="text-xs text-muted-foreground truncate">{project.link}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Service Details */}
            {isFreelancer && detailSections.length > 0 && (
              <div className="bg-card p-6 rounded-xl border shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Service Details</h2>
                <div className="space-y-6">
                  {detailSections.map(([serviceKey, detail]) => {
                    const title = pickFirstValue(detail.title, detail.serviceTitle);
                    const description = pickFirstValue(
                      detail.serviceDescription,
                      detail.description
                    );
                    const delivery = pickFirstValue(detail.deliveryTime, detail.deliveryTimeline);
                    const experience = pickFirstValue(detail.experienceYears, detail.experience);
                    const price = pickFirstValue(
                      detail.averageProjectPrice,
                      detail.averagePrice,
                      detail.priceRange
                    );
                    const skills = normalizeSkills(detail);
                    const subcategories = normalizeSubcategories(detail);
                    const caseStudies = normalizeCaseStudies(detail);
                    const mediaEntries = normalizeMediaEntries(detail);
                    const additionalEntries = getAdditionalDetailEntries(detail);

                    return (
                      <div key={serviceKey} className="rounded-xl border p-6 bg-card hover:bg-muted/5 transition-colors duration-200">
                        {/* Title and Top Chips */}
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 mb-4">
                          <div>
                            <h3 className="font-bold text-base text-foreground">{toDisplayLabel(serviceKey)}</h3>
                            {title ? (
                              <p className="text-xs text-muted-foreground mt-0.5">{title}</p>
                            ) : null}
                          </div>
                          
                          <div className="flex flex-wrap gap-2 text-xs">
                            {delivery && (
                              <span className="inline-flex items-center gap-1 bg-primary/5 text-primary border border-primary/10 rounded-full px-2.5 py-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {delivery}
                              </span>
                            )}
                            {experience && (
                              <span className="inline-flex items-center gap-1 bg-green-500/5 text-green-600 border border-green-500/10 rounded-full px-2.5 py-1 dark:text-green-400">
                                <Award className="h-3.5 w-3.5" />
                                {experience}
                              </span>
                            )}
                            {price && (
                              <span className="inline-flex items-center gap-1 bg-amber-500/5 text-amber-600 border border-amber-500/10 rounded-full px-2.5 py-1 dark:text-amber-400">
                                <IndianRupee className="h-3.5 w-3.5" />
                                {price}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Details Content Grid */}
                        <div className="grid gap-6 md:grid-cols-3">
                          {/* Left / Center Info */}
                          <div className="md:col-span-2 space-y-4">
                            {description ? (
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Description</p>
                                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{description}</p>
                              </div>
                            ) : null}

                            {skills.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Skills & Tech Stack</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {skills.map((skill) => (
                                    <Badge key={skill} variant="outline" className="text-xs bg-muted/20">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {subcategories.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Subcategories</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {subcategories.map((entry, index) => (
                                    <Badge key={`${entry}-${index}`} variant="secondary" className="text-xs">
                                      {entry}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {additionalEntries.length > 0 && (
                              <details className="rounded-lg border bg-muted/5 p-3 group transition-all">
                                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-muted-foreground group-open:mb-3">
                                  Additional Metadata
                                </summary>
                                <div className="mt-2 text-xs">
                                  {renderKeyValuePairs(Object.fromEntries(additionalEntries))}
                                </div>
                              </details>
                            )}
                          </div>

                          {/* Right Panel: Media & Case Studies */}
                          <div className="space-y-4">
                            {/* Media Files */}
                            {mediaEntries.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Media & Attachments</p>
                                <div className="grid gap-2">
                                  {mediaEntries.map((entry, index) => (
                                    <a
                                      key={`${entry.url}-${index}`}
                                      href={entry.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-3 rounded-lg border bg-card p-2 hover:bg-muted/40 transition text-card-foreground group"
                                    >
                                      <div className="h-10 w-10 rounded-md bg-muted overflow-hidden shrink-0 border">
                                        <img src={entry.url} alt={entry.name || "Media"} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">{entry.name || "Media"}</p>
                                        <p className="text-[10px] text-muted-foreground truncate">{entry.mimeType || entry.url}</p>
                                      </div>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Case Studies */}
                            {caseStudies.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Case Studies</p>
                                <div className="space-y-3">
                                  {caseStudies.map((entry, index) => (
                                    <div key={`${entry.title || "case"}-${index}`} className="rounded-xl border bg-muted/5 p-4 space-y-2">
                                      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                                        <h4 className="text-xs font-bold text-foreground">{entry.title || "Case Study"}</h4>
                                        {entry.timeline && (
                                          <Badge variant="outline" className="text-[10px] py-0">{entry.timeline}</Badge>
                                        )}
                                      </div>
                                      {entry.description && (
                                        <p className="text-xs text-muted-foreground leading-relaxed">{entry.description}</p>
                                      )}
                                      <div className="grid gap-1 text-[10px] text-muted-foreground">
                                        {entry.role && <div><span className="font-medium text-foreground">Role:</span> {entry.role}</div>}
                                        {entry.niche && <div><span className="font-medium text-foreground">Niche:</span> {entry.niche}</div>}
                                        {entry.budget && <div><span className="font-medium text-foreground">Budget:</span> {entry.budget}</div>}
                                      </div>
                                      {entry.link && (
                                        <a href={entry.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1 pt-1">
                                          View project <ExternalLink className="h-3 w-3" />
                                        </a>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Bio Text / About */}
            {typeof aboutText === 'string' && aboutText.length > 5 && (
              <div className="bg-card p-6 rounded-xl border shadow-sm">
                <h2 className="text-lg font-semibold mb-4">About</h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{aboutText}</p>
              </div>
            )}
          </div>

          {/* Right Column (Side Panels) */}
          {hasSidebarContent && (
            <div className="space-y-6">
            {/* Links Section */}
            {(portfolioLink || linkedinLink || githubLink) && (
              <div className="bg-card p-6 rounded-xl border shadow-sm">
                <h2 className="text-lg font-semibold mb-4">External Links</h2>
                <div className="space-y-3">
                  {portfolioLink && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/5">
                      <div className="p-2 rounded-full bg-blue-500/10 shrink-0">
                        <ExternalLink className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Portfolio / Website</p>
                        <a 
                          href={portfolioLink.startsWith('http') ? portfolioLink : `https://${portfolioLink}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-medium hover:text-primary transition-colors truncate block"
                        >
                          {portfolioLink}
                        </a>
                      </div>
                    </div>
                  )}
                  {linkedinLink && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/5">
                      <div className="p-2 rounded-full bg-blue-600/10 shrink-0">
                        <ExternalLink className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">LinkedIn</p>
                        <a 
                          href={linkedinLink.startsWith('http') ? linkedinLink : `https://${linkedinLink}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-medium hover:text-primary transition-colors truncate block"
                        >
                          {linkedinLink}
                        </a>
                      </div>
                    </div>
                  )}
                  {githubLink && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/5">
                      <div className="p-2 rounded-full bg-gray-500/10 shrink-0">
                        <ExternalLink className="h-4 w-4 text-gray-700" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">GitHub</p>
                        <a 
                          href={githubLink.startsWith('http') ? githubLink : `https://${githubLink}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-medium hover:text-primary transition-colors truncate block"
                        >
                          {githubLink}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Availability */}
            {isFreelancer && (availability.hoursPerWeek || availability.startTimeline || availability.workingSchedule || typeof profileDetails.acceptInProgressProjects === "boolean") && (
              <div className="bg-card p-6 rounded-xl border shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Availability & Preferences</h2>
                <div className="space-y-4">
                  {availability.hoursPerWeek && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Hours Per Week</p>
                      <p className="mt-1 font-medium text-sm">{availability.hoursPerWeek}</p>
                    </div>
                  )}
                  {availability.startTimeline && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Start Timeline</p>
                      <p className="mt-1 font-medium text-sm">{availability.startTimeline}</p>
                    </div>
                  )}
                  {availability.workingSchedule && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Working Schedule</p>
                      <p className="mt-1 font-medium text-sm">{availability.workingSchedule}</p>
                    </div>
                  )}
                  {typeof profileDetails.acceptInProgressProjects === "boolean" && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Accepts In-Progress Projects</p>
                      <p className="mt-1 font-medium text-sm">{profileDetails.acceptInProgressProjects ? "Yes" : "No"}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reliability */}
            {isFreelancer && (reliability.delayHandling || reliability.missedDeadlines) && (
              <div className="bg-card p-6 rounded-xl border shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Reliability</h2>
                <div className="space-y-4">
                  {reliability.delayHandling && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Delay Handling</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{reliability.delayHandling}</p>
                    </div>
                  )}
                  {reliability.missedDeadlines && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Missed Deadlines</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{reliability.missedDeadlines}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Education */}
            {isFreelancer && education.length > 0 && (
              <div className="bg-card p-6 rounded-xl border shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Education</h2>
                <div className="space-y-4">
                  {education.map((entry, idx) => (
                    <div key={idx} className="border-l-2 border-muted pl-3 py-0.5">
                      <p className="font-semibold text-sm">
                        {entry?.degree || entry?.course || entry?.qualification || "Education"}
                      </p>
                      {(entry?.institution || entry?.school || entry?.college) && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {entry.institution || entry.school || entry.college}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUserDetails;
