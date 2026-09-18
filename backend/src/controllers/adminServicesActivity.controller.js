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

const ATTACHMENT_TOKEN_GLOBAL_REGEX = /\[\[ATTACHMENT\]\]([^|\n\r]+)\|([^|\n\r]+)\|([^|\n\r]*)\|(\d+)/g;

const safeDecode = (str = "") => {
  if (!str || typeof str !== "string") return str || "";
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
};

const PROPOSAL_CONTENT_REGEX =
  /(?:client name\s*:|project overview\s*:|primary objectives\s*:|features\/deliverables included\s*:|^#+\s*proposal|^#+\s*project overview|service breakdown\s*:)/i;

const isProposalMessage = (content = "") => {
  if (!content || typeof content !== "string") return false;
  return PROPOSAL_CONTENT_REGEX.test(content);
};

/**
 * Helper to extract document attachments & extracted text from session answers or messages
 */
const resolveDocumentData = (session) => {
  const answers = session?.answers || {};
  const uiState = answers?.uiState || {};
  const bySlug = answers?.bySlug || {};
  const attachmentContextText = String(
    answers?.attachmentContextText ||
    answers?.docText ||
    answers?.extractedDocText ||
    uiState?.attachmentContextText ||
    bySlug?.attachmentContextText ||
    ""
  ).trim();

  const attachments = [];
  const seenUrls = new Set();

  const addAttachment = (name, url, type, size) => {
    if (!url || seenUrls.has(url)) return;
    seenUrls.add(url);
    attachments.push({
      name: safeDecode(name || "Document Attachment"),
      url: safeDecode(url),
      type: type || "application/octet-stream",
      size: Number(size) || 0,
    });
  };

  if (Array.isArray(answers?.attachments)) {
    for (const a of answers.attachments) {
      if (a && typeof a === "object") addAttachment(a.name, a.url, a.type, a.size);
    }
  }
  if (answers?.attachment && typeof answers.attachment === "object") {
    addAttachment(answers.attachment.name, answers.attachment.url, answers.attachment.type, answers.attachment.size);
  }
  if (Array.isArray(answers?.uploadedFiles)) {
    for (const a of answers.uploadedFiles) {
      if (a && typeof a === "object") addAttachment(a.name, a.url, a.type, a.size);
    }
  }
  if (Array.isArray(uiState?.attachments)) {
    for (const a of uiState.attachments) {
      if (a && typeof a === "object") addAttachment(a.name, a.url, a.type, a.size);
    }
  }

  // Check messages for attachment tokens & direct upload links
  if (Array.isArray(session?.messages)) {
    for (const msg of session.messages) {
      if (msg?.attachment && typeof msg.attachment === "object") {
        addAttachment(msg.attachment.name, msg.attachment.url, msg.attachment.type, msg.attachment.size);
      }
      const content = String(msg?.content || "");
      if (content.includes("[[ATTACHMENT]]")) {
        const regex = new RegExp(ATTACHMENT_TOKEN_GLOBAL_REGEX);
        let match;
        while ((match = regex.exec(content)) !== null) {
          addAttachment(match[1], match[2], match[3], match[4]);
        }
      }
      const chatUploadMatches = content.match(/https?:\/\/[^\s)<>]+(?:\/api\/images\/chat\/|\/uploads\/)[^\s)<>]+/g);
      if (chatUploadMatches) {
        for (const rawUrl of chatUploadMatches) {
          const filename = rawUrl.split("/").pop() || "uploaded-file.pdf";
          addAttachment(filename, rawUrl, "application/pdf", 0);
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
  const uiState = answers?.uiState || {};
  const bySlug = answers?.bySlug || {};
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
  const hasProposalInAnswers = Boolean(
    uiState?.proposalGeneratedAt ||
    answers?.proposalGeneratedAt ||
    answers?.hasProposal ||
    answers?.generatedProposal ||
    answers?.proposal ||
    bySlug?.generated_proposal
  );
  const hasProposalInMsgs = assistantMessages.some((m) => isProposalMessage(m.content));
  const hasProposal = hasProposalInAnswers || hasProposalInMsgs;

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
  const uiState = answers?.uiState || {};
  const bySlug = answers?.bySlug || {};
  const currentStep = Number(session?.currentStep || 0);

  const hasProposalInAnswers = Boolean(
    uiState?.proposalGeneratedAt ||
    answers?.proposalGeneratedAt ||
    answers?.hasProposal ||
    answers?.generatedProposal ||
    answers?.proposal ||
    bySlug?.generated_proposal ||
    bySlug?.hasProposal
  );

  let hasProposalInMessages = false;
  if (Array.isArray(session?.messages)) {
    for (const msg of session.messages) {
      if (msg?.role === "assistant" && isProposalMessage(msg?.content)) {
        hasProposalInMessages = true;
        break;
      }
    }
  }

  const hasProposal = hasProposalInAnswers || hasProposalInMessages;

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

  if (req.query.hasDocument === "true") {
    filtered = filtered.filter((item) => item.documentData.hasDocument);
  } else if (req.query.hasDocument === "false") {
    filtered = filtered.filter((item) => !item.documentData.hasDocument);
  }

  const rawStepQuery = String(req.query.step || "ALL").trim();
  if (rawStepQuery !== "ALL") {
    if (rawStepQuery.endsWith("+")) {
      const minStep = parseInt(rawStepQuery.replace("+", ""), 10);
      if (!isNaN(minStep)) {
        filtered = filtered.filter((item) => ((item.currentStep || 0) + 1) >= minStep);
      }
    } else if (rawStepQuery.includes("-")) {
      const [minStr, maxStr] = rawStepQuery.split("-");
      const minStep = parseInt(minStr, 10);
      const maxStep = parseInt(maxStr, 10);
      if (!isNaN(minStep) && !isNaN(maxStep)) {
        filtered = filtered.filter((item) => {
          const step = (item.currentStep || 0) + 1;
          return step >= minStep && step <= maxStep;
        });
      }
    } else {
      const exactStep = parseInt(rawStepQuery, 10);
      if (!isNaN(exactStep) && exactStep > 0) {
        filtered = filtered.filter((item) => ((item.currentStep || 0) + 1) === exactStep);
      }
    }
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

  // Calculate step progression & milestone breakdown
  const maxStepFound = Math.max(1, ...enrichedSessions.map((s) => (s.currentStep || 0) + 1));
  const stepCountMap = new Map();
  for (const session of enrichedSessions) {
    const stepNum = (session.currentStep || 0) + 1;
    stepCountMap.set(stepNum, (stepCountMap.get(stepNum) || 0) + 1);
  }

  // Milestone Funnel Ranges
  const milestoneRanges = [
    { label: "Step 1 - 3", min: 1, max: 3, key: "1-3" },
    { label: "Step 4 - 7", min: 4, max: 7, key: "4-7" },
    { label: "Step 8 - 12", min: 8, max: 12, key: "8-12" },
    { label: "Step 13 - 20", min: 13, max: 20, key: "13-20" },
    { label: "Step 21+", min: 21, max: Infinity, key: "21+" },
  ];

  const milestoneFunnel = milestoneRanges.map((range) => {
    const reachedCount = enrichedSessions.filter((s) => ((s.currentStep || 0) + 1) >= range.min).length;
    const countAtRange = enrichedSessions.filter((s) => {
      const step = (s.currentStep || 0) + 1;
      return step >= range.min && step <= range.max;
    }).length;
    return {
      ...range,
      reachedCount,
      countAtRange,
      percentage: totalSessions > 0 ? Math.round((reachedCount / totalSessions) * 100) : 0,
    };
  });

  const stepBreakdown = [];
  const limitStepToRender = Math.min(50, Math.max(maxStepFound, 10));
  for (let i = 1; i <= limitStepToRender; i++) {
    const countAtStep = stepCountMap.get(i) || 0;
    const reachedCount = enrichedSessions.filter((s) => ((s.currentStep || 0) + 1) >= i).length;
    if (reachedCount > 0 || i <= 10) {
      stepBreakdown.push({
        step: i,
        label: `Step ${i}`,
        countAtStep,
        reachedCount,
        percentage: totalSessions > 0 ? Math.round((reachedCount / totalSessions) * 100) : 0,
      });
    }
  }

  // --- Fetch Client Activity Events for Full Funnel & Clickstream ---
  let activityEvents = [];
  try {
    activityEvents = await prisma.clientActivityEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 1000,
    });
  } catch (err) {
    activityEvents = [];
  }

  const uniqueVisitorsSet = new Set();
  const visitorsWhoClickedSet = new Set();
  const visitorsWhoBriefedSet = new Set();
  const visitorsWhoChattedSet = new Set();
  const serviceClickCounts = new Map();

  let totalPageViews = 0;
  let totalServiceClicks = 0;
  let totalBriefInteractions = 0;

  for (const ev of activityEvents) {
    if (ev.visitorId) uniqueVisitorsSet.add(ev.visitorId);

    if (ev.eventType === "PAGE_VIEW") {
      totalPageViews++;
    } else if (ev.eventType === "SERVICE_CLICK" || ev.eventType === "DIRECTION_CLICK") {
      totalServiceClicks++;
      if (ev.visitorId) visitorsWhoClickedSet.add(ev.visitorId);
      const sId = ev.serviceId || "unknown";
      const sName = ev.serviceName || formatServiceLabel(sId);
      const current = serviceClickCounts.get(sId) || { serviceId: sId, name: sName, clicks: 0, chats: 0 };
      current.clicks++;
      serviceClickCounts.set(sId, current);
    } else if (ev.eventType === "BRIEF_STEP" || ev.eventType === "DOCUMENT_UPLOAD" || ev.eventType === "BRIEF_TAB_SWITCH") {
      totalBriefInteractions++;
      if (ev.visitorId) visitorsWhoBriefedSet.add(ev.visitorId);
    } else if (ev.eventType === "CHAT_LAUNCH") {
      if (ev.visitorId) visitorsWhoChattedSet.add(ev.visitorId);
      const sId = ev.serviceId || "unknown";
      const sName = ev.serviceName || formatServiceLabel(sId);
      const current = serviceClickCounts.get(sId) || { serviceId: sId, name: sName, clicks: 0, chats: 0 };
      current.chats++;
      serviceClickCounts.set(sId, current);
    }
  }

  const uniqueVisitorsCount = Math.max(uniqueVisitorsSet.size, totalSessions);
  const totalServiceClicksCount = totalServiceClicks;
  const visitorsClickedCount = visitorsWhoClickedSet.size;
  const visitorsBriefedCount = visitorsWhoBriefedSet.size;
  const visitorsChattedCount = Math.max(visitorsWhoChattedSet.size, totalSessions);

  // Conversion Funnel Stages
  const trafficFunnel = [
    {
      stage: "1. Services Page Visitors",
      count: uniqueVisitorsCount,
      subtext: `${totalPageViews} total page impressions`,
      conversionPct: 100,
      dropOffPct: 0,
    },
    {
      stage: "2. Explored / Clicked Services",
      count: visitorsClickedCount,
      subtext: `${totalServiceClicksCount} total card & direction clicks`,
      conversionPct: uniqueVisitorsCount > 0 ? Math.round((visitorsClickedCount / uniqueVisitorsCount) * 100) : 0,
      dropOffPct: uniqueVisitorsCount > 0 ? Math.max(0, 100 - Math.round((visitorsClickedCount / uniqueVisitorsCount) * 100)) : 0,
    },
    {
      stage: "3. Brief Wizard / Doc Upload",
      count: visitorsBriefedCount,
      subtext: `${totalBriefInteractions} briefing interactions`,
      conversionPct: uniqueVisitorsCount > 0 ? Math.round((visitorsBriefedCount / uniqueVisitorsCount) * 100) : 0,
      dropOffPct: visitorsClickedCount > 0 ? Math.max(0, 100 - Math.round((visitorsBriefedCount / visitorsClickedCount) * 100)) : 0,
    },
    {
      stage: "4. Launched AI Chat",
      count: totalSessions,
      subtext: `${totalSessions} interactive chat sessions`,
      conversionPct: uniqueVisitorsCount > 0 ? Math.round((totalSessions / uniqueVisitorsCount) * 100) : 0,
      dropOffPct: visitorsBriefedCount > 0 ? Math.max(0, 100 - Math.round((totalSessions / visitorsBriefedCount) * 100)) : 0,
    },
    {
      stage: "5. Generated Proposal",
      count: totalProposals,
      subtext: `${totalProposals} complete client proposals`,
      conversionPct: totalSessions > 0 ? Math.round((totalProposals / totalSessions) * 100) : 0,
      dropOffPct: totalSessions > 0 ? Math.max(0, 100 - Math.round((totalProposals / totalSessions) * 100)) : 0,
    },
  ];

  // Ranked services by clicks
  const serviceClickRankings = Array.from(serviceClickCounts.values())
    .map((s) => ({
      ...s,
      conversionRate: s.clicks > 0 ? `${Math.round((s.chats / s.clicks) * 100)}%` : "0%",
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  // Recent 25 live visitor activity events
  const recentActivityFeed = activityEvents.slice(0, 30).map((ev) => ({
    id: ev.id,
    visitorId: ev.visitorId,
    eventType: ev.eventType,
    serviceId: ev.serviceId,
    serviceName: ev.serviceName || formatServiceLabel(ev.serviceId),
    pageUrl: ev.pageUrl,
    referrer: ev.referrer,
    metadata: ev.metadata,
    createdAt: ev.createdAt,
    userAgent: ev.userAgent,
    ipAddress: ev.ipAddress,
  }));

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
        maxStepFound,
        milestoneFunnel,
        stepBreakdown,
        // New Traffic & Telemetry Metrics
        trafficMetrics: {
          totalPageViews,
          uniqueVisitors: uniqueVisitorsCount,
          totalServiceClicks: totalServiceClicksCount,
          totalBriefInteractions,
          visitorToChatRate: uniqueVisitorsCount > 0 ? `${Math.round((totalSessions / uniqueVisitorsCount) * 100)}%` : "0%",
          chatToProposalRate: totalSessions > 0 ? `${Math.round((totalProposals / totalSessions) * 100)}%` : "0%",
        },
        trafficFunnel,
        serviceClickRankings,
        recentActivityFeed,
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
 * Returns full details, document analytics, clickstream timeline & conversation transcript for a single chat session
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

  // Fetch clickstream events for this session and visitor
  let activityTimeline = [];
  try {
    const whereConditions = [{ sessionId }];
    if (session.visitorId) {
      whereConditions.push({ visitorId: session.visitorId });
    }
    activityTimeline = await prisma.clientActivityEvent.findMany({
      where: { OR: whereConditions },
      orderBy: { createdAt: "asc" },
    });
  } catch (err) {
    activityTimeline = [];
  }

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

  // Format messages to extract attachments and clean token tags
  const formattedMessages = (session.messages || []).map((msg) => {
    let rawContent = String(msg.content || "");
    let msgAttachment = msg.attachment || null;

    if (!msgAttachment && rawContent.includes("[[ATTACHMENT]]")) {
      const regex = /\[\[ATTACHMENT\]\]([^|\n\r]+)\|([^|\n\r]+)\|([^|\n\r]*)\|(\d+)/;
      const match = regex.exec(rawContent);
      if (match) {
        msgAttachment = {
          name: safeDecode(match[1] || "Attachment"),
          url: safeDecode(match[2] || ""),
          type: safeDecode(match[3] || "application/octet-stream"),
          size: Number(match[4]) || 0,
        };
      }
    }

    const cleanContent = rawContent.replace(/\[\[ATTACHMENT\]\][^\n\r]+/g, "").trim();

    return {
      id: msg.id,
      role: msg.role,
      content: cleanContent || (msgAttachment ? `[Uploaded Document: ${msgAttachment.name}]` : rawContent),
      attachment: msgAttachment,
      createdAt: msg.createdAt,
    };
  });

  return res.json({
    success: true,
    data: {
      id: session.id,
      visitorId: session.visitorId || null,
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
      activityTimeline,
      answers: session.answers || {},
      messages: formattedMessages,
    },
  });
});

