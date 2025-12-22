// Notification utility - uses Firebase Cloud Messaging for push notifications

import { sendPushNotification } from "./firebase-admin.js";

// Send a notification to a specific user via Firebase Push
export const sendNotificationToUser = async (userId, notification) => {
  if (!userId) {
    console.log(`[NotificationUtil] ❌ Cannot send - no userId provided`);
    return false;
  }

  console.log(`[NotificationUtil] 📤 Sending push notification to user: ${userId}`);
  console.log(`[NotificationUtil] � Payload:`, { type: notification.type, title: notification.title });

  try {
    const pushResult = await sendPushNotification(userId, notification);
    if (pushResult.success) {
      console.log(`[NotificationUtil] ✅ Push notification sent to user ${userId}`);
      return true;
    } else {
      console.log(`[NotificationUtil] ⚠️ Push notification not sent:`, pushResult.reason || pushResult.error);
      return false;
    }
  } catch (error) {
    console.error(`[NotificationUtil] ❌ Push notification failed:`, error.message);
    return false;
  }
};


