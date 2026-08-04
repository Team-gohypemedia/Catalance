import fs from "fs/promises";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");
const schemaPath = path.join(backendRoot, "prisma", "schema.prisma");
const prismaCliPath = path.join(
  backendRoot,
  "node_modules",
  "prisma",
  "build",
  "index.js",
);
const cacheDir = path.join(backendRoot, ".tmp");
const cachePath = path.join(cacheDir, "prisma-schema-state.json");

const readJsonFile = async (targetPath) => {
  try {
    const raw = await fs.readFile(targetPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const getSchemaState = async () => {
  const stats = await fs.stat(schemaPath);

  return {
    size: stats.size,
    mtimeMs: Math.round(stats.mtimeMs),
  };
};

const hasSchemaChanged = async () => {
  const [currentState, cachedState] = await Promise.all([
    getSchemaState(),
    readJsonFile(cachePath),
  ]);

  const isChanged =
    !cachedState ||
    cachedState.size !== currentState.size ||
    cachedState.mtimeMs !== currentState.mtimeMs;

  return { currentState, isChanged };
};

const runPrismaGenerate = async () =>
  new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [prismaCliPath, "generate", "--schema", "prisma/schema.prisma"],
      {
        cwd: backendRoot,
        stdio: "inherit",
        env: process.env,
      },
    );

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`prisma generate failed with exit code ${code}`));
    });
  });

const persistSchemaState = async (state) => {
  await fs.mkdir(cacheDir, { recursive: true });
  await fs.writeFile(cachePath, JSON.stringify(state, null, 2));
};

const ensureFreshPrismaClient = async () => {
  const { currentState, isChanged } = await hasSchemaChanged();

  if (isChanged) {
    console.log("[dev-with-prisma] Prisma schema changed. Regenerating client...");
    await runPrismaGenerate();
    await persistSchemaState(currentState);
    return;
  }

  console.log("[dev-with-prisma] Prisma client is up to date.");
};

await ensureFreshPrismaClient();
await import(pathToFileURL(path.join(backendRoot, "src", "index.js")).href);
