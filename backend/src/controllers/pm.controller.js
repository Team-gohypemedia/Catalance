import { asyncHandler } from "../utils/async-handler.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";
import { getSopFromTitle } from "../../../src/shared/data/sopTemplates.js";
import { markFreelancerVerifiedAfterProjectCompletion } from "../lib/freelancer-verification.js";
import { syncFreelancerOpenToWorkStatus } from "../lib/freelancer-open-to-work.js";
import { archiveCompletedProject } from "../services/completed-projects.service.js";

const PM_ROLE = "PROJECT_MANAGER";
const getUserId = (req) => req.user?.id || req.user?.sub || null;

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
    const sop = getSopFromTitle(project?.title || "");
    const firstTask = Array.isArray(sop?.tasks) ? sop.tasks[0] : null;
    if (!firstTask) return false;

    const taskKey = `${firstTask.phase}-${firstTask.id}`;
    return toTaskKeySet(project?.completedTasks).has(taskKey);
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

export const getDashboard = asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
        throw new AppError("Authentication required", 401);
    }

    const projects = await prisma.project.findMany({
        where: { managerId: userId },
        include: {
            owner: { select: { id: true, fullName: true, avatar: true } },
            proposals: {
                where: { status: { in: ["ACCEPTED", "REPLACED"] } },
                include: { freelancer: { select: { id: true, fullName: true, avatar: true } } },
                orderBy: { createdAt: "desc" },
                take: 1
            },
            disputes: { select: { id: true, status: true } }
        },
        orderBy: { updatedAt: "desc" },
        take: 10
    });

    const enrichedProjects = await Promise.all(projects.map(async (p) => {
        const conversation = await prisma.chatConversation.findFirst({
            where: {
                OR: [
                    { service: { startsWith: `CHAT:${p.id}:` } },
                    { service: { contains: p.id } }
                ]
            },
            include: {
                messages: { orderBy: { createdAt: "desc" }, take: 1 },
                _count: { select: { messages: true } }
            },
            orderBy: { updatedAt: "desc" }
        });

        return {
            ...p,
            chatMetrics: {
                totalMessages: conversation?._count?.messages || 0,
                lastMessageSender:
                    String(conversation?.messages?.[0]?.senderRole || "").toUpperCase() === PM_ROLE
                        ? "Project Manager"
                        : conversation?.messages?.[0]?.senderName || conversation?.messages?.[0]?.role || null,
                lastInteractionTime: conversation?.messages?.[0]?.createdAt || p.updatedAt,
            }
        };
    }));

    const activeCount = await prisma.project.count({
        where: { managerId: userId, status: { notIn: ["COMPLETED", "PAUSED"] } }
    });

    const upcomingMeetingsCount = await prisma.appointment.count({
        where: { managerId: userId, date: { gte: new Date() }, status: "APPROVED" }
    });

    const escalations = await prisma.adminEscalation.findMany({
        where: { raisedById: userId, status: "OPEN" }
    });

    res.json({
        data: {
            projects: enrichedProjects,
            stats: {
                activeCount,
                upcomingMeetingsCount,
                escalationsCount: escalations.length
            }
        }
    });
});

export const getAssignedProjects = asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
        throw new AppError("Authentication required", 401);
    }
    const projects = await prisma.project.findMany({
        where: { managerId: userId },
        include: {
            owner: { select: { fullName: true } },
            proposals: {
                where: { status: { in: ["ACCEPTED", "REPLACED"] } },
                include: { freelancer: { select: { fullName: true } } },
                orderBy: { createdAt: "desc" },
                take: 1
            },
            disputes: { select: { id: true, status: true } },
            milestoneApprovals: { select: { phase: true } },
        },
        orderBy: { createdAt: "desc" }
    });
    res.json({
        data: projects.map((project) => ({
            ...project,
            displayStatus: mapAssignedProjectStatus(project),
        })),
    });
});

export const updateProfileRequest = asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
        throw new AppError("Authentication required", 401);
    }
    const data = req.body;
    const pending = await prisma.profileUpdateRequest.findFirst({
        where: { userId, userRole: PM_ROLE, status: "PENDING" },
        orderBy: { createdAt: "desc" }
    });

    const request = pending
        ? await prisma.profileUpdateRequest.update({
            where: { id: pending.id },
            data: {
                requestedData: data,
                userRole: PM_ROLE
            }
        })
        : await prisma.profileUpdateRequest.create({
            data: {
                userId,
                userRole: PM_ROLE,
                requestedData: data,
                status: "PENDING"
            }
        });

    res.json({
        data: request,
        message: "Profile update request sent to Admin for approval."
    });
});

export const getActiveProfileUpdateRequest = asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
        throw new AppError("Authentication required", 401);
    }

    const request = await prisma.profileUpdateRequest.findFirst({
        where: { userId, userRole: PM_ROLE, status: "PENDING" },
        orderBy: { createdAt: "desc" }
    });

    res.json({ data: request || null });
});

export const createMilestoneApproval = asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    const { id: projectId } = req.params;
    const { phase, notes, pmNote } = req.body;

    if (!userId) {
        throw new AppError("Authentication required", 401);
    }

    const phaseNumber = Number(phase);
    if (![2, 3, 4].includes(phaseNumber)) {
        throw new AppError("phase must be 2, 3 or 4.", 400);
    }

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            milestoneApprovals: {
                select: { phase: true }
            }
        }
    });

    if (!project || String(project.managerId) !== String(userId)) {
        throw new AppError("Access denied or project not found.", 403);
    }

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

    const exists = await prisma.milestoneApproval.findUnique({
        where: { projectId_phase: { projectId, phase: phaseNumber } }
    });
    if (exists) {
        throw new AppError(`Phase ${phaseNumber} is already approved.`, 409);
    }

    const approval = await prisma.milestoneApproval.create({
        data: {
            projectId,
            managerId: userId,
            phase: phaseNumber,
            notes: String(notes ?? pmNote ?? "").trim() || null
        }
    });

    res.json({ data: approval, message: `Phase ${phaseNumber} approved successfully.` });
});

export const getEscalations = asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
        throw new AppError("Authentication required", 401);
    }
    const escalations = await prisma.adminEscalation.findMany({
        where: { raisedById: userId },
        include: { project: { select: { title: true } } },
        orderBy: { createdAt: "desc" }
    });
    res.json({ data: escalations });
});

export const submitEscalation = asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    const projectId = req.params?.id || req.body?.projectId;
    const { reason, description } = req.body;

    if (!userId) {
        throw new AppError("Authentication required", 401);
    }

    if (!projectId) {
        throw new AppError("projectId is required.", 400);
    }
    if (!String(reason || "").trim()) {
        throw new AppError("reason is required.", 400);
    }
    if (!String(description || "").trim()) {
        throw new AppError("description is required.", 400);
    }

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, managerId: true }
    });
    if (!project) {
        throw new AppError("Project not found.", 404);
    }
    if (String(project.managerId || "") !== String(userId)) {
        throw new AppError("Only assigned Project Manager can escalate this project.", 403);
    }

    const escalated = await prisma.adminEscalation.create({
        data: {
            projectId,
            raisedById: userId,
            reason: reason || "General Escalation",
            description,
            status: "OPEN"
        }
    });

    res.json({ data: escalated, message: "Escalated to admin." });
});

export const getInternalReviews = asyncHandler(async (req, res) => {
    const { freelancerId } = req.params;
    const reviews = await prisma.internalFreelancerReview.findMany({
        where: { freelancerId },
        include: { manager: { select: { fullName: true } }, project: { select: { title: true } } },
        orderBy: { createdAt: "desc" }
    });
    res.json({
        data: reviews.map((review) => ({
            ...review,
            pmId: review.managerId,
            comment: review.notes
        }))
    });
});

export const submitInternalReview = asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    const freelancerId = req.params?.freelancerId || req.body?.freelancerId;
    const { projectId, rating, strengths, issues, notes, comment } = req.body;

    if (!userId) {
        throw new AppError("Authentication required", 401);
    }
    if (!freelancerId) {
        throw new AppError("freelancerId is required.", 400);
    }
    if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
        throw new AppError("rating must be between 1 and 5.", 400);
    }
    if (!String(comment ?? notes ?? "").trim()) {
        throw new AppError("comment is required.", 400);
    }

    if (projectId) {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { id: true, managerId: true }
        });
        if (!project || String(project.managerId || "") !== String(userId)) {
            throw new AppError("Only assigned Project Manager can review for this project.", 403);
        }
    }

    const review = await prisma.internalFreelancerReview.create({
        data: {
            freelancerId,
            managerId: userId,
            projectId: projectId || null,
            rating: Number(rating) || null,
            strengths,
            issues,
            notes: String(comment ?? notes ?? "").trim()
        }
    });
    res.json({
        data: {
            ...review,
            pmId: review.managerId,
            comment: review.notes
        },
        message: "Internal review submitted."
    });
});

export const createInternalReview = submitInternalReview;

export const verifyProjectClosure = asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    const { id: projectId } = req.params;
    const {
        handoverConfirmed,
        deliverablesConfirmed,
        finalFilesDelivered,
        receiptConfirmed,
        noIssuesConfirmed
    } = req.body;

    if (!userId) {
        throw new AppError("Authentication required", 401);
    }

    const projectRecord = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, managerId: true }
    });
    if (!projectRecord) {
        throw new AppError("Project not found.", 404);
    }
    if (String(projectRecord.managerId || "") !== String(userId)) {
        throw new AppError("Only assigned Project Manager can finalize project closure.", 403);
    }

    const isFullyVerified = Boolean(
        handoverConfirmed &&
        deliverablesConfirmed &&
        finalFilesDelivered &&
        receiptConfirmed &&
        noIssuesConfirmed
    );

    // If attempting to fully close
    if (isFullyVerified) {
        const unresolvedDisputes = await prisma.dispute.count({
            where: { projectId, status: { not: "RESOLVED" } }
        });
        if (unresolvedDisputes > 0) {
            throw new AppError("Cannot complete project: There are unresolved disputes.", 400);
        }

        const pendingPayments = await prisma.payment.count({
            where: { projectId, status: { notIn: ["COMPLETED", "REFUNDED"] } }
        });
        if (pendingPayments > 0) {
            throw new AppError("Cannot complete project: There are pending payout issues.", 400);
        }
    }

    const project = await prisma.project.update({
        where: { id: projectId },
        data: {
            closureHandoverConfirmed: Boolean(handoverConfirmed),
            closureDeliverablesConfirmed: Boolean(deliverablesConfirmed && finalFilesDelivered),
            closureReceiptConfirmed: Boolean(receiptConfirmed),
            closureNoIssuesConfirmed: Boolean(noIssuesConfirmed),
            closureVerifiedById: userId,
            closureVerifiedAt: new Date()
        }
    });

    // Verify if fully closed
    let responseProject = project;

    if (project.closureHandoverConfirmed && project.closureDeliverablesConfirmed && project.closureReceiptConfirmed && project.closureNoIssuesConfirmed) {
        responseProject = await prisma.project.update({
            where: { id: projectId },
            data: { status: "COMPLETED" }
        });

        await archiveCompletedProject({
            projectId,
            completedAt: responseProject?.updatedAt || new Date(),
        });

        if (acceptedProposal?.freelancerId) {
            await syncFreelancerOpenToWorkStatus(acceptedProposal.freelancerId).catch(() => null);
        }

                if (acceptedProposal?.freelancerId) {
                    try {
                        const verified = await markFreelancerVerifiedAfterProjectCompletion(
                            acceptedProposal.freelancerId
                        );
                        if (verified) {
                            console.log(
                                `[Verification] Marked freelancer ${acceptedProposal.freelancerId} as verified after PM closed project ${projectId}.`
                            );
                        }
                    } catch (verificationError) {
                        console.error(
                            `[Verification] Failed to mark freelancer ${acceptedProposal.freelancerId} as verified after PM closed project ${projectId}:`,
                            verificationError
                        );
                    }
                }
    }

    res.json({ data: responseProject, message: "Closure verification updated." });
});
