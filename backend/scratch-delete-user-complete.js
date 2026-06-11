import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const targetId = 'cmpuqyxwf0000zr4wlmkmhomq';

async function main() {
  console.log(`Starting clean deletion for user ID: ${targetId}`);

  // 1. Find all projects owned or managed by targetId
  let projectIds = [];
  try {
    const ownedProjects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: targetId },
          { managerId: targetId }
        ]
      },
      select: { id: true }
    });
    projectIds = ownedProjects.map(p => p.id);
    console.log(`Found ${projectIds.length} projects associated with user`);
  } catch (err) {
    console.error("Error finding projects:", err.message);
  }

  // 2. Delete milestones approvals related to these projects
  try {
    const res = await prisma.milestoneApproval.deleteMany({
      where: {
        OR: [
          { approverId: targetId },
          { projectId: { in: projectIds } }
        ]
      }
    });
    console.log(`Deleted ${res.count} milestone approvals`);
  } catch (err) {
    console.log("No milestone approvals deleted or error:", err.message);
  }

  // 3. Delete project tasks
  try {
    const res = await prisma.projectTask.deleteMany({
      where: {
        projectId: { in: projectIds }
      }
    });
    console.log(`Deleted ${res.count} project tasks`);
  } catch (err) {
    console.log("No project tasks deleted or error:", err.message);
  }

  // 4. Delete disputes
  try {
    const res = await prisma.dispute.deleteMany({
      where: {
        OR: [
          { raisedById: targetId },
          { managerId: targetId },
          { projectId: { in: projectIds } }
        ]
      }
    });
    console.log(`Deleted ${res.count} disputes`);
  } catch (err) {
    console.log("No disputes deleted or error:", err.message);
  }

  // 5. Delete appointments
  try {
    const res = await prisma.appointment.deleteMany({
      where: {
        OR: [
          { bookedById: targetId },
          { managerId: targetId },
          { projectId: { in: projectIds } }
        ]
      }
    });
    console.log(`Deleted ${res.count} appointments`);
  } catch (err) {
    console.log("No appointments deleted or error:", err.message);
  }

  // 6. Delete payments
  try {
    const res = await prisma.payment.deleteMany({
      where: {
        OR: [
          { freelancerId: targetId },
          { projectId: { in: projectIds } }
        ]
      }
    });
    console.log(`Deleted ${res.count} payments`);
  } catch (err) {
    console.log("No payments deleted or error:", err.message);
  }

  // 7. Delete proposals
  try {
    const res = await prisma.proposal.deleteMany({
      where: {
        OR: [
          { freelancerId: targetId },
          { projectId: { in: projectIds } }
        ]
      }
    });
    console.log(`Deleted ${res.count} proposals`);
  } catch (err) {
    console.log("No proposals deleted or error:", err.message);
  }

  // 8. Delete completed projects
  try {
    const res = await prisma.completedProject.deleteMany({
      where: {
        OR: [
          { originalProjectId: { in: projectIds } },
          { ownerId: targetId },
          { managerId: targetId }
        ]
      }
    });
    console.log(`Deleted ${res.count} completed projects`);
  } catch (err) {
    console.log("No completed projects deleted or error:", err.message);
  }

  // 9. Delete internal reviews
  try {
    const res = await prisma.internalFreelancerReview.deleteMany({
      where: {
        OR: [
          { reviewerId: targetId },
          { freelancerId: targetId },
          { projectId: { in: projectIds } }
        ]
      }
    });
    console.log(`Deleted ${res.count} internal reviews`);
  } catch (err) {
    console.log("No internal reviews deleted or error:", err.message);
  }

  // 10. Delete admin escalations
  try {
    const res = await prisma.adminEscalation.deleteMany({
      where: {
        OR: [
          { raisedById: targetId },
          { projectId: { in: projectIds } }
        ]
      }
    });
    console.log(`Deleted ${res.count} admin escalations`);
  } catch (err) {
    console.log("No admin escalations deleted or error:", err.message);
  }

  // 11. Delete projects themselves
  try {
    const res = await prisma.project.deleteMany({
      where: {
        id: { in: projectIds }
      }
    });
    console.log(`Deleted ${res.count} projects`);
  } catch (err) {
    console.log("No projects deleted or error:", err.message);
  }

  // 12. Delete chat messages and conversations
  try {
    const resMsg = await prisma.chatMessage.deleteMany({
      where: { senderId: targetId }
    });
    console.log(`Deleted ${resMsg.count} chat messages`);

    const resConv = await prisma.chatConversation.deleteMany({
      where: { createdById: targetId }
    });
    console.log(`Deleted ${resConv.count} chat conversations`);
  } catch (err) {
    console.log("No chat history deleted or error:", err.message);
  }

  // 13. Delete profile updates
  try {
    const res = await prisma.profileUpdateRequest.deleteMany({
      where: {
        OR: [
          { userId: targetId },
          { reviewerId: targetId }
        ]
      }
    });
    console.log(`Deleted ${res.count} profile update requests`);
  } catch (err) {
    console.log("No profile update requests deleted or error:", err.message);
  }

  // 14. Delete notifications
  try {
    const res = await prisma.notification.deleteMany({
      where: { userId: targetId }
    });
    console.log(`Deleted ${res.count} notifications`);
  } catch (err) {
    console.log("No notifications deleted or error:", err.message);
  }

  // 15. Delete marketplace entries
  try {
    const res = await prisma.marketplace.deleteMany({
      where: { freelancerId: targetId }
    });
    console.log(`Deleted ${res.count} marketplace entries`);
  } catch (err) {
    console.log("No marketplace entries deleted or error:", err.message);
  }

  // 16. Delete freelancer projects
  try {
    const res = await prisma.freelancerProject.deleteMany({
      where: { freelancerId: targetId }
    });
    console.log(`Deleted ${res.count} freelancer projects`);
  } catch (err) {
    console.log("No freelancer projects deleted or error:", err.message);
  }

  // 17. Delete freelancer skills
  try {
    const res = await prisma.freelancerSkill.deleteMany({
      where: { userId: targetId }
    });
    console.log(`Deleted ${res.count} freelancer skills`);
  } catch (err) {
    console.log("No freelancer skills deleted or error:", err.message);
  }

  // 18. Delete manager availabilities
  try {
    const res = await prisma.managerAvailability.deleteMany({
      where: { managerId: targetId }
    });
    console.log(`Deleted ${res.count} manager availabilities`);
  } catch (err) {
    console.log("No manager availabilities deleted or error:", err.message);
  }

  // 19. Delete engagement data
  try {
    const resSessions = await prisma.engagementAnswerSession.deleteMany({
      where: { userId: targetId }
    });
    console.log(`Deleted ${resSessions.count} engagement sessions`);

    const resLedger = await prisma.pointsLedger.deleteMany({
      where: { userId: targetId }
    });
    console.log(`Deleted ${resLedger.count} points ledger entries`);

    const resBadges = await prisma.engagementUserBadge.deleteMany({
      where: { userId: targetId }
    });
    console.log(`Deleted ${resBadges.count} engagement badges`);

    const resReports = await prisma.engagementProcessReport.deleteMany({
      where: { userId: targetId }
    });
    console.log(`Deleted ${resReports.count} engagement process reports`);

    const resQues = await prisma.engagementPersonalizedQuestion.deleteMany({
      where: { userId: targetId }
    });
    console.log(`Deleted ${resQues.count} engagement personalized questions`);

    const resProf = await prisma.engagementProfile.deleteMany({
      where: { userId: targetId }
    });
    console.log(`Deleted ${resProf.count} engagement profiles`);
  } catch (err) {
    console.log("No engagement data deleted or error:", err.message);
  }

  // 20. Delete user profiles
  try {
    const resF = await prisma.freelancerProfile.deleteMany({
      where: { userId: targetId }
    });
    console.log(`Deleted ${resF.count} freelancer profiles`);

    const resC = await prisma.clientProfile.deleteMany({
      where: { userId: targetId }
    });
    console.log(`Deleted ${resC.count} client profiles`);

    const resM = await prisma.managerProfile.deleteMany({
      where: { userId: targetId }
    });
    console.log(`Deleted ${resM.count} manager profiles`);
  } catch (err) {
    console.log("No user profiles deleted or error:", err.message);
  }

  // 21. Finally delete the user!
  try {
    const res = await prisma.user.delete({
      where: { id: targetId }
    });
    console.log(`Deleted user ${res.email} successfully.`);
  } catch (err) {
    console.error("Error deleting user account:", err.message);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
