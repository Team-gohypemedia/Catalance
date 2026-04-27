import { Prisma, prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";
import { buildProjectFreelancerMatchingSeed } from "../../../src/shared/lib/project-proposal-fields.js";
import { FREELANCER_PROFILE_WITH_PROFILE_DETAILS_SELECT } from "../modules/users/freelancer-profile.select.js";

const COMPLETED_PROJECT_ARCHIVE_INCLUDE = Object.freeze({
  owner: {
    select: {
      id: true,
      fullName: true,
      email: true,
      avatar: true,
      clientProfile: {
        select: {
          profileDetails: true,
        },
      },
    },
  },
  manager: {
    select: {
      id: true,
      fullName: true,
      email: true,
      avatar: true,
    },
  },
  proposals: {
    where: {
      status: "ACCEPTED",
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      freelancerId: true,
      amount: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      freelancer: {
        select: {
          id: true,
          fullName: true,
          email: true,
          avatar: true,
          freelancerProfile: {
            select: {
              ...FREELANCER_PROFILE_WITH_PROFILE_DETAILS_SELECT,
            },
          },
        },
      },
    },
  },
});

const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const cleanText = (value = "") =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

const uniqueItems = (items = []) => {
  const seen = new Set();
  const result = [];

  items.forEach((item) => {
    const normalized = cleanText(item);
    if (!normalized) return;

    const key = normalized.toLowerCase();
    if (seen.has(key)) return;

    seen.add(key);
    result.push(normalized);
  });

  return result;
};

const hasMeaningfulValue = (value) => {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.some((entry) => hasMeaningfulValue(entry));
  if (isPlainObject(value)) return Object.values(value).some((entry) => hasMeaningfulValue(entry));
  if (typeof value === "number") return Number.isFinite(value);
  return String(value).trim().length > 0;
};

const serializeForJson = (value) => JSON.parse(JSON.stringify(value ?? null));

const normalizeMatchingArray = (value) => {
  if (Array.isArray(value)) {
    return uniqueItems(
      value.flatMap((entry) =>
        typeof entry === "string"
          ? entry.split(/\r?\n|;|,(?=\s*[A-Za-z0-9])|\/(?=\s*[A-Za-z0-9])|\band\b|&/i)
          : [entry]
      ),
    );
  }

  if (typeof value === "string") {
    return uniqueItems(
      value.split(/\r?\n|;|,(?=\s*[A-Za-z0-9])|\/(?=\s*[A-Za-z0-9])|\band\b|&/i),
    );
  }

  return [];
};

const parseBudgetRange = (value, fallbackBudget = null) => {
  const numericFallback =
    Number.isFinite(Number(fallbackBudget)) && Number(fallbackBudget) >= 0
      ? Math.round(Number(fallbackBudget))
      : null;
  const text = cleanText(value);

  if (!text) {
    return {
      minBudget: numericFallback,
      maxBudget: numericFallback,
    };
  }

  const numericMatches = text.match(/\d[\d,]*/g) || [];
  const numericValues = numericMatches
    .map((entry) => Number(String(entry).replace(/,/g, "")))
    .filter((entry) => Number.isFinite(entry));

  if (numericValues.length >= 2) {
    const sorted = numericValues.sort((left, right) => left - right);
    return {
      minBudget: sorted[0],
      maxBudget: sorted[sorted.length - 1],
    };
  }

  if (numericValues.length === 1) {
    return {
      minBudget: numericValues[0],
      maxBudget: numericValues[0],
    };
  }

  return {
    minBudget: numericFallback,
    maxBudget: numericFallback,
  };
};

const normalizeMatchToken = (value = "") =>
  cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const tokenizeForMatch = (values = []) =>
  uniqueItems(values)
    .map((value) => normalizeMatchToken(value))
    .filter(Boolean);

const REQUIRED_COMPLETED_PROJECT_COLUMNS = Object.freeze([
  "budgetMin",
  "budgetMax",
  "clientSnapshot",
  "freelancerIds",
  "freelancerSnapshots",
  "serviceKey",
  "serviceType",
  "niche",
  "projectType",
  "timeline",
  "skills",
  "tags",
  "matchingSeed",
]);

let completedProjectSchemaCache = {
  checkedAt: 0,
  hasExpandedColumns: true,
};

const COMPLETED_PROJECT_SCHEMA_CACHE_TTL_MS = 5 * 60 * 1000;

const hasExpandedCompletedProjectColumns = async (tx = prisma) => {
  const now = Date.now();
  if (
    completedProjectSchemaCache.checkedAt > 0 &&
    now - completedProjectSchemaCache.checkedAt < COMPLETED_PROJECT_SCHEMA_CACHE_TTL_MS
  ) {
    return completedProjectSchemaCache.hasExpandedColumns;
  }

  try {
    const rows = await tx.$queryRaw`
      SELECT "column_name"
      FROM "information_schema"."columns"
      WHERE "table_schema" = 'public'
        AND "table_name" = 'CompletedProjects'
    `;

    const availableColumns = new Set(
      (Array.isArray(rows) ? rows : [])
        .map((row) => cleanText(row?.column_name || ""))
        .filter(Boolean),
    );

    const hasExpandedColumns = REQUIRED_COMPLETED_PROJECT_COLUMNS.every((columnName) =>
      availableColumns.has(columnName),
    );

    completedProjectSchemaCache = {
      checkedAt: now,
      hasExpandedColumns,
    };

    return hasExpandedColumns;
  } catch (error) {
    console.warn(
      "[CompletedProject] Failed to inspect schema columns; defaulting to legacy mode:",
      error?.message || error,
    );

    completedProjectSchemaCache = {
      checkedAt: now,
      hasExpandedColumns: false,
    };

    return false;
  }
};

const resolveLegacyMatchingSeed = (row = {}) => {
  const archivedData = isPlainObject(row?.archivedData) ? row.archivedData : {};
  if (isPlainObject(archivedData?.matchingSeed)) {
    return archivedData.matchingSeed;
  }

  const projectSnapshot = isPlainObject(archivedData?.projectSnapshot)
    ? archivedData.projectSnapshot
    : {};
  return buildProjectMatchingSeed(projectSnapshot) || {};
};

const extractLegacyFreelancerIds = (row = {}) => {
  const archivedData = isPlainObject(row?.archivedData) ? row.archivedData : {};
  const projectSnapshot = isPlainObject(archivedData?.projectSnapshot)
    ? archivedData.projectSnapshot
    : {};
  const acceptedProposals = Array.isArray(projectSnapshot?.proposals)
    ? projectSnapshot.proposals
    : [];

  return uniqueItems(
    acceptedProposals
      .filter((proposal) => String(proposal?.status || "").toUpperCase() === "ACCEPTED")
      .map((proposal) => cleanText(proposal?.freelancerId || ""))
      .filter(Boolean),
  );
};

const mapLegacyCompletedProjectRow = (row = {}) => {
  const archivedData = isPlainObject(row?.archivedData) ? row.archivedData : {};
  const projectSnapshot = isPlainObject(archivedData?.projectSnapshot)
    ? archivedData.projectSnapshot
    : {};
  const matchingSeed = resolveLegacyMatchingSeed(row);
  const matchingQuery = isPlainObject(matchingSeed?.matchingQuery)
    ? matchingSeed.matchingQuery
    : {};
  const fitProfile = isPlainObject(matchingSeed?.fitProfile)
    ? matchingSeed.fitProfile
    : {};
  const parsedBudgetRange = parseBudgetRange(
    matchingSeed?.project?.budgetSummary || row?.budget,
    row?.budget,
  );

  const serviceKey =
    cleanText(projectSnapshot?.serviceKey) ||
    cleanText(matchingSeed?.project?.serviceKey) ||
    cleanText(matchingQuery?.category) ||
    "";
  const serviceType =
    cleanText(projectSnapshot?.serviceType) ||
    cleanText(matchingSeed?.project?.serviceType) ||
    "";
  const niche =
    cleanText(projectSnapshot?.businessCategory) ||
    cleanText(matchingQuery?.industriesOrNiches?.[0]) ||
    cleanText(fitProfile?.targetAudience?.[0]) ||
    "";
  const projectType =
    cleanText(projectSnapshot?.websiteType) ||
    cleanText(projectSnapshot?.serviceType) ||
    cleanText(matchingQuery?.serviceSpecializations?.[0]) ||
    serviceType;
  const timeline =
    cleanText(projectSnapshot?.timeline) ||
    cleanText(projectSnapshot?.duration) ||
    cleanText(matchingSeed?.project?.timeline) ||
    null;

  const skills = uniqueItems([
    ...normalizeMatchingArray(projectSnapshot?.skills),
    ...normalizeMatchingArray(fitProfile?.requiredSkills),
    ...normalizeMatchingArray(matchingQuery?.techStack),
  ]);
  const tags = uniqueItems([
    ...normalizeMatchingArray(projectSnapshot?.featuresDeliverables),
    ...normalizeMatchingArray(fitProfile?.deliverables),
    ...normalizeMatchingArray(fitProfile?.primaryObjectives),
  ]);

  return {
    id: row?.id || null,
    originalProjectId: row?.ongoingProjectId || null,
    title: cleanText(row?.title) || "Completed project",
    description: cleanText(row?.description) || null,
    budget:
      Number.isFinite(Number(row?.budget)) && Number(row.budget) >= 0
        ? Math.round(Number(row.budget))
        : null,
    budgetMin: parsedBudgetRange.minBudget,
    budgetMax: parsedBudgetRange.maxBudget,
    spent:
      Number.isFinite(Number(row?.spent)) && Number(row.spent) >= 0
        ? Math.round(Number(row.spent))
        : 0,
    ownerId: row?.ownerId || null,
    managerId: row?.managerId || null,
    clientSnapshot: isPlainObject(projectSnapshot?.owner)
      ? projectSnapshot.owner
      : {},
    freelancerIds: extractLegacyFreelancerIds(row),
    freelancerSnapshots: [],
    serviceKey,
    serviceType,
    niche: niche || null,
    projectType: projectType || null,
    timeline,
    skills,
    tags,
    matchingSeed,
    completedAt: row?.completedAt || null,
    archivedData,
    createdAt: row?.createdAt || null,
    updatedAt: row?.updatedAt || null,
  };
};

const applyLegacyCompletedProjectFilters = ({
  rows = [],
  normalizedServiceKey = "",
  normalizedProjectTypes = [],
  normalizedNiches = [],
  limit = 150,
} = {}) => {
  const serviceTokens = normalizedServiceKey
    ? tokenizeForMatch([
        normalizedServiceKey,
        normalizedServiceKey.replace(/[_\s-]+/g, " "),
        normalizedServiceKey.replace(/[_\s-]+/g, "_"),
        normalizedServiceKey.replace(/[_\s-]+/g, "-"),
      ])
    : [];
  const projectTypeTokens = tokenizeForMatch(normalizedProjectTypes);
  const nicheTokens = tokenizeForMatch(normalizedNiches);

  const matchesToken = (tokens = [], value = "") => {
    const normalizedValue = normalizeMatchToken(value);
    if (!normalizedValue) return false;
    return tokens.some((token) => normalizedValue.includes(token));
  };

  const filtered = rows.filter((row) => {
    const serviceValues = [row?.serviceKey, row?.serviceType, row?.title, row?.description];
    const supplementalValues = [
      row?.projectType,
      row?.niche,
      ...(Array.isArray(row?.skills) ? row.skills : []),
      ...(Array.isArray(row?.tags) ? row.tags : []),
    ];

    const serviceMatched =
      serviceTokens.length === 0 ||
      serviceValues.some((value) => matchesToken(serviceTokens, value));

    const projectTypeMatched =
      projectTypeTokens.length === 0 ||
      supplementalValues.some((value) => matchesToken(projectTypeTokens, value));

    const nicheMatched =
      nicheTokens.length === 0 ||
      supplementalValues.some((value) => matchesToken(nicheTokens, value));

    const hasSupplementalFilter = projectTypeTokens.length > 0 || nicheTokens.length > 0;
    const supplementalMatched =
      !hasSupplementalFilter || projectTypeMatched || nicheMatched;

    if (serviceTokens.length > 0 && hasSupplementalFilter) {
      return serviceMatched && supplementalMatched;
    }

    if (serviceTokens.length > 0) {
      return serviceMatched;
    }

    if (hasSupplementalFilter) {
      return supplementalMatched;
    }

    return true;
  });

  return filtered.slice(0, limit);
};

const selectPrimaryProjectType = (projectTypes = [], serviceType = "", serviceKey = "") => {
  const normalizedServiceType = cleanText(serviceType).toLowerCase();
  const normalizedServiceKey = cleanText(serviceKey).toLowerCase();
  const preferredProjectType = uniqueItems(projectTypes).find((projectType) => {
    const normalizedProjectType = cleanText(projectType).toLowerCase();
    return (
      normalizedProjectType &&
      normalizedProjectType !== normalizedServiceType &&
      normalizedProjectType !== normalizedServiceKey
    );
  });

  return preferredProjectType || uniqueItems(projectTypes)[0] || null;
};

const mergeMatchingSeed = (baseSeed = null, storedSeed = null) => {
  const normalizedBase = isPlainObject(baseSeed) ? baseSeed : {};
  const normalizedStored = isPlainObject(storedSeed) ? storedSeed : {};
  const merged = {
    ...normalizedBase,
    ...normalizedStored,
    project: {
      ...(isPlainObject(normalizedBase.project) ? normalizedBase.project : {}),
      ...(isPlainObject(normalizedStored.project) ? normalizedStored.project : {}),
    },
    matchingQuery: {
      ...(isPlainObject(normalizedBase.matchingQuery) ? normalizedBase.matchingQuery : {}),
      ...(isPlainObject(normalizedStored.matchingQuery) ? normalizedStored.matchingQuery : {}),
    },
    fitProfile: {
      ...(isPlainObject(normalizedBase.fitProfile) ? normalizedBase.fitProfile : {}),
      ...(isPlainObject(normalizedStored.fitProfile) ? normalizedStored.fitProfile : {}),
    },
    screening: {
      ...(isPlainObject(normalizedBase.screening) ? normalizedBase.screening : {}),
      ...(isPlainObject(normalizedStored.screening) ? normalizedStored.screening : {}),
    },
  };

  return hasMeaningfulValue(merged) ? merged : null;
};

export const buildProjectMatchingSeed = (project = {}) => {
  const generatedSeed =
    buildProjectFreelancerMatchingSeed({
      ...project,
      proposalJson: project?.proposalJson,
      proposalContent: project?.proposalContent,
      proposalContext:
        project?.proposalJson && isPlainObject(project.proposalJson.contextSnapshot)
          ? project.proposalJson.contextSnapshot
          : undefined,
    }) || null;

  return mergeMatchingSeed(generatedSeed, project?.freelancerMatchingJson);
};

const buildClientSnapshot = (project = {}) => ({
  id: project?.owner?.id || project?.ownerId || null,
  fullName: project?.owner?.fullName || cleanText(project?.clientName) || "Client",
  email: project?.owner?.email || null,
  avatar: project?.owner?.avatar || null,
  businessName: cleanText(project?.businessName) || null,
  profileDetails:
    project?.owner?.clientProfile && isPlainObject(project.owner.clientProfile.profileDetails)
      ? project.owner.clientProfile.profileDetails
      : {},
});

const buildFreelancerSnapshot = (proposal = {}) => {
  const freelancer = proposal?.freelancer || {};
  const profile =
    freelancer?.freelancerProfile && isPlainObject(freelancer.freelancerProfile)
      ? freelancer.freelancerProfile
      : {};

  return {
    id: freelancer?.id || proposal?.freelancerId || null,
    fullName: freelancer?.fullName || "Freelancer",
    email: freelancer?.email || null,
    avatar: freelancer?.avatar || null,
    acceptedProposalId: proposal?.id || null,
    acceptedAmount:
      Number.isFinite(Number(proposal?.amount)) && Number(proposal.amount) >= 0
        ? Math.round(Number(proposal.amount))
        : null,
    jobTitle:
      cleanText(profile?.serviceTitle) ||
      cleanText(profile?.profileRole) ||
      null,
    skills: [],
    services: Array.isArray(profile?.services) ? uniqueItems(profile.services) : [],
    openToWork: Boolean(profile?.openToWork ?? true),
    rating:
      Number.isFinite(Number(profile?.rating)) && Number(profile.rating) >= 0
        ? Number(profile.rating)
        : 0,
    reviewCount:
      Number.isFinite(Number(profile?.reviewCount)) && Number(profile.reviewCount) >= 0
        ? Math.round(Number(profile.reviewCount))
        : 0,
    experienceYears:
      Number.isFinite(Number(profile?.experienceYears)) && Number(profile.experienceYears) >= 0
        ? Math.round(Number(profile.experienceYears))
        : 0,
    serviceDetails: isPlainObject(profile?.serviceDetails) ? profile.serviceDetails : {},
    portfolioProjects: [],
  };
};

export const buildCompletedProjectArchiveData = (project = {}, { completedAt = null } = {}) => {
  const matchingSeed = buildProjectMatchingSeed(project);
  const matchingQuery = isPlainObject(matchingSeed?.matchingQuery)
    ? matchingSeed.matchingQuery
    : {};
  const fitProfile = isPlainObject(matchingSeed?.fitProfile) ? matchingSeed.fitProfile : {};

  const skills = uniqueItems([
    ...normalizeMatchingArray(fitProfile.requiredSkills),
    ...normalizeMatchingArray(matchingQuery.techStack),
  ]).slice(0, 24);
  const niches = uniqueItems([
    ...normalizeMatchingArray(matchingQuery.industriesOrNiches),
    ...normalizeMatchingArray(fitProfile.targetAudience),
    cleanText(project?.businessCategory),
    cleanText(project?.targetAudience),
  ]);
  const projectTypes = uniqueItems([
    ...normalizeMatchingArray(matchingQuery.serviceSpecializations),
    cleanText(project?.serviceType),
    cleanText(project?.websiteType),
    cleanText(project?.websiteBuildType),
    cleanText(project?.creativeType),
    cleanText(project?.appType),
  ]);
  const tags = uniqueItems([
    ...normalizeMatchingArray(fitProfile.deliverables),
    ...normalizeMatchingArray(fitProfile.primaryObjectives),
    ...normalizeMatchingArray(fitProfile.platformRequirements),
    ...normalizeMatchingArray(project?.featuresDeliverables),
    ...normalizeMatchingArray(project?.brandDeliverables),
    ...normalizeMatchingArray(project?.appFeatures),
  ]).slice(0, 40);

  const budgetRange = parseBudgetRange(
    matchingSeed?.project?.budgetSummary || project?.budgetSummary || project?.budget,
    project?.budget,
  );
  const acceptedProposals = Array.isArray(project?.proposals) ? project.proposals : [];
  const freelancerSnapshots = acceptedProposals.map(buildFreelancerSnapshot);
  const freelancerIds = uniqueItems(
    freelancerSnapshots.map((freelancer) => freelancer?.id).filter(Boolean),
  );
  const completionDate =
    completedAt
    || project?.closureVerifiedAt
    || project?.updatedAt
    || project?.createdAt
    || new Date();
  const resolvedServiceType =
    cleanText(project?.serviceType)
    || cleanText(matchingSeed?.project?.serviceType)
    || null;
  const resolvedServiceKey =
    cleanText(project?.serviceKey)
    || cleanText(matchingSeed?.project?.serviceKey)
    || cleanText(matchingQuery?.category)
    || null;

  return {
    originalProjectId: project?.id || null,
    title: cleanText(project?.title) || "Completed project",
    description: cleanText(project?.description) || null,
    budget:
      Number.isFinite(Number(project?.budget)) && Number(project.budget) >= 0
        ? Math.round(Number(project.budget))
        : null,
    budgetMin: budgetRange.minBudget,
    budgetMax: budgetRange.maxBudget,
    spent:
      Number.isFinite(Number(project?.spent)) && Number(project.spent) >= 0
        ? Math.round(Number(project.spent))
        : 0,
    ownerId: project?.ownerId || project?.owner?.id || null,
    managerId: project?.managerId || project?.manager?.id || null,
    clientSnapshot: buildClientSnapshot(project),
    freelancerIds,
    freelancerSnapshots,
    serviceKey: resolvedServiceKey,
    serviceType: resolvedServiceType,
    niche: niches[0] || null,
    projectType: selectPrimaryProjectType(
      projectTypes,
      resolvedServiceType,
      resolvedServiceKey,
    ),
    timeline:
      cleanText(project?.timeline)
      || cleanText(project?.duration)
      || cleanText(matchingSeed?.project?.timeline)
      || null,
    skills,
    tags,
    matchingSeed: matchingSeed || {},
    completedAt: completionDate,
    archivedData: {
      archivedAt: new Date().toISOString(),
      projectSnapshot: serializeForJson(project),
      matchingSeed: serializeForJson(matchingSeed || {}),
    },
  };
};

const buildTextArraySql = (values = []) => {
  const normalizedValues = uniqueItems(values);
  if (normalizedValues.length === 0) {
    return Prisma.sql`ARRAY[]::text[]`;
  }

  return Prisma.sql`ARRAY[${Prisma.join(
    normalizedValues.map((value) => Prisma.sql`${value}`),
  )}]::text[]`;
};

const getCompletedProjectArchive = async (projectId, tx = prisma) => {
  const rows = await tx.$queryRaw`
    SELECT
      "id"
    FROM "CompletedProjects"
    WHERE "ongoingProjectId" = ${projectId}
    ORDER BY "updatedAt" DESC
    LIMIT 1
  `;

  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
};

export const archiveCompletedProject = async ({ projectId, completedAt = null, tx = prisma } = {}) => {
  const normalizedProjectId = String(projectId || "").trim();
  if (!normalizedProjectId) {
    throw new AppError("Project ID is required for archival.", 400);
  }

  const project = await tx.project.findUnique({
    where: {
      id: normalizedProjectId,
    },
    include: COMPLETED_PROJECT_ARCHIVE_INCLUDE,
  });

  if (!project) {
    throw new AppError("Project not found for archival.", 404);
  }

  const archivePayload = buildCompletedProjectArchiveData(project, {
    completedAt,
  });
  const existingArchive = await getCompletedProjectArchive(normalizedProjectId, tx);
  const serializedClientSnapshot = JSON.stringify(archivePayload.clientSnapshot || {});
  const serializedFreelancerSnapshots = JSON.stringify(
    archivePayload.freelancerSnapshots || [],
  );
  const serializedMatchingSeed = JSON.stringify(archivePayload.matchingSeed || {});
  const serializedArchivedData = JSON.stringify(archivePayload.archivedData || {});
  const freelancerIdsSql = buildTextArraySql(archivePayload.freelancerIds || []);
  const skillsSql = buildTextArraySql(archivePayload.skills || []);
  const tagsSql = buildTextArraySql(archivePayload.tags || []);

  if (existingArchive?.id) {
    const rows = await tx.$queryRaw`
      UPDATE "CompletedProjects"
      SET
        "ongoingProjectId" = ${archivePayload.originalProjectId},
        "title" = ${archivePayload.title},
        "description" = ${archivePayload.description},
        "budget" = ${archivePayload.budget},
        "budgetMin" = ${archivePayload.budgetMin},
        "budgetMax" = ${archivePayload.budgetMax},
        "spent" = ${archivePayload.spent},
        "ownerId" = ${archivePayload.ownerId},
        "managerId" = ${archivePayload.managerId},
        "clientSnapshot" = ${serializedClientSnapshot}::jsonb,
        "freelancerIds" = ${freelancerIdsSql},
        "freelancerSnapshots" = ${serializedFreelancerSnapshots}::jsonb,
        "serviceKey" = ${archivePayload.serviceKey},
        "serviceType" = ${archivePayload.serviceType},
        "niche" = ${archivePayload.niche},
        "projectType" = ${archivePayload.projectType},
        "timeline" = ${archivePayload.timeline},
        "skills" = ${skillsSql},
        "tags" = ${tagsSql},
        "matchingSeed" = ${serializedMatchingSeed}::jsonb,
        "completedAt" = ${archivePayload.completedAt},
        "archivedData" = ${serializedArchivedData}::jsonb,
        "updatedAt" = NOW()
      WHERE "id" = ${existingArchive.id}
      RETURNING *
    `;

    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  }

  const rows = await tx.$queryRaw`
    INSERT INTO "CompletedProjects" (
      "ongoingProjectId",
      "title",
      "description",
      "budget",
      "budgetMin",
      "budgetMax",
      "spent",
      "ownerId",
      "managerId",
      "clientSnapshot",
      "freelancerIds",
      "freelancerSnapshots",
      "serviceKey",
      "serviceType",
      "niche",
      "projectType",
      "timeline",
      "skills",
      "tags",
      "matchingSeed",
      "completedAt",
      "archivedData"
    ) VALUES (
      ${archivePayload.originalProjectId},
      ${archivePayload.title},
      ${archivePayload.description},
      ${archivePayload.budget},
      ${archivePayload.budgetMin},
      ${archivePayload.budgetMax},
      ${archivePayload.spent},
      ${archivePayload.ownerId},
      ${archivePayload.managerId},
      ${serializedClientSnapshot}::jsonb,
      ${freelancerIdsSql},
      ${serializedFreelancerSnapshots}::jsonb,
      ${archivePayload.serviceKey},
      ${archivePayload.serviceType},
      ${archivePayload.niche},
      ${archivePayload.projectType},
      ${archivePayload.timeline},
      ${skillsSql},
      ${tagsSql},
      ${serializedMatchingSeed}::jsonb,
      ${archivePayload.completedAt},
      ${serializedArchivedData}::jsonb
    )
    RETURNING *
  `;

  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
};

export const listCompletedProjectsForMatching = async (
  {
    serviceKey = "",
    projectTypes = [],
    niches = [],
    limit = 150,
  } = {},
  tx = prisma,
) => {
  const normalizedLimit =
    Number.isFinite(Number(limit)) && Number(limit) > 0
      ? Math.min(Math.round(Number(limit)), 200)
      : 150;
  const normalizedServiceKey = cleanText(serviceKey);
  const normalizedProjectTypes = uniqueItems(projectTypes)
    .map((value) => cleanText(value))
    .filter(Boolean)
    .slice(0, 5);
  const normalizedNiches = uniqueItems(niches)
    .map((value) => cleanText(value))
    .filter(Boolean)
    .slice(0, 5);

  const hasExpandedColumns = await hasExpandedCompletedProjectColumns(tx);
  if (!hasExpandedColumns) {
    const legacyLimit = Math.min(normalizedLimit * 3, 300);
    const legacyRows = await tx.$queryRaw`
      SELECT
        "id",
        "ongoingProjectId",
        "title",
        "description",
        "budget",
        "spent",
        "ownerId",
        "managerId",
        "completedAt",
        "archivedData",
        "createdAt",
        "updatedAt"
      FROM "CompletedProjects"
      ORDER BY "completedAt" DESC, "updatedAt" DESC
      LIMIT ${legacyLimit}
    `;

    const normalizedLegacyRows = (Array.isArray(legacyRows) ? legacyRows : [])
      .map((row) => mapLegacyCompletedProjectRow(row))
      .filter((row) => Array.isArray(row?.freelancerIds) && row.freelancerIds.length > 0);

    return applyLegacyCompletedProjectFilters({
      rows: normalizedLegacyRows,
      normalizedServiceKey,
      normalizedProjectTypes,
      normalizedNiches,
      limit: normalizedLimit,
    });
  }

  const serviceFilters = normalizedServiceKey
    ? uniqueItems([
      normalizedServiceKey,
      normalizedServiceKey.replace(/[_\s-]+/g, " "),
      normalizedServiceKey.replace(/[_\s-]+/g, "_"),
      normalizedServiceKey.replace(/[_\s-]+/g, "-"),
    ])
      .filter(Boolean)
      .slice(0, 4)
      .flatMap((value) => [
        {
          serviceKey: {
            contains: value,
            mode: "insensitive",
          },
        },
        {
          serviceType: {
            contains: value,
            mode: "insensitive",
          },
        },
      ])
    : [];

  const supplementalFilters = [
    ...normalizedProjectTypes.map((value) => ({
      projectType: {
        contains: value,
        mode: "insensitive",
      },
    })),
    ...normalizedNiches.map((value) => ({
      niche: {
        contains: value,
        mode: "insensitive",
      },
    })),
  ];

  let where = {};
  if (serviceFilters.length > 0 && supplementalFilters.length > 0) {
    where = {
      AND: [
        { OR: serviceFilters },
        { OR: supplementalFilters },
      ],
    };
  } else if (serviceFilters.length > 0) {
    where = {
      OR: serviceFilters,
    };
  } else if (supplementalFilters.length > 0) {
    where = {
      OR: supplementalFilters,
    };
  }

  return tx.completedProject.findMany({
    where,
    select: {
      id: true,
      originalProjectId: true,
      title: true,
      description: true,
      budget: true,
      budgetMin: true,
      budgetMax: true,
      spent: true,
      ownerId: true,
      managerId: true,
      clientSnapshot: true,
      freelancerIds: true,
      freelancerSnapshots: true,
      serviceKey: true,
      serviceType: true,
      niche: true,
      projectType: true,
      timeline: true,
      skills: true,
      tags: true,
      matchingSeed: true,
      completedAt: true,
      archivedData: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ completedAt: "desc" }, { updatedAt: "desc" }],
    take: normalizedLimit,
  });
};

export const __testables = {
  buildClientSnapshot,
  buildCompletedProjectArchiveData,
  buildProjectMatchingSeed,
  buildFreelancerSnapshot,
  listCompletedProjectsForMatching,
  mergeMatchingSeed,
  parseBudgetRange,
};
