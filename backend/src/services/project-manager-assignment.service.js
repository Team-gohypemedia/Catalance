import { prisma } from "../lib/prisma.js";

const PROJECT_MANAGER_ROLE = "PROJECT_MANAGER";
const ACTIVE_STATUS = "ACTIVE";
const ACTIVE_PROJECT_EXCLUDED_STATUSES = ["COMPLETED", "PAUSED", "DRAFT"];
const MAX_ACTIVE_PROJECTS = 10;

const normalizeText = (value) => String(value || "").trim();

const normalizeServiceKey = (value) =>
  normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const asProfileDetailsObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

const uniqueNormalizedKeys = (values = []) =>
  Array.from(
    new Set(
      values
        .map((value) => normalizeServiceKey(value))
        .filter(Boolean)
    )
  );

export const getManagerAllowedServiceKeys = (profileDetails = {}) => {
  const source = asProfileDetailsObject(profileDetails);
  const rawKeys = Array.isArray(source.allowedServiceKeys)
    ? source.allowedServiceKeys
    : Array.isArray(source.eligibleServiceKeys)
      ? source.eligibleServiceKeys
      : [];

  return uniqueNormalizedKeys(rawKeys);
};

export const resolveProjectAssignmentServiceKey = (project = {}) =>
  normalizeServiceKey(project?.serviceKey) || normalizeServiceKey(project?.serviceType);

export const isProjectManagerEligibleForProject = (manager = {}, project = {}) => {
  const projectServiceKey = resolveProjectAssignmentServiceKey(project);
  if (!projectServiceKey) return true;

  const profileDetails = asProfileDetailsObject(
    manager?.managerProfile?.profileDetails || manager?.profileDetails
  );
  const allowedServiceKeys = getManagerAllowedServiceKeys(profileDetails);

  if (allowedServiceKeys.length === 0) {
    return true;
  }

  return allowedServiceKeys.includes(projectServiceKey);
};

const sanitizeManagerForReturn = (manager) => {
  if (!manager) return null;
  const { managedProjects, managerProfile, ...safeManager } = manager;
  return safeManager;
};

export const findLeastLoadedActiveProjectManager = async ({
  dbClient = prisma,
  project = {},
  excludeManagerId = null,
} = {}) => {
  const managers = await dbClient.user.findMany({
    where: {
      role: PROJECT_MANAGER_ROLE,
      status: ACTIVE_STATUS,
      ...(excludeManagerId ? { id: { not: excludeManagerId } } : {}),
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      avatar: true,
      status: true,
      role: true,
      createdAt: true,
      managerProfile: {
        select: {
          profileDetails: true,
        },
      },
      managedProjects: {
        where: {
          status: { notIn: ACTIVE_PROJECT_EXCLUDED_STATUSES },
        },
        select: { id: true },
        take: MAX_ACTIVE_PROJECTS + 1,
      },
    },
  });

  const eligibleManagers = managers
    .map((manager) => ({
      ...manager,
      activeProjectCount: Array.isArray(manager.managedProjects)
        ? manager.managedProjects.length
        : 0,
    }))
    .filter((manager) => manager.activeProjectCount < MAX_ACTIVE_PROJECTS)
    .filter((manager) => isProjectManagerEligibleForProject(manager, project))
    .sort((left, right) => {
      if (left.activeProjectCount !== right.activeProjectCount) {
        return left.activeProjectCount - right.activeProjectCount;
      }
      return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    });

  return sanitizeManagerForReturn(eligibleManagers[0] || null);
};

export const reassignProjectsFromProjectManager = async ({
  dbClient = prisma,
  managerId,
} = {}) => {
  if (!managerId) {
    return { reassignedCount: 0, unassignedCount: 0 };
  }

  const projects = await dbClient.project.findMany({
    where: {
      managerId,
      status: { notIn: ACTIVE_PROJECT_EXCLUDED_STATUSES },
    },
    select: {
      id: true,
      serviceKey: true,
      serviceType: true,
    },
    orderBy: { createdAt: "asc" },
  });

  let reassignedCount = 0;
  let unassignedCount = 0;

  for (const project of projects) {
    const fallbackManager = await findLeastLoadedActiveProjectManager({
      dbClient,
      project,
      excludeManagerId: managerId,
    });

    await dbClient.project.update({
      where: { id: project.id },
      data: {
        managerId: fallbackManager?.id || null,
      },
    });

    if (fallbackManager?.id) {
      reassignedCount += 1;
    } else {
      unassignedCount += 1;
    }
  }

  return { reassignedCount, unassignedCount };
};
