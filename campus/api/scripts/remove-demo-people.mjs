#!/usr/bin/env node
/**
 * Before launch: remove the seeded demo PEOPLE (fake students, mentors, staff) from the campus schema, keeping the
 * catalogue (categories, skills, courses, lessons, rubrics, assessments) and settings. Their enrolments, attempts,
 * badges, orders, offers, tickets, posts etc. go with them (onDelete: Cascade); courses they taught keep running
 * without a mentor (SetNull). Real people (any profile linked to a Catalance account) are never touched.
 *
 *   npm run demo:remove-people          # dry run: counts only
 *   npm run demo:remove-people -- --yes # delete
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
// Demo people: not linked to Catalance and on the demo email domain (see web/src/mocks/data/core.js).
const DEMO = { catalanceUserId: null, email: { endsWith: "campus.dev" } };

const people = await prisma.user.count({ where: DEMO });
const real = await prisma.user.count({ where: { NOT: { catalanceUserId: null } } });
const demoAudit = await prisma.auditLog.count({ where: { actor: { is: DEMO } } });
console.log(`Demo people: ${people} (their data is removed with them). Real Catalance-linked profiles kept: ${real}.`);

if (!process.argv.includes("--yes")) {
  console.log('Dry run. Re-run with "-- --yes" to delete.');
} else {
  // Audit rows only SetNull their actor; drop the seeded ones so the log starts with real activity.
  await prisma.auditLog.deleteMany({ where: { actor: { is: DEMO } } });
  const { count } = await prisma.user.deleteMany({ where: DEMO });
  console.log(`Deleted ${count} demo people and ${demoAudit} demo audit rows.`);
}
await prisma.$disconnect();
