import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Searching for users with name containing 'Saniya' or 'Sehgal'...");
  const users = await prisma.user.findMany();
  
  let found = false;
  
  console.log("Checking all users for Saniya Sehgal in profileDetails or fields...");
  users.forEach(u => {
    const details = u.profileDetails || {};
    const identity = details.identity || {};
    const fullName = String(details.fullName || identity.fullName || u.fullName || "").trim();
    const email = String(u.email || "").trim();
    
    if (
      fullName.toLowerCase().includes("saniya") || 
      fullName.toLowerCase().includes("sehgal") ||
      email.toLowerCase().includes("saniya") ||
      email.toLowerCase().includes("sehgal")
    ) {
      console.log(`[USER] Match found: ID=${u.id}, Email=${u.email}, Role=${u.role}, FullName=${fullName}`);
      found = true;
    }
  });

  console.log("Checking Freelancer Profiles...");
  const freelancerProfiles = await prisma.freelancerProfile.findMany({
    include: { user: true }
  });
  
  freelancerProfiles.forEach(p => {
    const details = p.profileDetails || {};
    const identity = details.identity || {};
    const fullName = String(details.fullName || identity.fullName || "").trim();
    
    if (fullName.toLowerCase().includes("saniya") || fullName.toLowerCase().includes("sehgal")) {
      console.log(`[FREELANCER_PROFILE] Match found: ProfileID=${p.id}, UserID=${p.userId}, FullName=${fullName}, Email=${p.user?.email}`);
      found = true;
    }
  });

  if (!found) {
    console.log("No users or freelancer profiles found matching 'Saniya' or 'Sehgal'.");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
