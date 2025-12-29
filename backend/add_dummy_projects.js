
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = 'wetivi1284@mekuron.com';
  
  const dummyProjects = [
    {
      title: "Google",
      link: "https://google.com",
      image: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png"
    },
    {
      title: "GitHub",
      link: "https://github.com",
      image: "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
    }
  ];

  console.log(`Adding dummy projects to user: ${email}`);
  
  const user = await prisma.user.update({
    where: { email },
    data: { 
        portfolioProjects: dummyProjects 
    }
  });

  console.log('User updated. PortfolioProjects:', JSON.stringify(user.portfolioProjects));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
