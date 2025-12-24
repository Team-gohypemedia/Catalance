import { sendPushNotification } from "./firebase-admin.js";
import { sendSocketNotification } from "./socket-manager.js";
import { prisma } from "./prisma.js";

import { sendEmail } from "./email-service.js";

// Send a notification to a specific user via DB, Firebase Push AND Socket.io
export const sendNotificationToUser = async (userId, notification, shouldEmail = true) => {
  if (!userId) {
    console.log(`[NotificationUtil] ❌ Cannot send - no userId provided`);
    return false;
  }

  // Fetch user to get email and settings
  let user = null;
  try {
      user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, fullName: true }
      });
  } catch (e) {
      console.warn(`[NotificationUtil] Failed to fetch user ${userId} for email`);
  }

  console.log(`[NotificationUtil] 📤 Sending to user: ${userId} (${user?.email})`);
  console.log(`[NotificationUtil] 📦 Payload:`, { type: notification.type, title: notification.title });

  // 1. Persist to Database
  let dbNotification = null;
  try {
    dbNotification = await prisma.notification.create({
      data: {
        userId,
        type: notification.type || "general",
        title: notification.title,
        message: notification.message || notification.body || "",
        data: notification.data || {},
        read: false
      }
    });
    console.log(`[NotificationUtil] 💾 Saved to DB: ${dbNotification.id}`);
    
    // Enrich notification with DB ID
    notification.id = dbNotification.id;
    notification.createdAt = dbNotification.createdAt;
  } catch (dbError) {
    console.error(`[NotificationUtil] ⚠️ Failed to save to DB:`, dbError);
  }

  // 2. Send via Email (if user found and enabled)
  if (shouldEmail && user?.email) {
      // Don't await email to prevent blocking response
      sendEmail({
          to: user.email,
          subject: notification.title || "New Notification - Catalance",
          title: notification.title,
          text: notification.message || notification.body || "You have a new notification."
      });
  }

  // 3. Send via Socket.io
  let sentViaSocket = false;
  try {
    sentViaSocket = sendSocketNotification(userId, notification);
    if (sentViaSocket) {
      console.log(`[NotificationUtil] ✅ Socket sent`);
    } else {
      console.log(`[NotificationUtil] ℹ️ Socket skipped (offline)`);
    }
  } catch (err) {
    console.error(`[NotificationUtil] ⚠️ Socket error:`, err);
  }

  // 4. Send via Firebase Cloud Messaging
  try {
    const pushResult = await sendPushNotification(userId, notification);
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


