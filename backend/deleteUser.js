import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { fullName: { contains: 'assuredrewards' } },
        { freelancerProfile: { username: 'gbvgfg' } }
      ]
    }
  });

  if (user) {
    await prisma.user.delete({
      where: { id: user.id }
    });
    console.log('Deleted user:', user.email);
  } else {
    console.log('User not found');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
