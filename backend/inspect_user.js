
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = 'wetivi1284@mekuron.com';
  
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    console.log('User not found!');
  } else {
    console.log('--- BIO RAW START ---');
    console.log(user.bio);
    console.log('--- BIO RAW END ---');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
