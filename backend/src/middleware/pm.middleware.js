import { AppError } from "../utils/app-error.js";
import { prisma } from "../lib/prisma.js";

export const requirePm = async (req, res, next) => {
    try {
        const userId = req.user?.id || req.user?.sub;
        if (!userId) {
            throw new AppError("Authentication required", 401);
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, roles: true, status: true },
        });

        const tokenRole = String(req.user?.role || "").toUpperCase();
        const primaryRole = String(user?.role || "").toUpperCase();
        const secondaryRoles = Array.isArray(user?.roles)
            ? user.roles.map((entry) => String(entry || "").toUpperCase()).filter(Boolean)
            : [];

        const effectiveRoles = new Set([tokenRole, primaryRole, ...secondaryRoles]);
        const hasPmAccess =
            effectiveRoles.has("PROJECT_MANAGER") || effectiveRoles.has("ADMIN");

        if (!user || user.status !== "ACTIVE" || !hasPmAccess) {
            throw new AppError("Access denied. Project Manager permissions required.", 403);
        }

        next();
    } catch (error) {
        next(error);
    }
};
