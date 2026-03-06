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

const hydrateProjectForResponse = (project) => {
  if (!project || typeof project !== "object") return project;

  return attachProjectPaymentPlan({
    ...project,
    proposals: Array.isArray(project.proposals)
      ? project.proposals.map((proposal) => ({
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

const findLeastLoadedActiveProjectManager = async () =>
  prisma.user.findFirst({
    where: {
      role: "PROJECT_MANAGER",
      status: "ACTIVE",
    },
    orderBy: { managedProjects: { _count: "asc" } },
    select: PROJECT_MANAGER_SELECT,
  });

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

  let project = await prisma.project.findUnique({
    where: { id },
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
      manager: {
        select: PROJECT_MANAGER_SELECT,
      },
      disputes: {
        select: { id: true, status: true },
      },
      _count: {
        select: { proposals: true },
      },
    },
  });

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
  res.json({ data: hydratedProject });
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
    console.log("DEBUG: Attempting to update project", id, "with data:", JSON.stringify(updates));
    const project = await prisma.project.update({
      where: { id },
      data: updates
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

  const amountToRelease = acceptedProposal.amount;
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
        freelancerId: acceptedProposal.freelancerId
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
  const { newFreelancerEmail } = req.body;
  if (!userId) throw new AppError("Authentication required", 401);
  await requirePmOrAdmin(userId, id);

  if (!newFreelancerEmail) throw new AppError("Replacement freelancer email is required", 400);

  // Validate freelancer exists
  const freelancer = await prisma.user.findUnique({ where: { email: newFreelancerEmail } });
  if (!freelancer || (freelancer.role !== "FREELANCER" && freelancer.role !== "ADMIN")) {
    throw new AppError("Valid replacement freelancer not found with that email", 404);
  }

  // Stub invitation flow: just log and return success. A real system would send an email or push notification.
  console.log(`[Reassignment] PM ${userId} invited ${newFreelancerEmail} to replace freelancer on project ${id}.`);

  res.json({
    data: { invitedDoc: { email: newFreelancerEmail, status: "INVITED" } },
    message: `Invitation sent to ${newFreelancerEmail}.`
  });
});









