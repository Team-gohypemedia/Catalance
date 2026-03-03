import { authenticateUser } from "./src/modules/users/user.service.js";
import { prisma } from "./src/lib/prisma.js";

async function run() {
    try {
        const res = await authenticateUser({ email: "rishav@catalance.com", password: "password123", role: "PROJECT_MANAGER" });
        console.log("Success:", res);
    } catch (e) {
        console.error("Error:", e.message, e.statusCode);
    } finally {
        await prisma.$disconnect();
    }
}
run();
