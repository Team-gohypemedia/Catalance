import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const prisma = new PrismaClient();
const baseUrl = 'http://localhost:5000/api';

async function main() {
    try {
        console.log("Preparing database for scoped test...");

        // Ensure Admin exists
        const admin = await prisma.user.upsert({
            where: { email: 'admin_test@example.com' },
            update: { role: 'ADMIN', status: 'ACTIVE' },
            create: { email: 'admin_test@example.com', fullName: 'Test Admin', passwordHash: 'hash', role: 'ADMIN', status: 'ACTIVE' }
        });

        // Ensure PMs exist
        const pm1 = await prisma.user.upsert({
            where: { email: 'pm1@test.com' },
            update: { role: 'PROJECT_MANAGER', status: 'ACTIVE' },
            create: { email: 'pm1@test.com', fullName: 'PM One', passwordHash: 'hash', role: 'PROJECT_MANAGER', status: 'ACTIVE' }
        });
        const pm2 = await prisma.user.upsert({
            where: { email: 'pm2@test.com' },
            update: { role: 'PROJECT_MANAGER', status: 'ACTIVE' },
            create: { email: 'pm2@test.com', fullName: 'PM Two', passwordHash: 'hash', role: 'PROJECT_MANAGER', status: 'ACTIVE' }
        });

        // Clear existing manager assignments to isolate test
        await prisma.project.updateMany({ data: { managerId: null } });

        // Grab first two available projects
        const projects = await prisma.project.findMany({ take: 2 });
        if (projects.length >= 2) {
            // Assign Project 1 to PM1
            await prisma.project.update({
                where: { id: projects[0].id },
                data: { managerId: pm1.id }
            });
            // Assign Project 2 to PM2
            await prisma.project.update({
                where: { id: projects[1].id },
                data: { managerId: pm2.id }
            });
            console.log(`Assigned Project ${projects[0].id} to PM1`);
            console.log(`Assigned Project ${projects[1].id} to PM2`);
        } else {
            console.log("Not enough projects to test assignment.");
            return;
        }

        const subjects = [pm1, pm2, admin];
        const results = [];

        console.log(`\n--- Running Scoped Verification ---`);

        for (const user of subjects) {
            const resultEntry = { email: user.email, role: user.role, tests: {} };

            const token = jwt.sign(
                { sub: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET || "19765c0d616976b7d984b55c3e97b4ec76d6dff5ebcf3dda7f7674447f63a4aee0d63560719a5ba1df1b72be35c93f1f2eb92a0ee93b7a7eb386c72c316d50cb",
                { expiresIn: "7d" }
            );

            const headers = { 'Authorization': `Bearer ${token}` };

            // 1. Projects
            try {
                const projRes = await fetch(`${baseUrl}/projects`, { headers });
                const projData = await projRes.json();
                resultEntry.tests.projects = { count: projData.data?.length, sampleIds: projData.data?.map(p => p.id) || [] };
            } catch (e) { resultEntry.tests.projects = { error: e.message }; }

            // 2. Chat Conversations
            try {
                const chatRes = await fetch(`${baseUrl}/chat/conversations`, { headers });
                const chatData = await chatRes.json();
                resultEntry.tests.chats = { count: chatData.data?.length };
            } catch (e) { resultEntry.tests.chats = { error: e.message }; }

            results.push(resultEntry);
        }

        fs.writeFileSync('pm_final_verify.json', JSON.stringify(results, null, 2));
        console.log("Test complete. Results in pm_final_verify.json");

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
