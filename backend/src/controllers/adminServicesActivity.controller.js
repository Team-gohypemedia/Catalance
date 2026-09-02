import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";

/**
 * Helper to extract client name, phone number, and user ID from session answers or User model
 */
const resolveClientIdentity = (session, userMap = new Map()) => {
  const answers = session?.answers || {};
  const bySlug = answers?.bySlug || {};

  const userId = answers?.userId || session?.userId || null;
  const userObj = userId ? userMap.get(userId) : null;

  const name =
    userObj?.fullName ||
    answers?.clientName ||
    answers?.name ||
    bySlug?.name ||
    bySlug?.client_name ||
    bySlug?.full_name ||
    "Guest Client";

  const phone =
    userObj?.phoneNumber ||
    answers?.clientPhone ||
    answers?.phone ||
    bySlug?.phone ||
    bySlug?.phone_number ||
    "N/A";

  const email = userObj?.email || answers?.clientEmail || bySlug?.email || null;

  return { userId, name, phone, email, isRegisteredUser: Boolean(userObj) };
};

/**
 * Format service ID into human-readable label
 */
const formatServiceLabel = (serviceId = "") => {
  const normalized = String(serviceId || "").trim();
  if (!normalized) return "General Service";
  return normalized
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * Determine session stage & status
 */
const resolveSessionStatus = (session) => {
  const answers = session?.answers || {};
  const currentStep = Number(session?.currentStep || 0);

  const hasProposal = Boolean(
    answers?.hasProposal ||
    answers?.generatedProposal ||
    answers?.proposal ||
    answers?.bySlug?.generated_proposal
  );

  let status = "IN_PROGRESS";
  if (hasProposal) {
    status = "PROPOSAL_GENERATED";
  } else if (currentStep > 0 && currentStep < 15) {
    // Drop-off heuristic: if last updated > 10 minutes ago and no proposal generated
    const lastActive = new Date(session.updatedAt).getTime();
    const isInactive = Date.now() - lastActive > 10 * 60 * 1000;
    if (isInactive) {
      status = "DROPPED_OFF";
    }
  }

  return { status, hasProposal };
};

/**
 * GET /api/admin/services-activity
 * Returns aggregate metrics and paginated session list
 */
export const getServicesActivity = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || "20", 10)));
  const search = String(req.query.search || "").trim();
  const filterServiceId = String(req.query.serviceId || "").trim();
  const filterStatus = String(req.query.status || "ALL").trim().toUpperCase();

  // Fetch all sessions to perform enriched filtering & metric calculations
  const rawSessions = await prisma.aiGuestSession.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        select: {
          id: true,
          role: true,
          createdAt: true,
        },
      },
    },
  });

  // Collect user IDs for batch user lookup
  const userIds = new Set();
  for (const session of rawSessions) {
    const answers = session?.answers || {};
    const uid = answers?.userId || session?.userId;
    if (uid) userIds.add(uid);
  }

  const users = userIds.size > 0
    ? await prisma.user.findMany({
        where: { id: { in: Array.from(userIds) } },
        select: { id: true, fullName: true, phoneNumber: true, email: true },
      })
    : [];

  const userMap = new Map(users.map((u) => [u.id, u]));

  // Enrich session records
  const enrichedSessions = rawSessions.map((session) => {
    const client = resolveClientIdentity(session, userMap);
    const serviceLabel = formatServiceLabel(session.serviceId);
    const { status, hasProposal } = resolveSessionStatus(session);
    const messageCount = session.messages?.length || 0;

    const answers = session.answers || {};
    const dropOffQuestion =
      answers.currentQuestionText ||
      `Step ${session.currentStep + 1}`;

    return {
      id: session.id,
      serviceId: session.serviceId,
      serviceLabel,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      currentStep: session.currentStep,
      messageCount,
      client,
      status,
      hasProposal,
      dropOffQuestion,
      answersSummary: answers.bySlug || {},
    };
  });

  // Apply Search & Filters
  let filtered = enrichedSessions;

  if (search) {
    const lowerSearch = search.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.id.toLowerCase().includes(lowerSearch) ||
        item.client.name.toLowerCase().includes(lowerSearch) ||
        item.client.phone.toLowerCase().includes(lowerSearch) ||
        item.serviceLabel.toLowerCase().includes(lowerSearch)
    );
  }

  if (filterServiceId && filterServiceId !== "ALL") {
    filtered = filtered.filter(
      (item) => item.serviceId.toLowerCase() === filterServiceId.toLowerCase()
    );
  }

  if (filterStatus && filterStatus !== "ALL") {
    filtered = filtered.filter((item) => item.status === filterStatus);
  }

  // Calculate Metrics
  const totalSessions = enrichedSessions.length;
  const totalProposals = enrichedSessions.filter((s) => s.hasProposal).length;
  const totalDropOffs = enrichedSessions.filter((s) => s.status === "DROPPED_OFF").length;
  const totalInProgress = enrichedSessions.filter((s) => s.status === "IN_PROGRESS").length;

  // Unique active service counts
  const serviceStatsMap = new Map();
  for (const session of enrichedSessions) {
    const label = session.serviceLabel;
    serviceStatsMap.set(label, (serviceStatsMap.get(label) || 0) + 1);
  }

  const topServices = Array.from(serviceStatsMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Pagination
  const totalRecords = filtered.length;
  const totalPages = Math.ceil(totalRecords / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedItems = filtered.slice(startIndex, startIndex + limit);

  return res.json({
    success: true,
    data: {
      metrics: {
        totalSessions,
        totalProposals,
        totalDropOffs,
        totalInProgress,
        topServices,
      },
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages,
      },
      sessions: paginatedItems,
    },
  });
});

/**
 * GET /api/admin/services-activity/:sessionId
 * Returns full details & conversation transcript for a single chat session
 */
export const getServicesActivitySessionDetail = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const session = await prisma.aiGuestSession.findUnique({
    where: { id: sessionId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!session) {
    throw new AppError("Services chat session not found", 404);
  }

  const answers = session.answers || {};
  const userId = answers?.userId || session?.userId || null;
  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, fullName: true, phoneNumber: true, email: true, avatar: true },
      })
    : null;

  const userMap = new Map(user ? [[user.id, user]] : []);
  const client = resolveClientIdentity(session, userMap);
  const serviceLabel = formatServiceLabel(session.serviceId);
  const { status, hasProposal } = resolveSessionStatus(session);

  return res.json({
    success: true,
    data: {
      id: session.id,
      serviceId: session.serviceId,
      serviceLabel,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      currentStep: session.currentStep,
      client,
      status,
      hasProposal,
      answers: session.answers || {},
      messages: session.messages || [],
    },
  });
});
