import admin from "firebase-admin";
import { prisma } from "./prisma.js";

// Initialize Firebase Admin SDK
// For production, set GOOGLE_APPLICATION_CREDENTIALS environment variable 
// pointing to your service account JSON file
// For development, we initialize without a service account (works for token verification)

let firebaseApp;

try {
  // Check if already initialized
  firebaseApp = admin.app();
} catch (error) {
  // Initialize with project config from environment variables
  // For FCM to work, you need proper credentials
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : null;

  if (serviceAccount) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || "catalance-4dc1b"
    });
    console.log("[Firebase Admin] Initialized with service account");
  } else {
    firebaseApp = admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || "catalance-4dc1b"
    });
    console.log("[Firebase Admin] Initialized without service account (FCM won't work)");
  }
}

export const verifyFirebaseToken = async (idToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.email?.split("@")[0],
      picture: decodedToken.picture,
      emailVerified: decodedToken.email_verified
    };
  } catch (error) {
    console.error("Firebase token verification error:", error);
    throw new Error("Invalid or expired Firebase token");
  }
};

// Send push notification to a user by their userId
export const sendPushNotification = async (userId, notification) => {
  try {
    // Get user's FCM token from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true, fullName: true }
    });

    if (!user?.fcmToken) {
      console.log(`[Firebase Admin] No FCM token for user ${userId}`);
      return { success: false, reason: "no_token" };
    }

    const message = {
      token: user.fcmToken,
      notification: {
        title: notification.title,
        body: notification.message || notification.body
      },
      data: {
        type: notification.type || "general",
        ...(notification.data || {})
      },
      webpush: {
        notification: {
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          requireInteraction: true
        },
        fcmOptions: {
          link: notification.link || "/"
        }
      }
    };

    const response = await admin.messaging().send(message);
    console.log(`[Firebase Admin] ✅ Push notification sent to ${user.fullName}:`, response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error(`[Firebase Admin] ❌ Failed to send push notification to user ${userId}:`, error);
    
    // If token is invalid, remove it from database
    if (error.code === "messaging/invalid-registration-token" || 
        error.code === "messaging/registration-token-not-registered") {
      await prisma.user.update({
        where: { id: userId },
        data: { fcmToken: null }
      });
      console.log(`[Firebase Admin] Removed invalid FCM token for user ${userId}`);
    }
    
    return { success: false, error: error.message };
  }
};

// Send push notification to multiple users
export const sendPushNotificationToMany = async (userIds, notification) => {
  const results = await Promise.all(
    userIds.map(userId => sendPushNotification(userId, notification))
  );
  return results;
};

export { firebaseApp };

