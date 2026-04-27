import { asyncHandler } from "../utils/async-handler.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";
import { attachProjectPaymentPlan, resolveProjectPaymentPlan } from "../modules/projects/project-payment-plan.js";
import { sendNotificationToUser } from "../lib/notification-util.js";
import { env } from "../config/env.js";
import { getRazorpayClient, hasRazorpayCredentials } from "../lib/razorpay.js";
import {
  buildPhaseOrderMap,
  isCompletedPhaseLockedAfterAdvance,
  isTaskPhaseLockedByPayment,
} from "../../../src/shared/lib/project-verification-gates.js";
import { markFreelancerVerifiedAfterProjectCompletion } from "../lib/freelancer-verification.js";
import { syncFreelancerOpenToWorkStatus } from "../lib/freelancer-open-to-work.js";
import {
  buildProjectProposalJson,
  PROJECT_PROPOSAL_FIELD_KEYS,
  PROJECT_PROPOSAL_LIST_FIELDS,
  PROJECT_PROPOSAL_TEXT_FIELDS,
  extractProjectProposalFields,
  mergeProposalStructureDefinitions,
  resolveProjectAgencyProposalFlag,
} from "../../../src/shared/lib/project-proposal-fields.js";
import { generateFreelancerMatchingJson } from "../services/ai.service.js";
import { archiveCompletedProject } from "../services/completed-projects.service.js";
import crypto from "crypto";

const MAX_INT = 2147483647; // PostgreSQL INT4 upper bound

const normalizeAmount = (value) => {
  if (value === undefined || value === null) return 0;
  if (typeof value === "number") {
    const parsed = Math.round(value);
    if (parsed < 0) return 0;
    return parsed > MAX_INT ? MAX_INT : parsed;
  }

  if (typeof value === "string") {
    // Strip currency, commas, and pull the first number if a range is provided.
    const sanitized = value
      .replace(/[â‚¹,$\s]/g, "")
      .replace(/[â€“â€”]/g, "-");

    const rangePart = sanitized.includes("-")
      ? sanitized.split("-")[0]
      : sanitized;

    const parsed = Number(rangePart);
    if (!Number.isNaN(parsed)) {
      const rounded = Math.round(parsed);
      if (rounded < 0) return 0;
      return rounded > MAX_INT ? MAX_INT : rounded;
    }
  }

  return 0;
};

const normalizeTaskIdArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item || "").trim()).filter(Boolean);
      }
    } catch {
      return [];
    }
  }

  return [];
};

const normalizeBudget = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === "number") {
    const parsed = Math.round(value);
    if (parsed < 0) return 0;
    return parsed > MAX_INT ? MAX_INT : parsed;
  }

  if (typeof value === "string") {
    // Strip currency symbols, commas, and pull the first number if a range is provided.
    const sanitized = value
      .replace(/[–—]/g, "-")
      .replace(/[^\d.-]/g, "");

    const rangePart = sanitized.includes("-")
      ? sanitized.split("-")[0]
      : sanitized;

    const parsed = Number(rangePart);
    if (!Number.isNaN(parsed)) {
      const rounded = Math.round(parsed);
      if (rounded < 0) return 0;
      return rounded > MAX_INT ? MAX_INT : rounded;
    }
  }

  return null;
};

const extractAvatarUrl = (value) => {
  if (!value) return "";

  if (typeof value === "string") {
    const url = value.trim();
    if (!url || url.startsWith("blob:")) return "";
    return url;
  }

  if (typeof value === "object") {
    return extractAvatarUrl(
      value.uploadedUrl || value.url || value.src || value.value || ""
    );
  }

  return "";
};

const FREELANCER_UNSPLASH_PROFILE_QUERIES = Object.freeze([
  "indian,professional,portrait,headshot",
  "indian,developer,portrait,studio",
  "indian,designer,portrait,office",
  "indian,marketer,portrait,creative",
  "indian,freelancer,portrait,workspace",
  "india,entrepreneur,portrait,natural-light",
]);

const hashStringToPositiveInt = (value = "") => {
  const input = String(value || "");
  if (!input) return 1;
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash) || 1;
};

const buildFreelancerUnsplashAvatarUrl = (user = {}) => {
  const seedSource =
    user?.id || user?.email || user?.fullName || user?.phoneNumber || "freelancer";
  const seed = hashStringToPositiveInt(seedSource);
  const query =
    FREELANCER_UNSPLASH_PROFILE_QUERIES[
      seed % FREELANCER_UNSPLASH_PROFILE_QUERIES.length
    ];
  const sig = (seed % 9000) + 1;
  return `https://source.unsplash.com/640x640/?${encodeURIComponent(query)}&sig=${sig}`;
};

const PROJECT_PROPOSAL_LIST_FIELD_SET = new Set(PROJECT_PROPOSAL_LIST_FIELDS);
const PROJECT_PROPOSAL_TEXT_FIELD_SET = new Set(PROJECT_PROPOSAL_TEXT_FIELDS);

const normalizeProjectProposalText = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = String(value || "").trim();
  return normalized || null;
};

const normalizeProjectProposalList = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return [];

  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|;|,(?=\s*[A-Za-z0-9])/)
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  return [];
};

const hasOwnField = (value, key) =>
  Boolean(value) && Object.prototype.hasOwnProperty.call(value, key);

const normalizeServiceLookupValue = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replace(/[_/\\-]+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const uniqueTextValues = (values = []) => {
  const seen = new Set();
  const result = [];

  values.forEach((value) => {
    const normalized = String(value || "").trim();
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(normalized);
  });

  return result;
};

const extractProjectSelectedServiceLookupCandidates = (payload = {}) => {
  const proposalContext =
    payload?.proposalContext && typeof payload.proposalContext === "object" && !Array.isArray(payload.proposalContext)
      ? payload.proposalContext
      : {};
  const directCandidates = [];

  [
    proposalContext?.selectedServiceIds,
    proposalContext?.selectedServiceNames,
    proposalContext?.serviceIds,
    proposalContext?.serviceNames,
  ].forEach((value) => {
    if (Array.isArray(value)) {
      directCandidates.push(...value);
    }
  });

  if (Array.isArray(proposalContext?.selectedServices)) {
    proposalContext.selectedServices.forEach((service) => {
      if (typeof service === "string") {
        directCandidates.push(service);
        return;
      }

      if (service && typeof service === "object") {
        directCandidates.push(
          service.id,
          service.slug,
          service.name,
          service.serviceId,
          service.serviceName,
        );
      }
    });
  }

  return uniqueTextValues(directCandidates);
};

const splitCombinedServiceLookupValue = (value = "") => {
  const normalizedValue = String(value || "").trim();
  if (!normalizedValue) return [];

  const commaSeparatedValues = normalizedValue
    .split(/\s*,\s*/)
    .map((entry) => String(entry || "").trim())
    .filter(Boolean);

  return commaSeparatedValues.length > 1 ? commaSeparatedValues : [normalizedValue];
};

const collectProjectServiceLookupCandidates = ({
  input = {},
  fallback = null,
} = {}) => {
  const lookupCandidates = uniqueTextValues([
    input?.serviceKey,
    input?.serviceType,
    input?.service,
    input?.serviceName,
    input?.category,
    fallback?.serviceKey,
    fallback?.serviceType,
    fallback?.service,
    fallback?.serviceName,
    fallback?.category,
    ...extractProjectSelectedServiceLookupCandidates(input),
    ...extractProjectSelectedServiceLookupCandidates(fallback),
  ]);
  return uniqueTextValues(
    lookupCandidates.flatMap((candidate) => splitCombinedServiceLookupValue(candidate)),
  );
};

const resolveProjectServiceDefinitions = async ({
  input = {},
  fallback = null,
} = {}) => {
  const lookupCandidates = collectProjectServiceLookupCandidates({
    input,
    fallback,
  });
  if (lookupCandidates.length === 0) return null;

  const services = await prisma.service.findMany({
    select: {
      slug: true,
      name: true,
      internalProposalStructure: true,
      proposalStructure: true,
    },
  });
  if (!Array.isArray(services) || services.length === 0) return null;

  const matchedServices = [];
  const matchedServiceSlugs = new Set();

  for (const candidate of lookupCandidates) {
    const normalizedCandidate = normalizeServiceLookupValue(candidate);
    if (!normalizedCandidate) continue;

    const match = services.find((service) => {
      const normalizedSlug = normalizeServiceLookupValue(service?.slug);
      const normalizedName = normalizeServiceLookupValue(service?.name);
      return (
        normalizedSlug === normalizedCandidate
        || normalizedName === normalizedCandidate
      );
    });

    if (match && !matchedServiceSlugs.has(match.slug)) {
      matchedServiceSlugs.add(match.slug);
      matchedServices.push(match);
    }
  }

  return matchedServices;
};

const resolveProjectProposalStructure = async ({
  input = {},
  fallback = null,
} = {}) => {
  const serviceDefinitions = await resolveProjectServiceDefinitions({
    input,
    fallback,
  });

  return {
    serviceDefinitions,
    proposalStructure: mergeProposalStructureDefinitions(
      (serviceDefinitions || []).map(
        (serviceDefinition) =>
          serviceDefinition?.internalProposalStructure
          || serviceDefinition?.proposalStructure
          || "",
      ),
    ),
  };
};

const buildProjectProposalData = (input = {}, { fallback = null, preserveFallback = false } = {}) => {
  const mergedPayload = fallback ? { ...fallback, ...input } : input;
  const extractedFields = extractProjectProposalFields(mergedPayload);
  const proposalData = {};

  PROJECT_PROPOSAL_TEXT_FIELDS.forEach((field) => {
    if (hasOwnField(input, field)) {
      proposalData[field] = normalizeProjectProposalText(input[field]);
      return;
    }

    if (hasOwnField(extractedFields, field)) {
      proposalData[field] = normalizeProjectProposalText(extractedFields[field]);
      return;
    }

    if (preserveFallback && fallback && hasOwnField(fallback, field)) {
      proposalData[field] = normalizeProjectProposalText(fallback[field]);
    }
  });

  PROJECT_PROPOSAL_LIST_FIELDS.forEach((field) => {
    if (hasOwnField(input, field)) {
      proposalData[field] = normalizeProjectProposalList(input[field]);
      return;
    }

    if (hasOwnField(extractedFields, field)) {
      proposalData[field] = normalizeProjectProposalList(extractedFields[field]);
      return;
    }

    if (preserveFallback && fallback && hasOwnField(fallback, field)) {
      proposalData[field] = normalizeProjectProposalList(fallback[field]);
    }
  });

  if (hasOwnField(input, "proposalContent")) {
    proposalData.proposalContent = normalizeProjectProposalText(input.proposalContent);
  } else if (hasOwnField(extractedFields, "proposalContent")) {
    proposalData.proposalContent = normalizeProjectProposalText(extractedFields.proposalContent);
  } else if (preserveFallback && fallback && hasOwnField(fallback, "proposalContent")) {
    proposalData.proposalContent = normalizeProjectProposalText(fallback.proposalContent);
  }

  if (hasOwnField(input, "serviceKey")) {
    proposalData.serviceKey = normalizeProjectProposalText(input.serviceKey);
  } else if (hasOwnField(extractedFields, "serviceKey")) {
    proposalData.serviceKey = normalizeProjectProposalText(extractedFields.serviceKey);
  } else if (preserveFallback && fallback && hasOwnField(fallback, "serviceKey")) {
    proposalData.serviceKey = normalizeProjectProposalText(fallback.serviceKey);
  }

  const proposalJson = buildProjectProposalJson(mergedPayload);
  if (proposalJson) {
    proposalData.proposalJson = proposalJson;
  } else if (preserveFallback && fallback && hasOwnField(fallback, "proposalJson")) {
    proposalData.proposalJson = fallback.proposalJson;
  }

  return proposalData;
};

const hasMeaningfulValue = (value) => {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.some((entry) => hasMeaningfulValue(entry));
  if (typeof value === "object") return Object.values(value).some((entry) => hasMeaningfulValue(entry));
  if (typeof value === "number") return Number.isFinite(value);
  return String(value).trim().length > 0;
};

const buildProjectFreelancerMatchingContext = ({
  input = {},
  proposalData = null,
  fallback = null,
} = {}) => {
  const baseProposalData =
    proposalData && typeof proposalData === "object" ? proposalData : {};
  const mergedPayload = fallback
    ? { ...fallback, ...input, ...baseProposalData }
    : { ...input, ...baseProposalData };
  const budgetSource = hasOwnField(input, "budget")
    ? input.budget
    : hasOwnField(baseProposalData, "budget")
      ? baseProposalData.budget
      : fallback?.budget;

  return {
    ...mergedPayload,
    title: normalizeProjectProposalText(mergedPayload.title),
    description: normalizeProjectProposalText(
      mergedPayload.description
      || baseProposalData.projectOverview
      || baseProposalData.proposalContent
      || fallback?.description
      || "",
    ),
    budget: normalizeBudget(budgetSource),
    proposalContent: normalizeProjectProposalText(
      baseProposalData.proposalContent
      || mergedPayload.proposalContent
      || fallback?.proposalContent
      || "",
    ),
    proposalJson:
      baseProposalData.proposalJson
      || mergedPayload.proposalJson
      || buildProjectProposalJson(mergedPayload),
    serviceKey: normalizeProjectProposalText(mergedPayload.serviceKey),
    serviceType: normalizeProjectProposalText(
      baseProposalData.serviceType
      || mergedPayload.serviceType
      || mergedPayload.serviceName
      || mergedPayload.service
      || "",
    ),
  };
};

const hasFreelancerMatchingSource = (context = {}) =>
  hasMeaningfulValue(context?.title)
  || hasMeaningfulValue(context?.description)
  || hasMeaningfulValue(context?.proposalContent)
  || hasMeaningfulValue(context?.serviceKey)
  || hasMeaningfulValue(context?.serviceType)
  || PROJECT_PROPOSAL_FIELD_KEYS.some((field) => hasMeaningfulValue(context?.[field]))
  || hasMeaningfulValue(context?.proposalJson);

const buildProjectFreelancerMatchingData = async (
  input = {},
  { fallback = null, proposalData = null, preserveFallback = false } = {},
) => {
  const matchingContext = buildProjectFreelancerMatchingContext({
    input,
    proposalData,
    fallback,
  });

  if (!hasFreelancerMatchingSource(matchingContext)) {
    return preserveFallback && fallback && hasOwnField(fallback, "freelancerMatchingJson")
      ? { freelancerMatchingJson: fallback.freelancerMatchingJson }
      : {};
  }

  const freelancerMatchingJson = await generateFreelancerMatchingJson(
    matchingContext,
    [],
    matchingContext.serviceType || "",
    "",
  );

  if (freelancerMatchingJson) {
    return { freelancerMatchingJson };
  }

  return preserveFallback && fallback && hasOwnField(fallback, "freelancerMatchingJson")
    ? { freelancerMatchingJson: fallback.freelancerMatchingJson }
    : {};
};

const flattenFreelancerProfile = (freelancer = null) => {
  if (!freelancer || typeof freelancer !== "object") return freelancer;
  const profile =
    freelancer.freelancerProfile && typeof freelancer.freelancerProfile === "object"
      ? freelancer.freelancerProfile
      : {};
  const profileDetails =
    profile.profileDetails && typeof profile.profileDetails === "object"
      ? profile.profileDetails
      : {};
  const profilePhotoAvatar = extractAvatarUrl(profile.profilePhoto);
  const identityAvatar = extractAvatarUrl(profileDetails?.identity?.profilePhoto);
  const resolvedAvatar =
    freelancer.avatar ||
    profilePhotoAvatar ||
    identityAvatar ||
    buildFreelancerUnsplashAvatarUrl(freelancer);
  const hasProfileDetails = Object.keys(profileDetails).length > 0;

  return {
    ...freelancer,
    avatar: resolvedAvatar,
    profileDetails: hasProfileDetails ? profileDetails : undefined,
  };
};

const getProjectFreelancerReviewServiceId = (projectId) =>
  `project:${projectId}`;

const formatProjectFreelancerReview = (review) => {
  if (!review || typeof review !== "object") return null;

  return {
    id: review.id,
    rating: Number(review.rating || 0),
    comment: review.comment || "",
    clientId: review.clientId || null,
    clientName: review.clientName || "Client",
    createdAt: review.createdAt,
  };
};

const hydrateProjectForResponse = (project) => {
  if (!project || typeof project !== "object") return project;
  const safeProject = { ...project };
  delete safeProject.internalReviews;
  delete safeProject.freelancerMatchingJson;

  return attachProjectPaymentPlan({
    ...safeProject,
    proposals: Array.isArray(safeProject.proposals)
      ? safeProject.proposals.map((proposal) => ({
        ...proposal,
        freelancer: flattenFreelancerProfile(proposal.freelancer),
      }))
      : [],
  });
};

const PROJECT_MANAGER_SELECT = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  avatar: true,
  status: true,
  role: true,
};

const PROJECT_RESPONSE_INCLUDE = {
  owner: {
    select: { id: true, fullName: true, email: true },
  },
  proposals: {
    include: {
      freelancer: {
        select: {
          id: true,
          fullName: true,
          email: true,
          avatar: true,
          freelancerProfile: {
            select: {
              profilePhoto: true,
                  serviceDetails: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  },
  manager: {
    select: PROJECT_MANAGER_SELECT,
  },
  disputes: {
    select: { id: true, status: true },
  },
  _count: {
    select: { proposals: true },
  },
};

const MAX_FREELANCER_CHANGE_REQUESTS = 2;
const MAX_PM_DIRECT_REASSIGNMENTS = 2;
const PM_REASSIGNMENT_APPROVAL_SOURCE = "PM_FREELANCER_REASSIGNMENT_APPROVAL";

const findLeastLoadedActiveProjectManager = async () => {
  const managers = await prisma.user.findMany({
    where: {
      role: "PROJECT_MANAGER",
      status: "ACTIVE",
    },
    select: {
      ...PROJECT_MANAGER_SELECT,
      managedProjects: {
        where: {
          status: { notIn: ["COMPLETED", "PAUSED", "DRAFT"] }
        },
        select: { id: true },
        take: 11,
      }
    }
  });

  const available = managers
    .map(m => ({ ...m, activeCount: m.managedProjects.length }))
    .filter(m => m.activeCount < 10)
    .sort((a, b) => a.activeCount - b.activeCount);

  if (available.length === 0) return null;

  const selected = available[0];
  delete selected.managedProjects;
  delete selected.activeCount;
  return selected;
};

const getProjectForResponse = (projectId, tx = prisma) =>
  tx.project.findUnique({
    where: { id: projectId },
    include: PROJECT_RESPONSE_INCLUDE,
  });

const canTreatAsIdempotentCompletionRequest = (existingStatus = "", updates = {}) => {
  const normalizedStatus = String(existingStatus || "").toUpperCase();
  const updateKeys = Object.keys(updates || {});
  if (normalizedStatus !== "COMPLETED" || updateKeys.length !== 1) {
    return false;
  }

  return (
    updateKeys[0] === "status" &&
    String(updates?.status || "").toUpperCase() === "COMPLETED"
  );
};

const assertProjectCanBeCompleted = ({
  project = null,
  actorId = "",
  actorRole = "",
} = {}) => {
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  const normalizedActorRole = String(actorRole || "").toUpperCase();
  const isAdmin = normalizedActorRole === "ADMIN";
  const isOwner = String(project.ownerId || "") === String(actorId || "");

  if (!isOwner && !isAdmin) {
    throw new AppError("Only the project owner can complete this project.", 403);
  }

  const completionPlan = resolveProjectPaymentPlan(project);
  const completionPhases = Array.isArray(completionPlan?.phases)
    ? completionPlan.phases
    : [];
  const allPhasesComplete =
    completionPhases.length > 0 &&
    completionPhases.every((phase) => Boolean(phase?.isComplete));

  if (!allPhasesComplete) {
    throw new AppError(
      "All project phases must be verified before marking the project as completed.",
      400,
    );
  }
};

const applyProjectCompletionSideEffects = async ({
  projectId = "",
  acceptedFreelancerId = "",
} = {}) => {
  const normalizedProjectId = String(projectId || "").trim();
  if (!normalizedProjectId) {
    throw new AppError("Project ID is required for completion.", 400);
  }

  await archiveCompletedProject({
    projectId: normalizedProjectId,
  });

  const normalizedFreelancerId = String(acceptedFreelancerId || "").trim();
  if (!normalizedFreelancerId) {
    return;
  }

  try {
    const verified = await markFreelancerVerifiedAfterProjectCompletion(
      normalizedFreelancerId,
    );
    if (verified) {
      console.log(
        `[Verification] Marked freelancer ${normalizedFreelancerId} as verified after project ${normalizedProjectId} completion.`,
      );
    }
  } catch (verificationError) {
    console.error(
      `[Verification] Failed to mark freelancer ${normalizedFreelancerId} as verified after project ${normalizedProjectId} completion:`,
      verificationError,
    );
  }

  await syncFreelancerOpenToWorkStatus(normalizedFreelancerId).catch(() => null);
};

const getFreelancerChangeRequests = (project = {}) =>
  Array.isArray(project?.freelancerChangeRequests)
    ? project.freelancerChangeRequests
    : [];

const getLatestPendingFreelancerChangeRequest = (project = {}) =>
  [...getFreelancerChangeRequests(project)]
    .reverse()
    .find(
      (request) => String(request?.status || "").toUpperCase() === "PENDING"
    ) || null;

const safeJsonParse = (value, fallback = {}) => {
  if (!value || typeof value !== "string") return fallback;

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const resolveLatestAssignmentProposal = (project = {}) => {
  const proposals = Array.isArray(project?.proposals) ? project.proposals : [];

  return (
    proposals.find((proposal) => proposal?.status === "ACCEPTED") ||
    proposals.find((proposal) => proposal?.status === "REPLACED") ||
    proposals.find((proposal) => proposal?.status === "REJECTED") ||
    proposals[0] ||
    null
  );
};

const countPmFreelancerReassignments = (project = {}) => {
  const proposals = Array.isArray(project?.proposals) ? project.proposals : [];

  return proposals.filter((proposal) => {
    if (String(proposal?.status || "").toUpperCase() !== "REPLACED") return false;

    const reasonKey = String(proposal?.rejectionReasonKey || "").toLowerCase();
    return (
      reasonKey === "project_manager_reassignment" ||
      reasonKey === "project_manager_reassignment_admin_approved"
    );
  }).length;
};

const findOpenPmReassignmentApprovalRequest = async (projectId) =>
  prisma.adminEscalation.findFirst({
    where: {
      projectId,
      status: "OPEN",
      notes: {
        contains: `"source":"${PM_REASSIGNMENT_APPROVAL_SOURCE}"`,
      },
    },
    orderBy: { createdAt: "desc" },
  });

const notifyAdminsAboutPmReassignmentApproval = async ({
  projectId,
  projectTitle,
  requestedByName,
  freelancerName,
}) => {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", status: "ACTIVE" },
    select: { id: true },
  });

  await Promise.all(
    admins.map((admin) =>
      sendNotificationToUser(admin.id, {
        type: "admin_approval_required",
        title: "Freelancer reassignment approval required",
        message: `${requestedByName} requested Admin approval to assign ${freelancerName} on "${projectTitle}".`,
        data: { projectId },
      }).catch(() => null)
    )
  );
};

const buildFreelancerChangeRequestRecord = ({
  reason,
  requestCount,
  requestedById,
  managerId,
  previousFreelancer,
}) => ({
  id: crypto.randomUUID(),
  status: "PENDING",
  requestNumber: requestCount + 1,
  reason,
  requestedById,
  managerId: managerId || null,
  previousFreelancerId: previousFreelancer?.id || null,
  previousFreelancerName: previousFreelancer?.fullName || null,
  requestedAt: new Date().toISOString(),
  resolvedAt: null,
  resolvedById: null,
  replacementFreelancerId: null,
  replacementFreelancerName: null,
});

const resolveFreelancerChangeRequestsAfterAssignment = ({
  requests = [],
  resolverId,
  replacementFreelancer,
}) => {
  let resolved = false;

  return requests.map((request) => {
    if (
      resolved ||
      String(request?.status || "").toUpperCase() !== "PENDING"
    ) {
      return request;
    }

    resolved = true;

    return {
      ...request,
      status: "RESOLVED",
      resolvedAt: new Date().toISOString(),
      resolvedById: resolverId,
      replacementFreelancerId: replacementFreelancer?.id || null,
      replacementFreelancerName: replacementFreelancer?.fullName || null,
    };
  });
};

export const createProject = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const { title, description, budget, status, proposal } = req.body;
  const { proposalStructure: resolvedInternalProposalStructure } =
    await resolveProjectProposalStructure({
    input: req.body,
  });
  const proposalPayload = resolvedInternalProposalStructure
    ? {
      ...req.body,
      proposalStructure: resolvedInternalProposalStructure,
    }
    : req.body;
  const structuredProposalData = buildProjectProposalData(proposalPayload);
  const isAgencyProposal = resolveProjectAgencyProposalFlag({
    payload: req.body,
  });
  const freelancerMatchingData = await buildProjectFreelancerMatchingData(req.body, {
    proposalData: structuredProposalData,
  });

  console.log("Looking for an available Project Manager...");
  const projectManager = await findLeastLoadedActiveProjectManager();
  console.log(`Assigning Project Manager: ${projectManager ? projectManager.id : "None found"}`);

  const project = await prisma.project.create({
    data: {
      title,
      description,
      budget: normalizeBudget(budget),
      ...structuredProposalData,
      ...freelancerMatchingData,
      isAgencyProposal,
      status: status || "DRAFT",
      progress: 0,
      ownerId: userId,
      managerId: projectManager?.id,
    },
  });

  let createdProposal = null;

  if (proposal?.coverLetter) {
    const freelancerId = proposal.freelancerId || userId;

    createdProposal = await prisma.proposal.create({
      data: {
        coverLetter: proposal.coverLetter,
        amount: normalizeAmount(proposal.amount),
        status: proposal.status || "PENDING",
        freelancerId,
        projectId: project.id,
      },
    });
  }

  if (
    createdProposal?.status === "ACCEPTED" &&
    String(project.status || status || "").toUpperCase() !== "DRAFT"
  ) {
    await syncFreelancerOpenToWorkStatus(createdProposal.freelancerId).catch(() => null);
  }

  res.status(201).json({
    data: {
      project: hydrateProjectForResponse(project),
      proposal: createdProposal,
    },
  });
});

export const listProjects = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  if (!prisma) {
    console.error("Prisma client is null in listProjects");
    throw new AppError("Database client not initialized", 500);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    let where = {};

    if (user?.role === "ADMIN") {
      where = {};
    } else if (user?.role === "PROJECT_MANAGER") {
      where = { managerId: userId };
    } else {
      where = { ownerId: userId };
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        owner: {
          select: { id: true, fullName: true, email: true },
        },
        proposals: {
          include: {
            freelancer: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatar: true,
                freelancerProfile: {
                  select: {
                    serviceDetails: true,
                    profilePhoto: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        disputes: {
          select: { id: true, status: true },
        },
        _count: {
          select: { proposals: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const hydratedProjects = projects.map((project) => hydrateProjectForResponse(project));
    res.json({ data: hydratedProjects });
  } catch (error) {
    console.error("Error listing projects:", error);
    throw new AppError(`Failed to fetch projects: ${error.message}`, 500);
  }
});

export const getProject = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const { id } = req.params;

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const userRolePromise = prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  let project = await getProjectForResponse(id);

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  const hasActiveAssignedManager =
    project.manager?.role === "PROJECT_MANAGER" &&
    project.manager?.status === "ACTIVE";

  if (!hasActiveAssignedManager) {
    const fallbackManager = await findLeastLoadedActiveProjectManager();

    if (fallbackManager) {
      if (project.managerId !== fallbackManager.id) {
        await prisma.project.update({
          where: { id: project.id },
          data: { managerId: fallbackManager.id },
        });
      }

      project = {
        ...project,
        managerId: fallbackManager.id,
        manager: fallbackManager,
      };
    } else {
      project = {
        ...project,
        managerId: null,
        manager: null,
      };
    }
  }

  const user = await userRolePromise;

  if (user?.role === "PROJECT_MANAGER" && project.managerId !== userId) {
    throw new AppError("Access denied. You are not assigned to this project.", 403);
  }

  const hydratedProject = hydrateProjectForResponse(project);
  let clientFreelancerReview = null;
  if (project.ownerId === userId) {
    const reviewRecord = await prisma.review.findFirst({
      where: {
        serviceId: getProjectFreelancerReviewServiceId(project.id),
        clientId: userId,
      },
      orderBy: { createdAt: "desc" },
    });

    clientFreelancerReview = formatProjectFreelancerReview(reviewRecord);
  }

  res.json({
    data: {
      ...hydratedProject,
      clientFreelancerReview,
    },
  });
});
export const updateProject = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const { id } = req.params;
  const { notificationMeta, ...updates } = req.body;

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  // Check existence and get current state
  const existing = await prisma.project.findUnique({
    where: { id },
    include: {
      proposals: true,
      owner: { select: { id: true, fullName: true } }
    }
  });

  if (!existing) {
    throw new AppError("Project not found", 404);
  }

  // Allow owner OR accepted freelancer to update progress/tasks
  const isOwner = existing.ownerId === userId;
  const acceptedProposal = existing.proposals?.find(
    p => p.status === "ACCEPTED"
  );
  const isAcceptedFreelancer = acceptedProposal?.freelancerId === userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });
  const isAssignedPM = user?.role === "PROJECT_MANAGER" && existing.managerId === userId;
  const isAdmin = user?.role === "ADMIN";

  if (!isOwner && !isAcceptedFreelancer && !isAssignedPM && !isAdmin) {
    throw new AppError("Permission denied", 403);
  }

  const hasRequestedUpdates = Object.keys(updates || {}).length > 0;
  const existingStatus = String(existing.status || "").toUpperCase();

  if (
    !isAdmin &&
    existingStatus === "COMPLETED" &&
    hasRequestedUpdates &&
    !canTreatAsIdempotentCompletionRequest(existingStatus, updates)
  ) {
    throw new AppError(
      "This project has been completed and can no longer be changed.",
      400
    );
  }

  try {
    // Whitelist only fields that exist on the Prisma Project model
    const allowedFields = new Set([
      "title", "description", "budget", "status", "progress",
      "spent", "completedTasks", "verifiedTasks", "notes", "externalLink",
      ...PROJECT_PROPOSAL_FIELD_KEYS,
    ]);

    // Admins can manually set managerId
    if (isAdmin) {
      allowedFields.add("managerId");
    }

    const sanitizedUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.has(key)) {
        if (key === "budget") {
          sanitizedUpdates[key] = normalizeBudget(value);
          continue;
        }

        if (PROJECT_PROPOSAL_TEXT_FIELD_SET.has(key) || key === "proposalContent" || key === "serviceKey") {
          sanitizedUpdates[key] = normalizeProjectProposalText(value);
          continue;
        }

        if (PROJECT_PROPOSAL_LIST_FIELD_SET.has(key)) {
          sanitizedUpdates[key] = normalizeProjectProposalList(value);
          continue;
        }

        sanitizedUpdates[key] = value;
      }
    }

    if (Object.prototype.hasOwnProperty.call(sanitizedUpdates, "status")) {
      const nextStatus = String(sanitizedUpdates.status || "").toUpperCase();
      sanitizedUpdates.status = nextStatus;

      if (nextStatus === "COMPLETED") {
        assertProjectCanBeCompleted({
          project: {
            ...existing,
            ...sanitizedUpdates,
          },
          actorId: userId,
          actorRole: user?.role,
        });
      }
    }

    const shouldRefreshProposalFields =
      hasOwnField(updates, "description")
      || hasOwnField(updates, "proposalContent")
      || hasOwnField(updates, "serviceKey")
      || hasOwnField(updates, "proposalContext")
      || PROJECT_PROPOSAL_FIELD_KEYS.some((field) => hasOwnField(updates, field));

    const shouldRefreshFreelancerMatching =
      shouldRefreshProposalFields
      || hasOwnField(updates, "title")
      || hasOwnField(updates, "budget");

    const resolvedProposalStructure = shouldRefreshProposalFields
      ? await resolveProjectProposalStructure({
        input: updates,
        fallback: existing,
      })
      : null;

    if (shouldRefreshProposalFields) {
      const resolvedInternalProposalStructure =
        resolvedProposalStructure?.proposalStructure || "";
      const proposalPayload = resolvedInternalProposalStructure
        ? {
          ...updates,
          proposalStructure: resolvedInternalProposalStructure,
        }
        : updates;
      Object.assign(
        sanitizedUpdates,
        buildProjectProposalData(proposalPayload, {
          fallback: existing,
          preserveFallback: true,
        }),
      );
      sanitizedUpdates.isAgencyProposal = resolveProjectAgencyProposalFlag({
        payload: updates,
        fallback: existing,
      });
    }

    if (shouldRefreshFreelancerMatching) {
      Object.assign(
        sanitizedUpdates,
        await buildProjectFreelancerMatchingData(
          {
            ...updates,
            ...sanitizedUpdates,
          },
          {
            fallback: existing,
            proposalData: shouldRefreshProposalFields ? sanitizedUpdates : null,
            preserveFallback: true,
          },
        ),
      );
    }

    if (Object.prototype.hasOwnProperty.call(sanitizedUpdates, "verifiedTasks")) {
      const currentPaymentPlan = resolveProjectPaymentPlan(existing);
      const nextProjectState = {
        ...existing,
        ...sanitizedUpdates,
      };
      const paymentPlan = resolveProjectPaymentPlan(nextProjectState);
      const currentCompletedTaskIds = normalizeTaskIdArray(
        existing?.completedTasks
      );
      const currentVerifiedTaskIds = new Set(
        normalizeTaskIdArray(existing?.verifiedTasks)
      );
      const currentVerifiedTaskIdList = Array.from(currentVerifiedTaskIds);
      const proposedVerifiedTaskIds = normalizeTaskIdArray(
        sanitizedUpdates.verifiedTasks
      );
      const currentPhaseOrderMap = buildPhaseOrderMap(
        currentPaymentPlan?.phases || []
      );
      const phaseOrderMap = buildPhaseOrderMap(paymentPlan?.phases || []);
      const lockedRemovedTaskId = currentVerifiedTaskIdList.find((taskId) => {
        if (proposedVerifiedTaskIds.includes(taskId)) {
          return false;
        }

        const taskPhaseId = String(taskId).split("-")[0];
        return isCompletedPhaseLockedAfterAdvance({
          phaseId: taskPhaseId,
          completedPhaseIds: currentPaymentPlan?.completedPhaseIds || [],
          phaseOrderMap: currentPhaseOrderMap,
          completedTaskIds: currentCompletedTaskIds,
          verifiedTaskIds: currentVerifiedTaskIdList,
        });
      });

      if (lockedRemovedTaskId) {
        throw new AppError(
          "Verified tasks from a completed phase cannot be changed once a later phase has started.",
          400
        );
      }

      const blockedTaskId = proposedVerifiedTaskIds.find((taskId) => {
        if (currentVerifiedTaskIds.has(taskId)) {
          return false;
        }

        const taskPhaseId = String(taskId).split("-")[0];
        return isTaskPhaseLockedByPayment({
          phaseId: taskPhaseId,
          phaseOrderMap,
          paymentPlan,
        });
      });

      if (blockedTaskId) {
        const installmentLabel =
          paymentPlan?.nextDueInstallment?.label || "the pending milestone payment";
        throw new AppError(
          `Complete ${installmentLabel} before verifying tasks in later phases.`,
          400
        );
      }
    }

    if (sanitizedUpdates.managerId) {
      // Admin manual assignment - enforce 10 cap
      const targetManager = await prisma.user.findUnique({
        where: { id: sanitizedUpdates.managerId },
        include: { managedProjects: { where: { status: { notIn: ["COMPLETED", "PAUSED", "DRAFT"] } } } }
      });
      if (!targetManager || targetManager.role !== "PROJECT_MANAGER") {
        throw new AppError("Invalid Project Manager ID", 400);
      }
      if (targetManager.managedProjects.length >= 10) {
        throw new AppError("This Project Manager has reached the maximum capacity of 10 active projects.", 403);
      }
    }

    console.log("DEBUG: Attempting to update project", id, "with sanitized data:", JSON.stringify(sanitizedUpdates));
    const project = await prisma.project.update({
      where: { id },
      data: sanitizedUpdates
    });
    console.log("DEBUG: Update successful");

    if (String(sanitizedUpdates.status || "").toUpperCase() === "COMPLETED") {
      await applyProjectCompletionSideEffects({
        projectId: id,
        acceptedFreelancerId: acceptedProposal?.freelancerId,
      });
    } else if (
      Object.prototype.hasOwnProperty.call(sanitizedUpdates, "status") &&
      acceptedProposal?.freelancerId
    ) {
      await syncFreelancerOpenToWorkStatus(acceptedProposal.freelancerId).catch(() => null);
    }

    // Send notification based on notificationMeta
    if (notificationMeta?.type && notificationMeta?.taskName) {
      const taskName = notificationMeta.taskName;

      if (notificationMeta.type === "TASK_COMPLETED" && isAcceptedFreelancer) {
        // Freelancer completed a task -> notify client
        await sendNotificationToUser(existing.ownerId, {
          audience: "client",
          type: "task_completed",
          title: "Task Completed",
          message: `Freelancer marked "${taskName}" as completed. Please verify.`,
          data: { projectId: id, taskName }
        });
        console.log(`[Notification] Task completion notification sent to client ${existing.ownerId}`);
      } else if (notificationMeta.type === "TASK_VERIFIED" && isOwner) {
        // Client verified a task -> notify freelancer
        if (acceptedProposal?.freelancerId) {
          await sendNotificationToUser(acceptedProposal.freelancerId, {
            audience: "freelancer",
            type: "task_verified",
            title: "Task Verified",
            message: `Client verified "${taskName}".`,
            data: { projectId: id, taskName }
          });
          console.log(`[Notification] Task verification notification sent to freelancer ${acceptedProposal.freelancerId}`);
        }
      } else if (notificationMeta.type === "TASK_UNVERIFIED" && isOwner) {
        // Client un-verified a task -> notify freelancer
        if (acceptedProposal?.freelancerId) {
          await sendNotificationToUser(acceptedProposal.freelancerId, {
            audience: "freelancer",
            type: "task_unverified",
            title: "Task Un-verified",
            message: `Client removed verification for "${taskName}". Please review.`,
            data: { projectId: id, taskName }
          });
          console.log(`[Notification] Task un-verification notification sent to freelancer ${acceptedProposal.freelancerId}`);
        }
      }
    }

    const hydratedProject = hydrateProjectForResponse({
      ...project,
      proposals: Array.isArray(existing.proposals) ? existing.proposals : [],
    });

    res.json({ data: hydratedProject });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Update project error:", error);
    console.error("Error code:", error.code);
    console.error("Error meta:", error.meta);
    throw new AppError(`Failed to update project: ${error.message}`, 500);
  }
});

export const completeProject = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const { id } = req.params;

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const [project, user] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        proposals: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    }),
  ]);

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  const acceptedProposal = Array.isArray(project?.proposals)
    ? project.proposals.find((proposal) => proposal?.status === "ACCEPTED")
    : null;
  const currentStatus = String(project.status || "").toUpperCase();
  const normalizedActorRole = String(user?.role || "").toUpperCase();
  const isAdmin = normalizedActorRole === "ADMIN";
  const isOwner = String(project.ownerId || "") === String(userId || "");

  if (!isOwner && !isAdmin) {
    throw new AppError("Only the project owner can complete this project.", 403);
  }

  if (currentStatus !== "COMPLETED") {
    assertProjectCanBeCompleted({
      project,
      actorId: userId,
      actorRole: user?.role,
    });

    await prisma.project.update({
      where: { id },
      data: {
        status: "COMPLETED",
      },
    });
  }

  await applyProjectCompletionSideEffects({
    projectId: id,
    acceptedFreelancerId: acceptedProposal?.freelancerId,
  });

  const completedProject = await getProjectForResponse(id);

  res.json({
    data: hydrateProjectForResponse(completedProject),
    message:
      currentStatus === "COMPLETED"
        ? "Project was already completed."
        : "Project marked as completed.",
  });
});

export const requestFreelancerChange = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const { id } = req.params;
  const reason = String(req.body?.reason || "").trim();

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  if (reason.length < 10) {
    throw new AppError(
      "Please provide a clear reason with at least 10 characters.",
      400
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user || user.role !== "CLIENT") {
    throw new AppError("Only the client can request a freelancer change.", 403);
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      manager: {
        select: PROJECT_MANAGER_SELECT,
      },
      proposals: {
        where: { status: "ACCEPTED" },
        include: {
          freelancer: {
            select: { id: true, fullName: true, email: true },
          },
        },
      },
    },
  });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  if (project.ownerId !== userId) {
    throw new AppError("Only the project owner can request this change.", 403);
  }

  const activeFreelancer = project.proposals[0]?.freelancer || null;
  if (!activeFreelancer) {
    throw new AppError("There is no assigned freelancer to replace yet.", 400);
  }

  const existingRequests = getFreelancerChangeRequests(project);
  if (getLatestPendingFreelancerChangeRequest(project)) {
    throw new AppError(
      "A freelancer change request is already pending for this project.",
      409
    );
  }

  const requestCount = Number(project.freelancerChangeCount || 0);
  if (requestCount >= MAX_FREELANCER_CHANGE_REQUESTS) {
    throw new AppError(
      `You have already used all ${MAX_FREELANCER_CHANGE_REQUESTS} freelancer change requests for this project.`,
      400
    );
  }

  let assignedManager = project.manager;
  if (
    !assignedManager ||
    assignedManager.role !== "PROJECT_MANAGER" ||
    assignedManager.status !== "ACTIVE"
  ) {
    assignedManager = await findLeastLoadedActiveProjectManager();
  }

  if (!assignedManager?.id) {
    throw new AppError(
      "No active Project Manager is available right now. Please try again shortly.",
      503
    );
  }

  const nextRequest = buildFreelancerChangeRequestRecord({
    reason,
    requestCount,
    requestedById: userId,
    managerId: assignedManager.id,
    previousFreelancer: activeFreelancer,
  });

  await prisma.project.update({
    where: { id },
    data: {
      managerId: assignedManager.id,
      freelancerChangeCount: requestCount + 1,
      freelancerChangeRequests: [...existingRequests, nextRequest],
    },
  });

  try {
    await sendNotificationToUser(assignedManager.id, {
      type: "freelancer_change_request",
      title: "Freelancer change requested",
      message: `Client requested a freelancer change for "${project.title}".`,
      data: {
        projectId: id,
        requestId: nextRequest.id,
        requestNumber: nextRequest.requestNumber,
      },
    });
  } catch (notificationError) {
    console.error(
      "Failed to notify project manager about freelancer change request:",
      notificationError
    );
  }

  const updatedProject = await getProjectForResponse(id);

  res.status(201).json({
    data: hydrateProjectForResponse(updatedProject),
    message: "Your freelancer change request has been sent to the Project Manager.",
  });
});

export const submitProjectFreelancerReview = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const { id } = req.params;
  const ratingValue = Number(req.body?.rating);
  const comment = String(req.body?.comment || "").trim();

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
    throw new AppError("Rating must be an integer between 1 and 5.", 400);
  }

  if (comment.length < 5) {
    throw new AppError("Please add at least 5 characters in your review.", 400);
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: {
        select: { id: true, fullName: true },
      },
      proposals: {
        where: { status: "ACCEPTED" },
        include: {
          freelancer: {
            select: { id: true, fullName: true },
          },
        },
      },
    },
  });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  if (project.ownerId !== userId) {
    throw new AppError("Only the project owner can submit this review.", 403);
  }

  if (String(project.status || "").toUpperCase() !== "COMPLETED") {
    throw new AppError("You can review the freelancer after project completion.", 400);
  }

  const acceptedProposal = project.proposals?.[0] || null;
  if (!acceptedProposal?.freelancerId) {
    throw new AppError("No assigned freelancer found for this project.", 400);
  }

  const serviceId = getProjectFreelancerReviewServiceId(project.id);
  const existingReview = await prisma.review.findFirst({
    where: {
      serviceId,
      clientId: userId,
    },
    orderBy: { createdAt: "desc" },
  });

  let review;
  if (existingReview) {
    review = await prisma.review.update({
      where: { id: existingReview.id },
      data: {
        rating: ratingValue,
        comment,
      },
    });
  } else {
    review = await prisma.review.create({
      data: {
        serviceId,
        clientId: userId,
        clientName: project.owner?.fullName || "Client",
        rating: ratingValue,
        comment,
      },
    });
  }

  try {
    await sendNotificationToUser(acceptedProposal.freelancerId, {
      audience: "freelancer",
      type: "freelancer_review",
      title: "New Client Review",
      message: `Client reviewed your work for project "${project.title}".`,
      data: {
        projectId: project.id,
        rating: review.rating,
      },
    });
  } catch (notificationError) {
    console.error("Failed to notify freelancer about review:", notificationError);
  }

  const refreshedProject = await getProjectForResponse(id);
  const hydratedProject = hydrateProjectForResponse(refreshedProject);

  res.status(existingReview ? 200 : 201).json({
    data: {
      review: formatProjectFreelancerReview(review),
      project: {
        ...hydratedProject,
        clientFreelancerReview: formatProjectFreelancerReview(review),
      },
    },
    message: existingReview
      ? "Freelancer review updated successfully."
      : "Thanks for reviewing your freelancer.",
  });
});

const getProjectForUpfrontPayment = async (projectId) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      proposals: {
        where: { status: "ACCEPTED" },
        include: { freelancer: true },
      },
    },
  });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  return project;
};

const assertProjectOwnerCanPay = (project, userId) => {
  if (project.ownerId !== userId) {
    throw new AppError("Only the project owner can make payments", 403);
  }
};

const resolveDueInstallmentForPayment = (project) => {
  const paymentPlan = resolveProjectPaymentPlan(project, {
    requireAcceptedProposal: true,
  });
  const installment = paymentPlan?.nextDueInstallment;

  if (!installment) {
    throw new AppError("No client payment is due for this project right now", 400);
  }

  return {
    acceptedProposal: project.proposals?.[0],
    paymentPlan,
    installment,
  };
};

const buildRazorpaySignature = ({ orderId, paymentId }) =>
  crypto
    .createHmac("sha256", env.RAZORPAY_API_SECRET || "")
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

export const createUpfrontPaymentOrder = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const { id } = req.params;

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  if (!hasRazorpayCredentials()) {
    throw new AppError(
      "Razorpay is not configured. Set RAZORPAY_API_KEY and RAZORPAY_API_SECRET on backend.",
      503
    );
  }

  const razorpay = getRazorpayClient();
  if (!razorpay) {
    throw new AppError("Unable to initialize Razorpay client", 503);
  }

  const project = await getProjectForUpfrontPayment(id);
  assertProjectOwnerCanPay(project, userId);
  const { acceptedProposal, paymentPlan, installment } =
    resolveDueInstallmentForPayment(project);

  const receipt = `payment_${installment.sequence}_${id.slice(-8)}_${Date.now()}`.slice(0, 40);
  const order = await razorpay.orders.create({
    amount: installment.amount * 100,
    currency: "INR",
    receipt,
    notes: {
      projectId: id,
      ownerId: userId,
      freelancerId: acceptedProposal.freelancerId,
      paymentType: installment.key,
      paymentSequence: String(installment.sequence),
    },
  });

  res.json({
    data: {
      key: env.RAZORPAY_API_KEY,
      orderId: order.id,
      amount: installment.amount,
      amountPaise: order.amount,
      currency: order.currency,
      percentage: installment.percentage,
      installment,
      paymentPlan,
      projectId: id,
      projectTitle: project.title,
    },
  });
});

export const verifyUpfrontPayment = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const { id } = req.params;
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body || {};

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  if (!hasRazorpayCredentials()) {
    throw new AppError("Razorpay is not configured on backend", 503);
  }

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new AppError("Missing Razorpay verification payload", 400);
  }

  const razorpay = getRazorpayClient();
  if (!razorpay) {
    throw new AppError("Unable to initialize Razorpay client", 503);
  }

  const project = await getProjectForUpfrontPayment(id);
  assertProjectOwnerCanPay(project, userId);
  const { acceptedProposal, paymentPlan, installment } =
    resolveDueInstallmentForPayment(project);

  const expectedSignature = buildRazorpaySignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
  });

  if (expectedSignature !== razorpaySignature) {
    throw new AppError("Invalid Razorpay payment signature", 400);
  }

  const [orderDetails, paymentDetails] = await Promise.all([
    razorpay.orders.fetch(razorpayOrderId),
    razorpay.payments.fetch(razorpayPaymentId),
  ]);

  if (!orderDetails || !paymentDetails) {
    throw new AppError("Unable to validate payment details from Razorpay", 400);
  }

  if (String(paymentDetails.order_id || "") !== String(razorpayOrderId)) {
    throw new AppError("Payment does not belong to this Razorpay order", 400);
  }

  if (String(orderDetails?.notes?.projectId || "") !== String(id)) {
    throw new AppError("Razorpay order does not belong to this project", 400);
  }

  if (String(orderDetails?.notes?.paymentSequence || "") !== String(installment.sequence)) {
    throw new AppError("Razorpay order does not match the payment installment due", 400);
  }

  if (Number(orderDetails.amount || 0) !== installment.amount * 100) {
    throw new AppError("Paid amount does not match the required installment", 400);
  }

  if (!["authorized", "captured"].includes(String(paymentDetails.status || ""))) {
    throw new AppError("Payment is not completed yet. Please try again.", 400);
  }

  const nextSpentAmount = Math.min(
    paymentPlan.totalAmount,
    paymentPlan.paidAmount + installment.amount
  );
  const nextStatus =
    installment.sequence === 1
      ? "IN_PROGRESS"
      : nextSpentAmount >= paymentPlan.totalAmount && paymentPlan.completedPhaseCount >= 4
        ? "COMPLETED"
        : project.status;

  const updatedProjectRecord = await prisma.project.update({
    where: { id },
    data: {
      spent: nextSpentAmount,
      status: nextStatus,
    },
  });

  if (acceptedProposal?.freelancerId) {
    await syncFreelancerOpenToWorkStatus(acceptedProposal.freelancerId).catch(() => null);
  }

  const updatedProject = hydrateProjectForResponse({
    ...project,
    ...updatedProjectRecord,
    spent: nextSpentAmount,
    status: nextStatus,
  });

  const paymentMessage =
    installment.sequence === 1
      ? `Initial 20% payment completed. "${project.title}" is now active.`
      : installment.sequence === 2
        ? `40% payment completed after phase 2 for "${project.title}".`
        : `Final 40% payment completed for "${project.title}".`;

  try {
    await sendNotificationToUser(acceptedProposal.freelancerId, {
      audience: "freelancer",
      type: "payment",
      title: "Client Payment Completed",
      message: paymentMessage,
      data: {
        projectId: id,
        paymentId: razorpayPaymentId,
        installmentSequence: installment.sequence,
      },
    });
  } catch (notificationError) {
    console.error("Failed to notify freelancer after payment:", notificationError);
  }

  res.json({
    data: {
      project: updatedProject,
      paymentAmount: installment.amount,
      installment,
      paymentPlan: updatedProject.paymentPlan,
      message: paymentMessage,
      payment: {
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        status: paymentDetails.status,
      },
    },
  });
});

export const payUpfront = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const { id } = req.params;

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }
  if (hasRazorpayCredentials()) {
    throw new AppError(
      "Direct payment is disabled when Razorpay is configured. Use the Razorpay checkout flow.",
      400
    );
  }

  const project = await getProjectForUpfrontPayment(id);
  assertProjectOwnerCanPay(project, userId);
  const { paymentPlan, installment } = resolveDueInstallmentForPayment(project);

  const nextSpentAmount = Math.min(
    paymentPlan.totalAmount,
    paymentPlan.paidAmount + installment.amount
  );
  const nextStatus =
    installment.sequence === 1
      ? "IN_PROGRESS"
      : nextSpentAmount >= paymentPlan.totalAmount && paymentPlan.completedPhaseCount >= 4
        ? "COMPLETED"
        : project.status;

  const updatedProjectRecord = await prisma.project.update({
    where: { id },
    data: {
      spent: nextSpentAmount,
      status: nextStatus,
    },
  });

  if (acceptedProposal?.freelancerId) {
    await syncFreelancerOpenToWorkStatus(acceptedProposal.freelancerId).catch(() => null);
  }

  const updatedProject = hydrateProjectForResponse({
    ...project,
    ...updatedProjectRecord,
    spent: nextSpentAmount,
    status: nextStatus,
  });

  const message =
    installment.sequence === 1
      ? `Initial 20% payment processed. "${project.title}" is now active.`
      : installment.sequence === 2
        ? `40% payment processed after phase 2 for "${project.title}".`
        : `Final 40% payment processed for "${project.title}".`;

  res.json({
    data: {
      project: updatedProject,
      paymentAmount: installment.amount,
      installment,
      paymentPlan: updatedProject.paymentPlan,
      message,
    },
  });
});

export const createProjectPaymentOrder = createUpfrontPaymentOrder;
export const verifyProjectPayment = verifyUpfrontPayment;
export const payProjectInstallment = payUpfront;

// ==========================================
// PROJECT MANAGER UPGRADES
// ==========================================

// Helper: Check if user is Admin or Assigned PM
const requirePmOrAdmin = async (userId, projectId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role === "ADMIN") return true;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new AppError("Project not found", 404);

  if (user?.role === "PROJECT_MANAGER" && project.managerId === userId) {
    return true;
  }

  throw new AppError("Access denied. Admin or Assigned PM only.", 403);
};

// --- Kanban Tasks ---

export const getKanbanTasks = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const { id } = req.params;
  if (!userId) throw new AppError("Authentication required", 401);

  // Basic access check (anyone who can view the project can view tasks for now, or restrict to participants)
  // For safety, let's keep it simple: if you can view the project, you can view tasks.
  const tasks = await prisma.projectTask.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "asc" }
  });

  res.json({ data: tasks });
});

export const createKanbanTask = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const { id } = req.params;
  const { title, description, status, deadline } = req.body;
  if (!userId) throw new AppError("Authentication required", 401);
  await requirePmOrAdmin(userId, id);

  if (!title) throw new AppError("Task title is required", 400);

  const task = await prisma.projectTask.create({
    data: {
      title,
      description,
      status: status || "TO_DO",
      deadline: deadline ? new Date(deadline) : null,
      projectId: id
    }
  });

  res.status(201).json({ data: task });
});

export const updateKanbanTask = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const { id, taskId } = req.params;
  const { title, description, status, deadline } = req.body;
  if (!userId) throw new AppError("Authentication required", 401);
  await requirePmOrAdmin(userId, id);

  const task = await prisma.projectTask.update({
    where: { id: taskId, projectId: id },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(status && { status }),
      ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null })
    }
  });

  res.json({ data: task });
});

export const generateMicroTasks = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const { id } = req.params;
  if (!userId) throw new AppError("Authentication required", 401);
  await requirePmOrAdmin(userId, id);

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) throw new AppError("Project not found", 404);

  // Stub template-based generation based on project title/type
  let generatedTasks = [];
  const lowerTitle = project.title.toLowerCase();

  if (lowerTitle.includes("website") || lowerTitle.includes("app")) {
    generatedTasks = [
      { title: "Define technical requirements & stack", status: "TO_DO", deadline: null },
      { title: "Create initial UI/UX wireframes", status: "TO_DO", deadline: null },
      { title: "Setup repository and CI/CD pipelines", status: "TO_DO", deadline: null },
      { title: "Implement core backend API", status: "TO_DO", deadline: null }
    ];
  } else if (lowerTitle.includes("logo") || lowerTitle.includes("brand")) {
    generatedTasks = [
      { title: "Create moodboard and brand identity directions", status: "TO_DO", deadline: null },
      { title: "Draft 3 initial logo concepts", status: "TO_DO", deadline: null },
      { title: "Finalize logo typography and color palette", status: "TO_DO", deadline: null },
      { title: "Prepare brand guideline document", status: "TO_DO", deadline: null }
    ];
  } else {
    generatedTasks = [
      { title: "Kickoff meeting and requirement gathering", status: "TO_DO", deadline: null },
      { title: "Draft initial project milestone breakdown", status: "TO_DO", deadline: null },
      { title: "Submit first deliverable for review", status: "TO_DO", deadline: null }
    ];
  }

  res.json({ data: generatedTasks });
});

// --- Escrow Release ---

export const releaseEscrow = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const { id } = req.params;
  if (!userId) throw new AppError("Authentication required", 401);
  await requirePmOrAdmin(userId, id);

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      proposals: { where: { status: "ACCEPTED" } }
    }
  });

  if (!project) throw new AppError("Project not found", 404);
  const acceptedProposal = project.proposals[0];
  if (!acceptedProposal) throw new AppError("No accepted freelancer proposal found to release to", 400);

  const paymentPlan = resolveProjectPaymentPlan(project);
  if (!paymentPlan) throw new AppError("Could not resolve payment plan", 400);

  const nextInstallment = paymentPlan.nextUnpaidInstallment;
  if (!nextInstallment) {
    return res.json({ message: "No pending installments to release." });
  }

  const requiredPhase = nextInstallment.dueAfterCompletedPhases || 1; // Default to phase 1 if 0

  // Check for PM milestone approval explicitly for THIS exact phase
  const milestoneApproval = await prisma.milestoneApproval.findFirst({
    where: {
      projectId: id,
      phase: requiredPhase
    }
  });

  if (!milestoneApproval) {
    throw new AppError(`Project Manager must approve Phase ${requiredPhase} before these funds can be released.`, 403);
  }

  // Check existing payments to ensure idempotency
  const existingPayment = await prisma.payment.findFirst({
    where: { projectId: id, freelancerId: acceptedProposal.freelancerId }
  });

  if (existingPayment?.status === "COMPLETED") {
    return res.json({
      data: existingPayment,
      message: "Funds have already been released for this project."
    });
  }

  const amountToRelease = nextInstallment.amount;
  const platformFee = Math.round(amountToRelease * 0.3);
  const freelancerAmount = amountToRelease - platformFee;

  let payment;
  if (existingPayment && existingPayment.status === "PENDING") {
    // Update existing
    payment = await prisma.payment.update({
      where: { id: existingPayment.id },
      data: {
        status: "COMPLETED",
        paidAt: new Date()
      }
    });
  } else {
    // Create new
    payment = await prisma.payment.create({
      data: {
        amount: amountToRelease,
        platformFee,
        freelancerAmount,
        currency: "INR",
        status: "COMPLETED",
        paidAt: new Date(),
        description: "Escrow release for completed milestones",
        projectId: id,
        freelancerId: acceptedProposal.freelancerId,
        metadata: { installmentSequence: nextInstallment.sequence, phaseReleased: requiredPhase }
      }
    });
  }

  res.json({
    data: payment,
    message: "Escrow funds approved and released successfully."
  });
});

// --- Freelancer Reassignment Flow ---

export const pauseProject = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const { id } = req.params;
  if (!userId) throw new AppError("Authentication required", 401);
  await requirePmOrAdmin(userId, id);

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      proposals: {
        where: { status: "ACCEPTED" },
        select: { freelancerId: true },
      },
    },
  });

  const updated = await prisma.project.update({
    where: { id },
    data: { status: "PAUSED" }
  });

  const pausedFreelancerId = project?.proposals?.[0]?.freelancerId;
  if (pausedFreelancerId) {
    await syncFreelancerOpenToWorkStatus(pausedFreelancerId).catch(() => null);
  }

  res.json({ data: updated, message: "Project has been paused." });
});

export const removeFreelancer = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const { id } = req.params;
  if (!userId) throw new AppError("Authentication required", 401);
  await requirePmOrAdmin(userId, id);

  // Find accepted proposal
  const project = await prisma.project.findUnique({
    where: { id },
    include: { proposals: { where: { status: "ACCEPTED" } } }
  });

  if (!project) throw new AppError("Project not found", 404);
  const acceptedProposal = project.proposals[0];
  if (!acceptedProposal) throw new AppError("No currently assigned freelancer found", 400);

  // Set proposal to REPLACED
  await prisma.proposal.update({
    where: { id: acceptedProposal.id },
    data: { status: "REPLACED" }
  });

  await syncFreelancerOpenToWorkStatus(acceptedProposal.freelancerId).catch(() => null);

  res.json({
    data: { projectId: id },
    message: "Freelancer removed. Project continuity preserved."
  });
});

export const reassignFreelancer = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const { id } = req.params;
  const newFreelancerId = String(req.body?.newFreelancerId || "").trim();
  const newFreelancerEmail = String(req.body?.newFreelancerEmail || "")
    .trim()
    .toLowerCase();
  if (!userId) throw new AppError("Authentication required", 401);
  await requirePmOrAdmin(userId, id);

  const actingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, fullName: true },
  });

  if (!newFreelancerId && !newFreelancerEmail) {
    throw new AppError(
      "Replacement freelancer selection is required.",
      400
    );
  }

  const freelancer = newFreelancerId
    ? await prisma.user.findUnique({
      where: { id: newFreelancerId },
      select: { id: true, fullName: true, email: true, role: true },
    })
    : await prisma.user.findUnique({
      where: { email: newFreelancerEmail },
      select: { id: true, fullName: true, email: true, role: true },
    });

  if (!freelancer || freelancer.role !== "FREELANCER") {
    throw new AppError("Valid replacement freelancer not found.", 404);
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: {
        select: { id: true, fullName: true },
      },
      proposals: {
        include: {
          freelancer: {
            select: { id: true, fullName: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  const currentAssignment = resolveLatestAssignmentProposal(project);
  if (currentAssignment?.freelancerId === freelancer.id) {
    throw new AppError(
      "This freelancer is already assigned to the project.",
      400
    );
  }

  const directReassignmentCount = countPmFreelancerReassignments(project);
  const pendingApprovalRequest = await findOpenPmReassignmentApprovalRequest(id);
  if (
    actingUser?.role === "PROJECT_MANAGER" &&
    directReassignmentCount >= MAX_PM_DIRECT_REASSIGNMENTS
  ) {
    if (pendingApprovalRequest) {
      const pendingMeta = safeJsonParse(pendingApprovalRequest.notes, {});

      res.status(202).json({
        data: {
          approvalRequired: true,
          pendingApprovalId: pendingApprovalRequest.id,
          reassignmentCount: directReassignmentCount,
          maxDirectReassignments: MAX_PM_DIRECT_REASSIGNMENTS,
          requestedFreelancerId: pendingMeta.requestedFreelancerId || freelancer.id,
          requestedFreelancerName: pendingMeta.requestedFreelancerName || freelancer.fullName,
        },
        message: "Admin approval is already pending for an additional freelancer reassignment.",
      });
      return;
    }

    const approvalRequest = await prisma.adminEscalation.create({
      data: {
        projectId: id,
        raisedById: userId,
        reason: "Freelancer reassignment approval required",
        description: `Direct PM reassignment limit reached for "${project.title}". Approval requested to assign ${freelancer.fullName}.`,
        status: "OPEN",
        notes: JSON.stringify({
          source: PM_REASSIGNMENT_APPROVAL_SOURCE,
          requestedFreelancerId: freelancer.id,
          requestedFreelancerName: freelancer.fullName,
          previousFreelancerId: currentAssignment?.freelancerId || null,
          previousFreelancerName: currentAssignment?.freelancer?.fullName || null,
          directReassignmentCount,
          maxDirectReassignments: MAX_PM_DIRECT_REASSIGNMENTS,
          requestedAt: new Date().toISOString(),
        }),
      },
    });

    await notifyAdminsAboutPmReassignmentApproval({
      projectId: id,
      projectTitle: project.title,
      requestedByName: actingUser?.fullName || "Project Manager",
      freelancerName: freelancer.fullName,
    }).catch(() => null);

    res.status(202).json({
      data: {
        approvalRequired: true,
        pendingApprovalId: approvalRequest.id,
        reassignmentCount: directReassignmentCount,
        maxDirectReassignments: MAX_PM_DIRECT_REASSIGNMENTS,
        requestedFreelancerId: freelancer.id,
        requestedFreelancerName: freelancer.fullName,
      },
      message: "Direct reassignment limit reached. Approval request sent to Admin.",
    });
    return;
  }

  const pendingApprovalMeta = safeJsonParse(pendingApprovalRequest?.notes, {});
  const resolvesPendingAdminApproval = Boolean(
    actingUser?.role === "ADMIN" &&
      pendingApprovalRequest &&
      (!pendingApprovalMeta.requestedFreelancerId ||
        String(pendingApprovalMeta.requestedFreelancerId) === String(freelancer.id))
  );

  const currentRequests = getFreelancerChangeRequests(project);
  const hasPendingRequest = Boolean(
    getLatestPendingFreelancerChangeRequest(project)
  );
  const replacementAmount = normalizeAmount(
    currentAssignment?.amount ?? project.budget ?? 0
  );
  const nextProjectStatus =
    project.status === "PAUSED"
      ? Number(project.spent || 0) > 0
        ? "IN_PROGRESS"
        : "OPEN"
      : project.status;

  await prisma.$transaction(async (tx) => {
    await tx.proposal.updateMany({
      where: {
        projectId: id,
        status: "ACCEPTED",
      },
      data: {
        status: "REPLACED",
        rejectionReason:
          "Reassigned by Project Manager to another freelancer.",
        rejectionReasonKey: resolvesPendingAdminApproval
          ? "project_manager_reassignment_admin_approved"
          : "project_manager_reassignment",
      },
    });

    await tx.proposal.create({
      data: {
        projectId: id,
        freelancerId: freelancer.id,
        amount: replacementAmount,
        coverLetter: hasPendingRequest
          ? "Reassigned by Project Manager after a client freelancer change request."
          : "Reassigned by Project Manager.",
        status: "ACCEPTED",
      },
    });

    await tx.project.update({
      where: { id },
      data: {
        status: nextProjectStatus,
        freelancerChangeRequests: resolveFreelancerChangeRequestsAfterAssignment({
          requests: currentRequests,
          resolverId: userId,
          replacementFreelancer: freelancer,
        }),
      },
    });
  });

  await Promise.allSettled([
    currentAssignment?.freelancerId
      ? syncFreelancerOpenToWorkStatus(currentAssignment.freelancerId)
      : Promise.resolve(null),
    syncFreelancerOpenToWorkStatus(freelancer.id),
  ]);

  try {
    await sendNotificationToUser(project.ownerId, {
      audience: "client",
      type: "freelancer_change_resolved",
      title: "Freelancer updated",
      message: `${freelancer.fullName} has been assigned to "${project.title}".`,
      data: {
        projectId: id,
        freelancerId: freelancer.id,
      },
    });
  } catch (notificationError) {
    console.error("Failed to notify client after reassignment:", notificationError);
  }

  try {
    await sendNotificationToUser(freelancer.id, {
      audience: "freelancer",
      type: "proposal",
      title: "You were assigned to a project",
      message: `You have been assigned to "${project.title}".`,
      data: {
        projectId: id,
        status: "ACCEPTED",
      },
    });
  } catch (notificationError) {
    console.error(
      "Failed to notify replacement freelancer after reassignment:",
      notificationError
    );
  }

  if (
    currentAssignment?.freelancerId &&
    currentAssignment.freelancerId !== freelancer.id
  ) {
    try {
      await sendNotificationToUser(currentAssignment.freelancerId, {
        audience: "freelancer",
        type: "proposal",
        title: "Project assignment updated",
        message: `You have been removed from "${project.title}".`,
        data: {
          projectId: id,
          status: "REPLACED",
        },
      });
    } catch (notificationError) {
      console.error(
        "Failed to notify previous freelancer after reassignment:",
        notificationError
      );
    }
  }

  if (resolvesPendingAdminApproval) {
    await prisma.adminEscalation.update({
      where: { id: pendingApprovalRequest.id },
      data: {
        status: "RESOLVED",
        notes: JSON.stringify({
          ...pendingApprovalMeta,
          approvedAt: new Date().toISOString(),
          approvedById: userId,
          approvedFreelancerId: freelancer.id,
          approvedFreelancerName: freelancer.fullName,
        }),
      },
    });

    await sendNotificationToUser(pendingApprovalRequest.raisedById, {
      audience: "client",
      type: "freelancer_change_resolved",
      title: "Admin approved reassignment",
      message: `${freelancer.fullName} has been approved and assigned to "${project.title}".`,
      data: {
        projectId: id,
        freelancerId: freelancer.id,
      },
    }).catch(() => null);
  }

  const updatedProject = await getProjectForResponse(id);

  res.json({
    data: hydrateProjectForResponse(updatedProject),
    message: `${freelancer.fullName} has been assigned to this project.`,
  });
});





