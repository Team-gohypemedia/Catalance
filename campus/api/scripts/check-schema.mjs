#!/usr/bin/env node
/**
 * Safety guard: Campus shares the main Catalance Postgres database, isolated in the "campus" schema.
 * Fails (exit 1) unless:
 *   - the datasource declares exactly schemas = ["campus"]
 *   - every model and every enum has @@schema("campus")
 *   - nothing mentions the "public" schema
 * Runs automatically before prisma:push, prisma:migrate and seed (see package.json).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(here, "../prisma/schema.prisma");
const src = fs.readFileSync(schemaPath, "utf8");
// strip // comments so commented-out text can't satisfy or trip the checks
const code = src.replace(/\/\/.*$/gm, "");

const problems = [];

const datasource = code.match(/datasource\s+\w+\s*\{([\s\S]*?)\}/);
if (!datasource) problems.push("no datasource block found");
else {
  const schemas = datasource[1].match(/schemas\s*=\s*\[([^\]]*)\]/);
  const list = schemas ? schemas[1].split(",").map((s) => s.trim().replace(/^"|"$/g, "")).filter(Boolean) : [];
  if (list.length !== 1 || list[0] !== "campus") {
    problems.push(`datasource must declare schemas = ["campus"] (found: ${schemas ? `[${list.join(", ")}]` : "none"})`);
  }
}

const blocks = [...code.matchAll(/^\s*(model|enum)\s+(\w+)\s*\{([\s\S]*?)^\s*\}/gm)];
if (!blocks.length) problems.push("no models or enums found");
for (const [, kind, name, body] of blocks) {
  const tags = [...body.matchAll(/@@schema\(\s*"([^"]*)"\s*\)/g)].map((m) => m[1]);
  if (tags.length !== 1 || tags[0] !== "campus") {
    problems.push(`${kind} ${name}: needs exactly @@schema("campus")${tags.length ? ` (found: ${tags.join(", ")})` : ""}`);
  }
}

if (/"public"/.test(code)) problems.push('schema.prisma references "public"; Campus must never touch the main app schema');

if (problems.length) {
  console.error(`[check-schema] ${path.relative(process.cwd(), schemaPath)} is not safely isolated:`);
  for (const p of problems) console.error(`  - ${p}`);
  console.error('Refusing to continue: every model and enum must live in the "campus" schema.');
  process.exit(1);
}
console.log(`[check-schema] ok: ${blocks.length} models/enums, all in schema "campus"`);
