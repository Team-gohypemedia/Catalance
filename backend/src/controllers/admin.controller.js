import { asyncHandler } from "../utils/async-handler.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";
import { sendNotificationToUser } from "../lib/notification-util.js";
import { sendEmail } from "../lib/email-service.js";
import { buildFreelancerProfileDetailsObject } from "../modules/users/freelancer-profile-details.mapper.js";
import { hashPassword } from "../modules/users/password.utils.js";
import { reassignProjectsFromProjectManager } from "../services/project-manager-assignment.service.js";

// Helper to get or initialize catalog - DEPRECATED
// We now use relational tables Service and ServiceQuestion

const PM_ROLE = "PROJECT_MANAGER";
const ADMIN_ROLE = "ADMIN";

const normalizeText = (value) => String(value || "").trim();

const toIsoOrNull = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const toTaskKeySet = (value) => {
  if (Array.isArray(value)) {
    return new Set(value.map((item) => String(item || "").trim()).filter(Boolean));
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return new Set(parsed.map((item) => String(item || "").trim()).filter(Boolean));
      }
    } catch {
      return new Set();
    }
  }

  return new Set();
};

const hasFirstTaskCompletion = (project) => {
  const completedTasks = toTaskKeySet(project?.completedTasks);
  return Array.from(completedTasks).some((taskKey) => String(taskKey).startsWith("1-"));
};

const getApprovedPhaseSet = (project = {}) =>
  new Set(
    (Array.isArray(project?.milestoneApprovals) ? project.milestoneApprovals : [])
      .map((item) => Number(item?.phase))
      .filter(Number.isFinite)
  );

const countCompletedLifecyclePhases = (project = {}) => {
  const approved = getApprovedPhaseSet(project);
  const phase1Done =
    hasFirstTaskCompletion(project) ||
    approved.has(2) ||
    approved.has(3) ||
    approved.has(4);

  return [phase1Done, approved.has(2), approved.has(3), approved.has(4)].filter(Boolean).length;
};

const mapAssignedProjectStatus = (project = {}) => {
  const hasIssue = Array.isArray(project?.disputes)
    ? project.disputes.some((item) => String(item?.status || "").toUpperCase() !== "RESOLVED")
    : false;

  if (hasIssue) return "Issue Raised";

  const rawStatus = String(project?.status || "").toUpperCase();
  if (rawStatus === "DRAFT") return "Proposal";

  const completedPhases = countCompletedLifecyclePhases(project);
  if (completedPhases >= 4) return "Completed";
  if (rawStatus === "IN_PROGRESS" || completedPhases > 0) return "In Progress";

  return "Started";
};

const getAcceptedProposal = (project = {}) => {
  const proposals = Array.isArray(project?.proposals) ? project.proposals : [];
  return (
    proposals.find((item) => String(item?.status || "").toUpperCase() === "ACCEPTED") ||
    proposals.find((item) => String(item?.status || "").toUpperCase() === "REPLACED") ||
    null
  );
};

const getCanonicalProjectChatServiceKey = (project = {}) => {
  const activeProposal = getAcceptedProposal(project);
  const freelancerId = normalizeText(activeProposal?.freelancerId || activeProposal?.freelancer?.id || "unknown");
  return `CHAT:${project.id}:${normalizeText(project.ownerId)}:${freelancerId}`;
};

const resolveProjectChatConversations = async (project = {}) => {
  const canonicalServiceKey = getCanonicalProjectChatServiceKey(project);
  const conversations = await prisma.chatConversation.findMany({
    where: {
      OR: [
        { service: canonicalServiceKey },
        { service: { startsWith: `CHAT:${project.id}:` } },
        { service: { contains: project.id } },
        { projectTitle: project.title || undefined },
      ],
    },
    orderBy: { updatedAt: "desc" },
  });

  const seen = new Set();
  return conversations.filter((conversation) => {
    if (!conversation?.id || seen.has(conversation.id)) return false;
    seen.add(conversation.id);
    return true;
  });
};

const buildMilestonesForAdminProject = (project = {}) => {
  const approved = new Set(
    (Array.isArray(project?.milestoneApprovals) ? project.milestoneApprovals : [])
      .map((item) => Number(item?.phase))
      .filter(Number.isFinite)
  );
  const firstTaskCompleted = hasFirstTaskCompletion(project);
  const phase1Done = firstTaskCompleted || approved.has(2) || approved.has(3) || approved.has(4);

  const phaseRows = [
    { phase: 1, title: "Kickoff & UI Design", percent: 0 },
    { phase: 2, title: "Core Development", percent: 25 },
    { phase: 3, title: "Integration & Testing", percent: 25 },
    { phase: 4, title: "Launch & Documentation", percent: 50 },
  ];

  return phaseRows.map((entry) => {
    const amount = Math.round((Number(project?.budget || 0) * entry.percent) / 100);
    const isApproved = entry.phase === 1 ? phase1Done : approved.has(entry.phase);

    let status = "Locked";
    let eligibleForApproval = false;

    if (entry.phase === 1) {
      status = phase1Done ? "Completed" : "Pending";
    } else if (isApproved) {
      status = "Approved";
    } else if (
      (entry.phase === 2 && phase1Done) ||
      (entry.phase === 3 && approved.has(2)) ||
      (entry.phase === 4 && approved.has(3))
    ) {
      status = "Pending Approval";
      eligibleForApproval = true;
    }

    return {
      phase: entry.phase,
      title: entry.title,
      percentage: entry.percent,
      amount,
      status,
      eligibleForApproval,
      validationNotes:
        entry.phase === 1
          ? firstTaskCompleted
            ? "First task completed by freelancer. Phase 2 can move to PM approval."
            : "Waiting for freelancer to complete first task."
          : eligibleForApproval
            ? "Ready for Project Manager approval."
            : "Waiting for previous phase completion.",
    };
  });
};

// Get dashboard stats
export const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    // Get basic counts - these should always work
    const totalUsers = await prisma.user.count({
      where: {
        role: { not: 'ADMIN' }
      }
    });
    const totalProjects = await prisma.project.count();
    const totalProposals = await prisma.proposal.count();

    // Get revenue - sum of actual 'spent' amounts from all projects (actual payments made)
    let totalRevenue = 0;
    try {
      const revenueResult = await prisma.project.aggregate({
        _sum: { spent: true }
      });
      totalRevenue = revenueResult._sum?.spent || 0;
    } catch (e) {
      console.error("Revenue query failed:", e);
    }

    // Get recent users - simple query without ordering
    let recentUsers = [];
    try {
      const allUsers = await prisma.user.findMany({
        take: 50,
        select: { id: true, fullName: true, email: true, role: true, createdAt: true }
      });
      recentUsers = allUsers
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
    } catch (e) {
      console.error("Recent users query failed:", e);
    }

    // Get recent projects
    let recentProjects = [];
    try {
      const allProjects = await prisma.project.findMany({
        take: 50,
        include: { owner: { select: { fullName: true } } }
      });
      recentProjects = allProjects
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
    } catch (e) {
      console.error("Recent projects query failed:", e);
    }

    res.json({
      data: {
        stats: {
          totalUsers,
          totalProjects,
          totalProposals,
          totalRevenue
        },
        recentUsers,
        recentProjects
      }
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ error: "Failed to fetch admin stats", details: error.message });
  }
});

// Get all users with pagination and filtering
export const getUsers = asyncHandler(async (req, res) => {
  try {
    // Check if prisma client is available
    if (!prisma) {
      console.error("Prisma client is not initialized");
      return res.status(500).json({ error: "Database connection not available" });
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search || "";
    const role = req.query.role || undefined;
    const status = req.query.status || undefined;
    const isVerified = req.query.isVerified === 'true' ? true : req.query.isVerified === 'false' ? false : undefined;
    const view = req.query.view || undefined;

    console.log("getUsers called with role:", role, "status:", status, "isVerified:", isVerified, "view:", view, "search:", search);

    // Build where clause for Prisma
    let where = {
      role: { not: 'ADMIN' }, // Always exclude admins from general user list
      ...(role && { role }),
      ...(status && { status }),
      ...(isVerified !== undefined && { isVerified }),
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    // Special view for approvals page
    if (view === 'approvals') {
      where = {
        role: { not: 'ADMIN' },
        OR: [
          { status: 'PENDING_APPROVAL' },
          {
            AND: [
              { role: 'FREELANCER' },
              { isVerified: false } // Catch unverified freelancers
            ]
          }
        ],
        ...(search && {
          AND: [
            {
              OR: [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
              ]
            }
          ]
        })
      };
    }

    const total = await prisma.user.count({ where });
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        isVerified: true,
        createdAt: true,
        managerProfile: {
          select: {
            profileDetails: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    const paginatedUsers = users.map((user) => ({
      ...user,
      profileDetails:
        user.managerProfile?.profileDetails && typeof user.managerProfile.profileDetails === "object"
          ? user.managerProfile.profileDetails
          : undefined,
    })); // Already paginated via Prisma

    console.log("Returning", paginatedUsers.length, "users");

    res.json({
      data: {
        users: paginatedUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error("Admin getUsers error:", error.message);
    console.error("Stack:", error.stack);
    res.status(500).json({ error: "Failed to fetch users", details: error.message });
  }
});

export const createProjectManager = asyncHandler(async (req, res) => {
  const fullName = String(req.body?.fullName || "").trim();
  const email = String(req.body?.email || "")
    .trim()
    .toLowerCase();
  const password = String(req.body?.password || "");
  const phoneNumber = String(req.body?.phoneNumber || "").trim();

  if (!fullName) {
    throw new AppError("Full name is required.", 400);
  }

  if (!email) {
    throw new AppError("Email is required.", 400);
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    throw new AppError("Please provide a valid email address.", 400);
  }

  if (password.length < 8) {
    throw new AppError("Password must be at least 8 characters long.", 400);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError("A user with this email already exists.", 409);
  }

  const passwordHash = await hashPassword(password);

  const manager = await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash,
      role: "PROJECT_MANAGER",
      status: "ACTIVE",
      isVerified: true,
      onboardingComplete: true,
      ...(phoneNumber ? { phoneNumber, phone: phoneNumber } : {}),
      managerProfile: {
        create: {
          profileDetails: {},
        },
      },
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      status: true,
      isVerified: true,
      createdAt: true,
    },
  });

  res.status(201).json({ data: manager });
});

export const updateProjectManager = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const fullName = typeof req.body?.fullName === "string" ? req.body.fullName.trim() : undefined;
  const rawEmail = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : undefined;
  const phoneNumber = typeof req.body?.phoneNumber === "string" ? req.body.phoneNumber.trim() : undefined;
  const password = typeof req.body?.password === "string" ? req.body.password : undefined;
  const status = typeof req.body?.status === "string" ? req.body.status.trim().toUpperCase() : undefined;

  const existingManager = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, email: true },
  });

  if (!existingManager || existingManager.role !== "PROJECT_MANAGER") {
    throw new AppError("Project Manager not found.", 404);
  }

  const updateData = {};

  if (fullName !== undefined) {
    if (!fullName) {
      throw new AppError("Full name is required.", 400);
    }
    updateData.fullName = fullName;
  }

  if (rawEmail !== undefined) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!rawEmail || !emailPattern.test(rawEmail)) {
      throw new AppError("Please provide a valid email address.", 400);
    }

    if (rawEmail !== existingManager.email) {
      const emailOwner = await prisma.user.findUnique({
        where: { email: rawEmail },
        select: { id: true },
      });
      if (emailOwner && emailOwner.id !== userId) {
        throw new AppError("A user with this email already exists.", 409);
      }
    }

    updateData.email = rawEmail;
  }

  if (phoneNumber !== undefined) {
    updateData.phone = phoneNumber || null;
    updateData.phoneNumber = phoneNumber || null;
  }

  if (status !== undefined) {
    if (!["ACTIVE", "SUSPENDED", "PENDING_APPROVAL"].includes(status)) {
      throw new AppError("Invalid status.", 400);
    }
    updateData.status = status;
    updateData.suspendedAt = status === "SUSPENDED" ? new Date() : null;
  }

  if (password !== undefined) {
    if (password && password.length < 8) {
      throw new AppError("Password must be at least 8 characters long.", 400);
    }
    if (password) {
      updateData.passwordHash = await hashPassword(password);
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new AppError("No updates provided.", 400);
  }

  const updatedManager = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      status: true,
      isVerified: true,
      phone: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  let reassignmentSummary = null;
  if (status === "SUSPENDED") {
    reassignmentSummary = await reassignProjectsFromProjectManager({ managerId: userId });
  }

  res.json({ data: { ...updatedManager, reassignmentSummary } });
});

const ensureProjectBelongsToManager = async (projectId, managerId) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      title: true,
      managerId: true,
      status: true,
      closureHandoverConfirmed: true,
      closureDeliverablesConfirmed: true,
      closureReceiptConfirmed: true,
      closureNoIssuesConfirmed: true,
      milestoneApprovals: { select: { phase: true } },
      completedTasks: true,
      disputes: { select: { status: true } },
    },
  });

  if (!project || String(project.managerId || "") !== String(managerId)) {
    throw new AppError("Project not found for this Project Manager.", 404);
  }

  return project;
};

export const updateProjectManagerProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const profileDetails = req.body?.profileDetails && typeof req.body.profileDetails === "object"
    ? req.body.profileDetails
    : {};

  const existingManager = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, managerProfile: { select: { userId: true } } },
  });

  if (!existingManager || existingManager.role !== "PROJECT_MANAGER") {
    throw new AppError("Project Manager not found.", 404);
  }

  if (existingManager.managerProfile?.userId) {
    await prisma.managerProfile.update({
      where: { userId },
      data: { profileDetails },
    });
  } else {
    await prisma.managerProfile.create({
      data: { userId, profileDetails },
    });
  }

  const refreshed = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      managerProfile: { select: { profileDetails: true } },
    },
  });

  res.json({ data: refreshed });
});

export const updateProjectManagerNotification = asyncHandler(async (req, res) => {
  const { userId, notificationId } = req.params;
  const read = typeof req.body?.read === "boolean" ? req.body.read : true;

  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { id: true, userId: true },
  });

  if (!notification || String(notification.userId || "") !== String(userId)) {
    throw new AppError("Notification not found for this Project Manager.", 404);
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { read },
  });

  res.json({ data: updated });
});

export const markAllProjectManagerNotificationsRead = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });

  res.json({ data: { success: true } });
});

export const updateProjectManagerReport = asyncHandler(async (req, res) => {
  const { userId, reportId } = req.params;
  const status = typeof req.body?.status === "string" ? req.body.status.trim().toUpperCase() : undefined;
  const notes = typeof req.body?.notes === "string" ? req.body.notes.trim() : undefined;

  const report = await prisma.adminEscalation.findUnique({
    where: { id: reportId },
    select: { id: true, raisedById: true, notes: true },
  });

  if (!report || String(report.raisedById || "") !== String(userId)) {
    throw new AppError("Report not found for this Project Manager.", 404);
  }

  const nextData = {};
  if (status) {
    if (!["OPEN", "IN_PROGRESS", "RESOLVED"].includes(status)) {
      throw new AppError("Invalid report status.", 400);
    }
    nextData.status = status;
  }

  if (notes !== undefined) {
    nextData.notes = notes
      ? JSON.stringify({
          source: "ADMIN_REVIEW",
          note: notes,
          previous: report.notes || null,
        })
      : null;
  }

  const updated = await prisma.adminEscalation.update({
    where: { id: reportId },
    data: nextData,
    include: { project: { select: { id: true, title: true } } },
  });

  res.json({ data: updated });
});

export const createProjectManagerMeeting = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const projectId = String(req.body?.projectId || "").trim();
  const title = String(req.body?.title || "Project Sync").trim();
  const startsAt = new Date(req.body?.startsAt);
  const endsAt = new Date(req.body?.endsAt);
  const participantScope = String(req.body?.participantScope || "BOTH").trim().toUpperCase();
  const platform = String(req.body?.platform || "INTERNAL").trim().toUpperCase();
  const notes = String(req.body?.notes || "").trim();

  if (!projectId) throw new AppError("projectId is required.", 400);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
    throw new AppError("Invalid meeting time.", 400);
  }

  await ensureProjectBelongsToManager(projectId, userId);

  const date = new Date(startsAt);
  date.setHours(0, 0, 0, 0);
  const startHour = startsAt.getHours();
  const endHour = Math.max(startHour + 1, endsAt.getHours() + (endsAt.getMinutes() > 0 ? 1 : 0));

  const meeting = await prisma.appointment.create({
    data: {
      title,
      description: JSON.stringify({ participantScope, platform, notes, meetingType: "ADMIN_PM_MEETING" }),
      date,
      startHour,
      endHour,
      status: "APPROVED",
      meetingLink:
        platform === "ZOOM"
          ? `https://zoom.us/j/${Date.now()}`
          : platform === "GOOGLE_MEET"
            ? "https://meet.google.com/new"
            : `internal://meeting/${Date.now()}`,
      bookedById: userId,
      managerId: userId,
      projectId,
    },
    include: {
      bookedBy: { select: { id: true, fullName: true, email: true } },
      project: { select: { id: true, title: true } },
    },
  });

  res.status(201).json({ data: meeting });
});

export const updateProjectManagerMeeting = asyncHandler(async (req, res) => {
  const { userId, meetingId } = req.params;
  const startsAt = req.body?.startsAt ? new Date(req.body.startsAt) : null;
  const endsAt = req.body?.endsAt ? new Date(req.body.endsAt) : null;
  const status = typeof req.body?.status === "string" ? req.body.status.trim().toUpperCase() : undefined;

  const meeting = await prisma.appointment.findUnique({
    where: { id: meetingId },
    select: { id: true, managerId: true },
  });

  if (!meeting || String(meeting.managerId || "") !== String(userId)) {
    throw new AppError("Meeting not found for this Project Manager.", 404);
  }

  const updateData = {};

  if (startsAt || endsAt) {
    if (!startsAt || !endsAt || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
      throw new AppError("Invalid meeting time.", 400);
    }

    const date = new Date(startsAt);
    date.setHours(0, 0, 0, 0);
    const startHour = startsAt.getHours();
    const endHour = Math.max(startHour + 1, endsAt.getHours() + (endsAt.getMinutes() > 0 ? 1 : 0));
    updateData.date = date;
    updateData.startHour = startHour;
    updateData.endHour = endHour;
  }

  if (status) {
    if (!["PENDING", "APPROVED", "REJECTED", "CANCELLED"].includes(status)) {
      throw new AppError("Invalid meeting status.", 400);
    }
    updateData.status = status;
  }

  const updated = await prisma.appointment.update({
    where: { id: meetingId },
    data: updateData,
    include: {
      bookedBy: { select: { id: true, fullName: true, email: true } },
      project: { select: { id: true, title: true } },
    },
  });

  res.json({ data: updated });
});

export const approveProjectManagerMilestone = asyncHandler(async (req, res) => {
  const { userId, projectId } = req.params;
  const phaseNumber = Number(req.body?.phase);
  const note = String(req.body?.pmNote || req.body?.notes || "").trim() || null;

  if (![2, 3, 4].includes(phaseNumber)) {
    throw new AppError("phase must be 2, 3 or 4.", 400);
  }

  const project = await ensureProjectBelongsToManager(projectId, userId);

  const approvedPhases = new Set(
    (Array.isArray(project.milestoneApprovals) ? project.milestoneApprovals : [])
      .map((item) => Number(item.phase))
  );

  if (phaseNumber === 2 && !hasFirstTaskCompletion(project)) {
    throw new AppError("Phase 2 approval unlocks only after freelancer completes the first task.", 400);
  }
  if (phaseNumber === 3 && !approvedPhases.has(2)) {
    throw new AppError("Phase 3 is locked until Phase 2 is approved.", 400);
  }
  if (phaseNumber === 4 && !approvedPhases.has(3)) {
    throw new AppError("Final Phase is locked until Phase 3 is approved.", 400);
  }

  const existing = await prisma.milestoneApproval.findUnique({
    where: { projectId_phase: { projectId, phase: phaseNumber } },
  });
  if (existing) {
    throw new AppError(`Phase ${phaseNumber} is already approved.`, 409);
  }

  const approval = await prisma.milestoneApproval.create({
    data: {
      projectId,
      managerId: userId,
      phase: phaseNumber,
      notes: note,
    },
  });

  res.json({ data: approval });
});

export const finalizeProjectManagerHandover = asyncHandler(async (req, res) => {
  const { userId, projectId } = req.params;
  const handoverConfirmed = Boolean(req.body?.handoverConfirmed);
  const deliverablesConfirmed = Boolean(req.body?.deliverablesConfirmed);
  const finalFilesDelivered = Boolean(req.body?.finalFilesDelivered);
  const receiptConfirmed = Boolean(req.body?.receiptConfirmed);
  const noIssuesConfirmed = Boolean(req.body?.noIssuesConfirmed);

  const project = await ensureProjectBelongsToManager(projectId, userId);

  if (handoverConfirmed && deliverablesConfirmed && finalFilesDelivered && receiptConfirmed && noIssuesConfirmed) {
    const unresolvedDisputes = (project.disputes || []).filter(
      (item) => String(item.status || "").toUpperCase() !== "RESOLVED"
    );
    if (unresolvedDisputes.length) {
      throw new AppError("Cannot complete project: There are unresolved disputes.", 400);
    }
  }

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: {
      closureHandoverConfirmed: handoverConfirmed,
      closureDeliverablesConfirmed: Boolean(deliverablesConfirmed && finalFilesDelivered),
      closureReceiptConfirmed: receiptConfirmed,
      closureNoIssuesConfirmed: noIssuesConfirmed,
      closureVerifiedById: userId,
      closureVerifiedAt: new Date(),
      ...(handoverConfirmed && deliverablesConfirmed && finalFilesDelivered && receiptConfirmed && noIssuesConfirmed
        ? { status: "COMPLETED" }
        : {}),
    },
    select: {
      id: true,
      status: true,
      closureHandoverConfirmed: true,
      closureDeliverablesConfirmed: true,
      closureReceiptConfirmed: true,
      closureNoIssuesConfirmed: true,
      closureVerifiedAt: true,
    },
  });

  res.json({ data: updated });
});

export const getProjectManagerProjectDetails = asyncHandler(async (req, res) => {
  const { userId, projectId } = req.params;
  await ensureProjectBelongsToManager(projectId, userId);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      budget: true,
      spent: true,
      progress: true,
      createdAt: true,
      updatedAt: true,
      ownerId: true,
      managerId: true,
      completedTasks: true,
      closureHandoverConfirmed: true,
      closureDeliverablesConfirmed: true,
      closureReceiptConfirmed: true,
      closureNoIssuesConfirmed: true,
      owner: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
      proposals: {
        where: { status: { in: ["ACCEPTED", "REPLACED"] } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          status: true,
          freelancerId: true,
          createdAt: true,
          freelancer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              status: true,
              freelancerProfile: {
                select: {
                  profileRole: true,
                  professionalBio: true,
                  services: true,
                  serviceDetails: true,
                  profilePhoto: true,
                },
              },
            },
          },
        },
      },
      disputes: {
        select: {
          id: true,
          status: true,
          description: true,
          createdAt: true,
          raisedBy: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      milestoneApprovals: {
        select: {
          phase: true,
          notes: true,
          createdAt: true,
        },
        orderBy: { phase: "asc" },
      },
    },
  });

  if (!project) {
    throw new AppError("Project not found.", 404);
  }

  const appointments = await prisma.appointment.findMany({
    where: { projectId, managerId: userId },
    select: {
      id: true,
      title: true,
      description: true,
      date: true,
      startHour: true,
      endHour: true,
      status: true,
      meetingLink: true,
      createdAt: true,
      bookedBy: { select: { id: true, fullName: true, email: true } },
    },
    orderBy: [{ date: "asc" }, { startHour: "asc" }],
  });

  const notifications = await prisma.notification.findMany({
    where: { userId },
    select: {
      id: true,
      type: true,
      title: true,
      message: true,
      read: true,
      data: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const projectNotifications = notifications.filter((notification) => {
    const data = notification?.data && typeof notification.data === "object" ? notification.data : {};
    return String(data.projectId || "") === String(projectId);
  });

  const activeProposal = getAcceptedProposal(project);
  const freelancer = activeProposal?.freelancer || null;
  const milestones = buildMilestonesForAdminProject(project);

  res.json({
    data: {
      project: {
        id: project.id,
        title: project.title,
        description: project.description,
        status: project.status,
        displayStatus: mapAssignedProjectStatus(project),
        budget: project.budget,
        spent: project.spent,
        progress: project.progress,
        createdAt: toIsoOrNull(project.createdAt),
        updatedAt: toIsoOrNull(project.updatedAt),
      },
      clientProfile: project.owner
        ? {
            id: project.owner.id,
            clientName: project.owner.fullName,
            email: project.owner.email,
            phone: project.owner.phone || null,
          }
        : null,
      freelancerProfile: freelancer
        ? {
            id: freelancer.id,
            freelancerName: freelancer.fullName,
            email: freelancer.email,
            phone: freelancer.phone || null,
            status: freelancer.status,
            avatar: freelancer.freelancerProfile?.profilePhoto || null,
            professionalBio: freelancer.freelancerProfile?.professionalBio || "",
            services: Array.isArray(freelancer.freelancerProfile?.services)
              ? freelancer.freelancerProfile.services
              : [],
            serviceDetails: freelancer.freelancerProfile?.serviceDetails || {},
          }
        : null,
      disputes: project.disputes.map((item) => ({
        ...item,
        createdAt: toIsoOrNull(item.createdAt),
      })),
      milestones,
      milestoneApprovals: project.milestoneApprovals.map((item) => ({
        ...item,
        createdAt: toIsoOrNull(item.createdAt),
      })),
      handoverChecklist: {
        handoverConfirmed: Boolean(project.closureHandoverConfirmed),
        deliverablesConfirmed: Boolean(project.closureDeliverablesConfirmed),
        finalFilesDelivered: Boolean(project.closureDeliverablesConfirmed),
        receiptConfirmed: Boolean(project.closureReceiptConfirmed),
        noIssuesConfirmed: Boolean(project.closureNoIssuesConfirmed),
      },
      appointments: appointments.map((item) => ({
        ...item,
        createdAt: toIsoOrNull(item.createdAt),
        date: toIsoOrNull(item.date),
      })),
      notifications: projectNotifications.map((item) => ({
        ...item,
        createdAt: toIsoOrNull(item.createdAt),
      })),
    },
  });
});

export const getProjectManagerProjectMessages = asyncHandler(async (req, res) => {
  const { userId, projectId } = req.params;
  await ensureProjectBelongsToManager(projectId, userId);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      title: true,
      ownerId: true,
      proposals: {
        where: { status: { in: ["ACCEPTED", "REPLACED"] } },
        select: { freelancerId: true, status: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!project) {
    throw new AppError("Project not found.", 404);
  }

  const conversations = await resolveProjectChatConversations(project);
  const conversationIds = conversations.map((conversation) => conversation.id);

  if (!conversationIds.length) {
    res.json({ data: { conversation: null, conversations: [], messages: [] } });
    return;
  }

  const latestConversation = conversations[0] || null;
  const messages = await prisma.chatMessage.findMany({
    where: { conversationId: { in: conversationIds } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: 1000,
  });

  res.json({
    data: {
      conversation: latestConversation
        ? {
            id: latestConversation.id,
            service: latestConversation.service,
            projectTitle: latestConversation.projectTitle,
          }
        : null,
      conversations: conversations.map((conversation) => ({
        id: conversation.id,
        service: conversation.service,
        projectTitle: conversation.projectTitle,
      })),
      messages: messages.map((message) => ({
        id: message.id,
        conversationId: message.conversationId,
        content: message.content,
        senderRole: message.senderRole,
        senderLabel:
          String(message.senderRole || "").toUpperCase() === PM_ROLE
            ? "Project Manager"
            : String(message.senderRole || "").toUpperCase() === ADMIN_ROLE
              ? message.senderName || "Admin"
              : message.senderName || message.senderRole || "User",
        createdAt: toIsoOrNull(message.createdAt),
      })),
    },
  });
});

export const sendProjectManagerProjectMessage = asyncHandler(async (req, res) => {
  const { userId, projectId } = req.params;
  const content = normalizeText(req.body?.content || req.body?.message);
  if (!content) throw new AppError("Message content is required.", 400);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      owner: { select: { id: true } },
      proposals: {
        where: { status: { in: ["ACCEPTED", "REPLACED"] } },
        select: { freelancerId: true, status: true, freelancer: { select: { id: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!project || String(project.managerId || "") !== String(userId)) {
    throw new AppError("Project not found for this Project Manager.", 404);
  }

  const serviceKey = getCanonicalProjectChatServiceKey(project);
  let conversation = await prisma.chatConversation.findFirst({
    where: { service: serviceKey },
    orderBy: { updatedAt: "desc" },
  });

  if (!conversation) {
    conversation = await prisma.chatConversation.create({
      data: {
        service: serviceKey,
        projectTitle: project.title,
        createdById: req.user?.id || userId,
      },
    });
  }

  const senderId = req.user?.id || userId;
  const senderName = normalizeText(req.user?.fullName || "Admin");
  const message = await prisma.chatMessage.create({
    data: {
      conversationId: conversation.id,
      senderId,
      senderRole: ADMIN_ROLE,
      senderName,
      role: "user",
      content,
    },
  });

  await prisma.chatConversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  const activeProposal = getAcceptedProposal(project);
  const recipients = [project.ownerId, project.managerId, activeProposal?.freelancerId]
    .filter(Boolean)
    .filter((recipientId) => String(recipientId) !== String(senderId));

  await Promise.all(
    recipients.map((recipientId) =>
      sendNotificationToUser(recipientId, {
        type: "chat",
        title: "Admin project message",
        message: `${senderName}: ${content.slice(0, 120)}`,
        data: { projectId, conversationId: conversation.id, source: "ADMIN_PM_CONTROL" },
      }).catch(() => null)
    )
  );

  res.status(201).json({
    data: {
      id: message.id,
      content: message.content,
      senderRole: message.senderRole,
      senderLabel: senderName,
      createdAt: toIsoOrNull(message.createdAt),
      conversationId: conversation.id,
    },
  });
});

// Update user role
export const updateUserRole = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (!["CLIENT", "FREELANCER", "ADMIN", "PROJECT_MANAGER"].includes(role)) {
    throw new Error("Invalid role");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, role: true }
  });

  res.json({ data: updatedUser });
});



// Update user status (suspend/activate)
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;

  if (!["ACTIVE", "SUSPENDED", "PENDING_APPROVAL"].includes(status)) {
    throw new Error("Invalid status");
  }

  // Build update data
  const updateData = { status };

  // Set or clear suspendedAt based on status
  if (status === "SUSPENDED") {
    updateData.suspendedAt = new Date();
  } else if (status === "ACTIVE") {
    updateData.suspendedAt = null; // Clear suspension date on reactivation
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, role: true, status: true, fullName: true, email: true, suspendedAt: true }
  });

  let reassignmentSummary = null;
  if (status === "SUSPENDED" && updatedUser.role === PM_ROLE) {
    reassignmentSummary = await reassignProjectsFromProjectManager({ managerId: userId });
  }

  // Notify user about status change
  try {
    let title = "Account Status Updated";
    let message = `Your account status has been updated to ${status}.`;

    if (status === "ACTIVE") {
      title = "Account Activated! 🎉";
      message = "Congratulations! Your account has been approved and is now active. You can now access all features.";
    } else if (status === "SUSPENDED") {
      title = "Account Suspended";
      message = "Your account has been suspended. You have 90 days to verify your account, otherwise it will be permanently deleted. Please contact support for more information.";

      // Send suspension email
      try {
        await sendEmail({
          to: updatedUser.email,
          subject: "Account Suspended - Action Required",
          title: "Your Account Has Been Suspended",
          html: `
                <p>Dear ${updatedUser.fullName},</p>
                <p>Your Catalance account has been suspended.</p>
                <p><strong>Important:</strong> You have <strong>90 days</strong> to verify your account. If you do not take action within this period, your account and all associated data will be permanently deleted.</p>
                <p>If you believe this was a mistake or would like to appeal this decision, please contact our support team immediately.</p>
                <p>Thank you,<br>The Catalance Team</p>
              `
        });
        console.log(`[Admin] Suspension email sent to ${updatedUser.email}`);
      } catch (emailErr) {
        console.error("[Admin] Failed to send suspension email:", emailErr);
      }
    }

    await sendNotificationToUser(userId, {
      type: "system",
      title,
      message,
      data: { status }
    });
  } catch (e) {
    console.error("Failed to notify user about status change:", e);
  }

  res.json({ data: { ...updatedUser, reassignmentSummary } });
});

// Update user verification (KYC) status
export const updateUserVerification = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { isVerified } = req.body;

  if (typeof isVerified !== "boolean") {
    throw new Error("isVerified must be a boolean");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { isVerified },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      status: true,
      isVerified: true,
    },
  });

  try {
    await sendNotificationToUser(userId, {
      type: "system",
      title: isVerified ? "Identity Verified" : "Identity Verification Rejected",
      message: isVerified
        ? "Your KYC documents were approved. You can now use payout features."
        : "Your KYC submission was rejected. Please re-upload valid documents.",
      data: { isVerified },
    });
  } catch (e) {
    console.error("Failed to notify user about verification change:", e);
  }

  res.json({ data: updatedUser });
});

// Get all projects for admin
export const getProjects = asyncHandler(async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        budget: true,
        spent: true,
        status: true,
        progress: true,
        managerId: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        manager: {
          select: {
            id: true,
            fullName: true,
            email: true,
            status: true,
          }
        },
        proposals: {
          where: { status: "ACCEPTED" },
          take: 1,
          select: {
            id: true,
            freelancer: {
              select: {
                id: true,
                fullName: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: { proposals: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform to include freelancer at top level for easier frontend access
    const transformedProjects = projects.map(project => ({
      ...project,
      freelancer: project.proposals?.[0]?.freelancer || null,
      proposals: undefined // Remove proposals from response
    }));

    res.json({ data: { projects: transformedProjects } });
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// Get detailed user information
export const getUserDetails = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;

    if (!prisma) {
      return res.status(500).json({ error: "Database connection not available" });
    }

    // Get user with their projects and proposals
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        isVerified: true,
        phone: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true,
        managerProfile: {
          select: {
            profileDetails: true,
          }
        },
        freelancerProfile: {
          select: {
            profileRole: true,
            professionalBio: true,
            services: true,
            serviceDetails: true,
            profilePhoto: true,
            isVerified: true,
            username: true
          }
        },
        // For clients: get their owned projects
        ownedProjects: {
          select: {
            id: true,
            title: true,
            status: true,
            budget: true,
            spent: true,
            createdAt: true,
            proposals: {
              select: {
                id: true,
                amount: true,
                status: true,
                freelancer: {
                  select: { fullName: true, email: true }
                }
              }
            }
          }
        },
        // For freelancers: get their proposals
        proposals: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
            project: {
              select: {
                id: true,
                title: true,
                status: true,
                budget: true,
                spent: true,
                owner: {
                  select: { fullName: true, email: true }
                }
              }
            }
          }
        },
        managedProjects: {
          select: {
            id: true,
            title: true,
            status: true,
            serviceKey: true,
            serviceType: true,
            budget: true,
            spent: true,
            progress: true,
            updatedAt: true,
            completedTasks: true,
            createdAt: true,
            owner: {
              select: {
                id: true,
                fullName: true,
                email: true,
              }
            },
            disputes: {
              select: {
                id: true,
                status: true,
              }
            },
            milestoneApprovals: {
              select: {
                phase: true,
              }
            },
            proposals: {
              where: { status: { in: ["ACCEPTED", "REPLACED"] } },
              select: {
                id: true,
                status: true,
                freelancer: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                  }
                }
              },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
          orderBy: { createdAt: "desc" }
        },
        managedDisputes: {
          select: {
            id: true,
            status: true,
            description: true,
            createdAt: true,
            project: {
              select: {
                id: true,
                title: true,
              }
            }
          },
          orderBy: { createdAt: "desc" }
        },
        managedAppointments: {
          select: {
            id: true,
            title: true,
            date: true,
            startHour: true,
            endHour: true,
            status: true,
            meetingLink: true,
            bookedBy: {
              select: {
                id: true,
                fullName: true,
                email: true,
              }
            },
            project: {
              select: {
                id: true,
                title: true,
              }
            },
          },
          orderBy: { date: "asc" }
        },
        raisedEscalations: {
          select: {
            id: true,
            reason: true,
            status: true,
            createdAt: true,
            project: {
              select: {
                id: true,
                title: true,
              }
            }
          },
          orderBy: { createdAt: "desc" }
        },
        profileUpdateRequests: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" }
        },
        notifications: {
          select: {
            id: true,
            type: true,
            title: true,
            message: true,
            read: true,
            data: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 12,
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const freelancerProfile =
      user.freelancerProfile && typeof user.freelancerProfile === "object"
        ? user.freelancerProfile
        : {};
    const freelancerProfileDetails = buildFreelancerProfileDetailsObject(freelancerProfile);
    const freelancerIdentity =
      freelancerProfileDetails.identity && typeof freelancerProfileDetails.identity === "object"
        ? freelancerProfileDetails.identity
        : {};

    // Calculate statistics based on role
    let stats = {};

    if (user.role === "CLIENT") {
      const totalProjects = user.ownedProjects.length;
      const activeProjects = user.ownedProjects.filter(p => p.status === "IN_PROGRESS").length;
      const completedProjects = user.ownedProjects.filter(p => p.status === "COMPLETED").length;

      // Calculate total spent from actual 'spent' field on each project
      const totalSpent = user.ownedProjects.reduce((sum, project) => sum + (project.spent || 0), 0);

      stats = {
        totalProjects,
        activeProjects,
        completedProjects,
        openProjects: user.ownedProjects.filter(p => p.status === "OPEN").length,
        totalSpent,
        moneyRemaining: user.ownedProjects.reduce((sum, p) => sum + (p.budget || 0), 0) - totalSpent
      };
    } else if (user.role === "FREELANCER") {
      const totalProposals = user.proposals.length;
      const acceptedProposals = user.proposals.filter(p => p.status === "ACCEPTED");
      const pendingProposals = user.proposals.filter(p => p.status === "PENDING");
      const rejectedProposals = user.proposals.filter(p => p.status === "REJECTED");

      // Platform fee - freelancer receives 70%
      const PLATFORM_FEE_PERCENTAGE = 0.30;
      const FREELANCER_SHARE = 1 - PLATFORM_FEE_PERCENTAGE;

      // Calculate actual earnings from paid amounts (project.spent field)
      // This is the actual money paid to the freelancer
      let grossPaidAmount = 0;
      acceptedProposals.forEach(proposal => {
        const projectSpent = proposal.project?.spent || 0;
        grossPaidAmount += projectSpent;
      });
      const totalEarnings = Math.round(grossPaidAmount * FREELANCER_SHARE);

      // Calculate pending amount = (accepted proposal amounts - already paid amounts) * 70%
      // This is money from accepted proposals that hasn't been paid yet
      let grossAcceptedAmount = 0;
      acceptedProposals.forEach(proposal => {
        grossAcceptedAmount += proposal.amount;
      });
      const pendingAmount = Math.round((grossAcceptedAmount - grossPaidAmount) * FREELANCER_SHARE);

      stats = {
        totalProposals,
        acceptedProposals: acceptedProposals.length,
        pendingProposals: pendingProposals.length,
        rejectedProposals: rejectedProposals.length,
        totalEarnings,
        pendingAmount: pendingAmount > 0 ? pendingAmount : 0,
        activeProjects: acceptedProposals.length
      };
    } else if (user.role === "PROJECT_MANAGER") {
      const dashboardProjects = await Promise.all(
        user.managedProjects.map(async (project) => {
          const conversation = await prisma.chatConversation.findFirst({
            where: {
              OR: [
                { service: { startsWith: `CHAT:${project.id}:` } },
                { service: { contains: project.id } },
              ],
            },
            include: {
              messages: { orderBy: { createdAt: "desc" }, take: 1 },
              _count: { select: { messages: true } },
            },
            orderBy: { updatedAt: "desc" },
          });

          return {
            ...project,
            freelancer: project.proposals?.[0]?.freelancer || null,
            displayStatus: mapAssignedProjectStatus(project),
            chatMetrics: {
              totalMessages: conversation?._count?.messages || 0,
              lastMessagePreview: conversation?.messages?.[0]?.content || null,
              lastMessageSender:
                String(conversation?.messages?.[0]?.senderRole || "").toUpperCase() === PM_ROLE
                  ? "Project Manager"
                  : conversation?.messages?.[0]?.senderName || conversation?.messages?.[0]?.role || null,
              lastInteractionTime: conversation?.messages?.[0]?.createdAt || project.updatedAt,
            },
          };
        })
      );

      const activeProjectStatuses = ["OPEN", "IN_PROGRESS", "STARTED", "PENDING", "REVIEW"];
      const activeProjects = dashboardProjects.filter((project) =>
        activeProjectStatuses.includes(String(project.status || "").toUpperCase())
      );
      const completedProjects = dashboardProjects.filter(
        (project) => String(project.status || "").toUpperCase() === "COMPLETED"
      );
      const openDisputes = user.managedDisputes.filter(
        (dispute) => String(dispute.status || "").toUpperCase() === "OPEN"
      );
      const upcomingMeetings = user.managedAppointments.filter((appointment) => {
        if (!appointment?.date) return false;
        return new Date(appointment.date) >= new Date();
      });
      const profileDetails =
        user.managerProfile?.profileDetails && typeof user.managerProfile.profileDetails === "object"
          ? user.managerProfile.profileDetails
          : {};
      const latestProfileRequest = user.profileUpdateRequests[0] || null;
      const unreadNotifications = user.notifications.filter((notification) => !notification.read);

      stats = {
        totalProjects: dashboardProjects.length,
        activeProjects: activeProjects.length,
        completedProjects: completedProjects.length,
        openDisputes: openDisputes.length,
        totalDisputes: user.managedDisputes.length,
        upcomingMeetings: upcomingMeetings.length,
        totalMeetings: user.managedAppointments.length,
        reportsRaised: user.raisedEscalations.length,
        profileUpdateRequests: user.profileUpdateRequests.length,
        latestProfileRequestStatus: latestProfileRequest?.status || null,
        unreadNotifications: unreadNotifications.length,
      };

      const pmPayload = {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || null,
        role: user.role,
        status: user.status || "ACTIVE",
        isVerified: Boolean(user.isVerified),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        profileDetails,
      };

      return res.json({
        data: {
          user: pmPayload,
          stats,
          projects: dashboardProjects,
          disputes: user.managedDisputes,
          appointments: user.managedAppointments,
          reports: user.raisedEscalations,
          profileRequests: user.profileUpdateRequests,
          notifications: user.notifications,
          dashboard: {
            projects: dashboardProjects.slice(0, 10),
            stats: {
              activeCount: activeProjects.length,
              upcomingMeetingsCount: upcomingMeetings.length,
              escalationsCount: openDisputes.length,
              unreadNotificationsCount: unreadNotifications.length,
            },
          },
        }
      });
    }

    res.json({
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          bio:
            freelancerProfileDetails.professionalBio ||
            freelancerProfile.professionalBio ||
            null,
          phone: user.phone || user.phoneNumber || null,
          phoneNumber: user.phoneNumber || user.phone || null,
          isVerified: Boolean(user.isVerified),
          profileVerified: Boolean(freelancerProfile.isVerified),
          status: user.status || 'ACTIVE',
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          profileRole:
            freelancerProfileDetails.role ||
            freelancerProfileDetails.profileRole ||
            freelancerProfile.profileRole ||
            null,
          professionalTitle: freelancerIdentity.professionalTitle || null,
          location: [freelancerIdentity.city, freelancerIdentity.country].filter(Boolean).join(", "),
          languages: Array.isArray(freelancerIdentity.languages) ? freelancerIdentity.languages : [],
          portfolio: freelancerIdentity.portfolioUrl || null,
          linkedin: freelancerIdentity.linkedinUrl || null,
          github: freelancerIdentity.githubUrl || null,
          username: freelancerIdentity.username || freelancerProfile.username || null,
          services: Array.isArray(freelancerProfileDetails.services)
            ? freelancerProfileDetails.services
            : Array.isArray(freelancerProfile.services)
              ? freelancerProfile.services
              : [],
          skills: Array.isArray(freelancerProfileDetails.skills)
            ? freelancerProfileDetails.skills
            : [],
          serviceDetails: freelancerProfileDetails.serviceDetails ?? freelancerProfile.serviceDetails ?? {},
          portfolioProjects: Array.isArray(freelancerProfileDetails.portfolioProjects)
            ? freelancerProfileDetails.portfolioProjects
            : [],
          profileDetails: freelancerProfileDetails,
          profilePhoto: freelancerIdentity.profilePhoto || freelancerProfile.profilePhoto || null
        },
        stats,
        projects: user.role === "CLIENT" ? user.ownedProjects : [],
        proposals: user.role === "FREELANCER" ? user.proposals : []
      }
    });
  } catch (error) {
    console.error("getUserDetails error:", error.message);
    res.status(500).json({ error: "Failed to fetch user details", details: error.message });
  }
});

export const getProjectDetails = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      owner: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          status: true,
          createdAt: true
        }
      },
      proposals: {
        include: {
          freelancer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      disputes: {
        include: {
          raisedBy: {
            select: { fullName: true }
          },
          manager: {
            select: { fullName: true }
          }
        }
      }
    }
  });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  // Determine accepted freelancer if any
  const acceptedProposal = project.proposals.find(p => p.status === 'ACCEPTED');

  // Fetch conversation associated with the project
  const conversation = await prisma.chatConversation.findFirst({
    where: {
      projectTitle: project.title,
      createdById: project.owner.id
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          sender: {
            select: { fullName: true, role: true }
          }
        }
      }
    }
  });

  const projectWithDetails = {
    ...project,
    freelancer: acceptedProposal ? acceptedProposal.freelancer : null,
    conversation: conversation
  };

  res.json({ data: { project: projectWithDetails } });
});

// --- Service Management ---

export const getServices = asyncHandler(async (req, res) => {
  const services = await prisma.service.findMany({
    include: {
      _count: {
        select: { questions: true }
      }
    }
  });

  // Sort case-insensitively in JS to ensure "test" (lowercase) appears with "T" (uppercase)
  services.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

  // Return full list for the table/edit
  const formatted = services.map(s => ({
    id: s.slug,
    slug: s.slug,
    name: s.name,
    description: s.description,
    icon: s.icon,
    active: s.active,
    aiPrompt: s.aiPrompt,
    proposalStructure: s.proposalStructure,
    agencyProposalStructure: s.agencyProposalStructure,
    internalProposalStructure: s.internalProposalStructure,
    proposalPrompt: s.proposalPrompt,
    minBudget: s.minBudget,
    currency: s.currency,
    questionCount: s._count.questions
  }));

  res.json({ data: formatted });
});

export const upsertService = asyncHandler(async (req, res) => {
  const {
    id,
    name,
    description,
    icon,
    active,
    aiPrompt,
    proposalStructure,
    agencyProposalStructure,
    internalProposalStructure,
    proposalPrompt,
    minBudget,
    currency
  } = req.body; // id here is the SLUG
  if (!id || !name) {
    throw new AppError("Service ID (slug) and Name are required", 400);
  }

  await prisma.service.upsert({
    where: { slug: id },
    update: {
      name,
      description,
      icon,
      active: active === undefined ? true : active,
      aiPrompt,
      proposalStructure: proposalStructure || null,
      agencyProposalStructure: agencyProposalStructure || null,
      internalProposalStructure: internalProposalStructure || null,
      proposalPrompt: proposalPrompt || null,
      minBudget: minBudget ? Number(minBudget) : 0,
      currency: currency || "INR"
    },
    create: {
      slug: id,
      name,
      description,
      icon,
      active: active === undefined ? true : active,
      aiPrompt,
      proposalStructure: proposalStructure || null,
      agencyProposalStructure: agencyProposalStructure || null,
      internalProposalStructure: internalProposalStructure || null,
      proposalPrompt: proposalPrompt || null,
      minBudget: minBudget ? Number(minBudget) : 0,
      currency: currency || "INR"
    }
  });

  // Bust the cached catalog so /ai/services immediately reflects the change
  const { invalidateServicesCatalogCache } = await import(
    "../services/ai.service.js"
  );
  invalidateServicesCatalogCache();

  res.json({ data: { success: true } });
});

export const getServiceQuestions = asyncHandler(async (req, res) => {
  const { serviceId } = req.params; // This is the SLUG from the frontend URL

  const service = await prisma.service.findUnique({
    where: { slug: serviceId },
    include: {
      questions: {
        orderBy: { order: 'asc' }
      }
    }
  });

  if (!service) {
    throw new AppError("Service not found", 404);
  }

  // Transform to match frontend expectations + new fields
  const questions = service.questions.map(q => ({
    id: q.slug,
    question: q.text,
    type: q.type,
    required: q.required,
    options: q.options || [],
    logic: q.logic || [],
    subtitle: q.subtitle || "",
    saveResponse: q.saveResponse || false,
    showRecommendationPopup: q.showRecommendationPopup || false,
    disableAutoRecommendationPopup: q.disableAutoRecommendationPopup || false,
    nextQuestionSlug: q.nextQuestionSlug || ""
  }));

  res.json({ data: questions });
});

export const upsertQuestion = asyncHandler(async (req, res) => {
  const { serviceId } = req.params; // Service SLUG
  const {
    id,
    type,
    question,
    options,
    logic,
    existingId,
    required,
    subtitle,
    saveResponse,
    showRecommendationPopup,
    disableAutoRecommendationPopup,
    nextQuestionSlug
  } = req.body; // id is question SLUG

  if (!serviceId || !id || !type || !question) {
    throw new AppError("Missing required fields", 400);
  }

  const service = await prisma.service.findUnique({
    where: { slug: serviceId }
  });

  if (!service) {
    throw new AppError("Service not found", 404);
  }

  const isRequired = required === undefined ? true : required;
  const isSaveResponse = saveResponse === undefined ? false : saveResponse;
  const isShowRecommendationPopup =
    showRecommendationPopup === undefined ? false : showRecommendationPopup;
  const isDisableAutoRecommendationPopup =
    disableAutoRecommendationPopup === undefined ? false : disableAutoRecommendationPopup;

  // If existingId is provided, we might be renaming the slug.
  if (existingId && existingId !== id) {
    // Check if new id already exists
    const collision = await prisma.serviceQuestion.findUnique({
      where: { serviceId_slug: { serviceId: service.id, slug: id } }
    });
    if (collision) {
      throw new AppError("Question ID already exists", 400);
    }

    // Update with slug change
    await prisma.serviceQuestion.update({
      where: { serviceId_slug: { serviceId: service.id, slug: existingId } },
      data: {
        slug: id,
        text: question,
        type,
        options: options || [],
        logic: logic || [],
        required: isRequired,
        subtitle: subtitle || null,
        saveResponse: isSaveResponse,
        showRecommendationPopup: isShowRecommendationPopup,
        disableAutoRecommendationPopup: isDisableAutoRecommendationPopup,
        nextQuestionSlug: nextQuestionSlug || null
      }
    });
  } else {
    // Normal upsert
    const lastQ = await prisma.serviceQuestion.findFirst({
      where: { serviceId: service.id },
      orderBy: { order: 'desc' }
    });
    const nextOrder = (lastQ?.order ?? -1) + 1;

    await prisma.serviceQuestion.upsert({
      where: {
        serviceId_slug: { serviceId: service.id, slug: id }
      },
      update: {
        text: question,
        type,
        options: options || [],
        logic: logic || [],
        required: isRequired,
        subtitle: subtitle || null,
        saveResponse: isSaveResponse,
        showRecommendationPopup: isShowRecommendationPopup,
        disableAutoRecommendationPopup: isDisableAutoRecommendationPopup,
        nextQuestionSlug: nextQuestionSlug || null
      },
      create: {
        serviceId: service.id,
        slug: id,
        text: question,
        type,
        options: options || [],
        logic: logic || [],
        required: isRequired,
        order: nextOrder,
        subtitle: subtitle || null,
        saveResponse: isSaveResponse,
        showRecommendationPopup: isShowRecommendationPopup,
        disableAutoRecommendationPopup: isDisableAutoRecommendationPopup,
        nextQuestionSlug: nextQuestionSlug || null
      }
    });
  }

  res.json({ data: { success: true } });
});

export const reorderQuestions = asyncHandler(async (req, res) => {
  const { serviceId } = req.params;
  const { orderedIds } = req.body;

  if (!orderedIds || !Array.isArray(orderedIds)) {
    throw new AppError("Invalid data", 400);
  }

  const service = await prisma.service.findUnique({
    where: { slug: serviceId }
  });

  if (!service) {
    throw new AppError("Service not found", 404);
  }

  await prisma.$transaction(
    orderedIds.map((slug, index) =>
      prisma.serviceQuestion.update({
        where: {
          serviceId_slug: {
            serviceId: service.id,
            slug: slug
          }
        },
        data: { order: index }
      })
    )
  );

  res.json({ success: true });
});

export const deleteQuestion = asyncHandler(async (req, res) => {
  const { serviceId, id } = req.params; // id is the question slug

  const service = await prisma.service.findUnique({
    where: { slug: serviceId }
  });

  if (!service) {
    throw new AppError("Service not found", 404);
  }

  await prisma.serviceQuestion.delete({
    where: {
      serviceId_slug: {
        serviceId: service.id,
        slug: id
      }
    }
  });

  res.json({ success: true });
});

export const importServiceQuestions = asyncHandler(async (req, res) => {
  const { serviceId } = req.params;
  const { questions } = req.body;

  if (!questions || !Array.isArray(questions)) {
    throw new AppError("Invalid questions data", 400);
  }

  const service = await prisma.service.findUnique({
    where: { slug: serviceId }
  });

  if (!service) {
    throw new AppError("Service not found", 404);
  }

  await prisma.$transaction(async (tx) => {
    // Delete existing questions
    await tx.serviceQuestion.deleteMany({
      where: { serviceId: service.id }
    });

    // Validate and map data for createMany
    const questionsData = questions.map((q, index) => {
      const id = q.id || q.slug;
      const questionText = q.question || q.text;
      const type = q.type || "input";

      if (!id || !questionText) {
        throw new AppError(`Missing id or question text for item at index ${index}`, 400);
      }

      return {
        serviceId: service.id,
        slug: id,
        text: questionText,
        type,
        options: q.options || [],
        logic: q.logic || [],
        required: q.required === undefined ? true : q.required,
        order: index,
        subtitle: q.subtitle || null,
        saveResponse: q.saveResponse === undefined ? false : q.saveResponse,
        showRecommendationPopup:
          q.showRecommendationPopup === undefined ? false : q.showRecommendationPopup,
        disableAutoRecommendationPopup:
          q.disableAutoRecommendationPopup === undefined ? false : q.disableAutoRecommendationPopup,
        nextQuestionSlug: q.nextQuestionSlug || null
      };
    });

    // Bulk insert questions
    await tx.serviceQuestion.createMany({
      data: questionsData
    });
  });

  res.json({ success: true });
});
