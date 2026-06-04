import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking freelancer profile counts by service...");
  
  const users = await prisma.user.findMany({
    where: {
      role: "FREELANCER"
    },
    include: {
      freelancerProfile: true
    }
  });
  
  console.log(`Total freelancers: ${users.length}`);
  
  // Count by services
  const counts = {};
  for (const user of users) {
    const services = user.freelancerProfile?.services || [];
    console.log(`Freelancer ${user.fullName} (${user.email}) has services:`, services);
    for (const service of services) {
      counts[service] = (counts[service] || 0) + 1;
    }
  }
  
  console.log("Service counts:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
