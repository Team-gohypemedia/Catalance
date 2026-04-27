const isPlainObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value);

const toOptionalString = (value) => {
  const normalized = String(value || "").trim();
  return normalized || "";
};

const toPositiveInteger = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

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

export const normalizeServiceKey = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

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

export const normalizeServiceSubcategories = (value) => {
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
      toOptionalString(entry?.subCategoryKey || entry?.key || entry?.id) ||
      `subcategory-${accumulator.length + 1}`;
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
      customSkillNames: normalizeStringArray(entry?.customSkillNames),
    });
    return accumulator;
  }, []);
};

const buildToolRowsByIdMap = (toolRows = []) =>
  new Map(
    (Array.isArray(toolRows) ? toolRows : [])
      .map((tool) => {
        const toolId = toPositiveInteger(tool?.id);
        if (!toolId) {
          return null;
        }

        return [
          toolId,
          {
            id: toolId,
            subCategoryId: toPositiveInteger(tool?.subCategoryId),
            name: toOptionalString(tool?.name),
          },
        ];
      })
      .filter(Boolean),
  );

export const deriveServiceSkillLabels = ({
  subcategories = [],
  toolRowsById = new Map(),
  existingSkillsAndTechnologies = [],
}) => {
  const normalizedSubcategories = normalizeServiceSubcategories(subcategories);
  const resolvedSkillLabels = [];
  let hasUnresolvedToolSelection = false;

  normalizedSubcategories.forEach((subcategory) => {
    subcategory.selectedToolIds.forEach((toolId) => {
      const toolRow = toolRowsById.get(toolId);
      if (toolRow?.name) {
        resolvedSkillLabels.push(toolRow.name);
      } else {
        hasUnresolvedToolSelection = true;
      }
    });

    resolvedSkillLabels.push(...subcategory.customSkillNames);
  });

  if (hasUnresolvedToolSelection) {
    resolvedSkillLabels.push(...normalizeStringArray(existingSkillsAndTechnologies));
  }

  return normalizeStringArray(resolvedSkillLabels);
};

const normalizeServiceCaseStudy = (value = {}, { fallbackId } = {}) => {
  const source = isPlainObject(value) ? value : {};

  return {
    ...source,
    id: toOptionalString(source.id || source.caseStudyId || fallbackId),
    title: toOptionalString(source.title),
    description: toOptionalString(source.description),
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
    let resolvedId = normalizedEntry.id || `case-study-${index + 1}`;

    while (seenIds.has(resolvedId)) {
      resolvedId = `${resolvedId}-${index + 1}`;
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

  return normalizedEntries;
};

export const normalizeCanonicalServiceDetail = ({
  serviceKey = "",
  detail = {},
  serviceIdByKey = new Map(),
  toolRowsById = new Map(),
}) => {
  const source = isPlainObject(detail) ? detail : {};
  const normalizedServiceKey = normalizeServiceKey(
    source.serviceKey || serviceKey,
  );
  const subcategories = normalizeServiceSubcategories(source.subcategories);
  const caseStudies = normalizeServiceCaseStudies(
    source.caseStudies,
    source.caseStudy,
  );
  const activeCaseStudyId = caseStudies.some(
    (caseStudy) => caseStudy.id === toOptionalString(source.activeCaseStudyId),
  )
    ? toOptionalString(source.activeCaseStudyId)
    : caseStudies[0]?.id || null;
  const activeSkillCategory = normalizeActiveSkillCategoryValue(
    source.activeSkillCategory,
  );

  return {
    serviceKey: normalizedServiceKey,
    serviceId:
      toPositiveInteger(source.serviceId) ||
      toPositiveInteger(serviceIdByKey.get(normalizedServiceKey)),
    title: toOptionalString(source.title),
    subcategories,
    skillsAndTechnologies: deriveServiceSkillLabels({
      subcategories,
      toolRowsById,
      existingSkillsAndTechnologies: source.skillsAndTechnologies,
    }),
    experienceYears: toOptionalString(source.experienceYears),
    serviceDescription: toOptionalString(source.serviceDescription),
    deliveryTime: toOptionalString(source.deliveryTime),
    averageProjectPrice: toOptionalString(
      source.averageProjectPrice || source.averagePrice,
    ),
    coverImage: toOptionalString(source.coverImage),
    keywords: normalizeStringArray(source.keywords),
    media: Array.isArray(source.media)
      ? [...source.media]
      : Array.isArray(source.mediaFiles)
        ? [...source.mediaFiles]
        : [],
    caseStudy: caseStudies[0] || null,
    caseStudies,
    activeCaseStudyId,
    activeSkillCategory: subcategories.some(
      (subcategory) => subcategory.subCategoryKey === activeSkillCategory,
    )
      ? activeSkillCategory
      : subcategories[0]?.subCategoryKey || null,
    niches: normalizeStringArray(source.niches),
    platformLinks: isPlainObject(source.platformLinks)
      ? { ...source.platformLinks }
      : {},
  };
};

export const buildCanonicalProfileDetails = ({
  profileDetails = {},
  serviceRows = [],
  toolRows = [],
}) => {
  const normalizedProfileDetails = isPlainObject(profileDetails) ? profileDetails : {};
  const rawServiceDetails = isPlainObject(normalizedProfileDetails.serviceDetails)
    ? normalizedProfileDetails.serviceDetails
    : {};
  const normalizedServices = normalizeStringArray(
    Array.isArray(normalizedProfileDetails.services) &&
      normalizedProfileDetails.services.length > 0
      ? normalizedProfileDetails.services.map((serviceKey) =>
          normalizeServiceKey(serviceKey),
        )
      : Object.keys(rawServiceDetails).map((serviceKey) =>
          normalizeServiceKey(serviceKey),
        ),
  );

  const serviceIdByKey = new Map(
    (Array.isArray(serviceRows) ? serviceRows : [])
      .map((service) => {
        const normalizedServiceKey = normalizeServiceKey(
          service?.key || service?.name,
        );
        const serviceId = toPositiveInteger(service?.id);
        if (!normalizedServiceKey || !serviceId) {
          return null;
        }

        return [normalizedServiceKey, serviceId];
      })
      .filter(Boolean),
  );
  const toolRowsById = buildToolRowsByIdMap(toolRows);
  const nextServiceDetails = {};

  normalizedServices.forEach((serviceKey) => {
    const currentDetail =
      rawServiceDetails?.[serviceKey] && isPlainObject(rawServiceDetails[serviceKey])
        ? rawServiceDetails[serviceKey]
        : {};

    nextServiceDetails[serviceKey] = normalizeCanonicalServiceDetail({
      serviceKey,
      detail: currentDetail,
      serviceIdByKey,
      toolRowsById,
    });
  });

  const nextProfileDetails = {
    ...normalizedProfileDetails,
    profileDetailsVersion: 2,
    services: normalizedServices,
    serviceDetails: nextServiceDetails,
  };

  delete nextProfileDetails.serviceSubcategorySkills;
  delete nextProfileDetails.serviceActiveSkillCategory;

  return nextProfileDetails;
};

export const deriveTopLevelSkillsFromProfileDetails = (profileDetails = {}) => {
  const serviceDetails = isPlainObject(profileDetails.serviceDetails)
    ? profileDetails.serviceDetails
    : {};

  return normalizeStringArray(
    Object.values(serviceDetails).flatMap((detail) =>
      Array.isArray(detail?.skillsAndTechnologies)
        ? detail.skillsAndTechnologies
        : [],
    ),
  );
};

export const buildPrimaryServiceSnapshot = ({
  profileDetails = {},
  subCategoryRows = [],
  existingValues = {},
}) => {
  const serviceKeys = Array.isArray(profileDetails.services)
    ? profileDetails.services
    : [];
  const primaryServiceKey = normalizeServiceKey(serviceKeys[0]);
  const primaryDetail =
    primaryServiceKey &&
    isPlainObject(profileDetails.serviceDetails?.[primaryServiceKey])
      ? profileDetails.serviceDetails[primaryServiceKey]
      : null;
  const subCategoryNameById = new Map(
    (Array.isArray(subCategoryRows) ? subCategoryRows : [])
      .map((subCategory) => {
        const subCategoryId = toPositiveInteger(subCategory?.id);
        const subCategoryName = toOptionalString(subCategory?.name);
        if (!subCategoryId || !subCategoryName) {
          return null;
        }

        return [subCategoryId, subCategoryName];
      })
      .filter(Boolean),
  );

  if (!primaryDetail) {
    return {
      serviceTitle: null,
      serviceCategory: existingValues.serviceCategory || null,
      serviceExperience: null,
      serviceDescription: null,
      deliveryTimeline: null,
      startingPrice: null,
      serviceKeywords: [],
      serviceMedia: [],
    };
  }

  const resolvedCategories = normalizeStringArray(
    normalizeServiceSubcategories(primaryDetail.subcategories).flatMap((entry) => {
      const subCategoryName =
        subCategoryNameById.get(entry.subCategoryId) ||
        toOptionalString(entry.label);
      return subCategoryName ? [subCategoryName] : [];
    }),
  );
  const serviceCategory = resolvedCategories.length
    ? resolvedCategories.join(", ")
    : existingValues.serviceCategory || null;

  return {
    serviceTitle: toOptionalString(primaryDetail.title) || null,
    serviceCategory,
    serviceExperience: toOptionalString(primaryDetail.experienceYears) || null,
    serviceDescription: toOptionalString(primaryDetail.serviceDescription) || null,
    deliveryTimeline: toOptionalString(primaryDetail.deliveryTime) || null,
    startingPrice: toOptionalString(primaryDetail.averageProjectPrice) || null,
    serviceKeywords: normalizeStringArray(primaryDetail.keywords),
    serviceMedia: Array.isArray(primaryDetail.media) ? primaryDetail.media : [],
  };
};

export const buildFreelancerSkillRows = ({
  userId,
  profileDetails = {},
  serviceRows = [],
  toolRows = [],
}) => {
  if (!userId) {
    return [];
  }

  const serviceIdByKey = new Map(
    (Array.isArray(serviceRows) ? serviceRows : [])
      .map((service) => {
        const normalizedServiceKey = normalizeServiceKey(
          service?.key || service?.name,
        );
        const serviceId = toPositiveInteger(service?.id);
        if (!normalizedServiceKey || !serviceId) {
          return null;
        }

        return [normalizedServiceKey, serviceId];
      })
      .filter(Boolean),
  );
  const toolRowsById = buildToolRowsByIdMap(toolRows);
  const uniqueRows = new Map();
  const normalizedProfileDetails = isPlainObject(profileDetails) ? profileDetails : {};
  const normalizedServiceDetails = isPlainObject(normalizedProfileDetails.serviceDetails)
    ? normalizedProfileDetails.serviceDetails
    : {};

  (Array.isArray(normalizedProfileDetails.services)
    ? normalizedProfileDetails.services
    : []
  ).forEach((serviceKey) => {
    const normalizedServiceKey = normalizeServiceKey(serviceKey);
    const serviceId = serviceIdByKey.get(normalizedServiceKey);
    const detail = normalizedServiceDetails?.[normalizedServiceKey];
    if (!serviceId || !isPlainObject(detail)) {
      return;
    }

    normalizeServiceSubcategories(detail.subcategories).forEach((subcategory) => {
      subcategory.selectedToolIds.forEach((toolId) => {
        const toolRow = toolRowsById.get(toolId);
        if (!toolRow || toolRow.subCategoryId !== subcategory.subCategoryId) {
          return;
        }

        const dedupKey = [
          userId,
          serviceId,
          subcategory.subCategoryId,
          toolId,
        ].join(":");
        if (uniqueRows.has(dedupKey)) {
          return;
        }

        uniqueRows.set(dedupKey, {
          userId,
          serviceId,
          subCategoryId: subcategory.subCategoryId,
          toolId,
        });
      });
    });
  });

  return Array.from(uniqueRows.values());
};
