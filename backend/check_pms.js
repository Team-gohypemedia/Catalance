import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const pms = await prisma.user.findMany({
        where: { role: 'PROJECT_MANAGER' },
        select: { id: true, email: true, fullName: true, status: true, isVerified: true }
    });
    console.log(JSON.stringify(pms, null, 2));
    await prisma.$disconnect();
}

main();
