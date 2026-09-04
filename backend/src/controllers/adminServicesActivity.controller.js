import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";

const PHONE_REGEX = /(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}\b|\b[6-9]\d{9}\b/;

/**
 * Helper to extract phone number pattern from raw text
 */
const extractPhoneFromText = (text = "") => {
  if (!text || typeof text !== "string") return null;
  const match = text.match(PHONE_REGEX);
  return match ? match[0].trim() : null;
};

/**
 * Helper to extract client name, phone number, email, and user ID from session answers or User model
 */
const resolveClientIdentity = (session, userMapById = new Map(), userMapByName = new Map()) => {
  const answers = session?.answers || {};
  const bySlug = answers?.bySlug || {};

  const userId = answers?.userId || session?.userId || null;
  
  // 1. Try resolving user by ID
  let userObj = userId ? userMapById.get(userId) : null;

  const name =
    userObj?.fullName ||
    answers?.clientName ||
    answers?.name ||
    bySlug?.name ||
    bySlug?.client_name ||
    bySlug?.full_name ||
    bySlug?.personal_name ||
    "Guest Client";

  // 2. If no user by ID, try resolving user by Full Name
  if (!userObj && name && name !== "Guest Client") {
    userObj = userMapByName.get(name.trim().toLowerCase()) || null;
  }

  // 3. Extract phone from userObj (check BOTH phone and phoneNumber fields!)
  let phone =
    userObj?.phoneNumber ||
    userObj?.phone ||
    answers?.clientPhone ||
    answers?.phone ||
    answers?.phoneNumber ||
    bySlug?.phone ||
    bySlug?.phone_number ||
    bySlug?.contact_number ||
    bySlug?.mobile ||
    bySlug?.mobile_number ||
    bySlug?.contact ||
    null;

  // 4. If phone is still missing, scan answers & bySlug values for any phone number
  if (!phone) {
    const allValues = [
      ...Object.values(bySlug),
      ...Object.values(answers),
    ];
    for (const val of allValues) {
      if (typeof val === "string") {
        const found = extractPhoneFromText(val);
        if (found) {
          phone = found;
          break;
        }
      }
    }
  }

  // 5. If phone is still missing, scan user messages in transcript
  if (!phone && Array.isArray(session?.messages)) {
    for (const msg of session.messages) {
      if (msg.role === "user" && msg.content) {
        const found = extractPhoneFromText(msg.content);
        if (found) {
          phone = found;
          break;
        }
      }
    }
  }

  const email =
    userObj?.email ||
    answers?.clientEmail ||
    answers?.email ||
    bySlug?.email ||
    bySlug?.email_address ||
    "N/A";

  return {
    userId: userObj?.id || userId,
    name,
    phone: phone || "N/A",
    email,
    isRegisteredUser: Boolean(userObj),
  };
};

/**
 * Helper to extract document attachments & extracted text from session answers or messages
 */
const resolveDocumentData = (session) => {
  const answers = session?.answers || {};
  const attachmentContextText = String(
    answers?.attachmentContextText ||
    answers?.docText ||
    answers?.extractedDocText ||
    answers?.bySlug?.attachmentContextText ||
    ""
  ).trim();

  let attachments = [];
  if (Array.isArray(answers?.attachments)) {
    attachments = [...answers.attachments];
  } else if (answers?.attachment && typeof answers.attachment === "object") {
    attachments = [answers.attachment];
  } else if (Array.isArray(answers?.uploadedFiles)) {
    attachments = [...answers.uploadedFiles];
  }

  // Also check messages for attachments
  if (Array.isArray(session?.messages)) {
    for (const msg of session.messages) {
      if (msg?.attachment && typeof msg.attachment === "object") {
        const att = msg.attachment;
        if (!attachments.some((a) => a.name === att.name || a.url === att.url)) {
          attachments.push(att);
        }
      }
    }
  }

  const hasDocument = attachments.length > 0 || Boolean(attachmentContextText);

  return {
    hasDocument,
    attachments,
    attachmentCount: attachments.length,
    extractedText: attachmentContextText || (hasDocument ? "Document uploaded & extracted for AI questionnaire context." : null),
  };
};

/**
 * Helper to calculate AI Tokens, Call Counts, and Estimated Costs (USD / INR) per session
 */
const resolveAiUsageAndCost = (session, usageRecordsMap = new Map()) => {
  const sessionId = session?.id;
  const dbRecords = usageRecordsMap.get(sessionId) || [];

  let dbPromptTokens = 0;
  let dbCompletionTokens = 0;
  let dbTotalTokens = 0;
  let dbCostINR = 0;
  let dbCallCount = dbRecords.length;

  for (const rec of dbRecords) {
    dbPromptTokens += rec.promptTokens || 0;
    dbCompletionTokens += rec.completionTokens || 0;
    dbTotalTokens += rec.totalTokens || 0;
    dbCostINR += rec.costInRupees || 0;
  }

  // Calculate transcript-based estimation fallback
  const messages = session?.messages || [];
  const userMessages = messages.filter((m) => m.role === "user");
  const assistantMessages = messages.filter((m) => m.role === "assistant");
  
  const answers = session?.answers || {};
  const attachmentText = answers?.attachmentContextText || answers?.docText || answers?.extractedDocText || "";

  let userChars = 0;
  for (const m of userMessages) {
    userChars += String(m.content || "").length;
  }
  userChars += String(attachmentText).length;

  let assistantChars = 0;
  for (const m of assistantMessages) {
    assistantChars += String(m.content || "").length;
  }

  const callCount = Math.max(dbCallCount, assistantMessages.length);
  const hasProposal = Boolean(answers?.hasProposal || answers?.generatedProposal || answers?.proposal || answers?.bySlug?.generated_proposal);

  // Estimation math (if DB logs don't capture full token count):
  const estPromptTokens = Math.max(
    dbPromptTokens,
    callCount > 0 ? Math.ceil(userChars / 3.8) + (callCount * 600) + (hasProposal ? 2200 : 0) : 0
  );

  const estCompletionTokens = Math.max(
    dbCompletionTokens,
    callCount > 0 ? Math.ceil(assistantChars / 3.8) + (hasProposal ? 1800 : 0) : 0
  );

  const totalTokens = Math.max(dbTotalTokens, estPromptTokens + estCompletionTokens);

  // Pricing Model: GPT-4o-mini / Gemini Flash blended rate
  // Prompt USD: $0.00015 / 1k tokens
  // Completion USD: $0.00060 / 1k tokens
  // Exchange rate: 1 USD = 86.5 INR
  const USD_PROMPT_RATE = 0.00015 / 1000;
  const USD_COMPLETION_RATE = 0.00060 / 1000;
  const INR_EXCHANGE_RATE = 86.5;

  let costUSD = (estPromptTokens * USD_PROMPT_RATE) + (estCompletionTokens * USD_COMPLETION_RATE);
  let costINR = dbCostINR > 0 ? dbCostINR : costUSD * INR_EXCHANGE_RATE;
  if (dbCostINR > 0) {
    costUSD = dbCostINR / INR_EXCHANGE_RATE;
  }

  return {
    promptTokens: estPromptTokens,
    completionTokens: estCompletionTokens,
    totalTokens,
    callCount,
    costUSD: Number(costUSD.toFixed(4)),
    costINR: Number(costINR.toFixed(2)),
    formattedCostINR: `₹${costINR.toFixed(2)}`,
    formattedCostUSD: `$${costUSD.toFixed(4)}`,
    modelName: answers?.aiModel || "GPT-4o-mini / Gemini Flash",
  };
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
 * Returns aggregate metrics and paginated session list with document analytics & client contact details
 */
export const getServicesActivity = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || "20", 10)));
  const search = String(req.query.search || "").trim();
  const filterServiceId = String(req.query.serviceId || "").trim();
  const filterStatus = String(req.query.status || "ALL").trim().toUpperCase();
  const filterHasDocument = req.query.hasDocument === "true";

  const rawSessions = await prisma.aiGuestSession.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        select: {
          id: true,
          role: true,
          content: true,
          createdAt: true,
        },
      },
    },
  });

  // Fetch AI usage records safely
  const sessionIds = rawSessions.map((s) => s.id);
  let aiUsageRecords = [];
  try {
    if (sessionIds.length > 0) {
      aiUsageRecords = await prisma.aIUsage.findMany({
        where: { guestSessionId: { in: sessionIds } },
        select: {
          guestSessionId: true,
          promptTokens: true,
          completionTokens: true,
          totalTokens: true,
          costInRupees: true,
        },
      });
    }
  } catch (err) {
    aiUsageRecords = [];
  }

  const usageRecordsMap = new Map();
  for (const rec of aiUsageRecords) {
    if (!rec.guestSessionId) continue;
    if (!usageRecordsMap.has(rec.guestSessionId)) {
      usageRecordsMap.set(rec.guestSessionId, []);
    }
    usageRecordsMap.get(rec.guestSessionId).push(rec);
  }

  const userIds = new Set();
  const clientNames = new Set();

  for (const session of rawSessions) {
    const answers = session?.answers || {};
    const bySlug = answers?.bySlug || {};
    const uid = answers?.userId || session?.userId;
    if (uid) userIds.add(uid);

    const name =
      answers?.clientName ||
      answers?.name ||
      bySlug?.name ||
      bySlug?.client_name ||
      bySlug?.full_name ||
      bySlug?.personal_name;
    if (name && typeof name === "string" && name.trim()) {
      clientNames.add(name.trim());
    }
  }

  const users = await prisma.user.findMany({
    where: {
      OR: [
        ...(userIds.size > 0 ? [{ id: { in: Array.from(userIds) } }] : []),
        ...(clientNames.size > 0 ? Array.from(clientNames).map((n) => ({ fullName: { equals: n, mode: "insensitive" } })) : []),
      ],
    },
    select: { id: true, fullName: true, phone: true, phoneNumber: true, email: true },
  });

  const userMapById = new Map();
  const userMapByName = new Map();
  for (const u of users) {
    if (u.id) userMapById.set(u.id, u);
    if (u.fullName) userMapByName.set(u.fullName.trim().toLowerCase(), u);
  }

  const enrichedSessions = rawSessions.map((session) => {
    const client = resolveClientIdentity(session, userMapById, userMapByName);
    const documentData = resolveDocumentData(session);
    const serviceLabel = formatServiceLabel(session.serviceId);
    const { status, hasProposal } = resolveSessionStatus(session);
    const messageCount = session.messages?.length || 0;
    const aiUsage = resolveAiUsageAndCost(session, usageRecordsMap);

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
      documentData,
      aiUsage,
      status,
      hasProposal,
      dropOffQuestion,
      answersSummary: answers.bySlug || {},
    };
  });

  let filtered = enrichedSessions;

  if (search) {
    const lowerSearch = search.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.id.toLowerCase().includes(lowerSearch) ||
        item.client.name.toLowerCase().includes(lowerSearch) ||
        item.client.phone.toLowerCase().includes(lowerSearch) ||
        item.client.email.toLowerCase().includes(lowerSearch) ||
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

  if (filterHasDocument) {
    filtered = filtered.filter((item) => item.documentData.hasDocument);
  }

  const totalSessions = enrichedSessions.length;
  const totalProposals = enrichedSessions.filter((s) => s.hasProposal).length;
  const totalDocuments = enrichedSessions.filter((s) => s.documentData.hasDocument).length;
  const totalDropOffs = enrichedSessions.filter((s) => s.status === "DROPPED_OFF").length;
  const totalInProgress = enrichedSessions.filter((s) => s.status === "IN_PROGRESS").length;

  const totalAiTokens = enrichedSessions.reduce((acc, s) => acc + (s.aiUsage?.totalTokens || 0), 0);
  const totalAiCostUSD = enrichedSessions.reduce((acc, s) => acc + (s.aiUsage?.costUSD || 0), 0);
  const totalAiCostINR = enrichedSessions.reduce((acc, s) => acc + (s.aiUsage?.costINR || 0), 0);
  const totalAiCalls = enrichedSessions.reduce((acc, s) => acc + (s.aiUsage?.callCount || 0), 0);

  const serviceStatsMap = new Map();
  for (const session of enrichedSessions) {
    const label = session.serviceLabel;
    serviceStatsMap.set(label, (serviceStatsMap.get(label) || 0) + 1);
  }

  const topServices = Array.from(serviceStatsMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

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
        totalDocuments,
        totalDropOffs,
        totalInProgress,
        totalAiTokens,
        totalAiCostUSD: Number(totalAiCostUSD.toFixed(4)),
        totalAiCostINR: Number(totalAiCostINR.toFixed(2)),
        formattedTotalAiCostINR: `₹${totalAiCostINR.toFixed(2)}`,
        formattedTotalAiCostUSD: `$${totalAiCostUSD.toFixed(2)}`,
        totalAiCalls,
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
 * Returns full details, document analytics, & conversation transcript for a single chat session
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

  let dbAiUsageRecords = [];
  try {
    dbAiUsageRecords = await prisma.aIUsage.findMany({
      where: { guestSessionId: sessionId },
      select: {
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
        costInRupees: true,
      },
    });
  } catch {
    dbAiUsageRecords = [];
  }

  const usageRecordsMap = new Map();
  usageRecordsMap.set(sessionId, dbAiUsageRecords);

  const answers = session.answers || {};
  const bySlug = answers?.bySlug || {};
  const userId = answers?.userId || session?.userId || null;
  const name =
    answers?.clientName ||
    answers?.name ||
    bySlug?.name ||
    bySlug?.client_name ||
    bySlug?.full_name ||
    bySlug?.personal_name;

  const users = await prisma.user.findMany({
    where: {
      OR: [
        ...(userId ? [{ id: userId }] : []),
        ...(name && typeof name === "string" && name.trim() ? [{ fullName: { equals: name.trim(), mode: "insensitive" } }] : []),
      ],
    },
    select: { id: true, fullName: true, phone: true, phoneNumber: true, email: true, avatar: true },
  });

  const userMapById = new Map();
  const userMapByName = new Map();
  for (const u of users) {
    if (u.id) userMapById.set(u.id, u);
    if (u.fullName) userMapByName.set(u.fullName.trim().toLowerCase(), u);
  }

  const client = resolveClientIdentity(session, userMapById, userMapByName);
  const documentData = resolveDocumentData(session);
  const serviceLabel = formatServiceLabel(session.serviceId);
  const { status, hasProposal } = resolveSessionStatus(session);
  const aiUsage = resolveAiUsageAndCost(session, usageRecordsMap);

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
      documentData,
      aiUsage,
      status,
      hasProposal,
      answers: session.answers || {},
      messages: session.messages || [],
    },
  });
});
