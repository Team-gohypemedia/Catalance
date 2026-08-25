import { sendSocketNotification } from "./socket-manager.js";
import { prisma } from "./prisma.js";
import { sendEmail } from "./email-service.js";
import { sendWhatsappNotification } from "./whatsapp.js";

let sendPushNotificationImpl = null;

const getSendPushNotification = async () => {
  if (sendPushNotificationImpl) {
    return sendPushNotificationImpl;
  }

  const firebaseAdmin = await import("./firebase-admin.js");
  sendPushNotificationImpl = firebaseAdmin.sendPushNotification;
  return sendPushNotificationImpl;
};

const normalizeAudience = (value) => {
  const normalized = String(value || "").trim().toLowerCase();

  if (!normalized) return null;
  if (["client", "owner", "customer"].includes(normalized)) return "client";
  if (["freelancer", "contractor"].includes(normalized)) return "freelancer";

  return null;
};

const inferChatAudience = (recipientUserId, notification) => {
  const service = String(notification?.data?.service || "");
  const parts = service.split(":");

  if (parts[0] !== "CHAT" || parts.length < 4) {
    return null;
  }

  const clientId = String(parts[2] || "");
  const freelancerId = String(parts[3] || "");
  const normalizedRecipientId = String(recipientUserId || "");

  if (normalizedRecipientId && normalizedRecipientId === clientId) {
    return "client";
  }

  if (normalizedRecipientId && normalizedRecipientId === freelancerId) {
    return "freelancer";
  }

  return null;
};

const enrichNotificationPayload = (recipientUserId, notification = {}) => {
  const explicitAudience =
    normalizeAudience(notification?.audience) ||
    normalizeAudience(notification?.data?.audience);

  const inferredAudience =
    explicitAudience ||
    (String(notification?.type || "").trim().toLowerCase() === "chat"
      ? inferChatAudience(recipientUserId, notification)
      : null);

  const data = inferredAudience
    ? { ...(notification.data || {}), audience: inferredAudience }
    : notification.data || {};

  return {
    ...notification,
    audience: inferredAudience,
    data,
  };
};

const resolveNotificationRedirectUrl = (notification = {}) => {
  const explicitLink = notification?.data?.link || notification?.data?.profileUrl || notification?.link;
  if (explicitLink) {
    return explicitLink;
  }

  const type = String(notification?.type || "").toLowerCase();
  const data = notification?.data || {};
  const audience = notification?.audience || data?.audience;

  // Chat Notifications -> redirect to Chat page
  if (type === "chat" || type.includes("chat") || String(data?.service || "").startsWith("CHAT")) {
    if (data?.conversationId || data?.chatId) {
      return `messages?chat=${data.conversationId || data.chatId}`;
    }
    return "messages";
  }

  // Proposal Notifications -> redirect to Proposal page
  if (type.includes("proposal") || data?.proposalId) {
    if (audience === "client") {
      return data?.proposalId ? `client/proposals?id=${data.proposalId}` : "client/proposals";
    }
    return data?.proposalId ? `freelancer/proposals?id=${data.proposalId}` : "freelancer/proposals";
  }

  // Project Notifications -> redirect to Project page
  if (type.includes("project") || data?.projectId) {
    if (data?.projectId) {
      return `projects/${data.projectId}`;
    }
    return audience === "client" ? "client/projects" : "freelancer/projects";
  }

  // Profile Notifications -> redirect to Profile page
  if (type === "profile_completion_reminder" || type.includes("profile")) {
    return "freelancer/profile";
  }

  return "dashboard";
};

// Send a notification to a specific user via DB, Firebase Push, Socket.io AND WhatsApp!
export const sendNotificationToUser = async (userId, notification, shouldEmail = true) => {
  if (!userId) {
    console.log(`[NotificationUtil] ❌ Cannot send - no userId provided`);
    return false;
  }

  const notificationPayload = enrichNotificationPayload(userId, notification);

  // Fetch user to get email, phone number, and name
  let user = null;
  try {
      user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, fullName: true, phoneNumber: true, phone: true }
      });
  } catch (e) {
      console.warn(`[NotificationUtil] Failed to fetch user ${userId} details`);
  }

  console.log(`[NotificationUtil] 📤 Sending to user: ${userId} (${user?.email})`);
  console.log(`[NotificationUtil] 📦 Payload:`, {
    type: notificationPayload.type,
    title: notificationPayload.title,
    audience: notificationPayload.audience,
  });

  // 1. Persist to Database
  let dbNotification = null;
  try {
    dbNotification = await prisma.notification.create({
      data: {
        userId,
        type: notificationPayload.type || "general",
        title: notificationPayload.title,
        message: notificationPayload.message || notificationPayload.body || "",
        data: notificationPayload.data || {},
        read: false
      }
    });
    console.log(`[NotificationUtil] 💾 Saved to DB: ${dbNotification.id}`);
    
    // Enrich notification with DB ID
    notificationPayload.id = dbNotification.id;
    notificationPayload.createdAt = dbNotification.createdAt;
  } catch (dbError) {
    console.error(`[NotificationUtil] ⚠️ Failed to save to DB:`, dbError);
  }

  // 2. Send via Email (if user found and enabled)
  if (shouldEmail && user?.email) {
    console.log(`[NotificationUtil] 📧 Attempting to send email to: ${user.email}`);
    try {
      const emailSent = await sendEmail({
        to: user.email,
        subject: notificationPayload.title || "New Notification - Catalance",
        title: notificationPayload.title,
        text:
          notificationPayload.message ||
          notificationPayload.body ||
          "You have a new notification."
      });
      if (emailSent) {
        console.log(`[NotificationUtil] ✅ Email sent successfully to: ${user.email}`);
      } else {
        console.log(`[NotificationUtil] ⚠️ Email not sent to: ${user.email} (check Resend config)`);
      }
    } catch (emailError) {
      console.error(`[NotificationUtil] ❌ Email failed:`, emailError);
    }
  } else {
    console.log(`[NotificationUtil] ℹ️ Email skipped - shouldEmail: ${shouldEmail}, email: ${user?.email || 'none'}`);
  }

  // 3. Send via WhatsApp (if user has phone number)
  const userPhone = user?.phoneNumber || user?.phone;
  if (userPhone) {
    try {
      const redirectLink = resolveNotificationRedirectUrl(notificationPayload);
      console.log(`[NotificationUtil] 📲 Sending WhatsApp notification to: ${userPhone} with link: ${redirectLink}`);
      sendWhatsappNotification({
        to: userPhone,
        userName: user.fullName || "User",
        title: notificationPayload.title || "Update",
        message: notificationPayload.message || notificationPayload.body || "New update available",
        link: redirectLink
      }).catch((waErr) => console.error(`[NotificationUtil] ⚠️ WhatsApp error:`, waErr));
    } catch (waErr) {
      console.error(`[NotificationUtil] ⚠️ WhatsApp dispatch error:`, waErr);
    }
  }

  // 4. Send via Socket.io
  let sentViaSocket = false;
  try {
    sentViaSocket = sendSocketNotification(userId, notificationPayload);
    if (sentViaSocket) {
      console.log(`[NotificationUtil] ✅ Socket sent`);
    } else {
      console.log(`[NotificationUtil] ℹ️ Socket skipped (offline)`);
    }
  } catch (err) {
    console.error(`[NotificationUtil] ⚠️ Socket error:`, err);
  }

  // 5. Send via Firebase Cloud Messaging
  try {
    const sendPushNotification = await getSendPushNotification();
    const pushResult = await sendPushNotification(userId, notificationPayload);
    if (pushResult.success) {
      console.log(`[NotificationUtil] ✅ Push sent`);
      return true;
    } else {
      console.log(`[NotificationUtil] ⚠️ Push not sent:`, pushResult.reason || pushResult.error);
      return sentViaSocket; 
    }
  } catch (error) {
    console.error(`[NotificationUtil] ❌ Push failed:`, error.message);
    return sentViaSocket;
  }
};



