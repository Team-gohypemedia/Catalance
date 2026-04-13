import { getClientChatBootstrapData, listClientConversationsData } from "../lib/client-chat-bootstrap.js";
import {
  CHAT_SERVICE_LABEL,
  ensureProjectChatAccess,
  normalizeChatService,
  resolveConversationByService,
  resolveProjectChatRecipientIds,
  serializeChatMessage,
} from "../lib/chat-conversation.js";
import { prisma } from "../lib/prisma.js";
import { sendNotificationToUser } from "../lib/notification-util.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";

const buildLegacyRecipientIds = (serviceKey = "", senderId = null) => {
  const parts = String(serviceKey || "").split(":");
  let recipientId = null;

  if (parts.length === 4) {
    const [, , clientId, freelancerId] = parts;
    recipientId =
      String(senderId) === String(clientId) ? freelancerId : clientId;
  } else if (parts.length >= 3) {
    const [, firstId, secondId] = parts;
    recipientId =
      String(senderId) === String(firstId) ? secondId : firstId;
  }

  return recipientId ? [String(recipientId)] : [];
};

const getChatPreviewText = ({ content, attachment } = {}) => {
  const trimmedContent = String(content || "").trim();
  if (trimmedContent) {
    return trimmedContent;
  }

  const attachmentName = String(attachment?.name || "").trim();
  if (attachmentName) {
    return attachmentName;
  }

  return "Sent an attachment";
};

export const getClientChatBootstrap = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const data = await getClientChatBootstrapData(userId);
  res.json({ data });
});

export const listUserConversations = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;

  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (currentUser?.role === "PROJECT_MANAGER") {
    const pmMessages = await prisma.chatMessage.findMany({
      where: {
        OR: [{ senderId: userId }, { senderRole: "PROJECT_MANAGER" }],
      },
      select: { conversationId: true },
      distinct: ["conversationId"],
    });

    const conversationIds = pmMessages
      .map((message) => message.conversationId)
      .filter(Boolean);

    const pmProjects = await prisma.project.findMany({
      where: { managerId: userId },
      select: { id: true },
    });

    const projectServicePrefixes = pmProjects.map((project) => ({
      service: { startsWith: `CHAT:${project.id}` },
    }));

    const allProjectConversations = await prisma.chatConversation.findMany({
      where: {
        OR: [
          { id: { in: conversationIds } },
          ...(projectServicePrefixes.length > 0 ? projectServicePrefixes : []),
        ],
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        service: true,
        createdAt: true,
        updatedAt: true,
        createdById: true,
        projectTitle: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: { messages: true },
        },
      },
      take: 50,
    });

    const data = allProjectConversations
      .filter((conversation) => Number(conversation._count?.messages || 0) > 0)
      .map((conversation) => ({
        id: conversation.id,
        service: conversation.service,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        createdById: conversation.createdById,
        projectTitle: conversation.projectTitle || CHAT_SERVICE_LABEL,
        lastMessage: conversation.messages?.[0]
          ? serializeChatMessage(conversation.messages[0])
          : null,
        messageCount: Number(conversation._count?.messages || 0),
      }));

    res.json({ data });
    return;
  }

  const data = await listClientConversationsData(userId);
  res.json({ data });
});

export const createConversation = asyncHandler(async (req, res) => {
  const createdById = req.user?.sub || null;
  const serviceKey = normalizeChatService(req.body?.service);
  const projectTitle = req.body?.projectTitle || null;

  if (!createdById) {
    throw new AppError("Authentication required", 401);
  }

  if (serviceKey) {
    await ensureProjectChatAccess({
      serviceKey,
      userId: createdById,
    });
  }

  const conversation = await resolveConversationByService({
    serviceKey,
    projectTitle,
    createdById,
    allowCreate: true,
  });

  await ensureProjectChatAccess({
    conversationService: conversation?.service,
    userId: createdById,
  });

  res.status(201).json({ data: conversation });
});

export const getConversationMessages = asyncHandler(async (req, res) => {
  const conversationId = req.params?.id;
  const afterRaw = String(req.query?.after || "").trim();
  const parsedAfter = afterRaw ? new Date(afterRaw) : null;
  const isAfterValid =
    parsedAfter instanceof Date && !Number.isNaN(parsedAfter.getTime());

  if (!req.user?.sub) {
    throw new AppError("Authentication required", 401);
  }

  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      service: true,
      projectTitle: true,
    },
  });

  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  await ensureProjectChatAccess({
    conversationService: conversation.service,
    userId: req.user?.sub,
  });

  const messageWhere = isAfterValid
    ? {
        conversationId,
        createdAt: {
          gt: parsedAfter,
        },
      }
    : { conversationId };

  const messages = await prisma.chatMessage.findMany({
    where: messageWhere,
    orderBy: { createdAt: "asc" },
    take: 5000,
  });

  res.json({
    data: {
      conversation,
      messages: messages.map((message) => serializeChatMessage(message)),
    },
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
    where: { id: conversationId },
    select: { id: true, service: true },
  });

  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  await ensureProjectChatAccess({
    conversationService: conversation.service,
    userId: req.user?.sub,
  });

  const result = await prisma.chatMessage.deleteMany({
    where: { conversationId },
  });

  await prisma.chatConversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  res.json({
    data: {
      conversationId,
      deletedCount: result.count || 0,
    },
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
    attachment,
  } = req.body || {};

  if (!content && !attachment) {
    throw new AppError("Message content or attachment is required", 400);
  }

  if (!req.user?.sub) {
    throw new AppError("Authentication required", 401);
  }

  const serviceKey = normalizeChatService(service);
  const actorUserId = req.user?.sub;

  if (serviceKey) {
    await ensureProjectChatAccess({
      serviceKey,
      userId: actorUserId,
    });
  }

  const conversation = await resolveConversationByService({
    conversationId,
    serviceKey,
    projectTitle,
    createdById: senderId || actorUserId,
    allowCreate: true,
  });

  await ensureProjectChatAccess({
    conversationService: conversation?.service,
    userId: actorUserId,
  });

  const userMessage = await prisma.chatMessage.create({
    data: {
      conversationId: conversation.id,
      senderId: actorUserId || senderId || null,
      senderName: senderName || null,
      senderRole: senderRole || null,
      role: "user",
      content,
      attachment: attachment || undefined,
    },
  });

  await prisma.chatConversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  const conversationService = serviceKey || conversation.service || "";
  const actualSenderId = actorUserId || senderId;

  if (conversationService.startsWith("CHAT:")) {
    let recipientIds = await resolveProjectChatRecipientIds({
      serviceKey: conversationService,
      senderId: actualSenderId,
    });

    if (!recipientIds.length) {
      recipientIds = buildLegacyRecipientIds(
        conversationService,
        actualSenderId,
      );
    }

    if (recipientIds.length) {
      const preview = getChatPreviewText({ content, attachment });

      await Promise.all(
        recipientIds
          .filter((recipientId) => String(recipientId) !== String(actualSenderId))
          .map((recipientId) =>
            sendNotificationToUser(recipientId, {
              audience: null,
              type: "chat",
              title: "New Message",
              message: `${senderName || "Someone"}: ${preview.slice(0, 50)}${preview.length > 50 ? "..." : ""}`,
              data: {
                conversationId: conversation.id,
                messageId: userMessage.id,
                service: conversationService,
                senderId: actualSenderId,
              },
            }).catch(() => null),
          ),
      );
    }
  }

  res.status(201).json({
    data: {
      message: serializeChatMessage(userMessage),
      assistant: null,
    },
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
    select: { role: true },
  });

  if (!user || (user.role !== "PROJECT_MANAGER" && user.role !== "ADMIN")) {
    throw new AppError(
      "Access denied. Only Project Managers can access this.",
      403,
    );
  }

  if (user.role === "PROJECT_MANAGER") {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { managerId: true },
    });

    if (!project || String(project.managerId) !== String(userId)) {
      throw new AppError(
        "Access denied. You are not assigned to this project's chat.",
        403,
      );
    }
  }

  const conversations = await prisma.chatConversation.findMany({
    where: {
      OR: [
        { service: { startsWith: `CHAT:${projectId}:` } },
        { service: { contains: projectId } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      service: true,
      projectTitle: true,
    },
  });

  if (conversations.length === 0) {
    res.json({ data: { messages: [], conversation: null } });
    return;
  }

  const conversation = conversations[0];

  const messages = await prisma.chatMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  res.json({
    data: {
      conversation: {
        id: conversation.id,
        service: conversation.service,
        projectTitle: conversation.projectTitle,
      },
      messages: messages.map((message) => ({
        ...serializeChatMessage(message),
        senderName:
          message.senderName ||
          (message.role === "assistant" ? "Cata" : "User"),
        senderRole: message.senderRole || message.role,
      })),
    },
  });
});
