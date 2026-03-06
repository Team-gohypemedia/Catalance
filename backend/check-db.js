import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const id = 'cmmadho9h002w151v9obcl28q';
    const mp = await prisma.marketplace.findUnique({ where: { id } });
    const fp = await prisma.freelancerProject.findUnique({ where: { id } });

    console.log('Marketplace:', mp ? 'Found' : 'Not Found');
    console.log('FreelancerProject:', fp ? 'Found' : 'Not Found');
}
main().catch(console.error).finally(() => prisma.$disconnect());
