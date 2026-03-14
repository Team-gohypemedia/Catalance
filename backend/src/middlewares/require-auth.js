import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

export const requireAuth = (req, _res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  if (!token) {
    return next(new AppError("Authentication required", 401));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    const resolvedUserId = payload?.sub || payload?.id || null;
    req.user = {
      ...payload,
      id: resolvedUserId,
      sub: resolvedUserId
    };
    return next();
  } catch (error) {
    return next(new AppError("Invalid or expired token", 401));
  }
};
