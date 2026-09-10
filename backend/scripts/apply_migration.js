import fs from "fs";
import path from "path";
import fileDir from "url";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

async function main() {
  const dbUrl = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL is not defined in environment.");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  const migrationPath = path.join(
    process.cwd(),
    "prisma",
    "migrations",
    "20260909180000_add_payout_requests_and_payment_details",
    "migration.sql"
  );

  console.log("Reading migration SQL from:", migrationPath);
  const sql = fs.readFileSync(migrationPath, "utf-8");

  console.log("Applying SQL migration to database...");
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log("SUCCESS: Database schema updated! PayoutRequest table and paymentDetails column created.");
  } catch (err) {
    console.error("Error executing migration SQL:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
