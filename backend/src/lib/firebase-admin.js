import admin from "firebase-admin";
import { prisma } from "./prisma.js";

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "catalance-4dc1b";

let firebaseApp = null;

const parseServiceAccount = () => {
  const rawValue = String(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "").trim();
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. Falling back without service account. ${message}`,
    );
    return null;
  }
};

const ensureFirebaseApp = () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    firebaseApp = admin.app();
    return firebaseApp;
  } catch {
    // No-op: initialize a new app below.
  }

  const serviceAccount = parseServiceAccount();

  try {
    firebaseApp = serviceAccount
      ? admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: FIREBASE_PROJECT_ID,
        })
      : admin.initializeApp({
          projectId: FIREBASE_PROJECT_ID,
        });

    console.log(
      serviceAccount
        ? "[Firebase Admin] Initialized with service account"
        : "[Firebase Admin] Initialized without service account (FCM may be unavailable)",
    );

    return firebaseApp;
  } catch (error) {
    console.error("[Firebase Admin] Initialization failed:", error);
    return null;
  }
};

export const verifyFirebaseToken = async (idToken) => {
  const app = ensureFirebaseApp();
  if (!app) {
    throw new Error("Firebase Admin is not configured on the server");
  }

  try {
    const decodedToken = await admin.auth(app).verifyIdToken(idToken);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.email?.split("@")[0],
      picture: decodedToken.picture,
      emailVerified: decodedToken.email_verified,
    };
  } catch (error) {
    console.error("Firebase token verification error:", error);
    throw new Error("Invalid or expired Firebase token");
  }
};

export const sendPushNotification = async (userId, notification) => {
  const app = ensureFirebaseApp();
  if (!app) {
    return { success: false, reason: "firebase_unavailable" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true, fullName: true, email: true },
    });

    if (!user?.fcmToken) {
      console.log(
        `[Firebase Admin] No FCM token for user ${userId} (${user?.email || "unknown email"})`,
      );
      return { success: false, reason: "no_token" };
    }

    console.log(
      `[Firebase Admin] Found FCM token for ${user.email}: ${user.fcmToken.substring(0, 10)}...`,
    );

    const message = {
      token: user.fcmToken,
      notification: {
        title: notification.title,
        body: notification.message || notification.body,
      },
      data: {
        type: notification.type || "general",
        ...(notification.data || {}),
      },
      webpush: {
        notification: {
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          requireInteraction: true,
        },
        fcmOptions: {
          link: notification.link || "/",
        },
      },
    };

    console.log(`[Firebase Admin] Attempting to send message to ${userId}...`);
    const response = await admin.messaging(app).send(message);
    console.log("[Firebase Admin] Push notification sent successfully. Message ID:", response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error(`[Firebase Admin] Error sending to user ${userId}:`, error);
    if (error.code) console.error(`[Firebase Admin] Error Code: ${error.code}`);

    if (
      error.code === "messaging/invalid-registration-token" ||
      error.code === "messaging/registration-token-not-registered"
    ) {
      await prisma.user.update({
        where: { id: userId },
        data: { fcmToken: null },
      });
      console.log(`[Firebase Admin] Removed invalid FCM token for user ${userId}`);
    }

    return { success: false, error: error.message };
  }
};

export const sendPushNotificationToMany = async (userIds, notification) => {
  const results = await Promise.all(
    userIds.map((userId) => sendPushNotification(userId, notification)),
  );
  return results;
};

export { firebaseApp };
