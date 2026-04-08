import { asyncHandler } from "../utils/async-handler.js";
import { Prisma, prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";
import { sendNotificationToUser } from "../lib/notification-util.js";

const normalizeAmount = (value) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return 0;
  }
  const parsed = Math.round(Number(value));
  return parsed < 0 ? 0 : parsed;
};

const FREELANCER_REJECTION_REASON_PRESETS = Object.freeze({
  budget_not_fit: "Budget does not fit the project scope",
  timeline_unrealistic: "Timeline is not realistic",
  scope_unclear: "Project requirements are unclear",
  skill_mismatch: "Project is outside my current expertise",
  workload_capacity: "I do not have capacity right now",
});

const CUSTOM_REJECTION_REASON_KEY = "custom";

const FREELANCER_REJECTION_REASON_KEYS = new Set([
  ...Object.keys(FREELANCER_REJECTION_REASON_PRESETS),
  CUSTOM_REJECTION_REASON_KEY,
]);

export const createProposal = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const { projectId, coverLetter, amount, status, freelancerId } = req.body;
  const normalizedIncomingStatus = String(status || "")
    .trim()
    .toUpperCase();
  const nextStatus = ["PENDING", "ACCEPTED", "REJECTED", "REPLACED"].includes(
    normalizedIncomingStatus
  )
    ? normalizedIncomingStatus
    : "PENDING";

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true, title: true, status: true }
  });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  const projectStatus = String(project.status || "").toUpperCase();
  if (["COMPLETED", "PAUSED"].includes(projectStatus)) {
    throw new AppError(
      "Cannot send a proposal for a completed or paused project.",
      409
    );
  }

  const actingFreelancerId = freelancerId || userId;
  const isOwner = project.ownerId === userId;
  const isSelf = actingFreelancerId === userId;

  if (!isOwner && !isSelf) {
    throw new AppError(
      "You do not have permission to add a proposal to this project",
      403
    );
  }

  let wasReopened = false;
  const proposal = await prisma.$transaction(
    async (tx) => {
      // Serialize create attempts for the same project+freelancer pair to prevent duplicates.
      const lockRows = await tx.$queryRaw`
        SELECT pg_try_advisory_xact_lock(90210, hashtext(${`${projectId}:${actingFreelancerId}`})) AS "locked"
      `;
      const hasLock = Array.isArray(lockRows) && lockRows[0]?.locked === true;
      if (!hasLock) {
        throw new AppError(
          "Another proposal request is already being processed. Please retry.",
          409
        );
      }

      const latestExisting = await tx.proposal.findFirst({
        where: {
          projectId,
          freelancerId: actingFreelancerId,
        },
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      });

      if (latestExisting) {
        const existingStatus = String(latestExisting.status || "").toUpperCase();
        if (["PENDING", "ACCEPTED"].includes(existingStatus)) {
          const message =
            existingStatus === "ACCEPTED"
              ? "This freelancer has already accepted a proposal for this project."
              : "A proposal has already been sent to this freelancer for this project.";
          throw new AppError(message, 409);
        }

        if (["REJECTED", "REPLACED"].includes(existingStatus)) {
          wasReopened = true;
          return tx.proposal.update({
            where: { id: latestExisting.id },
            data: {
              coverLetter,
              amount: normalizeAmount(amount),
              status: nextStatus,
              rejectionReason: null,
              rejectionReasonKey: null,
            },
          });
        }
      }

      return tx.proposal.create({
        data: {
          coverLetter,
          amount: normalizeAmount(amount),
          status: nextStatus,
          freelancerId: actingFreelancerId,
          projectId,
        },
      });
    },
    {
      maxWait: 10000,
      timeout: 20000,
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  );

  // Determine who should receive the notification:
  // - If CLIENT (project owner) is sending the proposal TO a freelancer -> notify the FREELANCER
  // - If FREELANCER is sending the proposal TO a client's project -> notify the CLIENT (owner)
  // The sender should NEVER receive the notification
  
  const isClientSendingToFreelancer = isOwner && freelancerId && String(freelancerId) !== String(userId);
  const isFreelancerSendingToClient = !isOwner && String(actingFreelancerId) === String(userId);
  
  console.log(`[Proposal] Notification Logic Debug:`);
  console.log(`- Project Owner: ${project.ownerId}`);
  console.log(`- Current User: ${userId}`);
  console.log(`- Target Freelancer: ${freelancerId}`);
  console.log(`- Acting ID: ${actingFreelancerId}`);
  console.log(`- isOwner: ${isOwner}`);
  console.log(`- isClientSendingToFreelancer: ${isClientSendingToFreelancer}`);
  console.log(`- isFreelancerSendingToClient: ${isFreelancerSendingToClient}`);
  
  console.log(`[Proposal] Notification check - isOwner: ${isOwner}, userId: ${userId}, freelancerId: ${freelancerId}`);
  console.log(`[Proposal] isClientSendingToFreelancer: ${isClientSendingToFreelancer}, isFreelancerSendingToClient: ${isFreelancerSendingToClient}`);
  
  // Prevent self-notifications just in case
  if (String(actingFreelancerId) === String(project.ownerId)) {
    console.log("[Proposal] Sender is project owner - checking direction");
  }
  
  if (isClientSendingToFreelancer) {
    // Client is sending a proposal TO a freelancer - notify the freelancer
    console.log(`[Proposal] Client sending to freelancer - notifying freelancer: ${freelancerId}`);
    try {
      await sendNotificationToUser(freelancerId, {
        audience: "freelancer",
        type: "proposal",
        title: "New Proposal Received",
        message: `You have received a new proposal for project "${project.title}".`,
        data: { 
          projectId: projectId,
          proposalId: proposal.id 
        }
      });
      console.log(`[Proposal] Notification sent successfully to freelancer: ${freelancerId}`);
    } catch (error) {
      console.error("Failed to send proposal notification to freelancer:", error);
    }
  } else if (isFreelancerSendingToClient) {
    // Freelancer is sending a proposal TO a client's project - notify the client (owner)
    console.log(`[Proposal] Freelancer sending to client - notifying owner: ${project.ownerId}`);
    try {
      sendNotificationToUser(project.ownerId, {
        audience: "client",
        type: "proposal",
        title: "New Proposal Application",
        message: `A freelancer has submitted a proposal for your project "${project.title}".`,
        data: { 
          projectId: projectId,
          proposalId: proposal.id 
        }
      });
    } catch (error) {
      console.error("Failed to send proposal notification to owner:", error);
    }
  } else {
    console.log(`[Proposal] Skipping notification - sender is recipient or unknown scenario`);
  }

  res.status(wasReopened ? 200 : 201).json({ data: proposal });
});

export const getProposal = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const proposalId = req.params.id;

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      project: {
        include: {
          owner: true
        }
      },
      freelancer: true
    }
  });

  if (!proposal) {
    throw new AppError("Proposal not found", 404);
  }

  // Check if user has permission to view this proposal
  const isOwner = proposal.project?.ownerId === userId;
  const isFreelancer = proposal.freelancerId === userId;

  if (!isOwner && !isFreelancer) {
    throw new AppError("You do not have permission to view this proposal", 403);
  }

  res.json({ data: proposal });
});

export const updateProposal = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const proposalId = req.params.id;
  const { coverLetter, amount } = req.body || {};

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      project: {
        select: {
          ownerId: true,
        },
      },
      freelancer: true,
    },
  });

  if (!proposal) {
    throw new AppError("Proposal not found", 404);
  }

  const isOwner = String(proposal.project?.ownerId || "") === String(userId);
  const isFreelancer = String(proposal.freelancerId || "") === String(userId);

  if (!isOwner && !isFreelancer) {
    throw new AppError("You do not have permission to update this proposal", 403);
  }

  const normalizedStatus = String(proposal.status || "").toUpperCase();
  if (["ACCEPTED", "REPLACED"].includes(normalizedStatus)) {
    throw new AppError("This proposal can no longer be edited.", 409);
  }

  const updates = {};

  if (typeof coverLetter === "string") {
    const trimmedCoverLetter = coverLetter.trim();
    if (!trimmedCoverLetter) {
      throw new AppError("Proposal details cannot be empty.", 400);
    }

    updates.coverLetter = trimmedCoverLetter;
  }

  if (amount !== undefined) {
    updates.amount = normalizeAmount(amount);
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError("No changes supplied.", 400);
  }

  const updatedProposal = await prisma.proposal.update({
    where: { id: proposalId },
    data: updates,
    include: {
      project: {
        include: {
          owner: true,
        },
      },
      freelancer: true,
    },
  });

  const amountChanged =
    Object.prototype.hasOwnProperty.call(updates, "amount") &&
    Number(updates.amount) !== Number(proposal.amount);

  if (isOwner && amountChanged && updatedProposal?.freelancerId) {
    try {
      await sendNotificationToUser(updatedProposal.freelancerId, {
        audience: "freelancer",
        type: "proposal",
        title: "Budget Increased",
        message: `Your proposal for "${updatedProposal?.project?.title || "this project"}" now has a higher budget. Check your proposal section to review the updated amount.`,
        data: {
          projectId: updatedProposal?.project?.id || proposal?.projectId || null,
          proposalId: updatedProposal?.id || proposalId,
          previousAmount: Number(proposal.amount) || 0,
          updatedAmount: Number(updates.amount) || 0,
        },
      });
    } catch (notificationError) {
      console.error("Failed to send budget increase notification to freelancer", {
        proposalId,
        freelancerId: updatedProposal?.freelancerId,
        error: notificationError,
      });
    }
  }

  res.json({ data: updatedProposal });
});

export const listProposals = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const mode = req.query.as === "owner" ? "owner" : "freelancer";

  const proposals = await prisma.proposal.findMany({
    where:
      mode === "owner"
        ? { project: { ownerId: userId } }
        : { freelancerId: userId },
    include: {
      project: {
        include: {
          owner: true,
          manager: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              avatar: true,
              status: true,
              role: true,
            },
          }
        }
      },
      freelancer: true
    },
    orderBy: { createdAt: "desc" }
  });

  const proposalStatusPriority = {
    ACCEPTED: 4,
    PENDING: 3,
    REJECTED: 2,
    REPLACED: 1,
  };

  // Deduplicate old duplicate rows for the same project+freelancer pair.
  // Keep the most relevant record (status priority, then latest timestamp).
  const dedupedMap = new Map();
  proposals.forEach((proposal) => {
    const key = `${proposal.projectId}:${proposal.freelancerId}`;
    const existing = dedupedMap.get(key);
    if (!existing) {
      dedupedMap.set(key, proposal);
      return;
    }

    const currentPriority =
      proposalStatusPriority[String(proposal.status || "").toUpperCase()] || 0;
    const existingPriority =
      proposalStatusPriority[String(existing.status || "").toUpperCase()] || 0;

    if (currentPriority > existingPriority) {
      dedupedMap.set(key, proposal);
      return;
    }
    if (currentPriority < existingPriority) {
      return;
    }

    const currentTimestamp = new Date(
      proposal.updatedAt || proposal.createdAt || 0
    ).getTime();
    const existingTimestamp = new Date(
      existing.updatedAt || existing.createdAt || 0
    ).getTime();
    if (currentTimestamp >= existingTimestamp) {
      dedupedMap.set(key, proposal);
    }
  });
  const dedupedProposals = [...dedupedMap.values()];

  // Fetch chat conversations to get latest activity
  const serviceKeys = dedupedProposals.map(p => {
    const projectId = p.project.id;
    const ownerId = p.project.ownerId;
    const freelancerId = p.freelancerId;
    return `CHAT:${projectId}:${ownerId}:${freelancerId}`;
  });

  const conversations = await prisma.chatConversation.findMany({
    where: { service: { in: serviceKeys } },
    select: { service: true, updatedAt: true }
  });

  const conversationMap = new Map();
  conversations.forEach(c => {
    if (c.service) conversationMap.set(c.service, c.updatedAt);
  });

  const proposalsWithActivity = dedupedProposals.map(p => {
    const key = `CHAT:${p.project.id}:${p.project.ownerId}:${p.freelancerId}`;
    const chatUpdated = conversationMap.get(key);
    // Use the later of proposal update or chat update
    const lastActivity = chatUpdated ? new Date(chatUpdated) : new Date(p.updatedAt);
    return { ...p, lastActivity };
  });

  // Sort by last activity descending
  const sortedProposals = proposalsWithActivity.sort((a, b) => 
    b.lastActivity.getTime() - a.lastActivity.getTime()
  );

  res.json({ data: sortedProposals });
});

export const deleteProposal = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const proposalId = req.params.id;

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      project: { select: { ownerId: true } }
    }
  });

  if (!proposal) {
    throw new AppError("Proposal not found", 404);
  }

  const isOwner = proposal.project?.ownerId === userId;
  const isFreelancer = proposal.freelancerId === userId;

  if (!isOwner && !isFreelancer) {
    throw new AppError("You do not have permission to delete this proposal", 403);
  }

  await prisma.proposal.delete({
    where: { id: proposalId }
  });

  res.json({ data: { deleted: true } });
});

export const updateProposalStatus = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const proposalId = req.params.id;
  const { status, rejectionReason, rejectionReasonKey } = req.body || {};

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const normalizedStatus = (() => {
    const incoming = (status || "").toString().trim().toUpperCase();
    if (incoming === "RECEIVED") return "PENDING";
    if (["PENDING", "ACCEPTED", "REJECTED"].includes(incoming)) {
      return incoming;
    }
    return null;
  })();

  if (!normalizedStatus) {
    throw new AppError("Invalid proposal status", 400);
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      project: { select: { ownerId: true, title: true } }
    }
  });

  if (!proposal) {
    throw new AppError("Proposal not found", 404);
  }
  if (!proposal.project) {
    throw new AppError("Proposal project not found", 404);
  }

  const isOwner = String(proposal.project.ownerId) === String(userId);
  const isFreelancer = String(proposal.freelancerId) === String(userId);

  if (!isOwner && !isFreelancer) {
    throw new AppError("You do not have permission to update this proposal", 403);
  }

  const normalizedReasonKey = String(rejectionReasonKey || "")
    .trim()
    .toLowerCase();
  const trimmedRejectionReason = String(rejectionReason || "").trim();
  const shouldCollectFreelancerRejectionReason =
    normalizedStatus === "REJECTED" && isFreelancer;

  if (shouldCollectFreelancerRejectionReason) {
    if (
      !normalizedReasonKey ||
      !FREELANCER_REJECTION_REASON_KEYS.has(normalizedReasonKey)
    ) {
      throw new AppError(
        "Please select a valid rejection reason before rejecting this proposal.",
        400
      );
    }

    if (
      normalizedReasonKey === CUSTOM_REJECTION_REASON_KEY &&
      trimmedRejectionReason.length < 3
    ) {
      throw new AppError(
        "Please provide a custom rejection reason (at least 3 characters).",
        400
      );
    }
  }

  const rejectionReasonForSave = shouldCollectFreelancerRejectionReason
    ? normalizedReasonKey === CUSTOM_REJECTION_REASON_KEY
      ? trimmedRejectionReason
      : trimmedRejectionReason ||
        FREELANCER_REJECTION_REASON_PRESETS[normalizedReasonKey] ||
        ""
    : null;

  try {
    // Use a transaction to atomically check and update to prevent race conditions
    const { updated, rejectedFreelancerIds, projectTitle } = await prisma.$transaction(async (tx) => {
      let rejectedFreelancerIds = [];
      
      // Check AGAIN inside transaction to prevent race conditions
      if (normalizedStatus === "ACCEPTED") {
        // Serialize acceptance attempts per project to guarantee only one winner.
        // Advisory lock avoids coupling to a physical table name in raw SQL.
        const lockRows = await tx.$queryRaw`
          SELECT pg_try_advisory_xact_lock(481516, hashtext(${proposal.projectId})) AS "locked"
        `;
        const hasLock = Array.isArray(lockRows) && lockRows[0]?.locked === true;

        if (!hasLock) {
          throw new AppError(
            "Another acceptance is already being processed for this project. Please retry.",
            409
          );
        }

        const currentProposal = await tx.proposal.findUnique({
          where: { id: proposalId },
          select: { status: true }
        });

        if (!currentProposal) {
          throw new AppError("Proposal not found", 404);
        }

        if (["REJECTED", "REPLACED"].includes(currentProposal.status)) {
          throw new AppError(
            "This proposal is no longer available to accept.",
            409
          );
        }

        const existingAccepted = await tx.proposal.findFirst({
          where: {
            projectId: proposal.projectId,
            status: "ACCEPTED",
            id: { not: proposalId }
          }
        });

        if (existingAccepted) {
          throw new AppError(
            "This project has already been awarded to another freelancer. You cannot accept this proposal.",
            409
          );
        }
        
        // Get list of other pending proposals to reject and notify their freelancers
        const otherPendingProposals = await tx.proposal.findMany({
          where: {
            projectId: proposal.projectId,
            id: { not: proposalId },
            status: "PENDING"
          },
          select: { id: true, freelancerId: true }
        });
        
        rejectedFreelancerIds = otherPendingProposals.map(p => p.freelancerId);
        
        // Auto-reject all other pending proposals for the same project
        if (otherPendingProposals.length > 0) {
          await tx.proposal.updateMany({
            where: {
              projectId: proposal.projectId,
              id: { not: proposalId },
              status: "PENDING"
            },
            data: {
              status: "REJECTED",
              rejectionReason: "Another proposal was accepted for this project.",
              rejectionReasonKey: "system_awarded_to_another",
            }
          });
        }
      }
      
      // Now do the update atomically
      const proposalUpdateData = {
        status: normalizedStatus,
      };

      if (normalizedStatus === "REJECTED" && isFreelancer) {
        proposalUpdateData.rejectionReason = rejectionReasonForSave;
        proposalUpdateData.rejectionReasonKey = normalizedReasonKey;
      } else if (normalizedStatus !== "REJECTED") {
        proposalUpdateData.rejectionReason = null;
        proposalUpdateData.rejectionReasonKey = null;
      }

      const updated = await tx.proposal.update({
        where: { id: proposalId },
        data: proposalUpdateData,
        include: {
          project: true,
          freelancer: true
        }
      });
      
      return { 
        updated, 
        rejectedFreelancerIds,
        projectTitle: updated.project?.title || "the project"
      };
    }, {
      maxWait: 10000,
      timeout: 20000,
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });

    // Cleanup duplicate sibling projects outside the transaction to avoid tx expiry (P2028).
    if (normalizedStatus === "ACCEPTED") {
      try {
        const ownerId = updated.project?.ownerId || proposal.project?.ownerId;
        const searchTitle = String(updated.project?.title || proposal.project?.title || "").trim();

        if (ownerId && searchTitle) {
          const siblingProjects = await prisma.project.findMany({
            where: {
              ownerId,
              title: { equals: searchTitle, mode: "insensitive" },
              id: { not: proposal.projectId },
              status: { in: ["OPEN", "DRAFT"] },
            },
            select: { id: true },
          });

          if (siblingProjects.length > 0) {
            const siblingIds = siblingProjects.map((p) => p.id);
            await prisma.proposal.deleteMany({
              where: { projectId: { in: siblingIds } },
            });
            await prisma.project.deleteMany({
              where: { id: { in: siblingIds } },
            });
            console.log(
              `[Proposal] Cleanup removed sibling projects: ${siblingIds.join(", ")}`
            );
          }
        }
      } catch (cleanupError) {
        console.error("Failed to cleanup sibling projects:", cleanupError);
      }
    }
    
    // Send notifications to freelancers whose proposals were auto-rejected
    if (rejectedFreelancerIds && rejectedFreelancerIds.length > 0) {
      for (const freelancerId of rejectedFreelancerIds) {
        try {
          sendNotificationToUser(freelancerId, {
            audience: "freelancer",
            type: "proposal",
            title: "Project Awarded to Another",
            message: `The project "${projectTitle}" has been awarded to another freelancer.`,
            data: { 
              projectId: proposal.projectId,
              status: "REJECTED"
            }
          });
        } catch (err) {
          console.error(`Failed to notify freelancer ${freelancerId}:`, err);
        }
      }
    }

    // Notify Freelancer if Client changes status
    if (isOwner && proposal.status !== normalizedStatus) {
      let title = "Proposal Update";
      let message = `Your proposal for "${proposal.project.title}" was updated to ${normalizedStatus}`;
      
      if (normalizedStatus === "ACCEPTED") {
        title = "Proposal Accepted! 🎉";
        message = `Congratulations! Your proposal for "${proposal.project.title}" has been accepted.`;
      } else if (normalizedStatus === "REJECTED") {
        title = "Proposal Rejected";
        message = `Your proposal for "${proposal.project.title}" was declined.`;
      }

      try {
        sendNotificationToUser(proposal.freelancerId, {
          audience: "freelancer",
          type: "proposal",
          title,
          message,
          data: { 
            projectId: proposal.projectId, 
            proposalId: proposal.id,
            status: normalizedStatus
          }
        });
      } catch (err) {
        console.error("Failed to notify freelancer:", err);
      }
    }

    // Notify owner when freelancer rejects a proposal and include reason.
    if (
      isFreelancer &&
      normalizedStatus === "REJECTED" &&
      proposal.status !== normalizedStatus
    ) {
      try {
        const freelancerName =
          updated.freelancer?.fullName ||
          updated.freelancer?.name ||
          "A freelancer";
        const reasonLine = rejectionReasonForSave
          ? ` Reason: ${rejectionReasonForSave}`
          : "";

        sendNotificationToUser(updated.project.ownerId, {
          audience: "client",
          type: "proposal",
          title: "Proposal Rejected by Freelancer",
          message: `${freelancerName} declined your proposal for "${updated.project.title}".${reasonLine}`,
          data: {
            projectId: updated.projectId,
            proposalId: updated.id,
            status: normalizedStatus,
            rejectionReason: rejectionReasonForSave || null,
          }
        });
      } catch (err) {
        console.error("Failed to notify client about rejection:", err);
      }
    }

    // If status is ACCEPTED by freelancer, notify client and mark project as awaiting payment.
    if (normalizedStatus === "ACCEPTED" && isFreelancer) {
      // Notify the client that freelancer accepted their proposal
      try {
        const freelancerName = updated.freelancer?.fullName || updated.freelancer?.name || "A freelancer";
        await sendNotificationToUser(updated.project.ownerId, {
          audience: "client",
          type: "proposal",
          title: "Proposal Accepted! 🎉",
          message: `${freelancerName} has accepted your proposal for "${updated.project.title}". Pay the initial 20% to start the project.`,
          data: { 
            projectId: updated.projectId, 
            proposalId: updated.id,
            status: normalizedStatus
          }
        });
      } catch (err) {
        console.error("Failed to notify client about acceptance:", err);
      }

      // 1. Update Project Status to "AWAITING_PAYMENT" - client must pay before project starts
      try {
        await prisma.project.update({
          where: { id: updated.projectId },
          data: { status: "AWAITING_PAYMENT" }
        });
      } catch (projError) {
        console.error("Failed to update project status:", projError);
      }

    }

    res.json({ data: updated });
  } catch (error) {
    console.error("Failed to update proposal status", {
      proposalId,
      normalizedStatus,
      error
    });
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2004"
    ) {
      throw new AppError("Invalid proposal status value", 400);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2028") {
        throw new AppError(
          "Proposal update timed out while processing acceptance. Please retry.",
          409,
          { code: error.code, meta: error.meta }
        );
      }
      throw new AppError(`Database error (${error.code}) updating proposal`, 500, {
        code: error.code,
        meta: error.meta
      });
    }

    throw error;
  }
});

