import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import X from "lucide-react/dist/esm/icons/x";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import IndianRupee from "lucide-react/dist/esm/icons/indian-rupee";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Check from "lucide-react/dist/esm/icons/check";
import ListChecks from "lucide-react/dist/esm/icons/list-checks";

import { cn } from "@/shared/lib/utils";
import { useAuth } from "@/shared/context/AuthContext";

const PROPOSAL_FIELD_LABELS = [
  "Client Name",
  "Business Name",
  "Service Type",
  "Project Overview",
  "Primary Objectives",
  "Features/Deliverables Included",
  "Website Type",
  "Design Style",
  "Website Build Type",
  "Frontend Framework",
  "Backend Technology",
  "Database",
  "Hosting",
  "Page Count",
  "Creative Type",
  "Volume",
  "Engagement Model",
  "Brand Stage",
  "Brand Deliverables",
  "Target Audience",
  "Business Category",
  "Target Locations",
  "SEO Goals",
  "Duration",
  "App Type",
  "App Features",
  "Platform Requirements",
  "Launch Timeline",
  "Budget",
  "Additional Confirmed Inputs",
];

const SECTION_ALIASES = {
  clientName: ["client name", "name"],
  businessName: ["business name", "company name", "company"],
  serviceType: ["service type", "service"],
  overview: ["project overview", "overview", "description"],
  objectives: ["primary objectives", "objectives"],
  deliverables: [
    "features/deliverables included",
    "features included",
    "deliverables",
    "features",
  ],
  timeline: ["launch timeline", "timeline"],
  budget: ["budget", "pricing", "investment"],
  additionalInputs: ["additional confirmed inputs"],
};

const EXCLUDED_DETAIL_KEYS = new Set(
  Object.values(SECTION_ALIASES).flat(),
);

const getProposalStorageKeys = (userId) => {
  const suffix = userId ? `:${userId}` : "";
  return {
    listKey: `markify:savedProposals${suffix}`,
    singleKey: `markify:savedProposal${suffix}`,
    syncedKey: `markify:savedProposalSynced${suffix}`,
  };
};

const escapeRegExp = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeKey = (value = "") =>
  String(value || "")
    .replace(/\*+/g, "")
    .replace(/:$/, "")
    .trim()
    .toLowerCase();

const cleanText = (value = "") =>
  String(value || "")
    .replace(/\*+/g, "")
    .replace(/["'`~]+/g, "")
    .replace(/\s+/g, " ")
    .trim();

const dedupeItems = (items = []) => {
  const seen = new Set();
  return (Array.isArray(items) ? items : [])
    .map((item) => cleanText(item))
    .filter(Boolean)
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const splitListValue = (value = "") =>
  dedupeItems(
    String(value || "")
      .split(/\n|;|,(?=\s*[A-Za-z0-9])/)
      .map((item) => item.trim()),
  );

const normalizeProposalPreviewContent = (markdown = "") => {
  let normalized = String(markdown || "").replace(/\r/g, "").trim();

  normalized = normalized.replace(/([^\n])\s+(#{1,6}\s+)/g, "$1\n$2");

  PROPOSAL_FIELD_LABELS.forEach((label) => {
    const escaped = escapeRegExp(label);
    const patterns = [
      new RegExp(`([^\\n])\\s+(#{1,6}\\s*${escaped}\\s*:)`, "gi"),
      new RegExp(`([^\\n])\\s+(\\*\\*${escaped}\\*\\*\\s*:)`, "gi"),
      new RegExp(`([^\\n])\\s+(\\*\\*${escaped}:\\*\\*)`, "gi"),
      new RegExp(`([^\\n])\\s+(${escaped}\\s*:)`, "gi"),
    ];

    patterns.forEach((pattern) => {
      normalized = normalized.replace(pattern, "$1\n$2");
    });
  });

  return normalized.replace(/\n{3,}/g, "\n\n").trim();
};

const parseProposalSections = (markdown = "") => {
  if (!markdown) return [];

  const lines = normalizeProposalPreviewContent(markdown).split("\n");
  const sections = [];
  let currentSection = null;

  lines.forEach((rawLine) => {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const keyValueMatch = trimmed.match(
      /^\*{0,2}([^:*]+?)\*{0,2}:\s*\*{0,2}(.*?)\*{0,2}$/,
    );
    const listMatch =
      trimmed.match(/^[-*]\s+(.*)$/) || trimmed.match(/^\d+[.)]\s+(.*)$/);

    if (keyValueMatch && !listMatch) {
      const label = cleanText(keyValueMatch[1]);
      if (!label) return;
      currentSection = {
        label,
        key: normalizeKey(label),
        value: cleanText(keyValueMatch[2]),
        items: [],
      };
      sections.push(currentSection);
      return;
    }

    if (listMatch && currentSection) {
      const item = cleanText(listMatch[1]);
      if (item) currentSection.items.push(item);
      return;
    }

    if (currentSection) {
      const nextValue = cleanText(trimmed);
      if (!nextValue) return;
      currentSection.value = currentSection.value
        ? `${currentSection.value} ${nextValue}`
        : nextValue;
    }
  });

  return sections
    .map((section) => ({
      ...section,
      value: cleanText(section.value),
      items: dedupeItems(section.items),
    }))
    .filter((section) => section.value || section.items.length > 0);
};

const buildSectionMap = (sections = []) => {
  const map = new Map();
  sections.forEach((section) => {
    if (section?.key && !map.has(section.key)) {
      map.set(section.key, section);
    }
  });
  return map;
};

const findSection = (sectionMap, aliasKey) => {
  const aliases = SECTION_ALIASES[aliasKey] || [];
  for (const alias of aliases) {
    const match = sectionMap.get(alias);
    if (match) return match;
  }
  return null;
};

const extractSectionItems = (section) => {
  if (!section) return [];
  if (section.items?.length) return dedupeItems(section.items);
  return splitListValue(section.value);
};

const mapToProposalData = (sections = [], markdown = "") => {
  const sectionMap = buildSectionMap(sections);
  const clientSection = findSection(sectionMap, "clientName");
  const businessSection = findSection(sectionMap, "businessName");
  const serviceSection = findSection(sectionMap, "serviceType");
  const overviewSection = findSection(sectionMap, "overview");
  const objectivesSection = findSection(sectionMap, "objectives");
  const deliverablesSection = findSection(sectionMap, "deliverables");
  const timelineSection = findSection(sectionMap, "timeline");
  const budgetSection = findSection(sectionMap, "budget");
  const additionalInputsSection = findSection(sectionMap, "additionalInputs");

  if (sections.length === 0) {
    const fallbackOverview = cleanText(markdown);
    if (!fallbackOverview) return null;
    return {
      clientName: "",
      businessName: "",
      serviceType: "Proposal",
      overview: fallbackOverview,
      objectives: [],
      deliverables: [],
      detailFields: [],
      additionalInputs: [],
      timeline: "",
      budget: "",
    };
  }

  const detailFields = sections
    .filter((section) => !EXCLUDED_DETAIL_KEYS.has(section.key))
    .map((section) => ({
      label: section.label,
      value: section.value,
      items: section.items,
    }));

  return {
    clientName: clientSection?.value || "",
    businessName: businessSection?.value || "",
    serviceType: serviceSection?.value || "Proposal",
    overview: overviewSection?.value || "",
    objectives: extractSectionItems(objectivesSection),
    deliverables: extractSectionItems(deliverablesSection),
    detailFields,
    additionalInputs: extractSectionItems(additionalInputsSection),
    timeline: timelineSection?.value || "",
    budget: budgetSection?.value || "",
  };
};

const resolveProposalTitle = (data) =>
  data?.serviceType ||
  data?.businessName ||
  data?.detailFields?.[0]?.value ||
  "Proposal";

const EmptyProposalState = () => (
  <div className="flex h-64 flex-col items-center justify-center px-6 text-center">
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800">
      <FileText className="h-7 w-7 text-slate-500" />
    </div>
    <p className="text-sm text-slate-400">
      Your proposal will appear here once generated.
    </p>
  </div>
);

const MetaCard = ({ label, value, accentClass = "text-white" }) => (
  <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
      {label}
    </p>
    <p className={cn("text-sm font-semibold", accentClass)}>
      {value || "-"}
    </p>
  </div>
);

const BulletSection = ({ title, items = [] }) => {
  if (!items.length) return null;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <ListChecks className="h-4 w-4" />
        </div>
        <p className="text-sm font-semibold text-white">{title}</p>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span className="text-sm leading-relaxed text-slate-300">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const DetailFieldsCard = ({ fields = [] }) => {
  if (!fields.length) return null;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Briefcase className="h-4 w-4" />
        </div>
        <p className="text-sm font-semibold text-white">Project Details</p>
      </div>
      <div className="space-y-4">
        {fields.map((field) => (
          <div
            key={field.label}
            className="rounded-xl border border-zinc-800/80 bg-black/30 p-4"
          >
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
              {field.label}
            </p>
            {field.items?.length ? (
              <ul className="space-y-2">
                {field.items.map((item) => (
                  <li key={`${field.label}-${item}`} className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="text-sm leading-relaxed text-slate-300">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm leading-relaxed text-slate-300">
                {field.value || "-"}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const ProposalCard = ({ data }) => {
  if (!data) return <EmptyProposalState />;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <MetaCard label="Client" value={data.clientName} />
        <MetaCard label="Business" value={data.businessName} />
        <MetaCard
          label="Service"
          value={data.serviceType}
          accentClass="text-primary"
        />
      </div>

      {data.overview ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
            Project Overview
          </p>
          <p className="text-sm leading-relaxed text-slate-300">{data.overview}</p>
        </div>
      ) : null}

      <BulletSection title="Primary Objectives" items={data.objectives} />
      <BulletSection
        title="Features & Deliverables"
        items={data.deliverables}
      />
      <DetailFieldsCard fields={data.detailFields} />
      <BulletSection
        title="Additional Confirmed Inputs"
        items={data.additionalInputs}
      />

      {data.timeline || data.budget ? (
        <div
          className={cn(
            "grid gap-3",
            data.timeline && data.budget ? "md:grid-cols-2" : "grid-cols-1",
          )}
        >
          {data.timeline ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                  Timeline
                </p>
              </div>
              <p className="text-sm font-semibold text-white">{data.timeline}</p>
            </div>
          ) : null}
          {data.budget ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
              <div className="mb-2 flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-emerald-400" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                  Budget
                </p>
              </div>
              <p className="text-sm font-semibold text-white">{data.budget}</p>
            </div>
          ) : null}
        </div>
      ) : null}
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
  const navigate = useNavigate();
  const { user } = useAuth();

  const proposalData = useMemo(() => {
    const sections = parseProposalSections(proposal);
    return mapToProposalData(sections, proposal);
  }, [proposal]);

  const saveProposalToStorage = () => {
    if (typeof window === "undefined" || !proposalData) return;

    const now = new Date().toISOString();
    const { listKey, singleKey, syncedKey } = getProposalStorageKeys(user?.id);
    const proposalToSave = {
      id: `saved-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      projectTitle: resolveProposalTitle(proposalData),
      service: proposalData.serviceType || "General services",
      serviceKey: proposalData.serviceType || "",
      summary: proposal,
      content: proposal,
      budget: proposalData.budget || "",
      timeline: proposalData.timeline || "",
      ownerId: user?.id || null,
      syncedProjectId: null,
      syncedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    let existingProposals = [];
    try {
      const stored = localStorage.getItem(listKey);
      if (stored) {
        existingProposals = JSON.parse(stored);
      }
    } catch {
      existingProposals = [];
    }

    existingProposals.push(proposalToSave);
    localStorage.setItem(listKey, JSON.stringify(existingProposals));
    localStorage.setItem(singleKey, JSON.stringify(proposalToSave));
    if (syncedKey) {
      localStorage.removeItem(syncedKey);
    }

    return proposalToSave;
  };

  const handleProceed = () => {
    if (!proposalData) {
      toast.error("No proposal data available");
      return;
    }

    saveProposalToStorage();

    if (user) {
      if (user.role === "CLIENT") {
        toast.success("Proposal saved! Redirecting to dashboard...");
        onClose?.();
        navigate("/client");
      } else {
        toast.info("Please create a client account to proceed with this proposal.");
        onClose?.();
        navigate("/signup?role=client", {
          state: { redirectTo: "/client", fromProposal: true },
        });
      }
      return;
    }

    toast.success("Proposal saved! Please create an account to continue.");
    onClose?.();
    navigate("/signup?role=client", {
      state: { redirectTo: "/client", fromProposal: true },
    });
  };

  const content = (
    <div className="flex h-full flex-col bg-black">
      <div className="z-10 flex-none border-b border-zinc-800/50 bg-black px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                <Check className="h-3 w-3" />
                Draft
              </span>
              <span className="text-xs text-slate-500">
                {new Date().toLocaleDateString()}
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              {resolveProposalTitle(proposalData)}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Generated by Catalance AI
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-black scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-800">
        <div className="p-6">
          <ProposalCard data={proposalData} />
        </div>
      </div>

      {proposal ? (
        <div className="border-t border-zinc-800/50 bg-zinc-900/50 p-4">
          <button
            onClick={handleProceed}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30 active:scale-[0.98]"
          >
            Proceed with this proposal
          </button>
        </div>
      ) : null}
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div
      className={cn(
        "fixed top-0 right-0 h-screen w-full transform border-l border-zinc-800 bg-black shadow-2xl transition-transform duration-300 ease-out sm:w-[500px]",
        embedded ? "z-30" : "z-50",
        isOpen ? "translate-x-0" : "translate-x-full",
      )}
    >
      {content}
    </div>
  );
}
