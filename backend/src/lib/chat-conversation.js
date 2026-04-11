import { AppError } from "../utils/app-error.js";
import { prisma } from "./prisma.js";

export const CHAT_SERVICE_LABEL = "Project Chat";

export const normalizeChatService = (service = "") => {
  if (!service) return null;
  return service.toString().trim();
};

export const buildProjectChatServiceKey = ({
  projectId = "",
  ownerId = "",
  freelancerId = "",
} = {}) => {
  const normalizedProjectId = String(projectId || "").trim();
  const normalizedOwnerId = String(ownerId || "").trim();
  const normalizedFreelancerId = String(freelancerId || "").trim();

  if (!normalizedProjectId || !normalizedOwnerId || !normalizedFreelancerId) {
    return "";
  }

  return `CHAT:${normalizedProjectId}:${normalizedOwnerId}:${normalizedFreelancerId}`;
};

export const parseProjectIdFromChatService = (service = "") => {
  if (!service || typeof service !== "string") return null;
  const parts = service.split(":");
  if (parts.length < 4 || parts[0] !== "CHAT") return null;
  return parts[1] || null;
};

const defaultErrorFactory = (message, statusCode = 500) =>
  new AppError(message, statusCode);

export const ensureProjectChatAccess = async ({
  serviceKey = null,
  conversationService = null,
  userId = null,
  errorFactory = defaultErrorFactory,
} = {}) => {
  const sourceService = conversationService || serviceKey || "";
  const projectId = parseProjectIdFromChatService(sourceService);

  if (!projectId) {
    return null;
  }

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
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!project) {
    throw errorFactory("Project not found for this chat.", 404);
  }

  const acceptedFreelancerId = project.proposals?.[0]?.freelancerId || null;
  const isParticipant =
    String(userId) === String(project.ownerId) ||
    String(userId) === String(project.managerId) ||
    (acceptedFreelancerId &&
      String(userId) === String(acceptedFreelancerId));

  if (!isParticipant) {
    throw errorFactory("You do not have permission to access this chat.", 403);
  }

  const normalizedStatus = String(project.status || "").toUpperCase();
  const isPaymentPending =
    normalizedStatus === "AWAITING_PAYMENT" ||
    normalizedStatus === "PENDING_PAYMENT" ||
    Number(project.spent || 0) <= 0;

  if (isPaymentPending && normalizedStatus !== "COMPLETED") {
    throw errorFactory(
      "Chat will start after the initial 20% payment is completed.",
      403,
    );
  }

  return project;
};

export const resolveProjectChatRecipientIds = async ({
  serviceKey = "",
  senderId = null,
} = {}) => {
  const projectId = parseProjectIdFromChatService(serviceKey);
  if (!projectId) return [];

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      ownerId: true,
      managerId: true,
      proposals: {
        where: { status: "ACCEPTED" },
        select: { freelancerId: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!project) return [];

  const acceptedFreelancerId = project.proposals?.[0]?.freelancerId || null;
  const recipients = [
    project.ownerId,
    project.managerId,
    acceptedFreelancerId,
  ]
    .filter(Boolean)
    .filter((id) => String(id) !== String(senderId));

  return Array.from(new Set(recipients.map((id) => String(id))));
};

export const serializeChatMessage = (message) => ({
  id: message.id,
  conversationId: message.conversationId,
  content: message.content,
  role: message.role,
  senderId: message.senderId,
  senderRole: message.senderRole,
  senderName: message.senderName,
  readAt: message.readAt,
  attachment: message.attachment,
  deleted: Boolean(message.deleted),
  createdAt:
    message.createdAt instanceof Date
      ? message.createdAt.toISOString()
      : message.createdAt,
});

export const findBestConversationByService = async (service = "") => {
  if (!service) return null;

  const withMessages = await prisma.chatConversation.findFirst({
    where: {
      service,
      messages: { some: {} },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (withMessages) {
    return withMessages;
  }

  return prisma.chatConversation.findFirst({
    where: { service },
    orderBy: { updatedAt: "desc" },
  });
};

export const resolveConversationByService = async ({
  conversationId = null,
  serviceKey = null,
  projectTitle = null,
  createdById = null,
  allowCreate = false,
} = {}) => {
  let conversation = null;

  if (conversationId) {
    conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
    });
  }

  if (!conversation && serviceKey) {
    conversation = await findBestConversationByService(serviceKey);

    if (!conversation && serviceKey.startsWith("CHAT:")) {
      const parts = serviceKey.split(":");
      if (parts.length === 4) {
        const [, , ownerId, freelancerId] = parts;
        const legacyKey = `CHAT:${ownerId}:${freelancerId}`;
        const legacyConversation = await findBestConversationByService(legacyKey);

        if (legacyConversation) {
          conversation = await prisma.chatConversation.update({
            where: { id: legacyConversation.id },
            data: {
              service: serviceKey,
              projectTitle: projectTitle || legacyConversation.projectTitle,
            },
          });
        }
      }
    }
  }

  if (!conversation && allowCreate) {
    conversation = await prisma.chatConversation.create({
      data: {
        service: serviceKey,
        projectTitle: projectTitle || null,
        createdById: createdById || null,
      },
    });
  }

  return conversation;
};
