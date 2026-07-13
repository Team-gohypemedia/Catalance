import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { sendNotificationToUser } from "../lib/notification-util.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.sub;

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const chatUnreadCount = notifications.filter((n) => !n.read && n.type === "chat").length;
  const proposalUnreadCount = notifications.filter((n) => !n.read && n.type === "proposal").length;

  res.status(200).json({
    status: "success",
    data: {
      notifications,
      unreadCount,
      chatUnreadCount,
      proposalUnreadCount,
    },
  });
});

export const createMarketplaceRequestNotifications = asyncHandler(async (req, res) => {
  const clientId = req.user.sub;
  const {
    freelancerId,
    serviceId = null,
    serviceTitle = "Marketplace Request",
    serviceType = "Marketplace Request",
    requestMessage = "",
    clientName = "",
    clientAvatar = "",
    clientBusinessName = "",
    freelancerName = "",
    freelancerAvatar = "",
  } = req.body || {};

  const normalizedFreelancerId = String(freelancerId || "").trim();
  const normalizedMessage = String(requestMessage || "").trim();
  const normalizedServiceTitle = String(serviceTitle || "").trim() || "Marketplace Request";
  const normalizedServiceType = String(serviceType || "").trim() || normalizedServiceTitle;

  if (!normalizedFreelancerId) {
    throw new AppError("freelancerId is required", 400);
  }

  if (!normalizedMessage) {
    throw new AppError("requestMessage is required", 400);
  }

  const [client, freelancer] = await Promise.all([
    prisma.user.findUnique({
      where: { id: clientId },
      select: { id: true, fullName: true, avatar: true },
    }),
    prisma.user.findUnique({
      where: { id: normalizedFreelancerId },
      select: { id: true, fullName: true, avatar: true },
    }),
  ]);

  if (!freelancer) {
    throw new AppError("Freelancer not found", 404);
  }

  const requestId = [
    "marketplace",
    clientId,
    normalizedFreelancerId,
    serviceId || normalizedServiceTitle,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(":") || randomUUID();

  const existingRequestNotifications = await prisma.notification.findMany({
    where: {
      type: "marketplace_request",
      userId: {
        in: [clientId, normalizedFreelancerId],
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const existingRequestNotification = existingRequestNotifications.find((notification) => {
    const data = notification?.data || {};
    return String(data?.requestId || "").trim() === requestId;
  });

  if (existingRequestNotification) {
    const existingData = existingRequestNotification.data || {};
    const existingStatus = String(
      existingData.requestStatus || existingRequestNotification.status || "pending",
    )
      .trim()
      .toLowerCase();
    const request = {
      requestId,
      requestSource: existingData.requestSource || "marketplace",
      requestStatus: existingStatus,
      audience: existingData.audience || "freelancer",
      recipientRole: existingData.recipientRole || "freelancer",
      clientId: existingData.clientId || clientId,
      clientName: existingData.clientName || client?.fullName || clientName || "Client",
      clientAvatar: existingData.clientAvatar || client?.avatar || clientAvatar || "",
      clientBusinessName: existingData.clientBusinessName || clientBusinessName,
      freelancerId: existingData.freelancerId || normalizedFreelancerId,
      freelancerName: existingData.freelancerName || freelancer?.fullName || freelancerName || "Freelancer",
      freelancerAvatar: existingData.freelancerAvatar || freelancer?.avatar || freelancerAvatar || "",
      serviceId: existingData.serviceId ?? serviceId,
      serviceTitle: existingData.serviceTitle || normalizedServiceTitle,
      serviceType: existingData.serviceType || normalizedServiceType,
      requestMessage: normalizedMessage,
      previewText: normalizedMessage,
    };

    if (existingStatus === "declined") {
      const revivedRequest = {
        ...request,
        requestStatus: "pending",
        updatedAt: new Date().toISOString(),
      };

      const revivedNotifications = await prisma.$transaction(
        existingRequestNotifications.map((notification) =>
          prisma.notification.update({
            where: { id: notification.id },
            data: {
              read: false,
              title:
                notification.userId === clientId
                  ? `Request sent to ${revivedRequest.freelancerName}`
                  : `New request from ${revivedRequest.clientName}`,
              message: normalizedMessage,
              data: revivedRequest,
            },
          }),
        ),
      );

      return res.status(200).json({
        status: "success",
        data: {
          requestId,
          request: revivedRequest,
          revived: true,
          notifications: revivedNotifications,
        },
      });
    }

    if (existingStatus === "accepted") {
      const resentRequest = {
        ...request,
        requestStatus: "pending",
        updatedAt: new Date().toISOString(),
      };

      const resentNotifications = await prisma.$transaction(
        existingRequestNotifications.map((notification) =>
          prisma.notification.update({
            where: { id: notification.id },
            data: {
              read: false,
              title:
                notification.userId === clientId
                  ? `Request sent to ${resentRequest.freelancerName}`
                  : `New request from ${resentRequest.clientName}`,
              message: normalizedMessage,
              data: resentRequest,
            },
          }),
        ),
      );

      return res.status(200).json({
        status: "success",
        data: {
          requestId,
          request: resentRequest,
          resent: true,
          notifications: resentNotifications,
        },
      });
    }

    return res.status(200).json({
      status: "success",
      data: {
        requestId,
        request,
        duplicate: true,
      },
    });
  }

  const requestData = {
    requestId,
    requestSource: "marketplace",
    requestStatus: "pending",
    audience: "freelancer",
    recipientRole: "freelancer",
    clientId,
    clientName: client?.fullName || clientName || "Client",
    clientAvatar: client?.avatar || clientAvatar || "",
    clientBusinessName,
    freelancerId: normalizedFreelancerId,
    freelancerName: freelancer?.fullName || freelancerName || "Freelancer",
    freelancerAvatar: freelancer?.avatar || freelancerAvatar || "",
    serviceId,
    serviceTitle: normalizedServiceTitle,
    serviceType: normalizedServiceType,
    requestMessage: normalizedMessage,
    previewText: normalizedMessage,
  };

  const freelancerNotification = {
    type: "marketplace_request",
    title: `New request from ${requestData.clientName}`,
    message: normalizedMessage,
    audience: "freelancer",
    data: requestData,
  };

  const clientNotification = {
    type: "marketplace_request",
    title: `Request sent to ${requestData.freelancerName}`,
    message: normalizedMessage,
    audience: "client",
    data: {
      ...requestData,
      audience: "client",
      recipientRole: "client",
    },
  };

  await Promise.all([
    sendNotificationToUser(normalizedFreelancerId, freelancerNotification, false),
    sendNotificationToUser(clientId, clientNotification, false),
  ]);

  res.status(201).json({
    status: "success",
    data: {
      requestId,
      request: requestData,
    },
  });
});

export const updateMarketplaceRequestStatus = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const requestId = String(req.params.requestId || "").trim();
  const status = String(req.body?.status || "").trim().toLowerCase();

  if (!requestId) {
    throw new AppError("requestId is required", 400);
  }

  if (!["accepted", "declined"].includes(status)) {
    throw new AppError("status must be accepted or declined", 400);
  }

  const marketplaceNotifications = await prisma.notification.findMany({
    where: { type: "marketplace_request" },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const matchedNotifications = marketplaceNotifications.filter((notification) => {
    const data = notification?.data || {};
    return String(data?.requestId || "").trim() === requestId;
  });

  if (!matchedNotifications.length) {
    throw new AppError("Marketplace request not found", 404);
  }

  const isParticipant = matchedNotifications.some(
    (notification) => String(notification.userId || "") === String(userId),
  );

  if (!isParticipant) {
    throw new AppError("Marketplace request not found", 404);
  }

  const updatedAt = new Date().toISOString();
  const targetNotifications = matchedNotifications.filter(
    (notification) => String(notification.userId || "") === String(userId),
  );

  const notificationsToUpdate = targetNotifications.length > 0 ? targetNotifications : matchedNotifications;

  const updatedNotifications = await prisma.$transaction(
    notificationsToUpdate.map((notification) =>
      prisma.notification.update({
        where: { id: notification.id },
        data: {
          read: true,
          data: {
            ...(notification.data || {}),
            requestStatus: status,
            updatedAt,
          },
        },
      }),
    ),
  );
  if (status === "accepted") {
    const sourceData = matchedNotifications[0]?.data || {};
    const recipientId = String(sourceData.clientId || "").trim();
    const recipientName = String(sourceData.clientName || "Client").trim() || "Client";
    const freelancerName =
      String(sourceData.freelancerName || matchedNotifications[0]?.title || "Freelancer").trim() ||
      "Freelancer";
    const serviceTitle =
      String(sourceData.serviceTitle || sourceData.serviceType || "Marketplace Request").trim() ||
      "Marketplace Request";

    if (recipientId && String(recipientId) !== String(userId)) {
      await sendNotificationToUser(
        recipientId,
        {
          type: "marketplace_request_accepted",
          title: "Inquiry accepted",
          message: `${freelancerName} accepted your inquiry for "${serviceTitle}".`,
          audience: "client",
          data: {
            ...sourceData,
            requestId,
            requestStatus: "accepted",
            route: `/client/messages?requestId=${encodeURIComponent(requestId)}`,
            redirectTo: `/client/messages?requestId=${encodeURIComponent(requestId)}`,
            recipientRole: "client",
            audience: "client",
            clientId: sourceData.clientId || recipientId,
            clientName: sourceData.clientName || recipientName,
            freelancerName,
            serviceTitle,
            updatedAt,
          },
        },
        false,
      );
    }
  }
  res.status(200).json({
    status: "success",
    data: {
      requestId,
      requestStatus: status,
      notifications: updatedNotifications,
    },
  });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.sub;

  const notification = await prisma.notification.findUnique({
    where: { id },
  });

  if (!notification || notification.userId !== userId) {
    throw new AppError("Notification not found", 404);
  }

  await prisma.notification.update({
    where: { id },
    data: { read: true },
  });

  res.status(200).json({ status: "success" });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.sub;

  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });

  res.status(200).json({ status: "success" });
});

export const markByTypeAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const type = String(req.body?.type || req.query?.type || "")
    .trim()
    .toLowerCase();

  if (!type) {
    throw new AppError("Notification type is required", 400);
  }

  await prisma.notification.updateMany({
    where: { userId, type, read: false },
    data: { read: true },
  });

  res.status(200).json({ status: "success" });
});







