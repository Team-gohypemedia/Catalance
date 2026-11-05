#!/usr/bin/env node
/**
 * `npm run dev:all` — start Catalance + Campus together in one terminal:
 *   backend (5000) · catalance web (5173) · campus api (5100) · campus web (5180)
 * Each line is prefixed with its app. Ctrl+C stops all four; if one crashes, the others keep running.
 * Start only some: `npm run dev:all -- backend web` (names: backend, web, campus-api, campus-web).
 */
import { execFileSync, execSync, spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const APPS = [
  { name: "backend", port: 5000, dir: "backend", color: 35, url: "http://localhost:5000" },
  { name: "web", port: 5173, dir: ".", color: 36, url: "http://localhost:5173" },
  { name: "campus-api", port: 5100, dir: "campus/api", color: 33, url: "http://localhost:5100/api/health" },
  { name: "campus-web", port: 5180, dir: "campus/web", color: 32, url: "http://localhost:5180" },
];

const wanted = process.argv.slice(2);
const apps = wanted.length ? APPS.filter((a) => wanted.includes(a.name)) : APPS;
if (!apps.length) {
  console.error(`Unknown app. Use any of: ${APPS.map((a) => a.name).join(", ")}`);
  process.exit(1);
}

/** Is something already answering on this port (e.g. an earlier dev:all left running in another terminal)? */
const portBusy = (port) =>
  new Promise((resolve) => {
    const socket = net.connect({ port, host: "localhost" });
    socket.setTimeout(800);
    socket.once("connect", () => (socket.destroy(), resolve(true)));
    socket.once("timeout", () => (socket.destroy(), resolve(false)));
    socket.once("error", () => resolve(false));
  });

/** "node … vite.js (pid 1234)" for the process listening on a port, when the OS can tell us. */
function whoHolds(port) {
  try {
    if (process.platform !== "win32") return execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN | tail -n +2 | head -1`, { encoding: "utf8" }).trim();
    const ps = `$p=(Get-NetTCPConnection -State Listen -LocalPort ${port} -EA 0 | Select -First 1).OwningProcess; if($p){'pid ' + $p + ' :: ' + (Get-CimInstance Win32_Process -Filter ('ProcessId=' + $p)).CommandLine}`;
    return execFileSync("powershell", ["-NoProfile", "-Command", ps], { encoding: "utf8" }).trim().slice(0, 160);
  } catch {
    return "";
  }
}

const busy = [];
for (const app of apps) if (await portBusy(app.port)) busy.push(app);
if (busy.length) {
  for (const app of busy) {
    console.log(`\x1b[31mPort ${app.port} is already in use, so "${app.name}" is skipped.\x1b[0m ${whoHolds(app.port) || `(see who: ${process.platform === "win32" ? `netstat -ano | findstr :${app.port}` : `lsof -i :${app.port}`})`}`);
  }
  const stop = process.platform === "win32" ? "taskkill /PID <pid> /T /F" : "kill <pid>";
  console.log(`Usually an earlier dev:all is still running in another terminal: press Ctrl+C there, or stop it with  ${stop}\n`);
}
const toStart = apps.filter((a) => !busy.includes(a));
if (!toStart.length) process.exit(1);

const width = Math.max(...apps.map((a) => a.name.length));
const tag = (a) => `\x1b[${a.color}m${a.name.padEnd(width)} |\x1b[0m `;

const children = toStart.map((app) => {
  const child = spawn("npm", ["run", "dev"], {
    cwd: path.join(root, app.dir),
    shell: true, // npm is npm.cmd on Windows
    env: { ...process.env, FORCE_COLOR: "1" },
  });
  for (const stream of [child.stdout, child.stderr]) {
    let buffered = "";
    stream.on("data", (chunk) => {
      buffered += chunk;
      const lines = buffered.split(/\r?\n/);
      buffered = lines.pop();
      for (const line of lines) process.stdout.write(tag(app) + line + "\n");
    });
  }
  child.on("exit", (code) => process.stdout.write(tag(app) + `stopped${code ? ` (exit ${code})` : ""}\n`));
  return child;
});

console.log(apps.map((a) => `${tag(a)}${a.url}`).join("\n") + "\n");

let stopping = false;
const stopAll = () => {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode !== null) continue;
    // kill the whole tree (npm → node/vite); plain kill() leaves the server running on Windows
    if (process.platform === "win32") spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    else child.kill("SIGINT");
  }
  setTimeout(() => process.exit(0), 1500);
};
process.on("SIGINT", stopAll);
process.on("SIGTERM", stopAll);
