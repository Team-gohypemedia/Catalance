
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = 'wetivi1284@mekuron.com';
  
  const newBio = JSON.stringify({
    phone: "1234567890",
    location: "New Delhi",
    headline: "Full Stack Developer",
    available: true,
    workExperience: [],
    services: ["Web Development"],
    portfolio: {
      portfolioUrl: "https://example.com/portfolio",
      linkedinUrl: "https://linkedin.com/in/wetivi",
      githubUrl: "https://github.com/wetivi"
    }
  });

  console.log(`Updating user: ${email}`);
  
  const user = await prisma.user.update({
    where: { email },
    data: { bio: newBio }
  });

  console.log('User updated. New Bio length:', user.bio.length);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
