import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

async function main() {
    await prisma.user.upsert({
        where: { email: 'client_test@example.com' },
        update: { role: 'CLIENT', status: 'ACTIVE' },
        create: { email: 'client_test@example.com', fullName: 'Test Client', passwordHash: 'hash', role: 'CLIENT', status: 'ACTIVE' }
    });
    console.log("Client created: client_test@example.com");
    await prisma.$disconnect();
}

main();
