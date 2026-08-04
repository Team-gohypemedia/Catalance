import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/async-handler.js";

const clampInteger = (value, { min = 1, max = 100, fallback = min } = {}) => {
  const numericValue = Number.parseInt(value, 10);
  if (!Number.isFinite(numericValue)) return fallback;
  return Math.min(max, Math.max(min, numericValue));
};

const toNullableString = (value, maxLength = 1024) => {
  const normalized = String(value || "").trim();
  if (!normalized) return null;
  if (normalized.length <= maxLength) return normalized;
  return normalized.slice(0, maxLength);
};

const buildAiUsageWhere = (query = {}) => {
  const where = {};
  const days = clampInteger(query.days, { min: 1, max: 365, fallback: 30 });
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  where.createdAt = { gte: since };

  const visitorType = toNullableString(query.visitorType, 32);
  if (visitorType && visitorType !== "ALL") {
    where.visitorType = visitorType;
  }

  const pagePath = toNullableString(query.pagePath);
  if (pagePath) {
    where.pagePath = pagePath;
  }

  const featureKey = toNullableString(query.featureKey, 191);
  if (featureKey) {
    where.featureKey = featureKey;
  }

  const userId = toNullableString(query.userId, 191);
  if (userId) {
    where.userId = userId;
  }

  const projectId = toNullableString(query.projectId, 191);
  if (projectId) {
    where.projectId = projectId;
  }

  return { where, days, since };
};

const sortGroupedRows = (rows = []) =>
  [...rows].sort((left, right) => {
    const countDelta = Number(right?._count?._all || 0) - Number(left?._count?._all || 0);
    if (countDelta !== 0) return countDelta;
    return (
      new Date(right?._max?.createdAt || 0).getTime() -
      new Date(left?._max?.createdAt || 0).getTime()
    );
  });

export const getAiUsageSummary = asyncHandler(async (req, res) => {
  const { where, days, since } = buildAiUsageWhere(req.query);
  const limit = clampInteger(req.query.limit, { min: 3, max: 20, fallback: 5 });

  const [
    aggregate,
    authenticatedCount,
    guestCount,
    pageGroups,
    featureGroups,
    userGroups,
    guestGroups,
    recentUsage,
  ] = await Promise.all([
    prisma.aIUsage.aggregate({
      where,
      _count: { _all: true },
      _sum: {
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
        costInRupees: true,
      },
    }),
    prisma.aIUsage.count({
      where: {
        ...where,
        userId: { not: null },
      },
    }),
    prisma.aIUsage.count({
      where: {
        ...where,
        userId: null,
      },
    }),
    prisma.aIUsage.groupBy({
      by: ["pagePath"],
      where: {
        ...where,
        pagePath: { not: null },
      },
      _count: { _all: true },
      _sum: {
        totalTokens: true,
        costInRupees: true,
      },
      _max: {
        createdAt: true,
      },
    }),
    prisma.aIUsage.groupBy({
      by: ["featureKey"],
      where: {
        ...where,
        featureKey: { not: null },
      },
      _count: { _all: true },
      _sum: {
        totalTokens: true,
        costInRupees: true,
      },
      _max: {
        createdAt: true,
      },
    }),
    prisma.aIUsage.groupBy({
      by: ["userId"],
      where: {
        ...where,
        userId: { not: null },
      },
      _count: { _all: true },
      _sum: {
        totalTokens: true,
        costInRupees: true,
      },
      _max: {
        createdAt: true,
      },
    }),
    prisma.aIUsage.groupBy({
      by: ["guestSessionId"],
      where: {
        ...where,
        userId: null,
        guestSessionId: { not: null },
      },
      _count: { _all: true },
      _sum: {
        totalTokens: true,
        costInRupees: true,
      },
      _max: {
        createdAt: true,
      },
    }),
    prisma.aIUsage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        userId: true,
        visitorType: true,
        pagePath: true,
        featureKey: true,
        title: true,
        model: true,
        totalTokens: true,
        costInRupees: true,
        createdAt: true,
        guestSessionId: true,
        responseStatus: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    }),
  ]);

  const topUserGroups = sortGroupedRows(userGroups).slice(0, limit);
  const topUserIds = topUserGroups.map((group) => group.userId).filter(Boolean);
  const users = topUserIds.length
    ? await prisma.user.findMany({
        where: { id: { in: topUserIds } },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      })
    : [];
  const usersById = new Map(users.map((user) => [user.id, user]));

  res.json({
    data: {
      window: {
        days,
        since,
      },
      overview: {
        totalCalls: aggregate?._count?._all || 0,
        authenticatedCalls: authenticatedCount,
        guestCalls: guestCount,
        uniqueUsers: userGroups.length,
        uniqueGuestSessions: guestGroups.length,
        promptTokens: aggregate?._sum?.promptTokens || 0,
        completionTokens: aggregate?._sum?.completionTokens || 0,
        totalTokens: aggregate?._sum?.totalTokens || 0,
        totalCostInRupees: Number((aggregate?._sum?.costInRupees || 0).toFixed(4)),
      },
      topPages: sortGroupedRows(pageGroups).slice(0, limit).map((group) => ({
        pagePath: group.pagePath,
        calls: group?._count?._all || 0,
        totalTokens: group?._sum?.totalTokens || 0,
        totalCostInRupees: Number((group?._sum?.costInRupees || 0).toFixed(4)),
        lastUsedAt: group?._max?.createdAt || null,
      })),
      topFeatures: sortGroupedRows(featureGroups).slice(0, limit).map((group) => ({
        featureKey: group.featureKey,
        calls: group?._count?._all || 0,
        totalTokens: group?._sum?.totalTokens || 0,
        totalCostInRupees: Number((group?._sum?.costInRupees || 0).toFixed(4)),
        lastUsedAt: group?._max?.createdAt || null,
      })),
      topUsers: topUserGroups.map((group) => ({
        userId: group.userId,
        fullName: usersById.get(group.userId)?.fullName || "Unknown user",
        email: usersById.get(group.userId)?.email || "",
        role: usersById.get(group.userId)?.role || "",
        calls: group?._count?._all || 0,
        totalTokens: group?._sum?.totalTokens || 0,
        totalCostInRupees: Number((group?._sum?.costInRupees || 0).toFixed(4)),
        lastUsedAt: group?._max?.createdAt || null,
      })),
      topGuests: sortGroupedRows(guestGroups).slice(0, limit).map((group) => ({
        guestSessionId: group.guestSessionId,
        calls: group?._count?._all || 0,
        totalTokens: group?._sum?.totalTokens || 0,
        totalCostInRupees: Number((group?._sum?.costInRupees || 0).toFixed(4)),
        lastUsedAt: group?._max?.createdAt || null,
      })),
      recentUsage: recentUsage.map((entry) => ({
        ...entry,
        costInRupees: Number((entry.costInRupees || 0).toFixed(4)),
      })),
    },
  });
});

export const getAiUsageRecords = asyncHandler(async (req, res) => {
  const { where, days, since } = buildAiUsageWhere(req.query);
  const page = clampInteger(req.query.page, { min: 1, max: 5000, fallback: 1 });
  const limit = clampInteger(req.query.limit, { min: 10, max: 100, fallback: 25 });
  const skip = (page - 1) * limit;

  const [total, usage] = await Promise.all([
    prisma.aIUsage.count({ where }),
    prisma.aIUsage.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        visitorType: true,
        projectId: true,
        provider: true,
        model: true,
        title: true,
        featureKey: true,
        requestPath: true,
        pagePath: true,
        pageUrl: true,
        routeKey: true,
        guestSessionId: true,
        guestIdentifier: true,
        responseStatus: true,
        responseStatusCode: true,
        durationMs: true,
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
        costInRupees: true,
        metadata: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    }),
  ]);

  res.json({
    data: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      window: {
        days,
        since,
      },
      usage: usage.map((entry) => ({
        ...entry,
        costInRupees: Number((entry.costInRupees || 0).toFixed(4)),
      })),
    },
  });
});
