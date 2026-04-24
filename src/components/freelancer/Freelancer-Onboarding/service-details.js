const isPlainObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value);

const toOptionalString = (value) => {
  const normalized = String(value || "").trim();
  return normalized || "";
};

const toDraftText = (value) => String(value ?? "");

const toPositiveInteger = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const createDraftId = (prefix = "draft") =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const buildCatalogSubcategoryKey = (value) => {
  const subCategoryId = toPositiveInteger(value);
  return subCategoryId ? `catalog:${subCategoryId}` : "";
};

const parseCatalogSubcategoryId = (value = "") => {
  const rawValue = String(value || "").trim();
  if (!rawValue) {
    return null;
  }

  const directId = toPositiveInteger(rawValue);
  if (directId) {
    return directId;
  }

  const matchedCatalogId = rawValue.match(/^catalog:(\d+)$/i)?.[1];
  return toPositiveInteger(matchedCatalogId);
};

const normalizeActiveSkillCategoryValue = (value = "") =>
  buildCatalogSubcategoryKey(value) || String(value || "").trim();

export const normalizeStringArray = (values) => {
  if (!Array.isArray(values)) {
    return [];
  }

  const seen = new Set();
  return values.reduce((accumulator, value) => {
    const normalizedValue = String(value || "").trim();
    if (!normalizedValue) {
      return accumulator;
    }

    const dedupKey = normalizedValue.toLowerCase();
    if (seen.has(dedupKey)) {
      return accumulator;
    }

    seen.add(dedupKey);
    accumulator.push(normalizedValue);
    return accumulator;
  }, []);
};

export const normalizeCustomSkillNames = (values) =>
  normalizeStringArray(values);

export const getSubcategorySelectionKey = (value = {}) => {
  const source = isPlainObject(value) ? value : {};
  return (
    buildCatalogSubcategoryKey(source.subCategoryId) ||
    String(source.subCategoryKey || source.key || "").trim()
  );
};

export const createCustomServiceSubcategory = ({
  label = "",
  subCategoryKey = createDraftId("subcategory"),
} = {}) => ({
  subCategoryId: null,
  subCategoryKey: String(subCategoryKey || createDraftId("subcategory")).trim(),
  label: toOptionalString(label),
  isCustom: true,
  selectedToolIds: [],
  customSkillNames: [],
});

export const normalizeServiceKey = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const normalizeIntegerArray = (values) => {
  if (!Array.isArray(values)) {
    return [];
  }

  const seen = new Set();
  return values.reduce((accumulator, value) => {
    const normalizedValue = toPositiveInteger(value);
    if (!normalizedValue || seen.has(normalizedValue)) {
      return accumulator;
    }

    seen.add(normalizedValue);
    accumulator.push(normalizedValue);
    return accumulator;
  }, []);
};

const normalizePendingCategoryLabels = (values) =>
  normalizeStringArray(Array.isArray(values) ? values : []);

const normalizeSubcategories = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set();
  return value.reduce((accumulator, entry) => {
    const subCategoryId =
      toPositiveInteger(entry?.subCategoryId) ||
      parseCatalogSubcategoryId(entry?.subCategoryKey);
    const label = toOptionalString(
      entry?.label || entry?.subCategoryLabel || entry?.name,
    );
    const subCategoryKey =
      buildCatalogSubcategoryKey(subCategoryId) ||
      String(entry?.subCategoryKey || entry?.key || "").trim() ||
      createDraftId("subcategory");
    const isCustom = !subCategoryId || Boolean(entry?.isCustom);
    const dedupKey = subCategoryId
      ? subCategoryKey
      : `custom:${label.toLowerCase() || subCategoryKey.toLowerCase()}`;

    if ((!subCategoryId && !label) || seen.has(dedupKey)) {
      return accumulator;
    }

    seen.add(dedupKey);
    accumulator.push({
      subCategoryId,
      subCategoryKey,
      label,
      isCustom,
      selectedToolIds: subCategoryId
        ? normalizeIntegerArray(entry?.selectedToolIds)
        : [],
      customSkillNames: normalizeCustomSkillNames(entry?.customSkillNames),
    });
    return accumulator;
  }, []);
};

const hasMeaningfulValue = (value) => {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.some((entry) => hasMeaningfulValue(entry));
  }

  if (isPlainObject(value)) {
    return Object.values(value).some((entry) => hasMeaningfulValue(entry));
  }

  return value !== null && value !== undefined;
};

const hasMeaningfulCaseStudyContent = (caseStudy = {}) => {
  const source = isPlainObject(caseStudy) ? caseStudy : {};

  return [
    source.title,
    source.description,
    source.projectLink,
    source.projectFile,
    source.role,
    source.timeline,
    source.budget,
    source.niche,
  ].some((entry) => hasMeaningfulValue(entry));
};

export const createEmptyServiceCaseStudy = ({
  id = createDraftId("case-study"),
} = {}) => ({
  id: String(id || createDraftId("case-study")).trim(),
  title: "",
  description: "",
  projectLink: "",
  projectFile: null,
  role: "",
  timeline: "",
  budget: "",
  niche: "",
});

const normalizeServiceCaseStudy = (value = {}, { fallbackId } = {}) => {
  const source = isPlainObject(value) ? value : {};
  const resolvedId =
    String(source.id || source.caseStudyId || fallbackId || "").trim() ||
    createDraftId("case-study");

  return {
    ...createEmptyServiceCaseStudy({ id: resolvedId }),
    ...source,
    id: resolvedId,
    title: toDraftText(source.title),
    description: toDraftText(source.description),
    projectLink: toOptionalString(source.projectLink),
    projectFile: source.projectFile ?? null,
    role: toOptionalString(source.role),
    timeline: toOptionalString(source.timeline),
    budget: toOptionalString(source.budget),
    niche: toOptionalString(source.niche),
  };
};

const normalizeServiceCaseStudies = (values, fallbackCaseStudy) => {
  const rawEntries = Array.isArray(values)
    ? values.filter((entry) => isPlainObject(entry))
    : [];
  const normalizedEntries = [];
  const seenIds = new Set();

  const pushEntry = (entry, index) => {
    const normalizedEntry = normalizeServiceCaseStudy(entry, {
      fallbackId: `case-study-${index + 1}`,
    });
    let resolvedId = normalizedEntry.id;

    while (seenIds.has(resolvedId)) {
      resolvedId = createDraftId("case-study");
    }

    seenIds.add(resolvedId);
    normalizedEntries.push({
      ...normalizedEntry,
      id: resolvedId,
    });
  };

  if (rawEntries.length > 0) {
    rawEntries.forEach((entry, index) => pushEntry(entry, index));
  } else if (isPlainObject(fallbackCaseStudy)) {
    pushEntry(fallbackCaseStudy, 0);
  }

  if (!normalizedEntries.length) {
    normalizedEntries.push(createEmptyServiceCaseStudy());
  }

  return normalizedEntries;
};

export const createEmptyServiceDraft = ({
  serviceKey = "",
  serviceId = null,
} = {}) => {
  const initialCaseStudy = createEmptyServiceCaseStudy();

  return {
    serviceKey: normalizeServiceKey(serviceKey),
    serviceId: toPositiveInteger(serviceId),
    title: "",
    subcategories: [],
    skillsAndTechnologies: [],
    experience: "",

    description: "",
    deliveryTimeline: "",
    priceRange: "",
    coverImage: "",
    keywords: [],
    mediaFiles: [],
    caseStudy: initialCaseStudy,
    caseStudies: [initialCaseStudy],
    activeCaseStudyId: initialCaseStudy.id,
    niches: [],
    platformLinks: {},
    activeSkillCategory: null,
    pendingCategoryLabels: [],
  };
};

export const normalizeServiceDraft = (
  detail = {},
  { serviceKey = "", serviceId = null } = {},
) => {
  const source = isPlainObject(detail) ? detail : {};
  const fallback = createEmptyServiceDraft({ serviceKey, serviceId });
  const normalizedKey = normalizeServiceKey(source.serviceKey || fallback.serviceKey);
  const normalizedCaseStudies = normalizeServiceCaseStudies(
    source.caseStudies,
    source.caseStudy,
  );
  const normalizedSubcategories = normalizeSubcategories(source.subcategories);
  const requestedActiveCaseStudyId = String(source.activeCaseStudyId || "").trim();
  const requestedActiveSkillCategory = normalizeActiveSkillCategoryValue(
    source.activeSkillCategory,
  );
  const activeCaseStudy =
    normalizedCaseStudies.find((entry) => entry.id === requestedActiveCaseStudyId) ||
    normalizedCaseStudies[0] ||
    createEmptyServiceCaseStudy();
  const primaryCaseStudy =
    normalizedCaseStudies[0] || activeCaseStudy || createEmptyServiceCaseStudy();

  return {
    serviceKey: normalizedKey,
    serviceId: toPositiveInteger(source.serviceId ?? fallback.serviceId),
    title: toDraftText(source.title),
    subcategories: normalizedSubcategories,
    skillsAndTechnologies: normalizeStringArray(source.skillsAndTechnologies),
    experience: toOptionalString(source.experience || source.experienceYears),

    description: toDraftText(
      source.description || source.serviceDescription,
    ),
    deliveryTimeline: toOptionalString(
      source.deliveryTimeline || source.deliveryTime,
    ),
    priceRange: toOptionalString(
      source.priceRange || source.averageProjectPrice || source.averagePrice,
    ),
    coverImage: toOptionalString(source.coverImage),
    keywords: normalizeStringArray(source.keywords),
    mediaFiles: Array.isArray(source.mediaFiles)
      ? [...source.mediaFiles]
      : Array.isArray(source.media)
        ? [...source.media]
        : Array.isArray(source.serviceMedia)
          ? [...source.serviceMedia]
        : [],
    caseStudy: primaryCaseStudy,
    caseStudies: normalizedCaseStudies,
    activeCaseStudyId: activeCaseStudy.id,
    niches: normalizeStringArray(source.niches),
    platformLinks: isPlainObject(source.platformLinks)
      ? { ...source.platformLinks }
      : {},
    activeSkillCategory: normalizedSubcategories.some(
      (entry) => entry.subCategoryKey === requestedActiveSkillCategory,
    )
      ? requestedActiveSkillCategory
      : normalizedSubcategories[0]?.subCategoryKey || null,
    pendingCategoryLabels: normalizePendingCategoryLabels(
      source.pendingCategoryLabels || source.legacyCategoryLabels,
    ),
  };
};

export const resolveServiceCatalogEntry = (services = [], value = "") => {
  const normalizedValue = normalizeServiceKey(value);
  const rawStringValue = String(value || "").trim();

  return (Array.isArray(services) ? services : []).find((service) => {
    const serviceId = String(service?.id || "").trim();
    const serviceKey = normalizeServiceKey(service?.key || service?.value || "");
    const serviceName = normalizeServiceKey(service?.name || service?.label || "");

    return (
      (rawStringValue && serviceId === rawStringValue) ||
      (normalizedValue && serviceKey === normalizedValue) ||
      (normalizedValue && serviceName === normalizedValue)
    );
  }) || null;
};

export const resolveServiceKey = (services = [], value = "") => {
  const resolvedService = resolveServiceCatalogEntry(services, value);
  if (resolvedService?.key) {
    return normalizeServiceKey(resolvedService.key);
  }

  if (resolvedService?.name) {
    return normalizeServiceKey(resolvedService.name);
  }

  return normalizeServiceKey(value);
};

export const getServiceCatalogMeta = (services = [], value = "") => {
  const service = resolveServiceCatalogEntry(services, value);
  return {
    serviceKey: resolveServiceKey(services, value),
    serviceId: toPositiveInteger(service?.id),
    serviceName: String(service?.name || service?.label || "").trim(),
  };
};

export const appendCustomSubcategorySelection = (draft = {}, label = "") => {
  const normalizedLabel = toOptionalString(label);
  const normalizedDraft = normalizeServiceDraft(draft, {
    serviceKey: draft?.serviceKey,
    serviceId: draft?.serviceId,
  });

  if (!normalizedLabel) {
    return normalizedDraft;
  }

  const existingEntry = normalizedDraft.subcategories.find(
    (entry) => String(entry?.label || "").toLowerCase() === normalizedLabel.toLowerCase(),
  );
  if (existingEntry) {
    return {
      ...normalizedDraft,
      activeSkillCategory: existingEntry.subCategoryKey,
      pendingCategoryLabels: [],
    };
  }

  const customSubcategory = createCustomServiceSubcategory({ label: normalizedLabel });

  return {
    ...normalizedDraft,
    subcategories: [...normalizedDraft.subcategories, customSubcategory],
    activeSkillCategory: customSubcategory.subCategoryKey,
    pendingCategoryLabels: [],
  };
};

export const syncDraftSubcategories = (draft = {}, selectedSubCategoryValues = []) => {
  const normalizedDraft = normalizeServiceDraft(draft, {
    serviceKey: draft?.serviceKey,
    serviceId: draft?.serviceId,
  });
  const nextSelectedKeys = normalizeStringArray(
    (Array.isArray(selectedSubCategoryValues) ? selectedSubCategoryValues : []).map(
      (value) =>
        buildCatalogSubcategoryKey(value) || String(value || "").trim(),
    ),
  );
  const existingById = new Map(
    normalizedDraft.subcategories.map((entry) => [
      getSubcategorySelectionKey(entry),
      entry,
    ]),
  );
  const nextSubcategories = nextSelectedKeys
    .map((selectionKey) => {
      const existingEntry = existingById.get(selectionKey);
      if (existingEntry) {
        return {
          subCategoryId: toPositiveInteger(existingEntry.subCategoryId),
          subCategoryKey: getSubcategorySelectionKey(existingEntry),
          label: toOptionalString(existingEntry.label),
          isCustom: Boolean(existingEntry.isCustom) || !existingEntry.subCategoryId,
          selectedToolIds: normalizeIntegerArray(existingEntry.selectedToolIds),
          customSkillNames: normalizeCustomSkillNames(existingEntry.customSkillNames),
        };
      }

      const subCategoryId = parseCatalogSubcategoryId(selectionKey);
      if (!subCategoryId) {
        return null;
      }

      return {
        subCategoryId,
        subCategoryKey: buildCatalogSubcategoryKey(subCategoryId),
        label: "",
        isCustom: false,
        selectedToolIds: [],
        customSkillNames: [],
      };
    })
    .filter(Boolean);

  const activeSkillCategory = nextSubcategories.some(
    (entry) => entry.subCategoryKey === normalizedDraft.activeSkillCategory,
  )
    ? normalizedDraft.activeSkillCategory
    : nextSubcategories[0]?.subCategoryKey || null;

  return {
    ...normalizedDraft,
    subcategories: nextSubcategories,
    activeSkillCategory,
    pendingCategoryLabels: [],
  };
};

export const getActiveSubcategoryEntry = (draft = {}) => {
  const normalizedDraft = normalizeServiceDraft(draft, {
    serviceKey: draft?.serviceKey,
    serviceId: draft?.serviceId,
  });
  const activeCategoryId =
    normalizeActiveSkillCategoryValue(normalizedDraft.activeSkillCategory) ||
    normalizedDraft.subcategories[0]?.subCategoryKey ||
    null;

  return {
    activeCategoryId,
    activeSubcategory:
      normalizedDraft.subcategories.find(
        (entry) => entry.subCategoryKey === activeCategoryId,
      ) || null,
  };
};

export const deriveDraftSkillsAndTechnologies = (
  draft = {},
  toolOptionsByCategory = {},
) => {
  const normalizedDraft = normalizeServiceDraft(draft, {
    serviceKey: draft?.serviceKey,
    serviceId: draft?.serviceId,
  });
  const toolNameById = new Map();

  Object.values(toolOptionsByCategory || {}).forEach((options) => {
    (Array.isArray(options) ? options : []).forEach((option) => {
      const toolId = toPositiveInteger(option?.id);
      const toolName = String(option?.name || option?.label || "").trim();
      if (toolId && toolName) {
        toolNameById.set(toolId, toolName);
      }
    });
  });

  const derivedSkills = [];
  let hasUnresolvedToolSelection = false;

  normalizedDraft.subcategories.forEach((subcategory) => {
    subcategory.selectedToolIds.forEach((toolId) => {
      const toolName = toolNameById.get(toolId);
      if (toolName) {
        derivedSkills.push(toolName);
      } else {
        hasUnresolvedToolSelection = true;
      }
    });

    derivedSkills.push(...subcategory.customSkillNames);
  });

  if (hasUnresolvedToolSelection) {
    derivedSkills.push(...normalizedDraft.skillsAndTechnologies);
  }

  return normalizeStringArray(derivedSkills);
};

export const getPrimaryImageFromMediaFiles = (mediaFiles = []) =>
  (Array.isArray(mediaFiles) ? mediaFiles : []).find((entry) => {
    const kind = String(entry?.kind || "").trim().toLowerCase();
    const mimeType = String(
      entry?.mimeType || entry?.type || entry?.contentType || "",
    )
      .trim()
      .toLowerCase();

    return kind !== "video" && !mimeType.startsWith("video/");
  }) || null;

export const serializeServiceDraft = ({
  draft = {},
  serviceId = null,
  experienceLabelsByKey = {},
  deliveryLabelsByKey = {},
} = {}) => {
  const normalizedDraft = normalizeServiceDraft(draft, {
    serviceKey: draft?.serviceKey,
    serviceId,
  });
  const primaryImage = getPrimaryImageFromMediaFiles(normalizedDraft.mediaFiles);
  const primaryImageUrl = toOptionalString(
    primaryImage?.uploadedUrl || primaryImage?.url,
  );
  const nextCaseStudies = Array.isArray(normalizedDraft.caseStudies)
    ? normalizedDraft.caseStudies
        .filter((caseStudy) => hasMeaningfulCaseStudyContent(caseStudy))
        .map((caseStudy) => ({ ...caseStudy }))
    : [];
  const nextCaseStudy = nextCaseStudies[0] || null;
  const activeCaseStudyId = nextCaseStudies.some(
    (caseStudy) => caseStudy.id === normalizedDraft.activeCaseStudyId,
  )
    ? normalizedDraft.activeCaseStudyId
    : nextCaseStudies[0]?.id || null;

  return {
    serviceKey: normalizedDraft.serviceKey,
    serviceId: toPositiveInteger(normalizedDraft.serviceId ?? serviceId),
    title: toOptionalString(normalizedDraft.title),
    subcategories: normalizeSubcategories(normalizedDraft.subcategories),
    skillsAndTechnologies: normalizeStringArray(
      normalizedDraft.skillsAndTechnologies,
    ),
    experienceYears:
      toOptionalString(
        experienceLabelsByKey[normalizedDraft.experience] ||
          normalizedDraft.experience,
      ) || null,

    serviceDescription: toOptionalString(normalizedDraft.description) || null,
    deliveryTime:
      toOptionalString(
        deliveryLabelsByKey[normalizedDraft.deliveryTimeline] ||
          normalizedDraft.deliveryTimeline,
      ) || null,
    averageProjectPrice:
      toOptionalString(normalizedDraft.priceRange) || null,
    coverImage: toOptionalString(normalizedDraft.coverImage || primaryImageUrl) || null,
    keywords: normalizeStringArray(normalizedDraft.keywords).slice(0, 5),
    media: Array.isArray(normalizedDraft.mediaFiles)
      ? normalizedDraft.mediaFiles.slice(0, 3)
      : [],
    caseStudy: nextCaseStudy,
    caseStudies: nextCaseStudies,
    activeCaseStudyId,
    niches: normalizeStringArray(normalizedDraft.niches),
    platformLinks: isPlainObject(normalizedDraft.platformLinks)
      ? { ...normalizedDraft.platformLinks }
      : {},
    activeSkillCategory:
      toOptionalString(normalizedDraft.activeSkillCategory) || null,
  };
};
