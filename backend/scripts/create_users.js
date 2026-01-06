import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const password = '123456';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('Creating users...');

    try {
        // Create Kshitij Sharma as Freelancer
        const kshitij = await prisma.user.upsert({
            where: { email: 'kshitij@example.com' },
            update: {
                passwordHash: hashedPassword,
            },
            create: {
                email: 'kshitij@example.com',
                fullName: 'Kshitij Sharma',
                passwordHash: hashedPassword,
                role: 'FREELANCER',
                bio: 'Full-stack developer with expertise in React and Node.js.',
                skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL']
            },
        });
        console.log('Created Freelancer:', kshitij.fullName, '-', kshitij.email);

        // Create Rishav Rawat as Client
        const rishav = await prisma.user.upsert({
            where: { email: 'rishav@example.com' },
            update: {
                passwordHash: hashedPassword,
            },
            create: {
                email: 'rishav@example.com',
                fullName: 'Rishav Rawat',
                passwordHash: hashedPassword,
                role: 'CLIENT',
                bio: 'Business owner looking for talented developers.',
                skills: []
            },
        });
        console.log('Created Client:', rishav.fullName, '-', rishav.email);

        console.log('\nUsers created successfully!');
        console.log('Password for both: 123456');
    } catch (e) {
        console.error('Error creating users:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();

