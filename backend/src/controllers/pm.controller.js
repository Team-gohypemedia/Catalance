import { asyncHandler } from "../utils/async-handler.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";

export const getDashboard = asyncHandler(async (req, res) => {
    const userId = req.user.sub;

    const projects = await prisma.project.findMany({
        where: { managerId: userId },
        include: {
            owner: { select: { id: true, fullName: true, avatar: true } },
            proposals: {
                where: { status: "ACCEPTED" },
                include: { freelancer: { select: { id: true, fullName: true, avatar: true } } }
            },
            disputes: { select: { id: true, status: true } }
        },
        orderBy: { updatedAt: "desc" }
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
                lastMessageSender: conversation?.messages?.[0]?.senderName || conversation?.messages?.[0]?.role || null,
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
    const userId = req.user.sub;
    const projects = await prisma.project.findMany({
        where: { managerId: userId },
        include: {
            owner: { select: { fullName: true } },
            proposals: {
                where: { status: "ACCEPTED" },
                include: { freelancer: { select: { fullName: true } } }
            }
        },
        orderBy: { createdAt: "desc" }
    });
    res.json({ data: projects });
});

export const updateProfileRequest = asyncHandler(async (req, res) => {
    const userId = req.user.sub;
    const data = req.body;
    const request = await prisma.profileUpdateRequest.create({
        data: {
            userId,
            requestedData: data,
            status: "PENDING"
        }
    });

    res.json({
        data: request,
        message: "Profile update request sent to Admin for approval."
    });
});

export const createMilestoneApproval = asyncHandler(async (req, res) => {
    const userId = req.user.sub;
    const { id: projectId } = req.params;
    const { phase, notes } = req.body;

    const project = await prisma.project.findUnique({
        where: { id: projectId }
    });

    if (!project || String(project.managerId) !== String(userId)) {
        throw new AppError("Access denied or project not found.", 403);
    }

    const approval = await prisma.milestoneApproval.upsert({
        where: { projectId_phase: { projectId, phase: Number(phase) } },
        update: { notes },
        create: { projectId, managerId: userId, phase: Number(phase), notes }
    });

    res.json({ data: approval, message: `Phase ${phase} approved successfully.` });
});

export const getEscalations = asyncHandler(async (req, res) => {
    const userId = req.user.sub;
    const escalations = await prisma.adminEscalation.findMany({
        where: { raisedById: userId },
        include: { project: { select: { title: true } } },
        orderBy: { createdAt: "desc" }
    });
    res.json({ data: escalations });
});

export const submitEscalation = asyncHandler(async (req, res) => {
    const userId = req.user.sub;
    const { id: projectId } = req.params;
    const { reason, description } = req.body;

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
    res.json({ data: reviews });
});

export const submitInternalReview = asyncHandler(async (req, res) => {
    const userId = req.user.sub;
    const { freelancerId, projectId, rating, strengths, issues, notes } = req.body;

    const review = await prisma.internalFreelancerReview.create({
        data: {
            freelancerId,
            managerId: userId,
            projectId: projectId || null,
            rating: Number(rating) || null,
            strengths,
            issues,
            notes
        }
    });
    res.json({ data: review, message: "Internal review submitted." });
});

export const verifyProjectClosure = asyncHandler(async (req, res) => {
    const userId = req.user.sub;
    const { id: projectId } = req.params;
    const {
        handoverConfirmed,
        deliverablesConfirmed,
        receiptConfirmed,
        noIssuesConfirmed
    } = req.body;

    // If attempting to fully close
    if (handoverConfirmed && deliverablesConfirmed && receiptConfirmed && noIssuesConfirmed) {
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
            closureDeliverablesConfirmed: Boolean(deliverablesConfirmed),
            closureReceiptConfirmed: Boolean(receiptConfirmed),
            closureNoIssuesConfirmed: Boolean(noIssuesConfirmed),
            closureVerifiedById: userId,
            closureVerifiedAt: new Date()
        }
    });

    // Verify if fully closed
    if (project.closureHandoverConfirmed && project.closureDeliverablesConfirmed && project.closureReceiptConfirmed && project.closureNoIssuesConfirmed) {
        await prisma.project.update({
            where: { id: projectId },
            data: { status: "COMPLETED" }
        });
    }

    res.json({ data: project, message: "Closure verification updated." });
});
