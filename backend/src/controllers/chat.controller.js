import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";
import { sendNotificationToUser } from "../lib/notification-util.js";

const normalizeService = (service = "") => {
  if (!service) return null;
  return service.toString().trim();
};

const parseProjectIdFromChatService = (service = "") => {
  if (!service || typeof service !== "string") return null;
  const parts = service.split(":");
  if (parts.length < 4 || parts[0] !== "CHAT") return null;
  return parts[1] || null;
};

const ensureProjectChatAccess = async ({
  serviceKey = null,
  conversationService = null,
  userId = null
}) => {
  const sourceService = conversationService || serviceKey || "";
  const projectId = parseProjectIdFromChatService(sourceService);
  if (!projectId) return null;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      ownerId: true,
      managerId: true,
      status: true,
      spent: true,
      proposals: {
        where: { status: "ACCEPTED" },
        select: { freelancerId: true },
        take: 1
      }
    }
  });

  if (!project) {
    throw new AppError("Project not found for this chat.", 404);
  }

  const acceptedFreelancerId = project.proposals?.[0]?.freelancerId || null;
  const isParticipant =
    String(userId) === String(project.ownerId) ||
    String(userId) === String(project.managerId) ||
    (acceptedFreelancerId &&
      String(userId) === String(acceptedFreelancerId));

  if (!isParticipant) {
    throw new AppError("You do not have permission to access this chat.", 403);
  }

  const isPaymentPending =
    project.status === "AWAITING_PAYMENT" || Number(project.spent || 0) <= 0;
  if (isPaymentPending) {
    throw new AppError(
      "Chat will start after the initial 20% payment is completed.",
      403
    );
  }

  return project;
};

const serializeMessage = (message) => ({
  id: message.id,
  conversationId: message.conversationId,
  content: message.content,
  role: message.role,
  senderId: message.senderId,
  senderRole: message.senderRole,
  senderName: message.senderName,
  readAt: message.readAt,
  attachment: message.attachment,
  createdAt:
    message.createdAt instanceof Date
      ? message.createdAt.toISOString()
      : message.createdAt
});

// List conversations for the authenticated user (from DB) with latest message.
export const listUserConversations = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  // Check if user is a Project Manager
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, fullName: true }
  });

  const isProjectManager = currentUser?.role === "PROJECT_MANAGER";

  // For Project Managers: Find conversations where they've sent messages
  if (isProjectManager) {
    // Find all conversations where this PM has sent messages
    const pmMessages = await prisma.chatMessage.findMany({
      where: {
        OR: [{ senderId: userId }, { senderRole: "PROJECT_MANAGER" }]
      },
      select: { conversationId: true },
      distinct: ["conversationId"]
    });

    const conversationIds = pmMessages
      .map((m) => m.conversationId)
      .filter(Boolean);

    // Find projects assigned to this PM
    const pmProjects = await prisma.project.findMany({
      where: { managerId: userId },
      select: { id: true }
    });

    // Create an array of potential service keys for these projects
    const projectServicePrefixes = pmProjects.map((p) => ({ service: { startsWith: `CHAT:${p.id}` } }));

    // Get conversations where the PM sent a message OR it relates to an assigned project
    const allProjectConversations = await prisma.chatConversation.findMany({
      where: {
        OR: [
          { id: { in: conversationIds } },
          ...(projectServicePrefixes.length > 0 ? projectServicePrefixes : [])
        ]
      },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1
        },
        _count: {
          select: { messages: true }
        }
      },
      take: 50
    });

    // Filter to only show conversations with messages
    const conversationsWithMessages = allProjectConversations.filter(
      (c) => c._count?.messages > 0
    );

    const data = conversationsWithMessages.map((conversation) => ({
      id: conversation.id,
      service: conversation.service,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      createdById: conversation.createdById,
      projectTitle: conversation.projectTitle || "Project Chat",
      lastMessage: conversation.messages?.[0]
        ? serializeMessage(conversation.messages[0])
        : null,
      messageCount: conversation._count?.messages || 0
    }));

    res.json({ data });
    return;
  }

  // Regular flow for Clients/Freelancers
  const proposals = await prisma.proposal.findMany({
    where: {
      project: {
        ownerId: userId,
        status: { not: "AWAITING_PAYMENT" },
        spent: { gt: 0 }
      },
      freelancerId: { not: userId },
      status: { in: ["ACCEPTED"] }
    },
    include: { freelancer: true, project: true },
    orderBy: { createdAt: "desc" },
    take: 200
  });

  const serviceMeta = new Map();
  const serviceKeys = [];
  for (const proposal of proposals) {
    const projectId = proposal.project?.id;
    if (!projectId) continue;

    const ownerId = proposal.project?.ownerId;
    const freelancerId = proposal.freelancerId;
    const serviceKey = `CHAT:${projectId}:${ownerId}:${freelancerId}`;

    serviceKeys.push(serviceKey);
    serviceMeta.set(serviceKey, {
      projectId,
      freelancerName:
        proposal.freelancer?.fullName ||
        proposal.freelancer?.name ||
        proposal.freelancer?.email ||
        "Freelancer",
      projectTitle: proposal.project?.title || "Project Chat",
      freelancer: proposal.freelancer
    });
  }

  const conversations = serviceKeys.length
    ? await prisma.chatConversation.findMany({
      where: { service: { in: serviceKeys } },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1
        },
        _count: {
          select: { messages: true }
        }
      }
    })
    : [];

  const byService = new Map();

  const isBetterConversation = (current, candidate) => {
    const currentHasMessages =
      current.messages.length > 0 || (current._count?.messages || 0) > 0;
    const candidateHasMessages =
      candidate.messages.length > 0 || (candidate._count?.messages || 0) > 0;

    if (candidateHasMessages && !currentHasMessages) return true;
    if (!candidateHasMessages && currentHasMessages) return false;

    return new Date(candidate.updatedAt) > new Date(current.updatedAt);
  };

  for (const convo of conversations) {
    if (!convo.service) continue;
    if (!byService.has(convo.service)) {
      byService.set(convo.service, convo);
    } else {
      const current = byService.get(convo.service);
      if (isBetterConversation(current, convo)) {
        byService.set(convo.service, convo);
      }
    }
  }

  for (const key of serviceKeys) {
    if (!byService.has(key)) {
      const convo = await prisma.chatConversation.create({
        data: { service: key, createdById: userId }
      });
      byService.set(key, { ...convo, messages: [] });
    }
  }

  const data = Array.from(byService.values())
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
    .map((conversation) => {
      const meta = serviceMeta.get(conversation.service) || {};
      return {
        id: conversation.id,
        service: conversation.service,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        createdById: conversation.createdById,
        freelancerName: meta.freelancerName || "Freelancer",
        projectTitle: meta.projectTitle || conversation.service || "Conversation",
        lastMessage: conversation.messages?.[0]
          ? serializeMessage(conversation.messages[0])
          : null,
        freelancer: meta.freelancer
      };
    });

  res.json({ data });
});

export const createConversation = asyncHandler(async (req, res) => {
  const createdById = req.user?.sub || null;
  const serviceKey = normalizeService(req.body?.service);
  const projectTitle = req.body?.projectTitle || null;

  if (!createdById) {
    throw new AppError("Authentication required", 401);
  }

  if (serviceKey) {
    await ensureProjectChatAccess({
      serviceKey,
      userId: createdById
    });
  }

  let conversation = null;

  if (serviceKey) {
    const candidates = await prisma.chatConversation.findMany({
      where: { service: serviceKey },
      include: {
        _count: { select: { messages: true } }
      },
      orderBy: { updatedAt: "desc" }
    });

    conversation = candidates.find((c) => c._count.messages > 0) || candidates[0];

    if (!conversation && serviceKey.startsWith("CHAT:")) {
      const parts = serviceKey.split(":");
      if (parts.length === 4) {
        const [, , clientId, freelancerId] = parts;
        const legacyKey = `CHAT:${clientId}:${freelancerId}`;

        const legacyCandidates = await prisma.chatConversation.findMany({
          where: { service: legacyKey },
          include: {
            _count: { select: { messages: true } }
          },
          orderBy: { updatedAt: "desc" }
        });

        const legacyConvo =
          legacyCandidates.find((c) => c._count.messages > 0) ||
          legacyCandidates[0];

        if (legacyConvo) {
          conversation = await prisma.chatConversation.update({
            where: { id: legacyConvo.id },
            data: {
              service: serviceKey,
              projectTitle: projectTitle || legacyConvo.projectTitle
            }
          });
        }
      }
    }
  }

  if (!conversation) {
    conversation = await prisma.chatConversation.create({
      data: {
        service: serviceKey,
        projectTitle,
        createdById
      }
    });
  }

  await ensureProjectChatAccess({
    conversationService: conversation.service,
    userId: createdById
  });

  res.status(201).json({ data: conversation });
});

export const getConversationMessages = asyncHandler(async (req, res) => {
  const conversationId = req.params?.id;

  if (!req.user?.sub) {
    throw new AppError("Authentication required", 401);
  }

  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId }
  });

  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  await ensureProjectChatAccess({
    conversationService: conversation.service,
    userId: req.user?.sub
  });

  const messages = await prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: 5000
  });

  res.json({
    data: {
      conversation,
      messages
    }
  });
});

export const clearConversationMessages = asyncHandler(async (req, res) => {
  const conversationId = req.params?.id;

  if (!conversationId) {
    throw new AppError("Conversation id is required", 400);
  }

  if (!req.user?.sub) {
    throw new AppError("Authentication required", 401);
  }

  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId }
  });

  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  await ensureProjectChatAccess({
    conversationService: conversation.service,
    userId: req.user?.sub
  });

  const result = await prisma.chatMessage.deleteMany({
    where: { conversationId }
  });

  await prisma.chatConversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() }
  });

  res.json({
    data: {
      conversationId,
      deletedCount: result.count || 0
    }
  });
});

export const addConversationMessage = asyncHandler(async (req, res) => {
  const conversationId = req.params?.id;
  const {
    content,
    service,
    projectTitle,
    senderId,
    senderRole,
    senderName,
    attachment
  } = req.body || {};

  if (!content && !attachment) {
    throw new AppError("Message content or attachment is required", 400);
  }

  if (!req.user?.sub) {
    throw new AppError("Authentication required", 401);
  }

  const serviceKey = normalizeService(service);
  const actorUserId = req.user?.sub;

  if (serviceKey) {
    await ensureProjectChatAccess({
      serviceKey,
      userId: actorUserId
    });
  }

  let conversation = null;

  if (conversationId) {
    conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId }
    });
  }

  if (!conversation && serviceKey) {
    const candidates = await prisma.chatConversation.findMany({
      where: { service: serviceKey },
      include: {
        _count: { select: { messages: true } }
      },
      orderBy: { updatedAt: "desc" }
    });
    conversation = candidates.find((c) => c._count.messages > 0) || candidates[0];
  }

  if (!conversation) {
    conversation = await prisma.chatConversation.create({
      data: {
        service: serviceKey,
        projectTitle: projectTitle || null,
        createdById: senderId || req.user?.sub || null
      }
    });
  }

  await ensureProjectChatAccess({
    conversationService: conversation.service,
    userId: actorUserId
  });

  const userMessage = await prisma.chatMessage.create({
    data: {
      conversationId: conversation.id,
      senderId: actorUserId || senderId || null,
      senderName: senderName || null,
      senderRole: senderRole || null,
      role: "user",
      content,
      attachment: attachment || undefined
    }
  });

  await prisma.chatConversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() }
  });

  const convService = serviceKey || conversation.service || "";
  const actualSenderId = senderId || req.user?.sub;

  if (convService.startsWith("CHAT:")) {
    const parts = convService.split(":");
    let recipientId = null;

    if (parts.length === 4) {
      const [, , clientId, freelancerId] = parts;
      recipientId =
        String(actualSenderId) === String(clientId) ? freelancerId : clientId;
    } else if (parts.length >= 3) {
      const [, id1, id2] = parts;
      recipientId = String(actualSenderId) === String(id1) ? id2 : id1;
    }

    if (recipientId && String(recipientId) !== String(actualSenderId)) {
      const preview =
        typeof content === "string" && content.trim()
          ? content.trim()
          : attachment?.name || "Sent an attachment";
      sendNotificationToUser(recipientId, {
        type: "chat",
        title: "New Message",
        message: `${senderName || "Someone"}: ${preview.slice(0, 50)}${preview.length > 50 ? "..." : ""}`,
        data: {
          conversationId: conversation.id,
          messageId: userMessage.id,
          service: convService,
          senderId: actualSenderId
        }
      });
    }
  }

  res.status(201).json({
    data: {
      message: serializeMessage(userMessage),
      assistant: null
    }
  });
});

export const getProjectMessages = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const { projectId } = req.params;

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  if (!user || (user.role !== "PROJECT_MANAGER" && user.role !== "ADMIN")) {
    throw new AppError(
      "Access denied. Only Project Managers can access this.",
      403
    );
  }

  // Enforce PM Scope
  if (user.role === "PROJECT_MANAGER") {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { managerId: true }
    });
    if (!project || String(project.managerId) !== String(userId)) {
      throw new AppError("Access denied. You are not assigned to this project's chat.", 403);
    }
  }

  const conversations = await prisma.chatConversation.findMany({
    where: {
      OR: [
        { service: { startsWith: `CHAT:${projectId}:` } },
        { service: { contains: projectId } }
      ]
    },
    orderBy: { updatedAt: "desc" }
  });

  if (conversations.length === 0) {
    res.json({ data: { messages: [], conversation: null } });
    return;
  }

  const conversation = conversations[0];

  const messages = await prisma.chatMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 100
  });

  const formattedMessages = messages.map((msg) => ({
    id: msg.id,
    content: msg.content,
    senderName: msg.senderName || (msg.role === "assistant" ? "Cata" : "User"),
    senderRole: msg.senderRole || msg.role,
    createdAt: msg.createdAt,
    role: msg.role
  }));

  res.json({
    data: {
      conversation: {
        id: conversation.id,
        service: conversation.service,
        projectTitle: conversation.projectTitle
      },
      messages: formattedMessages
    }
  });
});

