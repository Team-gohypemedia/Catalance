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

const normalizeStructuredFieldKey = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .trim();

const formatTemplateLabelFromKey = (value = "") =>
  String(value || "")
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const normalizeTemplateFieldType = (value = "") =>
  ["list", "array", "bullets", "bullet_list"].includes(
    String(value || "").trim().toLowerCase(),
  )
    ? "list"
    : "text";

const parseProposalStructureJson = (value = "") => {
  const source = String(value || "").trim();
  if (!source || !/^[\[{]/.test(source)) return null;

  try {
    const parsed = JSON.parse(source);
    if (Array.isArray(parsed)) {
      return { fields: parsed };
    }
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.fields)) {
      return parsed;
    }
  } catch {
    // Fall back to the legacy text structure parser below.
  }

  return null;
};

const dedupeProposalTemplateFields = (definitions = []) => {
  const seen = new Set();
  const rows = [];

  for (const definition of definitions) {
    const label = cleanProposalText(
      definition?.label
      || definition?.name
      || definition?.title
      || formatTemplateLabelFromKey(definition?.key || ""),
    );
    const fieldKey = normalizeStructuredFieldKey(definition?.key || label);
    if (!label || !fieldKey || seen.has(fieldKey)) continue;
    seen.add(fieldKey);
    rows.push({
      key: fieldKey,
      label,
      type: normalizeTemplateFieldType(
        definition?.type || (definition?.isList ? "list" : "text"),
      ),
    });
  }

  return rows;
};

const parseProposalStructureDefinitions = (proposalStructure = "") => {
  const jsonConfig = parseProposalStructureJson(proposalStructure);
  if (Array.isArray(jsonConfig?.fields) && jsonConfig.fields.length > 0) {
    return dedupeProposalTemplateFields(jsonConfig.fields);
  }

  const parsedDefinitions = [];
  let activeIndex = -1;

  for (const rawLine of stripProposalCodeFences(proposalStructure).split("\n")) {
    let line = rawLine.trim();
    if (!line) continue;

    line = line.replace(/^[#\s]+/, "").trim();

    const keyValueMatch = line.match(
      /^\*{0,2}(?:[-*]\s+)?(?:\d+\.\s+)?([^:*]+?)\*{0,2}:\s*(.*)$/,
    );

    if (keyValueMatch) {
      const label = cleanProposalText(keyValueMatch[1]);
      if (!label) {
        activeIndex = -1;
        continue;
      }

      parsedDefinitions.push({
        key: normalizeStructuredFieldKey(label),
        label,
        type: "text",
      });
      activeIndex = parsedDefinitions.length - 1;
      continue;
    }

    if (activeIndex >= 0 && /^[-*]\s+/.test(line)) {
      parsedDefinitions[activeIndex].type = "list";
    }
  }

  return dedupeProposalTemplateFields(parsedDefinitions);
};

const PROPOSAL_FIELD_DEFINITION_BY_LABEL = PROPOSAL_FIELD_DEFINITIONS.reduce(
  (acc, definition) => {
    definition.labels.forEach((label) => {
      acc.set(normalizeFieldLabel(label), definition);
    });
    return acc;
  },
  new Map(),
);

const normalizeTemplateFieldValue = (value, type = "text") => {
  if (type === "list") {
    const items = normalizeExplicitList(value);
    return {
      value: cleanProposalText(Array.isArray(value) ? value.join(", ") : value || ""),
      items,
    };
  }

  const textValue = Array.isArray(value)
    ? cleanProposalText(value.join(", "))
    : cleanProposalText(value);
  return {
    value: textValue,
    items: [],
  };
};

const buildSectionRecord = ({
  label = "",
  type = "text",
  value = "",
  items = [],
} = {}) => ({
  key: normalizeFieldLabel(label),
  fieldKey: normalizeStructuredFieldKey(label),
  label: cleanProposalText(label),
  type: normalizeTemplateFieldType(type),
  value: cleanProposalText(value),
  items: uniqueItems(items),
});

const findTemplateSectionMatch = (sectionMap = new Map(), definition = {}) => {
  const directKey = normalizeFieldLabel(definition.label);
  if (sectionMap.has(directKey)) {
    return sectionMap.get(directKey);
  }

  const standardDefinition = PROPOSAL_FIELD_DEFINITION_BY_LABEL.get(directKey);
  if (!standardDefinition) return null;

  for (const alias of standardDefinition.labels) {
    const aliasMatch = sectionMap.get(normalizeFieldLabel(alias));
    if (aliasMatch) return aliasMatch;
  }

  return null;
};

const PROPOSAL_CONTEXT_FIELD_ALIASES = {
  clientName: ["clientName"],
  businessName: ["businessName", "companyName", "brandName"],
  serviceType: ["serviceType", "serviceName", "service"],
  projectOverview: ["projectOverview", "summary", "description"],
  budgetSummary: ["budgetSummary", "budget"],
  timeline: ["timeline", "launchTimeline"],
  targetAudience: ["targetAudience"],
  targetLocations: ["targetLocations"],
  seoGoals: ["seoGoals"],
  primaryObjectives: ["primaryObjectives"],
  featuresDeliverables: ["featuresDeliverables", "deliverables"],
  appType: ["appType"],
  appFeatures: ["appFeatures"],
  platformRequirements: ["platformRequirements"],
};

const isNonArrayObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value);

const getProposalContext = (payload = {}) => {
  if (isNonArrayObject(payload?.proposalContext)) {
    return payload.proposalContext;
  }
  if (isNonArrayObject(payload?.proposalJson?.contextSnapshot)) {
    return payload.proposalJson.contextSnapshot;
  }
  return {};
};

const labelsLooselyMatch = (left = "", right = "") => {
  const normalizedLeft = normalizeFieldLabel(left);
  const normalizedRight = normalizeFieldLabel(right);
  if (!normalizedLeft || !normalizedRight) return false;
  if (normalizedLeft === normalizedRight) return true;
  if (normalizedLeft.length >= 5 && normalizedRight.includes(normalizedLeft)) return true;
  if (normalizedRight.length >= 5 && normalizedLeft.includes(normalizedRight)) return true;
  return false;
};

const findProposalContextValue = ({
  proposalContext = {},
  definition = null,
  standardDefinition = null,
} = {}) => {
  if (!definition) return null;

  const structuredKey = normalizeStructuredFieldKey(
    definition?.key || standardDefinition?.key || definition?.label || "",
  );
  const definitionLabel = definition?.label || "";
  const directAliasKeys = uniqueItems([
    ...(standardDefinition
      ? [standardDefinition.key, ...(PROPOSAL_CONTEXT_FIELD_ALIASES[standardDefinition.key] || [])]
      : []),
    structuredKey,
  ]);

  for (const aliasKey of directAliasKeys) {
    if (hasOwnField(proposalContext, aliasKey)) {
      return proposalContext[aliasKey];
    }
  }

  for (const [key, value] of Object.entries(proposalContext)) {
    if (labelsLooselyMatch(key, definitionLabel)) {
      return value;
    }
    if (normalizeStructuredFieldKey(key) === structuredKey) {
      return value;
    }
  }

  const questionnaireAnswers = isNonArrayObject(proposalContext?.questionnaireAnswers)
    ? proposalContext.questionnaireAnswers
    : {};
  for (const [question, answer] of Object.entries(questionnaireAnswers)) {
    if (labelsLooselyMatch(question, definitionLabel)) {
      return answer;
    }
  }

  const questionnaireAnswersBySlug = isNonArrayObject(proposalContext?.questionnaireAnswersBySlug)
    ? proposalContext.questionnaireAnswersBySlug
    : {};
  for (const [questionSlug, answer] of Object.entries(questionnaireAnswersBySlug)) {
    if (normalizeStructuredFieldKey(questionSlug) === structuredKey) {
      return answer;
    }
    if (labelsLooselyMatch(questionSlug, definitionLabel)) {
      return answer;
    }
  }

  return null;
};

const sanitizeProposalContextSnapshot = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const normalized = String(value || "").trim();
    return normalized || null;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    const sanitized = value
      .map((entry) => sanitizeProposalContextSnapshot(entry))
      .filter((entry) =>
        entry !== null
        && entry !== undefined
        && (!(Array.isArray(entry)) || entry.length > 0)
        && (!isNonArrayObject(entry) || Object.keys(entry).length > 0),
      );
    return sanitized.length > 0 ? sanitized : null;
  }
  if (isNonArrayObject(value)) {
    const sanitized = Object.entries(value).reduce((acc, [key, entry]) => {
      const nextValue = sanitizeProposalContextSnapshot(entry);
      if (
        nextValue === null
        || nextValue === undefined
        || (Array.isArray(nextValue) && nextValue.length === 0)
        || (isNonArrayObject(nextValue) && Object.keys(nextValue).length === 0)
      ) {
        return acc;
      }
      acc[key] = nextValue;
      return acc;
    }, {});
    return Object.keys(sanitized).length > 0 ? sanitized : null;
  }

  return null;
};

const buildTemplateSections = ({
  sections = [],
  definitions = [],
  extractedFields = {},
  payload = {},
} = {}) => {
  const proposalContext = getProposalContext(payload);
  const sectionMap = new Map(
    (Array.isArray(sections) ? sections : []).map((section) => [
      normalizeFieldLabel(section?.label || section?.key || ""),
      section,
    ]),
  );
  const usedKeys = new Set();

  const orderedSections = definitions.map((definition) => {
    const matchedSection = findTemplateSectionMatch(sectionMap, definition);
    if (matchedSection) {
      usedKeys.add(normalizeFieldLabel(matchedSection.label || matchedSection.key || ""));
    }

    const standardDefinition = PROPOSAL_FIELD_DEFINITION_BY_LABEL.get(
      normalizeFieldLabel(definition.label),
    );
    const fallbackSource =
      standardDefinition && hasOwnField(extractedFields, standardDefinition.key)
        ? extractedFields[standardDefinition.key]
        : standardDefinition && hasOwnField(payload, standardDefinition.key)
          ? payload[standardDefinition.key]
          : findProposalContextValue({
            proposalContext,
            definition,
            standardDefinition,
          });
    const normalizedFallback = normalizeTemplateFieldValue(
      fallbackSource,
      definition.type,
    );
    const normalizedMatched = normalizeTemplateFieldValue(
      definition.type === "list"
        ? matchedSection?.items?.length
          ? matchedSection.items
          : matchedSection?.value || ""
        : matchedSection?.value
          || (matchedSection?.items?.length ? matchedSection.items.join(", ") : ""),
      definition.type,
    );

    return buildSectionRecord({
      label: definition.label,
      type: definition.type,
      value:
        normalizedMatched.value
        || normalizedFallback.value
        || "",
      items:
        normalizedMatched.items.length > 0
          ? normalizedMatched.items
          : normalizedFallback.items,
    });
  });

  const unmatchedSections = (Array.isArray(sections) ? sections : [])
    .filter((section) => {
      const normalizedKey = normalizeFieldLabel(section?.label || section?.key || "");
      return normalizedKey && !usedKeys.has(normalizedKey);
    })
    .map((section) =>
      buildSectionRecord({
        label: section.label || section.key,
        type: section?.items?.length ? "list" : "text",
        value: section.value,
        items: section.items,
      }),
    );

  return [...orderedSections, ...unmatchedSections];
};

const buildStructuredFieldsMap = (sections = []) =>
  (Array.isArray(sections) ? sections : []).reduce((acc, section) => {
    const fieldKey = normalizeStructuredFieldKey(
      section?.fieldKey || section?.label || section?.key || "",
    );
    if (!fieldKey || acc[fieldKey]) return acc;

    acc[fieldKey] = {
      label: cleanProposalText(section?.label || ""),
      type: normalizeTemplateFieldType(section?.type || (section?.items?.length ? "list" : "text")),
      value: cleanProposalText(section?.value || ""),
      items: uniqueItems(Array.isArray(section?.items) ? section.items : []),
    };
    return acc;
  }, {});

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
  const proposalContext = getProposalContext(payload);
  const result = {};

  PROPOSAL_FIELD_DEFINITIONS.forEach((definition) => {
    const explicitValue = payload?.[definition.key];

    if (definition.type === "list") {
      let items = normalizeExplicitList(explicitValue);
      if (items.length === 0) {
        items = normalizeExplicitList(
          findProposalContextValue({
            proposalContext,
            definition: {
              key: definition.key,
              label: definition.labels[0] || definition.key,
              type: definition.type,
            },
            standardDefinition: definition,
          }),
        );
      }
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
      value = cleanProposalText(
        findProposalContextValue({
          proposalContext,
          definition: {
            key: definition.key,
            label: definition.labels[0] || definition.key,
            type: definition.type,
          },
          standardDefinition: definition,
        }),
      );
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
  const contextSnapshot = sanitizeProposalContextSnapshot(getProposalContext(payload));
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
  const parsedSections = Array.from(sectionMap.values())
    .map((section) => {
      const label = cleanProposalText(section?.label || "");
      const value = cleanProposalText(section?.value || "");
      const items = uniqueItems(Array.isArray(section?.items) ? section.items : []);

      if (!label || (!value && items.length === 0)) {
        return null;
      }

      return {
        key: normalizeFieldLabel(label),
        fieldKey: normalizeStructuredFieldKey(label),
        label,
        type: items.length > 0 ? "list" : "text",
        value,
        items,
      };
    })
    .filter(Boolean);
  const templateDefinitions = parseProposalStructureDefinitions(
    payload?.proposalStructure || "",
  );
  const sections = templateDefinitions.length > 0
    ? buildTemplateSections({
      sections: parsedSections,
      definitions: templateDefinitions,
      extractedFields,
      payload,
    })
    : parsedSections;

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
    structuredFields: buildStructuredFieldsMap(sections),
    ...(contextSnapshot ? { contextSnapshot } : {}),
    ...(templateDefinitions.length > 0
      ? {
        template: {
          source: "service",
          fields: templateDefinitions.map((definition) => ({
            key: definition.key,
            label: definition.label,
            type: definition.type,
          })),
        },
      }
      : {}),
    sections,
  };
};

const splitMatchingValue = (value = "") =>
  String(value || "")
    .split(/\r?\n|;|,(?=\s*[A-Za-z0-9])|\/(?=\s*[A-Za-z0-9])|\band\b|&/i)
    .map((item) => cleanProposalText(item))
    .filter(Boolean);

const normalizeMatchingList = (value) => {
  if (Array.isArray(value)) {
    return uniqueItems(
      value.flatMap((entry) =>
        typeof entry === "string" ? splitMatchingValue(entry) : cleanProposalText(entry),
      ),
    );
  }

  if (typeof value === "string") {
    return uniqueItems(splitMatchingValue(value));
  }

  return [];
};

const normalizeSectionKey = (value = "") => normalizeFieldLabel(value);

const findSectionByLabels = (sections = [], labels = []) => {
  const normalizedLabels = labels.map((label) => normalizeSectionKey(label));
  return (Array.isArray(sections) ? sections : []).find((section) => {
    const sectionKey = normalizeSectionKey(section?.label || section?.key || "");
    return normalizedLabels.some(
      (label) => sectionKey === label || sectionKey.includes(label) || label.includes(sectionKey),
    );
  }) || null;
};

const getSectionItems = (section = null) => {
  if (!section || typeof section !== "object") return [];
  if (Array.isArray(section.items) && section.items.length > 0) {
    return uniqueItems(section.items);
  }

  return normalizeMatchingList(section.value);
};

const parseBudgetRange = (value) => {
  if (value === null || value === undefined || value === "") {
    return { minBudget: null, maxBudget: null, budgetSummary: "" };
  }

  const budgetSummary = cleanProposalText(value);
  if (!budgetSummary) {
    return { minBudget: null, maxBudget: null, budgetSummary: "" };
  }

  const numericMatches = budgetSummary.match(/\d[\d,]*/g) || [];
  const numbers = numericMatches
    .map((entry) => Number(String(entry).replace(/,/g, "")))
    .filter((entry) => Number.isFinite(entry));

  if (numbers.length === 0) {
    return { minBudget: null, maxBudget: null, budgetSummary };
  }

  const [first, second] = numbers;
  if (Number.isFinite(second)) {
    return {
      minBudget: Math.min(first, second),
      maxBudget: Math.max(first, second),
      budgetSummary,
    };
  }

  return {
    minBudget: first,
    maxBudget: first,
    budgetSummary,
  };
};

const inferProjectComplexity = ({
  requiredSkills = [],
  deliverables = [],
  primaryObjectives = [],
  pageCount = "",
}) => {
  const pageCountMatch = String(pageCount || "").match(/\d+/);
  const pageTotal = pageCountMatch ? Number(pageCountMatch[0]) : 0;
  const weightedScope =
    requiredSkills.length * 1.2
    + deliverables.length
    + primaryObjectives.length * 0.8
    + (pageTotal >= 12 ? 3 : pageTotal >= 6 ? 2 : pageTotal >= 1 ? 1 : 0);

  if (weightedScope >= 10) return "High";
  if (weightedScope >= 6) return "Medium";
  return "Low";
};

const inferSeniorityProfile = ({
  complexity = "Medium",
  engagementModel = "",
  timeline = "",
}) => {
  const engagement = cleanProposalText(engagementModel).toLowerCase();
  const normalizedTimeline = cleanProposalText(timeline).toLowerCase();
  const urgentTimeline =
    /\basap\b|\burgent\b|\bimmediate\b/.test(normalizedTimeline)
    || /\b[1-3]\s*(day|days|week|weeks)\b/.test(normalizedTimeline);

  if (complexity === "High" || urgentTimeline) {
    return {
      seniorityLevel: "Senior",
      experienceLevel: "5+ years",
    };
  }

  if (/retainer|ongoing|monthly/.test(engagement)) {
    return {
      seniorityLevel: "Mid-senior",
      experienceLevel: "4+ years",
    };
  }

  return {
    seniorityLevel: "Mid-level",
    experienceLevel: "3+ years",
  };
};

const inferAvailabilityExpectation = ({ timeline = "", engagementModel = "" }) => {
  const normalizedTimeline = cleanProposalText(timeline).toLowerCase();
  const normalizedEngagement = cleanProposalText(engagementModel).toLowerCase();

  if (
    /\basap\b|\burgent\b|\bimmediate\b/.test(normalizedTimeline)
    || /\b[1-3]\s*(day|days|week|weeks)\b/.test(normalizedTimeline)
  ) {
    return "Fast turnaround with regular working-day responsiveness.";
  }

  if (/retainer|ongoing|monthly/.test(normalizedEngagement)) {
    return "Consistent weekly availability for an ongoing engagement.";
  }

  return "Stable availability across the planned delivery timeline.";
};

const buildScreeningQuestions = ({
  requiredSkills = [],
  deliverables = [],
  timeline = "",
  budgetSummary = "",
  targetAudience = "",
}) => {
  const mustHaveQuestions = uniqueItems([
    ...requiredSkills.slice(0, 3).map(
      (skill) => `Can you show relevant project work where you handled ${skill}?`,
    ),
    ...deliverables.slice(0, 2).map(
      (item) => `How would you approach delivering ${String(item || "").toLowerCase()} for this scope?`,
    ),
  ]).slice(0, 5);

  const niceToHaveQuestions = uniqueItems([
    timeline ? `Can you commit to the ${cleanProposalText(timeline).toLowerCase()} timeline?` : "",
    budgetSummary ? `Can you work within ${budgetSummary}?` : "",
    targetAudience
      ? `Have you handled projects for ${cleanProposalText(targetAudience).toLowerCase()} before?`
      : "",
  ]).slice(0, 4);

  const exclusionSignals = uniqueItems([
    requiredSkills.length ? "No credible overlap with the required skills." : "",
    timeline ? `Cannot support the ${cleanProposalText(timeline).toLowerCase()} delivery timeline.` : "",
    budgetSummary ? `Budget expectations conflict with ${budgetSummary}.` : "",
  ]).slice(0, 4);

  return {
    mustHaveQuestions,
    niceToHaveQuestions,
    exclusionSignals,
  };
};

export const buildProjectFreelancerMatchingSeed = (payload = {}) => {
  const proposalJson =
    payload?.proposalJson && typeof payload.proposalJson === "object"
      ? payload.proposalJson
      : buildProjectProposalJson(payload);
  const extractedFields = extractProjectProposalFields({
    ...payload,
    proposalContext:
      payload?.proposalContext
      || (isNonArrayObject(proposalJson?.contextSnapshot) ? proposalJson.contextSnapshot : undefined),
    proposalContent:
      payload?.proposalContent
      || proposalJson?.proposalContent
      || payload?.description
      || "",
  });
  const sections = Array.isArray(proposalJson?.sections) ? proposalJson.sections : [];

  const techStackSection = findSectionByLabels(sections, [
    "Tech Stack",
    "Technology Stack",
    "Technologies",
    "Tools",
  ]);

  const requiredSkills = uniqueItems([
    ...normalizeMatchingList(getSectionItems(techStackSection)),
    ...normalizeMatchingList(extractedFields.frontendFramework),
    ...normalizeMatchingList(extractedFields.backendTechnology),
    ...normalizeMatchingList(extractedFields.databaseType),
    ...normalizeMatchingList(extractedFields.hosting),
    ...normalizeMatchingList(extractedFields.websiteBuildType),
    ...normalizeMatchingList(extractedFields.platformRequirements),
  ]).slice(0, 12);

  const deliverables = uniqueItems([
    ...normalizeMatchingList(extractedFields.featuresDeliverables),
    ...normalizeMatchingList(extractedFields.brandDeliverables),
    ...normalizeMatchingList(extractedFields.appFeatures),
  ]).slice(0, 14);

  const serviceSpecializations = uniqueItems([
    extractedFields.serviceType,
    extractedFields.websiteType,
    extractedFields.websiteBuildType,
    extractedFields.creativeType,
    extractedFields.appType,
    extractedFields.businessCategory,
    extractedFields.designStyle,
  ]).slice(0, 10);

  const industriesOrNiches = uniqueItems([
    extractedFields.businessCategory,
    extractedFields.targetAudience,
    ...normalizeMatchingList(extractedFields.targetLocations),
  ]).slice(0, 10);

  const targetAudienceList = uniqueItems(
    extractedFields.targetAudience ? [extractedFields.targetAudience] : [],
  );
  const targetLocations = normalizeMatchingList(extractedFields.targetLocations).slice(0, 10);
  const seoGoals = normalizeMatchingList(extractedFields.seoGoals).slice(0, 10);
  const primaryObjectives = normalizeMatchingList(extractedFields.primaryObjectives).slice(0, 10);
  const platformRequirements = normalizeMatchingList(extractedFields.platformRequirements).slice(0, 10);

  const budgetSummary =
    cleanProposalText(extractedFields.budgetSummary)
    || cleanProposalText(payload?.budgetSummary)
    || cleanProposalText(payload?.budget);
  const { minBudget, maxBudget } = parseBudgetRange(budgetSummary);

  const summary =
    cleanProposalText(extractedFields.projectOverview)
    || cleanProposalText(payload?.description)
    || cleanProposalText(proposalJson?.proposalContent)
    || "";
  const complexity = inferProjectComplexity({
    requiredSkills,
    deliverables,
    primaryObjectives,
    pageCount: extractedFields.pageCount,
  });
  const { seniorityLevel, experienceLevel } = inferSeniorityProfile({
    complexity,
    engagementModel: extractedFields.engagementModel,
    timeline: extractedFields.timeline,
  });
  const availabilityExpectation = inferAvailabilityExpectation({
    timeline: extractedFields.timeline,
    engagementModel: extractedFields.engagementModel,
  });
  const screening = buildScreeningQuestions({
    requiredSkills,
    deliverables,
    timeline: extractedFields.timeline,
    budgetSummary,
    targetAudience: extractedFields.targetAudience,
  });
  const title = cleanProposalText(payload?.title || proposalJson?.title || "");
  const serviceKey = cleanProposalText(payload?.serviceKey || extractedFields.serviceKey || proposalJson?.serviceKey || "");
  const serviceType = cleanProposalText(
    extractedFields.serviceType || payload?.serviceType || payload?.serviceName || payload?.service || "",
  );

  if (
    !title
    && !summary
    && !serviceKey
    && !serviceType
    && requiredSkills.length === 0
    && deliverables.length === 0
  ) {
    return null;
  }

  return {
    version: 1,
    visibility: "internal",
    source: "proposal-seed",
    project: {
      title: title || null,
      serviceKey: serviceKey || null,
      serviceType: serviceType || null,
      clientName: cleanProposalText(extractedFields.clientName || payload?.clientName || "") || null,
      businessName: cleanProposalText(extractedFields.businessName || payload?.businessName || "") || null,
      summary: summary || null,
      budgetSummary: budgetSummary || null,
      timeline: cleanProposalText(extractedFields.timeline || extractedFields.duration || "") || null,
      engagementModel: cleanProposalText(extractedFields.engagementModel || "") || null,
      complexity,
    },
    matchingQuery: {
      category: serviceKey || null,
      searchTerm: summary || serviceType || title || null,
      techStack: requiredSkills,
      serviceSpecializations,
      industriesOrNiches,
      minBudget,
      maxBudget,
    },
    fitProfile: {
      requiredSkills,
      preferredSkills: uniqueItems([
        cleanProposalText(extractedFields.designStyle || ""),
        cleanProposalText(extractedFields.hosting || ""),
        cleanProposalText(extractedFields.targetAudience || ""),
      ]).slice(0, 8),
      deliverables,
      primaryObjectives,
      targetAudience: targetAudienceList,
      targetLocations,
      seoGoals,
      platformRequirements,
      seniorityLevel,
      experienceLevel,
      availabilityExpectation,
      communicationNeeds: uniqueItems([
        targetAudienceList.length
          ? `Comfortable serving ${targetAudienceList.join(", ").toLowerCase()}.`
          : "",
        targetLocations.length
          ? `Aligned with the target market in ${targetLocations.join(", ")}.`
          : "",
        cleanProposalText(extractedFields.engagementModel || "")
          ? `Can support a ${cleanProposalText(extractedFields.engagementModel).toLowerCase()} collaboration model.`
          : "",
      ]).slice(0, 6),
    },
    screening,
  };
};
