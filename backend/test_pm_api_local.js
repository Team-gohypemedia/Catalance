import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();
const baseUrl = 'http://localhost:5000/api';

async function main() {
    try {
        await prisma.user.upsert({
            where: { email: 'pm1@test.com' },
            update: { role: 'PROJECT_MANAGER', status: 'ACTIVE' },
            create: { email: 'pm1@test.com', fullName: 'PM One', passwordHash: 'hash', role: 'PROJECT_MANAGER', status: 'ACTIVE' }
        });
        await prisma.user.upsert({
            where: { email: 'pm2@test.com' },
            update: { role: 'PROJECT_MANAGER', status: 'ACTIVE' },
            create: { email: 'pm2@test.com', fullName: 'PM Two', passwordHash: 'hash', role: 'PROJECT_MANAGER', status: 'ACTIVE' }
        });

        const pms = await prisma.user.findMany({
            where: { role: 'PROJECT_MANAGER', email: { in: ['pm1@test.com', 'pm2@test.com'] } },
            take: 2
        });

        const results = [];

        for (const pm of pms) {
            const pmResult = { email: pm.email, id: pm.id, role: pm.role, tests: {} };

            const token = jwt.sign(
                { sub: pm.id, email: pm.email, role: pm.role },
                process.env.JWT_SECRET || "19765c0d616976b7d984b55c3e97b4ec76d6dff5ebcf3dda7f7674447f63a4aee0d63560719a5ba1df1b72be35c93f1f2eb92a0ee93b7a7eb386c72c316d50cb",
                { expiresIn: "7d" }
            );

            const headers = { 'Authorization': `Bearer ${token}` };

            // 1. Projects
            try {
                const projRes = await fetch(`${baseUrl}/projects`, { headers });
                const projData = await projRes.json();
                pmResult.tests.projects = { status: projRes.status, count: projData.data?.length, sampleIds: projData.data?.slice(0, 3).map(p => p.id) || [] };
            } catch (e) { pmResult.tests.projects = { error: e.message }; }

            // 2. Disputes
            try {
                const dispRes = await fetch(`${baseUrl}/disputes`, { headers });
                const dispData = await dispRes.json();
                pmResult.tests.disputes = { status: dispRes.status, count: dispData.data?.length, sampleIds: dispData.data?.slice(0, 3).map(p => p.id) || [] };
            } catch (e) { pmResult.tests.disputes = { error: e.message }; }

            // 3. Chat Conversations
            try {
                const chatRes = await fetch(`${baseUrl}/chat/conversations`, { headers });
                const chatData = await chatRes.json();
                pmResult.tests.chats = { status: chatRes.status, count: chatData.data?.length, sampleIds: chatData.data?.slice(0, 3).map(p => p.id) || [] };
            } catch (e) { pmResult.tests.chats = { error: e.message }; }

            results.push(pmResult);
        }

        fs.writeFileSync('pm_results.json', JSON.stringify(results, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
