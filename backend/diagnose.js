
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load .env
dotenv.config();

console.log("Checking Environment...");
const dbUrl = process.env.DATABASE_URL || "NOT SET";
console.log(`DATABASE_URL starts with: ${dbUrl.substring(0, 15)}...`);

const openrouterKey = process.env.OPENROUTER_API_KEY;
if (!openrouterKey) {
    console.error("ERROR: OPENROUTER_API_KEY is NOT SET");
} else {
    console.log(`SUCCESS: OPENROUTER_API_KEY is set (length: ${openrouterKey.length})`);
}

const prisma = new PrismaClient();

async function main() {
    try {
        await prisma.$connect();
        console.log("SUCCESS: Database connection established.");
    } catch (error) {
        console.error("ERROR: Database connection failed.");
    } finally {
        await prisma.$disconnect();
    }
}

main();
