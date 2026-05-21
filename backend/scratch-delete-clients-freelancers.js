import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Fetching client and freelancer users...");
  const targetUsers = await prisma.user.findMany({
    where: {
      role: {
        in: ['CLIENT', 'FREELANCER']
      }
    },
    select: {
      id: true,
      email: true,
      role: true
    }
  });

  const targetIds = targetUsers.map(u => u.id);
  console.log(`Found ${targetUsers.length} users to delete:`);
  targetUsers.forEach(u => console.log(` - [${u.role}] ${u.email} (${u.id})`));

  if (targetIds.length === 0) {
    console.log("No client or freelancer users found in database.");
    return;
  }

  console.log("Cleaning up related tables first...");

  // Delete matching appointments
  await prisma.appointment.deleteMany({});
  
  // Delete milestone approvals
  await prisma.milestoneApproval.deleteMany({});

  // Delete project tasks
  await prisma.projectTask.deleteMany({});

  // Delete reviews
  await prisma.review.deleteMany({});

  // Delete internal reviews
  await prisma.internalFreelancerReview.deleteMany({});

  // Delete admin escalations
  await prisma.adminEscalation.deleteMany({});

  // Delete profile update requests
  await prisma.profileUpdateRequest.deleteMany({});

  // Delete disputes
  await prisma.dispute.deleteMany({});

  // Delete proposals
  await prisma.proposal.deleteMany({});

  // Delete completed projects
  await prisma.completedProject.deleteMany({});

  // Delete projects
  await prisma.project.deleteMany({});

  // Delete payments
  await prisma.payment.deleteMany({});

  // Delete chat messages
  await prisma.chatMessage.deleteMany({});

  // Delete chat conversations
  await prisma.chatConversation.deleteMany({});

  // Delete notifications
  await prisma.notification.deleteMany({});

  // Delete marketplace entries
  await prisma.marketplace.deleteMany({});

  // Delete freelancer projects
  await prisma.freelancerProject.deleteMany({});

  // Delete freelancer skills
  await prisma.freelancerSkill.deleteMany({});

  // Delete engagement sessions
  await prisma.engagementAnswerSession.deleteMany({});

  // Delete points ledger
  await prisma.pointsLedger.deleteMany({});

  // Delete engagement badges
  await prisma.engagementUserBadge.deleteMany({});

  // Delete engagement process reports
  await prisma.engagementProcessReport.deleteMany({});

  // Delete engagement personalized questions
  await prisma.engagementPersonalizedQuestion.deleteMany({});

  // Delete engagement profiles
  await prisma.engagementProfile.deleteMany({});

  // Delete freelancer profiles
  await prisma.freelancerProfile.deleteMany({});

  // Delete client profiles
  await prisma.clientProfile.deleteMany({});

  console.log("Deleting users...");
  const deleteResult = await prisma.user.deleteMany({
    where: {
      id: {
        in: targetIds
      }
    }
  });

  console.log(`Deleted ${deleteResult.count} user accounts successfully.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
