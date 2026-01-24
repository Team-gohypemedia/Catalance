import { useState, useMemo } from "react";
import React from "react";
import X from "lucide-react/dist/esm/icons/x";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import DollarSign from "lucide-react/dist/esm/icons/dollar-sign";
import Layers from "lucide-react/dist/esm/icons/layers";
import ListChecks from "lucide-react/dist/esm/icons/list-checks";
import Cpu from "lucide-react/dist/esm/icons/cpu";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Check from "lucide-react/dist/esm/icons/check";

import { cn } from "@/shared/lib/utils";

// --- Parser to extract structured data from markdown ---
const parseProposalContent = (markdown) => {
  if (!markdown) return null;

  const lines = markdown.split("\n");
  const extracted = {};
  let currentKey = null;

  // Normalize key - remove colons, asterisks, and trim
  const normalizeKey = (key) => key.toLowerCase().trim().replace(/:$/, "").replace(/\*+/g, "").trim();

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (trimmed.startsWith("#")) return;

    // Handle various markdown patterns: **Key:** Value, Key: Value, **Key**: **Value**
    const keyValMatch = trimmed.match(/^\*{0,2}([^:*]+?)\*{0,2}:\s*\*{0,2}(.*?)\*{0,2}$/);
    const isListItem = trimmed.startsWith("- ") || trimmed.startsWith("* ");

    if (keyValMatch && !isListItem) {
      const key = normalizeKey(keyValMatch[1]);
      const value = keyValMatch[2].trim().replace(/\*+/g, "");
      extracted[key] = { value, items: [] };
      currentKey = key;
    } else if (isListItem && currentKey) {
      extracted[currentKey].items.push(trimmed.replace(/^[-*]\s+/, ""));
    } else if (currentKey && trimmed) {
      if (!extracted[currentKey].value) {
        extracted[currentKey].value = trimmed;
      } else {
        extracted[currentKey].value += " " + trimmed;
      }
    }
  });

  // Debug: log extracted keys
  console.log("[Proposal Parser] Extracted keys:", Object.keys(extracted));

  return extracted;
};

// Map raw keys to structured data
const mapToProposalData = (extracted) => {
  if (!extracted) return null;

  const get = (keys) => {
    for (const k of keys) {
      if (extracted[k]?.value) return extracted[k].value;
    }
    return "";
  };

  const getItems = (keys) => {
    for (const k of keys) {
      if (extracted[k]?.items?.length) return extracted[k].items;
    }
    return [];
  };

  const projectType = get(["website type", "project type", "type", "creative type", "app type"]);
  const designStyle = get(["design style", "design experience", "design"]);
  const scopeItems = getItems(["primary objectives", "objectives", "scope"]);
  const scopeValue = scopeItems.length > 0
    ? scopeItems.join("\n")
    : get(["primary objectives", "objectives", "scope"]);
  const scopeLines = scopeValue
    ? scopeValue
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
    : [];
  const scopeExtras = [projectType, designStyle].filter(Boolean);
  const scopeLookup = new Set(scopeLines.map((line) => line.toLowerCase()));
  scopeExtras.forEach((item) => {
    const key = item.toLowerCase();
    if (!scopeLookup.has(key)) {
      scopeLookup.add(key);
      scopeLines.push(item);
    }
  });
  const scopeObjectives = scopeLines.join("\n");

  return {
    clientName: get(["client name", "name"]),
    businessName: get(["business name", "company name", "company"]),
    serviceType: get(["service type", "service"]) || "Project",
    projectType,
    overview: get(["project overview", "overview", "description", "website requirement", "requirement"]),
    scopeObjectives,
    features: getItems(["features included", "features/deliverables included", "deliverables", "features", "app features", "brand deliverables"]),
    techstack: [
      get(["website build type", "build type"]),
      get(["frontend framework", "frontend"]),
      get(["backend technology", "backend"]),
      get(["database"]),
      get(["hosting"]),
      get(["platform requirements", "platform"]),
    ].filter(t => t && !t.toLowerCase().includes("to be finalized")),
    timeline: get(["launch timeline", "timeline", "duration"]),
    budget: get(["budget"]),
    designStyle,
    volume: get(["volume"]),
    engagement: get(["engagement model", "engagement"]),
  };
};

// --- Accordion Component ---
const AccordionSection = ({ icon: Icon, title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-zinc-700/50 rounded-xl overflow-hidden bg-zinc-800/30 backdrop-blur-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-slate-200 text-sm">{title}</span>
        </div>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-slate-400 transition-transform duration-300",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="p-4 pt-0 border-t border-zinc-700/50">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Feature List with Custom Bullets ---
const FeatureList = ({ items }) => {
  if (!items?.length) {
    return <p className="text-slate-400 text-sm">No deliverables specified</p>;
  }

  return (
    <ul className="space-y-2 mt-3">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-3">
          <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
          <span className="text-slate-300 text-sm leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
};

// --- Tech List (Bullet Points) ---
const TechTags = ({ items }) => {
  if (!items?.length) {
    return <p className="text-slate-400 text-sm">Tech stack to be determined</p>;
  }

  return (
    <ul className="space-y-2 mt-3">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-3">
          <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
          <span className="text-slate-300 text-sm leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
};

// --- Main Proposal Card ---
const ProposalCard = ({ data }) => {
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-6">
        <div className="h-14 w-14 rounded-full bg-zinc-800 flex items-center justify-center mb-4 border border-zinc-700">
          <FileText className="w-7 h-7 text-slate-500" />
        </div>
        <p className="text-slate-400 text-sm">
          Your proposal will appear here once generated.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="rounded-2xl overflow-hidden bg-zinc-900/80 border border-zinc-800">
        {/* Client & Business Row */}
        <div className="grid grid-cols-2 divide-x divide-zinc-800">
          <div className="p-5">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium mb-2">Client</p>
            <h2 className="text-lg font-bold text-white truncate">{data.clientName || "—"}</h2>
          </div>
          <div className="p-5">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium mb-2">Business</p>
            <h2 className="text-lg font-bold text-white truncate">{data.businessName || "—"}</h2>
          </div>
        </div>

        {/* Service Row */}
        <div className="border-t border-zinc-800 p-5 bg-zinc-900/50">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium mb-2">Service</p>
          <h3 className="text-base font-semibold text-primary">{data.serviceType}</h3>
        </div>
      </div>

      {/* Project Type Badge & Overview */}
      <div className="space-y-4">
        {data.projectType && (
          <div className="hidden">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary text-sm font-medium">
              <Briefcase className="w-4 h-4" />
              {data.projectType}
            </span>
            {data.designStyle && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-700/50 border border-zinc-600/50 text-slate-300 text-xs">
                {data.designStyle}
              </span>
            )}
          </div>
        )}

        {data.overview && (
          <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/50">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Project Overview</p>
            <p className="text-slate-300 text-sm leading-relaxed">{data.overview}</p>
          </div>
        )}
      </div>

      {/* Accordion Sections */}
      <div className="space-y-3">
        {data.scopeObjectives && (
          <AccordionSection icon={Layers} title="Scope & Objectives" defaultOpen={true}>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line mt-3">
              {data.scopeObjectives}
            </p>
          </AccordionSection>
        )}

        <AccordionSection icon={ListChecks} title="Features & Deliverables" defaultOpen={true}>
          <FeatureList items={data.features} />
        </AccordionSection>

        <AccordionSection icon={Cpu} title="Platform & Techstack">
          <TechTags items={data.techstack} />
        </AccordionSection>
      </div>

      {/* Footer Grid - Timeline & Budget */}
      <div className="grid grid-cols-2 gap-3">
        <div className="group bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/50 hover:bg-slate-700/30 transition-colors cursor-default">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-primary" />
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Timeline</p>
          </div>
          <p className="text-white font-semibold text-sm">
            {data.timeline || "To be finalized"}
          </p>
        </div>
        <div className="group bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/50 hover:bg-slate-700/30 transition-colors cursor-default">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Budget</p>
          </div>
          <p className="text-white font-semibold text-sm">
            {data.budget || "Pending confirmation"}
          </p>
        </div>
      </div>
    </div>
  );
};

// --- Main Export ---
export function ProposalSidebar({
  proposal,
  isOpen,
  onClose,
  embedded = false,
  inline = false,
}) {
  const proposalData = useMemo(() => {
    const extracted = parseProposalContent(proposal);
    return mapToProposalData(extracted);
  }, [proposal]);

  const content = (
    <div className="h-full flex flex-col bg-black">
      {/* Header */}
      <div className="px-6 py-5 border-b border-zinc-800/50 bg-black flex-none z-10">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] uppercase tracking-wider font-semibold">
                <Check className="w-3 h-3" />
                Draft
              </span>
              <span className="text-xs text-slate-500">
                {new Date().toLocaleDateString()}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Project Proposal</h2>
            <p className="text-xs text-slate-400 mt-1">
              Generated by Catalance AI
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-slate-500 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-black scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        <div className="p-6">
          <ProposalCard data={proposalData} />
        </div>
      </div>

      {/* Footer / Actions */}
      {proposal && (
        <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/50">
          <button className="w-full py-3 bg-primary text-primary-foreground font-semibold text-sm rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98]">
            Proceed with this proposal
          </button>
        </div>
      )}
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div
      className={cn(
        "fixed top-0 right-0 h-screen w-full sm:w-[500px] bg-black border-l border-zinc-800 shadow-2xl transform transition-transform duration-300 ease-out",
        embedded ? "z-30" : "z-50",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      {content}
    </div>
  );
}
