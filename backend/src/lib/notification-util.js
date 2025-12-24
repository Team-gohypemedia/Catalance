import { sendPushNotification } from "./firebase-admin.js";
import { sendSocketNotification } from "./socket-manager.js";
import { prisma } from "./prisma.js";

// Send a notification to a specific user via DB, Firebase Push AND Socket.io
export const sendNotificationToUser = async (userId, notification) => {
  if (!userId) {
    console.log(`[NotificationUtil] ❌ Cannot send - no userId provided`);
    return false;
  }

  console.log(`[NotificationUtil] 📤 Sending notification to user: ${userId}`);
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
    console.log(`[NotificationUtil] 💾 Notification saved to DB with ID: ${dbNotification.id}`);
    
    // Enrich notification with DB ID
    notification.id = dbNotification.id;
    notification.createdAt = dbNotification.createdAt;
  } catch (dbError) {
    console.error(`[NotificationUtil] ⚠️ Failed to save notification to DB:`, dbError);
  }

  // 2. Send via Socket.io
  let sentViaSocket = false;
  try {
    sentViaSocket = sendSocketNotification(userId, notification);
    if (sentViaSocket) {
      console.log(`[NotificationUtil] ✅ Socket notification sent to user ${userId}`);
    } else {
      console.log(`[NotificationUtil] ℹ️ Socket notification skipped (user offline or socket not init)`);
    }
  } catch (err) {
    console.error(`[NotificationUtil] ⚠️ Socket notification error:`, err);
  }

  // 3. Send via Firebase Cloud Messaging
  try {
    const pushResult = await sendPushNotification(userId, notification);
    if (pushResult.success) {
      console.log(`[NotificationUtil] ✅ Push notification sent to user ${userId}`);
      return true;
    } else {
      console.log(`[NotificationUtil] ⚠️ Push notification not sent:`, pushResult.reason || pushResult.error);
      return sentViaSocket; // Return true if at least socket worked
    }
  } catch (error) {
    console.error(`[NotificationUtil] ❌ Push notification failed:`, error.message);
    return sentViaSocket;
  }
};


