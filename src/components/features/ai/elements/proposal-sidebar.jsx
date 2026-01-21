import { useState, useMemo } from "react";
import X from "lucide-react/dist/esm/icons/x";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Check from "lucide-react/dist/esm/icons/check";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import DollarSign from "lucide-react/dist/esm/icons/dollar-sign";
import Layers from "lucide-react/dist/esm/icons/layers";
import Code from "lucide-react/dist/esm/icons/code";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/shared/lib/utils";

// --- Parsers ---

const parseProposalContent = (markdown) => {
  if (!markdown) return null;

  const lines = markdown.split("\n");
  const extracted = {};
  let currentKey = null;

  // Helper to normalize keys
  const normalizeKey = (key) => key.toLowerCase().trim().replace(/:$/, "");

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (trimmed.startsWith("#")) return; // Skip headers for now or handle them as separators if needed

    // Check for "Key: Value" pattern
    const keyValMatch = trimmed.match(/^([^:-]+):\s*(.*)/);

    // Check if it's a list item
    const isListItem = trimmed.startsWith("- ") || trimmed.startsWith("* ");

    if (keyValMatch && !isListItem) {
      const key = normalizeKey(keyValMatch[1]);
      const value = keyValMatch[2].trim();
      extracted[key] = { value, items: [] };
      currentKey = key;
    } else if (isListItem && currentKey) {
      extracted[currentKey].items.push(trimmed.replace(/^[-*]\s+/, ""));
    } else if (currentKey && trimmed) {
      // Append continuation lines to value if it's not a list item and not a new key
      if (!extracted[currentKey].value) {
        extracted[currentKey].value = trimmed;
      } else {
        extracted[currentKey].value += " " + trimmed;
      }
    }
  });

  // Group into sections for the UI
  const sections = [
    {
      id: "overview",
      title: "Project Overview",
      type: "grid",
      icon: FileText,
      fields: [
        { label: "Business Name", key: "business name" },
        { label: "Requirement", key: "website requirement" },
        { label: "Type", key: "website type" },
        { label: "Design", key: "design experience" },
        { label: "Pages", key: "page count" },
      ],
    },
    {
      id: "scope",
      title: "Scope & Objectives",
      type: "lists",
      icon: Layers,
      fields: [
        { label: "Primary Objectives", key: "primary objectives" },
        { label: "Features Included", key: "features included" },
      ],
    },
    {
      id: "tech",
      title: "Technical Stack",
      type: "tags",
      icon: Code,
      fields: [
        { label: "Build Type", key: "website build type" },
        { label: "Frontend", key: "frontend framework" },
        { label: "Backend", key: "backend technology" },
        { label: "Database", key: "database" },
        { label: "Hosting", key: "hosting" },
      ],
    },
    {
      id: "logistics",
      title: "Timeline & Budget",
      type: "highlight",
      icon: Calendar,
      fields: [
        { label: "Timeline", key: "launch timeline" },
        { label: "Budget", key: "budget" },
      ],
    },
  ];

  // Map extracted data to sections
  return sections.map((section) => ({
    ...section,
    content: section.fields
      .map((field) => {
        const data = extracted[field.key];
        if (!data) return null;
        return {
          label: field.label,
          value: data.value,
          items: data.items,
        };
      })
      .filter(Boolean),
  }));
};

// --- Components ---

const SectionCard = ({ section, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!section.content || section.content.length === 0) return null;

  const renderContent = () => {
    if (section.type === "grid") {
      return (
        <div className="grid grid-cols-1 gap-4">
          {section.content.map((item, idx) => (
            <div key={idx}>
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                {item.label}
              </h4>
              <p className="text-sm text-zinc-200">{item.value}</p>
            </div>
          ))}
        </div>
      );
    }

    if (section.type === "lists") {
      return (
        <div className="space-y-6">
          {section.content.map((item, idx) => (
            <div key={idx}>
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                {item.label}
              </h4>
              <ul className="space-y-2">
                {item.items.map((li, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="text-sm text-zinc-300 leading-tight">{li}</span>
                  </li>
                ))}
                {(!item.items || item.items.length === 0) && item.value && (
                  <li className="text-sm text-zinc-300">{item.value}</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      );
    }

    if (section.type === "tags") {
      return (
        <div className="flex flex-wrap gap-2">
          {section.content.map((item, idx) => (
            item.value && item.value !== "Not specified" ? (
              <Badge key={idx} variant="secondary" className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-normal border border-zinc-700/50">
                <span className="text-zinc-500 mr-2 opacity-70">{item.label}:</span> {item.value}
              </Badge>
            ) : null
          ))}
        </div>
      )
    }

    if (section.type === "highlight") {
      return (
        <div className="grid grid-cols-2 gap-3">
          {section.content.map((item, idx) => (
            <div key={idx} className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
              <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{item.label}</h4>
              <p className="text-base font-medium text-white">{item.value}</p>
            </div>
          ))}
        </div>
      )
    }

    return null;
  };

  const Icon = section.icon || FileText;

  return (
    <Card className="bg-zinc-900/30 border-zinc-800/50 overflow-hidden mb-3 shadow-none">
      <div
        className={cn(
          "flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-800/30 transition-colors",
          isOpen && "bg-zinc-800/30"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-700/50">
            <Icon className="w-4 h-4 text-zinc-400" />
          </div>
          <h3 className="font-semibold text-zinc-200 text-sm">{section.title}</h3>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-zinc-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-500" />
        )}
      </div>
      {isOpen && (
        <React.Fragment>
          <Separator className="bg-zinc-800/50" />
          <div className="p-4 pt-4 animate-in slide-in-from-top-2 duration-200">
            {renderContent()}
          </div>
        </React.Fragment>
      )}
    </Card>
  );
};

// Need React for the Fragment usage above if not imported implicitly (older React/standard lint rules)
import React from 'react';


const StructuredProposal = ({ content }) => {
  const sections = useMemo(() => parseProposalContent(content), [content]);

  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-6">
        <div className="h-12 w-12 rounded-full bg-zinc-900 flex items-center justify-center mb-4 border border-zinc-800">
          <FileText className="w-6 h-6 text-zinc-600" />
        </div>
        <p className="text-zinc-500 text-sm">
          Your proposal will appear here once generated.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1 pb-10">
      {sections.map((section, idx) => (
        <SectionCard key={idx} section={section} defaultOpen={idx < 3} />
      ))}
    </div>
  );
};

export function ProposalSidebar({
  proposal,
  isOpen,
  onClose,
  embedded = false,
  inline = false,
}) {
  const content = (
    <div className="h-full flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="px-6 py-5 border-b border-zinc-800/50 bg-zinc-950 flex-none z-10">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 px-2 py-0 h-6 text-[10px] uppercase tracking-wider">
                <Check className="w-3 h-3 mr-1" />
                Draft
              </Badge>
              <span className="text-xs text-zinc-500">
                {new Date().toLocaleDateString()}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Project Proposal</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Generated by Catalance AI
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-900 rounded-full transition-colors text-zinc-500 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-zinc-950 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        <div className="p-6">
          <StructuredProposal content={proposal} />
        </div>
      </div>

      {/* Footer / Actions */}
      {proposal && (
        <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/20">
          <button className="w-full py-2.5 bg-primary text-primary-foreground font-medium text-sm rounded-md hover:bg-primary/90 transition-colors shadow-lg shadow-primary/10">
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
        "fixed top-0 right-0 h-screen w-full sm:w-[500px] bg-zinc-950 border-l border-zinc-800 shadow-2xl transform transition-transform duration-300 ease-out",
        embedded ? "z-30" : "z-50",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      {content}
    </div>
  );
}

