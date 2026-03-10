import { AppError } from "../utils/app-error.js";
import { prisma } from "../lib/prisma.js";

export const requirePm = async (req, res, next) => {
    try {
        const userId = req.user?.sub;
        if (!userId) {
            throw new AppError("Authentication required", 401);
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, status: true },
        });

        if (!user || user.status !== "ACTIVE" || (user.role !== "PROJECT_MANAGER" && user.role !== "ADMIN")) {
            throw new AppError("Access denied. Project Manager permissions required.", 403);
        }

        next();
    } catch (error) {
        next(error);
    }
};
