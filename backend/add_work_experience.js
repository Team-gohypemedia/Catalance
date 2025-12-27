
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = 'wetivi1284@mekuron.com';
  
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  let bioObj = JSON.parse(user.bio || '{}');
  
  // Add a dummy work experience
  bioObj.workExperience = [
    {
      title: "Senior Developer · Google",
      period: "Jan 2020 – Present",
      description: "Working on cool stuff."
    }
  ];

  console.log(`Adding dummy work experience for user: ${email}`);
  
  await prisma.user.update({
    where: { email },
    data: { 
        bio: JSON.stringify(bioObj)
    }
  });

  console.log('User work experience updated.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
