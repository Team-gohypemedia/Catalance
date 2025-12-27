
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = 'wetivi1284@mekuron.com';
  
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) return;

  let newBio = user.bio;
  try {
      const parsed = JSON.parse(user.bio || '{}');
      // Clear workExperience
      parsed.workExperience = [];
      // Ensure portfolio is clean
      parsed.portfolio = {
          portfolioUrl: "",
          linkedinUrl: "",
          githubUrl: ""
      };
      newBio = JSON.stringify(parsed);
  } catch(e) {
      newBio = JSON.stringify({ workExperience: [], portfolio: {} });
  }

  console.log(`Removing all dummy data for user: ${email}`);
  
  await prisma.user.update({
    where: { email },
    data: { 
        bio: newBio,
        portfolioProjects: [], // Clear portfolio projects
        portfolio: null,
        linkedin: null,
        github: null
    }
  });

  console.log('All dummy data removed.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
