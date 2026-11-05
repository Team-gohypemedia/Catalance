#!/usr/bin/env node
/**
 * Exports the frontend demo seeds (campus/web/src/mocks/data/*.js) to prisma/seed-data.json,
 * so the real database starts with exactly the same content as the in-browser demo.
 *
 *   node scripts/export-demo-seed.mjs
 *
 * Each seed module (same list and order as campus/web/src/mocks/db.js) is bundled with esbuild
 * (alias @ → campus/web/src, platform node), imported, and the default exports are merged
 * collection-by-collection (same as campus/web/src/mocks/db.js). A seed module that is missing
 * or fails to build/run is skipped with a warning, so the export still works while seeds evolve.
 * Seed dates are relative ("3 days ago"): re-run this right before seeding a fresh database.
 */
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.resolve(here, "..");
const webSrc = path.resolve(apiRoot, "../web/src");
const dataDir = path.join(webSrc, "mocks/data");
const outFile = path.join(apiRoot, "prisma/seed-data.json");
const tmpDir = path.join(apiRoot, ".tmp");

const SEED_FILES = ["core", "learning", "earn", "community", "admin", "assessment", "payments", "catalog", "projects", "platform", "ops"];
const EXTENSIONS = ["", ".js", ".jsx", ".mjs", ".ts", ".tsx", ".json", "/index.js", "/index.jsx", "/index.ts"];

const resolveFile = (base) => EXTENSIONS.map((ext) => base + ext).find((p) => fs.existsSync(p) && fs.statSync(p).isFile());

const stubbed = new Set();

const plugins = [
  {
    name: "campus-resolve",
    setup(b) {
      // "@/x/y" → campus/web/src/x/y(.js|.jsx|…)
      b.onResolve({ filter: /^@\// }, (args) => {
        const file = resolveFile(path.join(webSrc, args.path.slice(2)));
        if (file) return { path: file };
        stubbed.add(args.path);
        return { path: args.path, namespace: "campus-stub" };
      });
      // relative imports that don't exist yet (files still being written) → empty stub
      b.onResolve({ filter: /^\.\.?\// }, (args) => {
        if (resolveFile(path.resolve(args.resolveDir, args.path))) return undefined;
        stubbed.add(`${path.relative(webSrc, args.importer)} → ${args.path}`);
        return { path: args.path, namespace: "campus-stub" };
      });
      // CommonJS stub: default import is [], named imports are undefined
      b.onLoad({ filter: /.*/, namespace: "campus-stub" }, () => ({ contents: "module.exports = [];", loader: "js" }));
    },
  },
];

async function loadSeed(name) {
  const file = resolveFile(path.join(dataDir, name));
  if (!file) {
    console.warn(`[export-seed] ${name}: seed module not found, skipped`);
    return null;
  }
  const bundleFile = path.join(tmpDir, `seed-${name}-${Date.now()}.mjs`);
  try {
    await build({
      entryPoints: [file],
      bundle: true,
      platform: "node",
      format: "esm",
      target: "node20",
      outfile: bundleFile,
      plugins,
      loader: { ".js": "jsx", ".jsx": "jsx" },
      // the web app reads import.meta.env (Vite); give it an empty env so the bundle runs in node
      define: { "import.meta.env": JSON.stringify({ MODE: "seed", DEV: false, PROD: true, VITE_CAMPUS_API_URL: "" }) },
      logLevel: "silent",
    });
    const mod = await import(pathToFileURL(bundleFile).href);
    return mod.default || {};
  } catch (err) {
    console.warn(`[export-seed] ${name}: failed (${String(err?.message || err).split("\n")[0]}), skipped`);
    return null;
  } finally {
    fs.rmSync(bundleFile, { force: true });
  }
}

fs.mkdirSync(tmpDir, { recursive: true });
const merged = {};
const summary = [];
for (const name of SEED_FILES) {
  const seed = await loadSeed(name);
  if (!seed) continue;
  for (const [collection, docs] of Object.entries(seed)) {
    if (!Array.isArray(docs)) continue;
    merged[collection] = [...(merged[collection] || []), ...docs];
    summary.push(`  ${collection.padEnd(18)} +${String(docs.length).padStart(4)}  (${name})`);
  }
}
if (stubbed.size) console.warn(`[export-seed] stubbed unresolved imports:\n  ${[...stubbed].join("\n  ")}`);

const json = JSON.stringify({ exportedAt: new Date().toISOString(), collections: merged }, null, 2);
fs.writeFileSync(outFile, json);
console.log(`[export-seed] wrote ${path.relative(process.cwd(), outFile) || outFile} (${(json.length / 1024).toFixed(0)} KB)`);
console.log(summary.join("\n"));
