// Notification utility - uses Firebase Cloud Messaging for push notifications

import { sendPushNotification } from "./firebase-admin.js";
import { sendSocketNotification } from "./socket-manager.js";

// Send a notification to a specific user via Firebase Push AND Socket.io
export const sendNotificationToUser = async (userId, notification) => {
  if (!userId) {
    console.log(`[NotificationUtil] ❌ Cannot send - no userId provided`);
    return false;
  }

  console.log(`[NotificationUtil] 📤 Sending notification to user: ${userId}`);
  console.log(`[NotificationUtil] 📦 Payload:`, { type: notification.type, title: notification.title });

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


