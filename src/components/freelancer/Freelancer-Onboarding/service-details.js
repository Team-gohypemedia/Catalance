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
    const subCategoryId = toPositiveInteger(entry?.subCategoryId);
    if (!subCategoryId || seen.has(subCategoryId)) {
      return accumulator;
    }

    seen.add(subCategoryId);
    accumulator.push({
      subCategoryId,
      selectedToolIds: normalizeIntegerArray(entry?.selectedToolIds),
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

export const createEmptyServiceCaseStudy = () => ({
  title: "",
  description: "",
  projectLink: "",
  projectFile: null,
  role: "",
  timeline: "",
  budget: "",
  niche: "",
});

export const createEmptyServiceDraft = ({
  serviceKey = "",
  serviceId = null,
} = {}) => ({
  serviceKey: normalizeServiceKey(serviceKey),
  serviceId: toPositiveInteger(serviceId),
  title: "",
  subcategories: [],
  skillsAndTechnologies: [],
  experience: "",
  complexity: "",
  description: "",
  deliveryTimeline: "",
  priceRange: "",
  coverImage: "",
  keywords: [],
  mediaFiles: [],
  caseStudy: createEmptyServiceCaseStudy(),
  niches: [],
  platformLinks: {},
  activeSkillCategory: null,
  pendingCategoryLabels: [],
});

export const normalizeServiceDraft = (
  detail = {},
  { serviceKey = "", serviceId = null } = {},
) => {
  const source = isPlainObject(detail) ? detail : {};
  const fallback = createEmptyServiceDraft({ serviceKey, serviceId });
  const normalizedKey = normalizeServiceKey(source.serviceKey || fallback.serviceKey);

  return {
    ...source,
    serviceKey: normalizedKey,
    serviceId: toPositiveInteger(source.serviceId ?? fallback.serviceId),
    title: toDraftText(source.title),
    subcategories: normalizeSubcategories(source.subcategories),
    skillsAndTechnologies: normalizeStringArray(source.skillsAndTechnologies),
    experience: toOptionalString(source.experience || source.experienceYears),
    complexity: toOptionalString(
      source.complexity ||
        source.serviceComplexity ||
        source.projectComplexity,
    ),
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
    caseStudy: isPlainObject(source.caseStudy)
      ? {
          ...createEmptyServiceCaseStudy(),
          ...source.caseStudy,
        }
      : createEmptyServiceCaseStudy(),
    niches: normalizeStringArray(source.niches),
    platformLinks: isPlainObject(source.platformLinks)
      ? { ...source.platformLinks }
      : {},
    activeSkillCategory: toPositiveInteger(source.activeSkillCategory),
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

export const syncDraftSubcategories = (draft = {}, selectedSubCategoryIds = []) => {
  const normalizedDraft = normalizeServiceDraft(draft, {
    serviceKey: draft?.serviceKey,
    serviceId: draft?.serviceId,
  });
  const nextSelectedIds = normalizeIntegerArray(selectedSubCategoryIds);
  const existingById = new Map(
    normalizedDraft.subcategories.map((entry) => [entry.subCategoryId, entry]),
  );
  const nextSubcategories = nextSelectedIds.map((subCategoryId) => {
    const existingEntry = existingById.get(subCategoryId);
    return existingEntry
      ? {
          subCategoryId,
          selectedToolIds: normalizeIntegerArray(existingEntry.selectedToolIds),
          customSkillNames: normalizeCustomSkillNames(existingEntry.customSkillNames),
        }
      : {
          subCategoryId,
          selectedToolIds: [],
          customSkillNames: [],
        };
  });

  const activeSkillCategory = nextSubcategories.some(
    (entry) => entry.subCategoryId === normalizedDraft.activeSkillCategory,
  )
    ? normalizedDraft.activeSkillCategory
    : nextSubcategories[0]?.subCategoryId || null;

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
    toPositiveInteger(normalizedDraft.activeSkillCategory) ||
    normalizedDraft.subcategories[0]?.subCategoryId ||
    null;

  return {
    activeCategoryId,
    activeSubcategory:
      normalizedDraft.subcategories.find(
        (entry) => entry.subCategoryId === activeCategoryId,
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
  complexityLabelsByKey = {},
  deliveryLabelsByKey = {},
  priceLabelsByKey = {},
} = {}) => {
  const normalizedDraft = normalizeServiceDraft(draft, {
    serviceKey: draft?.serviceKey,
    serviceId,
  });
  const primaryImage = getPrimaryImageFromMediaFiles(normalizedDraft.mediaFiles);
  const primaryImageUrl = toOptionalString(
    primaryImage?.uploadedUrl || primaryImage?.url,
  );
  const nextCaseStudy =
    isPlainObject(normalizedDraft.caseStudy) &&
    hasMeaningfulValue(normalizedDraft.caseStudy)
      ? { ...normalizedDraft.caseStudy }
      : null;

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
    serviceComplexity:
      toOptionalString(
        complexityLabelsByKey[normalizedDraft.complexity] ||
          normalizedDraft.complexity,
      ) || null,
    serviceDescription: toOptionalString(normalizedDraft.description) || null,
    deliveryTime:
      toOptionalString(
        deliveryLabelsByKey[normalizedDraft.deliveryTimeline] ||
          normalizedDraft.deliveryTimeline,
      ) || null,
    averageProjectPrice:
      toOptionalString(
        priceLabelsByKey[normalizedDraft.priceRange] || normalizedDraft.priceRange,
      ) || null,
    coverImage: toOptionalString(normalizedDraft.coverImage || primaryImageUrl) || null,
    keywords: normalizeStringArray(normalizedDraft.keywords).slice(0, 5),
    media: Array.isArray(normalizedDraft.mediaFiles)
      ? normalizedDraft.mediaFiles.slice(0, 3)
      : [],
    caseStudy: nextCaseStudy,
    niches: normalizeStringArray(normalizedDraft.niches),
    platformLinks: isPlainObject(normalizedDraft.platformLinks)
      ? { ...normalizedDraft.platformLinks }
      : {},
  };
};
