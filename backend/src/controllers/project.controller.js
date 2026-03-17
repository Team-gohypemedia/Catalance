import { asyncHandler } from "../utils/async-handler.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";
import { attachProjectPaymentPlan, resolveProjectPaymentPlan } from "../modules/projects/project-payment-plan.js";
import { sendNotificationToUser } from "../lib/notification-util.js";
import { env } from "../config/env.js";
import { getRazorpayClient, hasRazorpayCredentials } from "../lib/razorpay.js";
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

const normalizeBudget = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === "number") {
    const parsed = Math.round(value);
    if (parsed < 0) return 0;
    return parsed > MAX_INT ? MAX_INT : parsed;
  }

  if (typeof value === "string") {
    // Handle currency symbols, commas, and ranges like "â‚¹60,001â€“1,00,000"
    const sanitized = value
      .replace(/[â‚¹,\s]/g, "")
      .replace(/[â€“â€”]/g, "-"); // normalize dash variants

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

const flattenFreelancerProfile = (freelancer = null) => {
  if (!freelancer || typeof freelancer !== "object") return freelancer;
  const profile =
    freelancer.freelancerProfile && typeof freelancer.freelancerProfile === "object"
      ? freelancer.freelancerProfile
      : {};

  return {
    ...freelancer,
    jobTitle: profile.jobTitle || null,
    skills: Array.isArray(profile.skills) ? profile.skills : [],
    bio: profile.bio || null,
    portfolio: profile.portfolio || null,
    linkedin: profile.linkedin || null,
    github: profile.github || null,
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
              jobTitle: true,
              skills: true,
              bio: true,
              portfolio: true,
              linkedin: true,
              github: true,
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
        select: { id: true }
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

  console.log("Looking for an available Project Manager...");
  const projectManager = await findLeastLoadedActiveProjectManager();
  console.log(`Assigning Project Manager: ${projectManager ? projectManager.id : "None found"}`);

  const project = await prisma.project.create({
    data: {
      title,
      description,
      budget: normalizeBudget(budget),
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

  res.status(201).json({
    data: {
      project,
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
                    jobTitle: true,
                    skills: true,
                    bio: true,
                    portfolio: true,
                    linkedin: true,
                    github: true,
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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

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

  try {
    // Whitelist only fields that exist on the Prisma Project model
    const allowedFields = new Set([
      "title", "description", "budget", "status", "progress",
      "spent", "completedTasks", "verifiedTasks", "notes", "externalLink",
    ]);

    // Admins can manually set managerId
    if (isAdmin) {
      allowedFields.add("managerId");
    }

    const sanitizedUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.has(key)) {
        sanitizedUpdates[key] = key === "budget" ? normalizeBudget(value) : value;
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

    // Send notification based on notificationMeta
    if (notificationMeta?.type && notificationMeta?.taskName) {
      const taskName = notificationMeta.taskName;

      if (notificationMeta.type === "TASK_COMPLETED" && isAcceptedFreelancer) {
        // Freelancer completed a task -> notify client
        await sendNotificationToUser(existing.ownerId, {
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
    console.error("Update project error:", error);
    console.error("Error code:", error.code);
    console.error("Error meta:", error.meta);
    throw new AppError(`Failed to update project: ${error.message}`, 500);
  }
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
      type: "freelancer_review",
      title: "New Client Review",
      message: `Client reviewed your work for project \"${project.title}\".`,
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

  const updated = await prisma.project.update({
    where: { id },
    data: { status: "PAUSED" }
  });

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

  try {
    await sendNotificationToUser(project.ownerId, {
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





