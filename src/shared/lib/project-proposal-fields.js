const PROPOSAL_FIELD_DEFINITIONS = [
  { key: "clientName", labels: ["Client Name"], type: "text" },
  { key: "businessName", labels: ["Business Name"], type: "text" },
  { key: "serviceType", labels: ["Service Type"], type: "text" },
  { key: "projectOverview", labels: ["Project Overview", "Overview", "Summary"], type: "text" },
  { key: "primaryObjectives", labels: ["Primary Objectives", "Objectives", "Goals"], type: "list" },
  {
    key: "featuresDeliverables",
    labels: ["Features/Deliverables Included", "Features", "Deliverables", "Scope"],
    type: "list",
  },
  { key: "timeline", labels: ["Launch Timeline", "Timeline"], type: "text" },
  { key: "budgetSummary", labels: ["Budget", "Pricing", "Investment"], type: "text" },
  { key: "websiteType", labels: ["Website Type"], type: "text" },
  { key: "designStyle", labels: ["Design Style"], type: "text" },
  { key: "websiteBuildType", labels: ["Website Build Type"], type: "text" },
  { key: "frontendFramework", labels: ["Frontend Framework"], type: "text" },
  { key: "backendTechnology", labels: ["Backend Technology"], type: "text" },
  { key: "databaseType", labels: ["Database"], type: "text" },
  { key: "hosting", labels: ["Hosting"], type: "text" },
  { key: "pageCount", labels: ["Page Count"], type: "text" },
  { key: "creativeType", labels: ["Creative Type"], type: "text" },
  { key: "volume", labels: ["Volume"], type: "text" },
  { key: "engagementModel", labels: ["Engagement Model"], type: "text" },
  { key: "brandStage", labels: ["Brand Stage"], type: "text" },
  { key: "brandDeliverables", labels: ["Brand Deliverables"], type: "list" },
  { key: "targetAudience", labels: ["Target Audience"], type: "text" },
  { key: "businessCategory", labels: ["Business Category"], type: "text" },
  { key: "targetLocations", labels: ["Target Locations"], type: "list" },
  { key: "seoGoals", labels: ["SEO Goals"], type: "list" },
  { key: "duration", labels: ["Duration"], type: "text" },
  { key: "appType", labels: ["App Type"], type: "text" },
  { key: "appFeatures", labels: ["App Features"], type: "list" },
  { key: "platformRequirements", labels: ["Platform Requirements"], type: "list" },
];

const normalizeFieldLabel = (value = "") =>
  String(value || "")
    .replace(/\*+/g, "")
    .replace(/:$/, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const stripProposalCodeFences = (value = "") =>
  String(value || "")
    .replace(/```markdown\n?/gi, "")
    .replace(/```\n?/g, "")
    .replace(/\r/g, "")
    .trim();

const cleanProposalText = (value = "") => {
  const normalized = String(value || "")
    .replace(/\*+/g, "")
    .replace(/^[#\s]+/, "")
    .replace(/\s+/g, " ")
    .trim();

  return normalized;
};

const splitProposalListValue = (value = "") =>
  String(value || "")
    .split(/\r?\n|;|,(?=\s*[A-Za-z0-9])/)
    .map((item) => cleanProposalText(item))
    .filter(Boolean);

const uniqueItems = (items = []) => {
  const seen = new Set();
  const result = [];

  items.forEach((item) => {
    const normalized = cleanProposalText(item);
    if (!normalized) return;

    const key = normalized.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(normalized);
  });

  return result;
};

const normalizeExplicitList = (value) => {
  if (Array.isArray(value)) {
    return uniqueItems(value);
  }

  if (typeof value === "string") {
    return uniqueItems(splitProposalListValue(value));
  }

  return [];
};

export const extractProposalSectionMap = (markdown = "") => {
  const sections = new Map();
  let activeKey = null;

  for (const rawLine of stripProposalCodeFences(markdown).split("\n")) {
    let line = rawLine.trim();
    if (!line) continue;

    line = line.replace(/^[#\s]+/, "").trim();

    const keyValueMatch = line.match(
      /^\*{0,2}(?:[-*]\s+)?(?:\d+\.\s+)?([^:*]+?)\*{0,2}:\s*(.*)$/,
    );
    if (keyValueMatch) {
      const label = cleanProposalText(keyValueMatch[1]);
      const value = cleanProposalText(keyValueMatch[2]);
      if (!label) continue;

      activeKey = normalizeFieldLabel(label);
      if (!sections.has(activeKey)) {
        sections.set(activeKey, { label, value: "", items: [] });
      }

      if (value) {
        sections.get(activeKey).value = value;
      }
      continue;
    }

    const bulletMatch =
      line.match(/^[-*]\s+(.+)$/) || line.match(/^\d+\.\s+(.+)$/);
    if (bulletMatch) {
      if (!activeKey) continue;
      sections.get(activeKey).items.push(cleanProposalText(bulletMatch[1]));
      continue;
    }

    if (activeKey) {
      const section = sections.get(activeKey);
      section.value = section.value
        ? `${section.value} ${cleanProposalText(line)}`.trim()
        : cleanProposalText(line);
    }
  }

  return sections;
};

const getSectionByLabels = (sectionMap = new Map(), labels = []) => {
  for (const label of labels) {
    const match = sectionMap.get(normalizeFieldLabel(label));
    if (match) return match;
  }

  return null;
};

export const PROJECT_PROPOSAL_TEXT_FIELDS = PROPOSAL_FIELD_DEFINITIONS
  .filter((field) => field.type === "text")
  .map((field) => field.key);

export const PROJECT_PROPOSAL_LIST_FIELDS = PROPOSAL_FIELD_DEFINITIONS
  .filter((field) => field.type === "list")
  .map((field) => field.key);

export const PROJECT_PROPOSAL_FIELD_KEYS = [
  ...PROJECT_PROPOSAL_TEXT_FIELDS,
  ...PROJECT_PROPOSAL_LIST_FIELDS,
  "proposalContent",
  "serviceKey",
];

const hasOwnField = (value, key) =>
  Object.prototype.hasOwnProperty.call(value ?? {}, key);

export const extractProjectProposalFields = (payload = {}) => {
  const rawProposalSource =
    payload?.proposalContent
    || payload?.content
    || payload?.summary
    || payload?.description
    || "";
  const proposalContent = stripProposalCodeFences(rawProposalSource);
  const fallbackDescription = cleanProposalText(payload?.description || "");
  const sectionMap = extractProposalSectionMap(proposalContent || payload?.description || "");
  const result = {};

  PROPOSAL_FIELD_DEFINITIONS.forEach((definition) => {
    const explicitValue = payload?.[definition.key];

    if (definition.type === "list") {
      let items = normalizeExplicitList(explicitValue);
      if (items.length === 0) {
        const section = getSectionByLabels(sectionMap, definition.labels);
        if (section) {
          items = uniqueItems(
            Array.isArray(section.items) && section.items.length > 0
              ? section.items
              : splitProposalListValue(section.value),
          );
        }
      }

      if (items.length > 0) {
        result[definition.key] = items;
      }
      return;
    }

    let value = cleanProposalText(explicitValue);

    if (!value && definition.key === "serviceType") {
      value = cleanProposalText(payload?.service || payload?.serviceName || "");
    }

    if (!value) {
      const section = getSectionByLabels(sectionMap, definition.labels);
      if (section) {
        value = cleanProposalText(section.value);
      }
    }

    if (!value && definition.key === "projectOverview") {
      value = fallbackDescription;
    }

    if (value) {
      result[definition.key] = value;
    }
  });

  if (proposalContent) {
    result.proposalContent = proposalContent;
  }

  const serviceKey = cleanProposalText(payload?.serviceKey || "");
  if (serviceKey) {
    result.serviceKey = serviceKey;
  }

  return result;
};

export const buildProjectProposalJson = (payload = {}) => {
  const extractedFields = extractProjectProposalFields(payload);
  const rawProposalSource =
    payload?.proposalContent
    || payload?.content
    || payload?.summary
    || payload?.description
    || "";
  const proposalContent =
    extractedFields?.proposalContent || stripProposalCodeFences(rawProposalSource);
  const sectionMap = extractProposalSectionMap(
    proposalContent || payload?.description || "",
  );
  const sections = Array.from(sectionMap.values())
    .map((section) => {
      const label = cleanProposalText(section?.label || "");
      const value = cleanProposalText(section?.value || "");
      const items = uniqueItems(Array.isArray(section?.items) ? section.items : []);

      if (!label || (!value && items.length === 0)) {
        return null;
      }

      return {
        key: normalizeFieldLabel(label),
        label,
        value,
        items,
      };
    })
    .filter(Boolean);

  const fields = PROPOSAL_FIELD_DEFINITIONS.reduce((acc, definition) => {
    if (hasOwnField(extractedFields, definition.key)) {
      acc[definition.key] = extractedFields[definition.key];
    }
    return acc;
  }, {});

  const serviceKey = cleanProposalText(payload?.serviceKey || extractedFields?.serviceKey || "");
  const title = cleanProposalText(payload?.title || "");
  const status = cleanProposalText(payload?.status || "");
  const budget =
    payload?.budget === undefined || payload?.budget === null
      ? ""
      : String(payload.budget).trim();

  if (
    !proposalContent
    && Object.keys(fields).length === 0
    && sections.length === 0
  ) {
    return null;
  }

  return {
    version: 1,
    title: title || null,
    serviceKey: serviceKey || null,
    status: status || null,
    budget: budget || null,
    proposalContent: proposalContent || "",
    fields,
    sections,
  };
};
