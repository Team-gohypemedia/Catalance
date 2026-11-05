import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export class AppError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.details = details;
  }
}

/** Shorthand: throw httpError(404, "Course not found.") */
export const httpError = (status, message, details) => new AppError(status, message, details);

const send = (res, status, message, details) =>
  res.status(status).json({ error: { message, ...(details ? { details } : {}) } });

export function notFound(req, res) {
  send(res, 404, `Route not found: ${req.method} ${req.path}`);
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) return send(res, err.status, err.message, err.details);

  if (err instanceof ZodError) {
    const issue = err.issues[0];
    const where = issue?.path?.join(".");
    const message = issue ? (where ? `${where}: ${issue.message}` : issue.message) : "Invalid request.";
    return send(res, 400, message, { issues: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })) });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = [].concat(err.meta?.target || []).join(", ");
      return send(res, 409, target ? `That ${target} is already taken.` : "That already exists.");
    }
    if (err.code === "P2025") return send(res, 404, "Not found.");
    if (err.code === "P2003") return send(res, 400, "A related record does not exist.");
  }
  if (err instanceof Prisma.PrismaClientInitializationError) {
    console.error("[campus-api] database unavailable:", err.message);
    return send(res, 503, "Campus database is not reachable right now.");
  }

  if (err?.type === "entity.parse.failed") return send(res, 400, "Request body is not valid JSON.");
  if (err?.type === "entity.too.large") return send(res, 413, "Request body is too large.");

  console.error("[campus-api]", req.method, req.originalUrl, err);
  const status = Number(err?.status || err?.statusCode) || 500;
  send(res, status, status >= 500 ? "Something went wrong on our side. Please try again." : err.message);
}
