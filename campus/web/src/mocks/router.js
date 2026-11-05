/**
 * Demo-mode request router. Each handlers/*.js file exports an object:
 *   { "GET /api/courses/:id": ({ params, query, body, user, db }) => data, ... }
 * Throw httpError(status, message) from ./utils for errors.
 */
import { db } from "./db";
import { ApiError } from "@/lib/api/client";
import { sleep } from "@/lib/utils";
import auth from "./handlers/auth";
import learning from "./handlers/learning";
import earn from "./handlers/earn";
import community from "./handlers/community";
import admin from "./handlers/admin";
import assessment from "./handlers/assessment";
import payments from "./handlers/payments";
import catalog from "./handlers/catalog";
import projects from "./handlers/projects";
import platform from "./handlers/platform";
import ops from "./handlers/ops";

const table = { ...auth, ...learning, ...earn, ...community, ...admin, ...assessment, ...payments, ...catalog, ...projects, ...platform, ...ops };

const routes = Object.entries(table).map(([key, handler]) => {
  const [method, pattern] = key.split(" ");
  const names = [];
  const regex = new RegExp(
    "^" +
      pattern.replace(/\/:([A-Za-z]+)/g, (_, name) => {
        names.push(name);
        return "/([^/]+)";
      }) +
      "$",
  );
  return { method, regex, names, handler, specificity: pattern.split("/:").length };
});
// static segments win over params (e.g. /api/me/portfolio before /api/me/:x)
routes.sort((a, b) => a.specificity - b.specificity);

export async function handleMock(method, fullPath, body, token) {
  await sleep(150 + Math.random() * 250);
  const url = new URL(fullPath, "http://campus.demo");
  const query = Object.fromEntries(url.searchParams);
  const userId = token?.startsWith("demo.") ? token.slice(5) : null;
  const user = userId ? db.findById("users", userId) : null;

  for (const route of routes) {
    if (route.method !== method) continue;
    const m = url.pathname.match(route.regex);
    if (!m) continue;
    const params = Object.fromEntries(route.names.map((n, i) => [n, decodeURIComponent(m[i + 1])]));
    try {
      const result = await route.handler({ params, query, body: body ?? {}, user, db });
      return result === undefined ? null : structuredClone(result);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      console.error(`[demo] ${method} ${url.pathname}`, err);
      throw new ApiError(err?.message || "Something went wrong", 500);
    }
  }
  throw new ApiError(`Demo route not found: ${method} ${url.pathname}`, 404);
}
