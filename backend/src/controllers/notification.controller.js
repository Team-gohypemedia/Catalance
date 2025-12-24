import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50 // Limit to last 50
  });

  // Calculate unread counts
  const unreadCount = notifications.filter(n => !n.read).length;
  const chatUnreadCount = notifications.filter(n => !n.read && n.type === "chat").length;
  const proposalUnreadCount = notifications.filter(n => !n.read && n.type === "proposal").length;

  res.status(200).json({
    status: "success",
    data: {
      notifications,
      unreadCount,
      chatUnreadCount,
      proposalUnreadCount
    }
  });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const notification = await prisma.notification.findUnique({
    where: { id }
  });

  if (!notification || notification.userId !== userId) {
    throw new AppError("Notification not found", 404);
  }

  await prisma.notification.update({
    where: { id },
    data: { read: true }
  });

  res.status(200).json({ status: "success" });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true }
  });

  res.status(200).json({ status: "success" });
});
