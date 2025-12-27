import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createPM() {
    // Hash the password
    const password = process.env.PM_PASSWORD || 'DefaultPass123!'; 
    const passwordHash = await bcrypt.hash(password, 10);

    const newPM = await prisma.user.create({
        data: {
            fullName: 'Project Manager',
            email: process.env.PM_EMAIL || 'pm@catalance.com',
            passwordHash: passwordHash,
            role: 'PROJECT_MANAGER'
        }
    });

    console.log('Created new Project Manager:');
    console.log(`  ID: ${newPM.id}`);
    console.log(`  Name: ${newPM.fullName}`);
    console.log(`  Email: ${newPM.email}`);
    console.log(`  Role: ${newPM.role}`);
    console.log(`  Password: ${password} (please change this!)`);

    await prisma.$disconnect();
}

createPM().catch(console.error);
