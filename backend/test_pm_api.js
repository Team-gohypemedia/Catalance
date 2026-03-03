import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { spawn } from 'child_process';
import path from 'path';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "19765c0d616976b7d984b55c3e97b4ec76d6dff5ebcf3dda7f7674447f63a4aee0d63560719a5ba1df1b72be35c93f1f2eb92a0ee93b7a7eb386c72c316d50cb";
const PORT = 5055;
const BASE_URL = `http://127.0.0.1:${PORT}/api`;

const generateToken = (userId, role) => {
    return jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: '1h' });
};

async function createTestUsers() {
    const nonce = Date.now();
    const admin = await prisma.user.create({ data: { email: `admin_${nonce}@test.com`, fullName: 'Admin', role: 'ADMIN', passwordHash: 'x' } });
    const pm1 = await prisma.user.create({ data: { email: `pm1_${nonce}@test.com`, fullName: 'PM 1', role: 'PROJECT_MANAGER', passwordHash: 'x' } });
    const pm2 = await prisma.user.create({ data: { email: `pm2_${nonce}@test.com`, fullName: 'PM 2', role: 'PROJECT_MANAGER', passwordHash: 'x' } });
    const client = await prisma.user.create({ data: { email: `client_${nonce}@test.com`, fullName: 'Client', role: 'CLIENT', passwordHash: 'x' } });
    const freelancer = await prisma.user.create({ data: { email: `freelance_${nonce}@test.com`, fullName: 'Freelancer', role: 'FREELANCER', passwordHash: 'x' } });

    return { admin, pm1, pm2, client, freelancer };
}

async function createTestProjects(client, freelancer, pm1, pm2) {
    const projA = await prisma.project.create({
        data: { title: "Project A assigned to PM 1 website", description: "A", budget: 1000, status: "IN_PROGRESS", ownerId: client.id, managerId: pm1.id, proposals: { create: { coverLetter: "A", amount: 1000, status: "ACCEPTED", freelancerId: freelancer.id } } }
    });

    const projB = await prisma.project.create({
        data: { title: "Project B assigned to PM 2", description: "B", budget: 1000, status: "IN_PROGRESS", ownerId: client.id, managerId: pm2.id, proposals: { create: { coverLetter: "B", amount: 1000, status: "ACCEPTED", freelancerId: freelancer.id } } }
    });

    return { projA, projB };
}

async function startServer() {
    return new Promise((resolve) => {
        const serverProcess = spawn('node', ['src/index.js'], {
            env: { ...process.env, PORT: PORT.toString(), ENABLE_CRON_JOBS: 'false' },
            stdio: 'pipe'
        });

        serverProcess.stdout.on('data', (data) => {
            if (data.toString().includes('ready on')) {
                resolve(serverProcess);
            }
        });

        serverProcess.stderr.on('data', (data) => {
            console.error(data.toString());
        });
    });
}

const expectStatus = async (res, expected, testName) => {
    if (res.status === expected) {
        console.log(`✅ PASS: ${testName} (Status ${res.status})`);
        return true;
    } else {
        // try to get text to show why it failed
        const text = await res.text();
        console.log(`❌ FAIL: ${testName} (Expected ${expected}, got ${res.status}). Body: ${text.substring(0, 100)}`);
        return false;
    }
}

async function runTests() {
    console.log("Setting up test data...");
    const users = await createTestUsers();
    const projects = await createTestProjects(users.client, users.freelancer, users.pm1, users.pm2);

    console.log("Starting backend server...");
    const serverProc = await startServer();
    console.log(`Server started on port ${PORT}`);

    const tokens = {
        admin: generateToken(users.admin.id, users.admin.role),
        pm1: generateToken(users.pm1.id, users.pm1.role),
        pm2: generateToken(users.pm2.id, users.pm2.role),
        client: generateToken(users.client.id, users.client.role),
    };

    const _fetch = async (path, opts, token) => {
        return fetch(`${BASE_URL}${path}`, {
            ...opts,
            headers: { ...opts?.headers, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
    };

    try {
        console.log("\n--- A) Authorization / Scope ---");
        let res = await _fetch(`/projects/${projects.projA.id}/tasks`, { method: 'GET' }, tokens.pm1);
        await expectStatus(res, 200, "PM_1 calling endpoints for Project A");

        res = await _fetch(`/projects/${projects.projB.id}/tasks`, { method: 'GET' }, tokens.pm1);
        await expectStatus(res, 403, "PM_1 calling endpoints for Project B");

        res = await _fetch(`/projects/${projects.projA.id}/tasks`, { method: 'GET' }, tokens.client);
        await expectStatus(res, 403, "Client calling PM endpoints for Project A");

        res = await _fetch(`/projects/${projects.projB.id}/tasks`, { method: 'GET' }, tokens.admin);
        await expectStatus(res, 200, "Admin calling Project B");

        console.log("\n--- B) Kanban Tasks ---");
        res = await _fetch(`/projects/${projects.projA.id}/tasks`, { method: 'GET' }, tokens.pm1);
        await expectStatus(res, 200, "GET /api/projects/:id/tasks");

        res = await _fetch(`/projects/${projects.projA.id}/tasks`, { method: 'POST', body: JSON.stringify({ title: "Setup Repo", deadline: "2026-12-31T00:00:00.000Z", status: "TO_DO" }) }, tokens.pm1);
        await expectStatus(res, 200, "POST /api/projects/:id/tasks create 1 task with deadline");
        const task = (await res.json()).data;

        res = await _fetch(`/projects/${projects.projA.id}/tasks/${task.id}`, { method: 'PATCH', body: JSON.stringify({ status: "IN_PROGRESS" }) }, tokens.pm1);
        await expectStatus(res, 200, "PATCH /api/projects/:id/tasks/:taskId move task status");

        res = await _fetch(`/projects/${projects.projA.id}/tasks`, { method: 'GET' }, tokens.pm1);
        const tasksData = (await res.json()).data;
        const dbTask = tasksData.find(t => t.id === task.id);
        if (dbTask && dbTask.status === "IN_PROGRESS") {
            console.log(`✅ PASS: GET confirms task persists with status IN_PROGRESS. Status: ${dbTask.status}, Deadline: ${dbTask.deadline}`);
        } else {
            console.log(`❌ FAIL: GET did not confirm updated task`);
        }

        res = await _fetch(`/projects/${projects.projA.id}/tasks/generate`, { method: 'POST' }, tokens.pm1);
        await expectStatus(res, 200, "POST /api/projects/:id/tasks/generate");
        const generated = (await res.json()).data;
        console.log(`Generated ${generated.length} suggestions.`);

        for (let i = 0; i < Math.min(2, generated.length); i++) {
            await _fetch(`/projects/${projects.projA.id}/tasks`, { method: 'POST', body: JSON.stringify(generated[i]) }, tokens.pm1);
        }
        res = await _fetch(`/projects/${projects.projA.id}/tasks`, { method: 'GET' }, tokens.pm1);
        const currTasks = (await res.json()).data;
        if (currTasks.length >= 3) {
            console.log(`✅ PASS: Added generated tasks appear via GET`);
        } else {
            console.log(`❌ FAIL: Added generated tasks didn't appear`);
        }

        console.log("\n--- C) Escrow Release Idempotency ---");
        res = await _fetch(`/projects/${projects.projA.id}/escrow/release`, { method: 'POST' }, tokens.pm1);
        await expectStatus(res, 200, "Escrow release First call");
        const pay1Resp = await res.json();
        const pay1 = pay1Resp.data;
        console.log(`paymentId returned on first call: ${pay1.id}, status: ${pay1.status}, projectId: ${pay1.projectId}`);

        res = await _fetch(`/projects/${projects.projA.id}/escrow/release`, { method: 'POST' }, tokens.pm1);
        await expectStatus(res, 200, "Escrow release Second call");
        const pay2Resp = await res.json();
        const pay2 = pay2Resp.data;
        console.log(`paymentId returned on second call: ${pay2.id}, status: ${pay2.status}, projectId: ${pay2.projectId}`);

        if (pay1.id === pay2.id) {
            console.log(`✅ PASS: Second call did not create a duplicate`);
        } else {
            console.log(`❌ FAIL: Second call created a duplicate payment!`);
        }

        console.log("\n--- D) Reassignment Flow ---");
        res = await _fetch(`/projects/${projects.projA.id}/pause`, { method: 'POST' }, tokens.pm1);
        await expectStatus(res, 200, "POST /api/projects/:id/pause");
        const pausedProj = await prisma.project.findUnique({ where: { id: projects.projA.id } });
        if (pausedProj.status === "PAUSED") console.log(`✅ PASS: project status becomes PAUSED`);
        else console.log(`❌ FAIL: project status is ${pausedProj.status}`);

        res = await _fetch(`/projects/${projects.projA.id}/remove-freelancer`, { method: 'POST' }, tokens.pm1);
        await expectStatus(res, 200, "POST /api/projects/:id/remove-freelancer");
        const proposals = await prisma.proposal.findMany({ where: { projectId: projects.projA.id } });
        if (proposals[0].status === "REPLACED") console.log(`✅ PASS: Confirm accepted proposal becomes REPLACED`);
        else console.log(`❌ FAIL: Proposal status is ${proposals[0].status}`);

        const tasksRemaining = await prisma.projectTask.count({ where: { projectId: projects.projA.id } });
        if (tasksRemaining > 0) console.log(`✅ PASS: Confirm project still exists and tasks still exist. Found ${tasksRemaining} tasks.`);

        res = await _fetch(`/projects/${projects.projA.id}/reassign-freelancer`, { method: 'POST', body: JSON.stringify({ newFreelancerEmail: 'new@guy.com' }) }, tokens.pm1);
        await expectStatus(res, 200, "POST /api/projects/:id/reassign-freelancer");
        const msg = (await res.json()).message;
        console.log(`Response message: ${msg}`);

    } catch (e) {
        console.error("Test execution error:", e);
    } finally {
        serverProc.kill();
        console.log("Done.");
        process.exit(0);
    }
}

runTests();
