import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const targetId = 'cmpuqyxwf0000zr4wlmkmhomq';

async function main() {
  console.log(`Starting deletion for user ID: ${targetId}`);

  // Delete matching appointments
  try {
    const res = await prisma.appointment.deleteMany({
      where: {
        OR: [
          { clientId: targetId },
          { freelancerId: targetId }
        ]
      }
    });
    console.log(`Deleted ${res.count} appointments`);
  } catch (err) {
    console.error("Error deleting appointments:", err.message);
  }

  // Delete milestone approvals
  try {
    const res = await prisma.milestoneApproval.deleteMany({
      where: {
        OR: [
          { approverId: targetId },
          { milestone: { project: { OR: [{ clientId: targetId }, { freelancerId: targetId }] } } }
        ]
      }
    });
    console.log(`Deleted ${res.count} milestone approvals`);
  } catch (err) {
    console.error("Error deleting milestone approvals:", err.message);
  }

  // Delete project tasks
  try {
    const res = await prisma.projectTask.deleteMany({
      where: {
        project: {
          OR: [{ clientId: targetId }, { freelancerId: targetId }]
        }
      }
    });
    console.log(`Deleted ${res.count} project tasks`);
  } catch (err) {
    console.error("Error deleting project tasks:", err.message);
  }

  // Delete reviews
  try {
    const res = await prisma.review.deleteMany({
      where: {
        OR: [
          { reviewerId: targetId },
          { revieweeId: targetId }
        ]
      }
    });
    console.log(`Deleted ${res.count} reviews`);
  } catch (err) {
    console.error("Error deleting reviews:", err.message);
  }

  // Delete internal reviews
  try {
    const res = await prisma.internalFreelancerReview.deleteMany({
      where: {
        OR: [
          { reviewerId: targetId },
          { freelancerId: targetId }
        ]
      }
    });
    console.log(`Deleted ${res.count} internal reviews`);
  } catch (err) {
    console.error("Error deleting internal reviews:", err.message);
  }

  // Delete admin escalations
  try {
    const res = await prisma.adminEscalation.deleteMany({
      where: {
        OR: [
          { userId: targetId },
          { project: { OR: [{ clientId: targetId }, { freelancerId: targetId }] } }
        ]
      }
    });
    console.log(`Deleted ${res.count} admin escalations`);
  } catch (err) {
    console.error("Error deleting admin escalations:", err.message);
  }

  // Delete profile update requests
  try {
    const res = await prisma.profileUpdateRequest.deleteMany({
      where: { userId: targetId }
    });
    console.log(`Deleted ${res.count} profile update requests`);
  } catch (err) {
    console.error("Error deleting profile update requests:", err.message);
  }

  // Delete disputes
  try {
    const res = await prisma.dispute.deleteMany({
      where: {
        project: {
          OR: [{ clientId: targetId }, { freelancerId: targetId }]
        }
      }
    });
    console.log(`Deleted ${res.count} disputes`);
  } catch (err) {
    console.error("Error deleting disputes:", err.message);
  }

  // Delete proposals
  try {
    const res = await prisma.proposal.deleteMany({
      where: {
        OR: [
          { freelancerId: targetId },
          { project: { clientId: targetId } }
        ]
      }
    });
    console.log(`Deleted ${res.count} proposals`);
  } catch (err) {
    console.error("Error deleting proposals:", err.message);
  }

  // Delete completed projects
  try {
    const res = await prisma.completedProject.deleteMany({
      where: {
        project: {
          OR: [{ clientId: targetId }, { freelancerId: targetId }]
        }
      }
    });
    console.log(`Deleted ${res.count} completed projects`);
  } catch (err) {
    console.error("Error deleting completed projects:", err.message);
  }

  // Delete projects
  try {
    const res = await prisma.project.deleteMany({
      where: {
        OR: [
          { clientId: targetId },
          { freelancerId: targetId }
        ]
      }
    });
    console.log(`Deleted ${res.count} projects`);
  } catch (err) {
    console.error("Error deleting projects:", err.message);
  }

  // Delete payments
  try {
    const res = await prisma.payment.deleteMany({
      where: {
        OR: [
          { userId: targetId },
          { project: { OR: [{ clientId: targetId }, { freelancerId: targetId }] } }
        ]
      }
    });
    console.log(`Deleted ${res.count} payments`);
  } catch (err) {
    console.error("Error deleting payments:", err.message);
  }

  // Delete chat messages
  try {
    const res = await prisma.chatMessage.deleteMany({
      where: {
        OR: [
          { senderId: targetId },
          { conversation: { OR: [{ participant1Id: targetId }, { participant2Id: targetId }] } }
        ]
      }
    });
    console.log(`Deleted ${res.count} chat messages`);
  } catch (err) {
    console.error("Error deleting chat messages:", err.message);
  }

  // Delete chat conversations
  try {
    const res = await prisma.chatConversation.deleteMany({
      where: {
        OR: [
          { participant1Id: targetId },
          { participant2Id: targetId }
        ]
      }
    });
    console.log(`Deleted ${res.count} chat conversations`);
  } catch (err) {
    console.error("Error deleting chat conversations:", err.message);
  }

  // Delete notifications
  try {
    const res = await prisma.notification.deleteMany({
      where: { userId: targetId }
    });
    console.log(`Deleted ${res.count} notifications`);
  } catch (err) {
    console.error("Error deleting notifications:", err.message);
  }

  // Delete marketplace entries
  try {
    const res = await prisma.marketplace.deleteMany({
      where: { freelancerId: targetId }
    });
    console.log(`Deleted ${res.count} marketplace entries`);
  } catch (err) {
    console.error("Error deleting marketplace entries:", err.message);
  }

  // Delete freelancer projects
  try {
    const res = await prisma.freelancerProject.deleteMany({
      where: {
        freelancerProfile: { userId: targetId }
      }
    });
    console.log(`Deleted ${res.count} freelancer projects`);
  } catch (err) {
    console.error("Error deleting freelancer projects:", err.message);
  }

  // Delete freelancer skills
  try {
    const res = await prisma.freelancerSkill.deleteMany({
      where: {
        freelancerProfile: { userId: targetId }
      }
    });
    console.log(`Deleted ${res.count} freelancer skills`);
  } catch (err) {
    console.error("Error deleting freelancer skills:", err.message);
  }

  // Delete engagement sessions
  try {
    const res = await prisma.engagementAnswerSession.deleteMany({
      where: { userId: targetId }
    });
    console.log(`Deleted ${res.count} engagement sessions`);
  } catch (err) {
    console.error("Error deleting engagement sessions:", err.message);
  }

  // Delete points ledger
  try {
    const res = await prisma.pointsLedger.deleteMany({
      where: { userId: targetId }
    });
    console.log(`Deleted ${res.count} points ledgers`);
  } catch (err) {
    console.error("Error deleting points ledgers:", err.message);
  }

  // Delete engagement badges
  try {
    const res = await prisma.engagementUserBadge.deleteMany({
      where: { userId: targetId }
    });
    console.log(`Deleted ${res.count} engagement badges`);
  } catch (err) {
    console.error("Error deleting engagement badges:", err.message);
  }

  // Delete engagement process reports
  try {
    const res = await prisma.engagementProcessReport.deleteMany({
      where: { userId: targetId }
    });
    console.log(`Deleted ${res.count} engagement process reports`);
  } catch (err) {
    console.error("Error deleting engagement process reports:", err.message);
  }

  // Delete engagement personalized questions
  try {
    const res = await prisma.engagementPersonalizedQuestion.deleteMany({
      where: { userId: targetId }
    });
    console.log(`Deleted ${res.count} engagement personalized questions`);
  } catch (err) {
    console.error("Error deleting engagement personalized questions:", err.message);
  }

  // Delete engagement profiles
  try {
    const res = await prisma.engagementProfile.deleteMany({
      where: { userId: targetId }
    });
    console.log(`Deleted ${res.count} engagement profiles`);
  } catch (err) {
    console.error("Error deleting engagement profiles:", err.message);
  }

  // Delete freelancer profiles
  try {
    const res = await prisma.freelancerProfile.deleteMany({
      where: { userId: targetId }
    });
    console.log(`Deleted ${res.count} freelancer profiles`);
  } catch (err) {
    console.error("Error deleting freelancer profiles:", err.message);
  }

  // Delete client profiles
  try {
    const res = await prisma.clientProfile.deleteMany({
      where: { userId: targetId }
    });
    console.log(`Deleted ${res.count} client profiles`);
  } catch (err) {
    console.error("Error deleting client profiles:", err.message);
  }

  // Finally, delete user
  try {
    const res = await prisma.user.delete({
      where: { id: targetId }
    });
    console.log(`Deleted user ${res.email} successfully.`);
  } catch (err) {
    console.error("Error deleting user:", err.message);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
