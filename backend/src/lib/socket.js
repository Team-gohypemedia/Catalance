import { Server } from "socket.io";
import { env } from "../config/env.js";
import { prisma } from "./prisma.js";
import { sendNotificationToUser } from "./notification-util.js";
import { setIo } from "./socket-manager.js";
import {
  ensureProjectChatAccess,
  normalizeChatService,
  resolveConversationByService,
  resolveProjectChatRecipientIds,
  serializeChatMessage,
} from "./chat-conversation.js";

const normalizeOrigin = (value = "") => value.trim().replace(/\/$/, "");
const parseOrigins = (value = "") =>
  value
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);

const allowedOrigins = [
  ...parseOrigins(env.CORS_ORIGIN || ""),
  normalizeOrigin(env.LOCAL_CORS_ORIGIN || ""),
  normalizeOrigin(env.VERCEL_CORS_ORIGIN || ""),
  "http://localhost:5173",
  "http://localhost:5174",
  "https://catalance.in",
  "https://www.catalance.in"
].filter(Boolean);

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

let ioInstance;



export const initSocket = (server) => {
  const corsOrigins =
    allowedOrigins.includes("*") || allowedOrigins.length === 0
      ? true
      : allowedOrigins;

  const conversationPresence = new Map(); // conversationId -> Set<userId>

  const io = new Server(server, {
    path: env.SOCKET_IO_PATH || "/socket.io",
    cors: {
      origin: corsOrigins,
      credentials: true
    }
  });

  ioInstance = io;
  setIo(io);

  io.on("connection", (socket) => {
    const handshakeUserId = socket.handshake?.query?.userId;
    console.log(`[Socket] 🔌 New connection: ${socket.id}, userId from query: ${handshakeUserId || 'none'}`);

    // Join user's personal notification room automatically based on handshake
    if (handshakeUserId) {
      const roomName = `user:${handshakeUserId}`;
      socket.join(roomName);
      console.log(`[Socket] User ${handshakeUserId} joined personal room: ${roomName}`);
    }

    const joinedConversations = new Set();
    const presenceKeys = new Map(); // conversationId -> userKey

    const broadcastPresence = (conversationId) => {

      const set = conversationPresence.get(conversationId) || new Set();
      const online = Array.from(set);
      io.to(conversationId).emit("chat:presence", {
        conversationId,
        online
      });
    };

    const leaveConversationRoom = (conversationId) => {
      if (!conversationId) return;

      socket.leave(conversationId);
      joinedConversations.delete(conversationId);

      const set = conversationPresence.get(conversationId);
      if (!set) return;

      const key = presenceKeys.get(conversationId) || socket.id;
      set.delete(key);
      presenceKeys.delete(conversationId);

      if (set.size === 0) {
        conversationPresence.delete(conversationId);
      } else {
        conversationPresence.set(conversationId, set);
      }

      broadcastPresence(conversationId);
    };

    // Join user's personal notification room
    // SECURITY: Use the userId from socket handshake (set during connection) 
    // instead of trusting client-provided userId to ensure users only join their own room


    socket.on("chat:join", async ({ conversationId, service, senderId, includeHistory = true, projectTitle = null }) => {
      console.log(`[Socket] chat:join request:`, { conversationId, service, senderId, socketId: socket.id });
      try {
        const serviceKey = normalizeChatService(service);
        const requesterId = handshakeUserId || senderId || null;
        const conversation = await resolveConversationByService({
          conversationId,
          serviceKey,
          projectTitle,
          createdById: requesterId,
          allowCreate: true,
        });

        await ensureProjectChatAccess({
          serviceKey: conversation?.service || serviceKey,
          userId: requesterId,
          errorFactory: (message, statusCode = 500) =>
            Object.assign(new Error(message), { statusCode }),
        });

        console.log(`[Socket] Joining conversation: ${conversation.id} for service: ${serviceKey}`);
        socket.join(conversation.id);
        socket.emit("chat:joined", { conversationId: conversation.id });
        joinedConversations.add(conversation.id);

        // Track presence
        const userKey = senderId || socket.id;
        const set = conversationPresence.get(conversation.id) || new Set();
        set.add(userKey);
        conversationPresence.set(conversation.id, set);
        presenceKeys.set(conversation.id, userKey);
        broadcastPresence(conversation.id);

        if (includeHistory !== false) {
          const history = await prisma.chatMessage.findMany({
            where: { conversationId: conversation.id },
            orderBy: { createdAt: "asc" },
            take: 100,
          });

          if (history.length) {
            socket.emit(
              "chat:history",
              history.map((message) => serializeChatMessage(message)),
            );
          }
        }
      } catch (error) {
        console.error("chat:join failed", error);
        try {
          const fs = await import('fs');
          const path = await import('path');
          const logPath = path.resolve(process.cwd(), 'socket-errors.log');
          const logEntry = `[${new Date().toISOString()}] chat:join error: ${error.message}\n${error.stack}\n---\n`;
          fs.appendFileSync(logPath, logEntry);
        } catch (e) { /* ignore */ }
        socket.emit("chat:error", {
          message: error?.message || "Unable to join chat. Please try again."
        });
      }
    });

    socket.on("chat:leave", ({ conversationId }) => {
      leaveConversationRoom(conversationId);
    });

    socket.on("chat:read", async ({ conversationId, userId }) => {
      if (!conversationId || !userId) return;

      try {
        // Mark messages as read in DB where sender is NOT the current user
        await prisma.chatMessage.updateMany({
          where: {
            conversationId,
            senderId: { not: userId }, // Mark others' messages as read
            readAt: null
          },
          data: {
            readAt: new Date()
          }
        });

        // Broadcast read receipt to the room (so the sender sees blue ticks)
        io.to(conversationId).emit("chat:read_receipt", {
          conversationId,
          readerId: userId,
          readAt: new Date().toISOString()
        });
      } catch (error) {
        console.error("Failed to mark messages as read:", error);
      }
    });

    socket.on(
      "chat:message",
      async ({
        conversationId,
        content,
        service,
        senderId,
        senderRole,
        senderName,
        attachment
      }) => {
        if (!content && !attachment) {
          socket.emit("chat:error", {
            message: "Message content is required"
          });
          return;
        }

        try {
          const serviceKey = normalizeChatService(service);
          const requesterId = handshakeUserId || senderId || null;
          const conversation = await resolveConversationByService({
            conversationId,
            serviceKey,
            createdById: requesterId,
            allowCreate: true,
          });

          await ensureProjectChatAccess({
            serviceKey: conversation?.service || serviceKey,
            userId: requesterId,
            errorFactory: (message, statusCode = 500) =>
              Object.assign(new Error(message), { statusCode }),
          });

          socket.join(conversation.id);

          const userMessage = await prisma.chatMessage.create({
            data: {
              conversationId: conversation.id,
              senderId: senderId || null,
              senderName: senderName || null,
              senderRole: senderRole || null,
              role: "user",
              content,
              attachment: attachment || undefined
            }
          });

          // Update conversation timestamp for sorting
          await prisma.chatConversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() }
          });

          io.to(conversation.id).emit(
            "chat:message",
            serializeChatMessage(userMessage)
          );

          // Send notification to the other participant
          const convService = serviceKey || conversation.service || "";
          console.log(`[Socket] Checking notification for service: ${convService}, senderId: ${senderId}`);

          if (convService.startsWith("CHAT:")) {
            let recipientIds = await resolveProjectChatRecipientIds({
              serviceKey: convService,
              senderId: requesterId,
            });

            if (!recipientIds.length) {
              recipientIds = buildLegacyRecipientIds(convService, requesterId);
            }

            console.log(`[Socket] Notification recipients: ${recipientIds.join(",")}, sender: ${senderId}`);

            if (recipientIds.length) {
              const preview =
                typeof content === "string" && content.trim()
                  ? content.trim()
                  : attachment?.name || "Sent an attachment";

              await Promise.all(
                recipientIds
                  .filter((recipientId) => String(recipientId) !== String(requesterId))
                  .map((recipientId) =>
                    sendNotificationToUser(recipientId, {
                      audience: null,
                      type: "chat",
                      title: "New Message",
                      message: `${senderName || "Someone"}: ${preview.slice(0, 50)}${preview.length > 50 ? "..." : ""}`,
                      data: {
                        conversationId: conversation.id,
                        messageId: userMessage.id,
                        service: convService,
                        senderId: requesterId,
                      },
                    }, false).catch(() => null),
                  ),
              );
            }
          } else {
            console.log(`[Socket] Skipping notification - service doesn't start with CHAT: ${convService}`);
          }
        } catch (error) {
          console.error("chat:message failed", error);
          try {
            const fs = await import('fs');
            const path = await import('path');
            const logPath = path.resolve(process.cwd(), 'socket-errors.log');
            const logEntry = `[${new Date().toISOString()}] chat:message error: ${error.message}\n${error.stack}\n---\n`;
            fs.appendFileSync(logPath, logEntry);
          } catch (e) { /* ignore */ }
          socket.emit("chat:error", {
            message: error?.message || "Unable to send message right now."
          });
        }
      }
    );

    socket.on(
      "chat:typing",
      ({ conversationId, typing = true, userId, userName }) => {
        if (!conversationId) return;
        socket.to(conversationId).emit("chat:typing", {
          conversationId,
          typing,
          userId: userId || socket.id,
          userName
        });
      }
    );

    socket.on("disconnect", () => {
      Array.from(joinedConversations).forEach((conversationId) => {
        leaveConversationRoom(conversationId);
      });
    });
  });

  return io;
};
