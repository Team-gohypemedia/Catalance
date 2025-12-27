
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = 'wetivi1284@mekuron.com';
  
  // Reset bio to a clean slate but keep other info if possible, or just minimal valid structure
  // We'll keep phone/location since those might be real
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) return;

  let newBio = user.bio;
  try {
      const parsed = JSON.parse(user.bio || '{}');
      // Clear portfolio dummy data
      parsed.portfolio = {
          portfolioUrl: "",
          linkedinUrl: "",
          githubUrl: ""
      };
      newBio = JSON.stringify(parsed);
  } catch(e) {
      // If valid json fail, just reset
      newBio = JSON.stringify({ portfolio: {} });
  }

  console.log(`Clearing dummy portfolio for user: ${email}`);
  
  await prisma.user.update({
    where: { email },
    data: { 
        bio: newBio,
        portfolio: null,
        linkedin: null,
        github: null
    }
  });

  console.log('User portfolio cleared.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
